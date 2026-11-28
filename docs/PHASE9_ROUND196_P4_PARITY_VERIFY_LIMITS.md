# LIMITS — Đợt 196 P4: Kiểm chứng độc lập parity harness render-vs-preview

- **Luồng:** P4-196 (Editing Core — preview/render parity, đợt thứ 6 theo hướng mới).
- **Harness:** `apps/web/src/lib/parityHarness196.ts` + `parityHarness196.test.ts`,
  runner `scripts/parity196-run.mjs` + `scripts/parity196-run-test.mjs`.
  Report JSON: `hidden_files/parity196/parity196-report.json` (run 8, 15:39:31Z).
- **Verdict harness: 47/54 ĐẠT; 7 CHƯA ĐẠT; 7 GHI NHẬN** (61 record — 195 có 57:
  thêm N12a PSOLA sim + 3 record N11 fixture mới của P3-196: chirp-70s, longB).
- **Không hồi quy:** mọi record chung với 195 khớp từng chữ số ở run 2/3b/4/5/6/7/8
  (sim xác định, chạy lặp ổn định). N5b và N11a-longA CẢI THIỆN → ĐẠT (xem §2.1, §2.4).
- **Chưa kiểm được (GHI NHẬN):** N1/N2-headed/N2c/N9b/N12 (P1 chưa publish
  `headed-voice196.json` lúc P4 đóng cờ — P1 đã publish LIMITS + chrome JSON
  15:24Z; P4 đã đo độc lập voice ±7 + telephone từ WAV headed của P1, xem §2.2–2.3),
  N13 (P2 chưa đóng LIMITS), S6b (như 195).
- **Kiểm poll-t4.log trước mọi đo nặng, mọi lần chạy** (F-195-P4-3): T4-196 tới poll #74
  vẫn 0 lần "CUA YEN MO" — không chồng pha đo yên nào. Harness + suite test đều nhẹ
  (node/esbuild; chỉ ffmpeg giải mã WAV nhỏ + decode cross-check N11b).

## 1. Harness — chạy 8 lần, số sim ổn định từng chữ số

- Run 1 (14:50Z): 43/46 ĐẠT — headed fallback hỏng do bug guard mtime (phần lẻ thập
  phân `.047212854 > .047000`); đã sửa bằng dung sai +1000 ms.
- Run 2: 46/51 ĐẠT, 5 CHƯA ĐẠT (N5b, N10, N2a, N2-headed, N12). Run 3: CRASH ENOSPC
  (F-196-P4-1). Run 3b (TMPDIR sang đĩa chính): 46/51 — khớp 195 từng chữ số.
- Run 4 (mô hình preview 196): 47/52 (N5d mới ĐẠT). Run 5 (P1 ship PSOLA 15:06Z):
  44/47 — headed fallback tắt đúng thiết kế (chờ probe P1-196).
- Run 6 (15:19Z): 44/48 — P2 hạ ngưỡng blend 8 → 2,7 giữa lúc chạy (xem §2.1).
- Run 7 (15:27Z): 46/50 — P3 publish waveform longA. Run 8 (15:39Z): **47/54** —
  P3 publish thêm longB + chirp-70s (15:32/15:37Z, `tmp-round196-p3/`).
- Thiết kế mới 196: headed đọc JSON 196 trước, JSON 195 chỉ làm hồi quy khi code
  sản phẩm chưa đổi (guard mtime); code đổi mà chưa có probe 196 → GHI NHẬN.
  N12 PSOLA pitch + N12a sim độc lập + N13 fps nguồn media (mới). N11 lookup
  `benchmarks/reverse196/` + `tmp-round196-p3/`; bỏ hardcode chirp-70s (F-195-P3-1).
- Test helper harness: **22/22 PASS** (thêm 2 test blend + 1 test PSOLA, khóa hành vi
  thật — kể cả điểm fail: 440/−12 không dịch). `tsc --noEmit`: 0 lỗi.

## 2. Kết quả theo mảng sản phẩm

### 2.1 P2 — blend dọc sau bob: N5b ĐẠT, N10 còn CHƯA ĐẠT, vách ngưỡng đã sửa

- **N5b (fixture tĩnh) ĐẠT: preview-196 6,804 vs tap 6,855 (−0,052).** 195 là 6,985
  (+0,130). Cưỡng bức w=0,75 mọi frame cũng 6,804 — trùng claim P2 (6,804 vs 6,856).
- **N10 (fixture chuyển động) CHƯA ĐẠT: 6,256 vs tap 6,243 (+0,013)** — cải thiện
  từ +0,346 (195) nhưng vẫn thua sát nút; R_rel worst 0,158 > 0,15 (nguyên nhân
  thất bại thứ hai, như 195: R_rel 0,200 → 0,158). Cưỡng bức w=0,75 cũng 6,256 —
  blend không phải nút thắt còn lại của N10; cần P2 xem lại (fixture trượt 3 px/frame).
- **F-196-P4-2 (vách ngưỡng σ̂≥8) — P2 ĐÃ SỬA trong đợt:** P2 hiệu chuẩn lại
  `MIN_SIGMA` 8,0 → **2,7** (enhancePreview.ts 15:19Z): x264 ăn bớt nhiễu — clip
  nhiễu headed σ̂ chỉ 3,55, không bao giờ chạm 8; sạch đã mã hóa 1,81 ↔ nhiễu σ=15
  là 3,66. Run 6 xác nhận w=0,75 trên mọi frame fixture (σ̂ 7,71–8,23). **N5d ĐẠT**
  (w=0,75 khi σ̂≥2,7; 0 khi sạch/null; chỉ khi tap áp drawScaleY≥0,9).
  Rủi ro còn lại (P2 tự ghi): texture mịn sạch có thể đọc σ̂ tới ~2–3 → dương tính
  giả, chi phí +0,044 MAD — chấp nhận được.
- Cross-check P2 headed (`headed-196-p2-bob-result.json` 15:14Z, TRƯỚC khi hạ ngưỡng):
  G5c clip nhiễu blend=0 (σ̂ đọc được chỉ 2,036 — clip "nhiễu" không nhiễu thật);
  E1 biên trên drawImage lệch +0,5px: hàng 2 = 105 thay vì 50 (clamp biên chưa đúng);
  B1 sample media sinh thật fps 27,78 (không phải 30 — xem §2.5). P2 chưa đóng LIMITS
  lúc P4 viết file này — các điểm trên là quan sát từ file headed của P2, không phải
  verdict P4.

### 2.2 P1 — PSOLA pitch: N12a CHƯA ĐẠT (−12 không dịch); ±7 dịch được

- **N12a sim độc lập CHƯA ĐẠT: 15/20 điểm dịch đúng, 5/20 KHÔNG dịch — toàn bộ
  n=−12 (mọi f0 220–660).** Lõi `psolaPitchShift` thật trên sine 0,7 s, đo bằng
  đỉnh TOÀN CỤC 50–2000 Hz + AM khối RMS 5 ms. Bar (a2)-195: AM ≤ 0,35 mọi f0 +
  |errSt| ≤ 0,5 st. Điểm dịch đúng: errSt-hài tệ nhất 0,098 st, AM tệ nhất 0,188 —
  trong bar. Điểm −12: đỉnh trội vẫn ở f0 gốc (vd 440 → 439 Hz), magTarget
  0,001–0,003 vs magOrig 0,90–0,95 (tỉ lệ ~1:300). AM mọi điểm ≤ 0,19.
- **F-196-P4-3 — r=0,5 không dịch + đo hẹp của P1 báo sai:** khoảng cách hạt tổng
  hợp T_s=2T là bội nguyên của chu kỳ → các hạt cùng pha → output giữ f0 (chỉ thêm
  sideband yếu). P1 đo bằng `spectralPeak` dải HẸP [0,8×,1,25×] mục tiêu nên báo
  sideband yếu là "đỉnh" (vd 220/−12 → 110,2 Hz, errSt 0,02). P1 tự thừa nhận
  trong LIMITS §4 ("core KHÔNG dịch được sine thuần — đỉnh trội vẫn ở f0 gốc,
  vd 440/−12 → 440,4 Hz") và trong `psola.test.ts` (test "sine thuần KHÔNG dịch",
  assert mag440 > 3× mag220) — **số sim hẹp của P1 mâu thuẫn với chính test + §4
  của P1; số đo rộng của P4 khớp với test + §4 của P1.** Headed của P1 cũng fail
  −12 ở 440/550 (+2,69/+3,14 st; đỉnh rơi ~0,6×f0) và sine 660/−12 fail +3,26
  (đỉnh 398,4 Hz); harmonic 660/−12 báo 331,3 qua đo hẹp — cùng artifact
  (P4 kiểm rộng ở 220/440/550 đều không dịch).
- **−12 cũng KHÔNG dịch trên tín hiệu hài** (P4 kiểm thêm, 8 hài 1/k + tremolo như
  recipe của P1): 220/−12 magTarget 0,0000 vs magOrig 0,2387; 550/−12 0,0001 vs
  0,2285; 440/−12 đỉnh trội 1762 Hz (hài 4 của gốc). "PSOLA cần cấu trúc chu kỳ"
  không cứu được −12 — lỗi là r=0,5, không phải tín hiệu thiếu cấu trúc.
- **Giọng thật headed (P4 đo độc lập trên WAV của P1, ref.wav giọng nữ 3,64 s):**
  per-frame f0-track (estimatePitchTrack, conf>0,5): **+7 tỉ lệ trung vị 1,564**
  (kỳ vọng 1,498; f0 med 248,5 vs kỳ vọng 247,2 — dịch đúng); **−7 tỉ lệ 0,716**
  (kỳ vọng 0,667 — lệch +1,24 st). P1 đo bằng phương pháp chặt hơn (khớp khung,
  conf≥0,7) được −7 = 0,672 (+0,11 st, trong bar) — **−7 trên giọng thật nhạy với
  phương pháp đo; P4 ghi cả hai số, không kết luận −7 fail.** P1 đo voice −12:
  tỉ lệ 1,008 (kỳ vọng 0,500, +12,14 st) — **voice −12 KHÔNG dịch** (P1 LIMITS §2.1).
  −7 làm tracker mất khung voiced (180 → 69 khung); f0med của P1 (178 Hz) và của
  P4 (124,3 Hz) lệch nhau — output −7 khó track (nền yếu, xem dưới).
- **Nền yếu ở −7 (caveat, không phải fail cao độ):** 3/5 điểm −7 (220/550/660) hài 2
  của mục tiêu trội hơn nền (vd 220/−7: đỉnh 293 Hz = 2×146,8; magTarget 0,337 vs
  magOrig 0,007 — đã dịch, chỉ âm mỏng). Verdict N12a dùng errSt-hài (k×target gần
  đỉnh nhất) + điều kiện magTarget ≥ 10× magOrig.
- **F-196-P4-4 — NaN 1 mẫu cuối output PSOLA:** `sampleAt()` đọc `samples[i0+1]`
  khi i0 là mẫu cuối + frac>0 → `undefined×frac` = NaN. Đúng 1 NaN ở mẫu cuối mọi
  lần chạy (0,7 s và 4 s; cả sine lẫn hài). Cửa sổ đo [1,0,3,5) của P1 không bao
  giờ chạm cuối nên P1 không thấy; cửa sổ [0,1,0,6) của P4 chạm → Goertzel nhiễm
  NaN, đỉnh rơi về biên 50 Hz (đã phát hiện nhờ test fail, không sửa test cho qua).
  Harness sanitize NaN→0 khi đo + ghi `nan_samples_max: 1`. Ảnh hưởng sản phẩm:
  1 mẫu NaN cuối clip có thể gây click/nhiễm đo downstream — P1 sửa `sampleAt`.
- **Đối chiếu thước đo với P1 (LIMITS P1-196, 29.808 B — P1 đã sửa thước đo ở lần
  chạy 3):** P1 báo cả hai thước: band hẹp (35/40) + đỉnh trội toàn phổ
  `peakWide` (harmonic 29–30/40, sine 35/40). P1 xác nhận đỉnh toàn phổ −12 vẫn
  ở f0 gốc (220,2 / 329,9 / 440,0 / 549,9 Hz) — **khớp hoàn toàn với P4**.
  Khác biệt duy nhất: thước toàn phổ "thuần" của P1 fail cả 5 điểm −7 (P1 tự
  nhận "thước quá chặt cho cao độ cảm nhận — ghi cả hai"); thước của P4 (sai số
  theo hài k×target + magTarget ≥ 10× magOrig) cho −7 ĐẠT với caveat nền yếu.
  Hai thước đồng ý ở −12 (fail) và ±12/+7 (đạt); chỉ khác ở cách tính −7.
  N2b/N9a (sim 2-delay) ĐẠT, không hồi quy.
- **N2a (shifter 2-delay cũ) CHƯA ĐẠT như 195** (AM 0,534 @440) — 2-delay nay chỉ
  là fallback khi PSOLA upgrade thất bại; verdict đường chính ở N12/N12a.
- **GHI NHẬN N12 (headed PSOLA curve):** chờ `headed-voice196.json` của P1. Số
  headed đã có trong chrome JSON 15:24Z + LIMITS P1: xem đối chiếu ở trên.

### 2.3 Telephone — ĐẠT bar (đo độc lập từ WAV headed của P1)

- P1 `telephone9`: max |Δ| = **1,78 dB @100 Hz — đúng bar, khớp y hệt 193/194/195
  từng số** (200 +0,06; 300 +1,38; 440 +0,22; 700 −1,18; 1000 −1,47; 2000 −0,40;
  3400 +1,38; 5000 +0,06). Telephone không chạm code đợt này.
- P4 đo độc lập bằng FFT trên WAV headed (bypass vs telephone): năng lượng dải
  300–3400 Hz 9,3% → 39,8%, <300 Hz 90,0% → 59,0%, RMS 0,087 → 0,045 — bandpass
  hoạt động rõ. Robot không đổi phổ (90,0/9,4% — hiệu ứng miền thời gian, đúng).
  N1 headed vẫn GHI NHẬN (chờ JSON P1) vì bar gain cần số preview/render của P1.

### 2.4 P3 — cap drift 0,3 s: longA ĐẠT, longB/chirp sát nút CHƯA ĐẠT

- Cap đã implement: `REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC = 0.3`
  (`reverseAudioWiring.ts:89`, 14:40Z). Cap hoạt động: holdCapStop kích 2–3 lần
  mỗi fixture (longA 2, longB 3, chirp 2).
- **N11a longA ĐẠT: drift trung vị 0,078 s, p90 0,256 s, max 0,485 s** (195: max
  0,685 s — cải thiện rõ; < bar 0,5 s). 87/200 mẫu in-pass, loại 13 stale-peak.
- **N11a longB CHƯA ĐẠT: max 0,537 s** (vượt bar 0,037 s = chưa tới 1 bin 0,087 s);
  trung vị 0,137 s, p90 0,259 s, 99,7% mẫu |drift| ≤ 0,5 s; max thô 0,993 s
  (đã loại 85 stale-peak). Sát nút — 1 bin đo.
  **Đối chiếu thước S2 mới của P3 (nợ khớp P3 LIMITS §1.4):** P3 báo longB max
  **0,481 s** với quy tắc lọc S2 mới (loại mẫu lag-analyser: peakHz dịch < 24 Hz
  trong khi playhead chạy ≥ 0,15 s; S2 lọc 111/456 mẫu longB) — dưới bar. Ba số
  longB theo ba thước: S1 cũ của P3 0,737 s / thước §1.4 của P4 0,537 s / S2 mới
  của P3 0,481 s. **P4 CHƯA kiểm chứng độc lập quy tắc S2** (mới trong đợt 196,
  do P3 đưa ra); verdict trên đứng theo thước §1.4 đã thiết lập từ các đợt trước
  (longA khớp nhau: 0,485 s cả hai thước). Parent/T10 quyết thước nào chi phối
  N11a-longB; nếu chấp nhận S2 thì longB đổi thành ĐẠT.
- **N11a chirp-70s CHƯA ĐẠT: max 0,664 s** — nhưng fixture này không đủ phân giải
  đo 0,5 s: chirp slope chỉ 38,38 Hz/s → bin 0,611 s > bar 0,5 s (chirp_parsed=0,
  R²=0,997). Trung vị 0,135 s, p90 0,329 s. **CHƯA ĐẠT này là giới hạn đo, chưa
  chứng minh drift thật vượt bar** — fixture chirp-70s không phù hợp làm bar 0,5 s.
- **N11b decode cửa sổ (bar tham chiếu 5.000 ms, nợ P3-194 §5.2 — chưa do parent
  đặt): longA 10.765 ms CHƯA ĐẠT** (195: 5.199 ms lần đầu — chậm hơn; ffmpeg
  audio-only toàn file 6,01 s); **longB 5.053 ms lần đầu / 4.825 ms lần gần nhất
  CHƯA ĐẠT** (vượt 53 ms; ffmpeg 1,27 s); chirp-70s 1.199 ms ĐẠT. P3 chưa đóng
  LIMITS lúc P4 viết — chưa rõ 10.765 ms gồm những gì (đợt sau P3 giải thích).
- N11b-window-logic ĐẠT (cửa sổ 30 s đúng vị trí).

### 2.5 N13 fps nguồn media + S6b — GHI NHẬN

- `apps/web/src/media.ts` có `fps?: number` từ đợt 194. P2-196 chưa đóng LIMITS;
  file headed của P2 ghi "media mau-* mang fps 30" (A1 ok) nhưng "sample media
  sinh thật fps 27,78" (B1 không ok) — **fps ghi 30 vs fps đo thật 27,78 lệch nhau**;
  P4 chưa verdict N13 cho tới khi P2 chốt (field có hay không + số nào đúng).
- S6b reverse-video-boundary GHI NHẬN như 195 (cần probe headed seek biên).

### 2.6 Suite test sản phẩm (chạy lại sau khi P1/P2/P3 ship)

- P1: `psola.test.ts` **12/12**, `previewVoiceFx.test.ts` **27/27**,
  `audioEngineVoiceFx.test.ts` **8/8**, `test-audioengine.sh` **56/56**.
- P2: 10 file enhance (59P8→91P2) **149/149, 0 fail** (esbuild bundle + node).
- P3: `reverseAudio196P3.test.ts` **5/5** (cap 0,3 s + trần tuyệt đối).
- Media: `run-media-tests.mjs` **4/4 PASS**. Harness test: **22/22**. tsc: 0 lỗi.
- Lưu ý: `npx vitest` không chạy được trên repo này (không có config/vitest local
  — fail lúc khởi động); các suite trên chạy bằng `node --experimental-strip-types`
  hoặc esbuild bundle theo header từng file — đó là cách chạy đúng của repo.

## 3. F-numbers (P4-196)

- **F-196-P4-1 — ENOSPC làm crash run 3:** /tmp tmpfs 512 MB đầy 100% (scratch P2
  `/tmp/round196-p2` 419 MB + TMP của P4 84 MB). Đã chuyển TMPDIR sang đĩa chính
  (`hidden_files/parity196/scratch`, 67 GB trống); không mất dữ liệu; đã dọn TMP
  thừa của P4 khỏi /tmp. KHÔNG đụng scratch P1/P2/P3.
- **F-196-P4-2 — vách ngưỡng blend σ̂≥8: ĐÃ SỬA** (P2 hạ về 2,7 trong đợt — §2.1).
- **F-196-P4-3 — PSOLA r=0,5 không dịch + đo hẹp báo sai** (§2.2). Ảnh hưởng: mọi
  preset pitch −12 (voice −12 không dịch; sine/hài −12 không dịch). Hướng sửa
  thuộc P1-197: đổi cơ chế hạt ở r=0,5 (vd overlap khác pha) hoặc chặn −12 về
  fallback; sửa phép đo thành đỉnh toàn cục + tỉ lệ magTarget/magOrig.
- **F-196-P4-4 — NaN 1 mẫu cuối output PSOLA** (§2.2). Sửa `sampleAt()` trong
  `psola.ts` (clamp khi i0 là mẫu cuối).

## 4. File stage (batch `phase9-round196-p4-parity-verify.txt`)

- `docs/PHASE9_ROUND196_P4_PARITY_VERIFY_LIMITS.md` (file này).
- `apps/web/src/lib/parityHarness196.ts`, `apps/web/src/lib/parityHarness196.test.ts`.
- `scripts/parity196-run.mjs`, `scripts/parity196-run-test.mjs`.
- `apps/web/tsconfig.json` (thêm exclude `parityHarness196.test.ts`).
- Report JSON KHÔNG stage (file JSON trong hidden_files, không phải file text
  stage theo quy ước — T10 lấy từ `hidden_files/parity196/parity196-report.json`).
- Chỉ file text, không binary. Kiểm tra mọi entry tồn tại trên đĩa trước khi báo.

## 5. Nợ / chờ quyết (cho parent + T10)

- (a) **PSOLA −12:** P4 đề xuất parent quyết: chặn −12 về 2-delay fallback (âm cũ
  vẫn dịch được, AM 0,534 @440 — tệ nhưng có dịch) hay giữ PSOLA −12 không dịch
  (hiệu ứng im lặng sai cao độ) cho tới khi P1-197 sửa lõi. Quyết này thuộc parent.
- (b) **N10:** blend không cứu được (+0,013 + R_rel 0,158); cần P2 xem lại fixture
  trượt / ngưỡng R_rel.
- (c) **N11b decode longA 10.765 ms** (tệ hơn 195: 5.199 ms) + longB 5.053 ms sát
  bar tham chiếu 5.000 ms — cần P3 giải thích ở LIMITS P3-196 (chưa có lúc P4 đóng).
- (d) **N13 fps 30 vs 27,78** + **E1 clamp biên drawImage** (P2 headed) — chờ P2 LIMITS.
- (e) **Headed PSOLA curve (N12) + telephone gain (N1) + N2-headed/N2c/N9b:** chờ
  `headed-voice196.json` của P1; P4 đã đo độc lập các điểm chính (§2.2–2.3) nên
  thiếu JSON không đổi verdict N12a.
- (f) Chirp-70s không đủ phân giải đo drift 0,5 s (bin 0,611 s) — fixture này không
  nên dùng làm bar N11a đợt sau; dùng longA/longB (bin 0,087 s).
