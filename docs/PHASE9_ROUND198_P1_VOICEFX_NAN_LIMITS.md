# LIMITS — Đợt 198 P1: VoiceFX — fix sampleAt NaN + two-stage hài 3

- Đợt: 198, luồng P1 (Editing Core — preview/render parity, đợt thứ 8 theo hướng mới 25/11).
- Ngày: 27/11/2026. Hạn cờ ~02:00Z, hạn cứng 02:35:51Z. Đóng ~01:30Z.
- Nhiệm vụ (quyết (r)-197 + đính chính (r)-196): (1) fix sampleAt NaN (F-197-P4-1);
  (2) tìm + sửa nguyên nhân worklet gây hài 3 trội ở preview two-stage −12 (F-197-P1-3);
  (3) KHÔNG flip cờ `PSOLA_MINUS12_USE_FALLBACK` — chặn fallback ở preview giữ nguyên.
- Kết luận ngắn: **NaN sửa xong, đo thật 0 NaN. Hài 3 hệ thống (F-197-P1-3) sửa xong —
  warm render 10/10 cao độ ở −12. NHƯNG KHÔNG ĐỦ ĐIỀU KIỆN FLIP: (a) render đầu tiên
  của trang mới (cold start) ở sine 220/−12 vẫn ra không dịch (F-198-P1-2, mới);
  (b) thước tỉ số mag N12a ở −12 vẫn ~2,1–2,6 so với bar 10 — cấu trúc, core cũng vậy
  (F-198-P1-1). Cờ GIỮ NGUYÊN (fallback bật). Parent quyết ở §14.2-198.**

## 1. Fix sampleAt NaN (F-197-P4-1) — XONG, đo thật

- Nguyên nhân (đã xác định đợt 197): `sampleAt()` trong `apps/web/src/lib/psola.ts`
  chỉ return sớm khi `frac===0` ở mẫu cuối; khi `i0 = length−1, frac>0` vẫn đọc
  `samples[length]` = `undefined` → NaN. Baseline repro: 440/−12 có 2 NaN
  (idx 33590–33591); −7/+7/+12 mỗi cái 1 NaN.
- Fix: cả hai đầu nội suy trong `sampleAt` đều coi ngoài biên là 0 (hợp đồng
  "0 ngoài biên", đã ghi chú trong code). Render dùng chung `psola.ts` nên fix
  bao cả đường render, không chỉ preview. Worklet có `sampleAt` riêng dạng ring
  (wrap, không NaN) nên không bị lỗi này.
- Đo lại (scratch `nan-check-198.mjs`, sine + harmonic × f0 {220,330,440,550,660} ×
  n {−12,−7,+7,+12}): **0 NaN/Inf trên cả 40 điểm.**
- Test mới trong `psola.test.ts` (+2 test): 0 NaN ở 440 × 4 n; 0 NaN/Inf toàn lưới.
  `psola.test.ts`: **18/18 pass**.

## 2. Two-stage hài 3 (F-197-P1-3) — NGUYÊN NHÂN TÌM RA + SỬA XONG (Node + headed)

### 2.1. Cơ chế (chẩn đoán bằng cascade Node 2 node worklet, r1=√0,5)

- Tái hiện đúng lỗi headed đợt 197: harmonic 440 wide 660,2 Hz, harmonic 660 wide
  992,2 Hz, sine 660 wide 990,9 Hz (errStWide +19,0×). Ước lượng chu kỳ ĐÚNG
  (tầng 2: 154,2 so với thật 154,3) — không phải lỗi estimator.
- Dấu vết: tầng 1 đã có hài 3 trội; phổ tách thành đỉnh đôi cách nhau ~0,7–0,9 Hz
  ở mọi hài; tần số tức thời ổn định (311,43–311,51 Hz); phổ cục bộ 50 ms cho thấy
  năng lượng smeared (đỉnh 350/584/274 Hz), 311 Hz biến mất trong 2 cửa sổ
  (t=1,55 / 2,75 s), 440 Hz rò (~65); cụm glitch mỗi ~1,16 s.
- **Nguyên nhân gốc**: `placeMarks()` trong `psolaWorkletSource.ts` dùng
  `nextMark += T` tự chạy. T ước lượng (≈108,99) lệch T0 thật (109,09) ~0,1
  mẫu/chu kỳ nên tâm tìm kiếm trôi dần vào vùng mơ hồ giữa đỉnh/đáy của
  `localPeak(|x|)`; mark lật đáy↔đỉnh (22 lần/4 s ở sine 440; cụm lật ở
  1,531/1,544/1,557 s khớp burst ở 1,55 s), mỗi lần lật nhảy lưới mark nửa chu kỳ
  → burst smeared phổ ~50 ms. Tầng 2 đọc tín hiệu đã smeared nên hài 3 của đích trội.
- Đối chứng: bỏ neo hoàn toàn cũng cho 0 burst; chu kỳ cố định làm tệ hơn
  (50 burst, band 351,1 Hz) vì tâm ngồi đúng điểm giữa đỉnh/đáy — xác nhận cơ chế.

### 2.2. Fix-1 (đã áp dụng): `placeMarks` reset tâm về mark vừa neo

- `this.nextMark = m + T` sau khi đặt mark m (kiểu core — core bước từ mark đã neo
  nên tự hiệu chỉnh). Tâm luôn cách lưới mark thật < ~0,1 mẫu, không còn lật.
- Node: sine 440 −6 → 0 burst, band = wide = 311,4 Hz. Lưới cascade −12 đầy đủ
  (harmonic + sine × 5 f0): **worklet 10/10 cả hai thước, khớp core 10/10**
  (errSt chênh ≤ 0,01, AM chênh ≤ 0,013 so với core ở mọi điểm; các điểm từng fail
  nay wide 220,1 / 330,8 / 330,5 Hz).
- Lưu ý: 1 backtick trong comment của file template literal sẽ vỡ file — comment đã
  viết lại không backtick; file parse bình thường (`tsc` 0 lỗi, vite build PASS).

## 3. Đo headed Chrome (verdict cuối) — 27/11/2026, ~01:10–01:22Z

Harness: `hidden_files/round198-p1/harness/` (copy từ đợt 197; bundle rebuild bằng
esbuild từ code hiện tại — đã grep xác nhận chứa Fix-1; thêm điều khiển cờ qua spec
`twoStageOn` = tắt chặn / `ship` = bật chặn, ghi `minus12Fallback` vào JSON).
Chrome: Playwright chromium-1254 (mặc định của driver; `/usr/bin/google-chrome`
không tồn tại, `/opt/meta-chromium/chrome` đòi Hatch WebGL domain policy nên không dùng).
Thước: band = đỉnh phổ [1,0, 3,5) s trong target×[0,8, 1,25]; wide = đỉnh toàn phổ
[50, 3000] Hz; AM = am5ms trên [1,0, 3,5); pass = |errSt| ≤ 0,5 st và
|errStWide| ≤ 0,5 st và AM ≤ 0,6.
Kỷ luật cửa yên: chạy headed SAU KHI T4 attempt2 hợp lệ (20/20 + lớp B 5/5 +
tickCost median 55,0 ms, poller thoát 01:08:30Z) — không chạm cửa yên.

### 3.1. Lượt A — two-stage, cờ TẮT (`minus12Fallback=false`), 2 trang mới × 2 repeat

Lưới −12 (5 f0 × sine pitchCurve + harmonic harmonicCurve = 10 điểm), đếm theo
band + wide + AM:

| Lượt | pitchCurve −12 | harmonicCurve −12 | Tổng −12 |
|---|---|---|---|
| Trang 1, repeat 1 | 4/5 (fail sine 220) | 5/5 | 9/10 |
| Trang 1, repeat 2 | 5/5 | 5/5 | 10/10 |
| Trang 2, repeat 1 | 4/5 (fail sine 220) | 5/5 | 9/10 |
| Trang 2, repeat 2 | 5/5 | 5/5 | 10/10 |
| **Tổng** | | | **38/40** |

- **Cả 3 điểm fail hệ thống của đợt 197 đều HẾT**: pitchCurve 660 wide 990,9 →
  330,5 Hz (errStWide 19,04 → 0,02); harmonicCurve 440 wide 660,2 → 220,1 Hz
  (19,03 → 0,01); harmonicCurve 660 wide 992,2 → 330,8 Hz (19,06 → 0,04).
  AM ở −12 cải thiện mạnh: pitchCurve 0,03–0,08 (đợt 197: 0,15–0,31);
  harmonicCurve 0,16–0,42 (đợt 197: 0,17–0,46).
- **2 điểm fail còn lại là CÙNG 1 điểm**: pitchCurve sine 220/−12, repeat 1
  (render đầu tiên của trang mới), **số giống hệt nhau qua 3 trang mới**:
  peak 119,9 / wide 220,8 / errSt 1,50 / errStWide 12,07 / AM 0,05 → xem §3.3
  (F-198-P1-2). Đây là transient render-đầu, không phải artifact hài 3
  (đợt 197 repeat 1 cũng fail đúng điểm này, nhưng với chữ ký khác: AM 0,31
  dạng burst — nay AM 0,05 dạng passthrough sạch).
- Hai-stage renders: 11/repeat (5 pitchCurve −12 + 5 harmonicCurve −12 + 1 latency
  pitch−12); `psolaUpgraded` 97/97, `psolaFailed` 0 (lượt A đầy đủ).
- Telephone9 **giống hệt đợt 197 từng số** (100 Hz −18,5%, 300 Hz +17,2%… —
  không động telephone nên không đổi, đúng kỳ vọng).
- Latency two-stage pitch−12: onset 85 ms, xcorr 94,3 ms (đợt 197: 85/93,4 và
  80/120) — không đổi. pitch+12: 40 ms / 44,6 ms.

### 3.2. Lượt B — ship, cờ BẬT (`minus12Fallback=true`), 1 repeat

- **Giống hệt đợt 197-ship từng số**: −12 pitchCurve 107,5/167,5/215/275/335 Hz
  (errSt −0,4/0,26/−0,4/0/0,26; AM 0,16/0,28/0,72/0,10/0,33);
  harmonicCurve tương tự; `twoStageRenders=0`; latency pitch−12 30 ms / xcorr
  38,6 ms. Fallback (shifter 2-delay cũ) không thay đổi hành vi.
- `fallbackM12` (đường fallback trên fixture harmonic): 107,5/167,5/215/275 Hz,
  khớp lượt B.

### 3.3. F-198-P1-2 (MỚI): render đầu tiên của trang mới ở 220/−12 ra không dịch

- Định vị bằng spec `firstM12` (chỉ render sine 220/−12, đo đỉnh phổ từng cửa sổ
  100 ms trên [0,4)): **repeat 1 (cold) SAI TOÀN BỘ 4 s** — mọi cửa sổ band
  115–158 Hz (tán loạn), wide khóa ở ~220,8 Hz (hài 2 của đích); **repeat 2
  (warm, cùng trang) ĐÚNG từ t=0,2 s** (110,4 Hz mọi cửa sổ).
- Spec `dumpWave`: cold peak 0,499995 / RMS 0,353561 (= đúng sine vào biên độ 0,5);
  warm peak 0,3896 / RMS 0,2499. Sóng ra cold = sine vào gần như không dịch,
  biên độ đầy đủ.
- Cơ chế **CHƯA xác định** (đã đọc code worklet + `previewVoiceFx.ts`, chưa đủ
  bằng chứng để kết luận): các ứng viên — (a) worklet dry-passthrough
  (`warmedUp` không bao giờ true); (b) ratio kẹt = 1 (PSOLA tái tổng hợp đồng
  nhất); (c) khởi tạo chain/module ở render đầu. Bằng chứng loại trừ: KHÔNG phải
  dry của chain (`setParam` dùng `setTargetAtTime` tc = 0,01 s — dry về 0 trong
  ~50 ms, không thể mang sóng ở [1,0, 3,5)); head 8 mẫu đầu không phân biệt được
  (cả cold lẫn warm đều bắt đầu bằng dry crossfade ~50 ms); lag đoạn mid ≈ 71 mẫu
  (mod 218) ≠ LAG 2048 của worklet — không khớp (a) thuần túy, nhưng tần số ra
  là 220,8 Hz (không đúng 220) nên lag phụ thuộc thời gian, không kết luận được.
  Node cascade chạy từ cold start vẫn 10/10 — transient này KHÔNG tái hiện ở Node,
  chỉ có ở browser (OfflineAudioContext + worklet thật).
- Ảnh hưởng sản phẩm (suy luận, chưa chứng minh trên app thật): lần preview ĐẦU
  TIÊN sau khi load trang của clip pitch −12 có thể phát không dịch; phát lại thì
  đúng. Cần luồng sau xác minh trên app thật + sửa (giao P1/T1-199).
- **Không sửa trong đợt này**: đã hết ngân sách chẩn đoán sau khi định vị xong;
  sửa mò khi chưa rõ cơ chế sẽ rủi ro hơn lợi.

### 3.4. Quirks wide ở −7 (ngoài phạm vi flip, ghi nhận trung thực)

- pitchCurve 660/−7: wide 881,7 Hz (= 2×440,8, errStWide 12,01) ở CẢ 2 repeat —
  **MỚI so với đợt 197** (đợt 197: wide = peak 441,3). Band vẫn đúng (errSt 0,01,
  AM 0,05 — tốt nhất lưới).
- harmonicCurve −7 wide: cải thiện 1/5 → 4/5 (chỉ còn 220 fail wide 293,9 Hz,
  giống hệt đợt 197 từng số; 330/440/550/660 nay pass).
- Diễn giải: Fix-1 đổi cân bằng hài nhẹ (vị trí mark khác → pha overlap-add khác)
  nên thước wide (đỉnh lớn nhất toàn phổ) nhạy với hài nào trội hơn; thước band
  (cao độ thật) pass mọi điểm ở −7 cả hai đợt. Không phải lỗi cao độ.

## 4. F-198-P1-1: tỉ số mag N12a ở −12 — bar ≥ 10 KHÔNG ĐẠT ĐƯỢC VỀ CẤU TRÚC

- Phương pháp đúng của P4 (sine 0,7 s, đoạn [0,1, 0,6), Goertzel magTarget/magOrig;
  `scratch/n12a-worklet-198.mjs`): worklet cascade đã fix ở −12 có domFreq ĐÚNG
  đích cả 5 f0 (110,3/165,3/220,2/275,2/330,3; errHarm 0,01–0,05 — hài 3 trội
  ĐÃ HẾT), nhưng magT/magO chỉ 2,08–2,31, `shifted=false` cả 5 f0.
- **Core đối chứng cho số Y HỆT** (2,12–2,65; core 220: 0,448/0,178 = 2,51;
  440: 0,44/0,169 = 2,61; 660: 0,436/0,164 = 2,65 — khớp đúng số P4-197 đã công
  bố, xác nhận cài đặt Goertzel đúng).
- Lý do: ở r = 0,5, f0 trùng đúng hài 2 của đích (2×0,5 = 1) nên magOrig đo hài 2
  hợp lệ của output, không phải rò rỉ. **Bar `magT ≥ 10×magO` ở −12 là không đạt
  được về cấu trúc với mọi TD-PSOLA (kể cả core).** Ở −7/+7/+12 worklet đã fix
  pass 5/5 với tỉ số 125–942.
- Hệ quả cho quyết flip: thước mag không thể là điều kiện flip ở −12 dưới dạng
  hiện tại. Parent cần quyết: đánh giá −12 bằng domFreq/errHarm + thước cao độ
  wide, hoặc định nghĩa lại N12a ở −12. **P1-198 KHÔNG tự đổi bar.**

## 5. Test / build — số đo thật

| Kiểm tra | Kết quả |
|---|---|
| `psola.test.ts` (`node --experimental-strip-types`) | **18/18 pass** (16 cũ + 2 NaN mới) |
| `psolaWorklet198.test.ts` (mới, 3 test) | **3/3 pass** (không lật mark sau warmup; không burst — đỉnh phổ cục bộ trong ±0,40 st mọi cửa sổ 50 ms [1,0, 3,5); cascade −12 wide ở đích — sine 660 + harmonic 440) |
| Negative control (`scratch/negctrl/`, fix revert ở bản sao scratch) | **0/3 đúng như kỳ vọng** (13 lần lật, burst, wide 990,9 Hz +19,04 st) |
| `previewVoiceFx.test.ts` | **37/37 pass** |
| `audioEngineVoiceFx.test.ts` | **8/8 pass** |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** |
| `npx vite build` (apps/web) | **PASS, 8,11 s** (chỉ warning chunk-size có sẵn) |

- Lưu ý: 4 file test trên là script chạy trực tiếp bằng Node (kết thúc bằng
  `process.exit()`), KHÔNG phải suite vitest — chạy bằng `npx vitest run` sẽ báo
  "process.exit unexpectedly called" dù mọi check đều ✓ (đã xác minh: vitest vẫn
  in đủ 18 ✓ rồi mới fail ở `process.exit`). Chạy đúng cách là
  `node --experimental-strip-types <file>` từ gốc repo.
- Không động `apps/web/tsconfig.json` (P3/P4-198 đã thêm exclude cho file test
  của họ; file test của P1 tsc-clean, không cần exclude).

## 6. Quyết đề xuất cho parent (§14.2-198)

- **(a1) KHÔNG FLIP cờ `PSOLA_MINUS12_USE_FALLBACK`.** Điều kiện flip "(a2)-197:
  preview two-stage qua cả hai thước 10/10" CHƯA đạt: (i) thước cao độ 38/40
  (2 miss đều là F-198-P1-2 cold-start ở sine 220/−12); (ii) thước mag N12a ở −12
  ~2,1–2,6 so với bar 10 — cấu trúc, không phải do code P1-198.
- **(a2) F-197-P1-3 (hài 3 trội): COI LÀ SỬA XONG về mặt cao độ** — warm render
  10/10 cả hai thước band/wide ở −12, 4 repeat; AM cải thiện mạnh; Node cascade
  10/10 khớp core. Chữ ký fail hệ thống của đợt 197 không còn.
- **(a3) F-198-P1-2 (cold-start) giao luồng sau**: xác minh trên app thật (preview
  đầu tiên sau load trang của clip −12) + tìm cơ chế + sửa. Đây là nợ mới, không
  chặn việc ghi nhận F-197-P1-3 đã sửa.
- **(a4) F-198-P1-1 (N12a) chờ quyết parent**: giữ bar 10 (đồng nghĩa không bao giờ
  flip ở −12), hay đánh giá −12 bằng domFreq/errHarm + cao độ wide, hay định nghĩa
  lại N12a ở −12 (vd. đo mag ở hài 3 thay vì f0 gốc).
- **(a5) Chặn fallback ở preview GIỮ NGUYÊN** theo (a2)-197; render giữ PSOLA
  (đã thống nhất đợt 197, không đổi).

## 7. File đổi (stage)

- `apps/web/src/lib/psola.ts` — fix `sampleAt` (0 ngoài biên).
- `apps/web/src/lib/psolaWorkletSource.ts` — Fix-1 `placeMarks` (`nextMark = m + T`).
- `apps/web/src/lib/psola.test.ts` — +2 test NaN.
- `apps/web/src/lib/psolaWorklet198.test.ts` — mới (8.375 B, 216 dòng).
- `docs/PHASE9_ROUND198_P1_VOICEFX_NAN_LIMITS.md` — file này.
- Không sửa `PHASE9_GAP_ANALYSIS.md`. Không push. Không flip cờ.
- Scratch/chẩn đoán (không stage): `hidden_files/round198-p1/scratch/` (nan-check,
  cascade-diag, diag2–diag12, patch-test, fix-test, n12a-worklet, grid-198,
  negctrl/) + `hidden_files/round198-p1/chrome-twostage/`,
  `chrome-twostage2/`, `chrome-ship/`, `chrome-firstm12/`, `chrome-dumpwave/`
  (JSON headed + harness; bundle rebuild trong `harness/`).

## 8. Nợ / chưa làm

- F-198-P1-2 cold-start: cơ chế chưa xác định, chưa sửa (§3.3).
- N12a bar ở −12 chờ quyết parent (§4).
- Wide −7: pitchCurve 660 (mới) + harmonicCurve 220 (cũ) — thước wide nhạy hài,
  band vẫn đúng (§3.4); không chặn flip nhưng parent nên biết.
- Vấn đề tiềm ẩn đã biết từ trước, cố ý không động: splice mark cũ trong
  `placeMarks` không chỉnh `markIdx` (ghi nhận đợt trước — để nguyên).
- N10 không phải luồng này (giữ CHƯA ĐẠT theo (a1)-197).
