# PHASE 9 — ROUND 202 — T56: INFRA / WATCHER / LOCK — LIMITS

**Đợt:** 202. **Luồng:** T56 — infra/watcher + POSTBOOT_PASS + lock + prune + marker.
**Trạng thái:** ĐÃ ĐÓNG. Watcher-202 đang chạy (respawn pid 2113, START 21:07:12Z, boot bd22dffd, END 23:35:51Z). POSTBOOT_PASS #133 + #134 ĐÃ CÓ cờ (cả hai repair-som-quyet-h, poll=1, verify độc lập byte-identical).
**Kết quả chính:** HAI REBOOT trong đợt — #133 (btime 20:32:07Z, watcher-201 đã chết cùng #132 nên KHÔNG có watcher 3h39m) + #134 (btime 21:05:15Z, giết watcher-202 spawn1 + harness chunk 2 giữa chừng). #133 repair xong 20:50:33Z (dpkg 777); #134: host auto-replay chạy apt-get update ~15 phút nhưng KHÔNG CÀI GÌ, watcher early-repair xong 21:28:09Z (dpkg 777). Suite 9/9 × 6 trên #134 (chuỗi 82 → 83 đề xuất); (A) 120/120 trên #134 (lần thứ 51 đề xuất); lượt yên #70 HỢP LỆ trên #134 (chuỗi 2 → 3 đề xuất, T4); live-check #21 ĐẠT (chuỗi 0 → 1 đề xuất, T4). #132/#133/#134 đều KHÔNG GIẾT holder (chuỗi 7 → 10 đề xuất). Prune 76 xóa 2 file; marker ĐÃ XÁC MINH (82 → 85 đề xuất). T56 tự ghi file trong W1 của T4 (F-202-T56-5) — lỗi của T56.

**Nguồn quyết DUY NHẤT:** aggregate 201 §14.2 (`docs/PHASE9_ROUND201_LIMITS.md`, 92.112 B, parent CHẤP NHẬN CÓ ĐIỀU KIỆN, lượt handoff 01:12 +07 28/11/2026, đếm lần thứ 163). Quyết dùng: (c) POSTBOOT #131 CÓ KHÔNG CAVEAT (b2) — replay đầy đủ thật; (e) #132 ỨNG VIÊN (9a30eb2a, btime 17:03:20Z); (i) holder chuỗi 6 → 7, (A) 120/120 lần 50, suite xanh 81 → 82, hướng (3) GIỮ 46; (j) V5 GIỮ LIVE (V2 phương án chính 6/6; V4 5/5); (r) T56-202 spawn watcher-202 kịp thời + POSTBOOT #132 + replay.
**Nguồn đọc:** `docs/PHASE9_ROUND201_T56_INFRA_LIMITS.md`, `hidden_files/round201-t56/`, `hidden_files/round202-t56/`, `hidden_files/round202-t5.done`, `hidden_files/round202-t01/NOTES.md` + `boot-survey-202t01.txt`, `hidden_files/round202-t4.done` + `poll-t4.log` + `windows.md`, `hidden_files/build-loop-log.md` (dòng T9-201 về #132).
**Hạn cờ:** ~23:00Z 27/11/2026 (~06:00 +07 28/11). **Hạn cứng:** 23:35:51Z (END watcher-202). **Đóng T56:** ~22:04Z.

## §0. Trạng thái lúc mở (~20:41Z 27/11)

- Boot hiện tại lúc mở: `05bda90d-6988-4925-97f7-71317d569aca`, btime 20:32:07Z (#133 ứng viên). Không có `round-in-progress.md` (gate sạch — kiểm lúc mở 20:41Z).
- Watcher-201 ĐÃ CHẾT (poll cuối 17:03:47Z boot 7d642f2a; hết hạn 17:35:51Z; ps ~20:41Z: 0 process watcher/replay-watch). Khoảng không-watcher: 17:03:47Z → START watcher-202 20:42:59Z = **13.152 s** (3h39m12s — DÀI NHẤT từ trước tới nay; watcher-201 chết cùng reboot #132 ~17:03:20Z, không ai respawn vì T56-201 đã đóng ~15:51Z; hai reboot trong khoảng: #132 ~17:03:20Z + #133 ~20:32:07Z).
- Trạng thái lúc spawn: CHƯA ỔN ĐỊNH: dpkg.log **2 dòng**, md5 29941547, mtime 20:35:47Z; cache 0; lists 3; GST hệ thống 0 file; libwebkitgtk VẮNG; 0 proc apt/dpkg.
- Marker kiểm lại lúc mở 20:41Z: `/home/hatch/.config/vcut-persistence-marker`, 239 B, md5 cb7102c0, mtime 2026-11-20 11:39:47Z — **SỐNG QUA BOOT #132 + #133**.

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1 Timeline (giờ UTC 27/11/2026)

- 15:04:25Z — btime boot 7d642f2a (#131).
- 17:03:20Z — btime boot 9a30eb2a (#132 ứng viên; watcher-201 chết cùng reboot, poll cuối 17:03:47Z).
- 17:35:51Z — watcher-201 hết hạn (END; đã chết từ ~17:03Z).
- 20:32:07Z — btime boot 05bda90d (#133 ứng viên).
- 20:42:59Z — watcher-202 START (spawn 1: pid 4676, boot 05bda90d).
- 20:46:26Z — T01-202 ACQUIRED lock (O8); 20:48:49Z RELEASED (hold 142 s).
- 20:47:31Z — EARLY-REPAIR TRIGGER #133 (boot+924 s, frozen 704 s, dpkg 2 dòng).
- 20:50:05Z — T01-202-probe ACQUIRED; 20:50:31Z RELEASED (hold 26 s).
- 20:50:33Z — FLAG-WRITTEN #133 (repair-som-quyet-h poll=1). 20:52:28Z — verify độc lập #133 exit=0.
- 20:59:10Z — suite #133 START (pgid 38178); 9/9 × 6, DONE 21:01:52Z.
- 21:02:49Z — harness #133 START; chunk 1 30/30 (21:04:43Z); chunk 2 chạy tới run 48.
- **21:05:15Z — btime boot MỚI bd22dffd (REBOOT #134 — xem §1.5).** 21:05:40Z — poll cuối watcher-202 spawn1.
- 21:06:51Z — T4 poller khởi động lại (theo T4-202.done). 21:07:12Z — watcher-202 RESPAWN (pid 2113, boot bd22dffd).
- 21:06–21:21Z — host auto-replay chạy apt-get update (pid 819, ~15 phút) nhưng KHÔNG CÀI GÌ (xem §1.5). 21:21:34Z — host fold ledger 2 → 1 dòng (xem §1.5).
- 21:21:44Z — EARLY-REPAIR TRIGGER #134 (boot+989 s, frozen 940 s, dpkg 2 dòng). 21:28:09Z — FLAG-WRITTEN #134. 21:30:15Z — verify độc lập #134 exit=0.
- 21:31:45Z — suite #134 lần 2 START (pgid 21457); run1–4 9/9; **21:33:19Z monitor KILL đúng thiết kế** (T4 W1 mở 21:33:13Z).
- 21:33:13Z — T4 W1 mở (attempt1 #70); 21:36:47Z RELEASED (hold 214 s); 21:37:13Z poller thoát (LƯỢT HỢP LỆ).
- 21:37:50Z — suite #134 lần 3 START (pgid 35340); 9/9 × 6, DONE 21:39:57Z.
- 21:40:24Z — harness #134 START (chạy lại đầy đủ); chunk 1–4 30/30 ×4; HARNESS-END 21:48:02Z (120/120).
- 21:50:21Z — T8-202 cycle 1 ACQUIRED; 21:51:42Z RELEASED (hold 81 s); cycle 2 ACQUIRED 21:51:57Z (đang giữ lúc T56 đóng).
- 21:49Z — lock count cuối; 20:55Z — prune 76 (chạy trước, xem §7); ~21:54Z — T56 đóng.

### §1.2 Watcher-202 (spawn + respawn)

- Script tạo mới bằng generator `hidden_files/round202-t56/gen-watcher-202.py` từ `round201-t56/replay-watch-201.sh` (thay DIR → round202-t56, OLD_T5_DIR → round201-t56, LOG → replay-watch-202.log, END_EPOCH → 2026-11-27 23:35:51 UTC, token REPLAY-WATCH-202/watcher-202; header viết lại cho 202; bash -n OK; generator tự kiểm tra token 201 còn sót).
- **SỬA F-201-T56-1 (mới đợt 202):** write_flag bỏ qua khi cờ cũ cùng boot (ghi ALREADY-PASS, không ghi đè); khởi động cũng kiểm tra cờ cũ cùng boot → done=1 ngay. Fix ĐÃ TRIỂN KHAI nhưng CHƯA KÍCH HOẠT đợt này (không lần spawn nào rơi vào boot đã có cờ).
- **Spawn 1: START 20:42:59Z, pid 4676, boot 05bda90d, END 23:35:51Z.** INIT: dpkg 2 dòng, md5 29941547, mtime 20:35:47Z, cache 0, lists 3, gst_sys 0.
- Spawn bằng đường dẫn TUYỆT ĐỐI (`nohup bash /abs/path/replay-watch-202.sh > nohup.log 2>&1 & disown` — F-167-T5-2); verify độc lập bằng ps + START line + poll đầu (20:42:59Z). Phiên exec spawn backgrounded — **CẢNH BÁO: KHÔNG kill session exec spawn watcher — process.kill xé cả cây tiến trình sẽ giết watcher (đợt này session spawn1 `proc_3314903167e6` + respawn `proc_228b4edc33f8` — KHÔNG kill).**
- **Watcher-202 (pid 4676) CHẾT cùng reboot 21:05:15Z** (poll cuối 21:05:40Z — vẫn ghi boot 05bda90d; reboot xảy ra giữa 21:05:40Z và ~21:06:10Z; btime 21:05:15Z là giờ boot kernel — xem F-202-T56-1, cùng mẫu F-201-T56-2).
- **Respawn: START 21:07:12Z, pid 2113, boot bd22dffd.** Khoảng không-watcher: poll cuối 21:05:40Z → START 21:07:12Z = **92 s**; boot mới không bao phủ: btime → START = **117 s**. Respawn dùng đúng script cũ (log ghi 2 START line, trung thực).

### §1.3 Boot #132 — ỨNG VIÊN, KHÔNG CÓ CỜ (xác nhận độc lập 2 nguồn + 1 dấu vết)

- **#132 = 9a30eb2a, btime 17:03:20Z** (epoch 1795799000). Bằng chứng: (1) parent kiểm live lúc đóng 201: btime hiện tại 1795799000 = 17:03:20Z, uptime 15 phút — "boot #132 là thật" (build-loop-log dòng T9-201); (2) T9-201: "Hai reboot trong phiên: #131 btime 15:04:25Z + #132 btime 17:03:20Z (sau close, giết exec dừng daemon)"; F-201-T9-3: mẫu cuối mang boot_id #131 sau btime #132 19/23 s; (3) watcher-201 log: poll cuối 17:03:47Z rồi dừng hẳn (chết cùng reboot; END 17:35:51Z chưa tới).
- **KHÔNG CÓ CỜ cho #132:** không có POSTBOOT_PASS-9a30eb2a trong round201-t56; ledger không append sau 15:11:39Z (T5-202.done). T56 KHÔNG viết post-hoc (tiền lệ #118/#120/#122/#124; quyết (k)-198). **Tổng boot không cờ: 31 (#124) + #132 = 32** (nếu #132 xác nhận — parent quyết (c)-202).
- Gap #131 → #132 = **7.135 s** (1h58m55s — T01-202 NOTES, khớp epoch 1795799000 − 1795791865).
- **ĐÍNH CHÍNH (F-202-T56-3):** gap #130 → #131 trong LIMITS T56-201 §1.4 ghi "13.764 s (3h49m24s)" là **SAI** — đúng là **13.364 s** (3h42m44s; 1795791865 − 1795778501 = 13.364; T01-202 NOTES ghi đúng 13.364 s).

### §1.4 REBOOT 20:32:07Z — boot mới 05bda90d (#133) + EARLY-REPAIR + POSTBOOT_PASS #133

- **Bằng chứng reboot:** boot_id mới `05bda90d-6988-4925-97f7-71317d569aca`; btime 1795811527 = **20:32:07Z** (uptime -s khớp; uptime 8' lúc 20:40:47Z); journal list-boots chỉ còn idx 0 = 05bda90d (first 20:32:25Z); /tmp bị xóa sạch. Gap #132 → #133 = **12.527 s** (3h28m47s — T5-202.done + T01-202 NOTES khớp).
- **KHÔNG có auto-replay trên #133:** từ boot+8' (20:40:47Z) tới trigger 20:47:31Z, 0 proc apt/dpkg, dpkg.log đứng yên 2 dòng (md5 29941547). Khác #131 (replay đã chạy lúc respawn +3') và khác #134 (replay chạy từ boot+~1' — xem §1.5). Nguyên nhân host không replay trên #133: không rõ — ghi nhận, không suy đoán.
- **EARLY-REPAIR TRIGGER 20:47:31Z** (boot_age 924 s, frozen 704 s — mtime dpkg.log 20:35:47Z, dpkg 2 dòng < 100, 0 proc, chưa repair): verify form-B postboot check-only exit=1 (hoàn tất 20:47:32Z, đúng kỳ vọng) → `--repair` exit=0 (apt-get update timeout 1500 + install 11 gói, timeout 1800) → **postboot poll1 exit=0 (hoàn tất 20:50:33Z)**, dpkg 777 dòng, cache 108, lists 75, gst_sys 269 → **FLAG-WRITTEN 20:50:33Z mode repair-som-quyet-h poll=1** (old=7d642f2a; cờ cũ #131 backup thành `POSTBOOT_PASS-7d642f2a`, md5 f691ab08). Log apt của repair đã copy ra khỏi /tmp ngay (F-173-T5-9): `t5-postboot-repair-apt-05bda90d.log`.
- **Hồ sơ #133 (giống #130, khác #128/#131):** dpkg **777 dòng** (không phải 1.510), md5 e48c18f8; cache **108**; lists 75; GST là **symlink → debroot** 269=269 (isomp4 + libav đủ); **libwebkitgtk-6.0-4 VẮNG** (dpkg -l 0, không có trong debroot, không có trong ldconfig — xem §2); dpkg -l 895 dòng (giống #130). **Caveat đề xuất: (b1)** (repair, như #125/#126/#127/#129/#130).
- **Verify độc lập #133: exit=0, chạy 20:52:28Z**, log `t56-postboot-independent-05bda90d.log` md5 **1ee9c76e** — **byte-identical với poll1 log của watcher** (8 dòng: PASS wrapper K1, 5/5 lib, GST symlink 269=269 isomp4+libav, 11/11 apt, KẾT LUẬN ĐỦ ĐIỀU KIỆN). dpkg md5 e48c18f8 không đổi trước/sau (777 dòng) — verify chỉ đọc.
- **Chạy khi KHÔNG có cửa sổ nào mở:** T4 W1 chưa mở lúc đó (poll #11/#12, load1 3,56–4,31 > 2); W1-ACTIVE không tồn tại; lock log không có ACQUIRED nào sau 20:50:31Z cho tới T4 21:33:13Z. Verify 20:52:28Z nằm ngoài mọi cửa sổ (b) — đúng (p2)-198.
- **Ledger sau repair #133 (chi tiết thuộc T5-202 — đã đóng, verify 21/21 PASS):** 1 dòng compacted (3.107 B, md5 e3b9d767, ts 1795780866, added 173) → **2 dòng** (5.016 B, md5 90e27ebe): dòng 2 ts 1795812631 (= 20:50:31Z), added 106, removed 0, không webkit, ⊆ dòng compacted 106/106; tái dựng từ apt log 108 − 2 = 106 (2 gói upgrade libelf1t64/libssh-4); tập 106 gói giống hệt repair #130. Snapshot dpkg-state 784 → 890. **Repair append là đúng thiết kế** (F-199-T56-9 vẫn ĐÓNG).

### §1.5 REBOOT 21:05:15Z — boot mới bd22dffd (#134) + host replay KHÔNG CÀI GÌ + EARLY-REPAIR + POSTBOOT_PASS #134

- **Bằng chứng reboot (không phải glitch service):** phiên exec của T56 (sleep 115 s) bị gián đoạn — service restart chính là reboot; boot_id mới `bd22dffd-4949-4ac2-8e57-a6d3fb2868e2`; btime 1795813515 = **21:05:15Z** (uptime -s khớp; uptime 1' lúc 21:06:25Z); journal list-boots chỉ còn idx 0 = bd22dffd (first 21:05:28Z); /tmp bị xóa sạch. Gap #133 → #134 = **1.988 s** (33m08s).
- **Host auto-replay CHẠY trên #134 (lần đầu T56 nhìn thấy trực tiếp):** process preflight-opportunistic os-intent replay (pid 798) + `apt-get update` (pid 819) chạy 21:06Z → ~21:21Z (~15 phút; /var/lib/apt/lists/ 104 MB → 149 MB → 43,5 MB; lists 3 → 10). **NHƯNG replay KHÔNG CÀI GÌ:** dpkg.log đứng yên 2 dòng suốt 21:06–21:21Z; dpkg-state.txt vẫn 784 dòng; ledger không append trong lúc replay chạy. Replay thoát ~21:21Z (pid 798 biến mất; apt cuối pid 15307 chỉ sống ~30 s). Xem F-202-T56-2.
- **Host fold ledger 2 → 1 lúc 21:21:34Z** (ngay khi replay kết thúc): ledger 5.016 B md5 90e27ebe → **3.107 B** (1 dòng COMPACTED, ts 1795812631, added 173 gồm webkit, removed 0); dpkg-state.txt viết lại 21:21:34Z (784 dòng). Đúng hành vi T5-202 đã dự báo ("nếu host fold dòng 2 về 1 dòng compacted sau đó, đó là hành vi đúng thiết kế — T5-203 đối chiếu theo nội dung dòng compacted"). T5-202 đã lưu bản sao ledger 2 dòng trước khi fold.
- **EARLY-REPAIR TRIGGER 21:21:44Z** (boot_age 989 s, frozen 940 s — mtime dpkg.log 21:06:04Z, dpkg 2 dòng < 100, 0 proc — host apt vừa tắt đúng poll đó, không tranh chấp): verify form-B postboot check-only exit=1 (hoàn tất 21:21:44Z, đúng kỳ vọng) → `--repair` exit=0 (apt-get update ~6 phút + install 11 gói — cache đã bị host autoclean xóa 108 → 0 nên phải tải lại) → **postboot poll1 exit=0 (hoàn tất 21:28:09Z)**, dpkg 777 dòng, cache 108, lists 66, gst_sys 269 → **FLAG-WRITTEN 21:28:09Z mode repair-som-quyet-h poll=1** (old=05bda90d; cờ cũ #133 backup thành `POSTBOOT_PASS-05bda90d`, md5 86bb2696). Log apt của repair đã copy ra khỏi /tmp ngay (F-173-T5-9): `t5-postboot-repair-apt-bd22dffd.log`.
- **Hồ sơ #134 (giống #133/#130, khác #128/#131):** dpkg **777 dòng**, md5 5d739d24; cache **108**; lists 66 (không phải 75 — update của repair lấy ít list hơn); GST là **symlink → debroot** 269=269; **libwebkitgtk-6.0-4 VẮNG** (xem §2); dpkg -l 895 dòng. **Caveat đề xuất: (b1)** (repair).
- **Verify độc lập #134: exit=0, chạy 21:30:15Z**, log `t56-postboot-independent-bd22dffd.log` md5 **ad115f08** — **byte-identical với poll1 log của watcher** (8 dòng: PASS wrapper K1, 5/5 lib, GST symlink 269=269 isomp4+libav, 11/11 apt, KẾT LUẬN ĐỦ ĐIỀU KIỆN). dpkg md5 5d739d24 không đổi trước/sau (777 dòng) — verify chỉ đọc.
- **Chạy khi KHÔNG có cửa sổ nào mở:** T4 W1 mở 21:33:13Z (sau verify 3 phút); W1-ACTIVE không tồn tại lúc verify; lock trống (RELEASED cuối 20:50:31Z). Verify 21:30:15Z nằm ngoài mọi cửa sổ (b) — đúng (p2)-198.
- **Ledger sau repair #134:** 1 dòng compacted (3.107 B, fold 21:21:34Z) → **2 dòng** (5.016 B, md5 751a6fac): dòng 2 ts 1795814889 (= 21:28:09Z), added 106, removed 0. dpkg-state.txt 784 → 890 dòng. Repair append đúng thiết kế; T5-203 đối chiếu nội dung dòng 2.

## §2. GST + WebKit (h)-198

- GST #133: **symlink → debroot**, 269 file hệ thống = 269 debroot (isomp4 + libav đủ). GST #134: **symlink → debroot**, 269 = 269. Giống #129/#130; khác #128/#131 (thư mục thật).
- WebKit libs: #133 **VẮNG** + #134 **VẮNG** — kiểm 3 lớp đều âm tính: (1) `dpkg -l | grep webkit/javascriptcore` = 0 (dpkg -s: "not installed"); (2) `find` trong debroot (348 entry) + `find / -maxdepth 6 -name 'libwebkitgtk-6.0.so*'` = 0; (3) `ldconfig -p | grep webkit` = 0. Khác #130 ("VẮNG webkit (debroot giữ)") — trên #133/#134 debroot cũng KHÔNG giữ webkit. NEED 11 gói đủ cả 11 (poll1 log: PASS apt 11/11 — 11 gói này không gồm libwebkitgtk). **KHÔNG cài tay** (đúng (h)-198).
- Hệ quả: T01 O8 WebKit trên #133 FAIL cả 2 attempt (Target crashed — xem §4). O8 WebKit cần webkit libs thật; repair 11 gói không khôi phục chúng (chỉ full replay như #128/#131 mới có).

## §3. Cờ cũ — md5 (kiểm lại lúc đóng)

- #134 (mới, 21:28:09Z, repair-som-quyet-h poll=1): **f42af6ee** (324 B)
- #133 (20:50:33Z, repair-som-quyet-h poll=1; backup POSTBOOT_PASS-05bda90d): **86bb2696** (324 B)
- #131 (15:12:20Z, replay-day-du poll=0; backup POSTBOOT_PASS-7d642f2a + round201-t56/POSTBOOT_PASS): **f691ab08** (315 B, cả hai bản giống hệt)
- #130 chính thức round200 (12:01:06Z, repair-som-quyet-h poll=1): **e95ba374** — không đổi
- #129 (07:08:07Z, repair-som-quyet-h poll=1; backup POSTBOOT_PASS-e6e070b8): **e09dfd4c** — khớp đợt 201
- #128 (05:51:25Z, replay-day-du poll=0; backup POSTBOOT_PASS-773743f2 trong round199-t56): **62c1346c**
- #127: **153d57e7** — #126: **f076a945** — #125: **48fec087** — #123: **e94fad95** — #121: **28847b1e** — #119: **863a6035**. Tất cả KHỚP đợt 201 (mỗi md5 tìm thấy ở 2 bản sao).

## §4. T01-202 O8 + ENOSPC + (m) thô

- T01-202 O8 trên #133 (lock t01-round202 20:46:27–20:48:49Z, hold 142 s; theo T01-202 NOTES.md — T56 chỉ ghi nhận): WebKit attempt1 exit=2 20:46:55Z (S0 PASS, S1 FAIL rect checkbox, Target crashed setInputFiles) + attempt2 exit=2 20:47:24Z (FAIL Y HỆT) + probe S1 exit=1 (thiếu eperm-retry.mjs — lỗi setup T01) rồi exit=2 (page.goto WebKit internal error, renderer chết); Chromium exit=0 20:48:49Z **21/21 PASS**; 0 lỗi exit 127; webkit 27.2; cả 3 bộ CÙNG CÂY (preview.tsx 477a0eac + media.ts ac89aeb2). **Chân FULL PASS "O8 3/3" KHÔNG ĐẠT đợt này** (WebKit 0/2 — khác đợt 201: 3/3). T01-202 chưa chạy O8 trên #134 (đóng ~21:10Z, trước cờ #134 21:28:09Z). T01-202.done chỉ có timestamp "2026-11-27T21:15:15Z" (21 B) — chưa có nội dung; hồ sơ thật là NOTES.md + appendix202.py/txt (xem F-202-T56-6).
- (m) thô (T01-202 NOTES.md, DB tươi): **#132: 1 DƯƠNG** (eid 11679 requeued_after_restart 1795799049.208 = btime+49,208 s; eid 11680 dispatched +49,283 s; eid 11681 reattached +49,331 s; gap bao trùm 248,968 s); **#133: 0 event** trong [20:32:40Z; 20:32:56,8Z] (gap bao trùm 8.405,823 s); **#134 THÔ → T2-202** (T56 không truy vấn DB đợt này). Phân loại CUỐI thuộc T2-202. Runs (T01-202): run 210 TIMEOUT → CA #32 (T7-202); run 211 SUCCEEDED; run 212 RUNNING (started 20:35:51Z); F-202-T01-5: gen mismatch (T7-202 ghi 874e02c3, thực tế 649ea114).
- ENOSPC (T56 chỉ đếm thô — chuỗi thuộc T9-202): **#133 = 15 dòng** (journalctl từ btime 20:32:07Z, đếm live lúc 20:54:09Z; dòng đầu 20:37:39Z = boot+332s); **#134 = 15 dòng** (đếm lúc 21:49:08Z; dòng đầu 21:07:02Z = boot+107s — về lại mẫu ~110s như #132: T9-201 ghi dòng đầu #132 boot+117s); **#132: T56 KHÔNG đếm được** (journal chỉ giữ boot hiện tại — đếm lại sau reboot trả về 1 dòng sai; số T9-201 là chuẩn); dmesg = 0 cả hai. Phương pháp: `journalctl --since <btime> --grep "No space left on device" | wc -l` (đếm TRONG lúc boot còn sống; sau reboot journal cũ bị xóa — bài học đợt này).

## §5. Lock health (T6)

### §5.1 Số đếm cuối (21:53:54Z, analyze-log.py trên vite-lock-v2.log)

- total cleaned 3076 / raw 3082; TICKET 892 / ACQUIRED 881 / RELEASED 867; COOLDOWN 412 / STALE-LOCK 13 / STALE-TICKET 1 / TIMEOUT 10; pairs 867; double-acquire 7; still_held_at_end=1; held_owners=[t8-round202].
- So với T56-201 kiểm cuối (15:47Z: 3058/3064; 886/875/862; COOLDOWN 411; STALE-LOCK 13; pairs 862; double-acquire 7; held 0): Δ raw +18, cleaned +18, TICKET +6, ACQUIRED +6, RELEASED +5, COOLDOWN +1, STALE-LOCK 0, pairs +5, double-acquire 0. Chênh ACQ−REL = 881−867 = **14 = 13 STALE (giữ nguyên) + 1 đang giữ (t8-round202 cycle 2)**.
- 18 dòng mới đối chiếu khớp từng dòng: t8-round201 ×3 (16:01:50–16:03:54Z, hold 123 s — sau mốc đếm 15:47Z đợt 201) + t01-round202 ×3 (O8, 20:46:26–20:48:49Z, hold 142 s) + t01-round202-probe ×3 (20:50:05–20:50:31Z, hold 26 s) + t4 ×3 (W1, 21:33:13–21:36:47Z, hold 214 s) + t8-round202 ×6 (cycle 1: TICKET+ACQUIRED+RELEASED 21:50:21–21:51:42Z hold 81 s + COOLDOWN 21:51:43Z; cycle 2: TICKET+ACQUIRED 21:51:57Z, đang giữ). 0 dòng nào của T56 trên log thật. 0 RELEASED không ACQUIRED trước, 0 TIMEOUT mới (cuối 19/11 15:50:28Z). **Kết luận: lock KHỎE** (holder đang giữ là hoạt động bình thường của T8-202).
- T01 O8 giữ lock 20:46:26–20:48:49Z (hold 142 s). T4 giữ lock attempt1 21:33:13–21:36:47Z (hold 214 s). T8-202 cycle 1 hold 81 s.

### §5.2 #132/#133/#134 KHÔNG GIẾT HOLDER — chuỗi 7 → 10 (nếu parent xác nhận số hiệu)

- #132: dòng lock cuối trước btime 17:03:20Z là t8-round201 RELEASED 16:03:54Z; 0 dòng 17:03:20–18:00Z. Lock trống **3.506 s** trước btime. **#132 KHÔNG GIẾT HOLDER.**
- #133: dòng lock cuối trước btime 20:32:07Z cũng là t8-round201 RELEASED 16:03:54Z. Lock trống **15.493 s**. **#133 KHÔNG GIẾT HOLDER.**
- #134: dòng lock cuối trước btime 21:05:15Z là t01-round202-probe RELEASED 20:50:31Z; 0 dòng sau btime cho tới T8-202 21:50:21Z. Lock trống **884 s**. **#134 KHÔNG GIẾT HOLDER.**
- Chuỗi holder: 7 (#131, (i)-201) → **8 (#132) → 9 (#133) → 10 (#134)** (nếu #132/#133/#134 xác nhận).

### §5.3 Snapshot zombie / X11 / ss (21:49:08Z)

- Snapshot: zombie 0; socket X11 **1** (X193, mtime 21:33 — xem F-202-T56-7); Xvfb 0; listener 0.0.0.0:8765 = 0. Socket X193 sót đợt 200 đã biến mất sau reboot #133 — nhưng X193 MỚI xuất hiện 21:33Z (trùng giờ T4 W1 mở) mà không còn tiến trình Xvfb nào giữ (xem F-202-T56-7).

## §6. (A) + suite + monitor + T4-202 (ghi nhận)

- Script: suite `apps/web/scripts/test-vite-lock-v2.sh` md5 **a89c0676** (không đổi). Poll script md5 **1710e480**; lock v2 md5 **520b8baa**; lock v1 md5 **fd21193c** (cả ba khớp đợt 201). Khối T7 trích `t7-block-a202.sh` (trích lại từ suite mỗi lần chạy, verbatim).
- 4 script 202 sinh bằng `hidden_files/round202-t56/gen-suite-202.py` từ bản 201 + **giữ SUA F-198-T56-3 (monitor + gate-check xem CẢ HAI đường poll log T4) + SUA F-199-T56-2 (gate-check chỉ xét dòng MỚI kể từ baseline)**: `t7-gate-monitor-202.sh`, `run-harness-202.sh`, `suite-runner-202.sh`, `t7-control-a202.sh`. Tất cả bash -n OK.
- **Suite trên #133: 9/9 × 6 lượt, rc=0 cả 6** (20:59:10–21:01:52Z, pgid 38178). Monitor 1 START / 1 END "0 cua mo". Gate-check lúc bắt đầu (lock trống — RELEASED 20:50:31Z; T4 chưa mở W1). **Đã archive** thành `suite-202-05bda90d.log` + `test-v2-t6-run{1..6}-05bda90d.log` (KHÔNG tính vào chuỗi #134 — caveat F-202-T56-10).
- **Harness trên #133: CHUNK 1 30/30 PASS (21:02:49–21:04:43Z) + chunk 2 chạy tới run 48 — BỊ GIẾT GIỮA CHỪNG DO REBOOT #134** (không phải monitor kill: không có dòng KILL nào; cả harness lẫn monitor chunk 2 đều chết cùng cell reset). Log + churn đã archive thành `t7-a202-churn-05bda90d-partial.log` (48 runs, delays min 671 max 3.500 avg 2.173,88 ms) — KHÔNG tính vào (A).
- **Suite trên #134 lần 2: PARTIAL 4/6** (run1–4: 21:31:45–21:33:11Z, 9/9 × 4; pgid 21457) — **monitor KILL ĐÚNG THIẾT KẾ 21:33:19Z** khi T4 mở W1 21:33:13Z (GATE-MO-GIUA-CHUNK, poll-t4.log dòng mới). Đã archive thành `suite-202-bd22dffd-partial.log` + `test-v2-t6-run{1..4}-bd22dffd.log` (KHÔNG tính vào chuỗi).
- **Suite trên #134 lần 3 (chạy lại đầy đủ): 9/9 × 6 lượt, rc=0 cả 6** (run1–6: 21:37:50–21:39:57Z, pgid 35340). Monitor 1 START / 1 END "0 cua mo". Gate-check lúc bắt đầu (lock trống — T4 RELEASED 21:36:47Z; W1 đã đóng, poller thoát 21:37:13Z). **Chuỗi suite xanh 82 → 83 (đề xuất, trên #134).**
- **Harness (A) trên #134 (chạy lại đầy đủ): 120/120 PASS, 0 FAIL** (21:40:24–21:48:02Z; chunk 1–4 mỗi 30/30, rc=0). **(A) lần thứ 51 (tổng 6.120/6.120) — đề xuất, trên #134.** B1=1 B2=0 cả 120 lần (grep chính xác `^run [0-9]+ -> PASS` = 120, `-> FAIL` = 0; "124" của runner là artifact đếm cả 4 dòng summary chunk — xem F-202-T56-8, cùng lớp F-199-T56-8/F-201-T56-6). Churn delays #134 (120 dòng cuối, đã tách `churn-delays-bd22dffd.txt`): min 513 ms, max 3.479 ms, avg 2.106,13 ms. Gate-check mỗi chunk đều qua (acquired_raw=881; BASE_ACQ=881). Monitor 5 s bọc mỗi chunk: 4 START / 4 END, đều "0 cua mo" (tổng monitor đợt này: suite 3 START / 2 END + 1 KILL đúng thiết kế + harness #133 2 START / 1 END (chunk 2 chết cùng reboot) + harness #134 4 START / 4 END; 0 KILL sai).
- T4-202 monitor (cả hai đường log — F-198-T56-3): T4 chỉ ghi vào `hidden_files/round202-t4/poll-t4.log`; file gốc `hidden_files/round202-t4-poll.log` KHÔNG TỒN TẠI (lỗi cosmetic như F-200-T56-8 — xem F-202-T56-8). T4 poll-wait từ ~20:43Z trên #133 (poll #1–#25, gate0 chưa đạt — load5 2,80–4,67 > 2), reboot giết poller, khởi động lại 21:06:51Z trên #134 (poll #1–#36); gate: GATE_OPEN=1 cần gate0 (T5 PASS) + PB=0 + APTN=0 + TREEOK + **load1<2 + load5<2** + RAM≥1024 + LOCKOK + BLOCKERS=0. T4 thấy cờ #134 ở poll #30 (21:28:42Z) và mở W1 ở poll #36 (21:33:13Z, RAM 1.057 MB).
- **attempt1 #70: CUA YEN MO poll #36 21:33:13Z → ACQUIRED 21:33:13Z → RELEASED 21:36:47Z (hold 214 s); exit=0, 20/20 + LỚP B ĐẠT 5/5 + tickCost median=52,0 ms ≤ 60 — LƯỢT HỢP LỆ, poller thoát 21:37:13Z** (đã dùng ngân sách 1/3; W2/W3 không chạy). **Lượt yên #70: CÓ 1 LƯỢT HỢP LỆ — chuỗi lượt yên hợp lệ 2 → 3 (ĐỀ XUẤT của T4; parent quyết (m)-202).** Live-check #21: ĐẠT (W1 0 spike B2 — đề xuất của T4; parent quyết). B2 dữ kiện #14 (W1 0 spike). Verdict thuộc T4-202/T10-202 + parent; T56 chỉ ghi nhận.
- .done 202 lúc T56 đóng: P1, P2, P3, P4, T01, T4, T5, T7 (8 file). Chưa đóng: T2, T8, T9, T10, T56 (đợt này). T8-202 đang chạy cycle 2 (giữ lock lúc T56 đóng).

## §7. Prune 76

- Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa `cooldown-*` mtime >7 ngày (find -mtime +7 = ≥192h); (b) trần mềm 100 file; (c) không xóa file đợt hiện tại/ngay trước; (d) ghi tên + số file xóa; (e) chỉ chạy khi lock trống.
- Chạy 20:55:18Z, lock trống đã kiểm trước/sau (dòng cuối RELEASED 20:50:31Z t01-round202-probe; T4 chưa acquire, T8 chưa chạy). **XÓA 2 FILE theo điều (a):** cooldown-t8-round147 (Nov 19 17:16, ~193h), cooldown-t8-round148 (Nov 19 18:51, ~192h). Queue: 87 file / 1218 B → **85 file / 1190 B**. Tầng tuổi: ≥192h: 2 → 0; ≥168h: 12 → 10; ≥72h: 56 → 54; ≥48h: 66 → 64. Điều (b) KHÔNG kích hoạt (85 < 100). Ghi `prune-time.txt` + `prune-deleted.txt`. **F-147-T6-1 — CHUỖI VẪN 0, lần thứ 23 liên tiếp sau khi đứt tại 179** (cả 2 file xóa đều qua mốc 168h lúc xóa).

## §8. Findings F-202-T56-n (ghi nhận)

- **F-202-T56-1:** reboot #134 (btime 21:05:15Z) giết watcher-202 spawn1 (pid 4676) + harness #133 chunk 2 (dừng ở run 48) + phiên exec của T56 (service restart chính là reboot — btime + uptime 1' + /tmp sạch + PID 1 start 21:05 chứng minh). Respawn pid 2113 lúc 21:07:12Z; khoảng không-watcher 92 s; boot mới không bao phủ 117 s. Poll cuối của watcher cũ (21:05:40Z) vẫn ghi boot 05bda90d — 25 s SAU btime mới — cùng mẫu F-201-T56-2 (cell reset giết tiến trình trễ hơn btime kernel). Bài học: không có gì mới — respawn bằng đúng script cũ là đủ (logic new-boot đã có sẵn).
- **F-202-T56-2:** host auto-replay trên #134 chạy apt-get update ~15 phút (pid 819, 21:06–21:21Z) nhưng **KHÔNG CÀI GÌ** (dpkg.log đứng yên 2 dòng; dpkg-state 784 dòng; ledger không append trong lúc replay chạy). Nó chỉ: update index (lists 3 → 10), fold ledger 2 → 1 (21:21:34Z), reseed dpkg-state (784), autoclean xóa cache 108 → 0. Trái với #131 (replay đầy đủ 1.510 dòng) và trái với #133 (không có auto-replay nào quan sát được). Câu hỏi cho T5-203/host: replay thoát vì sao không cài — receipt withheld? danh sách install rỗng? Journal KHÔNG có entry "os-intent replay" nào nên T56 không kết luận được. **Watcher early-repair mới là thứ khôi phục thật cả #133 lẫn #134** (cả hai đều repair-som-quyet-h, dpkg 777).
- **F-202-T56-3 (đính chính số liệu cũ):** gap #130 → #131 trong LIMITS T56-201 §1.4 ghi "13.764 s (3h49m24s)" là SAI — đúng là **13.364 s** (3h42m44s; epoch 1795791865 − 1795778501; T01-202 NOTES ghi đúng). Sai số 400 s, chỉ ảnh hưởng con số gap đợt 201, không ảnh hưởng quyết nào (parent đã quyết (e)-201 trên số hiệu boot, không trên gap).
- **F-202-T56-4:** monitor kill suite #134 lần 2 ĐÚNG THIẾT KẾ (21:33:19Z, T4 W1 mở 21:33:13Z) — 0 thiệt hại (4 run đã xong đều 9/9; đã archive partial và chạy lại đủ 6 run). Đây là lần đầu monitor suite kill thật (đợt 201 monitor chỉ END bình thường). Chứng minh cơ chế bảo vệ W1 hoạt động.
- **F-202-T56-5 (lỗi của chính T56):** T56 ghi file TRONG W1 của T4 — archive suite2 partial (cp suite-202.log + 4 run log) lúc ~21:34:39Z, trong cửa sổ W1 21:33:13–21:36:47Z. T4-202 ghi nhận "T56-202 ghi 2 file" (F-202-T4-3) — giao (p)-202 phán. Bài học: KHÔNG ghi file nào trong W1, kể cả archive/rename trong thư mục riêng — chờ W1 đóng rồi mới archive. (Monitor chỉ kill tiến trình suite/harness, không chặn exec ghi file tay của T56.)
- **F-202-T56-6:** T01-202.done chỉ có timestamp "2026-11-27T21:15:15Z" (21 B, mtime 21:13Z — nội dung timestamp còn SAU mtime file) — chưa có nội dung, không dùng làm nguồn. Hồ sơ thật của T01-202 là NOTES.md + appendix202.py/txt + boot-survey-202t01.txt (đầy đủ, chính xác). Không phải lỗi nội dung — chỉ ghi nhận để T10 không đếm .done này là "có nội dung" nếu chỉ nhìn kích thước.
- **F-202-T56-7:** socket X11 X193 (mtime 21:33Z — trùng giờ T4 W1 mở 21:33:13Z, có thể là display của attempt1) còn sót lại mà không còn tiến trình Xvfb nào (pgrep Xvfb = 0). Cùng lớp F-200-T56-7 (X193 orphan đợt 200 đã tự hết sau reboot #133). Socket sót này sẽ sạch ở reboot sau; không ảnh hưởng đo đạc (T4 đã đóng W1 hợp lệ).
- **F-202-T56-8:** artifact đếm "124" của runner lặp lại (F-199-T56-8/F-201-T56-6): grep thô "PASS"/"FAIL" đếm cả 4 dòng summary chunk (PASS=30/FAIL=0 mỗi dòng) → 124/4. Số thật 120/0 (grep `^run [0-9]+ -> PASS/FAIL`). Không sửa script giữa đợt. Lỗi cosmetic "No such file" cho đường poll log T4 gốc (round202-t4-poll.log không tồn tại — T4 chỉ ghi đường mới) lặp lại như F-200-T56-8; monitor/harness xử lý được (wc -l → 0), không ảnh hưởng gate-check.
- **F-202-T56-9:** churn-delays.txt gộp cả 2 lần chạy (48 dòng #133 partial + 120 dòng #134 = 168 dòng) vì T56 không xóa file trước khi chạy lại harness. Đã tách riêng: `churn-delays-05bda90d-partial.txt` (48 dòng) + `churn-delays-bd22dffd.txt` (120 dòng). Bài học: xóa file churn trước mỗi lần chạy harness mới.
- **F-202-T56-10 (caveat chuỗi — analog F-201-T56-10):** đợt 202 trải qua **BA boot** (#132 không cờ, #133, #134) — suite/(A)/lượt yên #70/live #21 đều đo trên **#134**, còn suite #133 (6×9/9) + harness #133 partial (48 run) + O8 T01 đều trên **#133**. Parent quyết chuỗi suite xanh (82 → 83), (A) lần 51, lượt yên (2 → 3), live ĐẠT (0 → 1) có tính không, và FULL PASS đợt 202 tính theo boot nào. T56 đề xuất: tính trên #134 (boot cuối, đầy đủ nhất — như đợt 201 tính trên #131).
- **Trạng thái F-201-T56-n:** -1 (cờ trùng lặp) — ĐÃ SỬA trong watcher-202 (ALREADY-PASS), chưa kích hoạt đợt này; -2 (reboot giết watcher) — TÁI DIỄN thành F-202-T56-1; -3 (T5 stale) — KHÔNG tái diễn (T5-202.done chính xác); -4 (monitor pgid sai) — ĐÃ SỬA, không tái diễn (cả 3 monitor suite + 6 monitor chunk đều dùng $! đúng); -5 (T01 stale) — KHÔNG tái diễn dạng cũ (T01-202 NOTES chính xác; xem F-202-T56-6); -6 (artifact 124/4) — TÁI DIỄN thành F-202-T56-8; -7 (X193) — TÁI DIỄN thành F-202-T56-7 (X193 mới); -8 (chồng lấn W1) — TÁI DIỄN thành F-202-T56-5 (lần này do chính T56); -9 (ledger fold) — ĐÓNG bởi T5-202 (fold 2 → 1 đúng, verify 21/21 PASS; fold mới trên #134 giao T5-203); -10 (caveat chuỗi 2 boot) — ĐÓNG bởi parent (i)/(q)-201: FULL PASS đợt 201 KHÔNG CÓ (2 boot), suite xanh 82 + (A) lần 50 tính trên #131.

## §9. Đề xuất cho parent (quyết ở aggregate 202)

- (a) Chấp nhận phần T56 đợt 202 (watcher-202 + respawn, POSTBOOT #133 + #134, lock, (A), suite, prune 76, marker).
- (b) Cờ #133: **CÓ, caveat (b1)** (repair poll=1 20:50:33Z, dpkg 777, GST symlink, webkit VẮNG). Cờ #134: **CÓ, caveat (b1)** (repair poll=1 21:28:09Z, dpkg 777, GST symlink, webkit VẮNG). Cả hai verify độc lập exit=0 byte-identical.
- (c) Xác nhận 9a30eb2a = **#132** (bằng chứng §1.3), 05bda90d = **#133**, bd22dffd = **#134** (cần survey mới của T01-202/T10 — T01-202 NOTES mới survey #133).
- (d) Holder #132/#133/#134 KHÔNG GIẾT — chuỗi 7 → 10 (nếu số hiệu xác nhận).
- (e) (A) lần 51 (6.120/6.120, #134) + suite xanh chuỗi 83 (#134) — caveat F-202-T56-10.
- (f) Prune 76 (xóa 2, queue 87 → 85); F-147-T6-1 chuỗi VẪN 0 lần 23.
- (g) Hướng (3) GIỮ 46 (theo (i)-201; parent quyết).
- (h) WebKit libs — #133 + #134 đều VẮNG hoàn toàn (dpkg/debroot/ldconfig đều 0). KHÔNG cài tay. O8 WebKit 0/2 trên #133 là hệ quả (xem §4).
- (i) **Marker 82 ĐÃ XÁC MINH → 85 nếu #132/#133/#134 xác nhận**: đường dẫn `/home/hatch/.config/vcut-persistence-marker`, 239 B, mtime 2026-11-20 11:39:47Z, md5 cb7102c0 — sống qua 3 boot mới.
- (j) Ledger: fold 2 → 1 lúc 21:21:34Z trên #134 (đúng thiết kế, T5-202 đã dự báo); repair #134 append dòng 2 (ts 1795814889, added 106) — T5-203 đối chiếu nội dung. Host auto-replay trên #134 KHÔNG CÀI GÌ (F-202-T56-2) — T5-203/host làm rõ nguyên nhân.
- (k) Lượt yên #70: attempt1 20/20 HỢP LỆ trên #134 — chuỗi 2 → 3 (đề xuất của T4; parent quyết (m)-202). Live-check #21 ĐẠT — chuỗi 0 → 1 (đề xuất của T4).
- (l) Chuỗi 12/12: CHƯA quyết được lúc T56 đóng (đợt chưa đóng sổ; T10-202 quyết theo (i)-201).
- (m) Tổng boot không cờ **31 → 32** (#124 + #132; nếu #132 xác nhận).
- (n) Watcher-203 spawn kịp thời sau 23:35:51Z (END watcher-202).
- (o) Replay #133: KHÔNG có replay đầy đủ (early-repair). Replay #134: host auto-replay CHẠY nhưng KHÔNG CÀI GÌ (watcher early-repair mới khôi phục thật).
- (p) Chồng lấn W1 (F-202-T4-3/F-202-T56-5): T56 ghi file trong W1 của T4 lúc ~21:34:39Z + T2-202 ghi 3 file — giao parent phán (p)-202. T56 nhận lỗi phần mình.
- (q) Đính chính gap #130 → #131: **13.364 s** (không phải 13.764 s như LIMITS T56-201).

## §10. Sai số của chính T56-202

- Ghi file trong W1 của T4 (archive suite2 partial ~21:34:39Z) — lỗi thật, đã nhận ở F-202-T56-5. Lần sau: không ghi gì trong W1, kể cả archive.
- Không xóa churn-delays.txt trước khi chạy lại harness (F-202-T56-9) — file gộp 168 dòng; đã tách riêng sau đó, số liệu #134 vẫn đúng (120 dòng cuối).
- Không lường trước host auto-replay trên #134 chạy update ~15 phút rồi không cài gì (F-202-T56-2) — watcher chờ đúng thiết kế (không repair khi apt chạy), không mất mát gì ngoài thời gian.
- Lock count cuối lấy 21:53:54Z — T8-202 đang giữ lock cycle 2 lúc đó; nếu T8 acquire thêm sau đó, số sẽ lệch; T10 dedup toàn cục là chuẩn. Chênh ACQ−REL = 14 (13 STALE + 1 đang giữ) đúng tại thời điểm đếm.
- Phiên exec spawn watcher-202 (spawn1 `proc_3314903167e6` + respawn `proc_228b4edc33f8`) còn backgrounded — cố ý, KHÔNG kill (sẽ giết watcher pid 2113). Parent/T10 lưu ý không kill 2 session này.
- (m) #134 THÔ không truy vấn được đợt này (chưa rõ bảng/eid trong muse.db) — giao T2-202; T01-202 đã có (m) #132/#133 thô.
- Gap #130 → #131 của chính T56-201 bị sai 400 s (F-202-T56-3) — đính chính trong đợt này, không giấu.

## §11. Batch stage

- 1 file mới: `docs/PHASE9_ROUND202_T56_INFRA_LIMITS.md` (< 37.768 B).
- Paths: `~/workspace/repo-1-push/paths-loop/phase9-round202-t56-infra.txt` (NUL-delimited, 1 entry).
- KHÔNG stage file làm việc trong `hidden_files/round202-t56/` (chỉ để tham chiếu).
- Chờ push: 191–201 = 133/490/378/357 (theo aggregate 201 §14.2) + đợt 202 (T10-202 đếm lại) + 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` (chưa quyết).
