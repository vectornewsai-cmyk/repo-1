# PHASE9_ROUND137_T4_WEBKIT_QUIET14_LIMITS — Lượt yên WebKit #14 ĐO ĐƯỢC (LƯỢT QUYẾT ĐỊNH): 20/20 pass, median tickCost 59,0 ms — DƯỚI ngưỡng ≤60 ms nhưng chỉ còn biên 1 ms (CAO NHẤT trong 12 lượt yên hợp lệ, lần thứ 2 liên tiếp ≥55 ms); (c2)=6 occurrence / 5 seq, coverage 6/6, F6' ĐÓNG lần 3 liên tiếp

> **Verdict: LƯỢT YÊN #14 ĐO ĐƯỢC — 1 attempt hợp lệ (attempt1, 20/20 pass, trên boot mới 17db9652 sau 1 reboot giữa phiên T4). tickCost total median 59,0 ms (n=518, p90 81,0, max 114, min 30) — DƯỚI ngưỡng ≤60 ms, ngưỡng GIỮ NGUYÊN theo luật (không đổi từ lượt đơn), nhưng biên chỉ còn 1 ms và đây là median CAO NHẤT trong 12 lượt yên hợp lệ, lần thứ hai liên tiếp ≥55 ms (lượt #13: 58,0 ms) — đúng điều kiện quyết parent đợt 136 §12.3(c) bàn lại ngưỡng/bar hay điều tra tải song song. (c2)=6 occurrence / 5 seq riêng biệt (145 lag 2f + lag 1f, 265/327/368/389 lag 1f), coverage log draw 6/6. Lớp B 5/5 ĐẠT. Logger đã nới tiếp tục ghi tốt ở runtime (c2DrawLog n=996, loop 1–21, 20 wrap, blendTick hậu-flip 296/296 trong ±500 ms của log). F6' ĐÓNG lần thứ ba liên tiếp (51/51 tick không vi phạm thật).**
> **Điểm mới cho T3 (lượt quyết định): (c2) lần này GIÀU mẫu (n=6 occurrence, so với n=1 lượt #13 và n=7 lượt #12) — đủ sức mạnh thống kê hơn để quyết verdict; NHƯNG có 1 occurrence lag 2f đầu tiên trong chuỗi (seq 145, presented 17, label 15, lag 2) trong khi mọi (c2) trước đây đều +1f — T3 tự đánh giá theo prereg (P5/P6 giữ nguyên, không nới khoảng giữa chừng).**

## Kết quả chính

1. **Attempt1 HỢP LỆ, 20/20 pass, trên boot mới 17db9652 (không reboot trong lúc đo):** cửa mở poll #10 boot mới 09:44:26Z (RAM 1134 MB) → vite :5187 lên, probe chạy 09:44–09:47Z → JSON 2.780.813 B ghi 09:45Z → analyzer + class-B xong 09:48:32Z, **run-attempt exit=0**. Boot 17db9652 xuyên suốt attempt (09:44:26Z → 09:48:32Z), 0 reboot trong lúc đo.
2. **tickCost median 59,0 ms — ngưỡng ≤60 ms GIỮ (biên 1 ms):** total n=518 median 59,0 / p90 81,0 / max 114 / min 30; hậu flip+2000 ms n=378 median 58,0. Wallbands: 0–20k 58,0 / 20–32k 63,0 / 32–45k 57,0 / 45–62k 59,0 / 62–70k 62,5 / 70–80k 56,0 ms — cao đều mọi dải (đợt 136: 52,0–64,0 ms). Chuỗi 12 lượt yên hợp lệ nay: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / **59,0** — trung bình 48,3 ms (trước đây 47,3 ms với 11 lượt).
3. **(c2)=6 occurrence / 5 seq, coverage 6/6:** seq 145 (2 occurrence: lag 2f + lag 1f), 265/327/368/389 (lag 1f). lag5: 0 event lag ≥+5f. skippedLatest=1: 0 vi phạm thật (51/51 tick không vi phạm, pixel-verified 100%) — **F6' ĐÓNG lần 3 liên tiếp** (đợt 135: 75/75; đợt 136: 77/77).
4. **Logger đã nới tiếp tục ghi tốt:** c2DrawLog n=996 (drawSrc 518 / rawUnit 478; stage plain-native 518 / rawUnit 478; srcKind 'canvas 1280x720' 996/996; readyState 4 996/996; seeking False 996/996); **byLoop {1:44, 2:50, 3:54, 4:54, 5:46, 6:48, 7:46, 8:46, 9:48, 10:50, 11:54, 12:42, 13:50, 14:60, 15:48, 16:52, 17:53, 18:1, 19:50, 20:48, 21:52}** — loop 1–17 và 19–21 đầy đủ (loop 18: 1 entry biên tại wrap — xem §6); frameIdx 0–69 (distinct 59); wallMs span 72.344 ms (11652→83996); **wraps=20**; 1 epoch duy nhất, loopNo [1..21]. **Coverage (c2) 6/6** (delta −25/−25/−23/−23/−26/+46 ms); blendTick hậu-flip trong ±500 ms của log: 296/296 (100%).
5. **Lớp B 5/5 ĐẠT:** B1 load5 cuối 1,32 (≤2,5); B2 load1 max 2,55 (≤4; sampler n=11); B3 không reboot trong lúc đo (boot lúc bắt đầu = boot hiện tại 2026-11-18 09:36:01); B4 0 apt/dpkg lúc đánh giá; B5 RAM giữa lượt min 1056 MB, 0 mẫu <500 MB, 0 mẫu <1024 MB.
6. **Histogram (t4-histogram-with14.py, chạy trên JSON đợt 137):** nGhost 592; hist (pixFrame−label) {-14: 5, -13: 2, -11: 6, -10: 8, -9: 2, -4: 2, -3: 2, -1: 54, 0: 207, +1: 83, +2: 118, +3: 96, +4: 7} — 0: 35,0%, +1/+2: 34,0%, +3: 16,2%, ≥+3: 17,4%, <0: 13,7%; snapMs−labelMs median 50 ms (mean 49,9, p90 71); rawMs−labelMs median 9 ms. CurPix run đồng cung ≥3 tick: 22 run. So với đợt 136: đuôi +3 tăng tiếp (14,2% → 16,2%), đuôi âm tăng (10,1% → 13,7%), snapMs−labelMs median giảm nhẹ 52 → 50 ms — nhất quán với tickCost median tăng nhẹ 58,0 → 59,0 ms.
7. **Reboot giữa phiên T4 (xem §4):** boot 2104246b (btime 08:07:11Z) chết trong khung (09:35:47Z, 09:37:05Z] (78 s); boot mới 17db9652 btime 09:36:01Z. Poller chết theo reboot; T4 phát hiện 09:37:05Z và khởi động lại poller 09:37:39Z. Không mất dữ liệu đo (chưa có attempt nào chạy trên boot cũ). **Gate 0 + Gate A mở ngay poll #10 boot mới (lần mở duy nhất, không bỏ lỡ):** T5 flag b91 PASS 09:43:47Z (poll=6, boot 17db9652); 10 poll boot mới, 09:37:39–09:44:26Z; RAM 1134–1847 MB suốt thời gian chờ boot mới. Tổng cộng 79 poll (69 boot cũ + 10 boot mới); cửa mở 1 lần; 1 attempt hợp lệ.

## 0. Môi trường đo + prereg + cây đo

- **Brief T4 đợt 137:** lượt yên #14 LÀ LƯỢT QUYẾT ĐỊNH cho điều tra (c2) (quyết parent đợt 136 §12.3(a)); prereg P5/P6 GIỮ NGUYÊN (quyết §12.3(b)); ngưỡng ≤60 ms GIỮ, nếu median vẫn ≥55 ms thì báo rõ median + load1/RAM lúc đo để parent bàn lại (quyết §12.3(c)); log ps snapshot khi blockers>0 là LUẬT BẮT BUỘC (quyết §12.3(h)); kiểm boot_id/btime khớp trước khi dùng bất kỳ cờ/logger nào (cờ postboot cũ của boot 1ca1feaa KHÔNG còn hiệu lực); kiểm md5 preview.tsx = 530e10a7 trước khi đo, nếu khác thì DỪNG và báo parent, không tự sửa cây; ghi rõ mọi sai số theo mẫu F-137-T4-n; TUYỆT ĐỐI KHÔNG revert preview.tsx.
- **Probe tái dùng nguyên bản đợt 133:** `hidden_files/round137-t4/probe121t3-ghost-k7.webkit.mjs`, md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp bản đợt 132/133/134/135/136), `node --check` OK. Analyzer đã dry-run PASS trên dữ liệu đợt 136 trước khi đo (tái tạo đúng median 58,0 / (c2) seq 334 lag 1f / c2DrawLog byLoop {1:36, 2:58, …, 21:54} — xem §8).
- **Script đợt 137 adapt từ đợt 136:** copy toàn bộ script + analyzer, `sed 136→137`, sửa deadline poller 07:30Z → 10:30Z (đợt 137 mở 08:35Z, T10 đóng dự kiến ~11:00Z — xem §5 F-137-T4-4), sửa nhãn histogram "luot #13" → "#14" + entry RUNS sang JSON đợt 137, **thêm log ps snapshot khi blockers>0 vào poller** (quyết §12.3(h)). Kiểm sau adapt: `grep -rn "136"` trong script = 0 kết quả (trừ chuỗi "dot 13x" trong comment lịch sử); `bash -n` OK cả 4 script; `python3 -c ast.parse` OK 8 analyzer; xác nhận bằng `ls` rằng poller gọi đúng `run-attempt-137.sh`.
- **Cây đo:** `preview.tsx 530e10a7` (fix logger đã nới, GIỮ theo quyết parent §12.3(a) đợt 136 — kiểm lại lúc mở đợt 08:42Z = 530e10a7, lúc đóng 09:50Z vẫn 530e10a7), `media.ts 2c384ed1`, `vite.config.ts ee80d093` (khớp cây đợt 136). T4 KHÔNG sửa file production nào.
- **Chốt chặn round-in-progress.md:** KHÔNG tồn tại lúc T4 bắt đầu (log mở đợt 137 đã ghi) — lượt này chạy bình thường.
- **Boot lúc mở đợt:** 2104246b-af3b-... (btime 08:07:11Z theo /proc/stat, khớp brief); **reboot giữa phiên** sang 17db9652 (btime 09:36:01Z) — xem §4. RAM available lúc mở ~905 MB (08:40Z), vọt lên 2.421 MB lúc poll #1 boot cũ (08:44:34Z) — balloon xả sau boot, rồi tụt dần về ~492 MB trước reboot (balloon phồng lại tới 6,28 GB, xem §3).

## 1. Gate 0 — ĐẠT 09:43:47Z trên boot mới 17db9652 (T5 watcher b91, poll 6)

| Điều kiện | Kết quả |
|---|---|
| (0a) T5 flag `round137-t5/POSTBOOT_PASS` khớp boot | **PASS** — `boot_id=17db9652-ad06-409f-989c-cdbdba15d0af btime=2026-11-18T09:36:16Z pass_at=2026-11-18T09:43:47Z poll=6` (T5 watcher b91). Cờ b90 của boot cũ (2104246b) KHÔNG BAO GIỜ xuất hiện — watcher b90 chết theo reboot lúc replay còn dở (xem §3). Btime trong cờ (09:36:16Z) chênh 15 s với /proc/stat (09:36:01Z) — cùng mẫu đợt 136 (16 s), cùng boot_id, xem §4. |
| (0b) check-only postboot riêng PASS | **PASS exit 0 từ poll #5 boot mới** (09:40:40Z) và mọi lần kiểm sau. Trên boot cũ exit 1 suốt 69 poll (replay apt chưa xong). |
| (0c) apt-get/dpkg = 0 (pgrep -x) | **0/0 từ poll #7 boot mới** (09:42:11Z). Lúc cửa mở: 0. |
| (0d) cây md5 == tree-md5.txt (530e10a7) | **YES suốt lượt** — preview.tsx 530e10a7 (kiểm lại lúc đóng 09:50Z vẫn 530e10a7). |

## 2. Gate A — MỞ 1 LẦN (poll #10 boot mới, không bỏ lỡ)

### Poller — boot cũ 2104246b (69 poll, 08:44:34Z–09:35:47Z, 0 lần mở)

| Poll | Thời gian | RAM | load1/load5 | lock | blockers | cây | t5flag | postboot |
|---|---|---|---|---|---|---|---|---|
| #1 | 08:44:34Z | 2421 MB | 1,81 / 1,47 | không | 0 | YES 530e10a7 | chua-co | 1 |
| #2 | 08:45:20Z | 2275 MB | 1,47 / 1,42 | không | **2** | YES | chua-co | 1 |
| #3–#5 | 08:46:05–08:47:35Z | 2080→1657 MB | 0,84–1,25 / 1,23–1,26 | không | 0 | YES | chua-co | 1 |
| #6–#9 | 08:48:21–08:50:36Z | 1587→1214 MB | 0,68–1,39 / 1,10–1,25 | không | 0 | YES | chua-co | 1 |
| #10–#12 | 08:51:21–08:52:52Z | 1133→1279 MB | 1,09–1,59 / 1,20–1,31 | không | 0 | YES | chua-co | 1 |
| #13–#20 | 08:53:37–08:58:54Z | 1400–5921 MB | 0,77–3,00 / 1,17–2,20 | không | 0 | YES | chua-co | 1 |
| #21–#26 | 08:59:39–09:03:25Z | 5517–6693 MB | 0,77–2,62 / 1,61–2,20 | không | 0 | YES | chua-co | 1 |
| #27–#32 | 09:04:10–09:07:56Z | 3740–5271 MB | 0,53–1,16 / 1,11–1,49 | không | 0 | YES | chua-co | 1 |
| #33–#40 | 09:08:41–09:13:57Z | 2477–3939 MB | 0,28–1,84 / 0,86–1,37 | không | 0 | YES | chua-co | 1 |
| #41–#49 | 09:14:42–09:20:44Z | 1165–2321 MB | 0,08–1,00 / 0,46–0,92 | không | 0 | YES | chua-co | 1 |
| #50–#52 | 09:21:29–09:22:59Z | 858–1062 MB | 0,16–0,35 / 0,46–0,48 | không | 0 | YES | chua-co | 1 |
| #53–#60 | 09:23:44–09:29:01Z | 609–1060 MB | 0,24–1,02 / 0,43–0,68 | không | 0 | YES | chua-co | 1 |
| #61–#66 | 09:29:46–09:33:32Z | 522–574 MB | 0,16–0,56 / 0,39–0,53 | không | 0 | YES | chua-co | 1 |
| #67–#69 | 09:34:17–09:35:47Z | 526→492 MB | 0,37–0,79 / 0,43–0,52 | không | 0/1/0 | YES | chua-co | 1 |

- Poll #1–4 boot cũ: replay apt của T5 còn chạy (apt=1–2, dpkg 2→1471), postboot exit 1, gate 0 chưa đạt.
- Poll #2: **blockers=2, đã xác định danh tính** — test vite-lock-v2 của T6 (test-v2-t6-run1/run2, port 5995), xem §5 F-137-T4-1 là trường hợp poll #68 (khác). Poll #2 không phải sai số: snapshot lưu đủ, danh tính rõ.
- Poll #5–#20: RAM tụt 2.421 → 1.133 MB rồi vọt lên 5.921 MB (balloon xả, dpkg 133→480); load5 có lúc >2 (tối đa 2,20) do replay.
- Poll #21–#26: RAM lên tới 6.693 MB (vượt guard birefnet 6.144 MiB — việc T9, T4 chỉ ghi nhận), dpkg 506→566.
- Poll #27–#52: replay ĐÓNG BĂNG: dpkg_lines kẹt 566 từ 09:01:42Z tới 09:10:32Z (~9 phút im lặng), apt-get pid 18644 (gstreamer1.0-plugins-bad) chỉ 1 s CPU sau 18 phút — chờ download mạng; T5 watcher b90 ghi frozen=yes, silent tới 1.107 s, TRIGGER vẫn NO (chờ đủ 15 phút cho EVAL_C b). RAM tụt dần 5.517 → 858 MB (balloon phồng lại: 6.284.512 kB lúc 09:29Z).
- Poll #53–#66: RAM 522–1.060 MB, dưới ngưỡng gate A phần lớn thời gian; dpkg kẹt 656 từ 09:10:32Z (lần cài thứ hai, sau khi resume 09:10:32Z → 656 lúc poll #36).
- Poll #67: dpkg 656 → 753 (replay chạy lại, last_line 09:33:55Z — plugins-bad xong, chuyển sang plugins-ugly).
- Poll #68: **blockers=1, snapshot đã lưu nhưng process thoát trước khi chụp** — xem §5 F-137-T4-1.
- Poll #69 (09:35:47Z): RAM 492 MB — poll cuối cùng trên boot cũ; **reboot xảy ra sau poll này** (xem §4). Cửa KHÔNG BAO GIỜ mở trên boot cũ: postboot exit 1 suốt (thiếu GST plugins-good/bad/ugly/libav/x), T5 flag không xuất hiện, RAM <1024 MB từ poll #51 trở đi.

### Poller — boot mới 17db9652 (10 poll, 09:37:39Z–09:44:26Z, cửa mở poll #10)

| Poll | Thời gian | RAM | load1/load5 | lock | blockers | cây | t5flag | postboot |
|---|---|---|---|---|---|---|---|---|
| #1 | 09:37:39Z | 1847 MB | 3,97 / 1,63 | không | 0 | YES 530e10a7 | chua-co | 1 |
| #2 | 09:38:25Z | 1783 MB | 2,78 / 1,62 | không | 0 | YES | chua-co | 1 |
| #3 | 09:39:10Z | 1709 MB | 2,20 / 1,63 | không | 0 | YES | chua-co | 1 |
| #4 | 09:39:55Z | 1532 MB | 2,16 / 1,68 | không | 0 | YES | chua-co | 1 |
| #5 | 09:40:40Z | 1404 MB | 1,86 / 1,65 | không | 0 | YES | chua-co | **0** |
| #6 | 09:41:26Z | 1345 MB | 1,38 / 1,55 | không | 0 | YES | chua-co | 0 |
| #7 | 09:42:11Z | 1342 MB | 3,08 / 1,99 | không | 0 | YES | chua-co | 0 |
| #8 | 09:42:56Z | 1410 MB | 1,77 / 1,80 | không | 0 | YES | chua-co | 0 |
| #9 | 09:43:41Z | 1256 MB | 0,89 / 1,57 | không | 0 | YES | chua-co | 0 |
| #10 | 09:44:26Z | **1134 MB** | 0,49 / **1,36** | không | 0 | YES | **PASS** | 0 → **CỬA MỞ** |

- Poll #1–4 boot mới: boot settling + replay chạy lại rất nhanh nhờ cache (dpkg 2 → 299 → 658 → 1.213 trong 3 phút); load1 cao (2,16–3,97) do boot + replay.
- Poll #5: postboot về 0 (GST đủ isomp4 + libav, apt đủ 11 package — xem postboot-t4-137-gate0wait-5.log; lưu ý: file 1/5/9 đã bị poller boot mới ghi đè, chỉ còn nội dung boot mới; các file gate0wait-13/…/69 là boot cũ).
- Poll #7: apt về 0 (dpkg 1.545 dòng, replay xong); load1 vọt 3,08 một poll rồi hạ.
- Poll #9: mọi điều kiện trừ t5flag đều đạt (flag b91 viết 09:43:47Z, 6 s sau poll #9).
- Poll #10: t5flag PASS + gate A đủ (RAM 1134 MB) → **cửa mở, attempt1 chạy ngay trong cùng giây**. Không có lần mở nào bị bỏ lỡ.
- **Nguồn cửa sổ: cửa sổ vàng sau boot mới** — boot 8 phút tuổi, postboot PASS, RAM >1000 MB, load hạ sau replay. Không phải đợt hồi RAM giữa lượt.
- **Tổng poll: 79 poll (69 boot cũ + 10 boot mới); cửa mở 1 lần; 1 attempt hợp lệ.**

## 3. Attempt1 — HỢP LỆ, 20/20 pass trên boot mới 17db9652 (KHÔNG reboot trong lúc đo)

- **Chạy:** gate mở 09:44:26Z → vite :5187 lên (lock v2 `run-attempt t4 5187 1500 30 normal`) → probe 09:44–09:47Z → JSON ghi 09:45Z → probe thoát 09:47:56Z (exit 0) → analyzer + class-B xong 09:48:32Z, **run-attempt exit=0**.
- **JSON:** `preview-b-f3-flip-webkit-t4-attempt1.json` — 2.780.813 B, sha256 `d0585125e40051d123510d120e051e3c31366be6b1951729f496bbbce39e1c1a`, `passes: 20`, engine webkit 27.2, `pageErrs=[]`, flip afterPass=5 wallMs=29353.
- **Sampler của T4 (giữa lượt):** n=11, 09:44:29Z–09:47:50Z, RAM 1056 → 1531 MB (min 1056, max 1531, 0 mẫu <1024 MB); load1 0,61–2,55 (max 2,55 lúc 09:45:50Z). **Báo rõ theo quyết §12.3(c): median tickCost 59,0 ms đo lúc load1 0,61–2,55 / RAM 1056–1531 MB** — tải song song đợt 137 lúc đo NHẸ hơn đợt 136 (load1 max 2,55 so với 2,42 đợt 136 — tương đương; RAM thấp hơn nhiều: 1,1–1,5 GB so với 3,3–6,0 GB đợt 136) mà median vẫn tăng 58,0 → 59,0 ms — RAM thấp không giải thích được mức tăng (cùng hướng với giả thuyết tải song song, nhưng load lúc đo không cao hơn đợt 136; chưa chứng minh nhân quả).
- **Dọn dẹp sau lượt:** vite :5187 chết (curl 000), `vite.lock` không tồn tại, 0 process vite/webkit/probe/MiniBrowser sót (kiểm 09:50Z).
- **Không có attempt2:** attempt1 đã cho verdict rõ về ngưỡng (median 59,0 ≤ 60) + lớp B 5/5 + (c2) giàu mẫu (n=6) — đúng brief (KHÔNG attempt2 khi attempt1 đã verdict rõ). Việc bàn lại ngưỡng/bar thuộc về parent sau khi đọc LIMITS này + verdict (c2) của T3.

## 4. Reboot — 1 reboot GIỮA PHIÊN T4 (không trong lúc đo); ghi chú btime 15 s

- **Reboot duy nhất:** boot cũ 2104246b (btime 08:07:11Z) chết trong khung **(09:35:47Z, 09:37:05Z] (78 s)** — last-seen là poll #69 của T4 (09:35:47Z, RAM 492 MB, apt đang cài plugins-ugly); first-seen boot mới là lần kiểm của T4 09:37:05Z (boot_id 17db9652, btime 09:36:01Z). Reboot trùng với đợt restart service làm gián đoạn 1 exec sleep của T4 (lệnh sleep 115 s bị ngắt giữa chừng, không hoàn thành — không mất dữ liệu, chỉ mất 1 lần kiểm log).
- **Poller chết theo reboot:** process poll-wait-t4-137.sh (pid 4066, boot cũ) không còn sau reboot; T4 phát hiện qua `ps` lúc 09:37:05Z và **khởi động lại poller 09:37:39Z** (cùng script, deadline giữ 10:30Z). Poll numbering khởi động lại từ #1 trên boot mới — ghi rõ để tránh nhầm với poll #1–69 boot cũ (log có dòng phân cách `=== REBOOT GIỮA PHIÊN T4 ===` + dòng start mới).
- **Chênh btime 15 s (không phải mâu thuẫn):** /proc/stat btime = 09:36:01Z; cờ POSTBOOT_PASS của T5 (b91) ghi btime=09:36:16Z. Cùng boot_id 17db9652, chênh 15 s — cùng mẫu với đợt 136 (chênh 16 s) và đợt 135 (chênh 11 s): T5 ghi lúc watcher phát hiện boot mới (journal first-entry), không phải btime thật. Không ảnh hưởng khung chết vì không có reboot nào trong lúc đo. Ghi đủ 2 số, không chọn một số làm "chính thức".
- **Hậu quả reboot với T5:** watcher b90 của boot cũ chết khi replay còn dở (dpkg 753, đang cài plugins-ugly); T5 chạy lại watcher b91 cho boot mới, replay chạy lại từ đầu nhưng nhanh nhờ cache (dpkg 2 → 1.545 trong ~5 phút) và PASS ổn định 2 poll rồi ghi cờ 09:43:47Z.

## 5. Lỗi / sai số quy trình

### F-137-T4-1 — Poll #68 boot cũ blockers=1, snapshot đã lưu theo luật mới nhưng process thoát trước khi chụp nên KHÔNG xác định được danh tính

- **Sự việc:** poll #68 boot cũ (09:35:02Z) ghi blockers=1 trong khi RAM=517 MB, apt đang cài plugins-ugly. Poller đã lưu `blockers-ps-68.txt` (26 dòng, toàn bộ process lúc chụp) + `blockers-list-68.txt` (0 dòng — RỖNG) đúng luật §12.3(h). Trong snapshot không có process vite/webkit/MiniBrowser/WebProcess nào: process gây count=1 đã thoát trong khoảng giữa lệnh đếm và lệnh chụp snapshot (cùng poll, cách nhau <1 s).
- **Nguyên nhân gốc:** luật mới chỉ yêu cầu chụp snapshot KHI blockers>0, nhưng snapshot chụp SAU lệnh đếm nên process ngắn ngủi (<1 s) vẫn lọt. Poll #2 boot cũ không gặp vấn đề này (blockers=2, snapshot bắt được đủ cả hai: test vite-lock-v2 của T6, port 5995 — danh tính rõ).
- **Hậu quả:** không mất dữ liệu đo (chưa có attempt nào chạy; cửa cũng không mở ở poll đó vì postboot exit 1 + RAM 517 MB <1024). Chỉ mất khả năng truy vết danh tính 1 blocker thoáng qua. Ứng viên hợp lý nhất (không suy đoán thêm): vite ngắn ngủi của T8 smoke test — T8 có wait script smoke chạy cùng thời điểm — nhưng snapshot không bắt được nên KHÔNG kết luận.
- **Khắc phục cho đợt sau:** chụp ps snapshot TRƯỚC rồi đếm blockers TỪ snapshot đó (một lần ps duy nhất, đếm trên file đã chụp) — loại bỏ cửa sổ race giữa đếm và chụp. T4 ghi đề xuất, không tự đổi script giữa lượt.

### F-137-T4-2 — Probe log "tickCost ok n=517" vs analyzer n=518 (lệch 1 entry do định nghĩa đếm — ghi chú, không phải lỗi)

- **Sự việc:** probe log ghi `tickCost ok n=517` nhưng analyzer `analyze-t4-tickcost.py` đếm n=518 (mảng `y2.tickCost`, mọi entry có `total` số). Lệch đúng 1 entry.
- **Hậu quả:** không ảnh hưởng verdict (median prereg lấy theo analyzer — chuẩn dùng cho mọi lượt từ trước; median trên 517 hay 518 mẫu chênh nhau tối đa ~0,5 ms, không đổi việc 59,0 ≤ 60). Ghi rõ để tránh ai đó đối chiếu probe log với analyzer rồi tưởng mâu thuẫn. Cùng mẫu với F-136-T4-2 (sampler vs class-B).
- **Không cần khắc phục:** analyzer là chuẩn prereg; probe log chỉ là log nội bộ.

### F-137-T4-3 — Btime T5 flag chênh 15 s với /proc/stat (ghi chú, không phải lỗi)

- Xem §4: cờ b91 ghi btime 09:36:16Z, /proc/stat ghi 09:36:01Z, cùng boot_id 17db9652. Cùng mẫu đợt 135 (11 s) và đợt 136 (16 s). Không ảnh hưởng khung chết hay gate (poller kiểm boot_id + mtime>=btime, cả hai đều khớp).

### F-137-T4-4 — Deadline poller 10:30Z là giả định của T4 (ghi rõ, không phải lỗi)

- **Sự việc:** brief T4 đợt 137 không ghi hạn cứng đóng sổ của T10 đợt 137. T4 đặt deadline poller 10:30Z theo suy luận từ đợt 136 (mở 05:35Z → đóng 07:26Z, hạn cứng 08:00Z ≈ mở +2h25m; đợt 137 mở 08:35Z → hạn cứng suy ra ~11:00Z; poller dừng 10:30Z để chừa 30 phút cho T10). Cửa đã mở 09:44:26Z nên deadline không bị chạm tới — giả định không ảnh hưởng kết quả lượt này. Ghi rõ để T10 đợt sau kiểm lại hạn cứng thật.

### Không có lỗi tên script (F-135-T4-1 đã khắc phục, giữ qua 2 đợt)

- Adapt đợt 137 đã grep toàn bộ chuỗi `136` trong script (= 0 kết quả, trừ comment lịch sử "dot 13x") và xác nhận bằng `ls` rằng poller gọi đúng `run-attempt-137.sh`. Cửa mở lần duy nhất (poll #10 boot mới) chạy attempt ngay, không bỏ lỡ.

## 6. Log draw với logger đã nới — TIẾP TỤC GHI TỐT LẦN 3 (loop 1–21, 20 wrap)

- Chạy `analyze-t4-c2drawlog.py` trên JSON attempt1: **c2DrawLog n=996** (drawSrc 518 / rawUnit 478; stage plain-native 518 / rawUnit 478; srcKind 'canvas 1280x720' 996/996; readyState 4 996/996; seeking False 996/996); **loopNo 1–21, loop 1–17 và 19–21 mỗi loop 42–60 entry** (loop 18: 1, xem dưới); frameIdx 0–69 (distinct 59); wallMs 11652→83996 (span 72.344 ms); ct 0–2,300 s; **wraps 20**; drawSrc nonmono-lần-giảm=20.
- **Đọc đúng:** logger đã nới ghi được mọi loop ≥1 trong suốt 72,3 s đo (tương đương ~24 vòng video 3 s), KHÔNG bị cắt ở loop 2 như logger cũ. Fix loop-gate nới + re-enable TIẾP TỤC HOẠT ĐỘNG ĐÚNG ở runtime — lượt thứ ba liên tiếp kiểm chứng được.
- **Caveat loop 18 (ghi rõ, không giấu):** loop 18 chỉ 1 entry biên tại wrap — cùng mẫu với loop 12 đợt 136 (1 entry biên tại wrap). Các loop còn lại đều đầy (42–60 entry). Không ảnh hưởng coverage (c2): seq 389 (muộn nhất) nằm ở tBlend 82068 ms (loop ~21), log gần nhất delta +46 ms.
- **Coverage (c2) 6/6:** log wallMs min 11652 (trước flip 29353) → max 83996 (sau flip +54.643 ms); 1 epoch duy nhất; 6 occurrence đều có log gần nhất trong −26…+46 ms; blendTick hậu-flip 296/296 trong ±500 ms của log.
- **Hệ quả cho T3 bước 2:** P7 tiếp tục CÓ dữ liệu mới (coverage đầy đủ hậu-flip); prereg ghost-freeze/skew: P1/P3 đợt 133 đứng nguyên, cộng dồn thêm lượt này — T3 tự tổng hợp từ JSON gốc (không suy diễn thay T3). Lưu ý cho T3: **(c2) lượt này n=6 occurrence (5 seq) — giàu hơn hẳn lượt #13 (n=1)**; nhưng có **1 occurrence lag 2f (seq 145, presented 17, label 15)** — lần đầu tiên trong chuỗi (mọi (c2) trước đây đều +1f theo kết luận T3 đợt 136); seq 145 có 2 occurrence trong cùng một seq (lag 2f + lag 1f) — T3 tự đánh giá theo prereg, T4 chỉ cung cấp số liệu.

## 7. Ngưỡng ≤60 ms — GIỮ NGUYÊN (có số mới, vẫn dưới ngưỡng, nhưng biên mỏng nhất từ trước)

| Lượt yên hợp lệ | tickCost total median (ms) | (c2) | Coverage | Lớp B |
|---|---|---|---|---|
| #1–#9 (tới đợt 131) | 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / — / 54,0 / 40,0 / 56,0 (8 lượt có số) | — | — | — |
| #10 (T4 đợt 133 a1) | **39,5** (thấp nhất) | 5 | 0/5 | 5/5 |
| #11 (T4 đợt 134) | KHÔNG CÓ SỐ — 0 attempt hợp lệ | — | — | — |
| #12 (T4 đợt 135 a1) | **40,0** | 7 | 7/7 | 5/5 |
| #13 (T4 đợt 136 a1) | **58,0** | 1 | 1/1 | 5/5 |
| **#14 (T4 đợt 137 a1)** | **59,0** (cao nhất) | **6 occ / 5 seq** | **6/6** | **5/5** |

Trung bình 12 lượt nay 48,3 ms (11 lượt trước: 47,3 ms). Median 59,0 ms < ngưỡng 60 ms với biên chỉ 1 ms; p90 81,0 ms; wallbands theo dải 56,0–63,0 ms — cao đều, không phải một dải lệch. **Không đề xuất đổi ngưỡng, bar hay DEF từ phía T4** (một lượt đơn lẻ vẫn dưới ngưỡng, lớp B 5/5, F6' đóng lần 3). **Nhưng:** đây là median cao nhất trong 12 lượt và là **lần thứ hai liên tiếp median ≥55 ms** (58,0 rồi 59,0) — đúng điều kiện quyết parent đợt 136 §12.3(c) ("nếu đợt 137 median vẫn ≥55 ms thì parent bàn lại"). Dữ kiện cho parent: lúc đo load1 0,61–2,55 (max 2,55, tương đương đợt 136: 2,42) nhưng RAM chỉ 1,1–1,5 GB (thấp hơn nhiều so với 3,3–6,0 GB đợt 136) mà median vẫn tăng — RAM thấp không phải yếu tố thúc đẩy duy nhất; tải CPU song song vẫn là giả thuyết hàng đầu nhưng chưa chứng minh nhân quả (load lúc đo không cao hơn đợt 136). Ghi để parent quyết, không kết luận.

## 8. Kiểm chứng độc lập của script trước khi đo (dry-run)

- Trước khi mở poller, chạy toàn bộ analyzer trên JSON đợt 136 (`round136-t4/preview-b-f3-flip-webkit-t4-attempt1.json`): tickCost median **58,0** (khớp), (c2) seq **334 lag 1f** (khớp), c2DrawLog byLoop **{1:36, 2:58, …, 21:54}** (khớp), wraps 20 (khớp). Probe md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp đợt 132/133/134/135/136); `node --check` OK; `bash -n` OK cả 4 script (sau khi sửa deadline + nhãn + thêm ps snapshot); `ast.parse` OK 8 analyzer.
- `t4-histogram-with14.py` chạy được trên JSON đợt 137 (nGhost 592, hist {-14: 5, -13: 2, -11: 6, -10: 8, -9: 2, -4: 2, -3: 2, -1: 54, 0: 207, +1: 83, +2: 118, +3: 96, +4: 7}, snapMs−labelMs median 50 ms) — xem §kết quả chính mục 6. Nhãn in đã sửa "luot #14"; entry RUNS đã sang JSON đợt 137 (lưu ý: bản đợt 136 ghi nhãn "LUOT YEN #12" cho JSON đợt 136 — nhãn cũ sai số lượt, đã sửa thành "#14" ở bản này).

## 9. Trạng thái sau đo (kiểm cuối 09:50Z)

- Boot 17db9652 còn sống (btime 09:36:01Z, tuổi ~14 phút); không reboot trong lúc kiểm cuối.
- Vite :5187 đã chết (curl 000); `vite.lock` không tồn tại; không process vite/webkit/probe/MiniBrowser nào sót.
- Cây không đổi so với lúc đo: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093.
- Không file production nào bị sửa bởi T4; chỉ thêm file làm việc trong `hidden_files/round137-t4/` + LIMITS này trong `repo-1/docs/`.
- RAM 1461 MB lúc kiểm cuối (09:48Z); cờ T5 vẫn PASS cho boot hiện tại.
- TTS 39 không kiểm lại; birefnet không thử (không thuộc brief T4; RAM lúc đo 1,1–1,5 GB, xa guard 6.144 MiB).

## 10. Nợ mở chuyển đợt 138

1. **Ngưỡng tickCost ≤60 ms: biên chỉ còn 1 ms (median 59,0, cao nhất 12 lượt; 2 lượt liên tiếp ≥55 ms).** Không đổi ngưỡng từ một lượt; parent bàn lại theo §12.3(c) đợt 136 (ngưỡng/bar hoặc điều tra tải song song). T4 không đổi ngưỡng.
2. **Điều tra (c2): lượt #14 là lượt quyết định — chờ verdict T3** trên bằng chứng cộng dồn + n=6 occurrence mới (gồm 1 occurrence lag 2f đầu tiên). T4 không tự quyết verdict.
3. **Logger đã nới KIỂM CHỨNG lần 3 liên tiếp — đề xuất GIỮ fix 530e10a7, không revert.** (Quyết parent đợt 136 §12.3(a) đã là GIỮ qua đợt 137; lượt này củng cố thêm: loop 1–21, 20 wrap, coverage 6/6.)
4. **F-137-T4-1:** đợt sau chụp ps snapshot TRƯỚC rồi đếm blockers TỪ snapshot (loại race đếm-chụp).
5. **F-137-T4-4:** T10 đợt sau ghi rõ hạn cứng đóng sổ vào brief T4 (deadline poller đợt này là giả định của T4).
6. **G1 vẫn hoãn; R9 (a) số đếm VẪN LÀ 16 — KHÔNG tăng; ci-security.yml vẫn 403; TTS 39 cấm kiểm lại; KHÔNG push khi user chưa nhắn "push đi".**

## 11. Stage (KHÔNG push) + cờ

- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round137-t4-quiet14.txt` — 1 entry (`docs/PHASE9_ROUND137_T4_WEBKIT_QUIET14_LIMITS.md`), verify bằng read-back. KHÔNG push.
- **Cờ:** `hidden_files/round137-t4.done` — dòng đầu: "1 attempt hop le (attempt1 20/20 pass); median tickCost 59,0 ms (nguong <=60 GIU, bien 1 ms — CAO NHAT 12 luot, lan 2 lien tiep >=55ms); (c2)=6 occ/5 seq (co 1 lag 2f dau tien); coverage 6/6; lop B 5/5; F6' DONG lan 3 lien tiep; logger noi KIEM CHUNG lan 3 (loop 1-21, 20 wrap); 1 reboot giua phien (boot 2104246b -> 17db9652)".
- **File làm việc (không stage, chỉ để trong `hidden_files/round137-t4/`):** probe (md5 70c7bb9a…), `b.json`, `vite.t4-temp.config.mjs`, `tree-md5.txt` (530e10a7), `poll-wait-t4-137.sh` + `poll-t4.log` (79 poll, 2 boot) + `poll-t4.nohup.log` + `poll-t4.nohup2.log`, `run-attempt-137.sh`, `t4-attempt-inner.sh`, `check-classb-t4.sh`, `t4-histogram-with14.py` + `t4-histogram-with14.txt`, `preview-b-f3-flip-webkit-t4-attempt1.json` (2.780.813 B, sha256 d0585125e40051d123510d120e051e3c31366be6b1951729f496bbbce39e1c1a), `analyze-t4-attempt1-*.txt` (tickcost/wallbands/labellag/c2drawlog/c2coverage/skiplatest/lag5), `classb-t4-attempt1.txt`, `coverage-check-attempt1.txt`, `load-mid-t4-attempt1.log`, `ps-before/after-t4-attempt1.txt`, `vite-5187-t4-attempt1.log`, `run-webkit-t4-attempt1.log`, `marker-t4-attempt1`, `chain-t4.log`, `postboot-t4-137-gate0wait-*.log` (file 1/5/9 là boot mới — đã ghi đè bản boot cũ; 13–69 là boot cũ), `blockers-ps-2.txt` + `blockers-list-2.txt` (T6, đã xác định), `blockers-ps-68.txt` + `blockers-list-68.txt` (rỗng — xem F-137-T4-1).
