# LIMITS — Đợt 199 P1: VoiceFX — sửa cold-start transient + gate N12a mới

- Đợt: 199, luồng P1 (Editing Core — preview/render parity, đợt thứ 9 theo hướng mới 25/11).
- Ngày: 27/11/2026. Hạn cờ ~08:00Z, hạn cứng 08:35:51Z. Đóng ~07:00Z.
- Nhiệm vụ (quyết (r)-198 + (a4)-198): (1) xác minh F-198-P1-2 + F-198-P4-2 trên
  app thật (render đầu tiên sau load trang của clip −12; transient không chỉ ở
  220/−12) + tìm cơ chế + sửa; (2) áp gate −12 MỚI của N12a (domFreq/errHarm +
  cao độ wide 10/10; thước tỉ số mag KHÔNG còn là điều kiện flip ở −12);
  (3) KHÔNG flip cờ `PSOLA_MINUS12_USE_FALLBACK` cho tới khi wide 10/10 + N12a
  đạt theo gate mới.
- Kết luận ngắn: **CƠ CHẾ TÌM RA + SỬA XONG. F-198-P1-2 và F-198-P4-2 là CÙNG
  MỘT lỗi: node worklet kẹt `ratio=1` cả clip do message `{ratio:1}` thừa từ
  `setParams(null)` trong `upgradePitchToPsola` — Node tái hiện đúng TỪNG SỐ
  chữ ký lạnh; headed với code đã sửa: 0 lỗi lạnh / 160 render (trước sửa:
  9 lỗi lạnh / 320 render). N12a ĐẠT theo gate mới (a4): domFreq đúng đích
  5/5, errHarm ≤ 0,05 st + wide −12 10/10 cả hai repeat. CỜ KHÔNG FLIP trong
  đợt này (giữ `true`) — đủ điều kiện, chờ parent quyết flip ở §14.2-199.**

## 1. Cơ chế — XÁC ĐỊNH, đo thật (Node + headed)

### 1.1. Chữ ký lạnh đợt 198 là "node kẹt ratio=1", không phải dry-passthrough

- Dữ kiện: F-198-P1-2 (220/−12 repeat 1: band 119,9 / wide 220,8 / errSt 1,50 /
  AM 0,05; repeat 2 ấm đúng từ t=0,2 s) + F-198-P4-2 (trang 2: 220/+5 errSt
  −2,07; 550/+1 errSt −0,99; output ≈ không dịch, AM thấp).
- Tái hiện trên bản gốc bằng harness 198 (không sửa gì): lượt turnA
  (pitchCurve+harmonicCurve ×2 repeat, 160 render) có **6 lỗi lạnh** —
  220/−12 (119,9/220,8/1,50/12,07/0,05), 220/−7 (180,4/220,4/3,56/7,03),
  harmonic 440/−1 (440,5/440,5/1,02), 440/−12 (268,4/311,7/3,44/6,03),
  440/+1 (440,4/440,4/−0,98), 660/−12 (287,5/467,4/−2,39/6,03); lượt turnA2
  thêm **3 lỗi lạnh** — 220/−12 (116,1/156,2/0,93), 660/−5 (480,6/660,5),
  harmonic 220/−12 (115,7/155,8/0,88). Tổng **9 lỗi lạnh / 320 render**
  (tỉ lệ ~3%/render; lỗi đầu-trang cao hơn nhưng KHÔNG chỉ ở render đầu:
  lỗi xuất hiện ở render #1, #2, #57, #61, #73… — họ transient ngẫu nhiên
  theo render, đúng như P4-198 nghi ngờ).
- Phân tích chữ ký: lỗi hai-tầng cho wide ≈ f0×0,7071 (chỉ MỘT tầng dịch:
  440/−12 → 311,7; 660/−12 → 467,4); lỗi một-tầng cho wide ≈ f0 (không tầng
  nào dịch: 220/−7 → 220,4; 440/+1 → 440,4). Tức là **mỗi node worklet ĐỘC
  LẬP đôi khi không engage** — không phải lỗi chung của chuỗi hay của
  module (module đã nạp: `psolaUpgraded` 80/80, `psolaFailed` 0).
- Loại trừ bằng đo trực tiếp (node worklet trần, ratio qua processorOptions
  only, render đầu tiên của trang): **PASS** — band/wide 110,4/110,4,
  errSt 0,06, AM 0,08, peak 0,3896/RMS 0,2499 (đúng số warm đợt 198); cả khi
  post thêm chuỗi message `{ratio:1}` rồi `{ratio:0,7071}` trước render
  cũng PASS với số giống hệt. Worklet streaming + period estimator +
  placeMarks đều khỏe từ block 64 (ratio 0,7071, warmed=true, period node1
  217,8 / node2 307,2, conf 0,93/0,90). Vậy lỗi KHÔNG nằm trong worklet,
  mà nằm ở **chuỗi message của `createVoiceChain`**.

### 1.2. Chứng minh bằng Node: kẹt ratio=1 cho đúng từng số chữ ký lạnh

- Script `scratch/ratio-stuck-199.mjs`: chạy đúng processor worklet trong
  Node (xen kẽ từng block 128, như browser), đặt tỉ lệ các node = 1 để mô
  phỏng node kẹt. Kết quả **khớp đúng từng số** JSON headed thô đợt 198:

| Trạng thái Node | Đo Node | Chữ ký lạnh đợt 198 |
|---|---|---|
| 220/−12, cả hai node r=1 | band 119,9 / wide 220,8 / errSt 1,50 / errW 12,07 / AM 0,046 / peak 0,5000 / RMS 0,3536 | F-198-P1-2: 119,9 / 220,8 / 1,50 / 12,07 / 0,05 / 0,499995 / 0,353561 |
| 440/−12, node1 r=1 | band 268,4 / wide 311,7 / errSt 3,44 / errW 6,03 | turnA rep2: 268,4 / 311,7 / 3,44 / 6,03 |
| 220/−12, node1 r=1 | band 116,1 / wide 156,2 / errSt 0,93 / AM 0,133 | turnA2 rep1: 116,1 / 156,2 / 0,93 / 0,13 |
| 220/−7 single, r=1 | band 180,4 / wide 220,4 / errSt 3,56 / errW 7,03 | turnA rep1: 180,4 / 220,4 / 3,56 / 7,03 |
| Đối chứng 0,7071/0,7071 | band 110,4 / wide 110,4 / errSt 0,06 / AM 0,080 | warm: 110,4 / 110,4 / 0,06 / 0,08 |

- Giải thích số 220,8 (từng là bí ẩn): PSOLA ở ratio=1 tái tổng hợp sine
  bằng OLA — ripple tạo hài 2 ở 220,8 Hz (= 2×110,4) trội hơn hài cơ bản
  nên wide khóa 220,8; không phải dry-passthrough (dumpWave đợt 198:
  maxDiff vs delayed input = 0,198 — lớn; dry thuần sẽ ≈ 0). Cơ chế đã rõ,
  không còn "CHƯA XÁC ĐỊNH".

### 1.3. Vì sao message `{ratio:1}` tới mà `{ratio:r1}` không tới

- `upgradePitchToPsola(ratio)` dựng node với `processorOptions.ratio =
  stageRatio` (đồng bộ, đúng), rồi gọi `chain.setParams(lastVoice=null)`
  → nhánh PSOLA post `{ratio:1}` (pitch tắt, `pitchRatio=1`). Harness gọi
  tiếp `setParams({pitch:-12})` → post `{ratio:0,7071}`. Cả hai message
  xếp hàng TRƯỚC `startRendering()`. Ở OfflineAudioContext, worklet thread
  render offline back-to-back, gần như không nhường message queue (đúng
  như comment trong `psolaWorkletSource.ts` đã cảnh báo): message đầu có
  thể được xử lý ở một khe giữa các quantum, message sửa lại thì không bao
  giờ tới trong lúc render → node chạy CẢ CLIP với ratio=1. Đây là race
  theo render (mỗi node độc lập, ~3%/render trong điều kiện tải đợt 198),
  không phải lỗi xác định theo code path — nên chạy debug (post diag mỗi
  16 block, hoặc attach handler) lại không tái hiện: port có hoạt động thì
  queue được bơm, race biến mất. Ghi nhận trung thực: diag v1/v2 của P1-199
  (120 + 120 render) đều 0 lỗi lạnh — chính vì chúng chạm port; bằng chứng
  cơ chế là bảng Node §1.2 + run đối chứng có/không sửa ở §4.
- Lỗi này CHỈ xảy ra ở render offline (harness đo + render E2E offline);
  ở preview real-time (AudioContext thật, app), message xen kẽ được với
  `process()` nên race không xuất hiện theo cùng cách — nhưng code sửa vẫn
  có lợi cho cả hai đường (bỏ post thừa mỗi frame, xem §2).

## 2. Fix — `apps/web/src/lib/previewVoiceFx.ts` (chỉ file này đổi logic)

- **Quy tắc mới trong `postPsolaRatio`**: chỉ post khi tỉ lệ per-stage
  THỰC SỰ đổi so với tỉ lệ node đang giữ (theo dõi bằng biến `psolaRatio`
  trong closure, khởi tạo lúc `buildPsolaChain` từ `processorOptions`).
  Post trùng giá trị bị bỏ — node đã có đúng tỉ lệ qua processorOptions
  thì không cần message nào nữa.
- **`setParams` chỉ post khi pitch BẬT**: khi pitch tắt, `psolaOut.gain=0`
  nên tỉ lệ không nghe được; post `{ratio:1}` lúc tắt là message thừa và
  chính là nguồn kẹt (xem §1.3). Node giữ tỉ lệ cũ cho lần bật sau; lần
  bật sau đổi tỉ lệ thì post (đổi tỉ lệ không rebuild mới post — rebuild đã
  dựng node mới với đúng tỉ lệ qua processorOptions nên không post).
- Hệ quả thiết kế: chuỗi dựng đúng tỉ lệ qua `processorOptions` và KHÔNG
  post gì thêm khi tỉ lệ không đổi — **đúng cả khi KHÔNG message nào tới
  trong lúc render**. Đây là tính chất cần có cho OfflineAudioContext.
- Không đổi `psolaWorkletSource.ts` (worklet đúng), không đổi cờ
  `PSOLA_MINUS12_USE_FALLBACK` (vẫn `true` — xem §6), không đổi hành vi
  fallback/shifter, robot/telephone/echo.

## 3. Test Node — 46/46 PASS (`previewVoiceFx.test.ts`, +9 test mới)

- 9 test mới (nhánh C, cờ tắt): upgrade 0,5 không post message nào; setParams
  −12 (cùng tỉ lệ processorOptions) không post; lặp lại không post; đổi sang
  +7 (rebuild 1 node) không post — node mới đã có tỉ lệ qua processorOptions;
  đổi +7 → +12 (không rebuild) post đúng 1 message `{ratio:2}`; lặp lại
  không post thêm; tắt pitch không post; bật lại +12 cùng tỉ lệ không post;
  đổi về −12 (rebuild 2 node) — node mới 0 message.
- Để test được, MockAWN ghi thêm `static instances` (danh sách node đã tạo)
  để đếm `port.messages` từng node; các test cũ không đổi.
- Các suite khác: `psola.test.ts` 18/18, `psolaWorklet198.test.ts` 3/3,
  `audioEngineVoiceFx.test.ts` 8/8, `npx tsc --noEmit` 0 lỗi,
  `npx vite build` PASS 10,53 s (chỉ warning chunk-size có sẵn).

## 4. Đo headed (Chrome thật, bundle từ code đã sửa) — 0 lỗi lạnh / 160 render

- Chạy ĐÚNG flow repro đợt 198 (copy nguyên harness 198, chỉ thay bundle bằng
  bản build từ code đã sửa): `pitchCurve + harmonicCurve × 2 repeat`,
  160 render, Chrome headless 158, `twoStageOn`.
- Kết quả: **0 lỗi lạnh / 160 render** (trước sửa: 9/320). Hai "fail" duy nhất
  mỗi repeat đều là quirk wide ĐÃ BIẾT ở −7 (band đúng, không phải lạnh):
  pitchCurve 660/−7 wide 881,7 (band 440,8, errSt 0,01) và harmonicCurve
  220/−7 wide 293,9 (band 146,9, errSt 0,01) — xuất hiện giống hệt ở mọi run
  kể cả run debug, không liên quan transient; ghi nhận, không chặn.
- **−12: 10/10 cả hai thước, cả hai repeat** (5 f0 × 2 curve): pitchCurve
  band/wide 110,4/165,4/220,3/275,3/330,5 (errSt 0,02–0,06, AM 0,03–0,08);
  harmonicCurve 110,1/165,3/220,1/274,8/330,8 (errSt −0,01–0,04, AM 0,16–
  0,42); `twoStage=true` cả 10 điểm mỗi repeat; `psolaUpgraded` 80/80 rồi
  160/160, `psolaFailed` 0. Số giống hệt nhau từng chữ số giữa hai repeat —
  transient lạnh đã hết, hành vi nay xác định.
- Đối chứng: cùng flow với bundle CHƯA sửa cho 9 lỗi lạnh / 320 render
  (§1.1) — cùng máy, cùng Chrome, cùng ngày; khác biệt duy nhất là fix §2.

## 5. N12a theo gate MỚI (a4)-198 — ĐẠT

- Gate mới: ở −12, `domFreq/errHarm + cao độ wide 10/10`; thước tỉ số mag
  KHÔNG còn là điều kiện flip ở −12. Ở −7/+7/+12 thước mag cũ vẫn đứng.
- Worklet cascade −12 (Node, script N12a đợt 198 chạy lại trên code hiện tại):
  domFreq đúng đích cả 5 f0 (110,3/165,3/220,2/275,2/330,3), errHarm
  0,01–0,05 st; core đối chứng: 110,4/165,3/220,5/275,3/330,5, errHarm
  0,02–0,06 st. **domFreq/errHarm ĐẠT.**
- Headed wide −12: **10/10 cả hai repeat** (§4). **Cao độ wide ĐẠT.**
- Thước mag cũ ở −12 (chỉ ghi nhận, không còn là điều kiện): worklet
  2,08–2,31, core 2,12–2,65 — vẫn < 10 như đợt 198 đã kết luận về cấu trúc
  (f0 trùng hài 2 của đích); không đổi, không chặn.
- Thước mag cũ ở −7/+7/+12 (vẫn đứng): shifted 5/5 mỗi n, errHarm ≤ 0,03,
  tỉ số 125–942 — **ĐẠT**.
- **Kết luận: N12a ĐẠT theo gate mới (a4).** F-198-P1-2 SỬA XONG (wide 10/10
  + không còn transient). Điều kiện flip (a2)-197 (đã sửa bởi (a4)-198) nay
  đủ — xem §6.

## 6. Cờ `PSOLA_MINUS12_USE_FALLBACK` — KHÔNG FLIP trong đợt này

- Cờ vẫn `true` (mặc định), code không đổi giá trị này. Điều kiện flip nay
  ĐÃ ĐỦ (wide 10/10 + N12a đạt gate mới + F-198-P1-2 sửa xong) — **đề xuất
  parent flip ở §14.2-199** (1 dòng `setPsolaMinus12Fallback(false)` hoặc
  đổi mặc định). P1 không tự flip: quyết flip thuộc parent theo lệ đứng
  (các đợt trước: P1 đề xuất, parent quyết).
- Lưu ý nếu flip: chặn fallback ở preview được bỏ; render giữ PSOLA như cũ;
  fallback 2-delay chỉ còn là đường dự phòng khi dựng chuỗi worklet thất
  bại (không đổi).

## 7. App thật — smoke check (vite preview, dist đã build với fix)

- `vite preview` dist (build §3) trên `localhost:5199`: Chrome headless load
  thật, app mount: title "VCut Studio — Trình dựng video", `#root` 1 child,
  body 4.171 ký tự UI editor đầy đủ (timeline, thư viện, nút Xuất bản…),
  có `<canvas>`, `AudioContext`/`OfflineAudioContext` khả dụng, 0 request
  404 trong log preview. Server đã tắt sau khi kiểm tra.
- Giới hạn trung thực: smoke check chỉ chứng minh app boot + mount với code
  đã sửa; phép đo cao độ −12 vẫn dùng harness headed với bundle thật (§4) —
  cùng code `createVoiceChain` mà `audioEngine` dùng cho preview real-time
  (mỗi element một chain, `upgradePitchToPsola()` fire-and-forget). Chưa lái
  UI thật để play một clip −12 (cần project mẫu + clip sine trong app —
  fixture sine chỉ tồn tại ở harness); lần preview đầu sau load trang ở
  real-time không chịu race offline (§1.3) và cũng hưởng fix §2 (bỏ post
  thừa mỗi frame).

## 8. Nợ / chưa làm / ghi nhận

- Quirk wide ở −7 (đợt 198 §3.4, vẫn còn): pitchCurve 660/−7 wide 881,7
  (= 2×440,8) và harmonicCurve 220/−7 wide 293,9 — band đúng cả hai, chỉ
  thước wide nhạy hài nào trội hơn. Không phải lỗi cao độ, không chặn flip;
  P4-199 đánh giá lại nếu cần.
- Chẩn đoán debug (v1 post mỗi 16 block, v2 ghi lịch sử + post 1 lần cuối)
  đều cho 0 lỗi lạnh / 240 render — bản thân việc chạm port đã bơm queue
  và che race; chỉ run với code production (không diag) mới tái hiện lỗi.
  Bài học: chẩn đoán race message-queue phải tránh chạm port trong lúc đo,
  hoặc đối chứng bằng Node sim như §1.2.
- `placeMarks` splice không chỉnh `markIdx` (ghi nhận cũ) — không động.
- P4-199 đã viết `parityHarness199.ts` song song (N12a gate mới trong
  harness) — P1 không sửa file của P4; LIMITS này tự đánh giá gate mới
  độc lập (§5).

## 9. File đổi (stage)

- `apps/web/src/lib/previewVoiceFx.ts` — fix §2 (chỉ post tỉ lệ khi đổi +
  chỉ post khi pitch bật; biến `psolaRatio`).
- `apps/web/src/lib/previewVoiceFx.test.ts` — +9 test (nhánh C) + `MockAWN.instances`.
- `docs/PHASE9_ROUND199_P1_VOICEFX_COLDSTART_LIMITS.md` — file này.
- Không sửa `psolaWorkletSource.ts`, `psola.ts`, GAP, cờ fallback. Không push.
- Scratch (không stage): `hidden_files/round199-p1/` — `harness/` (bundle +
  page debug + cdp-driver), `harness-198fixed/` (copy harness 198 + bundle
  đã sửa), `scratch/ratio-stuck-199.mjs` (Node tái hiện chữ ký lạnh),
  `scratch/previewVoiceFx-dbg.ts` + `psolaWorkletSource-dbg{,2}.ts`
  (bản debug, không dùng cho ship), `scratch/app-smoke-199.mjs`,
  `diag-*/`, `repro-198-turnA*/`, `verify-fixed/` (JSON headed thô).
