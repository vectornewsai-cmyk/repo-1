# Đợt 202 P4 — Kiểm chứng độc lập: parity harness (N11a/N11b, N12a-wide, N10/N5b cap 1,05)

**Nhiệm vụ (quyết (a1)/(a4)/(a5)/(r)-201):** (1) harness lại N11a/N11b trên
dữ liệu P3-201/P3-202; (2) chạy lại N12a-wide trên headed JSON P1-201 khi
có; (3) đo lại độc lập N10/N5b với cap 1,05; (4) spot-check ≥1 claim mỗi
luồng P1/P2/P3-202.
**Verdict: harness 54/55 ĐẠT (CHƯA chỉ N2a, không đổi từ đợt 197); 11 GHI
NHẬN. N10/N5b ĐẠT với cap 1,05, khớp sim P2-202 tới 0,001 MAD. N12a
autocorr ĐẠT (0,054 st); wide vẫn dùng dữ liệu P1-199 (55/60) vì P1-201
không publish headed pitch-curve JSON — nợ chưa có. N11a-longA-200 flip
CHƯA → ĐẠT theo quy tắc cụm (a5)-201; longA-201 và longA-202 đều CHƯA ĐẠT
theo thước cơ học (xem §3.3–§3.4 — parent quyết). Ca ngược Sintel w4s
σ=10 của P2-202 ĐÃ XÁC NHẬN ĐỘC LẬP từ file .yuv thô (0,140 → 0,156).**

## §0. Tóm tắt số đo

| Hạng mục | Đợt 201 | Đợt 202 | Thay đổi |
|---|---|---|---|
| Harness tổng | 52/55 ĐẠT | **54/55 ĐẠT** | +2 flip, cả hai do quy tắc cụm (a5)-201 |
| CHƯA ĐẠT | N2a, N11a-longA-200 | **N2a** | longA-200 flip → ĐẠT |
| GHI NHẬN | 11 | 11 | không đổi |
| N10 (cap ship) | 6,126 / 0,082 (cap 1,12) | **6,101 / 0,074 (cap 1,05)** | tốt hơn cả hai thước |
| N5b (cap ship) | 6,810 / 0,109 | **6,810 / 0,109** | y hệt (kẹp không chạm) |
| N12a autocorr tệ nhất | 0,054 st | **0,054 st** | y hệt |
| N12a-wide | 55/60 (dữ liệu 199) | **55/60 (vẫn dữ liệu 199)** | chưa có JSON P1-201 |
| N11b decode tệ nhất (harness) | 3.720 ms (polluted-200) | **3.720 ms** | dữ liệu waveform vẫn đợt 200 |

- Runner harness 202: exit 1 (đúng kỳ vọng — 1 CHƯA), report
  `hidden_files/parity202/parity202-report.json` tạo 2026-11-27T21:09:14Z.
- `npx tsc --noEmit` (apps/web): **0 lỗi** (chạy ~21:01Z). Test harness
  202: **29/29 PASS**.
- P2-202 cũng chạy lại `parityHarness202.test.ts`: 29/29 PASS (LIMITS
  P2-202 §5) — khớp chạy của P4.

## §1. N12a — autocorr ĐẠT; wide vẫn nợ JSON P1-201

### 1.1 Autocorr (sim, dữ liệu sẵn có)

N12a-psola-sim **ĐẠT**: autocorr tệ nhất ở −12 là **0,0542 st** (bar
0,1 st), gate_fail **0/20**, nan 0, weak_fundamental 3/20. Y hệt
199/200/201 (0,054 st) — sim ổn định qua 4 đợt. Tỉ số mag ở −12 vẫn
1,98–3,02 (chỉ ghi nhận thông tin, không phải điều kiện flip theo
quyết parent đợt 199).

### 1.2 Wide — CHƯA CÓ headed JSON P1-201, dùng lại dữ liệu 199

- **Không có file `chrome-*.json` nào trong `round202-p1` hay
  `round201-p1`** — P1-201 không publish headed pitch-curve JSON.
  P1-202 tới lúc viết LIMITS này cũng chỉ publish
  `core-notch-stats202.json` + `ab202/` (WAV) + `harness/` + `scratch/`
  — không có pitch-curve JSON.
- `vowelwide201.json` của P1-201 là dữ liệu vowel-test (f0 100, f0t 50,
  tsOld/tsNew), KHÔNG phải pitch-curve — không dùng được cho gate
  wide −12. Nó hỗ trợ claim fMin 80 → 50 Hz của P1-201 (tsNew errSt
  ~0,004 ở f0t 50).
- Chạy lại wide-rederive trên dữ liệu round199-p1 (11 file,
  `scratch/wide-rederive-202.mjs`): **tổng −12 KẾT HỢP 55/60, band
  55/60, WIDE 55/60; file verify-fixed 10/10 cả hai lần chạy.** Y hệt
  đợt 201. **Nợ: N12a-wide trên headed JSON P1-201 vẫn CHƯA CÓ** — cần
  P1 publish pitch-curve JSON (hoặc parent ghi nhận wide vẫn treo trên
  dữ liệu 199).

## §2. N10/N5b với cap 1,05 — ĐẠT, khớp sim P2-202

Harness 202 chạy với cap ship 1,05 (P2-202 đã đổi
`DENOISE_MOTION_MULTIPLIER_MAX` 1,12 → 1,05 trong
`apps/web/src/lib/enhancePreview.ts`), đồng thời giữ biến thể tham chiếu
cap-1,12 (`motionMultiplierCap112`, tính lại m từ neo P2 rồi kẹp
[1,0; 1,12]) để so sánh trong cùng một lần chạy.

| Fixture | cap 1,12 (tham chiếu, tái hiện 201) | cap 1,05 (ship) | P2-202 sim cap 1,05 |
|---|---|---|---|
| N10 | 6,126 / 0,082 ĐẠT (m 1,093/1,091/1,056) | **6,101 / 0,074 ĐẠT** (m 1,05/1,05/1,05) | 6,102 / 0,074 ĐẠT |
| N5b | 6,810 / 0,109 ĐẠT (m 1,012/1,0/1,0) | **6,810 / 0,109 ĐẠT** (m 1,012/1,0/1,0) | 6,810 / 0,109 ĐẠT |

- **N10:** MAD từng khung của P4 (6,188/6,239/5,878) khớp từng số với
  P2-202 (6,188/6,239/5,878) tới 3 chữ số thập phân; trung bình P4
  6,10148 → 6,101, P2 6,102 — chênh **0,001 do làm tròn** (P2 làm tròn
  từng khung rồi mới trung bình: (6,188+6,239+5,878)/3 = 6,10167 →
  6,102). R_rel 0,074 cả hai. **Khớp.**
- **N5b:** từng khung 6,796/6,842/6,793 khớp P2 y hệt; trung bình
  6,810 cả hai; kẹp không chạm (m ≤ 1,012). **Khớp từng số.**
- N5d **ĐẠT** (plan multiplier ở M=13,803 là 1,05; α plan 0,509).
- Kết luận: cap 1,05 cải thiện N10 (MAD −0,025, R_rel −0,008 so với
  cap 1,12) và không đổi N5b — đúng kỳ vọng duyệt (a1)-201. Sim P2-202
  đáng tin (đã khớp harness P4 độc lập tới 0,001).

## §3. N11a/N11b — harness lại trên dữ liệu P3-201/P3-202

### 3.1 Thay đổi harness 202 (so với 201)

- **Quy tắc cụm (a5)-201:** thêm `n11aVerdict202` — các mẫu S2 vượt bar
  liên tiếp (theo idxInPass) gộp thành 1 cụm; verdict ĐẠT nếu chỉ có
  1 cụm, cụm đó ở đầu pass (idxInPass 0) và cùng một playhead. Report
  ghi thêm `n_over_bar_clusters`, `first_cluster_at_start`,
  `first_cluster_same_playhead`, `first_cluster_count`.
- **Biến thể tham chiếu cap-1,12** cho N10/N5b (xem §2).
- **N5d literal 1,08 → 1,05** (theo hằng số ship mới).
- **Sửa lỗi trộn probe-counter (F-202-P4-2, xem §8):** probe lookup nay
  ưu tiên đúng đợt của waveform trước.
- **Sửa quirk hiển thị:** `record()` trước đây in `[CHƯA]` cho cả
  GHI NHẬN; nay in `[GHI]`. Số đếm trong report JSON vốn đã đúng.
- Tìm dữ liệu theo thứ tự 202 → 201 → 200 → 199 (waveform + probe +
  decode-probe). `tsc` 0 lỗi, test 29/29 PASS.

### 3.2 Harness waveform-200 (dữ liệu mới nhất có waveform JSON)

P3-202 chưa publish waveform JSON đợt 202 nên harness vẫn chạy trên dữ
liệu waveform đợt 200 (như đợt 201).

| Check | Verdict 202 | Số đo chính |
|---|---|---|
| N11a chirp-70s | GHI NHẬN (fixture) | 0 vượt bar; drift max S2 0,184 s |
| N11a longA-300s | **ĐẠT** (flip từ CHƯA-201) | 4 mẫu vượt bar, **1 cụm**, idxInPass 0, cùng playhead **300,4 s**, drift −0,585/−0,744/−0,744/−0,744; median S2 0,063, p90 0,174 |
| N11a longA-polluted-load44 | **ĐẠT** (flip từ CHƯA-201) | cùng dạng (1 cụm đầu pass); median 0,089, p90 0,233 — dữ liệu polluted vẫn bị loại khỏi kết luận như LIMITS 201 §3.4 |
| N11a longB-300s | **ĐẠT** | 0 vượt bar; max S2 0,419 s |
| N11b chirp | ĐẠT | decode cửa sổ đầu **326 ms** (bar 5.000 ms) |
| N11b longA | ĐẠT | decode cửa sổ đầu **2.012 ms**; rebuild 5.372 ms (ghi nhận) |
| N11b longA-polluted | ĐẠT | decode cửa sổ đầu **3.720 ms** |
| N11b longB | ĐẠT | decode cửa sổ đầu **701 ms** |

Cả hai flip đều là hệ quả trực tiếp của quy tắc cụm (a5)-201: longA-200
có đúng 1 cụm 4 mẫu liên tiếp ở đầu pass, cùng playhead 300,4 s — đúng
định nghĩa "1 cụm liên tiếp cùng playhead ở đầu pass = 1 sự kiện".

### 3.3 Probe-201 — longA-201: CHƯA ĐẠT theo thước cơ học (parent quyết)

Phân tích lại probe headed P3-201 bằng cùng logic S1/S2 + cụm của
harness (`scratch/probe201-n11.mjs`, ra `round202-p4/probe201-n11.json`).
Script tái hiện đúng từng số P4-201/P3-201 (chirp THO 0,048/0,137/0,344;
longA THO 0,119/0,437/0,678; LOC-S2 lag 2 của P3-201 khớp S2 của P4).

| Pass 201 | N11a | N11b |
|---|---|---|
| chirp-70s | GHI NHẬN (fixture): 0 vượt bar; holdMaxSec 0,752; holdCapStop 1 | **ĐẠT**: decode 1.840 ms |
| longA-300s | **CHƯA ĐẠT**: 32 mẫu S2 vượt bar, **1 cụm**, cùng playhead **300,3 s** (đóng băng), nhưng cụm bắt đầu ở **idxInPass 10** (dense) / idx 2 (thinned) — 10 mẫu sounding đầu tiên trong bar (drift −0,359/−0,437) trong lúc peakHz decay 2993 → 2907 Hz theo bước ~21,5 Hz giữa hold (holdMaxSec 3,489 đã đặt từ idx 0) | **CHƯA ĐẠT**: decode cửa sổ đầu **6.401 ms** > bar 5.000 ms, dưới tải nặng (loadavg 3,3–4,4) |

- **Điểm cần parent phán:** cụm longA-201 về mặt vật lý là MỘT transient
  khởi động duy nhất ở playhead đầu pass (giống hệt longA-200), nhưng
  nó **trượt quy tắc idx-0 nghiêm ngặt của (a5)-201** vì 10 mẫu trong
  bar đứng trước. Chênh lệch idx-0 giữa longA-200 (cụm bắt đầu idx 0)
  và longA-201 (idx 10) có thể chỉ là artifact pha lấy mẫu (dense
  ~18 ms). P4 trình cả hai cách đọc, **không tự quyết**: (i) theo chữ
  (a5)-201 — CHƯA ĐẠT; (ii) theo bản chất "1 cụm / 1 playhead / đầu
  pass" — cùng lớp với longA-200 đã ĐẠT.
- Decode 6.401 ms: cùng tiền lệ pass polluted — vượt bar dưới tải nặng,
  parent quyết có loại như dữ liệu polluted hay không. Lưu ý: log probe
  ghi "load cửa sổ đầu 8.215 ms" là **một đại lượng khác** với
  `lastWindowDecodeMs` 6.401 ms (load-to-ready vs decode) — không lẫn.
- Probe log P3-201 ghi holdCapStop Δ=5 cho longA-201; harness 202 đọc
  đúng counters của pass này (xem F-202-P4-2).

### 3.4 Probe-202 — C3-loop: im lặng hết, drift longA vẫn CHƯA

Phân tích probe headed P3-202 (C3-loop) bằng cùng script
(`round202-p4/probe202-n11.json`). Số drift/decode khớp từng số với
LIMITS P3-202 §3 (§5.3 đối chiếu).

| Pass 202 | N11a | N11b |
|---|---|---|
| chirp-70s | GHI NHẬN (fixture): THO **0,074/0,189/0,444**, 0 vượt bar; holdMaxSec 0,749; **holdLoopRestart 1, holdCapStop 0** (cap đã bỏ theo thiết kế) | **ĐẠT**: decode **3.974 ms** |
| longA-300s | **CHƯA ĐẠT**: THO **0,159/0,537/0,696** (p90 vượt bar; tệ hơn 201: 0,119/0,437/0,678); **55 mẫu S2 vượt bar trong 6 cụm, TẤT CẢ ở playhead 290,4 s** (biên keyframe — 6 lần hold riêng tại một playhead đóng băng); ph đi 298,4 → 281,2 (pass bắt đầu giữa chừng, không phải 300,3) | **CHƯA ĐẠT**: decode **11.902 ms** > bar 5.000 ms, dưới tải nặng (load 7–8) |

- **C3-loop làm đúng việc của nó (hết im lặng — xem §5.3) nhưng KHÔNG
  sửa drift ở biên keyframe:** 6 cụm đều ở cùng một playhead 290,4 s
  nhưng tách nhau bởi các mẫu trong bar — không thỏa quy tắc cụm
  (a5)-201 (quy tắc chỉ cứu 1 cụm ở đầu pass). P3-202 §4.2 cũng ghi:
  trong hold dài có lặp, peakHz quay vòng trong đoạn 0,5 s trong khi
  playhead đứng yên, nên drift suy từ peakHz không còn là đồng hồ
  sạch — muốn verdict chặt cần thước drift cấp waveform (nợ, §9).
- Counters longA-202: tick 573, holdStop 371, holdKeep 177,
  holdCapStop 0, **holdLoopRestart 10**, restart 49, restartExact 0,
  playOk 60, playFalse 0 — khớp LIMITS P3-202 §3.3.
- Decode longA 11.902 ms dưới tải 7–8 (gấp 2–3× tải longA-201): P3-202
  đề nghị đo lại dưới tải thường mới kết luận — P4 đồng ý, ghi CHƯA
  ĐẠT về thời gian dưới tải này, không kết luận hồi quy code.

## §4. Kiểm chứng cap — ca ngược w4s σ=10 ĐÃ XÁC NHẬN ĐỘC LẬP

P2-202 §4 báo cáo trường hợp ngược duy nhất: Sintel w4s σ=10, cap 1,05
làm tệ hơn cap 1,12 (0,140 → 0,156, vượt bar 0,006). P4 tính lại
**từ file trung gian thô** (`round202-p2/sintel-w4s-s10-inter.yuv` /
`-truth.yuv`, KHÔNG đọc `probe-202-p2.json`) bằng script
`scratch/probe202-p4-w4s.mjs` (kế thừa phương pháp cap đợt 201), kèm
2 nhóm đối chiếu dương w4s-s15/s22:

| Nhóm | cap 1,12 (P4 tính lại) | cap 1,05 (P4 tính lại) | fixed m=1 | P2-202 báo cáo |
|---|---|---|---|---|
| w4s-s10 | 4,132 / **0,140 ĐẠT** | 4,112 / **0,156 CHƯA** | 4,195 / 0,165 CHƯA | 4,132/0,140 ĐẠT → 4,112/0,156 CHƯA |
| w4s-s15 | 4,795 / 0,171 CHƯA | 4,855 / **0,128 ĐẠT** | 4,857 / 0,110 ĐẠT | 0,171 CHƯA → 0,128 ĐẠT |
| w4s-s22 | 6,108 / 0,163 CHƯA | 6,144 / **0,142 ĐẠT** | 6,163 / 0,133 ĐẠT | 0,163 CHƯA → 0,142 ĐẠT |

- **Khớp từng số tới 3 chữ số thập phân** ở cả 3 nhóm, cả 3 biến thể
  (MAD và R_rel worst), M3711 khớp y hệt (s10: 32,697/19,823/27,018).
  **Ca ngược w4s-s10 là THẬT, không phải lỗi đo của P2.**
- Cơ chế (P2-202 §4, P4 xác nhận số): khung f11 có R_out > R_truth
  (cap 1,12: R_out 5,163 vs R_truth 4,531; cap 1,05: 5,237; fixed:
  5,277) — preview THIẾU làm mịn so với truth ở khung này, hạ m càng
  đẩy R_out ra xa truth. Ngược dấu với các ca lật đợt 201 (R_out <
  R_truth, thừa làm mịn). Cap 1,05 sửa được lỗi thừa-mịn nhưng làm
  nặng thêm lỗi thiếu-mịn — cùng một khung có thể lật theo cả hai
  hướng tùy α.
- Mức độ: chỉ vượt bar 0,006, 1 khung trong 3 khung đo; MAD của nhóm
  vẫn tốt nhất trong các cap (4,112 vs 4,132 cap cũ). Verdict ròng của
  cap 1,05 trên 36 nhóm vẫn tốt hơn (29/36 vs 27/36 — P2-202 §0).
  Nợ: chưa có cách phân biệt trước hai hướng lật (cần ước lượng dấu
  R_out − R_truth theo σ̂/M từng khung — P2-203/P4-203).

## §5. Kiểm chứng độc lập các luồng P1/P2/P3-202

### 5.1 P1-202 — notch: hướng đúng, độ sâu chưa xác nhận bằng thước thô

P1-202 chưa publish LIMITS doc tới lúc P4 viết (chỉ có
`core-notch-stats202.json` + `ab202/` WAV + `scratch/exp202.log`).
P4 spot-check cặp WAV `core50notch-m12` vs `core50nonotch-m12`
(3 giọng) bằng FFT độc lập (f0 ước lượng bằng autocorr, đo H3/H1
tại 1 cửa sổ 8192 mẫu):

| Giọng | f0 ước lượng | H3−H1 nonotch | H3−H1 notch | ΔH3 (notch − nonotch) |
|---|---|---|---|---|
| haidang | ~73,3 Hz | −5,0 dB | −5,6 dB | **−0,6 dB** |
| maianh | ~109,3 Hz | −1,0 dB | −2,5 dB | **−1,6 dB** |
| quangson | ~70,8 Hz | −7,6 dB | −15,1 dB | **−7,5 dB** |

- **Hướng đúng:** notch triệt H3 ở cả 3 giọng (ΔH3 đều âm).
- **Độ sâu chưa xác nhận bằng thước này:** ΔH3 đo được (−0,6/−1,6/
  −7,5 dB) nhỏ hơn nhiều so với depth median P1 ghi
  (`core-notch-stats202.json`: 9,095/11,383/5,952 dB;
  `exp202.log` k05: 9,68/11,82/6,20 dB). Thước của P4 là thô (1 cửa
  sổ duy nhất, f0 ước lượng thô bằng autocorr trên 2 s đầu, không
  median theo khung, không theo dõi f0 từng khung như P1) — chênh
  lệch có thể do phương pháp, không kết luận P1 sai. **Ghi nhận:
  claim notch cần P1-202 LIMITS + số đo theo khung của P1 để đối
  chiếu chặt; P4 chỉ xác nhận hướng triệt H3.**
- Hỗ trợ claim fMin 80 → 50 Hz của P1-201 (không phải 202):
  `vowelwide201.json` cho tsNew errSt ~0,004 ở f0t 50 Hz.

### 5.2 P2-202 — N10/N5b + quét σ: khớp từng số; ca ngược đã xác nhận

- N10/N5b sim khớp harness P4 (xem §2; chênh MAD 0,001 do làm tròn).
- Quét σ 36 nhóm: P4 tính lại độc lập 3 nhóm w4s (s10/s15/s22) từ
  file .yuv thô — khớp từng số tới 3 chữ số (xem §4). Ca ngược
  w4s-s10 là thật.
- P2-202 §5: tsc 1 lỗi TS6133 ở `reverseAudio202P3.test.ts` lúc
  20:52Z — **đã được P3-202 sửa trước khi P4 chạy tsc ~21:01Z
  (0 lỗi)**; không còn tồn tại lúc P4 kiểm.
- P2-202 §5: vite build PASS 11,42 s; test 335/335 + harness202
  29/29. P4 không chạy lại vite (không cần — harness + tsc + test
  đã đủ cho phạm vi P4).
- P2-202 §1: 5 file test cập nhật kỳ vọng theo hằng số mới — P4 xác
  minh trên đĩa: cả 4 file `parityHarness198/199/200/201.test.ts`
  nay đều kỳ vọng m(13,803) = 1,05 và m(100) = 1,05 (xem §8,
  F-202-P4-1 đã sửa xong). P2 không chạm file harness202 của P4
  (mtime `parityHarness202.test.ts` 20:54:23Z là của P4).

### 5.3 P3-202 — C3-loop: khớp từng số; im lặng dài hết

Đối chiếu LIMITS P3-202 với dữ liệu gốc (không chỉ đọc LIMITS):

- **Im lặng tuyệt đối sau tiếng đầu:** đếm lại từ
  `audio-probe-202-*.json` — chirp **0 record** RMS=0 (201: 29),
  longA **1 record** (idx 606, đơn lẻ; 201: 363). **Khớp P3 §3.1.**
- **Sim C3-real-adv:** `sim202-summary.json` cho đúng 7 gap với
  startMs/durMs/phAt khớp từng số với C3-exp-201: (0; 207,6),
  (1357,7; 31,5), (3148,5; 17,8), (3665,9; 13,5), (4841,4; 14,1),
  (7804,1; 27,3), (9519,5; 8,3); tổng trừ startup 112,5 ms, max
  31,5 ms. **Khớp P3 §2 — port chính xác.**
- **Drift/decode headed:** chirp THO 0,074/0,189/0,444, decode
  3.974 ms; longA THO 0,159/0,537/0,696, decode 11.902 ms;
  holdLoopRestart chirp 1 / longA 10, holdCapStop 0 cả hai pass.
  **Khớp từng số với P3 §3.2–§3.3.**
- **Caveat bundle (§6.2.1 P3):** pass longA chạy trên bundle
  `index-FqY8HE0R.js` (P2 rebuild 20:57Z) thay vì bundle của P3
  (`index-2ABRRWrg.js`); P3 đã xác minh bundle này chứa chuỗi
  `holdLoopRestart` + counters headed cho hành vi C3. P4 ghi nhận
  caveat, không phản bác số đo longA.
- **F-201-P3-2 (gap nối đoạn):** sim cho gap còn lại 8,3–31,5 ms —
  P4 xác nhận từ `sim202-summary.json`; headed chỉ còn sự kiện
  p_zcr ngắn, không im lặng dài. **Đã xác nhận, vẫn nghe được
  (≫ ngưỡng tai 3 ms) — nợ sửa, §9.**
- P3-202 §6.1: tsc 0 lỗi (sau khi sửa lỗi `t`); unit test mới
  `reverseAudio202P3.test.ts` 7/7 PASS; suite reverse 215 test PASS.
  P4 chạy tsc độc lập: 0 lỗi (khớp).

### 5.4 Các check khác trong harness

- **N2a-pitch-artifact-440: CHƯA ĐẠT (đợt thứ 6 liên tiếp).**
  worst_err_st 0,398 (tệ nhất ở −12: domFreq 215 Hz, err −0,398 st),
  worst_AM_depth **0,534**, sideband ratio 0,160. Không đổi so với
  201 (AM 0,534) — nợ lâu năm, chưa có hướng sửa trong đợt này.
- **N2b-220: ĐẠT.** N9a/N12a sim: ĐẠT. N5/N5b/N5c/N5d: ĐẠT.
- **R_rel theo σ (harness, fixture N5b):** σ=5 worst 0,149; σ=10
  worst 0,095; σ=15 worst 0,109 — GHI NHẬN (không phải verdict;
  fixture đơn, khác footage thật của P2-202 §3).
- **N13 (fps source media): GHI NHẬN.** Các check headed giọng
  (N1/N2/N2c/N9b/N12): GHI NHẬN — không có `headed-voice202.json`
  (P1-202 chưa publish headed voice JSON).
- **S6/S7/S8/N6/N7/N11b-logic:** ĐẠT (không đổi so với 201).

## §6. Phối hợp T4 (đo yên #70) — 0 VI PHẠM

P4 kiểm file `hidden_files/round202-t4/W1-ACTIVE` TRƯỚC MỖI lệnh nặng,
đúng brief:

- ~21:01Z (trước tsc) — không có; 21:03Z (trước harness run 2) —
  không có; 21:07Z (trước harness run 3) — không có; 21:09Z (trước
  harness run cuối) — không có; ~21:21Z (trước tính lại w4s) —
  không có; ~21:2xZ (trước phân tích WAV P1) — không có.
- Suốt phiên P4, thư mục `round202-t4` chưa từng xuất hiện file
  W1-ACTIVE (kiểm lại 21:16Z: không có). **P4 tự báo: 0 chồng lấn
  W1 đợt này.** Các lệnh nhẹ (đọc file, python trích JSON) không
  tính là lệnh nặng và đều ngoài cửa sổ yên nếu có.
- Ghi nhận: P2-202 §6 và P3-202 không báo vi phạm W1 trong đợt này.

## §7. File stage (batch phase9-round202-p4-parity.txt)

- `apps/web/src/lib/parityHarness202.ts` (~221 KB — **vượt ngưỡng
  37.768 B**, cần ENABLE_PRIVSEP=0 lúc push, như đợt 201)
- `apps/web/src/lib/parityHarness202.test.ts`
- `scripts/parity202-run.mjs`
- `scripts/parity202-run-test.mjs`
- `apps/web/tsconfig.json` (+1 dòng exclude test harness 202)
- `docs/PHASE9_ROUND202_P4_PARITY_LIMITS.md` (file này)

Không stage binary/wav/yuv/json đo (chỉ ở `hidden_files/round202-p4/`
+ `hidden_files/parity202/`).
Thư mục làm việc: `hidden_files/round202-p4/` — `scratch/`
(rename201to202.py, patch202.py, md5-201-before.txt,
wide-rederive-202.mjs/.log, probe201-n11.mjs/.log,
probe202-n11.mjs/.log, probe202-p4-w4s.mjs/.log, parity202-run*.log),
`probe201-n11.json`, `probe202-n11.json`, `probe202-p4-w4s.json`;
report harness: `hidden_files/parity202/parity202-report.json`.

## §8. Phát hiện mới

### F-202-P4-1 — P2-202 sửa file test của P4-201 (đã sửa xong, không còn tồn tại)

P2-202 đổi hằng số kẹp trong `enhancePreview.ts` lúc 20:43:20Z, rồi sửa
`parityHarness201.test.ts` lúc 20:43:27Z: đổi kỳ vọng m(100) 1,12 →
1,05 và tên test sang kẹp [1,0; 1,05], nhưng **lúc đó chưa đổi**
assertion m(13,803) ≈ 1,08 — với cap mới assertion này sai
(m(13,803) = 1,05). P4 đọc file lúc ~20:47Z và ghi nhận mâu thuẫn.
**P2 đã tự sửa trong lượt test lại:** mtime cả 4 file
`parityHarness198/199/200/201.test.ts` đều là 20:55:14Z, nay tất cả
đều kỳ vọng m(13,803) = 1,05 và m(100) = 1,05; P2 §5 báo harness
198–201 test 107/107 PASS. **Kết luận: lỗi nhất thời, đã sửa xong
trước khi P2 đóng; không còn tồn tại lúc P4 kiểm cuối.** P2 không
chạm `parityHarness201.ts` (mtime 15:18:22Z không đổi) và không chạm
file harness202 của P4.

### F-202-P4-2 — Trộn probe-counter theo đợt (tồn tại từ 201, đã sửa trong harness 202)

Harness 201 trở về trước tra probe theo "đợt mới nhất" bất kể waveform
thuộc đợt nào, nên record waveform-200 nhận countersEnd của probe-201
(201: longA tick_end 994, holdCapStop_end 5) hoặc probe-202 (lần chạy
đầu của P4-202: tick_end 573, holdCapStop_end 0 — khiến ghi chú lúc
đó viết sai "cap CHƯA kích hoạt" cho pass longA-200, trong khi mẫu
của chính pass đó cho holdCapStop delta 7). Harness 202 sửa: tra probe
theo đúng đợt của waveform trước (vòng lặp đợt ngoài, thư mục trong).
Lần chạy cuối ghép đúng (longA tick 1803, holdCapStop 7, load 3639 ms).
Lưu ý: LIMITS 201 §3.6 ghi "holdCapStop_end = 7" thực ra là delta
(report JSON 201 ghi end 5) — sai nhãn nhỏ trong văn bản 201, kết
luận "cap đã kích hoạt" vẫn đúng.

### Các sửa nhỏ khác trong harness 202

- Quirk hiển thị: `record()` in `[CHƯA]` cho cả GHI NHẬN — đã sửa
  thành `[GHI]`; số đếm trong report JSON vốn đã đúng.
- Suýt lỗi của P4: chuỗi backup `probe201-n11.json` /
  `probe202-n11.json` từng ghi đè file 201 bằng dữ liệu 202; đã sửa
  bằng cách tham số hoá đường ra (`PROBE_N11_OUT`) và tạo lại cả hai
  một cách xác định; đã kiểm nội dung khác nhau đúng sau đó.

## §9. Nợ còn lại (sang đợt 203)

1. **N12a-wide trên headed JSON P1-201: CHƯA CÓ** — P1-201 không
   publish pitch-curve JSON; wide vẫn treo trên dữ liệu 199 (55/60).
2. **N2a: CHƯA ĐẠT đợt thứ 6** (AM 0,534) — nợ lâu năm, chưa có hướng
   sửa.
3. **N11a-longA-201: chờ parent phán** (§3.3) — 1 cụm ở playhead đầu
   pass nhưng bắt đầu idxInPass 10, không thỏa chữ (a5)-201.
4. **N11a-longA-202: CHƯA ĐẠT** — 6 cụm ở playhead 290,4 s (biên
   keyframe); C3-loop không sửa drift. Cần thước drift cấp waveform
   (P3-202 §4.2, §7.3) nếu muốn verdict chặt — peakHz không còn là
   đồng hồ sạch trong hold dài có lặp.
5. **N11b-longA: đo lại decode dưới tải thường** (11.902 ms dưới
   tải 7–8; 6.401 ms của 201 dưới tải 3,3–4,4) — chưa kết luận được
   hồi quy hay tải.
6. **F-201-P3-2: gap nối đoạn 8–32 ms** vẫn nghe được — hướng sửa
   (plain restart bắt đầu sớm như restart-exact, hoặc rút ngắn
   khoảng tick) chờ quyết parent.
7. **Hướng lật ngược dấu của cap (w4s-s10):** chưa có cách phân biệt
   trước hai hướng lật (R_out > R_truth vs R_out < R_truth) theo
   σ̂/M từng khung — P2-203/P4-203.
8. **Notch P1-202:** độ sâu claim (median ~9–11 dB) chưa được P4 xác
   nhận bằng thước thô (chỉ xác nhận hướng triệt H3); cần LIMITS
   P1-202 + số đo theo khung để đối chiếu chặt.
9. **Headed voice 202:** không có `headed-voice202.json` — các check
   N1/N2/N2c/N9b/N12 headed vẫn GHI NHẬN.
