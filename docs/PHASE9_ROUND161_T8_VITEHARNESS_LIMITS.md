# Đợt 161 T8 — O8 PASS 3/3 QUA GATE CHUẨN CÙNG-BOOT #62 + HARNESS 6/6 SẠCH, 0 KẸT, 0 REBOOT GIỮA PHIÊN

Ngày: 21/11/2026 (lượt cron 15:35 +07 21/11 = 08:35:51Z 21/11; T8 mở ~08:37Z, đóng ~10:21Z — TRONG hạn cờ ~11:00Z, hạn cứng ~11:30Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy QUA GATE CHUẨN CÙNG-BOOT (GATE-FOUND poll 83 lúc 09:59:59Z: cờ T4 + POSTBOOT_PASS đường (a) của T5 cho boot `39d46ba0`; lượt yên #30 CÓ lượt hợp lệ #26 trên ĐÚNG boot đo); (2) harness đứng — MỘT lần chạy driver duy nhất, **6/6 PASS, 0 kẹt**, 0 reboot giữa phiên; (3) watchdog 0 kích hoạt (đúng — không có kẹt để bắt), 0 false-positive; live-diag 0 kích hoạt (không có kẹt để thử thách — điểm mù F-158-T8-4 KHÔNG được kiểm chứng đợt này, vẫn là giới hạn đứng theo quyết (u) đợt 160); (4) H3: VẪN MỞ, chỉ giám sát thụ động (quyết (h) đợt 160 — GIỮ NGUYÊN; 85m4 KHÔNG tái kẹt lần thứ ba liên tiếp nên CHƯA đủ điều kiện mở điều tra); (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau, md5 khác nhau, bản copy dự phòng khớp md5; (6) **0 REBOOT trong phiên** — boot `39d46ba0` ổn định từ lúc mở tới lúc đóng (btime 1795247969 = 07:59:29Z không đổi); (7) deadline waiter dùng đúng NGÀY UTC lượt mở (21/11), kiểm `date -d` ra epoch TRƯỚC khi khởi động waiter — waiter thoát nhờ GATE-FOUND 09:59:59Z, không chờ tới deadline 10:30Z 21/11.
Nợ: docs/PHASE9_ROUND160_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 qua gate chuẩn cùng-boot #61; harness attempt 1 6/6 + 0 kẹt; kẹt cộng dồn 13; chuỗi "P3 không kẹt" 1 → 2; chuỗi WebKit FULL PASS LÊN 15 theo quyết (g) đợt 160).

## 0. Kết luận ngắn — O8 PASS 3/3 (GATE CHUẨN, CÙNG BOOT #62), HARNESS 6/6 SẠCH (1 ATTEMPT, CÙNG BOOT)

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (10:01:51–10:04:23Z, 2'32", boot `39d46ba0` = #62 ứng viên, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 10:02:04Z + 10:02:53Z, Playwright mouse click lần 2; Chromium: 10:03:52Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: GATE CHUẨN CÙNG-BOOT — KHÔNG cần thủ tục (i).** Waiter T8: 82 poll GATE-NOT-YET rồi **GATE-FOUND poll=83 lúc 09:59:59Z** (t4=OK + postboot đường (a) `round161-t5/POSTBOOT_PASS`, t4attempt=no-lock). T4-161: lượt yên #30 **CÓ lượt hợp lệ #26** — attempt2 09:47:01–09:50:52Z, probe 20/20, lớp B 5/5, tickCost median 44,0 ms ≤ 60, trên boot `39d46ba0`; cờ T4 viết 09:59Z. **O8 chạy 10:01:51Z trên ĐÚNG boot đo** (cách lượt yên hợp lệ ~11 phút, cùng boot, gate chuẩn) — sạch như đợt 158/159/160. **Chuỗi WebKit FULL PASS: 15 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).**
- **Harness (MỘT lần chạy driver duy nhất, boot `39d46ba0`): 6/6 PASS, 0 kẹt** (10:04:37–10:20:08Z, 15'31"): WebKit 84l10/85m4/86n2 PASS + Chromium 84l10/85m4/86n2 PASS. Cả 6 report JSON đã kiểm độc lập bằng python (6× `ok=true`). **85m4 KHÔNG tái kẹt** — P4-lần3 (điểm kẹt đợt 158) PASS lần thứ ba liên tiếp; **86n2 P4-lần2 CÓ verdict: PASS** (chuỗi 11 → 12); 84l10 E4-setup KHÔNG tái kẹt (E4 PASS, ended=false — xem F-161-T8-2). **Kẹt cộng dồn: GIỮ 13. Chuỗi "P3 không kẹt": 2 → 3.**
- **85m4 KHÔNG đủ điều kiện mở điều tra H3** (quyết (i) đợt 158: kẹt lần 2 ở đợt 158 — khác pha — tái diễn lần 3 thì mở; đợt này PASS sạch lần thứ ba liên tiếp). **H3 VẪN MỞ, chỉ giám sát thụ động.**
- **Watchdog: 0 kích hoạt — ĐÚNG (không có kẹt để bắt), 0 false-positive.** Live-diag: 0 kích hoạt — không có kẹt để thử thách; điểm mù F-158-T8-4 (HB128 làm tươi mtime) **không được kiểm chứng đợt này** (85m4 không kẹt; các dòng HB128 trong P5 đều mang giá trị TƯƠI, playhead tăng 29,567 → 30 — không phải snapshot đóng băng).
- **RAM avail min 541 MB @10:08:37Z (lúc WebKit 86n2)** — cao hơn đợt 160 (468 MB); balloon max 91,4% trần, 0 mẫu ghim trần trong sampler (n=32).
- **T8 ĐÓNG ~10:21Z — TRONG hạn cờ ~11:00Z, còn dư ~40 phút** (waiter thoát nhờ gate 09:59:59Z thay vì deadline 10:30Z + harness sạch 15'31" + 0 reboot giữa phiên).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 07:59:29 21/11 | REBOOT #62 ứng viên (boot `39d46ba0`) — boot lúc T8 mở; số hiệu CHỜ T0 xác nhận |
| ~08:37 | T8 mở: đọc LIMITS T8-160 + aggregate 160 §11 mục 5 + 13, §12.1 (h); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 160 (không đổi); fixture /tmp MẤT theo reboot #62 (RAM avail lúc mở T8 không đo trực tiếp; T4 poll #10 lúc 08:45:16Z ghi 1.560 MB) |
| 08:37:29 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round161-t8/diag-stall-161t8.sh`, readlink + test -x + test -e xác nhận** |
| 08:37:50 | **Rebuild fixture /tmp LẦN 1 (quy tắc (l)): md5 khớp đợt 125** (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549) |
| 08:37:55 | **Kiểm deadline waiter bằng `date -d` ra epoch TRƯỚC khi khởi động waiter: `2026-11-21 10:30:00 UTC` = epoch 1795257000, cách lúc kiểm 6.725 s (~112 phút) — hạn cờ ~11:00Z trừ 30 phút (cùng mẫu đợt 160)** |
| 08:37:55 | Waiter T8 bắt đầu trên boot `39d46ba0` (deadline 10:30Z 21/11 — ĐÃ KIỂM epoch); poll 1: t4=0 postboot=0 |
| 08:59:30 | T5 POSTBOOT_PASS cho boot `39d46ba0` (#62: dpkg 795 dòng, early-repair vì replay tự nhiên vắng mặt) — waiter postboot=1 từ poll 23 |
| 09:43:13–09:47:01 | **T4 attempt1: probe 20/20, tickCost median 41,0 ms — NHƯNG LỚP B VI PHẠM (B5: RAM min 437 MB, 12/100 mẫu <500 MB) — attempt KHÔNG hợp lệ, KHÔNG cộng dồn** (xem F-161-T8-1) |
| 09:47:01–09:50:52 | **T4 attempt2: probe 20/20, lớp B 5/5, tickCost median 44,0 ms — LƯỢT YÊN HỢP LỆ #26 (lượt yên #30 CÓ lượt hợp lệ)**; 0 PAGE-WEDGED |
| 09:59 | Cờ T4 `round161-t4.done` xuất hiện (1.620 B, có nội dung) |
| 09:59:59 | **GATE-FOUND poll=83 — waiter TỰ THOÁT (không chờ tới deadline 10:30Z)**; t4=OK, postboot đường (a), t4attempt=no-lock |
| 10:01:51–10:04:23 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — QUA GATE CHUẨN, TRÊN ĐÚNG BOOT ĐO (#62) |
| 10:04:23 | O8 DONE; lock `t8-round161` nhả; vite sau release curl 5560/5554 = 000000 |
| 10:04:37–10:20:08 | **Harness (MỘT lần chạy driver duy nhất, boot `39d46ba0`): 6/6 PASS, 0 kẹt** (xem §2) — 0 reboot giữa phiên |
| ~10:20 | **Dọn 3 socket X11 mồ côi X193/X194/X195** (0 process Xvfb còn sống — xem §6/F-161-T8-3); kiểm cuối: boot `39d46ba0` ổn định (btime 1795247969 không đổi); 0 process sót; lock TRỐNG; cả hai symlink diag VẪN trỏ 161; fixture /tmp còn nguyên |
| ~10:21 | Cờ `round161-t8.done` (TRONG hạn cờ ~11:00Z, dư ~40 phút); LIMITS + stage file hoàn thiện sau đó |

## A. O8 — PASS 3/3 trên boot `39d46ba0` (#62 ứng viên), QUA GATE CHUẨN CÙNG-BOOT (LƯỢT YÊN HỢP LỆ #26)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 10:01:51–10:02:42 | 0 | **21/21 PASS** — S1 PASS 10:02:04Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 10:02:42–10:03:31 | 0 | **21/21 PASS** — S1 PASS 10:02:53Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 10:03:31–10:04:23 | 0 | **21/21 PASS** — S1 PASS, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-21T10-01-52-39d46ba0-pid53182.json` 21 kết quả `ok=true` 21/21, md5 `de0fab90`; attempt2 `o8w-clicktest-report-2026-11-21T10-02-43-39d46ba0-pid53577.json` 21/21 `ok=true`, md5 `01578e91` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-21T10-03-31-39d46ba0-pid53905.json` 21/21 `ok=true`, md5 `fb9763f0`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `39d46ba0` theo POSTBOOT_PASS của T5 lúc 08:59:30Z). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (như đợt 160).
- Driver O8 giữ 1 lock vite `t8-round161` suốt lượt (nhả 10:04:23Z; vite sau release curl 5560/5554 = 000000 — như đợt 158/159/160).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-161t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 15 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `39d46ba0`, qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #26 trong đợt). Sạch như đợt 158/159/160 (parent quyết LÊN 13 rồi LÊN 14 rồi LÊN 15 theo quyết (g)). T8 vẫn KHÔNG tự chốt, T10/parent phán cuối.
- **O8 đợt này 2'32" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28", 152: 2'51", 153: 2'53", 154: 3'02", 155: 2'56", 156: 2'38", 157: 2'57", 158: 2'32", 159: 2'35", 160: 2'38") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: 6/6 PASS, 0 KẸT, 0 REBOOT

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 10:04:40–10:05:50 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS, E4 PASS ended=false ct cuối=3,9 — **KHÔNG tái kẹt E4-setup đợt 157** (xem F-161-T8-2) |
| 2 | WebKit 85m4 | 0 | 10:06:06–10:08:16 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart, seek kẹt 0 mẫu — **P4-lần3 (điểm kẹt đợt 158) PASS lần thứ ba liên tiếp — KHÔNG tái kẹt** |
| 3 | WebKit 86n2 | 0 | 10:08:31–10:12:31 | **PASS** — P1/P2/P3 PASS (P2-entry — điểm kẹt đợt 158 — PASS, reset xong 700 ms), P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart, P6 KHÔNG-KẸT 90 s — **P4-lần2 CÓ verdict: PASS (chuỗi 11 → 12)** |
| 4 | Chromium 84l10 | 0 | 10:12:47–10:13:47 | **PASS** — KHÔNG FAIL (report JSON ok=true, finishedAt 10:13:45.108Z) |
| 5 | Chromium 85m4 | 0 | 10:14:02–10:16:02 | **PASS** — KHÔNG FAIL (report JSON ok=true, finishedAt 10:16:00.524Z) |
| 6 | Chromium 86n2 | 0 | 10:16:18–10:20:08 | **PASS** — KHÔNG FAIL (report JSON ok=true, finishedAt 10:19:59.033Z) |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (WebKit 84l10 finishedAt 10:05:46.760Z; WebKit 85m4 10:08:13.672Z; WebKit 86n2 10:12:23.837Z; Chromium 84l10 10:13:45.108Z; Chromium 85m4 10:16:00.524Z; Chromium 86n2 10:19:59.033Z).
- Môi trường: system libs trên boot `39d46ba0` (POSTBOOT_PASS T5 08:59:30Z: lib đầy đủ, early-repair). **WebKit launch THÀNH CÔNG 3/3 pha bằng system libs** trên ĐÚNG boot đo. Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; 0 kẹt — không có gì để đối chứng thêm).
- **Harness DÀI 15'31"** (10:04:37–10:20:08Z) — bằng đúng đợt 160 (15'31" với 0 kẹt; 159 attempt 2: 16'13" với 0 kẹt; 158: 39'23" với 2 kẹt; 157: 30'35" với 1 kẹt; 156: 15'41" với 0 kẹt). Tổng phiên trễ hơn đợt 160 vì waiter chờ balloon xả (~2h22m) — xem F-161-T8-1.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG — KHÔNG CÓ KẸT), LIVE-DIAG 0/0 (KHÔNG ĐƯỢC THỬ THÁCH)

- **Watchdog (i): 0 kích hoạt — ĐÚNG.** Không có lần chạy nào evaluate im lặng >60 s (6/6 PASS, thời gian mỗi pha đều trong khung bình thường). 0 false-positive đợt thứ năm liên tiếp watchdog không kích hoạt oan (157: 1 kích hoạt đúng; 158: 2 kích hoạt đúng; 159: 0 kích hoạt — đúng vì 0 kẹt; 160: 0 kích hoạt — đúng vì 0 kẹt; 161: 0 kích hoạt — đúng vì 0 kẹt).
- **Driver (1b) live-diag: 0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH.** Không lần chạy nào log im lặng >120 s (`live_diags=0` cả 6 lần). Điểm mù F-158-T8-4 (HB128 làm tươi mtime) **không được kiểm chứng đợt này**: 85m4 không kẹt, các dòng HB128 trong P5 đều mang giá trị TƯƠI (playhead tăng 29,567 → 30, ct tăng theo, seeking=false) — không phải snapshot đóng băng. Điểm mù vẫn là giới hạn đứng theo quyết (u) đợt 160; T8-161 KHÔNG tự bổ sung kiểm "nội dung tươi" (quyết (u) đã chốt CHƯA bổ sung).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–160 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–161) + đường ổn định `t8-diag-stall.sh` → 161 (CẢ HAI symlink cập nhật 08:37Z, TRƯỚC mọi lần chạy — xem F-161-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT KHI KHÔNG CÓ KẸT.** 0 snapshot stall |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–161) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH (không có kẹt; điểm mù F-158-T8-4 vẫn đứng)** |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-161t8.sh` (cột `balloon_kb`) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=4.976.708 max=5.890.320 (91,4% trần) mean=5.453.991; avail min=541 MB @10:08:37Z (lúc WebKit 86n2) / max 1.753 MB — xem F-161-T8-4 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 10:13:47Z), 85m4 PASS (exit 0, 10:16:02Z), 86n2 PASS (exit 0, 10:20:08Z)** | N cộng dồn **N=23 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
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

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi so với đợt 160 (đều là bản copy, không chạm script repo): nhãn log `LIVE-DIAG-160` → `LIVE-DIAG-161`, lock `t8-round160` → `t8-round161`, deadline waiter 07:30Z 21/11 → **10:30Z 21/11**, nhãn `T8-160` → `T8-161` trong o8-driver + selfcheck-postboot — 0 nhãn sai đợt còn sót (grep `160` trong script = 0, xem F-161-T8-6).
- Script trích số liệu `extract-161t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 1 log waiter đợt này: 82 poll NOT-YET + GATE-FOUND poll 83, 0 WAIT-DEADLINE, 0 REBOOT trong log waiter).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round161` 10:04:23Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 10:20:08Z).
- Kiểm cuối ~10:20Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown); boot `39d46ba0` ổn định (btime 1795247969 không đổi từ 07:59:29Z — 0 reboot trong phiên).
- `/tmp/.X11-unix/` lúc mở TRỐNG (reboot #62 đã xóa hết socket cũ); lúc kiểm cuối (sau O8 + harness) có **3 socket X193/X194/X195** — T8 đã dọn cả 3 lúc ~10:20Z sau khi xác minh **0 process Xvfb còn sống** (X193 mtime 09:47Z — của T4 attempt1; X194/X195 mtime 08:45Z — của luồng khác, không phải T8; xem F-161-T8-3). Socket của chính T8 (:199 harness, :188 O8-WebKit, :197 O8-Chromium) đã được driver tự unlink, không còn sót. Sau dọn: `/tmp/.X11-unix/` TRỐNG.
- Fixture /tmp CÒN NGUYÊN sau harness (md5 h `fbaa3d1a` lúc kiểm cuối); không cần rebuild lần 2.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN CÙNG BOOT `39d46ba0`** (như đợt 160). Cả lượt yên hợp lệ #26, O8 và harness đều trên đúng boot đo — phiên sạch sau khi balloon xả.
2. **Chuỗi WebKit FULL PASS 15 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 16 (xem F-160-T8-5 mẫu đợt trước).
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `39d46ba0` theo POSTBOOT_PASS của T5. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo.
4. **WebKit 84l10 E4 `ended=false` (xem F-161-T8-2) + T4 attempt1 KHÔNG hợp lệ vì lớp B (RAM min 437 MB, xem F-161-T8-1)** — cả hai đều là khác biệt/điều kiện, không phải FAIL (script verdict KHÔNG FAIL pha nào; attempt1 không được cộng dồn theo luật T4). Đừng gộp các đợt.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=32, max 91,4% trần) — avail min 541 MB @10:08:37Z là CAO hơn đợt 160 (468 MB). Chuỗi ghim trần phán bằng sampler T9 (giao T10). **Nhưng balloon ĐÃ GHIM TRẦN trong cửa sổ chờ gate** (xem F-161-T8-1) — đừng trích sampler harness làm bằng chứng "cả phiên không ghim".
6. **86n2 P4-lần2 CÓ verdict đợt này: PASS — chuỗi 11 → 12.** Đợt 160 chuỗi lên 11; đợt này lên 12.
7. **85m4 KHÔNG tái kẹt lần thứ ba liên tiếp** — P4-lần3 PASS đợt 159 + 160 + 161. Theo quyết (i) đợt 158, CHƯA đủ điều kiện mở điều tra riêng cho 85m4/86n2. H3 VẪN MỞ, chỉ giám sát thụ động.
8. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–160 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
9. **T8 ĐÓNG TRONG hạn cờ ~11:00Z (cờ viết ~10:21Z, dư ~40 phút)** — waiter thoát nhờ gate (09:59:59Z thay vì deadline 10:30Z) + harness sạch (15'31") + 0 reboot giữa phiên. Tổng phiên trễ hơn đợt 160 vì waiter chờ balloon xả ~2h22m (xem F-161-T8-1).
10. **0 reboot trong phiên** — boot `39d46ba0` (btime 07:59:29Z) ổn định từ lúc mở tới lúc đóng; số hiệu #62 là ỨNG VIÊN — chờ T0 xác nhận. Mù cho boot mới giao T2-161; POSTBOOT_PASS #62 ĐÃ CÓ qua đường T5 (08:59:30Z, early-repair, dpkg 795).

## 8. Sai số mới (F-161-T8-N)

- **F-161-T8-1 — GATE CHỜ 82 POLL (~2h22m) VÌ BALLOON GHIM TRẦN, RAM THẤP — T4 ATTEMPT1 KHÔNG HỢP LỆ VÌ LỚP B:** waiter T8 poll 1–22 (08:37:55–08:58:56Z): t4=0 postboot=0; poll 23 (08:59:56Z): postboot=1 (POSTBOOT_PASS #62 08:59:30Z) nhưng t4 vẫn 0; poll 24–82: t4=0 postboot=1. Nguyên nhân T4 không mở cửa: balloon ghim ĐÚNG trần 6.443.824 kB suốt cửa sổ chờ (T8 đo trực tiếp nhiều lần 09:08–09:42Z: balloon = 6.443.824 kB, RAM avail 414–539 MB), dưới cổng gateA ≥1024 MB của T4 (T4 ghi 37/89 poll RAM<500 MB). Balloon chỉ xả thật lúc ~09:43Z (5.395.248 kB, RAM 1.230 MB) — T4 mở cửa poll #87, attempt1 09:43:13–09:47:01Z probe 20/20 tickCost median 41,0 ms NHƯNG lớp B vi phạm (B5: RAM min 437 MB, 12/100 mẫu <500 MB) nên KHÔNG hợp lệ, KHÔNG cộng dồn; attempt2 09:47:01–09:50:52Z mới hợp lệ (20/20, B 5/5, tickCost 44,0 ms). Các dip balloon nông giữa chừng (09:12Z: 6.235.956 kB / 96,8%; 09:27Z: 6.028.256 kB / 93,6%) KHÔNG mở được cổng RAM ≥1024 MB — cùng mẫu dip nông của đợt 160 (T9/T10 phán 1 episode). Đừng trích "gate chậm" thành lỗi waiter hay lỗi T4 — waiter đúng, T4 đúng luật; nguyên nhân là balloon host. Số liệu balloon cửa sổ chờ do T8 đo trực tiếp (không phải sampler T9 — giao T9-161 đếm episode chính thức).
- **F-161-T8-2 — WEBKIT 84l10 E4 `ended=false` LẦN THỨ HAI LIÊN TIẾP (KHÁC ĐỢT 159 `ended=true`, CHỈ LÀ KHÁC BIỆT):** E4 PASS 10:05:45Z — tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=3,9, ended=false, errors=0. Đợt 160 WebKit E4 cũng ended=false (ct cuối=3,967); đợt 159 ended=true ct cuối=4. Script verdict vẫn PASS (E4 không assert ended=true); đừng trích ended=false thành FAIL hay thành "E4 yếu đi" — chỉ ghi nhận khác biệt để T10 đối chiếu các đợt sau. Hai đợt liên tiếp ended=false (sau 2 đợt ended=true 158/159) — chưa đủ để kết luận xu hướng.
- **F-161-T8-3 — 3 SOCKET X11 MỒ CÔI ĐÃ DỌN (F-160-T10-4 ĐÓNG):** lúc mở `/tmp/.X11-unix/` TRỐNG (reboot #62 xóa hết); lúc kiểm cuối sau harness có 3 socket X193 (mtime 09:47Z — của T4 attempt1), X194 + X195 (mtime 08:45Z — của luồng khác, T8 không dùng :194/:195 đợt này; T8 dùng :199 harness + :188 O8-WebKit + :197 O8-Chromium, cả 3 đã tự unlink). T8 xác minh **0 process Xvfb còn sống** (ps 2 lần) rồi `rm -f` cả 3 socket lúc ~10:20Z; sau dọn `/tmp/.X11-unix/` TRỐNG. Không kill process nào. F-160-T10-4 (3 socket sót X193/X194/X195 sau Xvfb chết) ĐÓNG — cùng 3 số display nhưng là socket mới của đợt 161 (mtime khác đợt 160), không phải socket cũ sống qua reboot.
- **F-161-T8-4 — RAM SAMPLER: n=32:** log `ram-161t8.log` có 34 dòng = 1 header + 32 mẫu + 1 dòng marker "CHROMIUM PHASE start"; balloon min 4.976.708 / max 5.890.320 (91,4% trần) / mean 5.453.991, pinned=0; avail min=541 MB @10:08:37Z (lúc WebKit 86n2 — load 1,95 lúc đó) / max 1.753 MB. Balloon-max @10:12:37Z (avail 926 MB, load 0,38). Không gộp với sampler đợt khác (khác boot, khác cửa sổ). **Lưu ý phạm vi:** sampler này CHỈ đo cửa sổ harness (10:04–10:20Z); balloon ghim trần cửa sổ chờ gate (08:37–09:43Z) do T8 đo trực tiếp, không nằm trong sampler — xem F-161-T8-1.
- **F-161-T8-5 — CHECKLIST (o) ĐÃ LÀM ĐÚNG CẢ HAI SYMLINK — GIỮ QUA CẢ PHIÊN, 0 REBOOT:** lúc T8 mở (~08:37Z) cả hai symlink vẫn trỏ về `round160-t8/diag-stall-160t8.sh` (stale 1 đợt). T8 cập nhật CẢ HAI về `round161-t8/diag-stall-161t8.sh` lúc 08:37:29Z (trước mọi lần chạy), `readlink` + `test -x` + `test -e` xác nhận cả hai; kiểm cuối ~10:20Z cả hai VẪN trỏ 161 (symlink nằm trên đĩa bền). Không có snapshot stall nào đợt này nên đường diag không được thử thách thực tế — nhưng đường đã đúng cả hai mối suốt phiên. Về đề xuất T0-154 (sửa hằng `DIAG137_SCRIPT` trong 3 script harness về 1 mối duy nhất): T8-161 VẪN QUYẾT ĐỊNH KHÔNG SỬA trong phiên này — phiên đã chạy xong sạch, sửa hằng giữa/cuối phiên không còn lợi ích trong đợt này; giao T0-162 cân nhắc sửa khi phiên ổn định (không có kẹt/reboot giữa phiên) + kiểm thử đầy đủ. **Nợ đóng:** F-160-T10-4 (socket X11 sót) đã dọn xong và xác nhận đúng đợt này (xem F-161-T8-3).
- **F-161-T8-6 — EXTRACT SCRIPT CÒN 1 THAM CHIẾU BOOT CŨ (VÔ HẠI, KHÔNG ẢNH HƯỞNG SỐ LIỆU):** `extract-161t8.py` dòng `WAIT1` vẫn trỏ log waiter `wait-t4-t5-boot5353ed19.log` (boot của một đợt cũ — sót từ bản gốc, không phải do sed 160→161). Biến này chỉ dùng khi có reboot giữa phiên để đọc log waiter lần 1; đợt này 0 reboot nên không đọc tới; phần trích waiter chính dùng glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` nên vẫn đọc đủ 1 log waiter đợt này (82 poll NOT-YET + GATE-FOUND poll 83). Ghi nhận để T8-162 sửa dòng WAIT1 khi copy (cùng họ F-160-T8-3 — nhãn sót đã sửa xong trước khi chạy; lần này chỉ còn 1 tham chiếu boot cũ vô hại trong script trích, không trong driver chạy).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 15 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `39d46ba0` (#62 ứng viên), qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #26 trong đợt (attempt2 20/20, B 5/5, tickCost 44,0 ms). Sạch như đợt 158/159/160 (parent đã quyết LÊN 13 rồi LÊN 14 rồi LÊN 15 theo quyết (g)). T8 không tự chốt (xem F-160-T8-5 mẫu đợt trước).
2. **Chuỗi "P3 không kẹt" 2 → 3 — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (h) đợt 160).** 0 kẹt đợt này trong 6 lần chạy (một lần chạy driver duy nhất, 0 reboot giữa phiên); kẹt cộng dồn GIỮ 13 (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1 + 157: 1 + 158: 2). Nếu đợt 162 sạch thì chuỗi lên 4.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=23 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #30 CÓ lượt hợp lệ #26 (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-161: attempt1 KHÔNG hợp lệ (lớp B vi phạm — RAM min 437 MB); attempt2 20/20, B 5/5, tickCost median 44,0 ms; P3' cộng dồn mới 64/72 occ = 63/66 distinct-seq (xem LIMITS T4-161 để đối chiếu số tuyệt đối). Chuỗi lượt yên hợp lệ NỐI DÀI #25 → #26. 0 PAGE-WEDGED.
5. **Điểm mù live-diag (1b) với HB128 (F-158-T8-4) — vẫn là giới hạn đứng, CHƯA được kiểm chứng đợt này** (không có kẹt 85m4 để thử thách; quyết (u) đợt 160 giữ nguyên CHƯA bổ sung kiểm "nội dung tươi").
6. **85m4 KHÔNG tái kẹt lần thứ ba liên tiếp (P4-lần3 PASS đợt 159 + 160 + 161); 86n2 P4-lần2 PASS (chuỗi 11 → 12); 84l10 E4-setup KHÔNG tái kẹt** (xem §2). 85m4/86n2 CHƯA đủ điều kiện mở điều tra riêng theo quyết (i) đợt 158.
7. **RAM avail min 541 MB (cao hơn đợt 160: 468 MB) + balloon max 91,4% — chờ T9 đối chiếu** (F-161-T8-4); chuỗi ghim trần phán bằng sampler T9 (giao T10). **Balloon ghim trần cửa sổ chờ gate (F-161-T8-1) — giao T9-161 đếm episode chính thức.**
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-161 xác nhận số lần — lần thứ 15 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS cho boot `39d46ba0` (#62 ứng viên) ĐÃ CÓ qua đường T5 (08:59:30Z, early-repair, dpkg 795); POSTBOOT_PASS #61 ĐÃ CÓ (giao T5-161 xác nhận — xem LIMITS T5-161).
9. **0 reboot trong phiên** — số hiệu #62 là ỨNG VIÊN, chờ T0 xác nhận; mù cho boot mới giao T2-161 (theo quyết (s) đợt 158, #59/#60/#61 đã xác nhận ở đợt 159/160; #62 chưa).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 161 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159 + (h) đợt 160) — 0 KẸT, CHUỖI LÊN 3

## B1. Trạng thái giả thuyết sau đợt 161 (H3 vẫn mở — 0 kẹt mới, không có chữ ký mới)

| Giả thuyết | Trạng thái đợt 160 | Trạng thái đợt 161 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — 0 KẸT MỚI ĐỢT NÀY (không có dữ kiện mới ủng hộ hay bác bỏ; 85m4/86n2 đều PASS tại đúng điểm kẹt đợt 158, lần thứ ba liên tiếp)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — không có kẹt mới để kiểm lại)** |

- Đợt 161 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **0 kẹt thật trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt nào).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 541 MB trong cửa sổ harness — CAO hơn đợt 160 (468 MB, 0 kẹt) và cao hơn nhiều đợt 158 (168 MB, 2 kẹt); H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-162 đối chiếu tiếp. **Lưu ý riêng đợt này:** balloon ghim trần đã CHẶN cửa yên T4 suốt ~2h (RAM avail 414–539 MB, attempt1 T4 vi phạm lớp B) — nhưng khi balloon xả, harness chạy sạch 6/6 ở RAM avail ≥541 MB. Tương quan "RAM thấp ↔ không mở được cửa yên" là về cổng đo của T4, không phải về kẹt harness — đừng gộp thành bằng chứng H1/H2.
- Lưu ý phân biệt chữ ký: T4 attempt1 KHÔNG HỢP LỆ (lớp B vi phạm vì RAM thấp) — không phải PAGE-WEDGED; attempt2 HỢP LỆ. Đợt này T4 1 lượt hợp lệ (attempt2), T8 0 kẹt; đừng gộp hai việc thành một lỗi. 0 reboot trong phiên — không có sự kiện hạ tầng nào để nhầm thành kẹt.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 161

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–161) + đường ổn định `t8-diag-stall.sh` → 161 (CẢ HAI symlink cập nhật 08:37Z; kiểm cuối vẫn trỏ 161 — xem F-161-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–161) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH (không có kẹt; điểm mù F-158-T8-4 vẫn đứng)** |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=4.976.708 max=5.890.320 (91,4% trần) mean=5.453.991; avail min=541 MB @10:08:37Z (lúc WebKit 86n2); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 10:13:47Z), 85m4 PASS (exit 0, 10:16:02Z), 86n2 PASS (exit 0, 10:20:08Z)** | N cộng dồn **N=23 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline lúc bắt đầu đã lưu) | Không có snapshot timeout124/live-diag nào đợt này (đúng — không có kẹt) |

## B3. Chữ ký kẹt — đợt 161: 0 KẸT (CÁC ĐIỂM KẸT ĐỢT 158 ĐỀU PASS LẦN THỨ BA LIÊN TIẾP)

- **85m4 P4-lần3 (waitForPlaySync) — điểm kẹt đợt 158 — PASS lần thứ ba liên tiếp** (10:07:29–10:07:31Z, element đồng bộ sau 1,3 s, playhead=1,033, ct=1,1, delta=+1, hạ-cánh-về-target=true, errors=0). Không có WATCHDOG-137, không probe, không live-diag — evaluate trả đúng hạn cả 3 lần P4. **85m4 kẹt lần 2 (đợt 158) KHÔNG tái diễn lần thứ ba liên tiếp** → chưa đủ điều kiện mở điều tra riêng (quyết (i) đợt 158).
- **86n2 P2-entry (runEngine:439) — điểm kẹt đợt 158 — PASS lần thứ ba liên tiếp** (P2 PASS 10:09:22Z, reset xong 700 ms, extraEvents=[]). P4-lần2 (không verdict đợt 158) PASS 10:09:53–10:09:55Z (delta=+1, ct=2,367). **86n2 P4-lần2: chuỗi 11 → 12.**
- **84l10 E4-setup — điểm kẹt đợt 157 — KHÔNG tái kẹt đợt thứ tư liên tiếp** (E4 PASS ended=true đợt 158 + 159, ended=false đợt 160 + 161 — xem F-161-T8-2; W1-lần1/2/3 PASS + W2 PASS cả bốn đợt).
- **Đối chiếu với kẹt đợt 158 (85m4 P4-lần3 + 86n2 P2-entry):** cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), CÙNG boot đo trong đợt này (`39d46ba0`; kẹt đợt 158 trên boot `28366bd0` #58). Không kết luận boot gây/không gây kẹt — chỉ ghi nhận khác biệt để T10 đối chiếu.
- **Không có điểm pha nào "nóng" đợt này:** cả 3 pha WebKit + cả 3 pha Chromium đều PASS đủ P1–P6/W1/W2/E4 (trừ ghi chú WebKit 84l10 E4 `ended=false` + Chromium 84l10 W1-lần1 delta=+2 (artifact test đã biết — bắn lặp do ghi đè ended còn bật) và E4 `ended=false` — như các đợt trước, chỉ là khác biệt; tất cả không phải FAIL).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 161: 0 KẸT, CHUỖI LÊN 3

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 143: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 144: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 145: 6 lần chạy, 0 kẹt (chuỗi 4). Đợt 146: 6 lần chạy, 0 kẹt (chuỗi 5). Đợt 147: 6 lần chạy, 0 kẹt (chuỗi 6). Đợt 148: 6 lần chạy, 1 KẸT (86n2 WebKit P4-lần2) — chuỗi về 0. Đợt 149: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 150: 6 lần chạy, 2 KẸT (85m4 P1 + 86n2 P5) — chuỗi về 0. Đợt 151: 6 lần chạy, 2 KẸT (85m4 P1 + P5) — chuỗi về 0. Đợt 152: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 153: 6 lần chạy, 1 KẸT (85m4 P1-phaseA) — chuỗi về 0. Đợt 154: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 155: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 156: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 157: 6 lần chạy, 1 KẸT (84l10 E4-setup) — chuỗi về 0. Đợt 158: 6 lần chạy, 2 KẸT (85m4 P4-lần3 + 86n2 P2-entry) — chuỗi VẪN 0. Đợt 159: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS + 86n2 P2-entry PASS) — chuỗi 0 → 1. Đợt 160: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ hai liên tiếp + 86n2 P2-entry PASS lần thứ hai liên tiếp) — chuỗi 1 → 2. **Đợt 161: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ ba liên tiếp + 86n2 P2-entry PASS lần thứ ba liên tiếp) — chuỗi 2 → 3.** Kẹt cộng dồn: **GIỮ 13**.
- Nếu đợt 162 sạch (0 kẹt trong 6 lần chạy) thì chuỗi lên 4.
