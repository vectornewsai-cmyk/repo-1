# Đợt 92 T6 — G1 evidence vòng 4 + sửa regex EADDRINUSE (KHÔNG TỰ ĐÓNG G1)

Ngày: 11–12/11/2026 (lượt cron 03:35 +07 12/11; làm việc 20:38–21:07Z 11/11).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot trước lượt — uptime 1h15 lúc T6 bắt đầu;
RAM khả dụng 476 MB lúc bắt đầu; load 1-phút 0,16 lúc bắt đầu, lên
tới ~14 trong lúc đo vì 8–10 luồng song song).
Nợ: LIMITS gộp đợt 91 §4 mục 6 (G1 quyết định thuộc user; nhánh EPERM
của E1 chưa kích hoạt bằng fail thật; thông báo vite "Port 5580 is
already in use" không khớp regex EADDRINUSE — parent đã quyết sửa).

**Trạng thái cuối: G1 VẪN CHƯA ĐÓNG — T6 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi metric. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **60fps: 3/3 lần T6 mới đều PASS — 1,04 / 0,96 / 1,07 → pool 60fps
  nay n=17: median 0,990×, mean 0,997, SD 0,183, CI 95% [0,908;
  1,086], PASS 15/17 (88%)** — cả ba tiêu chí chặt vẫn đạt, biên dày
  hơn S6 (12/14 = 86%; nay cần thêm 2 lần FAIL mới rơi dưới 80%).
- **Lần yên 60fps THỨ HAI: run1 baseline 12,60 fps, 1,04× PASS.**
  Chân yên 60fps nay n=2 (0,99 / 1,04), cả hai đều PASS, median
  1,015 — vẫn chưa đủ CI có nghĩa (CI [0,697; 1,333]), nhưng không
  còn là n=1.
- **Lần yên 30fps ĐẦU TIÊN PASS: e1-run2 baseline 10,03 fps, 1,04×
  PASS.** Chân yên 30fps nay n=5: median 0,680, PASS 2/5 (40%) —
  cải thiện từ 1/4 (25%) ở S6. Bốn lần yên 30fps trước đều ≤0,93×;
  lần yên PASS đầu tiên này làm yếu (không phá) kết luận "deint chậm
  hơn một cách có hệ thống trên máy yên 30fps".
- **30fps: 2/2 lần T6 mới đều PASS (1,03 / 1,04) → pool n=32: median
  0,945×, mean 0,946, CI 95% [0,869; 1,022], PASS 26/32 (81%)** —
  dày hơn S6 một chút (24/30 = 80%) nhưng **vẫn chỉ cần thêm 1 lần
  FAIL nữa là rơi dưới 80%** (26/33 = 79%). Chế độ tải 30fps n=27:
  median 0,950, PASS 24/27 (89%).
- **Cửa sổ 5 lần 60fps mới nhất [1,33, 0,99, 1,04, 0,96, 1,07]:
  median 1,040, 5/5 PASS → luật (b) PASS ỔN ĐỊNH** (lần thứ ba liên
  tiếp, sau R6 và S6).
- **Nhánh EPERM của E1 ĐÃ kích hoạt bằng fail thật (fault-injection
  LD_PRELOAD, §7.2)** — nợ S6 §7 mục 4a và LIMITS gộp đợt 91 §4 mục 6
  (phần này) **ĐÃ ĐÓNG**. Đồng thời tìm ra cơ chế chết thật của vite
  dưới EPERM (bundle config `*.timestamp-*.mjs`), giải thích được
  sóng EPERM thật Q7 (vite exit 1, log 0 byte).
- **Regex EADDRINUSE ĐÃ SỬA** (cả 3 harness) và chứng minh bằng log
  vite thật + test 9/9 — nợ S6 §6.11 **ĐÃ ĐÓNG**. Nhánh regex trong
  harness vẫn chưa kích hoạt qua đường chạy harness thật (xem §8).

## 2. Bảng quyết định — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy
yên. CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round92-t6/analyze-pool92t6.py` (kế thừa
`analyze-pool91s6.py`, cùng công thức; pool gốc = pool S6 đã công bố
n=30/n=14 + 5 lần T6 mới đọc từ report JSON).

### 2.1 Từng cửa sổ 5 lần (luật b) — chỉ cửa sổ đổi so với S6

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| S6 60fps 5 mới nhất (đợt 91) | tải 4 / yên 1 (0,98; 0,75; 2,26; 6,23; 19,01) | 0,81 / 1,26 / 1,19 / 1,33 / 0,99 | 1,190 | 5/5 | PASS ỔN ĐỊNH | [0,852; 1,380] |
| **T6 60fps 5 mới nhất (đợt 92)** | **tải 3 / yên 2 (6,23; 19,01; 12,60; 5,28; 5,89)** | **1,33 / 0,99 / 1,04 / 0,96 / 1,07** | **1,040** | **5/5** | **PASS ỔN ĐỊNH** | **[0,895; 1,261]** |
| **T6 60fps riêng (3 lần)** | **tải 2 / yên 1 (12,60; 5,28; 5,89)** | **1,04 / 0,96 / 1,07** | **1,040** | **3/3** | **CHƯA ĐỦ MẪU (cần 5)** | **[0,882; 1,165]** |

Các cửa sổ 30fps S6 không đổi (xem S6 §2.1). Cửa sổ trượt 30fps
nay 19/28 PASS (S6: 17/26).

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5+Q7+R6+S6+T6) | 32 | 0,945 | 0,946 | 0,217 | [0,869; 1,022] | 26/32 (81%) | PASS ỔN ĐỊNH |
| 30fps — máy tải (<10 fps) | 27 | 0,950 | 0,973 | 0,215 | [0,891; 1,056] | 24/27 (89%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 5 | 0,680 | 0,796 | 0,177 | [0,576; 1,016] | 2/5 (40%) | CHƯA ĐẠT |
| **60fps fixture (M1+N10+R6+S6+T6)** | **17** | **0,990** | **0,997** | **0,183** | **[0,908; 1,086]** | **15/17 (88%)** | **PASS ỔN ĐỊNH** |
| 60fps — máy tải (<10 fps) | 15 | 0,960 | 0,995 | 0,195 | [0,887; 1,102] | 13/15 (87%) | PASS ỔN ĐỊNH |
| 60fps — máy yên (≥10 fps) | 2 | 1,015 | 1,015 | 0,035 | [0,697; 1,333] | 2/2 (100%) | KHÔNG ĐỦ MẪU (n=2) |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 49 | 0,950 | 0,963 | 0,205 | [0,905; 1,022] | 41/49 (84%) | đúng ngưỡng |
| Combo | 6 | 0,815 | 0,763 | 0,356 | [0,389; 1,137] | 3/6 (50%) | không verdict (n nhỏ, SD lớn) |

### 2.3 Tiêu chí nào đạt / chưa đạt (so với S6)

| Tiêu chí | S6 (n=30/14) | T6 (n=32/17) | Đổi |
|---|---|---|---|
| Pool 30fps median ≥ 0,75 | 0,935 ✓ | 0,945 ✓ | +0,010 |
| Pool 30fps PASS ≥ 80% | 24/30 = 80% ✓ | 26/32 = 81% ✓ | dày hơn 1 điểm, nhưng vẫn 1 FAIL nữa là rơi dưới 80% |
| Pool 30fps CI cận dưới ≥ 0,75 | 0,857 ✓ | 0,869 ✓ | +0,012 |
| 30fps tải n≥20: median + PASS + CI | 0,950 / 88% / 0,885 ✓✓✓ | 0,950 / 89% / 0,891 ✓✓✓ | cả ba dày hơn một chút |
| 30fps yên: median + PASS | 0,680 / 25% ✗✗ | 0,680 / 40% ✗✗ | PASS 25% → 40% (lần yên PASS đầu tiên); median không đổi |
| **60fps: median + PASS + CI** | **0,970 / 86% / 0,875 ✓✓✓** | **0,990 / 88% / 0,908 ✓✓✓** | **cả ba dày hơn** |
| 60fps cửa sổ 5 mới nhất luật (b) | median 1,19, 5/5 → PASS | median 1,04, 5/5 → PASS | giữ PASS lần 3 liên tiếp |
| 60fps yên | n=1 (0,99×) | **n=2 (0,99 / 1,04×)** | **2/2 PASS, vẫn chưa đủ CI** |
| Cửa sổ trượt 5 lần 30fps PASS | 17/26 | 19/28 | +2 cửa sổ PASS |
| Pearson(ratio, baselineFps) 30fps | −0,413 (n=30) | −0,408 (n=32) | không đổi thực chất |

**Đọc bảng đúng:** cả hai pool đều dày hơn S6, nhưng chân yên 30fps
vẫn là điểm yếu nhất (n=5, median 0,680) và pool 30fps vẫn mỏng ở
vạch 80% (chỉ cần 1 FAIL nữa). Chân yên 60fps có điểm thứ hai
(1,04× PASS) nhưng n=2 — gợi ý mạnh hơn S6, vẫn chưa phải bằng chứng
đủ CI.

## 3. Cửa sổ T6 mới — chi tiết từng lần

### 3.1 E1 30fps run1 — 20:50:35–20:53:21Z — G5 PASS 1,03×

Lệnh: `E1_SCRATCH=hidden_files/round92-t6/e1-run1 node
apps/web/scripts/clicktest-77e1-deint-fps.mjs` (cổng :5580 / debug
:9680 / display :180, tự pick; fixture 30fps, 11 slot × 4,5s xen kẽ).
Kết quả: **10/10 PASS, exit 0, 2m46s.** Vite lên ngay lần 1.

| Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Config | B | D | B | D | B | D | B | D | B | D | B |
| Draw fps | 3,85 | 2,94 | 2,60 | 3,86 | 5,15 | 3,11 | 3,56 | 4,38 | 4,67 | 6,54 | 4,17 |

G5 mean **1,03×** (tỉ lệ 0,91 / 1,00 / 0,71 / 1,06 / 1,48), baseline
mean 4,00 fps, **không slot đóng băng**. G1 PASS (gap 0,14: R 0,74 −
0,60). G2/G3/G4/G7a/G7b/G8/H9 PASS; pixel giống hệt N5/Q7/R6/S6 (G2
MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52, MAD 1,5522).
Load 1-phút ~14 lúc bắt đầu (sibling đang cao), RAM khả dụng ~1,8 GB.

**Nguồn gốc lần này — đọc kỹ (§7.4):** run1 là lần chạy E1 "lỡ" trong
lúc thử fault-injection EPERM lần 1 (marker shim không chặn được gì —
vite log 0 lần EPERM, chrome log 0 lần EPERM). T6 dùng làm e1-run1
với lý do ghi ở §7.4; thư mục gốc `fault-inject-eperm/` giữ nguyên
làm bằng chứng, `e1-run1/` là bản copy.

### 3.2 E1 30fps run2 — 20:55:35–20:58:01Z — G5 PASS 1,04× (YÊN)

Cùng lệnh, scratch `e1-run2`, chạy SẠCH (không shim, không dummy).
Kết quả: **10/10 PASS, exit 0, 2m26s.** Vite lên ngay lần 1.

| Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Config | B | D | B | D | B | D | B | D | B | D | B |
| Draw fps | 5,15 | 8,26 | 5,67 | 4,05 | 1,88 | 8,75 | 11,77 | 9,43 | 10,92 | 8,96 | 24,80 |

G5 mean **1,04×** (tỉ lệ 1,53 / 1,07 / 1,28 / 0,83 / 0,50),
baseline mean **10,03 fps → MÁY YÊN (≥10)**, **không slot đóng băng**.
G1 PASS (gap 0,14). Pixel giống hệt run1 (G2 MAD 0,5821; G7a 0,6903;
G7b 0,0119). Load 1-phút 8,58 lúc bắt đầu → 1,93 lúc kết thúc slot
FPS (sibling hạ giữa phiên); RAM khả dụng ~1,5 GB.

**Vì sao 1,04× ở máy yên — đọc kỹ:** đây là lần yên 30fps ĐẦU TIÊN
PASS (4 lần yên trước: 0,93 / 0,68 / 0,65 / 0,68). Nhưng baseline
10,03 fps chỉ vừa qua ngưỡng yên, và slot 10 baseline 24,80 fps kéo
trung bình lên — nửa đầu phiên (slot 0–5) baseline chỉ 1,88–8,26 fps
là máy tải. Tỉ lệ 0,50 ở slot 9 là do slot 10 baseline 24,80 fps
kéo trung bình kề lên (cùng cơ chế sóng tải như các tỉ lệ phồng 2,45×
của S6, chiều ngược lại). Đừng trích "deint ngang baseline trên máy
yên 30fps" từ 1 lần này — chân yên 30fps vẫn n=5, median 0,680.

### 3.3 60fps deint-only ×3 (probe N10) — 20:58–21:03Z — 3/3 PASS

Lệnh (mỗi lần, tuần tự): `N10_LABEL=60fps-deint-runN
N10_FIXTURE=interlaced720-60fps.mp4
N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}'
N10_SCRATCH=hidden_files/round92-t6/60fps-deint-runN node
apps/web/scripts/probe-86n10-config-fps.mjs`.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối) | RAM khả dụng | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|---|
| 1 | 20:58–20:59 | 1,38 → ~1,4 | ~1,5 GB | **12,60 fps** | 1,08 / 1,17 / 0,98 / 0,85 / 1,11 | **1,04×** | PASS, 4/4 |
| 2 | 20:59–21:01 | 1,43 → ~1,4 | ~2,3 GB | 5,28 fps | 0,87 / 1,09 / 1,22 / 0,70 / 0,93 | **0,96×** | PASS, 4/4 |
| 3 | 21:01–21:03 | 13,35 → ~13 | ~1,5 GB | 5,89 fps | 0,69 / 1,33 / 1,16 / 1,07 / 1,08 | **1,07×** | PASS, 4/4 |

Tốc độ tuyệt đối (draw fps):

| Lần | Baseline draw (6 slot) | Deint draw (5 slot) | Slot đóng băng (<0,5 fps) |
|---|---|---|---|
| T6-1 | 17,49 / 22,97 / 9,11 / 8,13 / 9,98 / 7,95 (mean 12,60) | 21,85 / 18,73 / 8,48 / 7,74 / 9,95 (mean 13,35) | không |
| T6-2 | 6,89 / 3,77 / 6,49 / 4,71 / 5,13 / 4,69 (mean 5,28) | 4,62 / 5,61 / 6,84 / 3,44 / 4,56 (mean 5,01) | không |
| T6-3 | 6,98 / 6,53 / 4,24 / 6,52 / 6,41 / 4,65 (mean 5,89) | 4,63 / 7,15 / 6,23 / 6,92 / 5,98 (mean 6,18) | không |

- **D1 cả 3 lần: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 3/3 lần và giống hệt M1/N10/R6/S6
  — deint áp thật trên fixture 60fps, đường code không đổi.
- **Playhead 60fps (33 slot T6): run1 0,96–1,01×, run2 0,81–1,00×,
  run3 0,98–1,04×, không slot nào vượt 1,3×** — đối chứng sạch.
- **C3 0 lỗi trang cả 3 lần.** Không có dấu EPERM trong log 3 lần
  đo (grep `EPERM|Operation not permitted` trên run log + report:
  0 kết quả) — cũng 0 kết quả ở cả 2 lần E1.
- **Run1 là lần yên 60fps THỨ HAI (baseline 12,60 fps ≥ 10):**
  1,04× PASS. Nhưng 3 slot cuối (8/9/10) rơi từ ~17–23 fps xuống
  ~8–10 fps — tải sibling tăng lại cuối phiên (load 1-phút 13,35
  lúc bắt đầu run3 ngay sau đó). Nửa đầu phiên (slot 0–3) baseline
  ~17–23 fps là máy yên thật; nửa sau đã trượt về tải. Đừng trích
  12,60 fps như "máy yên suốt phiên" — chỉ đúng nửa đầu (cùng lưu ý
  như S6 run3).
- **Run3 có lệch làm tròn 0,01:** report ghi ratioMean 1,07 nhưng
  tính lại từ fpsSlots (tỉ lệ chưa làm tròn 0,685 / 1,328 / 1,158 /
  1,070 / 1,081, mean 1,0644) cho 1,06. Pool dùng giá trị report
  1,07 theo quy ước S6 (report là nguồn chính); lệch 0,01 không đổi
  bất kỳ verdict nào (pool 60fps dùng 1,06 vẫn median 0,990, PASS
  15/17).

### 3.4 Cửa sổ yên — 2 lần yên 60fps, 1 lần yên 30fps PASS đầu tiên

Trong suốt cửa sổ đo (~13 phút, 20:50–21:03Z), load 1-phút dao động
1,38–14,15. Lần yên 60fps: T6 run1 nửa đầu (baseline ~17–23 fps).
Lần yên 30fps: e1-run2 (baseline 10,03 fps, nửa sau phiên mới yên
thật). Đây là đợt đầu tiên có lần yên 30fps PASS — và là đợt thứ 2
liên tiếp có lần yên 60fps (sau S6 run3). Cả hai lần yên đều xuất
hiện nhờ tải sibling hạ đúng lúc, không nhờ thay đổi vận hành.

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của T6: KHÔNG đóng G1 toàn vẹn; phương án A nay mạnh
hơn ở cả hai fixture so với S6, nhưng chân yên 30fps vẫn là điểm yếu
chưa có lời giải, và pool 30fps vẫn mỏng ở vạch 80%. Quyết định cuối
thuộc parent/user.**

- **Phương án A — Đóng một phần: deint ĐẠT ở chế độ tải, cả 30fps
  lẫn 60fps (ĐỀ XUẤT XEM XÉT, có điều kiện — như S6, cập nhật số):**
  30fps-tải n=27: median 0,950×, mean 0,973, CI cận dưới 0,891,
  24/27 PASS = 89%; 60fps-tải n=15: median 0,960×, mean 0,995, CI
  cận dưới 0,887, 13/15 PASS = 87%; cửa sổ 5 lần 60fps mới nhất
  PASS luật (b) 5/5 lần thứ ba liên tiếp.
  - Điều kiện đóng (bắt buộc ghi kèm — như S6, cập nhật): (i) verdict
    "PASS" chỉ đúng ở chế độ tải / máy yếu; trên máy nhanh
    (baseline ≥10 fps) deint ở 30fps vẫn chậm hơn một cách có hệ
    thống nếu tính median (0,68×, n=5) dù đã có 1 lần PASS 1,04×, và
    ở 60fps mới chỉ có n=2 (0,99× / 1,04× — chưa đủ CI); (ii) không
    trích số pool gộp (0,990× / 88% ở 60fps; 0,945× / 81% ở 30fps)
    như verdict duy nhất — pool gộp trộn hai chế độ nên không có
    nghĩa; (iii) **ghi rõ pool 30fps nay 81% (26/32) — thêm 1 lần
    FAIL nữa là rơi dưới 80%** — phương án A ở 30fps vẫn mỏng như
    S6, không dày hơn về biên này; (iv) **2 điểm yên 60fps (0,99× /
    1,04×) đều PASS nhưng n=2 và CI [0,697; 1,333]** — không dùng
    2 điểm này để đóng chân yên 60fps; (v) chân yên 30fps vẫn MỞ
    (n=5, median 0,680).
  - Vì sao T6 vẫn không đề xuất đóng toàn vẹn dù cả hai pool dày hơn:
    (1) 30fps vẫn 1 FAIL nữa là rơi dưới 80%; (2) 2 lần E1 T6 đều
    PASS nhưng chênh lệch chế độ đo lớn (baseline 4,00 vs 10,03 fps)
    — metric tỉ lệ FPS vẫn là hàm của chế độ máy; (3) chân yên 60fps
    mới n=2, chân yên 30fps n=5, cả hai đều chưa đủ CI có nghĩa
    (CI cận dưới chân yên 30fps chỉ 0,576); (4) cửa sổ T6 60fps chỉ
    3 lần, không đủ 5 — pool vượt nhờ cộng dồn qua cửa sổ trượt,
    không nhờ một cửa sổ T6 hoàn chỉnh (cùng lưu ý như S6).
- **Phương án B — Giữ G1 MỞ, đổi metric:** như N5/Q7/R6/S6. T6 bổ sung
  bằng chứng ủng hộ B: e1-run2 có tỉ lệ 0,50× kề tỉ lệ 1,53× trong
  cùng một lần (slot 10 baseline 24,80 fps kéo trung bình kề lên) —
  metric tỉ lệ FPS nhạy với sóng tải từng slot, không chỉ từng lần.
  Gap-mean hiện chỉ 2/3 PASS và lệch chiều draw-fps nên vẫn chưa có
  metric thay thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** như N5/Q7/R6/S6. T6
  làm phương án này bớt vô vọng hơn S6 một chút: lần yên 60fps thứ
  hai và lần yên 30fps PASS đầu tiên đều xuất hiện mà không cần tắt
  sibling — tải sibling trong giờ vòng lặp có lúc hạ đủ để baseline
  lên ~10–25 fps. Nhưng đó vẫn là may mắn về thời điểm (cả hai lần
  yên đều chỉ yên nửa phiên); chờ đợi thụ động vẫn có thể kéo dài —
  cần quyết định vận hành (đo ngoài giờ vòng lặp hoặc tắt bớt
  sibling) nếu parent muốn n≥10 lần yên. Đó là quyết định của
  parent/user, không phải của T6.
- **Không khuyến nghị:** đóng G1 toàn vẹn theo pool gộp 88%/81% mà
  bỏ qua chân yên; đóng chân yên 60fps theo 2 điểm 0,99×/1,04×; đóng
  chân yên 30fps theo 1 lần 1,04× (nửa đầu phiên vẫn là máy tải);
  trích 1,07× của 60fps run3 như tốc độ deint (có lệch làm tròn
  0,01, xem §3.3); trích 1,53× tỉ lệ slot của e1-run2 như tốc độ
  deint (số của slot kề baseline thấp).

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Sửa regex EADDRINUSE (E1 + 78f1 + 79g1) | `node --check` OK cả 3 file; test mới `vite-diagnosis-regex-92t6.test.mjs` **9/9** (trích regex thật từ source, cả 2 dạng thông báo + EPERM + thứ tự chẩn đoán) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **12/12** chạy lại xanh |
| Fault-injection port-conflict (dummy giữ :5580) | E1 exit 2, chẩn đoán "cổng bị chiếm" đúng; vite thật in đúng "Port 5580 is already in use" (không có chữ EADDRINUSE nào — regex cũ cho false, regex mới cho true trên log vite thật) |
| Fault-injection EPERM (LD_PRELOAD shim) | **Nhánh EPERM ĐÃ kích hoạt bằng fail thật lần đầu tiên** — E1 exit 2, chẩn đoán EPERM đúng cả 3 lần thử (exit 1); xem §7 |
| Cửa sổ T6 E1 30fps ×2 headed | run1 **10/10** (G5 1,03×, tải) / run2 **10/10** (G5 1,04×, yên); G1 PASS cả 2 (gap 0,14) |
| Cửa sổ T6 60fps ×3 headed (probe N10) | **3/3 hoàn thành, 3/3 PASS** (1,04 / 0,96 / 1,07), 4/4 cases mỗi lần |
| Gộp pool tính lại (`analyze-pool92t6.py`) | khớp số S6 đã công bố (pool 30 n=30, pool 60 n=14); 60fps T6 tính lại từ fpsSlots khớp ratioMean đã ghi 2/3 lần (run3 lệch làm tròn 0,01 — xem §3.3); frozenSlots E1 khớp tính lại cả 2 lần |
| Headed H9/C3 (mọi lần chạy T6) | **0 lỗi trang** (E1 10/10 + 10/10, 60fps 4/4 ×3) |
| Pixel D1 60fps (T6) | MAD 0,3835 giống hệt nhau 3/3 lần, giống hệt M1/N10/R6/S6 — tap áp thật |
| Pixel G2/G7a/G7b/G8 E1 (cả 2 lần) | giống hệt N5/Q7/R6/S6 (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52) |
| Playhead 60fps T6 (33 slot) | run1 0,96–1,01×, run2 0,81–1,00×, run3 0,98–1,04×; không slot nào ≥1,3× |
| Harness md5 trước–sau cửa sổ đo | E1 `7a321d0b…` (MỚI — sửa regex T6), 78f1 `98e121f6…` (MỚI — sửa regex T6), 79g1 `2a330a82…` (MỚI — sửa regex T6), `probe-86n10-config-fps.mjs` 3d2443e0… (không đổi, khớp S6), `deint-fps-verdict-83k3.mjs` fcac097d… (không đổi, khớp S6), test 7a49f9ad… (không đổi, khớp S6) |
| `preview.tsx` / `playheadPacing.ts` | không chạm (không sửa production) |
| `tsc --noEmit` / `vite build` | **không chạy** — không chạm file TS nào, không đổi code sản phẩm (chỉ sửa harness + thêm test) |
| Không process mồ côi sau đo | không vite/chrome nào còn chạy; không listener :55xx/:96xx; Xvfb :199 còn chạy là của luồng sibling (bắt đầu 20:41, trước lượt T6); socket X `/tmp/.X11-unix/X180` còn lại sau lần E1 (hành vi cũ như S6) |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — T6 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn.
2. **Pool 30fps 81% (26/32) — vẫn mỏng.** Thêm 1 lần FAIL nữa là rơi
   dưới 80%; đừng trích 81% như số chắc. Lần E1 run2 1,04× là lần yên
   30fps PASS đầu tiên nhưng nửa đầu phiên vẫn là máy tải (xem §3.2).
3. **Pool 60fps 88% (15/17) dày hơn** nhưng 3 lần T6 vẫn đo dưới tải
   sibling (baseline 12,60 / 5,28 / 5,89 fps — run1 chỉ yên nửa đầu).
   Đừng trích 88% mà không kèm chế độ đo.
4. **Chân yên 60fps mới n=2 (0,99× / 1,04×).** Hai điểm đều PASS nhưng
   CI [0,697; 1,333] — không đủ để đóng chân yên hay để nói "deint
   ngang baseline trên máy nhanh".
5. **Chân yên 30fps n=5, median 0,680, PASS 2/5 (40%).** Lần PASS
   1,04× làm yếu kết luận "deint chậm hơn có hệ thống trên máy yên
   30fps" nhưng không phá được nó — 4/5 lần yên vẫn ≤0,93×.
6. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→T6) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật. Bằng chứng mạnh nhất đợt này: e1-run2 có tỉ lệ
   0,50× kề tỉ lệ 1,53× trong cùng một lần, chỉ vì sóng tải từng slot.
7. **Cửa sổ T6 60fps chỉ 3 lần** (nhiệm vụ chỉ yêu cầu 3 lần đo
   thêm, không phải cửa sổ 5 lần đầy đủ). Không có verdict luật
   (b) riêng cho cửa sổ T6 — chỉ có cửa sổ trượt 5 lần mới nhất
   (5/5 PASS) và pool gộp n=17.
8. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác).
   Đừng trích chỉ một tiêu chí (CI đạt, tỉ lệ PASS không).
9. **Luật median-5 lật 9/28 cửa sổ trượt 30fps.** Đừng trích
   verdict của một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn
   ghi kèm chế độ đo (baseline mean fps) và cửa sổ.
10. **Combo n=6, SD 0,356 — không verdict combo.** Đừng trích
    "combo 0,76×" như tốc độ combo.
11. **Chẩn đoán EPERM-vs-port: nhánh EPERM nay ĐÃ kích hoạt bằng fail
    thật (fault-injection, §7.2) — nhưng đó KHÔNG phải sóng EPERM
    thật trên VM.** Sóng thật gần nhất vẫn ~11:55–12:11Z (R7); EPERM
    KHÔNG tuyên bố đã hết. Nhánh regex trong harness vẫn chưa kích
    hoạt qua đường chạy harness thật (§8) — cần kịch bản vite in
    được log rồi mới chết mà không có server lạ trả lời cổng.
12. **e1-run1 của T6 có nguồn gốc đặc biệt (§7.4):** là lần chạy E1
    "lỡ" trong lúc thử fault-injection (shim LD_PRELOAD đã load
    nhưng marker không chặn được gì — 0 lần EPERM trong mọi log).
    Nếu parent/user không chấp nhận, loại run1 khỏi pool và chạy lại
    1 lần E1 sạch; khi đó pool 30fps về n=31 (25/31 = 81%, median
    0,940) — không đổi verdict nào.
13. **Số đo chỉ đúng trên VM này trong giờ vòng lặp 8–10 luồng song
    song.** Tải sibling là biến số lớn nhất (load 1-phút 1,38–14,15;
    RAM khả dụng 0,5–2,3 GB trong cửa sổ T6). Loadavg lúc bắt đầu
    KHÔNG dự báo được tải trong lúc đo (e1-run2: bắt đầu 8,58 →
    kết thúc slot FPS 1,93).

## 7. Kích hoạt chẩn đoán E1 bằng fail thật — CẢ HAI NHÁNH (mục 2)

### 7.1 Nhánh port-conflict — kích hoạt lại sau khi sửa regex

**Fault-injection (có kiểm soát, không chạm production):** dummy server
Node giữ cổng :5580, trả 200 mọi path (lại dùng
`dummy-foreign-server.mjs` của S6), rồi chạy E1 với
`E1_DEV_PORT=5580` ép cứng. Scratch:
`hidden_files/round92-t6/fault-inject-port/`.

**Kết quả: chẩn đoán "cổng bị chiếm" đúng, E1 exit 2 sau 3 lần thử
(~1s).** Như S6, vite tail TRỐNG cả 3 lần (harness phát hiện dummy
trả 200 ngay và loại lần thử trước khi vite kịp in log) nên nhánh
regex vẫn chưa được kiểm chứng QUA HARNESS ở kịch bản này — chẩn đoán
đúng nhờ nhánh foreign-server (mediaStatus=200), không nhờ regex.

**Nhưng regex mới ĐÃ được kiểm chứng trên log vite THẬT:** chạy vite
trực tiếp với cổng :5580 bị dummy giữ — vite exit 1 và in đúng:

> `error when starting dev server:`
> `Error: Port 5580 is already in use`

Log này KHÔNG chứa chữ `EADDRINUSE` nào. Kiểm tra bằng regex trích
từ source harness: **regex cũ → false, regex mới → true.** Đây là
bằng chứng trực tiếp cho S6 §6.11: trước khi sửa, nếu vite thoát chỉ
với thông báo này và không có server lạ trả lời cổng, chẩn đoán sẽ
rơi về "chưa rõ nguyên nhân".

### 7.2 Nhánh EPERM — KÍCH HOẠT BẰNG FAIL THẬT LẦN ĐẦU TIÊN

**Vấn đề:** S6 đã thử nhưng không tạo được sóng EPERM giả một cách an
toàn. T6 tạo được bằng **LD_PRELOAD shim** (`eperm-shim.c` → `.so`,
biên dịch bằng gcc): chặn mọi `open/openat/open64/openat64` ở chế độ
ghi có đường dẫn chứa marker trong `T6_EPERM_MARKER`, trả EPERM.
Chỉ ảnh hưởng tiến trình con kế thừa `LD_PRELOAD`; không chạm hệ
thống, không đổi file thật, không cần quyền root.

**Phát hiện 1 — dep optimizer EPERM KHÔNG giết được vite:** chặn ghi
dưới `/.vite/` (marker `/.vite/`): vite vẫn lên, trả HTTP 200, dep
optimizer fail rồi retry mỗi giây với `Error: EPERM: operation not
permitted, open '.../.vite/deps_temp_*/package.json'` — vite KHÔNG
thoát. Kết luận: EPERM ở cache dep chỉ làm vite chậm/lặp, không phải
đường chết của vite.

**Phát hiện 2 — đường chết thật của vite dưới EPERM là bundle config:**
chặn MỌI ghi dưới repo (marker `/home/hatch/workspace/repo-1`): vite
exit 1 ngay lúc khởi động với `failed to load config` —
`Error: EPERM: operation not permitted, open
'.../node_modules/.vite-temp/vite.config.js.timestamp-....mjs'`
(`loadConfigFromBundledFile`). Đọc source vite 6.4.5 xác nhận: vite
bundle config rồi ghi file tạm `*.timestamp-*.mjs` trước khi import;
ghi này fail → vite chết trước khi serve.

**Phát hiện 3 — vị trí file tạm phụ thuộc vị trí file config:**
config mặc định (`apps/web/vite.config.js`) → file tạm trong
`apps/web/node_modules/.vite-temp/`; config của harness
(`/tmp/round77-e1/vite.e1.headed.config.mjs`) → file tạm NGAY CẠNH
file config (`/tmp/round77-e1/vite.e1.headed.config.mjs.timestamp-*.mjs`,
vì `findNearestNodeModules(/tmp/round77-e1)` không tìm thấy
node_modules). Đây là lý do 2 lần thử đầu của T6 thất bại:
- Lần 1 (marker `/home/hatch/workspace/repo-1`): vite của harness
  VẪN LÊN (config bundle ghi ra /tmp, không bị chặn; dep optimizer
  fail nhưng không chết) — harness chạy tiếp thành headed thật; T6
  phải kill tay (SIGTERM), dọn vite/chrome/Xvfb mồ côi bằng
  `fuser -k` (Xvfb :180 còn sót, đã kill riêng). Lần chạy này vô tình
  thành một lần đo E1 hợp lệ — xem §7.4.
- Lần 2 (marker `vite.config.js.timestamp-`): vite VẪN LÊN — vì file
  tạm của harness có tên `vite.e1.headed.config.mjs.timestamp-...`,
  KHÔNG chứa chuỗi `vite.config.js.timestamp-`. Marker sai tên file.
- Lần 3 (marker `.timestamp-`, khớp mọi dạng): **vite chết cả 3 lần
  thử, E1 exit 2 sau ~5s, chẩn đoán đúng.**

**Kết quả lần 3 (scratch `fault-inject-eperm2/`):**

> `HARNESS LỖI: vite dev + media probe không lên sau 3 lần thử — chẩn
> đoán: EPERM (vite exit 1, log chứa 'Operation not permitted' — sóng
> EPERM, KHÔNG phải cổng bị chiếm). lần 1: cổng :5580, exit 1, media
> —, cổng-vẫn-trả-lời=false, đuôi log: ... | lần 2: ... | lần 3: ...`

- Cả 3 lần: vite exit 1, media probe không chạy (media —), cổng không
  còn trả lời. Vite log chứa đúng
  `Error: EPERM: operation not permitted, open
  '/tmp/round77-e1/vite.e1.headed.config.mjs.timestamp-....mjs'`.
- **Bọc try/finally ĐÃ kích hoạt:** harness exit 2 nhưng không còn
  vite/chrome/Xvfb nào, không listener :55xx/:96xx.
- Đây là **lần đầu tiên nhánh EPERM của E1 kích hoạt bằng fail thật**
  (không phải sóng EPERM thật trên VM, mà là fault-injection có kiểm
  soát tái hiện đúng cơ chế chết của vite — xem §7.3). Nợ S6 §7 mục 4a
  và LIMITS gộp đợt 91 §4 mục 6 (phần "nhánh EPERM chưa kích hoạt")
  **ĐÃ ĐÓNG**.

### 7.3 Cơ chế này giải thích sóng EPERM thật Q7 như thế nào

Sóng EPERM thật (Q7 §3.1) làm vite exit 1 với log 0 byte. Với cơ chế
tìm được ở §7.2: dưới sóng EPERM, vite chết ngay ở bước bundle config
(vì không ghi được file `*.timestamp-*.mjs`), TRƯỚC KHI kịp ghi log —
phù hợp với log 0 byte mà Q7 thấy. Ngược lại, nếu EPERM chỉ chặn dep
cache (`.vite`), vite vẫn sống và log vẫn có nội dung. Đây là bằng
chứng gián tiếp (không phải chứng minh tuyệt đối) rằng sóng Q7 chặn
ghi ở diện rộng, không phải chỉ một thư mục cache.

### 7.4 Lần chạy E1 "lỡ" ở lần thử 1 — xử lý trung thực

Lần thử fault-injection EPERM đầu tiên (marker repo, §7.2 lần 1) đã
chạy hết headed và cho **10/10 PASS, G5 1,03×** (tỉ lệ
0,91/1,00/0,71/1,06/1,48, baseline 4,00 fps, không slot đóng băng).
T6 dùng lần này làm **e1-run1** của cửa sổ T6, với lý do ghi rõ:
- Marker lần đó không chặn được gì của harness (vite log 0 lần EPERM,
  chrome log 0 lần EPERM, run log 0 lần EPERM); shim chỉ thêm chi phí
  `strstr` không đáng kể trên mỗi lần mở file — hành vi đo không đổi.
- Pixel các case giống hệt lịch sử (G2 MAD 0,5821; G7a 0,6903; G7b
  0,0119; G8 R 0,55 → 0,52, MAD 1,5522 — sẽ đối chiếu lại ở §3).
- Thư mục gốc `fault-inject-eperm/` được GIỮ NGUYÊN làm bằng chứng;
  `e1-run1/` là bản copy của nó, kèm run log copy.

Nếu parent/user không chấp nhận cách dùng này, e1-run1 phải loại khỏi
pool và chạy lại 1 lần E1 sạch (tốn ~3 phút).

## 8. Sửa regex EADDRINUSE (mục 2) — chi tiết

Ba file cùng logic chẩn đoán, cùng sửa một mẫu:

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs:501`
- `apps/web/scripts/probe-78f1-tick-time.mjs:483`
- `apps/web/scripts/probe-79g1-tick-time.mjs:495`

Cũ: `/EADDRINUSE|address already in use/i`
Mới: `/EADDRINUSE|address already in use|Port \d+ is already in use/i`

Kèm comment ghi rõ nguồn (S6 §6.11) và lý do. Không đổi thứ tự chẩn
đoán (EPERM trước, port sau), không đổi chuỗi chẩn đoán.

Test mới `apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs`
(**9/9**): trích literal regex thật từ source của cả 3 harness (không
hardcode regex trong test), assert 8 case `hasAddrInUse` (EADDRINUSE /
address already in use / "Port 5580 is already in use" / cổng khác /
vite đầy đủ / log sạch / log EPERM / log trống) + 5 case `hasEperm` +
thứ tự chẩn đoán (EPERM ưu tiên trước port khi cả hai cùng có mặt).
Nếu ai sửa regex trong harness mà làm hỏng một dạng, test này đỏ.

**Lưu ý trung thực:** nhánh regex trong harness VẪN chưa từng kích
hoạt qua đường chạy harness thật — ở cả S6 và T6, kịch bản dummy
server đều bị nhánh foreign-server (mediaStatus=200) bắt trước khi
vite kịp in log (vite tail trống cả 3 lần). Regex mới được chứng minh
bằng (a) test offline trên log vite thật (§7.1) và (b) vite trực tiếp
in đúng thông báo thân thiện. Để kích hoạt nhánh regex qua harness cần
một kịch bản mà vite in được log rồi mới chết VÀ không có server lạ
trả lời cổng — ví dụ vite bind fail vì cổng bị giữ bởi một tiến trình
không trả HTTP (nc giữ cổng thay vì dummy HTTP). Đó là nợ nhỏ để đợt
sau, không chặn việc sửa regex lần này.

## 9. Cách chạy lại

```bash
# Đo 60fps 1 lần (probe N10, deint-only; đổi N10_LABEL mỗi lần):
N10_LABEL=60fps-deint-run1 N10_FIXTURE=interlaced720-60fps.mp4 \
  N10_CONFIG_JSON='{"enhance":{"deinterlace":true}}' \
  N10_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t6/60fps-deint-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Đo 30fps 1 lần E1 (đổi E1_SCRATCH mỗi lần):
E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t6/e1-run2 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Gộp số (đọc report JSON đã có + số đã công bố, không cần headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t6/analyze-pool92t6.py
# Test hồi quy luật median + slot đóng băng (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
# Test regex chẩn đoán vite (offline, trích regex thật từ source):
node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
# Fault-injection EPERM kich hoat chan doan E1 (shim LD_PRELOAD; xem §7.2):
LD_PRELOAD=~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t6/eperm-shim.so \
  T6_EPERM_MARKER=".timestamp-" \
  E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t6/fault-inject-eperm2 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Fault-injection port-conflict (dummy giu :5580; xem §7.1):
node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t6/dummy-foreign-server.mjs &
E1_DEV_PORT=5580 E1_SCRATCH=~/workspace/goals/capcut-clone-video-editor/hidden_files/round92-t6/fault-inject-port \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
```
