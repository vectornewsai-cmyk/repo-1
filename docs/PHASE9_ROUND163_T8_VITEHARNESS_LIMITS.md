# Đợt 163 T8 — O8 PASS 3/3 QUA GATE CHUẨN CÙNG-BOOT #65 + HARNESS 6/6, 0 KẸT (CHUỖI "P3 KHÔNG KẸT" LÊN 1)

Ngày: 21/11/2026 (lượt cron 21:35 +07 21/11 = 14:35:51Z 21/11; T8 mở ~14:38Z, đóng ~16:04Z — TRONG hạn cờ ~17:00Z, hạn cứng 17:30Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy QUA GATE CHUẨN CÙNG-BOOT (GATE-FOUND poll 54 lúc 15:34:48Z: cờ T4 + POSTBOOT_PASS đường (a) của T5 cho boot `1c1cf10c`; lượt yên #32 CÓ lượt hợp lệ #28 trên ĐÚNG boot đo); (2) harness đứng — MỘT lần chạy driver duy nhất, **6/6 PASS, 0 KẸT**, 0 reboot giữa phiên; (3) watchdog **0 kích hoạt** (0 kẹt thật để bắt), 0 false-positive; live-diag **0 kích hoạt** (0 kẹt làm log im lặng đủ lâu); điểm mù F-158-T8-4 (HB128/85m4) VẪN chưa được kiểm chứng (85m4 không kẹt — lần thứ hai liên tiếp không có kẹt để thử thách sau lần kích hoạt thật đầu tiên ở đợt 162); (4) H3: VẪN MỞ, chỉ giám sát thụ động (0 kẹt mới; kẹt cộng dồn GIỮ 14; chuỗi "P3 không kẹt" 0 → 1); (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau, md5 khác nhau, bản copy dự phòng khớp md5; (6) **0 REBOOT trong phiên** — boot `1c1cf10c` ổn định từ lúc mở tới lúc đóng (btime 1795271697 = 14:34:57Z không đổi); (7) deadline waiter dùng đúng NGÀY UTC lượt mở (21/11), kiểm `date -d` ra epoch TRƯỚC khi khởi động waiter — waiter thoát nhờ GATE-FOUND 15:34:48Z, không chờ tới deadline 16:30Z 21/11.
Nợ: docs/PHASE9_ROUND162_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 qua gate chuẩn cùng-boot #64; harness 5/6 + 1 kẹt WebKit 86n2 P5-entry; live-diag kích hoạt thật LẦN ĐẦU 2/2; kẹt cộng dồn 13 → 14; chuỗi "P3 không kẹt" 3 → 0; chuỗi WebKit FULL PASS LÊN 17 theo quyết (g) đợt 162).

## 0. Kết luận ngắn — O8 PASS 3/3 (GATE CHUẨN, CÙNG BOOT #65), HARNESS 6/6 + 0 KẸT

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (15:39:27–15:42:34Z, 3'07", boot `1c1cf10c` = #65 ứng viên, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 15:39:49Z + 15:40:49Z, Playwright mouse click lần 2; Chromium: 15:42:03Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: GATE CHUẨN CÙNG-BOOT — KHÔNG cần thủ tục (i).** Waiter T8: 53 poll GATE-NOT-YET rồi **GATE-FOUND poll=54 lúc 15:34:48Z** (t4=OK + postboot đường (a) `round163-t5/POSTBOOT_PASS`, t4attempt=no-lock). T4-163: lượt yên #32 **CÓ lượt hợp lệ #28** — attempt2 14:59:01–15:03:10Z, probe 20/20, lớp B 5/5, tickCost median 53,0 ms ≤ 60, trên boot `1c1cf10c`; cờ T4 viết 15:34Z (attempt1 trượt vì tickCost 62,0 ms > 60 — xem §1/F-163-T8-4). **O8 chạy 15:39:27Z trên ĐÚNG boot đo** (cách lượt yên hợp lệ ~36 phút, cùng boot, gate chuẩn) — sạch như đợt 158/159/160/161/162. **Chuỗi WebKit FULL PASS: 17 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).**
- **Harness (MỘT lần chạy driver duy nhất, boot `1c1cf10c`): 6/6 PASS, 0 KẸT** (15:42:43–15:58:58Z, 16'15"): WebKit 84l10/85m4/86n2 PASS + Chromium 84l10/85m4/86n2 PASS. Cả 6 report JSON đã kiểm độc lập bằng python (6× `ok=true`). **85m4 P4-lần3 PASS lần thứ năm liên tiếp — KHÔNG tái kẹt**; **86n2 P4-lần2 CÓ verdict: PASS** (chuỗi verdict 13 → 14); **86n2 P5-entry PASS** (điểm kẹt đợt 162 không tái diễn); 84l10 E4 PASS ended=false ct cuối=3,933 — **ended=false lần thứ tư liên tiếp** (xem F-163-T8-5). **Kẹt cộng dồn: GIỮ 14. Chuỗi "P3 không kẹt": 0 → 1.**
- **85m4 KHÔNG đủ điều kiện mở điều tra H3** (quyết (i) đợt 158 + quyết (h) đợt 162: P4-lần3 PASS sạch lần thứ năm liên tiếp). **0 kẹt mới đợt này** — không có chữ ký mới để xét theo quyết (f) đợt 151. **H3 VẪN MỞ, chỉ giám sát thụ động.**
- **Watchdog: 0 kích hoạt — ĐÚNG (0 kẹt thật để bắt), 0 false-positive.** Live-diag: **0 kích hoạt** (0 kẹt làm log im lặng đủ lâu); điểm mù F-158-T8-4 (HB128 làm tươi mtime ở 85m4) **không được kiểm chứng đợt này** (85m4 không kẹt — 86n2 cũng không kẹt; xem F-163-T8-2).
- **RAM avail min 502 MB @15:54:13Z (trong cửa sổ harness)** — CAO HƠN đợt 162 (362 MB); balloon max 91,3% trần, 0 mẫu ghim trần trong sampler (n=33). Lưu ý: balloon ĐÃ GHIM TRẦN 6.443.824 kB lúc 15:39:21Z (trước O8, ngoài cửa sổ sampler) — xem F-163-T8-3.
- **T8 ĐÓNG ~16:04Z — TRONG hạn cờ ~17:00Z, còn dư ~56 phút** (gate chậm: 53 poll thay vì 24 poll đợt 162 — xem F-163-T8-4; harness sạch 16'15").

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 14:34:57 21/11 | REBOOT #65 ứng viên (boot `1c1cf10c`) — boot lúc T8 mở; số hiệu CHỜ T0 xác nhận (T0-163: 9 nguồn khớp, KHÔNG nghịch lý đồng hồ, reboot SAU khi T10-162 đóng sổ 18'18", run 162 SUCCEEDED 14:18:06Z trước btime — không bị giết) |
| ~14:38 | T8 mở: đọc LIMITS T8-162 + aggregate 162 §8/§12.3 (g)(h)(y) + GAP §91; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 162 (không đổi); fixture /tmp MẤT theo reboot #65 |
| 14:39:57 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round163-t8/diag-stall-163t8.sh`, readlink + test -x + test -e xác nhận; nhãn `LIVE-DIAG-161` sót đợt 162 ĐÃ SỬA thành `LIVE-DIAG-163` khi copy (F-162-T8-5 ĐÓNG)** |
| 14:40 | **Rebuild fixture /tmp LẦN 1 (quy tắc (l)): hevc + i7 khớp đợt 125, h-30s/g-4s LỆCH md5 (xem F-163-T8-1)** |
| 14:40:36 | **Kiểm deadline waiter bằng `date -d` ra epoch TRƯỚC khi khởi động waiter: `2026-11-21 16:30:00 UTC` = epoch 1795278600, cách lúc kiểm ~11.370 s (~3h10m) — hạn cờ ~17:00Z trừ 30 phút (cùng mẫu đợt 162)** |
| 14:41:42 | Waiter T8 bắt đầu trên boot `1c1cf10c` (deadline 16:30Z 21/11 — ĐÃ KIỂM epoch); poll 1: t4=0 postboot=0 |
| 14:43:42 | Waiter postboot=1 từ poll 3 (POSTBOOT_PASS #65 của T5 — xem §A) |
| 14:54:04–14:58:15 | **T4 attempt1: probe 20/20, lớp B 5/5, tickCost median 62,0 ms > 60 — KHÔNG HỢP LỆ, retry theo quyết (h) đợt 149** |
| 14:59:01–15:03:10 | **T4 attempt2: probe 20/20, lớp B 5/5, tickCost median 53,0 ms — LƯỢT YÊN HỢP LỆ #28 (lượt yên #32 CÓ lượt hợp lệ)**; 0 PAGE-WEDGED (lần thứ 7 liên tiếp); poller 19 poll, cửa mở poll #16 (RAM 1.478 MB) + poll #18 (RAM 3.350 MB) |
| 15:34 | Cờ T4 `round163-t4.done` xuất hiện (1.495 B, có nội dung) |
| 15:34:48 | **GATE-FOUND poll=54 — waiter TỰ THOÁT (không chờ tới deadline 16:30Z)**; t4=OK, postboot đường (a), t4attempt=no-lock |
| 15:39:27–15:42:34 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — QUA GATE CHUẨN, TRÊN ĐÚNG BOOT ĐO (#65) |
| 15:42:43–15:58:58 | **Harness (MỘT lần chạy driver duy nhất, boot `1c1cf10c`): 6/6 PASS, 0 KẸT** (xem §2) — 0 reboot giữa phiên |
| ~16:00 | **Dọn 3 socket X11 mồ côi X193/X194/X195** (0 process Xvfb còn sống — xem §6/F-163-T8-3); kiểm cuối: boot `1c1cf10c` ổn định (btime 1795271697 không đổi); 0 process sót; lock TRỐNG; cả hai symlink diag VẪN trỏ 163; fixture /tmp còn nguyên |
| ~16:04 | Cờ `round163-t8.done` (TRONG hạn cờ ~17:00Z, dư ~56 phút); LIMITS + stage file hoàn thiện sau đó |

## A. O8 — PASS 3/3 trên boot `1c1cf10c` (#65 ứng viên), QUA GATE CHUẨN CÙNG-BOOT (LƯỢT YÊN HỢP LỆ #28)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 15:39:27–15:40:34 | 0 | **21/21 PASS** — S1 PASS 15:39:49Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 15:40:34–15:41:35 | 0 | **21/21 PASS** — S1 PASS 15:40:49Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 15:41:35–15:42:34 | 0 | **21/21 PASS** — S1 PASS 15:42:03Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-21T15-39-29-1c1cf10c-pid47668.json` 21 kết quả `ok=true` 21/21, md5 `d614173d`; attempt2 `o8w-clicktest-report-2026-11-21T15-40-35-1c1cf10c-pid48104.json` 21/21 `ok=true`, md5 `44d90ffe` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-21T15-41-35-1c1cf10c-pid48557.json` 21/21 `ok=true`, md5 `931baeaf`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- **CAVEAT LIB — O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (xem F-163-T8-2): script O8 gốc `clicktest-87o8-mask-track-webkit.mjs` tự đặt `LD_LIBRARY_PATH` với DEBROOT (dòng 350–356, tiền lệ đợt 110 L8), và driver o8-driver-163t8.sh cũng đặt `LD_LIBRARY_PATH="$DEBROOT:..."` khi gọi node — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `1c1cf10c` theo POSTBOOT_PASS của T5 lúc 14:45:05Z). Ghi rõ để T10 không trích O8 là "chạy bằng system libs" — nhãn đó trong quyết (g) đợt 162 không khớp bằng chứng script; bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (như đợt 162).
- Driver O8 giữ 1 lock vite `t8-round163` suốt lượt (nhả 15:42:34Z; vite sau release curl 5560/5554 = 000000 — như đợt 162).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-163t8.mjs`, `node --check` OK — bản copy từ 162, chỉ đổi nhãn) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 17 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `1c1cf10c`, qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #28 trong đợt). Sạch như đợt 158/159/160/161/162 (parent quyết LÊN 13 rồi 14 rồi 15 rồi 16 rồi 17 theo quyết (g)). T8 vẫn KHÔNG tự chốt, T10/parent phán cuối. Đợt này sạch hơn đợt 162 ở một điểm: harness 0 kẹt (đợt 162 có 1 kẹt sau O8 DONE).
- **O8 đợt này 3'07" tổng** (162: 2'37", 161: 2'32", 160: 2'38", 159: 2'35", 158: 2'32") — dài hơn ~30 s so với các đợt gần đây, dao động theo lượt (balloon ghim trần lúc O8 — xem F-163-T8-3), không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: 6/6 PASS, 0 KẸT, 0 REBOOT

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 15:42:49–15:44:09 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS, E4 PASS ended=false ct cuối=3,933 — **KHÔNG tái kẹt E4-setup đợt 157; ended=false lần thứ tư liên tiếp** (xem F-163-T8-5) |
| 2 | WebKit 85m4 | 0 | 15:44:25–15:46:45 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart, seek kẹt 0 mẫu — **P4-lần3 (điểm kẹt đợt 158) PASS lần thứ năm liên tiếp — KHÔNG tái kẹt** |
| 3 | WebKit 86n2 | 0 | 15:47:00–15:51:01 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart — **P5-entry (điểm kẹt đợt 162) PASS, không tái kẹt; P4-lần2 PASS (chuỗi verdict 13 → 14)** |
| 4 | Chromium 84l10 | 0 | 15:51:16–15:52:26 | **PASS** — W1-lần1/2/3 PASS, W2 PASS, E4 PASS ended=false ct cuối=3,932 (report JSON ok=true, finishedAt 15:52:20.534Z) |
| 5 | Chromium 85m4 | 0 | 15:52:42–15:54:52 | **PASS** — P4-lần3 PASS (delta=+2, ct=2,599), P5 PASS 40 s 0 restart (report JSON ok=true, finishedAt 15:54:45.091Z) |
| 6 | Chromium 86n2 | 0 | 15:55:08–15:58:58 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart (report JSON ok=true, finishedAt 15:58:57.797Z) — **đối chứng âm tính cho cả hai điểm kẹt WebKit cũ (P2-entry đợt 158, P5-entry đợt 162)** |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (WebKit 84l10 finishedAt 15:44:00.941Z; WebKit 85m4 15:46:42.765Z; WebKit 86n2 15:50:59.708Z; Chromium 84l10 15:52:20.534Z; Chromium 85m4 15:54:45.091Z; Chromium 86n2 15:58:57.797Z).
- Môi trường: system libs trên boot `1c1cf10c` (POSTBOOT_PASS T5 14:45:05Z: replay-day-du, dpkg 1545). **WebKit launch THÀNH CÔNG 3/3 pha bằng system libs** trên ĐÚNG boot đo. Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; Chromium cùng pha PASS đã là đối chứng đủ).
- **Harness 16'15"** (15:42:43–15:58:58Z) — trong khung bình thường của đợt sạch (161: 15'31"; 162 dài 26'34" vì timeout 900 s của 86n2).

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG, 0 KẸT THẬT) + LIVE-DIAG 0 KÍCH HOẠT

- **Watchdog (i): 0 kích hoạt — ĐÚNG.** 0 kẹt trong 6 lần chạy harness + 3 lần chạy O8; 0 WATCHDOG-137 trong mọi log (summary + 3 log WebKit + log O8). 0 false-positive (không kích hoạt ở pha nào).
- **Driver (1b) live-diag: 0 kích hoạt** (không có kẹt làm log im lặng >120 s; `live_diags=0` ở cả 6 pha). **Điểm mù F-158-T8-4 (HB128 làm tươi mtime ở 85m4) KHÔNG được kiểm chứng đợt này**: 85m4 không kẹt; 86n2 cũng không kẹt — live-diag không có gì để bắt. Điểm mù vẫn là giới hạn đứng theo quyết (u) đợt 160 + quyết (z) đợt 161 + quyết (y) đợt 162; T8-163 KHÔNG tự bổ sung kiểm "nội dung tươi".
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–162 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–163) + đường ổn định `t8-diag-stall.sh` → 163 (CẢ HAI symlink cập nhật 14:39:57Z, TRƯỚC mọi lần chạy — xem F-163-T8-6) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt ĐÚNG, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT KHI KHÔNG CÓ KẸT.** 0 snapshot stall |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–163) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — không có kẹt để thử thách điểm mù F-158-T8-4** |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-163t8.sh` (cột `balloon_kb`) | 1 log sampler (n=33 mẫu hợp lệ) | Balloon n=33 pinned=0 min=4.948.524 max=5.882.284 (91,3% trần) mean=5.502.229; avail min=502 MB @15:54:13Z / max 1.837 MB — xem F-163-T8-3 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 15:52:26Z), 85m4 PASS (exit 0, 15:54:52Z), 86n2 PASS (exit 0, 15:58:58Z)** | N cộng dồn **N=25 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162/163 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline lúc bắt đầu đã lưu) | Không có snapshot timeout124 đợt này (đúng — không có kẹt) |

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

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi so với đợt 162 (đều là bản copy, không chạm script repo): nhãn log `LIVE-DIAG-161` → `LIVE-DIAG-163` (F-162-T8-5 ĐÓNG — đã sửa), lock `t8-round162` → `t8-round163`, deadline waiter 13:30Z 21/11 → **16:30Z 21/11**, nhãn `T8-162` → `T8-163` trong o8-driver + selfcheck-postboot, extract `WAIT1` đã sửa đúng boot hiện tại `1c1cf10c` (F-161-T8-6 ĐÓNG từ đợt 162 — extract chạy đúng, không còn tham chiếu boot cũ).
- Script trích số liệu `extract-163t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 1 log waiter đợt này: 53 poll NOT-YET + GATE-FOUND poll 54, 0 WAIT-DEADLINE, 0 REBOOT trong log waiter).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round163` 15:42:34Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 15:58:58Z).
- Kiểm cuối ~16:00Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown — 100 sau prune 38 của T6-163 + cooldown-t8-round163 15:58:58Z, đúng mẫu đợt 150–162); boot `1c1cf10c` ổn định (btime 1795271697 không đổi từ 14:34:57Z — 0 reboot trong phiên).
- `/tmp/.X11-unix/` lúc mở TRỐNG (reboot #65 đã xóa hết socket cũ); lúc kiểm cuối (sau O8 + harness) có **3 socket X193/X194/X195** — T8 đã dọn cả 3 lúc ~16:00Z sau khi xác minh **0 process Xvfb còn sống** (X193 mtime 14:59Z — của T4 attempt2; X194/X195 mtime 14:46Z — của luồng khác, không phải T8; xem F-163-T8-3). Socket của chính T8 (:199 harness, :188 O8-WebKit, :197 O8-Chromium) đã được driver tự unlink, không còn sót. Sau dọn: `/tmp/.X11-unix/` TRỐNG.
- Fixture /tmp CÒN NGUYÊN sau harness (md5 hevc `ba0c7c62`, i7 `f05daed8`, h `c0fe3d90`, g `e8ddaa2e` lúc kiểm cuối — khớp lúc rebuild, xem F-163-T8-1); không cần rebuild lần 2.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN CÙNG BOOT `1c1cf10c`** (như đợt 162). Cả lượt yên hợp lệ #28, O8 và harness đều trên đúng boot đo — phiên sạch, gate chậm vì T4 attempt1 trượt + T4 viết LIMITS lâu (xem F-163-T8-4).
2. **Chuỗi WebKit FULL PASS 17 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 18 (xem §A — lần này O8 vẫn PASS 3/3 qua gate chuẩn cùng-boot, và harness 0 kẹt, sạch hơn đợt 162).
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `1c1cf10c` theo POSTBOOT_PASS của T5. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo (xem F-163-T8-2).
4. **Harness 6/6 + 0 kẹt — kẹt cộng dồn GIỮ 14; chuỗi "P3 không kẹt" 0 → 1.** Đừng gộp verdict pha con với verdict pha, và đừng gộp các đợt.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=33, max 91,3% trần) — avail min 502 MB @15:54:13Z là CAO HƠN đợt 162 (362 MB); nhưng balloon ĐÃ GHIM TRẦN 6.443.824 kB lúc 15:39:21Z (trước O8, ngoài cửa sổ sampler) — chỉ là tương quan, H1/H2 đã bác bỏ nên không dùng làm bằng chứng nguyên nhân; giao T9 đối chiếu (chuỗi ghim trần phán bằng sampler T9).
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–163 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **85m4 P4-lần3 PASS lần thứ năm liên tiếp — H3 vẫn mở, chỉ giám sát thụ động** (quyết (i) đợt 158 + quyết (h) đợt 162 chưa đủ điều kiện mở điều tra; 0 kẹt mới đợt này, không có chữ ký mới để xét theo quyết (f) đợt 151).
8. **84l10 E4 `ended=false` lần thứ tư liên tiếp** (xem F-163-T8-5) — script verdict vẫn PASS; đừng trích ended=false thành FAIL.
9. **T8 ĐÓNG TRONG hạn cờ ~17:00Z (cờ viết ~16:04Z, dư ~56 phút)** — waiter thoát nhờ gate (15:34:48Z thay vì deadline 16:30Z) + harness sạch 16'15" + 0 reboot giữa phiên.
10. **0 reboot trong phiên** — boot `1c1cf10c` (btime 14:34:57Z) ổn định từ lúc mở tới lúc đóng; số hiệu #65 là ỨNG VIÊN — chờ T0 xác nhận (T0-163: 9 nguồn khớp, KHÔNG nghịch lý đồng hồ). Mù cho boot mới giao T2-163 (theo quyết (s) đợt 158, #62 đã xác nhận ở đợt 161; #63/#64 chưa — #65 thêm vào hàng chờ).

## 8. Sai số mới (F-163-T8-N)

- **F-163-T8-1 — FIXTURE h-30s/g-4s MD5 LỆCH KHỎI KỲ VỌNG ĐỢT 125 (CHỈ 2/4 KHỚP):** rebuild LẦN 1 lúc 14:40Z bằng đúng script đợt 162 (diff chỉ khác tên file): hevc `ba0c7c62` ✓, i7 `f05daed8` ✓ — khớp đợt 125; h-30s `c0fe3d90` ✗ (kỳ vọng `fbaa3d1a`), g-4s `e8ddaa2e` ✗ (kỳ vọng `a1fb8549`). Tạo lại h-30s riêng ra `/tmp/test-h.mp4` cho cùng md5 `c0fe3d90` — rebuild XÁC ĐỊNH trên boot này, ffmpeg 8.1.2 như ghi trong script. Không rõ nguyên nhân lệch (có thể libx264/threading khác boot trước — không suy đoán; file đợt 162 đã mất theo reboot #65 nên không đối chiếu trực tiếp được). Ảnh hưởng: KHÔNG — m4/n2 là copy byte-identical của h-30s; ffprobe đúng codec/dimensions/duration (h264 320×180, 30 s / 4 s); **harness 6/6 PASS chứng minh clip dùng được về mặt chức năng**. Ghi nhận để T10 đối chiếu đợt 164: nếu md5 h/g vẫn `c0fe3d90`/`e8ddaa2e` thì đó là giá trị đứng trên boot mới, kỳ vọng đợt 125 hết hiệu lực cho h/g.
- **F-163-T8-2 — NHÃN "O8 WEBKIT CHẠY BẰNG SYSTEM LIBS" TRONG QUYẾT (g) ĐỢT 162 KHÔNG KHỚP BẰNG CHỨNG SCRIPT:** script O8 gốc `clicktest-87o8-mask-track-webkit.mjs` dòng 350–356 tự đặt `LD_LIBRARY_PATH` với DEBROOT (`/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu`, tiền lệ đợt 110 L8), và driver o8-driver-163t8.sh cũng đặt `LD_LIBRARY_PATH="$DEBROOT:..."` — O8 WebKit đợt này (và đợt 162, cùng script/driver) chạy bằng lib DEBROOT, KHÔNG phải system libs. T8-162 §A đã ghi đúng (DEBROOT); aggregate 162 §10.2/quyết (g) ghi "system libs" là SAI NHÃN (kết quả O8 21/21 ×3 vẫn đứng — chỉ nhãn lib sai). Harness (standard driver, không LD_LIBRARY_PATH) mới là bằng chứng WebKit chạy bằng system libs trên cùng boot đo. T8-163 ghi rõ để T10/parent sửa nhãn khi trích; không tự đổi quyết (g) đợt 162.
- **F-163-T8-3 — 3 SOCKET X11 MỒ CÔI ĐÃ DỌN (CÙNG 3 SỐ DISPLAY NHƯ ĐỢT 160/161/162 — LẦN THỨ TƯ LIÊN TIẾP):** lúc mở `/tmp/.X11-unix/` TRỐNG (reboot #65 xóa hết); lúc kiểm cuối sau harness có 3 socket X193 (mtime 14:59Z — của T4 attempt2), X194 + X195 (mtime 14:46Z — của luồng khác, T8 không dùng :194/:195 đợt này; T8 dùng :199 harness + :188 O8-WebKit + :197 O8-Chromium, cả 3 đã tự unlink). T8 xác minh **0 process Xvfb còn sống** (ps 2 lần) rồi `rm -f` cả 3 socket lúc ~16:00Z; sau dọn `/tmp/.X11-unix/` TRỐNG. Không kill process nào. Mẫu lặp lại 4 đợt liên tiếp cùng 3 số display (160/161/162/163) — T4 (và luồng khác) có vẻ dùng :193/:194/:195 cố định; ghi nhận để T10 đối chiếu. Không phải socket cũ sống qua reboot (mtime mới đợt 163).
- **F-163-T8-4 — GATE CHẬM (53 POLL, ~53 PHÚT — KHÁC HẲN ĐỢT 162: 24 POLL, ~24 PHÚT):** nguyên nhân là phía T4, không phải waiter: (1) T4 attempt1 TRƯỢT gate (tickCost median 62,0 ms > 60, 14:54:04–14:58:15Z) nên phải retry attempt2 (14:59:01–15:03:10Z, median 53,0 ms — ĐẠT); (2) T4 viết LIMITS + vá helper distinct-seq (quyết (t) đợt 162) tới 15:34Z mới đóng cờ — waiter chỉ thấy t4=1 ở poll 54 (15:34:48Z). Postboot có sớm (poll 3, 14:43:42Z — POSTBOOT_PASS #65 ghi 14:45:05Z, waiter thấy qua đường (a) từ poll 3? — xem chú thích dưới). Balloon lúc T8 mở: avail 1.428 MB, balloon 5.327.008 kB (82,7% trần) — gate A mở, không phải nguyên nhân chậm. Đừng trích "gate chậm" thành waiter chậm hay T4 yếu — nguyên nhân là attempt1 trượt + T4 làm thêm nhiệm vụ vá helper. *Chú thích: POSTBOOT_PASS ghi 14:45:05Z nhưng waiter poll 3 lúc 14:43:42Z đã thấy postboot=1 — có thể qua đường (b) gate0wait live của T4 (file `postboot-t4-163-gate0wait-*.log`); waiter không ghi rõ đường nào ở poll NOT-YET — T8 không phân biệt được, chỉ ghi nhận postboot=1 từ poll 3 và GATE-FOUND xác nhận đường (a) ở poll 54.*
- **F-163-T8-5 — WEBKIT 84l10 E4 `ended=false` LẦN THỨ TƯ LIÊN TIẾP (BẮT ĐẦU THÀNH XU HƯỚNG):** E4 PASS 15:44:00Z — tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=3,933, ended=false, errors=0. Đợt 160 E4 cũng ended=false (ct cuối=3,967); đợt 161 ended=false (ct cuối=3,9); đợt 162 ended=false (ct cuối=3,967 — GIỐNG HỆT đợt 163 về ct); đợt 159 ended=true (ct cuối=4). Chromium 84l10 đợt này cũng E4 ended=false (ct cuối=3,932 — gần hệt WebKit 3,933). Script verdict vẫn PASS (E4 không assert ended=true); đừng trích ended=false thành FAIL hay thành "E4 yếu đi" — chỉ ghi nhận khác biệt để T10 đối chiếu đợt 164; nếu đợt 164 cũng ended=false (lần thứ năm liên tiếp) thì cân nhắc ghi chú xu hướng (đợt 162 đã đặt ngưỡng này — nay đã đủ 4 lần, giao T10 xem có cần ghi chú xu hướng không).
- **F-163-T8-6 — NHÃN `LIVE-DIAG-161` SÓT ĐÃ SỬA (F-162-T8-5 ĐÓNG):** khi copy driver 162→163, sed thêm `s/LIVE-DIAG-161/LIVE-DIAG-163/g` (cả run-webkit + run-chromium) + sửa nhãn `T8-162` → `T8-163` trong o8-driver + selfcheck-postboot. Extract đếm `LIVE-DIAG-163` = 0 (đúng — 0 kẹt). F-162-T8-5 ĐÓNG.
- **F-163-T8-7 — RAM SAMPLER: n=33:** log `ram-163t8.log` có 35 dòng = 1 header + 33 mẫu + 1 dòng marker "CHROMIUM PHASE start"; balloon min 4.948.524 / max 5.882.284 (91,3% trần) / mean 5.502.229, pinned=0; avail min=502 MB @15:54:13Z (lúc Chromium 85m4 — load 1,55 lúc đó) / max 1.837 MB. Balloon-max @15:51:13Z (avail 959 MB, load 1,34). Không gộp với sampler đợt khác (khác boot, khác cửa sổ). **Lưu ý phạm vi:** sampler này CHỈ đo cửa sổ harness (15:42–15:58Z); balloon GHIM TRẦN 6.443.824 kB lúc 15:39:21Z (trước O8, avail 413 MB) NẰM NGOÀI cửa sổ sampler — giao T9 đối chiếu với sampler của họ (T9 đo cả phiên).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 17 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `1c1cf10c` (#65 ứng viên), qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #28 trong đợt (attempt2 20/20, B 5/5, tickCost 53,0 ms). Sạch như đợt 158/159/160/161/162 (parent đã quyết LÊN 13 rồi 14 rồi 15 rồi 16 rồi 17 theo quyết (g)). T8 không tự chốt (xem §A). **Caveat nhãn lib:** O8 WebKit chạy bằng lib DEBROOT (script tự đặt), không phải system libs — xem F-163-T8-2; T10/parent sửa nhãn khi trích.
2. **Chuỗi "P3 không kẹt" 0 → 1 — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (h) đợt 162).** 0 kẹt đợt này; kẹt cộng dồn GIỮ 14 (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1 + 157: 1 + 158: 2 + 162: 1). Nếu đợt 164 sạch thì chuỗi lên 2.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=25 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162/163 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #32 CÓ lượt hợp lệ #28 (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-163: attempt1 KHÔNG hợp lệ (tickCost median 62,0 ms > 60 — retry theo quyết (h) đợt 149 đã cứu lượt); attempt2 ĐẠT (20/20, B 5/5, tickCost median 53,0 ms; P3' cộng dồn mới 74/82 occ = 69/73 distinct-seq, P1 107/110, P2 101/101, P7 62/62 — xem LIMITS T4-163 để đối chiếu số tuyệt đối). Chuỗi lượt yên hợp lệ NỐI DÀI #27 → #28. 0 PAGE-WEDGED (lần thứ 7 liên tiếp). lag≥+5f (b) = 0 occ cả 2 attempt — SẠCH (khác đợt 162: 16 occ).
5. **Điểm mù live-diag (1b) với HB128 (F-158-T8-4) — vẫn là giới hạn đứng, CHƯA được kiểm chứng đợt này** (không có kẹt để thử thách; quyết (u) đợt 160 + quyết (z) đợt 161 + quyết (y) đợt 162 giữ nguyên CHƯA bổ sung kiểm "nội dung tươi"). Live-diag 0 kích hoạt đợt này (khác đợt 162: kích hoạt thật lần đầu 2/2) — chỉ vì không có kẹt, không phải cơ chế hỏng.
6. **85m4 P4-lần3 PASS lần thứ năm liên tiếp — KHÔNG tái kẹt; 86n2 P4-lần2 PASS (chuỗi verdict 13 → 14); 86n2 P5-entry PASS (điểm kẹt đợt 162 không tái diễn); 84l10 E4-setup KHÔNG tái kẹt** (xem §2). 85m4/86n2 CHƯA đủ điều kiện mở điều tra riêng theo quyết (i) đợt 158 (85m4); 0 kẹt mới đợt này nên không có chữ ký mới để xét theo quyết (f) đợt 151.
7. **RAM avail min 502 MB (cao hơn đợt 162: 362 MB) + balloon max 91,3% — chờ T9 đối chiếu** (F-163-T8-7); chuỗi ghim trần phán bằng sampler T9 (giao T10). **Balloon ghim trần 6.443.824 kB lúc 15:39:21Z (trước O8, ngoài cửa sổ sampler) — chỉ tương quan, không phải bằng chứng nguyên nhân.**
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-163 xác nhận số lần — lần thứ 17 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS cho boot `1c1cf10c` (#65 ứng viên) ĐÃ CÓ (14:45:05Z, replay-day-du, dpkg 1545); POSTBOOT_PASS #63 KHÔNG CÓ, không bù được (boot thứ 7 lọt); #64 ĐÃ CÓ (11:40:00Z).
9. **0 reboot trong phiên** — số hiệu #65 là ỨNG VIÊN, chờ T0 xác nhận (T0-163: 9 nguồn khớp, KHÔNG nghịch lý đồng hồ; reboot xảy ra SAU khi T10-162 đóng sổ 18'18" — claim T10-162 ĐỨNG; run 162 SUCCEEDED 14:18:06Z trước btime — không bị giết); mù cho boot mới giao T2-163 (theo quyết (s) đợt 158, #62 đã xác nhận ở đợt 161; #63/#64/#65 chưa).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 163 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159 + (h) đợt 160 + (h) đợt 161 + (h) đợt 162) — 0 KẸT MỚI, CHUỖI LÊN 1

## B1. Trạng thái giả thuyết sau đợt 163 (H3 vẫn mở — 0 kẹt mới)

| Giả thuyết | Trạng thái đợt 162 | Trạng thái đợt 163 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — 0 KẸT MỚI (không có chữ ký mới để xét; điểm kẹt đợt 162 (86n2 P5-entry) KHÔNG tái diễn)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — 0 kẹt đợt này, không có gì để kiểm lại)** |

- Đợt 163 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **0 kẹt trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt nào).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 502 MB trong cửa sổ harness — CAO HƠN đợt 162 (362 MB, 1 kẹt) nhưng THẤP HƠN đợt 161 (541 MB, 0 kẹt); balloon ghim trần 6.443.824 kB lúc 15:39:21Z (trước O8) nhưng O8 + harness đều PASS — balloon ghim không đi kèm kẹt đợt này. H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-164 đối chiếu tiếp. **Lưu ý riêng đợt này:** T4 attempt1 TRƯỢT gate ở tickCost 62,0 ms (RAM lúc đó 1.478–3.350 MB, không thấp) — tickCost cao không đi kèm RAM thấp; hai cửa sổ khác nhau, đừng gộp thành bằng chứng H1/H2.
- Lưu ý phân biệt chữ ký: 0 kẹt đợt này — không có PAGE-WEDGED của T4 (T4 0 PAGE-WEDGED lần thứ 7 liên tiếp) lẫn wedge H3 của T8. Đợt này T4 1 lượt hợp lệ (attempt2), T8 0 kẹt; đừng gộp hai việc thành một lỗi. 0 reboot trong phiên — không có sự kiện hạ tầng nào để nhầm thành kẹt.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 163

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–163) + đường ổn định `t8-diag-stall.sh` → 163 (CẢ HAI symlink cập nhật 14:39:57Z; kiểm cuối vẫn trỏ 163 — xem F-163-T8-6) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt ĐÚNG, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt thật để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–163) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — không có kẹt để thử thách điểm mù F-158-T8-4 với HB128/85m4** |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=33 mẫu hợp lệ) | Balloon n=33 pinned=0 min=4.948.524 max=5.882.284 (91,3% trần) mean=5.502.229; avail min=502 MB @15:54:13Z (lúc Chromium 85m4); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 15:52:26Z), 85m4 PASS (exit 0, 15:54:52Z), 86n2 PASS (exit 0, 15:58:58Z)** | N cộng dồn **N=25 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline lúc bắt đầu đã lưu) | Không có snapshot timeout124/live-diag đợt này (đúng — không có kẹt) |

## B3. Chữ ký kẹt — đợt 163: 0 KẸT (CẢ HAI ĐIỂM KẸT CŨ ĐỀU PASS)

- **86n2 P5-entry (runEngine:527) — điểm kẹt đợt 162 — PASS đợt này** (P5 PASS 15:49:15Z, không restart dư trong 40 s sau reset, seek kẹt dài nhất 0 mẫu). P1/P2/P3/P4-lần1/2/3 đều PASS trước đó. **Điểm kẹt mới đợt 162 KHÔNG tái diễn lần đầu tiên sau khi xuất hiện.**
- **86n2 P2-entry (runEngine:439) — điểm kẹt đợt 158 — PASS lần thứ năm liên tiếp** (P2 PASS 15:47:55Z, reset xong 718 ms, extraEvents=[]). P4-lần2 PASS 15:48:29Z (delta=+1, ct=2). **86n2 P4-lần2: chuỗi verdict 13 → 14.**
- **85m4 P4-lần3 (waitForPlaySync) — điểm kẹt đợt 158 — PASS lần thứ năm liên tiếp** (15:46:00Z, delta=+1, hạ-cánh-về-target=true, ct=2,228, errors=0). Không có WATCHDOG-137, không probe, không live-diag — evaluate trả đúng hạn cả 3 lần P4. **85m4 kẹt lần 2 (đợt 158) KHÔNG tái diễn lần thứ năm liên tiếp** → chưa đủ điều kiện mở điều tra riêng (quyết (i) đợt 158).
- **84l10 E4-setup — điểm kẹt đợt 157 — KHÔNG tái kẹt đợt thứ sáu liên tiếp** (E4 PASS ended=true đợt 158 + 159, ended=false đợt 160 + 161 + 162 + 163 — xem F-163-T8-5; W1-lần1/2/3 PASS + W2 PASS cả sáu đợt).
- **Đối chiếu với kẹt đợt 162 (86n2 P5-entry):** cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), KHÁC boot đo trong đợt này (`1c1cf10c`; kẹt đợt 162 trên boot `d9a8d1ce` #64) và KHÁC kết quả (PASS thay vì kẹt). Không kết luận boot gây/không gây kẹt — chỉ ghi nhận khác biệt để T10 đối chiếu.
- **Không có điểm pha nào "nóng" khác đợt này:** cả 3 pha Chromium + 3 pha WebKit đều PASS đủ P1–P6/W1/W2/E4 (trừ ghi chú WebKit 84l10 E4 `ended=false` + Chromium 84l10 E4 `ended=false` — như các đợt trước, chỉ là khác biệt; tất cả không phải FAIL).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 163: 0 KẸT, CHUỖI LÊN 1

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 143: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 144: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 145: 6 lần chạy, 0 kẹt (chuỗi 4). Đợt 146: 6 lần chạy, 0 kẹt (chuỗi 5). Đợt 147: 6 lần chạy, 0 kẹt (chuỗi 6). Đợt 148: 6 lần chạy, 1 KẸT (86n2 WebKit P4-lần2) — chuỗi về 0. Đợt 149: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 150: 6 lần chạy, 2 KẸT (85m4 P1 + 86n2 P5) — chuỗi về 0. Đợt 151: 6 lần chạy, 2 KẸT (85m4 P1 + P5) — chuỗi về 0. Đợt 152: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 153: 6 lần chạy, 1 KẸT (85m4 P1-phaseA) — chuỗi về 0. Đợt 154: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 155: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 156: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 157: 6 lần chạy, 1 KẸT (84l10 E4-setup) — chuỗi về 0. Đợt 158: 6 lần chạy, 2 KẸT (85m4 P4-lần3 + 86n2 P2-entry) — chuỗi VẪN 0. Đợt 159: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS + 86n2 P2-entry PASS) — chuỗi 0 → 1. Đợt 160: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ hai liên tiếp + 86n2 P2-entry PASS lần thứ hai liên tiếp) — chuỗi 1 → 2. Đợt 161: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ ba liên tiếp + 86n2 P2-entry PASS lần thứ ba liên tiếp) — chuỗi 2 → 3. Đợt 162: 6 lần chạy, 1 KẸT (86n2 WebKit P5-entry, runEngine:527 — điểm kẹt mới, cùng chữ ký wedge H3) — chuỗi 3 → 0. **Đợt 163: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ năm liên tiếp + 86n2 P2-entry PASS lần thứ năm liên tiếp + 86n2 P5-entry PASS, điểm kẹt đợt 162 không tái diễn) — chuỗi 0 → 1.** Kẹt cộng dồn: **GIỮ 14**.
- Nếu đợt 164 sạch (0 kẹt trong 6 lần chạy) thì chuỗi lên 2.
