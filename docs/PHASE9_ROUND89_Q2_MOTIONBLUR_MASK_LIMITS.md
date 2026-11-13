# Phase 9 đợt 89 — Q2: Motion blur + mask lệch preview–render (đo lại với footage thật có vân)

> Đóng nợ LIMITS gộp đợt 88 §4 mục 8 (P3 (d)): "Motion blur + mask lệch
> preview–render — đo lại với footage thật có vân trước khi quyết hướng xử lý".
> Ngày đo: 11/11/2026. VM 4 vCPU EPYC 9D25, RAM 8 GB (không GPU).
> **Kết luận ngắn: lệch là do PREVIEW, không phải render thiếu blur.
> Render blur nội dung thật và mép mask LUÔN sắc (test khóa 51/51 xanh).
> Preview play biến thiên theo pha tick: lúc không blur nội dung, lúc vệt
> mép mask (P3: 12–16px; đợt này dưới tải: tới 145px).
> KHÔNG sửa code production trong lượt này — hướng sửa đề xuất ở §7, cần
> parent quyết + vòng riêng với full click-test (lý do ở §7.3).**

## 1. Footage và setup đo

Footage tự gen bằng PIL + ffmpeg (script gen KHÔNG stage — xem §9; media là
binary nên không stage, chỉ stage harness + test + doc này):

- Sọc dọc đỏ/trắng chu kỳ 48px (24px đỏ + 24px trắng), 1280×720, 90 frame,
  3s, 30fps. Kênh R=255 khắp vùng có nội dung → vùng mask = R>128.
  Độ tương phản sọc đo bằng kênh G (đỏ: G=0, trắng: G=255).
- `stripes-static.mp4`: sọc đứng yên (verify: MAD f0–f1 = 0.00).
- `stripes-scroll.mp4`: sọc cuộn 12px/frame (`crop x='12*n'` trên ảnh rộng
  2360px; verify: shift −12px/frame, corr 0.9814, MAD f0–f1 = 84.97).

Spec chung: mask ellipse `w=0.4 h=0.5 feather=0`; motion blur
`{frames: 3, weights: [1, 1, 1]}` (tmix). 3 setup, mỗi setup render blur +
không-blur (đối chứng), 720p, đo tại t = 0.5 / 1.0 / 1.5:

| Setup | Nguồn | Mask | Track (0.3→0.7 trong 2s) | Hỏi gì |
|---|---|---|---|---|
| A | static | ellipse x=0.3 | có | Chỉ mask động, nguồn tĩnh → blur có vô hình? |
| B | scroll 12px/f | ellipse x=0.5 | không | Chỉ nội dung động → blur nội dung có thật? mép mask có sắc? |
| C | scroll 12px/f | ellipse x=0.3 | có | Cả hai cùng động (case P3 gốc) |

Chỉ số đo (render, bằng numpy trên frame PNG; preview, bằng harness CDP
`apps/web/scripts/probe89q2-motionblur-mask.cdp.mjs` đo canvas
`#vcut-preview-wrap canvas.preview-canvas` 872×276, quy về hệ project):

- `MAD(blur, noblur)`, `frac_changed`: khác biệt blur vs đối chứng.
- Tâm/bbox mask (R>128), biên trái/phải 10–90% trên profile R (`edgeL/R`,
  px project), `w50` (rộng tại 50% max, px project).
- Tương phản sọc trong lõi mask (`gStd`, `gMidFrac` = tỉ lệ pixel G trong
  30..225): blur nội dung làm gStd giảm, gMidFrac tăng.
- `trail_left_n` / `trail_left_extent`: pixel R>128 nằm ngoài mép trái sắc
  kỳ vọng (vệt ghost).

## 2. Kết quả render (canonical) — ĐẦY ĐỦ, 18/18 frame

Render thật bằng `server/render/src/render.js` (`--mask-mode png`), 6 job.
Thời gian (lượt đo tay, VM tải nặng): a-blur 61.4s, a-noblur 52.6s,
b-blur 26.7s, b-noblur 20.4s, c-blur 58.9s, c-noblur 38.5s. (Lượt chạy
test: a-blur 28.6s, a-noblur 44.5s, b-blur 25.2s, b-noblur 18.0s,
c-blur 61.2s, c-noblur 44.4s — tải thấp hơn.)

### A — sọc tĩnh + track (chỉ mask động): blur = identity

| t | MAD | frac | cx (track) | edgeL/R (px) | gStd | trail |
|---|---|---|---|---|---|---|
| 0.5 | 0.0 | 0.0 | 0.400 (0.4) | 1.6 / 0.8 | 126.4 | 0 |
| 1.0 | 0.0 | 0.0 | 0.500 (0.5) | 1.5 / 0.8 | 126.6 | 0 |
| 1.5 | 0.0 | 0.0 | 0.600 (0.6) | 0.8 / 0.8 | 126.6 | 0 |

MAD = 0.0 tuyệt đối cả 3 mốc (a-blur và a-noblur cùng đúng 93658 byte).
**Khi chỉ mask động mà nguồn tĩnh, tmix render hoàn toàn vô hình — kể cả
với footage có vân.** Đây là kỳ vọng: tmix trung bình 3 frame giống nhau.

### B — sọc cuộn + mask tĩnh (chỉ nội dung động): blur nội dung THẬT, mép sắc

| t | MAD | frac | gStd blur (noblur) | gMidFrac blur (noblur) | cx | edgeL/R | trail |
|---|---|---|---|---|---|---|---|
| 0.5 | 4.54 | 0.155 | 95.8 (127.2) | 0.488 (0.0) | 0.500 | 1.9 / 0.8 | 0 |
| 1.0 | 13.34 | 0.167 | 43.2 (127.1) | 1.000 (0.0) | 0.500 | 1.8 / 0.8 | 0 |
| 1.5 | 4.57 | 0.160 | 92.9 (126.8) | 0.516 (0.0) | 0.500 | 1.5 / 0.8 | 0 |

### C — sọc cuộn + track (cả hai động): như B + bám track

| t | MAD | frac | gStd blur | gMidFrac blur | cx (track) | edgeL/R | trail |
|---|---|---|---|---|---|---|---|
| 0.5 | 4.53 | 0.154 | 93.8 | 0.516 | 0.400 (0.4) | 1.5 / 0.8 | 0 |
| 1.0 | 13.34 | 0.167 | 43.4 | 1.000 | 0.500 (0.5) | ~1.8 / 0.8 | 0 |
| 1.5 | 4.59 | 0.160 | 93.7 | 0.504 | 0.600 (0.6) | ~1.5 / 0.8 | 0 |

(MAD/gStd biến thiên theo mốc do pha sọc: tại t=1.0 pha làm 3 mẫu tmix
triệt tiêu gần hết → gStd 43, gMidFrac 1.0, MAD 13.3; các mốc khác
~94/0.5/4.5. Đây là kỳ vọng với vân tuần hoàn, không phải nhiễu.)

**Kết luận render (chắc chắn):** tmix blur nội dung bên trong mask là
thật và mạnh (15–17% pixel đổi, tương phản sọc giảm 25–66%); **mép mask
LUÔN sắc (≤1.9px) ở mọi setup, mọi mốc**; tâm mask đúng track trong
±0.001. Lệch preview–render KHÔNG phải do render thiếu blur nội dung —
mà do render không bao giờ blur BIÊN mask động (tmix áp TRƯỚC mask,
`server/render/src/motion.js` → `render.js` mask sau).

## 3. Kết quả preview — pause 9/9 sạch; play biến thiên

Harness CDP/Chromium 1254, vite dev port 5173, canvas 872×276 (scale
0.38333). Lưu ý: preview downscale 1280→872 nên gStd baseline của preview
(~112) thấp hơn render (~127) do resample làm mềm sọc — **so sánh đúng là
play-vs-pause TRONG preview** (cùng resample), và **blur-vs-noblur TRONG
render**, không so gStd tuyệt đối cross-side.

### 3.1 Pause (không motion blur — đối chứng): 9/9 sạch

| Case | t | cx (kỳ vọng) | edgeL/R (px proj) | w50 | trail | gStd | gMidFrac |
|---|---|---|---|---|---|---|---|
| a-noblur | 0.5 | 0.4007 (0.4) | 1.1 / 2.1 | 505.2 | 0 | 111.8 | 0.061 |
| a-noblur | 1.0 | 0.5008 (0.5) | 1.2 / 2.1 | 505.5 | 0 | 112.0 | 0.061 |
| a-noblur | 1.5 | 0.6008 (0.6) | 1.4 / 2.6 | 505.8 | 0 | 112.0 | 0.061 |
| b-noblur | 0.5 | 0.5008 (0.5) | 1.2 / 2.1 | 505.5 | 0 | 112.4 | 0.061 |
| b-noblur | 1.0 | 0.5008 (0.5) | 1.2 / 2.1 | 505.5 | 0 | 111.8 | 0.071 |
| b-noblur | 1.5 | 0.5007 (0.5) | 1.2 / 2.1 | 505.5 | 0 | 111.4 | 0.071 |
| c-noblur | 0.5 | 0.4007 (0.4) | 1.1 / 2.1 | 505.2 | 0 | 112.2 | 0.061 |
| c-noblur | 1.0 | 0.5008 (0.5) | 1.2 / 2.1 | 505.5 | 0 | 111.8 | 0.071 |
| c-noblur | 1.5 | 0.6008 (0.6) | 1.4 / 2.5 | 505.8 | 0 | 111.9 | 0.061 |

Pause: tâm đúng track trong ±0.0008, mép sắc 1.1–2.6px, trail 0, w50
505–506 (khớp render w50 510 trong sai số resample). **Khi pause, preview
khớp render về hình học mask.** Đây là baseline để so với play.

### 3.2 Play (có motion blur): 2 mốc sạch, còn lại missed — và 2 mốc sạch đều KHÔNG blur nội dung

| Case | t | Kết quả |
|---|---|---|
| a-blur (12:16) | 1.0 | SẠCH: cx 0.4941 (track(0.967)=0.4934, +0.0007), edgeL 2.7, edgeR 2.1, w50 508.5, trail 0, gStd 111.7, gMidFrac 0.061, playhead 0.967 |
| a-blur (12:20) | 0.5/1.0/1.5 | missed cả 3 (playhead 2.267) |
| b-blur (13:04) | 0.5/1.0 | missed (playhead 2.4) |
| b-blur (13:04) | 1.5 | SẠCH: cx 0.5008, edgeL 1.2, edgeR 2.1, w50 505.5, trail 0, **gStd 112.4, gMidFrac 0.061**, playhead 1.567 |
| c-blur (13:08) | 0.5/1.0/1.5 | missed cả 3 (playhead 2.367) |

**Phát hiện quan trọng (b-blur t=1.5):** preview play cho gStd 112.4 và
gMidFrac 0.061 — **gần như đồng nhất với baseline pause (112.4 / 0.061)** —
trong khi render cùng mốc cho gStd 92.9, gMidFrac 0.516. Tức là ở mốc này
**preview KHÔNG blur nội dung**, dù clip có motion blur đang bật.
Tương tự a-blur t=1.0 (12:16): gStd 111.7 ≈ baseline pause 112.0.
(Kiểm chứng chéo: b-blur t=1.5 và b-noblur t=0.5 có cùng `pixHash`
630697216 — pha sọc trùng nhau vì 32 frame × 12px = 384px chia hết cho
chu kỳ 48px — nên so sánh gStd giữa hai mốc này là so sánh cùng một
khung hình, chỉ khác motion blur bật/tắt: 112.4 vs 112.4 → không blur.)

### 3.3 Bằng chứng vệt mép mask ở preview (từ P3 + lượt này)

- P3 đợt 88 (nguồn trắng trơn, mask+track+blur, play): vệt mask ~12–16px
  @1280, tâm −0.0092, w50 +6–14px, biên phải 17–25px thay vì 0.8px.
- Lượt này 12:13 (harness cũ, seek từng mốc, VM tải cao): w50 tới 797.6,
  trail trái tới 145px (canvas đóng băng / ring ô nhiễm do seek).
- Lượt này 12:16 + 13:04 (harness phát liên tục): 2 mốc sạch, KHÔNG vệt
  (trail 0, w50 505–508).

**Vệt preview là THẬT nhưng BIẾN THIÊN theo pha tick/tải: 0px (khi các
snapshot trùng 1 video frame) tới ~25px (P3) và hơn nữa khi canvas stale
dưới tải.** Không có một con số "độ dài vệt preview" duy nhất.

### 3.4 Bias chọn mẫu — phải đọc kèm

Harness play chỉ ghi nhận mốc khi khung thỏa cửa sổ (count 12000–45000,
cx trong [kỳ vọng−0.04, kỳ vọng+0.01], playhead trong [t−0.2, t+0.5],
không đóng băng theo `pixHash`). Một khung bị vệt ghost nặng có cx lệch
phải và/hoặc count vượt cửa sổ → bị loại và ghi "missed". **Vì vậy các
mốc play "sạch" là mẫu có điều kiện (ghost tình cờ align), KHÔNG đại diện
cho phân phối đầy đủ của preview play.** Kết luận "preview lúc không vệt"
chỉ đúng cho các mẫu bắt được; kết luận "preview CÓ THỂ vệt" dựa trên P3
+ 12:13 là vững chắc. Ngược lại, render là xác định: 18/18 frame sắc.

## 4. Cơ chế — vì sao preview lệch cả hai chiều

### 4.1 Preview ghost theo tick, không theo frame video

`apps/web/src/preview.tsx` (nhánh mask, ~line 1976 và ~2032) snapshot
`unit` — canvas W×H **đã nhân alpha mask** — mỗi tick vào ring buffer
(`updateMotionBlurSnapshots`, tối đa frames−1 snapshot), rồi
`drawMotionBlurBlended` blend snapshot + frame hiện tại theo
`motionBlurBlendPlan` (`apps/web/src/lib/previewEngine.ts`: weights
[1,1,1] + 2 ghost → alphas [1, 0.5, 1/3], tức trung bình 3 snapshot như
tmix — ĐÚNG cho vùng đục).

Vấn đề là **snapshot lấy theo tick của app (~60fps), không theo frame
video (30fps)**:

- Tick nhanh hơn video: 2 tick liên tiếp thường thấy CÙNG 1 video frame
  → 3 snapshot gần như đồng nhất → blend ≈ frame hiện tại → **không blur
  nội dung** (b-blur t=1.5: gStd 112.4 = baseline) và **không vệt mask**
  (a-blur 12:16: trail 0).
- Tick chậm / tải cao / seek: các snapshot cách nhau 1–3 video frame →
  mask ở 3 vị trí track khác nhau được blend → **vệt mép mask** (P3:
  12–16px) và tâm lệch về sau; canvas stale còn làm hợp của nhiều khung
  (12:13: w50 797.6, trail 145px).
- Mép 10–90% đo trên profile R không đo độ dài vệt (mép ghost ngoài cùng
  vẫn sắc ~2px); độ dài vệt thể hiện ở w50, cx shift, trail_left.

### 4.2 Render tmix theo frame video, trước mask

`server/render/src/motion.js` (`buildMotionChain`): tmix áp TRƯỚC mask
(ngay sau fps/minterpolate), mask áp SAU (render.js nhánh thường ~line
770–800). Vì vậy:

- Nội dung trong mask được trung bình đúng 3 video frame liên tiếp →
  blur xác định, mạnh (B/C: gStd 127→43–96, MAD 4.5–13.3).
- Mép mask là mask tại vị trí HIỆN TẠI, áp sau blur → luôn sắc (≤1.9px),
  không bao giờ có vệt.
- Khi chỉ mask động mà nguồn tĩnh (A): 3 frame giống nhau → MAD = 0.

**Blur có nên áp lên mask hay chỉ lên nội dung trong mask? Trả lời bằng
số đo: render (canonical) chỉ blur NỘI DUNG trong mask, mép mask luôn
sắc.** Preview đúng ra phải làm như vậy. Hướng (ii) của P3 (render áp
tmix SAU mask) sẽ làm mờ mép mask trong render — đi ngược canonical,
**loại**.

## 5. So sánh tổng hợp preview vs render (720p, quy về px project)

| Chỉ số | Render (18 frame) | Preview pause (9 mốc) | Preview play (mốc sạch) | Preview play (P3 + tải cao) |
|---|---|---|---|---|
| Mép mask edgeL/R | 0.8–1.9px | 1.1–2.6px | 1.2–2.7px | vệt 12–16px (P3), tới 145px (stale) |
| Tâm mask vs track | ±0.001 | ±0.0008 | +0.0007–0.0008 | −0.0092 (P3) |
| w50 mask | 510.0 | 505.2–505.8 | 505.5–508.5 | +6–14px (P3), tới 797.6 (stale) |
| Trail trái | 0 (18/18) | 0 (9/9) | 0 (2 mốc) | có (P3, 12:13) |
| Blur nội dung (gStd lõi) | 127→43–96 (B/C) | baseline ~112 | ~112 = baseline (KHÔNG blur) | biến thiên theo pha |
| gMidFrac lõi | 0→0.49–1.0 (B/C) | 0.061–0.071 | 0.061 = baseline | biến thiên theo pha |

Đọc bảng: pause khớp render về hình học; play lệch **cả hai chiều** —
thiếu blur nội dung (khi tick align) và thừa vệt mép mask (khi tick lệch).
Cả hai đều do cùng một nguyên nhân (§4.1).

## 6. Quyết định: KHÔNG sửa production trong lượt này

Nguyên nhân đã rõ, nhưng sửa an toàn tối thiểu KHÔNG khả thi trong phạm vi
một luồng đo — xem §7. Theo luật luồng ("sửa rủi ro lớn thì không sửa,
chỉ đưa hướng xử lý có bằng chứng + số đo"), **lượt này KHÔNG đụng
`preview.tsx` / `previewEngine.ts` / `render.js`**. Không có file
production nào bị sửa.

## 7. Hướng xử lý đề xuất (để parent quyết)

### 7.1 Hướng khuyến nghị: (iii) + snapshot theo frame video

Hai thay đổi cùng lúc (chỉ một trong hai là chưa đủ):

1. **Snapshot theo frame video, không theo tick** — ring chỉ nhận snapshot
   khi `video.currentTime` đã sang frame mới (lượng tử hoá theo
   `floor(t*fps)`), tối đa frames−1 snapshot phân biệt. Khi đó blend của
   preview = trung bình đúng 3 video frame liên tiếp như tmix render →
   blur nội dung xác định, không còn lúc có lúc không. (Chi tiết triển
   khai thuộc về vòng sửa: cần xem `updateMotionBlurSnapshots` được gọi ở
   đâu trong tick và liệu có cần giữ frame video cũ qua `VideoFrame` /
   canvas copy — snapshot hiện tại copy qua `drawImage` nên đã là ảnh
   tĩnh, chỉ cần gate theo frame index.)
2. **Không ghost phần mask** — snapshot unit THÔ (chưa mask), blend các
   unit thô, rồi áp mask MỘT lần lên lớp blend tại vị trí mask HIỆN TẠI
   (đúng thứ tự render: tmix → mask). Cần tách bước "áp mask lên canvas
   W×H" ra khỏi `maskedUnitSource` để dùng lại cho lớp blend.

### 7.2 Rủi ro đã đánh giá (đọc code `preview.tsx` ~line 1951–2060)

- **SR + scale/rotation:** nhánh mask có 2 call site — nhánh SR (line
  ~1987) áp transform (translate/rotate/scale) TRONG painter của
  `drawMotionBlurBlended`, tức transform đã nướng vào lớp blend. Nếu mask
  sau blend thì mask sẽ bị áp trong không gian ĐÃ transform — sai hình
  học. Sửa đúng phải dời transform ra khỏi painter, áp vào bước composite
  lớp blend lên canvas chính (sau khi mask), chỉ cho call site mask+SR.
  Đây là phần rủi ro nhất.
- **Track + mask:** khi mask+track thì `trackShift` = null (đợt 87 O4 —
  track lái mask trong unit, unit đứng yên). Unit thô snapshot phải đứng
  yên theo cùng quy ước, mask áp theo track hiện tại — cần giữ nguyên
  bất biến này.
- **Vignette/filter:** `cssFilter` áp trên `drawSrc` trước khi vào unit;
  unit thô vẫn mang filter như cũ; vignette vẽ sau blend như hiện tại.
- **Hồi quy:** mọi combo mask × (SR / thường) × (track / tĩnh) ×
  (scale/rotation keyframes) × vignette đều phải đo lại bằng pixel thật
  + chạy lại click-test maskTrack (O4 37 check), `lib/maskTrack.test.ts`
  (22), `lib/maskKeyframes.test.ts` (14), `lib/previewEngine.test.ts`
  (14), `ghostBlend.probe.test.ts`, test_round87_o2 (25/25),
  test_round87_o3, D3/D4 + tsc + vite build.

### 7.3 Vì sao không làm luôn trong lượt này

- Sửa chạm `drawMotionBlurBlended` (hàm dùng chung 4 call site) + 2 call
  site mask + thứ tự transform SR — ước ~100–150 dòng + test, không phải
  "sửa tối thiểu 1 phía".
- Harness play bắt mốc không ổn định (miss 8/12 mốc play trong lượt
  này) nên vòng sửa cần harness bắt mốc tốt hơn trước khi đo lại — nếu
  không sẽ không chứng minh được sửa có hiệu quả.
- Môi trường VM trong lượt này không ổn định (sóng EPERM, §8) — đo kiểm
  cho một thay đổi loại này cần cửa sổ yên dài.

### 7.4 Các hướng đã loại

- (i) Chấp nhận + ghi docs: KHÔNG khuyến nghị — lệch là thật và user
  nhìn thấy được khi phát (vệt mask + thiếu blur nội dung), không phải
  nhiễu đo.
- (ii) Render áp tmix SAU mask: LOẠI — sẽ làm mờ mép mask trong render,
  phá tính canonical đã được khóa bằng test (§2, §9).
- (iii-lite) Tắt ghost hẳn khi có mask (vẽ unit sắc): LOẠI — preview sẽ
  không còn motion blur nào cho clip có mask, trong khi render blur nội
  dung thật → tạo lệch mới theo chiều ngược lại.

## 8. Môi trường — sóng EPERM và Chrome chết (ảnh hưởng trực tiếp tới độ phủ đo)

Lượt này VM gặp sóng EPERM (hiện tượng P8) nặng, làm gián đoạn đo:

- **Vite dev chết ~12:23** (đang chạy từ 11:51); khởi động lại bằng
  `npm run dev` / `node vite.js` đều fail `EPERM: operation not permitted,
  write` tại `loadConfigFromBundledFile` (vite ghi bundle config vào
  `node_modules/.vite-temp/*.mjs`, file tạo ra 0 byte). Thử 25+ lần đều
  fail. **Workaround tìm ra:** config CJS tạm `vite.config.q2.cjs`
  (mirror `vite.config.js`) đi nhánh `require` của vite, không ghi file
  temp → vite lên ngay (ready 540ms). File này đã XÓA sau khi đo xong
  (không stage, không commit).
- **Chrome 1254 chết SIGTRAP (exit 133) từ ~12:23 tới ~13:01** — cùng địa
  chỉ `ud2` 0x55555b7d0ff6 như sự cố 11:55; `--version` vẫn OK; thử mọi cờ
  (`--no-sandbox`, `--single-process`, `--no-zygote`, headless_shell,
  profile `/dev/shm`, HOME mới, tắt crashpad, Chrome 1187, Firefox 159)
  đều chết/trap; `libatspi2.0-0t64` vẫn cài (ii) nên giả thuyết libatspi
  ở đợt 88 là tương quan, không phải nguyên nhân. Strace 1187 cho thấy
  crashpad + ghi prefs fail EPERM ngay trước trap. Chrome sống lại
  ~13:01 không rõ nguyên nhân (không có thay đổi package nào sau 11:55
  theo dpkg.log). **Hậu quả:** 5 case preview 12:20–12:50 fail hoàn toàn
  (không ghi được file); chỉ đo lại được khi Chrome sống lại 13:01.
- **Sóng EPERM đo được:** fail ngẫu nhiên theo từng write syscall
  (có lúc 40% write fail trong 1 giây, có lúc 90/90 OK trong 90 giây);
  `cp`, `ffmpeg` (không ghi được header mp4), PIL `img.save` (fail ở
  `fp.close()`), `strace -o file` đều trúng. Render tay 12:50 fail 3/3
  ở bước mask PNG → fallback geq → ffmpeg 255. **Test repo chạy được
  nhờ `writeFileEpermRetry` của repo (tự retry 5 lần, log cho thấy
  measure-py fail 2 lần rồi OK ở lần 3).**
- **Q5's vite (port 5570) cũng chết** trong cùng khoảng — sóng ảnh hưởng
  toàn VM, không riêng luồng này.

Hệ quả cho độ phủ: **c-blur play KHÔNG có mốc sạch nào; a-blur play chỉ
có 1 mốc sạch (12:16); b-blur play chỉ 1 mốc sạch (13:04).** Các kết luận
về play dựa trên 2 mốc sạch + P3 + 12:13 (nhiễu) + toán blend — đủ để
quyết hướng, chưa đủ để khóa số đo play bằng test repo (test repo chỉ
khóa phía render, §9).

## 9. Test khóa số đo

`server/render/src/test_round89_q2_motionblur_mask.js` (mới, đã stage):

- Tự gen footage sọc (PIL), render thật 6 job (A/B/C × blur/noblur, 720p
  3s, `--mask-mode png`), trích frame t=0.5/1.0/1.5, đo bằng numpy.
- Assert: A MAD=0 cả 3 mốc + tâm đúng track + mép ≤3px + trail=0 (12);
  B MAD>4 + gStd blur<100 (noblur>120) + gMid>0.4 (noblur 0) + tâm 0.5 +
  mép ≤3px + trail=0 (18); C như B + tâm đúng track (15); + 6 render OK.
- **Chạy xanh: exit 0, 51 pass / 0 fail** (chạy 13:0x, ~6 phút; số đo
  khớp lượt đo tay 12:0x tới 2 chữ số thập phân — A MAD 0.0, B MAD
  4.54/13.34/4.57, C MAD 4.53/13.34/4.59). Lưu ý: lần chạy đầu (log file)
  cho log 0 byte do sóng EPERM nuốt write log; lần 2 chạy qua pipe thì
  xanh. Test dùng `writeFileEpermRetry` cho file tạm nên chịu được sóng.
- Chưa có test khóa phía preview (harness play bắt mốc không ổn định —
  xem §8; cần harness tốt hơn trước khi khóa số preview).

## 10. File và batch stage

Stage (KHÔNG push) tại
`~/workspace/repo-1-push/paths-loop/phase9-round89-q2-motionblur-mask.txt`
(NUL-delimited, chỉ text):

- `apps/web/scripts/probe89q2-motionblur-mask.cdp.mjs` (harness Q2 mới:
  đo kênh R + tương phản G lõi + vệt trái + `pixHash` chống đóng băng +
  phát liên tục 1 lượt bắt 3 mốc + cửa sổ bắt nới).
- `server/render/src/test_round89_q2_motionblur_mask.js` (test khóa §9).
- `docs/PHASE9_ROUND89_Q2_MOTIONBLUR_MASK_LIMITS.md` (doc này).

KHÔNG stage: footage `.mp4` (binary — chỉ stage script gen, nhưng script
gen nằm trong test file §9 nên không cần file riêng); `vite.config.q2.cjs`
(đã xóa); media trong `apps/web/public/` (đã xóa sau đo).
KHÔNG sửa file production nào. Không tsc/vite build (không đụng code web).

## 11. Nợ còn lại cho vòng sau

1. Vòng sửa theo §7.1 (snapshot theo frame video + mask 1 lần sau blend),
   kèm harness play bắt mốc ổn định hơn + đo lại A/B/C play + full
   click-test mask/track (§7.2).
2. Test khóa phía preview khi harness đã ổn (khóa gStd play ≈ render
   theo pha + trail = 0).
3. Môi trường: Chrome SIGTRAP + sóng EPERM vẫn chưa có nguyên nhân gốc
   (chỉ có workaround CJS config + retry); cần parent/user quyết hướng
   điều tra (cron probe EPERM 10 phút đã đề xuất từ đợt 88, vẫn chờ).
