# PHASE9 ROUND152 T7 — RUN 151 SUCCEEDED (wall gốc 8.972 s, margin 1.828 s) + REBOOT #43 TRƯỚC PHIÊN (không-test, n vẫn 4) + REBOOT #44 GIỮA PHIÊN VIẾT LẠI RUN 152 (điểm (m) thứ 5, DƯƠNG) + HB MUỘN +891 s LẦN THỨ 8 + IM LẶNG 1.818 s

- **Luồng:** T7 đợt 152 (lượt cron 12:35 +07 20/11/2026 = 05:35:51Z 20/11). Nhiệm vụ theo quyết parent §12.3 (t) đợt 151: (1) kết cục run 151 (hạn ngân sách 05:35:51Z); (2) kiểm started_at có bị viết lại ở reboot mới nhất không; (3) kiểm slot Heartbeat (HB) và Daily Run (DR) trong phiên; (4) đối chiếu nghịch lý đồng hồ tại #42 với T2; (5) bổ sung theo F-152-T1-1: #43 có giết/timeout run 151 không, started_at có bị viết lại lần nữa không. Điều tra mẫu (m) đã ĐÓNG theo quyết (d) đợt 149 + (j) đợt 151 — T7 CHỈ GHI NHẬN các điểm dữ liệu mới, KHÔNG mở điều tra mới, không kết luận lại cơ chế.
- **Boot trong phiên:** mở phiên là **18e179e0-365e-4298-92b8-b61b147f9600** (btime /proc/stat 1795152057 = 05:20:57Z — **reboot #43**, xảy ra TRƯỚC phiên, giữa T7-151 đóng cờ ~04:54Z và run 152 dispatch 05:35:51Z); **reboot #44 GIỮA PHIÊN** 07:04:11Z → boot mới **c741f5e6-7560-4222-bb82-2ce83590b48b** (btime 1795158251 = 07:04:11Z), KHÔNG có reboot nào sau #44 (kiểm boot_id ở cả 7 lần đọc: ~05:38Z, ~05:52Z, ~06:10Z, ~06:41Z, ~07:05Z, ~07:32Z, ~07:57Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut/HB/DR), LIMITS T7-151 + aggregate đợt 151 §7/§12.3 (t), NOTES round152-t7. Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 151 kết cục? | **`succeeded`** 05:05:23Z (event 05:05:23.319Z), wall từ started gốc **8.972 s**, margin **1.828 s** (30m28s) tới hạn ngân sách 05:35:51Z — thoải mái, khác hẳn margin 177 s của run 150 | §2.1 |
| #43 có giết/timeout run 151 không? (F-152-T1-1) | **KHÔNG.** Run 151 đã finished 05:05:23Z, TRƯỚC btime #43 (05:20:57Z) tới 934 s — reboot sau khi run kết thúc không thể giết/timeout nó | §2.2 |
| started_at bị viết lại tại #43? | **KHÔNG — nhưng ĐIỀU KIỆN TEST KHÔNG THỎA (không-test, không phải điểm âm mới).** Không có run nào đang chạy tại btime #43; 0 event requeue trong cửa 05:20:00–06:00:00Z | §2.2 |
| Reboot #44 trong phiên? | **CÓ — boot mới c741f5e6, btime 07:04:11Z; run 152 (run của chính đợt này) ĐANG CHẠY và BỊ VIẾT LẠI — ĐIỂM DỮ LIỆU THỨ 5, DƯƠNG** (requeue btime + 40,640 s — trong dải 33–45 s) | §2.3 |
| n mẫu (m)? | **n = 5: #38 ÂM, #39/#41/#42/#44 DƯƠNG.** Điều tra vẫn đóng — chỉ ghi nhận | §2.2–2.3 |
| Cửa slot đợt 152? | **KHÔNG lành hoàn toàn:** HB 6/6 (0 thiếu) nhưng **1 muộn lớn +891 s**; DR 3/3 (0 s); **khoảng im lặng scheduler 1.818 s** bao trùm #43 | §2.4 |
| Run 152? | **Jitter 0 s** (started gốc = scheduled_for = 05:35:51Z), **vẫn `running` lúc đóng cờ** (~07:57Z, tuổi gốc 8.495 s, còn 2.305 s tới hạn 08:35:51Z). Kết cục thuộc T7-153 | §2.5 |
| Nghịch lý đồng hồ tại #42? | **Chỉ ghi nhận, đối chiếu:** T9: btime boot mới sớm hơn 15 s so với mẫu cuối boot cũ (03:25:31Z); T8 (aggregate §8): 18 s — hai số chênh 3 s, T7 không phân xử; T2-152 chứng nhận mù #74? + clock tại #42 | §2.6 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–151): heartbeat **44/303 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/222 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 151 — SUCCEEDED, margin 1.828 s (theo lệ, 3 lần đọc DB + events đối chiếu)

Run 151 (`16eee8eb-d012-4221-bac9-9cf8e66e9b00`, sched 1795142151 = 02:35:51Z 20/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795142151 = 02:35:51Z 20/11 |
| started_at GỐC (dispatch 02:35:51.141Z) | 02:35:51Z — jitter 0 s |
| started_at nay (viết lại tại #42) | 1795145149 = 03:25:49Z |
| finished_at_utc | 1795151123 = 05:05:23Z (event `succeeded` 05:05:23.319Z) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795151079 = 05:04:39Z (44 s trước finished — cùng mẫu claimed sát finished như run 146/147/148/149/150) |
| Wall từ started gốc | 1795151123 − 1795142151 = **8.972 s** (2h29m32s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795152951 = 05:35:51Z — finished TRƯỚC hạn **1.828 s** (30m28s) |
| Wall từ started viết lại | 1795151123 − 1795145149 = 5.974 s (1h39m34s) |

- Events run 151 (đầy đủ, không thiếu): `dispatched` 02:35:51.141Z → `requeued_after_restart` 03:25:49.236Z (#42, detail "daemon startup recovery") → `dispatched` 03:25:49.305Z → `reattached_after_restart` 03:25:49.381Z (detail "execute turn already complete (model-output evidence)") → `succeeded` 05:05:23.319Z. **KHÔNG có event nào cho run 151 sau 05:05:23Z.**
- Đọc lại xác nhận 2 lần sau lần đọc đầu (~05:38Z, ~05:52Z bổ sung F-152-T1-1, ~07:57Z kiểm cuối): row giống hệt nhau ở mọi trường — 3 lần đọc độc lập khớp nhau + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn.
- **Margin 1.828 s là thoải mái** (16,9% ngân sách), trái ngược margin 177 s (1,6%) của run 150 — chuỗi run vcut gần đây: 149 margin 1.875 s, 150 margin 177 s, 151 margin 1.828 s.
- **Mẫu (m) KHÔNG tái diễn ở 150→151:** run 150 succeeded + run 151 succeeded — lần thứ tư liên tiếp mẫu (m) không tái diễn (148→149, 149→150, 150→151, và run 151 jitter 0 s đã ghi ở đợt 151).

### 2.2 Reboot #43 trước phiên — KHÔNG giết run 151, KHÔNG viết lại started_at, KHÔNG-test cho mẫu (m) (bổ sung F-152-T1-1)

- **Reboot #43: boot fad2aab9 → 18e179e0-365e-4298-92b8-b61b147f9600, btime 1795152057 = 05:20:57Z.** Phát hiện ở kiểm lần 1 (~05:37Z): uptime 16 phút, wtmp bắt đầu 05:21:13Z = btime + 16 s. Xảy ra GIỮA T7-151 đóng cờ (~04:54Z) và run 152 dispatch (05:35:51Z).
- **#43 KHÔNG giết/timeout run 151:** run 151 đã `succeeded` lúc 05:05:23.319Z, TRƯỚC btime #43 tới **934 s (15m34s)** (1795152057 − 1795151123 = 934). Lo ngại "đánh trúng run 151 TRƯỚC hạn ngân sách" là đúng về mặt thời gian (btime #43 05:20:57Z < hạn 05:35:51Z), nhưng run đã kết thúc trước đó nên #43 không ảnh hưởng kết cục. Không có event nào cho run 151 sau 05:05:23Z; worker_execution_timed_out false. **Ảnh hưởng của #43 lên run 151: KHÔNG CÓ.** Kết cục SUCCEEDED + wall gốc 8.972 s + margin 1.828 s đứng nguyên, không cần hiệu chỉnh.
- **started_at KHÔNG bị viết lại tại #43 — nhưng ĐIỀU KIỆN TEST KHÔNG THỎA:** tại btime #43 không có run vcut nào đang chạy (run 151 đã finished 934 s trước; run 152 dispatch 05:35:51Z, sau btime). Kiểm bổ sung: **0 event `requeued_after_restart` toàn bảng trong cửa 05:20:00–06:00:00Z**; started_at run 151 vẫn 1795145149 qua 3 lần đọc. Đây là trường hợp không-test, cùng loại với #40 (không có run đang chạy nên không kiểm được viết lại) — **KHÔNG tính là điểm âm mới, n VẪN = 4 sau #43 (sau §2.3, n lên 5 nhờ #44).**
- Hệ quả cho đợt 152: T10-152 đóng sổ trên boot c741f5e6 (sau #44); mù #75? (reboot #43) + mù #76? (reboot #44, giao T2-153) — T7 không chứng nhận mù, chỉ ghi btime/boot để T2 đối chiếu. **Lưu ý cho T2-152/153:** #43 giết sleep của T7? Không — phiên T7-152 mở sau #43 nên không có sleep nào bị #43 giết; sleep bị #44 giết (xem §2.3). Các luồng khác đợt 152 có process/sleep nào bị #43/#44 giết không thuộc phạm vi T7 (T10 kiểm).

### 2.3 Reboot #44 giữa phiên — run 152 bị viết lại, ĐIỂM DỮ LIỆU THỨ 5, DƯƠNG

- **Reboot #44: boot 18e179e0 → c741f5e6-7560-4222-bb82-2ce83590b48b, btime 1795158251 = 07:04:11Z.** Phát hiện khi sleep 1.800 s của T7 (bắt đầu ~06:41Z) **BỊ GIẾT bằng SIGTERM sau ~1.397 s** (~07:04:17Z, ~6 s sau btime) — cùng hiện tượng #42 giết sleep T7-151 (~10 s sau btime) và #39 giết sleep T7-149. Uptime 0 phút lúc kiểm 07:05:01Z; wtmp bắt đầu 07:04:26Z = btime + 15 s. Phiên T7-152 vẫn tiếp tục được (runtime báo kết thúc lệnh nền, T7 đọc lại DB ngay).
- **Run 152 (fb75f843-ba83-4ecf-a83c-9c00ab528226, run của chính đợt này): started_at ĐÃ BỊ VIẾT LẠI tại #44.** started_at gốc 1795152951 = 05:35:51Z (đọc ở kiểm lần 1 ~05:38Z, lần 2 ~06:10Z, lần 3 ~06:41Z — trùng nhau); sau #44 đọc được 1795158291 = 07:04:51Z, không đổi ở 2 lần đọc sau (~07:32Z, ~07:57Z). Offset viết lại: 1795158291 − 1795152951 = 5.340 s. claimed_at VẪN 1795152951 (gốc — chỉ started_at bị viết lại, claimed_at không đổi, giống mẫu #41/#42).
- Events run 152 (đầy đủ): `dispatched` 05:35:51.076Z → `requeued_after_restart` 07:04:51.640Z (detail "daemon startup recovery") → `dispatched` 07:04:51.695Z → `reattached_after_restart` 07:04:51.789Z (detail "execute turn already complete (model-output evidence)" — cùng mẫu #41/#42). Requeue = **btime + 40,640 s — nằm trong dải 33–45 s của cả 4 lần requeue dương** (#39 +40,799 s; #41 +44,994 s; #42 +33,236 s; #44 +40,640 s — dải 33–45 s giữ nguyên sau lần dương thứ 4).
- **Điều kiện test THỎA:** run 152 ĐANG CHẠY tại btime #44 (vẫn `running` ở kiểm lần 3 lúc 06:40:49Z, tuổi gốc 3.898 s; btime 07:04:11Z nằm giữa started gốc 05:35:51Z và thời điểm kiểm cuối — run vẫn `running` lúc đóng cờ).
- **n cho giả thuyết viết lại nay = 5: #38 ÂM, #39/#41/#42/#44 DƯƠNG.** Điều tra (m) ĐÃ ĐÓNG theo quyết (d) đợt 149 + (j) đợt 151 — T7 CHỈ GHI NHẬN điểm dữ liệu thứ 5 này, KHÔNG mở điều tra mới, không kết luận lại cơ chế. Dữ kiện mở duy nhất (điều kiện khiến recovery bỏ qua run 148 tại #38) VẪN MỞ, chỉ ghi nhận để theo dõi.
- **KHÔNG có khoảng im lặng dài tại #44 (khác #43 — xem §2.4):** daemon sống tới sát reboot (feed-pulse-13 06:41:54Z, HB 06:45:34Z, DR 07:00:00Z); event cuối trước #44 là DR succeeded 07:00:00.208Z; gap tới requeue 07:04:51.640Z = 291 s, trong đó daemon-down thật chỉ 40,640 s (btime → requeue), còn 251 s trước btime là im lặng bình thường (không có slot đến hạn). Chỉ có DUY NHẤT 1 event `requeued_after_restart` trong cửa — cho run 152.

### 2.4 Slot HB/DR trong cửa 04:52:53Z → 07:57:47Z 20/11 — HB 6/6 (1 muộn +891 s) + DR 3/3; im lặng 1.818 s bao trùm #43

Cửa kiểm ~3h05' (7 lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 1 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 12:20:50 (05:20:50Z) | 04c9ce3d | 05:35:41 | **+891 s** | CÓ, MUỘN |
| 12:50:50 (05:50:50Z) | c15b975b | 05:45:34 | −316 s | CÓ |
| 13:20:50 (06:20:50Z) | 167f5ef7 | 06:15:34 | −316 s | CÓ |
| 13:50:50 (06:50:50Z) | 2d97a8eb | 06:45:34 | −316 s | CÓ |
| 14:20:50 (07:20:50Z) | 2c550270 | 07:15:34 | −316 s | CÓ |
| 14:50:50 (07:50:50Z) | e8fec32c | 07:45:34 | −316 s | CÓ |

- 5/6 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started.
- **Slot HB 05:20:50Z MUỘN +891 s — TÁI HIỆN MẪU MUỘN LẦN THỨ 8:** đáng lẽ dispatch ~05:15:34Z, thực tế dispatch 05:35:41Z, succeeded cùng giây. Events chỉ 2: dispatched 05:35:41.347Z → succeeded 05:35:41.530Z. So sánh mẫu muộn: +887 s ×6 (đợt 127/129/130/132/134/136), +889 s (đợt 150, lần thứ 7), nay **+891 s (lần thứ 8; +4 s so với mẫu +887 s, +2 s so với +889 s; kỷ lục vẫn +1.252 s đợt 129)**. Slot muộn vẫn CÓ (succeeded) nên KHÔNG tính vào số thiếu lũy kế — chỉ ghi nhận là muộn lớn (theo lệ đợt 150). Mẫu muộn vắng ở đợt 151, quay lại ngay đợt sau — cùng nhịp "vắng một đợt rồi quay lại" như đợt 149 vắng → 150 tái hiện.
- **Khoảng im lặng scheduler 05:05:23Z → 05:35:41Z = 1.818 s (30m18s) — TÁI HIỆN DẠNG IM LẶNG ĐỢT 150 (1.863 s):** 0 event toàn bảng trong khoảng (kiểm cửa 04:52:00–05:38:00Z: 9 event — 3 event DR 05:00:00Z, succeeded run 151 05:05:23Z, rồi im tới reconciled 05:35:41Z). Trong khoảng: HB slot 05:20:50Z đáng lẽ dispatch ~05:15:34Z đã không dispatch (0 event toàn bảng trong cửa 05:14:00–05:17:00Z); reboot #43 (05:20:57Z) nằm trong khoảng im lặng; event đầu tiên sau #43 là `reconciled` 05:35:41.256Z (detail "jobs=28 changed_jobs=1 removed_jobs=0 new_runs=1 released_source_paths=0" — GIỐNG HỆT detail reconciled sau #40 đợt 150) rồi HB dispatch 05:35:41.347Z, rồi `reconciled` 05:35:51.050Z + vcut dispatch 05:35:51.076Z.
  - Diễn giải thận trọng (ghi nhận, không kết luận cơ chế): daemon đã im lặng từ sau 05:05:23Z — TRƯỚC #43 tới 934 s (15m34s) — nên #43 một mình không giải thích được toàn bộ khoảng im lặng (daemon im trước khi VM reboot; hoặc scheduler pass bị kẹt/treo mà DB không ghi lại). Event đầu tiên sau #43 ở **btime + 884 s** (05:35:41.256 − 05:20:57) — chậm hơn HẲN mốc recovery ở #39/#41/#42 (requeue btime +33–45 s) và cả mốc first-event sau #40 (+210 s). **Nguyên nhân khoảng im lặng + khởi động chậm: CHƯA XÁC ĐỊNH — ghi nhận là dữ kiện mở, không suy đoán thêm.** Cơ chế drop phía scheduler vẫn đóng theo hướng đợt 125 (quyết parent đợt 136 §12.3(j)).
  - So sánh im lặng #40 (đợt 150) vs #43 (đợt này): 1.863 s vs 1.818 s (chênh 45 s); daemon im trước reboot 27m33s vs 15m34s; first-event sau btime +210 s vs +884 s; HB muộn +889 s vs +891 s; cả hai đều kết thúc bằng reconciled (jobs=28, changed_jobs=1) rồi HB muộn dispatch rồi vcut dispatch đúng giờ. Cùng họ hiện tượng, lần thứ hai dạng này xuất hiện. Ghi nhận, không kết luận chu kỳ.
- **Khoảng im lặng tại #44: KHÔNG có** (xem §2.3 — daemon sống tới 07:00:00Z, requeue ở btime + 40,640 s).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 12:00 (05:00Z) | 3ac7e234 | 05:00:00 | 0 s | CÓ |
| 13:00 (06:00Z) | 09bdf6b4 | 06:00:00 | 0 s | CÓ |
| 14:00 (07:00Z) | 831923ee | 07:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 08:00Z chưa dispatch lúc đóng cờ (08:00:00Z sau kiểm cuối 07:57:47Z) — thuộc cửa T7-153.

### 2.5 Run 152 — jitter 0 s, vẫn running lúc đóng cờ

Run 152 (`fb75f843-ba83-4ecf-a83c-9c00ab528226`, sched 1795152951 = 05:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795152951 | 05:35:51Z 20/11 |
| dispatched (event) | — | 05:35:51.076Z |
| started_at GỐC | 1795152951 | 05:35:51Z — **jitter 0 s** |
| started_at nay (viết lại tại #44) | 1795158291 | 07:04:51Z (= btime #44 + 40 s) |
| worker_claimed_at | 1795152951 | 05:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795163751 | 08:35:51Z 20/11 |

- 7 lần đọc DB trong phiên (~05:38Z, ~05:52Z, ~06:10Z, ~06:41Z, ~07:05Z, ~07:32Z, ~07:57Z): status `running` ở cả 7 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #44, khớp event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` + `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #44 — không có event nào khác.
- Tuổi run từ gốc: 2.077 s lúc kiểm lần 2 (06:10:28Z), 3.898 s lúc kiểm lần 3 (06:40:49Z), 5.350 s lúc kiểm lần 4 (07:05:01Z), 6.963 s lúc kiểm lần 5 (07:31:54Z), **8.495 s (2h21m35s) lúc kiểm cuối (07:57:26Z)** — còn 2.305 s (38m25s) tới hạn ngân sách 08:35:51Z. **Kết cục thuộc T7-153.**
- **Mẫu (m) KHÔNG tái diễn ở 151→152:** run 151 succeeded (không timeout) + run 152 jitter 0 s — lần thứ năm liên tiếp (sau 148→149, 149→150, 150→151, 151→152 theo nghĩa run sau jitter 0). Lưu ý: run 152 ĐÃ bị viết lại started_at tại #44 (như run 149 tại #39, run 150 tại #41, run 151 tại #42) — viết lại không đồng nghĩa timeout; timeout chỉ xảy ra khi wall từ started GỐC vượt ngân sách.

### 2.6 Nghịch lý đồng hồ tại #42 — đối chiếu với T2 (chỉ ghi nhận, không phân xử)

- Parent đã quyết (§12.3 đợt 149): (i) XÁC NHẬN bác bỏ "X > 595 s"; (ii) mâu thuẫn 27 s: GIỮ KHOẢNG RỘNG e2 ∈ [313, 340] s, không chọn nhánh; (iii) khung #113?: CHỐT BẢN GIỜ THỰC (7 + e2 s).
- Tại #42, hai số đã ghi trong hồ sơ đợt 151 **chênh nhau 3 s** — T7 chỉ đối chiếu, không phân xử, không đo lại:
  - **T9 (aggregate 151 §9): btime boot mới sớm hơn 15 s so với mẫu cuối boot cũ (03:25:31Z)** — tức đồng hồ boot cũ 2e430750 nhanh ≥ +15 s lúc chết (btime 03:25:16Z vs mẫu cuối 03:25:31Z).
  - **T8 (aggregate 151 §8): nghịch lý đồng hồ 18 s (lớn nhất chuỗi 8/14/7/18 s)** — số 18 s, không rõ cùng mẫu đo với 15 s của T9 hay mẫu đo khác (T8 không ghi mẫu cuối 03:25:31Z trong LIMITS của mình; aggregate §11.150 cũng ghi 18 s).
  - Bối cảnh chuỗi: T2-151 chứng nhận đồng hồ boot cũ e9295700 nhanh ≥ +20 s lúc chết tại #41 (mẫu cuối ram log T8-150 01:26:12Z). Các số #42 (15 s / 18 s) cùng họ, nhỏ hơn #41 (≥ +20 s).
- Phía T7 trong phiên này: KHÔNG có lần đọc boot/giờ nào trong cửa sổ nhạy cảm của #42 (đã qua từ đợt 151), KHÔNG có dữ kiện mới về e2 hay về bước nhảy trong đời 2e430750/c741f5e6. **T7 chỉ ghi nhận hai số 15 s / 18 s + chênh 3 s, không chọn nhánh, không mở lại.** Chứng nhận clock tại #42 + mù #74? (reboot #42) là của T2-152; mù #75? (#43) + mù #76? (#44) giao T2-153 (T7 không chứng nhận mù).
- Hệ quả cho số liệu đợt này: run 151/152 + các slot HB/DR đều nằm sau #42; mọi wall/jitter trong LIMITS này là số danh nghĩa theo đồng hồ ghi trong DB. Kết cục run 151 (SUCCEEDED, margin 1.828 s) KHÔNG nhạy như run 150 (margin 177 s) — margin 1.828 s lớn hơn mọi bước nhảy đã biết trong tranh chấp (lớn nhất ≥ +20 s tại #41 theo hướng rút ngắn margin thì vẫn còn ~1.808 s), nên kết cục này vững trước chứng nhận clock tại #41/#42.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 151/152 đầy đủ; events lọc theo run_id + theo cửa giờ, trừ `artifact_action_scope` vì detail dài). Job IDs đã xác minh: heartbeat (interval@30m) / deterministic-doctor (interval@1h) / vcut-build-loop (interval@3h, Asia/Saigon).
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này đã bắt được 1 phép tính nháp sai ở bản nháp lệnh — xem §6, F-152-T7-1).
4. Cửa kiểm đợt này ~3h05' (04:52:53Z → 07:57:47Z 20/11), đủ 6 slot HB + 3 slot DR + run vcut 151 (kết cục) và 152 (theo dõi). Bảy lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa. Run 151 được đọc lại xác nhận 2 lần sau lần đầu (3 lần đọc độc lập khớp nhau + events đối chiếu).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 05:20:50Z + DR 05:00Z thuộc cửa 152 theo quy ước đứng (sau kiểm cuối T7-151 lúc 04:52:53Z). DR 08:00Z thuộc cửa T7-153.
6. **1 sleep bị giết trong phiên này** (sleep 1.800 s, SIGTERM sau ~1.397 s, do reboot #44 — cùng hiện tượng #39/#42); 4 sleep còn lại (1.800 s + 1.800 s + 1.500 s + 1.500 s) hoàn thành bình thường. Boot đổi 18e179e0 → c741f5e6 đúng 1 lần trong phiên (tại #44); #43 xảy ra trước phiên.
7. T7 đóng cờ ~07:58Z, trước hạn cờ 08:00Z ~2 phút (hạn cứng toàn đợt 08:30Z còn ~32'). Ghi rõ, không giấu. Run 152 vẫn running lúc đóng cờ — kết cục thuộc T7-153 (hạn ngân sách 08:35:51Z).

## 4. Cập nhật lũy kế (nối tiếp đợt 151, cùng phương pháp)

- Heartbeat: 44/297 → **44/303 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 14:50:50 +07). Kiểm toán cửa sổ: 297 + 6 slot mới = 303 ✓. Số thiếu +0 (slot muộn +891 s vẫn CÓ nên không tính thiếu; 0 muộn mới tính vào thiếu — muộn chỉ ghi nhận riêng).
- Deterministic-doctor: 49/219 → **49/222 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 14:00 +07). Kiểm toán: 219 + 3 = 222 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/303 = 14,5% (giảm từ 14,8% — 0 thiếu mới); DR 49/222 = 22,1% (giảm từ 22,4% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 151: SUCCEEDED (wall gốc 8.972 s, margin 1.828 s)** — thoải mái, không nhạy với chứng nhận clock tại #41/#42 (margin lớn hơn mọi bước nhảy đã biết). Mẫu (m) KHÔNG tái diễn ở 150→151 (lần thứ tư liên tiếp).
2. **Điểm dữ liệu thứ 5 cho mẫu (m): DƯƠNG** — #44 viết lại run 152 (requeue btime + 40,640 s, trong dải 33–45 s của cả 4 lần dương). **n = 5: #38 ÂM, #39/#41/#42/#44 DƯƠNG.** #43 là không-test (không có run đang chạy), không tính vào n. Điều tra (m) ĐÃ ĐÓNG (quyết (d) đợt 149 + (j) đợt 151) — T7 chỉ ghi nhận, KHÔNG mở điều tra mới. Dữ kiện mở duy nhất (điều kiện khiến recovery bỏ qua run 148 tại #38) VẪN MỞ, chỉ ghi nhận để theo dõi.
3. **Reboot #43 TRƯỚC phiên + #44 GIỮA phiên (2 reboot trong một đợt T7)** — #43 không ảnh hưởng run 151 (finished trước 934 s); #44 giết sleep T7 (SIGTERM sau ~1.397 s). Mù #75? (#43) + mù #76? (#44) giao T2-153; mù #74? (#42) giao T2-152. T10-152 kiểm các luồng khác có process/sleep nào bị #43/#44 giết không (T7 không kiểm hộ).
4. **HB muộn +891 s (lần thứ 8) + khoảng im lặng 1.818 s bao trùm #43** — tái hiện dạng im lặng đợt 150 (1.863 s) gần như nguyên vẹn (cùng reconciled jobs=28 changed_jobs=1, cùng HB muộn dispatch rồi vcut dispatch đúng giờ); nhưng first-event sau btime chậm hơn hẳn (+884 s so với +210 s ở #40). Nguyên nhân khoảng im lặng + khởi động chậm: CHƯA XÁC ĐỊNH — ghi nhận là dữ kiện mở. Cơ chế drop phía scheduler vẫn đóng theo hướng đợt 125 (quyết (j) đợt 136).
5. **Run 152 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.495 s, còn 2.305 s tới hạn 08:35:51Z) — kết cục thuộc T7-153. Không đổi số đếm đợt 152.
6. **Nghịch lý đồng hồ tại #42: hai số 15 s (T9) / 18 s (T8) chênh 3 s — chỉ ghi nhận, không phân xử.** Chứng nhận thuộc T2-152. T7 không có dữ kiện mới về e2; giữ khoảng rộng e2 ∈ [313, 340] s theo quyết parent; khung #113? bản giờ thực (7 + e2 s) đã chốt.
7. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-152-T7-1 — Tính nháp sai ở lệnh kiểm tra (không vào NOTES/LIMITS):** ở kiểm lần 4, lệnh `date -u` nháp đã tính "requeue − btime" bằng biểu thức epoch gõ tay rối (1795158291 − 1795152057 − 6194) và đoán epoch 1795158311 (07:05:11Z, vô nghĩa) — số đúng lấy từ event row trực tiếp: requeue 07:04:51.640Z − btime 07:04:11Z = **btime + 40,640 s**; offset viết lại 5.340 s tính từ started_at row (1795158291 − 1795152951). Số sai KHÔNG đi vào NOTES hay LIMITS này. Cùng họ sai số nhẩm epoch như F-147-T7-1/F-148-T7-1/F-149-T7-3/F-150-T7-1/F-151-T7-1 — `date -u` + đọc trực tiếp event row là chốt chặn bắt được (lần thứ 6 liên tiếp).
- **F-152-T7-2 — Lỗi gõ trong bản nháp NOTES kiểm lần 4 ("(04:11Z... không, 07:04:11Z)"), đã sửa TRƯỚC khi ghi LIMITS.** Số đúng: DR 07:00Z dispatch trước btime #44 (07:04:11Z) 4m11s. Lỗi gõ KHÔNG đi vào LIMITS này.
- **F-152-T7-0 — Không có sai số nào khác trong đợt này:** 7 lần đọc DB khớp nhau ở mọi slot trùng; mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×5 slot, +891 s ×1 slot, DR 0 s ×3 slot, run 151 wall gốc 8.972 s / margin 1.828 s / wall viết lại 5.974 s, run 152 jitter 0 s, requeue #44 btime + 40,640 s, offset viết lại 5.340 s, gap im lặng 1.818 s / 291 s, first-event sau #43 btime + 884 s, run 151 finished trước btime #43 934 s — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 7 lần đọc (18e179e0 → c741f5e6 đúng 1 lần, tại #44) và khớp brief về reboot #43; ở cả 7 lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 151 có 3 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 05:05:23.319Z), không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round152-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t7/NOTES.md` (không nằm trong repo nên không stage).
