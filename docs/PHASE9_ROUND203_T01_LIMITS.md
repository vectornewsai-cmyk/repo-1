# PHASE 9 — ĐỢT 203: T01 — Boot survey #135 + O8 + GAP §131 (luồng NỀN gộp T0+T1)

Đợt 203 mở lượt cron 06:35:51 +07 28/11/2026 (= 23:35:51Z 27/11, run 213, id 5bebdace). **T01 đóng cờ ~00:03Z 28/11, trong hạn cờ ~02:00Z — 2/12 cờ lúc T01 đóng** (T5 .done 00:00:34Z + T01; T7 LIMITS đã có trên đĩa 21.046 B lúc 00:00:08Z nhưng chưa có .done). **KHÔNG PUSH.**

## §1. Boot mới — #135 ứng viên, XÁC NHẬN 9 nguồn TƯƠI

- **#135 `8ea1f5e3-ee03-4e83-ac26-9be9be446566`, btime 23:06:56Z (epoch 1795820816) — ỨNG VIÊN** (survey 9 nguồn tươi 23:50:50Z + 23:52:35Z: boot_id khớp; `uptime -s` 23:06:56Z; /proc/stat btime 1795820816; boot_est = btime −0,22 s (uptime 2.634,22 s lúc 23:50:50Z) và btime +0,15 s (uptime 2.738,85 s lúc 23:52:35Z) — hai lần đọc độc lập; /proc/1 start_ticks 1376 = btime +13,76 s, stat mtime 23:07:10.132Z = btime +14,13 s; journal idx 0 duy nhất, first 23:07:10Z = btime +14 s; wtmp begins 23:07:10Z; `last` reboot 23:07 still running; `who -b` Nov 27 23:07; Cloudflare đo chặt: local mid 23:52:35Z vs CF-Date 23:52:36 GMT, chênh +1 s — đồng hồ local chậm ~1 s (các đợt trước +2 s); marker mtime không đổi). Uptime lúc survey **43m54,22s / 45m38,85s**. Gap **#134→#135 = 7.301 s (2h01m41s)**. Marker **85 — ĐÃ XÁC MINH ở (e)-202** (239 B, mtime 2026-11-20 11:39:47.272154981Z không đổi, md5 cb7102c0cd6ea296759d9a5293159492); **86 nếu #135 xác nhận — parent quyết (e)-203; T01-203 KHÔNG tự nâng marker**.
- **#132/#133/#134 ĐÃ XÁC NHẬN ở (e)-202** (không cần xác minh lại bằng 9 nguồn tươi — journal/wtmp/dpkg chỉ còn boot hiện tại #135; tồn tại của chúng không còn tranh cãi). Gap #132→#133 = 12.527 s (3h28m47s); #133→#134 = 1.988 s (33m08s).
- **KHÔNG có reboot mới hơn #135 lúc T01 đóng** (boot_id vẫn 8ea1f5e3 lúc 00:02Z; journal idx 0 duy nhất).
- **Watcher-203 ĐÃ SPAWN** (T56-203, replay-watch-203.sh pid 296433, START 23:53Z, boot 8ea1f5e3); watcher-202 CHẾT theo reboot #135. Khoảng không-watcher: reboot #135 23:06:56Z → spawn 23:53Z ≈ 46 phút (watcher-202 chết theo reboot; T56-203 spawn sau khi repair xong — xem §4).
- Mọi số giờ/epoch trong file này qua **appendix203.py (66/66 assert PASS)** — không tin số giờ tính tay (bài học F-202-T01-1).

## §2. POSTBOOT #135 — CÓ 23:55:18Z (T56-203)

- **POSTBOOT_PASS #135 CÓ 23:55:18Z (poll=1, repair-som-quyet-h, dpkg 777, cache 108, lists 75, GST symlink 269=269, libevent CÓ lại)** — T56-203 verify độc lập exit=0; caveat thuộc parent (c)-203 (T56-203 đề xuất xem LIMITS T56-203; các đợt #133/#134 đều (b1) vì repair).
- Trước repair (survey 23:52:35Z): libevent MISSING, dpkg.log 2 dòng, 0 process watcher. Sau repair (23:55:18Z): libevent CÓ, dpkg.log 777 dòng. **T5-203 xác minh repair #134 + #135** (LIMITS T5-203: repair #134 ĐÚNG, fold 2→1 ĐÚNG theo nội dung, reseed #135 silenced ĐÚNG, repair #135 ĐÚNG).
- **#132 KHÔNG CÓ CỜ POSTBOOT** (đứng — parent (c)-202; tổng boot không cờ 32).

## §3. O8 — CHẠY LẠI trên #135 SAU repair: 3/3 PASS, 21/21 mỗi bộ (quyết (r)-203)

- **O8 trên #135 — WebKit PASS ×2 + Chromium PASS 21/21 (23:56:02–23:59:38Z, 3m36s)**: attempt1 exit=0 23:57:22Z, **21/21 PASS** (JSON md5 9105a18d); attempt2 exit=0 23:58:29Z, **21/21 PASS** (JSON md5 df3c2b5e); Chromium exit=0 23:59:38Z, **21/21 PASS** (JSON md5 9b7246db). Đếm lại từ JSON gốc bằng python (21 results, 21 ok=true mỗi bộ). **0 lỗi exit 127**; WebKit launched 27.2 (cả 2 attempt). Script gốc KHÔNG đổi so với đợt 202 (webkit 4994b4fc / headed c8acd72e); preview.tsx = **477a0eac**; media.ts = **ac89aeb2**; **cả 3 bộ CÙNG CÂY** và cây KHÔNG đổi trong lúc O8 chạy.
- **Chân FULL PASS "O8 3/3 ×2 cùng boot cùng cây" ĐẠT đợt này (3/3 bộ pass, cùng boot #135, cùng cây)** — kết quả mới làm chân O8 cho đợt 203; kết quả O8 1/3 đợt 202 GIỮ NGUYÊN trong hồ sơ đợt 202 (quyết (r)-203).
- O8 chạy SAU POSTBOOT #135 (flag 23:55:18Z → O8 start 23:56:02Z, +44 s) và SAU repair (libevent CÓ lại, dpkg 777). **So sánh với #133 (đợt 202):** #133 chạy TRƯỚC repair (libevent VẮNG, dpkg.log 2 dòng) — WebKit FAIL ×2; #135 chạy SAU repair — WebKit PASS ×2. Tương quan thời gian mạnh (cùng cây, cùng script, cùng thế hệ boot) nhưng **T01 KHÔNG kết luận nguyên nhân** — chưa chứng minh libevent là nguyên nhân, chỉ ghi tương quan (cùng thái độ như T01-202).
- Probe S1 KHÔNG chạy (attempt1 PASS — driver bỏ qua probe theo thiết kế). Setup đầy đủ trước khi chạy (eperm-retry.mjs đã copy — không lặp F-202-T01-2).
- O8 chạy trong lúc T4-203 chỉ poll: T4 poll #4–#8 (23:56:27–23:59:30Z) đều ghi lock=co t01-round203 — T4 thấy lock nên KHÔNG mở attempt; **0 chồng lấn attempt đang chạy**. Lock release 23:59:38Z; vite sau release curl 5560/5554 = 000; 0 process sót.

## §4. (m) #135 THÔ + runs 212/213 (DB tươi ~23:57Z)

- **(m) #135 THÔ = 1 requeue DƯƠNG trong cửa** (eid 11744 requeued_after_restart 23:07:35.568Z = btime+39,568 s; cửa [btime+33; btime+49,8] đóng ở +49,8 s — biên 10,232 s; eid 11745 dispatched +39,638 s + eid 11746 reattached +39,762 s cũng trong cửa; khoảng event bao trùm btime #135 = 455,416 s: eid 11743 succeeded 23:00:00.152Z → eid 11744; event ID liên tục 11743 → 11744, 0 event mất; phân loại CUỐI thuộc T2-203 + parent). **Khoảng event 455,416 s bao trùm btime #135 — T01 CHỈ BÁO SỐ THÔ, KHÔNG gọi là lặng/outage** (phân loại thuộc T7-203 + parent (n)).
- **Run 212 FAILED 23:34:50Z** (DB tươi: status failed, tout=false, finished 1795822490, started 1795820855 = 23:07:35Z — viết lại sau reboot #135, +9.104 s so với sched 20:35:51Z; finished TRƯỚC hạn cứng 23:35:51Z 61 s — KHÔNG phải timeout; gen cron_boot_eaecf2ac — gen MỚI sau reboot #135; started_at = đúng giây requeue eid 11744; kết cục/CA thuộc T7-203 + parent (n)-203). Xem F-203-T01-1.
- **Run 213 RUNNING lúc đọc** (5bebdace, sched/started 23:35:51Z — chính lượt cron đợt 203, started đúng giờ, gen cron_boot_eaecf2ac — CÙNG gen với run 212 sau #135; kết cục thuộc T7-203).
- **Run 208 finished_at_utc ỔN ĐỊNH 09:16:08Z** (đọc lại tươi lần thứ 4 liên tiếp — F-201-T10-8 ĐÓNG vẫn đứng).

## §5. GAP — §131 viết xong (11 mục §121–§131) + 3 điểm stale §130 đã sửa

- GAP `PHASE9_GAP_ANALYSIS.md` 1.211.063 B, 2.624 dòng (sau khi T01 chèn §131). §131 (11 mục §121–§131) viết đúng cấu trúc; T01 là luồng DUY NHẤT sửa GAP đợt này.
- **3 điểm stale §130 đã sửa theo §12 aggregate 202 (giao (r)-202):** (1) "POSTBOOT #134 + watcher-202 (chết theo reboot) thuộc T56-203" là SAI — T56-202 ĐÃ có POSTBOOT #134 CÓ 21:28:09Z + watcher-202 respawn 21:07:12Z pid 2113 (đã sửa thành "thuộc T56-202, đã có"); (2) câu "(chân lượt yên #69 + O8 3/3 cùng boot #130 đứng ở đợt 201...)" trộn số đợt 201 — sửa thành số đợt 202 (yên #70 + O8 1/3 trên #133; parent (b)-202: KHÔNG CÓ FULL PASS, chuỗi GIỮ 0); (3) ghi rõ **"#132 KHÔNG CÓ CỜ POSTBOOT"** (không viết post-hoc). Kiểm lại bằng grep sau sửa: 0 chuỗi sai còn trong §130 (trừ trích dẫn nhãn cũ có chủ đích trong chính bullet đính chính §131).
- Anchor DUY NHẤT khi edit (grep kiểm trước mỗi lần sửa — bài học F-202-T01-6): cả 3 anchor count=1 trước khi sửa; §131 chèn bằng anchor đuôi bullet §130 count=1; verify sau chèn: §131 tại dòng 2615, §130 còn 0 chuỗi stale.
- **GAP first-seen = đợt 59** (parent (q)(ii)-201 — đứng). **Tiêu đề GAP "T10-201 dời sang lượt cron sau" là ĐÚNG** (parent (q)(i)-201 — đứng).

## §6. Cờ lúc T01 đóng (~00:03Z 28/11)

- DONE: T5 (.done 00:00:34Z, LIMITS 18.154 B — repair #134/#135 ĐÚNG), T01 (luồng này).
- CHƯA .done lúc T01 đóng: P1/P2/P3/P4/T2/T4/T56/T7/T8/T9/T10. T7 LIMITS đã có trên đĩa (21.046 B, 00:00:08Z) nhưng chưa có .done — nguồn đúng là LIMITS từng luồng khi chúng đóng; T10-203 đính chính nếu GAP §131 sai về điểm này.
- **.done T01 viết ĐỦ NỘI DUNG** (không chỉ timestamp — khắc phục F-202-T10-1: .done T01-202 chỉ có 21 B timestamp).

## §7. Phát hiện của T01 (F-203-T01-x)

- **F-203-T01-1 — RUN 212 FAILED, KHÔNG PHẢI TIMEOUT (mới):** run 212 finished 23:34:50Z, status failed, tout=false, TRƯỚC hạn cứng 23:35:51Z 61 s — không phải timeout như run 210 (TIMEOUT cf 169 s → CA #32). Started_at viết lại lần nữa sau reboot #135 (20:35:51Z → 21:06:02Z sau #134 → 23:07:35Z sau #135 — lần viết lại thứ 3 của cùng một row; started_at mới = đúng giây requeue eid 11744). Gen viết lại 649ea114 → da522066 → eaecf2ac. CA classification (failed có tính là CA không) thuộc T7-203 + parent (n)-203 — T01 chỉ báo số thô.
- **F-203-T01-2 — O8 3/3 SAU REPAIR vs 1/3 TRƯỚC REPAIR (tương quan, chưa chứng minh nhân quả):** #133 (trước repair, libevent vắng) FAIL ×2; #135 (sau repair, libevent có) PASS ×2 — cùng cây, cùng script. Đây là bằng chứng tương quan mạnh nhất từ trước tới nay cho giả thuyết "thiếu libevent làm WebKit chết", nhưng vẫn CHƯA chứng minh (chưa có thí nghiệm đối chứng gỡ libevent trên boot tốt). T01 KHÔNG kết luận nguyên nhân.
- **F-203-T01-3 — NHÃN STALE TRONG SCRIPT SURVEY (nhỏ, không ảnh hưởng số):** `boot-survey-203t01.sh` (copy từ bản 202) vẫn in dòng "POSTBOOT_PASS round201-t56" và trỏ tới thư mục round201-t56 — nhãn cũ từ 2 đợt trước, file nó liệt kê không liên quan tới #135. Số liệu survey không bị ảnh hưởng (9 nguồn đọc trực tiếp, không qua đường dẫn đó). T01-204 sửa nhãn khi copy script.
- **F-202-T01-2 ĐÓNG (không lặp):** eperm-retry.mjs đã copy đủ trước khi chạy O8 — probe S1 không cần chạy lần này (attempt1 PASS) nên lỗi setup cũ không có cơ hội lặp lại; driver 203 đã copy đủ 4 file setup (survey .sh + driver .sh + probe .mjs + eperm-retry.mjs).
- **F-202-T01-6 ĐÓNG (không lặp):** mọi edit GAP dùng anchor grep-duy-nhất-trước; §131 chèn đúng chỗ ngay lần đầu, §130 không bị chèn sai (verify bằng grep theo khoảng dòng).

## §8. Kích thước LIMITS + batch stage

- **LIMITS T01-203: 11.370 B — DƯỚI trần push 37.768 B (còn 26.398 B).** File vượt trần trong đợt: GAP `PHASE9_GAP_ANALYSIS.md` 1.211.063 B (vượt trần — đã biết, stage bằng script riêng, không đưa vào batch text thường).
- **Batch T01-203: GAP + LIMITS, 2 entry / 2 đường dẫn / 1 file mới** (GAP đã có — không tính file mới; LIMITS mới). Đếm đợt 203 thuộc T10-203 (T01-203 KHÔNG đếm theo giao (r)-202).
- **KHÔNG PUSH.** Verdict đợt 203 thuộc T10-203 + parent.
