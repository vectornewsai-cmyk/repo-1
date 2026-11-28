# PHASE 9 — ROUND 193 — T56 (GỘP T5+T6) INFRA + LOCK LIMITS

**Đợt:** 193 (mở lượt cron 00:35:51 +07 26/11/2026 = 17:35:51Z 25/11/2026; hạn cờ ~23:00Z, hạn cứng ~23:35Z). **Người viết:** T56-193 (gộp T5 infra/watcher + T6 lock health). **Chạy:** ~20:40Z → 21:35Z 25/11/2026. **Boot làm việc:** #117 ứng viên (1c0bcaad, btime 20:22:37Z — T01-193 xác minh; parent quyết (e)).
**Trạng thái:** ĐÃ XONG watcher-193 + cờ #117 (**repair-som-quyet-h, poll=1 — CÓ caveat đề xuất, NHẸ HƠN #115: GST là thư mục THẬT, không phải symlink**) + (A) **120/120 lần thứ 42** + suite 9/9 × 6 + prune lần 67 + #116 **KHÔNG GIẾT HOLDER** (chuỗi 19 → 20) + #117 **KHÔNG GIẾT HOLDER** (chuỗi → 21) + hướng (3) **lần thứ 39** + **F-193-T56-1..8**. 1 entry stage duy nhất.

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #117 ứng viên (1c0bcaad) | **ĐÃ CÓ 20:59:08Z (boot+36m31s, repair-som-quyet-h, poll=1)** — verify form-B exit=1 → --repair 1 lần (~13m17s) → poll1 exit=0 → FLAG-WRITTEN; verify độc lập exit=0; 11/11 apt + 5/5 lib; GST 269=269 **THƯ MỤC THẬT (không symlink — khác #115)**; dpkg **768**; history 1 transaction; term.log 0 lỗi |
| POSTBOOT_PASS #116 (4dda8234) | **KHÔNG CÓ** — boot chết 20:22:37Z trước khi T56-193 mở; replay #116 CÓ chạy (theo T8: dpkg 2→1468 lúc 16:22–16:28Z, selfcheck libs 6/6 + GST 269 lúc 16:26:22Z) nhưng KHÔNG AI chạy postboot verify trên #116 lúc nó sống → không viết bù được (dpkg.log đã reset); tổng boot không cờ **26 → 27** |
| Replay #117 | **KHÔNG CHẠY (dạng B, như #115)** — dpkg.log chỉ 2 dòng 20:23:13Z (boot+36s), đóng băng tới lúc repair 20:45:41Z (1.348 s); /var/log/apt KHÔNG TỒN TẠI lúc mở; lists 5; cache 0; GST 0; 0 proc apt/dpkg |
| POSTBOOT_PASS #115 (ebc5a3b9) | **VẪN CÓ**, md5 KHÔNG ĐỔI (734f8e2d); backup byte-identical ở round193-t56/POSTBOOT_PASS-ebc5a3b9 |
| Cờ cũ #114/#112/#111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95 | **VẪN CÓ** (md5 KHÔNG ĐỔI — §3) |
| Watcher-192 | **CHẾT THEO REBOOT 16:21:33Z** (poll cuối 16:21:43Z, dpkg 768 ổn định — KHÔNG có dòng END/STOP/NEWBOOT; pid 8168 chết cùng boot ebc5a3b9) |
| Watcher-193 | START 20:45:41Z, pid **6482**, hạn 23:35:00Z — **ALIVE lúc đóng** (poll 21:31:44Z) |
| Khoảng không-watcher | **~4h03m58s** (16:21:43Z → 20:45:41Z) — bao **toàn bộ đời #116 + 23 phút đầu #117** |
| Hướng (3) | **VẪN ĐỨNG lần thứ 39** |
| Marker sống | CÒN, mtime 2026-11-20 11:39:47Z không đổi, md5 cb7102c0 — sống qua **#49–#117 = 69 reboot** (nếu #117 xác nhận) |
| (A) lock | **120/120 PASS lần thứ 42** (tổng **5040/5040**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 73 → **74** |
| Lock | KHỎE (781 cặp lúc kiểm cuối, 0 đang giữ, chênh **GIỮ 12**, STALE-LOCK GIỮ 12, double-acquire GIỮ 7, 0 TIMEOUT mới, 0 "KHÔNG NHẢ"); **#116 KHÔNG GIẾT HOLDER (19 → 20)**; **#117 KHÔNG GIẾT HOLDER (→ 21)** |
| Prune lần 67 | **XÓA 3 FILE theo điều (a)** (queue 96 → 93; F-147-T6-1 chuỗi **VẪN 0 lần thứ 14**) |
| X11 / zombie | **0 zombie cả 3 snapshot (mở/giữa/cuối)**; X11 0 → 2 socket (X193, X98 — của luồng khác); Xvfb 0 → 1 → 0; ss listener 1 → 1 → 0 (xem §8) |
| Đồng hồ | Cloudflare **+0,9 s ≈ +1 s** (khớp T01-192 +1 s) — δ=1 s; khoảng trống lock gấp ~215× / ~12.399× δ → KHÔNG caveat |
| Quy tắc B4 | **T56-193 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 configure/install/update/repair tay); verify độc lập chỉ đọc |

**Số hiệu boot #117 CHƯA QUYẾT — T01-193 xác minh (parent quyết (e)).** T56 KHÔNG phán (m) — (m) #116 thuộc T2-193 + parent.

## §0. Trạng thái lúc mở (~20:40Z)

- **Boot lúc mở: `1c0bcaad-1f18-43b1-90f5-fc6319e63b29`, btime 20:22:37Z** (epoch 1795638157; `uptime -s` khớp; journal idx 0 duy nhất, first 20:22:50Z = btime +13 s; `last` reboot 20:22 still running; `who -b` Nov 25 20:22). **Số hiệu #117 ứng viên theo hệ quả (e)-192 (4dda8234 = #116).** Gap #116→#117 = **14.464 s (4h01m04s)**. **KHÔNG có reboot trong phiên T56.**
- **Replay #117 CHƯA TỚI lúc mở (dạng B):** dpkg.log 2 dòng, md5 7eff566f, mtime 20:23:13Z; /var/log/apt KHÔNG TỒN TẠI; lists 5; cache 0; GST hệ thống 0 file; libevent-2.1.so.7 MISSING (chỉ có libevent_core); 0 proc apt/dpkg/wrapper. Debroot GST 269 file CÒN.
- **Lock lúc mở: TRỐNG** (dòng cuối RELEASED 17:04:58Z t8-round192); queue 96 file / 1344 byte. **T01-193 / T4-193 CHƯA spawn lúc T56 mở** (T4-193 spawn sau, poll #1 ~20:55Z). Không có dpkg/apt nào CỦA T56.
- **Latch:** `round-in-progress.md` — T56 không kiểm latch đợt này (không thuộc nhiệm vụ T56).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 25/11/2026)

**14:23:56Z** reboot #115 (ebc5a3b9); cờ #115 đã có 14:55:05Z (T56-192, repair-som-quyet-h, poll=1, CÓ caveat). **16:21:33Z** **reboot #116 (4dda8234)**; watcher-192 chết theo reboot (poll cuối 16:21:43Z, KHÔNG có dòng END). **16:22–16:28Z** replay #116 CHẠY (theo T8-192 §D4: dpkg 2 → 1.468); selfcheck #2 T8 lúc 16:26:22Z: libs 6/6 + GST 269 + dpkg 1.468 ổn định — **nhưng KHÔNG AI chạy postboot verify → KHÔNG có cờ #116**. **20:22:37Z** **reboot 1c0bcaad (#117 ứng viên)**; gap #116→#117 = 14.464 s (4h01m04s). **20:23:13Z** dpkg.log 2 dòng (boot+36s) — rồi IM HOÀN TOÀN. **20:45:41Z** **watcher-193 START, pid 6482** (khoảng không-watcher ~4h03m58s); poll đầu: dpkg 2 dòng, đóng băng 1347 s → **EARLY-REPAIR TRIGGER** (boot+23m04s) → verify form-B exit=1 → **--repair**. **20:45:42Z** --repair bắt đầu (apt-get update ~12 phút, mirror chậm; install ~1 phút, 11 gói). **20:59:07Z** history.log End-Date; dpkg.log 2 → **768 dòng**; GST 269; cache 107; lists 75. **20:59:08Z** postboot poll1 sau repair **exit=0** → **FLAG-WRITTEN 20:59:08Z** (boot+36m31s, repair-som-quyet-h, poll=1). **21:04:37Z** t01-round193 ACQUIRED (O8 đợt 193, hold 184 s → RELEASED 21:07:41Z). **~21:01Z** T56 verify độc lập: postboot **exit=0** (11/11 apt + 5/5 lib + GST 269 thư mục thật). **21:14:40Z** T4-193 mở cửa yên #39 → attempt1 (lock 21:14:41Z) — chunk 3 harness của T56 bị monitor kill 21:14:51Z (xem §6 / F-193-T56-3). **21:25:41Z** T4 attempt3 RELEASED (hết 3 attempt/đợt — poller thoát; xem §6). **~21:35Z** T56 viết LIMITS này. Watcher-193 vẫn ALIVE (pid 6482, poll 21:31:44Z). T4-193 poller ĐÃ THOÁT.

### §1.2. Cờ #117 ứng viên — ĐÃ CÓ (repair-som-quyet-h, poll=1) — CÓ caveat (đề xuất, parent quyết)

- **Cờ:** `hidden_files/round193-t56/POSTBOOT_PASS`, 324 B, mtime 2026-11-25T20:59:08Z, md5 **46e0b657** (FULL boot_id, btime 20:22:37Z, repair-som-quyet-h, poll=1). Backup cờ cũ: `POSTBOOT_PASS-ebc5a3b9`, 324 B — **md5 734f8e2d, byte-identical với cờ #115 gốc**.
- **Lịch trình:** replay KHÔNG chạy (dạng B) → watcher spawn 20:45:41Z (boot+23m04s) thấy dpkg 2 dòng đóng băng 1347 s (≥600 s), 0 apt/dpkg → **EARLY-REPAIR TRIGGER ngay poll đầu** theo chiến lược (h) quyết parent đợt 150 + (c) đợt 184 → verify form-B exit=1 (20:45:42Z, thiếu 5 lib + GST + 11 gói apt) → --repair 1 lần duy nhất (apt-get update ~12 phút, mirror chậm; install 11 gói ~1 phút) → poll1 exit=0 → **FLAG-WRITTEN 20:59:08Z**. KHÔNG trigger BACKSTOP. **1 repair / 1 boot** (guard `repaired-1c0bcaad`).
- **Verify độc lập (T56, check-only, ~21:01Z):** postboot **exit=0** — wrapper PASS (đã vá K1); **5/5 lib PASS**; GST **269=269 (THƯ MỤC THẬT — KHÔNG phải symlink như #115, xem F-193-T56-2)**; **11/11 gói apt PASS**; KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. **Caveat (đề xuất — tiền lệ #111/#115 repair-sớm, poll=1):** cờ này là **repair-som-quyet-h, KHÔNG phải replay-đầy-đủ**; GST thật nên caveat NHẸ HƠN #115 (chỉ còn mode repair + poll=1). **Parent quyết CÓ caveat hay KHÔNG caveat.** Nội dung PASS là thật (verify độc lập exit=0), chỉ mode khác profile #114.
- **T4-193 đã thấy postboot PASS qua ĐƯỜNG CHÍNH:** poll #19 (20:59:35Z) t5flag=PASS, gate0=T5 — **fix (p)-191 CUỐI CÙNG ĐÃ ÁP DỤNG** (xem F-193-T56-1); postboot_exit=0 từ poll #21 (21:01:05Z).

### §1.3. Cờ #116 KHÔNG CÓ (không bù được) + cờ #115 VẪN CÓ

- **#116 (4dda8234): KHÔNG CÓ cờ — tổng boot không cờ 26 → 27.** Boot #116 sống 16:21:33Z → 20:22:37Z (4h01m04s); replay CÓ chạy (chứng cứ T8-192 §D4: dpkg 2 → 1.468 trong 16:22–16:28Z; selfcheck #2 lúc 16:26:22Z: libs 6/6 + GST 269 + dpkg 1.468 ổn định) nhưng **KHÔNG AI chạy postboot check-only trên #116 lúc nó sống** (watcher-192 chết theo reboot 16:21:33Z). T56-193 mở phiên lúc ~20:40Z — SAU khi #116 chết 18 phút; dpkg.log đã reset (F-192-T4-2), journal #116 đã mất — **không còn bằng chứng tươi nào để verify post-hoc**. Viết cờ cho #116 lúc này sẽ là cờ không verify — T56 KHÔNG làm.
- **#115 (ebc5a3b9):** round192-t56/POSTBOOT_PASS, md5 **734f8e2d** — KHÔNG ĐỔI; backup ở round193-t56/ byte-identical. **#113 (f7632121): KHÔNG CÓ** (đợt 190 VOID — không bù được).

## §2. Hướng (3) VẪN ĐỨNG lần thứ 39 + marker + đồng hồ

**Hướng (3) ĐỨNG — lần thứ 39 liên tiếp** (38 ở đợt 192; đợt 190 VOID không kiểm). Kiểm lúc mở (~20:44Z): `user@0` static; `loginctl` "Failed to connect to bus"; không linger; không `/run/user/0`; 0 timer/unit VCut. Watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–193.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47Z, 239 B, md5 cb7102c0). Sống qua **#49–#117 = 69 reboot theo cách đếm T0** (nếu #117 xác nhận). **Đồng hồ:** T56 đo 20:46:14Z: local 20:46:14Z vs CF Date 20:46:15 GMT → **CF +0,9 s ≈ +1 s** (T01-192 đo +1 s — khớp). **Btime ghi bằng epoch nguyên.** δ=1 s dùng cho verdict holder (§5).

## §3. Cờ cũ — VẪN CÓ, md5 KHÔNG ĐỔI (kiểm lại đợt 193)

- **#115 (ebc5a3b9):** 734f8e2d — KHÔNG ĐỔI. **#114 (b0aab705):** 288f863b — KHÔNG ĐỔI. **#112 (27e6714f):** ca79a6b2 — KHÔNG ĐỔI. **#111 (257c1eae):** abe240cb — KHÔNG ĐỔI (repair, poll=1, CÓ caveat). **#110 (912f4a97):** 302ae331 — KHÔNG ĐỔI. **#109 (6f1d9f87):** a6fc7d69 — KHÔNG ĐỔI. **#107 (cea79500):** b7259902 — KHÔNG ĐỔI. **#104 (9161bfd1):** 8e6d6e5d — KHÔNG ĐỔI. **#102 (6ecd948e):** 6007fea8 — KHÔNG ĐỔI. **#101 (51745634):** 8c32fc3c — KHÔNG ĐỔI. **#99 (9897d4b4):** 3d031656 — KHÔNG ĐỔI. **#98 (e62eef3f):** 26452ec1 — KHÔNG ĐỔI. **#96 (8d2a69df):** 50869e4e — KHÔNG ĐỔI. **#95 (95b483a2):** f8cd6d46 — KHÔNG ĐỔI.
- Kiểm bằng 1 lần md5sum toàn bộ 125 file POSTBOOT_PASS* — **0 cờ mất, 0 md5 đổi**.
- **#116 (4dda8234) / #113 (f7632121) / #108 / #105 / #103 / #100 / #97: KHÔNG CÓ cờ** (tổng boot không cờ **26 → 27**).

## §4. Replay #117 KHÔNG CHẠY (dạng B) + ledger XOAY 1 dòng (F-193-T56-4)

- **Replay #117 KHÔNG CHẠY:** dpkg.log chỉ 2 dòng "startup packages configure" 20:23:13Z (boot+36s), md5 7eff566f, đóng băng tới lúc repair bắt đầu 20:45:41Z (1.348 s); 0 proc apt/dpkg/wrapper lúc mở (20:44Z, kiểm 2 lần); /var/log/apt KHÔNG TỒN TẠI lúc mở; lists 5; cache 0; GST 0 file. Bracket: configure boot+36s, **0 hoạt động replay nào quan sát được tới boot+36m** (cờ do repair, không phải replay). Dạng (B) như #60/#69/#142/#115. Chuỗi đình trệ/không-chạy: #102–#115: #103/#111 có, #105/#108/#113 KHÔNG XĐ, còn lại không; #115 KHÔNG CHẠY (dạng B); **#116 CHẠY (theo T8 — dpkg 2→1.468, selfcheck libs 6/6 + GST 269 — nhưng KHÔNG CÓ cờ)**; **#117 KHÔNG CHẠY (dạng B)**. Nguyên nhân đình trệ #100/#101/#103/#111 **VẪN CHƯA TÌM RA trong cell** → **vẫn nợ host-side** theo quyết (k) đợt 174.
- **Ledger — VẪN 2 dòng nhưng XOAY NỘI DUNG (F-193-T56-4):** `/var/lib/hatch/os-intent/ledger.jsonl` lúc kiểm cuối (21:15Z): **2 dòng** — [0] ts **1795565495** (repair #111, compacted=true); [1] ts **1795640347** (= 20:59:07Z, **repair #117**, added 106 gói — trùng history End-Date). **Dòng repair #115 (ts 1795618502) ĐÃ MẤT** — ledger chỉ giữ dòng compacted đầu + dòng repair MỚI NHẤT. **KHÔNG có dòng nào cho replay #117** (replay không chạy). T2/T10 lưu ý: ts 1795640347 là của repair #117, KHÔNG phải btime #117 (1795638157); số dòng ledger (2) KHÔNG đổi không có nghĩa nội dung không đổi — phải đọc ts.
- **Số liệu repair:** history.log 1 transaction (End-Date 20:59:07Z); term.log 0 lỗi; dpkg.log 768 dòng, md5 fe2420b3, ổn định từ 20:59:38Z; cache 107 .deb; lists 75; apt log repair đã copy ra khỏi /tmp NGAY (t5-postboot-repair-apt-1c0bcaad.log, 52.893 B — F-173-T5-9). 768 dòng = đúng mẫu repair-1-phần (768 ở #115).

## §5. Lock health (T6) — #116 KHÔNG GIẾT HOLDER (chuỗi 19 → 20) + #117 KHÔNG GIẾT HOLDER (chuỗi → 21)

### §5.1. Nhất quán log lock: 781 cặp lúc kiểm cuối, 0 đang giữ, chênh GIỮ 12

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 192). Số chính thức đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T56-192 kiểm cuối | T56-193 kiểm cuối | Δ trong phiên |
|---|---|---|---|
| Tổng dòng | 2722 | **2769** | +47 |
| TICKET / ACQUIRED / RELEASED | 790 / 779 / 767 | **804 / 793 / 781** | +14 / +14 / +14 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 363 / 12 / 1 / 10 | **368 / 12 / 1 / 10** | +5 / +0 |
| Cặp ACQUIRED→RELEASED | 767 | **781** | +14 |
| Đang giữ cuối log / Chênh ACQ−REL | 0 / 12 | **0 / 12** | — |
| Double-acquire (nghiêm ngặt) | 7 | **7** | 0 mới |

- **KIỂM CUỐI ĐỢT NÀY: ACQUIRED 793 / RELEASED 781, 781 cặp (raw 2775 dòng).**
- **+47 dòng kể từ T56-192 kiểm cuối:** T4-192 ×9 (3 attempt khép kín, hold 241 s / 270 s / 219 s) + t8-round192 ×26 (harness/O8 16:31–17:04Z: 4 chu kỳ acquire/release + 5 COOLDOWN — khép kín) + t01-round193 ×3 (TICKET+ACQUIRED 21:04:37Z, RELEASED 21:07:41Z, hold 184 s — O8 đợt 193, khép kín) + t4-round193 ×9 (3 attempt khép kín, hold 136 s / ~217 s / 217 s). 9+26+3+9 = 47 ✓.
- **Trong phiên T56-193 (từ lúc mở ~20:40Z): +12 dòng, +4 ACQ / +4 REL / +4 TICKET / +0 COOLDOWN** (t01-round193 O8 ×1 + t4-round193 ×3 attempt — đều khép kín).
- **Double-acquire GIỮ 7 — 0 ca mới**; STALE-LOCK GIỮ 12 — 0 ca mới; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE.** Caveat: **#68 GIẾT HOLDER t4**; **#95 CÓ GIẾT HOLDER** (t8-round179); **#96–#105 + #107–#117 KHÔNG giết** (verdict đợt 186–193; #106 không tính; #117 chờ parent xác nhận số hiệu).

### §5.2. #116 — KHÔNG GIẾT HOLDER (chuỗi 19 → 20)

#116 (btime 16:21:33Z, `4dda8234`, parent XÁC NHẬN (e)-192): dòng lock cuối trước btime là t4 RELEASED 16:17:38Z — **TRỐNG 215 s (3m35s)**; 0 dòng trong cửa sổ mở (t8-round192 TICKET/ACQUIRED đầu tiên 16:31:52Z); 0 STALE-LOCK mới. Khoảng trống gấp ~215 lần δ 1 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 20 reboot (#96–#105 + #107–#116; #106 không tính)** nếu parent tính tiếp. **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục từ 16:17:38Z tới 16:31:52Z nên MỌI boot trong cửa sổ đó đều không thể giết holder.

### §5.3. #117 ứng viên — KHÔNG GIẾT HOLDER (chuỗi → 21 nếu xác nhận)

#117 ứng viên (btime 20:22:37Z, `1c0bcaad`, T01-193 xác minh /proc/stat + `uptime -s`): dòng lock cuối trước btime là t8-round192 RELEASED 17:04:58Z — **TRỐNG 12.399 s (3h26m39s)**; 0 dòng trong cửa sổ mở (t01-round193 TICKET/ACQUIRED đầu tiên 21:04:37Z); 0 STALE-LOCK mới. Khoảng trống gấp ~12.399 lần δ 1 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 21 reboot** nếu parent xác nhận #117 = 1c0bcaad. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu #117 theo hệ quả (e)-192.

### §5.4. Quét zombie + X11 + ss (3 snapshot: mở/giữa/cuối — sửa F-192-T56-5)

| Thời điểm | Zombie | Socket X11 | Xvfb | ss listener |
|---|---|---|---|---|
| Mở (~20:44Z) | 0 | 0 | 0 | 1 (0.0.0.0:8765, python3 pid 5454 — có từ trước phiên T56) |
| Giữa (~21:15Z) | 0 | 2 (X193, X98) | 1 | 1 ([::1]:5187 — vite của T4 attempt1) |
| Cuối (~21:33Z) | 0 | 2 (X193, X98) | 0 | 0 |

- **0 zombie thật ở cả 3 lần** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56. T56 không khởi động Xvfb/vite nào, không kill process nào. **X11/Xvfb giữa/cuối là của luồng khác** (T01 O8 / T8 chuẩn bị harness) — T56 chỉ ghi nhận. **Listener 0.0.0.0:8765 BIẾN MẤT giữa phiên** — xem F-193-T56-7.

## §6. (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI (A) — 120/120 PASS (lần thứ 42) + suite 9/9 × 6 + KIỂM GATE TRƯỚC/SAU + MONITOR TRONG CHUNK

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7. Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — KHÔNG TÁI TẠO ĐƯỢC cách tính từ T6-191 (xem F-193-T56-6; các mốc chính đều khớp nên không chặn verdict). File khối đã trích `t7-block-a193.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–192. Poll script `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` — tất cả không đổi.
- **PHẠM VI HẸP — đã tuân thủ:** T56 chỉ chạy prune (§7) + suite/harness trên /tmp. Suite chạy trên log riêng trong /tmp — 0 dòng nào của T56 trên log lock thật trong phiên (§5.1).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (20:50:57–20:53:33Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (~2m36s — chạy TRONG lúc apt-get update của repair).
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), chạy N=120 lần với churn bơm vào (1 process `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s — giống hệt T6-151–T6-192 §6.2). Chỉ chạy trên /tmp, không đụng lock thật, không đụng poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn (120 lần hoàn thành): min 508 ms, max 3498 ms, trung bình 1990,93 ms. (File delays có 121 dòng — dòng thứ 66 là delay của lần chạy bị kill giữa chunk 3, đã loại khỏi thống kê.)
- **KIỂM GATE — 10 lần kiểm + monitor TRONG chunk (sửa F-192-T56-3, lần đầu áp dụng đầy đủ):** monitor nền `t7-gate-monitor-193.sh` chạy song song mỗi chunk, kiểm mỗi 20 s: (1) poll-t4.log có "CUA YEN MO"/GATE_OPEN=1 không, (2) lock log có t4/t8-round193 acquire không — kill toàn bộ process group của chunk ngay khi phát hiện. Trước chunk 1 (21:10:16Z, poll #33, load5 2,93, cửa ĐÓNG) → sau chunk 1 (21:12:01Z, 30/30). Trước chunk 2 (21:12:35Z, poll #36, load5 2,47, cửa ĐÓNG) → sau chunk 2 (21:14:22Z, 30/30). Trước chunk 3 (21:14:31Z, poll #38, load5 2,07, cửa ĐÓNG) → **monitor KILL chunk 3 lúc 21:14:51Z** (xem F-193-T56-3). Trước chunk 3b (21:28:32Z, T4 đã hết 3 attempt, poller thoát, lock trống) → sau chunk 3b (21:30:01Z, 25/25). Trước chunk 4 (21:30:12Z, lock trống) → sau chunk 4 (21:31:53Z, 30/30). **Tổng: 30 + 30 + 5 (chunk 3, trước khi bị kill) + 25 + 30 = 120 lần hoàn thành, 120/120 PASS.**
- **F-193-T56-3 — Monitor kill chunk 3 ĐÚNG LÚC cửa yên mở (CAVEAT + CHỒNG PHA (b) ~10–12 s — parent quyết có tính vi phạm không).** T4 mở cửa yên poll #39 lúc **21:14:40Z** (load5 1,95 < 2, RAM 1963 MB, tree ổn định) → T4 acquire lock **21:14:41Z** (attempt1, pha (b)). Monitor phát hiện "CUA YEN MO" lúc **21:14:51Z** (11 s sau, trong 1 chu kỳ kiểm 20 s) → kill toàn bộ process group chunk 3 → chunk exit 143 lúc ~21:14:51Z (+ SIGKILL sau 2 s → sạch hẳn ~21:14:53Z). **Chồng pha (a): ~11 s; chồng pha (b): ~10–12 s** (1 process churn `WebProcess-churn` sleep 1,5 s có thể còn sống trong cửa sổ này). 5 lần chạy chunk 3 (61–65) đều PASS trước khi bị kill; lần 66 đang chạy dở thì bị kill (không tính). **Khác F-192-T56-3:** lần này monitor TRONG chunk đã chạy đúng và kill trong 11 s (đợt 192: kiểm trước/sau chunk nên chồng pha (a) ~59 s, 0 pha (b)). Lần này có chồng pha (b) thật nhưng NHỎ (~10 s so với 2m35s của F-191-T10-2). **T56 KHÔNG tự phán vi phạm — giao parent quyết §9(i).** Dữ kiện: churn của T56 KHÔNG xuất hiện trong snapshot blockers-list-29.txt của T4; attempt1 hold chỉ 136 s. **Sửa đợt sau:** monitor 10 s; ưu tiên chạy harness sau khi T4 hết ngân sách (như chunk 3b/4 — 0 chồng lấn).
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ đợt 150: 13/30 (43%); **(A) đợt 151–193: 120/120 mỗi đợt (100%)**. **Kết luận: (A) VẪN XANH sau 42 đợt** (tổng 5040/5040 dưới churn). 120/120 là tỉ lệ dưới churn bơm vào (stress) — điều đo được là SO SÁNH TƯƠNG ĐỐI: (A) 100% vs (B) 7% vs bản cũ 43%. **Chuỗi:** "xanh kép" 41 → **42**; suite xanh: 73 → **74**.

## §7. Prune cooldown lần 67 — XÓA 3 FILE theo điều (a)

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100 file; (c) không xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào log; (e) chỉ chạy khi lock đang trống. Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h (8 ngày)** — bảo thủ hơn chữ luật tối đa 24h.

- Trước prune (~20:48Z): tổng **96 file / 1344 byte** (94 sau prune 66 + 2 file t8/t10-round192 mới); ứng viên (`find -mtime +7`): **3 file** — điều (a) kích hoạt đợt thứ ba liên tiếp.
- **KHÔNG PHẢI CHỜ LOCK:** lock TRỐNG liên tục từ lúc mở tới lúc prune (dòng cuối log RELEASED 17:04:58Z t8-round192); T56 kiểm lock ngay trước prune rồi prune ngay ~20:48Z. t01-round193 ACQUIRED sau đó (21:04:37Z) — sau prune ~16'.
- ~20:48Z 25/11: điều (a) XÓA 3 file (đều ≥192h, đều qua mốc 168h ≥24,4h, không vi phạm (c)): **`cooldown-t8-round131`** (197,1h, mtime 2026-11-17T15:43:51Z), **`cooldown-t10-round131`** (196,8h), **`cooldown-t10-round132`** (192,4h — sát mốc nhất, vẫn qua 192h). `prune-deleted.txt` ghi đủ tên. File `cooldown-t8-round133` (191,4h) CHƯA tới mốc — KHÔNG xóa.
- **Kết quả prune lần 67: 3 file đã xóa.** Sau prune: **93 file / 1302 byte** (96 − 3 = 93 ✓; 1344 − 42 = 1302 ✓, 3 × 14 B). Điều (b) KHÔNG kích hoạt (93 < 100). Lúc kiểm cuối vẫn **93 file / 1302 byte** (0 file mới sau prune). Tầng tuổi: **≥192h: 3 → 0; ≥168h: 17 → 14; ≥72h: 59 → 56; ≥48h: 72 → 69**. **KHÔNG mất file nào không giải thích được.**
- **F-147-T6-1 — CHUỖI VẪN 0 (lần thứ mười bốn liên tiếp sau khi đứt tại 179):** cả 3 file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~24–29h. Không đổi luật (luật thuộc parent).

## §8. F-193-T56-n (sai số / ghi nhận riêng của T56-193)

- **F-193-T56-1 — Poller T4-193 ĐÃ dùng đường chính round193-t56/ (fix (p)-191 CUỐI CÙNG ĐÃ ÁP DỤNG).** Poll #19 (20:59:35Z) t5flag=PASS, gate0=T5 ngay khi cờ về. Các poll #17/#18 trước khi cờ về vẫn dùng dự phòng `round192-t56/` (cờ #115 cũ) — đúng thiết kế. T56 KHÔNG phải tạo bản sao cờ. Lần đầu sau 2 đợt fix chưa áp dụng (191, 192).
- **F-193-T56-2 — GST #117 là THƯ MỤC THẬT, không phải symlink như #115.** `ls -ld` = thư mục thật (269 file); `readlink` trống. Theo chú thích trong postboot script: repair tạo symlink GST → debroot TRƯỚC, rồi apt install ghi plugin xuyên symlink; ở #117, sau install đường dẫn là thư mục thật, còn ở #115 symlink vẫn còn lúc verify. Nội dung PASS như nhau (269=269) — chỉ khác tính bền vững qua reboot. Caveat của cờ #117 do đó NHẸ HƠN #115 — parent cân nhắc khi chọn (b1)/(b2) ở §9.
- **F-193-T56-3 — xem §6 (đầy đủ):** chunk 3 bị monitor kill 21:14:51Z; chồng pha (a) ~11 s + pha (b) ~10–12 s với attempt1 T4; parent quyết §9(i).
- **F-193-T56-4 — Ledger xoay nội dung (xem §4).** Vẫn 2 dòng nhưng dòng repair #115 (ts 1795618502) đã bị thay bằng dòng repair #117 (ts 1795640347, added 106). Đếm dòng không đổi ≠ nội dung không đổi — các luồng đọc ledger PHẢI đối chiếu ts, không đếm dòng.
- **F-193-T56-5 — Watcher-192 chết theo reboot; khoảng không-watcher ~4h03m58s bao toàn bộ đời #116.** Watcher-192 (pid 8168) chết cùng boot ebc5a3b9 lúc 16:21:33Z (poll cuối 16:21:43Z — poll này chạy trong lúc reboot, vẫn ghi boot cũ); KHÔNG có dòng END/STOP/NEWBOOT. Khác watcher-191 (kết thúc đúng hạn 11:35:28Z). Hệ quả: replay #116 chạy mà không ai theo dõi, không ai viết cờ. Watcher-193 (pid 6482) đã spawn 20:45:41Z, hạn 23:35:00Z — T56-194 tiếp quản.
- **F-193-T56-6 — md5 live-code khối T7 (c92f2eff…) KHÔNG tái tạo được cách tính.** File `round191-t56/md5-close.txt` ghi md5 này từ stdin mà không ghi lệnh; T56-193 thử 4 cách trích đều không ra. Các mốc chính đều khớp nên verdict (A) không bị chặn — chỉ ghi nhận để T6 đợt sau khỏi mất công tìm lại.
- **F-193-T56-7 — Listener 0.0.0.0:8765 (python3 pid 5454) BIẾN MẤT giữa phiên + 3 waiter lạ chỉ đọc.** Lúc mở: 1 listener 0.0.0.0:8765 (python3 pid 5454, có từ trước phiên T56); lúc giữa/cuối: KHÔNG còn (chỉ còn vite [::1]:5187 của T4 attempt1 rồi 0 listener lúc cuối). T56 không kill process nào — listener tự kết thúc cùng chủ của nó. Ngoài ra T56 quan sát 3 process lạ chỉ-đọc, polling cờ/log của T56 (pid 15511, 39782, 115884 — dạng `sleep N; tail replay-watch-193.log; ls POSTBOOT_PASS`) + 1 waiter của T8 (pid 219366) — đều là các luồng đợt 193 chờ cờ/gate, không can thiệp gì; T56 ghi nhận, không chặn.
- **F-193-T56-8 — T4-193 hết 3 attempt, 0 lượt hợp lệ (theo poller, lúc 21:25:41Z+).** Attempt1 hold 136 s, attempt2 ~4 phút, attempt3 hold 217 s (20/20 NHƯNG lớp B VI PHẠM — "lượt nhiễm tải, KHÔNG dùng verdict"). Poller thoát sau attempt3. T56 KHÔNG phán verdict lượt yên #61 — thuộc T4-193 + parent. `.done` của T4 CHƯA CÓ lúc T56 đóng (21:33Z) — T10 kiểm lại trên đĩa.
- **F-177-T5-3 vẫn đúng (lần 17):** `who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T56 dùng **epoch /proc/stat làm chuẩn**.
- **round-in-progress.md:** T56 không kiểm latch đợt này (không thuộc nhiệm vụ T56). **Inotify max_user_watches:** T56 không đo lại đợt này (lần đo gần nhất vẫn là T6-187: 63.747). **RAM/ENOSPC #117:** thuộc T9-193 (T56 không đo).

## §9. Đề xuất cho parent (quyết ở aggregate 193)

**(a) Chấp nhận verdict đợt 193 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #117 đã có (repair, poll=1, verify độc lập exit=0, GST thật), replay #117 KHÔNG CHẠY (dạng B — early-repair đúng), cờ cũ VẪN CÓ, (A) 120/120 lần 42, holder #116 19 → 20 / #117 → 21, prune 67 xóa 3 file, hướng (3) lần 39, 0 vi phạm B4 — với caveat F-193-T56-3 (chồng pha (b) ~10–12 s, parent quyết ở (i)).

**(b) Cờ #117 ứng viên (repair-som-quyet-h, poll=1) — CÂU HỎI QUYẾT:** repair 1 lần theo (h) → poll1 exit=0, verify độc lập exit=0, 11/11 apt + 5/5 lib + GST 269=269 THƯ MỤC THẬT + dpkg 768 + 1 transaction + term.log 0 lỗi. **Parent chọn 1 trong 2:** (b1) Chấp nhận **CÓ caveat** (repair-sớm, poll=1 — tiền lệ #111/#115); (b2) Chấp nhận KHÔNG caveat (GST thật, không còn điểm yếu ephemeral của #115 — T56 thấy (b2) CÓ CĂN CỨ, nhưng vẫn đề xuất (b1) cho nhất quán).

**(c) #116 KHÔNG CÓ cờ — tổng boot không cờ 26 → 27?** Replay #116 CÓ chạy (chứng cứ T8) nhưng không ai verify → không viết bù được. **Replay #117 KHÔNG CHẠY (dạng B)** — chuỗi cập nhật ở §4. **(d) Xác nhận 1c0bcaad = #117?** (btime 20:22:37Z, epoch 1795638157, gap 14.464 s; T01-193 xác minh.)

**(e) #116 KHÔNG GIẾT HOLDER — chuỗi 19 → 20; #117 KHÔNG GIẾT HOLDER — chuỗi → 21** (trống 215 s / 12.399 s). **(f) (A) 120/120 lần thứ 42 (tổng 5040/5040) + suite 9/9 × 6 (chuỗi suite xanh 74) — parent ghi nhận?**

**(g) Prune lần 67: điều (a) xóa 3 file, queue 96 → 93; F-147-T6-1 chuỗi VẪN 0 lần thứ 14. (h) Hướng (3) VẪN ĐỨNG lần thứ 39 — parent ghi nhận cả hai?**

**(i) F-193-T56-3 (chunk 3 chồng pha (a) ~11 s + pha (b) ~10–12 s với attempt1 T4; monitor kill trong 11 s; churn KHÔNG xuất hiện trong blockers-list-29 của T4) — parent quyết: có tính là VI PHẠM (chuỗi 0 vi phạm 1 → 0 ĐỨT) hay chỉ là caveat (chuỗi GIỮ 1)? Tiền lệ: F-191-T10-2 (2m35s pha (b)) = LIGHT VIOLATION; F-192-T56-3 (59 s pha (a), 0 pha (b)) = KHÔNG vi phạm.**

**(j) Watcher-193 vẫn chạy trên #117** (pid 6482, hạn 23:35:00Z) — T56-194 tiếp quản.

## §10. Sai số của chính T56-193 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-193-T56-1..8** | Xem §8 (đầy đủ, không lặp lại ở đây) | Ghi nhận | — |
| §6 | Monitor TRONG chunk chu kỳ 20 s → chồng pha (b) ~10–12 s trước khi kill kịp (chunk 3) | Caveat — parent quyết ở §9(i) | Monitor đã kill trong 11 s; sửa đợt sau: chu kỳ 10 s + ưu tiên chạy sau khi T4 hết ngân sách |
| §6 | Chunk 1–2 chạy khi gate0=T5 đã xanh (nhưng gateA ĐỎ: load5 2,93/2,47 > 2) — đúng quy tắc "chỉ chạy khi cửa ĐÓNG", nhưng load5 rơi nhanh về 2,0 nên rủi ro cửa mở giữa chunk là có thật (đã xảy ra ở chunk 3) | Caveat | Đã bù bằng monitor trong chunk; chunk 3b/4 chạy sau khi T4 hết ngân sách — 0 chồng lấn |
| §1 | T56 mở muộn boot+18', watcher spawn muộn boot+23m04s (khoảng không-watcher ~4h04m bao toàn bộ đời #116) | Ghi nhận | #116 mất cờ vì không ai theo dõi trong đời nó — không phải lỗi spawn muộn của T56-193; watcher-193 spawn ngay khi T56 mở |
| — | md5 live-code c92f2eff không tái tạo được cách tính (F-193-T56-6) | Hạn chế nhỏ | Các mốc chính đều khớp; không chặn verdict (A) |
| — | RAM/ENOSPC #117 (thuộc T9-193); inotify không đo lại (giữ số T6-187: 63.747); (m) #116 thuộc T2-193 | Hạn chế nhỏ | Thuộc T9-193 / T2-193 |

**Số liệu chính thức lấy từ log watcher-192/193 + log trực tiếp (verify form-B/poll1/independent) + dpkg/history/term.log của #117 + ledger /var/lib/hatch/os-intent/ledger.jsonl + log lock thật + queue trên đĩa + poll log T4-193 + đối chiếu aggregate 192 (§14.2) + LIMITS T8-192 §D4 (replay #116).**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND193_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round193-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round193-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push: đợt 191 + đợt 192 = 24/84/67/54 (theo (q)-192; T10-193 đếm lại bằng dedup toàn cục).

## Phụ lục A — Trích số liệu T56-193 (bản chính, 20:40Z – 21:35Z 25/11)

```
boot #117=1c0bcaad-1f18-43b1-90f5-fc6319e63b29 btime=1795638157=20:22:37Z (uptime -s KHOP; journal idx 0 first 20:22:50Z = btime +13 s); gap #116->#117 = 14464 s
watcher-192: START 14:44:45Z pid=8168; poll cuoi 16:21:43Z dpkg 768 md5=7ec12b3f; CHET THEO REBOOT 16:21:33Z, 0 END/STOP/NEWBOOT
watcher-193: START 20:45:41Z pid=6482 boot=1c0bcaad end=23:35:00Z; init dpkg 2 md5=7eff566f mtime=20:23:13Z cache=0 lists=5 gst_sys=0; EARLY-REPAIR TRIGGER 20:45:41Z (boot_age 1384 s, frozen 1347 s); verify form-B exit=1 (20:45:42Z); --repair 20:45:42-20:59:07Z; poll1 exit=0 (20:59:08Z); FLAG-WRITTEN 20:59:08Z poll=1 (old=ebc5a3b9)
POSTBOOT_PASS #117: CO 324 B md5=46e0b657; backup #115 md5=734f8e2d = goc; dpkg 768 md5=fe2420b3; cache=107; lists=75; GST 269 (THU MUC THAT); history 1 tx; term.log 0 loi; apt log 52893 B; verify doc lap exit=0 (~21:01Z)
POSTBOOT_PASS #116: KHONG CO (0 file nhac 4dda8234; tong boot khong co 26 -> 27)
Co cu KHONG DOI: #115 734f8e2d / #114 288f863b / #112 ca79a6b2 / #111 abe240cb / #110 302ae331 / #109 a6fc7d69 / #107 b7259902 / #104 8e6d6e5d / #102 6007fea8 / #101 8c32fc3c / #99 3d031656 / #98 26452ec1 / #96 50869e4e / #95 f8cd6d46
Lock (mo/kiem cuoi): raw 2763/2775; cleaned 2757/2769; ACQUIRED 789/793; RELEASED 777/781; cap 777/781; chenh 12/12; TICKET 800/804; COOLDOWN 368; STALE-LOCK 12; STALE-TICKET 1; TIMEOUT 10; double-acquire 7; held 0
(A): suite a89c0676; block dc973443 (giong het 151-192); poll 1710e480; lock v2 520b8baa; lock v1 fd21193c; suite 6x 9/9 rc=0; harness 120/120 B1=1 B2=0; delay 508/3498/1990.93 ms
Gate: poll #33/#36/#38 DONG; #39 21:14:40Z MO — monitor kill chunk 3 21:14:51Z, chong (a) ~11 s + (b) ~10-12 s; chunk 3b/4 sau khi T4 het ngan sach — 0 chong lan
Prune 67: truoc 96 file / 1344 B; xoa 3 file (dieu (a)): cooldown-t8-round131, cooldown-t10-round131, cooldown-t10-round132; sau 93 file / 1302 B; tang tuoi: >=192h 3->0; >=168h 17->14; >=72h 59->56; >=48h 72->69
Holder: #116 KHONG GIET (trong 215 s, ~215x delta); chuoi 19 -> 20; #117 KHONG GIET (trong 12399 s, ~12399x delta); chuoi -> 21 (neu xac nhan)
Huong (3): lan 39; Marker: CO, mtime=2026-11-20 11:39:47Z, 239 B, md5 cb7102c0; song #49-#117 = 69 reboot (T0)
Ledger: 2 dong: ts 1795565495 compacted=true (repair #111) + ts 1795640347 (repair #117, added 106); dong repair #115 (ts 1795618502) DA MAT (xoay); KHONG dong moi cho replay #117
X11/zombie: 0 zombie x3 snapshot; X11 0 -> 2 (X193, X98); Xvfb 0 -> 1 -> 0; ss 1 (8765 python3 pid 5454) -> 1 ([::1]:5187 T4 vite) -> 0; CF +0,9 s
```

## Nợ mở chuyển đợt 194

1. **(m) #116 phân loại CUỐI + INSIDE #113/#114/#115** — T2-193 + parent 193 (F-192-T10-1: nhãn "T2-192 phán CUỐI" là SAI).
2. **Cờ #117 ứng viên (repair-som-quyet-h, poll=1, GST thật — caveat đề xuất, (b2) CÓ CĂN CỨ)** — parent quyết §9(b). **Số hiệu #117** — T01-193 xác minh, parent quyết (e) §14.1-193. **#116 KHÔNG cờ — tổng boot không cờ 26 → 27.**
3. **F-193-T56-3 (chunk 3 chồng pha (b) ~10–12 s)** — parent quyết §9(i): vi phạm hay caveat.
4. **Replay #117 KHÔNG CHẠY (dạng B)** (§4); **nguyên nhân dạng B VẪN CHƯA TÌM RA trong cell** — nợ host-side quyết (k) đợt 174 VẪN MỞ. **#116 là boot đầu tiên có replay chạy mà không có cờ** (watcher chết trước khi theo dõi) — T56-194: spawn watcher NGAY khi mở phiên.
5. **F-193-T56-1..8** — ghi nhận; T4/T10/parent lưu ý (đặc biệt F-193-T56-1: fix đường chính poller ĐÃ áp dụng — giữ nguyên ở brief T4; F-193-T56-4: ledger xoay — đọc ts, không đếm dòng).
6. **Watcher-193 vẫn chạy trên #117** (pid 6482, hạn 23:35:00Z) — T56-194 tiếp quản.
7. **Prune lần 68** — T6-194 (chuỗi F-147-T6-1 đang 0 lần thứ 14; file cũ nhất `cooldown-t8-round133` — qua mốc 192h lúc 21:23:09Z 25/11).
8. **T4-193 hết 3 attempt, 0 lượt hợp lệ** (theo poller — T4 phán cuối, parent quyết (m)-193); **(A) lần 43? + suite xanh 75?** — T56-194.
9. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user (số đếm vẫn là 16). ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; file oversize 6,4 MB chưa quyết số phận.
