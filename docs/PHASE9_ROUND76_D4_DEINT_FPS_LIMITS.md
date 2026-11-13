# Đợt 76 D4 — Deinterlace deint-only qua half-res intermediate: LIMITS trung thực

Ngày đo: 2026-11-09 (giờ VN). Máy đo: VM này (CPU-only, Chromium 158
qua Xvfb + CDP, FFmpeg 8.1.2). Đóng nợ đợt 75 §4 mục 4 (FPS deint-only
đợt 75 C8 — xem docs/PHASE9_ROUND75_C8_ENHANCE_PREVIEW_LIMITS.md §7.1
+ docs/PHASE9_ROUND75_LIMITS.md §4.4).

## 1. Kết luận ngắn

- **Nợ C8 CHƯA đóng trọn vẹn — kết quả chia hai:** chất lượng khử
  combing ĐẠT và VƯỢT C8 (headed R **0.74 → 0.51**, C8 offscreen là
  0.74 → 0.54, yadif 0.57), nhưng **FPS deint-only 0.72–0.73× vẫn
  FAIL ngưỡng 0.75×** (2 lần headed half-res: 0.73× và 0.72×; giữ
  ngưỡng, KHÔNG nới). Half-res vẫn **vượt hẳn đường offscreen C8
  trên cả hai trục** (R 0.51 < 0.54, FPS 0.72–0.73× > 0.65–0.71×) nên
  được giữ làm đường deint-only mới — nhưng G5 vẫn ghi FAIL trung thực.
- Đường đi tới kết luận này có **2 phương án đã thử và LOẠI bằng số
  đo thật** (xem §2.2–§2.3): nội tuyến offset +0.5px vào lần vẽ cuối
  (FPS 0.99× nhưng R không giảm ở upscale) và SVG blur dọc σy 0.8
  trên lần vẽ cuối (R tốt ở mọi tỉ lệ nhưng thông lượng tốn ~7×).
- Các số đo thêm đều xong: tap ở tỉ lệ 0.75 (probe + headed đúng
  0.75), footage thật Big Buck Bunny interlaced (idet TFF 294),
  tap+mask/SR/motion-blur ở tỉ lệ ≥ 0.9, Firefox (y hệt Chromium).
  **Chưa đo:** Safari/WebKit thật (không khởi động được trên VM này —
  thiếu lib hệ thống, xem §5.4) và tap+motion-blur-blend lúc đang
  phát (gate đợt 62 R3 chỉ blend khi phát; case pause không khóa
  được nhánh này).

## 2. Thay đổi code

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | `enhancePreviewPlan`: `needsOffscreen` nay chỉ true khi alpha > 0 hoặc zoom != 1 — tap đơn lẻ KHÔNG cần offscreen enhanceCanvas nữa (tín hiệu cho preview.tsx qua half-res). Không đổi shape plan (vẫn 10 key), không đổi ngưỡng 0.9 / offset 0.5px (offset vẫn dùng trong đường offscreen khi tap đi kèm denoise/stabilize). Comment đầu file ghi rõ lịch sử 3 phương án. |
| `apps/web/src/preview.tsx` | `deintHalfResSource()` mới (canvas tái dùng `deintHalfCanvas`, khổ dw×ceil(dh/2), `imageSmoothingQuality high`); `drawVideoClip`: khi `deinterlaceTap && !needsOffscreen` thì drawSrc qua half-res (đặt `srcAtLetterbox=true` để đường chuẩn hoá C1 không vẽ thêm lần nữa), các nhánh vẽ sau (thường/mask/SR/motion-blur) không đổi gì. Bản inline-shift (`deintInlineDy`) đã thử trong đợt này rồi BỎ — chỉ còn nhắc trong comment lịch sử, không còn code chạy. |
| `apps/web/src/components/enhance/enhancePreview76D4.test.ts` | **Mới**: 10 test khóa tín hiệu half-res (tap true + needsOffscreen false khi deint đơn lẻ / +denoise 0 / +stabilize bị chặn bởi speed ramp; tap kèm denoise/stabilize vẫn offscreen true; dưới ngưỡng/toggle tắt → không tap; hook debug phân biệt half-res/offscreen). |
| `apps/web/src/components/enhance/enhancePreview75C8.test.ts` | Cập nhật 2 test deint-đơn-lẻ ở scaleY 0.9/1.125: `needsOffscreen` true → false; test deint+speedKeyframes thêm assert `needsOffscreen` false; hook debug: `offscreenApplied` true → false cho deint đơn lẻ. |
| `apps/web/src/components/enhance/enhancePreview60Q1.test.ts` | Chỉ sửa comment (needsOffscreen nay chỉ true khi alpha > 0 hoặc zoom != 1). |
| `apps/web/scripts/clicktest-76d4-deint-fps.mjs` | **Mới** (dựa trên harness C8): G0 2 chế độ (main scaleY ≥ 0.9 / scale075 qua `D4_WINDOW`), G2/G5/G7/G8 kiểm tra half-res (`offscreenApplied=false`), G6 tap-off ở tỉ lệ < 0.9, G7 tách thành G7a (SR-only: R giảm) + G7b (mask-only: không hồi quy), G8 footage BBB thật. Sửa bug scope `fpsSlots` (khai ngoài khối `if (mainMode)` để report cuối hàm đọc được — lần chạy 1 crash ở bước ghi report vì bug này, số đo đã lưu trong log). |
| `apps/web/scripts/ff-tap-check-76d4.mjs` | **Mới**: kiểm chứng tap trên Firefox + WebKit bằng playwright-core (browser lấy từ cache `~/.cache/ms-playwright`; playwright-core cài riêng, xem header file). |
| `apps/web/scripts/probe-76d4-deint.mjs` | **Mới** (dựa trên probe C8 + thêm): `tapAt075` (R của tap ở 960×540) và 2 video BBB (interlaced + clean) vào vòng probe; render yadif ground truth chạy lại cho interlaced720. |
| `apps/web/scripts/probe-76d4b-inline-scale.mjs` | **Mới**: inline-shift R theo tỉ lệ vẽ s ∈ {0.9, 1.0, 1.13, 1.25, 1.5} + SVG σy 0.8 (R + thông lượng ms/draw). |
| `apps/web/scripts/probe-76d4c-halfres.mjs` | **Mới**: half-res R + vgrad + thông lượng ở s ∈ {1.0, 1.13, 1.5}. |

Không đụng spec/render/store/i18n (dict giữ 2413/2413, không thêm key).
Không đụng `ci-security.yml`/workflow. Không binary vào batch.

## 3. Số đo thật

### 3.1 Probe D4 — tap ở 0.75 + footage BBB thật (`probe-76d4-deint.mjs`)

Kế thừa probe C8 (chạy lại, số khớp): interlaced720 noop R
1.05/1.10/1.20 (mean 1.12), tap1 0.66/0.67/0.68 (mean 0.67); clean
noop 0.73/0.70/0.64, tap1 0.63/0.61/0.59; yadif render thật chạy lại:
18.1s wall (8.29 fps), idet prog **0.993** (TFF=1 Prog=149), đối
chứng prog 0 — khớp C8.

**Tap ở tỉ lệ 0.75 (960×540, 3 mốc):**

| Video | noop R | tap R | Chênh |
|---|---|---|---|
| interlaced720 | 0.83 / 0.82 / 0.83 (mean 0.83) | 0.77 / 0.77 / 0.77 (mean 0.77) | −0.06 |
| clean720 | 0.74 / 0.71 / 0.68 (mean 0.71) | 0.68 / 0.66 / 0.64 (mean 0.66) | −0.05 |

Gap inter−clean ở 0.75: noop 0.12 (khớp sweep C8), tap sẽ chỉ còn
0.06 — tức **bỏ qua tap ở 0.75 chỉ thiệt ~0.06 R**, nhỏ hơn nhiều so
với ở 1:1 (gap 0.43). Ngưỡng 0.9 giữ nguyên là hợp lý (xem §4.1).

**Footage thật — Big Buck Bunny 720p** (tải từ test-videos.co.uk,
progressive 30fps → `minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc`
→ `tinterlace=interleave_top`; **idet TFF=294 BFF=0 Prog=0 Und=4**
— nội dung thật, không phải testsrc2; lưu ý minterpolate làm mượt
chuyển động nên răng cưa yếu hơn footage xen kẽ gốc — xem §5.3):

| Video | noop R (3 mốc) | tap1 R | vgrad noop → tap1 |
|---|---|---|---|
| bbb-interlaced720 | 0.59 / 0.61 / 0.59 (mean 0.60) | 0.56 / 0.56 / 0.55 (mean 0.56) | 6.03 → 5.20 (giữ ~85%) |
| bbb720 (clean) | 0.59 / 0.59 / 0.59 (mean 0.59) | 0.56 / 0.56 / 0.56 (mean 0.56) | 6.39 → 5.41 (giữ ~85%) |

Gap inter−clean trên BBB chỉ **0.01** — metric C/S gần như không
phân biệt được BBB interlaced với BBB progressive ở các mốc đo (nội
dung hoạt hình + minterpolate đã làm mượt). Tap vẫn đổi pixel thật
(MAD vs noop 3.05–3.14, cao hơn testsrc2 là 2.0–2.2) và R giảm nhẹ
0.60 → 0.56. Kết luận về "khử combing trên footage thật" vì vậy
chỉ dựa được vào MAD + R giảm nhẹ, không dựa vào gap như testsrc2.

### 3.2 Phương án đã LOẠI — inline-shift + SVG filter (`probe-76d4b`)

**Inline-shift** (lệch +0.5 đơn vị project = +0.5·s px đích, đúng
như `deintInlineDy` đã thử): R interlaced theo tỉ lệ vẽ s:

| s | 0.9 | 1.0 | 1.13 | 1.25 | 1.5 |
|---|---|---|---|---|---|
| noop R | 0.92 | 1.05 | 0.85 | 0.80 | 0.71 |
| shift R | 0.92 | **0.66** | 0.88 | 0.82 | 0.70 |

Shift **chỉ có tác dụng ở s≈1.0** (1.05 → 0.66, đúng bằng tap
offscreen). Cơ chế: ở 1:1, mỗi hàng đích lấy đúng giữa 2 hàng nguồn
(trọng số 0.5/0.5 → triệt tiêu xen kẽ); ở upscale, mỗi hàng đích đã
nội suy 2 hàng nguồn với trọng số thay đổi đều theo hàng, lệch pha
0.5 hàng không đổi phân bố trọng số nên biên độ combing trung bình
giữ nguyên. Ở downscale 0.9, downscale đã trung bình sẵn nên shift
cũng không thêm gì. Headed lần 1 xác nhận trong app: FPS 0.99×
nhưng R 0.74 → 0.74 (MAD 0.82 — pixel đổi nhưng combing không giảm),
G7 R 0.5 → 0.5, G8 R 0.55 → 0.55. **Kết luận: single-draw phase-shift
không thể tái tạo tap, trừ đúng s=1.0 — LOẠI.**

**SVG feGaussianBlur σy 0.8 trên lần vẽ cuối** (cùng 1 drawImage):
R 0.53–0.55 ở MỌI tỉ lệ (0.9/1.0/1.13/1.25/1.5) — chất lượng đạt,
nhưng thông lượng: ở s=1.13 là **49–52 ms/draw so với 6.8 ms vẽ
thường (~7.2×)**, ở s=1.0 là 34–112 ms so với 0.4–2.4 ms (41–82×;
noop ở 1:1 có fast-path copy gần như miễn phí nên tỉ lệ phóng đại,
nhưng tuyệt đối vẫn chậm). **LOẠI — FPS sẽ còn tệ hơn offscreen.**

### 3.3 Phương án CHỐT — half-res intermediate (`probe-76d4c`)

Vẽ video xuống canvas dw×(dh/2) rồi vẽ lên khổ đích. R + vgrad
(mốc 1.0s) và thông lượng (60 lần vẽ cùng frame, ms/draw):

| s | interlaced noop → half | clean noop → half | vgrad clean giữ | Thông lượng half/noop (s=1.13) |
|---|---|---|---|---|
| 1.0 | 1.05 → **0.43** | 0.73 → 0.45 | 37% (0.928 → 0.347) | 1.51× (interlaced; clean 7.42× do noop 1:1 fast-path) |
| 1.13 | 0.85 → **0.66** | 0.68 → 0.63 | 73% (0.621 → 0.454) | **0.49×** (3.75 vs 7.67 ms) / clean 0.50× |
| 1.5 | 0.71 → **0.43** | 0.66 → 0.44 | 52% (0.528 → 0.272) | — |

R half-res rơi vào băng progressive ở mọi tỉ lệ (interlaced ≈ clean
cùng khổ: 0.43≈0.45, 0.66≈0.63, 0.43≈0.44). **Nhưng lưu ý:** thông
lượng probe (vẽ lặp cùng 1 frame đứng yên) **nói quá tốc độ half-res
trong app thật** — ở s=1.13 probe cho half nhanh gấp đôi vẽ thường
(lấy mẫu từ canvas rẻ hơn từ video element khi frame đã cache), còn
headed trong app (§3.4) cho FPS chỉ 0.72–0.73×. Bài học: đo throughput
bằng frame lặp không đại diện cho phát thật (mỗi tick là frame mới
+ decode + các clip khác + overhead tick); chỉ số headed mới là số
đọc được cho FPS.

**Đánh đổi chất lượng:** half-res mềm dọc hơn tap C8. vgrad clean
giữ 73% ở s=1.13 (bằng tap C8 ở 1:1 là 73%), nhưng chỉ 37% ở s=1.0
và 52% ở s=1.5; vgrad interlaced ở s=1.13 giữ 59% (0.95 → 0.557 —
phần giảm gồm cả năng lượng combing bị triệt). Chỉ clip bật
deinterlace mới chịu mềm dọc này; bản render vẫn dùng yadif thật,
không ảnh hưởng.

### 3.4 Headed trong app — half-res (`clicktest-76d4-deint-fps.mjs`)

Cửa sổ 2560×1440, canvas backing 1991×815, tỉ lệ thật 1.132, clip 1
= interlaced720.mp4, playhead 1.0s, pause. Hai lần chạy chính
(lần 2 và lần 3; lần 1 là bản inline-shift đã bỏ — xem §3.2):

| Case | Lần 2 | Lần 3 |
|---|---|---|
| G0 canvas đủ lớn (scaleY 1.132) | PASS | PASS |
| G1 baseline: R inter − R clean | 0.74 − 0.60 = **0.14** | giống hệt |
| G2 deint BẬT: R →, MAD, hook | R **0.74 → 0.51**, MAD 0.6087, tap=true offscreen=false | giống hệt (R 0.51, MAD 0.6087) |
| G3 tắt lại: MAD vs A | 0 | 0 |
| G4 progressive + deint: R | 0.51 | 0.51 |
| G5 FPS deint-only (drift-corrected) | 0.84/0.69/0.66 → **0.73×** (baseline mean 24.23 fps) | 0.79/0.64/0.73 → **0.72×** (baseline mean 7.74 fps; slot B 6.31/8.45/6.97/9.24, I 5.83/4.97/5.95) |
| G7a tap + scale-keyframes (SR): R →, MAD | (chưa tách — xem lần 1) | R **0.68 → 0.51**, MAD 0.6944 |
| G7b tap + mask rect: \|ΔR\|, MAD | (chưa tách) | R 0.5 → 0.5 (\|ΔR\| 0.00), MAD 0.0036 |
| G8 BBB thật: R →, MAD | R 0.55 → 0.52, MAD 1.4826 | giống hệt |
| H9 0 lỗi trang | PASS | PASS |
| **Tổng** | **7/9** (G5 + G7-cũ FAIL) | **9/10 (chỉ G5 FAIL)** |

- **G2 PASS cả 2 lần, số pixel lặp lại y hệt:** R 0.74 → 0.51
  (tốt hơn C8 offscreen 0.74 → 0.54; yadif 0.57), MAD 0.6087.
  G3: tắt toggle trả đúng khung gốc (MAD 0). G4: R 0.51 trên footage
  progressive (probe clean tap1 0.61 ở 1:1).
- **G5 FAIL cả 2 lần (giữ ngưỡng 0.75×, không nới): 0.73× và
  0.72×.** Mọi đường 2 lần vẽ đều tốn ~28% FPS trên VM này
  (offscreen C8: 0.65–0.71×; half-res: 0.72–0.73×). Half-res nhỉnh
  hơn offscreen ~0.05× nhưng vẫn dưới ngưỡng. Đây là giới hạn của
  kiến trúc 2 lần vẽ trên SwiftShader CPU, không phải của riêng
  một phương án — xem §6.
- **G7a PASS (lần 3):** tap + scale-keyframes 1.2 (+motion-blur đã
  cấu hình, pause): R 0.68 → 0.51, MAD 0.6944, hook tap=true
  offscreen=false — nhánh SR qua half-res hoạt động.
- **G7b PASS (lần 3):** tap + mask rect: R 0.5 → 0.5, MAD 0.0036 —
  **MAD ≈ 0 là ĐÚNG, không phải lỗi:** mask unit 640×360 downscale
  dọc 2× nên răng cưa đã bị trung bình hết ngay cả khi deint TẮT
  (R_off đã thấp 0.5); half-res không đổi gì thêm. Tiêu chí case này
  là không-hồi-quy (|ΔR| ≤ 0.05, MAD < 0.05), không phải R giảm.
  (Lần 1–2 dùng tiêu chí cũ "R giảm + MAD > 0.5" cho combo mask+SR
  nên FAIL oan: R 0.5 → 0.5, MAD 0.005–0.39.)
- **G8 PASS cả 2 lần:** BBB R 0.55 → 0.52, MAD 1.4826 — khớp
  probe (§3.1: R 0.60 → 0.56, MAD ~3.1 ở 1:1; trong app upscale
  1.13× nên MAD nhỏ hơn).
- Bug harness lần 1: `fpsSlots` khai trong khối `if (mainMode)` nên
  report cuối hàm crash `ReferenceError` — đã sửa (khai ngoài khối);
  số đo lần 1 vẫn còn trong log headed (`/tmp/round76-d4/` + log
  trong `hidden_files/round76-d4/headed/`).

### 3.5 Tap ở tỉ lệ 0.75 — headed đúng 0.75 (`D4_WINDOW=2000x1165`)

Canvas backing 1431×540, scaleY **= 0.75** đúng: tap KHÔNG áp —
hook tap=false, MAD khi bật deint = **0**, gap R interlaced −
clean = 0.09 (0.65 vs 0.56; sweep probe C8 ở 0.75: gap 0.12).
Chạy cửa sổ 1700×1000 (scaleY 0.521) cũng 3/3 PASS, gap 0.04,
MAD 0. Kết hợp probe tapAt075 (§3.1: tap ở 0.75 chỉ giảm R 0.83 →
0.77): ngưỡng 0.9 giữ nguyên, thiệt hại ở 0.75 là nhỏ và có số đo.

### 3.6 Firefox / WebKit (`ff-tap-check.mjs`, playwright-core + browser cache)

- **Firefox 1572: R Y HỆT Chromium** — interlaced noop 1.05/1.10/
  1.20 → tap 0.66/0.67/0.68; clean noop 0.73/0.70/0.64 → tap
  0.63/0.61/0.59. Tap dọc +0.5px (bilinear) hoạt động giống nhau
  trên Firefox và Chromium (cùng số tới 2 chữ số thập phân).
- **WebKit (Safari-ish): KHÔNG đo được** — MiniBrowser khởi động
  thất bại: `libwebkitgtk-6.0.so.4: cannot open shared object file`
  (thiếu lib hệ thống trên VM này). Safari thật vẫn chưa kiểm chứng.

## 4. Kiểm chứng (cây đã gộp code D4)

| Kiểm chứng | Kết quả |
|---|---|
| Unit mới `enhancePreview76D4.test.ts` vi + en | **10/10 + 10/10** |
| C8 `enhancePreview75C8.test.ts` vi + en (đã cập nhật) | **14/14 + 14/14** |
| Q1 `enhancePreview60Q1.test.ts` vi + en | **16/16 + 16/16** |
| 61R3 `enhancePreview61R3.test.ts` vi + en | **7/7 + 7/7** |
| 62R3 `enhancePreview62R3.test.ts` vi + en | **10/10 + 10/10** |
| 63R3 `enhancePreview63R3.test.ts` vi + en | **8/8 + 8/8** |
| P8 `enhancePresets59P8.test.ts` vi + en | **21/21 + 21/21** |
| R2 `enhanceSpeedBlock61R2.test.ts` vi + en | **9/9 + 9/9** |
| `previewEngine.test.ts` | **14/14** |
| css60 / css61 | **59/59 / 60/60** |
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `vite build` | **pass** (7.47s; cảnh báo chunk >500kB có từ trước) |
| `r6-i18n-check.cjs` | **PASS** — dict vi=en=**2413** (không thêm key) |
| Headed D4 main (half-res, 2 lần) | 7/9 → 9/10 (chỉ G5 FAIL, xem §3.4) |
| Headed D4 scale075 (0.521 + đúng 0.75) | **3/3 + 3/3** |
| Headed Q1 / Combo 61R3 (hồi quy) | **7/7 / 9/9** |
| Probe D4 / probe-b / probe-c | xong (xem §3.1–§3.3) |
| Firefox tap check | y hệt Chromium (xem §3.6) |

## 5. Giới hạn — đọc trước khi trích số

1. **G5 FAIL: FPS deint-only 0.72–0.73× < 0.75× (giữ ngưỡng).**
   Mọi đường 2 lần vẽ đều ~0.7× trên VM này; half-res chỉ nhỉnh hơn
   offscreen ~0.05×. Đừng nói "deint-only nay đã đủ nhanh". Quyết
   định giữ half-res (R tốt hơn + FPS tốt hơn C8) hay quay về
   offscreen C8, hay nới ngưỡng, là việc của đợt sau/user — luồng
   này không tự nới ngưỡng.
2. **Half-res mềm dọc hơn tap C8.** vgrad clean giữ 73% ở s=1.13
   (bằng tap), nhưng 37% ở s=1.0 và 52% ở s=1.5. Chỉ clip bật
   deinterlace mới bị; render vẫn yadif thật.
3. **Tap KHÔNG phải yadif** (giới hạn cũ từ C8, còn nguyên): R sau
   half-res (0.51–0.66) rơi vào băng progressive/yadif theo metric
   C/S, nhưng đó là metric combing, không phải so sánh pixel với
   yadif. Đừng nói "preview khử răng cưa đúng như render".
4. **BBB không phải footage xen kẽ gốc.** BBB qua minterpolate
   (nội suy chuyển động) rồi tinterlace: idet TFF 294 thật, nhưng
   gap combing chỉ 0.01 nên G8 không chứng minh được "khử combing
   trên footage thật" mạnh như testsrc2 — chỉ chứng minh tap đổi
   pixel thật (MAD 1.48 trong app, ~3.1 ở 1:1) và R giảm nhẹ.
   Footage xen kẽ gốc từ camera (PAL/NTSC capture) vẫn chưa đo.
5. **Chưa đo:** Safari/WebKit thật (không khởi động được trên VM —
   thiếu `libwebkitgtk-6.0.so.4`); tap + motion-blur-blend LÚC ĐANG
   PHÁT (chỉ đo ở pause — gate đợt 62 R3; nhánh blend-motion-blur
   trong `drawVideoClip` dùng chung drawSrc đã half-res nên về lý
   thuyết đúng, nhưng chưa có số headed); FPS trên máy thật có GPU
   (mọi số FPS chỉ đúng trên SwiftShader CPU của VM này).
6. **Hook `__vcutPreviewEnhance.offscreenApplied=false` + tap=true
   nay nghĩa là "qua half-res", KHÔNG còn nghĩa là "không qua
   offscreen nào"** — half-res cũng là canvas trung gian nhưng ở nửa
   chiều cao và không qua enhanceCanvas. Harness D4 khóa đúng ngữ
   nghĩa này (G2/G5/G7a/G7b đều assert offscreen=false).
7. **Ngưỡng 0.9 vẫn là phán đoán trên dữ liệu nhiễu** (giới hạn cũ
   từ C8): lần này bổ sung bằng chứng ở 0.75 (gap 0.09 headed,
   tap-chỉ-giảm-0.06 ở probe) nên giữ 0.9 là có cơ sở hơn trước.
8. **File chung `preview.tsx` / `enhancePreview*.test.ts` đang được
   nhiều luồng đợt 76 sửa song song:** batch này stage toàn bộ file
   ở trạng thái sau khi sửa D4 — parent gộp cần đối chiếu tsc lại
   sau khi gộp (D2 cũng đụng preview.tsx theo brief; D4 chỉ sửa phần
   deint + comment, không đụng khối letterbox intermediate của C1 —
   Q1 headed B5 7/7 đã kiểm chứng lại sau khi gộp code D4).

## 6. Nợ mở cho đợt sau

1. **G5: FPS deint-only 0.72–0.73× < 0.75× — câu hỏi mở.** Mọi
   đường 2 lần vẽ đều ~0.7× trên VM này; đường 1 lần vẽ duy nhất
   đạt FPS (inline-shift 0.99×) lại không khử được combing ở
   upscale; SVG filter còn tệ hơn (~7× chi phí). Hướng còn lại
   chưa thử: (a) đo lại trên máy thật có GPU (SwiftShader có thể
   phóng đại chi phí vẽ thêm); (b) xem xét nới ngưỡng 0.75× cho
   riêng deint-only (quyết định của user/parent, không tự nới);
   (c) tìm cách khử combing trong 1 lần vẽ bằng kernel khác (vd.
   drawImage với source rect đã dịch nửa hàng + scale dọc — về lý
   thuyết vẫn là lệch pha, khó thoát khỏi kết quả probe-b).
2. Đo tap + motion-blur-blend lúc đang phát (nhánh blend trong
   drawVideoClip với drawSrc half-res) — cần harness lấy mẫu R/MAD
   giữa lúc phát.
3. Footage xen kẽ gốc từ camera (PAL/NTSC capture, idet TFF/BFF
   rõ) để kiểm chứng combing trên nội dung thật không qua
   minterpolate.
4. Safari/WebKit thật (cần máy macOS hoặc cài đủ lib webkitgtk
   trên VM) — Firefox đã y hệt Chromium nên rủi ro thấp, nhưng
   chưa có số.
5. Cân nhắc đo lại vgrad trong app (không chỉ probe) cho half-res
   ở s=1.0 để quyết có nên giới hạn half-res ở một dải tỉ lệ hay
   không (37% giữ ở s=1.0 là mềm nhất).

## 7. Cách chạy lại

```bash
# Probe D4 (tap ở 0.75 + BBB + yadif ground truth, ~4 phút):
node apps/web/scripts/probe-76d4-deint.mjs
# Probe-b (inline-shift theo tỉ lệ + SVG filter, ~1 phút):
node apps/web/scripts/probe-76d4b-inline-scale.mjs
# Probe-c (half-res R + vgrad + thông lượng, ~1 phút):
node apps/web/scripts/probe-76d4c-halfres.mjs
# Firefox/WebKit tap check (playwright-core ở /tmp/round76-d4, ~40 s):
NODE_PATH=/tmp/round76-d4/node_modules node apps/web/scripts/ff-tap-check-76d4.mjs all
# Headed trong app (cửa sổ 2560x1440, ~2 phút):
node apps/web/scripts/clicktest-76d4-deint-fps.mjs
# Headed đúng tỉ lệ 0.75 (cửa sổ 2000x1165, ~40 s):
D4_WINDOW=2000x1165 D4_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round76-d4/headed-075b node apps/web/scripts/clicktest-76d4-deint-fps.mjs
# Hồi quy letterbox + combo:
node apps/web/scripts/clicktest-60q1-enhance-preview.mjs
node apps/web/scripts/clicktest-61r3-combo.mjs
# Unit test (vi + en):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview76D4.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round76-d4/enhancePreview76D4.test.cjs \
  && node /tmp/round76-d4/enhancePreview76D4.test.cjs
VCUT_TEST_LANG=en node /tmp/round76-d4/enhancePreview76D4.test.cjs
```
