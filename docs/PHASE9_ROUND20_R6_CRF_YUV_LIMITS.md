# Phase 9 đợt 20, luồng R6 — LIMITS: đo mịn crf + YUV-domain crf0 + --yuv cho text/effect

> Luồng R6 đợt 20 (luồng ĐO, không sửa code sản phẩm). Repo làm việc:
> `~/workspace/repo-1`, KHÔNG push GitHub, KHÔNG ghi qua GitHub
> connector, KHÔNG release/tag, KHÔNG code giả. Chỉ ĐO + mở rộng
> harness đo (dòng YUV thêm, không đổi kết luận RGB nào).
> FFmpeg đo: 8.1.2, libx264. Máy đo: VM này (số chỉ đúng máy này).
> KHÔNG sửa store.ts, nestUtils.ts, nestedPreview.ts, render worker,
> i18n, code sản phẩm web. KHÔNG stage vào paths-loop/, KHÔNG sửa
> build-loop-log.md (parent gộp/log sau).

## 0. Kết luận ngắn (không vượt số đo)

**Ngưỡng KHỚP miền YUV của dissolve e2e đã khóa chính xác: crf ≤ 14.**

- Quét mịn dissolve (preset medium, libx264, 1280×720, frame 45):
  crf13 = 1,5932 KHỚP, crf14 = 1,8094 KHỚP, crf15 = 2,0462 XẤP XỈ
  (vượt ngưỡng MAD 2 dù ≤8 vẫn 99,46% ≥ 99% — ngưỡng bị chặn bởi
  MAD, không phải bởi ≤8). Vậy khoảng (12, 18) của đợt 19 nay thu
  về đúng một bước: **crf14 là mức cao nhất còn KHỚP, crf15 đã
  không**. Không cần đo thêm bước nào giữa 14 và 15 (crf nguyên).
- **Preset ở crf12: cả 4 preset đều KHỚP miền YUV** — ultrafast
  1,1663 / medium 1,4079 / slow 1,4103 / veryfast 1,8753. Trái với
  crf18 (ultrafast tốt nhất 2,3776 vẫn XẤP XỈ), ở crf12 preset
  không còn quyết định tier — nhưng vẫn quyết định dung lượng:
  ultrafast 13,96 MB so với medium 10,09 MB (+38%) để đổi lấy
  MAD-YUV thấp hơn 0,24. Muốn KHỚP thì đổi crf là đủ; đổi preset
  ở crf12 chỉ là đánh đổi dung lượng/chất lượng trong vùng KHỚP.
- **YUV-domain ở crf0 cho dissolve (nợ G6 §7): đã đo — 0,0000.**
  Ghi chú trung thực: G4 đợt 19 thực ra đã đo ô này trong quét
  thô (0,0000); đợt này đo lại độc lập bằng script mới và tái
  tạo đúng 0,0000 ở cả 2 miền, nên nợ này nay khóa bằng 2 phép
  đo độc lập, không còn "chưa đo".
- **Tái tạo kiểm chứng đợt 19: lệch 0,0000 ở mọi ô đối chứng**
  (dissolve crf0/crf12/crf18 cả RGB lẫn YUV; circleopen crf18 cả
  2 miền). Phép đo mới khớp số cũ tới 4 chữ số thập phân — sai
  số ghi rõ: 0,0000, không phải "xấp xỉ".
- **--yuv đã nối sang text/effect (nợ G6 §4): V11 B, V12 B + C,
  V14 E (trừ noise/glitch).** Toàn bộ 4 case text + 16 case
  effect xác định đều có số YUV; tier YUV trùng tier RGB ở mọi
  case effect, và ở text có 2 case tier YUV CAO HƠN tier RGB
  (tiltIn/skewIn: RGB XẤP XỈ (PARTIAL) → YUV KHỚP) — nhưng đó là
  **hệ quả số học của công thức MAD-YUV, không phải parity tốt
  hơn** (xem §3.3: chữ trắng trên nền đen cho U = V = 0 nên
  MAD-YUV = MAD-Y / 1,5 đúng tới 4 chữ số). Không được trích
  "text KHỚP ở miền YUV" mà không kèm chú thích này.
- **Không đổi kết luận RGB nào:** log mặc định V11/V12/V14 sau
  khi nối --yuv giống hệt baseline trước khi sửa (diff = 0 sau
  khi lược tmp/ms), và log --yuv sau khi lược dòng YUV cũng
  giống hệt log mặc định. Mode YUV vẫn chỉ THÊM dòng, không
  tính vào FAIL/KẾT/counts.

## 1. Quét mịn crf dissolve — phương pháp (giữ nguyên đợt 19)

Cùng cặp file repo `server/render/examples/media/clip1.mp4` /
`clip2.mp4` (test pattern tổng hợp — smptebars/testsrc2 +
drawtext — KHÔNG phải footage thật), khung 1280×720, xfade
duration = 1 offset = 1, frame giữa n = 45 @30fps, p = 0,5.
Preview RGB tính bằng module thật của app (transitionPreview +
dissolveFrand, transpile qua tsc) như v19. Encode e2e mỗi ô:
`[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade:duration=1:
offset=1,format=yuv420p`, libx264, preset ghi rõ, pix_fmt
yuv420p, 2 giây @30fps. Mỗi ô đo 2 miền: (i) decode frame 45 ra
rgb24, so MAD RGB với preview; (ii) decode frame 45 ra yuv420p
raw, so MAD miền YUV với pipe render S1 chuyển sang yuv420p
bằng FFmpeg (kiểu S5b đợt 18 — KHÔNG dùng hàm JS `rgbToYuv420`
cho dissolve). Thang V6 (KHỚP = MAD ≤ 2 và ≥ 99% ≤ 8; XẤP XỈ =
MAD ≤ 20 và ≥ 90% ≤ 8; còn lại LỆCH) định nghĩa cho MAD RGB; số
miền YUV in kèm phân loại V6 CHỈ để tham chiếu, không phải
chuẩn badge mới.

Script: `benchmarks/measure_v20_crf_fine.cjs`, chạy 83 giây,
exit 0. Chạy từ gốc repo:

```
node benchmarks/measure_v20_crf_fine.cjs
```

## 2. Quét mịn crf + preset ở crf12 — bảng số đầy đủ

### 2.1. Dissolve, quét crf (preset medium)

| Ô encode (libx264) | Kích thước file 2s | MAD RGB (vs preview) | MAD miền YUV (Y / U / V; ≤8) |
|---|---|---|---|
| crf0 / medium | 10 297 610 B | 57,7793 / 24,93% LỆCH | **0,0000** (0 / 0 / 0; 100,00%) V6-tham-chiếu KHỚP |
| crf12 / medium | 10 093 566 B | 57,8721 / 25,02% LỆCH | **1,4079** (1,4652 / 1,2487 / 1,3380; 99,95%) KHỚP |
| crf13 / medium | 9 520 604 B | 57,9091 / 25,01% LỆCH | **1,5932** (1,6546 / 1,4201 / 1,5203; 99,88%) KHỚP |
| crf14 / medium | 8 950 221 B | 57,9414 / 25,04% LỆCH | **1,8094** (1,8827 / 1,6054 / 1,7199; 99,74%) KHỚP |
| crf15 / medium | 8 384 718 B | 57,9823 / 25,04% LỆCH | 2,0462 (2,1219 / 1,8370 / 1,9521; 99,46%) XẤP XỈ |
| crf16 / medium | 7 837 879 B | 58,0334 / 25,05% LỆCH | 2,2978 (2,3743 / 2,0850 / 2,2049; 98,97%) XẤP XỈ |
| crf17 / medium | 7 338 956 B | 58,1055 / 25,07% LỆCH | 2,5736 (2,6488 / 2,3638 / 2,4828; 98,14%) XẤP XỈ |
| crf18 / medium | 6 859 570 B | 58,2054 / 25,06% LỆCH | 2,8985 (2,9825 / 2,6657 / 2,7956; 96,72%) XẤP XỈ |

Đọc số: MAD-YUV tăng đều ~0,19–0,33 mỗi bước crf từ 12 lên 18
(1,4079 → 1,5932 → 1,8094 → 2,0462 → 2,2978 → 2,5736 →
2,8985), không có bước nhảy bất thường — ngưỡng cắt MAD = 2
rơi đúng giữa crf14 và crf15. Ở crf15, tiêu chí ≤8 (99,46%)
vẫn đạt ngưỡng KHỚP nên chỉ MAD quyết định tier; ở crf16 trở
đi cả 2 tiêu chí đều tụt (≤8 < 99% từ crf16: 98,97%). Miền RGB
vẫn LỆCH ở mọi crf (57,78 → 58,21): sàn subsample 4:2:0 của
đợt 19 không đổi, lượng tử hoá chỉ đóng góp ~0,4 trên nền đó.

### 2.2. Dissolve, quét preset ở crf12 (medium lấy từ §2.1)

| Ô encode (libx264) | Kích thước file 2s | MAD RGB (vs preview) | MAD miền YUV (Y / U / V; ≤8) |
|---|---|---|---|
| crf12 / ultrafast | 13 958 867 B | 57,9080 / 24,83% LỆCH | **1,1663** (1,1425 / 1,2157 / 1,2124; 100,00%) KHỚP |
| crf12 / veryfast | 10 190 648 B | 58,0808 / 24,78% LỆCH | **1,8753** (1,8309 / 1,9618 / 1,9663; 99,04%) KHỚP |
| crf12 / slow | 10 081 010 B | 57,8755 / 25,00% LỆCH | **1,4103** (1,4688 / 1,2518 / 1,3348; 99,95%) KHỚP |
| crf12 / medium (từ §2.1) | 10 093 566 B | 57,8721 / 25,02% LỆCH | **1,4079** (1,4652 / 1,2487 / 1,3380; 99,95%) KHỚP |

Đọc số: thứ tự preset ở crf12 GIỐNG thứ tự ở crf18 đợt 19
(ultrafast tốt nhất, veryfast tệ nhất), nhưng khoảng cách đổi
hẳn: ở crf12 veryfast vẫn KHỚP với biên 0,12 dưới ngưỡng MAD
(1,8753), trong khi ở crf18 nó tệ hơn medium tới 0,87 (3,7665
so với 2,8985). Không suy ra quy luật preset tổng quát từ 1
nội dung test pattern — chỉ ghi nhận: ở crf12, preset không
đổi tier; slow ≈ medium (chênh 0,0024, trong sai số làm tròn
của phép đo ở mức này).

### 2.3. Tái tạo kiểm chứng đợt 19 (script tự kiểm tra, in OK)

| Ô đối chứng | Đợt 19 (kỳ vọng) | Đợt 20 đo lại | Lệch RGB / YUV |
|---|---|---|---|
| dissolve crf0/medium, RGB / YUV | 57,7793 / 0,0000 | 57,7793 / 0,0000 | 0,0000 / 0,0000 OK |
| dissolve crf12/medium, RGB / YUV | 57,8721 / 1,4079 | 57,8721 / 1,4079 | 0,0000 / 0,0000 OK |
| dissolve crf18/medium, RGB / YUV | 58,2054 / 2,8985 | 58,2054 / 2,8985 | 0,0000 / 0,0000 OK |
| circleopen crf18/medium, RGB / YUV | 1,6648 / 0,4291 | 1,6648 / 0,4291 | 0,0000 / 0,0000 OK |
| S1 (a) dissolve / circleopen, RGB | 0,0057 / 0,3820 | 0,0057 / 0,3820 | 0,0000 OK |

Circleopen chỉ đo ô tái tạo crf18 (đối chứng, không quét mịn
— ngoài phạm vi nợ giao). Kích thước file các ô tái tạo cũng
trùng byte với đợt 19 (vd dissolve crf12: 10 093 566 B) —
encode xác định trên cùng máy/FFmpeg, không chỉ MAD trùng.

## 3. --yuv cho text/effect — kết quả

Đã nối mode `--yuv` dùng chung (`harnessShared.ffmpegYuvCompare`,
cả 2 phía qua cùng bộ chuyển FFmpeg) sang:

- V11 phần B (text, 320×180, chẵn — không pad): 4 case.
- V12 phần B (text, 320×180): 4 case — số YUV giống hệt V11 tới
  4 chữ số (cùng case, cùng code dùng chung).
- V12 phần C (effect, 72×48 / 78×39 / 72×45 — khung lẻ pad
  theo G6 §4, vd 72×45 → 72×46): 7 case.
- V14 phần E (effect, 72×45 → pad 72×46): 9 case xác định.
  Noise/glitch KHÔNG nối (thống kê: 2 phía nhiễu độc lập, số
  YUV so pixel vô nghĩa — giống lý do V14 vốn không so MAD cho
  2 case này mà dùng STAT-APPROX/STRUCT-OK).

Tổng dòng YUV mới: V11 `--yuv` 31 dòng (25 transition cũ + 4
text + 2 dòng thông báo mode), V12 40 dòng (26 transition cũ +
4 text + 7 effect + 3 thông báo), V14 24 dòng (13 transition cũ
+ 9 effect + 2 thông báo). Dòng YUV không tính vào FAIL/KẾT/
counts ở cả 3 harness.

### 3.1. Text (V11 = V12, số giống hệt nhau)

| Case (320×180, "TEST" trắng/nền đen) | MAD RGB | Tier RGB | MAD miền YUV (Y / U / V; ≤8) | Tier YUV |
|---|---|---|---|---|
| tiltIn @0,35s | 1,10 / 98,6% | XẤP XỈ (PARTIAL) | 0,6308 (0,9463 / 0 / 0; 99,10%) | KHỚP |
| skewIn @0,30s | 0,94 / 98,9% | XẤP XỈ (PARTIAL) | 0,5387 (0,8081 / 0 / 0; 99,30%) | KHỚP |
| slideReveal @0,50s | 0,93 / 99,5% | KHỚP (PASS) | 0,5297 (0,7945 / 0 / 0; 99,67%) | KHỚP |
| curtainIn @0,40s | 0,40 / 99,5% | KHỚP (PASS) | 0,2301 (0,3452 / 0 / 0; 99,69%) | KHỚP |

### 3.2. Effect (V12 C + V14 E)

| Case | MAD RGB | Tier RGB | MAD miền YUV (Y / U / V; ≤8) | Tier YUV |
|---|---|---|---|---|
| V12 pixelate k=6 (72×48) | 0,667 / 100,0% | KHỚP | 0,3177 (0,2396 / 0,1181 / 0,8299; 100,00%) | KHỚP |
| V12 pixelate k=13 (78×39) | 0,667 / 100,0% | KHỚP | 0,2893 (0,2167 / 0,0769 / 0,7923; 100,00%) | KHỚP |
| V12 mirror (72×45) | 0,000 / 100,0% | KHỚP | 0,0000 (0 / 0 / 0; 100,00%) | KHỚP |
| V12 rgb-shift s=9 (72×45) | 0,000 / 100,0% | KHỚP | 0,0000 (0 / 0 / 0; 100,00%) | KHỚP |
| V12 shake t=0 / t=0,5 (72×45) | 0,000 / 100,0% | KHỚP | 0,0000 (0 / 0 / 0; 100,00%) | KHỚP |
| V12 sharpen 0,5 (72×45) | 0,456 / 100,0% | KHỚP | 0,0932 (0,0851 / 0,1159 / 0,1027; 100,00%) | KHỚP |
| V14 pixelate k=9 (72×45) | 0,667 / 100,0% | KHỚP | 0,2748 (0,2201 / 0,0531 / 0,7150; 100,00%) | KHỚP |
| V14 mirror (72×45) | 0,000 / 100,0% | KHỚP | 0,0000 (0 / 0 / 0; 100,00%) | KHỚP |
| V14 rgb-shift s=9 (72×45) | 0,000 / 100,0% | KHỚP | 0,0000 (0 / 0 / 0; 100,00%) | KHỚP |
| V14 shake t=0 / t=0,5 (72×45) | 0,000 / 100,0% | KHỚP | 0,0000 (0 / 0 / 0; 100,00%) | KHỚP |
| V14 sharpen t=0,5 (72×45) | 0,456 / 100,0% | KHỚP | 0,0932 (0,0851 / 0,1159 / 0,1027; 100,00%) | KHỚP |
| V14 sharpen t=1 (72×45) | 0,466 / 99,8% | KHỚP | 0,0958 (0,0851 / 0,1304 / 0,1039; 100,00%) | KHỚP |
| V14 edgedetect step (72×45) | 0,315 / 99,9% | KHỚP | 0,1763 (0,2645 / 0 / 0; 99,92%) | KHỚP |
| V14 edgedetect natural (72×45) | 3,815 / 94,5% | XẤP XỈ | 2,1377 (3,2065 / 0 / 0; 96,42%) | XẤP XỈ |

Đối chiếu chéo: sharpen 0,5 cho cùng số YUV 0,0932 ở V12 và
V14 (cùng filter, cùng nguồn pattern) — mode dùng chung tái
lập được qua 2 harness. Mirror/rgb-shift/shake cho 0,0000 ở
cả 2 miền ở cả 2 harness — parity tuyệt đối, không phải xấp
xỉ.

### 3.3. Cảnh báo đọc số — MAD-YUV bị loãng bởi mặt phẳng chroma

Công thức `yuv420Mad`: mẫu số = 1,5·W·H (Y + U + V, U/V mỗi
mặt phẳng bằng 1/4 số pixel). Với nội dung mà chroma gần như
không lệch (chữ trắng trên nền đen, edgedetect ra ảnh xám),
U = V = 0 nên MAD-YUV = MAD-Y / 1,5 đúng tới 4 chữ số: tiltIn
0,9463/1,5 = 0,6308; skewIn 0,8081/1,5 = 0,5387; edgedetect
natural 3,2065/1,5 = 2,1377. Hệ quả:

- Tier YUV của tiltIn/skewIn lên KHỚP trong khi tier RGB chỉ
  XẤP XỈ (PARTIAL) — đó là loãng mẫu số, không phải bằng chứng
  parity tốt hơn. Trích tier YUV cho text mà không kèm chú
  thích này là trích sai lệch.
- Ngược lại, edgedetect natural giữ nguyên tier XẤP XỈ ở cả 2
  miền (dù số YUV nhỏ hơn) — tier trùng không có nghĩa số đo
  trùng.
- Pixelate là ngoại lệ đáng ghi: MAD-YUV (0,27–0,32) THẤP HƠN
  MAD RGB (0,667) nhưng V lại cao nhất (0,71–0,83) — dư tập
  trung ở chroma, đúng quirk trộn chroma của swscale mà G6 §6
  đã truy nguyên (downscale neighbor + chroma lân cận). Số này
  nhất quán với kết luận G6, không mâu thuẫn.
- Khung lẻ pad (72×45 → 72×46) loãng MAD thêm ~2,2% mẫu giống
  hệt nhau (G6 §4) — cả 2 phía pad giống nhau nên tier các
  case đã đo không đổi (toàn cách xa ngưỡng, trừ edgedetect
  natural vẫn XẤP XỈ ở cả 2 miền), nhưng case nào sát ngưỡng
  thì phải tính độ loãng này khi đọc.

## 4. Kiểm chứng đã chạy (lệnh + kết quả)

- `node --check` cho 4 file sửa/mới (measure_v20, V11, V12, V14):
  pass.
- Baseline trước sửa (log mặc định): V11 29 case FAIL 0; V12 37
  case FAIL 0; V14 KHỚP 21, XẤP XỈ 1, LỆCH 0 — khớp KẾT đợt 19 G6.
- Sau sửa, chạy mặc định: V11/V12/V14 exit 0, log giống hệt
  baseline sau khi lược tên thư mục tmp + thời gian render ms
  (diff = 0 cả 3 file). Không đổi dòng RGB, không đổi counts.
- Chạy `--yuv` sau sửa: V11/V12/V14 exit 0; lược bỏ các dòng
  `[YUV-FFmpeg]` + dòng thông báo mode → log giống hệt log mặc
  định (diff = 0 cả 3 file). Mode YUV chỉ thêm dòng.
- `node benchmarks/measure_v20_crf_fine.cjs` (từ gốc repo):
  exit 0, 83 s; 4/4 ô tái tạo đợt 19 in OK, lệch 0,0000; thư
  mục /tmp của script tự xoá khi xong.
- KHÔNG chạy tsc/vite build: luồng không sửa code TS nguồn web
  hay code sản phẩm nào (chỉ script đo JS + harness JS + docs)
  — không có gì để tsc/build kiểm chứng thêm; không mạo nhận.
  KHÔNG chạy click-test browser thật (nợ mở chung của repo).
- KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG stage vào
  paths-loop/, KHÔNG sửa build-loop-log.md (parent gộp sau).

## 5. Nợ còn lại / câu hỏi mở (trung thực)

- Chỉ đo dissolve cho quét crf mịn + preset crf12 (đúng phạm vi
  nợ G4 §6). Circleopen chỉ có ô tái tạo crf18 — không claim
  ngưỡng crf của type khác, không claim cho footage thật,
  1080p/4K, codec khác (x265/VP9/AV1), hay preset khác (fast,
  medium đã có, superfast/faster chưa đo ở crf12).
- 2 case thống kê V14 (noise, glitch) vẫn chưa có dòng YUV —
  cố tình bỏ (nhiễu độc lập, so pixel vô nghĩa); nếu đợt sau
  muốn số YUV cho chúng thì phải định nghĩa lại tiêu chí thống
  kê trong miền YUV, không phải chỉ thêm dòng so MAD.
- Tier YUV vẫn là V6-tham-chiếu, không phải chuẩn badge mới —
  không dùng số §3 để sửa file badge/previewStatus.
- Thang V6 áp cho MAD-YUV bị loãng bởi mặt phẳng chroma (§3.3):
  với nội dung xám/trắng-đen, cùng một mức lệch luma cho tier
  YUV cao hơn tier RGB một cách hệ thống. Nếu đợt sau muốn
  chuẩn YUV riêng thì phải định nghĩa lại ngưỡng trên MAD-Y
  hoặc trên từng mặt phẳng, không dùng chung ngưỡng MAD RGB.
- Số chỉ đúng với FFmpeg 8.1.2 trên máy này; swscale khác phiên
  bản có thể cho số khác ở chữ số cuối.

## 6. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `benchmarks/measure_v20_crf_fine.cjs` (MỚI — quét mịn crf
  13–17 + preset ở crf12 + ô crf0/crf12/crf18 tái tạo đợt 19,
  dissolve + circleopen đối chứng; 83 s).
- `server/render/src/test_v11_parity.js` (SỬA — nối `--yuv`
  sang phần B text: 4 dòng YUV + 1 dòng thông báo; logic cũ
  nguyên vẹn, log mặc định giống hệt baseline).
- `server/render/src/test_v12_parity.js` (SỬA — nối `--yuv`
  sang phần B text (4 dòng) + phần C effect (7 dòng) + 2 dòng
  thông báo; logic cũ nguyên vẹn).
- `server/render/src/test_v14_parity.js` (SỬA — nối `--yuv`
  sang phần E effect: helper `yuvLineFor` + 9 dòng YUV + 1 dòng
  thông báo; cập nhật comment header §E; logic cũ nguyên vẹn,
  noise/glitch cố tình không nối).
- `docs/PHASE9_ROUND20_R6_CRF_YUV_LIMITS.md` (MỚI — file này).
- KHÔNG sửa file nào khác. Đặc biệt: không sửa
  `harnessShared.js` (helper dùng chung đã đủ, không cần thêm),
  không sửa code sản phẩm web/render/store/spec, không sửa file
  i18n, không sửa script đo của G4, không sửa build-loop-log.md,
  không tạo file trong paths-loop/.
