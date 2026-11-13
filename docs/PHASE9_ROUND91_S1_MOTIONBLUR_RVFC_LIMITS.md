# Đợt 91 — S1: Motion blur preview qua requestVideoFrameCallback (rVFC) + đo combo D/E + điều tra mép 3.6px

**Ngày:** 12/11/2026. **Luồng:** S1 (đợt 91). **Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Nợ gốc:** R1 §5 (đợt 90) — (1) gStd phụ thuộc khoảng cách tick; (2) mép phải max 3.6px ở khung lẻ;
(3) combo mask+SR+blur và mask+feather>0+blur chưa đo bằng pixel.
**Kết quả tóm tắt:** pump rVFC hoạt động, **không fallback lần nào**; assert A/B/C/D/E **100/100 ✅**
(5 pass/case, 0 ❌); trail = 0 mọi khung; spread gStd theo cặp (frameIdx,lastFrame) median 0–1.3
(đường tick cũ: 29.1); D/E đo xong và khớp lý thuyết; (c) là **pha sub-pixel của mép mask, có ở cả
pause — KHÔNG sửa code**. Giới hạn thật: dưới tải VM này callback rVFC bị gộp (coalesce) nên cửa sổ
blend vẫn thưa hơn thiết kế — lợi ích đầy đủ chỉ khi main thread rảnh.

## 1. Cái đã làm

### (a) Pump rVFC — `apps/web/src/preview.tsx` + `apps/web/src/lib/previewEngine.ts`

**Vấn đề gốc (R1):** ring giữ 2 snapshot PHÂN BIỆT gần nhất nhưng không đảm bảo LIÊN TIẾP.
rAF chậm (~10–16fps dưới tải harness) → snapshot cách nhau ~3 frame → cửa sổ blend rộng hơn
tmix-3, gStd biến thiên (37 thay vì ~84), trúng chu kỳ sọc 48px thì gStd về baseline 112.

**Kiến trúc (đã hạ cánh):** pump theo clip (`rvfcPumps`, key = clip.id). `drawVideoClip` khẳng định
(ensure) pump mỗi tick khi clip phát xuôi + có blur + drawSrc là video thô. Callback rVFC tự đăng ký
lại; snapshot vào CÙNG ring `motionBlurSnapshots`, cùng định dạng hình học với snapshot đường tick
của chính đường vẽ đó: mode `"letterbox"` (canvas dw×dh — đường thường/SR) hoặc `"unit"` (canvas W×H
thu theo `MASK_MAX_W`/W=640 — đường mask, giống `rawUnitSource` nhưng CHƯA áp cssFilter; painter
đường mask áp cssFilter lúc blend). Pump mới tạo thì XOÁ ring (tránh trộn snapshot tick cũ đã nướng
cssFilter với snapshot thô mới). Khi pump sống, draw path bỏ qua mọi `updateMotionBlurSnapshots`.
Khi pump chết/fallback, đường tick tiếp quản ngay trong tick đó (watchdog).

**Không dùng pump (fallback đường tick R1):** LUT WebGL / effects / enhance / deint / chroma đã xử lý
drawSrc (cờ `pipelineProcessedDrawSrc` — letterbox/plain-native chỉ là resample thuần nên vẫn dùng
pump); phát ngược / stepping; hold (srcEl là canvas giữ); clip ảnh / VideoFrame.

**Watchdog:** video chạy qua ≥1 frame mới kể từ tick trước mà số capture không tăng → miss; ân hạn
500ms sau tạo pump; 3 miss liên tiếp → kill pump + fallback (`rvfcFallback="no-callback"`).
Callback bọc try/catch → lỗi thì kill + `rvfcFallback="error"`. Pump stale >1.5s không được khẳng
định → dừng (không đăng ký lại); draw path khẳng định lại khi phát lại.

**Quyết định frame** (`rvfcFrameDecision`, pure, trong `previewEngine.ts`): frameIndex<0 → "duplicate";
chưa có frame trước → "capture"; bằng lastFrame → "duplicate"; lùi >1 → "reset-capture"; còn lại
(tiến, lùi đúng 1 = phát ngược từng bước) → "capture". `rvfcSupported(el)` duck-typed.

**Debug state** (`MotionBlurDebugState` +4 field): `rvfcActive` (dính — KHÔNG xoá khi stale sau pause
để harness đọc cuối pass vẫn thấy; chỉ reset khi pump mới/fallback), `rvfcCaptures`,
`rvfcSkippedDuplicate`, `rvfcFallback` ("" = chưa fallback). Hook `window.__vcutMotionBlurSnapshots`
như cũ. Hook test: `window.__vcutDisableRvfc = true` tắt pump để đo baseline đường tick.

### Harness mới — `apps/web/scripts/probe91s1-*.cdp.mjs`

- `probe91s1-motionblur-rvfc.cdp.mjs`: copy từ harness R1, mở rộng — case D/E mới, `--spec-dir`,
  `--disable-rvfc`, ghi thêm mỗi khung `frameIdx`, `dbg` (ring/lastFrame/rvfcCaptures/
  rvfcSkippedDuplicate/ringClears/rvfcActive/rvfcFallback), phân tích `edgeInvestigation` và
  `gStdSpread` theo cặp (frameIdx,lastFrame), assert rVFC (active + không fallback + captures delta
  trong case phủ frame đã lấy mẫu), assert D (w50 theo scale ±20px), E (mép so pause ±15px +
  edgeR≥30px), assert spread (median ≤15 khi đủ ≥5 nhóm).
- `probe91s1-motionblur-rvfc-light.cdp.mjs`: probe nhẹ — seed spec B, chỉ lấy mẫu (ph, vt, ring,
  lastFrame, rvfcCaptures, `totalFrames` qua `getVideoPlaybackQuality`) mỗi rAF, KHÔNG getImageData.
- `probe91s1-pause-edge-sweep.cdp.mjs`: quét pause case A t=0→2.2 bước 0.05, đo edgeL/R bằng đúng
  hàm đo của harness S1 (trích từ file harness, không copy tay).

### Specs mới (scratch ngoài repo, `~/workspace/round91-s1/specs/` — KHÔNG stage)

- `d-blur.json`: mask ellipse w=0.4 h=0.5 feather=0 x=0.5 y=0.5 + scale keyframes
  [{t:0,v:1},{t:2,v:1.3}] + rotation [{t:0,v:0},{t:2,v:15}] + blur frames=3 weights [1,1,1],
  footage stripes-scroll.mp4.
- `e-blur.json`: như B nhưng feather=0.2.

## 2. Số đo thật (12/11/2026)

### 2.1 Assert chính thức — A/B/C/D/E, 5 pass/case, `--assert`
**100/100 ✅, 0 ❌.** File: `~/workspace/round91-s1/out/preview-abcde-assert.json`,
log `~/workspace/round91-s1/assert-abcde.log`.

| case | trail | edgeL/R med (max) | cxDevMed | gStd med t=0.5/1/1.5 (baseline ~112) | spread cặp med/max (nGroups) | rVFC captures delta / frame phân biệt |
|---|---|---|---|---|---|---|
| A static+track | 0 / 242 khung | 2.0/2.1 (2.7/3.6) | 0.001 | 111.8/112/111.9 = pause (identity ✓) | 0.2 / 0.6 (68) | 183 / 69 |
| B scroll+mask tĩnh | 0 / 366 | 1.2/2.1 (1.2/2.1) | 0.001 | 60.7/82.9/83.7 (blur thật ✓) | 0.0 / 110.8 (80) | 223 / 68 |
| C scroll+track | 0 / 356 | 2.0/2.1 (2.7/3.6) | 0.001 | 60.7/82.6/82.3 (blur thật ✓) | 0.6 / 77.5 (82) | 229 / 70 |
| D mask+SR+blur | 0 / 360 | 1.7/4.0 (5.8/4.8) | 0.001 | 83.7/38.3/83.5 (blur thật ✓) | 0.3 / 75.2 (87) | 221 / 70 |
| E feather 0.2+blur | 0 / 302 | 56.5/58.4 (56.5/58.4) | 0.001 | 82.6/83/37.8 (blur thật ✓) | 1.3 / 74.9 (83) | 212 / 69 |

- **rvfcActive=true, rvfcFallback="" ở cả 5 case, mọi pass — không fallback lần nào.**
  `skippedDuplicate` (tick) = 0 ở mọi pass (pump sống nên đường tick không snapshot nữa).
- **D — w50 theo SR:** 547.5 / 582.8 / 614.6 vs kỳ vọng 512·scale = 550.4 / 588.8 / 627.2
  (lệch 2.9 / 6.0 / 12.6, trong ±20 ✓). Tâm cố định 0.501 dưới SR ✓. Mép rộng hơn (med 4.0)
  là do SR (xoay làm mép nghiêng + scale) — play nằm trong khoảng pause D (edgeR pause 2.2/2.2/4.6),
  không phải lỗi blur.
- **E — feather:** edgeL/R play 56.5/58.4 = pause 56.5/58.4 **CHÍNH XÁC ở cả 3 mốc** (khớp dự đoán
  lý thuyết 57.6px: band = 0.2·min(512,360) = 72px, 10–90% = 0.8·72). w50 510.7 (vs B 505.5, +5px
  — ghi nhận, chưa giải thích; xem §5).
- **gStd median thay đổi theo lượt chạy** (B: lượt đo 38.4/38.4/37.8 vs lượt assert 60.7/82.9/83.7)
  — cả hai đều là blur thật, khác nhau do pha cửa sổ theo tải. Chỉ khóa bất đẳng thức
  gStd ≤ 0.85×baseline, không khóa giá trị tuyệt đối.

### 2.2 So sánh rVFC vs đường tick cũ (case B, 3 pass, `--disable-rvfc`)
File: `~/workspace/round91-s1/out/preview-b-tickbaseline.json`.

- Tick-path: rvfcActive=false, rvfcCaptures=0, skippedDuplicate (tick) 15→28→44 (>0 — gate R1 làm việc).
  trail=0, edge 1.2/2.1, cxDevMed 0.001 — kết quả đầu ra giống hệt rVFC.
- **Spread theo cặp (frameIdx,lastFrame): tick median 29.1 (max 77.5, 80 nhóm) vs rVFC median 0.0.**
  Đây là bằng chứng rVFC làm được điều nó được sinh ra để làm: cửa sổ blend giờ xác định theo
  dãy frame trình chiếu (ổn định) thay vì pha lấy mẫu của tick (nhiễu theo jitter rAF).
  Lưu ý: so sánh 1 cặp lượt chạy, tải VM khác nhau giữa hai lượt — ghi rõ, không phóng đại.
- Vì sao nhóm theo cặp mới đúng: nhóm chỉ theo frameIdx cho spread giả lớn (E: 44.7 theo frameIdx
  nhưng 0.05 theo cặp) vì cùng frameIdx nhưng lastFrame khác nhau (callback lag 1 tick) thì cửa sổ
  khác nhau. Nhóm theo cặp sửa đúng lỗi nhóm này; cặp còn thiếu ghost cũ hơn trong ring — đó là
  nguồn của các max lẻ 47–75 (xem §5).

### 2.3 Probe nhẹ — gap frame trình chiếu thật
File: `~/workspace/round91-s1/out/rvfc-light.json`. 2 pass, spec B, không getImageData.

- Pass 1: 29 rAF frames, wall 2.34s, 24 distinct lastFrame, gaps {1:3, 2:6, 3:7, 4:5, 5:1, 6:1},
  captures 23. Pass 2 tương tự (captures 47 tích lũy, gaps tới 8).
- **`totalVideoFrames` 4→74 (delta 70) mỗi pass = video present ~30fps, decoder KHÔNG đuối;
  rVFC chỉ capture 23/70.** Bottleneck là main thread bận (tick preview với xử lý mask CPU +
  contention VM + cell 1.5 CPU) làm callback rVFC bị gộp (coalesce): pump chỉ có 1 callback pending
  tại một thời điểm, đăng ký lại trong callback — frame trình chiếu giữa các lần callback không được
  quan sát. Đây là giới hạn kiến trúc, KHÔNG phải lỗi decoder. Load VM lúc đo: loadavg 1.70/1.80/1.85.

### 2.4 Điều tra (c) — mép phải max 3.6px: KẾT LUẬN PHA SUB-PIXEL, KHÔNG SỬA CODE

- Play (A và C giống hệt): median 2.1 ở mọi bin cx 0.30–0.65; **chỉ bin cx≈0.70 cho median 3.6**
  (A: n=33, max 3.6; C: n=13, max 3.6). Tại cx 0.65 max 3.2 nhưng median vẫn 2.1.
- Mọi khung lẻ đều có ring=2 (KHÔNG phải refill — edgeRByRingLt2 med 2.1/max 2.2; ringEq2 med 2.1/
  max 3.6), r90frac ≈ 0.118–0.124 hằng số, cxCfrac ≈ 0.523.
- **Pause sweep (quyết định):** 45 mốc t=0→2.2, edgeR min 2.1 med 2.1 max 3.6; tại cx=0.7
  (t=2.0–2.2, track dừng) edgeR = 3.6 ở CẢ 5 mốc, r90frac = 0.124 hằng số; edgeR ≥ 3.2 ở 6/45
  mốc (t=1.85: 3.2; t=2.0–2.2: 3.6). File: `~/workspace/round91-s1/out/pause-edge-sweep.json`.
- **Cơ chế:** mép 10–90% rộng ~0.8 canvas px bình thường, ~1.4 canvas px ở pha xấu; ×2.6
  (1 canvas px = 2.6 project px) thành 2.1 vs 3.6 project px — tức là **lượng tử hoá đo theo pha
  sub-pixel của mép mask so với lưới pixel canvas, KHÔNG phải lỗi blend**. Khi mask chạy, pha xoay
  nhanh (median 2.1, max lẻ tới 3.2); khi track dừng ở cx=0.7 (clamp sau t=2), pha đóng băng đúng
  pha xấu nhất → 3.6 hằng số. Pause tái hiện y hệt nên không phải lỗi play/blur — **không sửa code**.
  "Sửa" duy nhất có thể là đổi thang đo (báo mép bằng canvas px thay vì project px) — đó là đổi
  định nghĩa đo, không phải sửa sản phẩm; không làm.

## 3. Kiểm chứng khác

- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- `npx vite build`: **PASS 13.62s**.
- Unit (node --experimental-strip-types): previewEngine **20/20** (17 cũ + 3 mới cho
  `rvfcFrameDecision`/`rvfcSupported`), ghostBlend **15/15**, maskTrack **22/22**,
  maskKeyframes **14/14**, O4 maskTrackPreview87O4 **37/37**.
- Click-test O8 mask bám track (sau sửa drawVideoClip): **Chromium 21/21 PASS, WebKit 21/21 PASS**
  (log `~/workspace/round91-s1/clicktest-o8-chromium.log`,
  `~/workspace/round91-s1/clicktest-o8-webkit.log`).
- Render canonical Q2 **không chạy lại** (render không sửa): B render gStd 95.8/43.2/92.9 tại
  t=0.5/1/1.5, baseline 127; A render MAD=0.0.

## 4. Giới hạn thật của rVFC trên VM này (đọc kỹ trước khi kết luận "đã xong")

1. **Coalescing dưới tải:** rVFC chỉ capture ~1/3 frame đã trình chiếu (23/70 mỗi pass ở probe nhẹ);
   gap frame trình chiếu 1–6 (thỉnh thoảng 8–12–21 khi stall). Cửa sổ blend vẫn thưa hơn thiết kế
   tmix-3 khi main thread bận. Lợi ích đầy đủ của rVFC chỉ đạt khi main thread rảnh — trên máy người
   dùng thật (nhiều CPU hơn) sẽ tốt hơn VM 1.5 CPU này, nhưng chưa đo trên máy khác.
2. **gStd vẫn nhận 3 giá trị rời rạc** (~38/83/112, gMidFrac 1.0/0.556/0.061) — vật lý của trung bình
   3 sóng vuông lệch pha. Median gStd theo mốc thay đổi theo lượt chạy (pha cửa sổ theo tải);
   chỉ khóa bất đẳng thức ≤0.85×baseline.
3. **Spread max lẻ 47–111** ở mọi case — đều ở nhóm khởi động (frameIdx 0–2, ring chưa đầy / frame
   đầu pass) hoặc ghost cũ hơn trong ring khác nhau. Median robust (0–1.3) nên assert dùng median.
4. **Watchdog/fallback chưa từng kích hoạt trong đo** (rvfcFallback="" mọi pass) — đường fallback
   (3 miss → kill → tick) chỉ được kiểm bằng baseline `--disable-rvfc` (đường tick làm việc đúng),
   chưa được kiểm bằng cách giết pump thật giữa chừng phát (ví dụ callback throw). Rủi ro thấp
   (đường tick đã chứng minh), nhưng chưa đo trực tiếp.
5. **WebKitGTK rVFC chưa đo bằng pixel** — chỉ có click-test O8 WebKit 21/21 (không bật blur rVFC
   theo pixel). WebKit có `requestVideoFrameCallback` từ Safari 17 / WebKitGTK 2.44 trở lên; phiên
   bản WebKitGTK trên VM này chưa được xác minh có hỗ trợ hay sẽ fallback. Nếu không hỗ trợ,
   `rvfcSupported` trả false → đường tick tiếp quản (đã có code), nhưng chưa đo thực tế.

## 5. Nợ còn lại (chuyển đợt sau)

1. **Chi phí tick main-thread là blocker tiếp theo của blur preview** (ngoài phạm vi S1): mask CPU
   getImageData/putImageData mỗi tick + contention VM là nguyên nhân rVFC bị gộp. Giảm chi phí tick
   (ví dụ cache, giảm tần suất đo, offload) mới cho rVFC phát huy hết — chưa làm.
2. **E w50 +5px so với B** (510.7 vs 505.5) — ghi nhận, chưa giải thích. Có thể feather làm lệch
   centroid đo (vùng mask R>128 rộng hơn), không phải lỗi hình học (cx vẫn 0.501, edge khớp pause).
3. **C spread theo cặp median 0.6 nhưng chỉ 3 nhóm ở lượt đo 3 pass** — lượt assert 5 pass đã đủ
   82 nhóm; metric ổn, nhưng case C ít tick/pass nên vẫn nhạy với tải VM.
4. **Render canonical cho D/E chưa có** — chỉ có preview pixel. Render D/E (SR+blur, feather+blur)
   cần đo riêng để khẳng định preview≈render như đã làm cho A/B/C ở Q2.
5. **G1, birefnet, WebKit clip D, EPERM cron, TTS 39, ci-security 403** — nợ đợt 90/91 của luồng
   khác, không đụng.

## 6. Caveat về lượt đo

- Vite dev cổng 5173 serve code hiện tại trong suốt lượt đo; **đã sửa `preview.tsx` (hook
  `__vcutDisableRvfc`) GIỮA lượt đo full** — nhưng counters tích lũy liên tục (captures
  271→288→…→523, ringClears 10→32, không reset về 0) chứng minh module KHÔNG bị HMR reset giữa
  chừng; số đo vẫn hợp lệ.
- Media `stripes-static.mp4` / `stripes-scroll.mp4` đã copy vào `apps/web/public/` để đo, **đã xoá
  sau khi đo xong** (binary, không stage — như R1).
- Các file đo/log: `~/workspace/round91-s1/` (out/, *.log, specs/, clicktest-o8*/).

## 7. File stage (batch này, KHÔNG push)

- `apps/web/src/preview.tsx` (pump rVFC + gate 7 call site snapshot + cssFilter cho snap rVFC đường mask)
- `apps/web/src/lib/previewEngine.ts` (`rvfcFrameDecision`, `rvfcSupported`)
- `apps/web/src/lib/previewEngine.test.ts` (+3 test)
- `apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs` (harness chính, case D/E, assert rVFC/spread)
- `apps/web/scripts/probe91s1-motionblur-rvfc-light.cdp.mjs` (probe nhẹ gap frame)
- `apps/web/scripts/probe91s1-pause-edge-sweep.cdp.mjs` (quét pause quyết định (c))
- `docs/PHASE9_ROUND91_S1_MOTIONBLUR_RVFC_LIMITS.md` (file này)
