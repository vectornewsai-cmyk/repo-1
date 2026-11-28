# PHASE9_ROUND194_T56_INFRA_LOCK_LIMITS.md — T56 đợt 194 (gộp T5+T6: infra/watcher + POSTBOOT_PASS + lock health + prune)

**Trạng thái:** ĐÃ XONG watcher-194 + cờ #119 (**repair-som-quyet-h, poll=1 — CÓ caveat: GST là SYMLINK như #115, KHÔNG phải thư mục thật như #117**) + (A) **120/120 lần thứ 43** + suite 9/9 × 6 + prune lần 68 + #118 **KHÔNG GIẾT HOLDER** (chuỗi 21 → 22) + #119 **KHÔNG GIẾT HOLDER** (chuỗi → 23) + hướng (3) **lần thứ 40** + **F-194-T56-1..8**. 1 entry stage duy nhất.

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #119 ứng viên (55c9e0b7) | **ĐÃ CÓ 02:50:55Z (boot+22m47s, repair-som-quyet-h, poll=1)** — verify form-B exit=1 → --repair 1 lần (~1m58s) → poll1 exit=0 → FLAG-WRITTEN; verify độc lập exit=0; 11/11 apt + 5/5 lib; GST 269=269 **SYMLINK → debroot (như #115, KHÔNG phải thư mục thật như #117)**; dpkg **777**; cache 108; lists 75 |
| POSTBOOT_PASS #118 (8a23277a) | **KHÔNG CÓ** — boot chết 02:28:08Z trước khi T56-194 mở; KHÔNG có watcher trong toàn bộ đời #118 (watcher-193 chết theo reboot 22:21:55Z); replay #118 KHÔNG xác minh được post-hoc (dpkg.log đã reset); tổng boot không cờ **27 → 28** |
| Replay #119 | **KHÔNG CHẠY (dạng B, như #115/#117)** — dpkg.log chỉ 2 dòng 02:35:46Z (boot+7m38s), đóng băng tới lúc repair 02:48:57Z (791 s); /var/log/apt KHÔNG TỒN TẠI lúc mở; lists 5; cache 0; GST 0; libevent MISSING lúc mở |
| POSTBOOT_PASS #117 (1c0bcaad) | **VẪN CÓ**, md5 KHÔNG ĐỔI (46e0b657); backup byte-identical ở round194-t56/POSTBOOT_PASS-1c0bcaad |
| POSTBOOT_PASS #115 (ebc5a3b9) | **VẪN CÓ**, md5 KHÔNG ĐỔI (734f8e2d) |
| Watcher-193 | **CHẾT THEO REBOOT 22:21:55Z** (poll cuối 22:22:23Z, dpkg 768 ổn định — KHÔNG có dòng END/STOP/NEWBOOT; pid 6482 chết cùng boot 1c0bcaad; xem F-194-T56-3: poll cuối muộn hơn btime #118 ~28 s là do đồng hồ nhảy lúc reboot, F-193-T9-2) |
| Watcher-194 | START 02:48:57Z, pid **5557**, hạn **08:35:51Z 26/11 (= hạn cứng đợt 195)** — **ALIVE lúc đóng** (poll 03:20:22Z); hạn MỞ RỘNG theo lệnh brief (sống sang đợt 195 — xem §1.2) |
| Khoảng không-watcher | **~4h27m02s** (22:21:55Z → 02:48:57Z) — bao **toàn bộ đời #118 + 20m49s đầu #119** |
| Hướng (3) | **VẪN ĐỨNG lần thứ 40** |
| Marker sống | CÒN, mtime 2026-11-20 11:39:47Z không đổi, md5 cb7102c0 — sống qua **#49–#119 = 71 reboot** (nếu #119 xác nhận) |
| (A) lock | **120/120 PASS lần thứ 43** (tổng **5160/5160**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 74 → **75** |
| Lock | KHỎE (790 cặp lúc kiểm cuối, 0 đang giữ, chênh **GIỮ 12**, STALE-LOCK GIỮ 12, double-acquire GIỮ 7, 0 TIMEOUT mới, 0 "KHÔNG NHẢ"); **#118 KHÔNG GIẾT HOLDER (21 → 22)**; **#119 KHÔNG GIẾT HOLDER (→ 23)** |
| Prune lần 68 | **XÓA 4 FILE theo điều (a)** (queue 96 → 92; F-147-T6-1 chuỗi **VẪN 0 lần thứ 15**); prune PHẢI CHỜ lock 2 lần (T4 attempt1 + t01 O8) — tiền lệ đợt 186 |
| Vi phạm T4 | **0 chồng pha (b) với T4** (attempt1 kết thúc 03:00:46Z, chunk 1 bắt đầu 03:05:44Z; attempt2 chưa mở lúc đóng) — xem F-194-T56-4: chunk 4 chồng ~48 s với **t01-round194** (KHÔNG phải T4), parent quyết |
| X11 / zombie | **0 zombie cả 2 snapshot (giữa/cuối)**; X11 1 → 5 socket (X194/X195/X196 mới — của luồng khác); Xvfb 1 → 1; listener 8765 VẪN MẤT (như đợt 193), vite :5187 chỉ trong lúc T4 attempt1 |
| Đồng hồ | Cloudflare local CHẬM ~2 s (mid 1795661704 vs CF 02:55:06Z = 1795661706) — δ=2 s; khoảng trống lock gấp ~324× / ~7.710× δ → KHÔNG caveat |
| Quy tắc B4 | **T56-194 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 configure/install/update/repair tay); verify độc lập chỉ đọc |

**Số hiệu boot #119 CHƯA QUYẾT — T01-194 xác minh 9 nguồn (parent quyết (e)).** T56 KHÔNG phán (m) — (m) #117/#118 thuộc T2-194 + parent.

## §0. Trạng thái lúc mở (~02:45Z)

- **Boot lúc mở: `55c9e0b7-2d97-4260-a6ca-45538e24b6c1`, btime 02:28:08Z** (epoch 1795660088; `uptime -s` khớp; journal idx 0 duy nhất, first 02:28:27Z = btime +19 s; `last` reboot 02:28 still running; `who -b` Nov 26 02:28; T01-194 xác minh 9 nguồn). **Số hiệu #119 ứng viên theo hệ quả (e)-193 (8a23277a = #118).** Gap #118→#119 = **14.773 s (4h06m13s)**. **KHÔNG có reboot trong phiên T56.**
- **Replay #119 CHƯA TỚI lúc mở (dạng B):** dpkg.log 2 dòng, md5 98c68c14, mtime 02:35:46Z; /var/log/apt KHÔNG TỒN TẠI; lists 5; cache 0; GST hệ thống 0 file; libevent-2.1.so.7 MISSING; 0 proc apt/dpkg. Debroot GST 269 file CÒN.
- **Lock lúc mở: TRỐNG** (dòng cuối RELEASED 22:11:07Z t8-round193); queue 95 file / 1330 byte. **T4-194 ĐÃ spawn lúc T56 mở** (poll #1 02:48:52Z, gate0 chưa đạt, đang chờ cửa yên) — khác đợt 193 (T4 spawn sau). Không có dpkg/apt nào CỦA T56.
- **Latch:** `round-in-progress.md` — T56 không kiểm latch đợt này (không thuộc nhiệm vụ T56).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 26/11/2026)

**22:21:55Z 25/11** **reboot #118 (8a23277a)**; watcher-193 chết theo reboot (poll cuối 22:22:23Z — xem F-194-T56-3); T7/T9 xác minh #118 lúc 22:23Z (dpkg 2 dòng, boot tuổi). **02:28:08Z** **reboot 55c9e0b7 (#119 ứng viên)**; gap #118→#119 = 14.773 s. **02:35:46Z** dpkg.log 2 dòng (boot+7m38s) — rồi IM HOÀN TOÀN. **02:48:52Z** T4-194 poll #1 (gate0 chưa đạt; t5flag=CŨ từ round193-t56/). **02:48:57Z** **watcher-194 START, pid 5557** (khoảng không-watcher ~4h27m02s); poll đầu: dpkg 2 dòng, đóng băng 791 s → **EARLY-REPAIR TRIGGER** (boot+20m49s) → verify form-B exit=1 → **--repair**. **02:48:57Z** --repair bắt đầu (apt-get update nhanh đợt này, ~1 phút; install 11 gói). **02:50:54Z** history.log End-Date (ledger ts 1795661454); dpkg.log 2 → **777 dòng**; GST 269; cache 108; lists 75. **02:50:55Z** postboot poll1 sau repair **exit=0** → **FLAG-WRITTEN 02:50:55Z** (boot+22m47s, repair-som-quyet-h, poll=1). **02:51:07Z** T4 poll #4: t5flag=PASS qua **ĐƯỜNG CHÍNH round194-t56/** — fix (p)-191 đứng đợt thứ hai liên tiếp. **~02:52Z** T56 verify độc lập: postboot **exit=0** (11/11 apt + 5/5 lib + GST 269 SYMLINK — xem §2). **02:54:11Z** T4 mở cửa yên poll #8 → attempt1 (lock 02:54:12Z, hold 394 s → RELEASED 03:00:46Z). **03:02–03:05Z** T56 chạy suite 6 lần (sau khi T4 nhả lock, trước chunk 1). **03:05:44–03:13:15Z** T56 chạy harness 120 lần, 4 chunk (xem §6). **03:12:27Z** t01-round194 ACQUIRED (O8, hold 305 s → RELEASED 03:17:31Z) — chồng chunk 4 ~48 s (xem F-194-T56-4). **03:18:31Z** T56 prune lần 68 (xem §7). **~03:20Z** T56 viết LIMITS này. Watcher-194 vẫn ALIVE (pid 5557, poll 03:20:22Z). T4-194 poll #31 lúc 03:18:43Z (load5 4,10 — cửa ĐÓNG; attempt2 chưa mở).

### §1.2. Watcher-194 — hạn MỞ RỘNG sang đợt 195 (lệnh brief)

- Gen từ watcher-193 bằng `gen-watcher-194.py` (header viết mới; body chỉ thay token có assert đếm; `bash -n` OK). Spawn bằng đường dẫn TUYỆT ĐỐI (`nohup bash /abs/path/replay-watch-194.sh`, F-167-T5-2); verify độc lập bằng ps + START line + poll đầu.
- **END = 08:35:51Z 26/11 (= hạn cứng đợt 195) thay vì hạn cứng đợt 194 (05:35:51Z)** — theo lệnh brief T56-194: watcher-194 phải sống qua cả đời boot #119 VÀ sang đợt 195 (bài học #116/#118: khoảng không-watcher giữa hai đợt là nơi mất cờ). **T56-195 PHẢI kiểm tra `ps` trước khi spawn watcher-195: nếu `replay-watch-194.sh` CÒN SỐNG thì KHÔNG spawn mới** (tránh 2 watcher cùng repair) — ghi rõ trong LIMITS T56-195; nếu watcher-194 đã chết thì spawn watcher-195 bình thường. Cờ POSTBOOT_PASS-#119 và guard `repaired-55c9e0b7` nằm ở round194-t56/ (watcher-195 đọc được qua OLD_T5_DIR nếu cần).
- Watcher-194 theo dõi boot hiện tại 55c9e0b7 + MỌI reboot trong phiên; last_change khởi tạo TỪ mtime dpkg.log; DONE khi replay tiến triển thật (>100 dòng, ổn định 2 poll, 0 apt/dpkg); REPAIR SỚM (h) tại boot+15' + đóng băng ≥600 s + 0 proc + dòng < 100 + chưa repair; backstop 60'; TUYỆT ĐỐI KHÔNG repair khi replay đang chạy; chỉ 1 repair / 1 boot.

### §1.3. POSTBOOT_PASS #119 — ĐÃ CÓ 02:50:55Z (repair-som-quyet-h, poll=1)

- Watcher-194 trigger EARLY-REPAIR ngay poll đầu (boot+20m49s, đã qua mốc boot+15'; frozen 791 s ≥ 600 s; 0 proc; 2 dòng < 100) → verify form-B: postboot check-only **exit=1** (đúng kỳ vọng) → `--repair` **exit=0** (apt log đã copy ra khỏi /tmp NGAY thành `t5-postboot-repair-apt-55c9e0b7.log`, F-173-T5-9) → poll1 sau repair **exit=0** (hoàn tất 02:50:55Z, dpkg 777, cache 108, lists 75) → FLAG-WRITTEN (ghi FULL boot_id, F-151-T5-1; timestamp HOÀN TẤT poll1, F-152-T5-3).
- **Repair đợt này NHANH (~1m58s) so với #117 (~13m17s)** — mirror nhanh hơn, cùng 11 gói; dpkg 777 dòng (hơn #117 9 dòng: 2 dòng startup + 775 dòng install).
- **Caveat (đề xuất — tiền lệ #111/#115 repair-sớm, poll=1):** cờ này là **repair-som-quyet-h, KHÔNG phải replay-đầy-đủ**; GST là **SYMLINK → debroot (ephemeral, như #115)** — xem §2. Parent quyết CÓ caveat hay KHÔNG caveat. Nội dung PASS là thật (verify độc lập exit=0), chỉ mode khác profile #114.
- **T4-194 đã thấy postboot PASS qua ĐƯỜNG CHÍNH:** poll #4 (02:51:07Z) t5flag=PASS, gate0=T5 (round194-t56/POSTBOOT_PASS); poll #5 (02:51:53Z) postboot_exit=0. Poll #1–#3 trước khi cờ về vẫn dùng cờ cũ round193-t56/ — đúng thiết kế. **Fix (p)-191 đứng đợt thứ hai liên tiếp** (xem F-194-T56-5).

### §1.4. POSTBOOT_PASS #118 — KHÔNG CÓ (tổng boot không cờ 27 → 28)

- #118 (8a23277a, btime 22:21:55Z) sống 22:21:55Z → 02:28:08Z (4h06m13s). **KHÔNG có watcher nào trong toàn bộ đời #118** (watcher-193 chết theo reboot 22:21:55Z; T56-194 mở phiên lúc ~02:45Z — SAU khi #118 chết 17 phút). **0 file cờ nào nhắc 8a23277a** (chỉ có cờ #117 1c0bcaad trong round193-t56/).
- Replay #118: bằng chứng DUY NHẤT còn lại là T7-193 appendix (xác minh 22:23Z: dpkg.log 2 dòng, boot tuổi — dạng B lúc mới sinh) + T9-193 ram-sampler chạy trên #118 (22:23–22:27Z, không đo dpkg). **Không còn bằng chứng tươi nào về dpkg #118 sau 22:23Z** (dpkg.log đã reset lúc reboot 02:28:08Z; journal #118 đã mất — journal chỉ giữ idx 0 của boot hiện tại). Không giống #116 (T8-192 chứng minh replay CHẠY 2 → 1.468 dòng) — **#118: replay CÓ CHẠY hay KHÔNG là KHÔNG XÁC MINH ĐƯỢC**. Viết cờ cho #118 lúc này sẽ là cờ không verify — T56 KHÔNG làm.
- **Tổng boot không cờ 27 → 28** (nếu parent chấp nhận). Parent quyết ở §9(c).

## §2. Verify độc lập #119 (T56, check-only, ~02:52Z) + GST SYMLINK (F-194-T56-2)

- **Verify độc lập: postboot exit=0** — wrapper PASS (đã vá K1); **5/5 lib PASS** (libevent/libEGL/libavif/libdw/libevdev — đủ cả 5, libevent-2.1.so.7 CÓ sau repair); GST **269=269 PASS** (isomp4 + libav); **11/11 gói apt PASS** (kể cả libevdev2, Q7 đợt 114); KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. File: `t56-postboot-independent-55c9e0b7.log`.
- **GST #119 là SYMLINK → `/home/hatch/workspace/tmp-q6r3-debroot/.../gstreamer-1.0` (269 file), KHÔNG phải thư mục thật như #117.** Postboot script dòng 714 (`[ -L "$GST_SYS" ]`) in INFO symlink; T56 xác minh lại bằng `ls -ld` KHÔNG trailing slash + `readlink` (symlink 77 byte → debroot).
- **F-194-T56-2 — Lỗi kiểm của chính T56 (đã sửa):** lần kiểm đầu T56 chạy `ls -ld .../gstreamer-1.0/` và `readlink .../` **CÓ trailing slash** — trailing slash khiến ls/readlink đi xuyên symlink, hiển thị thư mục đích, T56 suýt ghi "thư mục thật". Kiểm lại KHÔNG slash mới đúng. **Bài học: KHÔNG BAO GIỜ kiểm symlink bằng đường dẫn có trailing slash.** Hệ quả: caveat cờ #119 NẶNG HƠN #117 (giống #115: symlink ephemeral + repair + poll=1) — parent cân nhắc khi chọn (b1)/(b2) ở §9.
- Theo chú thích trong postboot script: repair tạo symlink GST → debroot TRƯỚC, rồi apt install ghi plugin xuyên symlink; ở #117, sau install đường dẫn là thư mục thật, còn ở #115/#119 symlink vẫn còn lúc verify. Nội dung PASS như nhau (269=269) — chỉ khác tính bền vững qua reboot.

## §3. Cờ cũ — VẪN CÓ, md5 KHÔNG ĐỔI

| Cờ | md5 lúc kiểm cuối |
|---|---|
| #119 (55c9e0b7, MỚI) | 863a6035 |
| #117 (1c0bcaad) | 46e0b657 (= backup POSTBOOT_PASS-1c0bcaad, byte-identical) |
| #115 (ebc5a3b9) | 734f8e2d |
| #114 (b0aab705, backup ở round192-t56/) | 288f863b |
| #112/#111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95 | KHÔNG kiểm lại đợt này (giữ số đợt 193: ca79a6b2 / abe240cb / 302ae331 / a6fc7d69 / b7259902 / 8e6d6e5d / 6007fea8 / 8c32fc3c / 3d031656 / 26452ec1 / 50869e4e / f8cd6d46) |

## §4. Replay #119 KHÔNG CHẠY (dạng B) + ledger XOAY (F-194-T56-6)

- **Dạng B, mẫu quen thuộc (#115/#117):** dpkg.log chỉ 2 dòng "startup packages configure" 02:35:46Z (boot+7m38s) rồi im; /var/log/apt KHÔNG TỒN TẠI lúc mở; lists 5; cache 0; GST 0; libevent MISSING; 0 proc apt/dpkg/wrapper lúc mở. Early-repair (h) là xử lý đúng — replay không tới thì repair thay thế, không chờ.
- **Nguyên nhân dạng B VẪN CHƯA TÌM RA trong cell** — nợ host-side theo (k)-174 VẪN MỞ (quyết (k)-193). #118/#119 đều dạng B lúc mới sinh (cả 2 boot của đợt 193–194). T56 ghi nhận, không điều tra thêm (ngoài phạm vi T56).
- **Ledger — VẪN 2 dòng nhưng XOAY NỘI DUNG (F-194-T56-6, nối F-193-T56-4):** `/var/lib/hatch/os-intent/ledger.jsonl` lúc kiểm cuối: **2 dòng** — [0] ts **1795640347** (repair #117, compacted=true); [1] ts **1795661454** (= 02:50:54Z, **repair #119**, added ~106 gói). **Dòng repair #117 (ts 1795640347) nay là dòng compacted ĐẦU; dòng repair #115 (ts 1795618502) ĐÃ MẤT từ đợt 193.** **KHÔNG có dòng nào cho replay #119** (replay không chạy). T2/T10 lưu ý: ts 1795661454 là của repair #119, KHÔNG phải btime #119 (1795660088); số dòng ledger (2) KHÔNG đổi không có nghĩa nội dung không đổi — phải đọc ts.

## §5. Lock health (T6) — #118 KHÔNG GIẾT HOLDER (chuỗi 21 → 22) + #119 KHÔNG GIẾT HOLDER (chuỗi → 23)

### §5.1. Nhất quán log lock: 790 cặp lúc kiểm cuối, 0 đang giữ, chênh GIỮ 12

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 192). Số chính thức đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T56-193 kiểm cuối | T56-194 kiểm cuối | Δ trong phiên |
|---|---|---|---|
| Tổng dòng | 2769 | **2801** | +32 |
| TICKET / ACQUIRED / RELEASED | 804 / 793 / 781 | **813 / 802 / 790** | +9 / +9 / +9 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 368 / 12 / 1 / 10 | **373 / 12 / 1 / 10** | +5 / +0 |
| Cặp ACQUIRED→RELEASED | 781 | **790** | +9 |
| Đang giữ cuối log / Chênh ACQ−REL | 0 / 12 | **0 / 12** | — |
| Double-acquire (nghiêm ngặt) | 7 | **7** | 0 mới |

- **KIỂM CUỐI ĐỢT NÀY: ACQUIRED 802 / RELEASED 790, 790 cặp (raw 2807 dòng).**
- **+32 dòng kể từ T56-193 kiểm cuối:** t8-round193 ×26 (7 chu kỳ acquire/release + 5 COOLDOWN, 21:xx–22:11Z — khép kín) + t4-round194 attempt1 ×3 (TICKET+ACQUIRED 02:54:12Z, RELEASED 03:00:46Z, hold 394 s — khép kín) + t01-round194 ×3 (TICKET+ACQUIRED 03:12:27Z, RELEASED 03:17:31Z, hold 305 s — O8 đợt 194, khép kín). 26+3+3 = 32 ✓.
- **Trong phiên T56-194 (từ lúc mở ~02:45Z): +6 dòng, +2 ACQ / +2 REL / +2 TICKET / +0 COOLDOWN** (t4 attempt1 + t01 O8 — đều khép kín).
- **Double-acquire GIỮ 7 — 0 ca mới**; STALE-LOCK GIỮ 12 — 0 ca mới; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE.** Caveat: **#68 GIẾT HOLDER t4**; **#95 CÓ GIẾT HOLDER** (t8-round179); **#96–#105 + #107–#119 KHÔNG giết** (verdict đợt 186–194; #106 không tính; #118/#119 chờ parent xác nhận số hiệu).

### §5.2. #118 — KHÔNG GIẾT HOLDER (chuỗi 21 → 22)

#118 (btime 22:21:55Z, `8a23277a`, T7/T9-193 xác minh /proc/stat + `uptime -s`): dòng lock cuối trước btime là t8-round193 RELEASED 22:11:07Z — **TRỐNG 648 s (10m48s)**; 0 dòng trong cửa sổ [22:21:55Z, 02:28:08Z); 0 STALE-LOCK mới. Khoảng trống gấp ~324 lần δ 2 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 22 reboot (#96–#105 + #107–#118; #106 không tính)** nếu parent tính tiếp. **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục từ 22:11:07Z tới 02:54:12Z nên MỌI boot trong cửa sổ đó đều không thể giết holder.

### §5.3. #119 ứng viên — KHÔNG GIẾT HOLDER (chuỗi → 23 nếu xác nhận)

#119 ứng viên (btime 02:28:08Z, `55c9e0b7`, T01-194 xác minh 9 nguồn): dòng lock cuối trước btime là t8-round193 RELEASED 22:11:07Z — **TRỐNG 15.421 s (4h17m01s)**; 0 dòng trong cửa sổ mở (t4 TICKET/ACQUIRED đầu tiên 02:54:12Z); 0 STALE-LOCK mới. Khoảng trống gấp ~7.710 lần δ 2 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 23 reboot** nếu parent xác nhận #119 = 55c9e0b7. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu #119 theo hệ quả (e)-193.

### §5.4. Quét zombie + X11 + ss (2 snapshot: giữa/cuối — T56 KHÔNG kịp snapshot lúc mở vì spawn watcher trước)

| Thời điểm | Zombie | Socket X11 | Xvfb | ss listener |
|---|---|---|---|---|
| Giữa (~02:55Z) | 0 | 1 (X193) | 1 | vite [::1]:5187 (T4 attempt1) + 3 localhost (33169/39767/44413 — của luồng khác) |
| Cuối (~03:19Z) | 0 | 5 (X193, X194, X195, X196, X98) | 1 | 0 (không còn :5187/:8765) |

- **0 zombie thật ở cả 2 lần** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56. T56 không khởi động Xvfb/vite nào, không kill process nào. **X11 giữa/cuối là của luồng khác** (T01 O8 / T8 chuẩn bị harness) — T56 chỉ ghi nhận. **Listener 0.0.0.0:8765 VẪN MẤT** (như đợt 193 — xem F-193-T56-7, không có diễn biến mới).

## §6. (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI (A) — 120/120 PASS (lần thứ 43) + suite 9/9 × 6 + KIỂM GATE TRƯỚC/SAU + MONITOR TRONG CHUNK (10 s)

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7. Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — KHÔNG TÁI TẠO ĐƯỢC cách tính từ T6-191 (xem F-193-T56-6; các mốc chính đều khớp nên không chặn verdict). File khối đã trích `t7-block-a194.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–193. Poll script `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` — tất cả không đổi.
- **PHẠM VI HẸP — đã tuân thủ:** T56 chỉ chạy prune (§7) + suite/harness trên /tmp. Suite chạy trên log riêng trong /tmp — 0 dòng nào của T56 trên log lock thật trong phiên (§5.1).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (03:02–03:05Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (~3 phút — chạy SAU khi T4 attempt1 nhả lock 03:00:46Z, TRƯỚC chunk 1; log lock thật 2804 dòng không đổi trước/sau suite).
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), chạy N=120 lần với churn bơm vào (1 process `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s — giống hệt T6-151–T6-193 §6.2). Chỉ chạy trên /tmp, không đụng lock thật, không đụng poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn (120 lần hoàn thành): min 512 ms, max 3433 ms, trung bình 1909,02 ms. (File delays đúng 120 dòng — không có lần chạy bị kill dở đợt này.)
- **KIỂM GATE — kiểm trước mỗi chunk + monitor TRONG chunk chu kỳ 10 s (sửa F-193-T56-3, lần đầu áp dụng 10 s):** monitor nền `t7-gate-monitor-194.sh` chạy song song mỗi chunk, kiểm mỗi 10 s: (1) poll-t4.log có "CUA YEN MO"/GATE_OPEN=1 không, (2) lock log có t4 acquire không — kill toàn bộ process group của chunk ngay khi phát hiện. Trước chunk 1 (03:05:44Z, poll #14, load5 5,43, cửa ĐÓNG) → sau chunk 1 (30/30). Trước chunk 2 (poll #16, load5 5,57, cửa ĐÓNG) → sau chunk 2 (30/30). Trước chunk 3 (poll #19, load5 3,92, cửa ĐÓNG) → sau chunk 3 (30/30). Trước chunk 4 (poll #21, load5 3,24, cửa ĐÓNG) → sau chunk 4 (30/30). **Tổng: 30 + 30 + 30 + 30 = 120 lần hoàn thành, 120/120 PASS. Monitor KHÔNG kill chunk nào (0 lần gate mở giữa chunk).**
- **T4 attempt1: gate mở poll #8 lúc 02:54:11Z → ACQUIRED 02:54:12Z → RELEASED 03:00:46Z, hold 394 s.** Suite + chunk 1 bắt đầu SAU khi attempt1 nhả (03:02Z / 03:05:44Z — cách 5 phút); attempt2 CHƯA MỞ lúc T56 đóng (poll #31 03:18:43Z, load5 4,10). **0 chồng lấn với pha (b) của T4.** Chuỗi 0 vi phạm (đã ĐỨT đợt 193 theo quyết (p)-193) — đợt này 0 vi phạm mới, parent quyết chuỗi tính lại từ 1 hay giữ 0 (xem §9(i)).
- **F-194-T56-4 — Chunk 4 CHỒNG ~48 s với t01-round194 (KHÔNG phải T4) — parent quyết có tính vi phạm không.** t01-round194 ACQUIRED 03:12:27Z (O8, hold 305 s → RELEASED 03:17:31Z); chunk 4 chạy 03:11:20–03:13:15Z → chồng 03:12:27–03:13:15Z ≈ 48 s. Trong cửa sổ này, các lần chạy ~110–120 đều PASS, mỗi lần có 1 process `WebProcess-churn` (sleep 1,5 s) còn sống. **Monitor KHÔNG phát hiện vì chỉ theo dõi t4/t8-round194 (thiết kế từ đợt 193) — t01 không nằm trong diện giám sát.** Bằng chứng ảnh hưởng: **0** — O8 của t01 là click-test Playwright theo screenshot (S0/S1/S2 PASS trong cửa sổ chồng, theo clicktest-report 03:12:28Z); **0 lần nhắc "WebProcess-churn" trong toàn bộ log/dir round194-t01**; churn chỉ là 1 process sleep, không chạm vite :5560 hay lock. **T56 KHÔNG tự phán vi phạm — giao parent quyết §9(i)** (như F-193-T56-3). **Sửa đợt sau:** monitor theo dõi MỌI ACQUIRED mới trên lock log (bất kỳ owner nào — T56 không bao giờ acquire lock thật nên ACQUIRED mới nào trong chunk cũng là tín hiệu dừng), không chỉ t4/t8.
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ đợt 150: 13/30 (43%); **(A) đợt 151–194: 120/120 mỗi đợt (100%)**. **Kết luận: (A) VẪN XANH sau 43 đợt** (tổng 5160/5160 dưới churn). 120/120 là tỉ lệ dưới churn bơm vào (stress) — điều đo được là SO SÁNH TƯƠNG ĐỐI: (A) 100% vs (B) 7% vs bản cũ 43%. **Chuỗi:** "xanh kép" 42 → **43**; suite xanh: 74 → **75**.

## §7. Prune cooldown lần 68 — XÓA 4 FILE theo điều (a) (PHẢI CHỜ LOCK 2 LẦN)

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100 file; (c) không xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào log; (e) chỉ chạy khi lock đang trống. Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h (8 ngày)** — bảo thủ hơn chữ luật tối đa 24h.

- Trước prune (~03:13Z): tổng **96 file / 1344 byte** (93 sau prune 67 + 3 file mới: cooldown-t4, cooldown-t01-round193, cooldown-t8-round193); ứng viên (`find -mtime +7`): **4 file**.
- **PHẢI CHỜ LOCK — 2 lần (tiền lệ đợt 186):** lần 1: T4 attempt1 giữ lock 02:54:12–03:00:46Z (T56 kiểm lúc ~02:55Z thấy t4 ACQUIRED → KHÔNG prune); lần 2: t01-round194 giữ lock 03:12:27–03:17:31Z (T56 kiểm lúc ~03:13Z thấy t01 ACQUIRED → KHÔNG prune). **Prune lúc 03:18:31Z, ngay sau khi kiểm lock trống** (dòng cuối RELEASED 03:17:31Z t01-round194; poll #30 lock=khong).
- ~03:18Z 26/11: điều (a) XÓA 4 file (đều ≥192h, đều qua mốc 168h ≥25,3h, không vi phạm (c)): **`cooldown-t8-round133`** (197,9h, mtime 2026-11-17T21:23:09Z — nợ T56-193: qua mốc 192h lúc 21:23:09Z 25/11), **`cooldown-t10-round133`** (197,2h), **`cooldown-t8-round134`** (193,4h), **`cooldown-t10-round134`** (193,3h — sát mốc nhất, vẫn qua 192h). `prune-deleted.txt` ghi đủ tên. File `cooldown-t8-round135` (191,4h) CHƯA tới mốc — KHÔNG xóa.
- **Kết quả prune lần 68: 4 file đã xóa.** Sau prune: **92 file / 1288 byte** (96 − 4 = 92 ✓; 1344 − 56 = 1288 ✓, 4 × 14 B). Điều (b) KHÔNG kích hoạt (92 < 100). Tầng tuổi: **≥192h: 4 → 0; ≥168h: 18 → 14; ≥72h: 60 → 56; ≥48h: 73 → 69**. **KHÔNG mất file nào không giải thích được.**
- **F-147-T6-1 — CHUỖI VẪN 0 (lần thứ mười lăm liên tiếp sau khi đứt tại 179):** cả 4 file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~25–30h. Không đổi luật (luật thuộc parent).

## §8. F-194-T56-n (sai số / ghi nhận riêng của T56-194)

- **F-194-T56-1 — Monitor đợt 193 grep lock SAI owner (nửa lock CHẾT đối với T4).** `t7-gate-monitor-193.sh` grep `'t4-round193|t8-round193'` trên lock log — owner thật là **`t4`** (333 dòng), **KHÔNG BAO GIỜ có `t4-round193`** (grep 0 kết quả). Nửa lock của monitor 193 chỉ bắt được t8, không bắt được T4 acquire; may mà nửa poll-t4.log vẫn hoạt động (kill chunk 3 đợt 193 nhờ poll log, không nhờ lock log). **Đã sửa ở monitor 194:** đếm bằng `awk '$2=="t4" || $2=="t8-round194"'` (baseline 334 lúc chunk 1 = toàn bộ dòng owner t4 tới lúc đó, gồm RELEASED 03:00:46Z; t8-round194 = 0 dòng; 0 lần tăng trong cả 4 chunk).
- **F-194-T56-2 — Lỗi kiểm GST của chính T56 (trailing slash) — xem §2.** Suýt ghi "thư mục thật" cho #119; kiểm lại không slash mới đúng (SYMLINK). Bài học: không bao giờ kiểm symlink bằng đường dẫn có trailing slash.
- **F-194-T56-3 — Watcher-193 chết THEO REBOOT, không phải chết bí ẩn giữa boot.** Poll cuối 22:22:23Z vẫn đọc boot 1c0bcaad, muộn hơn btime #118 (22:21:55Z) ~28 s — đã có giải thích đứng: **F-193-T9-2 (đồng hồ wall-clock nhảy ~18 s lúc reboot)**; mẫu sampler cuối boot cũ timestamp 22:22:13Z (btime+18s) là cùng hiện tượng. Watcher-193 chết CÙNG reboot 22:21:55Z (không có dòng END/STOP/NEWBOOT là đúng với chết theo reboot, như watcher-192). T56-194 rút lại nghi ngờ "chết không rõ nguyên nhân" trong header script watcher-194 (header đã viết trước khi đối chiếu F-193-T9-2; script đang chạy nên KHÔNG sửa file giữa chừng — ghi đính chính tại đây).
- **F-194-T56-4 — Chunk 4 chồng ~48 s với t01-round194 — xem §6 (đầy đủ).** Parent quyết ở §9(i).
- **F-194-T56-5 — Poller T4-194 ĐÃ dùng đường chính round194-t56/ (fix (p)-191 đứng đợt thứ hai).** Poll #4 (02:51:07Z) t5flag=PASS, gate0=T5 ngay khi cờ về. Các poll #1–#3 trước khi cờ về vẫn dùng cờ cũ round193-t56/ — đúng thiết kế. T56 KHÔNG phải tạo bản sao cờ.
- **F-194-T56-6 — Ledger xoay nội dung (xem §4).** Vẫn 2 dòng nhưng dòng repair #117 nay là dòng compacted đầu, dòng repair #119 mới thêm (ts 1795661454). Đếm dòng không đổi ≠ nội dung không đổi — các luồng đọc ledger PHẢI đối chiếu ts, không đếm dòng.
- **F-194-T56-7 — T4 attempt1 hold 394 s (dài nhất các attempt gần đây: đợt 193 là 136 s / ~217 s).** Chỉ ghi nhận — hold dài là quyền của T4 (20/20 đo WebKit); T56 không phán verdict lượt yên #62 (thuộc T4-194 + parent). Poll #9 (03:01:51Z) ghi tree MD5 đổi cf331628 → 78aba7bc sau attempt1 + legacy blockers=1 ở nhiều poll — T4/T10 lưu ý, không thuộc T56.
- **F-194-T56-8 — X11 tăng 1 → 5 socket giữa phiên (X194/X195/X196 mới).** Đều của luồng khác (T01 O8 DISPLAY :192–:196); T56 không khởi động Xvfb/vite nào. Listener 8765 vẫn mất từ đợt 193, không có diễn biến mới.

## §9. Đề xuất cho parent (quyết ở aggregate 194)

**(a) Chấp nhận verdict đợt 194 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #119 đã có (repair, poll=1, verify độc lập exit=0, GST symlink), replay #119 KHÔNG CHẠY (dạng B — early-repair đúng), cờ cũ VẪN CÓ, (A) 120/120 lần 43, holder #118 21 → 22 / #119 → 23, prune 68 xóa 4 file, hướng (3) lần 40, 0 chồng pha (b) với T4 — với caveat F-194-T56-4 (chồng ~48 s với t01, parent quyết ở (i)).

**(b) Cờ #119 ứng viên (repair-som-quyet-h, poll=1) — CÂU HỎI QUYẾT:** repair 1 lần theo (h) → poll1 exit=0, verify độc lập exit=0, 11/11 apt + 5/5 lib + GST 269=269 SYMLINK → debroot + dpkg 777 + cache 108 + lists 75. **Parent chọn 1 trong 2:** (b1) Chấp nhận **CÓ caveat** (repair-sớm, poll=1, GST symlink ephemeral — tiền lệ #111/#115; T56 đề xuất (b1) vì GST symlink là điểm yếu thật so với #117); (b2) Chấp nhận KHÔNG caveat (chỉ còn mode repair + poll=1 — T56 thấy (b2) YẾU HƠN đợt 193 vì #117 có GST thật).

**(c) #118 KHÔNG CÓ cờ — tổng boot không cờ 27 → 28?** #118 không watcher, không verify được post-hoc (khác #116: không có cả bằng chứng replay chạy). **Replay #119 KHÔNG CHẠY (dạng B)** — chuỗi cập nhật ở §4. **(d) Xác nhận 55c9e0b7 = #119?** (btime 02:28:08Z, epoch 1795660088, gap 14.773 s; T01-194 xác minh 9 nguồn.)

**(e) #118 KHÔNG GIẾT HOLDER — chuỗi 21 → 22; #119 KHÔNG GIẾT HOLDER — chuỗi → 23** (trống 648 s / 15.421 s). **(f) (A) 120/120 lần thứ 43 (tổng 5160/5160) + suite 9/9 × 6 (chuỗi suite xanh 75) — parent ghi nhận?**

**(g) Prune lần 68: điều (a) xóa 4 file, queue 96 → 92; F-147-T6-1 chuỗi VẪN 0 lần thứ 15. (h) Hướng (3) VẪN ĐỨNG lần thứ 40 — parent ghi nhận cả hai?**

**(i) F-194-T56-4 (chunk 4 chồng ~48 s với t01-round194 O8; 0 bằng chứng ảnh hưởng — O8 là click-test screenshot, 0 lần nhắc churn trong log t01; monitor chỉ theo dõi t4/t8) — parent quyết: có tính là VI PHẠM (chuỗi 0 vi phạm tính lại từ 1 hay giữ 0) hay chỉ là caveat (ghi nhận + sửa monitor đợt sau)? Tiền lệ: F-193-T56-3 (chồng pha (b) ~10–12 s với T4) = LIGHT VIOLATION theo quyết (p)-193; F-192-T56-3 (59 s pha (a), 0 pha (b)) = KHÔNG vi phạm. Khác biệt đợt này: đối tác chồng là t01 (O8), KHÔNG phải T4 (lượt yên) — mức độ nghiêm trọng thấp hơn vì O8 không đo cây process.**

**(j) Watcher-194 vẫn chạy trên #119** (pid 5557, hạn 08:35:51Z = hạn cứng đợt 195) — **T56-195 PHẢI kiểm tra ps trước khi spawn watcher-195** (xem §1.2); nếu watcher-194 còn sống thì KHÔNG spawn mới.

## §10. Sai số của chính T56-194 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-194-T56-1..8** | Xem §8 (đầy đủ, không lặp lại ở đây) | Ghi nhận | — |
| §2 | Kiểm GST lần đầu CÓ trailing slash → suýt ghi sai "thư mục thật" | Lỗi kiểm — đã sửa ngay trong phiên | Kiểm lại không slash: SYMLINK; bài học ghi ở §2/F-194-T56-2 |
| §1 | Header script watcher-194 ghi watcher-193 "chết không rõ nguyên nhân" — SAI (đã có giải thích F-193-T9-2) | Ghi nhận — không sửa file script đang chạy | Đính chính tại F-194-T56-3 |
| §6 | Monitor chỉ theo dõi t4/t8 → chunk 4 chồng ~48 s với t01 mà không bị kill | Caveat — parent quyết ở §9(i) | Sửa đợt sau: monitor theo dõi MỌI ACQUIRED mới trên lock log |
| §5 | T56 không kịp snapshot zombie/X11 lúc mở (ưu tiên spawn watcher trước) | Hạn chế nhỏ | Chỉ có 2 snapshot (giữa/cuối); 0 zombie cả 2 lần |
| — | md5 cờ cũ #112/#111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95 không kiểm lại đợt này | Hạn chế nhỏ | Giữ số đợt 193; các cờ #119/#117/#115/#114 đã kiểm lại, đều khớp |
| — | (m) #117/#118 thuộc T2-194; RAM/ENOSPC #119 thuộc T9-194; inotify không đo lại (giữ số T6-187: 63.747) | Hạn chế nhỏ | Thuộc T9-194 / T2-194 |

**Số liệu chính thức lấy từ log watcher-194 + log trực tiếp (verify form-B/poll1/independent) + dpkg/history/term.log của #119 + ledger /var/lib/hatch/os-intent/ledger.jsonl + log lock thật + queue trên đĩa + poll log T4-194 + log/dir round194-t01 (đối chiếu chồng t01) + đối chiếu aggregate 193 (§14.2, NGUỒN GỐC CHƯA NGÃ NGŨ) + LIMITS T56-193.**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND194_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round194-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round194-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push: đợt 191 + đợt 192 + đợt 193 = 36/125/91/77 (theo MEMORY; T10-194 đếm lại bằng dedup toàn cục).

## Phụ lục A — Trích số liệu T56-194 (bản chính, 02:45Z – 03:20Z 26/11)

```
boot #118=8a23277a-8f66-483b-b76b-be2cf157c2b1 btime=1795645315=22:21:55Z 25/11 (T7/T9-193 xac minh); gap #117->#118 = 7158 s; song toi 02:28:08Z (4h06m13s)
boot #119=55c9e0b7-2d97-4260-a6ca-45538e24b6c1 btime=1795660088=02:28:08Z (uptime -s KHOP; journal idx 0 first 02:28:27Z = btime +19 s; T01-194 xac minh 9 nguon); gap #118->#119 = 14773 s
watcher-193: START 20:45:41Z pid=6482; poll cuoi 22:22:23Z dpkg 768 md5=fe2420b3; CHET THEO REBOOT 22:21:55Z, 0 END/STOP/NEWBOOT (F-193-T9-2: dong ho nhay ~18 s)
watcher-194: START 02:48:57Z pid=5557 boot=55c9e0b7 end=08:35:51Z (han cung dot 195); init dpkg 2 md5=98c68c14 mtime=02:35:46Z cache=0 lists=5 gst_sys=0; EARLY-REPAIR TRIGGER 02:48:57Z (boot_age 1249 s, frozen 791 s); verify form-B exit=1 (02:48:57Z); --repair exit=0; poll1 exit=0 (02:50:55Z); FLAG-WRITTEN 02:50:55Z poll=1 (old=1c0bcaad)
POSTBOOT_PASS #119: CO md5=863a6035; backup #117 md5=46e0b657 = goc; dpkg 777 md5=fddba8f4; cache=108; lists=75; GST 269 SYMLINK -> debroot; history 1 tx; verify doc lap exit=0 (~02:52Z)
POSTBOOT_PASS #118: KHONG CO (0 file nhac 8a23277a; tong boot khong co 27 -> 28)
Co cu KHONG DOI: #117 46e0b657 / #115 734f8e2d / #114 288f863b
Lock (mo/kiem cuoi): raw 2801/2807; cleaned 2795/2801; ACQUIRED 800/802; RELEASED 788/790; cap 788/790; chenh 12/12; TICKET 811/813; COOLDOWN 373; STALE-LOCK 12; STALE-TICKET 1; TIMEOUT 10; double-acquire 7; held 0
(A): suite a89c0676; block dc973443 (giong het 151-193); poll 1710e480; lock v2 520b8baa; lock v1 fd21193c; suite 6x 9/9 rc=0 (03:02-03:05Z); harness 120/120 B1=1 B2=0; delay 512/3433/1909.02 ms
Gate: poll #14/#16/#19/#21 DONG truoc chunk 1-4; T4 attempt1 ACQUIRED 02:54:12Z RELEASED 03:00:46Z hold 394 s; monitor 10 s, 0 kill; 0 chong pha (b) T4; chunk 4 chong t01 ~48 s (03:12:27-03:13:15Z, F-194-T56-4)
Prune 68: truoc 96 file / 1344 B; xoa 4 file (dieu (a)): cooldown-t8-round133 (197.9h), cooldown-t10-round133 (197.2h), cooldown-t8-round134 (193.4h), cooldown-t10-round134 (193.3h); sau 92 file / 1288 B; tang tuoi: >=192h 4->0; >=168h 18->14; >=72h 60->56; >=48h 73->69
Holder: #118 KHONG GIET (trong 648 s, ~324x delta); chuoi 21 -> 22; #119 KHONG GIET (trong 15421 s, ~7710x delta); chuoi -> 23 (neu xac nhan)
```
