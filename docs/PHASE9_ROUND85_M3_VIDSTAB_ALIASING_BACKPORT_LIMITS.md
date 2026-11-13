# LIMITS — Phase 9 đợt 85 M3: vidstab — aliasing offset + backport parser showinfo

Luồng M3 — đóng nợ của L4 đợt 84 (parser showinfo chưa backport sang
J1/K10; aliasing offset chưa đo được). Log chi tiết:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round85-m3.md`.
Harness mới: `server/render/src/test_round85_m3_vidstab_aliasing_noise.js`
(kế thừa K10) + `analyze_noise.py` (chỉ ở scratch, không stage).
Môi trường: ffmpeg stock Ubuntu 8.1.2 (7:8.1.2-2ubuntu2+hatch3),
libvidstab 1.1.0, VM 4 vCPU EPYC 9D25, ~8 GB RAM, không GPU, cell chia
sẻ 1,5 CPU. Ngày: 11/11/2026 (lượt cron 06:35 +07).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Backport parser showinfo sang J1 + K10 | **XONG, ĐÃ KIỂM CHỨNG.** Parser mới giống hệt L4; selfcheck J1 9/9 PASS (thêm check 2b); negative control tái hiện đúng lỗi cũ (gán nhầm mean frame n+1 cho frame n, mất entry frame n+1) và chứng minh parser mới sửa đúng. |
| Re-analyze run cũ (J1 + K10) bằng parser mới | **Endpoint KHÔNG ĐỔI như L4 đã thấy.** md5 totalDiv/divPerRun không đổi ở toàn bộ 21 arm (K10 13 + J1 8); mọi p-value comparison không đổi; 0 leaf poison nào đổi. Chỉ trường phụ thuộc showinfo sạch hơn: showMissing 32→0 (K10) / 14→0 (J1); parse khôi phục +32 frame (K10) / +14 frame (J1), 0 file còn thiếu frame. |
| Cơ chế lõi cache_stop (đọc source) | **RÕ HƠN MỘT BẬC, NHƯNG CHƯA ĐÓNG.** Đã xác định được ranh giới sở hữu buffer trong filter + libvidstab (§4): writable → nhánh COPY an toàn; không writable → con trỏ trần vào buffer decoder. Transform trong 1 lần gọi đồng bộ KHÔNG có đường nào đọc được frame n+1 — nên nếu probe nhiễu chứng minh offset thuần, pixel sai đã có trong buffer trước khi transform chạy. Cơ chế "giữ ref frame cuối khử được race GIỮA STREAM" vẫn chưa có lời giải đầy đủ từ source. |
| Probe aliasing offset (clip nhiễu seed-riêng) | **XONG — GIẢ THUYẾT FRAME-SWAP BỊ BÁC.** Race tái hiện 48/1500 (3,2%, Fisher p=4,8e-15, permutation p=1,08e-5). **0/48 frame lệch khớp với frame kề (offset ±1/±2/±3)** — không có frame nào là "output n chứa source frame m≠n". Thay vào đó là hỏng một phần của ĐÚNG frame: 23 Y-giống hệt chỉ hỏng chroma, 17 nhiễu nhỏ toàn khung (corr 0,98–1,00 với frame đúng), 3 hỏng nửa dưới (drain n=148), 5 thay toàn khung bằng nội dung không khớp frame nào. **Cụm tại biên GOP:** cả 48 frame đều trong ±3 frame của một keyframe (p≈1,6e-30 nếu đều); **keyframe MIỄN NHIỄM** — 0/150 lượt frame-run tại I-frame (chéo 2 clip). |

## 1. Backport parser showinfo — nội dung sửa

Sửa y hệt L4 §2.3 (3 chỗ) ở cả 2 harness, 2 parser sau sửa giống hệt
nhau (diff sạch):

1. Tước status-line trước khi parse: xóa cụm `frame= ... fps= ... \r`
   + tiền tố log `[Parsed_showinfo...]` lặp lại, rồi xóa `\r` còn lại.
2. Regex các trường dùng `\s+` thay cho khoảng trắng đơn.
3. Ngoặc `mean:`/`stdev:`/`plane_checksum:` dùng `\[\s*...\s*\]`.

File sửa:
- `server/render/src/test_round82_j1_vidstab_perframe_harness.js`
- `server/render/src/test_round83_k10_vidstab_race_fix.js`
- `server/render/src/test_round82_j1_perframe_harness_selfcheck.js`
  (thêm check 2b — fixture đúng byte thô L4 gray-smoke2: status-line
  xen giữa stdev của frame 0 + tiền tố log lặp sau `\r`; assert frame 0
  giữ mean của chính nó, frame 1 vẫn có entry riêng).

## 2. Kiểm chứng backport

### 2.1 Selfcheck J1: 9/9 PASS

Chạy `node server/render/src/test_round82_j1_perframe_harness_selfcheck.js`:
9 PASS, 0 FAIL (8 check cũ + check 2b mới).

### 2.2 Negative control: parser cũ fail đúng như L4 mô tả

Cùng fixture 2b (frame 0 mean 88, frame 1 mean 87, status-line xen
giữa stdev frame 0):

| Parser | size | frame 0 mean | frame 1 |
|---|---|---|---|
| Cũ (tái hiện từ code gốc) | 1 | [87, 127, 132] — lấy nhầm của frame 1 | MẤT |
| Mới (sau backport) | 2 | [88, 127, 132] — đúng | còn |

### 2.3 Re-analyze run cũ — endpoint không đổi

Chạy `analyze` trên WORK cũ bằng harness đã sửa (file phân tích gốc
parser cũ đã backup tại `~/workspace/.scratch-r85m3/k10-analysis-v1parser.json`
và `j1-analysis-v1parser.json`; deep-diff từng leaf JSON):

**K10** (13 arm, 130 file .stderr, 1500 frame/arm):
- Endpoint md5 KHÔNG ĐỔI toàn bộ arm: D720NC 844→844, N720NULL 867→867,
  M720FMT 871→871, T720PAD1 0→0, W720NW 0→0, A1080NC 1→1, các arm CP 0→0;
  divPerRun từng run giống hệt; mọi p-value comparison giống hệt.
- Poison: 0 leaf nào đổi (deep-diff 634 leaf, toàn trường showinfo-phụ).
- Sạch hơn: showMissing tổng 32→0; planeTotal Y/U/V 2584/2604/2608 →
  2559/2579/2583 (−25 mỗi plane); nSystematic M720FMT 62→64 (+2 frame
  hệ thống phát hiện được nhờ showinfo đúng); arm GT (CP) planeTotal
  về 0/0/0 (trước 2/2/2 — nhiễu "1–4 frame" của I1/K10 đúng là lỗi parse).
- Parse: OLD 19.728 frame (15 file <150) → NEW 19.760 frame (+32),
  0 file còn thiếu; histogram NEW: 70×150, 20×151 (arm TPAD1), 40×156
  (arm TPAD) — khớp đúng số frame kỳ vọng từng arm.

**J1** (8 arm, 80 file .stderr):
- Endpoint md5 KHÔNG ĐỔI toàn bộ arm: D720NC 882→882, các arm còn lại
  giữ nguyên; mọi p-value comparison giống hệt; 0 leaf poison nào đổi
  (deep-diff 272 leaf).
- Sạch hơn: showMissing tổng 14→0; planeTotal −9 mỗi plane
  (Y/U/V 888/893/894 → 879/884/885); nSystematic D720NC 48→50.
- Parse: OLD 12.226 frame (4 file <150) → NEW 12.240 frame (+14),
  0 file còn thiếu; histogram NEW: 40×150, 40×156 (arm TPAD).

**Kết luận:** backport đóng đúng nợ L4 §6.6. Mọi số liệu J1/K10 đã công
bố (endpoint md5, poison, p-value) giữ nguyên giá trị; chỉ các trường
phụ thuộc showinfo (plane lệch, frame hệ thống, showMissing) sạch hơn.
Các harness J1/K10 từ nay parse đủ frame — không còn lỗi gán nhầm
frame kề.

## 3. Thiết kế probe aliasing offset (L4 §5.5)

Gray identity đã bị bác ở cả v1 lẫn v2 (race không tái hiện trên nội
dung xám đặc). Hướng thay thế: clip mà mỗi frame có danh tính đọc được
NHƯNG vẫn tái hiện race — nội dung giống clip shaky (nhiễu/chi tiết,
decode chậm) thay vì xám đặc.

- **Clip:** `noise720.mp4` (1280×720, 150 frame, 30 fps, h264, 101 MB,
  169,5 Mbps): frame n là nhiễu giả-ngẫu nhiên hoàn toàn khác nhau,
  seed riêng theo n (Y: 1000+n, U: 2000+n, V: 3000+n, cả 3 plane),
  B-frame bf 3, GOP 30. Gen bằng numpy → rawvideo → libx264 crf 18
  preset medium (2m16s). Validate: decode framemd5 → 150/150 md5 khác
  nhau (mọi frame phân biệt được tuyệt đối); decode 52,8 s cho 5 s clip
  (~0,09× realtime — decode rất chậm).
- **Harness:** `test_round85_m3_vidstab_aliasing_noise.js` (kế thừa K10:
  taskset pin ffmpeg+hog cores 0-1, LD_PRELOAD free_track_v2e +
  segv_backtrace, `-threads 1`, showinfo, `-v info`, xen kẽ từng vòng,
  resume từ results.jsonl, writeRetry chống sóng EPERM). Khác K10 ở
  đầu ra: mỗi run ghi CẢ framemd5 (endpoint chính) VÀ rawvideo (pixel
  thật để phân tích offset) từ CÙNG MỘT filter graph qua `split=2` —
  hai đầu ra chia sẻ đúng một instance transform. 2 arm × n=10, chỉ
  720p: N720NC (NOCOPY) / C720CP (COPY, GT); cùng trf rung thật
  `shaky720.trf`.
- **Phân tích offset** (`analyze_noise.py`, chỉ ở scratch): với mỗi
  frame NC lệch theo framemd5, tính MAD Y-plane (lấy mẫu stride 4) có
  shift-search ±8 px để hấp thụ chênh lệch warp giữa transform #n và
  #m; cửa sổ ứng viên m = n±3; thêm ứng viên blend (CP_n+CP_{n+1})/2
  và (CP_{n−1}+CP_n)/2. Phân loại: `offset` (khớp mạnh nhất một CP_m,
  margin ≥1,5, MAD ≤ ngưỡng), `blend` (blend tốt hơn hẳn, <0,7× MAD
  tốt nhất), `no-match` (còn lại). Ngưỡng MAD hiệu chuẩn bằng số đo:
  chạy cùng matcher trên frame NC KHÔNG lệch (truth offset 0) + null
  baseline MAD giữa các frame độc lập — không đoán mò ngưỡng.

## 4. Cơ chế lõi — những gì source libvidstab NÓI ĐƯỢC (và chưa nói được)

Đọc source có sẵn trên VM (không tải code ngoài):
`vid.stab-1.1.0` tại `~/.scratch-r69w4/` (W4 đã tải, GPL-2.0) và
FFmpeg 8.1.2 source tại `~/.scratch-r77e3/FFmpeg-n8.1.2/` (khớp đúng
version ffmpeg stock 8.1.2 đang chạy).

### 4.1 Ranh giới sở hữu buffer — điểm rẽ quyết định trong filter

`vf_vidstabtransform.c` (FFmpeg 8.1.2), `filter_frame` dòng 228–274:

```c
if (av_frame_is_writable(in)) {
    direct = 1;
    out = in;                       // in-place
} else {
    out = ff_get_video_buffer(outlink, ...);   // buffer out riêng
}
...
if (direct) vsTransformPrepare(td, &inframe, &inframe);       // src==dest
else        vsTransformPrepare(td, &inframe, &outframe);      // src!=dest
```

`transform.c` `vsTransformPrepare` (dòng 137–170):

```c
// we first copy the frame to td->src and then overwrite the destination
// with the transformed version
if (src==dest || td->srcMalloced) {   // in-place: COPY src vào buffer malloc riêng
    if (vsFrameIsNull(&td->src)) { vsFrameAllocate(&td->src,...); td->srcMalloced = 1; }
    vsFrameCopy(&td->src, src, &td->fiSrc);
} else {                              // KHÔNG copy: td->src = *src (con trỏ trần)
    td->src = *src;
}
```

Hệ quả đã xác nhận bằng source (không phải phỏng đoán):

1. **Có đúng 2 chế độ đọc, rẽ theo `av_frame_is_writable(in)` tại thời
   điểm filter_frame chạy.** Writable → nhánh COPY (libvidstab copy
   pixel vào buffer malloc riêng của nó, transform đọc buffer riêng).
   Không writable → nhánh KHÔNG COPY (`td->src` chỉ là con trỏ vào
   buffer của decoder, libvidstab không sở hữu, không giữ ref).
2. **`td->srcMalloced` là sticky (dính vĩnh viễn):** chỉ cần MỘT frame
   đi nhánh COPY là mọi frame sau đều copy. Ngược lại, một chuỗi đầu
   toàn frame không writable thì mọi frame trong chuỗi đều đọc trực
   tiếp buffer decoder qua con trỏ trần.
3. **`copy` filter khử race là hệ quả trực tiếp của (1):** `copy` cho
   ra frame writable → direct=1 từ frame 0 → nhánh COPY từ đầu →
   `td->srcMalloced=1` vĩnh viễn → mọi frame đều được copy vào buffer
   riêng trước khi transform. `null`/`format` không đổi tính writable
   → vẫn rẽ nhánh theo decoder như cũ → không khử (khớp K10).
4. **Tính writable của frame decoder là biến động theo trạng thái DPB/
   pool của decoder** (frame còn được giữ làm reference cho frame sau
   thì refcount > 1 → không writable). Clip shaky720 có B-frame
   (9 I + 55 P + 86 B — decode order ≠ presentation order), nên chuỗi
   writable/không-writable của từng frame phụ thuộc nhịp decode/filter
   — đây là nguồn biến động theo tải mà hogs khai thác được. Điều này
   khớp với quan sát: race phụ thuộc tải CPU, không tái hiện trên clip
   xám đặc (decode gần như tức thì, nhịp khác hẳn).

### 4.2 Transform KHÔNG có đường nào đọc được frame n+1 trong một lần gọi

`transformfixedpoint.c` `transformPlanar` (dòng 327–393): vòng lặp
pixel chỉ đọc 2 nguồn — `td->src` (frame hiện tại) và `td->destbuf`
(frame OUTPUT trước, dùng làm nền viền khi `crop=keep`, mặc định).
`vsTransformFinish` copy `destbuf` → `dest`. Không có con trỏ nào
khác, không giữ frame thô nào qua lần gọi ngoài `destbuf` (là output
đã ổn định, không phải input thô) và `td->src` (được gán lại đầu mỗi
lần `vsTransformPrepare`).

**Suy ra:** trong MỘT lần `filter_frame` đồng bộ, transform không thể
tự sinh ra pixel của frame n+1. Nên NẾU probe nhiễu chứng minh output
n chứa frame m≠n (offset thuần, §5), thì pixel sai đã nằm trong buffer
mà `td->src` trỏ tới TRƯỚC KHI transform chạy — tức lỗi nằm ở thượng
nguồn (decoder/pool/graph trả frame có buffer đã bị dùng lại/ghi đè),
transform chỉ là nạn nhân đọc con trỏ trần mà không copy. Đây là
hướng giải thích nhất quán với toàn bộ quan sát từ F3→L4: mọi biện
pháp khử (copy, NEEDS_WRITABLE, tpad-cache_stop) đều cắt đứt chuỗi
con trỏ trần hoặc đổi nhịp pool; mọi biện pháp không khử (null, format,
pad0-pull, padadd-EOF) đều giữ nguyên chuỗi đó.

### 4.3 Vì sao `cache_stop` khử được race GIỮA STREAM — vẫn chưa rõ

`tpad` chỉ giữ ref `cache_stop` của frame cuối (L4 §1 đọc `vf_tpad.c`:
chỉ clone khi `stop_mode==MODE_CLONE && pad_stop!=0`; `uninit` mới
free). Source của tpad không chạm gì tới các frame giữa stream, và
source của transform (§4.2) không có đường nào để "giữ ref frame cuối"
ảnh hưởng tới frame giữa stream. L4 đã đo: TPAD1 khử cả 786–813 frame
lệch mid-stream. Mâu thuẫn này KHÔNG gỡ được bằng source đã đọc —
có thể cơ chế nằm ở tầng graph/pool của ffmpeg (giữ ref đổi nhịp
reuse của pool decoder cho TOÀN BỘ stream, không riêng frame cuối),
nhưng đó vẫn là giả thuyết, chưa có bằng chứng. **Nợ này vẫn mở.**

### 4.4 Artifact bilinear L4 §5.4 — source giải thích được một phần

- `interpolateBiLin` (transformfloat.c, dòng 101–121) ở nhánh trong
  dùng macro `PIX` KHÔNG kiểm tra biên: khi `x` gần `width−1` hoặc
  `y` gần `height−1`, `x_c=x_f+1` / `y_c=y_f+1` đọc quá 1 px / 1 hàng
  cuối plane — vào padding hoặc plane kế tiếp trong buffer liên tục.
  Chỉ giải thích được artifact ở VIỀN, không giải thích được các
  đường chéo nội bộ (~0,39% pixel) hay frame 0 = frame 1 toàn bộ.
- `crop=keep` (mặc định, `VSKeepBorder=0`): đối số `def` cho pixel
  ngoài biên là `*dest` — tức pixel của frame OUTPUT trước trong
  `destbuf`. Nên pixel viền của output n đến từ output n−1 là hành vi
  THEO THIẾT KẾ (giữ viền), không phải race.
- Chưa gỡ được: U/V +1 trong khi frame n+1 cũng có U/V=128 (pha trộn
  khung không giải thích được); cơ chế nào đọc được pixel frame n+1
  ở nội bộ khung. Cần probe nhiễu §5 để phân biệt: nếu offset thuần
  chiếm đa số thì artifact bilinear và race là 2 hiện tượng khác nhau
  (artifact tất định, race ngẫu nhiên theo tải); nếu blend chiếm đa
  số thì 2 hiện tượng có thể cùng một gốc.

## 5. Probe aliasing offset — kết quả

### 5.1 Endpoint: race CÓ tái hiện trên clip nhiễu, nhưng yếu (3,2%)

Full run 2 arm × n=10 (20 run, 0 crash, mỗi run 42–150 s; CP về sau
nhanh hơn khi các luồng đợt 85 khác xong — loadavg từ ~24 xuống ~3):

| Arm | Frame lệch / tổng | Mỗi run | Vùng mid/drain |
|---|---|---|---|
| N720NC (NOCOPY) | **48/1500 (3,2%)** | **[5, 5, 4, 8, 4, 4, 2, 8, 2, 6]** | **39/9** |
| C720CP (COPY, GT) | 0/1500 | 0 (0–0) | 0/0 |

GT ổn định tuyệt đối (10/10 run CP cùng framemd5 sha `b5002a42e9b2`);
10 run NC sha khác nhau. Fisher p=4,8e-15; permutation per-run
p=1,08e-5 (sàn). So với clip shaky (~58%): race yếu hơn ~18 lần trên
clip nhiễu trắng. Hai khác biệt của clip nhiễu có thể góp phần (xem
§5.4): 0 B-frame (x264 tự chọn P-only) và decode cực chậm (~0,09×
realtime) — nhịp decode/filter khác hẳn clip shaky.

### 5.2 Phân tích offset: 0/48 frame là frame-swap — giả thuyết bị bác

Matcher: MAD Y-plane (lấy mẫu stride 4) + shift-search ±8 px, cửa sổ
m = n±3, thêm ứng viên blend (n,n+1)/(n−1,n). Hiệu chuẩn bằng số đo:
- Control (60 frame NC KHÔNG lệch, truth offset 0): MAD tốt nhất =
  **0,0 chính xác** (pixel giống hệt sau lấy mẫu) — matcher phân biệt
  được tuyệt đối.
- Null baseline (frame độc lập): MAD trung vị **55,6**.
- Ngưỡng MAD chấp nhận: 25,0 (từ control).

Phân loại 48 frame lệch: **`offset`: 40, `blend`: 0, `no-match`: 8.**
Histogram offset (chỉ tính class `offset`): **{0: 40}** — cả 40 frame
đều khớp tốt nhất với ĐÚNG frame n của nó (margin ≥8,7, trung vị 99),
không frame nào khớp tốt nhất với frame kề. **Kết luận: không có
bằng chứng nào cho "output frame n chứa source frame m≠n" (aliasing
offset dạng frame-swap) trên clip này.** Đây là bác bỏ trực tiếp giả
thuyết L4 §5.5 đặt ra, với matcher đã được hiệu chuẩn và có power
phân biệt (control 0,0 vs null 55,6).

### 5.3 Phân loại thật của 48 frame lệch (đo pixel full-res)

| Nhóm | Số frame | Đặc điểm đo được |
|---|---|---|
| Y-giống hệt, chỉ hỏng chroma | **23 (48%)** | Y pixel-diff 0–0,13% (bit-identical với CP_n); U/V hỏng một phần — vd run1 n=27: U 2,48% pixel khác (MAD 1,4), V 7,93% (MAD 4,5), so null ~56; không khớp chroma frame kề nào. |
| Nhiễu nhỏ toàn khung của frame đúng | **17 (35%)** | Khớp CP_n với MAD 3,4–6,4, corr 0,98–1,00, margin ≥8,7; hồi quy tuyến tính NC = a·CP + b với a≈0,98–1,00, b≈−6..+5; KHÔNG có đối tác blend (least-squares w*≈0,003 với mọi m trong 150 frame); không có shift lớn (±64 px không cải thiện). |
| Hỏng nửa dưới (drain, n=148) | **3 (6%)** | Y nửa trên đúng hệt CP_148 (MAD 0,0), nửa dưới thay bằng nội dung không khớp frame nào (MAD ~50 so với cả 150 frame CP); biên ngang thay đổi theo run (hàng 45/69/128); chroma U/V đúng 0,0%. |
| Thay toàn khung, không khớp gì | **5 (10%)** | MAD ~55,1–55,4 ≈ null so với cả 150 frame CP VÀ cả 150 frame source (đã giải mã); không đối tác blend; wide-shift ±64 px không cải thiện (MAD vẫn ~55). |

Đọc đúng mức: 4 nhóm trên đều là **hỏng một phần của ĐÚNG frame**
(hoặc thay bằng nội dung không xác định được), không phải đọc nhầm
sang frame kề. Nhóm "nhiễu nhỏ toàn khung" có tương quan 0,98–1,00
với frame đúng — khác hẳn với frame-swap (tương quan ~0 với frame
đúng). Nhóm "thay toàn khung" (5 frame) là nhóm duy nhất không giữ
lại thông tin nào của frame đúng, nhưng nội dung thay thế không khớp
bất kỳ frame nào trong clip (kể cả sau khi tìm shift ±64 px) — nên
không gọi được là aliasing sang frame khác trong clip; có thể là
hỗn hợp nhiều frame hoặc nội dung từ buffer tái chế ngoài clip
(chưa xác định được, không đoán).

### 5.4 Cụm tại biên GOP + keyframe miễn nhiễm

Keyframe của clip nhiễu (đo bằng ffprobe, KHÔNG đoán): I-frame tại
**[0, 29, 58, 87, 116, 145]** (x264 `-g 30` đặt keyframe cách nhau 29
frame, không phải 30).

- **Cả 48 frame lệch đều nằm trong ±3 frame của một keyframe**
  (khoảng cách tới I gần nhất: 1→22 frame, 2→23 frame, 3→3 frame;
  max = 3, tại n=148 so với I=145; 0 frame ở giữa GOP).
  P(cả 48 đều trong cửa sổ ±3 nếu phân bố đều) = (35/150)^48 ≈ **1,6e-30**.
- **Không frame lệch nào LÀ keyframe** (n=29/58/87/116/145 không bao
  giờ lệch trong 10 run).
- **Chéo kiểm trên clip shaky (K10 D720NC, 10 run, 844/1500):**
  I-frame (presentation [0, 23, 25, 53, 74, 78, 101, 113, 143]) cũng
  KHÔNG BAO GIỜ lệch: 0/90 lượt frame-run; các P-frame còn lại lệch
  53–69% bất kể khoảng cách tới keyframe (dist 1–3: 0,57; 4–7: 0,53;
  8–15: 0,69). Gộp 2 clip: **I-frame 0/150 lượt frame-run**
  (Wilson 95% cận trên 2,5%).
- **Miễn nhiễm theo LOẠI frame, không theo chỉ số:** frame 87 miễn
  nhiễm khi là I-frame (clip nhiễu) nhưng lệch 10/10 khi là P-frame
  (clip shaky); frame 143 miễn nhiễm khi là I-frame (shaky) nhưng
  lệch khi là P-frame (nhiễu). Cùng một trf cho cả 2 clip nên không
  thể giải thích bằng motion/transform — chỉ còn lại cấu trúc mã hoá
  (I vs P).

**Giải thích nhất quán (giả thuyết, chưa chứng minh):** thời điểm dễ
tổn thương nhất là biên GOP — nơi decoder xả/giải phóng reference
frame và tái chế buffer pool. Khi điều kiện biên (clip nhiễu: không
B-frame, decode chậm) thì CHỈ các P-frame kề keyframe (±2) mới
lệch; khi điều kiện xấu hơn (clip shaky: B-frame + reorder) thì
P-frame lệch rộng khắp, chỉ I-frame vẫn miễn nhiễm. Điều này khớp
với §4.2: lỗi nằm ở thượng nguồn (decoder/pool), transform chỉ đọc
con trỏ trần; và khớp với việc `copy` khử được race (copy ngắt chuỗi
con trỏ trần từ frame 0).

### 5.5 Trả lời câu hỏi của nhiệm vụ

- **Aliasing offset có phải thành phần độc lập? KHÔNG — dạng
  frame-swap không tồn tại trên clip đo được (0/48).** Cái mà L4 gọi
  là "aliasing offset" (output n chứa frame m≠n) không xuất hiện;
  thay vào đó race biểu hiện thành hỏng một phần của đúng frame.
- **Có phải hệ quả của cache_stop? Cũng KHÔNG chứng minh được chiều
  này.** Cụm biên GOP + miễn nhiễm I-frame chỉ về phía decoder/pool
  recycling tại biên keyframe, không chỉ về phía `cache_stop` (giữ
  ref frame cuối). Cơ chế "giữ ref frame cuối khử được race giữa
  stream" vẫn mở (§4.3) — probe này không đóng nó, mà thu hẹp
  không gian giả thuyết: lỗi nằm ở buffer decoder bị tái chế/xả
  tại biên GOP, transform chỉ là nơi đọc.
- **Hệ quả cho phương pháp:** endpoint per-frame trên clip shaky
  vẫn là endpoint có power nhất (58% vs 3,2%); clip nhiễu seed-riêng
  có ích để ĐỊNH DANH nội dung frame lệch (nhờ tính phân biệt tuyệt
  đối của nhiễu), nhưng tỉ lệ lệch thấp nên cần n lớn hơn nếu muốn
  đo tiếp (n=10 cho 48 frame — đủ để bác frame-swap, chưa đủ để
  phân biệt tinh vi giữa các nhóm con, vd 5 frame "thay toàn khung").

## 6. Giới hạn và nợ mở (trung thực)

1. **Backport parser: xong, đã kiểm chứng** (§2). Nợ L4 §6.6 ĐÃ ĐÓNG.
2. **Cơ chế lõi cache_stop: rõ hơn nhưng chưa đóng** (§4.3): đã xác
   định ranh giới sở hữu buffer và chứng minh transform không tự đọc
   được frame n+1 trong một lần gọi; nhưng "tại sao giữ ref frame
   cuối khử được race giữa stream" vẫn chưa có lời giải từ source.
3. **Aliasing offset dạng frame-swap: ĐÃ BÁC** (§5.2): 0/48 frame lệch
   khớp frame kề; thay vào đó là hỏng một phần của đúng frame (23
   chroma-only, 17 nhiễu nhỏ, 3 nửa dưới drain, 5 thay toàn khung
   không khớp gì). Nhóm 5 frame "thay toàn khung" chưa xác định được
   nội dung thay thế là gì (không khớp 150 frame CP/source, không
   blend, không shift ±64 px) — ghi nợ, không đoán.
4. **Artifact bilinear L4 §5.4: chưa gỡ** (§4.4): U/V +1 và đường chéo
   nội bộ chưa có lời giải từ source; probe §5 cho thấy race và
   artifact là 2 hiện tượng khác nhau (artifact tất định, race ngẫu
   nhiên theo tải + cụm biên GOP), nhưng gốc chung (đọc con trỏ trần)
   vẫn là giả thuyết.
5. **Endpoint crash vẫn mở.** 0 crash trong 20 run của luồng này;
   gộp F3+G3+H1+I1+J1+K10+L4+M3: **0/612 lần chạy** (Wilson 95% cận
   trên 0,62%). Mọi claim vẫn chỉ ở mức "khử biểu hiện pixel", không
   claim "khử crash".
6. **Không chạy tsc/vite build trong luồng này:** không sửa file
   production, không đụng file TS/TSX — chỉ sửa 2 harness JS + 1 file
   selfcheck JS + thêm 1 harness JS mới + 1 file LIMITS md. Parent
   kiểm chứng ở bước gộp như thường lệ.
7. Nợ chung các đợt trước (không thuộc luồng này): TTS 39 (CẤM kiểm
   lại); G1/G2; kernel Mitchell đã vào production (K2, đợt 83);
   ci-security.yml / ci-build.yml 403; release gate giữ nguyên
   (KHÔNG release/tag).

## 7. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round82_j1_vidstab_perframe_harness.js` —
  backport parser showinfo L4 §2.3.
- `server/render/src/test_round83_k10_vidstab_race_fix.js` —
  backport parser showinfo L4 §2.3.
- `server/render/src/test_round82_j1_perframe_harness_selfcheck.js` —
  thêm check 2b (fixture gán nhầm frame kề).
- `server/render/src/test_round85_m3_vidstab_aliasing_noise.js` —
  harness probe aliasing offset (mới; kế thừa K10 + split framemd5/rawvideo).
- `docs/PHASE9_ROUND85_M3_VIDSTAB_ALIASING_BACKPORT_LIMITS.md` — tài
  liệu này.

Không stage: cây đo `~/workspace/.scratch-r85m3/` (runs/, noise720.mp4,
noise720.framemd5, source.raw, analysis-perframe.json,
analysis-offset.json, gen_noise.py, analyze_noise.py), log luồng
`hidden_files/round85-m3.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.
