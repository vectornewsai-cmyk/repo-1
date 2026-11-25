# PHASE 9 — ROUND 181 — T5 INFRA LIMITS

**Đợt:** 181 (mở lượt cron 06:35:51 +07 24/11/2026 = 23:35:51Z 23/11; hạn cờ ~02:00Z, hạn cứng ~02:35Z 24/11; T5 đóng ~00:24Z — sớm, cờ xong 00:16:31Z).
**Người viết:** T5-181. **Ngày:** 24/11/2026. **Boot làm việc lúc đóng:** #98 ỨNG VIÊN (T0-181 chưa xác minh lúc T5 đóng) e62eef3f, btime 23:12:23Z.
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #98 (repair, poll=1, CÓ caveat — §3.1) + #96 VẪN CÓ + #97 KHÔNG CÓ (không bù được) + KHÔNG sửa file repo nào đợt này ngoài LIMITS này. File này là 1 entry stage duy nhất đợt 181 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #98 (e62eef3f, btime 23:12:23Z) | **ĐÃ CÓ 00:16:31Z (boot+1h04m08s, repair, poll=1)** — watcher-181 EARLY-REPAIR → poll1 exit=0; verify độc lập exit=0; 11/11 NEED + 5/5 lib; GST 269=269 **symlink → debroot (CÓ caveat repair, giống #96/#94)**; **tools CHƯA cài**; libc-bin 8.9 |
| Repair #98 | Trigger 23:59:08Z (boot_age 2.805 s, frozen 2.768 s, dpkg 2 dòng) → apt update ~17' (chậm hơn #96 ~13') → install → poll1 xong 00:16:31Z; dpkg 804; history 1 transaction; term.log 0 lỗi; **KHÔNG cần can thiệp tay** |
| POSTBOOT_PASS #97 (9e440707, btime 23:02:47Z) | **KHÔNG CÓ — KHÔNG bù được** (chết ở boot+576 s, trước trigger repair boot+900 s; không watcher nào sống sau 23:03:16Z; log #97 đã mất theo rootfs rebuild khi sang #98 — cùng quy tắc #93) — **tổng boot không cờ 20 → 21** |
| POSTBOOT_PASS #96 (8d2a69df) | **VẪN CÓ** (22:08:08Z, repair-sớm-quyết-h, poll=1, caveat repair — parent CHẤP NHẬN (c) đợt 180); backup byte-identical trong round181-t5 (md5 50869e4e) |
| POSTBOOT_PASS #95 (95b483a2) | **VẪN CÓ** (20:59:47Z, replay-đầy-đủ, poll=0, KHÔNG caveat — parent CHẤP NHẬN (c) đợt 180); mtime không đổi |
| Watcher-180 | pid 109083 **CHẾT theo #96** (poll cuối 21:21:20Z, +24 s — mẫu 12, F-180-T8-1); T8 respawn pid 8767 21:52:39Z → cờ #96; pid 8767 **CHẾT theo #97** (poll cuối 23:03:16Z, **+29 s — mẫu 13, F-181-T5-1**); 0 dòng END/STOP/NEWBOOT |
| Watcher-181 | START 23:59:08Z, pid **200203**, hạn 02:35:00Z — **poll1 đã ghi cờ**; vẫn ALIVE lúc T5 đóng (poll ổn định dpkg 804) |
| Khoảng không-watcher | **~3.552 s = 59m12s** (poll cuối watcher-180 23:03:16Z → START watcher-181 23:59:08Z) — bao trọn #97 (576 s) + 50' đầu #98; replay #98 ĐÌNH TRỆ trong khoảng này |
| Hướng (3) | **VẪN ĐỨNG lần thứ 28 liên tiếp** (user@0 static, không linger, không cron, không /run/user/0, 0 timer VCut — loginctl vẫn no bus) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#95 = 47 reboot ĐÃ XÁC NHẬN** (parent quyết (p) đợt 180); #96/#97/#98 chờ T0-181 (nếu xác nhận → 50) |
| ENOSPC | #98: **40 dòng lúc 23:59Z → 58 dòng lúc 00:19:41Z** (+18 trong ~20', ≈0,9 dòng/phút; T9 đếm chính thức) |
| X11 | **Trống lúc mở (23:58Z)** — 0 Xvfb; **X197 xuất hiện 00:19Z** (T4-181 spawn X sau khi có cờ) |
| RAM #98 | MemAvailable dao động mạnh: **925 / 652 / 1.311 MB** (3 điểm, giao T9) |
| Đồng hồ | Local ≈ Cloudflare **−1…−2 s** (CF nhanh hơn ~1 s lap 1, ~2 s lap 2; T7-180 đo ~0 s lúc 23:13:23Z trên #98) |
| Quy tắc B4 | **T5-181 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 lần configure/install/update/repair tay) — watcher repair 1 lần duy nhất trên #98, đúng chiến lược (h); T4-181 đang gate0wait lúc repair |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot không đổi; log poll1 + independent #98 in dòng live đầu tiên, không còn dòng DOT-151 cứng) |
| F-178-T7-4 | **ĐÃ LÀM RÕ (T0-179):** worker_boot_generation theo **daemon start** — daemon #98 pid 67 start 23:12:34Z (boot+12 s); gen mới thuộc T0/T7 |
| T4-181 | **Đã nhận cờ** — poll #31/#32 (00:18:40Z/00:19:26Z): t5flag=PASS, postboot_exit=0, gate0=T5 (round181-t5/POSTBOOT_PASS), dpkg 804 — T4 đang vào attempt; cờ #98 đã sẵn cho gate (a) |

**Số hiệu boot #96/#97/#98 CHỜ T0-181 xác minh 9 nguồn (T7-180 đã xác minh 9 nguồn cả ba — T5 chỉ trình số thô, khớp T7 từng số: boot_id, btime, gap).**
**T5 KHÔNG phán (m), chỉ trình số thô — (m) #96/#97/#98 thuộc T2-181 + parent quyết.**

---

## §1. Timeline (giờ Z, 23–24/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 19:10:22Z 23/11 | Reboot #95 (95b483a2 — T0-180 XÁC NHẬN 9 nguồn); gap #94→#95 = 6.793 s |
| 20:59:47Z | Cờ POSTBOOT_PASS #95 ghi (replay-đầy-đủ, poll=0, KHÔNG caveat); watcher-180 pid 109083 tiếp tục chạy |
| 21:20:56Z | **Reboot #96 (8d2a69df — T7-180 XÁC NHẬN 9 nguồn)**; gap #95→#96 = **7.834 s**; giết watcher-180 pid 109083 |
| 21:21:20Z | **Poll cuối watcher-180 pid 109083** (+24 s sau btime #96 — mẫu overlap thứ 12, F-180-T8-1) |
| 21:52:39Z | **T8-180 TIẾP QUẢN watcher** (F-180-T8-1): respawn pid 8767 trên #96 → EARLY-REPAIR ngay (boot_age 1.903 s, frozen 1.862 s, dpkg 2) → **cờ #96 22:08:08Z** (repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 180) |
| 23:02:47Z | **Reboot #97 (9e440707 — T7-180 XÁC NHẬN 9 nguồn)**; gap #96→#97 = **6.111 s**; #97 chỉ sống 576 s |
| 23:03:16Z | **Poll cuối watcher-180 pid 8767** (+29 s sau btime #97 — mẫu overlap thứ 13, **F-181-T5-1**); watcher chết theo #97 |
| 23:12:23Z | **Reboot #98 (e62eef3f — T7-180 XÁC NHẬN 9 nguồn)**; gap #97→#98 = **576 s (9m36s — NGẮN BẤT THƯỜNG, lần đầu gap <1.000 s trong chuỗi #93–#98)** |
| 23:12:59Z | Heal #98: dpkg.log 2 dòng "startup packages configure" (boot+36 s) rồi ĐÌNH TRỆ |
| 23:35:51Z | Lượt cron đợt 181 mở; run 181 dispatch (boot_gen thuộc T0/T7) |
| ~23:58Z | **T5-181 mở trên #98**: replay ĐÌNH TRỆ (dpkg 2 dòng từ 23:13:00Z; 0 proc; cache 0; lists 3; GST 0; /var/log/apt KHÔNG TỒN TẠI); `/tmp/.X11-unix/` TRỐNG |
| 23:58:35Z | Form-B tay TRƯỚC khi spawn watcher: postboot check-only **exit=1** (PASS wrapper K1; FAIL libs 5/5, GST 0, apt 11/11 — §5.1) |
| 23:59:08Z | **Watcher-181 START, pid 200203** (khoảng không-watcher ~3.552 s); poll đầu dpkg 2 dòng → **EARLY-REPAIR TRIGGER ngay** (boot_age 2.805 s, frozen 2.768 s); verify form-B exit=1 → `--repair` |
| 00:16:31Z 24/11 | **Cờ POSTBOOT_PASS #98 ghi (boot+1h04m08s, repair, poll=1)**; backup cờ #96 thành `POSTBOOT_PASS-8d2a69df` (byte-identical) |
| ~00:20Z | T5 verify độc lập trên #98: **exit=0, 11/11 NEED + 5/5 lib, GST 269=269 symlink, tools CHƯA cài** (log `t5-postboot-independent-e62eef3f.log`) |
| ~00:24Z | T5 viết LIMITS này. Watcher-181 vẫn ALIVE (pid 200203, poll ổn định dpkg 804). T4-181 đã nhận cờ, spawn X197, vào attempt. 3 cờ round181 `.done` lúc T5 đóng (t1, t5, t6; các dir round181-t0/t2/t4 đã có nhưng chưa có cờ). |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 28 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở: `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không linger; không `/run/user/0`; không `crontab` (lệnh không có); 0 timer VCut; không unit VCut nào ở /etc/systemd/system hay /etc/systemd/user. Lần thứ 28 liên tiếp hướng (3) đứng. T5 KHÔNG dùng systemd user manager / timer — watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–180.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z). Marker sống qua **#49–#95 = 47 reboot ĐÃ XÁC NHẬN** (parent quyết (p) đợt 180); **#96/#97/#98 chưa xác nhận** — nếu T0-181 xác nhận cả ba, marker sống qua 50 reboot. T5 không có bằng chứng mới về cơ chế bảo toàn `~/.config` — không mở lại chủ đề.

**Đồng hồ (2 lap):** lap 1 (23:59:29Z): local 23:59:29Z → CF 23:59:30 GMT — **CF nhanh hơn ~1 s**; lap 2 (00:04:53Z): local 00:04:53Z → CF 00:04:55 GMT — **CF nhanh hơn ~2 s** (T7-180 đo ~0 s lúc 23:13:23Z trên #98; T5-180 đo ~2 s trên #95). Lệch 1–2 s có thể gồm ~1 s trễ curl — ghi nhận, không kết luận đồng hồ trôi thêm. **Btime ghi bằng epoch nguyên**; gap tính bằng epoch nguyên — không dùng phân số. F-180-T9-3 (sampler cuối #95 muộn hơn btime #96 18 s) giao T0-181: T5 chỉ ghi nhận số đo CF, không phán nguyên nhân.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #98 — ĐÃ CÓ (repair-sớm-quyết-h, poll=1) — CÓ caveat repair

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round181-t5/POSTBOOT_PASS`, 324 B, mtime 2026-11-24T00:16:31Z.
- Nội dung: `boot e62eef3f-9a53-4d67-8a8b-7077ee917156 (btime 2026-11-23 23:12:23Z; watcher-181) — repair-som-quyet-h: dpkg 804 dong; cache 111 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-24T00:16:31Z; POSTBOOT_PASS moi ghi 2026-11-24T00:16:31Z poll=1 (repair-som-quyet-h); co cu 8d2a69df luu POSTBOOT_PASS-8d2a69df`.
- Backup cờ cũ: `POSTBOOT_PASS-8d2a69df`, 324 B — **md5 50869e4efff8aa916ad43b489f87e00a, byte-identical với file gốc round180-t5 (cờ #96)**.
- **Lịch trình (watcher tự làm, không tay):** START 23:59:08Z → poll đầu dpkg 2 dòng, frozen 2.768 s → **EARLY-REPAIR TRIGGER** cùng giây → verify form-B exit=1 (23:59:09Z) → `--repair` exit=0 → COPIED apt log → poll1 exit=0 (00:16:31Z) → **FLAG-WRITTEN cùng giây**. KHÔNG trigger REPLAY_DONE (dpkg < 100). KHÔNG trigger BACKSTOP (trigger 15' đã chạy).
- **Verify độc lập (T5, check-only, ~00:20Z):** postboot **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 symlink → debroot** (KHÁC #95 thư mục thật — GIỐNG #96/#94); **tools CHƯA cài** (gst-inspect-1.0 not found; gstreamer1.0-tools not-installed — GIỐNG #96); **libc-bin 2.39-0ubuntu8.9** (dấu repair, = #96/#94/#90).
- **CÓ caveat repair** (giống #96/#94): GST symlink → debroot (ephemeral, vá tạm K1), tools chưa cài, dpkg 804 (không phải 1.545 của replay đầy đủ). **Parent quyết (§9(c))** — T5 đề xuất chấp nhận **CÓ caveat** (tiền lệ #96/#94/#90).
- **Lưu ý thời gian:** cờ ghi ở boot+1h04m08s — KHÔNG phải vì repair chậm (trigger→cờ 17m23s) mà vì **không watcher nào sống trên #98 trước 23:59:08Z** (khoảng không-watcher 3.552 s, §3.4). T4-181 đã nhận cờ trong ~2' (poll #31 00:18:40Z).

### §3.2. Cờ #97 — KHÔNG CÓ (KHÔNG bù được — quy tắc đứng như #93)

- **#97 (9e440707-028c-4102-9d14-b119b5b4e136, btime 23:02:47Z, epoch 1795474967 — T7-180 xác minh 9 nguồn; số hiệu CHỜ T0-181):** sống **576 s** (23:02:47Z → 23:12:23Z).
- **Vì sao không có cờ:** (1) watcher-180 pid 8767 chết theo #97 — poll cuối 23:03:16Z (+29 s, F-181-T5-1), 0 dòng END/STOP/NEWBOOT; (2) **trigger repair sớm nhất là boot+900 s — #97 chết ở boot+576 s, trigger không bao giờ tới**; (3) **không còn bằng chứng replay nào**: dpkg.log/history/term.log của #97 đã mất theo rootfs rebuild khi sang #98 (dpkg.log hiện tại chỉ có 2 dòng heal #98 + 802 dòng repair #98; /var/log/apt lúc T5 mở KHÔNG TỒN TẠI); (4) không postboot check nào chạy trên #97 (T4/T2 viết cờ 21:29–21:30Z là trên #96, trước #97).
- **T5-181 KHÔNG viết cờ hồi tố** (quy tắc đứng — giống #87/#88/#91/#93). **Tổng boot không cờ: 20 → 21** (#97 + #93, #91, #87, #88, #83, #82 + 14 boot #51/#53/#54/#55/#57/#60/#63/#66/#68/#71/#72/#73/#76/#78).

### §3.3. Cờ #96 / #95 / #92 / #90 / #89 / #86 / #85 / #84 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #96 (8d2a69df) | round180-t5/POSTBOOT_PASS, 22:08:08Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 180 CÓ caveat; **mtime KHÔNG ĐỔI** (md5 50869e4e) |
| #95 (95b483a2) | round180-t5/POSTBOOT_PASS-95b483a2, 20:59:47Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 180 KHÔNG caveat; mtime KHÔNG ĐỔI |
| #92 (985bc2a3) | round178-t5/POSTBOOT_PASS, 11:53:41Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 178 KHÔNG caveat |
| #90 (94247dfa) | round177-t5/POSTBOOT_PASS, 08:51:55Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 177 CÓ caveat |
| #89 (15618ce8) | round176-t5/POSTBOOT_PASS, 05:42:19Z | replay, poll=0, KHÔNG caveat |
| #86 (70b7f7ee) | round175-t5/POSTBOOT_PASS, 02:40:29Z | replay, poll=0 |
| #85 (3c704685) | round174-t5/POSTBOOT_PASS, 23:46:57Z | repair-tay, poll=1 |
| #84 (4ae2d2ea) | round173-t5/POSTBOOT_PASS, 21:27:05Z | repair, poll=1 |

### §3.4. Watcher-180 (2 phiên bản pid) — CẢ HAI ĐỀU CHẾT theo reboot

- **Phiên 1, pid 109083** (spawn 20:59:47Z trên #95): 155 poll; poll cuối **21:21:20Z, +24 s sau btime #96** (mẫu overlap thứ 12, F-180-T8-1 — T5-180 ghi 21:20:50Z là sai giờ, T8-180 đã đính chính bằng log dòng 49). Chết theo #96.
- **Phiên 2, pid 8767** (T8-180 respawn 21:52:39Z trên #96 — F-180-T8-1, parent CHẤP NHẬN (c) đợt 180): EARLY-REPAIR → cờ #96 22:08:08Z; poll cuối **23:03:16Z, +29 s sau btime #97** (mẫu overlap thứ 13, **F-181-T5-1**); 0 dòng END/STOP/NEWBOOT. Chết theo #97.
- Log watcher-180: **168 dòng** (phiên 1: dòng 1–49; phiên 2: dòng 50–168, START 21:52:39Z → poll cuối 23:03:16Z).

### §3.5. Watcher-181 (boot #98) — ĐANG CHẠY, đã làm xong nhiệm vụ chính

- Spawn 23:59:08Z, pid **200203**, boot e62eef3f, hạn 02:35:00Z 24/11. Khởi tạo: dpkg 2 dòng, md5 30148a3b, mtime 23:13:00Z, cache 0, lists 3, gst_sys 0.
- **EARLY-REPAIR TRIGGER poll đầu 23:59:08Z** (boot_age 2.805 s, frozen 2.768 s, dpkg 2) → verify form-B exit=1 (23:59:09Z) → `--repair` exit=0 → COPIED apt log → poll1 exit=0 → **FLAG-WRITTEN 00:16:31Z** (repair, poll=1).
- **Poll sau cờ đều 30 s** (00:16:31Z → 00:20:02Z lúc kiểm — dpkg 804, md5 29c29216, gst 269, cache 111, lists 75, 0 proc, không đổi). Watcher vẫn ALIVE lúc T5 đóng; hạn 02:35:00Z 24/11 — T5-182 tiếp quản; nếu reboot mới (#99), spawn watcher mới theo mẫu.

---

## §4. Boot #97/#98 + F-181-T5-1 + F-177-T5-3 + F-178-T7-4 + gap kiểm lại độc lập

### §4.1. Boot #98 (e62eef3f) + #97 (9e440707) — số thô (T7-180 đã xác minh 9 nguồn)

- #98: boot_id đầy đủ `e62eef3f-9a53-4d67-8a8b-7077ee917156`; btime **23:12:23Z** (epoch 1795475543 — /proc/stat); `uptime -s` 23:12:23Z (khớp, theo T7-180); /proc/1 mtime 23:12:34.84Z (+11,84 s); journal chỉ idx 0 (first entry 23:12:35Z); `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- #97: boot_id đầy đủ `9e440707-028c-4102-9d14-b119b5b4e136`; btime **23:02:47Z** (epoch 1795474967 — /proc/stat, theo T7-180); T7 phát hiện trong ~42 s sau btime (kiểm đầu 23:03:29Z; sleep T7 bị SIGTERM — F-180-T7-2).
- **Gap #96→#97 = 6.111 s**; **gap #97→#98 = 576 s**; **gap #95→#96 = 7.834 s** (kiểm lại — khớp T0-180/T7-180). Gap 576 s **ngắn bất thường** (lần đầu <1.000 s trong chuỗi #93–#98; mẫu ~2h là 6–8k s) — nguyên nhân chưa xác định, host-side (nợ §8).
- **Số hiệu #96/#97/#98 CHỜ T0-181 xác minh 9 nguồn** — T7-180 đã xác minh 9 nguồn cả ba trong phiên (T5 chỉ trình số thô, khớp T7: boot_id, btime, gap).
- **T5 KHÔNG phán (m)** — thuộc T2-181 + parent. Số thô (T7-180): **(m) #96 +41,129 s / #97 +39,441 s / #98 +37,030 s — DƯƠNG ỨNG VIÊN (sơ bộ), TRONG dải, KHÔNG sát biên** (cửa hẹp #97 bị #98 cắt ở +576 s).

### §4.2. F-181-T5-1 (mới) và chuỗi mẫu overlap poll-cuối-sau-btime

Watcher-180 pid 8767 đọc được boot_id cũ 29 s sau btime mới (đã giải thích ở F-172-T5-1). Mẫu thứ 13 — chuỗi **11 → 20 → 23 → 9 → 8 → 36 → 7 → 3 → 17 → 22 → 26 → 24 → 29 s**; poll cuối 23:03:16Z, boot 8d2a69df, dpkg/md5 khớp #96 (804/b7a96b8f); poll trước 23:02:45Z, trước btime 2 s. **Không ảnh hưởng verdict.** **Đính chính T5-180:** poll cuối pid 109083 là **21:21:20Z (+24 s)**, không phải 21:20:50Z — T8-180 đã đính chính ở §o8 (mẫu 12); T5-181 xác nhận lại bằng log dòng 49. **Watcher-181 chưa có mẫu overlap** (spawn trên #98, chưa gặp reboot mới — T5-182 ghi nhận nếu có).

### §4.3. F-177-T5-3 vẫn đúng (không kiểm lại đợt này)

`who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T5 dùng **epoch /proc/stat làm chuẩn**; T0-181 làm rõ bằng 9 nguồn. Ghi nhận lần 5 (#90, #92, #94, #95, #98 — lần này không chạy `who -b`, chỉ nhắc lại quy tắc).

### §4.4. F-178-T7-4 — ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start

- **Phía infra T5-181 (không phán DB):** daemon hatch trên #98 pid 67 start **23:12:34Z (boot+12 s)** — boot OS mới → daemon mới → gen mới; gen cụ thể thuộc T0/T7 (T7-180 ghi gen #98 là 473f9460…).
- **F-178-T7-4 ĐÓNG ở mức T5/T0** — trigger restart daemon vẫn là nợ host-side (không bắt buộc — bằng chứng trong cell đã hết, cùng nguyên tắc quyết (k) đợt 174).

---

## §5. Replay #98 ĐÌNH TRỆ + repair + ledger

### §5.1. Replay #98 ĐÌNH TRỆ — heal 2 dòng rồi chết đứng — repair sớm (h)

- **Hoạt động:** heal `dpkg --configure -a` **23:12:59Z (boot+36 s)** viết 2 dòng "startup packages configure" (23:12:59–23:13:00Z) rồi **ĐÌNH TRỆ** — 0 hoạt động apt/dpkg nào sau đó (0 proc lúc T5 mở ~23:58Z, đóng băng 2.768 s lúc trigger). **GIỐNG #96** (heal boot+41 s, 2 dòng, đình trệ → repair) và **KHÁC #95** (replay đầy đủ boot+39 s → 1.545 dòng, không repair).
- **dpkg.log sau repair: 804 dòng** (2 dòng heal 23:12:59–23:13:00Z + 802 dòng repair 00:16:28–00:16:30Z; 114 "status installed", 233 "configure"; mtime 00:16:30Z; md5 29c29216). **apt history: 1 transaction** (repair); **term.log 0 lỗi** (grep error|failed = 0). Cache 0 → **111 .deb**; lists 3 → **75**.
- **Form-B (T5 verify tay TRƯỚC khi spawn watcher, check-only):** postboot 23:58:35Z **exit=1** — PASS wrapper K1; **FAIL libs 5/5** (thiếu libevent/libEGL/libavif/libdw/libevdev); **FAIL GST** (thư mục plugin không tồn tại, 0 file hệ thống, debroot 269); **FAIL apt 11/11**. Log `t5-postboot-verify-formB-e62eef3f.log` (chỉ đọc, không chạm dpkg).
- **Repair (watcher tự chạy, 23:59:08Z → 00:16:31Z = 17m23s):** apt-get update ~17' (chậm hơn #96 ~13' — mirror chậm; timeout 1500 s KHÔNG chạm); install 11 gói; GST symlink lại → debroot (269 file). **Kết quả postboot poll1 (00:16:31Z, exit=0):** PASS wrapper/libs/GST/apt — **11/11 gói NEED** + 5/5 lib (verify độc lập khớp); GST 269=269 symlink; **tools CHƯA cài** (khác #95); **libc-bin 2.39-0ubuntu8.9** (dấu repair — = #96/#94/#90, khác #95/#92 replay 8.12).
- **Phiên bản gói:** Y HỆT #89/#92/#96 (good 1.8, bad 1.4, ugly 1build1, -base 0.7, libav 1build1, -gl 0.7, libgstreamer1.0-0 0.2, libevent 2.1.12-9ubuntu2.2, libavif16 1.0.4, libevdev2 1.13.1) — **chỉ libc-bin khác theo mode: replay → 8.12, repair → 8.9** (mẫu rõ qua 4 boot).
- **F-174-T5-6 KHÔNG áp dụng ở #98** — replay đình trệ (không chạy), repair sớm (h) đã xử lý; không phải replay một phần.

### §5.2. Ledger (F-181-T5-2 — cùng họ F-174-T5-2 → F-180-T5-2)

- ledger.jsonl lúc T5 mở (mtime 23:13:21Z, #98 boot+58 s): **1 dòng, 3.040 B** — ts **1795471687 = 2026-11-23 22:08:07Z** (repair #96), **compacted=true, added 170, removed 0** — **ts MANG SANG #98 NGUYÊN VẸN, chỉ mtime đổi** (giống F-179-T5-2; khác F-180-T5-2 gộp).
- Sau repair #98 (00:16:31Z): **2 dòng, 4.949 B** — dòng 1 giữ nguyên (ts 1795471687, compacted, added 170); dòng 2 MỚI ts **1795479391 = 2026-11-24 00:16:31Z, added 106, removed 0**. **106 gói dòng 2 LÀ TẬP CON của 170 gói dòng 1** (python set: subset=True, giao 106, hợp 170) — giống hệt trạng thái sau repair #94 (2 dòng, 4.949 B).
- **F-181-T5-2 (mới):** hook post-invoke **APPEND dòng mới khi repair, COMPACT khi replay đầy đủ** — repair #98 append (2 dòng), replay #95 đã compact (1 dòng). Không ảnh hưởng số đếm; T2/T10 không nhầm ts với boot, không đếm nhầm 106 gói repair #98 thành 2 lần (hợp vẫn 170).
- `dpkg-state.txt`: **784 dòng lúc mở → 890 dòng, 45.792 B, mtime 00:16:31Z** (reseed trong repair #98; 890 = ĐÚNG số sau repair #94 — mẫu repair ổn định).

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (repair duy nhất do watcher; T5 không probe tay chạm dpkg)

- T5-181 **KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** — 0 lần configure/install/update/repair tay. Watcher-181 repair **1 lần duy nhất** trên #98 (guard file `repaired-e62eef3f`), đúng chiến lược (h) quyết parent đợt 150: boot+15' + đóng băng ≥600 s + 0 proc + dòng <100.
- **Thứ tự an toàn:** form-B tay 23:58:35Z chạy lúc replay đã đình trệ từ 23:13:00Z (0 proc apt/dpkg) — chỉ đọc (đã kiểm script: `apt-get update` chỉ chạy trong nhánh `--repair`, dòng 756+; check-only không chạm apt/dpkg). Watcher trigger repair 23:59:08Z lúc **T4-181 đang gate0wait** (poll-wait-t4-181.sh chạy từ 23:56Z, chưa attempt — chưa có gate (a) #98) — repair lúc này là ĐÚNG chiến lược (h): tạo gate (a) cho T4. T4 nhận cờ trong ~2' (poll #31 00:18:40Z).
- **Verify độc lập 00:20Z** chạy lúc T4-181 đã vào attempt (poll #32 00:19:26Z, X197 đã spawn) — **chỉ đọc** (postboot check-only + dpkg-query + ldconfig + ls), không giữ lock dpkg, không phải script nặng — **0 VI PHẠM F-175-T4-2 phía T5**. Chuỗi 0 vi phạm phía T5 giữ từ đợt 179.
- **Hướng (3) đứng lần thứ 28** (§2). G1 chờ user (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (0 thử lần thứ 35 — theo T9 đợt 180). File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 181: script postboot không đổi từ đợt 176; log poll1 + independent #98 có dòng đầu là dòng live mới (`[postboot 2026-11-23 23:12:23] boot=...`), rồi PASS wrapper/libs/GST/apt + KẾT LUẬN, exit=0 — dòng DOT-151 cứng KHÔNG còn xuất hiện.
- F-175-T5-3 **ĐÓNG từ đợt 176, vẫn đóng** — không sửa thêm file nào đợt này. (Lưu ý: các dòng log watcher cho `--repair`/`COPIED` mang timestamp trigger 23:59:08Z vì script echo `$ts` chụp ở đầu vòng lặp; timestamp hoàn tất lấy từ poll1/FLAG-WRITTEN — theo sửa F-152-T5-3.)

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #98 (giao T9):** MemAvailable dao động mạnh — **925 / 652 / 1.311 MB** (3 điểm: 23:59:29Z / 00:04:53Z / 00:19:41Z; MemTotal 8.124.900 kB). 652 MB lúc apt update đang chạy là thấp; 1.311 MB sau repair là cao nhất — diễn biến đầy đủ thuộc T9-181.

**ENOSPC #98 (T9 đếm chính thức):** **40 dòng lúc 23:59Z → 58 dòng lúc 00:19:41Z** ("No space left on device" trong journal boot hiện tại; grep "inotify" cũng 58 — đều là inotify_add_watch). Tăng ~18 trong ~20' (≈0,9 dòng/phút, cùng tốc độ #94/#95 ~1 dòng/phút). Disk còn 7,4 GB trống — ENOSPC không phải do disk đầy. inotify: max_user_watches **63.747**, max_user_instances 128.

**X11:** **Trống lúc mở (23:58Z)** — 0 Xvfb. **X197 xuất hiện 00:19Z** — T4-181 spawn X sau khi nhận cờ #98 (poll #31 00:18:40Z). T5 KHÔNG dọn socket luồng khác; giao T8-181 theo checklist (o) nếu cần.

**Journal #98:** chỉ idx 0 duy nhất (boot e62eef3f); first entry 23:12:35Z.

---

## §8. Nợ mở chuyển đợt 182

1. **(m) #96/#97/#98** — T2-181 + parent quyết (sơ bộ +41,129 / +39,441 / +37,030 s, TRONG dải; cửa hẹp #97 bị #98 cắt ở +576 s — phân biệt requeue theo boot_gen).
2. **INSIDE #96 (FULL142) + #97 (FULL143) + #98 (FULL144)** — T2-181.
3. **Số hiệu #96/#97/#98** — T0-181 xác minh 9 nguồn (T7-180 đã xác minh 9 nguồn cả ba).
4. **Cờ #98 (repair, poll=1, CÓ caveat, 00:16:31Z)** — parent quyết §9(c). **Cờ #97 KHÔNG CÓ** — parent ghi nhận (tổng boot không cờ 20 → 21)?
5. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 26 thuộc T2-181; U file-gap max 8.968 s).
6. **(m) #56 lần 24** — T2-181.
7. **Balloon trên #98** — T9-181 (E-208 kết cục; E-209 nếu ghim tiếp trên #98).
8. **Watcher-181 vẫn chạy trên #98** (pid 200203, hạn 02:35:00Z) — T5-182 tiếp quản; nếu reboot mới (#99), spawn watcher mới theo mẫu.
9. **Prune lần 57** — T6-182 (F-147-T6-1 chuỗi VẪN 0 lần thứ ba liên tiếp — theo T6-181).
10. **Run 180 kết cục** — T7-181 (viết lại ×3 tại #96/#97/#98; hạn 23:35:51Z). **Run 181 kết cục** — T7-182.
11. **#96/#97/#98 có giết holder không** — T6-181: KHÔNG giết cả ba (chuỗi mới = 3 nếu parent tính tiếp).
12. **F-181-T5-1 (overlap +29 s, mẫu 13)** — ghi nhận, không đổi verdict (m).
13. **F-181-T5-2 (ledger: boot touch mtime giữ ts + repair append dòng 2 ts 1795479391 added 106 ⊆ 170)** — ghi nhận; T2/T10 không đếm nhầm 106 gói.
14. **F-180-T9-3 (sampler cuối #95 muộn hơn btime #96 18 s)** — giao T0-181; T5 chỉ ghi nhận CF nhanh hơn local ~1–2 s.
15. **Gap #97→#98 = 576 s ngắn bất thường** — nguyên nhân chưa xác định (host-side); lần đầu gap <1.000 s trong chuỗi #93–#98.
16. **T2-182/T4-182:** không chạy script nặng / không probe dpkg trong cửa sổ attempt (B4 đứng; chuỗi 0 vi phạm phía T5 giữ từ đợt 179).
17. **RAM #98 dao động mạnh (652–1.311 MB trong 20')** — T9-182 theo dõi.
18. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
19. **Vì sao replay #98 đình trệ trong khi #95 replay đầy đủ?** — nếu T0/T7/T9 tìm ra thì ghi GAP, không thì chuyển nợ host-side (quyết (k) đợt 174).
20. **HB 00:20:50Z + DR 01:00Z/02:00Z** — T7-181.
21. **Plan B B1 (bọc resetPlayhead0)** — T8-181 triển khai + kiểm live (quyết (j) đợt 180); **F-178-T8-6: DỪNG**; **H3** chỉ giám sát thụ động.
22. **F-181-T1-1 (aggregate 180 §10.3 "quét 1.335 file" — đúng là 1.336)** — T1-181 ghi nhận, KHÔNG tự sửa — giao parent quyết; nếu duyệt, T1-182 sửa + stage.

---

## §9. Đề xuất cho parent (quyết ở aggregate 181)

**(a) Chấp nhận verdict đợt 181?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #98 đã có (repair, poll=1, CÓ caveat, verify độc lập exit=0), #96 VẪN CÓ, #97 KHÔNG CÓ đã giải thích (không bù được), watcher-181 chạy tốt, F-178-T7-4 đã làm rõ, F-175-T5-3 vẫn đóng, hướng (3) lần 28, marker 47 reboot (chờ T0 xác nhận #96–#98 → 50), 0 vi phạm B4 phía T5.

**(b) Cờ #97 KHÔNG CÓ — T5 đề xuất parent ghi nhận KHÔNG bù** (chết ở boot+576 s, trước trigger repair boot+900 s; không watcher, không postboot check, không bằng chứng replay nào còn lại; tổng boot không cờ 20 → 21) — tiền lệ #93.

**(c) Cờ #98 (repair, poll=1) — CÂU HỎI QUYẾT:** Watcher-181 EARLY-REPAIR → postboot poll1 exit=0 trên boot SỐNG (log `t5-postboot-poll1-e62eef3f.log`), T5 verify độc lập check-only exit=0 (`t5-postboot-independent-e62eef3f.log`), 11/11 NEED + 5/5 lib + GST 269=269 symlink + libc-bin 8.9. **Parent chọn 1 trong 2:**
- (c1) Chấp nhận cờ #98 đứng cho gate (a) **CÓ caveat repair** — tiền lệ #96/#94/#90 (poll=1);
- (c2) Không chấp nhận (T5 không thấy căn cứ — repair đủ 11 gói, 1 transaction, 0 lỗi, verify độc lập khớp; GST symlink + tools chưa cài là cùng caveat như #96 đã chấp nhận).

**(d) #96 VẪN CÓ cờ (22:08:08Z, repair, poll=1, caveat — parent CHẤP NHẬN (c) đợt 180) + #95 VẪN CÓ (replay, poll=0, KHÔNG caveat) — mtime cả hai KHÔNG ĐỔI — chấp nhận?**

**(e) Xác nhận số hiệu boot #96/#97/#98 (T0-181, 9 nguồn — T7-180 đã xác minh 9 nguồn cả ba; T5 chỉ trình số thô) — parent chấp nhận?**

**(f) F-181-T5-1 (overlap +29 s, mẫu 13) + F-181-T5-2 (ledger append dòng 2 ts 1795479391 added 106 ⊆ 170; boot touch mtime giữ ts) + F-177-T5-3 (who -b chỉ cho phút, lần 5) — ghi nhận, không đổi verdict (m). Đính chính T5-180: poll cuối pid 109083 là 21:21:20Z (+24 s, mẫu 12), không phải 21:20:50Z (T8-180 đã đính chính).**

**(g) F-178-T7-4 ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start — parent ghi nhận?** Phía infra T5: daemon #98 pid 67 start boot+12 s; gen mới thuộc T0/T7.

**(h) Watcher-181 vẫn chạy trên #98** (pid 200203, hạn 02:35:00Z) — T5-182 tiếp quản; nếu reboot mới (#99), spawn watcher mới theo mẫu.

**(i) Replay #98 đình trệ (heal 2 dòng rồi đứng) — parent có muốn điều tra host-side không?** Bằng chứng trong cell: heal khởi động boot+36 s rồi 0 hoạt động — không manh mối vì sao đình trệ trong khi #95 replay đầy đủ. Theo quyết (k) đợt 174, điều tra host-side KHÔNG bắt buộc — T5 đề xuất áp dụng cùng nguyên tắc cho #98, trừ khi parent quyết khác.

---

## §10. Sai số của chính T5-181 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-181-T5-1** | Poll cuối watcher-180 pid 8767 SAU btime #97 **29,0 s** (mẫu 13: 11→20→23→9→8→36→7→3→17→22→26→**24**→**29 s**) | Ghi nhận | Không ảnh hưởng verdict; poll duy nhất sau btime vẫn thuộc boot cũ (804/b7a96b8f khớp #96) |
| **F-181-T5-2** | Ledger: (a) boot #98 viết lại mtime 23:13:21Z giữ nguyên ts 1795471687; (b) repair #98 append dòng 2 (ts 1795479391, added 106) → 2 dòng, 4.949 B | Ghi nhận | Không ảnh hưởng số đếm (106 ⊆ 170, hợp 170); T2/T10 không đếm nhầm 106 gói |
| — | Cờ #98 ghi ở boot+1h04m08s (muộn vì không watcher nào sống trước 23:59:08Z) | Ghi nhận | Repair chỉ 17m23s (trigger→cờ); cờ muộn vì khoảng không-watcher 3.552 s — mode vẫn repair, poll=1 |
| — | apt-get update repair #98 mất ~17' (chậm hơn #96 ~13') | Ghi nhận | Mirror chậm, cùng mẫu #47; timeout 1500 s không chạm |
| — | Đồng hồ: CF nhanh hơn local ~1–2 s (2 lap: ~1 s, ~2 s) | Ghi nhận | Có thể gồm ~1 s trễ curl; F-180-T9-3 (lệch 18 s) giao T0-181 |
| — | Stats chỉ đo RAM 3 điểm thay vì diễn biến đầy đủ | Hạn chế nhỏ | T5 đóng sớm (cờ xong 00:16:31Z); diễn biến RAM đầy đủ thuộc T9-181 |
| — | Đính chính T5-180: poll cuối pid 109083 là 21:21:20Z, không phải 21:20:50Z | Đính chính | T8-180 đã đính chính ở §o8 (mẫu 12); T5-181 xác nhận bằng log dòng 49 |
| — | T5-181 mở muộn (~23:58Z, 22' sau khi đợt mở 23:35:51Z) | Ghi nhận | Không ảnh hưởng verdict: cờ #98 ghi trước hạn cờ ~02:00Z hơn 1,5 giờ; watcher spawn ngay sau form-B |

**Số liệu chính thức lấy từ log watcher-180/181 + log trực tiếp (form-B/poll1/independent) + dpkg/history/term.log của #98 + đối chiếu T7-180.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND181_T5_INFRA_LIMITS.md` (file MỚI, không sửa file repo nào đợt này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round181-t5-infra.txt` (NUL-delimited, 1 entry; đã verify bằng read-back `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round181-t5/` (theo mẫu T5-171–180): watcher script/log, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–181: đợt 166–180 = 150 batch / 217 entry / 198 file (quyết (r) đợt 180) + đợt 181 (1 file này, file MỚI; các T khác chưa tính lúc T5 đóng) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-181 (bản chính, 23:58Z 23/11 – 00:24Z 24/11)

```
=== PHU LUC SO LIEU T5-181 (trich log truc tiep) ===
boot_id #98=e62eef3f-9a53-4d67-8a8b-7077ee917156
btime_epoch #98=1795475543 = 2026-11-23T23:12:23+00:00 (who -b: khong kiem dot nay — chi toi phut, F-177-T5-3)
boot_id #97=9e440707-028c-4102-9d14-b119b5b4e136
btime_epoch #97=1795474967 = 2026-11-23T23:02:47+00:00 (T7-180 xac minh 9 nguon)
boot_id #96=8d2a69df-2471-4349-b5a1-aa340da85c01
btime_epoch #96=1795468856 = 2026-11-23T21:20:56+00:00 (T7-180 xac minh 9 nguon)
gap #95->#96 = 7834 s; gap #96->#97 = 6111 s; gap #97->#98 = 576 s (NGAN BAT THUONG)

--- replay-watch-180.log (round180-t5, 168 dong, 155 poll) ---
pid 109083: poll cuoi=2026-11-23T21:21:20Z boot=95b483a2 dpkg_lines=1545 md5=433be629 (+24 s sau btime #96 — mau 12, F-180-T8-1; dinh chinh T5-180)
pid 8767 (T8 respawn 21:52:39Z): EARLY-REPAIR TRIGGER 21:52:39Z boot_age=1903s frozen=1862s dpkg_lines=2; FLAG-WRITTEN 22:08:08Z mode=repair-som-quyet-h poll=1 (old=95b483a2)
poll cuoi=2026-11-23T23:03:16Z boot=8d2a69df dpkg_lines=804 md5=b7a96b8f (F-181-T5-1 = +29 s sau btime #97); 0 dong END/STOP/NEWBOOT

--- replay-watch-181.log (round181-t5) ---
START 2026-11-23T23:59:08Z pid=200203 boot=e62eef3f btime=23:12:23Z end=2026-11-24T02:35:00Z
init_lines=2 init_md5=30148a3b init_mtime=23:13:00Z cache=0 lists=3 gst_sys=0
EARLY-REPAIR TRIGGER 23:59:08Z boot_age=2805s frozen=2768s dpkg_lines=2
verify form-B exit=1 (hoan tat 23:59:09Z, cho exit=1)
--repair exit=0; COPIED /tmp/l8-postboot-apt.log -> t5-postboot-repair-apt-e62eef3f.log
postboot poll1 exit=0 dpkg_lines=804 cache=111 lists=75 (hoan tat 2026-11-24T00:16:31Z)
FLAG-WRITTEN 00:16:31Z mode=repair-som-quyet-h poll=1 (old=8d2a69df)

--- 3. POSTBOOT_PASS ---
round181-t5/POSTBOOT_PASS: CO mtime=2026-11-24 00:16:31 +0000 bytes=324
round181-t5/POSTBOOT_PASS-8d2a69df: CO (backup #96, md5 50869e4e = goc round180-t5)
round180-t5/POSTBOOT_PASS (#96): CO, mtime=2026-11-23 22:08:08 +0000 bytes=324 md5=50869e4e (KHONG DOI)
round180-t5/POSTBOOT_PASS-95b483a2 (#95): CO, mtime=2026-11-23 20:59:47 +0000 bytes=315 (KHONG DOI)
round180-t5/POSTBOOT_PASS-ae2a9a47 (#94): CO, mtime=2026-11-23 20:59:47 +0000 bytes=324 (KHONG DOI)
KHONG CO file POSTBOOT_PASS nao nhac 9e440707 (#97) — da grep round18* (xem §3.2)

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47Z

--- 5. dpkg/cache/lists/GST (boot #98, repair som) ---
dpkg_lines=804 md5=29c29216 mtime=2026-11-24 00:16:30 +0000 (2 dong heal 23:12:59-23:13:00Z + 802 dong repair 00:16:28-00:16:30Z)
cache_deb=111 lists_entries=75
gst_sys_files=269 (SYMLINK -> debroot, khong thu muc that — GIONG #96/#94, KHAC #95) gst_sys_is_link=CO
apt_history_transactions=1 (repair); term_log_errors=0
heal #98: 23:12:59Z (boot+36s, 2 dong) roi DINH TRE; repair trigger 23:59:08Z (boot+2805s); poll1 xong 00:16:31Z (boot+3848s)

--- 6. 11 goi NEED + 5 lib + tools + ledger ---
11/11 install ok installed (NEED); gstreamer1.0-tools KHONG CAI; gst-inspect-1.0: command not found
5/5 lib CO; versions: good 1.8, bad 1.4, ugly 1build1, -base 0.7, libav 1build1, -gl 0.7, libc-bin 2.39-0ubuntu8.9 (repair; #95/#92 replay: 8.12)
ledger luc mo: 1 dong, ts 1795471687 (compacted, added 170, removed 0), mtime 23:13:21Z (F-181-T5-2a: mang nguyen ts, chi doi mtime)
ledger sau repair: 2 dong, 4949 B — dong1 ts 1795471687 compacted added 170; dong2 ts 1795479391 (00:16:31Z) added 106 (subset cua 170, hop 170) (F-181-T5-2b)
dpkg-state.txt: 784 dong luc mo -> 890 dong, 45792 B, mtime 00:16:31Z (sau repair #94: 890 dong — mau repair on dinh)

--- 7. ENOSPC --- 40 dong (23:59Z) -> 58 dong (00:19:41Z) "No space left on device" (journal boot #98; grep inotify cung 58); ~0,9 dong/phut; disk con 7,4 GB trong
--- 8. RAM --- MemAvailable 924612 / 651636 / 1310932 kB (23:59:29Z / 00:04:53Z / 00:19:41Z); MemTotal 8124900 kB
--- 9. Huong (3) --- user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; crontab not found; timers_vcut=0
--- 10. X11 --- TRONG luc mo (23:58Z); X197 xuat hien 00:19Z (T4-181 spawn X sau co)
--- 11. T4-181 --- gate0wait tu 23:56Z (poll-wait pid 184190); poll #31 00:18:40Z t5flag=PASS postboot_exit=0 gate0=T5 dpkg 804; poll #32 00:19:26Z; X197 00:19Z — T4 dang vao attempt
--- 12. Daemon --- hatch pid 67 start 23:12:34Z (boot+12s) — gen moi thuoc T0/T7 (F-178-T7-4); /proc/1 mtime 23:12:34.84Z (boot+11,84s)
```
