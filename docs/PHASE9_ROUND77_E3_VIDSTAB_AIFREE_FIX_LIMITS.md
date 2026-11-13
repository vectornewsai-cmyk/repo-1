# LIMITS — Phase 9 đợt 77 E3: Sửa "ai free" vidstab SEGFAULT (nợ đợt 76 §4.3)

Luồng E3 — đóng nợ lớn nhất của đợt 76 (§4.3): sau khi D3 trả lời "ai
free" (ffmpeg CLI free decoder context lúc drain trong khi filter graph
chưa xử lý xong frame 148), luồng này thử sửa theo hướng đã định — giữ
decoder context sống tới khi filter graph xử lý xong frame cuối — và đo
tỉ lệ crash bằng stress xen kẽ dưới tải nhân tạo.
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round77-e3.md`.
Harness: `server/render/src/test_round77_e3_vidstab_aifree.js` (hunt) +
`server/render/src/test_round77_e3_aifree_smoke.js` (smoke 8/8 PASS).
Môi trường: ffmpeg 8.1.2 (Ubuntu 7:8.1.2-2ubuntu2+hatch3,
`--enable-libvidstab --enable-libx264`), libvidstab 1.1.0,
libavfilter.so.11, VM 8 GB, không GPU, gcc 13.3, 4 CPU (cell chia sẻ
1,5 CPU). Ngày: 10/11/2026 (lượt cron 03:35 +07).
Clip + .trf dùng chung: `shakynoisy1080.mp4` (sha `5cf533f5bcd9…`) +
`detect-shaky1080-5s.trf` (X8); 720p/360p downscale + .trf riêng từ B7.
Ground truth sha framemd5: `d960996868d3…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Sửa vòng đời decoder từ CLI | **KHÔNG KHẢ THI — đã chứng minh bằng source (§2).** `avcodec_free_context` nằm ở cuối `decoder_thread` của ffmpeg CLI, không có option nào hoãn nó tới sau khi filter drain. Mọi fix ở tầng CLI chỉ có thể né race, không sửa gốc rễ vòng đời decoder. |
| SPLIT (ứng viên CLI, §3.1) | **CHƯA CHỨNG MINH ĐƯỢC — stress không đủ power (§1).** NOCOPY 1/15 crash vs SPLIT 0/15 crash (Fisher p=1,0); tính cả sha-lệch thì 2/15 vs 0/15 (p=0,48) — đều không có ý nghĩa thống kê. SPLIT cho sha ổn định tuyệt đối (15/15 khớp ground truth ở 1080p; 6/6 giống nhau ở cả 720p và 360p, trong khi NOCOPY của B7 cho 10/10 sha khác nhau ở 720p) — gợi ý đúng hướng nhưng so sánh này khác cửa sổ và thiếu control NOCOPY cùng cửa sổ ở kích thước nhỏ, nên chỉ ghi là gợi ý, không phải bằng chứng. |
| Crash bắt được | **1 mẫu (A-r14) — lần đầu có regs cho vòng lặp XUÔI, khớp đúng dự đoán B7 §2.4: fault−RDI = +0 (store đầu tiên của vòng xuôi), đích đã unmap toàn bộ trước khi copy (§1.2).** Stack trùng 8/8 offset với Z6/A2/B7. |
| NEEDS_WRITABLE | **Đính chính B7 §3.2 (§3.2):** flag CÓ chạm được race (copy frame 0..147 → `td->src` được cấp ngay từ frame 0) — suy luận từ source, CHƯA đo thực nghiệm; cần build ffmpeg riêng + stress lại mới kết luận. |
| Thí nghiệm phụ F | **7/10 crash (Fisher vs A p=0,0017) — tỉ lệ crash nhạy với SETUP (tracker malloc-hook + showinfo + -v info), không chỉ với tải (§1.3).** 7/7 crash lastFrame=147, 7/7 RDI khớp FREE decoder-Y sau khi sửa cách khớp (+0x40). Đây là phát hiện phương pháp quan trọng nhất của luồng: hunt sau muốn đo tỉ lệ crash phải dùng setup D3, và SPLIT phải được thử lại đúng setup đó mới kết luận được. |
| Sửa production | **KHÔNG.** `copy` trước vidstabtransform giữ nguyên (`enhance.js:183`). SPLIT không thay `copy` trong luồng này (chưa đủ bằng chứng + cần phẫu thuật filtergraph có label trong render.js). |
| Smoke test mới | `test_round77_e3_aifree_smoke.js` **8/8 PASS** (SPLIT/COPY sha khớp ground truth, NOCOPY chạy xong, Wilson, biên dịch preload không warning). |

## 1. Stress hunt — thiết kế và kết quả

Thiết kế (harness `test_round77_e3_vidstab_aifree.js`, WORK
`~/workspace/.scratch-r77e3/runs/`, `results.jsonl` + `summary.json` +
stderr từng lần chạy; khôi phục từ results.jsonl nếu bị kill — không
cần dùng trong lượt này, hunt chạy liền 1 phiên):

- 3 hog CPU (`yes`) chạy suốt hunt để tạo cửa sổ crash-prone có kiểm
  soát (theo D3 §7); KHÔNG chờ máy yên (tải là chủ đích).
- A/B xen kẽ nghiêm ngặt (A1,B1,A2,B2,…) để chung cửa sổ tải; C/D/E
  chạy xen kẽ nhau sau đó. LD_PRELOAD duy nhất là handler segv của A2
  (regs + si_code + offsets + maps-window), `-v error`, `-threads 1`.
- Smoke trước hunt: SPLIT ×1 + COPY ×1 dưới preload — cả hai sha đều
  khớp ground truth `d960996868d3…`.

| Arm | Cấu hình | N | Crash | Sha (không crash) |
|---|---|---|---|---|
| A1080NOCOPY | NOCOPY 1080p t1 (baseline) | 15 | **1 (r14)** | 13× `d960996868d3…` (ground truth), 1× `dbd726843738…` (lệch, r12) |
| B1080SPLIT | SPLIT 1080p t1 (ứng viên) | 15 | **0** | 15× `d960996868d3…` |
| C1080COPY | COPY 1080p t1 (control production) | 6 | 0 | 6× `d960996868d3…` |
| D720SPLIT | SPLIT 720p t1 | 6 | 0 | 6× `397ba4e1a870…` (giống nhau hết) |
| E360SPLIT | SPLIT 360p t1 | 6 | 0 | 6× `414e114fe57c…` (giống nhau hết) |
| **Tổng** | | **48** | **1 (2,1%)** | |

### 1.1 Tỉ lệ và ý nghĩa thống kê (trung thực — không thổi phồng SPLIT)

| Số liệu | Giá trị | Wilson 95% |
|---|---|---|
| Arm A (NOCOPY 1080p) | 1/15 = 6,7% | [1,2%, 29,8%] |
| Arm B (SPLIT 1080p) | 0/15 = 0% | [0%, 20,4%] |
| B7 arm A (để đối chiếu, KHÔNG gộp — cửa sổ khác) | 2/20 = 10,0% | [2,8%, 30,1%] |
| B7 gộp A2+B7 (baseline dài hạn) | 4/105 = 3,8% | [1,5%, 9,4%] |
| D3 v2d-load (cửa sổ crash-prone nhất từng đo) | 7/16 = 43,8% | [23,1%, 66,8%] |

- **Fisher exact (cùng cửa sổ, A vs B):** crash 1/15 vs 0/15 → p=1,0;
  biểu hiện race (crash + sha-lệch) 2/15 vs 0/15 → p=0,48. **Cả hai
  đều không có ý nghĩa thống kê — hunt này KHÔNG chứng minh được SPLIT
  khử crash.** Muốn phân biệt được ở mức baseline p≈4–10% thì cần n
  lớn hơn nhiều (vd với p=6,7%, P(0/15)=35% — tức 0/15 là kết quả
  hoàn toàn thường gặp ngay cả khi SPLIT không có tác dụng gì).
- Ngược lại, **0/15 của SPLIT loại trừ được tỉ lệ kiểu D3-load
  (p≈44%)**: P(0/15 | p=43,8%) ≈ 0,02% — NHƯNG chỉ khi cửa sổ lần
  này crash-prone như cửa sổ D3, mà arm A 1/15 cho thấy nó KHÔNG phải
  vậy (khoảng tin cậy của A [1,2%, 29,8%] loại trừ 43,8%). Vì vậy
  không được dùng con số 0,02% này để claim SPLIT hiệu quả — nó chỉ
  nói cửa sổ lần này yên hơn cửa sổ D3.
- **Sha ổn định của SPLIT là tín hiệu đáng chú ý nhất, nhưng chưa
  phải bằng chứng:** B 15/15 khớp ground truth; D/E 6/6 giống nhau
  trong từng arm — trong khi B7 đo NOCOPY 720p cho 10/10 sha khác nhau
  và 360p 9/10 khác nhau (race làm lệch pixel ở mọi kích thước). Tuy
  nhiên: (a) so sánh này khác cửa sổ (B7 chạy 09/11, tải khác); (b)
  hunt này KHÔNG có arm NOCOPY 720p/360p cùng cửa sổ để đối chiếu —
  thiếu sót thiết kế, ghi nhận để hunt sau bổ sung; (c) ngay ở 1080p,
  A cũng chỉ lệch 1/15 sha, nên "SPLIT ổn định" có thể một phần là do
  cửa sổ yên. Kết luận đúng mức: **SPLIT có vẻ đi đúng hướng (cơ chế
  §3.1 + sha ổn định), nhưng chưa đủ bằng chứng để thay `copy`.**
- Thời gian chạy: 1080p 40–119s/lần dưới tải (trung vị ~75s), 720p
  ~12–21s, 360p ~3–9s; load1 trong hunt dao động 0,4–21,7. Tổng hunt
  ~1h50 (2 smoke + 48 lần).

### 1.2 Mẫu crash A-r14 — lần đầu có regs cho vòng lặp XUÔI (đóng nợ B7 §2.4)

File: `runs/A1080NOCOPY/r14.stderr` (load1 lúc crash 17,80; chạy
76,9s; SIGSEGV, size output 0).

- Stack trùng **8/8 offset** với Z6/A2/B7: `libc+0x1a1862` ←
  `vsFrameCopy+0x38` ← `vsTransformPrepare+0x116` ←
  `libavfilter+0x417eb6` ← `+0x1853b0` ←
  `av_buffersrc_add_frame_flags+0x168` ← `ffmpeg+0x25c93` ←
  `+0x39cfd`. Cùng một đường code, không phải crash mới.
- Regs: `RIP=libc+0x1a1862` (**vòng lặp XUÔI** của memcpy ERMS — như
  Z6/A2, khác 3 mẫu B7 vốn là vòng ngược `+0x1a1906`);
  `fault addr == RDI`, `fault−RDI = +0`, `si_code=MAPERR`,
  `maps: fault NOT in any mapping`. **Đây là mẫu đầu tiên có regs cho
  vòng xuôi, và nó khớp đúng dự đoán của B7 §2.4: fault ở offset ≈ 0
  (store đầu tiên của vòng xuôi), tức đích đã bị unmap toàn bộ TRƯỚC
  khi copy bắt đầu — không phải copy ghi được một đoạn rồi mới fault.**
- maps-window: lỗ unmapped 6.279.168 B = 3 chunk decoder Y kề nhau
  (2.093.056 B/chunk); RDI nằm trong lỗ, cách đầu lỗ +4.186.240 B
  (đúng 2 chunk); RSI (nguồn, buffer frame 148) vẫn mapped. RDX −
  fault = +2.073.664 (≈ 2.073.600 + 64, khớp độ dài copy plane Y +
  alignment) — nguồn và độ dài đều lành, chỉ đích đã chết. Củng cố
  giả thuyết (a) của B7 §2.3/D3 §4 ở mức mạnh nhất từ trước tới nay:
  **length không sai, đích đã munmap toàn bộ trước khi copy.**
- Thiếu sót của mẫu này (trung thực): không có showinfo nên không biết
  chắc frame lỗi có phải 148 không (suy luận từ cơ chế D3 + RDX khớp
  kích thước Y); không có FREE log kèm theo (hunt chính chỉ dùng
  handler segv, không dùng tracker v2d) nên không đối chiếu được RDI
  với một dòng FREE cụ thể như D3 — nhưng chữ ký (stack + fault==RDI
  + lỗ 3 chunk) đã đủ khớp cơ chế D3, không cần FREE log để xác định
  lại "ai free" (câu đó D3 đã trả lời bằng 7/7 khớp).

### 1.3 Thí nghiệm phụ F — NOCOPY đúng setup D3 v2d-load (tracker + showinfo)

Sau khi hunt chính kết thúc, luồng này chạy thêm thí nghiệm F
(harness `test_round77_e3_vidstab_aifree_ft.js`, WORK
`~/workspace/.scratch-r77e3/runs-ft/`, `results-ft.jsonl` +
`summary-ft.json` + stderr + free log từng lần): NOCOPY 1080p t1 ×10,
`-v info`, `showinfo` cuối chuỗi filter, `LD_PRELOAD =
free_track_v2d_preload.so:segv_backtrace_preload.so` (dùng đúng 2
binary .so D3 đã biên dịch — không biên dịch lại), 3 hog CPU riêng.
Đây là setup đã cho 7/16 crash ở D3.

**Kết quả: 7/10 crash (70,0%, Wilson [39,7%, 89,2%])** — tái hiện
đúng tỉ lệ D3 v2d-load (7/16 = 43,8%; Fisher F-vs-D3 p=0,25, nhất
quán). Tính cả sha-lệch thì biểu hiện race là 8/10 (r10 sha
`df60fe34853e…` lệch ground truth). 3 lần không crash: r3/r7 sha ground
truth, r10 sha-lệch.

| So sánh | Tỉ lệ | Fisher p | Đọc |
|---|---|---|---|
| F (tracker + showinfo) vs A (segv-only, cùng đợt) | 7/10 vs 1/15 | **0,0017** | khác biệt rất có ý nghĩa — tỉ lệ crash nhạy với setup, không chỉ với tải |
| F vs D3 v2d-load (cùng setup) | 7/10 vs 7/16 | 0,25 | nhất quán — setup D3 tái hiện được |

Phân tích 7 mẫu crash F (đối chiếu từng mẫu từ stderr + free log):

- **Tất cả đều lastFrame=147** (showinfo xác nhận: frame cuối xử lý
  xong là 147, crash khi xử lý frame 148) — khớp 100% với cơ chế D3.
- **6/7 là dạng vòng lặp NGƯỢC** (RIP `libc+0x1a1906`,
  fault−RDI=+2.073.472 = n−128 — chữ ký B7); **1/7 là dạng vòng XUÔI**
  (r2: RIP `+0x1a1862`, fault−RDI=+0 — cùng dạng với A-r14 §1.2).
  Cả hai dạng đều cùng stack 8/8 offset với Z6/A2/B7.
- **7/7 RDI khớp một dòng FREE đã log** (sau khi sửa cách khớp — xem
  dưới): đều là FREE seq=20, size 2.092.879 (buffer Y decoder),
  tid thuộc luồng decode — đúng batch teardown pool của D3 (seq 18–22).
  F tái khẳng định độc lập đáp án "ai free" của D3.
- **Lỗi khớp RDI trong script F (đã phát hiện + sửa ở tầng phân tích,
  không sửa script đang chạy):** script khớp chính xác
  (`e.addr === rdi`) nên báo r2 là `rdiFreed=0`. Kiểm tra lại bằng tay:
  RDI của r2 là `0x71a3e9105080`, còn FREE seq=20 ghi
  `0x71a3e9105040` — lệch **+0x40** (data pointer của frame = đầu chunk
  + 64 byte alignment, như D3 §4 đã ghi). 6 crash còn lại khớp chính
  xác. Cách khớp đúng là theo khoảng (`addr ≤ RDI < addr+size`); với
  cách này thì **7/7 khớp**. Lưu ý: chính D3 cũng dùng khớp chính xác
  (7/7 của họ tình cờ đều khớp chính xác) — các hunt sau nên dùng khớp
  theo khoảng để không bỏ sót mẫu kiểu r2. File free log từng lần vẫn
  còn nguyên trong `runs-ft/` để đối chiếu lại.

**Giải thích (giả thuyết, chưa tách factor):** F khác A ở 3 yếu tố
cùng lúc — (a) tracker v2d hook malloc/free, (b) `showinfo` trong
chuỗi filter, (c) `-v info` (log từng frame ra stderr). Cả ba đều làm
chậm luồng filter so với luồng decode (showinfo + log info là công
việc thêm trên luồng filter cho mỗi frame; tracker thêm overhead
malloc/free trên cả hai luồng) → decode thread tới EOF/teardown trong
khi filter vẫn đang xử lý frame 148 → cửa sổ race mở rộng. Yếu tố nào
chiếm ưu thế thì **chưa tách được** (F đổi cả 3 cùng lúc) — thí nghiệm
tách factor (vd NOCOPY + showinfo mà không tracker; tracker mà không
showinfo) để dành cho đợt sau. Dù vậy, kết luận thực hành đã rõ:
**muốn đo tỉ lệ crash có power thì phải dùng setup D3 (tracker +
showinfo), không dùng setup segv-only** — hunt chính §1 chạy setup
segv-only nên bị thiếu power, và mọi so sánh tỉ lệ crash giữa các
hunt từ nay phải ghi rõ setup (tracker/showinfo/-v) kèm theo số liệu,
không chỉ ghi tải/loadavg.

**Hệ quả trực tiếp cho SPLIT:** so sánh A-vs-B ở §1 chạy trong setup
tỉ lệ thấp nên không kết luận được. Bước tiếp theo đúng đắn là chạy
lại so sánh SPLIT-vs-NOCOPY **đúng setup F** (nơi NOCOPY crash
~44–70%): nếu SPLIT vẫn 0 crash trên ~15 lần ở đó thì mới là bằng
chứng mạnh (P(0/15 | p=44%) ≈ 0,02%). Đợt sau làm việc này, kèm
control NOCOPY 720p/360p cùng cửa sổ (thiếu sót §1.1 mục b).

## 2. Vì sao KHÔNG sửa được vòng đời decoder từ ffmpeg CLI (chứng minh bằng source)

Hướng sửa đã định trong task là "giữ decoder context sống tới khi
filter graph xử lý xong frame cuối (drain filter graph xong mới free
decoder / giữ tham chiếu decoder tới sau khi filter EOF / hoặc reorder
teardown)". Luồng này đã đối chiếu source FFmpeg n8.1.2 thật (tải từ
GitHub mirror — ffmpeg.org bị cắt giữa chừng, xem §5; chỉ giải nén 6
file đối chiếu tại `~/workspace/.scratch-r77e3/FFmpeg-n8.1.2/`) và kết
luận: **hướng này không khả thi từ phía CLI — vòng đời decoder thuộc về
luồng decode của CLI, không có option nào hoãn nó.**

- `fftools/ffmpeg_dec.c`, `decoder_thread` (dòng 916) chạy trên luồng
  scheduler riêng của CLI. Khi demuxer báo EOF, luồng decode drain
  decoder, gửi frame cuối + frame EOF-timestamp qua `sch_dec_send`
  (dòng ~1006), rồi rẽ nhánh `finish:` (dòng ~1024) gọi
  `avcodec_free_context(&dp->dec_ctx)` (dòng ~1026) — **ngay khi luồng
  decode xong việc của chính nó, không đồng bộ với luồng filter** (luồng
  filter nhận EOF riêng, `fftools/ffmpeg_filter.c` dòng 2217 gửi
  `av_buffersrc_add_frame(..., NULL)`, dòng 3328 "Filtering thread
  received EOF"). Hai luồng chỉ phối hợp qua hàng đợi scheduler; không
  có barrier nào bắt decode thread chờ filter drain xong mới free.
  Đây chính là call site khớp backtrace FREE của D3 §6
  (`avcodec_free_context` ← `ffmpeg+0x156e5`, chạy trên luồng worker
  tid≠main).
- Không có CLI option nào đổi thứ tự này: `-threads 1` chỉ tắt frame
  threading của decoder (decoder vẫn chạy trên luồng scheduler riêng và
  vẫn free ở `finish:`) — nhất quán với B7 arm A (threads 1 vẫn crash
  2/20). `-t`, `-shortest`, `-stream_loop` đều không giữ decoder sống
  qua EOF; tách transform ra tiến trình ffmpeg riêng với input rawvideo
  cũng không đổi gì (rawvideo decoder cũng dùng buffer pool và cũng bị
  free ở EOF của chính tiến trình đó — cùng hình dạng race).
- Hệ quả: mọi "fix" ở tầng CLI chỉ có thể né race bằng cách đổi đường
  đi của filter (đừng để transform alias buffer decoder rồi ghi vào nó
  sau khi pool bị teardown), chứ không thể sửa gốc rễ vòng đời decoder.
  Fix gốc rễ thuộc về: (a) patch libavfilter (NEEDS_WRITABLE — xem §3),
  (b) patch vidstab (đừng alias buffer decoder cho `td->src` — tách bản
  sao riêng), hoặc (c) viết tool dùng trực tiếp libav* API và tự giữ
  decoder context tới sau khi drain filter (cả ba đều vượt phạm vi một
  luồng CLI và cần quyết định triển khai riêng).

## 3. Hai ứng viên còn lại — phân tích từ source (chưa đo thực nghiệm thì ghi rõ)

### 3.1 SPLIT — ứng viên CLI đã stress trong luồng này (xem §1)

`split[a][b];[a]vidstabtransform=...;[b]nullsink`. Cơ chế (đọc source
`libavfilter/split.c`, hàm `activate`):

- split consume 1 frame input, rồi lặp từng output theo thứ tự:
  `buf_out = av_frame_clone(in)` rồi `ff_filter_frame(outputs[i],
  buf_out)` — **đồng bộ, ngay trong cùng call stack**; chỉ sau vòng
  lặp mới `av_frame_free(&in)`.
- Vì vậy trong lúc output 0 (vidstabtransform) xử lý frame, frame gốc
  `in` vẫn còn được split giữ → buffer của frame có ≥2 ref
  (gốc + clone) → `av_frame_is_writable(in) == false` tại transform →
  transform LUÔN đi nhánh non-direct (`vf_vidstabtransform.c` dòng 264:
  `vsTransformPrepare(td, &inframe, &outframe)`, output sang destbuf
  riêng), KHÔNG BAO GIỜ đi nhánh in-place copy vào `td->src`
  (transform.c dòng 150) — chính nhánh đã ghi vào buffer decoder frame
  147 đã bị free lúc drain.
- Giả thiết đứng được trong pipeline VCut hiện tại vì filter graph chạy
  đơn luồng (VCut không dùng `-filter_threads` /
  `-filter_complex_threads` — grep `server/render/src` không có); nếu
  một ngày bật threaded filter graph thì thứ tự đẩy đồng bộ này không
  còn được đảm bảo và SPLIT mất tác dụng — ghi rõ làm caveat.
- Lưu ý trung thực: bản thân đường đi của transform (direct hay
  non-direct) KHÔNG quan sát trực tiếp được từ filter stock (không có
  log nào in ra); bằng chứng cho SPLIT là (a) source split.c +
  `av_frame_is_writable` như trên, và (b) tỉ lệ crash đo được ở §1.
  Không claim đã "nhìn thấy" transform đi nhánh nào.

### 3.2 NEEDS_WRITABLE — đính chính B7 §3.2 (phân tích source, CHƯA đo thực nghiệm)

B7 §3.2 kết luận flag `AVFILTERPAD_FLAG_NEEDS_WRITABLE` "không chạm
được cửa sổ race" vì 3 crash đều đi đường direct (frame 148 đã
writable nên flag trả về ngay, không copy gì). **Suy luận đó thiếu một
mắt xích và luồng này đính chính lại** — dựa trên source, chưa có số đo
thực nghiệm (không claim đã chứng minh):

- `libavfilter/avfilter.c`, `filter_frame_framed` (dòng 1035): nếu pad
  đích có flag thì gọi `ff_inlink_make_frame_writable` TRƯỚC khi gọi
  `filter_frame` của filter. `ff_inlink_make_frame_writable` (dòng
  1562): trả về ngay khi frame đã writable, ngược lại copy frame sang
  buffer mới (`ff_get_video_buffer` + `av_frame_copy`).
- Điểm B7 bỏ qua: flag tác động lên MỌI frame, không chỉ frame 148.
  Ở chế độ NOCOPY, các frame 0..147 đều non-writable (decoder giữ ref
  DPB — chính D3 §2) nên flag sẽ copy chúng sang buffer mới → frame 0
  tới transform đã writable → nhánh direct → `td->src` được CẤP NGAY
  (`srcMalloced = 1`, transform.c dòng 141–145) → mọi lần copy in-place
  sau đó, KỂ CẢ frame 148 lúc drain, đều ghi vào buffer riêng của
  vidstab, không còn alias buffer decoder. Tức flag khử đúng cơ chế
  D3 — bằng cùng nguyên lý mà filter `copy` đang dùng (copy cũng làm
  frame 0 writable nên `td->src` được cấp ngay — D3 §2 đã ghi).
- Vì vậy flag là ứng viên fix gốc rễ theo đúng pattern upstream (~20
  filter in-place khác đã dùng, xem B7 §3.1), nhưng nó đòi hỏi **build
  ffmpeg riêng** (patch 1 dòng vào input pad của
  `vf_vidstabtransform.c`, hiện KHÔNG đặt flag) — tức dependency triển
  khai mới (binary tự build, cập nhật bảo mật, đồng bộ máy khác) như B7
  §3.3 đã khảo sát. Luồng này KHÔNG build (quyết định thuộc về đợt
  sau/user) và KHÔNG claim "flag khử race" khi chưa có stress hunt trên
  ffmpeg đã patch đo lại tỉ lệ crash. Giao thức thử nghiệm nếu đợt sau
  làm: build tối thiểu theo B7 §3.3, chạy lại đúng harness này (NOCOPY
  ×40 arm A) trên ffmpeg đã patch, so với baseline; chỉ kết luận khi 0
  crash trên số lần đủ lớn.

## 4. Verdict production: KHÔNG sửa code, giữ `copy`

- `enhance.js:183` (`copy` ngay trước vidstabtransform) **giữ nguyên**.
  Lý do: (1) hướng sửa vòng đời decoder không khả thi từ CLI (§2);
  (2) SPLIT chưa đủ bằng chứng (§1.1: Fisher p=1,0/0,48); (3) kể cả
  khi SPLIT được chứng minh sau này, việc thay `copy` bằng SPLIT đòi
  hỏi phẫu thuật filtergraph có label trong `render.js` (chuỗi filter
  hiện tại lắp ghép tuyến tính bằng dấu phẩy — SPLIT cần label
  `[a]/[b]` và dấu `;`, không lắp được vào `buildEnhancePreChain` như
  hiện tại) + stress lớn hơn nhiều — đó là việc của đợt riêng, không
  phải luồng này.
- Không claim "`copy` khử 100% crash": tỉ lệ thật sau sửa vẫn chỉ biết
  upper bound ~4,7–6% (Y6/Z6) — không claim mới.
- Hướng đi đã rõ cho đợt sau (theo thứ tự ưu tiên): (1) chạy lại
  SPLIT-vs-NOCOPY **đúng setup F** (tracker + showinfo, nơi NOCOPY
  crash ~44–70% — xem §1.3) với n≥15 mỗi arm + control NOCOPY 720p/
  360p cùng cửa sổ; nếu SPLIT vẫn 0 crash ở đó thì mới là bằng chứng
  mạnh; (2) nếu SPLIT đứng vững thì cân nhắc thay `copy` (kèm phẫu
  thuật filtergraph + đo lại toàn bộ parity); (3) song song, quyết định
  có build ffmpeg riêng để thử NEEDS_WRITABLE không (§3.2) — quyết định
  triển khai thuộc về user/đợt sau.
- Nợ B7 §2.4 ("chưa có mẫu crash vòng xuôi nào có regs") nay **ĐÓNG**
  bằng mẫu A-r14 (§1.2) + mẫu F-r2 (§1.3).

## 5. Giới hạn và nợ mở (trung thực)

1. Tỉ lệ crash dưới tải nhân tạo không phải tỉ lệ crash production
   (production có `copy`, 0 crash trên 78+60 lần đo trước đây — xem B7
   §1.1). Số đo ở §1 chỉ để so sánh NOCOPY vs SPLIT trong cùng cửa sổ.
2. Đường đi direct/non-direct của transform không quan sát trực tiếp
   được từ filter stock (xem §3.1 cuối).
3. NEEDS_WRITABLE: phân tích source xong (§3.2) nhưng chưa có build đã
   patch + stress đo lại — nợ vẫn mở, giao thức thử nghiệm đã ghi.
4. Fix gốc rễ vòng đời decoder (§2) không khả thi từ CLI; các hướng
   (a)/(b)/(c) ở §2 cuối đều là quyết định triển khai ngoài phạm vi
   luồng này.
5. Tải ffmpeg.org bị cắt giữa chừng (curl (18), còn 5.215.122 byte) —
   source đối chiếu lần này lấy từ GitHub mirror
   (FFmpeg-n8.1.2.tar.gz, 16.872.873 byte, tar -tzf OK); file
   ffmpeg-8.1.2.tar.xz cũ (10.103.802 byte, hỏng) đã xoá.
6. Hunt chính thiếu arm NOCOPY 720p/360p cùng cửa sổ (§1.1 mục b) và
   chạy setup segv-only thiếu power (§1.3) — cả hai đều do thiết kế
   ban đầu của luồng này; đợt sau sửa theo §1.3 cuối.
7. Script thí nghiệm F khớp RDI theo chính xác (`===`) nên báo sai
   `rdiFreed=0` cho mẫu r2 (RDI lệch +0x40 so với đầu chunk FREE);
   đã đính chính bằng khớp theo khoảng ở tầng phân tích (§1.3) — các
   hunt sau nên dùng khớp theo khoảng ngay trong script.
8. Nợ chung các đợt trước (không thuộc luồng này): TTS 39
   (gradio/pillow); birefnet 0 fps (RAM, đã chốt đóng đợt 76 D7);
   ci-security.yml/ci-build.yml vẫn 403 (repo không có CI chạy thật).

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round77_e3_vidstab_aifree.js` — harness stress
  mới (A/B xen kẽ nghiêm ngặt dưới 3 hog CPU, khôi phục từ results.jsonl).
- `server/render/src/test_round77_e3_aifree_smoke.js` — smoke test,
  **8/8 PASS**.
- `server/render/src/test_round77_e3_vidstab_aifree_ft.js` — thí nghiệm
  phụ F (NOCOPY đúng setup D3: tracker v2d + showinfo + -v info).
- `docs/PHASE9_ROUND77_E3_VIDSTAB_AIFREE_FIX_LIMITS.md` — tài liệu này.

Không stage: scratch `~/workspace/.scratch-r77e3/` (runs/, runs-ft/,
smoke/, hunt.log, hunt-ft.log, FFmpeg-n8.1.2/ source đối chiếu,
ffmpeg-n8.1.2.tar.gz), log luồng `hidden_files/round77-e3.md` (log nội
bộ, không thuộc repo). Không push — chờ user nhắn "push đi" từ main chat.
