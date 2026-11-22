# Đợt 160 T8 — O8 PASS 3/3 QUA GATE CHUẨN CÙNG-BOOT #61 + HARNESS 6/6 SẠCH, 0 KẸT, 0 REBOOT GIỮA PHIÊN

Ngày: 21/11/2026 (lượt cron 12:35 +07 21/11 = 05:35:51Z 21/11; T8 mở ~05:38Z, đóng ~06:35Z — TRONG hạn cờ ~08:00Z, hạn cứng ~08:30Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy QUA GATE CHUẨN CÙNG-BOOT (GATE-FOUND poll 31 lúc 06:10:22Z: cờ T4 + POSTBOOT_PASS đường (a) của T5 cho boot `52c957d5`; lượt yên #29 CÓ lượt hợp lệ #25 trên ĐÚNG boot đo); (2) harness đứng — MỘT lần chạy driver duy nhất, **6/6 PASS, 0 kẹt**, 0 reboot giữa phiên; (3) watchdog 0 kích hoạt (đúng — không có kẹt để bắt), 0 false-positive; live-diag 0 kích hoạt (không có kẹt để thử thách — điểm mù F-158-T8-4 KHÔNG được kiểm chứng đợt này, vẫn là giới hạn đứng theo quyết (u) đợt 158); (4) H3: VẪN MỞ, chỉ giám sát thụ động (quyết (i) đợt 158 — GIỮ NGUYÊN; 85m4 KHÔNG tái kẹt lần thứ hai liên tiếp nên CHƯA đủ điều kiện mở điều tra); (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau, md5 khác nhau, bản copy dự phòng khớp md5; (6) **0 REBOOT trong phiên** — boot `52c957d5` ổn định từ lúc mở tới lúc đóng (btime 1795238749 = 05:25:49Z không đổi); (7) deadline waiter dùng đúng NGÀY UTC lượt mở (21/11), kiểm `date -d` ra epoch TRƯỚC khi khởi động waiter — waiter thoát nhờ GATE-FOUND 06:10:22Z, không chờ tới deadline 07:30Z 21/11.
Nợ: docs/PHASE9_ROUND159_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 qua gate chuẩn cùng-boot #59; harness attempt 2 6/6 + 0 kẹt sau khi attempt 1 bị reboot #60 giết; kẹt cộng dồn 13; chuỗi "P3 không kẹt" 0 → 1; chuỗi WebKit FULL PASS 13 → 14 theo quyết (h) đợt 159).

## 0. Kết luận ngắn — O8 PASS 3/3 (GATE CHUẨN, CÙNG BOOT #61), HARNESS 6/6 SẠCH (1 ATTEMPT, CÙNG BOOT)

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (06:12:59–06:15:37Z, 2'38", boot `52c957d5` = #61 ứng viên, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 06:13:11Z + 06:14:04Z, Playwright mouse click lần 2; Chromium: 06:15:06Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: GATE CHUẨN CÙNG-BOOT — KHÔNG cần thủ tục (i).** Waiter T8: 30 poll GATE-NOT-YET (poll 1–13: t4=0, postboot=0; poll 14–30: t4=0, postboot=1 — POSTBOOT_PASS của T5 đã có từ 05:52:59Z) rồi **GATE-FOUND poll=31 lúc 06:10:22Z** (t4=OK + postboot đường (a) `round160-t5/POSTBOOT_PASS`, t4attempt=no-lock). T4-160: lượt yên #29 **CÓ lượt hợp lệ #25** — attempt1 06:01:26–06:05:21Z, probe 20/20, lớp B 5/5, tickCost median 44,0 ms ≤ 60, trên boot `52c957d5`; cờ T4 viết 06:11Z. **O8 chạy 06:12:59Z trên ĐÚNG boot đo** (cách lượt yên hợp lệ ~8 phút, cùng boot, gate chuẩn) — sạch như đợt 158/159. **Chuỗi WebKit FULL PASS: 14 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).**
- **Harness (MỘT lần chạy driver duy nhất, boot `52c957d5`): 6/6 PASS, 0 kẹt** (06:15:57–06:31:28Z, 15'31"): WebKit 84l10/85m4/86n2 PASS + Chromium 84l10/85m4/86n2 PASS. Cả 6 report JSON đã kiểm độc lập bằng python (6× `ok=true`). **85m4 KHÔNG tái kẹt** — P4-lần3 (điểm kẹt đợt 158) PASS lần thứ hai liên tiếp; **86n2 P4-lần2 CÓ verdict: PASS** (chuỗi 10 → 11); 84l10 E4-setup KHÔNG tái kẹt (E4 PASS, ended=false — xem F-160-T8-1). **Kẹt cộng dồn: GIỮ 13. Chuỗi "P3 không kẹt": 1 → 2.**
- **85m4 KHÔNG đủ điều kiện mở điều tra H3** (quyết (i) đợt 158: kẹt lần 2 ở đợt 158 — khác pha — tái diễn lần 3 thì mở; đợt này PASS sạch lần thứ hai liên tiếp). **H3 VẪN MỞ, chỉ giám sát thụ động.**
- **Watchdog: 0 kích hoạt — ĐÚNG (không có kẹt để bắt), 0 false-positive.** Live-diag: 0 kích hoạt — không có kẹt để thử thách; điểm mù F-158-T8-4 (HB128 làm tươi mtime) **không được kiểm chứng đợt này** (85m4 không kẹt; các dòng HB128 trong P5 đều mang giá trị TƯƠI, playhead tăng 4,1 → 30 — không phải snapshot đóng băng).
- **RAM avail min 468 MB @06:28:58Z (lúc Chromium 86n2)** — thấp hơn đợt 159 (566 MB) nhưng cao hơn nhiều so với đợt 158 (168 MB); balloon max 89,3% trần, 0 mẫu ghim trần trong sampler (n=32).
- **T8 ĐÓNG ~06:35Z — TRONG hạn cờ ~08:00Z, còn dư ~1,5 giờ** (waiter thoát nhờ gate 06:10:22Z thay vì deadline 07:30Z + harness sạch 15'31" + 0 reboot giữa phiên nên tổng phiên sớm nhất kể từ đợt 156).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 05:25:49 21/11 | REBOOT #61 ứng viên (boot `52c957d5`) — boot lúc T8 mở; số hiệu CHỜ T0 xác nhận |
| ~05:38 | T8 mở: RAM avail ~1.565 MB; đọc LIMITS T8-159 + aggregate 159 §12.3; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 159 (không đổi); fixture /tmp MẤT theo reboot #61 |
| 05:39 | **Kiểm deadline waiter bằng `date -d` ra epoch TRƯỚC khi khởi động waiter: `2026-11-21 07:30:00 UTC` = epoch 1795246200, cách lúc kiểm 6.642 s (~111 phút) — hạn cờ ~08:00Z trừ 30 phút (cùng mẫu đợt 159)** |
| 05:39 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round160-t8/diag-stall-160t8.sh`, readlink + test -x + test -e xác nhận** |
| 05:39:45–05:40:07 | **Rebuild fixture /tmp LẦN 1 (quy tắc (l)): md5 khớp đợt 125** (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549) |
| 05:40:17 | Waiter T8 bắt đầu trên boot `52c957d5` (deadline 07:30Z 21/11 — ĐÃ KIỂM epoch); poll 1: t4=0 postboot=0 |
| 05:52:59 | T5 POSTBOOT_PASS cho boot `52c957d5` (#61: dpkg 1.545, cache 178, lists 71, replay đầy đủ) — waiter postboot=1 từ poll ~14 |
| 06:01:26–06:05:21 | **T4 attempt1: probe 20/20, lớp B 5/5, tickCost median 44,0 ms — LƯỢT YÊN HỢP LỆ #25 (lượt yên #29 CÓ lượt hợp lệ)**; 0 PAGE-WEDGED đợt thứ tư liên tiếp |
| 06:11 | Cờ T4 `round160-t4.done` xuất hiện |
| 06:10:22 | **GATE-FOUND poll=31 — waiter TỰ THOÁT (không chờ tới deadline 07:30Z)**; t4=OK, postboot đường (a), t4attempt=no-lock |
| 06:12:59–06:15:37 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — QUA GATE CHUẨN, TRÊN ĐÚNG BOOT ĐO (#61) |
| 06:15:37 | O8 DONE; lock `t8-round160` nhả; vite sau release curl 5560/5554 = 000 |
| 06:15:57–06:31:28 | **Harness (MỘT lần chạy driver duy nhất, boot `52c957d5`): 6/6 PASS, 0 kẹt** (xem §2) — 0 reboot giữa phiên |
| ~06:32 | Kiểm cuối: boot `52c957d5` ổn định (btime 1795238749 không đổi); 0 process sót; lock TRỐNG; cả hai symlink diag VẪN trỏ 160; fixture /tmp còn nguyên |
| ~06:35 | Cờ `round160-t8.done` (TRONG hạn cờ ~08:00Z, dư ~1,5 giờ); LIMITS + stage file hoàn thiện sau đó |

## A. O8 — PASS 3/3 trên boot `52c957d5` (#61 ứng viên), QUA GATE CHUẨN CÙNG-BOOT (LƯỢT YÊN HỢP LỆ #29)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 06:12:59–06:13:53 | 0 | **21/21 PASS** — S1 PASS 06:13:11Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 06:13:53–06:14:45 | 0 | **21/21 PASS** — S1 PASS 06:14:04Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 06:14:45–06:15:37 | 0 | **21/21 PASS** — S1 PASS, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-21T06-13-00-52c957d5-pid42049.json` 21 kết quả `ok=true` 21/21, md5 `e1bbe8ef`; attempt2 `o8w-clicktest-report-2026-11-21T06-13-54-52c957d5-pid42436.json` 21/21 `ok=true`, md5 `fa9d8013` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-21T06-14-45-52c957d5-pid42835.json` 21/21 `ok=true`, md5 `fd0f7c37`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `52c957d5` theo POSTBOOT_PASS của T5 lúc 05:52:59Z). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (khác đợt 159: harness chạy trên boot mới sau reboot).
- Driver O8 giữ 1 lock vite `t8-round160` suốt lượt (nhả 06:15:37Z; vite sau release curl 5560/5554 = 000 — như đợt 158/159).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-160t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 14 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `52c957d5`, qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #29 trong đợt). Sạch như đợt 158/159 (parent quyết LÊN 13 rồi LÊN 14 theo quyết (h)). T8 vẫn KHÔNG tự chốt, T10/parent phán cuối.
- **O8 đợt này 2'38" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28", 152: 2'51", 153: 2'53", 154: 3'02", 155: 2'56", 156: 2'38", 157: 2'57", 158: 2'32", 159: 2'35") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: 6/6 PASS, 0 KẸT, 0 REBOOT

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 06:16:00–06:17:10 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS, E4 PASS ended=false ct cuối=3,967 — **KHÔNG tái kẹt E4-setup đợt 157** (xem F-160-T8-1) |
| 2 | WebKit 85m4 | 0 | 06:17:26–06:19:36 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart, seek kẹt 1 mẫu — **P4-lần3 (điểm kẹt đợt 158) PASS lần thứ hai liên tiếp — KHÔNG tái kẹt** |
| 3 | WebKit 86n2 | 0 | 06:19:51–06:23:51 | **PASS** — P1/P2/P3 PASS (P2-entry — điểm kẹt đợt 158 — PASS), P4-lần1/2/3 PASS (+1/+1/+1), P5 CÓ-RESTART (+2, ended-at-duration — xem F-160-T8-2), P6 extraCount=0 90 s — **P4-lần2 CÓ verdict: PASS (chuỗi 10 → 11)** |
| 4 | Chromium 84l10 | 0 | 06:24:06–06:25:07 | **PASS** — W1/W2/E4 PASS (W1 0→1/2→3/4→5 — mẫu Chromium như đợt 159; E4 ended=false — như mọi đợt, chỉ là khác biệt, không phải FAIL) |
| 5 | Chromium 85m4 | 0 | 06:25:22–06:27:22 | **PASS** — P1/P2/P3/P4-lần1/2/3 PASS (+1/+2/+2 — mẫu Chromium như đợt 159), P5 PASS 40 s 0 restart |
| 6 | Chromium 86n2 | 0 | 06:27:37–06:31:28 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5/P6 PASS (extraCount=0 cả hai) |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (WebKit 84l10 finishedAt 06:17:05.063Z; WebKit 85m4 06:19:34.070Z; WebKit 86n2 06:23:43.324Z; Chromium 84l10 06:25:04.278Z; Chromium 85m4 06:27:20.794Z; Chromium 86n2 06:31:19.705Z).
- Môi trường: system libs trên boot `52c957d5` (POSTBOOT_PASS T5 05:52:59Z: lib đầy đủ, replay đầy đủ). **WebKit launch THÀNH CÔNG 3/3 pha bằng system libs** trên ĐÚNG boot đo. Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; 0 kẹt — không có gì để đối chứng thêm).
- **Harness DÀI 15'31"** (06:15:57–06:31:28Z) — ngắn vì 0 kẹt (159 attempt 2: 16'13" với 0 kẹt; 158: 39'23" với 2 kẹt; 157: 30'35" với 1 kẹt; 156: 15'41" với 0 kẹt). Tổng phiên sớm nhờ waiter thoát sớm + harness sạch + 0 reboot giữa phiên.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG — KHÔNG CÓ KẸT), LIVE-DIAG 0/0 (KHÔNG ĐƯỢC THỬ THÁCH)

- **Watchdog (i): 0 kích hoạt — ĐÚNG.** Không có lần chạy nào evaluate im lặng >60 s (6/6 PASS, thời gian mỗi pha đều trong khung bình thường). 0 false-positive đợt thứ tư liên tiếp watchdog không kích hoạt oan (157: 1 kích hoạt đúng; 158: 2 kích hoạt đúng; 159: 0 kích hoạt — đúng vì 0 kẹt; 160: 0 kích hoạt — đúng vì 0 kẹt).
- **Driver (1b) live-diag: 0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH.** Không lần chạy nào log im lặng >120 s (`live_diags=0` cả 6 lần). Điểm mù F-158-T8-4 (HB128 làm tươi mtime) **không được kiểm chứng đợt này**: 85m4 không kẹt, các dòng HB128 trong P5 đều mang giá trị TƯƠI (playhead tăng 4,1 → 30, ct tăng theo, seeking=false) — không phải snapshot đóng băng. Điểm mù vẫn là giới hạn đứng theo quyết (u) đợt 158; T8-160 KHÔNG tự bổ sung kiểm "nội dung tươi" (quyết (u) đã chốt CHƯA bổ sung).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–159 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–160) + đường ổn định `t8-diag-stall.sh` → 160 (CẢ HAI symlink cập nhật 05:39Z, TRƯỚC mọi lần chạy — xem F-160-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT KHI KHÔNG CÓ KẸT.** 0 snapshot stall |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–160) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH (không có kẹt; điểm mù F-158-T8-4 vẫn đứng)** |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-160t8.sh` (cột `balloon_kb`) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=4.621.156 max=5.751.312 (89,3% trần) mean=5.336.872; avail min=468 MB @06:28:58Z (lúc Chromium 86n2) / max 2.117 MB — xem F-160-T8-4 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 06:25:07Z), 85m4 PASS (exit 0, 06:27:22Z), 86n2 PASS (exit 0, 06:31:28Z)** | N cộng dồn **N=22 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline lúc bắt đầu đã lưu; diag script không gọi) | Không có snapshot timeout124/live-diag nào đợt này (đúng — không có kẹt) |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/src/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không (bản sửa T0-152 F-151-T10-2 còn nguyên) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không (như trên) |

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi so với đợt 159 (đều là bản copy, không chạm script repo): nhãn log `LIVE-DIAG-159` → `LIVE-DIAG-160`, lock `t8-round159` → `t8-round160`, deadline waiter 04:30Z 21/11 → **07:30Z 21/11**, nhãn `T8-159` → `T8-160` trong o8-driver — VÀ 2 chuỗi nhãn "T8-158" còn sót từ đợt 159 đã sửa xong trước khi chạy (xem F-160-T8-3 — F-159-T8-2 ĐÓNG).
- Script trích số liệu `extract-160t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 1 log waiter đợt này: 30 poll NOT-YET + GATE-FOUND poll 31, 0 WAIT-DEADLINE, 0 REBOOT trong log waiter).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round160` 06:15:37Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 06:31:28Z).
- Kiểm cuối ~06:32Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown); boot `52c957d5` ổn định (btime 1795238749 không đổi từ 05:25:49Z — 0 reboot trong phiên).
- `/tmp/.X11-unix/` chỉ còn X193/X194/X195 (của luồng khác; T8 dùng :199 cho harness + :188 cho O8-WebKit, cả hai đã dọn socket của mình; không có socket mồ côi nào để lại).
- Fixture /tmp CÒN NGUYÊN sau harness (md5 h `fbaa3d1a` lúc kiểm cuối); không cần rebuild lần 2.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN CÙNG BOOT `52c957d5`** (khác đợt 159: O8 trên #59, harness trên boot mới sau reboot). Cả lượt yên hợp lệ #25, O8 và harness đều trên đúng boot đo — phiên sạch nhất kể từ đợt 156.
2. **Chuỗi WebKit FULL PASS 14 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 15 (xem F-159-T8-7 mẫu đợt trước).
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `52c957d5` theo POSTBOOT_PASS của T5. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo.
4. **WebKit 84l10 E4 `ended=false` (xem F-160-T8-1) + WebKit 86n2 P5 extraCount=2 (xem F-160-T8-2)** — cả hai đều là khác biệt, không phải FAIL (script verdict KHÔNG FAIL cả hai pha). Đừng gộp các đợt.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=32, max 89,3% trần) — avail min 468 MB @06:28:58Z là THẤP hơn đợt 159 (566 MB) nhưng CAO hơn nhiều so với đợt 158 (168 MB). Chuỗi ghim trần phán bằng sampler T9 (giao T10).
6. **86n2 P4-lần2 CÓ verdict đợt này: PASS — chuỗi 10 → 11.** Đợt 159 chuỗi lên 10; đợt này lên 11.
7. **85m4 KHÔNG tái kẹt lần thứ hai liên tiếp** — P4-lần3 PASS đợt 159 + đợt 160. Theo quyết (i) đợt 158, CHƯA đủ điều kiện mở điều tra riêng cho 85m4/86n2. H3 VẪN MỞ, chỉ giám sát thụ động.
8. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–159 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
9. **T8 ĐÓNG TRONG hạn cờ ~08:00Z (cờ viết ~06:35Z, dư ~1,5 giờ)** — waiter thoát nhờ gate (06:10:22Z thay vì deadline 07:30Z) + harness sạch (15'31") + 0 reboot giữa phiên.
10. **0 reboot trong phiên** — boot `52c957d5` (btime 05:25:49Z) ổn định từ lúc mở tới lúc đóng; số hiệu #61 là ỨNG VIÊN — chờ T0 xác nhận. Mù cho boot mới giao T2-160; POSTBOOT_PASS #61 ĐÃ CÓ qua đường T5 (05:52:59Z, replay đầy đủ).

## 8. Sai số mới (F-160-T8-N)

- **F-160-T8-1 — WEBKIT 84l10 E4 `ended=false` (KHÁC ĐỢT 159 `ended=true`, CHỈ LÀ KHÁC BIỆT):** E4 PASS 06:17:04Z — tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=3,967, ended=false, errors=0. Đợt 159 WebKit E4 ended=true ct cuối=4; đợt 156/158 Chromium E4 ended=false (đã ghi là khác biệt). Đợt này WebKit cũng ended=false — lần đầu WebKit 84l10 E4 ended=false kể từ khi T8 ghi nhận (159: true). Script verdict vẫn PASS (E4 không assert ended=true); đừng trích ended=false thành FAIL hay thành "E4 yếu đi" — chỉ ghi nhận khác biệt để T10 đối chiếu các đợt sau.
- **F-160-T8-2 — WEBKIT 86n2 P5 extraCount=2 `ended-at-duration` (RESTART TỰ NHIÊN CUỐI CLIP, KHÔNG FAIL):** P5 06:21:59Z CÓ-RESTART (+2) — 2 trace event đều causeTag `ended-at-duration`, ct=30, dur=30, ticksEndedTrue=1 (dtResetMs 30786 + 31822). Trong cửa sổ P5 (40 s + 90 s P6) clip 30 s tới cuối 2 lần nên restart tự nhiên 2 lần — không phải restart dư do lỗi; P6 extraCount=0 (90 s không kẹt); report JSON `ok=true`. Đợt 159 P5 PASS 0 restart (clip chưa tới cuối trong cửa sổ đo ngắn hơn). Đừng trích "+2 restart" thành kẹt hay FAIL.
- **F-160-T8-3 — 2 NHÃN "T8-158" CÒN SÓT ĐÃ SỬA XONG TRƯỚC KHI CHẠY (F-159-T8-2 ĐÓNG):** sed khi copy driver đợt 160 đã đổi cả `T8-158` → `T8-160` trong o8-driver-160t8.sh (4 nhãn) + selfcheck-postboot-160t8.sh (2 nhãn); `bash -n` OK sau sửa; log O8 + selfcheck đợt này mang đúng nhãn T8-160. Không còn nhãn sai đợt trong driver 160 (grep `159` trong script = 0).
- **F-160-T8-4 — RAM SAMPLER: n=32:** log `ram-160t8.log` có 34 dòng = 1 header + 32 mẫu + 1 dòng marker "CHROMIUM PHASE start"; balloon min 4.621.156 / max 5.751.312 (89,3% trần) / mean 5.336.872, pinned=0; avail min=468 MB @06:28:58Z (lúc Chromium 86n2 — load 2,21 lúc đó) / max 2.117 MB. Balloon-max @06:23:57Z (avail 1.068 MB, load 0,51). Không gộp với sampler đợt khác (khác boot, khác cửa sổ).
- **F-160-T8-5 — CHECKLIST (o) ĐÃ LÀM ĐÚNG CẢ HAI SYMLINK — GIỮ QUA CẢ PHIÊN, 0 REBOOT:** lúc T8 mở (~05:39Z) cả hai symlink vẫn trỏ về `round159-t8/diag-stall-159t8.sh` (stale 1 đợt). T8 cập nhật CẢ HAI về `round160-t8/diag-stall-160t8.sh` lúc 05:39Z (trước mọi lần chạy), `readlink` + `test -x` + `test -e` xác nhận cả hai; kiểm cuối ~06:32Z cả hai VẪN trỏ 160 (symlink nằm trên đĩa bền). Không có snapshot stall nào đợt này nên đường diag không được thử thách thực tế — nhưng đường đã đúng cả hai mối suốt phiên. Về đề xuất T0-154 (sửa hằng `DIAG137_SCRIPT` trong 3 script harness về 1 mối duy nhất): T8-160 VẪN QUYẾT ĐỊNH KHÔNG SỬA trong phiên này — phiên đã chạy xong sạch, sửa hằng giữa/cuối phiên không còn lợi ích trong đợt này; giao T0-161 cân nhắc sửa khi phiên ổn định (không có kẹt/reboot giữa phiên) + kiểm thử đầy đủ. **Nợ đóng:** F-159-T8-2 (nhãn T8-158 sót) đã sửa xong và xác nhận đúng đợt này (xem F-160-T8-3); F-158-T8-3 đóng từ đợt 159, giữ đúng đợt thứ hai liên tiếp (extract in đúng dòng GATE-FOUND poll 31).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 14 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `52c957d5` (#61 ứng viên), qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #29 trong đợt (attempt1 20/20, B 5/5, tickCost 44,0 ms). Sạch như đợt 158/159 (parent đã quyết LÊN 13 rồi LÊN 14 theo quyết (h)). T8 không tự chốt (xem F-159-T8-7).
2. **Chuỗi "P3 không kẹt" 1 → 2 — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (i) đợt 158).** 0 kẹt đợt này trong 6 lần chạy (một lần chạy driver duy nhất, 0 reboot giữa phiên); kẹt cộng dồn GIỮ 13 (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1 + 157: 1 + 158: 2). Nếu đợt 161 sạch thì chuỗi lên 3.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=22 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #29 CÓ lượt hợp lệ #25 (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-160: attempt1 20/20, B 5/5, tickCost median 44,0 ms; P3' cộng dồn mới 61/69 occ = 61/64 distinct-seq (xem LIMITS T4-160 để đối chiếu số tuyệt đối). Chuỗi lượt yên hợp lệ NỐI DÀI #24 → #25. 0 PAGE-WEDGED đợt thứ tư liên tiếp.
5. **Điểm mù live-diag (1b) với HB128 (F-158-T8-4) — vẫn là giới hạn đứng, CHƯA được kiểm chứng đợt này** (không có kẹt 85m4 để thử thách; quyết (u) đợt 158 giữ nguyên CHƯA bổ sung kiểm "nội dung tươi").
6. **85m4 KHÔNG tái kẹt lần thứ hai liên tiếp (P4-lần3 PASS đợt 159 + 160); 86n2 P4-lần2 PASS (chuỗi 10 → 11); 84l10 E4-setup KHÔNG tái kẹt** (xem §2). 85m4/86n2 CHƯA đủ điều kiện mở điều tra riêng theo quyết (i) đợt 158.
7. **RAM avail min 468 MB (thấp hơn đợt 159: 566 MB, cao hơn đợt 158: 168 MB) + balloon max 89,3% — chờ T9 đối chiếu** (F-160-T8-4); chuỗi ghim trần phán bằng sampler T9 (giao T10).
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-160 xác nhận số lần — lần thứ 14 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS cho boot `52c957d5` (#61 ứng viên) ĐÃ CÓ qua đường T5 (05:52:59Z, replay đầy đủ); POSTBOOT_PASS #60 ĐÃ CÓ (giao T5-160 xác nhận — xem LIMITS T5-160).
9. **0 reboot trong phiên** — số hiệu #61 là ỨNG VIÊN, chờ T0 xác nhận; mù cho boot mới giao T2-160 (theo quyết (s) đợt 158, #59/#60 đã xác nhận ở đợt 159; #61 chưa).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 160 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159) — 0 KẸT, CHUỖI LÊN 2

## B1. Trạng thái giả thuyết sau đợt 160 (H3 vẫn mở — 0 kẹt mới, không có chữ ký mới)

| Giả thuyết | Trạng thái đợt 159 | Trạng thái đợt 160 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — 0 KẸT MỚI ĐỢT NÀY (không có dữ kiện mới ủng hộ hay bác bỏ; 85m4/86n2 đều PASS tại đúng điểm kẹt đợt 158, lần thứ hai liên tiếp)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — không có kẹt mới để kiểm lại)** |

- Đợt 160 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **0 kẹt thật trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt nào).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 468 MB trong cửa sổ harness — THẤP hơn đợt 159 (566 MB, 0 kẹt) nhưng CAO hơn đợt 158 (168 MB, 2 kẹt); H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-161 đối chiếu tiếp.
- Lưu ý phân biệt chữ ký: T4 attempt1 HỢP LỆ (không wedge) — đợt thứ tư liên tiếp T4 không PAGE-WEDGED. Đợt này T4 1 lượt hợp lệ, T8 0 kẹt; đừng gộp hai việc thành một lỗi. 0 reboot trong phiên — không có sự kiện hạ tầng nào để nhầm thành kẹt.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 160

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–160) + đường ổn định `t8-diag-stall.sh` → 160 (CẢ HAI symlink cập nhật 05:39Z; kiểm cuối vẫn trỏ 160 — xem F-160-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–160) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH (không có kẹt; điểm mù F-158-T8-4 vẫn đứng)** |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=4.621.156 max=5.751.312 (89,3% trần) mean=5.336.872; avail min=468 MB @06:28:58Z (lúc Chromium 86n2); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 06:25:07Z), 85m4 PASS (exit 0, 06:27:22Z), 86n2 PASS (exit 0, 06:31:28Z)** | N cộng dồn **N=22 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline lúc bắt đầu đã lưu) | Không có snapshot timeout124/live-diag nào đợt này (đúng — không có kẹt) |

## B3. Chữ ký kẹt — đợt 160: 0 KẸT (CÁC ĐIỂM KẸT ĐỢT 158 ĐỀU PASS LẦN THỨ HAI LIÊN TIẾP)

- **85m4 P4-lần3 (waitForPlaySync) — điểm kẹt đợt 158 — PASS lần thứ hai liên tiếp** (06:18:50–06:18:52Z, element đồng bộ sau 1,3 s, playhead=1,033, ct=1,133, delta=+1, hạ-cánh-về-target=true, errors=0). Không có WATCHDOG-137, không probe, không live-diag — evaluate trả đúng hạn cả 3 lần P4. **85m4 kẹt lần 2 (đợt 158) KHÔNG tái diễn lần thứ hai liên tiếp** → chưa đủ điều kiện mở điều tra riêng (quyết (i) đợt 158).
- **86n2 P2-entry (runEngine:439) — điểm kẹt đợt 158 — PASS lần thứ hai liên tiếp** (P2 PASS 06:20:42Z, reset xong 706 ms, extraEvents=[]). P4-lần2 (không verdict đợt 158) PASS 06:21:12–06:21:14Z (delta=+1, ct=2,433). **86n2 P4-lần2: chuỗi 10 → 11.**
- **84l10 E4-setup — điểm kẹt đợt 157 — KHÔNG tái kẹt đợt thứ ba liên tiếp** (E4 PASS ended=true đợt 158 + 159, ended=false đợt 160 — xem F-160-T8-1; W1-lần1/2/3 PASS + W2 PASS cả ba đợt).
- **Đối chiếu với kẹt đợt 158 (85m4 P4-lần3 + 86n2 P2-entry):** cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), CÙNG boot đo trong đợt này (`52c957d5`; kẹt đợt 158 trên boot `28366bd0` #58). Không kết luận boot gây/không gây kẹt — chỉ ghi nhận khác biệt để T10 đối chiếu.
- **Không có điểm pha nào "nóng" đợt này:** cả 3 pha WebKit + cả 3 pha Chromium đều PASS đủ P1–P6/W1/W2/E4 (trừ ghi chú WebKit 84l10 E4 `ended=false` + WebKit 86n2 P5 extraCount=2 `ended-at-duration` + Chromium 85m4 P4-lần2/3 delta=+2 — như đợt 156/158/159, chỉ là khác biệt; tất cả không phải FAIL).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 160: 0 KẸT, CHUỖI LÊN 2

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 143: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 144: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 145: 6 lần chạy, 0 kẹt (chuỗi 4). Đợt 146: 6 lần chạy, 0 kẹt (chuỗi 5). Đợt 147: 6 lần chạy, 0 kẹt (chuỗi 6). Đợt 148: 6 lần chạy, 1 KẸT (86n2 WebKit P4-lần2) — chuỗi về 0. Đợt 149: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 150: 6 lần chạy, 2 KẸT (85m4 P1 + 86n2 P5) — chuỗi về 0. Đợt 151: 6 lần chạy, 2 KẸT (85m4 P1 + P5) — chuỗi về 0. Đợt 152: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 153: 6 lần chạy, 1 KẸT (85m4 P1-phaseA) — chuỗi về 0. Đợt 154: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 155: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 156: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 157: 6 lần chạy, 1 KẸT (84l10 E4-setup) — chuỗi về 0. Đợt 158: 6 lần chạy, 2 KẸT (85m4 P4-lần3 + 86n2 P2-entry) — chuỗi VẪN 0. Đợt 159: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS + 86n2 P2-entry PASS) — chuỗi 0 → 1. **Đợt 160: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ hai liên tiếp + 86n2 P2-entry PASS lần thứ hai liên tiếp) — chuỗi 1 → 2.** Kẹt cộng dồn: **GIỮ 13**.
- Nếu đợt 161 sạch (0 kẹt trong 6 lần chạy) thì chuỗi lên 3.
