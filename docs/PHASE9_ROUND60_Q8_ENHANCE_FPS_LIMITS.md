# Đợt 60 Q8 — Đo render MP4 cho combo preset Enhance + FPS lặp lại + 1080p: LIMITS trung thực

Ngày đo: 2026-11-07 (lượt 1: 17:42–18:10; lượt 2: 18:13–18:30, giờ +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264).
Harness mới: `server/render/src/test_round60_q8_enhance_fps.js` —
**lượt 1: 151/153 pass; lượt 2 (harness đã sửa): 151/151 pass, exit 0**.
Đóng nợ đợt 59 §6.9 phần render (LIMITS P9 §7): đo FPS stabilize/
deinterlace lặp lại, đo render MP4 cho đúng combo preset P8, đo enhance
ở 1080p. Log đầy đủ 2 lượt tại
`workspace/goals/capcut-clone-video-editor/hidden_files/round60-q8/
r60q8-run2.log` (lượt 1) và `r60q8-run3.log` (lượt 2).

## 1. Kết luận ngắn

- Cả 3 preset P8 (**Nhẹ / Cân bằng / Mạnh**) và combo đầy đủ đều render
  THẬT ở cả 720p và 1080p: MP4 h264 đúng res/thời lượng, khác biệt đo
  được so với đối chứng (xem §3).
- **Preset nào dùng được thực tế (CPU-only, VM này): Nhẹ dùng được ở cả
  720p (~8.7 fps) và 1080p (~5.9 fps); Cân bằng/Mạnh chỉ dùng được ở
  720p (~5–6.5 fps) và rất chậm ở 1080p (~1.6–4.8 fps, clip 60s mất
  ~11–12 phút); combo đầy đủ tương đương Cân bằng/Mạnh.** Xem §2 + §6.
- **Phát hiện lớn nhất: render có stabilize KHÔNG xác định giữa các lần
  chạy** — `vidstabdetect` cho file `.trf` khác nhau trên cùng input
  giống hệt (79.7% LM entry khác, cả thứ tự cũng đổi), nên MP4 output
  lệch byte và frame lệch nhau tăng dần theo thời gian clip (§5). Khẳng
  định "encode xác định" ở P9 §4.3 chỉ đúng cho render không stabilize
  (P9 chỉ chạy lại denoise/control); render stabilize chưa bao giờ xác
  định. Đây là tính chất của vidstab, không phải bug của VCut — nhưng
  mọi so sánh pixel/byte giữa các lần render stabilize đều vô nghĩa nếu
  không ghi rõ "cùng một lần chạy".
- **Preset stabilize + speedKeyframes: KHÔNG phải "chỉ cảnh báo"** —
  render bị chặn hẳn bằng lỗi validation rõ ràng, exit 1, không tạo
  output (§4). Cảnh báo trên panel P8 nói đúng ("render sẽ bị chặn").
  Preset chỉ-denoise (Nhẹ) + speedKeyframes render OK.
- **FPS tuyệt đối dao động rất mạnh theo tải VM: đừng trích một con số.**
  Baseline 720p đo 28.8 fps (lượt 1, tải cao) và 51.1 fps (lượt 2, tải
  thấp) — chênh 1.78×; balanced-1080 đo 1.74 → 4.35 fps (2.5×). Chỉ tỉ
  lệ trong cùng một lượt mới có ý nghĩa, và ngay cả tỉ lệ đó cũng dao
  động ~2× giữa 2 lượt với preset stabilize (§2.3).

## 2. FPS render thật (clip 5s = 150 frame, veryfast/CRF23)

Nguồn: testsrc2 (baseline), testsrc2 + noise `alls=15` (Nhẹ),
shaky-upscale + noise (Cân bằng/Mạnh), testsrc2 60fps + `tinterlace` +
noise (combo). Nguồn shaky 720p/1080p đều upscale lanczos từ nguồn rung
P2 320x180 (tremor ±7px, seed cố định) — như P9, không phải footage rung
quay thật. Preset đúng giá trị `presets.ts` P8: Nhẹ = denoise 0.3;
Cân bằng = stabilize smoothing 10 + denoise 0.5; Mạnh = stabilize 20 +
denoise 0.8; combo = deinterlace + stabilize 30 + denoise 0.5. FPS =
150 / wall end-to-end (gồm pass vidstabdetect + khởi động node).
Mỗi cấu hình đo 2 lần/lượt × 2 lượt = 4 mẫu.

### 2.1 Bảng đầy đủ (mean 4 mẫu; min–max 4 mẫu)

| Cấu hình | 720p mean | 720p min–max | 1080p mean | 1080p min–max |
|---|---|---|---|---|
| baseline (không enhance) | 39.91 | 26.27–58.12 | 30.88 | 22.12–37.78 |
| **Nhẹ** (denoise 0.3) | **8.65** | 7.41–9.22 | **5.94** | 5.32–6.47 |
| **Cân bằng** (stab 10 + denoise 0.5) | **4.89** | 3.06–6.15 | **3.04** | 1.60–4.35 |
| **Mạnh** (stab 20 + denoise 0.8) | **6.54** | 5.30–7.24 | **3.33** | 1.75–4.83 |
| **Combo** (deint + stab 30 + denoise 0.5) | **6.73** | 5.84–7.80 | **3.25** | 1.84–4.56 |
| noisy-control (không enhance) | 11.38 | 9.60–12.98 | 5.57 | 4.12–6.64 |
| shakynoisy-control (không enhance) | 10.64 | 8.10–12.85 | 5.92 | 5.28–6.61 |
| interlaced-control (không enhance) | 52.08 | 40.54–64.38 | 28.03 | 22.94–32.75 |
| comb-control (không enhance) | 11.13 | 8.53–13.44 | 5.29 | 3.33–6.38 |
| flat-control (xám phẳng + nhiễu) | 11.04 | 8.31–13.12 | 6.07 | 5.35–6.34 |
| flat-denoise 0.5 | 12.07 | 10.38–13.94 | 7.16 | 5.51–7.85 |

Mean từng lượt (để thấy độ dao động giữa các lượt):

| Cấu hình | 720p lượt 1 → lượt 2 | 1080p lượt 1 → lượt 2 |
|---|---|---|
| baseline | 28.77 → 51.07 | 24.31 → 37.47 |
| Nhẹ | 8.17 → 9.13 | 5.43 → 6.45 |
| Cân bằng | 3.78 → 6.00 | 1.74 → 4.35 |
| Mạnh | 7.19 → 5.88 | 1.94 → 4.71 |
| Combo | 6.65 → 6.82 | 1.99 → 4.52 |
| noisy-control | 10.05 → 12.72 | 4.52 → 6.62 |
| shakynoisy-control | 8.45 → 12.83 | 5.34 → 6.51 |
| comb-control | 9.04 → 13.21 | 4.20 → 6.37 |

Độ dao động trong 1 lượt (2 lần chạy): thường 0–20%, cá biệt
balanced-720 lượt 1: 37.8% (3.06 vs 4.49 fps), comb-control-1080 lượt 1:
41.5% (3.33 vs 5.08 fps) — cả hai đều rơi vào lúc loadavg vọt lên
12–15 vì các luồng đợt 60 khác chạy song song.

### 2.2 So với đợt 59 P9 (720p, 1 lần đo)

| Cấu hình | P9 | Đợt này (4 mẫu) | Nhận xét |
|---|---|---|---|
| baseline | 47.86 | 26.27–58.12 | P9 nằm trong khoảng đợt này |
| denoise 0.5 (testsrc2 nhiễu) | 12.05 | — (preset Nhẹ dùng 0.3: 7.41–9.22) | không so trực tiếp (strength khác) |
| stabilize 30 | 6.82 | combo (stab 30): 5.84–7.80 | khớp |
| deinterlace | 24.70 | — (không đo deint riêng; combo chứa deint) | — |
| combo cả ba | 3.49 | 5.84–7.80 | đợt này NHANH hơn ~2× — do tải VM lúc đo thấp hơn, không phải do code nhanh lên (không sửa code render) |

### 2.3 Tỉ lệ trong cùng lượt (ổn định hơn số tuyệt đối — nhưng vẫn dao động)

Preset / đối chứng cùng nguồn, cùng lượt:

| Tỉ lệ | 720p lượt 1 → lượt 2 | 1080p lượt 1 → lượt 2 |
|---|---|---|
| Nhẹ / noisy-control | 0.81 → 0.72 | 1.20 → 0.97 |
| Cân bằng / shakynoisy-control | 0.45 → 0.47 | 0.33 → 0.67 |
| Mạnh / shakynoisy-control | 0.85 → 0.46 | 0.36 → 0.72 |
| Combo / comb-control | 0.74 → 0.52 | 0.47 → 0.71 |
| flat-denoise / flat-control | 1.15 → 1.06 | 1.12 → 1.23 |

Preset / baseline (cùng lượt): Nhẹ 0.18–0.28 (720p), 0.17–0.22 (1080p);
Cân bằng 0.12–0.13 (720p), 0.07–0.12 (1080p); Mạnh 0.12–0.25 (720p),
0.08–0.13 (1080p); combo 0.13–0.23 (720p), 0.08–0.12 (1080p).
**Mọi preset chỉ đạt ~1/8 đến ~1/4 tốc độ baseline.**

Hai điểm ngược trực giác, đo lặp lại ở cả 2 lượt:
- **Mạnh không chậm hơn Cân bằng một cách ổn định**: lượt 1 Mạnh nhanh
  hơn hẳn Cân bằng (7.19 vs 3.78 fps ở 720p; 1.94 vs 1.74 ở 1080p),
  lượt 2 hai preset ngang nhau (5.88 vs 6.00; 4.71 vs 4.35). Denoise
  0.8 khử nhiễu mạnh hơn → encoder nhẹ việc hơn, bù chi phí filter —
  cùng cơ chế P9 đã ghi (denoise có thể tăng tốc ròng trên nguồn nhiễu).
  Thứ hạng FPS giữa Cân bằng và Mạnh **không ổn định**, đừng xếp hạng
  hai preset này theo tốc độ.
- **Denoise trên nền phẳng nhanh hơn đối chứng ở cả 2 lượt** (tỉ lệ
  1.06–1.23×), ngược hướng với P9 (flat-denoise 5.14 vs flat-control
  6.38, tỉ lệ 0.81×). Không kết luận được hướng ổn định — tải VM lúc đo
  của P9 và đợt này khác nhau, và chênh lệch trong lượt 2 ở 720p chỉ
  ~6%. Ghi lại cả hai chiều để khỏi ai trích một chiều.

### 2.4 Suy ra thời gian render clip dài (ngoại suy tuyến tính từ wall mean 4 mẫu)

| Preset | 720p: clip 60s | 1080p: clip 60s |
|---|---|---|
| Nhẹ | ~3.5 phút | ~5.1 phút |
| Cân bằng | ~6.6 phút | ~12.2 phút |
| Mạnh | ~4.7 phút | ~11.0 phút |
| Combo | ~4.5 phút | ~10.9 phút |

Ngoại suy tuyến tính chưa kiểm chứng trên clip dài thật (pass detect
tuyến tính theo độ dài, nhưng chưa đo clip > 5s) — chỉ dùng để ước
lượng độ lớn, không phải cam kết.

## 3. Khác biệt đo được (cả 720p và 1080p, giống hệt ở cả 2 lượt)

- Denoise, nền phẳng: std frame giữa **4.439 → 1.986** (720p, đúng y
  hệt số P9 — nguồn + filter xác định) và **7.804 → 2.064** (1080p,
  giảm còn ~26%).
- Denoise, testsrc2 nhiễu (preset Nhẹ vs đối chứng): frame diff mean
  **3.406** (720p) / **3.019** (1080p), 11.4% / 9.9% pixel lệch > 8.
- Deinterlace (combo vs comb-control): idet prog **0.000 → 1.000** ở
  cả hai độ phân giải (đối chứng TFF 150/150; sau combo Progressive
  150/150).
- Stabilize (preset Cân bằng vs đối chứng, @1.0s): frame diff mean
  **21.5** (720p lượt 1) / **25.1** (720p lượt 2) / **30.6** (1080p
  lượt 2), 49–68% pixel lệch > 8 — transform đã áp rõ rệt.
- Mọi output: codec h264, đúng res, thời lượng 5.0s (±0s đo bằng
  ffprobe), file > 0 byte. Render không stabilize: byte giống hệt nhau
  giữa các lần chạy (vd noisy-control-720 đúng 11,343,705 byte cả 4
  lần; flat-denoise-720 đúng 5,023,677 byte cả 4 lần).

## 4. Preset stabilize + speedKeyframes (mục D)

- `validateSpec` chặn cả Cân bằng và Mạnh khi clip có speedKeyframes:
  `ok=false`, lỗi duy nhất nêu rõ `speedKeyframes không dùng chung
  được với enhance.stabilize (vidstab detect theo trim gốc, không khớp
  các đoạn ramp)` (cả validate.js và render.js đều chặn — defense in
  depth, đúng như comment code).
- Render thật preset Cân bằng + speedKeyframes (ramp 1→2 trên 5s):
  **exit 1**, stderr in thông báo lỗi rõ có dòng `❌ Spec không hợp lệ`,
  **không có stack trace thô**, **không tạo file MP4 output**. Đây là
  thất bại có kiểm soát (fail fast), không phải crash — nhưng cũng
  KHÔNG phải "chỉ cảnh báo": user bấm preset Cân bằng/Mạnh trên clip
  có speed curve sẽ không render được clip đó cho đến khi tắt stabilize
  hoặc bỏ speed curve. Cảnh báo trên panel P8 ("render sẽ bị chặn") mô
  tả đúng hành vi này.
- Đối chứng: preset Nhẹ (chỉ denoise) + cùng speedKeyframes render
  **OK** (lượt 1: 28.6s, 5.25 fps; lượt 2: 10.6s, 14.17 fps — chênh do
  tải; thời lượng 5s đúng). Denoise + ramp tương thích vì enhance
  pre-chain áp trước speed trong từng đoạn ramp.

## 5. Phát hiện: vidstabdetect không xác định (lý do 2 fail ở lượt 1)

Lượt 1 harness fail 2/153 check — cả hai đều là assert "combo render
xác định (byte giống hệt 2 lần)": combo-720 2,516,244 vs 2,517,833 byte
(lệch 1,589 byte); combo-1080 5,135,333 vs 5,130,601 byte (lệch 4,732
byte). Điều tra sau lượt 1, chạy trực tiếp lệnh detect y hệt
`runStabilizeDetect` 2 lần trên cùng file `shakynoisy720.mp4`:
- Hai file `.trf` cùng kích thước (505,766 byte) nhưng **md5 khác nhau**,
  khác từ dòng 7; **79.7% LM entry khác nhau** (9,953/12,481), kể cả
  tọa độ (x,y) — tức thứ tự danh sách local motion cũng đổi, không chỉ
  nhiễu số thực. Nguyên nhân nằm trong vidstabdetect của FFmpeg 8.1.2
  (thứ tự duyệt/hash nội bộ), không phải do VCut truyền tham số khác
  nhau — lệnh detect của VCut là xác định (cùng trim/shakiness/
  accuracy/stepsize/mincontrast).
- Hệ quả trên output: frame của 2 lần chạy preset Cân bằng lệch nhau
  **tăng dần theo thời gian clip** (720p lượt 2: mean abs diff 2.47
  @0.5s → 25.14 @2.5s → 31.36 @4.0s; 1080p lượt 2: 8.31 → 30.29 →
  30.45) — khớp cơ chế smoothing tích lũy: sai khác nhỏ ở `.trf` tích
  lũy qua bộ lọc làm mượt transform. Cả hai lần chạy đều stabilize thật
  (đều lệch lớn so với đối chứng, §3), nhưng stabilize ra **hai đường
  khác nhau**.
- Mức lệch byte output tùy lần chạy: combo-720 lượt 2 chỉ lệch 32 byte
  (2,518,308 vs 2,518,276), balanced-1080 lượt 2 lệch tới ~13%
  (3,739,215 vs 3,288,519 byte) dù wall time giống hệt nhau (34.51s cả
  hai). Không có quy luật "lệch ít hay nhiều" đoán trước được.
- Harness đã sửa: bỏ assert byte-identical cho combo, thay bằng ghi
  nhận `deterministic: false` + đo độ lệch frame r1-vs-r2 ở 3 mốc thời
  gian. Lượt 2 chạy lại toàn bộ: **151/151 pass, exit 0**. Lượt 1 vẫn
  giữ nguyên log để đối chiếu (2 fail đó chính là bằng chứng phát hiện).
- Hệ quả thực tế: **không dùng render stabilize để kiểm thử hồi quy
  byte-exact / pixel-exact**; so sánh stabilize chỉ có ý nghĩa thống kê
  (metric giảm jitter trên nhiều frame, như P2 đã làm ở 320x180) hoặc
  so trong cùng một lần chạy. Nợ mở: chưa đo xem `.trf` khác nhau có làm
  metric giảm jitter (redx/MAD) dao động bao nhiêu giữa các lần chạy.

## 6. Kết luận preset nào dùng được thực tế (CPU-only, VM này)

- **Nhẹ (denoise 0.3): dùng được.** 720p ~8.7 fps, 1080p ~5.9 fps
  (mean 4 mẫu); clip 1080p 60s ~5 phút. Không có pass phân tích, output
  xác định byte-exact. Là preset duy nhất tương thích speedKeyframes.
- **Cân bằng (stab 10 + denoise 0.5): dùng được ở 720p, cân nhắc ở
  1080p.** 720p ~4.9 fps (clip 60s ~6.6 phút); 1080p ~3.0 fps nhưng dao
  động 1.60–4.35 fps giữa các lần đo (clip 60s ~12 phút, có thể tệ hơn
  khi máy tải). Output không xác định giữa các lần chạy (§5).
- **Mạnh (stab 20 + denoise 0.8): tương đương Cân bằng về tốc độ**
  (720p ~6.5 fps, 1080p ~3.3 fps; thứ hạng giữa hai preset không ổn
  định, §2.3). Chọn Mạnh khi cần khử nhiễu mạnh hơn, không phải vì
  nhanh/chậm hơn.
- **Combo đầy đủ (deint + stab 30 + denoise 0.5): ~6.7 fps (720p) /
  ~3.3 fps (1080p)** — tương đương Cân bằng/Mạnh vì deinterlace gần
  như miễn phí (yadif); chi phí nằm ở stabilize + denoise. Chỉ bật khi
  nguồn interlaced thật (deinterlace không tham gia preset P8 là đúng
  thiết kế).
- **Deinterlace riêng: gần như miễn phí** — control interlaced render
  42–62 fps (720p) / 23–33 fps (1080p); yadif không làm chậm đáng kể
  so với baseline cùng nguồn (P9 đã đo 24.70 vs 25.84 fps).
- Ngưỡng thực tế trên VM này: preset có stabilize ở 1080p dưới ~5 fps
  nghĩa là preview/export theo thời gian thực là không thể; chỉ phù hợp
  render nền (background) cho clip ngắn hoặc chấp nhận chờ. Muốn nhanh
  hơn cần GPU encode (chưa test phần cứng thật) hoặc proxy/lower-res —
  ngoài phạm vi luồng này.

## 7. Giới hạn — đọc trước khi trích số

1. **FPS tuyệt đối dao động tới 2.5× giữa các lượt đo** (baseline 720p
   28.8 → 51.1; balanced-1080 1.74 → 4.35) vì tải VM thay đổi (loadavg
   0.3–15.6 trong lúc đo, các luồng đợt 60 chạy song song). Đừng trích
   FPS tuyệt đối trong bảng §2.1 như số lab-grade; chỉ tỉ lệ trong cùng
   một lượt mới tương đối ổn định, và ngay cả tỉ lệ preset/control của
   stabilize cũng dao động ~2× giữa 2 lượt (§2.3).
2. **FPS stabilize là end-to-end** (gồm pass vidstabdetect + khởi động
   node/render.js), không tách riêng chi phí detect/transform — nợ từ
   P9, vẫn chưa làm.
3. **Nguồn shaky là upscale** từ nguồn rung 320x180 của P2 (tremor cao
   tần ±7px), không phải footage rung quay thật ở 720p/1080p. Metric
   giảm jitter (redx/MAD) không đo lại ở đợt này — chỉ chứng minh
   transform chạy + đổi frame + FPS.
4. **Nguồn 1080p encode CRF 23, nguồn 720p CRF 18** (như P9): media
   nhiễu 1080p CRF 18 quá lớn (~150 Mbps, 5s ≈ 95MB) làm đầy /tmp
   (tmpfs 512M) khiến lượt chạy đầu fail "No space left on device" —
   xem §8. Chênh CRF nguồn giữa 2 độ phân giải có thể ảnh hưởng nhỏ
   đến FPS tuyệt đối (nguồn 1080p nén mạnh hơn → decode nhẹ hơn một
   chút), nhưng không ảnh hưởng tỉ lệ preset/control trong cùng độ
   phân giải.
5. **Ngoại suy clip 60s (§2.4) chưa kiểm chứng** trên clip dài thật.
6. **Render stabilize không xác định** (§5) — mọi assert byte/frame
   exact cho stabilize đều sai phương pháp; harness đã sửa theo hướng
   ghi nhận thay vì assert.
7. **Không sửa code app/render nào** trong luồng này (chỉ thêm harness
   đo + file LIMITS này) nên không chạy tsc/vite — không có gì để hồi
   quy. `enhance.js --self-test` không chạy lại (P9 đã pass, code không
   đổi).
8. Các giới hạn cũ trong `server/render/src/ENHANCE_LIMITS.md` và LIMITS
   P9 vẫn giữ nguyên (vidstab chỉ khử tremor cao tần biên độ nhỏ;
   hqdn3d strength cao có thể ghosting trên cảnh chuyển động nhanh —
   chưa đo; yadif `parity=-1` phụ thuộc flag field; GPU encode chưa test
   phần cứng thật).

## 8. Ghi chú harness (để luồng sau khỏi mất thời gian lặp lại)

- **/tmp là tmpfs 512M**: lượt chạy đầu fail giữa chừng khi encode
  media nhiễu 1080p CRF 18 ("No space left on device", 512M đầy bởi
  chính thư mục làm việc). Harness dùng thư mục scratch dưới
  `~/workspace/.scratch-r60q8-XXXX` (đã xóa sau khi đo xong) và nguồn
  1080p encode CRF 23. Các luồng đo render sau nên tránh os.tmpdir()
  khi media/output lớn.
- Harness chạy 2 lượt toàn bộ (44 render/lượt + media gen): lượt 1
  ~28 phút, lượt 2 ~17 phút (tải thấp hơn). Tổng cộng 88 render MP4
  thật + 2 lần detect `.trf` trực tiếp + đo frame diff r1-vs-r2.
- File tạm/render output đã xóa sau khi đo (2 thư mục scratch ~1GB
  mỗi cái); số liệu đầy đủ nằm trong 2 file log lượt chạy (đã copy vào
  `hidden_files/round60-q8/`) và file LIMITS này. Chạy lại:
  `node server/render/src/test_round60_q8_enhance_fps.js` (exit 0).

## 9. Cách chạy lại

```bash
node server/render/src/test_round60_q8_enhance_fps.js  # 151 check, ~20-30 phút
```

## 10. Nợ mở cho đợt sau

- Tách chi phí pass vidstabdetect vs transform (nợ từ P9 §7, vẫn chưa làm).
- Đo metric giảm jitter (redx/MAD) của stabilize lặp lại 2–3 lần để xem
  `.trf` không xác định làm metric dao động bao nhiêu (nợ mới từ §5).
- Đo denoise strength 0.3–0.7 trên footage chuyển động nhanh để kiểm
  chứng cảnh báo ghosting trong ENHANCE_LIMITS.md (nợ từ P9, chưa có số).
- Đo FPS enhance trên clip dài thật (> 5s) để kiểm chứng ngoại suy §2.4.
- Cân nhắc UX: preset Cân bằng/Mạnh trên clip có speedKeyframes hiện
  chỉ cảnh báo chữ trên panel nhưng render bị chặn hẳn (§4) — nếu muốn
  preset tự tắt stabilize khi gặp speed curve thì là quyết định UX riêng
  (P8 §5.3 đã ghi, chưa làm).
