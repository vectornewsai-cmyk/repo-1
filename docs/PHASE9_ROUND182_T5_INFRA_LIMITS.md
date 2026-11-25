# PHASE 9 — ROUND 182 — T5 INFRA LIMITS

**Đợt:** 182 (mở lượt cron 09:35:51 +07 24/11/2026 = 02:35:51Z; hạn cờ ~05:00Z, hạn cứng ~05:35Z 24/11; T5 đóng ~02:59Z — sớm, cờ xong 02:55:07Z).
**Người viết:** T5-182. **Ngày:** 24/11/2026. **Boot làm việc lúc đóng:** #99 ỨNG VIÊN (T0-182 chưa xác minh lúc T5 đóng) 9897d4b4, btime 01:11:46Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #99 (replay-đầy-đủ, poll=0, KHÔNG caveat — §3.1) + #98/#96/#95 VẪN CÓ + #97 VẪN KHÔNG CÓ (tổng boot không cờ GIỮ 21) + KHÔNG sửa file repo nào đợt này ngoài LIMITS này. File này là 1 entry stage duy nhất đợt 182 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #99 (9897d4b4, btime 01:11:46Z) | **ĐÃ CÓ 02:55:07Z (boot+1h43m21s, replay-đầy-đủ, poll=0, KHÔNG caveat)** — watcher-182 REPLAY_DONE poll đầu → poll0 exit=0; verify độc lập exit=0; 11/11 NEED + 5/5 lib; GST 269=269 **thư mục thật**; **tools ĐÃ CÀI**; libc-bin 8.12 |
| Replay #99 | **ĐẦY ĐỦ, không cần repair** — heal 01:12:29Z (boot+43 s) → 01:17:27Z (boot+341 s); dpkg 1.468 dòng; 213 status installed; 170 configure; history 50 transaction; term.log 0 lỗi; cache 174; lists 37 — GIỐNG #95, KHÁC #98 (đình trệ → repair) |
| POSTBOOT_PASS #98 (e62eef3f) | **VẪN CÓ** (00:16:31Z, repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 181); backup byte-identical trong round182-t5 (md5 26452ec1) |
| POSTBOOT_PASS #96 (8d2a69df) | **VẪN CÓ** (22:08:08Z, repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 180); mtime + md5 KHÔNG ĐỔI (50869e4e) |
| POSTBOOT_PASS #95 (95b483a2) | **VẪN CÓ** (20:59:47Z, replay, poll=0, KHÔNG caveat — parent CHẤP NHẬN (c) đợt 180); md5 KHÔNG ĐỔI (f8cd6d46) |
| POSTBOOT_PASS #97 (9e440707) | **VẪN KHÔNG CÓ** — grep 0 file POSTBOOT_PASS* nhắc 9e440707; **tổng boot không cờ GIỮ 21** |
| Watcher-181 | pid 200203 **CHẾT theo #99** (poll cuối 01:12:08Z, +22 s — mẫu 14, F-182-T5-1); 0 dòng END/STOP/NEWBOOT |
| Watcher-182 | START 02:55:07Z, pid **236906**, hạn 05:35:00Z — **poll0 đã ghi cờ**; vẫn ALIVE lúc T5 đóng (poll ổn định dpkg 1.468) |
| Khoảng không-watcher | **~6.179 s = 1h42m59s** (poll cuối watcher-181 01:12:08Z → START watcher-182 02:55:07Z) — bao trọn replay #99 (01:12:29–01:17:27Z); cờ ghi muộn vì không watcher nào sống, KHÔNG phải vì replay chậm (replay chỉ ~5') |
| Hướng (3) | **VẪN ĐỨNG lần thứ 29 liên tiếp** (user@0 static, không linger, không cron, không /run/user/0, 0 timer VCut — loginctl vẫn no bus) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#98 = 50 reboot ĐÃ XÁC NHẬN** (parent quyết (p) đợt 181); #99 chờ T0-182 (nếu xác nhận → 51) |
| ENOSPC | #99: **80 dòng lúc 02:58:11Z** (76 lúc 02:53Z → 80 lúc 02:58Z, ≈0,85 dòng/phút, đều; T9 đếm chính thức) — số "27 #99" của T9-181 là snapshot sớm (cận dưới, F-182-T5-3) |
| X11 | **Trống lúc mở (02:51Z)** — 0 Xvfb; **X188 xuất hiện 02:56Z** (T4-182 spawn X sau khi nhận cờ #99) |
| RAM #99 | MemAvailable dao động CỰC MẠNH: **513 / 1.168 / 2.289 / 4.025 / 4.504 MB** (5 điểm, 02:51–02:58Z; giao T9) |
| Đồng hồ | Local ≈ Cloudflare **−1…−2 s** (CF nhanh hơn ~2 s cả 2 lap) |
| Quy tắc B4 | **T5-182 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 lần configure/install/update/repair tay) — đợt này KHÔNG cần repair; form-B/independent/poll0 đều check-only |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot không đổi; log poll0 + independent #99 in dòng live đầu tiên, không còn dòng DOT-151 cứng) |
| F-178-T7-4 | **ĐÃ LÀM RÕ (T0-179):** worker_boot_generation theo **daemon start** — daemon #99 pid 67 start 01:12:03Z (boot+17 s); gen mới thuộc T0/T7 |
| T4-182 | **Đã nhận cờ** — poll #3 (02:56:32Z): t5flag=PASS (t5src=182-t5/POSTBOOT_PASS), postboot_exit=0, gate0=T5, dpkg 1.468 — T4 đang vào attempt; cờ #99 đã sẵn cho gate (a) |

**Số hiệu boot #99 CHỜ T0-182 xác minh 9 nguồn (T7-181 đã xác minh 9 nguồn trong phiên — T5 chỉ trình số thô, khớp T7: boot_id, btime, gap).**
**T5 KHÔNG phán (m), chỉ trình số thô — (m) #99 thuộc T2-182 + parent quyết (sơ bộ T7-181: +40,109 s, TRONG dải).**

---

## §1. Timeline (giờ Z, 24/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 23:12:23Z 23/11 | Reboot #98 (e62eef3f — T0-181 XÁC NHẬN 9 nguồn); gap #97→#98 = 576 s |
| 00:16:31Z | Cờ POSTBOOT_PASS #98 ghi (repair, poll=1, caveat); watcher-181 pid 200203 tiếp tục chạy |
| 01:11:46Z | **Reboot #99 (9897d4b4 — T7-181 XÁC NHẬN 9 nguồn trong phiên)**; gap #98→#99 = **7.163 s** (trở lại mẫu ~2h); giết watcher-181 pid 200203 |
| 01:12:08Z | **Poll cuối watcher-181 pid 200203** (+22 s sau btime #99 — mẫu overlap thứ 14, F-182-T5-1) |
| 01:12:29Z | Heal #99: dpkg.log 2 dòng "startup packages configure" (boot+43 s) |
| 01:13:14–01:17:27Z | **Replay #99 chạy đầy đủ** — 50 transaction apt, 1.468 dòng dpkg, kết thúc 01:17:27Z (boot+341 s) với gstreamer1.0-tools |
| 02:35:51Z | Lượt cron đợt 182 mở; run 182 dispatch (boot_gen thuộc T0/T7) |
| ~02:51Z | **T5-182 mở trên #99**: replay ĐÃ XONG từ 01:17:27Z (dpkg 1.468 dòng, đóng băng ~94'; cache 174; lists 37; GST 269 thư mục thật; /var/log/apt CÓ); `/tmp/.X11-unix/` TRỐNG |
| 02:53Z | Form-B tay TRƯỚC khi spawn watcher: postboot check-only **exit=0** (PASS wrapper/libs/GST/apt — §5.1) |
| 02:55:02Z | T4-182 bắt đầu gate0wait (poll-wait-t4-182.sh; poll #1 vẫn thấy cờ cũ #98) |
| 02:55:07Z | **Watcher-182 START, pid 236906** (khoảng không-watcher ~6.179 s); poll đầu dpkg 1.468 dòng, ổn định → **REPLAY_DONE TRIGGER ngay** → poll0 exit=0 → **CỜ #99 GHI CÙNG GIÂY (replay, poll=0, KHÔNG caveat)**; backup cờ #98 thành `POSTBOOT_PASS-e62eef3f` (byte-identical) |
| ~02:55:10Z | T5 verify độc lập trên #99: **exit=0, 11/11 NEED + 5/5 lib, GST 269=269 thư mục thật, tools ĐÃ CÀI** (log `t5-postboot-independent-9897d4b4.log`) |
| 02:56:32Z | T4-182 poll #3: t5flag=PASS (182-t5/POSTBOOT_PASS), gate0=T5 — T4 nhận cờ #99 trong ~90 s; X188 xuất hiện 02:56Z |
| ~02:59Z | T5 viết LIMITS này. Watcher-182 vẫn ALIVE (pid 236906, poll ổn định dpkg 1.468). T4-182 đã nhận cờ, spawn X188, vào attempt. |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 29 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở: `user@0` static (`systemctl is-enabled user@0` → static); `loginctl` "Failed to connect to bus: No such file or directory"; không linger (`/var/lib/systemd/linger/` không tồn tại); không `/run/user/0`; không `crontab` (lệnh không có); `systemctl list-timers` chỉ có home-assistant-ensure.timer + apt-daily-upgrade.timer — **0 timer VCut**; không unit VCut nào ở /etc/systemd/system hay /etc/systemd/user. Lần thứ 29 liên tiếp hướng (3) đứng. T5 KHÔNG dùng systemd user manager / timer — watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–181.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z). Marker sống qua **#49–#98 = 50 reboot ĐÃ XÁC NHẬN** (parent quyết (p) đợt 181); **#99 chưa xác nhận** — nếu T0-182 xác nhận, marker sống qua 51 reboot. T5 không có bằng chứng mới về cơ chế bảo toàn `~/.config` — không mở lại chủ đề.

**Đồng hồ (2 lap):** lap 1 (02:57:16Z): local 02:57:16Z → CF 02:57:18 GMT — **CF nhanh hơn ~2 s**; lap 2 (02:58:10Z): local 02:58:10Z → CF 02:58:12 GMT — **CF nhanh hơn ~2 s** (T5-181 đo ~1–2 s trên #98; T7-180 đo ~0 s lúc 23:13:23Z trên #98). Lệch ~2 s có thể gồm ~1 s trễ curl — ghi nhận, không kết luận đồng hồ trôi thêm. **Btime ghi bằng epoch nguyên**; gap tính bằng epoch nguyên — không dùng phân số. F-181-T9-3 (sampler cuối #98 muộn hơn btime #99 7 s) giao T0-182: T5 chỉ ghi nhận số đo CF, không phán nguyên nhân.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #99 — ĐÃ CÓ (replay-đầy-đủ, poll=0) — KHÔNG caveat

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round182-t5/POSTBOOT_PASS`, 315 B, mtime 2026-11-24T02:55:07Z.
- Nội dung: `boot 9897d4b4-8736-4ca5-accb-3eb55b32f78a (btime 2026-11-24 01:11:46Z; watcher-182) — replay-day-du: dpkg 1468 dong; cache 174 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-24T02:55:07Z; POSTBOOT_PASS moi ghi 2026-11-24T02:55:07Z poll=0 (replay-day-du); co cu e62eef3f luu POSTBOOT_PASS-e62eef3f`.
- Backup cờ cũ: `POSTBOOT_PASS-e62eef3f`, 324 B — **md5 26452ec134db5db7196424d2160a6628, byte-identical với file gốc round181-t5 (cờ #98)**.
- **Lịch trình (watcher tự làm, không tay):** START 02:55:07Z → poll đầu dpkg 1.468 dòng, ổn định, 0 proc → **REPLAY_DONE TRIGGER cùng giây** → postboot poll0 exit=0 (02:55:07Z) → **FLAG-WRITTEN cùng giây**. KHÔNG trigger EARLY-REPAIR (dpkg > 100). KHÔNG trigger BACKSTOP.
- **Verify độc lập (T5, check-only, ~02:55:10Z):** postboot **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 thư mục thật** (KHÁC #98/#96/#94 symlink — GIỐNG #95/#92); **tools ĐÃ CÀI** (gst-inspect-1.0 tại /usr/bin/gst-inspect-1.0; gstreamer1.0-tools 1.24.2-1ubuntu0.2 — GIỐNG #95, KHÁC #98); **libc-bin 2.39-0ubuntu8.12** (dấu replay — = #95/#92, khác #98/#96/#94/#90 repair 8.9).
- **KHÔNG caveat** (giống #95/#92): GST thư mục thật, tools đủ, dpkg 1.468 (gần 1.545 của replay #95). **Parent quyết (§9(b))** — T5 đề xuất chấp nhận **KHÔNG caveat** (tiền lệ #95/#92).
- **Lưu ý thời gian:** cờ ghi ở boot+1h43m21s — KHÔNG phải vì replay chậm (replay chỉ ~5', xong 01:17:27Z) mà vì **không watcher nào sống trên #99 trước 02:55:07Z** (khoảng không-watcher 6.179 s, §3.4). T4-182 đã nhận cờ trong ~90 s (poll #3 02:56:32Z).

### §3.2. Cờ #97 — VẪN KHÔNG CÓ (đã xác nhận đợt 181, không bù được)

- **#97 (9e440707-028c-4102-9d14-b119b5b4e136, btime 23:02:47Z):** kiểm lại đợt 182: `grep -rl "9e440707" --include="POSTBOOT_PASS*" hidden_files/` = **0 file** (exit 1) — không có file POSTBOOT_PASS nào nhắc 9e440707. **Tổng boot không cờ GIỮ 21** (#97 + #93, #91, #87, #88, #83, #82 + 14 boot #51/#53/#54/#55/#57/#60/#63/#66/#68/#71/#72/#73/#76/#78).

### §3.3. Cờ #98 / #96 / #95 / #92 / #90 / #89 / #86 / #85 / #84 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #98 (e62eef3f) | round181-t5/POSTBOOT_PASS, 00:16:31Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 181 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (26452ec1); backup byte-identical trong round182-t5 |
| #96 (8d2a69df) | round180-t5/POSTBOOT_PASS, 22:08:08Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 180 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (50869e4e) |
| #95 (95b483a2) | round180-t5/POSTBOOT_PASS-95b483a2, 20:59:47Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 180 KHÔNG caveat; **md5 KHÔNG ĐỔI** (f8cd6d46; mtime file backup 22:08:08Z là lúc cp khi ghi cờ #96, không phải lúc ghi cờ #95) |
| #92 (985bc2a3) | round178-t5/POSTBOOT_PASS, 11:53:41Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 178 KHÔNG caveat |
| #90 (94247dfa) | round177-t5/POSTBOOT_PASS, 08:51:55Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 177 CÓ caveat |
| #89 (15618ce8) | round176-t5/POSTBOOT_PASS, 05:42:19Z | replay, poll=0, KHÔNG caveat |
| #86 (70b7f7ee) | round175-t5/POSTBOOT_PASS, 02:40:29Z | replay, poll=0 |
| #85 (3c704685) | round174-t5/POSTBOOT_PASS, 23:46:57Z | repair-tay, poll=1 |
| #84 (4ae2d2ea) | round173-t5/POSTBOOT_PASS, 21:27:05Z | repair, poll=1 |

### §3.4. Watcher-181 — CHẾT theo #99 (poll cuối +22 s, mẫu 14)

- **Watcher-181, pid 200203** (spawn 23:59:08Z trên #98): poll cuối **01:12:08Z, +22 s sau btime #99** (mẫu overlap thứ 14, **F-182-T5-1**); 0 dòng END/STOP/NEWBOOT. Log watcher-181: **120 dòng** (poll cuối dòng 120, boot e62eef3f, dpkg 804, md5 29c29216).
- **Khoảng không-watcher ~6.179 s = 1h42m59s** (poll cuối watcher-181 01:12:08Z → START watcher-182 02:55:07Z) — dài hơn khoảng đợt 181 (3.552 s); bao trọn replay #99 (01:12:29–01:17:27Z) + ~1h38' sau replay. Replay #99 ĐÌNH TRỆ? KHÔNG — replay chạy đầy đủ trong khoảng này mà không cần watcher.

### §3.5. Watcher-182 (boot #99) — ĐANG CHẠY, đã làm xong nhiệm vụ chính

- Spawn 02:55:07Z, pid **236906**, boot 9897d4b4, hạn 05:35:00Z 24/11. Khởi tạo: dpkg 1.468 dòng, md5 090df893, mtime 01:17:27Z, cache 174, lists 37, gst_sys 269.
- **REPLAY_DONE TRIGGER poll đầu 02:55:07Z** (dpkg 1.468 > 100, ổn định, 0 proc) → postboot poll0 exit=0 → **FLAG-WRITTEN 02:55:07Z** (replay, poll=0).
- **Poll sau cờ đều 30 s** (02:55:07Z → 02:58:09Z lúc kiểm — dpkg 1.468, md5 090df893, gst 269, cache 174, lists 37, 0 proc, không đổi). Watcher vẫn ALIVE lúc T5 đóng; hạn 05:35:00Z 24/11 — T5-183 tiếp quản; nếu reboot mới (#100), spawn watcher mới theo mẫu.

---

## §4. Boot #99 + F-182-T5-1 + F-177-T5-3 + F-178-T7-4 + gap kiểm lại độc lập

### §4.1. Boot #99 (9897d4b4) — số thô (T7-181 đã xác minh 9 nguồn trong phiên)

- #99: boot_id đầy đủ `9897d4b4-8736-4ca5-accb-3eb55b32f78a`; btime **01:11:46Z** (epoch 1795482706 — /proc/stat); `uptime -s` khớp (theo T7-181); /proc/1 mtime 01:12:02.118Z (+16,118 s — khớp đúng số T10-181 ghi); journal chỉ idx 0 (first entry 01:12:02Z); `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- **Gap #98→#99 = 7.163 s** (kiểm lại — khớp T0-181/T7-181); gap #97→#98 = 576 s (ngắn bất thường, nguyên nhân chưa xác định, host-side).
- **Số hiệu #99 CHỜ T0-182 xác minh 9 nguồn** — T7-181 đã xác minh 9 nguồn trong phiên (T5 chỉ trình số thô, khớp T7: boot_id, btime, gap).
- **T5 KHÔNG phán (m)** — thuộc T2-182 + parent. Số thô (T7-181): **(m) #99 +40,109 s — DƯƠNG ỨNG VIÊN (sơ bộ), TRONG dải, KHÔNG sát biên**.

### §4.2. F-182-T5-1 (mới) và chuỗi mẫu overlap poll-cuối-sau-btime

Watcher-181 pid 200203 đọc được boot_id cũ 22 s sau btime mới (đã giải thích ở F-172-T5-1). Mẫu thứ 14 — chuỗi **11 → 20 → 23 → 9 → 8 → 36 → 7 → 3 → 17 → 22 → 26 → 24 → 29 → 22 s**; poll cuối 01:12:08Z, boot e62eef3f, dpkg/md5 khớp #98 (804/29c29216); poll trước 01:11:38Z, trước btime 8 s. **Không ảnh hưởng verdict.**

### §4.3. F-177-T5-3 vẫn đúng (không kiểm lại đợt này)

`who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T5 dùng **epoch /proc/stat làm chuẩn**; T0-182 làm rõ bằng 9 nguồn. Ghi nhận lần 6 (#90, #92, #94, #95, #98, #99 — lần này không chạy `who -b`, chỉ nhắc lại quy tắc).

### §4.4. F-178-T7-4 — ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start

- **Phía infra T5-182 (không phán DB):** daemon hatch trên #99 pid 67 start **01:12:03Z (boot+17 s)** — boot OS mới → daemon mới → gen mới; gen cụ thể thuộc T0/T7 (T7-181 ghi gen #99 trong phiên). /proc/1 mtime 01:12:02.118Z (boot+16,118 s — lớn hơn +11,x s ở #96/#97/#98, như T10-181 đã nêu; giao T0-182 xem xét).

---

## §5. Replay #99 ĐẦY ĐỦ + ledger

### §5.1. Replay #99 ĐẦY ĐỦ — heal 2 dòng rồi chạy tiếp, không đình trệ — KHÔNG cần repair

- **Hoạt động:** heal `dpkg --configure -a` **01:12:29Z (boot+43 s)** viết 2 dòng "startup packages configure" (01:12:29Z) rồi **REPLAY CHẠY TIẾP** — archives unpack từ 01:13:14Z, 50 transaction apt (01:13:14–01:17:27Z), kết thúc 01:17:27Z (boot+341 s) với gstreamer1.0-tools. **GIỐNG #95** (replay đầy đủ boot+39 s → 1.545 dòng, không repair) và **KHÁC #98** (heal boot+36 s, 2 dòng, đình trệ → repair).
- **dpkg.log sau replay: 1.468 dòng** (mtime 01:17:27Z; md5 090df893); **213 "status installed"**, **170 "configure"**. **apt history: 50 transaction** (replay); **term.log 0 lỗi** (grep error|failed = 0). Cache 0 → **174 .deb**; lists 3 → **37**.
- **Form-B (T5 verify tay TRƯỚC khi spawn watcher, check-only):** postboot 02:53Z **exit=0** — PASS wrapper K1; **PASS libs 5/5**; **PASS GST** (thư mục thật, 269 file hệ thống = 269 debroot); **PASS apt 11/11**. Log `t5-postboot-verify-formB-9897d4b4.log` (chỉ đọc, không chạm dpkg).
- **Replay (hệ thống tự chạy, 01:12:29Z → 01:17:27Z = 4m58s):** không watcher nào can thiệp; apt-get replay 50 transaction; GST thư mục thật → debroot (269 file). **Kết quả postboot poll0 (02:55:07Z, exit=0):** PASS wrapper/libs/GST/apt — **11/11 gói NEED** + 5/5 lib (verify độc lập khớp); GST 269=269 thư mục thật; **tools ĐÃ CÀI** (khác #98/#96); **libc-bin 2.39-0ubuntu8.12** (dấu replay — = #95/#92, khác #98/#96/#94/#90 repair 8.9).
- **Phiên bản gói:** Y HỆT #89/#92/#95/#96 (good 1.8, bad 1.4, ugly 1build1, -base 0.7, libav 1build1, -gl 0.7, libgstreamer1.0-0 0.2, libevent 2.1.12-9ubuntu2.2, libavif16 1.0.4, libevdev2 1.13.1) — **chỉ libc-bin khác theo mode: replay → 8.12, repair → 8.9** (mẫu rõ qua 5 boot).
- **F-174-T5-6 KHÔNG áp dụng ở #99** — replay đầy đủ (không chạy một phần), không repair; không phải replay đình trệ.

### §5.2. Ledger (F-182-T5-2 — cùng họ F-174-T5-2 → F-181-T5-2)

- ledger.jsonl lúc T5 mở (mtime 01:17Z, #99 boot+~5'): **1 dòng, 3.040 B** — ts **1795479391 = 2026-11-24 00:16:31Z** (repair #98), **compacted=true, added 170, removed 0** — **replay #99 COMPACT 2 dòng (4.949 B) về 1 dòng (3.040 B), GIỮ NGUYÊN ts 1795479391, chỉ mtime đổi** (giống F-179-T5-2 mang nguyên ts; khác F-180-T5-2 gộp; đúng quy tắc F-181-T5-2: hook post-invoke COMPACT khi replay đầy đủ).
- **F-182-T5-2 (mới):** replay đầy đủ COMPACT ledger (2 dòng → 1 dòng) nhưng **ts KHÔNG cập nhật theo giờ replay** (giữ ts sự kiện trước — 00:16:31Z — trong khi mtime file là 01:17Z). Không ảnh hưởng số đếm (added vẫn 170, hợp 170); T2/T10 không nhầm ts với boot, không đếm nhầm 170 gói thành 2 lần.
- `dpkg-state.txt`: **953 dòng, 49.449 B, mtime 01:17:28Z** (reseed trong replay #99; 953 ≠ 890 sau repair #98 — mẫu replay khác mẫu repair, ghi nhận).

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (không repair; T5 không probe tay chạm dpkg)

- T5-182 **KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** — 0 lần configure/install/update/repair tay. Watcher-182 **KHÔNG repair** (không cần — replay đầy đủ). Đợt này không có guard file `repaired-9897d4b4`.
- **Thứ tự an toàn:** form-B tay 02:53Z chạy lúc replay đã xong từ 01:17:27Z (0 proc apt/dpkg) — chỉ đọc (đã kiểm script: `apt-get update` chỉ chạy trong nhánh `--repair`; check-only không chạm apt/dpkg). Watcher trigger REPLAY_DONE 02:55:07Z lúc **T4-182 vừa bắt đầu gate0wait** (poll-wait-t4-182.sh start 02:55:02Z, poll #1 vẫn cờ cũ #98) — cờ #99 ghi xong trước khi T4 vào attempt, đúng chiến lược (h): tạo gate (a) cho T4. T4 nhận cờ poll #3 02:56:32Z.
- **Verify độc lập ~02:55:10Z** chạy cùng phút T4 spawn poller (02:55:02Z) — **chỉ đọc** (postboot check-only + dpkg-query + ldconfig + ls), không giữ lock dpkg, không phải script nặng, T4 lúc đó chưa attempt (poll #1 gate0=T4-check-only, load1 2,61) — **0 VI PHẠM F-175-T4-2 phía T5**. Chuỗi 0 vi phạm phía T5 giữ từ đợt 179.
- **Hướng (3) đứng lần thứ 29** (§2). G1 chờ user (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (0 thử lần thứ 36 — theo T9 đợt 181). File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 182: script postboot không đổi từ đợt 176; log poll0 + independent #99 có dòng đầu là dòng live mới (`[postboot 2026-11-24 01:11:46] boot=...`), rồi PASS wrapper/libs/GST/apt + KẾT LUẬN, exit=0 — dòng DOT-151 cứng KHÔNG còn xuất hiện.
- F-175-T5-3 **ĐÓNG từ đợt 176, vẫn đóng** — không sửa thêm file nào đợt này.

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #99 (giao T9):** MemAvailable dao động CỰC MẠNH — **513 / 1.168 / 2.289 / 4.025 / 4.504 MB** (5 điểm: 02:51Z / 02:53Z / 02:55Z / 02:57Z / 02:58Z; MemTotal 8.124.900 kB). Từ 513 MB lên 4.504 MB trong ~7' — biên độ lớn nhất T5 từng đo trong một phiên (đợt 181: 652–1.311 MB trong 20'). Diễn biến đầy đủ thuộc T9-182.

**ENOSPC #99 (T9 đếm chính thức):** **80 dòng lúc 02:58:11Z** ("No space left on device" trong journal boot hiện tại; grep "inotify" cũng 80 — đều là inotify_add_watch của home-assistant-ensure.service). Tăng 76 (02:53Z) → 80 (02:58Z), ≈0,85 dòng/phút, đều qua các khung 10' (4/8/9/8/9/9/8/9/9/6 — xem Phụ lục). Disk còn 6,8 GB trống — ENOSPC không phải do disk đầy. inotify: max_user_watches **63.747**, max_user_instances 128.

**F-182-T5-3 (mới):** số "27 #99" trong T9-181/T10-181 là **snapshot sớm** (T9 tự ghi "cận dưới" — T9-181 §4) — T9 đếm #99 khi phiên họ mới bắt đầu sau #99 (~01:45Z, 27 dòng ≈ 32' × 0,85/phút), không đếm lại cuối phiên. Đếm trực tiếp của T5-182: **80 dòng lúc 02:58:11Z** và vẫn tăng. Tổng đợt 181 nếu tính lại #99 đến cuối phiên sẽ cao hơn 117 — nhưng **T10 không đếm lại được #98 từ cell** (journal chỉ còn boot hiện tại sau reboot) nên tổng đợt 181 GIỮ 117 theo quyết (l) đợt 181; T5 chỉ cập nhật số #99 tươi. **Đợt thứ 31 liên tiếp có lỗi thật.**

**X11:** **Trống lúc mở (02:51Z)** — 0 Xvfb. **X188 xuất hiện 02:56Z** — T4-182 spawn X sau khi nhận cờ #99 (poll #3 02:56:32Z). T5 KHÔNG dọn socket luồng khác; giao T8-182 theo checklist (o) nếu cần.

**Journal #99:** chỉ idx 0 duy nhất (boot 9897d4b4); first entry 01:12:02Z.

---

## §8. Nợ mở chuyển đợt 183

1. **(m) #99** — T2-182 + parent quyết (sơ bộ +40,109 s, TRONG dải).
2. **INSIDE #99 (FULL145)** — T2-182.
3. **Số hiệu #99** — T0-182 xác minh 9 nguồn (T7-181 đã xác minh 9 nguồn trong phiên).
4. **Cờ #99 (replay, poll=0, KHÔNG caveat, 02:55:07Z)** — parent quyết §9(b). **Cờ #97 VẪN KHÔNG CÓ** — tổng boot không cờ GIỮ 21.
5. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 27 thuộc T2-182).
6. **(m) #56 lần 25** — T2-182.
7. **Balloon trên #99** — T9-182 (E-213 kết cục; E-214 nếu ghim tiếp trên #99).
8. **Watcher-182 vẫn chạy trên #99** (pid 236906, hạn 05:35:00Z) — T5-183 tiếp quản; nếu reboot mới (#100), spawn watcher mới theo mẫu.
9. **Prune lần 57** — T6-182 (F-147-T6-1 chuỗi VẪN 0 lần thứ ba liên tiếp — theo T6-181).
10. **Run 181 kết cục** — T7-182 (viết lại ×1 tại #99; hạn 02:39:30Z). **Run 182 kết cục** — T7-183.
11. **#99 có giết holder không** — T6-182.
12. **F-182-T5-1 (overlap +22 s, mẫu 14)** — ghi nhận, không đổi verdict (m).
13. **F-182-T5-2 (ledger: replay #99 compact 2 dòng → 1 dòng, ts GIỮ 1795479391, added 170)** — ghi nhận; T2/T10 không đếm nhầm 170 gói.
14. **F-182-T5-3 (ENOSPC #99: T9-181 đếm 27 là snapshot sớm; trực tiếp 80 lúc 02:58:11Z)** — ghi nhận; tổng đợt 181 GIỮ 117 theo quyết (l).
15. **F-181-T9-3 (sampler cuối #98 muộn hơn btime #99 7 s)** — giao T0-182.
16. **T2-183/T4-183:** không chạy script nặng / không probe dpkg trong cửa sổ attempt (B4 đứng; chuỗi 0 vi phạm phía T5 giữ từ đợt 179).
17. **RAM #99 dao động cực mạnh (513–4.504 MB trong 7')** — T9-183 theo dõi.
18. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
19. **Vì sao replay #99 đầy đủ trong khi #98 đình trệ?** — nếu T0/T7/T9 tìm ra thì ghi GAP, không thì chuyển nợ host-side (quyết (k) đợt 174).
20. **HB 02:50:50Z + DR 03:00Z** — T7-182 (HB 02:50:50Z dispatch sau #99 1h39m — scheduler hồi phục; DR 03:00Z thuộc đợt 182).
21. **Plan B B1** — T8-182 theo dõi live (quyết (j) đợt 181: B2 VẪN HOÃN); **H3** chỉ giám sát thụ động.
22. **F-181-T1-1 (aggregate 180 §10.3 "quét 1.335 file" → "1.336 file" — parent DUYỆT sửa đợt 181 (p))** — T1-182 sửa + stage batch đợt 182.

---

## §9. Đề xuất cho parent (quyết ở aggregate 182)

**(a) Chấp nhận verdict đợt 182?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #99 đã có (replay, poll=0, KHÔNG caveat, verify độc lập exit=0), #98/#96/#95 VẪN CÓ, #97 VẪN KHÔNG CÓ đã xác nhận (tổng boot không cờ GIỮ 21), watcher-182 chạy tốt, F-178-T7-4 đã làm rõ, F-175-T5-3 vẫn đóng, hướng (3) lần 29, marker 50 reboot (chờ T0 xác nhận #99 → 51), 0 vi phạm B4 phía T5.

**(b) Cờ #99 (replay-đầy-đủ, poll=0) — CÂU HỎI QUYẾT:** Watcher-182 REPLAY_DONE → postboot poll0 exit=0 trên boot SỐNG (log `t5-postboot-poll0-9897d4b4.log`), T5 verify độc lập check-only exit=0 (`t5-postboot-independent-9897d4b4.log`), 11/11 NEED + 5/5 lib + GST 269=269 thư mục thật + tools ĐÃ CÀI + libc-bin 8.12. **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #99 đứng cho gate (a) **KHÔNG caveat** — tiền lệ #95/#92 (replay, poll=0);
- (b2) Không chấp nhận (T5 không thấy căn cứ — replay đủ 1.468 dòng, 50 transaction, 0 lỗi, verify độc lập khớp; profile giống hệt #95 đã chấp nhận).

**(c) Cờ #97 VẪN KHÔNG CÓ — T5 đề xuất parent ghi nhận KHÔNG bù** (đã xác nhận đợt 181; kiểm lại đợt 182: 0 file POSTBOOT_PASS nhắc 9e440707; tổng boot không cờ GIỮ 21) — tiền lệ #93.

**(d) #98 VẪN CÓ cờ (00:16:31Z, repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 181; backup byte-identical md5 26452ec1) + #96 VẪN CÓ (repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 180) + #95 VẪN CÓ (replay, poll=0, KHÔNG caveat) — mtime/md5 cả ba KHÔNG ĐỔI — chấp nhận?**

**(e) Xác nhận số hiệu boot #99 (T0-182, 9 nguồn — T7-181 đã xác minh 9 nguồn trong phiên; T5 chỉ trình số thô) — parent chấp nhận?**

**(f) F-182-T5-1 (overlap +22 s, mẫu 14) + F-182-T5-2 (ledger compact 2 dòng → 1 dòng, ts GIỮ 1795479391, added 170) + F-182-T5-3 (ENOSPC #99: T9-181 đếm 27 là snapshot sớm; trực tiếp 80 lúc 02:58:11Z; tổng đợt 181 GIỮ 117) + F-177-T5-3 (who -b chỉ cho phút, lần 6) — ghi nhận, không đổi verdict (m).**

**(g) F-178-T7-4 ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start — parent ghi nhận?** Phía infra T5: daemon #99 pid 67 start boot+17 s; gen mới thuộc T0/T7.

**(h) Watcher-182 vẫn chạy trên #99** (pid 236906, hạn 05:35:00Z) — T5-183 tiếp quản; nếu reboot mới (#100), spawn watcher mới theo mẫu.

**(i) Replay #99 đầy đủ trong khi #98 đình trệ — parent có muốn điều tra host-side không?** Bằng chứng trong cell: heal khởi động boot+43 s rồi replay chạy tiếp 50 transaction — không manh mối vì sao #98 đình trệ trong khi #99 chạy đủ. Theo quyết (k) đợt 174, điều tra host-side KHÔNG bắt buộc — T5 đề xuất áp dụng cùng nguyên tắc cho #99, trừ khi parent quyết khác.

---

## §10. Sai số của chính T5-182 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-182-T5-1** | Poll cuối watcher-181 pid 200203 SAU btime #99 **22,0 s** (mẫu 14: 11→20→23→9→8→36→7→3→17→22→26→24→**29**→**22 s**) | Ghi nhận | Không ảnh hưởng verdict; poll duy nhất sau btime vẫn thuộc boot cũ (804/29c29216 khớp #98) |
| **F-182-T5-2** | Ledger: replay #99 compact 2 dòng (4.949 B) → 1 dòng (3.040 B), **ts GIỮ 1795479391** (repair #98), added 170, mtime đổi 01:17Z | Ghi nhận | Không ảnh hưởng số đếm (added vẫn 170, hợp 170); T2/T10 không đếm nhầm 170 gói |
| **F-182-T5-3** | ENOSPC #99: T9-181 đếm 27 (snapshot sớm, T9 tự ghi "cận dưới"); T5-182 đếm trực tiếp **80 lúc 02:58:11Z** | Ghi nhận | Tổng đợt 181 GIỮ 117 theo quyết (l) (không đếm lại được #98); đợt thứ 31 liên tiếp có lỗi thật |
| — | Cờ #99 ghi ở boot+1h43m21s (muộn vì không watcher nào sống trước 02:55:07Z) | Ghi nhận | Replay chỉ ~5' (01:12:29–01:17:27Z); cờ muộn vì khoảng không-watcher 6.179 s — mode vẫn replay, poll=0 |
| — | Đồng hồ: CF nhanh hơn local ~2 s (2 lap: ~2 s, ~2 s) | Ghi nhận | Có thể gồm ~1 s trễ curl; F-181-T9-3 (lệch 7 s) giao T0-182 |
| — | RAM chỉ đo 5 điểm thay vì diễn biến đầy đủ (513–4.504 MB trong 7') | Hạn chế nhỏ | T5 đóng sớm (cờ xong 02:55:07Z); diễn biến RAM đầy đủ thuộc T9-182 |
| — | Verify độc lập ~02:55:10Z cùng phút T4 spawn poller (02:55:02Z) | Ghi nhận | Chỉ đọc, không lock dpkg, T4 chưa attempt (poll #1 gate0=T4-check-only) — 0 vi phạm |
| — | T5-182 mở muộn (~02:51Z, 15' sau khi đợt mở 02:35:51Z) | Ghi nhận | Không ảnh hưởng verdict: cờ #99 ghi trước hạn cờ ~05:00Z hơn 2 giờ; watcher spawn ngay sau form-B |

**Số liệu chính thức lấy từ log watcher-181/182 + log trực tiếp (form-B/poll0/independent) + dpkg/history/term.log của #99 + đối chiếu T7-181.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND182_T5_INFRA_LIMITS.md` (file MỚI, không sửa file repo nào đợt này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round182-t5-infra.txt` (NUL-delimited, 1 entry; đã verify bằng read-back `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round182-t5/` (theo mẫu T5-171–181): watcher script/log, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–182: đợt 166–181 = 160 batch / 234 entry / 212 file (quyết (r) đợt 181) + đợt 182 (1 file này, file MỚI; các T khác chưa tính lúc T5 đóng) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-182 (bản chính, 02:51Z – 02:59Z 24/11)

```
=== PHU LUC SO LIEU T5-182 (trich log truc tiep) ===
boot_id #99=9897d4b4-8736-4ca5-accb-3eb55b32f78a
btime_epoch #99=1795482706 = 2026-11-24T01:11:46+00:00 (who -b: khong kiem dot nay — chi toi phut, F-177-T5-3)
boot_id #98=e62eef3f-9a53-4d67-8a8b-7077ee917156
btime_epoch #98=1795475543 = 2026-11-23T23:12:23+00:00 (T0-181 xac minh 9 nguon)
gap #98->#99 = 7163 s; gap #97->#98 = 576 s (NGAN BAT THUONG)

--- replay-watch-181.log (round181-t5, 120 dong) ---
pid 200203: poll cuoi=2026-11-24T01:12:08Z boot=e62eef3f dpkg_lines=804 md5=29c29216 (+22 s sau btime #99 — mau 14, F-182-T5-1); 0 dong END/STOP/NEWBOOT

--- replay-watch-182.log (round182-t5) ---
START 2026-11-24T02:55:07Z pid=236906 boot=9897d4b4 btime=01:11:46Z end=2026-11-24T05:35:00Z
init_lines=1468 init_md5=090df893 init_mtime=01:17:27Z cache=174 lists=37 gst_sys=269
REPLAY_DONE 02:55:07Z boot=9897d4b4 dpkg_lines=1468 gst_sys=269 cache=174 lists=37
postboot poll0 exit=0 (hoan tat 2026-11-24T02:55:07Z)
FLAG-WRITTEN 02:55:07Z mode=replay-day-du poll=0 (old=e62eef3f)
poll sau co: 30 s deu, dpkg 1468 md5 090df893, 0 proc (02:55:37Z -> 02:58:09Z)

--- 3. POSTBOOT_PASS ---
round182-t5/POSTBOOT_PASS: CO mtime=2026-11-24 02:55:07 +0000 bytes=315
round182-t5/POSTBOOT_PASS-e62eef3f: CO (backup #98, md5 26452ec1 = goc round181-t5)
round181-t5/POSTBOOT_PASS (#98): CO, mtime=2026-11-24 00:16:31 +0000 bytes=324 md5=26452ec1 (KHONG DOI)
round180-t5/POSTBOOT_PASS (#96): CO, mtime=2026-11-23 22:08:08 +0000 bytes=324 md5=50869e4e (KHONG DOI)
round180-t5/POSTBOOT_PASS-95b483a2 (#95): CO, mtime backup=2026-11-23 22:08:08 +0000 bytes=315 md5=f8cd6d46 (KHONG DOI)
KHONG CO file POSTBOOT_PASS nao nhac 9e440707 (#97) — da grep round18* (xem §3.2)

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47Z

--- 5. dpkg/cache/lists/GST (boot #99, replay day du) ---
dpkg_lines=1468 md5=090df893 mtime=2026-11-24 01:17:27 +0000 (heal 01:12:29Z boot+43s; replay 01:13:14-01:17:27Z boot+88s->+341s)
status installed=213; configure=170
cache_deb=174 lists_entries=37
gst_sys_files=269 (THU MUC THAT, khong symlink — GIONG #95/#92, KHAC #98/#96/#94) gst_sys_is_link=KHONG
apt_history_transactions=50 (replay); term_log_errors=0
heal #99: 01:12:29Z (boot+43s, 2 dong) roi REPLAY CHAY TIEP; xong 01:17:27Z (boot+341s)

--- 6. 11 goi NEED + 5 lib + tools + ledger ---
11/11 install ok installed (NEED); gstreamer1.0-tools 1.24.2-1ubuntu0.2 DA CAI; gst-inspect-1.0: /usr/bin/gst-inspect-1.0
5/5 lib CO; versions: good 1.8, bad 1.4, ugly 1build1, -base 0.7, libav 1build1, -gl 0.7, libc-bin 2.39-0ubuntu8.12 (replay; #98/#96/#94/#90 repair: 8.9)
ledger luc mo: 1 dong, ts 1795479391 (compacted, added 170, removed 0), mtime 01:17Z (F-182-T5-2: replay #99 compact 2 dong -> 1 dong, GIU ts 1795479391)
dpkg-state.txt: 953 dong, 49449 B, mtime 01:17:28Z (sau repair #98: 890 dong — mau replay khac mau repair)

--- 7. ENOSPC --- 76 dong (02:53Z) -> 78 (02:55:51Z) -> 79 (02:57:16Z) -> 80 dong (02:58:11Z) "No space left on device" (journal boot #99; grep inotify cung 80); ~0,85 dong/phut; histogram 10': 01:1x=4, 01:3x=8, 01:4x=9, 01:5x=8, 02:0x=9, 02:1x=9, 02:2x=8, 02:3x=9, 02:4x=9, 02:5x=6; disk con 6,8 GB trong
--- 8. RAM --- MemAvailable 513364 / 1167556 / 2288092 / 4024956 / 4504472 kB (02:51Z / 02:53Z / 02:55Z / 02:57Z / 02:58Z); MemTotal 8124900 kB
--- 9. Huong (3) --- user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; crontab not found; timers_vcut=0 (chi home-assistant-ensure.timer + apt-daily-upgrade.timer)
--- 10. X11 --- TRONG luc mo (02:51Z); X188 xuat hien 02:56Z (T4-182 spawn X sau co)
--- 11. T4-182 --- gate0wait tu 02:55:02Z (poll-wait pid 236013); poll #1 02:55:02Z t5flag=cu (#98); poll #3 02:56:32Z t5flag=PASS (182-t5/POSTBOOT_PASS) postboot_exit=0 gate0=T5 dpkg 1468; X188 02:56Z — T4 dang vao attempt
--- 12. Daemon --- hatch pid 67 start 01:12:03Z (boot+17s) — gen moi thuoc T0/T7 (F-178-T7-4); /proc/1 mtime 01:12:02.118Z (boot+16,118s)
```
