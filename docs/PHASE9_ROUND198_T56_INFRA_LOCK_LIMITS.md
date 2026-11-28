# PHASE9_ROUND198_T56_INFRA_LOCK_LIMITS.md — T56 đợt 198 (gộp T5+T6: infra/watcher + POSTBOOT_PASS + lock health + prune)

**Trạng thái:** watcher-198 (2 lifetime) + cờ **#126 00:22:08Z** + cờ **#127 01:00:06Z** (repair-som-quyet-h, poll=1, GST symlink, watcher tự ghi) + **WebKit chạy được nhờ debroot + bundled lib (O8 T01-198 21/21 PASS; KHÔNG cài lib hệ thống)** + (A) **120/120 lần thứ 47** + suite 9/9 × 6 (chuỗi xanh 78 → 79) + prune 72 xóa 1 + **#126 KHÔNG GIẾT (1 → 2) + #127 KHÔNG GIẾT (2 → 3)** + hướng (3) **lần thứ 44** + **F-198-T56-1..10**. **#124 KHÔNG CÓ cờ, KHÔNG viết post-hoc; replay #125/#126/#127 KHÔNG CÓ replay đầy đủ** (repair thay thế). **Reboot #127 GIỮA ĐỢT (00:34:26Z)** giết watcher L1 + poller T4 + gián đoạn 1 lệnh T56 (runtime restart — đã kiểm không tác dụng dở, làm lại sạch). Monitor **5 s, 0 kill ×5**. 1 entry stage duy nhất.

**Nguồn:** §14.2 aggregate 197 **(trên đĩa 37.953 B, 169 dòng — CHỈ CÓ MỘT §14.2, dòng 134, "lượt handoff 06:39 +07")**. **MÂU THUẪN NGUỒN (F-198-T56-8):** brief nói có HAI §14.2, quyết thật ở dòng 160 ("lượt cron 06:35 +07") — trên đĩa KHÔNG CÓ §14.2 thứ hai; (r) trên đĩa ghi "replay #124/#125" mâu thuẫn (k) ("replay #125/#126"). T56 làm theo **brief + (k)**, không dùng /tmp/count-197-recheck.py. Quyết dùng: (a) CHẤP NHẬN CÓ ĐIỀU KIỆN; (b) FULL PASS KHÔNG CÓ; (c) #125 CÓ caveat (b1), #124 KHÔNG CÓ (30 → 31), **#126 CHƯA CÓ (T56-198)**; (e) #124/#125 XÁC NHẬN, #126 ỨNG VIÊN, marker 75 → 77; (i) holder 27 → 0 → 1, (A) lần 46, suite 77 → 78, hướng (3) lần 43; (k) KHÔNG replay #124 post-hoc, replay #125/#126 thuộc T56-198; (q) đợt 197 = 12/43/41/29; (r) T56-198: POSTBOOT #126 + watcher-198 + replay #125/#126. (Các quyết khác xem aggregate 197.)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT #126 (ba8ad21e) | **ĐÃ CÓ 00:22:08Z** (§1.3); form-B exit 1 → --repair exit 0 → poll1 exit 0; dpkg **777** (822fc675); cache 108; lists 75; GST 269=269 **SYMLINK → debroot**; verify độc lập exit 0 (~00:27:49Z, log md5 2fb87e1b) |
| POSTBOOT #127 (6882f9a9) | **ĐÃ CÓ 01:00:06Z** (§1.5); form-B exit 1 → --repair exit 0 → poll1 exit 0; dpkg **777** (ffed3c46); cache 108; lists 66; GST 269=269 **SYMLINK → debroot**; verify độc lập exit 0 (01:04:12Z, log md5 93ababcc — caveat §10) |
| POSTBOOT #125 (8304fcd1) | **ĐÃ CÓ từ đợt 197, KHÔNG viết lại** (viết tay 21:28:14Z, caveat (b1); md5 48fec087 KHÔNG ĐỔI) |
| POSTBOOT #124 (611a02f2) | **KHÔNG CÓ, KHÔNG VIẾT ĐƯỢC post-hoc** (tiền lệ #118/#120/#122; tổng boot không cờ 30 → 31 đã quyết) |
| Watcher-197 | **CHẾT theo reboot #126** (ALIVE poll 21:49:27Z của T56-197; ps T56-198 kiểm 00:02Z + 00:08Z: **0 process** — chỉ còn b2watch.sh pid 3023) |
| Watcher-198 | L1: START **00:09:20Z, pid 208790**, boot ba8ad21e — **CHẾT theo reboot #127** (last poll 00:34:44Z). L2: START **00:38:46Z, pid 10882**, boot 6882f9a9, hạn **02:35:51Z 27/11**, ALIVE lúc đóng. Khoảng không-watcher #126: **5.799 s**; #127: **260 s** |
| Replay #125/#126/#127 | **KHÔNG CÓ replay đầy đủ cả ba** (dạng B → early-repair; dpkg 777, KHÔNG phải 1.545 chuẩn) |
| WebKit libs | **KHÔNG CÓ lib hệ thống trên #126 VÀ #127** (dpkg 0, ldconfig 0) — NEED 11 gói KHÔNG chứa libwebkitgtk nên --repair KHÔNG khôi phục được; **WebKit chạy được nhờ bundled lib Playwright (webkit-2388 trong ~/.cache) + GST → debroot** — O8 T01-198 **21/21 PASS** trên #126 (F-198-T56-2; debroot ghi vào quy trình khôi phục §2) |
| Marker sống | **KHÔNG XÁC MINH ĐƯỢC đợt này** (không tìm ra đường dẫn file — F-198-T56-6); giữ số đợt 197: md5 cb7102c0, mtime 2026-11-20 11:39:47Z |
| (A) lock | **120/120 PASS lần thứ 47** (tổng **5.640/5.640**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 78 → **79** |
| Lock | 830 cặp lúc kiểm cuối, 0 đang giữ, chênh **GIỮ 13**, STALE-LOCK **GIỮ 13**, double-acquire GIỮ 7, 0 TIMEOUT mới; **#126 KHÔNG GIẾT (1 → 2); #127 KHÔNG GIẾT (2 → 3)** |
| Prune 72 | **XÓA 1 FILE theo điều (a)** (queue 89 → 88; F-147-T6-1 chuỗi **VẪN 0 lần thứ 19**) |
| Vi phạm T4 | **0 chồng pha (b)** — monitor 5 s, 5 lần chạy, 0 kill. T4 attempt1 partial (exit 2, wedged/timeout — KHÔNG tính verdict; verify độc lập của T56 chạy 01:04:12Z trong lúc attempt1 — chỉ đọc, dpkg không đổi; verdict thuộc T4 — F-198-T56-10); **attempt2 HỢP LỆ 20/20 + B 5/5 + tickCost 55,0 ms** (poller đã thoát) |

**Số hiệu boot #126/#127 CHƯA QUYẾT CUỐI — T01-198 xác minh (GAP §126; parent quyết (e) ở aggregate 198).** #126 = ba8ad21e ứng viên (gap 7.493 s; T56 đo tươi 00:02:26Z). #127 = 6882f9a9 ứng viên (gap 7.305 s; T56 đo tươi 00:37:53Z). T56 KHÔNG phán (m) — thuộc T2-198; lặng + run 204 thuộc T7-198.

## §0. Trạng thái lúc mở (~00:02Z 27/11)

- **Boot lúc mở: `ba8ad21e-d1a1-489c-baa9-9e2dc52173f4`, btime 22:32:41Z** (epoch 1795732361; `uptime -s` khớp; journal idx 0 duy nhất, first 22:32:59Z = btime +18 s; `last`/`who` KHỚP). **#126 ứng viên** (T9-197 phát hiện 22:33:44Z; T01-198 xác minh). Gap #125→#126 = **7.493 s**. **KHÔNG có reboot trong phiên T56 cho tới 00:34:26Z** (#127 — §1.5).
- **Replay #126 CHƯA CHẠY lúc mở:** dpkg.log **2 dòng** (22:33:35Z, md5 68e98742, đóng băng ~1h29m); /var/log/apt **KHÔNG TỒN TẠI**; lists 3 (chỉ auxfiles/lock/partial); cache 0; GST **0 file**; 0 proc. **CÙNG CHỮ KÝ dạng B như #60/#125/#142.**
- **Ledger — VẪN 1 dòng, added 170 → 173:** mtime **22:34:07Z** (host dump lại lúc boot #126), ts **1795728523** (= 21:28:43Z — lúc T56-197 cài libwebkitgtk trên #125), **added 173 gói** (F-198-T56-2). **KHÔNG có dòng nào cho replay #126** (repair không chạm ledger — như #121/#123/#125).
- **Watcher-197 ĐÃ CHẾT lúc mở** (ps 0 process — kiểm 2 lần; §1.2). **T4-198 ĐANG CHỜ CỜ** (poll-wait từ 00:10Z; preflight FAIL 22:32:41Z — thiếu 5 lib + 11 gói apt + GST 0 file; chưa có poll-t4.log). **T01-198 CHƯA spawn lúc T56 mở** (acquire lock 00:12:20Z — §5.4).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 26–27/11/2026)

**20:27:48Z** reboot #125 (8304fcd1). **21:28:14Z** cờ #125 viết tay (caveat (b1)). **22:32:41Z** **reboot #126 (ba8ad21e)** — watcher-197 CHẾT. **00:02:26Z** T56-198 mở + survey #126. **00:09:20Z** **watcher-198 L1 START pid 208790 + EARLY-REPAIR TRIGGER #126** → form-B exit=1 → --repair (update ~12 phút, KHÔNG timeout) → poll1 exit 0. **00:22:08Z** **CỜ #126**. **00:23:10Z** T4 poll #17 thấy cờ. **~00:27:49Z** verify độc lập #126 exit 0. **00:34:26Z** **reboot #127 (6882f9a9)** — watcher L1 + poller T4 CHẾT. **00:35:42Z** prune 72 (làm lại sau runtime restart). **00:36:38Z** T4 khởi động lại poller trên #127 (t5flag=cu). **00:38:46Z** **watcher-198 L2 START pid 10882**. **00:49:47Z** **EARLY-REPAIR TRIGGER #127** → form-B exit=1 → update ~10 phút → poll1 exit 0. **01:00:06Z** **CỜ #127**. **01:01:29Z** T4 mở attempt1 (CUA YEN MO poll #34). **01:04:12Z** verify độc lập #127 exit 0 (trong lúc attempt1 — §10). **01:04:36Z** attempt1 partial (exit 2) → attempt2. **01:08:09Z** attempt2 xong — **HỢP LỆ 20/20 + B 5/5 + tickCost 55,0 ms**, poller thoát.

### §1.2. Watcher-197 — CHẾT theo reboot #126; watcher-198 L1 + khoảng không-watcher 5.799 s

- Watcher-197 (pid 6248, START 20:45:21Z trên #125) ALIVE lúc poll 21:49:27Z của T56-197; **CHẾT theo reboot #126 (22:32:41Z)** — T9-197 phát hiện 22:33:44Z; brief ghi "parent kiểm ps ~23:47Z: chỉ còn b2watch pid 3023". T56-198 kiểm ps 2 lần (~00:02Z, ~00:08Z, mẫu `[r]eplay-watch` + `pgrep -f`): **0 process watcher/replay-watch** — chỉ còn `b2watch.sh` pid 3023 — đủ điều kiện spawn theo quy tắc đứng (3). Log ps lưu `ps-check-198.txt`.
- **Watcher-198 L1: START 00:09:20Z, pid 208790, hạn 02:35:51Z 27/11** (= hạn cứng đợt 198 — THEO BRIEF; khác mẫu watcher-197 là hạn cứng đợt sau — F-198-T56-1). Spawn bằng đường dẫn tuyệt đối + nohup + disown (F-167-T5-2); verify độc lập bằng ps + START line + poll đầu.
- **Khoảng không-watcher 5.799 s (1h36m39s)** (22:32:41Z → 00:09:20Z) — bao phần đời #126 trước spawn. Ngắn hơn nhiều so với 15.423 s đợt 197; **KHÔNG bao trọn một boot** (lần đầu kể từ đợt 193).
- **Watcher-198 L1 CHẾT theo reboot #127** (last poll 00:34:44Z; xem §1.5 — caveat đồng hồ guest: last poll muộn hơn btime mới 00:34:26Z đúng 18 s).

### §1.3. POSTBOOT_PASS #126 — ĐÃ CÓ 00:22:08Z (repair-som-quyet-h, poll=1 — WATCHER TỰ GHI, khác đợt 197)

- **Watcher repair THÀNH CÔNG ngay lần đầu (khác đợt 197 — không cần xử lý tay):** EARLY-REPAIR trigger 00:09:20Z (boot+15' = 22:47:41Z đã qua; frozen 5.745 s; 0 proc; dpkg 2 dòng < 100). Verify form-B exit=1 (hoàn tất 00:09:21Z — đúng kỳ vọng: thiếu 5 lib + 11/11 gói apt). `--repair` chạy `apt-get update` (pid 209167): **TIẾN TRIỂN ỔN, KHÔNG timeout** — Get:67 lúc 00:14:58Z, xong ~00:21:2x (~12 phút; đợt 197 timeout 1.500 s ở bước này). Install 11 gói NEED (pid 298712, ~00:21:2x–00:22:07Z) → RE-CHECK đều PASS → poll1 **exit 0 (00:22:08Z)** → **watcher ghi cờ 00:22:08Z** (boot+1h49m27s; mode `repair-som-quyet-h`, poll=1, pbts = lúc hoàn tất poll1); cờ cũ #125 sao lưu thành POSTBOOT_PASS-8304fcd1 (md5 48fec087 = bản gốc).
- **Profile cờ GIỐNG HỆT #125, YẾU HƠN #121/#123:** repair (không phải replay đầy đủ — dpkg **777 dòng**, không phải 1.545) + GST **symlink → debroot** (269 file, ephemeral, vá K1) + poll=1. Nội dung PASS đầy đủ (11/11 apt + 5/5 lib + GST isomp4/libav, verify độc lập exit 0) nhưng nguồn gốc là repair — parent quyết caveat ở §9(b) (T56 đề xuất (b1) CÓ caveat, như #125).
- **Replay #126: KHÔNG CÓ replay đầy đủ** (dpkg đóng băng 2 dòng tới lúc repair; /var/log/apt không tồn tại; 777 dòng dpkg đến từ repair, không phải replay 1.545 như #121/#123). T4 thấy cờ ở poll #17 (00:23:10Z) — xem §6.

### §1.4. POSTBOOT_PASS #124 — KHÔNG CÓ, KHÔNG VIẾT ĐƯỢC post-hoc; replay #125 KHÔNG CÓ

- #124 (611a02f2, btime 16:28:18Z): **0 file cờ nào nhắc 611a02f2** (chỉ ghi chú NOTES/GAP — tiền lệ #118/#120/#122). #124 chết 20:27:48Z, TRƯỚC khi T56-197 mở phiên. **T56-198 KHÔNG viết cờ thay, KHÔNG replay #124** — quyết (k)-197.
- **Replay #125: KHÔNG CÓ replay đầy đủ** — bằng chứng sống còn từ đợt 197 (T56-197 §1.3): dpkg #125 đóng băng 2 dòng từ 20:35:41Z; chỉ có repair tay 10 gói → 777 dòng; /var/log/apt không tồn tại trên #125. T56-198 ghi nhận theo bằng chứng đó (không đo lại được boot đã chết). Dạng replay #125 = **B → repair thay thế** (như #126/#127).
- **Tổng boot không cờ 30 → 31** (đã quyết (c)-197 — #124 là boot duy nhất không cờ trong chuỗi; #125/#126/#127 đều ĐÃ CÓ cờ).

### §1.5. Reboot #127 giữa đợt (00:34:26Z) — watcher CHẾT + respawn L2 + POSTBOOT_PASS #127 ĐÃ CÓ 01:00:06Z

- **Reboot #127 ứng viên (6882f9a9-59d0-41ea-bafc-1433b4f17e16, btime 1795739666 = 00:34:26Z, gap #126→#127 = 7.305 s; #126 sống 7.305 s).** T56 đo tươi 00:37:53Z: `uptime -s` + btime + journal idx 0 first 00:34:39Z (= btime +13 s) + `last`/`who` KHỚP. **Watcher-198 L1 (pid 208790) CHẾT theo reboot này** (last poll 00:34:44Z; ps sau reboot: 0 process replay-watch). **Poller T4-198 cũng CHẾT** (khởi động lại 00:36:38Z — poll #1/#2 trên #127: t5flag=cu, gate0=khong-dat, chờ cờ mới). **Runtime restart** cùng lúc làm gián đoạn 1 lệnh prune của T56 (đã kiểm không tác dụng dở, làm lại sạch — §7). **Caveat đồng hồ guest (F-198-T56-5):** last poll L1 00:34:44Z muộn hơn btime mới 00:34:26Z đúng 18 s — xác minh btime thuộc T01/T2-198.
- **Trạng thái #127 lúc respawn (~00:38Z):** dpkg.log **2 dòng** (00:35:10Z, md5 4ac68a24); /var/log/apt **KHÔNG TỒN TẠI**; lists 3; cache 0; GST 0; 0 proc. **CÙNG CHỮ KÝ dạng B**. Ledger mtime 00:35:33Z, ts 1795738927 (= 00:22:07Z), added VẪN 173.
- **Watcher-198 L2 (respawn — cùng script, END 02:35:51Z giữ nguyên):** ps-check 3 trước respawn (~00:38Z): 0 process; START **00:38:46Z, pid 10882**, boot 6882f9a9, ALIVE lúc đóng (poll 01:11:08Z). **Khoảng không-watcher #127: 260 s** (00:34:26Z → 00:38:46Z, theo đồng hồ mới). Log `replay-watch-198.log` ghi cả 2 START line; ghi chú respawn ở `watcher-198-respawn-127.txt`.
- **Early-repair #127:** trigger **00:49:47Z** (boot_age 921 s, frozen 877 s — đúng thiết kế: chờ boot+15' = 00:49:26Z rồi mới trigger, khác L1 trigger ngay vì boot đã già). Verify form-B exit=1 (00:49:47Z). `--repair` exit 0: apt-get update (pid 160176) ~10 phút, KHÔNG timeout; install 11 gói NEED; RE-CHECK đều PASS → poll1 **exit 0 (01:00:06Z)** → **watcher ghi cờ 01:00:06Z** (boot+25m40s); cờ cũ #126 sao lưu thành POSTBOOT_PASS-ba8ad21e (md5 f076a945 = bản gốc). Apt log repair 699 dòng.
- **Profile cờ #127 GIỐNG HỆT #125/#126:** repair (dpkg **777 dòng** — trùng hệt #126 vì cùng 11 gói NEED; md5 ffed3c46) + GST **symlink → debroot** (269 file, tạo 00:49Z) + poll=1 + lists **66** (ít hơn #126 là 75 — do mirror/lists lúc update; không ảnh hưởng PASS). Verify độc lập exit 0 (01:04:12Z, log md5 93ababcc — caveat §10). **Replay #127: KHÔNG CÓ replay đầy đủ** (dạng B → early-repair). Parent quyết caveat ở §9(b) (T56 đề xuất (b1) CÓ caveat cho cả #126 lẫn #127).

## §2. Verify độc lập #126/#127 + GST SYMLINK + WebKit qua debroot (F-197-T8-1)

- **Verify độc lập #126: postboot exit=0** (~00:27:49Z — log mtime; 881 B, 5 dòng PASS) — wrapper PASS (vá K1); **5/5 lib PASS**; GST **269=269 PASS** (isomp4 + libav); **11/11 gói apt PASS** (kể cả libevdev2); KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. File: `t56-postboot-independent-ba8ad21e.log` (md5 2fb87e1b). **Verify độc lập #127: postboot exit=0** (01:04:12Z, log md5 93ababcc — caveat §10: chạy trong lúc T4 attempt1 đang chạy, chỉ đọc).
- **GST #126/#127 là SYMLINK → debroot** (`/home/hatch/workspace/tmp-q6r3-debroot/.../gstreamer-1.0`, tạo 00:09Z / 00:49Z bởi --repair; kiểm KHÔNG trailing slash — bài học F-194-T56-2/F-197-T56-2). Khác #121/#123 (thư mục thật), giống #119/#125 (symlink, ephemeral). Debroot còn nguyên 269 file.
- **WebKit libs hệ thống — VẮNG trên #126 (và #127):** `dpkg -l libwebkitgtk-6.0-4` = 0 dòng "ii"; ldconfig 0 kết quả; debroot cũng KHÔNG chứa libwebkitgtk/libjavascriptcoregtk (grep 0 — debroot chỉ có GST plugins). **NEED 11 gói KHÔNG chứa libwebkitgtk** → --repair KHÔNG THỂ khôi phục nó (F-198-T56-2). T56-198 KHÔNG cài lib bằng tay (không có lệnh parent cho đợt 198; cài trong cửa sổ (b) của T4 gây VI PHẠM — F-197-T2-1; xem §9(h)).
- **WebKit VẪN CHẠY ĐƯỢC — nhờ debroot + bundled lib (F-197-T8-1, ghi vào quy trình khôi phục):** Playwright wrapper → **bundled lib WebKit trong `~/.cache/ms-playwright/webkit-2388/`** (sống qua reboot, MiniBrowser binary có mặt) + **GST decode qua symlink → debroot** (269 file) + wrapper vá LD_LIBRARY_PATH (K1). Bằng chứng: **T01-198 O8 WebKit 21/21 PASS trên #126** (00:12:20–00:16:30Z; verdict O8 thuộc T01-198). MiniBrowser smoke riêng của T56 **KHÔNG CHẠY đợt này** (F-198-T56-7: T4 sắp mở attempt; O8 đã chứng minh launch được; tránh tải trong cửa sổ (b)).
- **Quy trình khôi phục (F-197-T8-1):** watcher early-repair khôi phục 11 gói NEED + symlink GST → debroot; WebKit KHÔNG cần lib hệ thống (bundled lib + GST debroot đủ); chỉ cài libwebkitgtk khi có lệnh parent + SAU khi poller T4 thoát.

## §3. Cờ cũ — md5 KHÔNG ĐỔI (kiểm lại đợt 198)

| Cờ | md5 lúc kiểm cuối |
|---|---|
| #127 (6882f9a9, MỚI — watcher tự ghi) | 153d57e7 |
| #126 (ba8ad21e, backup ở round198-t56/) | f076a945 (= bản gốc) |
| #125 (8304fcd1, backup ở round198-t56/) | 48fec087 (= gốc round197-t56/) |
| #123 (bc09b26e, backup ở round197-t56/) | e94fad95 (= gốc round196-t56/) |
| #121 (8c4aa907, gốc round196-t56/) | 28847b1e (= bản gốc) |
| #119 (55c9e0b7, gốc round195-t56/) | 863a6035 (= bản gốc) |

## §4. Ledger + T01-198 O8 + ENOSPC

- **Ledger — VẪN 1 dòng:** mtime **22:34:07Z** (host dump lại lúc boot #126), ts **1795728523** (= 21:28:43Z — lúc T56-197 cài libwebkitgtk trên #125), **added 173 gói** (170 → 173: +3 libwebkitgtk/libjavascriptcoregtk/libgtk-4-1 — F-198-T56-2). Trên #127: mtime **00:35:33Z**, ts **1795738927** (= 00:22:07Z — lúc --repair #126 hoàn tất), added VẪN 173. **KHÔNG có dòng nào cho replay #126/#127** (repair không chạm ledger).
- **T01-198 O8 (ghi nhận — verdict thuộc T01-198):** acquire 00:12:20Z (port 5560, wait 1 s), release 00:16:30Z (hold 250 s); O8 DONE 00:16:30Z: **WebKit 21/21 PASS** (webkit1=0 webkit2=0 chromium=0); cây preview.tsx md5 af6c3cc7 (khớp đợt 197). O8 chạy TRONG LÚC suite T56 chạy (00:12:24–00:15:47Z) — 0 chồng lấn lock (suite không đụng lock thật — F-198-T56-4).
- **ENOSPC #126 (T56 chỉ đếm thô — chuỗi thuộc T9-198):** `journalctl -b 0 | grep -ci "no space left"` = **101 dòng lúc ~00:32:56Z** (đầu 22:34:34Z, cuối 00:32:09Z; toàn bộ home-assistant-ensure.service inotify-watch). T9-197 đếm **36 dòng lúc ~23:19Z** — số tăng dần theo thời gian. T56 KHÔNG tự cập nhật chuỗi ENOSPC (thuộc T9).

## §5. Lock health (T6) — #126 KHÔNG GIẾT (1 → 2); #127 KHÔNG GIẾT (2 → 3)

### §5.1. Nhất quán log lock: 830 cặp lúc kiểm cuối, 0 đang giữ, chênh GIỮ 13

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 196 — giống hệt đợt 192); đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T56-197 kiểm cuối | T56-198 kiểm cuối | Δ từ T56-197 |
|---|---|---|---|
| Tổng dòng (cleaned / raw) | 2914 / 2918 | **2942 / 2948** | +28 / +30 |
| TICKET / ACQUIRED / RELEASED | 846 / 835 / 822 | **854 / 843 / 830** | +8 / +8 / +8 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 387 / 13 / 1 / 10 | **391 / 13 / 1 / 10** | +4 / 0 |
| Cặp ACQUIRED→RELEASED | 822 | **830** | +8 |
| Đang giữ / Chênh ACQ−REL | 0 / 13 | **0 / 13** | 0 |
| Double-acquire | 7 | **7** | 0 mới |

- **+30 dòng thô kể từ T56-197 kiểm cuối:** t8-round197 ×21 (5 chu kỳ 21:50:22–22:17:58Z — khép kín) + t01-round198 ×3 (00:12:20–00:16:30Z — khép kín) + t4-198 ×6 (attempt1 + attempt2 trên #127, 01:01:29–01:08:09Z — khép kín). **0 dòng nào của T56 trên log lock thật** (suite/harness chỉ chạy trên /tmp).
- **Chênh 13 GIỮ NGUYÊN** (acquire t8-196 16:18:09Z không release — đã tuyên STALE-LOCK 16:40:23Z). **STALE-LOCK GIỮ 13; double-acquire GIỮ 7 — 0 ca mới**; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50:28Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE.**
- **Lưu ý đếm (F-197-T56-8(b)):** cleaned +28 vs raw +30 — baseline 197 tự lệch 2 dòng (đếm ở hai thời điểm). Đếm đợt này nhất quán (2948 − 6 tA/tH = 2942); RELEASED/COOLDOWN +8/+4 vì baseline 197 đã gồm cặp 21:50:22Z.
- **Caveat:** **#68/#95/#124 GIẾT HOLDER** (chuỗi 27 → 0 ở #124); **#96–#123 + #125/#126/#127 KHÔNG giết** (#106 không tính; #122/#123 parent đã xác nhận).

### §5.2. #126 — KHÔNG GIẾT HOLDER (chuỗi 1 → 2 nếu parent xác nhận #125/#126)

#126 (btime 22:32:41Z, `ba8ad21e-d1a1-489c-baa9-9e2dc52173f4`, T56 đo tươi 00:02:26Z): dòng lock cuối trước btime là t8-round197 RELEASED 22:17:58Z — **TRỐNG 883 s**; dòng đầu sau btime là t01-round198 TICKET 00:12:20Z; 0 STALE-LOCK mới. Khoảng trống gấp ~441 lần δ 2 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 2 reboot** (tiền lệ (p)-196) nếu parent xác nhận #126 = ba8ad21e. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu theo GAP §126 (T01-198) + quyết (e)-197. **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục 22:17:58Z–00:12:20Z nên MỌI boot trong cửa sổ đều không thể giết holder.

### §5.3. #127 — KHÔNG GIẾT HOLDER (chuỗi 2 → 3 nếu parent xác nhận #126/#127)

#127 (btime 00:34:26Z, `6882f9a9-59d0-41ea-bafc-1433b4f17e16`, T56 đo tươi 00:37:53Z): dòng lock cuối trước btime là t01-round198 RELEASED 00:16:30Z — **TRỐNG 1.076 s (17m56s)**; dòng đầu sau btime là t4 TICKET/ACQUIRED 01:01:29Z (attempt1 — sau btime 27m03s, không ảnh hưởng verdict: holder phải đang giữ TẠI btime); 0 STALE-LOCK mới. **Chuỗi mới = 3 reboot** nếu parent xác nhận #127 = 6882f9a9. Cùng lập luận không-phụ-thuộc-số-hiệu như §5.2.

### §5.4. Quét zombie + X11 + ss (2 snapshot: ~00:28Z + lúc đóng 01:04Z)

| Thời điểm | Zombie | Socket X11 | Xvfb | ss listener |
|---|---|---|---|---|
| ~00:28Z | 0 | 0 | 0 | 0 |
| 01:04:12Z | 0 | **2 (X193, X197 — SÓT)** | **0** | 0 |

- **0 zombie thật ở cả 2 lần** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56 ngoài watcher repair. T56 không khởi động Xvfb/vite nào, không kill process nào. **Listener 0.0.0.0:8765 VẪN MẤT** (như đợt 193–197 — xem F-193-T56-7). **T01-198 O8 giữ lock 00:12:20–00:16:30Z; T4-198 giữ lock 01:01:29–01:04:16Z (attempt1) + 01:04:36–01:08:09Z (attempt2)** (suite/harness T56 chạy trước đó — 0 chồng lấn).

## §6. (A) — 120/120 PASS (lần thứ 47) + suite 9/9 × 6 + MONITOR 5 s, 0 KILL

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7 — đợt này KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676`** (bản (A) đợt 151). Live-code T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — KHÔNG TÁI TẠO ĐƯỢC cách tính từ T6-191 (F-193-T56-6; không chặn verdict). Khối trích `t7-block-a198.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–197. Poll script `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` (đã kiểm lại độc lập đợt này, khớp đợt 197).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (00:12:24–00:15:47Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (chạy khi T01-198 ĐANG GIỮ lock — F-198-T56-4; suite không đụng lock thật; monitor 5 s bọc suite: 0 kill).
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), N=120 lần, churn `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s (như T6-151–T6-197 §6.2). Chỉ chạy trên /tmp, không đụng lock thật/poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn: min 540 ms, max 3491 ms, trung bình 1900,47 ms (đủ 120 dòng, không lần nào bị kill dở).
- **KIỂM GATE — kiểm trước mỗi chunk + monitor TRONG chunk chu kỳ 5 s:** monitor nền `t7-gate-monitor-198.sh` chạy song song mỗi chunk (và cả suite), kiểm mỗi 5 s: (1) poll-t4.log có "CUA YEN MO"/GATE_OPEN=1 không, (2) lock log có **ACQUIRED MỚI BẤT KỲ OWNER NÀO** không — kill toàn bộ process group của chunk ngay khi phát hiện. Suite 6/6 + chunk 1–4: 30/30 × 4 (00:16:28–00:23:37Z) — **tổng 120/120 PASS, 0 lần kill cả 5 lần chạy có monitor.** **CAVEAT F-198-T56-3:** nửa (1) bị mù (T4 dời poll log vào `round198-t4/poll-t4.log`, monitor xem đường cũ — BASE_T4=0 suốt); nửa (2) vẫn bảo vệ đầy đủ (base ACQUIRED thô 843, không tăng); kiểm lại từ log T4: poll #17–#21 blockers=0, chưa mở attempt — **0 chồng lấn thật**.
- **T4-198 (ghi nhận — verdict thuộc T4-198 + parent):** preflight FAIL 22:32:41Z; poll-wait từ 00:10Z; **thấy cờ #126 ở poll #17 (00:23:10Z)**; chưa mở attempt trên #126 (poller chết theo reboot #127); khởi động lại 00:36:38Z; **thấy cờ #127 ở poll #33 (01:00:44Z)**; **attempt1 01:01:29–01:04:16Z: exit=2, partial (wedged/timeout — KHÔNG tính verdict)**; **attempt2 01:04:36–01:08:09Z: exit=0 — 20/20 + LỚP B ĐẠT 5/5 + tickCost median 55,0 ms — LƯỢT HỢP LỆ**, poller đã thoát. Cây preview.tsx: af6c3cc7 → **477a0eac** (poll #31+ — P-threads sửa cây giữa chừng).
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ: 13/30 (43%); **(A) đợt 151–198: 120/120 mỗi đợt (100%)**. **Kết luận: (A) VẪN XANH sau 47 đợt** (tổng 5640/5640). **Chuỗi:** "xanh kép" 46 → **47**; suite xanh: 78 → **79**.

## §7. Prune cooldown lần 72 — XÓA 1 FILE theo điều (a)

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa `cooldown-*` mtime > 7 ngày; (b) trần mềm 100 file; (c) không xóa file đợt hiện tại/ngay trước; (d) ghi tên + số file xóa vào log; (e) chỉ chạy khi lock trống. `-mtime +7` chỉ khớp **≥192h** — bảo thủ hơn chữ luật 24h. Queue ở `hidden_files/vite.lock.queue/`.

- Trước prune (~00:33Z): **89 file / 1246 byte** (87 sau prune 71 + 2 file mới `cooldown-t8-round197` + `cooldown-t01-round198`); ứng viên (`find -mtime +7`): **1 file**. Prune lúc **00:35:42Z**, ngay sau khi kiểm lock trống (dòng cuối RELEASED 00:16:30Z t01-198; T4-198 chưa acquire) — **KHÔNG PHẢI CHỜ LOCK đợt này**.
- **Lần prune đầu TIÊN BỊ GIÁN ĐOẠN (runtime restart):** lệnh prune 00:33:46Z bị giết giữa chừng khi `find` toàn workspace (tìm marker — F-198-T56-6) còn chạy; T56 kiểm chứng **không có tác dụng dở** (queue vẫn 89 file, file ứng viên còn nguyên, không có prune-time.txt/prune-deleted.txt) rồi **làm lại sạch lúc 00:35:42Z**. Bài học: không chạy `find` toàn workspace trong cùng lệnh với thao tác xóa.
- Điều (a) XÓA 1 file (≥192h, đã qua mốc 168h ~25,8h, không vi phạm (c)): **`cooldown-t10-round141`** (193,8h). `prune-deleted.txt` ghi đủ tên. `cooldown-t8-round142` (191,8h lúc đó) CHƯA tới mốc — KHÔNG xóa ở lượt này.
- **Kết quả prune lần 72: 1 file đã xóa.** Sau prune: **88 file / 1232 byte** (89 − 1 = 88 ✓; 1246 − 14 = 1232 ✓). Điều (b) KHÔNG kích hoạt (88 < 100). Tầng tuổi: **≥192h: 1 → 0; ≥168h: 14 → 13; ≥72h: 57 → 56; ≥48h: 70 → 69**. **KHÔNG mất file nào không giải thích được.**
- **F-147-T6-1 — CHUỖI VẪN 0, lần thứ 19 liên tiếp sau khi đứt tại 179:** file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~25,8h. Không đổi luật (luật thuộc parent).

## §8. F-198-T56-n (sai số / ghi nhận của T56-198)

- **F-198-T56-1 — Watcher-198 END = 02:35:51Z theo brief (= hạn cứng đợt 198), khác mẫu watcher-197 (END = hạn cứng đợt sau).** Hệ quả: watcher-198 chết lúc 02:35:51Z; **T56-199 PHẢI spawn watcher-199 kịp thời sau mốc đó** nếu không khoảng không-watcher kéo dài.
- **F-198-T56-2 — Ledger NAY CÓ lib WebKit (added 170 → 173) — đính chính T56-197.** T56-197 ghi "không có trong ledger (grep 0)" — đúng ở thời điểm trước khi cài; sau khi cài, hook dpkg-post-invoke ghi thêm 3 gói vào ledger (ts 1795728523 = giờ cài). Nhưng NEED 11 gói của postboot-check VẪN không chứa libwebkitgtk → --repair KHÔNG khôi phục lib hệ thống. WebKit chạy nhờ bundled lib + debroot (§2).
- **F-198-T56-3 — Monitor T4 bị mù nửa đường log (T4 dời poll log).** T4-198 ghi poll vào `round198-t4/poll-t4.log` (trong thư mục luồng), không phải `hidden_files/round198-t4-poll.log` ở gốc như đợt 197. Monitor-198 xem đường cũ → BASE_T4=0 suốt, nửa kiểm "cửa yên mở" không hoạt động. Nửa kiểm ACQUIRED vẫn bảo vệ đầy đủ (base thô 843, không tăng trong mọi lần chạy); kiểm lại từ log T4: chưa mở attempt trong lúc suite/chunk chạy — 0 chồng lấn thật. Sửa cho đợt 199: monitor xem CẢ hai đường (gốc + trong thư mục luồng).
- **F-198-T56-4 — Suite chạy TRONG lúc T01-198 giữ lock.** Gate-check trước suite (00:12:03Z) thấy lock trống; T01 acquire 00:12:20Z, suite bắt đầu 00:12:24Z — trùng 00:12:24–00:15:47Z với hold 00:12:20–00:16:30Z. Suite/harness chỉ chạy trên /tmp + process giả, không đụng lock thật; log lock không đổi trong suite. Không vi phạm theo thiết kế — nhưng khác tiền lệ đợt 197 (T56 chờ O8 release xong mới chạy suite).
- **F-198-T56-5 — Reboot #127 giữa đợt (00:34:26Z) + runtime restart.** Reboot giết watcher-198 L1 (last poll 00:34:44Z), poller T4-198, và làm gián đoạn 1 lệnh prune của T56 (runtime restart; đã kiểm không tác dụng dở, làm lại sạch — §7). Caveat đồng hồ guest: last poll 00:34:44Z muộn hơn btime mới 00:34:26Z đúng 18 s (tiền lệ F-196-T7-1/F-196-T9-4); xác minh btime thuộc T01/T2-198. Watcher đã respawn L2 (pid 10882, §1.5).
- **F-198-T56-6 — Marker KHÔNG XÁC MINH ĐƯỢC đợt này.** Không tìm ra đường dẫn file marker (grep md5 cb7102c0 toàn hidden_files quá chậm — bị giết theo runtime restart; tìm theo mtime 11:39:47 20/11 chỉ thấy DEF_v0.5.md + LIMITS T5-187/188/189, md5 đều khác). Giữ số đợt 197 (md5 cb7102c0, mtime 2026-11-20 11:39:47Z) CHƯA XÁC MINH — T56-199 cần tìm ra đường dẫn (ghi vào LIMITS) hoặc parent cho biết.
- **F-198-T56-7 — MiniBrowser smoke KHÔNG CHẠY đợt này (chủ động bỏ).** Lý do: T4-198 sắp mở attempt sau khi thấy cờ (poll #17 00:23:10Z); chạy browser lúc đó tạo tải trong cửa sổ (b) — đúng kiểu lỗi F-197-T2-1. O8 T01-198 21/21 PASS trên #126 đã chứng minh WebKit launch được qua wrapper; verify độc lập postboot exit 0 đã đủ. Không phải thiếu sót đo lường.
- **F-198-T56-8 — MÂU THUẪN NGUỒN aggregate 197 §14.2 (brief vs đĩa).** Brief nói có HAI mục §14.2, quyết thật ở dòng 160; đĩa chỉ có MỘT §14.2 (dòng 134) và (r) trên đĩa ghi "replay #124/#125" mâu thuẫn (k). T56 làm theo brief + (k) và ghi nhận mâu thuẫn ở đây + §9(j) để parent/T10 đối chiếu. Nội dung các quyết (c)/(i)/(k)/(r) dùng cho đợt này là nhất quán giữa brief và (k) trên đĩa.
- **F-198-T56-9 — Apt update #126 THÀNH CÔNG (~12 phút) và #127 (~10 phút), khác đợt 197 timeout 1.500 s.** Cùng mirror, cùng NEED; khác biệt là trạng thái mirror/helper lúc chạy. Đường repair của watcher khỏe lại đợt này (không cần xử lý tay cả 2 boot).
- **F-198-T56-10 — Verify độc lập #127 chạy TRONG lúc T4 attempt1 đang chạy (01:04:12Z; attempt1 01:01:29–01:04:16Z).** Check-only, chỉ đọc (không ghi dpkg, không giữ lock); dpkg.log md5 KHÔNG ĐỔI trước/sau (ffed3c46); attempt1 kết thúc exit=2 partial (wedged/timeout — KHÔNG tính verdict; T4 tự ghi, không phải lỗi B4 dpkg). T56 KHÔNG khẳng định verify có/không ảnh hưởng attempt1 — verdict thuộc T4-198. Bài học: verify độc lập phải chạy TRƯỚC khi T4 mở attempt hoặc SAU khi poller T4 thoát.

## §9. Đề xuất cho parent (quyết ở aggregate 198)

**(a) Chấp nhận verdict đợt 198 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #126 + #127 đã có (repair + verify độc lập exit 0, GST symlink 269); WebKit chạy được qua debroot + bundled lib (O8 21/21); (A) 120/120 lần 47, holder #126/#127 KHÔNG GIẾT, prune 72 xóa 1 file, hướng (3) lần 44 — với caveat F-198-T56-3 + F-198-T56-4 + F-198-T56-6 + F-198-T56-10.

**(b) Cờ #126 VÀ #127 (repair-som-quyet-h, poll=1, GST symlink, watcher tự ghi) — CÂU HỎI QUYẾT:** #126/#127: form-B exit 1 → --repair exit 0 (update ~12/~10 phút) → poll1 exit 0 (00:22:08Z/01:00:06Z); 11/11 apt + 5/5 lib + GST 269=269 SYMLINK → debroot; dpkg 777 (repair, không phải replay 1.545). **Parent chọn 1 trong 2 (áp cho cả hai cờ):** (b1) Chấp nhận **CÓ caveat** (repair thay replay + GST symlink + watcher ghi — T56 đề xuất (b1), như #125); (b2) Chấp nhận KHÔNG caveat.

**(c) Xác nhận ba8ad21e = #126 VÀ 6882f9a9 = #127?** (btime #126 22:32:41Z, epoch 1795732361, gap 7.493 s; btime #127 00:34:26Z, epoch 1795739666, gap 7.305 s; T01-198 GAP §126; (m) #126/#127 thuộc T2-198.) **(c2) #124 KHÔNG CÓ cờ — tổng boot không cờ 30 → 31 đã quyết (c)-197, giữ nguyên?**

**(d) #126 KHÔNG GIẾT HOLDER — chuỗi 1 → 2; #127 KHÔNG GIẾT HOLDER — chuỗi 2 → 3** (trống 883 s / 1.076 s; §5.2/§5.3). **(e) (A) 120/120 lần thứ 47 (tổng 5.640/5.640) + suite 9/9 × 6 (chuỗi suite xanh 79) — parent ghi nhận?**

**(f) Prune lần 72: điều (a) xóa 1 file, queue 89 → 88; F-147-T6-1 chuỗi VẪN 0 lần thứ 19. (g) Hướng (3) VẪN ĐỨNG lần thứ 44 — parent ghi nhận cả hai?**

**(h) WebKit libs hệ thống VẮNG trên cell mới — CÓ cài lại không?** Bằng chứng: NEED không chứa libwebkitgtk; WebKit chạy được nhờ bundled lib + debroot (O8 21/21 trên #126). T56 đề xuất **KHÔNG cài** (giữ đường debroot; cài chỉ khi parent ra lệnh + SAU khi poller T4 thoát — tránh F-197-T2-1). Nếu parent duyệt cài trên #127, giao T56-199.

**(i) Monitor T4 cho đợt 199 PHẢI xem cả hai đường poll log** (gốc `round199-t4-poll.log` + trong thư mục `round199-t4/poll-t4.log`) — F-198-T56-3. **(j) Mâu thuẫn nguồn aggregate 197 §14.2 (F-198-T56-8) — parent/T10 đối chiếu khi đóng sổ 198.** **(k) Watcher-199 spawn kịp thời sau 02:35:51Z** (watcher-198 hết hạn — F-198-T56-1); nếu reboot xảy ra sau 02:35:51Z mà chưa có watcher-199, khoảng không-watcher sẽ dài như đợt 197.

## §10. Sai số của chính T56-198 (tự kiểm)

- **F-198-T56-1..10** — xem §8.
- **§1.3/§1.5** — apt-get update #126 (~12 phút) và #127 (~10 phút): ước lượng từ 2 mốc quan sát (pid xuất hiện → install bắt đầu), không phải log update (T56 không đo chính xác giờ bắt đầu/kết thúc update).
- **§5.4** — snapshot zombie/X11 lúc ~00:28Z (1 lần) + lúc đóng 01:04Z (1 lần); lần mở bị bỏ qua vì ưu tiên spawn watcher + verify postboot (như đợt 197 chỉ có 2 snapshot giữa/cuối).
- **md5 cờ cũ #117/#115/#114/#112** không kiểm lại đợt này; md5 poll script / lock v2 / lock v1 đã kiểm lại (1710e480 / 520b8baa / fd21193c — khớp đợt 197); các cờ #127/#126/#125/#123/#121/#119 đã kiểm lại, đều khớp.
- **(m) #126/#127** thuộc T2-198; **lặng + run 204** thuộc T7-198; **RAM/ENOSPC #126/#127** thuộc T9-198; inotify giữ số T6-187: 63.747.
- **84l10/86n2-P1 đợt 198** thuộc T8-198 (T56 không phán). **Số lượt yên đợt 198** thuộc T4-198 (attempt2 HỢP LỆ — §6; T4 ghi số lượt).
- **Marker KHÔNG xác minh được** (F-198-T56-6) — số marker là số giữ từ đợt 197, chưa kiểm lại.
- **Verify độc lập #127 chạy trong lúc T4 attempt1 đang chạy** (F-198-T56-10).

**Số liệu chính thức lấy từ log watcher-198 (2 lifetime) + log trực tiếp (verify độc lập) + dpkg/history/term.log của #126/#127 + ledger os-intent + log lock thật + queue trên đĩa + poll log T4-198 (cả 2 đường) + T01-198 survey + O8 log + đối chiếu aggregate 197 (§14.2 TRÊN ĐĨA — xem F-198-T56-8) + LIMITS T56-197 + LIMITS T01-197.**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND198_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round198-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round198-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push: đợt 191 + đợt 192 + đợt 193 + đợt 194 + đợt 195 + đợt 196 + đợt 197 = 83/282/204/183 (theo quyết (r)-197; T10-198 đếm lại bằng dedup toàn cục).
- **LIMITS này ≤ 37.768 B** (trần push; kiểm `wc -c` trước khi đóng). Phụ lục A bỏ đợt này để giữ dưới trần — mọi số đã có trong các mục chính.
