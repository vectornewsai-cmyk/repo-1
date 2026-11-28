# LIMITS — Đợt 198 P4: Parity verify độc lập (Editing Core — preview/render parity)

- Đợt: 198, luồng P4 (kiểm chứng độc lập). Ngày: 27/11/2026. Đóng ~02:10Z (hạn cờ ~02:00Z, hạn cứng 02:35:51Z).
- Nhiệm vụ (quyết (r)-197, F-197-T10-6): (1) cập nhật test N12a file 196; (2) harness parity lại công việc P1/P2/P3 đợt 198 bằng code đo viết mới/tái tính từ JSON thô — KHÔNG copy số luồng sản phẩm; (3) kiểm chồng pha đo yên trước mọi đo nặng.
- Nguồn quyết: aggregate 197 §14.2 dòng 162 (parent, lượt cron 06:35 +07 27/11, đã khôi phục nguyên văn) + bản sao `hidden_files/round197-parent-decisions.md`. Mục §14.2 dòng 134 (lượt handoff 06:39) là mạo danh — không dùng.

## 1. Kết luận ngắn

**Harness final 198: 46/48 ĐẠT; CHƯA ĐẠT: N2a, N12a; GHI NHẬN: 9** (report `hidden_files/parity198/parity198-report.json`, 63.029 B).

| Mục | Verdict | Số đo P4 (độc lập) |
|---|---|---|
| N10-motion-bob-first (P2 α thích nghi) | **ĐẠT — lần đầu qua bar 0,15** | MAD 6,126 (tap 6,243, −0,117), R_rel 0,082 |
| N5b-deint-bob-first (P2 α thích nghi) | **ĐẠT** | MAD 6,810 (tap 6,855, −0,045), R_rel 0,109 |
| N5d-deint-vertical-blend-plan | **ĐẠT** | plan lock: m=1,08 @ M=13,803, α=0,524 |
| Fix sampleAt NaN (F-197-P4-1) | **XONG, đo thật** | 0 NaN mọi lưới (probe 12 combo + harness 20 điểm) |
| N12a-psola-sim (core, thước tỉ số) | **CHƯA ĐẠT** | tỉ số mag −12 1,72–2,70 < 10; domFreq đúng đích; hài 3 còn mạnh |
| Headed two-stage −12 (tái tính từ JSON thô P1) | **38/40 — khớp đúng claim P1** | 2 miss đều là F-198-P1-2 (sine 220/−12, repeat 1) |
| N2a-pitch-artifact-440 (fallback 2-delay) | **CHƯA ĐẠT, không đổi** | AM 0,534; errSt −0,398 |
| Telephone9 headed (tái tính từ JSON thô P1) | **GHI NHẬN — khớp hệt 197** | 9/9 errPct giống 197 từng số |
| N11a/N11b (drift/decode P3) | **GHI NHẬN — không có dữ liệu 198** | P3-198 không có dấu vết trên đĩa (F-198-P4-3) |
| N13-fps-source-media | **GHI NHẬN** | media.ts có trường fps; LIMITS P2 có claim fps:30 |
| Test 196 (N12a đã cập nhật) | **22/22 PASS** | runner đúng esbuild+node, exit 0 |
| Test 198 | **24/24 PASS** | tsc 0 lỗi |

## 2. N10/N5b — α thích nghi P2-198: XÁC MINH ĐỘC LẬP, KHỚP TỪNG SỐ

- Harness 198 nối `denoiseMotionMultiplier(motionEstimateFromBandLuma(...))` (hàm thuần P2 ship) vào cả N10 và N5b; đường 196 (α cố định) giữ làm đối chiếu hồi quy trong cùng report.
- **N10 ĐẠT: MAD 6,126 / R_rel 0,082** (tap 6,243; −0,117). Từng frame: f3 6,225 / f7 6,272 / f11 5,882 (tap 6,316/6,381/6,031). M = 14,870/14,732/11,806 (trung bình 13,803); m = 1,093/1,091/1,056; α198 = 0,530/0,529/0,512 (trung bình 0,524). **Khớp từng số sim P2-198 §5** (6,126/0,082; M 14,870/14,732/11,806; m 1,093/1,091/1,056). Đường 196 đối chiếu trong cùng report: 6,240/0,155 — tái hiện đúng đợt 197 (CHƯA ĐẠT). **Đây là lần đầu N10 qua bar R_rel 0,15** (điều kiện (a1)-197: qua cùng bar trên cả N10+N5b — nay cả hai đều qua).
- **N5b ĐẠT: MAD 6,810 / R_rel 0,109** (tap 6,855; −0,045). M = 8,194/6,542/6,846 (trung bình 7,194); m = 1,012/1,0/1,0; α198 = 0,491/0,485/0,485 (trung bình 0,487). **Khớp từng số sim P2-198** (6,810/0,109; M 8,194/6,542/6,846). Đường 196 đối chiếu: 6,803/0,107 — tái hiện đúng đợt 197.
- N5d ĐẠT: khóa plan-motion — multiplier 1,08 @ M=13,803, α plan = 0,485×1,08 = 0,524; không motion → multiplier 1; neo 7,194 → 1,0; kẹp [1,0; 1,12]; NaN → 1.
- Lưu ý trung thực: M/m/MAD khớp P2 từng số vì cùng fixture + cùng hàm thuần P2 — đó là xác minh wiring + số học độc lập (harness P4 tự tính từ khung nguồn), không phải copy số; P2 sim và P4 harness chạy code đo riêng.

## 3. Fix sampleAt NaN (F-197-P4-1): XONG — 0 NaN mọi lưới P4

- Probe viết mới `scratch/nan-check-198.mjs` (lõi `psolaPitchShift` thật, f0 220/440/660 × n ±12/±7, 12 combo, N=33.600 mẫu/combo), chạy lại sau khi P1 đóng cờ: **0 NaN/Inf cả 12 combo** (log `scratch/nan-after-p1-close.log`). Baseline đợt 197: 2 NaN ở 440/−12.
- Harness N12a grid (20 điểm, f0 220–660 × n ±12/±7): `nan_samples_max = 0` — lưới thứ hai độc lập xác nhận.
- Phạm vi: probe P4 là sine thuần 12 combo; claim 40 điểm (sine + harmonic) của P1-198 là số của P1, P4 không chạy lại lưới đó — hai lưới P4 (12 + 20 điểm) corroborate, không thay thế. Fix không đổi cao độ: probe `m12-verify-198.mjs` (Goertzel quét min, cửa sổ trượt 0,5 s, full grid −12) cho tỉ số mag 1,72–2,70, khớp đợt 197 (1,7–2,7); hài 3 vẫn mạnh (mag3T 0,14–0,23, ngang magT) ở lõi core.

## 4. N12a + headed two-stage — hài 3 sửa xong về cao độ, thước mag vẫn CHƯA

### 4.1. N12a core sim: CHƯA ĐẠT (thước tỉ số ≥ 10 đứng)

- Harness N12a (lõi `psolaPitchShift` thật trên sine): `not_shifted_count = 5` (cả 5 điểm −12), `pitch_shifted_count = 15`, `worst_err_harm_st = 0,098`, `worst_AM_depth = 0,188`, `nan_samples_max = 0`. Tỉ số magT/magO ở −12: 220: 0,448/0,178 = 2,51; 440: 0,44/0,169 = 2,61; 660: 0,436/0,164 = 2,65 (khớp đúng số P4-197 đã công bố — cài đặt Goertzel nhất quán). DomFreq ở −12 ĐÚNG đích cả 5 f0 (109/165/219/275/329 Hz), errHarm ≤ 0,098 st — cao độ dịch đúng, chỉ thước tỉ số không qua.
- Lưu ý: N12a sim dùng lõi core `psola.ts` — Fix-1 của P1 nằm ở `psolaWorkletSource.ts` (worklet), không đổi lõi core. Verdict N12a core không thay đổi vì fix worklet; xem §4.2 cho worklet.

### 4.2. Headed two-stage −12: tái tính độc lập từ JSON thô P1 — 38/40, KHỚP ĐÚNG CLAIM P1

- Probe viết mới `scratch/headed-twostage-rederive-198.mjs`: đọc lại từng điểm trong `hidden_files/round198-p1/chrome-twostage*/chrome-*.json` (2 trang × 2 repeat), áp thước P1 công bố (|errSt| ≤ 0,5, |errStWide| ≤ 0,5, AM ≤ 0,6). Kết quả tái tính: trang 1 repeat 1: 9/10; repeat 2: 10/10; trang 2 repeat 1: 9/10; repeat 2: 10/10 — **tổng 38/40, khớp đúng LIMITS P1-198 §3.1**. Ship (cờ BẬT): 9/10, miss duy nhất 440/−12 AM 0,72 — khớp §3.2 P1.
- 2 miss đều là CÙNG 1 điểm sine 220/−12 repeat 1, số giống hệt nhau qua cả 2 trang: peak 119,9 / wide 220,8 / errSt 1,50 / errStWide 12,07 / AM 0,05 — chữ ký F-198-P1-2 (cold-start, render đầu tiên của trang mới), không phải artifact hài 3. **Cả 3 điểm fail hệ thống đợt 197 đều HẾT** (pitchCurve 660 wide 990,9 → 330,5; harmonicCurve 440 wide 660,2 → 220,1; harmonicCurve 660 wide 992,2 → 330,8 — tái tính xác nhận wide nằm ở đích, errStWide 0,01–0,04).
- Wide −7 (§3.4 P1) tái tính xác nhận đúng từng số, cả 4 run: pitchCurve 660/−7 peak 440,8 (errSt 0,01, đúng) nhưng wide 881,7 (errStWide 12,01); harmonicCurve 220/−7 peak 146,9 (errSt 0,01) nhưng wide 293,9 (errStWide 12,01, AM 0,32). Band đúng — thước wide nhạy hài nào trội hơn, không phải lỗi cao độ. P1 không đổi bar wide; P4 đồng ý ghi nhận, không chặn flip.
- **F-198-P1-1 (tỉ số mag −12, P1): P4 đồng ý về mặt cấu trúc.** Worklet cascade đã fix cho domFreq đúng cả 5 f0 nhưng magT/magO chỉ 2,08–2,31 (số P1); core đối chứng cho số y hệt (2,12–2,65 — khớp số P4-197/P4-198 §4.1). Ở r = 0,5, f0 trùng đúng hài 2 của đích nên magOrig đo hài 2 hợp lệ của output. Bar `magT ≥ 10×magO` ở −12 không đạt được với mọi TD-PSOLA (kể cả core). Ở −7/+7/+12 worklet đã fix pass 5/5 với tỉ số 125–942 (số P1 — P4 không chạy lại lưới worklet Node, chỉ tái tính headed §4.2 + core §4.1).

### 4.3. F-198-P4-2 (MỚI, P4 phát hiện): transient cold-start không chỉ ở 220/−12

- Tái tính band-only (chỉ |errSt| ≤ 0,5 + AM ≤ 0,6) trên các điểm KHÔNG phải −12 trong cùng JSON headed: trang 1: 70/70 cả 2 repeat; trang 2: **69/70 mỗi repeat, miss khác nhau**: repeat 1: pitchCurve 220/+5 — errSt −2,07, peak 260,5 (đích 293,7), wide 220,4, AM 0,04; repeat 2: pitchCurve 550/+1 — errSt −0,99, peak 550,4 (≈ f0 gốc 550, không dịch), AM 0,03. Cả hai đều có dạng output ≈ không dịch, AM thấp — cùng họ chữ ký với F-198-P1-2 (transient render đầu trang), nhưng ở điểm +5/+1 và chỉ xuất hiện ở trang 2.
- Hệ quả: F-198-P1-2 có thể không phải là điểm đơn lẻ 220/−12 mà là họ transient render-đầu-trang (điểm miss thay đổi theo trang/repeat). Giao P1/T1-199 xác minh cùng F-198-P1-2 trên app thật; không chặn việc ghi nhận F-197-P1-3 đã sửa về cao độ (38/40 ở −12, band −7/+7/+12 đúng).

## 5. N2a + telephone — fallback không đổi; telephone khớp hệt 197

- **N2a CHƯA ĐẠT, không đổi so với đợt 197:** worst_err_st 0,398; worst_AM_depth 0,534; worst_sideband_ratio 0,160; domFreq −12 = 215 Hz (err −0,398 st), AM −12 = 0,525. Đây là artifact của fallback shifter 2-delay cũ (đang BẬT ở preview theo (a2)-197) — không phải two-stage. Chặn fallback GIỮ NGUYÊN.
- **Telephone9: tái tính khớp hệt 197 cả 9 điểm, mọi run.** Từ JSON thô P1-198 (3 file × run) vs JSON thô P1-197 (2 file): errPct (100,−18,5), (200,0,7), (300,17,2), (440,2,6), (700,−12,7), (1000,−15,6), (2000,−4,5), (3400,17,2), (5000,0,6) — giống hệt từng số. Telephone không động đợt này, đúng kỳ vọng.
- N1/N2/N2c/N9b/N12 headed trong harness vẫn GHI NHẬN: P1-198 không publish `headed-voice198.json` (định dạng harness chờ); dữ liệu headed thực tế nằm ở `chrome-twostage*` JSON và đã được P4 tái tính ở §4.2/§5 thay vì chờ đúng tên file. Harness không verdict từ số cũ (tiền lệ 197).

## 6. P3-198 — KHÔNG CÓ DẤU VẾT TRÊN ĐĨA (F-198-P4-3, MỚI)

- Lúc P4 đóng cờ (02:01Z): **không có `round198-p3.done`, không có LIMITS P3-198** (`docs/` chỉ có P1/P2/T01/T2/T4/T56), **`hidden_files/round198-p3/` TRỐNG HOÀN TOÀN**, không có `audio-waveform-198-*.json` hay `decode-probe-198.json` trong `benchmarks/reverse198/` hay `tmp-round198-p3/` (thư mục này không còn tồn tại), `reverseAudio.ts` không đổi từ 00:25:45Z. Vòng chờ nền của P4 (kiểm `.done` mỗi 5 phút, 00:36–01:51Z) ghi P3=0 suốt 16 lần kiểm; P1 đóng 01:31Z, P2 đóng ~01:01Z.
- Hệ quả cho P4: N11a-drift-ceiling-headed và N11b-decode-time-300-600s **GHI NHẬN — không có dữ liệu 198 để đo lại** (logic cửa sổ N11b-window-logic-300-600s vẫn ĐẠT như cũ; S6b-headed-seek ĐẠT qua dữ liệu 195-regression do code seek không đổi). Drift longA/longB và decode từng phần N11b của đợt 198 **không được kiểm chứng** — nợ sang đợt sau hoặc parent quyết.
- P4 không kết luận P3 "chưa từng chạy" hay "chạy mà mất dấu" — chỉ ghi những gì trên đĩa lúc đóng cờ. Parent/T10 quyết số phận P3-198.

## 7. N13 + F-198-P4-1 (lỗi tên file LIMITS trong harness)

- **F-198-P4-1:** harness 198 ban đầu tìm LIMITS P2 ở tên `PHASE9_ROUND198_P2_ENHANCE_PARITY_LIMITS.md` (tên đợt 197) — P2-198 đặt tên theo chủ đề đợt là `..._ENHANCE_ALPHA_LIMITS.md` nên dry-run ghi sai "P2-198 chưa đóng cờ" dù file đã có. Đã sửa harness thử cả hai tên; final run: `limits_has_fps_claim = 1`, media.ts có trường fps. N13 GHI NHẬN (fps headed là probe riêng của P2 — P4 chỉ kiểm file/code + LIMITS, không đo lại độc lập).
- Bài học: tên LIMITS của luồng khác đổi theo chủ đề từng đợt — harness phải thử nhiều tên, không hard-code tên đợt trước.

## 8. Test suites + kỷ luật đo yên

- **Test 196 (N12a đã cập nhật, F-197-T10-6): 22/22 PASS, runner đúng exit 0** (`scripts/parity196-run-test.mjs`, esbuild+node; log `scratch/test196-final-close3.log`). Chạy lại sau khi P1 đóng cờ (code cuối: psola.ts fix NaN + psolaWorkletSource.ts Fix-1) — vẫn 22/22, **không cần cập nhật test lần hai**: test assert trên lõi core (domFreq ≈220, errHarm < 0,5 st, pitchShifted=false vì tỉ số ~2,6 < 10) và lõi core không đổi bởi Fix-1 worklet.
- Lưu ý trung thực: chạy bằng `npx vitest run` file này báo FAIL "No test suite found" (exit 1) — file dùng helper `ok()` top-level, không có khối `test()` vitest (cấu trúc có sẵn từ trước, giống file test của P1-198 §5). 22/22 là số check ✓, không phải verdict vitest. Runner đúng là `parity196-run-test.mjs`.
- **Test 198: 24/24 PASS, runner exit 0** (log `scratch/test198-final-close.log`); **tsc 0 lỗi** (apps/web).
- **Kỷ luật đo yên: 0 chồng pha.** T4 attempt2 hợp lệ (20/20 + lớp B 5/5 + tickCost median 55,0 ms, poller thoát 01:08:30Z); P4 kiểm `poll-t4.log` trước mọi đo nặng (dry-run 01:19Z, final 02:01Z) — không có attempt yên nào mở. P1 headed cũng chạy sau cửa yên (01:10–01:22Z).

## 9. Quyết đề xuất cho parent (§14.2-198)

- **(d1) N10 ĐẠT — ghi nhận lần đầu qua bar 0,15.** Điều kiện (a1)-197 (qua cùng bar trên cả N10+N5b) nay ĐẠT cả hai (N10 0,082; N5b 0,109). Không còn lý do giữ N10 ở CHƯA ĐẠT.
- **(d2) KHÔNG FLIP cờ `PSOLA_MINUS12_USE_FALLBACK`.** Điều kiện flip (a2)-197 "preview two-stage qua cả hai thước 10/10" CHƯA đạt: (i) thước cao độ headed 38/40 (2 miss F-198-P1-2); (ii) thước mag N12a ở −12 ~2,1–2,7 so với bar 10 — cấu trúc (F-198-P1-1). Chặn fallback ở preview GIỮ NGUYÊN; render giữ PSOLA.
- **(d3) F-197-P1-3 (hài 3 trội): COI LÀ SỬA XONG về mặt cao độ.** Warm render 10/10 ở −12 (repeat 2 cả hai trang), 3 điểm fail hệ thống đợt 197 hết, AM cải thiện mạnh (max 0,42). P4 tái tính độc lập khớp đúng claim P1.
- **(d4) F-198-P1-1: chờ quyết parent về bar N12a ở −12** — giữ bar 10 (đồng nghĩa không bao giờ flip ở −12 bằng thước này), hay đánh giá −12 bằng domFreq/errHarm + cao độ wide, hay định nghĩa lại N12a ở −12 (vd. đo mag ở hài 3 thay vì f0 gốc). P1-198 không tự đổi bar; P4 đồng ý.
- **(d5) F-198-P1-2 + F-198-P4-2 giao P1/T1-199:** xác minh trên app thật (preview đầu tiên sau load trang của clip −12; F-198-P4-2 gợi ý transient không chỉ ở 220/−12) + tìm cơ chế + sửa. Không chặn (d3).
- **(d6) P3-198 (F-198-P4-3): parent/T10 quyết số phận** — không có dấu vết trên đĩa lúc P4 đóng cờ; N11a/N11b đợt 198 không được kiểm chứng; nợ decode từng phần + drift sang 199 hay coi là luồng không giao.
- **(d7) N2a: giữ CHƯA ĐẠT** — fallback 2-delay cũ vẫn artifact AM 0,53; không phải việc của two-stage.

## 10. File đổi (stage)

- `apps/web/src/lib/parityHarness196.test.ts` — cập nhật test N12a (F-197-T10-6).
- `apps/web/src/lib/parityHarness198.ts` — mới (harness 198; gồm fix F-198-P4-1).
- `apps/web/src/lib/parityHarness198.test.ts` — mới (24 test).
- `scripts/parity198-run.mjs`, `scripts/parity198-run-test.mjs` — mới.
- `apps/web/tsconfig.json` — thêm exclude `src/lib/parityHarness198.test.ts`.
- `docs/PHASE9_ROUND198_P4_PARITY_VERIFY_LIMITS.md` — file này.
- Không sửa `PHASE9_GAP_ANALYSIS.md`. Không push. Không sửa file của luồng khác.
- Scratch (không stage): `hidden_files/round198-p4/scratch/` (nan-check, m12-verify, headed-twostage-rederive, logs), `hidden_files/round198-p4/dryrun/` (report dry-run), `hidden_files/parity198/parity198-report.json` (report final).
- Lưu ý push: `parityHarness198.ts` ~196 KB — VƯỢT trần push 37.768 B, cần ENABLE_PRIVSEP=0 lúc push (như parityHarness197.ts đợt trước). LIMITS này dưới trần push.
