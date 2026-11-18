# Định nghĩa trục tải PSI cho bar F2 leg B — v0.4 (CHUẨN, hiệu chỉnh bằng leg xen kẽ đợt 127)

**Ngày:** 17/11/2026. **Đợt:** 128, luồng T1. **Trạng thái:** ĐỊNH NGHĨA
CHUẨN v0.4 — parent đã **PHÊ DUYỆT** viết theo quyết đợt 127 §12(b)
(dải chuyển mở rộng ~31–53% + loại trừ caveat xen kẽ + hold 30 s +
caveat dial ấm ambient-thấp; không leg dò ranh giới thêm).
**File này THAY THẾ v0.3.1 làm chuẩn hiện hành.** File v0.3.1
(`docs/PHASE9_ROUND127_T2_PSIAXIS_DEF_V031.md`), v0.3
(`docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md`), v0.2
(`docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md`) và v0.1
(`docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`) được **giữ nguyên vẹn
làm lịch sử** — không sửa, không xóa.
**Phạm vi:** chỉ dùng cho bar F2 leg B (Q8SEEKFAST) và các đo tải
liên quan trong cell này (VM Secure, 4 vCPU nhìn thấy, ngân sách
chia sẻ ~1,5 CPU). **KHÔNG dùng load1 làm biến tải trong bất kỳ
kết luận nào** — load1 chỉ ghi để đối chiếu (đã chứng minh vô hiệu,
xem §8). 19,63 vẫn chỉ là NHÃN LỊCH SỬ của lượt s77c.

**Cơ sở dữ liệu của v0.4:** 30 run của v0.3.1 (Yên đợt 123 + Vừa/Nặng
đợt 124 + GAP đợt 125 + GAP đợt 126) + leg kiểm tra xen kẽ đợt 127
(12/12 VALID: 6 dial + 6 Yên, boot #73, cây baseline) = **42 run
đo** (tương quan gộp tính trên **n=36**: 30 run cũ + 6 run dial
đợt 127; 6 run Yên đợt 127 dùng làm cụm Yên trong-boot, xem §3/§7).
Chi tiết leg 127:
`docs/PHASE9_ROUND127_T3_INTERLEAVE_LIMITS.md` (§0–§12); prereg +
bảng diễn giải đã đăng ký trước:
`hidden_files/round127-t3/prereg-interleave.md` §6 (thứ tự xen kẽ
seed 1273). Leg 127 trả đúng nhánh "XEN KẼ KHÔNG LẶP LẠI" của bảng
diễn giải đó (dãy con dial S-F-F-S-F-S) → caveat xen kẽ của v0.3.1
được loại trừ; đồng thời nhóm dial TRỘN ở 30,83–41,48% → dải chuyển
mở rộng xuống ~31%.

## 0. Thay đổi so với v0.3.1 (đọc trước — từng mục)

| Mục | Trạng thái v0.4 | Thay đổi |
|---|---|---|
| §1 Vì sao PSI | GIỮ NGUYÊN | Không đổi |
| §2 Trục chính/phụ/chỉ báo | CẬP NHẬT | tickRate mức trung gian giữ khoảng ~28–33, thêm điểm ~36% (mean 32,44) tái hiện lần thứ ba |
| §3 Band + dải chuyển + tickRate | **ĐỔI** | Dải chuyển: vùng trộn quan sát được **~46–53% → ~31–53%** (mở rộng xuống ~31%); thêm hàng GAP-127 ~36% vào bảng tickRate + đường cong 6 điểm (n=36); ngưỡng Yên <30% ĐỨNG kèm lưu ý biên mong manh 0,83 điểm |
| §4 Protocol đo | **ĐỔI** | §4.1: **hold sau warm-up nay là 30 s (protocol CHUẨN ĐÃ ĐƯỢC CHỨNG MINH)** — thay khuyến nghị "hold ngắn hơn" của v0.3.1; luật ≥90 s khi đổi hog vẫn đứng; §4.7: thêm **caveat dial ấm ambient-thấp** (sai số 3,63 điểm trên mean cả leg — ĐẠT; 7,92 điểm trên run ổn định — KHÔNG ĐẠT) + ghi rõ số hog không cố định mức tải giữa các boot |
| §5 Luật VOID | GIỮ NGUYÊN | Không đổi |
| §6 Trả lời câu hỏi ranh giới | **ĐỔI** | Ranh giới = **vùng trộn quan sát được ~31–53%**; ghi rõ khoảng chưa đo (53%, 65,75%) và bằng chứng dải là ngẫu nhiên ở cả ~31% và ~41% |
| §7 Tương quan gộp | CẬP NHẬT | n=30 → **n=36** (số r cập nhật, xem bảng); thêm caveat hiệu ứng cụm trong nhóm dial |
| §8 load1 vô hiệu | CẬP NHẬT | Thêm bằng chứng mới từ leg 127 (run 1 load1 4,22→4,80 vs run 9 0,35→1,00 cùng PSI ~31–41%) |
| §9 Caveat | **ĐỔI** | Caveat **xen kẽ hoàn hảo HẠ XUỐNG ghi chú** (đã loại trừ: S-F-F-S-F-S); thêm caveat **dial ấm ambient-thấp** + caveat **biên ngưỡng Yên 0,83 điểm**; caveat run 1 leo dốc CẬP NHẬT (hold 30 s đã chứng minh khắc phục) |
| §10 Verdict F2 | GIỮ NGUYÊN | **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — không xét lại |
| §11 Lịch sử phiên bản | CẬP NHẬT | Thêm mục v0.4; v0.5 chỉ viết khi có dữ liệu mới (không leg dò ranh giới thêm theo quyết parent) |

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
  leg GAP đợt 125 + leg 45–55% đợt 126 + leg xen kẽ đợt 127):** PSI
  phân biệt được yên / vừa / nặng ở đầu thấp, và **bão hòa trên
  ~6 hog** (6 vs 12 hog chỉ chênh ~4 điểm; leg 124: 6 hog →
  77,94%, 8 hog → 84,82% — tăng hog không tăng CPU cháy tổng bao
  nhiêu, tổng chỉ ~1 CPU cả hai leg).

## 2. Trục chính, trục phụ, chỉ báo đi kèm

| Vai trò | Thước đo | Cách đo | Dùng để |
|---|---|---|---|
| **Chính** | **PSI cpu.some avg60** | đọc `/proc/pressure/cpu` mỗi 5 s trong lúc phát; lấy **trung bình các mẫu trong cửa sổ run** + 2 điểm bracket (đầu/cuối run) | Phân loại run vào band tải; tiêu chí VOID |
| Phụ | **threadsR** (số runnable, trường 4 của `/proc/loadavg`) | cùng mẫu 5 s; lấy trung bình trong cửa sổ run | Xác nhận "cùng tải thật" (cùng cấu hình hog → threadsR tương đương); KHÔNG dùng để tách band |
| Chỉ báo đói **≥3 mức** (triệu chứng) | **tickRate** (blendTick, tick/s trong browser) | như các đợt trước, ghi theo quý | **Chỉ báo đói, KHÔNG làm trục** (nó là kết quả, không phải đầu vào). v0.4 xác định: tickRate có **ít nhất 3 mức tách rõ** — nhàn ~71,5 / **trung gian ~28–33** (tái hiện lần thứ ba bằng leg 127: mean 32,44 @ ~36%, xem §3) / đói ~15–20 (Vừa+Nặng gộp chung một mức "đói") |
| Xác nhận hog chạy thật | **hog burn** (utime hog, CPU) + **cgroup `usage_usec` rate** | utime từng PID hog; `usage_usec` tăng / thời gian | Xác nhận hog có đốt CPU không; nếu burn ≈ 0 trong khi PSI cao → hog đang bị ambient bóp, ghi cờ (xem §4) |

**Không dùng:** load1/load5/load15 (vô hiệu); load1 chỉ ghi vào
log để đối chiếu, không xuất hiện trong bất kỳ tiêu chí hợp lệ,
band, hay kết luận nào.

## 3. Các mức tải (band) — v0.4, GIỮ NGUYÊN ngưỡng v0.1/v0.2/v0.3/v0.3.1

Ngưỡng v0.1 **ĐỨNG, không dời** — leg tải đợt 124 đã đạt được cả
hai band tải khi browser chạy, bracket ổn định trong band, và sáu
cụm đo (thêm GAP đợt 125 + GAP đợt 126 + GAP đợt 127) tách nhau rõ.

| Band | PSI some avg60 | Căn cứ đo thật (42 run: Yên 123 + Vừa/Nặng 124 + GAP 125 + GAP 126 + leg xen kẽ 127) |
|---|---|---|
| **Yên** | **< 30%** | avg60 mean từng run 4,09–14,13% (Yên 123: 4,38–13,14%; Yên-127: 4,09–14,13%, mean 10,27%). Cao nhất đo được 14,13% — cách ngưỡng 30 gần 16 điểm. 0/12 chậm (6/6 đợt 123 + 6/6 đợt 127) |
| **Vừa** | **30–80%** | avg60 mean từng run 65,75–75,64% (mean các run 69,71%). Đạt được với **3 hog**, không phải 2 hog như pilot gợi ý. 6/6 chậm |
| **Nặng** | **> 80%** | avg60 mean từng run 89,23–91,76% (mean các run 90,69%). Đạt được với **8 hog**, không phải 6 hog như pilot gợi ý. 6/6 chậm |
| **GAP (trung gian, dò ranh giới)** | **13–66%** (cửa sổ hợp lệ, không phải band danh nghĩa) | Ba leg trộn: GAP-127 run means 30,83–41,48% (mean 35,99%, 2 hog, **TRỘN 3/6 chậm**); GAP-126 run means 39,47–48,00% (mean 45,98%, 2 hog, **TRỘN 3/6 chậm**); GAP-125 run means 52,75–53,99% (mean 53,19%, 2 hog, **TRỘN 4/6 chậm**) — xem §6 |

**Ranh giới chuyển chế độ chậm — v0.4: VÙNG TRỘN QUAN SÁT ĐƯỢC
~31–53% (ĐỔI từ ~46–53% của v0.3.1 — mở rộng xuống ~31%).** Bằng
chứng cứng (42 run):
- **Nhanh chắc chắn** ở avg60 ≤14,13% (Yên 0/12 chậm; run nhanh
  cao nhất 14,13%).
- **Chậm chắc chắn** ở avg60 ≥65,75% (Vừa 6/6 chậm từ 65,75%;
  Nặng 6/6 chậm).
- **TRỘN ngay quanh ~31%** (leg 127: run 6 CHẬM 1,702 s @ 31,52%
  vs run 4 NHANH 1,195 s @ 31,67% — tải gần như bằng nhau, kết quả
  ngược nhau; run 1 CHẬM 1,322 s @ 41,40% vs run 2 NHANH 1,082 s
  @ 41,48% — lặp lại đúng mẫu hình "dải ngẫu nhiên" của đợt 126)
  **và quanh ~46%** (leg 126: TRỘN 3/6, run means 39,47–48,00%)
  **và quanh ~53%** (leg GAP đợt 125: TRỘN 4/6, run means
  52,75–53,99%).
- Theo bảng diễn giải đã đăng ký trước (prereg đợt 127 §6, nhánh
  "Trộn"): ranh giới NẰM NGAY QUANH M% → dải chuyển = **hợp của
  các vùng trộn đã quan sát** (~31% + ~46% + ~53%) = **~31–53%**.
- **Cận dưới ~31% (ĐỔI từ ~45% của v0.3.1):** trộn đã quan sát
  được ngay tại ~31% (run chậm thấp nhất đo được là run 9 leg 127
  ở **30,83%** — ngay trên ngưỡng Yên 30%, xem lưu ý biên dưới
  đây). Dải làm việc ~45–60% của v0.3 nay đã bị thu hẹp cả hai
  đầu: cận trên 60% → ~53%, cận dưới ~45% → ~31%.
- **Cận trên ~53% (GIỮ từ v0.3.1):** 53% là điểm trộn cao nhất
  quan sát được. **Khoảng (53%, 65,75%) CHƯA CÓ DỮ LIỆU** — chưa
  biết ở đó là trộn tiếp hay chậm chắc chắn; **KHÔNG tuyên bố
  "chậm chắc chắn từ 53%"**. Không suy đoán, không nội suy.
- **Ngưỡng Yên <30% ĐỨNG, KHÔNG thu hẹp — NHƯNG biên mong manh:**
  không có run chậm nào dưới 30% (run chậm thấp nhất ở 30,83%,
  run 9 leg 127 — chỉ cách ngưỡng **0,83 điểm**). Nếu leg sau
  quan sát được run chậm ở ~28–30% thì ngưỡng Yên phải xét lại
  (ghi nợ mở, xem §9). Run nhanh cao nhất vẫn 14,13%, cách
  ngưỡng xa — ngưỡng Yên đứng vì phía nhanh, không vì phía chậm.
- **KHÔNG tuyên bố "ngưỡng chuyển = 31%" hay "ngưỡng chuyển =
  53%" hay bất kỳ số đơn nào** — vùng chuyển là một dải, ở cùng
  avg60 ~31% kết quả chia 3–3 (nhóm dial leg 127) và ở ~53% chia
  4–2. Xem thêm §9: tỉ lệ 3/6 được đọc như ước lượng thô của
  P(chậm) tại mức tải đo được (caveat mẫu nhỏ n=6 + hai cụm tải
  khác nhau trong nhóm dial leg 127), không phải xác suất chính xác.

**tickRate theo band (số đo thật, 42 run) — CẬP NHẬT v0.3.1 §3
(thêm hàng GAP-127, mức trung gian tái hiện lần thứ ba):**

| Band | tickRate (tick/s) | T_startup median (s) | chậm (>1,2 s) |
|---|---|---|---|
| Yên-127 (n=6) | 70,54–72,80 (mean 71,57) | 0,672 | 0/6 |
| Yên-123 (n=6) | 69,5–72,6 (mean 71,50) | 0,337 | 0/6 |
| GAP-127 ~36% (n=6) | **31,68–33,01 (mean 32,44)** | 1,259 | 3/6 |
| GAP-126 ~46% (n=6) | 31,32–33,36 (mean 32,01) | 1,227 | 3/6 |
| GAP-125 ~53% (n=6) | 28,07–29,47 (mean 28,52) | 1,264 | 4/6 |
| Vừa (n=6) | 15,28–20,33 (mean 18,54) | 1,843 | 6/6 |
| Nặng (n=6) | 16,54–17,39 (mean 16,77) | 2,219 | 6/6 |

- **Đường cong tickRate theo tải (6 điểm, n=36):** 71,6 @ ~10%
  (Yên-127, trong-boot với GAP-127) → **32,4 @ ~36%** → 32,0 @
  ~46% → 28,5 @ ~53% → 18,5 @ ~70% → 16,8 @ ~91%. (Yên đợt 123:
  71,50 @ ~7% — gần như trùng khớp, ghi để đối chiếu.)
  tickRate đơn điệu giảm theo avg60 tăng, dốc nhất ở đoạn Yên→36%
  (71,6→32,4) rồi bẹt dần (32,4→32,0→28,5→18,5→16,8).
- **Quy tắc v0.4: tickRate là chỉ báo đói ≥3 mức tách rõ — nhàn
  ~71,5 / trung gian ~28–33 / đói ~15–20 — KHÔNG dùng để tách mức
  tải trong một band, KHÔNG dùng làm trục phân loại.** Mức trung
  gian nay là một **khoảng ~28–33** (tải 31–53%), không phải một số
  đơn — ba điểm đo (~36% → 32,44; ~46% → 32,01; ~53% → 28,52)
  tách nhau rõ (khoảng không chồng nhau) nhưng cùng thuộc một mức
  "trung gian" vì cả ba đều tách xa khỏi nhàn (~40 điểm) và khỏi
  đói (~13 điểm khỏi Vừa). **Mức trung gian đã tái hiện lần thứ
  ba** (28,5 @ 53%; 32,0 @ 46%; 32,4 @ 36%) — không còn là quan
  sát một lần.
- **Vừa↔Nặng VẪN KHÔNG tách được:** chênh mean chỉ 1,77 tick/s,
  khoảng chồng nhau (Vừa 15,28–20,33 vs Nặng 16,54–17,39) — Vừa và
  Nặng gộp chung một mức "đói". Trong từng band hẹp, tickRate bão
  hòa (trong GAP-127: r(avg60, tickRate) = **+0,914 — DƯƠNG, ngược
  dấu gộp**; trong GAP-126: +0,322; trong GAP-125: −0,089).
  Đây là **hiệu ứng cụm (cluster artifact), không phải quan hệ
  thật**: nhóm dial leg 127 gồm hai cụm (run ổn định cao cả avg60
  lẫn tickRate hơn run leo dốc ~1 điểm) — tickRate chỉ tách GIỮA
  các cụm, không dự báo trong cụm.
- Gộp 6 cụm (n=36): r(avg60, tickRate) = **−0,906**;
  r(avg60, T_startup) = **+0,836**; r(tickRate, T_startup) =
  **−0,799**; r(avg60, threadsR) = **+0,967** (xem §7). Tương quan
  gộp giảm nhẹ so với n=30 (vì cụm ~36% trộn 3/6 ở tải thấp hơn)
  — nhất quán với dải chuyển mở rộng xuống ~31%.

**Lưu ý bắt buộc:**
- Các ngưỡng là **điểm giữa các cụm quan sát được**, không phải
  ranh giới vật lý. Vùng trộn ~31–53% là vùng trộn **quan sát
  được**, không phải khoảng tin cậy thống kê (xem §9).
- **Không suy ra "mức hog" từ PSI:** 6 hog và 12 hog cho PSI
  gần như nhau; leg 124: 2 hog → 24,30%, 3 hog → 53,85%, 6 hog →
  77,94%, 8 hog → 84,82% — ánh xạ hog→PSI phụ thuộc ambient.
  Leg 127 chứng minh thêm: cùng 2 hog, W chỉ 32,36% trên boot #73
  (ambient thấp) so với 45,74% trên boot #71. Muốn tái lập một
  band thì dial theo PSI đọc được (vòng kín, §4), không dial theo
  số hog.

## 4. Protocol đo (bắt buộc cho mọi run leg B)

1. **Giữ mức tải (hold) trước khi đo:** sau khi đặt/đổi số hog,
   **chờ ≥90 s** rồi mới bắt đầu run. Lý do: avg60 là trung bình
   trượt 60 s — cần 60 s để hội tụ hoàn toàn + 30 s biên. Pilot
   chứng minh độ trễ: 30 s sau khi kill hết hog, avg60 vẫn
   **62–95%** trong khi avg10 đã rơi về ~10–16%.
   **Hold sau warm-up — 30 s LÀ PROTOCOL CHUẨN ĐÃ ĐƯỢC CHỨNG MINH
   (ĐỔI, v0.4 — từ khuyến nghị của v0.3.1):** v0.3.1 ghi bài học
   hold 90 s sau warm-up làm run 1 leo dốc (mean 39,47% vs runs
   2–6: 45,48–48,00%) và khuyến nghị hold ngắn hơn cho leg sau.
   Leg 127 đã chứng minh: **hold 30 s sau warm-up CÓ TÁC DỤNG** —
   run 1 mean **41,40%**, CAO HƠN cả mean run ổn định (40,28%),
   không còn là run leo dốc. **Từ v0.4, hold sau warm-up là 30 s
   cho mọi leg dial ấm** (thay 90 s). Luật ≥90 s ở trên vẫn đứng
   cho mọi lần đổi hog thông thường — chỉ riêng hold sau warm-up
   là 30 s, vì mục đích của nó không phải chờ avg60 hội tụ từ
   hog-only (đó là điều gây leo dốc) mà là giữ cửa sổ avg60 còn
   tải browser của warm-up. Run leo dốc (nếu vẫn xuất hiện) vẫn
   HỢP LỆ nếu qua mọi kiểm §5 — chỉ ghi cờ "leo dốc" vào LIMITS,
   không loại run khỏi bộ chỉ vì thấp.
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
   (GIỮ từ v0.3.1; thêm caveat ambient-thấp, xem dưới).** Bài học
   đợt 125 (§5 LIMITS): dial lạnh (chỉ hog, chưa có browser) đọc
   25,98% nhưng run means ~53% — tải của chính browser/vite lúc
   chạy cộng thêm **~27 điểm avg60**. Dial không có browser **đánh
   giá thấp** avg60 lúc chạy ~27 điểm.
   **Bằng chứng chứng minh (leg 126 §5):** dial ấm TARGET-HIT ngay
   warm-up #1 (W = 45,74% với 2 hog, trong cửa sổ mục tiêu
   [45, 55]); sai số dial ấm |W − mean run means| = **|45,74 −
   45,98| = 0,24 điểm** (tiêu chí prereg ≤5 — ĐẠT, vượt xa; tốt hơn
   dial lạnh ~100 lần). Kiểm chéo loại run 1 leo dốc: sai số trên
   runs 2–6 = |45,74 − 47,28| = **1,54 điểm — vẫn ≤5**. Cả hai cách
   tính đều ĐẠT.
   **Bằng chứng thứ hai + caveat ambient-thấp (MỚI, v0.4 — leg 127
   §5):** W = 32,36% vs mean 6 run means dial 35,99% → **sai số
   dial ấm 3,63 điểm (tiêu chí ≤5 — ĐẠT)**. So với sai số dial lạnh
   đợt 125 ~27 điểm: dial ấm vẫn tốt hơn ~7 lần. **NHƯNG biến thể
   chỉ tính run ổn định (run 2, 7: mean 40,28%) cho sai số 7,92
   điểm — KHÔNG ĐẠT tiêu chí ≤5.** Giải thích: W đo lúc cửa sổ
   avg60 còn "lạnh" (trước warm-up chỉ có hog + ambient thấp),
   trong khi run ổn định thừa hưởng tải browser của run trước trong
   cửa sổ 60 s nên mean cao hơn ~8 điểm. Trên boot #71 (đợt 126)
   ambient cao hơn nên hiệu ứng này nhỏ (sai số ổn định chỉ 1,54
   điểm). **Kết luận: phương pháp dial ấm dự báo đúng mean CẢ LEG
   (gồm run leo dốc) trong ±5 điểm, nhưng KHÔNG dự báo chính xác
   run ổn định riêng lẻ khi ambient thấp — W đánh giá thấp run ổn
   định khi ambient thấp.** Ghi rõ trong LIMITS của mọi leg sau dù
   đạt hay không — nếu sai số > 5 điểm trên mean cả leg thì phương
   pháp dial ấm CHƯA đủ tốt, ghi nợ mở, không giấu. Ghi thêm kiểm
   chéo loại run leo dốc (nếu có) như leg 126/127 đã làm.
   **Số hog KHÔNG cố định mức tải giữa các boot (MỚI, v0.4):**
   cùng 2 hog nice-19, W = 45,74% trên boot #71 nhưng chỉ 32,36%
   trên boot #73 (ambient lúc dial 3,94% so với cao hơn hẳn trên
   #71; hog-only hội tụ ~25–30% thay vì ~35–40%). Đích 45–55%
   không phải lúc nào cũng chạm được với 2 hog — leg 127 chấp nhận
   TARGET-MISS-LOW theo prereg (không thêm hog ngoài đăng ký).
   **Mức tải đo được mới là chuẩn; số hog chỉ là phương tiện.**
   Từ v0.4, dial bằng browser ấm là **protocol chuẩn** cho mọi leg
   dò ranh giới (không còn là thử nghiệm):
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
     đã làm. **Từ v0.4, ghi thêm biến thể chỉ tính run ổn định**
     (nếu leg có phân biệt run leo dốc / run ổn định) — sai số
     này KHÔNG phải tiêu chí VOID, chỉ là caveat độ chính xác.
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

## 6. Trả lời câu hỏi ranh giới chuyển — v0.4 điền vùng trộn ~31–53%

- **Ranh giới chuyển chế độ chậm = VÙNG TRỘN QUAN SÁT ĐƯỢC ~31–53%
  (không phải một số).** Bằng chứng: Yên 0/12 chậm tới 14,13%;
  Vừa 6/6 chậm từ 65,75%; leg GAP-127 TRỘN 3 chậm/3 nhanh tại run
  means 30,83–41,48% (mean 35,99%, T_startup median 1,259 s),
  leg GAP-126 TRỘN 3 chậm/3 nhanh tại run means 39,47–48,00%
  (T_startup median 1,227 s) và leg GAP-125 TRỘN 4 chậm/2 nhanh
  tại run means 52,75–53,99% (T_startup median 1,2635 s).
- **Cận dưới ~31% (ĐỔI từ ~45% của v0.3.1):** trộn ngay tại ~31%
  (run 6 CHẬM 1,702 s @ 31,52% vs run 4 NHANH 1,195 s @ 31,67%).
  Khoảng (14,13%, ~31%) chỉ có run Yên và chưa có run chậm nào —
  chưa biết ở đó là nhanh chắc chắn hay bắt đầu trộn.
- **Cận trên ~53%** là điểm trộn cao nhất quan sát được; khoảng
  (53%, 65,75%) chưa có dữ liệu — chưa biết trộn hay chậm chắc chắn.
- **Ngưỡng Yên <30% ĐỨNG** (không có run chậm nào dưới 30%; run
  chậm thấp nhất 30,83% — biên chỉ 0,83 điểm, xem §9).
- **Vùng chuyển là dải ngẫu nhiên, không phải đường sắc — bằng
  chứng trong-leg ở cả hai đầu dải:** run 6 leg 127 CHẬM (1,702 s)
  ở 31,52% trong khi run 4 NHANH (1,195 s) ở 31,67%; run 1 leg 127
  CHẬM (1,322 s) ở 41,40% trong khi run 2 NHANH (1,082 s) ở
  41,48%; run 3 leg 126 CHẬM (1,403 s) ở 47,74% trong khi run 4
  NHANH (0,980 s) ở 48,00% — tải gần như bằng nhau, kết quả ngược
  nhau. Trong-leg r(avg60, T_startup) = **−0,587** (leg 127, âm —
  hiệu ứng cụm, xem §3) và **−0,151** (leg 126, phẳng, thậm chí hơi
  âm) — trong dải chuyển, tải KHÔNG dự báo được nhanh/chậm từng
  run. Chỉ có tỉ lệ chậm tăng theo tải giữa các cụm (0/6 @ ~10% →
  3/6 @ ~36% → 3/6 @ ~46% → 4/6 @ ~53% → 6/6 @ ~70%+).
- **Xen kẽ KHÔNG lặp lại — nhiễu trình tự đo đã loại trừ (MỚI,
  v0.4):** leg 126 chậm/nhanh xen kẽ đúng từng run
  (S-F-S-F-S-F, p ngẫu nhiên ≈3%) làm dấy lên nghi ngờ yếu tố nhiễu
  xen kẽ theo run. Leg 127 (thứ tự xen kẽ đăng ký trước, seed 1273)
  trả dãy con dial **S-F-F-S-F-S** — hai run nhanh liên tiếp (run 2
  → run 4) phá vỡ xen kẽ hoàn hảo. Kết luận bền với biên ngưỡng:
  run 4 nhanh chỉ dưới ngưỡng 5 ms (1,195 s); nếu tính run 4 là
  chậm thì dãy thành S-F-S-S-F-S — vẫn không xen kẽ hoàn hảo.
  **Không có bằng chứng yếu tố xen kẽ hệ thống; không cần điều tra
  thêm.** Tỉ lệ 3/6 đợt 126 đứng như ước lượng thô của P(chậm) tại
  ~46% (caveat mẫu nhỏ). Caveat xen kẽ của v0.3.1 hạ xuống ghi chú
  (xem §9).
- **tickRate ≥3 mức (mức trung gian ~28–33, tái hiện lần thứ ba):**
  xem bảng §3 — ba điểm trung gian 32,44 @ ~36%, 32,01 @ ~46% và
  28,52 @ ~53% tách rõ khỏi nhàn ~71,5 và đói ~15–20; Vừa↔Nặng vẫn
  không tách (gộp một mức "đói").
- **Pha (b) T_seek MIỄN NHIỄM với tải (giữ ở n=42):** T_seek max
  0,001 s trên cả 42 run (Yên + GAP-127 + GAP-126 + GAP-125 + Vừa
  + Nặng) — seek tức thì một khi metadata đã load; toàn bộ chậm
  nằm ở pha startup/metadata.

**Số liệu phụ theo band (42 run):** threadsR mean Yên-127 2,1 →
GAP-127 6,9 → GAP-126 7,4 → GAP-125 8,0 → Vừa 9,3 → Nặng 13,8
(r(avg60, threadsR) = +0,967 — trục phụ đứng); totalFrames Yên 384
→ GAP-127 297–329 → GAP-126 289–310 → GAP-125 290–324 → Vừa
161–279 → Nặng 163–213; dropped frames 0 → GAP-127 0–1 → GAP-126
0–2 → GAP-125 0–1 → Vừa 2–7 → Nặng 6–11; seekImmMs Yên-127
434–743 ms → GAP-127 1017–1534 ms → GAP-126 776–1402 ms → GAP-125
1092–1318 ms → Vừa 1621–2810 ms → Nặng 1590–3039 ms — mọi chỉ báo
phụ đều đơn điệu theo avg60 và đặt GAP-127 đúng vị trí trung gian
(giữa Yên và GAP-126). Trong leg 127, run chậm có seekImmMs cao hơn
rõ (run 1/6/9: 1231/1534/1272 ms, mean 1346) so với run nhanh (run
2/4/7: 1121/1195/1017 ms, mean 1111) — seekImmMs đi cùng chiều với
T_startup trong leg (cùng pha startup/metadata, không phải chỉ báo
độc lập). Nhất quán với đợt 126 (chậm 1299 vs nhanh 955 ms).

## 7. Tương quan gộp (n=36) — KHÔNG kết luận nhân quả

| Cặp | r (gộp 6 cụm, n=36) | v0.3.1 (n=30) | v0.3 (n=24) | Đọc |
|---|---|---|---|---|
| avg60 ↔ T_startup | **+0,836** | +0,860 | +0,864 | Tương quan mạnh giữa band, nhưng trong-band yếu/hỗn hợp (§6) |
| avg60 ↔ tickRate | **−0,906** | −0,944 | −0,959 | tickRate là triệu chứng đói theo band (§3) |
| tickRate ↔ T_startup | **−0,799** | −0,809 | −0,831 | Cùng một bước nhảy giữa band, không phải cơ chế |
| avg60 ↔ threadsR | **+0,967** | +0,975 | +0,979 | threadsR đơn điệu theo band — trục phụ đứng |

**KHÔNG kết luận nhân quả:** 42 run gộp nhưng chỉ 1 cây và 6 boot
(Yên-123 trên boot #67?, Vừa/Nặng trên boot #68?, GAP-125 trên
boot #70, GAP-126 trên boot #71, Yên-127 + GAP-127 trên boot #73
— số boot tạm, chờ T6 recount), sibling đang chạy, n=6/cụm. So
sánh giữa các cụm vẫn có nhiễu boot; nhưng bước nhảy 0,337 → 0,672
→ 1,259 → 1,227 → 1,264 → 1,843 s và tickRate 71,5 → 71,6 → 32,4
→ 32,0 → 28,5 → 18,5 lớn hơn mọi nhiễu boot từng thấy giữa các leg
Yên (median Yên các đợt 0,3–0,5 s). Trong từng cụm hẹp, mọi tương
quan đều phẳng hoặc là hiệu ứng cụm (GAP-127: r(avg60, T_startup)
= −0,587; r(avg60, tickRate) = +0,914 — cả hai đều do hai cụm leo
dốc/ổn định, xem §3; GAP-126: r(avg60, T_startup) = −0,151;
r(avg60, tickRate) = +0,322; GAP-125: r≈−0,09/+0,08) — chỉ có bước
nhảy GIỮA các cụm là rõ.

**Phạm vi n=36:** tương quan gộp tính từ 30 run đợt 123–126 + 6 run
dial đợt 127 (cùng phương pháp analyzer, tái hiện đúng số DEF v0.3
ở n=24 và số LIMITS 126 ở n=30 trước khi thêm 6 run này). 6 run Yên
đợt 127 không gộp vào r (chúng là cụm Yên trong-boot để đối chiếu
tickRate/T_startup với nhóm dial cùng boot #73) — tổng số run đo
trong corpus DEF là **42**.

## 8. load1 vẫn vô hiệu (bằng chứng mới từ leg 127)

Run 4 GAP đợt 125 load1 0,32→3,98; run 5 GAP đợt 125 3,98→5,10 ở
cùng PSI ~53%; run 11 Nặng đợt 124 load1 10,18/12,17 vs run 7 Nặng
0,96/0,56 ở cùng PSI ~90%. Leg 126: run 5 load1 5,21→5,58 trong khi
run 2 load1 0,88→0,42 ở cùng PSI ~47% (bracket load1 toàn leg
0,38–5,58, không mẫu hình). **Mới (leg 127):** run 1 load1
4,22→4,80 trong khi run 9 load1 0,35→1,00 ở cùng PSI ~31–41%
(bracket load1 toàn leg 0,35–4,80, không mẫu hình). load1 không
dùng trong bất kỳ tiêu chí nào, đúng DEF v0.1 — v0.4 giữ nguyên.

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
- **n nhỏ, 6 boot:** 42 run gộp nhưng chỉ 1 cây và 6 boot; Yên đo
  trên boot khác Vừa/Nặng, GAP-125, GAP-126 và GAP-127/Yên-127 đo
  trên ba boot khác nhau nữa — so sánh giữa cụm có nhiễu boot.
- **threadsR nhiễu ở mức hog nhỏ:** pilot: L6 threadsR 20,8 vs
  L12 18,4 (đảo ngược) — threadsR chỉ dùng để xác nhận, không
  dùng để tách mức.
- **avg60 trễ ~60 s** sau mọi thay đổi tải (xem §4.1 + RECOV
  pilot). Đừng bao giờ đọc avg60 ngay sau khi đổi hog.
- **Vùng trộn ~31–53% là vùng trộn QUAN SÁT ĐƯỢC, không phải
  khoảng tin cậy thống kê.** Ba leg trộn mỗi leg chỉ n=6; khoảng
  (53%, 65,75%) chưa đo; khoảng (14,13%, ~31%) chỉ có run Yên và
  chưa có run chậm nào. Mọi kết luận "chế độ chậm bắt đầu ở avg60
  X%" với X là một số đơn đều là suy đoán — cấm tuyên bố.
- **Caveat xen kẽ hoàn hảo — HẠ XUỐNG GHI CHÚ (v0.4, đã loại trừ):**
  leg 126 chậm/nhanh xen kẽ đúng từng run (S-F-S-F-S-F, p ≈ 3%).
  Leg 127 kiểm tra bằng thứ tự đăng ký trước (seed 1273) trả dãy
  con dial **S-F-F-S-F-S** — xen kẽ KHÔNG lặp lại; kết luận bền với
  biên ngưỡng (run 4 nhanh chỉ dưới ngưỡng 5 ms; tính run 4 là chậm
  thì dãy thành S-F-S-S-F-S — vẫn không xen kẽ hoàn hảo). Mẫu hình
  đợt 126 phù hợp với ngẫu nhiên; **không có bằng chứng yếu tố xen
  kẽ hệ thống; không cần điều tra thêm.** Tỉ lệ 3/6 đợt 126 đứng
  như ước lượng thô (caveat mẫu nhỏ). Ghi chú này giữ lại để người
  đọc sau biết câu hỏi đã được đặt và đã có đáp án — không phải
  caveat đang mở.
- **Caveat run 1 leo dốc sau hold — ĐÃ KHẮC PHỤC BẰNG HOLD 30 s
  (v0.4):** hold 90 s sau warm-up (đợt 126) làm run 1 mean 39,47%,
  thấp hơn cụm runs 2–6 (45,48–48,00%). Leg 127 dùng hold 30 s:
  run 1 mean 41,40%, cao hơn mean run ổn định (40,28%) — không
  còn leo dốc. Từ v0.4, hold sau warm-up là 30 s (§4.1). Mean 6 run
  đợt 126 (45,98%) vẫn thấp hơn mức ổn định runs 2–6 (47,28%)
  ~1,3 điểm — mọi số gộp dùng mean 45,98% (đầy đủ 6 run, không loại
  run) phải đọc kèm caveat này; sai số dial ấm đợt 126 tính cả hai
  cách (0,24 và 1,54 điểm) đều ≤5 nên kết luận "dial ấm đã chứng
  minh" không phụ thuộc cách tính.
- **Caveat dial ấm ambient-thấp (MỚI, v0.4 — bắt buộc, không giấu):**
  leg 127: sai số dial ấm trên mean cả leg 3,63 điểm (≤5 — ĐẠT)
  nhưng trên run ổn định riêng lẻ 7,92 điểm (KHÔNG ĐẠT). W đo lúc
  cửa sổ avg60 còn "lạnh" nên **đánh giá thấp run ổn định khi
  ambient thấp** (~8 điểm trên boot #73; chỉ ~1,5 điểm trên boot
  #71 ambient cao). Hệ quả thực hành: dial ấm tin cậy để đặt mức
  tải cả leg, KHÔNG tin cậy để dự báo chính xác từng run ổn định
  khi ambient thấp. Mọi leg sau phải ghi cả hai sai số (cả leg +
  run ổn định) trong LIMITS (§4.7(c)).
- **Caveat biên ngưỡng Yên 0,83 điểm (MỚI, v0.4):** run chậm thấp
  nhất đo được là 30,83% (run 9 leg 127) — chỉ trên ngưỡng Yên
  30% có 0,83 điểm. Ngưỡng Yên đứng vì phía nhanh (run nhanh cao
  nhất 14,13%, cách xa), không vì phía chậm. Nếu leg sau quan sát
  được run chậm ở ~28–30% thì ngưỡng Yên <30% phải xét lại.
- **Caveat số hog không cố định mức tải (MỚI, v0.4):** cùng 2 hog,
  W = 45,74% (boot #71) vs 32,36% (boot #73) — chênh 13,38 điểm do
  ambient khác nhau. Không bao giờ đặt đích run bằng số hog; chỉ
  đặt bằng PSI đo được (dial vòng kín, §4.2/§4.7).
- **Caveat gate phối hợp leg 127 (ghi để đối chiếu, không phải lỗi
  DEF):** cờ `round127-t9-done` mà gate của T3 đợt 127 chờ KHÔNG
  phải "lượt yên #7 hợp lệ" — T9 đợt 127 có 0 lượt yên hợp lệ (3/3
  attempt gate A không mở, 0 probe); cờ được touch 03:46:18Z khi
  attempt3 của T9 xong để mở leg tải cho T3. Gate của T3 vẫn hợp lệ
  theo đúng mục đích phối hợp (không hog nào chạy khi T9 còn
  attempt — hog đầu tiên spawn 03:47:19Z, sau cờ ~1 phút), nhưng
  "cửa yên sạch" ở đây nghĩa là "T9 đã xong mọi attempt", KHÔNG
  phải "đã có lượt yên hợp lệ". Nợ lượt yên #7 chuyển tiếp sang
  đợt 128. Chi tiết: `docs/PHASE9_ROUND127_T9_WEBKIT60MS_LIMITS.md`.
- **Dial lạnh đánh giá thấp avg60 lúc chạy ~27 điểm** (bài học
  đợt 125 §5) — leg dò ranh giới phải dial bằng browser ấm (§4.7).
  Số liệu dial lạnh cũ không dùng để đặt đích run nữa.
- Định nghĩa này **không thay đổi** định nghĩa bar F2
  (T_startup/T_seek + ngưỡng, T3-120 §1) — chỉ thay **trục
  tải** mà leg B chạy trên đó.

## 10. Verdict F2 — v0.4 KHÔNG xét lại

**Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (quyết parent cửa (a) đợt
123 §12.1, nhắc lại trong quyết đợt 124 §12.2a, đợt 125 §12,
đợt 126 §12 và đợt 127 §12). Leg kiểm tra xen kẽ đợt 127 chỉ là
dữ liệu hiệu chỉnh DEF — nó không xét bar/verdict, không gộp số
với bộ verdict. DEF v0.4 này cũng vậy: nó là định nghĩa trục tải đã
hiệu chỉnh, không phải một phán quyết bar F2 mới. Lật verdict cần
≥6 run nhanh trên cùng một boot theo luật T3-120 §6 nợ #1 (chú ý:
boot #72 đợt 127 đã bị reboot #73 thay thế lúc 03:04:25Z 17/11 —
bộ run nhanh cũ KHÔNG dùng được nữa; leg 127 chạy trên boot #73,
cây H3f, cũng không phải bộ verdict).

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
- **v0.3.1** (17/11/2026, T2 đợt 127 — file
  `docs/PHASE9_ROUND127_T2_PSIAXIS_DEF_V031.md`, giữ nguyên):
  ranh giới chuyển thành **VÙNG TRỘN QUAN SÁT ĐƯỢC ~46–53%** (cận
  dưới ~45% ĐÃ KIỂM CHỨNG bằng TRỘN 3/6 tại ~46%; cận trên 60% →
  ~53%, điểm trộn cao nhất quan sát được; khoảng (53%, 65,75%)
  chưa có dữ liệu); tickRate mức trung gian mở rộng thành **khoảng
  ~28–33** (32,01 @ ~46% + 28,52 @ ~53%; đường cong 5 điểm n=30);
  **dial bằng browser ấm là protocol CHUẨN ĐÃ ĐƯỢC CHỨNG MINH**
  (sai số 0,24 điểm, tiêu chí ≤5); bài học **hold sau warm-up**
  (run 1 leo dốc 39,47%) + khuyến nghị hold ngắn hơn cho leg sau;
  caveat **xen kẽ hoàn hảo** (p ≈ 3%, tỉ lệ 3/6 không đọc là
  P(chậm)=0,5 chính xác, chờ leg kiểm tra xen kẽ T3 đợt 127);
  tương quan gộp n=30; verdict đợt 120 vẫn đứng.
- **v0.4** (17/11/2026, T1 đợt 128 — file này): ranh giới chuyển
  thành **VÙNG TRỘN QUAN SÁT ĐƯỢC ~31–53%** (cận dưới ~45% →
  ~31%: trộn đã quan sát được ngay tại ~31%, run chậm thấp nhất
  30,83%; cận trên giữ ~53%; khoảng (53%, 65,75%) vẫn chưa có dữ
  liệu); **xen kẽ KHÔNG lặp lại** (S-F-F-S-F-S) — caveat xen kẽ hạ
  xuống ghi chú, không cần điều tra thêm; tickRate mức trung gian
  ~28–33 **tái hiện lần thứ ba** (32,44 @ ~36%; đường cong 6 điểm
  n=36); **hold 30 s sau warm-up là protocol CHUẨN ĐÃ ĐƯỢC CHỨNG
  MINH** (run 1 không còn leo dốc, 41,40% > mean run ổn định
  40,28%); **caveat dial ấm ambient-thấp** (sai số 3,63 điểm trên
  mean cả leg — ĐẠT; 7,92 điểm trên run ổn định — KHÔNG ĐẠT; W
  đánh giá thấp run ổn định khi ambient thấp) + ghi rõ **số hog
  không cố định mức tải giữa các boot** (W 45,74% vs 32,36% cùng
  2 hog); ngưỡng Yên <30% ĐỨNG kèm lưu ý biên mong manh 0,83
  điểm; tương quan gộp n=36; verdict đợt 120 vẫn đứng.
- **v0.5 (dự kiến):** chỉ viết khi có dữ liệu mới thay đổi dải
  hoặc ngưỡng — vd leg sau đo được khoảng (53%, 65,75%), hoặc run
  chậm ở ~28–30% buộc xét lại ngưỡng Yên <30%. **Không leg dò
  ranh giới thêm** theo quyết parent đợt 126 §12(b) (khẳng định lại
  đợt 127 §12(b)) — trừ khi parent ra quyết mới.
