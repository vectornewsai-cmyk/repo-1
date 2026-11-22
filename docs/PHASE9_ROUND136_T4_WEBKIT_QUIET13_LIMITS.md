# PHASE9_ROUND136_T4_WEBKIT_QUIET13_LIMITS — Lượt yên WebKit #13 ĐO ĐƯỢC: 20/20 pass, median tickCost 58,0 ms — DƯỚI ngưỡng ≤60 ms nhưng chỉ còn biên 2 ms (CAO NHẤT trong 11 lượt yên hợp lệ); (c2)=1, coverage 1/1, lớp B 5/5, F6' ĐÓNG lần 2 liên tiếp

> **Verdict: LƯỢT YÊN #13 ĐO ĐƯỢC — 1 attempt hợp lệ (attempt1, 20/20 pass, không reboot trong lúc đo). tickCost total median 58,0 ms (n=516, p90 89,0, max 153, min 31) — DƯỚI ngưỡng ≤60 ms, ngưỡng GIỮ NGUYÊN, nhưng biên chỉ còn 2 ms và đây là median CAO NHẤT trong 11 lượt yên hợp lệ (trước đó cao nhất 56,0 ms). (c2)=1 (seq 334, lag 1f), coverage log draw 1/1. Lớp B 5/5 ĐẠT. Logger đã nới tiếp tục ghi tốt ở runtime (c2DrawLog n=994, loop 1–21, 20 wrap, blendTick hậu-flip 307/307 trong ±500 ms của log). F6' ĐÓNG lần thứ hai liên tiếp (77/77 tick không vi phạm thật).**
> **Cảnh báo chính: median tăng 40,0 → 58,0 ms so với lượt #12 trong khi RAM dồi dào hơn nhiều (3,3–6,0 GB so với ~1 GB đợt 135) — RAM không phải yếu tố thúc đẩy; tải CPU song song đợt 136 (load1 max 2,42 trong lúc đo, load5 ~1,6–1,9) là giả thuyết hợp lý nhất, chưa chứng minh nhân quả. Không đổi ngưỡng từ một lượt duy nhất; đợt 137 cần xem median có ở lại vùng ≥55 ms không.**

## Kết quả chính

1. **Attempt1 HỢP LỆ, 20/20 pass, không reboot:** cửa mở poll #9 05:48:28Z (RAM 4782 MB) → vite :5187 lên, probe chạy 05:48–05:51Z → JSON 2.944.128 B ghi 05:50Z → analyzer + class-B xong 05:52:42Z, **run-attempt exit=0**. Boot 1ca1feaa xuyên suốt phiên T4 (05:40Z lúc bắt đầu → 05:55Z kiểm cuối), 0 reboot.
2. **tickCost median 58,0 ms — ngưỡng ≤60 ms GIỮ (biên 2 ms):** total n=516 median 58,0 / p90 89,0 / max 153 / min 31; hậu flip+2000 ms n=381 median 58,0. Wallbands: 0–20k 60,0 / 20–32k 58,0 / 32–45k 56,0 / 45–62k 52,0 / 62–70k 64,0 / 70–80k 59,0 ms — cao đều mọi dải (đợt 135: 38,0–43,0 ms). Chuỗi 11 lượt yên hợp lệ nay: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / **58,0** — trung bình 47,3 ms (trước đây 46,3 ms với 10 lượt — số 46,6 ms trong LIMITS đợt 135 là sai, xem F-136-T1-3 của T1-136; T4 đã tính lại từ 10 số gốc: tổng 462,5 / 10 = 46,25 → 46,3 ms).
3. **(c2)=1, lag 1f:** seq 334 (presented 16, label 15, lag 1). skippedLatest=1: 0 vi phạm thật (77/77 tick không vi phạm, pixel-verified 100%) — **F6' ĐÓNG lần 2 liên tiếp** (đợt 135: 75/75). lag5: 0 event lag ≥+5f.
4. **Logger đã nới tiếp tục ghi tốt:** c2DrawLog n=994 (drawSrc 516 / rawUnit 478; stage plain-native 516 / rawUnit 478; srcKind 'canvas 1280x720' 994/994; readyState 4 994/994; seeking False 994/994); **byLoop {1:36, 2:58, 3:50, 4:48, 5:60, 6:38, 7:50, 8:52, 9:58, 10:52, 11:51, 12:1, 13:53, 14:48, 15:48, 16:50, 17:52, 18:40, 19:51, 20:44, 21:54}** — loop 3–21 đầy đủ (loop 1 chỉ 36 entry: logger bắt đầu ghi giữa loop 1; loop 12: 1 entry biên tại wrap — xem §6); frameIdx 0–71 (distinct 60); wallMs span 77.908 ms (11164→89072); **wraps=20**; 1 epoch duy nhất, loopNo [1..21]. **Coverage (c2) 1/1** (delta +56 ms); blendTick hậu-flip trong ±500 ms của log: 307/307 (100%).
5. **Lớp B 5/5 ĐẠT:** B1 load5 cuối 1,57 (≤2,5); B2 load1 max 2,42 (≤4; sampler n=11); B3 không reboot trong lúc đo (boot lúc bắt đầu = boot hiện tại 2026-11-18 05:29:18); B4 0 apt/dpkg lúc đánh giá; B5 RAM giữa lượt min 3322 MB, 0 mẫu <500 MB, 0 mẫu <1024 MB.
6. **Histogram (t4-histogram-with13.py, chạy trên JSON đợt 136):** nGhost 614; hist (pixFrame−label) {-13: 5, -12: 6, -11: 2, -9: 2, -5: 1, -1: 46, 0: 258, +1: 74, +2: 126, +3: 87, +4: 7} — 0: 42,0%, +1/+2: 32,6%, +3: 14,2%, ≥+3: 15,3%, <0: 10,1%; snapMs−labelMs median 52 ms (mean 54,4, p90 87); rawMs−labelMs median 10 ms. CurPix run đồng cung ≥3 tick: 23 run. So với đợt 135: đuôi +3 tăng mạnh (3,3% → 14,2%), đuôi âm tăng (6,3% → 10,1%), snapMs−labelMs median tăng 35 → 52 ms — nhất quán với tickCost median tăng.
7. **Gate 0 + Gate A mở ngay poll #9 (lần mở duy nhất, không bỏ lỡ):** T5 flag PASS 05:48:02Z (poll=2, boot 1ca1feaa); 9 poll, 05:42:26–05:48:28Z; RAM 3.628–5.985 MB suốt thời gian chờ (balloon đã xả — khác hẳn chế độ ~1 GB đợt 135). Poll #6 blockers=6 chưa xác định danh tính (xem §5 F-136-T4-1).

## 0. Môi trường đo + prereg + cây đo

- **Brief T4 đợt 136:** chờ cờ POSTBOOT_PASS của boot mới 1ca1feaa (T5 tạo; cờ cũ của 78b55838 stale, KHÔNG dùng); chỉ đo khi gate T5 PASS + RAM đạt ngưỡng (ngưỡng giữ cứng ≥1024 MB, không nới); chạy lượt yên #13 đúng phương pháp đợt 133/135 (20/20 pass, tickCost median, ngưỡng ≤60 ms, lớp B 5/5, JSON gốc + sha256); kiểm md5 preview.tsx = 530e10a7 trước khi đo, nếu khác thì DỪNG và báo parent, không tự sửa cây; ghi rõ mọi sai số theo mẫu F-136-T4-n; TUYỆT ĐỐI KHÔNG revert preview.tsx.
- **Probe tái dùng nguyên bản đợt 133:** `hidden_files/round136-t4/probe121t3-ghost-k7.webkit.mjs`, md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp bản đợt 132/133/134/135), `node --check` OK. Analyzer đã dry-run PASS trên dữ liệu đợt 135 trước khi đo (tái tạo đúng median 40,0 / (c2) seqs 166/251/305/363/448/480/534 / c2DrawLog byLoop {1:63, 2:66, …, 22:1} — xem §8).
- **Script đợt 136 adapt từ đợt 135:** copy toàn bộ script + analyzer, `sed 135→136` và `134→136`, sửa deadline poller 04:30Z → 07:30Z (hạn cứng T10 đóng sổ 08:00Z), sửa nhãn histogram "luot #11" → "#13". Kiểm sau adapt: `grep -rn "135\|134"` trong script = 0 kết quả; `bash -n` OK cả 4 script; xác nhận bằng `ls` rằng poller gọi đúng `run-attempt-136.sh` (dòng 89) — bài học F-135-T4-1 đã áp dụng.
- **Cây đo:** `preview.tsx 530e10a7` (fix logger đã nới, KHÔI PHỤC lúc mở đợt theo quyết parent §12.3(a) đợt 135 — kiểm lại lúc mở đợt 05:40Z = 530e10a7, lúc đóng 05:55Z vẫn 530e10a7), `media.ts 2c384ed1`, `vite.config.ts ee80d093` (khớp cây đợt 135). T4 KHÔNG sửa file production nào.
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu — là marker MỞ ĐỢT 136 do parent tạo (05:35Z), KHÔNG phải đợt main-chat — T4 tiến hành bình thường (tiền lệ đợt 130–135).
- **Boot lúc mở đợt:** 1ca1feaa-af3b-41dc-aaae-34376329b0a3, btime 05:29:18Z theo /proc/stat (T5 ghi 05:29:34Z trong cờ — chênh 16 s, cùng boot_id, xem §4). RAM available lúc mở ~1.444 MB (lúc 05:40Z), rồi vọt lên 3.628 MB lúc poll #1 (05:42:26Z) — balloon xả mạnh sau boot.

## 1. Gate 0 — ĐẠT 05:48:02Z trên boot 1ca1feaa (T5 watcher b89, poll 2)

| Điều kiện | Kết quả |
|---|---|
| (0a) T5 flag `round136-t5/POSTBOOT_PASS` khớp boot | **PASS** — `boot_id=1ca1feaa-af3b-41dc-aaae-34376329b0a3 btime=2026-11-18T05:29:34Z pass_at=2026-11-18T05:48:02Z poll=2` (T5 watcher b89). Cờ stale đợt 135 (78b55838, pass_at 02:45:13Z) nằm ở `round135-t5/` — KHÔNG dùng, đúng brief. |
| (0b) check-only postboot riêng PASS | **PASS exit 0 từ poll #5** (05:45:28Z) và mọi lần kiểm sau. Poll #1–4 exit 1 do replay apt của T5 còn chạy (dpkg 2 → 1545 dòng; replay xong ~05:45Z). |
| (0c) apt-get/dpkg = 0 (pgrep -x) | **0/0 từ poll #6 trở đi** (poll #1–5 còn apt=1–2 do replay). Lúc cửa mở: 0. |
| (0d) cây md5 == tree-md5.txt (530e10a7) | **YES suốt lượt** — preview.tsx 530e10a7 (kiểm lại lúc đóng 05:55Z vẫn 530e10a7). |

## 2. Gate A — MỞ 1 LẦN (poll #9, không bỏ lỡ)

### Poller — boot 1ca1feaa (9 poll, 05:42:26Z–05:48:28Z)

| Poll | Thời gian | RAM | load1/load5 | lock | blockers | cây | t5flag | postboot |
|---|---|---|---|---|---|---|---|---|
| #1 | 05:42:26Z | 3628 MB | 2,21 / 1,44 | không | 0 | YES 530e10a7 | chua-co | 1 |
| #2 | 05:43:12Z | 3667 MB | 2,70 / 1,65 | không | 0 | YES | chua-co | 1 |
| #3 | 05:43:57Z | 4983 MB | 4,70 / 2,34 | không | 0 | YES | chua-co | 1 |
| #4 | 05:44:42Z | 5985 MB | 4,88 / 2,74 | không | 0 | YES | chua-co | 1 |
| #5 | 05:45:28Z | 5949 MB | 3,52 / 2,67 | không | 0 | YES | chua-co | 0 |
| #6 | 05:46:13Z | 5692 MB | 2,13 / 2,43 | không | **6** | YES | chua-co | 0 |
| #7 | 05:46:58Z | 5343 MB | 1,86 / 2,32 | không | 0 | YES | chua-co | 0 |
| #8 | 05:47:43Z | 5059 MB | 1,71 / 2,21 | không | 0 | YES | chua-co | 0 |
| #9 | 05:48:28Z | **4782 MB** | 1,14 / **1,99** | không | 0 | YES | **PASS** | 0 → **CỬA MỞ** |

- Poll #1–4: replay apt của T5 còn chạy (apt=1–2, dpkg_lines tăng 2→1471), postboot exit 1, gate 0 chưa đạt.
- Poll #5: postboot về 0 (replay xong, dpkg 1545 dòng) nhưng apt vẫn =1 và load5=2,67 >2 → cửa chưa mở.
- Poll #6: apt về 0 nhưng **blockers=6** và load5=2,43 >2 → cửa không mở (xem §5 F-136-T4-1).
- Poll #7–8: mọi điều kiện trừ load5 (2,32 / 2,21 >2) đều đạt — load5 hạ dần theo replay kết thúc.
- Poll #9: load5 1,99 (<2, sát ngưỡng) + gate 0 PASS + RAM 4782 MB → **cửa mở, attempt1 chạy ngay trong cùng giây**. Không có lần mở nào bị bỏ lỡ (khác đợt 135).
- **Nguồn cửa sổ: cửa sổ vàng sau boot** — boot 13–19 phút tuổi, postboot PASS, RAM >1000 MB, load hạ sau replay. Không phải đợt hồi RAM giữa lượt (RAM đã cao từ đầu).
- **Tổng poll: 9 poll; cửa mở 1 lần; 1 attempt hợp lệ.**

## 3. Attempt1 — HỢP LỆ, 20/20 pass trên boot 1ca1feaa (KHÔNG reboot)

- **Chạy:** gate mở 05:48:28Z → vite :5187 lên (lock v2 `run-attempt t4 5187 1500 30 normal`) → probe 05:48–05:51Z → JSON ghi 05:50Z → probe thoát ~05:51:5xZ → analyzer + class-B xong 05:52:42Z, **run-attempt exit=0**.
- **JSON:** `preview-b-f3-flip-webkit-t4-attempt1.json` — 2.944.128 B, sha256 `266767c0f7fe270dc7f0673f78ad5c341ed4d3decac2399237d777b1282a2847`, `passes: 20`, engine webkit 27.2, `pageErrs=[]`, flip afterPass=5 wallMs=29731.
- **Sampler của T4 (giữa lượt):** n=11, 05:48:31Z–05:51:53Z, RAM 4662 → 3328 MB (min 3322 theo class-B — mẫu min nằm giữa các lần ghi log của T4; ghi rõ "theo sampler của mình", bài học F-133-8). Load 0,95–1,17 (load1 max 2,42 theo class-B nằm ngoài các lần ghi log của T4 — xem §5 F-136-T4-2).
- **Dọn dẹp sau lượt:** vite :5187 chết (curl 000), `vite.lock` không tồn tại, 0 process vite/webkit/probe/MiniBrowser sót (kiểm 05:55Z).
- **Không có attempt2:** attempt1 đã cho verdict rõ về ngưỡng (median 58,0 ≤ 60) + lớp B 5/5 — đúng brief (KHÔNG attempt2 khi attempt1 đã verdict rõ). Tuy nhiên biên ngưỡng chỉ 2 ms (xem §7) — nếu đợt 137 median vẫn ≥55 ms thì nên bàn lại ngưỡng/bar, không phải việc của T4 lượt này.

## 4. Reboot — 0 reboot trong phiên T4; ghi chú btime 16 s

- **Không reboot nào** từ lúc T4 bắt đầu (05:40Z) tới kiểm cuối (05:55Z): boot_id 1ca1feaa xuyên suốt; poll log không có dòng REBOOT nào; boot lúc bắt đầu = boot hiện tại (class-B B3 ĐẠT).
- **Chênh btime 16 s (không phải mâu thuẫn):** /proc/stat btime = 05:29:18Z (poller + T5 poll0 đều đọc 05:29:18Z); cờ POSTBOOT_PASS của T5 ghi btime=05:29:34Z. Cùng boot_id 1ca1feaa, chênh 16 s — cùng mẫu với đợt 135 (chênh 11 s) và khác hẳn 2 mâu thuẫn đợt 134 (btime boot mới TRƯỚC mốc last-seen của boot cũ). Đây là chênh lệch ghi nhận thời điểm boot (T5 ghi lúc watcher phát hiện boot mới), không ảnh hưởng khung chết vì không có reboot nào trong phiên. Ghi đủ 2 số, không chọn một số làm "chính thức".

## 5. Lỗi / sai số quy trình

### F-136-T4-1 — Poll #6 blockers=6, lại không xác định được danh tính (lặp lại bài học đợt 135 chưa thực hiện)

- **Sự việc:** poll #6 (05:46:13Z) ghi blockers=6 trong khi load5=2,43 >2 — cửa không mở vì cả hai lý do. Không có ps snapshot nào được lưu tại poll đó, nên 6 blocker này không xác định được danh tính sau sự kiện (nhiều khả năng là tiến trình watcher/postboot của T5 — b89 — hoặc vite của luồng khác; không suy đoán thêm).
- **Nguyên nhân gốc:** bài học đợt 135 §10.3 ("đợt sau nên log ps snapshot khi blockers>0") KHÔNG được đưa vào `poll-wait-t4-136.sh` khi adapt script — lần adapt này chỉ đổi số đợt + deadline + nhãn, không thêm tính năng mới.
- **Hậu quả:** không mất dữ liệu đo (chưa có attempt nào chạy; cửa cũng không mở ở poll đó vì load5 >2). Chỉ mất khả năng truy vết danh tính blocker.
- **Khắc phục cho đợt sau:** thêm vào poller: khi blockers>0 thì ghi `ps -eo args | grep -E "[v]ite|[M]iniBrowser|[w]ebkit"` vào `blockers-ps-<poll>.txt` ngay trong poll đó.

### F-136-T4-2 — load1 max 2,42 (class-B) nằm ngoài các mẫu sampler của T4 (ghi chú, không phải lỗi)

- **Sự việc:** sampler của T4 (n=11, mỗi 20 s) ghi load1 trong khoảng 0,95–1,17, nhưng class-B B2 báo load1 max=2,42 (đọc từ /proc/loadavg lúc đánh giá / từ log hệ thống). Mẫu max nằm giữa các lần ghi log của T4 — cùng mẫu đã biết từ F-133-8.
- **Hậu quả:** không ảnh hưởng verdict B2 (2,42 ≤ 4, ĐẠT) và không ảnh hưởng tickCost (tickCost đo độc lập trong probe). Ghi rõ để tránh ai đó đối chiếu sampler với B2 rồi tưởng mâu thuẫn.
- **Không cần khắc phục:** sampler 20 s là thiết kế có chủ ý; class-B đọc load trực tiếp nên số max của nó là chuẩn cho B2.

### Không có lỗi tên script (F-135-T4-1 đã khắc phục)

- Adapt đợt 136 đã grep toàn bộ chuỗi `135`/`134` trong script (= 0 kết quả) và xác nhận bằng `ls` rằng poller gọi đúng `run-attempt-136.sh`. Cửa mở lần duy nhất (poll #9) chạy attempt ngay, không bỏ lỡ.

## 6. Log draw với logger đã nới — TIẾP TỤC GHI TỐT (loop 1–21, 20 wrap)

- Chạy `analyze-t4-c2drawlog.py` trên JSON attempt1: **c2DrawLog n=994** (drawSrc 516 / rawUnit 478; stage plain-native 516 / rawUnit 478; srcKind 'canvas 1280x720' 994/994; readyState 4 994/994; seeking False 994/994); **loopNo 1–21, loop 3–11 và 13–21 mỗi loop 38–60 entry** (loop 12: 1, loop 1: 36 — 2 entry biên/cắt, xem dưới); frameIdx 0–71 (distinct 60); wallMs 11164→89072 (span 77.908 ms); ct 0–2,384 s; **wraps 20**; drawSrc nonmono-lần-giảm=20.
- **Đọc đúng:** logger đã nới ghi được mọi loop ≥1 trong suốt 77,9 s đo (tương đương ~26 vòng video 3 s), KHÔNG bị cắt ở loop 2 như logger cũ. Fix loop-gate nới + re-enable TIẾP TỤC HOẠT ĐỘNG ĐÚNG ở runtime — lượt thứ hai liên tiếp kiểm chứng được.
- **Caveat loop 1 / loop 12 (ghi rõ, không giấu):** loop 1 chỉ 36 entry (log bắt đầu ở wallMs 11164, giữa loop 1 — logger bắt đầu ghi sau khi probe warm-up); loop 12 chỉ 1 entry biên tại wrap. Các loop 3–11 và 13–21 đều đầy (38–60 entry). Không ảnh hưởng coverage (c2): seq 334 nằm ở tBlend 74639 ms (loop ~20), log gần nhất delta +56 ms.
- **Coverage (c2) 1/1:** log wallMs min 11164 (trước flip 29731) → max 89072 (sau flip +59.341 ms); 1 epoch duy nhất; seq 334 có log gần nhất trong +56 ms; blendTick hậu-flip 307/307 trong ±500 ms của log.
- **Hệ quả cho T3 bước 2:** P7 tiếp tục CÓ dữ liệu mới (coverage đầy đủ hậu-flip); prereg ghost-freeze/skew: P1/P3 đợt 133 đứng nguyên, cộng dồn thêm lượt này — T3 tự tổng hợp từ JSON gốc (không suy diễn thay T3). Lưu ý cho T3: (c2) lượt này chỉ 1 seq (so với 7 seq đợt 135) — mẫu (c2) nhỏ hơn, nhưng lag vẫn 1f và coverage vẫn đầy.

## 7. Ngưỡng ≤60 ms — GIỮ NGUYÊN (có số mới, vẫn dưới ngưỡng, nhưng biên mỏng)

| Lượt yên hợp lệ | tickCost total median (ms) | (c2) | Coverage | Lớp B |
|---|---|---|---|---|
| #1–#9 (tới đợt 131) | 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / — / 54,0 / 40,0 / 56,0 (8 lượt có số) | — | — | — |
| #10 (T4 đợt 133 a1) | **39,5** (thấp nhất) | 5 | 0/5 | 5/5 |
| #11 (T4 đợt 134) | KHÔNG CÓ SỐ — 0 attempt hợp lệ | — | — | — |
| #12 (T4 đợt 135 a1) | **40,0** | 7 | 7/7 | 5/5 |
| **#13 (T4 đợt 136 a1)** | **58,0** (cao nhất) | **1** | **1/1** | **5/5** |

Trung bình 11 lượt nay 47,3 ms (10 lượt trước: 46,3 ms — đính chính số 46,6 ms sai trong LIMITS đợt 135, theo F-136-T1-3 của T1-136). Median 58,0 ms < ngưỡng 60 ms với biên chỉ 2 ms; p90 89,0 ms; wallbands theo dải 52,0–64,0 ms — cao đều, không phải một dải lệch. **Không đề xuất đổi ngưỡng, bar hay DEF từ lượt này** (một lượt duy nhất, vẫn dưới ngưỡng, lớp B 5/5, F6' đóng). **Nhưng:** đây là median cao nhất trong 11 lượt và là lần đầu median vượt 56,0 ms; nếu đợt 137 median vẫn ≥55 ms thì đó là tín hiệu trôi ngưỡng cần bàn lại (ngưỡng/bar hoặc điều tra tải song song). Giả thuyết hàng đầu: tải CPU song song đợt 136 (8–10 luồng, T8 điều tra + T5 replay + T7/T9 chạy cùng lúc) — load1 max 2,42 trong lúc đo so với 1,88 đợt 135; RAM dồi dào (3,3–6,0 GB) loại trừ RAM là yếu tố thúc đẩy. Giả thuyết chưa chứng minh nhân quả — ghi để đợt sau kiểm, không kết luận.

## 8. Kiểm chứng độc lập của script trước khi đo (dry-run)

- Trước khi mở poller, chạy toàn bộ analyzer trên JSON đợt 135 (`round135-t4/preview-b-f3-flip-webkit-t4-attempt1.json`): tickCost median **40,0** (khớp), (c2) seqs **166/251/305/363/448/480/534** (khớp), c2DrawLog byLoop **{1:63, 2:66, …, 22:1}** (khớp logger đã nới đợt 135). Probe md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp đợt 132/133/134/135); `node --check` OK; `bash -n` OK cả 4 script (sau khi sửa deadline + nhãn).
- `t4-histogram-with13.py` chạy được trên JSON đợt 136 (nGhost 614, hist {-13: 5, -12: 6, -11: 2, -9: 2, -5: 1, -1: 46, 0: 258, +1: 74, +2: 126, +3: 87, +4: 7}, snapMs−labelMs median 52 ms) — xem §kết quả chính mục 6. Nhãn in đã sửa "luot #13".

## 9. Trạng thái sau đo (kiểm cuối 05:55Z)

- Boot 1ca1feaa còn sống (btime 05:29:18Z, tuổi ~26 phút); không reboot trong lúc kiểm cuối.
- Vite :5187 đã chết (curl 000); `vite.lock` không tồn tại; không process vite/webkit/probe/MiniBrowser nào sót.
- Cây không đổi so với lúc đo: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093.
- Không file production nào bị sửa bởi T4; chỉ thêm file làm việc trong `hidden_files/round136-t4/` + LIMITS này trong `repo-1/docs/`.
- RAM 3659 MB lúc kiểm cuối; cờ T5 vẫn PASS cho boot hiện tại.
- TTS 39 không kiểm lại; birefnet không thử (dù RAM đã >6 GB lúc poll #4 — 5985 MB, vẫn dưới guard 6 GB; và birefnet không thuộc brief T4).

## 10. Nợ mở chuyển đợt 137

1. **Ngưỡng tickCost ≤60 ms: biên chỉ còn 2 ms (median 58,0, cao nhất 11 lượt).** Không đổi ngưỡng từ một lượt; đợt 137 xem median có ở lại vùng ≥55 ms không — nếu có thì bàn lại ngưỡng/bar hoặc điều tra tải song song. T4 không đổi ngưỡng.
2. **Logger đã nới ĐÃ KIỂM CHỨNG lần 2 liên tiếp — đề xuất GIỮ fix 530e10a7, không revert.** (Quyết parent đợt 135 §12.3(a) đã là GIỮ; lượt này củng cố thêm: loop 1–21, 20 wrap, coverage 1/1.)
3. **F-136-T4-1:** đợt sau thêm log ps snapshot khi blockers>0 trong poller (xem §5).
4. **(c2) lượt này chỉ 1 seq** (so với 7 seq đợt 135) — mẫu nhỏ hơn cho T3 bước 2; không phải lỗi, ghi để T3 biết.
5. **G1 vẫn hoãn; R9 (a) số đếm VẪN LÀ 16 — KHÔNG tăng; ci-security.yml vẫn 403; TTS 39 cấm kiểm lại; KHÔNG push khi user chưa nhắn "push đi".**

## 11. Stage (KHÔNG push) + cờ

- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round136-t4-quiet13.txt` — 1 entry (`docs/PHASE9_ROUND136_T4_WEBKIT_QUIET13_LIMITS.md`), verify bằng read-back. KHÔNG push.
- **Cờ:** `hidden_files/round136-t4.done` — dòng đầu: "1 attempt hop le (attempt1 20/20 pass); median tickCost 58,0 ms (nguong <=60 GIU, bien 2 ms — CAO NHAT 11 luot); (c2)=1; coverage 1/1; lop B 5/5; F6' DONG lan 2 lien tiep; logger noi KIEM CHUNG lan 2 (loop 1-21, 20 wrap)".
- **File làm việc (không stage, chỉ để trong `hidden_files/round136-t4/`):** probe (md5 70c7bb9a…), `b.json`, `vite.t4-temp.config.mjs`, `tree-md5.txt` (530e10a7), `poll-wait-t4-136.sh` + `poll-t4.log` (9 poll) + `poll-t4.nohup.log`, `run-attempt-136.sh`, `t4-attempt-inner.sh`, `check-classb-t4.sh`, `t4-histogram-with13.py`, `preview-b-f3-flip-webkit-t4-attempt1.json` (2.944.128 B, sha256 266767c0f7fe270dc7f0673f78ad5c341ed4d3decac2399237d777b1282a2847), `analyze-t4-attempt1-*.txt` (tickcost/wallbands/labellag/c2drawlog/c2coverage/skiplatest/lag5), `classb-t4-attempt1.txt`, `coverage-check-attempt1.txt`, `load-mid-t4-attempt1.log`, `ps-before/after-t4-attempt1.txt`, `vite-5187-t4-attempt1.log`, `run-webkit-t4-attempt1.log`, `marker-t4-attempt1`, `chain-t4.log`, `postboot-t4-136-gate0wait-*.log`.
