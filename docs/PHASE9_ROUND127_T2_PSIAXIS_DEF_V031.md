# Định nghĩa trục tải PSI cho bar F2 leg B — v0.3.1 (CHUẨN, hiệu chỉnh bằng leg 45–55% đợt 126)

**Ngày:** 17/11/2026. **Đợt:** 127, luồng T2. **Trạng thái:** ĐỊNH NGHĨA
CHUẨN v0.3.1 — parent đã **PHÊ DUYỆT** viết theo quyết đợt 126 §12(b)
(thu hẹp dải chuyển theo leg dò ~45–55% + một leg kiểm tra xen kẽ
đợt 127 do T3 thực hiện).
**File này THAY THẾ v0.3 làm chuẩn hiện hành.** File v0.3
(`docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md`), v0.2
(`docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md`) và v0.1
(`docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`) được **giữ nguyên vẹn
làm lịch sử** — không sửa, không xóa.
**Phạm vi:** chỉ dùng cho bar F2 leg B (Q8SEEKFAST) và các đo tải
liên quan trong cell này (VM Secure, 4 vCPU nhìn thấy, ngân sách
chia sẻ ~1,5 CPU). **KHÔNG dùng load1 làm biến tải trong bất kỳ
kết luận nào** — load1 chỉ ghi để đối chiếu (đã chứng minh vô hiệu,
xem §8). 19,63 vẫn chỉ là NHÃN LỊCH SỬ của lượt s77c.

**Cơ sở dữ liệu của v0.3.1:** 24 run của v0.3 (Yên đợt 123 + Vừa/Nặng
đợt 124 + GAP đợt 125) + leg dò ~45–55% đợt 126 (6/6 VALID, boot #71,
cây baseline) = **30 run gộp**. Chi tiết leg 126:
`docs/PHASE9_ROUND126_T4_LEG4555_LIMITS.md` (§0–§12); prereg +
bảng diễn giải đã đăng ký trước:
`hidden_files/round126-t4/prereg-def03-leg4555.md` §6.
Leg 126 trả đúng nhánh "Trộn" của bảng diễn giải đó (3/6 nhanh,
3/6 chậm tại ~46%) → dải chuyển = giao hai vùng trộn (~46% và ~53%).

## 0. Thay đổi so với v0.3 (đọc trước — từng mục)

| Mục | Trạng thái v0.3.1 | Thay đổi |
|---|---|---|
| §1 Vì sao PSI | GIỮ NGUYÊN | Không đổi |
| §2 Trục chính/phụ/chỉ báo | CẬP NHẬT | Mức trung gian của tickRate nay là một **khoảng ~28–33** (thay cho một điểm ~28,5) |
| §3 Band + dải chuyển + tickRate | **ĐỔI** | Dải chuyển: dải làm việc **~45–60% → vùng trộn quan sát được ~46–53%**; cận dưới ~45% **ĐÃ KIỂM CHỨNG** (không còn là giả thuyết); cận trên 60% → ~53%; thêm hàng GAP-126 ~46% vào bảng tickRate + đường cong 5 điểm (n=30) |
| §4 Protocol đo | CẬP NHẬT | §4.1: thêm **bài học hold sau warm-up** (hold 90 s làm run 1 leo dốc) + khuyến nghị hold ngắn hơn cho leg sau; §4.7: dial bằng browser ấm từ "MỚI, bắt buộc" lên **protocol CHUẨN ĐÃ ĐƯỢC CHỨNG MINH** (sai số 0,24 điểm) |
| §5 Luật VOID | GIỮ NGUYÊN | Không đổi |
| §6 Trả lời câu hỏi ranh giới | **ĐỔI** | Ranh giới = **vùng trộn quan sát được ~46–53%**; ghi rõ khoảng chưa đo (53%, 65,75%) và bằng chứng dải là ngẫu nhiên (run 3 chậm @ 47,74% vs run 4 nhanh @ 48,00%) |
| §7 Tương quan gộp | CẬP NHẬT | n=24 → **n=30** (số r cập nhật, xem bảng) |
| §8 load1 vô hiệu | CẬP NHẬT | Thêm bằng chứng mới từ leg 126 (run 5 vs run 2 cùng PSI ~47%, load1 trái ngược) |
| §9 Caveat | CẬP NHẬT | Thêm caveat **xen kẽ hoàn hảo** (p ≈ 3%) + caveat **run 1 leo dốc sau hold** + caveat khoảng chưa đo (53%, 65,75%) |
| §10 Verdict F2 | GIỮ NGUYÊN | **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — không xét lại |
| §11 Lịch sử phiên bản | CẬP NHẬT | Thêm mục v0.3.1; v0.4 chờ leg kiểm tra xen kẽ của T3 đợt 127 |

## 1. Vì sao PSI, và PSI đo cái gì

- **Nguồn:** `/proc/pressure/cpu`, dòng `some`:
  `some avg10=<x> avg60=<y> avg300=<z> total=<t>`.
  `some` = tỉ lệ thời gian có **ít nhất một task đang chờ CPU**
  (runnable nhưng chưa được chạy). Đây là thước đo **nghẽn
  (stall)**, không phải throughput.
- **Bằng chứng nhạy (T2-120 §1):** 6 hog nice-19 đốt 1,41 CPU
  thật → PSI some avg10 1,1% → **83,5%**, trong khi load1 RƠI
  0,45 → 0,30. PSI thấy nghẽn, load1 thấy nhàn — utime đứng về
  phía PSI.
- **Bằng chứng phân biệt mức (pilot đợt 121 + leg tải đợt 124 +
  leg GAP đợt 125 + leg 45–55% đợt 126):** PSI phân biệt được yên /
  vừa / nặng ở đầu thấp, và **bão hòa trên ~6 hog** (6 vs 12 hog chỉ
  chênh ~4 điểm; leg 124: 6 hog → 77,94%, 8 hog → 84,82% — tăng hog
  không tăng CPU cháy tổng bao nhiêu, tổng chỉ ~1 CPU cả hai leg).

## 2. Trục chính, trục phụ, chỉ báo đi kèm

| Vai trò | Thước đo | Cách đo | Dùng để |
|---|---|---|---|
| **Chính** | **PSI cpu.some avg60** | đọc `/proc/pressure/cpu` mỗi 5 s trong lúc phát; lấy **trung bình các mẫu trong cửa sổ run** + 2 điểm bracket (đầu/cuối run) | Phân loại run vào band tải; tiêu chí VOID |
| Phụ | **threadsR** (số runnable, trường 4 của `/proc/loadavg`) | cùng mẫu 5 s; lấy trung bình trong cửa sổ run | Xác nhận "cùng tải thật" (cùng cấu hình hog → threadsR tương đương); KHÔNG dùng để tách band |
| Chỉ báo đói **≥3 mức** (triệu chứng) | **tickRate** (blendTick, tick/s trong browser) | như các đợt trước, ghi theo quý | **Chỉ báo đói, KHÔNG làm trục** (nó là kết quả, không phải đầu vào). v0.3.1 xác định: tickRate có **ít nhất 3 mức tách rõ** — nhàn ~71,5 / **trung gian ~28–33** (SỬA v0.3: trước đây ghi một điểm ~28,5; leg 126 thêm điểm ~46% với tickRate ~32,0 nên mức trung gian nay là một khoảng, xem §3) / đói ~15–20 (Vừa+Nặng gộp chung một mức "đói") |
| Xác nhận hog chạy thật | **hog burn** (utime hog, CPU) + **cgroup `usage_usec` rate** | utime từng PID hog; `usage_usec` tăng / thời gian | Xác nhận hog có đốt CPU không; nếu burn ≈ 0 trong khi PSI cao → hog đang bị ambient bóp, ghi cờ (xem §4) |

**Không dùng:** load1/load5/load15 (vô hiệu); load1 chỉ ghi vào
log để đối chiếu, không xuất hiện trong bất kỳ tiêu chí hợp lệ,
band, hay kết luận nào.

## 3. Các mức tải (band) — v0.3.1, GIỮ NGUYÊN ngưỡng v0.1/v0.2/v0.3

Ngưỡng v0.1 **ĐỨNG, không dời** — leg tải đợt 124 đã đạt được cả
hai band tải khi browser chạy, bracket ổn định trong band, và năm
cụm đo (thêm GAP đợt 125 + GAP đợt 126) tách nhau rõ.

| Band | PSI some avg60 | Căn cứ đo thật (30 run: Yên 123 + Vừa/Nặng 124 + GAP 125 + GAP 126) |
|---|---|---|
| **Yên** | **< 30%** | avg60 mean từng run 4,38–13,14% (mean các run 7,02%). Cao nhất đo được 13,14% — cách ngưỡng 30 gần 17 điểm. 0/6 chậm |
| **Vừa** | **30–80%** | avg60 mean từng run 65,75–75,64% (mean các run 69,71%). Đạt được với **3 hog**, không phải 2 hog như pilot gợi ý. 6/6 chậm |
| **Nặng** | **> 80%** | avg60 mean từng run 89,23–91,76% (mean các run 90,69%). Đạt được với **8 hog**, không phải 6 hog như pilot gợi ý. 6/6 chậm |
| **GAP (trung gian, dò ranh giới)** | **13–66%** (cửa sổ hợp lệ, không phải band danh nghĩa) | Hai leg trộn: GAP-125 run means 52,75–53,99% (mean 53,19%, 2 hog, **TRỘN 4/6 chậm**); GAP-126 run means 39,47–48,00% (mean 45,98%, runs 2–6: 45,48–48,00%, 2 hog, **TRỘN 3/6 chậm**) — xem §6 |

**Ranh giới chuyển chế độ chậm — v0.3.1: VÙNG TRỘN QUAN SÁT ĐƯỢC
~46–53% (ĐỔI từ dải làm việc ~45–60% của v0.3).** Bằng chứng cứng
(30 run):
- **Nhanh chắc chắn** ở avg60 ≤13,14% (Yên 0/6 chậm; run nhanh
  cao nhất 13,14%).
- **Chậm chắc chắn** ở avg60 ≥65,75% (Vừa 6/6 chậm từ 65,75%;
  Nặng 6/6 chậm).
- **TRỘN ngay quanh ~46%** (leg 126: run means 39,47–48,00%,
  mean 45,98%; T_startup median 1,227 s, chậm 3/6, nhanh 3/6 —
  run 6 nhanh chỉ dưới ngưỡng 1,2 s có 30 ms) **và quanh ~53%**
  (leg GAP đợt 125: run means 52,75–53,99%, T_startup median
  1,2635 s, chậm 4/6, nhanh 2/6 — 2 run nhanh chỉ dưới ngưỡng
  1,2 s có 3–7 ms).
- Theo bảng diễn giải đã đăng ký trước (prereg đợt 126 §6, nhánh
  "Trộn"): ranh giới NẰM NGAY QUANH M% (~46%) → dải chuyển = giao
  của hai vùng trộn (đợt 125 ~53% và đợt 126 ~46%) = **~46–53%**.
- **Cận dưới ~45% ĐÃ ĐƯỢC KIỂM CHỨNG (ĐỔI so với v0.3 — lúc viết
  v0.3 đây là giả thuyết chờ kiểm chứng):** trộn xảy ra ngay tại
  ~46%, ngay trên 45%, nên 45% nằm trong/ngay sát dải chuyển.
  Run chậm thấp nhất đo được là run 1 leg 126 ở **39,47%** (run leo
  dốc sau hold, xem §4.1/§9 — vẫn trên 30% rõ rệt).
- **Cận trên ~53% (ĐỔI từ ~60% của v0.3):** 53% là điểm trộn cao
  nhất quan sát được. **Khoảng (53%, 65,75%) CHƯA CÓ DỮ LIỆU** —
  chưa biết ở đó là trộn tiếp hay chậm chắc chắn; **KHÔNG tuyên bố
  "chậm chắc chắn từ 53%"**. Cận trên 60% của v0.3 bị bỏ vì không
  còn cơ sở: nó chỉ là biên ±7–8 điểm quanh 53%, không neo vào
  điểm đo nào.
- **Ngưỡng Yên <30% ĐỨNG, KHÔNG thu hẹp:** không có run chậm nào
  dưới 30% (run chậm thấp nhất ở ~39,47%).
- **KHÔNG tuyên bố "ngưỡng chuyển = 46%" hay "ngưỡng chuyển =
  53%" hay bất kỳ số đơn nào** — vùng chuyển là một dải, ở cùng
  avg60 ~46% kết quả chia 3–3 và ở ~53% chia 4–2. Xem thêm caveat
  xen kẽ ở §9: tỉ lệ 3/6 KHÔNG được đọc là P(chậm)=0,5 chính xác.

**tickRate theo band (số đo thật, 30 run) — CẬP NHẬT v0.3 §3
(thêm hàng GAP-126, mức trung gian thành khoảng ~28–33):**

| Band | tickRate (tick/s) | T_startup median (s) | chậm (>1,2 s) |
|---|---|---|---|
| Yên (n=6) | 69,5–72,6 (mean 71,50) | 0,337 | 0/6 |
| GAP-126 ~46% (n=6) | **31,32–33,36 (mean 32,01)** | 1,227 | 3/6 |
| GAP-125 ~53% (n=6) | 28,07–29,47 (mean 28,52) | 1,264 | 4/6 |
| Vừa (n=6) | 15,28–20,33 (mean 18,54) | 1,843 | 6/6 |
| Nặng (n=6) | 16,54–17,39 (mean 16,77) | 2,219 | 6/6 |

- **Đường cong tickRate theo tải (5 điểm, n=30):** 71,5 @ ~7% →
  **32,0 @ ~46%** → 28,5 @ ~53% → 18,5 @ ~70% → 16,8 @ ~91%.
  tickRate đơn điệu giảm theo avg60 tăng, dốc nhất ở đoạn Yên→46%
  (71,5→32,0) rồi bẹt dần (32,0→28,5→18,5→16,8).
- **Quy tắc v0.3.1: tickRate là chỉ báo đói ≥3 mức tách rõ — nhàn
  ~71,5 / trung gian ~28–33 / đói ~15–20 — KHÔNG dùng để tách mức
  tải trong một band, KHÔNG dùng làm trục phân loại.** Mức trung
  gian nay là một **khoảng ~28–33** (tải 46–53%), không phải một số
  đơn — hai điểm đo (~46% → 32,01; ~53% → 28,52) tách nhau rõ
  (khoảng không chồng nhau: 31,32–33,36 vs 28,07–29,47) nhưng cùng
  thuộc một mức "trung gian" vì cả hai đều tách xa khỏi nhàn (~40
  điểm) và khỏi đói (~13 điểm khỏi Vừa).
- **Vừa↔Nặng VẪN KHÔNG tách được:** chênh mean chỉ 1,77 tick/s,
  khoảng chồng nhau (Vừa 15,28–20,33 vs Nặng 16,54–17,39) — Vừa và
  Nặng gộp chung một mức "đói". Trong từng band hẹp, tickRate bão
  hòa (trong GAP-126: r(avg60, tickRate) = +0,322 — phẳng, thậm
  chí hơi dương; trong GAP-125: r(avg60, tickRate) = −0,089).
- Gộp 5 cụm (n=30): r(avg60, tickRate) = **−0,944**;
  r(avg60, T_startup) = **+0,860**; r(tickRate, T_startup) =
  **−0,809**; r(avg60, threadsR) = **+0,975** (xem §7).

**Lưu ý bắt buộc:**
- Các ngưỡng là **điểm giữa các cụm quan sát được**, không phải
  ranh giới vật lý. Vùng trộn ~46–53% là vùng trộn **quan sát
  được**, không phải khoảng tin cậy thống kê (xem §9).
- **Không suy ra "mức hog" từ PSI:** 6 hog và 12 hog cho PSI
  gần như nhau; leg 124: 2 hog → 24,30%, 3 hog → 53,85%, 6 hog →
  77,94%, 8 hog → 84,82% — ánh xạ hog→PSI phụ thuộc ambient.
  Muốn tái lập một band thì dial theo PSI đọc được (vòng kín,
  §4), không dial theo số hog.

## 4. Protocol đo (bắt buộc cho mọi run leg B)

1. **Giữ mức tải (hold) trước khi đo:** sau khi đặt/đổi số hog,
   **chờ ≥90 s** rồi mới bắt đầu run. Lý do: avg60 là trung bình
   trượt 60 s — cần 60 s để hội tụ hoàn toàn + 30 s biên. Pilot
   chứng minh độ trễ: 30 s sau khi kill hết hog, avg60 vẫn
   **62–95%** trong khi avg10 đã rơi về ~10–16%.
   **Bài học hold sau warm-up (MỚI, v0.3.1 — từ leg 126 §5):**
   sau warm-up attempt, browser thoát; trong 90 s hold (chỉ hog
   chạy) avg60 tụt về phía mức hog-only — bracket trước run 1 chỉ
   **30,42%**, run 1 mean **39,47%** (thấp hơn hẳn runs 2–6:
   45,48–48,00%, mean 47,28%). Run 1 là run **"leo dốc"** (avg60
   đang leo lại khi browser chạy). **Khuyến nghị cho leg sau:
   hold sau warm-up nên NGẮN HƠN 90 s** (hoặc bracket trước run 1
   nên đọc sau khi browser đã chạy một lúc) để run 1 không bị leo
   dốc. Đây là khuyến nghị ghi nhận từ dữ liệu — **chưa phải thay
   đổi luật hold**: luật ≥90 s ở trên vẫn đứng cho mọi lần đổi hog
   thông thường; việc rút ngắn hold sau warm-up (xuống bao nhiêu
   giây) do leg sau đăng ký trước trong prereg của nó và parent
   duyệt, không tự ý đổi giữa leg. Run leo dốc vẫn HỢP LỆ nếu qua
   mọi kiểm §5 (run 1 leg 126 hợp lệ, nằm trong cửa sổ hợp lệ
   [13, 66]) — chỉ ghi cờ "leo dốc" vào LIMITS, không loại run
   khỏi bộ chỉ vì thấp.
2. **Dial vòng kín theo PSI, không theo số hog:** đặt số hog ban
   đầu (gợi ý: Yên = 0 hog; Vừa = 3 hog; Nặng = 8 hog — theo leg
   124, không theo pilot), chờ 90 s, đọc avg60; nếu ngoài band mục
   tiêu thì tăng/giảm hog, chờ tiếp 90 s, đọc lại. Ghi lại số hog
   cuối cùng + mọi lần điều chỉnh. Lý do: hog burn đo được chỉ
   0,14–0,33 CPU/hog và không đơn điệu theo số hog — ngân sách
   host chia sẻ với sibling mới là yếu tố giới hạn, số hog không
   điều khiển được CPU cháy.
3. **Lấy mẫu trong run:** mỗi 5 s ghi một mẫu: `some
   avg10/avg60/total`, `full avg10`, loadavg đầy đủ (threadsR),
   hogsAlive, hog utime. Mẫu thiếu >10% → VOID (mục 5d).
4. **Bracket:** đọc avg60 **ngay trước khi run bắt đầu** và
   **ngay sau khi run kết thúc**; cả hai phải nằm trong band mục
   tiêu (xem luật VOID §5). Bracket thay thế bracket load1 cũ
   (load1 <3 trước/sau) — bracket load1 **không còn hiệu lực**.
5. **Ghi chép mỗi run:** boot_id, cây (md5 preview.tsx/media.ts),
   cấu hình queue2, band mục tiêu, số hog, thời gian hold (s),
   avg60 đầu/cuối + trung bình trong run, threadsR trung bình,
   tickRate, hog burn, PSI full max, toàn bộ chuỗi mẫu PSI
   (lưu trong results JSON của run).
6. **Leg trung gian / leg dò ranh giới (v0.2 §4.6, giữ nguyên):**
   khi mục tiêu là dò ranh giới chuyển chế độ (không phải validate
   một band), prereg phải phân biệt **cửa sổ mục tiêu** (target
   window) với **cửa sổ hợp lệ** (validity window = khoảng trống
   chưa đo). Run hợp lệ khi đo được nằm trong cửa sổ hợp lệ + qua
   mọi kiểm §5; điểm dữ liệu là avg60 đo được của từng run, không
   phải band danh nghĩa. Số hog tối đa và cách dial (kể cả trường
   hợp dial không chạm cửa sổ mục tiêu) phải đăng ký trước trong
   prereg — không tự ý thêm hog ngoài đăng ký.
7. **Dial bằng browser ẤM — PROTOCOL CHUẨN ĐÃ ĐƯỢC CHỨNG MINH
   (CẬP NHẬT v0.3.1; v0.3 ghi "MỚI, bắt buộc", nay có bằng chứng
   đạt tiêu chí).** Bài học đợt 125 (§5 LIMITS): dial lạnh (chỉ
   hog, chưa có browser) đọc 25,98% nhưng run means ~53% — tải của
   chính browser/vite lúc chạy cộng thêm **~27 điểm avg60**. Dial
   không có browser **đánh giá thấp** avg60 lúc chạy ~27 điểm.
   **Bằng chứng chứng minh (leg 126 §5):** dial ấm TARGET-HIT ngay
   warm-up #1 (W = 45,74% với 2 hog, trong cửa sổ mục tiêu
   [45, 55]); sai số dial ấm |W − mean run means| = **|45,74 −
   45,98| = 0,24 điểm** (tiêu chí prereg ≤5 — ĐẠT, vượt xa; tốt hơn
   dial lạnh ~100 lần). Kiểm chéo loại run 1 leo dốc: sai số trên
   runs 2–6 = |45,74 − 47,28| = **1,54 điểm — vẫn ≤5**. Cả hai cách
   tính đều ĐẠT. Từ v0.3.1, dial bằng browser ấm là **protocol
   chuẩn** cho mọi leg dò ranh giới (không còn là thử nghiệm):
   - (a) Warm-up attempt: chạy runner MỘT lần (cùng flow đo, OUT
     trỏ tới file throwaway riêng, KHÔNG phải OUT thật, KHÔNG tính
     vào bộ run) với hogs đã chạy — mức tải thật lúc browser chạy
     (hogs + browser/vite) được đọc từ avg60 mean của warm-up run
     (= W).
   - (b) Quyết định số hog theo W (đăng ký trước trong prereg từng
     leg: W trong cửa sổ mục tiêu → giữ hog; W trên đích → giảm
     hog + warm-up lại tối đa 1 lần nữa; W dưới đích → chấp nhận
     nếu trong cửa sổ hợp lệ, KHÔNG thêm hog ngoài đăng ký).
   - (c) Kiểm phương pháp (bắt buộc trong LIMITS): so sánh W với
     mean của các run means; sai số dial ấm = |W − mean run means|,
     tiêu chí thành công **≤ 5 điểm** (so với sai số dial lạnh
     ~27 điểm đợt 125). Ghi rõ dù đạt hay không — nếu sai số > 5
     điểm thì phương pháp dial ấm CHƯA đủ tốt, ghi nợ mở, không
     giấu. Ghi thêm kiểm chéo loại run leo dốc (nếu có) như leg 126
     đã làm.
   - (d) Cửa sổ hợp lệ (GAP) KHÔNG thu hẹp theo đích dial — bracket
     trước run đo lúc browser chưa chạy nên luôn thấp hơn run means
     ~25–30 điểm; thu hẹp cửa sổ hợp lệ sẽ kẹt leg ở cổng bracket
     dù run sẽ rơi đúng đích. Việc thu hẹp dải là KẾT LUẬN sau leg,
     không phải tiêu chí VOID trong leg.

## 5. Luật VOID / hợp lệ cho run leg B (theo trục PSI — giữ nguyên v0.2/v0.3)

Run là **VOID** (không tính vào bar) nếu bất kỳ điều nào sau đây
xảy ra; ngược lại là **valid**:

- (a) avg60 bracket đầu HOẶC cuối **lệch khỏi band mục tiêu
  quá 10 điểm** (vd: band Yên mà avg60 đầu = 42% → VOID; band
  Vừa mà bracket <20% hoặc ≥90% → VOID; band Nặng mà bracket
  <70% → VOID — Nặng không có chặn trên).
- (b) **Trung bình avg60 trong cửa sổ run ngoài band** mục tiêu.
- (c) **hogsAlive < số hog mục tiêu** trong bất kỳ mẫu nào
  trong run (hog chết giữa chừng).
- (d) **Thiếu >10% mẫu PSI** trong cửa sổ run.
- (e) **PSI full avg10 >5%** trong run (máy đơ hoàn toàn —
  bất thường, điều tra riêng, không tính vào bar).
- (f) **Reboot / đổi boot giữa run**, hoặc cây đổi giữa run
  (luật cũ vẫn đứng).
- (g) Các tiêu chí hợp lệ cũ không đổi: shim readback đúng,
  seekedOk, finalCt, finalSrc blob, errEvents = 0.

**Luật VOID cho leg dò ranh giới (band GAP):** thay band mục tiêu
bằng cửa sổ hợp lệ = khoảng trống chưa đo (hiện tại 13–66%):
(a) bracket đầu/cuối <3% hoặc ≥76% → VOID; (b) mean trong run
<13% hoặc >66% → VOID; (c)–(g) như trên. Cửa sổ mục tiêu (vd
45–55%) KHÔNG phải tiêu chí VOID — chỉ là đích dial; dial
không chạm đích thì ghi TARGET-MISS, run vẫn hợp lệ nếu nằm
trong cửa sổ hợp lệ.

Run VOID vẫn ghi đầy đủ số liệu + lý do VOID vào LIMITS (không
giấu VOID). Không chạy bù quá ngân sách attempt đã đăng ký trong
prereg.

## 6. Trả lời câu hỏi ranh giới chuyển — v0.3.1 điền vùng trộn ~46–53%

- **Ranh giới chuyển chế độ chậm = VÙNG TRỘN QUAN SÁT ĐƯỢC ~46–53%
  (không phải một số).** Bằng chứng: Yên 0/6 chậm tới 13,14%; Vừa
  6/6 chậm từ 65,75%; leg GAP-126 TRỘN 3 chậm/3 nhanh tại run means
  39,47–48,00% (mean 45,98%, T_startup median 1,227 s) và leg
  GAP-125 TRỘN 4 chậm/2 nhanh tại run means 52,75–53,99%
  (T_startup median 1,2635 s).
- **Cận dưới ~45% ĐÃ ĐƯỢC KIỂM CHỨNG** (leg 126, nhánh "Trộn" của
  bảng diễn giải đăng ký trước): trộn ngay tại ~46%, ngay trên 45%.
- **Cận trên ~53%** là điểm trộn cao nhất quan sát được; khoảng
  (53%, 65,75%) chưa có dữ liệu — chưa biết trộn hay chậm chắc chắn.
- **Ngưỡng Yên <30% ĐỨNG** (không có run chậm nào dưới 30%).
- **Vùng chuyển là dải ngẫu nhiên, không phải đường sắc — bằng
  chứng trong-leg:** run 3 leg 126 CHẬM (1,403 s) ở 47,74% trong khi
  run 4 NHANH (0,980 s) ở 48,00% — tải gần như bằng nhau, kết quả
  ngược nhau. Trong-leg r(avg60, T_startup) = **−0,151** (phẳng,
  thậm chí hơi âm) — trong dải chuyển, tải KHÔNG dự báo được
  nhanh/chậm từng run. Chỉ có tỉ lệ chậm tăng theo tải giữa các
  cụm (0/6 @ ~7% → 3/6 @ ~46% → 4/6 @ ~53% → 6/6 @ ~70%+).
- **tickRate ≥3 mức (mức trung gian nay là khoảng ~28–33):** xem
  bảng §3 — hai điểm trung gian 32,01 @ ~46% và 28,52 @ ~53% tách
  rõ khỏi nhàn ~71,5 và đói ~15–20; Vừa↔Nặng vẫn không tách (gộp
  một mức "đói").
- **Pha (b) T_seek MIỄN NHIỄM với tải (giữ ở n=30):** T_seek max
  0,001 s trên cả 30 run (Yên + GAP-126 + GAP-125 + Vừa + Nặng) —
  seek tức thì một khi metadata đã load; toàn bộ chậm nằm ở pha
  startup/metadata.

**Số liệu phụ theo band (30 run):** threadsR mean Yên 2,0 → GAP-126
7,4 → GAP-125 8,0 → Vừa 9,3 → Nặng 13,8 (r(avg60, threadsR) =
+0,975 — trục phụ đứng); totalFrames Yên 384 → GAP-126 289–310 →
GAP-125 290–324 → Vừa 161–279 → Nặng 163–213; dropped frames 0 →
GAP-126 0–2 → GAP-125 0–1 → Vừa 2–7 → Nặng 6–11; seekImmMs Yên
271–522 ms → GAP-126 776–1402 ms → GAP-125 1092–1318 ms → Vừa
1621–2810 ms → Nặng 1590–3039 ms — mọi chỉ báo phụ đều đơn điệu
theo avg60 và đặt GAP-126 đúng vị trí trung gian (giữa Yên và
GAP-125). Trong leg 126, run chậm có seekImmMs cao hơn rõ (run
1/3/5: 1203/1291/1402 ms, mean 1299) so với run nhanh (run 2/4/6:
776/998/1090 ms, mean 955) — seekImmMs đi cùng chiều với T_startup
trong leg (cùng pha startup/metadata, không phải chỉ báo độc lập).

## 7. Tương quan gộp (n=30) — KHÔNG kết luận nhân quả

| Cặp | r (gộp 5 cụm, n=30) | v0.3 (n=24) | Đọc |
|---|---|---|---|
| avg60 ↔ T_startup | **+0,860** | +0,864 | Tương quan mạnh giữa band, nhưng trong-band yếu/hỗn hợp (§6) |
| avg60 ↔ tickRate | **−0,944** | −0,959 | tickRate là triệu chứng đói theo band (§3) |
| tickRate ↔ T_startup | **−0,809** | −0,831 | Cùng một bước nhảy giữa band, không phải cơ chế |
| avg60 ↔ threadsR | **+0,975** | +0,979 | threadsR đơn điệu theo band — trục phụ đứng |

**KHÔNG kết luận nhân quả:** 1 cây (baseline), 5 boot (Yên trên
boot #67?, Vừa/Nặng trên boot #68?, GAP-125 trên boot #70, GAP-126
trên boot #71? — số boot tạm, chờ T6 recount), sibling đang chạy,
n=6/cụm. So sánh giữa các cụm vẫn có nhiễu boot; nhưng bước nhảy
0,337 → 1,227 → 1,264 → 1,843 s và tickRate 71,5 → 32,0 → 28,5 →
18,5 lớn hơn mọi nhiễu boot từng thấy giữa các leg Yên (median Yên
các đợt 0,3–0,5 s). Trong từng cụm hẹp, mọi tương quan đều phẳng
(GAP-126: r(avg60, T_startup) = −0,151; r(avg60, tickRate) = +0,322;
GAP-125: r≈−0,09/+0,08) — chỉ có bước nhảy GIỮA các cụm là rõ.

## 8. load1 vẫn vô hiệu (bằng chứng mới từ leg 126)

Run 4 GAP đợt 125 load1 0,32→3,98; run 5 GAP đợt 125 3,98→5,10 ở
cùng PSI ~53%; run 11 Nặng đợt 124 load1 10,18/12,17 vs run 7 Nặng
0,96/0,56 ở cùng PSI ~90%. **Mới (leg 126):** run 5 load1
5,21→5,58 trong khi run 2 load1 0,88→0,42 ở cùng PSI ~47% (bracket
load1 toàn leg 0,38–5,58, không mẫu hình). load1 không dùng trong
bất kỳ tiêu chí nào, đúng DEF v0.1 — v0.3.1 giữ nguyên.

## 9. Caveat của định nghĩa này (đọc trước khi dùng)

- **PSI đo stall, không đo throughput.** Một run có thể có PSI
  95% trong khi hog chỉ đốt 0,3 CPU (ngân sách host cạn) — đó
  đúng là điều cần đo cho main thread browser (nó chờ CPU),
  nhưng đừng đọc PSI như "máy đang chạy hết công suất".
- **Ngân sách host chưa biết.** Ước tính ~1,5 CPU chia sẻ với
  cửa sổ ~8,5 phút (T2-120 §5, chưa chứng minh). PSI có thể
  dao động theo pha sóng ngân sách này — pilot chỉ dài 6,5
  phút (< 1 chu kỳ sóng) nên **chưa đo được ảnh hưởng của sóng
  lên PSI**.
- **n nhỏ, 5 boot:** 30 run gộp nhưng chỉ 1 cây và 5 boot; Yên đo
  trên boot khác Vừa/Nặng, GAP-125 và GAP-126 đo trên hai boot
  khác nhau nữa — so sánh giữa cụm có nhiễu boot.
- **threadsR nhiễu ở mức hog nhỏ:** pilot: L6 threadsR 20,8 vs
  L12 18,4 (đảo ngược) — threadsR chỉ dùng để xác nhận, không
  dùng để tách mức.
- **avg60 trễ ~60 s** sau mọi thay đổi tải (xem §4.1 + RECOV
  pilot). Đừng bao giờ đọc avg60 ngay sau khi đổi hog.
- **Vùng trộn ~46–53% là vùng trộn QUAN SÁT ĐƯỢC, không phải
  khoảng tin cậy thống kê.** Hai leg trộn mỗi leg chỉ n=6; khoảng
  (53%, 65,75%) chưa đo; khoảng (13,14%, ~46%) chỉ có một run leo
  dốc 39,47% (chậm) và chưa có run nào khác. Mọi kết luận "chế độ
  chậm bắt đầu ở avg60 X%" với X là một số đơn đều là suy đoán —
  cấm tuyên bố.
- **Caveat xen kẽ hoàn hảo (MỚI, v0.3.1 — bắt buộc, không giấu):**
  leg 126 chậm/nhanh xen kẽ đúng từng run (run 1 chậm, 2 nhanh,
  3 chậm, 4 nhanh, 5 chậm, 6 nhanh). Xác suất một dãy 6 run xen kẽ
  hoàn hảo do ngẫu nhiên (2/64) ≈ **3%** — thấp nhưng không phải
  không thể. Không loại trừ được yếu tố nhiễu xen kẽ theo run (vd:
  chu kỳ sibling, trạng thái cache vite/browser xen kẽ) — **tỉ lệ
  3/6 KHÔNG được đọc là P(chậm)=0,5 chính xác**, và dải ~46–53%
  là "vùng trộn quan sát được", không phải xác suất chậm tại một
  điểm tải. Ngược lại, tải KHÔNG xen kẽ theo kết quả (run 3 chậm
  47,74% vs run 4 nhanh 48,00%) nên kết luận "vùng chuyển là dải
  ngẫu nhiên" vẫn đứng. **Chờ leg kiểm tra xen kẽ đợt 127 (T3)
  xác nhận:** nếu xen kẽ lặp lại hoàn hảo lần nữa thì điều tra
  yếu tố xen kẽ; nếu không lặp lại thì caveat này hạ xuống mức
  ghi chú. DEF v0.3.1 KHÔNG điền trước kết quả leg đó.
- **Caveat run 1 leo dốc sau hold (MỚI, v0.3.1):** xem §4.1 — hold
  90 s sau warm-up làm avg60 tụt về mức hog-only, run 1 mean
  39,47% thấp hơn cụm runs 2–6 (45,48–48,00%). Mean 6 run
  45,98% vì vậy thấp hơn "mức ổn định" 47,28% (runs 2–6) khoảng
  1,3 điểm. Mọi số gộp dùng mean 45,98% (đầy đủ 6 run, không loại
  run) phải đọc kèm caveat này; sai số dial ấm tính cả hai cách
  (0,24 và 1,54 điểm) đều ≤5 nên kết luận "dial ấm đã chứng minh"
  không phụ thuộc cách tính.
- **Dial lạnh đánh giá thấp avg60 lúc chạy ~27 điểm** (bài học
  đợt 125 §5) — leg dò ranh giới phải dial bằng browser ấm (§4.7).
  Số liệu dial lạnh cũ không dùng để đặt đích run nữa.
- Định nghĩa này **không thay đổi** định nghĩa bar F2
  (T_startup/T_seek + ngưỡng, T3-120 §1) — chỉ thay **trục
  tải** mà leg B chạy trên đó.

## 10. Verdict F2 — v0.3.1 KHÔNG xét lại

**Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (quyết parent cửa (a) đợt
123 §12.1, nhắc lại trong quyết đợt 124 §12.2a, đợt 125 §12 và
đợt 126 §12). Leg dò ~45–55% đợt 126 chỉ là dữ liệu hiệu chỉnh
DEF — nó không xét bar/verdict, không gộp số với bộ verdict. DEF
v0.3.1 này cũng vậy: nó là định nghĩa trục tải đã hiệu chỉnh, không
phải một phán quyết bar F2 mới. Lật verdict cần ≥6 run nhanh trên
cùng một boot theo luật T3-120 §6 nợ #1 (chú ý: boot #70 đợt 125
đã bị reboot #71 thay thế lúc 23:25:41Z 16/11 — bộ run nhanh cũ
KHÔNG dùng được nữa; leg 126 chạy trên boot #71, cây H3f, cũng
không phải bộ verdict).

## 11. Lịch sử phiên bản

- **v0.1** (16/11/2026, T2 đợt 121 — file
  `docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`, giữ nguyên): ngưỡng
  tạm thời rút từ pilot n=1 + dữ liệu đợt 120; bắt buộc hiệu
  chỉnh sau leg tải.
- **v0.2** (17/11/2026, T4 đợt 125 — file
  `docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md`, giữ nguyên):
  ngưỡng 3 band GIỮ NGUYÊN, có cơ sở đo thật 18 run; tickRate hạ
  xuống chỉ báo đói 2 mức; ranh giới chuyển chế độ chậm ghi rõ
  CHƯA XÁC ĐỊNH (khoảng trống 13–66%); pha (b) T_seek miễn nhiễm
  với tải; tương quan gộp r(avg60,T_startup)=+0,87,
  r(avg60,tickRate)=−0,97 (n=18, không kết luận nhân quả); verdict
  đợt 120 vẫn đứng.
- **v0.3** (17/11/2026, T4 đợt 126 — file
  `docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md`, giữ nguyên):
  ranh giới chuyển thành **DẢI ~45–60%** (TRỘN 4/2 tại ~53%, chậm
  chắc chắn từ 65,75%, nhanh chắc chắn tới 13,14%; cận dưới ~45%
  là giả thuyết chờ leg 126 kiểm chứng); tickRate sửa thành **chỉ
  báo đói ≥3 mức** (nhàn ~71,5 / trung gian ~28,5 / đói ~15–20;
  Vừa↔Nặng vẫn không tách); dial bằng **browser ấm** (§4.7, bài
  học +27 điểm đợt 125); tương quan gộp n=24
  (r(avg60,tickRate)=−0,959, r(avg60,T_startup)=+0,864); verdict
  đợt 120 vẫn đứng.
- **v0.3.1** (17/11/2026, T2 đợt 127 — file này): ranh giới chuyển
  thành **VÙNG TRỘN QUAN SÁT ĐƯỢC ~46–53%** (cận dưới ~45% ĐÃ
  KIỂM CHỨNG bằng TRỘN 3/3 tại ~46%; cận trên 60% → ~53%, điểm
  trộn cao nhất quan sát được; khoảng (53%, 65,75%) chưa có dữ
  liệu); tickRate mức trung gian mở rộng thành **khoảng ~28–33**
  (32,01 @ ~46% + 28,52 @ ~53%; đường cong 5 điểm n=30);
  **dial bằng browser ấm là protocol CHUẨN ĐÃ ĐƯỢC CHỨNG MINH**
  (sai số 0,24 điểm, tiêu chí ≤5); bài học **hold sau warm-up**
  (run 1 leo dốc 39,47%) + khuyến nghị hold ngắn hơn cho leg sau;
  caveat **xen kẽ hoàn hảo** (p ≈ 3%, tỉ lệ 3/6 không đọc là
  P(chậm)=0,5 chính xác, chờ leg kiểm tra xen kẽ T3 đợt 127);
  tương quan gộp n=30; verdict đợt 120 vẫn đứng.
- **v0.4 (dự kiến):** sau leg kiểm tra xen kẽ của T3 đợt 127 —
  nếu xen kẽ không lặp lại, caveat xen kẽ hạ xuống ghi chú và dải
  ~46–53% được giữ như vùng trộn đã xác nhận; nếu xen kẽ lặp lại
  hoàn hảo lần nữa, điều tra yếu tố xen kẽ trước khi chốt dải.
  Không leg dò ranh giới thêm sau leg T3 đợt 127 trừ khi cần
  (quyết parent đợt 126 §12(b)).
