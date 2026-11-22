# Đợt 152 T8 — O8 PASS 3/3 SAU LƯỢT YÊN HỢP LỆ #20 (QUA GATE CHUẨN (i)) + HARNESS 6/6 PASS TRONG MỘT LẦN CHẠY, 0 KẸT — 85m4 HẾT KẸT, CHUỖI "P3 KHÔNG KẸT" 0 → 1

Ngày: 20/11/2026 (lượt cron 12:35 +07 = 05:35:51Z; T8 mở ~05:37Z, đóng ~06:4xZ). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU LƯỢT YÊN HỢP LỆ #20, QUA GATE theo chuẩn đứng quyết (i); (2) harness đứng — 1 lần chạy driver, 6/6 PASS (WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2), 0 kẹt; (3) watchdog GIỮ NGUYÊN bản vá đợt 142, 0 kích hoạt (đúng — không có kẹt, không false-positive); (4) H3: CHỈ GIÁM SÁT THỤ ĐỘNG (quyết parent (f) đợt 151 — H3 thu hẹp thành wedge "chết lặng", H3-D1 đã bác bỏ; KHÔNG mở giả thuyết phân biệt mới — đợt này 0 kẹt nên không có chữ ký mới để đối chiếu). (5) F-151-T10-2: T0-152 ĐÃ SỬA xong lỗi JSON O8 ghi đè trong phiên (webkit `ecbd1b40` → `4994b4fc`, headed `8911ad3d` → `c8acd72e`) — kiểm chứng live: 2 file JSON stamped riêng biệt cho 2 attempt WebKit (xem §A); driver T8 vẫn copy thêm JSON riêng sau mỗi attempt (dự phòng kép).
Nợ: docs/PHASE9_ROUND151_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 sau lượt yên hợp lệ #19, QUA GATE chuẩn (i); harness 2 kẹt thật 85m4; reboot #42 giữa harness; H3-D1 BÁC BỎ; chuỗi FULL PASS 8 → 9); aggregate đợt 151 §11, §12.3 parent (a)–(x) (quyết (f) H3 chỉ giám sát thụ động đợt 152; quyết (o) checklist symlink mở đợt; quyết (i) mẫu xử lý reboot/mù).

## 0. Kết luận ngắn — O8 PASS 3/3 SAU LƯỢT YÊN HỢP LỆ #20, HARNESS 6/6 PASS, 0 KẸT, 0 REBOOT GIỮA HARNESS

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (06:14:27–06:17:18Z, 2'51", boot `18e179e0`, cùng cây preview.tsx `530e10a7` + script O8 ĐÃ SỬA bởi T0-152 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 06:14:43 + 06:15:42, Playwright mouse click lần 2; Chromium: 06:16:xx, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 2 file stamped riêng biệt cho 2 attempt WebKit, F-151-T10-2 ĐÓNG live — xem F-152-T8-4). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: QUA GATE THEO CHUẨN ĐỨNG QUYẾT (i) — LẦN THỨ HAI LIÊN TIẾP (151, 152).** T4-152 có lượt yên hợp lệ mới #20 (attempt1 20/20 + lớp B 5/5 + tickCost median 60,0 ms ≤60 ĐÚNG NGƯỠNG, n=489); cờ `round152-t4.done` viết 06:14Z; waiter T8 GATE-FOUND poll 34 lúc 06:13:24Z (t4=OK + postboot đường (a) `round152-t5/POSTBOOT_PASS` 05:58:52Z poll=1 sau repair sớm 05:46:03Z của T5); O8 bắt đầu 06:14:27Z, harness bắt đầu 06:17:33Z — CẢ HAI SAU CỜ T4 VÀ SAU LƯỢT YÊN HỢP LỆ. **Nhãn trích: "harness sau lượt yên hợp lệ #20" — ĐÚNG CHUẨN (i), không cần nhãn lệch chuẩn.**
- **Chuỗi WebKit FULL PASS: 9 → 10 (chờ T10 xác nhận độc lập lúc đóng sổ)** — O8 WebKit 21/21 ×2 đợt này trên boot `18e179e0`, sau lượt yên hợp lệ #20.
- **Harness: 6/6 PASS TRONG MỘT LẦN CHẠY DRIVER DUY NHẤT, 0 KẸT** (06:17:33–06:33:45Z, boot `18e179e0`, system libs sau repair của T5): WebKit 84l10 PASS (06:17:37–06:18:57) + 85m4 PASS (06:19:12–06:21:32) + 86n2 PASS (06:21:48–06:25:48) + Chromium 84l10 PASS (06:26:03–06:27:14) + 85m4 PASS (06:27:29–06:29:39) + 86n2 PASS (06:29:55–06:33:45). Cả 6 report JSON `ok=true` (kiểm độc lập bằng python). **85m4 PASS — đứt chuỗi kẹt 3/4 lần chạy gần nhất** (150-lần1, 151-lần1, 151-lần2 kẹt; chỉ 150-lần2 PASS trước đó). **Chuỗi "P3 không kẹt": 0 → 1 (BẮT ĐẦU LẠI).**
- **REBOOT: 0 reboot trong phiên T8** (boot `18e179e0` ổn định suốt 05:37–06:34Z; reboot #43 xảy ra TRƯỚC phiên, xem F-152-T8-1).
- **Watchdog: 0 kích hoạt, 0 false-positive** (đúng — không có kẹt nào để bắt; (1b) live-diag 0 kích hoạt cả 6 lần chạy, đúng thiết kế).
- **Balloon trong cửa sổ harness T8: 0 mẫu ghim trần** (n=33, max 5.662.592 kB = 87,9% trần — thấp hơn hẳn 99,0% đợt 151). Sampler T8 chỉ đối chiếu trong cửa sổ harness, không phán chuỗi.
- **RAM avail min trong cửa sổ harness: 677 MB (06:29:04Z)** — cao hơn hẳn 253 MB đợt 151 và 272 MB đợt 148 theo sampler T8 (chờ T9 đối chiếu bằng sampler toàn đợt).
- **T8 ĐÓNG ~06:4xZ — TRONG hạn cờ ~08:00Z, trước hạn cứng 08:30Z.**

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 05:20:57 | REBOOT #43 (chờ T2-152 xác nhận số) — boot `fad2aab9` → `18e179e0`, btime /proc/stat 1795152057, TRƯỚC phiên đợt 152 (lượt cron 05:35:51Z) |
| ~05:37 | T8 mở: RAM avail ~1.152 MB lúc mở (free -m), balloon 2.677.596 kB lúc 05:40Z; đọc LIMITS T8-151 + aggregate 151 §12.3 (f)(o); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 151 (không đổi — T0 chưa sửa O8 lúc đó) |
| 05:39 | **CHECKLIST (o): dựng thư mục `round152-t8`, copy script 151→152, cập nhật symlink `t8-diag-stall.sh` → `round152-t8/diag-stall-152t8.sh` NGAY (trước mọi lần chạy)** |
| 05:39 | Driver O8 vá giữ JSON riêng từng lần chạy (copy `o8w-clicktest-report.json` → `...-attempt1.json` / `...-attempt2.json` ngay sau mỗi attempt; Chromium → `o8-clicktest-report-chromium.json`) — dự phòng F-151-T10-2, vì T0-152 chưa sửa xong script gốc lúc T8 mở (md5 `ecbd1b40` không đổi) |
| 05:40:19 | Waiter T8 bắt đầu (deadline 07:30Z, khớp poller T4-152); poll 1: t4=0 postboot=0 |
| 05:39:57 | T4-152 mở poller (deadline thật 07:30Z trong script; dòng header log ghi 04:30Z là literal cũ, không phải deadline thật); poll #1 (test): gate0=khong-dat — postboot FAIL (thiếu 5 lib, không có thư mục GST, dpkg 2 dòng, cache 0 .deb — replay chưa tới trên boot `18e179e0`); RAM 3.992 MB; load1 6,92 |
| 05:46:03 | **T5-152 REPAIR SỚM** (quyết (h)): dpkg 2 → 795 dòng, cache 110 .deb; postboot PASS poll1 độc lập |
| 05:53 | **T0-152 ĐÓNG**: sửa xong F-151-T10-2 — O8 webkit `ecbd1b40` → `4994b4fc`, headed `8911ad3d` → `c8acd72e` (mỗi lần chạy ghi JSON riêng stamped+boot+pid) |
| 05:58:52 | T5-152 viết cờ `POSTBOOT_PASS` poll=1 cho boot `18e179e0` |
| 05:59:46 | T4-152: cửa mở poll #25 (postboot đường (a) đạt) |
| 06:13:24 | **Waiter GATE-FOUND poll 34 (t4=OK + postboot đường (a))** — O8/harness được chạy theo chuẩn (i) |
| 06:14 | **T4 viết cờ `round152-t4.done`: #22 CÓ LƯỢT HỢP LỆ MỚI #20** (attempt1 20/20, median 60,0 ms ĐÚNG NGƯỠNG, lớp B 5/5) |
| 06:14:17 | Fixture REBUILD sau gate: 6/6 md5 khớp đợt 125 |
| 06:14:27–06:17:18 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — SAU lượt yên hợp lệ #20 |
| 06:17:33–06:33:45 | **Harness lần 1 (duy nhất), WebKit + Chromium qua system libs: 6/6 PASS, 0 kẹt** (xem §2) |
| ~06:34–06:4x | Kiểm cuối + LIMITS + stage file + cờ `round152-t8.done` |

## A. O8 — PASS 3/3 trên boot `18e179e0`, SAU LƯỢT YÊN HỢP LỆ #20 (QUA GATE CHUẨN (i))

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 06:14:27–06:15:28 | 0 | **21/21 PASS** — S1 PASS 06:14:43 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 06:15:28–06:16:25 | 0 | **21/21 PASS** — S1 PASS 06:15:42, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 06:16:25–06:17:18 | 0 | **21/21 PASS** — S1 PASS, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-20T06-14-28-18e179e0-pid39105.json` 21 kết quả `ok=true` 21/21; attempt2 `o8w-clicktest-report-2026-11-20T06-15-29-18e179e0-pid39569.json` 21/21 `ok=true` — **HAI FILE STAMPED RIÊNG BIỆT, F-151-T10-2 ĐÓNG LIVE** (xem F-152-T8-4); Chromium `o8-clicktest-report-2026-11-20T06-16-26-18e179e0-pid39921.json` 21/21 `ok=true`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng khối `run`). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8.
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã có trên boot `18e179e0` sau repair của T5). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
- Driver O8 giữ 1 lock vite `t8-round152` suốt lượt (nhả 06:17:18Z; vite sau release curl 5560/5554 — xem log `o8-152t8.log`).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-152t8.mjs`, `node --check` OK — bản copy từ 151, chưa dùng) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 9 → 10 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 151 = 9; đợt này T8 pass 21/21 ×2 trên boot `18e179e0`, sau lượt yên hợp lệ #20.
- **O8 đợt này 2'51" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — 1 lần chạy driver duy nhất, 6/6 PASS, 0 kẹt

### Lần 1 (duy nhất) — boot `18e179e0`, 06:17:33–06:33:45Z, system libs sau repair của T5

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 06:17:37–06:18:57 | **PASS** — report `ok=true` (W1 3/3 delta +1 sạch 0→1/1→2/2→3, W2 PASS, E4 PASS) |
| 2 | WebKit 85m4-hb128 | 0 | 06:19:12–06:21:32 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,3/1,3/1,3 s; P5 PASS 40 s 0 restart) |
| 3 | WebKit 86n2 | 0 | 06:21:48–06:25:48 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,3/1,3/1,3 s; P5 PASS 40 s 0 restart) |
| 4 | Chromium 84l10 | 0 | 06:26:03–06:27:14 | **PASS** — report `ok=true` (W1 3/3 delta +1; W2 PASS, E4 PASS — xem F-152-T8-5 về trôi đếm giữa các lần) |
| 5 | Chromium 85m4 | 0 | 06:27:29–06:29:39 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 1,0/1,0/1,0 s; P5 PASS 40 s 0 restart) |
| 6 | Chromium 86n2 | 0 | 06:29:55–06:33:45 | **PASS** — report `ok=true` (P1/P2/P3 PASS; P4 3/3 PASS, đồng bộ 0,5/1,0/1,0 s; P5 PASS 40 s 0 restart) |

- 6 report JSON `ok=true` (kiểm độc lập bằng python, `finishedAt` khớp cửa sổ chạy từng pha: WebKit 06:18:48/06:21:26/06:25:44Z; Chromium 06:27:04/06:29:32/06:33:41Z).
- Môi trường lần 1: system libs sau repair sớm của T5 (libevent + libgstreamer đã cài `ii`; GST thư mục thật 269 file; dpkg 795 dòng; cache 110 .deb; POSTBOOT_PASS T5 05:58:52Z poll=1). **WebKit launch THÀNH CÔNG cả 3 pha bằng system libs** — không cần lần chạy DEBROOT thứ hai (khác đợt 149/151).
- Fixture REBUILD sau gate (06:14:17Z): 6/6 md5 khớp đợt 125 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- **85m4 PASS lần này — kẹt KHÔNG tái diễn ở cùng workload đã kẹt 3/4 lần chạy gần nhất** (P1-phaseA đợt 150, P5-phaseB-long đợt 151-lần1, P1-waitForPlaySync đợt 151-lần2). Điểm khác biệt duy nhất ghi nhận được trong cửa sổ harness: RAM avail min 677 MB (cao hơn hẳn 253 MB đợt 151) + balloon max 87,9% trần (thấp hơn 99,0% đợt 151) — chỉ là tương quan quan sát được, KHÔNG kết luận cơ chế (H1 đã bác bỏ; H3 chỉ giám sát thụ động — xem Phần B).
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn đã đủ 6/6) — ghi rõ để T10 không tìm log lần 2.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT, 0 FALSE-POSITIVE

- **Watchdog (i): 0 kích hoạt** — không có kẹt nào (evaluate không im lặng >60 s ở bất kỳ pha nào); 0 dòng `WATCHDOG-137` trong summary + 6 log chạy harness + log O8.
- **Driver (1b) live-diag: 0 kích hoạt** — `live_diags=0` cả 6 lần chạy (đúng thiết kế; không có khoảng im lặng log >120 s).
- **0 false-positive cả lượt.** 6 lần chạy harness + 3 lần chạy O8: 0 dòng `WATCHDOG-137`.
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–151 §12.3(l)). Đợt này là lần đầu tiên kể từ đợt 147 watchdog 0 kích hoạt trong một đợt có đủ 6 lần chạy harness (đợt 148: 1; 149: 0 nhưng harness dở dang nhiều lần; 150: 2; 151: 2).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–152) + đường ổn định `t8-diag-stall.sh` → 152 (symlink cập nhật 05:39Z, TRƯỚC mọi lần chạy) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt, 0 false-positive** | **ĐÚNG — KHÔNG CÓ KẸT ĐỂ BẮT.** Không có thư mục `smoke/stall-*` nào (đúng — 0 kẹt); checklist (o) không được kiểm chứng bằng kẹt thật đợt này (không có kẹt), chỉ kiểm chứng symlink trỏ đúng bằng `readlink` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–152) | 6 lần chạy harness; `live_diags=0` mọi lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không có khoảng im lặng log >120 s) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-152t8.sh` (cột `balloon_kb`) | 1 log sampler (n=33) | Balloon n=33 pinned=0 min=4.727.336 max=5.662.592 (87,9% trần); avail min=677 MB (xem F-152-T8-6); **0 mẫu ghim trần 6.443.824 kB** |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 06:27:14Z), 85m4 PASS (exit 0, 06:29:39Z), 86n2 PASS (exit 0, 06:33:45Z)** | N cộng dồn **N=14 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** (đúng — không có kẹt) | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | ecbd1b40 | 4994b4fc | **CÓ — T0-152 sửa F-151-T10-2 (JSON riêng từng lần chạy, +23 dòng), ĐÓNG 05:53Z; không phải T8 sửa** |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | 8911ad3d | c8acd72e | **CÓ — T0-152 sửa F-151-T10-2 (+24 dòng), ĐÓNG 05:53Z; không phải T8 sửa** |

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi nhỏ so với đợt 151: nhãn log `LIVE-DIAG-151` → `LIVE-DIAG-152`, deadline waiter 04:30Z → 07:30Z (khớp poller T4-152), lock `t8-round151` → `t8-round152` — chỉ chuỗi/hằng số trong bản copy, không chạm script repo. Thêm mới: driver O8 copy JSON riêng từng attempt (dự phòng kép cho bản sửa T0 — xem F-152-T8-4); các bản copy driver Chromium-only + debroot giữ nguyên mẫu 151 (đổi nhãn 151→152), KHÔNG dùng đợt này.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round152` 06:17:18Z; driver harness đã nhả lock sau mỗi lần chạy (xem summary: released từng pha, exit 0 cả 6).
- Kiểm cuối ~06:34Z: process Xvfb/MiniBrowser/WebKit/Chromium còn sót: 0; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown); boot `18e179e0` ổn định (btime 1795152057 không đổi).
- `/tmp/.X11-unix/` còn 1 socket X193 (tạo 05:59Z, 0 process Xvfb đang chạy) — KHÔNG phải của T8 (T8 dùng :199 harness, :188 O8-WebKit, :197 O8-Chromium — cả ba đã dọn socket của mình); socket mồ côi của luồng khác trong đợt (T1 suite hoặc T4 attempt lúc 05:59Z) — T8 không dọn socket không phải của mình, ghi nhận để T10/T1 đối chiếu.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này LÀ 6/6 trong MỘT lần chạy driver duy nhất** (06:17:33–06:33:45Z, 1 boot, system libs) — khác đợt 150/151 (cộng 2 lần chạy, 2 boot). Trích đúng: "harness 6/6 PASS một lần chạy, 0 kẹt".
2. **Gate đợt này QUA GATE THEO CHUẨN (i) — trích là "harness sau lượt yên hợp lệ #20"** (T4 flag 06:14Z; waiter GATE-FOUND 06:13:24Z; O8 06:14:27Z; harness 06:17:33Z). Lần thứ hai liên tiếp qua gate đúng chuẩn (151, 152).
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã có trên boot `18e179e0` sau repair của T5. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness lần 1 (standard driver, không LD_LIBRARY_PATH).
4. **Chuỗi WebKit FULL PASS = 10 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này (trên boot `18e179e0`, sau lượt yên hợp lệ #20). Chuỗi này đếm O8, không bị kẹt harness làm đứt (đợt này 0 kẹt).
5. **Chuỗi "P3 không kẹt" 0 → 1 (BẮT ĐẦU LẠI):** đợt này 6 lần chạy harness, 0 kẹt — lần đầu có đợt sạch hoàn toàn kể từ đợt 147 (đợt 148: 1 kẹt; 149: 0 kẹt nhưng harness dở dang nhiều lần; 150: 2 kẹt; 151: 2 kẹt). Một đợt sạch CHƯA chứng minh H3 đã hết — chỉ ghi nhận chuỗi bắt đầu lại.
6. **85m4 PASS đợt này không chứng minh cơ chế kẹt đã hết** — RAM/balloon trong cửa sổ harness tốt hơn đợt 151 (avail min 677 vs 253 MB; balloon max 87,9% vs 99,0%) chỉ là tương quan quan sát được trong 1 lần chạy; H1 đã bác bỏ, H3 chỉ giám sát thụ động (xem Phần B). Đừng trích "kẹt đã sửa" — không có code nào sửa kẹt trong đợt này.
7. **Balloon KHÔNG ghim trần trong cửa sổ harness T8** (0 mẫu ghim, n=33, max 87,9% trần) — nhưng sampler T8 chỉ phủ cửa sổ harness; chuỗi ghim trần phán bằng sampler T9 (giao T10).
8. **RAM avail min 677 MB (06:29:04Z, trong lúc Chromium 85m4 P5)** — cao hơn hẳn kỷ lục thấp 250.840 kB đợt 151 theo sampler T9; chờ T9 đối chiếu bằng sampler toàn đợt trước khi kết luận gì về RAM phiên.
9. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–152 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn. O8 webkit sau sửa T0: kiểm kích thước lúc push (T0 báo +23 dòng — T10 kiểm lại).
10. **Chromium 84l10 W1: trôi đếm +1 giữa các lần** (lần1 0→1, lần2 2→3, lần3 4→5 — xem F-152-T8-5): artifact test đã biết cùng họ với trôi +2 các đợt 146–151, không phải FAIL (W1 vẫn PASS delta +1 mỗi lần; W2/E4 PASS). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3).

## 8. Sai số mới (F-152-T8-N)

- **F-152-T8-1 — REBOOT #43 TRƯỚC PHIÊN (chờ T2-152 xác nhận số):** btime /proc/stat 05:20:57Z (epoch 1795152057); boot `fad2aab9` (btime 03:25:16Z, reboot #42) → `18e179e0`; boot cũ sống 7.161 s (03:25:16Z → 05:20:57Z, stat→stat). Reboot xảy ra ~15 phút TRƯỚC lượt cron 05:35:51Z — giữa hai đợt, không cắt ngang đợt 151 (đã đóng 05:05Z) cũng không cắt ngang đợt 152 (mở 05:35:51Z). Mù #75? (nếu #43 đúng số) giao T2-152/153 theo mẫu T10-148; T8 không tự chốt giây reboot. /tmp fixture MẤT theo reboot (rebuild sau gate 06:14:17Z, 6/6 md5 khớp). System libs vắng lúc mở (xem F-152-T8-2).
- **F-152-T8-2 — BOOT MỚI `18e179e0`: REPLAY CHƯA TỚI LÚC T8 MỞ (05:39–05:40Z, boot+19–20 phút), RỒI T5 REPAIR SỚM 05:46:03Z:** dpkg.log 2 dòng, cache 0 .deb, 5/5 lib thiếu, không có thư mục GST (postboot T4 FAIL 05:39:57Z; kiểm độc lập của T8: dpkg info 783 dòng — thấp hơn 1.545 dòng lúc replay xong đợt 151). T5-152 repair sớm theo quyết (h) lúc 05:46:03Z (dpkg 2 → 795, cache 110 .deb); POSTBOOT_PASS mới 05:58:52Z poll=1; cửa T4 mở poll #25 05:59:46Z. **Replay KHÔNG tới tự nhiên trên boot mới — lần thứ ba liên tiếp replay không tới tự nhiên mà cần repair** (đợt 150: không tới; đợt 151 boot mới `fad2aab9`: không tới; đợt 152: không tới). Harness lần 1 chạy bằng system libs SAU REPAIR — ghi rõ để T10 không trích là "replay tới tự nhiên".
- **F-152-T8-3 — HARNESS 6/6 PASS MỘT LẦN CHẠY, 0 KẸT — CHUỖI "P3 KHÔNG KẸT" 0 → 1:** lần đầu kể từ đợt 147 có đợt harness sạch hoàn toàn trong một lần chạy driver (đợt 149: 0 kẹt nhưng harness dở dang 3 lần chạy, 2 boot; đợt 150/151: 2 kẹt mỗi đợt). 85m4 PASS (P1–P5 đủ, P4 3/3 đồng bộ 1,3 s, P5 40 s 0 restart) — đứt chuỗi kẹt 3/4 lần chạy gần nhất của 85m4. 86n2 P4-lần2 PASS lần thứ 4 liên tiếp tính theo lần chạy có verdict (150-lần2, 151-lần2, 152-lần1; P4 đồng bộ 1,3/1,3/1,3 s). Watchdog 0 kích hoạt — không phải watchdog hỏng (đã bắt đúng 2 kẹt đợt 151); chỉ là không có kẹt để bắt. **Không kết luận H3 đã hết** — 1 đợt sạch chưa đủ; chuỗi cần nhiều đợt sạch liên tiếp mới có ý nghĩa (xem Phần B).
- **F-152-T8-4 — F-151-T10-2 (O8 JSON GHI ĐÈ) ĐÓNG LIVE — T0-152 SỬA XONG + T8 KIỂM CHỨNG ĐỘC LẬP:** T0-152 sửa 2 script O8 gốc trong phiên (webkit `ecbd1b40` → `4994b4fc` +23 dòng; headed `8911ad3d` → `c8acd72e` +24 dòng; `node --check` OK; cờ T0 05:53Z). Kiểm chứng live bằng O8 của T8: **2 file JSON stamped riêng biệt** cho 2 attempt WebKit (`...-06-14-28-...-pid39105.json` 21/21 + `...-06-15-29-...-pid39569.json` 21/21, pid khác nhau, khối `run` khác nhau) + 1 file Chromium riêng (`...-06-16-26-...-pid39921.json` 21/21). Bản copy dự phòng của driver T8 (`...-attempt1.json`/`...-attempt2.json`) khớp nội dung file stamped. **Lỗi ghi đè ĐÃ HẾT — từ đợt 152, T10 xác nhận O8 bằng file stamped, không cần dựa vào log text.** Lưu ý: driver T8 vẫn giữ copy dự phòng (không hại gì; nếu T0 đổi tên file lần nữa thì copy vẫn bám file tên cố định "latest").
- **F-152-T8-5 — CHROMIUM 84l10 W1 TRÔI ĐẾM +1 GIỮA CÁC LẦN (ARTIFACT ĐÃ BIẾT, KHÔNG PHẢI FAIL):** lần1 0→1, lần2 2→3, lần3 4→5 — đếm `restartEndedVideo` tăng +1 ngoài delta giữa các lần (1→2, 3→4), cùng họ trôi +2 các đợt 146–151 (đợt 151: lần1 +2). W1 vẫn PASS delta +1 mỗi lần; W2 PASS; E4 PASS (restartEndedVideo tại cuối 6 → sau 3 s 6, `ended=false` — khác WebKit `ended=true`, như các đợt trước). WebKit 84l10 W1 sạch hoàn toàn (0→1/1→2/2→3, không trôi). Ghi nhận để T10 không đọc trôi đếm thành FAIL.
- **F-152-T8-6 — RAM AVAIL MIN 677 MB + BALLOON MAX 87,9% TRẦN (CỬA SỔ HARNESS T8):** sampler T8 n=33 (06:17:33–06:33:45Z): avail min 677 MB lúc 06:29:04Z (trong lúc Chromium 85m4 P5); balloon min 4.727.336 / max 5.662.592 kB (87,9% trần); 0 mẫu ghim trần 6.443.824 kB. So với đợt 151 (avail min 253 MB, balloon max 99,0%): cửa sổ harness đợt này "nhẹ" hơn rõ rệt — tương quan duy nhất quan sát được với việc 0 kẹt (xem F-152-T8-3); KHÔNG kết luận cơ chế. Chờ T9 đối chiếu bằng sampler toàn đợt (phủ rộng hơn sampler T8) trước khi ghi là kỷ lục/mức mới.
- **F-152-T8-7 — HEADER LOG POLLER T4 GHI DEADLINE CŨ 04:30Z (LITERAL, KHÔNG ẢNH HƯỞNG):** dòng header `poll-wait-t4-152` ghi `deadline=2026-11-20T04:30:00Z` (copy từ đợt 151) trong khi deadline thật trong script là `DEADLINE_S=$(date -d '2026-11-20 07:30:00 UTC')` (dòng 57) và poller chạy đúng tới 07:30Z. T8 không sửa script T4; chỉ ghi nhận để T4-153 sửa literal header cho khỏi nhầm. Waiter T8 dùng deadline 07:30Z của mình, không đọc header T4.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi "P3 không kẹt" 0 → 1 (bắt đầu lại) — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (f)).** Một đợt sạch chưa đủ kết luận; nếu đợt 153 cũng 0 kẹt thì chuỗi lên 2.
2. **Chuỗi WebKit FULL PASS = 10 (chờ T10 xác nhận độc lập bằng JSON stamped lúc đóng sổ đợt 152, trên boot `18e179e0`, sau lượt yên hợp lệ #20).**
3. **Đối chứng Chromium cùng pha: N cộng dồn N=14 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **#22 CÓ LƯỢT HỢP LỆ MỚI #20 — ĐÓNG HAY VẪN MỞ?** (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng.) T4-152: attempt1 20/20 + lớp B 5/5 + median 60,0 ms ĐÚNG NGƯỠNG (n=489); cộng dồn (c2) P1 62/62, P2 53/53, P3-A1 55/62, P3' 32/34, P7 48/48 KHÔNG ĐỔI ((c2)=0 occurrence); median chain 20 lượt, tb ~49,5 ms. Lượt hợp lệ thứ hai liên tiếp (151: #19; 152: #20).
5. **Reboot #43 / mù #75? — giao T2-152/153** (btime 05:20:57Z stat; boot cũ sống 7.161 s; xử lý theo mẫu T10-148). Mù #74? (reboot #42) giao T2-152.
6. **Replay không tới tự nhiên lần thứ ba liên tiếp (F-152-T8-2)** — nợ T5-153 (repair sớm theo quyết (h) đã làm việc 3 đợt liên tiếp; T5 theo dõi xem replay tự nhiên có còn tới nữa không).
7. **RAM avail min 677 MB + balloon max 87,9% — chờ T9 đối chiếu** (F-152-T8-6); chuỗi ghim trần phán bằng sampler T9 (giao T10).
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-152 xác nhận số lần); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; socket X193 mồ côi (05:59Z, không phải của T8) — T1/T10 đối chiếu.
9. **F-152-T8-7 (header poller T4 ghi deadline cũ):** ghi vào checklist T4-153 — sửa literal header deadline cho khớp deadline thật trong script.

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 152 (quyết parent (f) đợt 151) — 0 KẸT, KHÔNG CÓ CHỮ KÝ MỚI

## B1. Trạng thái giả thuyết sau đợt 152 (đứng nguyên — không mở giả thuyết mới)

| Giả thuyết | Trạng thái đợt 151 | Trạng thái đợt 152 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — CHỈ GIÁM SÁT THỤ ĐỘNG, 0 KẸT ĐỢT NÀY** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151) | **BÁC BỎ (đứng nguyên, không kiểm lại)** |

- Đợt 152 T8 chỉ giám sát thụ động theo quyết (f): **0 kẹt trong 6 lần chạy harness + 3 lần chạy O8** nên không có chữ ký kẹt mới để đối chiếu với wedge "chết lặng", không có snapshot RSS/CPU trong lúc kẹt, không mở giả thuyết phân biệt mới. H3 vẫn mở vì 1 đợt sạch chưa đủ bằng chứng để đóng — cơ chế deadlock/IPC/GStreamer cụ thể vẫn chưa xác định.
- Điểm quan sát duy nhất (tương quan, không kết luận): cửa sổ harness đợt này "nhẹ" hơn đợt 151 (avail min 677 vs 253 MB; balloon max 87,9% vs 99,0% trần) và 85m4 không kẹt — xem F-152-T8-3/F-152-T8-6. H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-153 đối chiếu tiếp.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 152

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–152) + đường ổn định `t8-diag-stall.sh` → 152 (symlink cập nhật 05:39Z, TRƯỚC mọi lần chạy) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt).** 0 false-positive; không có thư mục `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–152) | 6 lần chạy harness; `live_diags=0` mọi lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không có khoảng im lặng log >120 s) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=33) | Balloon n=33 pinned=0 min=4.727.336 max=5.662.592 (87,9% trần); avail min=677 MB (xem F-152-T8-6); **0 mẫu ghim trần 6.443.824 kB** |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 06:27:14Z), 85m4 PASS (exit 0, 06:29:39Z), 86n2 PASS (exit 0, 06:33:45Z)** | N cộng dồn **N=14 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3 + đợt 148 §B3 + đợt 150 §B3 + đợt 151 §B3)

- **Đợt 152: 0 kẹt — không có chữ ký kẹt mới.** Không có dòng `WATCHDOG-137`, không có `sampleFor`/`waitForPlaySync` đóng băng, không có exit 124, không có probe timeout trong bất kỳ log nào (6 log harness + log O8 + summary). Mọi pha đều chạy tới `KẾT QUẢ: KHÔNG FAIL` + report JSON `ok=true`.
- Đối chiếu thụ động: 85m4 đợt này chạy đủ P1–P5 (P4 3/3 đồng bộ 1,3 s; P5 40 s 0 restart) — cùng workload đã kẹt ở P1 (đợt 151-lần2) và P5 (đợt 151-lần1) đều PASS lần này. Không có điểm pha nào "nóng" đợt này.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 152: 0 KẸT, CHUỖI 0 → 1 (BẮT ĐẦU LẠI)

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
- **Chín lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần) + đợt 150 (2 lần) + đợt 151 (2 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=14 mỗi pha tới đợt 152, 0 kẹt).

## B5. Yếu tố chung khác — đợt 152: #22 CÓ lượt hợp lệ #20; 0 reboot trong phiên; replay không tới tự nhiên (repair sớm)

- T4 đợt này: **CÓ lượt hợp lệ #20** (attempt1 20/20, median 60,0 ms ĐÚNG NGƯỠNG, lớp B 5/5) — lượt hợp lệ thứ hai liên tiếp (151: #19; 152: #20). Gate harness QUA CHUẨN (i) lần thứ hai liên tiếp. Kẹt probe T4 (nếu có) và kẹt harness T8 (evaluate im lặng) là hai chữ ký khác nhau — đừng gộp thành một lỗi; đợt này cả hai đều 0.
- 0 reboot trong phiên T8 (boot `18e179e0` ổn định 05:37–06:34Z); reboot #43 xảy ra trước phiên (05:20:57Z) — không cắt ngang gì.
- Replay apt: KHÔNG TỚI tự nhiên trên boot mới (dpkg 2 dòng, cache 0 lúc 05:39:57Z) rồi T5 repair sớm 05:46:03Z (dpkg 795, cache 110) — mẫu "replay chết" lần thứ ba liên tiếp (150, 151-boot-mới, 152); T5 theo dõi đợt 153.
- Vite server còn sống lúc chạy harness (vite-http 200 khi launch — các lần chạy đều exit 0 với report đầy đủ; không có chẩn đoán kẹt nào cần kiểm vite lúc kẹt vì 0 kẹt).

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, wedge "chết lặng" — chỉ giám sát thụ động đợt 152, 0 kẹt (xem §B1a dưới — không có gì để kiểm thêm đợt này).
- **H3-D1: BÁC BỎ (đứng nguyên, đợt 151).** Đợt này không kiểm lại (0 kẹt → không có quỹ đạo RSS/CPU trong lúc kẹt để đối chiếu).
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143; đợt này O8 PASS 3/3 thường kỳ, SAU LƯỢT YÊN HỢP LỆ #20, chuỗi FULL PASS 9 → 10 (chờ T10 xác nhận độc lập).** Không mở điều tra mới về O8.
- **Lượt yên #22 CÓ lượt hợp lệ mới #20 — gate harness đợt này QUA GATE theo chuẩn (i) lần thứ hai liên tiếp.** Không còn lệch chuẩn gate họ F-146/147/148/149/150 — chờ T4/T10 phán #22 đóng hay vẫn mở.

### B6a. Giám sát thụ động đợt 152 — không có gì để kiểm (0 kẹt)

Theo quyết (f), T8-152 chỉ ghi nhận chữ ký kẹt nếu kẹt tái diễn. Kết quả: 0 kẹt trong 6 lần chạy harness + 3 lần chạy O8 → không có snapshot watchdog-diag nào trong lúc kẹt, không có live-diag, không có probe timeout. Bảng đối chiếu wedge "chết lặng" đợt này TRỐNG (không có hàng dữ kiện mới). Việc duy nhất làm được là xác nhận âm tính: watchdog (i) + (1b) vẫn trực (0 kích hoạt khi 0 kẹt = đúng, không phải hỏng — đã bắt đúng 2 kẹt đợt 151 bằng cùng bản vá, cùng đường diag, cùng symlink đã cập nhật); 85m4 chạy đủ P1–P5 không đóng băng ở bất kỳ điểm nào đã kẹt trước đó (P1-waitForPlaySync, P5-phaseB-long). Nếu đợt 153 cũng 0 kẹt thì chuỗi "P3 không kẹt" lên 2 — vẫn chưa đủ để đóng H3; quyết đóng/mở lại điều tra là việc parent.
