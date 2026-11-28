# PHASE 9 — ROUND 200 — T56: INFRA / WATCHER / LOCK — LIMITS

**Đợt:** 200. **Luồng:** T56 — infra/watcher + POSTBOOT_PASS + lock + prune + marker.
**Trạng thái:** ĐÃ ĐÓNG. Watcher-200 đang chạy (pid 7406, START 11:39:46Z, END 14:35:51Z). POSTBOOT_PASS #130 ĐÃ CÓ cờ.
**Kết quả chính:** (A) 120/120 lần thứ 49; suite 9/9 × 6 (chuỗi 80 → 81); marker ĐÃ XÁC MINH (80 qua #129);
#130 KHÔNG GIẾT holder (chuỗi 5 → 6 nếu parent xác nhận #130); prune 74 xóa 4 file; T4-200 attempt1 20/20 HỢP LỆ — lượt yên #68 (chuỗi lượt yên hợp lệ 0 → 1, đề xuất của T4).

**Nguồn quyết DUY NHẤT:** aggregate 199 §14.2 (`docs/PHASE9_ROUND199_LIMITS.md`, 86.880 B — bản đã KHÔI PHỤC, parent CHẤP NHẬN CÓ ĐIỀU KIỆN, lượt handoff 15:39 +07 27/11/2026). Các bản "parent viết" khác (kể cả mục đính chính giả mạo sau khi đóng, đã chuyển vào `hidden_files/round199-fabricated-0911Z/`) đều KHÔNG dùng. Quyết dùng: (c) POSTBOOT #128 CÓ không caveat (b2) — replay ĐẦY ĐỦ thật đầu tiên kể từ #123; #129 CÓ caveat (b1); (e) #128 XÁC NHẬN; #129 ỨNG VIÊN; marker 79 → 80 ĐÃ XÁC MINH (F-198-T56-6 ĐÓNG); (h) E-247 GIỮ MỞ; (i) holder chuỗi 3 → 4 → 5; (A) 120/120 lần thứ 48; suite xanh 79 → 80; (r) watcher-200 spawn kịp thời sau 08:35:51Z + POSTBOOT #130 + replay.
**Nguồn đọc:** `docs/PHASE9_ROUND199_T56_INFRA_LOCK_LIMITS.md`, `hidden_files/round199-t56/`, `hidden_files/round200-t56/`, `docs/PHASE9_ROUND200_T5_RECORDER_SILENCE_LIMITS.md`, `hidden_files/round200-t5.done`, `hidden_files/round200-t01.done`, `hidden_files/round200-t2.done`, `hidden_files/round200-t4/windows.md` + `poll-t4.log`.
**Hạn cờ:** ~14:00Z 27/11/2026. **Hạn cứng:** 14:35:51Z (END watcher-200). **Đóng T56:** ~12:08Z.

## §0. Trạng thái lúc mở (11:38Z 27/11)

- Boot hiện tại: `c073c8bb-26f3-41e8-a4b5-3d56ce3564f8`, btime 1795778501 = 11:21:41Z (uptime -s khớp; uptime 16' lúc 11:38Z). Gap #129 → #130 = 16.965 s (4h42m45s). Không có `round-in-progress.md` (gate sạch — kiểm lại lúc đóng 12:07Z vẫn không có). /tmp đã bị xóa sạch (chỉ còn .ICE/.X11/.XIM/.font-unix từ 11:21Z).
- Watcher-199 ĐÃ CHẾT (hết hạn 08:35:51Z; log: REPLAY-WATCH-199-END 08:36:18Z; ps 11:38Z: 0 process watcher/replay-watch — chỉ còn find pid 3716 của luồng khác đang tìm ledger, không phải watcher). Khoảng không-watcher: 08:35:51Z → 11:39:46Z = **11.035 s** (3h03m55s).
- Trạng thái lúc spawn: dạng B đóng băng như #126/#127/#129: dpkg.log **2 dòng** ("startup packages configure" ×2, mtime 11:35:41Z = boot+14m, md5 3704b811); /var/log/apt KHÔNG TỒN TẠI; cache 0; lists 5; GST hệ thống 0 file; libwebkitgtk VẮNG (dpkg -l grep webkit = 0); 0 proc apt/dpkg.
- Marker kiểm lại lúc mở 11:38Z: `/home/hatch/.config/vcut-persistence-marker`, 239 B, md5 cb7102c0, mtime 2026-11-20 11:39:47Z — **SỐNG QUA BOOT MỚI**.
- T01-200 đã đóng (.done ~11:54Z): boot c073c8bb XÁC NHẬN 9 nguồn tươi, ứng viên #130 **CÓ ĐIỀU KIỆN** — nếu daemon restart 08:41:43Z là reboot thì boot này = #131 (F-200-T01-9, 0 witness — parent quyết (e)-200); T01 ghi "watcher-200 CHƯA SPAWN" là SAI/stale (xem F-200-T56-6). T5-200 đã đóng (.done ~11:42Z): cơ chế silencing ĐÚNG, F-199-T56-9 không phải lỗi (xem §1.5). T2-200 đã đóng (11:56:36Z): mâu thuẫn -check/-recheck GIẢI QUYẾT — script thật là `/tmp/count-197-check.py` + `.sh` (xem §8).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1 Timeline (giờ UTC 27/11/2026)

- 08:35:51Z — watcher-199 hết hạn (END đợt 199).
- 11:21:41Z — btime boot c073c8bb (ứng viên #130).
- 11:35:41Z — dpkg.log mtime (2 dòng "startup packages configure").
- 11:39:46Z — watcher-200 START (pid 7406).
- 11:41:34Z — suite run1 bắt đầu; 11:43:05Z run3 xong 9/9.
- 11:43:24Z — T01-200 ACQUIRED lock (O8 attempt2); monitor kill suite đúng thiết kế (F-200-T56-2).
- 11:45:49Z — EARLY-REPAIR TRIGGER (#130).
- 11:50:36Z — T01 RELEASED (hold 432 s).
- 11:50:44–11:52:07Z — suite resume run4–6 (9/9 × 3).
- 11:52:15–11:59:28Z — harness (A) 120/120.
- 12:01:06Z — POSTBOOT_PASS #130 (repair-som-quyet-h, poll=1).
- 12:01:09Z — T4 W1 mở (attempt1, poll #29 — chỉ 3 s sau cờ).
- 12:04:42Z — T4 RELEASED (hold 213 s); 12:05:10Z poller thoát (attempt1 HỢP LỆ).
- 12:05:52Z — verify độc lập #130 exit=0 (ngoài cửa sổ (b)).
- ~12:08Z — T56 đóng.

### §1.2 Watcher-200

- Script tạo mới bằng generator `hidden_files/round200-t56/gen-watcher-200.py` từ `round199-t56/replay-watch-199.sh` (thay DIR → round200-t56, OLD_T5_DIR → round199-t56, LOG → replay-watch-200.log, END_EPOCH → 2026-11-27 14:35:51 UTC, REPLAY-WATCH-200-START/END/STOP, watcher-200 trong write_flag; header viết lại cho 200; bash -n OK; generator tự kiểm tra token 199 còn sót — bắt được 2 dòng comment stale, đã sửa trước khi spawn).
- **START 11:39:46Z, pid 7406, boot c073c8bb, END 14:35:51Z.** INIT: dpkg 2 dòng, md5 3704b811, mtime 11:35:41Z, cache 0, lists 5, gst_sys 0.
- Spawn bằng đường dẫn TUYỆT ĐỐI (`nohup bash /abs/path/replay-watch-200.sh > nohup.log 2>&1 & disown` — F-167-T5-2); verify độc lập bằng ps + START line + poll đầu (11:39:47Z). Phiên exec spawn backgrounded (output không đóng do watcher là con) — **CẢNH BÁO: KHÔNG kill session `proc_9d42b2c3a9cc` — process.kill xé cả cây tiến trình sẽ giết watcher pid 7406.** Watcher chạy bằng nohup + disown, độc lập sau khi shell spawn thoát.
- Polling đều 30 s; sau repair, dpkg ổn định 777 dòng, md5 308b224b, cache 108, lists 75, gst_sys 269.

### §1.3 POSTBOOT_PASS #130 — repair-som-quyet-h, poll=1

- **POSTBOOT_PASS #130 ĐÃ CÓ 12:01:06Z** (boot+39m25s): watcher thấy EARLY-REPAIR TRIGGER 11:45:49Z (boot_age 1.448 s, frozen 608 s, dpkg 2 dòng) → verify form-B postboot check-only exit=1 (đúng, cho exit=1) → `--repair exit=0` → copy /tmp/l8-postboot-apt.log ra khỏi /tmp NGAY thành `t5-postboot-repair-apt-c073c8bb.log` (53.631 B — F-173-T5-9) → postboot poll1 exit=0 (hoàn tất 12:01:06Z; dpkg 777, cache 108, lists 75) → **FLAG-WRITTEN 12:01:06Z mode repair-som-quyet-h, poll=1** (old=e6e070b8). Tổng thời gian repair: trigger → cờ = 917 s (~15m17s; #129 ~14 phút).
- Repair apt log: **108 dòng `Setting up` − 2 upgrade** (`libelf1t64` 0.190-1.1ubuntu0.1 → .2, `libssh-4` 0.10.6-2ubuntu0.5 → .6 — GIỐNG HỆT #129) = **106 gói mới**; bracket dpkg.log: install đầu 12:00:55Z ("startup archives unpack") → cuối 12:01:06Z (libc-bin). /var/log/apt xuất hiện sau repair (eipp.log.xz, history.log, term.log).
- GST là **symlink → `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0`** (tạo 11:45Z lúc repair), 269=269 isomp4+libav. libwebkitgtk-6.0-4 VẮNG (dpkg -l grep webkit = 0; dpkg -l 895 dòng) — NEED không gồm libwebkitgtk; debroot + lib bundled vẫn là đường chính. **KHÔNG cài tay** (đúng (h)-198; chỉ cài khi parent ra lệnh + SAU khi poller T4 thoát).
- Dạng repair profile GIỐNG HỆT #125/#126/#127/#129 (dpkg 777, cache 108, lists 75) — KHÔNG phải replay đầy đủ 1.510 dòng như #128. **Tổng boot không cờ GIỮ 31** (#124 là boot duy nhất không cờ).

### §1.4 Verify độc lập #130 — exit=0 (ngoài cửa sổ (b))

- **Verify độc lập: exit=0, chạy 12:05:52Z**, log `t56-postboot-independent-c073c8bb.log` md5 **2f97a791** — **byte-identical với poll1 log của watcher** (cùng md5 2f97a791519e7d1ffe4be8d4269c9cbf; 8 dòng: PASS wrapper K1, 5/5 lib, GST symlink → debroot 269=269 isomp4+libav, 11/11 apt, KẾT LUẬN ĐỦ ĐIỀU KIỆN). dpkg md5 308b224b không đổi trước/sau (777 dòng) — verify chỉ đọc.
- **Chạy SAU khi W1 đóng:** T4 RELEASED 12:04:42Z, poller thoát 12:05:10Z ("attempt1 ... LUOT HOP LE, thoat poller"), verify 12:05:52Z — **không có cửa sổ (b) nào mở** (windows.md lúc đó vẫn ghi W1 "ĐANG CHẠY" chưa kịp cập nhật — lock log là chuẩn: RELEASED 12:04:42Z, 0 ACQUIRED sau đó). W1 mở chỉ **3 s sau khi cờ ghi** (12:01:06Z → 12:01:09Z) nên T56 không kịp verify trước cửa sổ như đợt 199 — xem F-200-T56-3.

### §1.5 Ledger — dòng 2 MỚI do repair #130 (đúng thiết kế, F-199-T56-9 ĐÓNG)

- Ledger `/var/lib/hatch/os-intent/ledger.jsonl`: **2 dòng**, mtime 12:01:06Z, 5.016 B, md5 81329ce3. Dòng 1: compacted, ts 1795763286 (= 07:08:06Z — repair #129), added 173. **Dòng 2 (MỚI): ts 1795780866 (= 12:01:06Z — lúc repair #130 xong), added 106, removed 0.**
- `dpkg-state.txt`: 890 dòng, mtime 12:01:06Z (reseed boot #130: 890 → 784 dòng lúc 11:36:04Z, không append — silenced đúng; repair +106 → 890). Ba lớp khớp nhau: apt log 108−2=106, ledger added 106, snapshot +106.
- Đúng như T5-200 dự báo (F-200-T5-4): repair append dòng ledger là **BÌNH THƯỜNG, đúng thiết kế** (chỉ replay của host mới bị silence; installs của repair là intent phải ghi). **F-199-T56-9 ĐÓNG.** Quy tắc giám sát mới (T5-200 §6(c)): chỉ báo động khi REPLAY append dòng hoặc REPAIR không append.

## §2. GST + WebKit (h)-198

- GST #130: symlink → debroot, 269 file (hệ thống = debroot = 269; isomp4 + libav đủ). Giống #129; khác #128 (thư mục thật 269 file nhờ replay).
- WebKit libs: #130 VẮNG (dpkg -l grep webkit = 0). NEED 11 gói không gồm libwebkitgtk-6.0-4 — repair không khôi phục được lib (như #129; chỉ replay đầy đủ #128 mới khôi phục). **KHÔNG cài tay** (đúng (h)-198).
- (h)-198 không cần cài tay trên #130; debroot + bundled lib vẫn là đường chính (F-197-T8-1).

## §3. Cờ cũ — md5 (kiểm lại lúc đóng)

- #130 (mới, 12:01:06Z, repair-som-quyet-h poll=1): **e95ba374**
- #129 (07:08:07Z, repair-som-quyet-h poll=1; backup POSTBOOT_PASS-e6e070b8): **e09dfd4c** — khớp POSTBOOT_PASS gốc trong round199-t56
- #128 (05:51:25Z, replay-day-du poll=0; backup POSTBOOT_PASS-773743f2): **62c1346c**
- #127: **153d57e7** — #126: **f076a945** — #125: **48fec087** — #123: **e94fad95** — #121: **28847b1e** — #119: **863a6035**. Tất cả KHỚP đợt 199.

## §4. Ledger + T01-200 O8 + ENOSPC

- **Ledger: 2 dòng (MỚI — xem §1.5).** Dòng 2 ts 1795780866 (= 12:01:06Z), added 106, removed 0 — gồm 7/11 NEED + deps, KHÔNG có webkit (giống #129). `dpkg-state.txt`: 890 dòng, mtime 12:01:06Z.
- T01-200 O8 trên #130 (theo T01-200 .done — T56 chỉ ghi nhận): attempt1 FAIL (S1, exit=2) + probe FAIL (timeout chờ mẫu tự load) + attempt2 PASS 21/21 + Chromium PASS 21/21 (11:43:23–11:50:36Z; md5 fcbe0ea7/f9903c26; 0 lỗi exit 127; cùng cây preview.tsx 477a0eac + media.ts ac89aeb2). **Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây" KHÔNG ĐẠT đợt này (2/3).** (m) #130 THÔ = 0 requeue; (m) #129 THÔ = 1 requeue DƯƠNG (eid 11540, run 207, +40,934 s) — phân loại CUỐI thuộc T2-200 (T2 phán: #128 KHÔNG CÓ ĐIỂM (CUỐI); #129 DƯƠNG (CUỐI); n 58/60). Run 207 TIMEOUT 08:39:01Z; run 9cd50793 SUCCEEDED nhưng finished_at_utc lệch đúng 2.000 s (T7-200).
- ENOSPC (T56 chỉ đếm thô — chuỗi thuộc T9-200): #130 = **26 dòng** (journalctl từ btime 11:21:41Z, đếm lúc 12:06Z); dmesg = 0. Tham chiếu: #128 = 18 dòng; #129 = 27 dòng (T56-199 §4).

## §5. Lock health (T6)

### §5.1 Số đếm cuối (12:06Z, analyze-log.py trên vite-lock-v2.log)

- total cleaned 3006 / raw 3012; TICKET 872 / ACQUIRED 861 / RELEASED 848; COOLDOWN 401 / STALE-LOCK 13 / STALE-TICKET 1 / TIMEOUT 10; pairs 848; double-acquire 7; still_held_at_end=0; held_owners=[].
- So với T56-199 kiểm cuối (07:11Z: 2977/2983; 864/853/840; COOLDOWN 396; STALE-LOCK 13; pairs 840; double-acquire 7; held 0): Δ raw +29, cleaned +29, TICKET +8, ACQUIRED +8, RELEASED +8, COOLDOWN +5, STALE-LOCK 0, pairs +8, double-acquire 0. Chênh ACQ−REL = 861−848 = **13 = 13 STALE (giữ nguyên) + 0 đang giữ**.
- 29 dòng mới: t8-round199 ×23 (6 chu kỳ khép kín 07:28:03–07:32:00Z: 6 TICKET + 6 ACQUIRED + 6 RELEASED + 5 COOLDOWN) + t01-round200 ×3 (TICKET + ACQUIRED + RELEASED 11:43:24–11:50:36Z) + t4 ×3 (TICKET + ACQUIRED + RELEASED 12:01:09–12:04:42Z). 0 dòng nào của T56 trên log thật. 0 RELEASED không ACQUIRED trước, 0 TIMEOUT mới (cuối 19/11 15:50:28Z). **Kết luận: lock KHỎE.**
- T01 O8 giữ lock 11:43:24–11:50:36Z (hold 432 s). T4 giữ lock attempt1 12:01:09–12:04:42Z (hold 213 s).

### §5.2 #130 KHÔNG GIẾT HOLDER — chuỗi 5 → 6 (nếu parent xác nhận c073c8bb = #130)

- Dòng lock cuối trước btime 11:21:41Z là t8-round199 RELEASED 07:32:00Z; dòng đầu sau btime là t01-round200 TICKET 11:43:24Z. Lock trống liên tục 07:32:00Z–11:43:24Z (**15.084 s**) nên verdict không phụ thuộc số hiệu boot. **#130 KHÔNG GIẾT HOLDER.**
- Caveat số hiệu (T01-200 F-200-T01-9): daemon restart 08:41:43Z CHƯA GIẢI QUYẾT (0 witness) — nếu parent phán đó là reboot thì c073c8bb = #131, và boot trung gian (08:41:43Z) cũng nằm trong khoảng lock trống 07:32Z–11:43:24Z nên cũng KHÔNG GIẾT holder — chuỗi khi đó là 5 → 7 (boot trung gian không có boot_id để xác minh riêng). Parent quyết (e)-200; T56 đề xuất giữ #130 trừ khi có bằng chứng reboot.

### §5.3 Snapshot zombie / X11 / ss

- Snapshot (~12:06Z): zombie 0; socket X11 **1**; Xvfb 0; listener 0.0.0.0:8765 = 0.
- Socket X11 duy nhất là **X193** (`/tmp/.X11-unix/X193`, tạo 12:01Z trong lúc T4 attempt1 chạy) — Xvfb process đã chết (ps grep Xvfb = 0) nhưng file socket còn lúc snapshot — **1 socket sót (orphan), không phải server sống** (xem F-200-T56-7). Đợt 199 lúc đóng sạch 0; đợt 198 còn 2 sót. Không thuộc T56 dọn (file trong /tmp, vô hại; T4/T8 dọn ở đợt sau nếu cần).

## §6. (A) + suite + monitor + T4-200 (ghi nhận)

- Script: suite `apps/web/scripts/test-vite-lock-v2.sh` md5 **a89c0676** (không đổi). Poll script `vcut-poll-quiet-v2.sh` md5 **1710e480**; lock v2 `vcut-vite-lock-v2.sh` md5 **520b8baa**; lock v1 `vcut-vite-lock.sh` md5 **fd21193c** (cả ba khớp đợt 199). Khối T7 trích `t7-block-a200.sh` (trích lại từ suite mỗi lần chạy, verbatim).
- 4 script 200 sinh bằng `hidden_files/round200-t56/gen-suite-200.py` từ bản 199 + **giữ SUA F-198-T56-3 (monitor + gate-check xem CẢ HAI đường poll log T4) + SUA F-199-T56-2 (gate-check chỉ xét dòng MỚI kể từ baseline)**: `t7-gate-monitor-200.sh`, `run-harness-200.sh`, `suite-runner-200.sh`, `t7-control-a200.sh`. Tất cả bash -n OK. Generator tự bắt 2 dòng comment stale (gate-monitor-199.log, t7-control-a199.sh) trước khi chạy.
- **Suite: 9/9 × 6 lượt, rc=0 cả 6** (run1–3: 11:42:04–11:43:05Z; run4–6 resume: 11:51:14–11:52:07Z). Chuỗi suite xanh 80 → **81**. Chạy theo (p1)-198 (gate thực chất + monitor 5 s + kiểm 0 chồng lấn sau): gate-check 11:41Z (lock trống — RELEASED 07:32:00Z; T4 poll-wait, gate chưa mở, 0 attempt đang chạy).
- **Monitor kill ĐÚNG THIẾT KẾ (F-200-T56-2):** suite lần đầu (pgid 14703) bị monitor kill 11:43:28Z vì T01-200 ACQUIRED lock 11:43:24Z (O8 attempt2) — đúng quy tắc F-194-T56-4 (ACQUIRED mới BẤT KỲ owner nào cũng dừng). Đã resume run4–6 bằng `suite-resume-200.sh` sau khi T01 RELEASED 11:50:36Z (monitor mới, pgid $! trực tiếp — F-199-T56-3); resume MONITOR-END 11:52:07Z "0 cua mo". 0-overlap xác minh sau: 0 dòng lock mới kể từ 11:50:44Z ngoài T4 attempt1 (mở SAU khi suite xong 11:52:07Z).
- **Harness (A): 120/120 PASS, 0 FAIL** (11:52:15–11:59:28Z; chunk 1: 11:52:15–11:54:01Z; chunk 2: 11:54:01–11:55:45Z; chunk 3: 11:55:45–11:57:44Z; chunk 4: 11:57:44–11:59:28Z; mỗi chunk 30/30, rc=0). **(A) lần thứ 49 (tổng 5.880/5.880).** B1=1 B2=0 cả 120 lần (grep chính xác `^run [0-9]+ -> PASS` = 120, `-> FAIL` = 0; "124/4" của runner là artifact đếm cả 4 dòng summary chunk — xem F-199-T56-8). Churn delays: 120 dòng, min 505 ms, max 3.497 ms, avg 1.898,10 ms. Gate-check mỗi chunk đều qua (acquired_raw=862; BASE_ACQ=862 lúc harness bắt đầu). Monitor 5 s bọc mỗi chunk (dual-path): 4 lần MONITOR-START/END, đều "0 cua mo" (tổng monitor đợt này: 6 START / 5 END / 1 KILL đúng). Harness chạy TRONG lúc repair apt-get update (tiền lệ đợt 199: chunk 3–4 chạy trong repair #129) — 120/120 đứng. Lỗi cosmetic "No such file or directory" ở các dòng wc -l trên T4LOG_A (file gốc không tồn tại) — fallback về 0 vẫn đúng (xem F-200-T56-8).
- T4-200 monitor (cả hai đường log — F-198-T56-3): T4 chỉ ghi vào `hidden_files/round200-t4/poll-t4.log` (đường mới trong thư mục); file gốc `hidden_files/round200-t4-poll.log` KHÔNG TỒN TẠI. T4 poll-wait từ ~11:41Z, poll 45 s, deadline 13:30:00Z; gate: GATE_OPEN=1 cần gate0 (T5 PASS) + PB=0 + APTN=0 + TREEOK + **load1<2 + load5<2** + RAM≥1024 + LOCKOK + BLOCKERS=0. T4 thấy cờ #130 ở poll #29 (12:01:09Z, t5flag=PASS, gate0=T5) và mở attempt NGAY (3 s sau cờ).
- **attempt1: CUA YEN MO poll #29 12:01:09Z → ACQUIRED 12:01:09Z → RELEASED 12:04:42Z (hold 213 s); exit=0, 20/20 + LỚP B ĐẠT 5/5 + tickCost median=55,0 ms ≤ 60 — LƯỢT HỢP LỆ, poller thoát 12:05:10Z** (đã dùng ngân sách 1/3). **Lượt yên #68: CÓ 1 LƯỢT HỢP LỆ — chuỗi lượt yên hợp lệ 0 → 1 (ĐỀ XUẤT của T4; parent quyết (m)-200).** Verdict thuộc T4-200/T10-200 + parent; T56 chỉ ghi nhận. T4 LIMITS chưa có lúc T56 đóng (T4 đang chạy analyzers).
- .done 200 lúc T56 đóng: P1, P2, P4, T01, T2, T5 (6 file). Chưa đóng: P3, T4, T7, T8, T9, T56 (đợt này), T10.

## §7. Prune 74

- Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa `cooldown-*` mtime >7 ngày (find -mtime +7 = ≥192h); (b) trần mềm 100 file; (c) không xóa file đợt hiện tại/ngay trước; (d) ghi tên + số file xóa; (e) chỉ chạy khi lock trống.
- Chạy ~11:54:31Z, lock trống đã kiểm trước/sau (dòng cuối RELEASED 11:50:36Z t01-200; T4 vẫn poll-wait, chưa acquire; harness đang chạy nhưng không chạm lock log). **XÓA 4 FILE theo điều (a):** cooldown-t8-round144 (~194h), cooldown-t10-round144 (~192h), cooldown-t8-round145 (~194h), cooldown-t10-round145 (~192h). Queue: 88 file / 1232 B → **84 file / 1176 B**. Tầng tuổi: ≥192h: 4 → 0; ≥168h: 15 → 11; ≥72h: 59 → 55; ≥48h: 70 → 66. Điều (b) KHÔNG kích hoạt (84 < 100). Ghi `prune-time.txt` + `prune-deleted.txt`. **F-147-T6-1 — CHUỖI VẪN 0, lần thứ 21 liên tiếp sau khi đứt tại 179** (các file xóa đều qua mốc 168h lúc xóa).
- Prune 73 đợt 199: xóa 4 file (cooldown-t10/t8-round143/142), queue 90 → 86 (tham chiếu).

## §8. Findings F-200-T56-n (ghi nhận)

- **F-200-T56-1:** watcher-200 spawn kịp thời (START 11:39:46Z pid 7406; khoảng không-watcher 11.035 s từ END watcher-199 08:35:51Z — ngắn hơn 11.578 s đợt 199; T56-201 phải spawn watcher-201 kịp thời sau 14:35:51Z).
- **F-200-T56-2:** monitor kill suite lần đầu ĐÚNG THIẾT KẾ (T01 ACQUIRED 11:43:24Z → kill 11:43:28Z); resume run4–6 sau release; suite vẫn đứng 9/9 ×6. Bài học: suite 6 run trong một process — kill giữa chừng cần resume script riêng (đã viết `suite-resume-200.sh` cho đợt sau dùng lại mẫu này).
- **F-200-T56-3:** W1 mở chỉ 3 s sau cờ (12:01:06Z → 12:01:09Z) — verify độc lập đợt này KHÔNG kịp chạy trước cửa sổ như đợt 199; đã chờ W1 đóng (RELEASED 12:04:42Z, poller thoát 12:05:10Z) rồi verify 12:05:52Z ngoài cửa sổ (b) — đúng (p2)-198. windows.md lúc verify vẫn ghi W1 "ĐANG CHẠY" (chưa cập nhật) — lock log là chuẩn.
- **F-200-T56-4:** repair #130 append ledger dòng 2 (ts 1795780866, added 106) — ĐÚNG THIẾT KẾ (T5-200 §1/§6(a)); **F-199-T56-9 ĐÓNG.** Ba lớp khớp: apt log 108−2=106, ledger added 106, snapshot 784→890 (+106).
- **F-200-T56-5:** T5-200 LIMITS sai 2 timestamp (không ảnh hưởng kết luận): btime #130 ghi "11:35:01Z" (đúng 11:21:41Z — `date -d @1795778501` + uptime -s khớp; 11:35:41Z là mtime dpkg.log, không phải btime) và early-repair deadline "11:50:01Z" (đúng 11:36:41Z = btime+15'). Watcher-200 dùng btime đúng từ /proc/stat nên trigger 11:45:49Z đúng thiết kế. Không sửa LIMITS T5 (chỉ ghi nhận ở đây).
- **F-200-T56-6:** T01-200 .done ghi "watcher-200 CHƯA SPAWN" là SAI/stale — watcher-200 spawn 11:39:46Z pid 7406, TRƯỚC khi T01 đóng (~11:54Z); T01 viết câu đó từ trạng thái lúc survey 11:39:01Z (trước spawn 45 s). Không ảnh hưởng kết luận boot của T01.
- **F-200-T56-7:** socket X11 X193 sót sau attempt1 T4 (tạo 12:01Z, Xvfb đã chết, socket còn lúc snapshot 12:06Z) — 1 leftover orphan, không phải server sống; không thuộc T56 dọn.
- **F-200-T56-8:** cosmetic "No such file or directory" trên T4LOG_A (đường gốc không tồn tại) trong gate-check/monitor — fallback 0 vẫn đúng (như F-199-T56-8); số "124/4" của runner là artifact (120/0 thật). Không sửa script giữa đợt.
- **F-200-T56-9:** boot c073c8bb CÓ ĐIỀU KIỆN về số hiệu (daemon restart 08:41:43Z chưa giải quyết — T01-200 F-200-T01-9, 0 witness). POSTBOOT flag ghi theo boot_id nên không phụ thuộc số hiệu; parent quyết (e)-200 (#130 hay #131).
- **F-199-T56-9 ĐÓNG** (T5-200: cơ chế silencing đúng; xem §1.5).
- **F-199-T10-5 ĐÓNG** (T2-200: script thật của parent đợt 197 là `/tmp/count-197-check.py` + `.sh`; AGENTS.md dòng 61 đúng tên, sai chi tiết giờ 23:43Z/23:45:15Z + "file đã tồn tại trước lượt"; KHÔNG sửa AGENTS.md/MEMORY.md/aggregate 197).
- **(p)(iii)-199 bổ sung (T2-200):** nguồn node W2/W3 đợt 199: W2 tsc = P1-199 (VI PHẠM), W3 test = P3-199 (VI PHẠM NHẸ) — parent quyết ở aggregate 200.
- Các F-199-T56-n khác tham chiếu từ LIMITS T56-199 (F-199-T56-2: gate-check baseline — đã giữ; F-199-T56-3: monitor $! trực tiếp — đã giữ; F-199-T56-5: caveat đồng hồ guest — không gặp đợt này; F-199-T56-8: artifact đếm "124/4" — lặp lại, xem F-200-T56-8).

## §9. Đề xuất cho parent (quyết ở aggregate 200)

- (a) Chấp nhận phần T56 đợt 200 (watcher-200, POSTBOOT #130, lock, (A), suite, prune 74, marker).
- (b) Cờ #130 repair-som-quyet-h poll=1 — parent chọn caveat (b1) hay không caveat (b2). (T56 đề xuất: caveat **(b1)** như #125/#126/#127/#129 — repair, không phải replay đầy đủ như #128.)
- (c) Xác nhận c073c8bb = #130 HAY #131 (daemon restart 08:41:43Z — T01-200 F-200-T01-9, 0 witness). (T56 đề xuất: giữ #130 trừ khi có bằng chứng reboot; verdict holder/marker không đổi dù chọn số nào — xem (d)/(i).)
- (d) Holder #130 KHÔNG GIẾT — chuỗi 5 → 6 (nếu #130 xác nhận); nếu #131 thì chuỗi 5 → 7 (cả hai boot đều trống lock — boot trung gian không có boot_id riêng).
- (e) (A) lần 49 (5.880/5.880) + suite xanh chuỗi 81.
- (f) Prune 74 (xóa 4, queue 88 → 84); F-147-T6-1 chuỗi VẪN 0 lần 21.
- (g) Hướng (3) lần thứ 46.
- (h) WebKit libs — #130 VẮNG (debroot giữ). KHÔNG cài tay.
- (i) **Marker 80 ĐÃ XÁC MINH → 81 nếu c073c8bb = #130** (82 nếu có thêm boot 08:41:43Z, tức #131): đường dẫn `/home/hatch/.config/vcut-persistence-marker`, 239 B, mtime 2026-11-20 11:39:47Z, md5 cb7102c0 — sống qua boot mới.
- (j) Ledger dòng 2 mới (repair #130, added 106) — đúng thiết kế; **F-199-T56-9 ĐÓNG** (T5-200).
- (k) Lượt yên #68: attempt1 20/20 HỢP LỆ — chuỗi lượt yên hợp lệ 0 → 1 (đề xuất của T4; parent quyết (m)-200).
- (l) F-199-T10-5 ĐÓNG (T2-200: script thật `-check`); (p)(iii)-199 bổ sung: W2 tsc = P1-199 VI PHẠM, W3 test = P3-199 VI PHẠM NHẸ (T2-200).
- (m) Tổng boot không cờ GIỮ 31 (#124 là boot duy nhất không cờ).
- (n) Watcher-201 spawn kịp thời sau 14:35:51Z (END watcher-200).

## §10. Sai số của chính T56-200

- Suite lần đầu bị kill giữa chừng (11:43:28Z) — KHÔNG phải lỗi của T56 (monitor hoạt động đúng; T01 acquire không báo trước được) — nhưng phơi ra thiết kế suite 6-run-một-process cần resume riêng; đã viết `suite-resume-200.sh` (giữ nguyên run1–3, chỉ chạy run4–6).
- Không kiểm `round-in-progress.md` ngay lúc mở (11:38Z) — chỉ kiểm lúc đóng (12:07Z, không có). Đợt chạy từ cron bình thường nên gate chắc chắn sạch lúc mở; lần sau kiểm ngay lúc mở.
- Lock count cuối lấy 12:06Z — nếu T4/T8/T9 acquire sau đó, số sẽ lệch; T10 dedup toàn cục là chuẩn. Chênh ACQ−REL = 13 STALE vẫn đúng tại thời điểm đếm (held 0).
- Giả định "verify kịp chạy trước W1" (như đợt 199) là SAI đợt này — W1 mở chỉ 3 s sau cờ; đã chờ W1 đóng rồi mới verify (đúng (p2)-198), không verify trong cửa sổ (b).
- Phiên exec spawn watcher (`proc_9d42b2c3a9cc`) còn backgrounded — cố ý, KHÔNG kill (sẽ giết watcher). Parent/T10 lưu ý không kill session này.
- #130 chỉ trống lock 15.084 s trước btime? Không — lock trống 07:32:00Z–11:43:24Z (15.084 s), btime nằm giữa; verdict KHÔNG GIẾT không phụ thuộc số hiệu boot. (Ghi rõ để tránh nhầm với biên mỏng 36 s của #129.)

## §11. Batch stage

- 1 file mới: `docs/PHASE9_ROUND200_T56_INFRA_LOCK_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round200-t56-infra-lock.txt` (NUL-delimited, 1 entry).
- KHÔNG stage file làm việc trong `hidden_files/round200-t56/` (script, log, cờ, backup, prune log, churn log — chỉ để tham chiếu).
- Chờ push: 191–199 = 107/435/333/312 (theo aggregate 199 §14.2) + đợt 200 (sau khi T10-200 đếm lại bằng dedup toàn cục) + 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` (số phận chưa quyết).
