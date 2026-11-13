# PHASE9_ROUND88_P3_MASK_TRACK_PARITY_LIMITS.md — Đo parity keyframes+track giữa preview và render + các combo chưa đo pixel

Ngày: 11/11/2026, lượt cron 15:35 +07. Đợt 88, luồng P3. KHÔNG push.
KHÔNG release/tag. KHÔNG sửa production. KHÔNG đụng TTS 39, không đụng
file workflow.

Đóng nợ O4 (LIMITS gộp đợt 87 §4 mục 8): đo bằng pixel thật các combo
mask+track chưa đo — (a) keyframes w/h + track, (b) feather > 0 + track,
(c) mask+track+SR (scale keyframes + rotation keyframes), (d)
mask+track+motion blur, (e) mask+track+transition (preview, + render png
đối chứng). Nền: preview giữ w/h keyframes (helper O1), render trackgeq
bỏ keyframes hoàn toàn, render png (mặc định) khớp helper O1.

## 0. Phương pháp đo (tóm tắt; chi tiết §4)

- Nguồn chung: video trắng 1280×720, 3s, 30fps (`color=white`, H.264
  yuv420p); mask ellipse `w=0.4, h=0.5, feather=0` (trừ case B), tâm tĩnh
  `(0.3, 0.5)`; track tuyến tính `(0, 0.3, 0.5) → (2, 0.7, 0.5)` (thời
  gian clip-local; case E kéo tới `(3, 0.9, 0.5)`).
- Render: `server/render/src/render.js` trực tiếp (`--mask-mode png` mặc
  định / `trackgeq`), trích frame bằng `ffmpeg -ss`, đo bằng
  `measure88p3.py` (centroid pixel luma > ngưỡng + bbox + profile ngang
  qua hàng centroid: biên 10%–90% theo nền, w50).
- Preview: app thật qua CDP (Chromium 1254 headless, `vite dev`),
  harness mới `apps/web/scripts/probe88p3-mask-track-parity.cdp.mjs`
  (tổng quát hoá harness O4: nhận --spec/--media/--times/--mode/--threshold,
  fit-rect tính từ kích thước canvas thật, thêm mode `play` đo trong trang
  theo rAF). Canvas 872×276, scale 0.38333 — mọi số preview đã đổi về hệ
  project.
- Ngưỡng: render mặc định luma > 128; case E dùng ngưỡng giữa
  (mid = (median+max)/2) vì nền xfade bị nâng lên (§4); preview E dùng
  ngưỡng 32 (fade làm mờ ellipse tới luma ~51). Tâm ellipse đối xứng nên
  không nhạy ngưỡng; w50 (mức 50% theo nền) là số so sánh chính cho
  bbox/biên.
- Mọi số dưới đây là pixel thật trên frame/canvas thật, không suy từ code.

## 1. (a) Keyframes w/h + track — preview KHỚP png, trackgeq LỆCH đúng như thiết kế

Mask keyframes: `t=0: w=0.2, h=0.3` → `t=2: w=0.6, h=0.7`
(tuyến tính). Kỳ vọng (helper O1): tâm = track(t); w/h theo keyframes.

| t (s) | kỳ vọng cx / w / h | render png | render trackgeq | preview |
|---|---|---|---|---|
| 0.5 | 0.4000 / 0.3000 / 0.4000 | 0.4004 / 0.2992 / 0.3972 | 0.4004 / **0.3984** / **0.4972** | 0.4009 / 0.3017 / 0.3950 |
| 1.0 | 0.5000 / 0.4000 / 0.5000 | 0.5004 / 0.3984 / 0.4972 | 0.5004 / **0.3984** / **0.4972** | 0.5007 / 0.3974 / 0.4964 |
| 1.5 | 0.6000 / 0.5000 / 0.6000 | 0.6004 / 0.4984 / 0.5972 | 0.6004 / **0.3992** / **0.4972** | 0.6008 / 0.4993 / 0.5978 |

- **Preview vs render png: |Δcx| ≤ 0.0005 (≤ 0.64px @1280), |Δw/h| ≤ 0.003
  (≤ 3.8px). Khớp.** w50 (bề rộng tại 50% max): preview 379.8 / 505.5 /
  636.3 vs render png 382.0 / 510.0 / 638.0 (lệch ≤ 4.5px, do viền mềm
  sau upscale intermediate 640px — xem O4 §4).
- **Render trackgeq: tâm đúng (= track, Δ ≤ 0.0004) nhưng w/h ĐÓNG BĂNG ở
  giá trị tĩnh 0.4/0.5 — lệch với png/preview đúng bằng (w/h keyframes −
  w/h tĩnh): Δw = 0.0992 (~127px @1280) tại t=0.5 và t=1.5, Δh = 0.1000
  (~72px @720) tại t=0.5.** Đây chính là lệch mà O4 §2 đã nêu nhưng chưa
  đo; nay đã đo bằng pixel ở cả 3 mốc, cả 3 đường. w50 trackgeq = 510.0
  hằng số cả 3 mốc (khẳng định keyframes bị bỏ hoàn toàn, không phải nội
  suy sai).
- Kết luận: nợ đo của mục (a) ĐÃ ĐÓNG. Quyết định luật (preview giữ
  keyframes vs trackgeq bỏ keyframes) vẫn thuộc về parent — số đo không
  tự chọn phe nào; chỉ ghi rõ: mode mặc định png thì 3 phía khớp nhau.

## 2. (b) Feather > 0 + track — tâm khớp, biên preview rộng hơn render ~4px

Mask `feather=0.2` (không keyframes). Độ rộng biên 10%–90% đo trên profile
ngang qua hàng centroid.

| t (s) | render png cx / edgeL / edgeR / w50 | render trackgeq (t=1.0) | preview cx / edgeL / edgeR / w50 |
|---|---|---|---|
| 0.5 | 0.4004 / 59.1 / 58.1 / 512.2 | — | 0.4008 / 62.7 / 62.3 / 510.4 |
| 1.0 | 0.5004 / 57.6 / 58.3 / 511.6 | 0.5004 / 58.1 / 58.0 / 511.8 | 0.5008 / 62.8 / 62.5 / 510.7 |
| 1.5 | 0.6004 / 57.8 / 58.2 / 512.0 | — | 0.6008 / 62.8 / 62.4 / 511.0 |

- **Tâm: preview vs render png |Δcx| ≤ 0.0004 (≤ 0.5px). Khớp.**
- **Biên feather: render png ≈ 58px, trackgeq ≈ 58px (bằng nhau tới
  0.5px — feather parity giữa 2 mode render giữ nguyên khi có track),
  preview ≈ 62.5px — rộng hơn render ~4–5px.** Cùng nguyên nhân như O4
  §4 (mask áp trên intermediate ≤ 640px rồi upscale): viền mềm thêm, tâm
  không lệch. Mức này nhỏ (biên ~58px, lệch tương đối ~7%) và đã biết từ
  trước, không phải hồi quy.
- Ghi chú công thức: biên 10–90% đo được ≈ 58px khớp `0.8 × feather ×
  h_px = 0.8 × 0.2 × 360 = 57.6` (h_px = chiều cao ellipse tính bằng px),
  KHÔNG khớp `0.8 × feather × w_px` (= 82px). Công thức O3 §3(c) dùng
  `w=h=0.3` nên không phân biệt được 2 cách tính; với ellipse w≠h thì
  biên ngang theo chiều cao ellipse. Đây chỉ là quan sát về công thức,
  không ảnh hưởng parity (cả 3 đường đều ra ~58px, trừ preview +4px).

## 3. (c) Mask+track+SR — scale và rotation đều KHỚP (Δ ≤ 1px)

### (c1) Scale keyframes 1.0 → 0.5 (tuyến tính 0→2s)

Mô hình kỳ vọng (scale quanh tâm khung, unit căn giữa): tâm cuối =
`0.5 + (track − 0.5)·s(t)`; w = 0.4·s, h = 0.5·s.

| t (s) | kỳ vọng cx / w / h | render png | preview |
|---|---|---|---|
| 0.5 (s=0.875) | 0.4125 / 0.3500 / 0.4375 | 0.4129 / 0.3492 / 0.4362 | 0.4133 / 0.3505 / 0.4348 |
| 1.0 (s=0.750) | 0.5000 / 0.3000 / 0.3750 | 0.5003 / 0.2984 / 0.3722 | 0.5007 / 0.2996 / 0.3732 |
| 1.5 (s=0.625) | 0.5625 / 0.2500 / 0.3125 | 0.5627 / 0.2484 / 0.3097 | 0.5631 / 0.2486 / 0.3116 |

- **Preview vs render: |Δcx| ≤ 0.0004 (≤ 0.5px), |Δw/h| ≤ 0.002
  (≤ 2.6px). Khớp.** w50: render 445.9 / 381.8 / 317.7 vs preview
  443.5 / 380.2 / 315.4 (lệch ≤ 2.4px).

### (c2) Rotation keyframes 0° → 30° (tuyến tính 0→2s)

Mô hình kỳ vọng: xoay quanh tâm khung **trong không gian pixel**
(xoay điểm (x, y) quanh (640, 360) theo góc θ, rồi đổi về hệ 0..1 theo
từng trục — lưu ý: công thức chuẩn hoá từng trục (dx_norm·sinθ) là SAI
vì 1 đơn vị x ≠ 1 đơn vị y tính bằng px; P3 đã tính sai lần đầu rồi sửa
khi đối chiếu số đo).

| t (s) | kỳ vọng cx / cy (pixel-space) | render png | preview |
|---|---|---|---|
| 0.5 (θ=7.5°) | 0.4009 / 0.4768 | 0.4012 / 0.4776 | 0.4015 / 0.4783 |
| 1.0 (θ=15°) | 0.5000 / 0.5000 | 0.5003 / 0.5009 | 0.5006 / 0.5017 |
| 1.5 (θ=22.5°) | 0.5924 / 0.5680 | 0.5926 / 0.5689 | 0.5928 / 0.5698 |

- **Preview vs render: |Δcx| ≤ 0.0003, |Δcy| ≤ 0.0009 (≤ 0.65px @720).
  Khớp.** w50: render 506.1 / 493.6 / 476.2 vs preview 502.6 / 493.4 /
  474.9 (lệch ≤ 3.5px).
- Kết luận (c): **SR + mask + track parity ĐÃ ĐO, KHỚP ở cả 2 nhánh.**
  Không cần sửa gì.

## 4. (d) Mask+track+motion blur — LỆCH THẬT, đã lượng hoá (cần parent quyết)

Spec: `clip.motion.motionBlur = { frames: 3, weights: [1, 1, 1] }`
(tmix 3 frame ở render, ghost blend 3 frame ở preview). Đo preview ở
chế độ PHÁT (blur chỉ blend khi đang phát — preview.tsx:1772), render
trích frame.

### Render: motion blur KHÔNG có tác dụng gì lên mask+track

| t (s) | render png + blur: cx / w / count | render png KHÔNG blur (đối chứng) |
|---|---|---|
| 0.5 | 0.4004 / 0.3992 / 144706 | 0.4004 / 0.3992 / 144706 |
| 1.0 | 0.5004 / 0.3984 / 144705 | 0.5004 / 0.3984 / 144705 |
| 1.5 | 0.6004 / 0.3984 / 144705 | 0.6004 / 0.3984 / 144705 |

- **MAD giữa frame có-blur và không-blur tại t=1.0 = 0.0 (giống hệt
  từng pixel).** Đúng theo thứ tự pipeline render: tmix áp TRƯỚC mask
  (render.js:775 `motionChain` → mask sau đó), mà nguồn trắng trơn thì
  tmix của các frame giống hệt nhau = chính nó → mask vẫn sắc nét, không
  vệt. Với footage có vân/chuyển động, tmix sẽ mờ nội dung video BÊN
  TRONG mask, nhưng biên mask vẫn sắc (mask áp sau) — chưa đo với footage
  thật (xem §6).

### Preview (đang phát): blur KÉO VỆT mask về phía sau

| t (s) | playhead lúc đo | preview cx (kỳ vọng sắc = track) | w50 (sắc = 510) | edgeR (sắc ≈ 0.8) |
|---|---|---|---|---|
| 0.5 | 0.500 | 0.3908 (lệch −0.0092 ≈ −12px) | 515.9 | 17.1 |
| 1.0 | 1.000 | 0.4908 (lệch −0.0092 ≈ −12px) | 516.2 | 17.1 |
| 1.5 | 1.500 | 0.5875 (lệch −0.0125 ≈ −16px) | 524.0 | 25.1 |

- Mô hình ghost giải thích đúng số đo: composite = trung bình 3 ellipse
  tại track(t), track(t−1f), track(t−2f); ngưỡng luma 128 chỉ giữ pixel
  thuộc ≥ 2 ellipse → vùng sáng = hợp giao nhau, tâm dịch về sau đúng
  ~1 frame (0.0067) + tâm vùng hợp dịch thêm ~0.003. Dự đoán tại t=0.5:
  vùng [0.1867, 0.5933], tâm 0.3900 — đo được [0.1882, 0.5938], tâm
  0.3908 (khớp tới ~2px). Tại t=1.5 lệch thêm ~3px do canvas trễ 1 frame
  so với playhead (xem §4).
- **Kết luận (d): preview và render LỆCH nhau về motion blur + mask
  theo đúng thiết kế khác nhau của 2 đường: preview ghost-blend mờ cả
  BIÊN MASK (vệt dài ~12–16px @1280, biên phải mềm 17–25px thay vì
  0.8px); render tmix (trước mask) không chạm được vào biên mask — với
  nguồn trơn thì hiệu ứng bằng 0 tuyệt đối.** Đây KHÔNG phải bug gõ sai
  hay regression — là khác biệt ngữ nghĩa giữa 2 cách implement. P3
  KHÔNG sửa production (không có sửa an toàn hiển nhiên). Đề xuất cho
  parent (§6): (i) chấp nhận lệch, ghi rõ trong docs (preview là xấp xỉ
  ghosting, render là tmix thật); (ii) render áp tmix SAU mask để vệt
  theo mask (đổi thứ tự pipeline, cần đo lại toàn bộ combo motion);
  (iii) preview không ghost phần mask (chỉ ghost video trần — đổi ngữ
  nghĩa preview). P3 khuyến nghị (i) trừ khi parent muốn đầu tư (ii).

## 5. (e) Mask+track+transition (preview) — KHỚP render png cả trong cửa sổ chuyển cảnh

Clip 1 trắng (mask+track `(0,0.3)→(3,0.9)`, `transitionOut fade 1s`),
clip 2 đen, project 6s. Cửa sổ transition [2, 3]s. Đo preview (ngưỡng 32)
vs render png (ngưỡng giữa, xem §4).

| t (s) | track kỳ vọng | render png cx / w50 / rowMax | preview cx / w50 / rowMax |
|---|---|---|---|
| 1.0 (đối chứng) | 0.5000 | 0.5004 / 510.0 / 255 | 0.5007 / 505.5 / 255 |
| 2.2 (p=0.2) | 0.7400 | 0.7404 / 511.0 / 204 | 0.7409 / 508.9 / 206 |
| 2.5 (p=0.5) | 0.8000 | 0.8004 / 509.5 / 137 | 0.8007 / 505.9 / 134 |
| 2.8 (p=0.8) | 0.8600 | 0.8432* / 433.4 / 51 | 0.8430* / 430.2 / 61 |

\* Tại t=2.8 ellipse chạm/tràn mép phải khung (tâm 0.86 + w/2 0.2 =
1.06 > 1) nên centroid bị kéo trái — cùng một độ lệch ở cả 2 phía
(0.8432 vs 0.8430, lệch nhau 0.0002). Kiểm tra không chệch: mép trái
x0 = 0.6605 (render) vs 0.6610 (preview), kỳ vọng 0.86 − 0.2 = 0.66 —
khớp tới 0.001.

- **Preview vs render trong transition: |Δcx| ≤ 0.0005, |Δw50| ≤ 4.6px.
  KHỚP.** Mask vẫn bám track trong lúc fade; video đứng yên cả 2 phía
  (không shift D3 cho unit đã merge — khớp O2 §5).
- Mức fade (rowMax): preview 255 / 206 / 134 / 61 vs render 255 / 204 /
  137 / 51 — gần như tuyến tính cả 2 phía; tại p=0.8 preview sáng hơn
  render ~10 luma (61 vs 51: preview cộng thêm clip đen RGB ~16 đang
  fade vào; render xfade ra 51 đúng 255×0.2). Chênh nhỏ, không ảnh hưởng
  vị trí.
- Quan sát phụ (chưa rõ cơ chế, không ảnh hưởng tâm): nền frame render
  trong cửa sổ xfade bị nâng lên luma ~40 (p=0.2), ~63 (p=0.5), ~39
  (p=0.8) thay vì 0; ngoài cửa sổ nền = 0 (đo tại t=1.0 và t=4.0). Nền
  preview trong transition ≈ 0–13. P3 không đào sâu vì ngoài phạm vi
  (tâm mask không bị ảnh hưởng); ghi lại để luồng khác tra khi cần.
  Tương tự, mức ellipse render tại t=2.5 là 137 thay vì 127.5 tuyến tính
  (+9.5 luma) — chưa rõ cơ chế, sai số vị trí = 0.

## 6. Kiểm chứng đã chạy (số thật)

- Render 9 job 720p (driver `/tmp/round88-p3/run-renders.mjs`): a-png
  35.6s, a-trackgeq 84.6s, b-png 31.9s, b-trackgeq 128.7s, c-scale-png
  26.7s, c-rot-png 24.4s, d-blur-png 15.5s, d-noblur-png ~15s, e-png
  20s. Tổng ~7 phút render (trackgeq ~1.1 fps như O3 đã đo).
- Preview 6 case qua harness mới (mỗi case 1 lần chạy CDP; case E chạy
  2 lần — lần 2 sau khi sửa ngưỡng biên theo nền, tâm giống hệt lần 1).
- Test logic hồi quy (esbuild bundle + node): `maskTrackPreview87O4`
  **37 check xanh** (P6 đã mở rộng từ 12 → 37 khi chuyển sang helper
  O1, gồm sweep parity helper == công thức inline cũ);
  `lib/maskTrack.test.ts` **22 pass, 0 fail** (bundle ESM trong repo —
  bundle CJS ra /tmp vẫn lỗi `import.meta.url` như O4 đã ghi, không phải
  lỗi code); `lib/maskKeyframes.test.ts` **14 pass, 0 fail**;
  `lib/previewEngine.test.ts` **14 passed**.
- Render: `mask.js --self-test` pass; `test_d4_mask_keyframes.js`
  **13/13**; `test_d3_trackfollow.js` **22/22**;
  `test_round87_o2_mask_track.js` **25/25**.
- `npx tsc --noEmit` apps/web: **0 lỗi** (4 lỗi O5 đợt 87 đã hết).
  `npx vite build`: **PASS** (6.04s).
- KHÔNG sửa production: chỉ thêm harness + doc này. P6 (luồng song
  song) đã sửa `preview.tsx` trong lúc P3 đo (`maskedUnitSource` dùng
  helper O1 thay cho bản inline O4) — các số parity ở §1–§3, §5 ĐO TRÊN
  CÂY ĐÃ CÓ P6, nên đồng thời kiểm chứng refactor P6 không đổi hành vi
  (khớp render tới ≤ 0.0009 ở mọi case không-blur).

## 7. Giới hạn đã biết / bài học harness (không giấu)

- **Bẫy tên media (mất ~1 lượt đo):** spec ghi `src: "white720.mp4"`
  nhưng file import tên `white720-p3.mp4` → preview vẽ chữ "Thiếu media:
  white720.mp4" lên canvas (129 pixel sáng, max luma 151 — nhìn như
  canvas đen). Media lookup theo TÊN nên tên file import phải khớp đúng
  `clip.src`. Harness không tự phát hiện (seed trả về media OK) — lần sau
  nên kiểm tra số pixel sáng > 1000 sau seed.
- **Modal chào mừng:** chỉ mount khi `ready=true` nên bấm "Để sau" 1 lần
  ngay sau boot có thể trượt (lần đo A đầu của P3). Harness nay poll tới
  10s.
- **Đo khi đang phát (mode play):** poll playhead từ Node qua CDP bị
  overshoot tới +0.57s dưới tải VM (lần đo D đầu: playhead 1.067 khi cần
  0.5; canvas trễ, đo ra frame cũ). Harness nay đo TRONG TRANG theo rAF
  (play + đo cùng task) — playhead lúc đo = đúng mốc (0.500 / 1.000 /
  1.500); sai số còn lại ±1 frame do canvas vẽ lệch tick (thấy ở D t=1.5:
  tâm lệch thêm ~3px).
- **Ngưỡng đo trong transition:** nền render bị nâng (xem §5) nên ngưỡng
  tuyệt đối 128 sai (t=2.5 chỉ còn 279 pixel > 128, tâm lệch +0.014 do
  ngưỡng). Đã chuyển sang ngưỡng giữa (render) / 32 (preview) + so sánh
  chính bằng w50 (theo nền). Biên 10–90% cũng phải tính theo nền
  (bg + frac·(max−bg)) — code đo cũ cho ra edgeL = 769px vô nghĩa.
- **Trích frame `-ss`:** mức fade tại t=2.5 lệch +9.5 luma so với tuyến
  tính trong khi tâm thì đúng tuyệt đối — có thể do frame lệch ±1 hoặc
  đường cong xfade; P3 không kết luận, chỉ ghi sai số vị trí = 0.
- **Chưa đo:** trackgeq cho SR / motion blur / transition (geq chậm
  ~1.1 fps, mỗi job 80–160s; chỉ đo trackgeq cho (a) và (b) — 2 chỗ cần
  nhất); motion blur với footage thật có vân/chuyển động (nguồn trơn
  làm tmix render vô hình — xem §4); mask+track với `in ≠ 0` / clip
  `start ≠ 0` (P9 đợt 88 đo trackgeq với start=1.0 ở luồng riêng);
  image clip + track + SR (validator hạn chế track ở video).
- Spec `d-noblur.json` bản đầu P3 viết tay bị lỗi JSON (thiếu dấu) —
  render từ chối với lỗi rõ ràng (fail-fast tốt); đã viết lại bằng
  script + validate rồi render lại.
- Không đụng: TTS 39, file workflow, production. Harness + doc là file
  mới của P3 (xem §8).

## 8. Nợ mở cho parent

1. **Keyframes+track, luật nào thắng ở trackgeq (mục (a)):** số đo đã có
   (trackgeq đóng băng w/h, lệch 127px @1280 tại t=0.5/1.5). Chốt 1 luật
   cho cả preview lẫn render trackgeq: hoặc trackgeq nhận w/h keyframes
   (theo O1/png), hoặc preview bỏ keyframes khi có track (theo O3).
2. **Motion blur + mask (mục (d)):** lệch thật đã lượng hoá (preview vệt
   ~12–16px, render 0). Chọn 1 trong 3 hướng ở §4 (khuyến nghị: chấp
   nhận + ghi docs, trừ khi muốn đầu tư đổi thứ tự tmix/mask).
3. **Biên feather preview rộng hơn render ~4px (mục (b))** — đã biết từ
   O4 (intermediate 640px), nay có số chính xác cho feather 0.2. Muốn
   khớp hẳn thì tăng intermediate hoặc áp feather sau upscale (tốn hiệu
   năng preview).
4. **Nền xfade bị nâng + mức fade lệch ~10 luma (mục (e))** — quan sát
   phụ, chưa rõ cơ chế; không ảnh hưởng vị trí mask nhưng đáng tra nếu
   ai đó đo độ sáng tuyệt đối trong transition.
5. **Chưa đo trackgeq cho SR/motion blur/transition** — nếu parent cần
   đủ bộ thì chạy thêm 3 job trackgeq (~5–8 phút render).

## 9. File đổi (stage, KHÔNG push)

- `apps/web/scripts/probe88p3-mask-track-parity.cdp.mjs` — mới, harness
  CDP đo parity (pause + play trong trang theo rAF, fit-rect động,
  profile biên theo nền, poll đóng modal).
- `docs/PHASE9_ROUND88_P3_MASK_TRACK_PARITY_LIMITS.md` — file này.
- Không stage binary: mp4 trắng/đen test + mp4 render + frame đo nằm ở
  `/tmp/round88-p3/` (specs `a-keyframes/b-feather/c-scale/c-rot/
  d-blur/d-noblur/e-transition.json`, kết quả render
  `out/render-results.jsonl`, kết quả preview `out/preview-*.json`).
  File `white720.mp4` / `black720.mp4` (+ bản `-p3`) tạm trong
  `apps/web/public/` đã xóa sau khi đo xong.
- Log luồng: `workspace/goals/capcut-clone-video-editor/hidden_files/round88-p3.md`.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round88-p3-mask-track-parity.txt`.
