# PHASE 9 — ROUND 172 — T5 INFRA LIMITS

**Đợt:** 172 (mở lượt cron 00:35:51 +07 23/11/2026 = 17:35:51Z 22/11; hạn cờ ~20:00Z, hạn cứng 20:30Z).
**Người viết:** T5-172. **Ngày:** 22/11/2026. **Boot làm việc lúc đóng:** #81 (CHƯA XÁC NHẬN — chờ T0-172 xác minh 9 nguồn, quyết (d) aggregate 171) 4b9db449, btime 17:02:05Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #81 (repair-sớm-quyết-h, poll=1 — xem §3.1). File này là 1 entry duy nhất stage đợt 172 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #81 (4b9db449, btime 17:02:05Z) | **ĐÃ CÓ 17:50:32Z (boot+48m27s, repair-sớm-quyết-h, poll=1)** — watcher-172 EARLY-REPAIR TRIGGER 17:41:39Z (boot+39m34s), form-B exit=1, --repair exit=0, postboot poll1 exit=0 (T5 verify độc lập exit 0 lúc 17:53:46Z), 11/11 gói + 5/5 lib, GST symlink→debroot 269=269. **CAVEAT: KHÔNG phải replay-đầy-đủ** — xem §3.1 |
| Replay host-side #81 | **KHÔNG CHẠY** — tới lúc watcher spawn (boot+39m34s) dpkg chỉ 2 dòng reconcile, cache 0, lists 5, 0 hoạt động apt trong journal; tới lúc đóng vẫn không có dấu hiệu replay nào (apt history chỉ 1 transaction của repair) |
| POSTBOOT_PASS #80 (2acdd1ab) | **VẪN CÓ, còn hiệu lực** (replay-day-du, poll=0, 14:52:09Z — quyết (j) đợt 171: cờ đứng cho gate (a) không caveat mode repair); backup POSTBOOT_PASS-2acdd1ab diff KHỚP |
| POSTBOOT_PASS #79 / #77 / #75 | **VẪN CÓ, còn hiệu lực** (#79 replay-day-du 11:49:14Z; #77 replay-day-du 08:46:44Z; #75 mode repair 06:01:38Z) |
| POSTBOOT_PASS #78 (e298bb52) | **KHÔNG CÓ** (grep 0 kết quả — boot thứ 14 không cờ, không bù được) |
| Reboot trong phiên | **#81 (4b9db449, btime 17:02:05Z, gap #80→#81 = 9.064 s = 2h31m04s)** — xảy ra TRƯỚC khi đợt mở 33m46s, trong khoảng không-watcher; CHƯA XÁC NHẬN (chờ T0-172) |
| Repair #81 | **CHẠY ĐẦY ĐỦ 8m52s (17:41:40Z → 17:50:32Z)** — apt-get update ~8,5 phút (mirror chậm) + 1 transaction install 17:50:20–17:50:32Z; dpkg 2 → 795 dòng (breakdown 4 startup + 106 install + 568 status + 4 upgrade + 110 configure + 3 trigproc); cache 0 → 110 .deb; lists 5 → 75 (azure 34 + cogentco 34); GST symlink→debroot 269 |
| Watcher-172 | START 17:41:39Z, pid 17944, boot 4b9db449; **vẫn ĐANG CHẠY** lúc đóng (poll 18:00:03Z); 20 poll lúc kiểm cuối 18:00:17Z |
| Watcher-171 | **CHẾT theo #81** (pid 28156 mất — kill -0 xác minh lúc mở); log 266 dòng, **261 poll, 0 proc apt/dpkg trong 261/261 poll**; poll cuối **17:02:25Z — 20 s SAU btime #81 (F-172-T5-1)**; KHÔNG có dòng END/STOP (chết theo reboot, KHÔNG dừng sớm — F-171-T5-1 KHÔNG lặp lại) |
| Khoảng không-watcher | **2.354 s = 39m14s** (poll cuối watcher-171 17:02:25Z → START watcher-172 17:41:39Z) |
| Điều tra replay #75 | **ĐÃ ĐÓNG** theo quyết parent (j) đợt 169 + ghi nhận lại (j) đợt 170/171 — T5-172 KHÔNG mở lại điều tra trong cell (xem §5) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#81 = 33 reboot** (T10-171 đếm độc lập lúc đóng aggregate 171; T0-172 đếm lại) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 19 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0, 0 timer VCut) |
| ENOSPC | #81: **46 dòng lúc stats lần 1 17:53:56Z → 48 dòng lúc stats lần 2 17:57:01Z** (journal 240 dòng, dòng đầu 17:04:00Z, từ home-assistant-ensure.service) |
| X11 | **TRỐNG lúc mở (~17:38Z); 3 socket X193/X194/X195 mới (mtime 17:45Z)**, 0 Xvfb thật — giao T8-172 dọn |
| RAM #81 | MemAvailable 2.496.232 kB lúc 17:53:56Z → 1.831.488 kB lúc 17:57:01Z; loadavg 1,97 → 1,25 |
| Đồng hồ | Local ≈ Cloudflare **−1 s** (CF nhanh hơn local ~0,6–1,9 s qua 4 lần đo) — cùng họ các đợt trước |
| Gap kiểm lại độc lập | #80→#81 = **9.064 s** (KHỚP aggregate 171 §12.3(o)); #79→#80 kiểm lại = **11.996 s** (KHỚP quyết parent đợt 170/171) — cả hai tính bằng 2 phương pháp độc lập (trừ epoch python + `date -d`) |
| Quy tắc B4 | **T5-172 KHÔNG chạy probe chạm dpkg nào** (0 lần `dpkg --configure -a`); chỉ dùng check-only đọc (dpkg-query / apt-get -s / postboot check-only) — B4 GIỮ NGUYÊN, không nới. --repair là đường watcher theo quyết (h), KHÔNG phải probe của T5 |
| T4-172 | Chưa bắt đầu lúc watcher spawn (chưa có dir round172-t4); cờ #81 ghi 17:50:32Z, trước hạn cờ ~20:00Z hơn 2 giờ |

**Số hiệu boot #81 CHƯA XÁC NHẬN theo quyết (d) aggregate 171 — chờ T0-172 xác minh 9 nguồn.**
**T5-172 KHÔNG phán (m), chỉ trình số thô — (m) #81 CHỜ T2-172 đối chiếu + parent quyết.**

---

## §1. Timeline (giờ Z, 22/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 14:31:01Z | Reboot #80 (2acdd1ab, btime) — gap #79→#80 = 11.996 s |
| 14:52:09Z | Cờ POSTBOOT_PASS #80 ghi (replay-day-du, poll=0) |
| 17:02:05Z | **Reboot #81 (4b9db449, btime, epoch 1795366925) — gap #80→#81 = 9.064 s (2h31m04s)**; xảy ra 33m46s TRƯỚC khi đợt mở |
| 17:02:17Z | Journal #81 first entry (boot+12s); /proc/1 mtime 17:02:16.745Z (boot+11,745s) |
| 17:02:25Z | **Poll cuối watcher-171 trên #80** (dpkg 1545, 0 proc) — 20 s SAU btime #81 (F-172-T5-1) |
| 17:02:37/38Z | Hoạt động dpkg duy nhất trước repair: 2 dòng `startup packages configure` (reconcile heal) |
| 17:04:00Z | Dòng ENOSPC đầu trên #81 (home-assistant-ensure.service) |
| 17:35:51Z | Lượt cron đợt 172 mở |
| ~17:38Z | **T5-172 mở trên #81**: uptime ~36' → boot 17:02:05Z (khớp btime); /tmp/.X11-unix TRỐNG; replay CHƯA CHẠY (dpkg 2 dòng, cache 0, lists 5, GST 0, không /var/log/apt, không /var/lib/hatch-preflight, journal 180 dòng 0 preflight) |
| 17:41:39Z | **Watcher-172 START, pid 17944, boot 4b9db449** (khoảng không-watcher 2.354 s tính từ poll cuối watcher-171 17:02:25Z); **EARLY-REPAIR TRIGGER ngay poll đầu** (boot_age 2.374 s, frozen 2.341 s, dpkg 2 dòng) |
| 17:41:40Z | Verify form-B postboot check-only exit=1 (đúng như chờ đợi); **--repair bắt đầu** (apt-get update chạy) |
| 17:45Z | 3 socket X11 X193/X194/X195 xuất hiện (mtime 17:45Z) |
| 17:50:20Z | Transaction apt duy nhất của repair: install 11 gói + deps (1 transaction, 12 s) |
| 17:50:32Z | **--repair exit=0; postboot poll1 exit=0; Cờ POSTBOOT_PASS #81 ghi (boot+48m27s, repair-sớm-quyết-h, poll=1)** |
| 17:53:46Z | T5 verify độc lập postboot check-only trên #81: **exit 0, 11/11 gói + 5/5 lib, GST symlink→debroot 269=269** (log `t5-postboot-independent-4b9db449.log`) |
| 17:53:56Z | Stats script chạy lần 1 (`t5-stats-172.py` → `t5-stats-172-output.txt`); watcher-172: 7 poll; RAM MemAvailable 2.496.232 kB; X11: 3 socket X193–X195 (mtime 17:45Z) |
| 17:57:01Z | Stats script chạy lần 2 (chỉ khác các giá trị phụ thuộc thời gian — xem §10); watcher-172: 13 poll; ENOSPC 48 dòng |
| ~18:00Z | T5 viết LIMITS này. Watcher-172 vẫn ĐANG CHẠY (pid 17944, ALIVE; poll 18:00:03Z dpkg 795 ổn định, 0 proc), dpkg ổn định 795 dòng |

Tuổi boot theo btime: #80: 9.064 s (2h31m04s, tính tới btime #81).

---

## §2. Hướng (3) + marker + đồng hồ

Kiểm tra lại lúc stats (2 lần: 17:53:56Z + 17:57:01Z) trên #81 (`t5-stats-172.py` §8, khớp mẫu T5-171 §2):

- `systemctl is-active user@0` = **inactive**; `logind` = **inactive**; `dbus` = **inactive**.
- `loginctl show-user root` → **không nối được bus** (`Failed to connect to bus: No such file or directory` — như các đợt trước, logind chết, không có D-Bus system bus).
- `/var/lib/systemd/linger/` → **không tồn tại** → không user nào linger.
- `ls /run/user/0` → **không tồn tại**.
- `crontab` → **không có lệnh** (`command not found` — không có cron).
- `systemctl list-timers --all` → 0 timer VCut (chỉ các timer hệ thống mặc định).

→ **Hướng (3) VẪN ĐỨNG lần thứ 19 liên tiếp** (quyết (j) đợt 171 ghi nhận lần thứ 18; T5-172 kiểm lại lần thứ 19, cùng kết quả). Không có bằng chứng nào cho hướng (1)/(2) (session sống / service giữ boot).

**Marker:** `~/.config/vcut-persistence-marker` CÒN, nội dung: written 2026-11-20T11:39:40Z, boot 2c0a7985 (reboot #48, btime 2026-11-20T11:26:05Z); mtime **2026-11-20 11:39:47Z không đổi** — sống qua **#49–#81 = 33 reboot** (81−49+1=33). **T10-171 đếm độc lập lúc đóng aggregate 171: 33 ĐÚNG; T0-172 đếm lại.**

**Đồng hồ:** 4 lần đo đồng thời lúc stats (2 lần/chạy × 2 chạy): run1 CF 17:53:57 GMT vs local 17:53:56,439–57,120Z (CF nhanh hơn ~0,9–1,5 s); CF 17:53:58 GMT vs local 17:53:57,120–57,446Z (CF nhanh hơn ~0,6–0,9 s); run2 CF 17:57:03 GMT vs local 17:57:01,630–02,599Z (CF nhanh hơn ~0,4–1,4 s); CF 17:57:03 GMT vs local 17:57:02,599–02,918Z (CF nhanh hơn ~0,1–0,4 s) → **Cloudflare nhanh hơn local ~0,1–1,5 s** (local chậm hơn CF ~1 s). Lệch ≤2 s — cùng họ các đợt trước. Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn.

---

## §3. Watcher-172 + POSTBOOT_PASS

### §3.1 POSTBOOT_PASS #81 — ĐÃ CÓ (repair-sớm-quyet-h, poll=1) — CÓ CAVEAT

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round172-t5/POSTBOOT_PASS` (324 B, mtime 17:50:32.813Z).
- **Nội dung (nguyên văn):** `boot 4b9db449-7699-4441-a4cf-72983f15dbbd (btime 2026-11-22 17:02:05Z; watcher-172) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-22T17:50:32Z; POSTBOOT_PASS moi ghi 2026-11-22T17:50:32Z poll=1 (repair-som-quyet-h); co cu 2acdd1ab luu POSTBOOT_PASS-2acdd1ab`
- **Backup cờ #80:** `POSTBOOT_PASS-2acdd1ab` (315 B) — `diff` KHỚP file gốc round171-t5.
- **Diễn biến repair #81 (quan sát TRỰC TIẾP bởi watcher-172 — khác #80, toàn bộ replay nằm trong khoảng không-watcher):**
  - Trigger 17:41:39Z ngay poll đầu (boot_age 2.374 s, frozen 2.341 s, dpkg 2 dòng) — đúng thiết kế quyết (h) đợt 150: boot+15' (17:17:05Z) đã qua, dpkg đóng băng ≥600 s, 0 proc, 2 dòng < 100, chưa repair.
  - Verify form-B 17:41:40Z: postboot check-only **exit=1** (đúng như chờ đợi — thiếu 5 lib + GST + 11 gói; xem log `t5-postboot-verify-4b9db449.log`).
  - `--repair` chạy 17:41:40Z → 17:50:32Z = **8m52s, exit=0**: `apt-get update` ~8,5 phút (mirror chậm — cùng họ #79 update ~9 phút; lists 5 → 75, azure 34 + cogentco 34) + 1 transaction install duy nhất 17:50:20–17:50:32Z (12 s).
  - Repair log (`t5-postboot-repair-4b9db449.log`): FAIL libs (thiếu 5 lib) → REPAIRED; FAIL GST (thư mục không tồn tại) → REPAIRED symlink → debroot 269 file; FAIL apt (thiếu 11 gói) → REPAIRED apt đã cài đủ 11 gói; RE-CHECK wrapper/libs/GST/apt đều PASS.
  - Breakdown dpkg 795 dòng: **4 startup + 106 install + 568 status + 4 upgrade + 110 configure + 3 trigproc = 795** — chữ ký repair 1-phần, Y HỆT tổng 795 dòng của repair đợt 150 (113 installs / 230 configure — breakdown chi tiết khác, tổng bằng nhau).
  - Gói đầu cài: iso-codes (17:50:20Z); gói cuối: gstreamer1.0-plugins-bad (17:50:29Z). Dòng cuối dpkg.log: libc-bin installed 17:50:32Z.
  - Cache 0 → **110 .deb (58.529.968 byte ≈ 55,8 MiB)**; lists 5 → **75** (cả hai mirror azure + cogentco, khác #80 chỉ cogentco 37).
  - GST: symlink → debroot, **269 = 269** (không phải thư mục thật như replay #77/#79/#80 — xem caveat).
  - **Receipt: KHÔNG CÓ** (`/var/lib/hatch-preflight/` không tồn tại — repair không ghi receipt; receipt chỉ tới từ replay host-side, mà replay #81 không chạy).
  - Ledger: 2 dòng (compacted ts 1795327298 added 170 + repair ts 1795369832 added 106), sha256 `9414d0f0…`; dpkg-state.txt 889 dòng, mtime 17:50:32Z.
- **Verify độc lập (T5, 17:53:46Z + watcher poll1 17:50:32Z):** postboot check-only **exit 0, 11/11 gói + 5/5 lib, GST symlink→debroot 269=269** (log `t5-postboot-independent-4b9db449.log` + `t5-postboot-poll1-4b9db449.log`).
- **11 gói đã cài (kiểm bằng dpkg-query, stats §5):** libevent-2.1-7t64 2.1.12-stable-9ubuntu2.2, gstreamer1.0-plugins-base 1.24.2-1ubuntu0.7, gstreamer1.0-plugins-good 1.24.2-1ubuntu1.8, gstreamer1.0-plugins-bad 1.24.2-1ubuntu4, gstreamer1.0-plugins-ugly 1.24.1-1build1, gstreamer1.0-gl 1.24.2-1ubuntu0.7, gstreamer1.0-libav 1.24.1-1build1, gstreamer1.0-x 1.24.2-1ubuntu0.7, libavif16 1.0.4-1ubuntu3, libgstreamer1.0-0 1.24.2-1ubuntu0.2, libevdev2 1.13.1+dfsg-1build1 — **y hệt phiên bản trên #80 (và #79/#77)**.
- **Độ phủ ledger — ĐÍNH CHÍNH QUAN TRỌNG (F-172-T5-3):** dpkg-query theo tên literal: **106/170 đã cài, thiếu 64 gói** (aspell, fonts, ghostscript, libgtk-4-*, imagemagick, v.v. — danh sách đầy đủ trong Phụ lục A §5). Cả 64 gói đều `apt-get install -s` rc=0 — tức là **CÀI ĐƯỢC (installable), KHÔNG PHẢI ĐÃ CÀI**. Nhãn "hiệu dụng 170/170" mà stats script in ra GÂY HIỂU LẦM cho trường hợp repair (công thức này chỉ đúng cho replay, nơi gói thiếu duy nhất được thỏa qua Provides của gói đã cài). **Số đúng: ledger literal 106/170; 64 intent KHÔNG được cài.** Postboot gate vẫn PASS vì tiêu chí của nó chỉ là 11 gói + 5 lib + GST — repair 1-phần đủ cho gate WebKit, không đủ cho toàn bộ ledger 170 intent. T5 không ghi 170/170 vào số chính thức.
- **Caveat dòng đầu log postboot (F-169-T5-3, vẫn đúng đợt này):** dòng tóm tắt đầu của script postboot mang thời gian + md5 CŨ (boot #41: 01:26:35Z/01:30:13Z, md5 51d12c3d) dù các con số khác trùng #81 — đó là ghi chú lịch sử gắn cứng trong script, KHÔNG phải số đo của boot này. Chỉ dùng các dòng verdict PASS + exit code + kiểm độc lập bằng dpkg-query (stats §5) làm bằng chứng. Không trích dòng đó cho thời gian/md5.

### §3.2 POSTBOOT_PASS #80 / #79 / #77 / #75 — VẪN CÓ, còn hiệu lực (theo dõi tiếp)

- Nội dung round171-t5/POSTBOOT_PASS (#80, replay-day-du, poll=0, ghi 14:52:09Z), round170-t5/POSTBOOT_PASS (#79, replay-day-du, poll=0, ghi 11:49:14Z), round169-t5/POSTBOOT_PASS (#77, replay-day-du, poll=0, ghi 08:46:44Z) và round168-t5/POSTBOOT_PASS (#75, mode repair, ghi 06:01:38Z) không đổi; mtime không đổi.
- Backup `POSTBOOT_PASS-2acdd1ab` trong round172-t5 `diff` KHỚP file gốc — cờ #80 được bảo toàn qua lần ghi cờ thứ sáu.
- #74 (round167-t5) và #70 (round166-t5) cũng còn nguyên (kiểm lại bằng stats script §2c).

### §3.3 POSTBOOT_PASS #78 — KHÔNG CÓ, không bù được

- **#78 (e298bb52):** grep toàn bộ `POSTBOOT_PASS*` dưới `hidden_files/round*/` 0 kết quả (cả file cờ lẫn tên file lẫn nội dung; grep cả docs đợt 171 chỉ thấy nhắc tới trong LIMITS/.done, không có file cờ). **Boot thứ 14 không có cờ.**
- Không bù được (cùng quy tắc #63/#66/#68/#71/#72/#73/#76: cờ chỉ chứng nhận phép đo trực tiếp trên boot sống; #78 chết trước khi có phiên T5 nào — không có phiên T5 nào chạy trên #78).
- Đếm boot không cờ tới nay: #51, #53, #54, #55, #57, #60, #63, #66, #68 (9, theo T5-166) + #71 (10) + #72 (11) + #73 (12) + #76 (13) + **#78 (14)** — không đổi đợt này (#81 ĐÃ CÓ cờ, dù là cờ repair).

### §3.4 Watcher-171 — CHẾT theo #81 (xác minh đầy đủ từ log gốc + F-172-T5-1)

**START 14:52:09Z, pid 28156, boot 2acdd1ab; CHẾT theo reboot #81 (poll cuối 17:02:25Z; `kill -0`: No such process — T5-172 xác minh lúc mở).** Log 266 dòng, **261 poll** (gaps {30 s ×244, 31 s ×16} — không có gap lớn, không có gap 860 s như watcher-168), md5 duy nhất c01f3a02 (1545 dòng), boot_set [2acdd1ab], kinds {START: 1, MONITOR: 1, REPLAY_DONE: 1, postboot: 1, FLAG-WRITTEN: 1} — **KHÔNG có dòng END/STOP**. **261/261 poll có 0 proc apt/dpkg.** **Poll cuối 17:02:25Z SAU btime #81 (17:02:05Z) 20 s — xem F-172-T5-1 (§4.2). F-171-T5-1 KHÔNG LẶP LẠI: watcher-171 poll liên tục tới reboot, không dừng sớm trước hạn END 17:30:00Z (poll cuối trước hạn END 1.655 s là do reboot giết, không phải dừng sớm).**

### §3.5 Watcher-172 — 1 lần khởi động, đang chạy

**START 17:41:39Z, pid 17944, boot 4b9db449**, cùng script `replay-watch-172.sh` (tạo bằng `make-watcher-172.py` từ nguồn 171 — xem §10 F-172-T5-5). Init: dpkg 2 dòng md5 4e865c5c mtime 17:02:38Z, cache 0, lists 5, gst_sys 0. Poll đầu ghi `apt=[] apt2=[] dpkg=[]` + dpkg 2 dòng → **EARLY-REPAIR TRIGGER ngay poll đầu (17:41:39Z)** — đúng thiết kế (replay vắng, boot+15' đã qua, frozen 2.341 s). Sau repair: dpkg 795 dòng md5 e89e703c ổn định, 0 proc (trừ 6 poll ghi apt pid trong lúc stats §5 chạy `apt-get install -s` — xem F-172-T5-4). **Đang chạy lúc đóng LIMITS (ALIVE, kill -0 17944; poll 18:00:03Z dpkg 795 ổn định, 0 proc).** Khoảng không-watcher: **2.354 s = 39m14s** (poll cuối watcher-171 17:02:25Z → START 17:41:39Z; tính từ btime #81 17:02:05Z là 2.374 s) — dài hơn đợt 171 (1.810 s) vì #81 xảy ra 33m46s trước khi đợt mở, nhưng NGẮN hơn nhiều so với đợt 170 (8.873 s). Toàn bộ repair #81 (17:41:40–17:50:32Z) được watcher quan sát TRỰC TIẾP — khác #80 (replay nằm trọn trong khoảng không-watcher).

**Không probe dpkg nào của T5-172:** đợt này T5 KHÔNG chạy `dpkg --configure -a` (khác đợt 169 — xem §6 B4). Mọi kiểm tra của T5 đều chỉ đọc (dpkg-query, `apt-get install -s`, postboot check-only, ps, journalctl, curl). `--repair` là đường watcher theo quyết (h), không phải probe của T5.

**Generator `make-watcher-172.py`:** viết mới theo mẫu 171, header VIẾT MỚI hoàn toàn cho đợt 172; thay token đúng chuỗi trong nguồn (`replay-watch-171.log`→`replay-watch-172.log`, `replay-watch-171.sh`→`replay-watch-172.sh`, `round171-t5`→`round172-t5`, `round170-t5`→`round171-t5`, `REPLAY-WATCH-171`→`REPLAY-WATCH-172`, `watcher-171`→`watcher-172`, hạn cứng `2026-11-22 17:30:00`→`2026-11-22 20:30:00`, `17:30:00Z`→`20:30:00Z`); assert thêm (không còn `replay-watch-171`/`REPLAY-WATCH-171`/`watcher-171`/`17:30:00` trong THÂN; `LOG=$DIR/replay-watch-172.log`); `bash -n` OK; 2 chuỗi "H2" còn lại trong file đều ở header comment (từ chối giả thuyết H2 — hợp lệ, như đợt 171). Spawn bằng đường dẫn TUYỆT ĐỐI + nohup + disown (F-167-T5-2 đã sửa: không dùng `cd ... && ... &`).

---

## §4. Boot #81 + đồng hồ

### §4.1 Xác minh boot #81 (boot hiện tại — CHƯA XÁC NHẬN, chờ T0-172)

- boot_id: `4b9db449-7699-4441-a4cf-72983f15dbbd`; btime /proc/stat: **17:02:05Z (epoch 1795366925)**.
- Lúc mở ~17:38Z: uptime ~36' → boot 17:02:05Z (khớp btime 0 s); /proc/1 mtime 17:02:16,745Z (+11,745 s); journal first entry 17:02:17Z (+12 s).
- Stats script 17:53:56Z: uptime 3.110,79 s → boot 17:02:05Z (khớp btime); 17:57:01Z: uptime 3.295,98 s → boot 17:02:05Z (khớp btime).
- `uptime -s` = 17:02:05Z — KHỚP btime.
- Boot #80: btime 14:31:01Z (epoch 1795357861 — quyết parent đợt 170/171); boot #79: btime 11:11:05Z (epoch 1795345865).
- **Gap #80→#81 = 9.064 s (2h31m04s)** — tính độc lập bằng 2 phương pháp: trừ epoch bằng python (1795366925−1795357861) + `date -d @<epoch>` đối chiếu từng btime (17:02:05Z − 14:31:01Z). Cả hai khớp. **KHỚP aggregate 171 §12.3(o).**
- **Gap #79→#80 kiểm lại độc lập = 11.996 s (199m56s)** — KHỚP quyết parent đợt 170/171.

### §4.2 F-172-T5-1 — Poll cuối watcher-171 NẰM SAU btime #81 20 s (PHÁT HIỆN CHÍNH đợt này)

- **Số thô:** poll cuối watcher-171 ghi `2026-11-22T17:02:25Z boot=2acdd1ab poll dpkg_lines=1545 md5=c01f3a02 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=178 lists=37`; log mtime trực tiếp 17:02:25.626Z. Btime #81 = 17:02:05Z → **poll cuối SAU btime 20 s**.
- **Cách watcher ghi timestamp KHÔNG có vấn đề:** đọc script `replay-watch-171.sh` (dòng 148–168): mỗi vòng lặp đọc `boot_now()` (từ `/proc/sys/kernel/random/boot_id`) TRƯỚC, rồi mới lấy `ts=$(date -u +%FT%TZ)` và đọc dpkg/procs, rồi ghi 1 dòng. Poll 17:02:25Z có boot=2acdd1ab nghĩa là tại thời điểm đó `/proc/sys/kernel/random/boot_id` vẫn trả về boot_id CŨ — tiến trình cell cũ vẫn còn sống/đọc được 20 s sau btime mới. Đây KHÔNG phải lỗi ghi timestamp (không có độ trễ nào trong script đủ 20 s: vòng lặp trước 17:01:55Z, đúng cadence 30 s; `date` chạy sau khi đọc boot_id, không trước).
- **Kết luận phối hợp với T0:** hiện tượng trùng họ F-170-T5-1 (poll cuối watcher-169 nằm sau btime #78 11 s) nhưng LỚN HƠN (20 s so với 11 s). Cửa sổ overlap "cell cũ còn sống sau btime mới" là có thật và biến thiên (11 s → 20 s). Hệ quả cho T2: **cận trên "boot cũ chết" suy từ poll cuối watcher KHÔNG còn chắc chắn** — poll cuối có thể nằm SAU btime tới ≥20 s; khung giờ biên phải tính khả năng này (cùng bài học F-170-T5-1, nay có thêm 1 mẫu nữa, lớn hơn).
- **Đối chiếu dị thường watcher-log đợt 171 (nhiệm vụ 3):** poll 17:02:25Z ghi boot=2acdd1ab KHÔNG phải lỗi ghi log — đó là quan sát thật: boot_id cũ vẫn đọc được sau btime mới. Không có mâu thuẫn nội bộ nào khác trong log watcher-171 (261 poll, gaps {30×244, 31×16}, md5 duy nhất, không có dòng NEWBOOT nào — watcher chết trước khi kịp đọc boot mới ở vòng lặp sau).
- **F-171-T5-1 KHÔNG LẶP LẠI (nhiệm vụ 2):** watcher-171 poll liên tục tới reboot (poll cuối sau cả btime), không dừng sớm trước hạn END 17:30:00Z. Giả thuyết "host-side teardown sau khi cron run xong" (run 170 SUCCEEDED 14:21:03Z, 56 s trước poll cuối watcher-170) KHÔNG được củng cố thêm — watcher-171 sống qua run 171 (run 171 kết thúc khi nào thuộc T7-171; watcher-171 vẫn poll tới 17:02:25Z, sau thời điểm T5-171 đóng ~15:08Z nhiều giờ). Mẫu "chết sớm" hiện chỉ có watcher-170 (8m01s) + watcher-168 (gap 860 s), đối trọng watcher-171 (không chết sớm) — chưa kết luận được.
- Biên #80/#81: poll cuối watcher-171 SAU btime #81 20 s — overlap kiểu F-170-T5-1, lớn hơn. Các mốc khung mới đều sau btime, cùng chiều, không mâu thuẫn: /proc/1 +11,745 s; journal first entry +12 s.
- Reboot thật #81 ∈ (17:02:25Z, 17:41:39Z] theo watcher (poll cuối #80 → poll đầu #81); btime neo #80 14:31:01Z, #81 17:02:05Z.
- Requeue run 171 tại #81 + offset (m) thuộc T7-172/T2-172 (T5 chưa có số — KHÔNG tự tính offset). **(m) #81 CHỜ T2-172 đối chiếu + parent quyết (quyết (d) aggregate 171).** T5 KHÔNG phán thêm.

### §4.3 Lists #81 = 75 (cả hai mirror) — khác #80 (=37, chỉ cogentco)

- Lists lúc watcher-172 mở: 5 (chỉ cli.github.com 2 file + auxfiles/lock/partial — KHÔNG có lists ubuntu); sau repair update: 75 (azure 34 + cogentco 34 + 7 file khác; ubuntu.sources liệt kê 2 URI: azure + mirror.cogentco.com, như #80). #80 lists 37 (cogentco 34, azure 0); #79 lists 30 (cogentco 27, azure 0); #77 lists 37 (azure 34, cogentco 0); #75 sau repair update: 75 (2 mirror).
- **Cache 0 → 110 .deb với toàn bộ mtime CŨ (F-172-T5-2 — xem §5.2):** không file .deb nào có mtime hôm nay — repair KHÔNG tải mới .deb nào (hoặc .deb tái xuất hiện từ snapshot — chưa xác định).
- Proxy egress: `http://hatch-egress-proxy:3128` (cả http/https — `/etc/apt/apt.conf.d/80hatch-egress-proxy`).

---

## §5. Replay #81 KHÔNG CHẠY + repair + điều tra #75 (đã đóng)

### §5.1 Replay #81 không chạy — bằng chứng

- Tới lúc T5-172 mở (~17:38Z, boot+36m): dpkg.log 2 dòng (17:02:37/38Z reconcile heal), cache 0 .deb, lists 5, GST 0, `/var/log/apt` KHÔNG tồn tại, `/var/lib/hatch-preflight` KHÔNG tồn tại, journal 180 dòng 0 dòng preflight/apt/dpkg, 0 proc apt/dpkg.
- Tới lúc đóng (~18:00Z): apt history chỉ 1 transaction (của repair, 17:50:20–17:50:32Z); dpkg.log 795 dòng toàn bộ từ repair (2 dòng reconcile + 793 dòng repair); không có transaction per-package nào kiểu replay host-side (50 transaction như #80); không receipt nào được ghi.
- So sánh: #80 hoạt động dpkg đầu boot+4m38s; #79 boot+24m34s; #81 tới boot+39m34s vẫn 0 hoạt động → watcher kích early-repair theo quyết (h) là đúng (không chờ timeout 60').
- Chữ ký giống #75 (replay không chạy: cache 0 + lists base-only + dpkg 2 dòng) và giống boot 2 đợt 150 (repair 14m00s với cache 0). **T5 KHÔNG phan nguyên nhân replay vắng** (cùng quy tắc các đợt trước — chỉ trình số thô; 2 ứng viên host-side của #75 vẫn đứng, xem §5.3).

### §5.2 F-172-T5-2 — Cache 0 → 110 .deb, toàn bộ mtime CŨ (chưa xác định cơ chế)

- Lúc mở: cache 0 .deb (dir chỉ còn lock + partial/ mtime 07:36Z từ #76).
- Sau repair: cache **110 .deb, 58.529.968 byte**, mtime cũ nhất 2021-04-29, mới nhất **2026-11-18 16:22:47Z** — TẤT CẢ 110 file đều có mtime TRƯỚC btime #80 (14:31:01Z), không file nào mang mtime hôm nay.
- Suy ra: repair KHÔNG tải mới 110 file .deb này (apt download sẽ đóng mtime hôm nay). Chúng tái xuất hiện với mtime cũ — cùng họ hiện tượng cache 178→0→178 (LIMITS T5-169 §5.5, cơ chế CHƯA XÁC ĐỊNH; giả thuyết mạnh nhất: autoclean cuối payload + snapshot restore hồi lại). Ghi nhận, không suy nguyên nhân; cần log host-side (RV snapshot/restore) mới phân biệt được.
- Đối chiếu: trên #80, toàn bộ 178 .deb cũng có mtime ≤ 2026-11-18 — replay #80 cũng chạy bằng cache-hit. Khác biệt: #81 bắt đầu với cache 0 rồi hồi lại 110 (chỉ subset cần cho 11 gói + deps), #80 giữ nguyên 178 suốt.

### §5.3 GHI NHẬN ĐÓNG ĐIỀU TRA REPLAY #75 (theo quyết parent (j) đợt 169 + ghi nhận lại (j) đợt 170/171)

Parent đã quyết (j) đợt 169: **CHẤP NHẬN ĐÓNG điều tra vì sao replay #75 không chạy ở mức CHƯA XÁC ĐỊNH nguyên nhân gốc + leo thang kiểm journal host-side**; quyết (j) đợt 170/171 GHI NHẬN lại việc đóng này. T5-172 ghi nhận và KHÔNG mở lại điều tra trong cell. Tóm tắt trạng thái đóng (từ LIMITS T5-171 §5, không điều tra thêm):

- **Đã loại trừ bằng bằng chứng:** backoff; receipt fast-path skip; fold từ chối; gói/version-drift/mirror; cache trống; tranh lock; "chạy muộn" (191 poll / 1h49m, 0 proc).
- **Còn lại 2 ứng viên host-side (chỉ journal host-side của unit `hatch-preflight-opportunistic` trên boot #75 mới phân biệt được):** (i) pass chết/lỗi lặng ở đoạn host-side giữa reconcile xong và vòng lặp; (ii) payload chạy nhưng feed vòng lặp rỗng/hỏng.
- **Hướng leo thang:** kiểm journal host-side của unit preflight boot #75 (+ #76) và log RV snapshot/restore — T5 trong cell không đọc được (journal cell chỉ giữ boot hiện tại; host journal không mount vào cell). Bằng chứng gốc trong cell đã hết.
- **Đối chứng mới đợt 172:** replay #81 CŨNG KHÔNG CHẠY (lần thứ hai sau #75) — nhưng watcher early-repair đã xử lý được trong 8m52s (khác #75: đợt đó watcher timeout 60' mới repair). Driver KHÔNG chết hệ thống (repair chạy tốt, đủ 11 gói + 5 lib + GST); lỗi "replay vắng" là nhất thời/không đều (xảy ra #75, #81; không xảy ra #77/#79/#80). Vòng lặp #81 có chạy xong không thì ĐÃ BIẾT (không chạy — bằng chứng dpkg/history/journal đầy đủ, watcher quan sát trực tiếp).

---

## §6. Quy tắc đứng

(Trích từ LIMITS các đợt trước — giữ nguyên, không đổi.)

1. **Cờ POSTBOOT_PASS chỉ chứng nhận phép đo trực tiếp trên boot sống.** Boot đã chết trước khi có phiên T5 thì KHÔNG bù được (áp dụng #78 đợt này; #76/#71/#72/#73 trước đó).
2. **Watcher chết theo reboot là bình thường** — watcher là tiến trình trong cell, không sống qua reboot. Khoảng không-watcher được đo và ghi (đợt này: 2.354 s). **Bổ sung đợt 171 (F-171-T5-1):** watcher cũng có thể chết TRƯỚC reboot 8m01s mà không để lại dòng END/STOP — khoảng không-watcher phải tính từ poll cuối thực tế, không phải từ hạn END hay btime. **Bổ sung đợt 172 (F-172-T5-1):** poll cuối cũng có thể nằm SAU btime boot mới tới ≥20 s — cận trên "boot cũ chết" từ poll cuối không còn chắc chắn.
3. **Hướng (3) đứng:** không có bằng chứng session/service nào giữ boot sống qua reboot (kiểm lại lần thứ 19 đợt này — xem §2).
4. **Khung giờ boot cũ = XÁC NHẬN OVERLAP, không đổi verdict (m)** (quyết (e) đợt 166). T5 chỉ đo số thô tại biên reboot, giao T2 đối chiếu. **Bổ sung đợt 170 (F-170-T5-1):** poll cuối watcher có thể nằm SAU btime boot mới (11 s) — cận trên "boot cũ chết" từ poll cuối không còn chắc chắn; T2 tính khung phải tính khả năng này. **Bổ sung đợt 172:** mẫu thứ hai, lớn hơn (20 s).
5. **Không kết luận nguyên nhân khi chưa có bằng chứng trực tiếp** (áp dụng cho replay #75/#81 — xem §5; và cache 0→110 mtime cũ — xem §5.2; và F-172-T5-1 — xem §4.2).
6. **Chỉ stage, KHÔNG PUSH** — user tự push sau từ main chat.
7. **B4 — KHÔNG chạy probe chạm dpkg trong cửa sổ attempt của T4** (GIỮ NGUYÊN, không nới). Đợt 169 probe `dpkg --configure -a` lúc 08:55:22Z làm +1 dòng dpkg.log, nhiễm attempt2 của T4. **Đợt 170: T5 KHÔNG chạy probe chạm dpkg nào** (0 lần); **đợt 171: T5 KHÔNG chạy probe chạm dpkg nào** (0 lần); **đợt 172: T5 KHÔNG chạy probe chạm dpkg nào** (0 lần); mọi kiểm tra đều chỉ đọc. `--repair` là đường watcher theo quyết (h), không phải probe của T5. T4-172: luật "không chạy script phân tích nặng trong cửa sổ attempt" vẫn đứng (nhắc lại từ đợt 169; quyết (h) đợt 170/171 nhắc wording T4).

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM (stats 17:53:56Z / 17:57:01Z, boot #81):** MemTotal 8.124.900 kB; MemAvailable 2.496.232 kB → 1.831.488 kB (giảm 665 MB giữa 2 lần chạy — các luồng khác đang hoạt động); MemFree 197.160 kB → 191.840 kB; loadavg 1,97 → 1,25. (T9 đo headroom chính thức — T5 chỉ ghi snapshot.)

**ENOSPC (T9 đếm chính thức; T5 chỉ ghi snapshot):**
- #81: **46 dòng lúc 17:53:56Z → 48 dòng lúc 17:57:01Z** (journal 240 dòng, dòng đầu 17:04:00Z, từ `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`).

**X11:**
- TRỐNG lúc mở (~17:38Z); lúc stats lần 1 (17:53:56Z): **3 socket X193 (mtime 17:45Z)/X194/X195 (mtime 17:45Z), 0 Xvfb thật** — xuất hiện trong lúc repair chạy (17:41:40–17:50:32Z), khác mẫu đợt 171 (socket xuất hiện sau khi replay xong). Cùng họ các đợt trước (3 socket mtime 11:44Z đợt 170; 4 socket mtime 14:50/14:51Z đợt 171) — **giao T8-172 dọn**. Lúc viết LIMITS (~18:00Z) vẫn 3 socket.

**Journal:** #81: idx 0 duy nhất; 180 dòng lúc mở (~17:38Z); 240 dòng lúc 17:53:56Z, dòng đầu 17:02:17Z. Không có OOM/killed process trên #81 (chưa grep toàn bộ — T9 kiểm chính thức; T5 chỉ ghi snapshot).

---

## §8. Nợ mở chuyển đợt 173 (T5-173 sở hữu)

1. **Watcher-172 (pid 17944) tiếp tục giám sát tới 20:30:00Z 22/11** — T5-173 kiểm tra log cuối + poll cuối + END line (hoặc chết theo reboot mới / chết sớm kiểu F-171-T5-1). Nếu replay chạy lại sau khi T5-172 đóng (dpkg tăng từ 795), watcher log sẽ ghi lại — T5-173 diễn giải.
2. **POSTBOOT_PASS #78 KHÔNG CÓ** (boot thứ 14 lọt, không bù được); #68/#63/#66 vẫn không có. **#81 ĐÃ CÓ (repair-sớm-quyết-h, poll=1)** — theo dõi tiếp; cờ repair #75 vẫn giữ nguyên (không ghi lại cờ replay).
3. **Marker 33 reboot #49–#81** (T10-171 đếm độc lập: 33 ĐÚNG; T0-172 đếm lại).
4. **F-172-T5-1 (poll cuối watcher-171 nằm SAU btime #81 20 s):** giao T2-173 + parent theo dõi — có lặp lại ở watcher-172 không; đối chiếu với mẫu F-170-T5-1 (11 s). Cận trên "boot cũ chết" từ poll cuối không chắc chắn.
5. **F-171-T5-1 KHÔNG lặp lại ở watcher-171** — ghi nhận; mẫu "chết sớm" hiện chỉ có watcher-170 + watcher-168, đối trọng watcher-171.
6. **Điều tra replay #75: ĐÃ ĐÓNG** theo quyết parent (j) đợt 169 + ghi nhận lại (j) đợt 170/171 (xem §5.3) — không mở lại trong cell; leo thang journal host-side thuộc parent.
7. **Cache 0 → 110 mtime cũ (F-172-T5-2): cơ chế tái xuất hiện CHƯA XÁC ĐỊNH** (cùng họ 178→0→178 — xem LIMITS T5-169 §5.5); cần log host-side (RV snapshot/restore).
8. **Guard symlink GST:** trên #81 GST là symlink → debroot (do repair tạo, "vá tạm K1, ephemeral") — KHÔNG phải thư mục thật như replay #77/#79/#80. Bài học F-168-T5-2 vẫn đứng cho boot mới trong phiên watcher-172 nếu early-repair kích hoạt: T5-173 gỡ symlink tay trước khi install nếu replay bắt đầu sau repair. (Trên #81 repair đã xong; symlink ở lại cho tới reboot sau.)
9. TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet.
10. G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời — để yên, không nhắc lại). R9 (a) vẫn chờ user (số đếm vẫn là 16).

---

## §9. Đề xuất cho parent

- **(a) Chấp nhận kết quả T5-172:** cờ #81 (repair-sớm-quyết-h, poll=1, verify độc lập exit 0 — T5 17:53:46Z + watcher poll1 17:50:32Z); #80/#79/#77/#75 còn hiệu lực; #78 không cờ, không bù được; watcher-172 đang chạy; hướng (3) lần thứ 19; marker 33 reboot (T10-171 đếm độc lập ĐÚNG; T0-172 đếm lại); gap #80→#81 = 9.064 s (KHỚP aggregate 171 §12.3(o)).
- **(b) Cờ #81 repair-sớm-quyết-h (KHÔNG phải replay-day-du) có đứng cho gate (a) của T4/T8 không, và với caveat nào?** Đây là cờ repair thứ hai sau #75 (mode repair, 06:01:38Z). Khác #75 ở chỗ repair #81 được watcher quan sát trực tiếp toàn bộ (trigger → verify → repair → poll1), --repair exit 0, postboot PASS 11/11 + 5/5 + GST 269. Nhưng: KHÔNG có receipt; ledger chỉ 106/170 literal (64 intent không cài, chỉ installable); GST là symlink → debroot (không phải thư mục thật); dpkg 795 dòng (không phải 1545); chỉ 1 transaction install (không phải vòng lặp per-package của replay). T5 đề xuất: cờ ĐỨNG cho gate (a) VỚI caveat mode repair (như #75), KHÔNG được tính như replay-day-du. T5 không phán gate — parent quyết.
- **(c) Số hiệu #81 (CHƯA XÁC NHẬN):** chờ T0-172 xác minh 9 nguồn (quyết (d) aggregate 171) — không cần quyết thêm từ T5, chỉ ghi nhận.
- **(d) F-172-T5-1 — poll cuối watcher-171 nằm SAU btime #81 20 s:** T5 trình số thô + kết luận cách watcher ghi timestamp KHÔNG có vấn đề (đọc script dòng 148–168: đọc boot_id trước, lấy timestamp sau) + hệ quả cho khung giờ biên (cận trên "boot cũ chết" từ poll cuối không chắc chắn — mẫu thứ hai sau F-170-T5-1 11 s, nay lớn hơn 20 s). Đề xuất: ghi nhận, giao T2-173 theo dõi xem watcher-172 có lặp lại không.
- **(e) F-171-T5-1 KHÔNG lặp lại ở watcher-171:** ghi nhận — giả thuyết host-side teardown sau run 170 SUCCEEDED không được củng cố thêm.
- **(f) X11 X193/X194/X195 (mtime 17:45Z):** giao T8-172 dọn theo mẫu các đợt trước.
- **(g) Replay #81 không chạy (lần thứ hai sau #75):** ghi nhận — driver không chết hệ thống (repair chạy tốt); lỗi "replay vắng" là nhất thời/không đều. Không mở điều tra riêng đợt này (điều tra #75 đã đóng ở mức chưa xác định — xem §5.3).

---

## §10. Sai số của chính T5-172 (ghi để đợt sau khỏi lặp)

- **F-172-T5-1 — Poll cuối watcher-171 NẰM SAU btime #81 20 s (PHÁT HIỆN, không phải lỗi của T5-172):** xem §4.2 đầy đủ. T5-172 không tạo ra mâu thuẫn này — chỉ phát hiện khi đọc log watcher-171 lúc mở. Đã đọc script để loại giả thuyết "timestamp ghi sai" (đọc boot_id trước, lấy timestamp sau — không có độ trễ 20 s trong script). Hệ quả cho khung giờ biên đã trình ở §4.2.
- **F-172-T5-2 — Cache 0 → 110 .deb, toàn bộ mtime CŨ (PHÁT HIỆN, không phải lỗi của T5-172):** xem §5.2 đầy đủ. T5-172 không tạo ra hiện tượng này — chỉ đo được khi chạy stats. Cơ chế tái xuất hiện CHƯA XÁC ĐỊNH; ghi nhận, không suy nguyên nhân.
- **F-172-T5-3 — Nhãn "hiệu dụng 170/170" của stats script GÂY HIỂU LẦM cho trường hợp repair (ĐÃ ĐÍNH CHÍNH trong LIMITS, không ghi nhầm vào số chính thức):** stats §5 đếm literal 106/170 rồi resolve 64 gói thiếu bằng `apt-get install -s` (rc=0) và in "hiệu dụng 170/170". Với replay, công thức này đúng (gói thiếu được thỏa qua Provides của gói đã cài). Với repair, 64 gói KHÔNG được cài — rc=0 chỉ nghĩa là cài được, không phải đã thỏa. T5-172 đã đính chính trong LIMITS §3.1: số đúng là literal 106/170; postboot gate PASS theo tiêu chí riêng (11 gói + 5 lib + GST). Bài học: các đợt sau, nếu cờ là repair thì phải đọc "ledger_hieu_dung" kèm số literal, không trích nhãn hiệu dụng một mình.
- **F-172-T5-4 — 6 poll watcher-172 ghi apt pid (17:55:03/17:55:33/17:56:03Z + 17:58:03/17:58:33/17:59:03Z) — GHI NHẬN, không phải lỗi:** các poll này rơi đúng vào cửa sổ 2 lần chạy stats của T5 (run1 17:53:56–17:56:31Z, run2 17:57:01–17:59:09Z), khi stats §5 chạy `apt-get install -s` (check-only, chỉ đọc) cho 64 gói thiếu. dpkg KHÔNG đổi trong suốt thời gian đó (795 dòng, md5 e89e703c ổn định) — không có nhiễm. Ghi rõ để T2/T4 khỏi đọc nhầm thành hoạt động apt lạ. (Quy kết "là tiến trình của stats" dựa trên trùng khớp thời gian + dpkg ổn định — chưa xác minh 100% bằng pid, nhưng đủ tin cậy để ghi nhận.)
- **F-172-T5-5 — `make-stats-172.py` viết transform §11 mới hoàn toàn (không phải lỗi, ghi để đợt sau khỏi lặp):** như đợt 171, §11 stats được viết lại tay cho watcher-171/172 (không transform máy được vì số liệu biên đổi hoàn toàn). Đã kiểm bằng diff 2 lần chạy stats (chỉ khác giá trị phụ thuộc thời gian + ENOSPC 46→48 + RAM). Bài học giữ nguyên từ đợt 171: §11 luôn viết lại tay, kiểm bằng diff 2 lần chạy.
- **F-172-T5-6 — Stats §4/§8 KHÔNG còn in thừa số 0 (ĐÃ SỬA — bài học F-171-T5-4 đã áp dụng):** `grep -c ... || echo 0` đã đổi thành `|| true` ở §4 (azure/cogentco) + §8 (timers_vcut); output lần này sạch (azure 34, cogentco 34, timers 0 — không dòng 0 thừa). Ghi nhận để xác nhận bản sửa có tác dụng.

---

## §11. Batch stage

- **File stage:** `~/workspace/repo-1/docs/PHASE9_ROUND172_T5_INFRA_LIMITS.md` (file này).
- **Paths file:** `~/workspace/repo-1-push/paths-loop/phase9-round172-t5-infra.txt` (NUL-delimited, 1 entry — chỉ file text, KHÔNG binary).
- **Verify:** read-back bằng `od -c` sau khi stage (theo mẫu T5-166/T5-167/T5-168/T5-169/T5-170/T5-171).
- **KHÔNG PUSH** — user tự push sau từ main chat.
- Các file làm việc trong `round172-t5/` (watcher script/log, stats script/output, postboot log, cờ POSTBOOT_PASS + backup, watcher-status-at-open) KHÔNG stage đợt này (theo mẫu T5-171: chỉ stage LIMITS); chúng nằm trên đĩa để T10/parent đối chiếu.

---

## Phụ lục A — Trích stats output (`t5-stats-172-output.txt`, chạy lần 2 17:57:01Z)

(Lần 1 chạy 17:53:56Z; lần 2 chỉ khác các giá trị phụ thuộc thời gian: uptime, journal last entry, đồng hồ, số poll watcher-172 7→13, ENOSPC 46→48, RAM. Mọi số ổn định khác giống hệt — đã diff hai lần chạy.)

```
--- 1. boot id + uptime ---
boot_id=4b9db449-7699-4441-a4cf-72983f15dbbd
btime=1795366925 (2026-11-22 17:02:05 UTC)
uptime=3295.98 (boot 2026-11-22 17:02:05 UTC, luc stats lan 2 17:57:01Z)
clock: local_truoc=17:57:01.630Z CF=Sun, 22 Nov 2026 17:57:03 GMT local_sau=17:57:02.599Z (lan 2 tuong tu)
--- 2a. marker ---
marker_mtime=2026-11-20 11:39:47.000000000 +0000
--- 2b. grep POSTBOOT_PASS (tat ca round) ---
#4b9db449: round172-t5/POSTBOOT_PASS
#2acdd1ab (#80): round171-t5/POSTBOOT_PASS, round172-t5/POSTBOOT_PASS-2acdd1ab (+ round172-t5/POSTBOOT_PASS theo noi dung 'co cu')
#5df1871f (#79): round170-t5/POSTBOOT_PASS, round171-t5/POSTBOOT_PASS-5df1871f (+ round171-t5/POSTBOOT_PASS theo noi dung 'co cu', + round172-t5/POSTBOOT_PASS-2acdd1ab theo noi dung 'co cu')
#e298bb52 (#78): 0 ket qua — KHONG CO
#c44cc3ba: round169-t5/POSTBOOT_PASS, round170-t5/POSTBOOT_PASS-c44cc3ba (+ round170-t5/POSTBOOT_PASS theo noi dung 'co cu', + round171-t5/POSTBOOT_PASS-5df1871f theo noi dung 'co cu')
#f2b97695 (#76): 0 ket qua — KHONG CO
#576ca271: round168-t5/POSTBOOT_PASS, round169-t5/POSTBOOT_PASS-576ca271 (+ round169-t5/POSTBOOT_PASS theo noi dung 'co cu', + round170-t5/POSTBOOT_PASS-c44cc3ba theo noi dung 'co cu')
#194efd93: round167-t5/POSTBOOT_PASS, round168-t5/POSTBOOT_PASS-194efd93 (+ round168-t5/POSTBOOT_PASS theo noi dung 'co cu', + round169-t5/POSTBOOT_PASS-576ca271 theo noi dung 'co cu')
#b643911f (#73): 0 ket qua — KHONG CO
#9e089ef6 (#72): 0 ket qua — KHONG CO
#ea73ac4f (#71): 0 ket qua — KHONG CO
--- 3. round172-t5/POSTBOOT_PASS (#81, xac minh lai) ---
boot 4b9db449-7699-4441-a4cf-72983f15dbbd (btime 2026-11-22 17:02:05Z; watcher-172) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-22T17:50:32Z; POSTBOOT_PASS moi ghi 2026-11-22T17:50:32Z poll=1 (repair-som-quyet-h); co cu 2acdd1ab luu POSTBOOT_PASS-2acdd1ab
mtime: 2026-11-22 17:50:32.812Z
gst_sys_files=269 (SYMLINK -> debroot, 269=269)
apt_procs= (trong, luc stats lan 1; 6 poll co apt pid trong luc stats §5 chay apt-get install -s — xem F-172-T5-4)
watcher172_ps=17944 bash .../replay-watch-172.sh (ALIVE)
watcher171_pid28156_kill0=DEAD
--- 5. kiem tra goi postboot #81 + ledger ---
11/11 goi da cai (bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1); 5/5 lib; GST symlink 269 = debroot 269
ledger literal 106/170, thieu 64 goi: aspell, aspell-en, dictionaries-common, emacsen-common, enchant-2, fonts-droid-fallback, fonts-freefont-ttf, fonts-ipafont-gothic, fonts-tlwg-loma-otf, fonts-unifont, fonts-urw-base35, fonts-wqy-zenhei, gdb, ghostscript, gstreamer1.0-tools, hunspell-en-us, imagemagick-6-common, libaspell15, libbabeltrace1, libc6-dbg, libdebuginfod-common, libdebuginfod1t64, libdjvulibre-text, libdjvulibre21, libdrm-nouveau2, libdrm-radeon1, libenchant-2-2, libevent-2.1-7, libgs-common, libgs10, libgs10-common, libgtk-4-1, libgtk-4-bin, libgtk-4-common, libgtk-4-media-gstreamer, libidn12, libijs-0.35, libipt2, libjbig2dec0, libjxr-tools, libjxr0t64, liblqr-1-0, libmagickcore-6.q16-7-extra, libmagickcore-6.q16-7t64, libmagickwand-6.q16-7t64, libmanette-0.2-0, libpaper-utils, libpaper1, libpipewire-0.3-common, libraw23t64, librsvg2-common, libsecret-1-0, libsecret-common, libsource-highlight-common, libsource-highlight4t64, libvidstab-dev, libwoff1, nasm, pocketsphinx-en-us, poppler-data, xfonts-cyrillic, xfonts-encodings, xfonts-scalable, xfonts-utils — tat ca apt-get install -s rc=0 (CAI DUOC, KHONG PHAI DA CAI — xem F-172-T5-3)
--- 6. ENOSPC ---
#81: 46 dong lan 1 / 48 dong lan 2 (journal 240 dong, dong dau 17:04:00Z)
--- 7. RAM / load ---
MemTotal 8124900 kB; MemAvailable 2496232 kB (lan 1) / 1831488 kB (lan 2); MemFree 197160 kB (lan 1); loadavg 1.97 (lan 1) / 1.25 (lan 2)
--- 8. systemd (huong 3) ---
user@0 inactive; logind inactive; dbus inactive; loginctl khong noi duoc bus; /var/lib/systemd/linger KHONG TON TAI; /run/user/0 KHONG TON TAI; khong cron; 0 timer VCut
--- 9. .done hien co (luc stats lan 2) ---
round172-t1.done (17:49:16Z), round172-t6.done (17:53:42Z) — round172-t2.done xuat hien sau do (~18:00Z)
--- 10. X11 ---
3 socket X193/X194/X195 (mtime 17:45Z); 0 Xvfb that
--- 11. watcher-171 log (doc lap) ---
261 poll tren #80, 266 dong, gaps {30s x244, 31s x16}, poll cuoi 17:02:25Z, mtime truc tiep 17:02:25.626Z; 0 dong END/STOP; 261/261 poll 0 proc apt/dpkg; F-172-T5-1: poll cuoi SAU btime #81 20 s; F-171-T5-1 KHONG lap lai
--- 12. dpkg breakdown + apt history #81 ---
startup 4 + install 106 + status 568 + upgrade 4 + configure 110 + trigproc 3 = 795 dong (chu ky repair 1-phan); history 1 transaction (17:50:20-17:50:32Z); commandline: apt-get install -y --no-install-recommends libevent-2.1-7t64 gstreamer1.0-plugins-base ... (11 goi)
--- 13. repair #81: receipt + ledger + dpkg-state ---
receipt KHONG CO; ledger 2 dong mtime 2026-11-22 17:50:32Z sha256 9414d0f0...; dpkg-state.txt 889 dong mtime 17:50:32Z
--- 14. cache .deb mtime + lists + apt dirs ---
cache 110 .deb, mtime cu nhat 2021-04-29, moi nhat 2026-11-18 16:22:47Z; TAT CA 110 file < btime #80 (14:31:01Z); partial/ mtime 17:50Z (#81); lists azure 34 / cogentco 34 (tong 75); InRelease mtime moi (tu update repair #81 17:41-17:50Z); lock cham 17:02Z (#81)
```

## Phụ lục B — File làm việc trong `round172-t5/` (không stage, để đối chiếu)

- `watcher-status-at-open.txt` (mở ~17:38Z trên #81; ghi sau khi spawn watcher-172 17:41:39Z pid 17944)
- `make-watcher-172.py`, `replay-watch-172.sh` (14.765 B)
- `replay-watch-172.log` (trực tiếp; 20 dòng, 20 poll lúc kiểm cuối 18:00:17Z), `replay-watch-172.nohup.log` (trống)
- `make-stats-172.py`, `t5-stats-172.py` + `t5-stats-172-output.txt` (chạy lần 2 17:57:01Z; lần 1 17:53:56Z) + `t5-stats-172-output-run1.txt` (bản lần 1, để diff)
- `t5-postboot-independent-4b9db449.log` (T5 verify độc lập, exit 0, 17:53:46Z) + `t5-postboot-poll1-4b9db449.log` (watcher poll1, exit 0, 17:50:32Z) + `t5-postboot-verify-4b9db449.log` (form-B, exit=1, 17:41:40Z) + `t5-postboot-repair-4b9db449.log` (--repair, exit 0, 17:50:32Z)
- `POSTBOOT_PASS` (#81, 324 B) + `POSTBOOT_PASS-2acdd1ab` (backup cờ #80, diff khớp)
