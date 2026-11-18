# Đợt 132 T8 — Vite harness WebKit 84l10/85m4/86n2: BLOCKED — KHÔNG CHẠY (không có cờ `round132-t4.done`)

Ngày: 17/11/2026 (lượt cron 00:35 +07 18/11 = 17:35:51Z; T8 mở 17:40Z, hạn cứng 20:35Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chờ cờ + chạy harness + LIMITS này. KHÔNG sửa production, KHÔNG sửa harness, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt.
Nợ: docs/PHASE9_ROUND131_T8_VITEHARNESS_LIMITS.md (quy trình harness, chờ cờ, luật STALE, reboot giữa lượt) + LIMITS gộp đợt 131 §11 (lượt yên #10 BẬT LOG DRAW PHỦ POST-FLIP, probe #51/mù #51, T6 chốt số boot).

## 0. Kết luận ngắn — BLOCKED, 0/3 là "không chạy", không phải "fail"

- **Cờ `round132-t4.done` KHÔNG BAO GIỜ xuất hiện** trong cả lượt: T4 không chạy được lượt yên WebKit #10 — 8 lần thử mở gate A (6 lần trên boot `b379ecd7`, 2 lần trên boot `07da9c50`) đều hết 10 phút "GATE A KHÔNG MỞ — KHÔNG chạy probe". Không có attempt nào của lượt yên #10 được chạy, không có dữ liệu, không có verdict T4.
- **Cờ `POSTBOOT_PASS` thì ĐỦ trên cả hai boot**: boot `b379ecd7` pass 18:35:45Z (poll 49, T5); boot mới `07da9c50` có TỚI HAI cờ — T5b pass 19:43:36Z (poll 2) và T5 pass 19:46:27Z (poll 2), cùng boot_id/btime. Gate của T8 chỉ thiếu cờ T4.
- **Reboot GIỮA LƯỢT lần thứ sáu liên tiếp** quanh ranh giới đợt: boot `b379ecd7` chết trong (19:33:56Z, 19:34:15Z]; boot mới `07da9c50` btime 19:34:15Z. Reboot giết waiter #1 của T8 bằng SIGTERM; T8 chạy lại waiter #2 trên boot mới sau khi sửa lỗi DEADLINE do chính T8 gây ra (xem §4).
- **Không có lần chạy harness nào**: không rebuild fixture, không tsc, không vite build, không kiểm kê/mirror trong đợt này — vì gate chưa bao giờ đủ nên không chạy gì cả. Production không động (md5 kiểm 3 lần giống hệt).
- **Waiter #2 hết hạn 20:10Z (poll 35, exit 3, GATE NOT MET)** — T8 kết luận BLOCKED trước hạn cứng 20:35Z, viết LIMITS này, stage, tạo cờ `.done`.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| (16:07Z, 17:24:08Z] | Boot #80? `ad1327ef` CHẾT (reboot thứ 5 liên tiếp quanh ranh giới đợt); boot mới `b379ecd7` btime 17:24:08Z (`uptime -s`) / 17:24:18Z (`stat /proc/1`, chênh 10 s) |
| 17:35:51 | Lượt cron 00:35 +07 mở đợt 132; parent tạo `round-in-progress.md` (của CHÍNH đợt 132 — không phải đợt main-chat) |
| 17:40:25 | T8 mở: boot `b379ecd7`, RAM khả dụng 1.055 MB, `/tmp` trống sau reboot, `/tmp/.X11-unix/` trống, 0 process Xvfb/vite/MiniBrowser |
| 17:40–17:41 | T8 chuẩn bị xong: script đợt 132 copy/adapt từ đợt 131 (`run-webkit-132t8.sh`, `rebuild-fixtures-132t8.sh`, `inventory132.py`, `mirror-verify132.py`, 2 waiter), `bash -n` + `py_compile` OK — NHƯNG waiter mang lỗi DEADLINE do sed gây ra (xem §4) |
| 17:41:59 | Waiter #1 `wait-t4-t5-132t8.sh` bắt đầu poll 60 s (deadline dự kiến 19:45Z — không bao giờ có hiệu lực vì DEADLINE rỗng) |
| 18:35:08 | T4 đạt gate0 trên `b379ecd7` (poll #23) — nhưng gate A sau đó không mở |
| 18:35:45 | T5 viết `POSTBOOT_PASS` boot `b379ecd7` (poll 49, watcher b81 v5) |
| 18:38–19:29 | T4/T9 attempt1 6 lần (18:38, 18:48, 18:58, 19:09, 19:19, 19:29Z), mỗi lần hết 10 phút "GATE A KHÔNG MỞ — KHÔNG chạy probe" |
| 18:38:45 | T5 `.done`: CHỈ XONG PHA 1 (hạ tầng postboot); pha 2 (phân tích log draw c2) chờ cờ T4, cắt 19:45Z |
| 19:33:56 | Dấu sống cuối boot `b379ecd7` (poll T4); waiter #1 poll 113 lúc 19:34:00Z (t4=0, postboot=1) |
| (19:33:56Z, 19:34:15Z] | **Boot `b379ecd7` CHẾT** (reboot thứ 6 liên tiếp); boot mới `07da9c50` btime 19:34:15Z (`uptime -s`) / 19:34:26Z (`stat /proc/1`, chênh 11 s) |
| ~19:34 | Waiter #1 bị SIGTERM theo reboot (session `proc_100af6842157`, chạy 112,5 phút, 113 poll) |
| 19:35:09 | T8 kiểm trên boot mới: boot `07da9c50`, RAM khả dụng 1.692 MB, `/tmp` trống, 0 Xvfb, production md5 không đổi |
| 19:36:35 | Waiter #2 bắt đầu (sau khi sửa lỗi DEADLINE, deadline 20:10Z) |
| 19:43:36 | T5b viết `POSTBOOT_PASS` boot `07da9c50` (poll 2, `round132-t5b/`) |
| 19:44:35 | Waiter #2 poll 9: postboot=1 lần đầu (tìm thấy cờ T5b) |
| 19:46:27 | T5 viết `POSTBOOT_PASS` boot `07da9c50` (poll 2, `round132-t5/`) — cờ thứ hai cho cùng boot |
| 19:48:04 | T4 đạt gate0 trên boot mới (poll #6) |
| 19:49:11, 19:59:19 | T4/T9 attempt1 2 lần trên boot mới, đều hết 10 phút "GATE A KHÔNG MỞ — KHÔNG chạy probe" |
| 20:10:35 | Waiter #2 poll 35: **WAIT-DEADLINE 20:10Z — GATE NOT MET** (t4=0 suốt 34 poll NOT-YET, postboot=1), exit 3 |
| 20:10:49 | T8 kiểm lần cuối: vẫn không có `round132-t4.done`, boot vẫn `07da9c50`, production md5 không đổi, RAM khả dụng 489 MB |

## 2. Chuẩn bị (đã xong, chưa dùng tới)

- Production baseline (kiểm 17:40Z, 19:35Z, 20:10Z — không đổi cả 3 lần): `preview.tsx` `805409f0…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` (khớp lúc mở đợt trong `round-in-progress.md`).
- Script đợt 132 trong `hidden_files/round132-t8/`: `run-webkit-132t8.sh` (driver 3 harness, Xvfb :199, lock `t8-round132`), `rebuild-fixtures-132t8.sh` (ffmpeg 8.1.2, md5 kỳ vọng khớp đợt 126–131), `inventory132.py`, `mirror-verify132.py` (đọc `round122-t8/edit-log.json` như các đợt trước), `wait-t4-t5-132t8.sh`, `wait-postboot-132t8.sh`. `bash -n` + `py_compile` OK. **Không script nào được chạy** ngoài 2 waiter — driver chưa bao giờ mở.
- Harness script + lock script + ffmpeg 8.1.2 + Xvfb đều có trên đĩa (kiểm 17:41Z). `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` không tồn tại trên boot này (driver chỉ `ls -ld` ghi log; đợt 131 cũng vậy và vẫn chạy 3/3 — không ảnh hưởng vì không chạy gì).
- Không có `vite.lock`; `/tmp/.X11-unix/` trống; 0 process Xvfb/vite/MiniBrowser sót lúc mở và lúc kết.

## 3. Vì sao BLOCKED — chỉ thiếu cờ T4, và T4 không chạy được attempt nào

1. **T4 không mở được gate A trong cả lượt (8/8 lần thử timeout).** Trên boot `b379ecd7`: T9 attempt1 6 lần (18:38, 18:48, 18:58, 19:09, 19:19, 19:29Z). Trên boot `07da9c50`: 2 lần (19:49:11Z, 19:59:19Z). Mỗi lần: 10 poll gate A (60 s/lần) rồi "HẾT 10 PHÚT GATE A KHÔNG MỞ — KHÔNG chạy probe luot attempt1 (prereg-t3)". Tổng cộng T4 chờ gate A ~80 phút trong lượt mà không chạy được một probe nào của lượt yên #10.
2. **Các trường poll được của T4 không cho thấy hệ bận.** Trong lúc chờ gate A: `lock=khong`, `blockers=0`, `load1` 0,03–0,49, `tree=YES:md5=805409f0`, `RAMavail` ~420–540 MB. Hệ nhìn qua các trường này là yên — tiêu chí gate A nào không đạt KHÔNG hiện trong log poll của T4; lý do gate A không mở là việc của T4 (chờ LIMITS T4), T8 không suy đoán.
3. **POSTBOOT_PASS đủ, không phải nguyên nhân chặn.** Boot `b379ecd7`: T5 pass 18:35:45Z (poll 49). Boot `07da9c50`: T5b pass 19:43:36Z (poll 2) + T5 pass 19:46:27Z (poll 2) — T5/T5b tự hồi phục sau reboot rất nhanh lần này (~9–12 phút, so với ~25 phút đợt 131). Waiter #1 thấy postboot=1 từ khi cờ `b379ecd7` xuất hiện; waiter #2 thấy postboot=1 từ poll 9 (19:44:35Z).
4. **T4 đạt gate0 cả hai boot nhưng gate0 ≠ gate A.** Gate0 `b379ecd7` đạt 18:35:08Z (poll #23); gate0 `07da9c50` đạt 19:48:04Z (poll #6) — sau đó gate A vẫn không mở. T8 không can thiệp vào gate của T4.

## 4. Lỗi waiter DEADLINE do T8 gây ra — đã sửa, không giấu

- **Lỗi:** khi adapt script đợt 131, sed `s/16:45:00 UTC/2026-11-17 19:45:00 UTC/g` áp lên dòng `DEADLINE=$(date -d '2026-11-17 16:45:00 UTC' +%s)` tạo ra `date -d '2026-11-17 2026-11-17 19:45:00 UTC'` → `date: invalid date` → `DEADLINE` rỗng → mỗi poll báo `[ : integer expression expected` (dòng 19) và điều kiện hết hạn không bao giờ đúng. Cả hai waiter (`wait-t4-t5-132t8.sh`, `wait-postboot-132t8.sh`) đều dính lỗi này.
- **Ảnh hưởng thực tế:** waiter #1 vẫn phát hiện cờ đúng (113 poll, `postboot=1` từ khi cờ `b379ecd7` xuất hiện, `t4=0` suốt) — chỉ mất chức năng tự hết hạn. Nó chỉ dừng vì reboot giết bằng SIGTERM (~19:34Z), không phải vì deadline. Nếu không có reboot, waiter #1 đã poll mãi quá hạn cứng.
- **Sửa:** trước khi chạy waiter #2, T8 sửa cả hai script về `DEADLINE=$(date -d '2026-11-17 20:10:00 UTC' +%s)`, kiểm chứng `date +%s` (deadline 1794946200 > lúc sửa 1794944188), `bash -n` OK. Waiter #2 đã thực thi deadline đúng: dừng 20:10:35Z poll 35, exit 3. Deadline 20:10Z được chọn để chừa ~25 phút tới hạn cứng 20:35Z cho trường hợp gate đủ muộn (đủ cho rebuild + driver ~10 phút + LIMITS/stage).
- **Bài học:** sau mọi lần sed đổi deadline, kiểm tra `date -d` của chuỗi mới TRƯỚC khi chạy waiter (bài học này đã có tiền lệ: đợt 131 §9 mục 3 — đặt tên log theo boot kiểm lại lúc chạy; lần này là kiểm lại chuỗi date sau sed).

## 5. Reboot #6 — khung chết và hậu quả

- Boot `b379ecd7` chết trong **(19:33:56Z, 19:34:15Z]** (~19 s — dấu sống cuối: poll T4 19:33:56Z; `uptime -s` boot mới 19:34:15Z). `stat /proc/1` boot mới 19:34:26Z (chênh 11 s, cùng mẫu chênh đồng hồ giữa hai boot như đợt 129–131) — ghi cả hai mốc, không tự chọn một (tiền lệ F-130-6).
- Đây là **reboot thứ sáu liên tiếp** quanh ranh giới đợt (đợt 129, 130, 131-mở, 131-giữa-lượt, 132-mở, 132-giữa-lượt). Chuỗi reboot giữa lượt nay đã lặp 4 đợt liên tiếp (129, 130, 131, 132).
- Hậu quả với T8: waiter #1 chết theo reboot (SIGTERM, 113 poll đã ghi); log waiter #1 được archive nguyên vẹn sang `smoke/wait-t4-t5-boot-b379ecd7.log` (114 dòng) trước khi waiter #2 truncate log chính — không mất lịch sử chờ. `/tmp` bị xóa sạch nhưng T8 chưa rebuild fixture nên không mất gì. Cờ `POSTBOOT_PASS` của `b379ecd7` STALE ngay khi boot mới lên; T5/T5b đã viết cờ mới cho `07da9c50` trong ~9–12 phút.
- Số thứ tự boot TẠM: T5 gọi `b379ecd7` là "b81" (watcher b81 v5); boot mới `07da9c50` được T5b gọi "b83" (`t5-wait-replay-b83.log`, `t5-postboot-b83-poll*.log`) — T6 đợt 132 chốt số chính thức; T8 không tự đánh số boot ngoài nhãn của T5/T5b.

## 6. Dọn dẹp — không có gì để dọn

- Không mở Xvfb, không acquire lock, không spawn vite/MiniBrowser, không rebuild fixture trong đợt này — nên không có process/socket/lock nào cần dọn. Kiểm cuối 20:10:49Z: `/tmp/.X11-unix/` trống, 0 process Xvfb/vite/MiniBrowser, không có `vite.lock`, `/tmp` trống sau reboot.
- Không kiểm lại TTS 39; không thử birefnet; không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **0/3 harness đợt này là "không chạy", không phải "fail".** Không được trích thành "85m4 kẹt lại", "P3 kẹt đợt 132" hay "WebKit fail đợt 132" — không có lần chạy harness nào. Kết quả harness gần nhất vẫn là đợt 131 chạy lại: 3/3 exit 0 trên boot `ad1327ef` (P3 không kẹt lần thứ tư liên tiếp, P5 seek 0 mẫu, HB128 18 dòng `sampleFor`).
2. **Không có verdict lượt yên #10.** T4 chưa chạy được attempt nào nên không có median, không có (c2), không có log draw mới để T5 đối chiếu. Mọi câu hỏi về lượt yên #10 (đóng/mở, (c2), mù #51) vẫn mở nguyên — chờ T4/T5 đợt sau.
3. **Hai file `POSTBOOT_PASS` cho cùng boot `07da9c50`** (`round132-t5/` pass 19:46:27Z và `round132-t5b/` pass 19:43:36Z, cùng boot_id/btime, cùng poll=2) — nội dung không mâu thuẫn (chỉ khác `pass_at` do hai luồng T5/T5b cùng viết); waiter của T8 chấp nhận cờ nào khớp boot_id cũng được. Việc hai luồng cùng viết cờ là việc của T5/T5b, T8 chỉ ghi nhận.
4. **RAM khả dụng cuối lượt chỉ 489 MB** (20:10Z; lúc mở 1.055 MB; sau reboot 1.692 MB; trong lúc T4 chờ gate A ~420–540 MB) — chỉ là quan sát; dưới guard 6 GB nên birefnet không thử (không thử trong đợt này). Không kết luận RAM là nguyên nhân gate A không mở — các trường poll của T4 cho thấy lock/load đều yên.
5. **Waiter #1 không có deadline hiệu lực** (xem §4) — số poll 113 của nó vẫn đúng (poll 60 s/lần, 17:41:59–19:34:00Z), nhưng nếu trích "waiter #1 chờ tới 19:45Z" là sai: nó không có mốc dừng nào cho tới khi reboot giết nó.
6. Kết quả này là n=0 bộ harness trên boot `07da9c50` — không có số đo WebKit mới nào từ đợt 132.

## 8. Nợ cho đợt sau / cần quyết parent

1. **T4 chưa chạy được lượt yên #10 (8 lần timeout gate A)** — nguyên nhân gate A không mở là câu hỏi lớn nhất đợt này; cần T4 (hoặc parent) nói rõ tiêu chí gate A nào không đạt, vì các trường poll nhìn đều yên. Lượt yên #10 + T5 đối chiếu log draw (c2) + probe #51/mù #51 đều dời sang đợt 133.
2. **T5 pha 2 (phân tích log draw c2) cũng BLOCKED theo T4** (cắt 19:45Z trong `.done` của T5) — chờ lượt yên #10 có dữ liệu.
3. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; mù #49 B mở + mù #51 mới mở; R9 (a) nhắc lần 16 (đợt 131); T6 đợt 132 chốt số boot + mù #37.
4. **Lỗi sed deadline của T8 (§4)** — bài học đã ghi: kiểm `date -d` chuỗi mới sau mọi lần sed đổi deadline trước khi chạy waiter.
5. Reboot giữa lượt lần thứ sáu liên tiếp — mẫu "reboot quanh ranh giới đợt" nay là luật chứ không còn là ngoại lệ; các luồng sau tiếp tục snapshot bằng chứng trước mỗi lần chạy lại sau reboot như đợt 129–132 đã làm.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round132-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, < 37.768 B. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật — và đợt này cũng không rebuild fixture). Dữ liệu thô: `hidden_files/round132-t8/` (run-webkit-132t8.sh, wait-t4-t5-132t8.sh — bản ĐÃ SỬA deadline 20:10Z, wait-postboot-132t8.sh — bản ĐÃ SỬA, rebuild-fixtures-132t8.sh, inventory132.py, mirror-verify132.py; smoke/wait-t4-t5.log — waiter #2, 35 poll, WAIT-DEADLINE 20:10Z exit 3; smoke/wait-t4-t5-boot-b379ecd7.log — waiter #1, 113 poll, chết theo reboot).
