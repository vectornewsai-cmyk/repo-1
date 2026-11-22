# PHASE9 ROUND154 T7 — RUN 153 SUCCEEDED (wall danh nghĩa 9.609 s, margin danh nghĩa 1.191 s) + VIẾT LẠI LẦN 2 TẠI #47 (điểm (m) thứ 8, DƯƠNG, btime + 33,566 s) + REBOOT #48 TRƯỚC PHIÊN (không phải điểm (m)) + REBOOT #49 GIỮA PHIÊN VIẾT LẠI RUN 154 (điểm (m) thứ 9, DƯƠNG, btime + 42,981 s) + SIẾT T45_thực: VERDICT RUN 152 ĐỨNG VỮNG + CỬA SLOT LÀNH HOÀN TOÀN

- **Luồng:** T7 đợt 154 (lượt cron 18:35 +07 20/11/2026 = 11:35:51Z 20/11). Nhiệm vụ theo brief T7-154: (1) kết cục run 153 — có viết lại lần 2 tại #47 không (quyết (n) đợt 153); (2) siết T45_thực (quyết parent (c)/(g) đợt 153) — kết luận rõ verdict run 152 (provisional) đứng hay phải xem lại; (3) theo dõi run 154 + slot HB/DR + reboot mới; (4) LIMITS trung thực, phụ lục bằng script. Điều tra mẫu (m) đã ĐÓNG theo quyết (d) đợt 149 + (j) đợt 151 + (f) đợt 153 — T7 CHỈ GHI NHẬN các điểm dữ liệu mới, KHÔNG mở điều tra mới, không kết luận lại cơ chế. Chứng nhận clock thuộc T2-154 (T7 phối hợp bằng bằng chứng scheduler DB + phương pháp mốc merged, xem §2.2).
- **Boot trong phiên:** mở phiên là **2c0a7985-b750-4166-b177-21d2ef7e1dc7** (btime /proc/stat 1795173965 = 11:26:05Z — **reboot #48**, xảy ra TRƯỚC phiên, giữa T10-153 đóng sổ ~11:15Z và run 154 dispatch 11:35:51Z; T2-154 prereg xác nhận độc lập cùng boot/btime + F117? ≈ 0/+1 s); **reboot #49 GIỮA PHIÊN** 13:05:12Z → boot mới **12fc68a3-10f4-4459-908f-b0a47615afae** (btime 1795179912 = 13:05:12Z), KHÔNG có reboot nào sau #49 (kiểm boot_id ở cả 7 lần đọc: ~11:38Z, ~11:41Z, ~12:12Z, ~12:42Z, ~13:06Z, ~13:32Z, ~13:46Z).
- **Ghi rõ thực tế về hạn ngân sách run 153 (theo brief):** hạn ngân sách run 153 là 11:35:51Z — **ĐÃ QUA lúc đợt 154 mở** (run 154 dispatch đúng 11:35:51Z; phiên T7-154 mở ~11:37Z). Run 153 finished 11:16:00Z, tức TRƯỚC hạn 1.191 s — kết cục được xác định trước hạn, T7-154 chỉ quan sát/xác nhận sau hạn. Verdict không phụ thuộc thời điểm quan sát.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut/HB/DR), LIMITS T7-153 + aggregate đợt 153 §7/§12.1 (c)/(f)/(g)/§12.3 (c)/(f)/(g)/(n), NOTES round154-t7, prereg T2-154 (chỉ đọc chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 153 kết cục? | **`succeeded`** 11:16:00Z (event 11:16:00.983Z), wall danh nghĩa từ started gốc **9.609 s**, margin danh nghĩa **1.191 s** (19m51s) tới hạn 11:35:51Z | §2.1, Phụ lục A/B |
| #47 có viết lại run 153 lần 2 không? | **CÓ — ĐIỂM DỮ LIỆU THỨ 8, DƯƠNG** (requeue btime + 33,566 s — trong dải 33–48,4 s, không đổi dải). Quyết (n) đợt 153: ĐÃ KIỂM, trả lời CÓ | §2.1, §2.4 |
| #48 có viết lại run nào không? | **KHÔNG — không phải điểm dữ liệu (m).** Không có run vcut nào đang chạy tại btime #48 (run 153 finished 11:16:00Z; run 154 dispatch 11:35:51Z) | §2.4 |
| #49 có viết lại run 154 không? | **CÓ — ĐIỂM DỮ LIỆU THỨ 9, DƯƠNG** (requeue btime + 42,981 s — trong dải 33–48,4 s) | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) VẪN = 7** theo quyết (f) đợt 153. N ứng viên = **9** (thêm #47 DƯƠNG + #49 DƯƠNG) — chờ parent quyết | §2.4, Phụ lục F |
| T45_thực siết được bao nhiêu? | **Pin trực tiếp THẤT BẠI** (không có requeue run 152 tại #45 — xác nhận lần 2); cửa sổ T2 (08:16:07Z, 08:35:51Z] KHÔNG thu hẹp. **Nhưng đối chiếu daemon-epoch vs DB created_at + vị trí T45_thực sau finished 152 cho thấy verdict run 152 ĐỨNG VỮNG** — xem §2.2 | §2.2, Phụ lục D |
| Verdict run 152 (provisional)? | **ĐỨNG VỮNG — đề xuất parent GỠ provisional.** Wall thật ≤ danh nghĩa 9.590 s trong cả 3 kịch bản (S1/S2/S3); kịch bản wall dài duy nhất mâu thuẫn cận dưới T45_thực của T2 + đối chiếu 5 s claimed→finished | §2.2 |
| Cửa slot đợt 154? | **CỬA LÀNH HOÀN TOÀN:** HB 6/6 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới — lần thứ hai liên tiếp lành hoàn toàn | §2.5 |
| Run 154? | **Jitter 0 s** (started gốc = scheduled_for = 11:35:51Z), **vẫn `running` lúc đóng cờ** (~13:46Z, tuổi gốc 7.797 s, còn 3.003 s tới hạn 14:35:51Z). Kết cục thuộc T7-155 | §2.6 |
| Mâu thuẫn khung giờ mới tại #48/#49? | **KHÔNG có từ DB.** #48: mốc cuối cd7dcd88 11:17:10Z trước btime 11:26:05Z 535 s, thứ tự xuôi. #49: event cuối trước btime DR 13:00:00Z, thứ tự xuôi; đồng hồ boot mới chính xác (F117? ≈ 0/+1 s, T2-154) | §2.3–2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–153): heartbeat **44/315 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/228 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 153 — SUCCEEDED, margin danh nghĩa 1.191 s + viết lại lần 2 tại #47 (7 lần đọc DB khớp nhau)

Run 153 (`4d4d4f57-c8cd-408e-ab11-854460c46b67`, sched 1795163751 = 08:35:51Z 20/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795163751 = 08:35:51Z 20/11 |
| started_at GỐC (dispatch 08:35:51.080Z) | 08:35:51Z — jitter 0 s |
| started_at sau viết lại #46 | 1795165537 = 09:05:37Z |
| started_at NAY (viết lại lần 2 tại #47) | 1795172833 = 11:07:13Z |
| finished_at_utc | 1795173360 = 11:16:00Z (event `succeeded` 11:16:00.983Z, eid 9363) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795173356 = 11:15:56Z (4 s trước finished — cùng mẫu claimed sát finished như run 146/147/148/149/150/151/152) |
| Wall từ started gốc (danh nghĩa) | 1795173360 − 1795163751 = **9.609 s** (2h40m09s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795174551 = 11:35:51Z — finished TRƯỚC hạn **1.191 s** (19m51s) |
| Wall từ started viết lại lần 2 | 1795173360 − 1795172833 = 527 s (8m47s) |
| Wall từ started viết lại lần 1 | 1795173360 − 1795165537 = 7.823 s (2h10m23s) |

- Events run 153 (đầy đủ, 8 event, không thiếu): `dispatched` 08:35:51.080Z → `requeued_after_restart` 09:05:37.375Z (#46, "daemon startup recovery") → `dispatched` 09:05:37.454Z → `reattached_after_restart` 09:05:37.556Z → **`requeued_after_restart` 11:07:13.566Z (#47, "daemon startup recovery")** → `dispatched` 11:07:13.748Z → `reattached_after_restart` 11:07:13.836Z (detail "execute turn already complete (model-output evidence)" — cùng mẫu #41/#42/#44/#46) → `succeeded` 11:16:00.983Z. **KHÔNG có event nào cho run 153 sau 11:16:00Z. KHÔNG có event requeue/reattach nào tại #48.**
- Đọc lại xác nhận 7 lần khớp nhau ở mọi trường (~11:38Z, ~11:41Z, ~12:12Z, ~12:42Z, ~13:06Z, ~13:32Z, ~13:46Z) + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin danh nghĩa):** 149: 1.875 s; 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: **1.191 s** — hẹp dần sau 151 nhưng vẫn rộng hơn 150. **Mẫu (m) KHÔNG tái diễn ở 153→154 theo nghĩa run sau jitter 0:** run 153 succeeded (không timeout) + run 154 jitter 0 s — lần thứ bảy liên tiếp. Lưu ý: run 153 là run ĐẦU TIÊN bị viết lại started_at HAI lần (#46 + #47) — viết lại không đồng nghĩa timeout; timeout chỉ xảy ra khi wall từ started GỐC vượt ngân sách.
- **Hạn ngân sách đã qua lúc mở đợt:** xem đầu file — kết cục xác định trước hạn 1.191 s; T7-154 quan sát sau hạn. Không có suy luận nào trong verdict phụ thuộc thời điểm quan sát.

### 2.2 Siết T45_thực (quyết parent (c)/(g) đợt 153) — pin trực tiếp thất bại, nhưng verdict run 152 ĐỨNG VỮNG

#### 2.2.1 Pin trực tiếp: KHÔNG có requeue run 152 tại #45 (xác nhận lần 2)

- Events run 152 vẫn đúng 5 event (dispatched 05:35:51.076Z → requeued #44 07:04:51.640Z → dispatched → reattached → succeeded 08:15:41.139Z, eid 9318) — **0 event `requeued_after_restart` / `reattached_after_restart` cho run 152 sau eid 9302 (#44)**, 0 event sau succeeded. Started_at vẫn 1795158291, claimed_at vẫn 1795162536 qua mọi lần đọc đợt này.
- Giả thuyết pin của quyết (c) — "requeue run 152 tại #45, nếu có, sẽ ghim giờ thực trong (08:16:07Z, 08:35:51Z]" — **KHÔNG xảy ra, nên không ghim được bằng cách đó**. Cửa sổ T45_thực của T2-153, (08:16:07Z, 08:35:51Z], **KHÔNG thu hẹp được bằng scheduler DB**: truy vấn toàn bộ events 07:30–08:40Z (15 event, eid 9306–9320) cho thấy **0 event nào trong (08:16:07Z, 08:35:51Z) trừ biên 08:35:51Z** (reconciled + run 153 dispatched). Khoảng im lặng danh nghĩa duy nhất quanh cửa sổ là 08:15:41Z (run 152 succeeded) → 08:35:51Z (run 153 dispatched) = 1.210 s — đúng bằng margin run 152 (chỉ là trùng số: không có slot nào tới hạn trong khoảng đó, không phải downtime; xem §2.2.3).
- Hệ quả cho T2-154: gap #45 giữ nguyên khoảng ứng viên RỘNG [4.183, 5.917] s; T7 không thu hẹp được gì thêm cho T2. Phương pháp mốc merged (quyết (c)) thuộc T2-154 — T7 cung cấp mốc scheduler dưới đây (§2.2.2–2.2.3) để T2 dùng nếu muốn.

#### 2.2.2 Đối chiếu daemon-epoch vs DB created_at: đồng hồ daemon ≈ host tại mọi checkpoint, kể cả lúc run 152 finished

Tiền đề (ghi rõ điều kiện): `scheduler.events.created_at` dùng `now()` của DB; DB scheduler **không chạy trong cell** — bằng chứng hỗ trợ: `ps` trong cell không có process postgres/postmaster nào; `ss -tlnp` không hiện listener nào; DB giữ toàn bộ lịch sử qua 100+ reboot trong khi journal cell volatile chỉ giữ 1 boot. Đối chiếu live: `SELECT now()` = 12:12:18.059Z khớp giờ cell (sleep kết thúc 12:12:08Z, 3 lệnh DB sau đó ~10 s) trong ~1 s; F117? (T2-154) ≈ 0/+1 s ⇒ cell ≈ host ⇒ DB now() ≈ khung host Ở HIỆN TẠI. **Caveat:** đối chiếu live chỉ chứng minh cho hiện tại; nếu DB từng nằm trong cell ở kỷ nguyên #45 thì đối chiếu dưới đây mất lực — T7 ghi rõ, T2-154 là cơ quan chứng nhận clock.

Dưới tiền đề created_at = khung host, các mốc sau đây đều khớp nhau trong <1 s:

| Checkpoint | Daemon epoch | DB created_at | Chênh |
|---|---|---|---|
| Run 152 dispatched | started 05:35:51Z | 05:35:51.076Z | 0,076 s |
| Requeue #44 (run 152) | started viết lại 07:04:51Z | 07:04:51.640Z | 0,640 s |
| Run 152 finished | finished 08:15:41Z | succeeded 08:15:41.139Z | 0,139 s |
| Requeue #46 (run 153) | started viết lại 09:05:37Z | 09:05:37.375Z | 0,375 s |
| Requeue #47 (run 153) | started viết lại 11:07:13Z | 11:07:13.566Z | 0,566 s |
| Run 153 finished | finished 11:16:00Z | succeeded 11:16:00.983Z | 0,983 s |
| Requeue #49 (run 154) | started viết lại 13:05:55Z | 13:05:54.981Z | 0,019 s |

- **Claimed → finished (daemon → DB):** run 152: claimed 08:15:36Z vs succeeded created_at 08:15:41.139Z = **5 s** — đúng mẫu runs 146–151 (đều 5 s); run 153: claimed 11:15:56Z vs 11:16:00.983Z = **4 s**. Nếu đồng hồ daemon còn chậm ~50' (≈ 3.000 s) lúc run 152 finished thì claimed_at phải đọc ≈ 07:25Z trong khi created_at (host) đọc 08:15:41Z — chênh ~50', KHÔNG phải 5 s. **Không có chênh như vậy ở bất kỳ checkpoint nào.**
- **Dispatch đúng lưới chuẩn tuyệt đối theo created_at trong 07:41–08:15Z** (sau #45, trước finished 152): feed-pulse-14 07:41:54.248Z, HB 07:45:34.104Z (slot 07:50:50Z, jitter −316 s chuẩn), DR 08:00:00.095Z (0 s chuẩn), HB 08:15:34.109Z (slot 08:20:50Z, jitter −316 s chuẩn). Daemon dispatch theo đồng hồ của nó; nếu đồng hồ daemon chậm ~50' thì các dispatch này phải trễ ~50' theo giờ host — chúng KHÔNG trễ. **Đồng hồ daemon ≈ host từ 07:41:54Z trở đi, tức từ ~9 phút (danh nghĩa) sau btime #45 cho tới lúc run 152 finished.**
- **Kết luận đối chiếu:** dưới tiền đề created_at = host, wall thật run 152 ≈ danh nghĩa 9.590 s (± vài giây), margin thật ≈ 1.210 s. Kịch bản wall thật ≥ 11.078 s (T7-153 §2.2) đòi finished được đóng dấu bằng đồng hồ daemon CHẬM ~50' trong khi created_at (host) vẫn đọc 08:15:41Z — mâu thuẫn trực tiếp với claimed 5 s + dispatch đúng lưới cùng cửa. **T7 bác kịch bản đó theo bằng chứng scheduler DB.**

#### 2.2.3 Vị trí T45_thực so với wall run 152: bước nhảy (nếu có) rơi NGOÀI wall

- Theo cửa sổ T2-153, T45_thực ∈ (08:16:07Z, 08:35:51Z] — tức reboot #45 (giờ thực) xảy ra **SAU khi run 152 finished danh nghĩa 08:15:41Z (26 s sau cận dưới)**. Dù finished đóng dấu khung cũ (nhanh tối đa +417 s theo đối chiếu host của T2 lúc 07:57Z) hay khung mới (≈ thực), finished_thực ≤ 08:15:41Z < T45_thực — **bước nhảy tại #45 (nếu có) rơi NGOÀI wall run 152, không thể làm dài wall**.
- Xét cả 3 kịch bản (ký hiệu theo T2-153 §2.2):
  - **(S1) Đồng hồ mới chậm ~50' lúc boot rồi slew về chính xác lúc 08:41Z:** finished đóng dấu khung cũ (trước reboot) ⇒ wall_thực = 9.590 s − δ_f, δ_f ∈ (−133, +417] s (đối chiếu host T2 lúc 07:57Z) ⇒ wall_thực ∈ **[9.173, 9.723] s**, margin_thực ∈ [1.077, 1.627] s — **dương trong mọi trường hợp, verdict đứng**.
  - **(S2) Đồng hồ cũ nhanh dần tới ~50' lúc chết, đồng hồ mới chính xác lúc boot:** wall_thực = 9.590 s − δ_f với δ_f tới ~3.026 s ⇒ wall_thực ngắn hơn danh nghĩa nhiều — **verdict đứng càng vững**.
  - **(S3) Migration, cả hai đồng hồ chính xác, chồng lấn 50'26":** wall_thực ≈ 9.590 s, margin ≈ 1.210 s — **verdict đứng**.
- Kịch bản wall dài duy nhất — finished đóng dấu khung mới CHẬM ~50' (finished_thực ≈ 09:05Z) — đòi T45_thực < finished_thực ≈ 08:15:41Z (danh nghĩa), **mâu thuẫn cận dưới T45_thực 08:16:07Z của T2** (chênh chỉ 26 s — T7 ghi rõ: cận dưới này dựa trên giả định độ lệch đồng hồ cũ lúc 08:23:04Z cùng bậc với lúc 07:57:47Z; nếu giả định đó sai thì cận dưới yếu đi — nhưng khi đó lại rơi vào (S2), wall ngắn hơn, verdict vẫn đứng). **Không có kịch bản nào trong 3 kịch bản làm wall vượt ngân sách.**
- **KẾT LUẬN RÕ (theo brief): verdict run 152 SUCCEEDED (provisional) ĐỨNG VỮNG — T7 đề xuất parent GỠ trạng thái provisional.** Căn cứ: (a) pin trực tiếp thất bại nhưng không còn cần thiết — 3 lần đọc DB độc lập khớp nhau + events đầy đủ vẫn đứng; (b) đối chiếu daemon-epoch vs DB created_at bác kịch bản đồng hồ chậm ~50' lúc finished; (c) vị trí T45_thực sau finished loại khả năng bước nhảy làm dài wall. Quyết cuối thuộc parent; T2-154 (chứng nhận clock chính) nếu bác bằng chứng trên thì parent xem lại — T7 ghi rõ điều kiện tiền đề created_at = host để T2 kiểm lại.

### 2.3 Reboot #48 trước phiên — boot mới, không viết lại run nào, không phải điểm (m)

- **Reboot #48: boot cd7dcd88 → 2c0a7985-b750-4166-b177-21d2ef7e1dc7, btime 1795173965 = 11:26:05Z.** Uptime 12 phút lúc kiểm 11:38:12Z (T2-154 prereg — đối chiếu khớp); `uptime -s` 11:26:05; journal 1 boot, entry đầu 11:26:15Z (= btime +10 s); `last reboot` 11:26 still running; wtmp bắt đầu 11:26:15Z (= btime +10 s). Xảy ra GIỮA T10-153 đóng sổ (~11:15Z) và run 154 dispatch (11:35:51Z) — tức TRƯỚC phiên T7-154. Tuổi danh nghĩa boot cd7dcd88 (#47→#48): 1795173965 − 1795172800 = 1.165 s (19m25s).
- **KHÔNG có run vcut nào đang chạy tại btime #48:** run 153 finished 11:16:00Z (trước btime 605 s); run 154 dispatch 11:35:51Z (sau btime 586 s); HB 11:20:50Z finished cùng giây dispatch 11:15:34Z. **Không có event requeue nào tại #48** (event đầu sau btime: reconciled 11:35:51.053Z + run 154 dispatched 11:35:51.109Z = btime + 586 s). **#48 KHÔNG PHẢI điểm dữ liệu cho mẫu (m)** — ghi nhận để tránh đếm nhầm.
- **Không có mâu thuẫn khung giờ mới tại #48:** mốc hoạt động cuối đã biết trên cd7dcd88 là aggregate 153 mtime 11:17:10.73Z — TRƯỚC btime 11:26:05Z 535 s, thứ tự xuôi. Đồng hồ boot mới CHÍNH XÁC (F117? ≈ 0/+1 s, T2-154, đủ 3 server).

### 2.4 Reboot #46/#47/#49 — viết lại run, điểm (m) mới

- **#47 (đã biết từ T10-153, nay T7 xác nhận bằng DB): boot 1450ac80 → cd7dcd88-47ca-43b5-9a75-a40821d8a730, btime 1795172800 = 11:06:40Z.** Run 153 ĐANG CHẠY tại btime và BỊ VIẾT LẠI lần 2: started_at 1795165537 → 1795172833 = 11:07:13Z; requeue event 11:07:13.566Z = **btime + 33,566 s — TRONG dải 33–48,4 s** (33,566 > 33,236 thấp nhất cũ #42 → dải KHÔNG ĐỔI). Claimed_at VẪN 1795163751 (gốc, không viết lại). **Điểm dữ liệu thứ 8, DƯƠNG.**
- **#49 GIỮA PHIÊN: boot 2c0a7985 → 12fc68a3-10f4-4459-908f-b0a47615afae, btime 1795179912 = 13:05:12Z.** Uptime 0 phút lúc kiểm 13:06:01Z; journal 1 boot, entry đầu 13:05:29Z (= btime +17 s); `last reboot` 13:05 still running; wtmp bắt đầu 13:05:29Z. Xác minh 4 nguồn (boot_id + /proc/stat btime + journal + last/wtmp — cùng mẫu xác minh #47 của T10-153). Sleep 1.500 s của T7 (bắt đầu ~12:43Z) **BỊ GIẾT bằng SIGTERM sau 1.372 s** (~13:05:3x–13:05:5xZ, ~20–40 s sau btime — cùng hiện tượng #39/#42/#44/#46; chậm hơn #44 giết sleep T7-152 sau ~6 s, tương đương #46 giết sau ~30 s).
- **Run 154 (run của chính đợt này) ĐANG CHẠY tại btime #49 và BỊ VIẾT LẠI:** started_at 1795174551 → 1795179955 = 13:05:55Z (offset 5.404 s); requeue event 13:05:54.981Z = **btime + 42,981 s — TRONG dải 33–48,4 s**. Claimed_at VẪN 1795174551 (gốc). Events: `dispatched` 11:35:51.109Z → `requeued_after_restart` 13:05:54.981Z → `dispatched` 13:05:55.283Z → `reattached_after_restart` 13:05:55.409Z. **Điểm dữ liệu thứ 9, DƯƠNG.**
- **KHÔNG có khoảng im lặng dài tại #49 (giống #44/#46, khác #43/#45):** daemon sống tới sát reboot — feed-pulse-19 12:41:54Z, HB 12:45:34Z, DR 13:00:00Z (event cuối trước btime: DR succeeded 13:00:00.333Z); gap DR-succeeded → requeue 13:05:54.981Z = 354,648 s, trong đó daemon-down thật chỉ 42,981 s (btime → requeue), còn 311,667 s trước btime là im lặng bình thường (không có slot đến hạn). Event đầu tiên sau #49 là requeue (btime + 42,981 s) — recovery nhanh, cùng họ mốc ~40 s. Chỉ có DUY NHẤT 1 event `requeued_after_restart` trong cửa — cho run 154.
- **KHÔNG có mâu thuẫn khung giờ mới tại #49 (khác #45):** event cuối trước btime (DR 13:00:00Z) TRƯỚC btime 13:05:12Z — thứ tự thời gian xuôi, không ép bước nhảy. Requeue +42,981 s trong dải cũ — không đủ để kết luận bước nhảy. (Mù #81? ↔ #49 giao T2-154.)
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng): #38 ÂM, #39/#41/#42/#44/#46/#47/#49 DƯƠNG, #45 ÂM (ứng viên) → n ứng viên = 9 (7 dương + 2 âm). Số chính thức (ứng viên) vẫn 7 theo quyết (f) đợt 153 cho tới khi parent quyết.** Dải requeue dương giữ nguyên **33–48,4 s** (33,566 s và 42,981 s đều nằm trong dải).

### 2.5 Slot HB/DR trong cửa 10:50Z → 13:46Z 20/11 — HB 6/6 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h56' (7 lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng — thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:20:50 (11:20:50Z) | e73a6ad5 | 11:15:34 | −316 s | CÓ |
| 18:50:50 (11:50:50Z) | 784aefda | 11:45:34 | −316 s | CÓ |
| 19:20:50 (12:20:50Z) | d721afaf | 12:15:34 | −316 s | CÓ |
| 19:50:50 (12:50:50Z) | 7a037ffb | 12:45:34 | −316 s | CÓ |
| 20:20:50 (13:20:50Z) | 43617462 | 13:15:34 | −316 s | CÓ |
| 20:50:50 (13:50:50Z) | 8371f4c8 | 13:45:34 | −316 s | CÓ |

- 6/6 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (sau khi tái hiện ở đợt 152, vắng ở đợt 153).
- Slot HB 10:50:50Z đã đếm ở đợt 153 — T7-154 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:00 (11:00Z) | 0a63853a | 11:00:00 | 0 s | CÓ |
| 19:00 (12:00Z) | d4dc382e | 12:00:00 | 0 s | CÓ |
| 20:00 (13:00Z) | 484f80d9 | 13:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 14:00Z chưa dispatch lúc đóng cờ (14:00:00Z sau kiểm cuối) — thuộc cửa T7-155.

### 2.6 Run 154 — jitter 0 s, vẫn running lúc đóng cờ (đã viết lại tại #49)

Run 154 (`b0209c7e-6958-45a9-baba-c2e036526cef`, sched 1795174551 = 11:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795174551 | 11:35:51Z 20/11 |
| dispatched (event) | — | 11:35:51Z |
| started_at GỐC | 1795174551 | 11:35:51Z — **jitter 0 s** |
| started_at nay (viết lại tại #49) | 1795179955 | 13:05:55Z (= btime #49 + 43 s) |
| worker_claimed_at | 1795174551 | 11:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795185351 | 14:35:51Z 20/11 |

- 7 lần đọc DB trong phiên (~11:38Z, ~11:41Z, ~12:12Z, ~12:42Z, ~13:06Z, ~13:32Z, ~13:46Z): status `running` ở cả 7 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #49, khớp event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` + `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #49 — không có event nào khác.
- Tuổi run từ gốc: 2.177 s lúc kiểm lần 3 (12:12:08Z), 4.000 s lúc kiểm lần 4 (12:42:31Z), 5.410 s lúc kiểm lần 5 (13:06:01Z), 6.976 s lúc kiểm lần 6 (13:32:07Z), **7.797 s (2h09m57s) lúc kiểm cuối (13:45:48Z)** — còn 3.003 s (50m03s) tới hạn ngân sách 14:35:51Z. **Kết cục thuộc T7-155.**
- **Mẫu (m) KHÔNG tái diễn ở 153→154 theo nghĩa run sau jitter 0:** run 153 succeeded (không timeout) + run 154 jitter 0 s — lần thứ bảy liên tiếp. Lưu ý: run 154 ĐÃ bị viết lại started_at tại #49 (như run 149 tại #39, run 150 tại #41, run 151 tại #42, run 152 tại #44, run 153 tại #46/#47) — viết lại không đồng nghĩa timeout; timeout chỉ xảy ra khi wall từ started GỐC vượt ngân sách.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 153/154 đầy đủ; events lọc theo run_id + theo cửa giờ). Job IDs đã xác minh: heartbeat (interval@30m) / deterministic-doctor (interval@1h) / vcut-build-loop (interval@3h, Asia/Saigon). Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này đã bắt được 0 phép tính nháp sai — mọi số trong NOTES đều kiểm lại bằng `date -u +%s` tại thời điểm kiểm). Số giây requeue #47/#49 lấy từ `created_at` timestamptz trực tiếp (11:07:13.566Z / 13:05:54.981Z), không qua extract-epoch làm tròn.
4. Cửa kiểm đợt này ~2h56' (10:50Z → 13:46Z 20/11), đủ 6 slot HB + 3 slot DR + run vcut 153 (kết cục) và 154 (theo dõi). Bảy lần đọc DB khớp hoàn toàn nhau ở mọi slot trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa. Run 153 được đọc lại xác nhận 6 lần sau lần đầu (7 lần đọc độc lập khớp nhau + events đối chiếu).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 10:50:50Z + DR 10:00Z thuộc cửa 153 theo quy ước đứng (T7-153 đã đếm); slot DR 11:00Z + HB 11:20:50Z thuộc cửa 154 (sau kiểm cuối T7-153 lúc 10:50Z). DR 14:00Z thuộc cửa T7-155.
6. **1 sleep bị giết trong phiên này** (sleep 1.500 s, SIGTERM sau 1.372 s, do reboot #49 — cùng hiện tượng #39/#42/#44/#46); 3 sleep còn lại (1.800 s + 1.800 s + 1.500 s) hoàn thành bình thường. Boot đổi 2c0a7985 → 12fc68a3 đúng 1 lần trong phiên (tại #49); #48 xảy ra trước phiên.
7. T7 đóng cờ ~13:49Z, trước hạn cờ ~14:00Z ~11 phút (hạn cứng toàn đợt 14:30Z còn ~41'). Ghi rõ, không giấu. Run 154 vẫn running lúc đóng cờ — kết cục thuộc T7-155 (hạn ngân sách 14:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix154.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 153, cùng phương pháp)

- Heartbeat: 44/309 → **44/315 slot thiếu** (cửa sổ 14/11 07:50:50 → 20/11 20:50:50 +07). Kiểm toán cửa sổ: 309 + 6 slot mới = 315 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/225 → **49/228 slot thiếu** (cửa sổ 11/11 09:00 → 20/11 20:00 +07). Kiểm toán: 225 + 3 = 228 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/315 = 14,0% (giảm từ 14,2% — 0 thiếu mới); DR 49/228 = 21,5% (giảm từ 21,8% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 153: SUCCEEDED theo hồ sơ daemon (wall danh nghĩa 9.609 s, margin danh nghĩa 1.191 s)** — 7 lần đọc DB khớp nhau + events đầy đủ (8 event, gồm viết lại lần 2 tại #47). **Run 153 là run đầu tiên bị viết lại started_at HAI lần** (#46 + #47) mà vẫn succeeded — viết lại không đồng nghĩa timeout.
2. **Siết T45_thực: pin trực tiếp THẤT BẠI** (không có requeue run 152 tại #45 — xác nhận lần 2; 0 event scheduler trong cửa sổ T2 (08:16:07Z, 08:35:51Z] trừ biên) — **nhưng verdict run 152 ĐỨNG VỮNG theo §2.2.2–2.2.3** (đối chiếu daemon-epoch vs DB created_at + vị trí T45_thực sau finished). **Đề xuất parent GỠ provisional** (quyết cuối thuộc parent; T2-154 là chứng nhận clock chính — nếu T2 bác tiền đề created_at = host thì xem lại). Gap #45 giữ nguyên khoảng ứng viên RỘNG [4.183, 5.917] s — T7 không thu hẹp được gì thêm cho T2.
3. **Điểm dữ liệu (m) thứ 8 + 9: CẢ HAI DƯƠNG** — #47 viết lại run 153 lần 2 (requeue btime + 33,566 s) + #49 viết lại run 154 (requeue btime + 42,981 s). **n chính thức (ứng viên) VẪN = 7; n ứng viên = 9 — chờ parent quyết có tính #47/#49 vào n không.** Dải requeue dương giữ nguyên 33–48,4 s. Điều tra (m) ĐÃ ĐÓNG — T7 chỉ ghi nhận, KHÔNG mở điều tra mới.
4. **Reboot #48 TRƯỚC phiên — không phải điểm (m)** (không run nào đang chạy tại btime 11:26:05Z). Reboot #49 GIỮA phiên viết lại run 154. **Hai reboot trong/quanh đợt (#48 trước phiên, #49 giữa phiên) KHÔNG làm mất slot nào.**
5. **Cửa slot LÀNH HOÀN TOÀN lần thứ hai liên tiếp (HB 6/6, DR 3/3, 0 muộn, 0 thiếu).**
6. **Run 154 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 7.800 s, còn 3.000 s tới hạn ngân sách 14:35:51Z) — kết cục thuộc T7-155. Không đổi số đếm đợt 154.
7. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). Mù #76?/#77?/#78?/#79?/#80?/#81? + gap #42/#43/#44/#45 chỉ là ứng viên (chưa chứng nhận) — giao T2-154/155 (T7 không chứng nhận mù).

## 6. Sai số của chính T7

- **F-154-T7-1 — Lỗi đánh máy trong bản nháp LIMITS §2.4 (bắt được trước khi stage):** bản nháp ghi "claimed_at VẪN 1795174551 (gốc, không viết lại)" cho run 153 tại #47 — SAI, claimed_at gốc của run 153 là 1795163751; 1795174551 là scheduled_for của run 154. Đã SỬA trong LIMITS trước khi ghi (xem §2.4: claimed_at VẪN 1795163751). Cùng họ sai số nhầm epoch như F-147-T7-1/F-148-T7-1/F-149-T7-3/F-150-T7-1/F-151-T7-1/F-152-T7-1/F-153-T7-1 — đối chiếu run_id + sched trước khi ghi số là chốt chặn bắt được (lần thứ 8 liên tiếp).
- **F-154-T7-2 — Script phụ lục bắt được epoch sai trong LIMITS §8 (đã sửa trước khi stage):** bản nháp §8 ghi "session jsonl cuối 1795161784 = 08:23:04Z; chênh 3.026 s" — SAI epoch (1795161784 = 08:03:04Z, chênh thật 1.826 s); epoch đúng là **1795162984 = 08:23:04Z, chênh 3.026 s** (kiểm lại bằng `date -u -d @1795162984`). Đã SỬA §8 trước khi stage; script `appendix154.py` nay khớp từng số với LIMITS. Đây chính là bài học đứng "phụ lục chỉ viết bằng script" phát huy tác dụng (lần thứ 2 liên tiếp script bắt lỗi số — đợt 153 là tuổi run nháp sai).
- **F-154-T7-0 — Không có sai số nào khác trong đợt này:** 7 lần đọc DB khớp nhau ở mọi slot trùng; mọi jitter/wall/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×3 slot, run 153 wall gốc 9.609 s / margin 1.191 s / wall viết lại lần 2 527 s, run 154 jitter 0 s, requeue #47 btime + 33,566 s / #49 btime + 42,981 s (created_at trực tiếp), offset viết lại run 154 5.404 s, gap danh nghĩa #49 354,648 s / daemon-down 42,981 s, bước nhảy #45 ≥ 1.488 s / 3.026 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở cả 7 lần đọc (2c0a7985 → 12fc68a3 đúng 1 lần, tại #49) và khớp brief + prereg T2-154 về reboot #48; ở cả 7 lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 153 có 7 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 11:16:00.983Z, eid 9363), không suy đoán sau.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round154-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round154-t7/NOTES.md` + `appendix154.py` + `appendix154.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round154-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix154.py` từ epoch thô — xem file `appendix154.txt` trong round154-t7)

### Phu luc A — Run 152 (ket cuc, doc lai xac nhan dot 154)
- sched 1795152951 = 05:35:51Z; started GOC 1795152951 = 05:35:51Z (jitter 0 s)
- started nay (viet lai #44) 1795158291 = 07:04:51Z; claimed 1795162536 = 08:15:36Z (finished - 5 s)
- finished 1795162541 = 08:15:41Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795162541 - 1795152951 = 9590 s (2h39m50s)
- han ngan sach: 1795163751 = 08:35:51Z; margin: 1795163751 - 1795162541 = 1210 s (0h20m10s)
- wall tu started viet lai: 1795162541 - 1795158291 = 4250 s (1h10m50s)
- events: dispatched 05:35:51Z -> requeued 07:04:51.640Z -> dispatched -> reattached -> succeeded 08:15:41Z; 0 event sau succeeded; 0 requeue tai #45

### Phu luc B — Run 153 (ket cuc SUCCEEDED, T7-154)
- sched 1795163751 = 08:35:51Z; started GOC 1795163751 = 08:35:51Z (jitter 0 s)
- started sau viet lai #46: 1795165537 = 09:05:37Z; sau viet lai #47: 1795172833 = 11:07:13Z
- claimed 1795173356 = 11:15:56Z (finished - 4 s)
- finished 1795173360 = 11:16:00Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795173360 - 1795163751 = 9609 s (2h40m09s)
- han ngan sach: 1795174551 = 11:35:51Z; margin: 1795174551 - 1795173360 = 1191 s (0h19m51s)
- wall tu started viet lai lan 2: 1795173360 - 1795172833 = 527 s (0h08m47s)
- offset viet lai lan 2 (tu goc): 1795172833 - 1795163751 = 9082 s (2h31m22s)
- offset viet lai lan 2 (tu lan 1): 1795172833 - 1795165537 = 7296 s (2h01m36s)

### Phu luc C — Reboot #46 / #47 / #48 / #49
- #46: btime 1795165489 = 09:04:49Z; requeue btime + 48,375 s
- #47: btime 1795172800 = 11:06:40Z; requeue btime + 33,566 s
- #48: btime 1795173965 = 11:26:05Z; boot 2c0a7985; KHONG co requeue (khong run nao dang chay)
- #49: btime 1795179912 = 13:05:12Z; requeue btime + 42,981 s
- tuoi danh nghia boot 1450ac80 (#46->#47): 7311 s (2h01m51s)
- tuoi danh nghia boot cd7dcd88 (#47->#48): 1165 s (0h19m25s)
- tuoi danh nghia boot 2c0a7985 (#48->#49): 5947 s (1h39m07s)
- run 153 finished -> #48 btime: 605 s (0h10m05s)
- run 154 dispatch - #48 btime: 586 s (0h09m46s)

### Phu luc D — Buoc nhay khung gio qua #45 (doi chieu)
- btime #45: 1795159958 = 07:32:38Z
- T7-152 kiem cuoi 1795161446 = 07:57:26Z boot c741f5e6; chenh bao thu: 1795161446 - 1795159958 = 1488 s (0h24m48s)
- T10-152 session jsonl cuoi 1795162984 = 08:23:04Z; chenh: 1795162984 - 1795159958 = 3026 s (0h50m26s)
- margin danh nghia run 152: 1210 s; buoc nhay bao thu vuot margin: 1488 - 1210 = 278 s
- cua so T45_thuc (T2-153): (08:16:07Z, 08:35:51Z]; finished 152 (08:15:41Z) truoc cua duoi 26 s
- im lang danh nghia 08:15:41Z -> 08:35:51Z (sau finished 152): 1210 s (0h20m10s) — trung margin 152
- im lang danh nghia 11:16:00Z -> 11:35:51Z (sau finished 153): 1191 s (0h19m51s) — trung margin 153

### Phu luc E — Slot HB/DR cua T7-154
- HB sched 11:20:50Z run e73a6ad5: started 11:15:34Z, jitter -316 s, succeeded
- HB sched 11:50:50Z run 784aefda: started 11:45:34Z, jitter -316 s, succeeded
- HB sched 12:20:50Z run d721afaf: started 12:15:34Z, jitter -316 s, succeeded
- HB sched 12:50:50Z run 7a037ffb: started 12:45:34Z, jitter -316 s, succeeded
- HB sched 13:20:50Z run 43617462: started 13:15:34Z, jitter -316 s, succeeded
- HB sched 13:50:50Z run 8371f4c8: started 13:45:34Z, jitter -316 s, succeeded
- DR sched 11:00:00Z run 0a63853a: started 11:00:00Z, jitter +0 s, succeeded
- DR sched 12:00:00Z run d4dc382e: started 12:00:00Z, jitter +0 s, succeeded
- DR sched 13:00:00Z run 484f80d9: started 13:00:00Z, jitter +0 s, succeeded
- Tong cua: HB 6/6 (0 thieu, 0 muon), DR 3/3 (0 thieu)
- Luy ke: HB 44/309 -> 44/315 (so thieu +0); DR 49/225 -> 49/228 (so thieu +0)
- Ti le thieu: HB 14,0% (tu 14,2%); DR 21,5% (tu 21,8%)

### Phu luc F — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #38 AM (run 148 khong viet lai); #39 DUONG (+40,799 s); #41 DUONG (+44,994 s); #42 DUONG (+33,236 s)
- #44 DUONG (+40,640 s); #45 AM ung vien (run 152 dang chay, 0 requeue); #46 DUONG (+48,375 s)
- #47 DUONG (+33,566 s) — viet lai lan 2 run 153
- #49 DUONG (+42,981 s) — viet lai run 154
- Dai requeue duong: 33–48,4 s KHONG DOI (33,566 > 33,236 thap nhat cu; 42,981 trong dai)
- n CHINH THUC (ung vien, quyet (f) dot 153) = 7; n ung vien moi = 9 (them #47 DUONG + #49 DUONG) — cho parent quyet
- #48 KHONG PHAI diem du lieu (khong run nao dang chay tai btime)
