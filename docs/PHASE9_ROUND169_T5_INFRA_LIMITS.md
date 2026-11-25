# PHASE 9 — ROUND 169 — T5 INFRA LIMITS

**Đợt:** 169 (mở lượt cron 15:35 +07 22/11/2026 = 08:35:51Z; hạn cờ ~11:00Z, hạn cứng 11:30Z).
**Người viết:** T5-169. **Ngày:** 22/11/2026. **Boot làm việc lúc đóng:** #77 (dự kiến) c44cc3ba, btime 08:23:52Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #77 (replay-day-du, poll=0 — xem §3.1). File này là 1 entry duy nhất stage đợt 169 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #77 (c44cc3ba, btime 08:23:52Z) | **ĐÃ CÓ 08:46:44Z (boot+22m52s, replay-day-du, poll=0)** — verify độc lập exit 0 (T5 08:44:22Z + watcher poll0 08:46:44Z), 11/11 gói + 5/5 lib, GST 269 = debroot 269, ledger hiệu dụng 170/170 (xem §3.1) |
| POSTBOOT_PASS #76 (f2b97695) | **KHÔNG CÓ** (grep 0 kết quả — boot thứ 13 không cờ, không bù được) |
| POSTBOOT_PASS #75 (576ca271) | **VẪN CÓ, còn hiệu lực** (06:01:38Z, mode repair — quyết (j) đợt 168: repair ĐƯỢC TÍNH đủ điều kiện gate (a)) |
| POSTBOOT_PASS #74 (194efd93) | **VẪN CÓ, còn hiệu lực** (04:10:23Z, replay-day-du) |
| Reboot trong phiên | **#77 (c44cc3ba, btime 08:23:52Z, gap #76→#77 = 3.089 s = 51m29s)** — xảy ra TRƯỚC khi đợt mở 11m59s, trong khoảng không-watcher |
| Watcher-169 | START 08:46:43Z, pid 25426, boot c44cc3ba; REPLAY_DONE + FLAG-WRITTEN 08:46:44Z poll=0; **vẫn ĐANG CHẠY** lúc đóng (tới hạn cứng 11:30:00Z); 31 poll lúc 09:01:52Z |
| Watcher-168 | **CHẾT theo #76** (pid 13133 mất — kill -0 xác minh lúc mở); log 198 dòng, **191 poll, 0 proc apt/dpkg trong MỌI poll**; poll cuối 07:32:18Z (dpkg 795, 5 s trước btime #76). Khoảng không-watcher: **4.465 s = 74m25s** (poll cuối → START watcher-169) |
| Replay #75 | **KHÔNG CHẠY vòng lặp cài đặt — KHẲNG ĐỊNH, không còn là "chạy muộn"** (191 poll / ~1h49m, 0 proc, dpkg đứng 2 dòng tới khi repair; xem §3.4 + §5) |
| Replay #77 (đối chứng) | **CHẠY ĐẦY ĐỦ, 100 s**: hoạt động đầu 08:35:40Z (boot+11m48s), installs 08:36:03→08:37:42Z, 50 transaction, 169 install, dpkg 1545, cache 178, lists 37, receipt 08:37:43Z (hash = ledger sha256) |
| Điều tra nợ mới: vì sao replay #75 không chạy | **Cơ chế driver ĐÃ ĐỌC LẠI từ source (chỉnh T5-168 §5.1 — xem §5.1)**; backoff / receipt-skip / fold / gói / cache-trống / lock / "chạy muộn" — **TẤT CẢ ĐÃ LOẠI TRỪ bằng bằng chứng**; còn lại 2 ứng viên host-side (lỗi lặng giữa reconcile và vòng lặp, hoặc payload chạy với feed rỗng) — **CHƯA XÁC ĐỊNH, cần journal host-side (T5 trong cell không đọc được) — đề xuất leo thang, không điều tra tiếp từ trong cell (xem §5.4)** |
| Cache 178 → 0 → 178 | **Bằng chứng mới: toàn bộ 178 .deb hiện tại đều có mtime ≤ 18/11** (không file nào tải lại sau đó); 110 .deb repair #75 đã biến mất; giả thuyết mạnh nhất: autoclean cuối payload (với lists chỉ có base) XÓA 178 file trên #75 + snapshot restore hồi lại — **CHƯA CHỨNG MINH (xem §5.5)** |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#77 = 29 reboot** nếu #77 được xác nhận (T0 đếm độc lập) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 16 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0, 0 timer VCut) |
| ENOSPC | #77: **9 dòng lúc stats 08:48:35Z** (journal 135 dòng, dòng đầu 08:37:11Z = boot+13m19s, từ home-assistant-ensure.service) |
| X11 | **3 socket X193/X194/X195 (mtime 08:49Z)**, 0 Xvfb thật — giao T8-169 dọn |
| RAM #77 | MemAvailable 2.864.504 kB lúc 08:48:35Z; loadavg 7,04 (nhất thời — stats script đang chạy) |
| Đồng hồ | Local ≈ Cloudflare **−1 s** (CF nhanh hơn local ~0,1–1,1 s qua 2 lần đo) — cùng họ các đợt trước |
| Gap kiểm lại độc lập | #76→#77 = **3.089 s**; #75→#76 = **7.177 s** (KHỚP quyết parent (d) đợt 168) — cả hai tính bằng 2 phương pháp độc lập (trừ epoch python + `date -d`) |

**Số hiệu boot #77 là DỰ KIẾN theo đếm tuần tự — chờ parent xác nhận + T0 xác minh 9 nguồn.**
**Quyết (j) đợt 168 đã GHI NHẬN: POSTBOOT_PASS #75 mode repair ĐƯỢC TÍNH đủ điều kiện gate (a); điều tra #73 ĐÃ ĐÓNG ở mức chưa xác định nguyên nhân gốc. T5-169 KHÔNG phán lại (m), chỉ trình số thô.**

---

## §1. Timeline (giờ Z, 22/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 05:32:46Z | Reboot #75 (576ca271, btime) — gap #74→#75 = 5.237 s |
| 05:33:26Z | Hoạt động dpkg đầu trên #75 (boot+40s): 2 dòng `dpkg --configure -a` — driver chạy tới reconcile (xem §5.2) |
| 05:43:17Z | Watcher-168 START, pid 13133 (dpkg 2 dòng, cache 0, lists 5) |
| 05:47:48Z | Watcher-168 EARLY-REPAIR trigger → repair → cờ #75 (mode repair) 06:01:38Z |
| 07:32:18Z | Poll cuối watcher-168 trên #75 (dpkg 795, 0 proc) — **replay #75 không chạy trong cả ~1h49m quan sát** |
| 07:32:23Z | **Reboot #76 (f2b97695, btime, epoch 1795332743) — gap #75→#76 = 7.177 s (1h59m37s)**; watcher-168 chết theo |
| 07:36:32Z | **Ledger compact trên #76 (boot+4m09s)** — driver #76 chạy tới fold+compact (xem §5.6); archives/partial/ chạm 07:36Z |
| 08:23:52Z | **Reboot #77 (c44cc3ba, btime, epoch 1795335832) — gap #76→#77 = 3.089 s (51m29s)**; xảy ra 11m59s TRƯỚC khi đợt mở |
| 08:35:40Z | Hoạt động dpkg đầu trên #77 (boot+11m48s): 2 dòng `dpkg --configure -a` (reconcile heal + replay heal) |
| 08:35:51Z | Lượt cron đợt 169 mở |
| 08:36:02Z | Transaction apt đầu của replay #77 (history.log) |
| 08:36:03Z → 08:37:42Z | Vòng lặp per-package #77: 50 transaction, 169 install, gói cuối gstreamer1.0-tools |
| 08:37:43Z | Receipt `os-intent-replayed.sha256` ghi (hash = ledger sha256) — pass #77 sạch (failures=0) |
| ~08:41Z | **T5-169 mở trên #77**: uptime 17' → boot 08:23:52Z (khớp btime); `uptime -s` = 08:23:52Z; /proc/1 mtime 08:24:03,99Z (+12 s); journal idx 0 duy nhất, first entry 08:24:04Z (+12 s); không có file round-in-progress.md |
| 08:44:22Z | T5 verify độc lập postboot check-only trên #77: **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269** (log `t5-postboot-independent-c44cc3ba.log`) |
| 08:46:43Z | **Watcher-169 START, pid 25426, boot c44cc3ba** (khoảng không-watcher 4.465 s tính từ poll cuối watcher-168) |
| 08:46:44Z | **Watcher REPLAY_DONE + postboot poll0 exit 0 → FLAG-WRITTEN: cờ POSTBOOT_PASS #77 ghi (boot+22m52s, replay-day-du, poll=0)** |
| 08:48:35Z | Stats script chạy (`t5-stats-169.py` → `t5-stats-169-output.txt`); watcher-169: 9 dòng log, 4 poll; RAM MemAvailable 2.864.504 kB; X11: 3 socket X193/X194/X195 (mtime 08:49Z) |
| 08:55:22Z | **T5 chạy probe `dpkg --configure -a` (no-op, rc=0) — dpkg.log 1545 → 1546 dòng, md5 2e5743e3 → 89c179f0** (xem §3.5 — dòng này là của T5, KHÔNG phải replay; cờ #77 ghi "1545 dòng" vẫn đúng tại thời điểm ghi) |
| ~09:02Z | T5 viết LIMITS này. Watcher-169 vẫn ĐANG CHẠY (pid 25426, 31 poll lúc 09:01:52Z), dpkg ổn định 1546 dòng, 0 proc apt/dpkg |

Tuổi boot theo btime: #76: 3.089 s (51m29s, tính tới btime #77); #75: 7.177 s (1h59m37s).

---

## §2. Hướng (3) + marker + đồng hồ

Kiểm tra lại lúc stats 08:48:35Z trên #77 (`t5-stats-169.py` §8, khớp mẫu T5-168 §2):

- `systemctl is-active user@0` = **inactive**; `logind` = **inactive**; `dbus` = **inactive**.
- `loginctl show-user root` → **không nối được bus** (`Failed to connect to bus: No such file or directory` — như các đợt trước, logind chết, không có D-Bus system bus).
- `/var/lib/systemd/linger/` → **không tồn tại** → không user nào linger (phương pháp thay loginctl — F-168-T5-5).
- `ls /run/user/0` → **không tồn tại**.
- `crontab` → **không có lệnh** (`command not found` — không có cron).
- `systemctl list-timers --all` → 0 timer VCut (chỉ các timer hệ thống mặc định).

→ **Hướng (3) VẪN ĐỨNG lần thứ 16 liên tiếp** (quyết (j) đợt 168 ghi nhận lần thứ 15; T5-169 kiểm lại lần thứ 16, cùng kết quả). Không có bằng chứng nào cho hướng (1)/(2) (session sống / service giữ boot).

**Marker:** `~/.config/vcut-persistence-marker` CÒN, nội dung: written 2026-11-20T11:39:40Z, boot 2c0a7985 (reboot #48, btime 2026-11-20T11:26:05Z); mtime **2026-11-20 11:39:47Z không đổi** — sống qua **#49–#77 = 29 reboot** nếu #77 được xác nhận (77−49+1=29). T0-169 đếm độc lập. (Sống qua #76 chưa được đếm độc lập lúc đóng đợt 168 — nay marker vẫn còn trên #77, tức đã sống qua cả #76 lẫn #77 theo file; T0 xác nhận số đếm.)

**Đồng hồ:** 2 lần đo đồng thời lúc stats: CF 08:48:36 GMT vs local 08:48:35,271–35,921Z; CF 08:48:37 GMT vs local 08:48:35,921–36,556Z → **Cloudflare nhanh hơn local ~0,1–1,1 s** (local chậm hơn CF ~1 s). Lệch ≤1 s — cùng họ các đợt trước. Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn.

---

## §3. Watcher-169 + POSTBOOT_PASS

### §3.1 POSTBOOT_PASS #77 — ĐÃ CÓ (replay-day-du, poll=0)

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round169-t5/POSTBOOT_PASS` (315 B, mtime 08:46:44.794Z).
- **Nội dung (nguyên văn):** `boot c44cc3ba-f637-4c2a-88f7-c5dac53fe8a7 (btime 2026-11-22 08:23:52Z; watcher-169) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T08:46:44Z; POSTBOOT_PASS moi ghi 2026-11-22T08:46:44Z poll=0 (replay-day-du); co cu 576ca271 luu POSTBOOT_PASS-576ca271`
- **Backup cờ #75:** `POSTBOOT_PASS-576ca271` (324 B) — `diff` KHỚP file gốc round168-t5.
- **Diễn biến replay #77 (theo dõi trực tiếp + log watcher + history.log):**
  - Hoạt động dpkg đầu 08:35:40Z (boot+11m48s): 2 dòng `startup packages configure` — reconcile heal + replay heal (mỗi lần `dpkg --configure -a` ghi đúng 1 dòng — T5-169 đo trực tiếp, xem §3.5).
  - Transaction apt đầu 08:36:02Z; installs 08:36:03Z → 08:37:42Z (**~100 s, 50 transaction**, mỗi gói 1 transaction — chữ ký vòng lặp per-package, commandline mang DPkg::Post-Invoke recorder).
  - Breakdown dpkg 1545 dòng: **106 startup + 169 install + 1.040 status + 178 configure + 43 trigproc + 9 upgrade = 1.545** (so với #75-repair: 4 + 106 + 568 + 110 + 3 + 4 = 795 — khác hẳn: đây là replay đầy đủ, không phải repair).
  - Gói đầu cài: libaspell15 (08:36:03Z); gói cuối: gstreamer1.0-tools (08:37:42Z). 4 gói gstreamer đều có trong history.log (4 hit).
  - Cache 178 .deb (162.917.560 byte ≈ 155,4 MiB); lists 37 (azure 34 file, cogentco 0 — chỉ 1 mirror, giống #74; khác 75 của repair #75). GST thư mục thật 269 file = debroot 269.
  - Receipt `/var/lib/hatch-preflight/os-intent-replayed.sha256` ghi 08:37:43Z, hash `d3ef183d…` **= sha256 của ledger hiện tại** — pass sạch (failures=0).
  - Ledger: 1 dòng, compacted=true, ts 1795327298, added 170, removed 0 (đã compact từ #76 — xem §5.6).
- **Verify độc lập (T5, 08:44:22Z + watcher poll0 08:46:44Z):** postboot check-only **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269, thư mục thật** (log `t5-postboot-independent-c44cc3ba.log` + `t5-postboot-poll0-c44cc3ba.log`).
- **11 gói đã cài (kiểm bằng dpkg-query, stats §5):** libevent-2.1-7t64 2.1.12-stable-9ubuntu2.2, gstreamer1.0-plugins-base 1.24.2-1ubuntu0.7, gstreamer1.0-plugins-good 1.24.2-1ubuntu1.8, gstreamer1.0-plugins-bad 1.24.2-1ubuntu4, gstreamer1.0-plugins-ugly 1.24.1-1build1, gstreamer1.0-gl 1.24.2-1ubuntu0.7, gstreamer1.0-libav 1.24.1-1build1, gstreamer1.0-x 1.24.2-1ubuntu0.7, libavif16 1.0.4-1ubuntu3, libgstreamer1.0-0 1.24.2-1ubuntu0.2, libevdev2 1.13.1+dfsg-1build1 — **y hệt phiên bản trên #75 (repair) và cache #73**: candidate không đổi giữa các boot.
- **Độ phủ ledger:** dpkg-query theo tên literal: 169/170 — thiếu duy nhất `libevent-2.1-7` (tên cũ). Nhưng `libevent-2.1-7t64` có `Provides: libevent-2.1-7 (= 2.1.12-stable-9ubuntu2.2)` và `apt-get install -s libevent-2.1-7` trả exit 0 ("already the newest version") → **hiệu dụng 170/170, pass sạch, receipt được ghi** (xem §5.7). Stats script đếm literal nên ghi 169/170 — caveat đọc, không phải thiếu gói thật (F-169-T5-2).
- **Caveat dòng đầu log postboot (F-169-T5-3):** dòng tóm tắt đầu của script postboot mang thời gian + md5 CŨ (boot #41: 01:26:35Z/01:30:13Z, md5 51d12c3d) dù các con số khác (1545/169/9/178/269/37) trùng #77 — đó là ghi chú lịch sử gắn cứng trong script, KHÔNG phải số đo của boot này. Chỉ dùng các dòng verdict PASS + exit code + kiểm độc lập bằng dpkg-query (stats §5) làm bằng chứng. Không trích dòng đó cho thời gian/md5.

### §3.2 POSTBOOT_PASS #75 / #74 — VẪN CÓ, còn hiệu lực (theo dõi tiếp)

- Nội dung round168-t5/POSTBOOT_PASS (#75, mode repair-som-quyet-h, poll=1, ghi 06:01:38Z) và round167-t5/POSTBOOT_PASS (#74, replay-day-du, poll=0, ghi 04:10:23Z) không đổi; mtime không đổi.
- Backup `POSTBOOT_PASS-576ca271` trong round169-t5 `diff` KHỚP file gốc — cờ #75 được bảo toàn qua lần ghi cờ thứ ba.
- #70 (round166-t5) và #69 (round165-t5) cũng còn nguyên (kiểm lại bằng stats script §2c/§3b).

### §3.3 POSTBOOT_PASS #76 — KHÔNG CÓ, không bù được

- **#76 (f2b97695):** grep toàn bộ `POSTBOOT_PASS*` dưới `hidden_files/round*/` 0 kết quả. **Boot thứ 13 không có cờ.**
- Không bù được (cùng quy tắc #63/#66/#68/#71/#72/#73: cờ chỉ chứng nhận phép đo trực tiếp trên boot sống; #76 chết trước khi có phiên T5 nào).
- Đếm boot không cờ tới nay: #51, #53, #54, #55, #57, #60, #63, #66, #68 (9, theo T5-166) + #71 (10) + #72 (11) + #73 (12) + **#76 (13)**.

### §3.4 Watcher-168 — CHẾT theo #76 (xác minh đầy đủ từ log gốc)

**START 05:43:17Z, pid 13133, boot 576ca271; CHẾT theo reboot #76 (poll cuối 07:32:18Z, 5 s trước btime #76 07:32:23Z; `kill -0`: No such process — T5-169 xác minh lúc mở).** Log 198 dòng, **191 poll** (gaps {30 s ×178, 31 s ×11, 860 s ×1} — 860 s là cửa sổ repair), md5 {dbdf981a (2 dòng), b9d3accb (795 dòng)}, boot_set [576ca271], kinds {START: 1, MONITOR: 1, postboot: 1, FLAG-WRITTEN: 1}. **0 poll nào có proc apt/dpkg** (grep toàn log: 191/191 dòng poll đều `apt=[] apt2=[] dpkg=[]`). Đây là bằng chứng đầy đủ: **replay #75 KHÔNG chạy vòng lặp cài đặt trong toàn bộ ~1h49m quan sát (05:43:17Z→07:32:18Z)** — giả thuyết "replay #75 chạy muộn" (T5-168 §8.7) **BỊ BÁC**: nó không chạy dứt khoát trên #75, không phải chỉ muộn (xem §5).

### §3.5 Watcher-169 — 1 lần khởi động, đang chạy

**START 08:46:43Z, pid 25426, boot c44cc3ba**, cùng script `replay-watch-169.sh` (tạo bằng `make-watcher-169.py` từ nguồn 168 — xem §9 F-169-T5-1). Init: dpkg 1545 dòng md5 2e5743e3 mtime 08:37:42Z, cache 178, lists 37, gst_sys 269. Poll đều 30 s. **REPLAY_DONE + FLAG-WRITTEN ngay poll đầu (08:46:44Z, poll=0). Đang chạy lúc đóng LIMITS (ALIVE, kill -0 25426; 31 poll lúc 09:01:52Z).** Khoảng không-watcher: **4.465 s = 74m25s** (poll cuối watcher-168 07:32:18Z → START 08:46:43Z; tính từ btime #76 07:32:23Z là 4.460 s) — dài hơn 817 s đợt 168 vì #76 rơi vào khoảng không-watcher.

**Probe của T5 (ghi rõ để không ai đọc nhầm log):** lúc 08:55:22Z T5 chạy `dpkg --configure -a` (no-op, rc=0) để đo "1 lần heal ghi mấy dòng" → **dpkg.log 1545 → 1546 dòng, md5 2e5743e3 → 89c179f0** (dòng mới: `2026-11-22 08:55:22 startup packages configure`). Watcher log từ poll 08:55:47Z trở đi ghi dpkg 1546/md5 89c179f0 — đó là dòng probe của T5, KHÔNG phải replay chạy lại (0 proc apt/dpkg, cache/lists/GST không đổi). Cờ #77 ghi "1545 dòng" vẫn đúng tại thời điểm ghi (08:46:44Z).

**Generator `make-watcher-169.py`:** viết mới theo mẫu 168, header VIẾT MỚI hoàn toàn cho đợt 169; thay token đúng chuỗi trong nguồn (`replay-watch-168.log`→`replay-watch-169.log`, `round168-t5`→`round169-t5`, `round167-t5`→`round168-t5`, `REPLAY-WATCH-168`→`REPLAY-WATCH-169`, `watcher-168`→`watcher-169`, hạn cứng `2026-11-22 08:30:00`→`2026-11-22 11:30:00`, `han cung 08:30:00Z`→`han cung 11:30:00Z`); assert thêm (không còn `576ca271`/`05:32:46`/`2026-11-22 08:30`/`watcher-168`/`REPLAY-WATCH-168` trong thân; `LOG=$DIR/replay-watch-169.log`); `bash -n` OK; 2 chuỗi "H2" còn lại trong file đều ở header comment (từ chối giả thuyết H2 — hợp lệ, như đợt 168). Spawn bằng đường dẫn TUYỆT ĐỐI + nohup + disown (F-167-T5-2 đã sửa: không dùng `cd ... && ... &`).

---

## §4. Boot #77 + đồng hồ

### §4.1 Xác minh boot #77 (boot hiện tại)

- boot_id: `c44cc3ba-f637-4c2a-88f7-c5dac53fe8a7`; btime /proc/stat: **08:23:52Z (epoch 1795335832)**.
- Lúc mở ~08:41Z: uptime 17' → boot 08:23:52Z (khớp btime 0 s); /proc/1 mtime 08:24:03,99Z (+12 s); journal first entry 08:24:04Z (+12 s).
- Stats script 08:48:35Z: uptime 1.482,34 s → boot 08:23:52,66Z (chênh btime ~0,7 s — do làm tròn lúc đọc uptime, không phải lệch boot).
- `uptime -s` = 08:23:52Z — KHỚP btime.
- Boot #76: btime 07:32:23Z (epoch 1795332743 — tính từ btime #75 + gap 7.177 s đã quyết; đối chiếu `date -d` khớp); boot #75: btime 05:32:46Z (epoch 1795325566).
- **Gap #76→#77 = 3.089 s (51m29s)** — tính độc lập bằng 2 phương pháp: trừ epoch bằng python (1795335832−1795332743) + `date -d @<epoch>` đối chiếu từng btime (08:23:52Z − 07:32:23Z). Cả hai khớp.
- **Gap #75→#76 kiểm lại độc lập = 7.177 s (1h59m37s)** — KHỚP quyết parent (d) đợt 168.

### §4.2 Lệch khung giờ biên #76/#77 (số thô cho T2-169 — KHÔNG phán (m))

- Watcher-168 đã chết theo #76 (poll cuối 07:32:18Z, TRƯỚC btime #76 5 s) → **không có poll watcher nào sau btime #76**; watcher-169 khởi động sau btime #77 (08:46:43Z) → **không có poll watcher nào kẹp giữa btime #76 và #77**; không đo được lệch khung kiểu "poll cuối sau btime" như biên #70/#71 (20 s) hay #73/#74 (12 s).
- Các mốc khung mới đều sau btime, cùng chiều, không mâu thuẫn: /proc/1 +12 s; journal first entry +12 s.
- Reboot thật ∈ (07:32:18Z, 08:46:43Z] theo watcher (poll cuối #75 → poll đầu #77); btime neo #76 07:32:23Z, #77 08:23:52Z.
- Requeue run 168/169 tại #77 + offset (m) thuộc T7-169/T2-169 (T5 chưa có số — KHÔNG tự tính offset). **(m) #76 parent đã quyết KHÔNG PHẢI ĐIỂM (quyết (e) đợt 168) — T2-169 chỉ ghi chú tham chiếu, không mở lại phân loại.**

### §4.3 Lists #77 = 37 (chỉ mirror azure) — khác mẫu 75 của repair #75

- Lists lúc mở: 37 — gồm `azure.archive.ubuntu.com_*` (34 file), **cogentco 0 file** (ubuntu.sources liệt kê 2 URI: azure + mirror.cogentco.com, như #75). #74 lists 37 (1 mirror); #75 sau repair update: 75 (2 mirror).
- **Không file lists nào được tải lại trên #77**: các InRelease/Packages mang mtime cũ (noble-updates 05:53:34Z ngày 22/11 — từ update của repair #75; noble-backports 21/11 09:54Z; noble-security 21/11 09:52Z; noble 25/04/2024 — image build). Chỉ lock (08:35:42Z), auxfiles (08:35:42Z), partial/ (08:36:00Z) chạm giờ #77 (apt chạy lần đầu: build cache + transaction đầu 08:36:02Z) — không có file index mới.
- Ghi nhận khác biệt, không suy nguyên nhân (có thể update lazy của vòng lặp chạy dạng all-Hit nên không tải gì, hoặc vòng lặp toàn cache-hit nên không update — bằng chứng trong cell không phân biệt được hai khả năng này).
- Proxy egress: `http://hatch-egress-proxy:3128` (cả http/https — `/etc/apt/apt.conf.d/80hatch-egress-proxy`).

---

## §5. ĐIỀU TRA NỢ MỚI ĐỢT 169: vì sao replay #75 không chạy

Đây là nợ mở mới của đợt 169 (khác điều tra #73 đã đóng ở quyết (j) đợt 168). T5-169 đã đọc lại source driver replay (host-side) + chạy thử live trên #77 + đối chiếu #76/#77.

### §5.1 Cơ chế replay — ĐỌC LẠI TỪ SOURCE, CHỈNH T5-168 §5.1

Driver: `/opt/hatch/runtime-cell/hatch-preflight-opportunistic` (1.142 dòng); helper `/opt/hatch/runtime-cell/os-intent-ledger.py` (283 dòng). Thứ tự thật mỗi boot (khác thứ tự T5-168 liệt kê ở 2 điểm — xem đính chính cuối mục):

1. Chờ cell ready (leader pid + ready file, tối đa 20 s) → kiểm entry policy → snapshot ledger (one-open, O_NOFOLLOW, bound 16 MiB; hash sha256 sidecar) → quyết backoff (state host-side `/var/lib/hatch/os-intent-backoff`).
2. **Snapshot reset** trong cell (reseed `dpkg-state.txt` dưới frontend lock, tối đa 120 s) — chạy TRƯỚC reconcile.
3. **Reconcile** trong cell: `dpkg --configure -a` (heal, output bỏ đi) → `hatch-manifest maybe-apply` (manifest không đổi → thoát ~1 ms; đổi → apt delta). **2 dòng dpkg.log đầu trên #75 (05:33:26Z) là heal của reconcile — và mỗi lần heal ghi ĐÚNG 1 dòng (T5-169 đo trực tiếp §3.5), nên 2 dòng = 2 lần heal: reconcile + replay (xem §5.2).**
4. Re-snapshot ledger → kiểm backoff lần nữa → `replay_os_intent_ledger`:
   - Fold (python): last-wins theo thứ tự, in `install …` / `remove …`; từ chối lặng (fold_rc=2, return 0, KHÔNG compact, KHÔNG vòng lặp) chỉ khi 1 record > MAX_RECORD_BYTES hoặc số tên gói phân biệt > MAX_PACKAGE_NAMES.
   - Receipt fast-path: receipt trong cell (`/var/lib/hatch-preflight/os-intent-replayed.sha256`, sha256 của ledger) khớp hash snapshot → bỏ qua toàn bộ replay (return 0, TRƯỚC compact).
   - Compact: ghi đè ledger bằng 1 entry fold; rc=20 = đã compact sẵn (KHÔNG ghi lại — `cmp` khớp thì return); rc=0 = đã compact (ghi lại); rc=5 = không lấy được frontend lock (bỏ qua, best-effort); rc=10 = compact nhưng có entry mới append (không receipt).
   - Nếu không còn delta → compact + return 0.
   - Payload trong cell (1 nsenter): snapshot reset → `dpkg --configure -a` (heal) → `reseed_dpkg_state` → **vòng lặp per-package** (theo thứ tự ledger): `dpkg-query` status (đã cài thì bỏ qua); thử `apt-get install -y --no-download --no-install-recommends` (cache-first, output bỏ đi); nếu fail thì lazy `apt-get update` MỘT lần duy nhất trong pass, rồi `apt-get install -y --no-install-recommends` (có tải); nếu vẫn fail thì **đếm failures++, log "FAILED to install … (best-effort; continuing)" và ĐI TIẾP**.
   - Cuối payload: `reseed_dpkg_state` + **`apt-get autoclean -y`** (chạy CẢ KHI có failures); failures > 0 → exit 1 → **receipt bị giữ lại**.
   - Sau payload: compact lại; nếu compact_rc=0 thì tính lại hash; nếu replay_rc≠0 → return 1 (không receipt); nếu sạch → **ghi receipt** (hash ledger) vào trong cell.
5. **Backoff:** `BACKOFF_LIMIT=5` pass fail liên tiếp với inputs giống hệt nhau (cùng ledger hash + manifest hash) VÀ residue (gói còn thiếu) là tập con của record fail trước đó thì bỏ qua các bước apt. **QUAN TRỌNG: backoff guard CẢ reconcile lẫn replay** (`if backoff_engaged: skip reconcile; skip replay`) — nếu backoff engage thì dpkg.log sẽ có 0 dòng, không phải 2 dòng. State ở host, không nhìn thấy từ trong cell. Bất kỳ bước probe nào fail → fail-open (replay, reset strike).
6. **Strike accounting:** pass sạch (reconcile rc=0 VÀ replay rc=0) → xóa strike; pass fail → +1 strike với đúng inputs đó + residue lúc đó.
7. Recorder: `/usr/local/sbin/hatch-apt-intent-record` (hook `DPkg::Post-Invoke`): snapshot `dpkg-query -W`, append delta; **trong lúc replay bị silence** (`HATCH_OS_INTENT_DIR=/proc/…`, exit 0 lặng) nên installs của replay KHÔNG append lại ledger; mỗi apt run của replay mang `reseed_hook` (reseed trong lock của chính nó).

**Đính chính T5-168 §5.1 (F-169-T5-4):** (i) T5-168 liệt kê "compact (bước 3) → reconcile maybe-apply (bước 4)" — **sai thứ tự thật**: reconcile chạy TRƯỚC replay, còn compact nằm TRONG replay (trước vòng lặp và sau payload). (ii) T5-168 không ghi rằng backoff guard cả reconcile — điểm này quyết định việc loại trừ backoff cho #75 (xem §5.3). Nội dung còn lại của §5.1 đợt 168 (ledger, per-package loop, cache-first, fail-open, autoclean, backoff 5 strike) KHỚP source.

### §5.2 #75: driver chạy tới đâu — bằng chứng

- **Driver ĐÃ chạy trên #75:** 2 dòng dpkg.log lúc 05:33:26Z (boot+40s). Mỗi heal = 1 dòng (§3.5) → 2 dòng = heal reconcile + heal replay (cùng giây — reconcile ~ms, re-snapshot/fold/receipt-check/compact đều nhanh vì ledger đã compact sẵn rc=20, snapshot reset ~1 s; dồn trong cùng 1 giây là chật nhưng khả thi; KHÔNG loại trừ khả năng dòng thứ 2 là heal nội bộ của maybe-apply — xem §5.4).
- **Vòng lặp KHÔNG chạy:** 191 poll watcher-168 / ~1h49m, 0 proc apt/dpkg; dpkg.log đứng 2 dòng tới khi repair (05:47:48Z); history.log trước repair: 0 transaction (T5-168 stats §12: chỉ 1 transaction — của repair).
- **Ledger KHÔNG compact lại trên #75:** lúc 06:04Z vẫn 2 dòng — nhưng dòng 1 VỐN đã là entry compacted (ts 1795251569, 170 gói) nên compact rc=20 là no-op dù có chạy — **ledger không cho tín hiệu phân biệt** (khác #76 — xem §5.6).
- **Cache 0 từ lúc mở (05:39:19Z) tới khi repair** (T5-168 + watcher-168 đo độc lập) — xem §5.5.

### §5.3 #75: đã LOẠI TRỪ được gì (bằng chứng, không suy đoán)

- **(a) Backoff: LOẠI — 2 lý do độc lập.** (i) Backoff guard CẢ reconcile: nếu engage thì dpkg.log có 0 dòng; #75 có 2 dòng (reconcile đã chạy) → backoff KHÔNG engage lúc đó. (ii) Số strike tối đa: #73 fail (1 strike) → #74: nếu sạch thì xóa về 0, nếu fail thì lên 2 — tối đa 2 strike lúc #75 mở, xa ngưỡng 5. (T5-168 đã loại bằng (ii); nay thêm (i) là chứng cứ trực tiếp.)
- **(b) Receipt fast-path skip: LOẠI — chứng cứ từ #77.** Receipt nằm trong cell rootfs (`/var/lib/hatch-preflight/`): trên #77, thư mục này có mtime 08:37Z (được TẠO lúc ghi receipt 08:37:43Z) → trước đó không tồn tại → receipt KHÔNG sống qua reboot. Cùng cơ chế, #74 không thể để lại receipt khớp cho #75 (ledger #75 lúc mở = 1 dòng compacted ts 1795251569 — receipt #74 nếu có cũng cùng hash đó — nhưng file đã bị xóa theo rootfs). Receipt-skip đòi receipt tồn tại + khớp hash; file không tồn tại → không skip được.
- **(c) Fold từ chối (fold_rc=2, skip lặng): LOẠI.** Fold chỉ exit 2 khi 1 record > MAX_RECORD_BYTES hoặc tên gói phân biệt > MAX_PACKAGE_NAMES. Ledger #75: 1 dòng ~2 KB, 170 tên — xa ngưỡng. Cùng ledger (dạng 2 dòng, gồm cả dòng repair) đã fold THÀNH CÔNG trên #76 (compact 07:36:32Z đòi fold viết `ledger.compacted` trước) và trên #77 (pass chạy đủ 170 gói).
- **(d) Gói / version-drift / mirror thiếu gói: LOẠI.** #77 cài đủ 170 intent (gồm cả 4 gói gstreamer) từ cùng cache + cùng mirror, 100 s, failures=0, phiên bản y hệt #75 (xem §3.1). Gói không phải nguyên nhân.
- **(e) Cache trống (0 .deb lúc mở #75): LOẠI làm nguyên nhân vòng lặp vắng.** Vòng lặp là cache-first CÓ fallback tải (lazy update + download-install); cache trống chỉ làm nó chậm (như #73: 7–17 phút/gói) chứ không bỏ qua vòng lặp. #73 chạy với cache lạnh; #77 chạy với cache ấm — cả hai đều chạy.
- **(f) Tranh lock dpkg: LOẠI làm nguyên nhân vắng.** Lock chỉ làm apt chờ tối đa 120 s rồi fail (và vẫn HIỆN proc apt trong lúc chờ); 191 poll 0 proc → vòng lặp không spawn apt lần nào. Lock không xóa được proc.
- **(g) "Replay #75 chạy muộn": BÁC (xem §3.4).** 191 poll / 1h49m, 0 proc, dpkg đứng yên — không phải muộn, là vắng hẳn trong toàn bộ đời boot #75 (tới btime #76).
- **(h) Unit preflight không chạy: LOẠI.** 2 dòng dpkg 05:33:26Z chứng minh driver chạy tới reconcile (so sánh: #77 không có dòng dpkg nào trước 08:35:40Z — nếu cell tự chạy `dpkg --configure -a` lúc boot thì #77 đã có dòng lúc boot+40s; nó không có).

### §5.4 #75: còn lại gì — CHƯA XÁC ĐỊNH (cần bằng chứng host-side)

Sau khi loại trừ §5.3, đoạn driver giữa **reconcile xong (05:33:26Z) và vòng lặp** chỉ còn 2 ứng viên — cả hai đều lặng trong cell, chỉ journal host-side của unit `hatch-preflight-opportunistic` trên boot #75 mới phân biệt được:

- **(i) Pass chết/lỗi lặng ở đoạn host-side** (re-snapshot, fold, receipt-check, compact, hoặc spawn/feed payload qua nsenter): unit exit 0 theo contract opportunistic, lỗi chỉ ghi vào journal host — trong cell không có dấu vết. Khả thi vì mọi bước này đều best-effort + fail-open + log host-side.
- **(ii) Payload chạy nhưng feed vòng lặp rỗng/hỏng** (chuỗi `verb pkg` không tới được `while read`): vòng lặp đọc EOF ngay → 0 install, 0 proc, failures=0 → reseed → autoclean → exit 0 → receipt ghi (bị xóa theo boot, không kiểm lại được) → compact rc=20 no-op. **Ứng viên này GIẢI THÍCH ĐƯỢC cả cache 178→0** (xem §5.5) — nhưng vẫn là giả thuyết, chưa có bằng chứng trực tiếp nào cho feed rỗng.
- **Không phân biệt được (i)/(ii) từ trong cell.** Journal host của boot #75 (unit preflight + cell entry policy + ready-file) là bằng chứng duy nhất còn có thể quyết định — T5 trong cell không đọc được (journal cell chỉ giữ boot hiện tại; host journal không mount vào cell). **Đề xuất: leo thang lên parent để kiểm host-side (journal unit preflight boot #75/#76 + RV snapshot/restore log); KHÔNG điều tra tiếp từ trong cell** — cùng họ quyết đóng điều tra #73 ở mức chưa xác định (quyết (j) đợt 168): bằng chứng gốc trong cell đã hết.
- Lưu ý: dòng dpkg thứ 2 (05:33:26Z) chưa đủ để khẳng định payload đã chạy — nó cũng có thể là heal nội bộ của maybe-apply. Nếu dòng 2 KHÔNG phải heal replay thì ứng viên (i) hẹp lại thành "chết giữa reconcile và payload"; nếu dòng 2 LÀ heal replay thì ứng viên (ii) mạnh lên. Không phân biệt được từ trong cell — ghi rõ, không chọn.

### §5.5 Cache 178 → 0 → 178: bằng chứng mới + giả thuyết mạnh nhất (CHƯA CHỨNG MINH)

- **Bằng chứng mới trên #77:** toàn bộ 178 .deb trong cache đều có mtime ≤ 2026-11-18 16:22:47Z (cũ nhất 2021-01-02) — **không file nào được tải về trên #74/#75/#76/#77**. 110 .deb repair #75 tải về (06:01Z) đã biến mất hoàn toàn. Cache hiện tại = đúng tập file cũ (178 file, 162.917.560 byte).
- **Suy ra:** tập 178 file KHÔNG bị tải lại sau #75 — chúng được KHÔI PHỤC với mtime gốc (khôi phục snapshot mới giữ được mtime; tải lại thì mtime sẽ là Nov 22). Cơ chế khôi phục duy nhất hợp lý từ host-side là snapshot/restore của RV subvol `/data/apt-archives` lúc cell start — **chưa kiểm chứng được từ trong cell**.
- **Cơ chế xóa trên #75 (giả thuyết mạnh nhất, CHƯA chứng minh): `apt-get autoclean` cuối payload với lists chỉ có base.** Nếu payload chạy tới cuối (ứng viên (ii) §5.4), autoclean chạy khi lists chỉ có 5 file base (cli.github + cloudflare, KHÔNG có ubuntu index) → toàn bộ 178 .deb ubuntu bị coi là "không tải lại được" → **xóa sạch**. Khớp thời gian: cache 178 lúc 05:29:40Z (#74) → 0 lúc 05:39:19Z (#75 mở); driver chạy 05:33:26Z trong cửa sổ đó. Autoclean không ghi dpkg.log (chỉ xóa file) nên dpkg.log đứng 2 dòng — khớp quan sát.
- **Mâu thuẫn chưa giải:** T5-168 §5.4 ghi `partial/` mtime 04:09Z (từ #74) + `lock` mtime Nov 6 VẪN CÒN trên #75 — tức thư mục RV vẫn nhìn thấy được trên #75 (không phải unmount lộ tmpfs trống). Nếu autoclean xóa từ RV thì file mất hẳn — và snapshot restore sau đó hồi lại đúng tập cũ. Chuỗi này liền mạch NHƯNG bước restore chưa có bằng chứng trực tiếp. **Ghi CHƯA XÁC ĐỊNH, không suy đoán thêm.** Nợ §5.4 LIMITS T5-168 (cơ chế xóa CHƯA XÁC ĐỊNH) thu hẹp thành giả thuyết trên + cần log host-side.
- **Mount stack (đo lại trên #77):** `/var/cache/apt/archives` có 2 lớp: tmpfs (dưới, size 1.624.980k) + `/dev/mapper/rv` btrfs subvol=/data (trên — lớp nhìn thấy). T5-168 đã ghi thứ tự này; T5-169 xác nhận lại. Lớp tmpfs trống giải thích được "cache 0 nếu RV không mount" — nhưng partial//lock còn trên #75 bác khả năng unmount đơn thuần (xem trên).

### §5.6 Bằng chứng #76: driver CÓ chạy (đối chứng giữa #75 và #77)

- **Ledger compact lúc 07:36:32Z (boot #76 +4m09s):** file `ledger.jsonl` hiện tại chỉ còn 1 dòng (compacted=true, ts 1795327298, added 170) với **mtime 2026-11-22 07:36:32Z** — lần ghi cuối nằm trong cửa sổ boot #76 (07:32:23–08:23:52Z). Compact đòi fold thành công trước (viết `ledger.compacted`) rồi so sánh + ghi đè dưới frontend lock → **driver #76 đã chạy qua snapshot → fold → compact**. Trên #77 compact là no-op (rc=20, `cmp` khớp, không ghi lại) nên mtime giữ nguyên 07:36:32Z.
- **archives/partial/ mtime 07:36Z (trống):** có hoạt động tạo/xóa entry trong thư mục staging tải .deb lúc ~07:36Z trên #76 — tức apt đã chạy trên #76 quanh thời điểm compact (tải thử 1 .deb rồi dọn, hoặc file tạm). Không có .deb mtime Nov 22 nào tồn tại → lần tải đó (nếu có) đã fail và được dọn, hoặc chỉ là file tạm — không kết luận được gói nào.
- **Kết luận phần này:** driver KHÔNG chết hệ thống — nó chạy tới compact trên #76 và chạy đủ pass trên #77; chỉ #75 là vắng vòng lặp. Lỗi #75 là nhất thời (transient), không phải lỗi hệ thống của driver. **Vòng lặp #76 có chạy xong không thì KHÔNG BIẾT** (dpkg.log #76 mất theo reboot; không receipt nào sống qua boot để đối chiếu) — ghi rõ, không suy đoán.

### §5.7 Ghi chú: libevent-2.1-7 (tên cũ) — KHÔNG phải gói thiếu

- Ledger chứa `libevent-2.1-7` (tên tiền-t64); gói này không còn tồn tại độc lập trên noble (`apt-cache policy`: Installed (none), Candidate (none)).
- `libevent-2.1-7t64` (đã cài 2.1.12-stable-9ubuntu2.2) có `Provides: libevent-2.1-7 (= 2.1.12-stable-9ubuntu2.2)` + `Replaces`/`Breaks` tương ứng → `apt-get install libevent-2.1-7` (kể cả `--no-download`) resolve về provider đã cài → exit 0, không tính failure. Mô phỏng `apt-get install -s` exit 0, "already the newest version".
- Vì vậy receipt #77 được ghi (failures=0) dù đếm literal là 169/170. **Độ phủ hiệu dụng 170/170.** Stats script các đợt sau nên resolve qua Provides (hoặc `apt-get install -s`) thay vì `dpkg-query` literal cho tên gói cũ (F-169-T5-2).

---

## §6. Quy tắc đứng (3)

(Trích từ LIMITS các đợt trước — giữ nguyên, không đổi.)

1. **Cờ POSTBOOT_PASS chỉ chứng nhận phép đo trực tiếp trên boot sống.** Boot đã chết trước khi có phiên T5 thì KHÔNG bù được (áp dụng #76 đợt này; #71/#72/#73 trước đó).
2. **Watcher chết theo reboot là bình thường** — watcher là tiến trình trong cell, không sống qua reboot. Khoảng không-watcher được đo và ghi (đợt này: 4.465 s).
3. **Hướng (3) đứng:** không có bằng chứng session/service nào giữ boot sống qua reboot (kiểm lại lần thứ 16 đợt này — xem §2).
4. **Khung giờ boot cũ = XÁC NHẬN OVERLAP, không đổi verdict (m)** (quyết (e) đợt 166). T5 chỉ đo số thô tại biên reboot, giao T2 đối chiếu.
5. **Không kết luận nguyên nhân khi chưa có bằng chứng trực tiếp** (áp dụng cho replay #75 — xem §5.4; và cache 178→0→178 — xem §5.5).
6. **Chỉ stage, KHÔNG PUSH** — user tự push sau từ main chat.

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM (stats 08:48:35Z, boot #77):** MemTotal 8.124.900 kB; MemAvailable 2.864.504 kB; MemFree 1.238.824 kB; loadavg 7,04 (nhất thời — stats script đang chạy vòng dpkg-query 170 gói + curl; load 15' là 2,13). (T9 đo headroom chính thức — T5 chỉ ghi snapshot.)

**ENOSPC (T9 đếm chính thức; T5 chỉ ghi snapshot):**
- #77: **9 dòng lúc 08:48:35Z** (journal 135 dòng, dòng đầu 08:37:11Z = boot+13m19s, từ `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`).

**X11:**
- TRỐNG lúc mở #77 (~08:41Z); 0 Xvfb thật (`pgrep -x Xvfb` exit 1).
- Lúc stats 08:48:35Z: **3 socket X193/X194/X195 mới, mtime 08:49Z, 0 Xvfb thật** — xuất hiện trong phiên #77. Cùng mẫu các đợt trước (3 socket X193/X194/X195 mtime 05:45Z/06:02Z đợt 168; 23:44Z đợt 166) — **giao T8-169 dọn**. Lúc viết LIMITS (~09:02Z) vẫn 3 socket.

**Journal:** #77: idx 0 duy nhất; 105 dòng lúc 08:41:52Z; 135 dòng lúc 08:48:35Z, dòng đầu 08:24:04Z. Không có OOM/killed process trên #77 (chưa grep toàn bộ — T9 kiểm chính thức; T5 chỉ ghi snapshot).

---

## §8. Nợ mở chuyển đợt 170 (T5-170 sở hữu)

1. **Watcher-169 (pid 25426) tiếp tục giám sát tới 11:30:00Z 22/11** — T5-170 kiểm tra log cuối + poll cuối + END line (hoặc chết theo reboot mới). Nếu replay chạy lại sau khi T5-169 đóng (dpkg tăng từ 1546), watcher log sẽ ghi lại — T5-170 diễn giải (lưu ý dòng probe 08:55:22Z của T5-169, xem §3.5).
2. **POSTBOOT_PASS #76 KHÔNG CÓ** (boot thứ 13 lọt, không bù được); #68/#63/#66 vẫn không có. **#77 ĐÃ CÓ (replay-day-du, poll=0)** — theo dõi tiếp; cờ repair #75 vẫn giữ nguyên (không ghi lại cờ replay).
3. **Marker 29 reboot #49–#77** (nếu #77 được xác nhận; T0 đếm độc lập).
4. **Caveat khung giờ #70/#71 (20 s) + #73/#74 (12 s)** giao T2-169 đối chiếu; biên #76/#77 không có poll sau btime (xem §4.2); (m) #76 parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM — T2-169 chỉ ghi chú tham chiếu; (m) #74 DƯƠNG đã CHẤP NHẬN; (m) #56 vẫn có điều kiện (T2-169 lần 12).
5. **Nguyên nhân replay #75 không chạy: CHƯA XÁC ĐỊNH (đã thu hẹp tối đa từ trong cell — xem §5.4).** Cần journal host-side của unit preflight boot #75 (+ #76) để quyết định giữa "chết lặng đoạn host-side" và "payload feed rỗng". Đề xuất leo thang host-side, không điều tra tiếp từ trong cell.
6. **Cache 178 → 0 → 178: cơ chế xóa + khôi phục CHƯA XÁC ĐỊNH** (giả thuyết mạnh nhất: autoclean cuối payload với lists base-only + snapshot restore hồi lại — xem §5.5); cần log host-side (RV snapshot/restore).
7. **Replay #77 chạy muộn (boot+11m48s mới có hoạt động dpkg đầu):** muộn hơn #74 (boot+49s) và #75 (boot+40s) rất nhiều — driver host-side start trễ là bình thường (chạy sau khi cell READY, song song daemon); ghi nhận, không điều tra (pass vẫn xong trong 100 s).
8. **Guard symlink GST:** không kích hoạt đợt này (không repair nào chạy — dpkg 1545 > 100 từ đầu). Bài học F-168-T5-2 vẫn đứng cho boot mới trong phiên watcher-169 nếu early-repair kích hoạt: T5-170 gỡ symlink tay trước khi install nếu replay bắt đầu sau repair.
9. TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet.
10. G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời — để yên, không nhắc lại). R9 (a) vẫn chờ user (số đếm vẫn là 16).

---

## §9. Đề xuất cho parent

- **(a) Chấp nhận kết quả T5-169:** cờ #77 (replay-day-du, poll=0, verify độc lập exit 0); #76 không cờ, không bù được; #75/#74 còn hiệu lực; watcher-169 đang chạy; hướng (3) lần thứ 16; marker 29 reboot (chờ T0 xác nhận); gap #76→#77 = 3.089 s.
- **(b) Cờ #77 replay-day-du (không phải repair) có được tính là POSTBOOT_PASS đủ điều kiện cho gate (a) của T4/T8 không?** Đây là cờ replay đầy đủ đầu tiên kể từ #74 (pass sạch, receipt khớp ledger, 170/170 hiệu dụng) — T5 đề xuất: cờ ĐỨNG cho gate (a) không caveat mode repair (khác #75). T5 không phán gate — parent quyết.
- **(c) Số hiệu #77 (dự kiến):** xác nhận khi T0-169 hoàn tất xác minh 9 nguồn (đặc biệt btime 08:23:52Z và boot_id c44cc3ba).
- **(d) Điều tra replay #75 không chạy:** T5-169 đã đọc lại source driver + đối chiếu #76/#77 — kết luận: nguyên nhân CHƯA XÁC ĐỊNH nhưng đã loại trừ backoff / receipt-skip / fold / gói / cache-trống / lock / "chạy muộn" (xem §5.3); còn 2 ứng viên host-side (§5.4). Đề xuất: **leo thang kiểm host-side** (journal unit `hatch-preflight-opportunistic` boot #75 + #76, log RV snapshot/restore) thay vì điều tra tiếp từ trong cell — bằng chứng trong cell đã hết, cùng họ quyết đóng #73 ở mức chưa xác định.
- **(e) Cache 178 → 0 → 178:** ghi nhận giả thuyết autoclean + snapshot restore (xem §5.5) ở mức CHƯA CHỨNG MINH; không đổi quy trình T5.
- **(f) X11 X193/X194/X195 (08:49Z):** giao T8-169 dọn theo mẫu các đợt trước.

---

## §10. Sai số của chính T5-169 (ghi để đợt sau khỏi lặp)

- **F-169-T5-1 — Header watcher + generator: 2 chuỗi "H2" còn trong file script mới (ĐÃ KIỂM, hợp lệ):** tất cả đều ở header comment (từ chối giả thuyết H2 về OVERLAP #62 — "H1/H2 ĐỀU BỊ BÁC", "KHÔNG thừa nhận giả thuyết H2"). Assert của generator chỉ kiểm THÂN script (sau `DIR=`), không kiểm header — đúng thiết kế (header cố tình nhắc). Đã kiểm từng dòng bằng grep trước khi spawn. Cùng mẫu F-168-T5-6.
- **F-169-T5-2 — Stats script §5 đếm độ phủ ledger bằng tên literal (caveat đọc, không phải sai số đo):** `dpkg-query` cho `libevent-2.1-7` trả not-installed → script ghi "thiếu 1/170". Thực tế gói được thỏa qua `Provides` của `libevent-2.1-7t64` (mô phỏng `apt-get install -s` exit 0) → hiệu dụng 170/170, receipt được ghi. Các đợt sau: resolve tên cũ qua Provides/`apt-get install -s` thay vì dpkg-query literal.
- **F-169-T5-3 — Dòng tóm tắt đầu của script postboot mang thời gian + md5 cũ (caveat đọc, không phải sai số đo):** dòng đầu log `t5-postboot-independent-c44cc3ba.log` ghi thời gian 01:26:35Z/01:30:13Z + md5 51d12c3d (của boot #41) dù các con số khác trùng #77 — đó là ghi chú lịch sử gắn cứng trong script. Chỉ dùng các dòng verdict PASS + exit code + kiểm độc lập bằng dpkg-query làm bằng chứng; không trích dòng đó cho thời gian/md5. (T5-168 không gặp vì log của họ không lộ dòng này ra ngoài — thực ra log poll0/repair của đợt 168 cũng có cùng dạng dòng đầu; T5-169 ghi rõ để đợt sau khỏi nhầm.)
- **F-169-T5-4 — Đính chính thứ tự cơ chế replay trong LIMITS T5-168 §5.1 (KHÔNG phải lỗi của T5-169, là đính chính):** T5-168 liệt kê compact (bước 3) trước reconcile/maybe-apply (bước 4) — **sai thứ tự thật**: reconcile chạy TRƯỚC replay; compact nằm TRONG replay (trước vòng lặp và sau payload). T5-168 cũng không ghi backoff guard cả reconcile — điểm này quyết định việc loại trừ backoff cho #75. T5-169 đã đọc lại source (1.142 dòng driver + 283 dòng helper) và viết lại §5.1 cho đúng.
- **F-169-T5-5 — Probe `dpkg --configure -a` làm dpkg.log tăng 1 dòng SAU khi cờ đã ghi (ĐÃ GHI RÕ, không giấu):** T5 chạy probe lúc 08:55:22Z để đo "1 heal = mấy dòng" → dpkg.log 1545 → 1546, md5 2e5743e3 → 89c179f0. Cờ #77 ghi "1545 dòng" vẫn đúng tại thời điểm ghi (08:46:44Z). Watcher log từ poll 08:55:47Z ghi dpkg 1546 — T5-170/T10 đọc log phải biết dòng này là probe của T5-169, không phải replay chạy lại (0 proc, cache/lists/GST không đổi). Bài học: probe thay đổi file đo thì làm TRƯỚC khi ghi cờ, hoặc ghi chú ngay trong log watcher — đợt này đã ghi chú trong LIMITS §3.5.
- **F-169-T5-6 — Header watcher-169 ban đầu ghi "/proc/1 mtime +~11 s" theo ước lượng (ĐÃ SỬA trước khi spawn):** lúc viết generator, T5 chưa đo /proc/1 mtime mà ghi "~11 s" theo mẫu đợt trước. Đo thật sau đó: +12 s (08:24:03,99Z). Đã sửa cả `.py` lẫn `.sh` trước khi spawn watcher. Bài học: không ghi số đo vào header khi chưa đo — đo trước, viết sau.

---

## §11. Batch stage

- **File stage:** `~/workspace/repo-1/docs/PHASE9_ROUND169_T5_INFRA_LIMITS.md` (file này).
- **Paths file:** `~/workspace/repo-1-push/paths-loop/phase9-round169-t5-infra.txt` (NUL-delimited, 1 entry — chỉ file text, KHÔNG binary).
- **Verify:** read-back bằng `od -c` sau khi stage (theo mẫu T5-166/T5-167/T5-168).
- **KHÔNG PUSH** — user tự push sau từ main chat.
- Các file làm việc trong `round169-t5/` (watcher script/log, stats script/output, postboot log, cờ POSTBOOT_PASS + backup, watcher-status-at-open) KHÔNG stage đợt này (theo mẫu T5-168: chỉ stage LIMITS); chúng nằm trên đĩa để T10/parent đối chiếu.

---

## Phụ lục A — Trích stats output (`t5-stats-169-output.txt`, chạy 08:48:35Z)

```
--- 1. boot id + uptime ---
boot_id=c44cc3ba-f637-4c2a-88f7-c5dac53fe8a7
btime=1795335832 (2026-11-22 08:23:52 UTC)
uptime=1482.34 (boot 2026-11-22 08:23:52.66 UTC)
clock: local_truoc=08:48:35.271Z CF=Sat, 22 Nov 2026 08:48:36 GMT local_sau=08:48:35.921Z (lan 2 tuong tu)
--- 2a. marker ---
marker_mtime=2026-11-20 11:39:47.000000000 +0000
--- 2b. grep POSTBOOT_PASS (tat ca round) ---
#c44cc3ba: round169-t5/POSTBOOT_PASS
#f2b97695 (#76): 0 ket qua — KHONG CO
#576ca271: round168-t5/POSTBOOT_PASS, round169-t5/POSTBOOT_PASS-576ca271 (+ round169-t5/POSTBOOT_PASS theo noi dung 'co cu')
#194efd93: round167-t5/POSTBOOT_PASS, round168-t5/POSTBOOT_PASS-194efd93 (+ round169-t5/POSTBOOT_PASS-576ca271 theo noi dung 'co cu')
#b643911f (#73): 0 ket qua — KHONG CO
#9e089ef6 (#72): 0 ket qua — KHONG CO
#ea73ac4f (#71): 0 ket qua — KHONG CO
#0c8a94aa (#68): 0 ket qua — KHONG CO
--- 3. round169-t5/POSTBOOT_PASS (#77, xac minh lai) ---
boot c44cc3ba-f637-4c2a-88f7-c5dac53fe8a7 (btime 2026-11-22 08:23:52Z; watcher-169) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T08:46:44Z; POSTBOOT_PASS moi ghi 2026-11-22T08:46:44Z poll=0 (replay-day-du); co cu 576ca271 luu POSTBOOT_PASS-576ca271
mtime: 2026-11-22 08:46:44.794Z
gst_sys_files=269
apt_procs= (trong)
watcher169_ps=25426 bash .../replay-watch-169.sh (ALIVE)
watcher168_pid13133_kill0=DEAD
--- 5. kiem tra goi postboot #77 + ledger ---
11/11 goi da cai (bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1); 5/5 lib; GST 269 = debroot 269
ledger literal 169/170, thieu ['libevent-2.1-7'] — nhung Provides cua libevent-2.1-7t64 thoa man (apt-get install -s exit 0) → hieu dung 170/170 (F-169-T5-2)
--- 6. ENOSPC ---
#77: 9 dong (journal 135 dong, dong dau 08:37:11Z)
--- 7. RAM / load ---
MemTotal 8124900 kB; MemAvailable 2864504 kB; MemFree 1238824 kB; loadavg 7.04
--- 8. systemd (huong 3) ---
user@0 inactive; logind inactive; dbus inactive; loginctl khong noi duoc bus; /var/lib/systemd/linger KHONG TON TAI; /run/user/0 KHONG TON TAI; khong cron; 0 timer VCut
--- 9. .done hien co (luc stats) ---
round169-t0.done 08:46:49Z
--- 10. X11 ---
3 socket X193 (mtime 08:49Z)/X194/X195 (mtime 08:49Z); 0 Xvfb that
--- 11. watcher-168 log (doc lap) ---
191 poll tren #75, 198 dong, gaps {30s x178, 31s x11, 860s x1}, poll cuoi 07:32:18Z, mtime truc tiep 07:32:18.243Z; 0 poll co proc apt/dpkg
--- 12. dpkg breakdown + apt history #77 ---
startup 106 + install 169 + status 1040 + configure 178 + trigproc 43 + upgrade 9 = 1545 dong; history 50 transaction (08:36:02-08:37:42Z); 4 goi gstreamer co mat
--- 13. replay #77: receipt + ledger + dpkg-state ---
receipt 08:37:43Z hash d3ef183d... = ledger sha256 d3ef183d...; ledger 1 dong mtime 2026-11-22 07:36:32Z (compact tren #76); dpkg-state.txt 952 dong mtime 08:37:42Z
--- 14. dieu tra: cache .deb mtime + lists + apt dirs ---
cache 178 .deb, mtime cu nhat 2021-01-02, moi nhat 2026-11-18 16:22:47Z; TAT CA 178 file < btime #76 (07:32:23Z); partial/ mtime 07:36Z (#76); lists azure 34 file / cogentco 0; InRelease mtime cu (05:53:34Z #75-repair, 21/11, 2024-04-25); lock/auxfiles/partial cham 08:35:42-08:36:00Z (#77)
```

## Phụ lục B — File làm việc trong `round169-t5/` (không stage, để đối chiếu)

- `watcher-status-at-open.txt` (mở 08:46:27Z trên #77)
- `make-watcher-169.py`, `replay-watch-169.sh` (13.879 B)
- `replay-watch-169.log` (trực tiếp; 36 dòng, 31 poll lúc 09:01:52Z), `replay-watch-169.nohup.log` (trống)
- `t5-stats-169.py` + `t5-stats-169-output.txt` (chạy 08:48:35Z)
- `t5-postboot-independent-c44cc3ba.log` (PASS exit 0, 08:44:22Z), `t5-postboot-poll0-c44cc3ba.log` (PASS exit 0, 08:46:44Z)
- `POSTBOOT_PASS` (cờ #77, 315 B, replay-day-du poll=0) + `POSTBOOT_PASS-576ca271` (backup cờ #75, diff KHỚP gốc)
