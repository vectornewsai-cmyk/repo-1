# PHASE9_ROUND197_T56_INFRA_LOCK_LIMITS.md — T56 đợt 197 (gộp T5+T6: infra/watcher + POSTBOOT_PASS + lock health + prune)

**Trạng thái:** ĐÃ XONG watcher-197 + cờ **#125 ứng viên (repair-som-quyet-h, poll=1, GST symlink — VIẾT TAY, §1.3)** + **WebKit libs ĐÃ KHÔI PHỤC** (libwebkitgtk-6.0-4 2.52.6 + libjavascriptcoregtk-6.0-1, smoke chạy được) + (A) **120/120 lần thứ 46** + suite 9/9 × 6 (chuỗi xanh 77 → 78) + prune 71 xóa 4 + **#124 GIẾT HOLDER — chuỗi 27 → 0** + **#125 KHÔNG GIẾT — chuỗi 0 → 1** + hướng (3) **lần thứ 43** + **F-197-T56-1..8**. **#124 KHÔNG CÓ cờ** (chết trước khi T56 mở phiên — tiền lệ #118/#120/#122; tổng boot không cờ 30 → 31). **Lặng scheduler #C 8.404 s** bao trùm btime #125 (T01-197 — phân loại thuộc T7-197 + parent). Monitor chu kỳ **5 s**, **0 kill cả 5 lần chạy**. 1 entry stage duy nhất.

**Nguồn đứng duy nhất:** §14.2 aggregate 196 **(84.800 B — BẢN PARENT-ĐÃ-ĐÍNH-CHÍNH; nguồn gốc §14.2-196 CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18)**. Quyết THẬT dùng: (a) CHẤP NHẬN CÓ ĐIỀU KIỆN đợt 196, điều kiện (vi) T56-197 khôi phục libs WebKit trên cell #124; (b) FULL PASS KHÔNG CÓ, chuỗi 1 → 0; (c) #123 CÓ không caveat, #122 KHÔNG CÓ (tổng 29 → 30), **#124 CHƯA CÓ (T56-197 viết)**; (e) bc09b26e = #123 XÁC NHẬN, 2f268a28 = #122 XÁC NHẬN, **611a02f2 = #124 ỨNG VIÊN** (btime 16:28:18Z, gap 7.082 s), marker 73 → 75; (f) (m) #123 THÔ 0 + (m) #124 THÔ 1 — phân loại CUỐI thuộc T2-197; (h) E-247 ĐÓNG; (i) holder 25 → 26 → 27, (A) 120/120 lần 45, suite xanh 76 → 77, hướng (3) lần 42; (j) V4 GIỮ LIVE, 84l10 chuỗi 3 → 4, 86n2-P1 GIỮ 17, log sạch 40 → 41, B2 vùng mới sạch lần 10, B1 live sạch 3 ĐỨT; (k) replay #123 dạng A; (l) ENOSPC chuỗi 42 → 43, birefnet 0 lần thứ 48; (m) lượt yên #64 0/3, live-check #15 KHÔNG ĐẠT; (n) OUTAGE #4/#5 MỚI, tổng lặng 26/11 = 20.040 s; (o) auto-trigger GIỮ LIVE; (p) đợt 196: 0 vi phạm — chuỗi 0 vi phạm 0 → 1; (q) đếm cuối đợt 196 = 12/44/43/28, lũy kế 849/1.588/1.345/1.149; (r) T56-197 cờ POSTBOOT_PASS #124 + watcher-197 (kiểm ps trước) + khôi phục libs WebKit.

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #125 ứng viên (8304fcd1) | **ĐÃ CÓ 21:28:14Z (boot+60m26s, repair-som-quyet-h, poll=1, GST symlink — VIẾT TAY, §1.3)** — manual update exit 0 + postboot --repair exit 0 (21:24:17Z) + verify độc lập exit 0 (21:24:31Z); dpkg **777** (md5 c2ce0cfb); cache 108 → 121; lists 75; GST 269=269 **SYMLINK → debroot** (như #119) |
| POSTBOOT_PASS #124 (611a02f2) | **KHÔNG CÓ, KHÔNG VIẾT ĐƯỢC post-hoc** (chết 20:27:48Z trước khi T56 mở ~20:40Z — tiền lệ #118/#120/#122; tổng boot không cờ **30 → 31**) |
| Watcher-196 | **CHẾT theo reboot #124** (ALIVE poll 15:03:14Z; T01-196 xác nhận không còn process lúc survey #124); ps T56-197 kiểm ~20:40Z + 20:45:16Z: **0 process** — đủ điều kiện spawn mới |
| Watcher-197 | START **20:45:21Z, pid 6248**, hạn **02:35:51Z 27/11** (= hạn cứng đợt 198) — **ALIVE lúc đóng** (poll 21:49:27Z); khoảng không-watcher **15.423 s** |
| Replay #125 | **KHÔNG CÓ replay đầy đủ** — dpkg.log chỉ 2 dòng, đóng băng từ 20:35:41Z; /var/log/apt KHÔNG TỒN TẠI; watcher early-repair (h) thay thế (§1.3) |
| WebKit libs | **ĐÃ KHÔI PHỤC 21:28:43Z** — libwebkitgtk-6.0-4 2.52.6 + libjavascriptcoregtk-6.0-1, apt install exit 0; ldconfig CÓ cả hai; MiniBrowser wrapper smoke 20 s sống (exit 124), 0 lỗi loader; caveat F-197-T56-4 |
| Marker sống | CÒN, mtime 2026-11-20 11:39:47Z không đổi, md5 cb7102c0 — sống qua **75 reboot** (73 đã xác nhận #49–#121 + #122 + #123); 77 nếu #124 + #125 đều xác nhận |
| (A) lock | **120/120 PASS lần thứ 46** (tổng **5520/5520**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 77 → **78** |
| Lock | 822 cặp lúc kiểm cuối, 0 đang giữ, chênh **12 → 13** (acquire t8-196 16:18:09Z không release — §5), STALE-LOCK **12 → 13**, double-acquire GIỮ 7, 0 TIMEOUT mới; **#124 GIẾT HOLDER (27 → 0); #125 KHÔNG GIẾT (0 → 1)** |
| Prune 71 | **XÓA 4 FILE theo điều (a)** (queue 91 → 87; F-147-T6-1 chuỗi **VẪN 0 lần thứ 18**) |
| Vi phạm T4 | **0 chồng pha (b) đợt này** — monitor 5 s, 5 lần chạy, 0 kill; T4 attempt2 HỢP LỆ 21:34:44Z, poller đã thoát; lượt yên **#65 CÓ lượt hợp lệ** (attempt2 20/20, tickCost median 47,0 ms); live-check #16 thuộc T9-197 |

**Số hiệu boot #124/#125 CHƯA QUYẾT CUỐI — T01-197 xác minh (GAP §125; parent quyết (e) ở aggregate 197).** #125 = 8304fcd1 ứng viên (gap #124→#125 = 14.370 s; survey 20:41:28Z khớp T56). T56 KHÔNG phán (m) — thuộc T2-197; lặng #C + run 202/203 thuộc T7-197.

## §0. Trạng thái lúc mở (~20:40Z)

- **Boot lúc mở: `8304fcd1-6390-4f7d-a9fe-814a29dd100d`, btime 20:27:48Z** (epoch 1795724868; `uptime -s` khớp; journal idx 0 duy nhất, first 20:28:01Z = btime +13 s; `last` reboot 20:28 still running; `who -b` Nov 26 20:28; T01-197 survey 20:41:28Z). **Số hiệu #125 ứng viên** (T01-197 GAP §125 + quyết (e)-196 cho #124). Gap #124→#125 = **14.370 s (3h59m30s)**. **KHÔNG có reboot trong phiên T56.**
- **Replay #125 CHƯA CHẠY lúc mở:** dpkg.log **2 dòng** ("startup packages configure" 20:35:41Z, md5 c51257cc); /var/log/apt **KHÔNG TỒN TẠI**; lists 5; cache 0 .deb; GST hệ thống **0 file**; 0 proc apt/dpkg. **CÙNG CHỮ KÝ boot #60** (replay chạm mà không cài). Ledger os-intent KHÔNG ĐỔI (mtime 05:04:19Z, ts 1795661454, added 170).
- **Watcher-196 ĐÃ CHẾT lúc mở** (ps 0 process — kiểm 2 lần; §1.2). **T4-197 ĐÃ spawn** (poller thật 20:44Z, poll 45 s/lần, hạn cắt 22:30Z; gate CHƯA ĐẠT lúc mở). **T01-197 ĐANG GIỮ LOCK** (O8, pid 5056, port 5560, từ 20:43:41Z). **Latch:** `round-in-progress.md` không tồn tại lúc mở (đợt 197 chạy từ cron).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 26/11/2026)

**14:30:16Z** reboot #123 (bc09b26e). **14:41:56Z** watcher-196 START pid 7775. **14:41:58Z** FLAG-WRITTEN #123 (poll=0). **16:28:18Z** **reboot #124 (611a02f2)** — watcher-196 CHẾT theo reboot này (T01-196 xác nhận). **18:15:34.111Z** lặng **#C** bắt đầu (8.404 s). **20:27:48Z** **reboot #125 ứng viên (8304fcd1)** — TRONG lặng #C. **20:35:38.103Z** lặng #C kết thúc. **20:35:41Z** dpkg.log 2 dòng (đóng băng). **20:40Z** T56-197 mở; T4-197 mở; T01-197 survey 20:41:28Z. **20:43:41Z** T01-197 O8 giữ lock (tới ~20:50:33Z). **20:45:21Z** **watcher-197 START pid 6248**. **20:45:51Z** **EARLY-REPAIR TRIGGER** (boot_age 1.083 s, frozen 610 s, dpkg 2 dòng) → verify form-B exit=1 → --repair → **apt-get update TIMEOUT 1500 s (21:10:52Z)** → poll1 exit=1, **KHÔNG ghi cờ** ("cho T5 xử lý tay"). **21:19:39Z** T56 chạy tay `apt-get update` (exit 0, 478 s). **21:24:17Z** T56 chạy tay postboot `--repair` (**exit 0**). **21:24:31Z** verify độc lập **exit 0**. **21:28:14Z** **T56 VIẾT TAY POSTBOOT_PASS #125** (poll=1, repair-som-quyet-h). **21:28:43Z** **libwebkitgtk-6.0-4 cài xong** (exit 0). **21:30:48–21:34:18Z** T4 attempt2 (HỢP LỆ; poller thoát). **21:36:34–21:38:42Z** suite 6× 9/9. **21:39:11–21:46:54Z** harness 4 chunk, 120/120. **21:47:54Z** prune 71 xóa 4. **21:49:01Z** t8-197 acquire lock (sau khi T56 xong, 0 chồng lấn). Watcher-197 vẫn ALIVE (pid 6248, poll 21:49:27Z).

### §1.2. Watcher-196 — CHẾT theo reboot #124 (khác watcher-195)

- Watcher-196 (pid 7775, START 14:41:56Z trên #123) ALIVE lúc poll 15:03:14Z của T56-196; **CHẾT theo reboot #124 (16:28:18Z)** — T01-196 xác nhận KHÔNG còn process lúc survey #124. T56-197 kiểm ps 2 lần (~20:40Z, 20:45:16Z, mẫu `[r]eplay-watch`): **0 process watcher/replay-watch** — đủ điều kiện spawn watcher-197 theo quy tắc đứng (3).
- **Khoảng không-watcher 15.423 s (4h17m03s)** (16:28:18Z → 20:45:21Z) — bao **toàn bộ đời #124 sau 16:28:18Z (3h59m30s) + ~17m33s đầu #125**. Ngắn hơn khoảng đợt 196 (4h27m17s) nhưng vẫn bao trọn một boot (#124) — lần thứ năm liên tiếp. Điểm khác: watcher chết THEO reboot (như 193/194), không phải giữa boot như watcher-195. **Lặng #C** (18:15:34Z–20:35:38Z) kết thúc trước khi watcher-197 spawn 9m43s — watcher-197 không bị ảnh hưởng trực tiếp.

### §1.3. POSTBOOT_PASS #125 ứng viên — ĐÃ CÓ 21:28:14Z (repair-som-quyet-h, poll=1, VIẾT TAY — F-197-T56-3)

- **Watcher repair THẤT BẠI (đúng thiết kế, không phải lỗi vận hành):** EARLY-REPAIR trigger 20:45:51Z (boot+15' đã qua, frozen 610 s, 0 proc, dpkg 2 dòng < 100). Verify form-B exit=1 (đúng kỳ vọng — thiếu 5 lib + 10/11 gói apt). `--repair` chạy `apt-get update` (timeout 1500 s) — **TIMEOUT 21:10:52Z**: update treo 25 phút, 0 byte/60 s, 0% CPU, không socket, log dừng ở Get:53 từ ~20:59Z; mirror vẫn đáp curl 0,7 s (HTTP 200) — treo nội bộ ở method helper, không phải mất mạng. Poll1 exit=1 → watcher KHÔNG ghi cờ, đặt done=1 (guard repaired=1 chặn retry — backstop 60' cũng cần repaired=0 nên không kích hoạt).
- **T56 xử lý tay ("cho T5 xử lý tay" — đúng đường đã định trong script):** (1) `apt-get update` tay (timeout 600 s): **exit 0 lúc 21:19:39Z** (478 s; 2 InRelease cogentco failed qua proxy 198.19.0.1:3128 nhưng exit 0; lists 5 → 57). (2) postboot `--repair` tay: **exit 0 lúc 21:24:17Z** — install 10 gói thiếu xong, RE-CHECK wrapper/libs/GST/apt đều PASS, KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. (3) Verify độc lập check-only: **exit 0 lúc 21:24:31Z** (log md5 32abcd44 — khác log repair e5571f95 vì khác lần chạy). (4) **T56 viết cờ tay 21:28:14Z** (boot+60m26s) theo đúng định dạng write_flag của watcher (mode `repair-som-quyet-h`, poll=1, pbts = lúc hoàn tất --repair 21:24:17Z) + dòng GHI CHÚ ghi rõ tác giả tay trong file cờ; cờ cũ #123 sao lưu thành POSTBOOT_PASS-bc09b26e (md5 e94fad95 = bản gốc).
- **Profile cờ này YẾU HƠN #121/#123, NGANG #119:** repair (không phải replay đầy đủ — dpkg **777 dòng**, không phải 1.477) + GST **symlink → debroot** (269 file, ephemeral, vá K1) + poll=1. Nội dung PASS là đầy đủ (11/11 apt + 5/5 lib + GST isomp4/libav, verify độc lập exit 0) nhưng nguồn gốc là repair tay — parent quyết caveat ở §9(b).
- **T4-197 đã thấy cờ qua ĐƯỜNG CHÍNH:** poll #58 (21:30Z) ghi "T5 POSTBOOT_PASS (round197-t56/) + postboot_exit=0" → GATE MỞ, attempt2 chạy và HỢP LỆ. Cờ hoạt động đúng mục đích. **Replay #125: KHÔNG CÓ replay đầy đủ** (hệ thống không replay ledger; dpkg.log đóng băng 2 dòng; /var/log/apt không tồn tại). 777 dòng dpkg.log hiện tại đến từ repair (10 gói + deps), không phải replay 1.477 dòng như #121/#123 — để T10-197 không đếm nhầm thành replay dạng A.

### §1.4. POSTBOOT_PASS #124 — KHÔNG CÓ, KHÔNG VIẾT ĐƯỢC post-hoc (F-197-T56-7)

- #124 (611a02f2-7a7b-4dcb-9752-ae50a1fa1a48, btime 1795710498 = 16:28:18Z; T01-196 đo tươi 9 nguồn 16:29:48Z; gap 7.082 s; sống tới 20:27:48Z = 14.370 s). **0 file cờ nào nhắc 611a02f2** (chỉ có ghi chú trong NOTES T01-197 + GAP §125 — tiền lệ #118/#120/#122).
- **Vì sao không viết được:** #124 đã chết 20:27:48Z, TRƯỚC khi T56-197 mở phiên (~20:40Z). Viết cờ lúc này đòi hỏi các trường không còn kiểm chứng được: dpkg.log đã reset theo reboot 20:27:48Z; journal chỉ giữ idx 0 của boot hiện tại; /var/log/apt của #124 đã mất; không có lần chạy postboot check nào trên #124 khi nó còn sống (không watcher trong đời nó; T4-196 poller thoát 16:00:57Z). **Viết cờ không-verify là bịa đặt — tiền lệ #118/#120/#122. T56 KHÔNG làm.**
- **Bằng chứng về #124 (gián tiếp, KHÔNG đủ để viết cờ):** T01-196 survey tươi 9 nguồn 16:29:48Z (xem LIMITS T01-196); T8-196 harness Chromium 3/3 PASS 16:40:23–16:47:56Z trên #124 (VM hoạt động, không đo postboot); T01-197 NOTES: (m) #124 THÔ 1 requeue (DƯƠNG) — thuộc T2-197. **Tổng boot không cờ 30 → 31** (nếu parent chấp nhận). #124 là boot thứ ba liên tiếp không có cờ sau #120/#122 theo mẫu "mất cờ ở boot giữa hai đợt" — nay #125 ĐÃ CÓ cờ nên chuỗi mất cờ dừng ở 1.

## §2. Verify độc lập #125 (21:24:31Z) + GST SYMLINK + WebKit khôi phục

- **Verify độc lập: postboot exit=0** — wrapper PASS (đã vá K1); **5/5 lib PASS** (libevent/libEGL/libavif/libdw/libevdev); GST **269=269 PASS** (isomp4 + libav); **11/11 gói apt PASS** (kể cả libevdev2, Q7 đợt 114); KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. File: `t56-postboot-independent-8304fcd1.log` (md5 32abcd44).
- **GST #125 là SYMLINK → debroot** (`/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, tạo 20:45Z bởi --repair của watcher; kiểm KHÔNG trailing slash — xem F-197-T56-2). Khác #121/#123 (thư mục thật), giống #119 (symlink, ephemeral).
- **WebKit libs — ĐÃ KHÔI PHỤC (lệnh parent (a)(vi)-196):** `apt-get install -y libwebkitgtk-6.0-4` **exit 0 lúc 21:28:43Z** (~19 s; candidate 2.52.6-0ubuntu0.24.04.2; kéo theo libjavascriptcoregtk-6.0-1 2.52.6 + libgtk-4-1). ldconfig CÓ `libwebkitgtk-6.0.so.4` + `libjavascriptcoregtk-6.0.so.1` (cả hai → /lib/x86_64-linux-gnu/). **Không có trong ledger** (grep 0) và **không trong danh sách NEED của postboot-check** — watcher --repair không thể khôi phục nó; T56 cài riêng SAU khi watcher repair xong (tránh tranh khóa apt), theo đúng lệnh parent. Log: `/tmp/t56-webkit-install-197.log` (đã copy vào round197-t56).
- **Kiểm chứng WebKit chạy được:** (1) ldd binary MiniBrowser GTK: libwebkitgtk/libjavascriptcoregtk đều → **/lib/x86_64-linux-gnu/ (hệ thống)** khi LD_LIBRARY_PATH đặt /lib trước; 0 "not found" khi đủ sys/lib. (2) MiniBrowser qua wrapper chạy **20 s sống** (exit 124 = timeout kill, không crash; 0 lỗi loader) trên Xvfb :193 riêng (đã dọn). (3) T01-197 O8 WebKit attempt2 **PASS 21/21** trên #125 (20:48:30Z, trước khi T56 cài lib — bundled lib qua wrapper). **Kết luận: WebKit ĐÃ CHẠY ĐƯỢC trên #125; harness 197 KHÔNG còn Chromium-only** (T8-197 xác nhận bằng harness; §9(h)).
- **Caveat F-197-T56-4:** lib hệ thống 2.52.6 **thiếu symbol** `webkit_web_context_set_network_session_for_automation` (bundled lib CÓ — nm -D 0 vs 1); chạy binary trực tiếp với lib hệ thống → symbol lookup error exit 127. Harness dùng Playwright wrapper → bundled lib nên KHÔNG chặn; lib hệ thống chỉ phục vụ selfcheck của harness + kiểm lib của O8. Cần WebKitGTK mới hơn (không có trong repo Ubuntu 24.04) nếu harness tương lai chạy binary trực tiếp.

## §3. Cờ cũ — md5 KHÔNG ĐỔI (kiểm lại đợt 197)

| Cờ | md5 lúc kiểm cuối |
|---|---|
| #125 (8304fcd1, MỚI — viết tay) | 48fec087 |
| #123 (bc09b26e, backup ở round197-t56/) | e94fad95 (= gốc round196-t56/) |
| #121 (8c4aa907, gốc round195-t56/) | 28847b1e (= bản gốc) |
| #119 (55c9e0b7, gốc round194-t56/) | 863a6035 (= bản gốc) |

## §4. Ledger KHÔNG ĐỔI + T01-197 O8 + lặng #C

- **Ledger — VẪN 1 dòng, NỘI DUNG KHÔNG ĐỔI:** `/var/lib/hatch/os-intent/ledger.jsonl` mtime vẫn **05:04:19Z**, ts **1795661454** (repair #119, compacted=true), **added 170 gói**. **KHÔNG có dòng nào cho replay #125** (không có replay; repair tay không chạm ledger — như #121/#123).
- **T01-197 O8 (ghi nhận — verdict thuộc T01-197):** survey 20:41:28Z (boot 8304fcd1, btime 1795724868, journal first 20:28:01Z = btime +13 s, wtmp, who — khớp T56). O8 20:43:41–20:50:33Z: WebKit attempt1 FAIL (exit=2, timeout chờ project mẫu load — 0 lỗi exit 127), attempt2 **PASS 21/21**, Chromium PASS 21/21; cả 3 bộ CÙNG CÂY (preview.tsx af6c3cc7, media.ts ac89aeb2 — khác đợt 196). O8 chạy TRONG LÚC T4 chỉ poll — 0 chồng lấn. **Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây" KHÔNG ĐẠT** (chỉ 2/3 bộ pass — attempt1 fail vì load timeout, không phải assertion S1; xem F-197-T01-3).
- **Lặng scheduler #C (T01-197 F-197-T01-2 — T56 chỉ ghi nhận, phân loại thuộc T7-197 + parent):** **8.404 s (18:15:34.111Z → 20:35:38.103Z) bao trùm btime #125** — bắt đầu trước reboot 7.934 s; hồi phục sau reboot 470 s. 0 event scheduler BẤT KỲ; event ID liên tục (11413 → 11414, 0 event mất); feed-pulse trễ 3.224 s, heartbeat trễ 888 s, doctor 19:00Z + 20:00Z VẮNG. **8.404 s là lớn thứ hai trong họ — chỉ kém kỷ lục 8.406 s đợt 179 đúng 2 ms** (trên #B 6.826 s, #A 4.974 s, OUTAGE #3 5.739 s, OUTAGE #2 4.807 s). Cùng chữ ký #A/#B. **Tổng lặng 26/11 nay = 28.444 s (7h54m04s)** nếu tính cả #C.

## §5. Lock health (T6) — #124 GIẾT HOLDER (chuỗi 27 → 0); #125 KHÔNG GIẾT (0 → 1)

### §5.1. Nhất quán log lock: 822 cặp lúc kiểm cuối, 0 đang giữ, chênh 12 → 13

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 192); đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T56-196 kiểm cuối | T56-197 kiểm cuối | Δ từ T56-196 |
|---|---|---|---|
| Tổng dòng (cleaned / raw) | 2874 / 2880 | **2914 / 2918** | +40 / +38 |
| TICKET / ACQUIRED / RELEASED | 834 / 823 / 811 | **846 / 835 / 822** | +12 / +12 / +11 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 383 / 12 / 1 / 10 | **387 / 13 / 1 / 10** | +4 / +1 |
| Cặp ACQUIRED→RELEASED | 811 | **822** | +11 |
| Đang giữ / Chênh ACQ−REL | 0 / 12 | **0 / 13** | +1 |
| Double-acquire | 7 | **7** | 0 mới |

- **+40 dòng kể từ T56-196 kiểm cuối (~15:03Z):** t4-196 ×9 (3 chu kỳ acquire/release 15:40–16:00Z — khép kín) + t8-196 ×18 (16:16–16:47Z: 5 TICKET, 5 ACQUIRED, 4 RELEASED, 3 COOLDOWN, 1 STALE-LOCK) + t01-197 ×3 (20:43:41Z–~20:50:33Z — khép kín) + t4-197 ×6 (attempt1 + attempt2, 21:26:51–21:34:18Z — khép kín) + t8-197 ×4 (21:49:01Z–21:50:22Z hold 81 s — khép kín). 9+18+3+6+4 = 40 ✓. (Raw +38: cleaned tăng NHIỀU hơn raw 2 dòng — xem F-197-T56-8. Số cleaned là chuẩn theo script.)
- **Trong phiên T56-197 (~20:40Z–21:50Z): +11 dòng** (t01-197 RELEASED ×1 + t4-197 ×6 + t8-197 ×4). **0 dòng nào của T56 trên log lock thật** (suite/harness chỉ chạy trên /tmp).
- **Chênh 12 → 13:** acquire t8-196 16:18:09Z (port 5490) KHÔNG BAO GIỜ release — chỉ được tuyên STALE-LOCK 16:40:23Z (xem §5.2). **STALE-LOCK 12 → 13** (cùng sự kiện). **Double-acquire GIỮ 7 — 0 ca mới**; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50:28Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE, trừ 1 acquire treo đã xử lý bằng STALE-LOCK.** Caveat: **#68 GIẾT HOLDER t4**; **#95 CÓ GIẾT HOLDER** (t8-round179); **#124 GIẾT HOLDER (mới — §5.2)**; **#96–#123 KHÔNG giết** (verdict đợt 186–196; #106 không tính; #122/#123 parent đã xác nhận).

### §5.2. #124 — GIẾT HOLDER (chuỗi 27 → 0) — F-197-T56-5

#124 (btime 16:28:18Z, `611a02f2-7a7b-4dcb-9752-ae50a1fa1a48`, T01-196 đo tươi 9 nguồn): t8-round196 **ACQUIRED 16:18:09Z** (port 5490, wait 15 s) — **KHÔNG có RELEASED nào sau đó**; dòng tiếp theo của owner này là **STALE-LOCK 16:40:23Z** ("owner pid 98349 chết + không vite trên cổng 5490 + curl 000") rồi re-acquire. Btime #124 (16:28:18Z) nằm GIỮA acquire (16:18:09Z) và stale-declare (16:40:23Z) — holder (vite pid 98349, port 5490) còn sống lúc acquire, đã chết lúc tuyên stale, và reboot #124 (cell mới — F-196-T8-1) là sự kiện giết duy nhất trong cửa sổ đó. T8-196 tự ghi: **"CELL MỚI #124 GIẾT HARNESS GIỮA PHA"**. **Verdict: #124 GIẾT HOLDER — chuỗi 27 → 0** — lần giết holder đầu tiên kể từ #95 (29 boot trước), chuỗi dài nhất từng có (27) đã đứt. T56-196/T10-196 chưa phán verdict này (sự kiện 16:40:23Z xảy ra sau khi T56-196 đóng 15:03Z) — T56-197 phán ở đây theo miền lock health.

### §5.3. #125 ứng viên — KHÔNG GIẾT HOLDER (chuỗi 0 → 1 nếu xác nhận)

#125 ứng viên (btime 20:27:48Z, `8304fcd1-6390-4f7d-a9fe-814a29dd100d`, T01-197 survey 20:41:28Z + T56 xác minh): dòng lock cuối trước btime là t8-round196 RELEASED 16:47:56Z — **TRỐNG 13.745 s (3h49m05s)**; dòng đầu tiên sau btime là t01-round197 TICKET 20:43:41Z; 0 STALE-LOCK mới trong cửa sổ. Khoảng trống gấp ~6.872 lần δ 2 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 1 reboot** (tiền lệ (p)-196) nếu parent xác nhận #125 = 8304fcd1. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu #124/#125 theo GAP §125 (T01-197) + quyết (e)-196. **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục 16:47:56Z–20:43:41Z nên MỌI boot trong cửa sổ đều không thể giết holder.

### §5.4. Quét zombie + X11 + ss (2 snapshot: giữa ~20:50Z / cuối ~21:48Z)

| Thời điểm | Zombie | Socket X11 | Xvfb | ss listener |
|---|---|---|---|---|
| Giữa (~20:50Z) | 0 | 0 | 0 | 0 |
| Cuối (~21:48Z) | 0 | **2 (X194, X197 — SÓT)** | **0** | 0 |

- **0 zombie thật ở cả 2 lần** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56 ngoài watcher repair + cài webkit theo lệnh. T56 không khởi động Xvfb/vite nào (Xvfb :193 của smoke test đã dọn), không kill process nào ngoài Xvfb :193 của chính mình. **X194/X197 là socket SÓT** (server đã thoát, socket còn — của T01-197 O8 / T4-197). **Listener 0.0.0.0:8765 VẪN MẤT** (như đợt 193–196 — xem F-193-T56-7). **T01-197 O8 giữ lock 20:43:41–~20:50:33Z** (T56 chờ, 0 chồng lấn — F-197-T56-6).

## §6. (A) — 120/120 PASS (lần thứ 46) + suite 9/9 × 6 + MONITOR 5 s, 0 KILL

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7 — đợt này KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — KHÔNG TÁI TẠO ĐƯỢC cách tính từ T6-191 (xem F-193-T56-6; không chặn verdict). File khối đã trích `t7-block-a197.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–196. Poll script `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` — giữ số đợt 196 (xem §10).
- **PHẠM VI HẸP — đã tuân thủ:** T56 chỉ chạy prune (§7) + suite/harness trên /tmp — 0 dòng nào của T56 trên log lock thật trong phiên (§5.1: +11 dòng đều của t01-197/t4-197/t8-197).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (21:36:34–21:38:42Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (chạy khi lock TRỐNG sau khi T4 release 21:34:18Z, trước khi t8-197 acquire 21:49:01Z; log lock thật không đổi trước/sau suite; monitor 5 s bọc suite: 0 kill).
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), chạy N=120 lần với churn bơm vào (1 process `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s — giống hệt T6-151–T6-196 §6.2). Chỉ chạy trên /tmp, không đụng lock thật, không đụng poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn: min 515 ms, max 3458 ms, trung bình 1733,21 ms (đúng 120 dòng — không có lần chạy bị kill dở đợt này).
- **KIỂM GATE — kiểm trước mỗi chunk + monitor TRONG chunk chu kỳ 5 s:** monitor nền `t7-gate-monitor-197.sh` chạy song song mỗi chunk (và cả suite), kiểm mỗi 5 s: (1) poll-t4.log có "CUA YEN MO"/GATE_OPEN=1 không, (2) lock log có **ACQUIRED MỚI BẤT KỲ OWNER NÀO** không — kill toàn bộ process group của chunk ngay khi phát hiện. Suite 6/6 + chunk 1–4: 30/30 × 4 (21:36:34–21:46:54Z) — **tổng 120/120 PASS, 0 lần kill cả 5 lần chạy có monitor (suite + 4 chunk).**
- **T4-197 (ghi nhận — verdict thuộc T4-197 + parent):** attempt1 KHÔNG hợp lệ; **attempt2 HỢP LỆ 21:34:44Z (20/20 + lớp B 5/5 + tickCost median 47,0 ms) — lượt yên #65 CÓ lượt hợp lệ**; poller ĐÃ THOÁT sau attempt2 — **T4 không còn mở attempt đợt này**. Suite/harness của T56 chạy SAU khi poller thoát (21:36:34Z+) — 0 chồng lấn với pha (b) theo thiết kế, monitor vẫn bọc đề phòng. Cây preview.tsx lúc T4 = af6c3cc7 (khớp O8 T01).
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ: 13/30 (43%); **(A) đợt 151–197: 120/120 mỗi đợt (100%)** — tỉ lệ dưới churn bơm vào (stress). **Kết luận: (A) VẪN XANH sau 46 đợt** (tổng 5520/5520). **Chuỗi:** "xanh kép" 45 → **46**; suite xanh: 77 → **78**.

## §7. Prune cooldown lần 71 — XÓA 4 FILE theo điều (a)

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100 file; (c) không xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào log; (e) chỉ chạy khi lock đang trống. Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h (8 ngày)** — bảo thủ hơn chữ luật 24h. Queue đợt này ở `hidden_files/vite.lock.queue/` (không phải hidden_files/ gốc — xem F-197-T56-8).

- Trước prune (~21:47Z): **91 file / 1274 byte** (90 sau prune 70 + 1 file mới `cooldown-t8-round196`); ứng viên (`find -mtime +7`): **3 file**. Prune lúc 21:47:54Z, ngay sau khi kiểm lock trống (dòng cuối RELEASED 21:34:18Z t4-197; t8-197 acquire 21:49:01Z, sau prune) — **KHÔNG PHẢI CHỜ LOCK đợt này**.
- Điều (a) XÓA 3 file (đều ≥192h, đều qua mốc 168h ≥25h, không vi phạm (c)): **`cooldown-t8-round139`** (197,9h), **`cooldown-t10-round139`** (196,9h), **`cooldown-t10-round140`** (194,0h). `prune-deleted.txt` ghi đủ tên. `cooldown-t8-round141` (192,0h lúc đó) CHƯA tới mốc — KHÔNG xóa ở lượt này.
- **Bổ sung cùng lượt (~21:48Z):** `cooldown-t8-round141` **vượt mốc 192h trong lúc prune** (192,4h lúc kiểm lại) → **XÓA THÊM 1 file** theo đúng điều (a) (đã qua mốc 168h ~24,4h; không vi phạm (c)).
- **Kết quả prune lần 71: 4 file đã xóa.** Sau prune: **87 file / 1218 byte** (91 − 4 = 87 ✓; 1274 − 56 = 1218 ✓, 4 × 14 B). Điều (b) KHÔNG kích hoạt (87 < 100). Tầng tuổi: **≥192h: 3 → 0; ≥168h: 17 → 14; ≥72h: 58 → 55; ≥48h: 71 → 68**. **KHÔNG mất file nào không giải thích được.**
- **F-147-T6-1 — CHUỖI VẪN 0, lần thứ 18 liên tiếp sau khi đứt tại 179:** cả 4 file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~24–30h. Không đổi luật (luật thuộc parent).

## §8. F-197-T56-n (sai số / ghi nhận của T56-197)

- **F-197-T56-1 — Monitor-196 xem nhầm file T4.** `T4LOG=.../round195-t4/poll-t4.log` (file chết, 59 dòng) thay vì `round196-t4/poll-t4.log` (40.443 B) — nửa phát hiện "cửa yên mở" của monitor 196 là VÔ NGHĨA; nửa ACQUIRED vẫn đúng (base 825). Không gây hại đợt 196 (gate đỏ suốt, 0 attempt). Monitor-197 đã sửa: `T4LOG=.../round197-t4-poll.log` (base_t4lines=9 = log thật).
- **F-197-T56-2 — Lỗi kiểm tra symlink của chính T56 (đã bắt trước khi viết cờ).** `readlink .../gstreamer-1.0/` CÓ trailing slash → báo "thư mục thật" SAI; kiểm đúng là KHÔNG trailing slash (bài học F-194-T56-2). Đã sửa bằng `ls -la` (symlink, tạo 20:45Z) → cờ ghi đúng profile repair+symlink.
- **F-197-T56-3 — Watcher --repair THẤT BẠI vì apt-get update treo.** Update treo 25 phút tới timeout 1500 s (0 byte/60 s, 0% CPU, không socket, log dừng Get:53); curl tới cả hai mirror đáp 0,7 s HTTP 200 — treo nội bộ ở method helper. Watcher không retry được (guard repaired=1 + done=1) — đường xử lý tay là đúng thiết kế. Brief sau: khi watcher repair thất bại vì update timeout, T56 được phép chạy tay update + --repair rồi viết cờ tay theo đúng định dạng.
- **F-197-T56-4 — Lib hệ thống 2.52.6 thiếu 1 symbol** (`webkit_web_context_set_network_session_for_automation`; nm -D 0 vs bundled 1). Chạy binary trực tiếp → symbol lookup error exit 127; harness dùng wrapper → bundled lib nên không chặn. Không sửa (không có WebKitGTK mới hơn trong repo Ubuntu 24.04).
- **F-197-T56-5 — #124 GIẾT HOLDER, chuỗi 27 → 0** (acquire t8-196 16:18:09Z không release, btime #124 nằm giữa acquire và STALE-LOCK 16:40:23Z). Lần giết holder đầu tiên kể từ #95.
- **F-197-T56-6 — T01-197 O8 giữ lock 20:43:41–~20:50:33Z; T56 chờ, 0 chồng lấn.** Cửa làm việc của T56 mở muộn ~10 phút vì O8 chiếm lock; T4 gate đỏ suốt lúc đó nên không mất cơ hội đo nào.
- **F-197-T56-7 — POSTBOOT_PASS #124 KHÔNG CÓ** (#124 chết trước khi T56 mở phiên; không viết bù được — tiền lệ #118/#120/#122). Tổng boot không cờ 30 → 31 nếu parent chấp nhận.
- **F-197-T56-8 — Số liệu đếm cần đính chính:** (a) Header watcher-196 ghi "17:35:51Z = hạn cứng đợt 197" là SAI — đó là hạn cứng đợt 196; hạn cứng đợt 197 là 23:35:51Z 26/11. Watcher-197 END 02:35:51Z 27/11 (= hạn cứng đợt 198). (b) Log lock: raw 2918 vs cleaned 2914 (chênh 4, không phải 6) — 2 dòng chênh thêm là 2 dòng t8-197 (21:49:01Z) chưa có lúc chạy analyze-log lần đầu 21:47Z; số cleaned là chuẩn theo script. (c) Queue cooldown nằm ở `vite.lock.queue/`, không phải hidden_files/ gốc — ghi rõ để đợt sau không đếm nhầm.

## §9. Đề xuất cho parent (quyết ở aggregate 197)

**(a) Chấp nhận verdict đợt 197 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #125 ứng viên đã có (manual update + repair exit 0, verify độc lập exit 0, GST symlink 269), replay #125 KHÔNG CÓ (repair thay thế), WebKit libs đã khôi phục (smoke chạy được), (A) 120/120 lần 46, holder #124 GIẾT (27 → 0) + #125 KHÔNG GIẾT (0 → 1), prune 71 xóa 4 file, hướng (3) lần 43 — với caveat F-197-T56-3 + F-197-T56-4 + F-197-T56-7.

**(b) Cờ #125 ứng viên (repair-som-quyet-h, poll=1, GST symlink, viết tay) — CÂU HỎI QUYẾT:** manual update exit 0 (21:19:39Z) → postboot --repair exit 0 (21:24:17Z) → verify độc lập exit 0 (21:24:31Z) → cờ viết tay 21:28:14Z; 11/11 apt + 5/5 lib + GST 269=269 SYMLINK → debroot; dpkg 777 (repair, không phải replay 1.477). **Parent chọn 1 trong 2:** (b1) Chấp nhận **CÓ caveat** (repair thay replay + GST symlink + viết tay — T56 đề xuất (b1)); (b2) Chấp nhận KHÔNG caveat.

**(c) Xác nhận 8304fcd1 = #125 VÀ 611a02f2 = #124?** (btime #125 20:27:48Z, epoch 1795724868, gap 14.370 s; btime #124 16:28:18Z, epoch 1795710498, gap 7.082 s; T01-197 GAP §125; (m) #124/#125 thuộc T2-197.) **(c2) #124 KHÔNG CÓ cờ — tổng boot không cờ 30 → 31?** (#124 không watcher, không verify được post-hoc — §1.4; T56 đề xuất chấp nhận KHÔNG CÓ cờ (c1), như #118/#120/#122.)

**(d) #124 GIẾT HOLDER — chuỗi 27 → 0; #125 KHÔNG GIẾT HOLDER — chuỗi 0 → 1** (trống 13.745 s; §5.2/§5.3). **(e) (A) 120/120 lần thứ 46 (tổng 5520/5520) + suite 9/9 × 6 (chuỗi suite xanh 78) — parent ghi nhận?**

**(f) Prune lần 71: điều (a) xóa 4 file, queue 91 → 87; F-147-T6-1 chuỗi VẪN 0 lần thứ 18. (g) Hướng (3) VẪN ĐỨNG lần thứ 43 — parent ghi nhận cả hai?**

**(h) WebKit libs ĐÃ KHÔI PHỤC trên #125 (libwebkitgtk-6.0-4 2.52.6 + libjavascriptcoregtk-6.0-1, smoke chạy được) — harness 197 KHÔNG còn Chromium-only?** (T8-197 xác nhận bằng harness; caveat F-197-T56-4.) **(i) Watcher-197 vẫn chạy trên #125** (pid 6248, hạn 02:35:51Z 27/11) — **T56-198 PHẢI kiểm tra ps trước khi spawn watcher-198** (§1.2); nếu watcher-197 còn sống thì KHÔNG spawn mới.

## §10. Sai số của chính T56-197 (tự kiểm)

- **F-197-T56-1..8** — xem §8.
- **§2/F-197-T56-2** — readlink CÓ trailing slash → kết luận sai "thư mục thật"; đã sửa bằng `ls -la` trước khi viết cờ; cờ ghi đúng profile symlink.
- **§1.3** — T56 không kịp snapshot zombie/X11 lúc mở (ưu tiên spawn watcher + verify postboot); chỉ có 2 snapshot (giữa/cuối); 0 zombie cả 2 lần; X11 giữa 0, cuối 2 socket sót.
- **md5 cờ cũ #117/#115/#114/#112** không kiểm lại đợt này; md5 poll script / lock v2 / lock v1 giữ số đợt 196; các cờ #125/#123/#121/#119 đã kiểm lại, đều khớp.
- **(m) #124/#125** thuộc T2-197; **lặng #C + run 202/203** thuộc T7-197; **RAM/ENOSPC #124/#125** thuộc T9-197; inotify giữ số T6-187: 63.747.
- **T8-197 CHƯA ĐÓNG** lúc T56 đóng (mới acquire 21:49:01Z, release 21:50:22Z) — 84l10/86n2-P1 chưa xác nhận đợt này.
- **T4-197 attempt1 KHÔNG hợp lệ**; attempt2 HỢP LỆ — lượt yên #65 thuộc T4-197/T10.

**Số liệu chính thức lấy từ log watcher-197 + log trực tiếp (verify độc lập/manual repair) + dpkg/history/term.log của #125 + ledger os-intent + log lock thật + queue trên đĩa + poll log T4-197 + T01-197 survey 20:41:28Z + đối chiếu aggregate 196 (§14.2, BẢN PARENT-ĐÃ-ĐÍNH-CHÍNH) + LIMITS T56-196 + LIMITS T01-197.**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND197_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round197-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round197-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push: đợt 191 + đợt 192 + đợt 193 + đợt 194 + đợt 195 + đợt 196 = 71/239/174/154 (theo MEMORY; T10-197 đếm lại bằng dedup toàn cục).
- **LIMITS này ≤ 37.768 B** (trần push; kiểm `wc -c` trước khi đóng).

## Phụ lục A — Trích số liệu T56-197 (20:40Z – 21:50Z 26/11; số liệu đã có trong các mục chính)

```
#123=bc09b26e btime 1795703416=14:30:16Z; CO co 14:41:58Z (replay-day-du, poll=0)
#124=611a02f2 btime 1795710498=16:28:18Z; gap 7082 s; song toi 20:27:48Z (14370 s); KHONG CO co (§1.4); tong khong co 30->31; GIET HOLDER (§5.2) — chuoi 27->0
#125=8304fcd1 btime 1795724868=20:27:48Z; gap 14370 s; ung vien (GAP §125)
watcher-196: START 14:41:56Z pid=7775 end=17:35:51Z (han cung dot 196); CHET theo reboot #124; ps T56 kiem 20:40Z+20:45:16Z: 0 process
watcher-197: START 20:45:21Z pid=6248 end=02:35:51Z 27/11 (han cung dot 198); EARLY-REPAIR 20:45:51Z; --repair FAIL: update TIMEOUT 1500s (21:10:52Z); poll1 exit=1 KHONG ghi co; T56 manual update exit=0 (21:19:39Z) + manual --repair exit=0 (21:24:17Z); ALIVE luc dong (poll 21:49:27Z); khoang khong-watcher 15423 s
POSTBOOT_PASS #125: CO (VIET TAY) md5=48fec087; repair-som-quyet-h poll=1; dpkg 777 md5=c2ce0cfb; cache 108->121; lists 75; GST 269 SYMLINK->debroot; verify doc lap exit=0 (21:24:31Z); co viet 21:28:14Z (boot+60m26s); replay #125 KHONG CO; ledger 1 dong ts=1795661454 added=170 (KHONG DOI)
WebKit: libwebkitgtk-6.0-4 2.52.6 + libjavascriptcoregtk-6.0-1 2.52.6 cai 21:28:43Z exit=0; ldconfig CO ca hai; MiniBrowser wrapper smoke 20 s song (exit 124); caveat: system lib thieu symbol (nm -D 0 vs bundled 1)
Co cu KHONG DOI: #123 e94fad95 / #121 28847b1e / #119 863a6035; marker md5 cb7102c0 — song qua 75 reboot, 77 neu #124+#125 deu xac nhan
Lock kiem cuoi: cleaned 2914; ACQUIRED 835; RELEASED 822; cap 822; chenh 13; TICKET 846; COOLDOWN 387; STALE-LOCK 13; STALE-TICKET 1; TIMEOUT 10; double-acquire 7; held 0; delta +40 dong (trong phien +11)
(A): suite a89c0676; block dc973443; suite 6x 9/9 rc=0; harness 120/120 B1=1 B2=0; delay 515/3458/1733.21 ms; monitor 5 s: 5 MONITOR-START, 0 kill; T4 attempt2 HOP LE 21:34:44Z (luot yen #65 CO luot hop le); poller DA THOAT
Prune 71: truoc 91 file/1274 B; xoa 4 (cooldown-t8-round139, cooldown-t10-round139, cooldown-t10-round140, cooldown-t8-round141); sau 87 file/1218 B; Holder: #124 GIET chuoi 27->0; #125 KHONG GIET (trong 13745 s) chuoi 0->1; Lang #C 8.404 s bao trum btime #125; tong lang 26/11 = 28.444 s; X11: 0 zombie, 2 socket sot; :8765 VAN MAT
```
