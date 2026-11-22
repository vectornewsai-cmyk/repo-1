# PHASE9 ROUND155 T2 — EPERM probe #74 + mù #81? ĐÓNG theo luật gap (T 232 s / U 498 s, max ẩn 0) + reboot #50 ỨNG VIÊN TRONG PHIÊN (d849728b, btime 15:04:07Z) + #74?/#75? ĐÓNG theo chuẩn mốc merged mới (J 934 s) + #76? ĐÓNG / #77? MỞ xác nhận lại — LIMITS

## 0. Headline

- **Probe EPERM #74: ok=2 fail=0, boot 12fc68a3, 14:43:07Z.** Probe trước (#73) đã chết/stale 11.091 s (3h04'51", n=73, ts 11:38:16Z, boot 2c0a7985). Log `eperm-probe-v2.log` 211 → **214 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe — đúng mẫu mọi lượt)**. Vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11), 0 dòng `=== probe end`. **F118? ≈ 0/+1 s, ĐỦ 3 SERVER** (boot mới 12fc68a3, đồng hồ CHÍNH XÁC).
- **Mù #81? (reboot #49, 2c0a7985 → 12fc68a3): ĐÓNG THEO LUẬT GAP — cả hai đoạn T/U đều đóng, max ẩn 0.** T max gap **232 s**; U max gap **498 s** (sau CLOCK RULE; head U 37 s theo mốc file, 18 s theo khung wtmp). Gap #49 ứng viên **[5.945, 5.949] s, giữa 5.947 s** → CERT81/FULL96 ỨNG VIÊN CÓ ĐIỀU KIỆN. **CERT/FULL chính thức GIỮ 73/88** (chờ quyết parent — xem §4.3 (a)).
- **⚠️ PHÁT HIỆN MỚI — BẰNG CHỨNG MỚI CHO #74?/#75?: ĐOẠN J ĐÓNG THEO CHUẨN MỐC MERGED MỚI.** Áp dụng chuẩn đứng (quyết (c) đợt 154 — mốc merged dùng thêm vào luật gap, nhất quán không chọn lọc) cho đoạn J-full (đợt 152): max gap **1.589 s → 934 s** (87 dòng sampler T9-151 boot=fad2aab9 + 1 event HB dispatch 04:15:34Z; 28 mốc thêm trong hố cũ, cadence tối đa 61 s) → **J ĐÓNG → #74? + #75? ĐÓNG theo luật gap dưới chuẩn đứng** (xem §2.13). Đây là bằng chứng mới — parent quyết có chấp nhận đóng hay không (§4.3 (b)). Nếu chấp nhận: CERT76/FULL91 thành số chính thức (chuỗi #74?+#75?+#76?); chuỗi đóng hoàn toàn liên tục 9 → **12**; CERT77/FULL92 vẫn chặn ở #77? (mở).
- **#76? ĐÓNG / #77? VẪN MỞ — XÁC NHẬN LẠI BẰNG TÍNH LẠI (không phải thí nghiệm nữa):** chạy lại y nguyên phép tính đợt 154 dưới chuẩn đứng: L max gap **60 s** ĐÓNG, M **81 s** ĐÓNG, N **1.308 s** MỞ (khớp đúng số đợt 154) → #76? ĐÓNG (đảo đóng riêng), #77? VẪN MỞ. Chuỗi đóng hoàn toàn GIỮ 9 cho tới khi parent quyết (b).
- **Chuỗi INSIDE cũ ĐỨT tại #48 KHÔNG nối lại — chuỗi MỚI bắt đầu ở #49 với 1 (ứng viên):** btime 12fc68a3 13:05:12Z **INSIDE** dải FULL95 neo 11:26:05Z [11:52:14Z, 13:48:55Z] (tính lại khớp đúng dải đợt 154). Dải cho boot tiếp theo (FULL96 neo 13:05:12Z): [13:31:23Z, 15:27:42Z] — ghi nhận: btime boot mới d849728b 15:04:07Z nằm TRONG dải này (T2-156 kiểm chứng chính thức).
- **⚠️ REBOOT #50 ỨNG VIÊN TRONG PHIÊN (sau probe #74):** boot mới **d849728b-b8b9-43d4-b3f5-e218facbfdb0, btime 15:04:07Z**, xác minh bằng 4 nguồn độc lập lúc 15:10:48Z (/proc/1 lệch 0,84 s; journal 1 boot, entry đầu btime +17 s; wtmp bắt đầu btime +16 s). Mọi phép đo của T2-155 (probe #74, merged, sessions, gaps, RAM, sweep, WFS, L/M/N, J) đều chạy TRƯỚC reboot này trên boot 12fc68a3 — **#81? không bị ảnh hưởng**. Gap #50 danh nghĩa 7.135 s. Mù #82? giao T2-156 (cửa sổ probe #74 → probe #75); (m) tại #50 thuộc T7-155.
- **Nghịch lý đồng hồ tại #49 — ≥ +20 s (đã biết, T8-154; T2-155 xác nhận độc lập bằng nội dung file):** mốc boot cũ stamped tới **13:05:32Z** (gate0wait-117.log, vượt btime 20 s) + **13:05:31Z** (replay-watch-154.log, boot=2c0a7985 trong nội dung). Hai mốc này bị LOẠI khỏi đầu đoạn U theo CLOCK RULE (head U 19 s → 37 s). Khung chết #125? KHÔNG xác định bằng số danh nghĩa (xem §2.4).
- **RAM đỉnh cửa sổ mù: 3.211.344 kB = 51,04% guard** (T9-154 sampler, 11:43:41Z, đoạn T — trùng số T9-154 đã báo). **0/127 mẫu ≥ guard → birefnet 0 thử lần thứ chín liên tiếp.** Balloon ghim trần: T 52 + U 13 = **65 mẫu** trong cửa sổ.
- **WFS #61: chênh 0 — lần thứ 61 liên tiếp.** NEWSTD 982 dòng / 286 file; R7b 1.007 / 303; copies 25 / 17. Delta +1 dòng / +1 file giải thích đầy đủ bằng LIMITS T2-154 nhắc chuỗi trong văn bản.
- **EPERM: 0 sóng thật.** Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~218,8 h** trước probe #74). EPERM chưa tuyên bố hết.
- **Quyết parent đợt 154 ĐÃ ÁP DỤNG làm chuẩn trong LIMITS này** ((a) đợt 154 CHẤP NHẬN; (b) #78?/#79?/#80? GIỮ MỞ, CERT/FULL GIỮ 73/88; (c) mốc merged THÀNH CHUẨN ĐỨNG → #76? ĐÓNG, #77? MỞ; (d) gỡ provisional run 152 (SUCCEEDED không điều kiện); (e) watcher (3) làm hướng đứng; (f) n (m) ứng viên 9; (g) O8 chuỗi giữ 11; (h) balloon 1 episode; (i) headroom 0 chỉ theo dõi; (j) birefnet giữ nguyên; (k) #49 xác nhận, mù #81? giao T2-155; (l) run 154 thuộc T7-155; (m) T10 không chạy lại suite đợt 154 — chấp nhận; (n) cờ có nội dung giữ nguyên; (o) H3 chỉ giám sát thụ động; (p) giữ nguyên điều kiện yên) — chỉ câu hỏi MỚI phát sinh ở đợt 155 ghi ở §4.3.

## 1. Checklist probe EPERM #74 (P8 §2.3) — tất cả exit đọc trực tiếp, không tee

| Bước | Giờ (UTC 20/11) | Kết quả |
|---|---|---|
| Đọc boot lúc mở phiên | 14:39:58Z | 12fc68a3-10f4-4459-908f-b0a47615afae, btime /proc/stat 1795179912 = 13:05:12Z — **KHỚP brief (reboot #49, parent XÁC NHẬN số hiệu #49 ở quyết (k) đợt 154)** |
| Chốt chặn round-in-progress.md | 14:39:58Z | **KHÔNG TỒN TẠI** → làm việc bình thường |
| `status` | 14:43:06Z | **DEAD/STALE**, heartbeat n=73, ts 2026-11-20T11:38:16Z, boot 2c0a7985, tuổi **11.091 s (3h04'51")**, exit 1 (đo trực tiếp, không tee) |
| `once` | 14:43:07Z | **Probe #74, boot=12fc68a3, ok=2 fail=0**, exit 0; dòng log `boot changed 2c0a7985 -> 12fc68a3 (uptime since 2026-11-20 13:05:12)` |
| `status` lại | 14:43:07Z | **ALIVE**, tuổi 0 s, n=74, exit 0 |
| Log probe | 14:43:07Z | `eperm-probe-v2.log` 211 → **214 dòng (+3: 1 DEAD + 1 boot-changed + 1 probe)**; heartbeat n=74, ts 2026-11-20T14:43:07Z, boot 12fc68a3, pid=29171; vẫn đúng 1 dòng `probe start` (08:49:50Z 11/11) và 0 dòng `=== probe end`; đối chứng độc lập: heartbeat file đọc lại sau once, ts=14:43:07Z, boot=12fc68a3, n=74 — khớp |
| Xác minh boot #49 | 14:43:20Z | Cùng boot_id/btime; `/proc/1` 13:05:29,164Z; `/proc/1/stat` starttime 1.638 ticks = **16,38 s sau kernel boot** → PID 1 start wall = 13:05:12Z + 16,38 s = 13:05:28,38Z ≈ /proc/1 mtime 13:05:29,164Z (lệch **0,78 s** — cùng họ 0,51 s đợt 151 / 0,83 s đợt 152 / 0,91 s đợt 150 / 0,88 s #45 / 0,67 s #46 / 0,04 s #48; **T0-155 đo độc lập F +0,78 s — khớp**); `uptime -s` = 13:05:12Z (= /proc/stat); uptime 1:38 lúc 14:43:20Z (làm tròn phút, nhất quán); journal đúng 1 boot, entry đầu 13:05:29Z = btime +17 s; `last reboot` 13:05 still running; wtmp bắt đầu 13:05:29Z = btime +17 s; btmp/lastlog/wtmp mtime 13:05:30Z = btime +18 s |
| Xác minh boot lúc đóng | 15:10:48Z | **Boot ĐÃ ĐỔI: d849728b (reboot #50 ứng viên, btime 15:04:07Z)** — xem §2.11. Mọi phép đo của T2-155 đều chạy trước reboot này trên 12fc68a3 |
| dpkg.log boot 12fc68a3 | — | **T2-155 KHÔNG kiểm độc lập trong phiên** (chỉ kiểm dpkg.log lúc 15:09Z thì đã là boot mới d849728b; file dpkg.log của 12fc68a3 đã mất theo #50). **T5-155 ĐÃ GHI (đối chiếu chéo): POSTBOOT_PASS #49 14:42:38Z, dpkg 1.545 dòng md5 19522dc0 ổn định, replay #49 tự xong boot+5m54s** — xem LIMITS T5-155; T2 ghi nhận, không phán thay |
| F118? | 14:43:22–24Z | example.com Date 14:43:22 (+1 s), google.com 14:43:23 (+0 s), cloudflare.com 14:43:24 (+1 s, sai số làm tròn header Date 1 s) → **F118? ≈ 0/+1 s, ĐỦ 3 SERVER** (lọc riêng `^date:` ngay từ đầu — bài học F-152-T2-1 đã áp dụng, không tái phạm) |

## 2. Điều tra mù #81? + #76?/#77? xác nhận lại + #74?/#75? bằng chứng mới

### 2.1 Sự kiện — cửa sổ và các đoạn

- **Cửa sổ mù (probe-to-probe): 11:38:16Z → 14:43:07Z = 11.091 s (3h04'51")** — từ probe #73 tới probe #74. Cửa sổ điều tra = cửa sổ mù.
- Một reboot trong cửa sổ (#49 — không có reboot nào trong phiên T2 sau probe #74 cho tới 15:04:07Z, xem §2.11):

| Đoạn | Boot | Btime (/proc/stat) | Btime (/proc/1) | Dài (danh nghĩa, đồng hồ) | Chết lúc |
|---|---|---|---|---|---|
| T | 2c0a7985 (#124?) | 11:26:05Z 20/11 (1795173965) | 11:26:15Z | 5.216 s (từ probe #73) | 13:05:12Z (#49) |
| U | 12fc68a3 (#125?) | 13:05:12Z 20/11 (1795179912) | 13:05:29Z | 5.875 s (tới probe #74) | (còn sống lúc probe #74) |

- Gap danh nghĩa #49 = **5.947 s** (tuổi thọ 2c0a7985 — btime 13:05:12Z − 11:26:05Z).
- Độ trễ init (starttime ticks): 2c0a7985 10,51 s (đợt 154); 12fc68a3 16,38 s — hòa giải được bằng số (PID 1 start wall ≈ /proc/1 mtime, lệch 0,78 s; xem §1).
- Nguồn quan sát mốc cuối mù: T10-154 đóng sổ trên boot 12fc68a3 ~14:13Z; parent viết §12.3 aggregate 154 ~14:2xZ; lượt cron 155 mở 14:35:51Z; probe #74 14:43:07Z.

### 2.2 Đánh số + đồng hồ — chuẩn parent + nghịch lý tại #49

- **Quyết parent đợt 154 (§12.3) ĐÃ ÁP DỤNG:** (a) đợt 154 CHẤP NHẬN; (b) **#78?/#79?/#80? GIỮ MỞ → CERT73/FULL88, giao T2-155 kiểm #81?**; (c) **mốc merged THÀNH CHUẨN ĐỨNG → #76? ĐÓNG, #77? MỞ**; (d) **gỡ provisional run 152**; (f) **n (m) ứng viên 9**; (k) **số hiệu #49 xác nhận, mù #81? giao T2-155**; (l) run 154 thuộc T7-155.
- **F117? (C10, 2c0a7985) ≈ 0/+1 s, ĐỦ 3 SERVER** (11:38:33Z, T2-154 §1) → e_cũ(lúc ghi btime 2c0a7985) ∈ [−1, +1] s THEO GIẢ ĐỊNH ĐỨNG (đo lúc 11:38Z, sau khi btime đã ghi — xem giả định ở §2.5). **F118? (C11, 12fc68a3) ≈ 0/+1 s, ĐỦ 3 SERVER** (14:43:22Z, §1) → e_mới(lúc ghi btime 12fc68a3) ∈ [−1, +1] s THEO GIẢ ĐỊNH ĐỨNG.
- **Journal boot 12fc68a3 liên tục, 0 dòng chỉnh giờ:** journalctl đúng 1 boot; entry đầu 13:05:29Z; 0 dòng timesyncd/chrony/step/synchronized/clock trong journal boot 12fc68a3 (kiểm bằng grep lúc 14:43:20Z). (dmesg KHÔNG thử đọc — T2-148 đã xác nhận `Operation not permitted`.)
- **NGHỊCH LÝ ĐỒNG HỒ TẠI #49 — ≥ +20 s (đã biết, T8-154; T2-155 XÁC NHẬN ĐỘC LẬP BẰNG NỘI DUNG FILE):** mốc boot cũ stamped tới **13:05:32Z** (`round154-t4/postboot-t4-154-gate0wait-117.log`, mtime 13:05:32.429Z — file postboot của T4 trên boot cũ, nội dung chỉ có kết luận postboot boot 11:26:05) + **13:05:31Z** (`round154-t5/replay-watch-154.log`, mtime 13:05:31.903Z, dòng nội dung cuối `13:05:31Z boot=2c0a7985 poll ...` — poll cuối của watcher T5 trên boot cũ). Cả hai đều vượt btime mới 13:05:12Z (19 s / 20 s) → e_cũ(lúc chết) ≥ **+20 s**. Cùng họ 5–20 s (#41 ≥+20 s, #42 ≥+18 s, #44 ≥+10 s, #46 ≥+5 s). **Ghi nhận + xác nhận độc lập, không điều tra mới về cơ chế.** Nghịch lý này ảnh hưởng KHUNG CHẾT #125? (xem §2.4), không làm thay đổi khoảng gap #49 (xem §2.5 — phân tích độ nhạy).
- **Sampler T9-154 KHÔNG cho thấy nghịch lý #49:** dòng cuối boot=2c0a7985 là **13:04:42Z** (trước btime 30 s); dòng đầu boot=12fc68a3 là **13:06:17Z**. Sampler poll 60 s nên bỏ lỡ cửa sổ 13:04:42–13:05:12Z — nghịch lý chỉ lộ qua file poll 30 s (replay-watch) + file T4.
- **Mâu thuẫn full boot_id b47f7932 — VẪN ĐỂ MỞ (không có dữ kiện mới, quyết (g) đợt 143):** T2-155 không tự chọn một bên, mọi số đếm chỉ dùng short_id 8 ký tự đã xác nhận.
- **Replay boot 12fc68a3:** T2-155 không kiểm độc lập dpkg.log trên 12fc68a3 (xem §1). **T5-155 ĐÃ GHI: POSTBOOT_PASS #49 14:42:38Z, dpkg 1.545 dòng md5 19522dc0 ổn định, replay #49 tự xong boot+5m54s** — T2 ghi nhận (đối chiếu chéo), không phán thay. Replay trên boot mới d849728b: T5-155 theo dõi tiếp.

### 2.3 Hoạt động từng đoạn (hai cây + sessions + ngoài cây + /tmp + đuôi)

**Hai cây (repo-1 + hidden_files), độ chính xác giây:**
- repo-1: **15 file** (14 mốc giây); hidden_files: **352 file** (214 mốc giây). Tổng hai cây **228 mốc giây khác nhau** (14 + 214 file — có trùng giây giữa hai cây). Ngoài cây: **240 file** (133 mốc giây). /tmp: **644 file** (25 mốc giây — nhiều file cùng giây). Tổng 4 phạm vi: **364 mốc giây khác nhau**.
- Đoạn T: **167 mốc merged**; đoạn U: **195 mốc merged** (sau CLOCK RULE — xem §2.4; trước CLOCK RULE là 197).

**Sessions (`~/workspace/agents/`, 329 exec-log, 329 file có birth/mtime dùng được — TĂNG 20 so với 309 đợt 154; 42 file cũ biến mất, 0 file biến mất có mtime trong cửa sổ mù, 0 file biến mất bắc qua hố lớn nào — xem dưới):**
- Bắc cầu: T-lo **4**, T-hi **3**, U-lo **4**, U-hi **0** (không session nào bắc qua cắt U-hi 14:24:00Z — cắt này nằm trong hố lớn nhất U 14:23:36→14:31:54Z, quãng yên sau khi T10 đóng sổ).
- Chạm đoạn: T **44**, T-tail **9**, U **23**, U-tail **8**, T-head-hole **2**, U-head-hole **0**.
- Nhân chứng nhảy (jump witness): **0 tại btime #49** — sạch (khác #45 đợt 153 có 1 nhân chứng số học đã gắn cờ là nội dung boot cũ).
- Nhắc boot trong exec-log trong cửa sổ: 2c0a7985 **38**, 12fc68a3 **15** (exec-log của chính phiên T2-155 có mtime sau probe #74 nên ngoài cửa sổ đếm — đúng phương pháp).
- **42 file exec-log cũ biến mất** (309 → 329, net +20; runtime dọn các agent dir cũ): đã đối chiếu với `sessions-all.txt` đợt 154 — **0 file biến mất có mtime trong cửa sổ mù, 0 file biến mất bắc qua hố lớn nào** (kiểm bằng script, xem file làm việc). Việc dọn này không ảnh hưởng bất kỳ verdict nào.

**Ngoài cây + /tmp + phạm vi thứ 5:**
- Ngoài hai cây: **240 file** trong cửa sổ (133 mốc giây). /tmp: **644 file** (25 mốc giây). Goals ngoài hidden_files: **0 file** trong cửa sổ (phạm vi ngoài cây đã bao gồm — kiểm riêng: 0 file goals ngoài hidden_files có mtime trong cửa sổ). Phạm vi thứ 5 (~/memory + ~/dreams + ~/side-chats): **0 file** trong cửa sổ.
- Đuôi/head (mỗi đoạn lấy 1 sàn 1.147 s ở đầu/cuối — đếm FILE thô, không phải mốc giây) — ngoài cây / /tmp / repo-1 / hidden_files: T-head **87 / 0 / 5 / 102** (đầu T dày đặc vì các luồng đợt 154 vẫn đang viết: T1/T2/T4/T6/T10 đóng cờ + T0 O8); T-tail **15 / 0 / 0 / 6** (đuôi T thưa dần về phía #49: mốc cuối 13:03:35Z); U-head **37 / 0 / 0 / 13** (đầu U: T4 poller khởi động lại + T8 waiter + T9 sampler trên boot mới); U-tail **25 / 599 / 1 / 77** (đuôi U: 599 file /tmp — burst file tạm của các luồng đợt 155 bắt đầu từ 14:35:51Z, dồn vào ít mốc giây nên không thu hẹp gap nào — cùng mẫu đợt 152).

**Ranh giới:**
- 12fc68a3 (đầu U): mốc đầu đoạn U theo timestamp là 13:05:31Z (replay-watch-154.log — THUỘC BOOT CŨ theo nội dung, đã LOẠI — xem §2.4); mốc boot-mới chắc chắn đầu tiên là **13:05:49Z** (live-config — file runtime, birth 13:05:49Z = mtime, tạo trên boot mới); mốc /var/log wtmp/btmp/lastlog **13:05:30Z = btime +18 s** (quan sát trực tiếp đợt này qua hole-recheck — xem §2.6). Mốc cuối đoạn T 13:03:35Z cách btime 97 s.
- 2c0a7985 (đầu T): mốc đầu đoạn T 11:38:16Z = probe #73 +0 s (file round154-t4/poll-t4.nohup.log — head 0 s).

### 2.4 Merged (4 phạm vi, độ chính xác giây) + kết luận từng đoạn

**364 mốc giây khác nhau** (repo-1 14, hidden_files 214, ngoài cây 133, /tmp 25). Sàn luật gap = 1.147 s (19'07").

| Đoạn | Mốc | Gap lớn nhất | Gap 2 / 3 | Mốc đầu (head) | Mốc cuối (tail) | Verdict |
|---|---|---|---|---|---|---|
| T | 167 | **232 s** (11:53:27→11:57:19) | 181 s / 181 s | 11:38:16 (+0 s) | 13:03:35 (−97 s) | **ĐÓNG — max 0 ẩn** (luật gap) |
| U | 195 | **498 s** (14:23:36→14:31:54) | 494 s / 281 s | 13:05:49 (+37 s) | 14:42:59 (−8 s) | **ĐÓNG — max 0 ẩn** (luật gap) |

**Đoạn T — ĐÓNG (max 0 ẩn, luật gap).** Gap lớn nhất merged 232 s < sàn 1.147 s. 167 mốc: đầu 11:38:16Z (poll-t4.nohup.log — head 0 s), cuối 13:03:35Z (exec-log proc_021797f4b794 — tail 97 s). T-lo 4 session bắc cầu; T-hi 3 session bắc cầu. Jump witness 0 tại btime #49.
- **Hố lớn nhất T 232 s (11:53:27Z → 11:57:19Z):** mốc trái là session jsonl agent-5aa53c73 (T2-154, 11:53:27Z — lúc T2-154 viết cờ/LIMITS); mốc phải là exec-log proc_02b5f000d189 (11:57:19Z). Trong hố: **0 mốc merged, 0 mốc sau recheck toàn cây + /var/log** (xem §2.6 — chỉ trúng bẫy float cùng giây cạnh trái). Hố nhỏ, không có gì đặc biệt: quãng T2-154 đóng cờ xong (11:53Z) tới khi các luồng khác viết tiếp (T6/T8/T10 đóng cờ 11:57Z trở đi).

**Đoạn U — ĐÓNG (max 0 ẩn, luật gap).** Gap lớn nhất merged 498 s < sàn 1.147 s. 195 mốc (sau CLOCK RULE): đầu 13:05:49Z (live-config cosmos_voice_profiles.json — head 37 s), cuối 14:42:59Z (file round155 — tail 8 s). U-lo 4 session bắc cầu; U-hi 0 session bắc cầu (xem §2.3). Jump witness 0 tại btime #49.
- **Hiệu chỉnh mốc đầu U (đã kiểm bằng nội dung + birth, không đoán):** mốc 13:05:31Z là file `round154-t5/replay-watch-154.log` — dòng nội dung cuối `13:05:31Z boot=2c0a7985 poll ...` → **thuộc boot cũ, LOẠI** (CLOCK RULE). Mốc 13:05:32Z là file `round154-t4/postboot-t4-154-gate0wait-117.log` — nội dung chỉ có kết luận postboot boot 11:26:05 (boot cũ), poller T4 bị #49 giết sau poll #117 → **thuộc boot cũ, LOẠI**. Mốc 13:05:49Z/13:05:52Z/13:05:54Z (live-config, subscriptions, system_prompt) là file runtime — **birth sau btime** (live-config birth 13:05:49.663Z = mtime; system_prompt birth 13:05:54.549Z) → thuộc boot mới, GIỮ LẠI. Mốc 13:06:00Z (.pki/nssdb cert9.db/key4.db/pkcs11.txt) — **birth 13:06:00.923Z sau btime** → tạo trên boot mới, GIỮ LẠI. Sau loại: head gap U 19 s → **37 s**; max gap U không đổi 498 s → **verdict ĐÓNG không đổi theo cả hai cách xử lý**.
- **Hố lớn nhất U 498 s (14:23:36Z → 14:31:54Z) — phân tích:** mốc trái là /tmp/mem-r153-sec.txt (14:23:36Z — file mem của T9); mốc phải là MEMORY.md + filesystem_watch_hashes.json (14:31:54Z — memory system ghi). Trong hố: **0 mốc merged, 0 mốc sau recheck toàn cây + /var/log** (xem §2.6). Hố có lời giải thích vận hành đầy đủ: sau T10-154 đóng sổ (~14:13Z) máy yên — parent viết §12.3 aggregate 154 (~14:2xZ), không còn luồng đợt 154 nào viết file; lượt cron 155 dispatch 14:35:51Z (file hatch live-config 14:35:36Z nằm sau hố). **CAVEAT GHI RÕ (dự báo prereg SAI — xem §4.2 F-155-T2-6): prereg dự báo U "CÓ THỂ MỞ ở đuôi" do quãng yên 14:13–14:35Z — thực tế U đóng, max gap chỉ 498 s. T2-155 đã đánh giá thấp mật độ ghi file trong quãng yên: MEMORY.md + filesystem_watch_hashes (14:31:54Z) + file dispatch (14:35:36Z) + file luồng 155 từ 14:35:51Z đã lấp quãng yên thành các gap ≤ 498 s.**
- **Hố thứ hai U 494 s (14:01:49Z → 14:10:03Z):** mốc trái là exec-log proc_fad3a6a411f7 (14:01:49Z); mốc phải là `phase9-round154-closing.txt` (14:10:03Z — file paths closing của T10-154). Trong hố: **0 mốc merged, 0 mốc sau recheck** (chỉ trúng bẫy float cùng giây cạnh trái). Không có gì đặc biệt: quãng T10-154 đóng sổ (T10 viết closing + aggregate 14:01–14:13Z, thưa file giữa các lần ghi).
- **Hố thứ ba U 281 s (14:18:55Z → 14:23:36Z):** mốc trái/phải đều là file /tmp/mem-r153(.txt/-sec.txt) của T9 — sampler ghi nối vào 1 file duy nhất (mtime chỉ còn lần ghi cuối). Đứng nguyên sau recheck.

**Khung chết (danh nghĩa theo timestamp):**
- **#125? (boot 2c0a7985): KHÔNG XÁC ĐỊNH BẰNG SỐ DANH NGHĨA.** Mốc cuối đoạn T theo file mtime là 13:03:35Z → khung danh nghĩa (13:03:35Z, 13:05:12Z] = **97 s** — NHƯNG mốc nội dung boot cũ stamped tới 13:05:31Z/13:05:32Z (vượt btime 19/20 s — nghịch lý #49) làm khung danh nghĩa này vô hiệu: boot cũ còn sống (theo đồng hồ cũ) tới ít nhất 13:05:31Z, tức giờ thực ≤ 13:05:11Z với e_cũ ≥ +20 s. Giới hạn giờ thực: boot cũ chết tại **13:05:12Z** (btime mới, F118? ≈ 0); sống tới ít nhất old-clock 13:04:42Z (sampler, dòng cuối) / 13:05:31Z (replay-watch poll cuối, theo đồng hồ cũ). Khung giờ thực hẹp (cỡ giây tới ~30 s theo cadence poll 30 s) nhưng KHÔNG pin chặt được bằng số — **giao parent quyết có chấp nhận khung ước lượng hay để mở** (câu hỏi §4.3 (e)). Khác #121? (đã có cửa sổ giờ thực (08:16:07Z, 08:35:51Z] từ đối chiếu host) — ở đây không có đối chiếu host cho #49.

### 2.5 Phân phối gap — CERT/FULL ỨNG VIÊN CÓ ĐIỀU KIỆN (CHƯA CHỨNG NHẬN — chờ quyết parent §4.3 (a))

- **Gap #49 ỨNG VIÊN DẠNG KHOẢNG: [5.945, 5.949] s, giữa 5.947 s** — đoạn T ĐÓNG + đoạn U ĐÓNG nên mù #81? đóng theo luật gap → gap #49 **CHỨNG NHẬN ĐƯỢC theo luật gap, nhưng vẫn là ỨNG VIÊN CÓ ĐIỀU KIỆN cho tới khi parent quyết** (chuỗi phụ thuộc — xem dưới); e_cũ lúc ghi btime 2c0a7985 ∈ [−1, +1] s (F117?); e_mới lúc ghi btime 12fc68a3 ∈ [−1, +1] s (F118? — GIẢ ĐỊNH ĐỨNG: đo lúc 14:43:22Z, sau khi btime đã ghi 1h38'; không có bước nhảy trong journal). **Số danh nghĩa 5.947 s NẰM TRONG khoảng ứng viên.** Khoảng nhạy cảm (chỉ để tham khảo độ nhạy, KHÔNG dùng làm khoảng chính thức — xem §2.2): nếu độ lệch +20 s lúc chết của boot cũ đã tồn tại lúc ghi btime thì [5.945, 5.968] s (công thức đợt 154: [nominal−2, nominal+cap+1]).
- **CERT81 (ỨNG VIÊN CÓ ĐIỀU KIỆN — gap #49 [5.945, 5.949] s, mid 5.947 s):** n=81, mean **1h36'50"**, median **1h50'39"**, p10 **0h24'45"**, p90 **2h16'19"**, sd **0h50'12"**, min **0h00'55"**, max **5h14'27"**; trong 90–150' = **45**, <60' = **18**, >180' = **4**, >240' = **1**. **FULL96 (ỨNG VIÊN CÓ ĐIỀU KIỆN):** n=96, mean **1h41'28"**, median **1h53'21"**, p10 **0h26'11"**, p90 **2h22'30"**, sd **0h57'03"**, min **0h00'55"**, max **5h43'18"**; trong 90–150' = **52**, <60' = **21**, >180' = **7**, >240' = **3**.
- **CHUỖI PHỤ THUỘC (đọc kỹ — không phải số độc lập):** CERT81/FULL96 yêu cầu #74? + #75? + #76? + #77? + #78? + #79? + #80? + #81? đều đóng (gap #42/#43/#44/#45/#46/#47/#48/#49 đều chứng nhận). **#74?/#75? ĐÓNG theo chuẩn mốc merged (bằng chứng mới §2.13 — chờ parent quyết (b)); #76? ĐÓNG theo chuẩn đứng (quyết (c) đợt 154); #77? VẪN MỞ; #78?/#79?/#80? GIỮ MỞ theo quyết (b) đợt 154** → các số trên chỉ là ứng viên có điều kiện, chưa thành số chính thức dù #81? đã đóng theo luật gap. T10-155 KHÔNG dùng số ứng viên làm số đóng sổ.
- **SPAN (không chứng nhận):** không đổi so với đợt 154 (691a7403→cc222c8a = 7.050 s; cc222c8a→e146ca67 = 7.381 s; b47f7932→9afdaa89 = 42 s; 9afdaa89→70a5b0fc = 7.265 s; bde599df→9afdaa89 = [3.965, 3.985] s, giữa 3.975 s — quyết 145 (f): để SPAN, không mở đường mới).
- **Biến thể: KHÔNG CÓ biến thể sống đợt này.** Gap #49 chỉ ở dạng khoảng ứng viên (tiền lệ #58/#63/#39/#40/#41); khoảng HẸP (±2 s). Thống kê dùng mid của khoảng (tiền lệ #58).
- Dải chứng nhận chính thức: [0h00'55", 5h14'27"] (CERT73) — không đổi vì gap #49 chưa được parent quyết chứng nhận.
- **Chuỗi INSIDE (theo chuẩn đứng — quyết parent 150 (d)):**
  - 12fc68a3 làm #125? (đếm chặt, chuẩn), dải FULL95 neo 11:26:05Z: **[11:52:14Z, 13:48:55Z]** (tính lại khớp đúng dải đợt 154) — btime 13:05:12Z **INSIDE** (kiểm độc lập bằng code) → **chuỗi INSIDE MỚI BẮT ĐẦU Ở 1 ỨNG VIÊN** (chuỗi cũ 7 → 8 → 9 đã ĐỨT tại #48 và KHÔNG nối lại — boot #48 OUTSIDE làm đứt chuỗi; #49 INSIDE chỉ bắt đầu chuỗi mới, không cộng tiếp số 9).
  - Dải cho boot tiếp theo sau 12fc68a3 (FULL96 neo 13:05:12Z): **[13:31:23Z, 15:27:42Z]**. Ghi nhận: btime boot mới d849728b **15:04:07Z nằm TRONG dải này** — T2-156 kiểm chứng chính thức (chuỗi mới 1 → 2 ứng viên nếu xác nhận).
- **Tốc độ reboot:** **125 reboot / 232,78 h = 1 lần / 111,7 phút** (tới #49; từ boot #1 2026-11-10T20:18:10Z tới 12fc68a3). Tới #50: **126 reboot / 234,77 h = 1 lần / 111,8 phút** (dùng btime đồng hồ — có caveat khung #45, không ảnh hưởng các số này). Chuỗi lũy kế tới **127 / 234,77 h = 1 lần / 110,9 phút** (+0 mù #81? đóng — chưa cộng vì chờ parent quyết; tổng dung lượng 55B max 3 → 127; 56A max 3 → 129 — giữ nguyên như đợt 149/150/151/152/153/154 vì chuỗi đóng hoàn toàn liên tục chưa tăng).
- **Tuổi thọ boot (danh nghĩa stat→stat, đồng hồ):** 2c0a7985 5.947 s; 12fc68a3 7.135 s tới #50 (còn sống lúc probe #74). **Tuổi thọ THẬT (ứng viên):** 2c0a7985 = gap #49 ∈ [5.945, 5.949] s.

### 2.6 Recheck các hố — điều kiện duy nhất còn lại cho khung chết

- Quét mtime toàn cây `/home/hatch` (845.967 file, bao gồm cả thư mục bị loại khỏi merged — node_modules/dist/chrome-userdata/.git) + `/var/log` (11 file) cho mốc trong 8 hố: **845.978 file đã quét.**
- **H-T1 (232 s, hố lớn nhất T): 3 hit — tất cả cùng giây cạnh trái 11:53:27.444/.460/.461** (session jsonl/prompt-continuity/sessions.json agent-5aa53c73 — chính mốc cạnh trái; bẫy float, **lần thứ mười liên tiếp**). **Không có mốc mới trong hố — hố 232 s đứng nguyên sau recheck.**
- **H-T2 (181 s): 1 hit — cùng giây cạnh trái 12:47:29.632** (postboot-t4-154-gate0wait-93.log — chính mốc cạnh trái; bẫy float).
- **H-T3 (181 s): 1 hit — cùng giây cạnh trái 12:02:22.686** (postboot-t4-154-gate0wait-33.log — chính mốc cạnh trái; bẫy float).
- **H-U1 (498 s, hố lớn nhất U — QUAN TRỌNG NHẤT): 0 hit. Không có mốc mới trong hố — hố 498 s đứng nguyên sau recheck.**
- **H-U2 (494 s): 1 hit — cùng giây cạnh trái 14:01:49.411** (exec-log proc_fad3a6a411f7 — chính mốc cạnh trái; bẫy float).
- **H-U3 (281 s): 0 hit. Hố đứng nguyên sau recheck.**
- **H-UH (37 s, đầu U sau CLOCK RULE): 5 hit — 3 MỐC THẬT + 2 mốc đã loại:** **/var/log/btmp + lastlog 13:05:30.036Z + wtmp 13:05:30.124Z = btime +18 s** (boot mới khởi động — quan sát trực tiếp đợt này; cùng mẫu #42 +11 s / #43 +16 s / #44 +15 s / #45 +11 s / #46 +16 s / #47 +11 s / #48 +10 s). Mốc này thu hẹp head gap U (theo khung) xuống **18 s** (không đổi verdict — U đã đóng theo cả hai cách tính). 2 hit còn lại là replay-watch 13:05:31.903Z + gate0wait-117 13:05:32.429Z — chính 2 mốc đã LOẠI theo CLOCK RULE (nội dung boot cũ), không phải mốc mới.
- **H-TT (97 s, đuôi T / khung #125?): 1 hit — cùng giây cạnh trái 13:03:35.360** (exec-log proc_021797f4b794 — chính mốc cạnh trái; bẫy float). Không có mốc mới trong khung chết.
- **Kết luận: đoạn T, U đều ĐÓNG (hố đứng nguyên sau recheck, trừ 1 tinh chỉnh không đổi verdict: U đầu 37 s → 18 s theo khung); khung chết #125? KHÔNG xác định bằng số danh nghĩa (xem §2.4) đứng nguyên sau recheck.** Không còn đường thu hẹp hố nào chưa thử trong phạm vi phương pháp (merged 4 phạm vi + sessions + phạm vi thứ 5 + quét toàn cây + /var/log).

### 2.7 Không kiểm lại (no-recheck)

- R9 (a) số đếm **VẪN LÀ 16** — không nhắc lại (quyết parent).
- G1 khung (a) M2 **VẪN HOÃN** — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời; quyết parent: để yên, không nhắc lại).
- `.github/workflows/ci-security.yml` 403 — không thử lại (chờ user).
- TTS 39 — cấm kiểm lại (quyết parent).
- Birefnet — 0 lần thử thành công trong gói (quyết parent: giữ quy trình + guard 6.144 MiB; u2net là fallback chính thức; tự động hóa đã nối từ T9-147, 0 mẫu ≥ guard đợt này nên không kích hoạt — lần thứ chín liên tiếp 0 lần).
- Mù #64 đoạn B / #62 đoạn B / #61 đoạn B / #56 A / #55 B / #53 B / #51 B / #49 B — không kiểm lại đợt này (tiền lệ + không có bằng chứng mới; quyết 145 (f)).
- Khung chết #110? 223 s (quyết parent 148 (g)) — đã chốt, không kiểm lại.
- Khung chết #111? [88, 156] s / #112? 55 s / #113? (113, 347] s (quyết parent 149 (j)) — đã chốt, không kiểm lại.
- Khung chết #114? 12 s danh nghĩa / [10, 14] s giờ thực (quyết parent 150 (c)) — đã chốt, không kiểm lại.
- Khung chết #115? 1.220 s danh nghĩa / [1.218, 1.221] s giờ thực + khung #116? 42 s danh nghĩa (quyết parent 151 (c)) — đã chốt, không kiểm lại.
- Khung chết #117? 6 s danh nghĩa / [6, 24] s giờ thực ước lượng + khung #118? 934 s (quyết parent 152 (c)) — đã chốt, không kiểm lại.
- Khung chết #120? 1.252 s danh nghĩa (quyết parent 153 (b) — #76? đã ĐÓNG theo chuẩn mới đợt này, khung vẫn là số danh nghĩa chờ quyết) — không kiểm lại đợt này (chỉ xác nhận lại L/M/N ở §2.12, không đổi khung).
- Khung chết #121? không xác định bằng số danh nghĩa / cửa sổ giờ thực (08:16:07Z, 08:35:51Z] (quyết parent 153 (b)/(c) + 154 (d) gỡ provisional) — không kiểm lại đợt này.
- Khung chết #122? 16 s / #123? 34 s / #124? 482 s (455 s theo bản recheck) (quyết parent 154 (b) — #78?/#79?/#80? giữ mở) — không kiểm lại đợt này.
- F110? 2/3 server — ghi là CHƯA ĐỦ 3 SERVER, không đo lại (quyết parent 149 (k)).
- Kết cục run 154 + run 155 — THUỘC T7-155, T2-155 không phán thay (quyết parent 151 (t)); T2 chỉ ghi nhận #50 xảy ra trong phiên (§2.11).
- Nghịch lý đồng hồ ≥ +18 s tại #42 — chỉ ghi nhận (quyết parent 151 (d)/(k)); không mở điều tra mới. Nghịch lý ≥ +50'26" tại #45 — chỉ ghi nhận + T45_thực đã siết xong (quyết (d) đợt 154: gỡ provisional); không mở điều tra mới về cơ chế.
- Chuỗi ghim trần balloon đợt mới (quyết 151 (e) + 153 (i) + 154 (h): đợt 154 đếm là 1 episode) — T2-155 chỉ báo số liệu (§3); verdict nối/đứt chuỗi ghim đợt 155 thuộc T9-155/T10.
- ENOSPC/headroom 0 — thuộc T9-155 (quyết (g) đợt 152 + (h) đợt 153 + (i) đợt 154: chỉ theo dõi); journal boot 2c0a7985 đã mất theo #49 (F-154-T1-3 cùng mẫu) — T2-155 không đếm lại.

### 2.8 Quét WFS #61 (15:02:53–15:03:41Z 20/11 — chạy trên boot 12fc68a3, đếm nội dung file nên không ảnh hưởng; reboot #50 xảy ra SAU khi quét xong 15:04:07Z)

- **NEWSTD: 982 dòng / 286 file** (phạm vi 3.324 file). **R7b: 1.007 / 303** (phạm vi 12.717 file). **Copies: 25 / 17** (không đổi). Đối chiếu 982+25=1.007=R7b, **chênh 0 — lần thứ 61 liên tiếp**.
- Delta so với #60 (981/286): **+1 dòng / +1 file**, giải thích đầy đủ bằng diff (không đoán trước): `docs/PHASE9_ROUND154_T2_EPERM_LIMITS.md:1` — chính LIMITS T2-154 nhắc chuỗi "writeFileSync" một lần trong văn bản §2.8 (cùng mẫu #53/#54/#55/#56/#57/#58/#59/#60: LIMITS T2 nhắc chuỗi trong văn bản). Phạm vi quét tăng +15 file (3.309→3.324) là LIMITS đợt 154 + file đợt 155, không chứa writeFileSync ngoài file trên.
- Lưu ý: quét chạy trên boot 12fc68a3 (trước #50) — đếm nội dung file trong repo, không phụ thuộc boot; các file LIMITS đợt 154/155 đều đã có trên đĩa trước #50 nên số đếm không bị ảnh hưởng.

### 2.9 Async `.writeFile(`

- Vẫn đúng **2 helper đã biết** (`apps/web/scripts/eperm-retry.mjs:71`, `apps/desktop/src/services/epermRetry.js:116`), **0 stray** mới: diff WFS #60→#61 chỉ có đúng 1 file đổi số đếm (LIMITS T2-154 nhắc chuỗi trong văn bản) — không có helper mới nào xuất hiện; cùng mẫu F-149-T2-7/F-150-T2-2/F-151-T2-2/F-152-T2-2/F-153-T2-2/F-154-T2-2 (hai helper dùng `await f.writeFile(file, data);`).
- Bản copy build `apps/desktop/dist/services/epermRetry.js:116` — không kiểm lại đợt này (T2-148 đã xác nhận md5 giống hệt bản src — artifact build, không phải helper mới).

### 2.10 Quét EPERM trong cửa sổ mù

- **98 file *.log** có mtime trong cửa sổ mù. Đếm: "sóng EPERM vẫn bật" **3**, "CẢNH BÁO" **3**, "Operation not permitted" **3**, "sóng EPERM đã tắt" **3** — **tất cả 12 hit đều nằm trong CÙNG MỘT file `round154-t2/eperm-sweep-run.log`** (log quét của T2-154 tự trích tên marker trong output của chính nó + output đợt 153 — false positive tự tham chiếu, xem F-149-T2-3; mẫu lặp lại đợt này; đã đối chiếu độc lập theo từng file: chỉ 1 file chứa hit). **0 sóng EPERM thật.**
- Sóng thật gần nhất vẫn ~11:55–12:11Z 11/11 (**~218,8 h** trước probe #74). **EPERM chưa tuyên bố hết.**

### 2.11 Reboot trong phiên T2-155 — CÓ: reboot #50 ỨNG VIÊN SAU probe #74 (cửa sổ mù không đổi)

- Probe #74 + toàn bộ điều tra mù #81? chạy trên **12fc68a3, không bị reboot nào ảnh hưởng** (cửa sổ mù kết thúc 14:43:07Z; reboot #50 xảy ra 15:04:07Z, sau khi mọi phép đo T2-155 đã xong — WFS kết thúc 15:03:41Z là phép đo cuối cùng trước reboot).
- **Reboot #50 (12fc68a3 → d849728b, btime 15:04:07Z) xảy ra TRONG phiên, SAU probe #74:** giữa lúc T2-155 chạy quét WFS xong (15:03:41Z) và lúc kiểm boot lúc đóng (15:10:48Z). T2-155 tự xác minh boot mới bằng 4 nguồn độc lập (boot_id + btime + journal + wtmp) — xem bảng dưới. Số hiệu #50 là ỨNG VIÊN (chờ parent xác nhận ở đợt 155 — T2-156 kiểm lại độc lập trong phiên sau).
- **Xác minh boot #50 (15:10:48Z):** boot_id d849728b-b8b9-43d4-b3f5-e218facbfdb0; btime /proc/stat 1795187047 = 15:04:07Z; `/proc/1` 15:04:23,360Z; `/proc/1/stat` starttime 1.552 ticks = **15,52 s sau kernel boot** → PID 1 start wall = 15:04:07Z + 15,52 s = 15:04:22,52Z ≈ /proc/1 mtime 15:04:23,360Z (lệch **0,84 s** — cùng họ 0,51/0,83/0,91/0,88/0,67/0,04/0,78 s); `uptime -s` = 15:04:07Z (= /proc/stat); uptime 6 phút lúc 15:10:48Z (làm tròn phút, nhất quán); journal đúng 1 boot, entry đầu 15:04:24Z = btime +17 s; `last reboot` 15:04 still running; wtmp bắt đầu 15:04:23Z = btime +16 s; btmp/lastlog/wtmp mtime 15:04:24Z = btime +17 s.
- **dmesg KHÔNG thử đọc** (T2-148 đã xác nhận `Operation not permitted` — không lặp lại thao tác đã biết chặn). journalctl đọc được (1 boot); /proc đọc được (btime, boot_id, meminfo).
- **dpkg.log boot d849728b:** 2 dòng `startup packages configure` 15:04:59Z/15:05:00Z = btime +52/+53 s (file birth 15:04:59Z); `/var/log/apt/` KHÔNG TỒN TẠI → replay **CHƯA TỚI phần apt** trên boot mới (T5-155 theo dõi tiếp; cùng chữ ký #45 lúc 08:40Z / #48 lúc 11:35:40Z).
- **Gap #50 danh nghĩa: 7.135 s** (btime 15:04:07Z − 13:05:12Z). Mù #82? giao T2-156 (cửa sổ probe #74 → probe #75; đoạn V = 12fc68a3 14:43:07Z→15:04:07Z + đoạn W = d849728b 15:04:07Z→probe #75). (m) tại #50 (có viết lại run nào không) thuộc T7-155 — T2-155 không phán.
- **Mù #81? (reboot #49) KHÔNG bị ảnh hưởng bởi #50** (cửa sổ probe #73 → #74 đóng trước #50; xem §2.12). Không có mù mới nào chờ đợt sau từ phía T2 trừ #82? (giao T2-156).

### 2.12 Mù #81? — ĐÓNG THEO LUẬT GAP (chờ quyết parent)

- **Mù #81? (reboot #49, 2c0a7985 → 12fc68a3): ĐÓNG theo luật gap.** Đoạn T đóng (hố lớn nhất 232 s, max 0 ẩn); đoạn U đóng (hố lớn nhất 498 s, max 0 ẩn — 18 s theo khung nhất quán wtmp); khung #125? KHÔNG xác định bằng số danh nghĩa (xem §2.4); gap #49 ứng viên dạng khoảng **[5.945, 5.949] s, giữa 5.947 s** → CERT81/FULL96 ỨNG VIÊN CÓ ĐIỀU KIỆN (chưa phải số chính thức — chuỗi phụ thuộc §2.5).
- **Chuỗi mù đóng hoàn toàn LIÊN TỤC GIỮ 9** (không tăng đợt này — vì #77? còn MỞ phía trước; #81? tạo thêm đảo đóng riêng cùng #78?/#79?/#80?). **CERT/FULL chính thức GIỮ 73/88.** Nếu parent đóng #74?/#75? (theo bằng chứng mới §2.13) thì chuỗi nối thành 9 → **12** (+3: #74?/#75?/#76?) và CERT76/FULL91 thành số chính thức theo chuỗi phụ thuộc; #78?–#81? vẫn là đảo đóng riêng cho tới khi #77? đóng.
- **INSIDE chuỗi MỚI bắt đầu ở 1 ỨNG VIÊN tại #49** (btime 12fc68a3 INSIDE FULL95; xem §2.5) — chuỗi cũ 7→8→9 đã đứt tại #48 không nối lại.
- **Phạm vi:** chứng nhận đợt này dùng cửa sổ [probe #73 11:38:16Z → probe #74 14:43:07Z] (11.091 s) với các đoạn T + U; tiền đề các đoạn trước T (đã đóng/mở đợt 154) không đo lại — hồ sơ đã đóng.
- **Run 154 — kết cục (T7-155, T2-155 không phán thay):** run 154 bị #49 viết lại (started_at viết lại, requeue btime + 42,981 s — điểm (m) thứ 9, DƯƠNG; quyết (f) đợt 154: n ứng viên 9). T2-155 ghi nhận, KHÔNG phán thay (quyết 151 (t)).

### 2.13 Xác nhận lại #76?/#77? + bằng chứng mới #74?/#75? (chuẩn mốc merged đứng)

**Xác nhận lại L/M/N — CHẠY LẠI Y NGUYÊN PHÉP TÍNH ĐỢT 154 (script `merged-lmn.py`, log `merged-lmn.log`):**

| Đoạn | Mốc gốc | Mốc nội dung thêm | Max gap gốc | Max gap chuẩn đứng | Verdict chuẩn đứng |
|---|---|---|---|---|---|
| L | 220 | 115 (T9-152 + T8-152) | 1.252 s | **60 s** | **ĐÓNG (max 0 ẩn)** |
| M | 4 | 29 (T9-152 + HB 07:20:50Z) | 1.236 s | **81 s** | **ĐÓNG (max 0 ẩn)** |
| N | 60 | 5 (wtmp + 4 dòng T9-153) | 1.319 s (số học) | **1.308 s** | **KHÔNG ĐÓNG (max 1 ẩn)** |

- **Kết quả KHỚP ĐÚNG 100% số thí nghiệm đợt 154** (L 60 s / M 81 s / N 1.308 s; cùng số mốc nội dung 115/29/5; cùng 11 dòng sampler flagged vượt btime về mặt số học). Dưới chuẩn đứng (quyết (c) đợt 154): **#76? ĐÓNG** (L+M đóng — đảo đóng riêng, chuỗi giữ 9 vì #74?/#75? còn mở phía trước lúc quyết (c) được viết — xem hệ quả mới ở dưới); **#77? VẪN MỞ** (N mở ngay cả theo chuẩn đứng).

**Bằng chứng MỚI cho #74?/#75? — áp dụng chuẩn đứng cho đoạn J-full (script `merged-j.py`, log `merged-j.log`):**

- Đoạn J-full [03:25:16Z, 05:20:57Z] (6.941 s, boot fad2aab9 — đợt 152): file-mtime max gap **1.589 s** (04:00:55Z → 04:27:24Z) → KHÔNG ĐÓNG theo chuẩn cũ. Bằng chứng hỗ trợ đã ghi từ đợt 152 (26 dòng sampler + 3 session xuyên hố + HB dispatch 04:15:34Z) chưa bao giờ được tính làm mốc.
- Dưới chuẩn đứng: **87 dòng sampler T9-151 boot=fad2aab9** trong khoảng số học của J + **1 event HB dispatch 04:15:34Z** (T7-151 record, slot 04:20:50Z, run a79e6d98) = **88 mốc nội dung thêm** (base file-mtime 82 mốc sau khi loại 2 mốc đầu boot cũ 03:25:21Z/03:25:37Z theo CLOCK RULE — head 61 s, mốc boot-mới chắc chắn đầu tiên 03:26:17Z).
- Trong hố cũ 1.589 s: **28 mốc thêm** (27 dòng sampler 04:01:18–04:27:19Z + HB 04:15:34Z; cadence tối đa 61 s, tối thiểu 16 s — HB chia khoảng 60 s thành 16 s + 44 s). 0 dòng sampler flagged vượt cuối đoạn J (không có nghịch lý #43 trong sampler).
- **Max gap J-full theo chuẩn đứng: 934 s** (đuôi 05:05:23Z → 05:20:57Z — không có sampler sau 04:52:19Z; vẫn < sàn) → **J ĐÓNG (max 0 ẩn)**.
- **Hệ quả: #74? (I+J) ĐÓNG + #75? (J+K) ĐÓNG theo luật gap dưới chuẩn đứng** (I đóng 475 s + K đóng 880 s theo file-mtime từ đợt 152, không đổi). Đây là **bằng chứng mới** — phương pháp thành chuẩn đứng ở quyết (c) đợt 154 CHƯA BAO GIỜ được áp dụng cho J (thí nghiệm đợt 154 chỉ thử L/M/N). T2-155 KHÔNG tự chứng nhận #74?/#75? — parent quyết (§4.3 (b)). **CERT/FULL chính thức GIỮ 73/88 cho tới khi parent quyết.**
- **Ghi rõ giới hạn:** (1) mốc nội dung là timestamp TRONG NỘI DUNG file, không phải mtime — cùng giới hạn đã ghi ở đợt 154 §2.13 (nay là chuẩn đứng, không còn là thí nghiệm); (2) event HB 04:15:34Z là bản ghi của T7-151 (không phải phép đo trực tiếp của T2-155) — cùng loại bằng chứng với HB 07:20:50Z đã dùng cho M; (3) gap #42/#43 vẫn giữ nguyên khoảng ứng viên [7.163, 7.167] s / [6.939, 6.943] s (không có đo F trực tiếp nào mới trên fad2aab9 — T2-153 đã kiểm exhaustively; xem §2.7) — chỉ verdict ĐÓNG/MỞ của mù thay đổi, không phải khoảng gap.

### 2.14 T45_thực + run 152 — không có gì mới (quyết (d) đợt 154 đã gỡ provisional)

- **Không kiểm lại đợt này.** Quyết (d) đợt 154: **verdict run 152 là SUCCEEDED (không điều kiện)** — provisional đã gỡ. T2-155 ghi nhận, không mở lại.
- **n mẫu (m): ứng viên 9, điều tra VẪN ĐÓNG** (quyết (f) đợt 154). #50 có phải điểm (m) thứ 10 không — thuộc T7-155 (scheduler DB); T2-155 không phán.

## 3. RAM trong cửa sổ mù (đọc sampler log — ram-max chỉ là lower bound, bài học F-142-T2-10; chuẩn đứng: báo MAX MemAvailable theo % guard; gán đoạn THEO boot=, không theo timestamp — xem §2.2 đợt 153)

- **Đỉnh cửa sổ mù: 3.211.344 kB = 3.136,1 MiB (T9-154 sampler, 11:43:41Z, đoạn T) = 51,04% guard 6.144 MiB.** Đây là đỉnh cửa sổ ĐÚNG của đợt 155 (probe #73 → probe #74). Đỉnh này TRÙNG số T9-154 đã báo (max 3.211.344 kB @11:43:41Z — xem aggregate 154 §10.3) — không phải đo mới, chỉ là cùng mẫu nằm trong cửa sổ này.
- **0 mẫu ≥ guard trong toàn cửa sổ:** T9-154 0/124 + T9-155 0/3 (tổng 0/127). **Birefnet 0 thử** — cơ chế tự động (a) đã nối từ T9-147 nhưng 0 mẫu ≥ guard nên không kích hoạt lần nào (đúng thiết kế — lần thứ chín liên tiếp 0 lần thử).
- Đỉnh từng đoạn: T **3.211.344 kB = 51,04% guard** (11:43:41Z, T9-154 — 87 mẫu); U **1.920.656 kB = 30,53% guard** (13:07:18Z, T9-154 — 40 mẫu, gồm 3 mẫu T9-155 trong cửa sổ).
- Avail min trong cửa sổ: **405.564 kB = 396,1 MB (T9-154, 12:11:41Z, đoạn T)** — trùng số min T9-154 đã báo (aggregate 154 §10.3), nằm trong cửa sổ này.
- Balloon: đoạn T tối đa **6.443.824 kB** (100% trần, **52 mẫu ghim**); đoạn U tối đa **6.443.824 kB** (100% trần, **13 mẫu ghim**). Tổng ghim trần trong cửa sổ: **65 mẫu, 2 boot** (2c0a7985 + 12fc68a3) — verdict nối/đứt chuỗi ghim thuộc T9-155/T10.
- Lưu ý: gán đoạn THEO boot= (không theo timestamp) là bắt buộc đợt này vì nghịch lý #49: 2 mốc file boot cũ stamped 13:05:31Z/13:05:32Z (vượt btime) thuộc đoạn T theo nội dung — script `ram-max81.py` gán theo boot= (xem docstring); sampler T9-154 không có dòng nào boot=2c0a7985 stamped sau btime nên không ảnh hưởng đỉnh đợt này, nhưng phương pháp phải đúng.

## 4. Phương pháp + sai số của chính T2-155

### 4.1 Phương pháp

- Chứng nhận mù theo **luật gap** (merged 4 phạm vi: repo-1 + hidden_files + ngoài hai cây + /tmp, độ chính xác giây; floor = 1.147 s): max gap < sàn → đoạn đóng, max ẩn = 0; mỗi mốc có mtime giây + nguồn file + (với mốc ngoài cây) file đã tự tạo trong hai cây. Mốc thuộc boot cũ theo nội dung được LOẠI khỏi mốc đầu đoạn mới sau khi kiểm nội dung (quy tắc CLOCK RULE đứng) — đợt này LOẠI 2 mốc đầu U (13:05:31Z replay-watch + 13:05:32Z gate0wait-117, đều nội dung boot cũ — xem §2.4); mốc AMBIG được GIỮ LẠI theo quy tắc bảo thủ (giữ mốc mơ hồ chỉ có thể thu hẹp gap, không thể phóng đại — tiền lệ classify-n.py đợt 153); mốc runtime có birth sau btime được GIỮ LẠI (birth là bằng chứng tạo mới trên boot mới — xem §2.4).
- **Chuẩn đứng MỚI (quyết (c) đợt 154): mốc merged (dòng log sampler + event scheduler) được dùng thêm vào phân tích luật gap cùng mốc file, áp dụng nhất quán không chọn lọc.** T2-155 áp dụng cho: (i) xác nhận lại L/M/N (§2.13 — khớp đúng số đợt 154); (ii) kiểm bằng chứng mới cho J (§2.13 — J đóng, max gap 934 s). Mốc merged KHÔNG dùng cho T/U đợt này (T/U đã đóng bằng mốc file; không cần thêm).
- Chuẩn mới: **mọi số btime/gap dùng /proc/stat** (quyết parent 148 (b)); /proc/1 chỉ ghi kèm để đối chiếu. Đếm mù: đếm chặt (2c0a7985 = #124?, 12fc68a3 = #125?) — cùng chuẩn với đợt 147/148/149/150/151/152/153/154 (quyết 146 (a)). Chứng nhận gap **DẠNG KHOẢNG** với mid dùng cho thống kê (chuẩn mới quyết parent 149 (c), tiền lệ #58/#63/#39/#40/#41) — đợt này khoảng HẸP (±2 s).
- Khung nhiệm vụ đợt 155 (phân tách mù #81?): mù #81? lấy đoạn T + U. T2-155 chứng nhận #81? trong cùng một đợt + xác nhận lại #76?/#77? + kiểm bằng chứng mới #74?/#75? (cùng cửa sổ phương pháp, không làm lại merged L/M/N/J từ đầu — chỉ tính lại bằng script trên dữ liệu đã lưu).
- Hole recheck: quét mtime toàn cây /home/hatch + /var/log trong 8 hố — 0 mốc nội bộ mới trong 6 hố (chỉ trúng chính mốc cạnh trái, bẫy float, lần thứ mười liên tiếp) + 1 tinh chỉnh thật không đổi verdict (btmp/lastlog/wtmp 13:05:30Z trong H-UH) + 2 mốc đã loại xác nhận bằng float (13:05:31.903Z/13:05:32.429Z trong H-UH) — xem §2.6.
- RAM: đọc sampler log (T9-154/T9-155) + script ram-max (đối chiếu — khớp đọc tay + số T9-154 đã báo; xem §3); đỉnh báo cáo lấy theo max MemAvailable (chuẩn đứng T2-148/149/150/151/152/153/154) — và báo rõ cửa sổ (bài học F-151-T9-7) + gán đoạn theo boot= (đứng từ đợt 153, do nghịch lý #45).
- **Prereg cho T2-155 (viết TRƯỚC probe #74, ~14:41Z — bài học F-154-T2-1 đã áp dụng đúng):** (a) probe #74 DEAD/STALE n=73, once ok=2 fail=0 boot 12fc68a3, log 211→214 (ĐÚNG); (b) F118? ≈ 0/+1 s, 3 server (ĐÚNG); (c) T ĐÓNG (ĐÚNG); (d) U "CÓ THỂ ĐÓNG nhưng rủi ro ở đuôi, CÓ THỂ MỞ" — **SAI: U đóng, max gap 498 s** (xem F-155-T2-6); (e) gap #49 ứng viên [5.945, 5.949] s (ĐÚNG); (f) #76? ĐÓNG / #77? MỞ xác nhận lại (ĐÚNG); (g) #74?/#75? "dự báo KHÔNG CÓ bằng chứng mới" — **SAI: J đóng theo chuẩn đứng, có bằng chứng mới** (xem F-155-T2-7); (h) WFS #61 chênh 0 (ĐÚNG); (i) EPERM 0 sóng (ĐÚNG); (j) RAM đỉnh cửa sổ (ĐÚNG phương pháp); (k) CERT/FULL chính thức giữ 73/88 (ĐÚNG — chờ parent quyết).

### 4.2 Sai số của chính T2-155 (danh sách đầy đủ — không giấu lỗi)

- **F-155-T2-1 (prereg ghi sai độ dài đoạn T — lỗi số học):** prereg ghi T = 4.816 s (sai); đúng là **5.216 s** (13:05:12Z − 11:38:16Z = 3.600 + 1.616 s). U prereg ghi ~5.750 s (ước lượng theo 14:41Z); đúng là **5.875 s** (tới probe #74 14:43:07Z). Đã sửa trong LIMITS này (mọi số đoạn/gap lấy từ script, không lấy từ prereg). Không ảnh hưởng verdict (độ dài đoạn không đổi max gap).
- **F-155-T2-2 (sửa docstring merged-lmn.py làm vỡ syntax — đã sửa trước khi chạy):** lần sửa đầu đóng docstring sớm (`"""` thừa) khiến phần còn lại rơi ra ngoài string → SyntaxError (leading zeros). Đã bắt được khi chạy thử và sửa lại (chỉ thay đoạn đầu docstring, giữ phần còn lại trong string) — chạy lại thành công, số liệu khớp đúng đợt 154. Không ảnh hưởng số liệu.
- **F-155-T2-3 (lệnh shell background sai nhóm — đã chạy lại):** lần đầu chạy hole-recheck với `&` làm cả chuỗi `cd ... && python3 ...` chạy nền, khiến `python3 blind81-sessions.py` tiếp theo chạy sai cwd (`/home/hatch/blind81-sessions.py` không tồn tại). Hole-recheck (pid 54831) vẫn chạy nền đúng như ý; sessions đã chạy lại đúng cwd ngay sau đó. Không ảnh hưởng số liệu (hole-recheck hoàn thành đầy đủ 845.978 file).
- **F-155-T2-4 (ghi file excl-u.txt sai format — đã sửa trước khi chạy merged):** bản đầu ghi dòng có hậu tố "Z" (`2026-11-20T13:05:31Z`) trong khi `load_excl` tự thêm "Z" → ValueError (unconverted data remains: Z). Đã sửa file (bỏ "Z") và chạy lại merged — EXCL_U (2) áp dụng đúng. Không ảnh hưởng số liệu.
- **F-155-T2-5 (ghi file LIMITS — bài học F-152-T2-3/F-153-T2-4/F-154-T2-5 đã áp dụng):** LIMITS này được ghi trong **MỘT lần `muse.write` overwrite duy nhất** (không chia nhiều lần append) và kiểm `wc -c` + grep mốc sau khi ghi xong trước khi stage.
- **F-155-T2-6 (dự báo prereg (d) sai — U đóng chứ không mở):** prereg dự báo U "CÓ THỂ MỞ ở đuôi" do quãng yên 14:13–14:35Z — thực tế U đóng với max gap 498 s (14:23:36→14:31:54Z). Sai dự báo, không sai số liệu (prereg chỉ là dự báo; verdict lấy từ script). Ghi nhận: mật độ ghi file trong quãng yên cao hơn dự báo vì MEMORY.md + filesystem_watch_hashes (14:31:54Z) + file dispatch (14:35:36Z) + file luồng 155 từ 14:35:51Z vẫn để lại mốc.
- **F-155-T2-7 (dự báo prereg (g) sai — CÓ bằng chứng mới cho #74?/#75?):** prereg dự báo "KHÔNG CÓ bằng chứng mới, GIỮ MỞ" — thực tế áp dụng chuẩn mốc merged (quyết (c) đợt 154) cho đoạn J cho thấy J ĐÓNG (max gap 934 s), tức #74?/#75? đóng theo luật gap dưới chuẩn đứng. Sai dự báo (do prereg viết trước khi chạy script merged-j.py; lúc viết prereg T2-155 chưa kiểm J). Không sai số liệu (verdict lấy từ script). Ghi nhận: quyết (c) "áp dụng nhất quán không chọn lọc" có nghĩa là phải kiểm cả J, không chỉ L/M/N — T2-155 đã kiểm và báo cáo đầy đủ ở §2.13.
- **F-155-T2-8 (nhãn in của blind81-gaps.py ghi "CLOCK RULE: no exclusions" — nhãn tĩnh, không phải lỗi số liệu):** script gaps tính lại từ mốc thô (không áp dụng EXCL_U) nên in nhãn đó; max gap T/U khớp đúng merged đã áp dụng CLOCK RULE (232 s / 498 s — 2 mốc loại ở đầu U không ảnh hưởng max gap). Ghi rõ để tránh đọc nhầm: số liệu merged có CLOCK RULE (§2.4) là số chuẩn.

### 4.3 Câu hỏi cho parent (chỉ câu hỏi MỚI của đợt 155 — các câu hỏi cũ đã quyết không nhắc lại)

(a) **Mù #81? — CHẤP NHẬN ĐÓNG hay giữ mở?** Theo luật gap: ĐÓNG (T 232 s / U 498 s, max ẩn 0; U head 18 s theo khung wtmp). Gap #49 **[5.945, 5.949] s**. Nếu parent chấp nhận: CERT81/FULL96 thành số chính thức (CÓ ĐIỀU KIỆN #74?–#80? cũng đóng — xem §2.5); chuỗi đóng hoàn toàn liên tục vẫn GIỮ 9 (vì #77? mở chặn trước #78?–#81? — đảo đóng riêng). Nếu parent giữ mở: #81? giao T2-156 kiểm lại (cùng hố, không làm lại merged).
(b) **Mù #74?/#75? — CHẤP NHẬN ĐÓNG theo chuẩn mốc merged hay giữ mở?** (Bằng chứng mới §2.13: J max gap 1.589 s → 934 s dưới chuẩn đứng; #74?/#75? đóng theo luật gap.) Nếu chấp nhận: CERT76/FULL91 thành số chính thức; chuỗi đóng hoàn toàn liên tục 9 → **12** (+3: #74?/#75?/#76?); CERT77/FULL92 vẫn chặn ở #77? (mở). Nếu giữ mở (ví dụ vì mốc sampler/scheduler không được tính cho các đoạn cũ): #74?/#75? giữ mở, CERT/FULL giữ 73/88, và parent cần nói rõ phạm vi hồi tố của chuẩn mốc merged (chỉ L/M/N hay mọi đoạn?).
(c) **Khung chết #125? — chốt khung nào?** (Không xác định bằng số danh nghĩa do nghịch lý ≥ +20 s tại #49; khung danh nghĩa 97 s vô hiệu; giới hạn giờ thực: chết tại 13:05:12Z, sống tới ít nhất old-clock 13:05:31Z.) Parent quyết: (i) để mở (không chốt khung); (ii) chấp nhận khung ước lượng giờ thực hẹp (cỡ giây tới ~30 s, không pin chặt); (iii) giao T2-156 siết thêm bằng đối chiếu khác.
(d) **Reboot #50 (btime 15:04:07Z, boot d849728b) — XÁC NHẬN số hiệu #50?** (T2-155 xác minh 4 nguồn độc lập lúc 15:10:48Z; /proc/1 lệch 0,84 s; journal 1 boot; wtmp btime +16 s.) Mù #82? giao T2-156.
(e) **INSIDE chuỗi mới bắt đầu ở 1 ứng viên tại #49 — ghi nhận?** (Chuỗi cũ 7→8→9 đã đứt tại #48 không nối lại; btime d849728b 15:04:07Z nằm trong dải FULL96 [13:31:23Z, 15:27:42Z] — T2-156 kiểm chứng chính thức xem chuỗi mới 1 → 2.)
(f) **F118? ≈ 0/+1 s + /proc/1 lệch 0,78 s (#49) / 0,84 s (#50)** — ghi nhận, không điều tra (trong sai số làm tròn, cùng họ 0,51/0,83/0,91/0,88/0,67/0,04 s).
(g) **WFS #61 chênh 0 (lần thứ 61); RAM đỉnh cửa sổ mù 51,04% guard; birefnet 0 thử lần thứ chín liên tiếp** — ghi nhận (không có câu hỏi).
(h) **dpkg.log boot 12fc68a3 không kiểm được trong phiên (đã mất theo #50) — ghi nhận** (T5-155 theo dõi replay trên boot d849728b; không có câu hỏi cho T2).
(i) **Đếm CERT81/FULL96 — T10 kiểm lại** (như mọi đợt: T10 xác nhận đếm cuối bằng dedup toàn cục trước khi đóng sổ đợt 155; số đếm CHÍNH THỨC vẫn 73/88 cho tới khi parent quyết (a)/(b) — quyết parent 150 (s): số đếm cuối CHỈ lấy từ output script; chuỗi phụ thuộc §2.5 phải ghi rõ trong aggregate).

### 4.4 Ghi chú cho T10-155 (đóng sổ đợt 155)

- Đợt 155 dùng **chuẩn btime /proc/stat** cho mọi số (quyết parent 148 (b)) — T10 kiểm lại đếm cuối bằng dedup toàn cục (không cộng round-unique vào lũy kế — bài học AGENTS.md đợt 126–127 + quyết parent 150 (s): số đếm cuối CHỈ lấy từ output script).
- **Đưa `npm test` vào suite đóng sổ chuẩn từ đợt 149** (quyết parent 148 (k) — V19 đã nối vào `test_integration.sh` theo quyết parent 150 (j), đếm integration 12, giao T0-155 — quyết parent 151 (w)).
- **O8 chạy sau cờ T4** (quyết parent 148 (c) — điều kiện chấp nhận trích dẫn đợt 148; từ đợt 149 trở đi tuân (j) — quyết parent 149 (f): trích là "harness sau khi T4 đóng cờ"; đợt 150 là ngoại lệ lệch chuẩn đã được chấp nhận ở quyết 150 (f)).
- **Chuẩn nguồn btime /proc/stat** đã áp dụng trong LIMITS này; các số /proc/1 chỉ còn để đối chiếu. **Ngoại lệ đợt này:** reboot #50 xảy ra TRONG phiên T2-155 (sau probe #74) — T10 kiểm boot lúc đóng của từng luồng khi đối chiếu (không giả định mọi luồng cùng boot nếu có reboot mới sau probe #74); các luồng đóng cờ sau 15:04:07Z chạy trên boot d849728b, các luồng đóng trước đó chạy trên 12fc68a3.
- **Mốc uptime 20:10:28Z (e2 > 595 s) BỊ LOẠI khỏi cận** — T10 không dùng làm cận cho gap #38 (xem §2.2 đợt 149 + quyết parent 149 (b)(i)).
- **Câu hỏi mù #81? + #74?/#75? + khung #125? + reboot #50 §4.3 (a)(b)(c)(d) cần parent phán trước khi T10 chốt chuỗi INSIDE + chuỗi mù đóng hoàn toàn + CERT/FULL + khung chết trong aggregate** — T10 ghi khung #125? là "không xác định bằng số danh nghĩa" kèm chú thích chờ quyết, đừng tự chọn một bên; CERT/FULL chính thức giữ 73/88 cho tới khi parent quyết (a)/(b); chuỗi phụ thuộc §2.5 phải ghi rõ.
- **Kiểm cờ `.done` trên đĩa** (quyết parent 150 (t) + 151 (u) + 153 (p) + 154 (n)) — T10 ghi rõ "x/10 cờ" trong §10 (đợt 155 có 10 luồng: T0/T1/T2/T4/T5/T6/T7/T8/T9/T10); T2-155 đã viết cờ của mình trước khi báo đóng.
- **Reboot #50 (15:04:07Z) xảy ra TRONG phiên T2-155, SAU probe #74** — các luồng đợt 155 đóng cờ sau 15:04:07Z chạy trên boot d849728b (T10 kiểm boot lúc đóng của từng luồng khi đối chiếu); T2-155 xác minh boot mới lúc 15:10:48Z (4 nguồn độc lập).

## 5. File + stage

**File duy nhất của batch (LIMITS này):**
- `docs/PHASE9_ROUND155_T2_EPERM_LIMITS.md` — (kích thước/md5 xem cờ round155-t2.done; file > 37.768 byte → push cần ENABLE_PRIVSEP=0)

**Stage (không push):** `~/workspace/repo-1-push/paths-loop/phase9-round155-t2-eperm.txt` — 1 entry, NUL-delimited, text-only, 0 binary (verify bằng `od -c`).

**Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round155-t2.done` — 1 dòng tóm tắt + kích thước/md5 LIMITS.

**File làm việc (không stage, chỉ để đối chiếu):** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round155-t2/` — prereg-t2.md, adapt-scripts.py, f118.txt, blind81-investigate.py/.log, blind81-merged.py/.log, blind81-sessions.py/.log, blind81-fifthscope.py/.log, blind81-gaps.py/.txt, hole-recheck81.py/.txt, ram-max81.py, ram-max.txt, eperm-sweep81.py, eperm-sweep-run.log, scan-wfs61.sh, scan-wfs-run.log, scan-meta.txt, files-newstd.bin/files-r7b.bin/files-copies.txt + wfs-newstd.txt/wfs-r7b.txt/wfs-copies.txt, blind81-repo-1.txt, blind81-hidden_files.txt, blind81-outside.txt, blind81-tmp.txt, sessions-all.txt, disappeared155.txt, excl-u.txt, headtail81.py/.txt, merged-lmn.py/.log, merged-j.py/.log.
