# LIMITS — Phase 9 đợt 152, T1: Verify độc lập đợt 151

- **Boot:** `18e179e0` suốt phiên (btime 05:20:57Z — **reboot MỚI sau #42**, xảy ra giữa lúc T10-151 đóng ~05:05Z và lượt cron 152 mở 05:35:51Z; xem F-152-T1-1). Boot lúc T10-151 đóng là `fad2aab9` (#42, btime 03:25:16Z).
- **Verdict: PASS — nội dung đợt 151 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới (trừ 1 sai lệch đếm overlap trong aggregate — F-152-T1-2, không đổi tổng số); suite chạy lại 28/28 exit 0 trên boot mới 18e179e0 (lần đầu suite đầy đủ chạy trên boot sau #43 — lấp khoảng trống F-151-T10-3 theo đúng tinh thần quyết (x) đợt 151); `npm test` 12 pass theo chuẩn đứng mới (w). O8 xác nhận độc lập bằng JSON/log gốc. RAM đỉnh 51,56% (quyết (h)) đã đối chiếu từ log gốc; T2's 34,41% đúng là đỉnh đợt 150, sai cửa sổ. Mù #72?/#73? đóng hoàn toàn đứng theo hồ sơ + quyết parent (b).
- **Caveat lớn (đọc trước):** reboot #43 giữa lúc T10-151 đóng và đợt 152 mở (mù mới mở — giao T2-152, xem F-152-T1-1); headroom 90 chỉ đứng trên bảng T9 (không còn stdout probe thô để đối chiếu độc lập — F-152-T1-5); 2 kẹt thật 85m4 xác nhận từ log gốc; T10-151 không chạy lại toàn bộ suite (F-151-T10-3 — lần verify này lấp đúng khoảng trống đó).

## §1. Đếm cuối — KHỚP TỪNG SỐ, trừ overlap (script mới `count-final-152.py`, dedup toàn cục)

- **Đợt 151 = 10 batch / 16 entry / 16 file (gồm closing) — KHỚP.**
- **Lũy kế 111–151 = 398 / 790 / 670 — KHỚP.**
- **Chờ push 136–151 = 150 / 212 / 173 — KHỚP.**
- **Tái kiểm 111–150 = 388 / 774 / 658 — KHỚP; 111–149 = 378 / 756 / 645 — KHỚP; 111–148 = 368 / 737 / 628 — KHỚP — lần thứ 34 liên tiếp** (T10-151 ghi lần thứ 33, nay +1).
- **Đợt 151 (trước closing) = 9 / 14 / 14 — KHỚP.** Đợt 150 = 10 / 18 / 18; đợt 149 = 10 / 19 / 19 — KHỚP.
- **Purity: 0 lỗi** (1.046 file paths rounds ≤ 151 quét, NUL-delimited, không newline, không entry rỗng; 0 file round 152 lúc chạy script). **0 file thiếu trên đĩa** (16/16 file đợt 151 đều tồn tại dưới `~/workspace/repo-1`).
- **Overlap đợt 151 với 111–150: 4 file, KHÔNG phải 3 — F-152-T1-2** (xem §11). 4 file: `PHASE9_GAP_ANALYSIS.md` (closing, cập nhật §80) + `apps/web/scripts/test-vite-lock-v2.sh` (T6 đổi khối T7) + `apps/web/scripts/vcut-webkit-postboot-check.sh` (T5 sửa cờ) + `server/render/test_integration.sh` (T0 nối V19). Cả 4 đều trùng có lý do (sửa lại file đã có / cập nhật hồ sơ chung, không phải stage trùng vô ý). **Tổng số KHÔNG đổi** (dedup đã tính đúng overlap) — chỉ dòng "Overlap: 3 file" trong aggregate §10.4 là thiếu 1.
- **GAP §80 đã có đính chính 658/161** (quyết (m) đợt 151 — "ĐÍNH CHÍNH GAP §79 ... đúng là 658/161") + ghi đủ đếm cuối đợt 151 (10/16/16; 398/790/670; 150/212/173; tái kiểm 111–150 = 388/774/658). F-151-T1-1 đã đóng.

## §2. Suite chạy lại: 28/28 exit 0 trên boot mới 18e179e0 (lấp F-151-T10-3)

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (05:39:17–05:50:36Z, 11m19s, boot `18e179e0`, RAMavail lúc mở 2.962 MB). Script `round152-t1-verify.sh` (adapt từ T1-151, nhãn echo đã đúng "T1-152 verify start"). Log `round152-t1-suites.log` (957 dòng ✓).
- **`npm test` đầy đủ: 12 pass, 0 fail** — đúng chuẩn đứng mới quyết (w) (11 mục cũ + probe V19 34 assert PASS). Mục mới: `== 5. Probe V19 pixelate geq == ✅ PASS test_v19_pixelate_probe (34 assert geq)`. 11 mục cũ vẫn đủ: unit 7/7, integration — demo_lut/demo_effects/demo_sticker/demo_chroma/demo_transitions/demo_textfx PASS, `test_pixelate_render` 20 case PASS.
- **Hệ quả kiểm chứng thêm:** probe V19 geq 34/34 assert PASS ngay trong suite tích hợp trên boot mới 18e179e0 — xác nhận độc lập claim T0-151 lần thứ hai (T1-151 đã xác nhận trên boot 2e430750).
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676` (sau (A)), test_integration.sh `a6b8cfc0` (sau nối V19) — khớp hồ sơ T10-151 lúc đóng. Cây đã qua 7 boot với cùng md5 preview.tsx (đợt 150: 6 boot; nay + reboot #43).
- **Caveat:** suite chạy trong lúc các luồng đợt 152 khác làm việc song song (T4-152 đo #22, T8-152 harness, T2-152 probe #71 lúc 05:41Z). Tải song song làm suite chậm hơn (11m19s vs 12m14s của T1-151; cả hai đều chậm hơn 5m32s của T10-149 lúc máy yên) nhưng không đổi verdict. Không file lõi nào đổi giữa phiên mà suite chạm tới — md5 6 file trên không đổi trước/sau suite.

## §3. O8 — Xác nhận độc lập bằng JSON/log gốc (không chạy O8 riêng)

- File gốc `hidden_files/round151-t8/o8-webkit/o8w-clicktest-report.json`: **21 kết quả, 21 ok=true, 0 fail** (kiểm bằng python — JSON không có trường total/ok/fail ở top-level, chỉ `results` + `logLines`; T10-151 §10.2 mô tả "total 21 ok 21 fail 0" là cách diễn đạt lại, không phải trường JSON thật — xem F-152-T1-4).
- File gốc `hidden_files/round151-t8/o8-chromium/o8-clicktest-report.json`: **21 kết quả, 21 ok=true, 0 fail**.
- Driver log `o8-151t8.log`: **10 dòng** "21/21 pass"; WebKit attempt1 exit=0 03:17:43Z, attempt2 exit=0 03:18:32Z, Chromium exit=0 03:19:21Z, `O8 DONE 03:19:21Z webkit1=0 webkit2=0 chromium=0`, boot 2e430750, preview.tsx 530e10a7.
- **Gate (chuẩn đứng (i)):** cờ T4 mtime **03:16:05Z** → waiter `GATE-FOUND poll=36 03:16:15Z` (`smoke/wait-t4-t5.log`, đường a, postboot round151-t5) → O8 driver start 03:16:53Z, sau lượt yên hợp lệ #19 của T4 (attempt2 02:58:32–03:02:25Z). **Chuỗi WebKit FULL PASS 8 → 9 — ĐÃ XÁC NHẬN ĐỘC LẬP** (lần thứ ba liên tiếp có xác nhận độc lập: T10-151 + T1-152; quyết parent (l) đợt 151 đã xác nhận).
- **Caveat F-151-T10-2 XÁC NHẬN LẠI:** chỉ có JSON WebKit cuối cùng trên đĩa — mtime JSON WebKit 03:18:31Z = attempt2 (exit 03:18:32Z); attempt1 chỉ còn verdict trong log driver (hai lần chạy ghi đè cùng đường dẫn). Chuỗi 8 → 9 vẫn đứng vì cả hai lần đều 21/21 trong log. Nợ (nợ §11.14 aggregate 151: T8 giữ JSON riêng từng lần chạy) đã giao T0-152.

## §4. T0 — V19 đứng; test_integration.sh §5 còn nguyên

- File probe `server/render/src/test_v19_pixelate_probe.js` tồn tại (22.057 B, mtime 00:01Z 20/11), md5 `fb392111…` — khớp T0-151, không đổi. `bench_pixelate_geq.sh` (3.229 B, mtime 00:02Z). `effects.js` md5 `fedc0141` không đổi.
- `server/render/test_integration.sh` dòng 94–99 còn nguyên §5 "Probe V19 pixelate geq (đợt 151: nối vào suite theo quyết parent (j) đợt 150)" + chú thích "INTEGRATION ĐỔI 11 → 12". md5 `a6b8cfc0` — khớp T10-151 lúc đóng.
- **V19 34/34 assert PASS trong suite tích hợp đợt này** (xem §2) — kiểm chứng live trên boot 18e179e0, không chỉ đối chiếu LIMITS.
- T1 không chạy lại probe/bench độc lập (suite tích hợp đã bao phủ probe; bench là đo hiệu năng 1 lần, không có ý nghĩa chạy lại giữa phiên đợt 152).

## §5. T2 — Probe #70 + mù #72?/#73? đóng hoàn toàn: đứng theo hồ sơ + quyết parent (b)

- **Probe EPERM #70: log `eperm-probe-v2.log` đúng 202 dòng tại lúc T2-151 đóng** (đếm lại trực tiếp: dòng 199 `probe#69 boot=e9295700 ok=2 fail=0` 23:44:57Z 19/11; dòng 200 DEAD 02:40:04Z; dòng 201 boot-changed e9295700 → 2e430750; dòng 202 `probe#70 boot=2e430750 ok=2 fail=0` 02:40:07Z — khớp claim "199 → 202 (+3 đúng mẫu)"). 1 dòng `probe start`, 0 dòng `=== probe end` — khớp.
- **Log nay 205 dòng — KHÔNG phải lệch:** 3 dòng mới (203–205) là probe #71 của đợt 152 (DEAD #70 05:41:14Z + boot-changed 2e430750 → 18e179e0 + `probe#71 boot=18e179e0 ok=2 fail=0` 05:41:18Z) — đúng mẫu +3, trên boot mới #43. T2-151 đếm đúng tại thời điểm đóng.
- **Mù #72?/#73? đóng hoàn toàn → CERT 72/73 / FULL 87/88, chuỗi đóng hoàn toàn 7 → 9:** parent đã **XÁC NHẬN** ở quyết (b) đợt 151 — T1 chỉ đối chiếu hồ sơ, không đạo lại merged gap. Đối chiếu điểm: file `blind72-gaps.txt` ghi trực tiếp "max gap 380s, floor 1147s, max hidden = 0" (G-full) và "max gap 702s" (H); "F'-body max gap (excl tail): 1014s" — khớp claim. Gap #40 [7.696, 7.700] s giữa 7.698 s; gap #41 [6.820, 6.824] s giữa 6.822 s — khớp T2 LIMITS §2.2/§2.5.
- **RAM đỉnh 34,41% của T2 là số ĐÚNG cho cửa sổ mù, SAI nếu đọc là đỉnh đợt 151** (xem §10 — quyết (h) đã chốt).

## §6. T4 — #22 có lượt hợp lệ #19: đếm lại từ log gốc khớp

- `poll-t4.log`: **27 dòng** = 1 dòng start + **18 dòng poll thật #1–#18** (02:40:46–02:58:32Z) + 8 dòng trạng thái (2 `CUA YEN MO`, 2 attempt-xong, 1 RETRY, 1 attempt1-B-vi-phạm, 1 header retry, 1 kết luận). Aggregate §4 ghi "18 dòng poll thật" là đếm đúng theo dòng poll (không phải tổng dòng file) — không lệch.
- **Retry live (quyết (h) đợt 150) CÓ THẬT:** poll #8 02:51:00Z ghi `t5flag=PASS` (lần đầu cờ T5 được nhận làm gate chính sau sửa F-151-T5-1 — poll #1–#7 vẫn `t5flag=cu`); load5 hạ 5,71 → 1,81 qua poll #8–#18; `CUA YEN MO poll #18 02:58:32Z` → attempt2 chạy ngay.
- **Attempt2 (lượt hợp lệ #19): 20/20 + LỚP B ĐẠT 5/5 + tickCost median=39,0 ms ≤ 60** — ghi trực tiếp trong poll log dòng cuối ("LUOT HOP LE, thoat poller"). Attempt1 20/20 nhưng lớp B vi phạm (nhiễm tải — suite T1 + T2 blind72 + mask_anim.py) — không tính verdict, đúng quy tắc.
- Cộng dồn (c2) 19 lượt (P3' 32/34 — lần đầu không tròn, theo dõi theo quyết (n) đợt 151): đứng theo hồ sơ T4; T1 không đạo lại từng pass P1/P2/P3/P7 (phạm vi T4; file analyze attempt2 có đủ trên đĩa).

## §7. T5 — Cờ postboot + replay: đứng theo file gốc

- File cờ `hidden_files/round151-t5/POSTBOOT_PASS` tồn tại, nội dung khớp claim: boot 2e430750 (btime 01:25:51Z, #41), replay TỚI TỰ NHIÊN (dpkg 1.545 dòng, hoạt động đầu 01:26:35Z boot+44s, cài xong 01:30:13Z boot+4m22s, gói cuối gstreamer1.0-tools), cache APT SỐNG 178 .deb/156M, lists 37 (1 mirror azure), postboot PASS poll2 02:40:23Z, cờ ghi full boot_id 02:48:41Z (sửa F-151-T5-1).
- `dpkg_lines=1545` được corroborate độc lập: cả 18 dòng poll của T4 đều ghi `dpkg_lines=1545`.
- `replay-watch-151.log`: poll cuối 03:25:21Z trên boot 2e430750 — watcher chết theo reboot #42 (btime 03:25:16Z); poll 03:25:21Z muộn hơn btime boot mới 5 s là dấu đồng hồ đã biết trong cửa sổ #42 (xem F-152-T1-6 — T5-152 đối chiếu, không phải lỗi hồ sơ 151).
- T1 không kiểm lại apt/dpkg internals (phạm vi T5; đã có 4 luồng ghi chéo cùng mốc giờ ở đợt 151).

## §8. T6 — Lock khỏe lúc đóng; log đã dài thêm sau đóng (dữ kiện đợt 152)

- **Chạy lại script của chính T6 trên log đóng băng:** `analyze-log.py` trên `vite-lock-v2-cleaned-close.log` (1.399 dòng) cho đúng số T6: **ACQUIRED=407, RELEASED=399, pairs 399, still held 0, double-acquire 8** — tái hiện chính xác, không cộng tay.
- **Log lock chính thức `vite-lock-v2.log` lúc kiểm: 1.443 dòng, ACQUIRED 420 / RELEASED 411, pairs 411, still held 0, double-acquire 9** (chạy lại script `analyze-log.py` của chính T6 trên log live). So với lúc T6 đóng (pairs 399, double-acquire 8): +12 pairs đều là hoạt động đợt 151 sau snapshot của T6 (t4 attempt2 acquire 02:58:32Z + t8 O8/harness 03:16–04:48Z; dòng cuối log là `t8-round151 RELEASED` 04:48:03Z); **0 entry round152** trong log lúc kiểm. Ca double-acquire thứ 9 là `t8-round151-test STALE-LOCK 03:27:07Z` (owner pid 62907 chết theo reboot #42 — đúng mẫu F-151-T1-4, đã phục hồi sạch). **Không có lock nào đang giữ lúc kiểm.**
- **Queue lock lúc kiểm: 102 file** — khớp số T10-151 lúc đóng (100 sau prune + 2 cooldown T8-round151).
- **Prune lần 26:** file `prune-deleted.txt` ghi xóa `cooldown-s4-w3` + `cooldown-s4-hold2` — khớp claim.
- (A) đã triển khai: `test-vite-lock-v2.sh` md5 `a89c0676` — khớp T10-151 lúc đóng; T1 không chạy lại 120 lần kiểm chứng churn (phạm vi T6; đã có 120/120 PASS trong LIMITS T6-151 + quyết (v) đợt 151 xác nhận (A) là khóa chính thức).

## §9. T8 — 2 kẹt thật 85m4: xác nhận từ log driver gốc

- **Kẹt 1 (85m4, boot 2e430750, bị reboot #42 giết giữa lúc kẹt):** `smoke/partial-boot-2e430750/run-webkit-85m4.log` dòng 26–27: `[HB128] sampleFor P5-phaseB-long ... n=3/200 lastCt=2.135 lastPlayhead=0` lúc 03:24:14Z và 03:24:19Z (5 s không tiến triển); thư mục diag `stall-sampleFor-P5-phaseB-long-1795145109` (epoch = 03:25:09Z = giờ watchdog) có đủ README/dmesg/meminfo/ps — khớp claim. Không có exit code (bị reboot giết) — đếm là kẹt thật theo chữ ký playhead + watchdog, đúng như aggregate đã ghi rõ.
- **Kẹt 2 (85m4, boot fad2aab9, DEBROOT):** `smoke/run-webkit-summary.txt` dòng 42 `--- webkit 85m4 exit=124 end 03:56:39Z ---`; dòng 118 `ALL DONE ... ec webkit: 84l10=0 85m4=124 86n2=0`; `smoke/run-webkit-85m4.log` dòng 23 watchdog probe TIMEOUT 03:43:20Z — khớp claim (watchdog 03:42:50Z + probe TIMEOUT 03:43:20Z theo T8 LIMITS; T1 thấy dòng probe trong log, giờ watchdog lấy theo LIMITS).
- **Chromium 3/3 PASS** (lần 2) + 84l10 PASS cả hai lần — khớp aggregate; N đối chứng Chromium cộng dồn N=13 mỗi pha đứng theo hồ sơ T8.
- **H3-D1 bác bỏ:** đứng theo hồ sơ T8 + quyết parent (f) đợt 151 — T1 không đạo lại phân tích RSS/CPU (phạm vi T8).
- T8 LIMITS 56.837 B — khớp §10.1 (oversize, push cần `ENABLE_PRIVSEP=0`). T1 không chạy lại harness/O8 (ngoài phạm vi verify; O8 đã xác nhận độc lập ở §3).

## §10. T9 — RAM đỉnh 51,56% + min kỷ lục + balloon 31 mẫu: đếm lại từ log gốc khớp

- `ram-sampler.log`: **134 dòng** — khớp 134 mẫu. Chạy `awk` trực tiếp trên cột `mem=`: **max avail 3.243.888 kB lúc 03:03:31Z = 51,56% guard 6.291.456 kB; min avail 250.840 kB lúc 03:56:18Z** — khớp đúng số T9.
- **Quyết (h) đợt 151 ĐÃ ĐÚNG:** RAM đỉnh đợt 151 là **51,56% (T9)**. Số 34,41% của T2-151 là đỉnh đợt 150: file `ram-max.txt` của T2 đọc `round150-t9/ram-sampler.log` (đỉnh 00:09:35Z, boot e9295700, 2.164.956 kB) — T2 LIMITS §(g) tự ghi rõ nguồn là "T9-150 sampler", nên số 34,41% đúng cho cửa sổ mù của T2, chỉ sai khi đọc thành đỉnh đợt 151. Không còn tranh chấp.
- **Balloon ghim trần 31/134 mẫu:** đếm dòng `bal=6443824` = **31 dòng** — khớp. T8 đo min 253 MB trong cùng cửa sổ kẹt corroborate min 250.840 kB của T9 (chênh lệch do thời điểm lấy mẫu khác nhau).
- **B2: 13 spike** — `grep -c SPIKE b2-spikes.log` = **13**; tổng file 606 dòng — khớp claim 13 spike (T1 không attribution từng spike — phạm vi T9).
- **Headroom 90 — ĐỨNG THEO BẢNG, KHÔNG CÓ LOG THÔ ĐỂ ĐỐI CHIẾU ĐỘC LẬP (F-152-T1-5):** T9 LIMITS §1.2 ghi 4 lần đo (194/194 lúc mở 02:40:42Z boot 2e430750; 90/90 lúc đóng 04:52:32Z boot fad2aab9; chênh 0 mỗi cặp; probe dừng đúng errno 28); trần 63.747 không đổi; tỉ lệ/vite 0,057. 4 file `headroom-probe*.err` đều 0 byte, không còn stdout probe thô nào trên đĩa; T5 không probe lại đợt này (tránh nhiễu T4). T1 KHÔNG đo lại headroom (số đo cùng thời điểm không tái tạo được — headroom hiện tại thuộc về T9-152 trên boot mới). Phương pháp không đổi từ đợt 109 + 2 lần đo chênh 0 mỗi cặp là cơ sở để chấp nhận số 90; đề nghị T9-152 lưu stdout probe thô.
- Birefnet 0 thử lần thứ 5: đứng theo hồ sơ (0/134 mẫu ≥ guard — awk trên log gốc: 0 mẫu mem ≥ guard; cơ chế (a) armed trừ gap 46 s tại #42 theo T9 LIMITS).
- T9 LIMITS 59.786 B — khớp §10.1 (oversize).

## §11. Sai lệch phát hiện (F-152-T1-N — kể cả nhỏ)

- **F-152-T1-1 — Reboot #43 MỚI giữa lúc T10-151 đóng và đợt 152 mở.** Boot hiện tại `18e179e0` (btime 05:20:57Z); T10-151 đóng ~05:05Z (mtime cờ round151-t10.done 05:04:22Z) trên boot `fad2aab9` và ghi "không reboot nào sau #42". Reboot xảy ra trong cửa sổ (05:04:22Z, 05:20:57Z], trước khi lượt cron 152 mở 05:35:51Z. Hệ quả: (a) suite verify này chạy trên boot mới — tốt cho tính độc lập; (b) mở mù mới (mù #75? — T2-152 xác nhận số hiệu; brief T2-152 chỉ ghi mù #74? + khung #117? — cần mở rộng phạm vi); (c) run 151 (đã bị viết lại started_at ở #42, hạn ngân sách 05:35:51Z) lại bị reboot #43 đánh trúng lúc 05:20:57Z — kết cục thuộc T7-152, có thể thêm 1 lần viết lại started_at (n=4 → 5?); (d) probe #71 đã chạy trên boot mới 05:41:18Z (ok=2 fail=0) — bằng chứng boot mới đã được T2-152 thăm dò. Không ảnh hưởng verdict đợt 151 (mọi dữ kiện 151 đã đóng trước #43).
- **F-152-T1-2 — Aggregate §10.4 ghi overlap đợt 151 là 3 file, đúng là 4.** Aggregate liệt kê 3 file pre-closing (test-vite-lock-v2.sh, vcut-webkit-postboot-check.sh, test_integration.sh) mà quên `PHASE9_GAP_ANALYSIS.md` trong file closing (cập nhật §80 — GAP đã stage ở mọi đợt 111–150 nên trùng là đương nhiên). Script dedup mới của T1-152 cho 4. **Tổng số không đổi** (398/790/670, 150/212/173 đều khớp — dedup tính đúng). Lỗi ghi chép trong hồ sơ đã đóng; đề nghị T10-152 ghi chú vào GAP §81 (cùng mẫu F-151-T1-1 → GAP §80). Bài học: dòng overlap trong aggregate phải lấy từ output script, không liệt kê tay (cùng gốc với bài học đứng đợt 150).
- **F-152-T1-3 — Aggregate tăng kích thước sau đóng: 50.009 B lúc T10 đóng → lớn hơn sau khi parent viết §12.3 (a)–(x).** Cùng mẫu F-151-T1-5 (đợt 150: 105.401 → 116.389 B). Không phải lỗi.
- **F-152-T1-4 — T10-151 §10.2 mô tả JSON O8 là "total 21 ok 21 fail 0" trong khi JSON thật không có các trường đó.** JSON gốc chỉ có `results` (21 phần tử, mỗi phần tử `ok: true`) + `logLines`. Số 21/21 vẫn đúng (T1 đếm lại bằng python), chỉ cách mô tả trường là không chính xác. Không ảnh hưởng chuỗi FULL PASS 8 → 9.
- **F-152-T1-5 — Headroom 90 không có stdout probe thô để đối chiếu độc lập** (xem §10). 4 file `headroom-probe*.err` 0 byte; số chỉ có trong bảng T9 LIMITS §1.2. Không phải lỗi số liệu (phương pháp + 2 lần đo chênh 0 ủng hộ), nhưng là khiếm khuyết bằng chứng — đề nghị T9-152 lưu stdout probe.
- **F-152-T1-6 — Poll cuối của watcher replay-watch-151 đóng dấu 03:25:21Z, muộn hơn btime reboot #42 (03:25:16Z) 5 s.** Watcher chạy trên boot cũ 2e430750; poll 03:25:21Z có thể đã ghi ngay trước khi chết với đồng hồ lệch ~5 s trong cửa sổ chết (cùng họ nghịch lý đồng hồ đã biết ở #41/#42). T5-152 đối chiếu `replay-watch-151.log` theo quyết (q) đợt 151 — T1 chỉ ghi nhận, không phán.
- **F-152-T1-7 — Phạm vi kiểm có giới hạn (cùng mẫu F-151-T1-6).** T1 kiểm độc lập: đếm cuối (script mới), suite đầy đủ 28/28, O8 (JSON/log gốc), cây md5, log probe/poll/sampler/B2/lock/harness (đếm lại từ file gốc). Các claim T2 (merged gap/sessions/hole-recheck chi tiết, INSIDE), T7 (scheduler DB, run 150 SUCCEEDED), T5 (apt/dpkg internals), T9 (attribution từng spike, balloon episode), T6 (120 lần kiểm soát churn), T0 (bench 36 cấu hình chi tiết) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. /tmp trước reboot #42 đã mất theo reboot.
- **F-152-T1-8 — Sai số của chính T1-152 (ghi trung thực):** (a) lúc đầu đếm `poll-t4.log` bằng `wc -l` được 27 dòng và suýt ghi lệch với claim "18 dòng" của aggregate — thực ra 18 là số dòng poll (`grep -c "^poll #"`), 27 là tổng dòng file; đã sửa trước khi kết luận (§6). (b) lúc đầu `md5sum media.ts` sai đường dẫn (`src/lib/media.ts` thay vì `src/media.ts`) — đã sửa, md5 đúng `2c384ed1` (§2). (c) lúc đầu đếm `eperm-probe-v2.log` được 205 dòng và suýt ghi lệch với claim "202 dòng" của T2 — thực ra 3 dòng mới là probe #71 của đợt 152 (05:41Z); đã kiểm tra ranh giới dòng 199–205 trước khi kết luận (§5).

## §12. Tổng hợp + giao tiếp

- **Verdict: PASS.** Nội dung đợt 151 đứng vững toàn bộ trên boot mới 18e179e0: đếm khớp lần thứ 34 liên tiếp; suite đầy đủ 28/28 (lấp khoảng trống F-151-T10-3); O8 21/21 ×2 + 21/21, chuỗi FULL PASS 8 → 9 xác nhận độc lập lần thứ ba; RAM đỉnh 51,56% (quyết (h)) đối chiếu từ log gốc; mù #72?/#73? đóng hoàn toàn đã được parent xác nhận (b); GAP §80 đã đính chính 658/161. Hai sai lệch ghi nhận (F-152-T1-1 reboot #43, F-152-T1-2 overlap 4 thay vì 3) đều không đổi verdict đợt 151 — F-152-T1-1 thuộc về đợt 152 (mù mới + kết cục run 151), F-152-T1-2 là lỗi ghi chép trong hồ sơ đã đóng, đề nghị T10-152 ghi chú vào GAP §81.
- **Verdict CHẤP NHẬN đợt 151 (quyết parent (a)) KHÔNG ĐỔI.**
- **Nợ chuyển đợt 152 (đã có chủ, T1 chỉ nhắc lại + bổ sung từ F-152-T1-1):** mù #74? giao T2-152 (quyết (k)) + **mù mới sau reboot #43 giao T2-152 (mở rộng phạm vi)**; kết cục run 151 thuộc T7-152 (quyết (t)) + **reboot #43 đánh trúng run 151 trước hạn 05:35:51Z**; H3 chỉ giám sát thụ động T8-152 (quyết (f)); headroom + balloon episode fad2aab9 giao T9-152 (quyết (e)) — lưu ý headroom đợt 151 không có stdout probe thô (F-152-T1-5); JSON O8 riêng từng lần chạy giao T0-152 (F-151-T10-2); sửa `elif` poller giao T4-152 (quyết (r)); G1/R9/ci-security.yml/TTS 39 giữ nguyên theo quyết đứng.
- **Cây lúc đóng verify:** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141`, test-vite-lock-v2.sh `a89c0676`, test_integration.sh `a6b8cfc0` — không đổi suốt đợt 151 + verify 152. Boot `18e179e0` ổn định, không reboot trong phiên T1. Lock vite: 0 lock của đợt 151 đang giữ lúc kiểm. 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 05:50:36Z`). 3 socket Xvfb mồ côi do suite tạo (X193–X195, 0 process sống) đã dọn tay + kiểm lại `/tmp/.X11-unix/` trống.
- **File LIMITS này:** `docs/PHASE9_ROUND152_T1_VERIFY151_LIMITS.md` (dưới trần 37.768 B — xem cờ). Stage `phase9-round152-t1-verify151.txt` (1 entry NUL, od OK). Cờ `round152-t1.done` viết trước khi báo đóng.

**Tổng batch đợt 151 (tái kiểm): 10 batch / 16 entry / 16 file duy nhất.**
**Lũy kế 111–151: 398 batch / 790 entry / 670 file.**
**Tổng batch chờ user push (đợt 136–151): 150 batch / 212 entry / 173 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)
