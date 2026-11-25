# PHASE 9 — ROUND 171 — T5 INFRA LIMITS

**Đợt:** 171 (mở lượt cron 21:35:51 +07 22/11/2026 = 14:35:51Z; hạn cờ ~17:00Z, hạn cứng 17:30Z).
**Người viết:** T5-171. **Ngày:** 22/11/2026. **Boot làm việc lúc đóng:** #80 (XÁC NHẬN — T0-171 xác minh 9 nguồn) 2acdd1ab, btime 14:31:01Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #80 (replay-day-du, poll=0 — xem §3.1). File này là 1 entry duy nhất stage đợt 171 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #80 (2acdd1ab, btime 14:31:01Z) | **ĐÃ CÓ 14:52:09Z (boot+21m08s, replay-day-du, poll=0)** — verify độc lập exit 0 (T5 14:55:25Z + watcher poll0 14:52:09Z), 11/11 gói + 5/5 lib, GST 269 = debroot 269, ledger hiệu dụng 170/170, receipt hash = ledger sha256 (xem §3.1) |
| POSTBOOT_PASS #79 (5df1871f) | **VẪN CÓ, còn hiệu lực** (11:49:14Z, replay-day-du, poll=0 — quyết (j) đợt 170: cờ đứng cho gate (a) không caveat mode repair) |
| POSTBOOT_PASS #78 (e298bb52) | **KHÔNG CÓ** (grep 0 kết quả — boot thứ 14 không cờ, không bù được) |
| POSTBOOT_PASS #77 / #75 | **VẪN CÓ, còn hiệu lực** (#77 replay-day-du 08:46:44Z; #75 mode repair 06:01:38Z) |
| Reboot trong phiên | **#80 (2acdd1ab, btime 14:31:01Z, gap #79→#80 = 11.996 s = 3h19m56s)** — xảy ra TRƯỚC khi đợt mở 4m50s, trong khoảng không-watcher; T0-171 XÁC NHẬN 9 nguồn |
| Replay #80 | **CHẠY ĐẦY ĐỦ, ~2m05s — NHANH NHẤT TỪNG KẸP**: hoạt động đầu 14:35:39Z (boot+4m38s), installs 14:36:08→14:37:43Z, 50 transaction, dpkg 1545 (breakdown Y HỆT #77/#79), receipt 14:37:44Z (hash = ledger sha256) |
| Watcher-171 | START 14:52:09Z, pid 28156, boot 2acdd1ab; REPLAY_DONE + FLAG-WRITTEN 14:52:09Z poll=0 (ngay poll đầu — replay đã xong trước khi watcher khởi động); **vẫn ĐANG CHẠY** lúc đóng (poll 15:07:42Z); 23 poll lúc stats lần 2 15:03:12Z |
| Watcher-170 | **CHẾT theo #80** (pid 20516 mất — kill -0 xác minh lúc mở); log 324 dòng, **319 poll, 0 proc apt/dpkg trong 307/319 poll** (12 poll đầu có proc apt — replay #79 đang chạy); poll cuối **14:21:59Z — DỪNG POLL 8m01s TRƯỚC hạn END 14:30:00Z, KHÔNG có dòng END/STOP (F-171-T5-1)**. Khoảng không-watcher: **1.810 s = 30m10s** (poll cuối → START watcher-171) |
| Điều tra replay #75 | **ĐÃ ĐÓNG theo quyết parent (j) đợt 169 + ghi nhận lại quyết (j) đợt 170** — T5-171 KHÔNG mở lại điều tra trong cell (xem §5) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#80 = 32 reboot** (T0-171 đếm độc lập) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 18 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0, 0 timer VCut) |
| ENOSPC | #80: **19 dòng lúc stats 14:57:42Z** (journal 154 dòng, dòng đầu 14:36:14Z = boot+5m13s, từ home-assistant-ensure.service) |
| X11 | **4 socket X193/X194/X195/X196 mới (mtime 14:50/14:51Z)**, 0 Xvfb thật — X196 mới so với #79 — giao T8-171 dọn |
| RAM #80 | MemAvailable 2.753.692 kB lúc 14:57:42Z; loadavg 3,06 |
| Đồng hồ | Local ≈ Cloudflare **−1 s** (CF nhanh hơn local ~0,4–1,9 s qua 4 lần đo) — cùng họ các đợt trước |
| Gap kiểm lại độc lập | #79→#80 = **11.996 s** (KHỚP T0-171); #78→#79 = **6.987 s** (KHỚP quyết parent đợt 170) — cả hai tính bằng 2 phương pháp độc lập (trừ epoch python + `date -d`) |
| Quy tắc B4 | **T5-171 KHÔNG chạy probe chạm dpkg nào** (0 lần `dpkg --configure -a`); chỉ dùng check-only đọc (dpkg-query / apt-get -s / postboot check-only) — B4 GIỮ NGUYÊN, không nới |
| T4-171 | Poll-wait deadline 16:30Z, gate0 = POSTBOOT_PASS T5 — cờ #80 ghi 14:52:09Z, trước deadline 1h38m; O8 PASS 3/3 trên boot #80 (T0-171, DONE 14:57:22Z) |

**Số hiệu boot #80 đã XÁC NHẬN theo T0-171 (9 nguồn) — không còn "dự kiến".**
**T5-171 KHÔNG phán (m), chỉ trình số thô — (m) #80 KHÔNG PHẢI ỨNG VIÊN theo T0-171 (0 requeue).**

---

## §1. Timeline (giờ Z, 22/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 11:11:05Z | Reboot #79 (5df1871f, btime) — gap #78→#79 = 6.987 s |
| 11:49:14Z | Cờ POSTBOOT_PASS #79 ghi (replay-day-du, poll=0) |
| 14:21:03Z | **Run 170 SUCCEEDED** (T0-171: trước btime #80 598 s, margin 888 s, 0 lần viết lại) |
| 14:21:59Z | **Poll cuối watcher-170 trên #79** (dpkg 1545, 0 proc) — sau đó watcher DỪNG POLL, không có dòng END/STOP (F-171-T5-1) |
| 14:30:00Z | Hạn END của watcher-170 (không có dòng END trong log — watcher đã chết trước đó 8m01s) |
| 14:31:01Z | **Reboot #80 (2acdd1ab, btime, epoch 1795357861) — gap #79→#80 = 11.996 s (3h19m56s)**; xảy ra 4m50s TRƯỚC khi đợt mở |
| 14:31:13Z | Journal #80 first entry (boot+12s); /proc/1 mtime 14:31:13,025Z (boot+12,025s) |
| 14:35:39Z | Hoạt động dpkg đầu trên #80 (boot+4m38s): 2 dòng `startup packages configure` (reconcile heal + replay heal) |
| 14:35:51Z | Lượt cron đợt 171 mở |
| 14:36:08Z | Transaction apt đầu của replay #80 (history.log); installs 14:36:08Z → 14:37:43Z (**~1m35s, 50 transaction**, mỗi gói 1 transaction — chữ ký vòng lặp per-package) |
| 14:37:44Z | Receipt `os-intent-replayed.sha256` ghi (hash = ledger sha256) — pass #80 sạch (failures=0) |
| ~14:50Z | **T5-171 mở trên #80**: uptime ~19' → boot 14:31:01Z (khớp btime); /proc/1 mtime +12,025 s; journal idx 0 duy nhất, first entry 14:31:13Z (+12 s); không có file round-in-progress.md |
| 14:52:09Z | **Watcher-171 START, pid 28156, boot 2acdd1ab** (khoảng không-watcher 1.810 s tính từ poll cuối watcher-170 14:21:59Z); **REPLAY_DONE + FLAG-WRITTEN ngay poll đầu (poll=0)** — replay đã xong từ 14:37:44Z |
| 14:52:09Z | **Cờ POSTBOOT_PASS #80 ghi (boot+21m08s, replay-day-du, poll=0)** |
| 14:55:25Z | T5 verify độc lập postboot check-only trên #80: **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269** (log `t5-postboot-independent-2acdd1ab.log`) |
| 14:57:42Z | Stats script chạy lần 1 (`t5-stats-171.py` → `t5-stats-171-output.txt`); watcher-171: 17 dòng log, 12 poll; RAM MemAvailable 2.753.692 kB; X11: 4 socket X193–X196 (mtime 14:50/14:51Z) |
| 15:01:09Z | T0-171 kiểm cuối: boot lúc đóng vẫn 2acdd1ab; T0-171 DONE ~15:01Z (XÁC NHẬN #80 9 nguồn; marker 32 reboot; run 170 SUCCEEDED; O8 3/3 PASS) |
| 15:03:23Z | Stats script chạy lần 2 (kiểm lại sau khi sửa F-171-T5-2; chỉ khác các giá trị phụ thuộc thời gian — xem §10); watcher-171: 28 dòng log, 23 poll |
| ~15:08Z | T5 viết LIMITS này. Watcher-171 vẫn ĐANG CHẠY (pid 28156, ALIVE; poll 15:07:42Z dpkg 1545 ổn định, 0 proc), dpkg ổn định 1545 dòng |

Tuổi boot theo btime: #79: 11.996 s (3h19m56s, tính tới btime #80).

---

## §2. Hướng (3) + marker + đồng hồ

Kiểm tra lại lúc stats 14:57:42Z trên #80 (`t5-stats-171.py` §8, khớp mẫu T5-170 §2):

- `systemctl is-active user@0` = **inactive**; `logind` = **inactive**; `dbus` = **inactive**.
- `loginctl show-user root` → **không nối được bus** (`Failed to connect to bus: No such file or directory` — như các đợt trước, logind chết, không có D-Bus system bus).
- `/var/lib/systemd/linger/` → **không tồn tại** → không user nào linger.
- `ls /run/user/0` → **không tồn tại**.
- `crontab` → **không có lệnh** (`command not found` — không có cron).
- `systemctl list-timers --all` → 0 timer VCut (chỉ các timer hệ thống mặc định).

→ **Hướng (3) VẪN ĐỨNG lần thứ 18 liên tiếp** (quyết (j) đợt 170 ghi nhận lần thứ 17; T5-171 kiểm lại lần thứ 18, cùng kết quả). Không có bằng chứng nào cho hướng (1)/(2) (session sống / service giữ boot).

**Marker:** `~/.config/vcut-persistence-marker` CÒN, nội dung: written 2026-11-20T11:39:40Z, boot 2c0a7985 (reboot #48, btime 2026-11-20T11:26:05Z); mtime **2026-11-20 11:39:47Z không đổi** — sống qua **#49–#80 = 32 reboot** (80−49+1=32). **T0-171 đếm độc lập: 32 ĐÚNG.**

**Đồng hồ:** 4 lần đo đồng thời lúc stats (2 lần/chạy × 2 chạy): run1 CF 14:57:44 GMT vs local 14:57:42,514–43,234Z (CF nhanh hơn ~0,8–1,5 s); run2 CF 15:03:25 GMT vs local 15:03:23,147–24,444Z (CF nhanh hơn ~0,6–1,9 s) → **Cloudflare nhanh hơn local ~0,4–1,9 s** (local chậm hơn CF ~1 s). Lệch ≤2 s — cùng họ các đợt trước. Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn.

---

## §3. Watcher-171 + POSTBOOT_PASS

### §3.1 POSTBOOT_PASS #80 — ĐÃ CÓ (replay-day-du, poll=0)

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round171-t5/POSTBOOT_PASS` (315 B, mtime 14:52:09.926Z).
- **Nội dung (nguyên văn):** `boot 2acdd1ab-23a6-41b0-9d90-40641d2404a0 (btime 2026-11-22 14:31:01Z; watcher-171) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T14:52:09Z; POSTBOOT_PASS moi ghi 2026-11-22T14:52:09Z poll=0 (replay-day-du); co cu 5df1871f luu POSTBOOT_PASS-5df1871f`
- **Backup cờ #79:** `POSTBOOT_PASS-5df1871f` (315 B) — `diff` KHỚP file gốc round170-t5.
- **Diễn biến replay #80 (hậu kiểm từ dpkg.log + history.log + receipt — KHÔNG có watcher nào sống trong lúc replay chạy vì khoảng không-watcher bao trọn 14:35:39–14:37:44Z):**
  - Hoạt động dpkg đầu 14:35:39Z (boot+4m38s): 2 dòng `startup packages configure` — reconcile heal + replay heal (mỗi lần `dpkg --configure -a` ghi đúng 1 dòng — T5-169 đo trực tiếp §3.5).
  - Transaction apt đầu 14:36:08Z; installs 14:36:08Z → 14:37:43Z (**~1m35s, 50 transaction**, mỗi gói 1 transaction — chữ ký vòng lặp per-package, commandline mang DPkg::Post-Invoke recorder).
  - Cửa sổ update (nếu có): ≤29 s giữa hoạt động dpkg đầu (14:35:39Z) và transaction đầu (14:36:08Z) — NHANH NHẤT từng kẹp (so #79 ~8m56s, #77 nhanh, #47 ~12 phút). Không quan sát trực tiếp được update có chạy hay không (không watcher trong cửa sổ) — chỉ ghi cận trên 29 s, không suy nguyên nhân (mirror nhanh / lists đã tươi đều có thể).
  - Breakdown dpkg 1545 dòng: **106 startup + 169 install + 1.040 status + 178 configure + 43 trigproc + 9 upgrade = 1.545** — **Y HỆT breakdown replay #77 và #79** (cùng ledger, cùng cache, cùng kết quả).
  - Gói đầu cài: libaspell15 (14:36:08Z); gói cuối: gstreamer1.0-tools (14:37:43Z). 4 gói gstreamer đều có trong history.log (4 hit).
  - Cache 178 .deb (162.917.560 byte ≈ 155,4 MiB); lists 37 (cogentco 34 file, azure 0 — **mirror cogentco như #79**; cả hai URI đều có trong ubuntu.sources). GST thư mục thật 269 file = debroot 269.
  - Receipt `/var/lib/hatch-preflight/os-intent-replayed.sha256` ghi 14:37:44Z, hash `d3ef183d…` **= sha256 của ledger hiện tại** — pass sạch (failures=0).
  - Ledger: 1 dòng, compacted=true, ts 1795327298, added 170, removed 0 (đã compact từ #76; trên #80 compact là no-op, mtime giữ 07:36:32Z).
  - Toàn bộ replay: 14:35:39Z → 14:37:44Z = **~2m05s — NHANH NHẤT từng kẹp** (#79: 12m37s; #77: ~100 s sau hoạt động đầu + update nhanh; #80 nhanh cả hai đầu: khởi động boot+4m38s + update ≤29 s + installs 1m35s).
- **Verify độc lập (T5, 14:55:25Z + watcher poll0 14:52:09Z):** postboot check-only **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269, thư mục thật** (log `t5-postboot-independent-2acdd1ab.log` + `t5-postboot-poll0-2acdd1ab.log`).
- **11 gói đã cài (kiểm bằng dpkg-query, stats §5):** libevent-2.1-7t64 2.1.12-stable-9ubuntu2.2, gstreamer1.0-plugins-base 1.24.2-1ubuntu0.7, gstreamer1.0-plugins-good 1.24.2-1ubuntu1.8, gstreamer1.0-plugins-bad 1.24.2-1ubuntu4, gstreamer1.0-plugins-ugly 1.24.1-1build1, gstreamer1.0-gl 1.24.2-1ubuntu0.7, gstreamer1.0-libav 1.24.1-1build1, gstreamer1.0-x 1.24.2-1ubuntu0.7, libavif16 1.0.4-1ubuntu3, libgstreamer1.0-0 1.24.2-1ubuntu0.2, libevdev2 1.13.1+dfsg-1build1 — **y hệt phiên bản trên #79 (và #77/#75)**.
- **Độ phủ ledger:** dpkg-query theo tên literal: 169/170 — thiếu duy nhất `libevent-2.1-7` (tên cũ). Nhưng `apt-get install -s libevent-2.1-7` trả **exit 0** → thỏa qua `Provides` của `libevent-2.1-7t64` → **hiệu dụng 170/170, pass sạch, receipt được ghi** (stats §5 resolve qua `apt-get install -s` — bài học F-169-T5-2 đã áp dụng).
- **Caveat dòng đầu log postboot (F-169-T5-3, vẫn đúng đợt này):** dòng tóm tắt đầu của script postboot mang thời gian + md5 CŨ (boot #41: 01:26:35Z/01:30:13Z, md5 51d12c3d) dù các con số khác (1545/169/9/178/269) trùng #80 — đó là ghi chú lịch sử gắn cứng trong script, KHÔNG phải số đo của boot này. Chỉ dùng các dòng verdict PASS + exit code + kiểm độc lập bằng dpkg-query (stats §5) làm bằng chứng. Không trích dòng đó cho thời gian/md5.

### §3.2 POSTBOOT_PASS #79 / #77 / #75 — VẪN CÓ, còn hiệu lực (theo dõi tiếp)

- Nội dung round170-t5/POSTBOOT_PASS (#79, replay-day-du, poll=0, ghi 11:49:14Z), round169-t5/POSTBOOT_PASS (#77, replay-day-du, poll=0, ghi 08:46:44Z) và round168-t5/POSTBOOT_PASS (#75, mode repair, ghi 06:01:38Z) không đổi; mtime không đổi.
- Backup `POSTBOOT_PASS-5df1871f` trong round171-t5 `diff` KHỚP file gốc — cờ #79 được bảo toàn qua lần ghi cờ thứ năm.
- #74 (round167-t5) và #70 (round166-t5) cũng còn nguyên (kiểm lại bằng stats script §2c).

### §3.3 POSTBOOT_PASS #78 — KHÔNG CÓ, không bù được

- **#78 (e298bb52):** grep toàn bộ `POSTBOOT_PASS*` dưới `hidden_files/round*/` 0 kết quả (cả file cờ lẫn tên file lẫn nội dung; grep cả docs đợt 170 chỉ thấy nhắc tới trong LIMITS/.done, không có file cờ). **Boot thứ 14 không có cờ.**
- Không bù được (cùng quy tắc #63/#66/#68/#71/#72/#73/#76: cờ chỉ chứng nhận phép đo trực tiếp trên boot sống; #78 chết trước khi có phiên T5 nào — không có phiên T5 nào chạy trên #78).
- Đếm boot không cờ tới nay: #51, #53, #54, #55, #57, #60, #63, #66, #68 (9, theo T5-166) + #71 (10) + #72 (11) + #73 (12) + #76 (13) + **#78 (14)** — không đổi đợt này (#80 ĐÃ CÓ cờ).

### §3.4 Watcher-170 — CHẾT theo #80 (xác minh đầy đủ từ log gốc + F-171-T5-1)

**START 11:42:42Z, pid 20516, boot 5df1871f; CHẾT theo reboot #80 (poll cuối 14:21:59Z; `kill -0`: No such process — T5-171 xác minh lúc mở).** Log 324 dòng, **319 poll** (gaps {30 s ×301, 31 s ×17} — không có gap 860 s như watcher-168), md5 {e81107bd (2 dòng, lúc mở), c0c03944 (1545 dòng, sau replay), + 8 md5 trung gian lúc replay đang chạy}, boot_set [5df1871f], kinds {START: 1, MONITOR: 1, REPLAY_DONE: 1, postboot: 1, FLAG-WRITTEN: 1} — **KHÔNG có dòng END/STOP**. **307/319 poll có 0 proc apt/dpkg; 12 poll đầu (11:42:42–11:48:13Z) có proc apt** (pid 843 lúc update, rồi 22560/24282/25770/28420… lúc installs — replay #79 đang chạy, đúng thiết kế watcher không kích repair khi có proc). **Poll cuối 14:21:59Z TRƯỚC btime #80 (14:31:01Z) 542 s — không overlap kiểu F-170-T5-1. DỪNG POLL 8m01s TRƯỚC hạn END 14:30:00Z — xem F-171-T5-1 (§4.2).**

### §3.5 Watcher-171 — 1 lần khởi động, đang chạy

**START 14:52:09Z, pid 28156, boot 2acdd1ab**, cùng script `replay-watch-171.sh` (tạo bằng `make-watcher-171.py` từ nguồn 170 — xem §10 F-171-T5-2). Init: dpkg 1545 dòng md5 c01f3a02 mtime 14:37:43Z, cache 178, lists 37, gst_sys 269. Poll đều 30 s. Poll đầu ghi `apt=[] apt2=[] dpkg=[]` + dpkg ổn định → **REPLAY_DONE + FLAG-WRITTEN ngay poll đầu (14:52:09Z, poll=0)** — đúng thiết kế (replay đã xong trước khi watcher khởi động; watcher KHÔNG kích early-repair vì dpkg 1545 > 100, đúng thiết kế). **Đang chạy lúc đóng LIMITS (ALIVE, kill -0 28156; poll 15:07:42Z dpkg 1545 ổn định, 0 proc).** Khoảng không-watcher: **1.810 s = 30m10s** (poll cuối watcher-170 14:21:59Z → START 14:52:09Z; tính từ btime #80 14:31:01Z là 1.268 s) — ngắn hơn nhiều so với đợt 170 (8.873 s) vì #80 xảy ra ngay trước khi đợt mở.

**Không probe dpkg nào của T5-171:** đợt này T5 KHÔNG chạy `dpkg --configure -a` (khác đợt 169 — xem §6 B4). Mọi kiểm tra của T5 đều chỉ đọc (dpkg-query, `apt-get install -s`, postboot check-only, ps, journalctl, curl).

**Generator `make-watcher-171.py`:** viết mới theo mẫu 170, header VIẾT MỚI hoàn toàn cho đợt 171; thay token đúng chuỗi trong nguồn (`replay-watch-170.log`→`replay-watch-171.log`, `replay-watch-170.sh`→`replay-watch-171.sh`, `round170-t5`→`round171-t5`, `round169-t5`→`round170-t5`, `REPLAY-WATCH-170`→`REPLAY-WATCH-171`, `watcher-170`→`watcher-171`, hạn cứng `2026-11-22 14:30:00`→`2026-11-22 17:30:00`, `14:30:00Z`→`17:30:00Z`); assert thêm (không còn `replay-watch-170`/`REPLAY-WATCH-170`/`watcher-170`/`14:30:00` trong THÂN; `LOG=$DIR/replay-watch-171.log`); `bash -n` OK; 2 chuỗi "H2" còn lại trong file đều ở header comment (từ chối giả thuyết H2 — hợp lệ, như đợt 170). Spawn bằng đường dẫn TUYỆT ĐỐI + nohup + disown (F-167-T5-2 đã sửa: không dùng `cd ... && ... &`).

---

## §4. Boot #80 + đồng hồ

### §4.1 Xác minh boot #80 (boot hiện tại — T0-171 XÁC NHẬN 9 nguồn)

- boot_id: `2acdd1ab-23a6-41b0-9d90-40641d2404a0`; btime /proc/stat: **14:31:01Z (epoch 1795357861)**.
- Lúc mở ~14:50Z: uptime ~19' → boot 14:31:01Z (khớp btime 0 s); /proc/1 mtime 14:31:13,025Z (+12,025 s); journal first entry 14:31:13Z (+12 s).
- Stats script 14:57:42Z: uptime 1.600,55 s → boot 14:31:01Z (khớp btime); 15:03:23Z: uptime 1.941,12 s → boot 14:31:01Z (khớp btime).
- `uptime -s` = 14:31:01Z — KHỚP btime.
- Boot #79: btime 11:11:05Z (epoch 1795345865 — quyết parent đợt 170); boot #78: btime 09:14:38Z (epoch 1795338878).
- **Gap #79→#80 = 11.996 s (3h19m56s)** — tính độc lập bằng 2 phương pháp: trừ epoch bằng python (1795357861−1795345865) + `date -d @<epoch>` đối chiếu từng btime (14:31:01Z − 11:11:05Z). Cả hai khớp. **KHỚP T0-171 (9 nguồn).**
- **Gap #78→#79 kiểm lại độc lập = 6.987 s (116m27s)** — KHỚP quyết parent đợt 170.

### §4.2 Lệch khung giờ biên #79/#80 + F-171-T5-1 (số thô cho T2-171 — KHÔNG phán (m))

- **F-171-T5-1 (phát hiện chính đợt này): watcher-170 DỪNG POLL lúc 14:21:59Z — 8m01s TRƯỚC hạn END 14:30:00Z của chính nó, KHÔNG có dòng END/STOP trong log, KHÔNG có file `watcher-stop`.** Log watcher-170: 324 dòng, 319 poll, poll cuối 14:21:59Z, log mtime 14:21:59.379Z (ghi trực tiếp, không phải timestamp ước lượng). Script watcher chỉ thoát ở 2 chỗ: tới hạn END (ghi dòng END) hoặc gặp file watcher-stop (ghi dòng STOP) — cả hai đều không xảy ra, nên tiến trình đã bị giết từ bên ngoài hoặc cell bị đóng băng/dừng trong khoảng 14:21:59–14:31:01Z.
  - Dẫn chứng mới (từ T0-171): **run 170 SUCCEEDED 14:21:03Z — chỉ 56 s TRƯỚC poll cuối watcher-170 (14:21:59Z).** Trùng hợp thời gian đáng chú ý: tiến trình watcher chết ~1 phút sau khi cron run 170 kết thúc thành công. Giả thuyết mới (CHƯA CHỨNG MINH): host-side teardown sau khi cron run xong giết các tiến trình cell còn sót (watcher chạy bằng nohup ngoài systemd service nên không được bảo vệ). Cần đối chiếu với các đợt trước: watcher-169 sống tới 11 s SAU btime #78 (không chết sớm theo run); watcher-168 có gap 860 s (chết sớm hơn nhiều) — mẫu không nhất quán, chưa kết luận được.
  - Không có bằng chứng phụ nào trong cell: journal #79 đã mất theo reboot (journal cell chỉ giữ boot hiện tại); không file round170-t4/t9 nào có mtime 14:20–14:23Z; không có OOM/killed process ghi được trên #80 (journal #80 chỉ 154 dòng lúc stats, T9 kiểm chính thức).
  - **Hệ quả cho T2: khoảng không-watcher đợt này (1.810 s) dài hơn khoảng "chết theo reboot" thông thường** — toàn bộ replay #80 (14:35:39–14:37:44Z) nằm trong khoảng không-watcher, không có poll nào kẹp giữa btime #80 và replay; mọi số replay #80 đều là hậu kiểm từ dpkg.log/history.log/receipt (đủ tin cậy: 3 nguồn độc lập khớp nhau + postboot exit 0), nhưng KHÔNG có quan sát trực tiếp lúc replay chạy.
  - **Hệ quả cho (m) #80: KHÔNG CÓ** — T0-171 xác nhận 0 requeue, không run sống tại btime → (m) #80 KHÔNG PHẢI ỨNG VIÊN. T5 KHÔNG phán thêm.
- Biên #79/#80: **poll cuối watcher-170 TRƯỚC btime #80 542 s** — không overlap kiểu F-170-T5-1 (poll sau btime). Các mốc khung mới đều sau btime, cùng chiều, không mâu thuẫn: /proc/1 +12,025 s; journal first entry +12 s.
- Reboot thật #80 ∈ (14:21:59Z, 14:52:09Z] theo watcher (poll cuối #79 → poll đầu #80); btime neo #79 11:11:05Z, #80 14:31:01Z.
- Requeue run 170 tại #80 + offset (m) thuộc T7-171/T2-171 (T5 chưa có số — KHÔNG tự tính offset). **(m) #80 KHÔNG PHẢI ỨNG VIÊN theo T0-171** (0 requeue).

### §4.3 Lists #80 = 37 (mirror cogentco) — bằng #77, khác #79 (=30)

- Lists lúc watcher-171 mở: 37 (cogentco 34 file, azure 0; ubuntu.sources liệt kê 2 URI: azure + mirror.cogentco.com, như #79). #79 lists 30 (cogentco 27, azure 0); #77 lists 37 (azure 34, cogentco 0); #74 lists 37 (1 mirror); #75 sau repair update: 75 (2 mirror).
- **Không file .deb nào được tải lại trên #80**: toàn bộ 178 .deb trong cache đều có mtime ≤ 2026-11-18 16:22:47Z — replay #80 chạy hoàn toàn bằng cache-hit (như #79).
- Ghi nhận khác biệt mirror/số lists, không suy nguyên nhân (có thể apt chọn URI thứ hai khi URI đầu chậm — bằng chứng trong cell không phân biệt được).
- Proxy egress: `http://hatch-egress-proxy:3128` (cả http/https — `/etc/apt/apt.conf.d/80hatch-egress-proxy`).

---

## §5. GHI NHẬN ĐÓNG ĐIỀU TRA REPLAY #75 (theo quyết parent (j) đợt 169 + ghi nhận lại (j) đợt 170)

Parent đã quyết (j) đợt 169: **CHẤP NHẬN ĐÓNG điều tra vì sao replay #75 không chạy ở mức CHƯA XÁC ĐỊNH nguyên nhân gốc + leo thang kiểm journal host-side**; quyết (j) đợt 170 GHI NHẬN lại việc đóng này. T5-171 ghi nhận và KHÔNG mở lại điều tra trong cell. Tóm tắt trạng thái đóng (từ LIMITS T5-170 §5, không điều tra thêm):

- **Đã loại trừ bằng bằng chứng:** backoff (guard cả reconcile — #75 có 2 dòng dpkg nên backoff không engage; tối đa 2 strike lúc #75 mở, xa ngưỡng 5); receipt fast-path skip (receipt không sống qua reboot — #77 chứng minh thư mục receipt được tạo mới lúc ghi); fold từ chối (ledger 1 dòng ~2 KB, 170 tên — xa ngưỡng; cùng ledger đã fold thành công trên #76/#77); gói/version-drift/mirror (cùng cache + mirror, #77/#79/#80 đều cài đủ 170 intent, failures=0); cache trống (vòng lặp có fallback tải — #73 chạy với cache lạnh); tranh lock (lock chỉ làm apt chờ, vẫn hiện proc — 191 poll 0 proc); "chạy muộn" (191 poll / 1h49m, 0 proc — vắng hẳn, không phải muộn).
- **Còn lại 2 ứng viên host-side (chỉ journal host-side của unit `hatch-preflight-opportunistic` trên boot #75 mới phân biệt được):**
  - (i) Pass chết/lỗi lặng ở đoạn host-side giữa reconcile xong (05:33:26Z) và vòng lặp (re-snapshot, fold, receipt-check, compact, hoặc spawn/feed payload qua nsenter).
  - (ii) Payload chạy nhưng feed vòng lặp rỗng/hỏng (chuỗi `verb pkg` không tới được `while read`): vòng lặp đọc EOF ngay → 0 install, 0 proc, failures=0 → reseed → autoclean → exit 0 → receipt ghi (bị xóa theo boot). Ứng viên này GIẢI THÍCH ĐƯỢC cả cache 178→0 (autoclean cuối payload với lists chỉ có base).
- **Hướng leo thang:** kiểm journal host-side của unit preflight boot #75 (+ #76) và log RV snapshot/restore — T5 trong cell không đọc được (journal cell chỉ giữ boot hiện tại; host journal không mount vào cell). Bằng chứng gốc trong cell đã hết — cùng họ quyết đóng điều tra #73 ở mức chưa xác định (quyết (j) đợt 168).
- **Đối chứng mới đợt 171:** replay #80 CHẠY ĐẦY ĐỦ VÀ NHANH NHẤT (~2m05s, như #77/#79) — driver KHÔNG chết hệ thống; lỗi #75 là nhất thời (transient). Vòng lặp #79 có chạy xong không thì ĐÃ BIẾT (xong 11:48:16Z — xem LIMITS T5-170); vòng lặp #78 có chạy xong không thì KHÔNG BIẾT (dpkg.log #78 mất theo reboot; không receipt nào sống qua boot để đối chiếu) — ghi rõ, không suy đoán.

---

## §6. Quy tắc đứng

(Trích từ LIMITS các đợt trước — giữ nguyên, không đổi.)

1. **Cờ POSTBOOT_PASS chỉ chứng nhận phép đo trực tiếp trên boot sống.** Boot đã chết trước khi có phiên T5 thì KHÔNG bù được (áp dụng #78 đợt này; #76/#71/#72/#73 trước đó).
2. **Watcher chết theo reboot là bình thường** — watcher là tiến trình trong cell, không sống qua reboot. Khoảng không-watcher được đo và ghi (đợt này: 1.810 s). **Bổ sung đợt 171 (F-171-T5-1):** watcher cũng có thể chết TRƯỚC reboot 8m01s mà không để lại dòng END/STOP — khoảng không-watcher phải tính từ poll cuối thực tế, không phải từ hạn END hay btime.
3. **Hướng (3) đứng:** không có bằng chứng session/service nào giữ boot sống qua reboot (kiểm lại lần thứ 18 đợt này — xem §2).
4. **Khung giờ boot cũ = XÁC NHẬN OVERLAP, không đổi verdict (m)** (quyết (e) đợt 166). T5 chỉ đo số thô tại biên reboot, giao T2 đối chiếu. **Bổ sung đợt 170 (F-170-T5-1):** poll cuối watcher có thể nằm SAU btime boot mới (11 s) — cận trên "boot cũ chết" từ poll cuối không còn chắc chắn; T2 tính khung phải tính khả năng này. **Bổ sung đợt 171:** poll cuối cũng có thể nằm TRƯỚC hạn END của watcher 8m01s (F-171-T5-1) — khoảng "không quan sát" dài hơn khoảng "chết theo reboot".
5. **Không kết luận nguyên nhân khi chưa có bằng chứng trực tiếp** (áp dụng cho replay #75 — xem §5; và cache 178→0→178 — xem LIMITS T5-169 §5.5; và F-171-T5-1 — xem §4.2).
6. **Chỉ stage, KHÔNG PUSH** — user tự push sau từ main chat.
7. **B4 — KHÔNG chạy probe chạm dpkg trong cửa sổ attempt của T4** (GIỮ NGUYÊN, không nới). Đợt 169 probe `dpkg --configure -a` lúc 08:55:22Z làm +1 dòng dpkg.log, nhiễm attempt2 của T4. **Đợt 170: T5 KHÔNG chạy probe chạm dpkg nào** (0 lần); **đợt 171: T5 KHÔNG chạy probe chạm dpkg nào** (0 lần); mọi kiểm tra đều chỉ đọc. T4-171: luật "không chạy script phân tích nặng trong cửa sổ attempt" vẫn đứng (nhắc lại từ đợt 169; quyết (h) đợt 170 nhắc wording T4).

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM (stats 14:57:42Z, boot #80):** MemTotal 8.124.900 kB; MemAvailable 2.753.692 kB; MemFree 369.448 kB; loadavg 3,06 (load 15' là 2,48). Cao hơn #79 (MemAvailable 1.869.972 kB) — replay #80 xong nhanh, ít tiến trình nặng còn chạy. (T9 đo headroom chính thức — T5 chỉ ghi snapshot.)

**ENOSPC (T9 đếm chính thức; T5 chỉ ghi snapshot):**
- #80: **19 dòng lúc 14:57:42Z** (journal 154 dòng, dòng đầu 14:36:14Z = boot+5m13s, từ `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`).

**X11:**
- TRỐNG lúc mở #79 (~11:42Z đợt trước); trên #80 lúc stats 14:57:42Z: **4 socket X193 (mtime 14:50Z)/X194/X195/X196 (mtime 14:51Z), 0 Xvfb thật** — xuất hiện trong lúc T5-171 mở phiên (giữa 14:50Z và 14:51Z, sau khi replay xong 14:37:44Z — khác mẫu các đợt trước là socket xuất hiện trong lúc replay chạy). Cùng họ các đợt trước (3 socket X193/X194/X195 mtime 11:44Z đợt 170) — **giao T8-171 dọn; X196 là socket thứ tư, mới xuất hiện đợt này**. Lúc viết LIMITS (~15:08Z) vẫn 4 socket.

**Journal:** #80: idx 0 duy nhất; 116 dòng lúc 14:49:41Z; 154 dòng lúc 14:57:42Z, dòng đầu 14:31:13Z. Không có OOM/killed process trên #80 (chưa grep toàn bộ — T9 kiểm chính thức; T5 chỉ ghi snapshot).

---

## §8. Nợ mở chuyển đợt 172 (T5-172 sở hữu)

1. **Watcher-171 (pid 28156) tiếp tục giám sát tới 17:30:00Z 22/11** — T5-172 kiểm tra log cuối + poll cuối + END line (hoặc chết theo reboot mới / chết sớm kiểu F-171-T5-1). Nếu replay chạy lại sau khi T5-171 đóng (dpkg tăng từ 1545), watcher log sẽ ghi lại — T5-172 diễn giải.
2. **POSTBOOT_PASS #78 KHÔNG CÓ** (boot thứ 14 lọt, không bù được); #68/#63/#66 vẫn không có. **#80 ĐÃ CÓ (replay-day-du, poll=0)** — theo dõi tiếp; cờ repair #75 vẫn giữ nguyên (không ghi lại cờ replay).
3. **Marker 32 reboot #49–#80** (T0-171 đếm độc lập: 32 ĐÚNG).
4. **F-171-T5-1 (watcher-170 dừng poll 8m01s trước hạn END, không có dòng END/STOP):** giao T2-172 + parent theo dõi — có lặp lại ở watcher-171 không; đối chiếu với thời điểm run 170 SUCCEEDED 14:21:03Z (56 s trước poll cuối) và các mốc chết sớm của watcher-168 (gap 860 s). Nếu watcher-171 cũng chết sớm trước hạn END 17:30:00Z thì mẫu "chết sau khi cron run xong" mạnh lên.
5. **Điều tra replay #75: ĐÃ ĐÓNG** theo quyết parent (j) đợt 169 + ghi nhận lại (j) đợt 170 (xem §5) — không mở lại trong cell; leo thang journal host-side thuộc parent.
6. **Cache 178 → 0 → 178: cơ chế xóa + khôi phục CHƯA XÁC ĐỊNH** (giả thuyết mạnh nhất: autoclean cuối payload với lists base-only + snapshot restore hồi lại — xem LIMITS T5-169 §5.5); cần log host-side (RV snapshot/restore).
7. **Replay #80 nhanh nhất từng kẹp (~2m05s, khởi động boot+4m38s, update ≤29 s):** ghi nhận, không điều tra (pass sạch, đủ 170 intent). Nếu replay #81 cũng nhanh tương tự thì "update chậm ~9 phút" của #79 là ngoại lệ do mirror, không phải mẫu.
8. **Guard symlink GST:** không kích hoạt đợt này (không repair nào chạy — dpkg 1545 dòng lúc mở, replay ĐÃ XONG nên early-repair không kích; GST thư mục thật 269 từ đầu sau replay). Bài học F-168-T5-2 vẫn đứng cho boot mới trong phiên watcher-171 nếu early-repair kích hoạt: T5-172 gỡ symlink tay trước khi install nếu replay bắt đầu sau repair.
9. TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet.
10. G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời — để yên, không nhắc lại). R9 (a) vẫn chờ user (số đếm vẫn là 16).

---

## §9. Đề xuất cho parent

- **(a) Chấp nhận kết quả T5-171:** cờ #80 (replay-day-du, poll=0, verify độc lập exit 0 — T5 14:55:25Z + watcher poll0 14:52:09Z); #79/#77/#75 còn hiệu lực; #78 không cờ, không bù được; watcher-171 đang chạy; hướng (3) lần thứ 18; marker 32 reboot (T0 đếm độc lập ĐÚNG); gap #79→#80 = 11.996 s (KHỚP T0-171).
- **(b) Cờ #80 replay-day-du (không phải repair) có được tính là POSTBOOT_PASS đủ điều kiện cho gate (a) của T4/T8 không?** Đây là cờ replay đầy đủ thứ ba liên tiếp sau #77/#79 (pass sạch, receipt khớp ledger, 170/170 hiệu dụng) — T5 đề xuất: cờ ĐỨNG cho gate (a) không caveat mode repair (như #77/#79, quyết (j) đợt 169/170). T5 không phán gate — parent quyết. Lưu ý: T4-171 đã có preflight-postboot-171.log lúc 14:47Z (TRƯỚC khi cờ #80 được ghi 14:52:09Z) — T4 tự đối chiếu lại; O8 đã PASS 3/3 trên boot #80 (T0-171, DONE 14:57:22Z).
- **(c) Số hiệu #80 (XÁC NHẬN):** T0-171 đã xác minh 9 nguồn (boot 2acdd1ab, btime 14:31:01Z, gap 11.996 s) — không cần quyết thêm, chỉ ghi nhận.
- **(d) F-171-T5-1 — watcher-170 dừng poll 8m01s trước hạn END, không dòng END/STOP:** T5 trình mâu thuẫn + giả thuyết host-side teardown sau run 170 SUCCEEDED (56 s trước poll cuối) + hệ quả cho khoảng không-watcher (replay #80 không được quan sát trực tiếp). Đề xuất: ghi nhận, giao T5-172 theo dõi xem watcher-171 có lặp lại không; không cần điều tra riêng đợt này (chưa đủ mẫu — watcher-169 không chết sớm kiểu này).
- **(e) Điều tra replay #75: ĐÃ ĐÓNG** theo quyết (j) đợt 169 + ghi nhận lại (j) đợt 170 — không cần quyết thêm; leo thang journal host-side chờ parent sắp xếp (nếu có kênh host).
- **(f) X11 X193/X194/X195/X196 (14:50/14:51Z):** giao T8-171 dọn theo mẫu các đợt trước (X196 mới).

---

## §10. Sai số của chính T5-171 (ghi để đợt sau khỏi lặp)

- **F-171-T5-1 — Watcher-170 DỪNG POLL 8m01s trước hạn END 14:30:00Z, không có dòng END/STOP (PHÁT HIỆN, không phải lỗi của T5-171):** xem §4.2 đầy đủ. T5-171 không tạo ra mâu thuẫn này — chỉ phát hiện khi đọc log watcher-170 lúc mở (T5-170 đóng cờ lúc ~11:53Z, TRƯỚC #80 nhiều giờ, nên không thể thấy). Giả thuyết host-side teardown sau run 170 SUCCEEDED (14:21:03Z, 56 s trước poll cuối) CHƯA CHỨNG MINH; hệ quả cho khoảng không-watcher đã trình ở §4.2.
- **F-171-T5-2 — Chẩn đoán leftover của `make-stats-171.py` còn nhiễu (cosmetic, file cuối ĐÚNG):** lần chạy transform đầu liệt kê 5 dòng "LEFTOVER-170" — đều là tham chiếu lịch sử hợp lệ chứa `watcher-170` (có gạch nối) mà bộ lọc chỉ loại `watcher170` (không gạch). Đã sửa transform (thêm `watcher-170` vào bộ loại trừ) + chạy lại: còn 1 dòng nhiễu (`Watcher-170` viết hoa — bộ lọc case-sensitive), file đích diff RỖNG với lần sinh trước → transform tái tạo đúng, không sửa thêm. Bài học: bộ lọc leftover phải loại cả hai dạng có/không gạch nối + không phân biệt hoa/thường (hoặc bỏ chẩn đoán này — file đã verify bằng diff + grep trực tiếp).
- **F-171-T5-3 — Cảnh báo đếm, KHÔNG PHẢI LỖI (đã xác minh, không ghi nhầm vào số chính thức):** `grep -c "poll"` trên log watcher-170 = 322, trong khi số poll thật = **319** (324 dòng − 5 dòng START/MONITOR/REPLAY_DONE/postboot/FLAG-WRITTEN). 3 dòng chênh là REPLAY_DONE/postboot/FLAG-WRITTEN nhắc `poll0`/`poll=0` trong nội dung. T5-171 đã suýt ghi nhầm 322 khi đọc nháp stats output lần 1 — đã kiểm lại bằng 4 phương pháp độc lập (log_stats regex, §11 regex, `grep -c 'boot=5df1871f poll'`, số học 324−5) + chạy lại stats lần 2 — tất cả đều 319. Bài học: đếm poll phải dùng regex `boot=<id> poll`, KHÔNG dùng grep substring "poll".
- **F-171-T5-4 — Stats §4/§8 in thừa số 0 (cosmetic, số ĐÚNG):** `lists_mirrors_azure=0` rồi thêm dòng `0` (do `grep -c azure || echo 0` — grep -c in 0 VÀ exit 1 nên echo 0 chạy theo); tương tự `timers_vcut=0` + dòng `0`. Giá trị đúng (azure 0 file, 0 timer VCut) — chỉ thừa dòng in. Các đợt sau: đổi thành `grep -c ... || true` hoặc bắt exit code.
- **F-171-T5-5 — `watcher-status-at-open.txt` ghi giờ mở dạng placeholder `14:5xZ` lúc tạo (ĐÃ SỬA trước khi đóng):** file được tạo trước khi spawn watcher-171 nên giờ spawn chưa biết; đã sửa thành 14:52:09Z (pid 28156) ngay sau khi spawn. Bài học: ghi file trạng thái SAU khi spawn, không ghi trước.

---

## §11. Batch stage

- **File stage:** `~/workspace/repo-1/docs/PHASE9_ROUND171_T5_INFRA_LIMITS.md` (file này).
- **Paths file:** `~/workspace/repo-1-push/paths-loop/phase9-round171-t5-infra.txt` (NUL-delimited, 1 entry — chỉ file text, KHÔNG binary).
- **Verify:** read-back bằng `od -c` sau khi stage (theo mẫu T5-166/T5-167/T5-168/T5-169/T5-170).
- **KHÔNG PUSH** — user tự push sau từ main chat.
- Các file làm việc trong `round171-t5/` (watcher script/log, stats script/output, postboot log, cờ POSTBOOT_PASS + backup, watcher-status-at-open) KHÔNG stage đợt này (theo mẫu T5-170: chỉ stage LIMITS); chúng nằm trên đĩa để T10/parent đối chiếu.

---

## Phụ lục A — Trích stats output (`t5-stats-171-output.txt`, chạy lần 2 15:03:23Z)

(Lần 1 chạy 14:57:42Z; lần 2 chỉ khác các giá trị phụ thuộc thời gian: uptime, journal last entry, đồng hồ, số poll watcher-171 12→23. Mọi số ổn định khác giống hệt — đã diff hai lần chạy.)

```
--- 1. boot id + uptime ---
boot_id=2acdd1ab-23a6-41b0-9d90-40641d2404a0
btime=1795357861 (2026-11-22 14:31:01 UTC)
uptime=1941.12 (boot 2026-11-22 14:31:01 UTC, luc stats lan 2 15:03:23Z)
clock: local_truoc=15:03:23.147Z CF=Sun, 22 Nov 2026 15:03:25 GMT local_sau=15:03:24.035Z (lan 2 tuong tu)
--- 2a. marker ---
marker_mtime=2026-11-20 11:39:47.000000000 +0000
--- 2b. grep POSTBOOT_PASS (tat ca round) ---
#2acdd1ab: round171-t5/POSTBOOT_PASS
#5df1871f (#79): round170-t5/POSTBOOT_PASS, round171-t5/POSTBOOT_PASS-5df1871f (+ round171-t5/POSTBOOT_PASS theo noi dung 'co cu')
#e298bb52 (#78): 0 ket qua — KHONG CO
#c44cc3ba: round169-t5/POSTBOOT_PASS, round170-t5/POSTBOOT_PASS-c44cc3ba (+ round170-t5/POSTBOOT_PASS theo noi dung 'co cu', + round171-t5/POSTBOOT_PASS-5df1871f theo noi dung 'co cu')
#f2b97695 (#76): 0 ket qua — KHONG CO
#576ca271: round168-t5/POSTBOOT_PASS, round169-t5/POSTBOOT_PASS-576ca271 (+ round169-t5/POSTBOOT_PASS theo noi dung 'co cu', + round170-t5/POSTBOOT_PASS-c44cc3ba theo noi dung 'co cu')
#194efd93: round167-t5/POSTBOOT_PASS, round168-t5/POSTBOOT_PASS-194efd93 (+ round168-t5/POSTBOOT_PASS theo noi dung 'co cu', + round169-t5/POSTBOOT_PASS-576ca271 theo noi dung 'co cu')
#b643911f (#73): 0 ket qua — KHONG CO
#9e089ef6 (#72): 0 ket qua — KHONG CO
#ea73ac4f (#71): 0 ket qua — KHONG CO
#d1ddd946 (#70): round166-t5/POSTBOOT_PASS, round167-t5/POSTBOOT_PASS-d1ddd946 (+ round167-t5/POSTBOOT_PASS theo noi dung 'co cu', + round168-t5/POSTBOOT_PASS-194efd93 theo noi dung 'co cu')
--- 3. round171-t5/POSTBOOT_PASS (#80, xac minh lai) ---
boot 2acdd1ab-23a6-41b0-9d90-40641d2404a0 (btime 2026-11-22 14:31:01Z; watcher-171) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T14:52:09Z; POSTBOOT_PASS moi ghi 2026-11-22T14:52:09Z poll=0 (replay-day-du); co cu 5df1871f luu POSTBOOT_PASS-5df1871f
mtime: 2026-11-22 14:52:09.925Z
gst_sys_files=269
apt_procs= (trong, luc stats)
watcher171_ps=28156 bash .../replay-watch-171.sh (ALIVE)
watcher170_pid20516_kill0=DEAD
--- 5. kiem tra goi postboot #80 + ledger ---
11/11 goi da cai (bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1); 5/5 lib; GST 269 = debroot 269
ledger literal 169/170, thieu ['libevent-2.1-7'] — nhung apt-get install -s rc=0 (Provides cua libevent-2.1-7t64) → hieu dung 170/170
--- 6. ENOSPC ---
#80: 19 dong (journal 154 dong, dong dau 14:36:14Z)
--- 7. RAM / load ---
MemTotal 8124900 kB; MemAvailable 2753692 kB; MemFree 369448 kB; loadavg 3.06
--- 8. systemd (huong 3) ---
user@0 inactive; logind inactive; dbus inactive; loginctl khong noi duoc bus; /var/lib/systemd/linger KHONG TON TAI; /run/user/0 KHONG TON TAI; khong cron; 0 timer VCut
--- 9. .done hien co (luc stats lan 1) ---
(chua co co .done nao — luc stats lan 1 14:57:42Z; round171-t0.done + round171-t1.done xuat hien sau do, ~15:01Z)
--- 10. X11 ---
4 socket X193 (mtime 14:50Z)/X194/X195/X196 (mtime 14:51Z); 0 Xvfb that
--- 11. watcher-170 log (doc lap) ---
319 poll tren #79, 324 dong, gaps {30s x301, 31s x17}, poll cuoi 14:21:59Z, mtime truc tiep 14:21:59.379Z; 0 dong END/STOP; 12/319 poll co proc apt (replay #79 dang chay); F-171-T5-1: poll cuoi TRUOC han END 481 s, TRUOC btime #80 542 s
--- 12. dpkg breakdown + apt history #80 ---
startup 106 + install 169 + status 1040 + configure 178 + trigproc 43 + upgrade 9 = 1545 dong (Y HET #77/#79); history 50 transaction (14:36:08-14:37:43Z); 4 goi gstreamer co mat
--- 13. replay #80: receipt + ledger + dpkg-state ---
receipt 14:37:44Z hash d3ef183d... = ledger sha256 d3ef183d...; ledger 1 dong mtime 2026-11-22 07:36:32Z (compact tren #76); dpkg-state.txt 952 dong mtime 14:37:43Z
--- 14. dieu tra: cache .deb mtime + lists + apt dirs ---
cache 178 .deb, mtime cu nhat 2021-01-02, moi nhat 2026-11-18 16:22:47Z; TAT CA 178 file < btime #79 (11:11:05Z); partial/ mtime 07:36Z (#76); lists cogentco 34 file / azure 0; InRelease mtime cu (tu update #79 11:35-11:44Z); lock/auxfiles/partial cham 14:35-14:37Z (#80)
```

## Phụ lục B — File làm việc trong `round171-t5/` (không stage, để đối chiếu)

- `watcher-status-at-open.txt` (mở ~14:50Z trên #80; đã sửa giờ spawn 14:52:09Z pid 28156)
- `make-watcher-171.py`, `replay-watch-171.sh` (14.399 B)
- `replay-watch-171.log` (trực tiếp; 28 dòng, 23 poll lúc stats lần 2 15:03:12Z), `replay-watch-171.nohup.log` (trống)
- `make-stats-171.py`, `t5-stats-171.py` + `t5-stats-171-output.txt` (chạy lần 2 15:03:23Z; lần 1 14:57:42Z)
- `t5-postboot-independent-2acdd1ab.log` (T5 verify độc lập, exit 0, 14:55:25Z) + `t5-postboot-poll0-2acdd1ab.log` (watcher poll0, exit 0, 14:52:09Z)
- `POSTBOOT_PASS` (#80, 315 B) + `POSTBOOT_PASS-5df1871f` (backup cờ #79, diff khớp)
