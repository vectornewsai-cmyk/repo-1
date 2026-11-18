# PHASE9_ROUND134_T4_WEBKIT_QUIET11_LIMITS — Lượt yên WebKit #11 KHÔNG ĐO ĐƯỢC: 0 attempt hợp lệ (4 reboot giữa lượt giết attempt1 + chặn gate 0); logger đã nới CHƯA ĐƯỢC KIỂM CHỨNG bằng lượt yên đầy đủ

> **Verdict: LƯỢT YÊN #11 KHÔNG ĐO ĐƯỢC — 0 attempt hợp lệ. Attempt1 duy nhất trên boot d2e66749 bị reboot giết giữa pass 3/20 (passesDone=2, flip chưa tới, JSON partial). Sau đó 3 reboot nữa (tổng cộng 4 reboot trong cửa sổ 23:50Z–01:00Z); cờ POSTBOOT_PASS mới của T5 KHÔNG BAO GIỜ xuất hiện cho 3 boot sau; postboot check-only exit=1 suốt; RAM kẹt 451–710 MB trong phần lớn thời gian chờ. Ngưỡng ≤60 ms: KHÔNG CÓ SỐ MỚI — GIỮ NGUYÊN theo 9 lượt trước (không đổi ngưỡng khi không có dữ liệu mới). Log draw coverage: KHÔNG ĐO ĐƯỢC (0 attempt hợp lệ; logger đã nới chưa được kiểm chứng bằng lượt yên đầy đủ).**
> **Logger đã nới (preview.tsx 530e10a7) ĐÃ ĐƯỢC XÁC MINH Ở MỨC CODE + BUILD (T3: tsc 0, vite build PASS; T4 đối chiếu diff chỉ đúng hunk c2DrawLogPush) và CÒN NGUYÊN sau 4 reboot — nhưng bằng chứng runtime duy nhất (log draw n=53 trong JSON partial) chỉ toàn loop 1, 0 wrap — KHÔNG chứng minh được loop ≥3. Việc revert hay giữ fix là quyết của T3/parent: điều kiện revert "sau khi đo" CHƯA XẢY RA (chưa đo được), nên đề xuất GIỮ fix cho đợt 135.**

## Kết quả chính

1. **Cờ fix T3 CÓ, ĐÚNG HẠN:** `round134-t3-fix.done` mtime 23:48:59Z (trước hạn chờ ~01:00Z). preview.tsx md5 TRƯỚC 805409f0 → SAU 530e10a7 (đầy đủ 530e10a7266b8c148411ba21510b501a); file thực tế lúc đo 530e10a7, KHÁC md5 cũ — đúng yêu cầu brief (không đo bằng logger cũ). T3: tsc 0 lỗi, vite build PASS (13,01 s, 290 modules). T4 KHÔNG tự sửa production (đúng brief — chỉ T3 được sửa).
2. **Gate 0 + gate A MỞ ĐÚNG 1 LẦN (poller #1, boot d2e66749, 23:50:17Z):** cờ T5 `round134-t5/POSTBOOT_PASS` pass_at 23:49:21Z poll=2 (khớp boot), check-only postboot exit 0, apt/dpkg 0, cây YES 530e10a7, RAM 2037 MB, load1 1,08 / load5 1,44, lock trống, blockers 0. Attempt1 chạy ngay trong cùng giây — đúng cơ chế "chớp cửa sổ". Cửa sổ này là **cửa sổ vàng sau boot** (boot 23 phút tuổi, postboot PASS, RAM >2000 MB) — nguồn (1) trong hai nguồn cửa sổ.
3. **Attempt1 BỊ GIẾT bởi reboot #1 (giữa pass 3/20):** probe chạy 23:50:50Z → reboot ~23:53:17–50Z; passesDone=2, JSON partial 257.631 B (sha256 `b402b3f3…76bc6`), flip wallMs=None (flip sau pass 5, chưa tới), blendTick n=23. Heartbeat kẹt ở pass 3 elapsed=100s. Sampler của T4: RAM cuối 1382 MB (theo sampler của mình). Vite :5187 chết, lock sạch, 0 process sót. Đây là **lỗi harness (reboot ngoài phép đo), KHÔNG phải lỗi ngưỡng** → chạy lại là có căn cứ (xem §4).
4. **3 reboot nữa trong lúc chờ (tổng 4 reboot):** 81335571 (sống ~19,5 phút) → 52ca5d6d (sống <1 phút) → 1d2e984d (sống ~4 phút) → cc1f9de0 (còn sống lúc đóng, 43+ phút). Poller phải khởi động lại 4 lần; mỗi lần đều ghi log đầy đủ (tổng 82 poll). **Cờ T5 mới KHÔNG BAO GIỜ xuất hiện** cho 3 boot sau (T5 watcher b86/b87 chạy, postboot_exit=1 suốt; replay dpkg có lúc chạy — lines 2→1721 — nhưng check-only không PASS lần nào).
5. **RAM sau các reboot: kẹt thấp, không hồi như đợt 133.** Boot 81335571: 1724 → 451 MB. Boot cc1f9de0: 1557 → 494 MB, dao động 494–710 MB trong 40 phút cuối. Không có đợt hồi RAM giữa lượt nào (khác đợt 133: 479 → 1549 MB). Gate A (RAM ≥1024) không mở lần nào sau poller #1.
6. **Hết hạn 01:00Z 18/11 — đóng 0 attempt hợp lệ, đúng brief.** Poller tự dừng exit 5 ("HET HAN CHO 01:00Z 18/11 — 0 attempt"). Không kéo dài hạn (không có căn cứ: cờ T5 chưa có + RAM ~500 MB + replay chưa PASS).
7. **Ngưỡng ≤60 ms GIỮ NGUYÊN (không có số mới):** 9 lượt yên hợp lệ trước đó: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 ms, trung bình 46,9 ms. Lượt #11 không đóng góp số nào — không đổi ngưỡng, không đổi bar, không viết DEF mới.
8. **(c2), log draw coverage, lớp B: KHÔNG CÓ SỐ.** Không attempt hợp lệ → không (c2) seq nào, không coverage x/5, không đánh giá lớp B. Phần §6 chỉ ghi bằng chứng phụ từ JSON partial (n=53, toàn loop 1) — KHÔNG dùng làm verdict.

## 0. Môi trường đo + prereg + cây đo

- **Brief T4 đợt 134:** chờ cờ `round134-t3-fix.done` tới ~01:00Z 18/11 (KHÔNG đo bằng logger cũ — md5 lúc đo phải KHÁC 805409f0); chờ RAM theo cơ chế đã chứng minh (poll dày 45 s, ngưỡng RAM ≥1024 MB như đợt 133, ghi rõ từng poll + nguồn cửa sổ); gate 0 = cờ T5 `round134-t5/POSTBOOT_PASS`; chạy lượt yên #11 đúng phương pháp đợt 133 (20/20 pass, tickCost median, ngưỡng ≤60 ms, lớp B 5/5, JSON gốc + sha256); KHÔNG attempt2 nếu attempt1 đã cho verdict rõ về ngưỡng; nếu attempt1 không hợp lệ (lỗi harness) thì ghi rõ lý do và chỉ chạy lại khi có căn cứ; ghi rõ RAM min theo sampler của mình (bài học F-133-8).
- **Probe tái dùng nguyên bản đợt 133:** `hidden_files/round134-t4/probe121t3-ghost-k7.webkit.mjs`, md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp bản đợt 132/133), `node --check` OK. Analyzer đã dry-run PASS trên dữ liệu đợt 133 trước khi đo (tái tạo đúng median 39,5 / (c2)=5 cùng 5 seq / coverage 0/5 / histogram khớp 100% — xem §8). Histogram đổi sang `t4-histogram-with11.py` (RUNS trỏ JSON đợt 134; chưa chạy được vì không có JSON hợp lệ).
- **Cây đo:** `preview.tsx 530e10a7` (SAU fix T3 — KHÁC 805409f0 đợt 133), `media.ts 2c384ed1`, `vite.config.ts ee80d093` (media/vite khớp đợt 133; chỉ preview.tsx đổi theo đúng quyết parent §12.1(a)). Fix đã verify ở mức code: loop-gate nay `c2DrawLogLoopNo < 1 || > c2DrawLogMaxLoop()` (mặc định vô hạn; `window.__vcutC2DrawLogMaxLoop = 2` khôi phục hành vi cũ); re-enable KHÔNG xóa mảng / KHÔNG reset loopNo nữa (chỉ reset khi `window.__vcutC2DrawLogReset === true`); diff 36 dòng +/−, chỉ đúng hunk `c2DrawLogPush` (`hidden_files/round134-t3/preview-fix.diff`).
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu — là marker MỞ ĐỢT 134 do parent tạo (23:35Z), KHÔNG phải đợt main-chat — T4 tiến hành bình thường (tiền lệ đợt 130–133).
- **Boot lúc mở đợt:** d2e66749, btime 23:26:58Z 17/11/2026. RAM available lúc mở ~1295 MB (theo log mở đợt).

## 1. Gate 0 — ĐẠT 23:49:21Z trên boot d2e66749, rồi MẤT VĨNH VIỄN sau reboot #1

| Điều kiện | Boot d2e66749 (23:49–23:50Z) | 3 boot sau (81335571 / 1d2e984d / cc1f9de0) |
|---|---|---|
| (0a) T5 flag `round134-t5/POSTBOOT_PASS` khớp boot | **PASS** — `boot_id=d2e66749-... btime=2026-11-17T23:26:58Z pass_at=2026-11-17T23:49:21Z poll=2` (122 B, mtime 23:49:21Z). T5 viết bằng watcher b85 (poll 2). | **KHÔNG BAO GIỜ CÓ** — cờ cũ bị T5 xóa/archive giữa poll #6–#7 của poller 2 (t5flag `cu(mtime-cu)` → `chua-co` lúc 00:00:45Z); không cờ mới nào cho 3 boot sau tới 01:00:55Z. T5 watcher b86 (boot 81335571) + b87 (boot cc1f9de0) vẫn chạy, không viết cờ. |
| (0b) check-only postboot riêng PASS | **PASS** — exit 0 ở poll #1 (23:50:17Z). | **exit=1 SUỐT** — mọi poll, mọi boot sau. T5 b87: `postboot_exit=1`, replay frozen nhiều lần (silent 634–1141 s), rồi cài đặt trở lại theo đợt (dpkg lines 2→729→1144→1459→1573→1721) nhưng check vẫn không PASS tới hạn. |
| (0c) apt-get/dpkg = 0 (pgrep -x) | **0/0** ở poll #1. | apt=1 trong hầu hết poll (apt-get của T5/replay đang chạy); dpkg=0–1. |
| (0d) cây md5 == tree-md5.txt (530e10a7) | **YES** — preview.tsx 530e10a7. | **YES suốt** — fix còn nguyên sau cả 4 reboot (kiểm lại 00:13:45Z, 00:18:19Z, 01:00:55Z đều 530e10a7). |

## 2. Gate A — MỞ ĐÚNG 1 LẦN ở poll #1 (23:50:17Z, boot d2e66749), rồi không mở lại

### 2.1 Poller 1 — boot d2e66749 (1 poll, cửa mở ngay)

| Poll | Thời gian | RAM | load1/load5 | lock | blockers | cây | t5flag | postboot |
|---|---|---|---|---|---|---|---|---|
| #1 | 23:50:17Z | **2037 MB** | 1,08 / 1,44 | không | 0 | YES 530e10a7 | PASS | 0 → **CỬA MỞ** |

- Mọi tiêu chí gate A đều đạt ở poll #1: load1 <2, load5 <2, RAM 2037 ≥1024, lock trống, blockers 0, cây YES, gate 0 PASS. Poller chạy attempt1 ngay trong cùng giây.
- **Nguồn cửa sổ: (1) cửa sổ vàng sau boot** — boot 23 phút tuổi, postboot PASS, RAM >2000 MB. Không phải đợt hồi RAM giữa lượt (boot còn trẻ, chưa có luồng nào kết thúc để hồi RAM).

### 2.2 Poller 2 — boot 81335571 (23 polls, 23:56:13Z–00:12:49Z, RAM min 451 / max 1724 MB)

- RAM: 1362 → 1351 → 1676 → 1288 → 1279 → 1205 → 1050 → 973 → … → 698 → 654 → 581 → 514 → 483 → 497 → 492 → 548 → 566 MB. Vượt 1024 chỉ ở 5 poll đầu (tới ~00:02Z), nhưng gate 0 chưa bao giờ đạt (t5flag chua-co + postboot_exit=1) nên cửa không mở.
- Load thấp (0,24–1,88), lock trống, blockers 0–1, apt=1, dpkg_lines=2 (log dpkg gần như trống trên boot này — không có cài đặt nào ghi nhận).
- T5 b86: replay frozen, silent tới 1141 s, last dpkg line 23:54:10, TRIGGER §8.2B lúc YES (poll 7) lúc NO (poll 12–14) — thuộc phạm vi T5, T4 chỉ ghi lại.

### 2.3 Poller 3 — boot 1d2e984d (4 polls, 00:15:37Z–00:17:53Z, RAM min 1488 / max 1876 MB)

- RAM 1876 → 1706 → 1675 → 1488 MB (luôn ≥1024 — cửa sổ vàng sau boot ĐANG MỞ về RAM), nhưng gate 0 chưa đạt (t5flag chua-co, postboot_exit=1) nên cửa không mở.
- load1 4,51 → 1,08 (cao lúc đầu do hệ thống sau boot + apt đang chạy), apt=1–2, dpkg_lines 133 → 433 → 550 → 729 (cài đặt ĐANG CHẠY TÍCH CỰC — có thể là replay của T5 — rồi boot chết giữa chừng).
- Boot chỉ sống ~4 phút; poller chết theo reboot #4.

### 2.4 Poller 4 — boot cc1f9de0 (54 polls, 00:19:28Z–00:59:19Z, RAM min 494 / max 1557 MB)

- RAM: 1557 → 1465 → 1088 → 1316 → 1223 → 832 → 760 → 651 → 621 → 832 → 717 → 505 → 531 → 581 → 509 → 549 → 629 → 610 → 512 → 710 MB (poll cuối #54, 00:59:19Z). Vượt 1024 chỉ ở ~7 poll đầu (tới ~00:24Z), sau đó kẹt 494–832 MB suốt 35 phút — **không có đợt hồi RAM giữa lượt** (khác đợt 133).
- dpkg_lines: 2 → 729 (00:32Z) → đứng yên ~14 phút → 1059 → 1144 (00:46Z) → 1451 → 1459 (00:51Z) → 1514 → 1573 (00:55Z) → 1721 (00:59:19Z, vượt baseline 1545). Replay chạy theo đợt, nhưng postboot check-only vẫn exit=1 ở lần kiểm cuối (poll #53, pb_age=1 ở #54).
- T5 b87 tới poll 30 (00:50:50Z), vẫn `postboot_exit=1`, TRIGGER=NO. Không cờ mới.
- Hết hạn: poller tự dừng 01:00:12Z, exit 5 — "HET HAN CHO 01:00Z 18/11 — 0 attempt (gate A khong mo trong cua so cho)".

### 2.5 Tổng poll: 82 poll (1 + 23 + 4 + 54); chỉ 1 lần cửa mở (poller 1)

## 3. Attempt1 — BỊ GIẾT giữa pass 3/20 trên boot d2e66749 (KHÔNG HỢP LỆ)

- **Chạy:** 23:50:17Z (sampler) → vite :5187 lên sau 3 s (lock v2 `run-attempt t4 5187 1500 30 normal`, ticket 1-1794959417439802224-14387-t4) → probe 23:50:50Z → **reboot giết giữa pass 3** (heartbeat kẹt `[HB129] play pass 3/20 elapsed=100s passesDone=2`, dòng cuối 23:53:50Z).
- **JSON partial:** `preview-b-f3-flip-webkit-t4-attempt1.json-ABORTED-boot-d2e66749-reboot235317Z` — 257.631 B, sha256 `b402b3f3f83137a785303784eeb3a02c6653b1413b34552dce230533d3766bc6`, `passesDone=2`, `partial=true`, `partialReason="sau pass"`, `flip={afterPass: 5, wallMs: null}` (**flip chưa tới**), blendTick n=23. Không có dữ liệu hậu-flip → không median, không (c2), không lớp B.
- **Sampler của T4 (giữa lượt, theo sampler của mình):** RAM 1457 → 1418 → 1382 MB (mẫu cuối 23:53:40Z, trước reboot). Ghi rõ "theo sampler của mình" (bài học F-133-8) — không khẳng định số tuyệt đối.
- **Dọn dẹp sau reboot:** vite :5187 chết (curl 000), `vite.lock` không tồn tại, 0 process vite/webkit/probe/MiniBrowser sót (kiểm 23:54:29Z).
- **File gốc đã đổi tên bảo toàn bằng chứng** (không xóa): JSON partial + `load-mid-t4-attempt1.log` + `ps-before/after-t4-attempt1.txt` + `vite-5187-t4-attempt1.log` + `run-webkit-t4-attempt1.log` + `marker-t4-attempt1` đều mang hậu tố `-ABORTED-boot-d2e66749-reboot235317Z`.

## 4. Tại sao chạy lại attempt1 sau reboot #1 (quyết định có căn cứ)

- (a) Nguyên nhân là **lỗi harness ngoài phép đo** (reboot giết probe giữa pass 3), không phải lỗi ngưỡng — không có verdict ngưỡng nào để giữ.
- (b) Cơ chế poller đã dự liệu reboot giữa lượt (reset gate 0, chờ cờ T5 mới cho boot mới) — chạy lại là đúng thiết kế, không phải lách luật.
- (c) Còn hạn tới 01:00Z (~65 phút lúc quyết định 23:56Z); fix T3 còn nguyên (md5 530e10a7); RAM boot mới 1739 MB ≥1024 lúc quyết định.
- (d) Attempt chạy lại dùng cùng tag `attempt1` trên boot mới (file cũ đã đổi tên `-ABORTED` nên không va chạm) — nhưng cuối cùng **không có attempt nào chạy lại được** vì gate 0 không bao giờ mở lại (không cờ T5 mới). Quyết định chạy lại là đúng, kết quả là 0 attempt do gate đóng — hai việc khác nhau, ghi rõ cả hai.

## 5. Bốn reboot giữa lượt — khung chết theo quan sát trực tiếp

| # | Boot chết → boot mới | Khung chết (last-seen → first-seen) | Tuổi boot chết | Ghi chú |
|---|---|---|---|---|
| 1 | d2e66749 → 81335571 | (23:53:50Z, 23:54:29Z] | ~26 phút (btime 23:26:58Z) | **Mâu thuẫn thời gian:** btime boot mới đọc được 23:53:17Z — TRƯỚC heartbeat cuối 23:53:50Z của boot cũ. Chỉ dùng khung quan sát, không khẳng định btime tuyệt đối (có thể đồng hồ VM bị đóng băng/lùi khi khôi phục snapshot). |
| 2 | 81335571 → 52ca5d6d | (00:12:49Z, 00:13:45Z] | ~19,5 phút (btime 23:53:17Z) | btime mới 00:12:55Z, nằm trong khung — nhất quán. |
| 3 | 52ca5d6d → 1d2e984d | (00:13:45Z, 00:15:37Z] | **<1 phút** (btime 00:12:55Z) | Boot ngắn nhất. btime mới 00:13:50Z, nằm trong khung. Log T4 trước đó ghi "boot mới 52ca5d6d" đã lỗi thời — đã hiệu chính trong chain log 00:17:01Z. |
| 4 | 1d2e984d → cc1f9de0 | (00:17:53Z, 00:18:19Z] | ~4 phút (btime 00:13:50Z) | **Mâu thuẫn thời gian (lần 2):** poll #4 trên boot cũ ghi 00:17:53Z vẫn boot=1d2e984d — SAU btime 00:17:36Z của boot mới. Chỉ dùng khung quan sát. |

- Boot cc1f9de0 còn sống lúc đóng (01:00:55Z), tuổi 43+ phút — boot sống lâu nhất trong lượt sau boot đầu.
- Nhịp reboot dày lên rồi chậm lại: ~26 phút → ~19,5 phút → <1 phút → ~4 phút → 43+ phút (chưa chết). Không suy đoán nguyên nhân reboot (ngoài phạm vi T4; T2/T6 xử lý theo định nghĩa gộp).
- Mỗi reboot giết chết poller đang chạy (poller là process thường, không sống qua reboot); T4 khởi động lại poller bằng tay sau mỗi lần kiểm chứng trạng thái (4 lần chạy poller). Hai lần gián đoạn supervisor (background exec) cũng đều do reboot VM, không phải lỗi script.

## 6. Log draw với logger đã nới — CHỈ CÓ BẰNG CHỨNG PHỤ, KHÔNG CHỨNG MINH ĐƯỢC LOOP ≥3

- Chạy `analyze-t4-c2drawlog.py` trên JSON partial (attempt1 bị giết): **c2DrawLog n=53** (drawSrc 27 / rawUnit 26; stage plain-native 27 / rawUnit 26; srcKind 'canvas 1280x720' 53/53; readyState 4 53/53; seeking False 53/53); **loopNo: {1: 53} — TOÀN LOOP 1, 0 wrap**; frameIdx 0–65 (distinct 17); wallMs 9696→12741 (span 3045 ms ≈ 1 vòng video 3 s); ct 0–2,167 s; status=timeout (probe bị giết).
- **Đọc đúng:** log chỉ phủ ~3 s đầu sau khi logger bật (chưa tới wrap đầu tiên) vì probe chết giữa pass 3 và JSON partial chỉ giữ snapshot log tới lần ghi cuối. **KHÔNG có entry loop ≥3 nào — fix CHƯA ĐƯỢC CHỨNG MINH ở runtime.** Đây không phải bằng chứng chống lại fix (chưa có cơ hội ghi loop ≥3), cũng không phải bằng chứng ủng hộ — chỉ là "chưa kiểm được".
- Hệ quả: P7 (desync seek-latency) vẫn KHÔNG KIỂM ĐƯỢC lần thứ tư liên tiếp (0/9 lượt #9, 0/5 lượt #10, nay không có attempt #11). T3 bước 2 đợt 134 KHÔNG CÓ dữ liệu mới để kiểm P1–P7; prereg ghost-freeze/skew đứng nguyên theo kết quả đợt 133 (P1 5/5, P3 5/5, P2/P4 đúng; cộng dồn P1 14/14, P3 13/14).
- **Đề xuất cho T3/parent (không tự quyết): GIỮ fix 530e10a7 cho đợt 135** thay vì revert ngay — điều kiện revert trong quyết parent ("revert sau khi đo") chưa xảy ra vì chưa đo được lượt nào; revert khi chưa kiểm chứng sẽ phí lần sửa đã duyệt và đợt 135 lại phải sửa lại từ đầu. T3 là người revert (theo brief T3), T4 không động vào preview.tsx.

## 7. Ngưỡng ≤60 ms — GIỮ NGUYÊN, KHÔNG CÓ SỐ MỚI

| Lượt yên hợp lệ | tickCost total median (ms) |
|---|---|
| #1–#9 (tới đợt 131) | 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / — / 54,0 / 40,0 / 56,0 (8 lượt có số) |
| #10 (T4 đợt 133 a1) | **39,5** (thấp nhất) |
| **#11 (T4 đợt 134)** | **KHÔNG CÓ SỐ — 0 attempt hợp lệ** |

Trung bình 9 lượt vẫn 46,9 ms. Không đề xuất đổi ngưỡng, bar hay DEF từ lượt này (không có dữ liệu mới).

## 8. Kiểm chứng độc lập của script trước khi đo (dry-run)

- Trước khi mở poller, chạy toàn bộ analyzer trên JSON đợt 133 (`round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json`): tickCost median **39,5** (khớp), labellag **khớp 100%** file đợt 133 (diff rỗng), (c2) seqs **166/218/293/323/394** (khớp), coverage **0/5** (khớp), histogram **khớp 100%** (nTicks 376, nGhost 752, hist {-9: 2, -3: 4, -1: 69, 0: 259, +1: 203, +2: 190, +3: 23, +4: 2}), skiplatest/lag5 exit 0. Chỉ khác nhãn tag `T4-134a1` vs `T4-133a1` (dự kiến).
- 3 lỗi script đợt 133 §7 đã sửa trong bản đợt 134 trước khi dùng (grep COV đúng mẫu `TONG: (c2) trong cua so log:`; poller tính lại timestamp lúc ghi kết; tickcost/wallbands gọi đúng dạng `tag=path`); `bash -n` OK cả 4 script; deadline poller sửa 23:00Z 17/11 → 01:00Z 18/11; `check-classb-t4.sh` sửa đường dẫn W sang round134-t4.
- `t4-histogram-with11.py` đã chuẩn bị (RUNS trỏ JSON đợt 134) nhưng **chưa chạy được** (không có JSON hợp lệ) — để lại cho đợt sau, không chạy trên dữ liệu partial.

## 9. Trạng thái sau đo (kiểm cuối 01:00:55Z)

- Boot cc1f9de0 còn sống (btime 00:17:36Z, tuổi 43+ phút); không reboot trong lúc kiểm cuối.
- Vite :5187 đã chết (curl 000); `vite.lock` không tồn tại; không process vite/webkit/probe/MiniBrowser nào sót (`ps` sạch — chỉ còn shell kiểm tra của chính T4).
- Cây không đổi so với lúc đo: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093 (chỉ preview.tsx khác đợt 133, đúng theo fix đã duyệt).
- Không file production nào bị sửa bởi T4; chỉ thêm file làm việc trong `hidden_files/round134-t4/` + LIMITS này trong `repo-1/docs/`.
- RAM 515 MB lúc kiểm cuối; không cờ T5 mới nào xuất hiện sau hạn (kiểm 01:00:55Z vẫn `CHUA-CO-FLAG`).
- TTS 39 không kiểm lại; birefnet không thử (RAM <6 GB suốt lượt).

## 10. Nợ mở chuyển đợt 135

1. **Lượt yên #11 phải đo lại ở đợt 135 với logger đã nới (530e10a7 — đề xuất giữ, xem §6):** P7 vẫn chưa kiểm được lần thứ tư; T3 bước 2 + T5 pha 2 vẫn chờ dữ liệu mới. Nếu parent quyết revert fix thì đợt 135 phải sửa lại từ đầu và lượt yên lại 0/N coverage như cũ — ghi rõ để parent cân nhắc.
2. **Gate 0 mong manh sau reboot:** trên 3 boot sau, T5 không viết được cờ nào (postboot_exit=1 suốt dù dpkg lines vượt baseline 1545 → 1721). Cần T5/T10 xem lại vì sao postboot không PASS trên boot mới (replay chạy theo đợt nhưng check vẫn fail) — nếu không, mọi lượt yên sau reboot đều 0 attempt.
3. **Nhịp reboot dày bất thường:** 4 reboot trong 70 phút, có boot sống <1 phút và ~4 phút. T2/T6 ghi khung chết theo định nghĩa gộp; T4 ghi thêm 2 mâu thuẫn btime-vs-log (reboot #1 và #4: btime boot mới TRƯỚC mốc last-seen của boot cũ) — T2 đối chiếu khi chứng nhận gap #82?→#83? (SPAN).
4. **Cơ chế chờ RAM không có cơ hội phát huy đợt này:** poll dày 45 s vẫn chạy tốt (bắt được cửa sổ poll #1), nhưng sau reboot #1 không còn cửa sổ vàng nào đủ cả hai điều kiện (RAM ≥1024 + gate 0). Nguồn cửa sổ (2) đợt hồi RAM giữa lượt cũng không xuất hiện đợt này.
5. **G1 vẫn hoãn; R9 (a) vẫn chờ user; ci-security.yml vẫn 403; TTS 39 cấm kiểm lại; KHÔNG push khi user chưa nhắn "push đi".**

## 11. Stage (KHÔNG push) + cờ

- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round134-t4-quiet11.txt` — 1 entry (`docs/PHASE9_ROUND134_T4_WEBKIT_QUIET11_LIMITS.md`), verify bằng read-back. KHÔNG push.
- **Cờ:** `hidden_files/round134-t4.done` — dòng đầu: "0 attempt hop le (attempt1 bi reboot giet giua pass 3/20); median: khong co so; (c2): khong co; log draw: khong do duoc (logger moi chua kiem chung)".
- **File làm việc (không stage, chỉ để trong `hidden_files/round134-t4/`):** probe (md5 70c7bb9a…), `b.json`, `vite.t4-temp.config.mjs`, `tree-md5.txt` (530e10a7), `poll-wait-t4-134.sh` + `poll-t4.log` (82 poll) + `poll-t4.nohup.log` + `poll-t4-restart{,2,3}.nohup.log`, `run-attempt-134.sh`, `t4-attempt-inner.sh`, `check-classb-t4.sh`, `supervise-t4-134.sh`, `postboot-t4-134-gate0wait-*.log`, `preview-b-f3-flip-webkit-t4-attempt1.json-ABORTED-boot-d2e66749-reboot235317Z` (257.631 B, sha256 b402b3f3…), `load-mid-t4-attempt1.log-ABORTED-…`, `ps-before/after-t4-attempt1.txt-ABORTED-…`, `vite-5187-t4-attempt1.log-ABORTED-…`, `run-webkit-t4-attempt1.log-ABORTED-…`, `marker-t4-attempt1-ABORTED-…`, `chain-t4.log`.
