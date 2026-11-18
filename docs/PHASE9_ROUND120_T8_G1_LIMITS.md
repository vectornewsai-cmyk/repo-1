# Đợt 120 T8 — G1 evidence vòng 11 (KHÔNG TỰ ĐÓNG G1)

Ngày: 16/11/2026 (lượt cron 12:35 +07; đo 05:46–06:29Z, phân tích 06:29–06:45Z).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM boot #60, boot-id 0260101b-acd3-43f4-91d2-670c1960fb7d,
btime 04:45:49Z, uptime ~1h lúc T8 bắt đầu, KHÔNG reboot trong cửa sổ đo;
RAM khả dụng 473–1983 MB trong cửa sổ; load 1-phút 0,18–4,45).
Nợ: LIMITS gộp đợt 119 §10 (G1 evidence #11) + docs/PHASE9_ROUND99_A7_G1_EVIDENCE10_LIMITS.md
+ docs/PHASE9_ROUND99_A9_G1_METRIC_LIMITS.md + docs/PHASE9_ROUND104_F1_G1_LIMITS.md
+ docs/PHASE9_ROUND105_G5_G1_DECISION.md (kiểm chứng độc lập số F1).
Trạng thái G1 trước vòng: pool 30fps n=109 PASS 100/109 (92%), biên 9 FAIL;
chân yên 30fps n=32 PASS 28/32 (88%), chuỗi PASS yên liên tiếp 26; pool 60fps
n=69 PASS 66/69 (96%); chân yên 60fps n=26, 26/26 PASS; metric M2 chạy song
song, G5 vẫn là chuẩn chính thức; khung (c) M2 26–27/32 = 81,2–84,4% (kịch bản
xấu vượt mốc 80%); khung (b) trượt-20 M2 19/20; chỉ khung (a) cố định 20 lần
đầu là KHÔNG ĐẠT ĐƯỢC (tối đa 15/20).
Trạng thái G1 VẪN MỞ, chờ user quyết — T8 chỉ đưa số + khuyến nghị, không tự
đóng, không đổi ngưỡng (0,75×), không đổi metric, không đổi khung. Không i18n
key mới. Không kiểm lại TTS 39. Không thử birefnet. Không sửa production.

**Thay đổi phương pháp duy nhất vòng này (§5, BẮT BUỘC ĐỌC TRƯỚC KHI TRÍCH SỐ):**
vite của harness E1/N10 chết ENOSPC 8/8 lần thử trước 06:05Z (trần inotify
63.747 đã đầy, headroom đo được chỉ 434–545 watch, vite thường cần ~1.578).
T8 đã mirror workaround L8 (`server.watch.ignored ["**/**"]`, vite 0 inotify FD)
vào đúng 2 file harness — y hệt tiền lệ O8 đợt 112/113 đã được parent chấp
nhận. Bằng chứng đường đo không đổi: pixel G2/G7a/G7b/G8/D1 khớp lịch sử
tuyệt đối cả 13/13 lần (xem §3.1/3.2 + §5). **8 lần E1 + 5 lần N10 vòng này
đều chạy bằng harness đã mirror L8** (ghi cờ trong JSON v15, trường `notes`).

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **Chân yên 30fps — DÀY LÊN ĐÁNG KỂ: 8 mẫu yên mới, cả 8 đều PASS dưới CẢ
  HAI metric (G5 0,92–0,98; M2 0,92–1,03) → chân yên nay n=40: median
  0,950×, mean 0,935, CI 95% [0,900; 0,971], PASS 36/40 (90%)** — từ 28/32
  (88%). Cả ba tiêu chí chặt: median ≥ 0,75 ✓, PASS 90% ≥ 80% ✓, CI cận
  dưới 0,900 ≥ 0,75 ✓. Chuỗi PASS yên liên tiếp hiện tại: **34** (26 cũ + 8
  mới) — dài nhất lịch sử G1. Đây là đợt thu hoạch yên lớn nhất từ trước tới
  nay (X6: 6, Z9: 4, A7: 3): cửa sổ yên mở suốt ~16 phút (06:05–06:21Z),
  baseline 19,94–24,40 fps cả 8 lần, không lần nào rơi vùng xám, không lần
  nào cần vòng 2.
- **Khung M2 (a)–(i) — CHỈ CÒN KHUNG (a) LÀ KHÔNG ĐẠT ĐƯỢC (xem §2.3):**
  khung (b) trượt-20 M2 nay **20/20 (100%)** — X6 run6 (lần FAIL yên duy
  nhất dưới M2 trong cửa sổ) đã trượt khỏi cửa sổ; khung (c) tích lũy đầy đủ
  nay **34–35/40 = 85,0–87,5%** (kịch bản xấu 85,0%, đệm +5,0 điểm, từ
  81,2%); khung (f) trượt-10 **10/10**; khung (g) hậu-A9 **22/22 (100%)**;
  khung (e) yên sạch **32/34 (94%)**; khung (i) vẫn chịu 4 FAIL yên liên
  tiếp. Khung (a) 20 lần yên đầu cố định vẫn tối đa 15/20 = 75% — bị khóa bởi
  lịch sử, không bao giờ đạt được. **Câu hỏi "M2 có đạt 16/20 không" nay chỉ
  còn phụ thuộc vào việc parent có chấp nhận khung (a) là luật chơi hay
  không** — mọi khung còn lại đều đã đạt (xem §2.3).
- **60fps: 5/5 lần T8 mới đều PASS dưới CẢ HAI metric — 1,02 / 1,00 / 1,00 /
  0,94 / 0,92 → pool 60fps nay n=74: median 0,960×, mean 0,984, CI 95%
  [0,950; 1,018], PASS 71/74 (96%)** — từ 66/69 (96%). **Chân yên 60fps:
  +5 mẫu yên mới, cả 5 đều PASS → n=31, 31/31 PASS (100%), median 0,960×,
  mean 0,953, CI 95% [0,936; 0,970]** — dày hơn F1 (n=26) mà vẫn giữ 100%,
  dưới CẢ HAI metric (M2: median 0,980, CI [0,949; 0,994], 31/31 PASS).
- **30fps: 8 lần T8 mới, 8/8 PASS → pool n=117: median 0,990×, mean 1,007,
  CI 95% [0,971; 1,042], PASS 108/117 (92%) — biên nay là 18 lần FAIL**
  (108/135 = 80,0% sau 18 FAIL nữa; FAIL thứ 19 → 108/136 = 79,4%). Cửa sổ
  trượt 5 lần: 100/113 PASS, **10 cửa sổ mới nhất đều PASS 5/5**.
- **Đồng thuận G5/M2: 153/159 (96,2%), 6 lần lật — TẤT CẢ ĐỀU LÀ LẦN CŨ,
  0 lần lật mới vòng này (T8: 13/13 đồng thuận).** Quy luật "G5 ≥ 1,00 không
  bao giờ lật" nay là **74 lần, 0 lật** (thêm 3 lần T8: N10 run1–3).
- **Render-side deinterlace (BẰNG CHỨNG MỚI, §4): yadif thật ở render làm
  việc — idet progFrac 0,000 → 0,993 (30fps) và 0,117 → 0,957 (60fps);
  chi phí fps render chỉ ~2% ở 720p30 (47,5 vs 48,4 fps) và ~15% ở 720p60
  (61,8 vs 72,4 fps), veryfast/CRF23/libx264.** Đây là lần đầu G1 có số đo
  render thật kèm theo số preview — hai mặt của cùng một tính năng.

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có (v15)

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5 lần ≥ 0,75.
Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy yên. CI 95% của mean
(t-Student). Số tính lại bằng `hidden_files/round120-t8/analyze-pool120t8.py`
(kế thừa `analyze-pool104f1.py`, cùng công thức; script kiểm lại tái tạo đúng
số F1 đã công bố — pool 30 n=109 PASS 100/109, pool 60 n=69 PASS 66/69 —
trước khi thêm lần T8; JSON gộp:
`benchmarks/results/g1-evidence-v15-120t8.json`). M2 tính lại bằng
`hidden_files/round120-t8/analyze-m2-quiet120t8.py` (kế thừa
`analyze-m2-quiet104f1.py` + thêm T8).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với F1

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| **T8 30fps 5 mới nhất = cửa sổ T8 riêng (đợt 120)** | **yên 5 / tải 0 (20,71; 23,47; 22,10; 24,40; 23,36)** | **0,95 / 0,95 / 0,98 / 0,96 / 0,96** | **0,960** | **5/5** | **PASS ỔN ĐỊNH** | **[0,945; 0,975]** |
| **T8 60fps 5 mới nhất = cửa sổ T8 riêng (đợt 120)** | **yên 5 / tải 0 (19,64; 20,99; 20,68; 20,44; 20,72)** | **1,02 / 1,00 / 1,00 / 0,94 / 0,92** | **1,000** | **5/5** | **PASS ỔN ĐỊNH** | **[0,922; 1,030]** |

### 2.2 Pool gộp theo chế độ tải (G5)

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5→F1+T8) | 117 | 0,990 | 1,007 | 0,193 | [0,971; 1,042] | 108/117 (92%) | PASS ỔN ĐỊNH (biên 18 FAIL) |
| 30fps — máy tải (<10 fps, trừ hỗn hợp) | 71 | 1,030 | 1,050 | 0,220 | [0,998; 1,102] | 66/71 (93%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps, trừ hỗn hợp) | 40 | **0,950** | **0,935** | 0,112 | **[0,900; 0,971]** | **36/40 (90%)** | **3/3 tiêu chí ✓ (dày hơn F1)** |
| **60fps fixture (M1→F1+T8)** | **74** | **0,960** | **0,984** | 0,145 | **[0,950; 1,018]** | **71/74 (96%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 43 | 1,000 | 1,006 | 0,183 | [0,950; 1,062] | 40/43 (93%) | PASS ỔN ĐỊNH |
| **60fps — máy yên (≥10 fps)** | **31** | **0,960** | **0,953** | 0,046 | **[0,936; 0,970]** | **31/31 (100%)** | **PASS ỔN ĐỊNH (dày hơn F1)** |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 191 | 0,980 | 0,998 | 0,175 | [0,973; 1,023] | 179/191 (94%) | trên ngưỡng |
| T8 riêng 30fps (8 lần) | 8 | 0,955 | 0,951 | 0,019 | [0,935; 0,967] | 8/8 (100%) | — |
| T8 riêng 60fps (5 lần) | 5 | 1,000 | 0,976 | 0,043 | [0,922; 1,030] | 5/5 (100%) | PASS ỔN ĐỊNH |

### 2.3 Chân yên 30fps dưới M2 — các khung (a)–(i) (tính lại đầy đủ)

| Khung | n | M2 PASS | Median M2 | Mean M2 | CI 95% | Đạt 16/20 (80%)? | Đổi so với F1 |
|---|---|---|---|---|---|---|---|
| **(a) 20 lần yên đầu, cố định** | 20 | tối đa 15/20 (75%) | — | — | — | **KHÔNG — trần cứng** | không đổi |
| **(b) 20 lần yên mới nhất, trượt** | 20 | **20/20 (100%)** | 0,960 | 0,957 | [0,934; 0,980] | **CÓ** | **từ 19/20 → 20/20** |
| **(c) Tích lũy đầy đủ** | 40 | **34–35/40 (85,0–87,5%)** | 0,945 | 0,935 | [0,901; 0,969] | **CÓ — kịch bản xấu 85,0%** | **từ 81,2–84,4% → 85,0–87,5%** |
| (d) Chỉ lần tính-lại-được | 36 | 34/36 (94%) | 0,945 | 0,935 | [0,901; 0,969] | CÓ | từ 26/28 (93%) |
| (e) Yên sạch (loại cờ slot-tải-đầu) | 34 | 32/34 (94%) | 0,950 | 0,940 | [0,905; 0,976] | CÓ | từ 24/26 (92%) |
| (f) Trượt 10 lần mới nhất | 10 | **10/10 (100%)** | 0,945 | 0,952 | [0,931; 0,973] | **CÓ** | từ 10/10 (giữ) |
| (g) Kỷ nguyên hậu-A9 | 22 | **22/22 (100%)** | 0,940 | 0,936 | [0,911; 0,960] | **CÓ** | từ 14/14 (giữ) |
| (h) Yên "mở rộng" (ngưỡng ≥ 9) | 40 | 34–35/40 (y hệt (c)) | — | — | — | như (c) | 0 lần biên 9–10 fps — **không kiểm được** |
| (i) Biên an toàn của (b) | — | chịu 4 FAIL yên liên tiếp (16/20); FAIL thứ 5 → 15/20 | — | — | — | — | như F1 (4 lần) |

**Đọc bảng đúng:** dưới M2, mọi khung TRỪ (a) đều đã đạt — và (a) là khung duy
nhất bị khóa bởi 5 lần FAIL trong 20 lần yên đầu tiên của lịch sử (I5-1/J3-1/
L3-1/L3-2 + U6-2/X6-6; trong đó 4 lần đầu mất fpsSlots nên M2 chỉ chặn khoảng
12–13/18 ở thời A9, nay khung (c) đã vượt xa). Không có khung nào khác còn
treo. Quyết định còn lại của parent/user không phải "M2 có đạt không" mà là
**"khung nào mới là luật chơi"** — đúng như G5 đợt 105 đã kết luận, nay với
số dày hơn (n=40 thay vì 32).

### 2.4 Tiêu chí nào đạt / chưa đạt (so với F1)

| Tiêu chí | F1 (n=109/69) | T8 (n=117/74) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 1,000 ✓ | 0,990 ✓ | −0,010 |
| Pool 30fps PASS ≥ 80% | 100/109 = 92% ✓ (biên 9 FAIL) | **108/117 = 92% ✓ (biên 18 FAIL)** | **biên dày gấp đôi** |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,973 ✓ | 0,971 ✓ | −0,002 |
| 30fps tải n≥20: median + PASS + CI | 1,030 / 93% / 0,998 ✓✓✓ | **1,030 / 93% / 0,998 ✓✓✓** | không đổi (không thêm lần tải) |
| 30fps yên: median + PASS + CI cận dưới | 0,940 / 88% / 0,888 (3/3) | **0,950 / 90% / 0,900 (3/3 ✓)** | **PASS +2 điểm; CI +0,012** |
| **60fps: median + PASS + CI** | **0,960 / 96% / 0,948 ✓✓✓** | **0,960 / 96% / 0,950 ✓✓✓** | **giữ nguyên cả ba** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 0,96, 5/5 → PASS | median 1,00, 5/5 → PASS | giữ PASS |
| **60fps yên** | **n=26, CI [0,930; 0,967], 26/26 PASS** | **n=31, CI [0,936; 0,970], 31/31 PASS** | **+5 mẫu, vẫn 100%** |
| Cửa sổ trượt 5 lần 30fps PASS | (F1 không công bố tổng) | 100/113 | **10 cửa sổ mới nhất đều PASS 5/5** |
| Pearson(ratio, baselineFps) 30fps | −0,291 (n=66, A7) / F1 không tính | **−0,317 (n=117)** | đậm hơn nhẹ (hàm chế độ máy vẫn đó) |
| Đồng thuận G5/M2 (tập con còn fpsSlots) | 140/146 (95,9%), 6 lần lật | **153/159 (96,2%), 6 lần lật, 0 mới** | **T8: 13/13 đồng thuận** |
| Quy luật G5 ≥ 1,00 không lật | 71 lần, 0 lật | **74 lần, 0 lật** | +3 lần (N10 run1–3) |

**Đọc bảng đúng:** pool 30fps 92% nay có biên 18 FAIL — dày gấp đôi F1, vì
8 lần T8 toàn PASS mà không thêm lần FAIL nào. Chân yên 30fps 90% (36/40)
nay có đệm 2 điểm trên ngưỡng 80% theo G5 và 5,0 điểm theo M2 kịch bản xấu.
Đừng trích "yên 8/8 PASS" mà không ghi cả 8 lần đều chạy bằng harness đã
mirror L8 (§5) — và đừng trích median yên 0,950 như số chắc tuyệt đối (n=40
vẫn là mẫu vừa, CI [0,900; 0,971]).

## 3. Cửa sổ T8 mới — chi tiết từng lần

### 3.1 E1 30fps ×8 — 06:05–06:21Z — 8/8 PASS (G5 + M2), yên 8/8

Lệnh (mỗi lần, tuần tự, bọc lock v2): `E1_SCRATCH=hidden_files/round120-t8/e1-runN
bash vcut-vite-lock-v2-copy.sh run-attempt round120-t8-e1 5580 600 30 normal --
node apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng dev/debug/display tự
pick; fixture 30fps, 11 slot × 3s xen kẽ; đo E1 TRƯỚC N10 để bắt cửa sổ yên —
công thức X6/Z9/A7/F1). **Cửa sổ yên mở suốt cả 8 lần** (baseline 19,94–24,40
fps) — lần đầu tiên trong lịch sử G1 cả 8 lần E1 của một đợt đều yên.
**Trước mirror L8, cùng lệnh này fail 5 lần (run1–5, 05:46–05:47Z) + 1 lần bị
giết giữa chừng (run6, driver đầu bị kill tay) — xem §5. Không lần nào trong
5+1 lần đó có verdict, không tính vào pool.**

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|---|
| 1 | 06:05:32–06:07:23 | 1,82 | 1198 MB | 19,94 fps | 1,05 / 0,81 / 0,87 / 0,98 / 1,07 | **0,96×** | 0,98 | **10/10 PASS (yên)** |
| 2 | 06:07:28–06:09:22 | 3,31 | 1983 MB | 22,64 fps | 0,94 / 0,89 / 0,86 / 0,93 / 0,98 | **0,92×** | 0,93 | **10/10 PASS (yên)** |
| 3 | 06:09:27–06:11:23 | 1,73 | 1684 MB | 21,52 fps | 0,82 / 0,90 / 0,95 / 0,97 / 1,00 | **0,93×** | 0,95 | **10/10 PASS (yên)** |
| 4 | 06:11:28–06:13:24 | 1,34 | 1838 MB | 20,71 fps | 0,94 / 0,95 / 1,03 / 0,91 / 0,93 | **0,95×** | 0,94 | **10/10 PASS (yên)** |
| 5 | 06:13:29–06:15:25 | 1,86 | 1662 MB | 23,47 fps | 0,82 / 0,95 / 1,07 / 0,93 / 0,98 | **0,95×** | 0,95 | **10/10 PASS (yên)** |
| 6 | 06:15:30–06:17:26 | 3,07 | 1734 MB | 22,10 fps | 1,06 / 1,04 / 1,03 / 0,86 / 0,93 | **0,98×** | 1,03 | **10/10 PASS (yên)** |
| 7 | 06:17:32–06:19:26 | 3,50 | 1740 MB | 24,40 fps | 0,89 / 1,10 / 0,97 / 0,92 / 0,92 | **0,96×** | 0,92 | **10/10 PASS (yên)** |
| 8 | 06:19:32–06:21:27 | 1,31 | 1654 MB | 23,36 fps | 0,96 / 1,05 / 0,89 / 0,93 / 0,97 | **0,96×** | 0,96 | **10/10 PASS (yên)** |

- **Run2 (0,92×) là lần yên sạch nhất đợt này:** tỉ lệ 0,86–0,98 (biên hẹp
  nhất cửa sổ T8), baseline 22,64 fps ổn định — đối lập run7, tỉ lệ trải
  0,89–1,10 trong một lần "yên" (M2 0,92 cứu được mean 0,96 — đúng kiểu M2
  sinh ra để xử lý).
- **Run6 có M2 cao nhất đợt (1,03×)** — median vượt mean (phân phối lệch
  trái, 1 slot thấp 0,86 kéo mean xuống); cả hai metric đều PASS.
- **Không lần nào rơi vùng xám 0,6–0,9** (G5 thấp nhất 0,92) — quy tắc
  verdict 98Z8 không bắn lần nào; cả 8 lần đều 1 vòng, verdict chắc.
- **Pixel cả 8 lần giống hệt lịch sử:** G2 MAD 0,5821; G7a 0,6903; G7b
  0,0119; G8 R 0,55 → 0,52, MAD 1,5522 (giống hệt
  N5/Q7/R6/S6/T6/U6/V5/W6/X6/Z9/A7/F1). **H9 0 lỗi trang cả 8 lần.**
  Không có dấu EPERM trong log 8 lần đo (grep 0 kết quả).
- **0 slot đóng băng trong cả 13 lần đo T8** (E1 ×8 + N10 ×5).
- **Không lần hỗn hợp, không lần abort nào vòng này** — khác Z9 (1 hỗn hợp)
  và A7 (1 abort harness). Chuỗi PASS yên liên tiếp (G5) nay là 34.

### 3.2 60fps deint-only ×5 (probe N10) — 06:21–06:29Z — 5/5 PASS (G5 + M2)

Lệnh (mỗi lần, tuần tự, bọc lock v2): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round120-t8/60fps-deint-runN
bash vcut-vite-lock-v2-copy.sh run-attempt round120-t8-n10 5580 600 30 normal --
node apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu) | RAM khả dụng (đầu) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | M2 | Kết quả |
|---|---|---|---|---|---|---|---|---|
| 1 | 06:21:32–06:22:50 | 1,06 | 1406 MB | 19,64 fps | 1,00 / 1,04 / 0,95 / 1,05 / 1,04 | **1,02×** | 1,04 | PASS, 4/4 (yên) |
| 2 | 06:22:55–06:24:21 | 2,73 | 1630 MB | 20,99 fps | 0,98 / 1,05 / 0,98 / 0,98 / 1,02 | **1,00×** | 0,98 | PASS, 4/4 (yên) |
| 3 | 06:24:26–06:25:52 | 2,93 | 1531 MB | 20,68 fps | 1,05 / 0,98 / 0,97 / 0,93 / 1,08 | **1,00×** | 0,98 | PASS, 4/4 (yên) |
| 4 | 06:25:57–06:27:22 | 2,80 | 1618 MB | 20,44 fps | 0,94 / 1,07 / 0,90 / 0,94 / 0,86 | **0,94×** | 0,94 | PASS, 4/4 (yên) |
| 5 | 06:27:27–06:28:53 | 3,01 | 1387 MB | 20,72 fps | 0,99 / 0,94 / 0,89 / 0,84 / 0,93 | **0,92×** | 0,93 | PASS, 4/4 (yên) |

- **D1 cả 5 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi), hook tap=true**
  — giống hệt nhau 5/5 lần và giống hệt
  M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9/A7/F1 — deint áp thật trên fixture 60fps,
  đường code không đổi (cả 5 lần đều chạy sau mirror L8 — xem §5).
- **C3 0 lỗi trang cả 5 lần.** Không có dấu EPERM trong log 5 lần đo
  (grep 0 kết quả).
- **Run1–3 là 3 lần N10 yên sạch nhất kể từ A7 run4:** tỉ lệ chụm trong
  0,93–1,08; run5 (0,92×) là lần thấp nhất cửa sổ nhưng vẫn trên ngưỡng với
  biên 0,17 và M2 0,93 đồng thuận — không có lần nào cần xác nhận thêm.
- **Cả 5 lần N10 đều yên (baseline 19,64–20,99 fps)** — lần đầu tiên một
  đợt N10 60fps toàn yên; chân yên 60fps nay n=31, 31/31 PASS dưới cả hai
  metric.

### 3.3 Ghi chú phân loại — không có lần đặc biệt nào

Không có lần hỗn hợp, không abort, không lần 2 vòng, không lần flagged
(`flagged=False` cả 8 lần E1; `leadingLoadSlot=false` cả 8 lần). Mọi lần T8
đều tính trọn vào pool tổng + đúng chân của nó (yên/tải theo baseline mean
≥10 fps, quy ước từ X6 tới nay). Không có quyết định phân loại nào cần
parent kiểm lại vòng này — khác Z9 run5 (hỗn hợp) và A7 run2 (abort) / run7
(caveat slot-tải-đầu).

## 4. Render-side deinterlace — yadif thật ở render (BẰNG CHỨNG MỚI)

Lần đầu tiên G1 có số đo render thật đi kèm số preview. Phương pháp kế thừa
đợt 60 Q8 (`test_round60_q8_enhance_fps.js`): render thật bằng
`server/render/src/render.js` với spec 1 clip video 5s, `sourceAudioMode:
mute`, veryfast/CRF23/libx264 ép tay (định trị, khỏi probe GPU), fps =
frames/wall (gồm cả thời gian khởi động node); idet = tỉ lệ frame Progressive
trên tổng số frame; frame diff @1.0s bằng PIL/numpy (mean abs diff). Script:
`hidden_files/round120-t8/render-t8.js`; kết quả JSON:
`hidden_files/round120-t8/render/render-t8-results.json`; output mp4 trong
`~/.scratch-r120t8-render-Ret7He/` (không stage, không push). Chạy 05:53:49–
05:54:37Z, load 0,96–1,72, preview.tsx md5 5be5a250 không đổi.

### 4.1 Clip mẫu — idet đầu vào

| Clip | fps | Frames | idet TFF / BFF / Prog / Und | progFrac |
|---|---|---|---|---|
| interlaced720.mp4 (30fps) | 30 | 150 | 150 / 0 / 0 / 0 | **0,000** (interlaced toàn phần) |
| interlaced720-60fps.mp4 (60fps) | 60 | 300 | 170 / 96 / 34 / 0 | **0,113** (chủ yếu interlaced) |
| clean720.mp4 (đối chứng progressive) | 30 | 150 | 70 / 42 / 38 / 0 | **0,253** |

**Caveat idet (ghi rõ):** clean720 là đối chứng progressive của E1 (G4) nhưng
idet chỉ đọc 0,253 progressive — idet là heuristic, hay nhầm cạnh sắc/nội
dung testsrc2 thành interlaced. Vì vậy **chỉ đọc idet theo cặp cùng fixture
(deint BẬT vs TẮT), không đọc tuyệt đối**; và đừng trích "clean720 chỉ 25%
progressive" như kết luận về clip.

### 4.2 Render fps — chi phí của yadif thật

| Cấu hình | Lần 1 (wall / fps) | Lần 2 (wall / fps) | Mean fps | Tỉ lệ deint/off |
|---|---|---|---|---|
| 30fps, deint TẮT | 3,23 s / 46,47 | 2,98 s / 50,34 | **48,41** | — |
| 30fps, deint BẬT (`yadif=mode=0:parity=-1:deint=0`) | 3,16 s / 47,50 | 3,16 s / 47,41 | **47,46** | **0,98×** |
| 60fps, deint TẮT | 4,18 s / 71,75 | 4,11 s / 73,06 | **72,41** | — |
| 60fps, deint BẬT | 4,80 s / 62,46 | 4,91 s / 61,11 | **61,79** | **0,85×** |
| clean720 (progressive), deint BẬT ×1 | 3,03 s / 49,49 | — | 49,49 | — (không có đối chứng TẮT vòng này) |

- **yadif tốn ~2% fps render ở 720p30 và ~15% ở 720p60** (veryfast/CRF23,
  CPU-only, 5s clip). Lặp lại 2 lần: wall chênh ≤0,25 s trong cùng cấu hình;
  output byte-identical giữa 2 lần lặp (size giống hệt nhau) — encode xác
  định, không phải nhiễu.
- **Deint output NHỎ HƠN nodeint:** 1.364.574 vs 1.658.516 B ở 30fps
  (−17,7%); 1.905.746 vs 1.998.288 B ở 60fps (−4,6%) — frame đã khử răng cưa
  nén tốt hơn (ít tần số cao giả do combing).

### 4.3 Chất lượng — idet đầu ra + frame diff

| Cấu hình | idet output progFrac (TFF/BFF/Prog/Und) | Frame diff @1.0s vs nguồn (mean / max / pct>8) |
|---|---|---|
| 30fps, deint TẮT | 0,000 (150/0/0/0) | 0,759 / 112 / 2,822% (chỉ lỗi encode) |
| 30fps, deint BẬT | **0,993 (1/0/149/0)** | **1,883 / 255 / 3,865%** |
| 60fps, deint TẮT | 0,117 (169/96/35/0) | 0,786 / 151 / 2,793% (chỉ lỗi encode) |
| 60fps, deint BẬT | **0,957 (1/12/287/0)** | **1,227 / 255 / 3,535%** |
| clean720, deint BẬT | **0,993 (1/0/149/0)** (đầu vào 0,253) | **1,137 / 255 / 3,223%** |

- **yadif làm việc thật ở render:** progFrac 0,000 → 0,993 (30fps) và 0,117
  → 0,957 (60fps; còn 12 frame BFF). Frame diff deint-BẬT cao hơn rõ so với
  baseline chỉ-encode (1,883 vs 0,759 ở 30fps; 1,227 vs 0,786 ở 60fps) —
  yadif đổi pixel thật, không phải pass-through.
- **yadif cũng đổi pixel trên clip progressive:** clean720 deint-BẬT có frame
  diff mean 1,137 (so với ~0,76–0,79 của baseline encode) — đúng thiết kế
  `deint=0` (khử tất cả frame, không chỉ frame gắn cờ interlaced); idet đầu
  ra vẫn 0,993 progressive nên không "hỏng" clip sạch theo idet, nhưng pixel
  thì có đổi. Đây là bằng chứng cho parent nếu cân nhắc mode `deint=1`
  (chỉ frame interlaced) sau này — T8 không đề xuất đổi, chỉ ghi số.

### 4.4 Đối chiếu preview vs render — đính chính một diễn đạt

- **EnhancePanel** (`apps/web/src/components/enhance/EnhancePanel.tsx`):
  toggle `enhance-deinterlace-toggle` đặt `clip.enhance.deinterlace = true`
  (mode 0/1 qua select `yadifMode`); panel ghi rõ "preview nay ÁP enhance ở
  mức xấp xỉ... bản render luôn áp enhance thật".
- **Preview** (`apps/web/src/lib/enhancePreview.ts`): deinterlace chỉ là
  **xấp xỉ bằng tap dọc** — `deinterlaceTap=true` khi toggle "xem trước
  enhance" bật VÀ `drawScaleY ≥ 0,9` (vẽ lệch dọc +0,5px qua intermediate
  thu hẹp dọc, không thêm lần vẽ; dưới ngưỡng này downscale đã giấu răng cưa
  nên không áp). Đây chính là thứ E1/N10 đo (tỉ lệ fps preview với tap).
- **Render** (`server/render/src/enhance.js:159–163` +
  `server/render/src/render.js:1609`): `yadif=mode=0:parity=-1:deint=0`,
  chạy TRƯỚC scale (vì scale trên frame interlaced sẽ "nướng" răng cưa vào
  ảnh); render.js chặn job nếu ffmpeg thiếu yadif.
- **Đính chính:** diễn đạt "preview chưa áp enhance" trong brief T8 là chưa
  chính xác — preview CÓ áp deinterlace ở mức xấp xỉ (tap), chỉ có yadif
  thật mới chỉ ở render. Số preview (G1: 0,92–1,02×) và số render (§4.2:
  0,98× @30fps, 0,85× @60fps) đo hai thứ khác nhau — đừng gộp thành một số
  "chi phí deinterlace" duy nhất, và đừng dùng tỉ lệ fps preview để suy ra
  chi phí render (hay ngược lại).

## 5. ENOSPC + mirror L8 — môi trường chặn đo, cách gỡ, bằng chứng đường đo không đổi

### 5.1 Diễn biến chặn đo

- **05:46:32–05:47:54Z (driver đầu, chưa mirror):** E1 run1–5 đều fail
  `HARNESS LỖI: vite dev + media probe không lên sau 3 lần thử`, vite exit 1,
  `code: 'ENOSPC'`, `syscall: 'watch'`, `errno: -28` (đường dẫn watch chết:
  `apps/web/scripts/measure-v19-fps-debug.mjs`,
  `measure-browser-dip-inline-round31-n6.mjs`...). Run6 bị giết giữa chừng
  khi T8 kill driver đầu tay (không verdict). Tổng 5 lần fail + 1 lần dở,
  0 verdict — **không tính vào pool, không tính là FAIL**.
- **Đo headroom trực tiếp (2 probe độc lập):** T7 đợt 120 đo 545 watch
  (`round120-t7/t7-headroom-b60-now.log`); T8 đo lại 06:01:50Z bằng probe
  inotify_add_watch: **434 watch** (dừng ở watch thứ 434, errno 28).
  Vite thường cần ~1.578 watch (khớp 1.583 file dưới `apps/web/` trừ
  node_modules/dist) — **thiếu ~1.100–1.150 watch**. Trong cell chỉ systemd
  giữ 14 watch — ~63,3k watch còn lại giữ NGOÀI cell (host-level, cùng UID),
  T8 không nhìn thấy và không giải phóng được.
- **Xu hướng trần (từ build-loop log):** headroom boot #43: 1511 → #44:
  1507 → #46: 1207 → #47: 1073 → #54: 670 → #60: 434–545. **Rơi đều qua
  các boot, reboot KHÔNG hồi** (lần 4 reboot không hồi, đợt 114). Vite
  thường đã không chạy được từ boot #52. Tăng trần cần can thiệp host —
  T8 không tự làm, ghi nợ cho parent/T7 (§10).
- **Retry có backoff (05:52–06:01Z):** driver thử lại run1 thêm 4 lần, cách
  nhau 180 s, vẫn ENOSPC cả 4 lần — chứng tỏ đây là trần bị kẹt, không phải
  sóng thoáng qua. T8 dừng retry lúc 06:04Z để áp mirror (thay vì đốt tiếp
  ngân sách tới 07:15Z).

### 5.2 Mirror L8 — đúng 2 dòng trong 2 file harness

Áp 06:05:15Z, y hệt cú pháp O8 đã được parent chấp nhận (đợt 112/113 P7,
`clicktest-87o8-mask-track-headed.mjs:648`):

```js
// trước (cả 2 file): export default { plugins: [react(), mediaPlugin()], server: { hmr: false } };
// sau:  export default { plugins: [react(), mediaPlugin()], server: { hmr: false, watch: { ignored: ["**/**"] } } };
```

- **File sửa:** `apps/web/scripts/clicktest-77e1-deint-fps.mjs`
  (ae6cd34a → 9707f27b) và `apps/web/scripts/probe-86n10-config-fps.mjs`
  (9ca985cd → cfaf95aa). `node --check` PASS cả hai. **Không sửa production**
  (`preview.tsx` 5be5a250, `media.ts` 2c384ed1 — md5 trước = sau, xem §7).
- **Vì sao không đổi đường đo:** HMR đã tắt từ trước (`hmr: false`) nên
  `watch.ignored` không mất tính năng nào; probe không dựa vào file-watching
  (mount app một lần, đo canvas draw fps); module phục vụ giống hệt nhau.
  Đây là workaround hạ tầng, không phải sửa phương pháp đo — cùng cách O8
  Chromium/WebKit và các probe M1/N1/P1 đã dùng từ đợt 110–113.
- **Phạm vi ảnh hưởng:** chỉ T8 dùng 2 script này trong đợt 120 (grep
  `round120-t*/` — T9 chỉ nhắc tên script trong ps snapshot của driver T8,
  không chạy nó). Không luồng nào khác bị ảnh hưởng. Driver retry sau mirror
  chạy tiếp từ run1 (chưa có verdict nào trước đó nên không có dữ liệu cũ bị
  ghi đè sai).
- **Cờ minh bạch:** mọi lần T8 (E1 run1–8, N10 run1–5) đều chạy bằng harness
  đã mirror — ghi trong JSON v15 (`notes`) và LIMITS này. Nếu parent muốn
  loại các lần này khỏi pool vì khác harness, pool trở về v14 (không đổi kết
  luận nào ngoài việc mất 8 mẫu yên mới — xem §6).

### 5.3 Bằng chứng đường đo không đổi — pixel khớp tuyệt đối 13/13 lần

| Kiểm chứng pixel | Lịch sử (N5→F1) | T8 (13/13 lần) |
|---|---|---|
| E1 G2 MAD (deint BẬT vs baseline) | 0,5821 | **0,5821 — 8/8 lần** |
| E1 G7a MAD (SR-only) | 0,6903 | **0,6903 — 8/8 lần** |
| E1 G7b MAD (mask-only) | 0,0119 | **0,0119 — 8/8 lần** |
| E1 G8 R / MAD (footage BBB thật) | 0,55 → 0,52 / 1,5522 | **0,55 → 0,52 / 1,5522 — 8/8 lần** |
| N10 D1 MAD deint-vs-baseline | 0,3835 (5,77% đổi) | **0,3835 — 5/5 lần** |
| H9/C3 0 lỗi trang | 0 lỗi | **0 lỗi — 13/13 lần** |
| EPERM trong log đo | 0 | **0 — 13/13 lần** |

Nếu mirror làm thay đổi module phục vụ hay đường preview, các MAD này đã
lệch — chúng khớp tới 4 chữ số thập phân cả 13 lần. Đây là kiểm chứng mạnh
nhất cho việc gộp số T8 vào pool v15.

## 6. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của T8: PHƯƠNG ÁN A (đóng một phần) nay ĐỦ ĐIỀU KIỆN MẠNH HƠN
MỌI ĐỢT TRƯỚC — cả 4 chân (tải 30fps, yên 30fps, tải 60fps, yên 60fps) đều
đạt đủ ba tiêu chí chặt dưới CẢ HAI metric G5 lẫn M2, và dưới M2 mọi khung
trừ (a) đều đạt. Quyết định cuối vẫn thuộc parent/user; T8 KHÔNG tự đóng.**

- **Phương án A — Đóng một phần: deint ĐẠT ở cả 4 chân (ĐỀ XUẤT XEM XÉT,
  có điều kiện — như A7/F1, cập nhật số):** 30fps-tải n=71: median 1,030×,
  mean 1,050, CI cận dưới 0,998, 66/71 PASS = 93%; **30fps-yên n=40:
  median 0,950×, mean 0,935, CI cận dưới 0,900, 36/40 PASS = 90% — đủ 3/3,
  đệm PASS 2 điểm (G5) / 5,0 điểm (M2 kịch bản xấu)**; 60fps-tải n=43:
  median 1,000×, mean 1,006, CI cận dưới 0,950, 40/43 PASS = 93%;
  **60fps-yên n=31: median 0,960×, mean 0,953, CI [0,936; 0,970], 31/31
  PASS = 100% — cả ba tiêu chí chặt vẫn đạt**; cửa sổ 5 lần mới nhất cả hai
  fixture đều PASS luật (b) (median 0,96 / 1,00).
  - Điều kiện đóng (bắt buộc ghi kèm): (i) verdict "PASS" chỉ đúng trên VM
    này (CPU-only, 4 vCPU, Chrome `--disable-gpu`, Xvfb) — không suy ra máy
    khác / máy có GPU / Safari thật; (ii) 8 mẫu yên 30fps + 5 mẫu yên 60fps
    mới đều chạy bằng harness đã mirror L8 (§5) — nếu parent loại các lần
    này thì chân yên về lại v14 (28/32 = 88% G5; M2 khung (c) 26–27/32 =
    81,2–84,4%), kết luận phương án A vẫn đứng nhưng mỏng hơn; (iii) không
    trích số pool gộp (0,990× / 92% ở 30fps; 0,960× / 96% ở 60fps) như
    verdict duy nhất — pool gộp trộn hai chế độ; (iv) **khung (a) cố định 20
    lần yên đầu KHÔNG BAO GIỜ đạt dưới M2 (tối đa 15/20)** — phương án A chỉ
    đóng được nếu parent chấp nhận khung (a) không phải là luật chơi (hoặc
    chấp nhận đóng theo G5, khung 16/20 G5 đã đạt từ A7); (v) dưới metric M2,
    T8 là 8/8 (30fps) + 5/5 (60fps) — M2 đồng thuận G5 13/13 lần vòng này
    (0 lần bất đồng mới); parent vẫn chưa chọn metric nào làm chuẩn — xem
    khuyến nghị A9 (§9 trong doc A9: giữ G5 đến khi khung 16/20 khép, rồi
    chuyển M2); (vi) số render §4 (yadif 0,98× @30fps, 0,85× @60fps) là chi
    phí render, KHÔNG phải chi phí preview — đừng gộp với tỉ lệ fps preview.
  - Vì sao T8 vẫn không đề xuất đóng toàn vẹn: (1) khung (a) là bất đồng
    duy nhất còn lại về luật chơi — không phải về số đo; (2) metric chưa
    được parent chọn (G5 hay M2) — mọi khung M2 trừ (a) đã đạt, nhưng chuẩn
    chính thức vẫn là G5; (3) nhiễu slot vẫn tồn tại ngay cả trên máy yên
    (run7: tỉ lệ 0,89–1,10 trong một lần; run1: 0,81–1,07) — verdict 1 lần
    vẫn cần M2 xác nhận khi G5 ∈ [0,75; 1,00); (4) tỉ lệ FPS vẫn là hàm của
    chế độ máy (Pearson −0,317) — không phải hằng số của code.
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5→F1. T8 làm phương án này
  THÊM BẰNG CHỨNG MẠNH: M2 nay có thêm 13 lần đo (E1 8/8 PASS cả hai metric;
  N10 5/5 PASS, đồng thuận G5 13/13); khung (b) M2 nay 20/20 (từ 19/20);
  khung (c) M2 kịch bản xấu nay 85,0% (từ 81,2%). Nếu parent chọn M2 NGAY
  thì phải quyết khung nào là luật chơi — T8 ghi rõ: trừ (a), mọi khung đều
  đạt; giữ (a) thì M2 không bao giờ đạt, bất kể đo thêm bao nhiêu.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5→F1. T8 chứng minh
  phương án này ĐÃ CHO QUÁ ĐỦ SỐ: 8 mẫu yên 30fps + 5 mẫu yên 60fps trong
  MỘT lượt (cửa sổ yên mở ~16 phút, dài nhất lịch sử) — chân yên 30fps nay
  n=40 (từ 32), 60fps n=31 (từ 26). Đo thêm nữa chỉ dày thêm số, không đổi
  kết luận nào trong §2 — trừ khi parent muốn n≥50 cho chân yên 30fps.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 92%/96% mà bỏ qua
  khung (a) và caveat L8; trích pool 30fps "92%" như số chắc mà không ghi
  biên 18 FAIL và 8 lần T8 chạy harness mirror; trích "yên 8/8 PASS" mà
  không ghi cả 8 lần đều yên trong cùng một cửa sổ yên dài (tương quan chế
  độ máy — không phải 8 mẫu độc lập hoàn toàn); trích 1,02× của N10 run1
  hay 0,98× của E1 run6 như tốc độ deint (cả hai đều là tỉ lệ fps preview
  với tap, không phải tốc độ yadif — xem §4.4); trích "render deint chỉ tốn
  2%" mà không ghi đó là 720p30 veryfast/CRF23 (ở 720p60 là 15%).

## 7. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa code production | **KHÔNG sửa gì** — `preview.tsx` 5be5a250 / `media.ts` 2c384ed1 (md5 trước = sau); chỉ sửa 2 file harness (§5.2) + thêm LIMITS + JSON số đo + file trong hidden_files |
| `node --check` 2 script harness sau mirror L8 | **PASS** cả hai |
| `node --test deint-fps-verdict-83k3.test.mjs` | **17/17** chạy lại xanh |
| `node --test vite-diagnosis-regex-92t6.test.mjs` | **9/9** chạy lại xanh |
| `node server/render/src/enhance.js --self-test` | **PASS** (mọi assertion) |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ thêm LIMITS + JSON + script đo render ngoài repo + mirror harness), cùng tiền lệ U6/V5/W6/X6/Z9/A7/F1 |
| Cửa sổ T8 E1 30fps ×8 headed | 8 verdict **8/8 PASS** (0,96 / 0,92 / 0,93 / 0,95 / 0,95 / 0,98 / 0,96 / 0,96; yên 8/8) |
| Cửa sổ T8 60fps ×5 headed (probe N10) | **5/5 hoàn thành, 5/5 PASS G5** (1,02 / 1,00 / 1,00 / 0,94 / 0,92), 4/4 cases mỗi lần; M2 5/5 |
| Gộp pool tính lại (`analyze-pool120t8.py`) | tái tạo đúng số F1 đã công bố khi chạy trên pool v14 (pool 30 n=109 PASS 100/109, pool 60 n=69 PASS 66/69) trước khi thêm lần T8; 13 lần T8 mới tính lại từ fpsSlots khớp G5/ratioMean đã ghi; frozenSlots khớp tính lại cả 8 lần E1 |
| M2 tính lại (`analyze-m2-quiet120t8.py`) | 13 lần T8: E1 8/8 PASS (0,98 / 0,93 / 0,95 / 0,94 / 0,95 / 1,03 / 0,92 / 0,96); N10 5/5 PASS (1,04 / 0,98 / 0,98 / 0,94 / 0,93) — đồng thuận G5 13/13; tái tạo đúng khung F1 trước khi thêm T8 (kiểm bằng JSON m2-quiet104f1) |
| Headed H9/C3 (mọi lần chạy T8) | **0 lỗi trang** (E1 10/10 ×8, 60fps 4/4 ×5) |
| Pixel D1 60fps (T8) | MAD 0,3835 giống hệt nhau 5/5 lần, giống hệt M1/N10/R6/S6/T6/U6/V5/W6/X6/Z9/A7/F1 — tap áp thật; giống hệt cả trước/sau mirror L8 (không có lần N10 nào chạy trước mirror) |
| Pixel G2/G7a/G7b/G8 E1 (cả 8 lần) | giống hệt N5/Q7/R6/S6/T6/U6/V5/W6/X6/Z9/A7/F1 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522) |
| Render-side yadif (`render-t8.js`) | 9/9 render thành công (exit 0), output byte-identical giữa 2 lần lặp cùng cấu hình; idet + frame diff đo được cả 9 output |
| `preview.tsx` / `media.ts` | T8 không chạm; không sibling nào sửa trong cửa sổ đo (md5 + mtime không đổi 23:56:49Z 15/11 → sau đo) |
| Harness E1/N10 | T8 sửa đúng 2 dòng template vite config (mirror L8, 06:05:15Z) — xem §5.2 |
| Không process mồ côi của T8 sau đo | không vite/chrome nào dùng scratch round120-t8 còn chạy; boot-id không đổi 0260101b, không reboot trong cửa sổ đo; lock v2 nhả sạch sau mỗi lần đo |

## 8. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — T8 không tự đóng.** Mọi khuyến nghị ở §6 cần
   parent/user chọn. Lần đầu tiên cả 4 chân đều đủ 3/3 tiêu chí chặt dưới
   cả hai metric — nhưng khung (a) M2 vẫn không đạt được.
2. **Pool 30fps 92% (108/117) — biên 18 FAIL.** Thêm 18 FAIL nữa là về
   108/135 = 80,0%; FAIL thứ 19 là rơi dưới 80% (108/136 = 79,4%). Đừng
   trích 92% như số chắc — và đừng trích mà không ghi đây là pool gộp trộn
   hai chế độ + 8 lần T8 chạy harness mirror L8 (§5).
3. **Chân yên 30fps đủ 3/3: n=40, median 0,950, PASS 36/40 (90%), CI cận
   dưới 0,900.** Chuỗi PASS yên liên tiếp là 34. Nhưng: cả 8 mẫu yên mới
   đến từ MỘT cửa sổ yên dài duy nhất (06:05–06:21Z) — chúng không độc lập
   hoàn toàn về chế độ máy; 2 lần FAIL yên liên tiếp nữa là về 36/42 = 86%
   (vẫn đủ), 5 lần FAIL yên liên tiếp mới phá khung trượt-20 (xem §2.3 (i)).
4. **Mirror L8 — phân loại do T8 quyết, parent kiểm lại:** 13 lần T8 tính
   trọn vào pool (pixel khớp tuyệt đối §5.3 là bằng chứng đường đo không
   đổi). Nếu parent loại các lần này thì pool về v14 (100/109, 66/69; chân
   yên 28/32 G5, M2 khung (c) 26–27/32) — kết luận phương án A vẫn đứng
   nhưng mỏng hơn; số chân yên/tải phải ghi theo cách tính đã chọn.
5. **M2 đồng thuận G5 153/159 lần (96,2%), 6 lần lật — TẤT CẢ đều là lần
   cũ (W6/X6/R6/U6/Z9).** Pool đầy đủ KHÔNG tính lại được dưới M2 cho các
   lần I5–Q7/M1-đầu mất fpsSlots (4 lần yên cũ: I5-1 G5 0,93 chưa biết M2;
   J3-1/L3-1/L3-2 G5 FAIL → M2 FAIL chắc chắn). Đừng trích "M2 pool" như số
   pool đầy đủ — số duy nhất được phép trích dưới M2 là số tập con R6→T8
   (§2.3) kèm nhãn tập con.
6. **Nhiễu slot vẫn tồn tại ngay cả trên máy yên:** T8 run7 tỉ lệ 0,89–1,10
   trong một lần, run1 0,81–1,07. Baseline mean ≥10 fps ("máy yên") không có
   nghĩa từng slot yên. Đừng trích một lần đo đơn lẻ (vd 1,02×) như tốc độ
   deint.
7. **Pool 60fps 96% (71/74)** — 3 lần FAIL trong pool đều là lần cũ (M1
   run4 0,62×, M1 run5 0,73×, A7 run1 0,71×); 5 lần T8 đều PASS G5 nhưng
   lần thấp nhất chỉ 0,92×. Chân yên 60fps n=31 vẫn là mẫu vừa (dù 31/31
   PASS, CI [0,936; 0,970]). Không dùng 31 điểm này để nói "deint ngang
   baseline trên mọi máy nhanh".
8. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.** Mọi số
   FPS deint (G1→T8) đều đo trên VM này (CPU-only, 4 vCPU, Chrome
   `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có GPU / Safari thật.
   Bằng chứng mạnh nhất vòng này: 8 lần yên liên tiếp trong một cửa sổ yên
   dài cho tỉ lệ chụm 0,92–0,98 — cùng một máy, khác cửa sổ, số đã khác
   (so Z9: 5 lần tải 60fps cho 0,84–1,31).
9. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác). Đừng trích chỉ
   một tiêu chí (CI đạt, tỉ lệ PASS không).
10. **Luật median-5 lật 13/113 cửa sổ trượt 30fps** (100/113 PASS). Đừng
    trích verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn ghi kèm
    chế độ đo (baseline mean fps) và cửa sổ. 10 cửa sổ mới nhất đều PASS 5/5.
11. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích "combo 0,76×"
    như tốc độ combo.
12. **e1-run1 của T6 và W6 vẫn giữ trong pool** theo quyết định parent đợt 92
    (đã chấp nhận, 0 EPERM trong mọi log) — T8 không loại, không tranh luận
    lại, và ghi rõ độ nhạy thay vì loại. Lưu ý: pool nay đứng được cả khi
    loại cả hai lần phồng + lần hỗn hợp Z9 (105/114 = 92%).
13. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 9–10 luồng song song.**
    Tải sibling là biến số lớn nhất (load 1-phút 0,18–4,45; RAM khả dụng
    0,47–1,98 GB trong cửa sổ T8). Cửa sổ yên đợt này mở ~16 phút (dài nhất
    lịch sử) — đừng kỳ vọng mọi lượt đều cho 8 mẫu yên.
14. **Không có sóng EPERM hay port-conflict thật nào trong cửa sổ T8
    (0 dấu EPERM trong 13 log đo + 5 log fail ENOSPC).** Sóng thật gần nhất
    vẫn ~11:55–12:11Z (R7); EPERM KHÔNG tuyên bố đã hết. **ENOSPC thì
    KHÁC: trần inotify đã đầy thật (headroom 434–545) và đang rơi đều qua
    các boot — vite thường KHÔNG chạy được cho tới khi trần được nâng hoặc
    mirror L8 được áp cho mọi harness còn dùng vite thường.**
15. **Số render §4 chỉ đúng với cấu hình đã ghi** (veryfast/CRF23/libx264,
    720p, clip 5s, CPU-only, load thấp lúc đo). Đổi preset/crf/độ phân giải
    thì số fps đổi theo. idet là heuristic — chỉ đọc theo cặp cùng fixture
    (§4.1). Yadif mode 1 (send_field, nhân đôi fps) CHƯA đo vòng này —
    đừng suy số mode 0 sang mode 1.
16. **G1 (deint) vẫn mở, chờ user quyết** (§6) — birefnet 0 lần thành công
    (chỉ thử lại khi RAM đổi); EPERM probe #18/#19 + khoảng mù #37 (T5 đợt
    120 đang làm probe #39); ci-security.yml vẫn 403 chờ user; TTS 39 CẤM
    kiểm lại; WebKit clip D, pre-pass keyframes, motion blur + mask,
    trackgeq, fallback, harness O8.

## 9. Cách chạy lại

```bash
# Do 30fps 1 lan E1 (doi E1_SCRATCH moi lan; DO E1 TRUOC, ngay dau luot de bat cua so yen;
# harness DA mirror L8 — vite 0 inotify FD, khong can headroom; neu chay ban harness cu
# (truoc 06:05Z 16/11) thi vite chet ENOSPC khi headroom < ~1578):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round120-t8/e1-run1 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Do 60fps 1 lan (probe N10, deint-only; doi N10_LABEL moi lan):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round120-t8/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gop so (doc report JSON da co + so da cong bo, khong can headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round120-t8/analyze-pool120t8.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round120-t8/analyze-m2-quiet120t8.py
# Render-side yadif (khong can Chromium/vite):
node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round120-t8/render-t8.js
# Test hoi quy luat median + M2 (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chan doan vite (offline, trich regex that tu source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
```

## 10. Nợ còn lại cho đợt sau

1. **G1 vẫn MỞ, chờ user quyết** (§6) — phương án A nay đủ điều kiện mạnh
   nhất từ trước (4 chân đủ 3/3 dưới cả hai metric; M2 chỉ còn khung (a)
   không đạt được); parent/user quyết: (i) khung nào là luật chơi — có chấp
   nhận loại khung (a) không; (ii) metric G5 hay M2 làm chuẩn (theo khuyến
   nghị A9: giữ G5 đến khi khung 16/20 khép, rồi chuyển M2 — khung 16/20
   G5 đã khép từ A7, M2 khung (b)/(c)/(f)/(g) đã đạt từ T8).
2. **Trần inotify (headroom 434–545, rơi đều qua các boot)** — vite thường
   không chạy được; T8 đã mirror L8 cho E1/N10. Đợt sau: mirror L8 cho mọi
   harness còn dùng vite thường (theo đề xuất N8 đợt 112), HOẶC parent quyết
   nâng trần `max_user_watches` ở host (cần can thiệp host, T8 không làm).
   Lưu ý: headroom đo bằng probe inotify_add_watch (T7: 545; T8: 434) —
   hai số khác nhau do thời điểm đo, không phải mâu thuẫn.
3. **Nếu chọn M2:** bổ sung định nghĩa M2 cho lần gộp 2 vòng (median 10 tỉ
   lệ) vào `g5FrozenSafeFromReport` + test hồi quy (hàm hiện chỉ nhận 5 tỉ
   lệ); quyết cách xử lý 4 lần yên cũ mất fpsSlots; định nghĩa lại khung
   16/20 trên lần có fpsSlots — hoặc chấp nhận khung (b)/(c)/(f)/(g) thay
   cho khung (a). Gắn cờ tự động "G5 PASS nhưng G5 ∈ [0,75; 1,00)" trong
   harness E1/N10 (vùng cần xác nhận bằng M2) — chưa cài, chỉ là khuyến nghị
   từ A9.
4. **Nhiễu slot trên máy yên** (§8 mục 6): tỉ lệ trong một lần yên dao động
   0,81–1,10 — cần hiểu nguồn nhiễu (load spike từng slot? rVFC? decode?)
   trước khi tin hoàn toàn vào verdict 1 lần. M2 (median) giảm nhẹ chứ
   không hết nhiễu.
5. **Yadif mode 1 (send_field) chưa đo** — render §4 chỉ đo mode 0 (mặc
   định). Nếu user bật mode 1 trong EnhancePanel (nhân đôi fps output) thì
   cần đo riêng fps + idet + frame diff.
6. **G1 (deint) vẫn mở, chờ user quyết** (§6) — birefnet 0 lần thành công
   (chỉ thử lại khi RAM đổi); EPERM probe #18/#19 + khoảng mù #37 (T5 đợt
   120 đang làm probe #39); ci-security.yml vẫn 403 chờ user; TTS 39 CẤM
   kiểm lại; WebKit clip D, pre-pass keyframes, motion blur + mask,
   trackgeq, fallback, harness O8.
