# PHASE9_ROUND131_T3_C2MODAL_LIMITS — Dự báo falsifiable lượt yên WebKit #9 + kiểm chứng (c2)

> Luồng T3, đợt 131, lượt cron 21:35 +07 17/11/2026 (bắt đầu ~14:41Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG chạy đo thật mới (đo là việc T4).
> KHÔNG sửa file production nào (preview.tsx/media.ts), KHÔNG sửa probe đo.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **DEF v0.5: CHƯA VIẾT đợt này** — xem §4 (chưa đủ dữ liệu mới; cần
> lượt #9 xác nhận thêm, như LIMITS gộp đợt 130 §11 mục 9 đã dặn).

## 0. Tóm tắt + trạng thái

1. **BƯỚC 1 — ĐÃ XONG (đăng ký 14:47Z 17/11/2026, xem §1.1):** dự báo
   falsifiable cho lượt yên WebKit #9 được đăng ký TRƯỚC khi T4 đo.
   Bằng chứng T4 chưa đo lúc đăng ký: `round131-t4/` chỉ có file setup
   (prereg 14:46Z, probe, gate script), 0 JSON attempt, 0 log attempt;
   chưa có cờ `round131-t4.done`; chưa có `POSTBOOT_PASS` trên boot mới
   (btime 14:26:41Z); T5 còn đang poll postboot (poll0 14:44Z).
2. **Phương pháp histogram đã tái kiểm 100% trên 7 lượt:** chạy lại
   script T10 đợt 130 (`c2-histogram-7runs.py`, = `c2-histogram-all6.py`
   + thêm JSON #8) trên JSON gốc 7 lượt yên hợp lệ → output
   **byte-identical** với `t10-histogram-with8.txt` của T10 (trừ dòng
   tiêu đề pool "6 lượt" → "7 lượt", sửa nhãn cho đúng số lượt).
   Pool 7 lượt: n=4892 ghost, bin 0: 1825 (37,3%), +1/+2: 2160 (44,2%),
   +3: 423 (8,6%).
3. **Hồi quy 7 lượt (§1.3):** +1/+2 giảm theo median tickCost với độ
   khít rất cao (Pearson −0,998, Spearman −0,991, residual tối đa
   0,85pp); +3 tăng theo median (Pearson +0,938, Spearman +0,991,
   residual tối đa 2,99pp tại điểm 54 ms). Bin 0 gần như phẳng
   (Pearson +0,679, dự báo 36,3–38,5% trên toàn dải median).
4. **Dự báo đã đăng ký (§1.4):** 4 dải median → dải +1/+2 và +3 cụ thể
   (hồi quy ±3pp / ±4pp) + bin 0: 35–39% + (c2) thuần +1f: 2–8 lần,
   tất cả lag đúng +1f, tất cả skp=0; skp=1 (c2)=0; lag ≥+5f = 0.
   Quy tắc bác: quan sát lệch khỏi biên dải dự báo >5pp → giả thuyết
   thứ tự theo tick BỊ BÁC (cùng chuẩn §4.3 đợt 130).
5. **BƯỚC 2 — ĐÃ XONG (kiểm chứng 15:05–15:15Z 17/11/2026, xem §2):**
   lượt #9 hợp lệ (attempt1 20/20, median 56,0 ms, lớp B 5/5).
   Histogram chạy lại độc lập khớp 100% số T4. **VERDICT: giả thuyết
   thứ tự theo tick BỊ BÁC** — +1/+2 quan sát 43,1% lệch +11,8pp so
   với ngoại suy hồi quy tại 56 ms (6,5σ) và phá vỡ thứ tự đơn điệu
   ở cả hai dải; +3 (13,0%) vẫn trong dải dự báo; (c2) thuần +1f = 8
   (trong dải 2–8, ĐÚNG). **Log draw KHÔNG đối chiếu được trực tiếp
   tại các seq (c2)** — cửa sổ log (pass 1–~2.5, pre-flip) không phủ
   seq (c2) nào; trong cửa sổ quan sát được, drawSrc không bao giờ
   trễ sau ct (frameIdx−floor(ct×30) ∈ {0,+1}, 53/53).

## 1. BƯỚC 1 — Đăng ký dự báo falsifiable cho lượt yên #9

### 1.1 Thời điểm đăng ký + bằng chứng T4 chưa đo

- **Đăng ký lúc 14:47Z 17/11/2026** (kiểm chứng lúc 14:47:12Z và
  14:47:27Z; file LIMITS này viết ngay sau đó, mtime xem §5).
- **Bằng chứng T4 chưa đo lúc đăng ký (đã kiểm trên đĩa):**
  - `hidden_files/round131-t4/` chỉ có file setup: `prereg-t4.md`
    (14:46Z), probe copy `probe121t3-ghost-k7.webkit.mjs` (14:45Z),
    `run-t4.sh` / `t4-attempt-inner.sh` / `check-classb-t4.sh` /
    `gate0-wait-t4-f868abad.sh` / `poll-t4.sh` (14:44–14:46Z),
    analyzer copy + `b.json` + `tree-md5.txt` — **0 file JSON attempt,
    0 file log attempt** (`*.log` không tồn tại).
  - **Chưa có cờ `round131-t4.done`** (không tồn tại lúc kiểm).
  - **Chưa có `POSTBOOT_PASS`** trên boot mới (`round131-t5/` không
    có file đó lúc kiểm) — T5 còn đang poll postboot (poll0 14:44Z);
    gate 0 của T4 yêu cầu cờ này nên attempt chưa thể chạy.
  - Boot lúc mở đợt: mới `f868abad-…`, btime 14:26:41Z (boot #78?
    chết trong (14:10Z, 14:26:41Z]); cờ POSTBOOT_PASS 13:39:13Z của
    #78 STALE trên boot mới.
  - Chốt chặn `round-in-progress.md` tồn tại nhưng là **marker MỞ ĐỢT
    131 do parent tạo 14:37Z** (nội dung ghi rõ đợt 131, cron 21:35),
    KHÔNG phải đợt main-chat — tiến hành bình thường (tiền lệ T4
    đợt 130 §0).
- **Cây lúc đăng ký (không đổi so với lúc đóng đợt 130):**
  `preview.tsx` md5 `805409f0` (instrumentation (c2) của T5 đợt 130),
  `media.ts` md5 `2c384ed1`.
- **Kế hoạch đo của T4 (theo prereg-t4.md 14:46Z, chỉ đọc — không sửa):**
  tối đa 3 attempt, 20 pass/attempt, probe MỚI (blendTick tăng dần +
  HB129), **BẬT log draw**: đặt `window.__vcutC2DrawLog = true` sau
  khi app boot, trước các pass; fetch `window.__vcutC2DrawLogEntries`
  sau mỗi pass + cuối attempt; analyzer mới `analyze-t4-c2drawlog.py`
  (tóm tắt log draw: n, theo pass, status). Đây là lượt yên ĐẦU TIÊN
  có dữ liệu log draw — lượt #8 chạy trên cùng cây `805409f0` nhưng cờ
  mặc định TẮT trong lúc đo nên không có log draw nào.

### 1.2 Bảng 7 lượt yên hợp lệ — histogram (pixFrame−label), phương pháp T3 đợt 130

Phương pháp (giữ nguyên T5 đợt 127 §8.3 / T5 đợt 129 §8.1 / T3 đợt 130
§1): mọi ghost entry hậu flip+2000ms (viaRvfc=0), pool cả skp=0 và
skp=1; pixFrame = frame GT khớp GẦN NHẤT nhãn (thresh ≤2 bit, strip
48px kênh G, GT `round111-m5/frames-nonperiodic`); kèm snapMs−labelMs,
rawMs−labelMs, label−floor(labelCt×30), run curPix đông cứng ≥3 tick.
Script: `hidden_files/round131-t3/c2-histogram-7runs.py` (copy từ
`t10-histogram-with8.py` của T10 đợt 130, chỉ sửa tiêu đề pool "6 lượt"
→ "7 lượt"), output `c2-histogram-7runs.txt`.

**Tái kiểm phương pháp:** chạy lại trên JSON gốc 7 lượt → output
byte-identical với `hidden_files/round130-t10/t10-histogram-with8.txt`
(trừ đúng dòng tiêu đề pool). Đặc biệt tái tạo đúng số lượt #8 đã công
bố: n=718, 0:254 (35,4%), +1:185, +2:191, +1/+2:376 (52,4%),
+3:33 (4,6%), snap−label median 34 ms, rawMs−labelMs median 9 ms.

| Lượt (median tickCost) | n ghost | 0 | +1/+2 | +3 | ≥+3 | <0 | snap−label med |
|---|---|---|---|---|---|---|---|
| T4-118 (40,0) | 772 | 289 (37,4%) | **407 (52,7%)** | 29 (3,8%) | 41 (5,3%) | 35 (4,5%) | 35 ms |
| T4-130 #8 (40,0) | 718 | 254 (35,4%) | **376 (52,4%)** | 33 (4,6%) | 33 (4,6%) | 55 (7,7%) | 34 ms |
| T9-126 (44,0) | 740 | 265 (35,8%) | **350 (47,3%)** | 42 (5,7%) | 48 (6,5%) | 77 (10,4%) | 38 ms |
| T9-125 (47,5) | 728 | 280 (38,5%) | **317 (43,5%)** | 54 (7,4%) | 54 (7,4%) | 77 (10,6%) | 36 ms |
| S5-116 (49,5) | 674 | 256 (38,0%) | **266 (39,5%)** | 71 (10,5%) | 77 (11,4%) | 75 (11,1%) | 39 ms |
| T3-121 (52,0) | 632 | 244 (38,6%) | **231 (36,6%)** | 79 (12,5%) | 88 (13,9%) | 69 (10,9%) | 45 ms |
| T4-129 (54,0) | 628 | 237 (37,7%) | **213 (33,9%)** | 115 (18,3%) | 122 (19,4%) | 56 (8,9%) | 45 ms |
| **POOL 7 lượt** | **4892** | **1825 (37,3%)** | **2160 (44,2%)** | **423 (8,6%)** | **463 (9,5%)** | **444 (9,1%)** | **38 ms** |

Chi tiết histogram pool 7 lượt: {−14:2, −13:6, −12:16, −11:14, −10:19,
−9:5, −8:7, −7:2, −4:2, −3:4, −2:2, −1:365, 0:1825, +1:1029, +2:1131,
+3:423, +4:24, +5:6, +6:2, +7:2, +8:2, +9:2, +10:2}.
Chi tiết từng lượt (đầy đủ): xem `hidden_files/round131-t3/c2-histogram-7runs.txt`.

- rawMs−labelMs median: 9 ms ở 6/7 lượt (S5 9, 118 9, 121 8, 125 9,
  126 10, 129 9, #8 9) — lệch KHÔNG tích lũy ở bước vẽ rawUnit.
- label−floor(labelCt×30): +1 chiếm 63–76% ở mọi lượt (#8: 548/718 =
  76,3% — cao nhất trong 7 lượt, nhưng vẫn cùng mẫu lượng tử hóa
  +0/+1 của nhãn).
- curPix run đông cứng ≥3 tick: 13–20 run mỗi lượt (#8: 15 run).

### 1.2b (c2) thuần +1f qua 7 lượt — số lần, skp nào

Định nghĩa (c2) = strip khớp presented, label khác, và strip
GT[label] ≠ strip GT[presented]. Số lấy từ output `analyze-*-labellag.txt`
của từng lượt — **luôn đọc mục skippedLatest=0** (mục có thông tin;
bài học đợt 130 §12.1.2: T8 đọc nhầm mục skippedLatest=1 nên tính (c2)=0
cho lượt #8; số đúng đã được T10 đối chiếu bằng chạy lại analyzer,
byte-identical).

| Lượt | (c2) skp=0 — tổng | Trong đó thuần +1f | (c2) skp=1 |
|---|---|---|---|
| S5-116 | 2 | 2 | 0 |
| T4-118 | 12 | 8 | 0 |
| T3-121 | 3 | 3 | 0 |
| T9-125 | 5 | 5 | 0 |
| T9-126 | 10 | 8 | 0 |
| T4-129 | 2 | 2 | 0 |
| T4-130 #8 | 6 | 6 | 0 |
| **Tổng 7 lượt** | **40** | **34** | **0** |

- 6 occurrence (c2) còn lại (không thuần +1f) đều gắn 2 event
  stale-ghost đã biết: đợt 118 seq 448/479 (frame 23) và đợt 126
  seq 279 (frame 27). Lượt #8: 0 event mới, 0 occurrence ≥+5f.
- **34/34 occurrence thuần +1f đều lag đúng +1f, không đổi dấu.**
  Tỷ lệ gộp: 34/4892 = **0,70%** (95% Poisson cho count 34: ~24–47,
  tức 0,49–0,96%). Per-run: 2–8 occurrence (S5 2, 118 8, 121 3,
  125 5, 126 8, 129 2, #8 6) — chênh lệch nằm trong nhiễu Poisson,
  KHÔNG kết luận tỷ lệ thay đổi theo lượt.
- Kỳ vọng cho một lượt n≈700 ghost: 700 × 0,70% ≈ **4,9 occurrence**
  (Poisson 95% CI cho λ≈4,9: 1–10).

### 1.3 Hồi quy theo median tickCost (7 lượt) — cơ sở của dự báo

Hồi quy tuyến tính OLS của tỷ lệ bin theo median tickCost (ms):

| Biến | Slope (pp/ms) | Intercept | Pearson r | Spearman ρ | Residual tối đa |
|---|---|---|---|---|---|
| +1/+2 | −1,334 | +106,0 | −0,998 | −0,991 | 0,85pp |
| +3 | +0,870 | −31,7 | +0,938 | +0,991 | 2,99pp (điểm 54 ms) |
| bin 0 | +0,154 | +30,1 | +0,679 | +0,685 | 1,12pp |

- **+1/+2 khít gần như hoàn hảo:** residual ≤0,85pp trên cả 7 lượt —
  nhỏ hơn cả sai số nhị thức mỗi lượt (~1,9pp). Dự báo theo hồi quy:
  40 ms → 52,7%; 44 ms → 47,3%; 48 ms → 42,0%; 52 ms → 36,6%;
  54 ms → 34,0%.
- **+3 khít kém hơn ở đầu cao:** residual lớn nhất +2,99pp tại
  54 ms (thực tế 18,3% vs hồi quy 15,3%) — quan hệ +3 theo median
  có thể phi tuyến ở đầu chậm (tăng nhanh hơn tuyến tính). Dự báo
  theo hồi quy: 40 ms → 3,1%; 44 ms → 6,6%; 48 ms → 10,1%;
  52 ms → 13,6%; 54 ms → 15,3%. Vì residual này, dải dự báo +3 lấy
  **±4pp** (rộng hơn +1/+2 là ±3pp).
- **Bin 0 gần như phẳng:** dự báo hồi quy 36,3% (40 ms) → 38,5%
  (54 ms); quan sát 35,4–38,6% — dải dự báo lấy **35–39%** cho mọi
  median.
- Thứ tự đơn điệu giữ nguyên 7/7 lượt: +1/+2 giảm đơn điệu theo
  median (52,7 → 52,4 → 47,3 → 43,5 → 39,5 → 36,6 → 33,9); +3 tăng
  đơn điệu (3,8 → 4,6 → 5,7 → 7,4 → 10,5 → 12,5 → 18,3). Hai lượt
  median 40,0 ms cho phân phối gần như giống nhau (+1/+2 52,7% vs
  52,4%; +3 3,8% vs 4,6%) — neo chặt nhất của dự báo.
- Lưu ý trung thực: n=7 lượt, phát hiện vẫn là hậu nghiệm trên 2 biến
  bù nhau; lượt #9 là phép thử ngoài mẫu THỨ HAI (sau #8).

### 1.4 Dự báo falsifiable cho lượt yên #9 (ĐÃ ĐĂNG KÝ 14:47Z — trước khi T4 đo)

Đọc bảng theo median tickCost THỰC TẾ của lượt #9 (do T4 đo).
Dải = giá trị hồi quy tại giữa dải median ±3pp (+1/+2) / ±4pp (+3),
làm tròn ra ngoài.

| Median #9 | +1/+2 dự báo | +3 dự báo | bin 0 dự báo |
|---|---|---|---|
| 39–42 ms | **49–55%** (hồi quy @40,5 ms: 52,0%) | **0–8%** (hồi quy: 3,5%) | 35–39% |
| 43–46 ms | **44–50%** (hồi quy @44,5 ms: 46,6%) | **3–11%** (hồi quy: 7,0%) | 35–39% |
| 47–50 ms | **38–44%** (hồi quy @48,5 ms: 41,3%) | **7–15%** (hồi quy: 10,5%) | 35–39% |
| 51–55 ms | **32–38%** (hồi quy @53 ms: 35,3%) | **10–18%** (hồi quy: 14,4%) | 35–39% |

- **Neo chặt nếu median #9 ≈ 40 ms** (kịch bản có khả năng cao nhất
  vì 2/7 lượt trước ở 40,0 ms): kỳ vọng +1/+2 ≈ 52–53% và
  +3 ≈ 4–5% (hai lượt 40 ms thực tế: 52,7%/52,4% và 3,8%/4,6%).
- **(c2) kỳ vọng cho lượt #9 (lượt hợp lệ, n≈630–770 ghost):**
  thuần +1f **2–8 occurrence**, tất cả lag đúng +1f, tất cả ở mục
  **skippedLatest=0**; (c2) ở mục skippedLatest=1 = **0**;
  occurrence lag ≥+5f = **0** (trừ event stale-ghost kiểu cũ nếu tái
  hiện — nếu có thì ghi rõ seq/frame, không tính vào (c2) thuần).
- **Các số phụ kỳ vọng:** snapMs−labelMs median 34–45 ms;
  rawMs−labelMs median 8–10 ms; label−floor +1 chiếm ~63–76%;
  curPix run ≥3 tick: 13–20 run.
- **Phạm vi áp dụng:** dự báo chỉ kiểm trên **lượt yên HỢP LỆ**
  (attempt 20/20 + lớp B 5/5 + median ≤60 ms). Attempt dở dang
  (pass-timeout) chỉ báo histogram riêng, KHÔNG tính vào verdict
  dự báo — cùng luật các đợt trước (histogram chỉ đo được trên lượt
  yên hợp lệ).

### 1.5 Quy tắc verdict (áp cho BƯỚC 2, đã chốt trước khi có dữ liệu #9)

- **ĐÚNG (xác nhận):** cả hai dải (+1/+2 và +3) quan sát nằm TRONG
  dải dự báo của hàng median tương ứng, VÀ bin 0 trong 35–39%.
- **SAI (giả thuyết thứ tự theo tick BỊ BÁC):** bất kỳ dải nào trong
  hai dải chính quan sát nằm NGOÀI dải dự báo **>5pp** (cùng chuẩn
  §4.3 đợt 130) — ví dụ median ~44 ms nhưng +3 ~15%.
- **SÁT BIÊN (không bác, không xác nhận mạnh):** quan sát ngoài dải
  nhưng ≤5pp khỏi biên gần nhất — ghi rõ, không tự làm tròn thành
  ĐÚNG hay SAI.
- **(c2):** ĐÚNG nếu count thuần +1f trong 2–8, tất cả +1f, skp=1 = 0,
  lag ≥+5f = 0. Ngoài dải count (0–1 hoặc ≥9) thì ghi rõ là lệch
  Poisson, KHÔNG tự bác giả thuyết phân phối (count nhỏ, nhiễu lớn).
- Nếu lượt #9 KHÔNG hợp lệ (không attempt nào 20/20, hoặc median
  >60, hoặc lớp B vi phạm): verdict dự báo ghi "KHÔNG CÓ LƯỢT HỢP
  LỆ ĐỂ KIỂM" — không dùng partial để kết luận.

### 1.6 Kế hoạch đối chiếu log draw (BƯỚC 2)

Lượt #9 là lượt yên đầu tiên BẬT log draw (quyết parent §12.3(a) đợt
130). Đối chiếu histogram #9 với log draw theo quy trình sau (T5 đợt
131 phân tích log draw chuyên sâu; T3 chỉ đối chiếu ở mức cần cho
giả thuyết (c2)):

1. Xác nhận file log draw / entries có trên đĩa (qua JSON attempt của
   T4: trường `c2DrawLog` + `c2DrawLogStatus`, hoặc output của
   `analyze-t4-c2drawlog.py` của T4) — ghi rõ n entries, có phủ cửa
   sổ đo không, cờ có bật trong lúc đo không.
2. Với mỗi (c2) occurrence (seq, presented/label), kiểm tra log draw
   quanh tick tương ứng: drawSrc được tạo/vẽ lúc nào, với currentTime
   nào — có trễ ~1 frame so với label không?
3. Quy tắc đọc (đăng ký trước): **ỦNG HỘ seek-latency desync** nếu
   tại các seq (c2), log draw cho thấy drawSrc nhận frame mới trễ
   ~1 frame so với label (và không trễ tại các seq không-(c2) đối
   chứng); **LÀM YẾU desync** nếu drawSrc đúng giờ tại các seq (c2).
   Không có log draw (cờ không bật / entries rỗng) thì ghi rõ
   "chưa đối chiếu được — chờ lượt sau", không suy luận thay.
4. Không chạy lượt đo E4 hay TTS nào cho việc này (quyết parent
   §12.3(b) đợt 130).

## 2. BƯỚC 2 — Kiểm chứng (ĐÃ XONG 15:05–15:15Z 17/11/2026)

### 2.1 Lượt #9 thực tế (T4 đo 14:5xZ, T3 kiểm chứng độc lập trên JSON gốc)

- **Attempt1 20/20, exit 0 — LƯỢT YÊN HỢP LỆ #9, ĐÓNG 14:59Z.**
  tickCost total n=557 median **56,0 ms** (p90 81,0; hậu flip+2000ms
  n=412 median 56,0); BlendTick/pass 22,0; rAF/pass median 34.
  **Lớp B 5/5 ĐẠT** (load1 max 3,08; RAM min 1157 MB, 0 mẫu <1024 MB;
  load5 cuối 1,33; không reboot trong cửa sổ đo; apt/dpkg 0).
  Ngưỡng WebKit ≤60 ms GIỮ (median chậm nhất trong 8 lượt hợp lệ).
  0 dòng HB129 — lượt sạch, không kẹt rAF.
- **Reboot SAU khi T4 xong:** boot f868abad (btime 14:26:41Z) chết,
  boot mới ad1327ef btime 15:01:30Z — T4 xong 14:59Z nên lượt yên
  #9 GIỮ NGUYÊN (tiền lệ đợt 129/130: xong trước reboot thì giữ).
  Waiter của T3 bị SIGTERM ~15:02Z theo reboot; T3 khôi phục bằng
  kiểm đĩa trước khi kết luận (không spawn lại, không chạy lại đo).
- Lưu ý: LIMITS riêng của T4 chưa có trong repo docs lúc T3 kiểm
  chứng (không file PHASE9_ROUND131_T4* lúc 15:05Z) — mọi số dưới
  đây đều từ JSON gốc + analyzer chạy lại độc lập, không qua LIMITS
  trung gian; T10 đối chiếu sau.

### 2.2 Histogram #9 — T3 chạy lại độc lập, khớp 100% số T4

- Script `c2-histogram-8runs.py` (= `c2-histogram-7runs.py` + JSON #9,
  chỉ thêm 1 dòng RUNS + sửa tiêu đề pool "7 lượt" → "8 lượt"),
  output `c2-histogram-8runs.txt`, trên JSON gốc
  `round131-t4/preview-b-f3-flip-webkit-t4-attempt1.json` (2.832.517 B):
  nTicks post flip+2000ms: 328, nGhost: **656**, nomatch: 0,
  srcKind canvas 656/656.
- hist chi tiết: {−15:2, −13:2, −12:6, −10:4, −9:4, −6:2, −3:2, −1:42,
  **0:222 (33,8%)**, +1:118 (18,0%), +2:165 (25,2%),
  **+1/+2:283 (43,1%)**, **+3:85 (13,0%)**, +4:2 (0,3%),
  ≥+3:87 (13,3%), <0:64 (9,8%)}.
- snapMs−labelMs median **44 ms** (mean 48,8; p90 76); rawMs−labelMs
  median **9 ms**; label−floor(labelCt×30): {1:447, 0:209};
  curPix run đông cứng ≥3 tick: **21 run** (nhiều nhất trong 8 lượt;
  dải 7 lượt trước: 13–20).
- So với `t4-histogram-with9.txt` của T4: **khớp toàn bộ** — hist chi
  tiết, mọi tỷ lệ, snap/raw median, label−floor, danh sách runs
  (kể cả run cuối (419,421,3) bao cụm (c2) seq 420–421, xem §2.5).
- Analyzer tickcost canonical chạy lại trên JSON gốc: median 56,0 —
  khớp T4. Wallbands T4: 0–20k 56,0 / 20–32k 57,0 / 32–45k 48,0 /
  45–62k 61,0 / 62–70k 57,5 / 70–80k 55,0 — không còn dải đầu cao,
  dải chậm nhất nằm giữa lượt (45–62k).
- Pool 8 lượt hợp lệ: n=5548, 0: 2047 (36,9%), +1: 1147 (20,7%),
  +2: 1296 (23,4%), +1/+2: 2443 (44,0%), +3: 508 (9,2%),
  ≥+3: 550 (9,9%), <0: 508 (9,2%).

### 2.3 Verdict dự báo — GIẢ THUYẾT THỨ TỰ THEO TICK BỊ BÁC

- **Median #9 = 56,0 ms — NGOÀI dải median đã đăng ký (tối đa
  51–55 ms) đúng 1 ms.** Dự báo đã đăng ký không phủ trực tiếp điểm
  56 ms; verdict dưới đây dựa trên cả ba chân: (a) dải gần nhất
  51–55 ms, (b) ngoại suy hồi quy 7 lượt tại 56 ms, (c) thứ tự đơn
  điệu (không cần dải) — cả ba cùng hướng tới một kết luận.
- **+1/+2: quan sát 43,1% — SAI.**
  - Vs dải gần nhất (51–55 ms: 32–38%): lệch **+5,1pp** khỏi biên
    trên — VƯỢT ngưỡng bác >5pp của quy tắc §1.5 (sát nút, chỉ 0,1pp
    qua vạch).
  - Vs ngoại suy hồi quy 7 lượt tại 56 ms (dự báo 31,3%): lệch
    **+11,8pp = 6,5σ** (SE nhị thức tại n=656, p≈31%: 1,81pp) —
    lệch quyết định, không thể là nhiễu lấy mẫu.
  - So sánh trực quan: 43,1% là mức của lượt 47,5 ms (43,5%), không
    phải mức của lượt chậm nhất.
- **+3: quan sát 13,0% — ĐÚNG.**
  - Vs dải gần nhất (10–18%): TRONG dải.
  - Vs ngoại suy hồi quy tại 56 ms (dự báo 17,0%): lệch −4,0pp
    (−2,7σ, SE 1,47pp) — trong dải ±4pp (13–21%), đúng ở biên dưới.
- **Bin 0: quan sát 33,8% — SÁT BIÊN.**
  - Vs dải 35–39%: dưới biên 1,2pp — lệch −1,7σ (SE 1,89pp), trong
    nhiễu. Nhưng là lượt ĐẦU TIÊN bin 0 < 35,4% (dải 7 lượt trước:
    35,4–38,6%) và lệch −5,0pp so với ngoại suy hồi quy (38,8%) —
    tuyên bố "bin 0 ổn định 37–38%" cũng yếu đi; dải 8 lượt nay là
    33,8–38,6%.
- **Thứ tự đơn điệu (8 lượt) — PHÁ VỠ Ở CẢ HAI DẢI:**
  - +1/+2 theo median tăng dần: 52,7 → 52,4 → 47,3 → 43,5 → 39,5 →
    36,6 → 33,9 → **43,1** — đảo chiều tại #9 (43,1 > 33,9 dù
    median chậm hơn 2 ms). Spearman −0,991 (7 lượt) → **−0,850**;
    Pearson −0,998 → −0,859.
  - +3 theo median tăng dần: 3,8 → 4,6 → 5,7 → 7,4 → 10,5 → 12,5 →
    18,3 → **13,0** — cũng đảo chiều (13,0 < 18,3). Spearman
    +0,991 → +0,970; Pearson +0,938 → +0,911.
- **Kết luận: giả thuyết "hình dạng phân phối xếp thứ tự đơn điệu
  theo median tickCost" BỊ BÁC bởi lượt #9** — phép thử ngoài mẫu
  thứ hai phá vỡ thứ tự ở cả hai dải, và dải +1/+2 lệch khỏi ngoại
  suy tới 6,5σ. Đây là kết quả ÂM có giá trị: 7 lượt cho thứ tự gần
  như hoàn hảo nhưng đó là phát hiện hậu nghiệm trên n=7; lượt thứ 8
  ngoài mẫu không giữ thứ tự. Không dùng giả thuyết này để dự báo
  lượt sau nữa.
- **Yếu tố nhiễu cần ghi rõ (không dùng để né verdict):** #9 là lượt
  ĐẦU TIÊN bật log draw. Median 56,0 ms là chậm nhất từ trước tới
  nay — log có thể làm chậm tick — NHƯNG phân phối lại giống lượt
  47,5 ms, ngược hướng dự báo (tick chậm hơn mà +1/+2 lại cao hơn,
  +3 lại thấp hơn). Hai cách đọc đều dẫn tới cùng kết luận thực hành:
  (i) thứ tự theo tick vốn là trùng hợp (n nhỏ, hậu nghiệm) — nay bị
  bác; (ii) instrumentation đổi chế độ hệ thống nên đường cong cũ
  không còn áp dụng cho lượt có log — thì giả thuyết dạng đơn giản
  cũng không dùng được nữa. Cần biến giải thích khác (T5 phân tích
  log draw + T3 đợt sau xem xét lại với dữ liệu #9 trong tay).
- **Các số phụ dự báo (§1.4):** snap−label median 44 ms (trong
  34–45 ✓); raw−label median 9 ms (trong 8–10 ✓); label−floor +1:
  447/656 = 68,1% (trong 63–76% ✓); curPix runs 21 (hơi trên dải
  13–20 — vượt 1 run, không đáng kể).
- **Verdict tổng BƯỚC 2: dự báo phân phối SAI (bác giả thuyết thứ tự);
  dự báo (c2) ĐÚNG; bin 0 SÁT BIÊN.**

### 2.4 Đếm (c2) — đọc đúng mục skippedLatest=0 (bài học đợt 130 §12.1.2)

- Chạy lại analyzer canonical `benchmarks/render/analyze-t4-labellag.py`
  trên JSON gốc → output **byte-identical** với file T4
  (`t3-rerun-labellag.txt` trong `hidden_files/round131-t3/`).
- **Mục skippedLatest=0 (mục có thông tin — đang đọc mục này):**
  nTick=267, nOccurrence=534, (c)=9, **(c2)=9** — tất cả lag ≥0,
  median 1f, p90 1f, max 3f, ≥5f: 0. Danh sách đầy đủ:
  (161, 15/14, +1), (204, 16/15, +1), (246, 16/15, +1),
  (267, 16/15, +1), (288, 15/14, +1), (375, 16/15, +1),
  (397, 17/16, +1), (420, 16/15, +1), (421, 19/16, +3).
- Mục skippedLatest=1: nTick=61, nOccurrence=122, (c)=0, **(c2)=0**
  — ghi rõ để không nhầm như T8 đợt 130 (đọc nhầm mục này thành 0
  cho cả attempt).
- **(c2) thuần +1f = 8 — TRONG dải dự báo 2–8 (đúng biên trên),
  tất cả lag đúng +1f. (c2) skp=1 = 0 ✓. Lag ≥+5f = 0 ✓.
  Dự báo (c2) ĐÚNG.**
- Tổng 8 lượt hợp lệ: (c2) thuần +1f = 42 (34 + 8); tổng (c2)
  skp=0 = 49 (40 + 9); tỷ lệ thuần +1f gộp = 42/5548 = **0,76%**.

### 2.5 Trường hợp +3f mới (seq 421) — cụm 2 tick, nhãn bắt kịp ngay

- seq 420 (tBlend 78.719): ghost label 15 (labelMs 78.488) →
  presented 16 (+1f). seq 421 (tBlend 78.810, cách 91 ms ≈ 2,7
  frame): ghost label 16 (labelMs 78.667) → presented 19 (+3f).
  seq 422 (tBlend 78.900): ghost label 16 + label 19 — nhãn đã
  bắt kịp 19.
- Diễn giải: trong tick 420→421 (91 ms, chậm hơn median 56 ms),
  strip tiến 16→19 (+3, theo đúng nhịp wall-time) trong khi nhãn
  chỉ tiến 15→16 (+1) — nhãn "đứng" 1 tick rồi bắt kịp ngay ở
  seq 422. Cùng HƯỚNG với mọi (c2) trước (strip trước nhãn), chỉ
  lớn hơn về độ lớn, kéo dài đúng 1 tick.
- KHÁC mẫu event stale-ghost cũ (frame 23 đợt 118, frame 27 đợt
  126: nhiều (c2) tại CÙNG frame, lag tới +5f): ở đây 2 tick liên
  tiếp, nhãn khác nhau (15, 16), không có lag ≥+5f. Ghi là cụm
  2 tick (420 +1f, 421 +3f), không gộp vào event cũ. Lần đầu tiên
  có (c2) +3f không gắn event stale-ghost.
- curPix run đông cứng (419,421,3) bao đúng cụm này — strip đông
  cứng 3 tick trong khi nhãn chạy.

### 2.6 Đối chiếu log draw — KHÔNG đối chiếu được trực tiếp tại các seq (c2)

- **Log có thật:** `y2.c2DrawLog` là list **103 entries** trong JSON
  gốc (drawSrc 53 / rawUnit 50; loop 1: 53 / loop 2: 50; stage
  plain-native 53 / rawUnit 50; srcKind canvas 1280x720; readyState 4
  ở 103/103; seeking False ở 103/103; frameIdx 0–67; ct 0–2,233 s;
  wallMs 10.382–17.223). Analyzer `analyze-t4-c2drawlog.py` của T4
  tóm tắt khớp các số này.
- **Cửa sổ log không phủ seq (c2) nào:** 43 blendTick có tBlend
  trong [10.382, 17.223] là seq 0–42 — TẤT CẢ pre-flip (flip wallMs
  27.639; cửa sổ phân tích (c2) bắt đầu từ flip+2000ms). **0/9 seq
  (c2) nằm trong cửa sổ log** (tBlend các seq (c2): 36.626–78.810).
  Một lần wrap duy nhất trong log: frameIdx 64→0 tại wallMs 14.111
  (loop 1→2).
- Hệ quả: đối chiếu từng seq (c2) theo §1.6 bước 2 là KHÔNG THỂ với
  log này — log chỉ ghi 2 vòng loop đầu quanh wrap đầu tiên (diễn ra
  ở pass 1–~2.5, trước flip), trong khi (c2) chỉ phân tích sau
  flip+2000ms. Đây là giới hạn thiết kế của instrumentation, không
  phải lỗi đo của T4.
- **Điều log CHO thấy (trong cửa sổ quan sát được):**
  frameIdx − floor(ct×30) ở các entry drawSrc: 0 (20 entry) hoặc +1
  (33 entry) — KHÔNG BAO GIỜ âm (53/53); rawUnit tương tự (0: 18,
  +1: 32). Trong cửa sổ quan sát được, drawSrc KHÔNG BAO GIỜ trễ
  sau ct — luôn đúng giờ hoặc trước 1 frame. Không có bằng chứng
  trễ −1f của drawSrc ở nơi quan sát được; nhưng cửa sổ này không
  chứa seq (c2) nào nên KHÔNG kết luận được về cơ chế tại các
  seq (c2) — cơ chế seek-latency desync VẪN CHƯA chứng minh, và
  cũng chưa bị bác bởi log này.
- **Đề xuất cho T5/đợt sau (không làm trong luồng này):** muốn kiểm
  desync tại seq (c2) thì log phải phủ cửa sổ hậu-flip (vd ghi thêm
  1–2 vòng loop sau flip, hoặc bật log trong suốt lượt đo thay vì
  chỉ 2 vòng đầu). T5 đợt 131 phân tích log draw chuyên sâu theo
  quyết parent §12.3(b) đợt 130 — T3 chuyển dữ liệu này cho T5.

### 2.7 Ghi chú vận hành đợt này

- Reboot GIỮA LUỘT lần thứ ba liên tiếp quanh ranh giới đợt:
  #78?→mới (btime 15:01:30Z, boot_id ad1327ef) SAU khi T4 xong
  (14:59Z) — lượt yên #9 giữ nguyên; waiter T3 bị SIGTERM ~15:02Z
  theo reboot; T3 khôi phục bằng kiểm đĩa (không spawn lại, không
  chạy lại đo). Boot lúc mở đợt 131 (f868abad, btime 14:26:41Z) sống
  14:26–15:01Z (~35 phút).
- T4 chưa viết LIMITS riêng lúc T3 kiểm chứng — mọi số trên đều từ
  JSON gốc + analyzer chạy lại độc lập (histogram + labellag +
  tickcost đều khớp 100% số T4).
- Không chạy đo E4/TTS; không sửa DEF; không đụng production;
  không đụng TTS 39, birefnet.

## 3. Hạn chế + nợ mở (trung thực)

1. **Dự báo là giả thuyết hậu nghiệm, n=7 lượt.** Lượt #9 là phép thử
   ngoài mẫu thứ hai; dù #9 đúng nữa thì cơ chế vẫn chưa chứng minh
   — chỉ hình dạng phân phối theo tick được củng cố. Không dùng dự
   báo để đổi ngưỡng, bar hay DEF.
2. **+3 có residual lớn ở đầu chậm (2,99pp tại 54 ms)** — quan hệ có
   thể phi tuyến; dải +3 ở hàng 51–55 ms là dải kém chắc nhất.
3. **Histogram chỉ đo được trên lượt yên HỢP LỆ.** Các lượt nhiễm tải
   có phân phối khác — không gộp vào bảng §1.2.
4. **(c2) theo từng entry vẫn chưa giải thích được** — phát hiện chỉ ở
   mức tổng hợp theo lượt. Đối chiếu log draw lượt #9 là bước phân
   biệt tiếp theo; T5 đợt 131 phân tích log draw chuyên sâu.
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 130 §11: mù #49 B mở
   + mù #50 mới mở (T2), G1 chờ user, R9 (a) chờ user, birefnet (chỉ
   thử khi available ≥ 6 GB), TTS 39 cấm kiểm lại, ci-security.yml
   403, release gate không đổi.

## 4. DEF v0.5 — CHƯA VIẾT đợt này

- DEF v0.4 không liên quan tới phân phối (c2). Giả thuyết thứ tự theo
  tick cần thêm lượt #9 xác nhận mới đủ chuẩn để sửa định nghĩa nào
  (LIMITS gộp đợt 130 §11 mục 9: "chỉ ghi giả thuyết thứ tự theo tick
  là 'được củng cố bởi lượt #8' khi có thêm lượt #9 — chưa đủ để sửa
  định nghĩa nào"). **Không viết DEF v0.5 đợt này** — kể cả sau BƯỚC 2,
  trừ khi dữ liệu #9 + log draw cùng cho bằng chứng cơ chế mới đủ
  chuẩn (khi đó ghi rõ trong BƯỚC 2, vẫn không sửa file v0.4).
- **Cập nhật sau BƯỚC 2 (15:15Z): dữ liệu #9 BÁC giả thuyết thứ tự
  theo tick (§2.3) thay vì xác nhận — càng không có cơ sở viết
  DEF v0.5.** Không sửa file v0.4; không ghi giả thuyết bị bác vào
  DEF dưới dạng kết luận.

## 5. Batch đã stage (KHÔNG push) + file làm việc

- File paths NUL-delimited:
  `~/workspace/repo-1-push/paths-loop/phase9-round131-t3-c2modal.txt`
  (1 file text: LIMITS này; đã verify read-back — xem dưới).
- Hồ sơ làm việc (ngoài repo, KHÔNG stage — theo tiền lệ đợt 130):
  `hidden_files/round131-t3/` (`c2-histogram-7runs.py` +
  `c2-histogram-7runs.txt` [histogram 7 lượt, tái tạo byte-identical
  output T10 đợt 130]).
- Cờ xong: `hidden_files/round131-t3.done` (touch khi đóng BƯỚC 1
  hoặc sau BƯỚC 2 — xem §2).
- Kích thước LIMITS này lúc đóng: **31.667 B** (đo sau khi viết xong toàn bộ) — dưới trần 37.768 B, không oversize.
