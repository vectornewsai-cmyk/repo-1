# PHASE9 ROUND151 T7 — RUN 150 SUCCEEDED (wall gốc 10.623 s, margin CHỈ 177 s) + started_at BỊ VIẾT LẠI TẠI #41 (điểm (m) thứ 3, DƯƠNG) + REBOOT #42 GIỮA PHIÊN VIẾT LẠI RUN 151 (điểm (m) thứ 4, DƯƠNG) + CỬA LÀNH (HB 7/7 + DR 3/3, 0 muộn)

- **Luồng:** T7 đợt 151 (lượt cron 09:35 +07 20/11/2026 = 02:35:51Z 20/11). Nhiệm vụ theo quyết parent §12.3 (q) đợt 150: (1) kết cục run 150 (`1551f2fa-...`, sched 23:35:51Z); (2) kiểm tra các slot Heartbeat (HB) và Daily Run (DR) trong phiên; (3) ghi rõ boot hiện tại và mọi reboot trong phiên. Điều tra mẫu (m) đã ĐÓNG theo quyết (d) đợt 149 — T7 CHỈ GHI NHẬN các điểm dữ liệu mới, KHÔNG mở điều tra mới, không kết luận lại cơ chế.
- **Boot trong phiên:** mở phiên là **2e430750-bda0-47b6-bf22-902953eff096** (btime /proc/stat 1795137951 = 01:25:51Z — **reboot #41**, xảy ra TRƯỚC phiên, giữa T7-150 đóng cờ 01:20:51Z và run 151 dispatch 02:35:51Z); **reboot #42 GIỮA PHIÊN** 03:25:16Z → boot mới **fad2aab9-bd74-403f-acad-310fe7cb4e9d** (btime 1795145116 = 03:25:16Z), KHÔNG có reboot nào sau #42 (kiểm boot_id ở cả 6 lần đọc: ~02:38Z, ~03:10Z, ~03:26Z, ~03:56Z, ~04:27Z, ~04:52Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut/HB/DR), LIMITS T7-150 + aggregate đợt 150 §7/§12.3 (q), NOTES round151-t7. Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 150 kết cục? | **`succeeded`** 02:32:54Z (event 02:32:54.506Z), wall từ started gốc **10.623 s**, margin **chỉ 177 s** (2m57s) tới hạn ngân sách 02:35:51Z — suýt timeout | §2.1 |
| started_at bị viết lại tại #41? | **CÓ — ĐIỂM DỮ LIỆU THỨ 3 CHO MẪU (m), DƯƠNG.** Run 150 đang chạy tại btime #41; started_at 1795131351 → 1795137996 (01:26:36Z = btime + 45 s); requeue event btime + 44,994 s | §2.2 |
| Reboot #42 trong phiên? | **CÓ — boot mới fad2aab9, btime 03:25:16Z; run 151 (run của chính đợt này) ĐANG CHẠY và BỊ VIẾT LẠI — ĐIỂM DỮ LIỆU THỨ 4, DƯƠNG** (requeue btime + 33,236 s — nhanh nhất trong 3 lần dương) | §2.3 |
| n mẫu (m)? | **n = 4: #38 ÂM, #39 DƯƠNG, #41 DƯƠNG, #42 DƯƠNG.** Điều tra vẫn đóng — chỉ ghi nhận | §2.2–2.3 |
| Cửa slot đợt 151? | **CỬA LÀNH HOÀN TOÀN:** HB 7/7 (tất cả −316 s), DR 3/3 (tất cả 0 s), **0 thiếu mới, 0 muộn** — không tái hiện mẫu muộn HB | §2.4 |
| Run 151? | **Jitter 0 s** (started gốc = scheduled_for = 02:35:51Z), **vẫn `running` lúc đóng cờ** (~04:52Z, tuổi gốc 8.211 s, còn 2.589 s tới hạn 05:35:51Z). Kết cục thuộc T7-152 | §2.5 |
| Khoảng im lặng scheduler? | **KHÔNG có khoảng im lặng bất thường trong phiên** (gap lớn nhất 615 s là im lặng bình thường, không có slot đến hạn + 33 s daemon-down tại #42) | §2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–150): heartbeat **44/297 slot thiếu** (số thiếu +0, mẫu số +7); deterministic-doctor **49/219 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 150 — SUCCEEDED, margin chỉ 177 s (theo lệ, 2 lần đọc DB + events đối chiếu)

Run 150 (`1551f2fa-fefd-4c6f-bc19-72dc29568bd6`, sched 1795131351 = 23:35:51Z 19/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795131351 = 23:35:51Z 19/11 |
| started_at GỐC (dispatch 23:35:51.082Z) | 23:35:51Z — jitter 0 s |
| started_at nay (viết lại tại #41) | 1795137996 = 01:26:36Z 20/11 |
| finished_at_utc | 1795141974 = 02:32:54Z (event `succeeded` 02:32:54.506Z) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795141917 = 02:31:57Z (57 s trước finished — cùng mẫu claimed sát finished như run 146/147/148/149) |
| Wall từ started gốc | 1795141974 − 1795131351 = **10.623 s** (2h57m03s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795142151 = 02:35:51Z — finished TRƯỚC hạn **177 s** (2m57s) |
| Wall từ started viết lại | 1795141974 − 1795137996 = 3.978 s (1h06m18s) |

- Events run 150 (đầy đủ, không thiếu): `dispatched` 23:35:51.082Z → `requeued_after_restart` 01:26:35.994Z (#41, detail "daemon startup recovery") → `dispatched` 01:26:36.080Z → `reattached_after_restart` 01:26:36.199Z (detail "execute turn already complete (model-output evidence)") → `succeeded` 02:32:54.506Z. **KHÔNG có event nào cho run 150 sau 02:32:54Z.**
- Đọc lại xác nhận cuối phiên (~04:52:53Z): row giống hệt lần đọc đầu (~02:38Z) ở mọi trường — 2 lần đọc độc lập khớp nhau + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn.
- **Margin 177 s là hẹp nhất trong chuỗi run vcut gần đây** (run 149 margin 1.875 s; run 150 chỉ còn 1,6% ngân sách). Nếu run 150 kéo dài thêm 178 s nữa thì đã timeout theo cơ chế (m) (wall từ started GỐC vượt 10.800 s) — dù started_at đã bị viết lại tại #41. Ghi nhận đúng bản chất: viết lại started_at KHÔNG cứu run khỏi timeout tính từ gốc; run này thoát timeout trong gang tấc.
- Wall danh nghĩa 10.623 s: T7-150 đã ghi KHÔNG có bằng chứng nhảy clock tại #40 từ phía T7; việc chứng nhận clock tại #41 (nếu có) là của T1/T2-151 — nếu họ tìm ra bước nhảy tại #41 thì wall thật sẽ hiệu chỉnh theo, nhưng kết cục SUCCEEDED chỉ đổi nếu bước nhảy ≥ 177 s theo hướng rút ngắn margin (mọi bước nhảy đã biết đều < 390 s theo hướng… — không, T7 không suy đoán hướng; chỉ ghi: margin 177 s nhỏ hơn mọi bước nhảy đã biết trong tranh chấp clock, nên kết cục lần này NHẠY với chứng nhận clock tại #41 — T1/T2-151 phán).

### 2.2 Viết lại started_at tại reboot #41 — CÓ, ĐIỂM DỮ LIỆU THỨ 3, DƯƠNG

- **started_at run 150 ĐÃ đổi tại #41:** T7-150 đọc 4 lần (tới 01:20:51Z, trước #41) đều 1795131351; T7-151 đọc lần đầu (~02:38Z, sau #41) đã là 1795137996 = 01:26:36Z, và không đổi ở lần đọc xác nhận cuối (~04:52:53Z). Offset viết lại: 1795137996 − 1795131351 = 6.645 s.
- **Điều kiện test THỎA — đây là test thật:** run 150 ĐANG CHẠY tại btime #41 (started gốc 23:35:51Z, finished 02:32:54Z; btime 01:25:51Z nằm GIỮA — khác #40, lúc đó không có run nào đang chạy). Daemon startup recovery ĐÃ requeue: event `requeued_after_restart` 01:26:35.994Z = **btime + 44,994 s** (≈ +45 s — khớp mốc ~40 s ở #39: requeue 21:24:31.799Z = btime 21:23:51Z + 40,799 s), rồi `dispatched` 01:26:36.080Z → `reattached_after_restart` 01:26:36.199Z.
- Kiểm bổ sung — daemon có requeue run nào khác tại #41 không: trong cửa 01:20:51–02:35:51Z chỉ có DUY NHẤT 1 event `requeued_after_restart` toàn bảng — cho run 150. Các job ngắn (HB/DR/feed-pulse) đều đã finished trước btime #41 nên không có gì khác để requeue. Phù hợp dạng tinh chỉnh (viết lại ⟺ recovery requeue run đang chạy).
- **n cho giả thuyết viết lại sau #41 = 3: #38 ÂM (run 148 đang chạy, không viết lại) + #39 DƯƠNG + #41 DƯƠNG.** (Sau §2.3, n lên 4.)

### 2.3 Reboot #42 giữa phiên — run 151 bị viết lại, ĐIỂM DỮ LIỆU THỨ 4, DƯƠNG

- **Reboot #42: boot 2e430750 → fad2aab9-bd74-403f-acad-310fe7cb4e9d, btime 1795145116 = 03:25:16Z.** Phát hiện khi sleep 1.800 s của T7 (bắt đầu ~03:10:29Z) **BỊ GIẾT bằng SIGTERM sau ~897 s** (~03:25:26Z, ~10 s sau btime) — cùng hiện tượng #39 giết sleep T7-149 (T7-150 ghi "không có sleep nào bị giết trong phiên này" — nay tái diễn ở #42). Uptime 0 phút lúc kiểm 03:25:57Z; wtmp bắt đầu 03:25:27Z. Phiên T7-151 vẫn tiếp tục được (runtime báo kết thúc lệnh nền, T7 đọc lại DB ngay).
- **Run 151 (16eee8eb-d012-4221-bac9-9cf8e66e9b00, run của chính đợt này): started_at ĐÃ BỊ VIẾT LẠI tại #42.** started_at gốc 1795142151 = 02:35:51Z (đọc ở kiểm lần 1 ~02:38Z và lần 2 ~03:10:20Z — trùng nhau); sau #42 đọc được 1795145149 = 03:25:49Z, không đổi ở 3 lần đọc sau (~03:56Z, ~04:27Z, ~04:52Z). Offset viết lại: 1795145149 − 1795142151 = 2.998 s. claimed_at VẪN 1795142151 (gốc — chỉ started_at bị viết lại, claimed_at không đổi, giống mẫu #41: claimed của run 150 là giá trị đặt lúc dispatch/lúc chạy, không bị recovery ghi đè).
- Events run 151 (đầy đủ): `dispatched` 02:35:51.141Z → `requeued_after_restart` 03:25:49.236Z (detail "daemon startup recovery") → `dispatched` 03:25:49.305Z → `reattached_after_restart` 03:25:49.381Z (detail "execute turn already complete (model-output evidence)" — cùng mẫu #41). Requeue = **btime + 33,236 s — nhanh nhất trong 3 lần requeue dương** (#39 +40,799 s; #41 +44,994 s; #42 +33,236 s — dải 33–45 s).
- **Điều kiện test THỎA:** run 151 ĐANG CHẠY tại btime #42 (vẫn `running` ở kiểm lần 2 lúc 03:10:20Z, tuổi gốc 2.069 s; btime 03:25:16Z nằm giữa started gốc 02:35:51Z và thời điểm kiểm cuối — run vẫn `running` lúc đóng cờ).
- **n cho giả thuyết viết lại nay = 4: #38 ÂM, #39 DƯƠNG, #41 DƯƠNG, #42 DƯƠNG.** Điều tra (m) ĐÃ ĐÓNG theo quyết (d) đợt 149 — T7 CHỈ GHI NHẬN điểm dữ liệu thứ 4 này, KHÔNG mở điều tra mới, không kết luận lại cơ chế. Dữ kiện mở duy nhất (điều kiện khiến recovery bỏ qua run 148 tại #38) VẪN MỞ, vẫn chỉ ghi nhận để theo dõi, KHÔNG mở điều tra mới.
- Hệ quả cho đợt 151: T10-151 đóng sổ trên boot fad2aab9; mù #73? (reboot #41) + mù #74? (reboot #42, giao T2-152) — T7 không chứng nhận mù, chỉ ghi btime/boot để T2 đối chiếu. **Lưu ý cho T2-151/152:** #42 giết sleep của T7 lúc ~03:25:26Z — các luồng khác đợt 151 có process/sleep nào bị #42 giết không thuộc phạm vi T7 (T10 kiểm).

### 2.4 Slot HB/DR trong cửa 01:20:50Z → 04:52:53Z 20/11 — 7/7 + 3/3, 0 thiếu, 0 muộn; không có khoảng im lặng bất thường

Cửa kiểm ~3h32' (6 lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 7/7 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 08:50:50 (01:50:50Z) | b4f7cdbe | 01:45:34 | −316 s | CÓ |
| 09:20:50 (02:20:50Z) | d4e5e712 | 02:15:34 | −316 s | CÓ |
| 09:50:50 (02:50:50Z) | 5071c268 | 02:45:34 | −316 s | CÓ |
| 10:20:50 (03:20:50Z) | 2ad263e5 | 03:15:34 | −316 s | CÓ |
| 10:50:50 (03:50:50Z) | b6e4b67d | 03:45:34 | −316 s | CÓ |
| 11:20:50 (04:20:50Z) | a79e6d98 | 04:15:34 | −316 s | CÓ |
| 11:50:50 (04:50:50Z) | 01d2950e | 04:45:34 | −316 s | CÓ |

- Cả 7 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started.
- **Mẫu muộn HB (+889 s đợt 150, lần thứ 7) KHÔNG tái hiện đợt này** — lần thứ hai mẫu muộn vắng mặt sau khi quay lại (đợt 149 vắng, đợt 150 tái hiện, đợt 151 vắng). Slot 03:20:50Z dispatch 03:15:34Z — TRƯỚC reboot #42 (03:25:16Z), không bị ảnh hưởng; slot 03:50:50Z là slot HB ĐẦU TIÊN dispatch trên boot mới fad2aab9 sau #42 — ĐÚNG GIỜ chuẩn (daemon hồi phục sạch sau requeue run 151).
- **Khoảng im lặng scheduler: KHÔNG có khoảng bất thường trong phiên.** Event đầu tiên sau btime #42 là requeue 03:25:49.236Z = btime + 33,236 s (recovery nhanh, cùng họ mốc ~40 s ở #39/#41 — KHÁC hẳn first-event sau #40 ở btime + 210 s kèm khoảng im lặng 1.863 s đợt 150). Gap lớn nhất trong cửa 03:10:20–03:26:06Z: HB-succeeded 03:15:34Z → requeue 03:25:49Z = 615 s (10m15s) — KHÔNG phải im lặng bất thường: không có slot nào đến hạn trong khoảng đó (HB tiếp theo dispatch ~03:45:34Z); phần daemon-down thật chỉ 33 s (btime → requeue), còn 582 s trước btime là im lặng bình thường do không có slot đến hạn. Trong cửa 01:20:51–02:35:51Z: 16 event, gap lớn nhất reattached 01:26:36Z → feed-pulse-08 01:41:54Z = 918 s — cũng không có slot đến hạn trong khoảng đó (HB tiếp theo dispatch 01:45:34Z), không bất thường.
- Khoảng im lặng 1.863 s đợt 150 (23:04:37–23:35:38Z) — nguyên nhân VẪN CHƯA XÁC ĐỊNH (ghi nhận đợt 150); đợt 151 không tái hiện khoảng nào tương tự. Cơ chế drop phía scheduler vẫn đóng theo hướng đợt 125 (quyết parent đợt 136 §12.3(j)).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:00 (02:00Z) | be955248 | 02:00:00 | 0 s | CÓ |
| 10:00 (03:00Z) | 8a11941c | 03:00:00 | 0 s | CÓ |
| 11:00 (04:00Z) | bd19fbfd | 04:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 05:00Z + HB 05:20:50Z + vcut 05:35:51Z (run 152) thuộc T7-152.

### 2.5 Run 151 — jitter 0 s, vẫn running lúc đóng cờ

Run 151 (`16eee8eb-d012-4221-bac9-9cf8e66e9b00`, sched 1795142151 = 02:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795142151 | 02:35:51Z 20/11 |
| dispatched (event) | — | 02:35:51.141Z |
| started_at GỐC | 1795142151 | 02:35:51Z — **jitter 0 s** |
| started_at nay (viết lại tại #42) | 1795145149 | 03:25:49Z (= btime #42 + 33 s) |
| worker_claimed_at | 1795142151 | 02:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795152951 | 05:35:51Z 20/11 |

- 6 lần đọc DB trong phiên (~02:38Z, ~03:10Z, ~03:26Z, ~03:56Z, ~04:27Z, ~04:52Z): status `running` ở cả 6 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #42, khớp event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` + `artifact_action_scope` (lúc mở) rồi `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #42 — không có event nào khác.
- Tuổi run từ gốc: 2.069 s lúc kiểm lần 2 (03:10:20Z), 4.852 s lúc kiểm lần 4 (03:56:43Z), 6.693 s lúc kiểm lần 5 (04:27:24Z), **8.211 s (2h16m51s) lúc kiểm cuối (04:52:42Z)** — còn 2.589 s (43m09s) tới hạn ngân sách 05:35:51Z. **Kết cục thuộc T7-152.**
- **Mẫu (m) KHÔNG tái diễn ở 150→151:** run 150 succeeded (không timeout) + run 151 jitter 0 s — lần thứ ba liên tiếp (sau 148→149, 149→150). Lưu ý: run 151 ĐÃ bị viết lại started_at tại #42 (như run 149 tại #39, run 150 tại #41) — viết lại không đồng nghĩa timeout; timeout chỉ xảy ra khi wall từ started GỐC vượt ngân sách.

### 2.6 Tranh chấp clock T1–T2 — không có dữ kiện mới từ phía T7

- Parent đã quyết (§12.3 đợt 149): (i) XÁC NHẬN bác bỏ "X > 595 s"; (ii) mâu thuẫn 27 s: GIỮ KHOẢNG RỘNG e2 ∈ [313, 340] s, không chọn nhánh; (iii) khung #113?: CHỐT BẢN GIỜ THỰC (7 + e2 s).
- Phía T7 trong phiên này: KHÔNG có lần đọc boot/giờ nào trong cửa sổ nhạy cảm (~19:53–20:02Z 19/11 — đã qua từ đợt 148), KHÔNG có dữ kiện mới về e2 hay về bước nhảy trong đời ae8f70bb. **T7 chỉ ghi nhận quyết parent, không chọn nhánh, không mở lại.**
- Hệ quả cho số liệu đợt này: run 150/151 + các slot HB/DR đều nằm sau #40; việc chứng nhận clock tại #41/#42 (nếu có) là của T1/T2-151. Mọi wall/jitter trong LIMITS này là số danh nghĩa theo đồng hồ ghi trong DB; **kết cục run 150 (SUCCEEDED, margin 177 s) NHẠY với chứng nhận clock tại #41** — margin nhỏ hơn mọi bước nhảy đã biết trong tranh chấp, nên nếu T1/T2 tìm ra bước nhảy ≥ 177 s tại #41 theo hướng rút ngắn margin thì kết cục danh nghĩa này cần hiệu chỉnh (xem §2.1).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 150/151 đầy đủ; events lọc theo run_id + theo cửa giờ, trừ `artifact_action_scope` vì detail dài). Job IDs đã xác minh: heartbeat (interval@30m) / deterministic-doctor (interval@1h) / vcut-build-loop (interval@3h, Asia/Saigon).
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này đã bắt được 1 lỗi nhẩm epoch ở bản nháp NOTES — xem §6, F-151-T7-1).
4. Cửa kiểm đợt này ~3h32' (01:20:50Z → 04:52:53Z 20/11), đủ 7 slot HB + 3 slot DR + run vcut 150 (kết cục) và 151 (theo dõi). Sáu lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa. Run 150 được đọc lại xác nhận cuối phiên (2 lần đọc độc lập khớp nhau + events đối chiếu).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối; slot HB 01:50:50Z + 02:20:50Z + DR 02:00Z thuộc cửa 151 theo quy ước đứng (sau kiểm cuối T7-150 lúc 01:20:51Z). DR 05:00Z thuộc cửa T7-152.
6. **1 sleep bị giết trong phiên này** (sleep 1.800 s, SIGTERM sau ~897 s, do reboot #42 — cùng hiện tượng #39 giết sleep T7-149); 3 sleep còn lại (1.800 s + 1.800 s + 1.500 s) hoàn thành bình thường. Boot đổi 2e430750 → fad2aab9 đúng 1 lần trong phiên (tại #42).
7. T7 đóng cờ ~04:55Z, trước hạn cờ 05:00Z ~5 phút (hạn cứng toàn đợt 05:30Z vẫn còn ~35'). Ghi rõ, không giấu. Run 151 vẫn running lúc đóng cờ — kết cục thuộc T7-152 (hạn ngân sách 05:35:51Z).

## 4. Cập nhật lũy kế (nối tiếp đợt 150, cùng phương pháp)

- Heartbeat: 44/290 → **44/297 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 11:50:50 +07). Kiểm toán cửa sổ: 290 + 7 slot mới = 297 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/216 → **49/219 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 11:00 +07). Kiểm toán: 216 + 3 = 219 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/297 = 14,8% (giảm từ 15,2% — 0 thiếu mới); DR 49/219 = 22,4% (giảm từ 22,7% — 0 thiếu mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 150: SUCCEEDED (wall gốc 10.623 s, margin chỉ 177 s)** — margin hẹp nhất chuỗi gần đây; kết cục NHẠY với chứng nhận clock tại #41 (T1/T2-151 phán). Mẫu (m) KHÔNG tái diễn ở 150→151 (lần thứ ba liên tiếp).
2. **Điểm dữ liệu thứ 3 + thứ 4 cho mẫu (m): CẢ HAI ĐỀU DƯƠNG** — #41 viết lại run 150 (requeue btime + 44,994 s), #42 viết lại run 151 (requeue btime + 33,236 s, nhanh nhất trong 3 lần dương). **n = 4: #38 ÂM, #39/#41/#42 DƯƠNG.** Điều tra (m) ĐÃ ĐÓNG (quyết (d) đợt 149) — T7 chỉ ghi nhận, KHÔNG mở điều tra mới. Dữ kiện mở duy nhất (điều kiện khiến recovery bỏ qua run 148 tại #38) VẪN MỞ, chỉ ghi nhận để theo dõi.
3. **Reboot #42 giữa phiên (btime 03:25:16Z, boot fad2aab9)** — giết sleep T7 (SIGTERM sau ~897 s); T10-151 kiểm các luồng khác có process/sleep nào bị #42 giết không (T7 không kiểm hộ). Mù #74? (reboot #42) giao T2-152; mù #73? (reboot #41) giao T2-151.
4. **Cửa slot đợt 151 LÀNH HOÀN TOÀN (HB 7/7 + DR 3/3, 0 thiếu, 0 muộn)** — mẫu muộn HB không tái hiện; khoảng im lặng 1.863 s đợt 150 không tái hiện (nguyên nhân vẫn chưa xác định — ghi nhận là dữ kiện mở).
5. **Run 151 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.211 s, còn 2.589 s tới hạn 05:35:51Z) — kết cục thuộc T7-152. Không đổi số đếm đợt 151.
6. **Tranh chấp clock: không có dữ kiện mới từ phía T7** — giữ khoảng rộng e2 ∈ [313, 340] s theo quyết parent; khung #113? bản giờ thực (7 + e2 s) đã chốt. T1/T2-151 chứng nhận clock tại #41/#42 (nếu có) và mù #73? (giao T2-151).
7. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7

- **F-151-T7-1 — Nhẩm sai epoch ở bản nháp NOTES kiểm lần 1 (ghi "requeue-btime: 644 s" do dùng nhầm epoch 1795138595 thay vì 1795137995; và gap 918 s tính từ epoch gõ nhầm 1795139514), đã bắt được bằng `date -u` và sửa TRƯỚC khi ghi LIMITS.** Số đúng: requeue 01:26:35.994Z = btime + 44,994 s; gap reattached → feed-pulse = 918 s (số gap đúng, epoch trung gian gõ nhầm). Số sai KHÔNG đi vào LIMITS này. Cùng họ sai số nhẩm epoch như F-147-T7-1/F-148-T7-1/F-149-T7-3/F-150-T7-1 — `date -u` là chốt chặn bắt được (lần thứ 5 liên tiếp).
- **F-151-T7-0 — Không có sai số nào khác trong đợt này:** 6 lần đọc DB khớp nhau ở mọi slot trùng; mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×7 slot, DR 0 s ×3 slot, run 150 wall gốc 10.623 s / margin 177 s / wall viết lại 3.978 s, run 151 jitter 0 s, requeue #41 btime + 44,994 s / #42 btime + 33,236 s, offset viết lại 6.645 s / 2.998 s, gap 615 s / 918 s — đều kiểm lại); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 6 lần đọc (2e430750 → fad2aab9 đúng 1 lần, tại #42) và khớp brief về reboot #41; ở cả 6 lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 150 có 2 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 02:32:54.506Z), không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round151-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round151-t7/NOTES.md` (không nằm trong repo nên không stage).
