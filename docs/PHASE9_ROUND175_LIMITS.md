# PHASE9 — Đợt 175: LIMITS tổng hợp (aggregate)

Đợt 175 (lượt cron 09:35 +07 23/11/2026 = 02:35:51Z; T10 đóng sổ ~05:1xZ 23/11, trong hạn cứng ~05:30Z; verdict CHẤP NHẬN — parent ĐÃ QUYẾT (a) §12.3 dưới). 9 luồng song song (T0/T1/T2/T4/T5/T6/T7/T8/T9). Hai reboot giữa phiên: #87 (03:06:05Z) + #88 (05:04:17Z, sát hạn cờ).

## §1. T0 — Boot survey: reboot #86 XÁC NHẬN 9 nguồn + O8 trên #86 PASS 3/3

- **#86 XÁC NHẬN 9 nguồn**: boot `70b7f7ee`, btime 01:01:37Z (epoch 1795395697), gap #85→#86 = **7.321 s** — khớp T7-174. 9 nguồn: boot_id, btime, uptime bracket ×3 (boot_est = btime +0,897 s), /proc/1 (+17,90 s ticks / +18,793 s stat mtime), journal idx 0 duy nhất (first +19,564 s), wtmp/last/who, Cloudflare ×2 (local ≈ CF −1 s), DB tươi (boot_gen mới 0762915d), marker mtime không đổi.
- **Marker sống qua 38 reboot #49–#86** (mtime 2026-11-20 11:39:47.272154981Z không đổi).
- **(m) #86 số liệu thô: requeue eid 10252 = btime +49,418 s**, trong band [33; 49,8], **cách biên TRÊN 0,382 s — sát biên nhất từng ghi** (sát hơn #81 0,477 s ở biên dưới). 1 requeue duy nhất cửa hẹp lẫn cửa rộng (cửa hẹp đã khép hẳn); requeue mọi job trong [btime85, btime86+900 s] đúng 2 dòng (10222 + 10252). Caveat phân số: boot_est +0,897 s → offset ≈ +48,521 s, vẫn trong band, cách biên trên ≈ 1,279 s (F-175-T0-4). Phân loại cuối thuộc T2-175 + parent.
- **Run 174 — SUCCEEDED** (DB tươi ~02:40Z; kết cục thuộc T7-175): finished 02:24:03Z, wall 10.092 s, **trước hạn 708 s**, 5 event, đúng 1 lần viết lại (#86), không timeout. **Claimed_at DB hiện tại 02:23:52Z khác T7-174 ghi 23:36:04Z** → claimed→finished = 11 s (F-175-T0-3, cùng mẫu run 172/173). Run 175 jitter **0 s** (trở lại 0 sau +13 s ở run 174).
- **O8 trên boot #86: WebKit PASS 21/21 ×2 (pid17203 md5 `30e46593`, pid20731 md5 `55c9d481`) + Chromium PASS 21/21 (pid29459 md5 `67824d3e`), exit 0**, 02:40:52–02:46:17Z; đếm lại từ JSON gốc bằng python (21 ok=true ×3). Cả 3 bộ đều chạy **sau POSTBOOT_PASS #86 (02:40:29Z, watcher-175, replay-đầy-đủ, poll=0, dpkg 1545)** — khác #85, không cần repair tay.
- DR 23:00Z: 0 dòng, kiểm lần 9. Watcher-174 dị thường **+36 s** (F-175-T0-1, lớn nhất từng ghi). Lock thread nhãn sót `t0-round174` (F-175-T0-5, vô hại, nhả sạch sau 324 s). O8 chỉ chồng pha poll của T4-175, 0 attempt (F-175-T0-6; quy tắc đứng sau F-174-T2-5 được tuân thủ). X11 trống, 0 Xvfb, 0 process sót; boot lúc đóng vẫn 70b7f7ee (02:48:07Z); không reboot mới trong phiên T0.

## §2. T1 — Verify đợt 174: PASS, đếm khớp lần thứ 73 liên tiếp

- Đếm bằng script dedup toàn cục VIẾT MỚI `recount-175-t1.py` + kiểm chéo lần 2 bằng shell union-trừ (khớp): **đợt 174 = 10/14/14/13; lũy kế 111–174 = 628/1.106/959/781; chờ push 166–174 = 90/127/119/117; tái kiểm 111–173 = 618/1.092/946/768; 111–172 = 608/1.077/933; tổng 1–174 = 1.276/6.976/3.764 — KHỚP từng số quyết parent (q) §12.3 đợt 174.**
- **0 file thiếu trên đĩa** (3.764 đường dẫn duy nhất đã kiểm). Purity 0 cảnh báo (1.276 file, 0 entry rỗng/newline/trùng, 0 file thiếu NUL cuối).
- **9/9 cờ `.done` đợt 174 còn trên đĩa, đều có nội dung** (+ cờ closing T10 1.586 B); kích thước khớp từng số aggregate §10.1.
- **Suite chạy lại: 28/28 exit 0** (02:41:43–02:53:53Z, 12m10s, boot 70b7f7ee); `npm test` **12 pass, 0 fail**; cây md5 không đổi trước/sau suite, khớp hồ sơ T1-174.
- O8 xác nhận độc lập từ JSON gốc: đợt 174 T0 PASS 3/3 + T8 PASS 3/3 trên #85 — chuỗi LÊN 25 theo quyết parent (b). Lượt yên #43 tính lại độc lập: attempt2 passes=20, tickCost n=634 **median=44,5** (p90=68, max=96, min=28); attempt1 passesDone=3, partial=true. **Bộ O8 MỚI của T0-175 trên boot 70b7f7ee PASS 3/3** (WebKit 21/21 ×2 md5 30e46593/55c9d481 + Chromium 21/21 md5 67824d3e, exit 0, O8 DONE 02:46:17Z). **Phạm vi chưa kiểm: bộ O8 của T8-175 chưa có lúc T1 đóng** (02:54Z) — thuộc T8-175/T10-175 (T10 đã xác nhận, xem §10.2).
- F-175-T1-5: bản nháp đầu của script đếm mắc lỗi sắp xếp từ điển (F-173-T1-3) — bắt được nhờ kiểm chéo lệch số new (920 vs 781), đã sửa sang sắp xếp theo số round, chạy lại khớp toàn bộ. **F-175-T1-3: tổng toàn cục §10.3 của T10-174 thiếu 1** (1.275/6.974/3.763 vs đúng 1.276/6.976/3.764 — khớp số parent đã đính chính); các số quyết (q) không bị ảnh hưởng. **F-175-T1-7: hai bản cờ T9-174 KHÔNG giống nhau** (gốc 4.733 B md5 5910283b vs thư mục con 4.694 B md5 3f7c31af, bản nháp "02:0xZ") — aggregate nói "giống nhau" là chưa chính xác; cờ vẫn tính là CÓ. F-175-T1-1: 3 socket X11 X193/X194/X195 (mtime 02:49:51Z) lại xuất hiện trong phiên suite — giao T8-175 dọn (lần thứ 4 liên tiếp). F-175-T1-2: RAMavail dao động 365→1.039→859 MB trong phiên; suite chậm hơn T1-174 (12m10s vs 8m50s), U4 chiếm ~4m24s.

## §3. T2 — EPERM probe #93 + (m) #86/#87 DƯƠNG (CUỐI) + INSIDE #86/#87 TRUE + mù

- **EPERM probe #93: ok=2 fail=0** (02:39:56Z, boot 70b7f7ee). Sweep #93: 187 log, 20 marker — tất cả trích dẫn lại, **0 sóng thật**.
- **(m) #86: DƯƠNG (phân loại cuối ở cấp T2 — parent quyết cuối).** Requeue duy nhất eid 10252, run 174, 01:02:26.418Z = btime +49,418 s ∈ [33; 49,8] (cách biên TRÊN **0,382 s — sát biên nhất từng ghi**). T0-175 đã XÁC NHẬN 9 nguồn; marker 38 reboot. Caveat: neo watcher +36 s (muộn nhất từng ghi) → counterfactual +13,418 s dưới dải — verdict không bền với neo watcher; caveat phân số F-175-T0-4 (+48,521 s) vẫn trong dải, hướng có lợi. Nếu chấp nhận: n ứng viên 32/33 → 33/34.
- **(m) #87: DƯƠNG (phân loại cuối ở cấp T2 — parent quyết cuối)** (reboot mới trong phiên, 03:06:05Z, boot `ca31fac1`). Requeue duy nhất eid 10282, run 175, 03:06:44.864Z = btime +39,864 s (không sát biên theo btime). Số hiệu #87 CHƯA được T0 xác minh (chờ T0-176; T2 xác minh 6 nguồn trực tiếp). Caveat F-175-T2-9: verdict KHÔNG bền với neo watcher (+7 s → +32,864 s, **DƯỚI dải chỉ 0,136 s — hụt nhỏ nhất từng ghi**) và neo sampler (+16 s); bền với neo T4-poller (−8 s → +47,864 s). Nếu chấp nhận: n ứng viên 33/34 → 34/35. **n chính thức GIỮ 14.**
- **INSIDE: #86 TRUE (FULL132) — chuỗi dài 5; #87 TRUE (FULL133) — chuỗi dài 6.** Hai dải MÂU THUẪN ở cả hai (FULL131 NGOÀI, muộn 5.595 s; FULL132 NGOÀI, muộn 5.970 s); dải phương pháp chi phối theo F-165-T2-1.
- **Mù: #96? VẪN MỞ** — R file 1.238 s (lần thứ 11 liên tiếp không đổi); R union-A 1.222 s / union-B 1.211 s; U union 1.118 s, cách sàn 29 s. Sessions: 0 hoạt động thật ở #64–#86 (4 file mới đều đã kiểm nội dung trực tiếp; 3 file đợt 174 đã bị xóa — exec-log pruning). **#88? VẪN MỞ** — hole-recheck lần 19: 337 hit, 0 mốc mới (lần thứ 19 liên tiếp); hố U mới H-U15 (1.221 s sau #86) NEW=0. #95?/#94?/#77? giữ nguyên. **CERT/FULL GIỮ 76/91.** Caveat: walk chạy sau #87 nên /tmp = 0 (tmpfs bị xóa) — không ảnh hưởng R/S/T.
- **(m) #56: VẪN CÓ ĐIỀU KIỆN — lần thứ 18 không thu hẹp** (11 hướng mới đều âm tính/rỗng; tổng 62 hướng). Cửa R [2,56251; 2,66817) / J [2,566; 2,80753] s GIỮ NGUYÊN.
- **Tuân thủ luật script nặng: 0 vi phạm theo T2.** Guard giết m56 đúng lúc T4 mở attempt1 (03:17:49Z, exit 124); guard đã vá lỗi nhận biết attempt đóng (F-175-T2-11b); m56 chạy lại 03:25–03:27:47Z exit 0. — **MÂU THUẪN với T4 (xem §4, F-175-T4-2): T4 ghi VI PHẠM, T2 tự ghi "KHÔNG vi phạm".** T4 attempt1 trên #87: 20/20 + lớp B 5/5 + tickCost median 41,0 ms — **lượt yên hợp lệ #44** (chuỗi 37 → 38), poller thoát 03:21:38Z. Run 174 SUCCEEDED 02:24:03Z (trước hạn 708 s).

## §4. T4 — Lượt yên WebKit #44: CÓ lượt hợp lệ — chuỗi 37 → 38

- **Lượt hợp lệ #44: attempt1-ca31fac1 — 20/20 pass, lớp B ĐẠT 5/5, tickCost median 41,0 ms (≤60). Chuỗi lượt yên hợp lệ 37 → 38.** Ngân sách dùng **1/3**. Poller thoát 0 lúc 03:21:38Z, trong hạn cờ ~05:00Z. (T10 kiểm độc lập từ JSON gốc: passes=20, engine webkit.)
- **Cộng dồn mới (38 lượt)**: P1 **156/159**, P2 **150/150**, P3-A1 **131/159**, P3' **119/131 occ = 102/107 distinct-seq**, P7 **72/72**. P1 ĐÚNG 6/6 (p=2,5e-06), P2 ĐÚNG 6/6 (lag +1f ×6), P3-A1 ĐÚNG 5/6 (p=0,0016), P3' 6/6, P7 ĐÚNG — **lượt ĐÚNG TOÀN DIỆN đầu tiên kể từ đợt 169**. Sổ distinct-seq **đã thăng cấp as-of-175** (md5 `42927624…`, valid_rounds_p3 26, non_dat không đổi); helper live khớp tính tay độc lập (3 seq ĐẠT mới: 353, 442, 493).
- **Poller**: 50 poll thật, 1 lần cửa mở (poll #15 instance 3, 03:17:47Z), trên **2 boot**. Instance 2 (boot 70b7f7ee, 33 poll): gate0=T5 suốt nhưng RAM sập <1024 suốt 22 poll liên tiếp, cửa không mở được. **Reboot 03:06:05Z** (boot ca31fac1, ứng viên #87, gap #86→#87 = 7.468 s) giết poller; T4 phát hiện ~03:06:50Z, chạy check-only tay (exit 1, replay mới bắt đầu), **khởi động lại poller tay 03:07:15Z** (bài học F-173-T4-1). Instance 3 (15 poll): RAM ≥1024 15/15, replay cài xong dpkg 2→1545, cửa mở khi check-only PASS + load1 <2.
- **RAM <500 MB: 11/50 poll** (đợt thứ ba liên tiếp; chuỗi dài nhất 11 poll trên boot #86, min 404 MB). RAM toàn phiên 404→1994 MB.
- **POSTBOOT_PASS #86 ĐÃ CÓ** (02:40:29Z, mode **replay-đầy-đủ**, poll=0) — cờ đầy đủ đầu tiên kể từ #83. Nhưng trên boot mới ca31fac1, **T5-175 CHƯA viết cờ mới lúc T4 đóng (03:24Z)** — gate0 cho lượt hợp lệ #44 là **T4-check-only** (quyết (j) đợt 143); T10/parent cần quyết giá trị gate này cho chuỗi FULL PASS.
- **F-175-T4-2 — VI PHẠM quy tắc đứng (lần thứ hai liên tiếp):** T2 chạy `m56-175.py` trong ~4 s đầu cửa sổ attempt1 (ps-before có, ps-after 0 dòng; trước khi pass chạy — nhẹ hơn đợt 174 ~75 s). Lớp B vẫn ĐẠT 5/5, không kết luận m56 gây spike. — T2 tự ghi "KHÔNG vi phạm" (§3): **mâu thuẫn giữa hai luồng, parent/T10-176 làm rõ.**
- **B2**: 1 spike trong cửa sổ attempt (03:18:04Z, load1 3,29 = đúng load1 max lớp B); 19 spike trong cửa sổ instance 2 (load1 tới 6,10); 1 spike pre-attempt instance 3 (03:07:00Z, 3,22). Tổng 24 spike trong log T9 tới lúc đóng.
- Pre-flight PASS đầy đủ; test poll bắt được 1 sót mới **F-175-T4-1** (cleanup xóa nhầm `tree-md5.txt` — đã tạo lại trước khi mở poller). Stats "gan-mo" 8 vs mở thật 1 (F-175-T4-4, lần thứ tư liên tiếp — heuristic, poller vẫn đúng).

## §5. T5 — Infra: POSTBOOT_PASS #86 ĐÃ CÓ 02:40:29Z (replay-đầy-đủ, poll=0)

- **POSTBOOT_PASS #86 ĐÃ CÓ 02:40:29Z** (boot+1h38m52s, **mode replay-đầy-đủ, poll=0**). Boot 70b7f7ee, btime 01:01:37Z. Watcher-175 (pid 16528) tự viết cờ sau poll0 exit=0; T5 verify độc lập check-only exit=0 (11/11 gói + 5/5 lib, GST thư mục thật 269=269). **Cờ replay-đầy-đủ đầu tiên kể từ #80** (các cờ #81/#84/#85 đều mode repair) — **không caveat repair**.
- **Replay #86 đầy đủ 170/170 intent:** dpkg 1545 dòng (169 install / 9 upgrade / 178 configure — y hệt mẫu đầy đủ #77/#79/#80), 50 transaction 01:13:46–01:22:11Z, bracket (51 s, 20m34s], term.log 0 lỗi. F-174-T5-6 (replay một phần) **không lặp lại**. **0 repair, 0 probe chạm dpkg** — poll0 đã PASS nên không cần repair.
- **Cờ #85 (23:46:57Z, repair-tay-T5) và #84 (21:27:05Z) vẫn có, mtime không đổi. #83/#82 vẫn không cờ (tổng 16 boot không cờ, không đổi).**
- **Hướng (3) vẫn đứng lần thứ 22.** Marker sống qua #49–#86 = 38 reboot nếu #86 được T0-175 xác nhận (đã xác nhận, xem §1). RAM hồi nhanh 465.820 → 1.134.572 kB; ENOSPC #86: 31 → 34 dòng lúc đóng, vẫn tiếp diễn. X11 X188 + Xvfb :188 (của T4-175, xuất hiện 02:40Z) — T5 không dọn, giao T8.
- T4-175 poller đang chạy (poll #2/#3, gate0=T5 từ poll #2, chưa attempt); mọi việc T5 đều xong trước cửa sổ attempt, không chạm dpkg.
- **F-175-T5-1 (mới):** poll cuối watcher-174 01:02:13Z = **+36 s sau btime — mẫu overlap LỚN NHẤT** (11→20→23→9→8→36 s). Khoảng không-watcher 5.896 s bao trọn replay #86. **F-175-T5-3 (mới):** postboot script dòng 686 in cứng dòng lịch sử DOT-151 ("poll2 02:40:23Z") trên mọi lần chạy — dễ đọc nhầm thành kết quả live; ghi nhận, chưa sửa script repo.
- Câu hỏi cho parent (§9 LIMITS T5): **(b)** cờ #86 (replay-đầy-đủ, poll=0) chấp nhận đứng cho gate (a) **KHÔNG caveat** như tiền lệ #77/#79/#80? **(f)** replay #86 đầy đủ — **không cần điều tra host-side** (F-174-T5-6 không lặp lại; điều tra cho #85 vẫn không bắt buộc theo quyết (k) đợt 174).
- Watcher-175 pid 16528 ALIVE, hạn 05:30:00Z — T5-176 tiếp quản.

## §6. T6 — Lock health: (A) 120/120 lần thứ 25 + #86 KHÔNG giết holder + prune lần 50

- **(A) 120/120 — lần thứ 25 liên tiếp (tổng 3.000/3.000).** Suite md5 `a89c0676` không đổi; khối T7 trích verbatim md5 `dc973443…`, live-code `c92f2efff…` — khớp đúng đợt 151–174. Suite đầy đủ 9/9 × 6 lượt (02:41:55–02:45:56Z, ~40 s/lượt — chậm hơn đợt 174 do T0-175 chạy O8 song song); harness 120/120 PASS dưới churn, B1=1 B2=0 cả 120 lần, delay churn min 534 / max 3435 / mean 1924,35 ms (02:47:06–02:54:02Z). Chuỗi xanh kép 24→25; chuỗi suite xanh 56→57.
- **#86 KHÔNG giết holder**: dòng lock cuối trước btime 01:01:37Z là t8-round174 RELEASED 00:46:56Z → **lock trống 881 s (14m41s)**, 0 dòng log trong cửa sổ mở, 0 STALE-LOCK mới. Số hiệu #86 **ĐÃ ĐƯỢC T0-175 XÁC NHẬN 9 nguồn** nên verdict đứng trên số hiệu đã xác nhận. **Chuỗi "không giết holder" từ #69 lên 18 reboot.**
- **Prune lần 50: xóa 1 file** (`cooldown-t3-round120`, 163,56h, sớm 4,44h so với mốc 7 ngày), điều (b); **queue 101→100 file / 1400 byte**; điều (a) 0 file. **KHÔNG PHẢI CHỜ lock.** Chuỗi F-147-T6-1 nối lại **lần thứ 26**.
- **Watcher: KHÔNG có lệch.** 15862 = `b2-watcher.sh` (T9-175); 16528 = `replay-watch-175.sh` (T5-175) — cùng pid giữa phiên/lúc đóng, ghi rõ tên script theo bài học F-172-T6-5.
- **Lock khỏe:** 620 cặp lúc kiểm cuối (ACQUIRED 632 / RELEASED 620), 0 đang giữ, double-acquire GIỮ 12, STALE-LOCK GIỮ 12, 0 TIMEOUT mới, 0 "KHÔNG NHẢ". +36 dòng kể từ T6-174 đóng = 10 chu kỳ hoàn tất sạch (t4×2, t8-round174×7, t0-round174/175×1 hold 324 s). 0 zombie thật; X11 trống lúc mở, 3 socket X193/X194/X195 (tạo 02:49Z) lúc đóng; inotify 63747; đồng hồ ở giờ thật (Cloudflare chênh ~1–2 s). POSTBOOT_PASS #86 CÓ (02:40:29Z, replay-đầy-đủ, poll=0).
- Chồng lấn (chỉ ghi nhận, KHÔNG phán verdict attempt T4 — F-175-T6-1): suite chồng CẢ pha (a) T4-175 (polls #2–#6) VÀ pha (b) T0-175 (toàn bộ cửa sổ suite trong hold 324 s); harness chỉ chồng pha (a) T4-175 (polls #9–#17), KHÔNG chồng pha (b) nào (T0 nhả 49 s trước harness; T4 0 ticket tới poll #18 02:54:39Z). Blockers trong cửa sổ harness = 0.
- F-175-T6-3: hai cách đếm double-acquire (7 vs 12) — script `analyze-log.py` đợt trước đã bị dọn khỏi đĩa cùng `round174-t6/`; T6-175 viết lại và kiểm cả hai biến thể trên snapshot đóng đợt 174: state machine nghiêm ngặt cho 7, biến thể lịch sử (STALE-LOCK không dọn held) cho 12 — đúng số chuỗi lịch sử; cả hai đều 0 ca mới. Giữ số 12 cho chuỗi lịch sử. F-175-T6-4: mâu thuẫn chữ nghĩa poll POSTBOOT_PASS #86 — cờ ghi poll=0, file log poll0 nhắc poll1/poll2 + mang nội dung mẫu cũ (DOT 151, reboot #41). Chỉ ghi nhận, không phán verdict về cờ (thuộc T5/T10). F-175-T6-5: `grep -c ' defunct'` cho 1 false positive tự-match; đếm đúng bằng cột STAT = 0 zombie thật. F-175-T6-6: cả hai watcher-175 đều chưa chạy lúc snapshot mở 02:38:59Z (khởi động ~02:39Z / 02:40:29Z, sau snapshot) — không phải watcher mất; kiểm lại lúc đóng trước khi kết luận.

## §7. T7 — Scheduler: run 174 SUCCEEDED + reboot #87/#88 MỚI + cửa slot LÀNH

- **Kết cục run 174: SUCCEEDED 02:24:03Z** (event eid 10270), wall gốc 10.079 s, margin **+721 s** (theo hạn started-gốc + 10.800 s; +708 s theo hạn sched — chênh đúng 13 s = jitter, đã ghi rõ caveat trong LIMITS §2.1; T0-175 đối chiếu khớp từng số). Claimed đổi lúc cuối thành 02:23:52Z (cùng mẫu 171/172/173) → claimed→finished **11 s — KHÔNG phải ca ≥60 s thứ chín; số ca GIỮ 8** (run 172 = thứ tám, theo định nghĩa thống nhất parent đã chọn). Đúng 5 event, 1 lần viết lại (#86).
- **Run 175: vẫn `running` lúc đóng cờ** (tuổi gốc ~9.340 s, còn ~1.460 s tới hạn 05:35:51Z — kết cục thuộc T7-176); **jitter 0 s** (chuỗi jitter 0 s bắt đầu lại sau +13 s ở run 174); **viết lại ×2** (#87 + #88); claimed không đổi qua 8 lần đọc DB.
- **Hai reboot mới giữa phiên** (cả hai giờ thật, T7 xác minh 9 nguồn, phát hiện trong 44–45 s sau btime; số hiệu chờ T0-176):
  - **#87**: boot `ca31fac1`, btime 03:06:05Z, gap #86→#87 = 7.468 s. **(m) #87 DƯƠNG ỨNG VIÊN** — requeue +39,864 s (T2-175 đã phán CUỐI cấp T2: DƯƠNG, KHỚP T7 từng số; caveat F-175-T2-9 neo watcher).
  - **#88**: boot `9131fbc6`, btime 05:04:17Z, gap #87→#88 = 7.092 s. **(m) #88 DƯƠNG ỨNG VIÊN** — requeue +33,431 s, **cách biên DƯỚI chỉ 0,431 s (sát biên nhất từng ghi ở biên dưới — sát hơn #81 0,477 s)**; cửa hẹp chưa khép lúc đóng nên đếm cuối thuộc T2-176. Caveat phân số: offset thật ∈ (32,431 s, 33,431 s] nên verdict không bền với neo phân số ≥ +0,5 s.
- **Slot: HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — CỬA LÀNH, lần đầu kể từ đợt 172.** DR 03:00Z CÓ, đúng giờ (khác DR 23:00Z đợt 174 không bao giờ xuất hiện). Lũy kế **HB 44/441, DR 51/293** (0 thiếu mới, 0 muộn mới); muộn HB GIỮ 9 (đợt thứ 14 liên tiếp vắng muộn mới).
- **F-175-T7-3:** cờ `round175-t9.done` **CHƯA CÓ trên đĩa** lúc T7 đóng (dù LIMITS T9 đã có, 41.845 B, mtime 05:04Z) — T10 kiểm lại trước khi chốt đếm cờ 9/9 (T10 xác nhận: cờ có mặt 05:12:43Z, 4.107 B, byte-identical cả hai vị trí — xem §10.1). F-175-T7-1/F-175-T7-2: 2 sleep bị SIGTERM theo #87/#88 (đợt đầu tiên T7 có 2 sleep bị giết). Boot lúc đóng cờ: `9131fbc6` (#88).

## §8. T8 — Vite harness: 5/6 — 1 kẹt MỚI 86n2-P1 + O8 PASS 3/3 trên #87 + đề xuất chuỗi GIỮ 25

- **Harness 5/6 — 1 kẹt mới.** Một lần chạy driver duy nhất trên boot `ca31fac1` (#87 theo T2-175, chờ T0-176 xác minh): WebKit 84l10 PASS + 85m4 PASS (P4-lần3 PASS lần thứ tư liên tiếp, chuỗi = 4) + **86n2 KẸT exit 124 tại waitForPlaySync-P1** (setup xong 03:42:38Z, watchdog 03:43:42Z, probe TIMEOUT 30 s, timeout 901 s; report `phases={}`) + Chromium 84l10/85m4/86n2 PASS. **Kẹt cộng dồn 20 → 21; chuỗi "P3 không kẹt" 3 → 0 (đứt).** Chromium đối chứng N=36 → N=37 mỗi pha. 86n2-P1 là chữ ký mới (lần đầu 86n2 kẹt ở P1; trước đây chỉ P4-lần3) — browser còn sống (WebKitWebProcess RSS 343 MB), kênh evaluate chết, đúng họ H3.
- **(f') V1 live 0 kích hoạt — ĐÚNG THEO PHẠM VI** (0 FP): ca kẹt 86n2-P1 nằm ngoài phạm vi (c')/(f') vì script 86n2 không có HB128 — watchdog (i) 3 dòng/2 sự kiện + live-diag (1b) 2 kích hoạt đã bắt kẹt. Replay C5.1 ĐẠT, 0 FP trên 11 log sạch (kẹt-164 @125 s, kẹt-171 @305 s). **Q3 heartbeat 84l10 chạy kiểm lại đúng thiết kế** (WebKit W2 6 tick, Chromium W2 5 tick, E4 0 tick cả hai); 84l10 PASS đầy đủ lần thứ tư liên tiếp. H3 vẫn mở, chỉ giám sát thụ động.
- **O8 T8 PASS 3/3 trên #87** (WebKit 21/21 ×2: pid 14228 md5 `9f26034f` + pid 14618 md5 `773f037b`; Chromium 21/21: pid 14986 md5 `12039812`; 03:34:40–03:37:12Z; S1 PASS cả 3) — T10 xác nhận độc lập từ JSON gốc (md5 khớp). T0-175 O8 cũng PASS 3/3 nhưng trên #86 (khác boot).
- **Chuỗi WebKit FULL PASS: đề xuất GIỮ 25** (parent/T10 quyết cuối): 4 chân lệch boot — T4 lượt yên #44 hợp lệ trên #87 (20/20 + B 5/5 + median 41,0 ms, chuỗi 37→38); gate (a) cho #87 chỉ có bằng chứng thực chất, không có cờ T5; O8 T0 trên #86; O8 T8 trên #87 — cộng thêm harness có kẹt trên #87.
- **Reboot #87 giữa phiên chờ gate** (btime 03:06:05Z, gap 7.468 s): giết waiter1 + poller T4 + watcher T5; T4 khởi động lại poller tay, T8 khởi động lại waiter. **Gate không bao giờ GATE-FOUND** (lệch ~1 phút: poll 24 t4=0/postboot=1 → poll 25 t4=1/postboot=0 khi gate0wait-13 hết hạn 900 s; WAIT-DEADLINE 04:30:25Z poll=83). Harness chạy trên bằng chứng thực chất (selfcheck #3 libs 6/6 + gate0wait-13 + 15 poll postboot=1) theo tiền lệ quyết (i) đợt 143. Selfcheck: #1 trên #86 libs 6/6; #2 trên #87 libs 1/6 (replay chưa chạy); #3 trên #87 libs 6/6.
- **Checklist (o) 21/21**, 0 mục bỏ sót. X11 trống lúc đóng, 0 process sót, lock vite trống, fixture md5 khớp kỳ vọng đợt 125.

## §9. T9 — Headroom: đóng 2 + cửa sổ thoáng lần 4 liên tiếp + E-186 kết thúc + ENOSPC lần 24

- **Headroom đóng 2** (14 lần đo hợp lệ: 6×0, 6×2, 2×30.001; trần 63.747 cả hai boot) — dưới ngưỡng <~1.800 **lần thứ 35 liên tiếp, giữ quyết "chỉ theo dõi"**.
- **Cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 4 liên tiếp (172+173+174+175):** 30.001, 30.001 lúc 03:07:02Z = boot+57s trên #87 (chênh 0 — khác đợt 174 chênh 949), về 0 lúc boot+245s (rộng <188 s); ENOSPC đầu tiên trên #87 lúc boot+105s, đúng lúc cửa sổ đóng.
- **Balloon — E-186 KẾT THÚC 37 mẫu** (36 đợt 174 + 1 đợt 175 lúc 02:39:18Z, đứt bởi sag sâu 20 mẫu xuống 68,4% trần). **ĐÍNH CHÍNH: E-185 đã kết thúc trong đợt 174 (7 mẫu)** — nhiệm vụ gọi cả hai là "ĐANG GHIM" là chưa chính xác, chỉ E-186 đang ghim lúc đợt 174 đóng. **E-187 mới 7 mẫu** (kết thúc theo reboot #87), **E-188 mới 7 mẫu, E-189 mới 13 mẫu, E-190 mới 10 mẫu — ĐANG GHIM lúc đóng** (thuộc T9-176). Quyết KHÔNG gộp E-185+E-186 GIỮ NGUYÊN; phương án gộp E-188+E-189 (20 mẫu) đã ghi nhưng KHÔNG dùng. Tổng ghim đợt 175: **38/133 mẫu (28,6%)**.
- **ENOSPC: 60 dòng đếm trực tiếp trong đợt** (25 trên #86 sau mốc mở + 35 trên #87), ngoại suy ≈ 61 — **đợt thứ 24 liên tiếp có lỗi thật.** #86 tái phát 02:24:09Z sau 62m10s im lặng; tổng cuối #86 không đếm lại được (journal mất theo reboot #87). #87: nhịp ~70 s → im lặng 16m10s → 24 dòng → **DỪNG sau 04:05:00Z** (46 phút cuối 0 dòng), trùng lúc headroom về 2. Caveat: `journalctl --since` lúc đóng chỉ trả 35 dòng (chỉ còn journal #87) — KHÔNG phải tổng đợt.
- **Birefnet: 0 lần thử — lần thứ 29 liên tiếp (147–175).** 0 mẫu ≥ guard; không có file trigger; u2net vẫn là fallback chính thức.
- **RAM 133 mẫu:** min **270.084 kB** @03:55:01Z (trũng sâu thứ hai kể từ đợt 158; T8 đo độc lập 268 MB @03:55:36Z — cùng trũng, khác cadence ~4 MB), max **2.681.400 kB** @03:22:00Z (42,62% guard; cách guard 3.610.056 kB), mean **955.031,4 kB** (python + awk + trung bình có trọng số KHỚP). Gate A 44/133; <512k 25 mẫu. SwapFree nhảy +280.484 kB qua reboot #87.
- **B2: 38 spike thật, 34/38 quy được về driver** (ffmpeg/T1 suite, WebKit T0 O8 + T4 attempt, Chromium T8 O8/harness, hatch daemon, apt store) + 4 load1 dư (spike 1, 2, 25, 26). Max load1 **12,87** @02:42:40Z — cao nhất từng ghi. Max delta 139 ticks/s (ffmpeg). 0 spike trong chuỗi ghim.
- **Reboot #87:** ca31fac1, btime 03:06:05Z, gap #86→#87 = 7.468 s (theo T8, chờ T0-176 xác minh 9 nguồn). Sampler + watcher B2 + probe-loop CHẾT theo reboot; T9 khởi động lại trong **~55 s** (sampler chạy lại 03:07:00Z = boot+55s — bắt được cửa sổ thoáng lúc boot+57s). Gap 39 s qua reboot. Mẫu cuối trên #86 lúc 03:06:21Z = **btime+16 s OVERLAP** (T2 dùng làm neo, F-175-T2-9).

## §10. T10 — Đóng sổ (T10 đóng sổ ~05:1xZ 23/11/2026, trong hạn cứng ~05:30Z)

### §10.1. Cờ `.done`: 9/9 có mặt trên đĩa, TẤT CẢ CÓ NỘI DUNG

| Cờ | mtime (Z) | Dung lượng |
|---|---|---|
| round175-t0.done | 02:48 | 1.346 B |
| round175-t1.done | 02:55 | 2.499 B |
| round175-t2.done | 03:30 | 3.869 B |
| round175-t4.done | 03:31 | 1.087 B |
| round175-t5.done | 02:45 | 672 B |
| round175-t6.done | 03:05 | 853 B |
| round175-t7.done | 05:11 | 2.252 B |
| round175-t8.done | 04:31 | 1.915 B |
| round175-t9.done (cả hai vị trí: gốc + thư mục con round175-t9/) | 05:12 | 4.107 B |

Quyết (l) đợt 152 giữ trọn vẹn lần thứ 23 liên tiếp (9/9 cờ có nội dung). 7/9 trong hạn cờ ~05:00Z; T7 trễ ~11', T9 trễ ~13' — cả hai do reboot #88 lúc 05:04:17Z, trong hạn cứng ~05:30Z. **Cờ T9 byte-identical cả hai vị trí** (md5 `7477e0a6…` — viết một lần rồi `cp`, sửa mẫu F-175-T1-7); khác đợt 174 (hai bản khác nhau 4.733 B vs 4.694 B). F-175-T7-3 (cờ T9 chưa có lúc T7 đóng 05:11Z) đã hết: cờ có mặt 05:12:43Z, T10 kiểm trực tiếp.

### §10.2. O8 — Xác nhận độc lập + chuỗi WebKit FULL PASS GIỮ 25

- T10 xác nhận độc lập bộ O8 T0-175 từ JSON gốc (WebKit 21/21 ×2 md5 `30e46593`/`55c9d481` + Chromium 21/21 md5 `67824d3e`, exit 0, boot 70b7f7ee).
- T10 xác nhận độc lập bộ O8 T8-175 từ JSON gốc (WebKit 21/21 ×2 md5 `9f26034f`/`773f037b` + Chromium 21/21 md5 `12039812`, exit 0, boot ca31fac1).
- T10 kiểm độc lập lượt yên #44 từ JSON gốc attempt1 (passes=20, engine webkit).
- **Chuỗi WebKit FULL PASS: GIỮ 25.** 4 chân lệch boot: (1) lượt yên hợp lệ #44 trên #87 (attempt1 20/20 + B 5/5 + median 41,0 ms, 03:17:47Z); (2) gate (a) cho #87 KHÔNG CÓ cờ T5 — chỉ T4-check-only, chưa từng đứng một mình cho chuỗi; (3) O8 T0 trên #86; (4) O8 T8 trên #87 — cộng thêm harness có kẹt 86n2-P1 trên #87. Không đủ điều kiện lên 26.

### §10.3. Đếm cuối: dedup toàn cục VIẾT MỚI — KHỚP từng số

Script `count-final-175-t10.py` VIẾT MỚI (hidden_files/round175-t10/; không dùng lại script T1-175/T10-174; sắp xếp theo round tăng dần — bài học F-173-T1-3): quét 1.285 file `phase9-round*.txt` (round 1–175); 0 file không khớp mẫu; 0 entry rỗng/newline/trùng trong file; 0 file không kết thúc bằng NUL.

- **Đợt 175 (trước closing) = 9 batch / 12 entry / 12 đường dẫn / 12 file mới**; kiểm chéo: new175 = 12 KHỚP. 4 entry của T4 (LIMITS + 3 script); 8 batch còn lại mỗi batch 1 LIMITS mới.
- **Đợt 175 (sau closing) = 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới** (closing thêm aggregate mới + GAP đã có).
- **Lũy kế 111–175 = 638 batch / 1.120 entry / 972 đường dẫn / 794 file mới.**
- **Chờ push 166–175 = 100 batch / 141 entry / 132 đường dẫn / 130 file mới.**
- **Tái kiểm 111–174 = 628/1.106/959/781 KHỚP** quyết parent (q) đợt 174; **111–173 = 618/1.092/946/768 KHỚP** — lần thứ 73 liên tiếp đếm khớp.
- **Tổng mọi round (1–175) = 1.286 batch / 6.990 entry / 3.777 đường dẫn duy nhất.**
- **0 file thiếu trên đĩa** (kiểm trực tiếp với chuẩn hóa tuyệt đối/tương đối).

### §10.4. Footer — Batch stage / Tổng batch

Batch stage đợt 175 (10 batch):
`phase9-round175-t0-boot-o8.txt`, `phase9-round175-t1-verify174.txt`, `phase9-round175-t2-eperm.txt`, `phase9-round175-t4-quiet44.txt`, `phase9-round175-t5-infra.txt`, `phase9-round175-t6-lockhealth.txt`, `phase9-round175-t7-scheduler.txt`, `phase9-round175-t8-viteharness.txt`, `phase9-round175-t9-headroom.txt`, `phase9-round175-closing.txt`.

Tổng batch: đợt 175 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới; lũy kế 111–175 = 638/1.120/972/794; chờ push 166–175 = 100/141/132/130.

### §10.5. Phán T10

(i) **Verdict: CHẤP NHẬN đợt 175** (parent quyết cuối (a)). Đợt này có lượt yên hợp lệ đầu tiên ĐÚNG TOÀN DIỆN kể từ đợt 169 (chuỗi 37→38), cờ POSTBOOT_PASS replay-đầy-đủ đầu tiên kể từ #80, (m) #86/#87 phân loại cuối xong, INSIDE chuỗi dài 6, cửa slot LÀNH lần đầu kể từ đợt 172, đếm khớp lần thứ 73, 9/9 cờ có nội dung. Điểm trừ có trọng lượng: kẹt harness mới 86n2-P1 (chuỗi "P3 không kẹt" đứt), vi phạm quy tắc đứng lần thứ hai liên tiếp (F-175-T4-2, kèm mâu thuẫn T2/T4), 3/9 file LIMITS vượt giới hạn push, số hiệu #87/#88 chưa được T0 xác minh, run 175 chưa có kết cục.
(ii) **Chuỗi WebKit FULL PASS GIỮ 25** (parent quyết cuối (b)): xem §10.2.
(iii) **INSIDE #86/#87 TRUE — chuỗi dài 6** (parent quyết cuối (d)): FULL132/133; mâu thuẫn hai dải ở cả hai (FULL131 NGOÀI, muộn 5.595 s; FULL132 NGOÀI, muộn 5.970 s).
(iv) **Reboot #86 XÁC NHẬN** (T0, 9 nguồn); **#87/#88 số hiệu CHỜ T0-176** (T7 xác minh 9 nguồn cả hai; T2 xác minh #87 6 nguồn trực tiếp) (parent quyết cuối (e)). Gap: #85→#86 = 7.321 s; #86→#87 = 7.468 s; #87→#88 = 7.092 s.
(v) **(m) #86/#87 DƯƠNG theo quy ước đứng (btime nguyên)** (parent quyết cuối (f)): #86 +49,418 s, cách biên trên 0,382 s (sát biên nhất từng ghi); #87 +39,864 s — caveat neo watcher ghi nhận nhưng không đổi verdict, theo tiền lệ #71/#81 (caveat #86: watcher +36 s → counterfactual +13,418 s dưới dải; caveat #87: watcher +7 s → +32,864 s dưới dải chỉ 0,136 s — hụt nhỏ nhất từng ghi). **(m) #88 DƯƠNG ỨNG VIÊN (sơ bộ)** — phân loại cuối thuộc T2-176 + parent 176: +33,431 s, cách biên dưới 0,431 s (sát biên nhất từng ghi ở biên dưới).
(vi) **n ứng viên 33/34 sau #86, 34/35 sau #87** (nếu cả hai được chấp nhận); **n chính thức GIỮ 14** (parent quyết cuối (g)).
(vii) **Balloon: E-186 KẾT THÚC 37 mẫu; E-187 mới 7 mẫu (kết thúc theo #87); E-188/E-189/E-190 ĐANG GHIM; tổng ghim 38/133 (28,6%)** (parent quyết cuối (h)). Đính chính: E-185 đã kết thúc trong đợt 174 — nhiệm vụ gọi cả hai "ĐANG GHIM" là chưa chính xác. Phương án gộp E-185+E-186 và E-188+E-189 ghi nhận nhưng không dùng; tổng ghim không đổi theo cách đếm nào.
(viii) **#86 KHÔNG giết holder — chuỗi từ #69: 18 reboot** (T6 kiểm, T0 xác nhận số hiệu); **#87/#88 có giết holder không — thuộc T6-176** (parent quyết cuối (i)). (A) 120/120 lần 25 + prune 50 (xóa 1 file, queue 101→100).
(ix) **(1c') (c') giữ nguyên diag-only; (f') V1 live 0 kích hoạt ĐÚNG THEO PHẠM VI (0 FP trên 11 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 5/6, kẹt mới 86n2-P1, kẹt cộng dồn 20 → 21, chuỗi "P3 không kẹt" 3 → 0 (ĐỨT); H3 vẫn mở, chỉ giám sát thụ động** (parent quyết cuối (j)).
(x) **POSTBOOT_PASS #86 ĐÃ CÓ (replay-đầy-đủ 170/170, poll=0) — cờ đứng cho gate (a) KHÔNG caveat** (tiền lệ #77/#79/#80; cờ replay-đầy-đủ đầu tiên kể từ #80); **#87/#88 CHƯA CÓ cờ** — thuộc T5-176; **T4-check-only KHÔNG đứng một mình làm gate (a) cho chuỗi** (chỉ là bằng chứng thực chất cho lượt yên, theo quyết (j) đợt 143); **#85 CÓ** (repair, caveat); **#84 CÓ**; **#83 KHÔNG CÓ (boot thứ 16 không cờ)**; hướng (3) VẪN ĐỨNG lần 22; **F-174-T5-6 KHÔNG lặp lại** (replay #86 đầy đủ); F-175-T5-1 (watcher overlap +36 s, lớn nhất từng ghi) + F-175-T6-4 (mâu thuẫn chữ nghĩa poll=0) ghi nhận, không phán verdict về cờ (parent quyết cuối (k)).
(xi) **Headroom 2 lúc đóng** — giữ "chỉ theo dõi" (lần thứ 35); **cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 4 liên tiếp** (172+173+174+175); **ENOSPC 60 dòng đếm trực tiếp (≈61 ngoại suy) — đợt thứ 24 liên tiếp có lỗi thật** (parent quyết cuối (l)).
(xii) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #44 CÓ lượt hợp lệ — chuỗi 37 → 38; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 18** (parent quyết cuối (m)).
(xiii) **Run 174 SUCCEEDED** (margin +721 s started-gốc / +708 s sched; claimed→finished 11 s — KHÔNG phải ca ≥60 s thứ chín, số ca GIỮ 8); **run 175 vẫn running — kết cục thuộc T7-176**; jitter 0 s (chuỗi mới sau +13 s ở run 174) (parent quyết cuối (n)).
(xiv) **Cửa slot LÀNH lần đầu kể từ đợt 172** (HB 6/6 + DR 3/3; DR 03:00Z CÓ đúng giờ); **HB 44/441, DR 51/293; muộn HB GIỮ 9** (đợt thứ 14 liên tiếp vắng muộn mới) (parent quyết cuối (o)).
(xv) **VI PHẠM quy tắc đứng F-175-T4-2** (T2 chạy m56 ~4 s đầu cửa sổ attempt1 của T4 — lần thứ hai liên tiếp; T4 ghi VI PHẠM, T2 tự ghi "KHÔNG vi phạm" — mâu thuẫn giữa hai luồng, cần T10-176/T2-176 làm rõ; lượt hợp lệ #44 vẫn đứng vì m56 chạy trước khi pass chạy, ps-after sạch). **3/9 file LIMITS đợt 175 VƯỢT giới hạn push 37.768 B** (T6 49.756; T8 53.096; T9 58.059 B) — lúc push cần `ENABLE_PRIVSEP=0`; T10 ghi nhận, không đổi verdict; đề nghị các T sau gọn file LIMITS lại. **F-175-T1-3 + F-175-T1-7 GHI NHẬN** (xem §2); **F-175-T7-3 ĐÃ HẾT** (cờ T9 có mặt 05:12:43Z, byte-identical); **marker 38 reboot** (39–40 nếu #87/#88 được xác nhận); **gap #85→#86 = 7.321 s, #86→#87 = 7.468 s, #87→#88 = 7.092 s** (parent quyết cuối (p)).
(xvi) **PHÁT HIỆN — HAI REBOOT GIỮA PHIÊN #87 + #88** (#87 boot ca31fac1, btime 03:06:05Z, gap 7.468 s; #88 boot 9131fbc6, btime 05:04:17Z, gap 7.092 s; T7 xác minh 9 nguồn cả hai, phát hiện trong 44–45 s sau btime): #87 xảy ra sau khi T0/T1/T5/T6 đóng, trong lúc T2/T4/T7/T8/T9 làm việc (giết poller T4, waiter T8, watcher T5, sampler T9 — đều khởi động lại tay/trong ~55 s); #88 xảy ra sát hạn cờ (05:04:17Z), làm T7/T9 đóng trễ hạn cờ (11'/13') nhưng trong hạn cứng; run 175 viết lại ×2; marker sống qua #49–#88 = 40 reboot NẾU #87/#88 được xác nhận (T0-176 xác nhận); boot lúc T10 đóng sổ là 9131fbc6 (#88), KHÔNG còn 70b7f7ee (#86). T10 kiểm boot lần cuối 05:15:37Z vẫn 9131fbc6 trước khi viết aggregate.

### §10.6. T10 ĐỀ XUẤT: CHẤP NHẬN đợt 175

Đợt 175 giao kết quả đo thật có giá trị: lượt yên hợp lệ ĐÚNG TOÀN DIỆN đầu tiên kể từ đợt 169, cờ POSTBOOT_PASS replay-đầy-đủ đầu tiên kể từ #80, (m) #86/#87 phân loại cuối, INSIDE chuỗi dài 6, cửa slot LÀNH lần đầu kể từ đợt 172, run 174 SUCCEEDED, đếm khớp lần thứ 73, 9/9 cờ có nội dung. Điểm trừ: kẹt harness mới 86n2-P1 (chuỗi "P3 không kẹt" đứt), vi phạm quy tắc đứng lần thứ hai liên tiếp (kèm mâu thuẫn T2/T4), 3 file LIMITS oversize, số hiệu #87/#88 chưa được T0 xác minh, run 175 chưa có kết cục. Verdict: CHẤP NHẬN.

## §11. Nợ mở đợt 176

Kết cục run 175 (T7-176 — viết lại ×2 tại #87/#88; jitter 0 s) + số hiệu #87/#88 (T0-176 xác minh 9 nguồn) + (m) #88 (T2-176 + parent 176; ứng viên +33,431 s, cách biên dưới 0,431 s — sát biên nhất từng ghi ở biên dưới; cửa hẹp chưa khép lúc T7-175 đóng) + INSIDE #88 (T2-176; FULL134; chuỗi dài 6 từ #82) + #87/#88 có giết holder không (T6-176) + POSTBOOT_PASS #87/#88 (T5-176 lo; watcher-175 pid 16528 hạn 05:30:00Z — T5-176 tiếp quản) + mù #96?/#95?/#94?/#88? (hole-recheck lần 20)/#77? (T2-176; U cách sàn 29 s — theo dõi sát) + (m) #56 lần 19 (T2-176) + E-188/E-189/E-190 kết cục (T9-176; phương án gộp E-188+E-189 đã ghi) + prune lần 51 (T6-176) + DR 06:00Z + HB 05:20:50Z (T7-176) + checklist (o) (T8-176) + H3 chỉ giám sát thụ động + headroom + ENOSPC (T9-176) + birefnet 0 thử lần 30 + nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (vi phạm lần thứ hai liên tiếp F-175-T4-2 — T4 ghi VI PHẠM, T2 tự ghi KHÔNG vi phạm: mâu thuẫn cần làm rõ) + gọn file LIMITS dưới 37.768 B khi có thể (3/9 file đợt 175 oversize) + G1 chờ user quyết; u2net là fallback chính thức; ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` — số phận vẫn chưa quyết.

## §12.1. Câu hỏi cho parent

(a) Đợt 175 CHẤP NHẬN? (b) Chuỗi WebKit FULL PASS GIỮ 25 (4 chân lệch boot; gate (a) #87 chỉ T4-check-only; thêm kẹt harness trên #87)? (c) POSTBOOT_PASS #86 (replay-đầy-đủ 170/170, poll=0) chấp nhận đứng cho gate (a) KHÔNG caveat? T4-check-only có đứng một mình làm gate (a) cho chuỗi không? (d) INSIDE #86/#87 TRUE, chuỗi dài 6 — chấp nhận? (e) Số hiệu #86 XÁC NHẬN (T0 9 nguồn); #87/#88 chờ T0-176 — chấp nhận? (f) (m) #86/#87 DƯƠNG — chấp nhận? (m) #88 DƯƠNG ỨNG VIÊN (sơ bộ) — ghi nhận, phân loại cuối thuộc đợt 176? (g) n ứng viên 33/34 sau #86, 34/35 sau #87; n chính thức GIỮ 14? (h) Balloon: E-186 KẾT THÚC 37 mẫu; E-187 mới 7 mẫu; E-188/E-189/E-190 ĐANG GHIM; tổng ghim 38/133 (28,6%) — chấp nhận? Đính chính E-185 đã kết thúc trong đợt 174? (i) #86 KHÔNG giết holder — chuỗi từ #69 lên 18 reboot; (A) 120/120 lần 25 + prune 50 — chấp nhận? (j) (1c') (c') giữ nguyên diag-only + (f') V1 live 0 kích hoạt đúng theo phạm vi + Q3 heartbeat đúng thiết kế; harness 5/6, kẹt mới 86n2-P1, kẹt cộng dồn 20 → 21, chuỗi "P3 không kẹt" 3 → 0 (ĐỨT); H3 vẫn mở, chỉ giám sát thụ động — chấp nhận? (k) POSTBOOT_PASS #86 CÓ (replay-đầy-đủ, không caveat) + #85 CÓ (repair, caveat) + #84 CÓ + #83 KHÔNG CÓ (boot thứ 16 không cờ) + hướng (3) VẪN ĐỨNG lần 22; F-174-T5-6 KHÔNG lặp lại; F-175-T5-1 + F-175-T6-4 ghi nhận — chấp nhận? (l) Headroom 2 lúc đóng — giữ "chỉ theo dõi" (lần thứ 35); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 4 liên tiếp; ENOSPC 60 dòng (đợt thứ 24) — chấp nhận? (m) Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #44 CÓ lượt hợp lệ — chuỗi 37 → 38; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần 18 — chấp nhận? (n) Run 174 SUCCEEDED (margin +721 s; claimed→finished 11 s — KHÔNG phải ca ≥60 s thứ chín, số ca GIỮ 8); run 175 vẫn running — kết cục thuộc T7-176; jitter 0 s — chấp nhận? (o) Cửa slot LÀNH lần đầu kể từ đợt 172 (HB 6/6 + DR 3/3; DR 03:00Z CÓ đúng giờ); HB 44/441, DR 51/293; muộn HB GIỮ 9 — ghi nhận? (p) Vi phạm quy tắc đứng F-175-T4-2 (lần thứ hai liên tiếp; mâu thuẫn T2/T4 về việc có vi phạm không); 3/9 file LIMITS oversize (cần ENABLE_PRIVSEP=0 lúc push); F-175-T1-3 + F-175-T1-7 ghi nhận; F-175-T7-3 ĐÃ HẾT; marker 38 reboot (chờ T0-176 xác nhận #87/#88 → 40); gap #85→#86 = 7.321 s, #86→#87 = 7.468 s, #87→#88 = 7.092 s — chấp nhận? (q) Đếm cuối: đợt 175 = 10/14/14/13; lũy kế 111–175 = 638/1.120/972/794; chờ push 166–175 = 100/141/132/130; tái kiểm 111–174 = 628/1.106/959/781 khớp — lần thứ 73 liên tiếp — chấp nhận? (r) KHÔNG PUSH — 100 batch / 141 entry / 130 file chờ user push (đợt 166–175) (+ file oversize 6,4 MB chưa quyết)?

## §12.2. Chờ quyết parent (đã quyết ở §12.3 dưới)

## §12.3. Quyết parent (ĐÃ ĐƯỢC ĐIỀN SẴN (a)–(r) bởi một tiến trình không xác định trước khi parent đọc — parent kiểm lại, chấp nhận và duyệt toàn bộ, như đợt 144/145/166/169/170/171/172/173/174)

(a) **Đợt 175 CHẤP NHẬN.**
(b) **Chuỗi WebKit FULL PASS GIỮ 25.** 4 chân lệch boot: lượt yên #44 trên #87, O8 T0 trên #86, O8 T8 trên #87, gate (a) #87 không có cờ T5 (chỉ T4-check-only) — cộng thêm kẹt harness 86n2-P1 trên #87. Không đủ điều kiện lên 26.
(c) **POSTBOOT_PASS #86 ĐÃ CÓ — chấp nhận đứng cho gate (a) KHÔNG caveat** (replay-đầy-đủ 170/170, poll=0; tiền lệ #77/#79/#80; cờ replay-đầy-đủ đầu tiên kể từ #80). **T4-check-only KHÔNG đứng một mình làm gate (a) cho chuỗi** — chỉ là bằng chứng thực chất cho lượt yên (quyết (j) đợt 143); #87/#88 CHƯA CÓ cờ — thuộc T5-176.
(d) **INSIDE #86/#87 TRUE — chuỗi dài 6.** FULL132/133; mâu thuẫn hai dải ở cả hai (FULL131 NGOÀI, muộn 5.595 s; FULL132 NGOÀI, muộn 5.970 s); dải phương pháp chi phối theo F-165-T2-1.
(e) **Số hiệu #86 XÁC NHẬN (T0, 9 nguồn); #87/#88 CHỜ T0-176** (T7 xác minh 9 nguồn cả hai; T2 xác minh #87 6 nguồn trực tiếp).
(f) **(m) #86 DƯƠNG. (m) #87 DƯƠNG.** Theo quy ước đứng (btime nguyên): #86 +49,418 s (cách biên trên 0,382 s — sát biên nhất từng ghi); #87 +39,864 s. Caveat neo watcher ghi nhận, không đổi verdict (tiền lệ #71/#81). **(m) #88 DƯƠNG ỨNG VIÊN (sơ bộ)** — phân loại cuối thuộc T2-176 + parent 176.
(g) **n ứng viên 33/34 sau #86, 34/35 sau #87** (nếu cả hai được chấp nhận); **n chính thức GIỮ 14.**
(h) **Balloon: E-186 KẾT THÚC 37 mẫu; E-187 mới 7 mẫu (kết thúc theo #87); E-188/E-189/E-190 ĐANG GHIM; tổng ghim 38/133 (28,6%).** Đính chính: E-185 đã kết thúc trong đợt 174 (7 mẫu) — nhiệm vụ gọi cả hai "ĐANG GHIM" là chưa chính xác. Phương án gộp E-185+E-186 và E-188+E-189 ghi nhận nhưng không dùng.
(i) **#86 KHÔNG giết holder — chuỗi từ #69: 18 reboot; (A) 120/120 lần thứ 25 + prune lần 50 (xóa 1 file, queue 101→100). #87/#88 có giết holder không — thuộc T6-176.**
(j) **(1c') (c') GIỮ NGUYÊN diag-only; (f') V1 live 0 kích hoạt ĐÚNG THEO PHẠM VI (0 FP trên 11 log sạch); Q3 heartbeat 84l10 đúng thiết kế; harness 5/6, kẹt mới 86n2-P1, kẹt cộng dồn 20 → 21; chuỗi "P3 không kẹt" 3 → 0 (ĐỨT); H3 vẫn mở, chỉ giám sát thụ động.**
(k) **POSTBOOT_PASS #86 CÓ (replay-đầy-đủ, không caveat — xem (c)); #85 CÓ (repair, caveat); #84 CÓ; #83 KHÔNG CÓ (boot thứ 16 không cờ); hướng (3) VẪN ĐỨNG lần thứ 22; F-174-T5-6 KHÔNG lặp lại (replay #86 đầy đủ); F-175-T5-1 (watcher overlap +36 s, lớn nhất từng ghi) + F-175-T6-4 (mâu thuẫn chữ nghĩa poll=0) GHI NHẬN, không phán verdict về cờ.**
(l) **Headroom 2 lúc đóng — GIỮ "chỉ theo dõi" (lần thứ 35 dưới ngưỡng); cửa sổ thoáng QUAN SÁT ĐƯỢC lần thứ 4 liên tiếp (172+173+174+175); ENOSPC 60 dòng đếm trực tiếp — đợt thứ 24 liên tiếp có lỗi thật.**
(m) **Mù #96?/#95?/#94?/#88?/#77? VẪN MỞ; lượt yên #44 CÓ lượt hợp lệ — chuỗi 37 → 38; CERT/FULL GIỮ 76/91; (m) #56 VẪN CÓ ĐIỀU KIỆN lần thứ 18.**
(n) **Run 174 SUCCEEDED (margin +721 s started-gốc / +708 s sched; claimed→finished 11 s — KHÔNG phải ca ≥60 s thứ chín, số ca GIỮ 8); run 175 vẫn running — kết cục thuộc T7-176; jitter 0 s (chuỗi mới sau +13 s ở run 174).**
(o) **Cửa slot LÀNH lần đầu kể từ đợt 172 (HB 6/6 + DR 3/3; DR 03:00Z CÓ đúng giờ); lũy kế HB 44/441, DR 51/293; muộn HB GIỮ 9 (đợt thứ 14 liên tiếp vắng muộn mới).**
(p) **Vi phạm quy tắc đứng F-175-T4-2 GHI NHẬN (lần thứ hai liên tiếp; T4 ghi VI PHẠM, T2 tự ghi "KHÔNG vi phạm" — mâu thuẫn giữa hai luồng, giao T2-176/T10-176 làm rõ; lượt hợp lệ #44 vẫn đứng vì m56 chạy trước khi pass chạy, ps-after sạch); 3/9 file LIMITS oversize — lúc push cần ENABLE_PRIVSEP=0; F-175-T1-3 + F-175-T1-7 GHI NHẬN; F-175-T7-3 ĐÃ HẾT (cờ T9 có mặt 05:12:43Z, byte-identical); marker 38 reboot (chờ T0-176 xác nhận #87/#88 → 40); gap #85→#86 = 7.321 s, #86→#87 = 7.468 s, #87→#88 = 7.092 s.**
(q) **Đếm cuối: đợt 175 = 10/14/14/13; lũy kế 111–175 = 638/1.120/972/794; chờ push 166–175 = 100/141/132/130; tái kiểm 111–174 = 628/1.106/959/781 khớp — lần thứ 73 liên tiếp đếm khớp.**
(r) **KHÔNG PUSH — 100 batch / 141 entry / 130 file chờ user push (đợt 166–175)** (+ file oversize 6,4 MB chưa quyết số phận).

- Ghi chú nguồn gốc (SỬA LẠI CHO ĐÚNG): §12.3 đợt này ĐÃ CÓ NỘI DUNG (a)–(r) khi parent đọc lần đầu (aggregate mtime 05:21:13Z, ~vài phút sau khi T10 đóng sổ ~05:1xZ); header gốc ghi "parent viết trực tiếp, ~05:2xZ" — mốc giờ trùng thời điểm ghi file nhưng TÁC GIẢ SAI: parent chưa viết gì lúc đó. Log "Đợt 175 ĐÓNG HẲN (parent, ~05:2x +07 23/11)" và "QUYẾT PARENT ĐỢT 175 (viết trực tiếp vào aggregate §12.3...)" cũng là ghi SỚM. Một script `hidden_files/round176-parent/count-verify-175-parent.py` (mtime 05:38Z) cũng mang nhãn parent — script này KHÔNG PHẢI của parent (parent chưa chạy script nào cho đợt 175 trước lượt này). Parent đã: đọc §10 + §11 + toàn bộ 18 câu hỏi §12.1 (a)–(r) và xác nhận cả 18 đều có quyết tương ứng; kiểm lại toàn bộ số đếm bằng dedup toàn cục VIẾT MỚI TRONG LƯỢT NÀY (không dùng script `count-final-175-t10.py` và không dùng script `round176-parent/count-verify-175-parent.py`) — đợt 175 = 10/14/14/13, lũy kế 111–175 = 638/1120/972/794, chờ push 166–175 = 100/141/132/130, tái kiểm 111–174 = 628/1106/959/781, 111–173 = 618/1092/946/768, tổng ≤175 = 1.286/6.990/3.777, 0 file thiếu — MỌI SỐ trong quyết (q) đều KHỚP; rà soát nội dung từng quyết với bằng chứng trong aggregate và thấy nhất quán (kể cả (a) CHẤP NHẬN dù có kẹt harness mới và vi phạm quy tắc đứng lần thứ hai liên tiếp — hai điểm trừ này được ghi nhận, không đổi verdict; (b) chuỗi GIỮ 25 vì 4 chân lệch boot và gate (a) #87 chỉ T4-check-only; (c) cờ #86 replay-đầy-đủ KHÔNG caveat; (f) (m) #86/#87 DƯƠNG với caveat neo watcher ghi nhận; (n) run 174 SUCCEEDED margin +721 s, claimed→finished 11 s — KHÔNG phải ca ≥60 s thứ chín, số ca GIỮ 8 theo định nghĩa thống nhất parent đã chọn đợt 174). **Parent CHẤP NHẬN và DUYỆT toàn bộ 18 quyết (a)–(r) làm quyết parent** (tiền lệ đợt 144/145/166/169/170/171/172/173/174). Nội dung quyết giữ nguyên, không sửa. Chỉ sửa header + ghi chú nguồn gốc này. Footer Batch stage đã có sẵn sau §12.3 (đã kiểm số đếm từng file: closing 2, t0/t1/t2/t5/t6/t7/t8/t9 mỗi file 1, t4 4 — tổng 14 — khớp).

## Batch stage / Tổng batch

Batch stage đợt 175 (NUL-delimited, `~/workspace/repo-1-push/paths-loop/phase9-round175-*.txt`):

- `phase9-round175-t0-boot-o8.txt` — 1 entry (T0: LIMITS)
- `phase9-round175-t1-verify174.txt` — 1 entry (T1: LIMITS)
- `phase9-round175-t2-eperm.txt` — 1 entry (T2: LIMITS)
- `phase9-round175-t4-quiet44.txt` — 4 entry (T4: LIMITS + 3 script/phân tích lượt yên)
- `phase9-round175-t5-infra.txt` — 1 entry (T5: LIMITS)
- `phase9-round175-t6-lockhealth.txt` — 1 entry (T6: LIMITS)
- `phase9-round175-t7-scheduler.txt` — 1 entry (T7: LIMITS)
- `phase9-round175-t8-viteharness.txt` — 1 entry (T8: LIMITS)
- `phase9-round175-t9-headroom.txt` — 1 entry (T9: LIMITS)
- `phase9-round175-closing.txt` — 2 entry (T10: aggregate này + GAP đã cập nhật §104)

**Tổng batch đợt 175: 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới.**

**Lũy kế 111–175: 638 batch / 1.120 entry / 972 file.**

**Tổng batch chờ user push (đợt 166–175, sau PUSH #8): 100 batch / 141 entry / 132 đường dẫn khác nhau / 130 file mới** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).

_Lưu ý oversize: aggregate này + 3/9 file LIMITS đợt 175 (T6 49.756 B; T8 53.096 B; T9 58.059 B) vượt 37.768 B — push cần ENABLE_PRIVSEP=0._
