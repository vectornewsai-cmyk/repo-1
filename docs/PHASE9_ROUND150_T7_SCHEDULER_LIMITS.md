# PHASE9 ROUND150 T7 — RUN 149 SUCCEEDED (wall 8.925 s) + REBOOT #40 KHÔNG KIỂM ĐƯỢC VIẾT LẠI (không có run đang chạy) + RUN 150 JITTER 0 s, VẪN RUNNING LÚC ĐÓNG CỜ + HB 23:20:50Z MUỘN +889 s (tái hiện mẫu muộn lần thứ 7) + CỬA LÀNH (HB 7/7 + DR 3/3)

- **Luồng:** T7 đợt 150 (lượt cron 06:35 +07 20/11/2026 = 23:35:51Z 19/11). Nhiệm vụ theo nợ §11.5 aggregate đợt 149 + quyết parent §12.3 (d): (1) kết cục run 149; (2) kiểm started_at có bị viết lại tại reboot #40 không — điểm dữ liệu thứ 3 cho mẫu (m); (3) theo dõi run 150; (4) đối chiếu phía T7 trong tranh chấp clock nếu liên quan. Điều tra mẫu (m) đã ĐÓNG theo quyết (d) — T7 CHỈ GHI NHẬN điểm dữ liệu này, KHÔNG mở điều tra mới, không kết luận lại cơ chế.
- **Boot trong phiên:** **e9295700-bda0-4a9b-8aab-4dd57661212e** (btime /proc/stat 1795131129 = 23:32:09Z — **reboot #40**, xảy ra ~3,5 phút TRƯỚC khi run 150 dispatch) suốt phiên, KHÔNG có reboot mới (kiểm boot_id ở cả 4 lần đọc: ~23:41Z, ~00:14Z, ~00:45Z, ~01:20Z — đều e9295700, btime không đổi).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut/HB/DR), LIMITS T7-149 (+ T1/T2-149 cho bối cảnh tranh chấp clock), NOTES round150-t7. Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 149 kết cục? | **`succeeded`** 23:04:36Z (event 23:04:36.965Z), wall từ started gốc **8.925 s**, margin **1.875 s** (31m15s) tới hạn ngân sách 23:35:51Z | §2.1 |
| started_at bị viết lại tại #40? | **KHÔNG — và #40 KHÔNG kiểm được giả thuyết viết lại.** Run 149 đã finished 1.653 s (27m33s) TRƯỚC btime #40; lúc #40 xảy ra KHÔNG có run vcut nào đang chạy (run 150 chưa dispatch). Điều kiện test không thỏa — đây KHÔNG phải bằng chứng âm kiểu #38 (ở #38 run 148 ĐANG chạy mà không bị viết lại). n vẫn = 2 (#38 âm, #39 dương) | §2.2 |
| Run 150? | **Jitter 0 s** (started_at = scheduled_for = 23:35:51Z), dispatch 23:35:51.082Z, **vẫn `running` lúc đóng cờ** (~01:20Z, tuổi 6.300 s, còn 4.500 s tới hạn 02:35:51Z). Kết cục thuộc T7-151 | §2.3 |
| Cửa slot đợt 150? | **CỬA LÀNH:** HB 7/7, DR 3/3, 0 thiếu mới. Nhưng có 1 slot HB muộn lớn: **23:20:50Z dispatch muộn +889 s** — tái hiện mẫu muộn HB lần thứ 7 | §2.4 |
| Tranh chấp clock? | **Không có dữ kiện mới từ phía T7.** Parent đã quyết GIỮ KHOẢNG RỘNG e2 ∈ [313, 340] s — T7 chỉ ghi nhận, không chọn nhánh, không mở lại | §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–149): heartbeat **44/290 slot thiếu** (số thiếu +0, mẫu số +7); deterministic-doctor **49/216 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 149 — SUCCEEDED (theo lệ, kiểm 1 lần đọc DB + events đối chiếu)

Run 149 (`91ee7447-b9b9-483a-9303-ece3a4e0f75b`, sched 1795120551 = 20:35:51Z):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795120551 = 20:35:51Z |
| started_at GỐC (dispatch 20:35:51.100Z) | 20:35:51Z — jitter 0 s |
| started_at nay (viết lại tại #39) | 1795123471 = 21:24:31Z — KHÔNG đổi so với T7-149 |
| finished_at_utc | 1795129476 = 23:04:36Z (event `succeeded` 23:04:36.965Z) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795129461 = 23:04:21Z (15 s trước finished — cùng mẫu claimed sát finished như run 146/147/148) |
| Wall từ started gốc | 1795129476 − 1795120551 = **8.925 s** |
| Hạn ngân sách (started gốc + 10.800 s) | 23:35:51Z — finished TRƯỚC hạn **1.875 s** (31m15s) |

- Events run 149 (đầy đủ, không thiếu): `dispatched` 20:35:51.100Z → `requeued_after_restart` 21:24:31.799Z (#39) → `dispatched` 21:24:31.861Z → `reattached_after_restart` 21:24:31.938Z → `succeeded` 23:04:36.965Z. **KHÔNG có event nào cho run 149 sau 23:04:36Z.**
- Wall danh nghĩa 8.925 s: T7-149 §2.6 ghi KHÔNG có bằng chứng nhảy clock tại #39 từ phía T7; việc chứng nhận clock tại #39 (nếu có) là của T1/T2-150 — nếu họ tìm ra bước nhảy tại #39 thì wall thật sẽ hiệu chỉnh theo, nhưng kết cục SUCCEEDED không đổi (margin 1.875 s đủ lớn để nuốt mọi bước nhảy đã biết: lớn nhất X37 < 390 s; ngay cả X = 595 s cũng chỉ rút margin xuống 1.280 s).
- **Mẫu (m) KHÔNG tái diễn ở 149→150:** run 149 succeeded (không timeout) + run 150 jitter 0 s — lần thứ hai liên tiếp (sau 148→149).

### 2.2 Viết lại started_at tại reboot #40 — KHÔNG XẢY RA, VÀ KHÔNG PHẢI LÀ MỘT TEST

- **started_at run 149 KHÔNG đổi tại #40:** vẫn 1795123471 = 21:24:31Z ở lần đọc đầu phiên (~23:41Z, sau #40) — trùng đúng giá trị T7-149 đã đọc TRƯỚC #40. 0 event `requeued_after_restart` / `dispatched` / `reattached_after_restart` nào cho run 149 sau 23:04:36Z.
- **Nhưng đây KHÔNG phải bằng chứng âm cho giả thuyết viết lại:** run 149 finished 23:04:36Z, tức **1.653 s (27m33s) TRƯỚC btime #40 (23:32:09Z)**. Daemon startup recovery chỉ requeue run ĐANG CHẠY — run đã `succeeded` không thuộc diện requeue. Lúc #40 xảy ra, KHÔNG có run vcut nào đang chạy (run 150 dispatch 23:35:51Z, sau #40 222 s). **Điều kiện để test giả thuyết (một run đang chạy tại thời điểm reboot) không thỏa.**
- Phân biệt rõ với #38 (bằng chứng âm thật): tại #38 run 148 ĐANG chạy (started gốc 17:36:53Z, finished 20:19:32Z; btime #38 20:00:33Z nằm GIỮA) mà daemon KHÔNG requeue — đó mới là test âm. Tại #40 không có run nào để requeue, nên không đếm vào n.
- **n cho giả thuyết viết lại (viết lại ⟺ recovery requeue run đang chạy) vẫn = 2:** #38 âm (run 148 đang chạy, không viết lại) + #39 dương (run 149 đang chạy, viết lại, bằng chứng trực tiếp thứ 16, offset 40 s). **Điểm dữ liệu thứ 3 dự kiến KHÔNG thu được** — ghi nhận đúng bản chất này, không ép thành dương hay âm.
- Kiểm bổ sung — daemon có chạy recovery nào tại #40 không: **0 event `requeued_after_restart` toàn bảng trong cửa 23:32:09–23:35:39Z** (thực ra 0 event toàn bảng trong cả cửa 23:04:37–23:35:38Z — xem §2.4). Không có run nào của bất kỳ job nào bị requeue tại #40 (các job ngắn HB/DR đều đã finished trước đó; run vcut duy nhất đang chạy… không có). Phù hợp với dạng tinh chỉnh: không có run đang chạy → không có gì để requeue.
- Dữ kiện mở duy nhất của điều tra (m) — điều kiện khiến recovery bỏ qua run 148 tại #38 — VẪN MỞ, vẫn chỉ ghi nhận để theo dõi, KHÔNG mở điều tra mới (quyết (d) đã đóng điều tra).

### 2.3 Run 150 — jitter 0 s, vẫn running lúc đóng cờ

Run 150 (`1551f2fa-fefd-4c6f-bc19-72dc29568bd6`, sched 1795131351 = 23:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795131351 | 23:35:51Z 19/11 |
| dispatched (event) | — | 23:35:51.082Z |
| started_at (nay = gốc) | 1795131351 | 23:35:51Z — **jitter 0 s** |
| worker_claimed_at | 1795131351 | 23:35:51Z |
| Hạn ngân sách (started gốc + 10.800 s) | 1795142151 | 02:35:51Z 20/11 |

- 4 lần đọc DB trong phiên (~23:41Z, ~00:14Z, ~00:45Z, ~01:20Z): status `running` ở cả 4 lần; started_at/claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. 0 event `requeued_after_restart` / `reattached_after_restart` cho run 150 (chỉ có `dispatched` + `artifact_action_scope`).
- Tuổi run: ~2.319 s lúc kiểm lần 2 (00:14:30Z), 4.155 s lúc kiểm lần 3 (00:45:06Z), **6.300 s (1h45m) lúc kiểm cuối (01:20:51Z)** — còn 4.500 s (1h15m) tới hạn ngân sách 02:35:51Z. **Kết cục thuộc cửa T7-151.**
- Dispatch sau btime #40: 222 s (23:35:51Z − 23:32:09Z). Run 150 dispatch ĐÚNG GIỜ sched dù daemon vừa reboot — không bị trễ như HB 23:20:50Z (§2.4), vì slot của nó rơi SAU khi daemon đã hồi phục (event đầu tiên sau #40 là 23:35:39Z, trước dispatch 12 s).
- So sánh mốc: run 149 jitter 0 s ở đợt 149 → run 150 jitter 0 s (lần thứ hai liên tiếp jitter 0 cho lượt vcut).

### 2.4 Slot HB/DR trong cửa 22:16:xxZ → 01:20:51Z 19–20/11 — 7/7 + 3/3, 0 thiếu; 1 slot HB muộn +889 s + khoảng im lặng scheduler 1.863 s

Cửa kiểm ~2h45' (4 lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 7/7 có, 0 thiếu mới, 1 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 05:20:50 (22:20:50Z) | 88c1659d | 22:15:34 | −316 s | CÓ |
| 05:50:50 (22:50:50Z) | 09b4ff28 | 22:45:34 | −316 s | CÓ |
| 06:20:50 (23:20:50Z) | 3122c7cd | 23:35:39 | **+889 s** | CÓ, MUỘN |
| 06:50:50 (23:50:50Z) | 9f560c0a | 23:45:34 | −316 s | CÓ |
| 07:20:50 (00:20:50Z) | b2a84f1f | 00:15:34 | −316 s | CÓ |
| 07:50:50 (00:50:50Z) | bc0ee72a | 00:45:34 | −316 s | CÓ |
| 08:20:50 (01:20:50Z) | 285becac | 01:15:34 | −316 s | CÓ |

- 6/7 slot jitter −316 s (mẫu chuẩn); tất cả `succeeded`, attempt=1, error_text=null.
- **Slot HB 23:20:50Z MUỘN +889 s (1795131339 − 1795130450):** đáng lẽ dispatch ~23:15:34Z, thực tế dispatch 23:35:39Z, succeeded cùng giây. Đây là **lần tái hiện thứ 7 của mẫu muộn HB** (6 lần trước ở +887 s — đợt 127/129/130/132/134/136; kỷ lục +1.252 s đợt 129) — lần này **+889 s, chênh +2 s so với mẫu +887 s**. T7-149 vừa ghi "KHÔNG tái hiện đợt này" — mẫu quay lại ngay đợt sau.
- **Khoảng im lặng scheduler 23:04:37Z → 23:35:38Z = 1.863 s (31m03s): 0 event toàn bảng** (đã loại `artifact_action_scope`; kiểm cửa 23:04:36–23:32:00 chỉ có event `succeeded` run 149; cửa 23:32:00–23:36:30 chỉ có event từ 23:35:39Z). Trong khoảng này: HB slot 23:20:50Z đáng lẽ dispatch ~23:15:34Z đã không dispatch; reboot #40 (23:32:09Z) nằm trong khoảng im lặng; event đầu tiên sau #40 là `reconciled` 23:35:39.017Z (jobs=28 changed_jobs=1 new_runs=1) rồi HB dispatch 23:35:39.159Z, rồi `reconciled` 23:35:51.026Z + vcut dispatch 23:35:51.082Z.
- Diễn giải thận trọng (ghi nhận, không kết luận cơ chế): daemon đã im lặng từ sau 23:04:36Z — TRƯỚC #40 tới 27m33s — nên #40 một mình không giải thích được toàn bộ khoảng im lặng (daemon im trước khi VM reboot; hoặc scheduler pass bị kẹt/treo mà DB không ghi lại). Event đầu tiên sau #40 ở **btime + 210 s** — chậm hơn hẳn mốc recovery ~40 s ở #39 (requeue 21:24:31Z = btime + 40 s). Có thể daemon khởi động chậm sau #40 (cùng họ với "replay khởi động muộn +35m05s" T5-149 ghi ở #38 — nhưng ở đây chỉ +210 s tới event đầu tiên, không phải +35 phút). **Nguyên nhân khoảng im lặng + khởi động chậm: CHƯA XÁC ĐỊNH — ghi nhận là dữ kiện mở, không suy đoán thêm.** Cơ chế drop phía scheduler vẫn đóng theo hướng đợt 125 (quyết parent đợt 136 §12.3(j)).
- Lưu ý: slot muộn vẫn CÓ (succeeded) nên KHÔNG tính vào số thiếu lũy kế — chỉ ghi nhận là muộn lớn.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:00 (23:00Z) | 9986cb51 | 23:00:00 | 0 s | CÓ |
| 07:00 (00:00Z) | 7811b985 | 00:00:00 | 0 s | CÓ |
| 08:00 (01:00Z) | 8c16629b | 01:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s. DR 00:00Z finished 00:00:01Z (+1 s — cùng quirk 1 s như DR 21:00Z đợt 149 và HB 17:50:50Z đợt 148); DR 01:00Z finished cùng giây started.
- Slot DR 02:00Z + HB 01:50:50Z + vcut 02:35:51Z (run 151) thuộc T7-151.

### 2.5 Tranh chấp clock T1–T2 — không có dữ kiện mới từ phía T7

- Parent đã quyết (§12.3 đợt 149): (i) XÁC NHẬN bác bỏ "X > 595 s"; (ii) mâu thuẫn 27 s: GIỮ KHOẢNG RỘNG e2 ∈ [313, 340] s, không chọn nhánh; (iii) khung #113?: CHỐT BẢN GIỜ THỰC (7 + e2 s).
- Phía T7 trong phiên này: KHÔNG có lần đọc boot/giờ nào trong cửa sổ nhạy cảm (~19:53–20:02Z 19/11 — đã qua từ đợt 148), KHÔNG có dữ kiện mới về e2 hay về bước nhảy trong đời ae8f70bb. **T7 chỉ ghi nhận quyết parent, không chọn nhánh, không mở lại.**
- Hệ quả cho số liệu đợt này: run 149/150 + các slot HB/DR đều nằm sau #39; T7-149 đã ghi KHÔNG có bằng chứng nhảy clock tại #39 từ phía T7; việc chứng nhận clock tại #39/#40 (nếu có) là của T1/T2-150. Mọi wall/jitter trong LIMITS này là số danh nghĩa theo đồng hồ ghi trong DB; kết cục run 149 (SUCCEEDED, margin 1.875 s) không nhạy với bước nhảy cỡ đã biết (§2.1).

### 2.6 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm cuối (~01:20Z): T7 chưa kiểm cờ .done đợt 150 (các luồng khác còn đang chạy — run 150 vẫn running; T10-150 chưa thể đóng sổ). Việc đếm cờ thuộc T10-150.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB limit theo slot, DR theo slot, vcut run 149/150 đầy đủ; events lọc theo run_id + theo cửa giờ, trừ `artifact_action_scope` vì detail dài). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này đã bắt được 1 lỗi nhẩm tuổi run 150 ở bản nháp NOTES — xem §6, F-150-T7-1).
4. Cửa kiểm đợt này ~2h45' (22:16:xxZ → 01:20:51Z 19–20/11), đủ 7 slot HB + 3 slot DR + run vcut 149 (kết cục) và 150 (theo dõi). Bốn lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 22:20:50Z + 22:50:50Z thuộc cửa 150 theo quy ước đứng (T7-149 §2.1 giao; lưu ý T7-149 §3.5 viết "HB tiếp theo là 22:50:50Z" — mâu thuẫn nội bộ nhỏ trong LIMITS 149, nhưng phép cộng lũy kế của họ (279 + 4 = 283) cho thấy 22:20:50Z KHÔNG nằm trong 283, nên T7-150 cộng cả 7 slot là đúng).
6. **Không có sleep nào bị giết trong phiên này** (khác #39 giết sleep T7-149): 3 sleep (1.750 s + 1.800 s + 2.100 s) đều hoàn thành bình thường; boot không đổi suốt phiên.
7. T7 đóng cờ ~01:25Z, trước hạn cờ 01:30Z ~5 phút (hạn cứng toàn đợt 02:00Z vẫn còn ~35'). Ghi rõ, không giấu. Run 150 vẫn running lúc đóng cờ — kết cục thuộc T7-151 (hạn ngân sách 02:35:51Z).

## 4. Cập nhật lũy kế (nối tiếp đợt 149, cùng phương pháp)

- Heartbeat: 44/283 → **44/290 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 08:50:50 +07). Kiểm toán cửa sổ: 283 + 7 slot mới = 290 ✓. Số thiếu +0 (slot muộn +889 s vẫn CÓ nên không tính thiếu).
- Deterministic-doctor: 49/213 → **49/216 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 08:00 +07). Kiểm toán: 213 + 3 = 216 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/290 = 15,2% (giảm từ 15,5% — 0 thiếu mới); DR 49/216 = 22,7% (giảm từ 23,0% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 149: SUCCEEDED (wall 8.925 s, margin 1.875 s)** — không đổi số đếm đợt 149. Mẫu (m) KHÔNG tái diễn ở 149→150 (run 149 succeeded + run 150 jitter 0 s, lần thứ hai liên tiếp).
2. **Điểm dữ liệu thứ 3 cho mẫu (m): KHÔNG THU ĐƯỢC (điều kiện test không thỏa)** — #40 xảy ra khi không có run vcut nào đang chạy; n vẫn = 2 (#38 âm, #39 dương). Dạng tinh chỉnh (viết lại ⟺ recovery requeue run đang chạy) vẫn đứng; dữ kiện mở duy nhất (điều kiện khiến recovery bỏ qua run 148 tại #38) VẪN MỞ, chỉ ghi nhận để theo dõi, KHÔNG mở điều tra mới (điều tra đã đóng theo quyết (d)).
3. **Mẫu muộn HB +889 s: TÁI HIỆN lần thứ 7** (+2 s so với mẫu +887 s; kỷ lục vẫn +1.252 s đợt 129). Kèm khoảng im lặng scheduler 1.863 s (23:04:37–23:35:38Z) bao trùm #40 + event đầu tiên sau #40 ở btime + 210 s (chậm hơn mốc ~40 s ở #39). Nguyên nhân khoảng im lặng + khởi động chậm: CHƯA XÁC ĐỊNH — ghi nhận là dữ kiện mở; cơ chế drop phía scheduler vẫn đóng theo hướng đợt 125 (quyết (j) đợt 136).
4. **Run 150 vẫn RUNNING lúc T7 đóng cờ** (tuổi 6.300 s, còn 4.500 s tới hạn 02:35:51Z) — kết cục thuộc T7-151. Không đổi số đếm đợt 150.
5. **Tranh chấp clock: không có dữ kiện mới từ phía T7** — giữ khoảng rộng e2 ∈ [313, 340] s theo quyết parent; khung #113? bản giờ thực (7 + e2 s) đã chốt. T1/T2-150 chứng nhận clock tại #39/#40 (nếu có) và mù #71? (70025d3e → 802f358f) + mù #72? (802f358f → e9295700, btime 23:32:09Z — giao T2-150).
6. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-150-T7-1 — Nhẩm sai tuổi run 150 ở bản nháp NOTES kiểm lần 2 (ghi ~1.759 s thay vì đúng 2.319 s), đã bắt được bằng `date -u` và sửa TRƯỚC khi ghi LIMITS.** Tuổi đúng: 00:14:30Z − 23:35:51Z = 2.319 s (38m39s). Số sai KHÔNG đi vào LIMITS này. Cùng họ sai số nhẩm epoch như F-147-T7-1/F-148-T7-1/F-149-T7-3 — `date -u` là chốt chặn bắt được (lần thứ 4 liên tiếp).
- **F-150-T7-0 — Không có sai số nào khác trong đợt này:** 4 lần đọc DB khớp nhau ở mọi slot trùng; mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, +889 s ×1 slot, DR 0 s ×3 slot, run 149 wall 8.925 s / margin 1.875 s, run 150 jitter 0 s, khoảng im lặng 1.863 s, first-event sau #40 btime + 210 s, run 150 dispatch sau btime + 222 s, run 149 finished trước btime 1.653 s — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 4 lần đọc (e9295700, btime không đổi) và khớp brief về reboot #40; ở cả 4 lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 149 có events đối chiếu trực tiếp (succeeded 23:04:36.965Z), không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round150-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round150-t7/NOTES.md` (không nằm trong repo nên không stage).
