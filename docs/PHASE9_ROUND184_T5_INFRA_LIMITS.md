# PHASE 9 — ROUND 184 — T5 INFRA LIMITS

**Đợt:** 184 (mở lượt cron 15:35:51 +07 24/11/2026 = 08:35:51Z; hạn cờ ~11:00Z, hạn cứng ~11:35Z 24/11; T5 đóng ~08:48Z — sớm, cờ #102 xong 08:43:59Z).
**Người viết:** T5-184. **Ngày:** 24/11/2026. **Boot làm việc lúc đóng:** #102 ỨNG VIÊN (T0-184 chưa xác minh lúc T5 đóng) 6ecd948e, btime 07:07:05Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #102 (replay-đầy-đủ, poll=0, KHÔNG caveat — §3.1) + #100 KHÔNG THỬ REPAIR (nợ ĐÃ ĐÓNG đợt 183 — §3.2) + #101/#99/#98/#96/#95 VẪN CÓ + #97 VẪN KHÔNG CÓ (tổng boot không cờ GIỮ 22) + replay #102 KHÔNG ĐÌNH TRỆ (chấm dứt chuỗi 2 boot đình trệ #100/#101 — §5.1) + KHÔNG sửa file repo nào đợt này ngoài LIMITS này. File này là 1 entry stage duy nhất đợt 184 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #102 (6ecd948e, btime 07:07:05Z) | **ĐÃ CÓ 08:43:59Z (boot+1h36m54s, replay-đầy-đủ, poll=0, KHÔNG caveat)** — watcher-184 REPLAY_DONE poll đầu → poll0 exit=0; verify độc lập exit=0; 11/11 NEED + 5/5 lib; GST 269=269 **thư mục thật (apt)**; **tools CÀI** (gst-inspect-1.0 có — KHÁC #98/#101 repair); libc-bin 8.12 |
| Replay #102 | **CHẠY ĐẦY ĐỦ, KHÔNG ĐÌNH TRỆ** — heal 07:07:45Z (boot+40s) → install đầu 07:17:47Z → xong 07:40:57Z (boot+33m52s); dpkg 1461 dòng; history 50 transaction; term.log 0 lỗi; cache 170; lists 39 |
| POSTBOOT_PASS #100 (7a83ab15) | **KHÔNG CÓ — KHÔNG THỬ REPAIR** (nợ repair #100 ĐÃ ĐÓNG đợt 183, parent quyết (c) đợt 183); tổng boot không cờ GIỮ 22 |
| POSTBOOT_PASS #101 (51745634) | **VẪN CÓ** (05:56:42Z, repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 183); backup byte-identical trong round184-t5 (md5 8c32fc3c) |
| POSTBOOT_PASS #99/#98/#96/#95 | **VẪN CÓ** (replay/repair/repair/replay — mtime + md5 KHÔNG ĐỔI) |
| POSTBOOT_PASS #97 (9e440707) | **VẪN KHÔNG CÓ** — grep 0 file POSTBOOT_PASS* nhắc 9e440707 |
| Watcher-183 | pid 384639 **CHẾT theo #102** (poll cuối 07:07:22Z, +17 s — mẫu 16, F-184-T5-1); 0 dòng END/STOP/NEWBOOT |
| Watcher-184 | START 08:43:58Z, pid **211325**, hạn 11:35:00Z — **poll0 đã ghi cờ**; vẫn ALIVE lúc T5 đóng (poll ổn định dpkg 1461) |
| Khoảng không-watcher | **~1h36m36s** (07:07:22Z → 08:43:58Z) — bao trọn replay #102 (07:07:45–07:40:57Z); replay tự chạy đủ mà KHÔNG cần watcher |
| Hướng (3) | **VẪN ĐỨNG lần thứ 31 liên tiếp** (user@0 static, không linger, không cron, không /run/user/0, 0 timer VCut) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#101 = 53 reboot ĐÃ XÁC NHẬN** (parent quyết (e) đợt 183); #102 chờ T0-184 (→ 54 nếu xác nhận) |
| ENOSPC | #102: **77 dòng lúc ~08:46Z** (72 lúc ~08:41Z → 77 lúc ~08:46Z, ≈0,9–1,0 dòng/phút; inotify cross-check KHỚP 77=77 — T9 đếm chính thức) |
| X11 | **Trống lúc mở** — 0 Xvfb; T4-184 chưa spawn X lúc T5 đóng |
| RAM #102 | MemAvailable **tăng mạnh: 773 / 844 / 1.758 MB** (3 điểm, ~08:42–08:46Z; giao T9) |
| Đồng hồ | Local ≈ Cloudflare **+2 s** (CF nhanh hơn ~2 s cả 2 lap — trong trễ curl) |
| Quy tắc B4 | **T5-184 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 lần configure/install/update/repair tay) — KHÔNG CẦN repair #102 (replay đã đủ) |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot không đổi; log poll0 + independent #102 in dòng live đầu tiên) |
| T4-184 | **Đã nhận cờ NGAY poll #1** (08:46:16Z): t5flag=PASS (184-t5/POSTBOOT_PASS), gate0=T5, postboot_exit=0, dpkg 1461 — cờ đã có sẵn trước khi T4 bắt đầu gate0wait ~2m17s |

**Số hiệu boot #102 CHỜ T0-184 xác minh 9 nguồn (T8/T9-183 chỉ ghi nhận sự kiện + btime — T5 chỉ trình số thô, khớp T8/T9: boot_id, btime, gap).**
**T5 KHÔNG phán (m), chỉ trình số thô — (m) #102 + INSIDE #102 thuộc T2-184 + parent.**

---

## §1. Timeline (giờ Z, 24/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 05:12:27Z | Reboot #101 (51745634 — T0-183 XÁC NHẬN 9 nguồn); gap #100→#101 = 7.400 s |
| 05:56:42Z | Cờ #101 ghi (repair-sớm-quyết-h, poll=1, CÓ caveat); watcher-183 pid 384639 tiếp tục chạy |
| 07:07:05Z | **Reboot #102 (6ecd948e — T8/T9-183 ghi nhận; số hiệu chờ T0-184)**; gap #101→#102 = 6.878 s |
| 07:07:22Z | **Poll cuối watcher-183 pid 384639** (+17 s sau btime #102 — mẫu overlap thứ 16, F-184-T5-1) |
| 07:07:45Z | Heal #102: dpkg.log 2 dòng (boot+40 s) |
| 07:17:47Z | Install đầu tiên của replay #102 (libaspell15) — heal → install cách ~10' (xem §5.1) |
| 07:40:57Z | **Replay #102 XONG** (gói cuối gstreamer1.0-tools; dpkg 1461 dòng) — boot+33m52s |
| 08:35:51Z | Lượt cron đợt 184 mở; run 184 dispatch (boot_gen thuộc T0/T7) |
| ~08:41Z | **T5-184 mở trên #102**: dpkg.log 1461 dòng, đóng băng từ 07:40:57Z (~61'); /var/log/apt CÓ; cache 170; lists 39; GST 269 thư mục thật; X11 TRỐNG |
| 08:42Z | Form-B tay TRƯỚC khi spawn watcher: postboot check-only **exit=0** (PASS đủ 4 cửa — §5.1) |
| 08:43:58Z | **Watcher-184 START, pid 211325** (khoảng không-watcher ~1h36m36s); poll đầu dpkg 1461 dòng, đóng băng 3.781 s, 0 proc → **REPLAY_DONE TRIGGER ngay** → postboot poll0 exit=0 |
| 08:43:59Z | **CỜ #102 GHI CÙNG GIÂY (replay-đầy-đủ, poll=0, KHÔNG caveat)**; backup cờ cũ #101 thành `POSTBOOT_PASS-51745634` (byte-identical) |
| ~08:44Z | T5 verify độc lập trên #102: **exit=0, 11/11 NEED + 5/5 lib, GST 269=269 thư mục thật, tools CÀI** (log `t5-postboot-independent-6ecd948e.log`) |
| 08:46:16Z | T4-184 bắt đầu gate0wait (poll-wait-t4-184.sh); poll #1 thấy cờ #102 ngay: t5flag=PASS, gate0=T5, postboot_exit=0 |
| ~08:48Z | T5 viết LIMITS này. Watcher-184 vẫn ALIVE (pid 211325, poll ổn định dpkg 1461). T4-184 đã nhận cờ, chưa spawn X lúc T5 đóng. |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 31 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở: `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không linger (`/var/lib/systemd/linger/` không tồn tại); không `/run/user/0`; `systemctl list-timers` chỉ có home-assistant-ensure.timer + systemd-tmpfiles-clean.timer — **0 timer VCut**; không unit VCut nào ở /etc/systemd/system hay /etc/systemd/user. Lần thứ 31 liên tiếp hướng (3) đứng. Watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–183.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z). Marker sống qua **#49–#101 = 53 reboot ĐÃ XÁC NHẬN** (parent quyết (e) đợt 183); **#102 chưa xác nhận** — nếu T0-184 xác nhận, marker sống qua 54 reboot.

**Đồng hồ (2 lap):** lap 1 (08:45:03Z): local 08:45:03Z → CF 08:45:05 GMT; lap 2 (08:46:33Z): local 08:46:33Z → CF 08:46:35 GMT — **CF nhanh hơn ~2 s cả hai lap** (T5-183 đo ~1 s trên #101) — nằm trong trễ curl, không kết luận đồng hồ trôi thêm. **Btime ghi bằng epoch nguyên**; gap tính bằng epoch nguyên — không dùng phân số.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #102 — ĐÃ CÓ (replay-đầy-đủ, poll=0) — KHÔNG caveat

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round184-t5/POSTBOOT_PASS`, 315 B, mtime 2026-11-24T08:43:59Z.
- Nội dung: `boot 6ecd948e-1abd-46bf-9159-9f5731e7cb50 (btime 2026-11-24 07:07:05Z; watcher-184) — replay-day-du: dpkg 1461 dong; cache 170 .deb; lists 39; postboot PASS poll0 doc lap exit 0 luc 2026-11-24T08:43:59Z; POSTBOOT_PASS moi ghi 2026-11-24T08:43:59Z poll=0 (replay-day-du); co cu 51745634 luu POSTBOOT_PASS-51745634`.
- Backup cờ cũ: `POSTBOOT_PASS-51745634`, 324 B — **md5 8c32fc3c, byte-identical với file gốc round183-t5 (cờ #101)**.
- **Lịch trình (watcher tự làm, không tay):** START 08:43:58Z → poll đầu dpkg 1461 dòng, đóng băng 3.781 s, 0 proc → **REPLAY_DONE TRIGGER cùng giây** (lines 1461 > 100, ổn định) → postboot poll0 exit=0 (08:43:59Z) → **FLAG-WRITTEN cùng giây**. KHÔNG trigger EARLY-REPAIR hay BACKSTOP (không cần — lines > 100).
- **Verify độc lập (T5, check-only, ~08:44Z):** postboot **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 thư mục thật (apt)** — KHÁC #101/#98/#96 repair (symlink → debroot), GIỐNG #99/#95 replay; **tools CÀI** (gstreamer1.0-tools `install ok installed` 1.24.2-1ubuntu0.2; gst-inspect-1.0 có tại /usr/bin — KHÁC #98/#101 repair); **libc-bin 2.39-0ubuntu8.12** (giống #99/#95/#101 — xem F-183-T5-3: version theo archive, không phán mode).
- **KHÔNG caveat** (đề xuất — giống #99/#95 replay đầy đủ): GST thư mục thật, tools cài, dpkg 1461 ≈ replay đầy đủ #99 (1.468). **Parent quyết (§9(b))** — T5 đề xuất chấp nhận **KHÔNG caveat** (tiền lệ #99/#95).
- **Lưu ý thời gian:** cờ ghi ở boot+1h36m54s — KHÔNG phải vì replay chậm (replay xong 07:40:57Z, boot+33m52s) mà vì **không watcher nào sống trên #102 trước 08:43:58Z** (khoảng không-watcher ~1h36m36s, bao trọn replay #102). T4-184 nhận cờ NGAY poll #1 (08:46:16Z) vì cờ đã có sẵn trước khi T4 bắt đầu gate0wait.

### §3.2. Cờ #100 — KHÔNG CÓ, KHÔNG THỬ REPAIR (nợ ĐÃ ĐÓNG đợt 183)

- **#100 (7a83ab15-…, btime 03:09:07Z):** kiểm lại đợt 184: `grep -rl "7a83ab15" --include="POSTBOOT_PASS*" hidden_files/` = **0 file** (exit 1) — không có file POSTBOOT_PASS nào nhắc 7a83ab15. **Tổng boot không cờ GIỮ 22.**
- **T5-184 KHÔNG thử repair #100** — theo quyết (c) đợt 183, nợ repair #100 **ĐÃ ĐÓNG** (boot đã qua trước khi T5-183 mở; dpkg.log/history mất theo rootfs rebuild; không watcher nào sống trên #100 sau 03:01Z). Không có gì mới để thử; chỉ kiểm lại tính không-có-cờ.

### §3.3. Cờ #97 — VẪN KHÔNG CÓ (đã xác nhận đợt 181, không bù được)

- **#97 (9e440707, btime 23:02:47Z):** kiểm lại đợt 184: `grep -rl "9e440707" --include="POSTBOOT_PASS*" hidden_files/` = **0 file** (exit 1). **Tổng boot không cờ GIỮ 22** (#97 + #100 + #93, #91, #87, #88, #83, #82 + 14 boot #51/#53/#54/#55/#57/#60/#63/#66/#68/#71/#72/#73/#76/#78).

### §3.4. Cờ #101 / #99 / #98 / #96 / #95 / #92 / #90 / #89 / #86 / #85 / #84 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #101 (51745634) | round183-t5/POSTBOOT_PASS, 05:56:42Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 183 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (8c32fc3c) |
| #99 (9897d4b4) | round182-t5/POSTBOOT_PASS, 02:55:07Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 182 KHÔNG caveat; **mtime + md5 KHÔNG ĐỔI** (3d031656) |
| #98 (e62eef3f) | round181-t5/POSTBOOT_PASS, 00:16:31Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 181 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (26452ec1) |
| #96 (8d2a69df) | round180-t5/POSTBOOT_PASS, 22:08:08Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 180 CÓ caveat; **mtime + md5 KHÔNG ĐỔI** (50869e4e) |
| #95 (95b483a2) | round180-t5/POSTBOOT_PASS-95b483a2, 20:59:47Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 180 KHÔNG caveat; **md5 KHÔNG ĐỔI** (f8cd6d46) |
| #92 (985bc2a3) | round178-t5/POSTBOOT_PASS, 11:53:41Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 178 |
| #90 (94247dfa) | round177-t5/POSTBOOT_PASS, 08:51:55Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 177 |
| #89 (15618ce8) | round176-t5/POSTBOOT_PASS, 05:42:19Z | replay, poll=0 |
| #86 (70b7f7ee) | round175-t5/POSTBOOT_PASS, 02:40:29Z | replay, poll=0 |
| #85 (3c704685) | round174-t5/POSTBOOT_PASS, 23:46:57Z | repair-tay, poll=1 |
| #84 (4ae2d2ea) | round173-t5/POSTBOOT_PASS, 21:27:05Z | repair, poll=1 |

### §3.5. Watcher-183 — CHẾT theo #102 (poll cuối +17 s, mẫu 16) + Watcher-184 đang chạy

- **Watcher-183, pid 384639** (spawn 05:43:03Z trên #101): poll cuối **07:07:22Z, +17 s sau btime #102** (mẫu overlap thứ 16, **F-184-T5-1**); log 150 dòng; 0 dòng END/STOP/NEWBOOT. Poll trước 07:06:52Z, trước btime 13 s.
- **Khoảng không-watcher ~1h36m36s** (07:07:22Z → 08:43:58Z) — ngắn hơn khoảng đợt 183 (9.230 s); bao trọn replay #102 (07:07:45–07:40:57Z). **Replay #102 tự chạy đủ mà KHÔNG cần watcher** — khác #101 (replay đình trệ trong khoảng không-watcher).
- **Watcher-184 (boot #102) — ĐANG CHẠY, đã làm xong nhiệm vụ chính:** spawn 08:43:58Z, pid **211325**, hạn 11:35:00Z. Khởi tạo: dpkg 1461 dòng, md5 a446f498, mtime 07:40:57Z, cache 170, lists 39, gst_sys 269. **REPLAY_DONE TRIGGER poll đầu** → postboot poll0 exit=0 → **FLAG-WRITTEN 08:43:59Z** (replay, poll=0). **Poll sau cờ đều 30 s** (dpkg 1461, md5 a446f498, gst 269, cache 170, lists 39, 0 proc, không đổi). Watcher vẫn ALIVE lúc T5 đóng — T5-185 tiếp quản; nếu reboot mới (#103), spawn watcher mới theo mẫu.
- **T4-184 đã nhận cờ NGAY poll #1:** poll #1 (08:46:16Z): t5flag=PASS (t5src=184-t5/POSTBOOT_PASS), postboot_exit=0 (pb_age=0x45s), gate0=T5, dpkg 1461; poll #2 (08:47:02Z): t5flag=PASS, gate0=T5. **Khác đợt 183** (T4 bắt đầu gate0wait TRƯỚC khi cờ ghi, phải chờ tới poll #19): đợt này cờ đã có sẵn ~2m17s trước khi T4 bắt đầu gate0wait (08:46:16Z). T4 chưa spawn X lúc T5 đóng.

---

## §4. Boot #102 + F-184-T5-1 + F-177-T5-3 + F-178-T7-4 + gap kiểm lại độc lập

### §4.1. Boot #102 (6ecd948e) — số thô (T8/T9-183 ghi nhận sự kiện + btime)

- #102: boot_id đầy đủ `6ecd948e-1abd-46bf-9159-9f5731e7cb50`; btime **07:07:05Z** (epoch 1795504025 — /proc/stat); `uptime -s` khớp 07:07:05Z; journal chỉ idx 0 (first entry 07:07:16Z = btime +11 s); wtmp begins 07:07:16Z (theo T9-183). `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- **Gap #101→#102 = 6.878 s** (kiểm lại — khớp T8/T9-183); gap #100→#101 = 7.400 s; gap #99→#100 = 7.041 s.
- **Số hiệu #102 CHỜ T0-184 xác minh 9 nguồn** — T8/T9-183 chỉ ghi nhận sự kiện + btime (T5 chỉ trình số thô, khớp T8/T9: boot_id, btime, gap).
- **T5 KHÔNG phán (m)** — thuộc T2-184 + parent. Số thô: **(m) #101 +41,126 s — DƯƠNG (CUỐI cấp T2, parent CHẤP NHẬN (f) đợt 183)**; (m) #102 thuộc T2-184.

### §4.2. F-184-T5-1 (mới) và chuỗi mẫu overlap poll-cuối-sau-btime

Watcher-183 pid 384639 đọc được boot_id cũ 17 s sau btime mới (đã giải thích ở F-172-T5-1). Mẫu thứ 16 — chuỗi **11 → 20 → 23 → 9 → 8 → 36 → 7 → 3 → 17 → 22 → 26 → 24 → 29 → 22 → 6 → 17 s**; poll cuối 07:07:22Z, dpkg/md5 khớp #101 (768/a84ee9fa); poll trước 07:06:52Z, trước btime 13 s. **Không ảnh hưởng verdict.**

### §4.3. F-177-T5-3 vẫn đúng (không kiểm lại đợt này)

`who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T5 dùng **epoch /proc/stat làm chuẩn**; T0-184 làm rõ bằng 9 nguồn. Ghi nhận lần 8 (#90, #92, #94, #95, #98, #99, #101, #102).

### §4.4. F-178-T7-4 — ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start — gen #102 thuộc T0/T7; /proc/1 mtime #102 giao T0-184.

---

## §5. Replay #102 CHI TIẾT + ledger + profile replay

### §5.1. Replay #102 CHẠY ĐẦY ĐỦ — chuỗi đình trệ 2 boot DỪNG

- **Hoạt động:** heal `dpkg --configure -a` **07:07:45Z (boot+40 s)** viết 2 dòng "startup packages configure"; install đầu **07:17:47Z (boot+10m42s)** — heal → install cách ~10' (nhiều khả năng là apt update fetch, KHÔNG đo được chi tiết vì journal 0 entry apt/dpkg); install liên tục 07:17:47–07:40:57Z; gói cuối gstreamer1.0-tools 07:40:57Z (boot+33m52s) rồi **IM (đóng băng 61' tới lúc T5 mở, 0 proc apt/dpkg)** — im SAU khi xong, không phải im giữa chừng. **KHÁC #101** (heal rồi im hoàn toàn, 0 install) **và KHÁC #100** (chạy tới dpkg 309 dòng rồi dừng). **Chuỗi 2 boot đình trệ liên tiếp (#100 một phần, #101 toàn phần) DỪNG ở #102.**
- **Journal #102: 0 entry os-intent/apt/dpkg** — GIỐNG #101 (replay host không ghi journal). Nhưng replay #102 CHẠY ĐỦ (dpkg 1461 dòng + history 50 transaction + ledger compacted — 3 nguồn độc lập) → **journal trống là đặc điểm host, KHÔNG phải bằng chứng đình trệ.** Kết luận cho nợ quyết (k) đợt 174: #102 KHÔNG đình trệ; **nguyên nhân đình trệ #100/#101 vẫn chưa tìm ra trong cell** (không manh mối mới nào trên #102 — replay chạy đủ mà journal vẫn trống y hệt #101) → **vẫn nợ host-side** theo quyết (k) đợt 174.
- **Form-B (T5 verify tay TRƯỚC khi spawn watcher, check-only):** postboot 08:42Z **exit=0** — PASS wrapper/libs/GST/apt (11/11 NEED + 5/5 lib; GST 269=269 thư mục thật). Log `t5-postboot-verify-formB-6ecd948e.log` (chỉ đọc). **KHÔNG CẦN repair** — watcher chỉ cần REPLAY_DONE + poll0.
- **Sau replay:** dpkg.log **1461 dòng** (mtime 07:40:57Z; md5 a446f498); **212 "status installed"**, **434 "configure"** (grep thường, cùng pp T5-183); **apt history: 50 transaction** (07:17:47–07:40:56Z); **term.log 0 lỗi**. Cache 0 → **170 .deb**; lists 5 → **39** (ít hơn #101 repair 66 — replay chỉ fetch lists cần thiết). **GST thư mục thật, tools CÀI** (xem §3.1).
- **Postboot poll0 (08:43:59Z, exit=0):** PASS wrapper/libs/GST/apt — **11/11 gói NEED** + 5/5 lib (verify độc lập khớp); GST 269=269 **thư mục thật**; **tools CÀI**; **libc-bin 2.39-0ubuntu8.12** (xem F-183-T5-3).

### §5.2. Ledger (F-184-T5-2 — cùng họ F-174-T5-2 → F-183-T5-2)

- ledger.jsonl (`/var/lib/hatch/os-intent/ledger.jsonl`) lúc T5 đóng: **1 dòng, 3.040 B, mtime 07:40Z** — ts **1795499802** (repair #101, 05:56:42Z), **compacted=true, added 170** (danh sách gồm đúng các gói replay #102 cài, kết thúc bằng libevent-2.1-7).
- **F-184-T5-2 (mới):** replay #102 **COMPACT 2 dòng → 1 dòng, GIỮ ts cũ 1795499802** (repair #101) — GIỐNG replay #99 (compact 2 dòng → 1 dòng, GIỮ ts repair #98), KHÁC repair #101 (append 1 dòng mới, ts mới 1795499802). Không ảnh hưởng số đếm (added 170 là sự kiện replay #102; ts 1795499802 là của repair #101, không phải boot #102); T2/T10 không nhầm ts với boot #102.

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (KHÔNG repair #102 — replay đã đủ; T5 không probe tay chạm dpkg)

- T5-184 **KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** — 0 lần configure/install/update/repair tay. Watcher-184 KHÔNG repair (không trigger EARLY-REPAIR/BACKSTOP — lines 1461 > 100, replay đã đủ). Form-B tay 08:42Z chạy lúc replay đã xong từ 07:40:57Z (0 proc apt/dpkg) — chỉ đọc.
- **Thứ tự an toàn:** cờ #102 ghi 08:43:59Z, TRƯỚC khi T4-184 bắt đầu gate0wait (08:46:16Z) — T4 nhận cờ ngay poll #1, đúng chiến lược (h): tạo gate (a) cho T4. **Verify độc lập ~08:44Z** chạy TRƯỚC khi T4 bắt đầu gate0wait — **chỉ đọc** (postboot check-only + dpkg-query + ls), không giữ lock dpkg, không phải script nặng, T4 lúc đó chưa gate0wait — **0 VI PHẠM F-175-T4-2 phía T5**. Chuỗi 0 vi phạm phía T5 giữ từ đợt 179 (lưu ý: chuỗi toàn đợt đã ĐỨT về 0 ở đợt 183 theo quyết (p) đợt 183 — F-183-T2-7; phía T5 vẫn 0 vi phạm).
- **Hướng (3) đứng lần thứ 31** (§2). G1 chờ user (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (0 thử lần thứ 37 — theo T9 đợt 183). File oversize 6,4 MB chưa quyết số phận.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 184: script postboot không đổi từ đợt 176; log poll0 + independent #102 có dòng đầu là dòng live mới, rồi PASS wrapper/libs/GST/apt + KẾT LUẬN, exit=0 — dòng DOT-151 cứng KHÔNG còn xuất hiện. F-175-T5-3 **ĐÓNG từ đợt 176, vẫn đóng**.

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #102 (giao T9):** MemAvailable **tăng mạnh — 773 / 844 / 1.758 MB** (3 điểm: ~08:42Z / 08:45Z / 08:46Z; MemTotal 8.124.900 kB) — KHÁC #101 (tăng dần chậm 1.619 → 2.588 MB trong ~18'). Diễn biến đầy đủ thuộc T9-184.

**ENOSPC #102 (T9 đếm chính thức):** **77 dòng lúc ~08:46Z** ("No space left on device" trong journal boot hiện tại; đối chiếu `grep inotify` KHỚP 77=77 — theo phương pháp chuẩn 6 điểm, F-183-T9-4). Tăng 72 (~08:41Z) → 77 (~08:46Z), ≈0,9–1,0 dòng/phút — cùng tốc độ #101/#99. Dòng đầu 07:08:57Z (boot+112s — khớp mẫu #101 boot+108s, #100 boot+110s, #99 boot+109s); dòng cuối lúc đếm 08:44:17Z — lỗi VẪN TĂNG lúc đóng. **Lưu ý F-182-T9-6:** ENOSPC trên #100 DỪNG sau 03:31:17Z — trên #102 lỗi VẪN TĂNG đều tới lúc đóng, KHÔNG dừng (giao T9-184 theo dõi).

**X11:** **Trống lúc mở (~08:41Z)** — 0 Xvfb. T4-184 chưa spawn X lúc T5 đóng (08:48Z).

**Journal #102:** chỉ idx 0 duy nhất (boot 6ecd948e); first entry 07:07:16Z (btime +11 s); 0 entry os-intent/apt/dpkg (replay host không ghi journal — xem §5.1).

---

## §8. Nợ mở chuyển đợt 185

1. **(m) #102 + INSIDE #102 (FULL148)** — T2-184 + parent 184.
2. **Số hiệu #102** — T0-184 xác minh 9 nguồn (T8/T9-183 chỉ ghi nhận sự kiện + btime).
3. **Cờ #102 (replay, poll=0, KHÔNG caveat, 08:43:59Z)** — parent quyết §9(b). **Cờ #100 KHÔNG CÓ — KHÔNG THỬ REPAIR, nợ ĐÃ ĐÓNG đợt 183** (§3.2); **tổng boot không cờ GIỮ 22**; **#97 VẪN KHÔNG CÓ.**
4. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 28 thuộc T2-184).
5. **(m) #56 lần 27** — T2-184.
6. **Balloon trên #102** — T9-184 (E-220 kết cục; E-221 nếu ghim tiếp trên #102/#103).
7. **Watcher-184 vẫn chạy trên #102** (pid 211325, hạn 11:35:00Z) — T5-185 tiếp quản; nếu reboot mới (#103), spawn watcher mới theo mẫu.
8. **Prune lần 59** — T6-184 (F-147-T6-1 đếm lại từ 0; file cũ nhất `cooldown-t2-round125` tới mốc 192h lúc 21:12:27Z 24/11).
9. **Run 183 kết cục** — T7-184 (vẫn running lúc T7-183 đóng; viết lại ×1 tại #102; jitter 0; hạn 08:35:51Z); **run 184 kết cục** — T7-185.
10. **#102 có giết holder không** — T6-184.
11. **F-184-T5-1 (overlap +17 s, mẫu 16) + F-184-T5-2 (ledger compact, GIỮ ts 1795499802, added 170)** — ghi nhận; T2/T10 không đếm nhầm; T5 không dùng libc-bin phán mode nữa.
12. **F-182-T9-6 (ENOSPC #100 dừng sau 03:31:17Z)** — trên #102 lỗi vẫn tăng đều tới lúc đóng (77 dòng lúc ~08:46Z) — theo dõi T9-184.
13. **Replay đình trệ #100/#101 — nguyên nhân VẪN CHƯA TÌM RA trong cell** (§5.1); #102 chạy đủ mà journal vẫn trống y hệt #101 → **vẫn nợ host-side** (quyết (k) đợt 174).
14. **HB 08:20:50Z + DR 09:00Z** — T7-184 kiểm (cửa slot đợt 184) + **HB/DR đợt 183** — T7-184 gộp (xem §11 aggregate 183).
15. **Plan B B1** — T8-184 theo dõi live (quyết (j) đợt 183: B2 VẪN HOÃN); **H3** chỉ giám sát thụ động.
16. **(c')/(f') V1 ĐƯỢC GIỮ — T8-184 chuẩn bị thiết kế nâng V2** (quyết (j) đợt 183); parent quyết đợt 184.
17. **T2-184/T4-184:** không chạy script nặng / không probe dpkg trong cửa sổ attempt (quyết (p) đợt 183: F-183-T2-7 VI PHẠM NHẸ — chuỗi 0 vi phạm ĐỨT 4 → 0; guard chỉ là lưới an toàn, không phải giấy phép).
18. **RAM #102 tăng mạnh (773 → 1.758 MB trong ~4')** — T9-184 theo dõi.
19. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
20. **F-183-T8-1** (bẫy log stale — đợt sau dọn `smoke/` khỏi bản copy HOẶC đổi replay sang kiểm tra mtime log > thời điểm mở đợt) + **F-183-T8-3** (chạy thừa driver — checklist copy driver đợt 184) + **F-183-T8-7** (T8-184 sửa selfcheck kiểm đúng tên file `libevent-2.1.so.7`).

---

## §9. Đề xuất cho parent (quyết ở aggregate 184)

**(a) Chấp nhận verdict đợt 184?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #102 đã có (replay, poll=0, KHÔNG caveat, verify độc lập exit=0), #100 KHÔNG CÓ cờ + KHÔNG THỬ REPAIR (nợ đã đóng đợt 183), #101/#99/#98/#96/#95 VẪN CÓ, #97 VẪN KHÔNG CÓ (tổng boot không cờ GIỮ 22), watcher-184 chạy tốt, F-178-T7-4 đã làm rõ, F-175-T5-3 vẫn đóng, hướng (3) lần 31, marker 53 reboot, 0 vi phạm B4 phía T5.

**(b) Cờ #102 (replay-đầy-đủ, poll=0) — CÂU HỎI QUYẾT:** Watcher-184 REPLAY_DONE → postboot poll0 exit=0 trên boot SỐNG (log poll0), verify độc lập exit=0, 11/11 NEED + 5/5 lib + GST 269=269 thư mục thật + cache 170 + lists 39 + dpkg 1461 + tools CÀI. **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #102 đứng cho gate (a) **KHÔNG caveat** — tiền lệ #99/#95 (replay, poll=0; GST thư mục thật, tools cài);
- (b2) Không chấp nhận (T5 không thấy căn cứ — replay đủ 50 transaction, 0 lỗi term.log, verify độc lập khớp; profile giống hệt #99 đã chấp nhận).

**(c) Cờ #100 KHÔNG CÓ — T5 đề xuất parent ghi nhận KHÔNG bù được + NỢ ĐÃ ĐÓNG đợt 183** (tổng boot không cờ GIỮ 22) — tiền lệ #97/#93.

**(d) #101 VẪN CÓ (repair, poll=1, caveat — (c) đợt 183; backup byte-identical md5 8c32fc3c) + #99 VẪN CÓ (replay, poll=0, KHÔNG caveat — (c) đợt 182) + #98 VẪN CÓ (repair, poll=1, caveat — (c) đợt 181) + #96 VẪN CÓ (repair, poll=1, caveat — (c) đợt 180) + #95 VẪN CÓ (replay, poll=0, KHÔNG caveat) — mtime/md5 cả năm KHÔNG ĐỔI — chấp nhận?**

**(e) Xác nhận số hiệu boot #102 (T0-184, 9 nguồn — T8/T9-183 chỉ ghi nhận sự kiện + btime; T5 chỉ trình số thô) — parent chấp nhận?**

**(f) F-184-T5-1 (overlap +17 s, mẫu 16) + F-184-T5-2 (ledger compact, GIỮ ts 1795499802, added 170) + F-177-T5-3 (who -b chỉ cho phút, lần 8) — ghi nhận, không đổi verdict (m).**

**(g) F-178-T7-4 ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start — parent ghi nhận?** Gen #102 thuộc T0/T7.

**(h) Watcher-184 vẫn chạy trên #102** (pid 211325, hạn 11:35:00Z) — T5-185 tiếp quản; nếu reboot mới (#103), spawn watcher mới theo mẫu.

**(i) Replay #102 CHẠY ĐẦY ĐỦ — chuỗi đình trệ 2 boot DỪNG; nguyên nhân đình trệ #100/#101 VẪN CHƯA TÌM RA trong cell** (journal #102 vẫn trống y hệt #101 dù replay chạy đủ) — **vẫn nợ host-side** theo quyết (k) đợt 174. Parent có muốn điều tra host-side không, hay giữ nguyên tắc (k)?

---

## §10. Sai số của chính T5-184 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-184-T5-1** | Poll cuối watcher-183 pid 384639 SAU btime #102 **17,0 s** (mẫu 16: 11→20→23→9→8→36→7→3→17→22→26→24→29→22→6→**17 s**) | Ghi nhận | Không ảnh hưởng verdict; poll duy nhất sau btime vẫn thuộc boot cũ (768/a84ee9fa khớp #101) |
| **F-184-T5-2** | Ledger: replay #102 compact 2 dòng → 1 dòng, **GIỮ ts 1795499802** (repair #101), added 170 | Ghi nhận | Không ảnh hưởng số đếm (added 170 là sự kiện replay #102; ts là của repair #101); T2/T10 không đếm nhầm |
| — | Cờ #102 ghi ở boot+1h36m54s (muộn vì không watcher nào sống trước 08:43:58Z) | Ghi nhận | Replay chỉ 33m52s, xong từ 07:40:57Z; cờ muộn vì khoảng không-watcher ~1h36m36s — mode vẫn replay, poll=0 |
| — | Đồng hồ: CF nhanh hơn local ~2 s (2 lap: ~2 s, ~2 s) | Ghi nhận | Nằm trong trễ curl |
| — | RAM chỉ đo 3 điểm (773–1.758 MB trong ~4') | Hạn chế nhỏ | T5 đóng sớm (cờ xong 08:43:59Z); diễn biến đầy đủ thuộc T9-184 |
| — | T5-184 mở muộn (~08:41Z, ~6' sau khi đợt mở 08:35:51Z) | Ghi nhận | Không ảnh hưởng verdict: cờ #102 ghi trước hạn cờ ~11:00Z hơn 2 giờ; watcher spawn ngay sau form-B |
| — | Không kiểm daemon hatch / /proc/1 mtime trên #102 lúc đóng | Hạn chế nhỏ | Giao T0-184; không ảnh hưởng cờ |

**Số liệu chính thức lấy từ log watcher-183/184 + log trực tiếp (form-B/poll0/independent) + dpkg/history/term.log của #102 + đối chiếu T8/T9-183.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND184_T5_INFRA_LIMITS.md` (file MỚI, không sửa file repo nào đợt này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round184-t5-infra.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round184-t5/` (theo mẫu T5-171–183): watcher script/log, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–184: đợt 166–183 = 180 batch / 265 entry / 244 file (quyết (r) đợt 183) + đợt 184 (1 file này, file MỚI; các T khác chưa tính lúc T5 đóng) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-184 (bản chính, 08:41Z – 08:48Z 24/11)

```
=== PHU LUC SO LIEU T5-184 (trich log truc tiep) ===
boot_id #102=6ecd948e-1abd-46bf-9159-9f5731e7cb50
btime_epoch #102=1795504025 = 2026-11-24T07:07:05+00:00 (uptime -s KHOP)
boot_id #101=51745634 (btime 05:12:27Z, epoch 1795497147 — T0-183 XAC NHAN 9 nguon)
gap #101->#102 = 6878 s; gap #100->#101 = 7400 s; gap #99->#100 = 7041 s

--- replay-watch-183.log (round183-t5, 150 dong) ---
pid 384639: poll cuoi=2026-11-24T07:07:22Z boot=51745634 dpkg_lines=768 md5=a84ee9fa (+17 s sau btime #102 — mau 16, F-184-T5-1); 0 dong END/STOP/NEWBOOT

--- replay-watch-184.log (round184-t5) ---
START 2026-11-24T08:43:58Z pid=211325 boot=6ecd948e btime=07:07:05Z end=2026-11-24T11:35:00Z
init_lines=1461 init_md5=a446f498 init_mtime=07:40:57Z cache=170 lists=39 gst_sys=269
REPLAY_DONE TRIGGER 08:43:58Z boot_age=5813s frozen=3781s dpkg_lines=1461
postboot poll0 exit=0 (hoan tat 08:43:59Z) dpkg_lines=1461 cache=170 lists=39
FLAG-WRITTEN 08:43:59Z mode=replay-day-du poll=0 (old=51745634)
poll sau co: 30 s deu, dpkg 1461 md5 a446f498, 0 proc (08:44:29Z -> 08:46:29Z)

--- 3. POSTBOOT_PASS ---
round184-t5/POSTBOOT_PASS: CO mtime=2026-11-24 08:43:59 +0000 bytes=315
round184-t5/POSTBOOT_PASS-51745634: CO (backup #101, md5 8c32fc3c = goc)
round183-t5/POSTBOOT_PASS (#101): CO, mtime=2026-11-24 05:56:42 +0000 bytes=324 md5=8c32fc3c (KHONG DOI)
round182-t5/POSTBOOT_PASS (#99): CO, mtime=2026-11-24 02:55:07 +0000 bytes=315 md5=3d031656 (KHONG DOI)
round181-t5/POSTBOOT_PASS (#98): CO, mtime=2026-11-24 00:16:31 +0000 bytes=324 md5=26452ec1 (KHONG DOI)
round180-t5/POSTBOOT_PASS (#96): CO, mtime=2026-11-23 22:08:08 +0000 bytes=324 md5=50869e4e (KHONG DOI)
round180-t5/POSTBOOT_PASS-95b483a2 (#95): CO, mtime backup=2026-11-23 22:08:08 +0000 bytes=315 md5=f8cd6d46 (KHONG DOI)
KHONG CO file POSTBOOT_PASS nao nhac 9e440707 (#97) — da grep round18*
KHONG CO file POSTBOOT_PASS nao nhac 7a83ab15 (#100) — da grep round18*

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47Z

--- 5. dpkg/cache/lists/GST (boot #102, replay) ---
dpkg_lines=1461 md5=a446f498 mtime=2026-11-24 07:40:57 +0000 (heal 07:07:45Z boot+40s; install dau 07:17:47Z; goi cuoi gstreamer1.0-tools 07:40:57Z)
status installed=212; configure=434 (grep thuong, cung pp T5-183); install=170 (ledger added)
cache_deb=170 lists_entries=39
gst_sys_files=269 (THU MUC THAT — apt; KHAC #101/#98/#96 symlink)
apt_history_transactions=50 (07:17:47-07:40:56Z); term_log_errors=0
goi cuoi gstreamer1.0-tools 1.24.2-1ubuntu0.2

--- 6. 11 goi NEED + 5 lib + tools + ledger ---
11/11 install ok installed (NEED); gstreamer1.0-tools CAI (install ok installed; gst-inspect-1.0 CO — KHAC #98/#101 repair, GIONG #99/#95 replay)
5/5 lib CO; libc-bin 2.39-0ubuntu8.12 (F-183-T5-3: khong phan mode bang libc-bin)
ledger 1 dong, 3040 B, mtime 07:40Z: ts 1795499802 compacted=true added 170 (F-184-T5-2: COMPACT 2 dong -> 1 dong, GIU ts repair #101)

--- 7. ENOSPC --- 72 (~08:41Z) -> 77 dong (~08:46Z); ~0,9-1,0 dong/phut; inotify cross-check KHOP 77=77; dong dau 07:08:57Z (boot+112s); dong cuoi 08:44:17Z
--- 8. RAM --- MemAvailable 772664 / 844024 / 1758092 kB (~08:42Z / 08:45Z / 08:46Z); MemTotal 8124900 kB
--- 9. Huong (3) --- user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; timers_vcut=0 (chi home-assistant-ensure.timer + systemd-tmpfiles-clean.timer)
--- 10. X11 --- TRONG luc mo (~08:41Z); T4-184 chua spawn X luc T5 dong
--- 11. T4-184 --- gate0wait tu 08:46:16Z (pid 276600); poll #1 08:46:16Z t5flag=PASS (184-t5/POSTBOOT_PASS) postboot_exit=0 gate0=T5 dpkg 1461; poll #2 08:47:02Z t5flag=PASS gate0=T5
```
