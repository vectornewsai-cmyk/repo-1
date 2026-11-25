# PHASE 9 — ROUND 177 — T5 INFRA LIMITS

**Đợt:** 177 (mở lượt cron 15:35:51 +07 23/11/2026 = 08:35:51Z; hạn cờ ~11:00Z, hạn cứng ~11:30Z).
**Người viết:** T5-177. **Ngày:** 23/11/2026. **Boot làm việc lúc đóng:** #90 ỨNG VIÊN (CHƯA XÁC NHẬN — chờ T0-177 xác minh 9 nguồn) 94247dfa, btime 07:10:29Z (epoch 1795417829, theo /proc/stat).
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #90 (repair-sớm-quyết-h, poll=1 — xem §3.1) + KHÔNG sửa file repo nào đợt này. File này là 1 entry stage duy nhất đợt 177 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #90 (94247dfa, btime 07:10:29Z) | **ĐÃ CÓ 08:51:55Z (boot+1h41m26s, repair-sớm-quyết-h, poll=1)** — watcher-177 tự repair theo chiến lược (h) sau form-B exit=1; poll1 exit=0; T5 verify độc lập check-only exit=0 bằng script ĐÃ SỬA F-175-T5-3; 11/11 gói NEED + 5/5 lib; GST symlink → debroot 269=269. **CÓ caveat repair** (xem §3.1) — tiền lệ #84/#85 |
| Replay host-side #90 | **KHÔNG CHẠY — 0/170 intent** (dpkg.log chỉ 2 dòng configure 07:11:03Z, boot+34s; không có /var/log/apt/; cache 0; lists 5; GST hệ thống không tồn tại; 11/11 gói chưa cài; 0 proc apt/dpkg lúc T5 mở boot+~90') — tệ hơn #83 (23/170) và #85 (159/170); F-174-T5-6 KHÔNG áp dụng (đó là replay một phần, đây là replay không chạy) — xem §5.1 |
| POSTBOOT_PASS #89 (15618ce8) | **VẪN CÓ, còn hiệu lực** (05:42:19Z, replay-đầy-đủ, poll=0 — parent CHẤP NHẬN (c) đợt 176, đứng gate (a) KHÔNG caveat); mtime không đổi; backup byte-identical trong round177-t5 |
| POSTBOOT_PASS #87 (ca31fac1) / #88 (9131fbc6) | **CHƯA CÓ cờ — KHÔNG bù được** (xem LIMITS T5-176 §3.4). Tổng boot không cờ: **18** (không đổi — cờ #90 đã có) |
| POSTBOOT_PASS #86 / #85 / #84 | **VẪN CÓ** (02:40:29Z replay-đầy-đủ poll=0 / 23:46:57Z repair-tay-T5 poll=1 / 21:27:05Z repair-sớm-quyết-h poll=1); mtime không đổi |
| Reboot trong phiên | **#90 (94247dfa, btime 07:10:29Z, gap #89→#90 = 6.243 s)** — xảy ra ~85 phút TRƯỚC khi đợt mở, trong lúc T7/T9 làm việc; CHƯA XÁC NHẬN (chờ T0-177). Gap ngắn bất thường so với ~7,1–7,5 ks các reboot trước — xem §4.1 |
| Watcher-176 | pid 7604 **CHẾT theo #90** (poll cuối 07:10:32Z, **+3 s sau btime #90, mẫu overlap thứ tám — NHỎ NHẤT** F-177-T5-1); 182 dòng, 177 poll, gaps đều {30 s ×163, 31 s ×13} |
| Watcher-177 | START 08:41:39Z, pid **114543**, hạn 11:30:00Z — EARLY-REPAIR trigger ngay poll đầu (boot+91m, frozen 5.436 s, dpkg 2 dòng); **--repair exit=0, poll1 exit=0, FLAG-WRITTEN 08:51:55Z**; vẫn ALIVE lúc T5 đóng — xem §3.5 |
| Khoảng không-watcher | **~5.427 s = 1h30m27s** (poll cuối watcher-176 07:10:32Z → START watcher-177 08:41:39Z) — bao trọn "replay #90 không chạy" |
| Hướng (3) | **VẪN ĐỨNG lần thứ 24 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0, 0 timer VCut) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#89 = 41 reboot ĐÃ XÁC NHẬN** (T0-176 xác minh 9 nguồn #87/#88/#89) |
| ENOSPC | #90: **87 dòng lúc 08:52Z** (journal boot hiện tại; T9 đếm chính thức) — tăng từ 76 dòng lúc 08:40Z |
| X11 | **Trống lúc mở (08:38Z) và vẫn trống lúc đóng (08:52Z)** — 0 Xvfb; T4-177 mới gate0wait, chưa spawn X |
| RAM #90 | MemAvailable dao động mạnh: **464.500 / 1.346.252 / 1.306.068 / 1.166.676 kB** (4 điểm, giao T9) |
| Đồng hồ | Local ≈ Cloudflare **−2 s** (CF nhanh hơn ~2 s — cùng họ các đợt trước, trước đây −1 s) |
| Quy tắc B4 | **T5-177 KHÔNG chạy probe chạm dpkg nào ngoài --repair của watcher** (0 lần `dpkg --configure -a` tay, 0 lần apt install tay) — repair là cơ chế đứng chiến lược (h), chạy khi T4 gate0wait (chưa attempt, chưa có cờ) — xem §6.1 |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot dòng 686 — dòng DOT-151 chỉ còn trong comment; log form-B #90 in dòng live đầu tiên, không còn dòng cứng) |
| T4-177 | Poller ĐANG CHẠY (poll-wait-t4-177.sh pid 145441 từ ~08:42Z, gate0wait); repair của watcher chạy TRƯỚC khi poller T4 khởi động |

**Số hiệu boot #90 CHƯA XÁC NHẬN — chờ T0-177 xác minh 9 nguồn.**
**T5-177 KHÔNG phán (m), chỉ trình số thô — (m) #90 DƯƠNG ỨNG VIÊN (sơ bộ +35,313 s, theo T7-176) CHỜ T2-177 đối chiếu + parent quyết.**

---

## §1. Timeline (giờ Z, 23/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 05:26:26Z | Reboot #89 (15618ce8, btime — T0-176 ĐÃ XÁC NHẬN 9 nguồn); gap #88→#89 = 1.329 s |
| 05:42:19Z | Cờ POSTBOOT_PASS #89 ghi (replay-đầy-đủ, poll=0); watcher-176 pid 7604 START |
| 07:10:29Z | **Reboot #90 (94247dfa, btime epoch 1795417829 — theo /proc/stat)**; gap #89→#90 = **6.243 s** |
| 07:10:32Z | **Poll cuối watcher-176** (+3 s sau btime #90 — F-177-T5-1); watcher chết theo #90 |
| 07:11:03Z | Hoạt động dpkg duy nhất trên #90 (boot+34s, 2 dòng `startup packages configure`) — sau đó IM HOÀN TOÀN |
| 08:35:51Z | Lượt cron đợt 177 mở |
| ~08:38Z | **T5-177 mở trên #90**: replay KHÔNG CHẠY (dpkg 2 dòng ổn định từ 07:11:03Z); cache 0 .deb; lists 5; GST hệ thống không tồn tại (debroot 269); `/var/log/apt/` KHÔNG có; `/tmp/.X11-unix/` TRỐNG lúc mở |
| 08:41:39Z | **Watcher-177 START, pid 114543, boot 94247dfa** (khoảng không-watcher ~5.427 s từ poll cuối watcher-176 07:10:32Z); **EARLY-REPAIR TRIGGER ngay poll đầu** (boot_age 5.470 s, frozen 5.436 s, dpkg 2 dòng) + verify form-B exit=1 |
| 08:41:39Z | `--repair` bắt đầu: `apt-get update` (timeout 1500 s) rồi install (timeout 1800 s) |
| 08:41:39–08:50:32Z | `apt-get update` tải **71,3 MB trong 8m50s (134 kB/s)** — chậm nhưng xong; install bắt đầu 08:51:42Z |
| 08:51:42–08:51:54Z | Install 1 transaction (11 gói NEED, 12 s); dpkg 2 → **795 dòng**; term.log 0 lỗi |
| 08:51:55Z | **Cờ POSTBOOT_PASS #90 ghi (boot+1h41m26s, repair-sớm-quyết-h, poll=1)**; backup cờ #89 thành `POSTBOOT_PASS-15618ce8` (byte-identical với bản gốc) |
| 08:52:09Z | T4-177 poll #14: gate0=T5 (cờ mới round177-t5/POSTBOOT_PASS) — T4 đã có gate (a) |
| ~08:52Z | T5 verify độc lập check-only trên #90 bằng script đã sửa: **exit=0, 11/11 gói NEED + 5/5 lib, GST symlink → debroot 269=269** (log `t5-postboot-independent-94247dfa.log`) |
| 08:53Z | T5 viết LIMITS này. Watcher-177 vẫn ALIVE (pid 114543, poll cuối 08:52:25Z ổn định). T4-177 gate0wait (poller pid 145441). 0 cờ round177 `.done` lúc T5 đóng. |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 24 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kết quả kiểm lúc mở phiên: `user@0` inactive; `loginctl` "Failed to connect to bus: No such file or directory"; không thư mục linger (`/var/lib/systemd/linger` không tồn tại); không `/run/user/0`; không lệnh `crontab`; 0 timer VCut. Đây là lần thứ 24 liên tiếp hướng (3) đứng. T5 KHÔNG dùng systemd user manager / timer nào để giữ watcher — watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172/173/174/175/176.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z). Marker sống qua **#49–#89 = 41 reboot ĐÃ XÁC NHẬN** (T0-176 xác minh 9 nguồn #87/#88/#89 — GAP §105; parent quyết (e)/(p) đợt 176). **#90 chờ T0-177** — nếu xác nhận, marker sống qua #49–#90 = 42 reboot. T5 không có bằng chứng mới nào về cơ chế bảo toàn `~/.config` — không mở lại chủ đề.

**Đồng hồ (1 lap, 08:42:19–08:42:21Z):** local 08:42:19Z → CF `Date: Mon, 23 Nov 2026 08:42:21 GMT` — **CF nhanh hơn local ~2 s** (các đợt trước ~1 s; cùng họ). **Btime ghi bằng epoch nguyên vẫn là đồng hồ chuẩn**; gap trong file này tính bằng epoch nguyên — không dùng phân số.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #90 — ĐÃ CÓ (repair-sớm-quyết-h, poll=1) — CÓ caveat repair

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round177-t5/POSTBOOT_PASS`, 324 B, mtime 2026-11-23T08:51:55.128251916Z.
- Nội dung: `boot 94247dfa-0716-4de9-bdc6-080161a73701 (btime 2026-11-23 07:10:29Z; watcher-177) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-23T08:51:55Z; POSTBOOT_PASS moi ghi 2026-11-23T08:51:55Z poll=1 (repair-som-quyet-h); co cu 15618ce8 luu POSTBOOT_PASS-15618ce8`.
- Backup cờ cũ: `POSTBOOT_PASS-15618ce8`, 315 B — **md5 dac4eef427dbbf75846ff13d7b4e449d, byte-identical với file gốc round176-t5 (cờ #89)**.
- **Lịch trình (watcher tự làm, không tay):** watcher-177 START 08:41:39Z → EARLY-REPAIR TRIGGER ngay poll đầu (boot_age 5.470 s, frozen 5.436 s, dpkg_lines=2 — đủ điều kiện chiến lược (h): boot+15' + đóng băng ≥600 s + 0 proc + dòng <100) → verify form-B postboot check-only exit=1 (đúng kỳ vọng) → `--repair` exit=0 (update 71,3 MB/8m50s + install 11 gói/12 s) → COPY `/tmp/l8-postboot-apt.log` ra khỏi /tmp ngay (F-173-T5-9) → postboot poll1 exit=0 (hoàn tất 08:51:55Z) → FLAG-WRITTEN cùng giây. KHÔNG trigger REPLAY_DONE (dpkg chỉ 2 dòng); repair 1 lần duy nhất cho boot này (guard file `repaired-94247dfa`).
- **Verify độc lập (T5, check-only, không qua watcher, bằng script ĐÃ SỬA F-175-T5-3):** postboot check-only ~08:52Z **exit=0** — PASS wrapper K1, PASS libs, PASS GST, PASS apt, kết luận "DU DIEU KIEN chay WebKit"; stats §5: **11/11 gói NEED** + **5/5 lib CÓ** (ldconfig: libevent-2.1, libEGL, libavif16, libdw, libevdev); GST **symlink → debroot, 269=269** (không phải thư mục thật — caveat dưới).
- **Caveat repair (ghi nhận trung thực, parent quyết):** (1) cờ này là **repair, không phải replay-đầy-đủ** — replay host-side KHÔNG CHẠY (0/170), toàn bộ gói do `--repair` cài (11 gói NEED, 1 transaction, 12 s); dpkg 795 dòng (khác mẫu đầy đủ 1545 dòng); (2) **GST là symlink → debroot ephemeral** (`~/workspace/tmp-q6r3-debroot/...`, "vá tạm K1") — không phải thư mục hệ thống thật như các cờ replay-đầy-đủ; (3) **gstreamer1.0-tools KHÔNG cài** (không nằm trong danh sách NEED của script repair — `dpkg-query` ghi "unknown ok not-installed"; postboot PASS 11/11 không yêu cầu tools; trên các cờ replay-đầy-đủ tools CÓ cài); (4) **libc-bin 2.39-0ubuntu8.9** — khác #89 (2.39-0ubuntu8.12); các gói GStreamer khác Y HỆT #89.
- **Điểm khác các cờ gần đây:** đây là **cờ repair đầu tiên kể từ #85** (#86/#89 đều replay-đầy-đủ, poll=0) — mode `repair-som-quyet-h`, poll=1, cùng mẫu #84 (dpkg 795, cache 110, lists 75 — Y HỆT #84). **Parent quyết cờ này có đứng cho gate (a) không, và có caveat repair không (§9(b))** — T5 KHÔNG tự phán gate. T4-177 đã có cờ từ 08:51:55Z (gate0=T5 từ poll #14 08:52:09Z).
- **F-173-T5-9 ĐÃ THỰC HIỆN:** watcher copy `/tmp/l8-postboot-apt.log` → `t5-postboot-repair-apt-94247dfa.log` (53.018 B) NGAY sau --repair, trước poll1.

### §3.2. Cờ #89 — VẪN CÓ, còn hiệu lực (xác minh lại)

- Cờ: `round176-t5/POSTBOOT_PASS`, mtime **05:42:19.968477272Z KHÔNG ĐỔI** (replay-đầy-đủ, poll=0, dpkg 1545, cache 183, lists 37; backup POSTBOOT_PASS-15618ce8 trong round177-t5 + bản gốc round176-t5). Parent CHẤP NHẬN (c)/(k) đợt 176: cờ #89 đứng cho gate (a) **KHÔNG caveat**.

### §3.3. Cờ #88 / #87 — KHÔNG CÓ (không đổi, không bù được)

| Boot | Trạng thái | Vì sao không cờ |
|---|---|---|
| #87 (ca31fac1, 03:06:05Z) | **KHÔNG CÓ** (boot thứ 17 không cờ) | Watcher-175 chết theo chính reboot này; không watcher nào sống trên #87; bằng chứng replay mất theo reboot |
| #88 (9131fbc6, 05:04:17Z) | **KHÔNG CÓ** (boot thứ 18 không cờ) | Không watcher nào chạy trong cả vòng đời #88; bằng chứng replay mất theo reboot #89 |
| #83 (dd08464a) / #82 (34e61c92) | **KHÔNG CÓ** (boot thứ 15/16, không đổi) | Theo quyết parent đợt 173/174 |
| 13 boot cũ | Không có | #51, #53, #54, #55, #57, #60, #63, #66, #68, #71, #72, #73, #76, #78 |

Tổng cộng **18 boot không cờ** (chưa đổi — #90 chờ cờ §3.1; nếu cờ #90 có, tổng vẫn 18). **T5 KHÔNG viết cờ hồi tố cho #87/#88** (quy tắc đứng).

### §3.4. Cờ #86 / #85 / #84 / #81 / #80 / #79 / #77 / #75 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #86 (70b7f7ee) | round175-t5/POSTBOOT_PASS, 02:40:29Z | replay-đầy-đủ, poll=0 |
| #85 (3c704685) | round174-t5/POSTBOOT_PASS, 23:46:57Z | repair-tay-T5, poll=1 |
| #84 (4ae2d2ea) | round173-t5/POSTBOOT_PASS, 21:27:05Z | repair-sớm-quyết-h, poll=1 |
| #81 (4b9db449) | round172-t5/POSTBOOT_PASS | repair-sớm-quyết-h, poll=1 |
| #80 (2acdd1ab) | round171-t5/POSTBOOT_PASS | replay-đầy-đủ, poll=0 |
| #79 (5df1871f) | round170-t5/POSTBOOT_PASS | replay-đầy-đủ, poll=0 |
| #77 (576ca271) | round168-t5/POSTBOOT_PASS | replay-đầy-đủ, poll=0 |
| #75 (c44cc3ba) | round169-t5/POSTBOOT_PASS | mode repair |

**Mtime các cờ #89/#86/#85/#84 KHÔNG ĐỔI** (đã xác minh lại). Không cờ nào bị ghi đè ngoài vòng đời của nó.

### §3.5. Watcher-177 (boot #90) — ĐANG CHẠY, đã làm xong nhiệm vụ chính

- Spawn 08:41:39Z, pid **114543** (PPID 1, `bash .../round177-t5/replay-watch-177.sh`), boot 94247dfa, hạn 11:30:00Z. Khởi tạo: dpkg 2 dòng, md5 e4add78b, mtime 07:11:03Z, cache 0, lists 5, GST 0.
- **EARLY-REPAIR TRIGGER ngay poll đầu** (boot_age 5.470 s, frozen 5.436 s, dpkg_lines=2) → verify form-B exit=1 → `--repair` exit=0 → poll1 exit=0 → **FLAG-WRITTEN 08:51:55Z** (mode repair-som-quyet-h, poll=1). KHÔNG trigger REPLAY_DONE.
- **Poll sau cờ đều 30 s** (08:51:55Z, 08:52:25Z — dpkg 795, md5 fe60841c, gst 269, cache 110, lists 75, 0 proc, không đổi). Watcher vẫn ALIVE lúc T5 đóng; hạn 11:30:00Z 23/11 — T5-178 tiếp quản; nếu reboot mới, spawn watcher mới theo mẫu.

### §3.6. Watcher-176 (boot #89) — CHẾT theo #90 (đính chính nhiệm vụ)

- Spawn 05:42:19Z 23/11, pid **7604**, boot 15618ce8, hạn 08:30:00Z 23/11. **182 dòng log, 177 poll**; gaps {30 s ×163, 31 s ×13} — đều, không gap repair; poll đầu 05:42:19Z, **poll cuối 07:10:32Z**; 0 dòng END/STOP/NEWBOOT; boot_set {15618ce8}; dpkg {1545}; md5 {ac01a443}.
- **Đính chính nhiệm vụ:** watcher-176 KHÔNG sống tới hạn 08:30:00Z như dự đoán — đã chết theo **#90 (07:10:29Z)**, sớm hơn ~1h20m so với hạn; chết vì reboot giết (cùng mẫu watcher-175 chết theo #87).
- **Poll cuối 07:10:32Z — 3 s SAU btime #90 (F-177-T5-1)** — mẫu overlap thứ tám (xem §4.2). Chỉ 1 poll nằm sau btime #90 (poll trước đó 07:10:02Z, trước btime 27 s).

---

## §4. Boot #90 + F-177-T5-1 + gap kiểm lại độc lập

### §4.1. Boot #90 (94247dfa)

- boot_id đầy đủ `94247dfa-0716-4de9-bdc6-080161a73701`; btime **07:10:29Z** (epoch 1795417829 — theo /proc/stat); `who -b` ghi "Nov 23 07:10" (chỉ chính xác tới phút); `last reboot` ghi 07:10, wtmp bắt đầu 07:10:40Z; journal chỉ có idx 0 duy nhất (boot hiện tại, first entry 07:10:41Z); `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- **Gap #89→#90 = 6.243 s** (1795417829 − 1795411586, với btime #89 05:26:26Z — T0-176 ĐÃ XÁC NHẬN). Gap này **ngắn bất thường**: các gap gần đây đều ~7,1–7,5 ks — chỉ #88→#89 = 1.329 s ngắn hơn. T5 chỉ trình số thô — T0-177 xác minh btime #90 bằng 9 nguồn (run 176 viết lại ×1 tại #90 theo T7-176).
- **F-177-T5-3 (mới):** `who -b`/`last reboot` chỉ cho phút (07:10), không cho giây — không đối chiếu được lệch btime kiểu F-176-T5-3 (11 s). T5 dùng **epoch /proc/stat làm chuẩn**; T0-177 làm rõ bằng 9 nguồn.
- Trạng thái lúc T5 mở (~08:38Z, boot+~88'): replay KHÔNG CHẠY (xem §5.1); dpkg 2 dòng; cache 0 .deb; lists 5 (chỉ cli.github.com + auxfiles + lock + partial); GST hệ thống không tồn tại (debroot 269 file); `/var/log/apt` KHÔNG CÓ; `/var/lib/hatch/os-intent` CÓ (dpkg-state.txt 40.187 B mtime 07:11:03Z + ledger.jsonl 3.040 B, xem §5.2); `/var/lib/hatch-preflight` KHÔNG có; `/tmp/l8-postboot-apt.log` KHÔNG có lúc mở (xuất hiện sau khi repair chạy).
- **Số hiệu #90 CHƯA XÁC NHẬN** — chờ T0-177 xác minh 9 nguồn (T5 KHÔNG phán số hiệu; T7-176 đã xác minh 9 nguồn kiểu T0, phát hiện trong 37 s sau btime).
- **T5 KHÔNG phán (m).** (m) #90 DƯƠNG ỨNG VIÊN (sơ bộ, theo T7-176: requeue run 176 +35,313 s, cách biên DƯỚI 2,313 s) — CHƯA CHỐT, thuộc T2-177 + parent 177. T5 chỉ trình số thô.

### §4.2. F-177-T5-1 và chuỗi mẫu overlap poll-cuối-sau-btime

Watcher-176 đọc được boot_id cũ 3 s sau btime mới (boot_id cũ còn đọc được sau btime mới — đã giải thích ở F-172-T5-1). Đây là mẫu thứ tám của hiện tượng này — chuỗi cũ **11 → 20 → 23 → 9 → 8 → 36 → 7 s** (F-170-T5-1 → F-176-T5-1) rồi **3 s (F-177-T5-1 — NHỎ NHẤT từ trước**, phá kỷ lục nhỏ nhất cũ 7 s; poll cuối 07:10:32Z, boot 15618ce8; poll trước đó 07:10:02Z, trước btime 27 s). **Không ảnh hưởng verdict** — poll duy nhất sau btime vẫn thuộc boot cũ (dpkg/md5 khớp #89), không có poll nào bị gán nhầm boot. **Watcher-177 chưa có mẫu overlap** (spawn trên #90, chưa gặp reboot mới lúc T5 đóng — nếu reboot xảy ra trong phiên, T5-178 ghi nhận).

---

## §5. Replay #90 KHÔNG chạy + repair sớm (h) + ledger

### §5.1. Replay #90 KHÔNG CHẠY — 0/170 intent — F-174-T5-6 KHÔNG áp dụng

- **Hoạt động:** dpkg duy nhất 07:11:03Z (boot+34s, 2 dòng `startup packages configure` — reconcile heal), rồi IM HOÀN TOÀN tới lúc T5 mở (boot+~88'). Không transaction apt nào; `/var/log/apt/` không tồn tại; journal boot hiện tại **0 dòng apt/dpkg**; 0 proc apt/dpkg.
- **Form-B (T5 verify tay TRƯỚC khi spawn watcher, check-only, script ĐÃ SỬA F-175-T5-3):** postboot check-only **exit=1** — PASS wrapper K1; **FAIL libs 5/5** (thiếu libevent-2.1.so.7, libEGL.so.1, libavif.so.16, libdw.so.1, libevdev.so.2); **FAIL GST** (thư mục hệ thống không tồn tại; debroot=269 file; thiếu isomp4=1 libav=1); **FAIL apt 11 gói** (libevent-2.1-7t64, plugins-base/good/bad/ugly, -gl, -libav, -x, libavif16, libgstreamer1.0-0, libevdev2). Log `t5-postboot-verify-formB-94247dfa.log`.
- **F-174-T5-6 (replay #85 một phần, 2 gói không được thử cài) KHÔNG áp dụng ở #90** — đây không phải replay một phần mà là replay KHÔNG CHẠY (0/170, tệ hơn cả #83 với 23/170). Không có bằng chứng host-side nào trong cell giải thích vì sao replay không chạy (disk còn 7,4 GB trống; mirror tới được — archive.ubuntu.com HTTP 200; 0 proc apt/dpkg; journal 0 dòng apt/dpkg). T5 không suy đoán nguyên nhân — chỉ trình số thô.
- **Kết quả --repair của watcher (08:41:39Z → 08:51:55Z, tổng 10m16s):** `apt-get update` tải **71,3 MB trong 8m50s (134 kB/s)** — chậm nhưng xong trong timeout 1500 s; install **1 transaction, 12 s** (Start-Date 08:51:42, End-Date 08:51:54): `apt-get install -y --no-install-recommends` 11 gói NEED (libevent-2.1-7t64, plugins-base/good/bad/ugly, -gl, -libav, -x, libavif16, libgstreamer1.0-0, libevdev2); dpkg 2 → **795 dòng**. Breakdown: status 568, configure 110, install 106, upgrade 4, startup 4, trigproc 3 — **Y HỆT mẫu repair #84 (795 dòng / cache 110 / lists 75)**. term.log **0 lỗi** (`Log ended: 08:51:54`). Gói cuối cài: libc-bin (trigger); cache 0 → **110 .deb**; lists 5 → **75**.
- **Kết quả postboot poll1 (08:51:55Z, exit=0):** PASS wrapper K1; **PASS libs** (5/5: libevent/libEGL/libavif/libdw/libevdev); **PASS GST** (symlink → debroot, 269 file, đủ isomp4 + libav); **PASS apt: 11/11 gói NEED**. T5 verify độc lập (check-only, script đã sửa) khớp: 11/11 gói NEED `install ok installed` qua dpkg-query + 5/5 lib qua ldconfig; **gstreamer1.0-tools KHÔNG cài** (không nằm trong danh sách NEED của script repair — xem caveat §3.1).
- **Phiên bản gói:** Y HỆT #89 ngoại trừ libc-bin (plugins-good 1.24.2-1ubuntu1.8, plugins-bad 1.24.2-1ubuntu4, plugins-ugly 1.24.1-1build1, -gl 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, -base 1.24.2-1ubuntu0.7, **libc-bin 2.39-0ubuntu8.9 — #89 là 2.39-0ubuntu8.12**).

### §5.2. Ledger (F-177-T5-2 — cùng họ F-174-T5-2/F-175-T5-2/F-176-T5-2)

- ledger.jsonl: 3.040 B lúc mở → **4.949 B sau repair** (mtime 08:51:54Z); dòng compacted cũ ts **1795391156 = 2026-11-22 23:45:56Z** VẪN CÒN (added 170, removed 0); repair ghi THÊM dòng mới ts **1795423914 = 2026-11-23 08:51:54Z** (added 106, removed 0 — khớp 106 dòng install của repair). **Ledger KHÔNG viết lại ts compacted khi sang boot mới** — ts compacted mang sang #90 nguyên vẹn (lần thứ tư liên tiếp: #86, #89 rồi #90), giống F-174-T5-2/F-175-T5-2/F-176-T5-2 — nhưng lần này repair đã ghi dòng mới với ts ĐÚNG giờ repair.
- `added`: **170 tên** (dòng compacted), `removed`: 0 — khớp intent 170 gói. dpkg-state.txt 952 dòng lúc mở → **890 dòng sau repair** (mtime 08:51:54Z). Không ảnh hưởng số đếm; ghi nhận để T2/T10 không nhầm ts compacted với boot.

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (với repair đứng chiến lược (h))

- T5-177 **KHÔNG chạy probe chạm dpkg nào ngoài --repair của watcher** — 0 lần `dpkg --configure -a` tay, 0 lần apt install/update tay. Repair chạy theo chiến lược (h) (quyết parent đợt 150): boot+15' + đóng băng ≥600 s + 0 proc + dòng <100 — điều kiện đã đủ từ trước khi T5 mở (boot+91', frozen 5.436 s, dpkg 2 dòng). **Thứ tự an toàn:** repair trigger 08:41:39Z — TRƯỚC khi poller T4-177 khởi động (~08:42:3xZ, pid 145441); T4 đang gate0wait (chưa có cờ #90, gate (a) chưa xanh) nên không có cửa sổ attempt nào bị chạm. Ngoài repair, mọi việc T5 (spawn watcher, verify form-B check-only, stats) đều là check-only đọc hoặc watcher poll — không chạm dpkg.
- **Manual --repair: KHÔNG CẦN, KHÔNG CHẠY** — watcher tự repair theo (h); không có đường repair tay nào kích.
- **Hướng (3) đứng lần thứ 24** (§2). G1 chờ user quyết (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (birefnet 0 thử lần thứ 30 — theo T9 đợt 176; T5 không đo lại). File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` số phận vẫn chưa quyết.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 177: grep script postboot còn 2 hit "DOT-151|02:40:23Z" — cả hai đều là dòng comment (647–648); dòng live 686–690 là dòng sửa đợt 176. Log form-B #90 (`t5-postboot-verify-formB-94247dfa.log`) có dòng đầu là dòng live mới, tiếp theo là PASS wrapper + FAIL libs/GST/apt + KẾT LUẬN, exit=1 — dòng DOT-151 cứng KHÔNG còn xuất hiện trong output live.
- F-175-T5-3 **ĐÓNG từ đợt 176, vẫn đóng** — không sửa thêm file nào đợt này.

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #90 (giao T9):** MemAvailable dao động mạnh — **464.500 / 1.346.252 / 1.306.068 / 1.166.676 kB** (4 điểm, MemTotal 8.124.900 kB). Chỉ đo 4 điểm (T5 đóng sớm để xong trước cửa sổ attempt của T4) — diễn biến đầy đủ thuộc T9-177. Swap dùng ~377–415 MB / 1.048.572 kB. (T9 đợt 176: RAM 123 mẫu min 407.580 / max 3.052.340 kB — cùng họ dao động.)

**ENOSPC #90 (T9 đếm chính thức):** **87 dòng** lúc 08:52Z (journal boot hiện tại; lúc ~08:40Z là 76 dòng — tăng ~1 dòng/phút). Disk gốc còn 7,4 GB trống (2% dùng) — ENOSPC không phải do disk đầy; inotify trần 63.747 (xem T9). Đợt này sẽ là đợt thứ 26 liên tiếp có lỗi thật nếu T9 đếm vậy (đợt 176 là thứ 25, 86 dòng).

**X11:** **Trống lúc mở (08:38Z) và vẫn trống lúc đóng (08:52Z)** — `/tmp/.X11-unix/` trống, 0 Xvfb. T4-177 mới gate0wait (poller pid 145441 từ ~08:42Z), chưa spawn X. T5 KHÔNG dọn socket luồng khác; giao T8-177 xử lý theo checklist (o) nếu cần.

**Journal #90:** chỉ có idx 0 duy nhất (boot 94247dfa); first entry 07:10:41Z theo `journalctl --list-boots`.

---

## §8. Nợ mở chuyển đợt 178

1. **(m) #90** — T2-178 + parent quyết (DƯƠNG ỨNG VIÊN sơ bộ, theo T7-176: +35,313 s, cách biên DƯỚI 2,313 s; cửa hẹp đã khép, đúng 1 requeue).
2. **(m) #89** — ĐÃ ÂM (CUỐI cấp T2, đợt 176) — không còn nợ.
3. **INSIDE #89** — T2-178 (FULL135 sơ bộ FALSE — chuỗi dài 7 có đứt tại #89?; phân loại cuối đợt 177 thuộc T2-177).
4. **INSIDE #90** — T2-178 (thuộc T2-177 trước).
5. **Cờ #90 (repair-sớm-quyết-h, poll=1, 08:51:55Z)** — parent quyết §9(b): có đứng cho gate (a) không, và có caveat repair không.
6. **Số hiệu #90** — T0-178 xác minh 9 nguồn (T0-177 đang làm trong đợt này; T5 chỉ trình số thô).
7. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 21 thuộc T2-177; U cách sàn 29 s).
8. **(1c') (f') V1 live** — T8-178 (0 kích hoạt đợt 176, 0 FP trên 12 log sạch; F-176-T8-7 — T8-177 đề xuất phương án mở rộng).
9. **Balloon trên #90** — T9-178 (E-195 đang ghim lúc đợt 176 đóng — kết cục thuộc T9-177).
10. **POSTBOOT_PASS #91?** — T5-178 (watcher-177 chạy trên #90 tới hạn 11:30:00Z 23/11; nếu reboot mới, spawn watcher mới theo mẫu).
11. **Prune lần 52** — T6-178. **Checklist (o)** — T8-178 (gồm X11, §7). **H3** chỉ giám sát thụ động.
12. **Run 176 kết cục** — T7-178 (vẫn running lúc T7-176 đóng; viết lại ×1 tại #90; kết cục thuộc T7-177).
13. **#90 có giết holder không** — T6-178 (#87/#88/#89 KHÔNG giết holder — chuỗi từ #69: 21 reboot theo parent (i) đợt 176).
14. **F-177-T5-1 (overlap +3 s, nhỏ nhất)** — ghi nhận, không đổi verdict (m).
15. **F-177-T5-2 (ledger ts mang sang #90 — lần thứ tư liên tiếp)** — ghi nhận, không ảnh hưởng số đếm.
16. **T2-178/T4-178:** không chạy script nặng trong cửa sổ attempt + nhắc T5 không probe dpkg trong cửa sổ attempt (B4 đứng; F-175-T4-2 đã làm rõ: CÓ VI PHẠM nhẹ đợt 175).
17. **RAM #90 dao động mạnh (464 MB–1.346 MB)** — T9-178 theo dõi; có thể ảnh hưởng gateA của T4-178.
18. **G1 khung (a) M2** vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
19. **Nguyên nhân replay #90 không chạy (0/170)** — nếu T0/T7/T9 tìm ra trong đợt 177 thì ghi vào GAP, không thì chuyển nợ điều tra host-side (xem §9(i)).

---

## §9. Đề xuất cho parent (quyết ở aggregate 177)

**(a) Chấp nhận verdict đợt 177?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #90 đã có (repair-sớm-quyết-h, poll=1, verify độc lập exit=0 bằng script đã sửa), watcher-177 chạy tốt, F-174-T5-6 không áp dụng, F-175-T5-3 vẫn đóng, hướng (3) lần 24, marker sống. Caveat repair ở §3.1 — parent quyết ở (b).

**(b) Cờ #90 (repair-sớm-quyết-h, poll=1) — CÂU HỎI QUYẾT:** Watcher-177 tự repair theo chiến lược (h) + postboot poll1 exit=0 trên boot SỐNG (log `t5-postboot-poll1-94247dfa.log`), T5 verify độc lập check-only exit=0 (`t5-postboot-independent-94247dfa.log`, script đã sửa F-175-T5-3), 11/11 gói NEED + 5/5 lib + GST symlink → debroot 269=269. Không repair nào khác diễn ra. **Caveat:** replay host-side không chạy (0/170); GST symlink ephemeral; gstreamer1.0-tools không cài; libc-bin 8.9 (khác #89). **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #90 đứng cho gate (a) **CÓ caveat repair** — tiền lệ repair: #84/#85 (poll=1, chấp nhận có caveat); tiền lệ replay-đầy-đủ: #86/#89 (poll=0, không caveat);
- (b2) Không chấp nhận cờ repair (không có tiền lệ nào bác cờ repair-sớm-quyết-h; T5 không thấy căn cứ cho (b2)).

**(c) #87/#88 KHÔNG CÓ cờ — chấp nhận thành boot thứ 17/18 không cờ, KHÔNG bù?** T5 không viết cờ hồi tố (không watcher quan sát, bằng chứng replay mất theo reboot); tổng boot không cờ giữ 18 (cờ #90 đã có).

**(d) F-175-T5-3 VẪN ĐÓNG — parent ghi nhận?** Không sửa thêm file nào đợt này; log form-B #90 in dòng live, không còn dòng DOT-151 cứng.

**(e) Xác nhận số hiệu boot #90** — chờ T0-177 xác minh 9 nguồn (T5 không phán; lưu ý F-177-T5-3: who -b chỉ cho phút).

**(f) F-177-T5-1 (overlap +3 s, nhỏ nhất)** — ghi nhận mẫu overlap thứ tám; không đổi verdict (m).

**(g) Watcher-177 vẫn đang chạy trên #90** (pid 114543, hạn 11:30:00Z 23/11) — T5-178 tiếp quản; nếu reboot mới, spawn watcher mới theo mẫu.

**(h) X11 trống lúc mở và lúc đóng** — giao T8-177 xử lý theo checklist (o) nếu T4 spawn X sau; T5 không dọn.

**(i) Replay #90 KHÔNG CHẠY (0/170) — parent có muốn điều tra host-side không?** Bằng chứng trong cell: disk còn trống, mirror tới được, 0 proc, journal 0 dòng apt/dpkg — không có manh mối trong cell. Theo quyết (k) đợt 174, điều tra host-side cho #85 vẫn KHÔNG bắt buộc (bằng chứng trong cell đã hết) — T5 đề xuất áp dụng cùng nguyên tắc cho #90, trừ khi parent quyết khác.

---

## §10. Sai số của chính T5-177 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-177-T5-1** | Poll cuối watcher-176 nằm SAU btime #90 **3,0 s** (mẫu overlap thứ tám, NHỎ NHẤT: 11→20→23→9→8→36→7→**3 s**) | Ghi nhận | Không ảnh hưởng verdict; poll duy nhất sau btime vẫn thuộc boot cũ (dpkg/md5 khớp #89) |
| **F-177-T5-2** | Ledger compacted ts 1795391156 (= 23:45:56Z 22/11, lúc repair #85) mang sang #90 — lần thứ tư liên tiếp ledger không viết lại ts khi sang boot mới | Ghi nhận | Không ảnh hưởng số đếm (added vẫn 170); ghi nhận để T2/T10 đối chiếu ledger không nhầm ts với boot |
| **F-177-T5-3** | `who -b`/`last reboot` chỉ cho phút (07:10), không cho giây — không đối chiếu được lệch btime kiểu F-176-T5-3 (11 s) | Ghi nhận, giao T0 | T5 dùng epoch /proc/stat làm chuẩn; T0-177 làm rõ bằng 9 nguồn |
| — | Nhiệm vụ dự đoán watcher-176 sống tới hạn 08:30:00Z để T5-177 tiếp quản — thực tế chết theo #90 từ 07:10:32Z | Đính chính trong §3.6 | Không ảnh hưởng kế hoạch: watcher-177 đã spawn đúng mẫu, repair (h) đã trigger |
| — | Stats chỉ đo RAM 4 điểm thay vì diễn biến đầy đủ | Hạn chế nhỏ | T5 đóng sớm để xong trước cửa sổ attempt của T4; diễn biến RAM đầy đủ thuộc T9-177 |
| — | Khoảng không-watcher ~5.427 s bao trọn "replay #90 không chạy" | Hạn chế bằng chứng | Không watcher nào quan sát trực tiếp; T5 dựng lại từ dpkg.log (2 dòng, mtime 07:11:03Z) + journal 0 dòng apt/dpkg + form-B exit=1 |
| **F-177-T5-4** | T5 ghi nhầm trong bản nháp LIMITS: watcher-176 "179 poll" — đếm trực tiếp là **177 poll** (182 dòng = START + MONITOR + 177 poll + REPLAY_DONE + poll0 + FLAG-WRITTEN) | Đã sửa | Số quyết trong file này dùng 177 poll |

**Số liệu chính thức trong file này lấy từ log watcher-177 + các log trực tiếp (form-B/poll1/independent) + dpkg.log/history.log/term.log của boot #90.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND177_T5_INFRA_LIMITS.md` (file này — file MỚI, không sửa file repo nào đợt này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round177-t5-infra.txt` (NUL-delimited, 1 entry; đã verify bằng read-back `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round177-t5/` (theo mẫu T5-171/172/173/174/175/176): watcher script/log, stats output, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–177: đợt 166–176 = 110 batch / 156 entry / 146 file (theo quyết (q)/(r) đợt 176) + đợt 177 (1 file này, file MỚI) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-177 (bản chính, 08:38–08:53Z)

```
=== PHU LUC SO LIEU T5-177 (trich log truc tiep, 2026-11-23T08:38-08:53Z) ===
boot_id=94247dfa-0716-4de9-bdc6-080161a73701
btime_epoch=1795417829 = 2026-11-23T07:10:29+00:00 (who -b: 07:10 — chi toi phut, F-177-T5-3)
gap #89->#90 = 6243 s (btime #89 05:26:26Z, T0-176 DA XAC NHAN)
gap #88->#89 = 1329 s; gap #87->#88 = 7092 s; gap #86->#87 = 7468 s (theo T7-175/T0-176)

--- replay-watch-176.log (round176-t5) ---
tong_dong=182 polls=177; gaps={30.0: 163, 31.0: 13}
poll_dau=2026-11-23T05:42:19Z boot=15618ce8
poll_cuoi=2026-11-23T07:10:32Z boot=15618ce8 dpkg_lines=1545 md5=ac01a443 (F-177-T5-1 = +3 s sau btime #90)
mtime_log=2026-11-23 07:10:32 +0000

--- replay-watch-177.log (round177-t5) ---
START 2026-11-23T08:41:39Z pid=114543 boot=94247dfa btime=07:10:29Z end=11:30:00Z
init_lines=2 init_md5=e4add78b init_mtime=07:11:03Z cache=0 lists=5 gst_sys=0
EARLY-REPAIR TRIGGER 08:41:39Z boot_age=5470s frozen=5436s dpkg_lines=2
verify form-B postboot check-only exit=1 (08:41:39Z)
--repair exit=0; COPIED /tmp/l8-postboot-apt.log -> t5-postboot-repair-apt-94247dfa.log (53018 B)
postboot poll1 sau repair exit=0 dpkg_lines=795 cache=110 lists=75 (hoan tat 08:51:55Z)
FLAG-WRITTEN 08:51:55Z mode=repair-som-quyet-h poll=1 (old=15618ce8)
poll 08:52:25Z — dpkg 795, md5 fe60841c, 0 proc, on dinh

--- 3. POSTBOOT_PASS ---
round177-t5/POSTBOOT_PASS: CO mtime=2026-11-23 08:51:55.128251916 +0000 bytes=324
round177-t5/POSTBOOT_PASS-15618ce8: CO (backup #89, md5 dac4eef427dbbf75846ff13d7b4e449d = goc round176-t5)
round176-t5/POSTBOOT_PASS: CO mtime=2026-11-23 05:42:19.968477272 +0000 bytes=315 (KHONG DOI)
round175-t5/POSTBOOT_PASS: CO mtime=2026-11-23 02:40:29.816887655 +0000 bytes=315 (KHONG DOI)
round174-t5/POSTBOOT_PASS: CO mtime=2026-11-22 23:46:57.579559624 +0000 bytes=334 (KHONG DOI)
round173-t5/POSTBOOT_PASS: CO mtime=2026-11-22 21:27:05.996330814 +0000 bytes=325 (KHONG DOI)

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47.272154981 +0000

--- 5. dpkg/cache/lists/GST (boot #90, sau repair) ---
dpkg_lines=795 md5=fe60841c mtime=2026-11-23 08:51:54 +0000
dpkg_breakdown={'status': 568, 'configure': 110, 'install': 106, 'upgrade': 4, 'startup': 4, 'trigproc': 3} tong=795
cache_deb=110 lists_entries=75
gst_sys_files=269 (symlink -> debroot, 269=269) gst_sys_is_link=CO
apt_history_transactions=1; Start-Date 08:51:42; End-Date 08:51:54; term_log_errors=0
apt_update: Fetched 71.3 MB in 8min 50s (134 kB/s); 181 Get
install_cmdline: apt-get install -y --no-install-recommends libevent-2.1-7t64 gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-gl gstreamer1.0-libav gstreamer1.0-x libavif16 libgstreamer1.0-0 libevdev2

--- 6. 11 goi NEED + 5 lib + ledger ---
11/11 dpkg-query install ok installed (NEED); gstreamer1.0-tools KHONG cai (unknown ok not-installed — ngoai danh sach NEED)
5/5 lib CO (ldconfig); versions: plugins-good 1.24.2-1ubuntu1.8, plugins-bad 1.24.2-1ubuntu4, plugins-ugly 1.24.1-1build1, -base 1.24.2-1ubuntu0.7, libav 1.24.1-1build1, -gl 1.24.2-1ubuntu0.7, libc-bin 2.39-0ubuntu8.9 (#89: 2.39-0ubuntu8.12)

--- 7. ENOSPC --- ENOSPC_dong=87 (journal boot hien tai, 08:52Z; 76 dong luc 08:40Z)
--- 8. RAM --- MemAvailable 464500 / 1346252 / 1306068 / 1166676 kB (4 diem); MemTotal 8124900 kB
--- 9. Huong (3) --- user@0 inactive; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; crontab not found; timers_vcut=0
--- 10. X11 --- TRONG luc mo (08:38Z) + luc dong (08:52Z); 0 Xvfb
--- 11. Khoang khong-watcher --- ~5427 s (07:10:32Z -> 08:41:39Z); F-177-T5-1 = 3 s
```
