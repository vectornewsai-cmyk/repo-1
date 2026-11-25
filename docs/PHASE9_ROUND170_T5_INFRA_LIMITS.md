# PHASE 9 — ROUND 170 — T5 INFRA LIMITS

**Đợt:** 170 (mở lượt cron 18:35 +07 22/11/2026 = 11:35:51Z; hạn cờ ~14:00Z, hạn cứng 14:30Z).
**Người viết:** T5-170. **Ngày:** 22/11/2026. **Boot làm việc lúc đóng:** #79 (dự kiến) 5df1871f, btime 11:11:05Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #79 (replay-day-du, poll=0 — xem §3.1). File này là 1 entry duy nhất stage đợt 170 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #79 (5df1871f, btime 11:11:05Z) | **ĐÃ CÓ 11:49:14Z (boot+38m09s, replay-day-du, poll=0)** — verify độc lập exit 0 (T5 11:49:24Z + watcher poll0 11:49:14Z), 11/11 gói + 5/5 lib, GST 269 = debroot 269, ledger hiệu dụng 170/170, receipt hash = ledger sha256 (xem §3.1) |
| POSTBOOT_PASS #78 (e298bb52) | **KHÔNG CÓ** (grep 0 kết quả — boot thứ 14 không cờ, không bù được) |
| POSTBOOT_PASS #77 (c44cc3ba) | **VẪN CÓ, còn hiệu lực** (08:46:44Z, replay-day-du, poll=0 — quyết (j) đợt 169: cờ đứng cho gate (a) không caveat mode repair) |
| POSTBOOT_PASS #75 (576ca271) | **VẪN CÓ, còn hiệu lực** (06:01:38Z, mode repair) |
| Reboot trong phiên | **#79 (5df1871f, btime 11:11:05Z, gap #78→#79 = 6.987 s = 116m27s)** — xảy ra TRƯỚC khi đợt mở 24m46s, trong khoảng không-watcher |
| Replay #79 | **CHẠY ĐẦY ĐỦ, 12m37s**: hoạt động đầu 11:35:39Z (boot+24m34s — khởi động MUỘN nhất từng kẹp), apt-get update ~8m56s, installs 11:44:37→11:48:15Z, 50 transaction, 169 install, dpkg 1545 (breakdown Y HỆT #77), receipt 11:48:16Z (hash = ledger sha256) |
| Watcher-170 | START 11:42:42Z, pid 20516, boot 5df1871f; REPLAY_DONE + FLAG-WRITTEN 11:49:14Z poll=0; **vẫn ĐANG CHẠY** lúc đóng (tới hạn cứng 14:30:00Z); 14 poll lúc stats 11:49:26Z |
| Watcher-169 | **CHẾT theo #78** (pid 25426 mất — kill -0 xác minh lúc mở); log 62 dòng, **57 poll, 0 proc apt/dpkg trong MỌI poll**; poll cuối **09:14:49Z — MUỘN HƠN btime #78 (09:14:38Z) 11 s (F-170-T5-1)**. Khoảng không-watcher: **8.873 s = 2h27m53s** (poll cuối → START watcher-170) |
| Điều tra replay #75 | **ĐÃ ĐÓNG theo quyết parent (j) đợt 169** ở mức CHƯA XÁC ĐỊNH nguyên nhân gốc + leo thang kiểm journal host-side — T5-170 KHÔNG mở lại điều tra trong cell (xem §5) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#79 = 31 reboot** nếu #79 được xác nhận (T0 đếm độc lập) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 17 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0, 0 timer VCut) |
| ENOSPC | #79: **11 dòng lúc stats 11:50:55Z** (journal 174 dòng, dòng đầu 11:36:23Z = boot+25m18s, từ home-assistant-ensure.service) |
| X11 | **3 socket X193/X194/X195 mới (mtime 11:44Z)**, 0 Xvfb thật — xuất hiện trong lúc replay chạy — giao T8-170 dọn |
| RAM #79 | MemAvailable 1.869.972 kB lúc 11:50:55Z; loadavg 1,84 (thấp hơn #77: 2.864.504 kB) |
| Đồng hồ | Local ≈ Cloudflare **−1 s** (CF nhanh hơn local ~0,4–0,9 s qua 2 lần đo) — cùng họ các đợt trước |
| Gap kiểm lại độc lập | #78→#79 = **6.987 s**; #77→#78 = **3.046 s** (KHỚP quyết parent đợt 169) — cả hai tính bằng 2 phương pháp độc lập (trừ epoch python + `date -d`) |
| Quy tắc B4 | **T5-170 KHÔNG chạy probe chạm dpkg nào** (0 lần `dpkg --configure -a`); chỉ dùng check-only đọc (dpkg-query / apt-get -s / postboot check-only) — B4 GIỮ NGUYÊN, không nới |

**Số hiệu boot #79 là DỰ KIẾN theo đếm tuần tự — chờ parent xác nhận + T0 xác minh 9 nguồn.**
**T5-170 KHÔNG phán (m), chỉ trình số thô — đặc biệt F-170-T5-1 có thể ảnh hưởng (m) #78, giao T2-170 + parent đối chiếu.**

---

## §1. Timeline (giờ Z, 22/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 08:23:52Z | Reboot #77 (c44cc3ba, btime) — gap #76→#77 = 3.089 s |
| 08:46:44Z | Cờ POSTBOOT_PASS #77 ghi (replay-day-du, poll=0) |
| 09:14:38Z | **Reboot #78 (e298bb52, btime, epoch 1795338878) — gap #77→#78 = 3.046 s (50m46s)**; watcher-169 chết theo (nhưng poll cuối của nó là 09:14:49Z — xem F-170-T5-1) |
| 09:14:49Z | Poll cuối watcher-169 trên #77 (dpkg 1546, 0 proc) — **11 s SAU btime #78** |
| 11:11:05Z | **Reboot #79 (5df1871f, btime, epoch 1795345865) — gap #78→#79 = 6.987 s (116m27s)**; xảy ra 24m46s TRƯỚC khi đợt mở |
| 11:11:16Z | Journal #79 first entry (boot+11s); /proc/1 mtime 11:11:15.986Z (boot+10,986s) |
| 11:35:39Z | Hoạt động dpkg đầu trên #79 (boot+24m34s): 2 dòng `dpkg --configure -a` (reconcile heal + replay heal) |
| 11:35:40Z→~11:44:36Z | `apt-get update` của replay #79 (lazy index refresh, ~8m56s — mirror chậm; lists 3 → 30) |
| 11:35:51Z | Lượt cron đợt 170 mở |
| ~11:42Z | **T5-170 mở trên #79**: uptime 31' → boot 11:11:05Z (khớp btime); /proc/1 mtime +10,986 s; journal idx 0 duy nhất, first entry 11:11:16Z (+11 s); không có file round-in-progress.md |
| 11:42:42Z | **Watcher-170 START, pid 20516, boot 5df1871f** (khoảng không-watcher 8.873 s tính từ poll cuối watcher-169 09:14:49Z) |
| 11:44:36Z | Transaction apt đầu của replay #79 (history.log); installs 11:44:37Z → 11:48:15Z (**~3m39s, 50 transaction**, mỗi gói 1 transaction — chữ ký vòng lặp per-package) |
| 11:48:16Z | Receipt `os-intent-replayed.sha256` ghi (hash = ledger sha256) — pass #79 sạch (failures=0) |
| 11:49:13Z | Watcher REPLAY_DONE (dpkg 1545 ổn định 2 poll, 0 proc) → postboot poll0 exit 0 |
| 11:49:14Z | **Watcher FLAG-WRITTEN: cờ POSTBOOT_PASS #79 ghi (boot+38m09s, replay-day-du, poll=0)** |
| 11:49:24Z | T5 verify độc lập postboot check-only trên #79: **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269** (log `t5-postboot-independent-5df1871f.log`) |
| 11:49:26Z | Stats script chạy lần 1 (`t5-stats-170.py` → `t5-stats-170-output.txt`); watcher-170: 19 dòng log, 14 poll; RAM MemAvailable 1.813.448 kB; X11: 3 socket X193/X194/X195 (mtime 11:44Z) |
| 11:50:55Z | Stats script chạy lần 2 (sau khi sửa F-170-T5-3); ENOSPC 11 dòng; MemAvailable 1.869.972 kB |
| ~11:52Z | T5 viết LIMITS này. Watcher-170 vẫn ĐANG CHẠY (pid 20516, ALIVE; poll 11:50:44Z dpkg 1545 ổn định, 0 proc), dpkg ổn định 1545 dòng |

Tuổi boot theo btime: #78: 6.987 s (116m27s, tính tới btime #79); #77: 3.046 s (50m46s).

---

## §2. Hướng (3) + marker + đồng hồ

Kiểm tra lại lúc stats 11:50:55Z trên #79 (`t5-stats-170.py` §8, khớp mẫu T5-169 §2):

- `systemctl is-active user@0` = **inactive**; `logind` = **inactive**; `dbus` = **inactive**.
- `loginctl show-user root` → **không nối được bus** (`Failed to connect to bus: No such file or directory` — như các đợt trước, logind chết, không có D-Bus system bus).
- `/var/lib/systemd/linger/` → **không tồn tại** → không user nào linger.
- `ls /run/user/0` → **không tồn tại**.
- `crontab` → **không có lệnh** (`command not found` — không có cron).
- `systemctl list-timers --all` → 0 timer VCut (chỉ các timer hệ thống mặc định).

→ **Hướng (3) VẪN ĐỨNG lần thứ 17 liên tiếp** (quyết (j) đợt 168 ghi nhận lần thứ 15; T5-169 kiểm lại lần thứ 16; T5-170 kiểm lại lần thứ 17, cùng kết quả). Không có bằng chứng nào cho hướng (1)/(2) (session sống / service giữ boot).

**Marker:** `~/.config/vcut-persistence-marker` CÒN, nội dung: written 2026-11-20T11:39:40Z, boot 2c0a7985 (reboot #48, btime 2026-11-20T11:26:05Z); mtime **2026-11-20 11:39:47Z không đổi** — sống qua **#49–#79 = 31 reboot** nếu #79 được xác nhận (79−49+1=31). T0-170 đếm độc lập. (Sống qua #78 chưa được đếm độc lập lúc đóng đợt 169 — nay marker vẫn còn trên #79, tức đã sống qua cả #78 lẫn #79 theo file; T0 xác nhận số đếm.)

**Đồng hồ:** 2 lần đo đồng thời lúc stats: CF 11:49:27 GMT vs local 11:49:26,590–27,131Z; CF 11:49:28 GMT vs local 11:49:27,131–27,539Z → **Cloudflare nhanh hơn local ~0,4–0,9 s** (local chậm hơn CF ~1 s). Lệch ≤1 s — cùng họ các đợt trước. Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn.

---

## §3. Watcher-170 + POSTBOOT_PASS

### §3.1 POSTBOOT_PASS #79 — ĐÃ CÓ (replay-day-du, poll=0)

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t5/POSTBOOT_PASS` (315 B, mtime 11:49:14.068Z).
- **Nội dung (nguyên văn):** `boot 5df1871f-7e19-45e1-a357-1ca4fd89bc33 (btime 2026-11-22 11:11:05Z; watcher-170) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 30; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T11:49:14Z; POSTBOOT_PASS moi ghi 2026-11-22T11:49:14Z poll=0 (replay-day-du); co cu c44cc3ba luu POSTBOOT_PASS-c44cc3ba`
- **Backup cờ #77:** `POSTBOOT_PASS-c44cc3ba` (315 B) — `diff` KHỚP file gốc round169-t5.
- **Diễn biến replay #79 (theo dõi trực tiếp + log watcher + history.log):**
  - Hoạt động dpkg đầu 11:35:39Z (boot+24m34s): 2 dòng `startup packages configure` — reconcile heal + replay heal (mỗi lần `dpkg --configure -a` ghi đúng 1 dòng — T5-169 đo trực tiếp §3.5).
  - `apt-get update` (lazy index refresh) ~11:35:40Z → ~11:44:36Z (**~8m56s** — mirror chậm; so với #77: update nhanh, toàn bộ replay chỉ ~100 s sau khi hoạt động đầu; #47 từng mất ~12 phút cho update — cùng họ chậm).
  - Transaction apt đầu 11:44:36Z; installs 11:44:37Z → 11:48:15Z (**~3m39s, 50 transaction**, mỗi gói 1 transaction — chữ ký vòng lặp per-package, commandline mang DPkg::Post-Invoke recorder).
  - Breakdown dpkg 1545 dòng: **106 startup + 169 install + 1.040 status + 178 configure + 43 trigproc + 9 upgrade = 1.545** — **Y HỆT breakdown replay #77** (cùng ledger, cùng cache, cùng kết quả).
  - Gói đầu cài: libaspell15 (11:44:37Z); gói cuối: gstreamer1.0-tools (11:48:15Z). 4 gói gstreamer đều có trong history.log (4 hit).
  - Cache 178 .deb (162.917.560 byte ≈ 155,4 MiB); lists 30 (cogentco 27 file, azure 0 — **mirror đổi so với #77**: azure 34, cogentco 0; cả hai URI đều có trong ubuntu.sources; update lần này tải cogentco). GST thư mục thật 269 file = debroot 269.
  - Receipt `/var/lib/hatch-preflight/os-intent-replayed.sha256` ghi 11:48:16Z, hash `d3ef183d…` **= sha256 của ledger hiện tại** — pass sạch (failures=0).
  - Ledger: 1 dòng, compacted=true, ts 1795327298, added 170, removed 0 (đã compact từ #76; trên #79 compact là no-op rc=20, mtime giữ 07:36:32Z).
  - Toàn bộ replay: 11:35:39Z → 11:48:16Z = **12m37s** (chủ yếu là update chậm; vòng lặp per-package chỉ ~3m39s).
- **Verify độc lập (T5, 11:49:24Z + watcher poll0 11:49:14Z):** postboot check-only **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269, thư mục thật** (log `t5-postboot-independent-5df1871f.log` + `t5-postboot-poll0-5df1871f.log`).
- **11 gói đã cài (kiểm bằng dpkg-query, stats §5):** libevent-2.1-7t64 2.1.12-stable-9ubuntu2.2, gstreamer1.0-plugins-base 1.24.2-1ubuntu0.7, gstreamer1.0-plugins-good 1.24.2-1ubuntu1.8, gstreamer1.0-plugins-bad 1.24.2-1ubuntu4, gstreamer1.0-plugins-ugly 1.24.1-1build1, gstreamer1.0-gl 1.24.2-1ubuntu0.7, gstreamer1.0-libav 1.24.1-1build1, gstreamer1.0-x 1.24.2-1ubuntu0.7, libavif16 1.0.4-1ubuntu3, libgstreamer1.0-0 1.24.2-1ubuntu0.2, libevdev2 1.13.1+dfsg-1build1 — **y hệt phiên bản trên #77 (và #75)**.
- **Độ phủ ledger:** dpkg-query theo tên literal: 169/170 — thiếu duy nhất `libevent-2.1-7` (tên cũ). Nhưng `apt-get install -s libevent-2.1-7` trả **exit 0** → thỏa qua `Provides` của `libevent-2.1-7t64` → **hiệu dụng 170/170, pass sạch, receipt được ghi** (stats §5 mới của đợt này resolve qua `apt-get install -s` — bài học F-169-T5-2 đã áp dụng).
- **Caveat dòng đầu log postboot (F-169-T5-3, vẫn đúng đợt này):** dòng tóm tắt đầu của script postboot mang thời gian + md5 CŨ (boot #41: 01:26:35Z/01:30:13Z, md5 51d12c3d) dù các con số khác (1545/169/9/178/269) trùng #79 — đó là ghi chú lịch sử gắn cứng trong script, KHÔNG phải số đo của boot này. Chỉ dùng các dòng verdict PASS + exit code + kiểm độc lập bằng dpkg-query (stats §5) làm bằng chứng. Không trích dòng đó cho thời gian/md5.

### §3.2 POSTBOOT_PASS #77 / #75 — VẪN CÓ, còn hiệu lực (theo dõi tiếp)

- Nội dung round169-t5/POSTBOOT_PASS (#77, replay-day-du, poll=0, ghi 08:46:44Z) và round168-t5/POSTBOOT_PASS (#75, mode repair, ghi 06:01:38Z) không đổi; mtime không đổi.
- Backup `POSTBOOT_PASS-c44cc3ba` trong round170-t5 `diff` KHỚP file gốc — cờ #77 được bảo toàn qua lần ghi cờ thứ tư.
- #74 (round167-t5) và #70 (round166-t5) cũng còn nguyên (kiểm lại bằng stats script §2c).

### §3.3 POSTBOOT_PASS #78 — KHÔNG CÓ, không bù được

- **#78 (e298bb52):** grep toàn bộ `POSTBOOT_PASS*` dưới `hidden_files/round*/` 0 kết quả (cả file cờ lẫn tên file lẫn nội dung; grep cả docs đợt 169 chỉ thấy nhắc tới trong LIMITS/.done, không có file cờ). **Boot thứ 14 không có cờ.**
- Không bù được (cùng quy tắc #63/#66/#68/#71/#72/#73/#76: cờ chỉ chứng nhận phép đo trực tiếp trên boot sống; #78 chết trước khi có phiên T5 nào — không có phiên T5 nào chạy trên #78).
- Đếm boot không cờ tới nay: #51, #53, #54, #55, #57, #60, #63, #66, #68 (9, theo T5-166) + #71 (10) + #72 (11) + #73 (12) + #76 (13) + **#78 (14)**.

### §3.4 Watcher-169 — CHẾT theo #78 (xác minh đầy đủ từ log gốc)

**START 08:46:43Z, pid 25426, boot c44cc3ba; CHẾT theo reboot #78 (poll cuối 09:14:49Z; `kill -0`: No such process — T5-170 xác minh lúc mở).** Log 62 dòng, **57 poll** (gaps {30 s ×50, 31 s ×6} — không có gap 860 s như watcher-168), md5 {2e5743e3 (1545 dòng), 89c179f0 (1546 dòng — sau probe của T5-169 lúc 08:55:22Z)}, boot_set [c44cc3ba], kinds {START: 1, MONITOR: 1, REPLAY_DONE: 1, postboot: 1, FLAG-WRITTEN: 1}. **0 poll nào có proc apt/dpkg** (57/57 dòng poll đều `apt=[] apt2=[] dpkg=[]`). **Poll cuối 09:14:49Z muộn hơn btime #78 (09:14:38Z) 11 s — xem F-170-T5-1 (§4.2).**

### §3.5 Watcher-170 — 1 lần khởi động, đang chạy

**START 11:42:42Z, pid 20516, boot 5df1871f**, cùng script `replay-watch-170.sh` (tạo bằng `make-watcher-170.py` từ nguồn 169 — xem §10 F-170-T5-2). Init: dpkg 2 dòng md5 e81107bd mtime 11:35:40Z, cache 178, lists 3, gst_sys 0. Poll đều 30 s. Poll đầu ghi `apt=[843]` (apt-get update của replay đang chạy — watcher KHÔNG kích early-repair vì có proc apt, đúng thiết kế). **REPLAY_DONE + FLAG-WRITTEN ngay khi dpkg ổn định 2 poll (11:49:13Z/11:49:14Z, poll=0). Đang chạy lúc đóng LIMITS (ALIVE, kill -0 20516; poll 11:50:44Z dpkg 1545 ổn định, 0 proc).** Khoảng không-watcher: **8.873 s = 2h27m53s** (poll cuối watcher-169 09:14:49Z → START 11:42:42Z; tính từ btime #78 09:14:38Z là 8.884 s) — dài nhất từ trước tới nay vì toàn bộ đời boot #78 (116m27s) nằm trong khoảng không-watcher, không có phiên T5 nào trên #78.

**Không probe dpkg nào của T5-170:** đợt này T5 KHÔNG chạy `dpkg --configure -a` (khác đợt 169 — xem §6 B4). Mọi kiểm tra của T5 đều chỉ đọc (dpkg-query, `apt-get install -s`, postboot check-only, ps, journalctl, curl).

**Generator `make-watcher-170.py`:** viết mới theo mẫu 169, header VIẾT MỚI hoàn toàn cho đợt 170; thay token đúng chuỗi trong nguồn (`replay-watch-169.log`→`replay-watch-170.log`, `round169-t5`→`round170-t5`, `round168-t5`→`round169-t5`, `REPLAY-WATCH-169`→`REPLAY-WATCH-170`, `watcher-169`→`watcher-170`, hạn cứng `2026-11-22 11:30:00`→`2026-11-22 14:30:00`, `han cung 11:30:00Z`→`han cung 14:30:00Z`); assert thêm (không còn `replay-watch-169`/`REPLAY-WATCH-169`/`watcher-169`/`11:30:00` trong THÂN; `LOG=$DIR/replay-watch-170.log`); `bash -n` OK; 2 chuỗi "H2" còn lại trong file đều ở header comment (từ chối giả thuyết H2 — hợp lệ, như đợt 169). Spawn bằng đường dẫn TUYỆT ĐỐI + nohup + disown (F-167-T5-2 đã sửa: không dùng `cd ... && ... &`).

---

## §4. Boot #79 + đồng hồ

### §4.1 Xác minh boot #79 (boot hiện tại)

- boot_id: `5df1871f-7e19-45e1-a357-1ca4fd89bc33`; btime /proc/stat: **11:11:05Z (epoch 1795345865)**.
- Lúc mở ~11:42Z: uptime 31' → boot 11:11:05Z (khớp btime 0 s); /proc/1 mtime 11:11:15,986Z (+10,986 s); journal first entry 11:11:16Z (+11 s).
- Stats script 11:49:26Z: uptime 2.301,54 s → boot 11:11:05Z (khớp btime).
- `uptime -s` = 11:11:05Z — KHỚP btime.
- Boot #78: btime 09:14:38Z (epoch 1795338878 — T7-169 xác minh 9 nguồn); boot #77: btime 08:23:52Z (epoch 1795335832).
- **Gap #78→#79 = 6.987 s (116m27s)** — tính độc lập bằng 2 phương pháp: trừ epoch bằng python (1795345865−1795338878) + `date -d @<epoch>` đối chiếu từng btime (11:11:05Z − 09:14:38Z). Cả hai khớp.
- **Gap #77→#78 kiểm lại độc lập = 3.046 s (50m46s)** — KHỚP quyết parent đợt 169.

### §4.2 Lệch khung giờ biên #77/#78/#79 (số thô cho T2-170 — KHÔNG phán (m))

- **F-170-T5-1 (phát hiện chính đợt này): poll cuối watcher-169 09:14:49Z trên boot c44cc3ba MUỘN HƠN btime #78 (09:14:38Z, T7 xác minh 9 nguồn) 11 s.** Log watcher-169: 57 poll, poll cuối 09:14:49Z, log mtime 09:14:49.046Z (ghi trực tiếp, không phải timestamp ước lượng). Btime #78 được củng cố bởi các mốc +11/+12 s tự nhất quán trên #78 (/proc/1 mtime 09:14:49.824Z = btime +11,824 s; wtmp begins 09:14:49Z = +11 s; journal first entry 09:14:50Z = +12 s — theo NOTES T7-169) và cùng mẫu trên #77 (+11,990 s) và #79 (+10,986 s).
  - Trùng hợp đáng chú ý: /proc/1 mtime trên #78 (09:14:49.824Z) nằm trong cùng 1 giây với poll cuối watcher-169 (09:14:49.046Z) — chênh 0,778 s.
  - Giả thuyết mạnh nhất (CHƯA CHỨNG MINH): **shutdown container cũ chồng lấp** — tiến trình cũ (watcher-169, chạy bằng nohup ngoài systemd service) sống thêm vài giây sau khi kernel mới đã boot, cho tới khi cgroup cũ bị SIGKILL; btime #78 vẫn đúng. Cơ chế này giải thích được cả việc sampler chết sớm hơn (mẫu cuối #77 09:14:20Z, TRƯỚC btime 18 s — theo LIMITS đợt 169): các tiến trình chết vào thời điểm khác nhau trong lúc shutdown.
  - **Hệ quả cho T2: "poll cuối watcher" KHÔNG còn là cận trên chắc chắn cho "boot cũ chết"** — lần đầu tiên có poll SAU btime (trước đây luôn TRƯỚC btime: #76 poll cuối trước btime 5 s; #70/#71 20 s; #73/#74 12 s). Phân tích khung #77/#78 phải tính khả năng khung #77 kéo dài ≥11 s qua btime #78.
  - **Hệ quả cho (m) #78 (T2-170 + parent quyết, T5 KHÔNG phán):** NẾU btime #78 thực tế ≥09:14:49Z (tức btime đã ghi sai 11 s) thì requeue 09:15:18.693Z = btime+≤29,7 s, NGOÀI dải dương 33–49,8 s → (m) #78 không còn dương. NHƯNG bằng chứng btime (mốc +11,8 s khớp mẫu #77/#79) mạnh hơn một dòng poll đơn lẻ — T5 trình cả hai phía, không chọn. Cần T2-170 đối chiếu độc lập.
- Biên #78/#79: **không có poll watcher nào** trong toàn bộ đời boot #78 (không watcher nào sống trên #78); watcher-170 khởi động sau btime #79 31m37s (11:42:42Z) → không có poll watcher nào kẹp giữa btime #78 và #79; không đo được lệch khung kiểu "poll cuối sau btime" cho biên này.
- Các mốc khung mới đều sau btime, cùng chiều, không mâu thuẫn: /proc/1 +10,986 s; journal first entry +11 s.
- Reboot thật #79 ∈ (09:14:49Z, 11:42:42Z] theo watcher (poll cuối #77 → poll đầu #79); btime neo #78 09:14:38Z, #79 11:11:05Z.
- Requeue run 169 tại #78 + offset (m) thuộc T7-170/T2-170 (T5 chưa có số — KHÔNG tự tính offset). **(m) #78 parent CHƯA QUYẾT** — T2-170 đối chiếu độc lập + parent quyết (xem F-170-T5-1 trên).

### §4.3 Lists #79 = 30 (mirror cogentco) — khác mẫu 37 của #77

- Lists lúc mở: 3 (base-only: cli.github + cloudflare); sau update của replay: 30 — gồm `mirror.cogentco.com_*` (27 file), **azure 0 file** (ubuntu.sources liệt kê 2 URI: azure + mirror.cogentco.com, như #77). #77 lists 37 (azure 34, cogentco 0); #74 lists 37 (1 mirror); #75 sau repair update: 75 (2 mirror).
- **Không file .deb nào được tải lại trên #79**: toàn bộ 178 .deb trong cache đều có mtime ≤ 2026-11-18 16:22:47Z — replay #79 chạy hoàn toàn bằng cache-hit (như #77).
- Ghi nhận khác biệt mirror, không suy nguyên nhân (có thể apt chọn URI thứ hai khi URI đầu chậm — bằng chứng trong cell không phân biệt được).
- Proxy egress: `http://hatch-egress-proxy:3128` (cả http/https — `/etc/apt/apt.conf.d/80hatch-egress-proxy`).

---

## §5. GHI NHẬN ĐÓNG ĐIỀU TRA REPLAY #75 (theo quyết parent (j) đợt 169)

Parent đã quyết (j) đợt 169: **CHẤP NHẬN ĐÓNG điều tra vì sao replay #75 không chạy ở mức CHƯA XÁC ĐỊNH nguyên nhân gốc + leo thang kiểm journal host-side.** T5-170 ghi nhận và KHÔNG mở lại điều tra trong cell. Tóm tắt trạng thái đóng (từ LIMITS T5-169 §5, không điều tra thêm):

- **Đã loại trừ bằng bằng chứng:** backoff (guard cả reconcile — #75 có 2 dòng dpkg nên backoff không engage; tối đa 2 strike lúc #75 mở, xa ngưỡng 5); receipt fast-path skip (receipt không sống qua reboot — #77 chứng minh thư mục receipt được tạo mới lúc ghi); fold từ chối (ledger 1 dòng ~2 KB, 170 tên — xa ngưỡng; cùng ledger đã fold thành công trên #76/#77); gói/version-drift/mirror (cùng cache + mirror, #77 và #79 đều cài đủ 170 intent, failures=0); cache trống (vòng lặp có fallback tải — #73 chạy với cache lạnh); tranh lock (lock chỉ làm apt chờ, vẫn hiện proc — 191 poll 0 proc); "chạy muộn" (191 poll / 1h49m, 0 proc — vắng hẳn, không phải muộn).
- **Còn lại 2 ứng viên host-side (chỉ journal host-side của unit `hatch-preflight-opportunistic` trên boot #75 mới phân biệt được):**
  - (i) Pass chết/lỗi lặng ở đoạn host-side giữa reconcile xong (05:33:26Z) và vòng lặp (re-snapshot, fold, receipt-check, compact, hoặc spawn/feed payload qua nsenter).
  - (ii) Payload chạy nhưng feed vòng lặp rỗng/hỏng (chuỗi `verb pkg` không tới được `while read`): vòng lặp đọc EOF ngay → 0 install, 0 proc, failures=0 → reseed → autoclean → exit 0 → receipt ghi (bị xóa theo boot). Ứng viên này GIẢI THÍCH ĐƯỢC cả cache 178→0 (autoclean cuối payload với lists chỉ có base).
- **Hướng leo thang:** kiểm journal host-side của unit preflight boot #75 (+ #76) và log RV snapshot/restore — T5 trong cell không đọc được (journal cell chỉ giữ boot hiện tại; host journal không mount vào cell). Bằng chứng gốc trong cell đã hết — cùng họ quyết đóng điều tra #73 ở mức chưa xác định (quyết (j) đợt 168).
- **Đối chứng mới đợt 170:** replay #79 CHẠY ĐẦY ĐỦ (như #77) — driver KHÔNG chết hệ thống; lỗi #75 là nhất thời (transient). Vòng lặp #78 có chạy xong không thì KHÔNG BIẾT (dpkg.log #78 mất theo reboot; không receipt nào sống qua boot để đối chiếu) — ghi rõ, không suy đoán.

---

## §6. Quy tắc đứng

(Trích từ LIMITS các đợt trước — giữ nguyên, không đổi.)

1. **Cờ POSTBOOT_PASS chỉ chứng nhận phép đo trực tiếp trên boot sống.** Boot đã chết trước khi có phiên T5 thì KHÔNG bù được (áp dụng #78 đợt này; #76/#71/#72/#73 trước đó).
2. **Watcher chết theo reboot là bình thường** — watcher là tiến trình trong cell, không sống qua reboot. Khoảng không-watcher được đo và ghi (đợt này: 8.873 s).
3. **Hướng (3) đứng:** không có bằng chứng session/service nào giữ boot sống qua reboot (kiểm lại lần thứ 17 đợt này — xem §2).
4. **Khung giờ boot cũ = XÁC NHẬN OVERLAP, không đổi verdict (m)** (quyết (e) đợt 166). T5 chỉ đo số thô tại biên reboot, giao T2 đối chiếu. **Bổ sung đợt 170 (F-170-T5-1):** poll cuối watcher có thể nằm SAU btime boot mới (11 s) — cận trên "boot cũ chết" từ poll cuối không còn chắc chắn; T2 tính khung phải tính khả năng này.
5. **Không kết luận nguyên nhân khi chưa có bằng chứng trực tiếp** (áp dụng cho replay #75 — xem §5; và cache 178→0→178 — xem LIMITS T5-169 §5.5).
6. **Chỉ stage, KHÔNG PUSH** — user tự push sau từ main chat.
7. **B4 — KHÔNG chạy probe chạm dpkg trong cửa sổ attempt của T4** (GIỮ NGUYÊN, không nới). Đợt 169 probe `dpkg --configure -a` lúc 08:55:22Z làm +1 dòng dpkg.log, nhiễm attempt2 của T4. **Đợt 170: T5 KHÔNG chạy probe chạm dpkg nào** (0 lần); mọi kiểm tra đều chỉ đọc. T4-170: luật "không chạy script phân tích nặng trong cửa sổ attempt" vẫn đứng (nhắc lại từ đợt 169).

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM (stats 11:50:55Z, boot #79):** MemTotal 8.124.900 kB; MemAvailable 1.869.972 kB; MemFree 141.500 kB (lúc 11:49:26Z); loadavg 1,84 (lúc stats lần 2; load 15' là 2,77). Thấp hơn #77 (MemAvailable 2.864.504 kB) — replay + các attempt T4 đang chạy trong phiên. (T9 đo headroom chính thức — T5 chỉ ghi snapshot.)

**ENOSPC (T9 đếm chính thức; T5 chỉ ghi snapshot):**
- #79: **11 dòng lúc 11:50:55Z** (journal 174 dòng, dòng đầu 11:36:23Z = boot+25m18s, từ `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`).

**X11:**
- TRỐNG lúc mở #79 (~11:42Z); 0 Xvfb thật (`pgrep -x Xvfb` exit 1).
- Lúc stats 11:49:26Z: **3 socket X193/X194/X195 mới, mtime 11:44Z, 0 Xvfb thật** — xuất hiện trong lúc replay chạy (giữa 11:43:11Z và 11:44:xxZ). Cùng mẫu các đợt trước (3 socket X193/X194/X195 mtime 08:49Z đợt 169; 05:45Z/06:02Z đợt 168) — **giao T8-170 dọn**. Lúc viết LIMITS (~11:52Z) vẫn 3 socket.

**Journal:** #79: idx 0 duy nhất; 143 dòng lúc 11:43:12Z; 174 dòng lúc 11:50:55Z, dòng đầu 11:11:16Z. Không có OOM/killed process trên #79 (chưa grep toàn bộ — T9 kiểm chính thức; T5 chỉ ghi snapshot).

---

## §8. Nợ mở chuyển đợt 171 (T5-171 sở hữu)

1. **Watcher-170 (pid 20516) tiếp tục giám sát tới 14:30:00Z 22/11** — T5-171 kiểm tra log cuối + poll cuối + END line (hoặc chết theo reboot mới). Nếu replay chạy lại sau khi T5-170 đóng (dpkg tăng từ 1545), watcher log sẽ ghi lại — T5-171 diễn giải.
2. **POSTBOOT_PASS #78 KHÔNG CÓ** (boot thứ 14 lọt, không bù được); #68/#63/#66 vẫn không có. **#79 ĐÃ CÓ (replay-day-du, poll=0)** — theo dõi tiếp; cờ repair #75 vẫn giữ nguyên (không ghi lại cờ replay).
3. **Marker 31 reboot #49–#79** (nếu #79 được xác nhận; T0 đếm độc lập).
4. **F-170-T5-1 (poll cuối watcher-169 sau btime #78 11 s):** giao T2-170 đối chiếu độc lập + parent quyết — có thể ảnh hưởng (m) #78 (xem §4.2). T2-170 cũng đối chiếu INSIDE #77/#78 (dải FULL123/FULL124 — chuỗi MỚI từ #73 dài 3 nếu INSIDE), kiểm lệch khung #77/#78, kiểm lại FULL121/FULL122 độc lập.
5. **Điều tra replay #75: ĐÃ ĐÓNG** theo quyết parent (j) đợt 169 (xem §5) — không mở lại trong cell; leo thang journal host-side thuộc parent.
6. **Cache 178 → 0 → 178: cơ chế xóa + khôi phục CHƯA XÁC ĐỊNH** (giả thuyết mạnh nhất: autoclean cuối payload với lists base-only + snapshot restore hồi lại — xem LIMITS T5-169 §5.5); cần log host-side (RV snapshot/restore).
7. **Replay #79 khởi động muộn (boot+24m34s mới có hoạt động dpkg đầu):** muộn nhất từng kẹp được (so #77 boot+11m48s, #75 boot+40s, #74 boot+49s) — driver host-side start trễ là bình thường (chạy sau khi cell READY, song song daemon); ghi nhận, không điều tra (pass vẫn xong trong 12m37s, chủ yếu do update chậm ~9 phút).
8. **Guard symlink GST:** không kích hoạt đợt này (không repair nào chạy — dpkg 2 dòng lúc mở nhưng replay ĐANG CHẠY nên early-repair không kích; GST thư mục thật 269 từ đầu sau replay). Bài học F-168-T5-2 vẫn đứng cho boot mới trong phiên watcher-170 nếu early-repair kích hoạt: T5-171 gỡ symlink tay trước khi install nếu replay bắt đầu sau repair.
9. TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet.
10. G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời — để yên, không nhắc lại). R9 (a) vẫn chờ user (số đếm vẫn là 16).

---

## §9. Đề xuất cho parent

- **(a) Chấp nhận kết quả T5-170:** cờ #79 (replay-day-du, poll=0, verify độc lập exit 0 — T5 11:49:24Z + watcher poll0 11:49:14Z); #78 không cờ, không bù được; #77/#75 còn hiệu lực; watcher-170 đang chạy; hướng (3) lần thứ 17; marker 31 reboot (chờ T0 xác nhận); gap #78→#79 = 6.987 s.
- **(b) Cờ #79 replay-day-du (không phải repair) có được tính là POSTBOOT_PASS đủ điều kiện cho gate (a) của T4/T8 không?** Đây là cờ replay đầy đủ thứ hai liên tiếp sau #77 (pass sạch, receipt khớp ledger, 170/170 hiệu dụng) — T5 đề xuất: cờ ĐỨNG cho gate (a) không caveat mode repair (như #77, quyết (j) đợt 169). T5 không phán gate — parent quyết. Lưu ý: T4-170 đã có gate0wait log trước khi cờ #79 được ghi (11:49:14Z) — T4 tự đối chiếu lại.
- **(c) Số hiệu #79 (dự kiến):** xác nhận khi T0-170 hoàn tất xác minh 9 nguồn (đặc biệt btime 11:11:05Z và boot_id 5df1871f).
- **(d) F-170-T5-1 — poll cuối watcher-169 sau btime #78 11 s:** T5 trình mâu thuẫn + giả thuyết shutdown chồng lấp + hệ quả cho (m) #78 và phân tích khung của T2. Đề xuất: giao T2-170 đối chiếu độc lập btime #78 (epoch 1795338878) với các nguồn T7-169 đã ghi (không còn đọc được /proc/stat của #78 trên #79) rồi parent quyết xem (m) #78 có còn dương không. T5 KHÔNG phán (m).
- **(e) Điều tra replay #75: ĐÃ ĐÓNG** theo quyết (j) đợt 169 — không cần quyết thêm; leo thang journal host-side chờ parent sắp xếp (nếu có kênh host).
- **(f) X11 X193/X194/X195 (11:44Z):** giao T8-170 dọn theo mẫu các đợt trước.

---

## §10. Sai số của chính T5-170 (ghi để đợt sau khỏi lặp)

- **F-170-T5-1 — Poll cuối watcher-169 09:14:49Z muộn hơn btime #78 (09:14:38Z) 11 s (PHÁT HIỆN, không phải lỗi của T5-170):** xem §4.2 đầy đủ. T5-170 không tạo ra mâu thuẫn này — chỉ phát hiện khi đọc log watcher-169 lúc mở (T5-169 đóng cờ lúc 09:0x–09:11Z, TRƯỚC #78, nên không thể thấy). Giả thuyết shutdown chồng lấp CHƯA CHỨNG MINH; hệ quả cho T2/(m) #78 đã trình ở §4.2.
- **F-170-T5-2 — Transform `make-stats-170.py` có 2 lỗi (ĐÃ SỬA + verify bằng diff rỗng):** (i) regex thay docstring dùng `^"""` không khớp vì file bắt đầu bằng shebang → docstring cũ còn nguyên; (ii) 2 dòng replace §9 gõ nhầm `round170` ở cả hai vế (no-op) → §9 còn `round169-t*.done`. Phát hiện khi kiểm tra file đã sinh; đã sửa tay file đích + sửa transform (dời thay docstring xuống CUỐI, sau mọi lần đổi tên) + chạy lại transform và `diff` với file đã sửa tay — **diff rỗng, transform tái tạo đúng**.
- **F-170-T5-3 — Stats script §4 pgrep watcher pattern còn `replay-watch-169.sh` (transform thiếu thay `.sh`):** lần chạy stats đầu (11:49:26Z) ghi `watcher170_ps=KHONG-CHAY` SAI, trong khi `kill -0 20516` = ALIVE trong cùng lần chạy. Đã sửa transform (thêm thay `.sh`) + script, chạy lại stats lần 2 (11:50:55Z): `watcher170_ps=20516 ... ALIVE` đúng. Bài học: transform phải thay cả 3 hậu tố `.log`/`.sh`/không hậu tố cho mọi tên watcher — kiểm bằng grep `169` trên file đã sinh (trừ các tham chiếu lịch sử có chủ đích).
- **F-170-T5-4 — Stats §2c rel-list đường dẫn backup cũ (check phụ lỗi thời, KHÔNG ảnh hưởng số liệu):** rel-list liệt kê `round170-t5/POSTBOOT_PASS-576ca271` v.v. (KHONG CO) vì transform không cập nhật tên file backup trong list đó. Tìm kiếm glob §2c mới là chuẩn và đúng (liệt kê đủ cờ #79/#77/#75/#74/#70 + backup). Các đợt sau: hoặc cập nhật rel-list theo đúng tên backup của đợt, hoặc bỏ check phụ này, chỉ giữ glob.
- **F-170-T5-5 — Chẩn đoán leftover của `make-stats-170.py` còn nhiễu (cosmetic):** khối in `LEFTOVER-169-LINES` chạy TRƯỚC bước thay docstring (đã dời xuống cuối) nên vẫn liệt kê các dòng docstring cũ — chỉ là nhiễu chẩn đoán, file cuối đúng (diff rỗng, xem F-170-T5-2). Các đợt sau: dời chẩn đoán leftover xuống sau bước thay docstring, hoặc bỏ.
- **F-170-T5-6 — 2 chỗ gõ nhầm tên/số trong bản nháp LIMITS (ĐÃ SỬA trước khi đóng):** (i) timeline §1 ghi "poll cuối watcher-168" thay vì watcher-169; (ii) §8.8 ghi dở câu "dpkg 2 > ...". Cả hai đã sửa ngay khi soát lại trước khi viết cờ. Bài học: số liệu đã đúng nhưng tên thực thể phải soát kỹ — copy mẫu cũ dễ mang tên cũ theo.

---

## §11. Batch stage

- **File stage:** `~/workspace/repo-1/docs/PHASE9_ROUND170_T5_INFRA_LIMITS.md` (file này).
- **Paths file:** `~/workspace/repo-1-push/paths-loop/phase9-round170-t5-infra.txt` (NUL-delimited, 1 entry — chỉ file text, KHÔNG binary).
- **Verify:** read-back bằng `od -c` sau khi stage (theo mẫu T5-166/T5-167/T5-168/T5-169).
- **KHÔNG PUSH** — user tự push sau từ main chat.
- Các file làm việc trong `round170-t5/` (watcher script/log, stats script/output, postboot log, cờ POSTBOOT_PASS + backup, watcher-status-at-open) KHÔNG stage đợt này (theo mẫu T5-169: chỉ stage LIMITS); chúng nằm trên đĩa để T10/parent đối chiếu.

---

## Phụ lục A — Trích stats output (`t5-stats-170-output.txt`, chạy lần 2 11:50:55Z)

```
--- 1. boot id + uptime ---
boot_id=5df1871f-7e19-45e1-a357-1ca4fd89bc33
btime=1795345865 (2026-11-22 11:11:05 UTC)
uptime=2301.54 (boot 2026-11-22 11:11:05 UTC, luc stats lan 1 11:49:26Z)
clock: local_truoc=11:49:26.590Z CF=Sun, 22 Nov 2026 11:49:27 GMT local_sau=11:49:27.131Z (lan 2 tuong tu)
--- 2a. marker ---
marker_mtime=2026-11-20 11:39:47.000000000 +0000
--- 2b. grep POSTBOOT_PASS (tat ca round) ---
#5df1871f: round170-t5/POSTBOOT_PASS
#e298bb52 (#78): 0 ket qua — KHONG CO
#c44cc3ba: round169-t5/POSTBOOT_PASS, round170-t5/POSTBOOT_PASS-c44cc3ba (+ round170-t5/POSTBOOT_PASS theo noi dung 'co cu')
#f2b97695 (#76): 0 ket qua — KHONG CO
#576ca271: round168-t5/POSTBOOT_PASS, round169-t5/POSTBOOT_PASS-576ca271 (+ round169-t5/POSTBOOT_PASS theo noi dung 'co cu')
#194efd93: round167-t5/POSTBOOT_PASS, round168-t5/POSTBOOT_PASS-194efd93 (+ round168-t5/POSTBOOT_PASS theo noi dung 'co cu')
#b643911f (#73): 0 ket qua — KHONG CO
#9e089ef6 (#72): 0 ket qua — KHONG CO
#ea73ac4f (#71): 0 ket qua — KHONG CO
#0c8a94aa (#68): 0 ket qua — KHONG CO
--- 3. round170-t5/POSTBOOT_PASS (#79, xac minh lai) ---
boot 5df1871f-7e19-45e1-a357-1ca4fd89bc33 (btime 2026-11-22 11:11:05Z; watcher-170) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 30; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T11:49:14Z; POSTBOOT_PASS moi ghi 2026-11-22T11:49:14Z poll=0 (replay-day-du); co cu c44cc3ba luu POSTBOOT_PASS-c44cc3ba
mtime: 2026-11-22 11:49:14.067Z
gst_sys_files=269
apt_procs= (trong, luc stats)
watcher170_ps=20516 bash .../replay-watch-170.sh (ALIVE)
watcher169_pid25426_kill0=DEAD
--- 5. kiem tra goi postboot #79 + ledger ---
11/11 goi da cai (bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1); 5/5 lib; GST 269 = debroot 269
ledger literal 169/170, thieu ['libevent-2.1-7'] — nhung apt-get install -s rc=0 (Provides cua libevent-2.1-7t64) → hieu dung 170/170
--- 6. ENOSPC ---
#79: 11 dong (journal 174 dong, dong dau 11:36:23Z)
--- 7. RAM / load ---
MemTotal 8124900 kB; MemAvailable 1869972 kB; MemFree 141500 kB; loadavg 1.84
--- 8. systemd (huong 3) ---
user@0 inactive; logind inactive; dbus inactive; loginctl khong noi duoc bus; /var/lib/systemd/linger KHONG TON TAI; /run/user/0 KHONG TON TAI; khong cron; 0 timer VCut
--- 9. .done hien co (luc stats lan 2) ---
round170-t0.done 11:41:24Z; round170-t1.done 11:50:02Z; round170-t6.done 11:50:07Z
--- 10. X11 ---
3 socket X193 (mtime 11:44Z)/X194/X195 (mtime 11:44Z); 0 Xvfb that
--- 11. watcher-169 log (doc lap) ---
57 poll tren #77, 62 dong, gaps {30s x50, 31s x6}, poll cuoi 09:14:49Z, mtime truc tiep 09:14:49.046Z; 0 poll co proc apt/dpkg; F-170-T5-1: poll cuoi SAU btime #78 11 s
--- 12. dpkg breakdown + apt history #79 ---
startup 106 + install 169 + status 1040 + configure 178 + trigproc 43 + upgrade 9 = 1545 dong (Y HET #77); history 50 transaction (11:44:36-11:48:15Z); 4 goi gstreamer co mat
--- 13. replay #79: receipt + ledger + dpkg-state ---
receipt 11:48:16Z hash d3ef183d... = ledger sha256 d3ef183d...; ledger 1 dong mtime 2026-11-22 07:36:32Z (compact tren #76); dpkg-state.txt 952 dong mtime 11:48:16Z
--- 14. dieu tra: cache .deb mtime + lists + apt dirs ---
cache 178 .deb, mtime cu nhat 2021-01-02, moi nhat 2026-11-18 16:22:47Z; TAT CA 178 file < btime #78 (09:14:38Z); partial/ mtime 07:36Z (#76); lists cogentco 27 file / azure 0; InRelease mtime cu (tu update #79 11:35-11:44Z); lock/auxfiles/partial cham 11:35:42-11:44:00Z (#79)
```

## Phụ lục B — File làm việc trong `round170-t5/` (không stage, để đối chiếu)

- `watcher-status-at-open.txt` (mở 11:42Z trên #79)
- `make-watcher-170.py`, `replay-watch-170.sh` (14.300 B)
- `replay-watch-170.log` (trực tiếp; 19 dòng, 14 poll lúc stats lần 1 11:49:26Z), `replay-watch-170.nohup.log` (trống)
- `make-stats-170.py`, `t5-stats-170.py` + `t5-stats-170-output.txt` (chạy lần 2 11:50:55Z)
- `t5-postboot-independent-5df1871f.log` (T5 verify độc lập, exit 0, 11:49:24Z) + `t5-postboot-poll0-5df1871f.log` (watcher poll0, exit 0, 11:49:14Z)
- `POSTBOOT_PASS` (#79, 315 B) + `POSTBOOT_PASS-c44cc3ba` (backup cờ #77, diff khớp)
