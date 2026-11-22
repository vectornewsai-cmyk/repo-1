# PHASE9 ROUND162 T7 — RUN 161 SUCCEEDED (wall 9.348 s, margin 1.452 s; 1 LẦN VIẾT LẠI TẠI #63) + REBOOT #64 GIỮA HAI ĐỢT (0 REQUEUE — KHÔNG PHẢI ĐIỂM (m)) + CỬA SLOT 6/6 + 3/3 (0 MUỘN, 0 THIẾU)

- **Luồng:** T7 đợt 162 (lượt cron 18:35 +07 21/11/2026 = 11:35:51Z 21/11). Nhiệm vụ theo brief T7-162: (1) kết cục run 161 — run này vẫn `running` lúc T7-161 đóng cờ (~10:46Z, tuổi gốc 7.808 s, còn 2.992 s tới hạn 11:35:51Z — ĐÚNG lúc đợt 162 mở); 1 lần viết lại tại reboot #63 (+37,128 s — điểm DƯƠNG ứng viên, đã CHẤP NHẬN theo quyết (t) đợt 161); (2) điểm (m): kiểm tra reboot #64 có tạo điểm (m) mới không (run đang chạy tại btime? đúng 1 requeue trong cửa rộng? requeue cách btime bao nhiêu — so dải 33–49,8 s); đối chiếu độc lập với T2 (T2 cũng kiểm #64); (3) run 162 hiện trạng lúc đóng cờ; (4) cửa slot HB/DR + lũy kế mới; (5) LIMITS trung thực, phụ lục bằng script. Chú ý sai số F-161-T7-1: lean về (m) chỉ đổi SAU bằng chứng đầy đủ — đừng đổi lean theo nháp đọc sớm; xác minh giờ bằng Cloudflare/giờ thật, chú ý overlap có thể làm btime lệch khỏi giờ tường.
- **Boot trong phiên:** mở phiên là **d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7** (btime /proc/stat 1795259718 = 11:15:18Z — **reboot #64 ứng viên, GIỜ THẬT**; T0-162 + T2-162 xác minh độc lập); **KHÔNG có reboot mới trong phiên** (boot lúc đóng cờ vẫn d9a8d1ce). Reboot #64 xảy ra GIỮA hai đợt (sau T10-161 đóng sổ 11:10:55Z 4'23", trước đợt 162 mở 11:35:51Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 161/162 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 161 §12.3 (quyết parent (a)–(ee)), LIMITS T7-161 + NOTES round161-t7, cờ round162-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 161 kết cục? | **`succeeded`** 11:11:39Z (event 11:11:39.709Z, eid 9710), wall từ started gốc **9.348 s**, margin **1.452 s** (24m12s) tới hạn 11:35:51Z | §2.1, Phụ lục A |
| Run 161 có bị viết lại lần 2 tại #64 không? | **KHÔNG — chỉ 1 lần viết lại (tại #63).** started_at không đổi (10:31:19Z); finished 11:11:39Z, TRƯỚC btime #64 219 s; claimed_at không đổi (11:11:33Z, trước btime #64) | §2.1 |
| Reboot #64 có tạo điểm (m) mới không? | **KHÔNG PHẢI ĐIỂM (m)** — 0 run đang chạy tại btime, 0 requeue — chữ ký đúng #52/#61; T2-162 xác minh độc lập KHỚP T7 | §2.2, §2.3 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-162 KHÔNG thu hẹp được cửa LẦN THỨ NĂM** (5 hướng mới, đều âm tính); R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) GIỮ 14** theo quyết (g) đợt 156. N ứng viên **GIỮ 20 (17 dương + 3 âm, nhánh khuyến nghị) hoặc 21 (17 dương + 4 âm, nhánh #56 ÂM)** — đã cộng #62 ÂM + #63 DƯƠNG theo quyết (s)/(t) đợt 161; #64 KHÔNG cộng | §2.3, §2.4, Phụ lục E |
| Dải requeue dương? | **GIỮ 33–49,8 s** — #64 có 0 requeue, không ảnh hưởng dải. Điều tra (m) VẪN ĐÓNG | §2.3 |
| Cửa slot đợt 162? | **HB 6/6 (toàn −316 s), DR 3/3 (toàn 0 s), 0 thiếu, 0 muộn** — cửa LÀNH HOÀN TOÀN (khác đợt 161: 1 muộn +888 s) | §2.6 |
| Run 162? | **Jitter 0 s** (lần thứ 15 liên tiếp), **0 lần viết lại**, **vẫn `running` lúc đóng cờ** (~13:56Z, tuổi gốc 8.446 s, còn 2.354 s tới hạn 14:35:51Z). Kết cục thuộc T7-163 | §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–161): heartbeat **44/363 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/252 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 161 — SUCCEEDED, margin 1.452 s (7 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp)

Run 161 (`0b0a27f8-72f4-4066-9953-e68a5157822d`, sched 1795250151 = 08:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795250151 = 08:35:51Z 21/11 |
| started_at GỐC (dispatch 08:35:51.069Z) | 08:35:51Z — jitter 0 s |
| started_at sau viết lại #63 | 1795257079 = 10:31:19Z (requeue 10:31:19.128Z) — KHÔNG ĐỔI suốt 7 lần đọc |
| finished_at_utc | 1795259499 = 11:11:39Z (event `succeeded` 11:11:39.709Z, eid 9710) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795259493 = 11:11:33Z (finished − 6 s) |
| Wall từ started gốc | 1795259499 − 1795250151 = **9.348 s** (2h35m48s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795260951 = 11:35:51Z — finished TRƯỚC hạn **1.452 s** (24m12s) |
| Finished trước btime #64 | 1795259718 − 1795259499 = 219 s (3m39s) |

- Events run 161 (đầy đủ, 5 event, không thiếu, không thêm sau succeeded): `dispatched` 08:35:51.069Z (eid 9673) + `requeued_after_restart` 10:31:19.128Z (9698, #63, detail "daemon startup recovery") + `dispatched` 10:31:19.186Z (9699) + `reattached_after_restart` 10:31:19.243Z (9700, detail "execute turn already complete (model-output evidence)") + **`succeeded` 11:11:39.709Z (9710)**. **KHÔNG có event nào cho run 161 sau 11:11:39Z** (kiểm lại ở đọc cuối #7: 0 event mới sau eid 9710; 0 requeue thêm).
- 7 lần đọc DB đầy đủ trong phiên khớp nhau ở mọi trường (đọc #1 ~11:38Z, #2 ~12:04Z, #3 ~12:29Z, #4 ~12:54Z, #5 ~13:20Z, #6 ~13:45Z, #7 ~13:56Z — đọc #1 xác nhận kết cục; các đọc sau xác nhận không đổi). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: **1.452 s** — hẹp hơn 160 đúng 483 s, nhưng vẫn là margin rộng thứ ba trong chuỗi (sau 160: 1.935 s, 151: 1.828 s). T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 161 claimed 11:11:33Z (finished − **6 s**) — 1 s dưới họ 7–11 s của run 154 (7 s) / 155 (8 s) / 157 (11 s) / 158 (10 s) / 160 (7 s). T7 ghi đúng 6 s, không làm tròn vào họ 7–11 s. Claimed_at KHÔNG đổi lần nào trong 7 lần đọc (gốc 08:35:51Z → 11:11:33Z đã đổi trước khi T7-162 đọc #1; lúc T7-161 đóng cờ claimed vẫn là gốc — đổi trong khoảng (10:46Z, 11:11:39Z)).
- **T10-161 đóng sổ 11:10:55Z — run 161 finish 44 s SAU khi T10 đóng** (11:11:39Z). Claim "run 161 chưa có kết cục" của T10-161 ĐÚNG lúc đóng. Khác F-161-T1-1 (#62 rơi vào lúc T10-160 đóng sổ): #64 xảy ra SAU khi T10-161 đóng (xem §2.2).
- **Run 161 bị đúng 1 lần viết lại (tại #63)** — chuỗi run bị viết lại: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (**1 lần**). Run 161 là run thứ hai liên tiếp kết thúc với ≤1 lần viết lại sau chuỗi 156–159 (không có run nào 0 lần kể từ 160).

### 2.2 Reboot #64 (btime 11:15:18Z) — GIỮA HAI ĐỢT, GIỜ THẬT, KHÔNG NGHỊCH LÝ ĐỒNG HỒ, KHÔNG OVERLAP DÀI

- **Reboot #64: boot 94d22520 → d9a8d1ce-ce3a-46d8-bbbc-3cae373489a7, btime 1795259718 = 11:15:18Z 21/11.** Xác minh T7 (lúc mở + đọc #1 + đọc #7): boot_id + btime + `uptime -s` 11:15:18Z (khớp) + /proc/1 dir mtime 11:15 (+11 s theo `stat` 11:15:29.562Z — T2-162 đo) + journal idx 0 duy nhất, first entry 11:15:29Z (+11 s) + wtmp begins 11:15:29Z (+11 s) + `last` reboot 11:15 still running + uptime 1.339,85 s lúc ~11:37:38Z (khớp btime từng giây). **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 11:37:43 vs 11:37:43 (±0 s, lúc mở), 13:56:39 vs 13:56:38 (chênh 1 s, lúc đóng) — hai lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1).
- **Gap #63→#64 (btime−btime): 1795259718 − 1795257042 = 2.676 s (44m36s) — NGẮN NHẤT trong chuỗi gần đây** (các gap trước: #61→#62 9.220 s, #62→#63 9.073 s). Đời thật của boot #63 ≈ 2.676 s (không overlap dài — xem dưới).
- **#64 xảy ra SAU khi T10-161 đóng sổ 263 s (4'23")** (đóng 11:10:55Z → btime 11:15:18Z) và TRƯỚC khi đợt 162 mở (11:35:51Z). Claim "KHÔNG reboot mới trong lúc T10 đóng sổ" của T10-161 **ĐỨNG** — khác #62 (F-161-T1-1: #62 rơi vào lúc T10-160 đóng sổ, claim stale ~3 phút). T0-162 xác nhận độc lập cùng kết luận (9 nguồn).
- **0 requeue do #64:** cửa 11:15:18–11:35:51Z (mọi job, event `requeued_after_restart`): 0 dòng; cửa RỘNG 11:15:18–13:56:00Z (mọi job): 0 dòng. (Lưu ý F-162-T7-2: lần lọc đầu dùng tên event sai `requeued` — đã sửa thành `requeued_after_restart`, vẫn 0 dòng; danh sách events run 161 đầy đủ 5 event xác nhận độc lập chỉ có 1 requeue duy nhất tại #63.)
- **0 run đang chạy tại btime #64:** truy vấn spanning btime 1795259718: 0 dòng. Run 161 finished 11:11:39Z (219 s TRƯỚC btime); run 162 started 11:35:51Z (sau btime); HB 11:20:50Z started 11:15:34Z (sau btime 16 s); DR 11:00Z finished 11:00:00Z (trước btime). **KHÔNG dính caveat viết-lại-tự-loại:** run 161 finished thật trước btime dù started_at đã viết lại tại #63 — spanning = 0 là kết quả thật, không phải artifact.
- **KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài tại #64** (T0-162 9 nguồn + T2-162 F125?/drift + T7 Cloudflare ±0/±1 s — ba bên độc lập, khớp nhau): không có nội dung boot cũ nào đóng dấu sau btime #64 (run 161 succeed 11:11:39Z trước btime 3'39", 0 event sau; sampler-161 dừng 10:56:00Z; watcher-161 đã chết theo #63, poll cuối 10:30:39Z; không có watcher/sampler nào sống bắc qua btime #64 để đo overlap). Boot #63 chết trong (11:14:37Z, 11:15:18Z] theo T0-162 (khung chết từ mốc cuối trên boot cũ). Overlap #64 (nếu có) không đo được và không cần thiết cho verdict — không có nghịch lý nào để giải thích (khác #62: có nghịch lý 824 s cần OVERLAP giải thích).
- **Số hiệu #64 theo đếm tuần tự** — chờ parent xác nhận (T0/T2/T7-162 xác minh độc lập; T1-162 chạy suite 28/28 trên boot này; T5-162 POSTBOOT_PASS #64 đã có 11:40:00Z; T6-162 #64 không giết holder).

### 2.3 Điểm (m) #64 — KHÔNG PHẢI ĐIỂM (T7 lean KHÔNG ĐỔI từ đọc #1; T2-162 xác minh độc lập KHỚP)

- Chữ ký hình thức: 0 run đang chạy tại btime thật 11:15:18Z, 0 requeue trong cửa 11:15:18–11:35:51Z — **giống hệt #52 và #61** (0 run đang chạy → không phải điểm dữ liệu). Khác #62 (1 run đang chạy tại btime → ứng viên điểm ÂM, đã CHẤP NHẬN theo quyết (s) đợt 161) và #63 (viết lại run 161, requeue +37,128 s → điểm DƯƠNG, đã CHẤP NHẬN theo quyết (t) đợt 161).
- **Lean của T7 — KHÔNG ĐỔI từ đọc #1 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #1 (finished-trước-btime là dứt khoát: run 161 finished 11:11:39Z, 219 s trước btime; spanning 0 dòng; requeue 0 dòng trong cửa rộng) nên T7 kết luận "KHÔNG PHẢI điểm" từ đọc #1 và GIỮ NGUYÊN qua 7 lần đọc — không có lean nháp ngược như #62 đợt 161 (F-161-T7-1). T2-162 đọc NOTES #1 của T7 và đối chiếu độc lập: **"T7-162: run 161 finished 11:11:39Z, 219 s trước btime; 0 requeue; 0 run đang chạy tại btime — T2 đối chiếu khớp"** (LIMITS T2-162 §2.11 / .done 11:54:00Z). Hai bên thống nhất ngay từ đầu, không có phân kỳ để T10 phán.
- **T7 KHÔNG tự đổi n** (điều tra đã đóng): n ứng viên **GIỮ 20 (17 dương + 3 âm, nhánh khuyến nghị) hoặc 21 (17 dương + 4 âm, nhánh #56 ÂM)** — đã cộng #62 ÂM + #63 DƯƠNG theo quyết (s)/(t) đợt 161; #64 KHÔNG cộng (không phải điểm). T2-162 ghi cùng số (n ứng viên GIỮ 20/21).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-162 KHÔNG thu hẹp được cửa LẦN THỨ NĂM

- T2-162 DONE 11:54:00Z (đọc cờ, đối chiếu chéo): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ NĂM** — 5 hướng mới đều âm tính. Cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n chính thức (ứng viên) GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 + quyết (d)/(e) đợt 161** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 20 (nhánh khuyến nghị, đã cộng #62/#63) ; nếu J < 2.807 s → #56 là điểm ÂM → n = 21. Quyết (d) đợt 159 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-162 thêm: mù **#94? (#62) MỞ — điều tra đầy đủ** (N file 1.823 s / union 1.736 s — sơ bộ T2-161 là 1.422 s, mất 12 mốc runtime-file; O file 435 s / union 60 s — ĐÓNG); mù **#95? (#63) SƠ BỘ MỞ — giao T2-163** (P file/union 1.153 s, vượt sàn đúng 6 s); mù **#88? VẪN MỞ** (hole-recheck lần thứ sáu: 345 hit, 0 mốc mới); mù **#77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91; ứng viên CERT94/FULL108. INSIDE: **#63 NGOÀI dải FULL109** [08:25:16Z, 10:23:59Z] neo 07:59:29Z, muộn 403 s → chuỗi 1 KẾT THÚC, chuỗi mới bắt đầu từ #63 (độ dài 1). T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.

### 2.5 Run 162 — jitter 0 s, 0 lần viết lại, vẫn running lúc đóng cờ

Run 162 (`87119032-de13-445b-bb00-fd368b676d0e`, sched 1795260951 = 11:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795260951 | 11:35:51Z 21/11 |
| started_at | 1795260951 | 11:35:51Z — **jitter 0 s** |
| worker_claimed_at | 1795260952 | 11:35:52Z (started + 1 s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795271751 | 14:35:51Z 21/11 |

- 7 lần đọc DB đầy đủ trong phiên: status `running` ở cả 7 lần; started_at KHÔNG đổi lần nào; claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. **0 lần viết lại tới lúc đóng cờ.**
- Tuổi run từ gốc lúc đọc cuối #7 (13:56:37Z): 8.446 s; còn 2.354 s tới hạn ngân sách 14:35:51Z. **Kết cục thuộc T7-163.**
- Jitter 0 s — lần thứ mười lăm liên tiếp run vcut jitter 0 (161 là lần thứ mười bốn).
- Run 162 dispatch SAU btime #64 (11:35:51Z > 11:15:18Z) → không thể bị #64 viết lại. Run 162 là run đầu tiên dispatch trên boot #64.

### 2.6 Slot HB/DR trong cửa 11:00Z → 13:50Z 21/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h18' (7 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:20:50 (11:20:50Z) | 1b824c0c | 11:15:34 | **−316 s** | CÓ |
| 18:50:50 (11:50:50Z) | e70f9ab4 | 11:45:34 | −316 s | CÓ |
| 19:20:50 (12:20:50Z) | b5cb7747 | 12:15:34 | −316 s | CÓ |
| 19:50:50 (12:50:50Z) | 71a2e041 | 12:45:34 | −316 s | CÓ |
| 20:20:50 (13:20:50Z) | f7d33987 | 13:15:34 | −316 s | CÓ |
| 20:50:50 (13:50:50Z) | 5389ae87 | 13:45:34 | −316 s | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started; jitter −316 s đồng đều tuyệt đối (mẫu chuẩn). Slot HB 13:50:50Z: 0 dòng lúc đọc #6 (13:45:15Z) — CHƯA dispatch, không phải thiếu (dispatch dự kiến ~13:45:34Z theo mẫu); đọc #7 xác nhận đã có, jitter −316 s đúng mẫu. **0 muộn mới — muộn HB lũy kế GIỮ 9** (chuỗi vắng muộn mới bắt đầu lại: đợt 162 là đợt đầu tiên vắng muộn kể từ đợt 161).
- Slot HB 10:50:50Z đã đếm ở đợt 161 — T7-162 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot HB 14:20:50Z + DR 14:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-163.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:00 (11:00Z) | efc4e44f | 11:00:00 | 0 s | CÓ |
| 19:00 (12:00Z) | 72733fbd | 12:00:00 | 0 s | CÓ |
| 20:00 (13:00Z) | 4db38482 | 13:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 10:00Z đã đếm ở đợt 161 — không đếm lại. DR 11:00Z dispatched 11:00:00Z — TRƯỚC btime #64 15m18s, daemon boot cũ dispatch bình thường; HB 11:20:50Z dispatched 11:15:34Z — 16 s SAU btime #64, daemon boot mới dispatch bình thường.

### 2.7 Số hiệu reboot + đối chiếu chéo các luồng đợt 162 (chỉ ghi nhận)

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — XÁC NHẬN quyết (o) đợt 161), #63 = 94d22520 (10:30:42Z, giờ thật — XÁC NHẬN quyết (p) đợt 161), #64 = d9a8d1ce (11:15:18Z, giờ thật — T0/T2/T7-162 xác minh độc lập, chờ parent xác nhận).
- KHÔNG có lệch số hiệu đợt này (T0/T1/T2/T5/T6/T7/T8 đều dùng #64; T2 dùng hệ đếm chặt #138?/#139?/#140? cho cùng ba boot — khác hệ aggregate, ghi nhận như F-161-T1-7).
- Đối chiếu chéo (đọc cờ + LIMITS, chỉ ghi nhận — T7 không kiểm lại công việc luồng khác):
  - **T0-162** (cờ 11:40:32Z): #64 xác minh 9 nguồn; KHÔNG nghịch lý đồng hồ, KHÔNG OVERLAP #64/#63; reboot sau T10-161 đóng 4'23" — claim T10-161 ĐỨNG; boot #63 chết trong (11:14:37Z, 11:15:18Z]; watcher-161 chết từ #63, chưa có watcher-162 lúc mở; POSTBOOT_PASS #63 + #64 "CHƯA CÓ" (stale ~30 s — xem T5/T2 dưới); marker sống qua 15 reboot #49–#64; O8 JSON còn đúng.
  - **T1-162** (cờ 11:49:05Z): verify 161 **PASS**; đếm khớp lần thứ 53 liên tiếp (đợt 161 = 10 batch / 13 entry / 13 đường dẫn khác nhau / 12 file mới — khớp đính chính parent §12.3 aggregate 161; lũy kế 111–161 = 498/924/791; chờ push 136–161 = 250/346/295); **suite 28/28 exit 0 trên boot d9a8d1ce** (11:38:29–11:47:15Z, 8m46s); O8 xác nhận độc lập (chuỗi FULL PASS LÊN 16 theo quyết (g) đợt 161).
  - **T2-162** (cờ 11:54:00Z): probe #81 ok=2 fail=0 (boot d9a8d1ce, 11:38:28Z); #64 xác nhận độc lập (F125? −0,084…+0,500 s đủ 3 server; drift 1,0019); mù #94? MỞ (N file 1.823 s / union 1.736 s; O ĐÓNG); mù #95? SƠ BỘ MỞ (giao T2-163); #88?/#77? VẪN MỞ; CERT/FULL chính thức GIỮ 76/91 (ứng viên CERT94/FULL108); INSIDE #63 NGOÀI dải FULL109, chuỗi 1 KẾT THÚC, chuỗi mới từ #63; (m) #56 không thu hẹp lần thứ năm; (m) #64 KHÔNG PHẢI điểm — đối chiếu khớp T7; POSTBOOT_PASS #64 ĐÃ CÓ 11:40:00Z (trái cờ T0-162 — stale ~30 s); POSTBOOT_PASS #63 VẪN CHƯA CÓ; WFS #68 chênh 0; birefnet 0 thử lần thứ 16.
  - **T5-162** (cờ 11:44:09Z): POSTBOOT_PASS #64 ĐÃ CÓ 11:40:00Z (boot+24m42s, replay-day-du, poll=0, dpkg 1545 dòng, cache 178, lists 37, 11/11 gói + 5/5 lib, postboot exit 0 lúc 11:41:07Z); replay #64 khởi động boot+20m22s — **PHÁ xu hướng muộn dần** (#59 +35s → #61 +9m50s → #62 +22m10s thật); POSTBOOT_PASS #63 KHÔNG CÓ, không bù được — boot thứ 7 lọt (#51, #53, #54, #55, #57, #60, #63); marker sống qua 16 reboot #49–#64 (T0 ghi 15 — lệch 1, chờ T10 phán); watcher-162 chạy tay 11:40:00Z pid 18801, giám sát tới 14:30:00Z; ENOSPC #64: 5 dòng.
  - **T6-162** (cờ 11:49Z): (A) 120/120 lần thứ 12 liên tiếp (tổng 1440/1440); lock 500 cặp, 0 giữ; prune lần 37 (queue 101 → 100); #64 KHÔNG giết holder (lock trống 55m10s trước btime); #63 cũng không giết holder (trống 10m34s trước btime).
  - **T8-162** (cờ 12:42:14Z): O8 PASS 3/3 qua gate chuẩn cùng-boot #64 (GATE-FOUND poll 25 12:02:43Z; lượt yên #31 CÓ lượt hợp lệ #27, attempt1 20/20, B 5/5, tickCost 42,0 ms, boot d9a8d1ce; WebKit 21/21 ×2 pid41743 md5 959abd4f + pid42111 md5 10c8aeee; Chromium 21/21 pid42497 md5 fc7927b0; O8 DONE 12:11:47Z); chuỗi WebKit FULL PASS 16 → ? chờ T10/parent phán; **HARNESS 5/6 PASS, 1 KẸT WebKit 86n2 exit 124** (P5-entry, runEngine:527; watchdog 12:18:23Z + probe 1+1 TIMEOUT 30 s; live-diag kích hoạt THẬT lần đầu 2/2 lúc 12:20:54Z + 12:24:54Z — điểm mù F-158-T8-4 nay đã được kiểm chứng thật; vite HTTP 200, WebKitWebProcess idle — cùng chu kỳ wedge H3, điểm phá MỚI); 85m4 P4-lần3 PASS lần thứ tư liên tiếp; 86n2 P4-lần2 PASS (chuỗi verdict 12 → 13); 84l10 E4 ended=false lần thứ ba liên tiếp; kẹt cộng dồn 13 → 14; chuỗi "P3 không kẹt" 3 → 0; H3 VẪN MỞ, chỉ giám sát thụ động; X11: dọn 3 socket X193/X194/X195 lúc ~12:39Z; /tmp/.X11-unix/ TRỐNG sau dọn; 0 reboot trong phiên T8.
  - **T4-162 / T9-162:** cờ chưa có lúc T7 đóng cờ — T10 thu thập (không phải nợ của T7). T9-162 chưa đóng lúc T7 đóng cờ (~13:57Z).
- Mù đi kèm: #94? (#62) MỞ theo T2-162 (giao T2-162 đã điều tra đầy đủ đợt này); #95? (#63) SƠ BỘ MỞ, giao T2-163; #88? VẪN MỞ; #77? VẪN MỞ. CERT/FULL chính thức GIỮ 76/91; ứng viên CERT94/FULL108. INSIDE: #63 NGOÀI dải FULL109 → chuỗi 1 KẾT THÚC, chuỗi mới từ #63 (độ dài 1) (T2-162; T7 chỉ ghi nhận). POSTBOOT_PASS #64 ĐÃ CÓ 11:40:00Z (T5-162); POSTBOOT_PASS #63 KHÔNG CÓ, không bù được — boot thứ 7 lọt. Watcher-162 pid 18801 chạy từ 11:40:00Z (T5-162).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 161/162 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 đợt này: script phụ lục bắt được 2 phép tính nháp sai — xem §6). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 11:11:39.709Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này: run 161 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 161 ở khung thật; btime #64 xác minh giờ thật 3 bên độc lập (T0/T2/T7); spanning = 0 không phụ thuộc khung giờ (run 161 finished thật trước btime, run 162 started sau btime).
4. Cửa kiểm đợt này ~2h18' (11:00Z → 13:56Z 21/11), đủ 6 slot HB + 3 slot DR + run vcut 161 (kết cục) và 162 (theo dõi). Bảy lần đọc DB đầy đủ; run 161 được đọc đầy đủ 7 lần khớp hoàn toàn nhau ở mọi trường; run 162 được đọc đầy đủ 7 lần (không đổi lần nào); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (HB 13:50:50Z: 0 dòng lúc đọc #6 vì chưa tới giờ dispatch — đọc #7 xác nhận có, không kết luận thiếu vội).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 10:50:50Z + DR 10:00Z thuộc cửa 161 theo quy ước đứng (T7-161 đã đếm); slot DR 11:00Z + HB 11:20:50Z thuộc cửa 162 (sau kiểm cuối T7-161 lúc 10:46Z). HB 14:20:50Z + DR 14:00Z thuộc cửa T7-163.
6. **0 sleep bị SIGTERM giết trong phiên này** (6/6 sleep hoàn thành: 5× 1.500 s + 1× 660 s; ghi `date -u` trước mỗi lần spawn — bài học F-161-T7-2 đã áp dụng). Boot đổi 0 lần trong phiên (d9a8d1ce ổn định từ lúc mở tới lúc đóng).
7. T7 đóng cờ ~13:58Z — trong hạn cờ ~14:00Z (~2' còn), trong hạn cứng toàn đợt 14:30Z (~32' còn). Run 162 vẫn running lúc đóng cờ — kết cục thuộc T7-163 (hạn ngân sách 14:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix162.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay — script đợt này bắt được 2 lỗi nháp, xem §6).

## 4. Cập nhật lũy kế (nối tiếp đợt 161, cùng phương pháp)

- Heartbeat: 44/357 → **44/363 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 20:50:50 +07). Kiểm toán cửa sổ: 357 + 6 slot mới = 363 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 49/249 → **49/252 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 20:00 +07). Kiểm toán: 249 + 3 = 252 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/363 = 12,1% (giảm từ 12,3% — 0 thiếu mới); DR 49/252 = 19,4% (giảm từ 19,7% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt đầu tiên vắng muộn kể từ đợt 161; chuỗi 8 đợt vắng muộn 153–160 đã đứt ở 161, nay bắt đầu chuỗi vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 161: SUCCEEDED theo hồ sơ daemon (wall 9.348 s, margin 1.452 s)** — 7 lần đọc DB đầy đủ khớp nhau + events đầy đủ (5 event, 0 event sau succeeded eid 9710). Margin hẹp hơn 160 đúng 483 s (160: 1.935 s vẫn là rộng nhất từ đợt 150); 1 lần viết lại duy nhất tại #63.
2. **Run 161 bị đúng 1 lần viết lại (tại #63)** — chuỗi run bị viết lại: 156 (3), 157 (2), 158 (1), 159 (2), 160 (0), 161 (**1**). Run 161 finish 44 s SAU khi T10-161 đóng sổ (11:10:55Z) — T10 ghi "chưa có kết cục" ĐÚNG lúc đóng.
3. **Reboot #64 (btime 11:15:18Z, boot d9a8d1ce): GIỮA HAI ĐỢT, giờ thật, KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài.** Gap #63→#64 = 2.676 s — NGẮN NHẤT chuỗi gần đây. Reboot xảy ra SAU T10-161 đóng sổ 263 s — claim T10-161 ĐỨNG. Số hiệu #64 theo đếm tuần tự — chờ parent xác nhận.
4. **Điểm (m) #64: KHÔNG PHẢI ĐIỂM (m)** — 0 run đang chạy tại btime, 0 requeue (chữ ký #52/#61); T7 lean KHÔNG ĐỔI từ đọc #1; T2-162 xác minh độc lập KHỚP. N ứng viên GIỮ 20/21; n chính thức (ứng viên) GIỮ 14; dải GIỮ 33–49,8 s; điều tra (m) VẪN ĐÓNG.
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-162 không thu hẹp được cửa lần thứ năm: R 2,56251–2,66817 / J 2,566–2,80753 s) — chờ parent chốt J (quyết (d)/(e) đợt 161 vẫn đứng).
6. **Cửa slot: HB 6/6 + DR 3/3, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN.** Lũy kế: HB 44/363, DR 49/252. Muộn HB lũy kế GIỮ 9. Jitter run vcut 0 s lần thứ 15 liên tiếp.
7. **Run 162 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.446 s, còn 2.354 s tới hạn ngân sách 14:35:51Z; 0 lần viết lại) — kết cục thuộc T7-163.
8. **T9-162 chưa đóng lúc T7 đóng cờ (~13:57Z)** — T10 thu thập (không phải nợ của T7). T8-162 đã đóng 12:42:14Z: O8 PASS 3/3 (chuỗi FULL PASS 16 → ? chờ T10/parent phán) + harness 5/6, 1 kẹt WebKit 86n2 (kẹt cộng dồn 13 → 14; chuỗi "P3 không kẹt" 3 → 0; live-diag kích hoạt THẬT lần đầu — điểm mù F-158-T8-4 nay đã được kiểm chứng thật).
9. **Mù #94? (#62) MỞ theo T2-162** (N file 1.823 s / union 1.736 s; O ĐÓNG) — chờ quyết parent. **Mù #95? (#63) SƠ BỘ MỞ, giao T2-163** (P file/union 1.153 s, vượt sàn đúng 6 s). **Mù #88? VẪN MỞ** (hole-recheck lần thứ sáu: 345 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT94/FULL108.
10. **INSIDE #63: NGOÀI dải FULL109 → chuỗi 1 KẾT THÚC; chuỗi mới từ #63 (độ dài 1)** (T2-162; T7 chỉ ghi nhận). INSIDE cho #64 giao T2-163.
11. **POSTBOOT_PASS #64 ĐÃ CÓ 11:40:00Z (T5-162)** — replay khởi động boot+20m22s, PHÁ xu hướng muộn dần (#62 +22m10s thật). **POSTBOOT_PASS #63 KHÔNG CÓ, không bù được** — boot thứ 7 lọt (#51, #53, #54, #55, #57, #60, #63). Marker sống qua 15 (T0) hay 16 (T5) reboot #49–#64 — lệch 1, chờ T10 phán. Watcher-162 pid 18801 chạy từ 11:40:00Z (T5-162).
12. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T2-162: 0 thử lần thứ 16 liên tiếp). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-162-T7-1 — Hai phép tính nháp sai, script phụ lục bắt được, ĐÃ SỬA trước khi viết LIMITS:** (a) tuổi run 162 lúc đọc #7 tính nhẩm "7.946 s / còn 2.854 s" — SAI đúng 500 s; script tính từ epoch thô: tuổi **8.446 s** (13:56:37Z − 11:35:51Z), còn **2.354 s**. (b) epoch T10-161 đóng ghi nháp 1795259055 (= 11:04:15Z) — SAI; đúng là **1795259455** (= 11:10:55Z), btime #64 muộn hơn 263 s (4m23s); script in "663 s (0h04m23s)" mâu thuẫn nội bộ đã lộ lỗi. Cả hai đã sửa trong script + LIMITS + NOTES; số liệu cứng khác không ảnh hưởng (margin/wall/jitter đều do script tính hoặc đã đối chiếu `date -u`). Bài học: mọi phép trừ epoch/giờ trong LIMITS phải qua script hoặc `date -u` từ epoch thô — không tính nhẩm tuổi run lúc đóng cờ.
- **F-162-T7-2 — Lần lọc requeue đầu dùng tên event sai (`requeued` thay vì `requeued_after_restart`):** truy vấn cửa #64 lần đầu lọc `event_name = 'requeued'` → 0 dòng. Đã sửa thành `requeued_after_restart` → vẫn 0 dòng; danh sách events run 161 đầy đủ (5 event) xác nhận độc lập chỉ có 1 requeue duy nhất tại #63. Kết luận "0 requeue do #64" không đổi; chỉ tên lọc sai lần đầu. Bài học: kiểm tra tên event thật từ danh sách events trước khi lọc theo tên.
- **F-162-T7-0 — Không có sai số nào khác trong đợt này:** 7 lần đọc DB đầy đủ khớp nhau ở mọi trường trùng (run 161 + run 162) + events đối chiếu trực tiếp (run 161: 5 event, 0 event sau succeeded eid 9710; requeue cửa rộng 11:15:18–13:56:00Z = 0) + truy vấn spanning btime #64 (0 dòng — không dính caveat viết-lại-tự-loại vì run 161 finished thật trước btime) + kiểm boot_id SAU khi đọc started_at ở mọi lần đọc (bài học F-142-T7-1 đã áp dụng); kết cục run 161 có 7 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 11:11:39.709Z, eid 9710), không suy đoán sau; btime #64 xác minh 6+ nguồn + Cloudflare 2 lần trong phiên (lúc mở ±0 s, lúc đóng chênh 1 s — đồng hồ boot mới đúng giờ thật); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng); lean (m) #64 KHÔNG ĐỔI từ đọc #1 (bằng chứng đầy đủ ngay từ đầu — khác #62 đợt 161, xem F-161-T7-1); 0 sleep bị SIGTERM giết trong phiên này (6/6 sleep hoàn thành — khác đợt 156/157/158/161: 1 sleep bị giết; giống đợt 159/160: 0 sleep bị giết).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round162-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round162-t7/NOTES.md` + `appendix162.py` + `appendix162.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round162-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix162.py` từ epoch thô — xem file `appendix162.txt` trong round162-t7)

### Phu luc A — Run 161 (ket cuc SUCCEEDED, T7-162)
- sched 1795250151 = 2026-11-21T08:35:51Z; started GOC 1795250151 = 2026-11-21T08:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #63 1795257079 = 2026-11-21T10:31:19Z (requeue 10:31:19.128Z = btime #63 + 37,128 s)
- finished 1795259499 = 2026-11-21T11:11:39Z; status succeeded; attempt 1; error null; timed_out false
- claimed 1795259493 = 2026-11-21T11:11:33Z (finished - 6 s)
- wall tu started GOC: 1795259499 - 1795250151 = 9348 s (2h35m48s)
- han ngan sach: 1795260951 = 2026-11-21T11:35:51Z; margin: 1795260951 - 1795259499 = 1452 s (0h24m12s)
- finished TRUOC btime #64: 1795259718 - 1795259499 = 219 s (0h03m39s) truoc
- KHONG co event nao cho run 161 sau succeeded 11:11:39.709Z (eid 9710); tong 5 event
- Margin 1452 s < 160: 1935 s — 160 VAN la rong NHAT tu dot 150 (151: 1828 s; 161: 1452 s)

### Phu luc B — Reboot #63 (xac nhan) + #64 (giua hai dot)
- #62: btime 1795247969 = 2026-11-21T07:59:29Z, boot 39d46ba0
- #63: btime 1795257042 = 2026-11-21T10:30:42Z, boot 94d22520
- #64: btime 1795259718 = 2026-11-21T11:15:18Z, boot d9a8d1ce
- gap #62->#63 (btime-btime): 1795257042 - 1795247969 = 9073 s (2h31m13s)
- gap #63->#64 (btime-btime): 1795259718 - 1795257042 = 2676 s (0h44m36s) — NGAN NHAT chuoi gan day
- T10-161 dong 11:10:55Z (= 1795259455); btime #64 muon hon: 1795259718 - 1795259455 = 263 s (0h04m23s) — reboot SAU khi T10 dong so
- requeue #64: 0 requeue trong cua 11:15:18-11:35:51Z (moi job); 0 requeue trong cua rong 11:15:18-13:56:00Z (moi job)
- spanning btime #64: 0 dong — KHONG run nao dang chay tai btime #64

### Phu luc C — Run 162 (van running luc dong co T7-162, jitter 0 s)
- sched 1795260951 = 2026-11-21T11:35:51Z; started 1795260951 = 2026-11-21T11:35:51Z (jitter 0 s)
- claimed 1795260952 = 2026-11-21T11:35:52Z (started + 1 s)
- han ngan sach (started goc + 10800): 1795271751 = 2026-11-21T14:35:51Z (ket cuc thuoc T7-163)
- tuoi goc luc doc cuoi #7 (2026-11-21T13:56:37Z): 1795269397 - 1795260951 = 8446 s (2h20m46s); con 2354 s toi han
- events run 162: chua kiem (chi doc job_runs; T7-163 kiem events day du)

### Phu luc D — Slot HB/DR cua T7-162 (doc #1-#7, 11:38Z-13:56Z)
- HB sched 2026-11-21T11:20:50Z: started 2026-11-21T11:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T11:50:50Z: started 2026-11-21T11:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T12:20:50Z: started 2026-11-21T12:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T12:50:50Z: started 2026-11-21T12:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T13:20:50Z: started 2026-11-21T13:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T13:50:50Z: started 2026-11-21T13:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-21T11:00:00Z: started 2026-11-21T11:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T12:00:00Z: started 2026-11-21T12:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T13:00:00Z: started 2026-11-21T13:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (toan -316 s; 0 muon, 0 thieu), DR 3/3 (toan 0 s; 0 thieu) — CUA LANH
- Luy ke: HB 44/357 -> 44/363 (so thieu +0); DR 49/249 -> 49/252 (so thieu +0)
- Ti le thieu: HB 12.1%; DR 19.4%
- Muon HB luy ke: GIU 9 (+887 s x6, +889 s, +891 s, +888 s dot 161; 0 muon moi dot 162)

### Phu luc E — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #38 AM; #39 DUONG (+40,799 s); #41 DUONG (+44,994 s); #42 DUONG (+33,236 s)
- #44 DUONG (+40,640 s); #45 AM ung vien (run 152 dang chay, 0 requeue); #46 DUONG (+48,375 s)
- #47 DUONG (+33,566 s) — viet lai lan 2 run 153
- #49 DUONG (+42,981 s) — viet lai run 154
- #50 DUONG (+49,761 s) — viet lai run 155 — VUOT max cu 48,375 s; dai moi (ung vien) 33-49,8 s
- #51 DUONG (+39,522 s) — viet lai run 155 lan 2
- #52 KHONG PHAI diem du lieu (0 run dang chay tai btime 17:19:09Z)
- #53 DUONG (+41,111 s) — viet lai run 156 lan 1
- #54 DUONG (+39,649 s) — viet lai run 156 lan 2
- #55 DUONG (+34,916 s) — viet lai run 156 lan 3
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 + T2-159 + T2-160 + T2-161 + T2-162 KHONG thu hep duoc cua: R 2,56251-2,66817 s / J 2,566-2,80753 s — lan thu NAM)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — viet lai run 157 lan 2; TINH BANG GIO THAT
- #59 DUONG (+35,173 s) — viet lai run 158 lan 1; TINH BANG GIO THAT
- #60 DUONG (+46,642 s) — CHAP NHAN (quyet (f) dot 159); viet lai run 159 lan 1; TINH BANG GIO THAT
- #61 KHONG PHAI diem du lieu (T7-160: 0 run dang chay tai btime 05:25:49Z; 0 requeue trong cua 05:25:49-05:35:51Z) — cung mau #52
- #62 AM — CHAP NHAN (quyet (s) dot 161): run 160 dang chay tai btime 07:59:29Z (that), 0 requeue — chu ky nhu #45; overlap 824-854 s la co che giai thich
- #63 DUONG — CHAP NHAN (quyet (t) dot 161): viet lai run 161 lan 1, requeue 10:31:19.128Z = btime + 37,128 s — TRONG dai 33-49,8 s
- #64 KHONG PHAI diem du lieu (T7-162 + T2-162 doi chieu khop): 0 run dang chay tai btime 11:15:18Z (run 161 finished 11:11:39Z, 219 s truoc btime; run 162 started 11:35:51Z, sau btime); 0 requeue trong cua 11:15:18-11:35:51Z — cung mau #52/#61
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet #56
- n ung vien = 20 (17 duong + 3 am, nhanh khuyen nghi) hoac 21 (17 duong + 4 am, nhanh #56 AM) — GIU (da cong #62 AM + #63 DUONG theo quyet (s)/(t) dot 161; #64 KHONG cong)
- Dai requeue duong ung vien GIU 33-49,8 s (#64 khong co requeue, khong anh huong dai)
- LUU Y SO HIEU: 348dab54=#56; bcbaa3ad=#57; 28366bd0=#58; eec65561=#59; e590ae0a=#60; 52c957d5=#61; 39d46ba0=#62 (XAC NHAN quyet (o) dot 161); 94d22520=#63 (XAC NHAN quyet (p) dot 161); d9a8d1ce=#64 (T0/T2/T7-162 xac minh doc lap — cho parent xac nhan)
