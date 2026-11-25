# PHASE 9 — ROUND 167 — T5 INFRA LIMITS

**Đợt:** 167 (mở lượt cron 09:35 +07 22/11/2026 = 02:35:51Z; hạn cờ ~05:00Z, hạn cứng 05:30Z).
**Người viết:** T5-167. **Ngày:** 22/11/2026. **Boot làm việc lúc đóng:** #74 (dự kiến) 194efd93, btime 04:05:29Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #74. File này là 1 entry duy nhất stage đợt 167 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #74 (194efd93, btime 04:05:29Z) | **ĐÃ CÓ 04:10:23Z (boot+4m54s, replay-day-du, poll=0)** — verify độc lập exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269 |
| POSTBOOT_PASS #71 (ea73ac4f) | **KHÔNG CÓ** — boot thứ 10 không có cờ, không bù được |
| POSTBOOT_PASS #72 (9e089ef6) | **KHÔNG CÓ** — boot thứ 11 không có cờ, không bù được |
| POSTBOOT_PASS #73 (b643911f) | **KHÔNG CÓ** — boot thứ 12 không có cờ; replay CHẠY ĐẦY ĐỦ (1.751 dòng dpkg) nhưng postboot FAIL vì thiếu 4 gói gstreamer (bad/ugly/gl/libav); repair thủ công bị reboot #74 giết giữa chừng — cờ #73 không bao giờ được ghi |
| POSTBOOT_PASS #68 / #63 / #66 | Vẫn KHÔNG CÓ (kiểm lại) |
| Reboot trong phiên | **#74 (194efd93, btime 04:05:29Z, gap #73→#74 = 2.248 s = 37m28s)** — xảy ra lúc T5 đang chạy repair trên #73; giết cả repair + watcher-167 lần 1 |
| Watcher-167 | 2 lần khởi động, 1 log chung: lần 1 pid 18124 trên #73 (START 02:41:01Z, 170 poll, chết theo #74, poll cuối 04:05:41Z = btime #74 +12 s); lần 2 pid 4928 trên #74 (START 04:08:22Z, ĐANG CHẠY, REPLAY_DONE + FLAG-WRITTEN 04:10:23Z). Khoảng không-watcher lần 1: 2h32m41s; lần 2: 2m41s |
| Watcher-166 | Chết theo reboot #71 — xác minh độc lập từ log gốc: 56 poll, 23:40:45Z→00:08:20Z, poll cuối SAU btime #71 (00:08:00Z) **20 s** |
| Lệch khung giờ | Biên #70/#71: poll cuối watcher-166 trên #70 sau btime #71 **20 s** (mạnh hơn #70: 6 s; #68: 11 s). Biên #73/#74: poll cuối watcher-167 trên #73 sau btime #74 **12 s**. CHỈ TRÌNH SỐ THÔ — KHÔNG phán (m); giao T2-167/T2-168 đối chiếu |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua #49–#74 = **26 reboot** (nếu #74 được xác nhận; T0 đếm độc lập) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 14 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0) |
| ENOSPC | #73: 3 dòng lúc mở; #74: 1 dòng lúc mở, 5 dòng lúc stats 04:18:06Z (T9 đếm chính thức) |
| X11 | TRỐNG lúc mở #73 và #74; 1 socket X193 mới (mtime 04:11Z), 0 Xvfb thật — giao T8-167 dọn |
| RAM #74 | MemAvailable 1.659.200 kB lúc 04:18:06Z; loadavg 1,64 |
| Đồng hồ | Local ≈ Cloudflare +1 s (cả 2 lần đo đồng thời) — chuẩn, cùng họ các đợt trước |
| PUSH #8 | Trong lúc T5-167 làm việc, user đã đẩy đợt 136–165 từ main chat (HEAD 3d8eecf9, 22/11) — T5 CHỈ STAGE, KHÔNG PUSH (theo luật đứng) |

**Số hiệu boot #73/#74 là DỰ KIẾN theo đếm tuần tự — chờ parent xác nhận + T0 xác minh 9 nguồn.**
**Quyết (f) đợt 166 đã CHẤP NHẬN (m) #71 DƯƠNG theo btime; quyết (e) đợt 166: dữ kiện khung giờ boot cũ = XÁC NHẬN OVERLAP, không đổi verdict (m). T5-167 KHÔNG phán lại (m), chỉ trình số thô.**

---

## §1. Timeline (giờ Z, 22/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 00:08:00Z | Reboot #71 (ea73ac4f, btime) — gap #70→#71 = 7.355 s |
| 00:08:20Z | Poll cuối watcher-166 trên #70 (dpkg 1545, md5 5f29561e) — sau btime #71 20 s; watcher-166 chết sau đó |
| 00:08:41.274Z | Requeue run 166 lần 1 (theo T7-166/T10-166) = btime #71 +41,274 s |
| 02:05:05Z | Reboot #72 (9e089ef6, btime) — gap #71→#72 = 7.025 s |
| 02:28:01Z | Reboot #73 (b643911f, btime, epoch 1795314481) — gap #72→#73 = 1.376 s (22m56s), ngắn nhất chuỗi gần đây |
| 02:35:39Z | Hoạt động dpkg đầu trên #73 (boot+7m38s): `dpkg --configure -a` mở đầu, 2 dòng, md5 92b922f4; cache 0; lists 3; GST 0; `/var/log/apt/` CHƯA CÓ |
| 02:35:40Z | `apt-get update` pid 814 bắt đầu (replay #73) |
| 02:35:51Z | Lượt cron đợt 167 mở |
| ~02:38Z | **T5-167 mở trên #73**: uptime 611,61 s → boot 02:28:01,39Z (chênh btime 0,39 s); `uptime -s` = 02:28:01Z; /proc/1 mtime 02:28:13,09Z (+12,1 s); journal idx 0 duy nhất, first entry 02:28:13Z (+12 s) |
| 02:41:01Z | **Watcher-167 lần 1 START, pid 18124, boot b643911f (#73)** |
| ~02:48Z | `apt-get update` #73 xong (lists 28); installs bắt đầu ~02:48:34Z |
| 02:48:54Z | Giao dịch Install đầu tiên trên #73 (Start-Date) |
| 02:49:09Z → 03:53:54Z | dpkg #73: 53 → 133 → 208 → 517 → 650 → 1.094 → 1.603 → **1.751 dòng** (gói cuối xfonts-scalable); apt hết proc ~03:55Z |
| 03:55:40Z | Watcher REPLAY_DONE #73 → postboot poll0 **FAIL exit=1 — KHÔNG ghi cờ** (thiếu 4 gói gstreamer; GST 108 vs debroot 269) |
| 04:04:01Z | T5 chạy `vcut-webkit-postboot-check.sh --repair` trên #73 (log `t5-postboot-repair-b643911f.log`) |
| 04:04:41Z | Repair: GST symlink lại → debroot (watcher poll ghi gst_sys 108→269); wrapper PASS, libs PASS; apt vẫn FAIL 4 gói → đang chạy `apt-get update` |
| 04:05:29Z | **Reboot #74 (194efd93, btime, epoch 1795320329) — gap #73→#74 = 2.248 s (37m28s). Giết repair + watcher-167 lần 1. 4 gói #73 KHÔNG kịp cài; cờ #73 không bao giờ được ghi** |
| 04:05:41Z | Poll cuối watcher-167 lần 1 trên #73 (dpkg 1751, md5 adf76976, 0 proc) — sau btime #74 12 s |
| 04:06:18Z | Hoạt động dpkg đầu trên #74 (boot+49s) |
| 04:06:51Z | Giao dịch Install đầu tiên trên #74 (Start-Date); `apt-get update` #74 chỉ 3 s (04:06:51→04:06:54) |
| 04:07:43Z | T5 mở lại trên #74: uptime 134,65 s → boot 04:05:28,35Z (chênh btime 0,65 s); /proc/1 mtime 04:05:44,57Z (+15,6 s); journal first entry 04:05:45Z (+16 s); dpkg 462 dòng; cache 177; lists 37; GST 107 |
| 04:08:22Z | **Watcher-167 lần 2 START, pid 4928, boot 194efd93 (#74)** (cùng script, cùng log) |
| 04:09:35Z | dpkg #74 xong: **1.545 dòng, md5 ef7480f9** (breakdown chuẩn 1.040/178/169/106/43/9); gói cuối gstreamer1.0-tools; cache 178; lists 37; GST 269 |
| 04:10:23Z | Watcher REPLAY_DONE #74 → postboot poll0 **PASS exit 0 → FLAG-WRITTEN: cờ POSTBOOT_PASS #74 ghi (boot+4m54s)** |
| 04:17:35Z | T5 verify độc lập postboot check-only trên #74: **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269** (log `t5-postboot-independent-194efd93.log`) |
| 04:18:06Z | Stats script chạy (`t5-stats-167.py` → `t5-stats-167-output.txt`); watcher-167: 200 dòng log, 190 poll; RAM MemAvailable 1.659.200 kB; X11: 1 socket X193 (mtime 04:11Z) |
| ~04:24Z | T5 viết LIMITS này. Watcher-167 lần 2 vẫn ĐANG CHẠY (pid 4928, poll 04:23:56Z) |

Tuổi boot theo btime: #70: 7.355 s (2h02m35s); #71: 7.025 s (1h57m05s); #72: 1.376 s (22m56s); #73: 5.848 s (1h37m28s, tính tới btime #74).

---

## §2. Hướng (3) + marker + đồng hồ

Kiểm tra lại nhanh lúc stats 04:18:06Z trên #74 (`t5-stats-167.py` §8, khớp mẫu T5-166 §2):

- `systemctl is-active user@0` = **inactive**; `logind` = **inactive**; `dbus` = **inactive**.
- `loginctl show-user root` → **Linger=no**.
- `ls /run/user/0` → **không tồn tại**.
- `crontab -l` (root) → **không có cron** (no crontab for root).
- `systemctl list-timers --all` → 0 timers chạy (chỉ các timer hệ thống mặc định, không có timer nào của VCut).

→ **Hướng (3) VẪN ĐỨNG lần thứ 14 liên tiếp** (quyết (j) đợt 166 ghi nhận lần thứ 13; T5-167 kiểm lại lần thứ 14, cùng kết quả). Không có bằng chứng nào cho hướng (1)/(2) (session sống / service giữ boot).

**Marker:** `~/.config/vcut-persistence-marker` CÒN, mtime **2026-11-20 11:39:47Z không đổi** — sống qua **#49–#74 = 26 reboot** nếu #74 được xác nhận (74−49+1=26). T0-167 đếm độc lập.

**Đồng hồ:** 2 lần đo đồng thời lúc stats: local_truoc 04:18:06.087Z / Cloudflare 04:18:07 GMT / local_sau 04:18:06.862Z (lần 2 tương tự) → local ≈ Cloudflare **+1 s**, cùng họ các đợt trước. Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn.

---

## §3. Watcher-167 + POSTBOOT_PASS

### §3.1 POSTBOOT_PASS #74 — ĐÃ CÓ (replay-day-du, poll=0)

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round167-t5/POSTBOOT_PASS` (315 B, mtime 04:10:23.751Z).
- **Nội dung (nguyên văn):** `boot 194efd93-ef9b-44e9-b570-0b161c71a080 (btime 2026-11-22 04:05:29Z; watcher-167) — replay-day-du: dpkg 1545 dong; cache 178.deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T04:10:23Z; POSTBOOT_PASS moi ghi 2026-11-22T04:10:23Z poll=0 (replay-day-du); co cu d1ddd946 luu POSTBOOT_PASS-d1ddd946`
- **Replay #74 (cache-first, nhanh):** hoạt động dpkg đầu 04:06:18Z (boot+49s); giao dịch Install đầu 04:06:51Z (boot+2m22s); `apt-get update` chỉ 3 s (04:06:51→04:06:54Z); dpkg xong 04:09:35Z (boot+4m06s, 197 s cài đặt); **1.545 dòng, md5 ef7480f9**; breakdown TRÙNG KHỚP #64/#65/#67/#69/#70: **1.040 status + 178 configure + 169 install + 106 startup + 43 trigproc + 9 upgrade**; gói cuối gstreamer1.0-tools 04:09:35Z; cache 178.deb; lists 37 (mirror.cogentco.com — noble + noble-updates + noble-backports + noble-security, main/universe/multiverse/restricted); GST thư mục thật 269 file; `/var/log/apt/` có (history Start 04:09:31/End 04:09:31 + Start 04:09:35/End 04:09:35); history 50 transaction.
- **Vì sao nhanh:** cache 177.deb của #73 SỐNG QUA reboot (RV-backed) nên replay #74 cài từ cache (`apt-get install --no-download`, pid 3444 lúc 04:07Z), không tải lại. (Lý do #73 mở với cache 0 trong khi #74 mở với cache 177: CHƯA RÕ — giả thuyết ghi nhận, chưa kết luận: autoclean cuối pass #72 có thể đã xóa cache khi lists gần trống; chỉ ghi nhận, không kết luận.)
- **Verify độc lập (T5, 04:17:35Z):** chạy lại postboot check-only, **exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269, isomp4 + libav đủ** (log `t5-postboot-independent-194efd93.log`); watcher poll0 log giống hệt PASS. Backup cờ #70 (`POSTBOOT_PASS-d1ddd946`) đã `diff` KHỚP file gốc round166-t5.
- **Cờ #74 là cờ đầu tiên sau 3 boot liên tiếp không có cờ (#71–#73).**

### §3.2 POSTBOOT_PASS #73 — replay xong NHƯNG FAIL, repair bị reboot giết (phát hiện quan trọng nhất đợt)

**Diễn biến replay #73 (theo dõi bằng monitor nền mỗi ~8 phút + watcher poll 30 s):**

- Lúc T5 mở (~02:38Z): replay ĐANG CHẠY — `apt-get update` pid 814 (từ ~02:35:40Z); dpkg 2 dòng md5 92b922f4 mtime 02:35:39Z; cache 0; lists 3; GST 0; `/var/log/apt/` CHƯA CÓ.
- Update xong ~02:48Z (lists 28); installs bắt đầu ~02:48:34Z. dpkg: 2 → 53 (02:49:09Z) → 133 (02:52:17Z, đóng băng tới ~03:00:05Z trong lúc apt tải) → 208 (03:00:43Z) → 517 (03:08:24Z) → 650 (03:11:45Z, đóng băng tới ~03:34Z trong lúc tải plugins-bad, cache 77→126) → 1.094 (03:41:16Z, gst_sys 31→108) → 1.603 (03:49:57Z) → **1.751 dòng, mtime 03:53:54Z**, gói cuối xfonts-scalable; apt hết proc ~03:55Z.
- Tổng: update ~12–13 phút (giống #67: 649–770 s) + installs ~65 phút (giao dịch đầu 02:48:54Z → cuối 03:53:54Z = 3.900 s) — **replay CHẬM NHẤT trong các boot gần đây** (so #70: 125 s). Boot→dpkg-ổn-định = 5.153 s (1h25m53s).
- Watcher REPLAY_DONE 03:55:40Z (dpkg 1751, gst_sys=108, cache=177, lists=28) → postboot poll0 **FAIL exit=1 — KHÔNG ghi cờ** (log `t5-postboot-poll0-b643911f.log`): FAIL GST thiếu isomp4=0 libav=1 (hệ thống 108 vs debroot 269); **FAIL apt: chưa cài 4 gói gstreamer1.0-plugins-bad, gstreamer1.0-plugins-ugly, gstreamer1.0-gl, gstreamer1.0-libav**; wrapper PASS, libs PASS 5/5. 7/11 gói đã cài (base, good, x, libavif16, libgstreamer1.0-0, libevent, libevdev2).

**Chẩn đoán 4 gói thiếu (đo trực tiếp — nguyên nhân gốc CHƯA xác định, KHÔNG bịa):**

- 4 gói đều có .deb TRONG CACHE (gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1) và candidate resolve được từ mirror.cogentco.com (`apt-cache policy` đều có candidate).
- Nhưng dpkg chưa từng chạm: 0 dòng dpkg.log chứa tên 4 gói; `dpkg -l` không có; `dpkg-query` = not-installed/unknown.
- history.log 92 transaction = 92 Install, KHÔNG transaction nào chứa 4 gói (kể cả các lib phụ thuộc của chúng thì CÓ: libgstreamer-gl1.0-0, libgstreamer-plugins-bad1.0-0, libavcodec60…).
- term.log đúng 92 "Log started" = 92 transaction thành công, KHÔNG có lỗi (grep `could not|broken|held|unmet|failed|error|E:` chỉ ra 3 dòng lành); journal KHÔNG có OOM/killed process; eipp.log.xz trống.
- 4 lần `apt-get install` 4 gói quan sát được qua pgrep (gl pid 30577 ~02:52–02:59; libav pid 37504 ~03:11–03:23; bad pid 39340 ~03:17–03:34; + libavif16/libsecret/liblqr/libvidstab-dev là các gói khác) đều thoát không cài, không để lại transaction/log lỗi.
- **Tương phản với #74:** cùng bộ gói intent (libvidstab-dev, nasm, libc6-dbg, fonts-*, pocketsphinx-en-us đều CÓ trong history #74; 4 gói gstreamer mỗi gói 1 lần), #74 cài đủ trong 50 transaction / 1.545 dòng (breakdown chuẩn), còn #73 cần 92 transaction / 1.751 dòng (+42 transaction, +206 dòng) mà vẫn thiếu 4 gói. Số dòng thừa PHÙ HỢP VỚI (nhưng chưa chứng minh là do) việc các lần cài top-level thất bại khiến dependency phải cài thành các transaction riêng lẻ. **Nguyên nhân gốc 4 gói bị replay bỏ qua: CHƯA XÁC ĐỊNH — giao điều tra (replay cell) đợt sau, KHÔNG tự kết luận.**
- Breakdown dpkg #73 KHÔNG có (log đã bị rebuild #74 ghi đè; chỉ còn số cuối 1.751 dòng + md5 adf76976 từ watcher poll) — ghi nhận thiếu, không suy đoán.
- Lists #73 = 28 (chỉ biết số đếm; thành phần không được liệt kê đầy đủ lúc đó). Chênh 9 so với 37 của #74 — đúng bằng số entry noble-security trên #74; đây là suy ra từ số đếm, không phải quan sát trực tiếp.

**Repair thủ công (đường cứu chữa theo thiết kế — postboot script tự kết luận "chạy lại với --repair"):**

- Chạy `bash vcut-webkit-postboot-check.sh --repair` lúc **04:04:01Z** (log `t5-postboot-repair-b643911f.log`, 1.748 B; boot+1h36m00s).
- Repair kịp: wrapper PASS, libs PASS, GST FAIL → **"REPAIRED GST: symlink lại -> debroot (269 file)"** (watcher poll 04:04:41Z ghi gst_sys 108→269), rồi apt FAIL 4 gói → "INFO apt: lists có thể trống sau reboot — chạy apt-get update trước khi install" → đang chạy `apt-get update` thì **reboot #74 (btime 04:05:29Z) giết cả repair + watcher** (repair chỉ sống 88 s). 4 gói KHÔNG kịp cài; cờ #73 không bao giờ được ghi.
- Thêm: exec service restart giữa lúc repair chạy (phiên exec proc_03282922aac2 bị gián đoạn ~04:06:16Z) — repair chết do REBOOT CELL, không phải do restart exec service; log repair còn nguyên.
- Mâu thuẫn chữ/log trong script postboot: header comment dòng 595 ghi "(ii) nhánh symlink GST trong --repair BỎ" nhưng code dòng 734 VẪN CÓ `ln -sfn "$DEBROOT_GST" "$GST_SYS" && say "REPAIRED GST: symlink lại -> debroot ($N_DEB file)"` và bước này ĐÃ CHẠY trên #73. Ghi nhận mâu thuẫn (comment cũ / code còn), không tự sửa script (script thuộc repo).

### §3.3 POSTBOOT_PASS #71 / #72 — KHÔNG CÓ, không bù được

- **#71 (ea73ac4f):** grep toàn bộ `POSTBOOT_PASS*` dưới `hidden_files/round*/` 0 kết quả (kiểm lúc mở 02:38Z + kiểm lại bằng stats script §2c). **Boot thứ 10 không có cờ.**
- **#72 (9e089ef6):** grep 0 kết quả, kiểm lại §2c. **Boot thứ 11 không có cờ.**
- **#73 (b643911f):** grep 0 kết quả (kiểm lúc mở + §2c + kiểm lại 04:07Z sau reboot #74). **Boot thứ 12 không có cờ.**
- Không bù được cho cả 3 (cùng quy tắc #63/#66/#68: cờ chỉ chứng nhận phép đo trực tiếp trên boot sống; #71/#72/#73 đều chết trước khi có phiên T5 nào).
- **#68 (0c8a94aa): VẪN KHÔNG CÓ** (kiểm lại lúc mở). #63 (94d22520) / #66 (edb2acdb) cũng KHÔNG CÓ (kiểm lại §2c). #70/#69/#67 còn (xác minh lại nội dung: #70 23:40:45Z, #69 20:43:50Z — khớp LIMITS cũ).
- Đếm boot không cờ tới nay: #51, #53, #54, #55, #57, #60, #63, #66, #68 (9, theo T5-166) + #71 (10) + #72 (11) + #73 (12).

### §3.4 Watcher-167 — 2 lần khởi động, 1 log chung

**Lần 1 — START 02:41:01Z, pid 18124, boot b643911f (#73), END 05:30:00Z (hạn).**
Log `replay-watch-167.log` (TRỰC TIẾP, không symlink — F-166-T5-1 ĐÃ SỬA ở tầng generator). Init: dpkg 2 dòng md5 92b922f4 mtime 02:35:39Z, cache 0, lists 3, gst_sys 0. Poll đều 30/31 s. **Chết theo reboot #74**: poll cuối **04:05:41Z** (nhãn b643911f, dpkg 1751 md5 adf76976, 0 proc) — SAU btime #74 (04:05:29Z) **12 s**; tổng **170 poll** (02:41:01Z→04:05:41Z); 0 NEWBOOT/0 END/0 STOP.
Khoảng không-watcher lần 1: **00:08:20Z→02:41:01Z = 9.161 s = 2h32m41s** (dài hơn 1h35m14s đợt 166, ngắn hơn 2h37m08s đợt 165).
Spawn lần 1 có sự cố nhỏ: exec báo `output_drain_timeout` (session proc_0043c2dbd10d, failed) nhưng watcher vẫn chạy (pid 18124, START line có); lỗi `cat: replay-watch-167.log: No such file` lúc 02:41:03Z là do chính T5 dùng `cd... &&... &` khiến `cd` cũng bị background — sai của T5, không phải lỗi watcher (xem §9 F-167-T5-2).

**Lần 2 (khởi động lại trên #74) — START 04:08:22Z, pid 4928, boot 194efd93**, cùng script `replay-watch-167.sh` (header comment vẫn ghi #73 — chỉ là comment; START line mới ghi đúng boot #74; log append chung file, hiện có 2 dòng START). Init: dpkg 836 dòng md5 b818828a mtime 04:08:22Z, cache 177, lists 37, gst_sys 107. Poll đầu 04:08:22Z: dpkg 839, apt=[4581], dpkg=[4599]. REPLAY_DONE 04:10:23Z → FLAG-WRITTEN 04:10:23Z (poll=0). **Đang chạy lúc đóng stats (ALIVE, kill -0 4928)**. Khoảng không-watcher lần 2: **04:05:41Z→04:08:22Z = 161 s = 2m41s**.

Tổng log watcher-167 lúc stats 04:18:06Z: 200 dòng, **190 poll**, gaps {30 s ×175, 31 s ×13, 161 s ×1} (161 s là khoảng giữa 2 lần khởi động, không phải poll gap trong một lần chạy); boot_set [194efd93, b643911f]; kinds (lưu ý: bộ đếm script gộp dòng "REPLAY_DONE nhung postboot FAIL" vào REPLAY_DONE nên kinds ghi REPLAY_DONE: 3 — thực tế là 2 sự kiện REPLAY_DONE + 1 dòng FAIL theo sau; postboot: 2; FLAG-WRITTEN: 1). Poll cuối lúc stats: 04:17:55Z (dpkg 1545 md5 ef7480f9, 0 proc, gst 269, cache 178, lists 37). Lúc viết LIMITS (~04:24Z) watcher vẫn poll (04:23:56Z).

**Generator `make-watcher-167.py`:** lần chạy đầu ASSERT FAIL vì `LOG=` trong nguồn 166 vẫn là `replay-watch-165.log` (lỗi F-166-T5-1 lệch 1 đợt: generator 166 thay "replay-watch-165.log" nhưng nguồn 165 ghi 164.log) — đã sửa generator thay ĐÚNG chuỗi trong nguồn (`replay-watch-165.log`→`replay-watch-167.log` + phòng thủ `replay-watch-166.log`), assert thêm, chạy lại OK. Verify: `LOG=$DIR/replay-watch-167.log` (dòng 92), DIR=round167-t5, OLD_T5_DIR=round166-t5, END_EPOCH 2026-11-22 05:30:00 UTC, `bash -n` OK; thân script không còn d1ddd946/22:05:25/2026-11-22 02:30/NHANH NHAT; "han cung 23:30:00Z" literal cũ trong dòng END đã sửa thành 05:30:00Z. Header mới ghi đầy đủ: #73 dự kiến, watcher-166 chết theo #71, caveat khung giờ #70/#71, khoảng không-watcher, #71/#72/#73 chưa có cờ, replay #73 đang chạy, OVERLAP #62 phán đúng + KHÔNG thừa nhận H2.

**Watcher-166 (đợt trước) — xác minh độc lập từ log gốc:** **56 poll**, 23:40:45Z→00:08:20Z, gaps {30 s ×50, 31 s ×5}, 61 dòng, md5 5f29561e, 1.545 dòng, boot d1ddd946, 0 NEWBOOT/0 END/0 STOP, log mtime trực tiếp 00:08:20.245Z (lưu ý: stats script đọc mtime qua symlink replay-watch-166.log cho ra 23:42:59.842Z — đó là mtime của chính symlink, không phải file log; dùng số đọc trực tiếp). pid 26422 chết (`kill -0`: No such process). Khớp quyết (j) đợt 166.

---

## §4. Boot #73/#74 + đồng hồ

### §4.1 Xác minh boot #74 (boot hiện tại)

- boot_id: `194efd93-ef9b-44e9-b570-0b161c71a080`; btime /proc/stat: **04:05:29Z (epoch 1795320329)**.
- Lúc 04:07:43Z: uptime 134,65 s → boot 04:05:28,35Z (chênh btime 0,65 s — do thời điểm đọc không đồng thời, cùng họ F-166-T5-3); /proc/1 mtime 04:05:44,57Z (+15,6 s); journal first entry 04:05:45Z (+16 s).
- Stats script 04:18:06Z: uptime 756,80 s → boot 04:05:29,2Z (chênh 0,2 s).
- `uptime -s` = 04:05:29Z — KHỚP btime.
- Boot #73: btime 02:28:01Z (epoch 1795314481); lúc mở uptime 611,61 s → boot 02:28:01,39Z (chênh 0,39 s); `uptime -s` = 02:28:01Z; /proc/1 mtime 02:28:13,09Z (+12,1 s); journal first entry 02:28:13Z (+12 s).

### §4.2 Watcher-166 chết theo #71 + caveat khung giờ #70/#71 (số thô cho T2-167)

Theo mẫu T5-165 §4.2 / T5-166 §4.2 — **chỉ đo số, KHÔNG phán (m)**:

- Poll cuối watcher-166 **00:08:20Z trên #70 (d1ddd946, dpkg 1545 md5 5f29561e)**, SAU btime #71 (00:08:00Z) **20 s** — hai khung lệch ≥20 s (mạnh hơn #70: 6 s; #68: 11 s).
- Reboot thật ∈ (00:08:20Z, ~00:08:50Z] (poll tiếp ~00:08:50Z không bao giờ tới; jitter ±1 s).
- Requeue run 166 lần 1 lúc 00:08:41.274Z = btime +41,274 s (theo T7-166/T10-166).
- Offset requeue thật (neo bằng poll cuối): phép trừ trực tiếp cho cửa **[−8,7 s, 21,3 s)** (cửa cứng với jitter ±1 s: [−9,7 s, 22,3 s)); giới hạn vật lý (requeue phải xảy ra SAU reboot thật) cắt thành **[0 s, 21,3 s)**. HOÀN TOÀN DƯỚI biên dưới dải dương 33–49,8 s theo cách tính này.
- **NHƯNG** theo quyết (e)/(f) đợt 166, dữ kiện khung giờ boot cũ là XÁC NHẬN OVERLAP, không đổi verdict (m); parent đã CHẤP NHẬN #71 DƯƠNG theo btime (n ứng viên 24→25 nhánh khuyến nghị / 25→26 nhánh #56 ÂM). T5 KHÔNG lật, chỉ trình số thô cho T2-167 đối chiếu độc lập.
- Biên #71/#72 và #72/#73: KHÔNG có dữ kiện watcher (watcher-166 đã chết từ #71; không watcher nào chạy 00:08:20Z→02:41:01Z) — ghi rõ là không đo được, không suy đoán.

### §4.3 Watcher-167 chết theo #74 + caveat khung giờ #73/#74 (số thô)

- Poll cuối watcher-167 lần 1 **04:05:41Z trên #73 (b643911f, dpkg 1751 md5 adf76976, 0 proc)**, SAU btime #74 (04:05:29Z) **12 s**.
- Reboot thật ∈ (04:05:41Z, ~04:06:11Z].
- Requeue run 167 tại #74 thuộc T7-167 (T5 chưa có số — KHÔNG tự tính offset). Đối chiếu độc lập thuộc T2-167/T2-168.

### §4.4 Tuổi boot theo khung thật (bổ sung cho T2)

- #70 chết trong khoảng (00:08:20Z, 00:08:41.274Z] theo poll cuối + requeue (xem §4.2) — tuổi thật ∈ (7.355 s, 7.376 s] tính từ btime #70.
- #73 chết trong khoảng (04:05:41Z, ~04:06:11Z] — tuổi thật ∈ (5.860 s, 5.890 s] tính từ btime #73 (btime-tuổi 5.848 s là cận dưới).

---

## §5. Quy tắc đứng (3)

(Trích từ LIMITS các đợt trước — giữ nguyên, không đổi.)

1. **Cờ POSTBOOT_PASS chỉ chứng nhận phép đo trực tiếp trên boot sống.** Boot đã chết trước khi có phiên T5 thì KHÔNG bù được (áp dụng #71/#72/#73 đợt này; #63/#66/#68 trước đó).
2. **Watcher chết theo reboot là bình thường** — watcher là tiến trình trong cell, không sống qua reboot. Khoảng không-watcher được đo và ghi (đợt này: 2h32m41s + 2m41s).
3. **Hướng (3) đứng:** không có bằng chứng session/service nào giữ boot sống qua reboot (kiểm lại lần thứ 14 đợt này — xem §2).
4. **Khung giờ boot cũ = XÁC NHẬN OVERLAP, không đổi verdict (m)** (quyết (e) đợt 166). T5 chỉ đo số thô tại biên reboot, giao T2 đối chiếu.
5. **Không kết luận nguyên nhân khi chưa có bằng chứng trực tiếp** (áp dụng cho 4 gói #73 — xem §3.2).
6. **Chỉ stage, KHÔNG PUSH** — user tự push sau từ main chat.

---

## §6. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM (stats 04:18:06Z, boot #74):** MemTotal 8.124.900 kB; MemAvailable 1.659.200 kB; MemFree 268.072 kB; loadavg 1,64. (T9 đo headroom chính thức — T5 chỉ ghi snapshot.)

**ENOSPC (T9 đếm chính thức; T5 chỉ ghi snapshot):**
- #73: 3 dòng lúc mở 02:39Z (journal 86 dòng, dòng đầu 02:36:50Z = boot+8m49s).
- #74: 1 dòng lúc 04:07:43Z (journal 64 dòng); stats 04:18:06Z: **5 dòng** (journal 102 dòng, dòng đầu 04:07:19Z = boot+1m50s).

**X11:**
- TRỐNG lúc mở #73 (02:38Z) và lúc mở #74 (04:07:43Z); 0 Xvfb thật (`pgrep -x Xvfb` exit 1) cả hai lần.
- Stats 04:18:06Z: **1 socket X193 mới, mtime 04:11Z, 0 Xvfb thật** — xuất hiện trong phiên #74, sau lúc T5 mở lại. Cùng mẫu các đợt trước (3 socket X193/X194/X195 mtime 23:44Z đợt 166) — **giao T8-167 dọn**. Lúc viết LIMITS (~04:24Z) vẫn chỉ có X193.

**Journal:** #73: 86 dòng lúc mở, dòng đầu 02:36:50Z. #74: 64 dòng lúc 04:07:43Z; 102 dòng lúc 04:18:06Z, dòng đầu 04:07:19Z. Không có OOM/killed process trên #73 (đã grep lúc chẩn đoán).

---

## §7. Nợ mở chuyển đợt 168 (T5-168 sở hữu)

1. **Watcher-167 (pid 4928) tiếp tục giám sát tới 05:30:00Z 22/11** — T5-168 kiểm tra log cuối + poll cuối + END line (hoặc chết theo reboot mới).
2. **POSTBOOT_PASS #71/#72/#73 KHÔNG CÓ** (boot thứ 10/11/12 lọt, không bù được); #68/#63/#66 vẫn không có.
3. **Marker 26 reboot #49–#74** (T0 đếm độc lập).
4. **Caveat khung giờ #70/#71 (20 s) + #73/#74 (12 s)** giao T2-168 đối chiếu; (m) #71 đã CHẤP NHẬN theo quyết (f) đợt 166 — không phán lại. (m) #56 vẫn có điều kiện (T2-166 không thu hẹp được cửa lần thứ chín: R 2,56251–2,66817 / J 2,566–2,80753 s); n ứng viên 24→25 sau #71 (chưa tính #74 — thuộc T7-167/T2-167).
5. **Nguyên nhân gốc 4 gói #73 bị replay bỏ qua CHƯA xác định** — giao điều tra (replay cell) đợt sau, KHÔNG tự kết luận. Câu hỏi kèm: vì sao cùng bộ intent, #73 cần 92 transaction / 1.751 dòng mà #74 chỉ cần 50 / 1.545 dòng; vì sao `apt-get update` #73 mất ~12–13 phút mà #74 chỉ 3 s; vì sao cache 177.deb sống qua reboot #74 trong khi #73 mở với cache 0.
6. **Mâu thuẫn comment/code trong postboot script** (dòng 595 "(ii) nhánh symlink GST trong --repair BỎ" vs dòng 734 code symlink vẫn chạy) — giao chủ script đọc và sửa comment hoặc code cho khớp.
7. **Cache 177.deb sống qua reboot #74** (kiểm lại đợt sau: chuỗi sống có kéo dài không; #73 mở với cache 0 vẫn chưa rõ nguyên nhân).
8. TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet.
9. G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời — để yên, không nhắc lại). R9 (a) vẫn chờ user (số đếm vẫn là 16).

---

## §8. Đề xuất cho parent

- **(a) Chấp nhận kết quả T5-167:** cờ #74 (replay-day-du, poll=0, verify độc lập exit 0); #71/#72/#73 không cờ, không bù được; watcher-167 2 lần khởi động, khoảng không-watcher 2h32m41s + 2m41s; hướng (3) lần thứ 14; marker 26 reboot.
- **(b) Số hiệu #73/#74 (dự kiến):** xác nhận khi T0-167 hoàn tất xác minh 9 nguồn (đặc biệt btime #74 04:05:29Z và boot_id 194efd93).
- **(c) Không lật (m) #71:** số thô §4.2 (offset requeue ∈ [0 s, 21,3 s) theo poll cuối) hoàn toàn dưới dải 33–49,8 s — nhưng theo quyết (e)/(f) đợt 166 đây là OVERLAP đã biết, verdict DƯƠNG theo btime vẫn đứng. Giao T2-167 đối chiếu độc lập; T5 không phán lại.
- **(d) Điều tra 4 gói #73:** giao một luồng đợt sau đọc replay cell + apt/dpkg log còn sót (monitor log, watcher poll, history/term — dpkg.log #73 đã mất do rebuild #74) để tìm nguyên nhân gốc. Đây là lần đầu replay chạy đầy đủ mà vẫn thiếu gói top-level dù .deb đã có trong cache — mẫu lỗi mới, đáng điều tra trước khi nó tái diễn trên boot khác.
- **(e) X11 X193 (04:11Z):** giao T8-167 dọn theo mẫu các đợt trước.
- **(f) Postboot script dòng 595:** giao chủ script sửa comment cho khớp code (hoặc ngược lại).

---

## §9. Sai số của chính T5-167 (ghi để đợt sau khỏi lặp)

- **F-167-T5-1 — Generator LOG= lệch 1 đợt (ĐÃ SỬA):** lần chạy đầu `make-watcher-167.py` ASSERT FAIL vì `LOG=` trong nguồn 166 vẫn là `replay-watch-165.log` (lỗi F-166-T5-1 lệch 1 đợt: generator 166 thay "replay-watch-165.log" nhưng nguồn 165 ghi 164.log). Đã sửa generator thay ĐÚNG chuỗi trong nguồn (`replay-watch-165.log`→`replay-watch-167.log` + phòng thủ `replay-watch-166.log`), assert thêm, chạy lại OK. Verify: `LOG=$DIR/replay-watch-167.log` (dòng 92), DIR=round167-t5, OLD_T5_DIR=round166-t5, END_EPOCH 2026-11-22 05:30:00 UTC, `bash -n` OK.
- **F-167-T5-2 — Spawn lần 1 `output_drain_timeout` + lỗi `cat` (watcher vẫn chạy):** exec báo `output_drain_timeout` (session proc_0043c2dbd10d, failed) nhưng watcher vẫn chạy (pid 18124, START line có); lỗi `cat: replay-watch-167.log: No such file` lúc 02:41:03Z là do chính T5 dùng `cd... &&... &` khiến `cd` cũng bị background — sai của T5, không phải lỗi watcher. Đã verify độc lập bằng ps + START line + poll.
- **F-167-T5-3 — Stats script §4 `watcher167_ps=KHONG-CHAY` là ÂM TÍNH GIẢ (ĐÃ XÁC MINH, ĐÃ SỬA SCRIPT):** pattern pgrep `'bash replay-watch-167.sh'` không khớp vì lần khởi động lại dùng đường dẫn tuyệt đối nên cmdline watcher là `bash /home/hatch/.../replay-watch-167.sh`. Watcher THỰC SỰ ĐANG CHẠY (ps pid 4928, ppid 1, elapsed 12:27; poll 04:23:56Z; kill -0 ALIVE). Đã sửa pattern trong `t5-stats-167.py` thành `'replay-watch-167.sh'` (khớp cả đường dẫn tương đối lẫn tuyệt đối). Bài học: pgrep -f với tiền tố `bash ` là mong manh theo cách gọi script — dùng tên file trần.
- **F-167-T5-4 — Nhãn stats script sai số boot (ĐÃ SỬA SCRIPT, nội dung đúng):** `t5-stats-167.py` ghi nhãn §3c "POSTBOOT_PASS #73" và §12 "apt history #73" trong khi nội dung là cờ #74 / history #74 (lỗi lúc T5 viết script, copy nhãn từ đợt trước mà không đổi số). Đã sửa nhãn trong script (dòng 120, 215); file output `t5-stats-167-output.txt` đã ghi thì KHÔNG sửa ngược — khi trích vào LIMITS này phải ghi đúng là #74 (xem Phụ lục A, có ghi chú). Tương tự, kinds REPLAY_DONE trong log stats gộp cả dòng "REPLAY_DONE nhung postboot FAIL" — thực tế là 2 sự kiện REPLAY_DONE + 1 dòng FAIL (xem §3.4).
- **F-167-T5-5 — Ước lượng uptime→btime #74 lúc 04:07:43Z lệch 0,65 s** do đọc không đồng thời (uptime 134,65 s → boot 04:05:28,35Z vs btime 04:05:29Z) — cùng họ F-166-T5-3; số stats script sau đó khớp 0,2 s (uptime 756,80 s → boot 04:05:29,2Z). Dùng btime /proc/stat làm chuẩn, uptime chỉ để kiểm chéo.
- **F-167-T5-6 — Mtime watcher-166 qua symlink gây nhầm:** stats script đọc mtime `replay-watch-166.log` qua symlink cho ra 23:42:59.842Z — đó là mtime của chính symlink, không phải file log (file log thật mtime 00:08:20.245Z, đọc trực tiếp). Dùng số đọc trực tiếp trong LIMITS này.

---

## §10. Batch stage

- **File stage:** `~/workspace/repo-1/docs/PHASE9_ROUND167_T5_INFRA_LIMITS.md` (file này).
- **Paths file:** `~/workspace/repo-1-push/paths-loop/phase9-round167-t5-infra.txt` (NUL-delimited, 1 entry — chỉ file text, KHÔNG binary).
- **Verify:** read-back bằng `od -c` sau khi stage (theo mẫu T5-166).
- **KHÔNG PUSH** — user tự push sau từ main chat.
- Các file làm việc trong `round167-t5/` (watcher script/log, stats script/output, postboot log, cờ POSTBOOT_PASS + backup) KHÔNG stage đợt này (theo mẫu T5-166: chỉ stage LIMITS); chúng nằm trên đĩa để T10/parent đối chiếu.

---

## Phụ lục A — Trích stats output (`t5-stats-167-output.txt`, chạy 04:18:06Z)

> Ghi chú: nhãn §3c/§12 trong file output gốc ghi "#73" — **SAI, nội dung là #74** (F-167-T5-4). Trích dưới đây đã sửa nhãn cho đúng. File output đầy đủ còn trên đĩa tại `round167-t5/t5-stats-167-output.txt`.

```
--- 1. boot id + uptime ---
boot_id=194efd93-ef9b-44e9-b570-0b161c71a080
btime=1795320329 (2026-11-22 04:05:29 UTC)
uptime=756.8 (boot 2026-11-22 04:05:29.2 UTC)
clock: local_truoc=2026-11-22T04:18:06.087Z CF=Sat, 22 Nov 2026 04:18:07 GMT local_sau=2026-11-22T04:18:06.862Z (lan 2 tuong tu)
--- 2a. marker ---
marker_mtime=2026-11-20 11:39:47.000000000 +0000
--- 2b. grep POSTBOOT_PASS (tat ca round) ---
#d1ddd946: round166-t5/POSTBOOT_PASS, round167-t5/POSTBOOT_PASS-d1ddd946, round167-t5/POSTBOOT_PASS
#f1d4ce1a: round165-t5/POSTBOOT_PASS, round166-t5/POSTBOOT_PASS-9a1a9319
#ea73ac4f (#71): 0 ket qua — KHONG CO
#9e089ef6 (#72): 0 ket qua — KHONG CO
#b643911f (#73): 0 ket qua — KHONG CO
#0c8a94aa (#68): 0 ket qua — KHONG CO
#94d22520 (#63): 0 ket qua — KHONG CO
#edb2acdb (#66): 0 ket qua — KHONG CO
--- 3. round166-t5/POSTBOOT_PASS (#70, xac minh lai) ---
boot d1ddd946-f9f3-4561-86e8-5eb3edceb6cc (btime 2026-11-21 22:05:25Z; watcher-166) — replay-day-du: dpkg 1545 dong; cache 178.deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T23:40:45Z; POSTBOOT_PASS moi ghi 2026-11-21T23:40:45Z poll=0 (replay-day-du); co cu 9a1a9319 luu POSTBOOT_PASS-9a1a9319
--- 3b. round165-t5/POSTBOOT_PASS (#69) ---
boot 9a1a9319-3786-4add-8ffa-c51a1027946e (btime 2026-11-21 20:09:31Z; watcher-165) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-21T20:43:50Z; POSTBOOT_PASS moi ghi 2026-11-21T20:43:50Z poll=0 (replay-day-du); co cu f1d4ce1a luu POSTBOOT_PASS-f1d4ce1a
--- 3c. POSTBOOT_PASS #74 (round167-t5) [nhan goc ghi '#73' — SAI] ---
boot 194efd93-ef9b-44e9-b570-0b161c71a080 (btime 2026-11-22 04:05:29Z; watcher-167) — replay-day-du: dpkg 1545 dong; cache 178.deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-22T04:10:23Z; POSTBOOT_PASS moi ghi 2026-11-22T04:10:23Z poll=0 (replay-day-du); co cu d1ddd946 luu POSTBOOT_PASS-d1ddd946
mtime: 2026-11-22 04:10:23.751Z
gst_sys_files=269
apt_procs= (trong)
watcher167_ps=KHONG-CHAY   <-- AM TINH GIA, xem F-167-T5-3 (watcher that su ALIVE pid 4928)
watcher166_kill0=DEAD
--- 5. kiem tra goi postboot #74 ---
11/11 goi da cai (bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1); 5/5 lib; GST 269 = debroot 269
--- 6. ENOSPC ---
#74: 5 dong (journal 102 dong, dong dau 04:07:19Z)
--- 7. RAM / load ---
MemTotal 8124900 kB; MemAvailable 1659200 kB; MemFree 268072 kB; loadavg 1.64
--- 8. systemd (huong 3) ---
user@0 inactive; logind inactive; dbus inactive; Linger=no; /run/user/0 KHONG TON TAI; khong cron; 0 timer VCut
--- 9. .done hien co (luc stats) ---
round167-t0.done 02:41:54Z, round167-t1.done 02:52:54Z, round167-t2.done 02:57:30Z, round167-t6.done 02:51:30Z
--- 10. X11 ---
1 socket X193 (mtime 04:11Z); 0 Xvfb that
--- 11. watcher-166 log (doc lap) ---
56 poll, 23:40:45Z->00:08:20Z, gaps {30s x50, 31s x5}, 61 dong, md5 5f29561e, 1545 dong, boot d1ddd946, 0 NEWBOOT/0 END/0 STOP, mtime truc tiep 00:08:20.245Z
--- 12. dpkg breakdown + apt history #74 [nhan goc ghi '#73' — SAI] ---
1040 status + 178 configure + 169 install + 106 startup + 43 trigproc + 9 upgrade = 1545 dong; history 50 transaction; goi cuoi xfonts-scalable / gstreamer1.0-tools; update 04:06:51->04:06:54 (3 s)
--- 13. watcher-167 log stats ---
200 dong, 190 poll, gaps {30s x175, 31s x13, 161s x1}, boot_set [194efd93, b643911f], kinds {REPLAY_DONE: 3 (gom 1 dong FAIL), postboot: 2, FLAG-WRITTEN: 1, START: 2, MONITOR: 2}
poll cuoi 04:17:55Z (dpkg 1545 md5 ef7480f9, 0 proc, gst 269, cache 178, lists 37)
```

## Phụ lục B — File làm việc trong `round167-t5/` (không stage, để đối chiếu)

- `watcher-status-at-open.txt` (mở ~02:38Z trên #73)
- `make-watcher-167.py`, `replay-watch-167.sh` (13.364 B)
- `replay-watch-167.log` (trực tiếp; 200 dòng lúc 04:18:06Z), `replay-watch-167.nohup.log`
- `t5-stats-167.py` + `t5-stats-167-output.txt` (chạy 04:18:06Z)
- `t5-postboot-poll0-b643911f.log` (FAIL exit 1, 03:55:40Z), `t5-postboot-repair-b643911f.log` (1.748 B, bị gián đoạn), `t5-postboot-poll0-194efd93.log` (PASS), `t5-postboot-independent-194efd93.log` (PASS exit 0)
- `POSTBOOT_PASS` (cờ #74, 315 B) + `POSTBOOT_PASS-d1ddd946` (backup cờ #70, diff KHỚP gốc)
- `watcher-restart-74.txt` (ghi chú reboot #74 + khởi động lại watcher)
