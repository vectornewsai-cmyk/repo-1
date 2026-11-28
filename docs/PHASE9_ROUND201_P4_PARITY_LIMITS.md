# Đợt 201 P4 — Parity verify: gỡ cờ longB → N11a ĐẠT trọn + boost-lật XÁC NHẬN ĐỘC LẬP 5/5 + cap 1,05 XÁC NHẬN + biên σ ghim cứng

> **Kết luận: harness FINAL 52/55 ĐẠT** (report `hidden_files/parity201/parity201-report.json`,
> generated 2026-11-27T15:52:03Z). **CHƯA ĐẠT: N2a,
> N11a-longA-200 (cả pass sạch lẫn pass nhiễu tải — xem §3.3, F-201-P4-4).**
> **GHI NHẬN (không verdict): 11** (3× R_rel theo σ + N13 + 5 headed + S6b-boundary + chirp-70s).
> **N11a-longB ĐẠT — cờ `parent_hold_199_longB` ĐÃ GỠ theo quyết (a5)-200** (F-201-P4-1);
> **N11b ĐẠT cả 4 pass** (decode ≤ 2.732 ms, playFalse = 0 — riêng pass nhiễu tải có rebuild
> 5.372 ms, xem §3.4). **N12a ĐẠT theo thước mới** (autocorr worst 0,054 st + wide 10/10,
> wide vẫn từ dữ liệu P1-199 — P1-201 chưa publish headed JSON, nợ 202).
> **Cảnh báo boost-lật của P2-200 §5: XÁC NHẬN ĐỘC LẬP 5/5** (w4s/w8s σ=15, pan σ=25,
> pan σ=22, w4s σ=22 — adapt CHƯA, fixed ĐẠT); **đề xuất cap cố định 1,05 của P2-201:
> XÁC NHẬN ĐỘC LẬP — sửa được cả 4 ca lật mà cap có thể sửa**, giữ lợi ích adapt ở mọi nhóm.
> **Biên σ ghim cứng trên BBB w0s: [~9,2; ~20,7]** — phạm vi hiệu lực σ ∈ [10, 20] ĐỨNG.
> **FULL PASS: KHÔNG — chân harness THIẾU** (52/55, còn 3 CHƯA ĐẠT); chân O8 + chân yên thuộc T01/T4 — T10 quyết cuối.
> Test 201: **29/29 PASS** (28 cũ + 1 mới: longB S2 theo (a5)-200). `npx tsc --noEmit`:
> **file của P4-201: 0 lỗi**; còn **1 lỗi duy nhất trong file test đang làm dở của P3-201**
> (`reverseAudio201P3.test.ts`, `ok` khai mà chưa dùng — không phải file P4, không sửa hộ; xem §6).
> **Cờ fallback KHÔNG flip trong đợt này** — thuộc parent quyết (a2)-200 (chờ P1-201 kết luận H3).

## 1. N12a — thước mới (a4)-199: core sim ĐẠT + headed wide 10/10 (dữ liệu 199)

### 1.1 Core sim (harness N12a-psola-sim, `psolaAutocorrPitch`): ĐẠT — không đổi

Lưới 20 điểm (f0 220/330/440/550/660 × n ±12/±7), lõi `psolaPitchShift` thật; −12 đo thêm autocorr
trên sine 2 s. **gate_fail 0/20; worst AM 0,188; nan 0; worst_err_acorr_m12 = 0,054 st** (bar 0,1) —
khớp từng số với harness 200 và P4-199 (errSt ≤ 0,054 st, r ≈ 0,99). Tỉ số mag −12 vẫn 1,74–2,65
(thông tin, không còn là điều kiện flip).

### 1.2 Headed wide −12 — tái tính độc lập: 10/10 (dữ liệu P1-199, nợ 202)

Script `round201-p4/scratch/wide-rederive-201.mjs` (copy 200, quét round201-p1 → round200-p1 →
round199-p1): **KHÔNG có file `chrome-*.json` nào trong round201-p1 hay round200-p1** (P1-201
đang đo render/vowel, chưa publish headed pitch-curve JSON lúc 15:28Z) nên dùng fallback P1-199
(11 file) như đợt 200. File `verify-fixed/chrome-2026-11-27T06-31-21-469Z.json`: run1 + run2 đều
**−12 KẾT HỢP 10/10, band 10/10, WIDE 10/10**, khớp từng số với LIMITS P4-200 §1.2 (tổng mọi file
trên đĩa 55/60 — các file repro chưa sửa vẫn 8–9/10, đúng chữ ký lạnh F-198-P1-2). **N12a ĐẠT theo
thước mới (a4)-199: autocorr + wide.** Caveat: wide 10/10 này là dữ liệu P1-199 (code PSOLA có thể
đã đổi ở P1-201 — render201/vowelwide đang chạy; khi P1-201 publish headed JSON thì chạy lại
script, tự tìm round201-p1 trước). Nợ harness 202.

## 2. N10 / N5b — xác minh độc lập P2-201: ĐẠT, khớp từng số với đợt 200

| check | MAD preview-201 | MAD tap | R_rel | verdict |
|---|---|---|---|---|
| N10 (fixture chuyển động) | **6,126** | 6,243 | **0,082** | ĐẠT |
| N5b (fixture tĩnh) | **6,810** | 6,855 | **0,109** | ĐẠT |

Khớp từng số với harness 200 (6,126/0,082 + 6,810/0,109). N5d ĐẠT. P2-201 KHÔNG chạy lại sim
N10/N5b đợt này (nhiệm vụ là m-cap + ghim biên) — verdict chính thức thuộc harness này.
**Caveat m-cap:** N10/N5b đo ở cap ship 1,12 (m ≈ 1,0 trên fixture này — xem §4.3); nếu parent
duyệt cap 1,05 thì P2-202 đo lại sim N10/N5b (nợ đã ghi ở LIMITS P2-201 §6).

## 3. N11a / N11b — harness lại trên dữ liệu P3-200 (dữ liệu NHIỆM VỤ, quyết (r)-200)

Harness tìm 201 trước, rồi 200, rồi 199 — lúc chạy final, P3-201 mới chỉ publish probe chirp
(`audio-probe-201-chirp-70s.json`, 15:26Z, chưa có `audio-waveform-201-*.json`) nên mọi record
N11 đều từ **dữ liệu thô P3-200** (`hidden_files/round200-p3/`, ghi rõ `data_round: 200` trong
từng record). Mọi số median/p90/max dưới đây P4 tính lại độc lập từ JSON thô và KHỚP TỪNG SỐ
với LIMITS P3-200 (trừ longA-200, xem §3.3 — harness đếm khác P3 ở cách đếm transient).

### 3.1 N11b — decode từng phần: ĐẠT cả 4 pass (bar 5.000 ms, theo timing P3 headed)

| pass | decode cửa sổ đầu / cuối (ms) | load tới loaded=1 (ms) | ffmpeg audio-only |
|---|---|---|---|
| chirp-70s | 326 / 326 | 484 | 0,28 s |
| longA sạch (rerun) | 2.012 / 1.538 | 3.639 | 1,14 s |
| longA nhiễu tải (load 4,4) | 3.720 / **5.372** | 5.419 | 1,30 s |
| longB | 701 / 2.073 | 845 | 1,07 s |

(ffmpeg audio-only là timing đo lại đợt này — chênh đợt 200 do tải máy lúc đo, KHÔNG phải verdict;
verdict theo timing P3 headed lastWindowDecodeMs; xem §3.4 về con số 5.372 ms.)

### 3.2 N11a-longB — ĐẠT (cờ hold ĐÃ GỠ — F-201-P4-1)

| pass | median S2 | p90 S2 | max S2 | in-pass | mẫu > 0,5 s (thô / S2) |
|---|---|---|---|---|---|
| B longB (100 ms, 200) | **0,096** | **0,230** | **0,419** | 1138/1150 | 2 / **0** |

**longB — ĐẠT.** Không còn mẫu clean nào vượt bar (max 0,419 s < 0,5 s); 2 mẫu raw vượt bar đều là
đuôi freeze đã bị S2 lọc (idx743 +0,607, idx983 +0,663 — xem LIMITS P3-200 §2.4). Đây chính là
verdict mà parent đã đảo quyết ở (a5)-200; harness 201 chỉ gỡ cờ và chạy lại luật thuần.

**F-201-P4-1 (gỡ cờ):** khối `parentHoldLongB` trong `parityHarness201.ts` đã xóa — verdict nay =
`ruleVerdict` thuần (`n11aVerdict201`); khóa số `parent_hold_199_longB` giữ lại = 0 trong report
để lineage so được giữa các đợt. Test mới khóa trường hợp longB trên thước S2
(`n11aVerdict201(2.756, 1, true) === "ĐẠT"` — 1 mẫu đầu vượt; `n11aVerdict201(0.419, 0, false)`
— clean max longB-200).

### 3.3 N11a-longA — CHƯA ĐẠT theo luật đếm mẫu (F-201-P4-4 — CẦN PARENT QUYẾT)

| pass | median S2 | p90 S2 | max S2 | in-pass | mẫu > 0,5 s (thô / S2) |
|---|---|---|---|---|---|
| A longA sạch (rerun, 200) | **0,063** | **0,174** | **0,744** | 334/400 | 4 / **4** |
| A longA nhiễu tải (load 4,4) | **0,089** | **0,233** | **0,585** | 270/400 | 4 / **4** |

**longA — CHƯA ĐẠT theo luật khóa `n11aVerdict201`** (đếm MẪU: chỉ ĐẠT khi đúng 1 mẫu vượt và là
mẫu sounding đầu tiên). Median/p90 đều xanh; max 0,744 s là transient khởi động tại cap đầu
(hold 2,47 s — P3-200 §3 đã nêu, áp tiền lệ (a5)-198 "1 transient tại cap không làm fail verdict").

**F-201-P4-4 (phát hiện mới — mâu thuẫn đếm MẪU vs đếm SỰ KIỆN):** P4 kiểm lại độc lập từ JSON thô
(script `longa201_detail.py`, tái hiện đúng luật S1/S2 của harness): **4 mẫu vượt bar S2 ở cả hai
pass đều là idxInPass 0, 1, 2, 3 — LIÊN TIẾP, cùng playhead 300,4 s (playhead ĐÓNG BĂNG), trong
một lần hold duy nhất ở đầu pass** (pass sạch: holdMaxSec 2,47 s, holdStop 114→131, cap kích hoạt
tại idx2 — holdCapStop 0→1; drift −0,585/−0,744/−0,744/−0,744; pass nhiễu: drift
−0,504/−0,504/−0,585/−0,504, holdMaxSec 1,84 s tại các mẫu đó, max pass 2,888 s). Đây là **MỘT
transient khởi động duy nhất** (playhead đứng yên 4 mẫu × 100 ms trong lúc hold), không phải 4
transient độc lập. Luật khóa hiện tại đếm mẫu nên cho CHƯA; tiền lệ (a5)-198 đếm sự kiện ("1
transient tại cap") thì cho ĐẠT. **P4 KHÔNG tự đổi luật** (cùng kỷ luật như longB đợt 200: giữ
CHƯA cho tới khi parent quyết) — **đề xuất parent quyết ở §14.2-201: mở rộng ngoại lệ (a5) từ
"đúng 1 mẫu vượt" thành "đúng 1 CỤM mẫu vượt liên tiếp cùng playhead ở đầu pass"** (cụm = các mẫu
vượt liên tiếp, không có mẫu trong bar xen giữa). Nếu parent duyệt, longA-200 sạch thành ĐẠT
(median 0,063 / p90 0,174 / max-sau-loại-cụm 0,307 s — mẫu vượt tiếp theo lớn nhất sau cụm đầu);
pass nhiễu tải vẫn là dữ liệu nhiễu (P3-200 đã loại — xem §3.4) và không dùng làm verdict chính.
Quyết cuối thuộc parent; harness 202 áp luật mới nếu được duyệt.

### 3.4 Pass longA nhiễu tải — dữ liệu nhiễu, KHÔNG dùng làm verdict chính

Pass `longA-polluted-load44` (P3-200 chạy lúc load1 4,43, đã chạy lại lúc máy rỗi): decode rebuild
**5.372 ms > bar 5.000 ms**, playFalse Δ=3, 7 cap, holdMaxSec 2,888 s — P3-200 đã loại pass này
khỏi verdict N11b (LIMITS P3-200 §3). Harness vẫn ingest file (cùng tag khác, `data_round: 200`)
nên record N11b-decode-time của nó hiện ĐẠT theo timing cửa sổ ĐẦU (3.720 ms ≤ 5.000 ms) — verdict
này chỉ theo cửa sổ đầu, KHÔNG phủ nhận con số rebuild 5.372 ms (ghi rõ trong record; bar tham
chiếu 5.000 ms áp cho decode cửa sổ đầu). Drift của pass nhiễu có cùng chữ ký cụm đầu như pass
sạch (§3.3) — củng cố rằng cụm đầu là hành vi khởi động/cap, không phải nhiễu tải.

### 3.5 Chirp-70s: GHI NHẬN (không verdict, quyết (a4)-196)

Harness tái tính từ waveform-200: median S2 0,041 / p90 0,111 / max 0,184 s, 0 mẫu vượt bar
(bin 0,606 s — thước FFT-2048 thô). Thước này KHÔNG dùng cho file sweep chậm (P3-200 §1.3–1.4:
thước mịn FFT-8192 cho median 0,059–0,070 s). **Đối chiếu độc lập với dữ liệu P3-201 mới:**
probe chirp-70s của P3-201 (15:26Z, FFT-8192, bin 5,38 Hz, 661 mẫu sounding): drift THO median
0,048 / p90 0,137 / max 0,344 s — **ĐẠT bar 0,5 s, đồng thuận với thước mịn P3-200** (median
0,059–0,070 s). P3-201 chưa publish `audio-waveform-201-*.json` nên harness chưa ingest được pass
này — nợ harness 202 (chỉ cần waveform JSON, probe JSON đã có). **Quan sát thêm (không verdict):
probe longA-201 của P3-201 (15:39Z, lấy mẫu ~10 ms, 518 mẫu sounding, playhead 300,3→280,3 s):
drift THO median 0,119 / p90 0,437 / max 0,678 s; S2 y hệt (lag 2, bin 21,53 Hz); holdMaxSec
3,489 s, holdCapStop Δ=5, load cửa sổ đầu 8.215 ms** — max 0,678 s vượt bar trên thước thô/S2
của chính probe này; P3-201 phân tích tiếp (hold-mute + cap dài); harness chỉ ingest khi có
waveform JSON 201.

### 3.6 Sửa F-199-P4-3 (ghi chú cap — đã sửa đợt 200, kiểm lại đợt này)

longB đợt này: **cap CHƯA kích hoạt** (holdCapStop = 0, holdMaxSec 0,290 s) — ghi chú đúng.
longA sạch: cap ĐÃ kích hoạt (holdCapStop_end = 7, holdMaxSec 2,47 s) — ghi chú đúng.

## 4. Boost-lật — XÁC NHẬN ĐỘC LẬP + cap 1,05 XÁC NHẬN (P2-200 §5 / P2-201 §6)

Phương pháp: script mới `round201-p4/scratch/probe-201-p4-boost.mjs` + `probe-201-p4-cap.mjs` —
tính lại từ **file trung gian thô** (`.yuv`/`-clean.rgb`) của P2-200/P2-201, KHÔNG đọc
`probe-*.json` của P2; code đo M/m/α/MAD/R_rel viết mới trong file này (chỉ dùng các hàm nguyên
thủy dùng chung của helpers round198-p2). So sánh với LIMITS P2-201 SAU KHI chạy xong.

### 4.1 Cảnh báo boost-lật: XÁC NHẬN 5/5 — adapt CHƯA, fixed ĐẠT

| Nhóm | meanM | m (f3/f7/f11) | adapt R_rel | fixed R_rel | Kết luận |
|---|---|---|---|---|---|
| Sintel w4s σ=15 | 31,196 | 1,12/1,12/1,12 | **0,171 CHƯA** | **0,110 ĐẠT** | LẬT ✓ |
| Sintel w8s σ=15 | 27,510 | 1,12/1,12/1,12 | **0,162 CHƯA** | **0,126 ĐẠT** | LẬT ✓ |
| pan σ=25 | 17,989 | 1,12/1,12/1,12 | **0,162 CHƯA** | **0,149 ĐẠT** | LẬT ✓ |
| pan σ=22 | 17,353 | 1,116/1,118/1,12 | **0,154 CHƯA** | **0,138 ĐẠT** | LẬT ✓ (mới) |
| Sintel w4s σ=22 | 31,985 | 1,12/1,12/1,12 | **0,163 CHƯA** | **0,133 ĐẠT** | LẬT ✓ (mới) |

Khớp từng số với LIMITS P2-200 §4 (3 mẫu gốc) và P2-201 §0 (2 mẫu mới) — kể cả meanM, M3/7/11,
Mclean, σ̂, α_eff, |ΔR| từng khung. Mẫu hình chung: **m kẹp trên 1,12 ở cả 3 khung** (pan-22:
1,116–1,12); verdict do khung f3 quyết định ở 4/5 ca (pan-25: cả 3 khung đều ~0,15–0,16);
MAD adapt vẫn tốt hơn tap ở mọi ca (gap −0,07…−0,14) — chỉ R_rel lật. **Boost thích nghi lật
verdict R_rel trên nội dung chuyển động nhanh là THẬT, không phải artefact đo của P2.**

### 4.2 Đề xuất cap cố định 1,05 của P2-201: XÁC NHẬN ĐỘC LẬP

| Nhóm | cap 1,12 (ship) | cap 1,10 | cap 1,08 | cap 1,05 | fixed m=1 |
|---|---|---|---|---|---|
| Sintel w4s σ=15 | 0,171 CHƯA | 0,135 ĐẠT | 0,134 | **0,128 ĐẠT** | 0,110 |
| Sintel w8s σ=15 | 0,162 CHƯA | 0,159 CHƯA | 0,152 CHƯA | **0,142 ĐẠT** | 0,126 |
| pan σ=22 | 0,154 CHƯA | 0,152 CHƯA | 0,150 ĐẠT* | **0,145 ĐẠT** | 0,138 |
| Sintel w4s σ=22 | 0,163 CHƯA | 0,158 CHƯA | 0,151 CHƯA | **0,142 ĐẠT** | 0,133 |
| pan σ=25 | 0,162 CHƯA | 0,161 CHƯA | 0,158 CHƯA | 0,154 CHƯA | **0,149 ĐẠT** |
| pan σ=15 (đối chứng) | 0,105 ĐẠT | 0,105 | 0,099 | 0,097 | 0,080 |

(* pan-22 cap 1,08 = 0,150 đúng bar, biên 0 — không an toàn; chỉ cap 1,05 cho biên thật.)
Khớp từng số với LIMITS P2-201 §0/§4 — kể cả MAD từng cap (w4s-15 cap1,05 MAD 4,855; w8s-15
cap1,05 MAD 5,069). **Cap 1,05 sửa được cả 4 ca lật mà cap có thể sửa** (w4s/w8s σ=15, pan-22,
w4s-22); **lợi ích adapt KHÔNG mất** — MAD adapt ở cap 1,05 vẫn tốt hơn tap ở mọi nhóm (gap
−0,068 w4s-15; −0,107 w8s-15; −0,099 pan-22; −0,082 w4s-22). **pan σ=25: KHÔNG cap nào sửa
được** (1,05 → 0,154) — chỉ fixed m=1 ĐẠT (0,149, biên 0,001); σ=25 ngoài phạm vi hiệu lực
[10, 20] nên đây là lỗi hiệu chuẩn thước, không phải lỗi boost — đồng thuận với P2-201 §0.
**P4 đồng thuận đề xuất cap cố định 1,05** (đổi 1 hằng số, chờ parent quyết — P4 KHÔNG tự đổi
code; N10/N5b cần đo lại ở cap mới trước khi ship — nợ P2-202 đã ghi).

### 4.3 Biên σ 8/9/22 — ghim cứng, khớp P2-201 từng số

| Nhóm | σ=8 (adapt / tap) | σ=9 (adapt / tap) | σ=22 (adapt / tap) |
|---|---|---|---|
| BBB w0s | **0,179 CHƯA** / 0,179 | **0,155 CHƯA** / 0,156 | **0,156 CHƯA** / 0,155 |
| BBB pan | 0,067 ĐẠT / 0,036 | 0,065 ĐẠT / 0,037 | **0,154 CHƯA** / 0,138 (fixed 0,138 ĐẠT) |
| Sintel w0s | 0,103 ĐẠT / 0,103 | 0,089 ĐẠT / 0,089 | 0,120 ĐẠT / 0,109 |

- **w0s σ=8/9/22: adapt = fixed (m = 1,0 ở σ=8/9; 1,018 ở σ=22)** — biên là hiệu chuẩn thước,
  KHÔNG phải lỗi boost (khác với pan-22/w4s-22 ở §4.1, nơi boost lật). Tap FAIL y hệt ở cả 3
  điểm (0,179/0,156/0,155) — thước chưa hiệu chuẩn ngoài dải, không phải lỗi estimator.
- **Biên cứng trên BBB w0s: [~9,2; ~20,7]** (nội suy: σ=9 → 0,155, σ=10 → 0,134 cắt bar tại
  ~9,2; σ=20 → 0,147, σ=22 → 0,156 cắt bar tại ~20,7) — khớp đúng số P2-201 §0.
  **Phạm vi hiệu lực σ ∈ [10, 20] ĐỨNG**, biên an toàn ~0,8 phía dưới / ~0,7 phía trên.
- Sintel w0s ĐẠT ở cả 3 điểm biên (R_truth nhỏ 3,9–8,8) — biên phụ thuộc nội dung, đúng kết luận
  đợt 200: cùng |ΔR| ~1,5 sẽ fail trên nội dung R_truth lớn và pass trên nội dung R_truth nhỏ.
- **F-201-P4-2 (lỗi log của P2-201, không ảnh hưởng verdict):** `probe-201-p2.log` in
  "tapRrel worst=NaN" ở mọi nhóm phần B. Nguyên nhân: dòng log đọc trường `tapRrel` không tồn
  tại trong cấu trúc row (row chỉ có `rOutTap`/`dRTap`/`rTruth`); dữ liệu gốc vẫn đủ — tính
  `dRTap/rTruth` từ chính JSON của P2-201 cho đúng số tap của P4 (0,179/0,156/0,155 ở w0s;
  0,036/0,037/0,138 ở pan; 0,103/0,089/0,109 ở Sintel w0s) và khớp từng số với LIMITS P2-201 §0
  (nơi tap đã ghi đúng). Chỉ dòng log sai, không phải số đo sai; P2-202 sửa dòng log là đủ.

## 5. Các check khác

- **N2a: CHƯA ĐẠT, không đổi** — AM 0,534 (bar 0,35); errSt 0,398 (bar 0,5, đạt); sideband 0,16.
  Artifact của fallback 2-delay; đường chính ở N12/N12a/N2-headed. (Đợt thứ 5 liên tiếp không đổi.)
- **N2b, N9a, S1/S2/S3/S4/S5, N4, N5, N5c, S6/S6a, S7/S7b/S7c/S7d, N7, S6b-headed-seek, N6, S8*:
  ĐẠT** (xem report JSON).
- **Headed N1 / N2-headed / N2c / N9b / N12: GHI NHẬN, số rỗng** — P1-201 chưa publish
  `headed-voice201.json` (đang đo render/vowel — `render201.log` "render xong 9.6s" lúc 15:35Z);
  P4 chỉ tái tính độc lập phần N12a-wide (§1.2), không tự suy ra từ số cũ. Nợ harness 202: đọc
  JSON headed thật của P1 khi có.
- **N13: GHI NHẬN** — P2-201 đã đóng cờ (LIMITS P2-201, có claim fps); `media.ts` CÓ trường fps.
  P4 chỉ kiểm file/code + LIMITS, không đo lại headed fps (probe riêng của P2).
- **S6b-reverse-video-boundary: GHI NHẬN** (worst MAD 33,19, offset 1 frame — như 200).
- **R_rel theo σ (harness section, fixture N5b): GHI NHẬN** — worst 0,149/0,095/0,109 ở σ=5/10/15,
  khớp từng số với đợt 200 (fixture không đổi; tap ở σ=5 vượt nhẹ 0,150 như F-200-P4-3).

## 6. Kỷ luật đo yên

T4-201: lượt yên #69, poller mở ~14:53Z, W1 mở 14:56:50Z, đóng 15:00:58Z (**LƯỢT HỢP LỆ** —
attempt1 20/20, lớp B 5/5, tickCost median 50,5 ms; poller thoát ngay sau đó). **P4 KHÔNG chạy
workload nặng nào trong W1**: lần chạy probe boost duy nhất bị lỗi import (không tính toán gì)
dừng ngay 14:57Z; probe boost + cap chạy 15:04:41–15:07:56Z và 15:33–15:34Z (SAU khi W1 đóng);
test 15:16Z, tsc 15:17Z/15:19Z, harness dry-run 15:20–15:21Z — tất cả sau W1. **Một ngoại lệ nhỏ
ghi trung thực: 1 lần sửa text (muse.edit, 1 dòng import) trong file probe scratch của chính P4
lúc ~14:57Z, trong W1** — ghi file nhẹ, không Chrome/tsc/test/vite, không ảnh hưởng đo (T4-201
ghi chồng lấn trong W1 là T2-201 + heartbeat, không nêu P4; P4 tự ghi nhận để T2-201 đối chiếu).
**Không có W2/W3** (poller thoát sau lượt hợp lệ — T4-201 LIMITS). Reboot 15:04:25Z (sau khi
poller thoát) là boot mới #131 — không ảnh hưởng harness (đo node/ffmpeg, không phụ thuộc boot);
thuộc T01/T56 theo dõi.
(Ghi chú (p)(iii)-199: P4 ghi rõ giờ chạy tsc/test/harness của mình ở trên để T2-201 khỏi phải đoán.)

## 7. File đổi (stage, xem paths-loop phase9-round201-p4-parity.txt)

- `apps/web/src/lib/parityHarness201.ts` — harness 201 (copy 200 + gỡ cờ hold (a5)-200 + tìm dữ
  liệu P3-201→200→199 + headed-voice/seek 201). **224.708 B — VƯỢT trần push 37.768 B, cần
  ENABLE_PRIVSEP=0 lúc push** (tăng 220 B so với 200 — gỡ cờ + mở rộng fallback + ghi chú;
  tên biến/khóa số *199 giữ nguyên theo lineage pipeline P2-198 để so trực tiếp giữa các đợt).
- `apps/web/src/lib/parityHarness201.test.ts` — 29 test (28 cũ + 1 mới: longB S2 theo (a5)-200).
- `scripts/parity201-run.mjs`, `scripts/parity201-run-test.mjs` — runner harness + test.
- `apps/web/tsconfig.json` — exclude `parityHarness201.test.ts` (+1 dòng).
- `docs/PHASE9_ROUND201_P4_PARITY_LIMITS.md` — file này.
- KHÔNG PUSH. KHÔNG sửa `PHASE9_GAP_ANALYSIS.md`, aggregate 200/201, MEMORY.md. Scratch +
  report JSON ở `hidden_files/round201-p4/` (không stage) và `hidden_files/parity201/`
  (không stage). Runner 200 + file harness 200 nguyên vẹn (md5 kiểm sau mỗi bước sửa — xem
  F-201-P4-3).

## 8. Phát hiện mới

- **F-201-P4-1** — Gỡ cờ `parent_hold_199_longB` theo quyết (a5)-200: longB ĐẠT trên thước S2
  (0 mẫu vượt, max 0,419 s); harness 201 xác nhận độc lập từ JSON thô P3-200.
- **F-201-P4-2** — Lỗi log của P2-201: "tapRrel worst=NaN" ở mọi nhóm phần B trong
  `probe-201-p2.log` (đọc trường không tồn tại); dữ liệu JSON gốc đủ để tính đúng và LIMITS
  P2-201 đã ghi đúng số tap — chỉ dòng log sai (§4.3).
- **F-201-P4-3 (suýt lỗi thao tác — đã bắt trước khi gây hậu quả):** `sed 's/parity200/parity201/g'`
  trên bản copy runner KHÔNG đổi được đường dẫn bundle (`parityHarness200.test.ts` — chuỗi
  "parity200" không xuất hiện trong "parityHarness200") nên lần chạy test đầu tiên đã bundle
  nhầm file test 200 (28 PASS) thay vì file 201. Phát hiện qua tên test in ra vẫn là
  "n11aVerdict200" + thiếu test mới; đã sửa `parityHarness200→parityHarness201` (+
  `PARITY200_RUN_MAIN→PARITY201_RUN_MAIN`) trên bản copy và chạy lại: **29/29 PASS đúng file
  201**. File 200 không bị đụng (md5 nguyên). Bài học: sau mỗi lần rename bằng sed, grep kiểm
  chứng đường dẫn bundle TRƯỚC khi chạy (F-200-P4-2: copy trước, sửa sau — đợt này đã làm đúng
  nửa đầu, suýt sai nửa sau).
- **F-201-P4-4** — Mâu thuẫn đếm MẪU vs đếm SỰ KIỆN ở longA-200 (§3.3): 4 mẫu vượt bar S2 là 1
  cụm liên tiếp duy nhất ở đầu pass (cùng playhead 300,4 s, 1 lần hold). Luật khóa đếm mẫu →
  CHƯA; tiền lệ (a5)-198 đếm sự kiện → ĐẠT. Chờ parent quyết ở §14.2-201 (đề xuất mở rộng ngoại
  lệ thành "1 cụm liên tiếp cùng playhead ở đầu pass").

## 9. Hạn chế / nợ chuyển đợt 202 (P4-202)

1. N11a-longA: chờ parent quyết F-201-P4-4 ở §14.2-201 (mở rộng ngoại lệ mẫu→cụm hay giữ luật).
2. N11a/N11b: harness lại trên dữ liệu P3-201 khi có `audio-waveform-201-*.json` (probe chirp
   201 đã có — drift mịn 0,048/0,137/0,344 ĐẠT; longA/longB 201 chưa publish lúc đóng cờ).
3. N12a-wide: chạy lại trên headed JSON P1-201 khi có (hiện chỉ có fallback P1-199).
4. m-cap 1,05: nếu parent duyệt, P2-202 đo lại N10/N5b sim ở cap mới (P4-202 đối chiếu harness);
   P4 KHÔNG tự đổi code ship.
5. N2a (fallback 2-delay) không đổi 5 đợt — chỉ là fallback, không chặn đường chính.
6. Headed N1/N2/N2c/N9b/N12: đọc JSON headed thật của P1 thay vì file tổng không ai viết.
7. `tsc --noEmit` còn 1 lỗi trong file test đang làm dở của P3-201 (`reverseAudio201P3.test.ts`
   — `ok` khai mà chưa dùng); thuộc P3-201 sửa, P4 không đụng file luồng khác.
