# LIMITS — Phase 9 đợt 70 X8: sửa production vidstab (chèn `copy` trước vidstabtransform) + đo lại spread 1080p + điều tra SEGFAULT

Luồng X8 — đóng nợ đợt 69 §4 mục 8 (sửa production theo cơ chế vidstab đã rõ
+ đo lại spread 1080p VP9; điều tra 1 lần SEGFAULT đợt 67 U1).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x8.md`.
Harness: `server/render/src/test_round70_x8_vidstab_fix.js`
(WORK `~/.scratch-r70x8/runs/`, `results.jsonl` + `summary.json`).
Môi trường: ffmpeg 8.1.2, libvidstab 1.1.0, 4 CPU, VM 8 GB, không GPU.
Mọi số dưới đây là framemd5 từng frame (khác = khác ít nhất 1 pixel 1 mức),
trừ khi ghi rõ là sha MP4 end-to-end. Load nền rất cao trong lúc đo (9 luồng
đợt 70 song song, loadavg 1-min dao động 0,5–33,8; 1 luồng X7 khác chạy
encode 8K testsrc2) nên wall time chỉ ghi kèm tham khảo — kết luận dựa vào
framemd5/sha, không dựa vào wall time.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Sửa production | **`copy` chèn ngay trước `vidstabtransform`** trong `buildEnhancePreChain` (enhance.js). Giữ nguyên `-threads 1` (đợt 67 U1) + toggle UI (đợt 68 V2) — defense in depth. |
| Spread sau sửa | **0 frame khác ở MỌI cấu hình đã đo**: 720p h264 0/150 ×3 (cả threads mặc định lẫn `-threads 1`); 1080p h264 tổng hợp 5s 0/150 ×3 (cả 2 cấu hình); 1080p VP9 footage thật (slovenska 10s) 0/250 ×3 (cả 2 cấu hình); 1080p h264 60s 0/1800 ×2 (production). |
| Baseline trước sửa (đo lại đợt này) | 720p mặc định 134–138/150 (W4 X2/X2b); 1080p 5s tổng hợp mặc định 134/150 ×2 (C0retry); VP9 `-threads 1` 241/250, 235/250 (D0 — tái lập U1 93–96%). |
| `crop=iw:ih` | **KHÔNG cứu được** (720p mặc định 133/150, 135/150) — crop toàn khung là passthrough, vẫn chia sẻ buffer decoder. Chỉ `copy` mới cứu được. |
| Output sau sửa == ground truth | framemd5 sha của bản `copy` TRÙNG sha của transform trên rawvideo (720p: 4a42bdd3… == W4 X1) và TRÙNG sha của các lần chạy `-threads 1` không crash (1080p 5s: d9609968… == U1 r1/r3 == E 19/19; VP9: D1/D2 cùng sha 820fd39e…). Tức `copy` không chỉ khử spread mà còn cho đúng output "đúng" duy nhất. |
| SEGFAULT | **TÁI HIỆN ĐƯỢC**: 1/20 lần ở pha E (đúng cấu hình đợt 67: 1080p 5s, `-threads 1`, không copy; r10, signal SIGSEGV, file rỗng) + 1 lần ở C0 baseline (threads mặc định) + 1 lần ở C0retry r1 (threads mặc định). Tổng cộng đợt này: **3 crash / 29 lần chạy baseline (không copy)**; **0 crash / 18 lần chạy có `copy`**. Crash KHÔNG gắn riêng với `-threads 1`. Chưa chứng minh được `copy` khử hẳn crash (n quá nhỏ — xem §4). |
| Hồi quy | Harness V2 **11/11 pass**; render thật 720p qua render.js: toggle TẮT và BẬT cho **cùng sha MP4** (55dd8123…, trước sửa khác nhau — V2 §2.3); dry-run xác nhận graph chứa `,copy,vidstabtransform=`; enhance/trfCache self-test xanh; `npm run test:unit` 7/7; tsc `apps/web` 0 lỗi. |

## 1. Sửa production — `copy` trước vidstabtransform

### 1.1 Thay đổi code

`server/render/src/enhance.js`, `buildEnhancePreChain` — thêm 1 dòng
`parts.push("copy")` ngay trước `vidstabtransform`, kèm comment dài ghi cơ
chế + số đo + cảnh báo đừng bỏ. Chain mới (khi chỉ có stabilize):

```
trim=start=…:end=…,setpts=PTS-STARTPTS,copy,vidstabtransform=input='…':smoothing=10:optalgo=gauss
```

Khi có cả deinterlace: `yadif=…,copy,vidstabtransform=…` (yadif vẫn trước).
Self-test thêm assert `,copy,vidstabtransform=` cho cả 2 nhánh (có/không
yadif). Không đổi gì khác: `-threads 1` (render.js, đợt 67 U1), toggle UI
+ bridge preset (đợt 68 V2), detect (giữ đa luồng, đợt 67 U1 §2) đều giữ
nguyên.

### 1.2 Vì sao `copy` cứu được mà `crop=iw:ih` không

- Cơ chế M1 (W4 §1): vidstabtransform kiểm tra `av_frame_is_writable(in)`;
  nếu writable thì warp ngay trên buffer frame của decoder (out = in),
  làm bẩn reference frame → output không xác định với decode đa luồng.
- `copy` (vf_copy) clone frame rồi gọi đồng bộ filter tiếp theo trong cùng
  call stack — khi vidstabtransform chạy, frame vẫn còn 1 reference nữa
  (giữ bởi filter copy) nên refcount ≥ 2 → `av_frame_is_writable` = false
  → transform cấp buffer output riêng, không chạm tới buffer decoder.
  (Suy luận từ hành vi đo được + mô hình push đồng bộ của filter graph;
  chưa đọc mã vf_copy.c để chứng minh tuyệt đối — nhưng bằng chứng thực
  nghiệm ở §2 là quyết định: 0 frame khác ×3 ở mọi cấu hình + sha trùng
  ground truth.)
- `crop=iw:ih`: FFmpeg tối ưu crop toàn khung thành passthrough — frame
  mới chỉ trỏ lại cùng buffer decoder (đổi data pointer, không memcpy)
  nên in-place vẫn ghi lên buffer decoder → spread còn nguyên
  (B2: 133/150, 135/150). Đây là cái bẫy: nhìn thì "copy" nhưng thực chất
  không copy.
- `split`→`nullsink` (W4 X4) cũng cứu được (0/150 ×3) nhưng cần restructure
  filterchain tuyến tính thành filter_complex có nhánh — xâm lấn hơn nhiều
  so với 1 filter `copy` chèn inline. Không dùng.

### 1.3 Chi phí của `copy`

- Pixel: pha A — `copy` 0/150 khác decode-only (giữ nguyên pixel tuyệt đối).
- Thời gian: pha A decode-only 32,7s vs `copy` 33,7s vs `crop` 33,3s trên
  cùng clip 720p 150f — chênh lệch trong nhiễu tải nền (loadavg lúc đo
  4,3–12,3), không đo được chi phí riêng của 1 lần clone frame (~3 MB
  memcpy/frame 720p, ~6 MB/frame 1080p — rẻ so với warp + encode).
- Wall time transform 60s có `copy` + threads1: 131,4s / 140,5s (F) so với
  U1 transform 60s threads1 không copy 116,9s mean — KHÔNG so được trực
  tiếp (tải nền khác nhau nhiều: F chạy lúc load 3,0–3,5; U1 lúc load
  thấp hơn; wall time nhiễu mạnh). Không claim `copy` miễn phí về wall
  time; chỉ claim chi phí CPU thêm là 1 memcpy/frame (không đáng kể so
  với warp).

## 2. Đo lại spread — bảng đầy đủ (framemd5)

Cùng `.trf` cố định mỗi clip (detect 1 lần, dùng chung mọi pha của clip đó).

| Pha | Clip / cấu hình | Kết quả |
|---|---|---|
| A | 720p pixel-identity: decode-only vs `copy` vs `crop=iw:ih` | cả 2 đều **0/150** khác decode-only |
| B1 | 720p + `copy` pre, threads mặc định ×3 | **0/150, 0/150 — XÁC ĐỊNH**, sha == X1 rawvideo ground truth (4a42bdd3…) |
| B2 | 720p + `crop=iw:ih` pre, threads mặc định ×3 | 133/150, 135/150 — KHÔNG XÁC ĐỊNH |
| B3 | 720p + `crop` + `-threads 1` ×3 | 0/150 (nhờ threads1, E4 — không phải nhờ crop) |
| B4 | 720p + `copy` + `-threads 1` ×3 (production) | **0/150, 0/150 — XÁC ĐỊNH** |
| C0 | 1080p 5s tổng hợp, baseline mặc định ×3 | **DỞ DANG: r2 SIGSEGV** (xem §3) |
| C0retry | 1080p 5s tổng hợp, baseline mặc định (chịu crash, tối đa 5 lần) | **3 ok / 1 crash**; ok: 134/150, 134/150 (frame khác đầu tiên 2, 7) |
| C1 | 1080p 5s + `copy` pre, threads mặc định ×3 | **0/150, 0/150 — XÁC ĐỊNH** |
| C2 | 1080p 5s + `copy` + `-threads 1` ×3 (production) | **0/150, 0/150 — XÁC ĐỊNH**, sha == d9609968… (== U1/E) |
| D0 | VP9 slovenska 10s, baseline `-threads 1` ×3 | 241/250, 235/250 — tái lập U1 93–96% |
| D1 | VP9 + `copy` pre, threads mặc định ×3 | **0/250, 0/250 — XÁC ĐỊNH** |
| D2 | VP9 + `copy` + `-threads 1` ×3 (production) | **0/250, 0/250 — XÁC ĐỊNH**, sha 820fd39e… cả 3 |
| F | 60s h264 + `copy` + `-threads 1` ×2 (production, clip dài) | **0/1800 — XÁC ĐỊNH** (threads1 một mình còn 8–17% ở 60s, U1/X13) |

Đọc số:
- `copy` khử hoàn toàn spread ở mọi cấu hình đã đo, KỂ CẢ với threads mặc
  định (B1/C1/D1) — tức fix không phụ thuộc vào `-threads 1`. Cờ threads1
  giữ lại làm lớp phòng thủ thứ hai (defense in depth) + vì đã có toggle
  UI, không lý do gì để bỏ.
- VP9 là chiến thắng lớn nhất: U1/W4 kết luận `-threads 1` không cải thiện
  gì trên VP9 (93–96%), còn `copy` khử về 0/250 — chứng tỏ nguồn lệch của
  VP9 cũng là ghi in-place (cùng cơ chế M1), không phải tile-threading
  riêng như W4 §4 mục 3 từng nghi ngờ. Nghi ngờ tile-threading coi như
  được bác bỏ ở mức thực nghiệm (chưa đọc mã vp9 decoder, nhưng số đo
  0/250 ×3 với `copy` là đủ để đóng hướng điều tra đó ở mức thực hành).
- Clip dài 60s (nơi `-threads 1` một mình còn lệch 8–17% từ frame ~1499)
  nay 0/1800 ×2 với `copy` — ngưỡng "clip dài bắt đầu hỏng" của W4 §4
  mục 4 không còn ý nghĩa với fix này.

## 3. Điều tra SEGFAULT (nợ đợt 67 U1 §7 mục 3)

### 3.1 Tái hiện

- Điều kiện gốc (đợt 67): transform→framemd5 clip 1080p 5s
  (`.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4`, sha 5cf533f5…),
  `-threads 1`, `.trf` detect trên đúng clip đó, 1 crash/3 lần (PID 36806,
  signal 11, file rỗng).
- Pha E (đợt này): đúng cấu hình trên (`.trf` detect lại 1 lần trên đúng
  clip, sha trf mới — file cache c21ecb48… của đợt 67 không còn trên đĩa),
  ×20 lần liên tiếp: **1 crash (r10, status null, signal SIGSEGV, file
  0 byte, 18,8s)**; 19 lần còn lại exit 0 và **cả 19 cho cùng sha
  d9609968…** — trùng khít sha của U1 (r1=r3=d9609968…). Tức với
  `-threads 1`, khi không crash thì transform 1080p 5s là xác định tuyệt
  đối (19/19 giống hệt + trùng U1).
- Crash ngoài pha E: C0 r2 (baseline, threads mặc định, không copy) và
  C0retry r1 (baseline, threads mặc định, không copy) — đều SIGSEGV, file
  rỗng. **Crash xảy ra ở cả 2 cấu hình threads (mặc định và `-threads 1`)**,
  nên giả thuyết ban đầu "gắn với `-threads 1`" là SAI.
- Tổng đợt này (chỉ tính transform→framemd5 1080p 5s, không copy):
  **3 crash / 29 lần chạy** (C0 1/2, C0retry 1/4, E 1/20). Gộp với U1
  (1/3): **4 crash / 32 lần ≈ 12,5%** — nhưng các mẫu đo ở tải nền khác
  nhau nhiều nên không gộp thành 1 tỉ lệ duy nhất một cách nghiêm ngặt;
  con số kiểm soát tốt nhất là pha E: **1/20 = 5%** với `-threads 1`.
- Không crash nào trong **18 lần chạy có `copy`** (B1/B4/C1/C2/D1/D2/F,
  kể cả 60s ×2). Cũng không crash trong 3 lần D0 (VP9 baseline threads1).

### 3.2 Giải thích (giả thuyết, chưa chứng minh bằng mã)

Crash nhiều khả năng cùng gốc với spread M1: vidstabtransform ghi in-place
lên buffer frame của decoder trong lúc một luồng decode khác vẫn đang dùng
buffer đó làm reference (hoặc đã giải phóng) → ghi vào bộ nhớ không còn
hợp lệ → SIGSEGV. Hỗ trợ bởi: (a) crash chỉ xảy ra ở cấu hình không có
`copy` (3/29 vs 0/18); (b) 19/19 lần E không crash cho cùng sha — tức
khi race không xảy ra thì mọi thứ xác định, khi race xảy ra thì có thể
crash thay vì chỉ lệch pixel; (c) không crash nào ở decode-only (W4 X5/X6)
hay rawvideo (W4 X1/X7/X8) — cần cả decoder + transform mới crash.
CHƯA chứng minh: không có core dump / stack trace (ffmpeg chạy với
`-v error`, không bật coredump; VM không cho đọc dmesg). Không chạy
valgrind/ASAN (quá chậm dưới tải + ngoài phạm vi luồng).

### 3.3 Kết luận điều tra — ĐÓNG NỢ DẠNG "ĐÃ ĐIỀU TRA, CÓ HƯỚNG NGĂN"

- SEGFAULT **tái hiện được** (không phải sự cố 1 lần duy nhất): 1/20 ở pha
  kiểm soát E + 2 lần nữa ở C0/C0retry trong cùng đợt.
- Cơ chế khả dĩ nhất: cùng race in-place M1 (xem §3.2) — chưa chứng minh
  tuyệt đối bằng mã/core dump.
- Ngăn ngừa thực hành: `copy` trước vidstabtransform (đã vào production)
  loại bỏ ghi in-place nên loại bỏ luôn đường dẫn race này; 0/18 crash
  sau sửa là gợi ý ủng hộ nhưng **CHƯA ĐỦ MẪU để claim "đã khử hẳn
  crash"** (nếu tỉ lệ thật là 5% như pha E thì P(0/18) ≈ 40% — hoàn toàn
  có thể là may mắn). Muốn claim chắc cần ~60 lần chạy có `copy` không
  crash (P ≈ 5% nếu tỉ lệ thật 5%) — để lại cho đợt sau nếu cần.
- Nợ còn mở: lấy stack trace (chạy ffmpeg dưới gdb/catchsegv 1 lần khi
  máy rảnh, hoặc bật coredump) để xác nhận crash nằm trong
  vidstabtransform/vsDoTransform; chạy ~60 lần có `copy` để kiểm chứng
  crash đã hết hẳn. Không chặn việc dùng fix — spread đã khử hoàn toàn,
  crash chỉ còn là rủi ro thống kê chưa đo đủ.

## 4. Hồi quy sau sửa

- `node --check` enhance.js + harness mới: OK.
- `enhance.js --self-test` (có assert `copy` mới): ✅ tất cả assertion pass.
- `trfCache.js --self-test`: ✅ pass.
- `npm run test:unit`: **7/7 module xanh** (lut, effects, sticker, chroma,
  textfx, keyframes, mask).
- tsc `apps/web` (`npx tsc --noEmit`): **0 lỗi** (~115s).
- Harness V2 (`test_round68_v2_stab_toggle.js`): **11/11 pass** — dry-run
  đúng 1 `-threads 1` trước `-i` stabilize; toggle TẮT/BẬT đều render OK.
  Điểm mới: 2 bản render TẮT/BẬT nay **cùng sha MP4 55dd8123…**
  (8.394.559 byte cả 2; trước sửa khác nhau — V2 §2.3: 012ffbf1… vs
  142d4ddb…) — tức output end-to-end qua render.js + x264 encode nay
  không còn phụ thuộc vào decode threading. Đây là bằng chứng end-to-end
  rằng fix có tác dụng qua cả pipeline render thật, không chỉ ở tầng
  framemd5.
- Dry-run tay (spec stabilize 720p hợp lệ): graph chứa
  `setpts=PTS-STARTPTS,copy,vidstabtransform=input='…':smoothing=10:optalgo=gauss,scale=…`
  — `copy` đã vào đúng vị trí trong câu lệnh production.
- Không đụng UI nên không chạy vite build / click-test (quy định: chỉ chạy
  khi đụng UI). Không chạy harness U1 full (1080p ×3 qua render.js) — tầng
  transform đã chứng minh bằng framemd5 (C1/C2/D1/D2/F) + encode đã chứng
  minh xác định (U1: encode-only ×3 giống hệt); V2 720p end-to-end là đủ
  hồi quy cho đợt này.

## 5. Giới hạn và nợ mở (trung thực)

1. `copy` đã khử spread ở mọi cấu hình đã đo (tối đa 60s, 1800 frame) —
   chưa đo clip dài hơn 60s / 4K / footage 4K VP9 dài. Quy định ≥3 lần +
   báo spread ở 1080p (đợt 65) nay có thể nới lỏng cho stabilize: với
   `copy`, 1080p đã 0 frame khác ×3 ở cả 3 loại clip — nhưng chỉ nới khi
   có thêm mẫu dài hơn; tạm thời vẫn giữ thói quen đo ×3 khi đụng stabilize.
2. Chưa chứng minh tuyệt đối bằng mã nguồn rằng `copy` luôn cho frame
   non-writable (suy luận từ mô hình push đồng bộ + số đo; chưa đọc
   vf_copy.c / ff_filter_frame). Nếu FFmpeg đổi hành vi push (vd filter
   graph đa luồng xử lý frame bất đồng bộ sâu hơn), fix có thể mất tác
   dụng — self-test assert `,copy,vidstabtransform=` sẽ bắt được nếu ai
   đó vô tình bỏ `copy`, nhưng không bắt được nếu FFmpeg đổi ngữ nghĩa.
   Cách sạch hơn (cần build ffmpeg riêng): thêm
   `AVFILTERPAD_FLAG_NEEDS_WRITABLE` vào input pad của vf_vidstabtransform
   (đề xuất W4 §5 mục 1) — vẫn là nợ dài hạn, không chặn dùng `copy`.
3. SEGFAULT chưa khử hẳn ở mức chứng minh (xem §3.3): cần stack trace +
   ~60 lần chạy có `copy` không crash. Nợ mở cho đợt sau.
4. Chưa đo lại PSNR/SSIM giữa output trước/sau sửa (không cần — sha
   framemd5 của bản sửa trùng ground truth rawvideo / trùng các lần chạy
   threads1 không crash, nên pixel sau sửa là pixel "đúng", không phải
   pixel mới).
5. Chưa kiểm chứng trên ffmpeg/libvidstab phiên bản khác (chỉ 8.1.2 /
   1.1.0 trên VM này). `copy` là filter chuẩn từ lâu nên rủi ro phiên
   bản thấp, nhưng chưa đo.
6. Nợ cũ còn mở (không thuộc luồng này): log `r.signal` trong render.js
   khi ffmpeg bị kill (đợt 67 §7 mục 6) — lần này crash được phát hiện
   nhờ harness đọc `r.signal` trực tiếp, không nhờ render.js; nợ log
   signal trong render.js vẫn còn.

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/enhance.js` — chèn `copy` trước vidstabtransform +
  comment cơ chế/số đo + assert self-test mới.
- `server/render/src/test_round70_x8_vidstab_fix.js` — harness pha A–F +
  SEGFAULT ×20 (mới).
- `docs/PHASE9_ROUND70_X8_VIDSTAB_FIX_LIMITS.md` — tài liệu này.

Không stage: log luồng `hidden_files/round70-x8.md` (log nội bộ, không
thuộc repo), scratch `~/.scratch-r70x8/` (framemd5 + kết quả đo thô),
`/tmp/x8-dryrun/` (spec/media dry-run tay), file `.trf` detect tạm.
Không push — chờ user nhắn "push đi" từ main chat.
