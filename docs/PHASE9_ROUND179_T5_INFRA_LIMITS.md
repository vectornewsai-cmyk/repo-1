# PHASE 9 — ROUND 179 — T5 INFRA LIMITS

**Đợt:** 179 (mở lượt cron 17:35:51Z 23/11/2026 = 00:35:51 +07 24/11; hạn cờ ~20:00Z, hạn cứng ~20:35Z; T5 đóng ~18:24Z — sớm, cờ đã xong 18:03:08Z).
**Người viết:** T5-179. **Ngày:** 23/11/2026. **Boot làm việc lúc đóng:** #94 XÁC NHẬN (T0-179, 9 nguồn) ae2a9a47, btime 17:17:09Z (epoch 1795454229, theo /proc/stat).
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #94 (repair-sớm-quyết-h, poll=1, CÓ caveat repair — §3.1) + #93 KHÔNG CÓ cờ ĐÃ XÁC NHẬN + KHÔNG sửa file repo nào đợt này. File này là 1 entry stage duy nhất đợt 179 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #94 (ae2a9a47, btime 17:17:09Z) | **ĐÃ CÓ 18:03:08Z (boot+45m59s, repair-sớm-quyết-h, poll=1)** — watcher-179 EARLY-REPAIR → --repair exit=0 → poll1 exit=0; verify độc lập exit=0; 11/11 gói NEED + 5/5 lib; GST 269=269 **qua symlink debroot (vá tạm K1 — KHÁC #92: thư mục thật)**; **tools CHƯA cài**; libc-bin 8.9 (= #90). **CÓ caveat repair** (tiền lệ #90/#85) |
| Repair #94 | **Trigger poll đầu 17:49:58Z** (boot_age 1.969 s, frozen 856 s, dpkg 2 dòng); update ~12m56s (1 mirror InRelease fail, bỏ qua — xem §5.1); install 18:02:54–18:03:07Z (13 s, 1 transaction); dpkg 2 → **795 dòng** (= #90 repair); history 1 transaction; term.log 0 lỗi |
| Replay #94 | **ĐÌNH TRỆ sau heal** — heal 17:35:42Z (boot+18m33s) rồi 0 hoạt động apt ~14', 0 proc apt/dpkg, 0 wrapper, cache 0, lists 5; cùng mẫu #90 — KHÁC #92 (replay đầy đủ) |
| POSTBOOT_PASS #93 (97054ac6) | **KHÔNG CÓ — ĐÃ XÁC NHẬN** (watcher-178 chết theo #93; 0 file POSTBOOT_PASS nhắc 97054ac6; không watcher nào sống trên #93; ledger mtime 09:43:19Z không đổi). Tổng boot không cờ: **19 → 20** |
| POSTBOOT_PASS #92 (985bc2a3) | **VẪN CÓ** (11:53:41Z, replay-đầy-đủ, poll=0 — parent CHẤP NHẬN (c) đợt 178 KHÔNG caveat); backup byte-identical trong round179-t5 (md5 b134dd93) |
| POSTBOOT_PASS #90 / #89 / #86 / #85 / #84 | **VẪN CÓ** (repair-sớm-quyết-h poll=1 / replay-đầy-đủ poll=0 / replay-đầy-đủ poll=0 / repair-tay poll=1 / repair-sớm-quyết-h poll=1); mtime không đổi |
| Reboot trong phiên | **#94 (ae2a9a47, btime 17:17:09Z, gap #93→#94 = 14.974 s = 4h09m34s — DÀI GẤP ĐÔI mẫu ~2h)** — xảy ra ~18' TRƯỚC khi đợt mở, trong khoảng scheduler im lặng (T7-179); **XÁC NHẬN (T0-179, 9 nguồn)** |
| Watcher-178 | pid **92180 CHẾT theo #93** (poll cuối 13:07:57Z, **+22 s sau btime #93, mẫu overlap thứ mười — F-179-T5-1**); 175 dòng, 170 poll |
| Watcher-179 | START 17:49:58Z, pid **61023**, hạn 20:35:00Z — **EARLY-REPAIR trigger poll đầu** (đúng chiến lược (h)); FLAG-WRITTEN 18:03:08Z; vẫn ALIVE lúc T5 đóng (poll ổn định dpkg 795) |
| Khoảng không-watcher | **~16.921 s = 4h42m01s** (poll cuối watcher-178 13:07:57Z → START watcher-179 17:49:58Z) — bao trọn đời #93 sau khi watcher chết + 32m49s đầu #94 (bằng chứng heal còn trong dpkg.log, khác #91) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 26 liên tiếp** (user@0 static, không linger, không cron, không /run/user/0, 0 timer VCut — loginctl vẫn no bus) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#94 = 46 reboot ĐÃ XÁC NHẬN** (T0-179 xác nhận #93 + #94) |
| ENOSPC | #94: **9 dòng (17:46Z) → 15 (17:54Z) → 26 (18:05Z)** (journal boot hiện tại; T9 đếm chính thức) |
| X11 | **Trống lúc mở (17:41Z) và lúc đóng (18:05Z)** — 0 Xvfb; T4-179 có gate (a) từ poll #26 18:03:29Z, chưa spawn X lúc T5 đóng |
| RAM #94 | MemAvailable dao động mạnh: **802 / 1.849 / 1.193 / 436 MB** (4 điểm, giao T9) |
| Đồng hồ | Local ≈ Cloudflare **−1 s** (CF nhanh hơn ~1 s; T0-179 đo ×4: +0,6…+1,1 s) |
| Quy tắc B4 | **T5-179 KHÔNG chạy probe chạm dpkg nào** (0 lần configure/install/update/repair tay) — repair do **watcher tự chạy** theo chiến lược (h) trong lúc T4 gate0wait. Form-B/independent đều check-only — xem §6.1 |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot không đổi; log poll1 + independent #94 in dòng live đầu tiên, không còn dòng DOT-151 cứng) |
| F-178-T7-4 | **ĐÃ LÀM RÕ (T0-179, appendix179 §H):** worker_boot_generation theo **daemon start**, KHÔNG phải OS boot — daemon restart 1 lần trên #92 giữa 11:09:06Z–11:35:51Z; trigger không xác định (host-side). Phía infra T5 (§4.4): daemon #94 pid 67 start 17:17:21Z (boot+12s); gen mới 32a2a7ed; không file infra nào trên đĩa lưu generation |
| T4-179 | Poller từ 17:44Z, gate0wait → **ĐÃ CÓ gate (a) từ poll #26 18:03:29Z** (t5flag=PASS, gate0=T5) |

**Số hiệu boot #94 XÁC NHẬN (T0-179, 9 nguồn); #93 XÁC NHẬN (T7-178 9 nguồn + T4-178 độc lập + T0-179 đối chiếu DB).**
**T5-179 KHÔNG phán (m), chỉ trình số thô — (m) #93/#94 thuộc T2-179 + parent quyết.**

---

## §1. Timeline (giờ Z, 23/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 11:01:27Z | Reboot #92 (985bc2a3 — T0-178 ĐÃ XÁC NHẬN 9 nguồn); gap #91→#92 = 6.827 s |
| 11:53:41Z | Cờ POSTBOOT_PASS #92 ghi (replay-đầy-đủ, poll=0); watcher-178 pid 92180 tiếp tục chạy |
| 13:07:35Z | **Reboot #93 (97054ac6, epoch 1795439255 — T7-178 xác minh 9 nguồn trong 64 s; T0-179 đối chiếu DB)**; gap #92→#93 = **7.568 s** |
| 13:07:57Z | **Poll cuối watcher-178** (+22 s sau btime #93 — F-179-T5-1); watcher chết theo #93 |
| 14:36:29Z | **Run 178 TIMEOUT** (T7-179: sau hạn 38 s; margin −38 s; cf 7 s; KHÔNG phải ca ≥60 s thứ mười — số ca GIỮ 9; viết lại ×1 tại #93) |
| 14:53:32Z | Run 17c51ba6 (tick 14:35:51Z, lượt closing T10-178) SUCCEEDED (jitter +38 s) |
| 15:15:35–17:35:39Z | **Scheduler im lặng** (T7-179: 0 run started; HB thiếu 15:50:50Z/16:20:50Z/16:50:50Z; DR thiếu 16:00Z/17:00Z) |
| 17:17:09Z | **Reboot #94 (ae2a9a47, epoch 1795454229 — T0-179 XÁC NHẬN 9 nguồn)**; gap #93→#94 = **14.974 s** (4h09m34s) |
| 17:20:50Z | HB 17:20:50Z started 17:35:40Z, jitter **+890 s — MUỘN MỚI** (muộn HB lũy kế 9 → 10; chuỗi 17 đợt vắng muộn mới ĐỨT — T7-179) |
| 17:35:42Z | Heal #94: dpkg.log 2 dòng configure (boot+18m33s); dpkg-state.txt reseed 784 dòng lúc 17:36:04Z |
| 17:35:51Z | Lượt cron đợt 179 mở; run 179 dispatch (jitter 0 s, boot_gen 32a2a7ed — T0-179) |
| ~17:41Z | **T5-179 mở trên #94**: replay ĐÌNH TRỆ (dpkg 2 dòng từ 17:35:42Z; 0 proc apt/dpkg; cache 0; lists 5; GST không tồn tại (debroot 269); `/var/log/apt/` CHƯA có; `/tmp/.X11-unix/` TRỐNG |
| 17:46:00Z | Form-B tay TRƯỚC khi spawn watcher: postboot check-only **exit=1** (FAIL libs 5/5, FAIL GST, FAIL apt 11 gói; PASS wrapper K1) |
| 17:49:58Z | **Watcher-179 START, pid 61023** (khoảng không-watcher ~16.921 s); poll đầu 0 proc, dpkg 2 dòng, frozen 856 s → **EARLY-REPAIR TRIGGER** (boot_age 1.969 s) → verify form-B exit=1 → `--repair` chạy |
| ~18:02:54Z | `apt-get update` của repair xong (~12m56s — 1 mirror InRelease fail, bỏ qua); install bắt đầu 18:02:54Z |
| 18:03:07Z | Transaction apt duy nhất xong (End-Date); dpkg đạt **795 dòng**, ổn định |
| 18:03:08Z | **Poll1 exit=0 → Cờ POSTBOOT_PASS #94 ghi (boot+45m59s, repair-sớm-quyết-h, poll=1)**; backup cờ #92 thành `POSTBOOT_PASS-985bc2a3` (byte-identical); ledger thêm dòng ts 1795456988 (added 106) |
| 18:03:29Z | T4-179 poll #26: gate0=T5 (cờ mới round179-t5/POSTBOOT_PASS) — T4 đã có gate (a) |
| ~18:04Z | T5 verify độc lập trên #94: **exit=0, 11/11 NEED + 5/5 lib, GST 269=269 qua symlink debroot, tools CHƯA cài** (log `t5-postboot-independent-ae2a9a47.log`) |
| ~18:24Z | T5 viết LIMITS này. Watcher-179 vẫn ALIVE (pid 61023, poll cuối 18:23:41Z ổn định). T4-179 gate0wait xong (poller chạy từ 17:44Z). 3 cờ round179 `.done` lúc T5 đóng (t0/t1/t6). |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 26 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở: `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không linger; không `/run/user/0`; không `crontab`; 0 timer VCut. Lần thứ 26 liên tiếp hướng (3) đứng. T5 KHÔNG dùng systemd user manager / timer — watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–178.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z). Marker sống qua **#49–#94 = 46 reboot ĐÃ XÁC NHẬN** (T0-179: 9 nguồn #94 + đối chiếu DB #93; 44 qua #92 + #93 + #94). T5 không có bằng chứng mới nào về cơ chế bảo toàn `~/.config` — không mở lại chủ đề.

**Đồng hồ (1 lap, 17:46:30–17:46:31Z):** local 17:46:30Z → CF `Date: Mon, 23 Nov 2026 17:46:31 GMT` — **CF nhanh hơn local ~1 s** (đợt 178 cũng ~1 s; T0-179 đo ×4: +0,624…+1,133 s). **Btime ghi bằng epoch nguyên**; gap tính bằng epoch nguyên — không dùng phân số.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #94 — ĐÃ CÓ (repair-sớm-quyết-h, poll=1) — CÓ caveat repair

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round179-t5/POSTBOOT_PASS`, 324 B, mtime 2026-11-23T18:03:08Z.
- Nội dung: `boot ae2a9a47-2de7-48ef-853d-0023b47bdc0b (btime 2026-11-23 17:17:09Z; watcher-179) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 66; postboot PASS poll1 exit 0 luc 2026-11-23T18:03:08Z; POSTBOOT_PASS moi ghi 2026-11-23T18:03:08Z poll=1 (repair-som-quyet-h); co cu 985bc2a3 luu POSTBOOT_PASS-985bc2a3`.
- Backup cờ cũ: `POSTBOOT_PASS-985bc2a3`, 315 B — **md5 b134dd93f09ff244681394fd6d08566e, byte-identical với file gốc round178-t5 (cờ #92)**.
- **Lịch trình (watcher tự làm, không tay):** START 17:49:58Z → poll đầu 0 proc + dpkg 2 dòng + frozen 856 s → **EARLY-REPAIR TRIGGER** (boot+15m đã qua; đúng chiến lược (h)) → verify form-B exit=1 → `--repair` exit=0 (update ~12m56s + install 13 s) → copy `/tmp/l8-postboot-apt.log` ra khỏi /tmp NGAY (F-173-T5-9, 53.697 B) → poll1 exit=0 (hoàn tất 18:03:08Z) → FLAG-WRITTEN cùng giây. KHÔNG trigger BACKSTOP.
- **Verify độc lập (T5, check-only):** postboot ~18:04Z **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 qua symlink → debroot** (vá tạm K1); **tools CHƯA cài** (khác #92: CÓ cài); **libc-bin 2.39-0ubuntu8.9** (= #90, khác #92 8.12).
- **CÓ caveat repair** (khác #92): GST chỉ là symlink tới debroot; dpkg 795 (không phải 1.545); tools chưa cài; install chỉ 106 gói thay vì 170 intent. **Parent quyết (§9(b))** — T5 đề xuất chấp nhận **CÓ caveat repair** (tiền lệ #90/#85). T4-179 đã có cờ từ 18:03:08Z (gate0=T5 từ poll #26 18:03:29Z).
- **F-173-T5-9 ĐÃ KÍCH HOẠT đợt này:** `/tmp/l8-postboot-apt.log` đã được copy thành `t5-postboot-repair-apt-ae2a9a47.log` (53.697 B, 715 dòng) NGAY sau --repair, trước poll1.

### §3.2. Cờ #93 — KHÔNG CÓ (ĐÃ XÁC NHẬN, không bù được)

| Bằng chứng | Kết quả |
|---|---|
| Watcher-178 pid 92180 | **CHẾT theo #93** (poll cuối 13:07:57Z; 0 dòng END/STOP/NEWBOOT; ps lúc T5 mở: không còn pid) |
| Cờ cho 97054ac6 | **0 file POSTBOOT_PASS nào nhắc 97054ac6** (grep đích danh `*/POSTBOOT_PASS*` — không hit) |
| Watcher khác trên #93 | Không có — T5-178 đã đóng trước #93 (12:03Z); không watcher nào spawn trong đời #93 (13:07:35–17:17:09Z); scheduler im lặng 15:15:35Z–17:35:39Z (T7-179) |
| Ledger / dpkg-state | Ledger mtime **09:43:19Z KHÔNG ĐỔI** suốt #93 (§5.2); dpkg-state.txt đã bị reseed trên #94 — không còn bằng chứng replay #93 |

**#93 là boot thứ 20 không cờ.** T5 KHÔNG viết cờ hồi tố (quy tắc đứng — giống #87/#88/#91). Quyết (c) đợt 178 đã ghi "POSTBOOT_PASS #93 CHƯA CÓ (T5-179 lo)" — T5-179 xác nhận: **KHÔNG CÓ**.

### §3.3. Cờ #92 / #90 / #89 / #86 / #85 / #84 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #92 (985bc2a3) | round178-t5/POSTBOOT_PASS, 11:53:41Z | replay-đầy-đủ, poll=0 — parent CHẤP NHẬN (c) đợt 178 KHÔNG caveat |
| #90 (94247dfa) | round177-t5/POSTBOOT_PASS, 08:51:55Z | repair-sớm-quyết-h, poll=1 — parent CHẤP NHẬN (c) đợt 177 CÓ caveat repair |
| #89 (15618ce8) | round176-t5/POSTBOOT_PASS, 05:42:19Z | replay-đầy-đủ, poll=0, KHÔNG caveat |
| #86 (70b7f7ee) | round175-t5/POSTBOOT_PASS, 02:40:29Z | replay-đầy-đủ, poll=0 |
| #85 (3c704685) | round174-t5/POSTBOOT_PASS, 23:46:57Z | repair-tay-T5, poll=1 |
| #84 (4ae2d2ea) | round173-t5/POSTBOOT_PASS, 21:27:05Z | repair-sớm-quyết-h, poll=1 |

**Mtime các cờ #92/#90/#89/#86/#85/#84 KHÔNG ĐỔI.** Tổng boot không cờ: **20** (#93 mới + 19 cũ: #91, #87, #88, #83, #82 + 14 boot #51/#53/#54/#55/#57/#60/#63/#66/#68/#71/#72/#73/#76/#78).

### §3.4. Watcher-178 (boot #92) — CHẾT theo #93 (đính chính nhiệm vụ)

- Spawn 11:43:08Z, pid **92180**, boot 985bc2a3, hạn 14:35:00Z. **175 dòng log, 170 poll**; poll đầu 11:43:09Z, **poll cuối 13:07:57Z**; 0 dòng END/STOP/NEWBOOT; dpkg {2 → 1.545}.
- **Đính chính:** watcher-178 KHÔNG sống tới hạn 14:35:00Z — đã chết theo **#93 (13:07:35Z)**, sớm ~1h27m (cùng mẫu watcher-177 chết theo #91). T5-179 KHÔNG tiếp quản được (đã chết trước khi đợt mở) — chỉ ghi nhận + xác nhận #93 không cờ.
- **Poll cuối 13:07:57Z — 22 s SAU btime #93 (F-179-T5-1)** — mẫu overlap thứ mười (xem §4.2). Chỉ 1 poll nằm sau btime #93 (poll trước đó 13:07:27Z, trước btime 8 s).

### §3.5. Watcher-179 (boot #94) — ĐANG CHẠY, đã làm xong nhiệm vụ chính

- Spawn 17:49:58Z, pid **61023**, boot ae2a9a47, hạn 20:35:00Z. Khởi tạo: dpkg 2 dòng, md5 54343a30, mtime 17:35:42Z, cache 0, lists 5, gst_sys 0.
- **EARLY-REPAIR trigger poll đầu 17:49:58Z** (boot_age 1.969 s, frozen 856 s — đúng chiến lược (h)). Verify form-B exit=1 → `--repair` exit=0 → copy log apt (F-173-T5-9) → poll1 exit=0 (18:03:08Z) → **FLAG-WRITTEN 18:03:08Z** (repair-som-quyet-h, poll=1).
- **Poll sau cờ đều 30 s** (18:03:38Z → 18:23:41Z — dpkg 795, md5 40abf79a, gst 269, cache 110, lists 66, 0 proc, không đổi). Watcher vẫn ALIVE lúc T5 đóng (42 poll lúc 18:23Z); hạn 20:35:00Z 23/11 — T5-180 tiếp quản; nếu reboot mới (#95), spawn watcher mới theo mẫu.

---

## §4. Boot #94 + F-179-T5-1 + F-178-T7-4 + gap kiểm lại độc lập

### §4.1. Boot #94 (ae2a9a47)

- boot_id đầy đủ `ae2a9a47-2de7-48ef-853d-0023b47bdc0b`; btime **17:17:09Z** (epoch 1795454229 — /proc/stat); `who -b` "Nov 23 17:17" (chỉ tới phút — F-177-T5-3, §4.3); `last reboot` 17:17, wtmp bắt đầu 17:17:20Z; journal chỉ idx 0 (first entry 17:17:20Z); `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- **Gap #93→#94 = 14.974 s** (1795454229 − 1795439255; btime #93 13:07:35Z — T7-178 xác minh 9 nguồn, T0-179 đối chiếu DB khớp). Gap này **dài gấp đôi** mẫu ~2h (6.243 / 7.031 / 6.827 / 7.568 s). **Gap #92→#93 = 7.568 s** (kiểm lại — khớp T7-178/T0-179).
- **Số hiệu #94 XÁC NHẬN** — T0-179 xác minh 9 nguồn (T5 chỉ trình số thô, khớp T0 từng số: boot_id, btime, uptime bracket, /proc/1 +11,378 s, journal +11,818 s, wtmp, CF ~+1 s).
- **T5 KHÔNG phán (m)** — thuộc T2-179 + parent. Số thô (T0-179): **0 requeue cửa rộng [17:17:09Z, 17:32:09Z] và 0 requeue cửa hẹp [17:17:42Z, 17:17:58,8Z] — KHÔNG CÓ ĐIỂM (m) CHO #94** (không run nào sống qua #94: run 17c51ba6 finished 14:53:32Z, trước btime94 8.617 s; run 179 dispatch 17:35:51Z, sau btime94 1.122 s).

### §4.2. F-179-T5-1 và chuỗi mẫu overlap poll-cuối-sau-btime

Watcher-178 đọc được boot_id cũ 22 s sau btime mới (đã giải thích ở F-172-T5-1). Mẫu thứ mười — chuỗi **11 → 20 → 23 → 9 → 8 → 36 → 7 → 3 → 17 s** rồi **22 s (F-179-T5-1)**; poll cuối 13:07:57Z, boot 985bc2a3; poll trước 13:07:27Z, trước btime 8 s. **Không ảnh hưởng verdict** — poll duy nhất sau btime vẫn thuộc boot cũ (dpkg/md5 khớp #92). **Watcher-179 chưa có mẫu overlap** (spawn trên #94, chưa gặp reboot mới — T5-180 ghi nhận nếu có).

### §4.3. F-177-T5-3 vẫn đúng trên #94

`who -b`/`last reboot` chỉ cho phút (17:17), không cho giây — không đối chiếu được lệch btime. T5 dùng **epoch /proc/stat làm chuẩn**; T0-179 làm rõ bằng 9 nguồn. F-177-T5-3 ghi nhận lần 3 (#90, #92, #94).

### §4.4. F-178-T7-4 — ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start

- Hai giá trị trên cùng boot OS #92: run 177 `cron_boot_c92a2dd5…` (đặt lúc reattach 11:09:06Z) vs run 178 `cron_boot_dcf769fa…` (đặt lúc dispatch 11:35:51Z). T0-179 kết luận (appendix179 §H): **worker_boot_generation theo daemon start** (requeue detail: "daemon startup recovery"), KHÔNG phải OS boot — đổi ở mỗi daemon start; daemon restart 1 lần thêm trên #92 giữa 11:09:06Z và 11:35:51Z; trigger không xác định được từ dữ liệu hiện có (host-side); số hiệu boot OS #92 không ảnh hưởng.
- **Phía infra T5-179 (không phán DB):** daemon hatch trên #94 pid 67 start **17:17:21Z (boot+12 s)** — boot OS mới → daemon mới → gen mới (run 179: `32a2a7ed`); gen `92e3cfb8` dùng chung bởi run 178 (sau #93) và run 17c51ba6 → không daemon restart 13:08:11Z–14:53:24Z (khớp T0). Grep `cron_boot|boot_generation` trên /var/lib/hatch + /opt/hatch + /run chỉ hit binary `hatch` và docs bảng scheduler — **không file infra nào trên đĩa lưu generation**: giá trị chỉ sống trong scheduler DB (thuộc T0/T7).
- **F-178-T7-4 ĐÓNG ở mức T5/T0** — trigger restart daemon trên #92 vẫn là nợ host-side (không bắt buộc — bằng chứng trong cell đã hết, cùng nguyên tắc quyết (k) đợt 174).

---

## §5. Replay #94 ĐÌNH TRỆ + repair + ledger

### §5.1. Replay #94 ĐÌNH TRỆ sau heal — repair thay thế — F-174-T5-6 KHÔNG áp dụng

- **Hoạt động:** heal `dpkg --configure -a` 17:35:42Z (boot+18m33s — replay bắt đầu, cùng mẫu #92 boot+34m17s); **SAU ĐÓ 0 hoạt động apt ~14'** (tới watcher spawn 17:49:58Z): 0 proc apt/dpkg, 0 wrapper, dpkg.log đứng yên 2 dòng, `/var/log/apt/` chưa có, cache 0, lists 5. T5 kiểm `ps` + `pgrep apt/dpkg/replay` (0 hit) + `fuser /var/lib/dpkg/lock` (không ai giữ) + journal 0 dòng apt/dpkg.
- **Form-B (T5 verify tay TRƯỚC khi spawn watcher, check-only):** postboot check-only 17:46:00Z **exit=1** — PASS wrapper K1; **FAIL libs 5/5**; **FAIL GST** (thư mục hệ thống không tồn tại; debroot=269; thiếu isomp4=1 libav=1); **FAIL apt 11 gói**. Log `t5-postboot-verify-formB-ae2a9a47.log` (chỉ đọc, không chạm dpkg — xem §10).
- **F-174-T5-6 (replay #85 một phần) KHÔNG áp dụng ở #94** — đây KHÔNG phải replay một phần: replay #94 đình trệ sau heal, chưa tới bước cài nào (0 transaction trước repair); repair là đường vá đứng theo chiến lược (h). Không bằng chứng host-side nào trong cell giải thích vì sao đình trệ (disk còn 7,5 GB; mirror tới được; 0 lỗi term.log). T5 không suy đoán — chỉ trình số thô.
- **Kết quả repair (17:49:58Z → 18:03:08Z, ~13m10s):** `apt-get update` ~12m56s (lists 5 → 66; **1 mirror InRelease fail** — `mirror.cogentco.com noble-updates`, Connection failed — update chạy tiếp, install vẫn đủ 11/11); install **18:02:54–18:03:07Z (13 s, 1 transaction)**; dpkg 2 → **795 dòng** (status 568, configure 110, install 106, upgrade 4, startup 4, trigproc 3 — **BẰNG #90 repair**; install 106 = ledger added 106; upgrade 4 gói mesa 25.2.8-0ubuntu0.24.04.4 → .5). term.log **0 lỗi**. Cache 0 → **110 .deb**.
- **Kết quả postboot poll1 (18:03:08Z, exit=0):** PASS wrapper/libs/GST/apt — **11/11 gói NEED** + 5/5 lib (verify độc lập khớp); GST 269=269 qua symlink debroot (§3.1); **tools CHƯA cài** (khác #92); **libc-bin 2.39-0ubuntu8.9** (= #90).
- **Phiên bản gói:** Y HỆT #89/#92 (good 1.24.2-1ubuntu1.8, bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, -base 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, -gl 1.24.2-1ubuntu0.7, libgstreamer1.0-0 1.24.2-1ubuntu0.2) — chỉ khác **libc-bin 2.39-0ubuntu8.9** (repair) vs 8.12 (replay).

### §5.2. Ledger (F-179-T5-2 — cùng họ F-174-T5-2 → F-178-T5-2)

- ledger.jsonl: **1 dòng, 3.040 B, mtime 09:43:19Z KHÔNG ĐỔI suốt #93 và lúc mở #94** (tới trước repair); dòng compacted ts **1795423914 = 2026-11-23 08:51:54Z** (repair #90) VẪN CÒN (added 170, removed 0). **Ledger KHÔNG viết lại ts compacted khi sang boot mới** — ts mang sang #93 nguyên vẹn (**lần thứ sáu**: #86, #89, #90, #91, #92, #93). Không ảnh hưởng số đếm; ghi nhận để T2/T10 không nhầm ts với boot.
- **Sau repair #94:** ledger **2 dòng, 4.949 B, mtime 18:03:08Z** — repair ghi THÊM dòng ts **1795456988 = 2026-11-23 18:03:08Z** (added 106 — khớp 106 install; không compacted). Dòng compacted cũ ts 1795423914 VẪN CÒN. Hiện tượng "ts mang sang" khép lại ở #94 (cùng mẫu #90).
- `dpkg-state.txt`: 784 dòng, 40.187 B, mtime **17:36:04Z** lúc mở (reseed lúc heal #94 — khớp 784 dòng lúc mở #92) → **890 dòng, 45.792 B, mtime 18:03:08Z sau repair** (= #90 repair: 890 dòng).

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (watcher tự repair theo chiến lược (h), T5 không repair tay)

- T5-179 **KHÔNG chạy probe chạm dpkg nào** — 0 lần configure/install/update/repair tay. Repair #94 do **watcher-179 tự chạy** theo chiến lược (h) đã duyệt (quyết parent đợt 150): boot+15m + đóng băng ≥600 s + 0 proc + dòng < 100 — T4-179 đang gate0wait (không attempt) lúc trigger, đúng điều kiện.
- **Thứ tự an toàn:** form-B tay 17:46:00Z chạy lúc replay đã đình trệ (0 proc) — chỉ đọc, không giữ lock dpkg. Independent 18:04Z chạy lúc T4 đã có gate (a) (poll #26–#27), chưa attempt — poll T4 không ghi blocker từ T5.
- **0 VI PHẠM F-175-T4-2 phía T5** — repair của watcher chạy trong cửa sổ gate0wait của T4 (không phải attempt); T5 không khởi động script nặng nào trong cửa sổ attempt (chưa có attempt nào lúc T5 đóng).
- **Hướng (3) đứng lần thứ 26** (§2). G1 chờ user (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (0 thử lần thứ 32 — theo T9 đợt 178). File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 179: script postboot không đổi từ đợt 176; log poll1 + independent #94 có dòng đầu là dòng live mới (`[postboot 2026-11-23 17:17:09] boot=...`), rồi PASS wrapper/libs/GST/apt + KẾT LUẬN, exit=0 — dòng DOT-151 cứng KHÔNG còn xuất hiện.
- F-175-T5-3 **ĐÓNG từ đợt 176, vẫn đóng** — không sửa thêm file nào đợt này. (Lưu ý nhỏ: các dòng log của watcher cho `--repair`/`--repair exit`/`COPIED` mang timestamp trigger 17:49:58Z vì script echo `$ts` chụp ở đầu vòng lặp — thời gian HOÀN TẤT thật nằm trong nội dung dòng (poll1 hoàn tất 18:03:08Z); không ảnh hưởng số liệu, xem §10.)

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #94 (giao T9):** MemAvailable dao động mạnh — **802 / 1.849 / 1.193 / 436 MB** (4 điểm: 17:42Z T0 / 17:46Z / 17:54Z / 18:05Z; MemTotal 8.124.900 kB; T4 ghi 469–519 MB ở poll #25–#27). 436 MB lúc đóng là thấp nhất đợt — diễn biến đầy đủ thuộc T9-179.

**ENOSPC #94 (T9 đếm chính thức):** **9 dòng (17:46Z) → 15 (17:54Z) → 26 (18:05Z)** (journal boot hiện tại; ~1 dòng/phút). Disk còn 7,5 GB trống — ENOSPC không phải do disk đầy.

**X11:** **Trống lúc mở (17:41Z) và lúc đóng (18:05Z)** — 0 Xvfb. T4-179 gate0wait rồi có gate (a), chưa spawn X lúc T5 đóng. T5 KHÔNG dọn socket luồng khác; giao T8-179 theo checklist (o) nếu cần.

**Journal #94:** chỉ idx 0 duy nhất (boot ae2a9a47); first entry 17:17:20Z.

---

## §8. Nợ mở chuyển đợt 180

1. **(m) #93** — T2-179 + parent quyết (DƯƠNG ỨNG VIÊN sơ bộ, T7-178/T0-179 kiểm lại: +36,248 s trong band; cửa hẹp đã khép, đúng 1 requeue).
2. **(m) #94** — T2-179 + parent quyết (T0-179: 0 requeue — KHÔNG CÓ ĐIỂM; T5 chỉ trình số thô).
3. **INSIDE #93** — T2-179 (FULL139).
4. **Cờ #94 (repair, poll=1, 18:03:08Z)** — parent quyết §9(b): có đứng cho gate (a) không, caveat repair? (T5 đề xuất CÓ caveat, tiền lệ #90/#85).
5. **Số hiệu #94/#93** — T0-179 đã xác nhận cả hai (nợ đợt 178 đã trả).
6. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 23 thuộc T2-179; U cách sàn 29 s).
7. **(1c') (f') V1 live + F-178-T8-6** — T8-179 (triển khai bản copy chẩn đoán gắn hbStart vào evaluate setup W2; driver CHƯA đổi sang hb128 — parent quyết GIỮ NGUYÊN ở đợt 179).
8. **Balloon trên #94** — T9-179 (E-201 kết cục; E-202 nếu ghim tiếp trên #94).
9. **Watcher-179 vẫn chạy trên #94** (pid 61023, hạn 20:35:00Z) — T5-180 tiếp quản; nếu reboot mới (#95), spawn watcher mới theo mẫu.
10. **Prune lần 54** — T6-180. **Checklist (o)** — T8-179 (gồm X11, §7). **H3** chỉ giám sát thụ động.
11. **Run 179 kết cục** — T7-179/180 (vẫn running lúc T5 đóng; hạn 20:35:51Z). **Run 178 TIMEOUT 14:36:29Z** — T7-179 + parent 179 (margin −38 s; cf 7 s; KHÔNG phải ca ≥60 s thứ mười — số ca GIỮ 9).
12. **#94 có giết holder không** — T6-179 (chuỗi "không giết holder" từ #69: 24 reboot qua #92).
13. **F-179-T5-1 (overlap +22 s, mẫu thứ mười)** — ghi nhận, không đổi verdict (m).
14. **F-179-T5-2 (ledger ts mang sang #93 — lần thứ sáu, pre-repair)** — ghi nhận; sau repair #94 ledger đã có dòng mới.
15. **T2-180/T4-180:** không chạy script nặng / không probe dpkg trong cửa sổ attempt (B4 đứng; F-178-T2-8: parent đã quyết CÓ VI PHẠM NHẸ đợt 178 — chuỗi 0 vi phạm đếm lại từ 0 ở đợt 179; đợt 179 phía T5: 0 vi phạm, §6.1).
16. **RAM #94 dao động mạnh (436 MB–1,85 GB)** — T9-180 theo dõi; có thể ảnh hưởng gateA của T4-180.
17. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
18. **Nguyên nhân replay #94 đình trệ sau heal** — nếu T0/T7/T9 tìm ra thì ghi GAP, không thì chuyển nợ host-side (quyết (k) đợt 174: không bắt buộc; repair đã vá xong).
19. **Scheduler im lặng 15:15:35Z–17:35:39Z (HB thiếu 3, DR thiếu 2; HB 17:20:50Z muộn +890 s)** — T7-179 theo dõi (HB 17:50:50Z CÓ −316 s; DR 18:00Z + HB 18:20:50Z thuộc T7-179).

---

## §9. Đề xuất cho parent (quyết ở aggregate 179)

**(a) Chấp nhận verdict đợt 179?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #94 đã có (repair, poll=1, verify độc lập exit=0), watcher-179 chạy tốt, #93 không cờ đã xác nhận, F-178-T7-4 đã làm rõ, F-175-T5-3 vẫn đóng, hướng (3) lần 26, marker 46 reboot, 0 vi phạm B4 phía T5.

**(b) Cờ #94 (repair-sớm-quyết-h, poll=1) — CÂU HỎI QUYẾT:** Watcher-179 EARLY-REPAIR + postboot poll1 exit=0 trên boot SỐNG (log `t5-postboot-poll1-ae2a9a47.log`), T5 verify độc lập check-only exit=0 (`t5-postboot-independent-ae2a9a47.log`), 11/11 gói NEED + 5/5 lib + GST 269=269 + libc-bin 8.9. Caveat: GST qua symlink debroot (không phải thư mục thật), tools CHƯA cài, dpkg 795 (không phải 1.545). **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #94 đứng cho gate (a) **CÓ caveat repair** — tiền lệ #90/#85 (poll=1);
- (b2) Không chấp nhận (T5 không thấy căn cứ — repair đủ 11/11, 0 lỗi, verify độc lập khớp).

**(c) #93 KHÔNG CÓ cờ — chấp nhận thành boot thứ 20 không cờ, KHÔNG bù?** Bằng chứng §3.2: watcher-178 chết theo #93, 0 file POSTBOOT_PASS nhắc 97054ac6, không watcher nào sống trên #93, ledger không đổi. Tổng boot không cờ 19 → 20.

**(d) F-175-T5-3 VẪN ĐÓNG — parent ghi nhận?** Không sửa file nào đợt này; log poll1 + independent #94 in dòng live, không còn dòng DOT-151 cứng.

**(e) Xác nhận số hiệu boot #94 (T0-179, 9 nguồn) + #93 (chuỗi T7-178/T4-178/T0-179 DB)** — parent chấp nhận? (T5 không phán; F-177-T5-3: who -b chỉ cho phút.)

**(f) F-179-T5-1 (overlap +22 s, mẫu thứ mười) + F-179-T5-2 (ledger ts mang sang #93, lần thứ sáu, pre-repair) + F-177-T5-3 (who -b chỉ cho phút, lần 3) — ghi nhận, không đổi verdict (m).**

**(g) F-178-T7-4 ĐÃ LÀM RÕ (T0-179): worker_boot_generation theo daemon start, không phải OS boot — parent ghi nhận?** Phía infra T5: daemon #94 start boot+12s; gen mới 32a2a7ed; không file infra nào trên đĩa lưu generation (chỉ sống trong scheduler DB).

**(h) Watcher-179 vẫn chạy trên #94** (pid 61023, hạn 20:35:00Z) — T5-180 tiếp quản; nếu reboot mới (#95), spawn watcher mới theo mẫu.

**(i) Replay #94 đình trệ sau heal — parent có muốn điều tra host-side không?** Bằng chứng trong cell: disk còn trống, update xong ~13', cài xong 13 s, 0 lỗi — không manh mối. Theo quyết (k) đợt 174, điều tra host-side KHÔNG bắt buộc (bằng chứng trong cell đã hết) — T5 đề xuất áp dụng cùng nguyên tắc cho #94, trừ khi parent quyết khác.

---

## §10. Sai số của chính T5-179 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-179-T5-1** | Poll cuối watcher-178 nằm SAU btime #93 **22,0 s** (mẫu overlap thứ mười: 11→20→23→9→8→36→7→3→17→**22 s**) | Ghi nhận | Không ảnh hưởng verdict; poll duy nhất sau btime vẫn thuộc boot cũ (dpkg/md5 khớp #92) |
| **F-179-T5-2** | Ledger compacted ts 1795423914 (repair #90) mang sang #93 — lần thứ sáu liên tiếp (pre-repair; sau repair #94 đã có dòng mới ts 1795456988) | Ghi nhận | Không ảnh hưởng số đếm (compacted added 170; dòng mới added 106); ghi nhận để T2/T10 không nhầm ts với boot |
| — | Các dòng log watcher cho `--repair`/`COPIED` mang timestamp trigger 17:49:58Z (script echo `$ts` đầu vòng lặp) — thời gian hoàn tất thật nằm trong nội dung dòng (poll1 18:03:08Z) | Hạn chế nhỏ | Không ảnh hưởng số liệu: repair 17:49:58Z → 18:03:08Z (~13m10s) suy từ End-Date history.log 18:03:07Z + FLAG-WRITTEN |
| — | Form-B tay 17:46:00Z chạy lúc replay #94 đã đình trệ (không proc apt/dpkg) | Không phải lỗi | Chỉ đọc (dpkg-query/ldconfig/ls), không giữ lock; không ảnh hưởng gì (replay đã im trước đó ~10 phút) |
| — | Stats chỉ đo RAM 4 điểm thay vì diễn biến đầy đủ | Hạn chế nhỏ | T5 đóng sớm (cờ xong 18:03:08Z, trước cửa sổ attempt của T4); diễn biến RAM đầy đủ thuộc T9-179 |
| — | Khoảng không-watcher ~16.921 s bao trọn đời #93 sau khi watcher chết + 32m49s đầu #94 | Hạn chế bằng chứng | Heal #94 có bằng chứng trong dpkg.log (2 dòng 17:35:42Z); #93 không còn bằng chứng replay — đã xác nhận không cờ |
| — | `apt-get update` của repair có 1 mirror InRelease fail (mirror.cogentco.com noble-updates, Connection failed) — update chạy tiếp bằng lists còn lại | Ghi nhận | Install vẫn đủ 11/11 gói; poll1 + independent đều exit=0 — không đổi verdict cờ (caveat repair đã bao gồm) |

**Số liệu chính thức lấy từ log watcher-178/179 + log trực tiếp (form-B/poll1/independent) + dpkg/history/term.log của #94 + đối chiếu T0-179/T7-179.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND179_T5_INFRA_LIMITS.md` (file MỚI, không sửa file repo nào đợt này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round179-t5-infra.txt` (NUL-delimited, 1 entry; đã verify bằng read-back `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round179-t5/` (theo mẫu T5-171–178): watcher script/log, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–179: đợt 166–178 = 130 batch / 186 entry / 173 file duy nhất / 170 file mới (theo quyết (q)/(r) đợt 178; crosscheck T1-179: 111–178 = 668/1.165/1.012/834, missing 0/3.817) + đợt 179 (1 file này, file MỚI) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-179 (bản chính, 17:41–18:07Z)

```
=== PHU LUC SO LIEU T5-179 (trich log truc tiep, 2026-11-23T17:41-18:07Z) ===
boot_id=ae2a9a47-2de7-48ef-853d-0023b47bdc0b
btime_epoch=1795454229 = 2026-11-23T17:17:09+00:00 (who -b: 17:17 — chi toi phut, F-177-T5-3)
gap #93->#94 = 14974 s (btime #93 13:07:35Z epoch 1795439255, T7-178 xac minh 9 nguon kieu T0, T0-179 doi chieu DB khop)
gap #92->#93 = 7568 s (kiem lai doc lap — khop)

--- replay-watch-178.log (round178-t5) ---
tong_dong=175 polls=170; poll_dau=2026-11-23T11:43:09Z boot=985bc2a3
poll_cuoi=2026-11-23T13:07:57Z boot=985bc2a3 dpkg_lines=1545 md5=524432b5 (F-179-T5-1 = +22 s sau btime #93); 0 dong END/STOP/NEWBOOT

--- replay-watch-179.log (round179-t5) ---
START 2026-11-23T17:49:58Z pid=61023 boot=ae2a9a47 btime=17:17:09Z end=20:35:00Z
init_lines=2 init_md5=54343a30 init_mtime=17:35:42Z cache=0 lists=5 gst_sys=0
poll dau 17:49:58Z apt=[] dpkg=[] (0 proc — replay dinh tre)
EARLY-REPAIR TRIGGER 17:49:58Z boot_age=1969s frozen=856s dpkg_lines=2 — verify form-B exit=1
--repair exit=0 (update ~12m56s + install 18:02:54-18:03:07Z, 13 s, 1 transaction)
COPIED /tmp/l8-postboot-apt.log -> t5-postboot-repair-apt-ae2a9a47.log (53697 B, 715 dong)
postboot poll1 exit=0 (hoan tat 18:03:08Z)
FLAG-WRITTEN 18:03:08Z mode=repair-som-quyet-h poll=1 (old=985bc2a3)
poll 18:23:41Z — dpkg 795, md5 40abf79a, 0 proc, on dinh (42 poll luc 18:23Z)

--- 3. POSTBOOT_PASS ---
round179-t5/POSTBOOT_PASS: CO mtime=2026-11-23 18:03:08 +0000 bytes=324
round179-t5/POSTBOOT_PASS-985bc2a3: CO (backup #92, md5 b134dd93 = goc round178-t5)
round178/177/176/175/174/173-t5/POSTBOOT_PASS: CO, mtime KHONG DOI (11:53:41Z / 08:51:55Z / 05:42:19Z / 02:40:29Z / 23:46:57Z / 21:27:05Z)

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47.272154981 +0000

--- 5. dpkg/cache/lists/GST (boot #94, sau repair) ---
dpkg_lines=795 md5=40abf79a mtime=2026-11-23 18:03:07 +0000
dpkg_breakdown={status 568, configure 110, install 106, upgrade 4, startup 4, trigproc 3} tong=795
cache_deb=110 lists_entries=66
gst_sys_files=269 (QUA SYMLINK -> debroot, va tam K1 — KHAC #92 thu muc that) gst_sys_is_link=CO
apt_history_transactions=1; Start 18:02:54, End 18:03:07; term_log_errors=0
repair: update ~12m56s (lists 5->66; 1 mirror InRelease fail — cogentco); install 18:02:54-18:03:07Z (13 s)
heal #94: 17:35:42Z (boot+18m33s); sau do 0 hoat dong apt ~14 phut toi watcher spawn

--- 6. 11 goi NEED + 5 lib + tools + ledger ---
11/11 install ok installed (NEED); gstreamer1.0-tools CHUA cai
5/5 lib CO; versions: good 1.24.2-1ubuntu1.8, bad 1.24.2-1ubuntu4, ugly 1.24.1-1build1, -base 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, -gl 1.24.2-1ubuntu0.7, libc-bin 2.39-0ubuntu8.9 (#89/#92: 8.12; #90: 8.9)
ledger: 2 dong, ts 1795423914 (compacted, added 170) + ts 1795456988 (moi, added 106); mtime 18:03:08Z (F-179-T5-2: ts cu mang sang #93 — lan thu sau, pre-repair)
dpkg-state.txt: 890 dong, 45792 B, mtime 18:03:08Z (luc mo: 784 dong, 40187 B, mtime 17:36:04Z)

--- 7. ENOSPC --- 9 (17:46Z) -> 15 (17:54Z) -> 26 (18:05Z, journal boot hien tai)
--- 8. RAM --- MemAvailable 802352 kB (17:42Z, T0) / 1849236 kB (17:46Z) / 1193128 kB (17:54Z) / 436048 kB (18:05Z); MemTotal 8124900 kB
--- 9. Huong (3) --- user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; crontab not found; timers_vcut=0
--- 10. X11 --- TRONG luc mo (17:41Z) + luc dong (18:05Z); 0 Xvfb
--- 11. Khoang khong-watcher --- ~16921 s (13:07:57Z -> 17:49:58Z); F-179-T5-1 = 22 s
--- 12. T4-179 --- poller chay tu 17:44Z; poll #26 18:03:29Z gate0=T5; poll #25 18:02:44Z gate0=khong-dat (apt=1 do repair)
```
