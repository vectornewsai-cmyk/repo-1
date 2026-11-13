# Phase 9 Round 69 W4 — vidstabtransform: cơ chế không xác định (LIMITS)

Luồng điều tra (không sửa code sản phẩm): nợ đợt 67 §9 mục 3.
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round69-w4-vidstab-mechanism.md`.
Harness: `server/render/src/test_round69_w4_vidstab_mechanism.js`.
Môi trường: ffmpeg 8.1.2, libvidstab 1.1.0, 4 CPU, VM 8 GB, không GPU.
Mọi số dưới đây là framemd5 từng frame (khác = khác ít nhất 1 pixel 1 mức),
trừ mục M1 ghi rõ là PSNR.

## 1. Cơ chế ĐÃ RÕ: M1 — ghi in-place làm bẩn reference frame của decoder

`vidstabtransform` (`vf_vidstabtransform.c`, ffmpeg 8.1) kiểm tra
`av_frame_is_writable(in)`: nếu writable thì warp **ngay trên buffer frame
của decoder** (out = in); nếu không thì cấp buffer mới. Với decode đa luồng
(frame-threading), buffer đó vẫn đang/còn được một luồng decode khác dùng
làm **reference frame** cho các frame sau → ghi đè làm bẩn reference → các
frame sau decode sai → lệch khuếch đại qua vòng phản hồi destbuf
(`crop=keep`). Rawvideo không có reference frame → hết lệch. Filter không
có option determinism nào (`ffmpeg -h filter=vidstabtransform` đã kiểm).

Bằng chứng quyết định (720p, shakynoisy720.mp4, 150 frame, .trf cố định):
- X4 — ép non-direct qua split → nullsink: **xác định 0/150 ×3, output ==
  rawvideo (X1)**. Bỏ bước ghi in-place là hết lệch hoàn toàn.
- X1 — rawvideo transform ×3: **xác định 0/150**, sha `4a42bdd3a1d4…` ×3.
- X21 — transform identity (zero.trf, fit đã kiểm = 0 tuyệt đối) trên coded
  ×3: **xác định 0/150, output == decode-only**. Ghi in-place cùng pixel thì
  vô hại → chỉ ghi KHÁC pixel mới gây bẩn.
- X19b — tái lập E4 (`-threads 1` trước `-i`): **xác định 0/150**, output ==
  X1. Decode-only full-res (X5c/X5a/X5b/X6a/X6b): **bit-identical mọi cấu
  hình** (720p ×3+×3, 1080p 60s ×2+×2, VP9 10s ×3+×3).
- X2/X2b — `-filter_threads 1` (cả 2 vị trí): vẫn lệch 134–138/150 → không
  phải filter-graph threading. X15 — `-threads 1` SAU `-i`: vẫn lệch
  134/150 → vị trí cờ quyết định.

Lưu ý trung thực: bước "refcount không bắt kịp thread đang dùng" là suy
luận từ hành vi đo được + đọc mã vidstab/filter, CHƯA đọc mã trong của h264
decoder (`ff_h264_output_frame` / DPB / frame-threading submit) để chứng
minh tuyệt đối. M1 là giải thích duy nhất còn lại sau khi loại trừ mọi ứng
viên khác (xem §2), và X4/X21 là chứng minh thực nghiệm trực tiếp — nhưng
chưa có chứng minh ở tầng mã decoder.

## 2. Đã loại trừ (có số đo)

- Decode pixel: giống hệt ở full-res mọi cấu hình (X5a/b/c, X6a/b).
- Detect: .trf khác byte giữa các lần chạy nhưng nội dung LM giống hệt
  (X9a/X9b: 0/150 và 0/250 frame khác tập LM, median lệch 0,0px) — do OpenMP
  append-order trong `calcTransFields` (`#pragma omp parallel for` +
  `#pragma omp critical(localmotions_append)`).
- Fit: thứ tự LM chỉ đổi fit ở mức nhiễu float (X19: 12/150 frame khác ở
  6 chữ số thập phân, max |dx| 6e-06 px so với |x| điển hình ~20px) — không
  giải thích được spread.
- `-filter_threads 1` (X2/X2b/X17/C1), `-thread_queue_size 8` (X16:
  138/150), GOP dài/ngắn (G12: GOP ngắn `-g 12` vẫn lệch 227/250),
  độ phân giải (R1: clip 1080p 150f được `-threads 1` khử tuyệt đối 0/150),
  nối loop (clip 60s KHÔNG phải loop — `gen_shaky1080_60s.py` sinh 1800
  frame liên tục, encode một lần; X14 trim 300f vẫn lệch 150/300).
- `-filter_complex_threads`: CHƯA thử (chỉ áp cho `-filter_complex`).

## 3. Vì sao 720p khử hết mà 1080p h264 chỉ cải thiện, VP9 không cải thiện?

**Đáp án: `-threads 1` không khử race — nó chỉ đổi xác suất race mỗi frame.**
- Clip ngắn 150f (720p E4/X19b; 1080p R1): `-threads 1` → **0/150 ×3** ở cả
  hai độ phân giải. Mặc định: lệch 102–141/150 (R1-def).
- Clip 300f (nối stream-copy control 150f ×2, K2): `-threads 1` → r1==r3
  giống hệt, r2 lệch **11/300 từ frame 148**. Thỉnh thoảng mới lệch.
- Clip 250f slovenska-h264 (X10b): `-threads 1` → **228/250, 210/250**,
  đầu tiên frame 10. Mặc định (C2): chỉ **8/250, 5/250** — tức `-threads 1`
  làm TỆ HƠN mặc định ở 1080p (91% vs 3% frame khác). Thêm
  `-filter_threads 1` (C1): vẫn **123–124/250** — filter-graph threading
  không phải cơ chế thứ hai.
- Clip 60s h264 1800f (X13): `-threads 1` → **1458/1800 (81%),
  1496/1800 (83%)**, đầu tiên frame 147/148.
- VP9 (X11/X12/X17): lệch từ **frame 2** ở mọi độ phân giải (720p:
  229–232/250; 1080p: 134–146/150), `-threads 1` và `-filter_threads 1`
  đều vô tác dụng. Đo CPU decode VP9: `-threads 1` CÓ về ~1,00 core
  (cpu 3,34s → 2,92s) nhưng transform vẫn lệch → VP9 có nguồn lệch riêng
  (ứng viên: tile-threading ngoài tầm `-threads 1` — CHƯA chứng minh).

Giải thích tạm thời (giả thuyết, chưa chứng minh bằng mã decoder): với
decode đa luồng, decoder decode trước nhiều frame nên khi frame tới filter,
trạng thái DPB đã ổn định (còn là reference → refcount ≥ 2 → filter copy,
an toàn); với decode đơn luồng, filter nhận frame ngay sau khi decode, đúng
lúc refcount dao động theo nhịp giải phóng DPB → xác suất gặp frame
writable-nhưng-vẫn-là-reference cao hơn ở mỗi frame. Xác suất tích lũy tăng
theo số frame → clip ngắn sạch, clip dài lệch.

**Độ lớn lệch** (M1, PSNR giữa 2 lần chạy X10b-config, lossless): PSNR y
trung bình 49,40 dB (median mse_y 0,31; 248/250 frame mse_y ≤ 1 — dưới 1 mức
sáng, mắt thường khó thấy; chỉ 1/250 frame mse_y 119, RMS ~11 mức). Hòa giải
với con số 8–17% của U1: U1 đếm frame khác theo ngưỡng MAD (chỉ frame lệch
đáng kể), framemd5 đếm MỌI khác biệt dù 1 pixel lệch 1 mức. Với mục đích
"render xác định byte-identical" thì 84–91% mới là con số đúng.

## 4. Chưa rõ (đợt sau làm tiếp)

1. Cơ chế đếm ref/DPB chính xác trong h264 decoder khiến `-threads 1` làm
   tệ hơn mặc định — cần đọc `ff_h264_output_frame` / DPB / frame-threading
   submit trong ffmpeg 8.1 (CHƯA làm).
2. Vì sao lệch ở clip 60s/300f luôn bắt đầu quanh frame 147–148 (X13, X14,
   K2 đều ~148) — chưa có giả thuyết kiểm chứng được.
3. Nguồn lệch riêng của VP9 (tile-threading? cơ chế frame-threading khác
   h264?) — cần đọc mã vp9 decoder, thử `-tile_threads` / các cờ VP9 khác
   (CHƯA làm).
4. Ngưỡng số frame mà `-threads 1` bắt đầu hỏng (giữa 150 và 250) — chưa đo
   (đo nhanh: cắt clip control 1080p thành 180/200/220 frame, test
   `-threads 1`).

## 5. Đề xuất sửa cho đợt sau (KHÔNG sửa trong luồng này)

1. **Ưu tiên 1 — ép non-direct trong bước transform.** Cách đã chứng minh
   hiệu quả tuyệt đối (X4): luôn cấp buffer output riêng cho
   vidstabtransform thay vì để nó ghi in-place. Cách đơn giản, không cần
   patch ffmpeg: chèn `split` + `nullsink` (như X4) hoặc một filter copy
   ngay trước vidstabtransform để frame vào filter luôn non-writable — đo
   lại hiệu năng (thêm 1 lần copy frame 1080p, ~6 MB/frame, rẻ so với
   warp). Cách sạch hơn (cần build ffmpeg riêng): thêm
   `AVFILTERPAD_FLAG_NEEDS_WRITABLE` vào input pad của
   `vf_vidstabtransform.c` (filter hiện KHÔNG có flag này).
2. **Ưu tiên 2 — đừng dựa vào `-threads 1` như giải pháp.** Nó chỉ giảm
   xác suất race ở clip ngắn và làm tệ hơn ở clip dài; giữ nó trong
   render.js (U1 đã ép vào) thì không hại ở clip ngắn nhưng KHÔNG được coi
   là đã sửa xong — phải kèm giải pháp 1 mới đạt byte-identical ở mọi độ
   dài.
3. **Ưu tiên 3 — VP9 tách riêng:** với input VP9, cân nhắc transcode sang
   h264 trước bước transform (đắt) hoặc điều tra tile-threading (§4 mục 3)
   trước khi quyết.
4. **Đo kiểm sau sửa:** chạy lại ma trận X10–X13 + K2 với giải pháp 1, yêu
   cầu 0 frame khác ở mọi clip (kể cả 60s + VP9); đo thêm thời gian render
   để báo cáo trade-off.

## 6. Bảng kết quả đầy đủ (framemd5, số frame khác / tổng)

| Thí nghiệm | Cấu hình | Kết quả |
|---|---|---|
| X1 | rawvideo 720p transform ×3 | XÁC ĐỊNH 0/150 |
| X2 | 720p `-filter_threads 1` sau -i ×3 | 138/150, đầu tiên 5 |
| X2b | 720p `-filter_threads 1` trước -i ×3 | 134–136/150, đầu tiên 6–10 |
| X15 | 720p `-threads 1` sau -i ×2 | 134/150, đầu tiên 10 |
| X4 | 720p split ép non-direct ×3 | XÁC ĐỊNH 0/150, == X1 |
| X18 | 720p `-threads 1` + `-filter_threads 1` ×2 | XÁC ĐỊNH 0/150 |
| X19b | 720p `-threads 1` trước -i ×2 (tái lập E4) | XÁC ĐỊNH 0/150, == X1 |
| X21 | 720p transform identity (zero.trf) ×3 | XÁC ĐỊNH 0/150, == decode-only |
| X5c | decode-only 720p full-res, mặc định ×3 + t1 ×3 | XÁC ĐỊNH 0/150 |
| X5a/b | decode-only 1080p 60s, mặc định ×2 + t1 ×2 | XÁC ĐỊNH 0/1800 |
| X6a/b | decode-only VP9 10s, mặc định ×3 + t1 ×3 | XÁC ĐỊNH 0/250 |
| X7/X8 | rawvideo 1080p 5s / slovenska 10s transform ×3 | XÁC ĐỊNH 0/150, 0/250 |
| X9a/b | detect trên rawvideo 720p / slovenska ×2 | .trf khác byte, LM giống hệt 0/150, 0/250 |
| X19 | fit debug=1, trfA vs trfB (khác thứ tự LM) | max \|dx\| 6e-06 px — nhiễu float |
| X10b | slovenska→h264 1080p 10s, `-threads 1` ×3 | 228/250, 210/250, đầu tiên 10 |
| C2 | X10a chạy lại, mặc định ×3 | 8/250, 5/250, đầu tiên 10 |
| C1 | slovenska-h264, `-threads 1` + `-filter_threads 1` ×3 | 123/250, 124/250, đầu tiên 10 |
| X11a/b | shaky1080→VP9 5s, mặc định / `-threads 1` ×3 | 135/150, 134/150 / 146/150, 146/150, đầu tiên 2 |
| X12a/b | slovenska→VP9 720p 10s, mặc định / `-threads 1` ×3 | 232/250, 232/250 / 229/250, 231/250, đầu tiên 2 |
| X13 | h264 1080p 60s, `-threads 1` ×3 | 1458/1800, 1496/1800, đầu tiên 147/148 |
| X14 | trim 10s clip 60s, detect riêng, `-threads 1` ×3 | 150/300, 150/300, đầu tiên 148 |
| X16 | 720p `-thread_queue_size 8` ×2 | 138/150, đầu tiên 2 |
| X17 | slovenska VP9 `-filter_threads 1` ×3 | 198/250, 229/250, đầu tiên 2 |
| G12 | slovenska-h264 GOP ngắn (-g 12), `-threads 1` / mặc định ×3 | 227/250, 227/250 / 120/250, 115/250, đầu tiên 3 |
| R1 | control 1080p 150f, `-threads 1` / mặc định ×3 | **0/150, 0/150** / 141/150, 102/150 |
| K2 | control 1080p ×2 (300f), `-threads 1` ×3 | r1↔r2 11/300 (đầu tiên 148), r1↔r3 0/300 |
| M1 | PSNR giữa 2 lần chạy X10b-config | PSNR y 49,40 dB, median mse_y 0,31, max 119,33 |

## 7. Nợ đã đóng / nợ còn mở

- Đóng: nợ đợt 67 §9 mục 3 (điều tra cơ chế) — cơ chế M1 đã rõ + đáp án
  720p/1080p/VP9 đã có (xem §1, §3).
- Mở (đợt sau): §4 mục 1–4. Đặc biệt: `-threads 1` trong render.js (U1)
  KHÔNG phải giải pháp hoàn chỉnh — cần giải pháp 1 (§5) để đạt
  byte-identical ở mọi độ dài clip.
