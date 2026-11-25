# PHASE 9 — ROUND 175 — T5 INFRA LIMITS

**Đợt:** 175 (mở lượt cron 09:35:51 +07 23/11/2026 = 02:35:51Z 23/11; hạn cờ ~05:00Z, hạn cứng 05:30Z 23/11).
**Người viết:** T5-175. **Ngày:** 23/11/2026. **Boot làm việc lúc đóng:** #86 (CHƯA XÁC NHẬN — chờ T0-175 xác minh 9 nguồn) 70b7f7ee, btime 01:01:37Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #86 (replay-đầy-đủ, poll=0 — xem §3.1). File này là 1 entry duy nhất stage đợt 175 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #86 (70b7f7ee, btime 01:01:37Z) | **ĐÃ CÓ 02:40:29Z (boot+1h38m52s, replay-đầy-đủ, poll=0)** — watcher-175 tự viết sau poll0 exit=0; T5 verify độc lập check-only exit=0; 11/11 gói + 5/5 lib; GST thư mục thật 269=269. **KHÔNG caveat repair — cờ replay-đầy-đủ đầu tiên kể từ #80** — xem §3.1 |
| Replay host-side #86 | **CHẠY ĐẦY ĐỦ (170/170 intent)** — dpkg 1545 dòng (bằng đúng mẫu đầy đủ #77/#79/#80: 169 install / 9 upgrade / 178 configure), 50 transaction 01:13:46–01:22:11Z, term.log 0 lỗi; F-174-T5-6 (một phần) KHÔNG lặp lại — xem §5.1 |
| POSTBOOT_PASS #85 (3c704685) | **VẪN CÓ, còn hiệu lực** (23:46:57Z, repair-tay-T5, poll=1 — parent CHẤP NHẬN (c) đợt 174); mtime không đổi; backup POSTBOOT_PASS-3c704685 trong round175-t5 |
| POSTBOOT_PASS #84 (4ae2d2ea) | **VẪN CÓ, còn hiệu lực** (21:27:05Z, repair-sớm-quyết-h, poll=1); mtime không đổi |
| POSTBOOT_PASS #83 / #82 | **KHÔNG CÓ** (16 boot không cờ — không đổi; #86 có cờ nên tổng giữ 16) |
| Reboot trong phiên | **#86 (70b7f7ee, btime 01:01:37Z, gap #85→#86 = 7.321 s)** — xảy ra 1h34m TRƯỚC khi đợt mở, trong khoảng không-watcher; CHƯA XÁC NHẬN (chờ T0-175) |
| Watcher-174 | pid 12991 **CHẾT theo #86** (poll cuối 01:02:13Z — **36 s SAU btime #86, F-175-T5-1: mẫu overlap LỚN NHẤT** 11→20→23→9→8→36 s); 166 dòng, 161 poll |
| Watcher-175 | START 02:40:29Z, pid **16528, vẫn ALIVE**, hạn 05:30:00Z — T5-176 tiếp quản; REPLAY_DONE + poll0 exit=0 + FLAG-WRITTEN ngay poll đầu |
| Khoảng không-watcher | **5.896 s = 1h38m16s** (poll cuối watcher-174 01:02:13Z → START watcher-175 02:40:29Z) — bao trọn replay #86; dựng lại timeline từ log |
| Hướng (3) | **VẪN ĐỨNG lần thứ 22 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0, 0 timer VCut) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#86 = 38 reboot NẾU #86 được xác nhận** (chờ T0-175) |
| ENOSPC | #86: **31 dòng lúc 02:39Z → 33 lúc 02:41:59Z → 34 lúc 02:43Z** (T9 đếm chính thức; dòng đầu 01:03:39Z, boot+2m02s; vẫn tiếp diễn lúc đóng) |
| X11 | **1 socket X188 (mtime 02:42Z) + Xvfb :188 đang chạy** (của T4-175, xuất hiện 02:40Z) — T5 KHÔNG dọn; giao T8 theo checklist (o) |
| RAM #86 | MemAvailable **465.820 → 763.388 → 1.134.572 → 1.065.096 kB** (02:39→02:43Z — HỒI NHANH sau trũng; giao T9); T4 poll #2 chỉ 684 MB (< gateA), poll #3 1.073 MB |
| Đồng hồ | Local ≈ Cloudflare **−0,3 đến −1,9 s** (CF nhanh hơn, thường ~1 s — cùng họ các đợt trước) |
| Gap kiểm lại độc lập | btime #86 epoch **1795395697** (= 01:01:37Z, kiểm bằng /proc/stat + `date -d` khớp); gap #85→#86 = **7.321 s** (theo T7-174) |
| Quy tắc B4 | **T5-175 KHÔNG chạy probe chạm dpkg nào, KHÔNG repair** (0 lần `dpkg --configure -a`, 0 lần apt install) — poll0 đã PASS nên không cần repair; chỉ check-only đọc |
| T4-175 | Poller ĐANG CHẠY (poll #2 02:42:23Z, poll #3 02:43:10Z); **gate0=T5 từ poll #2** (t5flag=PASS, postboot_exit=0); chưa attempt lúc T5 đóng; RAM < gateA ở poll #2 |
| F-173-T5-9 | **VẪN ÁP DỤNG**: không có repair đợt này nên không có log apt nào cần copy; watcher-175 mang lệnh copy tương tự sau mọi --repair của nó |

**Số hiệu boot #86 CHƯA XÁC NHẬN — chờ T0-175 xác minh 9 nguồn.**
**T5-175 KHÔNG phán (m), chỉ trình số thô — (m) #86 DƯƠNG ỨNG VIÊN (sơ bộ, lean T7-174: +49,418 s, sát biên TRÊN 0,382 s) CHỜ T2-175 đối chiếu + parent quyết.**

---

## §1. Timeline (giờ Z, 23/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 22:59:36Z 22/11 | Reboot #85 (3c704685, btime) — gap #84→#85 = 7.101 s |
| 23:46:57Z 22/11 | Cờ POSTBOOT_PASS #85 ghi (repair-tay-T5, poll=1) |
| 01:01:37Z | **Reboot #86 (70b7f7ee, btime, epoch 1795395697) — gap #85→#86 = 7.321 s**; xảy ra 1h34m TRƯỚC khi đợt mở |
| 01:01:42Z | Poll watcher-174 trên boot cũ 3c704685 (+5 s sau btime — overlap) |
| 01:02:13Z | **Poll cuối watcher-174** (+36 s sau btime — F-175-T5-1); watcher chết theo #86 |
| 01:02:28Z | Hoạt động dpkg đầu trên #86: 2 dòng `startup packages configure` (boot+51s, reconcile heal) |
| 01:03:39Z | Dòng ENOSPC đầu trên #86 (boot+2m02s) |
| 01:13:46–01:22:11Z | **Replay #86: 50 transaction apt** (boot+12m09s → boot+20m34s); gói cuối gstreamer1.0-tools |
| 02:35:51Z | Lượt cron đợt 175 mở |
| ~02:38Z | **T5-175 mở trên #86**: replay ĐÃ XONG (dpkg 1545 ổn định từ 01:22:11Z, 0 proc); cache 183 .deb; lists 37; GST 269 file; `/tmp/l8-postboot-apt.log` KHÔNG có (F-173-T5-9: /tmp không giữ qua reboot) |
| 02:40:29Z | **Watcher-175 START, pid 16528, boot 70b7f7ee** (khoảng không-watcher 5.896 s tính từ poll cuối watcher-174 01:02:13Z); REPLAY_DONE + **postboot poll0 exit=0** ngay poll đầu → **FLAG-WRITTEN mode replay-day-du poll=0** |
| 02:40:29Z | **Cờ POSTBOOT_PASS #86 ghi (boot+1h38m52s, replay-đầy-đủ, poll=0)**; backup cờ #85 thành `POSTBOOT_PASS-3c704685` |
| 02:40:xxZ | T5 verify độc lập check-only trên #86: **exit=0, 11/11 gói + 5/5 lib, GST 269=269** (log `t5-postboot-independent-70b7f7ee.log`) |
| 02:41:59Z | Stats script chạy lần 1; watcher-175: 4 poll; ENOSPC 33 dòng; RAM 763.388 kB |
| 02:42:23Z | T4-175 poll #2: gate0=T5 (t5flag=PASS, postboot_exit=0), RAM 684 MB |
| 02:43:10Z | T4-175 poll #3: gate0=T5, RAM 1.073 MB |
| 02:43:2xZ | Stats script chạy lần 2; watcher-175: 6 poll; ENOSPC 34 dòng; RAM 1.065.096 kB |
| ~02:44Z | T5 viết LIMITS này. Watcher-175 vẫn ALIVE (pid 16528). T4-175 đang gate0wait (chưa attempt). 0 cờ round175 `.done` lúc T5 đóng. |

Tuổi boot theo btime: #85: 7.321 s (2h02m01s, tính tới btime #86).

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 22 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kết quả stats (cả 2 lần chạy đều giống): `user@0` inactive; `logind` inactive; `dbus` inactive; `loginctl` root "Failed to connect to bus"; không thư mục linger (`/var/lib/systemd/linger` không tồn tại); không `/run/user/0`; không lệnh `crontab`; 0 timer VCut (timers có keyword VCut = 0); không user manager nào.

Đây là lần thứ 22 liên tiếp hướng (3) đứng. Không thay đổi gì ở hướng này trong đợt 175. T5 KHÔNG dùng systemd user manager / timer nào để giữ watcher — watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172/173/174.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47Z). Marker sống qua **#49–#85 = 37 reboot ĐÃ XÁC NHẬN** (T0-174 xác nhận #84 + #85 theo aggregate 174 §1; parent quyết (e)/(p) đợt 174). **#86 chờ T0-175 xác minh 9 nguồn** — nếu xác nhận, marker sống qua #49–#86 = 38 reboot. T5 không có bằng chứng mới nào về cơ chế bảo toàn `~/.config` ngoài sự tồn tại của marker — không mở lại chủ đề.

**Đồng hồ (đo 2 lap tay, 02:42:41–02:42:44Z):** lap1 local [02:42:41.130, 02:42:42.643] → CF 02:42:43 GMT (CF nhanh hơn ~0,4–1,9 s); lap2 local [02:42:42.643, 02:42:43.742] → CF 02:42:44 GMT (nhanh hơn ~0,3–1,4 s). **Hợp nhất: CF nhanh hơn local ~0,3–1,9 s, thường ~1 s** (cùng họ các đợt trước). **Btime ghi bằng epoch nguyên vẫn là đồng hồ chuẩn**; gap trong file này tính bằng epoch nguyên — không dùng phân số.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #86 — ĐÃ CÓ (replay-đầy-đủ, poll=0) — KHÔNG caveat repair

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round175-t5/POSTBOOT_PASS`, 315 B, mtime 2026-11-23T02:40:29.816887655Z.
- Nội dung: `boot 70b7f7ee-2e0b-4565-b019-bdabc2c6e92c (btime 2026-11-23 01:01:37Z; watcher-175) — replay-day-du: dpkg 1545 dong; cache 183 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-23T02:40:29Z; POSTBOOT_PASS moi ghi 2026-11-23T02:40:29Z poll=0 (replay-day-du); co cu 3c704685 luu POSTBOOT_PASS-3c704685`.
- Backup cờ cũ: `POSTBOOT_PASS-3c704685`, 334 B — diff khớp file gốc round174-t5 (cờ #85).
- **Lịch trình (watcher tự làm, không tay):** watcher-175 START 02:40:29Z → REPLAY_DONE + poll0 exit=0 ngay poll đầu (dpkg đã ổn định từ 01:22:11Z, ~1h18m trước khi watcher spawn — trigger DONE ở poll đầu là đúng thiết kế: `lines == prev_lines` + 0 proc + lines > 100) → FLAG-WRITTEN cùng giây. KHÔNG trigger early-repair (replay đã chạy, dpkg > 100); KHÔNG cần manual repair.
- **Verify độc lập (T5, check-only, không qua watcher):** postboot check-only ~02:40Z **exit=0** — PASS wrapper K1, PASS libs, PASS GST, PASS apt, kết luận "DU DIEU KIEN chay WebKit"; stats §5: **11/11 gói đã cài** (phiên bản Y HỆT #85 trừ libc-bin — xem §5.1) + **5/5 lib CÓ**; GST thư mục thật **269=269** (không symlink).
- **Điểm khác các cờ gần đây:** đây là **cờ replay-đầy-đủ đầu tiên kể từ #80** (các cờ #81/#84/#85 đều mode repair — #81 repair-sớm-quyết-h, #84 repair-sớm-quyết-h, #85 repair-tay-T5). Mode ghi là `replay-day-du` (không phải repair), poll=0 (không phải poll=1). **Parent quyết cờ này có đứng cho gate (a) KHÔNG caveat không (§9(b))** — T5 KHÔNG tự phán gate. T4-175 đã dùng cờ từ poll #2 (02:42:23Z, gate0=T5) nhưng vẫn gate0wait (RAM < gateA ở poll #2), chưa bắt đầu attempt.
- **F-173-T5-9 VẪN ÁP DỤNG:** không có repair đợt này nên không có log apt nào cần copy; watcher-175 mang lệnh copy tương tự sau mọi --repair của nó (dòng `cp` trong script, chưa từng kích đợt này).

### §3.2. Cờ #85 — VẪN CÓ, còn hiệu lực (xác minh lại)

- Cờ: `round174-t5/POSTBOOT_PASS`, mtime **23:46:57.579559624Z KHÔNG ĐỔI** (repair-tay-T5, poll=1, dpkg 1731, cache 175, lists 75; backup POSTBOOT_PASS-3c704685 trong round175-t5 + bản gốc round174-t5).
- Parent CHẤP NHẬN (c)/(k) đợt 174: cờ #85 đứng cho gate (a) VỚI caveat "repair-tay-T5 + replay một phần 159/170".

### §3.3. Cờ #84 / #81 / #80 / #79 / #77 / #75 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #84 (4ae2d2ea, btime 21:01:15Z) | round173-t5/POSTBOOT_PASS, mtime 21:27:05.996330814Z | repair-sớm-quyết-h, poll=1, dpkg 795, cache 110, lists 75 |
| #81 (4b9db449, btime 17:02:05Z) | round172-t5/POSTBOOT_PASS, mtime 17:50:32.812992807Z | repair-sớm-quyết-h, poll=1, dpkg 795, cache 110, lists 75 |
| #80 (2acdd1ab, btime 14:31:01Z) | round171-t5/POSTBOOT_PASS, mtime 14:52:09.925608854Z | replay-đầy-đủ, poll=0, dpkg 1545, cache 178, lists 37 |
| #79 (5df1871f) | round170-t5/POSTBOOT_PASS | replay-đầy-đủ, poll=0, dpkg 1545, cache 178, lists 37 |
| #77 (576ca271) | round168-t5/POSTBOOT_PASS | replay-đầy-đủ, poll=0, dpkg 1545, cache 178, lists 37 |
| #75 (c44cc3ba) | round169-t5/POSTBOOT_PASS | mode repair, dpkg 795 |

**Mtime các cờ #85/#84/#81 KHÔNG ĐỔI** (đã xác minh lại lúc stats — cả hai lần chạy). Không cờ nào bị ghi đè ngoài vòng đời của nó.

### §3.4. Các boot KHÔNG có cờ (danh sách đầy đủ — không đổi)

| Boot | Trạng thái |
|---|---|
| #34e61c92 (#82) | **KHÔNG CÓ** (boot thứ 15 không cờ, không bù được) |
| #dd08464a (#83) | **KHÔNG CÓ** — parent chọn (b2) đợt 173: thành boot thứ 16 không cờ, KHÔNG bù |
| #e298bb52 | Không có |
| #f2b97695 | Không có |
| #b643911f | Không có |

Tổng cộng **16 boot không cờ**: #51, #53, #54, #55, #57, #60, #63, #66, #68, #71, #72, #73, #76, #78, #82, #83. (#86 CÓ cờ nên tổng giữ 16.)

### §3.5. Watcher-175 (boot #86) — ĐANG CHẠY, đã làm xong nhiệm vụ chính

- Spawn 02:40:29Z, pid **16528**, boot 70b7f7ee, hạn 05:30:00Z 23/11. Khởi tạo: dpkg 1545 dòng, md5 b7ea8329, mtime 01:22:11Z, cache 183, lists 37, GST 269.
- **6 poll** lúc stats lần 2 (poll cuối 02:42:31Z: dpkg 1545, md5 b7ea8329, gst 269, cache 183, lists 37, 0 proc); gaps {30 s ×4, 31 s ×1} — đều.
- **REPLAY_DONE + postboot poll0 exit=0 + FLAG-WRITTEN ngay poll đầu** (mode replay-day-du, poll=0). KHÔNG trigger early-repair; KHÔNG tự repair.
- Watcher vẫn ALIVE lúc T5 đóng; hạn 05:30:00Z 23/11 — T5-176 tiếp quản theo dõi; nếu reboot mới, spawn watcher mới theo mẫu.

### §3.6. Watcher-174 (boot #85) — CHẾT theo #86

- Spawn 23:42:00Z 22/11, pid **12991**, boot 3c704685, hạn 02:30:00Z 23/11. **166 dòng log, 161 poll**; gaps {30 s ×147, 31 s ×13} — đều, không gap repair; poll đầu 23:42:00Z, **poll cuối 01:02:13Z**; 0 dòng END/STOP/NEWBOOT; boot_set {3c704685}; dpkg {1647, 1731}; md5 {faec55b4, cee3466c}.
- **Poll cuối 01:02:13Z — 36 s SAU btime #86 (F-175-T5-1)** — mẫu overlap thứ sáu, LỚN NHẤT (F-170-T5-1: 11 s → F-172-T5-1: 20 s → F-173-T5-1: 23 s → F-173-T5-5: 9 s → F-174-T5-1: 8 s → **F-175-T5-1: 36 s**). Poll 01:01:42Z (+5 s) cũng thuộc boot cũ.
- **F-171-T5-1 KHÔNG lặp lại ở watcher-174** — poll liên tục tới reboot; chết trước hạn END 02:30:00Z 1h27m47s chỉ vì reboot giết.
- Cờ #85 đã ghi 23:46:57Z 22/11 (FLAG-WRITTEN boot=3c704685 mode=repair-tay-T5 poll=1 — do T5 viết tay, không phải watcher; xem LIMITS đợt 174 §3.1).

---

## §4. Boot #86 + F-175-T5-1 + gap kiểm lại độc lập

### §4.1. Boot #86 (70b7f7ee)

- boot_id đầy đủ `70b7f7ee-2e0b-4565-b019-bdabc2c6e92c`; btime **01:01:37Z** (epoch 1795395697 — kiểm bằng /proc/stat + `date -d @1795395697` khớp); uptime -s 01:01:37Z; /proc/1 mtime 01:01:55.793Z (**+18,793 s**); journal first entry 01:01:56Z (**+19 s**); journal chỉ có idx 0 duy nhất; `/tmp/.X11-unix` trống lúc mở, X188 xuất hiện 02:40Z (xem §7); marker không đổi.
- **Gap #85→#86 = 7.321 s = 2h02m01s** (theo T7-174; T5 kiểm lại: 1795395697 − 1795388376 = 7321). #86 xảy ra 1h34m TRƯỚC khi đợt 175 mở — trong khoảng không-watcher (watcher-174 đã chết 01:02:13Z, watcher-175 spawn 02:40:29Z).
- Trạng thái lúc T5 mở (~02:38Z): replay ĐÃ XONG (transaction cuối End-Date 01:22:11Z); dpkg 1545 dòng; cache 183 .deb; lists 37; GST 269 file (thư mục thật); `/var/log/apt` CÓ (history 50 transaction); `/var/lib/hatch/os-intent` CÓ (dpkg-state.txt 952 dòng + ledger.jsonl 2 dòng, xem §5.1); `/var/lib/hatch-preflight` KHÔNG có; `/tmp/l8-postboot-apt.log` KHÔNG có.
- **Số hiệu #86 CHƯA XÁC NHẬN** — chờ T0-175 xác minh 9 nguồn (T5 KHÔNG phán số hiệu; T7-174 đã xác minh 9 nguồn sơ bộ cho #86).
- **T5 KHÔNG phán (m).** (m) #84/#85 DƯƠNG đã chấp nhận (f) đợt 174; (m) #86 DƯƠNG ỨNG VIÊN (sơ bộ, lean T7-174: requeue run 174 +49,418 s, sát biên TRÊN 0,382 s — sát biên nhất từng ghi) — CHƯA CHỐT, thuộc T2-175 + parent 175. T5 chỉ trình số thô.

### §4.2. F-175-T5-1 và chuỗi mẫu overlap poll-cuối-sau-btime

| Mã | Watcher | Poll cuối | Btime mới | Chênh |
|---|---|---|---|---|
| F-170-T5-1 | watcher-170 | — | — | **11 s** |
| F-172-T5-1 | watcher-171 | — | — | **20 s** |
| F-173-T5-1 | watcher-172 | 19:01:11Z (boot 4b9db449) | #82 19:00:48Z | **23 s** |
| F-173-T5-5 | watcher-173 | 21:01:24Z (boot dd08464a) | #84 21:01:15Z | **9 s** |
| F-174-T5-1 | watcher-173b | 22:59:44Z (boot 4ae2d2ea) | #85 22:59:36Z | **8 s** |
| **F-175-T5-1** | watcher-174 | 01:02:13Z (boot 3c704685) | #86 01:01:37Z | **36 s** |

Watcher-174 đọc được boot_id cũ 36 s sau btime mới (boot_id cũ còn đọc được sau btime mới — đã giải thích ở F-172-T5-1). Đây là mẫu thứ sáu của hiện tượng này (11 → 20 → 23 → 9 → 8 → **36 s — LỚN NHẤT từ trước**). **Không ảnh hưởng verdict** — cả 3 poll sau btime (01:01:42Z, 01:02:13Z) vẫn thuộc boot cũ (dpkg/md5 khớp #85), không có poll nào bị gán nhầm boot. Đính chính: bản nháp đầu của T5-175 ghi nhầm 5 s (chỉ nhìn poll 01:01:42Z) — đã sửa thành 36 s sau khi đọc toàn bộ log (xem §10, F-175-T5-5).

---

## §5. Replay #86 đầy đủ + ledger

### §5.1. Replay #86 CHẠY ĐẦY ĐỦ — F-174-T5-6 KHÔNG lặp lại

- **Hoạt động:** dpkg đầu 01:02:28Z (boot+51s, 2 dòng `startup packages configure` — reconcile heal), rồi IM LẶNG 11m17s; apt transactions 01:13:46–01:22:11Z (boot+12m09s → boot+20m34s), **50 transaction, 50 dòng Install:**, gói cuối gstreamer1.0-tools; dpkg 2 → **1545 dòng**. Breakdown: startup 106, install 169, status 1040, configure 178, trigproc 43, upgrade 9 — **Y HỆT mẫu đầy đủ #77/#79/#80 (1545 dòng / 169 install / 9 upgrade / 178 configure)**.
- **Bracket replay (theo dpkg.log): (51 s, 20m34s]** — hoạt động đầu 01:02:28Z, cài xong toàn bộ 01:22:11Z, 0 entry dpkg/apt nào sau đó. Pha apt riêng: (12m09s, 20m34s]. Khoảng lặng 11m17s giữa reconcile burst và transaction apt đầu — cùng mẫu #85 (lặng ~17m giữa dpkg đầu 23:00:10Z và install 23:17:06Z), hẹp hơn.
- **Kết quả postboot poll0 (02:40:29Z, exit=0):** PASS wrapper K1; **PASS libs** (5/5: libevent/libEGL/libavif/libdw/libevdev); **PASS GST** (thư mục thật, 269 file); **PASS apt: 11/11 gói đã cài**. T5 verify độc lập (check-only) khớp: 11/11 gói + 5/5 lib.
- **Phiên bản gói:** Y HỆT #85 (plugins-good 1.24.2-1ubuntu1.8, plugins-bad 1.24.2-1ubuntu4, -gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, libc-bin 2.39-0ubuntu8.12 — upgrade libc6 từ #84 đã giữ sang #86, không upgrade thêm). term.log **0 lỗi** (grep error/fail: 0 dòng; `Log ended: 01:22:11`).
- **Cache/lists:** cache 183 .deb, 174.811.538 byte; lists 37 (cogentco 34 + 3 file khác; azure 0 — chỉ 1 mirror trong lists, cùng tổng 37 như mẫu đầy đủ #77/#79/#80).
- **F-174-T5-6 (replay #85 một phần, 2 gói không được thử cài) KHÔNG lặp lại ở #86** — replay lần này đủ 170/170 intent, không thiếu gói postboot nào. Đề xuất parent: ghi nhận không lặp lại; việc điều tra host-side cho #85 vẫn KHÔNG bắt buộc theo quyết (k) đợt 174 (bằng chứng trong cell đã hết).
- **So sánh bốn mẫu replay:** #77/#79/#80 đầy đủ (170/170, dpkg 1545, poll0 exit=0) — **#86 đầy đủ (170/170, dpkg 1545, poll0 exit=0)** — #83 một phần nặng (23/170, thiếu suite) — #85 một phần nhẹ (159/170, chỉ thiếu 2 gói). #86 trở lại mẫu đầy đủ sau 2 boot một phần (#83, #85) xen kẽ 1 boot repair (#84).

### §5.2. Ledger (F-175-T5-2 — cùng họ F-174-T5-2)

- ledger.jsonl: 2 dòng; dòng compacted cuối ts **1795391156 = 2026-11-22 23:45:56Z** — đúng lúc manual repair #85 kết thúc (23:45:55Z). **Ledger KHÔNG viết lại ts khi sang boot mới** — ts compacted mang sang #86 nguyên vẹn, giống F-174-T5-2 (ts 1795382825 = 21:27:05Z lúc repair #84 mang sang #85).
- `added`: **170 tên**, `removed`: [] — khớp intent 170 gói; 5 tên cuối: libwoff1, xfonts-cyrillic, xfonts-scalable, gstreamer1.0-tools, libevent-2.1-7. dpkg-state.txt 952 dòng (mtime 01:22Z — replay reset cuối).
- Không ảnh hưởng số đếm (added vẫn 170); ghi nhận để T2/T10 đối chiếu ledger không nhầm ts với boot.

---

## §6. Quy tắc đứng (B4 + hướng (3))

- **B4 GIỮ NGUYÊN:** T5-175 **KHÔNG chạy probe chạm dpkg nào** trong cửa sổ attempt của T4 — 0 lần `dpkg --configure -a`, 0 lần apt install/update. T4-175 mới mở poller lúc 02:42Z (poll #2 02:42:23Z, poll #3 02:43:10Z — gate0wait, 0 attempt); toàn bộ công việc T5 (spawn watcher 02:40:29Z, verify check-only ~02:40Z, stats 02:41:59Z + 02:43:2xZ) đều là check-only đọc hoặc watcher poll — không chạm dpkg.
- **Các lệnh T5 đã chạy đều là check-only (chỉ đọc):** `dpkg-query`, `apt-get install -s` KHÔNG dùng đợt này (không cần — poll0 đã PASS), postboot check-only (không sửa), `ldconfig -p` (đọc), đọc log/journal, `curl` lấy Date header Cloudflare.
- **Manual --repair: KHÔNG CẦN, KHÔNG CHẠY** — poll0 exit=0 nên watcher tự viết cờ; không có đường repair nào kích (watcher không repair, T5 không repair tay). Đây là khác biệt lớn nhất so với đợt 174 (T5 phải repair tay 3m10s).
- **Hướng (3) đứng lần thứ 22** (§2). G1 chờ user quyết (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (birefnet 0 thử lần thứ 28 — theo T9 đợt 174; T5 không đo lại). File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` số phận vẫn chưa quyết.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file LIMITS (§11).

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #86 (HỒI NHANH — giao T9):**

| Lần chạy | MemAvailable | MemFree | Loadavg |
|---|---|---|---|
| Mở phiên (02:39:04Z) | 465.820 kB | 147.700 kB | 1,94 1,72 1,36 |
| Stats lần 1 (02:41:59Z) | 763.388 kB | 180.604 kB | 9,68 4,37 2,40 |
| Lúc đo tay (02:42:4xZ) | 1.134.572 kB | — | — |
| Stats lần 2 (02:43:2xZ) | 1.065.096 kB | — | — |

MemTotal 8.124.900 kB. MemAvailable hồi ~600 MB trong ~4 phút (từ trũng 465 MB lên >1,1 GB) — ngược với đợt 174 (giảm ~300 MB / 3 phút). Loadavg 1-phút vọt 1,94 → 9,68 → 11,09 (poll T4 #2) do vite O8 của T0-175 (cổng 5560) + preflight T4-175 cùng chạy. RAMavail trong poll T4: 684 MB (poll #2, < gateA 1024 MB) → 1.073 MB (poll #3). Headroom — chỉ theo dõi (theo T9).

**ENOSPC #86 (T9 đếm chính thức):** 31 dòng lúc 02:39Z (journal 354 dòng lúc stats lần 2) → **33 dòng lần 1** → **34 dòng lần 2** (02:43Z). Dòng đầu: `Nov 23 01:03:39 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor ...: No space left on device` (boot+2m02s); dòng cuối lúc đóng 02:41:12Z — **vẫn tiếp diễn, nhịp ~70 s**. Đợt này là đợt thứ 24 liên tiếp có lỗi thật nếu T9 đếm vậy (đợt 174 là thứ 23).

**X11:** **1 socket X188 trong /tmp/.X11-unix (mtime 02:42Z) + Xvfb :188 đang chạy** (pid 21291 lúc đo tay — pid đổi từ 17335 lúc 02:40Z, Xvfb đã restart một lần). Socket xuất hiện 02:40Z cùng lúc preflight T4-175 — chủ là T4-175 (attempt prep), không phải T5 (T5 không chạy X nào). T5 KHÔNG dọn (không phải của mình — bài học đợt 174: không tự dọn socket luồng khác); giao T8 xử lý theo checklist (o) nếu cần. Lúc mở trên #86 (02:38–02:39Z) `/tmp/.X11-unix/` TRỐNG — T5 đã kiểm lúc mở (khác thiếu sót đợt 174).

**Journal #86:** 354 dòng lúc stats lần 2; first entry 01:01:56Z (+19 s sau btime); chỉ có idx 0 duy nhất.

---

## §8. Nợ mở chuyển đợt 176

1. **(m) #86** — T2-176 đối chiếu độc lập + parent quyết (DƯƠNG ỨNG VIÊN sơ bộ, lean T7-174: +49,418 s, sát biên TRÊN 0,382 s — sát biên nhất từng ghi).
2. **INSIDE #86** — T2-176 (dải FULL132; chuỗi dài 4 từ #82 — theo parent (d) đợt 174).
3. **Cờ #86 (replay-đầy-đủ, poll=0)** — parent quyết §9(b): có đứng cho gate (a) KHÔNG caveat không.
4. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 19 thuộc T2-175; U union-A/B cách sàn 29 s — theo dõi sát).
5. **(1c') (f') V1 live** — T8-176 theo dõi (0 kích hoạt đợt 174, 0 FP trên 10 log sạch; V2 (f'') dự phòng).
6. **84l10 điều tra riêng + Q3 heartbeat** — T8-176 (đợt 3 xong đợt 174; chưa có ca kẹt mới sau Q3).
7. **Balloon episodes trên #86** — T9-176 (E-185/E-186 ĐANG GHIM — kết cục thuộc T9-175).
8. **POSTBOOT_PASS #87?** — T5-176 (watcher-175 vẫn chạy trên #86 tới hạn 05:30:00Z 23/11; nếu reboot mới xảy ra, spawn watcher mới theo mẫu).
9. **Prune lần 50** — T6-176. **Checklist (o)** — T8-176 (gồm X11 X188 + Xvfb :188, §7). **H3** chỉ giám sát thụ động.
10. **Run 174 kết cục** — T7-176 (vẫn running lúc T7-174 đóng; viết lại 1 lần tại #86; jitter +13 s).
11. **#86 có giết holder không** — T6-176 (#84/#85 KHÔNG giết holder — chuỗi "không giết holder" từ #69: 17 reboot theo parent (i) đợt 174).
12. **F-175-T5-3** (postboot script in dòng lịch sử DOT-151 cứng — xem §9(f)): có sửa script repo hay không — thuộc batch sửa script, không phải T5-175.
13. **Replay #85 một phần (F-174-T5-6)** — không lặp lại ở #86 (§5.1); điều tra host-side cho #85 vẫn KHÔNG bắt buộc theo quyết (k) đợt 174.
14. **G1 khung (a) M2** vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời). **R9 (a)** vẫn chờ user (số đếm vẫn là 16).
15. **T2-176/T4-176:** không chạy script phân tích nặng trong cửa sổ attempt + nhắc T5 không probe dpkg trong cửa sổ attempt (B4 đứng).
16. **RAM #86 hồi nhanh** (465 MB → 1,13 GB / 4 phút lúc stats; T4 poll #2 còn 684 MB) — T9-176 theo dõi; có thể ảnh hưởng gateA của T4-176.

---

## §9. Đề xuất cho parent (quyết ở aggregate 175)

**(a) Chấp nhận verdict đợt 175?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #86 đã có (replay-đầy-đủ, poll=0, verify độc lập exit 0), watcher-175 đang chạy tốt, F-174-T5-6 không lặp lại, hướng (3) lần 22, marker sống. Không có caveat repair nào đợt này.

**(b) Cờ #86 (replay-đầy-đủ, poll=0) — CÂU HỎI QUYẾT:** Watcher-175 tự viết cờ sau poll0 exit=0 trên boot SỐNG (log `t5-postboot-poll0-70b7f7ee.log`), T5 verify độc lập check-only exit=0 (`t5-postboot-independent-70b7f7ee.log`), 11/11 gói + 5/5 lib + GST 269=269. Không repair nào diễn ra. **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #86 đứng cho gate (a) **KHÔNG caveat** — như tiền lệ #77/#79/#80 (replay-đầy-đủ, poll=0);
- (b2) Không chấp nhận cờ replay-đầy-đủ (không có tiền lệ nào bác cờ replay-đầy-đủ; T5 không thấy căn cứ cho (b2)).

**(c) Xác nhận số hiệu boot #86** — chờ T0-175 xác minh 9 nguồn (T5 không phán; T7-174 đã xác minh 9 nguồn sơ bộ cho #86).

**(d) F-175-T5-1 (36 s)** — ghi nhận mẫu overlap thứ sáu, LỚN NHẤT từ trước; không đổi verdict (m); không cần hành động.

**(e) F-175-T5-2 (ledger ts mang sang boot mới)** — ghi nhận, cùng họ F-174-T5-2; không ảnh hưởng số đếm.

**(f) F-175-T5-3 (postboot script in dòng lịch sử DOT-151 cứng — xem §10)** — ghi nhận; có sửa script repo (dòng 686) hay không là quyết của parent (không bắt buộc cho đợt này; dòng đó chỉ là log nhiễu, verdict thật nằm ở các dòng PASS sau nó). **Replay #86 đầy đủ — KHÔNG cần điều tra host-side** (F-174-T5-6 không lặp lại).

**(g) Watcher-175 vẫn đang chạy trên #86** (pid 16528, hạn 05:30:00Z 23/11) — T5-176 tiếp quản theo dõi; nếu reboot mới, spawn watcher mới theo mẫu.

**(h) X11 X188 + Xvfb :188 (của T4-175)** — giao T8 xử lý theo checklist (o); T5 không dọn vì không phải của mình.

---

## §10. Sai số của chính T5-175 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-175-T5-1** | Poll cuối watcher-174 nằm SAU btime #86 **36,0 s** (mẫu overlap thứ sáu, LỚN NHẤT: 11→20→23→9→8→36 s) | Ghi nhận | Không ảnh hưởng verdict; cả 3 poll sau btime vẫn thuộc boot cũ (dpkg/md5 khớp #85) |
| **F-175-T5-2** | Ledger compacted ts 1795391156 (= 23:45:56Z 22/11, lúc repair #85) mang sang #86 — replay không viết lại ts compacted; ledger chỉ có 2 dòng lúc T5 mở | Ghi nhận | Không ảnh hưởng số đếm (added vẫn 170); ghi nhận để T2/T10 đối chiếu ledger không nhầm ts với boot |
| **F-175-T5-3** | Postboot script `vcut-webkit-postboot-check.sh` dòng 686 in CỨNG một dòng lịch sử DOT-151 (boot #41, "poll2 doc lap 02:40:23Z") trên MỌI lần chạy — dòng này trùng giờ chạy hôm nay nên dễ đọc nhầm thành kết quả live | Ghi nhận, chưa sửa | Verdict thật là các dòng PASS wrapper/libs/GST/apt + KET LUAN sau đó (đều live, exit=0); dòng 686 là boilerplate cũ trong script repo — sửa script thuộc batch riêng, T5 không tự sửa file repo |
| **F-175-T5-4** | Stats script §12 in `khong_watcher_giay ... tu=2026-11-23T01:02:13ZZ` (thừa một chữ Z — nối chuỗi tay) | Cosmetic, đã ghi nhận | Không ảnh hưởng số: khoảng không-watcher = 5.896 s (01:02:13Z → 02:40:29Z) đúng |
| **F-175-T5-5** | Bản nháp đầu của T5-175 ghi nhầm overlap F-175-T5-1 là 5 s (chỉ nhìn poll 01:01:42Z, chưa đọc hết log) | Đã sửa TRƯỚC khi viết LIMITS | Đọc toàn bộ log watcher-174: poll cuối thật là 01:02:13Z → **36 s**; đã sửa cả header watcher-175 + LIMITS này |
| — | Stats lần 1 chỉ đo clock 1 lap (thiếu local trước/sau) | Đã sửa | Đã đo lại 2 lap tay (§2): CF nhanh hơn local ~0,3–1,9 s |
| — | T5 KHÔNG append dòng ghi chú vào `replay-watch-175.log` | Quyết định có chủ ý | Tránh lệch số dòng so với stats đã trích; cờ + verify ghi ở file riêng + LIMITS này |
| — | Khoảng không-watcher 5.896 s bao trọn replay #86 | Hạn chế bằng chứng | Không watcher nào quan sát replay trực tiếp; T5 dựng lại timeline từ dpkg.log/history.log/term.log (đủ chi tiết: từng transaction có End-Date) |
| — | Số dòng dpkg trên #86 TRƯỚC replay (2) vs SAU replay (1545) | Đã đo | Replay thêm đúng 1.543 dòng; breakdown §5.1 khớp mẫu đầy đủ |

**Số liệu chính thức trong file này lấy từ stats lần 2 (02:43:2xZ) + các log trực tiếp; stats lần 1 (02:41:59Z) chỉ dùng để đối chiếu (RAM/ENOSPC diễn biến).**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND175_T5_INFRA_LIMITS.md` (file này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round175-t5-infra.txt` (NUL-delimited, 1 entry; đã verify bằng read-back `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round175-t5/` (theo mẫu T5-171/172/173/174): watcher script/log, stats script/output, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–175: đợt 166–174 = 90 batch / 127 entry / 117 file (theo quyết (q)/(r) đợt 174) + đợt 175 (1 file này) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích stats output lần 2 (bản chính, 02:43:2xZ; đã lược ledger jsonl dài — chỉ giữ added=170/removed=[])

```
=== PHU LUC SO LIEU T5-175 (trich bang script, 2026-11-23T02:43:2xZ) ===
boot_id=70b7f7ee-2e0b-4565-b019-bdabc2c6e92c
btime_epoch=1795395697 = 2026-11-23T01:01:37+00:00
/proc/1 mtime=2026-11-23 01:01:55.793014505 +0000
journal_boots: IDX 0 70b7f7ee2e0b4565b019bdabc2c6e92c Mon 2026-11-23 01:01:56 UTC Mon 2026-11-23 02:43:xx UTC

--- replay-watch-174.log (round174-t5) ---
tong_dong=166 polls=161; gaps={30.0: 147, 31.0: 13}
poll_cuoi=2026-11-23T01:02:13Z boot=3c704685 poll dpkg_lines=1731 md5=cee3466c apt=[] apt2=[] dpkg=[] gst_sys=269 cache=175 lists=75
mtime_log=2026-11-23 01:02:13.043424802 +0000

--- replay-watch-175.log (round175-t5) ---
tong_dong=11 polls=6; gaps={30.0: 3, 31.0: 2}
poll_cuoi=2026-11-23T02:43:01Z boot=70b7f7ee poll dpkg_lines=1545 md5=b7ea8329 apt=[] apt2=[] dpkg=[] gst_sys=269 cache=183 lists=37
flag_lines=['2026-11-23T02:40:29Z FLAG-WRITTEN boot=70b7f7ee mode=replay-day-du poll=0 (old=3c704685)']

--- 3. POSTBOOT_PASS ---
round175-t5/POSTBOOT_PASS: CO mtime=2026-11-23 02:40:29.816887655 +0000 bytes=315
round174-t5/POSTBOOT_PASS: CO mtime=2026-11-22 23:46:57.579559624 +0000 bytes=334
round173-t5/POSTBOOT_PASS: CO mtime=2026-11-22 21:27:05.996330814 +0000 bytes=325

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47.272154981 +0000

--- 5. dpkg/cache/lists/GST ---
dpkg_lines=1545 md5=b7ea8329 mtime=2026-11-23 01:22:11.634403523 +0000
dpkg_dong_dau=2026-11-23 01:02:28 startup packages configure
dpkg_dong_cuoi=2026-11-23 01:22:11 status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2
dpkg_breakdown={'startup': 106, 'install': 169, 'status': 1040, 'configure': 178, 'trigproc': 43, 'upgrade': 9} tong=1545
cache_deb=183 cache_bytes=174811538 lists_entries=37 (azure 0, cogentco 34)
gst_sys_files=269 gst_sys_is_link=KHONG
watcher175_ps=16528 bash .../round175-t5/replay-watch-175.sh; watcher175_pid16528_kill0=ALIVE; watcher174_pid12991_kill0=DEAD

--- 6. 11 goi + 5 lib + ledger ---
11/11 goi installed (plugins-good 1.24.2-1ubuntu1.8, plugins-bad 1.24.2-1ubuntu4, -gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, libc-bin 2.39-0ubuntu8.12); 5/5 lib CO
ledger: dpkg-state.txt 952 dong; ledger.jsonl compacted ts=1795391156 (2026-11-22 23:45:56Z) added=170 removed=[]
apt_history_transactions=50; dau Start-Date 01:13:46; cuoi End-Date 01:22:11; term_log_errors=0

--- 7. ENOSPC --- ENOSPC_dong=34; journal_dong=360; dau 01:03:39Z; cuoi 02:41:12Z
--- 8. RAM --- MemAvailable 1065096 kB (lan 2); MemTotal 8124900 kB
--- 9. Huong (3) --- user@0/logind/dbus inactive; linger KHONG-CO; /run/user/0 KHONG-CO; crontab not found; timers_vcut=0
--- 10. Co round175 .done --- (0 co luc dong T5)
--- 11. X11 --- X188 (mtime 02:42Z) + Xvfb :188 pid 21291
--- 12. Khoang khong-watcher --- 5896 s (01:02:13Z -> 02:40:29Z); F-175-T5-1 = 36 s
=== HET PHU LUC T5-175 ===
```
