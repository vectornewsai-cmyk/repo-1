# Định nghĩa trục tải PSI cho bar F2 leg B — v0.2 (CHUẨN, đã hiệu chỉnh bằng leg tải đợt 124)

**Ngày:** 17/11/2026. **Đợt:** 125, luồng T4. **Trạng thái:** ĐỊNH NGHĨA
CHUẨN v0.2 — parent đã **PHÊ DUYỆT** viết theo quyết đợt 124 §12.2a
(giữ ngưỡng 3 band; tickRate = chỉ báo đói 2 mức; ranh giới chuyển
chế độ chậm chưa xác định — khoảng trống avg60 13–66%).
**File này THAY THẾ v0.1 làm chuẩn hiện hành.** File v0.1
(`docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`) được **giữ nguyên vẹn
làm lịch sử** — không sửa, không xóa.
**Phạm vi:** chỉ dùng cho bar F2 leg B (Q8SEEKFAST) và các đo tải
liên quan trong cell này (VM Secure, 4 vCPU nhìn thấy, ngân sách
chia sẻ ~1,5 CPU). **KHÔNG dùng load1 làm biến tải trong bất kỳ
kết luận nào** — load1 chỉ ghi để đối chiếu (đã chứng minh vô hiệu,
xem §8). 19,63 vẫn chỉ là NHÃN LỊCH SỬ của lượt s77c.

**Cơ sở dữ liệu của v0.2:** leg B Yên đợt 123 (6 run, boot #67?,
cây baseline) + leg tải đợt 124 (Vừa 6/6 VALID + Nặng 6/6 VALID,
12 run, boot #68?, cây baseline) = **18 run gộp**. Chi tiết:
`docs/PHASE9_ROUND124_T4_LEGLOAD_LIMITS.md` (§0–§4) và
`docs/PHASE9_ROUND123_T4_LEGB_LIMITS.md`. Trả lời đầy đủ 3 câu hỏi
hiệu chỉnh của DEF v0.1 §6 (xem §6 dưới) — nghĩa vụ hiệu chỉnh sau
đợt 122 của v0.1 đến đây là **ĐÃ HOÀN THÀNH**.

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
- **Bằng chứng phân biệt mức (pilot đợt 121 + leg tải đợt 124):**
  PSI phân biệt được yên / vừa / nặng ở đầu thấp, và **bão hòa
  trên ~6 hog** (6 vs 12 hog chỉ chênh ~4 điểm; leg 124: 6 hog →
  77,94%, 8 hog → 84,82% — tăng hog không tăng CPU cháy tổng bao
  nhiêu, tổng chỉ ~1 CPU cả hai leg).

## 2. Trục chính, trục phụ, chỉ báo đi kèm

| Vai trò | Thước đo | Cách đo | Dùng để |
|---|---|---|---|
| **Chính** | **PSI cpu.some avg60** | đọc `/proc/pressure/cpu` mỗi 5 s trong lúc phát; lấy **trung bình các mẫu trong cửa sổ run** + 2 điểm bracket (đầu/cuối run) | Phân loại run vào band tải; tiêu chí VOID |
| Phụ | **threadsR** (số runnable, trường 4 của `/proc/loadavg`) | cùng mẫu 5 s; lấy trung bình trong cửa sổ run | Xác nhận "cùng tải thật" (cùng cấu hình hog → threadsR tương đương); KHÔNG dùng để tách band |
| Chỉ báo đói 2 mức (triệu chứng) | **tickRate** (blendTick, tick/s trong browser) | như các đợt trước, ghi theo quý | **Chỉ báo đói, KHÔNG làm trục** (nó là kết quả, không phải đầu vào). v0.2 xác định: tickRate có **2 mức** — nhàn ~70+ tick/s vs đói ~15–20 tick/s. Nó tách RÕ Yên↔Vừa/Nặng, nhưng **KHÔNG tách Vừa↔Nặng** (chênh chỉ ~1,8 tick/s, khoảng chồng nhau) và bão hòa trong mỗi band — xem §3 |
| Xác nhận hog chạy thật | **hog burn** (utime hog, CPU) + **cgroup `usage_usec` rate** | utime từng PID hog; `usage_usec` tăng / thời gian | Xác nhận hog có đốt CPU không; nếu burn ≈ 0 trong khi PSI cao → hog đang bị ambient bóp, ghi cờ (xem §4) |

**Không dùng:** load1/load5/load15 (vô hiệu); load1 chỉ ghi vào
log để đối chiếu, không xuất hiện trong bất kỳ tiêu chí hợp lệ,
band, hay kết luận nào.

## 3. Các mức tải (band) — v0.2, GIỮ NGUYÊN ngưỡng v0.1

Ngưỡng v0.1 **ĐỨNG, không dời** — leg tải đợt 124 đã đạt được cả
hai band tải khi browser chạy, bracket ổn định trong band, và ba
cụm đo tách nhau rõ.

| Band | PSI some avg60 | Căn cứ đo thật (leg B Yên đợt 123 + leg tải đợt 124, 18 run) |
|---|---|---|
| **Yên** | **< 30%** | avg60 mean từng run 4,38–13,14% (mean các run 7,02%). Cao nhất đo được 13,14% — cách ngưỡng 30 gần 17 điểm |
| **Vừa** | **30–80%** | avg60 mean từng run 65,75–75,64% (mean các run 69,71%). Đạt được với **3 hog** (2 hog chỉ 24,30% — ngoài band dưới), không phải 2 hog như pilot gợi ý |
| **Nặng** | **> 80%** | avg60 mean từng run 89,23–91,76% (mean các run 90,69%). Đạt được với **8 hog** (6 hog chỉ 77,94% — ngoài band dưới), không phải 6 hog như pilot gợi ý |

**Khoảng trống giữa các cụm (chưa có dữ liệu):** Yên max 13,14%
→ Vừa min 65,75% = **52 điểm**; Vừa max 75,64% → Nặng min
89,23% = 14 điểm. Khoảng trống Yên↔Vừa (13–66%) là nơi chứa
**ranh giới chuyển chế độ chậm — CHƯA XÁC ĐỊNH** (xem §6).

**tickRate theo band (số đo thật, 18 run):**

| Band | tickRate (tick/s) | T_startup median (s) | chậm (>1,2 s) |
|---|---|---|---|
| Yên (n=6) | 69,5–72,6 (mean 71,50) | 0,337 | 0/6 |
| Vừa (n=6) | 15,28–20,33 (mean 18,54) | 1,843 | 6/6 |
| Nặng (n=6) | 16,54–17,39 (mean 16,77) | 2,219 | 6/6 |

- tickRate tách Yên↔Vừa/Nặng rõ (71,50 vs 18,54/16,77) nhưng
  **KHÔNG tách Vừa↔Nặng**: chênh mean chỉ 1,77 tick/s, khoảng
  chồng nhau (Vừa 15,28–20,33 vs Nặng 16,54–17,39). Gộp 3 band:
  r(avg60, tickRate) = **−0,97** — tương quan +0,90 của T2-120 nay
  đã giải thích được: nó so sánh Yên vs Nặng (chênh lệch lớn giữa
  band), không phải trong-band. TRONG từng band hẹp, tickRate bão
  hòa (Yên r=−0,13 — giữ nguyên kết luận đợt 123).
- **Quy tắc v0.2: tickRate là chỉ báo đói 2 mức (nhàn ~70+ vs
  đói ~15–20), KHÔNG dùng để tách mức tải trong một band, KHÔNG
  dùng để tách Vừa↔Nặng, KHÔNG dùng làm trục phân loại.**

**Lưu ý bắt buộc:**
- Các ngưỡng là **điểm giữa các cụm quan sát được**, không phải
  ranh giới vật lý. Ngưỡng chuyển chế độ chậm nằm trong khoảng
  trống 13–66% — **KHÔNG tuyên bố số** cho tới khi leg trung gian
  đo được (xem §6).
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
6. **Leg trung gian / leg dò ranh giới (mới, v0.2):** khi mục tiêu
   là dò ranh giới chuyển chế độ (không phải validate một band),
   prereg phải phân biệt **cửa sổ mục tiêu** (target window, vd
   30–50%) với **cửa sổ hợp lệ** (validity window = khoảng trống
   chưa đo, vd 13–66%). Run hợp lệ khi đo được nằm trong cửa sổ
   hợp lệ + qua mọi kiểm §5; điểm dữ liệu là avg60 đo được của
   từng run, không phải band danh nghĩa. Số hog tối đa và cách
   dial (kể cả trường hợp dial không chạm cửa sổ mục tiêu) phải
   đăng ký trước trong prereg — không tự ý thêm hog ngoài đăng ký.

## 5. Luật VOID / hợp lệ cho run leg B (theo trục PSI)

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
30–50%) KHÔNG phải tiêu chí VOID — chỉ là đích dial; dial
không chạm đích thì ghi TARGET-MISS, run vẫn hợp lệ nếu nằm
trong cửa sổ hợp lệ.

Run VOID vẫn ghi đầy đủ số liệu + lý do VOID vào LIMITS (không
giấu VOID). Không chạy bù quá ngân sách attempt đã đăng ký trong
prereg.

## 6. Trả lời 3 câu hỏi hiệu chỉnh của DEF v0.1 §6 (bằng dữ liệu leg tải đợt 124)

- **(i) PSI avg60 thực tế lúc browser chạy ở mỗi band:** Yên
  4,38–13,14% (mean 7,02%); Vừa 65,75–75,64% (mean 69,71%); Nặng
  89,23–91,76% (mean 90,69%). Cả hai band tải đều đạt được khi
  browser chạy, bracket ổn định trong band. **Ngưỡng v0.1 ĐỨNG,
  không dời** (xem §3).
- **(ii) T_startup theo band PSI — chế độ chậm CÓ tách theo
  band.** Yên 0/6 chậm → Vừa 6/6 → Nặng 6/6 (median 0,337 →
  1,843 → 2,219 s). Gộp 3 band: r(avg60, T_startup) = **+0,87**.
  TRONG từng band, tương quan yếu/hỗn hợp (Yên +0,76; Vừa +0,36;
  Nặng −0,57) — trong-band, PSI không dự báo T_startup; chỉ có
  bước nhảy GIỮA các band là rõ. **Ranh giới chuyển CHƯA xác
  định:** khoảng trống avg60 13–66% chưa có dữ liệu — KHÔNG tuyên
  bố ngưỡng chuyển số. Leg trung gian đợt 125 (1–2 hog trên nền
  yên, nhắm avg60 ~30–50%, 6 run, đăng ký trước — quyết parent
  đợt 124 §12.2b) được giao dò ranh giới này; kết quả của nó sẽ
  đưa vào DEF v0.3 (hoặc v0.2.1) — **v0.2 này KHÔNG tự điền số
  ranh giới**.
- **(iii) tickRate theo band PSI — ĐIỀU CHỈNH kết luận đợt 123.**
  Gộp 3 band: r(avg60, tickRate) = **−0,97**; r(tickRate,
  T_startup) = −0,87. Kết luận đợt 123 ("tickRate không tách mức
  tải", r=−0,13) chỉ đúng TRONG band Yên hẹp — khi có đủ 3 band,
  tickRate tách RÕ Yên↔Vừa/Nặng. NHƯNG tickRate KHÔNG tách
  Vừa↔Nặng và bão hòa trong mỗi band → quy tắc v0.2 ở §3.

**Pha (b) T_seek MIỄN NHIỄM với tải:** 0,000 s ở cả 18 run (Yên +
Vừa + Nặng) — seek tức thì một khi metadata đã load; toàn bộ chậm
nằm ở pha startup/metadata. (Yên đợt 123: max 0,001 s ở độ chính
xác 3 chữ số — cùng một thực tế: seek <10 ms, dưới phân giải evs.)

**Số liệu phụ theo band (18 run):** threadsR mean 2,0 → 9,3 →
13,8 (r(avg60, threadsR) = +0,98 — xác nhận vai trò trục phụ);
totalFrames Yên 384 → Vừa 161–279 → Nặng 163–213; dropped frames
0 → 2–7 → 6–11; seekImmMs Yên 271–522 ms → Vừa 1621–2810 ms →
Nặng 1590–3039 ms.

## 7. Tương quan gộp (n=18) — KHÔNG kết luận nhân quả

| Cặp | r (gộp 3 band, n=18) | Đọc |
|---|---|---|
| avg60 ↔ T_startup | **+0,87** | Tương quan mạnh giữa band, nhưng trong-band yếu/hỗn hợp (§6ii) |
| avg60 ↔ tickRate | **−0,97** | tickRate là triệu chứng đói theo band (§3) |
| avg60 ↔ threadsR | **+0,98** | threadsR đơn điệu theo band — trục phụ đứng |
| tickRate ↔ T_startup | **−0,87** | Cùng một bước nhảy giữa band, không phải cơ chế |

**KHÔNG kết luận nhân quả:** 1 cây (baseline), 2 boot (Yên trên
boot #67?, Vừa/Nặng trên boot #68?), sibling đang chạy, n=6/band.
So sánh giữa các band vẫn có nhiễu boot; nhưng bước nhảy 0,337 →
1,843 s (×5,5) và tickRate 71,5 → 18,5 (÷3,9) lớn hơn mọi nhiễu
boot từng thấy giữa các leg Yên (median Yên các đợt 0,3–0,5 s).

## 8. load1 vẫn vô hiệu (bằng chứng mới từ leg 124)

Run 11 Nặng load1 10,18/12,17 vs run 7 Nặng 0,96/0,56 ở cùng PSI
~90%; run 5 Vừa load1 0,95/0,64 trong khi run 1 Vừa 3,82/6,13.
load1 không dùng trong bất kỳ tiêu chí nào, đúng DEF v0.1 — v0.2
giữ nguyên.

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
- **n nhỏ, 2 boot:** 18 run gộp nhưng chỉ 1 cây và 2 boot; Yên
  đo trên boot khác Vừa/Nặng — so sánh giữa band có nhiễu boot.
- **threadsR nhiễu ở mức hog nhỏ:** pilot: L6 threadsR 20,8 vs
  L12 18,4 (đảo ngược) — threadsR chỉ dùng để xác nhận, không
  dùng để tách mức.
- **avg60 trễ ~60 s** sau mọi thay đổi tải (xem §4.1 + RECOV
  pilot). Đừng bao giờ đọc avg60 ngay sau khi đổi hog.
- **Ranh giới chuyển chế độ chậm CHƯA BIẾT** (khoảng trống
  13–66%). Mọi kết luận "chế độ chậm bắt đầu ở avg60 X%" trước
  khi leg trung gian có số liệu đều là suy đoán — cấm tuyên bố.
- Định nghĩa này **không thay đổi** định nghĩa bar F2
  (T_startup/T_seek + ngưỡng, T3-120 §1) — chỉ thay **trục
  tải** mà leg B chạy trên đó.

## 10. Verdict F2 — v0.2 KHÔNG xét lại

**Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (quyết parent cửa (a) đợt
123 §12.1, nhắc lại trong quyết đợt 124 §12.2a). Leg tải đợt 124
chỉ là dữ liệu hiệu chỉnh DEF — nó không xét bar/verdict, không
gộp số với bộ verdict. DEF v0.2 này cũng vậy: nó là định nghĩa
trục tải đã hiệu chỉnh, không phải một phán quyết bar F2 mới.
Lật verdict cần ≥6 run nhanh trên cùng một boot theo luật
T3-120 §6 nợ #1 (chú ý: boot #61 đã bị reboot #62 thay thế lúc
08:25:47Z 16/11 — bộ 3 nhanh cũ KHÔNG dùng được nữa; boot #68?
cũng đã bị reboot #69? thay thế lúc 20:35:11Z 16/11).

## 11. Lịch sử phiên bản

- **v0.1** (16/11/2026, T2 đợt 121 — file
  `docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`, giữ nguyên): ngưỡng
  tạm thời rút từ pilot n=1 + dữ liệu đợt 120; bắt buộc hiệu
  chỉnh sau leg tải.
- **v0.2** (17/11/2026, T4 đợt 125 — file này): ngưỡng 3 band
  GIỮ NGUYÊN, có cơ sở đo thật 18 run; tickRate hạ xuống chỉ
  báo đói 2 mức; ranh giới chuyển chế độ chậm ghi rõ CHƯA XÁC
  ĐỊNH (khoảng trống 13–66%); pha (b) T_seek miễn nhiễm với tải;
  tương quan gộp r(avg60,T_startup)=+0,87, r(avg60,tickRate)=−0,97
  (n=18, không kết luận nhân quả); verdict đợt 120 vẫn đứng.
- **v0.3 (dự kiến):** sau leg trung gian đợt 125 — điền ranh
  giới chuyển (hoặc thu hẹp khoảng trống), và xem có cần dời
  ngưỡng Yên không nếu run chậm xuất hiện dưới 30%.
