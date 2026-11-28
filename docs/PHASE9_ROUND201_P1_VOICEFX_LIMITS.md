# LIMITS — Đợt 201 P1: VoiceFX — gate confidence worklet + mở fMin + nghiên cứu triệt H3

- Đợt: 201, luồng P1 (Editing Core — preview/render parity, đợt thứ 11 theo hướng mới 25/11).
- Ngày: 27/11/2026. Hạn cờ ~17:00Z, hạn cứng 17:35:51Z. Đóng ~16:00Z.
- Nhiệm vụ (quyết (a2)-200 + (r)-200): (1) gate confidence cho estimator worklet
  + trung vị hoá như core — đo lại |errSt| + tỉ lệ khung đo được f0 trên giọng thật;
  (2) mở fMin xuống ~50 Hz — đo trước/sau; (3) nghiên cứu triệt H3: ≥2 hướng;
  (4) kết luận hướng nào triệt H3 mà không phá cao độ. KHÔNG flip cờ fallback trừ
  khi số đo chứng minh cả hai đều đạt.
- **Kết luận ngắn: KHÔNG FLIP cờ. (1) Gate + trung vị KHÔNG sửa được cao độ
  worklet trên giọng chạy (|errSt| trung vị 1,25 → 1,19 st; đo được f0 42% → 42%)
  — lỗi còn lại là cấu trúc (cascade smearing + đặt mark nhân quả), không phải
  estimator chạy theo nhiễu. (2) Mở fMin 50 Hz SỬA ĐƯỢC vùng giọng trầm: nguyên âm
  f0 = 100/110 Hz (đích 50/55 Hz) từ FAIL (−5,6/−5,8 st, conf 0,07–0,34) thành
  ĐẠT (±0,01 st, conf 0,97) cả worklet lẫn core; outlier Quang Sơn 5,92 st biến
  mất; wide −12 từ 8/10 lên 9/10. (3) Triệt H3: Blackman FAIL (dH3 không đổi),
  tách tầng 0,65/0,7692 FAIL + TỆ HƠN (dH3 +14,7 dB, H3>H1 85/243) + MONG MANH
  (FAIL nguyên âm 220 Hz, +4,53 st); post-filter notch thích ứng theo f0 THÀNH
  CÔNG — dH3 +11,9 → +1,7 dB (ngang fallback), H3>H1 52 → 7/243, centroid
  −173 → +21 Hz, cao độ KHÔNG ĐỔI (|errSt| 0,149 → 0,161 st) — NHƯNG notch hiện
  chỉ là thí nghiệm trong harness (chưa vào code sản phẩm), tốn ~30% RMS (cần bù
  gain) và cắn H2 thêm ~4 dB (Q=2 quá rộng). Nợ đợt 202: đưa notch vào core
  (render) trước, với độ sâu thích ứng + Q=4 + bù gain; worklet notch cần gate
  theo confidence.**
- **Đính chính số đợt 200 (quan trọng): lag cascade worklet THẬT là 85,33 ms
  (2×LAG 2048 mẫu), KHÔNG phải ~0 ms như P1-200 giả định — khung giọng chạy
  đợt 200 lệch ~82 ms nên |errSt| ts bị phồng (2,08 → 1,25 st đo lại đúng lag)
  và H3>H1 bị phồng (41% → 30%). Mọi số ts đợt 201 dưới đây đo với lag đúng.
  Số fb/core đợt 200 đứng (lag của chúng đo đúng). Chi tiết §1.**

## 1. Lag cascade worklet — phát hiện phương pháp (đo lại baseline trước khi sửa)

- Đọc code `placeGrains` + ghi chú test `psolaWorklet198`: output block b chứa vị
  trí [b−2048, b−1920) — tức WAV render ra trễ LAG=2048 mẫu (42,7 ms) MỖI NODE;
  cascade 2 node = 4096 mẫu = **85,33 ms**. P1-200 đo lag ts trong cửa sổ ±15 ms
  quanh 0 ("2–3 ms") — cửa sổ không bao được lag thật.
- Kiểm độc lập 2 cách (`scratch/lagcheck201{,b}.mjs`): (a) onset bước nhảy sine
  220 Hz tại 2,000 s: ts onset 2,080 s (lag 80 ms — gồm grain-spread ngược
  ~5 ms), core 2,000 s (lag 0), fb 2,015 s; (b) xcorr chuẩn hoá từng khung
  100 ms trên Mai Anh/Quang Sơn: cửa sổ [70,100] ms cho lag trung vị 82,7/85,5 ms
  với xcorrNorm 0,234/0,326 — GẤP 2,3× cửa sổ [−15,15] ms (0,100/0,144);
  core ngược lại: [−15,15] ms norm 0,342/0,447 ≫ [70,100] ms (0,107/0,152) →
  core lag ~0 thật; fb onset 40–45 ms khớp P1-200 (38–41 ms).
- **Baseline đo lại với lag đúng (khung 243, §3): tsOld |errSt| med 1,246 st
  (đợt 200: 2,081), đo được f0 102/243 (42%; đợt 200: 77/243 = 32%), confOut
  0,43 (0,33), errSt có dấu +0,748 (+1,076), dH3 med +12,7 (+14,5), H3−H1
  out −3,6 dB (−1,6), H3>H1 72/243 = 30% (100/243 = 41%), centShift −171 Hz
  (+83 Hz — đổi dấu vì cửa sổ đo đúng âm tiết).** Kết luận đợt 200 (GIỮ cờ,
  H3 trội là thật, worklet lệch cao độ) VẪN ĐỨNG — chỉ các con số ts được
  hiệu chỉnh xuống; fb/core không đổi.
- Baseline snapshot: sao lưu code đợt 200 tại `scratch/psolaWorkletSource-BASELINE-200.ts`
  + `psola-BASELINE-200.ts` TRƯỚC khi sửa; sanity: cascade snapshot vs ab-200
  decode: mean|diff| 1,59e-5, max 4,58e-5 — đúng mức lượng tử hoá WAV 16-bit
  (encode trunc + scale 32767/32768; xem `scratch/sanity201.mjs`) → ab-200
  = code baseline, tái dùng làm đường cũ (fb/tsOld/core80) hợp lệ.

## 2. Thay đổi code đợt này (đã sửa, test xanh — xem §8)

- `apps/web/src/lib/psolaWorkletSource.ts`:
  - `estimatePeriod()`: **gate confidence** — chỉ chấp nhận chu kỳ khi
    `confidence ≥ confGate` (mặc định 0,5 = voicedThreshold của core); khung
    không đạt gate → GIỮ chu kỳ cũ (bản cũ cập nhật bất kể confidence rồi làm
    mượt 0,5/0,5). **Trung vị 3** lần chấp nhận gần nhất (như core
    `estimatePitchTrack`), thay cho làm mượt 0,5/0,5. `fMin` qua
    processorOptions (mặc định **50** Hz): tauMax = srDec/fMin; guard chu kỳ
    `period < sr/fMin` (bản cũ `sr/60`). `grainWindow` qua processorOptions
    ("hann" mặc định / "blackman" — thí nghiệm §5).
  - **LAG GIỮ 2048** (không tăng trễ preview 43 → 75 ms): hạt dài nhất ở
    fMin 50 với r1 = 0,7071 (chuỗi thật) có L = 1158 mẫu → đuôi Hann trái bị
    cắt ≤ 140 mẫu, trọng số ≤ 0,036 — không đáng kể. Chỉ node đơn r=0,5 với
    f0 vào < 66 Hz mới cắt đáng kể — cấu hình không xuất hiện trong sản phẩm.
  - `resetState()` xoá cả lịch sử chu kỳ.
- `apps/web/src/lib/psola.ts`: `DEFAULTS.fMin` 80 → **50**; `estimatePeriodFrame`
  mặc định fMin 50 (đồng bộ worklet — "cùng công thức, cùng hằng số");
  thêm option `grainWindow` ("hann"/"blackman", mặc định "hann") và
  `twoStageSplit` (tỉ lệ tầng 1; tầng 2 = ratio/tầng 1, mặc định √r — thí
  nghiệm §5). Không đổi `previewVoiceFx.ts` (không động tới đường app khi
  chưa có bằng chứng), không đổi cờ fallback, không đổi GAP.
- `psola.test.ts` +3 test, `psolaWorklet198.test.ts` +3 test (xem §8).

## 3. Nhiệm vụ 1 — Gate confidence + trung vị: KHÔNG sửa được cao độ giọng chạy

- Phương pháp: cùng 3 clip TTS đợt 200 (Hải Đăng 7,84 s / Mai Anh 8,88 s /
  Quang Sơn 10,16 s), khung 100 ms / hop 50 ms trong lòng đoạn voiced,
  **tập khung Y HỆT đợt 200: 243 khung (56/116/71)** — frame selection dùng
  fMin 80 tường minh như đợt 200; lag từng đường: fb 40 ms, ts 85,33 ms,
  core 0 ms, xcorr cục bộ ±6 ms quanh lag cấu trúc (`scratch/frames201.mjs`).
- Pooled 243 khung (trung vị):

| Thước | fb | tsOld (baseline, lag đúng) | tsNew (gate+median+fMin50) |
|---|---|---|---|
| \|errSt\| med / p90 / max (st) | 0,228 / 0,868 / 2,840 | 1,246 / 4,093 / 5,869 | 1,189 / 3,995 / 5,869 |
| errSt có dấu med (st) | −0,016 | +0,748 | +0,508 |
| Khung đo được f0 (conf ≥ 0,5) | 227/243 (93%) | 102/243 (42%) | 103/243 (42%) |
| confOut med | 0,75 | 0,43 | 0,43 |
| H3−H1 out med / dH3 med (dB) | −15,4 / +1,7 | −3,6 / +12,7 | −3,6 / +12,0 |
| Khung H3>H1 | 32/243 | 72/243 | 83/243 |
| centShift med (Hz) | −561 | −171 | −187 |
| AM med / rmsRatio med | 0,726 / 0,87 | 0,678 / 0,81 | 0,693 / 0,82 |
| lag med (ms) | 40,3 | 85,2 | 85,2 |

- Theo clip (tsOld → tsNew): Hải Đăng đo được 12 → 15/56, |errSt| 1,326 →
  1,359 st; Mai Anh 71 → 62/116, 1,088 → 1,413 st (TỆ ĐI); Quang Sơn 19 →
  26/71, 1,145 → 0,945 st (tốt lên — vùng f0 thấp, hưởng lợi fMin).
  Gate giúp giọng trầm, hại giọng nữ — ròng: không cải thiện.
- **Đọc kết quả:** lỗi còn lại KHÔNG phải estimator chạy theo nhiễu — sau khi
  gate, chu kỳ worklet đã ổn định hơn (errSt có dấu +0,75 → +0,51 st) nhưng
  |errSt| và tỉ lệ đo được đứng yên. Cơ chế còn lại: cascade 2 tầng — tầng 2
  đặt mark trên tín hiệu ĐÃ smeared bởi tầng 1, đặt mark nhân quả với
  lookahead ~1 hạt (core đặt mark offline toàn clip trên tín hiệu gốc +
  làm mịn + nội suy). Bằng chứng: core cùng two-stage nhưng track offline
  đạt |errSt| 0,15 st (xem §4) — khác biệt là streaming/causal, không phải
  số tầng. Sửa tiếp phải đụng đặt mark/lag tầng 2 — ngoài phạm vi đợt này.

## 4. Nhiệm vụ 2 — Mở fMin 80 → 50 Hz: SỬA ĐƯỢC vùng giọng trầm, không hồi quy

- **Nguyên âm /a/ ổn định (synthetic — tách cơ chế), đo giữa [0,5;1,5] s:**

| f0 vào → đích | tsOld | tsNew | core80 | core50 |
|---|---|---|---|---|
| 100 → 50 Hz | −5,592 st (conf 0,34) | **+0,004 (0,97)** | −6,000 (0,96) | **+0,004 (0,97)** |
| 110 → 55 Hz | −5,827 (0,07) | **−0,010 (0,97)** | −0,978 (0,35) | **−0,010 (0,97)** |
| 165 → 82,5 Hz | −0,000 (0,98) | −0,001 (0,98) | −0,001 (0,98) | −0,001 (0,98) |
| 220 → 110 Hz | +0,026 (0,77) | +0,026 (0,79) | +0,026 (0,68) | +0,026 (0,68) |
| 275 → 137,5 Hz | +0,020 (0,96) | +0,019 (0,98) | +0,018 (0,97) | +0,018 (0,97) |

  (tsOld/core80 ở f0 = 100/110 là FAIL hoàn toàn — estimator không tìm được
  chu kỳ ngoài tầm 80 Hz, đọc nhầm quãng; P1-200 ghi ts +4,83 st/conf 0,07 ở
  110 Hz — dấu khác do lag đo sai lúc đó, bản chất cùng là FAIL.)
- **Giọng thật (Quang Sơn, f0 trung vị 145 Hz, đích ~73 Hz):** core80 → core50:
  |errSt| med 0,140 → 0,121 st, p90 0,808 → 0,440, **max 5,922 → 0,736 st**
  (outlier khung đích < 80 Hz biến mất); dH3 med 8,3 → 7,7 dB; H3−H1 out
  −1,0 → −3,1 dB. Hải Đăng/Mai Anh: core80 == core50 từng số (đích ≥ 80 Hz
  là chủ yếu — mở fMin không đổi gì ở đó, đúng thiết kế).
- **Pooled core80 → core50:** đo được 134/243 = 134/243; |errSt| med 0,150 →
  0,149 st; p90 0,808 → 0,718; max 5,922 → 2,220; signed +0,104 = +0,104.
  Không hồi quy ở bất kỳ thước nào.
- **Wide sine −12 (autocorr, bar |errSt| ≤ 0,1 st, 5 điểm/đường):** tsOld 4/5
  (110 Hz: 0,488 st ✗) → **tsNew 5/5** (110 Hz: 0,098 ✓), tsNewBm 5/5
  (0,095); core80 4/5 (110 Hz: 0,489) → core50 4/5 (110 Hz: **0,115** — cải
  thiện lớn nhưng vẫn TRÊN bar 0,015 st; các điểm còn lại 0,034–0,079 ✓);
  core50bm/split/notch đều 4/5 (110 Hz: 0,116/0,119/0,116); tsNewNotch 4/5
  (110 Hz: 0,100 — sát bar). **Tổng wide ts+core: 8/10 → 9/10.** Điểm 110 Hz
  còn lại là giới hạn phân giải đặt mark (sai số ~1 mẫu trên T = 436 mẫu),
  không phải lỗi estimator — nguyên âm 110 Hz cho errSt −0,010 st.

## 5. Nhiệm vụ 3 — Nghiên cứu triệt H3: Blackman FAIL, tách tầng FAIL, notch THÀNH CÔNG

- Cơ chế (nhắc lại từ đợt 200 §6, đã xác minh lại): two-stage ÁP ĐẶT chữ ký
  H3−H1 ≈ −2 dB lên mọi khung; trên sine thuần (không có H3 tự nhiên) đo
  đúng bằng phương pháp sửa (Goertzel tại k×f0out đo được, cửa sổ 1 s —
  xem §7): **330/−12: H3−H1 = −0,5 dB MỌI đường; 550/−12: −0,4 dB** (cửa
  sổ P4 0,5 s: −2,3…−4,9 dB, khớp P1-200 §6: −3,6/−2,5 dB). H3 ≈ H1 trên
  sine — chữ ký cấu trúc, không phải bug estimator.
- **Hướng A — cửa sổ hạt Blackman (sidelobe −58 dB vs Hann −31 dB): FAIL.**
  Giọng thật: core50bm dH3 med 11,9 dB (= core50 11,9), H3−H1 out −3,2 dB
  (−3,6), H3>H1 45/243 (52/243); tsNewBm dH3 12,0 (= tsNew 12,0). Sine:
  Blackman −0,7 dB vs Hann −0,5 dB (không đáng kể). |errSt| không đổi
  (core 0,167 vs 0,149; ts 1,414 vs 1,189 — nhỉnh hơn chút, không ý nghĩa).
  Sidelobe cửa sổ không phải nguồn H3 — H3 đến từ lưới mark commensurate,
  không phải rò phổ cửa sổ.
- **Hướng B — tách tầng r1 = 0,65 / r2 = 0,7692 (thay vì 0,7071/0,7071):
  FAIL + TỆ HƠN + MONG MANH.** Giọng thật: core50split dH3 med **+14,7 dB**
  (tệ hơn core50 11,9), H3−H1 out −1,3 dB (−3,6), H3>H1 **85/243** (52/243),
  H2−H1 out −9,6 dB (từ −5,1 — năng lượng dồn từ H2 sang H3); sine 330:
  H3−H1 −0,1 dB (tệ nhất), 550: **0,0 dB** (H3 = H1). **Mong manh: nguyên âm
  /a/ 220 Hz split cho errSt +4,526 st (conf 0,36) — FAIL** trong khi
  harmonic 220 Hz cùng split lại đúng (0,000 st, test suite) — hành vi phụ
  thuộc formant, không đoán trước được. Kết hợp Blackman+split cũng tệ
  (dH3 13,6). **BỎ hướng tách tầng.**
- **Hướng C — post-filter notch thích ứng theo f0 (thí nghiệm trong harness,
  chưa phải code sản phẩm): THÀNH CÔNG.** Peaking cut −12 dB, Q=2, tại
  3×f0_out(t) = 1,5×f0_in(t); f0(t) từ track core trên INPUT (fMin 50);
  khung unvoiced giữ hệ số cũ; hệ số làm mượt theo block 128 mẫu.
  Giọng thật, core50 → core50notch: **dH3 med +11,9 → +1,7 dB (ngang
  fallback +1,7)**, H3−H1 out −3,6 → **−14,2 dB** (tự nhiên −16,0),
  **H3>H1 52 → 7/243** (tự nhiên 28/243 — thậm chí ít hơn gốc),
  domK k=1 89 → **127**, **centShift −173 → +21 Hz** (khôi phục hoàn toàn),
  AM 0,679 → 0,641; **cao độ KHÔNG ĐỔI: |errSt| med 0,149 → 0,161 st**,
  đo được 134 → 136/243, confOut 0,55 = 0,55. Trên ts-new: dH3 12,0 → 3,6,
  H3−H1 −3,6 → −11,0, H3>H1 83 → 25/243, centShift −187 → −17 Hz, |errSt|
  1,189 → 1,139 (không đổi). Nguyên âm: notch đưa H3−H1 về −10,8…−14,2 dB
  (two-stage −1,5…−2,6 dB) ở f0 = 100/110/165, errSt vẫn ±0,01 st.
- **Caveat của notch (ghi trung thực, quyết định nợ 202):** (i) rmsRatio med
  0,80 → **0,55** (core) / 0,82 → 0,60 (ts) — notch lấy đi ~30% năng lượng
  (H3 bị boost mang nhiều năng lượng) → **cần bù gain (makeup)**, chưa làm;
  (ii) H2−H1 out −5,1 → **−7,7 dB** (tự nhiên −3,6) — Q=2 quá rộng, notch
  cắn cả H2; thử Q=4 đợt 202; (iii) độ sâu −12 dB cố định OVER-CORRECT khi
  H3 tự nhiên đã mạnh: trên nguyên âm (H3−H1 vào = 0,0 dB do formant) notch
  đưa ra về −11…−13 dB — thấp hơn tự nhiên; **độ sâu nên thích ứng theo
  H3−H1 vào (chỉ cắt phần VƯỢT, đích = giữ H3−H1 ra ≈ vào)**; (iv) notch
  dùng f0 track của INPUT — trên đường render (core, track offline) sạch;
  trên đường preview (worklet) phải dùng period estimate streaming (conf
  trung vị 0,43) → notch lệch tần khi confidence thấp — cần gate theo
  confidence hoặc chỉ notch khi conf đủ; (v) |dH3| p90 sau notch vẫn 22,6 dB
  (core) — một số khung notch trượt (f0 track sai / glide nhanh).

## 6. Kết luận + nợ đợt 202 (thước đo cụ thể)

- **Có hướng triệt H3 mà không phá cao độ: CÓ — notch thích ứng theo f0.**
  Nhưng chưa đủ điều kiện flip cờ đợt này: notch chưa nằm trong code sản phẩm
  (chỉ trong harness), chưa có bù gain, chưa xử lý H2, chưa có gate confidence
  cho preview. **Cờ `PSOLA_MINUS12_USE_FALLBACK` GIỮ (KHÔNG FLIP)** — worklet
  vẫn lệch cao độ 1,19 st trên giọng chạy và H3 ở đường preview vẫn chưa triệt.
- Nợ P1-202 (theo thứ tự): (1) đưa notch vào **core trước** (render path):
  peaking cut tại 3×f0_out từ track offline, **độ sâu thích ứng** (đích
  H3−H1 ra ≈ H3−H1 vào, cắt tối đa 12 dB), **Q=4** (giảm cắn H2), **bù gain
  theo RMS** (đích rmsRatio ≥ 0,75); thước đạt: dH3 med ≤ 3 dB + H3>H1 ≤
  15% + |errSt| med ≤ 0,2 st + H2−H1 out ≥ −6 dB + rmsRatio ≥ 0,75 trên
  243 khung; (2) notch cho **worklet preview**: chỉ notch khi confidence
  estimate ≥ 0,5, giữ hệ số khi không đạt gate; đo lại ts-new-notch với
  notch NỘI TẠI worklet (không phải post-filter ngoài); (3) điều tra tiếp
  lỗi cao độ worklet giọng chạy (tầng 2 đặt mark trên tín hiệu smeared —
  thử track tầng 2 từ tín hiệu GỐC thay vì tầng 1, hoặc tăng lookahead);
  (4) điểm wide 110 Hz core (0,115 st) — xem có phải giới hạn đặt mark
  không (thử nội suy mark dưới mẫu); (5) **BỎ** Blackman + tách tầng
  (đã chứng minh FAIL/TỆ HƠN — không thử lại).

## 7. Bài học phương pháp + giới hạn trung thực

- **Bản (c) sine-H3 đầu tiên SAI (đã sửa, không dùng số):** `vowelwide201.mjs`
  đo Goertzel tại k×f0t (đích) trên cửa sổ 1 s không cửa sổ — errSt ~0,04 st
  làm H3 lệch ~1,2 Hz, suy hao sinc tới ~13 dB → H3−H1 −19/−23 dB giả tạo.
  Đo lại (`sineh3b201.mjs`, Goertzel tại k×f0out đo được + đối chứng cửa sổ
  P4 0,5 s) cho −0,5/−0,4 dB — số trong LIMITS này là số đo lại. Cùng thiên
  lệch (nhỏ hơn, ~1–2 dB) tồn tại trong số H3 nguyên âm ở §4/§5 — chỉ dùng
  để so sánh tương đối giữa các đường ĐẠT (errSt ~0,01 st); số H3 của đường
  FAIL (tsOld/core80 ở f0 = 100/110) là vô nghĩa (Goertzel đo sai tần số)
  và không được trích. **Số H3 giọng thật (khung 100 ms) không bị ảnh
  hưởng** — cửa sổ ngắn, thùy chính Goertzel rộng ~10 Hz ≫ lệch f0.
- Không claim nghe bằng tai — timbre đánh giá bằng thước hài khách quan.
  Mẫu A/B mới (ts-new/ts-new-bm/core50/…/notch × 3 giọng, WAV 48 kHz) đã
  render tại `hidden_files/round201-p1/ab201/` (binary, không stage) để
  parent/user nghe; đường cũ tái dùng `ab/` đợt 200.
- N12a theo thước (a4) mới (autocorr + wide): wide Node đợt này 9/10
  (ts 5/5 + core 4/5 — điểm 110 Hz core 0,115 st); wide headed 10/10 của
  P4-199 dùng dữ liệu cũ — P4-201 chạy lại trên headed JSON khi có.
- `server/render/src/psolaPitch.js` (bản render-server) KHÔNG đổi — ngoài
  phạm vi (preview worklet + core `psola.ts`); fMin của nó vẫn 80 Hz nếu có
  — ghi nhận để đợt sau đồng bộ nếu cần.

## 8. Kỷ luật đo yên + vi phạm + test

- **F-201-P1-1 — VI PHẠM (tự ghi nhận, chờ parent phán):** Node đo lag
  `lagcheck201b.mjs` (124 s, 1 CPU) chạy ~14:58:54–~15:01:00Z, **chồng lấn
  ~87 s cuối cửa sổ yên W1** (14:56:50–15:00:21Z); tôi KHÔNG kiểm lại
  `windows.md` trước khi chạy (file đã có từ 14:57:57Z — lỗi quy trình của
  tôi; lần kiểm trước đó ~14:47Z chưa có thư mục T4-201). `lagcheck201.mjs`
  (20 s) chạy ~14:56:20–14:56:40Z, TRƯỚC khi W1 mở — không chồng lấn.
  Bằng chứng chồng lấn: `ps-after-t4-attempt1` (15:00:21Z) ghi nhận process
  node của tôi đang chạy. Giảm nhẹ: W1 vẫn **HỢP LỆ 20/20** (tickCost median
  50,5 ms — T4); B2 24 spike 14:57:01–14:59:01Z chủ yếu do chính attempt tạo
  (theo T4) — phần chồng lấn của tôi chỉ ~7 s cuối cửa sổ spike. Đề xuất
  parent phán mức (tiền lệ: P1-199 tsc trong W2 = VI PHẠM; P3-199 test
  trong W3 = VI PHẠM NHẸ). Từ sau vụ này: kiểm `windows.md` TRƯỚC MỖI
  lần chạy workload nặng, không chỉ đầu lượt.
- **Reboot ~15:04:25Z** (bằng chứng: `/proc/uptime` 156 s lúc 15:07:01Z +
  `who -b` "system boot Nov 27 15:04") — SAU khi W1 đóng (15:00:21Z) và
  poller thoát (15:00:58Z) nên W1 không bị ảnh hưởng; boot mới (có thể #131)
  thuộc T01/T56 survey, không phải phạm vi P1. Mọi file làm việc còn nguyên
  trên đĩa sau reboot.
- Test (chạy sau khi W1 đóng; `windows.md` kiểm lại: không có cửa sổ đang
  chạy): `psola.test.ts` **21/21** (18 cũ + 3 mới: fMin50 110/165 Hz −12,
  blackman, split 0,65 — bar errSt ≤ 0,40); `psolaWorklet198.test.ts`
  **6/6** (3 cũ + 3 mới: cascade sine 110 −12 ≈ 55 Hz; confGate=1,0 khoá
  cập nhật chu kỳ — chứng minh gate có tác dụng; blackman); `previewVoiceFx.test.ts`
  **46/46**; `audioEngineVoiceFx.test.ts` **8/8**. Tổng 81/81.
- `npx tsc --noEmit` (apps/web): **1 lỗi — KHÔNG phải file của tôi**:
  `src/lib/reverseAudio201P3.test.ts(33,10): error TS6133: 'ok' is declared
  but its value is never read` — file của P3-201, tôi không sửa file luồng
  khác (tránh xung đột); 0 lỗi trong psola.ts / psolaWorkletSource.ts /
  psola.test.ts / psolaWorklet198.test.ts / previewVoiceFx.ts. Lỗi này chặn
  `npm run build` (script `tsc && vite build`) — P3-201/T10 lưu ý.
- `vite build` trực tiếp (bỏ qua tsc): **PASS 9,50 s** (bundle
  index-DTO4eCbF.js 1.747,89 kB; cảnh báo chunk > 500 kB đã có từ trước).
- 0 lần chạy Chrome headed đợt này (không cần — worklet thật chạy trong Node;
  wide headed thuộc P4-201).

## 9. File đổi (stage)

- `apps/web/src/lib/psolaWorkletSource.ts` — gate confidence + trung vị 3 +
  fMin 50 + grainWindow (Blackman) + comment LAG.
- `apps/web/src/lib/psola.ts` — DEFAULTS.fMin 80 → 50 + option grainWindow /
  twoStageSplit + comment.
- `apps/web/src/lib/psola.test.ts` — +3 test (21/21).
- `apps/web/src/lib/psolaWorklet198.test.ts` — +3 test (6/6).
- `docs/PHASE9_ROUND201_P1_VOICEFX_LIMITS.md` — file này.
- Scratch (không stage): `hidden_files/round201-p1/` — `ab201/` (27 WAV đường
  mới), `scratch/` (lagcheck201{,b}.mjs, render201.mjs, frames201.mjs,
  vowelwide201.mjs, sineh3b201.mjs, sanity201.mjs, pretest201.mjs, snapshot
  baseline *-BASELINE-200.ts, *.log), `frames201.json`, `vowelwide201.json`,
  `sineh3b201.json`.
- KHÔNG PUSH. KHÔNG release/tag. Không code giả. Cờ fallback GIỮ.
