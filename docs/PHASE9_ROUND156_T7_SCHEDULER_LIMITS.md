# PHASE9 ROUND156 T7 — RUN 155 SUCCEEDED (wall danh nghĩa 9.638 s, margin danh nghĩa 1.162 s) + 4 REBOOT GIỮA PHIÊN (#52/#53/#54/#55) — RUN 156 VIẾT LẠI 3 LẦN (điểm (m) ứng viên #11/#12/#13/#14, DƯƠNG) + CỬA SLOT LÀNH HOÀN TOÀN

- **Luồng:** T7 đợt 156 (lượt cron 00:35 +07 21/11/2026 = 17:35:51Z 20/11). Nhiệm vụ theo brief T7-156: (1) kết cục run 155 — run này vẫn `running` lúc T7-155 đóng cờ, hạn ngân sách 17:35:51Z; (2) run 155 có bị viết lại tại #51 không, có bị viết lại tại reboot ~17:19Z không; (3) theo dõi run 156 + slot HB/DR + reboot mới; (4) điểm (m): n chính thức (ứng viên) = 10 theo quyết (e) đợt 155 — chỉ đề xuất n=11/12 khi có bằng chứng requeue đo được; (5) LIMITS trung thực, phụ lục bằng script. Điều tra mẫu (m) đã ĐÓNG theo quyết (d) đợt 149 + (j) đợt 151 + (f) đợt 153 + (f) đợt 154 + (e) đợt 155 — T7 CHỈ GHI NHẬN các điểm dữ liệu mới, KHÔNG mở điều tra mới, không kết luận lại cơ chế. Chứng nhận clock/mù thuộc T2-156/157 (T7 phối hợp bằng bằng chứng scheduler DB).
- **Boot trong phiên:** mở phiên là **5353ed19-ddcb-46cc-9eca-9c9f86ba9706** (btime /proc/stat 1795195149 = 17:19:09Z — **reboot #52 ứng viên**, đã nêu trong brief); **3 reboot ứng viên GIỮA PHIÊN: #53** 18:26:15Z → boot **062850d8-b3d6-4161-a6f3-d7461f471523**, **#54** 18:29:43Z → boot **447f0efe-55aa-460d-8f11-3e002f6ccf44**, **#55** 19:04:44Z → boot **c99a1045-ac22-47bb-8a43-a568c2b03051**. KHÔNG có reboot nào sau #55 (kiểm boot_id ở mọi lần đọc: ~17:39Z, ~18:06Z, ~18:27Z, ~18:31Z, ~18:39Z, ~18:56Z, ~19:05Z, ~19:31Z, ~19:52Z).
- **LỆCH SỐ HIỆU VỚI COORDINATOR/T4 — GHI RÕ, KHÔNG TỰ ĐỔI SỐ:** coordinator/T4-156 gọi boot 447f0efe (btime 18:29:43Z) là reboot ứng viên **#53** (T4 phát hiện trong lúc đóng sổ, sau khi poller T4 thoát). Đếm tuần tự của T7: sau #51 (c931d371, 17:05:29Z) có 4 boot mới — 5353ed19 (17:19:09Z) = #52 (brief đã nêu), 062850d8 (18:26:15Z) = #53, 447f0efe (18:29:43Z) = **#54**, c99a1045 (19:04:44Z) = **#55**. T7 đã xác minh cả 4 boot bằng boot_id + btime + journal + last/wtmp, và cả 4 đều có bằng chứng DB (xem §2.3–2.4). Suy ra T4/coordinator ĐÃ BỎ SÓT reboot 062850d8 (18:26:15Z) khi đánh số. T7 giữ số hiệu tuần tự của mình trong file này; giao parent/T2-157 chốt số hiệu chính thức + mù đi kèm (coordinator giao mù #85? cho T2-157 — theo cách đếm của coordinator; theo cách đếm tuần tự của T7, mù #85? ứng với #53 (062850d8), còn 447f0efe ứng #86? và c99a1045 ứng #87?). Xem §2.6.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 155/156 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 155 §11.2–11.4 + §12.3 (quyết parent (e): n = 10 ứng viên; (k): kết cục run 155 thuộc T7-156), LIMITS T7-155 + NOTES round156-t7, thông báo giữa phiên của coordinator về reboot 447f0efe (đã xác minh độc lập trước khi ghi — T7 đã ghi reboot này ở đọc #7 lúc ~18:30Z, TRƯỚC khi nhận thông báo ~18:38Z; thông báo chỉ là xác nhận chéo, không phải nguồn đầu tiên). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 155 kết cục? | **`succeeded`** 17:16:29Z (event 17:16:29.583Z), wall danh nghĩa từ started gốc **9.638 s**, margin danh nghĩa **1.162 s** (19m22s) tới hạn 17:35:51Z | §2.1, Phụ lục A |
| Run 155 có bị viết lại tại #51 không? | **CÓ — ĐIỂM DỮ LIỆU (m) ỨNG VIÊN THỨ 11, DƯƠNG** (requeue btime + **39,522 s**, trong dải 33–49,8 s) | §2.1, §2.4 |
| Run 155 có bị viết lại tại #52 (~17:19Z) không? | **KHÔNG** — finished 17:16:29Z, TRƯỚC btime #52 160 s; 0 requeue quanh #52; 0 run spanning btime #52. #52 KHÔNG PHẢI điểm dữ liệu (m) | §2.3 |
| Reboot #53/#54/#55 có viết lại run nào không? | **CÓ — 3 ĐIỂM (m) ỨNG VIÊN MỚI, ĐỀU DƯƠNG:** #53 +41,111 s, #54 +39,649 s, #55 +34,916 s — cả 3 đều viết lại run 156 (lần 1/2/3) | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) = 10** theo quyết (e) đợt 155. N ứng viên = **14** (thêm #51, #53, #54, #55 — cả 4 DƯƠNG) — chờ parent quyết | §2.4, Phụ lục E |
| Cửa slot đợt 156? | **CỬA LÀNH HOÀN TOÀN:** HB 6/6 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới — lần thứ tư liên tiếp lành hoàn toàn | §2.5 |
| Run 156? | **Jitter 0 s** (started gốc = scheduled_for = 17:35:51Z), **vẫn `running` lúc đóng cờ** (~19:52Z, tuổi gốc 8.201 s, còn 2.599 s tới hạn 20:35:51Z). Kết cục thuộc T7-157 | §2.2 |
| Mâu thuẫn khung giờ mới tại #51/#53/#54/#55? | **KHÔNG có từ DB.** Event cuối trước mỗi btime đều trước btime, thứ tự xuôi; requeue đều trong dải 33–49,8 s | §2.3–2.4 |
| Lệch số hiệu reboot với T4/coordinator? | **CÓ — T4 gọi 447f0efe là #53, T7 đếm tuần tự là #54** (T4 bỏ sót 062850d8 18:26:15Z). T7 giữ số của mình, giao parent chốt | §2.6 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–155): heartbeat **44/327 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/234 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 155 — SUCCEEDED, margin danh nghĩa 1.162 s (8 lần đọc DB đầy đủ khớp nhau)

Run 155 (`b3c9a712-d6b7-4398-9960-b0313eff723d`, sched 1795185351 = 14:35:51Z 20/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795185351 = 14:35:51Z 20/11 |
| started_at GỐC (dispatch 14:35:51.157Z) | 14:35:51Z — jitter 0 s |
| started_at sau viết lại #50 | 1795187096 = 15:04:56Z |
| started_at sau viết lại #51 (nay) | 1795194368 = 17:06:08Z (không đổi trong đợt 156) |
| finished_at_utc | 1795194989 = 17:16:29Z (event `succeeded` 17:16:29.583Z, eid 9452) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795194981 = 17:16:21Z (finished − 8 s) |
| Wall từ started gốc (danh nghĩa) | 1795194989 − 1795185351 = **9.638 s** (2h40m38s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795196151 = 17:35:51Z — finished TRƯỚC hạn **1.162 s** (19m22s) |
| Wall từ started viết lại #51 | 1795194989 − 1795194368 = 621 s (10m21s) |

- Events run 155 (đầy đủ, 8 event, không thiếu): `dispatched` 14:35:51.157Z (eid 9409) → `requeued_after_restart` 15:04:56.761Z (#50, eid 9419) → `dispatched` 15:04:56.828Z (9420) → `reattached_after_restart` 15:04:56.895Z (9421) → **`requeued_after_restart` 17:06:08.523Z (#51, eid 9446, "daemon startup recovery")** → `dispatched` 17:06:08.584Z (9447) → `reattached_after_restart` 17:06:08.638Z (9448) → **`succeeded` 17:16:29.583Z (9452)**. **KHÔNG có event nào cho run 155 sau 17:16:29Z. KHÔNG có event requeue/reattach nào tại #52.**
- Đọc lại xác nhận 8 lần khớp nhau ở mọi trường (~17:39Z, ~18:06Z, ~18:27Z, ~18:31Z, ~18:56Z, ~19:05Z, ~19:31Z, ~19:52Z) + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin danh nghĩa):** 149: 1.875 s; 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: **1.162 s** — hẹp nhất kể từ 153 (hẹp hơn 154 đúng 103 s), vẫn trong dải hẹp kể từ 152. **Mẫu (m) KHÔNG tái diễn ở 155→156 theo nghĩa run sau jitter 0:** run 155 succeeded (không timeout) + run 156 jitter 0 s — lần thứ chín liên tiếp.
- **Ghi chú claimed_at ĐỔI sau khi T7-155 đóng cờ:** T7-155 ghi claimed_at = 1795185351 (gốc) lúc đóng cờ ~16:48Z. T7-156 đọc #1 (~17:39Z) thấy claimed_at = 1795194981 = 17:16:21Z (finished − 8 s). Không có event scheduler nào tương ứng (không có event mới giữa reattached 9448 và succeeded 9452) — claimed_at là cột được cập nhật khi worker claim cuối trước khi finished, không phải viết lại do reboot. T7 chỉ ghi nhận, không suy luận cơ chế. Claimed → finished 8 s (run 154 là 7 s — cùng họ 7–8 s, khác mẫu 4–5 s của run 146–153; ghi nhận, không suy luận).

### 2.2 Run 156 — jitter 0 s, vẫn running lúc đóng cờ (đã viết lại 3 lần tại #53/#54/#55)

Run 156 (`9c7b6986-46fd-4a31-beea-2e36272d1d26`, sched 1795196151 = 17:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795196151 | 17:35:51Z 20/11 |
| dispatched (event) | — | 17:35:51.107Z (eid 9454) |
| started_at GỐC | 1795196151 | 17:35:51Z — **jitter 0 s** |
| started_at sau viết lại #53 | 1795199216 | 18:26:56Z |
| started_at sau viết lại #54 | 1795199422 | 18:30:22Z |
| started_at nay (viết lại #55) | 1795201518 | 19:05:18Z |
| worker_claimed_at | 1795196151 | 17:35:51Z (gốc, không viết lại lần nào) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795206951 | 20:35:51Z 20/11 |

- 8 lần đọc DB đầy đủ trong phiên (~17:39Z, ~18:06Z, ~18:27Z, ~18:31Z, ~18:56Z, ~19:05Z, ~19:31Z, ~19:52Z) + 1 lần đọc riêng run 156 lúc 18:39:33Z: status `running` ở cả 9 lần; started_at chỉ đổi ĐÚNG 3 lần (tại #53, #54, #55 — mỗi lần khớp 1 event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` 17:35:51.107Z (9454) + 3 bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #53 (9467/9468/9469), #54 (9470/9471/9472), #55 (9482/9483/9484) — không có event nào khác.
- Tuổi run từ gốc: 1.828 s lúc đọc #5 (18:06:19Z), 3.118 s lúc đọc #6 (18:27:49Z), 3.312 s lúc đọc #7 (18:31:03Z), 4.837 s lúc đọc #8 (18:56:28Z), 5.406 s lúc đọc #9 (19:05:57Z), 6.934 s lúc đọc #10 (19:31:25Z), **8.201 s lúc đọc cuối #11 (19:52:32Z)** — còn 2.599 s tới hạn ngân sách 20:35:51Z. **Kết cục thuộc T7-157.**
- **Run 156 là run ĐẦU TIÊN bị viết lại 3 lần** (kỷ lục trước: run 153 viết lại 2 lần tại #46/#47). Viết lại không đồng nghĩa timeout; timeout chỉ xảy ra khi wall từ started GỐC vượt ngân sách.

### 2.3 Reboot #52 lúc mở — boot mới, KHÔNG viết lại run nào, KHÔNG phải điểm dữ liệu (m)

- **Reboot #52: boot c931d371 → 5353ed19-ddcb-46cc-9eca-9c9f86ba9706, btime 1795195149 = 17:19:09Z.** T7 mở phiên trên boot này (~17:38Z); `uptime -s` 17:19:09Z; `last reboot` 17:19 still running; wtmp bắt đầu 17:19:25Z (= btime +16 s). Tuổi boot #51 (c931d371): 1795195149 − 1795194329 = 820 s (13m40s).
- **Run 155 finished 17:16:29Z — TRƯỚC btime #52 đúng 160 s** (1795195149 − 1795194989). Run 156 chưa dispatch (17:35:51Z). Truy vấn runs spanning btime #52: **0 run**. Truy vấn requeue events trong cửa 17:00–17:45Z: **CHỈ 1** (run 155 tại #51, eid 9446) — **KHÔNG có requeue nào quanh #52** (cửa ứng viên 17:19:42–17:19:59Z trống).
- **#52 KHÔNG PHẢI điểm dữ liệu (m)** — cùng tiền lệ #48 (không run nào đang chạy tại btime). Ghi rõ để tránh đếm nhầm: có reboot nhưng không có run nào để viết lại.

### 2.4 Reboot #53/#54/#55 giữa phiên — viết lại run 156 ba lần, 3 điểm (m) ứng viên mới, ĐỀU DƯƠNG

- **Reboot #53: boot 5353ed19 → 062850d8-b3d6-4161-a6f3-d7461f471523, btime 1795199175 = 18:26:15Z.** Xác minh 4 nguồn: boot_id + btime + journal (chỉ 1 boot, entry đầu 18:26:26Z = btime +11 s) + last/wtmp (wtmp bắt đầu 18:26:26Z). Tuổi boot #52: 4.026 s (1h07m06s). Sleep 1.800 s của T7 (bắt đầu ~18:06:19Z) **BỊ GIẾT bằng SIGTERM sau 1.222 s** (~18:26:41Z — SAU btime 26 s; xem §3.6 về mẫu SIGTERM-sau-btime).
  - **Run 156 ĐANG CHẠY tại btime và BỊ VIẾT LẠI (lần 1):** started_at 1795196151 → 1795199216 = 18:26:56Z; requeue event 18:26:56.112Z (eid 9467) = **btime + 41,111 s**. Claimed_at VẪN 1795196151 (gốc). Chỉ 1 requeue trong cửa 18:00–18:35Z tại thời điểm kiểm (run 156, eid 9467 — kiểm lại sau #54 thấy thêm eid 9470, xem dưới).
- **Reboot #54: boot 062850d8 → 447f0efe-55aa-460d-8f11-3e002f6ccf44, btime 1795199383 = 18:29:43Z.** Xác minh 4 nguồn (journal entry đầu 18:29:55Z = btime +12 s; wtmp bắt đầu 18:29:55Z). **Tuổi boot #53 chỉ 208 s (3m28s) — boot ngắn nhất trong chuỗi quan sát.** Sleep 1.500 s của T7 BỊ GIẾT bằng SIGTERM sau 119 s (~18:29:48Z — sau btime ~5 s, ước lượng, xem F-156-T7-1).
  - **Run 156 BỊ VIẾT LẠI (lần 2):** started_at 1795199216 → 1795199422 = 18:30:22Z; requeue event 18:30:22.649Z (eid 9470) = **btime + 39,649 s**. Claimed_at VẪN 1795196151 (gốc). Chỉ 2 requeue trong cửa 18:26–18:35Z, cả hai đều run 156 (#53 eid 9467 + #54 eid 9470).
  - **Thông báo coordinator ~18:38Z:** T4-156 phát hiện reboot này trong lúc đóng sổ (sau khi poller T4 thoát) và gọi là **#53**. T7 đã ghi reboot này ở đọc #7 lúc ~18:30Z, TRƯỚC khi nhận thông báo; thông báo chỉ là xác nhận chéo. Lệch số hiệu xem §2.6. Kiểm tra lại 18:39:33Z: vẫn boot 447f0efe, run 156 vẫn running, started_at 1795199422 không đổi.
- **Reboot #55: boot 447f0efe → c99a1045-ac22-47bb-8a43-a568c2b03051, btime 1795201484 = 19:04:44Z.** Xác minh 4 nguồn (journal entry đầu 19:04:55Z = btime +11 s; wtmp bắt đầu 19:04:55Z). Tuổi boot #54: 2.101 s (35m01s). Sleep 1.500 s của T7 BỊ GIẾT bằng SIGTERM sau 499 s (~19:05:1xZ — sau btime ~20–35 s, ước lượng, xem F-156-T7-1).
  - **Run 156 BỊ VIẾT LẠI (lần 3):** started_at 1795199422 → 1795201518 = 19:05:18Z; requeue event 19:05:18.916Z (eid 9482) = **btime + 34,916 s**. Claimed_at VẪN 1795196151 (gốc). Chỉ 1 requeue trong cửa 19:00–19:10Z (run 156, eid 9482).
  - **+34,916 s gần min dải (33,236 s #42) nhưng KHÔNG phá min** (còn cách 1,680 s); cũng không vượt trần 49,761 s (#50).
- **KHÔNG có slot nào mất tại #53/#54/#55:** DR 18:00Z finished 18:00:00Z (trước btime #53 1.575 s); HB 18:20:50Z dispatched 18:15:34Z (trước btime #53); HB 18:50:50Z dispatched 18:45:34Z (sau btime #54); DR 19:00Z finished 19:00:00Z (trước btime #55 284 s); HB 19:20:50Z dispatched 19:15:34Z (sau btime #55). Daemon hồi phục trước slot tiếp theo trong cả 3 trường hợp.
- **KHÔNG có mâu thuẫn khung giờ mới tại #53/#54/#55 (khác #45):** event cuối trước mỗi btime đều trước btime, thứ tự xuôi. Requeue đều trong dải 33–49,8 s.
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng):** #38 ÂM, #39/#41/#42/#44/#46/#47/#49/#50/#51/#53/#54/#55 DƯƠNG (12 dương), #45 ÂM (ứng viên) → **n ứng viên = 14** (12 dương + 2 âm). **Số chính thức (ứng viên) = 10 theo quyết (e) đợt 155 cho tới khi parent quyết có tính #51/#53/#54/#55 vào n không.** Dải requeue dương ứng viên giữ **33–49,8 s** (không có điểm mới nào phá min/max).
- **#51 (từ §2.1):** requeue run 155 lần 2 tại btime 17:05:29Z, created 17:06:08.523Z = **btime + 39,522 s** → điểm (m) ứng viên thứ 11, DƯƠNG, trong dải. Đây là điểm T7-156 được giao xác minh chính (brief) — đã xác minh bằng started_at + event requeue eid 9446.

### 2.5 Slot HB/DR trong cửa 17:00Z → 19:52Z 20/11 — HB 6/6 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h52' (11 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:20:50 (17:20:50Z) | e8f0dc9c | 17:15:34 | −316 s | CÓ |
| 00:50:50 (17:50:50Z) | 8f755e26 | 17:45:34 | −316 s | CÓ |
| 01:20:50 (18:20:50Z) | f38f20ee | 18:15:34 | −316 s | CÓ |
| 01:50:50 (18:50:50Z) | 63850b9f | 18:45:34 | −316 s | CÓ |
| 02:20:50 (19:20:50Z) | 20517aa2 | 19:15:34 | −316 s | CÓ |
| 02:50:50 (19:50:50Z) | cb4058b6 | 19:45:34 | −316 s | CÓ |

- 6/6 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (vắng 4 đợt liên tiếp: 153, 154, 155, 156).
- Slot HB 16:50:50Z đã đếm ở đợt 155 — T7-156 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:00 (17:00Z) | 96022d11 | 17:00:00 | 0 s | CÓ |
| 01:00 (18:00Z) | f891aa1e | 18:00:00 | 0 s | CÓ |
| 02:00 (19:00Z) | 203768a4 | 19:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 20:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-157.

### 2.6 Lệch số hiệu reboot với coordinator/T4 — giao parent chốt (T7 không tự đổi số)

- Chuỗi boot sau #51 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #52 = 5353ed19 (17:19:09Z, brief đã nêu), #53 = 062850d8 (18:26:15Z), #54 = 447f0efe (18:29:43Z), #55 = c99a1045 (19:04:44Z).
- Coordinator/T4-156 gọi 447f0efe là **#53** — tức T4 đã bỏ sót reboot 062850d8 (18:26:15Z) khi đánh số (poll T4 thoát trước đó hoặc T4 không kiểm boot trong cửa 18:26–18:29Z). Verdict T4 #25 KHÔNG bị ảnh hưởng theo thông báo coordinator (mọi poll trên boot cũ) — T7 ghi nhận, không kiểm lại poll T4 (ngoài phạm vi).
- Hệ quả mù (mù = reboot + 32 theo tiền lệ #82?→#50, #83?→#51): coordinator giao mù **#85?** cho T2-157. Theo cách đếm tuần tự của T7, #85? ứng với #53 (062850d8), còn 447f0efe ứng **#86?** và c99a1045 ứng **#87?**. **T7 không chứng nhận mù nào; giao parent/T2-157 chốt cả số hiệu reboot lẫn số hiệu mù** trước khi ghi vào GAP.
- T7 dùng số hiệu tuần tự (#52/#53/#54/#55) xuyên suốt file này và phụ lục; mọi boot_id/btime đều ghi đầy đủ để đối chiếu dù parent chốt số nào.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 155/156 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này không bắt được phép tính nháp sai nào — xem §6). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 18:26:56.112Z), không qua extract-epoch làm tròn.
4. Cửa kiểm đợt này ~2h52' (17:00Z → 19:52Z 20/11), đủ 6 slot HB + 3 slot DR + run vcut 155 (kết cục) và 156 (theo dõi). Mười một lần đọc DB; run 155/156 được đọc đầy đủ 8 lần khớp hoàn toàn nhau ở mọi trường trùng (run 156 thêm 1 lần đọc riêng 18:39:33Z); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 16:50:50Z + DR 16:00Z thuộc cửa 155 theo quy ước đứng (T7-155 đã đếm); slot DR 17:00Z + HB 17:20:50Z thuộc cửa 156 (sau kiểm cuối T7-155 lúc 16:48Z). DR 20:00Z thuộc cửa T7-157.
6. **3 sleep bị giết trong phiên này** (sleep 1.800 s, SIGTERM sau 1.222 s, do reboot #53; sleep 1.500 s, SIGTERM sau 119 s, do reboot #54; sleep 1.500 s, SIGTERM sau 499 s, do reboot #55); 4 sleep còn lại (1.500 s + 1.500 s + 1.500 s + 1.200 s) hoàn thành bình thường. **Mẫu SIGTERM-sau-btime lần này NGƯỢC mẫu T7-155** (T7-155: SIGTERM ~20 s TRƯỚC btime #50; đợt này cả 3 lần SIGTERM đều SAU btime — #53: +26 s đo được; #54/#55: ước lượng vài giây–vài chục giây, xem F-156-T7-1). T7 ghi rõ, không suy luận cơ chế (thứ tự SIGTERM-vs-btime không phải tín hiệu chẩn đoán — cùng kết luận T7-155). Boot đổi 5353ed19 → 062850d8 → 447f0efe → c99a1045: 3 lần đổi trong phiên (tại #53/#54/#55), cộng boot #52 lúc mở.
7. T7 đóng cờ ~19:53Z, trước hạn cờ ~20:00Z ~7 phút (hạn cứng toàn đợt 20:30Z còn ~37'). Ghi rõ, không giấu. Run 156 vẫn running lúc đóng cờ — kết cục thuộc T7-157 (hạn ngân sách 20:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix156.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 155, cùng phương pháp)

- Heartbeat: 44/321 → **44/327 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 02:50:50 +07). Kiểm toán cửa sổ: 321 + 6 slot mới = 327 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/231 → **49/234 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 02:00 +07). Kiểm toán: 231 + 3 = 234 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/327 = 13,5% (giảm từ 13,7% — 0 thiếu mới); DR 49/234 = 20,9% (giảm từ 21,2% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (vắng 4 đợt liên tiếp).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 155: SUCCEEDED theo hồ sơ daemon (wall danh nghĩa 9.638 s, margin danh nghĩa 1.162 s)** — 8 lần đọc DB đầy đủ khớp nhau + events đầy đủ (8 event, gồm viết lại tại #50 và #51). Margin hẹp nhất kể từ đợt 153.
2. **Reboot #51 viết lại run 155 lần 2 — điểm dữ liệu (m) ứng viên thứ 11, DƯƠNG** (requeue btime + 39,522 s). **Reboot #53/#54/#55 viết lại run 156 ba lần — điểm (m) ứng viên thứ 12/13/14, ĐỀU DƯƠNG** (+41,111 s / +39,649 s / +34,916 s). **n chính thức (ứng viên) VẪN = 10 theo quyết (e) đợt 155; n ứng viên = 14 — chờ parent quyết có tính #51/#53/#54/#55 vào n không.** Dải requeue dương ứng viên giữ 33–49,8 s (không điểm mới nào phá min/max). Điều tra (m) ĐÃ ĐÓNG — T7 chỉ ghi nhận, KHÔNG mở điều tra mới.
3. **Reboot #52 KHÔNG phải điểm dữ liệu (m)** (0 run đang chạy tại btime; run 155 finished trước 160 s) — cùng tiền lệ #48.
4. **LỆCH SỐ HIỆU: T4/coordinator gọi 447f0efe là #53, T7 đếm tuần tự là #54** (T4 bỏ sót 062850d8 18:26:15Z). Giao parent/T2-157 chốt số hiệu reboot + số hiệu mù (#85? theo coordinator hay #86?/#87? theo T7) trước khi ghi GAP. Mù #85? đã giao T2-157 theo thông báo coordinator.
5. **Cửa slot LÀNH HOÀN TOÀN lần thứ tư liên tiếp (HB 6/6, DR 3/3, 0 muộn, 0 thiếu).**
6. **Run 156 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.201 s, còn 2.599 s tới hạn ngân sách 20:35:51Z) — kết cục thuộc T7-157. Không đổi số đếm đợt 156. Run 156 là run đầu tiên bị viết lại 3 lần.
7. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). Mù #74?/#75?/#76? đã ĐÓNG theo quyết (c) đợt 155 (CERT76/FULL91 chính thức); #77? VẪN MỞ; #78?–#81? giữ mở theo thứ tự; #82?/#83?/#84?/#85?/#86?/#87? giao T2-156/157 (T7 không chứng nhận mù). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-156-T7-1 — Hai mốc "SIGTERM sau btime" trong NOTES nháp là ƯỚC LƯỢNG, không phải đo trực tiếp (đã sửa cách ghi trong LIMITS):** NOTES nháp ghi SIGTERM tại #54 là "~18:29:48Z — sau btime ~5 s" và tại #55 là "~19:05:0xZ — sau btime ~20 s" — hai số này suy từ thời lượng sleep bị giết (119 s / 499 s) cộng thời điểm bắt đầu sleep ước lượng, KHÔNG có timestamp giết trực tiếp (tiến trình bị giết trước khi kịp in `date -u`). Chỉ mốc #53 là đo được chắc: sleep bắt đầu 18:06:19Z (in ra trước khi sleep) + 1.222 s = giết ~18:26:41Z, sau btime 18:26:15Z đúng 26 s. LIMITS §2.4/§3.6 đã ghi rõ #54/#55 là ước lượng. Số liệu cứng không đổi: thời lượng sleep (119 s / 499 s), boot đổi, btime, requeue — đều đo trực tiếp. Bài học: khi sleep bị giết thì chỉ ghi thời lượng + boot đổi, không tự suy timestamp giết.
- **F-156-T7-0 — Không có sai số nào khác trong đợt này:** 8 lần đọc DB đầy đủ khớp nhau ở mọi trường trùng (run 155/156) + 1 lần đọc riêng run 156; mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×3 slot, run 155 wall gốc 9.638 s / margin 1.162 s / wall viết lại #51 621 s / claimed→finished 8 s, run 156 jitter 0 s, requeue #51 +39,522 s / #53 +41,111 s / #54 +39,649 s / #55 +34,916 s (created_at trực tiếp), tuổi boot #51 820 s / #52 4.026 s / #53 208 s / #54 2.101 s, run 155 finished trước btime #52 160 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số, và 5 epoch tuổi run 156 đã đối chiếu `date -u` sau khi script chạy); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở mọi lần đọc (5353ed19 → 062850d8 → 447f0efe → c99a1045, đúng 3 lần đổi trong phiên + boot #52 lúc mở) và khớp thông báo coordinator về 447f0efe (T7 ghi trước khi nhận thông báo); ở mọi lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 155 có 8 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 17:16:29.583Z, eid 9452), không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round156-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round156-t7/NOTES.md` + `appendix156.py` + `appendix156.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round156-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix156.py` từ epoch thô — xem file `appendix156.txt` trong round156-t7)

### Phu luc A — Run 155 (ket cuc SUCCEEDED, T7-156)
- sched 1795185351 = 14:35:51Z; started GOC 1795185351 = 14:35:51Z (jitter 0 s)
- started sau viet lai #50 1795187096 = 15:04:56Z; started sau viet lai #51 1795194368 = 17:06:08Z
- claimed 1795194981 = 17:16:21Z (finished - 8 s)
- finished 1795194989 = 17:16:29Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795194989 - 1795185351 = 9638 s (2h40m38s)
- han ngan sach: 1795196151 = 17:35:51Z; margin: 1795196151 - 1795194989 = 1162 s (0h19m22s)
- wall tu started viet lai #51: 1795194989 - 1795194368 = 621 s (0h10m21s)
- offset viet lai #50 (tu goc): 1795187096 - 1795185351 = 1745 s (0h29m05s)
- offset viet lai #51 (tu goc): 1795194368 - 1795185351 = 9017 s (2h30m17s)
- finished TRUOC btime #52: 1795195149 - 1795194989 = 160 s

### Phu luc B — Run 156 (van running luc dong co, T7-156)
- sched 1795196151 = 17:35:51Z; started GOC 1795196151 = 17:35:51Z (jitter 0 s)
- started sau viet lai #53 1795199216 = 18:26:56Z; sau #54 1795199422 = 18:30:22Z; sau #55 (nay) 1795201518 = 19:05:18Z
- claimed 1795196151 = 17:35:51Z (goc, khong viet lai)
- han ngan sach: 1795206951 = 20:35:51Z
- doc #5 18:06:19Z: tuoi goc 1828 s (0h30m28s); con 8972 s (2h29m32s) toi han
- doc #6 18:27:49Z: tuoi goc 3118 s (0h51m58s); con 7682 s (2h08m02s) toi han
- doc #7 18:31:03Z: tuoi goc 3312 s (0h55m12s); con 7488 s (2h04m48s) toi han
- doc #8 18:56:28Z: tuoi goc 4837 s (1h20m37s); con 5963 s (1h39m23s) toi han
- doc #9 19:05:57Z: tuoi goc 5406 s (1h30m06s); con 5394 s (1h29m54s) toi han
- doc #10 19:31:25Z: tuoi goc 6934 s (1h55m34s); con 3866 s (1h04m26s) toi han
- doc #11 (cuoi) 19:52:32Z: tuoi goc 8201 s (2h16m41s); con 2599 s (0h43m19s) toi han

### Phu luc C — Reboot #52/#53/#54/#55
- #51: btime 1795194329 = 17:05:29Z, boot c931d371
- #52 (mo phien): btime 1795195149 = 17:19:09Z, boot 5353ed19
- #53: btime 1795199175 = 18:26:15Z, boot 062850d8
- #54 (T4/coordinator goi la #53): btime 1795199383 = 18:29:43Z, boot 447f0efe
- #55: btime 1795201484 = 19:04:44Z, boot c99a1045
- tuoi boot #51: 820 s (0h13m40s); #52: 4026 s (1h07m06s); #53: 208 s (0h03m28s); #54: 2101 s (0h35m01s)
- tuoi boot #55 luc dong co: 2868 s (0h47m48s)
- requeue #51: btime + 39,522 s; #53: btime + 41,111 s; #54: btime + 39,649 s; #55: btime + 34,916 s
- run 156 dispatch -> btime #53: 3024 s; -> #54: 3232 s; -> #55: 5333 s

### Phu luc D — Slot HB/DR cua T7-156
- HB sched 17:20:50Z run e8f0dc9c: started 17:15:34Z, jitter -316 s, succeeded
- HB sched 17:50:50Z run 8f755e26: started 17:45:34Z, jitter -316 s, succeeded
- HB sched 18:20:50Z run f38f20ee: started 18:15:34Z, jitter -316 s, succeeded
- HB sched 18:50:50Z run 63850b9f: started 18:45:34Z, jitter -316 s, succeeded
- HB sched 19:20:50Z run 20517aa2: started 19:15:34Z, jitter -316 s, succeeded
- HB sched 19:50:50Z run cb4058b6: started 19:45:34Z, jitter -316 s, succeeded
- DR sched 17:00:00Z run 96022d11: started 17:00:00Z, jitter 0 s, succeeded
- DR sched 18:00:00Z run f891aa1e: started 18:00:00Z, jitter 0 s, succeeded
- DR sched 19:00:00Z run 203768a4: started 19:00:00Z, jitter 0 s, succeeded
- Tong cua: HB 6/6 (0 thieu, 0 muon), DR 3/3 (0 thieu)
- Luy ke: HB 44/321 -> 44/327 (so thieu +0); DR 49/231 -> 49/234 (so thieu +0)
- Ti le thieu: HB 13,5%; DR 20,9%

### Phu luc E — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #38 AM (run 148 khong viet lai); #39 DUONG (+40,799 s); #41 DUONG (+44,994 s); #42 DUONG (+33,236 s)
- #44 DUONG (+40,640 s); #45 AM ung vien (run 152 dang chay, 0 requeue); #46 DUONG (+48,375 s)
- #47 DUONG (+33,566 s) — viet lai lan 2 run 153
- #49 DUONG (+42,981 s) — viet lai run 154
- #50 DUONG (+49,761 s) — viet lai run 155 — VUOT max cu 48,375 s; dai moi (ung vien) 33–49,8 s
- #51 DUONG (+39,522 s) — viet lai run 155 lan 2
- #52 KHONG PHAI diem du lieu (0 run dang chay tai btime 17:19:09Z)
- #53 DUONG (+41,111 s) — viet lai run 156 lan 1
- #54 DUONG (+39,649 s) — viet lai run 156 lan 2
- #55 DUONG (+34,916 s) — viet lai run 156 lan 3
- n CHINH THUC (ung vien, quyet (e) dot 155) = 10; n ung vien moi = 14 (them #51, #53, #54, #55 — ca 4 DUONG) — cho parent quyet
- LUU Y SO HIEU: T4/coordinator goi boot 447f0efe la #53 (bo sot 062850d8); T7 dem tuan tu goi la #54. Giao parent chot.
