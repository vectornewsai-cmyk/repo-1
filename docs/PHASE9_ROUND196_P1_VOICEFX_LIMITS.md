# LIMITS — Đợt 196 P1: TD-PSOLA pitch-shift thật (AudioWorklet) — thay shifter 2-delay
(Editing Core — preview/render parity, đợt thứ 6 theo hướng mới)

- **Luồng:** P1 đợt 196 (Phase 9 VCut). **Ngày:** 26/11/2026.
- **Nhiệm vụ (brief):** (a) triển khai pitch-shift PSOLA (TD-PSOLA) local, thay
  đường cong W hiện tại: pitch 220–660 Hz trên voice thật + fixture, mục tiêu
  AM ≤ 0,35 và sai lượng tử hoá ≤ 0,40 st trên MỌI f0; (b) giữ telephone ĐẠT
  bar (max |Δ| ≤ 1,78 dB); (c) parity preview/render cho pitch PSOLA mới;
  (d) ghi rõ f0 nào còn fail + số đo + hướng sửa — KHÔNG thổi phồng.
- **Kết quả chung:** PSOLA đã triển khai xong (core offline + AudioWorklet
  streaming + nối vào preview, fallback shifter cũ khi worklet không khả
  dụng). **Headed Chrome 158, 2 repeat, thước đo đã sửa (§6 F-196-P1-3):
  lưới harmonic — cao độ (đỉnh trong band) 35/40, đỉnh trội toàn phổ 29–30/40;
  lưới sine — cao độ 35/40, đỉnh trội toàn phổ 35/40; AM harmonic 39/40,
  AM sine 36/40; telephone max |Δ| = 1,78 dB — ĐẠT bar, không hồi quy
  (khớp y hệt đợt 193/194/195 từng số).**
  So với shifter cũ (đợt 195: AM ≤ 0,35 chỉ 28/40 điểm, 440 Hz tệ nhất 0,72):
  AM nay ≤ 0,35 ở 39/40 điểm harmonic (tệ nhất 0,37 — chỉ 1 điểm vượt bar,
  vượt 0,02); 440 Hz nay AM tệ nhất 0,27, 660 Hz tệ nhất 0,23.
  **Phát hiện chính của đợt (đã chứng minh bằng số, xem §4): PSOLA dịch ĐÚNG
  cao độ ở mọi tỉ lệ KHÔNG nguyên; ở tỉ lệ nguyên đúng r = 0,5 (n = −12)
  hạt tái tạo lại đúng tín hiệu gốc — output = input, không dịch (cả 5 f0,
  cả core lẫn worklet, cả harmonic lẫn sine).** Đây là giới hạn vật lý của
  TD-PSOLA với cửa sổ đối xứng, không phải bug implement — hướng sửa ở §5.1.
  **(c) CHƯA ĐẠT ở mức cùng-code:** render vẫn dùng rubberband
  (phase vocoder) — thống nhất render sang PSOLA là việc P1-197 (core offline
  `psola.ts` đã viết sẵn để tái dùng cho bước pre-process Node của render);
  parity hiện chỉ chứng minh ở mức chỉ số đầu ra trên fixture harmonic
  (xem §6). **Còn fail ổn định (xem §1.3, §5): cả 5 điểm n = −12 (lock
  tỉ lệ nguyên); (220,−1) harmonic AM 0,37; n=+12 sine AM 0,36–0,47;
  voice thật n=−12 chưa dịch được (cùng lock); (550,+7) harmonic flake
  ở repeat 1 (2/2 lần chạy headed).**

## 1. Headed (Chrome 158, OfflineAudioContext, bundle từ cây hiện tại) — verdict

Phương pháp đúng P1-195 (render 4 s, cửa sổ [1,0, 3,5)s, FFT zero-pad 2^18 +
nội suy parabol log-mag; AM = (max−min)/(max+min) của RMS khối 5 ms).
**Thước đo cao độ có HAI số (sửa sau F-196-P1-3, xem §6):** `peak`/`errSt` =
đỉnh trội trong band hẹp [0,8×target, 1,25×target] (thước cũ từ đợt 193 —
đo "có thành phần ở cao độ mục tiêu không"); `peakWide`/`errStWide` =
đỉnh trội toàn phổ [50, 3000] Hz (thước mới đợt này — đo "cao độ mục tiêu
có phải thành phần trội nhất không"). Một điểm chỉ ĐẠT cao độ khi cả hai
đều ≤ 0,40 st; hai số khác nhau thì xem §1.3/§4 để biết nguyên nhân.
Worklet upgrade thành công 103/103 lần render (repeat 1) và 206/206 (cộng dồn
repeat 2), 0 lần fail. Đo 2 repeat × 2 lần chạy headed (15:24Z và 15:37Z):
telephone KHỚP Y HỆT mọi lần; harmonic chỉ khác nhau ở 1 điểm flake
(550,+7, repeat 1 — xem §1.3).

### 1.1 Lưới harmonic (8 hài 1/k + tremolo 5 Hz 8% — fixture ĐÚNG cho PSOLA)

| f0 | n | Mục tiêu | Trội r1 / r2 | Sai st r1 / r2 | AM r1 / r2 | f0 | n | Mục tiêu | Trội r1 / r2 | Sai st r1 / r2 | AM r1 / r2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 220 | −12 | 110,0 | 110,7 / 110,7 | +0,10 / +0,10 | 0,13 / 0,13 | 440 | −12 | 220,0 | 220,7 / 220,7 | +0,06 / +0,06 | 0,13 / 0,13 |
| 220 | −7 | 146,8 | 147,6 / 147,6 | +0,09 / +0,09 | 0,32 / 0,32 | 440 | −7 | 293,7 | 294,3 / 294,3 | +0,04 / +0,04 | 0,18 / 0,18 |
| 220 | −5 | 164,8 | 165,6 / 165,6 | +0,08 / +0,08 | 0,27 / 0,27 | 440 | −5 | 329,6 | 330,3 / 330,3 | +0,05 / +0,05 | 0,16 / 0,16 |
| 220 | −1 | 207,7 | 207,8 / 207,8 | +0,01 / +0,01 | **0,37** / **0,37** | 440 | −1 | 415,3 | 415,3 / 415,3 | 0,00 / 0,00 | 0,19 / 0,19 |
| 220 | +1 | 233,1 | 233,4 / 233,4 | +0,02 / +0,02 | 0,32 / 0,32 | 440 | +1 | 466,2 | 466,3 / 466,3 | 0,00 / 0,00 | 0,19 / 0,19 |
| 220 | +5 | 293,7 | 294,7 / 294,7 | +0,06 / +0,06 | 0,18 / 0,18 | 440 | +5 | 587,3 | 588,3 / 588,3 | +0,03 / +0,03 | 0,10 / 0,10 |
| 220 | +7 | 329,6 | 330,7 / 330,7 | +0,06 / +0,06 | 0,22 / 0,22 | 440 | +7 | 659,3 | 659,5 / 659,5 | +0,03 / +0,03 | 0,17 / 0,17 |
| 220 | +12 | 440,0 | 441,3 / 441,3 | +0,05 / +0,05 | 0,35 / 0,35 | 440 | +12 | 880,0 | 880,5 / 880,5 | +0,02 / +0,02 | 0,27 / 0,27 |
| 330 | −12 | 165,0 | 165,6 / 165,6 | +0,06 / +0,06 | 0,18 / 0,18 | 550 | −12 | 275,0 | 324,9 / 324,9 | **+2,89** / **+2,89** | 0,13 / 0,13 |
| 330 | −7 | 220,2 | 221,0 / 221,0 | +0,06 / +0,06 | 0,16 / 0,16 | 550 | −7 | 367,1 | 367,8 / 367,8 | +0,03 / +0,03 | 0,14 / 0,14 |
| 330 | −5 | 247,2 | 248,0 / 248,0 | +0,05 / +0,05 | 0,22 / 0,22 | 550 | −5 | 412,0 | 412,8 / 412,8 | +0,03 / +0,03 | 0,13 / 0,13 |
| 330 | −1 | 311,5 | 311,4 / 311,4 | 0,00 / 0,00 | 0,22 / 0,22 | 550 | −1 | 519,1 | 519,0 / 519,0 | 0,00 / 0,00 | 0,21 / 0,21 |
| 330 | +1 | 349,6 | 350,5 / 350,5 | +0,04 / +0,04 | 0,21 / 0,21 | 550 | +1 | 582,7 | 582,6 / 582,6 | 0,00 / 0,00 | 0,17 / 0,17 |
| 330 | +5 | 440,5 | 440,7 / 440,7 | +0,01 / +0,01 | 0,13 / 0,13 | 550 | +5 | 734,2 | 734,4 / 734,4 | +0,01 / +0,01 | 0,12 / 0,12 |
| 330 | +7 | 494,4 | 495,4 / 495,4 | +0,03 / +0,03 | 0,14 / 0,14 | 550 | +7 | 824,1 | 699,6 / 824,4 | **−2,83** / +0,01 | 0,21 / 0,21 |
| 330 | +12 | 660,0 | 660,5 / 660,5 | +0,01 / +0,01 | 0,12 / 0,12 | 550 | +12 | 1100,0 | 1100,7 / 1100,7 | +0,01 / +0,01 | 0,24 / 0,24 |
| 660 | −12 | 330,0 | 331,0 / 331,0 | +0,07 / +0,07 | 0,17 / 0,17 | 660 | +1 | 699,2 | 699,3 / 699,3 | 0,00 / 0,00 | 0,18 / 0,18 |
| 660 | −7 | 440,5 | 441,3 / 441,3 | +0,03 / +0,03 | 0,16 / 0,16 | 660 | +5 | 881,0 | 882,2 / 882,2 | +0,02 / +0,02 | 0,12 / 0,12 |
| 660 | −5 | 494,4 | 495,3 / 495,3 | +0,03 / +0,03 | 0,16 / 0,16 | 660 | +7 | 988,9 | 989,1 / 989,1 | +0,01 / +0,01 | 0,15 / 0,15 |
| 660 | −1 | 623,0 | 622,9 / 622,9 | 0,00 / 0,00 | 0,16 / 0,16 | 660 | +12 | 1320,0 | 1321,5 / 1321,5 | +0,02 / +0,02 | 0,23 / 0,23 |

- **Cao độ (band): 35/40 cả hai repeat** — tệ nhất (bỏ 5 điểm −12) +0,10 st.
  **Cao độ (toàn phổ): 29/40 (r1) / 30/40 (r2).** **AM: 39/40 cả hai repeat**
  — tệ nhất 0,37 (220/−1, vượt bar 0,02).
- **5 điểm n = −12 FAIL cả hai thước — output = input (lock tỉ lệ nguyên,
  xem §4):** đỉnh toàn phổ vẫn ở f0 gốc (220,2 / 329,9 / 440,0 / 549,9 /
  661,8 Hz; errStWide = +12,0 st). Đỉnh band ở các điểm này (110,2 / 165,6 /
  220,8 / 324,9 / 331,3 Hz) là **sidelobe**: độ lớn phổ tại target chỉ 35
  so với 29.433 tại f0 gốc ở (220,−12) — tức 0,1%, không phải thành phần
  dịch thật (đo Node worklet, §6 F-196-P1-3). Bản đo lần đầu (15:24Z) đã
  ghi nhầm 4/5 điểm này là PASS vì chỉ có thước band — đã sửa ở lần đo
  15:37Z và trong file này.
- **5 điểm n = −7: band PASS (errSt 0,00–0,01) nhưng toàn phổ FAIL**
  (đỉnh trội ở 2×target: 293,9 / 661,4 / 882,1 / 1101,0 / 1323,3 Hz;
  errStWide +12,0 / +19,0 st). Đây KHÔNG phải lỗi cao độ: độ lớn tại
  target và tại 2×target gần bằng nhau (Node worklet: (220,−7) 16.852 vs
  17.180 — tỉ lệ 0,98; (440,−7) 11.274 vs 11.060 — tỉ lệ 1,02; (550,−7)
  16.472 vs 16.174 — tỉ lệ 1,02) — hài cơ bản CÓ ở cao độ mục tiêu với
  độ lớn đầy đủ, chỉ không trội hơn hài 2 quá 2% (so sánh: (440,−5) tỉ lệ
  1,80; (440,−1) 9,49; (440,+7) 6,08). Tai nghe cao độ từ khoảng cách hài
  (chu kỳ xung T_s) nên cao độ cảm nhận vẫn đúng target; đây là ghi chú
  về âm sắc (hài 2 mạnh bằng hài cơ bản ở n = −7), không phải fail cao độ.
  Thước toàn phổ ở đây là thước quá chặt cho cao độ cảm nhận — ghi cả hai
  số, không giấu số nào.
- So với shifter cũ đợt 195 (harmonic chưa đo, sine: AM ≤ 0,35 chỉ 28/40,
  440 Hz tệ nhất 0,72): **440 Hz nay AM tệ nhất 0,27 (r1/r2), 660 Hz tệ
  nhất 0,23** — dải xấu đã triệt.

### 1.2 Lưới sine (ghi nhận — worklet dịch được sine, khác core offline, xem §4)

| f0 | n | Trội r1 / r2 | Sai st r1 / r2 | AM r1 / r2 | f0 | n | Trội r1 / r2 | Sai st r1 / r2 | AM r1 / r2 |
|---|---|---|---|---|---|---|---|---|---|
| 220 | −12 | 110,7 / 110,7 | +0,10 / +0,10 | 0,19 | 440 | −12 | 256,9 / 256,9 | **+2,69** | 0,10 |
| 220 | +1 | 220,9 / 234,0 | **−0,93** / +0,07 | 0,19 / 0,22 | 440 | +12 | 880,5 / 880,5 | +0,01 | 0,29 |
| 220 | +12 | 441,3 / 441,3 | +0,05 | **0,40** / **0,40** | 550 | −12 | 329,7 / 329,7 | **+3,14** | 0,14 |
| 330 | +12 | 660,5 / 660,5 | +0,01 | **0,47** / **0,47** | 550 | +12 | 1100,7 / 1100,7 | +0,01 | **0,36** |
| 660 | −12 | 398,4 / 398,4 | **+3,26** | 0,11 | 660 | +12 | 1321,5 / 1321,5 | +0,02 | **0,36** |

(Các điểm còn lại đều PASS cả hai thước: errSt ≤ 0,10 st, AM 0,02–0,29.)
- **Cao độ (band): 35/40 cả hai repeat; cao độ (toàn phổ): 35/40 cả hai
  repeat; AM: 36/40 cả hai repeat.**
- Fail ổn định: **cả 5 điểm n = −12** (đỉnh toàn phổ ở f0 gốc: 220,9 /
  330,0 / 440,1 / 550,0 / 661,0 Hz; errStWide = +12,0 st — cùng lock tỉ lệ
  nguyên như harmonic; đỉnh band ở (440/550/660,−12) là sidelobe 256,9 /
  329,7 / 398,4 Hz, còn (220/330,−12) sidelobe rơi gần target nên bản đo
  lần đầu ghi nhầm là PASS); **n=+12 AM 0,36–0,47** (4 điểm: 220/330/550/660).

### 1.3 Flake (không ổn định giữa các repeat — cần theo dõi, chưa kết luận)

- Harmonic (550,+7): **fail ở repeat 1 của CẢ HAI lần chạy headed** (15:24Z
  và 15:37Z: band peak 699,6 Hz, errSt −2,83; toàn phổ peak 549,9 Hz =
  f0 gốc — lần render đó output trội ở f0 gốc, tức shift không ăn), **pass
  ở repeat 2 của cả hai lần** (band + toàn phổ đều errSt +0,01). Mẫu hệ
  thống repeat-1-fail / repeat-2-pass (không phải ngẫu nhiên rời rạc) —
  nghi worklet warmup/JIT ở lần render đầu của page (chưa xác minh được
  nguyên nhân trong đợt này; P4-196 + đợt sau theo dõi, đặc biệt kiểm xem
  repeat 1 có khác repeat 2 ở điểm nào trong page-measure/cdp-driver).
- Sine (220,+1): band errSt −0,93 ở repeat 1 lần chạy 15:24Z, pass cả hai
  thước ở 3 repeat còn lại (15:24Z r2, 15:37Z r1+r2) — flake rời rạc, 1/4
  repeat.

### 1.4 Telephone — ĐẠT bar, không hồi quy

Max |Δ| = **1,78 dB @100 Hz** — khớp y hệt đợt 193/194/195 từng số
(100 Hz −1,78; 200 +0,06; 300 +1,38; 440 +0,22; 700 −1,18; 1000 −1,47;
2000 −0,40; 3400 +1,38; 5000 +0,06). Telephone không chạm code đợt này.

### 1.5 Latency + voice thật headed

- Burst 440 Hz: bypass onset 0 ms; **pitch onset 40 ms** (LAG worklet
  2048 mẫu = 42,7 ms, theo thiết kế — bằng trễ trung bình W/2 ≈ 40 ms của
  shifter cũ, không hồi quy thực chất); xcorr lag pitch+12 41–55 ms,
  pitch−12 40 ms, pitch+1 98,5 ms (xcorr trên burst đã dịch tần không phải
  đo trễ thuần — ghi nhận, không dùng làm verdict).
- Voice thật (wav giọng nữ miền Bắc 3,64 s, 24 kHz → 48 kHz, chỉ dùng đo):
  bypass rms −21,14 dB; pitch+7 −24,19 dB, onsetDelta 10 ms; pitch−7
  −22,16 dB, onsetDelta 10 ms; tel+pitch+7 −27,20 dB, onsetDelta 50 ms;
  telephone −26,91 dB; robot −21,14 dB. (rmsDb chỉ đo mức, không phải
  verdict cao độ — cao độ voice thật đo bằng track ở §2.)

## 2. Node sim — core offline + worklet (kiểm chéo headed)

### 2.1 Core offline (`psola.ts`) — lưới harmonic + voice thật

- Lưới harmonic 40 điểm: **band 39/40 thô → 35/40 đã sửa** (5 điểm
  n = −12 fail do lock — 4 điểm "pass" thô là sidelobe, xem F-196-P1-3);
  **AM 40/40 (tệ nhất 0,319)**. Lưới sine: core KHÔNG dịch được sine thuần
  (đỉnh trội vẫn ở f0 gốc, vd 440/−12 → 440,4 Hz) — xem §4.
- Voice thật (median tỉ lệ f0 từng khung khớp, cả hai đều voiced conf ≥ 0,7):
  n=−7: 0,672 (kỳ vọng 0,667, **errSt +0,11**); n=+7: 1,506 (+0,09);
  n=+12: 2,006 (+0,05) — **cả ba trong bar**; **n=−12: 1,008 (kỳ vọng 0,500,
  errSt +12,14) — KHÔNG dịch** (xem §5). AM toàn clip 0,899 → 0,84–0,90
  (AM này là envelope âm tiết của lời nói, không phải artifact — so sánh
  in/out ≈ nhau mới có ý nghĩa; xem §5).
- Voice-like quét f0 180→260 Hz: track theo đúng (180,7 → 257,6 Hz).

### 2.2 Worklet trong Node (stub AudioWorklet, ratio qua processorOptions)

- Lưới harmonic 40 điểm: **band 39/40 thô** (chỉ (550,−12) fail eB 2,89 —
  4 điểm −12 còn lại "pass" band bằng sidelobe, xem F-196-P1-3;
  **đã sửa thành 35/40**); **toàn phổ 30/40** (5× −12 lock + 5× −7 hài 2
  ≈ hài cơ bản — giống headed 29–30/40); **AM 39/40 (chỉ (220,−1) 0,37)**
  — khớp headed từng điểm fail (band). Toàn phổ Node worklet (chẩn đoán
  /tmp/diag-wk-m12.mjs, /tmp/diag-mag.mjs — script /tmp sẽ mất khi reboot,
  số đã ghi vào file này): đỉnh trội ở f0 gốc tại cả 5 điểm −12; tại −7,
  hài cơ bản ≈ hài 2 (tỉ lệ 0,98–1,02).
- Lưới sine 40 điểm (chạy lại Node worklet với cả hai thước,
  /tmp/grid-wide.mjs): **band 37/40 thô** ((440/550/660,−12) fail eB
  3,13/3,18/3,86; (220/330,−12) "pass" bằng sidelobe — **đã sửa thành
  35/40**); **toàn phổ 34/40** (5× −12 lock + (550,−7) eW 12,00 — sideband
  AM ở 2×target trội hơn hài cơ bản ở điểm này trong Node; headed không
  fail điểm này — dao động ở ngưỡng); **AM 36/40** (4 điểm +12: 0,40 /
  0,47 / 0,36 / 0,37 — khớp headed y hệt).

## 3. Thiết kế đã triển khai

- **`apps/web/src/lib/psola.ts`** (mới, thuần TS, không import): TD-PSOLA
  offline giữ nguyên thời lượng — decimate x6 (48k→8k, MA-12 chống alias)
  → tự tương quan chuẩn hoá khung 512 mẫu @8k, hop 128, nội suy parabol →
  chu kỳ T(t) + độ tin cậy → mark bước theo T(t), neo đỉnh |trung bình
  trượt T/2| trong ±T/4 → hạt Hann dài **T0+T_s** (T0 = chu kỳ phân tích,
  T_s = chu kỳ tổng hợp) quanh mark gần nhất → OLA + chuẩn hoá tổng cửa sổ
  (sàn 0,5). Độ dài hạt T0+T_s là điểm mấu chốt (xem §4).
- **`apps/web/src/lib/psolaWorkletSource.ts`** (mới): processor streaming,
  cùng toán hạt với core — ring input 16k, decimate x6 + ước lượng chu kỳ
  mỗi 1024 mẫu vào, mark phân tích bước theo T hiện tại, hạt tổng hợp cách
  nhau T/r, bộ tích OLA + chuẩn hoá, **LAG cố định 2048 mẫu (~43 ms)** để
  có lookahead đặt hạt, passthrough khô + crossfade 128 mẫu lúc warmup.
  Tỉ lệ mở đầu qua `processorOptions` (xem F-196-P1-1).
- **`apps/web/src/lib/previewVoiceFx.ts`**: `createVoiceChain` thêm cổng
  `psolaOut` (gain 0) nối sẵn vào robotIn; `upgradePitchToPsola(initialRatio?)`
  (async, fail-soft → giữ shifter 2-delay cũ); `setParams` định tuyến pitch
  theo `psolaActive` (PSOLA bật: dry tắt, đường cũ câm, tỉ lệ gửi qua port;
  PSOLA tắt: hành vi cũ y hệt); `resetPitchState()` (sau seek); `dispose()`
  ngắt worklet + revoke Blob URL.
- **`apps/web/src/lib/audioEngine.ts`**: sau `createVoiceChain`, gọi
  `upgradePitchToPsola()` fire-and-forget (thất bại → giữ đường cũ).
- **Shifter 2-delay cũ GIỮ NGUYÊN** làm fallback (không xoá code, không đổi
  hằng số W = 0,08 / SAW_GAIN_COMP / TELEPHONE_WET_GAIN_COMP).

## 4. Vì sao PSOLA triệt được AM — và nghịch lý sine

- Shifter cũ: cửa sổ cố định W → frac(f0·W) đổi theo f0 → răng lược lệch
  pha theo f0 → AM tới 0,72 ở 440 Hz. PSOLA đặt cửa sổ đồng bộ theo chu kỳ
  thật nên không còn frac(f0·W).
- Hạt dài T0+T_s (thay vì 2·T0 cổ điển hay 2·T_s): khi hạ cao độ, hạt vẫn
  chồng lấn ≥ T0 → tổng Hann không chạm 0 → envelope phẳng; đồng thời hạt
  chứa xung ở ±T0 với trọng số Hann ~0,25 — đủ để xung chính ở mark trội
  (tỉ lệ ~3×) và đỉnh phổ rơi đúng f0/r. Cửa sổ 2·T_s (bản đầu) cho AM tốt
  nhưng ở tỉ lệ nguyên (r = 0,5) hạt toàn pha với nhau → trả đúng tín hiệu
  gốc, không dịch (voice thật n=−12 đo được tỉ lệ 1,026).
- **Lock tỉ lệ nguyên r = 0,5 (ĐÃ CHỨNG MINH, không còn là giả thuyết):**
  ở r = 0,5, mark tổng hợp cách nhau T_s = 2T0, hạt dài L = T0+T_s = 3T0
  chứa 5 xung với trọng số Hann [0,25, 0,75, 1,0, 0,75, 0,25]; OLA cộng
  các hạt kề (cách 2T0) cho mọi xung đều trọng số 1,5 như nhau → chuỗi
  xung output Y HỆT input → output = input. Bằng chứng: phổ toàn band
  output (550,−12) harmonic có đỉnh trội 549,9 Hz, độ lớn 29.964 — bằng
  passthrough (29.712); độ lớn tại target 275 Hz KHÔNG có trong top 8
  (toàn < 235); độ lớn tại target 110 Hz ở (220,−12) chỉ 35 so với 29.433
  tại f0 gốc. Cả core lẫn worklet, cả harmonic lẫn sine, cả 5 f0 đều
  lock — đây là tính chất của TD-PSOLA với cửa sổ đối xứng ở tỉ lệ
  nguyên, không phải bug implement.
- **Hài 2 trội bằng hài cơ bản ở n = −7 (ghi chú âm sắc, không phải lỗi
  cao độ):** tại r = 0,667, độ lớn hài cơ bản ≈ hài 2 (tỉ lệ 0,98–1,02 —
  xem §1.1); ở các tỉ lệ khác tỉ lệ này là 1,80 (n=−5), 9,49 (n=−1),
  6,08 (n=+7). Cao độ cảm nhận vẫn đúng target vì chuỗi hài cách nhau
  đúng f0 mục tiêu (hiện tượng "missing fundamental" — tai nghe cao độ
  từ khoảng cách hài). Không cần sửa cho cao độ; chỉ ghi nhận cho P1-197
  nếu muốn cải thiện âm sắc (vd cửa sổ hạt dài hơn ở r < 1 làm hài cơ
  bản trội hơn).
- **Nghịch lý sine:** core offline KHÔNG dịch được sine thuần (đỉnh trội
  vẫn ở f0 gốc — chứng minh: hạt sine toàn pha với nhau, OLA cho lại đúng
  sine gốc; PSOLA cần cấu trúc chu kỳ — xung glottal / hài — để tái định
  thời). Nhưng **worklet streaming LẠI dịch được sine (headed band 35/40)**:
  mark đặt tăng dần với chu kỳ ước lượng có sai số nhỏ + mark nguyên mẫu
  làm lệch pha giữa các hạt trôi chậm, phá vỡ khoá pha tuyệt đối → tốc độ
  đặt hạt (1/T_s) chi phối, năng lượng rơi vào tần số mục tiêu. Đây là kết
  quả đo thực nghiệm, cơ chế chưa chứng minh đầy đủ bằng toán — ghi nhận
  trung thực, không khẳng định quá. Hệ quả thực hành: đường ship (worklet)
  là verdict; core offline dùng cho render-side sau này PHẢI kiểm lại trên
  sine (nợ P1-197) — không được mặc định core = worklet trên mọi tín hiệu.

## 5. Còn fail / nợ — hướng sửa đợt sau (KHÔNG giấu)

1. **Cả 5 điểm n = −12 (harmonic + sine): output = input (lock tỉ lệ
   nguyên, §4).** Không phải chỉ (550,−12) như bản đo lần đầu tưởng —
   cả 5 f0 đều lock, chỉ khác ở chỗ sidelobe trong band tìm rơi gần hay xa
   target nên thước band cũ ghi nhầm 4/5 là PASS. Hướng sửa P1-197: phá
   vỡ khoá pha tuyệt đối ở tỉ lệ nguyên — dither pha mark (dịch mark phân
   tích xen kẽ ±T0/4 ở r nguyên), hoặc cửa sổ hạt bất đối xứng, hoặc hạt
   dài hơn ở r < 1; đo lại bằng CẢ HAI thước (band + toàn phổ). Đây là
   việc lớn nhất còn lại của PSOLA.
2. **Voice thật n=−12: track đọc tỉ lệ 1,008 (không dịch) — ĐÃ GIẢI
   THÍCH: cùng lock tỉ lệ nguyên (§4), không phải artifact đọc track.**
   Không còn nợ chẩn đoán; nợ sửa là mục (1) trên. (Đo lại bằng đỉnh phổ
   trên đoạn nguyên âm giữ sau khi sửa lock — P1-197.)
3. **(220,−1) harmonic AM 0,37** — vượt bar 0,02. Hướng: kiểm mark jitter
   ở f0 thấp (T dài, cửa sổ làm mịn T/2 dài theo) + thử hạt dài hơn ở |n| nhỏ.
4. **n=+12 sine AM 0,36–0,47** (4 điểm). Hướng: như (1), hạt dài hơn khi r > 1.
5. **Flake (550,+7) harmonic — hệ thống, không phải ngẫu nhiên rời rạc:**
   fail ở repeat 1 của CẢ HAI lần chạy headed (15:24Z, 15:37Z), pass ở
   repeat 2 của cả hai lần. Theo dõi đợt sau; nếu lặp lại thì chẩn đoán
   worklet warmup/JIT hoặc trạng thái dùng chung giữa các render trong
   page. Flake (220,+1) sine: 1/4 repeat (chỉ 15:24Z r1).
6. **(c) Render vẫn rubberband** — thống nhất render sang PSOLA (bước
   pre-process Node dùng `psola.ts` trong audioroute) là việc P1-197; P4-196
   kiểm parity pitch PHẢI dùng fixture harmonic (sine không còn là thước đo
   duy nhất — worklet và rubberband khác nhau về bản chất trên sine).
7. Latency pitch +40 ms (LAG theo thiết kế) — chấp nhận được (bằng trễ cũ),
   nhưng nếu muốn giảm thì LAG thích ứng theo T (hiện cố định 2048 mẫu).
8. Firefox/WebKit: chưa đo đợt này (như đợt 195).

## 6. Hai bug nghiêm trọng tìm được trong đợt (đã sửa, có bằng chứng)

### F-196-P1-1 — Port message không tới worklet trong OfflineAudioContext

- Triệu chứng (đo headed lần 1): output ≈ input ở mọi n (peak = f0 gốc ở
  ±1; AM hằng theo f0, không đổi theo n); riêng n=+12 "đạt" là ẢO — đỉnh
  đo được là hài 2 của input (2×f0) nằm trong band tìm [1,6×f0, 2,5×f0].
  Harmonic errSt chỉ 6/40, AM 16/40.
- Nguyên nhân: tỉ lệ chỉ gửi qua `port.postMessage` trước `startRendering`;
  worklet thread render offline back-to-back không nhường cho message queue
  nên message chỉ được xử lý sau khi render xong → cả clip chạy với ratio=1.
- Sửa: tỉ lệ mở đầu qua `processorOptions` lúc tạo `AudioWorkletNode`
  (đồng bộ); port chỉ dùng cho đổi tỉ lệ runtime (preview thật, message xen
  kẽ được). Đo headed lần 2: harmonic errSt (band) 38–39/40, AM 39/40
  (số band này sau đó được sửa thành 35/40 bởi F-196-P1-3 — xem §6).

### F-196-P1-2 — Vòng đặt hạt chạy trước input (synthesis runaway)

- Triệu chứng (đo Node worklet): AM 0,43–0,86 (core chỉ 0,10–0,32), block
  RMS ~0,008–0,02 thành cụm; tương quan với output core chỉ −0,15.
- Nguyên nhân: vòng `placeGrains` chỉ dừng khi `a+L > inPos`; khi mark gần
  nhất đã cũ (stale, `s` chạy trước mark) thì điều kiện luôn đúng → vòng
  đặt 64 hạt/call, `nextSynth` chạy trước `inPos` tới **6000 mẫu**, hạt đặt
  từ mark cũ hàng nghìn mẫu → sai pha hoàn toàn → triệt tiêu lẫn nhau.
- Sửa: chặn `s > lastMark + T/2` thì dừng đặt hạt, chờ mark mới. Sau sửa:
  Node AM 0,10–0,37, dips biến mất (rmsMin 0,196 so với 0,016 trước sửa).

### F-196-P1-3 — Thước đo band hẹp báo sidelobe thành cao độ đã dịch (lỗi thước đo, đã sửa)

- Triệu chứng: đo headed lần 2 (15:24Z) ghi harmonic errSt 38–39/40 —
  chỉ (550,−12) fail. Nhưng chẩn đoán phổ toàn band trên output Node
  worklet cho thấy ở cả 5 điểm n = −12, đỉnh trội là f0 gốc (độ lớn
  ~29.000) và KHÔNG có thành phần nào ở target trong top 6; độ lớn tại
  target chỉ 35 (0,1%). Tức 4/5 điểm −12 "PASS" là sidelobe của cửa sổ
  Hann trong band tìm [0,8×target, 1,25×target] — thước band không phân
  biệt được "có thành phần mạnh ở target" với "có sidelobe yếu lọt vào
  band" vì nó chỉ tìm max TRONG band mà không so với ngoài band.
- Sửa thước đo (không sửa code sản phẩm): `page-measure.mjs` thêm
  `peakWide`/`errStWide` = đỉnh trội toàn phổ [50, 3000] Hz cho cả ba
  lưới (pitch24, pitchCurve, harmonicCurve). Đo headed lần 3 (15:37Z):
  harmonic band 35/40, toàn phổ 29–30/40; sine band 35/40, toàn phổ
  35/40. Số ĐÃ SỬA trong file này là số lần 3; số lần 2 (38–39/40) chỉ
  giữ trong file JSON làm bằng chứng lỗi thước đo. Bài học: với PSOLA
  (output có thể giữ nguyên f0 gốc), thước band hẹp là KHÔNG ĐỦ — từ nay
  mọi lưới pitch PHẢI báo cả hai thước. Thước band cũ vẫn giữ làm thước
  chính cho "cao độ có mặt không" (vì toàn phổ quá chặt ở n = −7 — xem
  §1.1), nhưng không được dùng một mình nữa.

- **Nhảy quãng 8 (octave):** harmonic 550 Hz cho R(2T)=0,9416 > R(T)=0,9292
  → track đọc chu kỳ 174,4 mẫu (275 Hz) thay vì 87,3. Sửa: lấy lag NHỎ NHẤT
  có R ≥ 0,9×max rồi leo lên đỉnh cục bộ (quy tắc chuẩn kiểu YIN).
- **Decimate x6 trượt sai:** bản đầu cộng/trừ 1 mẫu mỗi bước thay vì 6 mẫu
  (cửa sổ [6d, 6d+11] → thêm [6d+6, 6d+11], bớt [6d−6, 6d−1]) — tín hiệu
  decimate ra bậc thang, 440/−12 fail errSt 2,91. Đã sửa + kiểm lại.
- **Nội suy parabol quanh điểm chưa phải đỉnh:** điểm vượt ngưỡng 0,9×max có
  thể sớm hơn đỉnh thật vài lag (sine 440 Hz đọc thành chu kỳ 102 thay vì
  109,1). Sửa: leo lên đỉnh cục bộ trước khi nội suy (cả core lẫn worklet).
- **Import thiếu `.ts`:** `previewVoiceFx.ts` import `./psolaWorkletSource`
  (không đuôi) → Node strip-types ERR_MODULE_NOT_FOUND; sửa thành
  `./psolaWorkletSource.ts` (quy ước repo).

## 7. Kiểm chứng sau đo

- `npx tsc --noEmit` (apps/web) → **0 lỗi**.
- `psola.test.ts` → **12 pass, 0 fail** (mới: chu kỳ, chống quãng 8, quét
  f0, passthrough ratio 1, giữ độ dài, 5 điểm harmonic, AM bar, sine không
  dịch ở core).
- `previewVoiceFx.test.ts` → **27 pass, 0 fail**;
  `audioEngineVoiceFx.test.ts` → **8 pass, 0 fail**;
  `bash apps/web/scripts/test-audioengine.sh` → **56 pass, 0 fail**.
- Đo headed lặp 2 lần: telephone KHỚP Y HỆT; harmonic chỉ khác 1 điểm flake
  (550,+7); sine chỉ khác 1 điểm flake (220,+1). Node sim chạy 2 lần sau
  các sửa cuối: lưới harmonic/worklet IDENTICAL (deterministic).
- **Kỷ luật pha đo yên:** kiểm `poll-t4.log` trước/sau MỌI lần đo nặng.
  Poll #37–#38 (trước headed lần 1), #54–#55 (trước headed lần 2),
  #59–#60 (sau headed lần 2), #71 (trước headed lần 3, 15:34Z),
  #74 (sau headed lần 3, 15:36Z) đều `lock=khong`; `vite-lock-v2.log` chỉ có
  ACQUIRED của t01-round196 (14:43–14:48Z), **T4-196 KHÔNG mở attempt nào
  trong suốt cửa sổ đo của P1** (14:43–15:37Z). **0 lần đo nặng chồng pha
  (b) T4.**
- Hạ tầng đo: `hidden_files/round196-p1/` (sim-psola-196.json,
  sim-psola2-196.json, chrome-2026-11-26T15-12-09-357Z.json (lần 1, bản
  lỗi F-196-P1-1 — giữ làm bằng chứng), chrome-2026-11-26T15-24-58-292Z.json
  (lần 2, thước band cũ — số cao độ đã sửa lại, xem F-196-P1-3),
  chrome-2026-11-26T15-37-35-791Z.json (lần 3, verdict — có peakWide),
  harness/ 8 file + ref.wav 48 kHz (fixture đo, không
  stage), preview-voice-*.wav (scratch, không stage)). /tmp sẽ mất khi
  reboot — JSON trong hidden_files là bản lưu bền. Script chẩn đoán
  /tmp/diag-*.mjs (phổ toàn band, độ lớn tại target) là scratch — các số
  đã ghi vào LIMITS này, không cần giữ script.

## 8. File đổi (stage trong paths-loop)

- `apps/web/src/lib/psola.ts` — core TD-PSOLA offline (mới).
- `apps/web/src/lib/psola.test.ts` — test core (mới).
- `apps/web/src/lib/psolaWorkletSource.ts` — processor worklet (mới).
- `apps/web/src/lib/previewVoiceFx.ts` — upgrade PSOLA + định tuyến setParams.
- `apps/web/src/lib/audioEngine.ts` — gọi upgrade fire-and-forget.
- `docs/PHASE9_ROUND196_P1_VOICEFX_LIMITS.md` — file này.

**KHÔNG đổi:** hằng số voicefx (W / SAW_GAIN_COMP / TELEPHONE_WET_GAIN_COMP),
`audio.ts` (video-spec), render (`server/render/src/voicefx.js` vẫn
rubberband — xem §5.6), `preview.tsx`, GAP, aggregate (việc của T10),
MEMORY.md, build-loop-log.md. **Không chạm file chung nào khác — không có
xung đột để T10 phải kiểm.** Script đo + fixture chỉ nằm ở hidden_files,
KHÔNG stage vào repo (theo tiền lệ 193/194/195).
