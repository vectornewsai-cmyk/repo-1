# Đợt 82 J3 — Deint FPS: verdict theo TRUNG VỊ gộp — PASS, NHƯNG BIÊN AN TOÀN KHÔNG CÓ

Ngày: 10/11/2026 (lượt cron 21:35 +07; đo headed 14:39–15:23 UTC, tức
21:39–22:23 giờ VN). Máy đo: VM này (4 vCPU, ~8GB RAM, Chromium 158 qua
Xvfb + CDP; VM reboot lúc ~14:27 UTC, up ~12 phút khi bắt đầu — giống I5).
Nợ: docs/PHASE9_ROUND81_I5_DEINT_FPS_REGRESSION_LIMITS.md §1/§5.3/§7.1
(verdict "G1 đóng" mỏng: CI 95% mean gộp [0,74; 0,95] chạm ngưỡng;
baseline rải 10×; loadavg không dự báo được tỉ lệ) +
docs/PHASE9_ROUND80_H6_G8_ROOTCAUSE_LIMITS.md §5.2 (một lần chạy đơn lẻ
lật được cả 2 chiều).

## 1. Kết luận ngắn

- **Verdict theo TRUNG VỊ: PASS — nhưng KHÔNG có biên an toàn, nên
  "G1 đóng" vẫn chưa thể gọi là chắc.** Gộp 10 lần chạy E1 code mới
  (5 lần I5 + 5 lần mới J3, 50 tỉ lệ đơn lẻ): **median từng-lần 0,81×,
  median tỉ lệ đơn lẻ 0,82×, mean gộp 0,87× — đều ≥ ngưỡng 0,75×**.
  Nhưng cận dưới CI 95% của **median từng-lần là 0,74** (bootstrap,
  [0,74; 1,03]) và của **mean từng-lần là 0,749** ([0,75; 0,98]) —
  cả hai đều chạm hoặc thiếu ngưỡng một chút. Chỉ median tỉ lệ đơn
  lẻ có cận dưới CI vượt ngưỡng ([0,76; 0,91]). Nói thẳng: trung tâm
  phân phối nằm trên ngưỡng ~0,06–0,07, tức nhỏ hơn một độ lệch
  chuẩn của một lần chạy (SD 0,16) — một lần chạy đơn lẻ vẫn lật
  được, và 2/5 lần mới lần này đã FAIL.
- **2 lần FAIL mới làm yếu tách biệt mới–cũ.** Gộp toàn bộ lịch sử
  code mới (15 lần: G1 3 + H6 2 + I5 5 + J3 5): **12/15 PASS,
  mean 0,934, median 0,830**; code cũ (4 lần): 1/4 PASS, mean 0,730,
  median 0,585. Fisher một phía trên bảng pass/fail [[12,3],[1,3]]:
  **p≈0,071** (I5: 0,041 — đã yếu đi, không còn < 0,05); Welch
  t-test trên mean từng lần: t≈1,21, df~4, **p≈0,29** (không có ý
  nghĩa; mẫu cũ chỉ n=4). Hướng tách biệt vẫn đứng, nhưng bằng chứng
  thống kê KHÔNG mạnh lên sau khi thêm dữ liệu — ngược lại, nó yếu
  đi vì 2 lần FAIL mới.
- **Không sửa production.** Không tìm được nguyên nhân gốc nào thuộc
  về code: mọi biến động đo được đều giải thích được bằng nhiễu đo +
  trạng thái máy (xem §3). Cơ chế G1 còn nguyên (pixel ổn định y hệt
  I5 cả 5 lần: G2/G7a/G7b/G8 MAD giống tới 4 chữ số).
- **H-A (lần đầu sau reboot nhanh bất thường): CÓ HIỆU ỨNG THẬT,
  nhưng "warmup" là nhãn sai.** 2 baseline lớn nhất trong 10 lần
  (27,35 và 16,35 fps) là đúng 2 lần chạy đầu tiên của mỗi đợt —
  kiểm hoán vị p≈0,022. Cơ chế còn mở (xem §3.1): warmup theo nghĩa
  làm nóng cache dự báo lần đầu CHẬM, ngược với quan sát.
- **H-D (lượng tử hoá đếm): LÀ NGUỒN NHIỄU CHỦ ĐẠO — đã chứng minh
  bằng số.** Lần chậm (2–14 lần vẽ/slot) có SD tỉ lệ trong lần 0,277,
  gần gấp đôi lần nhanh (45–96 lần vẽ/slot): 0,150. Mọi tỉ lệ cực
  đoan (0,29–0,35 và 1,47–1,85) đều từ slot chỉ có 2–5 lần vẽ.
- **H-B (drift/trật tự slot) và H-E (loadavg): KHÔNG chứng minh
  được.** Pearson slot–tỉ lệ gộp −0,20 (p≈0,16); dấu xu hướng
  trong-lần đổi chiều tuỳ lần chạy. Loadavg vẫn không dự báo được
  verdict một lần chạy (J3 lần 1: tải 3,0 mà mean tệ nhất 0,68×) —
  nhưng tải cao DỰ BÁO ĐƯỢC tốc độ tuyệt đối và timeout harness
  (xem §3.5).
- **3 lần timeout harness G0 (lần 4/4b/4c) là lỗi môi trường, không
  phải lỗi sản phẩm.** Probe chẩn đoán chứng minh app vẫn load được
  lúc tải thấp (~41s sau navigate); app mount kéo dài 18s → 64–74s
  khi sibling đợt 82 chạy nặng (electron-builder, ffmpeg, nhiều
  Chrome; load 15-phút 9–12). Không file nguồn nào đổi trong lúc đó.

## 2. Thay đổi code (trạng thái cuối — KHÔNG ĐỔI production)

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND82_J3_DEINT_FPS_MEDIAN_LIMITS.md` | **Mới**: file này. |
| `apps/web/scripts/analyze-82j3-deint-fps.py` | **Mới**: phân tích gộp — median/mean + CI 95% (t và bootstrap), pass/fail, kiểm H-A/H-B/H-C/H-D/H-E. Chạy: `python3 analyze-82j3-deint-fps.py <dir-I5> <dir-J3>` (đọc `headed-run*/c77e1-headed-report.json`). |
| `apps/web/scripts/analyze-82j3-extra.py` | **Mới**: Fisher exact + Welch t-test mới-vs-cũ (15 vs 4 lần), kiểm hoán vị H-A. |
| `apps/web/scripts/probe-82j3-sample-load.mjs` | **Mới**: probe chẩn đoán G0 timeout — poll số clip/hook mỗi 10s tối đa 300s, log kèm loadavg. Chạy: `J3P_SCRATCH=… J3P_DEV_PORT=5596 J3P_DEBUG_PORT=9696 J3P_DISPLAY=:196 node probe-82j3-sample-load.mjs`. |
| `apps/web/src/preview.tsx` | **KHÔNG ĐỔI** (md5 `783b5a12c8bfc27e14d6a1f4cdfc4a8a` trước/sau như nhau, khớp I5). |
| Harness E1 | **KHÔNG ĐỔI** — dùng nguyên `clicktest-77e1-deint-fps.mjs`. |

Không đụng `enhancePreview.ts`, spec/render/store/i18n (dict không
đổi), không đụng workflow, không đụng TTS/Gradio. Không binary vào
batch. `apps/web/dist/` KHÔNG build lại (không đổi code).

## 3. Số đo thật

### 3.1 E1 headed × 5 lần mới (J3) — G5 (draw-fps, drift-corrected, ngưỡng 0,75×)

Cửa sổ 2560×1440, canvas backing 1991×815, scaleY 1,132, clip 1 =
interlaced720.mp4, 11 slot (6 baseline + 5 deint, 3s/slot). Tải ghi
là loadavg 1-phút (đầu → cuối phần FPS).

| Lần | Thời gian (UTC) | Tải 1-phút | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|
| 1 | 14:39–14:41 | 3,0 → 1,6 | 27,35 fps | 0,81 / 0,82 / 0,64 / 0,59 / 0,54 | **0,68×** | FAIL, 9/10 |
| 2 | 14:42–14:45 | 18,1 → 13,5 | 2,47 fps | 0,99 / 0,77 / 0,58 / 0,35 / 0,95 | **0,73×** | FAIL, 9/10 |
| 3 | 14:47–14:50 | 3,6 → 13,9 | 0,88 fps | 1,85 / 1,09 / 0,82 / 1,40 / 0,49 | **1,13×** | PASS, 10/10 |
| 4d | 15:15–15:18 | 13,1 → 18,0 | 2,11 fps | 0,83 / 0,91 / 0,89 / 0,51 / 0,63 | **0,75×** | PASS (sát ngưỡng), 10/10 |
| 5 | 15:20–15:23 | 4,6 → 0,8 | 1,56 fps | 0,86 / 1,51 / 1,46 / 0,80 / 1,00 | **1,13×** | PASS, 10/10 |

**Slot draw-fps từng lần (B = baseline, D = deint, fps):**

| Lần | B0 | D1 | B2 | D3 | B4 | D5 | B6 | D7 | B8 | D9 | B10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 26,59 | 19,29 | 21,24 | 20,17 | 28,22 | 19,25 | 31,88 | 18,27 | 29,62 | 15,04 | 26,53 |
| 2 | 1,56 | 1,89 | 2,27 | 1,57 | 1,81 | 0,88 | 1,22 | 0,99 | 4,49 | 3,78 | 3,46 |
| 3 | 0,66 | 1,58 | 1,05 | 0,88 | 0,57 | 0,63 | 0,97 | 1,29 | 0,87 | 0,50 | 1,17 |
| 4d | 1,39 | 1,52 | 2,28 | 1,76 | 1,58 | 1,77 | 2,41 | 1,23 | 2,44 | 1,58 | 2,55 |
| 5 | 1,28 | 0,93 | 0,88 | 1,14 | 0,63 | 1,75 | 1,77 | 1,83 | 2,81 | 2,41 | 2,00 |

(Slot chi tiết đầy đủ ở bảng trên; JSON gốc trong
`hidden_files/round82-j3/headed-run4d/` và `headed-run5/`.)

- **Lần 1 (FAIL 0,68×):** lần headed ĐẦU TIÊN sau reboot (uptime
  ~12 phút), lại NHANH NHẤT đợt (27,35 fps) như I5 lần 1 (16,35).
  Tỉ lệ GIẢM DẦN theo slot: 0,81 → 0,82 → 0,64 → 0,59 → 0,54
  (baseline giữ 21–32 fps, deint tụt 19,3 → 15,0). Đây là lần duy
  nhất trong 10 lần có xu hướng giảm rõ rệt — xem H-B §3.3.
- **Lần 3 (PASS 1,13×):** baseline thấp nhất lịch sử E1 (0,88 fps)
  — mỗi slot chỉ ~2–3 lần vẽ; tỉ lệ rải 0,49–1,85. PASS này là
  PASS của nhiễu, không phải của tốc độ — xem H-D §3.4.
- **Lần 4d (PASS 0,75× đúng ngưỡng):** là lần chạy lại sau 3 lần
  timeout G0 liên tiếp (lần 4/4b/4c, xem §3.5) — không tính 3 lần
  lỗi harness vào verdict (không có số đo).
- **Pixel ổn định y hệt I5 cả 5 lần:** G2 R 0,74→0,51 MAD 0,6114;
  G7a MAD 0,6985; G7b MAD 0,0119; **G8 MAD 1,5817**; H9 0 lỗi trang.
  Không có gì dịch chuyển về pixel; chỉ FPS nhiễu.

### 3.2 Gộp 10 lần (I5 5 + J3 5) — verdict theo trung vị

`analyze-82j3-deint-fps.py` đọc 10 file `c77e1-headed-report.json`
(tính lại tỉ lệ drift-corrected từ drawFps — khớp log harness tới
±0,01):

| Thống kê | Giá trị | CI 95% | So ngưỡng 0,75× |
|---|---|---|---|
| Mean từng-lần (n=10) | 0,865 | [0,749; 0,980] (t) | cận dưới **thiếu 0,001** |
| **Median từng-lần (n=10)** | **0,807** | **[0,740; 1,028]** (bootstrap 20.000) | cận dưới **thiếu 0,01** |
| Mean tỉ lệ đơn lẻ (n=50) | 0,865 | [0,776; 0,954] (t) | cận dưới vượt 0,026 |
| **Median tỉ lệ đơn lẻ (n=50)** | **0,823** | **[0,764; 0,913]** (bootstrap 20.000) | cận dưới vượt 0,014 |
| SD từng-lần / SD tỉ lệ đơn lẻ | 0,161 / 0,313 | — | — |
| Pass từng-lần / pass tỉ lệ đơn lẻ | **8/10** / 34/50 | — | — |
| Baseline tuyệt đối gộp | 0,88–27,35 fps (**31×**) | median 2,29 | — |

**Đọc verdict:** trung vị gộp (0,81× theo lần, 0,82× theo tỉ lệ)
vượt ngưỡng 0,75× với biên +0,06–0,07 — nhưng biên này nhỏ hơn
một SD của một lần chạy (0,16). Quy tắc "PASS ổn định" của I5 §6.1
(≥4/5 lần PASS VÀ cận dưới CI mean gộp ≥ 0,75): với 10 lần, 8/10
PASS nhưng cận dưới CI mean là 0,749 — **vẫn chưa đạt theo nghĩa
chặt, thiếu 0,001**. Đừng trích "deint nhanh hơn ~13%" hay "0,87×"
như tốc độ thật; verdict đúng là **"không còn chậm hơn ngưỡng đo
được, theo trung vị gộp — biên an toàn chưa có"**.

**Lịch sử đầy đủ code mới (15 lần) vs cũ (4 lần)** —
`analyze-82j3-extra.py`: mới 1,51/0,83/1,03 (G1) + 1,28/0,71 (H6) +
0,93/0,75/0,80/0,81/0,94 (I5) + 0,68/0,73/1,13/0,75/1,13 (J3) →
mean 0,934, median 0,830, 12/15 PASS. Cũ 0,59/0,58/0,55 (F1) +
1,20 (H6 revert) → mean 0,730, median 0,585, 1/4 PASS. Fisher một
phía [[12,3],[1,3]] p≈0,071 (I5: 0,041); Welch t≈1,21, df~4,
p≈0,29. Tách biệt mới–cũ còn đứng về hướng, KHÔNG mạnh về thống kê.

### 3.3 Kiểm giả thuyết H-A/H-B/H-C/H-D/H-E (bằng số đo)

**H-A — lần chạy đầu tiên sau reboot nhanh bất thường: CÓ HIỆU
ỨNG, p≈0,022 (hoán vị); nhưng "warmup" là nhãn SAI.**

- Baseline 10 lần theo thứ tự: 16,35 / 3,16 / 2,61 / 1,77 / 1,64
  (I5) rồi 27,35 / 2,47 / 0,88 / 2,11 / 1,56 (J3). Hai giá trị lớn
  nhất (27,35 và 16,35) là đúng 2 lần đầu đợt — xác suất điều này
  xảy ra nếu không có hiệu ứng thứ tự là 1/C(10,2) ≈ 0,022.
  Median 8 lần còn lại là 1,94 fps; lần đầu nhanh hơn 8,4× (I5)
  và 14,1× (J3) so với median đó. Trong đợt I5, baseline giảm đơn
  điệu theo thứ tự lần (16,35 → 1,64); đợt J3 lần 1 >> các lần sau
  (27,35 vs 0,88–2,47).
- **Cơ chế còn mở — và "warmup" dự báo NGƯỢC.** Làm nóng cache
  (decoder/V8/page-cache) dự báo lần đầu CHẬM rồi nhanh dần — quan
  sát là lần đầu NHANH rồi chậm dần. Hai ứng viên còn lại:
  (a) **thời điểm sibling**: lần 1 chạy trước khi các luồng sibling
  vào pha nặng (J3 lần 2 tải 18, lần 4d tải 13–18; I5 ghi sibling
  khởi động/kết thúc không đều trong cửa sổ đo); (b) **giới hạn CPU
  ở host** (burst credit rồi bị cap — giả thuyết I5 §3.3c, không
  xác minh được từ trong VM). Không có dữ liệu nào trong đợt này
  phân biệt được (a) và (b) — ghi rõ là CHƯA KẾT LUẬN, không chọn
  bừa một cái.
- Hệ quả thực hành: **đừng lấy lần chạy đầu sau reboot làm đại diện
  cho tốc độ** — nó là ngoại lệ, không phải mức thường. Mọi so sánh
  mới–cũ nên bỏ lần đầu của mỗi đợt hoặc chạy 1 vòng warmup không
  tính điểm trước khi đo (đề xuất I5 §6.3, vẫn chưa làm).

**H-B — drift-correction / trật tự slot làm méo tỉ lệ: KHÔNG CHỨNG
MINH ĐƯỢC (yếu, không có ý nghĩa).**

- Gộp 50 tỉ lệ theo slot deint: slot 1 mean 0,968 / slot 3 0,902 /
  slot 5 0,860 / slot 7 0,788 / slot 9 0,804 — có chiều giảm nhẹ,
  Pearson(chỉ số slot, tỉ lệ) = −0,20, n=50, p≈0,16 (không có ý
  nghĩa). J3 lần 1 giảm rõ (0,81→0,54) nhưng là mẫu đơn lẻ: I5 lần 1
  (0,96/0,74/1,24/0,98/0,73) và lần 5 (1,47/1,15/0,84/0,45/0,78)
  không có xu hướng đơn điệu.
- Pearson trong-lần (slot → drawFps) đổi dấu tuỳ lần: baseline
  −0,31…+0,87, deint −0,95…+0,98 — không có xu hướng chung. Không
  có bằng chứng drift hệ thống cần sửa harness; phép hiệu chỉnh
  bằng trung bình 2 baseline kề vẫn đủ. **Không đổi harness vì H-B.**

**H-C — trần ~30 fps nén tỉ lệ khi máy nhanh: YẾU, chỉ một phần.**

- Tỉ lệ có baseline kề ≥10 fps (n=8, toàn từ 2 lần nhanh): mean
  0,794; baseline kề <10 fps (n=42): mean 0,878 — chênh −0,084,
  cùng chiều với dự báo nén trần (I5 §5.6: deint 21,91 vs trần
  ~29,9 cho tỉ lệ 0,73 dù máy nhanh nhất). Nhưng n=8 nhỏ, và 2 lần
  nhanh "ít nhiễu lượng tử nhất" lại lệch nhau tới 0,25 (I5 lần 1:
  0,93× vs J3 lần 1: 0,68×) — trần không giải thích được chênh này.
  Đọc đúng: khi hết nhiễu lượng tử, tỉ lệ đo được vẫn dao động
  ±0,12 quanh ~0,8 — tức **có biến động thật giữa các lần chạy
  ngoài lượng tử hoá** (trạng thái máy: throttle/vsync/GPU process
  — chưa tách được, xem §5.4). Fixture 60 fps (đề xuất I5 §6.6)
  vẫn đáng làm để đo sạch vùng nhanh.

**H-D — lượng tử hoá đếm (3s × ~1 fps ≈ 3 lần vẽ/slot): ĐÃ CHỨNG
MINH — NGUỒN NHIỄU CHỦ ĐẠO.**

- Số lần vẽ/slot = drawFps × 3s. Lần chậm (baseline <5 fps, n=8):
  2–14 lần vẽ/slot, chủ yếu 3–8; lần nhanh (baseline ≥5, n=2):
  45–96 lần vẽ/slot.
- **SD tỉ lệ trong lần: lần chậm 0,277 vs lần nhanh 0,150** — gần
  gấp đôi. Ở ~3 lần vẽ/slot, ±1 lần vẽ là ±33% fps của slot đó —
  đủ một mình giải thích SD 0,27–0,31 của tỉ lệ đơn lẻ.
- Mọi tỉ lệ cực đoan đều từ slot ít lần vẽ: 0,29 (I5 lần 2 slot 1:
  deint 0,96 fps ≈ 3 lần vẽ, kề 8/12 lần); 0,34 (I5 lần 3 slot 5:
  deint 1,02 fps ≈ 3 lần vẽ); 0,35 (J3 lần 2 slot 7: deint 0,99
  fps ≈ 3 lần vẽ); 1,85 (J3 lần 3 slot 1: deint 1,58 fps ≈ 5 lần
  vẽ, kề 2/3 lần); 1,47 (I5 lần 5 slot 1); 1,51/1,46 (J3 lần 5
  slot 3/5: deint ~4–5 lần vẽ). Không tỉ lệ nào >1,3 hay <0,45
  xuất phát từ slot có ≥15 lần vẽ.
- Hệ quả: **mọi verdict từ lần chạy baseline ~1 fps đều mang sai số
  lượng tử ±0,3** — đó là lý do 2/5 lần mới FAIL dù code không đổi.
  Slot 6s (đề xuất I5 §6.2) sẽ giảm lượng tử hoá xuống ~±17% và là
  cách rẻ nhất để verdict có nghĩa hơn; nhưng đổi slot là đổi
  harness — cần parent duyệt trước khi làm (J3 không tự đổi).

**H-E — loadavg 1-phút dự báo tỉ lệ: KHÔNG (xác nhận I5, n=10).**

- Pearson(load đầu FPS, baseline) = −0,26; Pearson(load đầu FPS,
  mean từng lần) = −0,51 (n=10, p≈0,13 — không có ý nghĩa).
- Bằng chứng trực tiếp phản bác: J3 lần 1 tải đầu 3,0 (thấp) mà
  mean tệ nhất đợt (0,68×); J3 lần 3 tải đầu 3,6 mà mean cao nhất
  (1,13×); I5 lần 3 slot 5 tỉ lệ 0,34 lúc tải 0,55. **Đừng dùng
  loadavg để "hiệu chỉnh" hay bác một lần đo.**
- NHƯNG loadavg DỰ BÁO ĐƯỢC tốc độ tuyệt đối và khả năng harness
  timeout: lần 4/4b/4c timeout G0 đều ở cửa sổ tải 15-phút 9–12
  (xem §3.5); app mount kéo dài 18s → 64–74s theo tải sibling.

### 3.4 (không đo lại) Gap-mean — nợ G1 §6.1 vẫn mở một nửa

J3 không chạy lại probe tick-time (nhiệm vụ là E1 + giả thuyết).
Trạng thái giữ nguyên từ I5: gap-mean 1 PASS (0,98×) / 1 FAIL
(0,71×) sau G1. Cần thêm lần tick-time lúc VM yên tĩnh — chưa có.

### 3.5 Ba lần timeout harness G0 (lần 4/4b/4c) — lỗi môi trường

| Lần thử | Thời gian (UTC) | Tải lúc bắt đầu | App mount sau | Kết quả |
|---|---|---|---|---|
| 4 | 14:51–14:56 | 25,5 | 74s (vite lên 14:52:08 → mount 14:53:22) | timeout G0 sau 180s |
| 4b | 14:57–15:01 | 3,7 (5-phút 13,2) | 68s | timeout G0 sau 180s |
| 4c | 15:06–15:10 | 0,7 (5-phút 7,9) | 64s | timeout G0 sau 180s |

- Triệu chứng giống hệt nhau: vite lên, app mount, modal chào đóng,
  rồi 180s chờ project mẫu (3 clip) + hook `__vcutPreviewEnhance`
  không bao giờ thoả (`last=null`). Không có số đo → không tính
  vào verdict, không tính là FAIL G5.
- Loại trừ: `preview.tsx`/`store.ts` md5/mtime không đổi trong lúc
  đó (preview.tsx 09:41 UTC, store.ts 03:03 UTC — không sibling nào
  sửa nguồn app); media `interlaced720.mp4` còn nguyên trong
  `.scratch-r61r3-1cOf/media/`; vite config `/tmp/round77-e1/`
  nguyên vẹn; không còn tiến trình thừa của lần trước (không còn
  vite :5593/:5594, Xvfb :193/:194 sau lỗi — harness dọn sạch).
- Chẩn đoán bằng probe mới `probe-82j3-sample-load.mjs` (15:13–
  15:14 UTC, tải 1-phút ~0,6): poll mỗi 10s — t+21s shell trống
  (0 clip, 0 canvas), t+31s UI mount + `store.ts` đã load (0 clip),
  **t+41s đủ 3 clip + hook** (`c_kd9zji8`...). App load ĐƯỢC, chỉ
  CHẬM: ~41s sau navigate (lần 1–3 chỉ mất vài giây sau mount).
  Dưới tải sibling nặng (electron-builder AppImage + ffmpeg +
  nhiều Chrome headed của các luồng đợt 82 khác; load 15-phút
  9–12), boot app kéo dài gấp ~4 lần và vượt cửa sổ 180s của G0.
- Lần 4d chạy lại lúc 15:15 (sau khi probe chứng minh app còn load
  được) đã qua G0 trong vài giây và cho số đo bình thường (0,75×).
- Bài học: **cửa sổ 180s của G0 quá ngắn khi VM nghẽn vì sibling**;
  cách xử lý đúng là thử lại lúc tải thấp (đã làm, thành công),
  không phải sửa harness hay kết luận app hỏng. Không sửa harness
  trong đợt này.

## 4. Kiểm chứng (cây cuối — chỉ thêm 3 script + file này)

| Kiểm chứng | Kết quả |
|---|---|
| `node --check probe-82j3-sample-load.mjs` | **OK** |
| `py_compile` 2 script phân tích | **OK** |
| Phân tích gộp chạy lại được | **OK** (10 run, số khớp log harness ±0,01) |
| Headed E1 lần 1–5 (code mới, cùng cây) | 9/10, 9/10, 10/10, 10/10, 10/10 (G5: 0,68 / 0,73 / 1,13 / 0,75 / 1,13) |
| Probe chẩn đoán sample-load | xong (§3.5; load được sau ~41s lúc tải thấp) |
| `preview.tsx` md5 trước/sau | `783b5a12…` không đổi |
| Headed H9 (mọi lần chạy hợp lệ) | **0 lỗi trang** |
| tsc / vite build / unit test | **KHÔNG chạy lại** — không đổi code production nào (md5 khớp trước/sau; I5 đã chạy tsc 0 + unit 11/11 + 10/10 + 14/14 trên cùng cây này) |

## 5. Giới hạn — đọc trước khi trích số

1. **"PASS theo trung vị" KHÔNG có nghĩa là "G1 chắc chắn đóng".**
   Median gộp 0,81× (theo lần) / 0,82× (theo tỉ lệ) vượt ngưỡng,
   nhưng cận dưới CI 95% của median từng-lần (0,74) và mean từng-lần
   (0,749) đều chạm/thiếu ngưỡng. Xác suất một lần chạy đơn lẻ FAIL
   theo lịch sử: 3/15 lần code mới (20%). Verdict theo 1 lần chạy
   vẫn là tung đồng xu có lệch — đừng bao giờ verdict bằng 1 lần.
2. **Baseline tuyệt đối không so được giữa các lần:** 0,88–27,35
   fps (**31×**, I5 ghi 10×) trên cùng cây, cùng ngày, cùng harness.
   FPS tuyệt đối của E1 không phải số tốc độ của sản phẩm — chỉ tỉ
   lệ trong cùng lần chạy mới có nghĩa, và ngay cả tỉ lệ đó cũng có
   SD 0,31 (đơn lẻ) / 0,16 (từng lần).
3. **Lần chạy đầu sau reboot là ngoại lệ, không phải mức thường.**
   Đừng trích baseline 27,35 fps hay tỉ lệ 0,68× của J3 lần 1 như
   số đại diện — lần đầu nhanh bất thường (p≈0,022) và cơ chế chưa
   rõ (sibling-timing vs cap host). Mọi so sánh mới–cũ nên bỏ lần
   đầu hoặc chạy warmup không tính điểm trước.
4. **Lượng tử hoá chi phối mọi lần chạy chậm.** Ở baseline ~1 fps,
   slot 3s chỉ có ~3 lần vẽ; verdict lần chạy mang sai số ±0,3 chỉ
   vì đếm. PASS 1,13× của lần 3 và lần 5 không chứng minh deint
   nhanh hơn baseline 13% — chúng chứng minh nhiễu đếm lớn hơn hiệu
   ứng cần đo. Đừng trích 1,13× như tốc độ thật.
5. **Loadavg không bác được một lần đo, nhưng tải cao làm hỏng
   phép đo.** 3 lần timeout G0 (§3.5) xảy ra khi VM nghẽn vì
   sibling — đó là lỗi phép đo, không phải lỗi sản phẩm, và đã xử
   lý đúng bằng probe + chạy lại lúc tải thấp. Đợt sau đo E1 nên
   tránh cửa sổ sibling nặng (electron-builder/ffmpeg/Chrome).
6. **Gap-mean vẫn mở một nửa** (1 PASS / 1 FAIL sau G1); J3 không
   đo lại tick-time. Nợ G1 §6.1 chưa đóng hẳn.
7. **Chưa đo:** A/B revert (không cần — không có FAIL ổn định, và
   2 lần FAIL mới là nhiễu đo chứ không phải hồi quy ổn định);
   máy thật có GPU; Safari/WebKit thật; footage xen kẽ gốc từ
   camera; combo deint + chroma/LUT/effects (G1 §6.4 vẫn mở);
   fixture 60 fps cho vùng nhanh.

## 6. Đề xuất verdict + đo ổn định hơn (cho parent quyết — J3 không tự đổi)

Ngưỡng 0,75× giữ nguyên (quyết định của user/parent, không tự đổi).
Nhưng cách verdict nên đổi để có nghĩa — đề xuất cụ thể, thay cho
quy tắc I5 §6.1 chưa đạt:

1. **Verdict theo MEDIAN của 5 lần chạy, không theo 1 lần, không
   theo mean.** Quy tắc đề xuất: "PASS ổn định" ⟺ median 5 lần
   chạy gần nhất ≥ 0,75× VÀ ≥4/5 lần ≥ 0,75×. Theo quy tắc này,
   đợt này (J3 5 lần: 0,68/0,73/1,13/0,75/1,13 — median 0,75, 3/5
   PASS): **chưa đạt "PASS ổn định"** (thiếu 1 lần PASS; median
   đúng ngưỡng, không có biên). Gộp 10 lần (I5+J3: median 0,81,
   8/10 PASS): **đạt theo quy tắc này**. Mâu thuẫn giữa 2 cửa sổ
   cho thấy verdict vẫn nhạy với cửa sổ chọn — cần ghi rõ cửa sổ
   khi trích verdict.
2. **Slot dài hơn: 3s → 6s.** Giảm lượng tử hoá từ ±33% xuống ~±17%
   ở baseline ~1 fps — cách rẻ nhất để CI thu hẹp. Cần parent duyệt
   vì đổi harness (J3 không tự đổi).
3. **Warmup không tính điểm + bỏ lần đầu sau reboot.** Chạy 1 lần
   E1 warmup trước khi đo chính thức, hoặc loại lần đầu của mỗi đợt
   khỏi verdict (H-A §3.3: lần đầu là ngoại lệ có ý nghĩa p≈0,022).
4. **Đo lúc VM yên tĩnh; ghi thêm trạng thái máy mỗi lần chạy:**
   loadavg 1/5/15 phút, uptime VM, số tiến trình sibling nặng
   (electron-builder/ffmpeg/Chrome) — loadavg 1-phút một mình
   không đủ (§3.3 H-E), nhưng tải cao vẫn là tín hiệu cảnh báo
   timeout G0.
5. **Fixture 60 fps cho vùng nhanh** (tránh trần 30 fps nén tỉ lệ —
   H-C §3.3), và thêm lần tick-time lúc yên tĩnh để khép gap-mean.

## 7. Nợ mở cho đợt sau

1. G5: verdict "PASS ổn định" theo quy tắc §6.1 **chưa đạt** (median
   5 lần J3 đúng 0,75, chỉ 3/5 PASS; gộp 10 lần thì đạt) — cần thêm
   lần đo (hoặc slot 6s) để CI thu hẹp; không mở lại G1, không sửa
   production. **Quyết định "G1 đóng hay chưa" thuộc về parent/user,
   không phải J3** — J3 chỉ đưa số: median gộp 0,81×, CI cận dưới
   0,74.
2. Gap-mean: 1 PASS / 1 FAIL sau G1 — cần thêm lần tick-time lúc VM
   yên tĩnh (nợ G1 §6.1, còn mở một nửa).
3. Harness FPS: xem xét slot 6s + warmup (§6.2–6.3); cửa sổ G0 180s
   quá ngắn khi VM nghẽn sibling — cân nhắc tăng lên 300s hoặc
   retry tự động 1 lần khi timeout G0 (đề xuất, chưa làm).
4. H-A: cơ chế lần-đầu-nhanh chưa tách được (sibling-timing vs cap
   host) — nếu cần, đo bằng cách chạy E1 ngay sau reboot khi KHÔNG
   có sibling nào chạy, so với chạy khi sibling nặng.
5. FPS combo deint + chroma/LUT/effects (G1 §6.4) vẫn chưa đo.
6. TTS 39 / gate / vidstab / kernel BC / G1-G2 / WebKit loop /
   GPU-Safari thật: nợ của các luồng khác — không thuộc J3.

## 8. Cách chạy lại

```bash
# Phân tích gộp (đọc JSON report của I5 + J3):
python3 apps/web/scripts/analyze-82j3-deint-fps.py \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round81-i5 \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round82-j3
# Fisher + Welch + kiểm hoán vị H-A:
python3 apps/web/scripts/analyze-82j3-extra.py
# Headed E1 trên cây hiện tại, 1 lần (~3-5 phút; đổi port/display/scratch mỗi lần):
E1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round82-j3/headed-runN \
  E1_DEV_PORT=559N E1_DEBUG_PORT=969N E1_DISPLAY=:19N \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Probe chẩn đoán sample-load (~1 phút):
J3P_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round82-j3/probe-sample-load \
  J3P_DEV_PORT=5596 J3P_DEBUG_PORT=9696 J3P_DISPLAY=:196 \
  node apps/web/scripts/probe-82j3-sample-load.mjs
```
