# PHASE9_ROUND135_T4_WEBKIT_QUIET12_LIMITS — Lượt yên WebKit #12 ĐO ĐƯỢC: 20/20 pass, median tickCost 40,0 ms, ngưỡng ≤60 ms GIỮ; logger đã nới ĐƯỢC KIỂM CHỨNG Ở RUNTIME (loop 1–22, 21 wrap, coverage 7/7)

> **Verdict: LƯỢT YÊN #12 ĐO ĐƯỢC — 1 attempt hợp lệ (attempt1, 20/20 pass, không reboot trong lúc đo). tickCost total median 40,0 ms (n=682, p90 65,0, max 101, min 28) — DƯỚI ngưỡng ≤60 ms, ngưỡng GIỮ NGUYÊN. (c2)=7, coverage log draw 7/7. Lớp B 5/5 ĐẠT. Logger đã nới (preview.tsx 530e10a7) ĐƯỢC KIỂM CHỨNG Ở RUNTIME LẦN ĐẦU: c2DrawLog n=1325 phủ loop 1–22 (loop ≥3 đầy đủ, mỗi loop 62–72 entry), 21 wrap — điều kiện revert "sau khi đo" ĐÃ XẢY RA và fix ĐÃ QUA kiểm chứng, đề xuất GIỮ fix 530e10a7, không revert.**
> **Lưu ý quy trình: cửa yên mở 2 lần; lần mở đầu (poller #6, 02:46:33Z, RAM 1031 MB) bị lỗi script của chính T4 (poller gọi nhầm run-attempt-134.sh, exit 127, 0 attempt chạy) — đã sửa và khởi động lại poller trong 1 phút, cửa mở lại ở poll #5 poller 2 (02:50:57Z, RAM 1632 MB) và attempt1 chạy thành công. Không mất dữ liệu đo; lỗi ghi rõ ở §5 (F-135-T4-1).**

## Kết quả chính

1. **Attempt1 HỢP LỆ, 20/20 pass, không reboot:** vite :5187 lên 02:50:59Z, probe chạy 02:51–02:54Z, JSON 3.763.122 B ghi 02:52:22Z, run-attempt exit 0 lúc 02:54:45Z. Boot 78b55838 xuyên suốt lượt (02:40Z lúc T4 bắt đầu → 02:58Z kiểm cuối), 0 reboot trong phiên T4 — lần đầu sau 2 đợt (đợt 134 có 4 reboot giữa lượt).
2. **tickCost median 40,0 ms — ngưỡng ≤60 ms GIỮ:** total n=682 median 40,0 / p90 65,0 / max 101 / min 28; hậu flip+2000 ms n=501 median 40,0. Wallbands ổn định theo dải thời gian (38,0–43,0 ms). Chuỗi 10 lượt yên hợp lệ nay: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / **40,0** — trung bình 46,6 ms (trước đây 46,9 ms với 9 lượt).
3. **(c2)=7, lag 1f toàn bộ:** seqs [166, 251, 305, 363, 448, 480, 534], (presented, label, lag) = (15,14,1), (15,14,1), (13,12,1), (13,12,1), (12,11,1), (13,12,1), (16,15,1). skippedLatest=1: 0 vi phạm thật (75/75 tick không vi phạm, pixel-verified 100%) — **F6' ĐÓNG** (bar ≥90%, n=75 ≥30). lag5: 0 event lag ≥+5f.
4. **Logger đã nới KIỂM CHỨNG RUNTIME (§6):** c2DrawLog n=1325 (drawSrc 682 / rawUnit 643; stage plain-native 682 / rawUnit 643; srcKind 'canvas 1280x720' 1325/1325; readyState 4 1325/1325; seeking False 1325/1325); **byLoop {1:63, 2:66, 3:64, 4:64, 5:62, 6:70, 7:62, 8:66, 9:66, 10:72, 11:64, 12:68, 13:62, 14:72, 15:68, 16:70, 17:66, 18:72, 19:63, 20:1, 21:63, 22:1}** — loop ≥3 ghi đầy đủ (khác hẳn đợt 134 partial chỉ toàn loop 1); **wraps=21**; frameIdx 0–72 (distinct 65); wallMs span 68.647 ms (9256→77903); 1 epoch duy nhất, loopNo [1..22]. **Coverage (c2) trong cửa sổ log: 7/7** (delta −27…+31 ms); blendTick hậu-flip trong ±500 ms của log: 412/412 (100%). Điều kiện revert trong quyết parent đợt 134 §12.3(a) ("revert sau khi đo") nay ĐÃ CÓ lượt đo hợp lệ và fix đã chứng minh ghi được loop ≥3 + wrap → đề xuất GIỮ 530e10a7, không revert.
5. **Lớp B 5/5 ĐẠT:** B1 load5 cuối 0,90 (≤2,5); B2 load1 max 1,88 (≤4; sampler n=10); B3 không reboot trong lúc đo (boot lúc bắt đầu = boot hiện tại 2026-11-18 02:27:27); B4 0 apt/dpkg lúc đánh giá; B5 RAM giữa lượt min 1208 MB, 0 mẫu <500 MB, 0 mẫu <1024 MB.
6. **Histogram (t4-histogram-with12.py, chạy trên JSON đợt 135):** nGhost 824; hist (pixFrame−label) {-11: 2, -9: 2, -1: 48, 0: 319, +1: 216, +2: 210, +3: 27} — 0: 38,7%, +1/+2: 51,7%, +3: 3,3%, ≥+3: 3,3%, <0: 6,3%; snapMs−labelMs median 35 ms (mean 40,9, p90 59); rawMs−labelMs median 8 ms. CurPix run đồng cung ≥3 tick: 15 run (vd (244,251,8), (356,363,8)). (Nhãn in của script còn ghi "luot #11" — lỗi nhãn thẩm mỹ, dữ liệu là JSON đợt 135 đã verify bằng đường dẫn; xem §7.)
7. **P7 (desync seek-latency) KIỂM ĐƯỢC LẦN ĐẦU SAU 4 LƯỢT:** với coverage 7/7 + log phủ toàn bộ hậu-flip (log max − flip = +52.425 ms), T3 bước 2 đợt 135 nay CÓ dữ liệu mới để kiểm P1–P7 (trước đó 0/9 lượt #9, 0/5 lượt #10, không có attempt #11).

## 0. Môi trường đo + prereg + cây đo

- **Brief T4 đợt 135:** chờ cờ POSTBOOT_PASS cho boot ĐANG CHẠY (khớp boot_id, cờ stale boot cũ KHÔNG tính); chờ RAM theo cơ chế đã chứng minh (poll dày 45 s, ngưỡng RAM ≥1024 MB, ghi rõ poll nào mở gate + RAM lúc mở); chạy lượt yên #12 đúng phương pháp đợt 133 (20/20 pass, tickCost median, ngưỡng ≤60 ms, lớp B 5/5, JSON gốc + sha256); nếu attempt bị reboot giết thì chạy lại nếu còn thời gian trước hạn 04:30Z; ghi rõ mâu thuẫn thời gian qua ranh giới reboot (nếu có) và chỉ dùng khung chết theo quan sát trực tiếp; TUYỆT ĐỐI KHÔNG revert preview.tsx về 805409f0.
- **Probe tái dùng nguyên bản đợt 133:** `hidden_files/round135-t4/probe121t3-ghost-k7.webkit.mjs`, md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp bản đợt 132/133/134), `node --check` OK. Analyzer đã dry-run PASS trên dữ liệu đợt 133 trước khi đo (tái tạo đúng median 39,5 / (c2) seqs 166/218/293/323/394 / c2DrawLog byLoop {1:66, 2:71} — xem §8).
- **Cây đo:** `preview.tsx 530e10a7` (fix logger đã nới GIỮ theo quyết parent đợt 134 §12.3(a) — KHÔNG revert), `media.ts 2c384ed1`, `vite.config.ts ee80d093` (khớp cây lúc mở đợt theo round-in-progress.md; chỉ preview.tsx khác đợt 133, đúng fix đã duyệt). T4 KHÔNG sửa file production nào.
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu — là marker MỞ ĐỢT 135 do parent tạo (02:35Z), KHÔNG phải đợt main-chat — T4 tiến hành bình thường (tiền lệ đợt 130–134).
- **Boot lúc mở đợt:** 78b55838-d09e-4cfc-b491-a15935b7a447, btime 02:27:27Z theo /proc/stat (T5 ghi 02:27:38Z trong cờ — chênh 11 s, cùng boot_id, xem §4). RAM available lúc mở ~1.177 MB (theo round-in-progress.md); lúc T4 bắt đầu (02:40Z) RAM 963 MB, rồi hồi lên 1498 MB lúc poll #1 (02:42:47Z).

## 1. Gate 0 — ĐẠT 02:45:13Z trên boot 78b55838 (T5 watcher b88, poll 2)

| Điều kiện | Kết quả |
|---|---|
| (0a) T5 flag `round135-t5/POSTBOOT_PASS` khớp boot | **PASS** — `boot_id=78b55838-d09e-4cfc-b491-a15935b7a447 btime=2026-11-18T02:27:38Z pass_at=2026-11-18T02:45:13Z poll=2` (T5 watcher b88 v6). Cờ stale đợt 134 (cc1f9de0, pass_at 01:13:56Z) nằm ở `round134-t5/` — KHÔNG dùng, đúng brief. |
| (0b) check-only postboot riêng PASS | **PASS exit 0 ngay poll #1** (02:42:47Z) và mọi lần kiểm sau. Log T5 poll0: replay ĐÃ XONG lúc mở đợt 135 — dpkg 1545 dòng / 221 installs, dòng cuối 02:37:47Z, GST 269, plugins-bad ĐÃ CÀI; postboot poll0 PASS exit 0 ngay 02:41Z. |
| (0c) apt-get/dpkg = 0 (pgrep -x) | **0/0 suốt lượt** (mọi poll). |
| (0d) cây md5 == tree-md5.txt (530e10a7) | **YES suốt lượt** — preview.tsx 530e10a7 (kiểm lại lúc đóng 02:58Z vẫn 530e10a7). |

## 2. Gate A — MỞ 2 LẦN (1 lần bị lỗi script, 1 lần chạy attempt)

### 2.1 Poller 1 — boot 78b55838 (6 poll, 02:42:47Z–02:46:33Z)

| Poll | Thời gian | RAM | load1/load5 | lock | blockers | cây | t5flag | postboot |
|---|---|---|---|---|---|---|---|---|
| #1 | 02:42:47Z | 1498 MB | 1,84 / 1,23 | không | 0 | YES 530e10a7 | chua-co | 0 |
| #2 | 02:43:32Z | 1643 MB | 1,28 / 1,18 | không | 0 | YES | chua-co | 0 |
| #3 | 02:44:17Z | 1426 MB | 0,80 / 1,06 | không | 0 | YES | chua-co | 0 |
| #4 | 02:45:02Z | 1329 MB | 0,58 / 0,98 | không | 0 | YES | chua-co | 0 |
| #5 | 02:45:47Z | 1138 MB | 1,66 / 1,17 | không | **3** | YES | **PASS** | 0 |
| #6 | 02:46:33Z | **1031 MB** | 1,38 / 1,14 | không | 0 | YES | **PASS** | 0 → **CỬA MỞ (lần 1)** |

- Poll #5: gate 0 đã PASS nhưng **blockers=3** nên cửa không mở (đúng luật gate A: blockers phải = 0). 3 blocker này không xác định được danh tính sau sự kiện (không lưu ps tại poll đó) — nhiều khả năng là tiến trình watcher/postboot của T5 (b88) đang chạy lúc đó; ghi nhận là chưa xác định, không suy đoán thêm.
- Poll #6: mọi tiêu chí đạt (RAM 1031 MB — chỉ hơn ngưỡng 7 MB) → cửa mở, nhưng poller gọi nhầm `run-attempt-134.sh` (file không tồn tại) → **exit 127, 0 attempt chạy** (xem §5 F-135-T4-1). Poller thoát theo thiết kế (exit 0 sau khi "attempt chạy xong") — T4 phát hiện trong 1 phút và khởi động lại poller đã sửa.
- **Nguồn cửa sổ: (1) cửa sổ vàng sau boot** — boot 15–19 phút tuổi, postboot PASS, RAM >1000 MB. Không phải đợt hồi RAM giữa lượt (boot còn trẻ).

### 2.2 Poller 2 (đã sửa) — boot 78b55838 (5 poll, 02:47:56Z–02:50:57Z)

| Poll | Thời gian | RAM | load1/load5 | lock | blockers | cây | t5flag | postboot |
|---|---|---|---|---|---|---|---|---|
| #1 | 02:47:56Z | 955 MB | 0,96 / 1,06 | không | 0 | YES | PASS | 0 |
| #2 | 02:48:41Z | 831 MB | 0,73 / 0,98 | không | 0 | YES | PASS | 0 |
| #3 | 02:49:26Z | 1023 MB | 0,93 / 1,00 | không | 0 | YES | PASS | 0 |
| #4 | 02:50:12Z | 974 MB | 0,65 / 0,92 | không | 0 | YES | PASS | 0 |
| #5 | 02:50:57Z | **1632 MB** | 0,65 / 0,90 | không | 0 | YES | PASS | 0 → **CỬA MỞ (lần 2)** |

- Poll #3 RAM 1023 MB — thiếu ngưỡng đúng 1 MB, cửa không mở (ngưỡng giữ cứng, không hạ).
- Poll #5: RAM hồi mạnh **974 → 1632 MB trong 45 s** (đợt hồi RAM giữa lượt — nguồn cửa sổ (2) như đợt 133) → cửa mở, attempt1 chạy ngay trong cùng giây.
- **Tổng poll: 11 poll (6 + 5); cửa mở 2 lần; 1 attempt hợp lệ.**

## 3. Attempt1 — HỢP LỆ, 20/20 pass trên boot 78b55838 (KHÔNG reboot)

- **Chạy:** gate mở 02:50:57Z → vite :5187 lên sau ~2 s (lock v2 `run-attempt t4 5187 1500 30 normal`; VITE v6.4.5 ready in 492 ms) → probe 02:51:0xZ → JSON ghi 02:52:22Z → probe thoát ~02:54:0xZ → analyzer + class-B xong 02:54:45Z, **run-attempt exit=0**.
- **JSON:** `preview-b-f3-flip-webkit-t4-attempt1.json` — 3.763.122 B, sha256 `2efceefde7b26765a3c0a1466d715096ac453389c6d9170972fee708451b31df`, `passes: 20`, engine webkit 27.2, `pageErrs=[]`, flip afterPass=5 wallMs=25478.
- **Sampler của T4 (giữa lượt, theo sampler của mình):** n=10, 02:50:59Z–02:54:00Z, RAM 1478 → 1608 MB (min 1208 theo class-B — mẫu min nằm giữa các lần ghi log của T4; ghi rõ "theo sampler của mình", bài học F-133-8). Load 0,41–1,88. Sau lượt RAM tiếp tục hồi lên 2361–2639 MB (balloon xả).
- **Dọn dẹp sau lượt:** vite :5187 chết (curl 000), `vite.lock` không tồn tại, 0 process vite/webkit/probe/MiniBrowser sót (kiểm 02:56Z — các dòng ps còn lại chỉ là shell của các luồng khác + chính shell kiểm tra của T4).
- **Không có attempt2:** attempt1 đã cho verdict rõ về ngưỡng (median 40,0 ≤ 60) + lớp B 5/5 — đúng brief (KHÔNG attempt2 khi attempt1 đã verdict rõ).

## 4. Reboot — 0 reboot trong phiên T4; ghi chú btime 11 s

- **Không reboot nào** từ lúc T4 bắt đầu (02:40Z) tới kiểm cuối (02:58Z): boot_id 78b55838 xuyên suốt; poll log không có dòng REBOOT nào; boot lúc bắt đầu = boot hiện tại (class-B B3 ĐẠT).
- **Chênh btime 11 s (không phải mâu thuẫn):** /proc/stat btime = 02:27:27Z (poller + T5 poll0 đều đọc 02:27:27Z); cờ POSTBOOT_PASS của T5 ghi btime=02:27:38Z. Cùng boot_id 78b55838, chênh 11 s — khác hẳn 2 mâu thuẫn đợt 134 (btime boot mới TRƯỚC mốc last-seen của boot cũ). Đây là chênh lệch ghi nhận thời điểm boot (T5 ghi lúc watcher phát hiện boot mới), không ảnh hưởng khung chết vì không có reboot nào trong phiên. Ghi đủ 2 số, không chọn một số làm "chính thức".

## 5. Lỗi quy trình F-135-T4-1 — poller gọi nhầm run-attempt-134.sh (exit 127)

- **Sự việc:** khi adapt script từ đợt 134 sang 135, `poll-wait-t4-135.sh` chỉ được sed đổi `round134-t4→round135-t4`, `round134-t5→round135-t5`, `poll-wait-t4-134→poll-wait-t4-135` — lệnh gọi `bash "$W/run-attempt-134.sh"` ở dòng 89 KHÔNG được đổi (tên file không chứa chuỗi `round134`). Kiểm tra trước khi chạy (`bash -n` OK + `node --check` probe OK + dry-run analyzer OK) không bắt được lỗi này vì đó là lỗi tên file runtime, không phải lỗi cú pháp.
- **Hậu quả:** cửa yên mở lần 1 (poll #6, 02:46:33Z, RAM 1031 MB) bị bỏ lỡ — 0 attempt chạy, poller thoát. Không mất dữ liệu đo (chưa có attempt nào chạy); chỉ mất ~4 phút (phát hiện 02:47:42Z, sửa + khởi động lại poller 02:47:56Z).
- **Khắc phục:** sửa dòng 89 thành `run-attempt-135.sh`, `bash -n` lại OK, khởi động poller 2 — cửa mở lại 02:50:57Z với RAM tốt hơn (1632 MB so với 1031 MB) và attempt1 thành công. Bài học: khi adapt script giữa các đợt, grep toàn bộ chuỗi `134` trong thư mục mới (không chỉ `round134-`) trước khi chạy poller; đợt sau kiểm tra bằng `ls` thực tế file được gọi tới.
- **Dư sót thẩm mỹ (không ảnh hưởng đo):** tên file log postboot vẫn `postboot-t4-134-gate0wait-*.log` (dòng 76 poll-wait) và comment trong `run-attempt-135.sh` dòng 8 còn ghi "poll-wait-t4-134.sh"; nhãn in của `t4-histogram-with12.py` còn ghi "luot #11". Cả ba chỉ là tên/nhãn, không ảnh hưởng dữ liệu — để nguyên, không sửa giữa chừng khi poller đang chạy.

## 6. Log draw với logger đã nới — KIỂM CHỨNG RUNTIME ĐẦY ĐỦ (loop 1–22, 21 wrap)

- Chạy `analyze-t4-c2drawlog.py` trên JSON attempt1: **c2DrawLog n=1325** (drawSrc 682 / rawUnit 643; stage plain-native 682 / rawUnit 643; srcKind 'canvas 1280x720' 1325/1325; readyState 4 1325/1325; seeking False 1325/1325); **loopNo 1–22, loop 3–19 mỗi loop 62–72 entry** (loop 20: 1, loop 22: 1 — 2 entry biên tại wrap); frameIdx 0–72 (distinct 65); wallMs 9256→77903 (span 68.647 ms); ct 0–2,400 s; **wraps 21**; drawSrc nonmono-lần-giảm=21.
- **Đọc đúng:** logger đã nới ghi được mọi loop ≥1 trong suốt 68,6 s đo (tương đương ~22 vòng video 3 s), KHÔNG bị cắt ở loop 2 như logger cũ (đợt 133: byLoop chỉ {1:66, 2:71}). Fix loop-gate nới + re-enable không xóa mảng ĐÃ HOẠT ĐỘNG ĐÚNG ở runtime.
- **Coverage (c2) 7/7:** log wallMs min 9256 (trước flip 25478) → max 77903 (sau flip +52.425 ms); 1 epoch duy nhất; 7/7 seq (c2) có log gần nhất trong ±31 ms; blendTick hậu-flip 412/412 trong ±500 ms của log.
- **Hệ quả cho T3 bước 2:** P7 nay CÓ dữ liệu mới (coverage đầy đủ hậu-flip); prereg ghost-freeze/skew: P1/P3 đợt 133 đứng nguyên (5/5), cộng dồn P1 14/14 + lượt này, P3 13/14 + lượt này — T3 tự tổng hợp từ JSON gốc (không suy diễn thay T3).

## 7. Ngưỡng ≤60 ms — GIỮ NGUYÊN (có số mới, vẫn dưới ngưỡng)

| Lượt yên hợp lệ | tickCost total median (ms) | (c2) | Coverage | Lớp B |
|---|---|---|---|---|
| #1–#9 (tới đợt 131) | 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / — / 54,0 / 40,0 / 56,0 (8 lượt có số) | — | — | — |
| #10 (T4 đợt 133 a1) | **39,5** (thấp nhất) | 5 | 0/5 | 5/5 |
| #11 (T4 đợt 134) | KHÔNG CÓ SỐ — 0 attempt hợp lệ | — | — | — |
| **#12 (T4 đợt 135 a1)** | **40,0** | **7** | **7/7** | **5/5** |

Trung bình 10 lượt nay 46,6 ms. Median 40,0 ms < ngưỡng 60 ms với biên 20 ms; p90 65,0 ms; wallbands theo dải 38,0–43,0 ms — không có dấu hiệu trôi ngưỡng. Không đề xuất đổi ngưỡng, bar hay DEF từ lượt này. Lượt #12 là lượt yên hợp lệ thứ 10 (và là lượt đầu tiên coverage 7/7 kể từ khi logger nới).

## 8. Kiểm chứng độc lập của script trước khi đo (dry-run)

- Trước khi mở poller, chạy toàn bộ analyzer trên JSON đợt 133 (`round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json`): tickCost median **39,5** (khớp), (c2) seqs **166/218/293/323/394** (khớp), c2DrawLog byLoop **{1:66, 2:71}** (khớp logger cũ). Probe md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp đợt 132/133/134); `node --check` OK; `bash -n` OK cả 4 script (sau khi sửa F-135-T4-1, `bash -n` lại OK).
- `t4-histogram-with12.py` chạy được trên JSON đợt 135 (nGhost 824, hist {-11: 2, -9: 2, -1: 48, 0: 319, +1: 216, +2: 210, +3: 27}, snapMs−labelMs median 35 ms) — xem §kết quả chính mục 6. Nhãn in "luot #11" là lỗi thẩm mỹ, dữ liệu là JSON đợt 135.

## 9. Trạng thái sau đo (kiểm cuối 02:58Z)

- Boot 78b55838 còn sống (btime 02:27:27Z, tuổi ~31 phút); không reboot trong lúc kiểm cuối.
- Vite :5187 đã chết (curl 000); `vite.lock` không tồn tại; không process vite/webkit/probe/MiniBrowser nào sót.
- Cây không đổi so với lúc đo: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093.
- Không file production nào bị sửa bởi T4; chỉ thêm file làm việc trong `hidden_files/round135-t4/` + LIMITS này trong `repo-1/docs/`.
- RAM 2361 MB lúc kiểm cuối; cờ T5 vẫn PASS cho boot hiện tại.
- TTS 39 không kiểm lại; birefnet không thử (RAM <6 GB suốt lượt).

## 10. Nợ mở chuyển đợt 136

1. **Logger đã nới ĐÃ KIỂM CHỨNG — đề xuất GIỮ fix 530e10a7, không revert.** Điều kiện revert "sau khi đo" đã xảy ra với kết quả tốt (loop 1–22, 21 wrap, coverage 7/7). T3/parent quyết cuối; T4 không động vào preview.tsx.
2. **F-135-T4-1:** đợt sau adapt script phải grep toàn bộ chuỗi số đợt cũ trong thư mục mới + `ls` file được gọi tới trước khi mở poller (lỗi tên file runtime không bị `bash -n` bắt).
3. **Blockers=3 ở poll #5 poller 1** chưa xác định danh tính — đợt sau nên log `ps` snapshot khi blockers>0 để truy vết (nhiều khả năng là watcher T5).
4. **G1 vẫn hoãn; R9 (a) số đếm VẪN LÀ 16 — KHÔNG tăng; ci-security.yml vẫn 403; TTS 39 cấm kiểm lại; KHÔNG push khi user chưa nhắn "push đi".**

## 11. Stage (KHÔNG push) + cờ

- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round135-t4-quiet12.txt` — 1 entry (`docs/PHASE9_ROUND135_T4_WEBKIT_QUIET12_LIMITS.md`), verify bằng read-back. KHÔNG push.
- **Cờ:** `hidden_files/round135-t4.done` — dòng đầu: "1 attempt hop le (attempt1 20/20 pass); median tickCost 40,0 ms (nguong <=60 GIU); (c2)=7; coverage 7/7; lop B 5/5; logger noi KIEM CHUNG runtime (loop 1-22, 21 wrap)".
- **File làm việc (không stage, chỉ để trong `hidden_files/round135-t4/`):** probe (md5 70c7bb9a…), `b.json`, `vite.t4-temp.config.mjs`, `tree-md5.txt` (530e10a7), `poll-wait-t4-135.sh` + `poll-t4.log` (11 poll) + `poll-t4.nohup.log` + `poll-t4-restart.nohup.log`, `run-attempt-135.sh`, `t4-attempt-inner.sh`, `check-classb-t4.sh`, `t4-histogram-with12.py`, `preview-b-f3-flip-webkit-t4-attempt1.json` (3.763.122 B, sha256 2efceefde7b26765a3c0a1466d715096ac453389c6d9170972fee708451b31df), `analyze-t4-attempt1-*.txt` (tickcost/wallbands/labellag/c2drawlog/c2coverage/skiplatest/lag5), `classb-t4-attempt1.txt`, `coverage-check-attempt1.txt`, `load-mid-t4-attempt1.log`, `ps-before/after-t4-attempt1.txt`, `vite-5187-t4-attempt1.log`, `run-webkit-t4-attempt1.log`, `marker-t4-attempt1`, `chain-t4.log`, `postboot-t4-134-gate0wait-*.log` (tên file còn số 134 — xem §5).
