# Đợt 149 T8 — O8 PASS 3/3 SAU CỜ T4 (TUÂN (j) LẦN ĐẦU) + HARNESS 6/6 TRÊN BOOT MỚI NHỜ DEBROOT — REBOOT #39 GIỮA HARNESS, #22 MỞ, CHUỖI GHIM TRẦN ĐỨT

Ngày: 19/11/2026 (lượt cron 03:35 +07 20/11 = 20:35:51Z; T8 mở ~20:40Z, đóng ~21:52Z — trải 2 boot: `70025d3e` rồi `802f358f` sau reboot #39 giữa phiên). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU cờ T4 theo quyết parent (j) đợt 147 / (c) đợt 148 (tuân từ đợt 149 trở đi); (2) harness đứng 6 lần — chạy SAU khi T4 đóng cờ (nhưng KHÔNG có lượt yên hợp lệ — xem F-149-T8-1); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert — đợt này nó KHÔNG nổ lần nào (0 kẹt). KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND148_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 TRƯỚC T4 — lệch (j) đã chấp nhận có điều kiện; harness 5/6, 86n2 WebKit kẹt thật, watchdog nổ lần đầu; #21 đóng); aggregate đợt 148 §7, §11, §12.1, §12.3 parent (a)–(o) (quyết (c) O8 sau cờ T4 từ đợt 149; quyết (h) #22 mở đợt 149; quyết (k) pixelate giao đợt 149 sửa + `npm test` vào suite đóng sổ T10).

## 0. Kết luận ngắn — O8 PASS 3/3 SAU CỜ T4, HARNESS 6/6 (3 LẦN CHẠY DRIVER, 2 BOOT), 0 KẸT, #22 MỞ

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (21:15:27–21:17:59Z, 2'32", boot `70025d3e`, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần (WebKit: 21:15:39 + 21:16:28, Playwright mouse click lần 2; Chromium: 21:17:29, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả hai engine (kiểm độc lập bằng python — WebKit chỉ 1 file JSON cho 2 attempt, như đợt 148; cả 2 attempt đều 21/21 trong log text). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL). **KHÔNG có điều tra lại** — O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143, đợt này chỉ kiểm lại thường kỳ.
- **Thứ tự O8 đợt này: CHẠY SAU CỜ T4 — TUÂN QUYẾT (j), LẦN ĐẦU KỂ TỪ KHI QUYẾT ĐƯỢC LÀM RÕ (F-149-T8-2).** Cờ T4 21:11Z; GATE-FOUND poll 28 lúc 21:11:36Z; O8 bắt đầu 21:15:27Z (3'51" sau gate), kết thúc 21:17:59Z. Không còn lệch chuẩn thứ tự như đợt 148. Lớp bảo vệ hạn (waiter deadline 22:15Z) KHÔNG phải kích hoạt (gate về sớm hơn deadline 63 phút).
- **Chuỗi WebKit FULL PASS: 6 → 7 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 148 = 6 (parent chấp nhận có điều kiện, O8 chạy sớm); đợt này T8 pass 21/21 ×2 trên boot `70025d3e`, chạy SAU cờ T4 nên không còn điều kiện lệch chuẩn nào gắn với O8 đợt này.
- **Lượt yên #22: MỞ — KHÔNG CÓ LƯỢT HỢP LỆ (cờ T4 21:11Z, poller exit 11).** A1 partial 4/20 exit 3 (pass 5 wedged, abort-3-timeout kích hoạt live lần đầu, 0 kẹt); A2 20/20 median 138,0 ms B VI PHẠM; A3 20/20 median 112,0 ms B VI PHẠM (load1 max 11,10). Cộng dồn KHÔNG ĐỔI 18 lượt hợp lệ (P1 52/52, P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38).
- **Gate harness đợt này LỆCH CHUẨN (F-149-T8-1 — họ F-146/147-T8-3):** harness chạy SAU khi T4 ĐÓNG (poller exit 11, 0 process T4), nhưng KHÔNG có lượt yên hợp lệ nào để trích — chuẩn (i) "sau lượt yên hợp lệ" KHÔNG thỏa. Ghi rõ để T10/parent phán, không trích là "gate sạch".
- **REBOOT #39 GIỮA HARNESS (F-149-T8-3):** btime /proc/stat 21:23:51Z (/proc/1 21:24:01Z — chênh 10 s, mẫu init-delay quen thuộc); boot `70025d3e` sống 4.998 s (20:00:33Z → 21:23:51Z, stat→stat); boot mới `802f358f`. Reboot giết driver harness lần 1 giữa lúc WebKit 86n2 đang chạy (bắt đầu 21:22:05Z, chết lúc ~1'46" sau khi bắt đầu — không có verdict pha nào). Lock vite stale được chính lock script dọn (owner pid chết + không vite trên cổng + curl 000 + boot đổi — kiểm chứng bằng acquire/release thử trước khi chạy lại).
- **Harness lần 2 trên boot mới: WebKit 0/3 — FAIL LÚC LAUNCH, KHÔNG PHẢI KẸT (F-149-T8-4).** Cả 3 lần đều `MiniBrowser: error while loading shared libraries: libevent-2.1.so.7: cannot open shared object file`, exit 127, chết sau ~10 s. Nguyên nhân môi trường: system libs (`libevent-2.1.so.7`, `libEGL.so.1`, `libavif.so.16`) + thư mục GST hệ thống đều vắng sau reboot #39; apt replay KHÔNG tiến triển (watcher T5 `replay-watch-boot2`: apt=[] dpkg=[] gst_sys=0 cache_deb=0 suốt 9+ phút). Chromium 3/3 PASS cùng boot (Chromium tự mang lib của nó).
- **Harness lần 3 (WebKit-only, DEBROOT — F-149-T8-5): WebKit 3/3 PASS exit 0** (21:38:35–21:46:39Z). `LD_LIBRARY_PATH` + `GST_PLUGIN_PATH/SYSTEM_PATH` trỏ sang debroot `/home/hatch/workspace/tmp-q6r3-debroot/...` (tiền lệ: script O8 tự đặt `LD_LIBRARY_PATH` với DEBROOT từ đợt 110 L8; debroot có đủ 269 plugin GST gồm isomp4/libav). 86n2 P4-lần2 — pha nóng đã kẹt ở đợt 141 + 148 — PASS lần này (đồng bộ 1,8 s, delta +1); P6 KHÔNG-KẸT 90 s.
- **Tổng kết harness đợt 149: 6/6 PASS trên boot `802f358f`** (3 WebKit qua DEBROOT + 3 Chromium qua system libs) **+ 2/2 WebKit PASS trên boot `70025d3e` trước reboot** (84l10 + 85m4 lần 1). **0 kẹt trong tất cả 8 lần chạy harness hoàn thành + 3 lần chạy O8** → chuỗi "P3 không kẹt" **0 → 1**.
- **Watchdog: 0 kích hoạt đợt này (F-149-T8-6/§3)** — 0 dòng `WATCHDOG-137`, 0 dòng `LIVE-DIAG-149` trong mọi log. Đúng thiết kế: không có kẹt nào để bắt; 3 lần launch FAIL không (và không nên) kích hoạt watchdog (chết ngay lúc launch, exit 127, không phải evaluate im lặng).
- **Chuỗi ghim trần balloon: ĐỨT (F-149-T8-7).** Sampler T8: **0/48 mẫu ghim trần** (max 6.040.412 kB = 93,7% trần 6.443.824 kB); sampler T9 (phủ toàn đợt) đối chiếu: **0/61 mẫu** (max 6.150.008 kB = 95,4%). Chuỗi mới (= 1 đợt, từ đợt 148) DỪNG ở 1 — không nối sang đợt 149. Sampler run 1 của T8 CHẾT theo reboot #39 (mẫu cuối đóng dấu 21:24:05Z, muộn hơn btime boot mới 14 s — nghịch lý đồng hồ cùng họ vụ 8 s đợt 148).
- **RAM avail min 467 MB** (run 2, 21:32:49Z) — chưa phá kỷ lục thấp 272 MB đợt 148.
- **T8 ĐÓNG TRƯỚC HẠN:** cờ ~21:52Z — TRƯỚC hạn cờ 23:00Z hơn 1 giờ.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 20:35:51 19/11 | Lượt cron 03:35 +07 mở đợt 149; boot lúc mở `70025d3e` (btime 20:00:33Z /proc/stat — reboot #38 trong lúc T10-148 đóng sổ) |
| ~20:40 | T8 mở: RAM avail 1.019 MB, balloon 5.968.920 kB; đọc LIMITS T8-148 + aggregate 148 §7/§11/§12.3 (qua MEMORY); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 148 (không đổi) |
| 20:44:20 | Waiter T8 bắt đầu (deadline 22:15Z trong bản copy đợt này); T4 đang chờ postboot (apt replay chưa xong, RAM ~800–900 MB) — T8 KHÔNG rebuild fixture lúc này để khỏi làm phiền phép đo yên |
| 20:48:18–20:52:35 | **T4 attempt1: partial 4/20, exit 3** (pass 5 wedged, abort-3-timeout kích hoạt live lần đầu, 0 kẹt) — không tính, retry 1→2 |
| 20:52–20:58:51 | **T4 attempt2: 20/20, median 138,0 ms, B VI PHẠM** (nhiễm tải) — không tính, retry 2→3 |
| 20:58–21:05:11 | **T4 attempt3: 20/20, median 112,0 ms, B VI PHẠM** (load1 max 11,10) — không tính, hết ngân sách 3/3 |
| 21:11 | **T4 ghi cờ `round149-t4.done`: #22 MỞ — KHÔNG CÓ LƯỢT HỢP LỆ** (poller exit 11) |
| 21:11:36 | **GATE-FOUND poll 28 — waiter exit 0** (t4=OK + postboot đường (a) T5 `POSTBOOT_PASS` cho boot `70025d3e`, t4attempt=no-lock); T4 đã đóng hẳn |
| ~21:14:5x | Fixture REBUILD lần 1 (sau cờ T4, trước O8): 6/6 md5 khớp đợt 125 — KHÔNG cần làm gì thêm |
| 21:15:27–21:17:59 | **Driver O8 chạy SAU cờ T4: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — tuân (j), không lệch chuẩn |
| 21:18:05–21:22:05 | **Harness lần 1 (boot `70025d3e`): WebKit 84l10 PASS + 85m4 PASS**, rồi 86n2 bắt đầu 21:22:05Z |
| 21:23:51 | **REBOOT #39** (btime /proc/stat; /proc/1 21:24:01Z) — giết driver harness lần 1 giữa 86n2 WebKit; boot mới `802f358f` |
| 21:24:45 | T8 kiểm: boot mới `802f358f`, uptime 0 phút, 0 process sót, lock vite stale (thread t8-round149, pid 59445 đã chết) |
| 21:25:58 | Kiểm chứng dọn lock stale: acquire thử THÀNH CÔNG ngay (lock script tự xóa lock stale vì boot đổi), release — lock TRỐNG |
| 21:26:05 | Fixture REBUILD lần 2 (sau reboot #39 — /tmp đã mất): 6/6 md5 khớp đợt 125 |
| 21:26:18–21:34:58 | **Harness lần 2 (boot `802f358f`): WebKit 0/3 FAIL launch (thiếu libevent) + Chromium 3/3 PASS** (xem §2) |
| 21:38:35–21:46:39 | **Harness lần 3 (WebKit-only, DEBROOT): WebKit 3/3 PASS exit 0** (xem §2) |
| ~21:52 | Kiểm cuối + LIMITS + stage file + cờ `round149-t8.done` — **T8 đóng TRƯỚC hạn cờ 23:00Z** |

## A. O8 — PASS 3/3 trên boot `70025d3e`, CHẠY SAU CỜ T4 (tuân (j))

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 21:15:27–21:16:18 | 0 | **21/21 PASS** — S1 PASS 21:15:39 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 21:16:18–21:17:07 | 0 | **21/21 PASS** — S1 PASS 21:16:28, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 21:17:07–21:17:59 | 0 | **21/21 PASS** — S1 PASS 21:17:29 "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true` (kiểm độc lập bằng python — cấu trúc dict `{results, logLines}`, không phải list; WebKit chỉ 1 file JSON cho 2 attempt — attempt2 ghi đè attempt1, như đợt 148; cả 2 attempt đều 21/21 trong log text `o8-149t8.log`). 0 dòng `HARNESS LỖI`, 0 `Target crashed`.
- Driver O8 giữ 1 lock vite `t8-round149` suốt lượt (giữ 152 s, đã nhả 21:17:59Z; vite sau release curl 5560/5554 = 000000 — vite theo lượt đã xuống, đúng thiết kế).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-149t8.mjs`, `node --check` OK — bản copy từ đợt 148, nhãn `PROBE-143T8` giữ nguyên) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 6 → 7 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 148 = 6 (parent chấp nhận có điều kiện); đợt này T8 pass 21/21 ×2 trên boot `70025d3e`, chạy SAU cờ T4 nên không còn điều kiện lệch chuẩn nào gắn với O8 đợt này.
- **O8 đợt này 2'32" tổng** (147: 2'27", 148: 4'03") — dao động theo lượt, không kết luận (F-149-T8-10).

## 2. Kết quả harness — 3 lần chạy driver, 2 boot (6/6 PASS trên boot mới + 2/2 PASS trên boot cũ)

### Lần 1 — boot `70025d3e`, 21:18:05–21:22:05Z (bị reboot #39 giết giữa chừng)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 21:18:15–21:19:25 | **PASS** — report `ok=true` |
| 2 | WebKit 85m4-hb128 | 0 | 21:19:40–21:21:50 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,8/1,3/1,8 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 3 | WebKit 86n2 | — | bắt đầu 21:22:05, chết ~21:23:51 | **KHÔNG CÓ VERDICT** — reboot #39 giết driver lúc ~1'46" sau khi bắt đầu; không có verdict pha nào trong summary đã lưu, không có report JSON |

### Lần 2 — boot `802f358f`, 21:26:18–21:34:58Z (WebKit FAIL launch, Chromium PASS)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | **1** | 21:26:21–21:26:31 | **FAIL LAUNCH** — `MiniBrowser: error while loading shared libraries: libevent-2.1.so.7`, exit 127, chết sau ~10 s; report `ok=false` |
| 2 | WebKit 85m4-hb128 | **1** | 21:26:47–21:26:57 | **FAIL LAUNCH** — cùng lỗi libevent, exit 127; report `ok=false` |
| 3 | WebKit 86n2 | **1** | 21:27:12–21:27:22 | **FAIL LAUNCH** — cùng lỗi libevent, exit 127; report `ok=false` |
| 4 | Chromium 84l10 | 0 | 21:27:37–21:28:37 | **PASS** — W1 3/3 (lần1 delta +2, artifact đã biết, xem F-149-T8-8), W2 PASS, E4 PASS |
| 5 | Chromium 85m4-hb128 | 0 | 21:28:52–21:30:52 | **PASS** — P1–P5 đủ (P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 6 | Chromium 86n2 | 0 | 21:31:07–21:34:58 | **PASS (ok=true)** — P1–P6 đủ (P4 3/3 delta +1/+1/+2, đồng bộ 0,5/1,0/0,5 s; P5 0 restart; P6 KHÔNG-KẸT 90 s 21:34:47Z) |

- 3 report JSON WebKit `ok=false` + 3 report JSON Chromium `ok=true` (kiểm độc lập bằng python). Lỗi launch giống hệt nhau cả 3 lần — nguyên nhân môi trường duy nhất (thiếu lib hệ thống), không phải lỗi app/harness (xem F-149-T8-4).
- **0 retry:** driver `run_one` không retry mù (theo thiết kế từ đợt 142); 3 lần FAIL launch được ghi đúng là FAIL, không chạy lại bằng cùng môi trường hỏng — thay vào đó đổi môi trường sang DEBROOT ở lần 3 (xem F-149-T8-5).

### Lần 3 — boot `802f358f`, WebKit-only qua DEBROOT, 21:38:35–21:46:39Z

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 21:38:38–21:39:58 | **PASS** — W1 3/3 (delta +1 mỗi lần, sạch), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit 85m4-hb128 | 0 | 21:40:13–21:42:23 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,7/1,8/1,4 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 3 | WebKit 86n2 | 0 | 21:42:39–21:46:39 | **PASS (ok=true)** — P1–P6 đủ (P4 3/3 delta +1, đồng bộ 1,8/1,8/1,2 s; P5 0 restart; P6 KHÔNG-KẸT 90 s 21:46:28Z) |

- 3 report JSON `ok=true` (kiểm độc lập bằng python). Driver lần 3 là bản copy WebKit-only của driver chuẩn (`run-webkit-149t8-debroot.sh`): chỉ khác `LD_LIBRARY_PATH` + `GST_PLUGIN_PATH/SYSTEM_PATH` trỏ debroot, và lược bỏ phần Chromium (đã PASS 3/3 ở lần 2 cùng boot — không chạy lại để khỏi ghi đè bằng chứng). `bash -n` OK; 0 tham chiếu chromium trong bản copy.
- Fixture REBUILD 2 lần đợt này (lần 1 sau cờ T4, lần 2 sau reboot #39): 6/6 md5 khớp đợt 125 cả 2 lần (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- Gate: harness lần 1 bắt đầu 21:18:05Z, 6'29" sau GATE-FOUND 21:11:36Z; T4 đã đóng cờ 21:11Z với verdict "#22 MỞ — KHÔNG CÓ LƯỢT HỢP LỆ" và không còn attempt nào đang chạy (ngân sách 3/3) — 0 lần đo yên nào bị phiền. **NHƯNG chuẩn (i) "sau lượt yên hợp lệ" KHÔNG thỏa** — xem F-149-T8-1.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG THIẾT KẾ, KHÔNG CÓ KẸT)

- **0 kẹt trong tất cả các lần chạy hoàn thành:** 8 lần harness (2 WebKit lần 1 + 3 Chromium lần 2 + 3 WebKit lần 3) + 3 lần chạy O8. 0 dòng `WATCHDOG-137` trong mọi log (6 log harness lần 2/3 + 2 log harness lần 1 đã lưu + `o8-149t8.log`); 0 dòng `LIVE-DIAG-149`; `live_diags=0` ở cả 9 lần chạy driver (lần 1: 0/0; lần 2: 0/0/0 + 0/0/0; lần 3: 0/0/0).
- **3 lần FAIL launch (lần 2) KHÔNG kích hoạt watchdog — ĐÚNG.** MiniBrowser chết ngay lúc launch (exit 127, ~10 s), không phải evaluate im lặng >60 s; watchdog chẩn đoán chỉ canh evaluate treo, không canh launch fail. Đừng trích "watchdog bỏ lỡ 3 lần fail" — fail launch nằm ngoài phạm vi của nó theo thiết kế.
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–148 §12.3(l) — đã kiểm chứng bằng kẹt thật đợt 148; đợt này không có kẹt thật để thử thêm).
- Chuỗi "chưa thử bằng kẹt thật" đã kết thúc ở đợt 148; đợt này không mở lại.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–149) + đường ổn định `t8-diag-stall.sh` → 149 (symlink đã cập nhật) | 8 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt** | **KHÔNG CÓ GÌ ĐỂ BẮT.** 0 dòng `WATCHDOG-137` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–149) | 9 lần chạy driver, `live_diags=0` tất cả | **0 kích hoạt, 0 false-positive.** `dev-url.txt` ghi đủ scratch |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-149t8.sh` / bản debroot (cột `balloon_kb`) | 3 lần chạy driver → 3 log sampler (n=13/18/17) | Balloon 4,93–6,04 GB; RAM avail 467–1.853 MB; **0 mẫu ghim trần** (xem F-149-T8-7) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** trên boot `802f358f` | N cộng dồn **N=11 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 0 restart + P6 PASS |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** | Baseline: dmesg 58 B (EPERM tái xác nhận); journalctl -k 17 B (`-- No entries --`) — cả lần 1 (21:18Z, boot cũ) và lần 2/3 (boot mới) |

## 5. Cây + md5 — mở / cuối (KHÔNG ĐỔI)

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | ecbd1b40 | ecbd1b40 | Không (script O8 gốc, chỉ đọc) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | 8911ad3d | 8911ad3d | Không (script O8 Chromium gốc, chỉ đọc) |

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file). Driver trong hidden_files có 3 thay đổi nhỏ so với đợt 148: nhãn log `LIVE-DIAG-148` → `LIVE-DIAG-149`, deadline waiter 20:00Z → 22:15Z (hạn cờ đợt này), lock `t8-round148` → `t8-round149` — cả ba chỉ là chuỗi/hằng số trong bản copy, không chạm script repo. Thêm mới: bản copy driver WebKit-only qua DEBROOT `run-webkit-149t8-debroot.sh` (xem F-149-T8-5).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round149` 21:17:59Z (giữ 152 s); driver harness lần 1 bị reboot giết (lock stale đã dọn tay bằng cơ chế của lock script, kiểm chứng acquire/release thử 21:25:58Z); driver lần 2 + lần 3 đã nhả lock sau mỗi lần chạy.
- Driver harness lần 3 đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm.
- Kiểm cuối ~21:47Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` TRỐNG; lock vite TRỐNG (0 ticket + 101 cooldown); boot `802f358f` ổn định (uptime 23 phút lúc kiểm).
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 467 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này 6/6 PASS trên boot `802f358f` — NHƯNG KHÔNG PHẢI 6/6 TRONG MỘT LẦN CHẠY DRIVER.** WebKit 3/3 qua DEBROOT (lần 3) + Chromium 3/3 qua system libs (lần 2), cộng 2/2 WebKit PASS trên boot `70025d3e` (lần 1, trước reboot). Đừng trích "driver harness chạy một mạch 6/6" — thực tế là 3 lần chạy driver, 2 boot, 1 lần bị reboot giết, 1 lần WebKit fail launch.
2. **Gate đợt này LỆCH CHUẨN — KHÔNG ĐƯỢC TRÍCH là "harness sau lượt yên hợp lệ"** (F-149-T8-1): #22 MỞ, không có lượt hợp lệ nào; harness chỉ "sau khi T4 đóng cờ". Lần đầu tiên kể từ đợt 145 gate lại lệch theo hướng này (đợt 148 gate sạch).
3. **WebKit harness lần 3 chạy qua DEBROOT, không phải system libs** (F-149-T8-5): MiniBrowser + GST plugin đều từ debroot. Đừng trích "WebKit chạy bằng lib hệ thống" cho 3 lần này; 3 lần Chromium thì chạy bằng system libs như thường lệ.
4. **Chuỗi WebKit FULL PASS = 7 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này (trên boot `70025d3e`, sau cờ T4); nếu T10 pass lúc đóng sổ thì chuỗi = 7 vững.
5. **Chuỗi "P3 không kẹt" 0 → 1:** 0 kẹt trong 8 lần harness hoàn thành + 3 lần O8 đợt này. Nhưng 86n2 WebKit lần 1 KHÔNG CÓ VERDICT (chết vì reboot, không phải vì kẹt) — đừng đếm lần đó vào chuỗi pass/kẹt theo hướng nào.
6. **3 lần WebKit FAIL launch lần 2 là LỖI MÔI TRƯỜNG, không phải lỗi app/harness/kẹt** — đừng trích "WebKit fail 3/3" mà không kèm nguyên nhân (thiếu `libevent-2.1.so.7` sau reboot, apt replay stall). Cùng 3 pha đó PASS ngay sau khi đổi sang DEBROOT.
7. **Balloon KHÔNG ghim trần đợt này** (F-149-T8-7): max 6.040.412 kB (T8) / 6.150.008 kB (T9) — dưới trần đóng băng 6.443.824 kB. Chuỗi ghim trần (= 1 đợt, từ đợt 148) ĐỨT. Đừng trích trần 6.443.824 kB cho đợt này.
8. **#22 MỞ — dữ kiện của T4, T8 chỉ trích lại:** A2 median 138,0 ms / A3 112,0 ms là median của lượt NHIỄM TẢI (B vi phạm), không phải median yên — đừng trích làm "WebKit chậm lại".
9. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–149 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
10. **T8 ĐÓNG TRƯỚC HẠN (cờ ~21:52Z, hạn cờ 23:00Z)** — lần thứ hai liên tiếp không lỡ hạn mềm (đợt 148 cũng đóng trước hạn). Lớp bảo vệ hạn (waiter deadline 22:15Z) không phải kích hoạt.
11. **P5 Chromium 86n2 0 restart đợt này** (như đợt 144/145/146/147/148; khác đợt 143 +1 `ended` tự nhiên) — 0 restart là trường hợp sạch; khác biệt đợt 143 chưa giải thích được, ghi nhận để đối chiếu, không kết luận regression.

## 8. Sai số mới (F-149-T8-N)

- **F-149-T8-1 — GATE LỆCH CHUẨN: HARNESS SAU KHI T4 ĐÓNG NHƯNG KHÔNG CÓ LƯỢT YÊN HỢP LỆ (họ F-146/147-T8-3, hướng ngược đợt 148):** cờ T4 21:11Z "#22 MỞ — KHÔNG CÓ LƯỢT HỢP LỆ (3/3 attempt hết ngân sách, poller exit 11)"; GATE-FOUND poll 28, 21:11:36Z (t4=OK + postboot đường (a) cho boot `70025d3e`, t4attempt=no-lock); harness lần 1 bắt đầu 21:18:05Z sau khi T4 đóng hẳn (0 process T4). Chuẩn (i) đợt 147 "harness sau lượt yên hợp lệ" KHÔNG thỏa vì không có lượt hợp lệ nào tồn tại. T8 vẫn chạy theo brief ("O8 chạy SAU cờ này theo quyết (j)" — cờ T4 ghi rõ) và vì không còn phép đo yên nào để làm phiền. **Để T10/parent phán có chấp nhận trích harness đợt này không** — và trích theo nhãn nào ("sau khi T4 đóng" thay vì "sau lượt yên hợp lệ"). Đợt 148 gate sạch (lần đầu kể từ đợt 145); đợt 149 lại lệch — hai khía cạnh độc lập với kết quả harness (6/6 PASS), đừng gộp thành một verdict chung.
- **F-149-T8-2 — O8 CHẠY SAU CỜ T4, TUÂN (j) LẦN ĐẦU:** O8 21:15:27–21:17:59Z, sau GATE-FOUND 21:11:36Z đúng 3'51". Khác đợt 148 (O8 chạy trước cờ T4, lệch (j) đã chấp nhận có điều kiện): đợt này KHÔNG có lệch chuẩn thứ tự nào. Waiter deadline 22:15Z (tương đương cap (j) đợt này) không phải kích hoạt. Tiền lệ tốt: từ đợt 149 trở đi, (j) được tuân theo chữ.
- **F-149-T8-3 — REBOOT #39 GIỮA HARNESS (boot `70025d3e` → `802f358f`):** btime /proc/stat 21:23:51Z, /proc/1 21:24:01Z (chênh 10 s — mẫu init-delay quen thuộc, cùng họ chênh 15 s đợt 148); boot cũ sống 4.998 s (20:00:33Z → 21:23:51Z, stat→stat). Driver harness lần 1 bị SIGTERM giữa 86n2 WebKit (bắt đầu 21:22:05Z, chết ~1'46" sau — không có verdict pha nào, không có report JSON; log lần 1 của 86n2 đã bị ghi đè bởi lần 2/3, chỉ còn summary đã snapshot). Lock vite stale (owner pid 59445 chết, boot đổi) được dọn bằng chính cơ chế stale-recovery của lock script — T8 kiểm chứng acquire/release thử thành công 21:25:58Z TRƯỚC khi chạy lại, không xóa tay file lock. Fixture /tmp mất theo reboot → rebuild lần 2 (6/6 md5 khớp). Đây là reboot thứ 3 trong 2 đợt (148: #35/#36/#37; 149: #39 — #38 là reboot mở đợt, trước phiên T8). Mù #70?/gap chứng nhận là việc T2 — T8 chỉ ghi mốc giờ chính xác.
- **F-149-T8-4 — WEBKIT FAIL LAUNCH 0/3 LẦN 2: THIẾU `libevent-2.1.so.7` (MÔI TRƯỜNG, KHÔNG PHẢI APP/KẸT):** cả 3 lần đều `MiniBrowser: error while loading shared libraries: libevent-2.1.so.7: cannot open shared object file`, exit 127, chết sau ~10 s (21:26:21–21:27:22Z, boot mới ~2,5–3,5 phút tuổi). Kiểm sau đó: `libevent-2.1.so.7`, `libEGL.so.1`, `libavif.so.16` đều vắng; thư mục GST hệ thống vắng; **không có process apt/dpkg nào đang chạy**. Watcher replay của T5 (`replay-watch-boot2`, poll 30 s từ 21:27:57Z, maxpoll=120): `apt=[] dpkg=[] gst_sys=0 cache_deb=0` suốt 18 poll tới 21:36:28Z — replay KHÔNG tiến triển (cache .deb = 0, khác hẳn 178 .deb/156M còn sống qua reboot trước). T8 KHÔNG tự cài apt (luật đứng) — việc replay là của T5. Chromium PASS 3/3 cùng boot vì tự mang lib. Cùng 3 pha WebKit PASS ngay ở lần 3 khi đổi sang DEBROOT — chứng minh lỗi nằm ở môi trường, không phải app/script.
- **F-149-T8-5 — DEBROOT WORKAROUND: WEBKIT 3/3 PASS (LẦN 3) — CÓ TIỀN LỆ, CÓ GIỚI HẠN TRÍCH DẪN:** bản copy driver `run-webkit-149t8-debroot.sh`: `LD_LIBRARY_PATH=$DEBROOT` + `GST_PLUGIN_PATH/SYSTEM_PATH=$DEBROOT/gstreamer-1.0` (debroot có 269 plugin GST, gồm `libgstisomp4.so`/`libgstlibav.so`/`libgstapp.so`); lược bỏ phần Chromium (đã PASS lần 2). Tiền lệ: script O8 tự đặt `LD_LIBRARY_PATH` với DEBROOT từ đợt 110 L8 ("để MiniBrowser không phụ thuộc /usr"); postboot check cũng coi debroot (269 file) là nguồn lib dự phòng khi system libs thiếu. **Giới hạn:** lib dùng để chạy là bản giải nén từ .deb trong debroot, không phải lib hệ thống đã cài — cùng gói, khác đường dẫn; script 86n2 còn tự ghi đè `GST_PLUGIN_SYSTEM_PATH` về đường dẫn hệ thống (vắng) nhưng `GST_PLUGIN_PATH` (debroot) vẫn cung cấp đủ plugin nên phát hình PASS. Đừng trích 3 lần này là "chạy bằng lib hệ thống". Đợt sau: nếu replay T5 hoàn tất, chạy lại bằng system libs để đối chiếu; nếu replay vẫn stall, vấn đề thuộc về T5.
- **F-149-T8-6 — SAMPLER T8 CHẾT THEO REBOOT + NGHỊCH LÝ ĐỒNG HỒ 14 S + CỬA SỔ THEO BOOT:** sampler run 1 (boot `70025d3e`) chết cùng reboot #39 — log dừng ở mẫu cuối 21:24:05Z, không mẫu nào sau đó; process table boot mới trống hoàn toàn lúc kiểm 21:24:45Z. Mẫu cuối đóng dấu **21:24:05Z, muộn hơn btime boot mới (21:23:51Z) đúng 14 s** — nghịch lý đồng hồ cùng họ vụ 8 s đợt 148 (T9): đồng hồ boot cũ chạy nhanh hơn boot mới, không phải sampler sống sót qua reboot. Sampler T9 cũng chết + khởi động lại theo cùng mẫu (gap 21:23:38Z → 21:25:05Z, 87 s). Cửa sổ sampler T8: run 1 boot cũ 21:18:05–21:24:05Z (n=13); run 2 boot mới 21:26:18–21:34:49Z (n=18); run 3 boot mới (debroot) 21:38:35–21:46:35Z (n=17). Sampler T8 chỉ phủ cửa sổ harness, không phủ toàn đợt (O8 21:15–21:17Z ngoài cửa sổ) — sampler T9 phủ toàn đợt (n=61).
- **F-149-T8-7 — CHUỖI GHIM TRẦN BALLOON: ĐỨT (0/48 T8 + 0/61 T9):** trần đóng băng 6.443.824 kB; đợt 148: 38/115 mẫu ghim trần, chuỗi liên tục 37 phút → chuỗi mới = 1 đợt. Đợt 149: sampler T8 **0/48 mẫu ≥ trần** (max 6.040.412 kB = 93,7% — mẫu đơn lúc 21:38:35Z run 3, mẫu sau tụt ngay về 5,52M, không phải chuỗi ghim); sampler T9 đối chiếu **0/61 mẫu** (max 6.150.008 kB = 95,4% trên boot cũ; 5.958.108 kB = 92,5% trên boot mới). Hai sampler khớp nhau gần như tuyệt đối (cùng timestamp ±2 s, cùng giá trị balloon). **Chuỗi ghim trần (= 1 đợt) DỪNG ở 1, không nối sang đợt 149.** Xu hướng: balloon vẫn leo dần trong đợt (4,93M → 5,61M boot cũ; 4,93M → 5,82M run 2; spike đơn 6,04M run 3) — tiến gần trần nhưng chưa chạm; T9 theo dõi tiếp. Phán cuối về chuỗi là việc T9/T10 (sampler T9 phủ toàn đợt) — dữ kiện T8 chỉ là đối chiếu độc lập.
- **F-149-T8-8 — Chromium 84l10 W1 trôi +2 ở lần1 (artifact test đã biết, cùng họ F-146/147/148-T8-6):** lần1 restartEndedVideo 0→2 (gồm bắn lặp do ghi đè `ended` còn bật); WebKit cả 3 lần đều delta +1 sạch. Script vẫn verdict PASS (ok=true). Ghi nhận để đối chiếu, không đổi verdict.
- **F-149-T8-9 — 86n2 WebKit P4-lần2 PASS LẦN NÀY (pha nóng đợt 141/148):** đồng bộ 1,8 s, delta +1, hạ-cánh-về-target=true, ct=2,533 — cả ở lần 3 (debroot) và P4-lần1/lần3 cũng PASS; P6 KHÔNG-KẸT 90 s (21:46:28Z). Kẹt P4-lần2 hai đợt trước KHÔNG tái hiện đợt này. H3 vẫn mở (chưa giải thích cơ chế), chỉ ghi nhận pha nóng đã sạch một đợt.
- **F-149-T8-10 — O8 đợt này 2'32" tổng (147: 2'27", 148: 4'03"):** dao động theo lượt, không kết luận nguyên nhân. Ghi nhận để đối chiếu.
- **F-149-T8-11 — T4 A1: ABORT-3-TIMEOUT KÍCH HOẠT LIVE LẦN ĐẦU (dữ kiện của T4, T8 chỉ ghi chéo):** attempt1 partial 4/20 exit 3, pass 5 wedged nhưng abort-3-timeout đã cắt (0 kẹt) — bản vá probe T4 đợt 148 hoạt động đúng như thiết kế. Kẹt probe T4 (writePartial timeout) và kẹt harness T8 (waitForPlaySync evaluate) là hai chữ ký khác nhau — đừng gộp thành một lỗi.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Gate lệch chuẩn (F-149-T8-1) — parent/T10 phán có chấp nhận trích harness đợt 149 không:** harness chạy sau khi T4 đóng cờ nhưng không có lượt yên hợp lệ nào. Nếu không chấp nhận: kết quả harness đợt 149 chỉ được trích có điều kiện ("sau khi T4 đóng", không phải "sau lượt yên hợp lệ"). Chuẩn đứng cho đợt sau vẫn là quyết (i) (harness sau lượt yên hợp lệ) — đợt này không thỏa vì #22 mở, không phải vì T8 chạy sai thứ tự.
2. **WebKit harness phụ thuộc DEBROOT khi system libs vắng (F-149-T8-5) — giao T5/đợt sau đối chiếu:** replay apt trên boot `802f358f` không tiến triển (cache .deb = 0) — nếu replay hoàn tất, đợt 150 chạy lại WebKit bằng system libs để đối chiếu với kết quả DEBROOT đợt này; nếu replay vẫn stall thì đó là nợ của T5, không phải của T8.
3. **Chuỗi WebKit FULL PASS = 7 (chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 149, trên boot `70025d3e`).**
4. **Chuỗi "P3 không kẹt" 0 → 1 (0 kẹt đợt này)** — 86n2 P4-lần2 sạch một đợt (F-149-T8-9); H3 vẫn mở, chưa giải thích cơ chế.
5. **#22 MỞ (T4)** — đợt 150 đo lại như thường lệ (cộng dồn (c2) vẫn 18 lượt hợp lệ). T4 là chủ quản; T8 chỉ ghi nhận để trích gate cho đúng.
6. **Chuỗi ghim trần balloon ĐỨT (F-149-T8-7)** — chuỗi mới (= 1 đợt) dừng ở 1; balloon vẫn leo (max 95,4% trần) — T9 theo dõi tiếp.
7. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.
8. Reboot #39: mốc giờ đã ghi (btime 21:23:51Z stat / 21:24:01Z proc/1; boot cũ sống 4.998 s) — mù #70?/gap chứng nhận giao T2; T8 không tự chốt giây reboot.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 149 (0 KẸT, 3 FAIL LAUNCH MÔI TRƯỜNG)

## B1. Trạng thái giả thuyết sau đợt 149

| Giả thuyết | Trạng thái đợt 148 | Trạng thái đợt 149 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | 0 kẹt đợt này dù avail min 467 MB; 3 lần FAIL launch là thiếu lib hệ thống, không liên quan RAM |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | Không có kẹt mới để kiểm; balloon max 93,7–95,4% trần nhưng 0 mẫu ghim — không có tương quan kẹt/balloon đợt này |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — ĐƯỢC ỦNG HỘ BẰNG BẰNG CHỨNG LIVE ĐẦU TIÊN | **VẪN MỞ — KHÔNG CÓ DỮ KIỆN MỚI** | 0 kẹt đợt này; 86n2 P4-lần2 (pha nóng) PASS cả lần 3; chưa chứng minh hay bác bỏ thêm |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 149

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–149) + đường ổn định `t8-diag-stall.sh` → 149 (symlink đã cập nhật) | 8 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt** | **KHÔNG CÓ GÌ ĐỂ BẮT.** 0 dòng `WATCHDOG-137` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–149) | 9 lần chạy driver, `live_diags=0` tất cả | **0 kích hoạt, 0 false-positive;** `dev-url.txt` đủ scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver + bản debroot (đã chạy) | 3 log sampler (n=13/18/17, tổng n=48) | Balloon 4,93–6,04 GB, RAM avail 467–1.853 MB; **0 mẫu ghim trần 6.443.824 kB** |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** trên boot `802f358f` | N cộng dồn **N=11 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, truyền devUrl thật) | **0 lần kẹt → không kích hoạt** | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3 + đợt 148 §B3), bổ sung đợt 149

- **Không có kẹt mới đợt này.** Chữ ký FAIL launch lần 2 (KHÁC kẹt, ghi riêng để khỏi nhầm): `browserType.launch: Target page, context or browser has been closed` + `MiniBrowser: error while loading shared libraries: libevent-2.1.so.7` + exit 127 sau ~10 s — chết ngay lúc launch, không có evaluate im lặng, không có probe timeout, không có live-diag. Phân biệt rõ với chữ ký kẹt (evaluate im lặng >60 s → probe 1+1 timeout → im lặng hàng trăm giây → timeout 900).
- 86n2 WebKit P4-lần2 PASS lần này (đồng bộ 1,8 s) — pha nóng đợt 141/148 đã sạch một đợt; P6 KHÔNG-KẸT 90 s ở cả WebKit lẫn Chromium trên boot mới.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 149: 0 KẸT, CHUỖI 0 → 1

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **3 → 4**.
- Đợt 146: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **4 → 5**.
- Đợt 147: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **5 → 6**.
- Đợt 148: **6 lần chạy harness, 1 KẸT (86n2 WebKit, P4-lần2, exit 124), 0 FAIL oan** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **6 → 0 (ĐỨT)**.
- Đợt 149: **8 lần chạy harness hoàn thành, 0 KẸT** (lần 1: WebKit 84l10/85m4 PASS + 86n2 KHÔNG VERDICT do reboot; lần 2: WebKit 0/3 FAIL LAUNCH môi trường + Chromium 3/3 PASS; lần 3: WebKit 3/3 PASS qua DEBROOT) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **0 → 1**.
- **Năm lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=11 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 149: #22 mở; reboot #39 giữa harness; T4 sửa probe đã kích hoạt abort live

- T4 đợt này: A1 partial (abort-3-timeout kích hoạt live lần đầu — bản vá probe đợt 148 hoạt động), A2/A3 nhiễm tải (B vi phạm, median 138,0/112,0 ms) — #22 MỞ, không có lượt hợp lệ. Kẹt probe T4 (writePartial timeout) và kẹt harness T8 (waitForPlaySync evaluate) là **hai chữ ký khác nhau** — đừng gộp thành một lỗi.
- Reboot #39 (21:23:51Z) giết harness lần 1 giữa 86n2 WebKit — không phải kẹt, không liên quan H1/H2/H3. Vite server còn sống lúc chạy harness lần 2/3 (vite-http 200 khi launch — các lần FAIL là do MiniBrowser thiếu lib, vite vẫn phục vụ bình thường).
- WebKit launch FAIL 3 lần là lỗi môi trường thuần túy (thiếu `libevent-2.1.so.7` sau reboot, apt replay stall) — đã chứng minh bằng cách đổi sang DEBROOT là PASS ngay. Không phải bằng chứng cho hay chống lại H3.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, không có dữ kiện mới đợt này (0 kẹt; pha nóng P4-lần2 sạch một đợt).
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143 (trạng thái boot mới); đợt này O8 PASS 3/3 thường kỳ, SAU cờ T4, chuỗi FULL PASS 6 → 7 (chờ T10 xác nhận độc lập).** Không mở điều tra mới về O8; nếu O8 WebKit FAIL lại ở đợt 150 thì mở điều tra lại từ đầu.
- **Lượt yên #22 MỞ — gate harness đợt này LỆCH CHUẨN (chỉ "sau khi T4 đóng", không phải "sau lượt yên hợp lệ").** Không còn lệch chuẩn gate họ F-146/147-T8-3 theo nghĩa cũ (T4 đã đóng hẳn, không đo dở), nhưng chuẩn (i) vẫn không thỏa — chờ parent/T10 phán cách trích.
- **Bản vá watchdog đợt 142 GIỮ NGUYÊN, không revert** (đã kiểm chứng bằng kẹt thật đợt 148; đợt này 0 kẹt nên không thử thêm). Nếu đợt sau có kẹt thật nữa, (i)+(ii) sẽ chụp tiếp; đừng trích "kẹt đã hiểu rõ" (H3 vẫn mở).
- **Điều tra kẹt chung VẪN MỞ** — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.

## B7. Bằng chứng mới từ đợt 149 — O8 PASS 3/3 SAU CỜ T4, HARNESS 6/6 (3 LẦN CHẠY, 2 BOOT), 0 KẸT, #22 MỞ, REBOOT #39

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot `70025d3e` (21:15:27–21:17:59Z — 2'32", chạy SAU cờ T4 21:11Z, tuân (j) lần đầu); S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness: lần 1 WebKit 84l10/85m4 PASS + 86n2 bị reboot #39 giết (không verdict); lần 2 WebKit 0/3 FAIL launch (thiếu libevent, môi trường) + Chromium 3/3 PASS; lần 3 WebKit 3/3 PASS qua DEBROOT — **tổng 6/6 PASS trên boot `802f358f` + 2/2 PASS trên boot `70025d3e`, 0 kẹt**.
- Vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, **0 kích hoạt đợt này** (đúng thiết kế — không có kẹt); 0 false-positive.
- Sampler: balloon 4,93–6,04 GB, RAM avail 467–1.853 MB trong lúc chạy harness (KHÔNG ghim trần 6.443.824 kB; avail min 467 MB — chưa phá kỷ lục 272 MB đợt 148). Chuỗi ghim trần (= 1 đợt) ĐỨT: 0/48 mẫu T8 + 0/61 mẫu T9.
- T8 đóng TRƯỚC HẠN (~21:52Z, hạn cờ 23:00Z) — lần thứ hai liên tiếp không lỡ hạn mềm.
- Nhãn log `LIVE-DIAG-148` đã đổi thành `LIVE-DIAG-149` trong bản copy driver — nhãn mới 0 lần xuất hiện trong log thật đợt này (0 kẹt nên 0 lần diag live — khác đợt 148 nhãn mới xuất hiện 2 lần nhờ kẹt thật). `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối; lock vite TRỐNG.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round149-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI**): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142–149; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round149-t8/` (run-webkit-149t8.sh — ĐÃ CHẠY lần 1 (2 PASS + 86n2 bị reboot giết) + lần 2 (WebKit 0/3 FAIL launch + Chromium 3/3 PASS); run-webkit-149t8-debroot.sh — ĐÃ CHẠY lần 3 (WebKit 3/3 PASS qua DEBROOT); diag-stall-149t8.sh — KHÔNG DÙNG đợt này (0 kẹt); rebuild-fixtures-149t8.sh — ĐÃ CHẠY 2 LẦN (6/6 md5 khớp đợt 125 cả 2 lần); wait-t4-t5-149t8.sh — ĐÃ CHẠY (GATE-FOUND poll 28, 21:11:36Z, deadline 22:15Z không kích hoạt); o8-driver-149t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21, SAU cờ T4); o8-s1-probe-149t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-149t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 145, không cần tạo lại); smoke/wait-t4-t5.log (waiter, GATE-FOUND poll 28); smoke/run-webkit-summary.txt (driver lần 3 debroot, 21:38:35–21:46:39Z, ec webkit 0/0/0); smoke/partial-boot70025d3e/ (lần 1: summary + ram log + 2 report JSON ok=true + 2 run log); smoke/rerun2-boot802f358f/ (lần 2: summary + ram log + 3 report JSON WebKit ok=false + 3 run log FAIL launch); smoke/ram-149t8.log (sampler lần 3, n=17); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy lần 2/3); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai; O8 ecbd1b40/8911ad3d cả hai); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng); smoke/baseline-meminfo.txt (20:44Z, boot 70025d3e); o8-149t8.log + o8-lock.log (driver O8 21:15:27–21:17:59Z, lock giữ 152 s); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round149-t8/diag-stall-149t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild 2 lần đợt này, 6/6 md5 khớp.
