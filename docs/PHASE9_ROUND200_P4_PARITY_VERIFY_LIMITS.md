# Đợt 200 P4 — Parity verify: harness FINAL 51/53 + N12a thước mới + N11a/N11b + R_rel theo σ

> **Kết luận: harness FINAL 51/53 ĐẠT** (report `hidden_files/parity200/parity200-report.json`,
> generated 2026-11-27T11:51:33Z). **CHƯA ĐẠT: N2a, N11a-longB (giữ theo quyết (a5)-199 — xem §3, F-200-P4-1).**
> **GHI NHẬN (không verdict): 11** (3× R_rel theo σ mới + N13 + 5 headed + S6b-boundary + chirp-70s).
> **N12a ĐẠT theo thước mới (a4)-199** (autocorr worst 0,054 st + wide 10/10); **N11a-longA ĐẠT** theo
> tiền lệ (a5); **N11b ĐẠT cả 3 pass** (decode ≤ 2.391 ms). **N10/N5b ĐẠT, khớp P2-199 từng số.**
> **FULL PASS: KHÔNG — chân harness THIẾU** (51/53, còn 2 CHƯA ĐẠT); chân O8 + chân yên thuộc T01/T4 — T10 quyết cuối.
> Test 200: **28/28 PASS**. `npx tsc --noEmit`: **0 lỗi** (chạy 11:49:16–11:49:59Z; lần 1 11:48:09–11:48:59Z
> có 4 lỗi kiểu ở section R_rel mới — đã sửa, chạy lại 0 lỗi).
> **Cờ fallback KHÔNG flip trong đợt này** — thuộc parent quyết (a2)-199 (chờ P1-200 kết luận timbre).

## 1. N12a — thước mới (a4)-199: core sim ĐẠT + headed wide 10/10

Thước −12 mới (parent, aggregate 199 §14.2 bản đã KHÔI PHỤC 86.880 B): **cao độ autocorr
(errSt ≤ 0,1 st) + cao độ wide 10/10**; thước domFreq/errHarm ở −12 ĐÃ BỎ (tiền đề (a4)-198 SAI,
F-199-P4-1); ở −7/+7/+12 thước mag cũ vẫn đứng (magTarget ≥ 10×magOrig).

### 1.1 Core sim (harness N12a-psola-sim, hàm mới `psolaAutocorrPitch`): ĐẠT

Lưới 20 điểm (f0 220/330/440/550/660 × n ±12/±7), lõi `psolaPitchShift` thật; −12 đo thêm autocorr
trên sine 2 s (đoạn [0,5, 1,5), lag 80–700 Hz). **gate_fail 0/20; worst AM 0,188; nan 0.**

| f0 | autocorr f0est (đích) | errSt | r | mag −12 (chỉ tham khảo) |
|---|---|---|---|---|
| 220 | 110,34 Hz (110) | 0,054 st | 0,991 | 2,51 |
| 330 | 165,52 Hz (165) | 0,054 st | 0,993 | 1,90 |
| 440 | 220,18 Hz (220) | 0,014 st | 0,995 | 2,61 |
| 550 | 275,86 Hz (275) | 0,054 st | 0,995 | 1,74 |
| 660 | 331,03 Hz (330) | 0,054 st | 0,995 | 2,65 |

worst_err_acorr_m12 = **0,054 st** (bar 0,1) — khớp đúng số P4-199 đo bằng probe ngoài
(errSt ≤ 0,054 st, r ≈ 0,99). Số domFreq/errHarm nay CHỈ LÀ THÔNG TIN: worst_err_st 19,02,
worst_err_harm_st 7,02 (330/550 −12 domFreq 495/825 Hz = hài 3 của đích — đúng như F-199-P4-1);
không chặn verdict theo (a4)-199. Tỉ số mag −12 vẫn 1,74–2,65 (cấu trúc, không đạt 10× với
mọi TD-PSOLA — không còn là điều kiện flip).

### 1.2 Headed wide −12 — tái tính độc lập: 10/10

Script `round200-p4/scratch/wide-rederive-200.mjs`: P1-200 CHƯA publish `chrome-*.json`
(không có file headed mới lúc 11:45Z) nên dùng **fallback dữ liệu P1-199** (11 file).
File `verify-fixed/chrome-2026-11-27T06-31-21-469Z.json`: run1 + run2 đều **−12 KẾT HỢP 10/10,
band 10/10, WIDE 10/10**, khớp từng số với LIMITS P4-199 §2.3 (các file repro chưa sửa vẫn
8–9/10, đúng chữ ký lạnh F-198-P1-2). **N12a ĐẠT theo thước mới (a4)-199: autocorr + wide.**
Caveat: wide 10/10 này là dữ liệu P1-199 (code PSOLA chưa đổi đợt 200 — P1-200 chỉ đo timbre,
không đổi lõi); khi P1-200 publish headed mới thì chạy lại script (tự tìm round200-p1 trước).

## 2. N10 / N5b — xác minh độc lập P2-200: ĐẠT, khớp từng số

| check | MAD preview-200 | MAD tap | R_rel | verdict |
|---|---|---|---|---|
| N10 (fixture chuyển động) | **6,126** | 6,243 | **0,082** | ĐẠT |
| N5b (fixture tĩnh) | **6,810** | 6,855 | **0,109** | ĐẠT |

Khớp từng số với sim P2-198 §5 và với số P4-199 (6,126/0,082 + 6,810/0,109). N5d ĐẠT.
P2-200 KHÔNG chạy lại sim N10/N5b đợt này (nhiệm vụ là quét σ + footage mới) — verdict chính
thức thuộc harness này.

## 3. N11a / N11b — đo lại độc lập (dữ liệu thô 199, CHỜ P3-200)

P3-200 CHƯA publish waveform JSON lúc harness final chạy (11:50Z; `round200-p3/` chỉ có
script phân tích, `benchmarks/reverse200/` chỉ có `audio-probe-200.mjs`) — harness dùng lại
dữ liệu thô 199 (`hidden_files/round199-p3/`, pass cuối longA 07:04:47Z, longB 07:08:22Z,
chirp 07:10:36Z) + ghi rõ `data_round: 199` trong từng record. Mọi số median/p90/max dưới đây
P4 tính lại độc lập từ JSON thô và KHỚP TỪNG SỐ với LIMITS P3-199.

### 3.1 N11b — decode từng phần: ĐẠT cả 3 pass (bar 5.000 ms)

| pass | decode cửa sổ đầu / cuối (ms) | load tới loaded=1 (ms) | ffmpeg audio-only |
|---|---|---|---|
| A longA | 1.930 / 2.391 | 2.764 | 1,58 s |
| B longB | 769 / 2.293 | 954 | 1,07 s |
| C chirp | 320 / 320 | 467 | 1,40 s |

(ffmpeg audio-only là timing đo lại đợt này — chênh đợt 199 (1,303/1,606/0,403 s) do tải máy
lúc đo, KHÔNG phải verdict; verdict theo timing P3 headed lastWindowDecodeMs.)

### 3.2 N11a — longA ĐẠT theo tiền lệ (a5); longB GIỮ CHƯA ĐẠT (F-200-P4-1)

| pass | median S2 | p90 S2 | max S2 | in-pass | mẫu > 0,5 s (thô / S2) |
|---|---|---|---|---|---|
| A longA | **0,074** | **0,215** | **0,526** | 327/400 | 1 / **1** |
| B longB | **0,167** | **0,259** | **2,756** | 477/480 | 7 / **1** |
| C chirp-70s | 0,148 | 0,266 | 0,632 | — | GHI NHẬN |

**longA — ĐẠT** (helper mới `n11aVerdict200`, khóa trong test): chỉ 1 mẫu vượt, đúng mẫu sounding
đầu tiên của pass (ph 300,5 s, drift −0,526 s) — áp tiền lệ (a5)-198/(a5)-199. Harness 199 giữ
CHƯA ĐẠT theo thước max; parent (a5)-199 đã quyết ĐẠT — harness 200 áp luật đó trực tiếp.

**longB — GIỮ CHƯA ĐẠT theo quyết (a5)-199 (không tự lật — chờ parent quyết lại).**

**F-200-P4-1 (phát hiện mới — đính chính đếm "7 mẫu vượt" của P4-199):** đếm 7 mẫu vượt longB
trong LIMITS P4-199 §3.2 là đếm trên tập THÔ chưa lọc. Trên thước verdict S2 chỉ còn **1 mẫu
vượt** (mẫu đầu ph 300,2 s, drift +2,756 s). 6 mẫu giữa pass (ph 198,8 / 204,1 / 206,4 /
211,3 / 221,2 / 237,1; drift 0,53–0,70 s) đều có **peakHz ĐÓNG BĂNG y hệt mẫu trước
(Δpeak = 0 Hz) trong khi playhead chạy 0,2–0,3 s** — đúng định nghĩa stale-peak S1 (P3 §1.4;
chirp quét 270 Hz/s nên đỉnh thật phải dịch ~54–81 Hz trong thời gian đó) — đã bị lọc S1
loại; drift của chúng là artefact đo, không phải drift thật. Harness đã ghi vị trí 6 mẫu này
(`over_bar_playheads_s` / `over_bar_drifts_s` trong report JSON) — trùng hướng phân tích
của P3-200 (`longb_freeze.py`: freeze runs; `longb_six.py`: 6 transient raw, excl idx0 —
P3 đọc từ probe JSON, P4 đọc độc lập từ waveform JSON, cùng kết luận về vị trí).
Harness giữ verdict longB **CHƯA ĐẠT** bằng cờ `parent_hold_199_longB = 1` (chỉ áp cho dataset
199; dữ liệu P3-200 mới sẽ verdict theo luật `n11aVerdict200` bình thường) vì parent đã quyết
CHƯA ĐẠT trên chính dataset này ở (a5)-199 — P4 không tự lật; parent quyết lại ở §14.2-200
với bằng chứng này. Theo luật (a5) thuần, longB trên thước S2 cũng chỉ còn 1 mẫu đầu như longA.

**Chirp-70s: GHI NHẬN** (không verdict, quyết (a4)-196: bin 0,611 s > bar 0,5 s). P3-200 nợ
đo lại drift chirp bằng thước sweep 70 s đúng (xem (a6)-199) — chưa có dữ liệu mới lúc này.

### 3.3 Sửa F-199-P4-3 (ghi chú cap sai)

Ghi chú N11a nay chỉ ghi "cap đã kích hoạt" khi `holdCapStop_end > 0`; longB đợt này:
**cap CHƯA kích hoạt** (holdCapStop = 0, holdMaxSec 0,351 s) — bản 199 ghi sai "cap đã kích
hoạt" do template nhạy với holdMaxSec > 0,3 s. Verdict tính từ số, không bị ảnh hưởng.

## 4. R_rel theo σ — đo độc lập (nợ (a1)-199): U NÔNG trên fixture tổng hợp, KHÔNG đổi bar

Section mới `sectionRrelSigma200`: cùng fixture + pipeline như N5b (testsrc2, seed 19100+f,
truth yadif→hqdn3d, α thích nghi), quét σ = 5/10/15, 3 frame idx 3/7/11. **GHI NHẬN** (nghiên
cứu thước — bar 0,15 KHÔNG đổi đợt này, quyết (a1)-199).

| σ | σ̂ trung bình | α199 trung bình | R_rel worst (adapt / tap) | R_truth f3 | \|ΔR\| f3 |
|---|---|---|---|---|---|
| 5 | 4,87 | 0,485 | **0,149 / 0,150** | 2,879 | 0,430 |
| 10 | 6,52 | 0,485 | **0,095 / 0,097** | 3,280 | 0,312 |
| 15 | 8,15 | 0,487 | **0,109 / 0,108** | 3,908 | 0,425 |

- **Tự kiểm chéo:** σ = 15 cho đúng số N5b (MAD 6,810, R_rel 0,109) — section mới tái hiện
  chính xác verdict chính.
- **Phụ thuộc σ CÓ nhưng NÔNG trên nội dung này:** 0,149 → 0,095 → 0,109 — đều DƯỚI bar
  (σ = 5 sát bar nhất; tap ở σ = 5 vượt nhẹ 0,150). Khác với w0s của P2-199/P2-200
  (0,245 ở σ = 5, CHƯA ĐẠT): **phụ thuộc σ là đặc thù nội dung, không phổ quát** — ủng hộ
  kết luận P2-200 §4 (Sintel w0s σ = 5 ĐẠT 0,086 vì R_truth nhỏ ~3,6–3,9; BBB w0s fail vì
  R_truth lớn ~7). Cùng |ΔR| ~0,4–1,5 thì R_rel = |ΔR|/R_truth quyết định pass/fail theo
  độ chi tiết nội dung.
- **Cơ chế khác w0s:** trên testsrc2, α ≈ 0,485 ở MỌI σ (σ̂ 4,9–8,1 → k×wf×m ≈ 1,0 —
  bảng adaptive-K chưa vào vùng đổi); R_rel biến thiên chủ yếu do R_truth tăng theo σ
  (2,88 → 3,28 → 3,91) trong khi |ΔR| giữ ~0,3–0,43. Không thấy cơ chế "α quá cao ở σ
  thấp" như w0s (α 0,465 ở σ = 5 vs 0,267 ở σ = 15) — vì σ̂ trên testsrc2 thấp hơn hẳn
  w0s cùng σ nhiễu (8,15 vs 12,95 ở σ = 15).
- **Đồng thuận với đề xuất P2-200 §5:** GIỮ bar 0,15, GIỮ fixture σ = 15, GHI RÕ phạm vi
  hiệu lực σ ∈ [10, 20] — số độc lập này không mâu thuẫn đề xuất đó (trên fixture harness,
  σ = 5 vẫn dưới bar nhưng sát biên 0,001; tap đã vượt). P4 KHÔNG tự đổi bar — parent quyết.
- **Cảnh báo boost-lật (P2-200 §5):** 3 mẫu Sintel w4s/w8s + pan σ = 25 — P4-200 CHƯA xác
  nhận độc lập (cần footage thật; nợ 201 theo đề xuất P2). Trên fixture tổng hợp đợt này,
  m ≈ 1,0 suốt (không vào vùng kẹp 1,12) nên không quan sát được hiệu ứng này.

## 5. Các check khác

- **N2a: CHƯA ĐẠT, không đổi** — AM 0,534 (bar 0,35); errSt 0,398 (bar 0,5, đạt); sideband 0,16.
  Artifact của fallback 2-delay; đường chính ở N12/N12a/N2-headed.
- **N2b, N9a, S1/S2/S3/S4/S5, N4, N5, N5c, S6/S6a, S7/S7b/S7c/S7d, N7, S6b-headed-seek, N6, S8*:
  ĐẠT** (xem report JSON).
- **Headed N1 / N2-headed / N2c / N9b / N12: GHI NHẬN, số rỗng** — P1-200 chưa publish
  `headed-voice200.json` (đang đo timbre A/B trên speech thật — `timbre200-report.json`
  đã có, nhưng không phải probe pitch curve); P4 chỉ tái tính độc lập phần N12a-wide (§1.2),
  không tự suy ra từ số cũ. Nợ harness 201: đọc JSON headed thật của P1 khi có.
- **N13: GHI NHẬN** — P2-200 đã đóng cờ (`PHASE9_ROUND200_P2_ENHANCE_SIGMA_LIMITS.md`,
  có claim fps); `media.ts` CÓ trường fps. P4 chỉ kiểm file/code + LIMITS, không đo lại
  headed fps (probe riêng của P2).
- **S6b-reverse-video-boundary: GHI NHẬN** (worst MAD 33,19, offset 1 frame — như 199).

## 6. Kỷ luật đo yên

T4-200: lượt yên #68, poller mở ~11:41Z, hạn cắt 13:30Z. **W1 CHƯA MỞ trong suốt lúc P4
làm việc nặng** — kiểm `windows.md` trước mỗi bước nặng: test 11:45:33–11:45:35Z, harness
dry-run 11:45:45–11:46:28Z, tsc #1 11:48:09–11:48:59Z, tsc #2 11:49:16–11:49:59Z, harness
final 11:50–11:51:33Z — mọi lần W1 đều "CHỜ GATE — chưa mở" (gate0 chưa đạt, poller chờ
T56 repair; `windows.md` mtime 11:39:52Z, không đổi trong lúc P4 chạy). **0 trùng lặp.**
(Ghi chú (p)(iii)-199: P4 nói KHÔNG phải nguồn node tsc/test trong W2/W3 đợt 199 — tsc của
P4-199 chạy 06:49Z, sau các attempt; đợt này P4 ghi rõ giờ chạy tsc/test của mình ở trên
để T2-200 khỏi phải đoán.)

## 7. File đổi (stage, xem paths-loop phase9-round200-p4-parity-verify.txt)

- `apps/web/src/lib/parityHarness200.ts` — harness 200 (copy 199 + gate N12a (a4)-199 +
  autocorr + section R_rel σ + verdict N11a (a5)-199 + sửa note cap F-199-P4-3 + tìm dữ
  liệu P3-200 trước, fallback 199). **224.488 B — VƯỢT trần push 37.768 B, cần
  ENABLE_PRIVSEP=0 lúc push** (tăng 16.865 B so với 199 — 3 tính năng mới thật, không
  phình vô tội vạ; tên biến/khóa số *199 giữ nguyên theo lineage pipeline P2-198 để so
  trực tiếp giữa các đợt).
- `apps/web/src/lib/parityHarness200.test.ts` — 28 test (26 cũ + 2 mới: autocorr 5 f0 +
  n11aVerdict200). **20.276 B.**
- `scripts/parity200-run.mjs`, `scripts/parity200-run-test.mjs` — runner harness + test.
- `apps/web/tsconfig.json` — exclude `parityHarness200.test.ts` (+1 dòng).
- `docs/PHASE9_ROUND200_P4_PARITY_VERIFY_LIMITS.md` — file này.
- KHÔNG PUSH. KHÔNG sửa `PHASE9_GAP_ANALYSIS.md`, aggregate 199, MEMORY.md. Scratch +
  report JSON ở `hidden_files/round200-p4/` (không stage) và `hidden_files/parity200/`
  (không stage). Runner 199 đã khôi phục nguyên vẹn sau sự cố sed (kiểm bằng diff với
  mẫu 198 — xem F-200-P4-2).

## 8. Phát hiện mới

- **F-200-P4-1** — đính chính đếm longB: "7 mẫu vượt" của P4-199 là đếm thô chưa lọc;
  trên thước S2 chỉ còn 1 mẫu vượt (mẫu đầu); 6 transient giữa pass là stale-peak S1 (§3.2).
- **F-200-P4-2** — sự cố thao tác: `sed -i 's/199/200/g'` chạy nhầm TRÊN FILE GỐC
  `scripts/parity199-run.mjs` thay vì bản copy (lệnh copy chưa chạy) — file 199 bị ghi đè
  thành nội dung 200. Đã khôi phục bằng thay ngược 200→199 trên bản hỏng + kiểm chứng
  `diff <(sed 's/198/199/g' parity198-run.mjs) parity199-run.mjs` = rỗng (khớp mẫu 198).
  Bài học: KHÔNG bao giờ `sed -i` trên file gốc khi ý định là tạo bản mới — copy trước,
  sửa sau (đã áp cho runner test + test file).
- **F-200-P4-3 (mới)** — tap vượt bar nhẹ ở σ = 5 trên fixture tổng hợp (R_rel tap 0,150
  vs bar 0,15) trong khi adapt 0,149 — biên 0,001; thêm bằng chứng "tap cũng fail" cho
  luận điểm thước chưa hiệu chuẩn ngoài dải (P2-200 §5).

## 9. Hạn chế / nợ chuyển đợt 201 (P4-201)

1. N11a-longB: chờ parent quyết lại ở §14.2-200 (F-200-P4-1) — flip hay giữ CHƯA ĐẠT.
2. N11a/N11b: chạy lại trên dữ liệu P3-200 khi có (waveform JSON + đo lại drift chirp
   bằng thước sweep 70 s đúng); harness đã tìm 200 trước, fallback 199.
3. N12a-wide: chạy lại trên headed JSON P1-200 khi có (hiện chỉ có fallback P1-199).
4. R_rel: xác nhận độc lập cảnh báo boost-lật của P2-200 §5 trên footage thật (cần mẫu
   Sintel/pan — nợ 201, chưa đủ để sửa luật ship); hiệu chuẩn biên σ 8/9 và 22 nếu
   parent muốn biên cứng.
5. N2a (fallback 2-delay) không đổi 4 đợt — chỉ là fallback, không chặn đường chính.
6. Headed N1/N2/N2c/N9b/N12: đọc JSON headed thật của P1 thay vì file tổng không ai viết.
