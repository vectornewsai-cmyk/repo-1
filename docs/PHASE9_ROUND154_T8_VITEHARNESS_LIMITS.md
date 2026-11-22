# Đợt 154 T8 — O8 PASS 3/3 SAU WAITER HẾT HẠN (THỦ TỤC (i), KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO) + HARNESS 6/6 PASS, 0 KẸT — CHUỖI "P3 KHÔNG KẸT" 0 → 1 (BẮT ĐẦU LẠI)

Ngày: 20/11/2026 (lượt cron 18:35 +07 = 11:35:51Z; T8 mở ~11:37Z, đóng ~13:5xZ). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU WAITER HẾT HẠN 13:30:32Z theo THỦ TỤC (i), KHÔNG có lượt yên hợp lệ nào của T4 trong đợt 154 (T4 0 attempt — xem §0/§1); (2) harness đứng — 1 lần chạy driver, 6/6 PASS, 0 KẸT (WebKit 84l10/85m4/86n2 + Chromium 3/3); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, 0 kích hoạt, 0 false-positive (không có kẹt để bắt); (4) H3: CHỈ GIÁM SÁT THỤ ĐỘNG (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 — GIỮ NGUYÊN); 0 kẹt đợt này nên không có chữ ký mới để đối chiếu; (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON của T0-152 còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau.
Nợ: docs/PHASE9_ROUND153_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 sau lượt yên hợp lệ #21, theo thủ tục (i) sau waiter hết hạn; harness 5/6, 1 KẸT THẬT 85m4 P1-phaseA; chuỗi FULL PASS 10 → 11; chuỗi "P3 không kẹt" 1 → 0 (ĐỨT)); aggregate đợt 153 §12.3 parent (a)–(p) (quyết (j) O8 chuỗi 10 → 11 XÁC NHẬN có caveat gate; quyết (k) H3 chỉ giám sát thụ động; quyết (l) T8 đóng cờ muộn chỉ ghi nhận; quyết (o) checklist (o) cập nhật CẢ HAI symlink diag).

## 0. Kết luận ngắn — O8 PASS 3/3 (KHÔNG QUA LƯỢT YÊN), HARNESS 6/6 (0 KẸT), REBOOT ỨNG VIÊN #49 GIỮA PHIÊN

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (13:31:33–13:34:35Z, 3'02", boot `12fc68a3` = reboot ứng viên #49, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 13:31:53Z + 13:32:54Z, Playwright mouse click lần 2; Chromium: CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO — CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN.** T4-154: lượt yên #23 KHÔNG CÓ lượt hợp lệ — **0 attempt trong 147 poll thật trên 2 boot** (cờ `round154-t4.done` viết 13:35Z, 1.298 B: "HET HAN CHO 13:30Z 20/11 — 0 attempt"). Chuỗi lượt hợp lệ DỪNG Ở #21; P3' cộng dồn không đổi 39/41 occurrence = 39/40 distinct-seq. Waiter T8 hết hạn poll 24 lúc 13:30:32Z — GATE NOT MET (t4=0, postboot=1); T4 0 attempt live (no-lock, 0 process) → đủ điều kiện thủ tục (i) đợt 143: chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot #49 lúc 13:31:06Z — ĐẦY ĐỦ** (GST 269 file thật, dpkg 1545, cache 178, lists 37, lib đủ 6/6) + gate0wait mới nhất của T4 (postboot-t4-154-gate0wait-29.log) "KET LUAN: DU DIEU KIEN chay WebKit (boot 13:05:12)". **Nhãn trích: "O8 + harness sau waiter hết hạn 13:30Z, KHÔNG có lượt yên hợp lệ nào trong đợt 154 (T4 0 attempt), theo thủ tục (i)" — KHÔNG ghi "sau lượt yên hợp lệ" và KHÔNG ghi "qua gate chuẩn (i)".**
- **Chuỗi WebKit FULL PASS: 11 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).** O8 WebKit 21/21 ×2 đợt này trên boot `12fc68a3`, nhưng KHÔNG sau lượt yên hợp lệ nào (khác đợt 153: O8 sau lượt yên hợp lệ #21). Tiền lệ đợt 150 (chuỗi lên dù gate không qua) không bao phủ trường hợp "0 lượt yên" — parent phán xem chuỗi có tính không.
- **Harness: 6/6 PASS TRONG MỘT LẦN CHẠY DRIVER DUY NHẤT, 0 KẸT** (13:34:48–13:51:00Z, boot `12fc68a3`, system libs sau replay tự nhiên nhanh): WebKit 84l10 PASS (13:34:52–13:36:12Z) + 85m4 PASS (13:36:27–13:38:48Z) + 86n2 PASS (13:39:03–13:43:03Z) + Chromium 84l10 PASS (13:43:19–13:44:29Z) + 85m4 PASS (13:44:44–13:46:54Z) + 86n2 PASS (13:47:10–13:51:00Z). Cả 6 report JSON đã kiểm độc lập bằng python (6× `ok=true`). **Chuỗi "P3 không kẹt": 0 → 1 (BẮT ĐẦU LẠI).**
- **REBOOT ỨNG VIÊN #49 GIỮA PHIÊN (13:05:12Z)** — boot `2c0a7985` (#48, btime 11:26:05Z) → `12fc68a3`, giết waiter T8 (lần 1) giữa poll 88 + poller T4 sau poll #117 + replay-watch T5; runtime restart đồng thời giết các exec session của T8. T8 khởi động lại waiter (lần 2) 13:07:30Z trên boot mới, deadline giữ 13:30Z. Reboot mới TRƯỚC phiên: #48 (btime 11:26:05Z, TRƯỚC lượt cron 9'46") — xem F-154-T8-1/F-154-T8-2.
- **Watchdog: 0 kích hoạt, 0 live-diag, 0 false-positive** — không có kẹt để bắt (đợt 153: 1 kích hoạt đúng + live-diag ×2). Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN.
- **Balloon trong cửa sổ harness T8: 0 mẫu ghim trần** (n=33, max 5.922.588 kB = 91,9% trần); **avail min 564 MB lúc 13:42:49Z** (trong lúc chạy 86n2 WebKit). Balloon GHIM TRẦN lúc mở phiên trên boot #48 (6.443.824 kB) — xem F-154-T8-3; chuỗi ghim phán bằng sampler T9 (giao T10).
- **T8 ĐÓNG ~13:5xZ — TRONG hạn cờ ~14:00Z** (dù reboot #49 + waiter hết hạn 13:30Z + 0 lượt yên).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 11:26:05 | REBOOT #48 (T4 xác nhận số — boot `2c0a7985`, btime 1795173965) — TRƯỚC phiên (lượt cron 11:35:51Z) |
| ~11:37 | T8 mở: RAM avail ~1.111 MB lúc mở, balloon 5.733.620 kB (89,0% trần); đọc LIMITS T8-153 + aggregate 153 §12.3 (j)(k)(l)(o); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 153 (không đổi) |
| 11:37 | **CHECKLIST (o): dựng thư mục `round154-t8`, copy script 153→154, cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh (trước: → round152) VÀ repo apps/web/scripts/t8-diag-stall.sh (trước: → round153) đều → `round154-t8/diag-stall-154t8.sh`, readlink + test -x xác nhận (xem F-154-T8-5)** |
| 11:38 | Boot #48: REPLAY VẮNG lúc mở (không có thư mục GST, cache 0–5 .deb, lists 2–5, dpkg 2 dòng) — mẫu lần thứ 5 liên tiếp replay vắng lúc mở (150, 151-boot-mới, 152, 153-boot-#45, 154-boot-#48) |
| 11:38:20 | Waiter T8 (lần 1) bắt đầu (deadline 13:30Z); poll 1: t4=0 postboot=0 |
| 11:58:26 | T5 viết POSTBOOT_PASS đầu tiên cho boot mới kể từ #43 (repair-sớm, dpkg 795, cache 110, lists 66) — waiter lần 1 postboot=1 từ poll ~23 (12:00:21Z) |
| 12:00–13:05 | T4 poller 117 poll trên boot #48: gate A RAM ≥1024 MB KHÔNG BAO GIỜ mở (RAM sập <1024 từ poll #26, 73/117 poll <500 MB, chuỗi dài nhất 27 poll; balloon ghim trần 6.443.824 kB); 0 attempt |
| 13:05:12 | **REBOOT ỨNG VIÊN #49** — boot `2c0a7985` → `12fc68a3`, btime 1795179912; giết waiter T8 (lần 1) giữa poll 88 (13:05:24Z) + poller T4 sau poll #117 (13:05:32Z) + replay-watch T5; runtime restart giết exec session T8 (recovery notice) |
| 13:07:30 | Waiter T8 (lần 2) khởi động lại trên boot mới (deadline 13:30Z; log lần 1 đã sao lưu sang `wait-t4-t5-boot2c0a7985.log` trước khi script truncate); T4 khởi động lại poller 13:07:39Z |
| 13:10–13:11 | Replay boot #49 xong NHANH TỰ NHIÊN (dpkg 1545 dòng lúc ~13:11Z, boot+~6 phút; GST 269 file thật); gate0wait mới của T4 "DU DIEU KIEN chay WebKit" — waiter lần 2 postboot=1 (đường (b)) từ poll 5 |
| 13:07–13:30 | T4 poller lần 2: 30 poll, 0 cửa mở (load5 không bao giờ <2, min 2,01; RAM avail rơi lại <1024 sau 13:12Z, balloon ghim trần lại); 0 attempt |
| 13:30:32 | **Waiter (lần 2) HẾT HẠN poll 24 — GATE NOT MET** (t4=0, postboot=1; T4 0 attempt — no-lock, 0 process) → áp thủ tục (i): chạy sau hết hạn kèm ghi rõ |
| 13:31:06 | **T8 tự kiểm postboot boot #49: ĐẦY ĐỦ** (GST 269, dpkg 1545, cache 178, lists 37, lib đủ 6/6) — xem F-154-T8-3 |
| 13:31:33–13:34:35 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — SAU waiter hết hạn, KHÔNG có lượt yên hợp lệ nào |
| 13:34:48–13:51:00 | **Harness lần 1 (duy nhất), WebKit + Chromium qua system libs: 6/6 PASS, 0 KẸT** (xem §2) |
| 13:35 | T4 viết cờ `round154-t4.done` (1.298 B): lượt yên #23 KHÔNG CÓ lượt hợp lệ — 0 attempt trong 147 poll trên 2 boot |
| ~13:52–13:5x | Kiểm cuối + LIMITS + stage file + cờ `round154-t8.done` (trong hạn cờ ~14:00Z) |

## A. O8 — PASS 3/3 trên boot `12fc68a3`, SAU WAITER HẾT HẠN (THỦ TỤC (i), KHÔNG CÓ LƯỢT YÊN HỢP LỆ)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 13:31:33–13:32:40 | 0 | **21/21 PASS** — S1 PASS 13:31:53Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 13:32:40–13:33:37 | 0 | **21/21 PASS** — S1 PASS 13:32:54Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 13:33:37–13:34:35 | 0 | **21/21 PASS** — S1 PASS, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-20T13-31-35-12fc68a3-pid13016.json` 21 kết quả `ok=true` 21/21, md5 `234996ed`; attempt2 `o8w-clicktest-report-2026-11-20T13-32-41-12fc68a3-pid13484.json` 21/21 `ok=true`, md5 `f9f21198` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-20T13-33-38-12fc68a3-pid13930.json` 21/21 `ok=true`, md5 `5db202d0`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng khối `run`, cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `12fc68a3` sau replay). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
- Driver O8 giữ 1 lock vite `t8-round154` suốt lượt (nhả 13:34:35Z; vite sau release curl 5560/5554 = 000000 — vite đã tắt, đúng).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-154t8.mjs`, `node --check` OK — bản copy từ 153, chưa dùng) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 11 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `12fc68a3`, sau waiter hết hạn 13:30Z, KHÔNG có lượt yên hợp lệ nào). Khác đợt 153 (sau lượt yên hợp lệ #21) và khác tiền lệ đợt 150 (gate không qua nhưng CÓ lượt yên). T8 KHÔNG tự chốt chuỗi lên 12.
- **O8 đợt này 3'02" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28", 152: 2'51", 153: 2'53") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — 1 lần chạy driver duy nhất, 6/6 PASS, 0 KẸT (WebKit + Chromium qua system libs)

### Lần 1 (duy nhất) — boot `12fc68a3`, 13:34:48–13:51:00Z, system libs sau replay tự nhiên nhanh

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 13:34:52–13:36:12 | **PASS** — report `ok=true` (W1 3/3 delta +1 sạch 0→1/1→2/2→3, W2 PASS, E4 PASS) |
| 2 | WebKit 85m4-hb128 | 0 | 13:36:27–13:38:48 | **PASS** — report `ok=true` (P1/P2/P3 PASS, HB128 chảy suốt; P4 3/3 PASS, đồng bộ 1,9/1,8/1,8 s; P5 PASS 40 s 0 restart) |
| 3 | WebKit 86n2 | 0 | 13:39:03–13:43:03 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 2,0/1,3/2,0 s; P5 PASS 40 s 0 restart) |
| 4 | Chromium 84l10 | 0 | 13:43:19–13:44:29 | **PASS** — report `ok=true` (W1 3/3 delta +1 nhưng trôi đếm +1 giữa các lần: 0→1/2→3/4→5 — xem F-154-T8-6; W2 PASS, E4 PASS) |
| 5 | Chromium 85m4 | 0 | 13:44:44–13:46:54 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 0,5/1,0/1,0 s; P5 "CÓ-RESTART (+2)" do ended-at-duration — KHÔNG FAIL, xem F-154-T8-4) |
| 6 | Chromium 86n2 | 0 | 13:47:10–13:51:00 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 0,5/1,0/1,0 s; P5 PASS 40 s 0 restart) |

- 6 report JSON kiểm độc lập bằng python, `finishedAt` khớp cửa sổ chạy từng pha: WebKit 13:36:10Z (`ok=true`) / 13:38:43Z (`ok=true`) / 13:43:01Z (`ok=true`); Chromium 13:44:22Z / 13:46:47Z / 13:50:56Z (cả ba `ok=true`).
- Môi trường lần 1: system libs sau replay tự nhiên NHANH trên boot #49 (dpkg 1545 dòng lúc ~13:11Z, boot+~6 phút; GST thư mục thật 269 file; cache 178 .deb; lists 37). **WebKit launch THÀNH CÔNG cả 3 pha bằng system libs** — không cần lần chạy DEBROOT thứ hai (khác đợt 149/151).
- Fixture REBUILD sau gate (13:31Z, sau khi /tmp mất theo reboot #49): 6/6 md5 khớp đợt 125 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- **85m4 HẾT KẸT (đợt 153 kẹt thật P1-phaseA, nay PASS đủ P1–P5); chuỗi "P3 không kẹt" 0 → 1 (BẮT ĐẦU LẠI).** 86n2 P4-lần2 PASS lần thứ 6 liên tiếp tính theo lần chạy có verdict (nối tiếp lần thứ 5 ở đợt 153; T10 đối chiếu chuỗi đầy đủ).
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn đã đủ 6/6) — ghi rõ để T10 không tìm log lần 2.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT, 0 LIVE-DIAG, 0 FALSE-POSITIVE

- **Watchdog (i): 0 kích hoạt — ĐÚNG (không có kẹt để bắt).** 0 dòng `WATCHDOG-137` trong cả 6 log harness + 3 log O8; 0 snapshot `smoke/stall-*` (thư mục smoke không có thư mục stall nào).
- **Driver (1b) live-diag: 0 kích hoạt.** `live_diags=0` cả 6 lần chạy harness (5 lần PASS không có khoảng im lặng >120 s; 85m4 WebKit HB128 chảy suốt P1–P5).
- **0 false-positive cả lượt.** 6 lần chạy harness + 3 lần chạy O8: 0 dòng `WATCHDOG-137`, 0 live-diag. Watchdog chỉ kích hoạt khi có kẹt thật (đợt 153: 1 kích hoạt đúng).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–153 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–154) + đường ổn định `t8-diag-stall.sh` → 154 (CẢ HAI symlink cập nhật 11:37Z, TRƯỚC mọi lần chạy — xem F-154-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT OAN.** 0 snapshot stall (không có kẹt để chẩn đoán); 2 snapshot live-diag đợt 153 không tái diễn |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–154) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không lần chạy nào im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-154t8.sh` (cột `balloon_kb`) | 1 log sampler (n=33 mẫu hợp lệ) | Balloon n=33 pinned=0 min=4.553.232 max=5.922.588 (91,9% trần) mean=5.257.372; avail min=564 MB lúc 13:42:49Z (trong lúc chạy 86n2 WebKit) — xem F-154-T8-3 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 13:44:29Z), 85m4 PASS (exit 0, 13:46:54Z), 86n2 PASS (exit 0, 13:51:00Z)** | N cộng dồn **N=16 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** | Baseline: dmesg EPERM tái xác nhận (cả 4 snapshot baseline); journalctl -k "-- No entries --" / rỗng — như các đợt trước |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không (bản sửa T0-152 F-151-T10-2 còn nguyên) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không (như trên) |

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi nhỏ so với đợt 153: nhãn log `LIVE-DIAG-153` → `LIVE-DIAG-154`, deadline waiter 10:30Z → 13:30Z (khớp hạn cờ đợt 154), lock `t8-round153` → `t8-round154` — chỉ chuỗi/hằng số trong bản copy, không chạm script repo. Script trích số liệu `extract-154t8.py`: sửa 1 hằng WAIT1 trỏ nhầm log waiter lần 1 đợt 153 (`wait-t4-t5-boot401fca75.log` → `wait-t4-t5-boot2c0a7985.log`) trước khi chạy — xem F-154-T8-7; các bản copy driver Chromium-only + debroot giữ nguyên mẫu 153 (đổi nhãn 153→154), KHÔNG dùng đợt này.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round154` 13:34:35Z; driver harness đã nhả lock sau mỗi lần chạy (xem summary: released từng pha, exit 0 ×6).
- Kiểm cuối ~13:52Z (bằng script trích số liệu): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: 0; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown — 100 lúc 13:06Z sau reboot + 1 cooldown T8, đúng mẫu đợt 150/151/152/153); boot `12fc68a3` ổn định (btime 1795179912 không đổi từ 13:05:12Z).
- `/tmp/.X11-unix/` trống 0 file lúc kiểm cuối (Xvfb :199 của T8 đã dọn socket của mình; :188 O8-WebKit + :197 O8-Chromium cũng đã dọn).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Gate đợt này KHÔNG PHẢI gate chuẩn (i) — và KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO** (xem §0/§1/F-154-T8-3): T4 0 attempt trong 147 poll trên 2 boot (gate A RAM ≥1024 MB không mở trên boot #48; load5 không <2 trên boot #49) + waiter hết hạn 13:30:32Z + T8 tự kiểm postboot boot #49 đầy đủ lúc 13:31:06Z. Đừng trích "sau lượt yên hợp lệ" hay "qua gate chuẩn (i)" cho đợt này. **Chuỗi WebKit FULL PASS 11 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 12.
2. **Harness đợt này LÀ 6/6 trong MỘT lần chạy driver duy nhất** (13:34:48–13:51:00Z, 1 boot #49, system libs) — 0 kẹt, 0 watchdog, 0 live-diag. Trích đúng: "harness 6/6 PASS, 0 kẹt".
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `12fc68a3` sau replay. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
4. **Chromium 85m4 P5 "CÓ-RESTART (+2)" KHÔNG phải FAIL** (xem F-154-T8-4): 2 event `ended-at-duration` (video tới cuối tự nhiên ct=30, paused) — report JSON `ok=true`, driver "KẾT QUẢ: KHÔNG FAIL". Đừng trích thành "Chromium 85m4 có restart dư" — đây là ended tự nhiên, khác restart dư sau reset.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness T8** (0 mẫu ghim, n=33, max 91,9% trần) — nhưng sampler T8 chỉ phủ cửa sổ harness; balloon ĐÃ ghim trần trên boot #48 (lúc mở phiên 11:38Z và suốt 12:31–13:05Z) và avail min 564 MB rơi vào lúc chạy 86n2; chuỗi ghim trần phán bằng sampler T9 (giao T10).
6. **RAM avail min 564 MB lúc 13:42:49Z (trong lúc chạy 86n2 WebKit)** — thấp hơn 677 MB đợt 152, cao hơn 306 MB đợt 153 và kỷ lục thấp 250.840 kB đợt 151 theo sampler T9; chờ T9 đối chiếu bằng sampler toàn đợt trước khi kết luận gì về RAM phiên.
7. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–154 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn. O8 webkit/headed sau sửa T0: kiểm kích thước lúc push.
8. **Chromium 84l10 W1: trôi đếm +1 giữa các lần** (lần1 0→1, lần2 2→3, lần3 4→5 — xem F-154-T8-6): artifact test đã biết cùng họ với trôi +2 các đợt 146–153, không phải FAIL (W1 vẫn PASS delta +1 mỗi lần; W2/E4 PASS). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3).
9. **T8 ĐÓNG TRONG hạn cờ ~14:00Z** (dù reboot #49 + waiter hết hạn 13:30Z + 0 lượt yên) — khác đợt 153 đóng muộn ~9 phút. Hạn cứng 14:30Z không bị đe dọa.

## 8. Sai số mới (F-154-T8-N)

- **F-154-T8-1 — REBOOT ỨNG VIÊN #49 GIỮA PHIÊN (chờ T2-154 xác nhận số):** btime /proc/stat 13:05:12Z (epoch 1795179912); boot `2c0a7985` (#48, btime 11:26:05Z) → `12fc68a3-10f4-4459-908f-b0a47615afae`; boot cũ sống 2.327 s (11:26:05Z → 13:05:12Z, stat→stat — boot ngắn nhất kể từ #44: 7.901 s là #45; #46 sống 5.531 s). Reboot giết waiter T8 (lần 1) giữa poll 88 (13:05:24Z) + poller T4 sau poll #117 (13:05:32Z) + replay-watch T5 (log cuối 13:05Z); runtime restart đồng thời giết các exec session của T8 (recovery notice — 2 session không có kết quả cuối xác nhận: waiter lần 1 `proc_ee8549af1693` + lệnh kiểm `proc_021797f4b794`; T8 phục hồi bằng log trên đĩa, không chạy lại mù). **Nghịch lý đồng hồ:** boot cũ viết poll T4 #117 lúc 13:05:32Z, MUỘN HƠN btime boot mới 13:05:12Z tới 20 s (≥ +20 s) — cùng họ #45 (≥ +50'26") / #46 (≥ +5 s) / #44 (≥ +10 s); migration overlap (cell mới boot song song, không phải reboot tại chỗ). T8 khởi động lại waiter (lần 2) 13:07:30Z trên boot mới (log lần 1 sao lưu trước khi truncate — mẫu đợt 153). Mù #80? (nếu #49 đúng số) giao T2-154 theo mẫu T10-148; T8 không tự chốt giây reboot.
- **F-154-T8-2 — REBOOT #48 TRƯỚC PHIÊN (T4 xác nhận số) + REPLAY: VẮNG LÚC MỞ TRÊN #48, TỚI NHANH TỰ NHIÊN TRÊN #49:** btime 11:26:05Z (epoch 1795173965); boot `cd7dcd88` (#47, btime 11:06:40Z) → `2c0a7985`; boot cũ sống 1.165 s. Lúc T8 mở (11:38Z, boot+~12 phút): không có thư mục GST, cache 0–5 .deb, lists 2–5, dpkg 2 dòng — replay VẮNG, mẫu lần thứ 5 liên tiếp vắng lúc mở (150, 151-boot-mới, 152, 153-boot-#45, 154-boot-#48). Nhưng replay TỚI TỰ NHIÊN trên boot #48 (T5 repair-sớm: dpkg 2 → 795, POSTBOOT_PASS 11:58:26Z — cờ T5 đầu tiên cho boot mới kể từ #43) và TỚI NHANH TỰ NHIÊN trên boot #49 (dpkg 40 → 1545 lúc ~13:11Z, boot+~6 phút; GST thư mục thật 269 file). **Kết luận: replay không chết hẳn — lúc vắng lúc tới, không đoán trước được; T5 theo dõi tiếp đợt 155.**
- **F-154-T8-3 — GATE KHÔNG ĐẠT, CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN 13:30:32Z — KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO:** waiter lần 1 (boot #48, 88 poll): t4=0 suốt, postboot=0 tới poll ~22 rồi =1 từ poll ~23 (đường (a), POSTBOOT_PASS của T5 11:58:26Z) — chết theo reboot #49. Waiter lần 2 (boot #49, 23 poll + dòng hết hạn poll 24): **t4=0 SUỐT, postboot=1 từ poll 5** (đường (b), gate0wait mới của T4 "DU DIEU KIEN chay WebKit" — mtime <900 s, btime khớp boot mới). T4 0 attempt live lúc hết hạn (no-lock, 0 process; poller T4 hết hạn cắt 13:30Z, exit 5) → đủ điều kiện thủ tục (i) đợt 143: chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot #49 lúc 13:31:06Z — ĐẦY ĐỦ:** GST 269 file THẬT (không phải symlink), dpkg 1545 dòng (hoạt động cuối 13:11:06Z `gstreamer1.0-tools installed`), cache 178 .deb, lists 37, lib đủ (grep libgstreamer/libevent/libEGL/libavif/libdw/libevdev = 6/6). O8 bắt đầu 13:31:33Z, harness bắt đầu 13:34:48Z — CẢ HAI SAU WAITER HẾT HẠN 13:30:32Z. **Lần đầu tiên T8 chạy mà KHÔNG CÓ lượt yên hợp lệ nào trong đợt** (đợt 150/153 đều có lượt yên hợp lệ trước khi chạy theo thủ tục (i)). Nợ T4/T5-155: cửa yên không mở được cả đợt vì RAM + load — xem §9.6.
- **F-154-T8-4 — CHROMIUM 85m4 P5 "CÓ-RESTART (+2)" DO ended-at-duration (KHÔNG PHẢI FAIL, KHÔNG PHẢI RESTART DƯ):** 13:46:46.560Z, 2 event `causeTag=ended-at-duration` (dtResetMs 30084 + 30226; ct=30, dur=30, seeking=false, paused=true, ticksEndedTrue 1→2, endedFlippedThisTick true rồi false) — video tới cuối tự nhiên ở 30 s và `ended` lật 2 tick liên tiếp, harness đếm +2. Report JSON `ok=true` (finishedAt 13:46:47.456Z), driver "KẾT QUẢ: KHÔNG FAIL". WebKit 85m4 cùng pha P5 PASS 0 restart (seek kẹt dài nhất 1 mẫu ~0,2 s); Chromium 86n2 P5 PASS 0 restart. Đây là lần đầu P5 Chromium ghi "CÓ-RESTART" mà verdict vẫn PASS — ghi nhận để T10 không đọc thành FAIL hay thành "Chromium có restart dư".
- **F-154-T8-5 — CHECKLIST (o) ĐÃ LÀM ĐÚNG CẢ HAI SYMLINK — ĐÓNG NỢ ĐỢT 153 §11.11:** lúc T8 mở (~11:37Z) `hidden_files/t8-diag-stall.sh` vẫn trỏ về `round152-t8/diag-stall-152t8.sh` (tạo 05:39Z đợt 152 — stale 2 đợt) và repo `apps/web/scripts/t8-diag-stall.sh` trỏ về `round153-t8/diag-stall-153t8.sh` (stale 1 đợt). T8 cập nhật CẢ HAI về `round154-t8/diag-stall-154t8.sh` lúc 11:37Z (trước mọi lần chạy), `readlink` + `test -x` xác nhận cả hai; kiểm cuối ~13:52Z cả hai VẪN trỏ 154 (giữ qua reboot #49 — symlink nằm trên home persistent, không mất theo reboot). Không có snapshot watchdog nào ghi nhầm thư mục đợt này (0 kẹt → 0 snapshot; đường diag đã đúng cả hai mối). **Nợ đóng:** F-153-T8-5/F-153-T8-7 đã sửa xong; T0-155 vẫn cân nhắc sửa hằng `DIAG137_SCRIPT` trong 3 script harness về 1 mối duy nhất (đề xuất cũ, chưa làm).
- **F-154-T8-6 — CHROMIUM 84l10 W1 TRÔI ĐẾM +1 GIỮA CÁC LẦN (ARTIFACT ĐÃ BIẾT, KHÔNG PHẢI FAIL):** lần1 0→1, lần2 2→3, lần3 4→5 — đếm `restartEndedVideo` tăng +1 ngoài delta giữa các lần (1→2, 3→4), cùng họ trôi +2 các đợt 146–153 (đợt 153: lần1 +2). W1 vẫn PASS delta +1 mỗi lần; W2 PASS; E4 PASS (restartEndedVideo tại cuối 6 → sau 3 s 6, `ended=false` — khác WebKit `ended=true`, như các đợt trước). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3, không trôi). Ghi nhận để T10 không đọc trôi đếm thành FAIL.
- **F-154-T8-7 — SCRIPT TRÍCH SỐ LIỆU `extract-154t8.py` TRỎ NHẦM LOG WAITER LẦN 1 (ĐÃ SỬA TRƯỚC KHI CHẠY):** bản copy từ đợt 153 bằng sed 153→154 giữ nguyên hằng `WAIT1 = ".../wait-t4-t5-boot401fca75.log"` (log waiter lần 1 đợt 153 — không tồn tại trong thư mục 154). T8 phát hiện lúc kiểm cuối, sửa thành `wait-t4-t5-boot2c0a7985.log` (log lần 1 đợt 154, 88 poll) rồi mới chạy script. Số liệu trích sau sửa: waiter lần 1: 88 poll, GATE-FOUND False, WAIT-DEADLINE False (chết theo reboot #49); waiter lần 2: 23 poll + WAIT-DEADLINE poll 24 13:30:32Z, GATE NOT MET; t4=1: KHÔNG CO dòng nào; postboot=1: 19 dòng (lần 2). Không ảnh hưởng số liệu O8/harness (đọc từ log gốc khác).
- **F-154-T8-8 — RAM SAMPLER HARNESS: n=33 MẪU HỢP LỆ / 34 (1 DÒNG LẪN TIÊU ĐỀ PHA):** log `ram-154t8.log` 35 dòng = 1 header + 34 mẫu; 1 dòng mẫu là dòng tiêu đề `=== CHROMIUM PHASE start 13:43:03Z ===` (driver echo nhầm vào log sampler — cùng lỗi pha trộn stdout đã thấy các đợt trước), không có balloon_kb nên script trích loại khỏi thống kê (n=33). Số liệu trích: balloon min 4.553.232 / max 5.922.588 (91,9% trần) / mean 5.257.372, pinned=0; avail min 564 MB @13:42:49Z / max 1.957 MB. Không ảnh hưởng verdict (0 mẫu ghim trần trong cả 33 mẫu hợp lệ).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 11 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `12fc68a3`, sau waiter hết hạn 13:30Z, KHÔNG có lượt yên hợp lệ nào (T4 0 attempt). Khác đợt 153 (sau lượt yên hợp lệ #21, parent quyết (j) XÁC NHẬN có caveat gate). Tiền lệ đợt 150 không bao phủ trường hợp 0 lượt yên. T8 không tự chốt chuỗi lên 12.
2. **Chuỗi "P3 không kẹt" 0 → 1 (BẮT ĐẦU LẠI) — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (f)/(h)/(k)).** 0 kẹt đợt này; 10 kẹt cộng dồn giữ nguyên (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1). Nếu đợt 155 cũng sạch thì chuỗi lên 2.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=16 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #23 KHÔNG CÓ lượt hợp lệ — 0 attempt (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-154: 147 poll thật trên 2 boot; gate A không mở trên #48 (RAM <1024, 73/117 poll <500 MB); load5 không <2 trên #49 (min 2,01). P3' cộng dồn không đổi 39/41 occurrence = 39/40 distinct-seq. DEF/GAP đã ghi cơ chế "catch-up lag sau đóng băng" theo quyết parent (d)(i).
5. **Reboot #48/#49 / mù #78?/#79?/#80? — giao T2-154** (btime #48 11:26:05Z, #49 13:05:12Z; boot #48 sống 2.327 s, boot #49 đang sống; xử lý theo mẫu T10-148; nghịch lý đồng hồ ≥ +20 s tại #49).
6. **Cửa yên không mở được cả đợt vì RAM + load — nợ T4/T5-155:** balloon ghim trần trên boot #48 (mở phiên đã 6.443.824 kB) + load5 ≥2,01 suốt trên boot #49. Không phải lỗi T8, nhưng O8/harness đợt sau sẽ lại chạy theo thủ tục (i) nếu cửa yên vẫn đóng — parent cân nhắc có cần đổi chuẩn gate (vd: cho phép O8 sau waiter hết hạn mà không cần lượt yên khi T4 0 attempt, với nhãn riêng) hay giữ nguyên.
7. **Checklist (o) ĐÃ ĐÓNG (F-154-T8-5)** — cả hai symlink diag trỏ 154, giữ qua reboot #49. T0-155 cân nhắc sửa hằng `DIAG137_SCRIPT` về 1 mối duy nhất.
8. **RAM avail min 564 MB + balloon max 91,9% (cửa sổ harness) — chờ T9 đối chiếu** (F-154-T8-8); chuỗi ghim trần phán bằng sampler T9 (giao T10); balloon ghim trần lúc mở phiên trên boot #48 cần T9 đối chiếu với sampler toàn đợt.
9. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-154 xác nhận số lần — lần thứ 8 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận.

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 154 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153) — 0 KẸT, CHUỖI 0 → 1 (BẮT ĐẦU LẠI)

## B1. Trạng thái giả thuyết sau đợt 154 (đứng nguyên — không mở giả thuyết mới)

| Giả thuyết | Trạng thái đợt 153 | Trạng thái đợt 154 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — CHỈ GIÁM SÁT THỤ ĐỘNG, 0 KẸT MỚI (xem B3)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — không có kẹt mới để đối chiếu)** |

- Đợt 154 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k): **0 kẹt trong 6 lần chạy harness + 0 kẹt trong 3 lần chạy O8**. Không có chữ ký kẹt mới; không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 564 MB trong cửa sổ harness + balloon max 91,9% — cửa sổ "nặng" hơn đợt 152 (677 MB / 87,9%, 0 kẹt) nhưng NHẸ hơn đợt 153 (306 MB / 96,3%, 1 kẹt) — và đợt này 0 kẹt. H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-155 đối chiếu tiếp.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 154

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–154) + đường ổn định `t8-diag-stall.sh` → 154 (CẢ HAI symlink cập nhật 11:37Z; kiểm cuối vẫn trỏ 154 — xem F-154-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–154) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không lần chạy nào im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=33 mẫu hợp lệ) | Balloon n=33 pinned=0 min=4.553.232 max=5.922.588 (91,9% trần) mean=5.257.372; avail min=564 MB lúc 13:42:49Z (trong lúc chạy 86n2 WebKit); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness (nhưng balloon ĐÃ ghim trần trên boot #48 trước harness — xem F-154-T8-3) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 13:44:29Z), 85m4 PASS (exit 0, 13:46:54Z), 86n2 PASS (exit 0, 13:51:00Z)** | N cộng dồn **N=16 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** | Baseline: dmesg EPERM tái xác nhận; journalctl -k "-- No entries --" / rỗng; không có snapshot timeout124/live-diag nào đợt này |

## B3. Chữ ký kẹt — đợt 154: 0 KẸT (85m4 HẾT KẸT SAU 1 ĐỢT)

- **Đợt 154: 0 KẸT THẬT.** WebKit 85m4 PASS đủ P1–P5 (P1 sync 2,4 s, HB128 chảy suốt P1/P2/P3/P5; P4 1,9/1,8/1,8 s; P5 40 s 0 restart, seek kẹt dài nhất 1 mẫu ~0,2 s). Không có evaluate im lặng nào >60 s (0 WATCHDOG-137), không có khoảng im lặng log nào >120 s (0 live-diag), không có exit 124 nào.
- **Đối chiếu với kẹt đợt 153 (85m4 P1-phaseA, chữ ký sớm nhất):** đợt 153 kẹt ngay evaluate đầu P1-phaseA, trước HB128 đầu tiên (P1 sync 10:37:00.215Z rồi im lặng hoàn toàn); đợt này P1-phaseA chạy xong trong 20 s với HB128 n=16→63, P1 PASS 13:37:05Z. Cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), khác boot (#49 vs #46) và khác cửa sổ RAM (avail min 564 MB vs 306 MB; balloon max 91,9% vs 96,3%) — chỉ là tương quan quan sát được trong 1 lần chạy; H1 đã bác bỏ, H3 chỉ giám sát thụ động.
- **Không có điểm pha nào khác "nóng" đợt này:** 84l10/86n2 WebKit + cả 3 pha Chromium đều PASS đủ P1–P5 (trừ ghi chú P5 Chromium 85m4 "CÓ-RESTART (+2)" do ended-at-duration — xem F-154-T8-4, không phải kẹt, không phải FAIL).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 154: 0 KẸT, CHUỖI 0 → 1 (BẮT ĐẦU LẠI)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL**. Chuỗi **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **3 → 4**.
- Đợt 146: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **4 → 5**.
- Đợt 147: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **5 → 6**.
- Đợt 148: **6 lần chạy harness, 1 KẸT (86n2 WebKit, P4-lần2, exit 124), 0 FAIL oan** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **6 → 0 (ĐỨT)**.
- Đợt 149: **8 lần chạy harness hoàn thành, 0 KẸT** (lần 1: WebKit 84l10/85m4 PASS + 86n2 KHÔNG VERDICT do reboot; lần 2: WebKit 0/3 FAIL LAUNCH môi trường + Chromium 3/3 PASS; lần 3: WebKit 3/3 PASS qua DEBROOT) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **0 → 1**.
- Đợt 150: **5 lần chạy harness hoàn thành, 2 KẸT (85m4 P1-phaseA boot1 + 86n2 P5-resetPlayhead0 boot2, cả hai exit 124)** + 1 lần 86n2 KHÔNG VERDICT (reboot #41 giết giữa P4) + **3 lần chạy O8, 0 kẹt, 0 FAIL** + Chromium lần 2 84l10 PASS (exit 0, 01:51:51Z), 85m4 PASS (exit 0, 01:54:07Z), 86n2 PASS (exit 0, 01:58:12Z). Chuỗi **1 → 0 (ĐỨT)**.
- Đợt 151: **4 lần chạy harness hoàn thành, 2 KẸT (85m4 P5-phaseB-long boot1 + 85m4 P1-waitForPlaySync boot2, 1 exit 124 + 1 không verdict exit do reboot #42 giết giữa lúc kẹt)** + 1 lần 85m4 KHÔNG VERDICT EXIT (reboot giết — nhưng đếm là KẸT theo chữ ký, xem F-151-T8-2) + 1 lần 86n2 KHÔNG VERDICT (chưa chạy, reboot giết driver) + **3 lần chạy O8, 0 kẹt, 0 FAIL** + Chromium lần 2 84l10 PASS (exit 0, 04:41:42Z), 85m4 PASS (exit 0, 04:43:57Z), 86n2 PASS (exit 0, 04:48:03Z). Chuỗi **0 → 0 (VẪN ĐỨT)**.
- Đợt 152: **6 lần chạy harness hoàn thành, 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 06:18:57Z, 85m4 PASS 06:21:32Z, 86n2 PASS 06:25:48Z; Chromium 84l10 PASS 06:27:14Z, 85m4 PASS 06:29:39Z, 86n2 PASS 06:33:45Z — tất cả exit 0, report `ok=true`). Chuỗi **0 → 1 (BẮT ĐẦU LẠI)**.
- Đợt 153: **5 lần chạy harness hoàn thành, 1 KẸT THẬT (85m4 WebKit, P1-phaseA, exit 124)** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 10:36:31Z, 86n2 PASS 10:56:14Z; Chromium 84l10 PASS 10:57:40Z, 85m4 PASS 11:00:05Z, 86n2 PASS 11:04:11Z — tất cả exit 0 trừ 85m4 WebKit, report `ok=true` trừ 85m4 WebKit `ok=false`). Chuỗi **1 → 0 (ĐỨT)**.
- Đợt 154: **6 lần chạy harness hoàn thành, 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 13:36:12Z, 85m4 PASS 13:38:48Z, 86n2 PASS 13:43:03Z; Chromium 84l10 PASS 13:44:29Z, 85m4 PASS 13:46:54Z, 86n2 PASS 13:51:00Z — tất cả exit 0, report `ok=true`). Chuỗi **0 → 1 (BẮT ĐẦU LẠI)**.
- **Mười lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần) + đợt 150 (2 lần) + đợt 151 (2 lần) + đợt 153 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=16 mỗi pha tới đợt 154, 0 kẹt).

## B5. Yếu tố chung khác — đợt 154: #23 KHÔNG CÓ lượt hợp lệ (T4 0 attempt); reboot #48 trước phiên + ứng viên #49 giữa phiên; replay tới nhanh trên boot #49

- T4 đợt này: **KHÔNG CÓ lượt hợp lệ — 0 attempt** (147 poll thật trên 2 boot; gate A không mở trên #48, load5 không <2 trên #49). O8/harness chạy theo THỦ TỤC (i) sau waiter hết hạn (không phải gate chuẩn, không sau lượt yên — xem F-154-T8-3). Kẹt probe T4 (nếu có) và kẹt harness T8 (evaluate im lặng) là hai chữ ký khác nhau — đừng gộp thành một lỗi; đợt này T4 0 attempt (không có probe nào để kẹt), T8 0 kẹt thật.
- Reboot #48 trước phiên (11:26:05Z) + ứng viên #49 giữa phiên (13:05:12Z, giết waiter + poller T4 + replay-watch T5). Boot #49 ổn định suốt O8 + harness (13:31–13:51Z).
- Replay apt: VẮNG lúc mở trên boot #48, TỚI TỰ NHIÊN (T5 repair-sớm, POSTBOOT_PASS 11:58:26Z) trên #48 và TỚI NHANH TỰ NHIÊN trên boot #49 (xong boot+~6 phút) — mẫu "replay chết" 3 đợt liên tiếp (150, 151-boot-mới, 152) ĐÃ ĐỨT từ đợt 153; T5 theo dõi đợt 155.
- Vite server còn sống lúc chạy (không có kẹt để đối chiếu) — không có bằng chứng mới về vite trong đợt này.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, wedge "chết lặng" — giám sát thụ động đợt 154, 0 kẹt thật mới, chuỗi 0 → 1 (bắt đầu lại).
- **H3-D1: BÁC BỎ (đứng nguyên, đợt 151; khẳng định lại đợt 153 — không có kẹt mới đợt này để đối chiếu).**
- **O8 WebKit đợt 142 đã kết luận xong ở đợt 143; đợt này O8 PASS 3/3 thường kỳ, SAU WAITER HẾT HẠN 13:30Z, KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO — chuỗi FULL PASS 11 → ? (chờ T10/parent phán).** Không mở điều tra mới về O8.
- **Lượt yên #23 KHÔNG CÓ lượt hợp lệ — gate harness đợt này theo THỦ TỤC (i), không phải gate chuẩn, không sau lượt yên.** Parent phán xem nhãn này có đủ chuẩn để tính chuỗi FULL PASS hay không (xem §9.1/§9.6).

### B6a. Giám sát thụ động đợt 154 — 0 kẹt, không có chữ ký mới

Theo quyết (f), T8-154 chỉ ghi nhận chữ ký kẹt nếu kẹt tái diễn. Kết quả: 0 kẹt thật trong 6 lần chạy harness (85m4 WebKit HẾT KẸT sau 1 đợt — P1-phaseA chạy xong trong 20 s với HB128 chảy suốt, khác hẳn chữ ký sớm nhất đợt 153) + 0 kẹt trong 3 lần chạy O8. Không có bảng đối chiếu wedge mới đợt này (không có snapshot trong lúc kẹt — vì không có kẹt). Nếu đợt 155 kẹt lại ở cùng điểm P1-phaseA sớm thì T8-155 ghi nhận thành mẫu tái diễn; quyết đóng/mở lại điều tra là việc parent.

---

## Phụ lục — số liệu trích bằng script từ log gốc (không gõ tay)

Script: `hidden_files/round154-t8/extract-154t8.py` (chạy ~13:52Z, output đầy đủ tại `hidden_files/round154-t8/smoke/extract-154t8-output.txt`). Mọi số dưới đây đều là output của script đó, đọc từ file gốc.

- Harness (từ `smoke/run-webkit-summary.txt`): WebKit 84l10 start 13:34:52Z exit 0 end 13:36:12Z live_diags=0; WebKit 85m4 start 13:36:27Z exit 0 end 13:38:48Z live_diags=0; WebKit 86n2 start 13:39:03Z exit 0 end 13:43:03Z live_diags=0; Chromium 84l10 start 13:43:19Z exit 0 end 13:44:29Z live_diags=0; Chromium 85m4 start 13:44:44Z exit 0 end 13:46:54Z live_diags=0; Chromium 86n2 start 13:47:10Z exit 0 end 13:51:00Z live_diags=0. ALL DONE 13:51:00Z.
- Report JSON (6 file): 6× `ok=true` (WebKit 84l10 finishedAt 13:36:10.255Z; WebKit 85m4 13:38:43.495Z; WebKit 86n2 13:43:01.327Z; Chromium 84l10 13:44:22.441Z; Chromium 85m4 13:46:47.456Z; Chromium 86n2 13:50:56.037Z).
- O8 JSON stamped (3 file): WebKit attempt1 `o8w-clicktest-report-2026-11-20T13-31-35-12fc68a3-pid13016.json` 21/21 md5 `234996ed`; WebKit attempt2 `o8w-clicktest-report-2026-11-20T13-32-41-12fc68a3-pid13484.json` 21/21 md5 `f9f21198`; Chromium `o8-clicktest-report-2026-11-20T13-33-38-12fc68a3-pid13930.json` 21/21 md5 `5db202d0`.
- O8 log: PASS S1 6 dòng, FAIL S1 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0; `O8 DONE 2026-11-20T13:34:35Z webkit1=0 webkit2=0 chromium=0`.
- Sampler (n=33 mẫu hợp lệ): balloon min 4.553.232 / max 5.922.588 (91,9% trần) / mean 5.257.372, pinned=0; avail min 564 MB @13:42:49Z / max 1.957 MB.
- Watchdog/live-diag: WATCHDOG-137 trong summary 0, LIVE-DIAG-154 trong summary 0, WATCHDOG-137 trong log 85m4 0, probe TIMEOUT 30s False; stall dirs [].
- MD5 cây lúc đóng: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093, 84l10 b8c08a7c, 85m4 610ee003, 86n2 628088bd, O8w 4994b4fc, O8h c8acd72e.
- Waiter: lần 1 (boot 2c0a7985): 88 poll, GATE-FOUND False, WAIT-DEADLINE False (chết theo reboot #49); lần 2 (boot 12fc68a3): 23 poll + WAIT-DEADLINE poll 24 13:30:32Z GATE NOT MET; t4=1: KHÔNG CÓ dòng nào; postboot=1: 19 dòng (lần 2).
- Kiểm cuối: boot 12fc68a3, btime 1795179912; ps sót 0; X11 files 0; lock TRỐNG, 0 ticket + 101 cooldown; symlink repo + hidden-root đều → `round154-t8/diag-stall-154t8.sh`.
- Oversize: 86n2 script 39.194 B (>37.768 B); 84l10 32.680 B; 85m4 37.111 B.
