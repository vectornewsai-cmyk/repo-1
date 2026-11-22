# Đợt 150 T1 — KIỂM CHỨNG ĐỘC LẬP ĐỢT 149: PASS — NỘI DUNG ĐỨNG VỮNG TOÀN BỘ, KHÔNG ĐÍNH CHÍNH LỚN

- Phiên: lượt cron 06:35 +07 20/11/2026 (23:35:51Z 19/11/2026); T1 mở ~23:41Z, đóng ~00:05Z 20/11 — TRONG hạn cờ ~01:30Z + hạn cứng 02:00Z.
- Phạm vi: chỉ đọc/kiểm + viết LIMITS này. Không sửa file production nào. Không push.
- Cây lúc kiểm: preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141` — cả bốn KHỚP hồ sơ T10-149 lúc đóng (xem §8).
- **REBOOT #40 xảy ra GIỮA hai đợt, KHÔNG cắt ngang đợt 149:** boot mới `e9295700`, btime 23:32:09Z — 31m44s SAU cờ T10-149 (23:00:25Z). Đợt 149 đóng sạch trên boot `802f358f`, không có reboot nào sau cờ của nó cho tới #40 (xem §1). Đây là điểm khác căn bản với đợt 148 (#38 cắt ngang lúc T10-148 đóng sổ) và đợt 149 (#39 giữa phiên).

## 0. Kết luận ngắn

**Verdict T1-150: PASS — nội dung đợt 149 đứng vững toàn bộ; không có đính chính lớn.**

- **Đếm cuối ĐỨNG, KHỚP TỪNG SỐ:** script đếm viết mới `count-final-150.py` (dedup toàn cục, không cộng dồn): đợt 149 = **10 batch / 19 entry / 19 file**; lũy kế 111–149 = **378 / 756 / 645**; lũy kế 111–148 = **368 / 737 / 628**; tái kiểm 111–147 = 359/722/615 khớp — **lần thứ 30 liên tiếp** (T10 ghi lần thứ 29 ở đợt 149; nay +1). Chờ push 136–149 = **130 / 178 / 147** khớp.
- **Suite chạy lại: 28/28 exit 0, 0 rerun** (27 mục + `npm test` đầy đủ, 23:46:38–00:00:54Z, boot mới e9295700, 354 assertions pass; `npm test` 11 pass, 0 fail — demo_effects PASS, test_pixelate_render 20 case PASS). Chậm hơn T10 (14m16s vs 5m32s) do 8 luồng đợt 150 chạy song song — kết quả không đổi.
- **O8 ĐỨNG:** WebKit 21/21 + Chromium 21/21 (JSON gốc), driver log 10 dòng "21/21 pass" + "O8 DONE 21:17:59Z", chạy SAU cờ T4 — tuân (j) lần đầu. **Chuỗi WebKit FULL PASS 6 → 7 ĐÃ XÁC NHẬN** (parent (a) đã chấp nhận).
- **Balloon ghim trần ĐỨNG, ĐẾM LẠI KHỚP TỪNG SỐ:** sampler T9 125 mẫu — ghim 49, tất cả trên boot 2, đúng 2 chuỗi 22 (21:51:06–22:12:06Z) + 27 (22:20:07–22:46:07Z). Phán "đứt" của T8 đã được parent (e) bác — dữ kiện này ủng hộ quyết (e).
- **Headroom 331 ĐỨNG (đối chiếu, không đo lại cùng thời điểm):** T9 đo kép chênh 0 cả 3 lần; T5 đo độc lập 336 gần thời điểm T9 đo 339 (chênh 3, sai số pha lấy mẫu). Probe T1 chạy lại lúc này: 318 trên boot mới, tải đợt 150 — chỉ là số hiện tại, không phải kiểm lại 331.
- **#22 VẪN MỞ — ĐỨNG:** tái tính từ JSON gốc T4: A2 median đúng 138,0 ms, A3 đúng 112,0 ms (cả hai vi phạm lớp B); attempt1 partial 4/20, median 47,0 ms (n=117).
- **Mù #68/#69?/#70? → CERT 70 / FULL 85 — ĐỨNG theo hồ sơ + quyết parent (c) đã xác nhận.** T1 không đạo lại gap mù (phương pháp T2, parent đã chốt).
- **Sai số nhỏ duy nhất:** `b2-spikes.log` có **1.241 dòng** (wc -l + readlines đều 1.241), T10 ghi 1.242 — lệch 1 dòng, không ảnh hưởng gì (26 SPIKE header đã xác nhận) — xem F-150-T1-1.
- **Verdict CHẤP NHẬN đợt 149 (quyết parent (a)) KHÔNG ĐỔI:** không có phát hiện nào làm lung lay verdict.

## 1. Reboot #40 — xảy ra SAU khi đợt 149 đóng, không ảnh hưởng hồ sơ đợt 149

- Boot mới: `e9295700-bda0-4a9b-8aab-4dd57661212e`; btime /proc/stat epoch 1795131129 = **23:32:09Z**; /proc/1 mtime 23:32:24.977Z (init delay ~16 s — lớn hơn ~10 s ở #38/#39, cùng mẫu); `uptime -s` = 23:32:09Z; `journalctl --list-boots` chỉ còn 1 boot (e9295700, first entry 23:32:25Z); `wtmp` reset theo mẫu mọi reboot.
- Cờ T10-149 mtime **23:00:25Z** (kiểm lại trực tiếp); cờ T9-149 22:53:18Z. **Reboot #40 xảy ra 31m44s SAU khi T10 đóng cờ** — tức đợt 149 đã đóng xong hoàn toàn trên boot 802f358f trước khi #40 tới. Không có "cắt ngang lúc đóng sổ" như #38, không có "giữa phiên" như #39.
- Quét file ghi mới trong repo-1 (trừ node_modules): cửa **23:00–23:32Z chỉ có 2 file** — `docs/PHASE9_ROUND149_LIMITS.md` (mtime 23:09:19Z: parent viết §12.3 (a)–(r)) + `PHASE9_GAP_ANALYSIS.md` (23:01:09Z: sửa sau đóng sổ theo F-149-T10-8). **Cửa 23:09:19–23:32:09Z im lặng hoàn toàn** (không file nào ghi mới). Sau reboot, tới lúc T1 kiểm (~23:43Z): **0 file nào trong repo-1 ghi mới** — các luồng đợt 150 lúc đó chỉ làm việc trong goal hidden_files.
- Hệ quả: (i) hồ sơ đợt 149 (aggregate + GAP + LIMITS các luồng + log gốc) **không bị reboot chạm tới sau khi đóng** — mọi số T1 kiểm lại dưới đây là số gốc đợt 149, không phải số sau reboot; (ii) **mù mới mở do #40** (802f358f → e9295700) thuộc về T2-150 — T2-150 đã chạy probe #69 lúc 23:44:57Z trên boot mới (ok=2 fail=0, xem §5); (iii) **run 149:** hạn ngân sách theo started gốc là 23:35:51Z; reboot #40 (23:32:09Z) tới **3m42s TRƯỚC hạn** — kết cục run 149 (succeeded/timeout/viết lại tại #40?) thuộc cửa T7-150. T1 KHÔNG truy scheduler DB (điều tra mẫu (m) đã ĐÓNG theo quyết parent (d) — chỉ ghi mốc giờ, không điều tra).
- /tmp đã bị xóa theo reboot (tmpfs) — không còn dấu vết /tmp nào của đợt 149 để đối chiếu (cùng mẫu #38). Không ảnh hưởng kết luận (log gốc nằm trong goal hidden_files, không phải /tmp).

## 2. Đếm cuối — script viết mới, dedup toàn cục, KHỚP TỪNG SỐ

- Script: `hidden_files/round150-t1/count-final-150.py` (viết mới cho đợt này, không sửa script T10) — quét mọi `phase9-round*.txt` trong `paths-loop/`, tách NUL, suy round từ tên file, tính mọi tổng từ tập thô. Lưu ý: `phase9-round15-parity6.txt` là **đợt 15, không phải 150** — regex lấy số ngay sau `phase9-round` tới dấu `-` nên 15 và 150 không lẫn nhau.
- Output lưu tại `hidden_files/round150-t1/t1-count-final-149-recount.txt`:
  - paths files scanned: **1026** (bằng đúng số T10 quét — chưa có file `phase9-round150-*.txt` nào được stage lúc đếm, ~23:44Z); purity problems: **0**; round149 missing on disk: **0**.
  - Đợt 149: **10 batch / 19 entry / 19 file — KHỚP** (footer aggregate + §10.1).
  - Đợt 148 tái kiểm: **9 / 15 / 15 — KHỚP**.
  - Lũy kế 111–149: **378 / 756 / 645 — KHỚP**.
  - Lũy kế 111–148: **368 / 737 / 628 — KHỚP**.
  - Lũy kế 111–147: **359 / 722 / 615 — KHỚP** (lần thứ 30 liên tiếp theo cách đếm của T10).
  - Chờ push 136–149: **130 / 178 / 147 — KHỚP**.
  - Overlap đợt 149 với 111–148: **2 file** — `PHASE9_GAP_ANALYSIS.md` + `apps/web/scripts/vcut-webkit-postboot-check.sh` — đúng 2 file T10 đã nêu (GAP cập nhật mỗi đợt; postboot script T5 sửa mỗi đợt — trùng có lý do).

## 3. Suite chạy lại + `npm test` — 28/28 exit 0 trên boot mới e9295700

- Script: bản sao `round149-t10-verify.sh` đổi LOG sang `hidden_files/round150-t1/round150-t1-suites.log` (không đổi nội dung test; chỉ đổi tên file /tmp scratch sang `*-150t1.*`). Chạy **23:46:38–00:00:54Z (14m16s)** — chậm hơn 5m32s của T10 vì 8 luồng đợt 150 chạy song song (T2/T4/T5/T6/T7/T8/T9 đều đã mở thư mục lúc suite chạy) + T4-150 đang đo WebKit; U4 là nút cổ chai (render clip thật 60 s + mask anim 1.800 frame). Kết quả không đổi.
- Kết quả: **28/28 exit 0, 0 rerun, 0 non-zero**; boot đọc live cả đầu (23:46:38Z) và cuối (00:00:54Z) đều là e9295700; RAM avail 922 MB lúc bắt đầu. `test-preview-engine.sh`: **354 assertions pass** (như mọi đợt).
- `npm test` (mục cuối): **exit 0 — 11 pass, 0 fail** (unit 7/7 self-test pass; integration 11 pass — demo_effects **PASS**, test_pixelate_render **PASS (20 case size × intensity + alpha)**, demo_lut/demo_sticker/demo_chroma/demo_transitions/demo_textfx PASS). **Fix pixelate geq của T0-149 ĐỨNG trên boot mới** (effects.js md5 `fedc0141` không đổi trước/sau suite).
- Caveat: suite chạy trong lúc các luồng đợt 150 khác làm việc — tải song song có thể làm chậm từng mục nhưng không đổi verdict (mọi mục đều exit 0 ngay lần đầu, 0 rerun). Tải của suite trong cửa 23:46–00:00Z có thể nhiễm phép đo T4-150 — T4-150 tự phán (xem §9).
- /tmp/.X11-unix: suite tạo 3 socket X193/X194/X195 (mtime 23:57Z) — **T1 đã dọn tay lúc đóng (00:01Z, /tmp/.X11-unix/ TRỐNG sau khi dọn)**; 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium sót lúc kiểm.

## 4. O8 + watchdog — xác nhận bằng JSON/log gốc

- **O8 WebKit:** `hidden_files/round149-t8/o8-webkit/o8w-clicktest-report.json` — 21 results, **21 ok=true, 0 fail**. **O8 Chromium:** `o8-chromium/o8-clicktest-report.json` — 21 results, **21 ok=true, 0 fail** (precheck previewFix true, marker 'đợt 87' trong preview.tsx).
- **Driver log** `o8-149t8.log`: **10 dòng** "21/21 pass" (khớp T8/T10); dòng đầu: driver start **21:15:27Z, boot 70025d3e, preview.tsx 530e10a7, o8w ecbd1b40**; "O8 DONE 2026-11-19T21:17:59Z webkit1=0 webkit2=0 chromium=0". LogLines trong JSON WebKit có timestamp 21:16:19Z (vite dev :5560, bridge :8861) — nằm trong cửa O8 21:15:27–21:17:59Z.
- **Thứ tự O8: chạy SAU cờ T4 (21:11Z) — tuân quyết (j), lần đầu** — driver start 21:15:27Z = 4'27" sau cờ T4. **Chuỗi WebKit FULL PASS 6 → 7 — ĐÃ XÁC NHẬN** (parent (a) đã chấp nhận).
- Caveat giữ nguyên từ đợt 148/149: **chỉ 1 file JSON WebKit cho 2 attempt** (attempt2 ghi đè attempt1 — attempt1 chỉ có bằng chứng log text trong driver log). T1 không chạy O8 riêng (tiền lệ F-147/F-148-T10-1).
- **Watchdog: 0 kích hoạt đợt 149 — ĐỨNG.** Grep `WATCHDOG-137` / `LIVE-DIAG-149` trong log chạy thật (`smoke/*.log` + `o8-149t8.log`): **0 dòng**. 6 match `WATCHDOG-137` + 6 match `LIVE-DIAG-149` trong thư mục round149-t8 **chỉ nằm trong 2 script driver** (`run-webkit-149t8.sh`, `run-webkit-149t8-debroot.sh` — comment giải thích + mẫu grep + câu lệnh echo) — không phải log kích hoạt. Smoke có đủ log chạy cho cả 3 scenario × 2 engine (84l10/85m4/86n2, 19 file).

## 5. Lượt yên #22 — tái tính độc lập từ JSON gốc T4: #22 VẪN MỞ, số khớp từng số

- File gốc `hidden_files/round149-t4/preview-b-f3-flip-webkit-t4-attempt{1,2,3}-70025d3e.json`, trường `/results/.../tickCost[].total` — tái tính bằng `statistics.median` (không dùng analyzer của T4):
  - A1 (partial): n=117, median **47,0** (≤60: 91, =60: 3, >60: 26) — khớp T4 (47,0 ms, n=117); passesDone 4/20, partialReason abort-3-timeout.
  - A2: n=305, median **138,0** (≤60: 5, =60: 0, >60: 300) — khớp T4 (138,0 ms) — **vi phạm lớp B**.
  - A3: n=327, median **112,0** (≤60: 11, =60: 0, >60: 316) — khớp T4 (112,0 ms) — **vi phạm lớp B**.
- **#22 VẪN MỞ — ĐỨNG.** Không có lượt hợp lệ nào; cộng dồn giữ 18 lượt. T4-150 đo lại + sửa vòng retry poll lại gate theo quyết parent (h).

## 6. Balloon ghim trần + headroom — đếm lại từ log gốc T9: KHỚP TỪNG SỐ

- File gốc `hidden_files/round149-t9/ram-sampler.log` (125 dòng) — T1 đếm lại độc lập bằng script riêng (không dùng số của T9):
  - Tổng **125 mẫu**, 20:41:35–22:46:07Z; boot1 70025d3e: **43 mẫu**; boot2 802f358f: **82 mẫu**.
  - Ghim trần (bal == 6.443.824 kB): **49 mẫu, TẤT CẢ trên boot 2** (49/82); boot1: **0/43** (max 6.150.008 kB = 95,4% trần).
  - Chuỗi ghim: **22 mẫu (21:51:06–22:12:06Z, 22 phút) + 27 mẫu (22:20:07–22:46:07Z, 27 phút, vẫn ghim lúc sampler dừng)** — khớp từng mốc giờ với T9/aggregate.
  - Min mem **469.816 kB lúc 22:22:07Z**; max **2.219.984 kB lúc 21:05:37Z = 35,29% guard**; gate A ≥1.024 MiB: **40/125** (boot1 30/43, boot2 10/82); max load1 **10,54**, boot2 max **2,55**.
- **Phán "đứt" của T8 (F-149-T8-7) ĐÃ SAI — parent (e) đã bác và chốt đợt 149 là đợt ghim trần MỚI (= 1 đợt, chuỗi mới từ 21:51Z).** Dữ kiện đếm lại này ủng hộ quyết (e): ghim bắt đầu 21:51:06Z, ~1 phút sau khi T8 đóng cờ (~21:52Z) nhưng trên dữ kiện T8 cắt sớm ~21:41Z — phán "đứt" thiếu toàn bộ 49 mẫu sau đó.
- **Headroom 331 — ĐỨNG (đối chiếu, không đo lại cùng thời điểm):** T9 đo kép chênh 0 ở cả 3 lần (438/438, 339/339, 331/331; dừng ở errno=28); T5 đo độc lập STOP tại i=336 lúc boot 1m41s tuổi, T9 đo 339 lúc boot ~2m19s tuổi (chênh 3 watch — sai số pha lấy mẫu); số học 63.747 − 331 = 63.416 khớp. T1 chạy lại probe `k8-headroom.py` lúc ~23:49Z trên boot mới: **318** — là số HIỆN TẠI (tải đợt 150 + suite T1 đang chạy), KHÔNG phải kiểm lại 331 và không so sánh được với 331. Quyết parent (r): vẫn chỉ theo dõi.
- B2: `b2-spikes.log` có **26 dòng SPIKE** (grep "SPIKE" = 26) — khớp "26 spike" của T9; spike đầu 20:44:05Z load1=3,01. Tổng số dòng log xem F-150-T1-1.

## 7. Đối chiếu chéo các luồng còn lại (T0/T2/T5/T6/T7 — qua LIMITS + log gốc, không đo lại)

| # | Claim (nguồn) | Kết quả kiểm độc lập | Đứng? |
|---|---|---|---|
| 1 | T0: pixelate sửa bằng geq, `npm test` 11/11, demo_effects 16/16, test_pixelate_render 20 case (aggregate §1) | effects.js `fedc0141` không đổi; `test_pixelate_render.js` tồn tại (20:51Z); suite T1 chạy lại: demo_effects PASS + test_pixelate_render PASS (xem §3) | **ĐỨNG** |
| 2 | T2: probe EPERM #68 ok=2 fail=0, boot 70025d3e, 20:51:02Z; log 193 → 196 dòng; 1 `probe start`, 0 `probe end` (aggregate §3) | Log tại goal hidden_files `eperm-probe-v2.log` nay **199 dòng** — +3 đúng mẫu (1 DEAD + 1 boot-changed + 1 probe) do **probe #69 của T2-150** (23:44:57Z, boot e9295700, ok=2 fail=0); dòng probe #68 còn nguyên: `2026-11-19T20:51:02Z probe#68 boot=70025d3e tmp+ws ok=2 fail=0`; grep: 1 `probe start`, 0 `probe end`; heartbeat n=69, ts 23:44:57Z, boot e9295700 | **ĐỨNG** (196 dòng lúc T2 đóng + 3 dòng mới của đợt 150) |
| 3 | T2: mù #68/#69?/#70? đóng hoàn toàn → CERT 70 / FULL 85; gap khoảng #36 (7.607, 7.667], #37 (0, 276], #38 [1.257, 1.713) (aggregate §3/§3.1) | Số có đầy đủ trong T2 LIMITS §2.5/§3.1 (CERT70 mean 1h36'37", FULL85 mean 1h41'54", max 5h14'27"/5h43'18"); **parent (c) đã XÁC NHẬN**. T1 không đạo lại gap mù (phương pháp T2, ngoài phạm vi T1) | **ĐỨNG (hồ sơ + quyết parent)** |
| 4 | T2: F111? ≈ 0 s đủ 3 server trên boot mới; F110? 2/3 server (aggregate §3) | Ghi trong T2 LIMITS; parent (k): ghi F110? là chưa đủ 3 server, không đo lại | **ĐỨNG (ghi nhận)** |
| 5 | T5: replay boot 70025d3e +35m05s, 1545/221/462; headroom 434 → 336; run 148 SUCCEEDED, #38 không viết lại (aggregate §5) | `headroom-open.txt` STOP tại i=434, `headroom-end.txt` STOP tại i=336 — khớp "434 → 336"; cờ `POSTBOOT_PASS` + `POSTBOOT_PASS-70025d3e` tồn tại. Journal/dpkg của boot 70025d3e **không kiểm lại được sau reboot #40** (journal chỉ liệt kê 1 boot) — đối chiếu qua LIMITS T5; T10 đã kiểm lúc đóng | **ĐỨNG (đối chiếu)** |
| 6 | T6: lock khỏe — 375 cặp, log 1.304 dòng (TICKET 392 / ACQUIRED 381 / RELEASED 375 / COOLDOWN 139 / TIMEOUT 10 / STALE 6+1); T7 flaky đã điều tra xong (aggregate §6) | Dòng TOTAL trong `analyze-log-cleaned-close.txt`: `ACQUIRED=381, COOLDOWN=139, RELEASED=375, STALE-LOCK=6, STALE-TICKET=1, TICKET=392, TIMEOUT=10, total=1304` — **khớp từng số**; dòng cuối 21:03:36Z t4 RELEASED hold_s=274 (khớp holds 249/276/274). Phương án sửa flaky: parent (g) đã CHỌN (B), giao T6-150 | **ĐỨNG** |
| 7 | T7: điều tra mẫu (m) XONG, cơ chế xác định; run 148 SUCCEEDED; run 149 jitter 0 s; #38 không viết lại lần 3 (aggregate §7) | Ghi trong T7 LIMITS + aggregate; **parent (d) đã ĐÓNG điều tra**. T1 không truy scheduler DB (xem §1) | **ĐỨNG (ghi nhận, không mở lại)** |
| 8 | T9: headroom 438 → 339 → 331; sampler 125 mẫu; birefnet 0 thử lần 3 liên tiếp (aggregate §9) | Đếm lại sampler: khớp từng số (xem §6). Birefnet 0 thử: không có mẫu nào ≥ guard trong 125 mẫu (max 35,29%) — cơ chế (a) không kích hoạt là đúng thiết kế | **ĐỨNG** |
| 9 | T10 đóng cờ 23:00Z, trong hạn đóng 23:20Z + hạn cứng 23:30Z; T9 về 22:53Z kịp hạn cờ (aggregate §10.5) | Cờ `round149-t10.done` mtime **23:00:25Z**; cờ `round149-t9.done` mtime **22:53:18Z** — khớp từng mốc | **ĐỨNG** |

## 8. Cây lúc kiểm + file oversize (chỉ ghi nhận, không sửa)

- Cây (md5, kiểm lúc mở ~23:43Z và sau suite 00:01Z — không đổi):

| File | md5 lúc T10-149 đóng | md5 lúc T1-150 kiểm | Đổi? |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7266b8c148411ba21510b501a | Không |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed13703809d5e999311147745e7 | Không |
| apps/web/vite.config.ts | ee80d093 | ee80d09370b6bfb1ad86efd9a737e411 | Không |
| server/render/src/effects.js | fedc0141 | fedc0141c5344668a57cfa50b68fabf2 | Không |

- Cây đã qua 5 boot với cùng md5 preview.tsx (6fb582df đợt 147 + d8a11644 đợt 148 + ae8f70bb lúc T10-148 đóng + 70025d3e đợt 149 + e9295700 lúc T1-150 kiểm) — cây ổn định qua reboot.
- File oversize đợt 149 — TẤT CẢ vẫn oversize, kích thước đúng như aggregate §11.13 ghi (chỉ aggregate tự nó tăng do parent viết §12.3 sau khi đóng):
  - Aggregate 149: **84.286 B** (lúc T10 đóng ~74 KB; tăng ~10 KB = §12.3 (a)–(r) của parent + sửa F-149-T10-8 sau đóng sổ — tăng có lý do, vẫn OVERSIZE).
  - T2 LIMITS 63.266 B, T5 LIMITS 75.942 B, T6 LIMITS 77.338 B, T8 LIMITS 45.730 B, T9 LIMITS 60.816 B — đều OVERSIZE, kích thước khớp từng byte với §11.13.
  - Dưới trần: T0 10.672 B, T1 26.270 B, T4 23.301 B, T7 35.586 B.
  - `apps/web/scripts/clicktest-86n2-webkit-w7.mjs`: **39.194 B** — vẫn oversize (> 37.768 B); lúc push cần `ENABLE_PRIVSEP=0`.
  - File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` — vẫn chưa quyết số phận (nợ đứng, chờ user).

## 9. Sai số của chính T1-150 (F-150-T1-n)

- **F-150-T1-1 — `b2-spikes.log` 1.241 dòng, không phải 1.242 như T10 ghi.** Cả `wc -l` và Python `readlines()` đều cho 1.241; file kết thúc bằng `\n\n` (dòng trống cuối). T10 có thể đã đếm cả dòng trống cuối, hoặc đếm ở thời điểm file có thêm 1 dòng. Không ảnh hưởng gì: 26 SPIKE header đã xác nhận độc lập; không có verdict nào dựa vào tổng số dòng log này.
- **F-150-T1-2 — Dòng echo mở đầu suite log vẫn ghi "T10-149 verify start".** Script suite của T1 là bản sao của T10, `sed` chỉ đổi comment đầu file + đường dẫn LOG + tên file /tmp — không đổi chuỗi echo. Chỉ là nhãn cosmetic; timestamp (23:46:38Z), boot (e9295700) và RAM (922 MB) trong cùng dòng là đúng.
- **F-150-T1-3 — Suite chạy 14m16s (T10: 5m32s; T1-149: 9m24s).** Do 8 luồng đợt 150 chạy song song + T4-150 đang đo WebKit; U4 là nút cổ chai. Kết quả không đổi (28/28, 0 rerun). Tải suite 23:46–00:00Z có thể nhiễm phép đo T4-150 — T4-150 tự phán.
- **F-150-T1-4 — Phạm vi kiểm có giới hạn.** T1 kiểm độc lập: reboot #40, đếm cuối, O8, watchdog, #22 (tái tính từ JSON gốc), balloon/headroom (đếm lại từ log gốc), EPERM probe, lock, suite 28 + npm test. Các claim T2 (gap mù), T7 (scheduler events), T5 (replay/apt) chỉ đối chiếu qua LIMITS + log còn lại — không đạo lại từ đầu; journal/dpkg boot cũ đã mất sau reboot #40. Parent đã xác nhận các mục này ở §12.3 (c)/(d)/(l) nên không mở lại.
- **F-150-T1-5 — /tmp đã bị xóa bởi reboot #40.** Không còn dấu vết /tmp nào của đợt 149 để đối chiếu (cùng mẫu #38). Log gốc nằm trong goal hidden_files nên không ảnh hưởng.
- **F-150-T1-6 — Headroom 331 không đo lại được cùng thời điểm.** Số 318 của T1 là số hiện tại trên boot mới, tải khác — không dùng để xác nhận hay bác bỏ 331; 331 đứng bằng đối chiếu (§6).

## 10. Ghi chú thêm (quan sát, không hành động — theo quyết parent)

- **GAP §78 giữ nguyên wording tiền-quyết:** dòng §78 về đính chính đợt 148 vẫn ghi kết luận "X > 595 s" của T1-149 (viết trước khi parent quyết (b)(i) xác nhận bác bỏ); dòng T2 vẫn ghi "Chuỗi INSIDE = 0 (giữ nguyên)" trong khi parent (n) giữ tạm tính 0 → 1. Cả hai đều là wording trước quyết parent trong hồ sơ đã đóng — **không sửa**, theo quyết parent (m) ("cách đính chính này là đủ"). Chỉ ghi nhận để tránh ai đó trích GAP §78 mà không đọc §12.3.
- **Tranh chấp clock T1–T2:** parent (b) đã chốt — (i) bác bỏ "X > 595 s"; (ii) mâu thuẫn 27 s giữ khoảng rộng e2 ∈ [313, 340] s; (iii) khung #113? chốt bản giờ thực (113, 347] s; bản danh nghĩa 7 s là ẢO. T1-150 ghi nhận, không mở lại.
- **Điều tra mẫu (m):** parent (d) đã ĐÓNG. Dữ kiện mở duy nhất (điều kiện khiến recovery bỏ qua run 148 tại #38) chỉ ghi nhận để theo dõi, không mở điều tra mới.

## 11. Nợ / giao tiếp

- **Giao T2-150:** mù #71? (reboot #39) theo §11.1 đợt 149 — đã là nhiệm vụ của đợt này; thêm: **reboot #40 (802f358f → e9295700, btime 23:32:09Z) mở mù mới** — cửa sổ từ probe #69 (23:44:57Z, boot e9295700, ok=2 fail=0); khung chết danh nghĩa + chứng nhận thuộc về T2-150.
- **Giao T7-150:** kết cục run 149 — reboot #40 lúc 23:32:09Z, 3m42s trước hạn ngân sách 23:35:51Z (started gốc 20:35:51Z + 10.800 s); T1 không truy DB (xem §1).
- **Giao T4-150:** #22 đo lại + sửa vòng retry poll lại gate theo quyết parent (h); lưu ý tải suite T1 (23:46–00:00Z) có thể đã nhiễm cửa đo đầu phiên.
- **Giao T6-150:** sửa flaky T7 theo phương án (B) (quyết parent (g)) — chụp nền N0 trước rồi assert B1−N0=1 và B2−N0=0; (A) dự phòng.
- **Giao T10-150:** verdict CHẤP NHẬN đợt 149 (quyết parent (a)) KHÔNG ĐỔI theo kiểm chứng này; aggregate 149 nay 84.286 B (oversize — do §12.3); GAP §78 wording tiền-quyết xem §10 (không sửa).
- **Nợ đứng giữ nguyên (để yên, chờ user):** G1 khung (a) M2 hoãn; R9 (a) chờ user (số đếm vẫn 16); ci-security.yml vẫn 403; file oversize 6,4 MB chưa quyết; TTS 39 cấm kiểm lại; mâu thuẫn full boot_id b47f7932 vẫn mở theo quyết parent (g) đợt 143; mù #22/#28–#31/#35/#37/#38 G chờ user quyết; u2net là fallback chính thức cho birefnet.
- Stage: `phase9-round150-t1-verify149.txt` (1 entry NUL-delimited: LIMITS này). Cờ `round150-t1.done`. KHÔNG PUSH.
