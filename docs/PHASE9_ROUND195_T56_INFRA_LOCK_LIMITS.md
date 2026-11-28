# PHASE9_ROUND195_T56_INFRA_LOCK_LIMITS.md — T56 đợt 195 (gộp T5+T6: infra/watcher + POSTBOOT_PASS + lock health + prune)

**Trạng thái:** ĐÃ XONG watcher-195 + cờ **#121 ứng viên (replay-day-du, poll=0, GST THƯ MỤC THẬT — như #117, hơn #119)** + (A) **120/120 lần thứ 44** + suite 9/9 × 6 + prune lần 69 + #120 **KHÔNG GIẾT HOLDER** (chuỗi 23 → 24) + #121 **KHÔNG GIẾT HOLDER** (chuỗi → 25) + hướng (3) **lần thứ 41** + **F-195-T56-1..8**. **Cờ #120 KHÔNG VIẾT ĐƯỢC post-hoc** (boot chết 08:22:05Z trước khi có verify nào — xem §1.4; parent quyết) + **chunk 2 bị monitor kill khi gate T4 mở** (9 s chồng, 0 bằng chứng ảnh hưởng — xem F-195-T56-3). 1 entry stage duy nhất.

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #121 ứng viên (8c4aa907) | **ĐÃ CÓ 08:51:26Z (boot+29m21s, replay-day-du, poll=0)** — replay chạy thật 08:35:42–08:37:34Z (1.477 dòng); verify độc lập exit=0 (log md5 GIỐNG HỆT poll0); 11/11 apt + 5/5 lib; GST 269=269 **THƯ MỤC THẬT (apt, như #117 — KHÔNG symlink như #119)**; dpkg **1.477**; cache 171; lists 37 |
| POSTBOOT_PASS #120 (ac8a88aa) | **KHÔNG CÓ — KHÔNG VIẾT ĐƯỢC post-hoc** (boot chết 08:22:05Z; không watcher trong đời nó; không bản ghi verify nào khi còn sống; ledger +64 gói @05:04:19Z chỉ gợi ý replay đã chạy, KHÔNG chứng minh được trạng thái postboot) — tổng boot không cờ **28 → 29** nếu parent chấp nhận; parent quyết ở §9(c) |
| Watcher-194 | **CHẾT THEO REBOOT 04:23:25Z (btime #120)** — poll cuối 04:23:48Z (= btime+23 s, cùng chữ ký đồng-hồ-nhảy F-193-T9-2), KHÔNG có dòng END/STOP/NEWBOOT; pid 5557 chết **~4h12m TRƯỚC hạn 08:35:51Z** (xem F-195-T56-1) |
| Watcher-195 | START 08:51:25Z, pid **44695**, hạn **14:35:51Z 26/11 (= hạn cứng đợt 196)** — **ALIVE lúc đóng** (poll 09:27:01Z); khoảng không-watcher **~4h27m37s** (04:23:48Z → 08:51:25Z) bao toàn bộ đời #120 + ~20 phút đầu #121 |
| Replay #121 | **ĐÃ CHẠY (dạng A — replay đầy đủ thật)** — 08:35:42–08:37:34Z, 1.477 dòng, /var/log/apt CÓ, install cuối gstreamer1.0-tools 08:37:34Z; KHÁC dạng B (#115/#117/#119 lúc mở) |
| Hướng (3) | **VẪN ĐỨNG lần thứ 41** |
| Marker sống | CÒN, mtime 2026-11-20 11:39:47Z không đổi, md5 cb7102c0 — sống qua **#49–#121 = 73 reboot** (nếu #121 xác nhận) |
| (A) lock | **120/120 PASS lần thứ 44** (tổng **5280/5280**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 75 → **76** |
| Lock | KHỎE (803 cặp lúc kiểm cuối, 0 đang giữ, chênh **GIỮ 12**, STALE-LOCK GIỮ 12, double-acquire GIỮ 7, 0 TIMEOUT mới, 0 "KHÔNG NHẢ"); **#120 KHÔNG GIẾT HOLDER (23 → 24)**; **#121 KHÔNG GIẾT HOLDER (→ 25)** |
| Prune lần 69 | **XÓA 4 FILE theo điều (a)** (queue 94 → 90; F-147-T6-1 chuỗi **VẪN 0 lần thứ 16**); prune chạy khi lock trống, KHÔNG phải chờ (khác đợt 194) |
| Vi phạm T4 | **Chunk 2 bị monitor KILL 09:10:16Z khi gate mở** (chồng ~9 s với attempt1, run 59 chưa kịp spawn churn — 0 bằng chứng ảnh hưởng; xem F-195-T56-3 — parent quyết); suite chạy khi gate ĐỎ, xong trước khi gate mở 5 phút — 0 chồng |
| T4-195 | attempt1 RETRY (tickCost 78,0 ms), attempt2 RETRY (partial exit=2), attempt3 **HỢP LỆ** (20/20, lớp B 5/5, tickCost 53,0 ms) — T4 thoát poller 09:21:58Z |
| X11 / zombie | **0 zombie cả 2 snapshot (giữa/cuối)**; X11 1 → 4 socket (X195/X196/X197 mới + X193); Xvfb 1 → **0** (server thoát, socket còn sót — xem F-195-T56-5); listener 8765 VẪN MẤT (như đợt 193/194), vite :5187 chỉ trong lúc T4 attempt |
| Đồng hồ | Cloudflare local CHẬM ~1 s (mid 1795683576 vs CF 08:59:37Z = 1795683577) — δ=1 s; khoảng trống lock gấp ~16.049× δ → KHÔNG caveat |
| Quy tắc B4 | **T56-195 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 configure/install/update/repair tay); verify độc lập chỉ đọc |

**Số hiệu boot #121 CHƯA QUYẾT — T01-195 xác minh 9 nguồn (parent quyết (e)).** T56 KHÔNG phán (m) — (m) #120 DƯƠNG (CUỐI) thuộc T2-195 (n 53/54 → 54/55); (m) #121 thuộc T2-196.

## §0. Trạng thái lúc mở (~08:41Z)

- **Boot lúc mở: `8c4aa907-1329-4e9a-927e-acb2141baf67`, btime 08:22:05Z** (epoch 1795681325; `uptime -s` khớp; journal idx 0 duy nhất, first 08:22:18Z = btime +13 s; `last` reboot 08:22 still running; `who -b` Nov 26 08:22; T01-195 xác minh 9 nguồn lúc 08:41:23Z). **Số hiệu #121 ứng viên theo hệ quả (e)-194 (ac8a88aa = #120).** Gap #120→#121 = **14.320 s (3h58m40s)**. **KHÔNG có reboot trong phiên T56.**
- **Replay #121 ĐÃ CHẠY XONG trước khi T56 mở:** dpkg.log 1.477 dòng, md5 01ff5ecc, mtime 08:37:34Z (install cuối gstreamer1.0-tools); /var/log/apt CÓ; lists 37; cache 171 .deb; GST hệ thống 269 file THƯ MỤC THẬT; libevent-2.1.so.7 CÓ; 0 proc apt/dpkg. **KHÁC dạng B** (#115/#117/#119 lúc mở đều chỉ 2 dòng + đóng băng).
- **Lock lúc mở: TRỐNG** (dòng cuối RELEASED 04:16:34Z t8-round194); queue 94 file / 1316 byte. **T4-195 ĐÃ spawn lúc T56 mở** (poll #8 08:49:00Z — T56 mở ~08:41Z, poll #1 ~08:43:41Z; gate0 chưa đạt, đang chờ cửa yên; xem preflight-195.txt: gate0 dự phòng T4-check-only đạt từ poll #1). Không có dpkg/apt nào CỦA T56.
- **Watcher-194 ĐÃ CHẾT lúc mở** (ps không còn process watcher — parent xác nhận lúc spawn 08:37Z; T56 xác nhận lại ~08:41Z).
- **Latch:** `round-in-progress.md` — T56 không kiểm latch đợt này (không thuộc nhiệm vụ T56).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 26/11/2026)

**02:48:57Z** **watcher-194 START, pid 5557** (đợt 194). **04:23:25Z** **reboot #120 (ac8a88aa)** — watcher-194 chết theo reboot (poll cuối 04:23:48Z). **04:23:25Z → 08:22:05Z** #120 sống 3h58m40s, KHÔNG watcher, KHÔNG cờ. **08:22:05Z** **reboot #121 ứng viên (8c4aa907)**. **08:35:42–08:37:34Z** replay #121 chạy (1.477 dòng, boot+13m37s → boot+15m29s). **~08:41Z** T56-195 mở; T01-195 survey 08:41:23Z (9 nguồn). **~08:47Z** T56 verify độc lập exit=0. **08:51:25Z** **watcher-195 START, pid 44695** → poll0 exit=0 → **FLAG-WRITTEN 08:51:26Z** (boot+29m21s, replay-day-du, poll=0). **08:52:01Z** T4 poll #12: t5flag=PASS qua **ĐƯỜNG CHÍNH round195-t56/** — fix (p)-191 đứng đợt thứ ba liên tiếp. **~09:02–09:05Z** T56 chạy suite 6 lần (gate ĐỎ, chưa có attempt). **09:06:33–09:08:24Z** chunk 1 (1–30) 30/30. **09:08:3x–09:10:16Z** chunk 2 (31–60) — **monitor KILL 09:10:16Z** khi gate mở (runs 31–58 xong). **09:10:07Z** T4 attempt1 ACQUIRED (gate mở poll #36 09:10:06Z) → RELEASED 09:13:53Z (hold 226 s, RETRY tickCost 78,0 ms). **09:14:16Z** attempt2 ACQUIRED → RELEASED 09:17:20Z (hold 184 s, RETRY partial exit=2). **09:17:53Z** attempt3 ACQUIRED → RELEASED 09:21:32Z (hold 219 s, **HỢP LỆ** 20/20 + lớp B 5/5 + tickCost 53,0 ms); T4 thoát poller 09:21:58Z. **09:22:27–09:24:17Z** chunk 3 (59–88) 30/30. **09:24:24–09:26:24Z** chunk 4 (89–120) 32/32. **09:27:03Z** T56 prune lần 69. **~09:28Z** T56 viết LIMITS này. Watcher-195 vẫn ALIVE (pid 44695, poll 09:27:01Z).

### §1.2. Watcher-194 — CHẾT THEO REBOOT 04:23:25Z, chết sớm ~4h12m trước hạn (F-195-T56-1)

- Poll cuối **04:23:48Z** (boot 55c9e0b7, dpkg 777 ổn định, md5 fddba8f4) — muộn hơn btime #120 (04:23:25Z) **23 s**, vẫn đọc boot cũ; KHÔNG có dòng END/STOP/NEWBOOT; log mtime 04:23. Cùng chữ ký như watcher-193 (poll cuối muộn hơn btime #118 28 s) — giải thích đứng: **F-193-T9-2 (đồng hồ wall-clock nhảy ~18–28 s lúc reboot)**. Watcher-194 chết CÙNG reboot 04:23:25Z, **KHÔNG phải chết đúng hạn 08:35:51Z** — hạn mở rộng (sống sang đợt 195) không cứu được watcher khỏi reboot, vì tiến trình chết theo boot.
- **Khoảng không-watcher ~4h27m37s** (04:23:48Z → 08:51:25Z) — bao **toàn bộ đời #120 (3h58m40s) + 29m20s đầu #121** (08:22:05Z → 08:51:25Z). Đây là khoảng không-watcher dài thứ ba liên tiếp bao trọn một boot (#116 ~4h03m58s, #118 ~4h27m02s, #120 ~4h27m37s) — mẫu hệ thống, không phải sự cố lẻ.
- **Đính chính header watcher-194:** header ghi watcher-193 "CHẾT KHÔNG RÕ NGUYÊN NHÂN" là SAI (đã có giải thích F-193-T9-2 — xem F-194-T56-3); header watcher-195 đã ghi đúng.

### §1.3. POSTBOOT_PASS #121 ứng viên — ĐÃ CÓ 08:51:26Z (replay-day-du, poll=0)

- Watcher-195 trigger DONE ngay poll đầu (dpkg 1.477 dòng > 100, ổn định, 0 proc; init mtime 08:37:34Z) → postboot poll0 **exit=0** (hoàn tất 08:51:26Z, dpkg 1.477, cache 171, lists 37) → FLAG-WRITTEN (ghi FULL boot_id, F-151-T5-1; timestamp HOÀN TẤT poll0, F-152-T5-3). **Cờ cũ #119 (55c9e0b7) được sao lưu** thành POSTBOOT_PASS-55c9e0b7 trong round195-t56/ (md5 863a6035 = bản gốc, byte-identical).
- **Profile cờ này MẠNH NHẤT kể từ #117:** replay đầy đủ thật (không repair) + GST thư mục thật + poll0 — tương đương #117, hơn hẳn #119 (repair + poll=1 + GST symlink). Không có caveat về mode; chỉ còn caveat số hiệu chưa quyết (parent xác nhận #121 ở §9).
- **T4-195 đã thấy postboot PASS qua ĐƯỜNG CHÍNH:** poll #12 (08:52:01Z) t5flag=PASS, gate0=T5 (round195-t56/POSTBOOT_PASS). Poll #1–#11 trước khi cờ về vẫn dùng cờ cũ round194-t56/ ("cu/mtime-cu" — đúng thiết kế chống cờ sai boot) + gate0 dự phòng T4-check-only — đúng thiết kế. **Fix (p)-191 đứng đợt thứ ba liên tiếp** (191, 194, 195 — đợt 192/193 xem LIMITS các đợt đó).
- **T56 verify độc lập: exit=0** (~08:47Z, TRƯỚC khi watcher spawn — log `t56-postboot-independent-8c4aa907.log` md5 **69d0bd75 GIỐNG HỆT** log poll0 của watcher). 11/11 apt + 5/5 lib + GST 269=269 THƯ MỤC THẬT — xem §2.

### §1.4. POSTBOOT_PASS #120 — KHÔNG CÓ, KHÔNG VIẾT ĐƯỢC post-hoc (F-195-T56-2)

- #120 (ac8a88aa-273d-42ef-a100-fc02ad143df4, btime 1795667005 = 04:23:25Z; T01-195 + T2-195 + T9-194 xác minh; gap #119→#120 = 6.917 s; sống 14.320 s tới 08:22:05Z). **0 file cờ nào nhắc ac8a88aa** (chỉ có ghi chú trong header script watcher-195 + gen-watcher-195.py của chính T56-195; T9-194 sampler + T2-195 m-check + T01-195 appendix chỉ ghi nhận boot, không verify postboot).
- **Vì sao không viết được:** brief giao "VIẾT CỜ #120 đợt này" với giả định #120 là boot đang sống — nhưng #120 đã chết 08:22:05Z, TRƯỚC khi T56-195 mở phiên (~08:41Z). Viết cờ lúc này đòi hỏi các trường không còn kiểm chứng được: dpkg.log đã reset theo reboot 08:22:05Z; journal chỉ giữ idx 0 của boot hiện tại; /var/log/apt của #120 đã mất; không có lần chạy postboot check nào trên #120 khi nó còn sống (không watcher; T56-194 đóng ~03:20Z; T4-194 thoát poller 03:41:10Z; T8-194 phát hiện reboot lúc kiểm cuối 04:42Z nhưng chỉ ghi X11/lock trống, không chạy postboot). **Viết cờ không-verify là bịa đặt — tiền lệ #118 (T56-194 §1.4) cấm đúng việc này. T56 KHÔNG làm.**
- **Bằng chứng duy nhất về #120 (gián tiếp, KHÔNG đủ để viết cờ):**
  - Ledger `/var/lib/hatch/os-intent/ledger.jsonl`: 1 dòng, ts 1795661454, compacted=true, **added 170 gói (tăng từ ~106 lúc T56-194 đọc ~03:19Z)**, mtime **05:04:19Z** (đời #120, boot+41m) — **+64 gói được compact vào trong đời #120**, phù hợp với replay trên #120 đã chạy và cài thêm gói (xem §4). Nhưng ledger không ghi dpkg lines / GST / lib / exit code — KHÔNG chứng minh được trạng thái postboot.
  - T9-194 ram-sampler chạy trên #120 04:25:03–04:50:03Z (26 mẫu, avail 475 kB–1,6 MB, balloon tới 6.443.824 kB) — chứng minh boot sống và hoạt động, không đo dpkg.
  - T8-194 .done (kiểm cuối 04:42Z): /tmp/.X11-unix TRỐNG sau reboot; ps sót 0; vite lock TRỐNG (RELEASED 04:16:34Z) — trạng thái X11/lock, không phải postboot.
  - (m) #120 **DƯƠNG (CUỐI)** theo T2-195 (run 198 SPANNED btime #120, requeue recovered; n 53/54 → 54/55) — thuộc T2, không phải bằng chứng postboot.
- **Tổng boot không cờ 28 → 29** (nếu parent chấp nhận). Parent quyết ở §9(c): chấp nhận KHÔNG CÓ cờ #120, hay chỉ đạo khác (ví dụ: ghi nhận replay #120 đã chạy theo ledger mà không gọi là POSTBOOT_PASS).
- **Lưu ý cho brief đợt sau:** nợ cờ của một boot chỉ viết được khi boot đó CÒN SỐNG lúc T56 mở phiên; nếu boot đã chết trước phiên, brief cần giao "xác minh post-hoc từ bằng chứng sống sót" thay vì "viết cờ".

## §2. Verify độc lập #121 (T56, check-only, ~08:47Z) + GST THƯ MỤC THẬT

- **Verify độc lập: postboot exit=0** — wrapper PASS (đã vá K1); **5/5 lib PASS** (libevent/libEGL/libavif/libdw/libevdev); GST **269=269 PASS** (isomp4 + libav); **11/11 gói apt PASS** (kể cả libevdev2, Q7 đợt 114); KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. File: `t56-postboot-independent-8c4aa907.log` (md5 69d0bd75 = log poll0 của watcher — hai lần chạy độc lập cho cùng kết quả byte-identical).
- **GST #121 là THƯ MỤC THẬT** (`/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, drwxr-xr-x, `readlink` KHÔNG trả gì) — kiểm KHÔNG trailing slash (bài học F-194-T56-2). Khác #119 (SYMLINK → debroot, ephemeral) và giống #117 (thư mục thật). Postboot script dòng 714 in INFO "là thư mục thật (apt)".
- **Replay #121 khác hẳn dạng B:** dpkg.log bắt đầu 08:35:42Z (boot+13m37s, 2 dòng startup) rồi cài liên tục tới 08:37:34Z (boot+15m29s, 1.477 dòng) — install cuối gstreamer1.0-tools; history.log ghi rõ từng gói (libaspell15 → ... → libwoff1/xfonts-cyrillic/xfonts-scalable/gstreamer1.0-tools); term.log "Log ended: 2026-11-26 08:37:34". Ổn định từ đó (md5 01ff5ecc không đổi 08:37:34Z → 09:27Z, ~50 phút).

## §3. Cờ cũ — VẪN CÓ, md5 KHÔNG ĐỔI

| Cờ | md5 lúc kiểm cuối |
|---|---|
| #121 (8c4aa907, MỚI) | 28847b1e |
| #119 (55c9e0b7, backup ở round195-t56/) | 863a6035 (= bản gốc round194-t56/, byte-identical) |
| #117 (1c0bcaad) | 46e0b657 (= backup POSTBOOT_PASS-1c0bcaad, byte-identical) |
| #115 (ebc5a3b9) | 734f8e2d |
| #114 (b0aab705, backup ở round192-t56/) | 288f863b |
| #112 (27e6714f, backup ở round191-t56/) | ca79a6b2 |

## §4. Ledger XOAY LẦN NỮA + khoảng lặng scheduler quanh btime #121 (F-195-T56-4)

- **Ledger — VẪN 1 dòng nhưng NỘI DUNG TĂNG (nối F-194-T56-6):** `/var/lib/hatch/os-intent/ledger.jsonl` lúc kiểm cuối: **1 dòng** — ts **1795661454** (repair #119, compacted=true), **added 170 gói** (tăng từ ~106 lúc T56-194 đọc). **Dòng repair #117 (ts 1795640347) ĐÃ MẤT** (compact lúc 05:04:19Z, trong đời #120); **KHÔNG có dòng nào cho replay #121** (replay #121 không chạm ledger — mtime ledger vẫn 05:04:19Z, trong khi dpkg-state.txt mtime 08:37:35Z theo replay #121). **Số dòng ledger (1) KHÔNG đổi không có nghĩa nội dung không đổi — phải đọc ts + đếm added.**
- **+64 gói trong đời #120:** mtime ledger 05:04:19Z nằm trong đời #120 (04:23:25Z–08:22:05Z, boot+41m). Suy luận duy nhất vững: có hoạt động dpkg trên #120 quanh 05:04Z làm ledger compact thêm 64 gói — phù hợp replay #120 đã chạy. KHÔNG suy ra được postboot PASS (xem §1.4).
- **Khoảng lặng scheduler quanh btime #121 (F-195-T56-4 — T01-195 appendix195.py, T7-195 phân loại):** event cuối trước btime: succeeded deterministic-doctor 07:00:00.200Z (eid 11297); event đầu sau btime: reconciled 08:35:39.311Z (eid 11298) — **khoảng lặng 5.739 s (07:00:00Z → 08:35:39Z) BAO TRÙM btime 08:22:05Z**; heartbeat due ~07:15/~07:45 + deterministic-doctor due 08:00 đều VẮNG — giống chu kỳ stall 4.807 s đợt 194 (F-194-T01-4) và OUTAGE 8.406 s đợt 179 (VẪN MỞ). **T56 chỉ ghi nhận — phân loại thuộc T7-195 + parent.** (m) #121: 0 event BẤT KỲ trong [08:20:00; 08:28:00]Z; 0 requeued_after_restart trong cửa sổ; run 199 sched 08:35:51Z = btime +13m46s, RUNNING lúc đọc; KHÔNG run nào spanning btime.

## §5. Lock health (T6) — #120 KHÔNG GIẾT HOLDER (chuỗi 23 → 24) + #121 KHÔNG GIẾT HOLDER (chuỗi → 25)

### §5.1. Nhất quán log lock: 803 cặp lúc kiểm cuối, 0 đang giữ, chênh GIỮ 12

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 192). Số chính thức đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T56-194 kiểm cuối | T56-195 kiểm cuối | Δ trong phiên |
|---|---|---|---|
| Tổng dòng | 2801 | **2845** | +44 |
| TICKET / ACQUIRED / RELEASED | 813 / 802 / 790 | **826 / 815 / 803** | +13 / +13 / +13 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 373 / 12 / 1 / 10 | **378 / 12 / 1 / 10** | +5 / +0 |
| Cặp ACQUIRED→RELEASED | 790 | **803** | +13 |
| Đang giữ cuối log / Chênh ACQ−REL | 0 / 12 | **0 / 12** | — |
| Double-acquire (nghiêm ngặt) | 7 | **7** | 0 mới |

- **KIỂM CUỐI ĐỢT NÀY: ACQUIRED 815 / RELEASED 803, 803 cặp (raw 2851 dòng).**
- **+44 dòng kể từ T56-194 kiểm cuối (~03:19Z):** t4-194 attempt2 ×3 (03:29:23–03:33:20Z, hold 237 s) + attempt3 ×3 (03:36:52–03:40:34Z, hold 222 s) + t8-round194 ×26 (7 chu kỳ acquire/release + 5 COOLDOWN, 03:53–04:16Z — khép kín) + t01-round195 ×3 (TICKET+ACQUIRED 08:43:24Z, RELEASED 08:46:54Z, hold 210 s — khép kín) + t4-195 attempt1/2/3 ×9 (09:10:07Z, 09:14:16Z, 09:17:53Z — khép kín). 6+26+3+9 = 44 ✓.
- **Trong phiên T56-195 (từ lúc mở ~08:41Z): +12 dòng, +4 ACQ / +4 REL / +4 TICKET / +0 COOLDOWN** (t01-round195 + t4-195 attempt1/2/3 — đều khép kín).
- **Double-acquire GIỮ 7 — 0 ca mới**; STALE-LOCK GIỮ 12 — 0 ca mới; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE.** Caveat: **#68 GIẾT HOLDER t4**; **#95 CÓ GIẾT HOLDER** (t8-round179); **#96–#105 + #107–#121 KHÔNG giết** (verdict đợt 186–195; #106 không tính; #120/#121 chờ parent xác nhận số hiệu).

### §5.2. #120 — KHÔNG GIẾT HOLDER (chuỗi 23 → 24)

#120 (btime 04:23:25Z, `ac8a88aa-273d-42ef-a100-fc02ad143df4`, T01-195/T2-195/T9-194 xác minh): dòng lock cuối trước btime là t8-round194 RELEASED 04:16:34Z — **TRỐNG 411 s (6m51s)**; 0 dòng trong cửa sổ [04:23:25Z, 08:22:05Z); 0 STALE-LOCK mới. Khoảng trống gấp ~411 lần δ 1 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 24 reboot (#96–#105 + #107–#120; #106 không tính)** nếu parent tính tiếp.

### §5.3. #121 ứng viên — KHÔNG GIẾT HOLDER (chuỗi → 25 nếu xác nhận)

#121 ứng viên (btime 08:22:05Z, `8c4aa907-1329-4e9a-927e-acb2141baf67`, T01-195 xác minh 9 nguồn): dòng lock cuối trước btime là t8-round194 RELEASED 04:16:34Z — **TRỐNG 16.049 s (4h26m49s)**; dòng đầu tiên sau btime là t01-round195 TICKET 08:43:23Z; 0 STALE-LOCK mới. Khoảng trống gấp ~16.049 lần δ 1 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 25 reboot** nếu parent xác nhận #121 = 8c4aa907. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu #120/#121 theo hệ quả (e)-194 + T01/T2-195.
- **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục từ 04:16:34Z tới 08:43:23Z nên MỌI boot trong cửa sổ đó đều không thể giết holder (cùng lập luận như #118/#119 đợt 194).

### §5.4. Quét zombie + X11 + ss (2 snapshot: giữa ~08:56Z / cuối ~09:26Z)

| Thời điểm | Zombie | Socket X11 | Xvfb | ss listener |
|---|---|---|---|---|
| Giữa (~08:56Z) | 0 | 1 (X195) | 1 (:195, pid 51364) | vite [::1]:5187 KHÔNG có (T4 chưa attempt); 0 :8765 |
| Cuối (~09:26Z) | 0 | 4 (X193, X195, X196, X197) | **0** | 0 (không còn :5187/:8765) |

- **0 zombie thật ở cả 2 lần** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56. T56 không khởi động Xvfb/vite nào, không kill process nào. **X11 giữa/cuối là của luồng khác** (T01 O8 / T8 / P2 DISPLAY :193–:197) — T56 chỉ ghi nhận. **Listener 0.0.0.0:8765 VẪN MẤT** (như đợt 193/194 — xem F-193-T56-7, không có diễn biến mới). **Xvfb 1 → 0 nhưng socket 1 → 4** (xem F-195-T56-5): server :195 thoát (cùng lúc T4 thoát poller ~09:21:58Z) nhưng socket X195 còn sót; X196 (08:59Z) + X197 (09:04Z) + X193 (mtime 09:17Z) là socket của luồng khác, server đã thoát hoặc chưa dọn.

## §6. (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI (A) — 120/120 PASS (lần thứ 44) + suite 9/9 × 6 + MONITOR MỚI (MỌI ACQUIRED) ĐÃ KILL CHUNK 2 ĐÚNG LÚC

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7. Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — KHÔNG TÁI TẠO ĐƯỢC cách tính từ T6-191 (xem F-193-T56-6; các mốc chính đều khớp nên không chặn verdict). File khối đã trích `t7-block-a195.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–194. Poll script `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` — tất cả không đổi.
- **PHẠM VI HẸP — đã tuân thủ:** T56 chỉ chạy prune (§7) + suite/harness trên /tmp. Suite chạy trên log riêng trong /tmp — 0 dòng nào của T56 trên log lock thật trong phiên (§5.1: +12 dòng đều của t01/t4-195).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (~09:02–09:05Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (~2,5 phút — chạy khi gate T4 ĐỎ, TRƯỚC khi gate mở poll #36 09:10:06Z; log lock thật 2842 dòng không đổi trước/sau suite).
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), chạy N=120 lần với churn bơm vào (1 process `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s — giống hệt T6-151–T6-194 §6.2). Chỉ chạy trên /tmp, không đụng lock thật, không đụng poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn (120 lần hoàn thành): min 520 ms, max 3494 ms, trung bình 2058,53 ms. (File delays đúng 120 dòng — không có lần chạy bị kill dở đợt này NGOÀI run 59, xem dưới.)
- **KIỂM GATE — kiểm trước mỗi chunk + monitor TRONG chunk chu kỳ 10 s (sửa F-194-T56-4, lần đầu áp dụng):** monitor nền `t7-gate-monitor-195.sh` chạy song song mỗi chunk, kiểm mỗi 10 s: (1) poll-t4.log có "CUA YEN MO"/GATE_OPEN=1 không, (2) lock log có **ACQUIRED MỚI BẤT KỲ OWNER NÀO** không (MỚI — không chỉ t4/t8; T56 không bao giờ acquire lock thật nên ACQUIRED mới nào trong chunk cũng là tín hiệu dừng) — kill toàn bộ process group của chunk ngay khi phát hiện.
  - Chunk 1 (1–30, 09:06:33–09:08:24Z): gate ĐÓNG trước (poll #29, load5 2,52, blockers=1 của P2 vite) → sau chunk 1 (30/30). Monitor 0 kill.
  - Chunk 2 (31–60, 09:08:3x–09:10:16Z): **monitor KILL 09:10:16Z** — gate mở poll #36 09:10:06Z → T4 ACQUIRED 09:10:07Z → monitor phát hiện qua poll log, kill pgid 75510 (chunk rc=143, monitor rc=2). Runs 31–58 hoàn thành (28/28 PASS); **run 59 KHÔNG kịp spawn churn** (delays đúng 58 dòng lúc kill) — xem F-195-T56-3.
  - Chunk 3 (59–88, 09:22:27–09:24:17Z): sau khi T4 attempt3 nhả lock 09:21:32Z + thoát poller 09:21:58Z → 30/30. Monitor 0 kill.
  - Chunk 4 (89–120, 09:24:24–09:26:24Z): 32/32. Monitor 0 kill.
  - **Tổng: 30 + 28 + 30 + 32 = 120 lần hoàn thành, 120/120 PASS.**
- **T4-195 attempts (ghi nhận — verdict thuộc T4-195 + parent):** attempt1 ACQUIRED 09:10:07Z → RELEASED 09:13:53Z, hold 226 s, **RETRY** (tickCost median 78,0 ms > 60, F-146-T4-1); attempt2 ACQUIRED 09:14:16Z → RELEASED 09:17:20Z, hold 184 s, **RETRY** (partial, run-attempt exit=2, JSON 3294708B, wedged/timeout — KHÔNG tính verdict); attempt3 ACQUIRED 09:17:53Z → RELEASED 09:21:32Z, hold 219 s, **HỢP LỆ** (20/20 + LỚP B ĐẠT 5/5 + tickCost median 53,0 ms ≤ 60); poller thoát 09:21:58Z, đã dùng ngân sách 3/3. **Gate mở muộn:** poll #1 ~08:43:41Z → #36 09:10:06Z (~26 phút) vì load5 > 2 + blockers thoáng qua của luồng khác (P2 vite tại poll #29 — xem F-195-T56-6). **0 chồng pha (b) với T4 NGOÀI 9 s F-195-T56-3.**
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ đợt 150: 13/30 (43%); **(A) đợt 151–195: 120/120 mỗi đợt (100%)**. **Kết luận: (A) VẪN XANH sau 44 đợt** (tổng 5280/5280 dưới churn). 120/120 là tỉ lệ dưới churn bơm vào (stress) — điều đo được là SO SÁNH TƯƠNG ĐỐI: (A) 100% vs (B) 7% vs bản cũ 43%. **Chuỗi:** "xanh kép" 43 → **44**; suite xanh: 75 → **76**.

## §7. Prune cooldown lần 69 — XÓA 4 FILE theo điều (a) (KHÔNG PHẢI CHỜ LOCK)

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100 file; (c) không xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào log; (e) chỉ chạy khi lock đang trống. Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h (8 ngày)** — bảo thủ hơn chữ luật tối đa 24h.

- Trước prune (~09:27Z): tổng **94 file / 1316 byte** (92 sau prune 68 + 2 file mới: `cooldown-t01-round195` (08:46Z) + `cooldown-t4` (09:21Z)); ứng viên (`find -mtime +7`): **4 file**.
- **KHÔNG PHẢI CHỜ LOCK đợt này** (khác đợt 194 phải chờ 2 lần): prune lúc 09:27:03Z, ngay sau khi kiểm lock trống (dòng cuối RELEASED 09:21:32Z t4 attempt3; T4 đã thoát poller 09:21:58Z).
- ~09:27Z 26/11: điều (a) XÓA 4 file (đều ≥192h, đều qua mốc 168h ≥25h, không vi phạm (c)): **`cooldown-t8-round135`** (197,4h, mtime 2026-11-18T03:32:23Z), **`cooldown-t10-round135`** (197,0h), **`cooldown-t8-round136`** (194,8h), **`cooldown-t10-round136`** (193,6h — sát mốc nhất, vẫn qua 192h). `prune-deleted.txt` ghi đủ tên. File `cooldown-t8-round137` (190,7h) CHƯA tới mốc — KHÔNG xóa.
- **Kết quả prune lần 69: 4 file đã xóa.** Sau prune: **90 file / 1260 byte** (94 − 4 = 90 ✓; 1316 − 56 = 1260 ✓, 4 × 14 B). Điều (b) KHÔNG kích hoạt (90 < 100). Tầng tuổi: **≥192h: 4 → 0; ≥168h: 19 → 15; ≥72h: 60 → 56; ≥48h: 73 → 69**. **KHÔNG mất file nào không giải thích được.**
- **F-147-T6-1 — CHUỖI VẪN 0 (lần thứ mười sáu liên tiếp sau khi đứt tại 179):** cả 4 file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~25–29h. Không đổi luật (luật thuộc parent).

## §8. F-195-T56-n (sai số / ghi nhận riêng của T56-195)

- **F-195-T56-1 — Watcher-194 chết theo reboot, không phải chết đúng hạn (xem §1.2).** Poll cuối 04:23:48Z = btime #120 +23 s (cùng chữ ký đồng-hồ-nhảy F-193-T9-2 như watcher-193). Hạn mở rộng 08:35:51Z không cứu được watcher khỏi reboot. Khoảng không-watcher 4h27m37s bao trọn #120 — mẫu hệ thống lần thứ ba liên tiếp. Bài học cho brief đợt sau: watcher sống sang đợt sau CHỈ có ích nếu không có reboot giữa hai đợt; reboot là điểm chết chắc chắn của watcher (không có respawn tự động trong cell — xem LIMITS T5-163 §2).
- **F-195-T56-2 — Cờ #120 KHÔNG VIẾT ĐƯỢC post-hoc (xem §1.4).** Brief giao viết cờ với giả định #120 còn sống — thực tế #120 chết 08:22:05Z trước phiên. Ledger +64 gói @05:04:19Z gợi ý replay đã chạy nhưng không chứng minh postboot. T56 không bịa cờ (tiền lệ #118). Parent quyết §9(c).
- **F-195-T56-3 — Chunk 2 chồng ~9 s với T4 attempt1 (monitor kill đúng lúc).** T4 ACQUIRED 09:10:07Z (poll #36 09:10:06Z); monitor phát hiện qua poll log, kill pgid 75510 lúc **09:10:16Z** (chunk rc=143, monitor rc=2) — chậm 9 s do chu kỳ monitor 10 s. Trong cửa sổ 09:10:07–09:10:16Z, **run 59 chưa kịp spawn churn** (delays đúng 58 dòng; churn log 58 run) — **0 bằng chứng churn còn sống trong cửa sổ chồng**; process group của chunk chỉ còn bash/sleep, không chạm vite :5187 hay lock. **T56 KHÔNG tự phán vi phạm — giao parent quyết §9(i)** (như F-194-T56-4). Khác F-194-T56-4: lần này monitor ĐÃ hoạt động đúng thiết kế mới (theo dõi MỌI ACQUIRED + poll log); 9 s là độ trễ phát hiện, không phải bỏ lọt. Cải tiến đợt sau: rút chu kỳ monitor 10 s → 5 s để thu hẹp cửa sổ chồng (chi phí: gấp đôi số lần đọc log — chấp nhận được).
- **F-195-T56-4 — Khoảng lặng scheduler 5.739 s quanh btime #121 (xem §4).** Event cuối 07:00:00.200Z → đầu 08:35:39.311Z, bao trùm btime; heartbeat ~07:15/~07:45 + deterministic-doctor 08:00 đều vắng — giống chu kỳ stall 4.807 s đợt 194. Phân loại thuộc T7-195 + parent. T56 chỉ ghi nhận.
- **F-195-T56-5 — Xvfb 1 → 0 nhưng socket X11 1 → 4.** Server :195 (pid 51364) thoát cùng lúc T4 thoát poller ~09:21:58Z; socket X195 còn sót; X196 (08:59Z) + X197 (09:04Z) + X193 (mtime 09:17Z) là socket của luồng khác, server đã thoát hoặc chưa dọn. T56 không tạo/xóa socket nào. Ghi nhận — socket sót không ảnh hưởng lock hay postboot.
- **F-195-T56-6 — Gate T4 mở muộn ~26 phút vì tải + blocker của luồng khác.** Poll #1 ~08:43:41Z → mở #36 09:10:06Z; load5 kẹt 2,2–2,9 (cần < 2); blockers=1 thoáng qua tại poll #18/#22/#29 (bằng chứng blockers-list-29.txt: **chỉ có P2-195 vite pid 67716** — KHÔNG phải process của T56; suite T56 chỉ spawn bash+sleep, vô hình với cả hai cách đếm blocker của T4). T56 không gây chậm gate (suite xong 09:05:02Z, gate mở 09:10:06Z — cách 5 phút). Ghi nhận cho T10: cửa yên đợt này mở muộn do tải chung của đợt, không phải do T56.
- **F-195-T56-7 — Lỗi shell của chính T56 lúc spawn watcher (đã sửa ngay).** Lệnh `D=... && nohup bash $D/replay-watch-195.sh ... &` đặt gán `D` vào trong danh sách nền (`&` áp cho cả `A && B`) nên `$D` rỗng ở shell chính — `head`/`tail` báo lỗi `/replay-watch-195.log`. Watcher vẫn spawn ĐÚNG (đường dẫn tuyệt đối nằm trong phần nền, `D` có giá trị ở đó; pid 44695, START line đầy đủ). T56 kiểm lại ngay bằng đường dẫn tuyệt đối. **Bài học: KHÔNG BAO GIỜ gán biến rồi `&` cả dòng — gán biến ở dòng riêng trước, hoặc chỉ dùng đường dẫn tuyệt đối.**
- **F-195-T56-8 — Suite không có monitor tự kill (cải tiến đợt sau).** Suite 6 lần chạy khi gate ĐỎ, xong 09:05:02Z, gate mở 09:10:06Z — không chồng đợt này. Nhưng nếu gate mở GIỮA suite (mỗi run ~30 s, 6 run ~3 phút) thì suite không tự dừng (chỉ chunk có monitor). Đề xuất: đợt sau bọc suite bằng cùng monitor (hoặc kiểm gate trước mỗi run). Không phải vi phạm đợt này — chỉ là lỗ hổng quy trình.

## §9. Đề xuất cho parent (quyết ở aggregate 195)

**(a) Chấp nhận verdict đợt 195 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #121 ứng viên đã có (replay đầy đủ, poll=0, verify độc lập exit=0, GST thư mục thật), replay #121 ĐÃ CHẠY (dạng A), cờ cũ VẪN CÓ, (A) 120/120 lần 44, holder #120 23 → 24 / #121 → 25, prune 69 xóa 4 file, hướng (3) lần 41 — với caveat F-195-T56-2 (cờ #120 không có) + F-195-T56-3 (chunk 2 chồng 9 s, parent quyết ở (i)).

**(b) Cờ #121 ứng viên (replay-day-du, poll=0) — CÂU HỎI QUYẾT:** replay chạy thật 08:35:42–08:37:34Z (1.477 dòng) → poll0 exit=0, verify độc lập exit=0 (log md5 giống hệt poll0), 11/11 apt + 5/5 lib + GST 269=269 THƯ MỤC THẬT → dpkg 1.477 + cache 171 + lists 37. **Parent chọn 1 trong 2:** (b1) Chấp nhận **KHÔNG caveat** (profile mạnh nhất kể từ #117 — T56 đề xuất (b1)); (b2) Chấp nhận CÓ caveat (chỉ còn số hiệu chưa quyết — T56 thấy (b2) không cần thiết vì nội dung PASS là đầy đủ nhất có thể).

**(c) #120 KHÔNG CÓ cờ — tổng boot không cờ 28 → 29?** #120 không watcher, không verify được post-hoc (khác #116: không có cả bằng chứng replay chạy ĐẦY ĐỦ — chỉ có ledger +64 gói gợi ý). **Parent chọn 1 trong 2:** (c1) Chấp nhận KHÔNG CÓ cờ #120 (tổng 28 → 29; T56 đề xuất (c1) — trung thực với bằng chứng); (c2) Ghi nhận "replay #120 đã chạy (ledger)" mà KHÔNG gọi là POSTBOOT_PASS (tổng không-cờ vẫn 28 → 29, nhưng có ghi nhận riêng — T56 thấy (c2) làm mờ ranh giới cờ/phi-cờ, không đề xuất).

**(d) Xác nhận 8c4aa907 = #121?** (btime 08:22:05Z, epoch 1795681325, gap 14.320 s; T01-195 xác minh 9 nguồn; (m) #121 thuộc T2-196.)

**(e) #120 KHÔNG GIẾT HOLDER — chuỗi 23 → 24; #121 KHÔNG GIẾT HOLDER — chuỗi → 25** (trống 411 s / 16.049 s). **(f) (A) 120/120 lần thứ 44 (tổng 5280/5280) + suite 9/9 × 6 (chuỗi suite xanh 76) — parent ghi nhận?**

**(g) Prune lần 69: điều (a) xóa 4 file, queue 94 → 90; F-147-T6-1 chuỗi VẪN 0 lần thứ 16. (h) Hướng (3) VẪN ĐỨNG lần thứ 41 — parent ghi nhận cả hai?**

**(i) F-195-T56-3 (chunk 2 chồng ~9 s với T4 attempt1; monitor kill đúng lúc; run 59 chưa kịp spawn churn — 0 bằng chứng ảnh hưởng; monitor chu kỳ 10 s) — parent quyết: có tính là VI PHẠM (chuỗi 0 vi phạm tính lại từ 1 hay giữ 0) hay chỉ là caveat (ghi nhận + rút chu kỳ monitor xuống 5 s đợt sau)? Tiền lệ: F-194-T56-4 (chồng ~48 s với t01, 0 ảnh hưởng) = VI PHẠM NHẸ theo quyết (p)-194; F-193-T56-3 (chồng pha (b) ~10–12 s với T4) = LIGHT VIOLATION theo quyết (p)-193. Khác biệt đợt này: chồng chỉ 9 s, monitor đã kill đúng thiết kế (không phải bỏ lọt như F-194-T56-4), và 0 bằng chứng churn còn sống — mức độ nhẹ hơn cả hai tiền lệ.**

**(j) Watcher-195 vẫn chạy trên #121** (pid 44695, hạn 14:35:51Z = hạn cứng đợt 196) — **T56-196 PHẢI kiểm tra ps trước khi spawn watcher-196** (xem §1.2 + header watcher-195); nếu watcher-195 còn sống thì KHÔNG spawn mới.

## §10. Sai số của chính T56-195 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-195-T56-1..8** | Xem §8 (đầy đủ, không lặp lại ở đây) | Ghi nhận | — |
| §8/F-195-T56-7 | Lỗi shell lúc spawn watcher (`D=... && ... &` làm `$D` rỗng ở shell chính) | Lỗi thao tác — đã sửa ngay trong phiên | Watcher spawn đúng; kiểm lại bằng đường dẫn tuyệt đối; bài học ghi ở F-195-T56-7 |
| §1 | LIMITS này viết sau khi T4 thoát poller (không còn gate để chồng) — suite/harness đã xong trước đó | Hạn chế nhỏ | Thứ tự đúng: đo đạc xong mới viết LIMITS |
| §5 | T56 không kịp snapshot zombie/X11 lúc mở (ưu tiên spawn watcher + verify postboot trước) | Hạn chế nhỏ | Chỉ có 2 snapshot (giữa/cuối); 0 zombie cả 2 lần; X11 giữa là 1 socket lúc ~08:56Z |
| — | md5 cờ cũ #112/#111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95 không kiểm lại đợt này | Hạn chế nhỏ | Giữ số đợt 193; các cờ #121/#119/#117/#115/#114/#112 đã kiểm lại, đều khớp |
| — | (m) #120/#121 thuộc T2-195/T2-196; RAM/ENOSPC #121 thuộc T9-195; inotify không đo lại (giữ số T6-187: 63.747) | Hạn chế nhỏ | Thuộc T9-195 / T2-195/T2-196 |
| — | Khoảng lặng scheduler 5.739 s quanh btime #121 chưa phân loại (thuộc T7-195) | Ghi nhận | Xem F-195-T56-4 |

**Số liệu chính thức lấy từ log watcher-194 + log watcher-195 + log trực tiếp (verify độc lập/independent + poll0) + dpkg/history/term.log của #121 + ledger /var/lib/hatch/os-intent/ledger.jsonl + log lock thật + queue trên đĩa + poll log T4-195 + log/dir round194-t9 (sampler #120) + T01-195 appendix195.py + T2-195 m-check195.txt + đối chiếu aggregate 194 (§14.2, NGUỒN GỐC CHƯA NGÃ NGŨ) + LIMITS T56-194.**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND195_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round195-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round195-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push: đợt 191 + đợt 192 + đợt 193 + đợt 194 = 48/166/121/102 (theo MEMORY; T10-195 đếm lại bằng dedup toàn cục).

## Phụ lục A — Trích số liệu T56-195 (bản chính, 08:41Z – 09:28Z 26/11)

```
boot #120=ac8a88aa-273d-42ef-a100-fc02ad143df4 btime=1795667005=04:23:25Z (T01/T2-195 + T9-194 sampler); gap #119->#120 = 6917 s; song toi 08:22:05Z (3h58m40s); KHONG CO co (xem §1.4); (m) DUONG (CUOI) theo T2-195, n 54/55
boot #121=8c4aa907-1329-4e9a-927e-acb2141baf67 btime=1795681325=08:22:05Z (uptime -s KHOP; journal idx 0 first 08:22:18Z = btime +13 s; T01-195 xac minh 9 nguon); gap #120->#121 = 14320 s
watcher-194: START 02:48:57Z pid=5557; poll cuoi 04:23:48Z dpkg 777 md5=fddba8f4; CHET THEO REBOOT 04:23:25Z, 0 END/STOP/NEWBOOT (F-193-T9-2: dong ho nhay ~23 s); chet ~4h12m TRUOC han 08:35:51Z
watcher-195: START 08:51:25Z pid=44695 boot=8c4aa907 end=14:35:51Z (han cung dot 196); init dpkg 1477 md5=01ff5ecc mtime=08:37:34Z cache=171 lists=37 gst_sys=269; REPLAY_DONE poll dau -> poll0 exit=0 (08:51:26Z); FLAG-WRITTEN 08:51:26Z poll=0 (old=55c9e0b7); ALIVE luc dong (poll 09:27:01Z)
khoang khong-watcher: 04:23:48Z -> 08:51:25Z = 16057 s (4h27m37s) — bao toan bo doi #120 + 29m20s dau #121
POSTBOOT_PASS #121: CO md5=28847b1e; replay-day-du poll=0; dpkg 1477 md5=01ff5ecc; cache=171; lists=37; GST 269 THU MUC THAT; verify doc lap exit=0 (~08:47Z, md5 log 69d0bd75 = poll0); backup #119 md5=863a6035 = goc
POSTBOOT_PASS #120: KHONG CO (0 file nhac ac8a88aa trong co; tong boot khong co 28 -> 29 neu parent chap nhan)
replay #121: 08:35:42-08:37:34Z (boot+13m37s -> boot+15m29s), 1477 dong, install cuoi gstreamer1.0-tools; /var/log/apt CO; on dinh tu 08:37:34Z (md5 01ff5ecc khong doi toi 09:27Z)
ledger: 1 dong ts=1795661454 compacted=true added=170 (tang tu ~106); mtime 05:04:19Z (doi #120, boot+41m); KHONG co dong replay #121
Co cu KHONG DOI: #119 863a6035 / #117 46e0b657 / #115 734f8e2d / #114 288f863b / #112 ca79a6b2
marker: md5 cb7102c0, mtime 2026-11-20 11:39:47Z — song qua #49-#121 = 73 reboot (neu #121 xac nhan)
Lock (mo/kiem cuoi): raw 2839/2851 (mo ~08:41Z, truoc t01-round195); cleaned 2833/2845; ACQUIRED 811/815; RELEASED 799/803; cap 799/803; chenh 12/12; TICKET 822/826; COOLDOWN 378; STALE-LOCK 12; STALE-TICKET 1; TIMEOUT 10; double-acquire 7; held 0
  Delta tu T56-194 kiem cuoi: +44 dong (t4-194 a2/a3 6 + t8-194 26 + t01-195 3 + t4-195 a1/a2/a3 9); trong phien T56-195: +12 dong (t01 3 + t4-195 9)
(A): suite a89c0676; block dc973443 (giong het 151-194); poll 1710e480; lock v2 520b8baa; lock v1 fd21193c; suite 6x 9/9 rc=0 (~09:02-09:05Z); harness 120/120 B1=1 B2=0; delay 520/3494/2058.53 ms
Gate: T4 gate mo poll #36 09:10:06Z (load1 1.03 load5 1.88, RAM 1940MB); attempt1 ACQUIRED 09:10:07Z RELEASED 09:13:53Z hold 226 s RETRY tickCost 78.0; attempt2 ACQUIRED 09:14:16Z RELEASED 09:17:20Z hold 184 s RETRY partial exit=2; attempt3 ACQUIRED 09:17:53Z RELEASED 09:21:32Z hold 219 s HOP LE 20/20 B 5/5 tickCost 53.0; poller thoat 09:21:58Z
Monitor: chunk1 09:06:33-09:08:24Z 30/30 0 kill; chunk2 KILL 09:10:16Z (gate mo, 9 s sau T4 ACQUIRED; runs 31-58 xong, run 59 chua spawn churn); chunk3 09:22:27-09:24:17Z 30/30; chunk4 09:24:24-09:26:24Z 32/32; tong 120/120
Prune 69: truoc 94 file / 1316 B; xoa 4 file (dieu (a)): cooldown-t8-round135 (197.4h), cooldown-t10-round135 (197.0h), cooldown-t8-round136 (194.8h), cooldown-t10-round136 (193.6h); sau 90 file / 1260 B; tang tuoi: >=192h 4->0; >=168h 19->15; >=72h 60->56; >=48h 73->69
Holder: #120 KHONG GIET (trong 411 s, ~411x delta); chuoi 23 -> 24; #121 KHONG GIET (trong 16049 s, ~16049x delta); chuoi -> 25 (neu xac nhan)
Dong ho: CF - local = +1 s (local CHAM ~1 s); delta=1 s
X11/zombie: giua 0 zombie / X11 1 (X195) / Xvfb 1 (:195 pid 51364); cuoi 0 zombie / X11 4 (X193/X195/X196/X197) / Xvfb 0; :8765 VAN MAT; :5187 chi trong luc T4 attempt
```
