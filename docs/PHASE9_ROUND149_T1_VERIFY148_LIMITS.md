# Đợt 149 T1 — KIỂM CHỨNG ĐỘC LẬP ĐỢT 148: REBOOT #38 CẮT NGANG LÚC T10-148 ĐÓNG SỔ + BƯỚC NHẢY CLOCK LẦN THỨ 4

- Phiên: lượt cron 03:35 +07 20/11/2026 (20:35:51Z 19/11/2026); T1 mở ~20:36Z, đóng ~21:10Z — TRONG hạn cờ 23:00Z.
- Phạm vi: chỉ đọc/kiểm + viết LIMITS này. Không sửa file production nào. Không push.
- Cây lúc kiểm: preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093` — cả ba KHỚP hồ sơ T10-148 lúc đóng (xem §8).

## 0. Kết luận ngắn

**Verdict T1-149: PASS với ĐÍNH CHÍNH LỚN — nội dung đợt 148 đứng vững; hồ sơ đóng sổ SAI về reboot (F-149-T1-1).**

- **PHÁT HIỆN HEADLINE — reboot #38 (ae8f70bb → 70025d3e) CẮT NGANG LÚC T10-148 ĐÓNG SỔ, đúng mẫu reboot #35 ở đợt 147 (F-148-T1-1):** suite đóng sổ của T10 chạy 20:02:19–20:06:13Z TRÊN BOOT ae8f70bb (đọc live `boot_id` ở cả đầu và cuối script — xem §1.1), nhưng boot hiện tại btime 20:00:33Z (chuẩn /proc/stat theo quyết parent 148 §12.3(b)) — tức đồng hồ VM đã **NHẢY LÙI X > 595 s** tại reboot #38 (lần thứ 4 có bước nhảy clock: #54, #58, #63, #38). Hồ sơ đợt 148 ghi "3 reboot" là THIẾU — nay là **4 reboot** (#35, #36, #37, #38). Claim "boot lúc đóng ae8f70bb" (aggregate §10.1 + cờ round148-t10.done) là STALE tại thời điểm ghi cờ (hoặc đúng tại thời điểm ghi nhưng sai ngay sau đó — xem hai trường hợp (A)/(B) ở §1.4, không phân định được từ trong VM). **KHÔNG sửa hồ sơ đợt 148 đã đóng** — đính chính ghi tại đây + GAP (giao T10-149 đưa vào §77-bổ sung / §78).
- **Suite 27/27 của T10-148 VẪN ĐỨNG:** chạy thật trên ae8f70bb, cùng cây; T1 chạy lại độc lập **27/27 exit 0, 0 rerun** trên boot mới 70025d3e (20:53:50–21:03:14Z, 354 assertions pass).
- **Đếm cuối ĐỨNG:** chạy lại script đếm của T10 (dedup toàn cục, không cộng dồn): đợt 148 = **9 batch / 15 entry / 15 file**; lũy kế 111–148 = **368 / 737 / 628**; tái kiểm 111–147 = 359/722/615 khớp — lần thứ 29 liên tiếp theo cách đếm của T10.
- **O8 ĐỨNG:** WebKit 21/21 ×2 attempt + Chromium 21/21, xác nhận bằng JSON gốc + driver log (10 dòng "21/21 pass"). Lệch quyết (j) đã được parent chấp nhận ở §12.3(c).
- **Watchdog ĐỨNG:** đúng 3 dòng WATCHDOG-137 trong log gốc `run-webkit-86n2.log` (18:30:32.896Z, 18:30:33.124Z, 18:31:02.931Z) + LIVE-DIAG-148 ×2 (18:33:08Z, 18:37:09Z).
- **#21 ĐÓNG — ĐỨNG:** tái tính độc lập từ JSON gốc T4: A3 n=525, median đúng **60**, 269 tick ≤60, 9 tick đúng =60, 256 >60 — khớp từng số với T4. Biên = 0 là thật, không phải làm tròn.
- **Mù #67 đóng hoàn toàn → CERT 67 / FULL 82 — ĐỨNG về số lượng; số chứng nhận ĐỔI THEO CHUẨN MỚI:** theo quyết parent (b) (/proc/stat làm chuẩn), gap = **18.867 s**, chứng nhận **[18.857, 18.877] s** (thay thế [18.872, 18.892] s theo /proc/1 của T2). Số học kiểm lại đúng từng giây.
- **Verdict CHẤP NHẬN đợt 148 (quyết parent (a)) KHÔNG ĐỔI:** mọi claim nội dung đều đứng; chỉ hồ sơ đóng sổ sai về reboot — cùng cách xử lý như đợt 147 (đính chính, không sửa hồ sơ đã đóng).
- **Bug pixelate (T10-148 phát hiện) — T0-149 ĐÃ SỬA trong lúc T1 kiểm:** `npm test` chạy lại **exit 0 — 11 pass, 0 fail** (demo_effects PASS + test_pixelate_render mới 20 case PASS), snapshot effects.js `fedc0141` lúc 21:03–21:08Z. Xem §7 — kết quả chỉ đúng tại snapshot này vì T0 vẫn đang sửa file đó song song.

## 1. Reboot #38 — bằng chứng, bước nhảy clock, hai trường hợp (A)/(B)

### 1.1 Suite T10-148 chạy thật trên ae8f70bb — bằng chứng quyết định

- Script `hidden_files/round148-t10/round148-t10-verify.sh` đọc `boot_id` LIVE ở cả hai đầu (không cache):
  - Đầu: `echo "=== T1-148 verify start $(date -u +%FT%TZ) boot $(cat /proc/sys/kernel/random/boot_id) ..."` → log ghi `20:02:19Z boot ae8f70bb-9197-4eae-b70f-2988769ac6a9`.
  - Cuối: `echo "=== ALL DONE $(date -u +%FT%TZ) boot $(cat /proc/sys/kernel/random/boot_id) ==="` → log ghi `20:06:13Z boot ae8f70bb-...`.
- Một shell script không thể sống qua reboot (tiền lệ: sampler T9 chết theo reboot #36; sleep T7 bị giết ở #36/#37). Suite chạy trọn 20:02:19–20:06:13Z, 27/27 exit 0, log mtime 20:06:13.801Z — nên **ae8f70bb còn sống ít nhất tới 20:06:13Z (đồng hồ cũ)**. Đây là bằng chứng độc lập với mọi claim chữ của T10.
- Boot hiện tại: `70025d3e-ff1b-4519-aa1e-5459a616930b`; btime /proc/stat epoch 1795118433 = **20:00:33Z**; /proc/1 mtime 20:00:44Z; starttime /proc/1 = 1.085 ticks = **10,85 s** độ trễ init (20:00:33Z + 10,85 s ≈ 20:00:43,85Z ≈ /proc/1 20:00:44Z — khớp mẫu hòa giải 15,21 s ở d8a11644 / 10,67 s ở ae8f70bb). `uptime -s` = 20:00:33Z. `journalctl --list-boots` chỉ còn 1 boot (70025d3e, first entry 20:00:44Z); `wtmp begins 20:00:44Z` — journal/wtmp reset mỗi reboot (cùng mẫu T1-148 thấy ở reboot #35).
- Suy ra: **20:06:13Z (đồng hồ cũ, ae8f70bb còn sống) > 20:00:33Z (btime boot mới) → đồng hồ nhảy lùi ít nhất 20:06:13 − 20:00:33 = 340 s tại reboot #38.** Đây là cận dưới sắt đá, chỉ dùng 2 lần đọc live.

### 1.2 Cận dưới chặt hơn: X > 595 s (từ lần đọc uptime live 20:10:28Z)

- Aggregate §10.1 + cờ T10 ghi: "Uptime 29 phút lúc 20:10:28Z", boot ae8f70bb btime 19:41:02Z (stat, epoch 1795117262 — kiểm lại bằng `date -u`: đúng 19:41:02Z).
- Số học: 20:10:28 − 19:41:02 = **1.766 s = 29m26s** — khớp "29 phút" đúng từng phút. Một lần đọc `uptime` live trên ae8f70bb tại 20:10:28Z (đồng hồ cũ) cho đúng số này; nếu lần đọc đó là tính nhẩm từ btime cũ + giờ mới thì cũng cho cùng số — nhưng T10 ghi rõ "kiểm cây lúc đóng 20:10:28Z" (§9.5) nên T1 coi là đọc live, với caveat ghi rõ ở đây.
- Nếu đọc live là thật: reboot xảy ra SAU 20:10:28Z (đồng hồ cũ) → **X > 20:10:28 − 20:00:33 = 595 s (~10 phút)**. T1 dùng X > 595 s làm cận dưới chính; X > 340 s là cận dưới sắt đá nếu ai đó bác lần đọc uptime.
- Cận trên của X: **không xác định được từ trong VM** (không có đồng hồ ngoài). Xem §1.4.

### 1.3 Dấu vết phụ: 9m25s im lặng ghi file + /tmp bị xóa

- Quét toàn bộ repo-1 + hidden_files (trừ node_modules/dist) trong cửa 20:00–20:30Z: **0 file nào ghi mới trong (20:06:13Z, 20:15:38Z]** — im lặng đúng 9m25s sau khi suite log đóng, rồi một chùm 70 s: closing paths 20:15:36Z → count-final rerun 20:15:38Z → GAP 20:16:04Z → cờ 20:16:46Z → aggregate (parent §12.3) 20:24:49Z.
- Im lặng này PHÙ HỢP với phiên T10 chết/tạm dừng trong lúc reboot + runtime restart (cùng mẫu T7: sleep bị giết ở #36/#37, kiểm lại ~1 phút sau btime), rồi resume viết nốt closing. Nó cũng phù hợp với "T10 ngồi soạn aggregate, không ghi đĩa" — nên chỉ là bằng chứng phụ, không quyết định.
- `/tmp` trống dấu vết suite T10 (`/tmp/vcut-test-preview-engine.4StUQZ` GONE; các file `/tmp/p7-148t10.test.mjs`, `retry-play-148t10`, `stall-watchdog-148t10` đều không còn) — phù hợp /tmp là tmpfs bị xóa ở reboot. Bằng chứng phụ.
- Không truy cập được exec-logs của phiên T10-148 để tìm recovery notice "runtime restart" (thư mục agent ứng viên `~/workspace/agents/4f7b98c3-...` trống/không đọc được — xem F-149-T1-2). Thiếu bằng chứng trực tiếp này nên (A)/(B) dưới đây không phân định được.

### 1.4 Hai trường hợp (A)/(B) — T1 KHÔNG tự chốt

Cả hai đều phù hợp toàn bộ bằng chứng trên; chúng chỉ khác nhau ở chỗ chùm file 20:15:36–20:16:46Z thuộc nhịp đồng hồ nào:

- **(A) Chùm file viết SAU reboot (nhịp mới):** T10 resume sau runtime restart (~20:01–20:02Z nhịp mới, cùng độ trễ ~1 phút như T7 ở #36/#37), soạn aggregate tới ~20:14Z nhịp mới, rồi viết paths/count/GAP/cờ 20:15:36–20:16:46Z nhịp mới — **mà KHÔNG đọc lại boot_id** sau khi resume. Khi đó claim "boot lúc đóng ae8f70bb" trong aggregate §10.1 + cờ là **STALE/SAI tại thời điểm ghi** (boot lúc đó đã là 70025d3e được ~15 phút). Đây là **đúng mẫu lỗi của T10-147** (T1-148 headline: aggregate/GAP/cờ viết sau reboot #35 nhưng ghi boot cũ).
- **(B) Chùm file viết TRƯỚC reboot (nhịp cũ):** T10 viết xong toàn bộ closing ở nhịp cũ (aggregate chốt ~20:14Z, paths 20:15:36Z, count 20:15:38Z, GAP 20:16:04Z, cờ 20:16:46Z), rồi reboot #38 xảy ra sau 20:16:46Z nhịp cũ → X > 20:16:46 − 20:00:33 = **973 s (~16 phút)**. Khi đó claim "boot lúc đóng ae8f70bb" là **ĐÚNG tại thời điểm ghi cờ**, và reboot #38 thuộc khoảng GIỮA đợt 148 và đợt 149 (sau khi đóng), không phải "trong lúc đóng sổ".
- **Hệ quả chung cho cả (A) và (B) — đây mới là điều parent cần:** (i) hồ sơ đợt 148 ghi "3 reboot" là **thiếu reboot #38** — đợt 148 nay có **4 reboot** (#35, #36, #37, #38); (ii) gap ae8f70bb→70025d3e **CHƯA chứng nhận được** — số danh nghĩa theo /proc/stat là 1.171 s (1795118433 − 1795117262) nhưng **SAI vì trộn hai nhịp đồng hồ**: tuổi thọ thật của ae8f70bb = 1.171 + X giây, với X > 595 s → **> 1.766 s** (và > 973 + 1.171 = 2.144 s nếu (B)); (iii) **bước nhảy clock lần thứ 4** trong hồ sơ (#54 lùi 17–21 phút; #58 lùi X ∈ [32, 332] s; #63 lùi chưa định lượng; #38 lùi X > 595 s) — tiền lệ xử lý: chứng nhận gap dạng KHOẢNG như #54/#58/#63. Giao **T2-149** chứng nhận (mù #70?); giao **T7-149** kiểm run 148 có bị viết lại lần 3 tại #38 không (kỳ vọng started_at ≈ 20:01:1xZ = btime + ~40 s nếu có — bằng chứng trực tiếp thứ 16; hạn timeout theo started gốc 20:36:53Z rơi vào cửa T7-149).
- T1 đề xuất parent ghi đính chính (không sửa hồ sơ đã đóng): "Đợt 148 có 4 reboot; reboot #38 (ae8f70bb → 70025d3e, btime mới 20:00:33Z /proc/stat) xảy ra trong/khoảng lúc T10-148 đóng sổ; đồng hồ nhảy lùi > 595 s; gap ae8f70bb→70025d3e là SPAN, chờ T2-149 chứng nhận dạng khoảng."

## 2. Verdict từng claim đóng sổ đợt 148

| # | Claim (nguồn) | Kết quả kiểm độc lập | Đứng? |
|---|---|---|---|
| 1 | Suite 27/27 exit 0, 354 assertions, boot ae8f70bb, 20:02:19–20:06:13Z (cờ T10 + §9.3) | Script đọc live boot_id hai đầu → ae8f70bb thật (xem §1.1); log gốc `round148-t10-suites.log` đủ 27 `exit=0`, 0 khác 0, "354 assertions pass"; T1 chạy lại 27/27 trên boot mới (xem §7) | **ĐỨNG** |
| 2 | "Boot lúc đóng ae8f70bb", "0 reboot mới giữa T7 đóng cờ (19:55Z) và kiểm cây (20:10Z)" (§10.1) | Nửa sau ĐÚNG tại 20:10:28Z (nhịp cũ, uptime 29m26s khớp); nửa đầu STALE/SAI nếu (A), ĐÚNG nếu (B) — xem §1.4. Dù sao hồ sơ cũng thiếu reboot #38 | **ĐÍNH CHÍNH (F-149-T1-1)** |
| 3 | "3 reboot đợt 148: #35, #36, #37" (§3/§10) | Thiếu #38 (btime 20:00:33Z, boot 70025d3e) | **SAI — nay là 4 reboot** |
| 4 | Đếm cuối 9 batch / 15 entry / 15 file; lũy kế 368/737/628 (script count-final-148.py) | Chạy lại đúng script T10, dedup toàn cục: khớp từng số (xem §3) | **ĐỨNG** |
| 5 | O8 WebKit 21/21 ×2 + Chromium 21/21, exit 0 (T8 + §9.3) | JSON gốc: WebKit 21 results, 21 ok=true; Chromium 21/21 ok=true; driver log 10 dòng "21/21 pass" (xem §4) | **ĐỨNG** |
| 6 | Watchdog nổ đúng bằng kẹt thật: 3 dòng WATCHDOG-137 (T8 + §9.3) | Đúng 3 dòng trong log gốc, khớp giờ T8 (xem §4) | **ĐỨNG** |
| 7 | #21 ĐÓNG (A3 median 60,0; 269/525 ≤60; 9 tick =60) (T4 + §9) | Tái tính độc lập từ JSON gốc: khớp từng số (xem §5) | **ĐỨNG** |
| 8 | Mù #67 đóng hoàn toàn → CERT 67 / FULL 82 (T2 + §9) | Số lượng ĐỨNG; số chứng nhận theo chuẩn mới /proc/stat: gap 18.867 s, [18.857, 18.877] s (xem §6) | **ĐỨNG (số đã đổi chuẩn)** |
| 9 | Khoảng RAM sập ~6,5 GB đã quy = balloon (T5/T9) | T1 không đo lại RAM; chỉ đối chiếu: T5 định lượng + T9 corroborate 6,29 GiB đã ghi trong hai LIMITS độc lập, số học T5 (ΣRSS + balloon + cache + slab ≈ used) đã nêu trong log vòng lặp | **ĐỨNG (đối chiếu, không đo lại)** |
| 10 | Bug pixelate mới: `npm test` FAIL ở demo_effects (T10 §9.3/§9.6) | T10 phát hiện ĐÚNG (bug có sẵn từ Phase 8 Q4); T0-149 đã sửa bằng geq trong lúc T1 kiểm — `npm test` nay exit 0 (xem §7) | **ĐỨNG lúc phát hiện; ĐÃ SỬA ở 149** |
| 11 | T10 đóng 20:16:46Z theo cờ, TRONG hạn đóng 20:20Z + hạn cứng 20:30Z (quyết (a)) | Cờ mtime 20:16:46.516Z — khớp; aggregate chốt trước đó (GAP 20:16:04Z, paths 20:15:36Z) | **ĐỨNG** |
| 12 | §12.3 parent viết trực tiếp, (a)–(o) đầy đủ | Đọc aggregate hiện tại (58.451 B, md5 `f8f71949...`): §12.3 có đủ (a)–(o), §12.2 đã đánh dấu "(đã quyết ở §12.3 dưới)" | **ĐỨNG** |

## 3. Đếm cuối — chạy lại script T10, dedup toàn cục

- Chạy `python3 hidden_files/round148-t10/count-final-148.py` (đúng script T10 viết mới, không sửa) → output lưu tại `hidden_files/round149-t1/t1-count-final-148-recount.txt`, **khớp từng số** với `t10-count-final-148.txt`:
  - paths files scanned: 1016; purity problems: 0; round148 missing on disk: 0.
  - Đợt 148: **9 batch / 15 entry / 15 file** (gồm closing). Lũy kế 111–148: **368 / 737 / 628**. Tái kiểm 111–147: **359 / 722 / 615** khớp — lần thứ 29 liên tiếp theo cách đếm của T10 (T10 ghi lần thứ 28; nay +1).
  - Chờ push 136–148: **120 batch / 159 entry / 130 file duy nhất**. Overlap 148 với 111–147: 2 file (`PHASE9_GAP_ANALYSIS.md` + `apps/web/scripts/vcut-webkit-postboot-check.sh`) — trùng có lý do, đã giải thích ở aggregate §9.1.
- Lưu ý: file đếm preclosing của T10 (20:04:58Z) ghi 8 batch / 13 entry / 13 file — đúng tại thời điểm đó (chưa có closing batch); số cuối 9/15/15 sau khi thêm closing (2 entry: aggregate + GAP) là đúng, không phải sửa số.

## 4. O8 + watchdog — xác nhận bằng JSON/log gốc

- **O8 WebKit:** `hidden_files/round148-t8/o8-webkit/o8w-clicktest-report.json` — dict `{results, logLines}`; `results` = 21, `ok=true` = 21, `ok=false` = 0. Chỉ 1 file JSON WebKit cho 2 attempt (T10 đã ghi F-148-T10-1) — attempt 1 chỉ còn trong driver log.
- **O8 Chromium:** `hidden_files/round148-t8/o8-chromium/o8-clicktest-report.json` — dict `{precheck, results, logLines}`; 21 results, 21 ok=true, 0 fail.
- **Driver log** `hidden_files/round148-t8/o8-148t8.log`: **10 dòng** "21/21 pass" (khớp T8); attempt1 WebKit 21/21 pass, exit 0 lúc 17:42:06Z, boot d8a11644; attempt2 start 17:42:06Z; Chromium 21/21 (2 dòng "KẾT QUẢ CLICK-TEST O8: 21/21" không suffix WebKit).
- **Watchdog:** `hidden_files/round148-t8/smoke/run-webkit-86n2.log` có **đúng 3 dòng** `WATCHDOG-137`:
  - 18:30:32.896Z `evaluate im lang >60s tai waitForPlaySync-P4-lần2 — chup chan doan`
  - 18:30:33.124Z `diag script xong (xem smoke/stall-*)`
  - 18:31:02.931Z `probe waitForPlaySync-P4-lần2: probe-1+1 TIMEOUT 30s (kenh evaluate ket cung / page JS chet)`
  - 0 dòng WATCHDOG-137 ở 5 log harness còn lại (chỉ có trong `run-webkit-summary.txt` bản sao của cùng 3 dòng). **LIVE-DIAG-148 ×2** trong `run-webkit-summary.txt`: 18:33:08Z (im lặng 126 s, lần 1/2) + 18:37:09Z (im lặng 367 s, lần 2/2) — khớp T8. Chuỗi "chưa thử bằng kẹt thật" 6 đợt (142–147) kết thúc: **ĐỨNG** (quyết parent (d) đã xác nhận).
- Caveat giữ nguyên từ T8/T10: kẹt 86n2 WebKit P4-lần2 CHƯA được giải thích (H3 chỉ được ủng hộ thêm); harness đợt 148 là **5/6**, không được trích là 6/6.

## 5. Lượt yên #21 — tái tính độc lập từ JSON gốc T4

- File gốc `hidden_files/round148-t4/preview-b-f3-flip-webkit-t4-attempt{1,2,3}-d8a11644.json`, trường `/results/b/y2/tickCost[].total` — tái tính bằng `statistics.median` (không dùng analyzer của T4):
  - A1: n=470, median **66,0** (≤60: 194, =60: 7, >60: 276) — khớp T4 (66,0; n=470).
  - A2: n=506, median **65,5** (≤60: 204, =60: 8, >60: 302) — khớp T4 (65,5; n=506).
  - A3: n=525, median **60** (≤60: **269**, =60: **9**, >60: **256**) — khớp TỪNG SỐ với T4 (269/525 ≤60, 9 đúng =60, 256 >60; median 60,0000).
- **#21 ĐÓNG theo luật (median ≤ 60) — ĐỨNG.** Caveat giữ nguyên: biên = 0, là lượt sát nút tuyệt đối; A1/A2 chạy ~65–66 ms trên boot d8a11644 mà load/RAM không giải thích được (T4 đã kiểm r ≈ 0). #22 mở đợt 149 theo quyết parent (h).

## 6. Mù #67 → CERT 67 / FULL 82 — số học theo chuẩn mới /proc/stat

- Kiểm lại bằng epoch thô (`date -u`): btime boot 6fb582df = 12:13:26Z (hai nguồn trùng nhau ở boot này); btime d8a11644 = 17:27:53Z (/proc/stat) / 17:28:08Z (/proc/1).
  - Gap theo /proc/stat: 17:27:53 − 12:13:26 = **18.867 s** (5h14'27"). Khoảng chứng nhận [mid−10, mid+10] = **[18.857, 18.877] s**.
  - Gap theo /proc/1: 17:28:08 − 12:13:26 = **18.882 s** (5h14'42"). Khoảng [18.872, 18.892] s — bản T2 chứng nhận, nay **bị thay thế** theo quyết parent (b).
- **CERT 67 / FULL 82 giữ nguyên số lượng** (quyết (b)); chỉ số gap/chứng nhận đổi sang 18.867 s / [18.857, 18.877] s. Số thay thế CERT67-alt/FULL82-alt của T2 (§2.5 T2) nay thành số chính (max 5h14'27", FULL82-alt mean 1h43'44").
- Cơ sở đóng mù #67 (T2): đoạn A đóng bằng uptime-closure 3 điều kiện (merged gap max 1.255 s VƯỢT sàn 1.147 s đúng 108 s — lần đầu đoạn đóng bằng uptime mà merged gap vượt sàn); đoạn B đóng theo luật gap (max 263 s < sàn). T1 kiểm lại số học sàn/lệch (1.255 − 1.147 = 108 s ✓; floor(1255/1147) = 1 ẩn tối đa theo luật gap ✓) — không đạo lại merged từ đầu (phương pháp của T2, ngoài phạm vi T1).
- Chuỗi INSIDE 6 → 0 (d8a11644 OUTSIDE dải FULL81 #111?) không đổi theo nguồn btime nào (cả hai btime đều OUTSIDE) — đã ghi trong T2 §2.
- Khung chết #110? chốt 223 s theo /proc/stat ((17:24:10Z, 17:27:53Z], quyết (g)) — bản 238 s theo /proc/1 bị thay thế. T1 không đo lại khung này (giao T2-149 trong mù #68/#69?).

## 7. Suite chạy lại + `npm test` (quyết (k))

### 7.1 Suite 27 mục — chạy lại độc lập trên boot mới 70025d3e

- Script: bản sao `round148-t10-verify.sh` đổi LOG sang `hidden_files/round149-t1/round149-t1-suites.log` (không đổi nội dung test). Chạy 20:53:50–21:03:14Z (9m24s — chậm hơn 3m54s của T10 vì T4-149 đang đo WebKit song song + T0 đang sửa effects.js trên cùng VM; không ảnh hưởng kết quả).
- Kết quả: **27/27 exit 0, 0 rerun, 0 non-zero**; `test-preview-engine.sh: 354 assertions pass`; ALL DONE 21:03:14Z boot 70025d3e. Cây đã chạy qua 3 boot (6fb582df đợt 147 + d8a11644 đợt 148 + ae8f70bb lúc T10 đóng + 70025d3e lúc T1 kiểm lại) với cùng md5 preview.tsx — cây ổn định qua 3 reboot.
- /tmp/.X11-unix: suite tạo socket rồi test xvfb-lock dọn — T1 không kiểm riêng (T10-149 kiểm lúc đóng).

### 7.2 `npm test` — bug pixelate ĐÃ SỬA bởi T0-149 trong lúc T1 kiểm

- T10-148 phát hiện: `npm test` FAIL ở demo_effects, effect pixelate lỗi render xác định (filter `scale=iw/9:ih/9` → 640 thành 639 lẻ → libx264 từ chối; 5 effect sau pixelate chưa được test). T1 xác nhận bug CÓ THẬT lúc T10 đóng: code cũ dùng `scale=iw/K:ih/K,scale=iw*K:ih*K` (neighbor) — T0 ghi rõ trong comment sửa: K=13 → 637x351 lẻ; K=9 → 639 (khớp số T10 đo) — cùng một cơ chế (downscale rồi upscale, kích thước ra sai/lẻ).
- **T0-149 đã sửa trong phiên này** (effects.js mtime 20:48:03Z, rồi đổi md5 tiếp trong phiên T1: `7493ff0e` lúc ~20:47Z → `fedc0141` lúc 21:03Z — T0 vẫn đang làm việc trên file này): pixelate nay dùng **geq** (giữ nguyên kích thước với mọi K và mọi W/H, kể cả lẻ; có alpha_expr; chroma dùng khối kc = floor(K/2)).
- T1 chạy `npm test` (test:unit + test:integration) 21:03:31–21:08:04Z, snapshot effects.js `fedc0141` (không đổi trong lúc chạy): **exit 0 — 11 pass, 0 fail** (test:unit 7/7; integration: demo_lut/sticker/chroma/transitions/textfx PASS, **demo_effects PASS**, + test mới `test_pixelate_render` **PASS (20 case size × intensity + alpha)**). Log: `hidden_files/round149-t1/t1-npm-test.log`.
- **Caveat:** kết quả này chỉ đúng tại snapshot `fedc0141` — T0 có thể sửa tiếp file này sau 21:08Z. T10-149 chạy lại `npm test` đầy đủ lúc đóng sổ theo quyết (k) (đưa vào suite chuẩn từ đợt 149). 5 effect sau pixelate "chưa được test" ở đợt 148 — nay demo_effects PASS toàn bộ (bao gồm các effect đó trong cùng script), nhưng T1 không tách riêng từng effect để đo — T10-149 / T0 ghi rõ nếu cần.

## 8. Cây lúc kiểm (md5)

| File | md5 lúc T10-148 đóng | md5 lúc T1-149 kiểm (21:03Z) | Đổi? |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7266b8c148411ba21510b501a | Không |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed13703809d5e999311147745e7 | Không |
| apps/web/vite.config.ts | ee80d093 | ee80d09370b6bfb1ad86efd9a737e411 | Không |
| server/render/src/effects.js | (T10 không ghi) | fedc0141 (21:03Z; 7493ff0e lúc ~20:47Z) | **CÓ — T0-149 đang sửa** |

- `git status` không dùng được: `~/workspace/repo-1` không phải git repo (push đi bằng push-files API, không phải git) — cây kiểm bằng md5 như trên.
- Các file LIMITS đợt 148 (đối chiếu tồn tại + md5, không đọc lại toàn bộ): aggregate 58.451 B `f8f71949` (52.750 B `769a94df` lúc T10 đóng — tăng do §12.3 parent viết thêm); T1 32.618 B `0ff71ea1`; T2 50.279 B `b656f4b8`; T4 28.346 B `ac138907`; T5 43.626 B `0a252015`; T6 100.902 B `90d7c029`; T7 47.040 B `245d92d1`; T8 50.833 B `d1c15070`; T9 50.963 B `cc06c069`. Các md5 T4/T5/T8 khớp log vòng lặp.

## 9. Sai số của chính T1-149 (F-149-T1-n)

- **F-149-T1-1 — (A)/(B) không phân định được từ trong VM (xem §1.4).** Không có đồng hồ ngoài để đo X; không có recovery notice của phiên T10. T1 ghi cả hai trường hợp + hệ quả chung, không tự chốt — giao parent/T10-149 phán. Đây là giới hạn phương pháp, không phải thiếu sót bỏ qua.
- **F-149-T1-2 — Không truy cập được exec-logs phiên T10-148.** Thư mục agent ứng viên trống/không đọc được; grep `runtime restart` trong `~/workspace/agents/*/exec-logs/` không ra gì. Bằng chứng runtime-restart trực tiếp cho T10-148 vẫn thiếu.
- **F-149-T1-3 — Suite rerun chậm (9m24s vs 3m54s của T10).** Do T4-149 đang đo WebKit song song trên cùng VM (vite + probe chạy 20:59–21:01Z trong lúc suite T1 ở bước U4). Kết quả không đổi (27/27, 0 rerun) — chỉ chậm, không sai.
- **F-149-T1-4 — Phạm vi kiểm có giới hạn.** T1 kiểm độc lập: reboot #38, đếm cuối, O8, watchdog, #21 (tái tính từ JSON gốc), mù #67 (số học), suite 27 + npm test. Các claim của T5/T6/T7/T9 chỉ đối chiếu qua LIMITS + log (không đo lại RAM/headroom/lock/scheduler) — các luồng đó có T5/T6/T7/T9-149 kiểm tiếp trong đợt này.
- **F-149-T1-5 — `npm test` chạy trên cây đang được T0 sửa song song.** Kết quả exit 0 chỉ đúng tại snapshot effects.js `fedc0141` (21:03–21:08Z). Nếu T0 sửa tiếp sau đó, T10-149 phải chạy lại lúc đóng sổ.

## 10. Nợ / giao tiếp

- **Giao T2-149:** mù #70? (ae8f70bb → 70025d3e) — chứng nhận gap dạng KHOẢNG (tiền lệ #54/#58/#63); tuổi thọ thật ae8f70bb = 1.171 + X giây (X > 595 s); khung chết ứng viên + khung #110? (223 s, quyết (g)) giữ nguyên. Mù #68/#69? vẫn mở từ đợt 148.
- **Giao T7-149:** run 148 (`b33c757c`) — kiểm started_at có bị viết lại lần 3 tại reboot #38 không (kỳ vọng ≈ 20:01:1xZ nếu có — bằng chứng trực tiếp thứ 16); hạn timeout theo started gốc 20:36:53Z rơi vào cửa đợt 149 (điều tra mẫu (m) theo quyết (f)).
- **Giao T10-149:** (i) đưa `npm test` đầy đủ vào suite đóng sổ chuẩn (quyết (k)) và chạy lại lúc đóng (vì T0 vẫn đang sửa effects.js); (ii) đưa đính chính reboot #38 vào GAP (§78 hoặc bổ sung §77) + aggregate đợt 149 §12 — KHÔNG sửa hồ sơ đợt 148 đã đóng; (iii) phán (A)/(B) nếu có thêm bằng chứng (exec-logs phiên T10-148 / mốc giờ main chat).
- **Giao T4-149:** #22 đã mở (quyết (h)) — lưu ý #21 đóng sát nút biên = 0; boot 70025d3e mới, baseline median có thể khác d8a11644 (~65 ms ở A1/A2).
- **Giao T0-149:** pixelate đã sửa + test mới PASS tại snapshot `fedc0141` — nếu sửa tiếp effects.js sau 21:08Z thì báo T10-149 chạy lại `npm test` lúc đóng.
- Stage: `phase9-round149-t1-verify148.txt` (1 entry NUL-delimited: LIMITS này). Cờ `round149-t1.done`. KHÔNG PUSH.
