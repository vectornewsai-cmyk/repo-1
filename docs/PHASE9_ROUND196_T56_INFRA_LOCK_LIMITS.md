# PHASE9_ROUND196_T56_INFRA_LOCK_LIMITS.md — T56 đợt 196 (gộp T5+T6: infra/watcher + POSTBOOT_PASS + lock health + prune)

**Trạng thái:** ĐÃ XONG watcher-196 + cờ **#123 ứng viên (replay-day-du, poll=0, GST THƯ MỤC THẬT — như #121/#117)** + (A) **120/120 lần thứ 45** + suite 9/9 × 6 + prune lần 70 + #122 + #123 **KHÔNG GIẾT HOLDER** (chuỗi 25 → 26 → 27) + hướng (3) **lần thứ 42** + **F-196-T56-1..7**. **Watcher-195 CHẾT SỚM ~10:14:39Z GIỮA ĐỜI #121, TRONG LẶNG #A** (không phải chết theo reboot — xem §1.2/F-196-T56-1; nguyên nhân CHƯA XÁC ĐỊNH). Monitor chu kỳ **5 s** áp dụng lần đầu (cải tiến F-195-T56-3) — **0 kill cả 5 lần chạy**. 1 entry stage duy nhất.

**Nguồn đứng duy nhất:** §14.2 aggregate 195 **(68.559 B) — SẠCH, parent viết trực tiếp** trong lượt handoff 18:35 +07 26/11/2026 (dedup python + kiểm chéo shell viết mới, KHỚP TỪNG SỐ lần thứ 133 liên tiếp; lần sạch thứ tư kể từ đợt 179: 179, 183, 191, 195; tổng điền sẵn GIỮ 18). Các quyết THẬT dùng: (a) CHẤP NHẬN CÓ ĐIỀU KIỆN đợt 195; (b) FULL PASS CÓ, chuỗi 0 → 1; (c) POSTBOOT_PASS #121 CÓ KHÔNG caveat, #120 KHÔNG CÓ, tổng boot không cờ 28 → 29; (e) 8c4aa907 = #121 XÁC NHẬN, marker 73; (f) (m) #119 KHÔNG CÓ ĐIỂM (CUỐI), (m) #120 DƯƠNG (CUỐI, +47,008 s), n ứng viên 54/55; (g) n chính thức GIỮ 14; (h) E-247 GIỮ MỞ (T9 thiếu); (i) holder 23 → 24 → 25; (j) V4 GIỮ LIVE, 84l10 chuỗi 2 → 3, 86n2-P1 lần 17, log sạch 37 → 40, B2 vùng mới sạch lần 9, B1 live sạch 2 → 3; (n) stall 5.739 s = OUTAGE MỚI (sự kiện thứ 3); (p) F-195-P4-3 VI PHẠM NHẸ; (q) đếm cuối đợt 195 = 11/29/27/24.

| Hạng mục | Kết quả |
|---|---|
| POSTBOOT_PASS #123 ứng viên (bc09b26e) | **ĐÃ CÓ 14:41:58Z (boot+11m42s, replay-day-du, poll=0)** — replay chạy thật 14:35:47–14:39:00Z (1.477 dòng); verify độc lập exit=0 (log md5 GIỐNG HỆT poll0); 11/11 apt + 5/5 lib; GST 269=269 **THƯ MỤC THẬT (apt, như #121/#117)**; dpkg **1.477**; cache 171; lists 37 |
| Watcher-195 | **CHẾT SỚM ~10:14:39Z GIỮA ĐỜI #121** (poll cuối, KHÔNG có dòng END/STOP/NEWBOOT; pid 44695 đã mất) — chết **~1h03m TRƯỚC reboot #122 (11:17:40Z)** và ~4h16m TRƯỚC reboot #123 (14:30:16Z); KHÔNG phải chết theo reboot (xem F-196-T56-1) |
| Watcher-196 | START 14:41:56Z, pid **7775**, hạn **17:35:51Z 26/11 (= hạn cứng đợt 197)** — **ALIVE lúc đóng** (poll 15:03:14Z); khoảng không-watcher **~4h27m17s** (10:14:39Z → 14:41:56Z) bao ~1h03m cuối đời #121 + **toàn bộ đời #122 (3h12m36s)** + ~11m40s đầu #123 |
| Replay #123 | **ĐÃ CHẠY (dạng A — replay đầy đủ thật)** — 14:35:47–14:39:00Z, 1.477 dòng, install cuối gstreamer1.0-tools 14:39:00Z; /var/log/apt CÓ; KHÁC dạng B |
| Hướng (3) | **VẪN ĐỨNG lần thứ 42** |
| Marker sống | CÒN, mtime 2026-11-20 11:39:47Z không đổi, md5 cb7102c0 — sống qua **73 reboot đã xác nhận (#49–#121), 75 nếu #122 + #123 đều xác nhận** |
| (A) lock | **120/120 PASS lần thứ 45** (tổng **5400/5400**); suite **9/9 × 6**, rc=0 cả 6; chuỗi suite xanh 76 → **77** |
| Lock | KHỎE (811 cặp lúc kiểm cuối, 0 đang giữ, chênh **GIỮ 12**, STALE-LOCK GIỮ 12, double-acquire GIỮ 7, 0 TIMEOUT mới, 0 "KHÔNG NHẢ"); **#122 + #123 KHÔNG GIẾT HOLDER (25 → 26 → 27)** |
| Prune lần 70 | **XÓA 3 FILE theo điều (a)** (queue 92 → 89; F-147-T6-1 chuỗi **VẪN 0 lần thứ 17**); prune chạy khi lock trống, KHÔNG phải chờ |
| Vi phạm T4 | **0 chồng pha (b) đợt này** — monitor 5 s, 5 lần chạy, 0 kill; suite + harness chạy khi gate ĐỎ suốt, xong trước khi gate mở (gate chưa mở lúc T56 đóng) |
| T4-196 | Gate **ĐỎ suốt phiên T56** (poll #1 14:41:12Z → #30 15:03:26Z; load5 chưa từng < 2 — thấp nhất 2,62 lúc poll #23); **0 attempt lúc T56 đóng** — verdict thuộc T4-196 |
| T8-196 | **CHƯA CÓ dir/LIMITS lúc T56 đóng (15:03Z)** — 84l10 chuỗi 3 + 86n2-P1 lần 17 **CHƯA XÁC NHẬN cho đợt 196** (giữ số đợt 195, chờ T8-196/T10) |
| X11 / zombie | **0 zombie cả 2 snapshot (giữa/cuối)**; X11 1 → **0** socket (X192 của T01 dọn sạch sau O8 — sạch hơn đợt 195); Xvfb 1 → **0**; listener 8765 VẪN MẤT; vite :5187 chưa từng lên (T4 chưa attempt), :5560 của T01 đã mất sau khi nhả lock |
| Đồng hồ | Cloudflare local CHẬM ~1 s (local 1795704802 vs CF 1795704803) — δ=1 s; khoảng trống lock gấp ~16.444× δ → KHÔNG caveat |
| Quy tắc B4 | **T56-196 KHÔNG chạy probe chạm dpkg nào NGOÀI watcher** (0 configure/install/update/repair tay); verify độc lập chỉ đọc |

**Số hiệu boot #122/#123 CHƯA QUYẾT — T01-196 xác minh (GAP §124; parent quyết (d)).** #122 = 2f268a28 (btime 11:17:40Z, parent quan sát trực tiếp + quyết (e)-195) KHÔNG xác minh được bằng 9 nguồn tươi nữa (journal/wtmp/dpkg chỉ còn boot hiện tại); #123 = bc09b26e ứng viên. T56 KHÔNG phán (m) — (m) #121/#122/#123 thuộc T2-196; run 200/201 thuộc T7-196.

## §0. Trạng thái lúc mở (~14:39Z)

- **Boot lúc mở: `bc09b26e-18f4-4c64-acf6-09aefc5946ec`, btime 14:30:16Z** (epoch 1795703416; `uptime -s` khớp; journal idx 0 duy nhất, first 14:30:34Z = btime +18 s; `last` reboot 14:30 still running; `who -b` Nov 26 14:30; T01-196 survey 14:40:27Z). **Số hiệu #123 ứng viên theo GAP §124 (T01-196) + quyết (e)-195 (8c4aa907 = #121 XÁC NHẬN).** Gap #121→#122 = **10.535 s (2h55m35s)**; gap #122→#123 = **11.556 s (3h12m36s)** (tổng #121→#123 = 22.091 s). **KHÔNG có reboot trong phiên T56.**
- **Replay #123 ĐÃ CHẠY XONG trước khi T56 mở:** dpkg.log 1.477 dòng, md5 55a53e78, mtime 14:39:00Z (install cuối gstreamer1.0-tools); /var/log/apt CÓ; lists 37; cache 171 .deb; GST hệ thống 269 file THƯ MỤC THẬT; libevent CÓ; 0 proc apt/dpkg. **KHÁC dạng B** — replay đầy đủ thật (dạng A), như #121.
- **Lock lúc mở: TRỐNG** (dòng cuối RELEASED 09:56:12Z t8-round195 — trống đã ~4h43m). **T4-196 ĐÃ spawn lúc T56 mở** (poll #1 14:41:12Z — T56 mở ~14:39Z; gate0 dự phòng T4-check-only). **T01-196 ĐÃ survey xong 14:40:27Z**, đang chạy O8 (acquire lock 14:43:14Z — xem §5.1). Không có dpkg/apt nào CỦA T56.
- **Watcher-195 ĐÃ CHẾT lúc mở** (ps không còn process watcher — pid 44695 đã mất; log dừng 10:14:39Z; xem §1.2).
- **Latch:** `round-in-progress.md` — T56 không kiểm latch đợt này (không thuộc nhiệm vụ T56).

## §1. Timeline + Watcher + POSTBOOT_PASS (T5)

### §1.1. Timeline (giờ Z, 26/11/2026)

**08:51:25Z** **watcher-195 START, pid 44695** (đợt 195). **08:51:26Z** FLAG-WRITTEN #121 (poll0). **~09:31Z** T56-195 đóng (.done 09:31:28Z). **10:12:46Z** lặng scheduler **#A** bắt đầu (F-196-T01-2 — 10:12:46.713Z → 11:35:41.152Z, 4.974 s, bao trùm btime #122). **10:13:50Z** T9-195 ram-sampler mẫu cuối (avail 671.580 kB, balloon 5.809.240 kB). **10:14:39Z** **watcher-195 poll cuối — CHẾT, không rõ nguyên nhân** (xem §1.2 — chết TRONG lặng #A, ~1m53s sau khi lặng bắt đầu). **11:17:40Z** **reboot #122 (2f268a28)** — nằm TRONG lặng #A; không watcher, không cờ. **11:35:41Z** lặng #A kết thúc (daemon hồi phục). **11:35–11:52Z** T10-195 đóng + parent viết §14.2-195 trên đời #122 (aggregate 195 mtime 11:52:34Z; T10-195 .done 11:45:52Z). **12:41:54Z** lặng scheduler **#B** bắt đầu (F-196-T01-2 — 12:41:54.161Z → 14:35:40.437Z, 6.826 s, bao trùm btime #123). **14:30:16Z** **reboot #123 ứng viên (bc09b26e)** — nằm TRONG lặng #B. **14:35:47–14:39:00Z** replay #123 chạy (1.477 dòng, boot+5m31s → boot+8m44s). **~14:39Z** T56-196 mở; T01-196 survey 14:40:27Z. **14:41:12Z** T4-196 poll #1. **14:41:56Z** **watcher-196 START, pid 7775** → poll0 exit=0 → **FLAG-WRITTEN 14:41:58Z** (boot+11m42s, replay-day-du, poll=0). **14:42:43Z** T4 poll #3: t5flag=PASS qua **ĐƯỜNG CHÍNH round196-t56/** — fix (p)-191 đứng đợt thứ tư liên tiếp. **14:43:14–14:48:54Z** T01-196 O8 giữ lock (hold 340 s — T56 chờ, xem F-196-T56-2). **14:51:30–14:53:56Z** suite 6 lần (gate ĐỎ). **14:54:50–15:02:41Z** harness 4 chunk, 120/120, 0 kill. **15:03:24Z** T56 prune lần 70. **~15:04Z** T56 viết LIMITS này. Watcher-196 vẫn ALIVE (pid 7775, poll 15:03:14Z). T4 gate vẫn ĐỎ (poll #30 15:03:26Z).

### §1.2. Watcher-195 — CHẾT SỚM ~10:14:39Z GIỮA ĐỜI #121, KHÔNG PHẢI CHẾT THEO REBOOT (F-196-T56-1)

- Poll cuối **10:14:39Z** (boot 8c4aa907, dpkg 1.477 ổn định, md5 **01ff5ecc**; log mtime 10:14Z, 172 dòng, 170 poll); KHÔNG có dòng END/STOP/NEWBOOT; pid 44695 đã mất lúc T56-196 kiểm ps ~14:39Z. Watcher-195 chết **~1h03m TRƯỚC reboot #122 (11:17:40Z)** và **~4h16m TRƯỚC reboot #123 (14:30:16Z)**, **~4h21m TRƯỚC hạn 14:35:51Z** — KHÔNG phải chết theo reboot (khác watcher-194/193), cũng KHÔNG phải chết đúng hạn. **Chết TRONG lặng scheduler #A** (lặng bắt đầu 10:12:46.713Z — T01-196 F-196-T01-2; poll cuối 10:14:39Z = lặng+1m53s).
- **VM sau khi watcher chết:** aggregate 195 mtime **11:52:34Z** (parent viết §14.2 trên đời #122), T10-195 .done mtime **11:45:52Z**, T56-195 .done mtime 09:31:28Z (T56-195 đóng TRƯỚC khi watcher chết 43 phút — cái chết không gắn với phiên spawner). Chỉ có 2 file trong `hidden_files/` đổi mtime trong cửa sổ 10:14–14:30Z: `replay-watch-195.log` (chính nó, 10:14:39Z) + `round195-t10.done` (11:45:52Z) — **0 file nào đổi mtime 10:14:39Z → 11:45:52Z**, khớp lặng #A (0 event scheduler 10:12:46–11:35:41Z). VM hồi phục làm việc lại từ ~11:35:41Z (T10-195 đóng 11:35–11:52Z trên #122). **Watcher chết TRONG lặng #A — không còn giữ được kết luận "chết đơn lẻ, không phải VM đóng băng" như bản nháp đầu; cơ chế chết (đóng băng VM vs teardown runtime) CHƯA XÁC ĐỊNH (xem F-196-T56-1).**
- **Ba dấu hiệu cùng cụm 10:12–10:14Z:** lặng #A bắt đầu **10:12:46.713Z** (T01-196) → T9-195 ram-sampler mẫu cuối **10:13:50Z** → watcher-195 poll cuối **10:14:39Z**. Cả hai tiến trình nền dài hạn dừng trong ~2 phút đầu của lặng #A. Giả thuyết teardown phiên cron (bản nháp đầu) YẾU ĐI: T56-195 đóng 09:31Z mà watcher sống thêm 43 phút, và lặng #A là sự kiện hệ thống độc lập (0 event scheduler). **Nguyên nhân CHƯA XÁC ĐỊNH — T56 không phán cơ chế; phân loại lặng #A thuộc T7-196 + parent (n)-196.**
- **Không có syslog/kern.log trên đĩa để kiểm OOM:** `/var/log/syslog*` + `/var/log/kern.log*` KHÔNG TỒN TẠI (ls trống; grep OOM 0 kết quả) — không có bằng chứng OOM theo hướng nào. Journal chỉ giữ boot hiện tại.
- **Khoảng không-watcher ~4h27m17s** (10:14:39Z → 14:41:56Z) — bao **~1h03m cuối đời #121 + TOÀN BỘ đời #122 (11:17:40–14:30:16Z, 3h12m36s) + ~11m40s đầu #123**. Đây là khoảng không-watcher dài thứ tư liên tiếp bao trọn một boot (#116, #118, #120, #122) — mẫu hệ thống. Điểm khác đợt này: watcher chết giữa boot #121 (trong lặng #A) chứ không phải theo reboot — chiến lược "watcher sống sang đợt sau" vẫn mong manh ngay cả khi không có reboot. Bài học cho brief đợt sau: T56-197 PHẢI kiểm ps lúc mở (quy tắc đứng (3)) — và cần cân nhắc cơ chế respawn watcher trong phiên (hiện không có — xem LIMITS T5-163 §2). **Đính chính cách nói của T01-196 (GAP §124): "watcher-195 CHẾT theo reboot #122" là nói lỏng — theo timestamp chính xác, watcher chết 10:14:39Z, TRƯỚC reboot #122 (11:17:40Z) 1h03m; điều đúng là watcher KHÔNG SỐNG SANG đời #122 (xem F-196-T56-6).**
- **Đính chính poll cuối watcher-195:** poll cuối ghi dpkg 1.477 dòng, md5 **01ff5ecc**, gst_sys 269, cache 171, lists 37 — đúng trạng thái #121, không có dấu hiệu suy thoái trước khi chết (load lúc đó thấp: T9 sampler 10:13:50Z load1 0,36, avail 671.580 kB — không có dấu hiệu OOM/CPU).

### §1.3. POSTBOOT_PASS #123 ứng viên — ĐÃ CÓ 14:41:58Z (replay-day-du, poll=0)

- Watcher-196 trigger DONE ngay poll đầu (dpkg 1.477 dòng > 100, ổn định, 0 proc; init mtime 14:39:00Z) → postboot poll0 **exit=0** (hoàn tất 14:41:58Z, dpkg 1.477, cache 171, lists 37) → FLAG-WRITTEN (ghi FULL boot_id, F-151-T5-1; timestamp HOÀN TẤT poll0, F-152-T5-3). **Cờ cũ #121 (8c4aa907) được sao lưu** thành POSTBOOT_PASS-8c4aa907 trong round196-t56/ (md5 28847b1e = bản gốc, byte-identical).
- **Profile cờ này MẠNH NHẤT kể từ #117, ngang #121:** replay đầy đủ thật (không repair) + GST thư mục thật + poll0 — tương đương #121, hơn hẳn #119 (repair + poll=1 + GST symlink). Không có caveat về mode; chỉ còn caveat số hiệu chưa quyết (parent xác nhận #123 ở §9).
- **T4-196 đã thấy postboot PASS qua ĐƯỜNG CHÍNH:** poll #3 (14:42:43Z) t5flag=PASS, gate0=T5 (round196-t56/POSTBOOT_PASS). Poll #1–#2 trước khi cờ về vẫn dùng cờ cũ round195-t56/ ("cu/mtime-cu" — đúng thiết kế chống cờ sai boot) + gate0 dự phòng T4-check-only — đúng thiết kế. **Fix (p)-191 đứng đợt thứ tư liên tiếp** (191, 194, 195, 196).
- **T56 verify độc lập: exit=0** (~14:42Z, SAU khi watcher spawn — log `t56-postboot-independent-bc09b26e.log` md5 **ec88fdb8 GIỐNG HỆT** log poll0 của watcher). 11/11 apt + 5/5 lib + GST 269=269 THƯ MỤC THẬT — xem §2.

### §1.4. POSTBOOT_PASS #122 — KHÔNG CÓ, KHÔNG VIẾT ĐƯỢC post-hoc (F-196-T56-7)

- #122 (2f268a28-e619-4ca8-9313-374888c714f8, btime 1795691860 = 11:17:40Z theo parent quan sát trực tiếp trong lượt handoff 18:35 +07 + quyết (e)-195; gap #121→#122 = 10.535 s; sống 11.556 s tới 14:30:16Z). **0 file cờ nào nhắc 2f268a28** (chỉ có ghi chú trong nhật ký ngày của parent + GAP §124 của T01-196; T56-196 không viết cờ cho boot đã chết — tiền lệ #118/#120).
- **Vì sao không viết được:** #122 đã chết 14:30:16Z, TRƯỚC khi T56-196 mở phiên (~14:39Z). Viết cờ lúc này đòi hỏi các trường không còn kiểm chứng được: dpkg.log đã reset theo reboot 14:30:16Z; journal chỉ giữ idx 0 của boot hiện tại; /var/log/apt của #122 đã mất; không có lần chạy postboot check nào trên #122 khi nó còn sống (không watcher trong đời nó — watcher-195 chết 10:14:39Z, watcher-196 spawn 14:41:56Z; T56-195 đóng ~09:31Z; T4-195 thoát poller 09:21:58Z). **Viết cờ không-verify là bịa đặt — tiền lệ #118/#120. T56 KHÔNG làm.**
- **Bằng chứng về #122 (gián tiếp, KHÔNG đủ để viết cờ):**
  - Parent quan sát trực tiếp lúc #122 còn sống (lượt handoff 18:35 +07 26/11): `uptime -s` = 11:17:40Z, btime 1795691860, boot_id 2f268a28 — chứng minh boot tồn tại và sống, không đo postboot.
  - T10-195 .done mtime **11:45:52Z** (trên đời #122, boot+28m12s) + aggregate 195 mtime 11:52:34Z — chứng minh VM hoạt động trên #122, không đo postboot.
  - T01-196 GAP §124: boot_gen đổi run 200 → run 201 + lặng #A (F-196-T01-2) bao trùm btime #122 — củng cố sự tồn tại của #122, không đo postboot.
  - (m) #122 THÔ 0 requeue theo T01-196 — thuộc T2-196, không phải bằng chứng postboot.
- **Tổng boot không cờ 29 → 30** (nếu parent chấp nhận). Parent quyết ở §9(c).
- **Lưu ý cho brief đợt sau:** nợ cờ của một boot chỉ viết được khi boot đó CÒN SỐNG lúc T56 mở phiên; nếu boot đã chết trước phiên, brief cần giao "xác minh post-hoc từ bằng chứng sống sót" thay vì "viết cờ". **Bài học đợt này: brief T56-196 ghi "boot #122" nhưng boot T56 gặp lúc mở là #123 — số hiệu trong brief có thể lỗi thời khi có reboot giữa lúc viết brief và lúc mở phiên (xem F-196-T56-6); T56 phải đối chiếu số hiệu với T01-196/GAP trước khi đóng LIMITS.**

## §2. Verify độc lập #123 (T56, check-only, ~14:42Z) + GST THƯ MỤC THẬT

- **Verify độc lập: postboot exit=0** — wrapper PASS (đã vá K1); **5/5 lib PASS** (libevent/libEGL/libavif/libdw/libevdev); GST **269=269 PASS** (isomp4 + libav); **11/11 gói apt PASS** (kể cả libevdev2, Q7 đợt 114); KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit. File: `t56-postboot-independent-bc09b26e.log` (md5 ec88fdb8 = log poll0 của watcher — hai lần chạy độc lập cho cùng kết quả byte-identical).
- **GST #123 là THƯ MỤC THẬT** (`/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, drwxr-xr-x, `readlink` KHÔNG trả gì, rc=1) — kiểm KHÔNG trailing slash (bài học F-194-T56-2). Giống #121/#117 (thư mục thật), khác #119 (SYMLINK → debroot, ephemeral). Postboot script in INFO "là thư mục thật (apt)".
- **Replay #123 dạng A đầy đủ:** dpkg.log bắt đầu 14:35:47Z (boot+5m31s, 2 dòng startup) rồi cài liên tục tới 14:39:00Z (boot+8m44s, 1.477 dòng) — install cuối gstreamer1.0-tools; history.log ghi Start 14:38:59Z → End 14:39:00Z cho lần apt cuối; ổn định từ đó (md5 55a53e78 không đổi 14:39:00Z → 15:03Z, ~24 phút).

## §3. Cờ cũ — VẪN CÓ, md5 KHÔNG ĐỔI

| Cờ | md5 lúc kiểm cuối |
|---|---|
| #123 (bc09b26e, MỚI) | e94fad95 |
| #121 (8c4aa907, backup ở round196-t56/) | 28847b1e (= bản gốc round195-t56/, byte-identical) |
| #119 (55c9e0b7, backup ở round195-t56/ + bản gốc round194-t56/) | 863a6035 (= bản gốc, byte-identical) |
| #117 (1c0bcaad, backup ở round194-t56/) | 46e0b657 |
| #115 (ebc5a3b9, round192-t56/) | 734f8e2d |
| #114 (b0aab705, backup ở round192-t56/ + round191-t56/) | 288f863b |
| #112 (27e6714f, backup ở round191-t56/) | ca79a6b2 |

## §4. Ledger KHÔNG ĐỔI + T01-196 O8

- **Ledger — VẪN 1 dòng, NỘI DUNG KHÔNG ĐỔI:** `/var/lib/hatch/os-intent/ledger.jsonl` mtime vẫn **05:04:19Z**, ts **1795661454** (repair #119, compacted=true), **added 170 gói**. **KHÔNG có dòng nào cho replay #123** (replay #123 không chạm ledger — như #121). Số dòng ledger (1) không đổi, nội dung không đổi.
- **T01-196 O8 (ghi nhận — verdict thuộc T01-196):** survey 14:40:27Z (boot bc09b26e, btime 1795703416, uptime -s 14:30:16, journal idx 0 first 14:30:34Z = btime +18 s, wtmp, who — khớp T56). O8 PASS 21/21 ×2 WebKit + 21/21 Chromium trên bc09b26e (14:43:14–14:48:54Z, hold 340 s); O8 chạy SAU khi cờ #123 có 1m16s (ĐÚNG quy trình, khác đợt 195). T56 chờ T01 nhả lock mới chạy suite/harness (xem F-196-T56-2) — 0 chồng lấn.
- **HAI khoảng lặng scheduler MỚI (T01-196 F-196-T01-2 — T56 chỉ ghi nhận, phân loại thuộc T7-196 + parent):** **#A 4.974 s (10:12:46.713Z → 11:35:41.152Z) bao trùm btime #122**; **#B 6.826 s (12:41:54.161Z → 14:35:40.437Z) bao trùm btime #123** — lớn thứ hai trong họ (sau 8.406 s đợt 179). Cùng chữ ký OUTAGE #2/#3 (0 event bất kỳ; ID liên tục; reboot nằm trong lặng; run trễ lúc hồi phục: heartbeat +891 s / +890 s, feed-pulse +3.227 s / +3.226 s; doctor 11:00Z + 13:00Z + 14:00Z VẮNG). 4 lặng trong ~11,5 giờ ngày 26/11 — failure mode LẶP LẠI, tần suất đang tăng. **Watcher-195 chết TRONG lặng #A** (poll cuối 10:14:39Z = lặng+1m53s — xem §1.2); **T9-195 sampler dừng TRONG lặng #A** (mẫu cuối 10:13:50Z = lặng+1m04s).

## §5. Lock health (T6) — #122 + #123 KHÔNG GIẾT HOLDER (chuỗi 25 → 26 → 27)

### §5.1. Nhất quán log lock: 811 cặp lúc kiểm cuối, 0 đang giữ, chênh GIỮ 12

Log thật `hidden_files/vite-lock-v2.log`, đếm bằng CỘT $3 (`analyze-log.py` tái dùng đợt 192). Số chính thức đã loại 6 dòng repro lỗi của T6-132 (owner tA/tH).

| Chỉ số (bản đã lọc) | T56-195 kiểm cuối | T56-196 kiểm cuối | Δ từ T56-195 |
|---|---|---|---|
| Tổng dòng | 2845 | **2874** | +29 |
| TICKET / ACQUIRED / RELEASED | 826 / 815 / 803 | **834 / 823 / 811** | +8 / +8 / +8 |
| COOLDOWN / STALE-LOCK / STALE-TICKET / TIMEOUT | 378 / 12 / 1 / 10 | **383 / 12 / 1 / 10** | +5 / +0 |
| Cặp ACQUIRED→RELEASED | 803 | **811** | +8 |
| Đang giữ cuối log / Chênh ACQ−REL | 0 / 12 | **0 / 12** | — |
| Double-acquire (nghiêm ngặt) | 7 | **7** | 0 mới |

- **KIỂM CUỐI ĐỢT NÀY: ACQUIRED 823 / RELEASED 811, 811 cặp (raw 2880 dòng).**
- **+29 dòng kể từ T56-195 kiểm cuối (~09:27Z):** t8-round195 ×26 (7 chu kỳ acquire/release + 5 COOLDOWN, 09:36–09:56Z — khép kín; sau khi T56-195 đếm xong) + t01-round196 ×3 (TICKET+ACQUIRED 14:43:14Z, RELEASED 14:48:54Z, hold 340 s — khép kín). 26+3 = 29 ✓.
- **Trong phiên T56-196 (từ lúc mở ~14:39Z): +3 dòng** (t01-round196 — khép kín). **0 dòng nào của T56 trên log lock thật** (suite/harness chỉ chạy trên /tmp).
- **Double-acquire GIỮ 7 — 0 ca mới**; STALE-LOCK GIỮ 12 — 0 ca mới; **0 RELEASED không có ACQUIRED trước, 0 TIMEOUT mới** (TIMEOUT cuối vẫn 19/11 15:50:28Z), 0 sự kiện "KHÔNG NHẢ". **Kết luận: lock KHỎE.** Caveat: **#68 GIẾT HOLDER t4**; **#95 CÓ GIẾT HOLDER** (t8-round179); **#96–#105 + #107–#123 KHÔNG giết** (verdict đợt 186–196; #106 không tính; #122/#123 chờ parent xác nhận số hiệu).

### §5.2. #122 — KHÔNG GIẾT HOLDER (chuỗi 25 → 26 nếu xác nhận)

#122 (btime 11:17:40Z, `2f268a28-e619-4ca8-9313-374888c714f8`, parent quan sát trực tiếp + quyết (e)-195; T01-196 GAP §124): dòng lock cuối trước btime là t8-round195 RELEASED 09:56:12Z — **TRỐNG 4.848 s (1h20m48s)**; 0 dòng trong cửa sổ [11:17:40Z, 14:30:16Z); dòng đầu tiên sau btime là t01-round196 TICKET 14:43:14Z; 0 STALE-LOCK mới. Khoảng trống gấp ~4.848 lần δ 1 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 26 reboot** nếu parent xác nhận #122 = 2f268a28.

### §5.3. #123 ứng viên — KHÔNG GIẾT HOLDER (chuỗi → 27 nếu xác nhận)

#123 ứng viên (btime 14:30:16Z, `bc09b26e-18f4-4c64-acf6-09aefc5946ec`, T01-196 survey 14:40:27Z + T56 xác minh 9 nguồn tương đương): dòng lock cuối trước btime là t8-round195 RELEASED 09:56:12Z — **TRỐNG 16.444 s (4h34m04s)**; dòng đầu tiên sau btime là t01-round196 TICKET 14:43:14Z; 0 STALE-LOCK mới. Khoảng trống gấp ~16.444 lần δ 1 s — **KHÔNG cần caveat clock-fast**. **Chuỗi mới = 27 reboot** nếu parent xác nhận #123 = bc09b26e. T56 KHÔNG tự chứng nhận số hiệu reboot — số hiệu #122/#123 theo GAP §124 (T01-196) + quyết (e)-195 + nhật ký ngày của parent.
- **Verdict KHÔNG phụ thuộc số hiệu** — lock trống liên tục từ 09:56:12Z tới 14:43:14Z nên MỌI boot trong cửa sổ đó đều không thể giết holder (cùng lập luận như #118/#119/#121 đợt 194/195).

### §5.4. Quét zombie + X11 + ss (2 snapshot: giữa ~14:43Z / cuối ~15:02Z)

| Thời điểm | Zombie | Socket X11 | Xvfb | ss listener |
|---|---|---|---|---|
| Giữa (~14:43Z) | 0 | 1 (X192) | 1 (:192, pid 8745) | vite :5560 (T01 O8); 0 :5187, 0 :8765 |
| Cuối (~15:02Z) | 0 | **0** | **0** | 0 (không còn :5187/:5560/:8765) |

- **0 zombie thật ở cả 2 lần** (đếm bằng cột STAT — bài học F-175-T6-5). 0 process dpkg/apt nào CỦA T56. T56 không khởi động Xvfb/vite nào, không kill process nào. **X11 giữa/cuối là của T01-196** (Xvfb :192 + vite :5560 cho O8) — T56 chỉ ghi nhận. **Listener 0.0.0.0:8765 VẪN MẤT** (như đợt 193/194/195 — xem F-193-T56-7, không có diễn biến mới). **X192 dọn sạch sau O8** (server :192 thoát + socket mất — sạch hơn đợt 195, khi socket X195/X196/X197 còn sót; xem F-196-T56-5).

## §6. (A) CÒN NGUYÊN + KIỂM CHỨNG LẠI (A) — 120/120 PASS (lần thứ 45) + suite 9/9 × 6 + MONITOR 5 s MỚI, 0 KILL

Quyết parent (b) đợt 150 + (v) đợt 151: (A) là khóa chính thức của khối T7. Nhiệm vụ đợt này: KIỂM LẠI (A) còn nguyên, không triển khai lại.

- **Suite không đổi: md5 `a89c0676` lúc mở = lúc đóng = lúc kiểm cuối** (bản (A) đợt 151). Live-code khối T7 md5 **`c92f2efff2080fbe6712522343e9e400`** — KHÔNG TÁI TẠO ĐƯỢC cách tính từ T6-191 (xem F-193-T56-6; các mốc chính đều khớp nên không chặn verdict). File khối đã trích `t7-block-a196.sh` md5 **`dc973443030249a262ff63cbc62231d5`** — **giống hệt** đợt 151–195. Poll script `1710e480`, lock v2 `520b8baa`, lock v1 `fd21193c` — tất cả không đổi.
- **PHẠM VI HẸP — đã tuân thủ:** T56 chỉ chạy prune (§7) + suite/harness trên /tmp. Suite chạy trên log riêng trong /tmp — 0 dòng nào của T56 trên log lock thật trong phiên (§5.1: +3 dòng đều của t01-round196).
- **Suite đầy đủ: 9/9 × 6 lượt, T7 (A) xanh cả 6.** Chạy toàn bộ `test-vite-lock-v2.sh` 6 lần liên tiếp (14:51:30–14:53:56Z): **PASS=9 FAIL=0, rc=0 cả 6 lần** (~2,5 phút — chạy khi gate T4 ĐỎ, lock TRỐNG sau khi T01 nhả 14:48:54Z; log lock thật 2880 dòng không đổi trước/sau suite). Monitor 5 s bọc suite: 0 kill.
- **Harness 120 lần có churn — khối T7 trích VERBATIM từ suite** (sed marker `T7-BLOCK-START`/`T7-BLOCK-END`), chạy N=120 lần với churn bơm vào (1 process `WebProcess-churn` sau delay 0,5–3,5 s, sống 1,5 s — giống hệt T6-151–T6-195 §6.2). Chỉ chạy trên /tmp, không đụng lock thật, không đụng poll chung. **Kết quả: PASS=120 FAIL=0 / 120 (100%).** B1=1 B2=0 cả 120 lần. Delay churn (120 lần hoàn thành): min 511 ms, max 3484 ms, trung bình 2038,68 ms. (File delays đúng 120 dòng — không có lần chạy bị kill dở đợt này.)
- **KIỂM GATE — kiểm trước mỗi chunk + monitor TRONG chunk chu kỳ 5 s (MỚI — cải tiến F-195-T56-3, rút từ 10 s xuống 5 s; lần đầu áp dụng):** monitor nền `t7-gate-monitor-196.sh` chạy song song mỗi chunk (và cả suite), kiểm mỗi 5 s: (1) poll-t4.log có "CUA YEN MO"/GATE_OPEN=1 không, (2) lock log có **ACQUIRED MỚI BẤT KỲ OWNER NÀO** không — kill toàn bộ process group của chunk ngay khi phát hiện.
  - Chunk 1 (1–30, 14:54:50–14:56:43Z): 30/30. Monitor 0 kill.
  - Chunk 2 (31–60, ~14:56:5x–14:58:48Z): 30/30. Monitor 0 kill.
  - Chunk 3 (61–90, ~14:58:5x–15:00:43Z): 30/30. Monitor 0 kill.
  - Chunk 4 (91–120, ~15:00:5x–15:02:41Z): 30/30. Monitor 0 kill.
  - **Tổng: 30 + 30 + 30 + 30 = 120 lần hoàn thành, 120/120 PASS. 0 lần kill cả 5 lần chạy có monitor (suite + 4 chunk).**
- **T4-196 (ghi nhận — verdict thuộc T4-196 + parent):** gate ĐỎ suốt phiên T56 (poll #1 14:41:12Z → #30 15:03:26Z); load5 chưa từng < 2 (thấp nhất 2,62 lúc poll #23 14:58:06Z; sau đó vọt lại 3,83–4,77); **0 attempt lúc T56 đóng**. Cây preview.tsx ĐỔI giữa đợt (591f9655 → 558123e3, poll #17 — luồng sản phẩm P1/P2 đang làm việc; T4 ghi nhận, không phải việc T56). **0 chồng pha (b) với T4 đợt này** (khác đợt 195: chunk 2 chồng 9 s).
- **Đối chiếu cùng churn:** (B) đợt 150: 2/30 (7%); bản cũ đợt 150: 13/30 (43%); **(A) đợt 151–196: 120/120 mỗi đợt (100%)**. **Kết luận: (A) VẪN XANH sau 45 đợt** (tổng 5400/5400 dưới churn). 120/120 là tỉ lệ dưới churn bơm vào (stress) — điều đo được là SO SÁNH TƯƠNG ĐỐI: (A) 100% vs (B) 7% vs bản cũ 43%. **Chuỗi:** "xanh kép" 44 → **45**; suite xanh: 76 → **77**.

## §7. Prune cooldown lần 70 — XÓA 3 FILE theo điều (a) (KHÔNG PHẢI CHỜ LOCK)

Luật (đợt 125 §7, parent phê duyệt §12(c)): (a) xóa file `cooldown-*` mtime cũ hơn 7 ngày; (b) trần mềm 100 file; (c) không xóa file của đợt hiện tại hoặc đợt ngay trước; (d) ghi số file đã xóa + tên vào log; (e) chỉ chạy khi lock đang trống. Ngữ nghĩa `find -mtime`: `-mtime +7` chỉ khớp file **≥192h (8 ngày)** — bảo thủ hơn chữ luật tối đa 24h.

- Trước prune (~15:03Z): tổng **92 file / 1288 byte** (90 sau prune 69 + 2 file mới: `cooldown-t01-round195` + `cooldown-t4`); ứng viên (`find -mtime +7`): **3 file**.
- **KHÔNG PHẢI CHỜ LOCK đợt này** (khác đợt 194 phải chờ 2 lần): prune lúc 15:03:24Z, ngay sau khi kiểm lock trống (dòng cuối RELEASED 14:48:54Z t01-round196; T4 chưa attempt).
- ~15:03Z 26/11: điều (a) XÓA 3 file (đều ≥192h, đều qua mốc 168h ≥25h, không vi phạm (c)): **`cooldown-t8-round137`** (196,7h, mtime 2026-11-18), **`cooldown-t10-round137`** (196,3h), **`cooldown-t10-round138`** (193,1h — sát mốc nhất, vẫn qua 192h). `prune-deleted.txt` ghi đủ tên. File `cooldown-t8-round139` (191,0h) CHƯA tới mốc — KHÔNG xóa.
- **Kết quả prune lần 70: 3 file đã xóa.** Sau prune: **89 file / 1246 byte** (92 − 3 = 89 ✓; 1288 − 42 = 1246 ✓, 3 × 14 B). Điều (b) KHÔNG kích hoạt (89 < 100). Tầng tuổi: **≥192h: 3 → 0; ≥168h: 18 → 15; ≥72h: 59 → 56; ≥48h: 72 → 69**. **KHÔNG mất file nào không giải thích được.**
- **F-147-T6-1 — CHUỖI VẪN 0 (lần thứ mười bảy liên tiếp sau khi đứt tại 179):** cả 3 file xóa đợt này đã QUA mốc 7 ngày (168h) lúc xóa — quá ~25–29h. Không đổi luật (luật thuộc parent).

## §8. F-196-T56-n (sai số / ghi nhận riêng của T56-196)

- **F-196-T56-1 — Watcher-195 chết sớm giữa đời #121, TRONG lặng #A, nguyên nhân chưa xác định (xem §1.2).** Poll cuối 10:14:39Z (= lặng #A +1m53s), không END/STOP/NEWBOOT; chết ~1h03m trước reboot #122 và ~4h16m trước reboot #123, ~4h21m trước hạn. T9-195 ram-sampler cũng dừng trong lặng #A (mẫu cuối 10:13:50Z = lặng+1m04s); 0 file nào đổi mtime 10:14:39Z → 11:45:52Z; VM làm việc lại từ ~11:35:41Z (T10-195 đóng trên #122). Giả thuyết teardown phiên cron (bản nháp đầu) YẾU ĐI trước bằng chứng lặng #A. Không có syslog/kern.log trên đĩa để kiểm OOM. Khoảng không-watcher 4h27m17s bao trọn đời #122 — mẫu hệ thống lần thứ tư liên tiếp, nhưng lần đầu watcher chết giữa boot thay vì theo reboot.
- **F-196-T56-2 — T01-196 O8 giữ lock 340 s (14:43:14–14:48:54Z); T56 chờ, 0 chồng lấn.** T56 không chạy suite/harness trong lúc T01 giữ lock (kiểm lock log trước mỗi lần chạy). Không phải vi phạm — chỉ ghi nhận: cửa làm việc của T56 đợt này mở muộn ~10 phút sau khi mở phiên vì O8 chiếm lock; T4 gate cũng đỏ suốt nên không mất cơ hội đo nào.
- **F-196-T56-3 — Monitor chu kỳ 5 s áp dụng lần đầu (cải tiến F-195-T56-3), 0 kill.** Cả 5 lần chạy có monitor (suite + 4 chunk) đều 0 kill, 0 gate-mở giữa chừng — vì gate T4 đỏ suốt phiên (load5 chưa từng < 2). Cải tiến chưa được thử lửa trong tình huống gate mở giữa chunk (như đợt 195); giữ chu kỳ 5 s cho đợt sau để có dữ kiện so sánh với 10 s.
- **F-196-T56-4 — T8-196 CHƯA CÓ lúc T56 đóng (15:03Z): 84l10/86n2-P1 chưa xác nhận đợt này.** Không có dir `round196-t8`, không có LIMITS T8-196 trên đĩa lúc T56 đóng. Chuỗi 84l10 = 3 và 86n2-P1 lần 17 (đợt 195) GIỮ NGUYÊN như số chưa xác nhận — T56 không tự điền số của luồng khác. Chờ T8-196/T10.
- **F-196-T56-5 — X11 1 → 0 socket, dọn sạch (khác đợt 195).** Xvfb :192 (pid 8745) + vite :5560 của T01-196 thoát sau O8; socket X192 cũng mất (không còn sót như X195/X196/X197 đợt 195). T56 không tạo/xóa socket nào. Ghi nhận — dọn sạch là tốt, không ảnh hưởng lock hay postboot.
- **F-196-T56-6 — SỐ HIỆU BOOT TRONG BRIEF LỖI THỜI: bản nháp đầu của LIMITS này gọi bc09b26e là "#122" (theo brief T56-196); ĐÃ SỬA thành #123 trước khi đóng** — theo T01-196 GAP §124 + nhật ký ngày của parent (2f268a28 = #122, btime 11:17:40Z, parent quan sát trực tiếp). Reboot 11:17:40Z xảy ra GIỮA lúc viết brief và lúc T56 mở phiên (14:39Z), nên brief lỗi thời. Mọi số trong LIMITS này (cờ, holder, gap, marker) đã kiểm lại theo số hiệu đúng. Header comment của `replay-watch-196.sh` + `gen-watcher-196.py` cũng ghi "#122" cho bc09b26e — ĐÃ SỬA comment (không đổi hành vi script; watcher đang chạy không bị ảnh hưởng). Bài học: **T56 phải đối chiếu số hiệu boot với T01/GAP trước khi đóng LIMITS** (không tin số hiệu trong brief khi có reboot giữa chừng).
- **F-196-T56-7 — POSTBOOT_PASS #122 KHÔNG CÓ (xem §1.4).** #122 sống 11:17:40–14:30:16Z, không watcher, không verify lúc còn sống; không viết bù được (tiền lệ #118/#120). Tổng boot không cờ 29 → 30 nếu parent chấp nhận. #122 là boot thứ hai liên tiếp không có cờ sau #120 (đợt 195) — mẫu "mất cờ ở boot giữa hai đợt" lặp lại (#118, #120, #122).

## §9. Đề xuất cho parent (quyết ở aggregate 196)

**(a) Chấp nhận verdict đợt 196 (phần T56)?** T56 đề xuất **CHẤP NHẬN (phần T56)** — cờ #123 ứng viên đã có (replay đầy đủ, poll=0, verify độc lập exit=0, GST thư mục thật), replay #123 ĐÃ CHẠY (dạng A), cờ cũ VẪN CÓ, (A) 120/120 lần 45, holder #122 25 → 26 + #123 → 27, prune 70 xóa 3 file, hướng (3) lần 42 — với caveat F-196-T56-1 (watcher-195 chết sớm trong lặng #A, nguyên nhân chưa xác định) + F-196-T56-4 (T8-196 chưa có lúc T56 đóng — 84l10/86n2-P1 chưa xác nhận) + F-196-T56-7 (#122 KHÔNG CÓ cờ).

**(b) Cờ #123 ứng viên (replay-day-du, poll=0) — CÂU HỎI QUYẾT:** replay chạy thật 14:35:47–14:39:00Z (1.477 dòng) → poll0 exit=0, verify độc lập exit=0 (log md5 giống hệt poll0), 11/11 apt + 5/5 lib + GST 269=269 THƯ MỤC THẬT → dpkg 1.477 + cache 171 + lists 37. **Parent chọn 1 trong 2:** (b1) Chấp nhận **KHÔNG caveat** (profile mạnh nhất kể từ #117, ngang #121 — T56 đề xuất (b1)); (b2) Chấp nhận CÓ caveat (chỉ còn số hiệu chưa quyết — T56 thấy (b2) không cần thiết vì nội dung PASS là đầy đủ nhất có thể).

**(c) Xác nhận bc09b26e = #123 VÀ 2f268a28 = #122?** (btime #123 14:30:16Z, epoch 1795703416, gap #122→#123 = 11.556 s; btime #122 11:17:40Z, epoch 1795691860, gap #121→#122 = 10.535 s; T01-196 GAP §124; (m) #122/#123 thuộc T2-196.) **(c2) #122 KHÔNG CÓ cờ — tổng boot không cờ 29 → 30?** (#122 không watcher, không verify được post-hoc — xem §1.4; T56 đề xuất chấp nhận KHÔNG CÓ cờ (c1), như #118/#120.)

**(d) #122 KHÔNG GIẾT HOLDER — chuỗi 25 → 26 (trống 4.848 s); #123 KHÔNG GIẾT HOLDER — chuỗi → 27** (trống 16.444 s). **(e) (A) 120/120 lần thứ 45 (tổng 5400/5400) + suite 9/9 × 6 (chuỗi suite xanh 77) — parent ghi nhận?**

**(f) Prune lần 70: điều (a) xóa 3 file, queue 92 → 89; F-147-T6-1 chuỗi VẪN 0 lần thứ 17. (g) Hướng (3) VẪN ĐỨNG lần thứ 42 — parent ghi nhận cả hai?**

**(h) F-196-T56-1 (watcher-195 chết sớm giữa đời #121, TRONG lặng #A; T9 sampler cũng dừng 10:13:50Z) — parent ghi nhận; có chỉ đạo điều tra thêm hay chấp nhận là mẫu hệ thống?**

**(i) Watcher-196 vẫn chạy trên #123** (pid 7775, hạn 17:35:51Z = hạn cứng đợt 197) — **T56-197 PHẢI kiểm tra ps trước khi spawn watcher-197** (xem §1.2 + header watcher-196); nếu watcher-196 còn sống thì KHÔNG spawn mới.

## §10. Sai số của chính T56-196 (tự kiểm, trung thực)

| Mã | Vấn đề | Mức độ | Đã sửa / kết luận |
|---|---|---|---|
| **F-196-T56-1..7** | Xem §8 (đầy đủ, không lặp lại ở đây) | Ghi nhận | — |
| §5 | T56 không kịp snapshot zombie/X11 lúc mở (ưu tiên spawn watcher + verify postboot trước) | Hạn chế nhỏ | Chỉ có 2 snapshot (giữa/cuối); 0 zombie cả 2 lần; X11 giữa là 1 socket lúc ~14:43Z |
| — | md5 cờ cũ #111/#110/#109/#107/#104/#102/#101/#99/#98/#96/#95 không kiểm lại đợt này | Hạn chế nhỏ | Giữ số đợt 193/195; các cờ #123/#121/#119/#117/#115/#114/#112 đã kiểm lại, đều khớp |
| — | (m) #121/#122/#123 thuộc T2-196; run 200/201 thuộc T7-196; RAM/ENOSPC #122/#123 thuộc T9-196; inotify không đo lại (giữ số T6-187: 63.747) | Hạn chế nhỏ | Thuộc T9-196 / T2-196 / T7-196 |
| — | T8-196 chưa có lúc đóng — 84l10/86n2-P1 chưa xác nhận (xem F-196-T56-4) | Ghi nhận | Chờ T8-196/T10 |
| — | T4-196 chưa attempt lúc đóng — lượt yên #64 + live-check #15 thuộc T4-196/T9-196 | Ghi nhận | Gate đỏ suốt phiên T56 |

**Số liệu chính thức lấy từ log watcher-195 + log watcher-196 + log trực tiếp (verify độc lập/independent + poll0) + dpkg/history/term.log của #123 + ledger /var/lib/hatch/os-intent/ledger.jsonl + log lock thật + queue trên đĩa + poll log T4-196 + T01-196 survey 14:40:27Z + đối chiếu aggregate 195 (§14.2, SẠCH — parent viết trực tiếp) + LIMITS T56-195.**

## §11. Batch stage

- **1 file duy nhất:** `docs/PHASE9_ROUND196_T56_INFRA_LOCK_LIMITS.md` (file MỚI).
- Paths file: `phase9-round196-t56-infra-lock.txt` (NUL-delimited, 1 entry; đã verify `od -c`).
- **KHÔNG stage file làm việc** trong `hidden_files/round196-t56/` — tất cả chỉ ở hidden_files, không lên repo.
- **KHÔNG PUSH** (luật cứng). Chờ push: đợt 191 + đợt 192 + đợt 193 + đợt 194 + đợt 195 = 59/195/145/126 (theo MEMORY; T10-196 đếm lại bằng dedup toàn cục).
- **LIMITS này 43.020 B — VƯỢT trần push 37.768 B** (như T56-195: 42.026 B — do thêm §1.4 về #122 + đính chính số hiệu); lúc push cần `ENABLE_PRIVSEP=0`.

## Phụ lục A — Trích số liệu T56-196 (bản chính, 14:39Z – 15:04Z 26/11)

```
boot #121=8c4aa907-1329-4e9a-927e-acb2141baf67 btime=1795681325=08:22:05Z (parent XAC NHAN §14.2-195 SACH); song toi 11:17:40Z (10535 s); CO co POSTBOOT_PASS 08:51:26Z (replay-day-du, poll=0)
boot #122=2f268a28-e619-4ca8-9313-374888c714f8 btime=1795691860=11:17:40Z (parent quan sat truc tiep + quyet (e)-195; KHONG xac minh duoc bang 9 nguon tuoi nua); gap #121->#122 = 10535 s; song toi 14:30:16Z (11556 s); KHONG CO co POSTBOOT_PASS (xem §1.4); tong boot khong co 29 -> 30 neu parent chap nhan
boot #123=bc09b26e-18f4-4c64-acf6-09aefc5946ec btime=1795703416=14:30:16Z (uptime -s KHOP; journal idx 0 first 14:30:34Z = btime +18 s; T01-196 survey 14:40:27Z); gap #122->#123 = 11556 s
watcher-195: START 08:51:25Z pid=44695; poll cuoi 10:14:39Z dpkg 1477 md5=01ff5ecc; CHET SOM GIUA DOI #121 TRONG LANG #A (lang bat dau 10:12:46.713Z; poll cuoi = lang+1m53s), 0 END/STOP/NEWBOOT; chet ~1h03m TRUOC reboot #122 (11:17:40Z), ~4h16m TRUOC reboot #123 (14:30:16Z), ~4h21m TRUOC han 14:35:51Z; 0 file doi mtime 10:14:39Z -> 11:45:52Z; VM lam viec lai tu ~11:35:41Z (T10-195 .done 11:45:52Z; aggregate 195 mtime 11:52:34Z); T9 sampler dung 10:13:50Z (lang+1m04s); nguyen nhan CHUA XAC DINH
watcher-196: START 14:41:56Z pid=7775 boot=bc09b26e end=17:35:51Z (han cung dot 197); init dpkg 1477 md5=55a53e78 mtime=14:39:00Z cache=171 lists=37 gst_sys=269; REPLAY_DONE poll dau -> poll0 exit=0 (14:41:58Z); FLAG-WRITTEN 14:41:58Z poll=0 (old=8c4aa907); ALIVE luc dong (poll 15:03:14Z)
khoang khong-watcher: 10:14:39Z -> 14:41:56Z = 16037 s (4h27m17s) — bao ~1h03m cuoi doi #121 + TOAN BO doi #122 (11556 s) + ~11m40s dau #123
POSTBOOT_PASS #123: CO md5=e94fad95; replay-day-du poll=0; dpkg 1477 md5=55a53e78; cache=171; lists=37; GST 269 THU MUC THAT; verify doc lap exit=0 (~14:42Z, md5 log ec88fdb8 = poll0); backup #121 md5=28847b1e = goc
replay #123: 14:35:47-14:39:00Z (boot+5m31s -> boot+8m44s), 1477 dong, install cuoi gstreamer1.0-tools; /var/log/apt CO; on dinh tu 14:39:00Z (md5 55a53e78 khong doi toi 15:03Z)
ledger: 1 dong ts=1795661454 compacted=true added=170; mtime 05:04:19Z; KHONG co dong replay #123
Co cu KHONG DOI: #121 28847b1e / #119 863a6035 / #117 46e0b657 / #115 734f8e2d / #114 288f863b / #112 ca79a6b2
marker: md5 cb7102c0, mtime 2026-11-20 11:39:47Z — song qua 73 reboot da xac nhan (#49-#121), 75 neu #122 + #123 deu xac nhan
Lock (mo/kiem cuoi): raw 2877/2880; cleaned 2845/2874 (kiem cuoi T56-195 / T56-196); ACQUIRED 815/823; RELEASED 803/811; cap 803/811; chenh 12/12; TICKET 826/834; COOLDOWN 378/383; STALE-LOCK 12; STALE-TICKET 1; TIMEOUT 10; double-acquire 7; held 0
  Delta tu T56-195 kiem cuoi: +29 dong (t8-195 26 + t01-196 3); trong phien T56-196: +3 dong (t01 3)
(A): suite a89c0676; block dc973443 (giong het 151-195); poll 1710e480; lock v2 520b8baa; lock v1 fd21193c; suite 6x 9/9 rc=0 (14:51:30-14:53:56Z); harness 120/120 B1=1 B2=0; delay 511/3484/2038.68 ms
Gate: T4 gate DO suot phien (poll #1 14:41:12Z -> #30 15:03:26Z; load5 thap nhat 2.62 poll #23); 0 attempt luc T56 dong; t5flag=PASS tu poll #3 (14:42:43Z) qua duong chinh round196-t56/
Monitor 5 s (MOI): suite + 4 chunk, 5 MONITOR-START, 0 kill, 0 gate-mo giua chung
Prune 70: truoc 92 file / 1288 B; xoa 3 file (dieu (a)): cooldown-t8-round137 (196.7h), cooldown-t10-round137 (196.3h), cooldown-t10-round138 (193.1h); sau 89 file / 1246 B; tang tuoi: >=192h 3->0; >=168h 18->15; >=72h 59->56; >=48h 72->69
Holder: #122 KHONG GIET (trong 4848 s, ~4848x delta); chuoi 25 -> 26; #123 KHONG GIET (trong 16444 s, ~16444x delta); chuoi -> 27 (neu xac nhan)
Dong ho: CF - local = +1 s (local CHAM ~1 s); delta=1 s
X11/zombie: giua 0 zombie / X11 1 (X192) / Xvfb 1 (:192 pid 8745); cuoi 0 zombie / X11 0 / Xvfb 0; :8765 VAN MAT; :5187 chua tung len; :5560 cua T01 da mat sau khi nha lock
T4-196: 0 attempt luc T56 dong; T8-196: CHUA CO (84l10 chuoi 3 + 86n2-P1 lan 17 CHUA XAC NHAN dot 196)
```
