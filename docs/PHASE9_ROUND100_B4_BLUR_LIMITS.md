# PHASE9_ROUND100_B4_BLUR_LIMITS — blur parity tiếp: B-band wk n=132, curPix đường thường (presented mislabel ±1), D chr 1,5%, cap D r11-style thêm 2, r7 vẫn mở

> Luồng B4, đợt 100. Lượt cron 03:35 +07 13/11/2026 (chạy 20:38–21:02Z
> 12/11; boot 66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd; reboot tiếp theo dự
> kiến ~19:26Z — KHÔNG reboot trong lượt).
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **Không sửa production ngoài instrumentation đo lường** — curPix đường
> thường (3 marker "Đợt 100 B4" trong `preview.tsx`) + port probe (xem §5).
> Không đụng `.github/workflows`, 0 binary.

## 0. Môi trường + build nào đo cái gì (preview.tsx bị sửa 5 lần giữa lượt)

Luồng song song đợt 100 (B2: mốc thời gian trong-tick) sửa `preview.tsx`
giữa lượt đo của B4 — cùng mẫu nhiễu như A5 đợt 99. Dòng thời gian md5:

| md5 | nội dung | lượt đo trên build đó |
|---|---|---|
| `2efb80d3` | B4-only (curPix đường thường, tsc 0) | (chưa kịp chạy — B2 ghi đè trước driver) |
| `c5f4c36d` | + B2 (một phần) | driver bắt đầu (20:44:29Z) |
| `fb243088` | + B2 tiếp | wk-blur-r17 (mtimeBefore) |
| `ca9ea4bb` | + B2 tiếp | r17 (mtimeAfter), r18 bắt đầu `40ffc68c` |
| `94ee64c0` | B2+B4 ổn định (B2 sửa xong) | r18 (mtimeAfter) → r19, r20, r13, r14: **ổn định, mtimeChanged=false** |

- **Xác minh blend math không đổi:** thân hàm `compositeMotionBlurLayer`
  chứa đúng **1 marker "Đợt 99"**, plan line + skipLatest rule nguyên vẹn
  (kiểm trên build cuối `94ee64c0`); marker B4 ×3, B2 ×6, A2 ×8, A6 ×5
  đều còn. B2 chỉ thêm mốc thời gian (chỉ đo, không đổi hành vi) — **số
  liệu cụm D/A/B/C của cả 6 lượt đều dùng được**. Chỉ số liệu
  watchdog/fallback của lượt lai (r17/r18) phải gắn cờ build.
- **Bằng chứng instrumentation sống suốt lượt:** curPix non-null **317/317**
  blend tick, ghostPix non-null 317/317 — mọi build giữa lượt đều chứa
  instrumentation B4 (nếu build giữa lượt thiếu nó, tick sau đó sẽ có
  curPix null; không có tick nào như vậy).
- Tải: các lượt chạy dưới tải song song nặng và thất thường (load1 lúc
  phát 0,83–12,28; đỉnh 13,62 lúc r20; sibling `probe100b3` chạy cùng
  lúc). tagAgree: wk r17 73%, r18 78%, r19 48%, r20 60%; chr r13 56%,
  r14 52% — nhiễm tải rõ, khớp dải lịch sử chr (43–62%). 0 pageErr,
  0 collision, 0 EVAL_TIMEOUT trong cả 6 lượt.
- **r20 nhiễm tải nặng nhất:** playhead kẹt ở 5,933 suốt ~94 s (vòng chờ
  120 s hết hạn, probe lấy mẫu đã có thay vì treo — fix timeout hoạt
  động), ringFirstAt c2 = 100511 ms; c2 chỉ 7 cap, phân bố lệch c0/c1.
  Số liệu r20 vẫn dùng cho B-band (gStd từng cap độc lập với thời gian),
  nhưng không dùng cho kết luận theo thời gian/cửa sổ mù.
- Bài học harness: `pkill -f "probe100b4"` chạy INLINE trong `exec` đã tự
  giết shell cha (SIGTERM — cmdline của chính shell chứa pattern) ở lần
  chạy r17 đầu; chạy qua file driver `.sh` thì an toàn (cmdline chỉ là
  tên script). r17 vẫn exit=0, không mất dữ liệu.

### 0.1 Baseline + thang đo (không đổi so với A5)

- Baseline giữ nguyên Z5 (chr 241 key, wk 133 key); key chung chr–wk
  n=116, max|d| vẫn 1,395 (≈ gStdRatio ≤0,0172 xấu nhất).
- Dải D [0,27–0,34] / A [0,40–0,50] / B [0,70–0,82] / C [0,95–1,05];
  mô hình harmonic Y6 (gap 1 → 0,743; gap 2 → 0,307; gap 3 → 0,586;
  gap 6 → 0,549; gap 18 → 0,965). 0 mẫu ngoài-dải trong cả 6 lượt B4 —
  thang đo ổn định. Tâm cụm gộp: D 0,306 / A 0,439 / B 0,770 / C 0,999
  (chr r6–r14); wk D 0,303 / A 0,439 / B 0,764 / C 0,998 (r4–r20).

## 1. Kết quả chính

### (a) B-band WebKit — n=96 → 132, VẪN KHÔNG CÓ KHE BIMODAL; ringSize=1 ĐỨNG (12/12), phase 4 YẾU THÊM

| gộp wk | B n / tổng | mean | med | sd | pair-like [0,70–0,76) | dc-like [0,76–0,82] |
|---|---|---|---|---|---|---|
| r4–r16 (A5 gộp) | 96 / 393 | 0,766 | 0,768 | 0,016 | 40 (mean 0,750) | 56 (mean 0,777) |
| r17–r20 (B4 mới) | 36 / 105 | 0,761 | 0,759 | 0,015 | 20 (mean 0,751) | 16 (mean 0,774) |
| **r4–r20 GỘP** | **132 / 498** | **0,764** | **0,764** | **0,016** | **60 (45%, mean 0,750)** | **72 (55%, mean 0,776)** |

- **Mục tiêu thêm mẫu ĐẠT: B wk 96 → 132 (+36).** Tỉ lệ pair/dc dịch nhẹ
  42/58 → 45/55 (B4 mới 56% pair — mẫu mới giàu pair hơn); phân bố tổng
  thể không đổi.
- **Không có khe bimodal:** histogram bin 0,005 trên dải 0,714–0,788 —
  vùng dày 0,745–0,790 liên tục; chỉ có bin trống ở đuôi thưa dưới
  (0,700–0,715, 0,715–0,720, 0,725–0,730). 2-means 1D: cụm 1 n=66
  (mean 0,751, sd 0,011, 0,714–0,763) vs cụm 2 n=66 (mean 0,778, sd
  0,006, 0,765–0,788) — **khe giữa hai cụm chỉ 0,0019** (A5: 0,0022),
  tách 1,64σ. Hai cụm chạm nhau ở biên; không thể gán từng mẫu chắc chắn.
- **Tín hiệu một phía:**
  - `ringSize=1` ⇒ pair-like: **gộp n=12, TẤT CẢ pair-like (12/12,
    mean 0,735, dải 0,714–0,749)** — A5 là 7/7; B4 thêm 5 mẫu mới
    (g = 0,721–0,749), cả 5 đều pair-like. **Tín hiệu ĐỨNG và mạnh lên —
    duy nhất còn đứng vững.** ringSize=2 → n=14 mean 0,766; ringSize=3
    → n=82 mean 0,768 (dải đầy 0,748–0,788) — vẫn không phải phân hoạch.
  - `phase sọc 4` ⇒ dc-like: **gộp n=27, dc-like 17/27 (63%)** — A5 là
    13/16 (81%). B4 mới chỉ 4/11 dc-like (mean 0,758, dải 0,723–0,784).
    **Tín hiệu YẾU THÊM: chỉ còn nhỉnh hơn tỉ lệ nền (55%) một chút;**
    không dùng làm luật được nữa. (A5+B4 mới: 5/14 dc-like.)
  - `skipped`: −1 (n=24, mean 0,767) vs 0 (n=108, mean 0,764) — **không tách**.
  - Nguồn baseline: chr-base n=69 (mean 0,763) vs wk-base n=63 (mean
    0,766) — cứu baseline không làm lệch.
- **Verdict (a): B-band wk LÀ hỗn hợp pair (~45%) + double-count (~55%)
  ở mức quần thể — XÁC NHẬN với n=132; vẫn không tách sạch từng mẫu.**
  Đối chứng chr: B gộp r6–r14 n=234, mean 0,770, pair-like 39 / dc-like
  195 (17%/83%) — chr giàu dc hơn wk rõ rệt, khớp lịch sử.

### (b) curPix đường thường — MỚI: frame hiện tại vẽ live cũng mislabel ±1; giả thuyết presented −1 CHỈ ĐÚNG MỘT PHẦN

Instrumentation B4 hoạt động ngay lượt đầu: curPix non-null 317/317
blend tick (wk 226 + chr 91). Strip curPix lấy từ scratch canvas
dw×dh = 1280×720 (cùng hình học frame nguồn) — đối chiếu trực tiếp
được với frame nguồn f001..f090.

**WebKit (n=226 tick, pres == exp ở TẤT CẢ 226 tick):**

| curPix vs nhãn chung (pres=exp) | n | % |
|---|---|---|
| khớp nhãn (sạch) | 96 | 42% |
| lệch −1 thật (chỉ khớp đúng nhãn−1) | 33 | 15% |
| lệch +1 thật (chỉ khớp đúng nhãn+1) | 48 | 21% |
| mơ hồ nhiều frame (tập khớp ≥2 frame) | 49 | 22% |

- **Frame hiện tại vẽ live trên wk lệch nhãn ±1 ở ~58% tick** (130/226
  không khớp nhãn; trong số quyết định được bằng tiêu chí singleton:
  −1 là 33, +1 là 48). Cùng bậc với mislabel ghost wk (66%, xem §1d) —
  **cùng một cơ chế: nhãn lấy từ currentTime đầu tick, pixels là frame
  hiển thị lúc vẽ sau đó.**
- **Không có thiên lệch −1 hệ thống:** +1 (48) còn NHIỀU hơn −1 (33).
  Giả thuyết "presented mislabel −1" (ca r15 c1 fi=8) KHÔNG đúng dạng
  luật một chiều — mislabel là nhiễu ±1 hai chiều.

**Chromium r14 (lượt yên, n=82 tick; pres ≠ exp ở 38 tick):**

| | n |
|---|---|
| khớp presented-only | 19 |
| khớp expected-only | 7 |
| khớp cả hai | 40 |
| không khớp cái nào | 16 |

- Khi hai nhãn bất đồng (38 tick): curPix theo **presented 19 vs
  expected 7** (cả hai 3, không khớp 9) — **presented là nhãn tốt hơn
  cho frame vẽ live trên chr** (19/26 ca quyết định được, 73%).
  Gộp r14: frame live khớp presented (19+40)/82 = 72%, khớp expected
  (7+40)/82 = 57%.
- chr r13 (tải nặng, chỉ 9 tick): presented-only 0, expected-only 2,
  không khớp 7 — n quá nhỏ + nhiễm tải, không dùng để kết luận.

**Kiểm lại trực tiếp ca mẫu r15 (5c2): cap B/D mà ghost lệch −1 thật
(n=21) — presented theo curPix ra sao?**

| presented (tiêu chí singleton chặt) | n / 21 |
|---|---|
| −1 thật (chỉ khớp nhãn−1) | 5 |
| +1 thật (chỉ khớp nhãn+1) | 3 |
| sạch (khớp nhãn, h=0) | 4 |
| mơ hồ nhiều frame / nhãn ngoài dải | 9 |

- Trong 12 ca quyết định được: presented −1 là 5/12 (42%), +1 là 3/12,
  sạch 4/12. So với tỉ lệ nền presented −1 trên wk (33/177 = 19% trong
  số quyết định được): Fisher chính xác một phía **p = 0,067 — gợi ý
  có tương quan (ghost và presented cùng trượt −1 thường hơn ngẫu
  nhiên), nhưng CHƯA đủ ý nghĩa thống kê.** Ca r15 c1 fi=8 (ghost −1
  + presented −1, giữ nguyên gap 2 → đo 0,304) là MỘT mẫu của kiểu
  này, không phải luật chung.
- **Verdict (b): giả thuyết presented mislabel −1 ĐƯỢC KIỂM CHỨNG Ở
  DẠNG YẾU — presented mislabel ±1 là thật và phổ biến (wk 58% tick),
  nhưng không phải thiên lệch −1 hệ thống; coupling ghost−1/presented−1
  chỉ gợi ý (p=0,067), cần n lớn hơn để chốt.** Đây là dữ liệu đầu tiên
  về content của frame hiện tại ở đường thường (trước B4 curPix null
  100% ở đường này).

### (c) Cap D — D fix-3 1,5% gộp; thêm 2 cap D kiểu r11 (gap 17, 14); r7 VẪN MỞ

| lượt | D n / tổng | % | mean |
|---|---|---|---|
| chr-blur-r6–r8 | 3 / 457 | 0,7% | 0,307 |
| chr-blur-r9+r10 (Z5) | 2 / 118 | 1,7% | 0,306 |
| chr-blur-r11+r12 (A5) | 4 / 118 | 3,4% | 0,305 |
| chr-blur-r13+r14 (B4) | 3 / 90 | 3,3% | 0,306 |
| **gộp r6–r14** | **12 / 783** | **1,5%** | **0,306 (sd 0,001)** |

- **Verdict (c1): D fix-3 = ~1% (1,5% gộp 783 cap chr) — XÁC NHẬN, không
  về 0.** Tỉ lệ r13+r14 cao (3,3%) là nhiễu mẫu nhỏ (KTC 95% gộp
  ≈ 0,8–2,7%). Tâm cụm không đổi: D 0,306 / A 0,439 / B 0,770 /
  C 0,999 (chr gộp r6–r14). 0 mẫu ngoài-dải trong cả 6 lượt B4.
- **3 cap D mới B4 — đều kiểu ghost-đơn-cũ-kỹ, ghost content SẠCH 3/3
  (h=0):**
  - r13 c1 fi=69: {63,80} gap 17, ringSize=1, prev=−1, g=0,306.
  - r13 c2 fi=38: {29,43} gap 14, ringSize=1, prev=−1, g=0,306.
  - r14 c0 fi=3: {1,5} gap 4, ringSize=1, prev=−1, g=0,306.
  - Gộp với r11: **6 cap D kiểu r11 (gap ≥7)** nay thành 6 (r11: 4, r13: 2)
    + 1 cap gap 4 (r14) — chữ ký ổn định: ring chỉ còn 1 ghost cũ,
    presented đã tiến xa, đo đúng 0,304–0,307 (giá trị pair gap-2).
    Mô hình harmonic Y6 vẫn thiếu dự đoán cho gap 4/7/8/10/14/17 —
    khoảng trống của mô hình, không phải mâu thuẫn.
- **Dị thường r7 ({3,9} gap 6 → mô hình 0,549 nhưng đo 0,307) KHÔNG
  tái hiện dạng y hệt** trong 90 cap chr mới của B4 (0 cap D gap 6;
  chỉ còn n=1 trong toàn bộ r6–r14). **r7 VẪN MỞ.**
- **Ca mới đáng chú ý — r13 c1 fi=69 (pres=80, exp=69):** presented
  chạy TRƯỚC expected tới +11 frame (xem §1e) nhưng ghost 63 sạch và
  đo vẫn 0,306. Cap này cho thấy ngay cả khi presented lệch xa, cửa sổ
  {ghost cũ, presented} vẫn cho D — D không phụ thuộc presented chính
  xác, chỉ phụ thuộc "ring chỉ còn 1 ghost".
- **Wk D gộp:** 12/498 = 2,4% (mean 0,303) — khớp Y6 (2,8%) và A5 (2,5%).

### (d) Strip ghost — gộp: wk mislabel 66%, chr 6%; ghost cap D sạch 11/12

| tập (gộp A5+B4) | ghost có nhãn | sạch | lệch thật | không dữ liệu/không khớp |
|---|---|---|---|---|
| wk ghost B/D (r15–r20) | 102 | 35 (34%) | **67 (66%)** | 0 |
| chr ghost B (r11–r14) | 128 | 118 (92%) | 8 (6%) | 2 |
| chr+wk ghost cap D | 12 | 11 (92%) | 1 (8%) | 0 |

- **Ghost wk mislabel 66% (67/102) — khớp A5 (64%, 25/39); B4 mới
  42/63 (67%).** Hầu hết lệch ±1 pha sọc; một số mơ hồ nhiều frame do
  sọc tuần hoàn. Cơ chế đường tick (A2: chỉ 47,4% sạch) vẫn đứng.
- **Ghost chr sạch 92%** (B4 mới 56/58 sạch, lệch 2/58) — khớp A5.
- **Ghost cap D sạch 11/12** — ca lệch duy nhất vẫn là ca r15 c1 fi=8
  đã biết (ghost 6 → content 5); 3 cap D mới B4 đều sạch (h=0) —
  **mislabel ghost KHÔNG giải thích được các cap D kiểu r11.**
- Giới hạn phương pháp: strip 48 px không luôn pin được 1 frame duy
  nhất (sọc tuần hoàn — 22% curPix wk mơ hồ nhiều frame); mọi đếm ±1
  trong LIMITS này dùng tiêu chí singleton chặt (chỉ khớp đúng 1 frame),
  tiêu chí lỏng (nhãn−1 nằm trong tập khớp) sẽ cho số cao hơn — xem
  analysis.txt mục (5c).

### (e) presented chạy trước expected trên chr — quan sát mới (r13: +5..+27)

| lượt | pres − exp trên blend tick |
|---|---|
| wk r17–r20 (226 tick) | **0 ở tất cả** — pres == exp tuyệt đối |
| chr r14 (82 tick, lượt yên) | −1: 15, 0: 44, +1: 12, +2: 9, +3: 2 |
| chr r13 (9 tick, tải 11,72) | **+5, +8, +9, +11, +15, +17, +20, +27** (mỗi giá trị 1 tick) |

- Trên chr lượt yên, presented thường đi trước expected 0–2 frame (và
  lùi −1 ở 15 tick) — phù hợp với presented là nhãn tốt hơn (§1b).
- Dưới tải nặng (r13), presented vọt trước expected tới **+27 frame**,
  và có nhãn presented **vượt khỏi dải frame của clip** (104, 95, 91
  trong khi clip chỉ có frame 0–89) — strip matcher không kiểm chứng
  được các nhãn này (ngoài dải). Đây là quan sát mới: `presentedFrameIndex`
  có thể chạy xa khỏi currentTime-frame khi pump (re)tạo dưới tải
  (r13: lastPumpSeq chỉ 2 ở tick c1 fi=69). Cần đọc code
  `presentedFrameIndex` để giải thích (nợ cho đợt sau, xem §4) — không
  suy đoán thêm ở đây.
- Trên wk, pres == exp tuyệt đối ở cả 226 tick — hai nhãn là một trên
  đường này, nên (5c1) không tách được presented vs expected trên wk;
  kết luận §1b về wk nói về nhãn chung.

### (f) state100 + evaluate timeout + port probe gốc

- state100 cap 10000: dropped=0 ở cả 6 lượt; cap cũ 1200 đã cắt tới
  **271 mẫu (r20)** và 13 mẫu (r18) — fix Z5 vẫn cần và vẫn hoạt động
  (r20 len=1471, r18 len=1213).
- Evaluate timeout: **0 lần treo trong 6 lượt B4** (không có
  EVAL_TIMEOUT/EVAL HUNG nào trong log) — không có dịp tái chứng minh,
  nhưng r20 chứng minh khía cạnh khác: vòng chờ playhead hết 120 s
  thì thoát có kiểm soát và lấy mẫu đã có (thay vì treo).
- **Port sang probe gốc XONG (nợ A5 §4.6):** `probe97y5-frame-parity.mjs`
  đã nhận đủ fix evaluate-timeout (boot 20 s + playhead 3×20 s +
  heartbeat 10 s + pause 20 s + kết quả cuối 60 s) và state100
  (cap 10000 + `state100Dropped`), giữ nguyên tính năng Y5 (phCross,
  freeze-el, `--state-ms`); `node --check` OK. Phạm vi port khớp đúng
  A5 (các `evalJs` còn lại — seed, stall setup, sampler, play, liveness
  — vẫn không timeout, như probe A5). Probe `probe98z5` (bản sao trung
  gian) vẫn chưa port — nợ nhỏ còn lại, xem §4.

## 2. Phương pháp

- Probe B4: `apps/web/scripts/probe100b4-frame-parity.mjs` (copy probe99a5:
  SCRATCH → `round100-b4`; còn lại giống hệt — evaluate timeout +
  heartbeat, pump pix + blendTick ghostPix/curPix). `node --check` OK.
- Instrumentation curPix đường thường (B4, `preview.tsx`): helper
  `samplePlainCurrentPixStrip` (scratch canvas tái dùng, cùng hình học
  snapshot dw×dh) + 2 điểm đặt trước `recordDrawnBlendWindow` ở nhánh
  plain-blend (có SR và không SR). Chỉ đo: 1 drawImage + 1 getImageData
  48×1 mỗi tick blend đường thường (cùng bậc chi phí với strip snapshot
  đã có ở đường tick/rVFC); không đổi logic blend, không đổi thứ tự gọi.
  `tsc --noEmit` apps/web: 0 lỗi.
- Driver: `hidden_files/round100-b4/driver100b4.sh` (r17 chạy riêng kiểm
  tra curPix) + `driver100b4b.sh` (r18–r20 wk, r13–r14 chr); mỗi lượt
  bọc `timeout 900`; chạy tuần tự.
- Phân tích: `hidden_files/round100-b4/analyze100b4.py` (nối tiếp
  analyze99a5.py; baseline như Z5; strip: frame tham chiếu
  `round97-y2/frames-stripes/f001..f090.png`; bits = strip G > 128;
  khớp = hamming ≤2 trong nhãn ±3, thử 2 hình học G1/G2) + mục mới
  (5c)/(5c1)/(5c2) cho curPix; mục (1c) cho cap D kiểu r11 + săn r7.
  Tiêu chí ±1 chặt: chỉ đếm khi tập khớp là singleton đúng nhãn±1.
- Port probe gốc: 9 điểm sửa phẫu thuật trong
  `probe97y5-frame-parity.mjs` (xem §1f); `node --check` OK; KHÔNG chạy
  lại probe gốc trong luồng này (chỉ kiểm tra cú pháp — port là sao
  chép fix đã chứng minh, không phải hành vi mới).

## 3. Kiểm chứng

- 6 lượt headed có kết quả (r17–r20 wk, r13–r14 chr), 0 lượt mất;
  0 pageErr, 0 collision; caps JSON 44/23/19/21/14/87 (caps dùng
  43/23/19/20/11/79); pump chr 10/86, pumpPix 7/69; pump wk 0/0
  (silentEngine=true mọi lượt wk, như A5); blendTick 40/44/26/116/9/82,
  curPix + ghostPix non-null 317/317.
- Blend math nguyên vẹn trên build cuối (xem §0); `tsc --noEmit` 0 lỗi
  sau khi thêm instrumentation; probe B4 + probe97y5 port `node --check` OK.
- Build hash ghi rõ từng lượt (md5 trước/sau trong JSON + driver log);
  2 lượt lai (r17/r18, mtimeChanged=true — B2 sửa giữa lượt) nhưng
  instrumentation + blend math đã xác minh sống/nguyên trên mọi build
  (xem §0); 4 lượt sau ổn định md5 `94ee64c0`.
- Strip matching tự kiểm chứng: ca sạch khớp h=0 (cả 2 engine); ca lệch
  có h(label)=24/48; curPix hình học 1280×720 được kiểm chứng bằng tỉ
  lệ khớp 42% sạch trên wk (nếu sai hình học thì khớp ~0).

## 4. Nợ mở cho đợt sau (từ B4)

1. **B-band wk vẫn mở ở mức từng mẫu** (n=132, không khe bimodal,
   2-means chạm nhau 0,0019). ringSize=1 ⇒ pair-like là tín hiệu duy
   nhất còn đứng (12/12); phase 4 đã yếu thêm (17/27) và không dùng
   làm luật được nữa. Hướng mạnh nhất vẫn là **đọc alpha plan thật
   trong `compositeMotionBlurLayer`** (nợ từ A5 — chưa ai làm).
2. **Giả thuyết presented −1 chỉ đúng một phần:** presented mislabel ±1
   là thật (wk 58% tick), nhưng không thiên lệch −1 (Fisher p=0,067
   cho coupling ghost−1/presented−1). Cần n lớn hơn (thêm ~20 cap
   ghost−1 quyết định được) để chốt coupling có thật không; hoặc đọc
   code `presentedFrameIndex` + thời gian trong-tick (B2 đang đo) để
   giải thích cơ chế thay vì đếm thêm.
3. **presented chạy trước expected trên chr (r13: +5..+27, nhãn vượt
   dải clip 0–89):** cần đọc code `presentedFrameIndex` (base/cộng
   dồn presentedFrames, hành vi khi pump tái tạo dưới tải). Trên wk
   pres == exp tuyệt đối — khác biệt engine này chưa giải thích được.
4. **Dị thường r7 vẫn chưa giải thích được** — mislabel ±1 không đủ
   (cần +4); không tái hiện dạng y hệt trong 90 cap chr mới. 6 cap D
   kiểu r11 (gap ≥7) + 1 cap gap 4 cho thấy mô hình harmonic thiếu dự
   đoán cho mọi gap ngoài {1,2,3,6,18} — cần bảng harmonic mở rộng hoặc
   đọc code blend khi ring chỉ còn 1 ghost cũ.
5. **D fix-3 sàn ~1% (1,5% gộp 783 cap)** — cơ chế Z5 vẫn đứng (ring
   chỉ còn 1 ghost cũng cho D); muốn về 0 cần giữ ring đủ 3 ghost đúng
   pha khi pump thưa (chưa có thiết kế).
6. **Harness:** probe98z5 (bản sao trung gian) vẫn chưa port fix
   evaluate-timeout + state100 (chỉ probe gốc 97y5 đã port); các lượt
   sau nên copy từ probe100b4 (đã có fix) thay vì từ 98z5. Strip
   matcher 48 px mơ hồ ~22% (sọc tuần hoàn) — nếu cần pin frame duy
   nhất thì phải đọc strip dài hơn hoặc thêm kênh màu.
7. **B4 KHÔNG chạy blind** (không thuộc nhiệm vụ) — đuôi memo c2 vẫn
   2 điểm khác 0 (485, 671 ms), giữ nguyên kết luận A5.

## 5. Batch đã stage (KHÔNG push)

- Batch stage: `phase9-round100-b4-blur.txt` — 4 entry, read-back OK
  (splitter NUL), 0 binary, 0 workflow:
  - `docs/PHASE9_ROUND100_B4_BLUR_LIMITS.md` (file này)
  - `apps/web/scripts/probe100b4-frame-parity.mjs` (probe B4: SCRATCH
    round100-b4; còn lại như probe99a5)
  - `apps/web/scripts/probe97y5-frame-parity.mjs` (probe gốc đã port
    fix evaluate-timeout + state100 — 9 điểm sửa, node --check OK)
  - `apps/web/src/preview.tsx` (instrumentation curPix đường thường —
    helper `samplePlainCurrentPixStrip` + 2 điểm đặt; tsc 0; blend math
    nguyên vẹn)
- Dữ liệu (không stage, ở hidden_files): `round100-b4/` — driver100b4.log/
  .sh, driver100b4b.sh, analyze100b4.py, analysis.txt/.json,
  6 thư mục lượt chạy (r17–r20 wk, r13–r14 chr) + round100-b4.md.
