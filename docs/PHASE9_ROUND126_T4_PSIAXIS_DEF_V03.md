# Định nghĩa trục tải PSI cho bar F2 leg B — v0.3 (CHUẨN, hiệu chỉnh bằng leg GAP đợt 125)

**Ngày:** 17/11/2026. **Đợt:** 126, luồng T4. **Trạng thái:** ĐỊNH NGHĨA
CHUẨN v0.3 — parent đã **PHÊ DUYỆT** viết theo quyết đợt 125 §12(e)
(ranh giới chuyển thành DẢI ~45–60%; tickRate ≥3 mức; dial bằng
browser ấm) + leg dò thêm quanh ~45–55% ở đợt 126.
**File này THAY THẾ v0.2 làm chuẩn hiện hành.** File v0.2
(`docs/PHASE9_ROUND125_T4_PSIAXIS_DEF_V02.md`) và v0.1
(`docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`) được **giữ nguyên vẹn
làm lịch sử** — không sửa, không xóa.
**Phạm vi:** chỉ dùng cho bar F2 leg B (Q8SEEKFAST) và các đo tải
liên quan trong cell này (VM Secure, 4 vCPU nhìn thấy, ngân sách
chia sẻ ~1,5 CPU). **KHÔNG dùng load1 làm biến tải trong bất kỳ
kết luận nào** — load1 chỉ ghi để đối chiếu (đã chứng minh vô hiệu,
xem §8). 19,63 vẫn chỉ là NHÃN LỊCH SỬ của lượt s77c.

**Cơ sở dữ liệu của v0.3:** leg B Yên đợt 123 (6 run) + leg tải đợt
124 (Vừa 6/6 VALID + Nặng 6/6 VALID, 12 run) + leg GAP đợt 125
(6/6 VALID tại avg60 ~53%, boot #70, cây baseline) = **24 run gộp**.
Chi tiết: `docs/PHASE9_ROUND125_T4_LEGTRUNGGIAN_LIMITS.md` (§0–§9)
và `docs/PHASE9_ROUND124_T4_LEGLOAD_LIMITS.md` (§0–§4). v0.3 sửa
hai quy tắc của v0.2 đã bị dữ liệu mới bác bỏ: (1) ranh giới chuyển
không còn là "chưa xác định trong 13–66%" mà đã khoanh được thành
dải (xem §3, §6); (2) tickRate không còn là "chỉ báo đói 2 mức" —
có ít nhất 3 mức tách rõ (xem §3).

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
  leg GAP đợt 125):** PSI phân biệt được yên / vừa / nặng ở đầu
  thấp, và **bão hòa trên ~6 hog** (6 vs 12 hog chỉ chênh ~4 điểm;
  leg 124: 6 hog → 77,94%, 8 hog → 84,82% — tăng hog không tăng
  CPU cháy tổng bao nhiêu, tổng chỉ ~1 CPU cả hai leg).

## 2. Trục chính, trục phụ, chỉ báo đi kèm

| Vai trò | Thước đo | Cách đo | Dùng để |
|---|---|---|---|
| **Chính** | **PSI cpu.some avg60** | đọc `/proc/pressure/cpu` mỗi 5 s trong lúc phát; lấy **trung bình các mẫu trong cửa sổ run** + 2 điểm bracket (đầu/cuối run) | Phân loại run vào band tải; tiêu chí VOID |
| Phụ | **threadsR** (số runnable, trường 4 của `/proc/loadavg`) | cùng mẫu 5 s; lấy trung bình trong cửa sổ run | Xác nhận "cùng tải thật" (cùng cấu hình hog → threadsR tương đương); KHÔNG dùng để tách band |
| Chỉ báo đói **≥3 mức** (triệu chứng) — SỬA v0.2 | **tickRate** (blendTick, tick/s trong browser) | như các đợt trước, ghi theo quý | **Chỉ báo đói, KHÔNG làm trục** (nó là kết quả, không phải đầu vào). v0.3 xác định: tickRate có **ít nhất 3 mức tách rõ** — nhàn ~71,5 / trung gian ~28,5 / đói ~15–20 (Vừa+Nặng gộp chung một mức "đói", xem §3) |
| Xác nhận hog chạy thật | **hog burn** (utime hog, CPU) + **cgroup `usage_usec` rate** | utime từng PID hog; `usage_usec` tăng / thời gian | Xác nhận hog có đốt CPU không; nếu burn ≈ 0 trong khi PSI cao → hog đang bị ambient bóp, ghi cờ (xem §4) |

**Không dùng:** load1/load5/load15 (vô hiệu); load1 chỉ ghi vào
log để đối chiếu, không xuất hiện trong bất kỳ tiêu chí hợp lệ,
band, hay kết luận nào.

## 3. Các mức tải (band) — v0.3, GIỮ NGUYÊN ngưỡng v0.1/v0.2

Ngưỡng v0.1 **ĐỨNG, không dời** — leg tải đợt 124 đã đạt được cả
hai band tải khi browser chạy, bracket ổn định trong band, và bốn
cụm đo (thêm GAP đợt 125) tách nhau rõ.

| Band | PSI some avg60 | Căn cứ đo thật (24 run: Yên 123 + Vừa/Nặng 124 + GAP 125) |
|---|---|---|
| **Yên** | **< 30%** | avg60 mean từng run 4,38–13,14% (mean các run 7,02%). Cao nhất đo được 13,14% — cách ngưỡng 30 gần 17 điểm. 0/6 chậm |
| **Vừa** | **30–80%** | avg60 mean từng run 65,75–75,64% (mean các run 69,71%). Đạt được với **3 hog**, không phải 2 hog như pilot gợi ý. 6/6 chậm |
| **Nặng** | **> 80%** | avg60 mean từng run 89,23–91,76% (mean các run 90,69%). Đạt được với **8 hog**, không phải 6 hog như pilot gợi ý. 6/6 chậm |
| **GAP (trung gian, dò ranh giới)** | **13–66%** (cửa sổ hợp lệ, không phải band danh nghĩa) | avg60 mean từng run 52,75–53,99% (mean 53,19%, đợt 125, 2 hog). **TRỘN 4/6 chậm, 2/6 nhanh** — xem §6 |

**Ranh giới chuyển chế độ chậm — v0.3: DẢI ~45–60% (MỚI, thay
"chưa xác định" của v0.2).** Bằng chứng cứng (24 run):
- **Nhanh chắc chắn** ở avg60 ≤13,14% (Yên 0/6 chậm; run nhanh
  cao nhất 13,14%).
- **Chậm chắc chắn** ở avg60 ≥65,75% (Vừa 6/6 chậm từ 65,75%;
  Nặng 6/6 chậm).
- **TRỘN ngay quanh ~53%** (leg GAP đợt 125: run means 52,75–
  53,99%, T_startup median 1,2635 s, chậm 4/6, nhanh 2/6 — 2 run
  nhanh chỉ dưới ngưỡng 1,2 s có 3–7 ms).
- Dải làm việc **~45–60%** là dải parent phê duyệt (§12(e) đợt
  125) bao quanh điểm trộn ~53%, với biên ±7–8 điểm. **Nói rõ
  mức độ chắc chắn:** cận trên ~60% được neo bởi "chậm chắc chắn
  từ 65,75%" (cận trên 60% còn cách 5,75 điểm — chưa có dữ liệu
  trong (53,99%, 65,75%)); **cận dưới ~45% là GIẢ THUYẾT CHỜ KIỂM
  CHỨNG, chưa có dữ liệu trực tiếp** — chưa có run chậm nào dưới
  52,75% và chưa có run nhanh nào trên 13,14% ngoài 2 run nhanh
  tại ~53%. Leg dò ~45–55% đợt 126 được giao kiểm chứng đúng cận
  dưới này. **KHÔNG tuyên bố "ngưỡng chuyển = 53%" hay bất kỳ số
  đơn nào** — vùng chuyển là một dải, ở cùng avg60 ~53% kết quả
  chia 4–2.
- **Ngưỡng Yên <30% ĐỨNG, KHÔNG thu hẹp:** không có run chậm nào
  dưới 30% (run chậm thấp nhất ở ~52,75%).

**tickRate theo band (số đo thật, 24 run) — SỬA v0.2 §3:**

| Band | tickRate (tick/s) | T_startup median (s) | chậm (>1,2 s) |
|---|---|---|---|
| Yên (n=6) | 69,5–72,6 (mean 71,50) | 0,337 | 0/6 |
| GAP ~53% (n=6) | 28,07–29,47 (mean 28,52) | 1,264 | 4/6 |
| Vừa (n=6) | 15,28–20,33 (mean 18,54) | 1,843 | 6/6 |
| Nặng (n=6) | 16,54–17,39 (mean 16,77) | 2,219 | 6/6 |

- **Quy tắc v0.2 ("tickRate 2 mức") KHÔNG CÒN ĐÚNG — bị bác bởi
  leg GAP đợt 125:** tickRate ở ~53% là 28,07–29,47 (mean 28,52),
  tách RÕ khỏi cả nhàn ~71,5 (cách 43 điểm, khoảng không chồng
  nhau) lẫn đói ~15–20 (cách ~10 điểm khỏi Vừa, khoảng không
  chồng nhau). tickRate đơn điệu giảm theo avg60 tăng:
  71,5 → 28,5 → 18,5 → 16,8.
- **Quy tắc v0.3: tickRate là chỉ báo đói ≥3 mức tách rõ — nhàn
  ~71,5 / trung gian ~28,5 / đói ~15–20 — KHÔNG dùng để tách mức
  tải trong một band, KHÔNG dùng làm trục phân loại.** Ba mức tách
  rõ là: nhàn, trung gian, đói (Vừa+Nặng). **Vừa↔Nặng VẪN KHÔNG
  tách được:** chênh mean chỉ 1,77 tick/s, khoảng chồng nhau
  (Vừa 15,28–20,33 vs Nặng 16,54–17,39) — Vừa và Nặng gộp chung
  một mức "đói". Trong từng band hẹp, tickRate bão hòa (trong GAP:
  r(avg60, tickRate) = −0,089; r(avg60, T_startup) = +0,076 —
  phẳng trong band).
- Gộp 4 cụm (n=24): r(avg60, tickRate) = **−0,959**;
  r(avg60, T_startup) = **+0,864**; r(tickRate, T_startup) =
  **−0,831**; r(avg60, threadsR) = **+0,979** (xem §7).

**Lưu ý bắt buộc:**
- Các ngưỡng là **điểm giữa các cụm quan sát được**, không phải
  ranh giới vật lý. Dải chuyển ~45–60% là dải làm việc đã phê
  duyệt, cận dưới còn chờ leg 126 kiểm chứng (xem §6).
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
7. **Dial bằng browser ẤM (MỚI, v0.3 — bắt buộc cho mọi leg dò
   ranh giới từ đợt 126 trở đi).** Bài học đợt 125 (§5 LIMITS):
   dial lạnh (chỉ hog, chưa có browser) đọc 25,98% nhưng run means
   ~53% — tải của chính browser/vite lúc chạy cộng thêm **~27
   điểm avg60**. Dial không có browser **đánh giá thấp** avg60 lúc
   chạy ~27 điểm, khiến cửa sổ mục tiêu [30, 50] bị vượt ở mức run
   (53% > 50%) dù dial đọc dưới cửa sổ. Từ đợt 126, leg dò ranh
   giới PHẢI dial khi browser đã ấm:
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
     giấu.
   - (d) Cửa sổ hợp lệ (GAP) KHÔNG thu hẹp theo đích dial — bracket
     trước run đo lúc browser chưa chạy nên luôn thấp hơn run means
     ~25–30 điểm; thu hẹp cửa sổ hợp lệ sẽ kẹt leg ở cổng bracket
     dù run sẽ rơi đúng đích. Việc thu hẹp dải là KẾT LUẬN sau leg,
     không phải tiêu chí VOID trong leg.

## 5. Luật VOID / hợp lệ cho run leg B (theo trục PSI — giữ nguyên v0.2)

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

## 6. Trả lời câu hỏi ranh giới chuyển — v0.3 điền dải (bằng dữ liệu leg GAP đợt 125)

- **Ranh giới chuyển chế độ chậm = DẢI ~45–60% (không phải một
  số).** Bằng chứng: Yên 0/6 chậm tới 13,14%; Vừa 6/6 chậm từ
  65,75%; leg GAP TRỘN 4 chậm/2 nhanh tại run means 52,75–53,99%
  (T_startup median 1,2635 s; 2 run nhanh chỉ dưới ngưỡng 1,2 s có
  3–7 ms — vùng chuyển là một dải, ở cùng avg60 ~53% kết quả chia
  4–2).
- **Cận dưới ~45% CHƯA được đo trực tiếp — là giả thuyết chờ leg
  126 kiểm chứng.** Leg dò ~45–55% đợt 126 (dial bằng browser ấm,
  prereg `hidden_files/round126-t4/prereg-def03-leg4555.md` §6) sẽ
  quyết định: 6/6 nhanh dưới 53% → dải thu hẹp thành (M%, ~53%];
  6/6 chậm dưới 53% → dải thu hẹp xuống dưới M% và 2 run nhanh đợt
  125 được diễn giải lại là nhiễu ngưỡng; trộn nữa → dải = giao hai
  vùng trộn. Kết quả leg 126 đưa vào DEF v0.3.1 (hoặc v0.4) — v0.3
  này KHÔNG tự điền trước kết quả đó.
- **Ngưỡng Yên <30% ĐỨNG** (không có run chậm nào dưới 30%).
- **tickRate ≥3 mức (sửa v0.2 §3):** xem bảng §3 — mức trung gian
  28,07–29,47 tại ~53% tách rõ khỏi nhàn ~71,5 và đói ~15–20;
  Vừa↔Nặng vẫn không tách (gộp một mức "đói").
- **Pha (b) T_seek MIỄN NHIỄM với tải (giữ ở n=24):** T_seek max
  0,001 s trên cả 24 run (Yên + GAP + Vừa + Nặng) — seek tức thì
  một khi metadata đã load; toàn bộ chậm nằm ở pha startup/metadata.

**Số liệu phụ theo band (24 run):** threadsR mean Yên 2,0 → GAP
8,0 → Vừa 9,3 → Nặng 13,8 (r(avg60, threadsR) = +0,98 — trục phụ
đứng); totalFrames Yên 384 → GAP 290–324 → Vừa 161–279 → Nặng
163–213; dropped frames 0 → GAP 0–1 → Vừa 2–7 → Nặng 6–11;
seekImmMs Yên 271–522 ms → GAP 1092–1318 ms → Vừa 1621–2810 ms →
Nặng 1590–3039 ms — mọi chỉ báo phụ đều đơn điệu theo avg60 và
đặt GAP đúng vị trí trung gian.

## 7. Tương quan gộp (n=24) — KHÔNG kết luận nhân quả

| Cặp | r (gộp 4 cụm, n=24) | Đọc |
|---|---|---|
| avg60 ↔ T_startup | **+0,864** (n=18: +0,87) | Tương quan mạnh giữa band, nhưng trong-band yếu/hỗn hợp (§6) |
| avg60 ↔ tickRate | **−0,959** (n=18: −0,97) | tickRate là triệu chứng đói theo band (§3) |
| tickRate ↔ T_startup | **−0,831** (n=18: −0,87) | Cùng một bước nhảy giữa band, không phải cơ chế |
| avg60 ↔ threadsR | **+0,979** (n=18: +0,98) | threadsR đơn điệu theo band — trục phụ đứng |

**KHÔNG kết luận nhân quả:** 1 cây (baseline), 4 boot (Yên trên
boot #67?, Vừa/Nặng trên boot #68?, GAP trên boot #70 — số boot
tạm, chờ T6 recount), sibling đang chạy, n=6/cụm. So sánh giữa
các cụm vẫn có nhiễu boot; nhưng bước nhảy 0,337 → 1,264 → 1,843 s
và tickRate 71,5 → 28,5 → 18,5 lớn hơn mọi nhiễu boot từng thấy
giữa các leg Yên (median Yên các đợt 0,3–0,5 s). Trong từng cụm
hẹp, mọi tương quan đều phẳng (GAP: r≈−0,09/+0,08) — chỉ có bước
nhảy GIỮA các cụm là rõ.

## 8. load1 vẫn vô hiệu (bằng chứng mới từ leg 125)

Run 4 GAP load1 0,32→3,98; run 5 GAP 3,98→5,10 ở cùng PSI ~53%;
run 11 Nặng đợt 124 load1 10,18/12,17 vs run 7 Nặng 0,96/0,56 ở
cùng PSI ~90%. load1 không dùng trong bất kỳ tiêu chí nào, đúng
DEF v0.1 — v0.3 giữ nguyên.

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
- **n nhỏ, 4 boot:** 24 run gộp nhưng chỉ 1 cây và 4 boot; Yên đo
  trên boot khác Vừa/Nặng, GAP đo trên boot khác nữa — so sánh
  giữa cụm có nhiễu boot.
- **threadsR nhiễu ở mức hog nhỏ:** pilot: L6 threadsR 20,8 vs
  L12 18,4 (đảo ngược) — threadsR chỉ dùng để xác nhận, không
  dùng để tách mức.
- **avg60 trễ ~60 s** sau mọi thay đổi tải (xem §4.1 + RECOV
  pilot). Đừng bao giờ đọc avg60 ngay sau khi đổi hog.
- **Dải chuyển ~45–60%: cận dưới ~45% là giả thuyết chờ leg 126
  kiểm chứng** (xem §6). Mọi kết luận "chế độ chậm bắt đầu ở avg60
  X%" với X là một số đơn đều là suy đoán — cấm tuyên bố.
- **Dial lạnh đánh giá thấp avg60 lúc chạy ~27 điểm** (bài học
  đợt 125 §5) — leg dò ranh giới từ đợt 126 phải dial bằng browser
  ấm (§4.7). Số liệu dial lạnh cũ không dùng để đặt đích run nữa.
- Định nghĩa này **không thay đổi** định nghĩa bar F2
  (T_startup/T_seek + ngưỡng, T3-120 §1) — chỉ thay **trục
  tải** mà leg B chạy trên đó.

## 10. Verdict F2 — v0.3 KHÔNG xét lại

**Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (quyết parent cửa (a) đợt
123 §12.1, nhắc lại trong quyết đợt 124 §12.2a và đợt 125 §12).
Leg GAP đợt 125 chỉ là dữ liệu hiệu chỉnh DEF — nó không xét
bar/verdict, không gộp số với bộ verdict. DEF v0.3 này cũng vậy:
nó là định nghĩa trục tải đã hiệu chỉnh, không phải một phán quyết
bar F2 mới. Lật verdict cần ≥6 run nhanh trên cùng một boot theo
luật T3-120 §6 nợ #1 (chú ý: boot #70 đợt 125 đã bị reboot #71?
thay thế lúc 23:25:41Z 16/11 — bộ run nhanh cũ KHÔNG dùng được nữa).

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
- **v0.3** (17/11/2026, T4 đợt 126 — file này): ranh giới chuyển
  thành **DẢI ~45–60%** (TRỘN 4/2 tại ~53%, chậm chắc chắn từ
  65,75%, nhanh chắc chắn tới 13,14%; cận dưới ~45% là giả thuyết
  chờ leg 126 kiểm chứng); tickRate sửa thành **chỉ báo đói ≥3
  mức** (nhàn ~71,5 / trung gian ~28,5 / đói ~15–20; Vừa↔Nặng vẫn
  không tách); dial bằng **browser ấm** (§4.7, bài học +27 điểm
  đợt 125); tương quan gộp n=24 (r(avg60,tickRate)=−0,959,
  r(avg60,T_startup)=+0,864); verdict đợt 120 vẫn đứng.
- **v0.3.1 / v0.4 (dự kiến):** sau leg dò ~45–55% đợt 126 — thu
  hẹp dải chuyển theo bảng diễn giải đã đăng ký trước trong prereg
  đợt 126 §6 (6/6 nhanh → dải (M%, ~53%]; 6/6 chậm → dải xuống
  dưới M% + diễn giải lại 2 run nhanh đợt 125 là nhiễu ngưỡng;
  trộn nữa → dải = giao hai vùng trộn).
