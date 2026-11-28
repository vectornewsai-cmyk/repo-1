# PHASE 9 — ROUND 203 — T56: INFRA / WATCHER / LOCK — LIMITS

**Đợt:** 203. **Luồng:** T56 — infra/watcher + POSTBOOT_PASS + lock + prune + marker.
**Trạng thái:** ĐÃ ĐÓNG. Watcher-203 đang chạy (pid 296433, START 23:53:07Z, boot 8ea1f5e3, END 02:35:51Z). POSTBOOT_PASS #135 ĐÃ CÓ cờ (repair-som-quyet-h, poll=1, verify độc lập byte-identical).
**Kết quả chính:** MỘT REBOOT trong đợt — #135 (btime 23:06:56Z, giết watcher-202; khoảng không-watcher 2.748 s). Repair #135 xong 23:55:18Z (dpkg 777). Repair #134 KIỂM LẠI ĐÚNG (tập 106 gói giống hệt #130/#133 — T5-203 xác nhận lần thứ 4 liên tiếp; #135 là lần thứ 5). Suite 9/9 × 6 + (A) 120/120 trên #135 (chuỗi 83 → 84 + lần 52 đề xuất). O8 T01 3/3 ĐẠT trên #135 (WebKit 21/21 ×2 + Chromium 21/21 — khác đợt 202: WebKit 0/2). T4-203: 3 attempt, 0 lượt hợp lệ (lượt yên #71 KHÔNG CÓ lượt hợp lệ, chuỗi 3 → 0 đề xuất). #135 KHÔNG GIẾT holder (chuỗi 10 → 11 đề xuất). Prune 77 xóa 1 file; marker 85 → 86 đề xuất. T56 VI PHẠM: prune chạy TRONG W1 của T4 (F-203-T56-2) — lỗi của T56.

**Nguồn quyết DUY NHẤT:** aggregate 202 §14.2 (`docs/PHASE9_ROUND202_LIMITS.md`, 75.747 B, parent CHẤP NHẬN CÓ ĐIỀU KIỆN, lượt handoff 06:35 +07 28/11/2026, đếm lần thứ 166). Quyết dùng: (c) POSTBOOT #133 + #134 CÓ caveat (b1); #132/#133/#134 XÁC NHẬN, #135 ỨNG VIÊN; (e) marker 82 → 85 ĐÃ XÁC MINH; (i) holder chuỗi 7 → 10, (A) 120/120 lần 51, suite xanh 82 → 83, hướng (3) GIỮ 46; (j) V5 GIỮ LIVE (V2 phương án chính); (m) #131 DƯƠNG (CUỐI); (n) S11 8.406 s = OUTAGE #9; (p) vi phạm W1: T2 (ii) + T56 (iii) + T8 waiter (iv) đều VI PHẠM NHẸ, chuỗi 0 vi phạm GIỮ 0; (r) T56-203 respawn watcher + POSTBOOT #135 + replay.
**Nguồn đọc:** `docs/PHASE9_ROUND202_T56_INFRA_LIMITS.md`, `hidden_files/round202-t56/`, `hidden_files/round203-t56/`, `hidden_files/round203-t5.done`, `hidden_files/round203-t01/NOTES.md`, `hidden_files/round203-t7.done`, `hidden_files/round203-t4/poll-t4.log`, `hidden_files/build-loop-log.md`, `/var/lib/hatch/os-intent/ledger.jsonl`.
**Hạn cờ:** ~02:00Z 28/11/2026 (~09:00 +07). **Hạn cứng:** 02:35:51Z (END watcher-203). **Đóng T56:** ~00:40Z.

## §0. Trạng thái lúc mở (~23:50Z 27/11)

- Boot hiện tại lúc mở: `8ea1f5e3-ee03-4e83-ac26-9be9be446566`, btime 1795820816 = 23:06:56Z (#135 ứng viên). Không có `round-in-progress.md` (gate sạch — kiểm lúc mở 23:50Z).
- Watcher-202 ĐÃ CHẾT (poll cuối 23:07:19Z boot bd22dffd; hết hạn 23:35:51Z; ps ~23:51Z: 0 process watcher/replay-watch). Khoảng không-watcher: 23:07:19Z → START watcher-203 23:53:07Z = **2.748 s** (45m48s — DÀI, do T56-203 spawn muộn: đợt 203 mở 23:35:51Z nhưng T56 bắt đầu 23:50Z; 1 reboot trong khoảng: #135 ~23:06:56Z).
- Trạng thái lúc spawn: CHƯA ỔN ĐỊNH: dpkg.log **2 dòng**, md5 5692dd91, mtime 23:07:37Z; cache 0; lists 3; GST hệ thống 0 file; 0 proc apt/dpkg.
- Marker kiểm lại lúc mở 23:51Z: `/home/hatch/.config/vcut-persistence-marker`, 239 B, md5 cb7102c0, mtime 2026-11-20 11:39:47Z — **SỐNG QUA BOOT #134 + #135**.

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1 Timeline (giờ UTC 27–28/11/2026)

- 21:05:15Z — btime boot bd22dffd (#134, đợt 202).
- **23:06:56Z — btime boot MỚI 8ea1f5e3 (REBOOT #135 — xem §1.3).** 23:07:19Z — poll cuối watcher-202.
- 23:35:51Z — watcher-202 hết hạn (END; đã chết từ ~23:07Z). 23:35:51Z — đợt 203 mở (run 213).
- 23:53:07Z — watcher-203 START (pid 296433, boot 8ea1f5e3). 23:53:07Z — EARLY-REPAIR TRIGGER #135 (boot+2.771 s, frozen 2.730 s, dpkg 2 dòng).
- 23:55:18Z — FLAG-WRITTEN #135 (repair-som-quyet-h poll=1). 23:57:02Z — verify độc lập #135 exit=0 (xem §1.4).
- 23:56:02Z — T01-203 ACQUIRED lock (O8); 23:59:39Z RELEASED (hold 216 s).
- 00:02:22Z — suite #135 START (pgid 330514); 9/9 × 6, DONE 00:04:30Z.
- 00:05:58Z — harness #135 START; chunk 1–4 30/30 ×4; HARNESS-END 00:13:32Z (120/120).
- 00:15:21Z — T4 W1 attempt1 mở; 00:23:03Z RELEASED (hold 462 s); attempt1 exit=3 partial.
- 00:15:23Z — PRUNE 77 CHẠY TRONG W1 (vi phạm F-203-T56-2 — xem §7/§8).
- 00:23:25Z — T4 W1 attempt2 mở; 00:26:54Z RELEASED (hold 209 s); attempt2 exit=0 nhưng LỚP B VI PHẠM (nhiễm, không verdict).
- 00:28:56Z — T4 W1 attempt3 mở; 00:33:14Z RELEASED (hold 257 s); attempt3 exit=0 nhưng tickCost median 117,0 ms > 60 (không hợp lệ); poller thoát 00:33:38Z.
- 00:23:28Z — lock count cuối lần 1; 00:37:54Z — lock count cuối (lần 2, sau W1); ~00:40Z — T56 đóng.

### §1.2 Watcher-203 (spawn)

- Script tạo mới bằng generator `hidden_files/round203-t56/gen-watcher-203.py` từ `round202-t56/replay-watch-202.sh` (thay DIR → round203-t56, OLD_T5_DIR → round202-t56, LOG → replay-watch-203.log, END_EPOCH → 2026-11-28 02:35:51 UTC, token REPLAY-WATCH-203/watcher-203; header viết lại cho 203; bash -n OK; generator tự kiểm tra token 202 còn sót — 2 lần sửa: (1) dòng END_EPOCH chứa "2026", (2) comment SUA F-198-T56-3 nguồn sai 1 đợt — xem F-203-T56-9).
- Giữ SUA F-201-T56-1 (write_flag bỏ qua khi cờ cũ cùng boot — ALREADY-PASS; khởi động kiểm tra cờ cũ cùng boot → done=1 ngay). Fix CHƯA KÍCH HOẠT đợt này (không lần spawn nào rơi vào boot đã có cờ).
- **Spawn: START 23:53:07Z, pid 296433, boot 8ea1f5e3, END 02:35:51Z.** INIT: dpkg 2 dòng, md5 5692dd91, mtime 23:07:37Z, cache 0, lists 3, gst_sys 0.
- Spawn bằng đường dẫn TUYỆT ĐỐI (`nohup bash /abs/path/replay-watch-203.sh > nohup.log 2>&1 & disown` — F-167-T5-2); verify độc lập bằng ps + START line + poll đầu (23:53:07Z). Phiên exec spawn `proc_7c1ae9f5e503` đã hoàn tất — **KHÔNG kill session này; watcher pid 296433 độc lập (disown).** Tương tự: session spawn suite `proc_92c9ff8939f6` + harness `proc_0145cdb1ef4c` đã hoàn tất (output-drain timeout, tiến trình con vẫn chạy đúng thiết kế) — KHÔNG kill.
- Watcher-203 vẫn SỐNG lúc T56 đóng (00:39:18Z, elapsed 44:46); poll đều 30 s, dpkg 777 md5 cd3af6df, gst 269, cache 108, lists 75. Chỉ 1 FLAG-WRITTEN trong log (23:55:18Z).

### §1.3 REBOOT 23:06:56Z — boot mới 8ea1f5e3 (#135) + KHÔNG có auto-replay + EARLY-REPAIR + POSTBOOT_PASS #135

- **Bằng chứng reboot:** boot_id mới `8ea1f5e3-ee03-4e83-ac26-9be9be446566`; btime 1795820816 = **23:06:56Z** (uptime -s khớp; uptime 43' lúc 23:50Z); journal list-boots chỉ còn idx 0 = 8ea1f5e3 (first 23:07:10Z); /tmp bị xóa sạch. Gap #134 → #135 = **7.301 s** (2h01m41s). T7-203 + T01-203 đều xác minh trực tiếp trên máy sống.
- **KHÔNG có auto-replay trên #135:** từ boot (23:06:56Z) tới trigger 23:53:07Z, 0 proc apt/dpkg, dpkg.log đứng yên 2 dòng (md5 5692dd91, mtime 23:07:37Z). Giống #133 (không replay), khác #134 (replay chạy update ~15' nhưng không cài gì — F-202-T56-2). Xem F-203-T56-8.
- **EARLY-REPAIR TRIGGER 23:53:07Z** (boot_age 2.771 s, frozen 2.730 s — mtime dpkg.log 23:07:37Z, dpkg 2 dòng < 100, 0 proc, chưa repair): verify form-B postboot check-only exit=1 (hoàn tất 23:53:08Z, đúng kỳ vọng) → `--repair` exit=0 (apt-get update + install 11 gói) → **postboot poll1 exit=0 (hoàn tất 23:55:18Z)**, dpkg 777 dòng, cache 108, lists 75, gst_sys 269 → **FLAG-WRITTEN 23:55:18Z mode repair-som-quyet-h poll=1** (old=bd22dffd; cờ cũ #134 backup thành `POSTBOOT_PASS-bd22dffd`, md5 f42af6ee — khớp cờ #134). Log apt của repair đã copy ra khỏi /tmp ngay (F-173-T5-9): `t5-postboot-repair-apt-8ea1f5e3.log` (51.174 B — theo T5-203.done).
- **Hồ sơ #135 (giống #133/#134/#130, khác #128/#131):** dpkg **777 dòng**, md5 cd3af6df; cache **108**; lists 75; GST là **symlink → debroot** 269=269 (isomp4 + libav đủ); **libwebkitgtk-6.0-4 VẮNG** (dpkg -l 0, không có trong debroot, không có trong ldconfig — xem §2); dpkg -l 895 dòng. **Caveat đề xuất: (b1)** (repair, như #125/#126/#127/#129/#130/#133/#134).
- **Verify độc lập #135: exit=0**, log `t56-postboot-independent-8ea1f5e3.log` md5 **17e3c7a7** — **byte-identical với poll1 log của watcher** (8 dòng: PASS wrapper K1, 5/5 lib, GST symlink 269=269 isomp4+libav, 11/11 apt, KẾT LUẬN ĐỦ ĐIỀU KIỆN). dpkg md5 cd3af6df không đổi trước/sau (777 dòng) — verify chỉ đọc.
- **Chạy khi KHÔNG có cửa sổ (b) nào của T4 mở:** T4 W1 đầu tiên mở 00:15:21Z (sau verify ~18 phút); W1-ACTIVE không tồn tại lúc verify. Lưu ý trung thực: lúc verify 23:57:02Z, lock ĐANG ĐƯỢC T01 GIỮ (ACQUIRED 23:56:02Z, O8 đang chạy tới 23:59:39Z) — khác đợt 202 (verify lúc lock trống). Verify chỉ đọc (postboot check-only, không dùng lock, không chạm dpkg/apt); dpkg md5 cd3af6df không đổi trước/sau (777 dòng) nên kết quả vẫn đứng. Verify 23:57:02Z nằm ngoài mọi cửa sổ (b) của T4 — đúng (p2)-198.
- **Ledger sau repair #135 (chi tiết thuộc T5-203 — đã đóng, verify 22/22 PASS 23:57:10Z):** trước repair: 1 dòng compacted (3.107 B, md5 0213b58d, ts 1795814889, added 173 gồm webkit — host fold lúc 23:07:59Z trên boot #135 trong lúc reseed; T5-203 tái fold bằng mã host thật → byte-identical, idempotence đúng) → sau repair: **2 dòng** (5.016 B, md5 55ebe9d2): dòng 2 ts 1795823718 (= 23:55:18Z), added 106, removed 0, không webkit, ⊆ dòng compacted 106/106; tái dựng từ apt log 108 − 2 = 106 (2 gói upgrade libelf1t64/libssh-4). Snapshot dpkg-state 784 → 890. **Repair append là đúng thiết kế** (F-199-T56-9 vẫn ĐÓNG).

### §1.4 Kiểm lại repair #134 (nhiệm vụ 3 của brief — TÁI DỰNG ĐỘC LẬP TỪ APT LOG)

- Apt log `t5-postboot-repair-apt-bd22dffd.log` (50.627 B, 683 dòng): **108 dòng "Setting up"** = 108 dòng "Unpacking"; apt summary: **"2 upgraded, 106 newly installed, 0 to remove and 47 not upgraded"** → 108 − 2 = **106 gói mới** = ledger dòng 2 ts 1795814889 **added 106, removed 0** ✓ (khớp LIMITS T56-202 §1.5 + T5-203.done).
- **Tập 106 gói GIỐNG HỆT repair #133** (diff `/tmp/pkgs-05bda90d.txt` vs `/tmp/pkgs-bd22dffd.txt` = IDENTICAL) **và GIỐNG HỆT repair #130** (diff vs `/tmp/pkgs-c073c8bb.txt` = IDENTICAL; c073c8bb = #130, btime 11:21:41Z — xác nhận trong LIMITS T56-200). 2 gói upgrade đều là libelf1t64 + libssh-4 (cả 3 đợt).
- T5-203 xác nhận độc lập: repair #134 ĐÚNG — **lần thứ 4 liên tiếp cùng tập** (tập 106 giống hệt #130/#133); repair #135 ĐÚNG — **lần thứ 5 liên tiếp** (108 setup giống hệt #133/#134, 51.174 B). T56-203 chỉ tái dựng #134 theo brief; #135 do T5-203 kiểm + T56 đối chiếu set (108 setup IDENTICAL #134/#130 — xem §1.3).
- Fold 2 → 1 lúc 21:21:34Z trên #134 ĐÚNG THEO NỘI DUNG (T5-203: tái fold bằng mã host thật trên đúng input tiền-fold → compacted ts 1795812631, added 173, tập == compacted cũ; dòng compacted sau #134 ts 1795814889 chỉ khác compacted cũ ở ts — added giữ nguyên 173, thứ tự giữ nguyên; md5 đổi theo ts là đúng luật fold). Reseed #135 silenced ĐÚNG (dpkg-state 890 → 784 lúc 23:07:59Z; live == snapshot 784/784; ledger chỉ fold, không append do reseed).

## §2. GST + WebKit (h)-198

- GST #135: **symlink → debroot**, 269 file hệ thống = 269 debroot (isomp4 + libav đủ). Giống #129/#130/#133/#134; khác #128/#131 (thư mục thật). Lúc spawn gst_sys=0 (chưa repair — thư mục hệ thống chưa có gì); sau repair 269.
- WebKit libs: #135 **VẮNG** — kiểm 3 lớp đều âm tính: (1) `dpkg -l | grep webkit/javascriptcore` = 0 (dpkg -s: "not installed"); (2) `find` trong debroot + `find / -maxdepth 6 -name 'libwebkitgtk-6.0.so*'` = 0; (3) `ldconfig -p | grep webkit` = 0. Giống #133/#134 (debroot cũng KHÔNG giữ webkit). NEED 11 gói đủ cả 11 (poll1 log: PASS apt 11/11 — 11 gói này không gồm libwebkitgtk). **KHÔNG cài tay** (đúng (h)-198).
- Hệ quả: O8 WebKit T01-203 vẫn 21/21 ×2 trên #135 (xem §4) — O8 dùng WebKit của Playwright, không phụ thuộc libwebkitgtk hệ thống; không mâu thuẫn với "VẮNG" (ghi nhận, không suy đoán thêm).

## §3. Cờ cũ — md5 (kiểm lại lúc đóng)

- #135 (mới, 23:55:18Z, repair-som-quyet-h poll=1): **2da35aef** (324 B)
- #134 (21:28:09Z, repair-som-quyet-h poll=1; backup POSTBOOT_PASS-bd22dffd trong round203-t56): **f42af6ee** (324 B, cả hai bản giống hệt)
- #133 (20:50:33Z, repair-som-quyet-h poll=1; backup POSTBOOT_PASS-05bda90d): **86bb2696** (324 B)
- #131 (15:12:20Z, replay-day-du poll=0; backup POSTBOOT_PASS-7d642f2a): **f691ab08** (315 B, cả hai bản giống hệt)
- #130 (e95ba374), #129 (e09dfd4c), #128 (62c1346c), #127 (153d57e7), #126 (f076a945), #125 (48fec087), #123 (e94fad95), #121 (28847b1e), #119 (863a6035): **KHÔNG kiểm lại đợt này** — mang từ LIMITS T56-202 §3 (đã khớp đợt 202). Chỉ #135/#134/#133/#131 được kiểm lại trực tiếp đợt này.

## §4. T01-203 O8 + ENOSPC + (m) thô

- T01-203 O8 trên #135 (lock t01-round203 23:56:02–23:59:39Z, hold 216 s; theo T01-203 NOTES.md + o8-203t01.log — T56 chỉ ghi nhận): WebKit attempt1 exit=0 23:57:22Z **21/21 PASS** (JSON 9105a18d) + attempt2 exit=0 23:58:29Z **21/21 PASS** (JSON df3c2b5e) + Chromium exit=0 23:59:38Z **21/21 PASS** (JSON 9b7246db); probe S1 KHÔNG chạy (attempt1 PASS — driver bỏ qua theo thiết kế); 0 lỗi exit 127; webkit 27.2; cả 3 bộ CÙNG CÂY (preview.tsx 477a0eac + media.ts ac89aeb2). **Chân FULL PASS "O8 3/3" ĐẠT đợt này** (3/3 bộ pass, cùng boot #135, cùng cây) — khác đợt 202 (WebKit 0/2 trên #133). appendix203.py/txt: 66/66 assert PASS. T01-203.done 981 B (00:05:44Z).
- (m) thô (T7-203.done, T2-203 phân loại CUỐI): **#135 THÔ = 1 requeue trong cửa (+39,568 s)**; **#134 kiểm lại khớp T01-202 (+47,360 s)**. T56 không truy vấn DB đợt này.
- Runs (T7-203.done): run 212 FAILED 23:34:50Z cf 103 s → **CA MỚI #33** (họ CA 32 → 33; 24 S + 6 T + 3 F; run 212 là lượt mở đợt 203; started_at viết lại ×2 + gen đổi ×2 sau khi T7-202 đóng — F-203-T7-1, lần thứ 5). Run 213 RUNNING, dispatched đúng giờ 23:35:51.074Z — kết cục thuộc T7-204. Run 210/211/208 đọc lại ỔN ĐỊNH (cf 169/6/70).
- Cửa slot 203 **LÀNH**: HB 7/7 đúng giờ, DR 4/4 đúng giờ — chuỗi lành đề xuất **0 → 1**. Chuỗi SUCCEEDED 1 → 0. **0 lặng mới** (max gap 1.579,828 s < 1.580 s; gap thứ hai 1.579,821 s — sát ngưỡng, F-203-T7-3). S11 = OUTAGE #9 ĐÃ CHỐT ở (n)-202. Tổng lặng 28/11 UTC = 0 s; 27/11 GIỮ 24.952 s.
- ENOSPC (T56 chỉ đếm thô — chuỗi thuộc T9-203): **#135 = 41 dòng** (đếm lúc ~23:56Z) → **57** (00:14:36Z) → **65** (00:23:28Z) → **78** (00:37:54Z); dòng đầu 23:08:48Z = boot+112s — về lại mẫu ~110s như #132/#134; dòng cuối lúc đếm 00:22:48Z. **Số vẫn tăng lúc T56 đóng** (đếm trong lúc boot còn sống; sau reboot journal cũ bị xóa — bài học đợt 202). dmesg = 0. Tỉ lệ cao hẳn #133/#134 (15 dòng mỗi boot) — xem F-203-T56-3. Phương pháp: `journalctl --since <btime> --grep "No space left on device" | wc -l`.

## §5. Lock health (T6)

### §5.1 Số đếm cuối (00:37:54Z, analyze-log.py trên vite-lock-v2.log)

- total cleaned 3105; TICKET 900 / ACQUIRED 889 / RELEASED 876; COOLDOWN 416 / STALE-LOCK 13 / STALE-TICKET 1 / TIMEOUT 10; pairs 876; double-acquire 7; still_held_at_end=0; held_owners=[].
- So với T56-202 kiểm cuối (21:53:54Z: 3076; 892/881/867; COOLDOWN 412; STALE-LOCK 13; pairs 867; double-acquire 7; held 1): Δ cleaned +29, TICKET +8, ACQUIRED +8, RELEASED +9, COOLDOWN +4, STALE-LOCK 0, pairs +9, double-acquire 0. Chênh ACQ−REL = 889−876 = **13 = 13 STALE (giữ nguyên) + 0 đang giữ**.
- 29 dòng mới đối chiếu khớp từng dòng: t8-round202 ×17 (4 TICKET + 4 ACQUIRED + 5 RELEASED hold 61/121/142/221/242 s + 4 COOLDOWN — các cycle chạy sau mốc đếm 21:53:54Z đợt 202, cycle cuối RELEASED 22:06:04Z hold 221 s) + t01-round203 ×3 (TICKET+ACQUIRED+RELEASED 23:56:02–23:59:39Z, hold 216 s) + t4 ×9 (3 attempt: TICKET+ACQUIRED+RELEASED — hold 462/209/257 s). 0 dòng nào của T56 trên log thật. 0 RELEASED không ACQUIRED trước, 0 TIMEOUT mới (cuối 19/11 15:50:28Z). **Kết luận: lock KHỎE, trống lúc đóng.**
- T01 O8 giữ lock 23:56:02–23:59:39Z (hold 216 s). T4 giữ lock attempt1 00:15:21–00:23:03Z (hold 462 s), attempt2 00:23:25–00:26:54Z (hold 209 s), attempt3 00:28:56–00:33:14Z (hold 257 s).

### §5.2 #135 KHÔNG GIẾT HOLDER — chuỗi 10 → 11 (nếu parent xác nhận số hiệu)

- #135: dòng lock cuối trước btime 23:06:56Z là t8-round202 RELEASED 22:06:04Z; 0 dòng 23:06:56–23:56:02Z. Lock trống **3.652 s** trước btime. **#135 KHÔNG GIẾT HOLDER.**
- Chuỗi holder: 10 (#134, (i)-202) → **11 (#135)** (nếu #135 xác nhận).

### §5.3 Snapshot zombie / X11 (00:38Z)

- Snapshot: zombie 0; socket X11 **X193** (mtime 00:29:03Z — trùng giờ T4 attempt3 mở 00:28:56Z, có thể là display của attempt3) còn sót lại mà không còn tiến trình Xvfb nào (pgrep Xvfb = 0). Cùng lớp F-200-T56-7/F-202-T56-7 (X193 orphan đợt 202 đã tự hết sau reboot #135; X193 MỚI xuất hiện trên #135). Socket sót sẽ sạch ở reboot sau; không ảnh hưởng đo đạc (T4 đã đóng cả 3 attempt).

## §6. (A) + suite + monitor + T4-203 (ghi nhận)

- Script: suite `apps/web/scripts/test-vite-lock-v2.sh` md5 **a89c0676** (không đổi). Poll script md5 **1710e480**; lock v2 md5 **520b8baa**; lock v1 md5 **fd21193c** (cả ba khớp đợt 202). Khối T7 trích `t7-block-a203.sh` (trích lại từ suite mỗi lần chạy, verbatim).
- 4 script 203 sinh bằng `hidden_files/round203-t56/gen-suite-203.py` từ bản 202 + **giữ SUA F-198-T56-3 (monitor + gate-check xem CẢ HAI đường poll log T4) + SUA F-199-T56-2 (gate-check chỉ xét dòng MỚI kể từ baseline)**: `t7-gate-monitor-203.sh`, `run-harness-203.sh`, `suite-runner-203.sh`, `t7-control-a203.sh`. Tất cả bash -n OK.
- **Suite trên #135: 9/9 × 6 lượt, rc=0 cả 6** (00:02:22–00:04:30Z, pgid 330514). Monitor suite lần 1 SAI PGID (330511 — xem F-203-T56-1): START 00:02:31Z rồi END ngay "chunk da ket thuc" (kill -0 -330511 fail — 330511 là shell ngoài, không phải group leader); monitor lần 2 START 00:03:24Z pgid 330514 (đúng), END 00:04:34Z "0 cua mo". Run1 (00:02:22–00:02:44Z) KHÔNG được monitor — kiểm lại độc lập: 0 dòng "CUA YEN MO" + 0 ACQUIRED trong cửa sổ 00:02:22–00:03:24Z (poll #12/#13 gate đóng, load5 > 2; lock log không có ACQUIRED mới) → run1 sạch, không thiệt hại. **Đã archive** thành `suite-203-8ea1f5e3.log` + `test-v2-t6-run{1..6}-8ea1f5e3.log`. **Chuỗi suite xanh 83 → 84 (đề xuất, trên #135).**
- **Harness (A) trên #135 (chạy đầy đủ): 120/120 PASS, 0 FAIL** (00:05:58–00:13:32Z; chunk 1–4 mỗi 30/30, rc=0). **(A) lần thứ 52 (tổng 6.240/6.240) — đề xuất, trên #135.** B1=1 B2=0 cả 120 lần (grep chính xác `^run [0-9]+ -> PASS` = 120, `-> FAIL` = 0; "124" của runner là artifact đếm cả 4 dòng summary chunk — xem F-203-T56-6, cùng lớp F-199-T56-8/F-201-T56-6/F-202-T56-8). Churn delays #135 (120 dòng, đã tách `churn-delays-8ea1f5e3.txt` — file mới theo đợt, không gộp như F-202-T56-9): min 533 ms, max 3.491 ms, avg 2.057,97 ms. Gate-check mỗi chunk đều qua (acquired_raw=888). Monitor 4 s bọc mỗi chunk: 4 START / 4 END, đều "0 cua mo" (tổng monitor đợt này: suite 2 START / 2 END (1 sai pgid + 1 đúng "0 cua mo") + harness 4 START / 4 END; 0 KILL).
- T4-203 monitor (cả hai đường log — F-198-T56-3): T4 chỉ ghi vào `hidden_files/round203-t4/poll-t4.log`; file gốc `hidden_files/round203-t4-poll.log` KHÔNG TỒN TẠI (lỗi cosmetic như F-200-T56-8/F-202-T56-8 — xem F-203-T56-5). T4 poll-wait từ ~23:54Z trên #135 (poll #1–#33, gate0 T5 PASS từ poll #3 23:55:42Z, chờ load1<2 + load5<2 + RAM≥1024 + LOCKOK + BLOCKERS=0). T4 thấy cờ #135 ở poll #3 (23:55:42Z).
- **attempt1 #71: CUA YEN MO poll #29 00:15:21Z → ACQUIRED 00:15:21Z → RELEASED 00:23:03Z (hold 462 s); run-attempt exit=3, partial (JSON 1.042.200 B, wedged/timeout) — KHÔNG tính verdict** (đã dùng ngân sách 1/3).
- **attempt2 #71: CUA YEN MO poll #30 00:23:25Z → ACQUIRED 00:23:25Z → RELEASED 00:26:54Z (hold 209 s); run-attempt exit=0, 20/20 NHƯNG LỚP B VI PHẠM — lượt nhiễm, KHÔNG dùng verdict** (đã dùng 2/3; xem classb-t4-attempt2-8ea1f5e3.txt).
- **attempt3 #71: CUA YEN MO poll #33 00:28:56Z → ACQUIRED 00:28:56Z → RELEASED 00:33:14Z (hold 257 s); run-attempt exit=0, 20/20 + LỚP B ĐẠT 5/5 NHƯNG tickCost median=117,0 ms > 60 — lượt KHÔNG hợp lệ, KHÔNG dùng verdict** (đã dùng 3/3; poller thoát 00:33:38Z).
- **Lượt yên #71: KHÔNG CÓ LƯỢT HỢP LỆ — chuỗi lượt yên hợp lệ 3 → 0 (ĐỀ XUẤT, theo số liệu T4; parent quyết (m)-203).** Live-check #22: KHÔNG CÓ verdict (không lượt hợp lệ nào) — chuỗi 1 → 0 (ĐỀ XUẤT; parent quyết). Verdict thuộc T4-203/T10-203 + parent; T56 chỉ ghi nhận. T4-203.done CHƯA có lúc T56 đóng (agent đang xem xét).
- .done 203 lúc T56 đóng: T01, T5, T7 (3 file). Chưa đóng: P1, P2, P3, P4, T2, T4, T8, T9, T10, T56 (đợt này). T8-203 đang làm việc (dir round203-t8 có README.txt + smoke, chưa .done).

## §7. Prune 77

- Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa `cooldown-*` mtime >7 ngày (find -mtime +7 = ≥192h); (b) trần mềm 100 file; (c) không xóa file đợt hiện tại/ngay trước; (d) ghi tên + số file xóa; (e) chỉ chạy khi lock trống.
- Chạy 00:15:23Z. **VI PHẠM (F-203-T56-2): lock KHÔNG trống — T4 đã ACQUIRED 00:15:21Z (W1 attempt1 mở), T56 không kiểm lock log ngay trước khi xóa.** File `prune-time.txt` bản đầu ghi sai "lock trong (dòng cuối RELEASED t01-round203 23:59:39Z)" — đó là dòng cuối lúc T56 kiểm TRƯỚC ĐÓ (~00:14Z), không phải lúc xóa; đã sửa lại sau khi W1 đóng (00:23:03Z).
- **XÓA 1 FILE theo điều (a):** cooldown-t8-round149 (Nov 19 21:46, ~194h). Queue: 87 file / 1218 B → **86 file / 1204 B**. Tầng tuổi lúc xóa: ≥192h: 1 → 0; ≥168h: 11 (10 cũ + 1 mới qua mốc); ≥72h: 56; ≥48h: 66. Điều (b) KHÔNG kích hoạt (86 < 100). Ghi `prune-time.txt` (đã sửa) + `prune-deleted.txt`. **F-147-T6-1 — CHUỖI VẪN 0, lần thứ 24 liên tiếp sau khi đứt tại 179** (file xóa qua mốc 168h lúc xóa; vi phạm thời điểm không ảnh hưởng tiêu chí tuổi file — parent quyết có tính chuỗi không).

## §8. Findings F-203-T56-n (ghi nhận)

- **F-203-T56-1 (sai pgid monitor suite):** T56 truyền `$!` của `setsid nohup bash suite-runner-203.sh &` (pid 330511) làm pgid cho monitor — nhưng 330511 là shell ngoài của exec wrapper, không phải group leader (suite-runner thật là pid 330514, SID/PGID 330514, con của 330511). Monitor lần 1 START rồi END ngay ("chunk da ket thuc"). Đã khởi động lại monitor với pgid đúng 330514 (START 00:03:24Z, END 00:04:34Z "0 cua mo"). Run1 không được monitor ~1 phút nhưng kiểm lại độc lập: 0 W1 + 0 ACQUIRED trong cửa sổ → sạch. Bài học: lấy pgid từ `SUITE-START ... pgid=$$` trong suite-203.log (330514), không lấy `$!` của lệnh setsid khi spawn qua exec wrapper. (Harness không mắc lỗi này: run-harness-203.sh tự setsid + monitor trong cùng script, như đợt 202.)
- **F-203-T56-2 (lỗi của chính T56 — VI PHẠM NHẸ, giao (p)-203 phán):** T56 chạy prune 77 (xóa 1 file + ghi 2 file) TRONG W1 của T4 — xóa lúc ~00:15:23Z, W1 attempt1 00:15:21–00:23:03Z. T56 đã kiểm lock trống lúc ~00:14:36Z (poll #28) rồi mới chạy lệnh prune, nhưng lệnh chạy CHẬM (exec backgrounded sau 10 s + journalctl nặng) nên lúc rm thực thi thì T4 đã ACQUIRED được 2 s. Tệ hơn F-202-T56-5 (lần này có cả xóa file, không chỉ ghi). Bài học: kiểm lock log NGAY TRƯỚC rm/ghi file TRONG CÙNG MỘT LỆNH, và abort nếu dòng cuối là ACQUIRED — không dựa vào kết quả kiểm tra từ lệnh trước.
- **F-203-T56-3:** ENOSPC #135 tăng nhanh bất thường: 41 (~23:56Z) → 57 (00:14:36Z) → 65 (00:23:28Z) → 78 (00:37:54Z) — ~1 dòng/70 s, gấp ~2,5 lần #133/#134 (15 dòng mỗi boot, đo ở tuổi boot tương đương). Cùng nguồn (home-assistant-ensure.service, inotify watch). dmesg = 0. Số cuối vẫn tăng lúc đóng — T9-203 chốt chuỗi.
- **F-203-T56-4:** T4-203 đốt hết ngân sách 3 attempt mà 0 lượt hợp lệ (attempt1 exit=3 partial wedged; attempt2 20/20 nhưng lớp B vi phạm; attempt3 20/20 + lớp B 5/5 nhưng tickCost median 117,0 ms > 60). Lượt yên #71 KHÔNG CÓ lượt hợp lệ — chuỗi 3 → 0 (đề xuất). Đây là đợt đầu tiên kể từ #70 mà T4 không có lượt hợp lệ nào (đợt 202: attempt1 hợp lệ ngay).
- **F-203-T56-5:** lỗi cosmetic "No such file" cho đường poll log T4 gốc (round203-t4-poll.log không tồn tại — T4 chỉ ghi đường mới) lặp lại như F-200-T56-8/F-202-T56-8; monitor/harness xử lý được (wc -l → 0), không ảnh hưởng gate-check.
- **F-203-T56-6:** artifact đếm "124" của runner lặp lại (F-199-T56-8/F-201-T56-6/F-202-T56-8): grep thô "PASS" đếm cả 4 dòng summary chunk → 124. Số thật 120/0 (grep `^run [0-9]+ -> PASS/FAIL`). Không sửa script giữa đợt.
- **F-203-T56-7:** socket X11 X193 mtime 00:29:03Z (trùng giờ T4 attempt3 mở) còn sót mà không còn tiến trình Xvfb nào. Cùng lớp F-200-T56-7/F-202-T56-7. Sẽ sạch ở reboot sau; không ảnh hưởng đo đạc.
- **F-203-T56-8:** KHÔNG có host auto-replay trên #135 (0 proc apt/dpkg từ boot tới trigger; dpkg đứng yên 2 dòng 46 phút). Ba mẫu liên tiếp khác nhau: #133 không replay, #134 replay update ~15' nhưng không cài gì, #135 không replay. Watcher early-repair là thứ khôi phục thật cả 3 boot.
- **F-203-T56-9:** gen-suite-203.py lần chạy đầu FAIL ở self-check: comment SUA F-198-T56-3 trong file nguồn 202 ghi "(dot 201, ke thua dot 202)... round202-t4/" nhưng chuỗi nguồn trong generator (sau phép thay token) ghi "(dot 200, ke thua dot 202)" — lệch 1 đợt, replace không khớp, comment cũ (chứa token 202) rơi vào script 203. Đã sửa chuỗi nguồn thành "(dot 201, ke thua dot 202)" rồi chạy lại — 4 script sinh đúng, bash -n OK, không token 202 sót. Không ảnh hưởng chức năng (chỉ comment), ghi nhận để đời sau kiểm tra chuỗi nguồn bằng grep trực tiếp trên file nguồn trước khi thay token.
- **Trạng thái F-202-T56-n:** -1 (reboot giết watcher) — TÁI DIỄN thành F-203-T56-1 dạng khác (watcher-202 chết cùng #135; respawn muộn 2.748 s do T56 bắt đầu muộn); -2 (host replay không cài gì) — KHÔNG tái diễn (đợt này KHÔNG có replay — F-203-T56-8); -3 (đính chính gap) — KHÔNG tái diễn (gap #134 → #135 = 7.301 s, T01-202/T7-203 khớp); -4 (monitor kill đúng thiết kế) — KHÔNG tái diễn (0 KILL đợt này); -5 (ghi file trong W1) — TÁI DIỄN, NẶNG HƠN thành F-203-T56-2 (cả xóa file); -6 (T01 .done chỉ có timestamp) — KHÔNG tái diễn (T01-203.done 981 B có nội dung); -7 (X193) — TÁI DIỄN thành F-203-T56-7 (X193 mới); -8 (artifact 124/4 + poll log gốc) — TÁI DIỄN thành F-203-T56-5/F-203-T56-6; -9 (churn gộp) — ĐÃ SỬA (churn-delays.txt mới 120 dòng, đã tách per-boot); -10 (caveat chuỗi 3 boot) — KHÔNG tái diễn (đợt 203 chỉ 1 boot #135; suite/(A)/lượt yên đều trên #135, chỉ O8 T01 cũng trên #135 — xem (q) §9).

## §9. Đề xuất cho parent (quyết ở aggregate 203)

- (a) Chấp nhận phần T56 đợt 203 (watcher-203 + respawn, POSTBOOT #135, lock, (A), suite, prune 77, marker) — trừ vi phạm (p) giao parent phán.
- (b) Cờ #135: **CÓ, caveat (b1)** (repair poll=1 23:55:18Z, dpkg 777, GST symlink, webkit VẮNG). Verify độc lập exit=0 byte-identical.
- (c) Xác nhận 8ea1f5e3 = **#135** (bằng chứng §1.3; T01-203 + T7-203 xác minh trực tiếp).
- (d) Holder #135 KHÔNG GIẾT — chuỗi 10 → 11 (nếu số hiệu xác nhận).
- (e) (A) lần 52 (6.240/6.240, #135) + suite xanh chuỗi 84 (#135).
- (f) Prune 77 (xóa 1, queue 87 → 86); F-147-T6-1 chuỗi VẪN 0 lần 24 (parent quyết có tính không, do prune chạy trong W1 — xem (p)).
- (g) Hướng (3) GIỮ 46 (theo (i)-201; parent quyết).
- (h) WebKit libs — #135 VẮNG hoàn toàn (dpkg/debroot/ldconfig đều 0). KHÔNG cài tay. O8 WebKit 21/21 ×2 trên #135 là kết quả của T01 (dùng WebKit Playwright), không mâu thuẫn.
- (i) **Marker 85 ĐÃ XÁC MINH → 86 nếu #135 xác nhận**: đường dẫn `/home/hatch/.config/vcut-persistence-marker`, 239 B, mtime 2026-11-20 11:39:47Z, md5 cb7102c0 — sống qua 2 boot mới (#134 + #135). T56 chỉ ghi ỨNG VIÊN, không tự nâng (theo brief).
- (j) Ledger: fold lúc 23:07:59Z trên #135 (đúng thiết kế, T5-203 đã tái fold byte-identical); repair #135 append dòng 2 (ts 1795823718, added 106) — T5-203 đối chiếu nội dung, verify 22/22 PASS. Repair #134 kiểm lại ĐÚNG (tập 106 giống hệt #130/#133). Host auto-replay trên #135: KHÔNG CÓ (F-203-T56-8).
- (k) Lượt yên #71: 3 attempt, 0 lượt hợp lệ — chuỗi 3 → 0 (đề xuất, theo số liệu T4; parent quyết (m)-203). Live-check #22: KHÔNG CÓ verdict — chuỗi 1 → 0 (đề xuất).
- (l) Chuỗi 12/12: CHƯA quyết được lúc T56 đóng (đợt chưa đóng sổ; T10-203 quyết theo (i)-201).
- (m) Tổng boot không cờ **GIỮ 32** (#124 + #132; #135 CÓ cờ, không cộng thêm).
- (n) Watcher-204 spawn kịp thời sau 02:35:51Z (END watcher-203) — khoảng không-watcher đợt này 2.748 s là dài, do T56-203 bắt đầu muộn; T56-204 cần spawn ngay khi mở.
- (o) Replay #135: KHÔNG có replay đầy đủ (early-repair). Mẫu host replay 3 đợt gần nhất đều khác nhau (#133 không, #134 update-không-cài, #135 không) — T5-204/host làm rõ nếu cần.
- (p) Chồng lấn W1 (F-203-T56-2): T56 chạy prune 77 trong W1 attempt1 của T4 (xóa 1 file + ghi 2 file, 00:15:23–00:15:24Z, W1 00:15:21–00:23:03Z) + ghi sai prune-time.txt ban đầu. T56 nhận lỗi phần mình. Giao parent phán mức độ (đợt 202: T56 ghi file trong W1 = VI PHẠM NHẸ).
- (q) Đính chính gap #134 → #135: **7.301 s** (2h01m41s). Đợt 203 chỉ có 1 boot (#135) — suite/(A)/O8/lượt yên đều trên #135, không có caveat chuỗi đa-boot như đợt 202 (F-202-T56-10 không tái diễn).
- (r) T56-204: spawn watcher-204 kịp thời + POSTBOOT #136 (nếu có boot mới) + replay; kiểm pgid monitor từ SUITE-START log (F-203-T56-1); KHÔNG ghi/xóa file trong W1 (F-203-T56-2).

## §10. Sai số của chính T56-203

- Prune chạy trong W1 của T4 + ghi sai prune-time.txt ban đầu (F-203-T56-2) — lỗi thật, đã nhận. Lần sau: kiểm lock log ngay trước rm/ghi file trong cùng một lệnh, abort nếu dòng cuối là ACQUIRED.
- Monitor suite sai pgid lần đầu (F-203-T56-1) — run1 không được monitor ~1 phút (đã kiểm lại độc lập là sạch). Lần sau: lấy pgid từ SUITE-START log.
- gen-suite-203.py lần đầu fail self-check do chuỗi nguồn lệch 1 đợt (F-203-T56-9) — chỉ comment, đã sửa, không ảnh hưởng chức năng.
- Không lường trước T4 đốt hết 3 attempt mà 0 lượt hợp lệ (F-203-T56-4) — T56 phải chờ W1 đóng mới ghi deliverables (00:37:54Z mới ghi được), không mất mát gì ngoài thời gian.
- Lock count cuối lần 1 lấy 00:23:28Z — T4 đang giữ lock attempt2 lúc đó (still_held=1 ['t4']); count cuối lần 2 lấy 00:37:54Z sau khi W1 đóng hẳn (held 0) mới là chuẩn. T10 dedup toàn cục là chuẩn.
- (m) #135 THÔ không truy vấn được đợt này (chưa rõ bảng/eid trong muse.db) — giao T2-203; T7-203 đã có (m) #135/#134 thô.
- Khoảng không-watcher 2.748 s là dài — do T56-203 bắt đầu 23:50Z (muộn 14 phút sau khi đợt mở 23:35:51Z). Không phải lỗi kỹ thuật, ghi nhận để T56-204 spawn sớm hơn.

## §11. Batch stage

- 1 file mới: `docs/PHASE9_ROUND203_T56_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round203-t56-infra.txt` (NUL-delimited, 1 entry).
- KHÔNG stage file làm việc trong `hidden_files/round203-t56/` (chỉ để tham chiếu).
- Chờ push: 191–202 = 146/531/401/380 (theo aggregate 202 §14.2) + đợt 203 (T10-203 đếm lại) + 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` (chưa quyết).
