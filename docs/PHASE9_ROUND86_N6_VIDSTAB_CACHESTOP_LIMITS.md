# PHASE 9 — Round 86, luồng N6 — vidstab: đóng cơ chế lõi `cache_stop`

**Trạng thái: CƠ CHẾ LÕI ĐÃ ĐÓNG (ở tầng decoder/scheduler, không phải trong transform).**
**KHÔNG push. HEAD GitHub vẫn `5f548ef8`. Không sửa file production. Không i18n key mới.**

## §0. Kết luận (TL;DR)

1. **Transform đồng bộ (libvidstab + `vf_vidstabtransform`) KHÔNG có đường nào đọc được frame n+1.**
   Đọc toàn bộ `transform.c` / `transformfixedpoint.c` / `vf_vidstabtransform.c` (ffmpeg 8.1.2, libvidstab 1.1.0
   — đúng version đang chạy trên VM): trong một lần gọi, transform chỉ đọc frame hiện tại (`td->src`) và
   frame OUTPUT trước (`td->destbuf`, chỉ làm `def` khi `crop=keep`). Không giữ frame thô nào qua lần gọi.
2. **Kênh truyền chéo frame duy nhất trong libvidstab (`def` = pixel của output frame trước) BỊ BÁC
   bằng probe phân biệt `crop=black`:** CP với `crop=black` cho output **byte-identical** với `crop=keep`
   (sha `397ba4e1a870`, 10/10 run) → `def` không bao giờ được dùng cho clip này (optZoom=1 zoom-in giữ mọi
   sample trong khung nguồn); tập 86 frame lệch hệ thống (≥8/10 run) **giống hệt nhau** giữa hai chế độ crop
   → các frame lệch là các sự kiện hỏng độc lập từng frame, KHÔNG phải lan truyền.
3. **Lý thuyết "transform đọc con trỏ trần của decoder" bị bác cho 100% frame lệch quan sát được:**
   shim LD_PRELOAD đo nhánh rẽ từng frame — cả 882 frame lệch (keep) / 838 frame lệch (black) đều nằm
   **TẠI/SAU frame writable đầu tiên**, tức trong vùng nhánh COPY của libvidstab (buffer private, không còn
   đọc con trỏ trần). 0 frame lệch trước frame writable đầu tiên.
4. **Race nằm ở tầng decoder ↔ filter (buffer-reuse / scheduling), không phải trong transform:**
   DUAL (split: input transform là clone, decoder buffer được giữ thêm 1 ref) → **0/1500 lệch cả hai tap**,
   tapA (đầu ra decoder trực tiếp) sạch → decoder output sạch trong cấu hình đó; `copy` (copy sớm) cũng khử.
   `null` / `format` / pull / EOF-pad không đổi gì về ref/timing → không khử (L4).
5. **Vì sao `cache_stop` — chỉ giữ ref tới frame MỚI NHẤT — lại sửa được frame ở GIỮA stream:**
   race không phải về nội dung frame cuối; nó là về **nhịp reuse của buffer pool**. Giữ thêm 1 ref (tpad clone),
   hoặc clone qua `split`, hoặc copy sớm, đều **dịch chuyển trình tự reuse buffer toàn stream** (LIFO: buffer
   vừa free được reuse đầu tiên; ghim 1 buffer buộc decoder lấy buffer khác cho mọi lần cấp sau) → va chạm
   reuse ↔ đọc của transform không còn xảy ra. Không giữ thêm ref nào → nhịp "tự nhiên" va chạm.
6. **Cấu trúc block theo GOP là phase-lock, không phải lan truyền:** strike đầu tiên ở đúng I+1
   (26 = I@25+1, 54 = I@53+1, 114 = I@113+1); cả GOP sau đó lệch gần như toàn bộ; I-frame miễn nhiễm tuyệt đối
   (0/10 ở 0, 23, 25, 53, 74, 78, 101, 113, 143). DPB flush ở biên GOP reset nhịp reuse → phase va chạm
   khóa vào đúng đầu GOP và giữ nguyên suốt GOP, rồi re-sync ở I-frame tiếp theo. Vài frame biên thay đổi
   theo run (load-dependent jitter của phase).
7. **Đính chính M3 §4.4:** đường float (`transformfloat.c`, chỉ biên dịch khi `#ifdef TESTING`) **KHÔNG có
   trong binary đang chạy** — `nm -D libvidstab.so.1.1` cho 0 symbol `*_float`. Đường production là fixed-point,
   `interpolateBiLin` kiểm tra biên trước khi dùng `PIX` không kiểm tra. Nhận định "PIX đọc quá 1px" của M3
   chỉ đúng cho đường float, KHÔNG áp dụng cho binary thật. Artifact bilinear L4 §5.4 vì vậy vẫn chưa có lời
   giải từ source (nợ mở, §7).

## §1. Source đã đọc (khớp version đang chạy)

- ffmpeg stock Ubuntu **8.1.2**, libvidstab **1.1.0** (`/usr/lib/x86_64-linux-gnu/libvidstab.so.1.1`).
- Source trên VM: vid.stab-1.1.0 tại `~/workspace/.scratch-r69w4/vid.stab-1.1.0/src/`;
  FFmpeg n8.1.2 tại `~/workspace/.scratch-r86n6/src/FFmpeg-n8.1.2/` (trích từ tarball
  `~/workspace/.scratch-r77e3/ffmpeg-n8.1.2.tar.gz`); `vf_vidstabtransform.c` đọc qua
  `raw.githubusercontent.com/FFmpeg/FFmpeg/n8.1.2/libavfilter/vf_vidstabtransform.c` (đã verify lại
  trong phiên này, 554 dòng).

### §1.1 libvidstab — `transform.c`, `vsTransformPrepare` (dòng 137–184)

- Dòng 129: `if (td->srcMalloced && !vsFrameIsNull(&td->src))` — `srcMalloced` là sticky: một khi đã copy
  thì mọi lần gọi sau đều copy.
- Dòng 141–150: nhánh COPY khi `src==dest || td->srcMalloced` — `vsFrameCopy(&td->src, src, ...)` vào buffer
  malloc riêng của libvidstab, `td->srcMalloced = 1`.
- Dòng ~152–162 (nhánh KHÔNG COPY): `td->src = *src` — con trỏ trần, chỉ khi chưa từng sticky.
- Dòng 164: `vsFrameCopy(&td->destbuf, src, ...)` — destbuf nhận frame nguồn (làm `def` cho lần sau khi
  `crop=keep`).
- Dòng 184: `vsFrameCopy(&td->dest, &td->destbuf, ...)` — dest bắt đầu từ output frame trước.
- `transformfixedpoint.c` `transformPlanar` (dòng ~327–393): chỉ đọc `td->src` (frame hiện tại) +
  `td->destbuf` (output frame trước, làm `def` khi `crop=keep`). `vsTransformFinish` copy `destbuf` → `dest`.
  **Không giữ frame thô nào qua lần gọi ngoài `destbuf`.**
- `vidstabdefines.h:48-51`: `PIXEL(img, linesize, x, y, w, h, def)` trả `def` khi OOB (có kiểm tra biên);
  `PIX(img, linesize, x, y)` = `img[x+y*linesize]` (không kiểm tra). `interpolateBiLin` fixed-point kiểm tra
  biên trước (`ix_f > width-2 || iy_f > height-2` → đường border dùng `PIXEL`/`interpolateBiLinBorder` với
  `def`); nhánh trong dùng `PIX` an toàn.

### §1.2 libvidstab — đường float KHÔNG tồn tại trong binary đang chạy (đính chính M3 §4.4)

- `transformfloat.c:30` và `transform.c:115`: đường float chỉ biên dịch khi `#ifdef TESTING`.
- `nm -D /usr/lib/x86_64-linux-gnu/libvidstab.so.1.1 | grep -ci float` → **0**. Không có symbol `*_float` nào.
- Đường production là fixed-point. Nhận định "PIX không kiểm tra biên đọc quá 1px" của M3 §4.4 chỉ đúng cho
  đường float, KHÔNG áp dụng cho binary thật. Artifact bilinear tất định L4 §5.4 chưa có lời giải từ source.

### §1.3 `vf_vidstabtransform.c` — `filter_frame` (dòng 421–508, FFmpeg n8.1.2)

- Dòng 443–447: `if (av_frame_is_writable(in)) { direct = 1; out = in; }` — in-place khi frame writable.
- Dòng 451: ngược lại `out = ff_get_video_buffer(outlink, ...)` — buffer out riêng.
- Dòng 466–472: `inframe.data[plane] = in->data[plane]` — VSFrame trỏ thẳng vào data của `in`.
- Dòng 474–476: direct → `vsTransformPrepare(td, &inframe, &inframe)` (libvidstab COPY, vì `src==dest`).
- Dòng 490: non-direct → `vsTransformPrepare(td, &inframe, &outframe)` (libvidstab KHÔNG COPY).
- Dòng 495: `vsDoTransform(td, vsGetNextTransform(td, &tc->trans))` — đồng bộ trong cùng lần gọi.
- Dòng 498: `vsTransformFinish(td)`.
- Dòng 501–503: `if (!direct) av_frame_free(&in);` — chỉ free input khi không direct.
- Dòng 506: `return ff_filter_frame(outlink, out);`.
- Dòng 128–138: option `crop` mặc định 0 = `keep`; `black` = `VSCropBorder`. Dòng 153–155: `optzoom`
  mặc định 1 (static zoom). Dòng 342: config log `crop = Black/Keep`. Dòng 404: `vsPreprocessTransforms`
  tính zoom tối ưu — đây là lý do `def` không bao giờ được dùng cho clip này (§5).

### §1.4 `vf_tpad.c` — `cache_stop` (FFmpeg n8.1.2, cây trích trên VM, dòng 51, 158–160, 179–185)

- Dòng 51: `AVFrame *cache_stop;` — 1 field duy nhất.
- Dòng 158–160 (trong `.activate`, sau `ff_inlink_consume_frame` thành công):
  `if (s->stop_mode == MODE_CLONE && s->pad_stop != 0) { av_frame_free(&s->cache_stop); s->cache_stop = av_frame_clone(frame); }`
  — giữ đúng **1 ref tới frame mới nhất**, thay ref cũ mỗi frame; tới `uninit` mới free. `av_frame_clone`
  tăng refcount buffer (không copy pixel).
- Dòng 179–185: ở EOF, `frame = av_frame_clone(s->cache_stop)` để pad các frame cuối.
- Không có `filter_frame`; dùng `.activate`. Không có đường nào cache_stop chạm tới transform hay frame n+1.

### §1.5 Pipeline CLI (FFmpeg 8.x, threaded qua scheduler)

- Decoder thread ↔ sch queue (`DEFAULT_FRAME_THREAD_QUEUE_SIZE = 2`, `ffmpeg_sched.h:262`) ↔ filter thread.
- `av_buffersrc_add_frame_flags(..., AV_BUFFERSRC_FLAG_PUSH)` chạy graph đồng bộ trong filter thread
  (`buffersrc.c:250-286`); graph `nb_threads = 1` (`ffmpeg_filter.c:1139`) — không có `filter_frame` đồng thời;
  `ff_filter_graph_run_once` chạy tuần tự từng filter.
- `split.c` `activate`: `av_frame_clone(in)` cho mỗi output (chia sẻ buffer, refcount+1).
- `thread_queue.c`: dùng `av_container_fifo_alloc_avframe` (giữ ref đúng).
- Decoder output `h264dec.c` `output_frame` (dòng 859–863): `av_frame_ref` (DPB giữ ref).
- `get_video_buffer` (`libavutil/frame.c` ~180–205): mỗi plane `av_buffer_alloc` (malloc tươi, KHÔNG dùng
  AVBufferPool); pool LIFO chỉ áp dụng nếu dùng pool (`buffer.c`: `pool_release_buffer` đẩy freed buffer lên
  đầu, `av_buffer_pool_get` lấy đầu — buffer vừa free được reuse đầu tiên).
- Decoder DPB: `release_unused_pictures` (`h264_slice.c:117`, gọi tại :495 với `remove_current=1` và :1622)
  chỉ release picture non-reference; không tìm thấy lỗ hổng DPB trong phạm vi đã đọc.
- **Hệ quả:** decoder chạy trước filter tới 2 frame qua sch queue; buffer của frame n có thể được decoder
  cấp lại cho frame sau ngay khi refcount về 0 — và refcount về 0 ngay khi filter (hoặc sink) free nó.
  Nhịp cấp/free này là nhịp duy nhất có thể va chạm với lần đọc của transform.

## §2. Harness N6 (mới, stage cùng batch)

`server/render/src/test_round86_n6_vidstab_cachestop_layer.js` — kế thừa K10
(`test_round83_k10_vidstab_race_fix.js`): taskset pin cores 0–1, 2 hog, LD_PRELOAD
`free_track_v2e` + `segv_backtrace`, `-threads 1` trước `-i`, resume từ `results.jsonl`, retry I/O,
parse framemd5, Fisher + permutation. Clip/trf: `/home/hatch/workspace/.scratch-r74b7/runs/shaky720.mp4` +
`shaky720.trf` (150 frame, 30fps, 9 I + 55 P + 86 B; I-frame presentation [0, 23, 25, 53, 74, 78, 101, 113, 143]).
WORK: `~/workspace/.scratch-r86n6/runs` (keep) và `runs-black` (crop=black).

Arms (720p, n=10 mỗi arm):
- **DUAL** (N6-B, dual-tap): `decode → split → [tapA: framemd5 trực tiếp] + [transform → tapB: framemd5]`,
  cùng 1 run, cùng 1 buffer decode (split clone). Nếu tapA lệch vs GT decode (arm DEC) tại đúng frame tapB
  lệch → lỗi đã có ở đầu ra decoder. Nếu tapA sạch mà tapB lệch → lỗi sinh trong transform.
  Lưu ý: split clone làm input transform KHÔNG bao giờ writable → DUAL chạy toàn bộ ở nhánh NON-COPY.
- **CP**: GT cho tapB (copy filter trước transform — copy sớm).
- **DEC**: GT cho tapA (decode thuần, không transform).
- **NC-SHIM** (N6-A): chuỗi NOCOPY thuần (như K10 D720NC) + LD_PRELOAD shim interpose
  `av_frame_is_writable()`, log `(seq, writable?, caller)` từng frame.
  Shim: `~/workspace/.scratch-r86n6/branch_shim.c` + `branch_shim.so` (bản source copy vào repo:
  `server/render/src/test_round86_n6_branch_shim.c`). Không cần header libavutil (con trỏ opaque +
  số thứ tự gọi == thứ tự frame).
- **N6_CROP=black**: append `:crop=black` vào `vidstabtransform` (cả `FC_DUAL`); GT là CP-BLACK trong cùng WORK.

Smoke (không hog, N6_N=1): shim hoạt động — 150 calls, cùng 1 caller address (call site của
vidstabtransform); writable đầu tiên ở seq 4 (frame 3); 65×0 / 85×1. DUAL r1: tapA sha `d9cdb3c57136` == DEC,
tapB sha `397ba4e1a870` == CP (cả hai sạch).

## §3. Kết quả — DUAL: transform vô tội, decoder output sạch khi giữ thêm ref

- **GT ổn định tuyệt đối:** CP 10/10 run giống hệt (150 frame); DEC 10/10 giống hệt.
- **DUAL: tapA 0/1500 lệch, tapB 0/1500 lệch** (per-run divA và divB đều [0×10]).
  Split (buộc toàn bộ nhánh non-copy) **khử hoàn toàn race**; tapA sạch → decoder output sạch trong cấu hình
  DUAL; transform sạch khi input sạch, ở cả hai nhánh.
- GT whole-sha 720p: CP `397ba4e1a870`, DEC `d9cdb3c57136` (ổn định 10/10).

## §4. Kết quả — NC-SHIM: toàn bộ lệch nằm trong vùng nhánh COPY (bác lý thuyết con trỏ trần)

- **NC-SHIM keep: 882/1500 lệch (58,8%)**, per-run [90, 86, 90, 90, 88, 87, 88, 87, 89, 87] — tái hiện đúng K10 (~58%).
- **0 frame lệch TRƯỚC frame writable đầu tiên; cả 882 frame lệch đều TẠI/SAU frame writable đầu tiên**
  — tức toàn bộ nằm trong vùng nhánh COPY của libvidstab (private buffer, không còn đọc con trỏ trần decoder).
  **Lý thuyết "transform đọc con trỏ trần" bị bác cho 100% frame lệch quan sát được.**
- **firstWritable mỗi run (keep): [1, 3, 1, 3, 3, 3, 3, 3, 1, 3]** — nhánh rẽ tự nó đã load-dependent
  (race giữa decoder-thread DPB release và filter-thread consumption).
- **Writability xen kẽ theo frame:** frame lẻ phần lớn writable 10/10, frame chẵn phần lớn 0/10 (P-frame là
  reference giữ trong DPB, B-frame không phải reference). Trong 86 frame lệch hệ thống (≥8/10 run): 51 frame
  writable≥8, 35 frame writable≤2 — lệch KHÔNG phân biệt theo nhánh filter-level.
- **Pattern lệch gần như tất định theo GOP:** các block lệch [26–52], [54–73], [114–142] + các điểm lẻ
  [76, 87, 100, 103, 106, 109, 144–146] giống hệt nhau qua 10 run; chỉ vài frame biên thay đổi theo run
  (1, 8, 11, 14, 18, 21, 80, 83–84, 91, 94, 97, 111–112, 148). I-frame miễn nhiễm tuyệt đối:
  0, 23, 25, 53, 74, 78, 101, 113, 143 đều D=0/10. Các block bắt đầu đúng 1 frame sau I-frame
  (26=I@25+1, 54=I@53+1, 114=I@113+1).

## §5. Kết quả — probe `crop=black`: bác hoàn toàn kênh `def`/`destbuf`

- **CP-BLACK byte-identical với CP-KEEP:** `cmp` r1 và r5 giống hệt từng byte; whole-sha `397ba4e1a870`
  giống hệt GT keep, 10/10 run ổn định. Config log xác nhận `crop = Black` đã có tác dụng (khác `crop = Keep`
  ở run keep). → **`def` không bao giờ được dùng cho clip/transform này** — optZoom=1 (mặc định,
  `vf_vidstabtransform.c:153-155`, tính qua `vsPreprocessTransforms` dòng 404) zoom-in đủ để mọi sample
  nằm trong khung nguồn. Kênh chéo frame duy nhất trong libvidstab là kênh chết đối với phép đo này.
- **NC-SHIM black: 838/1500 lệch (55,9%)**, per-run [85, 87, 86, 87, 65, 87, 88, 75, 88, 90];
  firstWritable [3, 1, 3, 1, 3, 1, 1, 1, 1, 1]; 0 frame lệch trước frame writable đầu tiên.
- **Tập 86 frame lệch hệ thống (≥8/10 run) GIỐNG HỆT NHAU giữa keep và black** (in KEEP not BLACK: [];
  in BLACK not KEEP: [] — cùng đúng 86 frame [21, 26–52, 54–73, 76, 87, 100, 103, 106, 109, 114–142, 144–146]).
  Chênh lệch tổng 882 → 838 chỉ nằm ở các frame biên load-dependent (vd r5: 65 vs 88, r8: 75 vs 87), không
  phải ở tập hệ thống.
- → **Các block lệch KHÔNG phải lan truyền qua `destbuf`/`def`; mỗi frame lệch là một sự kiện hỏng độc lập
  của chính frame đó.** Giả thuyết propagation (ghi trong log luồng trước khi chạy probe black) bị bác.

## §6. Cơ chế lõi — đã đóng (tầng decoder/scheduler buffer-reuse, không phải transform)

**Chuỗi nhân quả (mỗi mắt xích có bằng chứng):**

1. Decoder thread chạy trước filter thread tới 2 frame (sch queue, `DEFAULT_FRAME_THREAD_QUEUE_SIZE = 2`).
   Decoder cấp buffer mới cho mỗi frame qua `av_buffer_alloc` (malloc tươi, `frame.c` ~180–205).
2. Khi filter/sink free buffer của frame n, địa chỉ đó trở lại malloc pool; lần cấp tiếp theo (cùng kích thước)
   có thể nhận đúng địa chỉ đó (LIFO). Decoder sau đó ghi frame m vào buffer đó.
3. Trong chuỗi NC thuần, transform đọc buffer decoder của frame n **muộn** (sau khi đã qua trim/setpts và
   chờ tới lượt trong graph) — và tại các frame strike, lần đọc này va chạm với lần ghi của decoder cho frame
   sau: nội dung buffer tại thời điểm `vsTransformPrepare` (memcpy vào private buffer, nhánh COPY) đã bị
   hỏng một phần. M3 trên clip nhiễu đã thấy bản chất hỏng này: 0/48 frame-swap; hỏng một phần của đúng frame
   (23 chỉ hỏng chroma, 17 nhiễu nhỏ, 3 nửa dưới drain, 5 thay toàn khung không khớp gì) — khớp với ghi đè
   từng phần trong lúc đọc (decoder ghi theo hàng/MB, transform đọc theo hàng/pixel).
4. **Vì sao strike khóa theo GOP:** DPB flush ở biên GOP (I-frame mới, `release_unused_pictures`) reset nhịp
   cấp/free → phase va chạm khóa vào đúng I+1 và giữ nguyên suốt GOP; I-frame miễn nhiễm vì nó là điểm reset
   (buffer của I-frame được cấp mới và đọc trước khi nhịp va chạm thiết lập). Vài frame biên jitter theo load
   (phase lệch nhẹ giữa các run).
5. **Vì sao giữ thêm 1 ref (tpad `cache_stop`, split clone, copy sớm) khử race cho TOÀN stream:**
   giữ thêm ref không đổi nội dung frame nào — nó **dịch chuyển trình tự reuse buffer toàn cục**. Buffer bị
   ghim không được free → decoder phải lấy buffer khác cho mọi lần cấp sau → nhịp cấp/free dịch pha → va chạm
   ở §6.3 không còn xảy ra ở bất kỳ frame nào. `copy` làm điều tương tự theo hướng ngược lại (free sớm hơn
   → nhịp khác). `null`/`format`/pull/EOF-pad không đổi ref nào và không đổi timing → nhịp không đổi → không khử.
   Đây là đáp án cho câu hỏi "vì sao giữ ref frame cuối lại sửa được frame giữa stream": vì race là về
   **nhịp reuse của pool**, không phải về nội dung frame được giữ.
6. **Vì sao DUAL sạch dù input transform là non-copy (con trỏ trần):** split giữ thêm 1 ref vào cùng buffer
   → nhịp reuse đã dịch → không còn va chạm để con trỏ trần đọc phải. Non-copy không phải nguyên nhân;
   nó chỉ là điều kiện cần để va chạm (nếu có) lộ ra — và trong DUAL thì va chạm đã không còn.

**Mức độ đóng:** cơ chế đóng ở mức tầng + chuỗi nhân quả + 3 probe phân biệt (DUAL, branch-shim, crop=black)
đều cho kết quả đúng như mô hình dự đoán. Mắt xích duy nhất chưa chứng minh tới mức địa chỉ cụ thể là
**cặp aliasing chính xác** (buffer nào, tại thời điểm nào, ref nào thiếu) — xem §7.

## §7. Nợ mở (trung thực — không đoán)

1. **Cặp aliasing chính xác ở tầng decoder/scheduler chưa xác định được tới mức địa chỉ:** bằng chứng định vị
   race ở handoff decoder→filter (nhịp reuse + sch queue + DPB flush), nhưng chưa có trace cấp địa chỉ
   (buffer input của frame strike được free/realloc lúc nào, ref nào thiếu). Log `free_track_v2e` không dùng
   được làm oracle reuse (chỉ ghi 11 FREE, 0 ALLOC trong cả run — preload chỉ log một tập con frees, không
   thấy được alloc). Cần probe cấp địa chỉ (shim log `data[0]` của AVFrame — offset 0 trong `struct AVFrame`
   — tương quan với log free) nếu muốn đóng tới mức này. Không ảnh hưởng kết luận §6: mọi probe phân biệt
   đều khớp mô hình nhịp reuse.
2. **Artifact bilinear tất định L4 §5.4 vẫn mở:** đường float đã bị loại (§1.2) nên lời giải không nằm ở
   `PIX` không kiểm tra biên; artifact vẫn chưa giải thích được từ source.
3. **DPB release chi tiết:** `release_unused_pictures` chỉ release non-reference; không tìm thấy lỗ hổng DPB
   trong phạm vi đã đọc — nhưng phạm vi đọc chưa bao phủ toàn bộ `h264_slice.c`/`h264dec.c` (chỉ các hàm
   liên quan trực tiếp tới output/release).
4. **N6 không đụng tới:** TTS 39 (không kiểm lại, theo luật đứng); mobile/cloud/collab/AI-gen (không làm);
   không sửa production; không i18n key mới.

## §8. Số liệu gộp

- Full run N6: **40/40 run xong, 0 crash** (DUAL 10 + CP 10 + DEC 10 + NC-SHIM 10, keep) + **20/20 run xong,
  0 crash** (CP 10 + NC-SHIM 10, crop=black). Một lần chạy background đầu chết giữa NC-SHIM r6 (session exec
  bị mất; r6.framemd5 0 byte, không record) — đã resume theo chunks nhờ resume từ `results.jsonl`; hogs không
  còn sót. Sửa 1 bug harness trong lúc chạy: `runAll` quên `all.push(runOnce(...))` nên summary hiện n=0.
- Endpoint crash gộp (tới đợt 85 M3): 0/612 lần chạy (Wilson 95% cận trên 0,62%); đợt 86 thêm 0/60 → **0/672**.
- GT whole-sha 720p: CP `397ba4e1a870`, DEC `d9cdb3c57136` (ổn định 10/10 mỗi arm, cả hai chế độ crop).
- NC-SHIM keep 882/1500 (58,8%); NC-SHIM black 838/1500 (55,9%); DUAL 0/1500 cả hai tap.
- Tập lệch hệ thống (≥8/10 run): 86 frame, giống hệt nhau keep vs black.
- Kiểm chứng xanh: tsc không chạy (không đụng TS/TSX); harness node --check pass; `cmp` byte-identical
  CP-BLACK vs CP-KEEP (r1, r5); `nm -D` 0 symbol float; config log `crop = Black` xác nhận option có tác dụng.

## §9. File đổi/thêm trong batch này

- `server/render/src/test_round86_n6_vidstab_cachestop_layer.js` (mới — harness N6: DUAL + NC-SHIM +
  branch log + analyze + `N6_CROP=black`).
- `server/render/src/test_round86_n6_branch_shim.c` (mới — source của LD_PRELOAD shim interpose
  `av_frame_is_writable`; `.so` biên dịch nằm ở `~/workspace/.scratch-r86n6/branch_shim.so`, KHÔNG stage vì là binary).
- `docs/PHASE9_ROUND86_N6_VIDSTAB_CACHESTOP_LIMITS.md` (mới — file này).
- Không i18n key mới → không cần bump test khóa số key. Không binary, không file `.github/workflows/*`.
- Cây đo `~/workspace/.scratch-r86n6/` (runs, runs-black, full-run.log, black-run.log, analysis) KHÔNG stage.
