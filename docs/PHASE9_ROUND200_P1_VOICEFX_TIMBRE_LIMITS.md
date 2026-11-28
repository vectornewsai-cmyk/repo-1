# LIMITS — Đợt 200 P1: VoiceFX — timbre hài 3 trội ở −12 trên giọng nói thật

- Đợt: 200, luồng P1 (Editing Core — preview/render parity, đợt thứ 10 theo hướng mới 25/11).
- Ngày: 27/11/2026. Hạn cờ ~14:00Z, hạn cứng 14:35:51Z. Đóng ~12:05Z.
- Nhiệm vụ (quyết (a2)/(a4)-(iii) §14.2-199): trên giọng nói thật, so fallback
  (2-delay) vs two-stage ở −12 — đo domFreq/tỉ số mag, cao độ autocorr, render
  mẫu A/B — hài 3 trội (495/825 Hz) có chấp nhận được cho sản phẩm không?
  Kết luận flip/giữ cờ `PSOLA_MINUS12_USE_FALLBACK` kèm số đo thật.
- **Kết luận ngắn: GIỮ cờ (KHÔNG FLIP). Hài 3 trội là THẬT trên giọng nói và
  LỚN: two-stage nâng H3 so với H1 trung vị +13–15 dB (fallback chỉ +1,5 dB),
  đảo cân bằng H1/H3 trên 21% (core) / 41% (worklet) khung voiced, so với 12%
  ở giọng gốc và 14% ở fallback. Thêm nữa, đường preview (worklet — đúng đường
  cờ điều khiển) lệch cao độ nặng trên giọng chạy (|errSt| trung vị 2,08 st,
  chỉ 77/243 khung đo được f0), trong khi core chỉ 0,134 st và fallback 0,235 st.
  Fallback giữ cân bằng hài + cao độ ổn định hơn trên giọng thật; giá của nó
  (tối tiếng, centroid −556 Hz) nhỏ hơn giá của two-stage ở −12.**

## 1. Nội dung thật — 3 giọng TTS local (VieNeu v3 Turbo 0.5B, Apache-2.0)

- Cùng một câu tiếng Việt 146 ký tự ("Xin chào các bạn, đây là video hướng
  dẫn dựng phim bằng VCut Studio. Âm thanh trong trẻo, hình ảnh sắc nét,
  chuyển cảnh mượt mà như phim điện ảnh."), 3 giọng preset:
  Hải Đăng (nam, 7,84 s), Mai Anh (nữ, 8,88 s), Quang Sơn (nam Trung, 10,16 s).
  Tổng 26,88 s giọng nói thật (ngữ điệu, thanh điệu, phụ âm — không phải sine).
- f0 trung vị khung voiced: Hải Đăng 185,6 Hz; Mai Anh 199,7 Hz; Quang Sơn
  145,1 Hz — 3 vùng f0 khác nhau; đích −12 tương ứng 93/100/73 Hz.
- TTS chạy local bằng `server/tts/tts.py` (venv `.venv2`), mỗi clip 23–51 s tổng
  hợp; watermark tắt (`apply_watermark=False`, đúng TTS_LIMITS.md).

## 2. Phương pháp — khung 100 ms trong lòng đoạn voiced + đối chứng

- **Hai đường ở −12 trên cùng tín hiệu:** (a) two-stage preview = code worklet
  THẬT (`PSOLA_WORKLET_SOURCE`), 2 node nối tiếp r1 = √0,5, chạy từng block
  128 mẫu trong Node (đúng như `ratio-stuck-199.mjs`); (b) fallback = sim
  waveform trung thực graph 2-delay trong `previewVoiceFx.ts` (W = 0,08 s,
  delay gốc W/2, saw LFO f = |r−1|/W = 6,25 Hz, xfade cos, SAW_GAIN_COMP bù
  chuẩn hoá PeriodicWave); (c) core `psolaPitchShift` (đường render) để đối
  chiếu worklet-vs-core.
- **Kiểm chứng sim fallback trên sine trước khi dùng:** 440/−12 → band 215,0 Hz
  (−0,40 st), AM 0,525 — KHỚP Chrome P1-192 (213,9–215,0 Hz, −0,40 st;
  AM 0,33–0,51; N2a 0,534). 220/−12 sim cho −0,40 st (khác claim +1,51 st của
  P1-192 — lúc đó W = 0,04 s, đợt 193 mới đổi 0,08 s; sim dùng hằng số code
  HIỆN TẠI và khớp đúng điểm 440 nên được tin cho so sánh A/B).
- **Kiểm chứng two-stage trên sine:** worklet 110,4/165,4/220,3/275,3/330,5 Hz
  (errSt 0,02–0,06); core 330 → 165,3 — khớp P1-199, xem §6.
- **Đo giọng thật theo khung 100 ms / hop 50 ms, chỉ khung voiced trong lòng
  đoạn** (khung ±50 ms cũng voiced — tránh biên âm tiết; 243 khung gộp 3 clip).
  Căn cục bộ ±15 ms quanh lag cấu trúc (fallback +40 ms = W/2, đo được trung
  vị 38–41 ms; two-stage/core 0 ms, đo được 2–3 ms). f0 bằng autocorr
  (`estimatePeriodFrame` thật); f0 out đo trong dải hẹp quanh đích
  (0,7–1,4 × f0t) để triệt nhảy quãng 8 — vẫn bắt được lệch thật tới ±6 st.
  H1/H2/H3 bằng Goertzel tại k×f0; domFreq bằng FFT Hann; AM 5 ms + điều chế
  bao hình ở 6,25 Hz (= fLFO fallback ở −12).
- **Bài học phương pháp (ghi trung thực):** bản đo đầu (khung trượt + xcorr toàn
  cục) SAI — xcorr toàn cục trên giọng chạy cho lag vô nghĩa ở two-stage
  (76–117 ms, PSOLA tái tổng hợp nên xcorr phẳng), khung lệch âm tiết →
  errSt tới 48 st; AM toàn clip ≈ 0,95 chỉ là động thái giọng nói. Bản đo
  thứ hai (nhân 300 ms ổn định) cho 0 nhân — tiếng Việt không có đoạn 300 ms
  ổn định (thanh điệu lướt f0 trung vị 3–4 st/300 ms, dB range 10–17 dB).
  Bản 3 (khung 100 ms + căn cục bộ) mới là số trong LIMITS này; 2 bản sai
  lưu tại `scratch/timbre200.mjs` + `timbre200b.mjs` (không dùng số của chúng).

## 3. Kết quả giọng thật — 243 khung voiced (gộp 3 clip)

| Thước (trung vị, trừ khi ghi khác) | Fallback 2-delay | Two-stage worklet (preview) | Two-stage core (render) |
|---|---|---|---|
| errSt có dấu (st) | −0,034 | +1,076 | +0,072 |
| \|errSt\| trung vị / p90 / max (st) | 0,235 / 0,904 / 2,840 | 2,081 / 4,930 / 6,173 | 0,134 / 0,826 / 5,897 |
| Khung \|errSt\| > 0,1 st | 167/231 | 75/77 | 82/141 |
| Khung đo được f0 out (conf ≥ 0,5) | 231/243 (95%) | 77/243 (32%) | 141/243 (58%) |
| confOut trung vị | 0,76 | 0,33 | 0,55 |
| H3−H1 đầu ra (dB) | −15,4 (gốc −16,0) | −1,6 | −3,5 |
| dH3 = (H3−H1)ra − (H3−H1)vào (dB) | +1,5 | +14,5 | +12,9 |
| \|dH3\| p90 / max (dB) | 11,9 / 31,0 | 34,3 / 67,2 | 30,5 / 51,2 |
| Khung H3 > H1 (gốc: 28/243 = 12%) | 33/243 (14%) | 100/243 (41%) | 52/243 (21%) |
| domFreq k=1 / k=3 / khác | 136 / 20 / 87 | 30 / 14 / 199 | 91 / 10 / 142 |
| Centroid shift (Hz) | −556 | +83 | −172 |
| AM 5 ms khung | 0,711 | 0,704 | 0,681 |
| Tỉ số RMS ra/vào | 0,88 | 0,80 | 0,81 |

- **Theo clip (dH3 trung vị):** Hải Đăng fb +1,3 / ts +15,8 / core +12,2;
  Mai Anh +1,3 / +17,1 / +15,8; Quang Sơn +2,6 / +10,4 / +7,8.
  H3>H1: Mai Anh gốc 3/116 → ts 38/116, core 14/116, fb 2/116 — rõ nhất
  ở giọng nữ (f0 cao, đích ~100 Hz).
- **Điều chế bao hình ở 6,25 Hz (19 cửa sổ 1 s voiced):** gốc 0,211; fb 0,192;
  ts 0,251; core 0,245 — KHÔNG đường nào vượt trội. Tremolo 6,25 Hz của
  fallback (đo rõ trên sine) KHÔNG tách được khỏi điều chế âm tiết tự nhiên
  (~0,2) trên giọng chạy — không phải điểm phân biệt ở đây.
- **Đọc kết quả:** (1) Hai bản two-stage ÁP ĐẶT chữ ký H3 của riêng chúng
  (H3−H1 ≈ −2 dB) lên mọi khung — trên sine chữ ký này là −2,5…−3,6 dB
  (xem §6), trên giọng thật nó chôn luôn cân bằng tự nhiên −16 dB.
  (2) Fallback gần như giữ nguyên cân bằng hài của giọng gốc.
  (3) Worklet lệch cao độ có hệ thống (+1,08 st trung vị, tới +5,9 st ở
  đoạn thanh điệu rơi — xem §4) và mất tính tuần hoàn (conf 0,33).
  (4) Fallback tối tiếng (centroid −556 Hz) — giá thật nhưng nhỏ hơn.

## 4. Vì sao worklet lệch cao độ trên giọng chạy (cơ chế, đọc code thật)

- Worklet (`psolaWorkletSource.ts`): ước lượng chu kỳ mỗi 16 ms trên 64 ms
  decimate gần nhất, làm mượt `period = 0,5×cũ + 0,5×mới`, và — quan trọng —
  **cập nhật period BẤT KỂ confidence** (confidence chỉ lưu, không gate).
  Core (`psola.ts`): track offline toàn clip + trung vị 3 khung + khung
  unvoiced dùng chu kỳ mặc định. Trên giọng chạy (phụ âm, khoảng lặng,
  thanh điệu rơi), estimator streaming của worklet chạy theo nhiễu/formant
  rồi đặt mark sai — tầng 2 cascade đọc tín hiệu đã smeared nên càng tệ.
- Bằng chứng từng khung (Mai Anh): t=0,20 f0in 275 → ts 193 Hz (+5,86 st,
  conf 0,57), core 144 (+0,80), fb 143 (+0,73); t=1,50–1,65 ts +2,15…
  +2,79 st liên tục trong khi core/fb trong ±0,8 st; đoạn ổn định t=1,95–
  2,05 ts lại đúng (0,13–0,88 st, conf 0,84–0,90) — worklet tốt từng đoạn,
  xấu từng đoạn, đúng mẫu streaming-lag trên thanh điệu rơi.
- **Không phải lỗi harness:** cùng harness này cho sine đúng từng số (§2) và
  cho nguyên âm ổn định worklet == core (errSt ≤ 0,03 st, §5). Harness trung
  thực; khác biệt là hành vi thật của code worklet trên giọng chạy.
- **Giới hạn fMin = 80 Hz (cả hai bản):** estimator chỉ tìm chu kỳ tới 80 Hz.
  Ở −12, giọng nam f0 < 160 Hz cho đích < 80 Hz — ngoài tầm track. Đối chứng
  nguyên âm f0 = 110 Hz (đích 55 Hz): ts +4,83 st (conf 0,07), core −0,98 st
  (conf 0,35) — cả hai đều hỏng, worklet hỏng nặng hơn. Giọng Quang Sơn
  (f0 trung vị 145 Hz, đích 73 Hz) nằm đúng vùng này.

## 5. Đối chứng nguyên âm ổn định TỔNG HỢP (ghi rõ synthetic — chỉ tách cơ chế)

- Nguyên âm /a/ (chuỗi hài + formant F1 730/F2 1090/F3 2440 Hz), f0 =
  110/165/220/275 Hz, 2 s, đo giữa [0,5; 1,5] s.
- Đích ≥ 80 Hz (f0 = 165/220/275): worklet == core — errSt −0,001/+0,026/
  +0,019 st, conf 0,77–0,98; fallback cũng đúng (−0,006…+0,006 st, conf
  0,91–0,99). Hai bản PSOLA tương đương trên tín hiệu ổn định.
- Đích 55 Hz (f0 = 110): cả hai hỏng (xem §4).
- envMod@6,25 Hz ≈ 0,001–0,008 ở MỌI đường (kể cả gốc 0,000) — không tremolo
  nào đo được trên nguyên âm ổn định; AM 5 ms: fb 0,14–0,40 vs ts/core
  0,13–0,23 (fallback cao hơn, không áp đảo).
- domFreq trên nguyên âm rơi vào formant đã dịch (k = 4–14) ở MỌI đường —
  domFreq KHÔNG phải thước cao độ trên nội dung có formant; thước parent
  (autocorr + wide trên sine) vẫn là thước đúng. Không dùng số domFreq
  nguyên âm để kết luận gì về cao độ.

## 6. Đối chiếu P4-199 (domFreq 495/825 Hz) — không tái hiện được, nhưng lo ngại là thật

- Chạy lại đúng input + cửa sổ của `psolaShiftSim` (sine 0,7 s, đo [0,2; 0,7] s):
  330/−12 → **165,3 Hz**, 550/−12 → **275,3 Hz** — đúng đích, KHÔNG phải
  495/825. Ba cách độc lập trên code hiện tại đều cho đúng đích: worklet
  cascade (165,4/275,3), core (165,3/275,3), cửa sổ P4 (165,3/275,3) — khớp
  cả P1-199 (110,3/165,3/220,2/275,2/330,3). T10/P4-200 nên kiểm lại hàm
  `spectralPeak` Goertzel-scan của harness (không cửa sổ Hann) — P4-198
  `m12-baseline.log` tự nó đã ghi peakT = 165,1/275,0 Hz (đúng đích) trong
  khi mag3T (0,228) > magT (0,198).
- **Nhưng H3 nâng là thật:** Goertzel trên cửa sổ P4 — 330/−12: H1/H2/H3 =
  0,457/0,208/0,302 (H3/H1 = −3,6 dB); 550/−12: 0,463/0,218/0,347 (−2,5 dB).
  Sine thuần KHÔNG có H3 — toàn bộ H3 này là méo do two-stage tạo ra, chỉ
  thấp hơn H1 có 2,5–3,6 dB. Trên giọng thật (H3 tự nhiên −16 dB), méo này
  át hẳn cân bằng tự nhiên → đảo H1/H3 (§3). Vậy: **"domFreq = 495" không
  đứng theo thước FFT-Hann, nhưng "hài 3 trội là vấn đề sản phẩm" thì ĐÚNG
  và đã đo được trên giọng thật.** Parent đã quyết đúng khi giao (a4)-(iii)
  cho P1-200 thay vì bác (i)/(ii).

## 7. Vì sao KHÔNG sửa code đợt này + nợ chuyển đợt 201

- H3 là **cấu trúc của two-stage PSOLA** (cả core lẫn worklet đều áp đặt
  H3−H1 ≈ −2 dB) — không phải bug estimator. Sửa được phải đổi cửa sổ hạt /
  tách formant — nghiên cứu riêng, hồi quy toàn bộ suite N12/N2 nếu đổi.
- Sửa estimator worklet (gate confidence + median + mở fMin) chỉ sửa cao độ
  worklet, KHÔNG sửa H3 — flip vẫn không đủ điều kiện sau khi sửa xong phần
  đó. Không sửa nửa vời trong đợt này; ghi nợ P1-201: (1) gate period-update
  bằng confidence + trung vị trượt trong worklet (đo lại trên giọng thật);
  (2) mở fMin xuống ~50 Hz cho đích −12 giọng nam; (3) nghiên cứu triệt H3
  (cửa sổ hạt khác / bù phổ hài).
- Không đổi cờ, không đổi `previewVoiceFx.ts` / `psola.ts` /
  `psolaWorkletSource.ts`, không đổi GAP. Cold-start fix đợt 199 nguyên vẹn
  (test 46/46 gồm 9 test F-198-P1-2 vẫn xanh, §8).

## 8. Kỷ luật đo yên + test

- **0 lần chạy Chrome headed đợt này** (không cần — two-stage đo bằng worklet
  thật trong Node; fallback bằng sim đã kiểm chứng Chrome). TTS 11:39–11:42Z,
  đo Node 11:43–11:50Z, tsc/test 11:51–11:53Z — kiểm `windows.md` lúc
  11:40/11:45/11:47/11:50Z: W1/W2/W3 đều **CHỜ GATE — chưa mở** trong toàn bộ
  thời gian làm việc (poller mở ~11:41Z, gate0 chưa đạt — T56 chưa repair).
  Không ghi file, không chạy tải nặng trong cửa sổ nào (không có cửa sổ nào
  mở). Ghi file chỉ vào `hidden_files/round200-p1/` (thư mục làm việc của
  luồng) + LIMITS + paths.
- `npx tsc --noEmit` (apps/web): **0 lỗi**. Test chạy trực tiếp bằng node
  (các file này là self-runner, không phải suite vitest — vitest báo "No test
  suite found" là đúng định dạng, không phải lỗi): `previewVoiceFx.test.ts`
  **46/46**, `psola.test.ts` **18/18**, `psolaWorklet198.test.ts` **3/3**,
  `audioEngineVoiceFx.test.ts` **8/8**, exit 0. Không chạy `vite build`
  (không đụng render path / không đổi code).
- **Giới hạn trung thực:** không claim nghe bằng tai — đánh giá timbre bằng
  thước hài khách quan trên giọng thật; mẫu A/B (orig/fallback/twostage/core
  × 3 giọng, WAV 48 kHz) đã render để parent/user nghe tại
  `hidden_files/round200-p1/ab/` (binary, không stage). N12a theo thước
  (a4) mới (autocorr + wide) KHÔNG đo lại đợt này — đã ĐẠT ở (a4)-199 và code
  PSOLA không đổi; thước hài ở đây là thước MỚI cho câu hỏi timbre.

## 9. File đổi (stage)

- `docs/PHASE9_ROUND200_P1_VOICEFX_TIMBRE_LIMITS.md` — file này (duy nhất).
- Scratch (không stage): `hidden_files/round200-p1/` — `speech/` (3 WAV TTS
  gốc), `ab/` (12 WAV A/B), `scratch/timbre200{,b,c,d}.mjs` + log,
  `scratch/repro-p4-199.mjs`, `scratch/diag-nuclei.mjs`,
  `timbre200-report.json`, `timbre200-frames.json`,
  `timbre200-nuclei.json`, `timbre200-vowel.json`.
- KHÔNG PUSH. KHÔNG release/tag. Không code giả.
