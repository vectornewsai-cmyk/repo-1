# PHASE9 ROUND149 T7 — ĐIỀU TRA MẪU (m) XONG: CƠ CHẾ XÁC ĐỊNH (n=2) + RUN 148 SUCCEEDED + RUN 149 JITTER 0 s + VIẾT LẠI BẰNG CHỨNG #16 TẠI REBOOT #39 + #38 LÀ BẰNG CHỨNG ÂM + TRANH CHẤP T1–T2 VỀ CLOCK (KHÔNG CHỐT) + CỬA LÀNH (HB 4/4 + DR 3/3)

- **Luồng:** T7 đợt 149 (lượt cron 03:35 +07 20/11/2026 = 20:35:51Z 19/11). Nhiệm vụ theo quyết parent 148 §12.3(f): **ĐIỀU TRA mẫu quyết (m), hạn một đợt** — cơ chế reboot trong cửa đóng sổ làm run TIMEOUT và run sau chạy muộn như thế nào; kèm T5 về thời gian reboot; nếu không xác định được cơ chế thì ghi nhận là dữ kiện và đóng. Bổ sung trong phiên: T1-149 (cờ 21:10Z) giao kiểm run 148 có bị viết lại lần 3 tại reboot #38 không + dùng dữ kiện nhảy clock; T2-149 (cờ 21:33:45Z) giao đối chiếu tranh chấp clock + reboot #39.
- **Boot trong phiên:** **70025d3e-ff1b-4519-aa1e-5459a616930b** (btime /proc/stat 1795118433 = 20:00:33Z — reboot #38, xảy ra TRƯỚC khi T7 mở phiên) từ lúc mở tới 21:23:51Z, rồi **802f358f-0f12-4824-8eb9-419f0ccd67ec** (btime /proc/stat 1795123431 = 21:23:51Z — **reboot #39, TRONG phiên**, giết sleep chờ kiểm lần 2) từ 21:23:51Z tới kiểm cuối (~22:16Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut/HB/DR), file LIMITS đợt 149 của T1/T2/T5 (+ T7-147/T7-148), NOTES round148-t7/round149-t7, cờ `.done` đợt 149. Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

**ĐIỀU TRA XONG — CƠ CHẾ XÁC ĐỊNH ĐƯỢC, ĐÓNG ĐIỀU TRA (hạn một đợt, theo quyết (f)).**

| Câu hỏi điều tra | Kết luận | Bằng chứng |
|---|---|---|
| Reboot làm run TIMEOUT như thế nào? | **Gián tiếp, không phải nguyên nhân trực tiếp.** Timeout ⟺ wall time (started gốc → kết thúc) > 10.800 s. Ngân sách tính từ started_at GỐC, không bị reset bởi viết lại. | n=2: run 144 wall 10.987 s (vượt 187 s), run 147 wall 10.862 s (vượt 62 s); run 145/146/148 bị viết lại mà KHÔNG timeout |
| Vì sao run sau chạy muộn đúng bằng số vượt? | **Run sau dispatch cùng một pass scheduler với event timeout** (37 ms / 61 ms sau) — không chồng chéo: run N+1 chỉ dispatch khi run N đã kết thúc; **jitter run sau == trễ phát hiện timeout** (62 s / 187 s, khớp từng giây). | Events run 144→145 và 147→148 (xem §2.2) |
| Viết lại started_at xảy ra khi nào? | **Daemon startup recovery requeue run đang chạy → re-dispatch ghi đè started_at (≈ btime + 31–50 s) → reattach** ("execute turn already complete"). KHÔNG phải mọi reboot: **#38 KHÔNG viết lại (bằng chứng âm), #39 CÓ viết lại (bằng chứng #16)**. | Events §2.3; 0 event recovery tại #38; 3 event tại #39 |
| Mẫu (m) ở đợt 149? | **KHÔNG tái diễn:** run 148 SUCCEEDED (không timeout) + run 149 jitter 0 s. | §2.4 |
| Cửa slot đợt 149? | **CỬA LÀNH:** HB 4/4, DR 3/3, 0 thiếu mới, 0 muộn lớn. | §2.1 |

**Dữ kiện mở duy nhất còn lại:** điều kiện khiến daemon recovery bỏ qua run 148 tại #38 (mà không bỏ qua run 149 tại #39) CHƯA xác định được — cần daemon log / trạng thái claim lúc ~20:01Z, không có trong DB. Ghi nhận là dữ kiện để theo dõi, KHÔNG mở điều tra mới (hết hạn một đợt). Giả thuyết đua (session-reattach trước vs daemon-recovery trước) chỉ là giả thuyết, chưa kiểm chứng.

**Tranh chấp clock T1–T2: T7 ghi cả hai phía, KHÔNG tự chốt thay parent** (xem §2.5). T1-149: clock nhảy lùi X > 595 s tại #38 (từ đọc "Uptime 29 phút lúc 20:10:28Z"). T2-149: BÁC BỎ bằng ràng buộc thứ tự reboot (e2 < 382 s — sampler T9-148 19:34:40Z); đọc "29 phút" chắc chắn là số học. Mâu thuẫn 27 s (T10 e2 > 340 s vs T7 e2 < 313 s) VẪN CÒN — T7 đã đối chiếu lại phía mình (boot_id đọc ở ≥19:35:41Z, xem §2.5.3): nhánh T7 đứng như đã ghi, không giải được.

- Cập nhật lũy kế (cùng phương pháp đợt 125–148): heartbeat **44/283 slot thiếu** (số thiếu +0, mẫu số +4); deterministic-doctor **49/213 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 19:53:xxZ → 22:16:xxZ 19/11

Cửa kiểm ~2h23'. Bốn lần đọc DB (kiểm lần 1 ~20:45Z, kiểm bổ sung ~21:12Z sau handoff T1, kiểm lần 2 ~21:25Z sau reboot #39, kiểm cuối ~22:16Z) **khớp hoàn toàn nhau ở mọi slot trùng** — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU" (trừ started_at run 149 đã đổi tại #39 — xem §2.3).

**Heartbeat (lưới :20:50/:50:50Z): 4/4 có, 0 thiếu mới, 0 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:20:50 (20:20:50Z) | 8474c491 | 20:15:34 | −316 s | CÓ |
| 03:50:50 (20:50:50Z) | 72bedd19 | 20:45:34 | −316 s | CÓ |
| 04:20:50 (21:20:50Z) | 5af02ede | 21:15:34 | −316 s | CÓ |
| 04:50:50 (21:50:50Z) | 73ab1d67 | 21:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. Cả 4 lượt jitter −316 s (mẫu chuẩn); 0 lượt muộn lớn.
- Slot HB 22:20:50Z (run 88c1659d, sched 1795126850 = 22:20:50Z, started 22:15:34Z) có scheduled_for SAU kiểm cuối → thuộc cửa T7-150 theo quy ước đứng (đếm theo scheduled_for ≤ thời điểm kiểm cuối).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:00 (20:00Z) | 657fafcf | 20:00:00 | 0 s | CÓ |
| 04:00 (21:00Z) | 4b8a7c7a | 21:00:00 | 0 s | CÓ |
| 05:00 (22:00Z) | 6640d1b6 | 22:00:00 | 0 s | CÓ |

- Cả 3 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.
- Lưu ý nhỏ (ghi nhận, không phải dị thường): DR 21:00Z run `4b8a7c7a` có finished_at = started_at + 1 s (21:00:01Z vs 21:00:00Z) — cùng quirk 1 s như HB 17:50:50Z đợt 148. DR 20:00Z chạy xong TRƯỚC reboot #38 (20:00:00Z vs btime 20:00:33Z) đúng 33 s.
- Slot DR 23:00Z + HB 22:50:50Z + vcut 23:35:51Z (run 150) thuộc T7-150.

### 2.2 Cơ chế mẫu (m) — tái dựng từ `scheduler.events` (n=2, cấu trúc GIỐNG HỆT)

Nguồn mới của điều tra này: bảng `scheduler.events` ghi đủ vòng đời mỗi run (`dispatched` / `requeued_after_restart` / `reattached_after_restart` / `timeout` / `succeeded` + `created_at` chính xác tới ms). T7-148 chỉ có started_at/finished_at; events nay cho thấy cơ chế trực tiếp.

#### Instance 1 — run 144 → run 145 (đợt 145; tái dựng độc lập từ events)

Run 144 (`b93ae161-7dfe-46ad-bb2a-52c4c3c9eae2`, sched 1795066551 = 05:35:51Z):

| Thời điểm (Z) | Event | Chi tiết |
|---|---|---|
| 05:35:51.109 | `dispatched` | "scheduled" — khởi động gốc |
| 05:53:59.538 | `requeued_after_restart` | "daemon startup recovery" (reboot — viết lại lần 1) |
| 05:53:59.599 | `dispatched` | "scheduled" |
| 05:53:59.684 | `reattached_after_restart` | "execute turn already complete (model-output evidence)" |
| 07:56:57.388 | `requeued_after_restart` | "daemon startup recovery" (reboot — viết lại lần 2 → started_at nay 1795075017 = 07:56:57Z) |
| 07:56:57.481 | `dispatched` | "scheduled" |
| 07:56:57.644 | `reattached_after_restart` | "execute turn already complete…" |
| **08:38:58.891** | **`timeout`** | "Ran out of its 10800s time budget…" |
| **08:38:58.952** | `dispatched` run 145 | "scheduled" — **61 ms sau event timeout** |

- Ngân sách từ started GỐC 05:35:51Z + 10.800 s = 08:35:51Z; timeout phát hiện lúc 08:38:58Z → **trễ phát hiện 187 s**.
- Run 145 (sched 08:35:51Z) dispatched 08:38:58Z → **jitter +187 s = đúng trễ phát hiện** ✓.
- Run 144 wall orig→timeout: 1795077538 − 1795066551 = **10.987 s** = 10.800 + 187 ✓ (kiểm bằng `date -u`).
- Run 145 wall dispatch thực→finished (11:30:29Z): 1795087829 − 1795077538 = **10.291 s** < 10.800 → succeeded, margin 509 s. Run 145 cũng bị viết lại 1 lần (requeued 09:54:43.592Z + dispatched .690Z + reattached .833Z) mà KHÔNG timeout.

#### Instance 2 — run 147 → run 148 (đợt 148; khớp T7-148 + events)

Run 147 (`98cf7700-6829-4217-8ad4-fe24a5a74d75`, sched 1795098951 = 14:35:51Z):

| Thời điểm (Z) | Event | Chi tiết |
|---|---|---|
| 14:35:51.077 | `dispatched` | "scheduled" — khởi động gốc |
| 17:28:34.198 | `requeued_after_restart` | "daemon startup recovery" (reboot #35 — viết lại, started_at nay 1795109314 = 17:28:34Z) |
| 17:28:34.443 | `dispatched` | "scheduled" |
| 17:28:34.543 | `reattached_after_restart` | "execute turn already complete…" |
| **17:36:53.831** | **`timeout`** | "Ran out of its 10800s time budget…" |
| **17:36:53.868** | `dispatched` run 148 | "scheduled" — **37 ms sau event timeout** |

- Ngân sách từ started gốc 14:35:51Z + 10.800 s = 17:35:51Z; timeout phát hiện lúc 17:36:53Z → **trễ phát hiện 62 s**.
- Run 148 (sched 17:35:51Z) dispatched 17:36:53Z → **jitter +62 s = đúng trễ phát hiện** ✓.
- Run 147 wall orig→timeout: 1795109813 − 1795098951 = **10.862 s** = 10.800 + 62 ✓.
- Run 148 wall orig-started→finished (20:19:32Z): 1795119572 − 1795109813 = **9.759 s** < 10.800 → succeeded (xem §2.4 về wall thật sau hiệu chỉnh clock).

#### Kết luận cơ chế (4 điểm, xác định được)

1. **Timeout ⟺ wall time vượt ngân sách, tính từ started_at GỐC.** Viết lại started_at không reset ngân sách: run 147 timeout lúc 17:36:53Z dù started_at đã viết lại thành 17:28:34Z (nếu tính từ đó, hạn là 20:28:34Z — không timeout); run 144 tương tự (hạn từ started viết lại 07:56:57Z sẽ là 10:56:57Z). **Viết lại chỉ đổi số hiển thị, không gia hạn.**
2. **Run sau dispatch cùng một pass scheduler với event timeout** (37 ms / 61 ms sau) — không chồng chéo (serialization): run N+1 chỉ dispatch khi run N đã tới trạng thái kết thúc. Kiểm chứng phủ định: run 146 finished 14:24:36Z (succeeded, trước hạn) → run 147 dispatch đúng giờ sched 14:35:51Z, KHÔNG dispatch sớm ngay khi 146 kết thúc — tức dispatch tại max(scheduled_for, thời điểm kết thúc run trước).
3. **Jitter run sau == trễ phát hiện timeout** (62 s / 187 s, khớp từng giây, n=2). Trễ phát hiện dao động (62 vs 187) — chưa xác định được chu kỳ sweep (62 s ≈ 1 nhịp ~60 s + ~2 s; 187 s ≈ 3 nhịp ~60 s + ~7 s); KHÔNG suy đoán thêm. Đây là độ trễ của scheduler trong việc phát hiện run đã quá hạn, không phải độ trễ dispatch riêng.
4. **Vai trò reboot: gián tiếp, không chứng minh được là nguyên nhân trực tiếp của timeout.** Reboot cắt ngang cửa đóng sổ (killing sleep/process, buộc recovery/reattach) có thể góp phần đẩy wall time qua hạn, nhưng KHÔNG tách được khỏi dữ kiện (không có bản đối chứng không-reboot). Bằng chứng phân biệt: run 148 bị viết lại 2 lần mà KHÔNG timeout (wall 9.759 s); run 145/146 bị viết lại 1 lần mà KHÔNG timeout — **viết lại ≠ timeout**. Với run 147: T10 đóng 17:33:22Z (còn 2m29s tới hạn ngân sách), handoff worker kết thúc 17:36:35Z (vượt hạn 44 s) — đợt đã chạy sát hạn trước khi timeout; reboot #35 (17:28:08Z) xảy ra trong cửa đóng sổ nhưng không chứng minh được nó gây ra 62 s vượt.

### 2.3 Viết lại started_at — cơ chế + bằng chứng trực tiếp thứ 16 + bằng chứng âm tại #38

**Cơ chế (đọc trực tiếp từ events, không suy đoán):** VM reboot giết scheduler daemon → daemon khởi động lại, chạy startup recovery → `requeued_after_restart` ("daemon startup recovery") cho run đang chạy → `dispatched` ("scheduled") **ghi đè `started_at_utc` = giờ re-dispatch** (≈ btime + 31–50 s: daemon khởi động + recovery) → `reattached_after_restart` ("execute turn already complete (model-output evidence)") — turn đã xong nên không chạy lại từ đầu. `attempt` giữ 1 (không phải chạy lại).

**Bằng chứng trực tiếp thứ 16 — run 149 tại reboot #39 (quan sát TRONG phiên này):**

| Mốc | Epoch | `date -u` |
|---|---|---|
| btime 802f358f (/proc/stat) | 1795123431 | 21:23:51Z |
| btime 802f358f (/proc/1) | 1795123441 | 21:24:01Z |
| requeued_after_restart | — | 21:24:31.799Z |
| dispatched (started_at mới) | 1795123471 | 21:24:31Z |
| reattached_after_restart | — | 21:24:31.938Z |

- Offset: **40 s (stat)** / 30 s (proc/1) — 40 s nằm trong dải chuỗi 31–50 s. Tuổi run lúc viết lại: 1795123471 − 1795120551 = **2.920 s** từ started gốc. Status vẫn `running`; hạn ngân sách KHÔNG ĐỔI: 20:35:51Z + 10.800 s = **23:35:51Z**.
- Chuỗi offset sau btime (chuẩn /proc/stat, nối T7-148): …/40 (145-lần-1) / 36 (146-lần-1) / 41 (147) / 43 (148-lần-1) / 35 (148-lần-2) / **40 (149-lần-1)** — **kiểm thứ 24 / bằng chứng trực tiếp thứ 16**. Dải chuỗi giữ 31–50 s. Offset proc/1 tương ứng: 26 / 27 / 25 / **30** (149-lần-1).
- Đây là số T1-149 kỳ vọng (started_at ≈ 20:01:1xZ = btime + ~40 s) — nhưng xảy ra cho **run 149 tại #39, không phải run 148 tại #38**.

**Bằng chứng âm tại reboot #38 — run 148 KHÔNG bị viết lại lần 3 (kỳ vọng của T1 BỊ BÁC, kiểm 2 lần độc lập + T5-149 độc lập):**

- Đọc lần 1 (~20:45Z) và lần 2 (~21:12Z, sau handoff T1): run 148 started_at vẫn **1795117297 = 19:41:37Z** (giá trị viết lại tại #37), finished 1795119572 = 20:19:32Z, status `succeeded` — không đổi.
- Events toàn bảng trong cửa 20:00:33–20:19:32Z: CHỈ có `reconciled` 20:15:34.033Z (job "*"), HB `dispatched` 20:15:34.073Z, HB `succeeded` 20:15:34.148Z, run 148 `succeeded` 20:19:32.150Z — **0 event `requeued_after_restart` / `dispatched` / `reattached_after_restart` nào cho run 148** (cửa 20:00:33–20:03:00Z: 0 event toàn bảng). Daemon KHÔNG chạy recovery requeue cho run này tại #38.
- T5-149 ghi nhận độc lập cùng kết luận ("#38 KHÔNG viết lại started_at run 148").
- → **Giả thuyết viết lại dạng phổ quát ("MỌI reboot trong lúc run chạy đều viết lại") BỊ BÁC.** Dạng tinh chỉnh đứng vững: **viết lại ⟺ daemon startup recovery thực sự requeue run đó**. Cặp đối chứng #38/#39 trong cùng một điều tra (cùng cơ chế recovery, hai kết quả đối lập — #38 không requeue, #39 requeue trong 139 ms) là bằng chứng mạnh nhất cho dạng tinh chỉnh này.
- Điều kiện khiến recovery bỏ qua run 148 tại #38: **CHƯA XÁC ĐỊNH ĐƯỢC** (cần daemon log / trạng thái claim lúc ~20:01Z — không có trong DB). Giả thuyết đua (session-reattach trước vs daemon-recovery trước) vẫn chỉ là giả thuyết: tại #35/#36/#37/#39 thứ tự events là requeue → dispatch → reattach (daemon thắng); tại #38 có thể session đã reattach trước khi daemon recovery chạy — KHÔNG có event nào chứng minh hay bác bỏ.

### 2.4 Kết cục run 148 + run 149 (theo lệ)

| Lượt vcut | run_id | scheduled (Z) | started_at gốc | started_at nay | finished (Z) | Kết quả |
|---|---|---|---|---|---|---|
| Đợt 147 | 98cf7700 | 14:35:51 | 14:35:51Z | 17:28:34Z (viết lại #35) | 17:36:53Z | **`timeout`** (wall 10.862 s, vượt 62 s) |
| **Đợt 148** | **b33c757c** | **17:35:51** | **17:36:53Z (jitter +62 s)** | **19:41:37Z (viết lại #36 + #37; KHÔNG viết lại #38)** | **20:19:32Z** | **`succeeded`** (wall danh nghĩa 9.759 s từ started gốc; margin danh nghĩa 1.041 s) |
| **Đợt 149** | **91ee7447** | **20:35:51** | **20:35:51Z (jitter 0 s)** | **21:24:31Z (viết lại #39, offset 40 s)** | — (running lúc đóng cờ) | **RUNNING — kết cục thuộc T7-150** (hạn ngân sách 23:35:51Z) |

- **Run 148 SUCCEEDED — mẫu (m) KHÔNG tái diễn ở 148→149:** không timeout (wall danh nghĩa 9.759 s < 10.800 s) + run 149 jitter 0 s. Hạn timeout run 148 theo started gốc (20:36:53Z) rơi vào cửa T7-149 như T1 lưu ý, nhưng run đã finished trước hạn nên không còn ý nghĩa theo dõi.
- **Wall thật run 148 sau hiệu chỉnh clock (theo T2-149, xem §2.5):** finished 20:19:32Z ghi trên nhịp C3 (e3 ≈ 0), started gốc 17:36:53Z trên nhịp C2 (e2 > 0) → wall thật = 9.759 + e2. Với e2 ∈ [86, 542) theo khoảng chứng nhận gap #38, thắt lại < 382 s theo ràng buộc thứ tự → **wall thật ∈ [9.845, 10.141) s, margin thật ∈ (659, 955] s**; theo nhánh T7 (e2 < 313 s): wall < 10.072 s, margin > 728 s; theo nhánh T10 (e2 ∈ (340, 382)): wall ∈ (10.099, 10.141) s, margin ∈ (659, 701) s. **Bất biến: run 148 SUCCEEDED cả theo giờ thực.**
- Run 147/146/145 không đổi (xem T7-147/T7-148). Run 149 `worker_claimed_at_utc` = started gốc (20:35:51Z); run 148 claimed 20:19:23Z (9 s trước finished), run 147 claimed 17:36:36Z (17 s trước finished), run 146 claimed 14:23:01Z (95 s trước finished) — mẫu claimed_at sát finished_at ở các run đã kết thúc, ý nghĩa chưa rõ (dữ kiện mở, không kết luận).
- **T5-149 đối chiếu (đọc LIMITS):** boot mới 70025d3e replay khởi động muộn +35m05s nhưng chạy tốt, postboot PASS poll0+poll1, cờ mới 20:49:23Z; T5 ghi nhận độc lập run 148 succeeded + run 149 jitter 0 + #38 không viết lại — khớp hoàn toàn T7. T5-149 §2.1 ghi tuổi thọ ae8f70bb "1.171 s — không còn nghi ngờ số học": đúng phép trừ nhưng SAI về thời gian trôi thật (T5 viết trước khi T1 xác nhận nhảy clock; T5 chỉ nghi ngờ và giao T1 — xem §2.5).

### 2.5 Tranh chấp T1–T2 về bước nhảy clock tại #38 — ghi cả hai phía, KHÔNG chốt thay parent

**Phía T1-149 (cờ 21:10Z):** đồng hồ VM NHẢY LÙI X > 595 s tại reboot #38 (lần thứ 4 có bước nhảy: #54, #58, #63, #38). Căn cứ: suite T10-148 chạy 20:02:19–20:06:13Z trên ae8f70bb (đọc live boot_id hai đầu) vs btime boot mới 20:00:33Z → cận dưới sắt đá X > 340 s; đọc "Uptime 29 phút lúc 20:10:28Z" trên ae8f70bb → X > 595 s. Hệ quả theo T1: gap ae8f70bb→70025d3e chỉ là SPAN (danh nghĩa 1.171 s SAI vì trộn hai nhịp đồng hồ); tuổi thọ thật ae8f70bb = 1.171 + X > 1.766 s.

**Phía T2-149 (cờ 21:33:45Z) — BÁC BỎ kết luận T1 bằng ràng buộc thứ tự reboot (cận trên cứng e2 < 382 s):**

- Ba tiền đề đều cứng: (i) mẫu sampler cuối trên d8a11644 lúc 19:34:40Z (giờ thực, C0 chính xác e0 ≈ 0) → d8a11644 còn sống lúc 19:34:40Z thực → R_b1 > 19:34:40Z thực; (ii) R_b2 = 19:41:02Z − e2 (btime là đọc wall-clock trên C2); (iii) R_b2 > R_b1 (hai kernel chạy nối tiếp). Suy ra 19:41:02 − e2 > 19:34:40 → **e2 < 382 s**. e2 > 595 s sẽ cho R_b2 < 19:31:07Z < 19:34:40Z < R_b1 — reboot #37 xảy ra TRƯỚC #36, không thể.
- Đọc "Uptime 29 phút lúc 20:10:28Z" **CHẮC CHẮN là số học (20:10:28 − 19:41:02), không phải đọc trực tiếp**: không thể là đọc trước reboot (buộc e2 > 595, đã bác) cũng không thể là đọc sau reboot (uptime boot mới lúc đó chỉ ~10 phút). Việc loại nó khỏi cận là đúng, nay đã được CHỨNG MINH chứ không chỉ nghi ngờ.
- Hướng bước nhảy: đồng hồ thời ae8f70bb (C2) **CHẠY NHANH** (e2 > 0), không phải đồng hồ mới chạy chậm như prereg dự báo (F-149-T2-8: prereg SAI hướng; F110? ≈ 0/+1 s + journal liên tục → C3 chính xác, btime 20:00:33Z là giờ thực).
- Các bước nhảy đã lượng hóa: X36 ∈ [8, 68) s (e1 ∈ (−68, −8] s, C1 chạy CHẬM); X37 ∈ [114, 390) s (đồng hồ bước NHANH tại #37); X38 = e2 (e3 ≈ 0) ∈ (106, …) s.

**Mâu thuẫn 27 s VẪN CÒN (T2-149 §2.2):** phía T10 (suite-end ALL DONE 20:06:13Z, đọc trực tiếp boot ae8f70bb) buộc e2 > 340 s; phía T7 (kiểm giữa sau #36, epoch 1795116941 = 19:35:41Z, đọc trực tiếp boot 1d610e56) buộc e2 < 313 s. Cả hai đều có timestamp chính xác từng giây; không hòa giải được từ dữ kiện trên đĩa. Các khoảng gap chứng nhận chỉ dùng cận cả hai phía đồng ý (e2 > 106 s từ suite-start) nên RỘNG.

**Đối chiếu lại phía T7 (theo đề xuất T2 §4.5 (b)(i)) — T7 XÁC NHẬN PHÍA MÌNH:**

- Đọc lại NOTES round148-t7: dòng 130 — kiểm giữa bắt đầu ngay sau hồi phục **~19:35:24Z**; dòng 141 — "Run 148 tuổi từ started gốc lúc **~19:35:41Z: 1795116941** − 1795109813 = 7.128 s" — epoch 1795116941 là mốc giờ của lần đọc DB (started_at) trong kiểm giữa; theo phương pháp đứng (F-148-T7-0: "đã đọc lại boot_id SAU khi đọc started_at" ở cả 6 lần kiểm), **boot_id 1d610e56 được xác nhận ở ≥19:35:41Z (đồng hồ C1), không phải ở giờ resume 19:35:24Z**. Nhánh T7 (e2 < 313 s) đứng như đã ghi; dùng giờ resume cũng chỉ nới lên e2 < 330 s — vẫn mâu thuẫn 10 s với e2 > 340 s. **Mâu thuẫn 27 s (10 s theo giờ resume) KHÔNG giải được từ phía T7 — ghi nhận, không chọn bên.**
- Giả thuyết bước nhảy TRONG đời ae8f70bb (giữa ~19:53Z và 20:02Z — T2 §4.5 (b)(ii)): **T7 KHÔNG CÓ DỮ KIỆN trong cửa sổ đó** (kiểm cuối T7-148 ~19:53Z, đóng cờ ~19:57Z; không có lần đọc boot/giờ nào của T7 giữa 19:53Z và suite T10 20:02:19Z). Giả thuyết này KHÔNG xác nhận cũng KHÔNG loại trừ được từ phía T7.

**Gap chứng nhận dạng KHOẢNG (T2-149 §2.5, tiền lệ #58/#63): #36 (7.607, 7.667] s, giữa 7.637; #37 (0, 276] s, giữa 138; #38 [1.257, 1.713) s, giữa 1.485 → CERT 70 / FULL 85.** Mù #68/#69/#70 **ĐÓNG HOÀN TOÀN → chuỗi đóng hoàn toàn lên 6** (sau 3 ở #67). Số danh nghĩa (btime trừ btime) SAI cho cả #37 lẫn #38 (390 nằm ngoài (0, 276]; 1.171 nằm ngoài [1.257, 1.713)) — lần đầu cả hai số danh nghĩa đều sai. Ràng buộc thứ tự thu hẹp gap #38 thành ⊂ [1.257, 1.553), mid thật ~1.405 s (khoảng chứng nhận [1.257, 1.713) vẫn đứng dạng bảo thủ). Khung chết danh nghĩa: #111? 88 s / thật [88, 156] s; #112? 55 s (danh nghĩa = thật); **#113? danh nghĩa 7 s là ẢO — thật = 7 + e2 s** (> 113 s; > 347 s theo nhánh T10) — chờ parent chốt bản nào (T2 §4.5 (c)).

**Hệ quả cho điều tra (m):** mọi timestamp của hai instance (m) nằm trong cùng một nhịp đồng hồ (không có bước nhảy nào tại #35/#36/#37 — X36/X37 là bước NHANH/CHẬM nhỏ, không đổi chiều; các event và btime cùng nhịp) nên trễ phát hiện timeout 62 s / 187 s và jitter run sau vẫn khớp từng giây — tranh chấp clock KHÔNG làm lung lay kết luận cơ chế §2.2. Số "margin thật < 446 s / < 68 s" và framing "nhảy lùi cứu timeout" trong bản nháp NOTES của T7 (dựa trên X > 595 s của T1) đã được **RÚT LẠI** sau khi đọc T2-149 (xem §6, F-149-T7-2); số thay thế theo T2 ở §2.4.

### 2.6 Reboot #39 + mù #71? (mốc đã kiểm lại theo yêu cầu bổ sung)

- **Reboot #39: 70025d3e → 802f358f, btime /proc/stat 1795123431 = 21:23:51Z**; /proc/1 mtime 1795123441 = 21:24:01Z; starttime 1.037 ticks = 10,37 s → PID1 start 21:24:01,37Z ≈ 21:24:01Z ✓ (chênh stat→proc/1 = 10 s). Phát hiện độc lập của T7 lúc ~21:24Z (kiểm lần 2, sleep bị SIGTERM giết — xem §6) **khớp hoàn toàn T2-149 §2.11** (phát hiện lúc 21:27:15Z; /proc/1 mtime 21:24:01,94Z; starttime 1.037 ticks).
- **Mốc cờ T2 đã kiểm lại:** btime 21:23:51Z **TRƯỚC** cờ T2-149 (round149-t2.done mtime 21:33:45Z). Câu "không có reboot mới" của T2 viết lúc kiểm đóng **21:18:24Z — ĐÚNG tại thời điểm viết** (trước #39); T2 đã sửa §2.11/§2.12 sau khi kiểm lại boot (F-149-T2-12: kiểm boot lại ngay trước khi ghi cờ). Không có mâu thuẫn mốc nào.
- Gap 70025d3e→802f358f (để T2-150 chứng nhận — CHƯA biết có nhảy clock tại #39 không): stat→stat 1795123431 − 1795118433 = **4.998 s**; proc/1→proc/1 1795123441 − 1795118444 = **4.997 s**. Dữ kiện T7: lần cuối thấy boot cũ còn sống ~21:12Z (đọc DB run 148) < btime mới 21:23:51Z → KHÔNG có mâu thuẫn kiểu T1-149 → KHÔNG có bằng chứng nhảy clock tại #39 từ phía T7 (việc của T1/T5-150).
- **Mù #71? MỞ (70025d3e → 802f358f) — giao T2-150** (cửa sổ từ probe #68 20:51:02Z); khung #114? danh nghĩa (21:18:24Z, 21:23:51Z] = 327 s; boot 70025d3e sống 4.998 s danh nghĩa; F111? ≈ 0 s đủ 3 server trên boot mới (cloudflare hết 403 — T2-149 §2.12); INSIDE tạm tính 0 → 1 (chờ T2-150 chứng nhận).
- Đợt 148 nay có **4 reboot** (#35, #36, #37, #38), không phải 3 — hồ sơ đợt 148 thiếu #38 (T1-149 F-149-T1-1; không sửa hồ sơ đã đóng, đính chính ghi tại đây + GAP).

### 2.7 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~22:16Z): **7/9 cờ `.done` đã có** — `round149-t0.done`, `round149-t1.done`, `round149-t2.done`, `round149-t4.done`, `round149-t5.done`, `round149-t6.done`, `round149-t8.done`. Chưa có: t9, t10 + t7 (chính T7 — cờ được tạo ngay sau kiểm cuối). LIMITS ROUND149 đã có: T0, T1, T2, T4, T5, T6, T8 (+ T7 bản này). T10-149 đang đóng sổ khi #39 xảy ra (count-final-149.py + verify.sh đã tồn tại trước reboot — T2-149 §4.5 (k)); T10 xử lý theo mẫu T10-148 hay cần parent quyết riêng — việc của T10/parent, T7 chỉ ghi nhận.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB limit=15/6/4, DR limit=15/4/3, vcut limit=5/3 qua các lần kiểm; events lọc theo run_id, trừ `artifact_action_scope` vì detail dài). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Lưới kỳ vọng như đợt 125–148.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1).
4. Cửa kiểm đợt này ~2h23' (19:53:xxZ → 22:16:xxZ 19/11), đủ 4 slot HB + 3 slot DR. Bốn lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng (trừ started_at run 149 đã đổi tại #39); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 20:20:50Z thuộc cửa 149 theo quy ước đứng — T7-150 bắt đầu cửa sau 22:16:xxZ, slot DR tiếp theo là 23:00Z, HB tiếp theo là 22:50:50Z, vcut tiếp theo là 23:35:51Z (run 150).
6. **Reboot #39 giết sleep chờ kiểm lần 2 (F-149-T7-1)** — sleep 3.600 s (bắt đầu ~20:47Z) bị SIGTERM sau ~2.153 s; phiên T7 sống qua, kiểm lần 2 ngay sau hồi phục (~21:25Z) — chính kiểm này bắt được lần viết lại run 149 (evidence #16). Sleep chờ kiểm cuối (3.000 s) hoàn thành bình thường.
7. T7 đóng cờ ~22:45Z, trước hạn cờ 23:00Z ~15 phút (hạn cứng toàn đợt 23:30Z vẫn còn ~45'). Ghi rõ, không giấu.

## 4. Cập nhật lũy kế (nối tiếp đợt 148, cùng phương pháp)

- Heartbeat: 44/279 → **44/283 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 05:50:50 +07). Kiểm toán cửa sổ: 279 + 4 slot mới = 283 ✓. Số thiếu +0.
- Deterministic-doctor: 49/210 → **49/213 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 05:00 +07). Kiểm toán: 210 + 3 = 213 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/283 = 15,5% (giảm từ 15,8% — 0 thiếu mới); DR 49/213 = 23,0% (giảm từ 23,3% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **ĐIỀU TRA MẪU (m) — XONG, ĐỀ NGHỊ ĐÓNG (theo quyết (f) hạn một đợt):** cơ chế xác định được ở §2.2–§2.3 (n=2 cho timeout/serialization; 16 bằng chứng trực tiếp + 1 bằng chứng âm cho viết lại). Dữ kiện mở duy nhất: điều kiện khiến recovery bỏ qua run 148 tại #38 — ghi nhận để theo dõi, không mở điều tra mới. T10-149 ghi vào §12 để parent chốt đóng điều tra.
2. **Tranh chấp clock T1–T2 — CHỜ PARENT PHÁN (T2-149 §4.5 (b)):** (i) xác nhận bác bỏ "X > 595 s" của T1-149 bằng ràng buộc thứ tự (e2 < 382 s) hay giữ cả hai; (ii) mâu thuẫn 27 s (T10 e2 > 340 s vs T7 e2 < 313 s) — chọn một nhánh, hay giữ khoảng rộng (như #58/#63), hay điều tra giả thuyết nhảy trong đời ae8f70bb; (iii) khung #113? chốt bản danh nghĩa 7 s hay bản giờ thực 7 + e2 s (T2 §4.5 (c)). T7 đã đối chiếu lại phía mình (§2.5.3): nhánh T7 đứng, không giải được — không tự chọn bên.
3. **CERT 70 / FULL 85 + chuỗi mù đóng hoàn toàn 6 — CHỜ PARENT XÁC NHẬN (T2-149 §4.5 (a)):** gap #36 (7.607, 7.667], #37 (0, 276], #38 [1.257, 1.713) — mids dùng cho thống kê; số danh nghĩa 390 s / 1.171 s đều sai so với giờ thực.
4. **Giả thuyết viết lại — LÊN kiểm thứ 24 / bằng chứng trực tiếp thứ 16 (đợt 149):** run 149 bị viết lại tại #39 (offset 40 s stat); dạng phổ quát ("mọi reboot") BỊ BÁC bởi #38 (bằng chứng âm, kiểm 2 lần + T5 độc lập). Dạng tinh chỉnh (viết lại ⟺ recovery requeue) đứng vững. T7-150 kiểm tiếp run 149/150 như thường lệ; không cần quyết mới, trừ khi parent muốn ghi nhận cặp đối chứng #38/#39 vào §12.
5. **Mẫu (m) KHÔNG tái diễn ở 148→149:** run 148 succeeded + run 149 jitter 0 s. Run 149 vẫn `running` lúc T7 đóng cờ (started_at đã viết lại 1 lần, nay 21:24:31Z) — kết cục thuộc cửa T7-150 (hạn ngân sách theo started gốc 23:35:51Z); không đổi số đếm đợt 148/149.
6. **Reboot #39 / mù #71? MỞ — giao T2-150 chứng nhận** (T2-149 §4.5 (j)); khung #114? danh nghĩa 327 s; boot 70025d3e sống 4.998 s danh nghĩa. T10-149 đang đóng sổ khi #39 xảy ra — xử lý theo mẫu T10-148 hay cần parent quyết riêng (T2 §4.5 (k)).
7. **Mẫu muộn HB +887 s: KHÔNG tái hiện đợt này.** Mọi slot HB trong cửa đều −316 s (mẫu chuẩn). Số lần tái hiện mẫu giữ nguyên 6 (đợt 127/129/130/132/134/136). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — không đổi.
8. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (quyết parent đợt 136 §12.3(j) "cửa gãy: tiếp tục chỉ ghi nhận" vẫn đứng — đợt này cửa lành về slot, 0 dữ liệu thiếu mới). **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-149-T7-1 — Reboot #39 giết sleep chờ kiểm lần 2 + runtime restart; phiên T7 sống qua, kiểm lần 2 ngay sau hồi phục.** Sleep 3.600 s (bắt đầu ~20:47Z) bị SIGTERM sau ~2.153 s (session `proc_e4d495cdd7b8`, exitSignal 15, duration 2.152.673 ms). Kiểm lần 2 ~21:25Z bắt được lần viết lại run 149 (bằng chứng #16) + boot mới 802f358f. Cùng mẫu #36/#37 giết sleep T7-148. Sleep chờ kiểm cuối (3.000 s) hoàn thành bình thường.
- **F-149-T7-2 — Số wall thật run 148 trong bản nháp NOTES dựa trên X > 595 s của T1 (margin thật < 446 s / < 68 s; framing "nhảy lùi cứu timeout") ĐÃ BỊ RÚT LẠI sau khi đọc T2-149.** Số sai KHÔNG đi vào LIMITS này (bản nháp NOTES đã đính chính trước khi đóng cờ — xem mục bổ sung T2 trong NOTES). Số thay thế theo T2 (§2.4): wall thật ∈ [9.845, 10.141) s, margin thật ∈ (659, 955] s. Bài học: số suy ra từ một phía của tranh chấp đang mở không được ghi như kết luận trước khi đọc phía còn lại — T7 đã đọc T1 trước, T2 sau, và đính chính kịp trước khi đóng.
- **F-149-T7-3 — Near-miss: phép trừ nhẩm wall run 145 sai, đã bắt được bằng `date -u` TRƯỚC khi ghi.** T7 nhẩm wall dispatch-thực→finished run 145 ra ~9.870 s; kiểm lại bằng shell cho đúng 1795087829 − 1795077538 = **10.291 s** (margin 509 s). Số sai KHÔNG đi vào NOTES hay LIMITS. Cùng họ sai số nhẩm epoch như F-147-T7-1/F-148-T7-1 — `date -u` là chốt chặn bắt được.
- **F-149-T7-0 — Không có sai số nào khác trong đợt này:** 4 lần đọc DB khớp nhau ở mọi slot trùng (trừ started_at run 149 đã đổi tại #39); mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×4 slot, DR 0 s ×3 slot, run 149 jitter 0 s, timeout lag 62 s / 187 s, wall 10.862 s / 10.987 s / 9.759 s / 10.291 s, offset viết lại 40 s stat / 30 s proc/1, gap 4.998 s / 4.997 s — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 4 lần đọc (70025d3e ở lần 1 + bổ sung, 802f358f ở lần 2 + kiểm cuối) và đối chiếu khớp T2-149 (nguồn độc lập) về cả boot_id + btime cho boot 802f358f; ở cả 4 lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); hai lần viết lại/không-viết-lại (#38 âm, #39 dương) đều có events đối chiếu trực tiếp, không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round149-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round149-t7/NOTES.md` (không nằm trong repo nên không stage).
