# PHASE9 ROUND153 T7 — RUN 152 SUCCEEDED (wall danh nghĩa 9.590 s, margin danh nghĩa 1.210 s — NHƯNG MARGIN KHÔNG VỮNG TRƯỚC BƯỚC NHẢY KHUNG GIỜ ≥ 1.488 s QUA #45) + REBOOT #45 TRƯỚC PHIÊN (KHÔNG viết lại run 152 — ứng viên điểm ÂM thứ 2) + REBOOT #46 GIỮA PHIÊN VIẾT LẠI RUN 153 (điểm (m) thứ 6, DƯƠNG, requeue btime + 48,375 s) + CỬA SLOT LÀNH HOÀN TOÀN

- **Luồng:** T7 đợt 153 (lượt cron 15:35 +07 20/11/2026 = 08:35:51Z 20/11). Nhiệm vụ theo brief T7-153: (1) kết cục run 152 (3 lần đọc DB độc lập khớp nhau); (2) theo dõi run 153 + slot HB/DR + reboot mới; (3) LIMITS trung thực, phụ lục bằng script. Điều tra mẫu (m) đã ĐÓNG theo quyết (d) đợt 149 + (j) đợt 151 — T7 CHỈ GHI NHẬN các điểm dữ liệu mới, KHÔNG mở điều tra mới, không kết luận lại cơ chế. Chứng nhận clock thuộc T2-153.
- **Boot trong phiên:** mở phiên là **401fca75-bece-45b6-88fa-b12f602d6390** (btime /proc/stat 1795159958 = 07:32:38Z — **reboot #45**, xảy ra TRƯỚC phiên, giữa T7-152 đóng cờ và run 153 dispatch 08:35:51Z); **reboot #46 GIỮA PHIÊN** 09:04:49Z → boot mới **1450ac80-d1d2-46b4-a87c-c209a58c4798** (btime 1795165489 = 09:04:49Z), KHÔNG có reboot nào sau #46 (kiểm boot_id ở cả 6 lần đọc: ~08:37Z, ~09:06Z, ~09:37Z, ~10:03Z, ~10:28Z, ~10:49Z).
- **Ghi rõ thực tế về hạn ngân sách run 152 (theo brief):** hạn ngân sách run 152 là 08:35:51Z — **ĐÃ QUA lúc đợt 153 mở** (run 153 dispatch đúng 08:35:51Z; phiên T7-153 mở ~08:37Z). Run 152 finished 08:15:41Z, tức TRƯỚC hạn 1.210 s — kết cục được xác định trước hạn, T7-153 chỉ quan sát/xác nhận sau hạn. Verdict không phụ thuộc thời điểm quan sát.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut/HB/DR), LIMITS T7-152 + aggregate đợt 152 §7/§12.3, NOTES round153-t7, prereg T2-153 (chỉ đọc chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 152 kết cục? | **`succeeded`** 08:15:41Z (event 08:15:41Z), wall danh nghĩa từ started gốc **9.590 s**, margin danh nghĩa **1.210 s** (20m10s) tới hạn 08:35:51Z | §2.1, Phụ lục A |
| Margin 1.210 s có vững không? | **KHÔNG VỮNG — caveat lớn nhất đợt này.** Bước nhảy khung giờ lùi qua #45 ≥ **1.488 s** (bảo thủ) / 1.762 s (nhánh viết-trước), VƯỢT margin 1.210 s tới ≥ 278 s. Nếu bước nhảy là thật giữa hai mốc đóng dấu thì wall thật ≥ 11.078 s > ngân sách 10.800 s | §2.2, Phụ lục D |
| #45 có viết lại run 152 không? | **KHÔNG — ứng viên điểm ÂM thứ 2 cho mẫu (m).** Run 152 đang chạy tại btime #45 (theo epoch) nhưng 0 requeue; started_at vẫn 1795158291 | §2.3 |
| #46 có viết lại run 153 không? | **CÓ — ĐIỂM DỮ LIỆU THỨ 6, DƯƠNG** (requeue btime + 48,375 s — ngoài dải 33–45 s cũ; dải dương nay 33–48,4 s) | §2.4 |
| n mẫu (m)? | **Chính thức VẪN = 5** (#38 ÂM, #39/#41/#42/#44 DƯƠNG). N ứng viên = 7 (thêm #45 ÂM + #46 DƯƠNG) — chờ parent quyết | §2.3–2.4, Phụ lục F |
| Cửa slot đợt 153? | **CỬA LÀNH HOÀN TOÀN:** HB 6/6 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới | §2.5 |
| Run 153? | **Jitter 0 s** (started gốc = scheduled_for = 08:35:51Z), **vẫn `running` lúc đóng cờ** (~10:49Z, tuổi gốc 8.002 s, còn 2.798 s tới hạn 11:35:51Z). Kết cục thuộc T7-154 | §2.6 |
| Mâu thuẫn khung giờ tại #45? | **Chỉ ghi nhận, không phân xử:** T7-152 đọc boot cũ c741f5e6 lúc 07:57:26Z, sau btime boot mới 07:32:38Z tới 1.488 s — ép bước nhảy lùi ≥ 1.488 s. T2-153 đã nhận hướng tách mốc VM/runtime (prereg (e)) | §2.2 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–152): heartbeat **44/309 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/225 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 152 — SUCCEEDED, margin danh nghĩa 1.210 s (3 lần đọc DB + events đối chiếu)

Run 152 (`fb75f843-ba83-4ecf-a83c-9c00ab528226`, sched 1795152951 = 05:35:51Z 20/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795152951 = 05:35:51Z 20/11 |
| started_at GỐC (dispatch 05:35:51.076Z) | 05:35:51Z — jitter 0 s |
| started_at nay (viết lại tại #44) | 1795158291 = 07:04:51Z |
| finished_at_utc | 1795162541 = 08:15:41Z (event `succeeded` 08:15:41Z, eid 9318) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795162536 = 08:15:36Z (5 s trước finished — cùng mẫu claimed sát finished như run 146/147/148/149/150/151) |
| Wall từ started gốc (danh nghĩa) | 1795162541 − 1795152951 = **9.590 s** (2h39m50s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795163751 = 08:35:51Z — finished TRƯỚC hạn **1.210 s** (20m10s) |
| Wall từ started viết lại | 1795162541 − 1795158291 = 4.250 s (1h10m50s) |

- Events run 152 (đầy đủ, 5 event, không thiếu): `dispatched` 05:35:51.076Z → `requeued_after_restart` 07:04:51.640Z (#44, detail "daemon startup recovery") → `dispatched` 07:04:51.695Z → `reattached_after_restart` 07:04:51.789Z (detail "execute turn already complete (model-output evidence)") → `succeeded` 08:15:41Z. **KHÔNG có event nào cho run 152 sau 08:15:41Z. KHÔNG có event requeue/reattach nào tại #45.**
- Đọc lại xác nhận 3 lần độc lập khớp nhau ở mọi trường (~08:37Z, ~09:06Z, ~09:37Z) + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon** — caveat khung giờ ở §2.2.
- **Chuỗi run vcut gần đây (margin danh nghĩa):** 149: 1.875 s; 150: 177 s; 151: 1.828 s; 152: **1.210 s** — hẹp dần sau 151 nhưng vẫn rộng hơn 150. **Mẫu (m) KHÔNG tái diễn ở 151→152 theo nghĩa hẹp:** run 151 succeeded + run 152 succeeded (không timeout) — lần thứ năm liên tiếp (148→149, 149→150, 150→151, 151→152 theo nghĩa run sau jitter 0 + run trước succeeded).
- **Hạn ngân sách đã qua lúc mở đợt:** xem đầu file — kết cục xác định trước hạn 1.210 s; T7-153 quan sát sau hạn. Không có suy luận nào trong verdict phụ thuộc thời điểm quan sát.

### 2.2 Mâu thuẫn khung giờ tại #45 — bước nhảy lùi ≥ 1.488 s, VƯỢT margin run 152 (ghi dữ kiện, KHÔNG phân xử)

- **Dữ kiện mâu thuẫn trực tiếp:** T7-152 đọc boot_id **c741f5e6 ở kiểm cuối 07:57:26Z** (NOTES round152-t7 + LIMITS 152 §2.5/§3: 7 lần đọc, lần cuối 07:57:26–07:57:47Z) — NHƯNG boot hiện tại 401fca75 có **btime 1795159958 = 07:32:38Z, sớm hơn 1.488 s (24m48s)** so với lần đọc đó. Một boot không thể vừa còn sống lúc 07:57:26Z vừa được thay bằng boot mới khởi động lúc 07:32:38Z trên cùng một khung giờ — **khung giờ đã nhảy LÙI ≥ 1.488 s qua #45** (bước nhảy = hiệu hai khung, chiều lùi vì btime boot mới sớm hơn lần đọc boot cũ).
- **Cận trên cho bước nhảy (nếu LIMITS + cờ T7-152 viết TRƯỚC reboot):** mtime file LIMITS T7-152 = 08:01:52Z (epoch 1795161712), cờ round152-t7.done = 08:02:00Z (epoch 1795161720, 0 byte). Nếu hai lần ghi này xảy ra trên boot cũ trước reboot thì bước nhảy ≥ 1795161720 − 1795159958 = **1.762 s (29m22s)**. Nội dung LIMITS 152 ("đóng cờ ~07:58Z, trước hạn cờ 08:00Z ~2 phút") khớp với viết trước reboot (tác giả tin giờ là ~07:58Z) — ủng hộ nhánh viết-trước. Nếu viết SAU reboot thì chỉ còn cận bảo thủ 1.488 s. **T7 giữ cả hai cận, không chọn nhánh.**
- **Cờ T7-152 0 byte — giả thuyết mới (ghi nhận, không kết luận):** dưới nhánh viết-trước, cờ được chạm (touch) lúc 08:02:00Z khung cũ = sát thời điểm reboot, rồi phiên bị giết trước khi ghi nội dung — giải thích được cờ 0 byte mà không cần lỗi tác giả. Dưới nhánh viết-sau, cờ 0 byte là lỗi tác giả như quyết (l) đợt 152 đã nêu. T7-153 KHÔNG phân xử; chỉ ghi rằng mtime cờ (08:02:00Z) nằm trong vùng nghi ngờ của bước nhảy. (Cờ T7-153 lần này CÓ NỘI DUNG — xem §7.)
- **Các mốc neo chéo (đều là giờ danh nghĩa, khung chưa tách):**
  - T9-152 đóng cờ 07:54:47Z (LIMITS mtime 07:54:08Z) — trước kiểm cuối T7-152, cùng boot cũ theo hồ sơ; không có mốc nào của T9 sau 07:54:47Z.
  - T10-152: GAP mtime 08:13:50Z, cờ 08:14:28Z, aggregate mtime 08:18:19Z — đều SAU btime 07:32:38Z danh nghĩa; T10 KHÔNG nhắc #45/boot mới trong GAP §81 (chỉ ghi "T10 đóng cờ ~08:2xZ"). Nếu T10 viết sau reboot trên boot mới thì các mốc này là khung mới; nếu viết trước reboot thì bước nhảy còn lớn hơn 1.762 s. T7 không suy ra thêm.
  - T2-153 prereg (08:40–08:42Z, đã đọc): xác nhận boot 401fca75/btime 07:32:38Z; probe #72 ok=2 fail=0 boot 401fca75; prereg (e) nêu "cần tách mốc đồng hồ VM khỏi mốc runtime (như #117?)" — T2 đã nhận hướng này; giao T2 chứng nhận. Lưu ý: prereg T2 gọi reboot 07:32:38Z là "#44" trong cửa sổ probe #71→#72 (T2 đếm theo probe, bỏ qua c741f5e6) — T7 giữ số #45 theo đếm reboot toàn cục (đợt 152 đã chốt #43/#44), T10 phân xử nếu cần.
  - `timedatectl` không chạy được trong cell (Failed to connect to bus) — không có trạng thái NTP để đối chiếu. `journalctl --list-boots`: CHỈ 1 boot (401fca75, entry đầu 07:32:49Z) — journal không giữ boot cũ.
- **Hệ quả cho wall/margin run 152 (QUAN TRỌNG, ghi rõ điều kiện):** wall danh nghĩa 9.590 s / margin danh nghĩa 1.210 s dùng started (khung cũ) và finished (khung mới). NẾU bước nhảy là nhảy lùi thật của đồng hồ daemon giữa hai mốc đóng dấu đó thì wall thật ≈ danh nghĩa + bước nhảy ≥ 9.590 + 1.488 = **11.078 s > ngân sách 10.800 s** (vượt ≥ 278 s) — tức verdict SUCCEEDED theo đồng hồ daemon sẽ KHÔNG vững theo giờ thực, khác hẳn run 151 (margin 1.828 s > mọi bước nhảy đã biết ≤ 20 s). NẾU độ nhanh của đồng hồ cũ chỉ phát triển muộn (sau khi run 152 dispatch) thì wall thật ≈ danh nghĩa và verdict đứng. **T7 KHÔNG chọn nhánh nào:** verdict ghi theo hồ sơ daemon là SUCCEEDED (timed_out=false, event succeeded 08:15:41Z); độ vững của verdict trước bước nhảy giao T2 chứng nhận + parent quyết. Không được trích margin 1.210 s như "còn dư an toàn" khi chưa tách khung.
- **So sánh với tranh chấp clock cũ:** các nghịch lý trước đây là GIÂY (≥ +15 s / 18 s tại #42, ≥ +20 s tại #41, e2 ∈ [313, 340] s) — bước nhảy qua #45 (≥ 1.488 s) lớn hơn hẳn một bậc. Đây là lần đầu một bước nhảy khung giờ VƯỢT margin của chính run đang xét. T7 không mở điều tra mới; chỉ ghi nhận để T2/parent xử lý.

### 2.3 Reboot #45 trước phiên — run 152 ĐANG CHẠY nhưng KHÔNG bị viết lại (ứng viên điểm ÂM thứ 2 cho mẫu (m))

- **Reboot #45: boot c741f5e6 → 401fca75-bece-45b6-88fa-b12f602d6390, btime 1795159958 = 07:32:38Z.** Uptime 1:04–1:05 lúc kiểm lần 1 (~08:37–08:38Z) → boot ~07:33Z ✓ khớp btime. `last reboot` 07:32 still running; wtmp bắt đầu 07:32:49Z = btime + 11 s. Xảy ra GIỮA T7-152 đóng cờ và run 153 dispatch (08:35:51Z) — tức TRƯỚC phiên T7-153.
- **Điều kiện test THỎA theo epoch:** tại btime #45 run 152 đang chạy — started gốc 1795152951 < btime 1795159958 < finished 1795162541 (epoch). Run 152 finished SAU reboot 2.583 s danh nghĩa sau btime (1795162541 − 1795159958) và 1.095 s danh nghĩa sau kiểm cuối T7-152 (08:15:41Z − 07:57:26Z).
- **Recovery KHÔNG requeue run 152 tại #45:** 0 event `requeued_after_restart` / `reattached_after_restart` cho run 152 sau eid 9302 (#44); started_at vẫn 1795158291 qua 3 lần đọc độc lập; claimed_at vẫn 1795162536 — worker claimed run lúc 08:15:36Z (khung mới), 5 s trước finished, KHÔNG qua requeue. Daemon rõ ràng đã khởi động lại sau #45 (event đầu tiên sau btime: feed-pulse-14 dispatch + reconciled 07:41:54Z = btime + 556 s; các event reconciled/dispatched sau đó đều đặn) — nhưng không requeue run đang chạy.
- **Đây là dạng #38 (run 148 không bị viết lại):** điều kiện khiến recovery bỏ qua một run đang chạy VẪN MỞ (dữ kiện mở duy nhất của (m)). **T7 ghi nhận là ỨNG VIÊN điểm ÂM thứ 2; n CHÍNH THỨC VẪN = 5 (#38 ÂM, #39/#41/#42/#44 DƯƠNG) cho tới khi parent quyết** — điều tra (m) ĐÃ ĐÓNG, T7 không tự tăng n, không kết luận lại cơ chế.
- **Khoảng im lặng danh nghĩa quanh #45:** event cuối trước btime: HB dispatch 07:15:34Z (slot 07:20:50Z); event đầu sau btime: feed-pulse-14 dispatch 07:41:54Z — gap danh nghĩa 1.580 s, trong đó daemon-down danh nghĩa (btime → first event) 556 s. So sánh: #43 gap im lặng 1.818 s / first-event btime +884 s; #40 gap 1.863 s / +210 s; #44 gap 291 s / requeue +40,640 s. **Lưu ý:** gap 1.580 s này TRỘN HAI KHUNG (mốc đầu khung cũ, mốc sau khung mới) nên số danh nghĩa không phải độ dài thật — độ dài thật = 1.580 s + bước nhảy (nếu bước nhảy lùi thật) ≈ 3.068–3.342 s. Chỉ ghi nhận, không kết luận "im lặng dài" khi chưa tách khung. KHÔNG có slot HB/DR nào rơi vào gap (HB 07:20:50Z dispatch 07:15:34Z trước btime; HB 07:50:50Z dispatch 07:45:34Z sau btime — cả hai đều CÓ).
- **Không có sleep nào của T7-153 bị giết bởi #45** (phiên mở sau #45; sleep đầu tiên bắt đầu sau khi đã ở boot mới).

### 2.4 Reboot #46 giữa phiên — run 153 bị viết lại, ĐIỂM DỮ LIỆU THỨ 6, DƯƠNG

- **Reboot #46: boot 401fca75 → 1450ac80-d1d2-46b4-a87c-c209a58c4798, btime 1795165489 = 09:04:49Z.** Uptime 0 phút lúc kiểm 09:05:44Z; wtmp bắt đầu 09:05:05Z = btime + 16 s. Sleep 1.500 s của T7 (bắt đầu ~08:49:2xZ) **BỊ GIẾT bằng SIGTERM sau ~956 s** (~09:05:2xZ, ~30 s sau btime — ước lượng từ duration exec, không đo trực tiếp; chậm hơn #44 giết sleep T7-152 sau ~6 s) — cùng hiện tượng #39/#42/#44. Phiên T7-153 vẫn tiếp tục được (runtime báo kết thúc lệnh nền, T7 đọc lại DB ngay).
- **Run 153 (4d4d4f57-c8cd-408e-ab11-854460c46b67, run của chính đợt này): started_at ĐÃ BỊ VIẾT LẠI tại #46.** started_at gốc 1795163751 = 08:35:51Z (đọc ở kiểm lần 1 ~08:37Z, lần 2 ~09:06Z đã đổi); sau #46 đọc được 1795165537 = 09:05:37Z, không đổi ở 4 lần đọc sau (~09:37Z, ~10:03Z, ~10:28Z, ~10:49Z). Offset viết lại: 1795165537 − 1795163751 = 1.786 s. claimed_at VẪN 1795163751 (gốc — chỉ started_at bị viết lại, claimed_at không đổi, giống mẫu #41/#42/#44).
- Events run 153 (đầy đủ): `dispatched` 08:35:51Z → `requeued_after_restart` **09:05:37.375Z** (detail "daemon startup recovery") → `dispatched` 09:05:37.454Z → `reattached_after_restart` 09:05:37.556Z (detail "execute turn already complete (model-output evidence)" — cùng mẫu #41/#42/#44). Requeue = **btime + 48,375 s — NGOÀI dải 33–45 s của cả 4 lần requeue dương trước** (#39 +40,799 s; #41 +44,994 s; #42 +33,236 s; #44 +40,640 s — **dải dương nay mở rộng thành 33–48,4 s**). Số giây chính xác lấy từ created_at timestamptz trực tiếp, không qua extract-epoch làm tròn.
- **Điều kiện test THỎA:** run 153 ĐANG CHẠY tại btime #46 (started gốc 08:35:51Z; vẫn `running` ở kiểm lần 1 lúc ~08:49Z, tuổi gốc 1.738 s lúc btime) và daemon ĐÃ requeue.
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng): #38 ÂM, #39/#41/#42/#44/#46 DƯƠNG, #45 ÂM (ứng viên, xem §2.3) → n ứng viên = 7 (5 dương + 2 âm). Số chính thức vẫn 5 cho tới khi parent quyết.** Dữ kiện mở duy nhất (điều kiện khiến recovery bỏ qua run 148 tại #38 — nay có thêm #45 cùng dạng) VẪN MỞ, chỉ ghi nhận để theo dõi.
- **KHÔNG có khoảng im lặng dài tại #46 (giống #44, khác #43/#45):** daemon sống tới sát reboot — feed-pulse-15 08:41:54Z, HB 08:45:34Z, DR 09:00:00Z (event cuối trước #46: DR succeeded 09:00:00.208Z); gap DR-succeeded → requeue 09:05:37.375Z = 337,375 s, trong đó daemon-down thật chỉ 48,375 s (btime → requeue), còn 289 s trước btime là im lặng bình thường (không có slot đến hạn). Event đầu tiên sau #46 là requeue (btime + 48,375 s) — recovery nhanh, cùng họ mốc ~40 s. Chỉ có DUY NHẤT 1 event `requeued_after_restart` trong cửa — cho run 153.
- **KHÔNG có mâu thuẫn khung giờ mới tại #46 (khác #45):** kiểm lần 1 cuối ~08:49:22Z (boot 401fca75) TRƯỚC btime #46 09:04:49Z — thứ tự thời gian xuôi, không ép bước nhảy. Requeue +48,375 s hơi ngoài dải cũ nhưng chưa đủ để kết luận bước nhảy (n=5, phương sai chưa biết) — T2 chứng nhận nếu cần.

### 2.5 Slot HB/DR trong cửa 07:57:47Z → 10:50Z 20/11 — HB 6/6 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h52' (6 lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:20:50 (08:20:50Z) | 072bb648 | 08:15:34 | −316 s | CÓ |
| 15:50:50 (08:50:50Z) | f1dae020 | 08:45:34 | −316 s | CÓ |
| 16:20:50 (09:20:50Z) | 40e7a4e9 | 09:15:34 | −316 s | CÓ |
| 16:50:50 (09:50:50Z) | 1d8766e2 | 09:45:34 | −316 s | CÓ |
| 17:20:50 (10:20:50Z) | 16fd1db3 | 10:15:34 | −316 s | CÓ |
| 17:50:50 (10:50:50Z) | a22ac129 | 10:45:34 | −316 s | CÓ |

- 6/6 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (sau khi tái hiện ở đợt 152).
- Slot HB 07:50:50Z (dispatch 07:45:34Z) đã đếm ở đợt 152 — T7-153 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:00 (08:00Z) | 686bbbbb | 08:00:00 | 0 s | CÓ |
| 16:00 (09:00Z) | d28c85d3 | 09:00:00 | 0 s | CÓ |
| 17:00 (10:00Z) | 9fd30dcc | 10:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 11:00Z chưa dispatch lúc đóng cờ (11:00:00Z sau kiểm cuối) — thuộc cửa T7-154.

### 2.6 Run 153 — jitter 0 s, vẫn running lúc đóng cờ

Run 153 (`4d4d4f57-c8cd-408e-ab11-854460c46b67`, sched 1795163751 = 08:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795163751 | 08:35:51Z 20/11 |
| dispatched (event) | — | 08:35:51Z |
| started_at GỐC | 1795163751 | 08:35:51Z — **jitter 0 s** |
| started_at nay (viết lại tại #46) | 1795165537 | 09:05:37Z (= btime #46 + 48 s) |
| worker_claimed_at | 1795163751 | 08:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795174551 | 11:35:51Z 20/11 |

- 6 lần đọc DB trong phiên (~08:37Z, ~09:06Z, ~09:37Z, ~10:03Z, ~10:28Z, ~10:49Z): status `running` ở cả 6 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #46, khớp event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` + `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #46 — không có event nào khác.
- Tuổi run từ gốc: 1.738 s lúc btime #46 (09:04:49Z), 3.682 s lúc kiểm lần 3 (09:37:13Z), 5.258 s lúc kiểm lần 4 (10:03:29Z), 6.773 s lúc kiểm lần 5 (10:28:44Z), **8.002 s (2h13m22s) lúc kiểm cuối (10:49:13Z)** — còn 2.798 s (46m38s) tới hạn ngân sách 11:35:51Z. **Kết cục thuộc T7-154.**
- **Mẫu (m) KHÔNG tái diễn ở 152→153 theo nghĩa run sau jitter 0:** run 152 succeeded (không timeout) + run 153 jitter 0 s — lần thứ sáu liên tiếp. Lưu ý: run 153 ĐÃ bị viết lại started_at tại #46 (như run 149 tại #39, run 150 tại #41, run 151 tại #42, run 152 tại #44) — viết lại không đồng nghĩa timeout; timeout chỉ xảy ra khi wall từ started GỐC vượt ngân sách.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 152/153 đầy đủ; events lọc theo run_id + theo cửa giờ). Job IDs đã xác minh: heartbeat (interval@30m) / deterministic-doctor (interval@1h) / vcut-build-loop (interval@3h, Asia/Saigon). Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này đã bắt được 1 phép tính nháp sai ở bản nháp NOTES — xem §6, F-153-T7-1). Số giây requeue #46 lấy từ `created_at` timestamptz trực tiếp (09:05:37.375Z), không qua extract-epoch làm tròn ±1 s.
4. Cửa kiểm đợt này ~2h52' (07:57:47Z → 10:50Z 20/11), đủ 6 slot HB + 3 slot DR + run vcut 152 (kết cục) và 153 (theo dõi). Sáu lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa. Run 152 được đọc lại xác nhận 2 lần sau lần đầu (3 lần đọc độc lập khớp nhau + events đối chiếu).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 07:50:50Z + DR 07:00Z thuộc cửa 152 theo quy ước đứng (T7-152 đã đếm); slot DR 08:00Z + HB 08:20:50Z thuộc cửa 153 (sau kiểm cuối T7-152 lúc 07:57:47Z). DR 11:00Z thuộc cửa T7-154.
6. **1 sleep bị giết trong phiên này** (sleep 1.500 s, SIGTERM sau ~956 s, do reboot #46 — cùng hiện tượng #39/#42/#44); 4 sleep còn lại (1.800 s + 1.500 s + 1.500 s + 1.200 s) hoàn thành bình thường. Boot đổi 401fca75 → 1450ac80 đúng 1 lần trong phiên (tại #46); #45 xảy ra trước phiên.
7. T7 đóng cờ ~10:52Z, trước hạn cờ 11:00Z ~8 phút (hạn cứng toàn đợt 11:30Z còn ~38'). Ghi rõ, không giấu. Run 153 vẫn running lúc đóng cờ — kết cục thuộc T7-154 (hạn ngân sách 11:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix153.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 152, cùng phương pháp)

- Heartbeat: 44/303 → **44/309 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 17:50:50 +07). Kiểm toán cửa sổ: 303 + 6 slot mới = 309 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/222 → **49/225 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 17:00 +07). Kiểm toán: 222 + 3 = 225 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/309 = 14,2% (giảm từ 14,5% — 0 thiếu mới); DR 49/225 = 21,8% (giảm từ 22,1% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 152: SUCCEEDED theo hồ sơ daemon (wall danh nghĩa 9.590 s, margin danh nghĩa 1.210 s)** — NHƯNG margin KHÔNG VỮNG trước bước nhảy khung giờ lùi ≥ 1.488 s qua #45 (vượt margin ≥ 278 s; wall thật có thể ≥ 11.078 s > ngân sách). **Cần T2 chứng nhận clock tại #45 + parent quyết** xem verdict đứng hay phải hiệu chỉnh. Không trích margin 1.210 s như "còn dư an toàn" khi chưa tách khung.
2. **Mâu thuẫn khung giờ tại #45 (mới, lớn nhất chuỗi):** T7-152 đọc boot cũ lúc 07:57:26Z, sau btime boot mới 07:32:38Z tới 1.488 s (1.762 s nếu LIMITS/cờ viết trước reboot). Lớn hơn hẳn mọi nghịch lý trước (15–20 s). T2-153 đã nhận hướng tách mốc VM/runtime (prereg (e)). T7 không phân xử, không đo lại.
3. **Điểm dữ liệu thứ 6 cho mẫu (m): DƯƠNG** — #46 viết lại run 153 (requeue btime + 48,375 s, ngoài dải 33–45 s cũ → dải mới 33–48,4 s). **#45 là ứng viên điểm ÂM thứ 2** (run 152 đang chạy nhưng 0 requeue — cùng dạng #38). **n chính thức VẪN = 5; n ứng viên = 7 — chờ parent quyết có tính #45/#46 vào n không.** Điều tra (m) ĐÃ ĐÓNG — T7 chỉ ghi nhận, KHÔNG mở điều tra mới.
4. **Cửa slot LÀNH HOÀN TOÀN (HB 6/6, DR 3/3, 0 muộn, 0 thiếu)** — lần đầu lành hoàn toàn kể từ đợt 151 (đợt 152 không lành: 1 muộn +891 s + im lặng 1.818 s). Hai reboot trong/quanh đợt (#45 trước phiên, #46 giữa phiên) KHÔNG làm mất slot nào.
5. **Run 153 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.002 s, còn 2.798 s tới hạn 11:35:51Z) — kết cục thuộc T7-154. Không đổi số đếm đợt 153.
6. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). Mù #74?/#75?/#76? + gap #42/#43 + chứng nhận clock #45: giao T2-153/154 (T7 không chứng nhận mù).

## 6. Sai số của chính T7

- **F-153-T7-1 — Tính nháp sai tuổi run 153 ở bản nháp NOTES kiểm lần 3 (không vào LIMITS):** bản nháp ghi tuổi gốc 2.482 s / viết lại 696 s / còn 8.318 s — SAI, do dùng epoch 1795166233 (= 09:17:13Z, sớm 20 phút) thay vì epoch lúc kiểm 1795167433 (= 09:37:13Z). Số đúng: 3.682 s / 1.896 s / 7.118 s (kiểm lại bằng `date -u +%s` trực tiếp: 09:37:56Z = 1795167476 → tuổi gốc 3.725 s, viết lại 1.939 s, còn 7.075 s — khớp). Số sai đã SỬA trong NOTES trước khi ghi LIMITS; KHÔNG đi vào LIMITS này. Cùng họ sai số nhẩm epoch như F-147-T7-1/F-148-T7-1/F-149-T7-3/F-150-T7-1/F-151-T7-1/F-152-T7-1 — `date -u +%s` tại thời điểm kiểm là chốt chặn bắt được (lần thứ 7 liên tiếp).
- **F-153-T7-0 — Không có sai số nào khác trong đợt này:** 6 lần đọc DB khớp nhau ở mọi slot trùng; mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×3 slot, run 152 wall gốc 9.590 s / margin 1.210 s / wall viết lại 4.250 s, run 153 jitter 0 s, requeue #46 btime + 48,375 s (created_at trực tiếp), offset viết lại 1.786 s, gap danh nghĩa #45 1.580 s / first-event btime + 556 s, gap #46 337,375 s, bước nhảy #45 ≥ 1.488 s / 1.762 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 6 lần đọc (401fca75 → 1450ac80 đúng 1 lần, tại #46) và khớp brief về reboot #45; ở cả 6 lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 152 có 3 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 08:15:41Z, eid 9318), không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round153-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round153-t7/NOTES.md` + `appendix153.py` + `appendix153.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round153-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix153.py` từ epoch thô — xem file `appendix153.txt` trong round153-t7)

### Phu luc A — Run 152 (ket cuc, doc 3 lan doc lap khop nhau)
- sched 1795152951 = 05:35:51Z; started GOC 1795152951 = 05:35:51Z (jitter 0 s)
- started nay (viet lai #44) 1795158291 = 07:04:51Z; claimed 1795162536 = 08:15:36Z (finished - 5 s)
- finished 1795162541 = 08:15:41Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795162541 - 1795152951 = 9590 s (2h39m50s)
- han ngan sach: 1795163751 = 08:35:51Z; margin: 1795163751 - 1795162541 = 1210 s (0h20m10s)
- wall tu started viet lai: 1795162541 - 1795158291 = 4250 s (1h10m50s)
- events: dispatched 05:35:51Z -> requeued 07:04:51.640Z -> dispatched -> reattached -> succeeded 08:15:41Z; 0 event sau succeeded; 0 requeue tai #45

### Phu luc B — Run 153 (theo doi, van running luc dong co)
- sched 1795163751 = 08:35:51Z; started GOC 1795163751 = 08:35:51Z (jitter 0 s)
- started nay (viet lai #46) 1795165537 = 09:05:37Z; claimed 1795163751 = 08:35:51Z (khong doi)
- offset viet lai: 1795165537 - 1795163751 = 1786 s
- han ngan sach: 1795174551 = 11:35:51Z; ket cuc thuoc T7-154

### Phu luc C — Reboot #45 / #46
- #44: btime 1795158251 = 07:04:11Z; requeue btime + 40.640 s
- #45: btime 1795159958 = 07:32:38Z; first event sau btime: feed-pulse-14 07:41:54Z = btime + 556 s
- #45: gap danh nghia HB 07:15:34Z -> pulse-14 07:41:54Z: 1580 s (TRON 2 KHUNG — xem LIMITS §2.2)
- #46: btime 1795165489 = 09:04:49Z; requeue btime + 48.375 s
- #46: event cuoi truoc btime DR 09:00:00Z; gap DR -> requeue: 337.375 s (daemon-down 48.375 s)
- #45 KHONG viet lai run 152 (started_at van 1795158291); #46 CO viet lai run 153 (started_at 1795163751 -> 1795165537)

### Phu luc D — Buoc nhay khung gio qua #45 (mau thuan T7-152 vs btime)
- T7-152 kiem cuoi 1795161446 = 07:57:26Z boot c741f5e6; btime45 1795159958 = 07:32:38Z
- buoc nhay (can bao thu): 1795161446 - 1795159958 = 1488 s (0h24m48s)
- buoc nhay (neu LIMITS/co viet TRUOC reboot): 1795161720 - 1795159958 = 1762 s (0h29m22s) (mtime co 08:02:00Z, LIMITS 08:01:52Z)
- margin danh nghia run 152: 1210 s (0h20m10s); buoc nhay vuot margin: bao thu +278 s; nhan viet-truoc +552 s
- wall that duoi (neu buoc nhay lui that giua 2 moc dong dau): >= 9590 + 1488 = 11078 s (3h04m38s) > ngan sach 10.800 s (vuot >= 278 s)

### Phu luc E — Slot HB/DR cua T7-153
- HB sched 08:20:50Z run 072bb648: started 08:15:34Z, jitter -316 s, succeeded
- HB sched 08:50:50Z run f1dae020: started 08:45:34Z, jitter -316 s, succeeded
- HB sched 09:20:50Z run 40e7a4e9: started 09:15:34Z, jitter -316 s, succeeded
- HB sched 09:50:50Z run 1d8766e2: started 09:45:34Z, jitter -316 s, succeeded
- HB sched 10:20:50Z run 16fd1db3: started 10:15:34Z, jitter -316 s, succeeded
- HB sched 10:50:50Z run a22ac129: started 10:45:34Z, jitter -316 s, succeeded
- DR sched 08:00:00Z run 686bbbbb: started 08:00:00Z, jitter +0 s, succeeded
- DR sched 09:00:00Z run d28c85d3: started 09:00:00Z, jitter +0 s, succeeded
- DR sched 10:00:00Z run 9fd30dcc: started 10:00:00Z, jitter +0 s, succeeded
- Tong cua: HB 6/6 (0 thieu, 0 muon), DR 3/3 (0 thieu)
- Luy ke: HB 44/303 -> 44/309 (so thieu +0); DR 49/222 -> 49/225 (so thieu +0)
- Ti le thieu: HB 14.2% (tu 14,5%); DR 21.8% (tu 22,1%)

### Phu luc F — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #38 AM (run 148 khong viet lai); #39 DUONG (+40,799 s); #41 DUONG (+44,994 s); #42 DUONG (+33,236 s)
- #44 DUONG (+40.640 s); #45 AM ung vien (run 152 dang chay, 0 requeue); #46 DUONG (+48.375 s)
- Dai requeue duong: 33–45 s cu -> 33–48,4 s moi (sau #46)
- n CHINH THUC van 5 (#38 AM, #39/#41/#42/#44 DUONG); n ung vien = 7 (them #45 AM + #46 DUONG) — cho parent quyet
