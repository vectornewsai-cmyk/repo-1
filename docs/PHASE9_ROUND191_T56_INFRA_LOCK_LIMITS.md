# PHASE 9 — ROUND 191 — T56 (GỘP T5+T6) INFRA + LOCK LIMITS

**Đợt:** 191 (mở lượt cron 15:35:51 +07 25/11/2026 = 08:35:51Z; hạn cờ ~11:00Z, hạn cứng ~11:35Z). **Người viết:** T56-191 (gộp T5 infra/watcher + T6 lock health). **Chạy:** ~08:41Z → 09:09Z 25/11/2026. **Boot làm việc:** #114 ứng viên (b0aab705, btime 08:25:43Z — T0-191 xác minh; parent quyết (e) ở §12.3-191).
**Trạng thái:** ĐÃ XONG watcher-191 + cờ #114 (**replay-day-du, poll=0, KHÔNG caveat**) + (A) **120/120 lần thứ 40** + suite 9/9 × 6 + prune lần 65 + #113/#114 **KHÔNG GIẾT HOLDER** (chuỗi 16 → 18) + hướng (3) **lần thứ 37** + **F-191-T56-1..6**. 1 entry stage duy nhất.

## Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #114 ứng viên (b0aab705) | **ĐÃ CÓ 08:45:57Z (boot+20m14s, replay-day-du, poll=0, KHÔNG caveat)** — replay xong trước khi watcher spawn (dpkg 1468 ổn định từ 08:40:35Z, 50 transaction, cuối gstreamer1.0-tools 08:40:35Z) → poll0 exit=0 → FLAG-WRITTEN 08:45:57Z; verify độc lập exit=0; 11/11 NEED + 5/5 lib; GST 269=269 **thư mục thật**; dpkg **1468**; ledger KHÔNG thêm dòng (nhưng COMPACT 2→1, F-191-T56-5) |
| Replay #114 | **KHÔNG ĐÌNH TRỆ** — xong boot+14m52s; chuỗi: #112 KHÔNG, #113 KHÔNG XĐ (không watcher), **#114 KHÔNG** |
| POSTBOOT_PASS #113 (f7632121) | **KHÔNG CÓ** — đợt 190 VOID (parent xác minh, build-loop-log dòng 8613); 0 file POSTBOOT_PASS* nhắc f7632121; tổng boot không cờ **25 → 26** (đề xuất) |
| Cờ #112/#111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95 | **VẪN CÓ** (md5 KHÔNG ĐỔI — §3) |
| Watcher-189 | pid 116868 **DỪNG POLL 04:36:20Z, 4 s TRƯỚC btime #113** (0 END/STOP/NEWBOOT); **KHÔNG mẫu overlap mới** (chuỗi dừng mẫu 21, +10 s) |
| Watcher-190 | **KHÔNG TỒN TẠI** (đợt 190 VOID) |
| Watcher-191 | START 08:45:57Z, pid **9180**, hạn 11:35:00Z — **ALIVE lúc đóng** (poll 09:09:01Z) |
| Khoảng không-watcher | **~4h09m37s** (04:36:20Z → 08:45:57Z) — dài nhất từ trước; **bao 2 boot (#113 + #114)** — lần đầu |
| Hướng (3) | **VẪN ĐỨNG lần thứ 37** — brief ghi "lần 32" là **SAI** (F-191-T56-2) |
| Marker sống | CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#114 = 66 reboot** (T0) |
| (A) lock | **120/120 PASS lần thứ 40** (tổng **4800/4800**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 71 → **72** |
| Lock | KHỎE (759 cặp lúc kiểm cuối, 0 đang giữ, chênh **GIỮ 12**, STALE-LOCK GIỮ 12, double-acquire GIỮ 7, 0 TIMEOUT mới, 0 "KHÔNG NHẢ"); **#113 + #114 KHÔNG GIẾT HOLDER — chuỗi 16 → 18** |
| Prune lần 65 | **XÓA 5 FILE theo điều (a) — LẦN ĐẦU điều (a) kích hoạt** (queue 103 → 98; KHÔNG PHẢI CHỜ lock); F-147-T6-1 chuỗi **VẪN 0 lần thứ 12** |
| X11 / zombie | X11: mở 1 socket (X198) → đóng/kiểm cuối 2 socket (X193+X93, của T4-191); **0 zombie thật cả ba thời điểm** |
| Đồng hồ | Cloudflare **+2 s** (T0-191) — δ=2 s; khoảng trống lock gấp ~1550× / ~8429× δ → KHÔNG caveat |
| Quy tắc B4 | **T56-191 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 configure/install/update/repair tay); verify độc lập chỉ đọc |

**Số hiệu boot #114 CHƯA QUYẾT — T0-191 xác minh (parent quyết (e) ở §12.3-191).** (e)-189 ghi "Boot #113 f7632121 — T0-190 xác minh" — nhưng đợt 190 VOID nên T0-190 không tồn tại; btime/số hiệu #113 được T56 kiểm lại từ hồ sơ T7-189/T9-189 (§1.2).
**T56 KHÔNG phán (m), chỉ trình số thô — (m) #113 thô +35,149 s (T7-189 appendix; T2-191 phán cuối) + (m) #114 (T0-191: 0 requeue trong [08:20; 08:35]Z; T2-191 phán cuối) thuộc T2-191 + parent.**

## §0. Trạng thái lúc mở (~08:41Z)

- **Boot lúc mở: `b0aab705-7ef5-47fd-95e0-e97910fbfa88`, btime 08:25:43Z** (epoch 1795595143; `uptime -s` khớp; journal first 08:25:55Z = btime +12 s; /proc/1 mtime 08:25:55.382Z = btime +12,38 s; T0-191 survey 08:44:31Z khớp). **Số hiệu #114 ứng viên theo T0-191** (appendix191.py: b114 = 1795595143). **KHÔNG có reboot trong phiên T56.**
- **Replay #114 có vẻ ĐÃ XONG lúc mở:** dpkg.log 1468 dòng, md5 9387d070, mtime 08:40:35Z; /var/log/apt có đủ; history 50 transaction, cuối Install gstreamer1.0-tools End-Date 08:40:35Z; GST 269; cache 170; lists 37; libevent-2.1.so.7 **CÓ** (khác #112 lúc mở); 0 proc apt/dpkg. Watcher spawn 08:45:57Z xác nhận DONE ngay poll đầu (§1.1).
- **Lock lúc mở: TRỐNG** (dòng cuối RELEASED 03:44:45Z t8-round189); queue 102 file / 1428 byte. **T0-191 đang chạy** (o8-driver pid 11091, ACQUIRED 08:48:14Z — SAU snapshot mở); **T4-191 poller START ~08:48Z**; **T9-191 sampler/b2watch/probe-loop/autotrigger-live ĐANG CHẠY** (pid 9317/9319/9320/9322); **T8-191 waiter ĐANG CHẠY** (pid 7631). Không có dpkg/apt nào CỦA T56.
- **Latch:** `round-in-progress.md` KHÔNG tồn tại lúc mở (cả lúc đóng lẫn kiểm cuối — latch do parent quản lý, T56 không tự viết/xóa). **PUSH #9 đã xong** (14:36 +07 25/11, đợt 166–189) — chờ push reset về 0 trước đợt 191 (build-loop-log dòng 8613); đợt 191 đếm từ 0, T10 đếm lại.

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 25/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 02:33:19Z | Reboot #112 (27e6714f); cờ #112 đã có 03:11:11Z (T5-189, replay, poll=0) |
| 02:46:08Z | Watcher-189 START, pid 116868 (hạn 05:35:00Z) |
| 04:36:20Z | **Poll cuối watcher-189** (dpkg 1461, md5 c6a618c5, boot #112) — sau đó KHÔNG poll nữa, 0 END/STOP/NEWBOOT |
| 04:36:24Z | **Reboot f7632121 (#113)**; gap #112→#113 = 7.385 s (2h03m05s). Sampler T9-189: mẫu cuối #112 04:36:26Z → mẫu đầu #113 04:38:13Z (gap mẫu 107 s). T7-189: uptime #113 = 0 phút lúc 04:37:06Z, 11 phút lúc 04:48:21Z (KHỚP btime) |
| 04:36:59Z | Requeue run 190 eid 10947 (btime +35,149 s — (m) #113 thô, T2-191 phán cuối) |
| 08:25:43Z | **Reboot b0aab705 (#114 ứng viên)**; gap #113→#114 = 13.759 s (3h49m19s) |
| 08:40:35Z | Transaction cuối history.log #114: Install gstreamer1.0-tools (End-Date); tổng **50 transaction**; dpkg.log dừng ở 1468 dòng |
| 08:44:31Z | T0-191 boot survey (btime 1795595143 khớp; CF +2 s; libevent CÓ; marker không đổi) |
| 08:45:57Z | **Watcher-191 START, pid 9180** (khoảng không-watcher ~4h09m37s); poll đầu: dpkg 1468 ổn định, 0 apt/dpkg → **REPLAY_DONE** → postboot poll0 exit=0 → **FLAG-WRITTEN 08:45:57Z** |
| 08:46–08:47Z | T56 verify độc lập: postboot **exit=0** (11/11 NEED + 5/5 lib + GST 269=269 + tools ĐÃ CÀI) |
| 08:48:14Z | t01-round191 ACQUIRED (T0-191 O8, hold 210 s → RELEASED 08:51:44Z) |
| 09:03:40Z | t4 ACQUIRED (T4-191 attempt, hold 210 s → RELEASED 09:07:10Z) |
| ~09:09Z | T56 viết LIMITS này. Watcher-191 vẫn ALIVE (pid 9180, poll 09:09:01Z). |

### §1.2. Cờ #113 — KHÔNG CÓ (đợt 190 VOID; kiểm từ hồ sơ + grep toàn cây)

- **Đợt 190 VOID, không tồn tại** — parent xác minh trực tiếp lượt cron 15:35 +07 (build-loop-log dòng 8613): lượt cron 12:35 +07 (run 814be71a) CHỈ spawn T10-189 để đóng đợt 189, KHÔNG spawn bất kỳ luồng 190 nào. Bằng chứng: 0 agent đợt 190; 0 file `docs/PHASE9_ROUND190*`; 0 cờ `round190-*.done`; 0 file paths-loop `phase9-round190*`; GAP chưa có §118. **T56 xác minh lại trên đĩa:** `ls -d hidden_files/round190-*` = không tồn tại; 0 file docs ROUND190.
- **#113 (f7632121-7352-4543-b6ce-3fab71609e44, btime 1795581384 = 04:36:24Z):** kiểm lại từ hồ sơ — T7-189 appendix189.txt (mtime 04:51:51Z): uptime 0 phút lúc 04:37:06Z, 11 phút lúc 04:48:21Z — KHỚP btime; gap #112→#113 = 7.385 s; requeue run 190 eid 10947 lúc 04:36:59.149Z (btime +35,149 s). T9-189 sampler: mẫu đầu #113 04:38:13Z (sau gap mẫu 107 s). Watcher-189 poll cuối 04:36:20Z (4 s trước btime). **Lưu ý:** appendix189.txt ghi "T0-190 xác minh 9 nguồn" — T0-190 KHÔNG tồn tại (đợt 190 VOID); câu đó là T7-189 viết theo kế hoạch. Số hiệu #113 theo cách đếm ĐÃ QUYẾT + 4 nguồn độc lập trên — parent quyết (e).
- **Grep toàn hidden_files:** `f7632121` chỉ xuất hiện ở build-loop-log.md + round189-t7/appendix189/.done + round189-t9/ram-sampler*.log/t9-189-analyze-output.txt/.done — **0 file POSTBOOT_PASS* nào nhắc f7632121** (kiểm targeted trên 123 file cờ + grep toàn cây). **Kết luận: #113 KHÔNG CÓ cờ.** Tổng boot không cờ **25 → 26** (đề xuất, parent quyết (c)).

### §1.3. Cờ #114 ứng viên — ĐÃ CÓ (replay-day-du, poll=0) — KHÔNG caveat

- **Cờ:** `hidden_files/round191-t56/POSTBOOT_PASS`, 315 B, mtime 2026-11-25T08:45:57Z, md5 **288f863b** (FULL boot_id, btime 08:25:43Z, replay-day-du, poll=0). Backup cờ cũ: `POSTBOOT_PASS-27e6714f`, 315 B — **md5 ca79a6b2, byte-identical với cờ #112 gốc**.
- **Lịch trình:** replay chạy trong khoảng không-watcher (heal → 50 transaction → xong 08:40:35Z, boot+14m52s); watcher spawn 08:45:57Z (boot+20m14s) thấy dpkg 1468 ổn định, 0 apt/dpkg → **REPLAY_DONE ngay poll đầu** → postboot poll0 exit=0 → **FLAG-WRITTEN 08:45:57Z**. KHÔNG trigger EARLY-REPAIR (dpkg 1468 > 100), KHÔNG trigger BACKSTOP. **Caveat:** T56 mở muộn (boot+15') và watcher spawn muộn (boot+20') nên không quan sát trực tiếp quá trình replay — nhưng dpkg.log mtime/md5 + history.log 50 transaction + term.log 0 lỗi là bằng chứng độc lập replay chạy từ đầu (cùng mẫu #112: T5-189 cũng mở muộn boot+9').
- **Verify độc lập (T56, check-only, ~08:46Z):** postboot **exit=0** — PASS wrapper/libs/GST/apt; **11/11 gói NEED** + **5/5 lib**; GST **269=269 thư mục thật**; **tools ĐÃ CÀI** (gstreamer1.0-tools 1.24.2); **libc-bin 2.39-0ubuntu8.12**. **KHÔNG caveat (đề xuất — giống #109/#110/#112):** replay đầy đủ, poll=0, GST thư mục thật, tools đủ, dpkg 1468 (≈1461 của #112), 50 transaction (= #112), term.log 0 lỗi. **Parent quyết (§9(b)).**

### §1.4. Watcher-189 DỪNG POLL trước reboot #113 + Watcher-191 đang chạy

- **Watcher-189, pid 116868** (spawn 02:46:08Z trên #112): poll cuối **04:36:20Z, TRƯỚC btime #113 4 s** (log 226 dòng, 0 END/STOP/NEWBOOT). **KHÔNG có poll nào sau btime** — cùng kiểu watcher-188. **KHÔNG có mẫu overlap mới** — chuỗi overlap dừng ở mẫu 21 (+10 s, F-188-T5-1). Nguyên nhân dừng chưa rõ.
- **Watcher-190 KHÔNG TỒN TẠI** (đợt 190 VOID — §1.2). **Khoảng không-watcher ~4h09m37s** (04:36:20Z → 08:45:57Z) — dài nhất từ trước, **bao 2 boot (#113 + #114)**. Trong khoảng này cả hai replay đều tự chạy (không mất mát: #114 đủ 50 transaction; #113 không có cờ nhưng T9-189 sampler ghi boot f7632121 sống tới 04:51:14Z).
- **Watcher-191 — ĐANG CHẠY, đã làm xong nhiệm vụ chính:** spawn 08:45:57Z, pid **9180**, hạn 11:35:00Z. Khởi tạo: dpkg 1468, md5 9387d070, mtime 08:40:35Z, cache 170, lists 37, gst_sys 269. **REPLAY_DONE + FLAG-WRITTEN 08:45:57Z** (replay, poll=0). **Poll sau cờ đều 30 s** (dpkg 1468 ổn định — kiểm tới 09:09:01Z). Watcher vẫn ALIVE lúc T56 đóng — T56-192 tiếp quản.

## §2. Hướng (3) VẪN ĐỨNG lần thứ 37 + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kiểm lúc mở (~08:42Z): `user@0` static; `loginctl` "Failed to connect to bus: No such file or directory"; không linger; không `/run/user/0`; `systemctl list-timers` 0 timer VCut; không unit VCut nào. **Lần thứ 37 liên tiếp** (tính theo số lần kiểm: 33/34/35/36 ở đợt 186/187/188/189; đợt 190 VOID không kiểm). Watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172–189.

**F-191-T56-2 (brief sai số đếm):** brief T56 ghi "đang lần 32 sau đợt 189" — **SAI**. T5-186/187/188/189 đã ghi 33/34/35/36 (đối chiếu trực tiếp trên đĩa). Đợt này là lần thứ 37. T56 dùng số trên đĩa (tiền lệ F-189-T6-10).

**Marker:** nội dung và mtime **KHÔNG ĐỔI** từ khi viết (2026-11-20 11:39:47.272154981Z, 239 B, md5 cb7102c0). Sống qua **#49–#114 = 66 reboot theo cách đếm T0** (65 qua #113 theo T7-189 appendix + #114). **Đồng hồ:** T0-191 đo chặt 08:44:31Z: local mid 1795596271 vs CF Date 08:44:33 GMT → **CF +2 s**. **Btime ghi bằng epoch nguyên.** δ=2 s dùng cho verdict holder (§5).

## §3. Cờ cũ — VẪN CÓ, md5 KHÔNG ĐỔI (kiểm lại đợt 191)

- **#114 ứng viên (b0aab705):** round191-t56/POSTBOOT_PASS, 08:45:57Z — md5 **288f863b (MỚI)**, replay, poll=0, KHÔNG caveat (đề xuất).
- **#112 (27e6714f):** ca79a6b2 — KHÔNG ĐỔI. **#111 (257c1eae):** abe240cb — KHÔNG ĐỔI (repair, poll=1, CÓ caveat). **#110 (912f4a97):** 302ae331 — KHÔNG ĐỔI. **#109 (6f1d9f87):** a6fc7d69 — KHÔNG ĐỔI. **#107 (cea79500):** b7259902 — KHÔNG ĐỔI. **#104 (9161bfd1):** 8e6d6e5d — KHÔNG ĐỔI. **#102 (6ecd948e):** 6007fea8 — KHÔNG ĐỔI. **#101 (51745634):** 8c32fc3c — KHÔNG ĐỔI. **#99 (9897d4b4):** 3d031656 — KHÔNG ĐỔI. **#98 (e62eef3f):** 26452ec1 — KHÔNG ĐỔI. **#96 (8d2a69df):** 50869e4e — KHÔNG ĐỔI. **#95 (95b483a2):** f8cd6d46 — KHÔNG ĐỔI.
- **#113 (f7632121) / #108 / #105 / #103 / #100 / #97: KHÔNG CÓ cờ** (tổng boot không cờ 25 → **26** đề xuất).

## §4. Replay #114 KHÔNG ĐÌNH TRỆ + ledger compact

- **Replay #114 KHÔNG ĐÌNH TRỆ:** transaction cuối history.log 08:40:35Z (Install gstreamer1.0-tools, End-Date); dpkg.log dừng 1468 dòng (md5 9387d070, mtime 08:40:35Z, không đổi tới kiểm cuối 09:09Z); /var/log/apt có đủ (history 50 transaction, term.log 0 lỗi); GST 269; cache 170; lists 37; 0 proc apt/dpkg từ lúc mở. Xong boot+14m52s — trong dải bình thường của replay chạy thật (#112: boot+37m52s; #110: boot+3m; #109: boot+19m; #111: ĐÌNH TRỆ 44').
- **#113 KHÔNG XÁC ĐỊNH ĐƯỢC** (không có watcher-190; T9-189 sampler chỉ ghi boot sống + balloon pinning, không ghi tiến triển dpkg). Chuỗi đình trệ: #102 không, #103 có, #104 không, #105 KHÔNG XĐ, #108 KHÔNG XĐ, #109 không, #110 không, #111 CÓ, #112 không, #113 KHÔNG XĐ, **#114 KHÔNG**. Nguyên nhân đình trệ #100/#101/#103/#111 **VẪN CHƯA TÌM RA trong cell** → **vẫn nợ host-side** theo quyết (k) đợt 174.
- **Ledger — replay #114 KHÔNG thêm dòng; COMPACT 2→1 dòng (F-191-T56-5):** ledger.jsonl lúc kiểm cuối (09:09Z): **1 dòng** — ts **1795565495** (= 00:11:35Z, repair #111), compacted=true. T5-189 (03:15Z) còn thấy **2 dòng** ([0] ts 1795542525 compacted, repair #107; [1] ts 1795565495, repair #111). **Giữa 03:15Z và 09:09Z ledger đã COMPACT 2→1 dòng. KHÔNG có dòng mới cho #113 hay #114** — replay KHÔNG thêm dòng. **T2/T10 lưu ý: ts 1795565495 là của repair #111, KHÔNG phải btime #113 (1795581384) hay #114 (1795595143).**

## §5. Lock health (T6) — #113/#114 KHÔNG GIẾT HOLDER, chuỗi 16 → 18

### §5.1. Nhất quán log lock: 759 cặp lúc kiểm cuối, 0 đang giữ, chênh GIỮ 12

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 189). Số chính thức đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T6-189 kiểm cuối | T56-191 mở | T56-191 đóng | T56-191 kiểm cuối | Δ trong phiên |
|---|---|---|---|---|---|
| Tổng dòng | 2655 | 2689 | 2692 | 2693 | +4 |
| TICKET / ACQUIRED / RELEASED | 771 / 760 / 748 | 781 / 770 / 757 | 782 / 771 / 758 | 782 / 771 / **759** | +1 / +1 / +2 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 353 / 12 / 1 / 10 | 358 / 12 / 1 / 10 | 358 / 12 / 1 / 10 | 358 / 12 / 1 / 10 | +0 |
| Cặp ACQUIRED→RELEASED | 748 | 757 | 758 | **759** | +2 |
| Đang giữ cuối log / Chênh ACQ−REL | 0 / 12 | 1 (t01) / 13 | 1 (t4) / 13 | **0 / 12** | — |
| Double-acquire (nghiêm ngặt) | 7 | 7 | 7 | **7** | 0 mới |

- **KIỂM CUỐI ĐỢT NÀY (đúng nhãn — bài học (r) đợt 163): ACQUIRED 771 / RELEASED 759, 759 cặp.** Các số 770/757 là lúc mở; 760/748 là kiểm cuối đợt 189.
- **+34 dòng kể từ T6-189 kiểm cuối** (2655 → 2689 lúc mở): t4-189 ×3 (03:12:48–03:16:16Z, hold 208 s) + t0-round189 ×3 (03:18:30–03:21:02Z, hold 152 s) + t8-round189 ×26 (7 chu kỳ 03:26:36–03:44:45Z, hold 70/131/241/60/121/221/150 s) + t01-round191 ×2 (TICKET+ACQUIRED 08:48:14Z). **+4 dòng trong phiên T56:** t01-round191 RELEASED 08:51:44Z (hold 210 s) + t4 TICKET+ACQUIRED 09:03:40Z + t4 RELEASED 09:07:10Z (hold 210 s). **Tất cả chu kỳ đều khép kín.**
- **Double-acquire GIỮ 7 — 0 ca mới**; STALE-LOCK GIỮ 12 — 0 ca mới; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE.** Caveat: **#68 GIẾT HOLDER t4**; **#69–#94 KHÔNG giết** (26 reboot); **#95 CÓ GIẾT HOLDER** (t8-round179); **#96–#105 + #107–#114 KHÔNG giết** (verdict đợt 186–191; #106 không tính).

### §5.2. #113 + #114 — KHÔNG GIẾT HOLDER (chuỗi 16 → 18)

| Reboot | btime | Dòng lock cuối trước btime | Trạng thái lock tại btime | Dòng trong cửa sổ mở | STALE-LOCK mới |
|---|---|---|---|---|---|
| #113 | 04:36:24Z, `f7632121` (uptime 0' 04:37:06Z; sampler mẫu đầu 04:38:13Z) | t8-round189 RELEASED 03:44:45Z — TRỐNG 3.099 s (51m39s) trước btime | TRỐNG | 0 | 0 |
| #114 | 08:25:43Z, `b0aab705` (T56 xác minh /proc/stat + `uptime -s`; T0-191 survey) | t8-round189 RELEASED 03:44:45Z — TRỐNG 16.858 s (4h40m58s) trước btime | TRỐNG | 0 (t01 ACQUIRED đầu tiên 08:48:14Z) | 0 |

Khoảng trống gấp ~1.550 lần (#113) / ~8.429 lần (#114) δ 2 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 18 reboot (#96–#105 + #107–#114; #106 không tính)** nếu parent tính tiếp. **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục từ 03:44:45Z tới 08:48:14Z nên MỌI boot trong cửa sổ đó đều không thể giết holder. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu #113/#114 theo T7-189 appendix + T0-191 appendix.

### §5.3. Quét zombie + X11 + ss (mở/đóng/kiểm cuối)

- **0 zombie thật cả ba thời điểm** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56. T56 không khởi động Xvfb/vite nào, không kill process nào.
- **X11:** mở 1 socket (X198) → đóng/kiểm cuối 2 socket (X193 09:03Z + X93 08:56Z) — của T4-191; T56 không đụng tới X11.
- **`ss -tlnp`:** mở 3 listener (chrome :9656, MainThread :5554/:8851 — T4-191/T0-191) → đóng 1 ([::1]:5187 — T4-191 attempt) → kiểm cuối 0 (T4 đã RELEASED 09:07:10Z).

## §6. (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI (A) — 120/120 PASS (lần thứ 40) + suite 9/9 × 6

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7. Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — khớp T6-151–T6-189. File khối đã trích `t7-block-a191.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–189.
- **PHẠM VI HẸP — đã tuân thủ:** poll `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` — tất cả không đổi. T56 chỉ chạy prune (§7 — xóa 5 file theo điều (a)).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (08:51:57–08:54:06Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (~2m09s). Suite chạy trên log riêng trong /tmp — 0 dòng nào của T56 trên log lock thật trong phiên (§5.1).
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), chạy N=120 lần với churn bơm vào (1 process `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s — giống hệt T6-151–T6-189 §6.2). Chỉ chạy trên /tmp, không đụng lock thật, không đụng poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn: min 504 ms, max 3499 ms, trung bình 1992,26 ms. Thời gian chạy ~7m00s (08:59:15Z–09:06:15Z). **0 kẹt mới.**
- **CAVEAT CHỒNG LẤN — QUY TẮC WORDING QUYẾT (h) ĐỢT 171 (F-171-T6-1) — xem F-191-T56-3:** tách hai pha của một attempt: (a) **pha đếm gate** (poll → lấy TICKET); (b) **pha giữ lock** (TICKET → RELEASED). Đợt này: **suite 08:51:57–08:54:06Z chồng pha (a) ở polls #6–#8 T4-191** (`lock=khong` cả 3); **harness 08:59:15–09:06:15Z chồng pha (a) ở polls #16–#20 VÀ chồng pha (b) từ lúc T4 ACQUIRED 09:03:40Z (#21, load5 1,75) tới lúc harness xong 09:06:15Z (~2m35s)**. Harness START 08:59:15Z khi gate CHƯA xanh (load5 2,49 ở poll #16; lần đầu load5 ≤2 ở poll #20 = 2,00) — **T56 không khởi động script nặng nào sau khi gate xanh**. T4 attempt vẫn hoàn thành (RELEASED 09:07:10Z, hold 210 s). **T56 KHÔNG phán verdict attempt của T4-191.**
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ đợt 150: 13/30 (43%); **(A) đợt 151–191: 120/120 mỗi đợt (100%)**.
- **Kết luận: (A) VẪN XANH sau bốn mươi đợt** (tổng 4800/4800 dưới churn qua 40 đợt). 120/120 là tỉ lệ dưới churn bơm vào (stress), không phải tỉ lệ flake sản xuất — điều đo được là SO SÁNH TƯƠNG ĐỐI: (A) 100% vs (B) 7% vs bản cũ 43%. **Chuỗi:** "xanh kép" 39 → **40**; suite xanh: 71 → **72**.

## §7. Prune cooldown lần 65 — XÓA 5 FILE theo điều (a), LẦN ĐẦU kích hoạt

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100 file — vượt 100 thì xóa file cũ nhất tới khi còn 100, không xóa file <48h; (c) không xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào log lượt đó; (e) chỉ chạy khi lock đang trống. Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h (8 ngày)** — bảo thủ hơn chữ luật tối đa 24h.

- Trước prune (~08:57Z): tổng **103 file / 1442 byte**; ứng viên mtime >7 ngày (`find -mtime +7`): **5 file** — điều (a) **KÍCH HOẠT LẦN ĐẦU** (T6-189 ghi "điều (a) vẫn chưa kích hoạt đợt nào"; đợt này kích hoạt vì các file đợt 127/128 đã già qua 192h).
- **KHÔNG PHẢI CHỜ LOCK:** lock TRỐNG liên tục từ lúc mở tới lúc prune (dòng cuối log RELEASED 08:51:44Z t01-round191); T56 kiểm lock ngay trước prune rồi prune ngay ~08:57Z. T4-191 ACQUIRED sau đó (09:03:40Z) — sau prune ~7'.
- ~08:57Z 25/11: điều (a) XÓA 5 file (đều ≥192h, đều qua mốc 168h, đều đợt 127/128 — không vi phạm (c)): **`cooldown-t3-round127`** (04:08:07Z, ~196,8h), **`cooldown-t10-round127`** (04:27:11Z), **`cooldown-t10-round127-chr`** (04:28:53Z), **`cooldown-t3-round128`** (06:08:58Z), **`cooldown-t10-round128`** (06:20:06Z). `prune-deleted.txt` ghi đủ tên (đầu ra `rm -v`).
- **Kết quả prune lần 65: 5 file đã xóa.** Sau prune: **98 file / 1372 byte** (103 − 5 = 98 ✓; 1442 − 70 = 1372 ✓, 5 × 14 B). Điều (b) KHÔNG kích hoạt (98 < 100 sau khi (a) xong). Lúc kiểm cuối vẫn **98 file / 1372 byte** (0 file mới sau prune). Tầng tuổi: **≥192h: 5 → 0; ≥168h: 21 → 16; ≥72h: 63 → 58; ≥48h: 76 → 72** (76 − 5 = 71 + 1 file già vào tầng: `cooldown-t0-round177` vượt 48h lúc 08:49:54Z 25/11 — đã xác minh bằng `find -newermt`, KHÔNG phải mất file). Đối chiếu: 100 (T6-189 kiểm cuối) + t0-round189 + t8-round189 = 102 lúc mở + cooldown-t01-round191 = 103 trước prune; `cooldown-t4` chỉ viết lại cùng tên. **KHÔNG mất file nào không giải thích được.**
- **F-147-T6-1 — CHUỖI VẪN 0 (lần thứ mười hai liên tiếp sau khi đứt tại 179):** cả 5 file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~26–29h. Không đổi luật (luật thuộc parent).
- **F-191-T56-4 (đính chính T6-189):** T6-189 §5 ghi "file cũ nhất còn lại: cooldown-t3-round127, mtime 2026-11-17T03:49:38Z" — **SAI**: trên đĩa mtime là **04:08:07Z** (03:49:38Z là mtime của file `-warm` đã xóa trong prune 64). Không ảnh hưởng hiệu lực prune 64; mốc 192h thật của file này là 04:08:07Z 25/11 — đã qua trước prune 65, phù hợp việc điều (a) kích hoạt đợt này.

## §8. F-191-T56-n (sai số / ghi nhận riêng của T56-191)

- **F-191-T56-1 — T4-191 poller không tìm thấy cờ #114 ở đường chính (nhưng gate0 vẫn xanh qua dự phòng).** Poller T4-191 (dòng 54–55): đường chính `round191-t5/POSTBOOT_PASS` — **KHÔNG TỒN TẠI** (luồng gộp T56 dùng dir `round191-t56/`); dự phòng `round189-t5/POSTBOOT_PASS` (cờ #112 cũ → `t5flag=cu(mtime-cu)`). Gate0 vẫn xanh qua **T4-check-only dự phòng** theo quyết parent (j) đợt 143 (postboot_exit=0, pb_age ≤3 — cả 26 poll). Cờ #114 chính thức ở `round191-t56/POSTBOOT_PASS` (md5 288f863b). **T56 KHÔNG tạo bản sao cờ ở round191-t5/** (tránh 2 cờ #114 gây nhầm cho T10). Brief các đợt gộp sau cập nhật đường chính của poller (hoặc chấp nhận dự phòng).
- **F-191-T56-2 — Brief T56 sai số đếm hướng (3) ("lần 32").** Xem §2: đúng là lần thứ 37 (T5-186/187/188/189: 33/34/35/36). T56 dùng số trên đĩa.
- **F-191-T56-3 — Suite/harness chồng T4-191 (xem §6).** Suite chồng pha (a) polls #6–#8; harness chồng pha (a) polls #16–#20 VÀ pha (b) 09:03:40Z–09:06:15Z (~2m35s, T4 đã ACQUIRED ở #21). T56 không khởi động script nặng nào sau khi gate xanh; T4 attempt vẫn xong (RELEASED 09:07:10Z). Legacy blocker counts trong lúc harness: 1–2 (polls #16–#21), comm-based=0 cả 21 poll — nguồn legacy=1/2 không xác định được (T4 chỉ lưu `blockers-ps-*` cho polls #1–#5; churn `WebProcess-churn sleep 1.5` bị loại bởi filter `grep -v "sleep [0-9]"` của T4 — cùng giới hạn chứng cứ như F-189-T6-6). **T56 KHÔNG phán verdict attempt của T4-191.**
- **F-191-T56-4 — Đính chính mtime file prune 64 (xem §7).** `cooldown-t3-round127` mtime thật 04:08:07Z (không phải 03:49:38Z như T6-189 ghi).
- **F-191-T56-5 — Ledger compact 2→1 dòng (xem §4).** Xảy ra giữa 03:15Z–09:09Z, ngoài phiên T56; ts còn lại 1795565495 (repair #111); KHÔNG dòng mới cho #113/#114.
- **F-191-T56-6 — preview.tsx đổi md5 giữa phiên.** `apps/web/src/preview.tsx` md5 `530e10a7` → **`c3a3c4fb`** (mtime 09:05:16Z, 450.418 B) — do luồng sản phẩm đợt 191 (Editing Core parity) sửa trong lúc T56 chạy. T56 chỉ đọc md5, không sửa file; không ảnh hưởng verdict. X11 sockets cũng đổi theo T4-191 (X198 → X193+X93).
- **F-189-T5-1 tiếp diễn:** watcher-189 dừng poll 4 s TRƯỚC btime #113 (0 END/STOP/NEWBOOT) — cùng kiểu watcher-188; chuỗi overlap dừng ở mẫu 21 (+10 s); khoảng không-watcher ~4h10m bao 2 boot — dài nhất từ trước (đợt 190 VOID + luồng 191 spawn muộn ~08:43Z). Không mất mát (cả hai replay tự chạy; cờ #114 vẫn ghi boot+20m).
- **F-177-T5-3 vẫn đúng (lần 15):** `who -b`/`last reboot` chỉ cho phút — không đối chiếu được lệch btime. T56 dùng **epoch /proc/stat làm chuẩn**.
- **round-in-progress.md KHÔNG tồn tại** lúc mở, lúc đóng lẫn lúc kiểm cuối (latch do parent quản lý; T56 không tự viết/xóa). **Inotify max_user_watches:** T56 không đo lại đợt này (lần đo gần nhất vẫn là T6-187: 63.747). **RAM/ENOSPC #114:** thuộc T9-191 (T56 không đo).

## §9. Đề xuất cho parent (quyết ở aggregate 191)

**(a) Chấp nhận verdict đợt 191 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #114 đã có (replay, poll=0, KHÔNG caveat, verify độc lập exit=0), replay #114 KHÔNG ĐÌNH TRỆ, #113 KHÔNG CÓ cờ (đợt 190 VOID — không bù được), cờ cũ VẪN CÓ, (A) 120/120 lần 40, #113/#114 KHÔNG GIẾT HOLDER (chuỗi 16 → 18), prune 65 xóa 5 file theo điều (a), hướng (3) lần 37, 0 vi phạm B4 phía T56.

**(b) Cờ #114 ứng viên (replay, poll=0) — CÂU HỎI QUYẾT:** replay-day-du → poll0 exit=0 trên boot SỐNG, verify độc lập exit=0, 11/11 NEED + 5/5 lib + GST 269=269 thư mục thật + tools ĐÃ CÀI + dpkg 1468 + 50 transaction + term.log 0 lỗi + ledger KHÔNG thêm dòng (profile giống #109/#110/#112). **Parent chọn 1 trong 2:** (b1) Chấp nhận cờ #114 đứng cho gate (a) **KHÔNG caveat** — tiền lệ #109/#110/#104/#112; (b2) Không chấp nhận (T56 không thấy căn cứ).

**(c) Cờ #113 KHÔNG CÓ — T56 đề xuất parent ghi nhận KHÔNG bù được + TỔNG BOOT KHÔNG CỜ 25 → 26** (tiền lệ (c)-187/188/189).

**(d) Xác nhận số hiệu boot mới b0aab705 = #114** (T0-191 xác minh; btime 08:25:43Z, epoch 1795595143, gap 13.759 s; numbering theo T0 đã quyết ở (e)-186.)

**(e) Replay #114 KHÔNG ĐÌNH TRỆ (chuỗi đầy đủ xem §4); nguyên nhân đình trệ #100/#101/#103/#111 VẪN CHƯA TÌM RA trong cell** — **vẫn nợ host-side** theo quyết (k) đợt 174.

**(f) #113 + #114 KHÔNG GIẾT HOLDER — chuỗi 16 → 18** (trống 3.099 s / 16.858 s; gấp ~1.550× / ~8.429× δ 2 s).

**(g) (A) 120/120 lần thứ 40 (tổng 4800/4800) + suite 9/9 × 6 (chuỗi suite xanh 72) — parent ghi nhận?**

**(h) Prune lần 65: điều (a) KÍCH HOẠT LẦN ĐẦU — xóa 5 file, queue 103 → 98; F-147-T6-1 chuỗi VẪN 0 lần thứ 12 — parent ghi nhận?**

**(i) Hướng (3) VẪN ĐỨNG lần thứ 37 (brief ghi "32" là SAI — F-191-T56-2) — parent ghi nhận?**

**(j) F-191-T56-1 (poller T4 đường chính round191-t5 không tồn tại; gate0 chạy bằng dự phòng T4-check-only) — brief đợt gộp sau cập nhật đường chính poller, hoặc chấp nhận dự phòng.**

**(k) Watcher-191 vẫn chạy trên #114** (pid 9180, hạn 11:35:00Z) — T56-192 tiếp quản.

## §10. Sai số của chính T56-191 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-191-T56-1..6** | Xem §8 (đầy đủ, không lặp lại ở đây) | Ghi nhận | — |
| §1.1 | T56 mở muộn boot+15', watcher spawn muộn boot+20' (khoảng không-watcher ~4h10m bao 2 boot) | Ghi nhận | Replay #114 đã tự xong trước khi spawn; bằng chứng replay độc lập với lúc mở |
| §1.3 | "T0-190 xác minh" trong appendix189.txt là viết theo kế hoạch — T0-190 KHÔNG tồn tại | Ghi nhận | Btime/số hiệu #113 dựa trên 4 nguồn độc lập; parent quyết (e) |
| — | Đồng hồ: CF +2 s (T0-191); T56 không chạy lap CF riêng | Hạn chế nhỏ | δ=2 s đủ cho verdict holder (khoảng trống gấp hàng nghìn lần) |
| — | RAM/ENOSPC #114 không đo (thuộc T9-191); inotify không đo lại (giữ số T6-187: 63.747) | Hạn chế nhỏ | Diễn biến đầy đủ thuộc T9-191 |

**Số liệu chính thức lấy từ log watcher-189/191 + log trực tiếp (verify form-B/poll0/independent) + dpkg/history của #114 + ledger + hồ sơ T7-189 appendix + T9-189 sampler + T0-191 survey/appendix + log lock thật + queue trên đĩa + đối chiếu aggregate 189 (§12.3) + build-loop-log dòng 8613 (parent xác minh đợt 190 VOID).**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND191_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round191-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round191-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). PUSH #9 đã đẩy xong đợt 166–189 (14:36 +07 25/11) — chờ push reset về 0 trước đợt 191; đợt 191 = 1 file này (các T khác chưa tính lúc T56 đóng; T10 đếm lại bằng dedup toàn cục).

## Phụ lục A — Trích số liệu T56-191 (bản chính, 08:41Z – 09:09Z 25/11)

```
boot #114=b0aab705-7ef5-47fd-95e0-e97910fbfa88 btime=1795595143=08:25:43Z (uptime -s KHOP; /proc/1 +12.38 s; journal +12 s)
boot #113=f7632121-7352-4543-b6ce-3fab71609e44 btime=1795581384=04:36:24Z (uptime 0' 04:37:06Z, 11' 04:48:21Z; sampler mau dau 04:38:13Z; watcher-189 poll cuoi 04:36:20Z)
gap 7385 s / 13759 s; watcher-189 (226 dong): START 02:46:08Z pid=116868; poll cuoi 04:36:20Z dpkg 1461 md5=c6a618c5 (TRUOC btime #113 4 s); 0 END/STOP/NEWBOOT
watcher-191: START 08:45:57Z pid=9180 boot=b0aab705 end=11:35:00Z; init dpkg 1468 md5=9387d070 mtime=08:40:35Z cache=170 lists=37 gst_sys=269; REPLAY_DONE + FLAG-WRITTEN 08:45:57Z poll=0 (old=27e6714f); poll 30 s deu, dpkg 1468 (09:09:01Z)
POSTBOOT_PASS #114: CO 315 B md5=288f863b; backup #112 md5=ca79a6b2 = goc; dpkg 1468 md5=9387d070 mtime 08:40:35Z; cache=170; lists=37; GST 269; history 50 tx (cuoi gstreamer1.0-tools 08:40:35Z); term.log 0 loi; tools DA CAI; libc-bin 2.39-0ubuntu8.12
POSTBOOT_PASS #113: KHONG CO (0/123 file co nhac f7632121)
Co cu KHONG DOI: #112 ca79a6b2 / #111 abe240cb / #110 302ae331 / #109 a6fc7d69 / #107 b7259902 / #104 8e6d6e5d / #102 6007fea8 / #101 8c32fc3c / #99 3d031656 / #98 26452ec1 / #96 50869e4e / #95 f8cd6d46
Lock (mo/dong/kiem cuoi): raw 2695/2698/2699; cleaned 2689/2692/2693; ACQUIRED 770/771/771; RELEASED 757/758/759; cap 757/758/759; chenh 13/13/12; TICKET 781/782/782; COOLDOWN 358; STALE-LOCK 12; STALE-TICKET 1; TIMEOUT 10; double-acquire 7; held: t01 / t4 / (trong)
(A): suite a89c0676; live-code c92f2efff; block dc973443 (giong het 151-189); suite 6x 9/9 rc=0 (08:51:57-08:54:06Z); harness 120/120 B1=1 B2=0 (08:59:15-09:06:15Z; delay 504/3499/1992.26 ms)
Prune 65: truoc 103 file / 1442 B; xoa 5 file (dieu (a), lan dau kich hoat): cooldown-t3-round127, cooldown-t10-round127, cooldown-t10-round127-chr, cooldown-t3-round128, cooldown-t10-round128; sau 98 file / 1372 B; tang tuoi: >=192h 5->0; >=168h 21->16; >=72h 63->58; >=48h 76->72 (cooldown-t0-round177 gia vao tang luc 08:49:54Z)
Holder: #113 KHONG GIET (trong 3099 s truoc btime, ~1550x delta 2 s); #114 KHONG GIET (trong 16858 s truoc btime, ~8429x delta 2 s); chuoi 16 -> 18
Huong (3): lan 37 (brief ghi 32 la SAI); user@0 static; loginctl no bus; linger KHONG-CO; /run/user/0 KHONG-CO; timers_vcut=0; units_vcut=0
Marker: CO, mtime=2026-11-20 11:39:47Z, 239 B, md5 cb7102c0; song #49-#114 = 66 reboot (T0)
Ledger: 1 dong: ts 1795565495 compacted=true (repair #111) — COMPACT tu 2 dong (T5-189) xuong 1 dong; KHONG dong moi cho #113/#114
X11/zombie: mo 1 socket (X198); dong/kiem cuoi 2 socket (X193+X93, cua T4-191); 0 zombie ca ba thoi diem
Dong ho: CF +2 s (T0-191, phuong phap chat); btime epoch nguyen
Dot 190 VOID: parent xac minh (build-loop-log dong 8613); 0 agent/file/co/paths/GAP §118
```

## Nợ mở chuyển đợt 192

1. **(m) #113 thô +35,149 s + (m) #114 (0 requeue trong [08:20; 08:35]Z) + INSIDE #113/#114** — T2-191 + parent 191.
2. **Cờ #114 ứng viên (replay, poll=0, KHÔNG caveat)** — parent quyết §9(b). **Số hiệu #114** — T0-191 xác minh, parent quyết (e) §12.3-191. **#113 KHÔNG cờ — tổng boot không cờ 25 → 26 (đề xuất).**
3. **Replay #114 KHÔNG ĐÌNH TRỆ** (§4); **#113 KHÔNG XÁC ĐỊNH ĐƯỢC**; nợ host-side quyết (k) đợt 174 VẪN MỞ.
4. **F-191-T56-1..6** — ghi nhận; T4/T10/parent lưu ý (đặc biệt F-191-T56-1: poller T4 đường chính round191-t5 không tồn tại).
5. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck, T2-191). **(m) #56 lần 33** — T2-191.
6. **Run 190 kết cục** — T7-191 (run 190 vẫn running lúc T7-189 đóng; requeue eid 10947 lúc 04:36:59Z). **Run 191 kết cục** — T7-191.
7. **Watcher-191 vẫn chạy trên #114** (pid 9180, hạn 11:35:00Z) — T56-192 tiếp quản; nếu reboot mới, spawn watcher mới theo mẫu.
8. **Prune lần 66** — T6-192 (chuỗi F-147-T6-1 đang 0 lần thứ 12; file cũ nhất còn lại `cooldown-t3` mtime 2026-11-17T09:40:41Z — qua mốc 192h lúc 09:40:41Z 25/11).
9. **Auto-trigger lần FIRE thật đầu tiên** — T9-191 (live từ 189; 0 FIRE tới đợt 189). **B2 dữ kiện thứ 3** — T4-191. **B1 điều tra kẹt P5 đợt 188** — T8-191. **E-247 kết cục** — T9-191. **OUTAGE phán cuối T7-194** (T7-193 kiểm onset).
10. **G1 khung (a) M2** vẫn hoãn — chờ user (đã hỏi 13:44 16/11). **R9 (a)** vẫn chờ user (số đếm vẫn là 16). ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại. File oversize 6,4 MB chưa quyết số phận.
