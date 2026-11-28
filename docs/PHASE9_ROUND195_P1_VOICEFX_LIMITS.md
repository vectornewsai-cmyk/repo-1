# LIMITS — Đợt 195 P1: đường cong trade-off pitch W = 0,08 (sim + headed) + kiểm lại telephone N1
(Editing Core — preview/render parity, đợt thứ 5 theo hướng mới)

- **Luồng:** P1 đợt 195 (Phase 9 VCut). **Ngày:** 26/11/2026.
- **Nhiệm vụ (brief):** (1) map đường cong trade-off pitch ở W = 0,08 —
  đo AM artifact + sai số lượng tử hoá tại 220/330/440/550/660 Hz trên cả
  sim + headed; (2) kiểm lại telephone headed (N1) sau các đổi mới nhất —
  xác nhận vẫn ĐẠT bar ≤2 dB; (3) mọi claim có số đo thật. **KHÔNG đổi
  code sản phẩm** (không phát hiện bug thật — xem §5).
- **Kết quả chung:** đường cong đã map đủ 40 điểm (5 tần số × 8 n) trên cả
  sim lẫn headed. **Sim đoán đúng tần trội ở 40/40 điểm (ΔerrSt = 0,00)**;
  AM thì sim chỉ đúng thứ hạng, sai tuyệt đối tới 0,25 (headed mới là
  thước verdict). Lượng tử hoá ĐẠT ở mọi tần số (tệ nhất 0,40 st ≤ 0,5);
  AM ≤ 0,35 chỉ ĐẠT ở 2/5 tần số (330, 550) — 28/40 điểm. **550 Hz gần
  như hoàn hảo (errSt 0,00 ở cả 8 n, AM tệ nhất 0,15)** vì f0·W = 44,0
  đúng số nguyên; 440 Hz tệ nhất (AM 0,37–0,72) và **660 Hz cũng CHƯA
  ĐẠT (AM tệ nhất 0,58) — mới**. Telephone 9 điểm **khớp y hệt đợt 194
  từng số, max |Δ| 1,78 dB — ĐẠT bar ≤2 dB**. W = 0,08 GIỮ theo (a2)-194;
  PSOLA/AudioWorklet + FFT vẫn là hướng tương lai, không làm đợt này.

## 1. Đường cong trade-off pitch W = 0,08 — 40 điểm, sim + headed

Phương pháp đúng P1-193 §2.2 / P1-194 §1 (render 4 s, cửa sổ [1,0, 3,5)s,
FFT zero-pad 2^18 + nội suy parabol log-mag; AM = (max−min)/(max+min)
của RMS khối 5 ms). Sim = `pitchShifterSim` nguyên văn trong
parityHarness194.ts:1957 (đã kiểm = parityHarness195.ts:1962,
SIM-BODY-IDENTICAL) — hằng số PITCH_WINDOW_S / SAW_GAIN_COMP đọc từ
bundle previewVoiceFx.ts thật; bản 4 s phân tích bằng ĐÚNG hàm
measure.mjs như headed (xem §3). Headed = headless Chrome 158 qua CDP,
bundle esbuild từ cây hiện tại (md5 bundle 1500ed00…, cây md5 591f9655
— cùng cây với đợt 194). fLfo = |r−1|/W: ±12 → 12,5/6,25 Hz; ±7 →
6,229/4,157 Hz; ±5 → 4,185/3,136 Hz; ±1 → 0,743/0,702 Hz.

| f0 | n | Mục tiêu | Trội H / S | Sai st H / S | AM H / S | f0 | n | Mục tiêu | Trội H / S | Sai st H / S | AM H / S |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 220 | −12 | 110,0 | 107,5 / 107,5 | −0,40 / −0,40 | 0,16 / 0,14 | 440 | −12 | 220,0 | 215,0 / 215,0 | −0,40 / −0,40 | 0,72 / 0,52 |
| 220 | −7 | 146,8 | 145,2 / 145,2 | −0,20 / −0,20 | 0,39 / 0,21 | 440 | −7 | 293,7 | 290,3 / 290,3 | −0,20 / −0,20 | 0,61 / 0,54 |
| 220 | −5 | 164,8 | 163,6 / 163,6 | −0,13 / −0,13 | 0,26 / 0,19 | 440 | −5 | 329,6 | 327,1 / 327,1 | −0,13 / −0,13 | 0,49 / 0,55 |
| 220 | −1 | 207,7 | 207,4 / 207,4 | −0,02 / −0,02 | 0,27 / 0,12 | 440 | −1 | 415,3 | 414,7 / 414,7 | −0,02 / −0,02 | 0,71 / 0,54 |
| 220 | +1 | 233,1 | 233,4 / 233,4 | +0,02 / +0,02 | 0,28 / 0,16 | 440 | +1 | 466,2 | 466,8 / 466,8 | +0,02 / +0,02 | 0,70 / 0,55 |
| 220 | +5 | 293,7 | 295,3 / 295,3 | +0,10 / +0,10 | 0,17 / 0,11 | 440 | +5 | 587,3 | 590,7 / 590,7 | +0,10 / +0,10 | 0,44 / 0,53 |
| 220 | +7 | 329,6 | 332,1 / 332,1 | +0,13 / +0,13 | 0,16 / 0,14 | 440 | +7 | 659,3 | 664,2 / 664,2 | +0,13 / +0,13 | 0,42 / 0,53 |
| 220 | +12 | 440,0 | 445,0 / 445,0 | +0,20 / +0,20 | 0,17 / 0,13 | 440 | +12 | 880,0 | 890,0 / 890,0 | +0,20 / +0,20 | 0,37 / 0,45 |
| 330 | −12 | 165,0 | 167,5 / 167,5 | +0,26 / +0,26 | 0,28 / 0,18 | 550 | −12 | 275,0 | 275,0 / 275,0 | 0,00 / 0,00 | 0,10 / 0,03 |
| 330 | −7 | 220,2 | 221,9 / 221,9 | +0,13 / +0,13 | 0,19 / 0,15 | 550 | −7 | 367,1 | 367,1 / 367,1 | 0,00 / 0,00 | 0,11 / 0,04 |
| 330 | −5 | 247,2 | 248,5 / 248,5 | +0,09 / +0,09 | 0,19 / 0,16 | 550 | −5 | 412,0 | 412,0 / 412,0 | 0,00 / 0,00 | 0,08 / 0,01 |
| 330 | −1 | 311,5 | 311,8 / 311,8 | +0,02 / +0,02 | 0,30 / 0,12 | 550 | −1 | 519,1 | 519,1 / 519,1 | 0,00 / 0,00 | 0,15 / 0,02 |
| 330 | +1 | 349,6 | 349,3 / 349,3 | −0,01 / −0,01 | 0,32 / 0,15 | 550 | +1 | 582,7 | 582,7 / 582,7 | 0,00 / 0,00 | 0,14 / 0,01 |
| 330 | +5 | 440,5 | 438,8 / 438,8 | −0,07 / −0,07 | 0,17 / 0,14 | 550 | +5 | 734,2 | 734,2 / 734,2 | 0,00 / 0,00 | 0,08 / 0,02 |
| 330 | +7 | 494,4 | 491,9 / 491,9 | −0,09 / −0,09 | 0,12 / 0,11 | 550 | +7 | 824,1 | 824,1 / 824,1 | 0,00 / 0,00 | 0,08 / 0,01 |
| 330 | +12 | 660,0 | 655,0 / 655,0 | −0,13 / −0,13 | 0,13 / 0,12 | 550 | +12 | 1100,0 | 1100,0 / 1100,0 | 0,00 / 0,00 | 0,05 / 0,00 |
| 660 | −12 | 330,0 | 335,0 / 335,0 | +0,26 / +0,26 | 0,33 / 0,54 | 660 | +1 | 699,2 | 698,6 / 698,6 | −0,01 / −0,01 | 0,56 / 0,53 |
| 660 | −7 | 440,5 | 443,8 / 443,8 | +0,13 / +0,13 | 0,36 / 0,55 | 660 | +5 | 881,0 | 877,6 / 877,6 | −0,07 / −0,07 | 0,32 / 0,53 |
| 660 | −5 | 494,4 | 496,9 / 496,9 | +0,09 / +0,09 | 0,28 / 0,53 | 660 | +7 | 988,9 | 983,9 / 983,9 | −0,09 / −0,09 | 0,28 / 0,53 |
| 660 | −1 | 623,0 | 623,5 / 623,5 | +0,02 / +0,02 | 0,58 / 0,54 | 660 | +12 | 1320,0 | 1310,0 / 1310,0 | −0,13 / −0,13 | 0,25 / 0,45 |

(H = headed Chrome 158; S = sim Node. ΔerrSt = 0,00 ở cả 40/40 điểm.)

### 1.1 Tổng hợp theo tần số nền (headed là verdict)

| f0 | frac(f0·W) | \|errSt\| tệ nhất | AM trung bình H / S | AM tệ nhất H / S | AM ≤0,35 | Verdict (bar \|err\|≤0,5 st + AM≤0,35) |
|---|---|---|---|---|---|---|
| 220 | 0,60 | 0,40 | 0,23 / 0,15 | 0,39 / 0,21 | 7/8 | CHƯA ĐẠT sát bar (chỉ −7 vượt: 0,39) |
| 330 | 0,40 | 0,26 | 0,21 / 0,14 | 0,32 / 0,18 | 8/8 | **ĐẠT** |
| 440 | 0,20 | 0,40 | 0,56 / 0,53 | 0,72 / 0,55 | 0/8 | **CHƯA ĐẠT** (đã biết từ 193/194) |
| 550 | 0,00 | 0,00 | 0,10 / 0,02 | 0,15 / 0,04 | 8/8 | **ĐẠT — gần như hoàn hảo** |
| 660 | 0,80 | 0,26 | 0,37 / 0,53 | 0,58 / 0,45 | 5/8 | **CHƯA ĐẠT (mới — lần đầu đo)** |

- **Lượng tử hoá: ĐẠT 40/40 điểm** (|errSt| ≤ 0,40 st, trong tiêu chí
  ≤0,5 st). W = 0,08 không còn lỗi lượng tử hoá nào vượt bar ở bất kỳ
  tần số nào trong 5 tần số đã đo.
- **AM: chỉ 28/40 điểm ≤ 0,35 (headed); sim cho 24/40.** AM phụ thuộc
  mạnh vào tần số nền, không phụ thuộc nhiều vào n (trừ ±1 — xem §1.3).
- **Thứ hạng AM theo frac(f0·W) — sim và headed ĐỒNG Ý:** tệ nhất ở
  frac 0,20 (440: 0,72) và 0,80 (660: 0,58); tốt ở frac 0,00 (550:
  0,15), 0,40 (330: 0,32), 0,60 (220: 0,39). Sim đoán đúng thứ hạng
  này dù giá trị tuyệt đối lệch (xem §3).

### 1.2 Cơ chế — dữ kiện cho quyết PSOLA

- **550 Hz là ca kiểm chứng lý thuyết §2.4-193:** f0·W = 44,0 đúng số
  nguyên → phần lẻ 0,00 → răng lược thẳng hàng với mục tiêu ở mọi n →
  errSt 0,00 và AM 0,00–0,04 (sim) / 0,05–0,15 (headed) ở cả 8 n. Đây
  là lần đầu một tần số đo được errSt = 0,00 tuyệt đối trên cả sim lẫn
  headed — cơ chế răng lược đã được xác nhận bằng số, không còn là giả
  thuyết.
- **Không có W nào sửa mọi f0:** frac(f0·W) đổi theo f0 nên dải xấu
  chỉ DỜI chỗ khi đổi W (W = 0,06 đã chứng minh đợt 193: 220 xấu đi,
  440 tốt lên). Giọng nói thật quét liên tục 100–400 Hz nên luôn đi qua
  dải xấu của bất kỳ W cố định nào — **PSOLA (cửa sổ đồng bộ theo chu
  kỳ, không còn frac(f0·W)) mới triệt được gốc**, đúng hướng tương lai
  đã quyết ở (a2)-194. Dữ kiện đợt này cho PSOLA: ngưỡng cần đạt là
  AM ≤ 0,35 ở MỌI f0 (hiện 440/660 vượt tới 2,1×/1,7× bar) trong khi
  giữ |errSt| ≤ 0,5 st (hiện đã đạt 40/40).
- **660 Hz là dải xấu thứ hai (mới):** AM headed 0,25–0,58, tệ nhất ở
  ±1 (0,56–0,58). Sim đoán AM ~0,53 phẳng ở mọi n — headed cho thấy
  AM ở 660 phụ thuộc n rõ rệt (±5/±7/±12 chỉ 0,25–0,32, tốt hơn sim
  0,20–0,25). Sim KHÔNG bắt được phụ thuộc n này (xem §3).

### 1.3 AM ở n = ±1 — LFO chậm (0,70–0,74 Hz)

Ở mọi f0, AM headed tại ±1 đều cao hơn hẳn các n lân cận (220: 0,27–0,28
so với 0,16–0,17 ở ±5/±7; 330: 0,30–0,32 so với 0,12–0,19; 440:
0,70–0,71; 660: 0,56–0,58). Nguyên nhân đã biết từ 193 §2.4: fLfo ≈
0,7 Hz (chu kỳ 1,4 s) nên cửa sổ đo 2,5 s chỉ chứa <2 chu kỳ LFO — gain
trôi chậm theo chu kỳ LFO, đo được là tremolo chậm thật (không phải
nhiễu đo). Sim cũng cho AM cao ở ±1 tại 440/660 (0,54–0,55) nhưng KHÔNG
tái hiện được mức tăng tương đối này ở 220/330/550 (sim ±1 chỉ
0,12–0,16) — một phần chênh sim-vs-headed (xem §3).

## 2. Telephone N1 kiểm lại — KHỚP Y HỆT ĐỢT 194, ĐẠT bar ≤2 dB

Headed Chrome 158, cùng phương pháp P1-193 §1.2 (render tham chiếu
FFmpeg 8.1.2 highpass 300 / lowpass 3400, tỉ số RMS dB — refs không đổi
từ đợt 192/193). Bundle đo từ cây hiện tại (previewVoiceFx.ts không đổi
kể từ 20:56:13Z 25/11 — trước cả đợt 194; xem §5).

| Tần số | FFmpeg (render) | Chrome 195 | Sai % | Sai dB | Chrome 194 |
|---|---|---|---|---|---|
| 100 Hz | 0,1102 | 0,0898 | −18,5% | −1,78 | 0,0898 / −1,78 |
| 200 Hz | 0,4057 | 0,4084 | +0,7% | +0,06 | 0,4084 / +0,06 |
| 300 Hz | 0,7065 | 0,8280 | +17,2% | +1,38 | 0,8280 / +1,38 |
| 440 Hz | 0,9061 | 0,9293 | +2,6% | +0,22 | 0,9293 / +0,22 |
| 700 Hz | 0,9823 | 0,8577 | −12,7% | −1,18 | 0,8577 / −1,18 |
| 1000 Hz | 0,9921 | 0,8373 | −15,6% | −1,47 | 0,8373 / −1,47 |
| 2000 Hz | 0,9465 | 0,9039 | −4,5% | −0,40 | 0,9039 / −0,40 |
| 3400 Hz | 0,7067 | 0,8280 | +17,2% | +1,38 | 0,8280 / +1,38 |
| 5000 Hz | 0,4058 | 0,4084 | +0,6% | +0,06 | 0,4084 / +0,06 |

**Max |Δ| = 1,78 dB @100 Hz — ĐẠT bar ≤2 dB, không hồi quy** (khớp y hệt
đợt 193/194 từng số; P4-194 kiểm độc lập N1: 1,79 dB). Telephone giữ
nguyên trạng thái ĐẠT sau các đổi mới nhất của vòng lặp (không có đổi
nào chạm chain voicefx — xem §5).

## 3. Sim — kiểm chứng độc lập + giới hạn của sim (ghi rõ)

### 3.1 Neo gốc 0,7 s — bản sao sim tái hiện đúng N2a P4-194

`pitchShifterSim` nguyên văn (0,7 s, Goertzel bước 1 Hz) chạy lại 4
điểm neo 440 Hz cho: +12 → **889 Hz (+0,18 st), AM 0,453**; −12 →
**215 Hz (−0,40 st), AM 0,525**; +7 → 663,5 Hz (+0,11 st), AM 0,534;
−7 → 289,6 Hz (−0,24 st), AM 0,534; sideband tệ nhất 0,160. **Khớp
từng số với N2a P4-194 đã công bố** (889/215 Hz, AM 0,453/0,525,
sideband 0,160) — bản sao sim của P1 là trung thực, không phải sim
khác đội lốt.

### 3.2 Sim 4 s vs headed — đỉnh đúng tuyệt đối, AM đúng thứ hạng

- **Tần trội: ΔerrSt = 0,00 ở 40/40 điểm.** Sim đoán đúng răng trội ở
  mọi (f0, n) — cơ chế 2-delay trong sim là đúng.
- **AM: mean |ΔAM| = 0,105; max |ΔAM| = 0,25** (660/−5 và 660/+7:
  headed 0,28 vs sim 0,53; 440/−12: headed 0,72 vs sim 0,52). Sim
  thường THẤP hơn headed ở 220/330/550 (thiếu ~0,1 AM) và CAO hơn ở
  660/±5/±7/±12 (thừa ~0,2). Nguyên nhân có thể: sim dùng saw lý
  tưởng ×43/50, còn chain thật dùng PeriodicWave 64 sóng hài (gợn
  Gibbs + chuẩn hoá Chrome) và LFO ramp setTargetAtTime (tc = 10 ms)
  — các chi tiết này không có trong sim. **Kết luận cho P4-195: verdict
  AM KHÔNG được lấy từ sim một mình** — N2a-sim chỉ dùng để dự đoán
  thứ hạng/xu hướng; verdict cuối lấy số headed (như đợt 194 đã làm:
  sim 0,53 vs headed 0,72 ở 440/−12).
- Sim chạy 2 lần: **IDENTICAL** (40 điểm + 4 neo).

## 4. Kiểm chứng sau đo (không đổi code sản phẩm nên không có sửa để vỡ)

- `npx tsc --noEmit` (apps/web) → **0 lỗi**.
- `previewVoiceFx.test.ts` → **27 pass, 0 fail**;
  `audioEngineVoiceFx.test.ts` → **8 pass, 0 fail**;
  `bash apps/web/scripts/test-audioengine.sh` → **56 pass, 0 fail**.
- Đo headed lặp 2 lần: **pitchCurve + telephone9 KHỚP Y HỆT** từng số
  (deterministic — OfflineAudioContext). Sim chạy 2 lần: IDENTICAL.
- **Kỷ luật pha đo yên (bài học F-194-P1-1):** kiểm `poll-t4.log`
  trước/sau MỌI lần đo/build nặng. Poll T4-195 đã đọc: #3–#5 (08:45–
  08:46Z, lock của t01-round195), #7–#9 (08:48–08:49Z, lock=khong),
  #11 (08:51:16Z), #14 (08:53:32Z) — **T4-195 CHƯA MỞ attempt nào
  trong suốt cửa sổ đo của P1** (sim 08:48:34–08:48:37Z; headed
  08:49:21–08:50:14Z; tsc/test 08:51:16–08:51:47Z). Kiểm chéo lock log
  `vite-lock-v2.log`: 0 dòng ACQUIRED của t4 trong ngày 26/11; holder
  cuối là t01-round195 (RELEASED 08:46:54Z). **0 lần đo nặng nào của P1
  chồng pha (b) T4.** (Attempt T4 là thao tác kéo dài nhiều phút nên
  không thể lọt giữa 2 poll cách nhau ~45 s — khác với lỗi suy luận
  của P1-194, lần này có cả poll log + lock log làm chứng.)
- Hạ tầng đo: `/tmp/voicefx195/` (measure/page-measure/cdp-driver/
  pw-driver/page.html + sim-curve.mjs mới) — bản lưu bền ở
  `hidden_files/round195-p1/` (chrome-*.json, sim-curve-195.json,
  harness/ 7 file). /tmp sẽ mất khi reboot — JSON trong hidden_files
  là bản lưu bền.

## 5. File đổi (stage trong paths-loop)

- `docs/PHASE9_ROUND195_P1_VOICEFX_LIMITS.md` — file này (duy nhất).

**KHÔNG đổi:** `apps/web/src/lib/previewVoiceFx.ts` (mtime
2026-11-25 20:56:13Z, md5 3d7ee11e1c2926d4ba76d5bb5701d0e0 — không đổi
kể từ trước đợt 194; hằng số đọc từ bundle: PITCH_WINDOW_S = 0,08,
TELEPHONE_WET_GAIN_COMP = 0,76, SAW_GAIN_COMP = 50/43), test voicefx,
`audioEngine.ts`, `preview.tsx`, GAP, aggregate (việc của T10),
MEMORY.md, build-loop-log.md. **Không chạm file chung nào — không có
xung đột để T10 phải kiểm.** Script đo (sim-curve.mjs + pitchCurve)
chỉ nằm ở /tmp + hidden_files, KHÔNG stage vào repo (theo tiền lệ
193/194 — hạ tầng đo không phải code sản phẩm).

## 6. Chưa làm / nợ chuyển đợt sau

- Pitch AM ở 440 Hz (0,37–0,72) + 660 Hz (0,25–0,58) + 220/−7 (0,39)
  vẫn vượt bar 0,35 — trade-off W = 0,08 đã quyết, giữ làm nợ mở;
  P4-195 theo dõi N2. Triệt để vẫn là PSOLA/AudioWorklet + FFT — dữ
  kiện đợt này (§1.2): AM ≤ 0,35 ở MỌI f0, giữ |errSt| ≤ 0,5 st.
- Firefox: KHÔNG đo lại đợt này (playwright-core không còn trong
  /tmp sau reboot; P1-194 đã chứng minh Firefox ≡ Chrome trên cùng
  chain: max ΔerrSt 0,01 st, ΔAM 0,06). Sim độc lập đã là kiểm chéo
  thứ hai cho đường cong (đỉnh khớp 40/40).
- WebKit/Safari: vẫn chưa kiểm được (như đợt 194 — thiếu
  libwebkitgtk-6.0.so.4).
- Nghe bằng tai người thật: chưa có (script render mẫu đợt 194 vẫn
  dùng được).
- Chênh mức pitch−7 preview to hơn render 1,23 dB (đợt 194 §3) — chưa
  chẩn đoán, nợ nhỏ.
