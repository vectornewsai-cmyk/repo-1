# PHASE9_ROUND130_T3_C2MODAL_LIMITS — Phân phối (c2) qua 6 lượt yên hợp lệ + thống nhất interface analyzer tag=path

> Luồng T3, đợt 130, lượt cron 18:35 +07 17/11/2026 (bắt đầu ~11:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG chạy đo thật mới (đo là việc T4).
> KHÔNG sửa file production nào (preview.tsx/media.ts), KHÔNG sửa probe đo.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **DEF v0.5: KHÔNG viết đợt này** — xem §4.4 (phát hiện mới là giả thuyết
> cần lượt yên #8 kiểm chứng ngoài mẫu, chưa đủ chắc để sửa DEF).

## 0. Tóm tắt

1. **Bảng (c2) 6 lượt yên hợp lệ — LÀM MỚI HOÀN TOÀN cho 4 lượt cũ.**
   Chạy lại cùng phương pháp histogram (pixFrame−label) của T5 đợt 127
   §8.3 / T5 đợt 129 §8.1 trên JSON gốc của cả 6 lượt (S5, 118, 121,
   125, 126, 129; n=4174 ghost). Kiểm chứng chéo: chạy lại tái tạo
   **chính xác 100%** số T5 đợt 127 (126a2: n=740, 0:265/+1:175/+2:175)
   và T5 đợt 129 (129a1: n=628, 0:237/+1:86/+2:127/+3:115).
2. **Kết luận modal (cập nhật, 6 lượt): bin 0 là mode ỔN ĐỊNH — 35,8–38,6%
   ở cả 6 lượt (trung bình 37,7%, SD 1,0pp, khớp nhiễu nhị thức).**
   Khối +1/+2 gộp KHÔNG ổn định: 33,9–52,7% (SD 7,0pp, vượt xa nhiễu
   nhị thức ~1,9pp). Bin +3 càng không ổn định: 3,8–18,3% (SD 5,3pp).
   Tuyên bố "modal +1/+2" của đợt 127 (47,3% ở 1 lượt) là **điểm cao
   của phân phối, không phải tâm ổn định** — nay đã có 6 lượt để thấy.
3. **Phát hiện mới (giả thuyết, CHƯA kết luận): hình dạng phân phối
   xếp thứ tự GẦN NHƯ HOÀN HẢO theo median tickCost của lượt.**
   +1/+2 giảm đơn điệu khi tick chậm (Spearman −1,000, Pearson −0,998);
   +3 tăng đơn điệu khi tick chậm (Spearman +1,000, Pearson +0,941);
   bin 0 gần như không đổi. n=6 lượt nên đây là giả thuyết cần lượt
   yên #8 kiểm chứng ngoài mẫu (dự báo cụ thể ở §4.3), KHÔNG phải
   chứng minh cơ chế — và KHÔNG mâu thuẫn với T5 đợt 129 §8.2
   (snap−label theo từng entry không dự báo lag; đây là quan hệ
   ở mức tổng hợp theo lượt).
4. **(c2) thuần +1f: 28 occurrence / 4174 ghost (0,67%) trên 6 lượt,
   TẤT CẢ đều lag đúng +1f, không đổi dấu.** Tổng (c2) kể cả event:
   34 (thêm 6 occurrence gắn 2 event stale-ghost: seq 448/479 đợt 118
   frame 23; seq 279 đợt 126 frame 27). Tỷ lệ (c2) mỗi lượt 0,30–1,08%
   — chênh lệch giữa các lượt nằm trong nhiễu Poisson (count 2 vs 8
   đều trong khoảng tin cậy 95% của nhau), KHÔNG kết luận tỷ lệ thay
   đổi theo lượt.
5. **Thống nhất interface analyzer: 12/12 script đã sửa + dry-run PASS
   20/20.** 5 analyzer lượt yên (`analyze-t4-*`, bản canonical mới đặt
   trong `benchmarks/render/`) + 7 analyzer F2 (`f2_startup_analyze_*.py`)
   nay đều chấp nhận `tag=path` HOẶC đường dẫn trần (F2 trước đây
   KHÔNG nhận CLI nào — chỉ env `S9_OUT`). Chỉ sửa parse argv, KHÔNG
   đổi logic phân tích (diff vs bản gốc chỉ có phần parse argv).
   Dry-run trên JSON lượt yên #7 + F2 startup đợt 127: output
   byte-identical với script gốc (trừ dòng header tag khi gọi đường
   dẫn trần ở tickcost/wallbands — theo thiết kế, tag suy từ tên file).
6. **Production:** KHÔNG sửa. `media.ts` md5 `2c384ed1` KHÔNG ĐỔI so với
   baseline đợt 128/129. `preview.tsx` md5 lúc kiểm là `805409f0`
   (KHÁC baseline `03bf029f`) — đây là thay đổi của **T5 đợt 130**
   (instrumentation log draw, đã được parent phê duyệt §12.3(a) đợt
   129), đang chạy song song trong đợt này, KHÔNG phải của luồng này.
   Dữ liệu histogram của luồng này chỉ dùng JSON lịch sử nên không bị
   ảnh hưởng.

## 1. Dữ liệu thu thập — 6 lượt yên hợp lệ (không phải 7)

> Đính chính cách đếm: "lượt yên 1–7" là 7 **lần theo dõi**; chỉ có
> **6 lượt HỢP LỆ**. Lần #4 (đợt 124: attempt2 median 107,0 ms, lớp B
> vi phạm) và lần #7 ở đợt 127 (0 probe, gate A không mở) + đợt 128
> (3 attempt, 0 lượt hợp lệ) KHÔNG cho lượt yên hợp lệ nào. Lượt yên
> #8 chạy ở đợt 130 (T4) là lần theo dõi tiếp theo.

| # theo dõi | Lượt | Đợt / attempt | Median tickCost | Lớp B | JSON gốc |
|---|---|---|---|---|---|
| 1 | S5 | 116 / a3 | 49,5 ms | 5/5 ĐẠT | `round116-s5/preview-b-f3-flip-webkit-s5-attempt3.json` |
| 2 | T4-118 | 118 / a8 | 40,0 ms | 5/5 ĐẠT | `round118-t4/preview-b-f3-flip-webkit-t4-attempt8.json` |
| 3 | T3-121 | 121 / a1 | 52,0 ms | 5/5 ĐẠT | `round121-t3/preview-b-f3-flip-webkit-t3-attempt1.json` |
| 5 | T9-125 | 125 / a1 | 47,5 ms | 5/5 ĐẠT | `round125-t9/preview-b-f3-flip-webkit-t9-attempt1.json` |
| 6 | T9-126 | 126 / a2 | 44,0 ms | 5/5 ĐẠT | `round126-t9/preview-b-f3-flip-webkit-t9-attempt2.json` |
| 7 | T4-129 | 129 / a1 | 54,0 ms | 5/5 ĐẠT | `round129-t4/preview-b-f3-flip-webkit-t4-attempt1.json` |

- Nguồn median + lớp B: LIMITS T4/T9/S5 của từng đợt (đã ghi trong bảng).
  Trung bình 6 lượt: 47,8 ms (khớp LIMITS gộp đợt 129 §4).
- **Đính chính nhãn:** histogram "đợt 127 T9 a2, n=740" mà T5 đợt 129
  §8.1 dùng làm baseline thực chất là dữ liệu của **T9 đợt 126
  attempt2**, do T5 đợt 127 phân tích trong đợt 127 (T5-127 §8) — đợt
  127 T9 có 0 probe nên không thể có JSON a2 của đợt 127. Chạy lại
  đợt này tái tạo đúng n=740 + histogram đó từ JSON đợt 126 a2.
- Phương pháp histogram (giữ nguyên T5 đợt 127/129): mọi ghost entry
  hậu flip+2000ms (viaRvfc=0), pool cả skp=0 và skp=1; pixFrame = frame
  GT khớp GẦN NHẤT nhãn (thresh ≤2 bit, strip 48px kênh G, GT
  `round111-m5/frames-nonperiodic`); kèm snapMs−labelMs,
  rawMs−labelMs, label−floor(labelCt×30), run curPix đông cứng ≥3 tick.
  Script: `hidden_files/round130-t3/c2-histogram-all6.py` (tái dùng hàm
  `analyze()` của `round129-t5/c2-histogram-r128.py`, chỉ tham số hóa
  danh sách file), output `c2-histogram-all6.txt`.
- **Kiểm chứng phương pháp:** chạy lại tái tạo chính xác 100% cả hai
  baseline đã công bố — 126a2: n=740, hist {0:265, +1:175, +2:175,
  +3:42, +5:2, +8:2, +10:2, −1:57...}, snap−label median 38 ms,
  label−floor {0:236, +1:504}; 129a1: n=628, hist {0:237, +1:86,
  +2:127, +3:115, +4:7}, snap−label median 45 ms. 0 nomatch ở cả 6
  lượt; srcKind="canvas" ở 100% ghost (4174/4174) — như các đợt trước.

## 2. Bảng tổng hợp (c2) 6 lượt — histogram (pixFrame−label)

### 2.1 Histogram chi tiết theo lượt

| Lượt (median) | n ghost | 0 | +1 | +2 | +1/+2 | +3 | ≥+3 | <0 | snap−label med |
|---|---|---|---|---|---|---|---|---|---|
| S5 (49,5) | 674 | 256 (38,0%) | 120 (17,8%) | 146 (21,7%) | **266 (39,5%)** | 71 (10,5%) | 77 (11,4%) | 75 (11,1%) | 39 ms |
| T4-118 (40,0) | 772 | 289 (37,4%) | 195 (25,3%) | 212 (27,5%) | **407 (52,7%)** | 29 (3,8%) | 41 (5,3%) | 35 (4,5%) | 35 ms |
| T3-121 (52,0) | 632 | 244 (38,6%) | 106 (16,8%) | 125 (19,8%) | **231 (36,6%)** | 79 (12,5%) | 88 (13,9%) | 69 (10,9%) | 45 ms |
| T9-125 (47,5) | 728 | 280 (38,5%) | 162 (22,3%) | 155 (21,3%) | **317 (43,5%)** | 54 (7,4%) | 54 (7,4%) | 77 (10,6%) | 36 ms |
| T9-126 (44,0) | 740 | 265 (35,8%) | 175 (23,6%) | 175 (23,6%) | **350 (47,3%)** | 42 (5,7%) | 48 (6,5%) | 77 (10,4%) | 38 ms |
| T4-129 (54,0) | 628 | 237 (37,7%) | 86 (13,7%) | 127 (20,2%) | **213 (33,9%)** | 115 (18,3%) | 122 (19,4%) | 56 (8,9%) | 45 ms |
| **POOL 6 lượt** | **4174** | **1571 (37,6%)** | **844 (20,2%)** | **940 (22,5%)** | **1784 (42,7%)** | **390 (9,3%)** | **430 (10,3%)** | **389 (9,3%)** | **38 ms** |

Chi tiết histogram pool 6 lượt: {−14:2, −13:6, −12:16, −11:14, −10:17,
−9:5, −8:5, −7:2, −4:2, −3:4, −2:2, −1:314, 0:1571, +1:844, +2:940,
+3:390, +4:24, +5:6, +6:2, +7:2, +8:2, +9:2, +10:2}.
Chi tiết từng lượt (đầy đủ): xem `hidden_files/round130-t3/c2-histogram-all6.txt`.

- rawMs−labelMs median: 9 ms ở cả 6 lượt (S5 9, 118 9, 121 8, 125 9,
  126 10, 129 9) — như đợt 127/128/129, phần lớn lệch KHÔNG tích lũy
  ở bước vẽ rawUnit.
- label−floor(labelCt×30): +1 chiếm 63–70% ở mọi lượt (S5 467/674,
  118 544/772, 121 416/632, 125 533/728, 126 504/740, 129 433/628) —
  nhãn tự thân lượng tử hóa +0/+1 như các đợt trước, không đổi.
- curPix run đông cứng ≥3 tick: 13–20 run mỗi lượt (S5 19, 118 14,
  121 20, 125 14, 126 19, 129 17) — strip cập nhật thưa hơn tick blend
  ở mọi lượt, như T5 đợt 127 đã ghi.

### 2.2 (c2) theo từng lượt — số lần, seq, presented/label

Định nghĩa (c2) = "dang ngo that": strip khớp presented, label khác,
và strip GT[label] ≠ strip GT[presented] (pixel thật sự khác nhãn).
Lấy từ output `analyze-*-labellag.txt` của từng lượt (skp=0 là lát
cắt có thông tin; skp=1: (c2)=0 ở cả 6 lượt).

| Lượt | (c2) skp=0 — tổng | Trong đó thuần +1f | (c2) skp=1 | Seq thuần +1f (presented/label) |
|---|---|---|---|---|
| S5 | 2 | 2 | 0 | 214 (15/14), 328 (15/14) |
| T4-118 | 12 | 8 | 0 | 155 (29/28), 174 (15/14), 230 (20/19), 254 (14/13), 284 (21/20), 310 (14/13), 391 (16/15), 419 (14/13) |
| T3-121 | 3 | 3 | 0 | 129 (16/15), 253 (16/15), 326 (16/15) |
| T9-125 | 5 | 5 | 0 | 203 (13/12), 252 (15/14), 306 (15/14), 430 (14/13), 479 (16/15) |
| T9-126 | 10 | 8 | 0 | 150 (13/12), 175 (14/13), 195 (15/14), 223 (15/14), 379 (13/12), 406 (15/14), 429 (15/14), 485 (14/13) |
| T4-129 | 2 | 2 | 0 | 136 (16/15), 181 (36/35) |
| **Tổng** | **34** | **28** | **0** | — |

- 6 occurrence (c2) còn lại (không thuần +1f) đều gắn 2 event
  stale-ghost đã biết: đợt 118 seq 448/479 (frame 23: 22/18 +4f,
  22/20 +2f, 23/18 +5f, 23/21 +2f); đợt 126 seq 279 (frame 27:
  27/22 +5f, 27/25 +2f). Không có (c2) nào khác ngoài +1f thuần
  và 2 event này.
- **28/28 occurrence thuần +1f đều lag đúng +1f, không đổi dấu.**
  Cặp presented/label trải rộng 12–16, 19–21, 28–29, 35–36 — không
  tập trung một cặp frame.
- Tỷ lệ (c2) thuần +1f theo lượt: 0,30% (S5) / 1,04% (118) / 0,47%
  (121) / 0,69% (125) / 1,08% (126) / 0,32% (129); gộp 28/4174 =
  **0,67%** (khoảng tin cậy 95% Poisson cho count 28: ~19–39, tức
  0,45–0,97%). Chênh lệch giữa các lượt (2 vs 8) nằm trong nhiễu
  Poisson — **không kết luận tỷ lệ (c2) thay đổi theo lượt**.
- Event lag ≥+5f: chỉ 2 event trên (118 frame 23, 126 frame 27);
  4/6 lượt có 0 occurrence ≥+5f (S5, 121, 125, 129 — max +4f).

## 3. Phân tích: phân phối modal có ổn định không?

### 3.1 Bin 0 — mode ổn định, được ủng hộ mạnh

- Bin 0 là **mode (bin đơn lớn nhất) ở 6/6 lượt**: 35,8–38,6%, trung
  bình 37,7%, SD 1,0pp. Độ lệch chuẩn quan sát (~1,0pp) NHỎ HƠN cả
  sai số nhị thức mỗi lượt (~1,8pp ở n≈700) — tức phân tán giữa các
  lượt hoàn toàn giải thích được bằng nhiễu lấy mẫu, không còn biến
  thiên hệ thống. Gộp 6 lượt: 1571/4174 = 37,6% (SE ≈ 0,75pp).
- Tương quan bin 0 vs median tick: Pearson +0,51, Spearman +0,54 —
  yếu, không có thứ tự rõ. **Kết luận: bin 0 ≈ 37–38% là mode ổn
  định của phân phối (pixFrame−label) trên lượt yên hợp lệ.**
- Hệ quả: tuyên bố "modal +1/+2" ở đợt 127 (1 lượt, +1/+2 = 47,3%
  > 0 = 35,8%) cần hiệu chỉnh — ở lượt đó +1 và +2 từng bin (23,6%
  mỗi bin) vẫn THẤP HƠN bin 0 (35,8%); chỉ khi GỘP +1/+2 thì khối
  đó mới vượt bin 0. Với 6 lượt, khối gộp +1/+2 chỉ vượt bin 0 ở
  2/6 lượt (118: 52,7% vs 37,4%; 126: 47,3% vs 35,8%).

### 3.2 Khối +1/+2 gộp — KHÔNG ổn định

- +1/+2 gộp: 33,9–52,7%, trung bình 42,3%, SD 7,0pp — gấp ~3,7 lần
  sai số nhị thức mỗi lượt (~1,9pp). Biến thiên giữa các lượt là
  thật, không phải nhiễu. **Không thể tuyên bố một modal +1/+2 ổn
  định; khoảng dao động quan sát là ~34–53%.**
- Nhưng biến thiên này KHÔNG ngẫu nhiên — xem §3.4.

### 3.3 Bin +3 — KHÔNG ổn định, biến thiên lớn nhất

- +3: 3,8–18,3%, trung bình 9,7%, SD 5,3pp — gấp ~5 lần sai số nhị
  thức (~1,1pp). Đây là bin biến thiên mạnh nhất theo lượt.
- Hiệu chỉnh nhận định T5 đợt 129 §8.1 ("bin +3 phình to ở cả 3 run
  mới"): 3 run đó gồm pool đợt 128 (NHIỄM TẢI, không phải lượt yên
  hợp lệ) + 129a1. Trên 6 lượt HỢP LỆ, +3 trải dài 3,8% (118) tới
  18,3% (129) — không có mức "phình to" chung; giá trị 129a1
  (18,3%) là điểm cao nhất, không phải mức mới của hệ thống.
  Xem §3.4 để biết +3 biến thiên theo cái gì.

### 3.4 Phát hiện mới: hình dạng phân phối xếp thứ tự theo median tickCost

Xếp 6 lượt theo median tickCost tăng dần:

| Median tick | 40,0 | 44,0 | 47,5 | 49,5 | 52,0 | 54,0 |
|---|---|---|---|---|---|---|
| +1/+2 | 52,7% | 47,3% | 43,5% | 39,5% | 36,6% | 33,9% |
| +3 | 3,8% | 5,7% | 7,4% | 10,5% | 12,5% | 18,3% |
| bin 0 | 37,4% | 35,8% | 38,5% | 38,0% | 38,6% | 37,7% |
| snap−label med | 35 ms | 38 ms | 36 ms | 39 ms | 45 ms | 45 ms |

- **+1/+2 giảm ĐƠN ĐIỆU hoàn toàn khi tick chậm lại** (Spearman
  −1,000, Pearson −0,998). **+3 tăng ĐƠN ĐIỆU hoàn toàn khi tick
  chậm lại** (Spearman +1,000, Pearson +0,941). Bin 0 gần như
  phẳng. snap−label median cũng tăng theo tick (Spearman +0,93,
  Pearson +0,87; có 1 đảo thứ tự 47,5 ms → 36 ms).
- Diễn giải thận trọng: khi tick chậm hơn, khối lượng phân phối
  dịch từ +1/+2 sang +3 (và xa hơn: ≥+3 gộp 5,3% → 19,4%),
  trong khi bin 0 giữ nguyên ~37–38%. Điều này PHÙ HỢP với cơ chế
  lấy mẫu có độ trễ phụ thuộc tốc độ tick ở mức TỔNG HỢP — nhưng
  KHÔNG mâu thuẫn với T5 đợt 129 §8.2: theo từng entry, snap−label
  không dự báo lag (lag của entry nào rơi vào bin nào vẫn do động
  lực strip đông cứng + alias quyết định). Hai mức phân tích khác
  nhau: tổng hợp theo lượt (có thứ tự) vs từng entry (không dự báo).
- **Mức tin cậy: GIẢ THUYẾT, chưa phải kết luận.** n=6 lượt; thứ tự
  hạng hoàn hảo với n=6 có p ≈ 0,003 cho một biến nếu kiểm định
  trước, nhưng đây là phát hiện hậu nghiệm trên 2 biến liên quan
  (+1/+2 và +3 bù nhau) nên cần kiểm chứng ngoài mẫu. **Lượt yên
  #8 (T4 đợt 130) là phép thử quyết định** — xem dự báo §4.3.
  Nếu #8 phá vỡ thứ tự (ví dụ median ~44 ms nhưng +3 ~15%), giả
  thuyết này bị bác; nếu giữ thứ tự, nó mạnh lên đáng kể.

## 4. Kết luận modal + dữ liệu còn thiếu cho lượt yên #8

### 4.1 Kết luận với dữ liệu hiện có (6 lượt hợp lệ, n=4174)

1. **Modal được ủng hộ: bin 0, ~37–38%** — mode bin đơn ở 6/6 lượt,
   ổn định trong nhiễu nhị thức. Khoảng tin cậy gộp: 37,6% ± ~1,5pp
   (95%, SE 0,75pp).
2. **Khối +1/+2 gộp KHÔNG có modal ổn định: 33,9–52,7%** (gộp
   42,7%) — biến thiên thật giữa các lượt, xếp thứ tự theo median
   tick (giảm khi tick chậm).
3. **Bin +3 KHÔNG có mức ổn định: 3,8–18,3%** (gộp 9,3%) — biến
   thiên mạnh nhất, xếp thứ tự theo median tick (tăng khi tick chậm).
4. **(c2) thuần +1f: hiếm (0,67% gộp), luôn đúng +1f, không đổi dấu**
   — là lát cắt hiếm của lệch hệ thống, không phải cụm frame đặc biệt.
5. **Giả thuyết seek-latency desync: VẪN CHƯA chứng minh** — phát
   hiện §3.4 chỉ nói hình dạng phân phối nhạy với tốc độ tick, không
   chỉ ra mắt xích drawSrc. Cần instrumentation của T5 (đã phê duyệt)
   + histogram đối chiếu lại trên lượt có instrumentation mới đóng
   được giả thuyết.

### 4.2 Bài học parent §12.1.7 đợt 129 — đã áp dụng

- "ĐỪNG tuyên bố modal ổn định từ 1–2 lượt — cần thêm 1–2 lượt hợp
  lệ nữa." Đợt này đã làm đúng bài học đó: gom đủ 6 lượt hợp lệ
  (thay vì chỉ 2 lượt 127/129 như đợt 129) mới kết luận — và kết
  luận đổi hẳn: bin 0 mới là mode ổn định, còn +1/+2 gộp thì không.
  Tuyên bố modal ở đợt 127 dựa trên 1 lượt đã được hiệu chỉnh ở §3.1.

### 4.3 Lượt yên #8 (T4 đợt 130) cần ghi thêm dữ liệu gì

Để kết luận (và để kiểm chứng giả thuyết §3.4 ngoài mẫu), T4 ghi
đủ các số sau trên JSON lượt #8 (probe MỚI: blendTick tăng dần +
HB129 — không đổi logic đo, chỉ thêm dữ liệu trên lượt dở dang):

1. **Histogram (pixFrame−label) đầy đủ** bằng cùng phương pháp §1
   (script `c2-histogram-all6.py` đã có sẵn — thêm JSON #8 vào danh
   sách RUNS là chạy được): n ghost, từng bin −14..+10, snap−label
   median, rawMs−labelMs median, label−floor, curPix runs ≥3 tick.
2. **Median tickCost + phân rã wallMs + lớp B** (như mọi lượt trước)
   — đây là biến độc lập của giả thuyết §3.4.
3. **(c2) đầy đủ: số lần, seq, presented/label, lag** (cả skp=0 và
   skp=1) + số occurrence lag ≥+5f (có event mới không?).
4. **Dự báo để kiểm chứng (đăng ký TRƯỚC khi T4 đo, falsifiable):**
   - Nếu median #8 ≈ 44–48 ms → kỳ vọng +3 ≈ 6–8% và +1/+2 ≈ 44–48%.
   - Nếu median #8 ≈ 52–54 ms → kỳ vọng +3 ≈ 13–18% và +1/+2 ≈ 34–37%.
   - Nếu median #8 ≈ 40 ms → kỳ vọng +3 ≈ 4% và +1/+2 ≈ 50–53%.
   - Nếu +3 lệch khỏi dải dự báo >5pp (ví dụ median ~44 ms nhưng
     +3 ~15%) → giả thuyết thứ tự theo tick BỊ BÁC, quay lại "phân
     phối nhạy với tải nền từng lượt, không theo một biến duy nhất".
5. **Dữ liệu instrumentation của T5** (log draw `preview.tsx:685` +
   chuỗi drawSrc — đã phê duyệt, chỉ 1–2 vòng loop quanh wrap): đối
   chiếu histogram #8 với log draw để trả lời câu hỏi còn lại duy
   nhất — drawSrc nhận frame mới vào lúc nào, với currentTime nào.
   Chỉ cần 1 lượt yên có instrumentation + histogram đối chiếu lại.

### 4.4 DEF v0.5 — KHÔNG viết đợt này

- DEF v0.4 (PSIAXIS, leg F2) không liên quan tới phân phối (c2).
  Phát hiện §3.4 là giả thuyết về lượt yên WebKit, chưa đủ chắc để
  sửa bất kỳ định nghĩa nào. **Không viết DEF v0.5 cho tới khi lượt
  yên #8 (hoặc #9) xác nhận/không xác nhận thứ tự theo tick.**

## 5. Thống nhất interface analyzer tag=path

### 5.1 Hiện trạng trước khi sửa (nợ T4 đợt 128/129)

| Nhóm | Script | Cách gọi cũ | Vấn đề |
|---|---|---|---|
| Lượt yên | `analyze-t4-tickcost.py`, `analyze-t4-wallbands.py` | CHỈ `tag=path` (`a.split("=",1)` — đường dẫn trần gây `ValueError`) | T4 đợt 129 mắc lại quirk này ở lần gọi đầu |
| Lượt yên | `analyze-t4-labellag.py`, `analyze-t4-lag5.py`, `analyze-t4-skiplatest.py` | CHỈ đường dẫn trần (`sys.argv[1]` — `tag=path` gây `FileNotFoundError`, file analyze ra trống) | T4 đợt 128 + 129 mắc lại ở lần gọi đầu |
| F2 startup | `f2_startup_analyze_121t7/122t4/123t4/124t4/125t4/126t4/127t3.py` | KHÔNG nhận CLI nào — input chỉ qua env `S9_DIR`/`S9_OUT`/`S9_BRACKETS` (mặc định cứng theo từng đợt) | Không gọi được bằng `tag=path` hay đường dẫn trần |

- Bản làm việc của analyzer lượt yên trước đợt này chỉ tồn tại dưới
  dạng copy trong `hidden_files/round128-t4/` = `round129-t4/`
  (md5 giống hệt nhau, đã kiểm); KHÔNG có bản nào trong repo.
- F2 analyzer trong repo `benchmarks/render/` (7 file, 314–449 dòng mỗi
  file) đều là bản sao của `q8_analyze_*` với env mặc định riêng.

### 5.2 Quy tắc thống nhất (áp cho cả 12 script)

1. Mỗi đối số đầu vào chấp nhận **cả hai dạng**: `tag=path` HOẶC
   đường dẫn trần.
2. Analyzer nhiều input (tickcost/wallbands): đường dẫn trần → tag
   suy từ tên file (bỏ `.json`). Định dạng output giữ nguyên
   (`== {tag}: {path}` + các dòng số liệu).
3. Analyzer một input (labellag/lag5/skiplatest): `tag=path` → lấy
   path sau dấu `=` đầu tiên, tag chỉ để gọi (không đổi tên file
   output mặc định); `argv[2]` vẫn là outpath như cũ.
4. F2 analyzer: đối số CLI đầu tiên (dạng nào cũng được) ghi đè
   `S9_OUT`; không đối số → dùng env/mặc định cũ như trước (tương
   thích ngược hoàn toàn). `S9_DIR`/`S9_BRACKETS` không đổi.
5. `tag=` rỗng hoặc thiếu đối số → in `usage:` ra stderr, exit 2
   (thay cho traceback khó đọc).
6. **Chỉ sửa parse argv — KHÔNG đổi logic phân tích.** Diff của 5
   file lượt yên vs bản gốc round128-t4 chỉ có phần parse argv
   (đã kiểm bằng `diff`, xem §5.4); diff của 7 file F2 chỉ có khối
   `__main__` cuối file.

### 5.3 File đã đổi/thêm

**Trong repo (stage, xem §7):**

| File | Thay đổi |
|---|---|
| `benchmarks/render/f2_startup_analyze_121t7.py` | + khối CLI ở `__main__` (ghi đè `S9_OUT`) |
| `benchmarks/render/f2_startup_analyze_122t4.py` | như trên |
| `benchmarks/render/f2_startup_analyze_123t4.py` | như trên |
| `benchmarks/render/f2_startup_analyze_124t4.py` | như trên |
| `benchmarks/render/f2_startup_analyze_125t4.py` | như trên |
| `benchmarks/render/f2_startup_analyze_126t4.py` | như trên |
| `benchmarks/render/f2_startup_analyze_127t3.py` | như trên |
| `benchmarks/render/analyze-t4-tickcost.py` | MỚI — bản canonical, logic giống hệt bản round129-t4, chỉ khác parse argv + 3 dòng note đầu file |
| `benchmarks/render/analyze-t4-wallbands.py` | MỚI — như trên |
| `benchmarks/render/analyze-t4-labellag.py` | MỚI — như trên |
| `benchmarks/render/analyze-t4-lag5.py` | MỚI — như trên |
| `benchmarks/render/analyze-t4-skiplatest.py` | MỚI — như trên |
| `docs/PHASE9_ROUND130_T3_C2MODAL_LIMITS.md` | file này (mới) |

- **Canonical từ nay:** `benchmarks/render/analyze-t4-*.py` là bản
  chuẩn của analyzer lượt yên — các đợt sau copy từ đây thay vì từ
  `hidden_files/round129-t4/`. Bản trong `hidden_files/round129-t4/`
  cũng đã sửa cùng nội dung (để T4 đợt 130 dùng ngay nếu copy theo
  đường cũ); đã kiểm repo copy = hidden copy trừ 3 dòng note đầu
  file (so bằng script strip-header, kết quả IDENTICAL-except-header
  cho cả 5 file).
- **Ngoài repo, KHÔNG stage:** `hidden_files/round130-t3/`
  (`c2-histogram-all6.py` + `c2-histogram-all6.txt` [histogram 6 lượt],
  `dryrun-analyzer.sh` + `dryrun-analyzer.log` + thư mục `dryrun/`
  [output dry-run từng analyzer]).

### 5.4 Kiểm chứng — dry-run tất cả analyzer đã sửa (20/20 PASS)

Driver: `hidden_files/round130-t3/dryrun-analyzer.sh`
(log: `dryrun-analyzer.log`, exit 0). Phương pháp: chạy script GỐC
(round128-t4) bằng cách gọi CŨ → baseline; chạy script MỚI bằng cách
gọi CŨ + cách gọi MỚI → output phải byte-identical.

**Analyzer lượt yên (dữ liệu: JSON lượt yên #7 — T4 đợt 129
attempt1, median 54,0 ms):**

| Analyzer | Mới (cách gọi cũ) vs gốc | Mới (cách gọi mới) vs gốc |
|---|---|---|
| tickcost | PASS byte-identical | PASS — giống gốc trừ dòng header (tag suy từ tên file `preview-b-f3-flip-webkit-t4-attempt1`, theo thiết kế) |
| wallbands | PASS byte-identical | PASS — như trên |
| labellag | PASS byte-identical (file + stdout) | PASS byte-identical với `r129a1=<json>` |
| lag5 | PASS byte-identical (file + stdout) | PASS byte-identical với `r129a1=<json>` |
| skiplatest | PASS byte-identical (file + stdout) | PASS byte-identical với `r129a1=<json>` |

- Giá trị tái tạo đúng trong dry-run: tickcost median **54,0** /
  p90 81,0 / n=540 (khớp LIMITS T4 đợt 129); labellag skp=0
  (c2)=**2** (seq 136/181, khớp §2.2); skp=1 (c2)=0.
- Lỗi gọi: `tag=` rỗng → usage + exit 2 (labellag, tickcost);
  không đối số → usage + exit 2 — PASS, không traceback.

**F2 startup analyzers (dữ liệu: JSON F2 startup đợt 127
`webkit-blob-flaky-127t3-f2startup-interleave.json` + OUT mặc định
của từng file):**

| Analyzer | Không đối số vs `tag=path` vs đường dẫn trần |
|---|---|
| f2_startup_analyze_121t7 | PASS — 3 dạng output byte-identical (exit 0 cả 3) |
| f2_startup_analyze_122t4 | PASS — `tag=` == đường dẫn trần (exit 0 cả 2); dạng không đối số exit 1 vì OUT mặc định `webkit-blob-flaky-122t4-f2startup-legb.json` **KHÔNG CÓ trên đĩa** (thiếu dữ liệu từ trước, không phải do sửa này — xem §6.3) |
| f2_startup_analyze_123t4 | PASS — 3 dạng byte-identical (exit 0) |
| f2_startup_analyze_124t4 | PASS — 3 dạng byte-identical (exit 0) |
| f2_startup_analyze_125t4 | PASS — 3 dạng byte-identical (exit 0) |
| f2_startup_analyze_126t4 | PASS — 3 dạng byte-identical (exit 0) |
| f2_startup_analyze_127t3 | PASS — 3 dạng byte-identical (exit 0), 98 dòng output |

- `py_compile` OK cả 12 file đã sửa.
- **Nợ quirk T4 đợt 128/129 ĐÃ ĐÓNG:** từ nay gọi analyzer bằng
  dạng nào cũng chạy; không còn FileNotFoundError vì `tag=path`
  hay ValueError vì đường dẫn trần.

## 6. Hạn chế + nợ mở (trung thực)

1. **Phát hiện §3.4 là giả thuyết hậu nghiệm, n=6.** Thứ tự hạng
   hoàn hảo có thể là trùng hợp (dù p nhỏ cho một biến, đây là
   2 biến bù nhau được nhìn hậu nghiệm). Chỉ lượt yên #8/#9 ngoài
   mẫu mới nâng nó thành kết luận. Không dùng nó để đổi ngưỡng,
   bar hay DEF.
2. **Histogram chỉ đo được trên lượt yên HỢP LỆ.** Các lượt nhiễm
   tải (đợt 124 attempt2 median 107, đợt 128 pool) có phân phối
   khác (0 là mode tới 49,8%, +1/+2 chỉ 16,1% ở a1) — không gộp
   vào bảng §2; nếu gộp sẽ làm lệch modal.
3. **F2 122t4 thiếu JSON mặc định trên đĩa**
   (`benchmarks/results/webkit-blob-flaky-122t4-f2startup-legb.json`
   không tồn tại) — dạng không đối số exit 1 (FileNotFoundError)
   cả trước và sau khi sửa (đã kiểm: hành vi cũ giữ nguyên).
   Ghi nhận để T2/T4 đợt sau đối chiếu (có thể file đã bị prune
   hoặc chưa từng ghi); không tự tạo dữ liệu giả.
4. **(c2) theo từng entry vẫn chưa giải thích được** — phát hiện mới
   chỉ ở mức tổng hợp theo lượt. Cần instrumentation T5 + lượt #8.
5. **preview.tsx đã đổi trong đợt 130 (T5, instrumentation)** —
   lượt yên #8 của T4 sẽ chạy trên cây đã instrument (theo đúng phê
   duyệt parent §12.3(a) đợt 129: chỉ bật trong lượt probe chẩn
   đoán). Histogram #8 vẫn so sánh được với bảng §2 vì phương pháp
   histogram không đổi; nhưng nếu instrumentation làm chậm tick thì
   median #8 có thể lệch — ghi rõ khi T4 báo cáo, và dự báo §4.3
   phải đọc cùng median thực tế của #8.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 129 §11: mù #48/#49
   (T2), G1 chờ user, birefnet (chỉ thử khi available ≥ 6 GB),
   TTS 39 cấm kiểm lại, ci-security.yml 403, release gate không đổi.

## 7. Batch đã stage (KHÔNG push)

- File paths NUL-delimited:
  `~/workspace/repo-1-push/paths-loop/phase9-round130-t3-c2modal.txt`
  (13 file text: 1 LIMITS này + 5 analyzer lượt yên canonical mới +
  7 F2 analyzer đã sửa; tất cả < 37.768 B — file lớn nhất
  `f2_startup_analyze_127t3.py` 23.825 B; đã verify read-back khớp
  danh sách).
- JSON kết quả gốc (2,7 MB lượt #7; các JSON F2) giữ trên đĩa,
  KHÔNG đưa vào paths.
- Cờ xong: `hidden_files/round130-t3.done`.
