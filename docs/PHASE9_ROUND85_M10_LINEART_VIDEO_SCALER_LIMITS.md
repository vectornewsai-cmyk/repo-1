# Phase 9 đợt 85 — Luồng M10: Lineart — probe scaler video với nguồn video thật

**Trạng thái:** ĐÃ ĐO XONG + ĐÃ SỬA (production) + **ĐÃ VERIFY TRONG APP (harness L5 chạy lại: 7/7 pass)**.
**Ngày:** 11/11/2026. **Repo:** `~/workspace/repo-1`, branch main. **KHÔNG PUSH, KHÔNG release/tag.**
**Batch stage:** `phase9-round85-m10-lineart-video-scaler.txt`.

## 0. Tóm tắt — delta đã được định vị và sửa

| Khâu | Kết luận (số đo thật) |
|---|---|
| Decode | SẠCH — S0 vs ffmpeg MAD 0–0,286 (khớp L5) |
| Scale đường plain (video→viewport trực tiếp) | **Scaler TAM GIÁC + lệch pha ~−0,03** — đây là nguồn delta |
| Scale đường canvas (canvas→canvas, kể cả đường sharp) | **Mitchell (B=C=1/3), MAD 0,000–0,013** — tái lập đúng J2 |
| Color-convert | Không tách luma/chroma — 3 kênh xử lý như nhau |
| Fix (preview.tsx) | Intermediate native 1:1 cho đường plain upscale → **trong app: plain-vs-Mitchell(S0) lineart 5,607→0,013; textsmall 0,427→0,000** (harness L5 chạy lại 7/7 pass); bare-page A/B: 5,60→0,24 (1px), 4,26→0,18 (2px) @s=1,264; 2,83→0,21 @s=2,0; 7,60→0,29 @s=0,632 — mức nhiễu decode |

Delta 5,39/4,05 của L5 được giải thích đầy đủ: **plain dùng scaler tam giác, render dùng Mitchell** —
không phải decode, không phải color-convert, không phải effect canvas/composite (L5 đã đóng),
không phải nguồn canvas hay cờ `willReadFrequently` (E2 loại), không phải kernel/phương pháp
so sánh (xem §5 về sai số phương pháp đã sửa).

## 1. Phương pháp

- **Probe headed kiểu J2** (bare page, không qua app): Chrome 1254 (`~/.cache/ms-playwright/chromium-1254`),
  `--disable-gpu`, Xvfb, HTTP server hỗ trợ `Range 206` (bắt buộc cho video dài, nếu không Chrome treo metadata).
  Trang trần load video → seek → capture: S0 (video→native 1:1), Bview (video→viewport trực tiếp 809×455),
  C2 two-step (video→native canvas rồi canvas→viewport), Bapp/C2app (đúng transform app:
  scale 1,2638889, offX 0,0556), thêm s=2,0 (1280×720) và s=0,632 (405×228).
  Sweep xung: 640 frame dọc + 360 frame ngang, seek từng frame. **3/3 pass** (D1 pixel-identical,
  D2 seek đúng frame 1000/1000, H9 0 lỗi trang).
- **Media sinh mới** (`apps/web/scripts/r85m10-make-media.py`, numpy→ffmpeg rawvideo, 640×360 30fps
  yuv420p crf 18): `impulse-v-640.mp4` (cột trắng 255 tại x=f), `impulse-h-640.mp4`,
  `step-640.mp4` (64→192 tại x=320), `impulse-red-640.mp4` (cột đỏ tại x=320).
  Tái dùng media cũ: G5 `lineart-640.mp4` (nét 1px), H3 `lineart2px-640.mp4`, H3 `sqw4-640.mp4`.
  Sanity encode: frame 320 impulse-v đỉnh 251 tại x=320, nền đúng 128; cột đỏ lan 2px do chroma 420.
- **Model:** production `chrome-resample.mjs` (`bilinearPlane2D` + `chromeWeights1D`) đối chứng MAD 0
  với model của luồng; render model `chromeResampleRgb24` (trilinear LOD-bias −0,5 mọi thang).
- **Cạm bẫy seek:** seek tới `currentTime = f/30` đúng biên khiến ~24% frame hiển thị frame f−1
  (đỉnh S0 lệch −1, không bao giờ +1). Lọc frame sạch bằng đỉnh S0 == f VÀ window MAD vs ffmpeg < 0,5
  → v 460/640, h 234/360. Luồng sau seek tới giữa frame ((f+0,5)/30).

## 2. Kết quả probe chính (round+clamp, xem §5)

### 2.1 Decode — SẠCH

S0 vs ffmpeg cùng frame: step 0; impulse-red 0,005; impulse-v-f320 0,002; impulse-h-f180 0,003;
lineart640 0,286 (R 0,271 / G 0,310 / B 0,278 — khớp đúng L5); lineart2px 0,238; sqw4 0.
Decode không phải nguồn delta.

### 2.2 Kernel fit @s=1,264 (so với S0 thật, đã làm tròn+kẹp)

| Nguồn | Bview (video trực tiếp) tốt nhất | C2 (two-step) vs Mitchell |
|---|---|---|
| step-640 | tri 0,010 (phi −0,0625 → 0) | **0,000** |
| impulse-red-640 | tri 0,015 (phi −0,044 → 0,005) | **0,000** |
| impulse-v-640-f320 | tri 0,019 (phi −0,0625 → 0,006) | **0,000** |
| impulse-h-640-f180 | tri 0,018 (phi −0,03125 → 0,013) | **0,000** |
| sqw4-640 | tri 0,963 (phi −0,03125 → 0,501) | **0,000** |
| lineart640 (1px) | tri 3,953 (phi −0,03125 → 2,024) | **0,013** |
| lineart2px-640 | tri 3,083 (phi −0,03125 → 1,648) | **0,001** |

- **Video scaler ≈ tam giác + lệch pha ~−0,03.** Trên nội dung cô lập (step/impulse) tri khớp ~0,01,
  phi −0,0625 đưa về ~0,000–0,007. Không overshoot ở bước (trái với Mitchell):
  Bview min 64 / max 192, pixel chuyển tiếp 120 vs tri 128 — lệch phải ~0,05–0,06px, khớp quan sát L5.
- **Phần dư tuần hoàn/lineart không đóng được bằng kernel/phi:** sau phi tối ưu, Bview-vs-tri còn
  2,02 (1px) / 1,65 (2px) / 0,50 (sqw4). Không kernel nào trong thư viện
  (tri/BC/Mitchell/Catmull/B-spline/Lanczos2/3/box) + không phi nào + không quy tắc biên nào
  (renorm/replicate/drop) đóng được. Edge-map: lỗi KHÔNG tập trung ở biên (interior 1,598 / edgeBand 1,662);
  không pixel nào lệch >40.
- **Canvas scaler = Mitchell, chính xác:** C2 vs Mitchell(S0) 0,000–0,013 trên MỌI nguồn.
  C2app vs Mitchell (phiApp): 0,001–0,005 (cô lập), 0,181 (sqw4), 1,602→**0,013** (1px, số cũ 1,602
  là sai số phương pháp, xem §5), 2,605→**0,001** (2px).
- **Sweep frame sạch (1D, cửa sổ ±12px):** tri 0,449 (v) / 0,439 (h); tri-phi −0,03125 → 0,247/0,241;
  grid tốt nhất (B=0,25, C=0) 0,687/0,685. Centroid dịch +0,01–0,06 trơn theo pha — không có bậc thang
  lượng tử hoá pha. Dị hướng X/Y: không (H1 ≡ V1 đúng từng số).
- **Xung đỏ theo kênh:** Bview-vs-tri R/G/B = 0,014/0,015/0,016 — không tách luma/chroma.

### 2.3 A/B plain-vs-render (so với model render đúng, round+clamp)

| Thang | Nguồn | Direct (video 1 bước) | Two-step (qua canvas native) |
|---|---|---|---|
| s=1,264 (sạch) | lineart 1px | 5,596 | **0,242** |
| s=1,264 (sạch) | lineart 2px | 4,183 | **0,177** |
| s=1,264 (sạch) | sqw4 | 2,352 | **0,000** |
| s=1,264 (app-geom) | lineart 1px | 5,607 | **0,243** |
| s=1,264 (app-geom) | lineart 2px | 4,256 | **0,176** |
| s=2,0 | lineart 1px | 2,827 | **0,207** |
| s=2,0 | lineart 2px | 1,705 | **0,154** |
| s=0,632 (vs trilinear) | lineart 1px | 7,600 | **0,287** |
| s=0,632 (vs trilinear) | lineart 2px | 5,497 | **0,237** |
| s=0,632 (vs trilinear) | sqw4 | 1,687 | **0,000** |

Phần dư two-step ~0,18–0,29 ≈ nhiễu decode (0,24–0,29) — tức đường plain qua intermediate
khớp render tới mức nhiễu decode. **Two-step thắng ở MỌI thang (upscale lẫn downscale), không cần gate
theo thang.** Lưu ý: so downscale với model Mitchell là SAI (render downscale dùng trilinear,
không phải Mitchell) — số downscale đúng phải so với `chromeResampleRgb24` (bảng trên đã dùng đúng model).

## 3. Các thí nghiệm loại trừ (E2–E4)

- **E2 — nguồn canvas × willReadFrequently:** putImageData(S0-lineart) vs Mitchell = 0,013 — giống hệt
  video-drawn C2; cả 4 combo willReadFrequently (s/d × T/F) cho pixel giống hệt nhau (MAD 0);
  sharpened put vs Mitchell(S2m) = 0,013. **Loại:** nguồn canvas, cờ willReadFrequently, plain-vs-sharpened.
  Video control tái lập C2 pixel-identical (MAD 0).
- **E3 — pattern tổng hợp (putImageData):** V1/H1/G1/C1/S4hi/V2/V4 @809×455 và @1280×720 —
  sau round+clamp: vs Mitchell 0,000–0,013 tất cả (S4hi 0,000; V1 0,005; G1 0,013; C1 0,013).
  **Canvas scaler = Mitchell trên mọi pattern, kể cả lưới và vòng tròn.**
- **E4 — tái lập J2 y hệt (512×512, đúng PAGE J2):** sqw4/sqw8/sqw4-hi/sqw4-lo/step/impulse/checker8
  @s=1,1328/1,2637/2,0 — **Mitchell 0,000–0,003 trên mọi pattern 1D; checker8 2D 0,000–0,039;
  medium sqw4 = tri 0,000.** J2 tái lập đúng từng số. Mâu thuẫn J2-vs-M10 ở phân tích lần 1
  là do sai số phương pháp (§5), không phải do Chrome hay harness.

## 4. Hướng sửa đã áp dụng (preview.tsx)

**Nguyên nhân gốc trong app:** đợt 75 C1 đã vá "rò plain" nhưng CHỈ khi media lớn hơn letterbox
(`mw > dw || mh > dh`), cố ý giữ đường vẽ cũ khi media ≤ project ("tránh đổi hành vi upscale").
Trường hợp L5 (media 640×360 = letterbox 640×360, upscale xảy ra ở viewport với vp.scale 1,264)
không được chuẩn hoá → video element vẽ trực tiếp lên viewport bằng scaler tam giác.

**Thay đổi (tối thiểu, đúng pattern C1):**

1. Thêm `plainNativeCanvas` + `plainNativeSource(src, w, h)` — canvas tái dùng, vẽ 1:1
   (`imageSmoothingEnabled=true`, `imageSmoothingQuality="high"`, như effectCanvas/letterbox).
2. Sau khối C1 trong `drawVideoClip`, khi `!srcAtLetterbox && !(mw > dw || mh > dh)` và
   `drawSrc instanceof HTMLVideoElement`, đưa drawSrc qua `plainNativeSource(drawSrc, mw, mh)`.
   **Intermediate ở khổ NATIVE mw×mh (1:1, không resample ở chặng này)** — khác
   `letterboxIntermediateSource` (vẽ về dw×dh): với media < letterbox, vẽ về dw×dh sẽ là
   upscale tam giác ở chặng 1, không bằng chứng nào ủng hộ; native 1:1 đúng probe C2 ở mọi thang.
3. Phạm vi: CHỈ đường plain live (video element thô). Held-frame canvas (đã là canvas → Mitchell),
   VideoFrame (WebCodecs, opt-in, scaler chưa đo), chroma/LUT/effects/enhance (đã ra canvas) giữ nguyên.
   Thất bại (không document/context) → giữ drawSrc cũ, không crash. Mask/SR/motion-blur/vignette
   đọc drawSrc như cũ (nay là canvas native thay vì video — cùng nội dung, scaler đúng hơn).

**Kiểm chứng code:** `npx tsc --noEmit` = 0 lỗi; `npx vite build` pass (12,61s);
`node --test apps/web/scripts/chrome-resample-67u2.test.mjs` = 8/8 pass.

**Verify trong app — ĐÃ XONG:** chạy lại harness L5 (`r84l5-effect-canvas-probe-headed.mjs`, full
2 nguồn × 3 variant, SCRATCH `hidden_files/round85-m10/l5-rerun`, Xvfb :174, vite 5684):
**7/7 pass** (D1 cùng-khung, D2 direct-draw native pixel-identical, D3 hook effect-canvas vắng ở plain,
H9 0 lỗi trang — cả 2 nguồn). Số đo S3 (so kiểu L5: Mitchell trên S0 của chính app, hình học
rect.scale + phiX −0,044):

| Nguồn / variant | Trước fix (L5) | Sau fix (M10 rerun) |
|---|---|---|
| lineart640 / plain | 5,607 | **0,013** |
| textsmall640 / plain | 0,427 | **0,000** |
| lineart640 / sharp05, sharp10 (so với model PLAIN — chỉ tham khảo) | 0,013 vs model sharpened | 0,914 / 0,948 (sharpen làm khác model plain là đúng; L5 đo sharp vs model sharpened = 0,013) |

Đối chứng chéo: S3 plain mới vs C2app probe bare-page (two-step) = **0,001** — app sau fix khớp đúng
từng số với dự báo probe; S3 plain mới vs S3 plain L5 gốc = 5,618 (fix đã đổi output đúng bằng delta);
S3 plain L5 gốc vs Bapp (direct video) = 0,062 (đường cũ đúng là video trực tiếp).
Lưu ý đo: so plain với Mitchell(ffmpeg) thay vì Mitchell(S0-app) sẽ lẫn nhiễu decode — lineart
0,243 (decode 0,286), textsmall 1,344 (decode 1,344: Chrome decode text nhỏ khác ffmpeg tới 1,344 MAD,
nội dung chữ mảnh nhạy với decoder; so kiểu L5 dùng S0-app mới là chuẩn).

## 5. Sai số phương pháp đã sửa (quan trọng — đọc trước khi dùng số cũ)

Phân tích lần 1 của luồng này so **FLOAT-model với uint8 Chrome** — sai quy ước J2/L5 (cả hai đều
làm tròn + kẹp model về uint8 trước khi so: `roundU8` = `Math.round` + clamp [0,255]).
Trên nội dung 0/255 (lineart), Mitchell dự báo undershoot/overshoot ngoài [0,255] và giá trị lẻ —
float-vs-uint8 phồng MAD thêm ~0,2–1,5 và tạo ra mâu thuẫn giả với J2/L5:

| Số đo | Lần 1 (float, SAI) | Đúng (round+clamp) |
|---|---|---|
| C2 vs Mitchell, lineart 1px | 1,601 | **0,013** |
| C2 vs Mitchell, lineart 2px | 2,602 | **0,001** |
| E4 sqw4-hi vs Mitchell | 2,289 | **0,002** |
| E4 sqw4 vs Mitchell | 0,192 | **0,000** |
| A/B direct→two-step, 1px app-geom | 6,96→1,69 | **5,61→0,24** |
| Downscale s=0,632 A/B (vs Mitchell, sai model) | 6,72→9,42 ("two-step tệ hơn") | vs trilinear đúng: **7,60→0,29** |

**Mọi số trong doc này là số round+clamp.** Script sửa: `r85m10-rounded-reanalyze.mjs`
(tính lại toàn bộ: E4, probe chính, E3, E2, sweep, step profile) + `r85m10-downscale-ab.mjs`
(downscale vs `chromeResampleRgb24`). Bài học: **mọi so sánh model-vs-Chrome phải round+clamp
về uint8 trước khi tính MAD** — nếu không, nội dung 0/255 sẽ luôn "lệch Mitchell" một cách giả tạo.

## 6. Giới hạn và nợ mở

1. **Chi phí FPS chưa đo.** Fix thêm 1 drawImage video→canvas 1:1 mỗi clip plain mỗi frame.
   Ghi chú đợt 79 G1: drawImage từ video đắt gấp nhiều lần từ canvas cùng khổ — chặng cuối nay
   rẻ hơn (canvas→canvas) nhưng tổng chi phí cần harness G5 đo trước khi claim "không tốn FPS".
   Nếu FPS giảm đáng kể, phương án dự phòng: chỉ áp intermediate khi upscale thật
   (tỉ lệ vẽ thật > 1) — chưa đo nên chưa gate.
2. **VideoFrame (WebCodecs) chưa đo scaler** — đường opt-in này giữ hành vi cũ; nếu sau này bật
   mặc định, cần probe riêng (video→canvas với nguồn VideoFrame có dùng Mitchell không).
3. **Phần dư video-scaler (tri + phi −0,03, còn ~2,0 trên lineart sau phi tối ưu) vẫn chưa có
   cơ chế giải thích đầy đủ** — không còn quan trọng cho fix (đường plain không dùng video scaler
   nữa), nhưng là câu hỏi mở về Chrome internals. Sweep cho thấy lệch pha trơn theo pha,
   không lượng tử hoá; profile xung cho thấy lobe trung tâm hơi hẹp hơn tam giác.
4. **Downscale của đường effects với media < letterbox** (video→effect canvas dw×dh = upscale
   tam giác ở chặng 1) là lệch tiền tồn, ngoài phạm vi luồng này — plain nay khớp sharp
   (cùng chuỗi resample) nhưng cả hai cùng lệch render một lượng nhỏ ở trường hợp đó; cần probe
   riêng nếu muốn sửa.
5. **Số app-geom trong `r85m10-analysis.json` (phân tích lần 1) là SAI** (dùng thang 809/640 thay vì
   `rect.scale` 1,2638889 đều 2 trục) — số đúng nằm trong `r85m10-rounded.json` (F2c đã tính lại).
6. Chưa sửa file nào ngoài `apps/web/src/preview.tsx`. Chưa chạy click-test editor trên browser thật
   (nợ chung của dự án).

## 7. File đã đổi / thêm (stage, không push)

**Sửa:** `apps/web/src/preview.tsx` (thêm `plainNativeCanvas`/`plainNativeSource` + 1 khối gọi
sau C1 trong `drawVideoClip`).

**Script mới (`apps/web/scripts/`):**
`r85m10-make-media.py`, `r85m10-video-scaler-probe-headed.mjs`,
`r85m10-video-scaler-analyze.mjs`, `r85m10-sweep-followup.mjs`, `r85m10-edge-map.mjs`,
`r85m10-phi-sweep.mjs`, `r85m10-canvas-source-probe-headed.mjs`, `r85m10-e2-analyze.mjs`,
`r85m10-pattern-probe-headed.mjs`, `r85m10-e3-analyze.mjs`, `r85m10-j2-replicate-headed.mjs`,
`r85m10-e4-analyze.mjs`, `r85m10-rounded-reanalyze.mjs` (phân tích đúng, round+clamp),
`r85m10-downscale-ab.mjs` (downscale vs trilinear),
`r85m10-l5-rerun-analyze.mjs` (MAD S3 trong app sau fix, đúng hình học app).

**Doc:** `docs/PHASE9_ROUND85_M10_LINEART_VIDEO_SCALER_LIMITS.md` (file này).

**Evidence (KHÔNG stage, ở `hidden_files/round85-m10/`):** `r85m10-probe.json` (103,5 MB),
`r85m10-analysis.json` (lần 1, float — CHỈ DÙNG THAM KHẢO, số app-geom sai),
`r85m10-followup.json`, `r85m10-edge-map.json`, `r85m10-phi-sweep.json`,
`r85m10-e2-probe.json`, `r85m10-e2-analysis.json`, `r85m10-e3-probe.json`,
`r85m10-e3-analysis.json`, `r85m10-e4-probe.json`, `r85m10-e4-analysis.json`,
`r85m10-rounded.json` (số đúng), `r85m10-downscale-ab.json`, `media/*.mp4` + `manifest.json`,
`raw-s0/*.rgb`, các `.log`, `l5-rerun/` (harness L5 chạy lại: report + snaps 7/7 pass),
`r85m10-l5-rerun-analysis.json` (số verify trong app), `r85m10-l5-rerun.log`.
