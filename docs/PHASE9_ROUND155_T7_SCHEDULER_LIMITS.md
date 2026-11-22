# PHASE9 ROUND155 T7 — RUN 154 SUCCEEDED (wall danh nghĩa 9.535 s, margin danh nghĩa 1.265 s) + REBOOT #50 GIỮA PHIÊN VIẾT LẠI RUN 155 (điểm (m) ứng viên thứ 10, DƯƠNG, btime + 49,761 s — VƯỢT TRẦN CŨ 48,375 s) + CỬA SLOT LÀNH HOÀN TOÀN

- **Luồng:** T7 đợt 155 (lượt cron 21:35 +07 20/11/2026 = 14:35:51Z 20/11). Nhiệm vụ theo brief T7-155: (1) kết cục run 154 — run này vẫn `running` lúc T7-154 đóng cờ, hạn ngân sách 14:35:51Z (đúng lúc đợt 155 mở); (2) theo dõi run 155 + slot HB/DR + reboot mới; (3) ghi nhận quyết parent (f) đợt 154: n mẫu (m) = 9 (ỨNG VIÊN), điều tra (m) VẪN ĐÓNG — chỉ ghi thêm điểm (m) mới nếu quan sát được viết lại run trong đợt 155; (4) LIMITS trung thực, phụ lục bằng script. Điều tra mẫu (m) đã ĐÓNG theo quyết (d) đợt 149 + (j) đợt 151 + (f) đợt 153 + (f) đợt 154 — T7 CHỈ GHI NHẬN các điểm dữ liệu mới, KHÔNG mở điều tra mới, không kết luận lại cơ chế. Chứng nhận clock/mù thuộc T2-155 (T7 phối hợp bằng bằng chứng scheduler DB).
- **Boot trong phiên:** mở phiên là **12fc68a3-10f4-4459-908f-b0a47615afae** (btime /proc/stat 1795179912 = 13:05:12Z — **reboot #49**, T7-154 đã ghi); **reboot #50 GIỮA PHIÊN** 15:04:07Z → boot mới **d849728b-b8b9-43d4-b3f5-e218facbfdb0** (btime 1795187047 = 15:04:07Z), KHÔNG có reboot nào sau #50 (kiểm boot_id ở cả 6 lần đọc: ~14:40Z, ~15:06Z, ~15:32Z, ~16:02Z, ~16:28Z, ~16:48Z).
- **Ghi rõ thực tế về hạn ngân sách run 154 (theo brief):** hạn ngân sách run 154 là 14:35:51Z — **ĐÃ QUA lúc đợt 155 mở** (run 155 dispatch đúng 14:35:51Z; phiên T7-155 mở ~14:39Z). Run 154 finished 14:14:46Z, tức TRƯỚC hạn 1.265 s — kết cục được xác định trước hạn, T7-155 chỉ quan sát/xác nhận sau hạn. Verdict không phụ thuộc thời điểm quan sát.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 154/155 đầy đủ; HB/DR theo slot), aggregate đợt 154 §12.3 (quyết parent (f): n = 9 ứng viên), LIMITS T7-154 + NOTES round155-t7, thông báo giữa phiên của coordinator về reboot #50 (đã xác minh độc lập 4 nguồn + DB trước khi ghi — T7 đã ghi #50 ở đọc #2, trước khi nhận thông báo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 154 kết cục? | **`succeeded`** 14:14:46Z (event 14:14:46.621Z), wall danh nghĩa từ started gốc **9.535 s**, margin danh nghĩa **1.265 s** (21m05s) tới hạn 14:35:51Z | §2.1, Phụ lục A |
| Run 154 có bị viết lại thêm sau T7-154 không? | **KHÔNG** — started_at vẫn 1795179955 (viết lại tại #49), claimed vẫn 1795184079 qua cả 6 lần đọc; 0 event mới sau succeeded | §2.1 |
| Reboot #50 có viết lại run nào không? | **CÓ — ĐIỂM DỮ LIỆU (m) ỨNG VIÊN THỨ 10, DƯƠNG** (run 155 viết lại: requeue btime + **49,761 s** — VƯỢT max cũ 48,375 s; dải mới ứng viên 33–49,8 s) | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) = 9** theo quyết (f) đợt 154. N ứng viên = **10** (thêm #50 DƯƠNG) — chờ parent quyết | §2.4, Phụ lục E |
| Cửa slot đợt 155? | **CỬA LÀNH HOÀN TOÀN:** HB 6/6 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới — lần thứ ba liên tiếp lành hoàn toàn | §2.5 |
| Run 155? | **Jitter 0 s** (started gốc = scheduled_for = 14:35:51Z), **vẫn `running` lúc đóng cờ** (~16:48Z, tuổi gốc 7.958 s, còn 2.842 s tới hạn 17:35:51Z). Kết cục thuộc T7-156 | §2.6 |
| Mâu thuẫn khung giờ mới tại #50? | **KHÔNG có từ DB.** Event cuối trước btime DR 15:00:00Z, thứ tự xuôi; requeue +49,761 s vượt trần cũ nhưng không đủ để kết luận bước nhảy (mù #82? giao T2-156) | §2.3–2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–154): heartbeat **44/321 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/231 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 154 — SUCCEEDED, margin danh nghĩa 1.265 s (6 lần đọc DB khớp nhau)

Run 154 (`b0209c7e-6958-45a9-baba-c2e036526cef`, sched 1795174551 = 11:35:51Z 20/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795174551 = 11:35:51Z 20/11 |
| started_at GỐC (dispatch 11:35:51.109Z) | 11:35:51Z — jitter 0 s |
| started_at sau viết lại #49 | 1795179955 = 13:05:55Z (không đổi trong đợt 155) |
| finished_at_utc | 1795184086 = 14:14:46Z (event `succeeded` 14:14:46.621Z, eid 9404) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795184079 = 14:14:39Z (7 s trước finished — dài hơn mẫu 4–5 s của run 146–153, xem ghi chú dưới) |
| Wall từ started gốc (danh nghĩa) | 1795184086 − 1795174551 = **9.535 s** (2h38m55s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795185351 = 14:35:51Z — finished TRƯỚC hạn **1.265 s** (21m05s) |
| Wall từ started viết lại | 1795184086 − 1795179955 = 4.131 s (1h08m51s) |

- Events run 154 (đầy đủ, 5 event, không thiếu, không mới sau T7-154): `dispatched` 11:35:51.109Z (eid 9365) → `requeued_after_restart` 13:05:54.981Z (#49, "daemon startup recovery", eid 9389) → `dispatched` 13:05:55.283Z (9390) → `reattached_after_restart` 13:05:55.409Z (9391, "execute turn already complete (model-output evidence)") → `succeeded` 14:14:46.621Z (9404). **KHÔNG có event nào cho run 154 sau 14:14:46Z. KHÔNG có event requeue/reattach nào tại #50.**
- Đọc lại xác nhận 6 lần khớp nhau ở mọi trường (~14:40Z, ~15:06Z, ~15:32Z, ~16:02Z, ~16:28Z, ~16:48Z) + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin danh nghĩa):** 149: 1.875 s; 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: **1.265 s** — rộng hơn 153 một chút (74 s), vẫn trong dải hẹp kể từ 152. **Mẫu (m) KHÔNG tái diễn ở 154→155 theo nghĩa run sau jitter 0:** run 154 succeeded (không timeout) + run 155 jitter 0 s — lần thứ tám liên tiếp.
- **Ghi chú claimed → finished 7 s (khác mẫu 4–5 s):** run 154 claimed 14:14:39Z, finished 14:14:46Z — chênh 7 s, dài hơn mẫu runs 146–153 (đều 4–5 s). T7 chỉ ghi nhận, không suy luận cơ chế (chênh 2–3 s nằm trong biến thiên đóng dấu; verdict không phụ thuộc). Run 155 claimed = started gốc (chưa finished nên chưa có số so sánh).
- **Hạn ngân sách đã qua lúc mở đợt:** xem đầu file — kết cục xác định trước hạn 1.265 s; T7-155 quan sát sau hạn. Không có suy luận nào trong verdict phụ thuộc thời điểm quan sát.

### 2.2 Siết T45_thực — KHÔNG mở lại (quyết parent (d) đợt 154 đã GỠ PROVISIONAL)

- Brief T7-155 ghi rõ: T45_thực pin trực tiếp THẤT BẠI nhưng verdict run 152 SUCCEEDED đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154 — **KHÔNG mở lại**. T7-155 tuân thủ: không truy vấn lại cửa sổ T45_thực, không kết luận lại. Chỉ ghi nhận run 152 không đổi trong đợt này (không đọc lại — ngoài phạm vi brief; T7-154 đã xác nhận 7 lần đọc).

### 2.3 Reboot #50 giữa phiên — boot mới, viết lại run 155, không mất slot

- **Reboot #50: boot 12fc68a3 → d849728b-b8b9-43d4-b3f5-e218facbfdb0, btime 1795187047 = 15:04:07Z.** Uptime 1 phút lúc kiểm 15:05:08Z; journal 1 boot, entry đầu 15:04:24Z (= btime +17 s); `last reboot` 15:04 still running; wtmp bắt đầu 15:04:23Z (= btime +16 s). Xác minh 4 nguồn (boot_id + /proc/stat btime + journal + last/wtmp — cùng mẫu xác minh #47/#49 của T10-153/T7-154). Coordinator giữa phiên xác nhận độc lập cùng boot/btime (thông báo 15:22Z +07 — T7 đã ghi #50 ở đọc #2 lúc ~15:06Z, TRƯỚC khi nhận thông báo; thông báo chỉ là xác nhận chéo, không phải nguồn đầu tiên).
- Sleep 1.500 s của T7 (bắt đầu ~14:41:37Z) **BỊ GIẾT bằng SIGTERM sau 1.331 s** (~15:03:47Z) — tức ~20 s TRƯỚC btime (SIGTERM lúc shutdown, trước khi kernel mới boot). Khác ước lượng thô của T7-154 về #49 (giết ~20–40 s sau btime) — ước lượng đó thô, không dùng làm chuẩn; T7 ghi rõ: SIGTERM shutdown có thể đến trước btime, thứ tự SIGTERM-vs-btime không phải tín hiệu chẩn đoán. 3 sleep còn lại (1.500 s + 1.800 s + 1.500 s) hoàn thành bình thường.
- Tuổi danh nghĩa boot 12fc68a3 (#49→#50): 1795187047 − 1795179912 = 7.135 s (1h58m55s).
- **KHÔNG có slot nào mất tại #50:** DR 15:00Z finished 15:00:00Z (trước btime 247 s); HB 15:20:50Z dispatched 15:15:34Z (sau btime 687 s, jitter −316 s chuẩn). Daemon hồi phục trước slot tiếp theo.

### 2.4 Reboot #50 — viết lại run 155, điểm (m) ứng viên thứ 10, DƯƠNG, VƯỢT TRẦN CŨ

- **Run 155 (run của chính đợt này) ĐANG CHẠY tại btime #50 và BỊ VIẾT LẠI:** started_at 1795185351 → 1795187096 = 15:04:56Z (offset 1.745 s); requeue event 15:04:56.761Z = **btime + 49,761 s**. Claimed_at VẪN 1795185351 (gốc). Events: `dispatched` 14:35:51.157Z (eid 9409) → `requeued_after_restart` 15:04:56.761Z (9419, "daemon startup recovery") → `dispatched` 15:04:56.828Z (9420) → `reattached_after_restart` 15:04:56.895Z (9421, "execute turn already complete (model-output evidence)" — cùng mẫu #41/#42/#44/#46/#47/#49).
- **DẢI requeue dương MỞ RỘNG: 49,761 s VƯỢT max cũ 48,375 s (#46) 1,386 s.** Dải mới (ứng viên): **33–49,8 s** (min 33,236 s #42; max 49,761 s #50). T7 ghi nhận đúng số, KHÔNG tự đổi dải chính thức — dải chính thức vẫn 33–48,4 s cho tới khi parent quyết (điểm #50 là điểm dương đầu tiên vượt trần cũ; vượt 1,386 s ≈ 2,9% trên trần cũ — nhỏ, nhưng là lần đầu tiên trong 8 điểm dương mà trần bị phá; xem §5.3).
- **KHÔNG có khoảng im lặng dài tại #50 (giống #44/#46/#49, khác #43/#45):** daemon sống tới sát reboot — feed-pulse-19 12:41:54Z (đợt 154), HB 14:50:50Z, DR 15:00:00Z (event cuối trước btime: DR succeeded 15:00:00.333Z); gap DR-succeeded → requeue 15:04:56.761Z = 296,761 s, trong đó daemon-down thật chỉ 49,761 s (btime → requeue), còn 247 s trước btime là im lặng bình thường (không có slot đến hạn). Event đầu tiên sau #50 là requeue (btime + 49,761 s) — recovery nhanh, cùng họ mốc ~40–50 s. Chỉ có DUY NHẤT 1 event `requeued_after_restart` trong cửa — cho run 155.
- **KHÔNG có mâu thuẫn khung giờ mới tại #50 (khác #45):** event cuối trước btime (DR 15:00:00Z) TRƯỚC btime 15:04:07Z — thứ tự thời gian xuôi, không ép bước nhảy. Requeue +49,761 s vượt trần cũ nhưng không đủ để kết luận bước nhảy (mù #82? giao T2-156 theo thông báo coordinator; T7 không chứng nhận mù).
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng): #38 ÂM, #39/#41/#42/#44/#46/#47/#49/#50 DƯƠNG (8 dương), #45 ÂM (ứng viên) → n ứng viên = 10 (8 dương + 2 âm). Số chính thức (ứng viên) = 9 theo quyết (f) đợt 154 cho tới khi parent quyết có tính #50 vào n không.** Dải requeue dương ứng viên mới 33–49,8 s.

### 2.5 Slot HB/DR trong cửa 13:50Z → 16:48Z 20/11 — HB 6/6 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~3h00' (6 lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:20:50 (14:20:50Z) | 118fb2af | 14:15:34 | −316 s | CÓ |
| 21:50:50 (14:50:50Z) | d5b0d248 | 14:45:34 | −316 s | CÓ |
| 22:20:50 (15:20:50Z) | d3416eef | 15:15:34 | −316 s | CÓ |
| 22:50:50 (15:50:50Z) | e6255327 | 15:45:34 | −316 s | CÓ |
| 23:20:50 (16:20:50Z) | 494476e3 | 16:15:34 | −316 s | CÓ |
| 23:50:50 (16:50:50Z) | f4e1a260 | 16:45:34 | −316 s | CÓ |

- 6/6 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (vắng 3 đợt liên tiếp: 153, 154, 155).
- Slot HB 13:50:50Z đã đếm ở đợt 154 — T7-155 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:00 (14:00Z) | a067cde0 | 14:00:00 | 0 s | CÓ |
| 22:00 (15:00Z) | d7851c15 | 15:00:00 | 0 s | CÓ |
| 23:00 (16:00Z) | 86060032 | 16:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 17:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-156.

### 2.6 Run 155 — jitter 0 s, vẫn running lúc đóng cờ (đã viết lại tại #50)

Run 155 (`b3c9a712-d6b7-4398-9960-b0313eff723d`, sched 1795185351 = 14:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795185351 | 14:35:51Z 20/11 |
| dispatched (event) | — | 14:35:51Z |
| started_at GỐC | 1795185351 | 14:35:51Z — **jitter 0 s** |
| started_at nay (viết lại tại #50) | 1795187096 | 15:04:56Z (= btime #50 + 49 s) |
| worker_claimed_at | 1795185351 | 14:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795196151 | 17:35:51Z 20/11 |

- 6 lần đọc DB trong phiên (~14:40Z, ~15:06Z, ~15:32Z, ~16:02Z, ~16:28Z, ~16:48Z): status `running` ở cả 6 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #50, khớp event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` + `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #50 — không có event nào khác.
- Tuổi run từ gốc: 304 s lúc kiểm lần 1 (~14:40:55Z), 1.808 s lúc kiểm lần 2 (~15:05:59Z), 3.379 s lúc kiểm lần 3 (15:32:10Z), 5.193 s lúc kiểm lần 4 (16:02:24Z), 6.729 s lúc kiểm lần 5 (16:28:00Z), **7.958 s lúc kiểm cuối (16:48:29Z)** — còn 2.842 s tới hạn ngân sách 17:35:51Z. **Kết cục thuộc T7-156.**
- **Mẫu (m) KHÔNG tái diễn ở 154→155 theo nghĩa run sau jitter 0:** run 154 succeeded (không timeout) + run 155 jitter 0 s — lần thứ tám liên tiếp. Lưu ý: run 155 ĐÃ bị viết lại started_at tại #50 (như run 149 tại #39, run 150 tại #41, run 151 tại #42, run 152 tại #44, run 153 tại #46/#47, run 154 tại #49) — viết lại không đồng nghĩa timeout; timeout chỉ xảy ra khi wall từ started GỐC vượt ngân sách.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 154/155 đầy đủ; events lọc theo run_id). Job IDs đã xác minh: heartbeat (interval@30m) / deterministic-doctor (interval@1h) / vcut-build-loop (interval@3h, Asia/Saigon). Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này đã bắt được 2 phép tính nháp sai — xem §6). Số giây requeue #50 lấy từ `created_at` timestamptz trực tiếp (15:04:56.761Z), không qua extract-epoch làm tròn.
4. Cửa kiểm đợt này ~2h58' (13:50Z → 16:48Z 20/11), đủ 6 slot HB + 3 slot DR + run vcut 154 (kết cục) và 155 (theo dõi). Sáu lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa. Run 154 được đọc lại xác nhận 5 lần sau lần đầu (6 lần đọc độc lập khớp nhau + events đối chiếu).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 13:50:50Z + DR 13:00Z thuộc cửa 154 theo quy ước đứng (T7-154 đã đếm); slot DR 14:00Z + HB 14:20:50Z thuộc cửa 155 (sau kiểm cuối T7-154 lúc 13:46Z). DR 17:00Z thuộc cửa T7-156.
6. **1 sleep bị giết trong phiên này** (sleep 1.500 s, SIGTERM sau 1.331 s, do reboot #50 — cùng hiện tượng #39/#42/#44/#46/#49); 3 sleep còn lại (1.500 s + 1.800 s + 1.500 s) hoàn thành bình thường. Boot đổi 12fc68a3 → d849728b đúng 1 lần trong phiên (tại #50).
7. T7 đóng cờ ~16:52Z, trước hạn cờ 17:00Z ~8 phút (hạn cứng toàn đợt 17:30Z còn ~38'). Ghi rõ, không giấu. Run 155 vẫn running lúc đóng cờ — kết cục thuộc T7-156 (hạn ngân sách 17:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix155.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 154, cùng phương pháp)

- Heartbeat: 44/315 → **44/321 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 23:50:50 +07). Kiểm toán cửa sổ: 315 + 6 slot mới = 321 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/228 → **49/231 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 23:00 +07). Kiểm toán: 228 + 3 = 231 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/321 = 13,7% (giảm từ 14,0% — 0 thiếu mới); DR 49/231 = 21,2% (giảm từ 21,5% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (vắng 3 đợt liên tiếp).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 154: SUCCEEDED theo hồ sơ daemon (wall danh nghĩa 9.535 s, margin danh nghĩa 1.265 s)** — 6 lần đọc DB khớp nhau + events đầy đủ (5 event, gồm viết lại tại #49). Run 154 là run thứ hai liên tiếp finished trước hạn hơn 1.100 s sau chuỗi margin hẹp 152–153.
2. **Reboot #50 GIỮA phiên viết lại run 155 — điểm dữ liệu (m) ứng viên thứ 10, DƯƠNG** (requeue btime + 49,761 s). **n chính thức (ứng viên) VẪN = 9 theo quyết (f) đợt 154; n ứng viên = 10 — chờ parent quyết có tính #50 vào n không.** Điều tra (m) ĐÃ ĐÓNG — T7 chỉ ghi nhận, KHÔNG mở điều tra mới.
3. **Dải requeue dương ứng viên MỞ RỘNG 33–49,8 s** (vượt trần cũ 48,375 s 1,386 s ≈ 2,9%) — lần đầu tiên trong 8 điểm dương mà trần bị phá. T7 không tự đổi dải chính thức (33–48,4 s); parent quyết dải mới có được chấp nhận không. Ghi rõ: vượt nhỏ, 1 điểm duy nhất — chưa đủ để kết luận dải đã dịch chuyển hệ thống.
4. **Cửa slot LÀNH HOÀN TOÀN lần thứ ba liên tiếp (HB 6/6, DR 3/3, 0 muộn, 0 thiếu).**
5. **Run 155 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 7.958 s, còn 2.842 s tới hạn ngân sách 17:35:51Z) — kết cục thuộc T7-156. Không đổi số đếm đợt 155.
6. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). Mù #74?/#75?/#76?/#77?/#78?/#79?/#80?/#81?/#82? + gap #42/#43/#44/#45 chỉ là ứng viên (chưa chứng nhận) — giao T2-155/156 (T7 không chứng nhận mù). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-155-T7-1 — Tuổi run 155 ở đọc #3 ghi sai trong NOTES nháp (bắt được trước khi stage):** NOTES nháp ghi tuổi gốc lúc 15:32:10Z là 2.179 s / còn 8.621 s — SAI (epoch nháp 1795187552 = 15:12:32Z, không phải 15:32:10Z). Epoch đúng 15:32:10Z là 1795188730 → tuổi **3.379 s**, còn **7.421 s**. Đã SỬA trong NOTES; LIMITS §8 do script tính từ epoch thô nên không dính lỗi này. Cùng họ sai số nhầm epoch như F-147-T7-1/F-148-T7-1/F-149-T7-3/F-150-T7-1/F-151-T7-1/F-152-T7-1/F-153-T7-1/F-154-T7-1 — đối chiếu epoch bằng `date -u -d @<epoch>` trước khi ghi là chốt chặn bắt được (lần thứ 9 liên tiếp).
- **F-155-T7-2 — Script phụ lục bắt được epoch sai trong `appendix155.py` (đã sửa trước khi stage):** bản nháp script ghi epoch đọc #2 là 1795188359 (= 15:25:59Z) thay vì 1795187159 (= 15:05:59Z, khớp `date -u` lúc đọc) — sai 1.200 s, tuổi run 155 nháp 3.008 s thay vì 1.808 s. Bắt được khi đối chiếu epoch ↔ `date -u` trước khi stage; đã SỬA script và chạy lại. Đây chính là bài học đứng "phụ lục chỉ viết bằng script" phát huy tác dụng (lần thứ 3 liên tiếp script bắt lỗi số — đợt 153 là tuổi run nháp sai, đợt 154 là epoch session jsonl sai).
- **F-155-T7-0 — Không có sai số nào khác trong đợt này:** 6 lần đọc DB khớp nhau ở mọi slot trùng; mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×3 slot, run 154 wall gốc 9.535 s / margin 1.265 s / wall viết lại 4.131 s, run 155 jitter 0 s, requeue #50 btime + 49,761 s (created_at trực tiếp), offset viết lại run 155 1.745 s, gap danh nghĩa #50 296,761 s / daemon-down 49,761 s, tuổi boot 12fc68a3 7.135 s, run 155 dispatch → btime #50 1.696 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 6 lần đọc (12fc68a3 → d849728b đúng 1 lần, tại #50) và khớp thông báo coordinator + T2-155 về reboot #50; ở cả 6 lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 154 có 6 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 14:14:46.621Z, eid 9404), không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round155-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round155-t7/NOTES.md` + `appendix155.py` + `appendix155.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round155-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix155.py` từ epoch thô — xem file `appendix155.txt` trong round155-t7)

### Phu luc A — Run 154 (ket cuc SUCCEEDED, T7-155)
- sched 1795174551 = 11:35:51Z; started GOC 1795174551 = 11:35:51Z (jitter 0 s)
- started nay (viet lai #49) 1795179955 = 13:05:55Z; claimed 1795184079 = 14:14:39Z (finished - 7 s)
- finished 1795184086 = 14:14:46Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795184086 - 1795174551 = 9535 s (2h38m55s)
- han ngan sach: 1795185351 = 14:35:51Z; margin: 1795185351 - 1795184086 = 1265 s (0h21m05s)
- wall tu started viet lai: 1795184086 - 1795179955 = 4131 s (1h08m51s)
- offset viet lai (tu goc): 1795179955 - 1795174551 = 5404 s (1h30m04s)

### Phu luc B — Run 155 (van running luc dong co, T7-155)
- sched 1795185351 = 14:35:51Z; started GOC 1795185351 = 14:35:51Z (jitter 0 s)
- started nay (viet lai #50) 1795187096 = 15:04:56Z; claimed 1795185351 = 14:35:51Z (goc, khong viet lai)
- offset viet lai (tu goc): 1795187096 - 1795185351 = 1745 s (0h29m05s)
- han ngan sach: 1795196151 = 17:35:51Z
- doc #1 ~14:40:55Z: tuoi goc 304 s (0h05m04s); con 10496 s (2h54m56s) toi han
- doc #2 ~15:05:59Z: tuoi goc 1808 s (0h30m08s); con 8992 s (2h29m52s) toi han
- doc #3 15:32:10Z: tuoi goc 3379 s (0h56m19s); con 7421 s (2h03m41s) toi han
- doc #4 16:02:24Z: tuoi goc 5193 s (1h26m33s); con 5607 s (1h33m27s) toi han
- doc #5 16:28:00Z: tuoi goc 6729 s (1h52m09s); con 4071 s (1h07m51s) toi han
- doc #6 16:48:29Z: tuoi goc 7958 s (2h12m38s); con 2842 s (0h47m22s) toi han

### Phu luc C — Reboot #50
- btime 1795187047 = 15:04:07Z; boot d849728b-b8b9-43d4-b3f5-e218facbfdb0
- requeue run 155 created_at 15:04:56.761Z = btime + 49,761 s (49 s theo epoch giay)
- started viet lai 1795187096 - btime 1795187047 = 49 s (epoch giay)
- tuoi danh nghia boot 12fc68a3 (#49->#50): 1795187047 - 1795179912 = 7135 s (1h58m55s)
- run 155 dispatch -> #50 btime: 1795187047 - 1795185351 = 1696 s (0h28m16s)
- DR 15:00Z finished -> #50 btime: 1795187047 - 1795186800 = 247 s

### Phu luc D — Slot HB/DR cua T7-155
- HB sched 14:20:50Z run 118fb2af: started 14:15:34Z, jitter -316 s, succeeded
- HB sched 14:50:50Z run d5b0d248: started 14:45:34Z, jitter -316 s, succeeded
- HB sched 15:20:50Z run d3416eef: started 15:15:34Z, jitter -316 s, succeeded
- HB sched 15:50:50Z run e6255327: started 15:45:34Z, jitter -316 s, succeeded
- HB sched 16:20:50Z run 494476e3: started 16:15:34Z, jitter -316 s, succeeded
- HB sched 16:50:50Z run f4e1a260: started 16:45:34Z, jitter -316 s, succeeded
- DR sched 14:00:00Z run a067cde0: started 14:00:00Z, jitter 0 s, succeeded
- DR sched 15:00:00Z run d7851c15: started 15:00:00Z, jitter 0 s, succeeded
- DR sched 16:00:00Z run 86060032: started 16:00:00Z, jitter 0 s, succeeded
- Tong cua: HB 6/6 (0 thieu, 0 muon), DR 3/3 (0 thieu)
- Luy ke: HB 44/315 -> 44/321 (so thieu +0); DR 49/228 -> 49/231 (so thieu +0)
- Ti le thieu: HB 13,7%; DR 21,2%

### Phu luc E — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #38 AM (run 148 khong viet lai); #39 DUONG (+40,799 s); #41 DUONG (+44,994 s); #42 DUONG (+33,236 s)
- #44 DUONG (+40,640 s); #45 AM ung vien (run 152 dang chay, 0 requeue); #46 DUONG (+48,375 s)
- #47 DUONG (+33,566 s) — viet lai lan 2 run 153
- #49 DUONG (+42,981 s) — viet lai run 154
- #50 DUONG (+49,761 s) — viet lai run 155 — VUOT max cu 48,375 s; dai moi (ung vien) 33–49,8 s
- n CHINH THUC (ung vien, quyet (f) dot 154) = 9; n ung vien moi = 10 (them #50 DUONG) — cho parent quyet
- #48 KHONG PHAI diem du lieu (khong run nao dang chay tai btime)
