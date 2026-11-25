# PHASE9 ROUND174 T7 — RUN 173 TIMEOUT 23:36:04Z (VƯỢT NGÂN SÁCH 13 S — TIMEOUT ĐẦU TIÊN KỂ TỪ RUN 147, ĐỨT CHUỖI SUCCEEDED 150–172) + REBOOT #86 MỚI GIỮA PHIÊN (btime 01:01:37Z — RUN 174 VIẾT LẠI LẦN 1, REQUEUE +49,418 S SÁT BIÊN TRÊN 0,382 S) + DR 23:00Z KHÔNG BAO GIỜ XUẤT HIỆN (KIỂM 8 LẦN) + F-173-T0-3/F-173-T7-2 ĐÃ CHỐT

- **Luồng:** T7 đợt 174 (lượt cron 06:35:51 +07 23/11/2026 = 23:35:51Z 22/11). Nhiệm vụ theo brief T7-174: (1) kết cục run 173 — run này vẫn `running` lúc T7-173 đóng cờ (~23:19Z, tuổi gốc 9.358 s, còn 1.442 s tới hạn 23:35:51Z; 2 lần viết lại tại #84 + #85 lúc đó); **boot mới 3c704685, btime 22:59:36Z (có thể là #85) xảy ra sau đó** — kiểm DB TƯƠI: SUCCEEDED hay FAILED/TIMEOUT, margin, claimed→finished, có bị viết lại lần 3 tại boot 22:59:36Z không, HB/DR/jitter; (2) CHỐT F-173-T0-3 (claimed_at DB 20:15:10Z của run 172 khác ghi nhận T7-172 — đối chiếu từ DB, kết luận số nào đúng, có đổi kết cục run 172 không); (3) CHỐT F-173-T7-2 (số thứ tự ca claimed→finished ≥60 s — đếm lại từ DB theo MỘT định nghĩa thống nhất); (4) DR 23:00Z có xuất hiện muộn sau 23:11:49Z không; (5) run 174: trạng thái, jitter, slot HB/DR, lũy kế; (6) xác minh 9 nguồn cho reboot mới nếu có trong đợt 174; (7) kiểm boot_id/btime lúc đóng cờ để đối chiếu với T0 (bài học F-171-T10-2).
- **Boot trong phiên:** mở phiên đã là **3c704685-a16c-4b61-8573-af6eb7cb48c6** (btime /proc/stat 1795388376 = 22:59:36Z — **reboot #85, GIỜ THẬT**, T7 xác minh 9 nguồn lúc mở + **T0-174 XÁC NHẬN 9 nguồn độc lập — KHỚP**; gap #84→#85 = 7.101 s — KHỚP T0-174/T7-173). **Reboot #86 MỚI GIỮA PHIÊN** (btime 1795395697 = 01:01:37Z 23/11, boot **70b7f7ee-2e0b-4565-b019-bdabc2c6e92c** — T7 xác minh 9 nguồn lúc ~01:02Z; số hiệu #86 theo đếm tuần tự — **CHỜ T0-175 xác minh 9 nguồn** vì T0-174 đóng cờ 23:53Z, TRƯỚC #86). **Boot lúc đóng cờ vẫn 70b7f7ee** (kiểm đầu + cuối phiên #86 — KHÔNG có reboot mới sau #86; bài học F-171-T10-2 đã áp dụng: T7 phát hiện #86 trong vòng 65 s sau btime).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 173/174 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa hẹp + cửa rộng + kiểm run spanning btime; đếm lại toàn bộ ca claimed→finished ≥60 s từ DB), LIMITS T7-173 + aggregate 173 §7 + §10.5 (xv) + §12.3 (m)/(n)/(o) + cờ round174-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done (đối chiếu chéo; **t9 LIMITS/cờ CHƯA CÓ lúc T7 đóng — giao T10-174 tổng hợp**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 173 kết cục? | **`timeout`** 23:36:04Z (event 23:36:04.642778Z, eid 10229), wall từ started gốc **10.813 s**, **VƯỢT ngân sách 13 s (margin −13 s)**, claimed→finished **13 s** | §2.1, Phụ lục A |
| Run 173 có bị #85 viết lại lần 3 không? | **KHÔNG** — đúng 2 lần viết lại (#84 + #85), 8 event, 0 event sau timeout | §2.1 |
| F-173-T0-3 (claimed_at run 172)? | **CHỐT: số DB cuối 20:15:10Z ĐÚNG**; ghi nhận T7-172 (không đổi lúc ~19:55Z) ĐÚNG lúc đọc; claimed đổi trong (19:55Z, 20:15:10Z]; **109 s TÍNH, kết cục run 172 KHÔNG đổi** | §2.2 |
| F-173-T7-2 (số thứ tự ca ≥60 s)? | **CHỐT theo định nghĩa thống nhất: run 172 là ca thứ TÁM** (cửa sổ từ 154: 156/159/164/166/167/170/171/172); chuỗi T7 (164+): thứ sáu; chuỗi T2 (164+ trừ 170): thứ năm — parent quyết định nghĩa dùng | §2.3 |
| DR 23:00Z có xuất hiện muộn không? | **KHÔNG BAO GIỜ XUẤT HIỆN** — 8 lần kiểm (3 đợt 173 + 5 đợt 174), lần cuối 181' sau giờ hẹn; slot mất hẳn trong cửa sổ recovery sau #85 | §2.6 |
| Reboot #86 (mới giữa phiên)? | **Boot 70b7f7ee, btime 01:01:37Z, GIỜ THẬT** (T7 xác minh 9 nguồn); gap #85→#86 = **7.321 s**; số hiệu #86 chờ T0-175 xác minh 9 nguồn | §2.4 |
| (m) #86? | **DƯƠNG ỨNG VIÊN (sơ bộ — lean T7)** — requeue +49,418 s TRONG dải, **sát biên TRÊN 0,382 s (sát biên nhất từng ghi)**; 1 run sống + 1 requeue duy nhất cửa hẹp lẫn cửa rộng | §2.4 |
| Run 174? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 8.757 s lúc 02:01:48Z, còn 2.043 s tới hạn 02:35:51Z); **jitter +13 s — chuỗi jitter 0 s 26 đợt DỨT**; **1 lần viết lại tại #86**; claimed không đổi. Kết cục thuộc T7-175 | §2.5 |
| Cửa slot đợt 174? | **HB 6/6 (toàn −316 s) + DR 3/4 — DR 23:00Z THIẾU** (kiểm 5 lần đợt này); **CỬA KHÔNG LÀNH** (chuỗi cửa lành đã dứt từ đợt 173). Lũy kế: HB **44/435**, DR **51/290**. Muộn HB giữ 9 | §2.6 |
| Đồng hồ lúc mở / trong phiên? | **Cloudflare 0–1 s** (lúc mở chênh 1 s; lúc phát hiện #86 chênh 0 s) — khớp T0/T2-174 | §2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–173): heartbeat **44/435 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **51/290 slot thiếu** (số thiếu +1 — DR 23:00Z, mẫu số +4). Muộn HB lũy kế **GIỮ 9** (0 muộn mới — đợt thứ mười ba liên tiếp vắng muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 173 — TIMEOUT 23:36:04Z, vượt ngân sách 13 s, CHỈ 2 lần viết lại (đọc #1 + kiểm lại cuối đọc #8 khớp nhau + events đối chiếu trực tiếp + T0/T1-174 đối chiếu số học)

Run 173 (`d95c3e04-a069-432b-a5c6-e615bfe306a1`, sched 1795379751 = 20:35:51Z 22/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795379751 = 20:35:51Z 22/11 |
| started_at (gốc → VIẾT LẠI ×2) | 1795379751 → 1795381320 → **1795388410 = 23:00:10Z** (dịch +1.569 s rồi +7.090 s; tổng +8.659 s) — KHÔNG đổi sau đó |
| finished_at_utc | 1795390564 = 23:36:04Z (event `timeout` 23:36:04.642778Z, eid 10229) |
| status | **`timeout`** — attempt 1, error_text "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run.", worker_execution_timed_out true |
| worker_claimed_at_utc | 1795390551 = 23:35:51Z (finished − 13 s) — **ĐÃ ĐỔI** so với đọc cuối T7-173 (1795379751 không đổi tới 23:11:49Z); đổi trong (23:11:49Z, 23:36:04Z]; giá trị mới **ĐÚNG bằng hạn ngân sách (sched + 10.800 s)** |
| worker_boot_generation | cron_boot_4cb68ccd677d4e09b868d3993efa1477 (boot #85) |
| Wall từ started gốc | 1795390564 − 1795379751 = **10.813 s** (3h00m13s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795390551 = 23:35:51Z — finished SAU hạn **13 s (margin −13 s)** |
| Wall từ started viết lại lần 2 | 1795390564 − 1795388410 = **2.154 s** (35m54s thực thi trên boot #85 sau viết lại lần 2) |

- Events run 173 (đầy đủ, **đúng 8 event, không thiếu, 0 event mới sau timeout** — đọc #1 ~23:38Z và đọc lại cuối #8 ~02:01Z khớp nhau ở mọi trường + mọi event): `dispatched` 20:35:51.082Z (10187) + `requeued_after_restart` 21:02:00.482Z (10197) + `dispatched` 21:02:00.779Z (10198) + `reattached_after_restart` 21:02:00.905Z (10199) + `requeued_after_restart` 23:00:10.397Z (10222) + `dispatched` 23:00:10.503Z (10223) + `reattached_after_restart` 23:00:10.632Z (10224) + **`timeout` 23:36:04.643Z (10229)**. **ĐÚNG 2 LẦN VIẾT LẠI** (#84 + #85) — không có lần viết lại thứ ba.
- **TIMEOUT đầu tiên kể từ run 147** (run 144 cũng timeout; trong cửa sổ 150–173 mọi run đều succeeded): **chuỗi succeeded 150–172 = 23 run liên tiếp ĐỨT tại run 173.** T7 chỉ ghi nhận, không suy luận nguyên nhân (run 173 là lượt cron, không phải code repo).
- **Claimed_at run 173 đổi lúc cuối:** T7-173 đọc 8 lần đều thấy claimed = 1795379751 (không đổi tới 23:11:49Z); DB tươi lúc T7-174 đọc #1 (~23:38Z) đã là 1795390551 = đúng hạn ngân sách 23:35:51Z. Cùng mẫu run 171 (claimed đổi theo khi resume) và run 172 (claimed đổi muộn — xem §2.2): claimed_at được cập nhật khi worker claim pha cuối / lúc timeout. T7 ghi đúng giá trị DB cuối cùng, không suy đoán cơ chế daemon.
- **Run 174 bắt đầu đúng giây run 173 timeout xong** (started 23:36:04Z = finished_at run 173) — jitter +13 s của run 174 là hệ quả trực tiếp (xem §2.5).
- T0-174 + T1-174 đối chiếu số học độc lập: **TIMEOUT 23:36:04Z, wall 10.813 s, 8 event, 2 lần viết lại** — KHỚP T7 từng số (T0-174 ghi rõ "run 173 TIMEOUT 23:36:04Z trên boot_gen #85; đúng 8 event, đúng 2 lần viết lại (#84 + #85), không thêm").
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: 1.452 s; 162: 1.065 s; 163: 1.058 s; 164: 454 s; 165: 982 s; 166: 531 s; 167: 587 s; 168: 1.016 s; 169: 1.087 s; 170: 888 s; 171: **385 s**; 172: **1.132 s**; 173: **−13 s (TIMEOUT — vượt ngân sách)**. T7 chỉ ghi nhận, không suy luận nguyên nhân.

### 2.2 CHỐT F-173-T0-3 — claimed_at run 172: số DB cuối 20:15:10Z ĐÚNG; ghi nhận T7-172 ĐÚNG lúc đọc; 109 s TÍNH; kết cục run 172 KHÔNG đổi

- **DB tươi (đọc #1 ~23:38Z + đọc lại cuối #8 ~02:01Z khớp nhau):** run 172 (`b12b8a64-343b-486f-8ad2-5a82d82b1e2b`) worker_claimed_at_utc = **1795378510 = 20:15:10Z**; finished_at_utc = 1795378619 = 20:16:59Z; claimed→finished = **109 s** theo epoch (109,553 s chính xác theo event `succeeded` 20:16:59.553Z — T0/T2-173 khớp từng số). Mọi trường khác không đổi so với T7-173 (status succeeded, 1 lần viết lại tại #82, 5 event, margin 1.132 s, wall 9.668 s).
- **Ghi nhận T7-172:** "claimed_at KHÔNG đổi (1795368951)" — T7-172 đọc lần cuối ~19:55Z, **TRƯỚC khi run 172 finish** (20:16:59Z). Lúc đó claimed_at thật sự vẫn là 1795368951 (= sched) — **ghi nhận này ĐÚNG tại thời điểm đọc**, không phải số sai.
- **Kết luận:** claimed_at được cập nhật **sau 19:55Z và trước/trong lúc finish — cụ thể thành 20:15:10Z** (claim pha cuối, 109 s trước finish). Cùng mẫu đã biết: run 171 claimed đổi theo khi resume (T7-172 ghi rõ); run 173 claimed đổi lúc timeout thành đúng hạn ngân sách (§2.1). **Không có mâu thuẫn** — hai giá trị đúng ở hai thời điểm đọc khác nhau; giá trị DB cuối cùng (20:15:10Z) là số dùng cho claimed→finished.
- **Điều kiện T0-173 được giải quyết:** T0-173 viết "Nếu claimed_at gốc (= sched) mới là số đúng cho 'ca ≥60 s' thì 109 s này không tính; T0 không phán." Quy ước họ ca từ trước tới nay dùng **claimed_at CUỐI CÙNG trong DB** (bằng chứng: run 164 claimed cũng đổi muộn — T7-165 ghi rõ "Claimed_at ĐÃ ĐỔI so với đọc #7 của T7-164… đổi sau viết lại #69") → **109 s TÍNH, run 172 ở trong họ ≥60 s** (xem §2.3). **F-173-T0-3 ĐÓNG.**
- **Kết cục run 172 KHÔNG đổi:** SUCCEEDED 20:16:59Z, margin 1.132 s, wall 9.668 s, 1 lần viết lại tại #82 — T0/T1/T2-173 + T0/T1-174 đối chiếu khớp từng số.

### 2.3 CHỐT F-173-T7-2 — số thứ tự ca claimed→finished ≥60 s: đếm lại từ DB, CHỐT theo định nghĩa thống nhất (run 172 = ca thứ TÁM); giải thích vì sao T7 đếm 6 và T2 đếm 5

**Định nghĩa thống nhất (đề xuất — parent quyết):** ca ≥60 s = run vcut-build-loop có finished_at, `(finished_at_utc − worker_claimed_at_utc) ≥ 60 s` theo **giá trị DB CUỐI CÙNG**, epoch-giây (cùng quy ước họ 6–11 s). Đếm lại toàn bộ lịch sử từ DB tươi (truy vấn `finished − claimed ≥ 60`, mọi status có finished):

| Run | claimed→finished | Ghi chú |
|---|---|---|
| 134 | 244 s | Trước khi họ 6–11 s được định nghĩa |
| 138 | 141 s | Trước khi họ 6–11 s được định nghĩa |
| 146 | 95 s | Trước khi họ 6–11 s được định nghĩa |
| 156 | 123 s | T7-157 ĐÃ ghi đương thời ("số mới, khác hẳn họ 7–8 s") |
| 159 | 66 s | T7-160 ĐÃ ghi đương thời ("lần đầu tiên vượt khỏi họ 7–11 s kể từ đợt 154") |
| 164 | 66 s | T7-165: "ngoại lệ" đầu tiên của họ 6–11 s |
| 166 | 64 s | T7-167: "ca 60+ s thứ hai" |
| 167 | 108 s | T7-168: "ca 60+ s thứ ba, lớn nhất tới nay" |
| 170 | 110 s | T7-171: "lớn nhất trong ca 60+ s" (không cho số thứ tự) |
| 171 | 82 s | T7-172: "thứ tư" (xem lỗi số học dưới) |
| 172 | 109 s | T2-173: "ca thứ năm" (xem dưới) |

- **Toàn lịch sử: 11 ca** (134/138/146/156/159/164/166/167/170/171/172) → run 172 là ca thứ **MƯỜI MỘT**.
- **Cửa sổ từ run 154** (khi họ 6–11 s được định nghĩa — T7-160: "kể từ đợt 154"): **8 ca** (156/159/164/166/167/170/171/172) → run 172 là ca thứ **TÁM**. **Đây là con số CHỐT theo định nghĩa thống nhất** (đề xuất dùng cho các đợt sau).
- **Chuỗi như T7 đã xây từ đợt 165 (bắt đầu 164): 6 ca** (164/166/167/170/171/172) → run 172 là ca thứ **SÁU** — đây là "6 ca" trong liệt kê của T7-172. Chuỗi này **bỏ qua 156 (123 s) và 159 (66 s) dù cả hai đã được T7-157/T7-160 ghi đương thời**: T7-165 khi định nghĩa "ngoại lệ" đã liệt kê họ 6–11 s gồm 154/155/158/160/161/162/163 — thiếu 156/159 — nên chuỗi ca 60+ s kể từ đó bắt đầu ở 164. Đây là **lỗi sót trong mạch kể**, không phải lỗi DB.
- **Chuỗi T2 (164+ trừ 170): 5 ca** (164/166/167/171/172) → run 172 là ca thứ **NĂM** — đây là "ca thứ năm" của T2-173. T2 loại 170 **không nêu tiêu chí**: điểm khác biệt duy nhất ghi được của 170 so với các ca còn lại trong chuỗi là **0 lần viết lại** (started == sched, chỉ 2 event dispatched + succeeded); T2-171 xếp 170 riêng vào họ ≥100 s ("ca thứ hai ≥100 s sau 108 s của run 167"). T7 KHÔNG suy đoán tiêu chí của T2 — ghi rõ để parent quyết.
- **Lỗi số học T7-172:** ghi run 171 là "ca thứ tư ≥60 s" trong khi **liệt kê 4 ca tiền nhiệm** (164: 66 s, 166: 64 s, 167: 108 s, 170: 110 s) → theo chính liệt kê của T7-172, 171 là ca thứ **NĂM** trong chuỗi T7 (và 172 là thứ sáu). T2-172 ghi 171 là "thứ tư" thì **nhất quán trong chuỗi T2** (chỉ 3 tiền nhiệm 164/166/167) — hai bên đếm đúng trong chuỗi riêng của mình, sai khác do chuỗi khác nhau (có/không có 170) + T7-172 cộng sai số thứ tự.
- **Run 173 cf = 13 s (timeout) — KHÔNG thuộc họ ≥60 s**, không nối chuỗi. Run 174 chưa có kết cục.
- **F-173-T7-2 ĐÓNG** (theo định nghĩa thống nhất: run 172 = ca thứ 8; các số thứ tự cũ 5/6 được giải thích đầy đủ trên — parent quyết định nghĩa dùng cho các đợt sau).

### 2.4 Reboot #86 MỚI GIỮA PHIÊN (btime 01:01:37Z, boot 70b7f7ee) — RUN 174 BỊ VIẾT LẠI LẦN 1 + (m) #86 DƯƠNG ỨNG VIÊN SÁT BIÊN TRÊN

- **Reboot #86: boot 70b7f7ee-2e0b-4565-b019-bdabc2c6e92c, btime 1795395697 = 01:01:37Z 23/11.** Xác minh T7 (lúc phát hiện ~01:02Z + kiểm lại lúc đọc #6 ~01:23Z + kiểm lại lúc đóng cờ ~02:01Z — cả ba lần đều 70b7f7ee, btime 1795395697): boot_id + btime + `uptime -s` 01:01:37Z (khớp) + /proc/1 mtime 01:01:55.793Z (+18,793 s — **lớn hơn mẫu +12 s của #83/#84/#85, ghi rõ**) + journal idx 0 duy nhất, first entry 01:01:56Z (+19 s) + wtmp begins 01:01:56Z (+19 s) + `last` reboot 01:01 still running + `who -b` 01:01. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 01:03:03 vs 01:03:03 (**chênh 0 s**, lúc phát hiện); lúc mở phiên chênh 1 s. **Số hiệu #86 theo đếm tuần tự — CHỜ T0-175 xác minh 9 nguồn** (T0-174 đóng cờ 23:53Z, TRƯỚC #86; T2-174 đóng 00:17Z, cũng trước #86 — không luồng nào đợt 174 đóng sau #86 ngoài T7).
- **Gap #85→#86 (btime−btime): 1795395697 − 1795388376 = 7.321 s (2h02m01s).**
- **#86 xảy ra TRONG lúc run 174 chạy:** run 174 dispatch gốc 23:36:04Z, btime #86 01:01:37Z (tuổi gốc lúc btime **5.146 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 174)** — theo EVENTS (dispatched trước btime, chưa finish); spanning theo truy vấn started_at = **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at đã viết lại thành 01:02:26Z, sau btime — cùng mẫu #78/#79/#81/#82/#84/#85). T7 dựa verdict (m) trên EVENTS + REQUEUE, không dựa trên spanning-artifact.
- **Run 174 BỊ VIẾT LẠI LẦN 1 tại #86:** started 1795390564 → **1795395746 = 01:02:26Z** (dịch **+5.182 s**); boot_gen đổi 4cb68ccd (#85) → **0762915dd0b340129cec9e524f6c0834** (#86); **claimed_at KHÔNG ĐỔI (1795390564)**; vẫn running, attempt 1, error null. Events tới lúc đóng: đúng 4 event — dispatched 23:36:04.686Z (10230) + **requeued_after_restart 01:02:26.418Z (10252, "daemon startup recovery")** + dispatched 01:02:26.505Z (10253) + **reattached_after_restart 01:02:26.564Z (10254, "execute turn already complete (model-output evidence)")**.
- **1 requeue duy nhất do #86:** cửa hẹp [01:01:37Z, 01:20:37Z] (mọi job): **1 dòng** — run 174, eid 10252, 01:02:26.418417Z (kiểm lại sau khi cửa khép hẳn ở đọc #6 ~01:23Z — vẫn đúng 1 dòng); kiểm lại cửa RỘNG [01:01:37Z, 01:23:54Z] ở đọc #6: vẫn đúng 1 dòng. Không job nào khác bị requeue do #86.
- **Requeue offset +49,418 s — TRONG dải (m) 33–49,8 s, SÁT BIÊN TRÊN 0,382 s** (01:02:26.418417Z − btime nguyên 1795395697). Reattach +49,564 s; dispatch lần 2 +49,505 s. Đây là điểm (m) DƯƠNG **sát biên nhất từng ghi** (sát hơn #81 0,477 s ở biên dưới; #85 1,397 s ở biên dưới). **Robust với caveat phân số:** boot thật ∈ [btime, btime+1 s) → offset thật ∈ (48,418 s, 49,418 s] — mọi giá trị đều < 49,8 s, KHÔNG vượt biên trên dù boot_est lệch tới +1 s (T0-174 đo boot_est #85 = btime +0,729 s → nếu #86 tương tự, offset ≈ +48,7 s, càng xa biên trên).
- **(m) #86 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7; T0/T2-175 đối chiếu độc lập, parent quyết cuối):** 1 run đang chạy tại btime + 1 requeue duy nhất trong cửa hẹp lẫn cửa rộng + offset trong dải (sát biên trên) — **cùng chữ ký #68/#69/#71/#74/#78/#81/#82/#84/#85**. Nếu parent CHẤP NHẬN cả #84/#85 (quyết (f) đợt 173: n 30/31) rồi #86: n ứng viên **30/31 → 33/34** (số học nối tiếp T2-174: +#84 → 31/32; +#85 → 32/33; +#86 → 33/34 — T7 chỉ ghi số học, T2-175 tính chính thức). n chính thức GIỮ 14 cho tới khi parent chốt.
- **Sleep của T7 bị giết theo #86** (xem F-174-T7-1): sleep 1200 s spawn 00:48:41Z bị SIGTERM sau ~811 s (~01:02Z — trong chuỗi teardown của reboot); T7 phát hiện boot mới ngay lần kiểm sau (01:02:42Z, 65 s sau btime), 0 số liệu mất, 0 số sai.
- **INSIDE #86 + FULL132 + lệch khung #86: thuộc T2-175** (#86 xảy ra sau khi T2-174 đóng cờ 00:17Z). T7 không tự tính INSIDE/CERT/FULL.
- **POSTBOOT_PASS #86: thuộc T5-175** (T5-174 đóng cờ 00:03Z, trước #86). Marker sống qua #86: chưa đếm — giao T0-175.
- **#84/#85 XÁC NHẬN bởi T0-174** (9 nguồn; gap #83→#84 = 2.128 s, #84→#85 = 7.101 s — KHỚP T7-173; marker sống qua 37 reboot #49–#85). **(m) #84/#85: T2-174 phán CUỐI — CẢ HAI DƯƠNG** (requeue +45,482 s / +34,397 s — KHỚP T7-173 từng số; T0-174 kiểm lại độc lập cùng số + boot_est #85 = btime +0,729 s → offset ≈ +33,668 s, vẫn trong dải). **INSIDE #83 TRUE (FULL129, FINAL) + #84 TRUE (FULL130) + #85 TRUE (FULL131) — chuỗi dài 4** (T2-174). Parent quyết cuối đợt 174.

### 2.5 Run 174 — Jitter +13 s (chuỗi jitter 0 DỨT), 1 lần viết lại tại #86, vẫn `running` lúc đóng cờ

Run 174 (`3bcde515-6550-43bd-9753-ef1e990b0b7e`, sched 1795390551 = 23:35:51Z 22/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795390551 | 23:35:51Z 22/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795390564 → **1795395746** | 23:36:04Z → **01:02:26Z 23/11** (dịch +5.182 s) |
| worker_claimed_at | 1795390564 | 23:36:04Z (KHÔNG đổi) |
| worker_boot_generation | cron_boot_0762915dd0b340129cec9e524f6c0834 | boot #86 (gốc: 4cb68ccd, #85) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795401351 | 02:35:51Z 23/11 |

- **Jitter +13 s** — run 174 dispatch 23:36:04Z, đúng giây run 173 timeout xong (finished_at run 173 = 1795390564). **Chuỗi jitter 0 s 26 đợt (run 148–173) DỨT tại run 174.** T7 chỉ ghi nhận, không suy luận cơ chế daemon (nhiều khả năng slot bị run 173 chiếm tới lúc timeout — ghi nhận, không chứng minh).
- 8 lần đọc DB trong phiên (đọc #1–#8, 23:38Z–02:01Z): run 174 `running` ở mọi lần đọc; started_at gốc KHÔNG đổi ở đọc #1–#4 (23:38Z–00:48Z), đổi đúng 1 lần tại đọc #5 (~01:02Z, sau #86) rồi KHÔNG đổi ở đọc #6–#8; claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay): đọc #2 (00:05:41Z) 1.790 s; đọc #3 (00:23:15Z) 2.844 s; đọc #4 (00:48:32Z) 4.361 s; đọc #6 (01:23:54Z) 6.483 s; đọc #7 (01:49:27Z) 8.016 s; đọc #8 (02:01:48Z) **8.757 s, còn 2.043 s** tới hạn ngân sách 02:35:51Z. **Kết cục thuộc T7-175** (hạn cứng đóng đợt 174 là 02:30Z, trước hạn run 174 02:35:51Z).
- **Reboot #85 KHÔNG ảnh hưởng run 174** (dispatch sau btime 24 s… — chính xác: run 174 dispatch 23:36:04Z, **36m28s SAU btime #85** 22:59:36Z, trên boot #85, jitter +13 s do run 173 timeout — không phải do #85). **Reboot #86 ảnh hưởng TRỰC TIẾP: viết lại run 174 lần 1** (xem §2.4).
- Events run 174 tới lúc đóng cờ: đúng 4 event (xem §2.4) — 0 event mới sau reattach lần 1 (kiểm lại đọc #8).

### 2.6 Slot HB/DR trong cửa 23:38Z → 02:01Z 23/11 — HB 6/6 (toàn −316 s) + DR 3/4 (DR 23:00Z THIẾU — KHÔNG BAO GIỜ XUẤT HIỆN); CỬA KHÔNG LÀNH

Cửa kiểm ~2h23' (8 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU" — DR 23:00Z kiểm **8 lần tổng** (3 đợt 173 + 5 đợt 174), lần cuối 181' sau giờ hẹn).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:20:50 (23:20:50Z) | 558be95f | 23:15:34 | **−316 s** | CÓ |
| 06:50:50 (23:50:50Z) | 9228e5db | 23:45:34 | **−316 s** | CÓ |
| 07:20:50 (00:20:50Z) | b51a128e | 00:15:34 | **−316 s** | CÓ |
| 07:50:50 (00:50:50Z) | c8b0e85b | 00:45:34 | **−316 s** | CÓ |
| 08:20:50 (01:20:50Z) | 1e92c819 | 01:15:34 | **−316 s** | CÓ |
| 08:50:50 (01:50:50Z) | 095e99cb | 01:45:34 | **−316 s** | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started. **Toàn −316 s — KHÔNG có ngoại lệ.** 0 muộn mới — muộn HB lũy kế GIỮ 9 (đợt thứ mười ba liên tiếp vắng muộn mới).
- HB 23:20:50Z + 23:50:50Z dispatch trên boot #85; HB 00:20:50Z + 00:50:50Z dispatch trên boot #85; HB 01:20:50Z dispatch 01:15:34Z trên boot #86 (sau btime #86 13m57s); HB 01:50:50Z dispatch trên boot #86.

**Deterministic-doctor (lưới :00:00Z): 3/4 có — DR 23:00Z THIẾU (vĩnh viễn).**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:00 (23:00Z) | — | — | — | **THIẾU (0 dòng, kiểm 8 lần tổng)** |
| 07:00 (00:00Z) | 3d6eccf1 | 00:00:00 | 0 s | CÓ |
| 08:00 (01:00Z) | f84005e7 | 01:00:00 | 0 s | CÓ |
| 09:00 (02:00Z) | d7301de6 | 02:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 23:00Z THIẾU VĨNH VIỄN:** scheduled_for_utc 1795388400 = 23:00:00Z — truy vấn trả 0 dòng ở cả 8 lần kiểm (23:00:37Z, 23:06Z, 23:11:49Z đợt 173; ~23:40Z, ~00:05Z, ~00:08Z, ~01:23Z, ~02:01Z đợt 174 — lần cuối 3h01' sau giờ hẹn). **Nguyên nhân có thể thấy (ghi nhận, không chứng minh):** slot rơi 24 s SAU btime #85 (22:59:36Z) — đúng lúc daemon đang startup recovery (requeue run 173 23:00:10Z); dispatch DR 23:00:00Z nhiều khả năng bị mất trong cửa sổ recovery. Đây là slot DR thiếu đầu tiên trong cửa T7 kể từ đợt 161 — và là slot thiếu **đầu tiên được xác nhận không bao giờ xuất hiện muộn** sau 8 lần kiểm.
- DR 01:00Z dispatch 01:00:00Z, 97 s TRƯỚC btime #86, finish cùng giây started — không bị #86 chạm. DR 02:00Z dispatch trên boot #86.
- **Cửa slot đợt 174 KHÔNG LÀNH** (HB 6/6 + DR 3/4 — DR 23:00Z thiếu). Chuỗi cửa lành hoàn toàn đã dứt từ đợt 173 (11 đợt 162–172).

### 2.7 Đối chiếu chéo các luồng đợt 174 (chỉ ghi nhận)

- **T0-174** (cờ 23:53Z): **#84 XÁC NHẬN 9 nguồn + #85 XÁC NHẬN 9 nguồn** (boot_est #85 = btime +0,729 s → offset (m) ≈ +33,668 s, vẫn trong dải); gap #83→#84 = 2.128 s, #84→#85 = 7.101 s — KHỚP T7-173; **marker sống qua 37 reboot #49–#85**; run 173 TIMEOUT 23:36:04Z, 8 event, 2 lần viết lại — KHỚP T7 từng số; **(m) #84/#85 số liệu thô kiểm lại độc lập: +45,482 s / +34,397 s** — KHỚP T7-173; **O8 trên boot #85: WebKit PASS 21/21 ×2 + Chromium PASS 21/21** (23:43:42–23:47:50Z); **POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z** (T5-174, repair-tay-T5, poll=1 — xem T5-174). T0-174 đóng TRƯỚC #86 — **#86 chờ T0-175 xác minh 9 nguồn**.
- **T1-174** (cờ 23:53Z): **verify đợt 173: PASS** — đợt 173 = 10/15/15/13; lũy kế 111–173 = 618/1.092/946/768; chờ push 166–173 = 80/113/106/104 — **KHỚP từng số quyết parent (p) §12.3 đợt 173, lần thứ 72 liên tiếp**; suite **28/28 exit 0 trên boot 3c704685** (23:40:11–23:49:01Z); npm test 12 pass; O8 đợt 173 xác nhận độc lập ×6 + bộ O8 MỚI của T0-174 trên #85 (WebKit 21/21 ×2 + Chromium 21/21).
- **T2-174** (cờ 00:17Z): **(m) #84 DƯƠNG (CUỐI) + (m) #85 DƯƠNG (CUỐI)** — parent quyết cuối; **INSIDE #83 TRUE (FULL129, FINAL) + #84 TRUE (FULL130) + #85 TRUE (FULL131) — chuỗi dài 4**; n ứng viên 30/31 → 32/33 nếu cả hai được chấp nhận; **#56 lần thứ 17 không thu hẹp được**; mù #96?/#88?/#94?/#95?/#77? VẪN MỞ (hole-recheck lần 18 — xem LIMITS T2-174); CERT/FULL GIỮ 76/91. T2-174 đóng TRƯỚC #86 — **(m) #86 + INSIDE #86 + FULL132 thuộc T2-175**.
- **T4-174** (cờ 00:23Z): **lượt yên WebKit #43: CÓ LƯỢT HỢP LỆ** — attempt2-3c704685 20/20, B 5/5, tickCost median 44,5 ms — **chuỗi lượt yên hợp lệ 36 → 37**.
- **T5-174** (cờ 00:03Z): **POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z** (boot+47m21s, repair-tay-T5, poll=1 — replay CHỈ MỘT PHẦN 159/170 intent, KHÔNG phải replay-đầy-đủ); POSTBOOT_PASS #84 VẪN CÓ, còn hiệu lực; #83 KHÔNG CÓ (quyết (b2) đợt 173 — boot thứ 16 không cờ); #82 KHÔNG CÓ (boot thứ 15 không cờ); hướng (3) VẪN ĐỨNG. T5-174 đóng TRƯỚC #86 — **POSTBOOT_PASS #86 thuộc T5-175**.
- **T6-174** (cờ 00:03Z): **(A) KIỂM CHỨNG LẠI LẦN THỨ 24: 120/120 PASS dưới churn (100%)**; **#84/#85 KHÔNG giết holder** (chuỗi từ #69 lên 17 reboot nếu cả hai được xác nhận); **PRUNE LẦN 49: xóa 2 file**. T6-174 đóng TRƯỚC #86 — **#86 có giết holder không thuộc T6-175**.
- **T8-174** (cờ 00:57Z): **harness 6/6 PASS, 0 kẹt** (00:31:13–00:46:56Z, boot #85); **kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3**; (f') V1 live 0 kích hoạt, 0 FP; Q3 heartbeat 84l10 chạy kiểm lại PASS; **O8 T8 PASS 3/3 trên boot #85** (WebKit 21/21 ×2 + Chromium 21/21) — **đề xuất chuỗi WebKit FULL PASS 24 → 25** (T4 có lượt yên hợp lệ trên cùng boot #85 + T8 PASS; caveat gate repair-tay — parent quyết cuối). T8-174 đóng TRƯỚC #86.
- **T9-174: LIMITS/cờ CHƯA CÓ trên đĩa lúc T7 đóng cờ** (~02:01Z) — giao T10-174 tổng hợp. (T9 headroom-log lúc T7 đọc không có trong phạm vi T7; T7 không suy đoán số T9.)

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 173/174 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] + cửa rộng [btime, 01:23:54Z]; runs spanning btime — cả lọc và không lọc). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. (DR 23:00Z: 0 dòng sau 8 lần kiểm cách nhau tới 3h01' — thiếu là kết luận chắc chắn trong thực tế.)
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1: phụ lục chỉ viết bằng script, không gõ tay; epoch slot luôn kiểm bằng `date -u` TRƯỚC khi truy vấn — đợt này 0 lần truy vấn sai epoch). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 01:02:26.418417Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3) + ghi chú đứng quyết (e) đợt 165: dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Đợt này: btime #85/#86 đều là số nguyên từ /proc/stat (quy ước đứng cho mọi verdict (m) từ trước tới nay); caveat boot_est phân số của T0-174 cho #85 (btime +0,729 s) được ghi riêng ở §2.4/§2.7 để parent quyết quy ước — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning #86 = 0 theo truy vấn là ARTIFACT viết-lại-tự-loại (started_at đã viết lại thành sau btime); verdict (m) dựa trên EVENTS (dispatched trước btime + chưa finish sau btime) + REQUEUE, không dựa trên spanning-artifact.
4. Cửa kiểm đợt này ~2h23' (23:38Z → 02:01Z 22–23/11), đủ 6 slot HB + 4 slot DR + run vcut 173 (kết cục) và 174 (theo dõi + viết lại tại #86). Tám lần đọc DB đầy đủ (đọc #1–#8); run 173 được đọc đầy đủ 2 lần khớp hoàn toàn nhau ở mọi trường (đọc #1/#8) + events đọc 2 lần khớp + T0/T1-174 đối chiếu số học khớp; run 174 được đọc đầy đủ 8 lần (started_at đổi đúng 1 lần tại đọc #5, claimed_at không đổi lần nào); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (DR 23:00Z kiểm 8 lần tổng).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 23:20:50Z + DR 23:00Z thuộc cửa 174 (sau kiểm cuối T7-173 lúc ~23:11Z; DR 23:00Z T7-173 đã kiểm 3 lần — T7-174 kiểm thêm 5 lần, tổng 8 lần). HB 02:20:50Z + DR 03:00Z (ngày 23/11) thuộc cửa T7-175.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep 1200 s spawn 00:48:41Z, chết sau ~811 s lúc ~01:02Z do reboot #86 — xem F-174-T7-1); 6/7 sleep hoàn thành (sleep #1 1500 s + #1B 900 s + #2 900 s + #3 1500 s + #5 1200 s + #6 1500 s + #7 720 s — tính cả sleep #1B chồng do gọi nhầm); ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2 đã áp dụng). **Boot ĐỔI 1 lần trong phiên** (3c704685 → 70b7f7ee tại #86, 01:01:37Z) — T7 phát hiện trong vòng 65 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn 70b7f7ee (kiểm đầu + cuối phiên #86).
7. T7 đóng cờ ~02:10Z — trễ ~10' so với hạn cờ ~02:00Z (để viết LIMITS + kiểm chéo các luồng + kiểm lại DR 23:00Z lần 8 + DR 02:00Z — cùng mẫu T7-173 trễ ~19'), trong hạn cứng 02:30Z. T7 không bỏ slot nào trong cửa. DR 03:00Z + HB 02:20:50Z thuộc cửa T7-175.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix174.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 174 trong NOTES đều tính bằng script — **trừ 2 số tuổi ở đọc #3/#4 trong NOTES ban đầu sai 40 s do trừ tay (2.804/4.321 thay vì 2.844/4.361 — xem F-174-T7-1); đã đính chính bằng script trước khi viết LIMITS; LIMITS chỉ dùng số từ appendix174.txt — không lọt số sai nào vào LIMITS.**

## 4. Cập nhật lũy kế (nối tiếp đợt 173, cùng phương pháp)

- Heartbeat: 44/429 → **44/435 slot thiếu** (cửa sổ 14/11 07:50:50 → 23/11 08:50:50 +07). Kiểm toán cửa sổ: 429 + 6 slot mới = 435 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 50/286 → **51/290 slot thiếu** (cửa sổ 11/11 09:00 → 23/11 09:00 +07). Kiểm toán: 286 + 4 = 290 ✓. Số thiếu +1 (DR 23:00Z — đã kiểm 8 lần, không bao giờ xuất hiện).
- Tỉ lệ thiếu lũy kế: HB 44/435 = 10,1% (giảm từ 10,3% — 0 thiếu mới); DR 51/290 = 17,6% (tăng từ 17,5% — 1 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ mười ba liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 173: TIMEOUT theo hồ sơ daemon (wall gốc 10.813 s, VƯỢT ngân sách 13 s)** — 2 lần đọc DB đầy đủ khớp nhau + events đầy đủ (8 event, 0 event sau timeout eid 10229) + T0/T1-174 đối chiếu số học khớp. 2 lần viết lại tại #84 + #85; claimed→finished 13 s (claimed đổi thành đúng hạn ngân sách lúc cuối — cùng mẫu run 171/172). **TIMEOUT đầu tiên kể từ run 147; chuỗi succeeded 150–172 (23 run) ĐỨT.**
2. **F-173-T0-3 ĐÓNG:** claimed_at run 172 DB cuối 20:15:10Z ĐÚNG; ghi nhận T7-172 (không đổi lúc ~19:55Z) ĐÚNG lúc đọc; claimed đổi trong (19:55Z, 20:15:10Z]; 109 s TÍNH theo quy ước họ ca (claimed_at cuối cùng); kết cục run 172 KHÔNG đổi (SUCCEEDED 20:16:59Z, margin 1.132 s).
3. **F-173-T7-2 ĐÓNG (theo định nghĩa thống nhất):** run 172 = **ca thứ TÁM** ≥60 s (cửa sổ từ 154: 156/159/164/166/167/170/171/172). Chuỗi T7 (164+): thứ sáu; chuỗi T2 (164+ trừ 170): thứ năm. Giải thích đầy đủ: T7-172 cộng sai số thứ tự cho run 171 ("thứ tư" trong khi liệt kê 4 tiền nhiệm); T2 loại 170 không nêu tiêu chí (khác biệt duy nhất ghi được: 0 lần viết lại); cả hai chuỗi đều bỏ sót 156/159 dù đã ghi đương thời. **Parent quyết định nghĩa dùng cho các đợt sau.**
4. **Reboot #86 (btime 01:01:37Z, boot 70b7f7ee): GIỮA PHIÊN, giờ thật, T7 xác minh 9 nguồn.** Gap #85→#86 = 7.321 s. Số hiệu #86 theo đếm tuần tự — **CHỜ T0-175 xác minh 9 nguồn** (T0-174 đóng trước #86). Caveat: /proc/1 mtime +18,793 s (lớn hơn mẫu +12 s của #83/#84/#85 — ghi rõ, không giấu).
5. **Điểm (m) #86: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — requeue +49,418 s TRONG dải, **sát biên TRÊN 0,382 s (sát biên nhất từng ghi)**; 1 run sống tại btime + 1 requeue duy nhất cửa hẹp lẫn cửa rộng (cùng chữ ký #68/#69/#71/#74/#78/#81/#82/#84/#85); robust với caveat phân số (offset thật ∈ (48,418 s, 49,418 s]). T0/T2-175 đối chiếu độc lập; parent quyết cuối. Nếu chấp nhận cả #84/#85/#86: n ứng viên 33/34 (số học nối tiếp quyết (f) đợt 173).
6. **Điểm (m) #84/#85: T2-174 phán CUỐI — CẢ HAI DƯƠNG** (requeue +45,482 s / +34,397 s; T0-174 kiểm lại độc lập khớp từng số; boot_est #85 = btime +0,729 s → offset ≈ +33,668 s, vẫn trong dải). **Parent quyết cuối đợt 174.** (m) #82: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 173 (quyết (e)) — KHÔNG mở lại. (m) #83: KHÔNG PHẢI ĐIỂM — parent ĐÃ CHẤP NHẬN đợt 173 — KHÔNG mở lại.
7. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-174 không thu hẹp được cửa lần thứ mười bảy: 8 hướng MỚI — xem LIMITS T2-174) — chờ parent chốt J. T2-175 tiếp tục thu hẹp cửa.
8. **Cửa slot: HB 6/6 + DR 3/4 — DR 23:00Z THIẾU VĨNH VIỄN (8 lần kiểm, không bao giờ xuất hiện) — CỬA KHÔNG LÀNH.** Lũy kế: HB 44/435, DR 51/290. Muộn HB lũy kế GIỮ 9. **Jitter run vcut +13 s (run 174) — chuỗi jitter 0 s 26 đợt DỨT.** Toàn bộ 6 slot HB đều −316 s; 3 slot DR có đều 0 s.
9. **Run 174 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.757 s, còn 2.043 s tới hạn ngân sách 02:35:51Z; 1 lần viết lại tại #86) — kết cục thuộc T7-175. **Claimed_at run 174 vẫn giữ nguyên (23:36:04Z) lúc đóng** — T7-175 kiểm claimed→finished cuối cùng khi run có kết cục.
10. **Reboot #85 KHÔNG ảnh hưởng run 174** (dispatch 36m28s sau btime #85 trên boot #85; jitter +13 s do run 173 timeout — không phải do #85). **Reboot #86 ảnh hưởng TRỰC TIẾP run 174: viết lại lần 1** (started → 01:02:26Z, boot_gen → #86).
11. **T7 đóng cờ ~02:10Z — trễ ~10' so với hạn cờ ~02:00Z** (để viết LIMITS + kiểm chéo các luồng + kiểm lại DR 23:00Z lần 8 + DR 02:00Z — cùng mẫu T7-173 trễ ~19'), trong hạn cứng 02:30Z. T7 không bỏ slot nào trong cửa. DR 03:00Z + HB 02:20:50Z thuộc cửa T7-175.
12. **Mù #96? (#64) VẪN MỞ** theo T2-174 (xem LIMITS T2-174 — hole-recheck lần 18). **Mù #95? (#63) MỞ** theo quyết (b) đợt 163. **Mù #94? (#62) MỞ** theo quyết (b) đợt 162. **Mù #88? VẪN MỞ** (hole-recheck lần thứ mười tám — xem T2-174); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91.
13. **INSIDE #83 TRUE (FULL129, FINAL) + #84 TRUE (FULL130) + #85 TRUE (FULL131) — chuỗi dài 4** (T2-174; FULL127 nói NGOÀI — hai dải MÂU THUẪN, dải phương pháp chi phối theo F-165-T2-1). **INSIDE #86 + FULL132: thuộc T2-175.**
14. **POSTBOOT_PASS #85 ĐÃ CÓ 23:46:57Z (T5-174, mode repair-tay-T5, poll=1 — KHÔNG phải replay-đầy-đủ, replay chỉ 159/170 intent)** — chờ parent quyết có được tính cho gate (a) không caveat mode repair (như #75/#81/#84). **POSTBOOT_PASS #84 VẪN CÓ, còn hiệu lực** (parent CHẤP NHẬN (j) đợt 173). **POSTBOOT_PASS #83 KHÔNG CÓ** (quyết (b2) đợt 173 — boot thứ 16 không cờ). **POSTBOOT_PASS #82 KHÔNG CÓ** (boot thứ 15 không cờ). **POSTBOOT_PASS #86 thuộc T5-175.** Marker sống qua 37 reboot #49–#85 (T0-174 đếm độc lập 37); sống qua #86 chưa đếm — giao T0-175.
15. **O8 chuỗi WebKit FULL PASS: T8-174 ĐỀ XUẤT 24 → 25** (T4 có lượt yên hợp lệ #43 trên boot #85 + T8 PASS 3/3 trên cùng boot; T0-174 cũng PASS 3/3 trên #85 — hai bộ độc lập; caveat gate repair-tay) — **parent quyết cuối**. Lượt yên #43 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 36 → 37 (T4-174). Harness 6/6 sạch, 0 kẹt, kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3 (T8-174).
16. **#84/#85 KHÔNG giết holder — chuỗi từ #69 lên 17 reboot nếu cả hai được xác nhận** (T6-174; (A) 120/120 lần thứ 24 + prune lần 49 xóa 2 file). **#86 có giết holder không — thuộc T6-175.** Watcher-174/174b — kết cục sau #86 thuộc T5-175.
17. **Harness 6/6 + kẹt + (1c')/(f') + 84l10 + H3 + headroom + ENOSPC + birefnet: T9 LIMITS/cờ CHƯA CÓ trên đĩa lúc T7 đóng** — giao T10-174 tổng hợp. T8-174: (f') V1 live 0 kích hoạt, 0 FP; Q3 heartbeat 84l10 chạy kiểm lại PASS; checklist (o) 21/21 (xem LIMITS T8-174).

## 6. Phụ lục — số liệu từ script `appendix174.py` (epoch thô, không gõ tay)

Xem `~/workspace/goals/capcut-clone-video-editor/hidden_files/round174-t7/appendix174.txt` (chạy từ `appendix174.py` cùng thư mục). Tóm tắt các số đã kiểm:

- Run 173 TIMEOUT 23:36:04Z, wall 10.813 s, vượt ngân sách 13 s, cf 13 s, 8 event, 2 lần viết lại.
- Run 172 (F-173-T0-3): claimed cuối 20:15:10Z, cf 109 s, margin 1.132 s, wall 9.668 s.
- F-173-T7-2: 11 ca toàn lịch sử; 8 ca cửa sổ 154+; 6 ca chuỗi T7; 5 ca chuỗi T2.
- Reboot #86: btime 01:01:37Z, gap 7.321 s, requeue +49,418 s (sát biên trên 0,382 s).
- Run 174: jitter +13 s, 1 lần viết lại, tuổi gốc 8.757 s lúc 02:01:48Z, còn 2.043 s.
- HB 6/6 toàn −316 s; DR 3/4 (23:00Z thiếu — kiểm 8 lần); lũy kế HB 44/435, DR 51/290.
