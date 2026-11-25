# PHASE 9 — ROUND 180 — T5 INFRA LIMITS

**Đợt:** 180 (mở lượt cron 03:35:51 +07 24/11/2026 = 20:35:51Z 23/11; hạn cờ ~23:00Z, hạn cứng ~23:35Z; T5 đóng ~21:05Z — sớm, cờ xong 20:59:47Z).
**Người viết:** T5-180. **Ngày:** 23/11/2026. **Boot làm việc lúc đóng:** #95 ỨNG VIÊN (T0-180 chưa xác minh lúc T5 đóng) 95b483a2, btime 19:10:22Z (epoch 1795461022, theo /proc/stat).
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #95 (replay-đầy-đủ, poll=0, KHÔNG caveat — §3.1) + #94 VẪN CÓ + KHÔNG sửa file repo nào đợt này ngoài LIMITS này. File này là 1 entry stage duy nhất đợt 180 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #95 (95b483a2, btime 19:10:22Z) | **ĐÃ CÓ 20:59:47Z (boot+1h49m25s, replay-đầy-đủ, poll=0)** — watcher-180 REPLAY_DONE → poll0 exit=0; verify độc lập exit=0; 11/11 gói NEED + 5/5 lib; GST 269=269 **thư mục thật (KHÁC #94: symlink debroot — GIỐNG #92)**; **tools ĐÃ cài**; libc-bin 8.12 (= #92). **KHÔNG caveat** |
| Replay #95 | **CHẠY ĐẦY ĐỦ, NHANH NHẤT từ trước tới nay:** heal 19:11:01Z (boot+39 s — KHÁC #92 boot+34m17s, #94 boot+18m33s); cài xong 19:15:05Z (boot+4m43s); dpkg 1.545 dòng (= #92/#89); history 50 transaction; term.log 0 lỗi; KHÔNG cần repair |
| Watcher-179 | pid **61023 CHẾT theo #95** (poll cuối 19:10:48Z, **+26 s sau btime #95 — mẫu overlap thứ 11, F-180-T5-1**); 144 dòng, 138 poll |
| Watcher-180 | START 20:59:47Z, pid **109083**, hạn 23:35:00Z — **poll0 đã ghi cờ**; vẫn ALIVE lúc T5 đóng (poll ổn định dpkg 1.545) |
| Khoảng không-watcher | **~6.539 s = 1h48m59s** (poll cuối watcher-179 19:10:48Z → START watcher-180 20:59:47Z) — replay #95 chạy xong TRONG khoảng này, không watcher nào chứng kiến |
| POSTBOOT_PASS #94 (ae2a9a47) | **VẪN CÓ** (18:03:08Z, repair-sớm-quyết-h, poll=1, caveat repair — parent CHẤP NHẬN (c) đợt 179); backup byte-identical trong round180-t5 (md5 1ae2c3e2) |
| POSTBOOT_PASS #93 (97054ac6) | **KHÔNG CÓ — ĐÃ XÁC NHẬN** (đợt 179); tổng boot không cờ GIỮ 20 |
| Hướng (3) | **VẪN ĐỨNG lần thứ 27 liên tiếp** (user@0 static, không linger, không cron, không /run/user/0, 0 timer VCut — loginctl vẫn no bus) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#94 = 46 reboot ĐÃ XÁC NHẬN** (T0-179); #95 chờ T0-180 (nếu xác nhận → 47) |
| ENOSPC | #95: **78 dòng "No space left on device" trong journal boot hiện tại lúc 21:01Z** (T9-179 đếm 20 lúc ~20:02Z → tăng ~58 trong ~59 phút, ≈1 dòng/phút; T9 đếm chính thức) |
| X11 | **Trống lúc mở (20:58Z) và lúc đóng (21:02Z)** — 0 Xvfb; T4-180 chưa mở dir lúc T5 đóng |
| RAM #95 | MemAvailable dao động mạnh: **471 / 773 MB** (2 điểm, giao T9) |
| Đồng hồ | Local ≈ Cloudflare **−2 s** (CF nhanh hơn ~2 s; đợt 179 ~1 s; T0-179 đo ×4: +0,6…+1,1 s — xem §2) |
| Quy tắc B4 | **T5-180 KHÔNG chạy probe chạm dpkg nào** (0 lần configure/install/update/repair tay) — KHÔNG cần repair đợt này (replay đã đầy đủ). Form-B/poll0/independent đều check-only — xem §6.1 |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot không đổi; log poll0 + independent #95 in dòng live đầu tiên, không còn dòng DOT-151 cứng) |
| F-178-T7-4 | **ĐÃ LÀM RÕ (T0-179):** worker_boot_generation theo **daemon start** — daemon #95 pid 67 start 19:10:34Z (boot+12 s); gen mới thuộc T0/T7 |
| T4-180 | **Chưa mở dir lúc T5 đóng (~21:02Z)** — chưa có poller, chưa có attempt; cờ #95 đã sẵn cho gate (a) |

**Số hiệu boot #95 CHỜ T0-180 xác minh 9 nguồn (T7-179 đã xác minh 9 nguồn trong 52 s — T5 chỉ trình số thô, khớp T7 từng số: boot_id, btime, gap).**
**T5-180 KHÔNG phán (m), chỉ trình số thô — (m) #95 thuộc T2-180 + parent quyết.**

---

## §1. Timeline (giờ Z, 23/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 17:17:09Z | Reboot #94 (ae2a9a47 — T0-179 XÁC NHẬN 9 nguồn); gap #93→#94 = 14.974 s |
| 18:03:08Z | Cờ POSTBOOT_PASS #94 ghi (repair-sớm-quyết-h, poll=1, caveat repair); watcher-179 pid 61023 tiếp tục chạy |
| 19:10:22Z | **Reboot #95 (95b483a2, epoch 1795461022 — T7-179 xác minh 9 nguồn trong 52 s; số hiệu CHỜ T0-180)**; gap #94→#95 = **6.793 s** |
| 19:10:48Z | **Poll cuối watcher-179** (+26 s sau btime #95 — F-180-T5-1); watcher chết theo #95 |
| 19:11:01Z | Heal #95: dpkg.log bắt đầu (boot+39 s); replay chạy đầy đủ, không watcher nào chứng kiến |
| 19:15:05Z | Replay #95 xong: cài cuối gstreamer1.0-tools; dpkg đạt **1.545 dòng**, ổn định |
| 20:35:51Z | Lượt cron đợt 180 mở; run 180 dispatch (boot_gen thuộc T0/T7) |
| ~20:57Z | **T5-180 mở trên #95**: replay ĐÃ XONG (dpkg 1.545 dòng từ 19:15:05Z; 0 proc apt/dpkg; cache 178; lists 71; GST thư mục thật 269); `/tmp/.X11-unix/` TRỐNG |
| 20:58:xxZ | Form-B tay TRƯỚC khi spawn watcher: postboot check-only **exit=0** (PASS wrapper/libs/GST/apt — §5.1) |
| 20:59:47Z | **Watcher-180 START, pid 109083** (khoảng không-watcher ~6.539 s); poll đầu dpkg 1.545 ổn định → **REPLAY_DONE → poll0 exit=0 → Cờ POSTBOOT_PASS #95 ghi (boot+1h49m25s, replay-đầy-đủ, poll=0)**; backup cờ #94 thành `POSTBOOT_PASS-ae2a9a47` (byte-identical) |
| ~21:00Z | T5 verify độc lập trên #95: **exit=0, 11/11 NEED + 5/5 lib, GST 269=269 thư mục thật, tools ĐÃ cài** (log `t5-postboot-independent-95b483a2.log`) |
| ~21:05Z | T5 viết LIMITS này. Watcher-180 vẫn ALIVE (pid 109083, poll ổn định dpkg 1.545). T4-180 chưa mở dir. 1 cờ round180 `.done` lúc T5 đóng (t1, 21:03Z — kiểm trực tiếp trên đĩa; các dir round180-t0/t2/t6/t7 đã có nhưng chưa có cờ). |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 27 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở: `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không linger; không `/run/user/0`; không `crontab` (lệnh không có); 0 timer VCut; không unit VCut nào ở /etc/systemd/system hay /etc/systemd/user. Lần thứ 27 liên tiếp hướng (3) đứng. T5 KHÔNG dùng systemd user manager / timer — watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–179.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z). Marker sống qua **#49–#94 = 46 reboot ĐÃ XÁC NHẬN** (T0-179: 9 nguồn #94 + đối chiếu DB #93); **#95 chưa xác nhận** — nếu T0-180 xác nhận, marker sống qua 47 reboot. T5 không có bằng chứng mới nào về cơ chế bảo toàn `~/.config` — không mở lại chủ đề.

**Đồng hồ (1 lap, 21:01:14–21:01:16Z):** local 21:01:14Z → CF `Date: Mon, 23 Nov 2026 21:01:16 GMT` — **CF nhanh hơn local ~2 s** (đợt 179 ~1 s; T0-179 đo ×4: +0,624…+1,133 s). Lệch 2 s có thể gồm ~1 s trễ curl — ghi nhận, không kết luận đồng hồ trôi thêm. **Btime ghi bằng epoch nguyên**; gap tính bằng epoch nguyên — không dùng phân số. Liên quan F-179-T9-2 (sampler cuối #94 muộn hơn btime #95 23 s — lệch đồng hồ, giao T0-180): T5 chỉ ghi nhận số đo CF lần này, không phán nguyên nhân lệch 23 s.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #95 — ĐÃ CÓ (replay-đầy-đủ, poll=0) — KHÔNG caveat

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round180-t5/POSTBOOT_PASS`, 315 B, mtime 2026-11-23T20:59:47Z.
- Nội dung: `boot 95b483a2-2c91-4dd1-882b-d8f6481391be (btime 2026-11-23 19:10:22Z; watcher-180) — replay-day-du: dpkg 1545 dong; cache 178 .deb; lists 71; postboot PASS poll0 doc lap exit 0 luc 2026-11-23T20:59:47Z; POSTBOOT_PASS moi ghi 2026-11-23T20:59:47Z poll=0 (replay-day-du); co cu ae2a9a47 luu POSTBOOT_PASS-ae2a9a47`.
- Backup cờ cũ: `POSTBOOT_PASS-ae2a9a47`, 324 B — **md5 1ae2c3e2c4102f40b007c7a384e22f2b, byte-identical với file gốc round179-t5 (cờ #94)**.
- **Lịch trình (watcher tự làm, không tay):** START 20:59:47Z → poll đầu dpkg 1.545 ổn định 2 poll liên tiếp (init = poll đầu, md5 433be629) + 0 proc → **REPLAY_DONE** → postboot poll0 exit=0 (hoàn tất 20:59:47Z) → FLAG-WRITTEN cùng giây. KHÔNG trigger repair (đúng — dpkg ≥ 100, replay đã xong). KHÔNG trigger BACKSTOP.
- **Verify độc lập (T5, check-only):** postboot ~21:00Z **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 thư mục thật** (KHÁC #94 symlink — GIỐNG #92); **tools ĐÃ cài** (KHÁC #94 repair); **libc-bin 2.39-0ubuntu8.12** (= #92, khác #94 repair 8.9).
- **KHÔNG caveat** (giống #92): GST thư mục thật, tools đã cài, dpkg 1.545, libc-bin 8.12, 50 transaction replay. **Parent quyết (§9(b))** — T5 đề xuất chấp nhận **KHÔNG caveat** (tiền lệ #92/#89).
- **Lưu ý thời gian:** cờ ghi ở boot+1h49m25s — KHÔNG phải vì replay chậm (replay xong boot+4m43s) mà vì **không watcher nào sống trên #95 trước 20:59:47Z** (khoảng không-watcher 6.539 s, §3.4). Đây là cờ ghi muộn nhất tính từ btime trong các cờ replay-đầy-đủ gần đây (#92: boot+52m14s) — nhưng mode vẫn là replay-đầy-đủ, poll=0, vì nội dung replay đã hoàn tất trước khi watcher spawn; watcher chỉ xác nhận lại trạng thái ổn định. T4-180 chưa mở lúc cờ ghi — gate (a) đã sẵn khi T4 bắt đầu.

### §3.2. Cờ #94 / #92 / #90 / #89 / #86 / #85 / #84 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #94 (ae2a9a47) | round179-t5/POSTBOOT_PASS, 18:03:08Z | repair-sớm-quyết-h, poll=1 — parent CHẤP NHẬN (c) đợt 179 CÓ caveat repair |
| #92 (985bc2a3) | round178-t5/POSTBOOT_PASS, 11:53:41Z | replay-đầy-đủ, poll=0 — parent CHẤP NHẬN (c) đợt 178 KHÔNG caveat |
| #90 (94247dfa) | round177-t5/POSTBOOT_PASS, 08:51:55Z | repair-sớm-quyết-h, poll=1 — parent CHẤP NHẬN (c) đợt 177 CÓ caveat repair |
| #89 (15618ce8) | round176-t5/POSTBOOT_PASS, 05:42:19Z | replay-đầy-đủ, poll=0, KHÔNG caveat |
| #86 (70b7f7ee) | round175-t5/POSTBOOT_PASS, 02:40:29Z | replay-đầy-đủ, poll=0 |
| #85 (3c704685) | round174-t5/POSTBOOT_PASS, 23:46:57Z | repair-tay, poll=1 |
| #84 (4ae2d2ea) | round173-t5/POSTBOOT_PASS, 21:27:05Z | repair-sớm-quyết-h, poll=1 |

**Mtime các cờ #94/#92/#90/#89/#86/#85/#84 KHÔNG ĐỔI.** Tổng boot không cờ: **GIỮ 20** (#93 mới nhất + 19 cũ: #91, #87, #88, #83, #82 + 14 boot #51/#53/#54/#55/#57/#60/#63/#66/#68/#71/#72/#73/#76/#78).

### §3.3. Cờ #93 — KHÔNG CÓ (ĐÃ XÁC NHẬN đợt 179, không bù được)

Không thay đổi so với T5-179 §3.2: watcher-178 chết theo #93; 0 file POSTBOOT_PASS nào nhắc 97054ac6; không watcher nào sống trên #93. T5-180 KHÔNG viết cờ hồi tố (quy tắc đứng — giống #87/#88/#91/#93).

### §3.4. Watcher-179 (boot #94) — CHẾT theo #95 (đính chính nhiệm vụ)

- Spawn 17:49:58Z, pid **61023**, boot ae2a9a47, hạn 20:35:00Z. **144 dòng log, 138 poll**; poll đầu 17:49:58Z, **poll cuối 19:10:48Z**; 0 dòng END/STOP/NEWBOOT; dpkg {2 → 795} trên #94.
- **Đính chính:** watcher-179 KHÔNG sống tới hạn 20:35:00Z — đã chết theo **#95 (19:10:22Z)**, sớm ~1h24m (cùng mẫu watcher-178 chết theo #93). T5-180 KHÔNG tiếp quản được (đã chết trước khi đợt mở) — chỉ ghi nhận + xác nhận cờ #95 do watcher-180 viết mới.
- **Poll cuối 19:10:48Z — 26 s SAU btime #95 (F-180-T5-1)** — mẫu overlap thứ 11 (xem §4.2). Poll trước đó 19:10:18Z, trước btime 4 s.

### §3.5. Watcher-180 (boot #95) — ĐANG CHẠY, đã làm xong nhiệm vụ chính

- Spawn 20:59:47Z, pid **109083**, boot 95b483a2, hạn 23:35:00Z. Khởi tạo: dpkg 1.545 dòng, md5 433be629, mtime 19:15:05Z, cache 178, lists 71, gst_sys 269.
- **REPLAY_DONE poll đầu 20:59:47Z** (dpkg 1.545 ổn định, 0 proc) → poll0 exit=0 → **FLAG-WRITTEN 20:59:47Z** (replay-day-du, poll=0).
- **Poll sau cờ đều 30 s** (21:00:17Z → 21:00:47Z lúc kiểm — dpkg 1.545, md5 433be629, gst 269, cache 178, lists 71, 0 proc, không đổi). Watcher vẫn ALIVE lúc T5 đóng; hạn 23:35:00Z 23/11 — T5-181 tiếp quản; nếu reboot mới (#96), spawn watcher mới theo mẫu.

---

## §4. Boot #95 + F-180-T5-1 + F-178-T7-4 + gap kiểm lại độc lập

### §4.1. Boot #95 (95b483a2)

- boot_id đầy đủ `95b483a2-2c91-4dd1-882b-d8f6481391be`; btime **19:10:22Z** (epoch 1795461022 — /proc/stat); `who -b` không kiểm đợt này (F-177-T5-3: chỉ cho phút — T5 dùng epoch /proc/stat làm chuẩn); journal chỉ idx 0 (first entry 19:10:34Z); `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- **Gap #94→#95 = 6.793 s** (1795461022 − 1795454229; btime #94 17:17:09Z — T0-179 XÁC NHẬN). Gap này TRỞ LẠI mẫu ~2h (6.243 / 7.031 / 6.827 / 7.568 s) sau gap #93→#94 dài gấp đôi (14.974 s). **Gap #93→#94 = 14.974 s** (kiểm lại — khớp T0-179/T7-179).
- **Số hiệu #95 CHỜ T0-180 xác minh 9 nguồn** — T7-179 đã xác minh 9 nguồn trong 52 s (T5 chỉ trình số thô, khớp T7: boot_id, btime, gap).
- **T5 KHÔNG phán (m)** — thuộc T2-180 + parent. Số thô (T7-179): **requeue +38,743 s TRONG dải — DƯƠNG ỨNG VIÊN (sơ bộ)**; phân loại cuối thuộc T2-180.

### §4.2. F-180-T5-1 và chuỗi mẫu overlap poll-cuối-sau-btime

Watcher-179 đọc được boot_id cũ 26 s sau btime mới (đã giải thích ở F-172-T5-1). Mẫu thứ 11 — chuỗi **11 → 20 → 23 → 9 → 8 → 36 → 7 → 3 → 17 → 22 → 26 s**; poll cuối 19:10:48Z, boot ae2a9a47; poll trước 19:10:18Z, trước btime 4 s. **Không ảnh hưởng verdict** — poll duy nhất sau btime vẫn thuộc boot cũ (dpkg/md5 khớp #94: 795/40abf79a). **Watcher-180 chưa có mẫu overlap** (spawn trên #95, chưa gặp reboot mới — T5-181 ghi nhận nếu có).

### §4.3. F-177-T5-3 vẫn đúng (không kiểm lại đợt này)

`who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T5 dùng **epoch /proc/stat làm chuẩn**; T0-180 làm rõ bằng 9 nguồn. Ghi nhận lần 4 (#90, #92, #94, #95 — lần này không chạy `who -b`, chỉ nhắc lại quy tắc).

### §4.4. F-178-T7-4 — ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start

- **Phía infra T5-180 (không phán DB):** daemon hatch trên #95 pid 67 start **19:10:34Z (boot+12 s)** — boot OS mới → daemon mới → gen mới; gen cụ thể thuộc T0/T7. Grep generation trên đĩa không lặp lại đợt này (T5-179 đã kết luận: không file infra nào trên đĩa lưu generation — chỉ sống trong scheduler DB).
- **F-178-T7-4 ĐÓNG ở mức T5/T0** — trigger restart daemon vẫn là nợ host-side (không bắt buộc — bằng chứng trong cell đã hết, cùng nguyên tắc quyết (k) đợt 174).

---

## §5. Replay #95 CHẠY ĐẦY ĐỦ + ledger

### §5.1. Replay #95 CHẠY ĐẦY ĐỦ — NHANH NHẤT từ trước tới nay — KHÔNG cần repair

- **Hoạt động:** heal `dpkg --configure -a` **19:11:01Z (boot+39 s — NHANH NHẤT: #92 boot+34m17s, #94 boot+18m33s)**; cài liên tục 19:11:54Z → 19:15:05Z (boot+4m43s); **0 khoảng đình trệ** — KHÁC #94 (đình trệ sau heal ~14', phải repair) và KHÁC #90 (đình trệ, phải repair); GIỐNG #92 (replay đầy đủ) nhưng nhanh hơn nhiều.
- **dpkg.log: 1.545 dòng, TẤT CẢ dated 2026-11-23 19:11:01–19:15:05Z** (0 dòng ngoài khung này — log reset theo boot, như các đợt trước). Breakdown theo giờ (không tách status/configure/install như T5-179 vì awk $2 là timestamp — xem Phụ lục A): đỉnh 259 dòng lúc 19:13:14Z.
- **apt history: 50 transaction, 50 End-Date; term.log 0 lỗi** (grep error|failed = 0). Cache 0 → **178 .deb**; lists 5 → **71**.
- **Form-B (T5 verify tay TRƯỚC khi spawn watcher, check-only):** postboot 20:58Z **exit=0** — PASS wrapper K1; **PASS libs 5/5**; **PASS GST** (thư mục thật, 269=269); **PASS apt 11 gói**. Log `t5-postboot-verify-formB-95b483a2.log` (chỉ đọc, không chạm dpkg — xem §10).
- **Kết quả postboot poll0 (20:59:47Z, exit=0):** PASS wrapper/libs/GST/apt — **11/11 gói NEED** + 5/5 lib (verify độc lập khớp); GST 269=269 thư mục thật; **tools ĐÃ cài** (khác #94); **libc-bin 2.39-0ubuntu8.12** (= #92).
- **Phiên bản gói:** Y HỆT #89/#92 (good 1.24.2-1ubuntu1.8, bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, -base 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, -gl 1.24.2-1ubuntu0.7, libgstreamer1.0-0 1.24.2-1ubuntu0.2) — **libc-bin 2.39-0ubuntu8.12** (replay) vs 8.9 (repair #94/#90). Mẫu đã rõ: **replay → 8.12, repair → 8.9**.
- **F-174-T5-6 KHÔNG áp dụng ở #95** — replay chạy đầy đủ, không phải replay một phần, không repair. Không bằng chứng host-side nào trong cell giải thích vì sao #95 heal nhanh (boot+39 s) trong khi #92/#94 heal muộn — T5 không suy đoán, chỉ trình số thô (có thể liên quan scheduler im lặng/outage đã hết — thuộc T7).

### §5.2. Ledger (F-180-T5-2 — cùng họ F-174-T5-2 → F-179-T5-2)

- ledger.jsonl: **1 dòng, 3.040 B, mtime 19:15:xxZ** — dòng duy nhất ts **1795456988 = 2026-11-23 18:03:08Z** (repair #94), **compacted=true, added 170, removed 0**.
- **F-180-T5-2 (mới):** T5-179 ghi sau repair #94 ledger có **2 dòng, 4.949 B** (ts 1795423914 compacted added 170 + ts 1795456988 added 106). Trong replay #95, hook post-invoke đã **gộp 2 dòng thành 1 dòng compacted** (ts giữ 1795456988 = ts mới nhất; added GIỮ 170 — hợp của 2 tập = 170, tức 106 gói của repair #94 là tập con của 170 gói compacted #90; danh sách added có chứa gstreamer1.0-tools, gdb, libwoff1, xfonts-cyrillic — các gói của repair #94). **Ledger lại viết lại ts compacted khi sang boot mới** — lần này là GỘP, không phải mang nguyên (khác F-179-T5-2: ts mang sang #93 nguyên vẹn). Không ảnh hưởng số đếm; ghi nhận để T2/T10 không nhầm ts với boot và không đếm nhầm 106 gói repair #94 thành 2 lần.
- `dpkg-state.txt`: **953 dòng, 49.279 B, mtime 19:15Z** (reseed trong replay #95; lúc mở #94: 784 dòng; sau repair #94: 890 dòng — #95 cao hơn cả hai vì replay đầy đủ 1.545 dòng dpkg.log).

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (không repair đợt này; watcher chỉ poll + check-only)

- T5-180 **KHÔNG chạy probe chạm dpkg nào** — 0 lần configure/install/update/repair tay. **KHÔNG cần repair** đợt này: replay #95 đã đầy đủ trước khi T5 mở; watcher-180 chỉ chạy postboot check-only ở poll0 (đọc dpkg-query/ldconfig/ls, không giữ lock).
- **Thứ tự an toàn:** form-B tay 20:58Z chạy lúc replay đã xong từ 19:15Z (0 proc apt/dpkg, dpkg ổn định ~1h43') — chỉ đọc, không giữ lock dpkg. Independent 21:00Z chạy lúc T4-180 chưa mở dir (chưa attempt, chưa poller) — không chồng chéo với bất kỳ attempt nào.
- **0 VI PHẠM F-175-T4-2 phía T5** — không repair, không script nặng trong cửa sổ attempt (chưa có attempt nào lúc T5 đóng; T4-180 chưa mở).
- **Hướng (3) đứng lần thứ 27** (§2). G1 chờ user (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (0 thử lần thứ 33 — theo T9 đợt 179). File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 180: script postboot không đổi từ đợt 176; log poll0 + independent #95 có dòng đầu là dòng live mới (`[postboot 2026-11-23 19:10:22] boot=...`), rồi PASS wrapper/libs/GST/apt + KẾT LUẬN, exit=0 — dòng DOT-151 cứng KHÔNG còn xuất hiện.
- F-175-T5-3 **ĐÓNG từ đợt 176, vẫn đóng** — không sửa thêm file nào đợt này. (Lưu ý nhỏ: các dòng log của watcher cho `--repair`/`COPIED` mang timestamp trigger vì script echo `$ts` chụp ở đầu vòng lặp — đợt này KHÔNG có repair nên không phát sinh.)

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #95 (giao T9):** MemAvailable dao động mạnh — **471 / 773 MB** (2 điểm: 21:01Z / 21:02Z; MemTotal 8.124.900 kB). 471 MB lúc mở là thấp — diễn biến đầy đủ thuộc T9-180.

**ENOSPC #95 (T9 đếm chính thức):** **78 dòng "No space left on device" trong journal boot hiện tại lúc 21:01Z** (journalctl -b; grep "inotify" cũng 78 — các dòng ENOSPC đều là inotify_add_watch). T9-179 đếm 20 dòng #95 lúc ~20:02Z → tăng ~58 trong ~59 phút (≈1 dòng/phút, cùng tốc độ #94: 9→15→26). Disk còn 6,7 GB trống — ENOSPC không phải do disk đầy.

**X11:** **Trống lúc mở (20:58Z) và lúc đóng (21:02Z)** — 0 Xvfb. T4-180 chưa mở dir lúc T5 đóng (chưa spawn X). T5 KHÔNG dọn socket luồng khác; giao T8-180 theo checklist (o) nếu cần.

**Journal #95:** chỉ idx 0 duy nhất (boot 95b483a2); first entry 19:10:34Z.

---

## §8. Nợ mở chuyển đợt 181

1. **(m) #95** — T2-180 + parent quyết (DƯƠNG ỨNG VIÊN sơ bộ +38,743 s, TRONG dải, KHÔNG sát biên; phân loại cuối đợt 180).
2. **INSIDE #94 (FULL140) + INSIDE #95 (FULL141)** — T2-180.
3. **Số hiệu #95** — T0-180 xác minh 9 nguồn (T7-179 đã xác minh 9 nguồn trong 52 s; T5 chỉ trình số thô).
4. **Cờ #95 (replay-đầy-đủ, poll=0, KHÔNG caveat, 20:59:47Z)** — parent quyết §9(b): có đứng cho gate (a) không?
5. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 24 thuộc T2-180; U cách sàn 29 s).
6. **(m) #56 lần 23** — T2-180.
7. **Balloon trên #95** — T9-180 (E-205 kết cục; E-206 nếu ghim tiếp trên #95).
8. **Watcher-180 vẫn chạy trên #95** (pid 109083, hạn 23:35:00Z) — T5-181 tiếp quản; nếu reboot mới (#96), spawn watcher mới theo mẫu.
9. **Prune lần 55** — T6-180 (F-147-T6-1 đếm lại từ 0).
10. **Run 179 kết cục** — T7-180 (viết lại ×1 tại #95; hạn 20:35:51Z). **Run 180 kết cục** — T7-181 (mở 20:35:51Z).
11. **#95 có giết holder không** — T6-180 (chuỗi "không giết holder" từ #69: 26 reboot qua #94).
12. **F-180-T5-1 (overlap +26 s, mẫu thứ 11)** — ghi nhận, không đổi verdict (m).
13. **F-180-T5-2 (ledger gộp 2 dòng → 1 dòng compacted trong replay #95; added giữ 170)** — ghi nhận; T2/T10 không đếm nhầm 106 gói repair #94.
14. **F-179-T9-2 (sampler cuối #94 muộn hơn btime #95 23 s — lệch đồng hồ)** — giao T0-180; T5 chỉ ghi nhận CF nhanh hơn local ~2 s lúc 21:01Z.
15. **T2-181/T4-181:** không chạy script nặng / không probe dpkg trong cửa sổ attempt (B4 đứng; F-179-T4-5: parent đã quyết KHÔNG tính vi phạm — chuỗi 0 vi phạm tính lại từ 1 ở đợt 179; đợt 180 phía T5: 0 vi phạm, §6.1).
16. **RAM #95 dao động mạnh (471–773 MB trong 1 phút)** — T9-181 theo dõi; có thể ảnh hưởng gateA của T4-181.
17. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
18. **Vì sao replay #95 heal nhanh (boot+39 s) trong khi #92/#94 heal muộn (34m/18m)?** — nếu T0/T7/T9 tìm ra thì ghi GAP, không thì chuyển nợ host-side (quyết (k) đợt 174: không bắt buộc; replay đã xong đầy đủ).
19. **HB 20:50:50Z + DR 21:00Z/22:00Z/23:00Z** — T7-180 (đính chính parent đợt 179: HB 20:20:50Z đã thuộc cửa đợt 179).
20. **ĐỔI DRIVER harness sang hb128 làm chuẩn** — T8-180 triển khai (quyết (j) đợt 179); **F-179-T8-5 Plan B** — T8-180 trình phương án sửa lỗ hổng phủ sóng; **F-178-T8-6** diag W2-setup tiếp tục; **H3** chỉ giám sát thụ động.
21. **3 lệch prose aggregate 178 §10.3 + GAP** — T1-180 sửa + stage batch đợt 180 (quyết (p) đợt 179).

---

## §9. Đề xuất cho parent (quyết ở aggregate 180)

**(a) Chấp nhận verdict đợt 180?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #95 đã có (replay-đầy-đủ, poll=0, KHÔNG caveat, verify độc lập exit=0), watcher-180 chạy tốt, #94 VẪN CÓ, F-178-T7-4 đã làm rõ, F-175-T5-3 vẫn đóng, hướng (3) lần 27, marker 46 reboot (chờ T0 xác nhận #95 → 47), 0 vi phạm B4 phía T5.

**(b) Cờ #95 (replay-đầy-đủ, poll=0) — CÂU HỎI QUYẾT:** Watcher-180 REPLAY_DONE → postboot poll0 exit=0 trên boot SỐNG (log `t5-postboot-poll0-95b483a2.log`), T5 verify độc lập check-only exit=0 (`t5-postboot-independent-95b483a2.log`), 11/11 gói NEED + 5/5 lib + GST 269=269 thư mục thật + tools ĐÃ cài + libc-bin 8.12. **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #95 đứng cho gate (a) **KHÔNG caveat** — tiền lệ #92/#89 (poll=0);
- (b2) Không chấp nhận (T5 không thấy căn cứ — replay đủ 1.545 dòng, 50 transaction, 0 lỗi, verify độc lập khớp; chỉ lưu ý cờ ghi muộn boot+1h49m vì không watcher nào sống trước đó — replay bản thân xong boot+4m43s).

**(c) #93 KHÔNG CÓ cờ — ĐÃ XÁC NHẬN đợt 179, KHÔNG bù (tổng boot không cờ GIỮ 20) — chấp nhận?**

**(d) F-175-T5-3 VẪN ĐÓNG — parent ghi nhận?** Không sửa file nào đợt này; log poll0 + independent #95 in dòng live, không còn dòng DOT-151 cứng.

**(e) Xác nhận số hiệu boot #95 (T0-180, 9 nguồn — T7-179 đã xác minh 9 nguồn trong 52 s; T5 chỉ trình số thô) — parent chấp nhận?** (F-177-T5-3: who -b chỉ cho phút.)

**(f) F-180-T5-1 (overlap +26 s, mẫu thứ 11) + F-180-T5-2 (ledger gộp 2 dòng → 1 dòng compacted; added giữ 170) + F-177-T5-3 (who -b chỉ cho phút, lần 4 — nhắc lại quy tắc) — ghi nhận, không đổi verdict (m).**

**(g) F-178-T7-4 ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start, không phải OS boot — parent ghi nhận?** Phía infra T5: daemon #95 start boot+12 s; gen mới thuộc T0/T7.

**(h) Watcher-180 vẫn chạy trên #95** (pid 109083, hạn 23:35:00Z) — T5-181 tiếp quản; nếu reboot mới (#96), spawn watcher mới theo mẫu.

**(i) Replay #95 heal nhanh (boot+39 s) — parent có muốn điều tra host-side không?** Bằng chứng trong cell: replay chạy đầy đủ, 0 lỗi — không manh mối vì sao nhanh hơn #92/#94. Theo quyết (k) đợt 174, điều tra host-side KHÔNG bắt buộc (bằng chứng trong cell đã hết) — T5 đề xuất áp dụng cùng nguyên tắc cho #95, trừ khi parent quyết khác.

---

## §10. Sai số của chính T5-180 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-180-T5-1** | Poll cuối watcher-179 nằm SAU btime #95 **26,0 s** (mẫu overlap thứ 11: 11→20→23→9→8→36→7→3→17→22→**26 s**) | Ghi nhận | Không ảnh hưởng verdict; poll duy nhất sau btime vẫn thuộc boot cũ (dpkg/md5 khớp #94) |
| **F-180-T5-2** | Ledger gộp 2 dòng (sau repair #94) thành 1 dòng compacted ts 1795456988 trong replay #95; added GIỮ 170 (106 gói repair #94 là tập con của 170) | Ghi nhận | Không ảnh hưởng số đếm; ghi nhận để T2/T10 không nhầm ts với boot, không đếm nhầm 106 gói thành 2 lần |
| — | Cờ #95 ghi ở boot+1h49m25s (muộn nhất trong các cờ replay-đầy-đủ gần đây — #92: boot+52m14s) | Ghi nhận, không phải lỗi | Replay bản thân xong boot+4m43s; cờ muộn vì không watcher nào sống trên #95 trước 20:59:47Z (khoảng không-watcher 6.539 s) — mode vẫn replay-đầy-đủ, poll=0 |
| — | Khoảng không-watcher ~6.539 s bao trọn replay #95 (19:11–19:15Z) | Hạn chế bằng chứng | Replay có bằng chứng đầy đủ trong dpkg.log/history.log/term.log (1.545 dòng, 50 transaction, 0 lỗi) — watcher chỉ xác nhận lại trạng thái ổn định |
| — | Đồng hồ: CF nhanh hơn local ~2 s (đợt 179 ~1 s) | Ghi nhận | Có thể gồm ~1 s trễ curl; không kết luận đồng hồ trôi thêm; F-179-T9-2 (lệch 23 s) giao T0-180 |
| — | Stats chỉ đo RAM 2 điểm thay vì diễn biến đầy đủ | Hạn chế nhỏ | T5 đóng sớm (cờ xong 20:59:47Z, trước khi T4-180 mở); diễn biến RAM đầy đủ thuộc T9-180 |
| — | Breakdown dpkg.log đợt này tách theo giờ (awk $2 là timestamp), không tách status/configure/install như T5-179 | Hạn chế trình bày | Không ảnh hưởng số liệu: tổng 1.545 dòng, tất cả dated 19:11:01–19:15:05Z; history 50 transaction đã tách đủ |
| — | T5-180 mở muộn (~20:57Z, 21' sau khi đợt mở 20:35:51Z) | Ghi nhận | Không ảnh hưởng verdict: cờ #95 vẫn ghi trước hạn cờ ~23:00Z hơn 2 giờ; watcher-180 spawn ngay sau form-B |

**Số liệu chính thức lấy từ log watcher-179/180 + log trực tiếp (form-B/poll0/independent) + dpkg/history/term.log của #95 + đối chiếu T7-179.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND180_T5_INFRA_LIMITS.md` (file MỚI, không sửa file repo nào đợt này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round180-t5-infra.txt` (NUL-delimited, 1 entry; đã verify bằng read-back `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round180-t5/` (theo mẫu T5-171–179): watcher script/log, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–180: đợt 166–179 = 140 batch / 201 entry / 187 file duy nhất / 184 file mới (theo quyết (q)/(r) đợt 179) + đợt 180 (1 file này, file MỚI; các T khác chưa tính lúc T5 đóng) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-180 (bản chính, 20:57–21:02Z)

```
=== PHU LUC SO LIEU T5-180 (trich log truc tiep, 2026-11-23T20:57-21:02Z) ===
boot_id=95b483a2-2c91-4dd1-882b-d8f6481391be
btime_epoch=1795461022 = 2026-11-23T19:10:22+00:00 (who -b: khong kiem dot nay — chi toi phut, F-177-T5-3)
gap #94->#95 = 6793 s (btime #94 17:17:09Z epoch 1795454229, T0-179 XAC NHAN)
gap #93->#94 = 14974 s (kiem lai doc lap — khop)

--- replay-watch-179.log (round179-t5) ---
tong_dong=144 polls=138; poll_dau=2026-11-23T17:49:58Z boot=ae2a9a47
poll_cuoi=2026-11-23T19:10:48Z boot=ae2a9a47 dpkg_lines=795 md5=40abf79a (F-180-T5-1 = +26 s sau btime #95); 0 dong END/STOP/NEWBOOT
FLAG-WRITTEN 2026-11-23T18:03:08Z mode=repair-som-quyet-h poll=1 (old=985bc2a3)

--- replay-watch-180.log (round180-t5) ---
START 2026-11-23T20:59:47Z pid=109083 boot=95b483a2 btime=19:10:22Z end=23:35:00Z
init_lines=1545 init_md5=433be629 init_mtime=19:15:05Z cache=178 lists=71 gst_sys=269
poll dau 20:59:47Z apt=[] dpkg=[] (0 proc — replay da xong)
REPLAY_DONE 20:59:47Z dpkg_lines=1545 gst_sys=269 cache=178 lists=71
postboot poll0 exit=0 (hoan tat 20:59:47Z)
FLAG-WRITTEN 20:59:47Z mode=replay-day-du poll=0 (old=ae2a9a47)
poll 21:00:47Z — dpkg 1545, md5 433be629, 0 proc, on dinh

--- 3. POSTBOOT_PASS ---
round180-t5/POSTBOOT_PASS: CO mtime=2026-11-23 20:59:47 +0000 bytes=315
round180-t5/POSTBOOT_PASS-ae2a9a47: CO (backup #94, md5 1ae2c3e2 = goc round179-t5)
round179/178/177/176/175/174/173-t5/POSTBOOT_PASS: CO, mtime KHONG DOI (18:03:08Z / 11:53:41Z / 08:51:55Z / 05:42:19Z / 02:40:29Z / 23:46:57Z / 21:27:05Z)

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47.272154981 +0000

--- 5. dpkg/cache/lists/GST (boot #95, replay day du) ---
dpkg_lines=1545 md5=433be629 mtime=2026-11-23 19:15:05 +0000 (TAT CA 1545 dong dated 19:11:01-19:15:05Z; 0 dong ngoai khung)
cache_deb=178 lists_entries=71
gst_sys_files=269 (THU MUC THAT, khong symlink — GIONG #92, KHAC #94) gst_sys_is_link=KHONG
apt_history_transactions=50; End-Date=50; term_log_errors=0 (grep error|failed)
heal #95: 19:11:01Z (boot+39s — NHANH NHAT); cai cuoi gstreamer1.0-tools 19:15:05Z (boot+4m43s)

--- 6. 11 goi NEED + 5 lib + tools + ledger ---
11/11 install ok installed (NEED); gstreamer1.0-tools DA CAI 1.24.2-1ubuntu0.2
5/5 lib CO; versions: good 1.24.2-1ubuntu1.8, bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, -base 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, -gl 1.24.2-1ubuntu0.7, libc-bin 2.39-0ubuntu8.12 (#89/#92: 8.12; #90/#94 repair: 8.9)
ledger: 1 dong, ts 1795456988 (compacted, added 170, removed 0); mtime 19:15Z (F-180-T5-2: gop 2 dong sau repair #94 thanh 1 dong compacted)
dpkg-state.txt: 953 dong, 49279 B, mtime 19:15Z (luc mo #94: 784 dong; sau repair #94: 890 dong)

--- 7. ENOSPC --- 78 dong "No space left on device" (journal boot #95, luc 21:01Z; T9-179 dem 20 luc ~20:02Z — tang ~58 trong ~59 phut, ~1 dong/phut)
--- 8. RAM --- MemAvailable 471252 kB (21:01Z) / 773120 kB (21:02Z); MemTotal 8124900 kB
--- 9. Huong (3) --- user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; crontab not found; timers_vcut=0
--- 10. X11 --- TRONG luc mo (20:58Z) + luc dong (21:02Z); 0 Xvfb
--- 11. Khoang khong-watcher --- ~6539 s (19:10:48Z -> 20:59:47Z); F-180-T5-1 = 26 s
--- 12. T4-180 --- CHUA mo dir luc T5 dong (~21:02Z); chua poller, chua attempt; co #95 da san cho gate (a)
--- 13. Daemon --- hatch pid 67 start 19:10:34Z (boot+12s) — gen moi thuoc T0/T7 (F-178-T7-4)
```
