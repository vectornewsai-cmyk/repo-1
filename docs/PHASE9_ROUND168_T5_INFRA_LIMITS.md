# PHASE 9 — ROUND 168 — T5 INFRA LIMITS

**Đợt:** 168 (mở lượt cron 12:35 +07 22/11/2026 = 05:35:51Z; hạn cờ ~08:00Z, hạn cứng 08:30Z).
**Người viết:** T5-168. **Ngày:** 22/11/2026. **Boot làm việc lúc đóng:** #75 (dự kiến) 576ca271, btime 05:32:46Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #75 (mode repair, KHÔNG phải replay-day-du — xem §3.1). File này là 1 entry duy nhất stage đợt 168 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #75 (576ca271, btime 05:32:46Z) | **ĐÃ CÓ 06:01:38Z (boot+28m52s, mode repair-som-quyet-h, poll=1)** — verify độc lập exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269, thư mục thật. **KHÔNG phải replay-day-du:** replay #75 chưa chạy vòng lặp cài đặt trước khi repair (xem §3.1) |
| POSTBOOT_PASS #74 (194efd93) | **VẪN CÓ, còn hiệu lực** (04:10:23Z) — T5-168 kiểm lại nội dung + backup `POSTBOOT_PASS-194efd93` diff KHỚP gốc round167-t5 |
| POSTBOOT_PASS #71 / #72 / #73 | **VẪN KHÔNG CÓ** (boot thứ 10/11/12 lọt, không bù được) |
| Reboot trong phiên | **#75 (576ca271, btime 05:32:46Z, gap #74→#75 = 5.237 s = 1h27m17s)** — xảy ra TRƯỚC khi đợt mở 3m05s, SAU khi watcher-167 kết thúc đúng hạn 2m36s |
| Watcher-168 | START 05:43:17Z, pid 13133, boot 576ca271; EARLY-REPAIR trigger 05:47:48Z (boot+15m02s) → repair chạy 05:47:49→06:01:38Z → FLAG-WRITTEN 06:01:38Z poll=1; **vẫn ĐANG CHẠY** lúc đóng (tới hạn cứng 08:30:00Z) |
| Watcher-167 | **KẾT THÚC ĐÚNG HẠN 05:30:00Z (END 05:30:10Z, poll cuối 05:29:40Z) — KHÔNG chết theo reboot** (lần đầu watcher kết thúc đúng hạn thay vì chết theo reboot); 344 dòng, 333 poll (lần 1: 170; lần 2: 163). Khoảng không-watcher: **817 s = 13m37s** (poll cuối → START watcher-168) |
| Điều tra #73 (nợ đợt 167, quyết (j)) | **Cơ chế replay ĐÃ TÌM RA (đọc source driver host-side):** intent ledger + preflight per-package loop, cache-first `--no-download`, lazy update, fail-open từng gói, autoclean cuối pass, backoff 5 strike. **Nguyên nhân gốc 4 gói #73 VẪN CHƯA XÁC ĐỊNH** — nhưng đã LOẠI TRỪ được version-drift + gói không cài được (4 gói cài ngon trên #75 qua repair, cùng phiên bản y hệt cache #73); còn lại giả thuyết mạnh nhất: stall mirror/proxy trong lúc tải (xem §5) |
| Đính chính mâu thuẫn comment/code | **KHÔNG có mâu thuẫn:** comment dòng ~595 "(ii) nhánh symlink GST trong --repair BỎ QUA khi replay đang chạy" — code dòng 723–736 thực thi ĐÚNG như vậy (SKIP khi replay chạy). T5-167 trích ngắn làm mất điều kiện — không cần sửa script (F-168-T5-1) |
| Cache .deb | **#75 mở với cache 0** dù #74 kết thúc với 178 — 178 .deb bị xóa trong cửa sổ 05:29:40Z→05:39:19Z; cơ chế xóa **CHƯA XÁC ĐỊNH** (đã loại trừ autoclean cuối replay #74 + mọi lần chạy dpkg — xem §5.4) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua #49–#75 = **27 reboot** (nếu #75 được xác nhận; T0 đếm độc lập) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 15 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0) |
| ENOSPC | #75: **27 dòng lúc stats 06:04:59Z** (T9 đếm chính thức); dòng đầu 05:34:34Z (boot+1m48s) |
| X11 | **3 socket X193 (mtime 06:02Z — bị tạo lại)/X194/X195 (05:45Z)**, 0 Xvfb thật — giao T8-168 dọn |
| RAM #75 | MemAvailable 1.531.268 kB lúc 06:04:59Z; loadavg 3,14 |
| Đồng hồ | Local ≈ Cloudflare **−1 s** (CF nhanh hơn local 0,2–1,2 s qua 4 lần đo) — lệch ≤1 s, cùng họ các đợt trước (đổi dấu so với "+1 s" trước đây — do làm tròn giây của header CF, không phải lệch đồng hồ thật) |
| Gap kiểm lại độc lập | #74→#75 = **5.237 s**; #73→#74 = **5.848 s** (KHỚP F-167-T10-1; số 2.248 s SAI — T5-168 kiểm bằng 2 phương pháp độc lập: trừ epoch bằng python + `date -d`) |

**Số hiệu boot #75 là DỰ KIẾN theo đếm tuần tự — chờ parent xác nhận + T0 xác minh 9 nguồn.**
**Quyết (j) đợt 167 đã GHI NHẬN (m) #71/#72 DƯƠNG, #74 ứng viên DƯƠNG, marker 26 reboot, hướng (3) lần thứ 14. T5-168 KHÔNG phán lại (m), chỉ trình số thô.**

---

## §1. Timeline (giờ Z, 22/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 04:05:29Z | Reboot #74 (194efd93, btime) — gap #73→#74 = 5.848 s (1h37m28s, kiểm lại độc lập — xem §4.1) |
| 04:10:23Z | POSTBOOT_PASS #74 ghi (watcher-167, replay-day-du, poll=0) |
| 05:29:40Z | Poll cuối watcher-167 lần 2 trên #74 (dpkg 1545 md5 ef7480f9, cache 178, lists 37) |
| 05:30:10Z | **Watcher-167 REPLAY-WATCH-167-END (hạn cứng 05:30:00Z) — KẾT THÚC ĐÚNG HẠN, không chết theo reboot** |
| 05:32:46Z | **Reboot #75 (576ca271, btime, epoch 1795325566) — gap #74→#75 = 5.237 s (1h27m17s); đến 2m36s SAU khi watcher-167 kết thúc** |
| 05:33:26Z | Hoạt động dpkg đầu trên #75 (boot+40s): `dpkg --configure -a` mở đầu, 2 dòng, md5 dbdf981a; cache 0; lists 5; GST 0; `/var/log/apt/` CHƯA CÓ |
| 05:35:51Z | Lượt cron đợt 168 mở |
| ~05:39Z | **T5-168 mở trên #75**: uptime 393 s → boot 05:32:46Z (khớp btime); `uptime -s` = 05:32:46Z; /proc/1 mtime 05:32:56,88Z (+10,9 s); journal idx 0 duy nhất, first entry 05:32:57Z (+11 s); không có file round-in-progress.md |
| 05:43:17Z | **Watcher-168 START, pid 13133, boot 576ca271** (khoảng không-watcher 817 s tính từ poll cuối watcher-167) |
| 05:43:17Z → 05:47:48Z | Watcher poll đều 30 s: dpkg 2 dòng, 0 proc apt/dpkg, cache 0, lists 5 — **replay #75 CHƯA chạy apt nào** (trái với #73: update bắt đầu boot+7m39s; #74: dpkg đầu boot+49s) |
| 05:47:48Z | **Watcher EARLY-REPAIR TRIGGER** (boot+15m02s, frozen 862 s, dpkg 2 dòng, 0 proc) → verify form-B exit 1 (05:47:49Z) → chạy `--repair` |
| ~05:47:50Z | Repair tạo symlink GST → debroot (269 file) — guard fuser/pgrep KHÔNG thấy replay (đúng — replay chưa chạy); `apt-get update` của repair (pid 26700) bắt đầu |
| ~05:50Z | **T5 gỡ symlink GST** trước khi có dpkg install nào (dpkg vẫn 2 dòng) — chống lặp lỗi boot #45 (xem §3.3, F-168-T5-2) |
| ~06:01:29Z | `apt-get update` của repair xong (~13m39s — mirror chậm, như #73); install bắt đầu |
| 06:01:29Z → 06:01:38Z | Giao dịch Install duy nhất trên #75 (history.log): cài 11 gói + deps, dpkg 2 → **795 dòng, md5 b9d3accb**; cache 0 → 110; lists 5 → 75; GST thư mục thật 269 file |
| 06:01:38Z | **Watcher postboot poll1 sau repair exit=0 → FLAG-WRITTEN: cờ POSTBOOT_PASS #75 ghi (boot+28m52s, mode repair-som-quyet-h, poll=1)** |
| ~06:04Z | T5 verify độc lập postboot check-only trên #75: **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269** (log `t5-postboot-independent-576ca271.log`) |
| 06:04:59Z | Stats script chạy (`t5-stats-168.py` → `t5-stats-168-output.txt`); watcher-168: 23 dòng log, 16 poll; RAM MemAvailable 1.531.268 kB; X11: 3 socket X193/X194/X195 |
| ~06:10Z | T5 viết LIMITS này. Watcher-168 vẫn ĐANG CHẠY (pid 13133), dpkg ổn định 795 dòng, 0 proc apt/dpkg — **replay #75 vẫn chưa chạy vòng lặp cài đặt tính tới lúc đóng LIMITS** |

Tuổi boot theo btime: #74: 5.237 s (1h27m17s, tính tới btime #75); #73: 5.848 s (1h37m28s).

---

## §2. Hướng (3) + marker + đồng hồ

Kiểm tra lại lúc stats 06:04:59Z trên #75 (`t5-stats-168.py` §8, khớp mẫu T5-167 §2):

- `systemctl is-active user@0` = **inactive**; `logind` = **inactive**; `dbus` = **inactive**.
- `loginctl show-user root` → **không nối được bus** (`Failed to connect to bus: No such file or directory` — như các đợt trước, logind chết, không có D-Bus system bus).
- `/var/lib/systemd/linger/` → **không tồn tại** → không user nào linger (F-168-T5-5: phương pháp kiểm thay loginctl khi bus chết).
- `ls /run/user/0` → **không tồn tại**.
- `crontab` → **không có lệnh** (`command not found` — không có cron).
- `systemctl list-timers --all` → 0 timer VCut (chỉ các timer hệ thống mặc định: home-assistant-ensure, apt-daily, dpkg-db-backup, e2scrub, fstrim, motd-news).

→ **Hướng (3) VẪN ĐỨNG lần thứ 15 liên tiếp** (quyết (j) đợt 167 ghi nhận lần thứ 14; T5-168 kiểm lại lần thứ 15, cùng kết quả). Không có bằng chứng nào cho hướng (1)/(2) (session sống / service giữ boot).

**Marker:** `~/.config/vcut-persistence-marker` CÒN, nội dung: written 2026-11-20T11:39:40Z, boot 2c0a7985 (reboot #48, btime 2026-11-20T11:26:05Z); mtime **2026-11-20 11:39:47Z không đổi** — sống qua **#49–#75 = 27 reboot** nếu #75 được xác nhận (75−49+1=27). T0-168 đếm độc lập.

**Đồng hồ:** 2 lần đo đồng thời lúc stats (script) + 2 lần đo tay lúc 06:01:15Z: CF 06:01:17 GMT vs local 06:01:15,754–16,849Z; CF 06:05:00/06:05:01 GMT vs local 06:04:59,204–06:05:00,160Z → **Cloudflare nhanh hơn local ~0,2–1,2 s** (local chậm hơn CF ~1 s). Lệch ≤1 s — cùng họ các đợt trước, chỉ đổi dấu so với "local ≈ CF +1 s" (do header Date của CF chỉ có độ phân giải 1 s; không phải lệch đồng hồ thật). Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn.

---

## §3. Watcher-168 + POSTBOOT_PASS

### §3.1 POSTBOOT_PASS #75 — ĐÃ CÓ (mode repair-som-quyet-h, poll=1) — KHÔNG phải replay-day-du

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round168-t5/POSTBOOT_PASS` (324 B, mtime 06:01:38.934Z).
- **Nội dung (nguyên văn):** `boot 576ca271-c659-4baa-8523-78b9e72297a7 (btime 2026-11-22 05:32:46Z; watcher-168) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-22T06:01:38Z; POSTBOOT_PASS moi ghi 2026-11-22T06:01:38Z poll=1 (repair-som-quyet-h); co cu 194efd93 luu POSTBOOT_PASS-194efd93`
- **Backup cờ #74:** `POSTBOOT_PASS-194efd93` (315 B) — `diff` KHỚP file gốc round167-t5.
- **Diễn biến repair (theo dõi trực tiếp + log watcher):**
  - 05:47:48Z watcher TRIGGER EARLY-REPAIR (boot+15m02s, frozen 862 s tính từ mtime dpkg.log 05:33:26Z, dpkg 2 dòng, 0 proc) → verify form-B exit 1 (05:47:49Z, đúng kỳ vọng).
  - `--repair` chạy 05:47:49Z → 06:01:38Z (~13m49s): GST symlink lại → debroot (~05:47:50Z, đã gỡ — xem §3.3); `apt-get update` pid 26700 (con của repair, KHÔNG phải của replay — xác minh bằng ppid: 26700 ← 26699 timeout ← 26648 repair script ← 13133 watcher) chạy 05:47:50Z → ~06:01:29Z (**~13m39s — mirror chậm**, cùng họ #73: update 12–13 phút; trái với #74: 3 s).
  - Install: **1 transaction duy nhất** trong history.log (Start 06:01:29Z / End 06:01:38Z, 9 s pha dpkg); dpkg 2 → **795 dòng, md5 b9d3accb**; breakdown **4 startup + 106 install + 568 status + 4 upgrade + 110 configure + 3 trigproc = 795**; cache 0 → 110 .deb; lists 5 → 75 (hai mirror azure + cogentco trong ubuntu.sources — xem §4.3); GST thư mục thật 269 file.
  - Poll1 sau repair exit 0 (hoàn tất 06:01:38Z) → FLAG-WRITTEN 06:01:38Z (boot+28m52s).
- **Verify độc lập (T5, ~06:04Z):** chạy lại postboot check-only, **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269, thư mục thật** (log `t5-postboot-independent-576ca271.log`).
- **11 gói đã cài (kiểm bằng dpkg-query):** libevent-2.1-7t64 2.1.12-stable-9ubuntu2.2, gstreamer1.0-plugins-base 1.24.2-1ubuntu0.7, gstreamer1.0-plugins-good 1.24.2-1ubuntu1.8, gstreamer1.0-plugins-bad 1.24.2-1ubuntu4, gstreamer1.0-plugins-ugly 1.24.1-1build1, gstreamer1.0-gl 1.24.2-1ubuntu0.7, gstreamer1.0-libav 1.24.1-1build1, gstreamer1.0-x 1.24.2-1ubuntu0.7, libavif16 1.0.4-1ubuntu3, libgstreamer1.0-0 1.24.2-1ubuntu0.2, libevdev2 1.13.1+dfsg-1build1.
- **Vì sao KHÔNG phải replay-day-du (ghi rõ, không giấu):** replay #75 KHÔNG chạy vòng lặp cài đặt trước khi repair (không có proc apt nào 05:33:26Z→05:47:48Z; dpkg giữ 2 dòng suốt 14 phút). Boot được làm đủ điều kiện bởi repair của watcher theo chiến lược (h) quyết parent đợt 150. dpkg 795 dòng là **chữ ký của đường repair** (11 gói + deps), trùng y hệt boot 90392aa5 đợt 140 (795 dòng — ghi trong header comment của postboot script) — tiền lệ cờ repair đã được chấp nhận. Các gói intent còn lại là **64 gói** (tính trực tiếp từ ledger: compacted 170 − repair 106, giao nhau hoàn toàn): aspell/aspell-en, dictionaries-common, emacsen-common, enchant-2, fonts-* (7), gdb, ghostscript, gstreamer1.0-tools, hunspell-en-us, imagemagick-6-common, libc6-dbg, libgtk-4-* (4), libvidstab-dev, nasm, pocketsphinx-en-us, xfonts-* (4), + ~30 lib khác (libaspell15, libdebuginfod*, libdjvulibre*, libdrm-*, libgs*, libmagick*, libsecret*, …) — CHƯA được cài trên #75 tính tới lúc đóng LIMITS; nếu replay chạy sau, watcher log sẽ ghi dpkg tăng tiếp (giao T5-169 theo dõi).
- **Caveat timestamp trong log watcher (F-168-T5-2):** dòng `--repair exit=0` mang timestamp 05:47:48Z (biến `$ts` lấy từ đầu vòng lặp, trước khi repair chạy) — thời gian HOÀN TẤT thật là 06:01:38Z (dòng poll1 ghi "hoan tat 2026-11-22T06:01:38Z"). Đọc log phải dùng timestamp "hoan tat", không dùng timestamp dòng `--repair exit`.

### §3.2 POSTBOOT_PASS #74 — VẪN CÓ, còn hiệu lực (theo dõi tiếp)

- Nội dung round167-t5/POSTBOOT_PASS không đổi (btime 04:05:29Z, replay-day-du, poll=0, ghi 04:10:23Z); mtime 04:10:23.751Z.
- Backup `POSTBOOT_PASS-194efd93` trong round168-t5 `diff` KHỚP file gốc — cờ #74 được bảo toàn qua 2 lần ghi cờ (watcher-168 chỉ backup, không ghi đè cờ #74 gốc).
- #70 (round166-t5) và #69 (round165-t5) cũng còn nguyên (kiểm lại bằng stats script §2c/§3b).

### §3.3 Gỡ symlink GST trước khi cài đặt (F-168-T5-2 — hành động quan trọng nhất đợt)

- Repair tạo symlink `/usr/lib/x86_64-linux-gnu/gstreamer-1.0 -> debroot` lúc ~05:47:50Z. Guard trong postboot script (fuser lock / pgrep apt-get/dpkg) KHÔNG chặn — ĐÚNG theo thiết kế, vì lúc đó replay chưa chạy (không có proc apt nào để phát hiện).
- **Nguy cơ:** nếu để symlink, bất kỳ `apt-get install` nào sau đó (của repair hoặc của replay) cài gói gstreamer sẽ ghi file plugin QUA symlink VÀO DEBROOT (`~/workspace/tmp-q6r3-debroot/`) — đúng lỗi boot #45 mà guard R9 đợt 115 sinh ra để ngăn.
- **Hành động (T5-168, ~05:50Z):** `rm` symlink TRƯỚC KHI có dpkg install nào (dpkg.log vẫn 2 dòng, md5 dbdf981a). Lúc gỡ chỉ có `apt-get update` của repair đang chạy — update không chạm tới thư mục GST, an toàn. Debroot vẫn 269 file (không bị ô nhiễm — kiểm lại sau repair: 269).
- **Hậu quả:** install của repair tạo thư mục GST THẬT khi giải nén gói gstreamer (thư mục thật 269 file lúc 06:01Z); RE-CHECK GST của repair PASS qua thư mục thật. Ghi chú chi tiết tại `round168-t5/symlink-removal-75.txt`.
- **Bài học:** guard "SKIP symlink khi replay đang chạy" KHÔNG phân biệt được "replay vắng" vs "replay CHẠY MUỘN" — trigger boot+15' có thể nổ trước khi replay khởi động (ở đây replay muộn hơn 15'). Chiến lược (h) vẫn đúng (repair sớm vẫn tốt hơn chờ); chỉ cần thêm bước gỡ symlink trước khi install nếu replay bắt đầu sau đó — giao T5-169 cân nhắc bổ sung vào watcher (không tự sửa script trong đợt này).

### §3.4 POSTBOOT_PASS #71 / #72 / #73 — VẪN KHÔNG CÓ, không bù được

- **#71 (ea73ac4f):** grep toàn bộ `POSTBOOT_PASS*` dưới `hidden_files/round*/` 0 kết quả. **Boot thứ 10 không có cờ.**
- **#72 (9e089ef6):** grep 0 kết quả. **Boot thứ 11 không có cờ.**
- **#73 (b643911f):** grep 0 kết quả. **Boot thứ 12 không có cờ.**
- Không bù được cho cả 3 (cùng quy tắc #63/#66/#68: cờ chỉ chứng nhận phép đo trực tiếp trên boot sống; #71/#72/#73 đều chết trước khi có phiên T5 nào).
- **#68 (0c8a94aa): VẪN KHÔNG CÓ** (kiểm lại). #63 (94d22520) / #66 (edb2acdb) cũng KHÔNG CÓ (kiểm lại §2c). #70/#69 còn (xác minh lại nội dung: #70 23:40:45Z, #69 20:43:50Z — khớp LIMITS cũ).
- Đếm boot không cờ tới nay: #51, #53, #54, #55, #57, #60, #63, #66, #68 (9, theo T5-166) + #71 (10) + #72 (11) + #73 (12).

### §3.5 Watcher-168 — 1 lần khởi động, đang chạy

**START 05:43:17Z, pid 13133, boot 576ca271**, cùng script `replay-watch-168.sh` (tạo bằng `make-watcher-168.py` từ nguồn 167 — xem §9 F-168-T5-6). Init: dpkg 2 dòng md5 dbdf981a mtime 05:33:26Z, cache 0, lists 5, gst_sys 0. Poll đều 30 s. **Đang chạy lúc đóng LIMITS (ALIVE, kill -0 13133)**. Khoảng không-watcher: **817 s = 13m37s** (poll cuối watcher-167 05:29:40Z → START 05:43:17Z; tính từ END 05:30:10Z là 787 s).
Log watcher-168 lúc stats 06:04:59Z: 23 dòng, **16 poll**, gaps {30 s ×12, 31 s ×2, 860 s ×1} (860 s là cửa sổ repair 05:47:48Z→06:02:08Z — vòng lặp watcher bị chặn trong lúc repair chạy đồng bộ, không phải poll gap); boot_set [576ca271]; kinds {START: 1, MONITOR: 1, postboot: 1, FLAG-WRITTEN: 1}; poll cuối lúc stats: 06:04:39Z (dpkg 795 md5 b9d3accb, 0 proc, gst 269, cache 110, lists 75). Không có dòng REPLAY_DONE (đúng — cờ đến từ repair, không từ replay). Không có NEWBOOT (không reboot mới từ khi watcher chạy).

**Generator `make-watcher-168.py`:** viết mới theo mẫu 167, header VIẾT MỚI hoàn toàn cho đợt 168; thay token đúng chuỗi trong nguồn (`replay-watch-167.log`→`replay-watch-168.log`, `round167-t5`→`round168-t5`, `round166-t5`→`round167-t5`, `REPLAY-WATCH-167`→`REPLAY-WATCH-168`, `watcher-167`→`watcher-168`, hạn cứng `2026-11-22 05:30:00`→`2026-11-22 08:30:00`, `han cung 05:30:00Z`→`han cung 08:30:00Z`); assert thêm (không còn `b643911f`/`02:28:01`/`2026-11-22 05:30`/`watcher-167`/`REPLAY-WATCH-167` trong thân; `LOG=$DIR/replay-watch-168.log`); `bash -n` OK; 12 chuỗi "167" còn lại trong file đều ở header comment (tham chiếu đợt 167 — hợp lệ, đã kiểm từng dòng). Spawn bằng đường dẫn TUYỆT ĐỐI + nohup + disown (F-167-T5-2 đã sửa: không dùng `cd ... && ... &`).

**Watcher-167 (đợt trước) — xác minh độc lập từ log gốc (stats script §11):** **333 poll** (lần 1: 170 trên #73; lần 2: 163 trên #74), 344 dòng, gaps {30 s ×303, 31 s ×28, 161 s ×1} (161 s là khoảng giữa 2 lần khởi động); **END 05:30:10Z — KẾT THÚC ĐÚNG HẠN, không chết theo reboot** (lần đầu tiên trong chuỗi watcher gần đây: watcher-164/165/166 đều chết theo reboot; watcher-167 lần 1 chết theo #74 nhưng lần 2 sống tới hạn). Poll cuối 05:29:40Z (dpkg 1545 md5 ef7480f9, cache 178, lists 37). pid 4928 chết (`kill -0`: No such process — xác minh lại lúc stats). Khớp quyết (j) đợt 167.

---

## §4. Boot #75 + đồng hồ

### §4.1 Xác minh boot #75 (boot hiện tại)

- boot_id: `576ca271-c659-4baa-8523-78b9e72297a7`; btime /proc/stat: **05:32:46Z (epoch 1795325566)**.
- Lúc mở 05:39:19Z: uptime 393 s → boot 05:32:46Z (khớp btime 0 s); /proc/1 mtime 05:32:56,88Z (+10,9 s); journal first entry 05:32:57Z (+11 s).
- Stats script 06:04:59Z: uptime 1.933,04 s → boot 05:32:45,96Z (chênh btime 0,04 s).
- `uptime -s` = 05:32:46Z — KHỚP btime.
- Boot #74: btime 04:05:29Z (epoch 1795320329); boot #73: btime 02:28:01Z (epoch 1795314481).
- **Gap #74→#75 = 5.237 s (1h27m17s)** — tính độc lập bằng 2 phương pháp: trừ epoch bằng python (1795325566−1795320329) + `date -d @<epoch>` đối chiếu từng btime (05:32:46Z − 04:05:29Z). Cả hai khớp.
- **Gap #73→#74 kiểm lại độc lập = 5.848 s (1h37m28s)** — KHỚP F-167-T10-1; số 2.248 s trong LIMITS T5-167 là SAI (thiếu đúng 1 giờ — lỗi trừ giờ, không phải lỗi đo).

### §4.2 Lệch khung giờ biên #74/#75 (số thô cho T2-168 — KHÔNG phán (m))

- Watcher-167 đã kết thúc đúng hạn TRƯỚC reboot #75 (END 05:30:10Z; reboot 05:32:46Z) → **không có poll watcher nào sau btime #75**; không đo được lệch khung kiểu "poll cuối sau btime" như biên #70/#71 (20 s) hay #73/#74 (12 s).
- Các mốc khung mới đều sau btime, cùng chiều, không mâu thuẫn: /proc/1 +10,9 s; journal first entry +11 s.
- Reboot thật ∈ (05:29:40Z, 05:43:17Z] theo watcher (poll cuối #74 → poll đầu #75); btime neo 05:32:46Z.
- Requeue run 167/168 tại #75 + offset (m) thuộc T7-168/T2-168 (T5 chưa có số — KHÔNG tự tính offset).

### §4.3 Lists #75 = 75 (hai mirror) — khác mẫu 37 của #74

- lists lúc mở: 5 (base: cli.github.com + pkg.cloudflare.com + ...). Sau repair update: **75** — gồm cả `azure.archive.ubuntu.com_*` và `mirror.cogentco.com_*` (ubuntu.sources liệt kê 2 URI: `http://azure.archive.ubuntu.com/ubuntu http://mirror.cogentco.com/pub/linux/ubuntu`, suites noble/noble-updates/noble-backports/noble-security). #74 lists 37 (1 mirror). Ghi nhận khác biệt, không suy nguyên nhân (có thể apt fetch cả 2 URI trong cùng một lần update; log update của repair chủ yếu hiện cogentco).
- Proxy egress: `http://hatch-egress-proxy:3128` (cả http/https — `/etc/apt/apt.conf.d/80hatch-egress-proxy`).

---

## §5. ĐIỀU TRA NỢ ĐỢT 167: 4 gói gstreamer #73 + cache + mâu thuẫn comment/code

Đây là phần điều tra được giao ở quyết (j) đợt 167 ("nguyên nhân gốc CHƯA xác định, giao điều tra đợt sau"). T5-168 đã đọc source của driver replay (host-side) + ledger + config apt + chạy thử live trên #75.

### §5.1 Cơ chế replay — ĐÃ TÌM RA (đọc source, lần đầu ghi đầy đủ vào LIMITS T5)

**Ledger intent** — `/var/lib/hatch/os-intent/ledger.jsonl` (thư mục bridged, bền qua reboot; hiện có 2 dòng):
- Dòng 1: `{"compacted":true, "ts":1795251569 (= 2026-11-21T08:59:29Z), "added":[170 gói, gồm cả 4 gói gstreamer]}` — intent gộp từ mọi lần cài trước đó.
- Dòng 2 (MỚI trên #75): `{"ts":1795327298 (= 06:01:38Z), "event":"dpkg-post-invoke", "added":[106 gói: 11 gói NEED + 95 deps], "removed":[]}` — recorder ghi lại sau install của repair (xem §5.3).
- Recorder: `/usr/local/sbin/hatch-apt-intent-record` (hook `DPkg::Post-Invoke`, cấu hình tại `/etc/apt/apt.conf.d/90hatch-intent-ledger`): snapshot `dpkg-query -W`, append delta khi khác snapshot trước; fail-open (`|| true`).

**Driver replay** — `/opt/hatch/runtime-cell/hatch-preflight-opportunistic` (host-side, chạy mỗi lần cell khởi động; helper `/opt/hatch/runtime-cell/os-intent-ledger.py`):
1. Snapshot ledger (one-open, O_NOFOLLOW, bound 16 MiB) → fold thành net install/remove (`fold` in ra `install <pkg1> <pkg2> ...` một dòng).
2. Receipt fast-path: nếu hash ledger khớp receipt (`/var/lib/hatch-preflight/os-intent-replayed.sha256` trong cell — bị xóa mỗi reboot vì nằm trên overlay) thì bỏ qua replay. Trên #75 không có receipt → không skip bằng đường này.
3. Compact ledger về 1 entry (best-effort, cần giữ frontend lock ≤120 s).
4. Reconcile qua `hatch-manifest maybe-apply` (chạy `dpkg --configure -a` trước — **đây là 2 dòng dpkg.log đầu trên #75 lúc 05:33:26Z**).
5. **Vòng lặp per-package** (in-cell, qua nsenter), theo thứ tự ledger: với mỗi gói — kiểm tra `dpkg-query` status (đã cài thì bỏ qua); thử `apt-get install -y --no-download --no-install-recommends $pkg` (cache-first, stdout/stderr bỏ đi); nếu fail thì lazy `apt-get update` MỘT lần duy nhất trong pass, rồi `apt-get install -y --no-install-recommends $pkg` (có tải); nếu vẫn fail thì **đếm failures++, log "FAILED to install $pkg (best-effort; continuing)" và ĐI TIẾP — không dừng pass**.
6. Cuối pass: `reseed_dpkg_state` + **`apt-get autoclean -y`** (chạy CẢ KHI có failures — "prunes no-longer-downloadable .debs ... so the persistent cache never grows unboundedly"); nếu failures > 0 thì exit 1 → **receipt bị giữ lại** → lần restart sau chạy lại toàn bộ pass.
7. **Backoff:** `BACKOFF_LIMIT=5` pass fail liên tiếp với inputs giống hệt nhau thì bỏ qua các bước apt cho tới khi ledger/manifest đổi. State backoff ở host (`/var/lib/hatch/os-intent-backoff`, không nhìn thấy từ trong cell).

**Cache:** `/var/cache/apt/archives` là btrfs subvol trên `/dev/mapper/rv[/data/apt-archives]` (nằm TRÊN tmpfs trong mount stack — `/proc/mounts` liệt kê tmpfs trước, RV sau → RV là lớp nhìn thấy được). Thư mục bền qua reboot (bằng chứng: `partial/` mtime 04:09Z từ #74 + `lock` mtime Nov 6 vẫn còn trên #75).

### §5.2 #73: nguyên nhân gốc VẪN CHƯA XÁC ĐỊNH — nhưng đã thu hẹp đáng kể (loại trừ 2 giả thuyết)

**Đã LOẠI TRỪ bằng bằng chứng mới trên #75:**
- **(a) Version-drift (cache cũ ≠ candidate mới): LOẠI.** 4 gói vừa cài trên #75 qua repair có phiên bản Y HỆT .deb trong cache #73: gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1 (T5-167 ghi cache #73; §3.1 ghi bản cài #75). Candidate trên cùng mirror không đổi phiên bản giữa #73 và #75 → đường `--no-download` (cache-first) lẽ ra phải thành công trên #73 nếu chỉ xét phiên bản.
- **(b) Gói không cài được / mirror thiếu gói: LOẠI.** Lệnh `apt-get install -y --no-install-recommends` trực tiếp 11 gói (gồm 4 gói) THÀNH CÔNG trên #75 (1 transaction, 9 s pha dpkg, RE-CHECK toàn PASS) — cùng mirror, cùng phiên bản.

**Còn lại — giả thuyết mạnh nhất (CHƯA chứng minh): stall mirror/proxy trong lúc tải:**
- Trên #73, 4 lần `apt-get install` quan sát được chạy 7–17 phút mỗi lần (gl pid 30577 ~02:52–02:59; libav pid 37504 ~03:11–03:23; bad pid 39340 ~03:17–03:34 — theo T5-167) rồi thoát KHÔNG cài, không transaction, không lỗi trong term.log/history.log — đúng chữ ký của "download-install fail" trong vòng lặp replay (bước 5): apt thoát non-zero sau khi tải (hoặc giữa lúc tải) → không gọi dpkg → không có dòng dpkg.log, không có transaction; vòng lặp chỉ đếm failures++ và đi tiếp.
- Mirror CHẬM trong cửa sổ #73 là có bằng chứng độc lập: `apt-get update` #73 mất ~12–13 phút (so với 3 s trên #74); **update của repair trên #75 cũng mất ~13m39s** — mirror chậm TÁI DIỄN ngay trong đợt này. Tải .deb chậm + stall qua egress proxy 3128 là cơ chế hợp lý nhất cho 4 lần fail đó.
- **Giả thuyết yếu (ghi để loại):** tranh lock dpkg — `Binary::apt::DPkg::Lock::Timeout 120` (apt-config dump): install chờ lock tối đa 120 s rồi fail; nhưng 4 pid quan sát được chạy 7–17 phút, không khớp 120 s → không phải nguyên nhân chính.
- **Vì sao KHÔNG thể kết luận dứt khoát:** lý do fail cụ thể của từng lần install nằm trong stderr của preflight host-side (bước download-install KHÔNG redirect output — chỉ bước `--no-download` mới `>/dev/null 2>&1`), mà host journal của boot #73 không đọc được từ trong cell (journal cell chỉ giữ boot hiện tại) và đã mất theo reboot. **Bằng chứng gốc không còn khôi phục được — ghi rõ, không suy đoán thêm.** Giao T5-169 (nếu replay #75 chạy và fail gói nào thì bắt stderr ngay trong phiên — không đợi reboot sau mới điều tra).

**Thứ tự ledger (đo trực tiếp từ file):** compacted ledger có 170 gói; 4 gói nằm ở: gl vị trí 10/170 (đầu), libav 56, bad 57, good 58, ugly 59, x 60 (giữa, 56–60/170). Thứ tự này khớp thời gian 4 lần install quan sát được trên #73 (gl 02:52 trước libav/bad 03:11–03:34) — vòng lặp xử lý tuần tự theo ledger, không phải song song.

### §5.3 Bằng chứng live trên #75: repair cài được 4 gói — và recorder đã ghi lại

- Install của repair (1 transaction, 06:01:29–06:01:38Z) cài đủ 11 gói NEED + 95 deps = 106 gói (khớp dpkg breakdown `install: 106` và ledger dòng 2: 106 added).
- Recorder (không bị silence ngoài replay) đã append dòng ledger thứ 2 lúc 06:01:38Z với 106 gói added (gồm cả 4 gói gstreamer) — trùng lặp vô hại với dòng compacted (fold xử lý re-add thành no-op). `dpkg-state.txt` đi từ 783 dòng (baseline 05:33Z) lên 889 dòng.
- **Kết luận cho #73:** lỗi nằm ở ĐƯỜNG REPLAY của pass #73 tại thời điểm đó (tải qua vòng lặp per-package), không nằm ở gói/mirror nói chung.

### §5.4 Cache 178 → 0 trên #75: cơ chế xóa CHƯA XÁC ĐỊNH

- Cửa sổ: cache 178 .deb lúc poll cuối watcher-167 05:29:40Z (#74) → cache 0 lúc T5-168 mở 05:39:19Z (#75).
- **Đã loại trừ:** (i) autoclean cuối replay #74 — cache VẪN 178 suốt từ 04:10:23Z tới 05:29:40Z, tức 80 phút sau khi replay #74 kết thúc; (ii) mọi lần chạy dpkg/apt trong cửa sổ 05:33:26Z→05:39:19Z — dpkg.log chứng minh không có lần chạy dpkg nào sau 2 dòng mở đầu; watcher poll từ 05:43Z chứng minh không có proc apt nào tới 05:47:48Z.
- Thư mục archives bền qua reboot (partial/ mtime 04:09Z + lock Nov 6 còn nguyên) → file .deb bị XÓA, không phải thư mục bị thay.
- Nghi vấn còn lại (không kiểm được từ trong cell): các bước host-side của preflight lúc #75 khởi động, hoặc trình tự cell stop/start. Ghi nhận là nợ mở cho host-side (không thuộc phạm vi T5 trong cell). **Không claim** tmpfs che RV (thứ tự mount cho thấy RV nằm trên; partial/ + lock chứng minh thư mục nhìn thấy là RV).

### §5.5 Đính chính: KHÔNG có mâu thuẫn comment/code trong postboot script (F-168-T5-1)

- T5-167 §3.2 ghi: header comment dòng 595 "(ii) nhánh symlink GST trong --repair BỎ" nhưng code dòng 734 VẪN CÓ `ln -sfn ...` — cho là mâu thuẫn.
- Đọc lại nguyên văn (script 827 dòng): comment R9 đợt 115 ghi "(ii) nhánh symlink GST trong --repair **BỎ QUA khi replay đang chạy** (lock/apt/dpkg) để không cướp thư mục plugin thật mà replay đang cài (lỗi này đã xảy ra ở boot #45...)". Code dòng 723–736 thực thi ĐÚNG: `if REPAIR && [ -d DEBROOT_GST ]` → kiểm `fuser lock-frontend || pgrep apt-get || pgrep dpkg` → SKIP + báo rõ khi replay chạy; chỉ symlink khi KHÔNG có replay. **Comment và code KHỚP nhau; T5-167 trích ngắn làm mất điều kiện "khi replay đang chạy". Không cần sửa script.** Nợ §7.6 LIMITS T5-167 ĐÓNG tại đây.

---

## §6. Quy tắc đứng (3)

(Trích từ LIMITS các đợt trước — giữ nguyên, không đổi.)

1. **Cờ POSTBOOT_PASS chỉ chứng nhận phép đo trực tiếp trên boot sống.** Boot đã chết trước khi có phiên T5 thì KHÔNG bù được (áp dụng #71/#72/#73 đợt này; #63/#66/#68 trước đó).
2. **Watcher chết theo reboot là bình thường** — watcher là tiến trình trong cell, không sống qua reboot. Khoảng không-watcher được đo và ghi (đợt này: 817 s). **Ngoại lệ mới đợt này:** watcher-167 kết thúc ĐÚNG HẠN (không chết theo reboot) — khoảng không-watcher vẫn tính từ poll cuối như cũ.
3. **Hướng (3) đứng:** không có bằng chứng session/service nào giữ boot sống qua reboot (kiểm lại lần thứ 15 đợt này — xem §2).
4. **Khung giờ boot cũ = XÁC NHẬN OVERLAP, không đổi verdict (m)** (quyết (e) đợt 166). T5 chỉ đo số thô tại biên reboot, giao T2 đối chiếu.
5. **Không kết luận nguyên nhân khi chưa có bằng chứng trực tiếp** (áp dụng cho 4 gói #73 — xem §5.2; và cache 178→0 — xem §5.4).
6. **Chỉ stage, KHÔNG PUSH** — user tự push sau từ main chat.

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM (stats 06:04:59Z, boot #75):** MemTotal 8.124.900 kB; MemAvailable 1.531.268 kB; MemFree 143.444 kB; loadavg 3,14 (lúc mở 06:01:15Z: MemAvailable 1.526.628 kB, loadavg 1,34). (T9 đo headroom chính thức — T5 chỉ ghi snapshot.)

**ENOSPC (T9 đếm chính thức; T5 chỉ ghi snapshot):**
- #75: 24 dòng lúc 06:01:15Z (journal 155 dòng); **27 dòng lúc stats 06:04:59Z** (journal 169 dòng, dòng đầu 05:34:34Z = boot+1m48s, từ `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device`).

**X11:**
- TRỐNG lúc mở #75 (05:39Z); 0 Xvfb thật (`pgrep -x Xvfb` exit 1).
- Lúc 06:01:15Z: **3 socket X193/X194/X195 mới, mtime 05:45Z, 0 Xvfb thật** — xuất hiện trong phiên #75, sau lúc T5 mở. Lúc stats 06:04:59Z: X193 mtime **06:02Z (bị tạo lại)**, X194/X195 vẫn 05:45Z. Cùng mẫu các đợt trước (3 socket X193/X194/X195 mtime 23:44Z đợt 166; X193 mtime 04:11Z đợt 167) — **giao T8-168 dọn**. Lúc viết LIMITS (~06:10Z) vẫn 3 socket.

**Journal:** #75: idx 0 duy nhất; 155 dòng lúc 06:01:15Z; 169 dòng lúc 06:04:59Z, dòng đầu 05:34:34Z. Không có OOM/killed process trên #75 (chưa grep toàn bộ — T9 kiểm chính thức; T5 chỉ ghi snapshot).

---

## §8. Nợ mở chuyển đợt 169 (T5-169 sở hữu)

1. **Watcher-168 (pid 13133) tiếp tục giám sát tới 08:30:00Z 22/11** — T5-169 kiểm tra log cuối + poll cuối + END line (hoặc chết theo reboot mới). Nếu replay #75 chạy sau khi T5-168 đóng (dpkg tăng từ 795 lên ~1545), watcher log sẽ ghi lại — T5-169 diễn giải.
2. **POSTBOOT_PASS #71/#72/#73 KHÔNG CÓ** (boot thứ 10/11/12 lọt, không bù được); #68/#63/#66 vẫn không có. **#75 ĐÃ CÓ (mode repair, poll=1)** — theo dõi tiếp; nếu replay #75 chạy sau và cài đủ 64 gói còn lại thì boot đạt trạng thái đầy đủ, nhưng cờ repair vẫn giữ nguyên (không ghi lại cờ replay).
3. **Marker 27 reboot #49–#75** (T0 đếm độc lập).
4. **Caveat khung giờ #70/#71 (20 s) + #73/#74 (12 s)** giao T2-168 đối chiếu (biên #74/#75 không có poll sau btime — xem §4.2); (m) #71/#72 đã CHẤP NHẬN DƯƠNG theo quyết (f) đợt 167 — không phán lại; (m) #74 ứng viên DƯƠNG — đối chiếu thuộc T2-168; (m) #56 vẫn có điều kiện.
5. **Nguyên nhân gốc 4 gói #73: VẪN CHƯA XÁC ĐỊNH (đã thu hẹp — xem §5.2).** Bằng chứng gốc (stderr preflight host-side của pass #73) không khôi phục được từ trong cell. Nếu replay đợt sau fail gói nào thì bắt stderr ngay trong phiên — không đợi reboot sau mới điều tra. Giả thuyết mạnh nhất còn lại: stall mirror/proxy trong lúc tải.
6. **Cache 178 → 0 trên #75: cơ chế xóa CHƯA XÁC ĐỊNH** (xem §5.4) — nợ host-side, ngoài tầm T5 trong cell.
7. **Replay #75 chạy muộn hơn 15 phút (chưa chạy tới lúc đóng LIMITS):** nguyên nhân host-side chưa rõ (backoff đã loại trừ — strike reset bởi #74 thành công; cần 5 pass fail liên tiếp mới engage). Theo dõi xem replay có chạy muộn không (watcher log dpkg).
8. **Guard symlink GST:** bổ sung bước gỡ symlink trước khi install nếu replay bắt đầu sau repair (bài học F-168-T5-2) — giao T5-169 cân nhắc, không tự sửa script trong đợt này. Mâu thuẫn comment/code: **ĐÃ ĐÓNG** (không có mâu thuẫn — xem §5.5).
9. TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet.
10. G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời — để yên, không nhắc lại). R9 (a) vẫn chờ user (số đếm vẫn là 16).

---

## §9. Đề xuất cho parent

- **(a) Chấp nhận kết quả T5-168:** cờ #75 (mode repair-som-quyet-h, poll=1, verify độc lập exit 0); #74 còn hiệu lực; #71/#72/#73 không cờ, không bù được; watcher-168 đang chạy; hướng (3) lần thứ 15; marker 27 reboot.
- **(b) Cờ #75 mode repair (không phải replay-day-du) có được tính là POSTBOOT_PASS đủ điều kiện cho gate (a) của T4/T8 không?** Tiền lệ: boot 90392aa5 đợt 140 có cờ repair-1-phan (795 dòng) đã được chấp nhận; postboot check-only độc lập exit 0 (11/11 + 5/5 + GST 269). T5 đề xuất: cờ ĐỨNG cho gate (a) — boot đủ điều kiện chạy WebKit — nhưng ghi rõ mode repair trong mọi trích dẫn (không gọi là replay-day-du).
- **(c) Số hiệu #75 (dự kiến):** xác nhận khi T0-168 hoàn tất xác minh 9 nguồn (đặc biệt btime 05:32:46Z và boot_id 576ca271).
- **(d) Điều tra 4 gói #73:** T5-168 đã đọc source driver replay + chạy thử live — kết luận: nguyên nhân gốc VẪN CHƯA XÁC ĐỊNH nhưng đã loại trừ version-drift + gói không cài được; giả thuyết mạnh nhất là stall mirror/proxy. Bằng chứng gốc (stderr preflight #73) không khôi phục được từ trong cell — đề xuất ĐÓNG điều tra ở mức này (không còn nguồn bằng chứng mới trong cell), trừ khi replay đợt sau tái diễn fail thì bắt stderr ngay trong phiên.
- **(e) Cache 178 → 0 + replay #75 chạy muộn:** ghi nhận là nợ host-side (ngoài tầm T5 trong cell); không đổi quy trình T5.
- **(f) X11 X193/X194/X195 (05:45Z/06:02Z):** giao T8-168 dọn theo mẫu các đợt trước.

---

## §10. Sai số của chính T5-168 (ghi để đợt sau khỏi lặp)

- **F-168-T5-1 — Đính chính ghi chú T5-167 về "mâu thuẫn" comment/code postboot script (KHÔNG phải lỗi của T5-168, là đính chính):** comment dòng ~595 "(ii) nhánh symlink GST trong --repair BỎ QUA khi replay đang chạy" KHỚP code dòng 723–736 (SKIP khi replay chạy, symlink khi không chạy). T5-167 trích ngắn làm mất điều kiện. Không cần sửa script. Nợ §7.6 LIMITS T5-167 ĐÓNG.
- **F-168-T5-2 — Early-repair race + symlink GST (ĐÃ XỬ LÝ trong phiên):** watcher trigger EARLY-REPAIR 05:47:48Z trong khi replay #75 chỉ đang CHẠY MUỘN (chưa vắng hẳn); repair tạo symlink GST → debroot lúc ~05:47:50Z. T5 gỡ symlink ~05:50Z trước khi có dpkg install nào (debroot giữ 269 file, không ô nhiễm). Bài học: guard "SKIP symlink khi replay đang chạy" không phân biệt được "vắng" vs "muộn". Thêm: dòng log `--repair exit=0` mang timestamp trigger 05:47:48Z (biến `$ts`), thời gian hoàn tất thật là 06:01:38Z — đọc log phải dùng timestamp "hoan tat".
- **F-168-T5-3 — Lệnh kiểm nháp dùng epoch #72 đoán mò (bắt được, không output nào đã ghi bị ảnh hưởng):** lúc kiểm gap bằng python, T5 gõ epoch #72 là 1795312081 (đoán) cho ra "gap #72→#73 = 2.400 s" trong output nháp — SAI, số đúng là 1.376 s (btime #72 = 02:05:05Z = epoch 1795313105; 1795314481−1795313105 = 1.376). Số sai chỉ xuất hiện trong output exec nháp, KHÔNG ghi vào file nào. Bài học: không bao giờ gõ epoch từ trí nhớ vào phép kiểm — lấy btime từ `/proc/stat` hoặc aggregate.
- **F-168-T5-4 — Stats script §2c liệt kê thừa file theo nội dung cờ (caveat đọc, không phải sai số đo):** script grep cả nội dung file nên `round168-t5/POSTBOOT_PASS` xuất hiện dưới cả #194efd93 và #d1ddd946 (vì cờ #75 ghi "co cu 194efd93", cờ #74 ghi "co cu d1ddd946"). Khi trích vào LIMITS phải phân biệt cờ THEO BOOT (boot_id trong nội dung) với file backup (tên file). Đã ghi đúng trong LIMITS này (§3.2/§3.4).
- **F-168-T5-5 — loginctl không nối được bus (phương pháp kiểm Linger thay đổi):** `loginctl show-user root` báo `Failed to connect to bus` (không có D-Bus system bus trong cell) nên không đọc được Linger qua loginctl như các đợt trước; T5 kiểm thay bằng `/var/lib/systemd/linger/` không tồn tại → không user nào linger. Ghi rõ phương pháp để đợt sau khỏi nhầm là "không kiểm".
- **F-168-T5-6 — Generator watcher: 12 chuỗi "167" còn trong file script mới (ĐÃ KIỂM, hợp lệ):** tất cả đều ở header comment (tham chiếu đợt 167: quyết (j), watcher-167, F-167-T5-2...). Assert của generator chỉ kiểm THÂN script (sau `DIR=`), không kiểm header — đúng thiết kế (header cố tình nhắc đợt trước). Đã kiểm từng dòng bằng grep trước khi spawn.

---

## §11. Batch stage

- **File stage:** `~/workspace/repo-1/docs/PHASE9_ROUND168_T5_INFRA_LIMITS.md` (file này).
- **Paths file:** `~/workspace/repo-1-push/paths-loop/phase9-round168-t5-infra.txt` (NUL-delimited, 1 entry — chỉ file text, KHÔNG binary).
- **Verify:** read-back bằng `od -c` sau khi stage (theo mẫu T5-166/T5-167).
- **KHÔNG PUSH** — user tự push sau từ main chat.
- Các file làm việc trong `round168-t5/` (watcher script/log, stats script/output, postboot log, cờ POSTBOOT_PASS + backup, ghi chú symlink-removal) KHÔNG stage đợt này (theo mẫu T5-167: chỉ stage LIMITS); chúng nằm trên đĩa để T10/parent đối chiếu.

---

## Phụ lục A — Trích stats output (`t5-stats-168-output.txt`, chạy 06:04:59Z)

```
--- 1. boot id + uptime ---
boot_id=576ca271-c659-4baa-8523-78b9e72297a7
btime=1795325566 (2026-11-22 05:32:46 UTC)
uptime=1933.04 (boot 2026-11-22 05:32:45.96 UTC)
clock: local_truoc=06:04:59.204Z CF=Sat, 22 Nov 2026 06:05:00 GMT local_sau=06:04:59.755Z (lan 2 tuong tu)
--- 2a. marker ---
marker_mtime=2026-11-20 11:39:47.000000000 +0000
--- 2b. grep POSTBOOT_PASS (tat ca round) ---
#576ca271: round168-t5/POSTBOOT_PASS
#194efd93: round167-t5/POSTBOOT_PASS, round168-t5/POSTBOOT_PASS-194efd93 (+ round168-t5/POSTBOOT_PASS theo noi dung 'co cu')
#b643911f (#73): 0 ket qua — KHONG CO
#9e089ef6 (#72): 0 ket qua — KHONG CO
#ea73ac4f (#71): 0 ket qua — KHONG CO
#0c8a94aa (#68): 0 ket qua — KHONG CO
#94d22520 (#63): 0 ket qua — KHONG CO
#edb2acdb (#66): 0 ket qua — KHONG CO
--- 3. round167-t5/POSTBOOT_PASS (#74, xac minh lai) ---
boot 194efd93-ef9b-44e9-b570-0b161c71a080 (btime 2026-11-22 04:05:29Z; watcher-167) — replay-day-du: dpkg 1545 dong; cache 178.deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T04:10:23Z; POSTBOOT_PASS moi ghi 2026-11-22T04:10:23Z poll=0 (replay-day-du); co cu d1ddd946 luu POSTBOOT_PASS-d1ddd946
--- 3c. POSTBOOT_PASS #75 (round168-t5) ---
boot 576ca271-c659-4baa-8523-78b9e72297a7 (btime 2026-11-22 05:32:46Z; watcher-168) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-22T06:01:38Z; POSTBOOT_PASS moi ghi 2026-11-22T06:01:38Z poll=1 (repair-som-quyet-h); co cu 194efd93 luu POSTBOOT_PASS-194efd93
mtime: 2026-11-22 06:01:38.934Z
gst_sys_files=269
apt_procs= (trong)
watcher168_ps=13133 bash .../replay-watch-168.sh (ALIVE)
watcher167_pid4928_kill0=DEAD
--- 5. kiem tra goi postboot #75 ---
11/11 goi da cai (bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1); 5/5 lib; GST 269 = debroot 269
--- 6. ENOSPC ---
#75: 27 dong (journal 169 dong, dong dau 05:34:34Z)
--- 7. RAM / load ---
MemTotal 8124900 kB; MemAvailable 1531268 kB; MemFree 143444 kB; loadavg 3.14
--- 8. systemd (huong 3) ---
user@0 inactive; logind inactive; dbus inactive; loginctl khong noi duoc bus; /var/lib/systemd/linger KHONG TON TAI; /run/user/0 KHONG TON TAI; khong cron; 0 timer VCut
--- 9. .done hien co (luc stats) ---
round168-t0.done 05:43:32Z, round168-t1.done 05:52:49Z, round168-t6.done 05:56:51Z
--- 10. X11 ---
3 socket X193 (mtime 06:02Z)/X194/X195 (mtime 05:45Z); 0 Xvfb that
--- 11. watcher-167 log (doc lap) ---
333 poll (lan1 170 tren #73, lan2 163 tren #74), 344 dong, gaps {30s x303, 31s x28, 161s x1}, END 05:30:10Z (ket thuc dung han), poll cuoi 05:29:40Z, mtime truc tiep 05:30:10.290Z
--- 12. dpkg breakdown + apt history #75 ---
4 startup + 106 install + 568 status + 4 upgrade + 110 configure + 3 trigproc = 795 dong; history 1 transaction (06:01:29-06:01:38Z); 2 dong history nhac 4 goi
--- 13. watcher-168 log stats (luc stats) ---
23 dong, 16 poll, gaps {30s x12, 31s x2, 860s x1 (cua so repair)}, boot_set [576ca271], kinds {START: 1, MONITOR: 1, postboot: 1, FLAG-WRITTEN: 1}
poll cuoi 06:04:39Z (dpkg 795 md5 b9d3accb, 0 proc, gst 269, cache 110, lists 75)
```

## Phụ lục B — File làm việc trong `round168-t5/` (không stage, để đối chiếu)

- `watcher-status-at-open.txt` (mở 05:39:19Z trên #75)
- `make-watcher-168.py`, `replay-watch-168.sh` (13.892 B)
- `replay-watch-168.log` (trực tiếp; 23 dòng lúc 06:04:59Z), `replay-watch-168.nohup.log`
- `t5-stats-168.py` + `t5-stats-168-output.txt` (chạy 06:04:59Z)
- `t5-postboot-verify-576ca271.log` (form-B exit 1, 05:47:49Z), `t5-postboot-repair-576ca271.log` (06:01:38Z, exit 0), `t5-postboot-poll1-576ca271.log` (PASS exit 0), `t5-postboot-independent-576ca271.log` (PASS exit 0, verify độc lập)
- `POSTBOOT_PASS` (cờ #75, 324 B, mode repair-som-quyet-h poll=1) + `POSTBOOT_PASS-194efd93` (backup cờ #74, diff KHỚP gốc)
- `symlink-removal-75.txt` (ghi chú gỡ symlink GST 05:50Z — F-168-T5-2)
- `repaired-576ca271` (guard file: 1 repair / 1 boot đã dùng)
