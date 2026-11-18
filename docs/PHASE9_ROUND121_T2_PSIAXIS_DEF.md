# Định nghĩa trục tải PSI cho bar F2 leg B — v0.1 (tạm thời, chờ hiệu chỉnh sau đợt 122)

**Ngày:** 16/11/2026. **Đợt:** 121, luồng T2. **Trạng thái:** ĐỊNH NGHĨA
CHUẨN v0.1 — parent đã duyệt hướng trục (PSI cpu.some chính +
threadsR phụ, quyết đợt 120 §12.1); các ngưỡng số trong này là **tạm
thời**, rút từ pilot n=1 + dữ liệu đợt 120, và **BẮT BUỘC hiệu chỉnh
lại sau khi leg B đợt 122 thu PSI trong lúc chạy browser thật**.
**Phạm vi:** chỉ dùng cho bar F2 leg B (Q8SEEKFAST) và các đo tải
liên quan trong cell này (VM Secure, 4 vCPU nhìn thấy, ngân sách
chia sẻ ~1,5 CPU). **KHÔNG dùng load1 làm biến tải trong bất kỳ
kết luận nào** — load1 chỉ ghi để đối chiếu (đã chứng minh vô hiệu,
xem T2-120 §1/§2/§5). 19,63 vẫn chỉ là NHÃN LỊCH SỬ của lượt s77c.

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
- **Bằng chứng phân biệt mức (pilot đợt 121, xem §5):** avg60
  đuôi pha: 0 hog (máy xung quanh bận) ~11% · 2 hog ~72% ·
  6 hog ~91% · 12 hog ~95%. PSI phân biệt được yên / vừa / nặng
  ở đầu thấp, và **bão hòa trên ~6 hog** (6 vs 12 hog chỉ chênh
  ~4 điểm).
- **PSI `full`:** tỉ lệ thời gian MỌI task đều chờ (máy đơ hoàn
  toàn). Pilot + T2-120: `full` = 0,00% suốt. Chỉ ghi nhận; nếu
  `full avg10 > 0` trong một run thì đó là dấu hiệu bất thường,
  xem §4 mục (e).

## 2. Trục chính, trục phụ, chỉ báo đi kèm

| Vai trò | Thước đo | Cách đo | Dùng để |
|---|---|---|---|
| **Chính** | **PSI cpu.some avg60** | đọc `/proc/pressure/cpu` mỗi 5 s trong lúc phát; lấy **trung bình các mẫu trong cửa sổ run** + 2 điểm bracket (đầu/cuối run) | Phân loại run vào band tải; tiêu chí VOID |
| Phụ | **threadsR** (số runnable, trường 4 của `/proc/loadavg`) | cùng mẫu 5 s; lấy trung bình trong cửa sổ run | Xác nhận "cùng tải thật" (cùng cấu hình hog → threadsR tương đương); KHÔNG dùng để tách band |
| Chỉ báo đói (triệu chứng) | **tickRate** (blendTick, tick/s trong browser) | như các đợt trước, ghi theo quý | Ghi nhận; KHÔNG làm trục (nó là kết quả, không phải đầu vào). Pilot: ticker proxy bão hòa nhanh (~62 → ~40 tick/s rồi phẳng) — chỉ phân biệt "đói/không đói", không chấm mức tải |
| Xác nhận hog chạy thật | **hog burn** (utime hog, CPU) + **cgroup `usage_usec` rate** | utime từng PID hog; `usage_usec` tăng / thời gian | Xác nhận hog có đốt CPU không; nếu burn ≈ 0 trong khi PSI cao → hog đang bị ambient bóp, ghi cờ (xem §4) |

**Không dùng:** load1/load5/load15 (vô hiệu); load1 chỉ ghi vào
log để đối chiếu, không xuất hiện trong bất kỳ tiêu chí hợp lệ,
band, hay kết luận nào.

## 3. Các mức tải (band) — v0.1, tạm thời

| Band | PSI some avg60 | Căn cứ (pilot đợt 121, đuôi pha 30 s) |
|---|---|---|
| **Yên** | **< 30%** | Máy thật sự nhàn ~1–5% (T2-120 BASE); 0 hog giữa đợt 121 đang chạy (sibling bận) lên tới **25,6%**; 2 hog thấp nhất **68,5%**. Ngưỡng 30 nằm trên mức ambient cao nhất đo được và xa dưới mức 2-hog thấp nhất |
| **Vừa** | **30–80%** | 2 hog: đuôi pha 68,5–75,3% (mean 72,2%). Ngưỡng 80 nằm giữa mức 2-hog cao nhất (75,3%) và mức 6-hog thấp nhất (90,5%) |
| **Nặng** | **> 80%** | 6 hog: 90,5–91,5% (mean 91,1%); 12 hog: 94,6–95,2% (mean 94,9%). 6 vs 12 hog chỉ chênh ~4 điểm — **trên 6 hog, PSI không tách được mức hog nữa**; band Nặng do đó là một band duy nhất, không chia nhỏ |

**Lưu ý bắt buộc:**
- Các ngưỡng là **điểm giữa các cụm quan sát được**, không phải
  ranh giới vật lý. Chúng sẽ dời sau đợt 122 (xem §6).
- Band Yên <30% là **rộng hơn** bracket cũ load1<3 về mặt cảm
  giác — nhưng đó là thực tế của cell này khi các luồng sibling
  đang chạy: ambient một mình đã đẩy avg60 tới ~26%. Nếu leg B
  đợt 122 cho thấy T_startup vẫn ở chế độ nhanh trong toàn bộ
  band Yên thì ngưỡng đứng; nếu chế độ chậm xuất hiện ngay cả
  ở avg60 ~20–30% thì phải thu hẹp band Yên và ghi rõ.
- **Không suy ra "mức hog" từ PSI:** 6 hog và 12 hog cho PSI
  gần như nhau. Muốn tái lập một band thì dial theo PSI đọc
  được (vòng kín, §4), không dial theo số hog.

## 4. Protocol đo (bắt buộc cho mọi run leg B từ đợt 122)

1. **Giữ mức tải (hold) trước khi đo:** sau khi đặt/đổi số hog,
   **chờ ≥90 s** rồi mới bắt đầu run. Lý do: avg60 là trung bình
   trượt 60 s — cần 60 s để hội tụ hoàn toàn + 30 s biên. Pilot
   chứng minh độ trễ: 30 s sau khi kill hết hog, avg60 vẫn
   **62–95%** trong khi avg10 đã rơi về ~10–16%.
2. **Dial vòng kín theo PSI, không theo số hog:** đặt số hog ban
   đầu (gợi ý: Yên = 0 hog; Vừa = 2 hog; Nặng = 6 hog), chờ
   90 s, đọc avg60; nếu ngoài band mục tiêu thì tăng/giảm hog,
   chờ tiếp 90 s, đọc lại. Ghi lại số hog cuối cùng + mọi lần
   điều chỉnh. Lý do: hog burn đo được chỉ 0,26–0,54 CPU và
   không đơn điệu theo số hog (2 hog: 0,36; 6 hog: 0,26; 12 hog:
   0,54) — ngân sách host chia sẻ với sibling mới là yếu tố
   giới hạn, số hog không điều khiển được CPU cháy.
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

## 5. Luật VOID / hợp lệ cho run leg B (theo trục PSI)

Run là **VOID** (không tính vào bar) nếu bất kỳ điều nào sau đây
xảy ra; ngược lại là **valid**:

- (a) avg60 bracket đầu HOẶC cuối **lệch khỏi band mục tiêu
  quá 10 điểm** (vd: band Yên mà avg60 đầu = 42% → VOID).
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

Run VOID vẫn ghi đầy đủ số liệu + lý do VOID vào LIMITS (không
giấu VOID). Không chạy bù quá ngân sách attempt đã đăng ký trong
prereg.

## 6. Hiệu chỉnh sau đợt 122 (bắt buộc, không tự ý bỏ qua)

Sau leg B đợt 122, luồng T3 đợt 122 **phải** báo cáo:

- (i) PSI avg60 thực tế trong lúc browser chạy ở mỗi band (có
  thể cao hơn pilot vì browser tự tạo tải) — từ đó **đề xuất
  dời ngưỡng** nếu band Yên không bao giờ đạt được khi browser
  chạy, hoặc nếu chế độ chậm xuất hiện trong band Yên.
- (ii) T_startup theo band PSI: chế độ nhanh/chậm có tách theo
  band không? Nếu không tách thì PSI cũng chỉ là trục phân
  loại tải, không phải trục giải thích chế độ — ghi rõ, không
  gán nhân quả.
- (iii) tickRate theo band PSI: kiểm tra lại tương quan +0,90
  của T2-120 sau khi tách PSI (tickRate có thể chỉ là proxy
  của PSI).
- Sau đó DEF này lên **v0.2** với ngưỡng đã hiệu chỉnh + số
  liệu đợt 122. Trước khi có v0.2, mọi kết luận dùng ngưỡng
  v0.1 đều phải kèm chữ "tạm thời".

## 7. Caveat của định nghĩa này (đọc trước khi dùng)

- **PSI đo stall, không đo throughput.** Một run có thể có PSI
  95% trong khi hog chỉ đốt 0,3 CPU (ngân sách host cạn) — đó
  đúng là điều cần đo cho main thread browser (nó chờ CPU),
  nhưng đừng đọc PSI như "máy đang chạy hết công suất".
- **Ngân sách host chưa biết.** Ước tính ~1,5 CPU chia sẻ với
  cửa sổ ~8,5 phút (T2-120 §5, chưa chứng minh). PSI có thể
  dao động theo pha sóng ngân sách này — pilot chỉ dài 6,5
  phút (< 1 chu kỳ sóng) nên **chưa đo được ảnh hưởng của sóng
  lên PSI**.
- **n pilot nhỏ:** 1 lần chạy duy nhất mỗi mức, 1 boot (#62),
  sibling đang chạy. Mọi ngưỡng đều tạm thời.
- **threadsR nhiễu ở mức hog nhỏ:** pilot: L6 threadsR 20,8 vs
  L12 18,4 (đảo ngược) — threadsR chỉ dùng để xác nhận, không
  dùng để tách mức.
- **avg60 trễ ~60 s** sau mọi thay đổi tải (xem §4.1 + RECOV
  pilot). Đừng bao giờ đọc avg60 ngay sau khi đổi hog.
- Định nghĩa này **không thay đổi** định nghĩa bar F2
  (T_startup/T_seek + ngưỡng, T3-120 §1) — chỉ thay **trục
  tải** mà leg B chạy trên đó. Verdict cũ "KHÔNG ĐẠT — chế độ
  chậm" vẫn đứng; lật verdict cần ≥6 run nhanh trên cùng một
  boot theo luật T3-120 §6 nợ #1 (chú ý: boot #61 đã bị reboot
  #62 thay thế lúc 08:25:47Z 16/11 — bộ 3 nhanh cũ KHÔNG dùng
  được nữa nếu đợt 122 chạy trên boot khác; xem prereg template).
