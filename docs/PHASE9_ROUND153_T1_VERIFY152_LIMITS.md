# LIMITS — Phase 9 đợt 153, T1: Verify độc lập đợt 152

- **Boot:** `401fca75` suốt phiên (btime 07:32:38Z — **reboot MỚI #45 sau khi T10-152 đóng**, xảy ra giữa lúc T10-152 đóng ~08:14Z và lượt cron 153 mở 08:35:51Z; xem F-153-T1-1). Boot lúc T10-152 đóng là `c741f5e6` (#44, btime 07:04:11Z).
- **Verdict: PASS — nội dung đợt 152 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới (lần thứ 36 liên tiếp); suite chạy lại 28/28 exit 0 trên boot mới 401fca75 (lần đầu suite đầy đủ chạy trên boot sau #45 — lấp khoảng trống F-152-T10-3); `npm test` 12 pass theo chuẩn đứng mới; O8 xác nhận độc lập bằng JSON/log gốc (chuỗi FULL PASS 9 → 10). RAM đỉnh 63,01% guard + min 474.688 kB đối chiếu từ log gốc khớp T9/T10. Mù #74?/#75? vẫn MỞ theo hồ sơ + quyết parent (b) đợt 152.
- **Caveat lớn (đọc trước):** reboot #45 giữa lúc T10-152 đóng và đợt 153 mở — T10-152 ghi "không reboot nào sau #44" nay đã sai cho khoảng tới lúc đợt 153 mở (xem F-153-T1-1); 35 dòng ENOSPC trong journal boot c741f5e6 không đếm lại được nữa (journal đã xoay sang boot mới — F-153-T1-3, nhưng cùng chữ ký lỗi vẫn thấy trên boot mới); headroom 0 vẫn chỉ đứng trên bảng T9 (không còn stdout probe thô — F-152-T1-5 kéo dài); T10-152 không chạy lại toàn bộ suite (F-152-T10-3 — lần verify này lấp đúng khoảng trống đó).

## §1. Đếm cuối — KHỚP TỪNG SỐ (script mới `count-final-153.py`, dedup toàn cục)

- **Đợt 152 = 10 batch / 15 entry / 15 file (gồm closing) — KHỚP.**
- **Lũy kế 111–152 = 408 / 805 / 683 — KHỚP.**
- **Chờ push 136–152 = 160 / 227 / 187 — KHỚP.**
- **Tái kiểm 111–151 = 398/790/670 — KHỚP; 111–150 = 388/774/658 — KHỚP; 111–149 = 378/756/645 — KHỚP — lần thứ 36 liên tiếp** (T10-152 ghi lần thứ 35, nay +1).
- **Đợt 152 (trước closing) = 9 / 13 / 13 — KHỚP.** Đợt 151 = 10 / 16 / 16; đợt 150 = 10 / 18 / 18 — KHỚP.
- **Purity: 0 lỗi** (1.056 file paths rounds ≤ 152 quét, NUL-delimited, không newline, không entry rỗng; 0 file round 153 lúc chạy script). **0 file thiếu trên đĩa** (15/15 file đợt 152 đều tồn tại dưới `~/workspace/repo-1`).
- **Overlap đợt 152 với 111–151: 2 file — KHỚP** (`PHASE9_GAP_ANALYSIS.md` closing §81 + `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` T0 sửa lại script đã có — cả 2 đều trùng có lý do).
- **GAP §81 đã có đủ đếm cuối đợt 152** (10/15/15; 408/805/683; 160/227/187; tái kiểm 111–151 = 398/790/670; tái kiểm 111–150 = 388/774/658) + đính chính overlap đợt 151 là 4 file (F-152-T1-2). Aggregate 152 lúc T10 đóng 36.845 B, nay 41.961 B — tăng +5.116 B sau đóng do parent viết §12.3 (a)–(l) (xem F-153-T1-2, cùng mẫu F-152-T1-3, không phải lỗi).

## §2. Suite chạy lại: 28/28 exit 0 trên boot mới 401fca75 (lấp F-152-T10-3)

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (08:43:32–08:51:58Z, 8m26s, boot `401fca75`, RAMavail lúc mở 1.847 MB). Script `round153-t1-verify.sh` (adapt từ T1-152, nhãn echo đã đúng "T1-153"). Log `round153-t1-suites.log` (970 dòng ✓).
- **`npm test` đầy đủ: 12 pass, 0 fail** — đúng chuẩn đứng mới (11 mục cũ + probe V19 34 assert PASS). 12 dòng `✅ PASS` trong mục npm-test-full: 3 fixture + LUT + 6 demo (lut/effects/sticker/chroma/transitions/textfx) + `test_pixelate_render` 20 case + `test_v19_pixelate_probe` 34 assert geq; 7 self-test unit pass riêng ngoài 12.
- **Hệ quả kiểm chứng thêm:** probe V19 geq 34/34 assert PASS ngay trong suite tích hợp trên boot mới 401fca75 — xác nhận độc lập claim T0-151/T0-152 lần thứ ba (T1-151, T1-152, nay T1-153).
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676` (sau (A)), test_integration.sh `a6b8cfc0` (sau nối V19) — khớp hồ sơ T10-152 lúc đóng. Cây đã qua 8 boot với cùng md5 preview.tsx (đợt 151: 7 boot; nay + reboot #45).
- **Caveat:** suite chạy trong lúc các luồng đợt 153 khác làm việc song song (T4/T6/T8/T9 đã mở thư mục làm việc lúc suite chạy; probe #72 của T2-153 chạy 08:41:10Z, ngay trước suite). Tải song song không đổi verdict (8m26s, nhanh hơn 11m19s của T1-152). Không file lõi nào đổi giữa phiên mà suite chạm tới — md5 6 file trên không đổi trước/sau suite.

## §3. O8 — Xác nhận độc lập bằng JSON/log gốc (không chạy O8 riêng)

- File gốc `hidden_files/round152-t8/o8-webkit/o8w-clicktest-report-2026-11-20T06-14-28-18e179e0-pid39105.json` (attempt1): **21 kết quả, 21 ok=true, 0 fail**, md5 `25318b62`, khối `run` (stamp 06-14-28, bootId 18e179e0, pid 39105).
- File gốc `.../o8w-clicktest-report-2026-11-20T06-15-29-18e179e0-pid39569.json` (attempt2): **21 kết quả, 21 ok=true, 0 fail**, md5 `86fbf704` — **khác md5 attempt1** (không còn ghi đè — F-151-T10-2 đóng thật).
- File gốc `hidden_files/round152-t8/o8-chromium/o8-clicktest-report-2026-11-20T06-16-26-18e179e0-pid39921.json`: **21 kết quả, 21 ok=true, 0 fail**, md5 `5af121e3`.
- File `latest` byte-identical với file stamped cuối cùng từng loại (WebKit latest = attempt2 `86fbf704`; Chromium latest = `5af121e3`) — đúng thiết kế "latest" của T0-152.
- Driver log `o8-152t8.log`: start 06:14:27Z boot 18e179e0, preview.tsx 530e10a7, script O8 `4994b4fc`; `O8 DONE 06:17:18Z webkit1=0 webkit2=0 chromium=0`.
- **Gate (chuẩn đứng (i)):** waiter `GATE-FOUND poll=34 06:13:24Z` (`smoke/waiter-nohup.log`, đường a, postboot round152-t5) → cờ T4 mtime **06:13:53Z** → O8 driver start 06:14:27Z, sau lượt yên hợp lệ #20 của T4 (attempt1 05:59:46–06:04:10Z). **Chuỗi WebKit FULL PASS 9 → 10 — ĐÃ XÁC NHẬN ĐỘC LẬP** (lần thứ tư liên tiếp có xác nhận độc lập: T10-151 + T1-152 + T10-152 + T1-153; quyết parent (j) đợt 152 đã xác nhận).
- **Caveat (đã biết, không ảnh hưởng):** GATE-FOUND poll 34 lúc 06:13:24Z sớm hơn mtime cờ T4 29 s (gate đọc t4=OK từ file attempt-done 06:04Z, không phải cờ .done) — O8 bắt đầu sau cờ nên kết luận không đổi (cùng caveat T10-152 §10.2).

## §4. T0 — F-151-T10-2 đóng ở gốc; scratch JSONs khớp từng kết quả

- 2 script O8 md5 `4994b4fc` (webkit) / `c8acd72e` (headed) — khớp T10-152; `node --check` cả 2 OK.
- Scratch `round152-t0/`: Chromium JSON stamped `...05-47-19-18e179e0-attempt1-pid25492.json` — **21 kết quả, 21 ok** (exit 0, 21/21 ✓); WebKit attempt1 `...05-42-38-18e179e0-attempt1-pid10897.json` — **2 kết quả, 1 ok** (S0 PASS, S1 FAIL `Target crashed` — chữ ký đợt 142 ✓); WebKit attempt2 `...05-43-04-18e179e0-attempt2-pid12951.json` — **0 kết quả** (timeout chờ project mẫu tự load ✓). File `latest` WebKit = attempt2 (0 kết quả), Chromium latest = 21/21 — đúng thiết kế.
- **Kết luận:** T0 sửa đúng ở gốc và kiểm chứng bằng chạy thật; 2 JSON WebKit theo lượt khác nhau đều tồn tại, nội dung đúng như aggregate §1 mô tả.

## §5. T2 — Probe #71 + mù #74?/#75? MỞ: đứng theo hồ sơ + quyết parent (b)

- **Probe EPERM #71: log `eperm-probe-v2.log` đúng 205 dòng tại lúc T2-152 đóng** (3 dòng cuối: DEAD #70 05:41:14Z + boot-changed 2e430750 → 18e179e0 + `probe#71 boot=18e179e0 ok=2 fail=0` 05:41:18Z — đúng mẫu +3). **Log nay 208 dòng — KHÔNG phải lệch:** 3 dòng mới (206–208) là probe #72 của đợt 153 (DEAD #71 08:41:06Z + boot-changed 18e179e0 → 401fca75 + `probe#72 boot=401fca75 ok=2 fail=0` 08:41:10Z) — đúng mẫu +3, trên boot mới #45. Dòng boot-changed của probe #72 ghi "uptime since 2026-11-20 07:32:38" — đối chiếu độc lập btime #45 (xem F-153-T1-1).
- **Mù #74? MỞ (J-full hố 1.589 s > sàn 1.147 s) + mù #75? MỞ:** đối chiếu file `blind74-gaps.txt` — `gap 1589s: 2026-11-20T04:00:55 -> 2026-11-20T04:27:24`, `max gap 1589s, floor 1147s, max hidden = 1` (J-full); đoạn I max 475 s, K max 880 s, G-full max 380 s, H max 702 s; `F'-body max gap (excl tail): 1014s` — khớp claim aggregate §3. Gap #42 [7.163, 7.167] s + gap #43 [6.939, 6.943] s là ứng viên (không có đo F trực tiếp trên fad2aab9) — **quyết parent (b) đợt 152: GIỮ MỞ, chưa chứng nhận; CERT/FULL chính thức GIỮ 73/88** — T1 chỉ đối chiếu hồ sơ, không đạo lại merged gap. Chuỗi đóng hoàn toàn giữ 9.
- T1 không đạo lại phân tích sessions/hole-recheck/INSIDE/WFS chi tiết (phạm vi T2; file bằng chứng đầy đủ trên đĩa).

## §6. T4 — Lượt yên #20: đếm lại từ log gốc khớp

- `poll-t4.log`: **37 dòng, 33 dòng `poll #`** (poll #1–#25, có dòng lặp — mỗi poll ghi 1–2 dòng; không phải 25 dòng thuần — xem F-153-T1-5(b)). Dòng cuối: `attempt1-18e179e0 20/20 + LOP B DAT 5/5 + tickCost median=60.0ms <=60 - LUOT HOP LE, thoat poller`.
- **Attempt1 (lượt hợp lệ #20): 20/20 + LỚP B ĐẠT 5/5 + tickCost median 60,0 ms ≤ 60 (ĐÚNG NGƯỠNG)** — file phân tích `analyze-t4-attempt1-18e179e0-tickcost.txt`: `tickCost total n=489 median=60.0 p90=89.0 max=172 min=31 | hau flip+2000ms n=362 median=59.5` — khớp từng số aggregate §4. Cửa mở poll #25 05:59:46Z (gate0 T5 POSTBOOT_PASS 05:58:52Z + gateA RAM 1.232 MB); attempt xong 06:04:10Z, dùng 1/3 ngân sách.
- **(c2)=0 occurrence; P3' 32/34 vẫn không tròn lần thứ hai liên tiếp** — đứng theo hồ sơ T4; **quyết parent (d) đợt 152: MỞ XEM XÉT, giao T4-153** — T1 không đạo lại từng pass P1/P2/P3/P7 (phạm vi T4; file analyze attempt1 có đủ trên đĩa).

## §7. T5 — Cờ postboot + repair sớm (h): đứng theo file gốc

- File cờ `hidden_files/round152-t5/POSTBOOT_PASS` tồn tại, nội dung khớp claim: boot 18e179e0 (btime 05:20:57Z), repair sớm kích 05:46:03Z, dpkg 795, cache 110, lists 75, GST 269, cờ ghi 05:58:52Z poll=1; cờ cũ 2e430750 lưu POSTBOOT_PASS-2e430750.
- `replay-watch-152.log`: poll cuối 07:04:36Z trên boot 18e179e0 (dpkg_lines=795) — watcher chết theo reboot #44 (btime 07:04:11Z), không khởi động lại sau — khớp F-152-T10-4. **Quyết parent (i) đợt 152: giao T5-153 kiểm tra có giới hạn** (watcher có cần sống qua reboot không).
- T1 không kiểm lại apt/dpkg internals (phạm vi T5).

## §8. T6 — Lock khỏe lúc đóng; (A) còn nguyên theo hồ sơ

- **Chạy lại script của chính T6 trên log đóng băng:** `analyze-log.py` trên `vite-lock-v2-cleaned-close.log` (1.437 dòng) cho đúng số T6: **ACQUIRED=418, RELEASED=409, pairs 409, still held 0, double-acquire 9** — tái hiện chính xác, không cộng tay. Dòng cuối log: `t8-round151 RELEASED` 04:48:03Z.
- **Prune lần 27:** file `prune-deleted.txt` ghi xóa `cooldown-s4-wL` + `cooldown-s4-wN` (14/11) — khớp claim (queue 102 → 100; lúc T10 đóng 101 do T8 thêm 1 cooldown sau prune).
- (A) còn nguyên + 120/120 PASS dưới churn, chuỗi xanh kép 1 → 2: đứng theo hồ sơ T6 + quyết parent (a) đợt 152 — T1 không chạy lại 120 lần kiểm chứng churn (phạm vi T6).

## §9. T8 — Harness 6/6 PASS, 85m4 hết kẹt: xác nhận từ log summary gốc

- `smoke/run-webkit-summary.txt`: `=== ALL DONE Fri Nov 20 06:33:45 UTC 2026 ec webkit: 84l10=0 85m4=0 86n2=0 ; chromium: 84l10=0 85m4=0 86n2=0 ===` — **harness 6/6 PASS một lần chạy, 0 kẹt**. WebKit 85m4 exit=0 (06:19:12–06:21:32Z, P5 PASS "không restart dư", seek kẹt dài nhất 0 mẫu) — **85m4 HẾT KẸT**, đứt chuỗi kẹt 3/4 lần gần nhất; chuỗi "P3 không kẹt" 0 → 1.
- H3 chỉ giám sát thụ động (quyết (f)) — 0 kẹt nên không có chữ ký mới; **H3 VẪN MỞ** (quyết parent (h) đợt 152: giữ nguyên).
- T1 không chạy lại harness/O8 (ngoài phạm vi verify; O8 đã xác nhận độc lập ở §3).

## §10. T9 — RAM đỉnh/min + balloon 27: đếm lại từ log gốc khớp; headroom 0 + ENOSPC có caveat mới

- `ram-sampler.log`: **124 dòng** — khớp 124 mẫu. Chạy `awk` trực tiếp trên cột `mem=`: **max avail 3.964.468 kB lúc 05:40:17Z = 63,01% guard 6.291.456 kB; min avail 474.688 kB lúc 06:45:21Z** — khớp đúng số T9/T10 (đỉnh cao nhất kể từ đợt 146).
- **Balloon ghim trần 27/124 mẫu:** đếm dòng `bal=6443824` = **27 dòng** — khớp. **0/124 mẫu ≥ guard** — birefnet 0 thử lần thứ 6 liên tiếp ✓.
- **B2: 24 spike** — `grep -c SPIKE b2-spikes.log` = **24** (tổng file 1.142 dòng); T1 không attribution từng spike (phạm vi T9).
- **Headroom 82 → 0 — ĐỨNG THEO BẢNG, KHÔNG CÓ STDOUT PROBE THÔ (F-152-T1-5 kéo dài):** T9 LIMITS §1.2 ghi 5 lần đo (82/82 lúc mở 05:39:00Z boot 18e179e0; 0/0/0 lúc đóng 07:42:43Z ×2 + 07:43:11Z boot c741f5e6; chênh 0 mỗi cặp); 4 file `headroom-probe*.err` đều 0 byte. Phương pháp không đổi từ đợt 109 + 2 lần đo mở chênh 0 + 3 lần đo đóng đều 0 là cơ sở để chấp nhận số 0; T1 KHÔNG đo lại headroom (số đo cùng thời điểm không tái tạo được).
- **ENOSPC 35 dòng — KHÔNG ĐẾM LẠI ĐƯỢC NỮA (F-153-T1-3):** T9 đếm 35 dòng lỗi `home-assistant-ensure.service: Failed to add control inotify watch descriptor ... No space left on device` trên boot c741f5e6 lúc 07:45Z; journal chỉ giữ 1 boot (volatile) nên sau reboot #45 journal c741f5e6 đã mất — T1 không thể đếm lại 35 dòng này. **Corroboration độc lập trên boot mới:** journal boot 401fca75 đã có **19 dòng cùng thông điệp, cùng service, 3 dòng đầu cách nhau đúng 70 s** (08:36:25Z, 08:37:35Z, 08:38:45Z) — cùng chữ ký, cùng cadence ~70 s như T9 mô tả; bảng watch vẫn đầy sau #45. Quyết parent (c) đợt 152: GIỮ quyết (g) "chỉ theo dõi".

## §11. Sai lệch phát hiện (F-153-T1-N — kể cả nhỏ)

- **F-153-T1-1 — Reboot #45 MỚI giữa lúc T10-152 đóng và đợt 153 mở.** Boot hiện tại `401fca75` (btime 07:32:38Z — epoch 1795159958; journal boot mới first entry 07:32:49Z; uptime lúc kiểm khớp btime); T10-152 đóng ~08:14Z trên boot `c741f5e6` và ghi "không reboot nào sau #44". **Bằng chứng reboot là thật:** boot_id đổi c741f5e6 → 401fca75; `journalctl --list-boots` chỉ còn boot 401fca75; probe #72 của T2-153 (08:41:10Z) tự ghi `boot changed 18e179e0 -> 401fca75 (uptime since 2026-11-20 07:32:38)`. **Cửa sổ reboot:** sau mẫu sampler cuối cùng của boot cũ 07:42:34Z (sampler đọc boot_id tươi mỗi 60 s, không gap, không restart — xem dưới) và trước khi lượt cron 153 mở 08:35:51Z. **Nghịch lý đồng hồ lớn nhất từ trước tới nay:** btime boot mới 07:32:38Z SỚM HƠN mẫu cuối boot cũ (07:42:34Z) tới 9m56s — đồng hồ lùi ≥ ~10 phút qua reboot (các nghịch lý trước chỉ 10–20 s: #41 ≥+20 s, #42 ≥+18 s, #44 ≥10 s). Nếu #45 xảy ra sau khi T10 đóng cờ 08:14:28Z (cách đọc khả dĩ nhất — xem dưới), mức lùi là ~42–46 phút. **Vì sao "sau khi T10 đóng" là cách đọc khả dĩ nhất:** (a) sampler sống liên tục trên c741f5e6 tới 07:42:34Z (không reboot nào trước đó); (b) T7 đọc DB lần cuối ~07:57:26Z thấy run 152 vẫn `running`, started_at 1795158291 KHÔNG đổi kể từ viết lại tại #44 — nếu #45 xảy ra trước 07:57:26Z trong lúc run 152 đang chạy, theo mẫu (m) daemon phải viết lại started_at lần 2 trong ~33–45 s, nhưng không thấy; (c) phiên T10 kết thúc 08:14:28Z (mtime cờ) không có dấu hiệu reboot trong lúc làm việc. **T10 không sai lúc viết** (reboot xảy ra sau khi T10 đóng — cùng mẫu F-152-T10-4) — nhưng câu "không reboot nào sau #44" trong aggregate §10.5 nay đã sai cho khoảng tới lúc đợt 153 mở. **Hệ quả:** (a) run 152 (vẫn `running` lúc T7 đóng cờ, hạn ngân sách 08:35:51Z) có thể đã bị #45 đánh trúng — kết cục thuộc T7-153 (điểm (m) thứ 6 nếu #45 viết lại started_at lần 2); (b) mở cửa sổ mù mới sau #45 — giao T2-153 (số hiệu mù do T2-153 quyết; mù #76? đã giao cho #44); (c) journal boot c741f5e6 đã mất theo #45 (xem F-153-T1-3); (d) suite verify này chạy trên boot mới — tốt cho tính độc lập. **Cơ chế đồng hồ lùi ~10–46 phút chưa rõ** (lớn hơn hẳn họ nghịch lý ±10–20 s đã biết) — T1 ghi nhận, không mở điều tra mới; T2-153 đối chiếu btime #45 theo phạm vi mù.
- **F-153-T1-2 — Aggregate tăng kích thước sau đóng: 36.845 B lúc T10 đóng → 41.961 B nay (+5.116 B).** Khối §12.3 đo được 5.328 B, trong đó ~212 B là header/dòng phân cách đã có sẵn lúc đóng — phần tăng thêm đúng bằng quyết parent (a)–(l) viết trực tiếp ~15:2x +07. Cùng mẫu F-152-T1-3 (đợt 151: 50.009 B → lớn hơn sau đóng). Không phải lỗi.
- **F-153-T1-3 — 35 dòng ENOSPC trong journal boot c741f5e6 không đếm lại được nữa.** Journal volatile, chỉ giữ 1 boot; sau reboot #45 chỉ còn journal boot 401fca75. T9-152 đã ghi rõ giới hạn này trong LIMITS §4 ("không kiểm được ENOSPC trên boot cũ sau reboot"). Số 35 dòng đứng trên hồ sơ T9 (đếm lúc 07:45Z, ghi rõ phương pháp + cadence ~70 s + khoảng 07:05:59–07:45:00Z); corroboration trên boot mới: 19 dòng cùng chữ ký, 70 s cadence (xem §10). Không đổi verdict.
- **F-153-T1-4 — Phạm vi kiểm có giới hạn (cùng mẫu F-152-T1-7).** T1 kiểm độc lập: đếm cuối (script mới), suite đầy đủ 28/28, O8 (JSON/log gốc), cây md5, log probe/poll/sampler/B2/lock/harness (đếm lại từ file gốc). Các claim T2 (merged gap/sessions/hole-recheck chi tiết, INSIDE, WFS), T7 (scheduler DB, HB/DR, run 151 SUCCEEDED chi tiết), T5 (apt/dpkg internals), T9 (attribution từng spike, balloon episode, chuỗi headroom dài hạn), T6 (120 lần kiểm soát churn), T0 (bench chi tiết) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. /tmp trước reboot #45 đã mất theo reboot.
- **F-153-T1-5 — Sai số của chính T1-153 (ghi trung thực):** (a) lúc đầu đếm `eperm-probe-v2.log` được 208 dòng và suýt ghi lệch với claim "205 dòng" của T2 — thực ra 3 dòng mới là probe #72 của đợt 153 (08:41Z); đã kiểm tra ranh giới dòng 203–208 trước khi kết luận (§5). (b) lúc đầu `grep -c "^poll #"` được 33 và suýt ghi lệch với "poll #25" — thực ra 33 là số dòng poll (có lặp), 25 là số poll; đã kiểm tra số hiệu poll phân biệt trước khi kết luận (§6). (c) lúc đầu `uptime -s` cho 07:32:38Z và suýt kết luận reboot #45 xảy ra TRƯỚC khi T10 đóng (07:32 < 08:14) — đã kiểm sampler (đọc boot tươi mỗi 60 s, không gap tới 07:42:34Z) + T7 đọc DB ~07:57:26Z không thấy viết lại lần 2 + cờ T10 08:14:28Z trước khi kết luận cửa sổ và cách đọc khả dĩ nhất (§11 F-153-T1-1). (d) script phụ lục bản đầu lỗi `TypeError` (định dạng `%d` cho chuỗi `grep -c`) — đã sửa và chạy lại; file phụ lục trên đĩa là bản từ script đã sửa.

## §12. Tổng hợp + giao tiếp

- **Verdict: PASS.** Nội dung đợt 152 đứng vững toàn bộ trên boot mới 401fca75: đếm khớp lần thứ 36 liên tiếp; suite đầy đủ 28/28 (lấp khoảng trống F-152-T10-3, lần đầu suite chạy trên boot sau #45); O8 21/21 ×2 + 21/21, chuỗi FULL PASS 9 → 10 xác nhận độc lập lần thứ tư; RAM đỉnh 63,01% guard (cao nhất kể từ đợt 146) + min 474.688 kB đối chiếu từ log gốc; mù #74?/#75? vẫn MỞ theo quyết parent (b); GAP §81 đã đủ đếm cuối + đính chính overlap 4 file. Hai sai lệch ghi nhận (F-153-T1-1 reboot #45, F-153-T1-3 ENOSPC không đếm lại được) đều không đổi verdict đợt 152 — F-153-T1-1 thuộc về đợt 153 (mù mới + kết cục run 152), F-153-T1-3 là giới hạn bằng chứng do journal xoay sau #45.
- **Verdict CHẤP NHẬN đợt 152 (quyết parent (a)) KHÔNG ĐỔI.**
- **Nợ chuyển đợt 153 (đã có chủ, T1 chỉ nhắc lại + bổ sung từ F-153-T1-1):** mù #74?/#75? MỞ giao T2-153 (quyết (b)) + **mù mới sau reboot #45 giao T2-153**; kết cục run 152 thuộc T7-153 (quyết (f) đợt 152 đã chấp nhận run 151; run 152 có thể bị #45 đánh trúng — T7-153 kiểm started_at có viết lại lần 2 không); P3' 32/34 mở xem xét giao T4-153 (quyết (d)); watcher giao T5-153 kiểm tra có giới hạn (quyết (i)); headroom 0 + ENOSPC giao T9-153, giữ quyết (g) "chỉ theo dõi" (quyết (c)); H3 chỉ giám sát thụ động T8-153 (quyết (h)); G1/R9/ci-security.yml/TTS 39 giữ nguyên theo quyết đứng.
- **Cây lúc đóng verify:** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 152 + verify 153. Boot `401fca75` ổn định, không reboot trong phiên T1. Lock vite: 0 lock của đợt 152 đang giữ lúc kiểm (log đóng băng pairs 409, 0 giữ). 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 08:51:58Z`). 2 socket Xvfb mồ côi do suite T1 tạo (X194, X195, mtime 08:48Z, 0 process sống, không process nào còn DISPLAY :194/:195) đã dọn tay; X193 CÒN LẠI là display sống của T4-153 (Xvfb :193 pid 37176, chạy từ 08:59:23Z, MiniBrowser DISPLAY=:193) — T1 KHÔNG đụng vào. `/tmp/.X11-unix/` lúc đóng chỉ còn X193 (sống).
- **File LIMITS này:** `docs/PHASE9_ROUND153_T1_VERIFY152_LIMITS.md` (dưới trần 37.768 B — xem cờ). Stage `phase9-round153-t1-verify152.txt` (1 entry NUL, od OK). Cờ `round153-t1.done` viết trước khi báo đóng, CÓ NỘI DUNG (không 0 byte).

**Tổng batch đợt 152 (tái kiểm): 10 batch / 15 entry / 15 file duy nhất.**
**Lũy kế 111–152: 408 batch / 805 entry / 683 file.**
**Tổng batch chờ user push (đợt 136–152): 160 batch / 227 entry / 187 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)

---

## Phụ lục A — Số liệu trích từ log gốc (script `round153-t1/appendix-153t1.py`, không gõ tay)

### A.1 Suite chạy lại (log `round153-t1-suites.log`, 970 dòng)
- Bắt đầu: 2026-11-20T08:43:32Z; kết thúc: 2026-11-20T08:51:58Z; boot: 401fca75-bece-45b6-88fa-b12f602d6390; RAMavail lúc mở: 1847MB.
- Mục suite: 28 dòng `exit=`, 28 exit=0, 0 exit≠0.
- `npm test`: 12 pass, 0 fail; số dòng `✅ PASS` trong mục npm-test-full: 12.
- Cây md5 lúc mở suite:
  - 530e10a7 apps/web/src/preview.tsx
  - 2c384ed1 apps/web/src/media.ts
  - ee80d093 apps/web/vite.config.ts
  - fedc0141 server/render/src/effects.js
  - a89c0676 apps/web/scripts/test-vite-lock-v2.sh
  - a6b8cfc0 server/render/test_integration.sh
- Cây md5 lúc đóng suite (sau `ALL DONE`):
  - 530e10a7 apps/web/src/preview.tsx
  - 2c384ed1 apps/web/src/media.ts
  - ee80d093 apps/web/vite.config.ts
  - fedc0141 server/render/src/effects.js
  - a89c0676 apps/web/scripts/test-vite-lock-v2.sh
  - a6b8cfc0 server/render/test_integration.sh
- md5 6 file giống hệt trước/sau suite: CÓ.

### A.2 Đếm cuối (script `count-final-153.py`, dedup toàn cục; file `t1-count-final-152-recount.txt`)
- paths files scanned (rounds <=152): 1056 (skipped round>=153: 0)
- round 152 (incl closing): 10 batch / 15 entry / 15 file
- round 152 pre-closing: 9 batch / 13 entry / 13 file
- round 151: 10 batch / 16 entry / 16 file
- round 150: 10 batch / 18 entry / 18 file
- cumulative 111-152: 408 batch / 805 entry / 683 file
- cumulative 111-151: 398 batch / 790 entry / 670 file
- cumulative 111-150: 388 batch / 774 entry / 658 file
- cumulative 111-149: 378 batch / 756 entry / 645 file
- waiting push 136-152: 160 batch / 227 entry / 187 file
- waiting push 136-151: 150 batch / 212 entry / 173 file
- overlap round 152 vs 111-151: 2 file
- purity errors: 0
- missing on disk (round 152): 0
- closing entries: 2 (docs/PHASE9_ROUND152_LIMITS.md, PHASE9_GAP_ANALYSIS.md)
- overlap: PHASE9_GAP_ANALYSIS.md
- overlap: apps/web/scripts/clicktest-87o8-mask-track-headed.mjs

### A.3 O8 — JSON gốc (`round152-t8/o8-webkit/`, `o8-chromium/`) + log driver
- o8-clicktest-report-2026-11-20T06-16-26-18e179e0-pid39921.json: results=21 ok=21 fail=0 run.bootId=18e179e0 run.pid=39921 md5=5af121e3
- o8w-clicktest-report-2026-11-20T06-14-28-18e179e0-pid39105.json: results=21 ok=21 fail=0 run.bootId=18e179e0 run.pid=39105 md5=25318b62
- o8w-clicktest-report-2026-11-20T06-15-29-18e179e0-pid39569.json: results=21 ok=21 fail=0 run.bootId=18e179e0 run.pid=39569 md5=86fbf704
- driver log: === T8-152 O8 driver start 2026-11-20T06:14:27Z boot=18e179e0-365e-4298-92b8-b61b147f9600 preview.tsx=530e10a7266b8c148411ba21510b501a o8w=4994b4fc614e9dba7606237a09696c57 ===
- driver log: == KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail, 0 note ==
- driver log: == KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note ==
- driver log: O8 DONE 2026-11-20T06:17:18Z webkit1=0 webkit2=0 chromium=0
- driver log: số dòng `== KẾT QUẢ CLICK-TEST` trong log: 10 (log driver in lặp khối kết quả sau mỗi lần chạy).
- gate log: GATE-FOUND poll=34 06:13:24Z t4=OK postboot=/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t5/POSTBOOT_PASS (duong a) t4attempt=no-lock
- Cờ T4 mtime: 2026-11-20 06:13:53.802789800 +0000; cờ POSTBOOT_PASS T5 mtime: 2026-11-20 05:58:52.676768691 +0000.

### A.4 T9 RAM / balloon / B2 (`round152-t9/ram-sampler.log`, `b2-spikes.log`)
- Mẫu sampler: 124 dòng; max mem=3964468 kB @2026-11-20T05:40:17Z (63.01% guard 6.291.456 kB); min mem=474688 kB @2026-11-20T06:45:21Z.
- Dòng bal=6443824 (ghim trần): 27; mẫu ≥ guard: 0.
- Dòng SPIKE trong b2-spikes.log: 24 (tổng 1142 dòng).

### A.5 T2 EPERM + mù #74? (`eperm-probe-v2.log`, `round152-t2/blind74-gaps.txt`)
- eperm-probe-v2.log: 208 dòng (lúc T2-152 đóng: 205; 3 dòng mới là probe #72 đợt 153).
  - 2026-11-20T05:41:14Z probe DEAD detected by status (last #70 at 2026-11-20T02:40:07Z, age 10866s, no probe end since last start)
  - === boot changed 2e430750 -> 18e179e0 (reboot detected, uptime since 2026-11-20 05:20:57 ) ===
  - 2026-11-20T05:41:18Z probe#71 boot=18e179e0 tmp+ws ok=2 fail=0
  - 2026-11-20T08:41:06Z probe DEAD detected by status (last #71 at 2026-11-20T05:41:18Z, age 10788s, no probe end since last start)
  - === boot changed 18e179e0 -> 401fca75 (reboot detected, uptime since 2026-11-20 07:32:38 ) ===
  - 2026-11-20T08:41:10Z probe#72 boot=401fca75 tmp+ws ok=2 fail=0
- gaps: head +1s tail -6s; max gap 475s, floor 1147s, max hidden = 0
- gaps: gap 1589s: 2026-11-20T04:00:55 -> 2026-11-20T04:27:24
- gaps: head +61s tail -934s; max gap 1589s, floor 1147s, max hidden = 1
- gaps: head +880s tail -4s; max gap 880s, floor 1147s, max hidden = 0
- gaps: head +208s tail -42s; max gap 380s, floor 1147s, max hidden = 0
- gaps: head +7s tail -3s; max gap 702s, floor 1147s, max hidden = 0
- gaps: F'-body max gap (excl tail): 1014s (2026-11-19T21:54:43 -> 2026-11-19T22:11:37)

### A.6 T4 lượt yên #20 (`round152-t4/poll-t4.log`, tickcost)
- poll-t4.log: 37 dòng, 33 dòng `poll #` (poll #1–#25, có dòng lặp).
  - CUA YEN MO poll #25 2026-11-20T05:59:46Z - gate0 T5(/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t5/POSTBOOT_PASS) + gateA du (RAM=1232MB) - CHAY attempt1 NGAY (da dung 0/3) [gate vua poll lai, quyet-149-h]
  - == poll-wait-t4-152: attempt1-18e179e0 chay xong, run-attempt exit=0, da-dung-ngan-sach=1/3 2026-11-20T06:04:10Z
  - attempt1-18e179e0 20/20 + LOP B DAT 5/5 + tickCost median=60.0ms <=60 - LUOT HOP LE, thoat poller
- tickcost: tickCost total n=489 median=60.0 p90=89.0 max=172 min=31 | hau flip+2000ms n=362 median=59.5

### A.7 T6 lock (`round152-t6/analyze-log-cleaned-close.txt` — chạy lại `analyze-log.py` trên log đóng băng)
- lines: 1437
- first: 2026-11-14T18:01:32Z r4-round115 TICKET ticket=1-17946792928
- last : 2026-11-20T04:48:03Z t8-round151 RELEASED hold_s=231
- TOTAL: ACQUIRED=418, COOLDOWN=161, RELEASED=409, STALE-LOCK=9, STALE-TICKET=1, TICKET=429, TIMEOUT=10, total=1437
- R120 (>=05:35Z 16/11): ACQUIRED=336, COOLDOWN=153, RELEASED=331, STALE-LOCK=4, TICKET=338, TIMEOUT=2, total=1164
- DELTA (>05:49Z 16/11, after T9 snapshot): ACQUIRED=330, COOLDOWN=148, RELEASED=325, STALE-LOCK=4, TICKET=332, TIMEOUT=2, total=1141
- BOOT62 (>=08:25:47Z 16/11): ACQUIRED=302, COOLDOWN=135, RELEASED=297, STALE-LOCK=4, TICKET=304, TIMEOUT=2, total=1044
- pairs ACQUIRED->RELEASED: 409
- still held at end of log: 0 -> {}
- prune-deleted.txt: -rw-rw---- 1 root nogroup 14 2026-11-14T21:10:42Z vite.lock.queue/cooldown-s4-wL | -rw-rw---- 1 root nogroup 14 2026-11-14T21:10:49Z vite.lock.queue/cooldown-s4-wN |

### A.8 T0 O8 JSON scratch (`round152-t0/o8-webkit/`, `o8-chromium/`) + md5 script O8
- o8-clicktest-report-2026-11-20T05-47-19-18e179e0-attempt1-pid25492.json: results=21 ok=21
- o8-clicktest-report.json: results=21 ok=21
- o8-track-35-65.json: results=0 ok=0
- o8-track-35-65.json: results=0 ok=0
- o8w-clicktest-report-2026-11-20T05-42-38-18e179e0-attempt1-pid10897.json: results=2 ok=1
- o8w-clicktest-report-2026-11-20T05-43-04-18e179e0-attempt2-pid12951.json: results=0 ok=0
- o8w-clicktest-report.json: results=0 ok=0
- md5 script O8: webkit=4994b4fc headed=c8acd72e (node --check OK cả 2).

### A.9 Reboot #45 (phát hiện mới — xem §11 F-153-T1-1)
- boot_id lúc mở đợt 153: 401fca75-bece-45b6-88fa-b12f602d6390; btime: btime 1795159958; uptime lúc kiểm: 5058.39 18060.54.
- journalctl --list-boots: 0 401fca75bece45b688fab12f602d6390 Fri 2026-11-20 07:32:49 UTC Fri 2026-11-20 08:56:55 UTC.
- Sampler T9-152: mẫu cuối 2026-11-20T07:42:34Z boot=c741f5e6; dòng boot=c741f5e6: 38; dòng boot=18e179e0: 86.
- Cờ T7-152 mtime: 2026-11-20 08:02:00.033364281 +0000; cờ T10-152 mtime: 2026-11-20 08:14:28.041348237 +0000; aggregate 152 mtime: 2026-11-20 08:18:19.471343273 +0000.
- Aggregate 152: 41961 B nay (GAP §81 ghi 36.845 B lúc T10 đóng; khối §12.3 đo được 5328 B gồm ~212 B header/dòng phân cách đã có sẵn lúc đóng).
