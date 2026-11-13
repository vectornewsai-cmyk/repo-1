# Đợt 86 N5 — Deint G1: gói quyết định tổng hợp (bảng gộp + khuyến nghị)

Ngày: 11/11/2026 (lượt cron 09:35 +07; đo headed ~02:45 UTC).
Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only, Chromium qua Xvfb + CDP,
`--disable-gpu`; VM reboot trước lượt). Nợ: LIMITS gộp đợt 85 §4.1
(G1 đóng hay chưa — parent/user quyết; M1 pool 30fps không đổi, CI
cận dưới 0,640 dưới ngưỡng; fixture 60fps không cứu được; L3 pool 20:
15/20 = 75% < 80%).

**Trạng thái cuối: G1 CHƯA ĐÓNG — N5 chỉ đưa số + khuyến nghị, quyết
định cuối thuộc parent/user.** Không sửa production, không đổi ngưỡng,
không đổi harness. Không i18n key mới. Không kiểm lại TTS 39.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT

- **Cửa sổ N5 (đợt 86): chỉ 4/5 lần hoàn thành** (lần 5 gãy 2 lần
  liên tiếp dưới sóng tải sibling — xem §3). 4 lần xong đều ở chế
  độ TẢI (baseline 2,35–8,18 fps), đều PASS: **1,06 / 0,95 / 1,03 /
  1,29 → median 1,045×, mean 1,083, CI 95% [0,850; 1,315],
  4/4 PASS.** Luật (b) cần đủ 5 lần nên script verdict kết luận
  "chưa đủ mẫu" — nhưng 4/4 PASS với median 1,045 là cửa sổ tải
  mạnh nhất từng đo.
- **Kiểm tra giả thuyết "chế độ tải quyết định verdict": MỘT NỬA
  KHỚP, MỘT NỬA CHƯA CÓ SỐ.** Phía tải KHỚP và còn vượt dự đoán:
  dự đoán median 0,80–0,85×, ≥4/5 PASS → thực tế median 1,045×,
  4/4 PASS. Phía yên CHƯA ĐƯỢC KIỂM: 0/5 lần N5 ở chế độ yên
  (baseline ≥10 fps) — sibling đợt 86 giữ VM tải suốt cửa sổ đo.
  Câu hỏi "verdict ở chế độ yên" vẫn mở sau 3 đợt (L3, M1, N5).
- **Pool 30fps gộp nay n=24 (thêm 4 lần N5): median 0,845×, mean
  0,884, SD 0,173, CI 95% [0,813; 0,954], PASS 19/24 (79%)** —
  CI đạt, tỉ lệ PASS vẫn thiếu đúng 1 lần để đạt 80% của tiêu chí
  chặt. Độ thiếu này hoàn toàn do 4 lần yên cũ (1/4 PASS).
- **Tách theo chế độ tải (pool 24, tính lại): máy tải (n=20):
  median 0,895×, mean 0,913, CI [0,836; 0,991], PASS 18/20 (90%)
  → luật (b) PASS ỔN ĐỊNH với biên rõ. Máy yên (n=4, không đổi):
  median 0,680×, PASS 1/4 (25%) → CHƯA ĐẠT.**
  Pearson(ratio, baselineFps) = −0,438 (n=24; n=20 là −0,478).
- **Luật median-5 vẫn lật theo cửa sổ trượt:** 20 cửa sổ trượt 5
  lần trên pool 24: **11 PASS ỔN ĐỊNH / 9 CHƯA ĐẠT** (pool 20 là
  7/16). Các cửa sổ mới 17–21 → 20–24 đều PASS nhờ 4 lần N5 cao.
- **Độ nhạy ở ngưỡng:** nếu tính cả lần 5 dở dang của N5 (G5 đã
  xong: 0,98×, baseline 2,32 fps — chỉ có console log, KHÔNG có
  report JSON) thì pool thành n=25, median 0,850, PASS 20/25 =
  80% đúng ngưỡng. N5 KHÔNG tính số này vào pool (thiếu report
  JSON) — nhưng parent cần biết pool đang đứng đúng trên lằn ranh.
- **60fps fixture (M1, n=5, KHÔNG gộp vào pool 30fps): median
  0,880×, mean 0,834, CI [0,640; 1,028], PASS 3/5 → CHƯA ĐẠT.**
  Cả 5 lần đều ở chế độ tải (baseline 2,1–3,7 fps).
- **Combo (n=3): median 0,690×, mean 0,647, SD 0,337,
  CI [−0,191; 1,484], PASS 1/3 — không đủ n / SD quá lớn, không
  verdict combo.**
- **Gap-mean (metric phụ, tick-time): 2/3 PASS** (G1 0,71 FAIL;
  I5 0,98 PASS; L3 0,78 PASS), median 0,78 — vẫn lệch chiều với
  draw-fps trong từng lần đo (L3: gap PASS 0,78 nhưng draw FAIL
  0,72 cùng lần).

## 2. Bảng quyết định duy nhất — gộp TOÀN BỘ pool đã có

Ngưỡng 0,75× giữ nguyên. Luật (b) = median 5 lần ≥ 0,75 VÀ ≥4/5
lần ≥ 0,75. Chế độ tải: baseline mean fps <10 = máy tải, ≥10 = máy yên.
CI 95% của mean (t-Student). Số tính lại bằng
`hidden_files/round86-n5/analyze-pool86n5.py` từ số đã công bố
trong LIMITS I5/J3/K3/L3/M1 (không đo lại các lần cũ).

### 2.1 Từng cửa sổ 5 lần (luật b)

| Cửa sổ | Chế độ từng lần (baseline fps) | 5 mean-từng-lần | Median | PASS | Luật (b) | CI 95% mean |
|---|---|---|---|---|---|---|
| I5 (đợt 81) | yên 1 / tải 4 (16,35; 3,16; 2,62; 1,77; 1,64) | 0,93 / 0,75 / 0,80 / 0,81 / 0,94 | 0,810 | 5/5 | PASS ỔN ĐỊNH | [0,741; 0,951] |
| J3 (đợt 82) | yên 1 / tải 4 (27,35; 2,47; 0,88; 2,11; 1,56) | 0,68 / 0,73 / 1,13 / 0,75 / 1,13 | 0,750 | 3/5 | CHƯA ĐẠT | [0,603; 1,165] * |
| K3 (đợt 83) | tải 5 (5,53; 4,10; 4,12; 2,60; 3,24) | 0,95 / 1,04 / 0,69 / 0,85 / 0,84 | 0,850 | 4/5 | PASS ỔN ĐỊNH | [0,711; 1,037] |
| L3 (đợt 84) | yên 2 / tải 3 (38,52; 38,97; 6,26; 1,81; 2,70) | 0,65 / 0,68 / 0,75 / 0,75 / 1,03 | 0,750 | 3/5 | CHƯA ĐẠT | [0,585; 0,959] |
| M1 60fps (đợt 85) | tải 5 (3,01; 2,13; 3,67; 2,91; 3,31) | 1,00 / 0,88 / 0,94 / 0,62 / 0,73 | 0,880 | 3/5 | CHƯA ĐẠT | [0,640; 1,028] |
| N5 (đợt 86) | tải 4 / yên 0 (5,72; 2,35; 8,18; 3,80) + lần 5 gãy | 1,06 / 0,95 / 1,03 / 1,29 (4 lần) | 1,045 | 4/4 | CHƯA ĐỦ MẪU (cần 5) | [0,850; 1,315] |

\* CI cửa sổ J3 tính lại từ mean làm tròn 2 chữ số ra [0,603; 1,165],
khác J3 công bố [0,624; 1,116] khoảng ±0,02–0,05 (do làm tròn đầu
vào). Mọi số pool gộp khớp số đã công bố tới 0,001 — lệch này chỉ
ảnh hưởng CI cửa sổ J3, không đổi bất kỳ verdict nào.

### 2.2 Pool gộp theo chế độ tải

| Pool | n | Median | Mean | SD | CI 95% mean | PASS | Luật (b) gộp |
|---|---|---|---|---|---|---|---|
| 30fps toàn bộ (I5+J3+K3+L3+N5) | 24 | 0,845 | 0,884 | 0,173 | [0,813; 0,954] | 19/24 (79%) | CHƯA ĐẠT (tỉ lệ <80%, thiếu 1 lần) |
| 30fps — máy tải (<10 fps) | 20 | 0,895 | 0,913 | 0,167 | [0,836; 0,991] | 18/20 (90%) | PASS ỔN ĐỊNH |
| 30fps — máy yên (≥10 fps) | 4 | 0,680 | 0,735 | 0,131 | [0,527; 0,943] | 1/4 (25%) | CHƯA ĐẠT |
| 60fps fixture (M1) | 5 | 0,880 | 0,834 | 0,156 | [0,640; 1,028] | 3/5 (60%) | CHƯA ĐẠT |
| Deint-only 30+60 (tham khảo — fixture khác nhau) | 29 | 0,850 | 0,875 | 0,168 | [0,811; 0,939] | 22/29 (76%) | CHƯA ĐẠT |
| Combo | 3 | 0,690 | 0,647 | 0,337 | [−0,191; 1,484] | 1/3 (33%) | không verdict (n nhỏ, SD lớn) |
| Gap-mean (tick-time) | 3 | 0,780 | 0,823 | 0,140 | — | 2/3 (67%) | metric phụ, lệch chiều draw-fps |

### 2.3 Độ ổn định của luật median-5 qua cửa sổ trượt

16 cửa sổ trượt 5 lần liên tiếp trên pool 30fps (thứ tự thời gian),
mỗi cửa sổ áp luật (b):

| Cửa sổ (lần) | Median | PASS | Luật (b) |
|---|---|---|---|
| 1–5 (I5) | 0,81 | 5/5 | PASS ỔN ĐỊNH |
| 2–6 | 0,80 | 4/5 | PASS ỔN ĐỊNH |
| 3–7 | 0,80 | 3/5 | CHƯA ĐẠT |
| 4–8 | 0,81 | 3/5 | CHƯA ĐẠT |
| 5–9 | 0,75 | 3/5 | CHƯA ĐẠT |
| 6–10 (J3) | 0,75 | 3/5 | CHƯA ĐẠT |
| 7–11 | 0,95 | 4/5 | PASS ỔN ĐỊNH |
| 8–12 | 1,04 | 5/5 | PASS ỔN ĐỊNH |
| 9–13 | 0,95 | 4/5 | PASS ỔN ĐỊNH |
| 10–14 | 0,95 | 4/5 | PASS ỔN ĐỊNH |
| 11–15 (K3) | 0,85 | 4/5 | PASS ỔN ĐỊNH |
| 12–16 | 0,84 | 3/5 | CHƯA ĐẠT |
| 13–17 | 0,69 | 2/5 | CHƯA ĐẠT |
| 14–18 | 0,75 | 3/5 | CHƯA ĐẠT |
| 15–19 | 0,75 | 3/5 | CHƯA ĐẠT |
| 16–20 (L3) | 0,75 | 3/5 | CHƯA ĐẠT |
| 17–21 (L3–N5) | 0,75 | 4/5 | PASS ỔN ĐỊNH |
| 18–22 | 0,95 | 5/5 | PASS ỔN ĐỊNH |
| 19–23 | 1,03 | 5/5 | PASS ỔN ĐỊNH |
| 20–24 (N5) | 1,03 | 5/5 | PASS ỔN ĐỊNH |

**11/20 cửa sổ PASS, 9/20 CHƯA ĐẠT** (pool 20 là 7/16). Luật
median-5 lật verdict tùy điểm bắt đầu — vì các lần đo không phải
mẫu độc lập cùng phân phối: chúng cụm theo chế độ tải của từng đợt
(đợt yên cho median ~0,68, đợt tải cho median ~0,82–1,05). Median 5
lần hấp thụ được 1 lần lệch (như K3 lần 3 FAIL 0,69) nhưng KHÔNG
hấp thụ được cả một đợt cùng chế độ.

### 2.4 Cơ chế đã biết (không đo lại ở N5)

- Ở chế độ yên, tick rAF bị lượng tử hoá theo khung 60Hz: baseline
  gapP50 đúng 16,7ms (1 khung), deint gapP50 đúng 33,4ms (2 khung)
  ở mọi slot (L3 §3.2). Deint tốn đúng 1 khung rAF thêm → tỉ lệ
  có trần cấu trúc ~0,65–0,70 ở chế độ yên. Không phải nhiễu đếm.
- Ở chế độ tải, baseline cũng sụp (1–6 fps) nên tỉ lệ đo được cao
  hơn (~0,82) — phần lớn do baseline chậm lại, không phải deint
  nhanh lên.
- Loadavg KHÔNG dự báo verdict (K3/L3: lần tải 19–28 PASS, lần
  tải 1–3 FAIL). Chỉ baseline mean fps (chế độ đo) mới tách được.
- Playhead teleport combo (M1 §3.2) là lỗi sản phẩm thật riêng
  (clamp dt 2s), không phải của deint-only; không sửa ở luồng này.

## 3. Cửa sổ N5 mới — kiểm tra giả thuyết "chế độ tải quyết định verdict"

Dự đoán ghi TRƯỚC khi đo (log luồng hidden_files/round86-n5.md §0):
- ≥4/5 lần yên (baseline ≥10 fps) → median 0,65–0,70×, ≤2/5 PASS.
- ≥4/5 lần tải (baseline <10 fps) → median 0,80–0,85×, ≥4/5 PASS.

Lệnh: `node apps/web/scripts/deint-fps-verdict-83k3.mjs measure
hidden_files/round86-n5` (cổng 5590–5594 / debug 9690–9694 /
display :190–:194, fixture 30fps, 11 slot × 3s xen kẽ, như K3/L3).
Tổng thời gian đo: ~15 phút cho 4 lần xong + 2 lần gãy lần 5
(~8 phút), 02:41–03:06 UTC.

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|
| 1 | 02:41–02:44 | 1,59 → 0,68 | 5,72 fps | 0,91 / 1,40 / 0,84 / 0,70 / 1,44 | **1,06×** | PASS, 10/10 |
| 2 | 02:44–02:47 | 0,68 → 17,35 | 2,35 fps | 1,22 / 1,02 / 1,01 / 0,72 / 0,78 | **0,95×** | PASS, 10/10 |
| 3 | 02:47–02:50 | 17,35 → 9,25 | 8,18 fps | 0,79 / 1,16 / 1,00 / 0,92 / 1,28 | **1,03×** | PASS, 10/10 |
| 4 | 02:50–02:53 | 9,25 → 2,59 | 3,80 fps | 1,50 / 1,18 / 1,59 / 1,21 / 0,97 | **1,29×** | PASS, 10/10 |
| 5 (lần 1) | 02:53–02:56 | 2,59 → 52,95 | 2,32 fps | 0,88 / 1,07 / 1,31 / 0,50 / 1,16 | **0,98× (dở dang)** | G5 PASS nhưng G8 timeout → KHÔNG có report JSON |
| 5 (retry) | 03:02–03:06 | 1,26 → 14,27 | — | — | **gãy sớm** | timeout chờ project mẫu load (3 clip) + hook `__vcutPreviewEnhance` |

**Verdict script (4 lần có report): luật (a) 4/4 PASS; luật (b)
median 1,045×, 4/4 ≥ ngưỡng, CI [0,850; 1,315] → "CHƯA ĐẠT PASS
ỔN ĐỊNH (chỉ 4/5 lần — chưa đủ mẫu)".**

Đối chiếu dự đoán: cả 4 lần xong đều ở chế độ TẢI (baseline <10
fps) → nhánh dự đoán thứ hai áp dụng: median 0,80–0,85×, ≥4/5
PASS. **Hướng dự đoán ĐÚNG (PASS), mức thì VƯỢT TRÊN (median 1,045
so với khoảng dự đoán 0,80–0,85).** Lần 4 (1,29×) là mean-từng-lần
cao nhất trong toàn bộ lịch sử 24 lần (kỷ lục cũ: 1,13×, J3 lần
3/5) — 4/5 tỉ lệ slot >1,0 (deint vẽ nhanh hơn baseline). Đây là
cùng cơ chế sóng tải đã thấy ở chiều ngược (L3 lần 4 slot 0,20;
J3 lần 3 slot 1,85): khi baseline sụp theo sóng sibling mà slot
deint kề không sụp, tỉ lệ phồng lên >1. N5 cho thấy cơ chế này
cũng phồng được cả một LẦN (không chỉ một slot) khi sóng tải rơi
đúng vào các slot baseline. Đừng trích "deint nay nhanh hơn
baseline 29%" — 1,29× là số của sóng tải, không phải tốc độ code.

Pixel N5 (4 lần xong, giống hệt nhau cả 4 lần): G2 R 0,74 → 0,51,
hook tap=true, MAD 0,5821; G7a MAD 0,6903; G7b MAD 0,0119; G8 R
0,55 → 0,52; H9 0 lỗi trang. **Lưu ý lệch nhỏ so với K3/L3:**
MAD G2 0,5821 (K3/L3: 0,6114), G7a 0,6903 (K3/L3: 0,6985) — R và
mọi verdict case giống hệt, chỉ MAD lệch ~0,01–0,03. Nguyên nhân
chưa xác định: `preview.tsx` mtime 01:11 UTC, TRƯỚC lượt N5
(không phải N5 sửa; tác giả chưa xác định — không ghi trong log
đợt 86 nào). G2/G7a vẫn PASS với biên (MAD 0,58 > ngưỡng 0,5).
Không ảnh hưởng verdict FPS.

**Lần 5 gãy 2 lần — chi tiết:**
- Lần 1: G1–G7 xong hết (G5 0,98× PASS, baseline 2,32 fps), rồi
  G8 timeout "chờ vòng preview ngủ (preview BBB interlaced +
  deint tại playhead 1.0)" lúc tải 1-phút vọt lên 52,95 — cùng họ
  timeout tải cực đoan như J3 (G0) và M1 (CDP timeout 60s). Số G5
  của lần này chỉ có trong console log, KHÔNG có report JSON nên
  KHÔNG vào pool (xem độ nhạy ở §1).
- Retry (1 lần duy nhất, theo luật L3 §6): gãy sớm hơn — timeout
  3 phút chờ project mẫu tự load (3 clip) + hook
  `__vcutPreviewEnhance` xuất hiện; app đã mount, modal chào đã
  đóng, nhưng project không load xong trong khi tải vọt 1,26 →
  18,07 giữa chừng. Chrome log chỉ có nhiễu dbus (bình thường);
  vite log "Re-optimizing dependencies because vite config has
  changed" nhưng các file vite.config.* đều cũ (30/10, 06/11) —
  không có bằng chứng config bị sửa.
- **Yếu tố nhiễu chưa loại trừ được:** file harness
  `clicktest-77e1-deint-fps.mjs` bị sửa lúc 02:54:04 UTC — GIỮA
  lần 5 lần 1 (spawn ~02:52) và retry (spawn 03:02) — bởi một
  luồng sibling chưa xác định (không log đợt 86 nào nhắc tới).
  Các lần 1–4 và lần 5 lần 1 đã load xong file harness cũ lúc
  spawn nên không bị ảnh hưởng; retry chạy bằng file harness ĐÃ
  SỬA. Không có git để diff nên không kết luận được sửa đó có góp
  phần làm retry gãy sớm hay không — chỉ ghi lại để parent kiểm
  tra. N5 KHÔNG retry lần thứ ba (luật: 1 retry).
- Hệ quả: cửa sổ N5 không đủ 5 lần → không có verdict luật (b)
  theo đúng nghĩa; bằng chứng N5 là 4 lần tải PASS + 1 lần dở
  dang G5 PASS (console log).

## 4. Khuyến nghị cho parent/user — G1 ĐÓNG HAY CHƯA

**Khuyến nghị của N5: ĐÓNG G1 theo phương án A — đóng có điều kiện
theo chế độ tải.** Quyết định cuối thuộc parent/user; dưới đây là
lý do và điều kiện.

- **Phương án A — Đóng G1 theo chế độ tải (KHUYẾN NGHỊ):** đóng
  G1 với verdict tách theo chế độ, ghi rõ trong LIMITS G1: deint
  ĐẠT ở chế độ tải (pool 20 lần: median 0,895×, mean 0,913, CI
  cận dưới 0,836, 18/20 PASS = 90% — cả hai tiêu chí chặt đều
  đạt với biên rõ) và KHÔNG ĐẠT ở chế độ yên (pool 4 lần: median
  0,680×, 1/4 PASS) do trần lượng tử hoá rAF ~0,65–0,70 — trần
  này là chi phí cấu trúc của 1 khung rAF thêm, không phải lỗi
  code, chỉ hiện khi máy đủ nhanh để baseline chạy đúng nhịp
  60Hz. Không đổi ngưỡng 0,75×. Không sửa production.
  - Vì sao đóng được bây giờ: (1) phía tải đã đủ mẫu (n=20) và
    đạt cả hai tiêu chí chặt với biên lớn (CI cận dưới +0,086,
    PASS 90%); (2) N5 xác nhận hướng dự đoán ở chế độ tải (4/4
    PASS, median 1,045); (3) phía yên có cơ chế đã tách được
    (lượng tử hoá khung, L3 §3.2) nên verdict yên không còn là
    "chưa biết vì sao" mà là "đã biết vì sao và đó là trần cấu
    trúc"; (4) cửa sổ yên là thứ 3 đợt liên tiếp không đo được
    (L3, M1, N5) vì vòng lặp 8–10 luồng giữ VM tải — chờ thêm
    một cửa sổ yên trên VM này trong giờ vòng lặp là không thực
    tế; nếu muốn số yên thì phải đo ngoài giờ vòng lặp hoặc tắt
    bớt sibling, đó là quyết định vận hành, không phải lý do giữ
    G1 mở vô hạn.
  - Điều kiện đóng: (i) ghi rõ verdict "PASS" chỉ đúng ở chế độ
    tải / máy yếu; trên máy nhanh (baseline ≥10 fps) deint chậm
    hơn ngưỡng 0,75× một cách có hệ thống (~0,68×); (ii) không
    trích số pool gộp (0,845× / 79%) như verdict duy nhất — pool
    gộp trộn hai chế độ nên không có nghĩa; (iii) mọi trích dẫn
    sau này phải kèm chế độ đo.
- **Phương án B — Giữ G1 MỞ, đổi metric:** nếu parent muốn một
  verdict duy nhất không phụ thuộc chế độ, luật median-5 hiện tại
  không làm được (11/20 cửa sổ trượt PASS). Cần đổi sang metric
  không bị lượng tử hoá khung chi phối (vd gap-mean tick-time,
  hoặc đo thời gian xử lý/frame thay vì tỉ lệ FPS), rồi đo lại
  pool mới theo metric đó. Tốn ít nhất một đợt đo nữa; gap-mean
  hiện chỉ 2/3 PASS và lệch chiều draw-fps nên chưa có metric thay
  thế sẵn.
- **Phương án C — Giữ G1 MỞ, chờ thêm số yên:** chỉ đóng khi có
  đủ lần yên (n≥10) để CI chế độ yên có nghĩa. Hiện chỉ có 4 lần
  yên — CI [0,527; 0,943] quá rộng để kết luận trần 0,65–0,70 là
  hằng số. Nhược điểm: 3 đợt liên tiếp không đo được lần yên nào
  trong giờ vòng lặp; chờ đợi này có thể kéo dài vô hạn nếu vòng
  lặp vẫn chạy 8–10 luồng song song.
- **Không khuyến nghị:** đóng G1 theo CI pool gộp mà bỏ qua tỉ lệ
  PASS (hai tiêu chí chặt lệch nhau: CI đạt [0,813; 0,954], PASS
  79% < 80% — thiếu đúng 1 lần); hoặc đóng theo một cửa sổ 5 lần
  đơn lẻ (luật lật 9/20 cửa sổ trượt); hoặc trích 1,29× của N5
  lần 4 như tốc độ deint (số của sóng tải, xem §3).

## 5. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Gộp pool tính lại (`analyze-pool86n5.py`) | khớp số I5/J3/K3/L3/M1 đã công bố (pool 20: median 0,805, CI [0,774; 0,914], 15/20; tách chế độ khớp L3 §3.2); pool 24 mới: median 0,845, CI [0,813; 0,954], 19/24 |
| Cửa sổ N5 5 lần headed (verdict script K3) | **4/5 hoàn thành** (lần 5 gãy 2 lần, xem §3); 4 lần xong: 1,06 / 0,95 / 1,03 / 1,29, median 1,045, 4/4 PASS; luật (b) "chưa đủ mẫu" |
| Headed H9 (mọi lần chạy N5) | **0 lỗi trang** cả 4 lần xong; lần 5 lần 1: 0 lỗi trang tới lúc G8 timeout |
| Pixel G2/G7a/G7b/G8 (N5) | giống hệt nhau cả 4 lần (G2 MAD 0,5821; G7a 0,6903; G7b 0,0119; G8 R 0,55 → 0,52) — lệch nhỏ so với K3/L3, xem §3 |
| `node --test deint-fps-verdict-83k3.test.mjs` | **11/11** |
| `tsc --noEmit` | không chạy — không chạm file TS nào |
| `preview.tsx` / `playheadPacing.ts` md5 | không đổi bởi N5 (preview.tsx mtime 01:11 UTC, trước lượt N5 — xem §3) |

## 6. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — N5 không tự đóng.** Mọi khuyến nghị ở §4 cần
   parent/user chọn. Khuyến nghị của N5 là phương án A (đóng có
   điều kiện theo chế độ).
2. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của code.**
   Mọi số FPS deint (G1→N5) đều đo trên VM này (CPU-only, 4 vCPU,
   Chrome `--disable-gpu`, Xvfb). Không suy ra máy khác / máy có
   GPU / Safari thật.
3. **Luật median-5 lật 9/20 cửa sổ trượt.** Đừng trích verdict của
   một cửa sổ 5 lần đơn lẻ như kết luận chắc; luôn ghi kèm chế độ
   đo (baseline mean fps) và cửa sổ.
4. **CI cửa sổ J3 tính lại lệch ±0,02–0,05 so với công bố** (do
   làm tròn đầu vào 2 chữ số). Số pool gộp không đổi.
5. **60fps fixture KHÔNG gộp vào pool 30fps** (fixture khác, tỉ lệ
   slot rải 0,10–1,66 như 30fps; MAD chỉ chứng minh tap áp thật,
   chưa đo R combing).
6. **Combo n=3, SD 0,337 — không verdict combo.** Đừng trích
   "combo 0,65×" như tốc độ combo.
7. **Gap-mean và draw-fps lệch chiều nhau** (L3: gap PASS 0,78,
   draw FAIL 0,72 cùng lần). Chưa có metric chuẩn duy nhất.
8. **Playhead teleport combo** là lỗi sản phẩm thật riêng (M1 §3.2),
   cần luồng riêng quyết hướng sửa — không sửa ở N5.
9. **Cửa sổ N5 không đủ 5 lần** (lần 5 gãy 2 lần dưới sóng tải
   sibling; lần 5 dở dang G5 0,98× chỉ có console log, không vào
   pool). Pool 19/24 = 79% đứng đúng trên lằn ranh 80% — thêm hay
   bớt 1 lần PASS đều lật tỉ lệ gộp; đừng trích 79% như số chắc.
10. **File harness bị sửa giữa chừng đo** (02:54 UTC, tác giả chưa
    xác định; retry lần 5 chạy bằng file đã sửa và gãy sớm hơn).
    Các lần N5 1–4 và lần 5 lần 1 không bị ảnh hưởng (đã load file
    cũ lúc spawn). Cần parent kiểm tra sửa đó trước khi dùng
    harness này cho đợt đo sau.

## 7. Nợ mở cho đợt sau

1. **G1 đóng hay chưa — QUYẾT ĐỊNH CỦA PARENT/USER** (xem §4).
2. Chế độ yên cần thêm lần đo nếu chọn phương án C (hiện n=4).
3. Playhead teleport (M1 §3.2): luồng riêng, đo A/B trước–sau.
4. Harness: pause bằng store trực tiếp thay cho Space (M1 §6);
   ghi số slot đóng băng kèm mọi verdict; bọc lỗi trước-try cho
   E1/verdict script (L3 §7.5).
5. Combo: cần thêm lần đo hoàn thành (hiện n=3) trước mọi verdict combo.
6. R combing fixture 60fps: chưa đo.
7. TTS 39 / gate / vidstab / kernel / G1-G2 / WebKit / GPU-Safari:
   nợ của các luồng khác — không thuộc N5.

## 8. Cách chạy lại

```bash
# Đo 5 lần + verdict (mỗi đợt, ~16 phút; đổi outdir mỗi đợt):
node apps/web/scripts/deint-fps-verdict-83k3.mjs measure \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n5
# Gộp số (đọc report JSON đã có + số đã công bố, không cần headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n5/analyze-pool86n5.py \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n5
# Test hồi quy luật median (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
```
