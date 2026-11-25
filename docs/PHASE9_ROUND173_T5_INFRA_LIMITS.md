# PHASE 9 — ROUND 173 — T5 INFRA LIMITS

**Đợt:** 173 (mở lượt cron 03:35:51 +07 23/11/2026 = 20:35:51Z 22/11; hạn cờ ~23:00Z, hạn cứng 23:30Z).
**Người viết:** T5-173. **Ngày:** 22/11/2026. **Boot làm việc lúc đóng:** #84? (CHƯA XÁC NHẬN — chờ T0-173 xác minh 9 nguồn, quyết (d) aggregate 172) 4ae2d2ea, btime 21:01:15Z.
**Trạng thái:** ĐÃ XONG đo đạc + 2 watcher + cờ #84? (repair-sớm-quyết-h, poll=1 — xem §3.1). File này là 1 entry duy nhất stage đợt 173 của T5.

## Tóm tắt (đọc 1 phút)

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #84? (4ae2d2ea, btime 21:01:15Z) | **ĐÃ CÓ 21:27:05Z (boot+25m50s, repair-sớm-quyết-h, poll=1)** — watcher-173b EARLY-REPAIR TRIGGER 21:16:43Z (boot+15m28s, frozen 882 s, dpkg 2 dòng), form-B exit=1, --repair exit=0 (10m22s), postboot poll1 exit=0 (T5 verify độc lập exit 0 lúc 21:33:29Z), 11/11 gói + 5/5 lib, GST symlink→debroot 269=269. **CAVEAT: KHÔNG phải replay-đầy-đủ** — xem §3.1 |
| Replay host-side #84? | **KHÔNG CHẠY** — tới lúc watcher-173b spawn (boot+3m27s) dpkg chỉ 2 dòng, cache 0, lists 5, GST 0, 0 proc; tới boot+15' vẫn 0 hoạt động → watcher kích early-repair theo quyết (h) là đúng |
| Replay host-side #83? (dd08464a, btime 20:25:47Z) | **CHẠY NHƯNG CHỈ MỘT PHẦN (23/170 intent)** — update chỉ lấy backports + security (thiếu noble + noble-updates), 23 transaction cài 23 gói 20:47:51–20:50:08Z, dpkg 2 → 323 dòng rồi dừng; thiếu 9/11 gói postboot; postboot poll0 exit=1 — **mẫu MỚI (khác #75/#81 không chạy + #77/#79/#80 đầy đủ)** — xem §5.1 |
| POSTBOOT_PASS #83? (dd08464a) | **KHÔNG CÓ** — repair tay của T5 xong 21:01:47Z (exit 0, RE-CHECKs đều PASS) nhưng reboot #84? btime 21:01:15Z rơi vào GIỮA LÚC repair (32 s trước khi xong); poll1 độc lập không kịp chạy trên boot sống; T5 KHÔNG tự viết cờ cho boot đã chết — **parent quyết (xem §9(b))** |
| POSTBOOT_PASS #82 (34e61c92) | **KHÔNG CÓ** (grep 0 kết quả — boot thứ 15 không cờ, không bù được) |
| POSTBOOT_PASS #81 / #80 / #79 / #77 / #75 | **VẪN CÓ, còn hiệu lực** (#81 repair-sớm-quyết-h 17:50:32Z; #80 replay-day-du 14:52:09Z; #79 replay-day-du 11:49:14Z; #77 replay-day-du 08:46:44Z; #75 mode repair 06:01:38Z) |
| Reboot trong phiên | **#83? (dd08464a, btime 20:25:47Z, gap #82→#83? = 5.099 s = 1h24m59s)** — xảy ra TRƯỚC khi đợt mở 10m04s, trong khoảng không-watcher; **#84? (4ae2d2ea, btime 21:01:15Z, gap #83?→#84? = 2.128 s = 35m28s)** — xảy ra GIỮA PHIÊN, trong lúc T5 repair tay; cả hai CHƯA XÁC NHẬN (chờ T0-173) |
| Watcher-173 | START 20:42:50Z, pid 13457, boot dd08464a; **CHẾT theo #84?** (poll cuối 21:01:24Z — 9 s SAU btime #84?, F-173-T5-5); 38 poll, 0 END/STOP; KHÔNG trigger (replay đang chạy), KHÔNG cờ |
| Watcher-173b | START 21:04:42Z, pid 4077, boot 4ae2d2ea; **vẫn ĐANG CHẠY** lúc đóng (poll 21:35:36Z); trigger + repair + cờ #84? đầy đủ |
| Khoảng không-watcher | **6.099 s = 1h41m39s** (poll cuối watcher-172 19:01:11Z → START watcher-173 20:42:50Z) **+ 198 s = 3m18s** (poll cuối watcher-173 21:01:24Z → START watcher-173b 21:04:42Z) |
| F-172-T6-5 (pid watcher-172 lệch T5 17944 vs T6 6126) | **ĐÃ GIẢI QUYẾT — ĐÓNG**: pid 6126 là `b2-watcher.sh` của T9 (T6 tự ghi đúng ở LIMITS dòng 155); F-172-T6-5 gọi nhầm tên; watcher-172 thật chỉ có 1 pid 17944 — xem §4.3 |
| Hướng (3) | **VẪN ĐỨNG lần thứ 20 liên tiếp** (user@0/logind/dbus inactive, không linger, không cron, không /run/user/0, 0 timer VCut — kiểm 2 lần) |
| Marker sống | `~/.config/vcut-persistence-marker` CÒN, mtime 2026-11-20 11:39:47Z không đổi — sống qua **#49–#84? = 36 reboot** (34 ĐÃ XÁC NHẬN tới #82; #83?/#84? chờ T0-173) |
| ENOSPC | #84?: **26 dòng lúc stats lần 1 21:29:55Z → 29 dòng lúc stats lần 2 21:33:34Z** (T9 đếm chính thức) |
| X11 | **TRỐNG trên #84?** (0 socket, 0 Xvfb — không cần dọn); TRỐNG lúc mở trên dd08464a |
| RAM #84? | MemAvailable 522.912 kB → 498.500 kB (giảm giữa 2 lần chạy — các luồng khác đang hoạt động; RẤT THẤP — giao T9) |
| Đồng hồ | Local ≈ Cloudflare **−0,2 đến −1,4 s** (CF nhanh hơn local, thường ~0,5–1 s — cùng họ các đợt trước) |
| Gap kiểm lại độc lập | #82→#83? = **5.099 s**; #83?→#84? = **2.128 s** — cả hai tính bằng 2 phương pháp độc lập (trừ epoch python + `date -d`) |
| Quy tắc B4 | **T5-173 KHÔNG chạy probe chạm dpkg nào** (0 lần `dpkg --configure -a`); chỉ dùng check-only đọc (dpkg-query / apt-get -s / postboot check-only) — B4 GIỮ NGUYÊN, không nới. Manual --repair trên dd08464a KHÔNG phải probe (xem §6); --repair của watcher-173b là đường watcher theo quyết (h) |
| T4-173 | Đang gate0wait trên boot mới (poll #45 21:35:34Z, gate0=T5, postboot_exit=0) — CHƯA bắt đầu attempt lúc T5 đóng; cờ #84? đã mở gate (a) |

**Số hiệu boot #83?/#84? CHƯA XÁC NHẬN theo quyết (d) aggregate 172 — chờ T0-173 xác minh 9 nguồn.**
**T5-173 KHÔNG phán (m), chỉ trình số thô — (m) #82/#83?/#84? CHỜ T2-173 đối chiếu + parent quyết.**

---

## §1. Timeline (giờ Z, 22/11/2026)

| Thời điểm | Sự kiện |
|---|---|
| 19:00:48Z | Reboot #82 (34e61c92, btime) — gap #81→#82 = 7.123 s |
| 19:01:11Z | **Poll cuối watcher-172 trên #81** (dpkg 795, 0 proc) — 23 s SAU btime #82 (F-173-T5-1) |
| 20:25:47Z | **Reboot #83? (dd08464a, btime, epoch 1795379147) — gap #82→#83? = 5.099 s (1h24m59s)**; xảy ra 10m04s TRƯỚC khi đợt mở |
| 20:35:41Z | Hoạt động dpkg đầu trên #83?: 2 dòng `startup packages configure` (boot+9m54s, reconcile heal); replay payload pid 801 bắt đầu (~20:35:41Z) |
| 20:35:51Z | Lượt cron đợt 173 mở |
| ~20:40Z | **T5-173 mở trên #83?**: replay ĐANG CHẠY (apt-get update pid 822, payload pid 801); dpkg 2 dòng, cache 178, lists 3, GST 0 |
| 20:42:50Z | **Watcher-173 START, pid 13457, boot dd08464a** (khoảng không-watcher 6.099 s tính từ poll cuối watcher-172 19:01:11Z); KHÔNG trigger (replay đang chạy, có proc apt) |
| 20:47:51–20:50:08Z | Replay #83? cài 23 gói (23 transaction + 1 upgrade); dpkg 2 → 323 dòng; cache 178 → 41 (autoclean); lists 3 → 21 |
| 20:50:53Z | Watcher-173 REPLAY_DONE (dpkg 323 ổn định 2 poll, 0 proc) → **postboot poll0 exit=1** — KHÔNG ghi cờ, "cho T5 xử lý tay" |
| 20:54:59Z | T5 verify độc lập check-only trên #83?: **exit=1** (thiếu 9/11 gói + 3/5 lib + GST 2/269) |
| 20:56:57Z | **T5 bắt đầu manual --repair trên dd08464a** (replay đã xong, T4 đang gate0wait, watcher done=1) |
| 21:01:15Z | **Reboot #84? (4ae2d2ea, btime, epoch 1795381275) — gap #83?→#84? = 2.128 s (35m28s)**; rơi vào GIỮA LÚC manual repair (32 s trước khi xong) |
| 21:01:24Z | **Poll cuối watcher-173 trên dd08464a** (dpkg 323, apt=[36470] install đang chạy, gst 269, cache 115, lists 75) — 9 s SAU btime #84? (F-173-T5-5) |
| 21:01:47Z | **Manual --repair exit=0** (4m50s; RE-CHECKs đều PASS) — hoàn tất trong cell cũ, sau btime mới 32 s (overlap); cờ dd08464a KHÔNG kịp viết |
| ~21:02Z | **T5-173 mở trên #84?** (phát hiện qua check độc lập exit=1 toàn bộ + dpkg 2 dòng + không /var/log/apt): replay chưa chạy; cache 132 lúc 21:02:16Z → 0 lúc 21:03:17Z (F-173-T5-4) |
| 21:04:42Z | **Watcher-173b START, pid 4077, boot 4ae2d2ea** (khoảng không-watcher thứ hai 198 s) |
| 21:16:15Z | Boot+15' trên #84? |
| 21:16:43Z | **Watcher-173b EARLY-REPAIR TRIGGER** (boot_age 928 s, frozen 882 s, dpkg 2 dòng) — form-B exit=1, --repair bắt đầu |
| 21:26:52–21:27:05Z | Transaction apt duy nhất của repair: install 11 gói + ~95 deps (13 s) |
| 21:27:05Z | **--repair exit=0; postboot poll1 exit=0; Cờ POSTBOOT_PASS #84? ghi (boot+25m50s, repair-sớm-quyết-h, poll=1)** |
| 21:29:55Z | Stats script chạy lần 1 (`t5-stats-173b.py` → `t5-stats-173b-output.txt`); watcher-173b: 35 poll; RAM MemAvailable 522.912 kB; ENOSPC 26 dòng |
| 21:33:29Z | T5 verify độc lập postboot check-only trên #84?: **exit 0, 11/11 gói + 5/5 lib, GST symlink→debroot 269=269** (log `t5-postboot-independent-4ae2d2ea.log`) |
| 21:33:34Z | Stats script chạy lần 2 (chỉ khác các giá trị phụ thuộc thời gian — xem §10); watcher-173b: 42 poll; ENOSPC 29 dòng |
| ~21:36Z | T5 viết LIMITS này. Watcher-173b vẫn ĐANG CHẠY (pid 4077, ALIVE; poll 21:35:36Z dpkg 795 ổn định, 0 proc). T4-173 vẫn gate0wait (poll #45 21:35:34Z) |

Tuổi boot theo btime: #82: 5.099 s (1h24m59s, tính tới btime #83?); #83?: 2.128 s (35m28s, tính tới btime #84?).

---

## §2. Hướng (3) VẪN ĐỨNG lần thứ 20 liên tiếp + marker + đồng hồ

**Hướng (3) ĐỨNG.** Kết quả stats (lần 1 + lần 2 đều giống): `user@0` inactive; `logind` inactive; `dbus` inactive; `loginctl` root "Failed to connect to bus"; không thư mục linger (`/var/lib/systemd/linger` không tồn tại); không `/run/user/0`; không lệnh `crontab`; 0 timer VCut (timers có keyword VCut = 0); không user manager nào.

Đây là lần thứ 20 liên tiếp hướng (3) đứng. Không thay đổi gì ở hướng này trong đợt 173. T5 KHÔNG dùng systemd user manager / timer nào để giữ watcher — watcher chạy bằng nohup trực tiếp trong cell, theo mẫu 172.

**Marker (một phần nhiệm vụ T5-154):**

```
vcut persistence marker — T5-154
written: 2026-11-20T11:39:40Z (UTC)
boot: 2c0a7985-b750-4166-b177-21d2ef7e1dc7 (reboot #48, btime 2026-11-20T11:26:05Z)
purpose: verify ~/.config survives rootfs rebuild (check after next reboot; T5-154)
mtime=2026-11-20 11:39:47.272154981 +0000
```

Nội dung và mtime **KHÔNG ĐỔI** từ khi viết. Marker sống qua **#49–#84? = 36 reboot** nếu số hiệu #83?/#84? xác nhận (34 ĐÃ XÁC NHẬN tới #82 theo T10-172 đếm độc lập; T0-173 đếm lại). T5 không có bằng chứng mới nào về cơ chế bảo toàn `~/.config` ngoài sự tồn tại của marker — không mở lại chủ đề.

**Đồng hồ:**

| Lần chạy | Kết quả |
|---|---|
| Stats lần 1 (21:29:55Z) | Cloudflare Date nhanh hơn local ~0,6–0,9 s (lan1: local_truoc 21:29:55.362Z → CF 21:29:56 GMT → local_sau 21:29:56.061Z; lan2 tương tự) |
| Stats lần 2 (21:33:34Z) | Cloudflare nhanh hơn local ~0,2–1,4 s (lan1: local_truoc 21:33:34.645Z → CF 21:33:36 GMT → local_sau 21:33:35.473Z; lan2: local [35.473, 35.829] → CF 36.000) |

**Hợp nhất: CF nhanh hơn local ~0,2–1,4 s, thường ~0,5–1 s** (cùng họ các đợt trước). **Btime ghi bằng epoch nguyên vẫn là đồng hồ chuẩn**; mọi gap trong file này tính bằng epoch nguyên (trừ epoch python) và `date -d`, đã kiểm 2 phương pháp — không dùng phân số.

---

## §3. Watcher + POSTBOOT_PASS

### §3.1. Cờ #84? — ĐÃ CÓ (repair-sớm-quyết-h, poll=1) — CAVEAT: KHÔNG phải replay-đầy-đủ

- **Cờ:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round173-t5/POSTBOOT_PASS`, 325 B, mtime 2026-11-22T21:27:05.996330814Z.
- Nội dung: `boot 4ae2d2ea-a7d6-4869-8b32-2a142adaa586 (btime 2026-11-22 21:01:15Z; watcher-173b) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-22T21:27:05Z; POSTBOOT_PASS moi ghi 2026-11-22T21:27:05Z poll=1 (repair-som-quyet-h); co cu 4b9db449 luu POSTBOOT_PASS-4b9db449`.
- Backup cờ cũ: `POSTBOOT_PASS-4b9db449`, 324 B — diff khớp file gốc round172-t5 (cờ #81).
- **Lịch trình repair (watcher-173b):** trigger 21:16:43Z (boot_age 928 s, frozen 882 s, dpkg 2 dòng — frozen vượt ngưỡng 600 s; hạn early-repair boot+15' = 21:16:15Z); form-B verify exit=1; --repair chạy 21:16:43Z → 21:27:05Z (10m22s, exit=0); postboot poll1 exit=0; cờ ghi ngay 21:27:05Z (boot+25m50s).
- **Nội dung repair:** apt-get update trước (timeout 1500 s; lists 5 → 75: azure 34 + cogentco 34 — cả hai mirror đều về); install 1 transaction duy nhất 21:26:52–21:27:05Z (13 s), gói đầu iso-codes, gói cuối gstreamer1.0-plugins-bad; dpkg 2 → 795 dòng; breakdown **4 startup + 106 install + 568 status + 4 upgrade + 110 configure + 3 trigproc = 795 — Y HỆT breakdown repair #81**; dòng dpkg cuối: `21:27:05 status installed libc-bin:amd64 2.39-0ubuntu8.9`. Cache 0 → 110 .deb, **58.529.968 byte — Y HỆT số byte cache repair #81**; tất cả 110 .deb đều mtime < btime #82 (cũ nhất 2021-04-29, mới nhất 2026-11-18 16:22:47Z) — repair KHÔNG tải .deb mới nào (toàn cache-hit, lặp mẫu F-172-T5-2).
- **Verify độc lập (T5, không qua watcher):** postboot check-only 21:33:29Z **exit=0** — PASS wrapper K1, PASS libs, PASS GST, PASS apt, kết luận "DU DIEU KIEN chay WebKit"; stats §5: **11/11 gói đã cài** (phiên bản Y HỆT #80/#81) + **5/5 lib CÓ**.
- **CAVEAT (bắt buộc ghi):** replay host-side **KHÔNG CHẠY** trên #84? — đây là cờ thứ tư có caveat "không replay" liên tiếp sau #75/#76/#81 (theo quyết (j) đợt 169, mode repair-sớm-quyết-h đã được chấp nhận đứng cho gate (a) với caveat; T5 không mở lại quyết này). Không receipt của replay (như mọi lần); ledger 2 dòng (compacted ts 1795381307 = 21:01:47Z = đúng lúc repair tay trên dd08464a xong, added 170; repair ts 1795382825 added 106), sha256 `b4c3f77714978139465240df8f0aa10fce930ee07b7ddbb54f04d0c05038ea7e`; dpkg-state.txt 889 dòng, mtime 21:27:05Z. Ledger literal: **106/170 đã cài, thiếu 64** (Y HỆT 64 tên đợt #81, gồm gstreamer1.0-tools, libevent-2.1-7); tất cả 64 đều `apt-get install -s` rc=0 → **số chính thức theo F-172-T5-3 là literal 106/170, KHÔNG ghi 170/170** (xem §10).
- **T4 đã dùng cờ:** poll gate0wait #37 (21:29:33Z) đầu tiên hiện `t5flag=PASS` + `postboot_exit=0`; tới poll #45 (21:35:34Z) vẫn gate0wait, **chưa bắt đầu attempt** lúc T5 đóng. Gate (a) được mở bằng cờ #84? theo đường (a) chuẩn — xem §3.4.

### §3.2. Cờ #81 / #80 / #79 / #77 / #75 — VẪN CÓ, còn hiệu lực

| Boot | Cờ | Ghi chú |
|---|---|---|
| #81 (4b9db449, btime 17:02:05Z) | round172-t5/POSTBOOT_PASS, mtime 17:50:32.812992807Z | repair-sớm-quyết-h, poll=1, dpkg 795, cache 110, lists 75; backup POSTBOOT_PASS-2acdd1ab trong round172-t5 |
| #80 (2acdd1ab, btime 14:31:01Z) | round171-t5/POSTBOOT_PASS, mtime 14:52:09.925608854Z | replay-day-du, poll=0, dpkg 1545, cache 178, lists 37; backup POSTBOOT_PASS-5df1871f trong round171-t5 |
| #79 (5df1871f) | round170-t5/POSTBOOT_PASS | replay-day-du, poll=0, dpkg 1545, cache 178, lists 37; backup POSTBOOT_PASS-c44cc3ba trong round170-t5 |
| #77 (576ca271) | round168-t5/POSTBOOT_PASS | replay-day-du, poll=0, dpkg 1545, cache 178, lists 37; backup POSTBOOT_PASS-194efd93 trong round168-t5 |
| #75 (c44cc3ba) | round169-t5/POSTBOOT_PASS | mode repair, dpkg 795 |

**Mtime các cờ #81/#80 KHÔNG ĐỔI** (đã xác minh lại lúc stats — cả hai lần chạy). Không cờ nào bị ghi đè ngoài vòng đời của nó.

### §3.3. Các boot KHÔNG có cờ (danh sách đầy đủ)

| Boot | Trạng thái |
|---|---|
| #34e61c92 (#82) | **KHÔNG CÓ** (grep 0 kết quả trên toàn bộ `POSTBOOT_PASS*` lúc T5 mở; chết 20:25:47Z khi #83? lên) — boot thứ 15 không cờ; **không bù được** (đã chết trước khi có phiên T5 nào) |
| #dd08464a (#83?) | **KHÔNG CÓ** — replay một phần + manual repair xong nhưng reboot chen ngang trước poll1; **câu hỏi parent §9(b)** |
| #e298bb52 | Không có |
| #f2b97695 | Không có |
| #b643911f | Không có |

Tổng cộng **16 boot không cờ** (15 cũ + dd08464a): #51, #53, #54, #55, #57, #60, #63, #66, #68, #71, #72, #73, #76, #78, #82, dd08464a.

### §3.4. Watcher-173b (boot #84?) — ĐANG CHẠY, đã làm xong nhiệm vụ chính

- Spawn 21:04:42Z, pid **4077**, boot 4ae2d2ea, hạn 23:30:00Z. Khởi tạo: dpkg 2 dòng, md5 e658d3a9, mtime 21:02:01Z, cache 0, lists 5, GST 0.
- **42 poll** lúc stats lần 2 (poll cuối 21:35:36Z: dpkg 795, md5 d5f006a5, gst 269, cache 110, lists 75, 0 proc — trừ proc `apt-get -s` của chính stats T5, xem F-173-T5-8 §10).
- Trigger 21:16:43Z, --repair exit=0, poll1 exit=0, FLAG-WRITTEN 21:27:05Z — đầy đủ (§3.1). Sau đó watcher vẫn poll đều 30 s (gap lớn nhất 31 s) và **vẫn ALIVE lúc T5 đóng**.
- Có 6 poll chứa apt proc của stats T5 (21:31:06Z, 21:31:36Z, 21:32:06Z, 21:34:36Z, 21:35:06Z, 21:35:36Z) — dpkg không đổi 795, không nhiễm (F-173-T5-8).

### §3.5. Watcher-173 (boot #83?) — CHẾT theo #84?

- Spawn 20:42:50Z, pid **13457**, boot dd08464a, hạn 23:30:00Z. Khởi tạo: dpkg 2 dòng, md5 36d8c27e, mtime 20:35:41Z, cache 178, lists 3, GST 0.
- **38 poll, 43 dòng log**; gaps {30 s ×33, 31 s ×4} — không có gap repair (watcher poll xuyên suốt manual repair của T5); không END/STOP/NEWBOOT.
- **Poll cuối 21:01:24Z — 9 s SAU btime #84? (F-173-T5-5, mẫu overlap thứ tư)** — watcher vẫn đọc được boot cũ 9 s sau khi boot mới bắt đầu; dpkg 323, md5 2bfb0446, apt=[36470] (install của manual repair đang chạy), gst 269, cache 115, lists 75.
- Chết vì reboot #84? (pid 13457 mất). REPLAY_DONE 20:50:53Z (2 dòng); postboot poll0 exit=1; KHÔNG trigger (replay đang chạy khi spawn, và dpkg đã > 2 trước khi frozen tới ngưỡng); KHÔNG cờ.
- **F-171-T5-1 KHÔNG lặp lại ở watcher-173** — watcher poll liên tục tới reboot, không chết sớm; manual repair vẫn chạy sau btime (xem §5.2).

### §3.6. Watcher-172 (boot #81) — CHẾT theo #82 (đã xác minh độc lập)

- Spawn 17:41:39Z, pid **17944**, boot 4b9db449, hạn 20:30:00Z. 149 dòng log, **142 poll**, gaps {30 s ×131, 31 s ×9, 563 s ×1 (cửa sổ repair)}; poll đầu 17:41:39Z, **poll cuối 19:01:11Z**; 7 dòng non-poll (START/MONITOR/TRIGGER/verify/--repair exit=0/postboot poll1/FLAG-WRITTEN); không END/STOP/NEWBOOT; boot_set {4b9db449}; dpkg {2, 795}; md5 {4e865c5c, e89e703c}.
- **Poll cuối 19:01:11Z — 23 s SAU btime #82 (F-173-T5-1)** — mẫu overlap thứ ba (F-170-T5-1: 11 s → F-172-T5-1: 20 s → F-173-T5-1: 23 s).
- **F-171-T5-1 KHÔNG lặp lại ở watcher-172** — poll liên tục tới reboot; chết trước hạn END 20:30:00Z 1h28m49s chỉ vì reboot giết.
- 6 poll có apt pid là tiến trình `apt-get install -s` của chính stats T5-172 (F-172-T5-4, đã giải thích) — dpkg không đổi, không nhiễm.

---

## §4. Boot #83?/#84? + F-173-T5-1/F-173-T5-5 + giải quyết F-172-T6-5

### §4.1. Boot #83? (dd08464a)

- boot_id đầy đủ `dd08464a-c4e5-4162-951e-0705e8149d97`; btime **20:25:47Z** (epoch 1795379147); uptime -s 20:25:47Z; /proc/1 mtime 20:25:59.680Z (**+12,68 s**); journal first entry 20:26:00Z (**+13 s**); /tmp/.X11-unix TRỐNG lúc mở.
- **Gap #82→#83? = 5.099 s = 1h24m59s** (trừ epoch python + `date -d` đều khớp). #83? xảy ra 10m04s TRƯỚC khi đợt 173 mở — trong khoảng không-watcher (watcher-172 đã chết 19:01:11Z, watcher-173 spawn 20:42:50Z).
- Trạng thái lúc T5 mở (~20:40Z): replay ĐANG CHẠY (payload pid 801 `/bin/sh -c` preflight-opportunistic, bắt đầu ~20:35:41Z; `apt-get update` pid 822); dpkg 2 dòng (reconcile heal 20:35:41Z, boot+9m54s); cache 178 .deb; lists 3; GST 0; journal 97 dòng (first entry 20:26:00Z, +13 s); `/var/lib/hatch/os-intent` CÓ (dpkg-state.txt + ledger.jsonl); `/var/lib/hatch-preflight` KHÔNG có; `/var/log/apt` KHÔNG có.
- **Chết 21:01:15Z** (reboot #84?). Tuổi #83? = 2.128 s = 35m28s.

### §4.2. Boot #84? (4ae2d2ea)

- boot_id đầy đủ `4ae2d2ea-a7d6-4869-8b32-2a142adaa586`; btime **21:01:15Z** (epoch 1795381275); uptime -s 21:01:15Z; /proc/1 mtime 21:01:27.309Z (**+12,309 s**); journal first entry 21:01:27Z (**+12 s**); /tmp/.X11-unix TRỐNG; marker không đổi.
- **Gap #83?→#84? = 2.128 s = 35m28s** (trừ epoch python + `date -d` đều khớp).
- Trạng thái lúc T5 mở (~21:03Z): dpkg 2 dòng (21:02:01Z, boot+46 s reconcile); cache **132 .deb lúc 21:02:16Z → 0 lúc 21:03:17Z** (F-173-T5-4 — mất trong 61 s, cơ chế chưa xác định, cùng họ F-172-T5-2); lists 5; GST 0; 0 proc; không /var/log/apt; không hatch-preflight; os-intent CÓ (ledger compacted ts 1795381307 = 21:01:47Z = đúng lúc repair tay trên dd08464a xong, added 170); `/tmp/l8-postboot-apt.log` KHÔNG còn trên boot mới (/tmp không giữ qua reboot — xem F-173-T5-9 §10); X11 trống. Poller T4 khởi động lại trên boot mới (poll #1 21:02:28Z, gate0 khong-dat).
- **Số hiệu #83?/#84? CHƯA XÁC NHẬN** — chờ T0-173 xác minh 9 nguồn theo quyết (d) aggregate 172 (T5 KHÔNG phán số hiệu).
- **T5 KHÔNG phán (m).** (m) #82 vẫn chờ T2-173 + parent 173 (quyết từ đợt 172); (m) #83?/#84? cũng thuộc T2-173 + parent 173. T5 chỉ trình số thô: (m) #81 DƯƠNG đã chấp nhận (e) đợt 172 (btime nguyên +33,477 s; caveat phân số ≈ +32,85 s); (m) #82 DƯƠNG ỨNG VIÊN (lean T7, +38,438 s) — CHƯA CHỐT.

### §4.3. F-172-T6-5 — ĐÃ GIẢI QUYẾT, ĐÓNG

**Kết luận: chỉ có MỘT replay watcher, pid 17944 (T5 đúng); không có 2 process, không pid tái sử dụng, không ghi sai từ phía T5.**

- Pid **6126** trong `ps-full-open/close.txt` của T6 là `bash .../round172-t9/b2-watcher.sh` (**B2-watcher của T9**, kèm con sleep 6139/32435), KHÔNG phải replay watcher.
- LIMITS T6 dòng 155 tự ghi đúng là "b2-watcher round172-t9"; mục F-172-T6-5 trong LIMITS T6 gọi nhầm tên thành "Watcher-172" — lỗi gọi tên ở phía T6, không phải lỗi đo của T5.
- `ps-full-close.txt` dòng 18 có **17944 = replay-watch-172.sh** (kèm con --repair 18186). `ps-full-open.txt` chụp 17:39:15Z — TRƯỚC khi watcher-172 spawn (17:41:39Z) nên 17944 vắng mặt là đúng.
- **ĐÓNG F-172-T6-5.**

### §4.4. F-173-T5-1 và F-173-T5-5 (mẫu overlap poll-cuối-sau-btime)

| Mã | Watcher | Poll cuối | Btime mới | Chênh |
|---|---|---|---|---|
| F-170-T5-1 | watcher-170 | — | — | **11 s** |
| F-172-T5-1 | watcher-171 | — | — | **20 s** |
| **F-173-T5-1** | watcher-172 | 19:01:11Z (boot 4b9db449) | #82 19:00:48Z | **23 s** |
| **F-173-T5-5** | watcher-173 | 21:01:24Z (boot dd08464a) | #84? 21:01:15Z | **9 s** |

Cả hai watcher đều đọc được boot_id cũ một thời gian ngắn sau btime mới (boot_id cũ còn đọc được sau btime mới — đã giải thích ở F-172-T5-1: boot_id cũ thật sự còn đọc được). Đây là mẫu thứ ba và thứ tư của hiện tượng này (11 → 20 → 23 → 9 s). **Không ảnh hưởng verdict** — poll cuối vẫn thuộc boot cũ (dpkg/md5 khớp boot cũ), không có poll nào bị gán nhầm boot.

---

## §5. Replay #83? một phần + manual repair + điều tra #75 (đã đóng)

### §5.1. Replay #83? CHẠY NHƯNG CHỈ MỘT PHẦN — F-173-T5-3 (mẫu mới)

- **Update:** payload bắt đầu ~20:35:41Z (boot+9m54s), `apt-get update` chạy ~11 phút; lists sau update: **21** (cogentco 16 = backports 7 + security 9; **azure 0; KHÔNG có noble + KHÔNG có noble-updates**). Đây là suy luận nguyên nhân thiếu gói từ danh sách lists đo được (stdout của payload ở journal host-side, T5 không đọc được) — ghi là suy luận, chưa đo trực tiếp.
- **Install:** 20:47:51–20:50:08Z (8m17s), **23 transaction, 23 gói** + 1 transaction Upgrade (libc6, locales, libc-dev-bin, libc-bin, libc6-dev). dpkg 2 → **323 dòng**. Breakdown: 52 startup + 23 install + 199 status + 28 configure + 16 trigproc + 5 upgrade = 323. Gói cuối cài: gstreamer1.0-tools 20:50:08Z.
- **23 gói đã cài:** libdw1t64, libevent-2.1-7t64, libgstreamer1.0-0, liborc-0.4-0t64, librsvg2-common, libsoup-3.0-common, libcaca0, libde265-0, libdjvulibre-text, libdjvulibre21, libgs-common, libidn12, libjbig2dec0, libpipewire-0.3-common, libraw23t64, libssh-gcrypt-4, libxtst6, libc6-dbg, libdebuginfod-common, libdebuginfod1t64, libdrm-nouveau2, libdrm-radeon1, gstreamer1.0-tools.
- **Kết quả postboot poll0 (20:50:53Z, exit=1):** PASS wrapper K1; **FAIL libs** (thiếu libEGL.so.1, libavif.so.16, libevdev.so.2); **FAIL GST** (thư mục thật, chỉ 2 file libgstcoreelements.so + libgstcoretracers.so, so với debroot 269); **FAIL apt: 9/11 gói chưa cài** (plugins-base/-good/-bad/-ugly/-gl/-libav/-x, libavif16, libevdev2); chỉ libevent-2.1-7t64 + libgstreamer1.0-0 đã cài (2/11). dpkg-query xác nhận. Cache 178 → 41 (autoclean cuối payload). term.log 0 lỗi. Payload pid 801 đã mất lúc 20:50:53Z. Không có receipt.
- **So sánh với các mẫu cũ:** khác #75/#81 (replay KHÔNG chạy, 0 gói) và khác #77/#79/#80 (replay đầy đủ, 170 gói, dpkg 1545, poll0 exit=0). Đây là **mẫu thứ ba: replay chạy nhưng chỉ cài được một phần** — update lấy thiếu suite (noble + noble-updates vắng) nên hầu hết intent không resolve được; các gói cài được chủ yếu là gói đã có trong cache/backports/security + upgrade libc6. T5 không có bằng chứng host-side để kết luận tại sao update lấy thiếu suite — giao T0/T7 nếu cần điều tra (không bắt buộc).

### §5.2. Manual --repair trên dd08464a (T5) — exit=0, nhưng reboot chen ngang

- **Căn cứ (trước khi chạy):** watcher-173 đã đánh giá REPLAY_DONE + postboot poll0 FAIL + ghi "cho T5 xu ly tay"; task giao "chạy quy trình postboot cho boot hiện tại"; replay đã kết thúc (payload pid 801 mất); T4 đang gate0wait (poll #14–#18, gate0=khong-dat, postboot_exit=1, t5flag=cu từ 172-t5), KHÔNG có attempt nào chạy; manual --repair là đường dùng sẵn trong `vcut-webkit-postboot-check.sh` (dòng 619–620, 694, 723, 752–777, 790: `apt-get update` timeout 1500 s rồi `apt-get install -y --no-install-recommends $MISS_PKGS` timeout 1800 s, log `/tmp/l8-postboot-apt.log`; sửa GST bằng symlink nếu có DEBROOT); có tiền lệ T5 chạy --repair tay trong lịch sử script. **Manual --repair KHÔNG phải probe chạm dpkg trong cửa sổ attempt (B4) — xem §6.**
- **Diễn biến:** bắt đầu 20:56:57Z, xong **21:01:47Z (4m50s), exit=0**. Update OK (lists 21 → 75 — cả hai mirror đều về); **REPAIRED GST symlink → debroot (269 file)**; **REPAIRED apt cài đủ 9 gói thiếu** (plugins-base/-good/-bad/-ugly/-gl/-libav/-x, libavif16, libevdev2); **RE-CHECK wrapper/libs/GST/apt đều PASS**, kết luận "DU DIEU KIEN chay WebKit". Log `t5-postboot-repair-dd08464a.log`.
- **Chi tiết watcher quan sát được trong lúc repair:** dpkg 323 không đổi tới poll cuối 21:01:24Z (install còn đang tải .deb — cache 41 → 55 → 115, lists 21 → 75, gst 2 → 269); các entry dpkg của pha unpack/configure rơi vào khoảng (21:01:24Z, 21:01:47Z] — sau poll cuối của watcher, trước khi repair xong. **Số dòng dpkg cuối cùng trên dd08464a KHÔNG đo được** (boot chết trước poll tiếp theo) — repair log chỉ chứng minh install + RE-CHECKs PASS, không chứng minh số dòng dpkg.
- **Reboot #84? btime 21:01:15Z — 32 s TRƯỚC KHI repair xong.** Repair hoàn tất trong cell cũ sau btime mới (overlap); watcher poll cuối 21:01:24Z (+9 s, F-173-T5-5). Check-only độc lập của T5 lúc 21:02:16Z chạy trên BOOT MỚI (exit=1, thiếu hết) — KHÔNG phải poll1 hợp lệ cho dd08464a.
- **Quyết định của T5: cờ cho dd08464a KHÔNG được viết.** Cờ POSTBOOT_PASS chỉ chứng nhận phép đo trực tiếp trên boot sống; boot đã chết trước khi poll1 độc lập kịp chạy thì không bù được. Bằng chứng còn lại là repair log (RE-CHECKs PASS) — **parent quyết xem bằng chứng này có đủ làm căn cứ cờ không (§9(b))**, hay dd08464a thành boot thứ 16 không cờ.
- **Ghi chú truy vết (quyết định còn mở, ghi vào đây, không bắt buộc làm):** T5 KHÔNG append dòng ghi chú vào `replay-watch-173.log` (log đã đóng theo watcher; append sau sẽ làm lệch số dòng 43 → 44 so với stats đã trích, gây nhiễu cho T2/T10 khi đối chiếu). Manual repair được ghi đầy đủ ở `t5-manual-repair-note.txt` + `t5-postboot-repair-dd08464a.log` + LIMITS này. File guard `repaired-dd08464a` (nếu cần) chỉ có ý nghĩa ghi chép, không có tác dụng gate — parent quyết có chạm hay không (§9).

### §5.3. Điều tra replay #75 — ĐÃ ĐÓNG (không mở lại)

Theo quyết parent (j) đợt 169 + ghi nhận lại (j) đợt 170/171/172: điều tra replay #75 đã đóng. Đợt 173 không mở lại trong cell. Replay #83? một phần (§5.1) là mẫu mới, không phải #75.

---

## §6. Quy tắc đứng (B4 + manual repair + hướng (3))

- **B4 GIỮ NGUYÊN:** T5-173 **KHÔNG chạy probe chạm dpkg nào** trong cửa sổ attempt của T4 — 0 lần `dpkg --configure -a`. T4-173 chưa bắt đầu attempt nào trong suốt phiên T5 (chỉ gate0wait), nên không có cửa sổ attempt nào bị chạm dù là vô tình.
- **Các lệnh T5 đã chạy đều là check-only (chỉ đọc):** `dpkg-query`, `apt-get install -s` (mô phỏng), postboot check-only (không sửa), `ldconfig -p` (đọc), đọc log/journal, `curl` lấy Date header Cloudflare.
- **Manual --repair trên dd08464a KHÔNG phải probe:** (1) watcher đã kết luận REPLAY_DONE + poll0 FAIL và ghi rõ "cho T5 xu ly tay"; (2) replay đã kết thúc, không attempt nào đang chạy (T4 gate0wait); (3) --repair là đường dùng sẵn trong chính script postboot (không phải lệnh ngoài); (4) có tiền lệ T5 chạy --repair tay. Đây là hành động khắc phục theo quy trình postboot, không phải probe thăm dò.
- **--repair của watcher-173b trên #84?** là đường watcher theo quyết (h) (early-repair khi frozen ≥ 600 s sau boot+15'), không phải probe của T5.
- **Hướng (3) đứng lần thứ 20** (§2). G1 chờ user quyết (đã hỏi 13:44 16/11). TTS 39 cấm kiểm lại. ci-security.yml vẫn 403 chờ user. u2net là fallback chính thức cho birefnet (birefnet 0 thử lần thứ 26 — theo T9; T5 không đo lại). File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` số phận vẫn chưa quyết.
- **KHÔNG PUSH** trong phiên này (luật cứng). Chỉ stage 1 file LIMITS (§11).

---

## §7. Infra thường kỳ (RAM / ENOSPC / X11 / journal)

**RAM #84? (rất thấp — giao T9):**

| Lần chạy | MemAvailable | MemFree | Loadavg |
|---|---|---|---|
| Stats lần 1 (21:29:55Z) | 522.912 kB | 171.452 kB | 1,35 0,80 0,66 |
| Stats lần 2 (21:33:34Z) | 498.500 kB | 166.944 kB | 1,16 0,96 0,75 |

MemTotal 8.124.900 kB. MemAvailable giảm ~24 MB trong 4 phút (các luồng khác đang hoạt động). RAMavail trong poll T4 dao động 533 → 476 → 429 → 498 → 463 → 540 → 553 MB. Headroom 2 — chỉ theo dõi (lần thứ 32 liên tiếp, theo T9).

**ENOSPC #84? (T9 đếm chính thức):** 26 dòng lúc stats lần 1 (journal 160 dòng) → **29 dòng lúc stats lần 2** (journal 172 dòng). Dòng đầu: `Nov 22 21:03:08 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device`. Đợt thứ 21 liên tiếp có lỗi thật (theo T9).

**X11:** TRỐNG trên #84? ở cả hai lần stats (0 socket trong /tmp/.X11-unix, 0 Xvfb thật — `xvfb_pgrep_x=none`); TRỐNG lúc mở trên dd08464a. Không cần dọn.

**Journal #84?:** 160 dòng lúc stats lần 1 → 172 dòng lúc stats lần 2; first entry 21:01:27Z (+12 s sau btime). Journal #83? lúc mở: 97 dòng, first entry 20:26:00Z (+13 s).

**Cache .deb #84?:** 110 file, 58.529.968 byte; tất cả mtime < btime #82 (cũ nhất 2021-04-29, mới nhất 2026-11-18 16:22:47Z) — 0 file ở bucket mới hơn; repair KHÔNG tải .deb mới nào (lặp mẫu F-172-T5-2). **F-173-T5-4:** trên boot mới, cache 132 .deb lúc 21:02:16Z → 0 lúc 21:03:17Z (mất trong 61 s, cơ chế chưa xác định — cùng họ F-172-T5-2; T5 không có bằng chứng host-side để kết luận).

---

## §8. Nợ mở chuyển đợt 174

1. **(m) #82** — T2-174 đối chiếu độc lập + parent quyết (DƯƠNG ỨNG VIÊN lean T7, +38,438 s — chưa chốt).
2. **(m) #83?/#84?** — T2-174 đối chiếu + parent quyết (T5 chỉ trình số thô §4).
3. **INSIDE #82/#83?/#84?** — T2-174 (dải FULL127/FULL128; chuỗi vẫn đứt từ #80, dài 0 — theo T10-172; FULL127 kiểm lại độc lập thuộc T2-173, chưa có kết quả lúc T5 đóng).
4. **Cờ dd08464a** — parent quyết §9(b): chấp nhận bằng chứng repair-log hay dd08464a thành boot thứ 16 không cờ.
5. **Mù #96?/#95?/#94?/#88?/#77?** — vẫn mở (hole-recheck lần 17 thuộc T2-174; U union-A/B cách sàn 29 s — theo dõi sát; #88? hole-recheck 337 hit, 0 mốc mới lần thứ mười sáu).
6. **(1c') (f') triển khai V1** — T8-174 (đã chấp nhận V1 (f'): miễn (f) khi run paused+seeking liên tục ≥ 300 s; replay kiểm lại trên log đợt 172/173).
7. **84l10 điều tra riêng + Q3 heartbeat** — T8-174 (thêm heartbeat nhẹ vào vòng W2/E4 theo mẫu HB128 của 85m4).
8. **E-177 kết cục** — T9-174 (đang ghim, 27 mẫu, 1 chuỗi, 0 sag).
9. **POSTBOOT_PASS #85?** — T5-174 (watcher-173b vẫn chạy trên #84? tới hạn 23:30:00Z; nếu reboot mới xảy ra, spawn watcher mới).
10. **Prune lần 48** — T6-174. **Checklist (o)** — T8-174. **H3** chỉ giám sát thụ động.
11. **Run 172 kết cục** — T7-174 (vẫn running lúc T7-172 đóng; reboot #82 lúc 19:00:48Z trong lúc run 172 chạy — đã viết lại 1 lần).
12. **#82 có giết holder không** — T6-174 (#80/#81 KHÔNG giết holder — chuỗi "không giết holder" mới từ #69: 13 reboot #69–#81).
13. **F-173-T5-4** (cache 132 → 0 trong 61 s) — theo dõi, cùng họ F-172-T5-2; cần bằng chứng host-side nếu muốn kết luận cơ chế.
14. **Replay #83? một phần** — T0/T7-174 nếu cần điều tra tại sao update lấy thiếu suite noble/noble-updates (không bắt buộc; bằng chứng trong cell đã hết).
15. **G1 khung (a) M2** vẫn hoãn — chờ quyết G1 của user (đã hỏi 13:44 16/11, chưa trả lời). **R9 (a)** vẫn chờ user (số đếm vẫn là 16).
16. **T2-174/T4-174:** không chạy script phân tích nặng trong cửa sổ attempt + nhắc T5 không probe dpkg trong cửa sổ attempt (B4 đứng).

---

## §9. Đề xuất cho parent (quyết ở aggregate 173)

**(a) Chấp nhận verdict đợt 173?** T5 đề xuất **CHẤP NHẬN** — cờ #84? đã có (repair-sớm-quyết-h, poll=1, verify độc lập exit 0), watcher-173b đang chạy tốt, F-172-T6-5 đã đóng, F-171-T5-1 không lặp lại, hướng (3) lần 20, marker sống. Caveat duy nhất: cờ #84? KHÔNG phải replay-đầy-đủ (ghi rõ §3.1).

**(b) Cờ dd08464a — CÂU HỎI QUYẾT:** Manual repair trên dd08464a xong exit 0, RE-CHECKs đều PASS (log `t5-postboot-repair-dd08464a.log`), nhưng reboot #84? btime 21:01:15Z rơi vào giữa lúc repair (32 s trước khi xong) nên poll1 độc lập KHÔNG kịp chạy trên boot sống. **Parent chọn 1 trong 2:**
- (b1) Chấp nhận bằng chứng repair-log làm căn cứ cờ cho dd08464a (ghi cờ hậu kiểm, ghi rõ caveat "repair-log-only, không poll1 trên boot sống") — T5-174 thực hiện nếu parent chọn;
- (b2) dd08464a thành boot thứ 16 không cờ (không bù) — T5 giữ nguyên quyết định không tự viết cờ.

**(c) Chấp nhận (m) #81 DƯƠNG đã quyết (e) đợt 172 — không mở lại.** (m) #82 (DƯƠNG ỨNG VIÊN) + (m) #83?/#84? thuộc T2-174 + parent 174.

**(d) Xác nhận số hiệu boot #83?/#84?** — chờ T0-174 xác minh 9 nguồn (T5 không phán).

**(e) F-173-T5-1 (23 s) + F-173-T5-5 (9 s)** — ghi nhận mẫu overlap thứ ba/thứ tư; không đổi verdict (m); không cần hành động.

**(f) F-173-T5-4** (cache 132 → 0 trong 61 s trên boot mới) — ghi nhận, theo dõi; cùng họ F-172-T5-2.

**(g) Replay #83? một phần (F-173-T5-3)** — ghi nhận mẫu mới (replay chạy nhưng chỉ 23/170 intent, thiếu noble + noble-updates); có điều tra host-side hay không là quyết của parent (không bắt buộc).

**(h) File guard `repaired-dd08464a`** — parent quyết có chạm hay không (chỉ có ý nghĩa ghi chép; T5 không chạm vì watcher done=1).

**(i) Watcher-173b vẫn đang chạy trên #84?** (hạn 23:30:00Z) — T5-174 tiếp quản theo dõi; nếu reboot mới, spawn watcher mới theo mẫu.

---

## §10. Sai số của chính T5-173 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-173-T5-1** | Poll cuối watcher-172 nằm SAU btime #82 23,0 s (mẫu overlap thứ ba) | Ghi nhận | Không ảnh hưởng verdict; poll cuối vẫn thuộc boot cũ (dpkg/md5 khớp #81) |
| **F-173-T5-5** | Poll cuối watcher-173 nằm SAU btime #84? 9,0 s (mẫu overlap thứ tư) | Ghi nhận | Không ảnh hưởng verdict |
| **F-173-T5-3** | Replay #83? chạy nhưng chỉ một phần (23/170 intent) — mẫu mới | Ghi nhận | Suy luận nguyên nhân (thiếu noble + noble-updates) ghi là suy luận, chưa đo trực tiếp |
| **F-173-T5-4** | Cache 132 → 0 trong 61 s trên boot mới (21:02:16Z → 21:03:17Z) | Chưa xác định | Cơ chế chưa xác định; cùng họ F-172-T5-2 |
| **F-173-T5-6** | Chuỗi thay nhãn §14 trong generator stats không dùng placeholder đã thay nhầm 2 lần (cả 2 cửa sổ thành #83?) | Đã sửa | Đã sửa bằng placeholder trong generator + sửa tay file sinh; kiểm bằng diff: generator tái tạo đúng bản sửa (diff rỗng) |
| **F-173-T5-7** | Chuỗi thay datetime §14 áp dụng TOÀN CỤC đã làm hỏng `t_btime82` trong §11 (19:00:48Z → 20:25:47Z), khiến output stats lần 1 có 2 số sai: `F-173-T5-1 = -5076` (đúng +23) và `khong_watcher_tu_btime82 = 1023` (đúng 6.122) | Đã sửa — **output lần 1 KHÔNG được dùng** | Đã sửa generator (chỉ thay trong vùng §14, cắt lát chuỗi) + sửa dòng 276 file sinh về 19:00:48Z; kiểm diff rỗng, syntax OK. **Stats lần 2 (21:33:34Z) là bản chính** — 2 số đã đúng (+23, 6.122); diff lần 1 vs lần 2 chỉ khác các giá trị phụ thuộc thời gian + 2 số đã sửa (đã kiểm toàn bộ diff) |
| **F-173-T5-8** | Proc `apt-get -s` của stats T5 xuất hiện trong 6 poll watcher-173b (21:31:06Z, 21:31:36Z, 21:32:06Z, 21:34:36Z, 21:35:06Z, 21:35:36Z) + poll gate0wait #39/#40/#44/#45 của T4 (apt=1) | Không nhiễm | dpkg không đổi 795, không attempt nào chạy (T4 gate0wait); cùng mẫu F-172-T5-4 |
| **F-173-T5-9** | `/tmp/l8-postboot-apt.log` (log apt của manual repair) KHÔNG còn trên boot mới — /tmp không giữ qua reboot | Hạn chế bằng chứng | Repair apt transcript chỉ còn trong repair log + watcher polls; các lần repair sau nên copy log ra khỏi /tmp ngay (đề xuất cho T5-174) |
| — | T5 KHÔNG append dòng ghi chú vào `replay-watch-173.log` | Quyết định có chủ ý | Tránh lệch số dòng 43 → 44 so với stats đã trích; manual repair ghi ở file riêng + LIMITS này |
| — | Số dòng dpkg cuối cùng trên dd08464a sau manual repair KHÔNG đo được | Hạn chế bằng chứng | Repair log chỉ chứng minh install + RE-CHECKs PASS; không chứng minh số dòng dpkg (xem §5.2) |
| — | Lý do update #83? lấy thiếu suite | Chưa xác định | Suy luận từ lists đo được; stdout payload ở journal host-side, T5 không đọc được |

**Số liệu chính thức trong file này lấy từ stats lần 2 (21:33:34Z) + các log trực tiếp; output stats lần 1 chỉ dùng để đối chiếu, KHÔNG dùng làm nguồn số liệu.**

---

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND173_T5_INFRA_LIMITS.md` (file này).
- Paths file: `~/workspace/repo-1-push/paths-loop/phase9-round173-t5-infra.txt` (NUL-delimited, 1 entry; đã verify bằng read-back `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round173-t5/` (theo mẫu T5-171/172): watcher script/log, stats script/output, log postboot/repair, POSTBOOT_PASS + backup — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng — user tự push sau từ main chat). Chờ push đợt 166–173: đợt 166–172 = 70 batch / 98 entry / 92 file duy nhất / 91 file mới + đợt 173 (1 file này) + file oversize 6,4 MB chưa quyết.

---

## Phụ lục A — Trích stats output lần 2 (bản chính, 21:33:34Z)

```
=== PHU LUC SO LIEU T5-173B (trich bang script, 2026-11-22T21:33:34Z) ===
--- 1. Boot hien tai ---
boot_id=4ae2d2ea-a7d6-4869-8b32-2a142adaa586
btime_epoch=1795381275 = 2026-11-22T21:01:15Z
uptime_s=1938.67 now=2026-11-22T21:33:34Z
uptime_-s=2026-11-22 21:01:15
/proc/1 mtime=2026-11-22 21:01:27.309342668 +0000
journal_boots:
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 4ae2d2eaa7d648698b322a142adaa586 Sun 2026-11-22 21:01:27 UTC Sun 2026-11-22 21:33:06 UTC
journal_first_entry=1795381287.753388 htch-runtime systemd-journald[17]: Journal started
clock_lan1: local_truoc=21:33:34.645Z CF=Date: Sun, 22 Nov 2026 21:33:36 GMT local_sau=21:33:35.473Z
clock_lan2: local_truoc=21:33:35.473Z CF=Date: Sun, 22 Nov 2026 21:33:36 GMT local_sau=21:33:35.829Z
--- replay-watch-172.log --- tong_dong=149 kinds={'REPLAY-WATCH-172-START': 1, 'MONITOR': 1, 'postboot': 1, 'FLAG-WRITTEN': 1} polls=142 first=2026-11-22 17:41:39+00:00 last=2026-11-22 19:01:11+00:00 gaps={563.0: 1, 30.0: 131, 31.0: 9} md5_set=['4e865c5c', 'e89e703c'] lines_set=['2', '795'] boot_set=['4b9db449'] mtime_log=2026-11-22 19:01:11.211944226 +0000
--- replay-watch-173.log --- tong_dong=43 kinds={'REPLAY-WATCH-173-START': 1, 'MONITOR': 1, 'REPLAY_DONE': 2, 'postboot': 1} polls=38 first=2026-11-22 20:42:50+00:00 last=2026-11-22 21:01:24+00:00 gaps={30.0: 33, 31.0: 4} md5_set=['2bfb0446', '3586b5b3', '36d8c27e', '606bece4', '6ea1f936', '8e825333', 'bc017a49'] lines_set=['102', '181', '2', '245', '3', '301', '323'] boot_set=['dd08464a'] mtime_log=2026-11-22 21:01:24.892142044 +0000
--- 2c. POSTBOOT_PASS theo boot ---
  #4ae2d2ea: ['.../round173-t5/POSTBOOT_PASS']
  #dd08464a: (khong co file co nao chua)
  #34e61c92: (khong co file co nao chua)
  #4b9db449: ['.../round172-t5/POSTBOOT_PASS', '.../round173-t5/POSTBOOT_PASS-4b9db449', '.../round173-t5/POSTBOOT_PASS']
  #2acdd1ab: ['.../round171-t5/POSTBOOT_PASS', '.../round172-t5/POSTBOOT_PASS-2acdd1ab', '.../round172-t5/POSTBOOT_PASS', '.../round173-t5/POSTBOOT_PASS-4b9db449']
  #e298bb52: (khong co file co nao chua)
  #f2b97695: (khong co file co nao chua)
  #b643911f: (khong co file co nao chua)
--- 3. round173-t5/POSTBOOT_PASS (#84?) --- mtime=2026-11-22 21:27:05.996330814 +0000
boot 4ae2d2ea-a7d6-4869-8b32-2a142adaa586 (btime 2026-11-22 21:01:15Z; watcher-173b) — repair-som-quyet-h: dpkg 795 dong; cache 110 .deb; lists 75; postboot PASS poll1 doc lap exit 0 luc 2026-11-22T21:27:05Z; POSTBOOT_PASS moi ghi 2026-11-22T21:27:05Z poll=1 (repair-som-quyet-h); co cu 4b9db449 luu POSTBOOT_PASS-4b9db449
--- 3b. round172-t5/POSTBOOT_PASS (#81) --- mtime=2026-11-22 17:50:32.812992807 +0000 (repair-som-quyet-h, poll=1, dpkg 795, cache 110, lists 75)
--- 3c. round171-t5/POSTBOOT_PASS (#80) --- mtime=2026-11-22 14:52:09.925608854 +0000 (replay-day-du, poll=0, dpkg 1545, cache 178, lists 37)
--- 3d. Marker --- CO; written 2026-11-20T11:39:40Z; boot 2c0a7985 (#48); mtime=2026-11-20 11:39:47.272154981 +0000
--- 4. dpkg/cache/lists/GST --- dpkg_lines=795 md5=d5f006a592aeacc65b4d89d046ace39b mtime=2026-11-22 21:27:05.071840936 +0000; dpkg_dong_dau=2026-11-22 21:02:01 startup packages configure; dpkg_dong_cuoi=2026-11-22 21:27:05 status installed libc-bin:amd64 2.39-0ubuntu8.9; cache_deb=110 cache_bytes=58529968; lists_entries=75 (azure 34 + cogentco 34); gst_sys_files=269 gst_sys_is_link=SYMLINK -> /home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/gstreamer-1.0 gst_debroot_files=269; watcher173b_ps=4077 bash .../replay-watch-173b.sh (ALIVE); watcher173_pid13457_kill0=DEAD; watcher172_pid17944_kill0=DEAD
--- 5. Trang thai 11 goi + 5 lib + do phu ledger (sau repair #84?) --- 11/11 installed: libevent-2.1-7t64 2.1.12-stable-9ubuntu2.2; gstreamer1.0-plugins-base 1.24.2-1ubuntu0.7; -good 1.24.2-1ubuntu1.8; -bad 1.24.2-1ubuntu4; -ugly 1.24.1-1build1; -gl 1.24.2-1ubuntu0.7; -libav 1.24.1-1build1; -x 1.24.2-1ubuntu0.7; libavif16 1.0.4-1ubuntu3; libgstreamer1.0-0 1.24.2-1ubuntu0.2; libevdev2 1.13.1+dfsg-1build1. 5/5 lib CO: libevent-2.1.so.7, libEGL.so.1, libavif.so.16, libdw.so.1, libevdev.so.2. ledger_goi_can=170 da_cai_literal=106 thieu_literal=64 (64 ten Y HET dot #81); ledger_thieu_install_-s: tat ca 64 rc=0 (thoa qua Provides/candidate); ledger_hieu_dung_thieu=[] (hieu dung 170/170 — KHONG dung lam so chinh thuc, xem F-172-T5-3)
--- 6. ENOSPC journal boot hien tai (#84?) --- ENOSPC_dong=29 ENOSPC_signature_dong=29 journal_dong=172 ENOSPC_dong_dau=Nov 22 21:03:08 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
--- 7. RAM snapshot --- MemTotal 8124900 kB; MemFree 166944 kB; MemAvailable 498500 kB; loadavg=1.16 0.96 0.75 1/450 14749
--- 8. systemd user manager (huong 3) --- user_at_0=inactive; logind=inactive; dbus=inactive; loginctl_root=Failed to connect to bus: No such file or directory; linger_dir=KHONG CO; run_user_0=KHONG CO; crontab=command not found; timers_vcut=0
--- 9. Co round173 .done --- t0 (20:54:44Z), t1 (20:53:27Z), t2 (21:21:13Z), t6 (20:55:52Z)
--- 10. X11 --- total 0; xvfb_pgrep_x=none
--- 11. Watcher-172/173/173b + 2 khoang khong-watcher ---
watcher172_tong_poll=142 tren #81; watcher172_poll_cuoi=2026-11-22T19:01:11Z boot=4b9db449 poll dpkg_lines=795 md5=e89e703c apt=[] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=75; watcher172_flag=2026-11-22T17:50:32Z FLAG-WRITTEN boot=4b9db449 mode=repair-som-quyet-h poll=1 (old=2acdd1ab); watcher172_co_dong_END_STOP=False; watcher172_proc_apt_trong_moi_poll=False
watcher173_tong_poll=38 tren #83?; watcher173_poll_cuoi=2026-11-22T21:01:24Z boot=dd08464a poll dpkg_lines=323 md5=2bfb0446 apt=[36470 ] apt2=[] dpkg=[] gst_sys=269 cache=115 lists=75; watcher173_flag=(chua co FLAG); watcher173_trigger=(chua trigger); watcher173_repair_exit=(chua repair); watcher173_co_dong_END_STOP=False
watcher173b_tong_poll=42 tren #84?; watcher173b_poll_cuoi=2026-11-22T21:35:36Z boot=4ae2d2ea poll dpkg_lines=795 md5=d5f006a5 apt=[14587 ] apt2=[] dpkg=[] gst_sys=269 cache=110 lists=75; watcher173b_flag=2026-11-22T21:27:05Z FLAG-WRITTEN boot=4ae2d2ea mode=repair-som-quyet-h poll=1 (old=4b9db449); watcher173b_trigger=2026-11-22T21:16:43Z EARLY-REPAIR TRIGGER boot=4ae2d2ea boot_age=928s frozen=882s dpkg_lines=2 — verify form-B truoc; watcher173b_repair_exit=2026-11-22T21:16:43Z --repair exit=0
F-173-T5-1_poll_cuoi_SAU_btime82_giay=23 (poll cuoi 19:01:11Z - btime #82 19:00:48Z)
F-171-T5-1_poll_cuoi_truoc_han_END_giay=5329 (poll cuoi 19:01:11Z - han END watcher-172 20:30:00Z; chet theo reboot, KHONG dung som)
F-171-T5-1_lap_lai_o_watcher172=KHONG (poll lien tuc toi reboot)
khong_watcher_giay=6099 (1h41m39s)
khong_watcher_tu=2026-11-22T19:01:11Z den=2026-11-22T20:42:50Z
khong_watcher_tu_btime82_giay=6122 (btime #82 19:00:48Z -> START 20:42:50Z)
F-173-T5-5_poll_cuoi_watcher173_SAU_btime84_giay=9 (poll cuoi 21:01:24Z - btime #84? 21:01:15Z; mau overlap thu 4)
F-171-T5-1_lap_lai_o_watcher173=KHONG (poll lien tuc toi reboot; repair tay van chay sau btime)
khong_watcher_2_giay=198 (3m18s)
khong_watcher_2_tu=2026-11-22T21:01:24Z den=2026-11-22T21:04:42Z
--- 12. dpkg breakdown + apt history #84? --- dpkg_breakdown={'startup': 4, 'install': 106, 'status': 568, 'upgrade': 4, 'configure': 110, 'trigproc': 3} tong=795; apt_history_transactions=1; apt_history_dau=Start-Date: 2026-11-22 21:26:52; apt_history_cuoi=Start-Date: 2026-11-22 21:26:52;End-Date: 2026-11-22 21:27:05;; apt_history_4goi_gstreamer=2; apt_history_commandline_mau=Commandline: apt-get install -y --no-install-recommends libevent-2.1-7t64 gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer
--- 13. Repair #84?: receipt + ledger + dpkg-state --- receipt=KHONG CO; ledger_lines=2 mtime=2026-11-22 21:27:05.593330817 +0000; ledger_sha256=b4c3f77714978139465240df8f0aa10fce930ee07b7ddbb54f04d0c05038ea7e; ledger_noi_dung_tom_tat={'v': 1, 'ts': 1795381307, 'event': 'dpkg-post-invoke', 'compacted': True, 'added': 170, 'removed': 0} {'v': 1, 'ts': 1795382825, 'event': 'dpkg-post-invoke', 'added': 106, 'removed': 0}; dpkg_state=CO 2026-11-22 21:27:05.545330817 +0000 45743; dpkg_state_dong=889; dpkg_log_hoat_dong_dau=2026-11-22 21:02:01 startup packages configure; dpkg_log_install_dau=2026-11-22 21:26:52 install iso-codes:all <none> 4.16.0-1; dpkg_log_install_cuoi=2026-11-22 21:27:02 install gstreamer1.0-plugins-bad:amd64 <none> 1.24.2-1ubuntu4; dpkg_log_cuoi=2026-11-22 21:27:05 status half-configured libc-bin:amd64 2.39-0ubuntu8.9; 2026-11-22 21:27:05 status installed libc-bin:amd64 2.39-0ubuntu8.9;
--- 14. Cache .deb mtime theo cua so #82/#83? + lists + apt dirs --- cache_deb_tong=110 mtime_cu_nhat=2021-04-29 14:29:24+00:00 mtime_moi_nhat=2026-11-18 16:22:47+00:00; cache_mtime_buckets={'truoc_btime82 (<19:00:48Z)': 110}; cache_partial_mtime=total 0; cache_lock_mtime=2026-11-06 09:55:49.720212363 +0000; apt_log_dir=total 72;drwxr-x--- 1 root root 60 Nov 22 21:35 .; eipp.log.xz 34440 (21:35); history.log 6009 (21:27); term.log 28536 (21:27); term_log_mtime=2026-11-22 21:27:05.082330821 +0000; history_log_mtime=2026-11-22 21:27:05.082330821 +0000; lists_mtime_moi_nhat=total 405164; lists_azure_files=azure.archive.ubuntu.com_ubuntu_dists_noble-backports_InRelease (+ main_binary-amd64_Packages, main_i18n_Translation-en); lists_cogentco_files=mirror.cogentco.com_pub_linux_ubuntu_dists_noble-backports_InRelease (+ main_binary-amd64_Packages, main_i18n_Translation-en); ubuntu_sources=URIs: http://azure.archive.ubuntu.com/ubuntu http://mirror.cogentco.com/pub/linux/ubuntu; apt_proxy=Acquire::http::Proxy "http://hatch-egress-proxy:3128";;Acquire::https::Proxy "http://hatch-egress-proxy:3128"; dpkg_lock_frontend=-rw-r----- 1 root root 0 Nov  6 09:55 /var/cache/apt/archives/lock;-rw-r----- 1 root root 0 Nov 22 21:02 /var/lib/apt/lists/lock;-rw-r----- 1 root root 0 Nov 22 21:02 /var/lib/dpkg/lock-frontend;
=== HET PHU LUC T5-173B 2026-11-22T21:33:34Z ===
```

## Phụ lục B — File làm việc T5-173

Thư mục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round173-t5/` (KHÔNG stage — chỉ tham chiếu):

- `make-watcher-173.py`, `replay-watch-173.sh`, `replay-watch-173.log` (43 dòng), `replay-watch-173.nohup.log`, `watcher-status-at-open.txt`
- `make-watcher-173b.py`, `replay-watch-173b.sh`, `replay-watch-173b.log`, `replay-watch-173b.nohup.log`, `watcher-173b-status-at-open.txt`
- `POSTBOOT_PASS` (#84?, 325 B) + `POSTBOOT_PASS-4b9db449` (backup cờ #81, 324 B)
- `t5-postboot-check-dd08464a.log` (verify độc lập #83? exit=1, 20:54:59Z)
- `t5-postboot-repair-dd08464a.log` (manual repair #83? exit=0, 20:56:57–21:01:47Z) + `t5-manual-repair-note.txt`
- `t5-postboot-poll0-dd08464a.log` (watcher-173 poll0 exit=1)
- `t5-postboot-verify-4ae2d2ea.log` / `t5-postboot-repair-4ae2d2ea.log` / `t5-postboot-poll1-4ae2d2ea.log` (watcher-173b)
- `t5-postboot-independent-4ae2d2ea.log` (verify độc lập #84? exit=0, 21:33:29Z)
- `make-stats-173.py`, `t5-stats-173.py` (chưa chạy — bị reboot chen ngang), `make-stats-173b.py`, `t5-stats-173b.py`
- `t5-stats-173b-output-run1.txt` (lần 1, 21:29:55Z — CÓ 2 số sai §11, KHÔNG dùng làm nguồn), `t5-stats-173b-output.txt` (lần 2, 21:33:34Z — BẢN CHÍNH)

Tham chiếu đợt trước: `hidden_files/round172-t5/` (POSTBOOT_PASS #81, backup POSTBOOT_PASS-2acdd1ab, replay-watch-172.log 149 dòng); `~/workspace/repo-1/docs/PHASE9_ROUND172_T5_INFRA_LIMITS.md`; `~/workspace/repo-1/docs/PHASE9_ROUND172_LIMITS.md`; `~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh`.

---

*Hết LIMITS T5-173. T5-173 đóng sổ lúc ~21:38Z 22/11/2026, trong hạn cờ (~23:00Z).*
