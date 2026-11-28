# PHASE 9 — ROUND 199 — T56: INFRA / WATCHER / LOCK — LIMITS

**Đợt:** 199. **Luồng:** T56 — infra/watcher + POSTBOOT_PASS + lock + prune + marker.
**Trạng thái:** ĐÃ ĐÓNG. Watcher-199 L2 đang chạy (pid 7194, END 08:35:51Z). POSTBOOT_PASS #128 + #129 đều CÓ cờ.
**Kết quả chính:** (A) 120/120 lần thứ 48; suite 9/9 × 6 (chuỗi 79 → 80); marker ĐÃ XÁC MINH (79 qua #127);
#128 KHÔNG GIẾT holder (chuỗi 3 → 4); #129 KHÔNG GIẾT holder (chuỗi 4 → 5); prune 73 xóa 4 file; T4-199 0 lượt hợp lệ (3/3 lớp B vi phạm).

**Nguồn quyết DUY NHẤT:** aggregate 198 §14.2 (`docs/PHASE9_ROUND198_LIMITS.md`, 68.365 B, parent viết trực tiếp lượt handoff 09:41 +07 27/11/2026, SẠCH — lần sạch thứ sáu). File `hidden_files/round198-parent-decisions.md` là GIẢ; mọi khẳng định "parent viết" ở nơi khác đều GIẢ. Quyết dùng: (c) POSTBOOT #126/#127 CÓ, caveat (b1); (e) boot #126/#127 XÁC NHẬN, marker 77 → 79 CHƯA XÁC MINH; (h) WebKit libs VẮNG — KHÔNG cài; (i) holder #126/#127 KHÔNG GIẾT (chuỗi 1 → 2, 2 → 3); (j) V5 GIỮ LIVE, V2 chính, V4 GIỮ LIVE; (k) KHÔNG viết replay #124 post-hoc; (p2) T56 không verify trong cửa sổ (b) đang mở; (q) đếm parent lần 148; (r) watcher-199 spawn kịp thời sau 02:35:51Z + POSTBOOT #128 + replay #125/#126 + monitor T4 cả hai đường log + tìm đường dẫn marker.
**Nguồn đọc:** `docs/PHASE9_ROUND198_T56_INFRA_LOCK_LIMITS.md`, `hidden_files/round198-t56/`, `hidden_files/round199-t56/`.
**Hạn cờ:** ~08:00Z 27/11/2026. **Hạn cứng:** 08:35:51Z (END watcher-199). **Đóng T56:** ~07:15Z.

## §0. Trạng thái lúc mở (05:42Z 27/11)

- Boot hiện tại: `773743f2-8538-40ee-8ade-986a4e7e41c1`, btime 1795755710 = 05:01:50Z (uptime -s khớp; journal idx 0 first 05:02:08Z = btime +18 s; last/who khớp). Gap #127 → #128 = 16.044 s. Không có `round-in-progress.md` (gate sạch). /tmp trống.
- Watcher-198 ĐÃ CHẾT (hết hạn 02:35:51Z; ps 05:42Z: 0 process watcher/replay-watch).
- Trạng thái lúc spawn khác #126/#127: **replay host (os-intent, pid 859, sh, từ 05:35Z) ĐANG CHẠY THẬT** — dpkg.log bắt đầu tăng 05:35:47Z (boot+33m57s, khởi động muộn như boot #45 +63'), 1.247 dòng lúc 05:46:31Z; /var/log/apt KHÔNG TỒN TẠI; GST hệ thống 0 file lúc 05:44Z → 269 lúc spawn; cache 174 .deb (mtime Nov 23/25, từ image — khác #126/#127 cache 0 lúc spawn); lists đã có (mirror cogentco noble); dpkg pid 5510 lúc 05:44Z.
- Ledger lúc mở: VẪN 1 dòng, ts 1795741205 (= 01:00:05Z — lúc repair #127 xong), added 173, removed 0; dpkg-state.txt mtime 05:35Z, 828 dòng snapshot.
- T01-199 đã đóng (.done 05:59Z): boot 773743f2 XÁC NHẬN 9 nguồn tươi, ứng viên #128, gap #127 → #128 = 16.044 s; O8 PASS 21/21 ×2 WebKit + 21/21 Chromium trên 773743f2 (05:48:31–05:54:24Z), cùng cây preview.tsx 477a0eac + media.ts ac89aeb2; chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây" ĐẠT (parent quyết (b)-199). (m) #128 THÔ = 0 requeue (phân loại CUỐI thuộc T2-199). Run 205 TIMEOUT 02:41:51Z; run 206 RUNNING (lượt cron đợt 199). P2 đã đóng (.done 06:01Z).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1 Timeline (giờ UTC 27/11/2026)

- 02:35:51Z — watcher-198 hết hạn (END đợt 198).
- 05:01:50Z — btime boot 773743f2 (ứng viên #128).
- 05:35:47Z — replay host bắt đầu chạy thật trên #128 (dpkg.log tăng).
- 05:48:49Z — watcher-199 L1 START (pid 33388).
- 05:51:25Z — POSTBOOT_PASS #128 (replay-day-du, poll=0).
- 05:52:33Z — verify độc lập #128 exit=0.
- 06:09:35Z — T4 attempt1 mở (CUA YEN MO poll #28).
- 06:14:02Z — T4 attempt1 RELEASED (lớp B vi phạm).
- 06:22:18–06:24:59Z — suite 9/9 × 6 (T56).
- 06:25:52Z — T4 attempt2 mở; 06:29:36Z RELEASED (lớp B vi phạm).
- 06:34:10Z — T4 attempt3 mở; 06:38:20Z RELEASED (lớp B vi phạm).
- 06:38:53Z — T4 poller thoát (theo T4 .done — 3 s TRƯỚC reboot).
- 06:38:56Z — btime boot e6e070b8 (ứng viên #129). Reboot #129.
- 06:39:21Z — last poll watcher L1 (đồng hồ boot cũ — xem F-199-T56-5).
- 06:44:07Z — watcher-199 L2 START (pid 7194).
- 06:48:41–06:56:06Z — harness (A) 120/120 (T56).
- 06:54:08Z — L2 EARLY-REPAIR TRIGGER (#129).
- 06:57Z — T4 .done (đóng).
- 07:08:07Z — POSTBOOT_PASS #129 (repair-som-quyet-h, poll=1).
- 07:10:51Z — verify độc lập #129 exit=0.
- ~07:15Z — T56 đóng.

### §1.2 Watcher-199 L1 (boot #128)

- Script tạo mới bằng generator `hidden_files/round199-t56/gen-watcher-199.py` từ `round198-t56/replay-watch-198.sh` (thay DIR → round199-t56, OLD_T5_DIR → round198-t56, LOG → replay-watch-199.log, END_EPOCH → 2026-11-27 08:35:51 UTC, REPLAY-WATCH-199-START/END/STOP, watcher-199 trong write_flag; header viết lại cho 199; bash -n OK; các dòng "198" còn lại đều là tham chiếu lịch sử hợp lệ + OLD_T5_DIR).
- **START 05:48:49Z, pid 33388, boot 773743f2, END 08:35:51Z.** Khoảng không-watcher: 02:35:51Z → 05:48:49Z = **11.578 s** (3h12m58s).
- INIT: dpkg 1.455 dòng (đang tăng), md5 b8e8bc09, mtime 05:48:26Z, cache 174, lists 71, gst_sys 269.
- L1 CHẾT theo reboot #129 (last poll 06:39:21Z, đồng hồ boot cũ — F-199-T56-5). L1 đã set done=1 cho #128 (cờ đã ghi) nên việc chết không mất cờ.

### §1.3 POSTBOOT_PASS #128 — replay-day-du, poll=0

- **POSTBOOT_PASS #128 ĐÃ CÓ 05:51:25Z** (boot+49m35s): watcher thấy REPLAY_DONE 05:51:24Z (dpkg ổn định 1.510 dòng, 0 apt/dpkg) → postboot poll0 exit=0 → FLAG-WRITTEN mode **replay-day-du, poll=0** (dpkg 1.510, cache 174, lists 71); cờ cũ #127 sao lưu thành POSTBOOT_PASS-6882f9a9. Đây là cờ replay đầy đủ đầu tiên kể từ #123 (khác #125/#126/#127 repair-som-quyet-h).
- Replay #128 (từ dpkg.log): 172 dòng install; bracket 05:35:47Z → 05:50:38Z; install đầu 05:44:25Z libaspell15; **libjavascriptcoregtk-6.0-1 cài 05:50:00Z, libwebkitgtk-6.0-4 cài 05:50:26Z, configure xong 05:50:38Z**; xdg-dbus-proxy 05:50:24Z. /var/log/apt xuất hiện sau replay (eipp.log.xz, history.log, term.log). GST là **thư mục thật (apt)**, 269 file, KHÔNG phải symlink. libwebkitgtk-6.0-4 `ii 2.52.6-0ubuntu0.24.04.2` — libs WebKit hệ thống CÓ trên #128 nhờ replay thật (quyết (h)-198 được giải quyết tích cực, không cần cài tay).
- Replay #125/#126/#127: KHÔNG CÓ replay đầy đủ (dạng B → early-repair) — theo (k)-198. #124: KHÔNG CÓ cờ, KHÔNG viết post-hoc. **Tổng boot không cờ GIỮ 31** (#124 là boot duy nhất không cờ; #125/#126/#127/#128 đều CÓ cờ).

### §1.4 Reboot #129 giữa đợt + watcher L2 + POSTBOOT_PASS #129

- **Reboot #129 ứng viên: boot e6e070b8-0427-4607-a421-2de265a54fdd, btime 1795761536 = 06:38:56Z; gap #128 → #129 = 5.826 s.** Phát hiện ~06:39:52Z: watcher L1 (pid 33388) biến mất khỏi ps; log watcher dừng ở poll 06:39:21Z; boot_id đổi; uptime -s 06:38:56. Cùng lúc, một lệnh sleep 300 của T56 bị lỗi "service restarted" — chính là reboot này (giết cả watcher L1 lẫn phiên exec).
- Caveat đồng hồ guest (tiền lệ F-198-T56-5): last poll L1 06:39:21Z muộn hơn btime mới 06:38:56Z đúng 25 s (đồng hồ boot cũ chạy nhanh) — xác minh btime thuộc T01/T2-199.
- Lúc reboot: lock trống (dòng cuối t4 RELEASED 06:38:20Z) → **#129 KHÔNG GIẾT HOLDER** (chuỗi 4 → 5 nếu parent xác nhận #128/#129 — xem §5.3).
- T4 poller đã thoát 06:38:53Z (3 s TRƯỚC reboot — theo T4 .done 06:57Z), 0 attempt bị ảnh hưởng. T8 waiter đang chờ T4.done (đúng (p1)-198).
- **Watcher-199 L2: respawn cùng script (END 08:35:51Z giữ nguyên), START 06:44:07Z, pid 7194** (ps-check trước spawn: 0 watcher). Khoảng không-watcher #129: 06:38:56Z → 06:44:07Z = **311 s**. L2 polling đều 30 s.
- Trạng thái #129 lúc respawn (boot+~5'): dạng B như #126/#127: dpkg.log **2 dòng**, md5 c095b533, mtime 06:39:38Z; /var/log/apt KHÔNG TỒN TẠI; cache 0; lists 5; GST 0; webkit 0; marker cb7102c0/239 B sống qua reboot.
- **EARLY-REPAIR TRIGGER 06:54:08Z** (boot_age 912 s, frozen 870 s, dpkg 2 dòng) → verify form-B postboot check-only exit=1 (cho exit=1) → --repair exit=0 (apt-get update ~13 phút + install 11 gói NEED; apt log 707 dòng, copy ra khỏi /tmp NGAY sau --repair thành `t5-postboot-repair-apt-e6e070b8.log` — F-173-T5-9) → postboot poll1 exit=0 (hoàn tất 07:08:07Z; dpkg 777, cache 108, lists 75) → **FLAG-WRITTEN 07:08:07Z mode repair-som-quyet-h, poll=1** (old=773743f2). L2 bắt đầu với CUR=e6e070b8 nên write_flag sao lưu cờ #128 thành POSTBOOT_PASS-773743f2 (đúng thiết kế).
- dpkg 777 dòng — đúng profile repair như #125/#126/#127 (không phải replay đầy đủ 1.510 như #128).

## §2. Verify độc lập + GST + WebKit (h)-198

- **Verify độc lập #128: exit=0, chạy 05:52:33–05:52:35Z**, log `t56-postboot-independent-773743f2.log` md5 6205e108 (8 dòng: PASS wrapper K1, 5/5 lib, GST 269=269 isomp4+libav, 11/11 apt, KẾT LUẬN ĐỦ ĐIỀU KIỆN). Chạy TRƯỚC khi T4 mở attempt (T4 poll #5 05:52:01Z còn poll-wait, thấy cờ ở poll #6 05:52:50Z; attempt1 mở 06:09:35Z) — không phải cửa sổ (b) của T4. Ghi nhận minh bạch: verify chạy trong lúc O8 attempt2 của T01 đang chạy (browser) nhưng verify chỉ đọc, dpkg md5 11e925aa không đổi trước/sau — không tính vi phạm.
- **Verify độc lập #129: exit=0, chạy 07:10:51Z**, log `t56-postboot-independent-e6e070b8.log` md5 8d1487ba (8 dòng, giống hệt poll1: PASS wrapper K1, 5/5 lib, GST symlink → debroot 269=269 isomp4+libav, 11/11 apt, KẾT LUẬN ĐỦ ĐIỀU KIỆN). Chạy SAU khi T4 poller đã thoát (poller chết 06:38:53Z; T4 .done 06:57Z) — không có cửa sổ (b) nào mở; dpkg md5 1147a609 không đổi trước/sau (verify chỉ đọc).
- GST: #128 thư mục thật (apt) 269 file; #129 symlink → `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0` (lrwxrwxrwx, tạo 06:54Z lúc repair), 269=269. (Lưu ý: `ls -lad` có trailing slash hiện target, không phải link — kiểm bằng `ls -la` không slash.)
- WebKit libs: #128 CÓ libwebkitgtk-6.0-4 (ii 2.52.6) nhờ replay thật — (h)-198 KHÔNG cần cài tay trên #128. #129 VẮNG (dpkg -l | grep -ci webkit = 0; ledger dòng 2 không có webkit) — NEED không gồm libwebkitgtk; debroot + lib bundled vẫn là đường chính. **KHÔNG cài tay** (đúng (h)-198; chỉ cài khi parent ra lệnh + SAU khi poller T4 thoát).

## §3. Cờ cũ — md5 (kiểm lại lúc đóng)

- #129 (mới, 07:08:07Z, repair-som-quyet-h poll=1): **e09dfd4c**
- #128 (05:51:25Z, replay-day-du poll=0; backup POSTBOOT_PASS-773743f2): **62c1346c**
- #127: **153d57e7** — #126: **f076a945** — #125: **48fec087** — #123: **e94fad95** — #121: **28847b1e** — #119: **863a6035**. Tất cả KHỚP đợt 198.

## §4. Ledger + T01-199 O8 + ENOSPC

- **Ledger: 2 dòng (MỚI — xem F-199-T56-9).** Dòng 1: ts 1795741205 (= 01:00:05Z — lúc repair #127 xong), added 173, removed 0. **Dòng 2: ts 1795763286 (= 07:08:06Z — lúc repair #129), added 106, removed 0** — gồm 7/11 NEED (libevdev2, libegl1, libavif16, libgstreamer-plugins-base1.0-0, libgstreamer1.0-0, gstreamer1.0-plugins-base, gstreamer1.0-plugins-good) + deps (glib-networking, gstreamer1.0-libav, gstreamer1.0-plugins-bad/ugly, libavcodec60, …); KHÔNG có webkit. dpkg-state.txt: 890 dòng, mtime 07:08:06Z (trước repair: 828 dòng, mtime 05:35Z).
- T01-199 O8: 21/21 ×2 WebKit + 21/21 Chromium, 05:48:31–05:54:24Z, hold lock 351 s, cùng cây preview.tsx 477a0eac + media.ts ac89aeb2. Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây" ĐẠT (parent quyết (b)-199). (b) FULL PASS KHÔNG CÓ — chuỗi GIỮ 0 (chân harness kẹt #31; xem §6).
- ENOSPC (T56 chỉ đếm thô — chuỗi thuộc T9-199): #128 = **18 dòng** (~05:55Z); #129 = **27 dòng** (~07:11Z). T9-198 đếm 101 dòng trên #126 (chuỗi ENOSPC 44 → 45 đợt 198).

## §5. Lock health (T6)

### §5.1 Số đếm cuối (07:11Z, analyze-log.py trên vite-lock-v2.log, đã loại 6 dòng repro tA/tH)

- total cleaned 2977 / raw 2983; TICKET 864 / ACQUIRED 853 / RELEASED 840; COOLDOWN 396 / STALE-LOCK 13 / STALE-TICKET 1 / TIMEOUT 10; pairs 840; double-acquire 7; still_held_at_end=0; held_owners=[].
- So với T56-198 kiểm cuối (2942/2948; 854/843/830; COOLDOWN 391; STALE-LOCK 13; pairs 830; double-acquire 7; held 0; chênh 13): Δ raw +35, cleaned +35, TICKET +10, ACQUIRED +10, RELEASED +10, COOLDOWN +5, STALE-LOCK 0, pairs +10, double-acquire 0. Chênh ACQ−REL = 853−840 = **13 = 13 STALE (giữ nguyên) + 0 đang giữ**.
- 35 dòng mới: t8-round198 ×23 (6 chu kỳ khép kín 01:29:36–01:59:07Z: 6 TICKET + 6 ACQUIRED + 6 RELEASED + 5 COOLDOWN) + t01-round199 ×3 (TICKET + ACQUIRED + RELEASED 05:48:32–05:54:24Z) + t4 ×9 (3 attempt × TICKET + ACQUIRED + RELEASED). 0 dòng nào của T56 trên log thật. 0 RELEASED không ACQUIRED trước, 0 TIMEOUT mới (cuối 19/11 15:50:28Z). **Kết luận: lock KHỎE.**
- T01 O8 giữ lock 05:48:33–05:54:24Z (hold 351 s, RELEASED 05:54:24Z). T4 giữ lock attempt1 06:09:35–06:14:02Z (267 s), attempt2 06:25:52–06:29:36Z (224 s), attempt3 06:34:10–06:38:20Z (250 s).

### §5.2 #128 KHÔNG GIẾT HOLDER — chuỗi 3 → 4 (nếu parent xác nhận #128 = 773743f2)

- Dòng lock cuối trước btime 05:01:50Z là t8-round198 RELEASED 01:59:07Z (trống 10.963 s); dòng đầu sau btime là t01-round199 TICKET 05:48:32Z. Lock trống liên tục 01:59:07Z–05:48:32Z (13.765 s) nên verdict không phụ thuộc số hiệu boot. Đồng hồ: T01-199 đo chặt CF +2 s (local mid 1795758215 vs CF Date 05:43:37 GMT); δ=2 s.

### §5.3 #129 KHÔNG GIẾT HOLDER — chuỗi 4 → 5 (nếu parent xác nhận #128/#129)

- Dòng lock cuối trước btime 06:38:56Z là t4 RELEASED 06:38:20Z; **0 dòng sau btime** (không ai acquire kể từ reboot). Lock trống 06:38:20Z → 06:38:56Z (36 s) + trống tiếp sau btime. Caveat: chỉ trống 36 s trước btime (δ=2 s — vẫn gấp 18 lần δ), nhưng verdict không phụ thuộc số hiệu boot vì 0 dòng sau btime. **#129 KHÔNG GIẾT HOLDER.**

### §5.4 Snapshot zombie / X11 / ss

- Snapshot 1 (~05:55Z): zombie 0; socket X11 0; Xvfb 0; listener 0.0.0.0:8765 = 0.
- Snapshot 2 (~07:11Z): zombie 0; socket X11 0; Xvfb 0; listener 0.0.0.0:8765 = 0. (Đợt 198 lúc đóng còn 2 socket X11 sót — nay sạch cả hai lần.)

## §6. (A) + suite + monitor + T4-199 (ghi nhận)

- Script: suite `apps/web/scripts/test-vite-lock-v2.sh` md5 **a89c0676** (không đổi). Poll script `vcut-poll-quiet-v2.sh` md5 **1710e480**; lock v2 `vcut-vite-lock-v2.sh` md5 **520b8baa**; lock v1 `vcut-vite-lock.sh` md5 **fd21193c** (cả ba khớp đợt 198). Khối T7 trích `t7-block-a198.sh` md5 dc973443 (giống hệt đợt 151–197).
- 4 script 199 sinh bằng `hidden_files/round199-t56/gen-suite-199.py` từ bản 198 + **SỬA F-198-T56-3 (monitor + gate-check xem CẢ HAI đường poll log T4)**: `t7-gate-monitor-199.sh`, `run-harness-199.sh`, `suite-runner-199.sh`, `t7-control-a199.sh` (md5 9e832eb6; khối trích lại từ suite mỗi lần chạy). Tất cả bash -n OK.
- **Suite: 9/9 × 6 lượt, rc=0 cả 6** (06:22:18–06:24:59Z; run1 06:22:40Z … run6 06:24:59Z). Chuỗi suite xanh 79 → **80**. Chạy theo (p1)-198 (gate thực chất + monitor 5 s + kiểm 0 chồng lấn sau): gate-check 06:21Z (lock trống — RELEASED 06:14:02Z; T4 retry-wait, gate đóng, load5 3.68; 0 attempt đang chạy). Monitor lần đầu bắt SAI pgid (pgrep -f khớp cả shell exec của chính T56 → pgid 75749 thay vì 75751): đã kill monitor cũ (pid 75944) và khởi động lại đúng pgid 75751 lúc 06:23:38Z (MONITOR-END 06:24:59Z "0 cua mo"). 0-overlap xác minh sau: 0 dòng lock mới kể từ 06:22:18Z; CUA YEN MO vẫn 1. Xem F-199-T56-3.
- **F-199-T56-2 (mới): gate-check của run-harness-198.sh grep TOÀN BỘ file poll log** nên bất kỳ "CUA YEN MO" lịch sử nào cũng chặn harness (lỗi bị che đợt 198 vì monitor xem sai đường log). Đã sửa trong run-harness-199.sh: gate-check chỉ xét dòng MỚI kể từ baseline lúc harness bắt đầu + kiểm lock ĐANG GIỮ (dòng cuối lock log là ACQUIRED thì dừng) + ACQUIRED mới kể từ baseline. Lần chạy đầu (06:46:49Z) bị chặn bởi lỗi này ("chunk 1: GATE MO — DUNG"); sau khi sửa, chạy lại 06:48:41Z.
- **Harness (A): 120/120 PASS, 0 FAIL** (06:48:41–06:56:06Z; chunk 1: 06:48:41–06:50:21Z; chunk 2: 06:50:28–06:52:17Z; chunk 3: 06:52:23–06:54:08Z; chunk 4: 06:54:14–06:56:00Z; mỗi chunk 30/30, rc=0). **(A) lần thứ 48 (tổng 5.760/5.760).** B1=1 B2=0 cả 120 lần (grep chính xác `^run [0-9]+ -> PASS` = 120, `-> FAIL` = 0; xem F-199-T56-8 về con số "124/4" của runner). Churn delays: 120 dòng, min 525 ms, max 3.476 ms, avg 1.987,26 ms. Gate-check mỗi chunk đều qua (acquired_raw=855; BASE_ACQ=855 lúc harness bắt đầu; +2 so với 853 lúc suite là 2 ACQUIRED attempt2 + attempt3 của T4). Monitor 5 s bọc mỗi chunk (dual-path): 4 lần MONITOR-START/END, đều "0 cua mo". Lỗi cosmetic "No such file or directory" ở các dòng wc -l trên T4LOG_A (file gốc không tồn tại) — fallback về 0 vẫn đúng.
- T4-199 monitor (cả hai đường log — F-198-T56-3): T4 chỉ ghi vào `hidden_files/round199-t4/poll-t4.log` (đường mới trong thư mục); file gốc `hidden_files/round199-t4-poll.log` KHÔNG TỒN TẠI. T4 poll-wait từ 05:48:51Z, poll 45 s, deadline 07:30:00Z; gate: GATE_OPEN=1 cần gate0 (T5 PASS hoặc T4-check-only exit 0 + tuổi ≤3 poll) + PB=0 + APTN=0 + TREEOK + **load1<2 + load5<2** + RAM≥1024 + LOCKOK + BLOCKERS=0. T4 thấy cờ #128 ở poll #6 (05:52:50Z, t5flag=PASS, gate0=T5). Chưa mở attempt ngay vì load5 >2 (T01 O8 + replay làm load cao).
- **attempt1: CUA YEN MO poll #28 06:09:34Z → ACQUIRED 06:09:35Z → RELEASED 06:14:02Z; exit=0, 20/20 NHƯNG LỚP B VI PHẠM — lượt nhiễm tải, KHÔNG dùng verdict** → RETRY (còn 2 lượt).
- **attempt2: CUA YEN MO poll #44 06:25:51Z → ACQUIRED 06:25:52Z → RELEASED 06:29:36Z; exit=0, 20/20 NHƯNG LỚP B VI PHẠM** (classb: sampler n=105, load1_max=4.88, RAM_min=967MB, 7 mẫu RAM<1024MB, load5 lúc kết thúc 2.70) → RETRY (còn 1 lượt).
- **attempt3: CUA YEN MO poll #50 06:34:10Z → ACQUIRED 06:34:10Z → RELEASED 06:38:20Z; 20/20 NHƯNG LỚP B VI PHẠM — ĐÃ HẾT 3 ATTEMPT/ĐỢT, không có lượt hợp lệ — thoát poller** (poller thoát 06:38:53Z, 3 s trước reboot #129). T4 .done 06:57Z (boot lúc viết cờ: e6e070b8 #129; boot đo: 773743f2 #128).
- **Lượt yên #67: KHÔNG CÓ LƯỢT HỢP LỆ — chuỗi lượt yên hợp lệ 2 → 0 (ĐỀ XUẤT của T4; parent quyết (m)-199).** Verdict thuộc T4-199/T10-199 + parent; T56 chỉ ghi nhận. T4 LIMITS: `docs/PHASE9_ROUND199_T4_WEBKIT_QUIET67_LIMITS.md` (36.716 B).
- Suite T56 chạy 06:22:18–06:24:59Z kết thúc chỉ 52 s trước khi T4 mở attempt2 (06:25:51Z) — monitor đã bảo vệ đúng.
- .done 199 lúc T56 đóng: P1, P2, T01, T2, T4 (5 file). T8-199 có waiter đang chờ T4.done (đúng (p1)-198); T9 sampler đang chạy. T7-199 có thư mục làm việc.

## §7. Prune 73

- Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa `cooldown-*` mtime >7 ngày (find -mtime +7 = ≥192h); (b) trần mềm 100 file; (c) không xóa file đợt hiện tại/ngay trước; (d) ghi tên + số file xóa; (e) chỉ chạy khi lock trống.
- Chạy ~05:56:34Z, lock trống đã kiểm trước/sau (dòng cuối RELEASED 05:54:24Z t01-199; T4 vẫn poll-wait, chưa acquire). **XÓA 4 FILE theo điều (a):** cooldown-t10-round143 (192h/11550 phút), cooldown-t8-round143 (192h/11570'), cooldown-t10-round142 (195h/11753'), cooldown-t8-round142 (197h/11830'). Queue: 90 file / 1260 B → **86 file / 1204 B**. Tầng tuổi: ≥192h: 4 → 0; ≥168h: 17 → 13; ≥72h: 58 → 54; ≥48h: 72 → 68. Điều (b) KHÔNG kích hoạt (86 < 100). Ghi `prune-time.txt` + `prune-deleted.txt`. **F-147-T6-1 — CHUỖI VẪN 0, lần thứ 20 liên tiếp sau khi đứt tại 179** (các file xóa đều qua mốc 168h lúc xóa 24–29h).
- Prune 72 đợt 198: xóa 1 file (cooldown-t10-round141), queue 89 → 88 (tham chiếu).

## §8. Findings F-199-T56-n (ghi nhận)

- **F-199-T56-1:** watcher L1 chết theo reboot #129 giữa đợt (last poll 06:39:21Z, btime mới 06:38:56Z — caveat đồng hồ guest 25 s, như F-198-T56-5); respawn L2 pid 7194 sau 311 s. Khoảng không-watcher đầu đợt 11.578 s (02:35:51Z → 05:48:49Z).
- **F-199-T56-2:** gate-check run-harness grep toàn bộ file poll log → chặn harness vì "CUA YEN MO" lịch sử; đã sửa thành baseline + kiểm lock đang giữ (xem §6).
- **F-199-T56-3:** monitor suite bắt sai pgid lần đầu (pgrep -f khớp shell exec của chính T56 → pgid 75749 thay vì 75751); đã kill + khởi động lại đúng pgid 75751 lúc 06:23:38Z; bài học: KHÔNG dùng pgrep -f để lấy pgid khi chuỗi lệnh chứa tên script — dùng $! trực tiếp (setsid exec tại chỗ nên $! chính là pgid). Suite vẫn đứng (0 chồng lấn đã kiểm sau).
- **F-199-T56-4:** replay #128 chạy thật (đầu tiên kể từ #123) — dpkg 1.510 dòng, 172 install, libwebkitgtk-6.0-4 được replay khôi phục; GST thư mục thật. (h)-198 không cần cài tay trên #128; nhưng #129 repair KHÔNG khôi phục được lib — debroot vẫn là đường chính.
- **F-199-T56-5:** reboot #129 giữa đợt — T4 poller đã thoát 06:38:53Z (3 s trước reboot), 0 attempt bị ảnh hưởng (T4 .done đính chính — báo cáo giữa đợt của T56 từng ghi "poller chết theo reboot" là SAI, xem §10). Clock caveat: L1 last poll 06:39:21Z muộn hơn btime 06:38:56Z 25 s (đồng hồ boot cũ chạy nhanh — như F-198-T56-5).
- **F-199-T56-6:** T4-199 0 lượt hợp lệ (3/3 lớp B vi phạm do nhiễm tải) — ghi nhận; verdict + chuỗi lượt yên hợp lệ thuộc T4 + parent (m)-199.
- **F-199-T56-7:** suite + harness chạy theo (p1)-198 trong lúc T4 retry-wait (gate thực chất + 0 chồng lấn đã kiểm sau); (A) lần 48.
- **F-199-T56-8:** harness runner đếm grep "124/4" — artifact do đếm cả 4 dòng summary chunk ("PASS=30 FAIL=0"); số thật 120/0 (đã kiểm lại bằng grep `^run [0-9]+ -> PASS/FAIL`).
- **F-199-T56-9:** ledger thêm dòng 2 lúc repair #129 (ts 1795763286, added 106, removed 0) — lần đầu watcher --repair ghi ledger (trái với #126/#127: ledger giữ 1 dòng theo T56-198); T5-200 kiểm tra cơ chế silencing của recorder (hook dpkg-post-invoke có chạy trong apt của watcher không).
- **F-198-T56-6 ĐÓNG:** marker đã tìm ra đường dẫn + xác minh (xem §9 (j) dưới).
- Các F-198-T56-n khác tham chiếu từ LIMITS T56-198 (F-198-T56-1: watcher-198 END = hạn cứng đợt 198; F-198-T56-3: monitor mù nửa đường log — đã sửa dual-path đợt này; F-198-T56-10: verify trong cửa sổ (b) — quy tắc (p2)).

## §9. Đề xuất cho parent (quyết ở aggregate 199)

- (a) Chấp nhận phần T56 đợt 199 (watcher L1+L2, POSTBOOT #128 + #129, lock, (A), suite, prune 73, marker).
- (b) Cờ #128 replay-day-du poll=0 — parent chọn caveat (b1) hay không caveat (b2); cờ #129 repair-som-quyet-h poll=1 — tương tự. (T56 đề xuất: #128 KHÔNG caveat — replay đầy đủ thật + verify độc lập exit 0; #129 caveat (b1) như #125/#126/#127.)
- (c) Xác nhận 773743f2 = #128 VÀ e6e070b8 = #129 (T01-199 xác minh #128 9 nguồn tươi; btime #129 thuộc T01/T2-199).
- (d) Holder #128 KHÔNG GIẾT — chuỗi 3 → 4; #129 KHÔNG GIẾT — chuỗi 4 → 5.
- (e) (A) lần 48 (5.760/5.760) + suite xanh chuỗi 80.
- (f) Prune 73 (xóa 4, queue 90 → 86); F-147-T6-1 chuỗi VẪN 0 lần 20.
- (g) Hướng (3) lần thứ 45.
- (h) WebKit libs — #128 CÓ qua replay (không cần cài tay); #129 VẮNG (debroot giữ). KHÔNG cài tay.
- (i) Monitor dual-path đã sửa (F-198-T56-3) + gate-check baseline (F-199-T56-2).
- (j) **Marker ĐÃ XÁC MINH — F-198-T56-6 ĐÓNG:** đường dẫn `/home/hatch/.config/vcut-persistence-marker`, 239 B, mtime 2026-11-20 11:39:47.272154981Z, md5 cb7102c0. Nội dung: "vcut persistence marker — T5-154; written: 2026-11-20T11:39:40Z (UTC); boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z); purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)". T56-198 không tìm ra vì chỉ tìm trong hidden_files/workspace (find 239B trong hidden_files chỉ ra 3 file không liên quan). Sau reboot #129 kiểm lại: md5 cb7102c0, size 239 — marker SỐNG QUA #129. **Marker 79 ĐÃ XÁC MINH** (qua #49–#127); **80 nếu #128 xác nhận, 81 nếu #129 xác nhận** (T01-199 draft cũng ghi "80 nếu #128 xác nhận" — T01 viết trước khi T56 xác minh đường dẫn).
- (k) Watcher-200 spawn kịp thời sau 08:35:51Z (END watcher-199).
- (l) Ledger dòng 2 (F-199-T56-9) — giao T5-200 kiểm tra cơ chế silencing của recorder.
- (m) Lượt yên #67: T4 đề xuất chuỗi lượt yên hợp lệ 2 → 0 (0 lượt hợp lệ) — parent quyết (m)-199.
- (n) Tổng boot không cờ GIỮ 31 (#124 là boot duy nhất không cờ).

## §10. Sai số của chính T56-199

- Monitor suite bắt sai pgid lần đầu (06:22:20–06:23:38Z, ~80 s không bảo vệ thật; đã sửa ngay; 0 chồng lấn đã kiểm sau — suite vẫn đứng).
- Lệnh kiểm watcher lúc đầu dùng pgrep -f (khớp shell exec của chính mình) — đã sửa bằng ps trực tiếp (bài học F-199-T56-3).
- Báo cáo giữa đợt từng ghi "T4 poller chết theo reboot #129 khi đang thoát" — T4 .done đính chính: poller thoát 06:38:53Z, 3 s TRƯỚC reboot; 0 attempt bị ảnh hưởng.
- Giả định "repair không chạm ledger" (theo #126/#127) là SAI trên #129 — ledger thêm dòng 2 (F-199-T56-9).
- Lock count cuối lấy 07:11Z — nếu T8 chạy harness sau đó, số sẽ lệch; T10 dedup toàn cục là chuẩn. Chênh ACQ−REL = 13 STALE vẫn đúng tại thời điểm đếm (held 0).
- #129 chỉ trống 36 s trước btime (xem §5.3) — verdict KHÔNG GIẾT vẫn đứng (δ=2 s; 0 dòng sau btime), nhưng biên mỏng hơn #128 (10.963 s).

## §11. Batch stage

- 1 file mới: `docs/PHASE9_ROUND199_T56_INFRA_LOCK_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round199-t56-infra-lock.txt` (NUL-delimited, 1 entry).
- KHÔNG stage file làm việc trong `hidden_files/round199-t56/` (script, log, cờ, backup, prune log, churn log — chỉ để tham chiếu).
- Chờ push: 191–198 = 95/366/273/252 + đợt 199 (sau khi T10-199 đếm lại bằng dedup toàn cục) + 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` (số phận chưa quyết).
