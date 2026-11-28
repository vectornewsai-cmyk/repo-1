# PHASE 9 — ROUND 192 — T56 (GỘP T5+T6) INFRA + LOCK LIMITS

**Đợt:** 192 (mở lượt cron 21:35:51 +07 25/11/2026 = 14:35:51Z; hạn cờ ~17:00Z, hạn cứng ~17:35Z). **Người viết:** T56-192 (gộp T5 infra/watcher + T6 lock health). **Chạy:** ~14:40Z → 15:04Z 25/11/2026. **Boot làm việc:** #115 ứng viên (ebc5a3b9, btime 14:23:56Z — T01-192 xác minh; parent quyết (e)).
**Trạng thái:** ĐÃ XONG watcher-192 + cờ #115 (**repair-som-quyet-h, poll=1 — CÓ caveat, parent quyết; replay KHÔNG CHẠY, dạng B**) + (A) **120/120 lần thứ 41** + suite 9/9 × 6 + prune lần 66 + #115 **KHÔNG GIẾT HOLDER** (chuỗi 18 → 19) + hướng (3) **lần thứ 38** + **F-192-T56-1..5**. 1 entry stage duy nhất.

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #115 ứng viên (ebc5a3b9) | **ĐÃ CÓ 14:55:05Z (boot+31m09s, repair-som-quyet-h, poll=1)** — verify form-B exit=1 → --repair 1 lần (~10m14s: update ~9m + install ~1m) → poll1 exit=0 → FLAG-WRITTEN; verify độc lập exit=0; 11/11 apt + 5/5 lib; GST 269=269 **SYMLINK → debroot (ephemeral — caveat)**; dpkg **768**; history 1 transaction; term.log 0 lỗi |
| Replay #115 | **KHÔNG CHẠY (dạng B, như #60/#69/#142)** — dpkg 2 dòng, đóng băng 14:24:38Z→14:44:47Z; /var/log/apt KHÔNG TỒN TẠI lúc mở; lists 5; cache 0; GST 0 file; 0 proc apt/dpkg/wrapper |
| POSTBOOT_PASS #114 (b0aab705) | **VẪN CÓ**, md5 KHÔNG ĐỔI (288f863b); backup byte-identical ở round192-t56/POSTBOOT_PASS-b0aab705 |
| Cờ #113 (f7632121) | **KHÔNG CÓ** (không đổi — đợt 190 VOID; tổng boot không cờ GIỮ 26) |
| Cờ cũ #112/#111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95 | **VẪN CÓ** (md5 KHÔNG ĐỔI — §3) |
| Watcher-191 | **KẾT THÚC ĐÚNG HẠN 11:35:28Z** (REPLAY-WATCH-191-END, poll cuối 11:34:58Z) — KHÔNG phải chết trước reboot; pid 9180 đã chết theo hạn |
| Watcher-192 | START 14:44:45Z, pid **8168**, hạn 17:35:00Z — **ALIVE lúc đóng** (poll 15:03:40Z) |
| Khoảng không-watcher | **~3h09m17s** (11:35:28Z → 14:44:45Z) — bao **1 boot (#115)** |
| Hướng (3) | **VẪN ĐỨNG lần thứ 38** |
| Marker sống | CÒN, mtime 2026-11-20 11:39:47Z không đổi, md5 cb7102c0 — sống qua **#49–#115 = 67 reboot** (nếu #115 xác nhận) |
| (A) lock | **120/120 PASS lần thứ 41** (tổng **4920/4920**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 72 → **73** |
| Lock | KHỎE (767 cặp lúc kiểm cuối, 0 đang giữ, chênh **GIỮ 12**, STALE-LOCK GIỮ 12, double-acquire GIỮ 7, 0 TIMEOUT mới, 0 "KHÔNG NHẢ"); **#115 KHÔNG GIẾT HOLDER — chuỗi 18 → 19** |
| Prune lần 66 | **XÓA 5 FILE theo điều (a)** (queue 99 → 94; F-147-T6-1 chuỗi **VẪN 0 lần thứ 13**) |
| X11 / zombie | **0 zombie; 0 socket X11; 0 Xvfb; 0 ss listener** (chỉ snapshot cuối — xem §8) |
| Đồng hồ | Cloudflare **+1 s** (T01-192 +1 s, khớp) — δ=1 s; khoảng trống lock gấp ~8.556× δ → KHÔNG caveat |
| Quy tắc B4 | **T56-192 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 configure/install/update/repair tay); verify độc lập chỉ đọc |

**Số hiệu boot #115 CHƯA QUYẾT — T01-192 xác minh (parent quyết (e) ở §14.1-192).** (e)-191 đã xác nhận b0aab705 = #114; F-191-T7-2 (boot_gen gợi ý 1 boot chưa xác minh) KHÔNG đổi số hiệu — T0-192 kiểm lại. **T56 KHÔNG phán (m), chỉ trình số thô — (m) #115 thuộc T2-192 + parent.**

## §0. Trạng thái lúc mở (~14:40Z)

- **Boot lúc mở: `ebc5a3b9-230f-4ea5-926f-c3a62c96fbf5`, btime 14:23:56Z** (epoch 1795616636; `uptime -s` khớp; journal first 14:24:14Z = btime +18 s; /proc/1 14:24:13.883Z; `last` reboot 14:24 still running; `who -b` Nov 25 14:24; T01-192 survey 14:40:57Z khớp). **Số hiệu #115 ứng viên theo T01-192.** Gap #114→#115 = **21.493 s (5h58m13s)**. **KHÔNG có reboot trong phiên T56.**
- **Replay #115 CHƯA TỚI lúc mở (dạng B):** dpkg.log 2 dòng, md5 0daee7f1, mtime 14:24:38Z; /var/log/apt KHÔNG TỒN TẠI; lists 5; cache 0 .deb; GST hệ thống KHÔNG TỒN TẠI (0 file); libevent-2.1.so.7 MISSING (T01-192; libevent_core-2.1.so.7 có nhưng tên .so.7 mà postboot kiểm thì không); 0 proc apt/dpkg/wrapper. Debroot GST 269 file CÒN (repair có thể symlink).
- **Lock lúc mở: TRỐNG** (dòng cuối RELEASED 09:48:44Z t8-round191); queue 99 file / 1386 byte. **T01-192 đang chạy** (survey 14:40:57Z); **T4-192 poller START 14:44:49Z** (poll #1 14:44:49Z); **T8-192 waiter ĐANG CHẠY** (wait-t4-t5-192t8.sh, pid 9260). Không có dpkg/apt nào CỦA T56.
- **Latch:** `round-in-progress.md` — T56 không kiểm latch đợt này (không thuộc nhiệm vụ T56; cron worker kiểm ở bước 0).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 25/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 08:25:43Z | Reboot #114 (b0aab705); cờ #114 đã có 08:45:57Z (T56-191, replay, poll=0, KHÔNG caveat — parent quyết §14.2-191 (c)) |
| 11:34:58Z | **Poll cuối watcher-191** (dpkg 1468 ổn định, md5 9387d070, boot #114) |
| 11:35:28Z | **REPLAY-WATCH-191-END hạn cứng 11:35:00Z** (watcher-191 kết thúc ĐÚNG HẠN, không phải chết trước reboot — F-192-T56-5) |
| 14:23:56Z | **Reboot ebc5a3b9 (#115 ứng viên)**; gap #114→#115 = 21.493 s (5h58m13s) |
| 14:24:38Z | dpkg.log 2 dòng "startup packages configure" (boot+42s) — rồi IM HOÀN TOÀN |
| 14:40:57Z | T01-192 boot survey (btime 1795616636 khớp; CF +1 s; libevent MISSING; marker không đổi) |
| 14:44:45Z | **Watcher-192 START, pid 8168** (khoảng không-watcher ~3h09m17s); poll đầu: dpkg 2 dòng, đóng băng 1207 s → **EARLY-REPAIR TRIGGER** (boot+20m49s) → verify form-B exit=1 → **--repair** |
| 14:44:47Z | --repair bắt đầu (apt-get update pid 8439, ~9 phút; rồi apt-get install pid 84507, 11 gói) |
| 14:55:01Z | history.log End-Date (install xong); dpkg.log 2 → **768 dòng**; GST 269; cache 107; lists 75 |
| 14:55:04Z | postboot poll1 sau repair **exit=0** → **FLAG-WRITTEN 14:55:05Z** (boot+31m09s, repair-som-quyet-h, poll=1) |
| 14:57:20Z | t01-round192 ACQUIRED (O8 đợt 192, hold 229 s → RELEASED 15:01:09Z) |
| 14:58:39Z | T56 verify độc lập: postboot **exit=0** (11/11 apt + 5/5 lib + GST 269=269 symlink + tools) |
| ~15:04Z | T56 viết LIMITS này. Watcher-192 vẫn ALIVE (pid 8168, poll 15:03:40Z). T4-192 vẫn polling (poll #25, 15:03:15Z) — CHƯA attempt. |

### §1.2. Cờ #115 ứng viên — ĐÃ CÓ (repair-som-quyet-h, poll=1) — CÓ caveat (đề xuất, parent quyết)

- **Cờ:** `hidden_files/round192-t56/POSTBOOT_PASS`, 324 B, mtime 2026-11-25T14:55:05Z, md5 **734f8e2d** (FULL boot_id, btime 14:23:56Z, repair-som-quyet-h, poll=1). Backup cờ cũ: `POSTBOOT_PASS-b0aab705`, 315 B — **md5 288f863b, byte-identical với cờ #114 gốc**.
- **Lịch trình:** replay KHÔNG chạy (dạng B) → watcher spawn 14:44:45Z (boot+20m49s) thấy dpkg 2 dòng đóng băng 1207 s (≥600 s), 0 apt/dpkg → **EARLY-REPAIR TRIGGER ngay poll đầu** theo chiến lược (h) quyết parent đợt 150 + (c) đợt 184 → verify form-B exit=1 (14:44:47Z, thiếu 5 lib + GST + 11 gói apt, đúng như dự kiến) → --repair 1 lần duy nhất (apt-get update ~9 phút, mirror chậm; install 11 gói) → poll1 exit=0 → **FLAG-WRITTEN 14:55:05Z**. KHÔNG trigger BACKSTOP (early đã chạy). **1 repair / 1 boot** (guard `repaired-ebc5a3b9`).
- **Verify độc lập (T56, check-only, 14:58:39Z):** postboot **exit=0** — wrapper PASS (đã vá K1); **5/5 lib PASS**; GST **269=269 (SYMLINK → debroot, ephemeral)**; **11/11 gói apt PASS**; KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. **Caveat (đề xuất — tiền lệ #111 repair-sớm, poll=1):** cờ này là **repair-som-quyet-h, KHÔNG phải replay-đầy-đủ**; GST là symlink tạm (mất sau reboot), không phải thư mục thật như #109/#110/#112/#114. **Parent quyết có chấp nhận KHÔNG caveat hay CÓ caveat.** Nội dung PASS là thật (verify độc lập exit=0), chỉ mode khác profile #114.
- **T4-192 đã thấy postboot PASS:** poll #17 (14:57:06Z) postboot_exit=0 → gate0=T4-check-only (dự phòng — xem F-192-T56-1); T4 vẫn polling lúc đóng, CHƯA attempt.

### §1.3. Cờ #114 VẪN CÓ; cờ #113 KHÔNG CÓ (không đổi)

- **#114 (b0aab705):** round191-t56/POSTBOOT_PASS, md5 **288f863b** — KHÔNG ĐỔI; backup ở round192-t56/ byte-identical. **#113 (f7632121): KHÔNG CÓ** (đợt 190 VOID — không bù được) — tổng boot không cờ **GIỮ 26**.

## §2. Hướng (3) VẪN ĐỨNG lần thứ 38 + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở (~14:43Z): `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không thư mục linger (`/var/lib/systemd/linger/` không tồn tại); không `/run/user/0`; `systemctl list-timers` 0 timer VCut; `systemctl list-units` 0 unit VCut. **Lần thứ 38 liên tiếp** (33/34/35/36/37 ở đợt 186/187/188/189/191; đợt 190 VOID không kiểm). Watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–192.

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z, 239 B, md5 cb7102c0). Sống qua **#49–#115 = 67 reboot theo cách đếm T0** (nếu #115 xác nhận). **Đồng hồ:** T56 đo 14:43:17Z: local mid 1795617797 vs CF Date 14:43:18 GMT → **CF +1 s** (T01-192 đo +1 s lúc 14:40:59Z — khớp). **Btime ghi bằng epoch nguyên.** δ=1 s dùng cho verdict holder (§5).

## §3. Cờ cũ — VẪN CÓ, md5 KHÔNG ĐỔI (kiểm lại đợt 192)

- **#115 ứng viên (ebc5a3b9):** round192-t56/POSTBOOT_PASS, 14:55:05Z — md5 **734f8e2d (MỚI)**, repair-som-quyet-h, poll=1, CÓ caveat (đề xuất).
- **#114 (b0aab705):** 288f863b — KHÔNG ĐỔI. **#112 (27e6714f):** ca79a6b2 — KHÔNG ĐỔI. **#111 (257c1eae):** abe240cb — KHÔNG ĐỔI (repair, poll=1, CÓ caveat). **#110 (912f4a97):** 302ae331 — KHÔNG ĐỔI. **#109 (6f1d9f87):** a6fc7d69 — KHÔNG ĐỔI. **#107 (cea79500):** b7259902 — KHÔNG ĐỔI. **#104 (9161bfd1):** 8e6d6e5d — KHÔNG ĐỔI. **#102 (6ecd948e):** 6007fea8 — KHÔNG ĐỔI. **#101 (51745634):** 8c32fc3c — KHÔNG ĐỔI. **#99 (9897d4b4):** 3d031656 — KHÔNG ĐỔI. **#98 (e62eef3f):** 26452ec1 — KHÔNG ĐỔI. **#96 (8d2a69df):** 50869e4e — KHÔNG ĐỔI. **#95 (95b483a2):** f8cd6d46 — KHÔNG ĐỔI.
- Kiểm bằng 1 lần md5sum toàn bộ 125 file POSTBOOT_PASS* (mỗi md5 trên xuất hiện 1–2 lần: bản gốc + bản backup) — **0 cờ mất, 0 md5 đổi**.
- **#113 (f7632121) / #108 / #105 / #103 / #100 / #97: KHÔNG CÓ cờ** (tổng boot không cờ GIỮ **26**).

## §4. Replay #115 KHÔNG CHẠY (dạng B) + ledger 1→2

- **Replay #115 KHÔNG CHẠY:** dpkg.log chỉ 2 dòng "startup packages configure" 14:24:38Z (boot+42s), md5 0daee7f1, đóng băng tới lúc repair bắt đầu 14:44:47Z (1.209 s); 0 proc apt/dpkg/wrapper lúc mở (14:43Z, kiểm 2 lần) + T01-192 survey 14:40:57Z cũng thấy dpkg 2 dòng; /var/log/apt KHÔNG TỒN TẠI lúc mở; lists 5; cache 0; GST 0 file. Bracket: configure boot+42s, **0 hoạt động replay nào quan sát được tới boot+31m** (cờ do repair, không phải replay). Dạng (B) "chậm mà không cài" như #60/#69/#142. Chuỗi đình trệ/không-chạy: #102 không, #103 có, #104 không, #105 KHÔNG XĐ, #108 KHÔNG XĐ, #109 không, #110 không, #111 CÓ, #112 không, #113 KHÔNG XĐ, #114 không, **#115 KHÔNG CHẠY (dạng B)**. Nguyên nhân đình trệ #100/#101/#103/#111 **VẪN CHƯA TÌM RA trong cell** → **vẫn nợ host-side** theo quyết (k) đợt 174.
- **Ledger — repair THÊM 1 dòng (F-192-T56-4):** `/var/lib/hatch/os-intent/ledger.jsonl` lúc kiểm cuối (15:03Z): **2 dòng** — [0] ts **1795565495** (= 00:11:35Z, repair #111, compacted=true — như T56-191 ghi); [1] ts **1795618502** (= 14:55:02Z, **repair #115**, event dpkg-post-invoke, added ~110 gói — trùng history End-Date 14:55:01Z). **KHÔNG có dòng nào cho replay #115** (replay không chạy). T2/T10 lưu ý: ts 1795618502 là của repair #115, KHÔNG phải btime #115 (1795616636).
- **Số liệu repair:** history.log 1 transaction (Start+End, End-Date 14:55:01Z); term.log 0 lỗi; dpkg.log 768 dòng, md5 7ec12b3f, ổn định từ 14:55:35Z (5 poll liên tiếp); cache 107 .deb; lists 75; apt log repair đã copy ra khỏi /tmp NGAY (t5-postboot-repair-apt-ebc5a3b9.log, 51.941 B, 696 dòng — F-173-T5-9). 768 dòng ≈ mẫu repair-1-phần (795 ở #95/#140-boot-2/#142/#149-boot-2/#150 — lần này ít hơn ~27 dòng, cùng 11 gói chính + ~110 gói).

## §5. Lock health (T6) — #115 KHÔNG GIẾT HOLDER, chuỗi 18 → 19

### §5.1. Nhất quán log lock: 767 cặp lúc kiểm cuối, 0 đang giữ, chênh GIỮ 12

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 191). Số chính thức đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T56-191 kiểm cuối | T56-192 kiểm cuối | Δ trong phiên |
|---|---|---|---|
| Tổng dòng | 2693 | **2722** | +29 |
| TICKET / ACQUIRED / RELEASED | 782 / 771 / 759 | **790 / 779 / 767** | +8 / +8 / +8 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 358 / 12 / 1 / 10 | **363 / 12 / 1 / 10** | +5 / +0 |
| Cặp ACQUIRED→RELEASED | 759 | **767** | +8 |
| Đang giữ cuối log / Chênh ACQ−REL | 0 / 12 | **0 / 12** | — |
| Double-acquire (nghiêm ngặt) | 7 | **7** | 0 mới |

- **KIỂM CUỐI ĐỢT NÀY: ACQUIRED 779 / RELEASED 767, 767 cặp (raw 2728 dòng).**
- **+29 dòng kể từ T56-191 kiểm cuối:** t8-round191 ×26 (7 chu kỳ harness/O8 09:27–09:48Z, hold 80/151/241/71/142/234/160 s + 5 COOLDOWN wait ~15 s — TẤT CẢ sau mốc final 09:09Z của T56-191, đều khép kín) + t01-round192 ×3 (TICKET+ACQUIRED 14:57:20Z, RELEASED 15:01:09Z, hold 229 s — O8 đợt 192, khép kín).
- **Double-acquire GIỮ 7 — 0 ca mới**; STALE-LOCK GIỮ 12 — 0 ca mới; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE.** Caveat: **#68 GIẾT HOLDER t4**; **#69–#94 KHÔNG giết** (26 reboot); **#95 CÓ GIẾT HOLDER** (t8-round179); **#96–#105 + #107–#115 KHÔNG giết** (verdict đợt 186–192; #106 không tính).

### §5.2. #115 — KHÔNG GIẾT HOLDER (chuỗi 18 → 19)

| Reboot | btime | Dòng lock cuối trước btime | Trạng thái lock tại btime | Dòng trong cửa sổ mở | STALE-LOCK mới |
|---|---|---|---|---|---|
| #115 ứng viên | 14:23:56Z, `ebc5a3b9` (T01-192 xác minh /proc/stat + `uptime -s`) | t8-round191 RELEASED 09:48:44Z — TRỐNG 17.112 s (4h45m12s) trước btime | TRỐNG | 0 (t01 ACQUIRED đầu tiên 14:57:20Z) | 0 |

Khoảng trống gấp ~8.556 lần δ 1 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 19 reboot (#96–#105 + #107–#115; #106 không tính)** nếu parent tính tiếp. **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục từ 09:48:44Z tới 14:57:20Z nên MỌI boot trong cửa sổ đó đều không thể giết holder. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu #115 theo T01-192.

### §5.3. Quét zombie + X11 + ss (chỉ snapshot cuối)

- **0 zombie thật lúc kiểm cuối** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56. T56 không khởi động Xvfb/vite nào, không kill process nào.
- **X11:** 0 socket lúc kiểm cuối (lúc mở T56 không snapshot riêng — chỉ ghi nhận cuối; xem F-192-T56-5). **`ss -tln`:** 0 listener lúc kiểm cuối.

## §6. (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI (A) — 120/120 PASS (lần thứ 41) + suite 9/9 × 6 + KIỂM GATE TRƯỚC/TRONG HARNESS

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7. Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — khớp T6-151–T6-191. File khối đã trích `t7-block-a192.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–191.
- **PHẠM VI HẸP — đã tuân thủ:** poll `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` — tất cả không đổi. T56 chỉ chạy prune (§7 — xóa 5 file theo điều (a)).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (14:46:30–14:50:18Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (~3m48s — chậm hơn 2m09s đợt 191 do tải máy cao lúc apt-get update + các luồng 192 spawn). Suite chạy trên log riêng trong /tmp — 0 dòng nào của T56 trên log lock thật trong phiên (§5.1).
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), chạy N=120 lần với churn bơm vào (1 process `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s — giống hệt T6-151–T6-191 §6.2). Chỉ chạy trên /tmp, không đụng lock thật, không đụng poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn: min 567 ms, max 3478 ms, trung bình 1977,19 ms. Thời gian chạy ~7m22s (14:50:43Z–14:58:05Z), chia **4 chunk × 30 lần, kiểm gate TRƯỚC và SAU mỗi chunk** (quyết (p)-191 — xem F-192-T56-3). **0 kẹt mới.**
- **KIỂM GATE (8 lần, giờ Z):** trước chunk 1 (14:50:43Z, poll #8, load5 5,68, gate0 khong-dat) → sau chunk 1 (14:52:29Z, poll #10, load5 5,32, khong-dat) → trước chunk 2 (14:52:34Z, poll #11, load5 5,26, khong-dat) → sau chunk 2 (14:54:22Z, poll #13, load5 4,18, khong-dat) → trước chunk 3 (14:54:26Z, poll #13, load5 4,15, khong-dat) → sau chunk 3 (14:56:14Z, poll #15, load5 3,69, khong-dat) → trước chunk 4 (14:56:23Z, poll #16, load5 3,72, khong-dat) → sau chunk 4 (14:58:05Z, poll #18, load5 5,02, gate0 T4-check-only). **Gate ĐỎ ở cả 7 lần kiểm đầu; chỉ lật xanh GIỮA chunk 4** (poll #17, 14:57:06Z — xem F-192-T56-3). **0 lần "CUA YEN MO"; 0 dòng t4-round192 trong log lock; T4 vẫn polling lúc đóng (poll #25, 15:03:15Z) — 0 chồng pha (b).**
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ đợt 150: 13/30 (43%); **(A) đợt 151–192: 120/120 mỗi đợt (100%)**.
- **Kết luận: (A) VẪN XANH sau bốn mươi mốt đợt** (tổng 4920/4920 dưới churn qua 41 đợt). 120/120 là tỉ lệ dưới churn bơm vào (stress), không phải tỉ lệ flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI: (A) 100% vs (B) 7% vs bản cũ 43%. **Chuỗi:** "xanh kép" 40 → **41**; suite xanh: 72 → **73**.

## §7. Prune cooldown lần 66 — XÓA 5 FILE theo điều (a)

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100 file — vượt 100 thì xóa file cũ nhất tới khi còn 100, không xóa file <48h; (c) không xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock đang trống. Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h (8 ngày)** — bảo thủ hơn chữ luật tối đa 24h.

- Trước prune (~14:45Z): tổng **99 file / 1386 byte** (98 sau prune 65 + `cooldown-t8-round191` mới, mtime 09:48:44Z); ứng viên mtime >7 ngày (`find -mtime +7`): **5 file** — điều (a) kích hoạt đợt thứ hai liên tiếp.
- **KHÔNG PHẢI CHỜ LOCK:** lock TRỐNG liên tục từ lúc mở tới lúc prune (dòng cuối log RELEASED 09:48:44Z t8-round191); T56 kiểm lock ngay trước prune rồi prune ngay ~14:45Z. t01-round192 ACQUIRED sau đó (14:57:20Z) — sau prune ~12'.
- ~14:45Z 25/11: điều (a) XÓA 5 file (đều ≥192h, đều qua mốc 168h, không vi phạm (c)): **`cooldown-t3`** (197,1h, mtime 2026-11-17T09:40:41Z), **`cooldown-t8-round129`** (197,0h), **`cooldown-t10-round129`** (196,8h), **`cooldown-t8-round130`** (193,0h), **`cooldown-t10-round130`** (192,7h). `prune-deleted.txt` ghi đủ tên (đầu ra `find -delete`).
- **Kết quả prune lần 66: 5 file đã xóa.** Sau prune: **94 file / 1316 byte** (99 − 5 = 94 ✓; 1386 − 70 = 1316 ✓, 5 × 14 B). Điều (b) KHÔNG kích hoạt (94 < 100 sau khi (a) xong). Lúc kiểm cuối vẫn **94 file / 1316 byte** (0 file mới sau prune). Tầng tuổi: **≥192h: 5 → 0; ≥168h: 19 → 14; ≥72h: 60 → 55; ≥48h: 75 → 70**. Đối chiếu: 98 (T56-191 kiểm cuối) + t8-round191 = 99 lúc mở; `cooldown-t4` chỉ viết lại cùng tên. **KHÔNG mất file nào không giải thích được.** (48 file `cooldown-*` khác nằm ngoài `vite.lock.queue/` là báo cáo cũ trong các thư mục round — KHÔNG phải file queue, không đếm vào prune.)
- **F-147-T6-1 — CHUỖI VẪN 0 (lần thứ mười ba liên tiếp sau khi đứt tại 179):** cả 5 file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~25–29h. Không đổi luật (luật thuộc parent).

## §8. F-192-T56-n (sai số / ghi nhận riêng của T56-192)

- **F-192-T56-1 — Poller T4-192 VẪN dùng đường chính cũ (fix (p)-191 CHƯA áp dụng ở phía T4).** Poller T4-192 (`round192-t4/poll-wait-t4-192.sh` dòng 54–55): đường chính `round192-t5/POSTBOOT_PASS` — **KHÔNG TỒN TẠI** (luồng gộp T56 dùng dir `round192-t56/`); dự phòng `round189-t5/POSTBOOT_PASS` (cờ #112 cũ → `t5flag=cu(mtime-cu)`). Gate0 vẫn xanh qua **T4-check-only dự phòng** theo quyết parent (j) đợt 143 (postboot_exit=0 từ poll #17, pb_age ≤3). Cờ #115 chính thức ở `round192-t56/POSTBOOT_PASS` (md5 734f8e2d). **T56 KHÔNG tạo bản sao cờ ở round192-t5/** (tránh 2 cờ #115 gây nhầm cho T10 — tiền lệ T56-191) và KHÔNG sửa script poller đang chạy của luồng khác (biến T5FLAG đã load lúc start; sửa file cũng không đổi tiến trình đang chạy). Brief T4 các đợt sau PHẢI cập nhật đường chính (ưu tiên `round192-t56/`, rồi `round193-t56/`, …) — đây là lần thứ hai liên tiếp fix này chưa áp dụng.
- **F-192-T56-2 — T01-192 ghi libevent MISSING trong khi libevent_core có.** `ldconfig -p` có `libevent_core-2.1.so.7` nhưng KHÔNG có `libevent-2.1.so.7` (tên mà postboot kiểm) — T01 ghi đúng theo check postboot; sau repair cả 5 lib PASS (verify độc lập 14:58:39Z). Không phải lỗi T01.
- **F-192-T56-3 — Chunk 4 harness chồng cửa yên MỞ pha (a) ~59 s (CAVEAT, KHÔNG phải vi phạm pha (b)).** Gate lật xanh ở poll #17 T4 (14:57:06Z, gate0=T4-check-only, postboot_exit=0 lần đầu) — GIỮA chunk 4 (14:56:23–14:58:05Z); chunk 4 chạy tiếp tới 14:58:05Z, chồng polls #17–#18 của T4 (~59 s, pha (a) — cửa yên mở nhưng T4 CHƯA acquire). **0 chồng pha (b):** 0 lần "CUA YEN MO", 0 dòng t4-round192 trong log lock, T4 vẫn polling lúc đóng (poll #25) — lỗi F-191-T10-2 (chồng pha (b) 2m35s) KHÔNG lặp lại. Nguyên nhân: T56 chỉ kiểm gate TRƯỚC/SAU mỗi chunk (~1m45s/chunk), còn T4 poll mỗi 45 s — gate có thể lật giữa chunk; và T56 không kiểm sự tồn tại của cờ trước chunk 4 (cờ đã ghi 14:55:05Z, install xong — dấu hiệu gate sắp xanh). Churn của T56 KHÔNG lọt vào blockers của T4 (0 dòng "WebProcess-churn" trong blockers-list-17/18 — filter của T4 loại `sleep [0-9]`; legacy=5/9 ở polls #17/#18 là tiến trình khác — T4 phán). **Sửa cho đợt sau:** kiểm gate TRONG chunk (mỗi ~30 s, nền) hoặc chỉ chạy chunk khi postboot_exit=1 (gate không thể xanh); và kiểm cờ đã ghi chưa trước khi bắt đầu chunk sau khi repair xong. T56 KHÔNG phán verdict attempt của T4-192.
- **F-192-T56-4 — Ledger 1→2 dòng do repair (xem §4).** Dòng mới ts 1795618502 (repair #115); KHÔNG dòng mới cho replay (replay không chạy). T2/T10 lưu ý khi đọc ledger.
- **F-192-T56-5 — Watcher-191 kết thúc ĐÚNG HẠN (lần đầu watcher kết thúc sạch, không chết trước reboot); khoảng không-watcher ~3h09m17s bao 1 boot (#115).** X11/zombie/ss đợt này CHỈ snapshot cuối (0 zombie / 0 socket / 0 listener) — T56 không snapshot mở/đóng riêng; lần sau snapshot đủ 3 thời điểm như đợt 191.
- **F-177-T5-3 vẫn đúng (lần 16):** `who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T56 dùng **epoch /proc/stat làm chuẩn**.
- **round-in-progress.md:** T56 không kiểm latch đợt này (không thuộc nhiệm vụ T56). **Inotify max_user_watches:** T56 không đo lại đợt này (lần đo gần nhất vẫn là T6-187: 63.747). **RAM/ENOSPC #115:** thuộc T9-192 (T56 không đo).

## §9. Đề xuất cho parent (quyết ở aggregate 192)

**(a) Chấp nhận verdict đợt 192 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #115 đã có (repair-som-quyet-h, poll=1, verify độc lập exit=0), replay #115 KHÔNG CHẠY (dạng B — đã xử lý đúng bằng early-repair), cờ cũ VẪN CÓ, (A) 120/120 lần 41, #115 KHÔNG GIẾT HOLDER (chuỗi 18 → 19), prune 66 xóa 5 file theo điều (a), hướng (3) lần 38, 0 vi phạm B4 phía T56, 0 chồng pha (b) với T4.

**(b) Cờ #115 ứng viên (repair-som-quyet-h, poll=1) — CÂU HỎI QUYẾT:** repair 1 lần theo chiến lược (h) → poll1 exit=0, verify độc lập exit=0, 11/11 apt + 5/5 lib + GST 269=269 (symlink) + dpkg 768 + 1 transaction + term.log 0 lỗi + ledger +1 dòng repair. **Parent chọn 1 trong 2:** (b1) Chấp nhận cờ #115 đứng cho gate (a) **CÓ caveat** (GST symlink, không phải thư mục thật — tiền lệ #111 repair-sớm, poll=1); (b2) Chấp nhận KHÔNG caveat (T56 không thấy căn cứ — GST là symlink ephemeral, khác profile #114).

**(c) Replay #115 KHÔNG CHẠY (dạng B) — T56 đề xuất parent ghi nhận + KHÔNG bù được bằng replay; cờ repair là cách xử lý đứng.** Nguyên nhân dạng B VẪN CHƯA TÌM RA trong cell — nợ host-side theo quyết (k) đợt 174.

**(d) Xác nhận số hiệu boot mới ebc5a3b9 = #115** (T01-192 xác minh; btime 14:23:56Z, epoch 1795616636, gap 21.493 s; numbering theo T0 đã quyết ở (e)-186.)

**(e) #115 KHÔNG GIẾT HOLDER — chuỗi 18 → 19** (trống 17.112 s; gấp ~8.556× δ 1 s).

**(f) (A) 120/120 lần thứ 41 (tổng 4920/4920) + suite 9/9 × 6 (chuỗi suite xanh 73) — parent ghi nhận?**

**(g) Prune lần 66: điều (a) xóa 5 file, queue 99 → 94; F-147-T6-1 chuỗi VẪN 0 lần thứ 13 — parent ghi nhận?**

**(h) Hướng (3) VẪN ĐỨNG lần thứ 38 — parent ghi nhận?**

**(i) F-192-T56-1 (poller T4 đường chính round192-t5 không tồn tại — lần thứ hai liên tiếp; gate0 chạy bằng dự phòng T4-check-only) — brief T4 đợt sau PHẢI cập nhật đường chính poller sang round<N>-t56/.**

**(j) F-192-T56-3 (chunk 4 chồng pha (a) ~59 s khi gate lật xanh giữa chunk; 0 chồng pha (b)) — ghi nhận là caveat, không tính vi phạm; brief đợt sau yêu cầu kiểm gate TRONG chunk.**

**(k) Watcher-192 vẫn chạy trên #115** (pid 8168, hạn 17:35:00Z) — T56-193 tiếp quản.

## §10. Sai số của chính T56-192 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-192-T56-1..5** | Xem §8 (đầy đủ, không lặp lại ở đây) | Ghi nhận | — |
| §1.1 | T56 mở muộn boot+17', watcher spawn muộn boot+20m49s (khoảng không-watcher ~3h09m bao 1 boot) | Ghi nhận | Replay #115 không chạy nên spawn muộn không mất mát; early-repair trigger ngay poll đầu |
| §6 | Kiểm gate chỉ TRƯỚC/SAU chunk, không TRONG chunk → chunk 4 chồng pha (a) ~59 s | Caveat | F-192-T56-3; 0 chồng pha (b); sửa quy trình đợt sau |
| §5.3 | X11/zombie/ss chỉ snapshot cuối, không mở/đóng | Hạn chế nhỏ | 0 zombie / 0 socket / 0 listener lúc cuối |
| — | Đồng hồ: CF +1 s (T01-192 khớp +1 s); T56 không chạy lap CF riêng thứ hai | Hạn chế nhỏ | δ=1 s đủ cho verdict holder (khoảng trống gấp ~8.556 lần) |
| — | RAM/ENOSPC #115 không đo (thuộc T9-192); inotify không đo lại (giữ số T6-187: 63.747) | Hạn chế nhỏ | Diễn biến đầy đủ thuộc T9-192 |
| — | (m) #115 không trình số thô (thuộc T2-192); T56 không chạy probe DB | Hạn chế nhỏ | T2-192 phán cuối |

**Số liệu chính thức lấy từ log watcher-191/192 + log trực tiếp (verify form-B/poll1/independent) + dpkg/history/term.log của #115 + ledger /var/lib/hatch/os-intent/ledger.jsonl + hồ sơ T01-192 survey + log lock thật + queue trên đĩa + poll log T4-192 + đối chiếu aggregate 191 (§14.2).**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND192_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round192-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round192-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push hiện tại: đợt 191 (12/45/42/31) + đợt 192 (T56 = 1 file này; các T khác chưa tính lúc T56 đóng; T10 đếm lại bằng dedup toàn cục).

## Phụ lục A — Trích số liệu T56-192 (bản chính, 14:40Z – 15:04Z 25/11)

```
boot #115=ebc5a3b9-230f-4ea5-926f-c3a62c96fbf5 btime=1795616636=14:23:56Z (uptime -s KHOP; /proc/1 14:24:13.883Z; journal +18 s)
boot #114=b0aab705-7ef5-47fd-95e0-e97910fbfa88 btime=1795595143=08:25:43Z
gap 21493 s; watcher-191 (log 42328 B): START 08:45:57Z pid=9180; poll cuoi 11:34:58Z dpkg 1468 md5=9387d070; END 11:35:28Z DUNG HAN; 0 END/STOP/NEWBOOT truoc han
watcher-192: START 14:44:45Z pid=8168 boot=ebc5a3b9 end=17:35:00Z; init dpkg 2 md5=0daee7f1 mtime=14:24:38Z cache=0 lists=5 gst_sys=0; EARLY-REPAIR TRIGGER 14:44:45Z (boot_age 1249 s, frozen 1207 s); verify form-B exit=1 (14:44:47Z); --repair 14:44:47-14:55:01Z; poll1 exit=0 (14:55:04Z); FLAG-WRITTEN 14:55:05Z poll=1 (old=b0aab705)
POSTBOOT_PASS #115: CO 324 B md5=734f8e2d; backup #114 md5=288f863b = goc; dpkg 768 md5=7ec12b3f mtime 14:55:01Z; cache=107; lists=75; GST 269 (SYMLINK -> debroot); history 1 tx (End-Date 14:55:01Z); term.log 0 loi; apt log 51941 B / 696 dong; verify doc lap exit=0 (14:58:39Z)
POSTBOOT_PASS #113: KHONG CO (0 file nhac f7632121 trong co; tong boot khong co GIU 26)
Co cu KHONG DOI: #114 288f863b / #112 ca79a6b2 / #111 abe240cb / #110 302ae331 / #109 a6fc7d69 / #107 b7259902 / #104 8e6d6e5d / #102 6007fea8 / #101 8c32fc3c / #99 3d031656 / #98 26452ec1 / #96 50869e4e / #95 f8cd6d46
Lock (mo/kiem cuoi): raw 2725/2728; cleaned 2719/2722; ACQUIRED 778/779; RELEASED 766/767; cap 766/767; chenh 13/12 (1 held t01 luc 14:59Z -> 0 luc cuoi); TICKET 789/790; COOLDOWN 363; STALE-LOCK 12; STALE-TICKET 1; TIMEOUT 10; double-acquire 7; held: (t01-round192 14:57-15:01Z) / (trong)
(A): suite a89c0676; live-code c92f2efff; block dc973443 (giong het 151-191); suite 6x 9/9 rc=0 (14:46:30-14:50:18Z); harness 120/120 B1=1 B2=0 (14:50:43-14:58:05Z; 4 chunk x 30; delay 567/3478/1977.19 ms)
Gate: 8 lan kiem (poll #8/#10/#11/#13/#15/#16 khong-dat; #17 14:57:06Z T4-check-only — gate lat xanh GIUA chunk 4, chong pha (a) ~59 s; #18 sau chunk 4); 0 CUA YEN MO; 0 t4-round192 trong lock log; T4 polling toi poll #25 (15:03:15Z)
Prune 66: truoc 99 file / 1386 B; xoa 5 file (dieu (a)): cooldown-t3, cooldown-t8-round129, cooldown-t10-round129, cooldown-t8-round130, cooldown-t10-round130; sau 94 file / 1316 B; tang tuoi: >=192h 5->0; >=168h 19->14; >=72h 60->55; >=48h 75->70
Holder: #115 KHONG GIET (trong 17112 s truoc btime, ~8556x delta 1 s); chuoi 18 -> 19
Huong (3): lan 38; user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; timers_vcut=0; units_vcut=0
Marker: CO, mtime=2026-11-20 11:39:47Z, 239 B, md5 cb7102c0; song #49-#115 = 67 reboot (T0)
Ledger: 2 dong: ts 1795565495 compacted=true (repair #111) + ts 1795618502 (repair #115); KHONG dong moi cho replay #115
X11/zombie: 0 zombie; 0 socket X11; 0 Xvfb; 0 ss listener (chi snapshot cuoi)
Dong ho: CF +1 s (T56 14:43:17Z + T01-192 14:40:59Z khop); btime epoch nguyen
```

## Nợ mở chuyển đợt 193

1. **(m) #115 phân loại CUỐI + INSIDE #113/#114** — T2-192 + parent 192.
2. **Cờ #115 ứng viên (repair-som-quyet-h, poll=1, CÓ caveat đề xuất)** — parent quyết §9(b). **Số hiệu #115** — T01-192 xác minh, parent quyết (e) §14.1-192. **#113 KHÔNG cờ — tổng boot không cờ GIỮ 26.**
3. **Replay #115 KHÔNG CHẠY (dạng B)** (§4); **nguyên nhân dạng B VẪN CHƯA TÌM RA trong cell** — nợ host-side quyết (k) đợt 174 VẪN MỞ.
4. **F-192-T56-1..5** — ghi nhận; T4/T10/parent lưu ý (đặc biệt F-192-T56-1: poller T4 đường chính round192-t5 không tồn tại — lần thứ hai liên tiếp; F-192-T56-3: kiểm gate TRONG chunk).
5. **Watcher-192 vẫn chạy trên #115** (pid 8168, hạn 17:35:00Z) — T56-193 tiếp quản; nếu reboot mới, spawn watcher mới theo mẫu.
6. **Prune lần 67** — T6-193 (chuỗi F-147-T6-1 đang 0 lần thứ 13; file cũ nhất còn lại `cooldown-t8-round131` mtime 2026-11-17T15:43:51Z — qua mốc 192h lúc 15:43:51Z 25/11).
7. **Auto-trigger lần FIRE thật đầu tiên** — T9-192. **OUTAGE phán cuối T7-194** (T7-193 kiểm onset). **B2 quyết tách** — parent 192. **E-247 kết cục** — T9-192/parent.
8. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user (số đếm vẫn là 16). ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại. File oversize 6,4 MB chưa quyết số phận.
