# PHASE 9 — ROUND 201 — T56: INFRA / WATCHER / LOCK — LIMITS

**Đợt:** 201. **Luồng:** T56 — infra/watcher + POSTBOOT_PASS + lock + prune + marker.
**Trạng thái:** ĐÃ ĐÓNG. Watcher-201 đang chạy (respawn pid 7520, START 15:07:17Z, boot 7d642f2a, END 17:35:51Z). POSTBOOT_PASS #131 ĐÃ CÓ cờ (replay đầy đủ).
**Kết quả chính:** REBOOT 15:04:25Z giữa đợt — boot mới 7d642f2a (ứng viên #131), replay ĐẦY ĐỦ thật (dpkg 292 → 1.510, giống #128), POSTBOOT_PASS #131 CÓ (replay-day-du, poll=0, 15:12:20Z), verify độc lập exit=0 byte-identical; (A) 120/120 lần thứ 50 (trên #131); suite 9/9 × 6 (chuỗi 81 → 82, trên #131); #131 KHÔNG GIẾT holder (chuỗi 6 → 7 nếu parent xác nhận); prune 75 xóa 2 file; marker ĐÃ XÁC MINH (81 qua #130, 82 nếu #131); T4-201 attempt1 #69 HỢP LỆ trên #130 (chuỗi lượt yên 1 → 2, đề xuất của T4).

**Nguồn quyết DUY NHẤT:** aggregate 200 §14.2 (`docs/PHASE9_ROUND200_LIMITS.md`, 83.680 B, parent CHẤP NHẬN CÓ ĐIỀU KIỆN, lượt cron 18:35 +07 27/11/2026, đếm lần thứ 156). Quyết dùng: (c) POSTBOOT #130 CÓ caveat (b1); (e) #130 XÁC NHẬN, marker 80 → 81 ĐÃ XÁC MINH; (i) holder chuỗi 5 → 6, (A) 120/120 lần 49, suite xanh 80 → 81, hướng (3) lần 46; (k) replay #130 dạng B → early-repair; (r) T56-201 spawn watcher-201 kịp thời sau 14:35:51Z + POSTBOOT #131 (nếu reboot mới) + replay.
**Nguồn đọc:** `docs/PHASE9_ROUND200_T56_INFRA_LOCK_LIMITS.md`, `hidden_files/round200-t56/`, `hidden_files/round201-t56/`, `hidden_files/round201-t5.done`, `hidden_files/round201-t01.done`, `hidden_files/round201-t4.done`, `hidden_files/round201-t4/windows.md` + `poll-t4.log`.
**Hạn cờ:** ~17:00Z 27/11/2026. **Hạn cứng:** 17:35:51Z (END watcher-201). **Đóng T56:** ~15:51Z.

## §0. Trạng thái lúc mở (~14:45Z 27/11)

- Boot hiện tại: `c073c8bb-26f3-41e8-a4b5-3d56ce3564f8`, btime 11:21:41Z (#130, ĐÃ XÁC NHẬN ở (e)-200). Không có `round-in-progress.md` (gate sạch — kiểm lúc mở 14:45Z).
- Watcher-200 ĐÃ CHẾT (hết hạn 14:35:51Z; log: REPLAY-WATCH-200-END 14:35:57Z; ps ~14:47Z: 0 process watcher/replay-watch). Khoảng không-watcher: 14:35:51Z → 14:48:33Z = **762 s** (12m42s — ngắn hơn nhiều so với 11.035 s đợt 200).
- Trạng thái lúc spawn: ỔN ĐỊNH (không đóng băng): dpkg.log **777 dòng**, md5 308b224b, mtime 12:01:06Z; cache 108; lists 75; GST hệ thống 269 file; libwebkitgtk VẮNG (dpkg -l grep webkit = 0); 0 proc apt/dpkg.
- Marker kiểm lại lúc mở 14:47Z: `/home/hatch/.config/vcut-persistence-marker`, 239 B, md5 cb7102c0, mtime 2026-11-20 11:39:47Z — **SỐNG QUA BOOT #130** (boot 81).
- T5-201 đã đóng (.done ~14:49Z): ledger không đổi (2 dòng, md5 81329ce3); boot vẫn #130. T5 ghi "watcher-201 chưa spawn lúc T5 đóng" là STALE ~30 s (spawn 14:48:33Z — xem F-201-T56-3).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1 Timeline (giờ UTC 27/11/2026)

- 11:21:41Z — btime boot c073c8bb (#130).
- 12:01:06Z — POSTBOOT_PASS #130 (repair-som-quyet-h, poll=1 — đợt 200).
- 14:35:51Z — watcher-200 hết hạn (END đợt 200).
- 14:48:33Z — watcher-201 START (pid 369613, boot c073c8bb); REPLAY_DONE + FLAG-WRITTEN trùng lặp #130 (poll0) cùng giây.
- 14:53:25Z — T01-201 ACQUIRED lock (O8); 14:56:10Z RELEASED (hold 165 s).
- 14:56:50Z — T4 W1 mở (poll #6), ACQUIRED; 15:00:24Z RELEASED (hold 214 s); 15:00:58Z poller thoát (attempt1 #69 HỢP LỆ).
- 15:03:55Z — suite lần đầu START (pgid 390298, trên #130); run1–3 9/9 (15:04:17/38/59Z).
- **15:04:25Z — btime boot MỚI 7d642f2a (REBOOT — xem §1.4).**
- 15:04:36Z — poll cuối của watcher-201 cũ; 15:04:59Z suite run3 xong.
- 15:07:17Z — watcher-201 RESPAWN (pid 7520, boot 7d642f2a).
- 15:09:19Z — dpkg 1.149 dòng; GST hệ thống 269 (đã khôi phục).
- 15:12:19Z — REPLAY_DONE #131 (dpkg 1.510); 15:12:20Z FLAG-WRITTEN #131.
- 15:14:41Z — verify độc lập #131 exit=0 (ngoài mọi cửa sổ).
- 15:15:37Z — suite mới START (pgid 15237, trên #131); run1–6 9/9, DONE 15:18:03Z.
- 15:20:45Z — harness (A) START; chunk1 15:20:45–15:22:23Z 30/30; chunk2 15:22:29–15:24:16Z 30/30; chunk3 15:24:22–15:26:06Z 30/30; chunk4 15:26:12–15:27:58Z 30/30; HARNESS-END 15:28:04Z (120/120).
- 15:28:28Z — T8-201 cycle 1 ACQUIRED; cycle 6 RELEASED 15:46:45Z (hold 232 s).
- 15:47Z — lock count cuối; 15:49:02Z — prune 75; ~15:51Z — T56 đóng.

### §1.2 Watcher-201 (spawn + respawn)

- Script tạo mới bằng generator `hidden_files/round201-t56/gen-watcher-201.py` từ `round200-t56/replay-watch-200.sh` (thay DIR → round201-t56, OLD_T5_DIR → round200-t56, LOG → replay-watch-201.log, END_EPOCH → 2026-11-27 17:35:51 UTC, REPLAY-WATCH-201-START/END/STOP, watcher-201 trong write_flag; header viết lại cho 201; bash -n OK; generator tự kiểm tra token 200 còn sót — chỉ còn tham chiếu lịch sử + OLD_T5_DIR, đúng thiết kế).
- **Spawn 1: START 14:48:33Z, pid 369613, boot c073c8bb, END 17:35:51Z.** INIT: dpkg 777 dòng, md5 308b224b, mtime 12:01:06Z, cache 108, lists 75, gst_sys 269.
- Spawn bằng đường dẫn TUYỆT ĐỐI (`nohup bash /abs/path/replay-watch-201.sh > nohup.log 2>&1 & disown` — F-167-T5-2); verify độc lập bằng ps + START line + poll đầu (14:48:33Z). Phiên exec spawn backgrounded (output không đóng do watcher là con) — **CẢNH BÁO: KHÔNG kill session exec spawn watcher — process.kill xé cả cây tiến trình sẽ giết watcher (như đợt 200, session `proc_9d42b2c3a9cc`).**
- **Watcher-201 (pid 369613) CHẾT cùng reboot 15:04:25Z** (poll cuối 15:04:36Z — poll này ghi sau btime mới 11 s vì đồng hồ guest/process còn chạy nốt? Không — poll 15:04:36Z ghi boot=c073c8bb; reboot xảy ra giữa 15:04:36Z và 15:04:59Z theo log suite/watcher; btime 15:04:25Z là giờ boot kernel, tiến trình cũ còn sống tới lúc cell reset — xem F-201-T56-2).
- **Respawn: START 15:07:17Z, pid 7520, boot 7d642f2a.** Khoảng không-watcher do reboot: poll cuối 15:04:36Z → START 15:07:17Z = **161 s**; boot mới không được watcher bao phủ: btime 15:04:25Z → START 15:07:17Z = **172 s** (2m52s). Respawn dùng đúng script cũ (không sinh lại — script đã viết END 17:35:51Z + logic new-boot; log ghi 2 START line, trung thực).

### §1.3 POSTBOOT #130 — cờ TRÙNG LẶP do watcher (re-verification, KHÔNG phải cờ mới)

- **Watcher-201 (spawn 1) viết cờ trùng lặp cho #130 lúc 14:48:33Z**: REPLAY_DONE ngay poll đầu (dpkg 777 > 100, ổn định 2 poll — stable=1 ngay vì lines == prev_lines) → postboot check-only poll0 exit=0 → FLAG-WRITTEN boot=c073c8bb mode=**replay-day-du poll=0** (old=c073c8bb), file `round201-t56/POSTBOOT_PASS` md5 **dc249b84** (314 B); log poll0 md5 **2f97a791** — byte-identical với poll1 log của watcher-200 (12:01:06Z).
- **Đây KHÔNG phải POSTBOOT_PASS mới:** logic watcher kế thừa không bỏ qua boot hiện tại đã có cờ (chỉ dùng cờ cũ để backup khi boot đổi). Cờ CHÍNH THỨC của #130 vẫn là `round200-t56/POSTBOOT_PASS` (repair-som-quyet-h, poll=1, 12:01:06Z, md5 **e95ba374** — không đổi, không bị chạm). Cờ round201 chỉ là **xác minh lại độc lập** (cùng boot, cùng kết luận PASS, khác nhãn mode).
- T4-201 đã dùng cờ này làm gate0 (`t5src=201-t56/POSTBOOT_PASS`, poll #5–#6) và mở W1 — không gây hại (cùng boot, PASS thật). Xem F-201-T56-1.

### §1.4 REBOOT 15:04:25Z — boot mới 7d642f2a + replay ĐẦY ĐỦ + POSTBOOT_PASS #131

- **Bằng chứng reboot (không phải glitch service):** phiên exec của T56 chết ~15:05Z đúng lúc reboot; boot_id mới `7d642f2a-da03-44ab-a2a1-f55b8010063f`; btime 1795791865 = **15:04:25Z** (uptime -s khớp; uptime 3' lúc 15:08:23Z); journal list-boots chỉ còn idx 0 = 7d642f2a (first 15:04:44Z); /tmp bị xóa sạch (chỉ còn node-compile-cache — như mọi reboot trước). Gap #130 → #131 = **13.764 s** (3h49m24s).
- **Replay ĐẦY ĐỦ thật (không phải early-repair):** watcher respawn thấy dpkg 292 dòng (md5 78ef0022, mtime 15:07:13Z), apt đang chạy (pid 7409) → replay đang chạy, watcher KHÔNG repair (đúng thiết kế — lines tăng + proc chạy). Tiến triển: 292 → 358 → 479 → 499 → 542 → **1.149** (15:09:19Z, GST 32 → 269) → **1.510** (15:12:19Z, apt/dpkg = 0). **REPLAY_DONE 15:12:19Z** (boot+7m54s) → postboot poll0 exit=0 → **FLAG-WRITTEN 15:12:20Z mode replay-day-du poll=0** (old=c073c8bb; cờ cũ #130 được backup thành `POSTBOOT_PASS-c073c8bb`, md5 dc249b84).
- **Hồ sơ #131 (giống #128, khác #125/#126/#127/#129/#130):** dpkg **1.510 dòng** (không phải 777), md5 f9304dc8; cache **174** (không phải 108); lists 37 (không phải 75); GST là **thư mục thật (apt)** 269=269 hệ thống/debroot; **libwebkitgtk-6.0-4 CÓ** (ii, 2.52.6) + libjavascriptcoregtk-6.0-1 (ii) — replay khôi phục lib như #128; dpkg -l 961 dòng (so với 895 trên #130). **Tổng boot không cờ GIỮ 31** (#124 là boot duy nhất không cờ — #131 CÓ cờ).
- **Số hiệu #131 là ỨNG VIÊN** (parent quyết (e)-201): T01-201.done (~15:17Z) vẫn khẳng định "KHÔNG CÓ REBOOT MỚI" từ survey 14:48:24Z (trước reboot) — STALE, xem F-201-T56-5. Cần survey mới (T01-202/T10) trước khi chốt số hiệu. Caveat (e)-200 về daemon restart 08:41:43Z/10:41:43Z không liên quan (parent đã phán daemon-only ở (e)-200; T01-201 F-201-T01-4: 0 witness mới).

### §1.5 Verify độc lập #131 — exit=0, byte-identical (ngoài mọi cửa sổ)

- **Verify độc lập: exit=0, chạy 15:14:41–15:14:42Z**, log `t56-postboot-independent-7d642f2a.log` md5 **080bdd2b** — **byte-identical với poll0 log của watcher** (cùng md5 080bdd2b578f6c4dc1dece8aa9eadc11; 8 dòng: PASS wrapper K1, 5/5 lib, GST thư mục thật 269=269 isomp4+libav, 11/11 apt, KẾT LUẬN ĐỦ ĐIỀU KIỆN). dpkg md5 f9304dc8 không đổi trước/sau (1.510 dòng) — verify chỉ đọc.
- **Chạy khi KHÔNG có cửa sổ nào mở:** T4 W1 đã đóng 15:00:24Z, poller thoát 15:00:58Z (trước reboot); sau reboot T4 chưa mở cửa sổ mới (windows.md vẫn chỉ có W1 trên #130); lock log không có ACQUIRED nào sau 15:00:24Z cho tới T8 15:28:28Z. Verify 15:14:41Z nằm ngoài mọi cửa sổ (b) — đúng (p2)-198.

### §1.6 Ledger — fold 2 → 1 dòng sau replay #131 (không append — đúng thiết kế silencing)

- Ledger `/var/lib/hatch/os-intent/ledger.jsonl`: **2 dòng** (5.016 B, md5 81329ce3, mtime 12:01:06Z — T5-201) → **1 dòng COMPACTED** (3.107 B, md5 e3b9d767, mtime 15:11Z). Dòng duy nhất: ts 1795780866 (= 12:01:06Z, repair #130), compacted=true, **added 173, removed 0**, gồm libwebkitgtk-6.0-4 + libjavascriptcoregtk-6.0-1.
- `dpkg-state.txt`: 890 dòng (12:01:06Z) → **956 dòng** (mtime 15:11Z).
- Journal intent/fold kể từ btime #131: **0 dòng** (grep "intent"/"fold" — không có entry nào).
- **Kết luận T56 (thô — chi tiết thuộc T5-202):** replay #131 KHÔNG append dòng ledger mới (số dòng 2 → 1 do fold, không phải 2 → 3) — đúng thiết kế silencing (chỉ repair mới append; xem T5-200 §6). Điểm cần T5-202 làm rõ: dòng compacted giữ ts của repair #130 nhưng added=173 (bằng dòng 1 cũ) và gồm webkit — recorder reseed từ trạng thái dpkg hiện tại (đã có webkit sau replay) hay fold từ 2 dòng cũ (dòng 2 ⊆ dòng 1 theo T5-201, hợp là 173)? T56 không phán cơ chế, chỉ ghi số liệu.

## §2. GST + WebKit (h)-198

- GST #131: **thư mục thật (apt)**, 269 file hệ thống = 269 debroot (isomp4 + libav đủ). Giống #128; khác #129/#130 (symlink → debroot).
- WebKit libs: #131 **CÓ** (libwebkitgtk-6.0-4 ii 2.52.6 + libjavascriptcoregtk-6.0-1 ii). NEED 11 gói đủ cả 11 (poll0 log: PASS apt 11/11). **KHÔNG cài tay** (không cần — replay đã khôi phục; đúng (h)-198).
- #130 (trước reboot): VẮNG webkit (debroot giữ) — đã ghi ở (h)-200, không đổi.

## §3. Cờ cũ — md5 (kiểm lại lúc đóng)

- #131 (mới, 15:12:20Z, replay-day-du poll=0): **f691ab08** (315 B)
- #130 trùng lặp round201 (14:48:33Z, replay-day-du poll=0; backup POSTBOOT_PASS-c073c8bb): **dc249b84** (314 B)
- #130 chính thức round200 (12:01:06Z, repair-som-quyet-h poll=1): **e95ba374** — không đổi
- #129 (07:08:07Z, repair-som-quyet-h poll=1; backup POSTBOOT_PASS-e6e070b8): **e09dfd4c** — khớp đợt 200
- #128 (05:51:25Z, replay-day-du poll=0; backup POSTBOOT_PASS-773743f2): **62c1346c**
- #127: **153d57e7** — #126: **f076a945** — #125: **48fec087** — #123: **e94fad95** — #121: **28847b1e** — #119: **863a6035**. Tất cả KHỚP đợt 200.

## §4. T01-201 O8 + ENOSPC + (m) thô

- T01-201 O8 trên #130 (theo T01-201 .done — T56 chỉ ghi nhận): WebKit attempt1 exit=0 21/21 (md5 37b2572d) + attempt2 exit=0 21/21 (md5 fe58294c) + Chromium exit=0 21/21 (md5 bac61a70); 0 lỗi exit 127; S1 PASS cả 2 attempt; cả 3 bộ CÙNG CÂY (preview.tsx 477a0eac + media.ts ac89aeb2). **Chân FULL PASS "O8 3/3" ĐẠT đợt này** (khác đợt 200: 2/3).
- (m) #130 THÔ = 0 requeue (eid 11596 → 11597; phân loại CUỐI thuộc T2-201). Run 209 SUCCEEDED 14:35:13Z; run 210 RUNNING lúc T01 đọc.
- ENOSPC (T56 chỉ đếm thô — chuỗi thuộc T9-201): #130 = **175 dòng** (journalctl từ btime 11:21:41Z, đếm lúc 14:55:07Z); #131 = **34 dòng** (journalctl từ btime 15:04:25Z, đếm lúc ~15:50Z); dmesg = 0 cả hai. Phương pháp: `journalctl --since <btime> --grep "No space left on device" | wc -l` (số T9-200 ở (l)-200: #130 = 122 dòng — khác phương pháp/cửa sổ đếm; T56 chỉ báo số thô của mình).

## §5. Lock health (T6)

### §5.1 Số đếm cuối (15:47Z, analyze-log.py trên vite-lock-v2.log)

- total cleaned 3058 / raw 3064; TICKET 886 / ACQUIRED 875 / RELEASED 862; COOLDOWN 411 / STALE-LOCK 13 / STALE-TICKET 1 / TIMEOUT 10; pairs 862; double-acquire 7; still_held_at_end=0; held_owners=[].
- So với T56-200 kiểm cuối (12:06Z: 3006/3012; 872/861/848; COOLDOWN 401; STALE-LOCK 13; pairs 848; double-acquire 7; held 0): Δ raw +52, cleaned +52, TICKET +14, ACQUIRED +14, RELEASED +14, COOLDOWN +10, STALE-LOCK 0, pairs +14, double-acquire 0. Chênh ACQ−REL = 875−862 = **13 = 13 STALE (giữ nguyên) + 0 đang giữ**.
- 52 dòng mới đối chiếu khớp từng dòng: t01-round201 ×3 (TICKET + ACQUIRED + RELEASED 14:53:25–14:56:10Z) + t4 ×3 (14:56:50–15:00:24Z) + t8-round200 ×23 (sau 12:06Z, các cycle muộn đợt 200) + t8-round201 ×23 (6 cycle 15:28:28–15:46:45Z). 0 dòng nào của T56 trên log thật. 0 RELEASED không ACQUIRED trước, 0 TIMEOUT mới (cuối 19/11 15:50:28Z). **Kết luận: lock KHỎE.**
- T01 O8 giữ lock 14:53:25–14:56:10Z (hold 165 s). T4 giữ lock attempt1 14:56:50–15:00:24Z (hold 214 s). T8-201 6 cycle, hold dài nhất 232 s (cycle 6).

### §5.2 #131 KHÔNG GIẾT HOLDER — chuỗi 6 → 7 (nếu parent xác nhận 7d642f2a = #131)

- Dòng lock cuối trước btime 15:04:25Z là t4 RELEASED 15:00:24Z; dòng đầu sau btime là t8-round201 TICKET 15:28:28Z. Lock trống liên tục 15:00:24Z–15:28:28Z (**1.684 s**) nên verdict không phụ thuộc số hiệu boot. **#131 KHÔNG GIẾT HOLDER.**
- Tương tự #130 (đợt 200): lock trống 07:32:00Z–11:43:24Z (15.084 s). Chuỗi holder: 5 → 6 (#130, (i)-200) → **7** (#131, nếu xác nhận).

### §5.3 Snapshot zombie / X11 / ss (15:49:48Z)

- Snapshot: zombie 0; socket X11 **0**; Xvfb 0; listener 0.0.0.0:8765 = 0.
- Socket X193 sót từ đợt 200 (F-200-T56-7) đã biến mất — /tmp bị xóa sạch khi reboot 15:04:25Z (không phải do dọn tay). Snapshot lúc 14:55Z (trước reboot) còn 2 socket (X192 của T01-201 + X193 orphan); sau reboot sạch 0.

## §6. (A) + suite + monitor + T4-201 (ghi nhận)

- Script: suite `apps/web/scripts/test-vite-lock-v2.sh` md5 **a89c0676** (không đổi). Poll script `vcut-poll-quiet-v2.sh` md5 **1710e480**; lock v2 `vcut-vite-lock-v2.sh` md5 **520b8baa**; lock v1 `vcut-vite-lock.sh` md5 **fd21193c** (cả ba khớp đợt 200). Khối T7 trích `t7-block-a201.sh` (trích lại từ suite mỗi lần chạy, verbatim).
- 4 script 201 sinh bằng `hidden_files/round201-t56/gen-suite-201.py` từ bản 200 + **giữ SUA F-198-T56-3 (monitor + gate-check xem CẢ HAI đường poll log T4) + SUA F-199-T56-2 (gate-check chỉ xét dòng MỚI kể từ baseline)**: `t7-gate-monitor-201.sh`, `run-harness-201.sh`, `suite-runner-201.sh`, `t7-control-a201.sh`. Tất cả bash -n OK. Generator tự kiểm tra token chức năng 200 còn sót (chỉ còn tham chiếu lịch sử F-200/dot 200).
- **Suite lần đầu (trên #130): 9/9 × 3, rc=0 cả 3** (run1–3: 15:03:55–15:04:59Z) — **BỊ GIẾT GIỮA CHỪNG DO REBOOT** (không phải monitor kill: không có dòng KILL nào; cả suite-runner lẫn monitor đều chết cùng cell reset). Log + 3 file run đã archive thành `suite-201-c073c8bb-partial.log` + `test-v2-t6-run{1,2,3}-c073c8bb.log` (KHÔNG tính vào chuỗi).
- **Suite chạy lại (trên #131): 9/9 × 6 lượt, rc=0 cả 6** (run1–6: 15:15:37–15:18:03Z). Chuỗi suite xanh 81 → **82**. Chạy theo (p1)-198 (gate thực chất + monitor 5 s + kiểm 0 chồng lấn sau): gate-check lúc suite bắt đầu (lock trống — RELEASED 15:00:24Z; T4 poller đã thoát, 0 attempt đang chạy).
- **Monitor pgid sai lúc đầu (F-201-T56-4):** suite lần 2 khởi động monitor bằng pid pgrep được (15233) thay vì pgid setsid thật (15237) — monitor đó không giám sát được process group; T56 phát hiện sau ~90 s (ps cho thấy suite pgid=15237, monitor cầm 15233), kill monitor sai và khởi động lại với pgid đúng 15237 (MONITOR-START 15:17:01Z; MONITOR-END 15:18:07Z "0 cua mo"). Suite không được giám sát 15:15:39–15:17:01Z nhưng không có sự kiện gate nào trong cửa sổ đó (lock log không đổi, poll-t4.log không thêm dòng) — 0 ảnh hưởng.
- **Harness (A): 120/120 PASS, 0 FAIL** (15:20:45–15:28:04Z; chunk 1: 15:20:45–15:22:23Z; chunk 2: 15:22:29–15:24:16Z; chunk 3: 15:24:22–15:26:06Z; chunk 4: 15:26:12–15:27:58Z; mỗi chunk 30/30, rc=0). **(A) lần thứ 50 (tổng 6.000/6.000).** B1=1 B2=0 cả 120 lần (grep chính xác `^run [0-9]+ -> PASS` = 120, `-> FAIL` = 0; "124/4" của runner là artifact đếm cả 4 dòng summary chunk — xem F-201-T56-6, cùng lớp F-199-T56-8). Churn delays: 120 dòng, min 506 ms, max 3.492 ms, avg 1.930,69 ms. Gate-check mỗi chunk đều qua (acquired_raw=871; BASE_ACQ=871 lúc harness bắt đầu). Monitor 5 s bọc mỗi chunk (dual-path): 4 lần MONITOR-START/END, đều "0 cua mo" (tổng monitor đợt này: suite 3 START / 1 END — 2 monitor chết cùng reboot/khi bị kill, không ghi END — + harness 4 START / 4 END; 0 KILL).
- T4-201 monitor (cả hai đường log — F-198-T56-3): T4 chỉ ghi vào `hidden_files/round201-t4/poll-t4.log` (đường mới trong thư mục); file gốc `hidden_files/round201-t4-poll.log` KHÔNG TỒN TẠI (lỗi cosmetic "No such file" như F-200-T56-8). T4 poll-wait từ ~14:53Z, poll 45 s; gate: GATE_OPEN=1 cần gate0 (T5 PASS) + PB=0 + APTN=0 + TREEOK + **load1<2 + load5<2** + RAM≥1024 + LOCKOK + BLOCKERS=0. T4 thấy cờ #130 (trùng lặp round201) ở poll #6 (14:56:50Z, t5flag=PASS, gate0=T5) và mở attempt NGAY.
- **attempt1 #69: CUA YEN MO poll #6 14:56:50Z → ACQUIRED 14:56:50Z → RELEASED 15:00:24Z (hold 214 s); exit=0, 20/20 + LỚP B ĐẠT 5/5 + tickCost median=50,5 ms ≤ 60 — LƯỢT HỢP LỆ, poller thoát 15:00:58Z** (đã dùng ngân sách 1/3; W2/W3 không chạy). **Lượt yên #69: CÓ 1 LƯỢT HỢP LỆ — chuỗi lượt yên hợp lệ 1 → 2 (ĐỀ XUẤT của T4; parent quyết (m)-201).** Live-check #20: KHÔNG ĐẠT (24 spike B2 trong W1 — đề xuất của T4; parent quyết). B2 dữ kiện #13 (24 spike). Verdict thuộc T4-201/T10-201 + parent; T56 chỉ ghi nhận.
- .done 201 lúc T56 đóng: P2, T01, T4, T5 (4 file). Chưa đóng: P1, P3, P4, T2, T7, T8, T9, T10, T56 (đợt này).

## §7. Prune 75

- Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa `cooldown-*` mtime >7 ngày (find -mtime +7 = ≥192h); (b) trần mềm 100 file; (c) không xóa file đợt hiện tại/ngay trước; (d) ghi tên + số file xóa; (e) chỉ chạy khi lock trống.
- Chạy 15:49:02Z, lock trống đã kiểm trước/sau (dòng cuối RELEASED 15:46:45Z t8-round201; T8 đã xong 6 cycle, không acquire mới sau đó). **XÓA 2 FILE theo điều (a):** cooldown-t10-round146 (Nov 19 14:14, ~196h), cooldown-t8-round146 (Nov 19 12:35, ~197h). Queue: 87 file / 1218 B → **85 file / 1190 B**. Tầng tuổi: ≥192h: 2 → 0; ≥168h: 12 → 10; ≥72h: 56 → 54; ≥48h: 67 → 65. Điều (b) KHÔNG kích hoạt (85 < 100). Ghi `prune-time.txt` + `prune-deleted.txt`. **F-147-T6-1 — CHUỖI VẪN 0, lần thứ 22 liên tiếp sau khi đứt tại 179** (cả 2 file xóa đều qua mốc 168h lúc xóa).
- Prune 74 đợt 200: xóa 4 file (cooldown-t10/t8-round144/145), queue 88 → 84 (tham chiếu).

## §8. Findings F-201-T56-n (ghi nhận)

- **F-201-T56-1:** watcher-201 viết cờ TRÙNG LẶP cho #130 (replay-day-du poll0 14:48:33Z) — logic kế thừa không bỏ qua boot hiện tại đã có cờ (chỉ backup cờ cũ khi boot đổi). Cờ chính thức #130 (repair, e95ba374) nguyên vẹn; cờ trùng lặp chỉ là xác minh lại (poll0 log byte-identical với poll1 đợt 200). T4 đã dùng cờ trùng lặp làm gate0 — không gây hại. Bài học: generator đợt sau nên dạy watcher kiểm tra cờ cũ cùng boot trước khi REPLAY_DONE (ghi "ALREADY PASS" thay vì FLAG-WRITTEN) — để T56-202 cân nhắc, không sửa giữa đợt.
- **F-201-T56-2:** reboot 15:04:25Z giết watcher-201 pid 369613 + suite lần đầu (run1–3 trên #130) + phiên exec của T56 (service restart chính là reboot — btime + uptime + /tmp sạch chứng minh). Respawn pid 7520 lúc 15:07:17Z; khoảng không-watcher 161 s; boot mới không bao phủ 172 s. Bài học: watcher-201 respawn bằng đúng script cũ là đủ (logic new-boot đã có sẵn); không cần sinh script mới giữa đợt.
- **F-201-T56-3:** T5-201 .done ghi "watcher-201 chưa spawn lúc T5 đóng" là SAI/stale ~30 s (spawn 14:48:33Z, T5 đóng ~14:49Z). Không ảnh hưởng kết luận ledger của T5.
- **F-201-T56-4:** monitor suite lần 2 khởi động với pgid sai (15233 từ pgrep thay vì 15237 từ setsid $!) — phát hiện sau ~90 s, kill + khởi động lại đúng. Bài học: LUÔN dùng `$!` của setsid làm pgid cho monitor (harness runner đã làm đúng); không dùng pgrep để lấy pgid.
- **F-201-T56-5:** T01-201 .done (~15:17Z) khẳng định "KHÔNG CÓ REBOOT MỚI" từ survey 14:48:24Z (trước reboot 15:04:25Z) — STALE; reboot 7d642f2a làm câu đó sai. T01 cũng trích watcher pid 369613 (đã chết). Số hiệu #131 CHƯA được T01 xác nhận trên dữ liệu tươi — cần survey mới (T01-202/T10) trước khi parent quyết (e)-201.
- **F-201-T56-6:** artifact đếm "124/4" của runner lặp lại (F-199-T56-8): grep thô "PASS"/"FAIL" đếm cả 4 dòng summary chunk (PASS=30/FAIL=0 mỗi dòng). Số thật 120/0 (grep `^run [0-9]+ -> PASS/FAIL`). Không sửa script giữa đợt.
- **F-201-T56-7:** snapshot 14:55Z còn 2 socket X11 (X192 của T01-201 + X193 orphan đợt 200); sau reboot sạch 0 (F-200-T56-7 tự hết do /tmp bị xóa — không phải dọn tay).
- **F-201-T56-8:** chồng lấn trong W1 của T4 (T2-201 ghi 3 file 14:56:56Z/14:57:28Z/14:59:21Z; eperm-probe log + .heartbeat mtime 14:59:59Z) — T4-201 đã ghi nhận đầy đủ, giao T2/parent phán (p)-201; T56 chỉ ghi nhận, không phán.
- **F-201-T56-9:** ledger fold 2 → 1 dòng sau replay #131 (xem §1.6): không append (đúng silencing), nhưng dòng compacted gồm webkit — cơ chế fold/reseed thuộc T5-202 làm rõ. Không báo động theo quy tắc T5-200 §6(c).
- **F-201-T56-10 (caveat chuỗi):** suite/(A) đợt 201 đo trên **#131**, còn lượt yên #69 đo trên **#130** (reboot xen giữa) — hai boot khác nhau trong một đợt. Parent quyết chuỗi suite xanh (81 → 82) và (A) lần 50 có tính không, và FULL PASS đợt 201 tính theo boot nào.
- Các F-200-T56-n khác tham chiếu từ LIMITS T56-200 (F-200-T56-2: monitor kill đúng thiết kế — không gặp đợt này; F-200-T56-8: artifact đếm — lặp lại, xem F-201-T56-6).

## §9. Đề xuất cho parent (quyết ở aggregate 201)

- (a) Chấp nhận phần T56 đợt 201 (watcher-201 + respawn, POSTBOOT #131, lock, (A), suite, prune 75, marker).
- (b) Cờ #131: **CÓ, không caveat (b2)** (replay ĐẦY ĐỦ thật như #128 — dpkg 1.510, GST thư mục thật, webkit đủ; T56 đề xuất (b2), khác #125/#126/#127/#129/#130 là repair caveat (b1)). Cờ #130 trùng lặp (replay-day-du poll0 14:48:33Z) chỉ là xác minh lại — không phải cờ mới, không đổi (c)-200.
- (c) Xác nhận 7d642f2a = **#131** (ứng viên; cần survey mới — T01-201.done stale, xem F-201-T56-5).
- (d) Holder #131 KHÔNG GIẾT — chuỗi 6 → 7 (nếu #131 xác nhận).
- (e) (A) lần 50 (6.000/6.000) + suite xanh chuỗi 82 (caveat F-201-T56-10: đo trên #131, lượt yên #69 trên #130).
- (f) Prune 75 (xóa 2, queue 87 → 85); F-147-T6-1 chuỗi VẪN 0 lần 22.
- (g) Hướng (3) lần thứ 47 (đề xuất +1 theo (i)-200; parent quyết).
- (h) WebKit libs — #131 CÓ (replay khôi phục). KHÔNG cài tay.
- (i) **Marker 81 ĐÃ XÁC MINH → 82 nếu 7d642f2a = #131**: đường dẫn `/home/hatch/.config/vcut-persistence-marker`, 239 B, mtime 2026-11-20 11:39:47Z, md5 cb7102c0 — sống qua boot mới.
- (j) Ledger fold 2 → 1 dòng sau replay #131 (không append — đúng silencing); T5-202 kiểm chi tiết cơ chế fold + webkit trong danh sách compacted.
- (k) Lượt yên #69: attempt1 20/20 HỢP LỆ — chuỗi lượt yên hợp lệ 1 → 2 (đề xuất của T4; parent quyết (m)-201). Live-check #20 KHÔNG ĐẠT — chuỗi live ĐẠT 1 → 0 (đề xuất của T4).
- (l) Chuỗi 12/12: CHƯA quyết được lúc T56 đóng (đợt chưa đóng sổ; T10-201 quyết theo (i)-200).
- (m) Tổng boot không cờ GIỮ 31 (#124 là boot duy nhất không cờ; #131 CÓ cờ).
- (n) Watcher-202 spawn kịp thời sau 17:35:51Z (END watcher-201).
- (o) Replay #131: replay ĐẦY ĐỦ thật đã xảy ra (thứ hai kể từ #123, sau #128) — ghi nhận. Replay #130: KHÔNG CÓ replay đầy đủ (dạng B → early-repair — (k)-200 đứng).
- (p) T01-201.done stale về reboot (F-201-T56-5) — cần re-survey boot trước khi quyết (e)-201.

## §10. Sai số của chính T56-201

- Monitor suite lần 2 khởi động với pgid sai (pgrep thay vì setsid $!) — đã phát hiện và sửa trong ~90 s, 0 ảnh hưởng (F-201-T56-4). Lần sau: luôn dùng `$!` của setsid.
- Không lường trước watcher viết cờ trùng lặp cho boot đã có cờ (F-201-T56-1) — đã xác minh là vô hại (cờ chính thức nguyên vẹn, T4 dùng được), nhưng lẽ ra generator nên chặn từ đầu. Đề xuất sửa cho đợt 202, không sửa giữa đợt.
- Suite lần đầu (trên #130) bị reboot giết sau run3 — KHÔNG phải lỗi của T56 (cell reset); đã archive partial và chạy lại đủ 6 run trên #131. Chuỗi suite đợt này gắn với #131 (caveat F-201-T56-10).
- Lock count cuối lấy 15:47Z — nếu T8/T9 acquire sau đó, số sẽ lệch; T10 dedup toàn cục là chuẩn. Chênh ACQ−REL = 13 STALE vẫn đúng tại thời điểm đếm (held 0).
- Phiên exec spawn watcher-201 respawn còn backgrounded — cố ý, KHÔNG kill (sẽ giết watcher pid 7520). Parent/T10 lưu ý không kill session này.
- Giả định "verify #131 kịp chạy trước W1 mới" là SAI bối cảnh — sau reboot T4 chưa mở cửa sổ mới nên verify chạy ngoài cửa sổ là đúng, không phải "trước cửa sổ" như đợt 199/200.

## §11. Batch stage

- 1 file mới: `docs/PHASE9_ROUND201_T56_INFRA_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round201-t56-infra.txt` (NUL-delimited, 1 entry).
- KHÔNG stage file làm việc trong `hidden_files/round201-t56/` (script, log, cờ, backup, prune log, churn log — chỉ để tham chiếu).
- Chờ push: 191–200 = 120/460/355/334 (theo aggregate 200 §14.2) + đợt 201 (sau khi T10-201 đếm lại bằng dedup toàn cục) + 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` (số phận chưa quyết).
