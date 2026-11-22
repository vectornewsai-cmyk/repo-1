# Đợt 155 T8 — O8 PASS 3/3 SAU WAITER HẾT HẠN (THỦ TỤC (i), KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO) + HARNESS 6/6 LẦN 2, 0 KẸT — CHUỖI "P3 KHÔNG KẸT" 1 → 2 (TIẾP TỤC)

Ngày: 20/11/2026 (lượt cron 21:35 +07 = 14:35:51Z; T8 mở ~14:40Z, đóng 16:56Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU WAITER HẾT HẠN 16:30:26Z theo THỦ TỤC (i), KHÔNG có lượt yên hợp lệ nào của T4 trong đợt 155 (T4 0 attempt — xem §0/§1); (2) harness đứng — 2 lần chạy driver (lần 1: 0/6, exit 2 toàn bộ do /tmp mất theo reboot #50 — KHÔNG PHẢI KẸT, xem F-155-T8-4; lần 2: 6/6 PASS, 0 KẸT); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, 0 kích hoạt, 0 false-positive; (4) H3: CHỈ GIÁM SÁT THỤ ĐỘNG (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 — GIỮ NGUYÊN); (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON của T0-152 còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau.
Nợ: docs/PHASE9_ROUND154_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 sau waiter hết hạn, KHÔNG có lượt yên hợp lệ; harness 6/6, 0 kẹt — 85m4 hết kẹt, chuỗi "P3 không kẹt" 0 → 1; chuỗi WebKit FULL PASS GIỮ 11, KHÔNG LÊN 12 — T10 phán, parent XÁC NHẬN ở quyết (g) đợt 154; reboot ứng viên #49 giữa phiên; checklist (o) xong cả hai symlink).

## 0. Kết luận ngắn — O8 PASS 3/3 (KHÔNG QUA LƯỢT YÊN), HARNESS LẦN 2 6/6 (0 KẸT), REBOOT ỨNG VIÊN #50 GIỮA PHIÊN

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (16:31:32–16:34:28Z, 2'56", boot `d849728b` = reboot ứng viên #50, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 16:31:50Z + 16:32:49Z, Playwright mouse click lần 2; Chromium: 16:33:57Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO — CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN.** T4-155: lượt yên #24 KHÔNG CÓ lượt hợp lệ — **0 attempt** (poller hết hạn cắt 16:30Z, exit 5 — cờ T4 viết "HET HAN CHO 16:30Z 20/11 — 0 attempt"). Chuỗi lượt hợp lệ DỪNG Ở #21 (đợt 154 cũng 0 attempt — hai đợt liên tiếp không có lượt yên hợp lệ). Waiter T8 (lần 2) hết hạn poll 85 lúc 16:30:26Z — GATE NOT MET (t4=0, postboot=1); T4 0 attempt live (0 process; chỉ còn ticket lock stale-boot của T4 từ boot cũ) → đủ điều kiện thủ tục (i) đợt 143: chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot #50 lúc 16:30:45Z — ĐẦY ĐỦ** (T5 POSTBOOT_PASS có cho boot mới, dpkg.log 795 dòng, cache 110 .deb, lists 75, lib đủ 6/6). **Nhãn trích: "O8 + harness sau waiter hết hạn 16:30Z, KHÔNG có lượt yên hợp lệ nào trong đợt 155 (T4 0 attempt), theo thủ tục (i)" — KHÔNG ghi "sau lượt yên hợp lệ" và KHÔNG ghi "qua gate chuẩn (i)".**
- **Chuỗi WebKit FULL PASS: 11 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).** O8 WebKit 21/21 ×2 đợt này trên boot `d849728b`, nhưng KHÔNG sau lượt yên hợp lệ nào (giống đợt 154: O8 sau waiter hết hạn, 0 lượt yên; parent quyết (g) đợt 154: GIỮ 11, KHÔNG LÊN 12). Tiền lệ đợt 150 + quyết (j) đợt 153: chuỗi = các lượt O8 chạy SAU MỘT LƯỢT YÊN HỢP LỆ.
- **Harness lần 2: 6/6 PASS TRONG MỘT LẦN CHẠY DRIVER, 0 KẸT** (16:38:25–16:54:37Z, boot `d849728b`, system libs sau T5 repair): WebKit 84l10 PASS (16:39:49Z) + 85m4 PASS (16:42:25Z) + 86n2 PASS (16:46:40Z) + Chromium 84l10 PASS (16:48:06Z) + 85m4 PASS (16:50:31Z) + 86n2 PASS (16:54:37Z). Cả 6 report JSON đã kiểm độc lập bằng python (6× `ok=true`). **Chuỗi "P3 không kẹt": 1 → 2 (TIẾP TỤC).**
- **Harness lần 1: 0/6, exit 2 toàn bộ — KHÔNG PHẢI KẸT, KHÔNG PHẢI FAIL HARNESS** (16:34:40–16:37:00Z): `/tmp` bị xóa theo reboot #50, fixture `/tmp/n2/clips/h_h264_320x180_30s.mp4` (và toàn bộ fixture /tmp) không còn — driver báo `HARNESS LỖI: không thấy clip` và thoát 2 ngay mỗi pha. T8 rebuild fixture (16:37–16:38:12Z, md5 khớp đợt 125) rồi chạy lại lần 2. Lần 1 KHÔNG đếm vào chuỗi "P3 không kẹt" hay N đối chứng Chromium (0 lần chạy hoàn thành).
- **REBOOT ỨNG VIÊN #50 GIỮA PHIÊN (15:04:07Z)** — boot `12fc68a3` (#49, btime 13:05:12Z) → `d849728b`, giết waiter T8 (lần 1) giữa poll 23 + attempt2 của T4 + watcher nền T8; T2-155 xác minh 4 nguồn độc lập (coordinator báo 15:21Z). Boot cũ sống 7.135 s. T8 khởi động lại waiter (lần 2) 15:06:14Z trên boot mới, deadline giữ 16:30Z.
- **Watchdog: 0 kích hoạt, 0 live-diag, 0 false-positive** — không có kẹt để bắt (lần 1 exit 2 do thiếu fixture, không phải evaluate im lặng).
- **Balloon trong cửa sổ harness T8 lần 2: 0 mẫu ghim trần** (n=33, max 5.873.104 kB = 91,1% trần); **avail min 622 MB lúc 16:46:26Z** (trong lúc chạy 86n2 WebKit).
- **T8 ĐÓNG 16:56Z — TRONG hạn cờ 17:00Z** (cờ `round155-t8.done` viết 16:56:00Z, 547 B; LIMITS hoàn thiện sau cờ vài phút).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 13:05:12 | REBOOT #49 (đợt 154) — boot `12fc68a3` bắt đầu phiên đợt 155 |
| ~14:40 | T8 mở: RAM avail ~730 MB lúc mở, balloon 6.121.660 kB (~95,0% trần); đọc LIMITS T8-154; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 154 (không đổi); fixture /tmp còn nguyên từ đợt 154 (hevc ba0c7c62, i7 f05daed8, h fbaa3d1a, g a1fb8549) |
| 14:40 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round155-t8/diag-stall-155t8.sh`, readlink + test -x xác nhận** |
| 14:41:56 | Waiter T8 (lần 1) bắt đầu (deadline 16:30Z); poll 1: t4=0 postboot=0; poll 2: postboot=1 (T5 POSTBOOT_PASS boot #49) |
| 15:01:44 | T4 poll #16: CỬA YÊN MỞ (RAM 1260 MB) — T4 chạy attempt2 |
| 15:04:07 | **REBOOT ỨNG VIÊN #50** — boot `12fc68a3` → `d849728b`, btime 1795187047; giết waiter T8 (lần 1) giữa poll 23 (15:04:04Z) + attempt2 T4 (log cuối 15:03:31Z) + watcher nền T8 (SIGTERM ~15:04:20Z) |
| 15:06:14 | Waiter T8 (lần 2) khởi động lại trên boot mới (deadline 16:30Z; log lần 1 đã sao lưu sang `wait-t4-t5-boot12fc68a3.log` trước khi script truncate); T4 khởi động lại poller trên boot mới |
| 15:22:25 | T8 kiểm giữa phiên theo thông báo coordinator: vite lock chỉ còn ticket stale-boot của T4 (pid 55022); 0 process sót của T8; JSON stamped O8 đợt 154 còn nguyên, md5 khớp (234996ed/f9f21198/5db202d0); cả hai symlink diag VẪN trỏ 155 |
| 16:29:45 | T4 poll #99 (cuối): gateA RAM 529 MB < 1024 — cửa yên không mở lúc hết hạn |
| 16:30:26 | **Waiter (lần 2) HẾT HẠN poll 85 — GATE NOT MET** (t4=0, postboot=1; T4 0 attempt — 0 process) → áp thủ tục (i): chạy sau hết hạn kèm ghi rõ |
| 16:30:45 | **T8 tự kiểm postboot boot #50: ĐẦY ĐỦ** (T5 POSTBOOT_PASS có, dpkg.log 795, cache 110, lists 75, lib đủ 6/6) — xem F-155-T8-3 |
| 16:31:32–16:34:28 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — SAU waiter hết hạn, KHÔNG có lượt yên hợp lệ nào |
| 16:34:40–16:37:00 | **Harness lần 1: 0/6, exit 2 toàn bộ — /tmp MẤT theo reboot #50, thiếu fixture** (xem F-155-T8-4) — KHÔNG PHẢI KẸT |
| 16:37–16:38:12 | **Rebuild fixture /tmp: md5 khớp đợt 125** (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549; blend media bền còn nguyên) |
| 16:38:25–16:54:37 | **Harness lần 2 (chạy lại sau rebuild): 6/6 PASS, 0 KẸT** (xem §2) |
| 16:56:00 | Cờ `round155-t8.done` (547 B, TRONG hạn 17:00Z); kiểm cuối + LIMITS + stage file hoàn thiện sau đó |

## A. O8 — PASS 3/3 trên boot `d849728b`, SAU WAITER HẾT HẠN (THỦ TỤC (i), KHÔNG CÓ LƯỢT YÊN HỢP LỆ)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 16:31:32–16:32:36 | 0 | **21/21 PASS** — S1 PASS 16:31:50Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 16:32:36–16:33:31 | 0 | **21/21 PASS** — S1 PASS 16:32:49Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 16:33:32–16:34:28 | 0 | **21/21 PASS** — S1 PASS 16:33:57Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-20T16-31-33-d849728b-pid29377.json` 21 kết quả `ok=true` 21/21, md5 `a10a1004`; attempt2 `o8w-clicktest-report-2026-11-20T16-32-37-d849728b-pid29891.json` 21/21 `ok=true`, md5 `1b9b09aa` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-20T16-33-32-d849728b-pid30295.json` 21/21 `ok=true`, md5 `f448ffd1`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng khối `run`, cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `d849728b` sau T5 repair). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness lần 2 (standard driver, không LD_LIBRARY_PATH).
- Driver O8 giữ 1 lock vite `t8-round155` suốt lượt (nhả 16:34:28Z; vite sau release curl 5560/5554 = 000000 — vite đã tắt, đúng).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-155t8.mjs`, `node --check` OK — bản copy từ 154, chưa dùng) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 11 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `d849728b`, sau waiter hết hạn 16:30Z, KHÔNG có lượt yên hợp lệ nào). Giống đợt 154 (parent quyết (g): GIỮ 11, KHÔNG LÊN 12). T8 KHÔNG tự chốt chuỗi lên 12.
- **O8 đợt này 2'56" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28", 152: 2'51", 153: 2'53", 154: 3'02") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — LẦN 2: 6/6 PASS, 0 KẸT (WebKit + Chromium qua system libs)

### Lần 1 (hỏng — KHÔNG TÍNH VERDICT) — boot `d849728b`, 16:34:40–16:37:00Z, exit 2 toàn bộ

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1–3 | WebKit 84l10 / 85m4 / 86n2 | 2 | 16:34:40–16:37:00 | **KHÔNG VERDICT** — `HARNESS LỖI: không thấy clip /tmp/.../h_h264_320x180_30s.mp4` |
| 4–6 | Chromium 84l10 / 85m4 / 86n2 | 2 | 16:34:40–16:37:00 | **KHÔNG VERDICT** — cùng lỗi thiếu fixture (86n2 Chromium: `không thấy clip /tmp/n2/clips/h_h264_320x180_30s.mp4`, exit 2 lúc 16:37:00Z) |

- Summary: `ALL DONE 16:37:00Z ec webkit: 84l10=2 85m4=2 86n2=2 ; chromium: 84l10=2 85m4=2 86n2=2`. Đây là lỗi môi trường (fixture /tmp mất theo reboot #50), KHÔNG phải kẹt evaluate (0 WATCHDOG-137, 0 live-diag, không có khoảng im lặng nào — mỗi pha thoát 2 ngay khi kiểm clip đầu vào). **Lần 1 KHÔNG đếm vào chuỗi "P3 không kẹt" và KHÔNG đếm vào N đối chứng Chromium** (không có lần chạy nào hoàn thành).
- Fixture rebuild 16:37–16:38:12Z: 6/6 md5 khớp đợt 125 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).

### Lần 2 (chạy lại sau rebuild) — boot `d849728b`, 16:38:25–16:54:37Z, system libs sau T5 repair

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 16:38:29–16:39:49 | **PASS** — report `ok=true` (W1 3/3 delta +1 sạch 0→1/1→2/2→3, W2 PASS, E4 PASS 3→3 ended=true) |
| 2 | WebKit 85m4-hb128 | 0 | 16:40:04–16:42:25 | **PASS** — report `ok=true` (P1 PASS, HB128 chảy suốt; P4 3/3 PASS, đồng bộ 2,0/4,4/1,3 s; P5 PASS 40 s 0 restart, seek kẹt dài nhất 1 mẫu ~0,2 s) |
| 3 | WebKit 86n2 | 0 | 16:42:40–16:46:40 | **PASS** — report `ok=true` (P1 PASS; P4 3/3 PASS, đồng bộ 1,4/4,4/1,8 s; P5 PASS 40 s 0 restart, seek kẹt dài nhất 2 mẫu ~0,4 s) |
| 4 | Chromium 84l10 | 0 | 16:46:56–16:48:06 | **PASS** — report `ok=true` (W1 3/3 delta +1 nhưng trôi đếm +1 giữa các lần: 0→1/2→3/4→5 — xem F-155-T8-7; W2 PASS, E4 PASS 6→6 ended=true) |
| 5 | Chromium 85m4 | 0 | 16:48:21–16:50:31 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,0/0,5/1,0 s; P5 PASS 40 s 0 restart, seek kẹt 0 mẫu) |
| 6 | Chromium 86n2 | 0 | 16:50:46–16:54:37 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,0/1,0/1,0 s; P5 PASS 40 s 0 restart, seek kẹt 0 mẫu) |

- 6 report JSON kiểm độc lập bằng python, `finishedAt` khớp cửa sổ chạy từng pha: WebKit 16:39:40.079Z (`ok=true`) / 16:42:21.646Z (`ok=true`) / 16:46:39.903Z (`ok=true`); Chromium 16:47:56.703Z / 16:50:23.991Z / 16:54:33.161Z (cả ba `ok=true`).
- Môi trường lần 2: system libs sau T5 repair trên boot #50 (dpkg.log 795 dòng, cache 110 .deb, lists 75, POSTBOOT_PASS). **WebKit launch THÀNH CÔNG cả 3 pha bằng system libs** — không cần lần chạy DEBROOT thứ hai (khác đợt 149/151).
- **85m4 HẾT KẸT giữ (đợt 153 kẹt, 154 PASS, 155 PASS); chuỗi "P3 không kẹt" 1 → 2 (TIẾP TỤC).** 86n2 P4-lần2 PASS lần thứ 7 liên tiếp tính theo lần chạy có verdict (nối tiếp lần thứ 6 ở đợt 154; T10 đối chiếu chuỗi đầy đủ).
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn đã đủ 6/6 ở lần 2) — ghi rõ để T10 không tìm log lần 3.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT, 0 LIVE-DIAG, 0 FALSE-POSITIVE

- **Watchdog (i): 0 kích hoạt — ĐÚNG (không có kẹt để bắt).** 0 dòng `WATCHDOG-137` trong cả 6 log harness lần 2 + 3 log O8; 0 snapshot `smoke/stall-*` (thư mục smoke không có thư mục stall nào).
- **Driver (1b) live-diag: 0 kích hoạt.** `live_diags=0` cả 6 lần chạy harness lần 2 (không lần chạy nào im lặng >120 s; 85m4 WebKit HB128 chảy suốt P1–P5).
- **0 false-positive cả lượt.** 6 lần chạy harness lần 2 + 3 lần chạy O8: 0 dòng `WATCHDOG-137`, 0 live-diag. Watchdog chỉ kích hoạt khi có kẹt thật (đợt 153: 1 kích hoạt đúng). Lần 1 exit 2 do thiếu fixture cũng 0 WATCHDOG-137 / 0 live-diag (không phải evaluate im lặng).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–154 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–155) + đường ổn định `t8-diag-stall.sh` → 155 (CẢ HAI symlink cập nhật 14:40Z, TRƯỚC mọi lần chạy — xem F-155-T8-5) | 6 lần chạy harness lần 2 hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT OAN.** 0 snapshot stall (không có kẹt để chẩn đoán); lần 1 exit 2 do thiếu fixture cũng không kích hoạt watchdog |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–155) | 6 lần chạy harness lần 2; `live_diags=0` cả 6 lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không lần chạy nào im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-155t8.sh` (cột `balloon_kb`) | 1 log sampler lần 2 (n=33 mẫu hợp lệ) | Balloon n=33 pinned=0 min=4.890.064 max=5.873.104 (91,1% trần) mean=5.364.727; avail min=622 MB lúc 16:46:26Z (trong lúc chạy 86n2 WebKit) — xem F-155-T8-8 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 16:48:06Z), 85m4 PASS (exit 0, 16:50:31Z), 86n2 PASS (exit 0, 16:54:37Z)** | N cộng dồn **N=17 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** | Baseline: dmesg EPERM tái xác nhận; journalctl -k "-- No entries --" / rỗng — như các đợt trước |

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

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi nhỏ so với đợt 154: nhãn log `LIVE-DIAG-154` → `LIVE-DIAG-155`, deadline waiter 13:30Z → 16:30Z (khớp hạn cờ đợt 155), lock `t8-round154` → `t8-round155` — chỉ chuỗi/hằng số trong bản copy, không chạm script repo. Script trích số liệu `extract-155t8.py`: sửa hằng WAIT1 trỏ nhầm log waiter lần 1 đợt 154 (`wait-t4-t5-boot2c0a7985.log` → `wait-t4-t5-boot12fc68a3.log`) trước khi chạy — xem F-155-T8-6; các bản copy driver Chromium-only + debroot giữ nguyên mẫu 154 (đổi nhãn 154→155), KHÔNG dùng đợt này.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round155` 16:34:28Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 16:54:37Z, giữ 231 s).
- Kiểm cuối ~16:55Z (bằng script trích số liệu): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: 0; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown); boot `d849728b` ổn định (btime 1795187047 không đổi từ 15:04:07Z).
- `/tmp/.X11-unix/` trống 0 file lúc kiểm cuối (Xvfb :199 của T8 đã dọn socket của mình; :188 O8-WebKit + :197 O8-Chromium cũng đã dọn).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Gate đợt này KHÔNG PHẢI gate chuẩn (i) — và KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO** (xem §0/§1/F-155-T8-3): T4 0 attempt (poller hết hạn 16:30Z; gate A RAM không mở lúc hết hạn: 529 MB < 1024) + waiter hết hạn 16:30:26Z + T8 tự kiểm postboot boot #50 đầy đủ lúc 16:30:45Z. Đừng trích "sau lượt yên hợp lệ" hay "qua gate chuẩn (i)" cho đợt này. **Chuỗi WebKit FULL PASS 11 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 12. Đây là đợt thứ hai liên tiếp 0 lượt yên hợp lệ (154, 155).
2. **Harness lần 1 (0/6, exit 2) KHÔNG PHẢI kẹt và KHÔNG PHẢI fail harness** (xem F-155-T8-4): thiếu fixture do /tmp mất theo reboot #50; không đếm vào chuỗi "P3 không kẹt" hay N đối chứng Chromium. Chỉ lần 2 mới có verdict: **harness 6/6 PASS, 0 kẹt**.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `d849728b` sau T5 repair. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness lần 2 (standard driver, không LD_LIBRARY_PATH).
4. **Chromium 84l10 W1: trôi đếm +1 giữa các lần** (lần1 0→1, lần2 2→3, lần3 4→5 — xem F-155-T8-7): artifact test đã biết cùng họ với trôi +2 các đợt 146–154, không phải FAIL (W1 vẫn PASS delta +1 mỗi lần; W2/E4 PASS). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3). **Chromium 84l10 E4 đợt này `ended=true`** (6→6, ct cuối=4) — KHÁC đợt 154 (`ended=false`, như các đợt trước); chỉ ghi nhận khác biệt, không phải FAIL (E4 PASS).
5. **Balloon KHÔNG ghim trần trong cửa sổ harness T8 lần 2** (0 mẫu ghim, n=33, max 91,1% trần) — nhưng sampler T8 chỉ phủ cửa sổ harness; balloon ĐÃ gần trần lúc mở phiên trên boot #49 (95,0%) và lúc tự kiểm postboot 16:30Z (97,0% trần, 6.247.216 kB); avail min 622 MB rơi vào lúc chạy 86n2 WebKit; chuỗi ghim trần phán bằng sampler T9 (giao T10).
6. **RAM avail min 622 MB lúc 16:46:26Z (trong lúc chạy 86n2 WebKit)** — cao hơn 564 MB đợt 154, cao hơn 306 MB đợt 153; chờ T9 đối chiếu bằng sampler toàn đợt trước khi kết luận gì về RAM phiên.
7. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–155 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn. O8 webkit/headed sau sửa T0: kiểm kích thước lúc push.
8. **T8 ĐÓNG TRONG hạn cờ 17:00Z** (cờ viết 16:56:00Z) — dù reboot #50 + waiter hết hạn 16:30Z + 0 lượt yên + harness lần 1 hỏng phải chạy lại. Hạn cứng 17:00Z không bị đe dọa quá 4 phút; LIMITS hoàn thiện sau cờ vài phút.

## 8. Sai số mới (F-155-T8-N)

- **F-155-T8-1 — REBOOT ỨNG VIÊN #50 GIỮA PHIÊN (T2-155 xác minh 4 nguồn độc lập — coordinator báo 15:21Z):** btime /proc/stat 15:04:07Z (epoch 1795187047); boot `12fc68a3` (#49, btime 13:05:12Z) → `d849728b-b8b9-43d4-b3f5-e218facbfdb0`; boot cũ sống 7.135 s (13:05:12Z → 15:04:07Z, stat→stat). Reboot giết waiter T8 (lần 1) giữa poll 23 (15:04:04Z) + attempt2 của T4 (log cuối 15:03:31Z) + watcher nền T8 (SIGTERM, duration ~1.282 s, kết thúc ~15:04:20Z). **Nghịch lý đồng hồ:** log T4 cuối 15:03:31Z, TRƯỚC btime boot mới 15:04:07Z — KHÔNG thấy nghịch lý từ log T4 (khác #49: ≥ +20 s). T8 khởi động lại waiter (lần 2) 15:06:14Z trên boot mới (log lần 1 sao lưu trước khi truncate — mẫu đợt 154). Mù #81? (nếu #50 đúng số) giao T2-155 theo mẫu T10-148; T8 không tự chốt giây reboot.
- **F-155-T8-2 — REBOOT #49 TRƯỚC PHIÊN + REPLAY: VẮNG LÚC MỞ TRÊN #50, TỚI SAU REPAIR CỦA T5:** boot #49 (`12fc68a3`, btime 13:05:12Z) là boot lúc T8 mở (~14:40Z) — cùng boot đợt 154, không phải reboot mới lúc mở. Lúc T8 mở lại sau reboot #50 (15:05:08Z, boot+~1 phút): không có thư mục GST, cache 0 .deb, lists 2, dpkg.log 2 dòng — replay VẮNG, mẫu vắng lúc mở tiếp tục (150, 151-boot-mới, 152, 153-boot-#45, 154-boot-#48, 155-boot-#50). Nhưng replay TỚI SAU REPAIR của T5 (dpkg.log 2 → 795, POSTBOOT_PASS cho boot mới, cache 110, lists 75 lúc 16:30Z). **Kết luận: replay không chết hẳn — lúc vắng lúc tới, không đoán trước được; T5 theo dõi tiếp đợt 156.**
- **F-155-T8-3 — GATE KHÔNG ĐẠT, CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN 16:30:26Z — KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO:** waiter lần 1 (boot #49, 23 poll): t4=0 suốt, postboot=0 tới poll 1 rồi =1 từ poll 2 (đường (a), POSTBOOT_PASS của T5 cho boot #49) — chết theo reboot #50. Waiter lần 2 (boot #50, 84 poll + dòng hết hạn poll 85): **t4=0 SUỐT, postboot=0 tới poll 20 rồi =1 từ poll 21 (15:26:17Z)** (đường (a), POSTBOOT_PASS của T5 cho boot mới). T4 0 attempt live lúc hết hạn (0 process; chỉ còn ticket lock stale-boot t4 pid 55022 từ boot cũ — T4 tự gắn cờ stale-boot) → đủ điều kiện thủ tục (i) đợt 143: chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot #50 lúc 16:30:45Z — ĐẦY ĐỦ:** T5 POSTBOOT_PASS có cho boot mới (T4 poll #99 gate0=T5 PASS, pb_age=2x45s), dpkg.log 795 dòng, cache 110 .deb, lists 75, lib đủ (grep libgstreamer/libevent/libEGL/libavif/libdw/libevdev = 6/6). O8 bắt đầu 16:31:32Z, harness lần 1 bắt đầu 16:34:40Z — CẢ HAI SAU WAITER HẾT HẠN 16:30:26Z. **Lần thứ hai liên tiếp T8 chạy mà KHÔNG CÓ lượt yên hợp lệ nào trong đợt** (đợt 154 cũng vậy). Nợ T4/T5-156: cửa yên không mở được cả đợt vì RAM + load — xem §9.6.
- **F-155-T8-4 — HARNESS LẦN 1 HỎNG TOÀN BỘ DO /tmp MẤT THEO REBOOT #50 (LỖI T8: KHÔNG REBUILD FIXTURE SAU REBOOT):** lần 1 (16:34:40–16:37:00Z): 6/6 pha exit 2, `HARNESS LỖI: không thấy clip /tmp/.../h_h264_320x180_30s.mp4`. Nguyên nhân: reboot #50 lúc 15:04:07Z xóa /tmp (fixture đợt 154 đã kiểm còn nguyên lúc 14:44Z trên boot cũ — nhưng T8 KHÔNG kiểm lại /tmp sau khi waiter lần 2 khởi động lại trên boot mới). Đây là lỗi quy trình của T8: sau mỗi reboot giữa phiên phải kiểm lại fixture /tmp TRƯỚC khi chạy harness (bài học đợt 141/142 đã có — rebuild sau gate — nhưng đợt này T8 đã kiểm fixture lúc mở phiên trên boot cũ rồi chủ quan không kiểm lại sau reboot). Khắc phục: rebuild 16:37–16:38:12Z (md5 khớp đợt 125) + chạy lại lần 2 (6/6 PASS). **Quy tắc mới cho T8-156: sau reboot giữa phiên, rebuild/kiểm fixture /tmp ngay khi waiter khởi động lại, KHÔNG chờ tới lúc chạy harness.** Lần 1 không đếm vào chuỗi "P3 không kẹt" hay N Chromium (0 lần chạy hoàn thành).
- **F-155-T8-5 — CHECKLIST (o) ĐÃ LÀM ĐÚNG CẢ HAI SYMLINK — GIỮ QUA REBOOT #50:** lúc T8 mở (~14:40Z) `hidden_files/t8-diag-stall.sh` vẫn trỏ về `round154-t8/diag-stall-154t8.sh` (stale 1 đợt) và repo `apps/web/scripts/t8-diag-stall.sh` trỏ về `round154-t8/diag-stall-154t8.sh` (stale 1 đợt — cả hai đều trỏ 154 vì đợt 154 đã cập nhật cả hai). T8 cập nhật CẢ HAI về `round155-t8/diag-stall-155t8.sh` lúc 14:40Z (trước mọi lần chạy), `readlink` + `test -x` xác nhận cả hai; kiểm giữa phiên 15:22:25Z (sau reboot #50) cả hai VẪN trỏ 155 (giữ qua reboot — symlink nằm trên home persistent, không mất theo reboot); kiểm cuối ~16:55Z cả hai VẪN trỏ 155. Không có snapshot watchdog nào ghi nhầm thư mục đợt này (0 kẹt → 0 snapshot; đường diag đã đúng cả hai mối). **Nợ đóng:** F-154-T8-5 đã sửa xong từ đợt 154, giữ qua đợt 155; T0-156 vẫn cân nhắc sửa hằng `DIAG137_SCRIPT` trong 3 script harness về 1 mối duy nhất (đề xuất cũ, chưa làm).
- **F-155-T8-6 — SCRIPT TRÍCH SỐ LIỆU `extract-155t8.py` TRỎ NHẦM LOG WAITER LẦN 1 (ĐÃ SỬA TRƯỚC KHI CHẠY — LẶP LẠI F-154-T8-7):** bản copy từ đợt 154 bằng sed 154→155 giữ nguyên hằng `WAIT1 = ".../wait-t4-t5-boot2c0a7985.log"` (log waiter lần 1 đợt 154 — không tồn tại trong thư mục 155). T8 phát hiện lúc chạy extract, sửa thành `wait-t4-t5-boot12fc68a3.log` (log lần 1 đợt 155, 23 poll) rồi mới chạy script. Số liệu trích sau sửa: waiter lần 1: 23 poll, GATE-FOUND False, WAIT-DEADLINE False (chết theo reboot #50); waiter lần 2: 84 poll + WAIT-DEADLINE poll 85 16:30:26Z, GATE NOT MET; t4=1: KHÔNG CÓ dòng nào; postboot=1: 64 dòng (lần 2). Không ảnh hưởng số liệu O8/harness (đọc từ log gốc khác). **Bài học lặp lại lần 2: hằng WAIT1 trong extract script phải sửa tay mỗi đợt theo boot của waiter lần 1 — T8-156 kiểm hằng này NGAY khi copy script, không chờ tới lúc chạy extract.**
- **F-155-T8-7 — CHROMIUM 84l10 W1 TRÔI ĐẾM +1 GIỮA CÁC LẦN (ARTIFACT ĐÃ BIẾT, KHÔNG PHẢI FAIL) + E4 `ended=true` KHÁC ĐỢT 154:** lần1 0→1, lần2 2→3, lần3 4→5 — đếm `restartEndedVideo` tăng +1 ngoài delta giữa các lần (1→2, 3→4), cùng họ trôi +2 các đợt 146–154 (đợt 154: lần1 +2). W1 vẫn PASS delta +1 mỗi lần; W2 PASS; E4 PASS (restartEndedVideo tại cuối 6 → sau 3 s 6, ct cuối=4, **`ended=true` — khác đợt 154 `ended=false`**). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3, E4 3→3 ended=true). Ghi nhận để T10 không đọc trôi đếm thành FAIL và không đọc `ended=true` của Chromium thành thay đổi hành vi (E4 vẫn PASS).
- **F-155-T8-8 — RAM SAMPLER HARNESS LẦN 2: n=33 MẪU HỢP LỆ:** log `ram-155t8.log` lần 2 (sau rebuild — log lần 1 đã bị truncate khi driver lần 2 khởi động lại sampler, đúng thiết kế driver); số liệu trích: balloon min 4.890.064 / max 5.873.104 (91,1% trần) / mean 5.364.727, pinned=0; avail min 622 MB @16:46:26Z (trong lúc chạy 86n2 WebKit) / max 1.634 MB. Không ảnh hưởng verdict (0 mẫu ghim trần trong cả 33 mẫu hợp lệ).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 11 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `d849728b`, sau waiter hết hạn 16:30Z, KHÔNG có lượt yên hợp lệ nào (T4 0 attempt — đợt thứ hai liên tiếp). Giống đợt 154 (parent quyết (g): GIỮ 11, KHÔNG LÊN 12). T8 không tự chốt chuỗi lên 12.
2. **Chuỗi "P3 không kẹt" 1 → 2 (TIẾP TỤC) — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (f)/(h)/(k)).** 0 kẹt đợt này (lần 2); 10 kẹt cộng dồn giữ nguyên (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1). Nếu đợt 156 cũng sạch thì chuỗi lên 3.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=17 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #24 KHÔNG CÓ lượt hợp lệ — 0 attempt (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-155: poller hết hạn 16:30Z; gate A không mở lúc hết hạn (RAM 529 MB < 1024); attempt2 trên boot cũ bị reboot #50 giết giữa chừng (log cuối 15:03:31Z). P3' cộng dồn không đổi vì T4 0 attempt (xem LIMITS T4-155 để đối chiếu số tuyệt đối). Hai đợt liên tiếp (154, 155) không có lượt yên hợp lệ. DEF/GAP đã ghi cơ chế "catch-up lag sau đóng băng" theo quyết parent (d)(i).
5. **Reboot #49/#50 / mù #81? — giao T2-155** (btime #49 13:05:12Z, #50 15:04:07Z; boot #49 sống 7.135 s, boot #50 đang sống; xử lý theo mẫu T10-148; KHÔNG thấy nghịch lý đồng hồ từ log T4 tại #50).
6. **Cửa yên không mở được cả đợt vì RAM + load — nợ T4/T5-156:** balloon ghim gần trần trên boot #50 (97,0% trần lúc 16:30Z; 95,0% lúc mở trên boot #49) + RAM avail tụt <1024 lúc hết hạn. Không phải lỗi T8, nhưng O8/harness đợt sau sẽ lại chạy theo thủ tục (i) nếu cửa yên vẫn đóng — parent cân nhắc có cần đổi chuẩn gate (vd: cho phép O8 sau waiter hết hạn mà không cần lượt yên khi T4 0 attempt, với nhãn riêng) hay giữ nguyên. **Quy tắc mới T8-156: sau reboot giữa phiên, rebuild/kiểm fixture /tmp ngay khi waiter khởi động lại (F-155-T8-4); kiểm hằng WAIT1 trong extract script ngay khi copy (F-155-T8-6).**
7. **Checklist (o) ĐÃ ĐÓNG (F-155-T8-5)** — cả hai symlink diag trỏ 155, giữ qua reboot #50. T0-156 cân nhắc sửa hằng `DIAG137_SCRIPT` về 1 mối duy nhất.
8. **RAM avail min 622 MB + balloon max 91,1% (cửa sổ harness lần 2) — chờ T9 đối chiếu** (F-155-T8-8); chuỗi ghim trần phán bằng sampler T9 (giao T10); balloon gần trần lúc mở phiên trên boot #49 (95,0%) và lúc tự kiểm postboot (97,0%) cần T9 đối chiếu với sampler toàn đợt.
9. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-155 xác nhận số lần — lần thứ 9 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận.

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 155 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154) — 0 KẸT, CHUỖI 1 → 2 (TIẾP TỤC)

## B1. Trạng thái giả thuyết sau đợt 155 (đứng nguyên — không mở giả thuyết mới)

| Giả thuyết | Trạng thái đợt 154 | Trạng thái đợt 155 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — CHỈ GIÁM SÁT THỤ ĐỘNG, 0 KẸT MỚI (xem B3)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — không có kẹt mới để đối chiếu)** |

- Đợt 155 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o): **0 kẹt trong 6 lần chạy harness lần 2 + 0 kẹt trong 3 lần chạy O8**. Không có chữ ký kẹt mới; không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 622 MB trong cửa sổ harness lần 2 + balloon max 91,1% — cửa sổ "nặng" hơn đợt 154 (564 MB / 91,9%, 0 kẹt) về RAM avail nhưng NHẸ hơn về balloon — và đợt này 0 kẹt. H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-156 đối chiếu tiếp. (Lần 1 exit 2 do thiếu fixture không phải kẹt — không đếm vào tương quan này.)

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 155

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–155) + đường ổn định `t8-diag-stall.sh` → 155 (CẢ HAI symlink cập nhật 14:40Z; kiểm cuối vẫn trỏ 155 — xem F-155-T8-5) | 6 lần chạy harness lần 2 hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–155) | 6 lần chạy harness lần 2; `live_diags=0` cả 6 lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không lần chạy nào im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler lần 2 (n=33 mẫu hợp lệ) | Balloon n=33 pinned=0 min=4.890.064 max=5.873.104 (91,1% trần) mean=5.364.727; avail min=622 MB lúc 16:46:26Z (trong lúc chạy 86n2 WebKit); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness lần 2 (nhưng balloon ĐÃ gần trần 97,0% lúc tự kiểm postboot 16:30Z — xem F-155-T8-3) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 16:48:06Z), 85m4 PASS (exit 0, 16:50:31Z), 86n2 PASS (exit 0, 16:54:37Z)** | N cộng dồn **N=17 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** | Baseline: dmesg EPERM tái xác nhận; journalctl -k "-- No entries --" / rỗng; không có snapshot timeout124/live-diag nào đợt này |

## B3. Chữ ký kẹt — đợt 155: 0 KẸT (85m4 HẾT KẸT GIỮ ĐỢT THỨ 2)

- **Đợt 155: 0 KẸT THẬT.** WebKit 85m4 PASS đủ P1–P5 lần 2 (P1 sync 0,7 s, HB128 chảy suốt P1-phaseA n=16→46 trong 15 s đầu; P4 2,0/4,4/1,3 s; P5 40 s 0 restart, seek kẹt dài nhất 1 mẫu ~0,2 s). Không có evaluate im lặng nào >60 s (0 WATCHDOG-137), không có khoảng im lặng log nào >120 s (0 live-diag), không có exit 124 nào.
- **Đối chiếu với kẹt đợt 153 (85m4 P1-phaseA, chữ ký sớm nhất):** đợt 153 kẹt ngay evaluate đầu P1-phaseA, trước HB128 đầu tiên (P1 sync 10:37:00.215Z rồi im lặng hoàn toàn); đợt này P1-phaseA chạy xong với HB128 n=16→63, P1 PASS 16:40:41Z. Cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), khác boot (#50 vs #46) và khác cửa sổ RAM (avail min 622 MB vs 306 MB; balloon max 91,1% vs 96,3%) — chỉ là tương quan quan sát được trong 1 lần chạy; H1 đã bác bỏ, H3 chỉ giám sát thụ động.
- **Không có điểm pha nào khác "nóng" đợt này:** 84l10/86n2 WebKit + cả 3 pha Chromium đều PASS đủ P1–P5 lần 2 (trừ ghi chú Chromium 84l10 W1 trôi +1 và E4 `ended=true` — xem F-155-T8-7, không phải kẹt, không phải FAIL). Lần 1 exit 2 do thiếu fixture không phải kẹt (xem F-155-T8-4).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 155: 0 KẸT, CHUỖI 1 → 2 (TIẾP TỤC)

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
- Đợt 155: **6 lần chạy harness LẦN 2 hoàn thành, 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 16:39:49Z, 85m4 PASS 16:42:25Z, 86n2 PASS 16:46:40Z; Chromium 84l10 PASS 16:48:06Z, 85m4 PASS 16:50:31Z, 86n2 PASS 16:54:37Z — tất cả exit 0, report `ok=true`). Chuỗi **1 → 2 (TIẾP TỤC)**. (Lần 1: 0 lần chạy hoàn thành — 6/6 exit 2 do thiếu fixture sau reboot #50, KHÔNG ĐẾM.)
- **Mười lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần) + đợt 150 (2 lần) + đợt 151 (2 lần) + đợt 153 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=17 mỗi pha tới đợt 155, 0 kẹt).

## B5. Yếu tố chung khác — đợt 155: #24 KHÔNG CÓ lượt hợp lệ (T4 0 attempt); reboot #50 giữa phiên; replay tới sau repair của T5

- T4 đợt này: **KHÔNG CÓ lượt hợp lệ — 0 attempt** (poller hết hạn 16:30Z; gate A không mở lúc hết hạn, RAM 529 MB < 1024; attempt2 trên boot cũ bị reboot #50 giết giữa chừng). O8/harness chạy theo THỦ TỤC (i) sau waiter hết hạn (không phải gate chuẩn, không sau lượt yên — xem F-155-T8-3). Kẹt probe T4 (nếu có) và kẹt harness T8 (evaluate im lặng) là hai chữ ký khác nhau — đừng gộp thành một lỗi; đợt này T4 0 attempt (không có probe nào để kẹt), T8 0 kẹt thật.
- Reboot #50 giữa phiên (15:04:07Z, giết waiter + attempt2 T4). Boot #50 ổn định suốt O8 + harness lần 2 (16:31–16:54Z).
- Replay apt: VẮNG lúc mở trên boot #50, TỚI SAU REPAIR của T5 (dpkg.log 2 → 795, POSTBOOT_PASS) — T5 theo dõi đợt 156.
- Vite server còn sống lúc chạy (không có kẹt để đối chiếu) — không có bằng chứng mới về vite trong đợt này.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, wedge "chết lặng" — giám sát thụ động đợt 155, 0 kẹt thật mới, chuỗi 1 → 2 (tiếp tục).
- **H3-D1: BÁC BỎ (đứng nguyên, đợt 151; khẳng định lại đợt 153 — không có kẹt mới đợt này để đối chiếu).**
- **O8 WebKit đợt 142 đã kết luận xong ở đợt 143; đợt này O8 PASS 3/3 thường kỳ, SAU WAITER HẾT HẠN 16:30Z, KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO — chuỗi FULL PASS 11 → ? (chờ T10/parent phán).** Không mở điều tra mới về O8.
- **Lượt yên #24 KHÔNG CÓ lượt hợp lệ — gate harness đợt này theo THỦ TỤC (i), không phải gate chuẩn, không sau lượt yên.** Parent phán xem nhãn này có đủ chuẩn để tính chuỗi FULL PASS hay không (xem §9.1/§9.6).

### B6a. Giám sát thụ động đợt 155 — 0 kẹt, không có chữ ký mới

Theo quyết (f), T8-155 chỉ ghi nhận chữ ký kẹt nếu kẹt tái diễn. Kết quả: 0 kẹt thật trong 6 lần chạy harness lần 2 (85m4 WebKit HẾT KẸT giữ đợt thứ 2 — P1-phaseA chạy xong với HB128 chảy suốt, khác hẳn chữ ký sớm nhất đợt 153) + 0 kẹt trong 3 lần chạy O8. Không có bảng đối chiếu wedge mới đợt này (không có snapshot trong lúc kẹt — vì không có kẹt). Nếu đợt 156 kẹt lại ở cùng điểm P1-phaseA sớm thì T8-156 ghi nhận thành mẫu tái diễn; quyết đóng/mở lại điều tra là việc parent.

---

## Phụ lục — số liệu trích bằng script từ log gốc (không gõ tay)

Script: `hidden_files/round155-t8/extract-155t8.py` (chạy ~16:55Z, output đầy đủ tại `hidden_files/round155-t8/smoke/extract-155t8-output.txt`). Mọi số dưới đây đều là output của script đó, đọc từ file gốc.

- Harness lần 2 (từ `smoke/run-webkit-summary.txt`): WebKit 84l10 start 16:38:29Z exit 0 end 16:39:49Z live_diags=0; WebKit 85m4 start 16:40:04Z exit 0 end 16:42:25Z live_diags=0; WebKit 86n2 start 16:42:40Z exit 0 end 16:46:40Z live_diags=0; Chromium 84l10 start 16:46:56Z exit 0 end 16:48:06Z live_diags=0; Chromium 85m4 start 16:48:21Z exit 0 end 16:50:31Z live_diags=0; Chromium 86n2 start 16:50:46Z exit 0 end 16:54:37Z live_diags=0. ALL DONE 16:54:37Z, ec webkit 0/0/0, chromium 0/0/0.
- Report JSON lần 2 (6 file): 6× `ok=true` (WebKit 84l10 finishedAt 16:39:40.079Z; WebKit 85m4 16:42:21.646Z; WebKit 86n2 16:46:39.903Z; Chromium 84l10 16:47:56.703Z; Chromium 85m4 16:50:23.991Z; Chromium 86n2 16:54:33.161Z).
- O8 JSON stamped (3 file): WebKit attempt1 `o8w-clicktest-report-2026-11-20T16-31-33-d849728b-pid29377.json` 21/21 md5 `a10a1004`; WebKit attempt2 `o8w-clicktest-report-2026-11-20T16-32-37-d849728b-pid29891.json` 21/21 md5 `1b9b09aa`; Chromium `o8-clicktest-report-2026-11-20T16-33-32-d849728b-pid30295.json` 21/21 md5 `f448ffd1`.
- O8 log: PASS S1 6 dòng, FAIL S1 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0; `O8 DONE 2026-11-20T16:34:28Z webkit1=0 webkit2=0 chromium=0`.
- Sampler lần 2 (n=33 mẫu hợp lệ): balloon min 4.890.064 / max 5.873.104 (91,1% trần) / mean 5.364.727, pinned=0; avail min 622 MB @16:46:26Z / max 1.634 MB.
- Watchdog/live-diag: WATCHDOG-137 trong summary 0, LIVE-DIAG-155 trong summary 0, WATCHDOG-137 trong log 85m4 0, probe TIMEOUT 30s False; stall dirs [].
- MD5 cây lúc đóng: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093, 84l10 b8c08a7c, 85m4 610ee003, 86n2 628088bd, O8w 4994b4fc, O8h c8acd72e.
- Waiter: lần 1 (boot 12fc68a3): 23 poll, GATE-FOUND False, WAIT-DEADLINE False (chết theo reboot #50); lần 2 (boot d849728b): 84 poll + WAIT-DEADLINE poll 85 16:30:26Z, GATE NOT MET; t4=1: KHÔNG CÓ dòng nào; postboot=1: 64 dòng (lần 2).
- Kiểm cuối: boot d849728b, btime 1795187047; ps sót 0; X11 files 0; lock TRỐNG, 0 ticket + 101 cooldown; symlink repo + hidden-root đều → `round155-t8/diag-stall-155t8.sh`.
- Oversize: 86n2 script 39.194 B (>37.768 B); 84l10 32.680 B; 85m4 37.111 B.
