# PHASE 9 — ROUND 185 — T5 INFRA LIMITS

**Đợt:** 185 (mở lượt cron 18:35:51 +07 24/11/2026 = 11:35:51Z; hạn cờ ~14:00Z, hạn cứng ~14:35Z 24/11; T5 đóng ~11:44Z — sớm, cờ #104 xong 11:42:15Z).
**Người viết:** T5-185. **Ngày:** 24/11/2026. **Boot làm việc lúc đóng:** #104 ỨNG VIÊN (T0-185 chưa xác minh lúc T5 đóng) 9161bfd1, btime 11:13:42Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #104 (replay-đầy-đủ, poll=0, KHÔNG caveat — §3.1) + #103 KHÔNG CÓ — KHÔNG THỬ REPAIR (boot đã chết theo #104; tiền lệ #100/#83 quyết (b2) — §3.2) + #102/#101/#99/#98/#96/#95 VẪN CÓ + #97/#100 VẪN KHÔNG CÓ (tổng boot không cờ 22 → 23 nếu parent chấp nhận #103) + replay #104 KHÔNG ĐÌNH TRỆ (§5.1) + #103 ĐÌNH TRỆ TOÀN PHẦN (dpkg 2, libs 0/6, không heal — §5.2) + KHÔNG sửa file repo nào đợt này ngoài LIMITS này. File này là 1 entry stage duy nhất đợt 185 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #104 (9161bfd1, btime 11:13:42Z) | **ĐÃ CÓ 11:42:15Z (boot+28m33s, replay-đầy-đủ, poll=0, KHÔNG caveat)** — watcher-185 REPLAY_DONE poll đầu → poll0 exit=0; verify độc lập exit=0; 11/11 NEED + 5/5 lib; GST 269=269 **thư mục thật (apt)**; **tools CÀI** (gstreamer1.0-tools 1.24.2-1ubuntu0.2; gst-inspect-1.0 có — GIỐNG #102/#99/#95 replay); libc-bin 8.12 |
| Replay #104 | **CHẠY ĐẦY ĐỦ, KHÔNG ĐÌNH TRỆ** — heal 11:35:39Z (boot+21m57s) → install đầu ~11:36:02Z → xong 11:40:18Z (boot+26m36s); dpkg 1468 dòng; history 50 transaction; term.log 0 lỗi; cache 170; lists 39 |
| POSTBOOT_PASS #103 (e0921bda) | **KHÔNG CÓ — KHÔNG THỬ REPAIR** (boot đã chết theo #104 11:13:42Z; dpkg.log/history #103 mất theo rootfs rebuild; không watcher nào sống trên #103 sau 09:15:04Z; ledger GIỮ ts 1795499802/added 170 — replay #103 không thêm gì; tiền lệ #100/#83 (b2)); **tổng boot không cờ 22 → 23 nếu parent chấp nhận** |
| POSTBOOT_PASS #102 (6ecd948e) | **VẪN CÓ** (08:43:59Z, replay, poll=0, KHÔNG caveat — parent CHẤP NHẬN (c) đợt 184); backup byte-identical trong round185-t5 (md5 6007fea8) |
| POSTBOOT_PASS #101/#99/#98/#96/#95 | **VẪN CÓ** (repair/replay/repair/repair/replay — mtime + md5 KHÔNG ĐỔI) |
| POSTBOOT_PASS #97 (9e440707) / #100 (7a83ab15) | **VẪN KHÔNG CÓ** — grep 0 file POSTBOOT_PASS* nhắc cả hai |
| Replay #103 | **ĐÌNH TRỆ TOÀN PHẦN** — dpkg 2 dòng, libs 0/6 lúc 09:21:02Z (T8-184 selfcheck); WebKit launch-fail libevent 10:31–10:40Z; không heal trước khi chết 11:13:42Z; nợ host-side quyết (k) đợt 174 VẪN MỞ |
| Watcher-184 | pid 211325 **CHẾT theo #103** (poll cuối 09:15:04Z, +9 s — mẫu 17, F-185-T5-1); log 68 dòng; 0 dòng END/STOP/NEWBOOT |
| Watcher-185 | START 11:42:14Z, pid **18279**, hạn 14:35:00Z — **poll đầu đã ghi cờ**; vẫn ALIVE lúc T5 đóng (poll ổn định dpkg 1468) |
| Khoảng không-watcher | **~2h27m10s** (09:15:04Z → 11:42:14Z) — bao trọn #103 (chết không heal) + replay #104 (tự chạy đủ mà KHÔNG cần watcher, giống #102) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 32 liên tiếp** (user@0 static, không linger, không cron, không /run/user/0, 0 timer VCut, 0 unit VCut) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#102 = 54 reboot ĐÃ XÁC NHẬN** (parent quyết (e) đợt 184); #103/#104 chờ T0-185 |
| ENOSPC | #104: **4 dòng lúc ~11:40Z → 6 dòng lúc 11:43:37Z** (T9 đếm chính thức; nhịp ~0,9 dòng/phút) |
| X11 | **X188 xuất hiện sau cờ** (nhiều khả năng T4-185 spawn sau khi nhận cờ — T4 poll-wait pid 15128 từ 11:41Z) |
| RAM #104 | MemAvailable **tăng: 1.615 / 1.957 MB** (2 điểm, ~11:43–11:44Z; giao T9) |
| Đồng hồ | Local ≈ Cloudflare **+0–1 s** (2 lap: 0 s, +1 s — trong trễ curl) |
| Quy tắc B4 | **T5-185 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 lần configure/install/update/repair tay) — KHÔNG CẦN repair #104 (replay đã đủ); KHÔNG THỬ repair #103 (boot đã chết) |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot không đổi; log poll0 + independent #104 in dòng live đầu tiên) |
| T4-185 | **Đã vào gate0wait từ 11:41Z** (poll-wait-t4-185.sh pid 15128, TRƯỚC khi cờ ghi 11:42:15Z ~1'); cờ có sẵn sau đó ~1' — T4 nhận cờ ở poll tiếp theo |

**Số hiệu boot #104 CHỜ T0-185 xác minh 9 nguồn (T5 chỉ trình số thô: boot_id, btime, gap — khớp brief).**
**T5 KHÔNG phán (m), chỉ trình số thô — (m) #103 + INSIDE #103 thuộc T2-185 + parent.**

---

## §1. Timeline (giờ Z, 24/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 07:07:05Z | Reboot #102 (6ecd948e — T0-184 XÁC NHẬN 9 nguồn); gap #101→#102 = 6.878 s |
| 08:43:59Z | Cờ #102 ghi (replay-đầy-đủ, poll=0, KHÔNG caveat); watcher-184 pid 211325 tiếp tục chạy |
| 09:14:55Z | **Reboot #103 (e0921bda — T7-184 xác minh 9 nguồn, giờ thật; số hiệu chờ T0-185)**; gap #102→#103 = 7.670 s |
| 09:15:04Z | **Poll cuối watcher-184 pid 211325** (+9 s sau btime #103 — mẫu overlap thứ 17, F-185-T5-1); log dừng tại đây, 0 dòng END/STOP/NEWBOOT |
| 09:21:02Z | Selfcheck T8-184 trên #103: **dpkg 2 dòng, libs 0/6 THIẾU, GST 0** — #103 chưa heal |
| 10:31–10:40Z | Harness T8-184 trên #103: WebKit 0/3 KHÔNG ĐO ĐƯỢC — launch-fail `libevent-2.1.so.7` (exit 127); Chromium 3/3 PASS — #103 VẪN chưa heal |
| 11:13:42Z | **Reboot #104 (9161bfd1 — số hiệu chờ T0-185)**; gap #103→#104 = **7.127 s** |
| 11:35:39Z | Heal #104: dpkg.log 2 dòng "startup packages configure" (boot+21m57s — MUỘN hơn #102 boot+40s, xem §5.1) |
| ~11:36:02Z | Install đầu tiên của replay #104 |
| 11:35:51Z | Lượt cron đợt 185 mở; run 185 dispatch (boot_gen thuộc T0/T7) |
| 11:40:18Z | **Replay #104 XONG** (gói cuối gstreamer1.0-tools; dpkg 1468 dòng) — boot+26m36s |
| ~11:41Z | **T5-185 mở trên #104**: dpkg.log 1468 dòng, đóng băng từ 11:40:18Z; /var/log/apt CÓ; cache 169→170; lists 39; GST 269 thư mục thật; X11 TRỐNG lúc mở (X188 xuất hiện sau) |
| 11:41:35Z | Form-B tay TRƯỚC khi spawn watcher: postboot check-only **exit=0** (PASS đủ 4 cửa — §5.1) |
| 11:42:14Z | **Watcher-185 START, pid 18279** (khoảng không-watcher ~2h27m10s); poll đầu dpkg 1468 dòng, đóng băng 116 s, 0 proc → **REPLAY_DONE TRIGGER ngay** → postboot poll0 exit=0 |
| 11:42:15Z | **CỜ #104 GHI (replay-đầy-đủ, poll=0, KHÔNG caveat)**; backup cờ cũ #102 thành `POSTBOOT_PASS-6ecd948e` (byte-identical); T5 verify độc lập ~11:42:48Z: **exit=0** (log `t5-postboot-independent-9161bfd1.log`) |
| ~11:44Z | T5 viết LIMITS này. Watcher-185 vẫn ALIVE (pid 18279, poll ổn định dpkg 1468). T4-185 đã vào gate0wait từ 11:41Z, X188 đã xuất hiện. |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 32 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở: `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không linger (`/var/lib/systemd/linger/` không tồn tại); không `/run/user/0`; `systemctl list-timers` 0 timer VCut; không unit VCut nào ở /etc/systemd/system hay /etc/systemd/user. Lần thứ 32 liên tiếp hướng (3) đứng. Watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–184.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z). Marker sống qua **#49–#102 = 54 reboot ĐÃ XÁC NHẬN** (parent quyết (e) đợt 184); **#103/#104 chưa xác nhận** — nếu T0-185 xác nhận cả hai, marker sống qua 56 reboot.

**Đồng hồ (2 lap):** lap 1 (11:40:49Z): local = CF (**0 s**); lap 2 (11:40:51Z): CF +1 s — trong trễ curl. **Btime ghi bằng epoch nguyên**; gap tính bằng epoch nguyên.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #104 — ĐÃ CÓ (replay-đầy-đủ, poll=0) — KHÔNG caveat

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round185-t5/POSTBOOT_PASS`, 315 B, mtime 2026-11-24T11:42:15Z.
- Nội dung: `boot 9161bfd1-861f-4f9f-90ed-eee0387081de (btime 2026-11-24 11:13:42Z; watcher-185) — replay-day-du: dpkg 1468 dong; cache 170 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-24T11:42:15Z; POSTBOOT_PASS moi ghi 2026-11-24T11:42:15Z poll=0 (replay-day-du); co cu 6ecd948e luu POSTBOOT_PASS-6ecd948e`.
- Backup cờ cũ: `POSTBOOT_PASS-6ecd948e`, 315 B — **md5 6007fea8, byte-identical với file gốc round184-t5 (cờ #102)**.
- **Lịch trình (watcher tự làm, không tay):** START 11:42:14Z → poll đầu dpkg 1468 dòng, đóng băng 116 s, 0 proc → **REPLAY_DONE TRIGGER cùng giây** (lines 1468 > 100, ổn định) → postboot poll0 exit=0 (11:42:15Z) → **FLAG-WRITTEN cùng giây sau**. KHÔNG trigger EARLY-REPAIR hay BACKSTOP (không cần — lines > 100).
- **Verify độc lập (T5, check-only, ~11:42:48Z):** postboot **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 thư mục thật (apt)** — GIỐNG #102/#99/#95 replay, KHÁC #101/#98/#96 repair (symlink → debroot); **tools CÀI** (gstreamer1.0-tools `install ok installed` 1.24.2-1ubuntu0.2; gst-inspect-1.0 có tại /usr/bin — KHÁC #98/#101 repair); **libc-bin 2.39-0ubuntu8.12** (giống #99/#95/#101/#102 — xem F-183-T5-3: version theo archive, không phán mode).
- **KHÔNG caveat** (đề xuất — giống #102/#99/#95 replay đầy đủ): GST thư mục thật, tools cài, dpkg 1468 ≈ replay đầy đủ #102 (1.461). **Parent quyết (§9(b))** — T5 đề xuất chấp nhận **KHÔNG caveat** (tiền lệ #102/#99/#95).
- **Lưu ý thời gian:** cờ ghi ở boot+28m33s — replay xong 11:40:18Z (boot+26m36s), cờ chỉ muộn ~2' vì T5-185 mở lúc 11:41Z + spawn watcher 11:42:14Z. T4-185 vào gate0wait 11:41Z (trước cờ ~1') nên nhận cờ ở poll tiếp theo, không phải chờ lâu như đợt 183.

### §3.2. Cờ #103 — KHÔNG CÓ, KHÔNG THỬ REPAIR (boot đã chết — tiền lệ #100/#83 (b2))

- **#103 (e0921bda-…, btime 09:14:55Z):** kiểm đợt 185: `grep -rl "e0921bda" --include="POSTBOOT_PASS*" hidden_files/` = **0 file** (exit 1, hai lần grep độc lập: grep theo danh sách file maxdepth 2 + grep đệ quy toàn hidden_files) — không có file POSTBOOT_PASS nào nhắc e0921bda. **Tổng boot không cờ 22 → 23 nếu parent chấp nhận.**
- **T5-185 KHÔNG thử repair #103 — và KHÔNG THỂ thử:** (1) boot #103 đã chết theo #104 (btime 11:13:42Z, trước khi đợt 185 mở 11:35:51Z); (2) dpkg.log/history #103 mất theo rootfs rebuild — dpkg.log hiện tại là của #104 (dòng đầu 11:35:39Z, heal #104); (3) không watcher nào sống trên #103 sau poll cuối watcher-184 09:15:04Z — cửa sổ repair-sớm (boot+15', 09:29:55Z) trôi qua mà không có watcher nào; (4) ledger GIỮ nguyên ts 1795499802/added 170, mtime 07:40:58Z — replay #103 không thêm gì (đình trệ toàn phần, §5.2). **Tiền lệ #100 (quyết (c) đợt 183) + #83 quyết (b2): KHÔNG tự viết cờ cho boot đã chết.**
- **Lưu ý:** repair #103 về nguyên tắc ĐÃ CÓ THỂ xảy ra trong lúc #103 còn sống (cửa sổ early-repair 09:29:55Z+) — nhưng không có watcher nào sống lúc đó (T5-184 đã đóng cờ 08:50Z; đợt 185 mở sau khi #103 chết). Khoảng trống vận hành, không phải lỗi kỹ thuật: watcher-184 chết đúng luật theo reboot, không có cơ chế respawn tự động (hướng (3) đứng — §2).

### §3.3. Cờ #97 / #100 — VẪN KHÔNG CÓ (đã xác nhận, không bù được)

- **#97 (9e440707) / #100 (7a83ab15):** kiểm lại đợt 185: grep 0 file POSTBOOT_PASS* nhắc cả hai (exit 1). **Tổng boot không cờ 22 → 23** (chỉ +1 vì #103; #97/#100 đã tính trong 22).

### §3.4. Cờ #102 / #101 / #99 / #98 / #96 / #95 / #92 / #90 / #89 / #86 / #85 / #84 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #102 (6ecd948e) | round184-t5/POSTBOOT_PASS, 08:43:59Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 184 KHÔNG caveat; **mtime + md5 KHÔNG ĐỔI** (6007fea8) |
| #101 (51745634) | round183-t5/POSTBOOT_PASS, 05:56:42Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 183 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (8c32fc3c) |
| #99 (9897d4b4) | round182-t5/POSTBOOT_PASS, 02:55:07Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 182 KHÔNG caveat; **mtime + md5 KHÔNG ĐỔI** (3d031656) |
| #98 (e62eef3f) | round181-t5/POSTBOOT_PASS, 00:16:31Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 181 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (26452ec1) |
| #96 (8d2a69df) | round180-t5/POSTBOOT_PASS, 22:08:08Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 180 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (50869e4e) |
| #95 (95b483a2) | round180-t5/POSTBOOT_PASS-95b483a2, 20:59:47Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 180 KHÔNG caveat; **md5 KHÔNG ĐỔI** (f8cd6d46) |
| #92/#90/#89/#86/#85/#84 | theo T5-184, không kiểm lại đợt này | VẪN CÓ (replay/repair/replay/replay/repair-tay/repair) — không đổi từ đợt 184 |

### §3.5. Watcher-184 — CHẾT theo #103 (poll cuối +9 s, mẫu 17) + Watcher-185 đang chạy

- **Watcher-184, pid 211325** (spawn 08:43:58Z trên #102): poll cuối **09:15:04Z, +9 s sau btime #103** (mẫu overlap thứ 17, **F-185-T5-1**); log 68 dòng; 0 dòng END/STOP/NEWBOOT. Poll trước 09:14:34Z, trước btime 21 s. **Poll cuối vẫn đọc boot_id cũ 6ecd948e** (9 s sau btime mới) — cùng hiện tượng F-184-T2-11 (boot_id lúc 09:14:59Z vẫn hiện 6ecd948e) — giao T0-185 xác minh đồng hồ nhảy lùi.
- **Khoảng không-watcher ~2h27m10s** (09:15:04Z → 11:42:14Z) — dài hơn khoảng đợt 184 (1h36m36s); bao trọn #103 (chết không heal) + replay #104 (tự chạy đủ mà KHÔNG cần watcher, giống #102).
- **Watcher-185 (boot #104) — ĐANG CHẠY, đã làm xong nhiệm vụ chính:** spawn 11:42:14Z, pid **18279**, hạn 14:35:00Z. Khởi tạo: dpkg 1468 dòng, md5 18b78f34, mtime 11:40:18Z, cache 170, lists 39, gst_sys 269. **REPLAY_DONE TRIGGER poll đầu** → postboot poll0 exit=0 → **FLAG-WRITTEN 11:42:15Z** (replay, poll=0). **Poll sau cờ đều 30 s** (dpkg 1468, md5 18b78f34, gst 269, cache 170, lists 39, 0 proc, không đổi — kiểm tới 11:42:45Z). Watcher vẫn ALIVE lúc T5 đóng — T5-186 tiếp quản; nếu reboot mới (#105), spawn watcher mới theo mẫu.
- **T4-185 vào gate0wait TRƯỚC khi cờ ghi** (poll-wait pid 15128 từ 11:41Z; cờ 11:42:15Z — T4 nhận cờ ở poll tiếp theo). X188 xuất hiện lúc T5 đóng (nhiều khả năng T4-185 spawn X sau khi nhận cờ).

---

## §4. Boot #104 + F-185-T5-1 + F-185-T5-2 + gap kiểm lại độc lập

### §4.1. Boot #104 (9161bfd1) — số thô (brief giao btime ≈ 11:14Z; T5 đo chính xác)

- #104: boot_id đầy đủ `9161bfd1-861f-4f9f-90ed-eee0387081de`; btime **11:13:42Z** (epoch 1795518822 — /proc/stat); `uptime -s` khớp 11:13:42Z; journal chỉ idx 0 (first entry 11:13:54Z = btime +12 s); wtmp/journal khớp mẫu #102 (+11 s). `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- **Gap #103→#104 = 7.127 s** (1h58m47s — TRỞ LẠI mẫu ~2h, giống #101→#102 = 6.878 s); gap #102→#103 = 7.670 s; gap #101→#102 = 6.878 s.
- **Số hiệu #104 CHỜ T0-185 xác minh 9 nguồn** — T5 chỉ trình số thô, khớp brief (btime ≈ 11:14Z, uptime 22' lúc 11:36Z → T5 đo btime 11:13:42Z, uptime 25' lúc 11:39:21Z).
- **T5 KHÔNG phán (m)** — thuộc T2-185 + parent. Số thô: **(m) #103 DƯƠNG ỨNG VIÊN +37,543 s (T7-184, sơ bộ)**; (m) #104 thuộc T2-185.

### §4.2. F-185-T5-1 (mới) và chuỗi mẫu overlap poll-cuối-sau-btime

Watcher-184 pid 211325 đọc được boot_id cũ 9 s sau btime mới (đã giải thích ở F-172-T5-1). Mẫu thứ 17 — chuỗi **11 → 20 → 23 → 9 → 8 → 36 → 7 → 3 → 17 → 22 → 26 → 24 → 29 → 22 → 6 → 17 → 9 s**; poll cuối 09:15:04Z, dpkg/md5 khớp #102 (1461/a446f498); poll trước 09:14:34Z, trước btime 21 s. **Không ảnh hưởng verdict.**

### §4.3. F-185-T5-2 (mới) — Ledger KHÔNG cập nhật bởi replay #104

- ledger.jsonl (`/var/lib/hatch/os-intent/ledger.jsonl`) lúc T5 đóng: **1 dòng, 3.040 B, mtime 07:40:58Z KHÔNG ĐỔI** — ts **1795499802** (repair #101, 05:56:42Z), **compacted=true, added 170** (danh sách kết thúc bằng `gstreamer1.0-tools`, `libevent-2.1-7` — đúng các gói replay #102 cài).
- **Replay #104 (xong 11:40:18Z, 50 transaction, gói cuối gstreamer1.0-tools) KHÔNG compact/không thêm dòng ledger** — KHÁC #102 (replay compact 2 dòng → 1 dòng lúc 07:40:57Z, F-184-T5-2). Nguyên nhân chưa xác định (có thể hook dpkg-post-invoke không chạy vì added-set trùng hệt #102, hoặc hook không kích hoạt trên #104) — **không ảnh hưởng số đếm** (dpkg.log + history + term.log + postboot là 4 nguồn độc lập chứng minh replay #104 đủ); T2/T10 không nhầm ts 1795499802 với boot #104 (ts là của repair #101).

### §4.4. F-177-T5-3 vẫn đúng (không kiểm lại đợt này)

`who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T5 dùng **epoch /proc/stat làm chuẩn**; T0-185 làm rõ bằng 9 nguồn. Ghi nhận lần 9 (#90, #92, #94, #95, #98, #99, #101, #102, #104).

### §4.5. F-178-T7-4 — ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start — gen #104 thuộc T0/T7; /proc/1 mtime #104 giao T0-185.

---

## §5. Replay #104 CHI TIẾT + replay #103 ĐÌNH TRỆ + ledger

### §5.1. Replay #104 CHẠY ĐẦY ĐỦ — KHÔNG ĐÌNH TRỆ

- **Hoạt động:** heal `dpkg --configure -a` **11:35:39Z (boot+21m57s)** viết 2 dòng "startup packages configure" — **MUỘN hơn nhiều so với #102 (boot+40s)**; install đầu **~11:36:02Z (boot+22m20s)** — heal → install cách ~23 s (nhanh, khác #102 cách ~10'); install liên tục 11:36:02–11:40:18Z; gói cuối gstreamer1.0-tools 11:40:18Z (boot+26m36s) rồi **IM (đóng băng tới lúc T5 đóng, 0 proc apt/dpkg)** — im SAU khi xong, không phải im giữa chừng. **GIỐNG #102** (chạy đủ 50 transaction, gói cuối gstreamer1.0-tools) **và KHÁC #103** (heal rồi im hoàn toàn, 0 install) **và KHÁC #100** (chạy tới dpkg 309 dòng rồi dừng).
- **Heal muộn boot+21m57s là điểm mới cần ghi nhận:** trên #102 heal ở boot+40s. #104 heal muộn nhưng chạy đủ và xong nhanh (heal → xong chỉ ~4m39s, so với #102 ~33m). Nguyên nhân heal muộn chưa xác định trong cell (có thể host-side scheduling — replay trigger không do cell điều khiển) — **không suy diễn thêm; giao nợ host-side quyết (k) đợt 174 theo dõi** (replay #104 chạy đủ nên không phải đình trệ).
- **Journal #104: 0 entry os-intent/apt/dpkg** — GIỐNG #101/#102 (replay host không ghi journal). Nhưng replay #104 CHẠY ĐỦ (dpkg 1468 dòng + history 50 transaction + postboot exit=0 — 3 nguồn độc lập) → **journal trống là đặc điểm host, KHÔNG phải bằng chứng đình trệ.**
- **Form-B (T5 verify tay TRƯỚC khi spawn watcher, check-only):** postboot 11:41:35Z **exit=0** — PASS wrapper/libs/GST/apt (11/11 NEED + 5/5 lib; GST 269=269 thư mục thật). Log `t5-postboot-verify-formB-9161bfd1.log` (chỉ đọc). **KHÔNG CẦN repair** — watcher chỉ cần REPLAY_DONE + poll0.
- **Sau replay:** dpkg.log **1468 dòng** (mtime 11:40:18Z; md5 18b78f34); **213 "status installed"**, **436 "configure"** (grep thường, cùng pp T5-184 — #102: 212/434, chênh +1/+2); **apt history: 50 transaction** (11:36:02–11:40:18Z — BẰNG #102); **term.log 0 lỗi**. Cache 169 → **170 .deb** (gói cuối về cache lúc 11:40:18Z); lists 5 → **39** (bằng #102). **GST thư mục thật, tools CÀI** (xem §3.1).
- **Postboot poll0 (11:42:15Z, exit=0):** PASS wrapper/libs/GST/apt — **11/11 gói NEED** + 5/5 lib (verify độc lập khớp); GST 269=269 **thư mục thật**; **tools CÀI**; **libc-bin 2.39-0ubuntu8.12** (xem F-183-T5-3).

### §5.2. Replay #103 ĐÌNH TRỆ TOÀN PHẦN — nợ host-side quyết (k) đợt 174 VẪN MỞ

- **Bằng chứng (3 nguồn độc lập, đều từ hồ sơ lưu — T5-185 không đo tươi được vì boot đã chết):** (1) T8-184 selfcheck #2 09:21:02Z: **dpkg 2 dòng, libs 0/6 THIẾU, GST 0**; (2) harness T8-184 10:31–10:40Z: WebKit 0/3 launch-fail `libevent-2.1.so.7` (exit 127) — #103 vẫn chưa heal ở boot+~1h20m; (3) ledger GIỮ ts 1795499802/added 170, mtime 07:40:58Z — replay #103 không thêm gì (xem §4.3).
- **Chuỗi đình trệ:** #100 một phần → #101 toàn phần → **#102 KHÔNG đình trệ (đợt 184)** → **#103 ĐÌNH TRỆ TOÀN PHẦN** → **#104 KHÔNG đình trệ (đợt này)**. Mẫu xen kẽ, không quy luật chẵn/lẻ rõ ràng. **Nguyên nhân đình trệ #100/#101/#103 VẪN CHƯA TÌM RA trong cell** (không manh mối mới trên #104 — replay chạy đủ mà journal vẫn trống y hệt #103; heal muộn boot+22m là điểm mới duy nhất, chưa đủ kết luận) → **vẫn nợ host-side** theo quyết (k) đợt 174.

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (KHÔNG repair #104 — replay đã đủ; T5 không probe tay chạm dpkg; KHÔNG THỬ repair #103 — boot đã chết)

- T5-185 **KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** — 0 lần configure/install/update/repair tay. Watcher-185 KHÔNG repair (không trigger EARLY-REPAIR/BACKSTOP — lines 1468 > 100, replay đã đủ). Form-B tay 11:41:35Z chạy lúc replay đã xong từ 11:40:18Z (0 proc apt/dpkg) — chỉ đọc.
- **Thứ tự an toàn:** cờ #104 ghi 11:42:15Z, SAU khi T4-185 bắt đầu gate0wait (11:41Z) ~1' — T4 nhận cờ ở poll tiếp theo, đúng chiến lược (h). **Verify độc lập ~11:42:48Z** — **chỉ đọc**, không giữ lock dpkg, không phải script nặng — **0 VI PHẠM F-175-T4-2 phía T5**. Chuỗi 0 vi phạm phía T5 giữ từ đợt 179 (chuỗi toàn đợt đã ĐỨT về 0 ở đợt 183 theo quyết (p) đợt 183).
- **Khởi động daemon theo F-182-T9-1:** watcher-185 spawn bằng đường dẫn TUYỆT ĐỐI, `nohup bash /abs/path/replay-watch-185.sh > nohup.log 2>&1 & disown` — KHÔNG dùng `cd ... && setsid ... &`; verify bằng ps (pid 18279) + START line + poll đầu. **0 daemon khác do T5 spawn đợt này.**
- **Hướng (3) đứng lần thứ 32** (§2). G1 chờ user (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (0 thử lần thứ 38 — theo T9 đợt 184). File oversize 6,4 MB chưa quyết số phận.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 185: script postboot không đổi từ đợt 176; log poll0 + independent #104 có dòng đầu là dòng live mới, rồi PASS wrapper/libs/GST/apt + KẾT LUẬN, exit=0 — dòng DOT-151 cứng KHÔNG còn xuất hiện. F-175-T5-3 **ĐÓNG từ đợt 176, vẫn đóng**.

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #104 (giao T9):** MemAvailable **tăng — 1.614.792 / 1.956.536 kB** (2 điểm: ~11:43Z / ~11:44Z; MemTotal chưa đo đợt này). Diễn biến đầy đủ thuộc T9-185.

**ENOSPC #104 (T9 đếm chính thức):** **4 dòng lúc ~11:40Z → 6 dòng lúc 11:43:37Z** ("No space left on device" trong journal boot hiện tại; nhịp ~0,9 dòng/phút — cùng tốc độ #102/#101). Lỗi VẪN TĂNG lúc đóng. **Lưu ý F-182-T9-6:** ENOSPC trên #100 DỪNG sau 03:31:17Z — trên #104 lỗi vẫn tăng đều, KHÔNG dừng (giao T9-185 theo dõi).

**X11:** **Trống lúc mở (~11:41Z)** — 0 Xvfb. **X188 xuất hiện sau cờ** (nhiều khả năng T4-185 spawn X sau khi nhận cờ 11:42:15Z). Quan sát thêm: process `b2watch.sh` pid 6789 (cwd `~/workspace/repo-1/round185-t9` — của T9-185) chạy từ 11:40Z — T5 ghi nhận, không đụng.

**Journal #104:** chỉ idx 0 duy nhất (boot 9161bfd1); first entry 11:13:54Z (btime +12 s); 0 entry os-intent/apt/dpkg (replay host không ghi journal — xem §5.1).

---

## §8. Nợ mở chuyển đợt 186

1. **(m) #103 + INSIDE #103 (FULL149)** — T2-185 + parent 185.
2. **Số hiệu #103/#104** — T0-185 xác minh 9 nguồn (T7-184 chỉ ghi nhận #103 sự kiện + btime 9 nguồn, giờ thật; T5 chỉ trình số thô #104).
3. **Cờ #104 (replay, poll=0, KHÔNG caveat, 11:42:15Z)** — parent quyết §9(b). **Cờ #103 KHÔNG CÓ — KHÔNG THỬ REPAIR (boot đã chết; tiền lệ #100/#83 (b2))** — parent quyết tổng boot không cờ 22 → 23; **#97/#100 VẪN KHÔNG CÓ.**
4. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 29 thuộc T2-185).
5. **(m) #56 lần 28** — T2-185.
6. **Balloon trên #104** — T9-185 (E-226 nếu ghim tiếp trên #104/#105; E-221–E-225 đã kết thúc bởi sag, không episode đang ghim lúc đóng đợt 184).
7. **Watcher-185 vẫn chạy trên #104** (pid 18279, hạn 14:35:00Z) — T5-186 tiếp quản; nếu reboot mới (#105), spawn watcher mới theo mẫu.
8. **Prune lần 60** — T6-185 (F-147-T6-1 đếm lại từ 0; file cũ nhất sau prune 59).
9. **Run 184 kết cục** — T7-185 (vẫn running lúc T7-184 đóng; viết lại ×1 tại #103; jitter 0; hạn 11:35:51Z — hạn đã qua trong lúc T5-185 làm việc); **run 185 kết cục** — T7-186.
10. **#104 có giết holder không** — T6-185.
11. **F-185-T5-1 (overlap +9 s, mẫu 17) + F-185-T5-2 (ledger KHÔNG cập nhật bởi replay #104; ts 1795499802 GIỮ từ repair #101)** — ghi nhận; T2/T10 không đếm nhầm.
12. **F-182-T9-6 (ENOSPC #100 dừng sau 03:31:17Z)** — trên #104 lỗi vẫn tăng đều (6 dòng lúc 11:43:37Z) — theo dõi T9-185.
13. **Replay đình trệ #100/#101/#103 — nguyên nhân VẪN CHƯA TÌM RA trong cell** (§5.2); #104 chạy đủ nhưng heal muộn boot+21m57s (điểm mới, chưa đủ kết luận) → **vẫn nợ host-side** (quyết (k) đợt 174).
14. **F-184-T2-11 (boot_id lúc 09:14:59Z vẫn hiện 6ecd948e)** — T0-185 xác minh; dữ kiện mới: poll cuối watcher-184 09:15:04Z vẫn đọc boot=6ecd948e (+9 s sau btime #103).
15. **Plan B B1 / V2 (f'') / H3** — T8-185 theo dõi live (quyết (j) đợt 184: NÂNG V2 làm phương án chính từ đợt 185; V1 giữ đối chứng; H3 chỉ giám sát thụ động).
16. **T2-185/T4-185:** không chạy script nặng / không probe dpkg trong cửa sổ attempt (quyết (p) đợt 184: F-184-T2-8 VI PHẠM — kiểm-trước-khởi-động CHƯA ĐỦ với script dài).
17. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
18. **F-184-T8-1** (bẫy đổi tên viết đè đường dẫn log lịch sử — lần đổi tên sau loại trừ khối LOGS khỏi thay token; T5-185 đã áp dụng khi đổi tên watcher 184→185) + **F-184-T1-1** (GAP §112 — T1-185 cập nhật, stage trong batch T1-185).

---

## §9. Đề xuất cho parent (quyết ở aggregate 185)

**(a) Chấp nhận verdict đợt 185 (phần T5)?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #104 đã có (replay, poll=0, KHÔNG caveat, verify độc lập exit=0), #103 KHÔNG CÓ cờ + KHÔNG THỬ REPAIR (boot đã chết; tiền lệ #100/#83 (b2)), #102/#101/#99/#98/#96/#95 VẪN CÓ, #97/#100 VẪN KHÔNG CÓ (tổng boot không cờ 22 → 23 nếu chấp nhận #103), watcher-185 chạy tốt, F-178-T7-4 đã làm rõ, F-175-T5-3 vẫn đóng, hướng (3) lần 32, marker 54 reboot, 0 vi phạm B4 phía T5.

**(b) Cờ #104 (replay-đầy-đủ, poll=0) — CÂU HỎI QUYẾT:** Watcher-185 REPLAY_DONE → postboot poll0 exit=0 trên boot SỐNG (log poll0), verify độc lập exit=0, 11/11 NEED + 5/5 lib + GST 269=269 thư mục thật + cache 170 + lists 39 + dpkg 1468 + tools CÀI. **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #104 đứng cho gate (a) **KHÔNG caveat** — tiền lệ #102/#99/#95 (replay, poll=0; GST thư mục thật, tools cài);
- (b2) Không chấp nhận (T5 không thấy căn cứ — replay đủ 50 transaction, 0 lỗi term.log, verify độc lập khớp; profile giống hệt #102 đã chấp nhận).

**(c) Cờ #103 KHÔNG CÓ — T5 đề xuất parent ghi nhận KHÔNG bù được + TỔNG BOOT KHÔNG CỜ 22 → 23** (tiền lệ #100/#97/#93; quyết (b2) đợt 83: không tự viết cờ cho boot đã chết). **#102/#101/#99/#98/#96/#95 VẪN CÓ — mtime/md5 cả sáu KHÔNG ĐỔI — chấp nhận?**

**(d) Xác nhận số hiệu boot #104 (T0-185, 9 nguồn — T5 chỉ trình số thô: boot_id 9161bfd1, btime 11:13:42Z, gap #103→#104 = 7.127 s) — parent chấp nhận? #103 ghi nhận (T7-184 xác minh 9 nguồn, giờ thật; số hiệu chờ T0-185)?**

**(e) Replay #104 CHẠY ĐẦY ĐỦ — chuỗi đình trệ xen kẽ (#102 không, #103 có, #104 không); nguyên nhân đình trệ #100/#101/#103 VẪN CHƯA TÌM RA trong cell** (journal #104 vẫn trống y hệt #103 dù replay chạy đủ; heal muộn boot+21m57s là điểm mới, chưa đủ kết luận) — **vẫn nợ host-side** theo quyết (k) đợt 174. Parent có muốn điều tra host-side không, hay giữ nguyên tắc (k)?

**(f) F-185-T5-1 (overlap +9 s, mẫu 17) + F-185-T5-2 (ledger KHÔNG cập nhật bởi replay #104, GIỮ ts 1795499802) + F-177-T5-3 (who -b chỉ cho phút, lần 9) — ghi nhận, không đổi verdict (m).**

**(g) F-178-T7-4 ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start — parent ghi nhận?** Gen #104 thuộc T0/T7.

**(h) Watcher-185 vẫn chạy trên #104** (pid 18279, hạn 14:35:00Z) — T5-186 tiếp quản; nếu reboot mới (#105), spawn watcher mới theo mẫu.

---

## §10. Sai số của chính T5-185 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-185-T5-1** | Poll cuối watcher-184 pid 211325 SAU btime #103 **9,0 s** (mẫu 17: 11→20→23→9→8→36→7→3→17→22→26→24→29→22→6→17→**9 s**) | Ghi nhận | Không ảnh hưởng verdict; poll duy nhất sau btime vẫn thuộc boot cũ (1461/a446f498 khớp #102) |
| **F-185-T5-2** | Ledger: replay #104 **KHÔNG compact/không thêm dòng** — GIỮ ts 1795499802 (repair #101), added 170, mtime 07:40:58Z | Ghi nhận | Không ảnh hưởng số đếm (4 nguồn độc lập chứng minh replay #104 đủ); T2/T10 không đếm nhầm ts với boot #104 |
| — | Cờ #104 ghi ở boot+28m33s (replay xong 11:40:18Z; T5 mở 11:41Z + khoảng không-watcher ~2h27m) | Ghi nhận | Mode vẫn replay, poll=0 |
| — | Đồng hồ: CF nhanh hơn local 0–1 s (2 lap: 0 s, +1 s) | Ghi nhận | Nằm trong trễ curl |
| — | RAM chỉ đo 2 điểm (1.615–1.957 MB trong ~1') | Hạn chế nhỏ | T5 đóng sớm (cờ xong 11:42:15Z); diễn biến đầy đủ thuộc T9-185 |
| — | T5-185 mở muộn (~11:41Z, ~5' sau khi đợt mở 11:35:51Z) | Ghi nhận | Không ảnh hưởng verdict: cờ #104 ghi trước hạn cờ ~14:00Z hơn 2 giờ; watcher spawn ngay sau form-B |
| — | Không kiểm daemon hatch / /proc/1 mtime trên #104 lúc đóng | Hạn chế nhỏ | Giao T0-185; không ảnh hưởng cờ |
| — | Không đo MemTotal #104 | Hạn chế nhỏ | Chỉ 2 điểm MemAvailable; giao T9-185 |

**Số liệu chính thức lấy từ log watcher-184/185 + log trực tiếp (form-B/poll0/independent) + dpkg/history/term.log của #104 + đối chiếu T7/T8-184 (hồ sơ lưu #103) + ledger.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND185_T5_INFRA_LIMITS.md` (file MỚI, không sửa file repo nào đợt này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round185-t5-infra.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round185-t5/` (theo mẫu T5-171–184): watcher script/log, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–185: đợt 166–184 = 190 batch / 280 entry / 258 đường dẫn / 254 file (quyết (r) đợt 184) + đợt 185 (1 file này, file MỚI; các T khác chưa tính lúc T5 đóng) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-185 (bản chính, 11:39Z – 11:44Z 24/11)

```
=== PHU LUC SO LIEU T5-185 (trich log truc tiep) ===
boot_id #104=9161bfd1-861f-4f9f-90ed-eee0387081de
btime_epoch #104=1795518822 = 2026-11-24T11:13:42+00:00 (uptime -s KHOP)
boot_id #103=e0921bda (btime 09:14:55Z, epoch 1795511695 — T7-184 XAC MINH 9 nguon, gio that)
gap #103->#104 = 7127 s; gap #102->#103 = 7670 s; gap #101->#102 = 6878 s

--- replay-watch-184.log (round184-t5, 68 dong) ---
pid 211325: poll cuoi=2026-11-24T09:15:04Z boot=6ecd948e dpkg_lines=1461 md5=a446f498 (+9 s sau btime #103 — mau 17, F-185-T5-1); 0 dong END/STOP/NEWBOOT

--- replay-watch-185.log (round185-t5) ---
START 2026-11-24T11:42:14Z pid=18279 boot=9161bfd1 btime=11:13:42Z end=2026-11-24T14:35:00Z
init_lines=1468 init_md5=18b78f34 init_mtime=11:40:18Z cache=170 lists=39 gst_sys=269
REPLAY_DONE TRIGGER 11:42:14Z boot_age=1712s frozen=116s dpkg_lines=1468
postboot poll0 exit=0 (hoan tat 11:42:15Z) dpkg_lines=1468 cache=170 lists=39
FLAG-WRITTEN 11:42:15Z mode=replay-day-du poll=0 (old=6ecd948e)
poll sau co: 30 s deu, dpkg 1468 md5 18b78f34, 0 proc (11:42:45Z)

--- 3. POSTBOOT_PASS ---
round185-t5/POSTBOOT_PASS: CO mtime=2026-11-24 11:42:15 +0000 bytes=315 md5=8e6d6e5d
round185-t5/POSTBOOT_PASS-6ecd948e: CO (backup #102, md5 6007fea8 = goc)
round184-t5/POSTBOOT_PASS (#102): CO, mtime=2026-11-24 08:43:59 +0000 bytes=315 md5=6007fea8 (KHONG DOI)
round183-t5/POSTBOOT_PASS (#101): CO, mtime=2026-11-24 05:56:42 +0000 bytes=324 md5=8c32fc3c (KHONG DOI)
round182-t5/POSTBOOT_PASS (#99): CO, mtime=2026-11-24 02:55:07 +0000 bytes=315 md5=3d031656 (KHONG DOI)
round181-t5/POSTBOOT_PASS (#98): CO, mtime=2026-11-24 00:16:31 +0000 bytes=324 md5=26452ec1 (KHONG DOI)
round180-t5/POSTBOOT_PASS (#96): CO, mtime=2026-11-23 22:08:08 +0000 bytes=324 md5=50869e4e (KHONG DOI)
round180-t5/POSTBOOT_PASS-95b483a2 (#95): CO, mtime backup=2026-11-23 22:08:08 +0000 bytes=315 md5=f8cd6d46 (KHONG DOI)
KHONG CO file POSTBOOT_PASS nao nhac e0921bda (#103) — da grep 2 lan doc lap (danh sach file + de quy)
KHONG CO file POSTBOOT_PASS nao nhac 9e440707 (#97) — da grep
KHONG CO file POSTBOOT_PASS nao nhac 7a83ab15 (#100) — da grep

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47Z

--- 5. dpkg/cache/lists/GST (boot #104, replay) ---
dpkg_lines=1468 md5=18b78f34 mtime=2026-11-24 11:40:18 +0000 (heal 11:35:39Z boot+21m57s; install dau ~11:36:02Z; goi cuoi gstreamer1.0-tools 11:40:18Z)
status installed=213; configure=436 (grep thuong, cung pp T5-184); install=170 (ledger added — CUA #102, xem F-185-T5-2)
cache_deb=170 lists_entries=39
gst_sys_files=269 (THU MUC THAT — apt; GIONG #102/#99/#95 replay)
apt_history_transactions=50 (11:36:02-11:40:18Z); term_log_errors=0
goi cuoi gstreamer1.0-tools 1.24.2-1ubuntu0.2

--- 6. 11 goi NEED + 5 lib + tools + ledger ---
11/11 install ok installed (NEED); gstreamer1.0-tools CAI (install ok installed; gst-inspect-1.0 CO — GIONG #102/#99/#95 replay)
5/5 lib CO; libc-bin 2.39-0ubuntu8.12 (F-183-T5-3: khong phan mode bang libc-bin)
ledger 1 dong, 3040 B, mtime 07:40:58Z KHONG DOI: ts 1795499802 compacted=true added 170, last5=[libwoff1, xfonts-cyrillic, xfonts-scalable, gstreamer1.0-tools, libevent-2.1-7] (F-185-T5-2: replay #104 KHONG compact/khong them dong)

--- 7. ENOSPC --- 4 (~11:40Z) -> 6 dong (11:43:37Z); ~0,9 dong/phut; dong dau chua dem chi tiet (T9 dem chinh thuc)
--- 8. RAM --- MemAvailable 1614792 / 1956536 kB (~11:43Z / ~11:44Z); MemTotal chua do
--- 9. Huong (3) --- user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; timers_vcut=0; units_vcut=0
--- 10. X11 --- TRONG luc mo (~11:41Z); X188 xuat hien sau co (nhieu kha nang T4-185 spawn); b2watch.sh pid 6789 (T9-185, cwd round185-t9) — ghi nhan, khong dung
--- 11. T4-185 --- gate0wait tu 11:41Z (pid 15128); co ghi 11:42:15Z — T4 nhan co o poll tiep theo
--- 12. Dong ho --- CF lap1 +0 s (11:40:49Z), lap2 +1 s (11:40:51Z); trong tre curl
```
