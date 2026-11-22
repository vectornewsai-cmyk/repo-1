# PHASE9 ROUND151 T2 — EPERM probe #70 + mù #72? ĐÓNG HOÀN TOÀN + mù #73? ĐÓNG HOÀN TOÀN (G-full + H theo luật gap; nghịch lý đồng hồ ≥ +20 s lúc chết — mạnh hơn 7 s trong brief) + gap #40/#41 chứng nhận dạng khoảng [7.696, 7.700] / [6.820, 6.824] s + INSIDE chuỗi 2 → 3 — LIMITS

## 0. Headline

- **Probe EPERM #70: ok=2 fail=0, boot 2e430750, 02:40:07Z.** Probe trước (#69) đã chết/stale 10.507 s (2h55'07", n=69, ts 23:44:57Z, boot e9295700). Log `eperm-probe-v2.log` 199 → **202 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`.
- **Mù #72? ĐÓNG HOÀN TOÀN + mù #73? ĐÓNG HOÀN TOÀN — chuỗi mù đóng hoàn toàn 7 → 9 (chờ parent xác nhận):** đoạn G-full (e9295700, [23:32:09Z → 01:25:51Z]) **ĐÓNG theo luật gap** (merged max gap 380 s < sàn 1.147 s, max 0 ẩn; 245 mốc); đoạn H (2e430750, [01:25:51Z → 02:40:07Z]) **ĐÓNG theo luật gap** (merged max gap 702 s < sàn, max 0 ẩn; 104 mốc). Gap #40 chứng nhận **DẠNG KHOẢNG [7.696, 7.700] s, giữa 7.698 s**; gap #41 chứng nhận **DẠNG KHOẢNG [6.820, 6.824] s, giữa 6.822 s** → **CERT 73 / FULL 88** (mids dùng cho thống kê). **Số danh nghĩa CẢ HAI gap đều NẰM TRONG khoảng thật** (7.698 s / 6.822 s — lần thứ hai liên tiếp sau #39, danh nghĩa đúng trong sai số ±2 s).
- **Nghịch lý đồng hồ MẠNH HƠN brief (phát hiện mới của đợt này, chỉ ghi nhận — quyết parent 150 (p): không mở điều tra mới):** đồng hồ boot cũ e9295700 nhanh **≥ +20 s lúc chết** (mẫu cuối ram log T8-150 đóng dấu 01:26:12Z, viết trước khi chết — xem §2.2), không chỉ +7 s như dòng P3 PASS 01:25:58Z (cận dưới yếu hơn, ≥ +6 s, nhất quán). Đồng hồ lúc đầu boot vẫn chính xác (F112? ≈ 0/+1 s lúc 23:46Z) — drift/xảy ra TRONG đời boot. **Nghịch lý này KHÔNG làm rộng khoảng gap #41** (btime_old đã ghi lúc 23:45Z khi e5 ≈ 0 — xem §2.2); nó chỉ ảnh hưởng cách đọc khung chết #116? (xem §2.4 + câu hỏi (b)).
- **Khung chết #116? (boot e9295700): (01:25:09Z, 01:25:51Z] = 42 s danh nghĩa** (mốc cuối xác nhận sống: file session-continuity của runtime 01:25:09Z — cùng loại mốc T2-150 dùng cho #115?). Bản giờ thực ≈ 42 s ± 2 s. Bản đọc chỉ-bằng-đồng-hồ-VM cho 74 s (mốc cuối 01:24:37Z) — T2 đề xuất KHÔNG dùng (dấu VM gần lúc chết bị drift phình — xem §2.4, câu hỏi (b)).
- **Chuỗi INSIDE — 2 → 3 THEO CHUẨN ĐỨNG (quyết parent 150 (d)):** btime 2e430750 01:25:51Z **INSIDE** dải FULL87 neo e9295700 [23:58:21Z, 01:56:58Z] (cách p90 1.867 s); kiểm chéo FULL86 neo 23:32:09Z [23:58:20Z, 01:57:08Z] → INSIDE (aggregate 150 ghi 01:57:09Z — lệch 1 s do làm tròn, không ảnh hưởng kết luận); FULL85 neo 23:32:09Z [23:58:18Z, 01:57:18Z] → INSIDE. Cả ba dải đều cho INSIDE.
- **F113? ≈ 0/+1 s, ĐỦ 3 SERVER** (example +1, google +1, cloudflare +1 — cloudflare 200 lần này, không 403). Đồng hồ C6 (boot 2e430750) chính xác; btime 01:25:51Z là giờ thực.
- **KHÔNG có reboot mới trong phiên** (boot 2e430750 lúc mở 02:39Z, lúc probe 02:40Z, lúc kiểm đóng 02:55:37Z) → không mở mù #74?.
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (~206 h trước probe #70). EPERM **chưa** tuyên bố hết.
- **RAM đỉnh trong cửa sổ mù: 2.164.956 kB = 2.114,2 MiB (T9-150 sampler, 00:09:35Z, đoạn G) = 34,41% guard 6.144 MiB** — 0/133 mẫu ≥ guard. Birefnet **0 thử lần thứ năm liên tiếp** (147/148/149/150/151). Balloon: đoạn G max 6.443.824 kB (100% trần, **28 mẫu ghim** — khớp đúng số T9-150 28/97); đoạn H 0 mẫu sampler hợp lệ.
- **WFS #57: chênh 0 — lần thứ 57 liên tiếp.** NEWSTD 978 dòng / 282 file; R7b 1.003 / 299; copies 25 / 17. Delta +2 dòng / +2 file giải thích đầy đủ bằng diff (không đoán trước).
- **Quyết parent đợt 150 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** ((c) CERT71/FULL86 + chuỗi đóng hoàn toàn 7; (d) INSIDE chốt chuỗi 1 → 2 theo chuẩn đứng; (i) mù #72?/#73? giao T2-151; (p) nghịch lý 7 s ghi nhận, không điều tra mới; (q) kết cục run 150 thuộc T7-151; (s) đếm cuối chỉ lấy từ output script, không cộng tay; (t) mỗi luồng phải viết cờ .done trước khi báo đóng) — chỉ câu hỏi MỚI phát sinh ở đợt 151 ghi ở §4.5.

## 1. Checklist probe EPERM #70 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 20/11) | Kết quả |
|---|---|---|
| Đọc boot lúc mở phiên | 02:39:33Z | 2e430750-6ba0-47b6-bf22-902953eff096, btime /proc/stat 1795137951 = 01:25:51Z (chỉ đọc boot_id + btime, chưa probe — prereg viết sau đó) |
| Chốt chặn round-in-progress.md | 02:40:04Z | **KHÔNG tồn tại** (ls lỗi No such file — đúng như prereg (g)) |
| `status` | 02:40:04Z | **DEAD/STALE**, heartbeat n=69, ts 2026-11-19T23:44:57Z, boot e9295700, tuổi **10.507 s (2h55'07")**, exit 1 (đo trực tiếp, không tee) |
| `once` | 02:40:07Z | **Probe #70, boot=2e430750, ok=2 fail=0**, exit 0; dòng log `boot changed e9295700 -> 2e430750 (uptime since 2026-11-20 01:25:51)` — đúng chuẩn /proc/stat mới |
| `status` lại | 02:40:07Z | **ALIVE**, tuổi 1 s, n=70, exit 0 |
| Log probe | 02:40:07Z | `eperm-probe-v2.log` 199 → **202 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=70, ts 2026-11-20T02:40:07Z, boot 2e430750; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; đối chứng độc lập: heartbeat file đọc lại sau once, ts=02:40:07Z, boot=2e430750, n=70 — khớp |
| Xác minh boot | 02:40:14Z | Cùng boot_id/btime; `/proc/1` 01:26:02,57Z; `/proc/1/stat` starttime 1.106 ticks = **11,06 s sau kernel boot** → PID 1 start wall = 01:25:51Z + 11,06 s = 01:26:02,06Z ≈ /proc/1 mtime 01:26:02,57Z (lệch 0,51 s — trong sai số làm tròn ~1 s, nhỏ hơn 0,91 s đợt 150); `uptime -s` = 01:25:51Z (= /proc/stat); uptime 1:14 lúc 02:40:14Z → 02:40:14 − 1:14:23 = 01:25:51Z ✓; journal đúng 1 boot, entry đầu 01:26:02,946Z = /proc/1 +0,4 s; MemAvailable 1.272.880 kB |
| Xác minh boot lúc đóng | 02:55:37Z | **KHÔNG đổi boot — 2e430750**, btime 01:25:51Z; không có reboot mới trong phiên → không mở mù #74? |
| dpkg.log boot 2e430750 | 02:40:21Z | **Dòng đầu 01:26:35Z `startup packages configure` = boot +44 s** (61 dòng lúc 01:3x) — replay **BẮT ĐẦU BÌNH THƯỜNG** (như boot 802f358f +40 s; khác +35'05" của boot 70025d3e); /var/log/apt/history.log TỒN TẠI (36.380 B, mtime 01:30); T5-151 theo dõi tiếp (quyết parent 150 (h): repair sớm chỉ khi replay vắng ~15 phút — replay đã tới sau 44 s nên không kích hoạt) |
| F113? | 02:40:21–24Z | example.com Date 02:40:23 (+1 s), google.com 02:40:23 (+1 s), cloudflare.com 02:40:24 (+1 s, sai số làm tròn header Date 1 s) → **F113? ≈ 0 s đến +1 s, ĐỦ 3 SERVER** (cloudflare 200 lần này — xem §2.2) |

## 2. Điều tra mù #72? + mù #73?

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Cửa sổ mù (probe-to-probe): 23:44:57Z 19/11 → 02:40:07Z 20/11 = 10.510 s (2h55'10")** — từ probe #69 tới probe #70. Cửa sổ điều tra rộng hơn (từ btime #40): **23:32:09Z → 02:40:07Z = 11.278 s**.
- Hai reboot: #40 là mốc trái của cửa sổ điều tra, #41 nằm trong cửa sổ:

| Đoạn | Boot | Btime (/proc/stat) | Btime (/proc/1) | Dài (danh nghĩa) | Chết lúc |
|---|---|---|---|---|---|
| F'-body | 802f358f (#115?) | 21:23:51Z 19/11 | 21:24:01Z | (đã đóng đợt 150) | 23:32:09Z |
| G-full | e9295700 (#116?) | 23:32:09Z 19/11 (1795131129) | 23:32:24Z | 6.822 s (tới btime #41) | 01:25:51Z |
| H | 2e430750 (#117?) | 01:25:51Z 20/11 (1795137951) | 01:26:02Z | 4.456 s (tới probe #70) | (còn sống — probe #70) |

- Gap danh nghĩa (btime − btime, tính bằng epoch, chuẩn /proc/stat): #40 = **7.698 s** (tuổi thọ 802f358f); #41 = **6.822 s** (tuổi thọ e9295700). **Cả hai số danh nghĩa đều NẰM TRONG khoảng thật** (xem §2.2/§2.5) — lần thứ hai liên tiếp sau #39, danh nghĩa đúng trong sai số ±2 s.
- Độ trễ init (starttime ticks): e9295700 15,07 s (đợt 150); 2e430750 11,06 s — cả hai đều hòa giải được bằng số (PID 1 start wall ≈ /proc/1 mtime, lệch ≤ 0,91 s).
- Nguồn quan sát mốc cuối mù: T10-150 đóng sổ ~02:07–02:20Z (boot 2e430750); aggregate 150 mtime ~02:33Z (parent viết §12.3); file session-continuity runtime 01:25:09Z; file mở đợt 151 02:39–02:40Z; probe #70 02:40:07Z.

### 2.2 Đánh số + đồng hồ — chuẩn parent mới + nghịch lý ≥ +20 s (phát hiện mới, chỉ ghi nhận)

- **Quyết parent đợt 150 (§12.3) ĐÃ ÁP DỤNG:** (c) **mù #71? ĐÓNG HOÀN TOÀN → CERT 71 / FULL 86, chuỗi đóng hoàn toàn 7**; (d) **INSIDE chốt chuỗi 1 → 2 theo chuẩn đứng** (neo tiền nhiệm); (i) **mù #72? + #73? giao T2-151**; (p) **nghịch lý đồng hồ #41 (7 s): ghi nhận, không mở điều tra mới**; (q) **kết cục run 150 thuộc T7-151**; (s) **đếm cuối chỉ lấy từ output script**; (t) **mỗi luồng phải viết cờ .done**.
- **F112? (C5, e9295700 lúc đầu boot) ≈ 0/+1 s, ĐỦ 3 SERVER** (23:45:59Z, T2-150 §1) → e5 (lúc đầu boot) ∈ [−1, +1] s. **F111? (C4, 802f358f) ≈ 0 s, ĐỦ 3 SERVER** (21:28:35–37Z, T2-149 §2.12) → e4 ∈ [−1, +1] s. **F113? (C6, 2e430750) ≈ 0/+1 s, ĐỦ 3 SERVER** (02:40:21–24Z, §1) → e6 ∈ [−1, +1] s. Cloudflare lần này trả 200 (không 403 như F111?/F112?).
- **Journal boot mới liên tục, 0 dòng chỉnh giờ:** journalctl đúng 1 boot (2e430750); entry đầu 01:26:02,946Z; 70 entry trong 3 phút đầu; 0 dòng timesyncd/chrony/step/synchronized/clock trong toàn bộ journal boot mới. (dmesg KHÔNG thử đọc — T2-148 đã xác nhận `Operation not permitted`.)
- **NGHỊCH LÝ ĐỒNG HỒ — CẬN DƯỚI MỚI ≥ +20 s (không phải chỉ +7 s):**
  - Dòng P3 PASS của 86n2 lần 1 đóng dấu **01:25:58,130Z** (file `round150-t8/smoke/partial-boot-e9295700/run-webkit-86n2.log`, dòng cuối, mtime file 01:25:58Z) — muộn hơn btime boot mới 7 s. Dòng trước đó trong cùng file: P3 sync 01:25:37,846Z; P2 PASS 01:25:34,415Z. File chỉ có 8 dòng, không có dòng nào sau P3 PASS → viết bởi process boot cũ, trước khi chết (không có append từ boot mới). → e_old(lúc chết) ≥ 01:25:58 − (01:25:51 − e6) = **7 + e6 ≥ +6 s** (e6 ∈ [−1, +1]).
  - **Mẫu cuối ram log T8-150 đóng dấu 01:26:12Z** (file `round150-t8/smoke/partial-boot-e9295700/ram-150t8.log`, dòng cuối `01:26:12Z avail=641MB ...`, mtime file 01:26:12Z; cadence 30 s: …, 01:25:12, 01:25:42, 01:26:12). Sampler này là vòng `setsid bash` chạy trong VM, khởi động bởi `run-webkit-150t8.sh` lúc harness lần 1 — process VM không sống qua reboot; file KẾT THÚC ở 01:26:12 (không có mẫu nào sau đó — harness lần 2 khởi động lại sau 01:31:10Z, không ghi vào file này). → mẫu này viết bởi process boot cũ, tại thời điểm thực t_w ≤ R_new = 01:25:51 − e6 ≤ 01:25:52Z → e_old(lúc chết) ≥ 01:26:12 − 01:25:52 = **+20 s**. Cận này MẠNH HƠN và NHẤT QUÁN với cận +6 s từ dòng P3 (cả hai đều là cận dưới; không mâu thuẫn).
  - Hệ quả: đồng hồ e9295700 chạy đúng lúc đầu boot (F112? ≈ 0 lúc 23:46Z) rồi nhanh dần/lệch **≥ +20 s lúc chết** (~01:25Z). Đây là **dữ kiện mở mới về đồng hồ** (ghi nhận theo quyết (p), KHÔNG mở điều tra mới, KHÔNG suy đoán cơ chế — drift dần hay bước nhảy đều chưa phân biệt được từ dữ kiện hiện có).
  - **Tại sao nghịch lý KHÔNG làm rộng khoảng gap #40/#41 (lý luận đầy đủ, để parent/T10 kiểm):** công thức gap dùng btime đã GHI: gap_thật = danh nghĩa + (e_cũ(lúc btime cũ được ghi) − e_mới(lúc btime mới được ghi)). btime_old của #41 (23:32:09Z) được T2-150 đọc/ghi lúc 23:44–23:45Z, khi e5 ≈ 0 (F112? đo 23:45:59Z) — drift ≥ +20 s xảy ra SAU đó, trong đời boot còn lại, không viết lại giá trị btime đã ghi. Tương tự btime_old của #40 (21:23:51Z) được T2-149 đọc lúc 20:51–21:28Z khi e4 ≈ 0 (F111?). Vì vậy khoảng gap từ F vẫn là [7.696, 7.700] s / [6.820, 6.824] s. **Giả định duy nhất:** đồng hồ không lệch giữa lúc kernel ghi btime (23:32:09Z) và lúc F đo (23:45:59Z) — cùng giả định các đợt trước dùng cho #39 (F110?/F111?), được củng cố bởi journal boot e9295700 liên tục 23:32:25–23:45:30Z không có dòng chỉnh giờ (T2-150 §1). Nếu giả định này sai thì khoảng gap rộng hơn — ghi rõ để parent biết, không giấu.
- **Tranh chấp clock 27 s đợt 149 (e2 ∈ [313, 340] s, quyết parent 149 (b)) KHÔNG liên quan đợt này:** nó chỉ liên quan e2 (đồng hồ thời ae8f70bb, đã chết ở #38). Gap #40/#41 chỉ dùng e4/e5/e6 (đều ≈ 0 lúc đầu boot, đo trực tiếp). Ghi rõ để tránh nhầm lẫn khi đọc lại.
- **Mâu thuẫn full boot_id b47f7932 — VẪN ĐỂ MỞ (không có dữ kiện mới, quyết (g) đợt 143):** T2-151 không tự chọn một bên, mọi số đếm chỉ dùng short_id 8 ký tự đã xác nhận.
- **Replay boot 70025d3e trễ ~35 phút là ĐẶC THÙ MỘT BOOT (đứng nguyên):** dpkg.log boot mới 2e430750 có dòng đầu 01:26:35Z = boot +44 s (bắt đầu bình thường); boot e9295700 +3'33", boot 802f358f +40 s. Chỉ boot 70025d3e trễ +35'05". Quyết parent 149 (l): CHỈ GHI NHẬN (T5-151 theo dõi tiếp).

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác giây:**
- repo-1: **17 file** (16 mốc giây); hidden_files: **423 file** (221 mốc giây). Tổng hai cây **237 mốc giây khác nhau** (17 + 423 file).
- Đoạn G-full: **245 mốc merged** (xem §2.4); đoạn H: **104 mốc merged** (xem §2.4). Ngoài cây + /tmp bổ sung phần còn lại (xem dưới).

**Sessions (`~/workspace/agents/`, 311 exec-log, 311 file có birth/mtime dùng được — TĂNG 12 so với 299 đợt 150; 0 file biến mất có mtime trong cửa sổ mù):**
- Bắc cầu: G-lo **6**, G-hi **1**, H-lo **0**, H-hi **0** (H ngắn hơn 2 sàn? H = 4.456 s > 2×1.147 = 2.294 s — cắt không giao nhau; H-lo/H-hi = 0 là dữ kiện thật, không phải hình học).
- Chạm đoạn: G **46**, G-tail **3**, H **6**, H-tail **6**, G-head-hole **0**.
- Nhân chứng nhảy (jump witness): **0 tại cả hai btime** (#40 và #41 — cùng mẫu đợt 148/149/150; sessions không bắc qua reboot).
- Nhắc boot trong exec-log trong cửa sổ: e9295700 **26**, 2e430750 **1**, 802f358f **1**.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **220 file** trong cửa sổ (117 mốc giây). /tmp: **627 file** (12 mốc giây — nhiều file cùng giây: burst ghi của harness/luồng đợt 150, vd /tmp/round76-d8, /tmp/round81-i7, /tmp/l10). Goals ngoài hidden_files: **0 file** trong cửa sổ. Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **3 file** (2 file memory bank 00:50:04Z đoạn G — reflections.md + world.md; 1 file memory/2026-11-20.md 02:31:30Z đoạn H).
- Đuôi (tail) theo đoạn — ngoài cây / /tmp / repo-1 / hidden_files: G-tail **20 / 0 / 6 / 55** (81 file); H-tail **21 / 594 / 1 / 44** (660 file — trong đó 593 file /tmp dồn vào đúng 1 giây 02:39:57Z, node-compile-cache từ chính phiên T2-151, chỉ đóng góp 1 mốc giây nên không thu hẹp gap nào). G-head **3 / 0 / 0 / 0** (3 file docs 23:35:37Z — mốc đầu đoạn G).

**Ranh giới:**
- 2e430750: **0 file trong (btime, +10 s] thuộc boot mới một cách chắc chắn** — mốc đầu đoạn H theo timestamp là 01:25:58Z (86n2 log — THUỘC BOOT CŨ theo nội dung, xem §2.4); mốc boot-mới chắc chắn đầu tiên là live-config 01:26:31Z (+40 s). Mốc cuối đoạn G 01:25:09Z cách btime 42 s — chính là khung #116?.
- e9295700 (đầu G-full): **0 file trong (btime, +10 s]** (mốc đầu đoạn G 23:35:37Z = btime +208 s); /var/log btmp/lastlog/wtmp 23:32:25Z = btime +16 s (T2-150 §2.6 — ngoài 4 phạm vi merged, chỉ quét ở hole-recheck).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**349 mốc giây khác nhau** (repo-1 16, hidden_files 221, ngoài cây 117, /tmp 12). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| G-full | 245 | **380 s** (23:35:38→23:41:58) | 302 s / 208 s | 23:35:37 (+208 s) | 01:25:09 (−42 s) | **ĐÓNG — max 0 ẩn** (luật gap) |
| H | 104 | **702 s** (02:06:33→02:18:15) | 566 s / 360 s | 01:25:58 (+7 s) | 02:40:04 (−3 s) | **ĐÓNG — max 0 ẩn** (luật gap) |

**Đoạn G-full — ĐÓNG (max 0 ẩn, luật gap — KHÔNG cần uptime).** Gap lớn nhất merged 380 s < sàn 1.147 s; floor(380/1147)=0. 245 mốc: đầu 23:35:37Z (docs/*.md — head 208 s: 208 s đầu đoạn G không có mốc merged nào vì sau reboot #40 chỉ có /var/log 23:32:25Z ngoài phạm vi merged + im lặng tới 23:35:37Z), cuối 01:25:09Z (voice/s2s-context/context.md — tail 42 s). G-lo/G-hi 6/1 session bắc cầu; jump witness 0 tại btime #41.

**Đoạn H — ĐÓNG (max 0 ẩn, luật gap).** Gap lớn nhất merged 702 s < sàn 1.147 s; floor(702/1147)=0. 104 mốc: đầu 01:25:58Z (86n2 log — THUỘC BOOT CŨ theo nội dung, xem dưới), cuối 02:40:04Z (exec-log T2-151 — tail 3 s). H-lo/H-hi 0 session bắc cầu (dữ kiện thật — H không có session nào sống đủ dài để bắc cả hai cắt; không ảnh hưởng verdict vì luật gap chỉ cần merged marks).
- **Hiệu chỉnh mốc đầu H (đã kiểm bằng nội dung, không đoán):** mốc 01:25:58Z là file `round150-t8/smoke/partial-boot-e9295700/run-webkit-86n2.log` — dòng cuối P3 PASS đóng dấu 01:25:58,130Z, file chỉ 8 dòng, thuộc thư mục boot cũ, không có append từ boot mới → **thuộc boot cũ, KHÔNG phải mốc boot mới**. Mốc 01:26:12Z (`ram-150t8.log`, cùng thư mục) cũng thuộc boot cũ (xem §2.2 — sampler VM chết theo reboot, file kết thúc ở đó). **Loại cả hai khỏi mốc đầu H:** mốc boot-mới chắc chắn đầu tiên là live-config 01:26:31Z → head gap thật 40 s (thay cho 7 s theo timestamp). Max gap H vẫn 702 s (gap đầu không phải gap lớn nhất) → **verdict ĐÓNG không đổi**.

**Khung chết (danh nghĩa theo timestamp + bản theo giờ thực):**
- **#115? (boot 802f358f): (23:11:49Z, 23:32:09Z] = 1.220 s** (danh nghĩa, đã ghi đợt 150). Bản giờ thực: e4, e5 (lúc đầu boot) ∈ [−1, +1] s → **∈ [1.218, 1.221] s, giữa 1.220 s**. Không kiểm lại (đã chốt ở đợt 150, nay dùng làm tiền đề chứng nhận gap #40).
- **#116? (boot e9295700): (01:25:09Z, 01:25:51Z] = 42 s** (danh nghĩa). Mốc cuối đoạn G merged: file session-continuity của runtime 01:25:09Z (cùng loại mốc T2-150 dùng cho #115? — tiền lệ đứng). Bản giờ thực: mốc là file runtime (đồng hồ host) + btime boot mới chính xác (F113? ≈ 0) → **≈ 42 s ± 2 s**. **Bản đọc chỉ-bằng-đồng-hồ-VM: 74 s** (mốc cuối VM 01:24:37Z — run-webkit-summary.txt) — T2 đề xuất KHÔNG dùng: các dấu VM gần lúc chết bị drift ≥ +20 s phình lên (mốc 01:24:37Z theo đồng hồ cũ có thể là thực ~01:24:1xZ), nên 74 s là cận trên lỏng theo dấu sai, không phải khung thật. Recheck 0 mốc mới trong khung (§2.6). **Câu hỏi parent (b): chốt 42 s hay 74 s?**

### 2.5 Phân phối gap — CERT/FULL CHỨNG NHẬN (chuẩn /proc/stat)

- **Gap #40 CHỨNG NHẬN DẠNG KHOẢNG: [7.696, 7.700] s, giữa 7.698 s** — đoạn F'-body (đợt 150) + đoạn G-full (đợt này) đều đóng theo luật gap; không có bước nhảy đồng hồ tại #40 (e4, e5 lúc đầu boot ∈ [−1, +1] s từ F111?/F112?); khung chết #115? 1.220 s danh nghĩa pin cái chết. **Số danh nghĩa 7.698 s NẰM TRONG khoảng thật.**
- **Gap #41 CHỨNG NHẬN DẠNG KHOẢNG: [6.820, 6.824] s, giữa 6.822 s** — đoạn G-full + đoạn H đều đóng theo luật gap; e5/e6 (lúc đầu boot) ∈ [−1, +1] s từ F112?/F113?; khung chết #116? 42 s danh nghĩa pin cái chết. **Số danh nghĩa 6.822 s NẰM TRONG khoảng thật.** (Nghịch lý ≥ +20 s không làm rộng khoảng này — xem §2.2.)
- **CERT72 (CHỨNG NHẬN đợt này):** n=72, mean **1h36'53"**, median **1h52'28"**, p10 **0h24'54"**, p90 **2h19'05"**, sd **0h52'13"**, min **0h00'55"**, max **5h14'27"**; trong 90–150' = **38**, <60' = **17**, >180' = **4**, >240' = **1**. **FULL87 (CHỨNG NHẬN đợt này):** n=87, mean **1h41'59"**, median **1h54'16"**, p10 **0h26'13"**, p90 **2h24'50"**, sd **0h59'10"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **45**, <60' = **20**, >180' = **7**, >240' = **3**.
- **CERT73 (CHỨNG NHẬN đợt này):** n=73, mean **1h37'06"**, median **1h53'42"**, p10 **0h25'04"**, p90 **2h18'46"**, sd **0h51'54"**, min **0h00'55"**, max **5h14'27"**; trong 90–150' = **39**, <60' = **17**, >180' = **4**, >240' = **1**. **FULL88 (CHỨNG NHẬN đợt này):** n=88, mean **1h42'07"**, median **1h53'59"**, p10 **0h26'14"**, p90 **2h24'40"**, sd **0h58'50"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **46**, <60' = **20**, >180' = **7**, >240' = **3**.
- **SPAN (không chứng nhận):** 691a7403→cc222c8a = **7.050 s**; cc222c8a→e146ca67 = **7.381 s** (quyết 145 (f): để SPAN, không mở đường mới); b47f7932→9afdaa89 = **42 s**; 9afdaa89→70a5b0fc = **7.265 s**. Khoảng bde599df→9afdaa89 = **[3.965, 3.985] s**, giữa 3.975 s — đo được, KHÔNG phải gap boot liên tiếp, KHÔNG cộng vào CERT/FULL.
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Gap #40/#41 chứng nhận dạng khoảng hẹp (tiền lệ #58/#63/#39); không đề xuất đường chứng nhận mới. Thống kê dùng mid của khoảng (tiền lệ #58) — mid = đúng số danh nghĩa cả hai gap; ảnh hưởng lên mean ~0 s.
- Dải chứng nhận: [0h00'55", 5h14'27"] (CERT71) → **[0h00'55", 5h14'27"]** (CERT73 — max không đổi vì gap #40/#41 đều nhỏ hơn max cũ).
- **Chuỗi INSIDE (theo chuẩn đứng — quyết parent 150 (d)):**
  - 2e430750 làm #117? (đếm chặt, chuẩn), dải FULL87 neo #116? 23:32:09Z: **[23:58:21Z, 01:56:58Z]** — btime 01:25:51Z **INSIDE** (kiểm độc lập bằng code; cách p90 1.867 s) → **chuỗi INSIDE 2 → 3 ĐÃ CHỨNG NHẬN** (chờ parent xác nhận cùng CERT/FULL). Kiểm chéo bằng dải FULL86 neo 23:32:09Z [23:58:20Z, 01:57:08Z] cũng **INSIDE** (aggregate 150 ghi hi 01:57:09Z — lệch 1 s do làm tròn float p90, không ảnh hưởng kết luận); FULL85 neo 23:32:09Z [23:58:18Z, 01:57:18Z] cũng **INSIDE**. Cả ba dải đều cho INSIDE với biên thoải mái (≥ 1.867 s khỏi cạnh).
  - Boot tiếp theo sau 2e430750 (#118? chặt), dải FULL88 neo 01:25:51Z: **[01:52:05Z, 03:50:31Z]** (FULL87 neo 01:25:51Z để đối chiếu: ≈ [01:52:04Z, 03:50:41Z] — tính từ p10/p90 hiển thị đã làm tròn giây, sai số ±1 s).
- **Tốc độ reboot:** **117 reboot / 221,13 h = 1 lần / 113,4 phút** (tới #41; từ boot #1 2026-11-10T20:18:10Z tới 2e430750). Tới #40: **116 reboot / 219,23 h = 1 lần / 113,4 phút** (tốc độ không đổi). Chuỗi lũy kế tới **126 / 221,13 h = 1 lần / 105,3 phút** (+0 mù #72?/#73? đóng hoàn toàn — chưa cộng vì chờ parent xác nhận; tổng dung lượng 55B max 3 → 127; 56A max 3 → 129 — giữ nguyên như đợt 149/150 vì không có mù mới nào đóng thêm theo hướng dung lượng).
- **Tuổi thọ boot (danh nghĩa stat→stat):** 802f358f 7.698 s; e9295700 6.822 s. **Tuổi thọ THẬT:** 802f358f = gap #40 ∈ [7.696, 7.700] s; e9295700 = gap #41 ∈ [6.820, 6.824] s (danh nghĩa ≈ thật, sai số ≤ 2 s cả hai).

### 2.6 Recheck các hố — điều kiện duy nhất còn lại cho khung chết

- Quét mtime toàn cây `/home/hatch` (843.388 file, bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) + `/var/log` (11 file) cho mốc trong 6 hố: **843.399 file đã quét.**
- **H-G1 (380 s): 2 hit — tất cả đều là cùng giây với cạnh trái 23:35:38.xxx, KHÔNG phải mốc mới** (cùng bẫy F-146-T2-3/F-147-T2-3/F-148-T2-3/F-149-T2-4/F-150-T2-4, **lần thứ sáu liên tiếp**): docs/chat/payments-and-purchases.md 23:35:38.573 + docs/muse.md 23:35:38.593 (chính mốc cạnh trái).
- **H-G2 (302 s): 10 hit — cùng giây cạnh trái 01:10:39.0xx** (10 file stall-sampleFor-P1-phaseA-1795137038 của round149-t8 — chính mốc cạnh trái).
- **H-H1 (702 s): 1 hit — cùng giây cạnh trái 02:06:33.809** (round150-t10/count-final-150t10.py — chính mốc cạnh trái).
- **H-H2 (566 s): 3 hit — cùng giây cạnh trái 02:19:13.4xx** (sessions .json + .jsonl + sessions.json của agent 6ee73a84 — chính mốc cạnh trái).
- **H-DF / khung #116? (42 s): 1 hit — cùng giây cạnh trái 01:25:09.230** (voice/s2s-context/context.md — chính mốc cạnh trái).
- **H-GH / đầu G (192 s): 0 hit** trong (23:32:25Z, 23:35:37Z) — hố đầu G hoàn toàn trống mốc nội bộ.
- **Kết luận: đoạn G-full và H ĐÓNG; khung chết #115? 1.220 s / #116? 42 s (danh nghĩa) đứng nguyên sau recheck.** Không còn đường thu hẹp khung nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức; tự động hóa đã nối từ T9-147, 0 mẫu ≥ guard đợt này nên không kích hoạt — lần thứ năm liên tiếp 0 lần).
- Mù #64 đoạn B / #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới; quyết 145 (f)).
- Khung chết #110? 223 s (quyết parent 148 (g)) — đã chốt, không kiểm lại.
- Khung chết #111? [88, 156] s / #112? 55 s / #113? (113, 347] s (quyết parent 149 (j)) — đã chốt, không kiểm lại.
- Khung chết #114? 12 s danh nghĩa / [10, 14] s giờ thực (quyết parent 150 (c)) — đã chốt, không kiểm lại.
- F110? 2/3 server — ghi là CHƯA ĐỦ 3 SERVER, không đo lại (quyết parent 149 (k)).
- Kết cục run 150 — THUỘC T7-151, T2-151 không phán thay (quyết parent 150 (q)).
- Nghịch lý đồng hồ ≥ +20 s — chỉ ghi nhận (quyết parent 150 (p)); không mở điều tra mới.

### 2.8 Quét WFS #57 (02:55:18–02:55:37Z 20/11 — chạy trên boot 2e430750, đếm nội dung file nên không ảnh hưởng)

- **NEWSTD: 978 dòng / 282 file** (phạm vi 3.276 file). **R7b: 1.003 / 299** (phạm vi 12.669 file). **Copies: 25 / 17** (không đổi). Đối chiếu 978+25=1.003=R7b, **chênh 0 — lần thứ 57 liên tiếp**.
- Delta so với #56 (976/280): **+2 dòng / +2 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND150_T2_EPERM_LIMITS.md:1` — chính LIMITS T2-150 nhắc chuỗi "writeFileSync" một lần trong văn bản §2.8 (cùng mẫu #53/#54/#55/#56: LIMITS T2 nhắc chuỗi trong văn bản); `docs/PHASE9_ROUND150_LIMITS.md:1` — aggregate đợt 150 nhắc chuỗi một lần khi trích §2.8 của T2-150. Cả hai đều là nhắc chuỗi trong văn bản LIMITS, không phải helper mới. Phạm vi quét tăng +14 file (3.262→3.276) là LIMITS đợt 150 + file đợt 151, không chứa writeFileSync ngoài hai file trên.
- md5 cây tái kiểm: `docs/PHASE9_ROUND150_T2_EPERM_LIMITS.md` **cac9cc40877ac6d9bdcae756dff8ae13** — khớp cờ round150-t2.done (file không đổi sau khi stage).

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** trong src (grep `async .writeFile(` trả 0 dòng vì hai helper dùng `await f.writeFile(file, data);` — đã kiểm trực tiếp hai dòng đó, cùng mẫu F-149-T2-7/F-150-T2-2).
- Bản copy build `apps/desktop/dist/services/epermRetry.js:116` — không kiểm lại đợt này (T2-148 đã xác nhận md5 giống hệt bản src — artifact build, không phải helper mới).

### 2.10 Quét EPERM trong cửa sổ mù

- **98 file *.log** có mtime trong cửa sổ mù. Đếm: "sóng EPERM vẫn bật" **11**, "CẢNH BÁO" **10**, "Operation not permitted" **2**, "sóng EPERM đã tắt" **1** — **tất cả 24 hit đều nằm trong CÙNG MỘT file `round150-t2/eperm-sweep-run.log`** (log quét của T2-150 tự trích tên marker trong output của chính nó + output đợt 149 — false positive tự tham chiếu, xem F-149-T2-3; mẫu lặp lại đợt này; đã đối chiếu độc lập theo từng file: chỉ 1 file chứa hit). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~206 h** trước probe #70). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-151 — KHÔNG: không có reboot mới trong phiên

- Boot lúc mở phiên (02:39:33Z), lúc probe (02:40:07Z) và lúc kiểm đóng (02:55:37Z) đều là **2e430750, btime 01:25:51Z**. Không mở mù #74?.
- Reboot #41 xảy ra TRƯỚC phiên (01:25:51Z, ~1h14' trước lượt cron 09:35 +07) — xem §2.12.
- **dmesg KHÔNG thử đọc đợt này** (T2-148 đã xác nhận `Operation not permitted` — không lặp lại thao tác đã biết chặn). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).

### 2.12 Mù #72? + mù #73? — CHỨNG NHẬN (không còn chỉ ghi nhận)

- **Mù #72? (reboot #40, 802f358f → e9295700): ĐÓNG HOÀN TOÀN.** Đoạn F'-body đóng đợt 150 (max gap 1.014 s); đoạn G-full đóng đợt này (max gap 380 s); khung #115? 1.220 s danh nghĩa ([1.218, 1.221] s giờ thực); gap #40 chứng nhận dạng khoảng **[7.696, 7.700] s, giữa 7.698 s** → CERT 72 / FULL 87.
- **Mù #73? (reboot #41, e9295700 → 2e430750): ĐÓNG HOÀN TOÀN.** Đoạn G-full đóng (max gap 380 s); đoạn H đóng (max gap 702 s); khung #116? 42 s danh nghĩa (≈ 42 ± 2 s giờ thực); gap #41 chứng nhận dạng khoảng **[6.820, 6.824] s, giữa 6.822 s** → CERT 73 / FULL 88.
- **Chuỗi mù đóng hoàn toàn 7 → 9 (chờ parent xác nhận):** hai mù đóng trong cùng một đợt — lần đầu tiên hai mù đóng cùng lúc kể từ khi chuỗi bắt đầu (các đợt trước mỗi đợt tối đa một mù).
- **INSIDE chuỗi 2 → 3 (theo chuẩn đứng, chờ parent xác nhận cùng CERT/FULL):** btime 2e430750 INSIDE dải FULL87 neo e9295700 [23:58:21Z, 01:56:58Z] (xem §2.5).
- **Phạm vi:** chứng nhận đợt này dùng cửa sổ [btime #40 23:32:09Z → probe #70 02:40:07Z] (11.278 s) với các đoạn G-full + H; tiền đề F'-body lấy từ chứng nhận đợt 150 (không đo lại — hồ sơ đã đóng).

## 3. RAM trong cửa sổ mù (đọc sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10; chuẩn đứng: báo MAX MemAvailable theo % guard)

- **Đỉnh cửa sổ mù: 2.164.956 kB = 2.114,2 MiB (T9-150 sampler, 00:09:35Z, đoạn G) = 34,41% guard 6.144 MiB.** Đây là đỉnh chung đã được T9-150 báo cáo (aggregate 150 §9: "RAM đỉnh 34,41% (T9)") — T2-151 đo độc lập từ cùng log gốc, khớp đúng số.
- **0 mẫu ≥ guard trong toàn cửa sổ:** T9-150 0/95 + T8-150 0/38 (tổng 0/133). **Birefnet 0 thử** — cơ chế tự động (a) đã nối từ T9-147 nhưng 0 mẫu ≥ guard nên không kích hoạt lần nào (đúng thiết kế — lần thứ năm liên tiếp 0 lần thử).
- Đỉnh từng đoạn: G **2.114,2 MiB** (00:09:35Z, T9-150) = 34,41% guard; H **0 mẫu sampler hợp lệ** (T9-150 dừng 01:19:38Z khi T9 đóng — không phải do reboot; T8-150 dừng ở mẫu cuối boot cũ 01:26:12Z — thuộc boot cũ, đã loại khỏi H; chỉ có đọc tay T2-151: MemAvailable 1.272.880 kB lúc 02:40:14Z).
- Avail min trong cửa sổ: **308.224 kB = 301 MB (T8-150, 01:24:11Z, đoạn G)** — khớp đúng số aggregate 150 §9 "avail min 301 MB boot1". Dấu thời gian mẫu này là đồng hồ cũ (drift — xem §2.2); giá trị là thật.
- Balloon: đoạn G tối đa **6.443.824 kB** (T9-150, 100% trần, **28 mẫu ghim** — khớp đúng số T9-150 28/97 trong cửa sổ harness; chuỗi ghim trần đợt 150 đã có quyết parent 150 (e) — T2-151 không phán nối/đứt, giao T10); đoạn H 0 mẫu sampler hợp lệ nên không có số balloon.
- Lưu ý: đỉnh cửa sổ này (34,41% guard) thấp hơn đỉnh mù #71? (37,23%) và thấp hơn đỉnh mù #68/#69?/#70? (57,26%); cửa sổ guard KHÔNG tái mở đợt này (0 mẫu ≥ guard lần thứ năm liên tiếp sau đợt 147/148/149/150).

## 4. Phương pháp + sai số của chính T2-151

### 4.1 Phương pháp

- Chứng nhận mù theo **luật gap** (merged 4 phạm vi: repo-1 + hidden_files + ngoài hai cây + /tmp, độ chính xác giây; floor = 1.147 s): max gap < sàn → đoạn đóng, max ẩn = 0; mỗi mốc có mtime giây + nguồn file + (với mốc ngoài cây) file đã tự tạo trong hai cây. Mốc thuộc boot cũ theo nội dung (86n2 log 01:25:58Z, ram log 01:26:12Z) được LOẠI khỏi mốc đầu đoạn H sau khi kiểm nội dung (quy tắc CLOCK RULE đứng) — verdict không đổi (head gap 7 s → 40 s, max gap vẫn 702 s).
- Chuẩn mới: **mọi số btime/gap dùng /proc/stat** (quyết parent 148 (b)); /proc/1 chỉ ghi kèm để đối chiếu. Đếm mù: đếm chặt (e9295700 = #116?, 2e430750 = #117?) — cùng chuẩn với đợt 147/148/149/150 (quyết 146 (a)). Chứng nhận gap **DẠNG KHOẢNG** với mid dùng cho thống kê (chuẩn mới quyết parent 149 (c), tiền lệ #58/#63/#39).
- Khung nhiệm vụ đợt 151 (phân tách mù #72?/#73?): mù #72? lấy đoạn F'-body (đóng đợt 150) + G-full; mù #73? lấy G-full + H. T2-151 tuân khung này: chứng nhận cả hai (G-full đóng là tiền đề chung).
- Hole recheck: quét mtime toàn cây /home/hatch + /var/log trong 6 hố — 0 mốc nội bộ mới trong cả 6 hố (chỉ trúng chính mốc cạnh trái, bẫy float; lần thứ sáu liên tiếp).
- RAM: đọc sampler log (T9-150/T8-150) + script ram-max (đối chiếu — lần này khớp đọc tay sau khi sửa quy ước, xem F-151-T2-1); đỉnh báo cáo lấy theo max MemAvailable (chuẩn đứng T2-148/149/150).
- **Prereg cho T2-151 (phiên MỞ đầu, trước probe):** đã dự báo (a) probe #69 stale ~10.200 s (đúng: 10.507 s); (b) G-full đóng theo luật gap + gap #40 [7.696, 7.700] s (đúng); (c) H đóng theo luật gap + gap #41 [6.820, 6.824] s NẾU e5/e6 ∈ [−1, +1] — đúng, VÀ đã dự báo trước xung đột với nghịch lý 7 s (đúng: nghịch lý mạnh hơn, ≥ +20 s — nhưng đã chứng minh nó không làm rộng khoảng gap, xem §2.2); (d) khung #116? ~10–60 s (đúng: 42 s); (e) INSIDE 2e430750 → chuỗi 2 → 3 (đúng); (f) F113? đủ 3 server (đúng); (g) chốt chặn không tồn tại (đúng); (h) run 150 thuộc T7-151 (đúng — không phán thay).

### 4.2 Sai số của chính T2-151 (danh sách đầy đủ — không giấu lỗi)

- **F-151-T2-1:** `ram-max72.py` v1 tính theo quy ước SAI (used = tổng RAM − avail, rồi so used với guard — cho "đỉnh 95,10% guard"). Đã bắt được khi đối chiếu với số T9-150 đã báo (đỉnh 34,41% guard): chuẩn đứng là báo MAX MemAvailable theo % guard (birefnet cần từng đó RAM TRỐNG). Đã sửa script theo chuẩn đứng, chạy lại: số khớp đúng T9-150 (2.164.956 kB, 34,41%, 00:09:35Z). File `ram-max.txt` cuối là từ bản đã sửa. Bài học: mọi số RAM phải đối chiếu với LIMITS của luồng sampler trước khi ghi.
- **F-151-T2-2:** `blind72-gaps.py` v1 dùng `N.get("CERT71")`/`N.get("FULL86")` (hoa) — `blind71-gaps.py` định nghĩa `cert71`/`full86` (thường). Lỗi TypeError (None.len) ngay khi chạy; đã sửa thành thường, chạy lại thành công. Không ảnh hưởng số liệu (lỗi xảy ra trước khi ghi output nào).
- **F-151-T2-3:** sai số học trong docstring của 3 script viết mới (`blind72-investigate.py`/`blind72-merged.py`/`blind72-gaps.py`): G-full ghi 7.698 s (thực 6.822 s — nhầm với gap #40), H ghi 4.446 s (thực 4.456 s), cửa sổ ghi 10.918 s (thực 11.278 s). CHỈ sai chú thích — mọi phép tính dùng timestamp epoch trực tiếp nên số liệu đúng (merged log in đúng 6.822 s / 4.456 s / 11.278 s). Bài học: kiểm lại số học trong docstring trước khi chạy (cùng họ F-145-T2-1).
- **F-151-T2-4:** hai lần grep mốc ranh giới dùng định dạng giờ có khoảng trắng (`2026-11-20 01:2…`) trong khi file điều tra ghi định dạng T (`2026-11-20T01:2…`) — trả 0 dòng, tưởng không có mốc. Đã chạy lại với định dạng T, đủ mốc. Không ảnh hưởng số liệu (chỉ là lệnh kiểm tra, chạy lại ngay).
- **F-151-T2-5:** lần chạy F113? đầu tiên dùng `grep "^date:|^HTTP" | head -3` nên thấy cả 2 dòng HTTP (proxy CONNECT + status thật) lẫn Date — không sai kết quả (Date vẫn đọc được cả 3 server), chỉ thừa dòng. Không cần chạy lại (khác F-150-T2-1: lần đó lọc sai làm mất Date). Ghi nhận để lần sau lọc riêng `^date:` ngay từ đầu.

### 4.3 Câu hỏi cho parent (chỉ câu hỏi MỚI của đợt 151 — các câu hỏi cũ đã quyết không nhắc lại)

(a) **Mù #72? + mù #73? ĐÓNG HOÀN TOÀN? Chuỗi đóng hoàn toàn 7 → 9?** G-full đóng theo luật gap (max 380 s), H đóng theo luật gap (max 702 s); F'-body đã đóng đợt 150 (max 1.014 s). Gap #40 chứng nhận **DẠNG KHOẢNG [7.696, 7.700] s (giữa 7.698 s)** → **CERT 72 / FULL 87**; gap #41 chứng nhận **DẠNG KHOẢNG [6.820, 6.824] s (giữa 6.822 s)** → **CERT 73 / FULL 88** (mids dùng cho thống kê; mid = đúng số danh nghĩa cả hai). Nếu parent đồng ý: chuỗi mù đóng hoàn toàn 7 → **9** (hai mù đóng cùng một đợt — lần đầu tiên); CERT 73 / FULL 88 là số chính thức đợt 151.
(b) **Khung chết #116? chốt bản nào?** Danh nghĩa (01:25:09Z, 01:25:51Z] = **42 s** (mốc runtime, tiền lệ #115?); bản giờ thực ≈ **42 s ± 2 s**. Bản đọc chỉ-bằng-đồng-hồ-VM cho **74 s** (mốc cuối VM 01:24:37Z) — T2-151 đề xuất KHÔNG dùng (dấu VM gần lúc chết bị drift ≥ +20 s phình lên). Parent chốt 42 s hay 74 s?
(c) **Nghịch lý đồng hồ — cận dưới mới ≥ +20 s (ram log) thay cho 7 s trong brief:** T2-151 chỉ ghi nhận theo quyết parent 150 (p), không mở điều tra mới. Cận +20 s có được ghi vào hồ sơ chính thức (GAP/aggregate) không, hay chỉ ghi trong LIMITS này?
(d) **INSIDE chuỗi 2 → 3** (btime 2e430750 INSIDE cả ba dải FULL87/FULL86/FULL85 neo 23:32:09Z) — ghi nhận cùng (a) (không có câu hỏi riêng).
(e) **F113? ≈ 0/+1 s, ĐỦ 3 SERVER** (cloudflare 200 lần này) — ghi nhận (không có câu hỏi).
(f) **/proc/1 lệch 0,51 s** — ghi nhận, không điều tra (trong sai số làm tròn, nhỏ hơn 0,91 s đợt 150).
(g) **WFS #57 chênh 0 (lần thứ 57); RAM đỉnh 34,41% guard, 0 mẫu ≥ guard; birefnet 0 thử lần thứ năm liên tiếp** — ghi nhận (không có câu hỏi).
(h) **Đếm CERT73/FULL88 — T10 kiểm lại** (như mọi đợt: T10 xác nhận đếm cuối bằng dedup toàn cục trước khi đóng sổ đợt 151; số đếm CHỈ lấy từ output script — quyết parent 150 (s)).

### 4.4 Ghi chú cho T10-151 (đóng sổ đợt 151)

- Đợt 151 dùng **chuẩn btime /proc/stat** cho mọi số (quyết parent 148 (b)) — T10 kiểm lại đếm cuối bằng dedup toàn cục (không cộng round-unique vào lũy kế — bài học AGENTS.md đợt 126–127 + quyết parent 150 (s): số đếm cuối CHỈ lấy từ output script).
- **Đưa `npm test` vào suite đóng sổ chuẩn từ đợt 149** (quyết parent 148 (k) — V19 đã nối vào `test_integration.sh` theo quyết parent 150 (j), đếm integration 11 → 12, giao T0-151).
- **O8 chạy sau cờ T4** (quyết parent 148 (c) — điều kiện chấp nhận trích dẫn đợt 148; từ đợt 149 trở đi tuân (j) — quyết parent 149 (f): trích là "harness sau khi T4 đóng cờ"; đợt 150 là ngoại lệ lệch chuẩn đã được chấp nhận ở quyết 150 (f) — trích là "harness sau khi poller T4 thoát (01:00:32Z), T4 0 attempt").
- **Chuẩn nguồn btime /proc/stat** đã áp dụng trong LIMITS này; các số /proc/1 chỉ còn để đối chiếu.
- **Mốc uptime 20:10:28Z (e2 > 595 s) BỊ LOẠI khỏi cận** — T10 không dùng làm cận cho gap #38 (xem §2.2 đợt 149 + quyết parent 149 (b)(i)).
- **Câu hỏi INSIDE/khung #116? §4.5 (a)(b) cần parent phán trước khi T10 chốt chuỗi INSIDE + khung chết trong aggregate** — T10 ghi cả hai số khung (42 s theo runtime / 74 s theo VM-only) kèm chú thích chờ quyết, đừng tự chọn một bên.
- **Kiểm cờ `.done` trên đĩa** (quyết parent 150 (t)) — T10 ghi rõ "x/9 cờ" trong §10; T2-151 đã viết cờ của mình trước khi báo đóng.

## 5. File + stage

**File duy nhất của batch (LIMITS này):**
- `docs/PHASE9_ROUND151_T2_EPERM_LIMITS.md` — (kích thước/md5 xem cờ round151-t2.done; file > 37.768 byte → push cần ENABLE_PRIVSEP=0)

**Stage (không push):** `~/workspace/repo-1-push/paths-loop/phase9-round151-t2-eperm.txt` — 1 entry, NUL-delimited, text-only, 0 binary (verify bằng `od -c`).

**Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round151-t2.done` — 1 dòng tóm tắt + kích thước/md5 LIMITS.

**File làm việc (không stage, chỉ để đối chiếu):** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round151-t2/` — prereg-t2.md, boot-verify.txt, status1.txt, once.txt, status2.txt, f113.txt, blind72-investigate.py/.log, blind72-merged.py/.log, blind72-sessions.py/.log, blind72-fifthscope.py/.log, blind72-gaps.py/.txt, hole-recheck.py/.txt, eperm-sweep72.py + eperm-sweep-run.log, ram-max72.py + ram-max.txt, scan-wfs.sh + scan-wfs-run.log + scan-meta.txt + files-newstd.bin/files-r7b.bin/files-copies.txt + wfs-newstd.txt/wfs-r7b.txt/wfs-copies.txt, blind72-repo-1.txt, blind72-hidden_files.txt, blind72-outside.txt, blind72-tmp.txt, sessions-all.txt.
