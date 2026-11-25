# PHASE 9 — ROUND 187 — T5 INFRA LIMITS

**Đợt:** 187 (mở lượt cron 03:35:51 +07 25/11/2026 = 20:35:51Z 24/11; hạn cờ ~23:00Z, hạn cứng ~23:35Z 24/11; T5 đóng ~21:24Z — cờ #109 xong 20:50:24Z, cờ #110 xong 21:22:15Z).
**Người viết:** T5-187. **Ngày:** 24/11/2026. **Boot làm việc lúc đóng:** #110 ỨNG VIÊN (T0-188 chưa xác minh) 912f4a97, btime 21:13:21Z (trước đó #109 6f1d9f87, btime 20:30:33Z).
**Trạng thái:** ĐÃ XONG đo đạc + watcher + cờ #109 (replay, poll=0, KHÔNG caveat — §3.1) + cờ #110 (replay, poll=0, KHÔNG caveat — §3.1) + #108 KHÔNG CÓ — KHÔNG THỬ REPAIR (boot đã chết; tiền lệ #100/#83 (b2) — §3.2) + replay #109 KHÔNG ĐÌNH TRỆ (§5.1) + replay #108 KHÔNG XÁC ĐỊNH ĐƯỢC (§5.2) + #104/#102/#101/#99/#98/#96/#95 VẪN CÓ + #97/#100/#103/#105/#108 KHÔNG CÓ (tổng 23 → 24 → 25 nếu parent chấp nhận — §3.4) + hướng (3) đứng lần 34 (§2). 1 entry stage duy nhất.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #109 (6f1d9f87, btime 20:30:33Z) | **ĐÃ CÓ 20:50:24Z (boot+19m51s, replay, poll=0, KHÔNG caveat)** — REPLAY_DONE → poll0 exit=0; verify độc lập exit=0; 11/11 NEED + 5/5 lib; GST 269=269 **thư mục thật**; **tools CÀI**; libc-bin 2.39-0ubuntu8.12; dpkg **1468** (= #104); history **50 transaction**; term.log 0 lỗi; cache 170; lists 37; ledger GIỮ 1 dòng ts 1795542525 |
| POSTBOOT_PASS #110 (912f4a97, btime 21:13:21Z) | **ĐÃ CÓ 21:22:15Z (boot+8m54s, replay, poll=0, KHÔNG caveat)** — poll đầu REPLAY_DONE → poll0 exit=0; verify độc lập exit=0; GST 269=269 **thư mục thật**; **tools CÀI**; dpkg **1468** (= #104/#109); history **50 transaction**; cache 170; lists 37 |
| Replay #109 | **KHÔNG ĐÌNH TRỆ** — heal boot+5m07s (**SỚM**); replay chạy thật 20:35–20:49Z (dpkg 2 → 1468); 50 transaction; GST thư mục thật |
| POSTBOOT_PASS #108 (7ea9d047) | **KHÔNG CÓ — KHÔNG THỬ REPAIR** (boot đã chết theo #109; dpkg.log/history #108 mất; không watcher nào sống trên #108 sau poll cuối watcher-186 19:10:05Z; cửa sổ repair-sớm 19:24:52Z trôi qua không watcher; tiền lệ #100/#83 (b2)); **tổng 23 → 24 → 25 nếu parent chấp nhận #105 + #108** |
| Replay #108 | **KHÔNG XÁC ĐỊNH ĐƯỢC** — không selfcheck/harness/watcher nào ghi dpkg/libs/GST trên #108 trong hồ sơ lưu (§5.2); chuỗi đình trệ xen kẽ KHÔNG nối tiếp được qua #108 |
| POSTBOOT_PASS #104/#102/#101/#99/#98/#96/#95 | **VẪN CÓ** (replay/repair/replay/repair/repair/replay — mtime + md5 KHÔNG ĐỔI); #107 VẪN CÓ (repair, poll=1, caveat — backup byte-identical) |
| POSTBOOT_PASS #97/#100/#103/#105 | **VẪN KHÔNG CÓ** — grep 0 file POSTBOOT_PASS* nhắc cả bốn |
| Watcher-186 | pid 78465 **CHẾT theo #108** (poll cuối 19:10:05Z, +13 s — mẫu overlap 19, F-187-T5-1); log 171 dòng; 0 dòng END/STOP/NEWBOOT |
| Watcher-187 | START 20:47:23Z, pid **152942** — **poll đầu thấy replay đang chạy → KHÔNG repair**; **cờ #109 20:50:24Z**; **CHẾT theo #110** (poll cuối 21:13:27Z, +6 s — mẫu overlap 20, F-187-T5-3) |
| Watcher-187b | START 21:22:14Z, pid **99969**, hạn 23:35:00Z — poll đầu REPLAY_DONE → **cờ #110 21:22:15Z**; vẫn ALIVE lúc đóng (dpkg 1468 ổn định) |
| Khoảng không-watcher | **~1h37m18s** (19:10:05Z → 20:47:23Z) + **~8m47s** (21:13:27Z → 21:22:14Z) — khoảng 2 bao trọn #108 + đầu #109 |
| Hướng (3) | **VẪN ĐỨNG lần thứ 34 liên tiếp** (user@0 static, không linger, không cron, không /run/user/0, 0 timer VCut, 0 unit VCut) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#110 = 62 reboot** theo cách đếm T0-186 (61 theo T2-186 — parent quyết, F-187-T5-2) |
| ENOSPC | #109: **12 dòng lúc ~20:51Z** (dòng đầu 20:37:12Z, boot+6m39s); #110: **6 dòng lúc ~21:23Z** (dòng đầu 21:15:07Z, boot+1m46s; T9 đếm chính thức) |
| X11 | **TRỐNG lúc mở (~20:44Z)** — 0 Xvfb |
| RAM #109/#110 | MemAvailable #109 **1.110.816 kB (20:43Z) → 1.749.972 kB (20:50Z)**; #110 **1.441.008 kB (21:19Z) → 1.518.440 kB (21:23Z)** (giao T9) |
| Đồng hồ | Local ≈ Cloudflare **+1 s** (2 lap 20:50Z — trong trễ curl); T0-187 20:43Z: +2 s |
| Quy tắc B4 | **T5-187 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 lần configure/install/update/repair tay) — replay #109/#110 chạy HOÀN TOÀN bởi host; KHÔNG THỬ repair #108 (boot đã chết) |
| F-175-T5-3 | **VẪN ĐÃ SỬA, còn đúng** (script postboot không đổi; log poll0 + independent #109/#110 in dòng live đầu tiên) |

**Số hiệu boot #108/#109/#110 CHƯA QUYẾT — T0-186: cea79500=#107 → 7ea9d047=#108 → 6f1d9f87=#109 → 912f4a97=#110; T2-186: cea79500=#106 → 7ea9d047=#107 → 6f1d9f87=#108 → 912f4a97=#109 (F-187-T5-2). T5 dùng cách đếm theo brief (T0-186) + trình số thô (boot_id, btime). Parent quyết ở §12.3 aggregate 186 (T10 đóng ~21:01Z, §12.3 TRỐNG).**
**T5 KHÔNG phán (m), chỉ trình số thô — (m) #108/#109/#110 + INSIDE #108/#109/#110 thuộc T2-187 + parent.**

---

## §1. Timeline (giờ Z, 24/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 17:19:50Z | Reboot #107 (cea79500 — T0-186 XÁC NHẬN 9 nguồn); gap #106→#107 chờ T0-186 |
| 17:48:46Z | Cờ #107 ghi (repair-sớm-quyết-h, poll=1, CÓ caveat); watcher-186 pid 78465 tiếp tục chạy |
| 19:09:52Z | **Reboot #108 (7ea9d047-963a-4dec-a864-643cf2f01c47 — số hiệu CHƯA QUYẾT, F-187-T5-2)**; gap #107→#108 = 6.602 s (T7/T8/T9-186 + T0-187 KHỚP) |
| 19:10:05Z | **Poll cuối watcher-186** (+13 s sau btime #108 — mẫu overlap 19, F-187-T5-1); log dừng tại đây, 171 dòng, 0 dòng END/STOP/NEWBOOT |
| 19:10:31Z | Requeue run 187 eid 10818 = btime #108 +39,438 s ((m) #108 thô — T7-186/T0-187 KHỚP) |
| 19:24:52Z | Cửa sổ repair-sớm #108 (boot+15m) trôi qua — KHÔNG có watcher nào sống để repair |
| 20:17:06Z | Run 187 **FAILED** (worker báo chưa xong — T10-186 chưa spawn trong run đó; timed_out false, KHÔNG phải timeout; cf 202 s — ứng viên CA mới, T7-187 phán) |
| 20:30:33Z | **Reboot #109 (6f1d9f87 — số hiệu CHƯA QUYẾT)**; gap #108→#109 = 4.841 s (T0-187 KHỚP) |
| 20:35:40Z | Heal #109: dpkg.log 2 dòng "startup packages configure" (boot+5m07s — **SỚM**); replay shell (pid 790) + apt-get update (pid 811) ĐANG CHẠY |
| 20:35:51Z | Lượt cron đợt 187 mở; run 188 dispatch (boot_gen thuộc T0/T7) |
| ~20:44Z | **T5-187 mở trên #109**: dpkg.log 2 dòng lúc mở đã thành 513 lúc spawn watcher; /var/log/apt KHÔNG TỒN TẠI; cache 169; lists 3; GST 0; libevent VẮNG (T0-187 20:43:19Z); X11 TRỐNG lúc mở |
| 20:47:23Z | **Watcher-187 START, pid 152942** (khoảng không-watcher ~1h37m18s); poll đầu dpkg 513, apt-get + dpkg ĐANG CHẠY → **KHÔNG repair, chỉ poll** |
| 20:49:54Z | dpkg.log **1468 dòng, 0 proc** (replay xong installs; GST 269; cache 170; lists 37) |
| 20:50:24Z | **CỜ #109 GHI (replay, poll=0, KHÔNG caveat)**; backup cờ cũ #107 thành `POSTBOOT_PASS-cea79500` (byte-identical); T5 verify độc lập ~20:51Z: **exit=0** |
| 21:13:21Z | **Reboot #110 (912f4a97-0841-47eb-805f-d7bbccaecd17 — số hiệu CHƯA QUYẾT)**; gap #109→#110 = 2.568 s |
| 21:13:27Z | **Poll cuối watcher-187** (+6 s sau btime #110 — mẫu overlap 20, F-187-T5-3); watcher-187 + poller T4-187 CHẾT theo reboot (poller đã thoát sau attempt1 HỢP LỆ 21:09:27Z — 20/20 + B 5/5, tickCost median 39,0 ms) |
| 21:14:04Z | Heal #110 (boot+43s — **RẤT SỚM**); replay xong 21:16:23Z: dpkg **1468, 0 proc** (50 transaction; GST 269) |
| 21:22:14Z | **Watcher-187b START, pid 99969** (khoảng không-watcher ~8m47s); poll đầu REPLAY_DONE → **CỜ #110 GHI 21:22:15Z (replay, poll=0, KHÔNG caveat)**; backup cờ #109 (byte-identical); verify độc lập ~21:23Z: **exit=0** |
| ~21:24Z | T5 viết LIMITS này (bản cập nhật sau reboot #110). Watcher-187b vẫn ALIVE (pid 99969). |

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 34 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở (~20:44Z): `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không linger (`/var/lib/systemd/linger/` không tồn tại); không `/run/user/0`; `systemctl list-timers` 0 timer VCut; không unit VCut nào ở /etc/systemd/system hay /etc/systemd/user. Lần thứ 34 liên tiếp hướng (3) đứng. Watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–186.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z, 239 B, md5 cb7102c0). Marker sống qua **#49–#109 = 61 reboot theo cách đếm T0-186** (60 reboot theo T2-186 — parent quyết, F-187-T5-2).

**Đồng hồ (2 lap, ~20:50Z):** lap 1: CF nhanh hơn local 1 s; lap 2: +1 s — trong trễ curl. T0-187 20:43Z: +2 s (KHỚP trong trễ). **Btime ghi bằng epoch nguyên**; gap tính bằng epoch nguyên.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #109 — ĐÃ CÓ (replay-đầy-đủ, poll=0) — KHÔNG caveat

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round187-t5/POSTBOOT_PASS`, 315 B, mtime 2026-11-24T20:50:24Z, md5 a6fc7d69.
- Nội dung: `boot 6f1d9f87-7b23-4e5b-b2f5-597e6de37db4 (btime 2026-11-24 20:30:33Z; watcher-187) — replay-day-du: dpkg 1468 dong; cache 170 .deb; lists 37; postboot PASS poll0 doc lap exit 0 luc 2026-11-24T20:50:24Z; POSTBOOT_PASS moi ghi 2026-11-24T20:50:24Z poll=0 (replay-day-du); co cu cea79500 luu POSTBOOT_PASS-cea79500`.
- Backup cờ cũ: `POSTBOOT_PASS-cea79500`, 324 B — **md5 b7259902, byte-identical với file gốc round186-t5 (cờ #107)**.
- **Lịch trình (watcher tự làm, không tay):** START 20:47:23Z → poll đầu dpkg 513, apt-get + dpkg ĐANG CHẠY → **KHÔNG repair** → 20:47:53Z 1079 → 20:48:23Z 1220 (GST 269) → 20:49:23Z 1410 → 20:49:54Z **1468, 0 proc** → 20:50:24Z ổn định → **REPLAY_DONE → poll0 exit=0 → FLAG-WRITTEN cùng giây**. KHÔNG trigger EARLY-REPAIR/BACKSTOP.
- **Verify độc lập (T5, check-only, ~20:51Z):** postboot **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 thư mục thật**; **tools CÀI** (history transaction cuối); **libc-bin 2.39-0ubuntu8.12** (= #104).
- **KHÔNG caveat** (đề xuất — giống #104/#102/#99/#95): GST thư mục thật + tools cài + dpkg 1468 (= #104) + 50 transaction + term.log 0 lỗi. **Parent quyết (§9(b))** — T5 đề xuất chấp nhận **KHÔNG caveat** (tiền lệ #104).
- **Lưu ý thời gian:** cờ ghi ở boot+19m51s — replay xong 20:49:54Z, cờ ghi 30 s sau (2 poll ổn định). T4-187 vào gate0wait 20:47:32Z (trước cờ ~3') nên nhận cờ ở poll tiếp theo.
- **Cờ #110 (912f4a97, btime 21:13:21Z): ĐÃ CÓ 21:22:15Z (replay, poll=0, KHÔNG caveat)** — watcher-187b START 21:22:14Z → poll đầu REPLAY_DONE → poll0 exit=0 → FLAG-WRITTEN cùng giây (boot+8m54s — cờ nhanh nhất nhờ replay host xong trước khi watcher spawn); verify độc lập exit=0; 11/11 NEED + 5/5 lib; GST 269=269 thư mục thật; tools CÀI; dpkg 1468 (= #104/#109); 50 transaction; backup cờ #109 md5 a6fc7d69 byte-identical; cờ mới 316 B md5 302ae331. **Parent quyết (§9(b))** — đề xuất chấp nhận **KHÔNG caveat** cho cả #109 lẫn #110.

### §3.2. Cờ #108 — KHÔNG CÓ, KHÔNG THỬ REPAIR (boot đã chết — tiền lệ #100/#83 (b2))

- **#108 (7ea9d047-963a-4dec-a864-643cf2f01c47, btime 19:09:52Z):** kiểm đợt 187: `grep -rl "7ea9d047" --include="POSTBOOT_PASS*" hidden_files/` = **0 file** (exit 1; T0-187 cũng grep: "POSTBOOT_PASS 7ea9d047: 0 file"). **Tổng boot không cờ 23 → 24 → 25 nếu parent chấp nhận #105 + #108.**
- **T5-187 KHÔNG thử repair #108 — và KHÔNG THỂ thử:** (1) boot #108 đã chết theo #109 (20:30:33Z, trước khi đợt 187 mở); (2) dpkg.log/history #108 mất theo rootfs rebuild; (3) không watcher nào sống trên #108 sau poll cuối watcher-186 19:10:05Z — cửa sổ repair-sớm (19:24:52Z) trôi qua không watcher; (4) T9-186 khởi động lại daemon lúc 19:12:25–19:12:57Z nhưng đó là sampler/probe-loop, không phải watcher repair. **Tiền lệ #100 (quyết (c) đợt 183) + #83 quyết (b2): KHÔNG tự viết cờ cho boot đã chết.**
- **Lưu ý:** repair #108 ĐÃ CÓ THỂ xảy ra trong lúc #108 còn sống (cửa sổ 19:24:52Z+) — nhưng không có watcher nào sống lúc đó (T5-186 đã đóng cờ 17:54Z; đợt 187 mở sau khi #108 chết). Khoảng trống vận hành, không phải lỗi kỹ thuật: watcher-186 chết đúng luật theo reboot, không có cơ chế respawn tự động (hướng (3) đứng — §2).

### §3.3. Cờ #106 — VẪN CHƯA XÁC MINH (F-186-T0-1), KHÔNG TÍNH VÀO TỔNG

- **#106 (~15:13Z):** T0-186 KHÔNG xác minh được (không btime đo được — F-186-T0-1); không có file POSTBOOT_PASS nào cho #106 (chưa biết boot_id để grep). **#106 KHÔNG tính vào tổng boot không cờ** (chỉ đếm boot đã xác minh). T0-187 không thêm dữ kiện mới.

### §3.4. Cờ #97 / #100 / #103 / #105 — VẪN KHÔNG CÓ (đã xác nhận, không bù được)

- **#97 (9e440707) / #100 (7a83ab15) / #103 (e0921bda) / #105 (053a35c3):** kiểm lại đợt 187: grep 0 file POSTBOOT_PASS* nhắc cả bốn (exit 1). **Tổng 23 → 24 → 25** — **cả hai bước CHỜ parent chấp nhận** (§12.3-186 TRỐNG — T10 đóng ~21:01Z, parent chưa quyết; #108 thuộc §12.3-187).

### §3.5. Cờ #110 / #109 / #107 / #104 / #102 / #101 / #99 / #98 / #96 / #95 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #110 (912f4a97) | round187-t5/POSTBOOT_PASS, 21:22:15Z | **MỚI đợt này** — replay, poll=0, KHÔNG caveat (đề xuất); md5 302ae331 |
| #109 (6f1d9f87) | round187-t5/POSTBOOT_PASS-6f1d9f87, 20:50:24Z | replay, poll=0, KHÔNG caveat (đề xuất); md5 a6fc7d69 — **backup byte-identical** |
| #107 (cea79500) | round186-t5/POSTBOOT_PASS, 17:48:46Z | repair, poll=1 — parent quyết §12.3-186 (CHƯA CÓ); **KHÔNG ĐỔI** (b7259902) |
| #104 (9161bfd1) | round185-t5/POSTBOOT_PASS, 11:42:15Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 185 KHÔNG caveat; **KHÔNG ĐỔI** (8e6d6e5d) |
| #102 (6ecd948e) | round184-t5/POSTBOOT_PASS, 08:43:59Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 184 KHÔNG caveat; **KHÔNG ĐỔI** (6007fea8) |
| #101 (51745634) | round183-t5/POSTBOOT_PASS, 05:56:42Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 183 CÓ caveat; **KHÔNG ĐỔI** (8c32fc3c) |
| #99 (9897d4b4) | round182-t5/POSTBOOT_PASS, 02:55:07Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 182 KHÔNG caveat; **KHÔNG ĐỔI** (3d031656) |
| #98 (e62eef3f) | round181-t5/POSTBOOT_PASS, 00:16:31Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 181 CÓ caveat; **KHÔNG ĐỔI** (26452ec1) |
| #96 (8d2a69df) | round180-t5/POSTBOOT_PASS, 22:08:08Z | repair, poll=1 — parent CHẤP NHẬN (c) đợt 180 CÓ caveat; **KHÔNG ĐỔI** (50869e4e) |
| #95 (95b483a2) | round180-t5/POSTBOOT_PASS-95b483a2, 20:59:47Z | replay, poll=0 — parent CHẤP NHẬN (c) đợt 180 KHÔNG caveat; **KHÔNG ĐỔI** (f8cd6d46) |
| #92/#90/#89/#86/#85/#84 | theo T5-185, không kiểm lại đợt này | VẪN CÓ — không đổi từ đợt 185 |

### §3.6. Watcher-186 — CHẾT theo #108 + Watcher-187 — CHẾT theo #110 + Watcher-187b đang chạy

- **Watcher-186, pid 78465** (spawn 17:46:20Z trên #107): poll cuối **19:10:05Z, +13 s sau btime #108** (mẫu overlap thứ 19, **F-187-T5-1**); log 171 dòng; 0 dòng END/STOP/NEWBOOT. Poll trước 19:09:35Z (trước btime 17 s). **Poll cuối vẫn đọc boot_id cũ cea79500** — cùng hiện tượng F-186-T5-1 (+24 s); chéo kiểm sampler T9 (F-186-T9-3: mẫu cuối 19:10:08Z +16 s → đồng hồ cell NHANH ≥16 s).
- **Khoảng không-watcher ~1h37m18s** (19:10:05Z → 20:47:23Z) — bao trọn #108 + đầu #109 (ngắn hơn đợt 186: ~4h32m).
- **Watcher-187 (boot #109) — ĐÃ XONG nhiệm vụ chính, CHẾT theo #110:** spawn 20:47:23Z, pid **152942**. Khởi tạo: dpkg 513, md5 f45b20fe, cache 170, lists 37, gst_sys 32. **Poll đầu thấy replay đang chạy → KHÔNG repair** → **FLAG-WRITTEN 20:50:24Z** (replay, poll=0). Poll cuối 21:13:27Z (+6 s sau btime #110 — mẫu overlap 20, F-187-T5-3); log 58 dòng; 0 END/STOP/NEWBOOT. **CHẾT theo reboot #110 21:13:21Z** (không dòng END — chết đúng luật, giống watcher-186 theo #108).
- **Watcher-187b (boot #110) — ĐANG CHẠY, đã làm xong nhiệm vụ chính:** spawn 21:22:14Z, pid **99969**, hạn 23:35:00Z. Khởi tạo: dpkg 1468, md5 14275d5c, mtime 21:16:23Z, cache 170, lists 37, gst_sys 269. **Poll đầu REPLAY_DONE → FLAG-WRITTEN 21:22:15Z** (replay, poll=0). **Poll sau cờ đều 30 s** (dpkg 1468 ổn định — kiểm tới 21:23:17Z). Watcher vẫn ALIVE lúc T5 đóng — T5-188 tiếp quản.
- **T4-187 vào gate0wait TRƯỚC khi cờ #109 ghi** (poll-wait pid 158695 từ 20:47:32Z; cờ 20:50:24Z — T4 nhận cờ ở poll tiếp theo; attempt1 HỢP LỆ 21:09:27Z rồi poller thoát — TRƯỚC reboot #110; poller cũng CHẾT theo #110). X11 trống lúc T5 mở.

---

## §4. Boot #109/#110 + F-187-T5-1 + F-187-T5-2 + F-187-T5-3

### §4.1. Boot #109 (6f1d9f87) — số thô (T0-187 đối chiếu KHỚP)

- #109: boot_id đầy đủ `6f1d9f87-7b23-4e5b-b2f5-597e6de37db4`; btime **20:30:33Z** (epoch **1795552233** — /proc/stat; `uptime -s` khớp 20:30:33Z; journal chỉ idx 0 (first entry 20:30:44Z = btime +11 s); /proc/1 mtime 20:30:44.227Z = btime +11,227 s; start_ticks 1088 = btime +10,88 s — T0-187). `/tmp/.X11-unix` trống lúc mở; marker không đổi.
- **Gap #107→#108 = 6.602 s; gap #108→#109 = 4.841 s** (T7/T8/T9-186 + T0-187 KHỚP) — 2 gap liên tiếp dưới mẫu ~7.200 s.
- #110: boot_id đầy đủ `912f4a97-0841-47eb-805f-d7bbccaecd17`; btime **21:13:21Z** (epoch **1795554801** — /proc/stat + `uptime -s` KHỚP; journal idx 0 first entry 21:13:32Z = btime +11 s). **Gap #109→#110 = 2.568 s** — NGẮN NHẤT từ trước tới nay. Số hiệu chờ T0-188 (9 nguồn).
- **Số hiệu #108/#109/#110 CHƯA QUYẾT** (F-187-T5-2) — T5 chỉ trình số thô, theo cách đếm brief (T0-186).
- **T5 KHÔNG phán (m)** — thuộc T2-187 + parent; (m) #110 thuộc T2-188. Số thô: **(m) #109 = 0 requeue** trong [20:29:00Z, 20:33:00Z], 0 event mới trong [20:25:00Z, 20:45:00Z] ngoài reconciled/dispatched run 188 + feed-pulse-03; không run nào spanning (run 187 finished 20:17:06Z trước btime; run 188 started 20:35:51Z sau btime) — T0-187. **(m) #108 thô +39,438 s** (requeue eid 10818, 19:10:31.438Z — T7-186/T0-187 KHỚP).

### §4.2. F-187-T5-1 (mới) — Overlap poll-cuối-sau-btime, mẫu 19 (+13 s) + chéo kiểm sampler

Watcher-186 pid 78465 đọc được boot_id cũ 13 s sau btime mới (đã giải thích ở F-172-T5-1). Mẫu thứ 19 — chuỗi **11 → 20 → 23 → 9 → 8 → 36 → 7 → 3 → 17 → 22 → 26 → 24 → 29 → 22 → 6 → 17 → 9 → 24 → 13 s**; poll cuối 19:10:05Z, dpkg/md5 khớp #107 (xem đính chính số dưới); poll trước 19:09:35Z, trước btime 17 s. **Không ảnh hưởng verdict.**
- **Chéo kiểm độc lập (F-186-T9-3):** sampler T9 mẫu cuối 19:10:08Z (+16 s, đọc boot_id TƯƠI mỗi mẫu, FULL UUID) vẫn cea79500 → **đồng hồ cell NHANH ≥16 s trước reboot #108** — overlap là artifact clock-fast, không phải process sống qua reboot.
- **Caveat phương pháp (T0-187 NOTES):** T0-187 cho rằng dòng log watcher "KHÔNG phải bằng chứng độc lập (script cache BOOT8 một lần lúc khởi động, dòng 94)". **T5 kiểm lại code trên đĩa:** dòng 94 chỉ KHỞI TẠO; **dòng 114 đọc tươi `b=$(boot_now)` mỗi poll**; nhánh NEWBOOT cập nhật BOOT8 **TRƯỚC** dòng poll (dòng 131) — nên dòng poll cuối PHẢN ÁNH lần đọc tươi tại poll đó. Caveat về cơ chế của T0-187 là **KHÔNG ĐÚNG với script này**; kết luận clock-fast vẫn đứng nhờ bằng chứng sampler độc lập. Ghi nhận cho T0/T10 — không đổi verdict (m).
- **Đính chính số:** poll cuối watcher-186 đọc dpkg **768 dòng / md5 bcbec82a** (khớp #107 sau repair) — KHÔNG phải 1468 (đó là dpkg.log #109 sau replay; đừng nhầm hai boot).
- **F-187-T5-3 (mới) — Watcher-187 CHẾT theo reboot #110 + overlap mẫu 20 (+6 s):** reboot #110 (912f4a97, btime 21:13:21Z) trong lúc T5 gọn LIMITS; watcher-187 CHẾT theo reboot (poll cuối 21:13:27Z, +6 s, vẫn đọc boot 6f1d9f87 — mẫu 20: chuỗi …→24→13→**6 s**; poll trước 21:12:57Z, trước btime 24 s; log 58 dòng, 0 END/STOP/NEWBOOT). Poller T4-187 cũng CHẾT theo reboot (đã thoát sạch sau attempt1 HỢP LỆ nên không mất attempt). **Hành động:** T5 spawn **watcher-187b** ngay (21:22:14Z, pid 99969) vì đợt 187 vẫn mở + boot #110 còn sống + cửa sổ repair-sớm (21:28:21Z) sắp tới — khoảng không-watcher lần 2 chỉ ~8m47s. **Không ảnh hưởng verdict.**

### §4.3. F-187-T5-2 (mới) — Số hiệu boot LỆCH giữa T0-186 và T2-186 — parent quyết §12.3-186

- **Hai cách đếm:** T0-186: cea79500=#107 → 7ea9d047=#108 → 6f1d9f87=#109; T2-186: cea79500=#106 → 7ea9d047=#107 → 6f1d9f87=#108 (T0-187 NOTES — "Số hiệu: CHƯA QUYẾT"). Gốc lệch: #106 CHƯA XÁC MINH (F-186-T0-1 — T0-186 không đếm #106 vì không btime đo được; T2-186 đếm vào chuỗi).
- **Hệ quả số:** marker sống 62 reboot (#49–#110) theo T0-186, 61 reboot (#49–#109) theo T2-186; tổng boot không cờ tính theo boot_id nên KHÔNG đổi theo cách đếm. **T5 dùng cách đếm brief (T0-186) trong file này + luôn kèm boot_id/btime để đối chiếu.** Parent quyết ở §12.3 aggregate 186 (T10-186 đóng ~21:01Z, aggregate 96.703 B, §12.3 TRỐNG — parent quyết sau).

### §4.4. F-186-T5-3 diễn biến — Heal #109 SỚM, chuỗi heal muộn DỪNG ở 2

- Heal #109 ở **boot+5m07s** (20:35:40Z) — **SỚM**, khác #104 (boot+21m57s) và #107 (boot+15m56s) MUỘN. Chuỗi heal muộn DỪNG ở 2. Heal #110 còn sớm hơn (boot+43s, 21:14:04Z).
- **/var/log/apt VẪN VẮNG lúc T5 mở (~20:44Z)** — tái diễn lần 2 sau #107 (F-186-T5-3): replay đã chạy (apt-get update pid 811) nhưng chưa có transaction nào ghi history. Sau replay, /var/log/apt đã có (history 50 transaction, term.log, eipp.log.xz). **Không suy diễn thêm; giao nợ host-side quyết (k) đợt 174.**

### §4.5. F-177-T5-3 vẫn đúng (không kiểm lại đợt này)

`who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T5 dùng **epoch /proc/stat làm chuẩn**; T0-187 làm rõ bằng 9 nguồn. Ghi nhận lần 12 (#90, #92, #94, #95, #98, #99, #101, #102, #104, #107, #109, #110).

### §4.6. F-178-T7-4 — ĐÃ LÀM RÕ (T0-179): gen #109 thuộc T0/T7.

---

## §5. Replay #109/#110 CHI TIẾT + replay #108 KHÔNG XÁC ĐỊNH ĐƯỢC + ledger

### §5.1. Replay #109 CHẠY ĐỦ — KHÔNG ĐÌNH TRỆ

- **Hoạt động:** heal **20:35:40Z (boot+5m07s)** viết 2 dòng "startup packages configure" rồi replay chạy ngay: apt-get update (pid 811) + replay shell (pid 790) từ 20:35Z; dpkg 2 → 513 (20:47:23Z) → 1079 → 1220 → 1320 → 1410 → **1468 (20:49:54Z, 0 proc)** — installs liên tục, KHÔNG đóng băng giữa chừng. **GIỐNG #104/#102 replay** (host tự chạy đủ), **KHÁC #101/#98/#96 repair** (watcher repair thay replay host).
- **Journal #109: 0 entry os-intent/apt/dpkg** (chỉ idx 0; first entry 20:30:44Z = btime +11 s) — GIỐNG #101/#102/#104. Replay #109 CHẠY ĐỦ (4 nguồn độc lập) → **journal trống là đặc điểm host, KHÔNG phải bằng chứng đình trệ.**
- **Sau replay:** dpkg.log **1468 dòng** (mtime 20:49:40Z; md5 0ce9082a); **213 "status installed"**, **436 "configure"** — **KHỚP HỆT #104 replay (213/436)**; **apt history: 50 transaction** (KHÁC #107 repair: 1 transaction; = #104 replay: 50); gói cuối Install gstreamer1.0-tools, End-Date 20:49:40Z; **term.log 0 lỗi**. Cache 169 → **170 .deb**; lists 3 → **37** (KHÁC #104: 39; KHÁC #107 repair: 75). **GST thư mục thật, tools CÀI** (xem §3.1).
- **Postboot poll0 (20:50:24Z, exit=0):** PASS wrapper/libs/GST/apt — **11/11 gói NEED** + 5/5 lib (verify độc lập khớp); GST 269=269 **thư mục thật**; **tools CÀI**; **libc-bin 2.39-0ubuntu8.12**.
- **Replay #110 CHẠY ĐỦ — NHANH NHẤT:** heal **21:14:04Z (boot+43s)**; installs 21:14:37–21:16:23Z (~2 phút, cache-hot); dpkg **1468** (213/436), **50 transaction**, term.log 0 lỗi — **KHỚP HỆT #104/#109** (chi tiết §3.1). Journal #110: 0 entry os-intent/apt/dpkg (idx 0; first entry 21:13:32Z = btime +11 s).

### §5.2. Replay #108 KHÔNG XÁC ĐỊNH ĐƯỢC — nợ host-side quyết (k) đợt 174 VẪN MỞ

- **Phạm vi tìm kiếm (T5-187, grep toàn `hidden_files/`, 869 s):** `7ea9d047` chỉ xuất hiện ở build-loop-log, appendix + `.done` T7/T9-186, NOTES/appendix + boot-survey T0-187, preflight T4-187, script watcher-187 — **0 file nào ghi dpkg/libs/GST trên #108**; T9-186 chỉ ghi RAM (42 mẫu)/ENOSPC (31 dòng)/daemon chết + khởi động lại 19:12:25–19:12:57Z; T7-186 chỉ ghi requeue +39,438 s + sleep SIGTERM (F-186-T7-2) + run 187 viết lại ×1 tại #108; T8-186 không chạy harness trên #108 (6/6 trên #107); watcher-186 chết 19:10:05Z — **không poll nào trên #108**; dpkg.log/history #108 mất theo rootfs rebuild; ledger GIỮ ts 1795542525 suốt phiên #108 — **không phân biệt được sau F-185-T5-2**.
- **Kết luận: KHÔNG XÁC ĐỊNH ĐƯỢC replay #108 đình trệ hay chạy đủ — KHÔNG ghi khống theo hướng nào.** Chuỗi đình trệ xen kẽ (#102 không, #103 có, #104 không, #105 KHÔNG XÁC ĐỊNH ĐƯỢC, #107 repair — không phải replay host) **KHÔNG nối tiếp được qua #108** — #108 là mắt xích thiếu dữ kiện, không phải mắt xích đình trệ hay không đình trệ; #109/#110 KHÔNG ĐÌNH TRỆ (xem §5.1). **Nguyên nhân đình trệ #100/#101/#103 VẪN CHƯA TÌM RA trong cell** → **vẫn nợ host-side** theo quyết (k) đợt 174. #106 cũng không có dữ kiện replay nào (không thread nào sống) — vẫn CHƯA XÁC MINH.
- **Caveat cho T10/parent:** đừng đọc "ledger GIỮ ts 1795542525" thành bằng chứng #108 đình trệ — replay #109 chứng minh replay chạy đủ cũng có thể không thêm dòng ledger; và đừng đọc "ENOSPC 31 dòng trên #108" thành bằng chứng replay — ENOSPC là lỗi inotify, không liên quan apt.

### §5.3. Ledger — replay #109 KHÔNG thêm dòng (xác nhận F-185-T5-2)

- ledger.jsonl lúc T5 đóng: **1 dòng, ts 1795542525 (repair #107), added 170 — GIỮ NGUYÊN** qua replay #109/#110. **Replay #109/#110 KHÔNG compact/không thêm dòng** — GIỐNG replay #104 (F-185-T5-2), KHÁC repair #107 (F-186-T5-2: APPEND dòng mới). **T2/T10 lưu ý: ts 1795542525 là của repair #107, KHÔNG phải btime #109/#110** (epoch 1795552233/1795554801).

---

## §6. Quy tắc đứng (B4 + hướng (3)) + F-175-T5-3 còn đúng

### §6.1. B4 GIỮ NGUYÊN (replay #109/#110 chạy HOÀN TOÀN bởi host; T5 không probe tay chạm dpkg; KHÔNG THỬ repair #108 — boot đã chết)

- T5-187 **KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** — 0 lần configure/install/update/repair tay (replay #109/#110 chạy bởi host). Verify độc lập ~20:51Z + ~21:23Z — **chỉ đọc**, không giữ lock dpkg — **0 VI PHẠM F-175-T4-2 phía T5**. Chuỗi 0 vi phạm phía T5 giữ từ đợt 179 (chuỗi toàn đợt: parent quyết (p) đợt 185: 0 → 1; đợt 186 chờ parent quyết §12.3-186).
- **Thứ tự an toàn:** cờ #109 ghi 20:50:24Z, SAU khi T4-187 bắt đầu gate0wait (20:47:32Z) ~3' — T4 nhận cờ ở poll tiếp theo, đúng chiến lược (h). **Kiểm gate trước VÀ trong lúc script dài chạy (F-184-T2-8):** trước khi spawn, T5 kiểm round-in-progress.md (KHÔNG tồn tại) + pgrep (T4 vào gate0wait SAU watcher 9 s); trong lúc replay chạy, T5 chỉ làm việc đọc — 0 script nặng, 0 probe dpkg ngoài watcher.
- **Khởi động daemon theo F-182-T9-1 + F-167-T5-2:** watcher-187 spawn bằng đường dẫn TUYỆT ĐỐI, `nohup bash /abs/path/replay-watch-187.sh > /abs/path/replay-watch-187.nohup.log 2>&1 & disown`; verify bằng ps (pid 152942) + START line + poll đầu (thấy replay đang chạy → không repair). **Watcher-187b spawn tương tự** (ps pid 99969 + START line + poll đầu REPLAY_DONE). **0 daemon khác do T5 spawn đợt này.**
- **Đổi tên script theo F-184-T8-1:** T5-187 KHÔNG dùng `sed` thay token mù — header viết mới bằng python, phần code chỉ thay 8 chuỗi đích danh; khối LOGS không bị đụng. Hai lần assert đầu sai do đếm token (LOG dùng $DIR; comment OLD_T5_DIR) — đã sửa assert theo đếm đúng trước khi ghi file; script `bash -n` OK.
- **Hướng (3) đứng lần thứ 34** (§2). G1 chờ user (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (0 thử lần thứ 40 — theo T9 đợt 186). File oversize 6,4 MB chưa quyết số phận.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file (§11).

### §6.2. F-175-T5-3 — VẪN ĐÃ SỬA, còn đúng (không đổi file đợt này)

- Kiểm lại đợt 187: script postboot không đổi từ đợt 176; log poll0 + independent #109/#110 có dòng đầu là dòng live mới, rồi PASS + KẾT LUẬN, exit=0 — dòng DOT-151 cứng KHÔNG còn xuất hiện. **Vẫn đóng**.

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #109 (giao T9):** MemAvailable **1.110.816 kB (~20:43Z) → 1.749.972 kB (~20:50Z)** — TĂNG sau replay; MemTotal 8.124.896 kB.
**ENOSPC #109 (T9 đếm chính thức):** **12 dòng lúc ~20:51Z** (dòng đầu 20:37:12Z, boot+6m39s — sớm hơn #107/#104; nhịp ~70 s/dòng); lỗi VẪN TĂNG lúc đóng. Giao T9-187.
**X11:** **Trống lúc mở (~20:44Z)** — 0 Xvfb. T4-187 poll-wait pid 158695 từ 20:47:32Z (không spawn X trước khi có cờ).
**Journal #109:** chỉ idx 0 (boot 6f1d9f87); first entry 20:30:44Z (btime +11 s); 0 entry os-intent/apt/dpkg (xem §5.1).
**RAM #110 (giao T9):** MemAvailable **1.441.008 kB (~21:19Z) → 1.518.440 kB (~21:23Z)**; MemTotal 8.124.896 kB.
**ENOSPC #110 (T9 đếm chính thức):** **6 dòng lúc ~21:23Z** (dòng đầu 21:15:07Z, boot+1m46s — SỚM NHẤT từ trước tới nay).
**Journal #110:** chỉ idx 0 (boot 912f4a97); first entry 21:13:32Z (btime +11 s); 0 entry os-intent/apt/dpkg (xem §5.1).

---

## §8. Nợ mở chuyển đợt 188

1. **(m) #108/#109/#110 + INSIDE #108/#109/#110** — T2-187 + parent 187 ((m) #108 thô +39,438 s; (m) #109 thô 0 requeue).
2. **Số hiệu #108/#109/#110** — T0-187 xác minh 9 nguồn (#109) + **parent quyết numbering (F-187-T5-2)** ở §12.3 aggregate 186 (T10 đóng ~21:01Z, §12.3 TRỐNG).
3. **Cờ #109 + #110 (replay, poll=0, KHÔNG caveat)** — parent quyết §9(b). **Cờ #108 KHÔNG CÓ — KHÔNG THỬ REPAIR** — tổng 23 → 24 → 25; **#97/#100/#103/#105 VẪN KHÔNG CÓ; #106 VẪN CHƯA XÁC MINH** (F-186-T0-1).
4. **Replay #108 KHÔNG XÁC ĐỊNH ĐƯỢC** (§5.2); nợ host-side quyết (k) đợt 174 VẪN MỞ; heal SỚM #109, RẤT SỚM #110 (boot+43s) — theo dõi boot sau.
5. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 31, T2-187). **(m) #56 lần 30** — T2-187.
6. **Balloon trên #109/#110** — T9-187 (E-229 kết thúc bởi reboot #106; E mới trên #108/#109 thuộc T9-187).
7. **Watcher-187b vẫn chạy trên #110** (pid 99969, hạn 23:35:00Z) — T5-188 tiếp quản; nếu reboot mới, spawn watcher mới theo mẫu.
8. **Prune lần 62** — T6-187 (F-147-T6-1 đếm lại từ 0).
9. **Run 186 kết cục** — T7-187 (SUCCEEDED 14:52:42Z, +9.789 s, CA mới thứ 18); **run 187 FAILED 20:17:06Z** (cf 202 s — ứng viên CA mới); **run 188 kết cục** — T7-188.
10. **#108/#109/#110 có giết holder không** — T6-187.
11. **F-187-T5-1 (+13 s, mẫu 19) + F-187-T5-2 (numbering) + F-187-T5-3 (watcher-187 chết theo #110 + overlap mẫu 20)** — ghi nhận; T2/T10 không nhầm ts ledger với btime.
12. **F-182-T9-6** — trên #109/#110 ENOSPC vẫn tăng (12 dòng #109, 6 dòng #110) — theo dõi T9-187.
13. **Replay đình trệ #100/#101/#103 — nguyên nhân VẪN CHƯA TÌM RA trong cell** (§5.2) → **vẫn nợ host-side** (quyết (k) đợt 174).
14. **F-186-T9-3** — T0-187 xác minh (poll cuối watcher-186 +13 s; sampler +16 s).
15. **Plan B B2 / V2 (f'') / H3** — T8-187 theo dõi (B2 MỞ TỪ ĐỢT 186; V2 chính; H3 thụ động).
16. **T2-187/T4-187:** không chạy script nặng / không probe dpkg trong cửa sổ attempt (F-184-T2-8 VI PHẠM).
17. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user.
18. **F-186-T7-2** (sleep SIGTERM theo #108) + **F-186-T9-5** (exec restart theo #108) + **F-186-T9-6** (ENOSPC 0 dòng mới ~10' cuối #108) + **F-186-T0-2** (scheduler gap 8.406 s — tái diễn giống OUTAGE 179, T7-187 phán) + **F-186-T9-1** (guard bị vượt lần đầu sau 39 đợt — parent/T10 quyết) + **F-186-T9-2** (tách E-232/E-233) + **F-185-T1-1** (prose §112 — giao T1-187) + **F-185-T2-2** ((m) #104) + **F-185-T4-3** (P3-A1 SAI 4/5) + **F-185-T4-4** (labellag (b) lần 2 liên tiếp >0).

---

## §9. Đề xuất cho parent (quyết ở aggregate 187)

**(a) Chấp nhận verdict đợt 187 (phần T5)?** T5 đề xuất **CHẤP NHẬN (phần T5)** — cờ #109 + #110 đã có (replay, poll=0, KHÔNG caveat, verify độc lập exit=0), #108 KHÔNG CÓ cờ + KHÔNG THỬ REPAIR (boot đã chết; tiền lệ #100/#83 (b2)), #104/#102/#101/#99/#98/#96/#95 VẪN CÓ, #97/#100/#103/#105 VẪN KHÔNG CÓ (tổng 23 → 24 → 25 nếu chấp nhận #105 + #108), replay #108 KHÔNG XÁC ĐỊNH ĐƯỢC, watcher-187/187b chạy tốt, hướng (3) lần 34, 0 vi phạm B4 phía T5.

**(b) Cờ #109 + #110 (replay, poll=0) — CÂU HỎI QUYẾT:** #109: REPLAY_DONE → poll0 exit=0 trên boot SỐNG, verify độc lập exit=0, 11/11 NEED + 5/5 lib + GST 269=269 thư mục thật + tools CÀI + libc-bin 2.39-0ubuntu8.12 + dpkg 1468 (= #104) + 50 transaction + term.log 0 lỗi. #110: cùng profile (poll đầu REPLAY_DONE → poll0 exit=0, verify độc lập exit=0, 11/11 + 5/5, GST 269=269 thư mục thật, tools CÀI, libc-bin 2.39-0ubuntu8.12, dpkg 1468, 50 transaction, term.log 0 lỗi). **Parent chọn 1 trong 2:**
- (b1) Chấp nhận cờ #109 + #110 đứng cho gate (a) **KHÔNG caveat** — tiền lệ #104/#102/#99/#95 (profile giống hệt #104: 213/436, 50 transaction, GST thư mục thật);
- (b2) Không chấp nhận (T5 không thấy căn cứ — replay đủ mọi chỉ số; profile giống hệt #104 đã chấp nhận KHÔNG caveat).

**(c) Cờ #108 KHÔNG CÓ — T5 đề xuất parent ghi nhận KHÔNG bù được + TỔNG BOOT KHÔNG CỜ 23 → 24 → 25** (tiền lệ #100/#97/#93; quyết (b2) đợt 83). **#104/#102/#101/#99/#98/#96/#95 VẪN CÓ — mtime/md5 KHÔNG ĐỔI — chấp nhận? #106 VẪN CHƯA XÁC MINH — ghi nhận?**

**(d) Xác nhận số hiệu boot #109 (T0-187, 9 nguồn — T5 chỉ trình số thô: 6f1d9f87, 20:30:33Z, epoch 1795552233) — parent chấp nhận? #110 ghi nhận (912f4a97-0841-47eb-805f-d7bbccaecd17, 21:13:21Z, gap 2.568 s — số hiệu chờ T0-188)? #108 ghi nhận (7ea9d047-963a-4dec-a864-643cf2f01c47, 19:09:52Z, gap 6.602 s — T7/T8/T9-186 + T0-187 KHỚP)? NUMBERING: parent quyết theo T0-186 (#108/#109/#110) hay T2-186 (#107/#108/#109)?**

**(e) Replay #108 KHÔNG XÁC ĐỊNH ĐƯỢC — chuỗi đình trệ xen kẽ KHÔNG nối tiếp được qua #108; nguyên nhân đình trệ #100/#101/#103 VẪN CHƯA TÌM RA trong cell** (không manh mối mới trên #109/#110 — replay đủ của host; heal sớm/rất sớm là điểm mới) — **vẫn nợ host-side** theo quyết (k) đợt 174. Parent có muốn điều tra host-side không, hay giữ nguyên tắc (k)?

**(f) F-187-T5-1 (+13 s, mẫu 19) + F-187-T5-2 (numbering) + F-187-T5-3 (watcher-187 chết theo #110 + overlap mẫu 20) + F-177-T5-3 (lần 12) — ghi nhận, không đổi verdict (m).**

**(g) F-178-T7-4 ĐÃ LÀM RÕ (T0-179) — parent ghi nhận?** Gen #109/#110 thuộc T0/T7.

**(h) Watcher-187b vẫn chạy trên #110** (pid 99969, hạn 23:35:00Z) — T5-188 tiếp quản.

---

## §10. Sai số của chính T5-187 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-187-T5-1** | Poll cuối watcher-186 SAU btime #108 **13,0 s** (mẫu 19: 11→20→23→9→8→36→7→3→17→22→26→24→29→22→6→17→9→24→**13 s**) | Ghi nhận | Không ảnh hưởng verdict; sampler (F-186-T9-3) chéo kiểm clock-fast ≥16 s; đã kiểm lại code (§4.2) |
| **F-187-T5-2** | Số hiệu boot LỆCH giữa T0-186 (#108/#109/#110) và T2-186 (#107/#108/#109) | Ghi nhận | Không ảnh hưởng số đếm (tính theo boot_id); parent quyết §12.3-186; T5 dùng cách đếm brief + kèm boot_id/btime |
| **F-187-T5-3** | Watcher-187 CHẾT theo reboot #110 (poll cuối +6 s, mẫu 20); T5 spawn watcher-187b ngay (khoảng không-watcher ~8m47s) | Ghi nhận | Cờ #109 đã ghi trước reboot; cờ #110 do watcher-187b ghi sau; không ảnh hưởng verdict |
| §4.4 | Heal #109 SỚM boot+5m07s + #110 RẤT SỚM boot+43s (chuỗi heal muộn DỪNG ở 2) + /var/log/apt VẮNG lúc mở (tái diễn lần 2) | Ghi nhận | Không ảnh hưởng verdict: replay chạy đủ, cờ ở boot+19m51s |
| — | Hai lần assert đầu sai khi gen script watcher (đếm token) | Đã sửa trước khi spawn | Đếm đúng: LOG dùng $DIR; comment OLD_T5_DIR; `bash -n` OK |
| — | Đồng hồ: CF nhanh hơn local 1–2 s (3 lap: +2, +1, +1) | Ghi nhận | Nằm trong trễ curl |
| — | T5-187 mở muộn ~14' sau btime #109 (khoảng không-watcher ~1h37m) | Ghi nhận | Mode vẫn replay, poll=0, KHÔNG caveat |
| — | RAM chỉ đo 2 điểm; ENOSPC chỉ đếm journal (T9 đếm chính thức) | Hạn chế nhỏ | Diễn biến đầy đủ thuộc T9-187; cờ ghi trước hạn cờ ~23:00Z hơn 2 giờ |
| — | Không kiểm daemon hatch / /proc/1 mtime trực tiếp (lấy từ T0-187, đã đối chiếu) | Hạn chế nhỏ | T0-187 đo tươi 20:43:19Z KHỚP số T5 đo |

**Số liệu chính thức lấy từ log watcher-186/187/187b + log trực tiếp (poll0/independent) + dpkg/history của #109/#110 + đối chiếu T7/T8/T9-186 (hồ sơ lưu #108) + T0-187 (số thô #108/#109) + ledger.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND187_T5_INFRA_LIMITS.md` (file MỚI).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round187-t5-infra.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round187-t5/`: watcher script/log, log postboot, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push đợt 166–187: đợt 166–185 = 200/296/272/268 (quyết (r) đợt 185) + đợt 186 = 10/19/18/14 (T10-186 đóng ~21:01Z; lũy kế 748/1.294/1.124/946; chờ push 210/315/286/282) + đợt 187 (1 file này; các T khác chưa tính lúc T5 đóng) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích số liệu T5-187 (bản chính, 20:43Z – 21:24Z 24/11)

```
boot #109=6f1d9f87-7b23-4e5b-b2f5-597e6de37db4; btime_epoch=1795552233 = 2026-11-24T20:30:33Z (uptime -s KHOP; T0-187 KHOP)
boot #108=7ea9d047-963a-4dec-a864-643cf2f01c47; btime_epoch=1795547392 = 2026-11-24T19:09:52Z (T7/T8/T9-186 + T0-187 KHOP)
gap #107->#108 = 6602 s; gap #108->#109 = 4841 s

--- replay-watch-186.log (round186-t5, 171 dong) ---
pid 78465: poll cuoi=2026-11-24T19:10:05Z boot=cea79500 dpkg_lines=768 md5=bcbec82a (+13 s sau btime #108 — mau 19, F-187-T5-1); 0 dong END/STOP/NEWBOOT
sampler T9 (F-186-T9-3): mau cuoi 19:10:08Z boot=cea79500 FULL UUID (+16 s, doc tuoi) -> clock NHANH >=16 s

--- replay-watch-187.log (round187-t5) ---
START 20:47:23Z pid=152942 boot=6f1d9f87 btime=20:30:33Z end=23:35:00Z; init_lines=513 init_md5=f45b20fe init_mtime=20:47:22Z cache=170 lists=37 gst_sys=32
poll 20:47:23Z dpkg 513 apt=[149577] dpkg=[151894] (replay DANG CHAY -> KHONG repair); 20:47:53Z 1079; 20:48:23Z 1220 gst 269; 20:48:53Z 1320; 20:49:23Z 1410; 20:49:54Z 1468 md5=0ce9082a 0 proc
REPLAY_DONE 20:50:24Z poll0 exit=0; FLAG-WRITTEN 20:50:24Z mode=replay-day-du poll=0 (old=cea79500); poll sau co 30 s deu, dpkg 1468 (20:55:25Z)

boot #110=912f4a97-0841-47eb-805f-d7bbccaecd17; btime_epoch=1795554801 = 2026-11-24T21:13:21Z (uptime -s KHOP); gap #109->#110 = 2568 s
--- replay-watch-187.log (58 dong, CHET theo #110) --- pid 152942: poll cuoi=21:13:27Z boot=6f1d9f87 (+6 s — mau 20, F-187-T5-3); 0 dong END/STOP/NEWBOOT
--- replay-watch-187b.log --- START 21:22:14Z pid=99969 boot=912f4a97; poll 21:22:14Z dpkg 1468 stable -> REPLAY_DONE poll0 exit=0; FLAG-WRITTEN 21:22:15Z poll=0 (old=6f1d9f87)
--- POSTBOOT_PASS #110 --- CO 316 B md5=302ae331; backup #109 md5=a6fc7d69 = goc; dpkg #110: 1468 dong, md5=14275d5c, mtime 21:16:23Z; 213/436; 50 transaction; term.log 0 loi; GST 269; tools CAI; libc-bin 2.39-0ubuntu8.12

--- 3. POSTBOOT_PASS ---
round187-t5/POSTBOOT_PASS (#110): CO mtime=2026-11-24 21:22:15 +0000 bytes=316 md5=302ae331
round187-t5/POSTBOOT_PASS-6f1d9f87: CO (backup #109, 315 B, md5 a6fc7d69 = goc)
round187-t5/POSTBOOT_PASS-cea79500: CO (backup #107, md5 b7259902 = goc)
#107 md5=b7259902 / #104 md5=8e6d6e5d / #102 md5=6007fea8 / #101 md5=8c32fc3c / #99 md5=3d031656 / #98 md5=26452ec1 / #96 md5=50869e4e / #95 md5=f8cd6d46 — TAT CA KHONG DOI
KHONG CO file POSTBOOT_PASS nao nhac 7ea9d047 (#108) / 053a35c3 (#105) / 9e440707 (#97) / 7a83ab15 (#100) / e0921bda (#103) — da grep (exit 1)

--- 4. Marker --- CO, mtime=2026-11-20 11:39:47Z, 239 B, md5 cb7102c0; song #49-#110 = 62 reboot (T0-186) / 61 (T2-186)
--- 5. dpkg (replay #109) --- 1468 dong, md5=0ce9082a, mtime 20:49:40Z; status installed=213; configure=436 (KHOP HET #104); cache=170; lists=37; GST 269 thu muc that; history 50 transaction (cuoi Install gstreamer1.0-tools, End-Date 20:49:40Z); term.log 0 loi; tools CAI; libc-bin 2.39-0ubuntu8.12
--- 6. NEED/libs/ledger --- 11/11 NEED + 5/5 lib (verify doc lap exit=0); ledger 1 dong, ts 1795542525 added 170 (GIU — replay #109/#110 khong them dong, nhu F-185-T5-2)
--- 7. ENOSPC --- #109: 12 dong journal (20:51Z); dong dau 20:37:12Z (boot+6m39s); ~70 s/dong; #110: 6 dong (21:23Z); dong dau 21:15:07Z (boot+1m46s) (T9 dem chinh thuc)
--- 8. RAM --- #109: MemAvailable 1110816 / 1749972 kB; #110: 1441008 / 1518440 kB; MemTotal 8124896 kB
--- 9. Huong (3) --- user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; timers_vcut=0; units_vcut=0
--- 10. X11 --- TRONG luc mo; poll-wait-t4-187 pid 158695 tu 20:47:32Z (cho co)
--- 11. Dong ho --- CF lap1 +1 s, lap2 +1 s (20:50Z); T0-187 +2 s (20:43Z); trong tre curl
```
