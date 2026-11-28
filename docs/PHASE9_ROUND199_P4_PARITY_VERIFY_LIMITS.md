# Đợt 199 P4 — Parity verify: harness 49/53 + N11a/N11b + N12a gate mới

> **Kết luận: harness FINAL 49/53 ĐẠT** (report `hidden_files/parity199/parity199-report.json`,
> generated 2026-11-27T07:22:27Z). **CHƯA ĐẠT: N2a, N12a (core sim), N11a-longA, N11a-longB.
> GHI NHẬN (không verdict): 8.** **FULL PASS KHÔNG CÓ — chuỗi GIỮ 0.**
> N10/N5b ĐẠT, khớp số P2-199 từng số. N11b ĐẠT cả 3 pass (partial engage thật, decode ≤ 2.391 ms).
> N11a CHƯA ĐẠT theo thước max đứng — nhưng phân phối tốt (xem §3, tiền lệ (a5)-198, parent quyết).
> N12a: core sim CHƯA ĐẠT theo gate mới (a4)-198; headed wide −12 10/10 tái tính độc lập (§2).
> **Cờ `PSOLA_MINUS12_USE_FALLBACK` KHÔNG flip trong đợt này** — thuộc parent quyết ở §14.2-199.
> Test 199: **26/26 PASS**. `npx tsc --noEmit`: **0 lỗi** (chạy lại sau file cuối cùng đổi 07:01:53Z).

## 1. N10 / N5b — xác minh độc lập P2-199: ĐẠT, khớp từng số

Pipeline α thích nghi P2-198 (bob-nearest + blend dọc w(σ̂) + denoise α×m(M)); P2-199 KHÔNG đổi
code sản phẩm, chỉ đo lại trên footage thật + re-check sim.

| check | MAD preview-199 | MAD tap | R_rel | verdict |
|---|---|---|---|---|
| N10 (fixture chuyển động) | **6,126** | 6,243 | **0,082** | ĐẠT |
| N5b (fixture tĩnh) | **6,810** | 6,855 | **0,109** | ĐẠT |

Khớp từng số với sim P2-198 §5 (C5b_box: N10 6,126/0,082; N5b 6,810/0,109) và với số P4-198.
N5d ĐẠT (w = 0,8 ở σ̂ ≥ 2,7). N13 GHI NHẬN (`media.ts` có trường fps; LIMITS P2-199 tìm được
qua glob — bài học F-198-P4-1).

**Nợ P2 §5 (chưa đo lại độc lập, ghi nhận):** R_rel phụ thuộc σ — ở σ=5, R_rel 0,245 CHƯA ĐẠT
(cả adapt lẫn fixed; tap cũng 0,246) → bar 0,15 hiệu chuẩn ở σ=15, không đạt được bằng phương
pháp nào trên nội dung nhẹ ít nhiễu.

## 2. N12a — gate mới (a4)-198: core sim CHƯA ĐẠT; headed wide 10/10

### 2.1 Core sim (harness N12a-psola-sim): CHƯA ĐẠT

Gate mới: −12 theo domFreq/errHarm (|errHarm| ≤ 0,5 st, k∈{1,2}); ±7/+12 theo thước mag cũ.
Lưới 20 điểm (f0 220/330/440/550/660 × n ±12/±7), lõi `psolaPitchShift` thật.

- **gate_fail: 330/−12, 550/−12.** domFreq −12 = 495 Hz (đích 165) và 825 Hz (đích 275) —
  **hài 3 của đích**; errHarm (k∈{1,2}) = **7,02 st** ở cả hai.
- Tỉ số mag −12 (chỉ tham khảo, không còn là điều kiện flip): 2,51 / 1,90 / 2,61 / 1,74 / 2,65
  (220/330/440/550/660). worst_err_harm_st (tất cả điểm) = 7,02; worst_err_harm_mag_st = 0,098
  (chỉ tính trên điểm qua thước mag — không chứa điểm −12 nào); worst_AM = 0,188; nan_max = 0.
- worst_err_st = 19,02 (domFreq 495 vs 165 = tỉ số 3×). Cả 5 điểm −12 đều `shifted=0` trong sim.
- Ghi nhận: ở −7, domFreq 220/−7 (293 Hz), 550/−7, 660/−7 dính hài 2 (sai ~12 st) nhưng vẫn
  qua thước mag (tỉ số 51–140) — thước mag ở ±7 không bắt được đỉnh hài trội; chỉ là quan sát,
  không đổi verdict.

### 2.2 F-199-P4-1 — ĐÍNH CHÍNH hồ sơ 198 (ảnh hưởng trực tiếp tiền đề của (a4))

Claim ở LIMITS P4-198 §4.1 "domFreq −12 ĐÚNG đích cả 5 f0 (109/165/219/275/329 Hz),
errHarm ≤ 0,098 st" là **SAI** theo chính report JSON của P4-198
(`hidden_files/parity198/parity198-report.json`, generated 2026-11-27T02:01:12Z; dryrun cũng vậy):
domFreq toàn cục ở 330/550 −12 = 495/825 Hz (hài 3 của đích), errHarm (k∈{1,2}) = 7,02 st;
`worst_err_harm_st` = 0,098 chỉ tính trên các điểm qua thước mag (không chứa điểm −12 nào).
P4-198 đã lẫn số từ probe hẹp + số worst loại trừ −12.

Xác minh độc lập bằng 2 cách, cùng kết quả:
- Chạy lại `psolaShiftSim` của cả file 198 và 199 trên lưới 20 điểm
  (`round199-p4/scratch/m12-verify-199.log`): tỉ số mag −12 = 2,51 / 1,90 / 2,61 / 1,74 / 2,65;
  gate mới FAIL 330/−12, 550/−12; worstAM 0,188; nanMax 0.
- Bằng chứng ngược (nền tảng đích CÓ mặt đúng tần số): probe Goertzel hẹp của P4-198
  (`round198-p4/scratch/m12-baseline.log`): peakT 165,1/275,0 Hz, magT 0,19–0,20, nhưng hài 3
  mạnh hơn (mag3T 0,22–0,23). Probe tự tương quan mới (`round199-p4/scratch/acorr-verify-199.mjs`):
  cao độ đúng đích cả 5 f0, errSt ≤ 0,054 st, r ≈ 0,99.

**Hệ quả: tiền đề của (a4) "(domFreq đã đúng đích cả 5 f0, errHarm ≤ 0,098 st)" KHÔNG đứng theo
thước domFreq/errHarm của harness. N12a core sim theo gate mới như đã định nghĩa: CHƯA ĐẠT.**
P4 KHÔNG tự ý đổi thước sang k=3 hay autocorr để ép ĐẠT. Đề xuất parent quyết ở §14.2-199:
(i) mở rộng errHarm sang k∈{1,2,3} (330/−12: 495 = 3×165 → err 0; 550/−12: 825 = 3×275 → err 0 —
cả hai sẽ ĐẠT); (ii) dùng cao độ autocorr làm thước −12; hoặc (iii) coi hài 3 trội là vấn đề sản
phẩm, giao P1 xử lý (cao độ thì đúng — xem §2.3 — nên khả năng cao chỉ là thước đo, không phải
lỗi nghe được; P1 chưa xác nhận).

### 2.3 Headed wide −12 — tái tính độc lập từ JSON thô của P1: 10/10

Từ `round199-p1/verify-fixed/chrome-2026-11-27T06-31-21-469Z.json` (script
`round199-p4/scratch/headed-twostage-rederive-199.mjs`): run1 + run2 đều **−12 KẾT HỢP 10/10,
band 10/10, WIDE 10/10**, số giống hệt nhau (pitchCurve 110,4/165,4/220,3/275,3/330,5;
harmonicCurve 110,1/165,3/220,1/274,8/330,8; errSt/errStWide 0,01–0,06; AM 0,03–0,42);
non-m12 band-only 70/70 mỗi run. File repro chưa sửa: turnA 9/10 + 8/10, turnA2 9/10 + 9/10
(các fail đều là chữ ký lạnh F-198-P1-2). Quirk wide −7 đã biết vẫn còn cả 2 run (pitchCurve
660/−7 wide 881,7; harmonicCurve 220/−7 wide 293,9; band đúng) — không chặn.
P1-199: cơ chế F-198-P1-2 TÌM RA + SỬA XONG (node worklet kẹt `ratio=1` do message thừa từ
`setParams(null)`); headed 160 render 0 lỗi lạnh (trước sửa: 9/320). P1 claim N12a ĐẠT theo gate
mới — P4 ghi nhận claim này ở phần headed, nhưng verdict core sim ở §2.1 vẫn CHƯA ĐẠT.

## 3. N11a / N11b — đo lại độc lập từ JSON thô của P3-199 (pass A/B/C cuối)

Dữ liệu: `hidden_files/round199-p3/audio-waveform-199-{longA,longB,chirp}.json` +
`audio-probe-199-*.json` (pass cuối: longA 07:04:47Z, longB 07:08:22Z, chirp 07:10:36Z;
P3 đóng cờ 07:19Z, LIMITS `PHASE9_ROUND199_P3_REVERSE_N11B_LIMITS.md`).
**Mọi số median/p90/max dưới đây P4 tính lại độc lập từ JSON thô và KHỚP TỪNG SỐ với LIMITS P3.**

### 3.1 N11b — decode từng phần: ĐẠT cả 3 pass (bar 5.000 ms)

| pass | decode cửa sổ đầu / cuối (ms) | load tới loaded=1 (ms) | Δpartial / Δfull / Δfail | playClamped Δ | playFalse |
|---|---|---|---|---|---|
| A longA | 1.930 / 2.391 | 2.764 | **2 / 0 / 0** | 5 | 0 |
| B longB | 769 / 2.293 (5 cửa sổ: 769/1.470/927/662/2.293) | 954 | **5 / 0 / 0** | 1 | 0 |
| C chirp | 320 / 320 | 467 | **1 / 0 / 0** | 0 | 0 |

ffmpeg decode audio-only (đối chiếu): 1,303 / 1,606 / 0,403 s. N11b-window-logic ĐẠT.
P3 đã tìm ra + sửa xong nguyên nhân partial không engage đợt 198: (1) `extraTrim` cắt sai 769 mẫu
do timestamp output decoder advance theo số mẫu decode, không theo stts; (2) trượt cửa sổ khi
endIdx kẹp ở cuối file thật — nay `startIdx = floor(w0×sr)`; (3) log lý do partial fail
(`lastPartialFailReason`). Verify module độc lập của P3: mọi cửa sổ ok + slice non-null
(`verify-lastframe-199.json`: 5 cửa sổ longA + 3 longB, 376–723 ms) — đây là probe của P3,
P4 chỉ trích dẫn, không tính là số của mình.

### 3.2 N11a — trần drift 0,5 s: CHƯA ĐẠT theo thước max đứng (cả longA + longB)

| pass | median S2 | p90 S2 | max S2 | in-pass | stale S1 / lag S2 loại | mẫu > 0,5 s |
|---|---|---|---|---|---|---|
| A longA | **0,074** | **0,215** | **0,526** | 327/400 | 24 / 53 | **1 / 327** |
| B longB | **0,167** | **0,259** | **2,756** | 477/480 | 95 / 147 | **7 / 477** |

**longA — chỉ 1 mẫu vượt, là mẫu ĐẦU TIÊN của pass (startup transient):** idx 26, ph 300,5 s,
peakHz 2.993, drift có dấu −0,526 s (vượt bar 0,026 s — nhỏ hơn 1 bin FFT 0,087 s); 2 mẫu sau
−0,326 / −0,226 (suy giảm ngay). Mẫu này có holdCapStop = 0 (cap chưa kích hoạt tại đó),
holdMaxSec 1,454 s — playhead đang giữ chờ cửa sổ (load), không phải drift trạng thái ổn định.
Counters cuối: tick 1.793, holdStop 850, holdKeep 521, holdCapStop 4, holdMaxSec 2,049 s,
restart 71, restartExact 11, playOk 87, playFalse 0, windowRebuilds 1.

**longB — 7 mẫu vượt: 1 mẫu đầu + 6 mẫu giữa pass (transient rải rác):** idx 2 (mẫu sounding đầu
tiên, ph 300,2 s, peakHz 1.098, drift +2,756 s — peak tồn từ phát xuôi, bộ lọc S2 không lọc được
mẫu đầu vì không có mẫu trước để so; P3 §3.1 đã xác nhận) + 6 mẫu giữa pass 0,537–0,700 s
(ph 198,8–237,1; đều drift dương; sau rebuild 2–4; KHÔNG gắn với cap nào: holdCapStop_end = 0,
holdMaxSec_max = 0,351 s). Counters cuối: tick 6.860, holdStop 3.503, holdKeep 3.480,
holdCapStop 0, holdMaxSec 0,351 s, restart 171, restartExact 121, playOk 293, playFalse 0,
windowRebuilds 4.

**Tiền lệ để parent quyết (a5)-199:** đợt 198, parent coi phân phối longA gần như y hệt
(median 0,089 / p90 0,222 / max 0,515, đúng 1 mẫu vượt) là **ĐẠT** ("chỉ 1 mẫu transient").
Đợt 199 longA TỐT HƠN ở median/p90 (0,074/0,215 vs 0,089/0,222), max 0,526 vs 0,515 (hơn 0,011 s,
vẫn 1 mẫu). P4 GIỮ verdict harness CHƯA ĐẠT theo thước max đứng (max S2 ≤ 0,5 s) — không tự ý
lật verdict theo tiền lệ; parent quyết cuối ở (a5)-199. Với longB chưa có tiền lệ 198 (đợt 198
không đo được): median/p90 tốt (0,167/0,259), max do 1 mẫu đầu artefact + 6 transient.

**Chirp-70s: GHI NHẬN (không verdict).** Harness (fit tuyến tính f0 = 278,3 Hz, slope 38,60 Hz/s,
R² = 0,998): median 0,148 / p90 0,266 / max 0,632. P3 tính lại theo công thức sweep thiết kế 70 s:
0,515 / 0,770 / 0,885, signed mean −0,519 — chênh lệch do mốc tham chiếu (đường fit vs đường
thiết kế), cả hai đều bị giới hạn đo: bin FFT 0,607 s > bar 0,5 s. Verdict P3: CHƯA KẾT LUẬN
(§3.3). Nợ đợt 200: hiệu chuẩn lại thước chirp (hoặc đo drift chirp bằng file tuần hoàn 10 s thật).

### 3.3 N11a — ghi chú về thước

Thước S2 (quyết (a4)-196/(a4)-197, bar 0,5 s): loại stale-peak S1 + lag S2 (|Δpeak| ≤ 24 Hz,
playhead chạy ≥ 0,15 s). Mẫu ĐẦU TIÊN của mỗi pass không loại được bằng S2 (không có mẫu trước)
— đúng 2 mẫu max (longA −0,526; longB +2,756) đều là mẫu đầu. Đây là điểm yếu đã biết của thước,
không phải hồi quy sản phẩm.

## 4. Các check khác

- **N2a: CHƯA ĐẠT, không đổi** — AM 0,534 (bar 0,35); errSt 0,398 (bar 0,5, đạt); sideband 0,16.
  Artifact của fallback 2-delay; đường chính ở N12/N12a/N2-headed.
- **N2b, N9a, S1/S2/S3/S4/S5, N4, N5, N5c, S6/S6a, S7/S7b/S7c/S7d, N7, S6b-headed-seek, N6, S8*:
  ĐẠT** (xem report JSON).
- **Headed N1 / N2-headed / N2c / N9b / N12: GHI NHẬN, số rỗng** — file `headed-voice199.json`
  không tồn tại (y hệt đợt 198 — không phải hồi quy); dữ liệu headed của P1 nằm ở
  `round199-p1/verify-fixed/*.json`; P4 chỉ tái tính độc lập phần N12a-wide (§2.3).
  Nợ harness 200: đọc JSON headed thật của P1 thay vì file tổng không ai viết.
- **S6b-reverse-video-boundary: GHI NHẬN** (worst MAD 33,19, offset 1 frame — như 198).

## 5. Phát hiện mới

- **F-199-P4-1** — đính chính hồ sơ 198: claim domFreq −12 đúng đích cả 5 f0 là SAI (§2.2).
- **F-199-P4-2** — P3-199 ghi dữ liệu ra `hidden_files/round199-p3/` (không phải
  `tmp-round199-p3/` như 198); harness nay tìm cả 3 thư mục
  (`benchmarks/reverse199/`, `tmp-round199-p3/`, `hidden_files/round199-p3/`).
- **F-199-P4-3 (mới)** — ghi chú tự động của harness cho N11a-longB SAI: ghi "cap đã kích hoạt
  (holdCapStop > 0)" trong khi `holdCapStop_end = 0`, `holdMaxSec_max = 0,351 s` (note template
  nhạy với holdMaxSec > 0,3 s). Verdict tính từ số, không bị ảnh hưởng. Sửa ở harness 200.
- **P3 §5 (phát hiện thêm, trích dẫn):** lệch rate 48.000/44.100 Hz từng làm drift vọt median
  1,285 s ở pass giữa đợt; đã fix (player expose `bufferSampleRate`, wiring dùng rate buffer).

## 6. Kỷ luật đo yên

T4-199: lượt yên #67 **KHÔNG CÓ LƯỢT HỢP LỆ** — 3 attempt đều 20/20 probe nhưng lớp B vi phạm
(B1+B2); tickCost median 102,0 / 70,0 / 94,0 ms; chuỗi lượt yên hợp lệ 2 → 0 (đề xuất, parent
quyết). Poller T4 thoát 06:38:53Z. Các đo nặng của P4 đều KHÔNG trùng cửa yên: esbuild/test/
probe m12/acorr ~05:49–05:56Z (trước khi cửa yên attempt1 mở 06:09:34Z); dry-run harness 06:42Z
+ 06:44Z, tsc 06:49Z, harness final 07:22Z — đều SAU khi poller thoát. **0 trùng lặp.**
(Ghi chú T4 "W2 ngoại-tải: tsc/test luồng khác" — không phải của P4: tsc của P4 chạy 06:49Z,
sau khi các attempt đã xong.)

## 7. File đổi (stage, xem paths-loop phase9-round199-p4-parity-verify.txt)

- `apps/web/src/lib/parityHarness199.ts` — harness 199 (copy 198 + gate N12a mới + N13 glob +
  N11 tìm 3 thư mục P3). **207.623 B — VƯỢT trần push 37.768 B, cần ENABLE_PRIVSEP=0 lúc push.**
- `apps/web/src/lib/parityHarness199.test.ts` — 26 test (24 cũ + 2 mới khóa gate N12a + mag +7/+12).
- `scripts/parity199-run.mjs`, `scripts/parity199-run-test.mjs` — runner harness + test.
- `apps/web/tsconfig.json` — exclude `parityHarness199.test.ts` (dòng P3 `reverseAudio199P3.test.ts`
  giữ nguyên — kiểm tra trực tiếp, không bị ghi đè).
- `docs/PHASE9_ROUND199_P4_PARITY_VERIFY_LIMITS.md` — file này.
- KHÔNG PUSH. KHÔNG sửa `PHASE9_GAP_ANALYSIS.md`. Scratch + report JSON ở
  `hidden_files/round199-p4/` (không stage) và `hidden_files/parity199/` (không stage).

## 8. Hạn chế / nợ chuyển đợt 200 (P4-200)

1. N12a: chờ parent quyết thước −12 (k∈{1,2,3} / autocorr) ở §14.2-199; cờ fallback thuộc parent.
2. N11a: chờ parent quyết (a5)-199 (thước max vs tiền lệ 198); mẫu đầu pass cần xử lý riêng trong
   thước S2 (đề xuất: loại mẫu sounding đầu tiên khỏi verdict max).
3. Nợ harness: đọc JSON headed thật của P1 (N1/N2/N2c/N9b/N12) thay vì file tổng không tồn tại;
   sửa note cap longB (F-199-P4-3); hiệu chuẩn thước chirp-70s (hoặc bỏ file sweep khỏi đo drift).
4. N2a (fallback 2-delay) không đổi 3 đợt — chỉ là fallback, không chặn đường chính.
5. Nợ P2 §5: R_rel phụ thuộc σ (bar 0,15 chỉ đạt được ở σ≈15) — cần P2 hiệu chuẩn lại bar theo σ.
