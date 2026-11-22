# Đợt 148 T8 — O8 PASS 3/3 TRƯỚC T4 + HARNESS 5/6: WEBKIT 86N2 KẸT THẬT TẠI P4-LẦN2 (WATCHDOG NỔ LẦN ĐẦU) + #21 ĐÓNG, GATE SẠCH

Ngày: 19/11/2026 (lượt cron 00:35 +07 20/11 = 17:35:51Z; T8 mở ~17:39Z, đóng ~18:53Z trên boot `d8a11644` — reboot #35 xảy ra TRONG LÚC T10-147 đóng sổ, xem F-148-T8-10; 0 reboot trong phiên T8). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy TRƯỚC attempt đo của T4 theo brief đợt này; (2) harness đứng 6 lần — chạy SAU lượt yên #21 HỢP LỆ (gate sạch, lần đầu kể từ đợt 145); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert — và đợt này nó NỔ LẦN ĐẦU TIÊN bằng kẹt thật. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND147_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 + harness 6/6 NHƯNG #21 chưa hợp lệ; watchdog 0 kích hoạt đợt thứ 6; T8 lỡ hạn mềm); aggregate đợt 147 §7, §11, §12.1 (i)(j)(l)(q) + §12.3 parent (quyết (i) CHẤP NHẬN harness-lệch-chuẩn với ghi rõ; quyết (j) chuẩn hóa "O8 sau cờ T4", cap ~19:30Z đợt 148 (tương đương 16:30Z đợt 147) — BỔ SUNG sau khi đợt 148 mở, xem F-148-T8-1; quyết (l) watchdog giữ nguyên chờ kẹt thật; #21 đợt 148 đo lại tiếp, không chuyển #22; sửa probe giao T4-148 ưu tiên cao nhất).

## 0. Kết luận ngắn — O8 PASS 3/3, HARNESS 5/6 (1 KẸT THẬT), #21 ĐÓNG, WATCHDOG NỔ LẦN ĐẦU

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (17:41:01–17:45:04Z, boot `d8a11644` ~13' tuổi lúc chạy, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần (WebKit: "checked=true → false, Playwright mouse click lần 2"; Chromium: CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả hai engine (kiểm độc lập bằng python). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL). **KHÔNG có điều tra lại** — O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143, đợt này chỉ kiểm lại thường kỳ.
- **Chuỗi WebKit FULL PASS: 5 → 6 (chờ T10 xác nhận độc lập lúc đóng sổ — VÀ chờ parent/T10 phán xem có chấp nhận trích O8 chạy sớm này không, xem F-148-T8-1 (bổ sung))** — đợt 147 = 5 (T10 xác nhận bằng JSON/log gốc, không chạy lại); đợt này T8 pass 21/21 ×2 trên boot `d8a11644`; nếu T10 cũng pass lúc đóng sổ VÀ chấp nhận O8 chạy sớm thì chuỗi = 6 vững, nếu không thì vẫn 5.
- **Thứ tự O8 đợt này: CHẠY TRƯỚC attempt đo của T4 — LỆCH CHỮ QUYẾT (j) ĐÃ LÀM RÕ (F-148-T8-1 (bổ sung))** — O8 17:41–17:45Z, T4 attempt1 bắt đầu 17:59:48Z. Brief đợt 148 giao cho T8 ("O8 trước T4") nay ĐÃ LỖI THỜI so với quyết parent §12.3 đợt 147 (j) được main chat viết trực tiếp sau khi đợt 148 mở: CHUẨN HÓA "O8 sau cờ T4", nhưng có giới hạn ~19:30Z đợt 148 (tương đương 16:30Z đợt 147) — nếu cờ T4 chưa về lúc ~19:30Z thì T8 chạy O8 luôn, không chờ nữa. O8 đợt này chạy sớm theo brief cũ, TRƯỚC mọi cờ T4 — tức lệch chữ quyết (j). KHÔNG chạy lại O8. Dữ kiện giảm nhẹ: O8 kết thúc 17:45:04Z, TRƯỚC attempt đầu của T4 (smoke-wall45 acquire lock ~17:49:18Z — vite log mtime 17:49:21Z, run log 17:49:24Z; attempt1 probe-start 17:59:48Z) nên không chồng tải lên phép đo yên. Để T10/parent phán xem có chấp nhận trích O8 này không. Harness vẫn chạy SAU khi T4 đóng cờ như brief (trích "harness sau khi T4 đóng cờ" theo quyết (i) đợt 147).
- **Lượt yên #21: ĐÓNG — LƯỢT HỢP LỆ ĐẦU TIÊN SAU 2 ĐỢT (cờ T4 18:19Z).** Attempt3-d8a11644: 20/20 pass, lớp B ĐẠT 5/5, tickCost median **60,0 ms ĐÚNG NGƯỠNG** (n=525; T4 tái tính độc lập khớp — 269/525 tick ≤60, 9 tick đúng =60; biên = 0, xem F-148-T8-3). A1 median 66,0 ms (B2 vi phạm, không tính); A2 median 65,5 ms (cổng tickCost LOẠI live lần đầu tiên, không tính). Probe T4 đã sửa (watchdog 20 phút + abort 3-timeout + re-arm timeout): **0 kẹt trong 3/3 attempt thật** (so với 2/2 kẹt đợt 147). Ngân sách T4 dùng 3/3; poller thoát exit 0 lúc 18:12:45Z. Cộng dồn (c2): 18 lượt hợp lệ.
- **Harness 5/6 — KHÔNG phải 6/6: WebKit 86n2 KẸT THẬT tại P4-lần2, exit 124 (F-148-T8-4).** WebKit 84l10 + 85m4 PASS exit 0; Chromium 84l10/85m4/86n2 PASS exit 0 (P6 KHÔNG-KẸT 90 s). 86n2 WebKit: P1/P2/P3 PASS, P4-lần1 PASS (đồng bộ 2,0 s), rồi evaluate kẹt >60 s tại waitForPlaySync-P4-lần2 (18:30:32Z) — **cùng đúng pha kẹt đợt 141**. Chuỗi "P3 không kẹt" **6 → 0 (ĐỨT)**. Tổng kẹt harness: **5** (đợt 134/135 ×3 + 141 ×1 + 148 ×1). Chromium đối chứng 0 kẹt (N=10 mỗi pha).
- **Watchdog: BÀI KIỂM THẬT ĐẦU TIÊN ĐÃ XẢY RA — CẢ BA LỚP ĐỀU NỔ VÀ CHỤP ĐƯỢC BẰNG CHỨNG LIVE (F-148-T8-5).** (i) WATCHDOG-137 18:30:32Z + probe 1+1 TIMEOUT 30 s 18:31:02Z (kênh evaluate kẹt theo / page JS chết); (ii) LIVE-DIAG-148 ×2 (18:33:08Z im lặng 126 s, 18:37:09Z im lặng 367 s); (4) dump timeout124 18:43:09Z. Cả 3 dump live đều có vite-http 200 (vite sống khỏe) + WebKitWebProcess còn sống, CPU 55,2% → 28,5% → 17,8%, RSS 291.516 → 257.952 → 209.836 kB — **bằng chứng live đầu tiên ủng hộ H3 (WebKitGTK treo, JS chết nhưng renderer còn sống)**. 0 false-positive đợt này (cả 2 lần live-diag đều trúng kẹt thật).
- **Gate harness đợt này SẠCH (F-148-T8-3):** waiter GATE-FOUND poll 35, 18:19:49Z (cờ T4 + POSTBOOT_PASS đường (a) cho boot `d8a11644`, t4attempt=no-lock); harness bắt đầu 18:23:53Z, 4'04" sau gate; T4 đã đóng hẳn (0 process T4 đang chạy). **Lần đầu tiên kể từ đợt 145 harness được trích đúng chuẩn "sau lượt yên #21 hợp lệ"** — không còn lệch chuẩn gate họ F-146/147-T8-3. Caveat duy nhất: median #21 đúng 60,0 ms, biên = 0 (dữ kiện của T4, T8 chỉ trích lại).
- **RAM avail min 272 MB — thấp nhất từ trước tới nay (F-148-T8-7):** sampler n=55, avail 272–1.390 MB, balloon 5.225.972–6.166.924 kB (max 95,7% trần 6.443.824 kB — KHÔNG chạm trần). Avail min 272 MB lúc 18:41:24Z — TRONG LÚC kẹt (sau khi kẹt bắt đầu), kẹt bắt đầu lúc avail còn ~673–1.130 MB. H1 (ngưỡng RAM tuyệt đối) tiếp tục BỊ BÁC BỎ mạnh hơn.
- **T8 ĐÓNG TRƯỚC HẠN:** cờ T8 ~18:53Z — TRƯỚC hạn cờ 20:00Z và hạn cứng 20:30Z (lần đầu kể từ đợt 146 không lỡ hạn mềm, nhờ O8 chạy đầu phiên + T4 đóng cờ sớm 18:19Z).
- **Nhãn log `LIVE-DIAG-147` ĐÃ ĐỔI thành `LIVE-DIAG-148`** trong bản copy driver đợt này (tiền lệ F-147-T8-7): chỉ đổi chuỗi log, không chạm hành vi driver, không chạm script repo.
- **Cây: preview.tsx `530e10a7` (GIỮ VĨNH VIỄN), media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 KHÔNG ĐỔI so với đợt 142–147 (b8c08a7c/610ee003/628088bd — bản vá watchdog còn nguyên).** Không sửa file repo nào khác ngoài LIMITS này.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 17:35:51 19/11 | Lượt cron 00:35 +07 mở đợt 148; boot lúc mở `d8a11644` (btime 17:27:53Z /proc/stat — reboot #35 trong lúc T10-147 đóng sổ, xem F-148-T8-10) |
| ~17:39 | T8 mở: RAM avail 637 MB, balloon 6.181.680 kB; đọc LIMITS T8-147 + aggregate 147 §7/§11/§12.1/§12.3 (qua MEMORY) |
| 17:40 | tree-md5-open: cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 147 (không đổi); fixture REBUILD LẠI (script không có chế độ check-only — chạy rebuild đầy đủ), 6/6 md5 khớp đợt 125 — KHÔNG cần làm gì thêm |
| 17:41:01–17:45:04 | **Driver O8 chạy TRƯỚC attempt T4: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — chạy theo brief cũ, LỆCH CHỮ quyết (j) đã làm rõ (xem F-148-T8-1 (bổ sung)); KHÔNG chạy lại |
| 17:45:42 | Waiter T8 bắt đầu (deadline 20:00Z trong bản copy đợt này); postboot=1 từ poll 1 (đường (a) T5 cho boot `d8a11644`), chỉ chờ cờ T4 |
| 17:59:48–18:03:21 | **T4 attempt1: 20/20, median 66,0 ms, B2 vi phạm** (load1_max=4,29) — không tính, retry 1→2 |
| 18:04:20–18:07:53 | **T4 attempt2: 20/20, median 65,5 ms, B 5/5 — cổng tickCost LOẠI live lần đầu** — không tính, retry 2→3 |
| 18:08:37–18:12:08 | **T4 attempt3: 20/20, median 60,0 ms, B 5/5 — LƯỢT HỢP LỆ, #21 ĐÓNG**; poller thoát exit 0 lúc 18:12:45Z, ngân sách 3/3 |
| 18:19 | **T4 ghi cờ `round148-t4.done`: #21 ĐÓNG** (A3 lượt hợp lệ; probe đã sửa, 0 kẹt 3/3 attempt) |
| 18:19:49 | **GATE-FOUND poll 35 — waiter exit 0** (t4=OK + postboot đường (a) cho boot `d8a11644`, t4attempt=no-lock); T4 đã đóng hẳn (0 process T4) |
| 18:23:53–18:51:07 | **Harness 5/6: WebKit 84l10/85m4 PASS, 86n2 KẸT exit 124 (P4-lần2) + Chromium 84l10/85m4/86n2 PASS** (xem §2) |
| 18:30:32–18:43:09 | **KẸT THẬT + WATCHDOG NỔ: (i) 18:30:32Z, probe timeout 18:31:02Z, (ii) live-diag 18:33:08Z + 18:37:09Z, timeout 900 giết 18:43:08Z, dump bước 4 18:43:09Z** (xem §3) |
| ~18:53 | Kiểm cuối + LIMITS + stage file + cờ `round148-t8.done` — **T8 đóng TRƯỚC hạn cờ 20:00Z** |
| ~18:57 | **BỔ SUNG SAU KHI ĐÓNG:** parent làm rõ quyết (j) — CHUẨN HÓA "O8 sau cờ T4", cap ~19:30Z đợt 148 (tương đương 16:30Z đợt 147); brief "O8 trước T4" ĐÃ LỖI THỜI; T8 bổ sung LIMITS (F-148-T8-1), KHÔNG chạy lại O8, viết lại cờ với md5 mới |

## A. O8 — PASS 3/3 trên boot `d8a11644`, CHẠY TRƯỚC T4 (không điều tra lại)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 17:41:02–17:42:06 | 0 | **21/21 PASS** — S1 PASS 17:41:19 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 17:42:06–17:43:24 | 0 | **21/21 PASS** — S1 PASS 17:42:22, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 17:43:24–17:45:04 | 0 | **21/21 PASS** — S1 PASS 17:44:18 "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true` (kiểm độc lập bằng python — cấu trúc dict `{results, logLines}`, không phải list). WebKit launched 27.2 cả hai attempt. 0 dòng `HARNESS LỖI`, 0 `Target crashed` trong `o8-148t8.log`; log có 10 dòng "21/21 pass" (O8 ×3 + grep đuôi).
- Driver O8 giữ 1 lock vite `t8-round148` suốt lượt (giữ 242 s, đã nhả 17:45:04Z; vite sau release curl 5560/5554 = 000000 — vite theo lượt đã xuống, đúng thiết kế).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-148t8.mjs`, `node --check` OK — bản copy từ đợt 147 đổi nhãn) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 5 → 6 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 147 = 5 (T10 xác nhận bằng JSON/log gốc, không chạy lại); đợt này T8 pass 21/21 ×2 trên boot `d8a11644`.
- **Thứ tự thực tế + lý do (F-148-T8-1 (bổ sung — quyết (j) đã làm rõ sau khi đợt 148 mở)):** O8 chạy ngay đầu phiên, TRƯỚC attempt đo của T4 (attempt1 T4 bắt đầu 17:59:48Z, sau O8 xong 14'44"). Lúc T8 mở phiên, brief đợt 148 giao cho T8 ra lệnh "O8 TRƯỚC attempt T4 (quay lại 'O8 trước T4')" — T8 làm theo brief đó. Nhưng quyết parent §12.3 đợt 147 (j) — được main chat viết trực tiếp SAU KHI đợt 148 mở, nên brief ban đầu của T8 chưa có — CHUẨN HÓA "O8 sau cờ T4", với giới hạn thời gian: nếu cờ T4 chưa về lúc ~19:30Z đợt 148 (tương đương 16:30Z đợt 147) thì T8 chạy O8 luôn, không chờ nữa. **O8 đợt này chạy 17:41:01–17:45:04Z, TRƯỚC mọi cờ T4 (cờ T4 về 18:19Z) và TRƯỚC cả giới hạn 19:30Z — tức lệch chữ quyết (j).** Brief "O8 trước T4" nay ĐÃ LỖI THỜI so với quyết này. **KHÔNG chạy lại O8** (theo chỉ đạo bổ sung). **Dữ kiện giảm nhẹ (đã kiểm chứng từ file T4):** O8 kết thúc 17:45:04Z; T4 bắt đầu hoạt động đo đầu tiên (smoke-wall45) với acquire lock ~17:49:18Z (vite log mtime 17:49:21Z, run log dòng đầu 17:49:24Z), poller T4 bắt đầu 17:50:41Z (deadline trong poller ghi rõ `19:30:00Z`), attempt1 probe-start 17:59:48Z — tức O8 xong TRƯỚC mọi hoạt động đo của T4 ít nhất ~4 phút (trước attempt1 là 14'44"), nên **không chồng tải lên phép đo yên**. **Để T10/parent phán xem có chấp nhận trích O8 này không** (cho chuỗi FULL PASS 5 → 6 và cho kết quả O8 đợt 148 nói chung). Quyết (q): hạn T8 đợt 148 được bảo vệ bằng giới hạn 19:30Z — trên thực tế T8 đóng 18:56Z, trước cả 19:30Z, nên lớp bảo vệ này không phải kích hoạt đợt này. **"Báo cho T4 khi xong" (F-148-T8-2):** không có kênh nhắn trực tiếp tới luồng T4 (luồng anh em); tín hiệu là lock vite đã nhả (TRỐNG 17:45:04Z) + `o8-148t8.log` ghi "O8 DONE 17:45:04Z webkit1=0 webkit2=0 chromium=0" — T4 tự thấy lock trống khi mở cửa yên của họ.
- **O8 đợt này 4'03" tổng** (mỗi attempt ~1') — chậm hơn đợt 147 (2'27") nhưng nhanh hơn đợt 146 (~8'). Thời gian dao động theo lượt, không kết luận (F-148-T8-11).

## 2. Kết quả 6 lần chạy harness (5/6 PASS + 1 KẸT THẬT — GATE SẠCH, #21 HỢP LỆ ĐI KÈM)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 | 0 | 18:23:56–18:25:16 | **PASS** — W1 3/3 (delta +1 mỗi lần), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit | 85m4-hb128 | 0 | 18:25:32–18:27:52 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,9/2,0/1,9 s; P5 40 s 0 restart dư, seek kẹt dài nhất 1 mẫu ~0,2 s) |
| 3 | WebKit | 86n2 | **124** | 18:28:08–18:43:09 | **KẸT THẬT tại P4-lần2** — P1/P2/P3 PASS, P4-lần1 PASS (đồng bộ 2,0 s, ct=1,733), rồi evaluate kẹt >60 s; probe 1+1 TIMEOUT 30 s; timeout 900 giết lúc 18:43:08Z → HARNESS/FAIL "Target page, context or browser has been closed", report `ok=false` (chỉ có phases P1–P3) |
| 4 | Chromium | 84l10 | 0 | 18:43:25–18:44:35 | **PASS** — W1 3/3 (delta +1 mỗi lần, kèm trôi +1 giữa các lần — artifact đã biết, xem F-148-T8-6), W2 PASS (playhead 29,967, restart tự nhiên Δ=0), E4 PASS |
| 5 | Chromium | 85m4-hb128 | 0 | 18:44:51–18:47:01 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,0/1,0/1,0 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 6 | Chromium | 86n2 | 0 | 18:47:17–18:51:07 | **PASS (ok=true)** — P1–P6 đủ (P4 3/3 delta +1, đồng bộ 1,0/0,5/1,0 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s 18:51:03Z) |

- 5 report JSON `ok=true` (2 WebKit + 3 Chromium) + 1 report `ok=false` (WebKit 86n2, chỉ phases P1–P3 — P4 chết giữa lần2 nên không có trong JSON; P4-lần1 PASS chỉ còn trong log). Kiểm độc lập bằng python — không chỉ đọc log.
- Fixture REBUILD đợt này (script `rebuild-fixtures-148t8.sh` không có chế độ check-only — chạy rebuild đầy đủ): 6/6 md5 khớp đợt 125 (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- Gate: harness bắt đầu 18:23:53Z, 4'04" sau GATE-FOUND 18:19:49Z; T4 đã đóng cờ 18:19Z với verdict "#21 ĐÓNG — A3 lượt hợp lệ" và không còn attempt nào đang chạy (ngân sách 3/3) — 0 lần đo yên nào bị phiền. **Harness đợt này ĐƯỢC TRÍCH là "sau lượt yên #21 hợp lệ" — ĐÚNG CHUẨN, lần đầu kể từ đợt 145** (F-148-T8-3). Không còn lệch chuẩn gate họ F-146/147-T8-3.
- Khác đợt 147: đợt 147 harness 6/6 PASS nhưng gate lệch (không có #21 hợp lệ); đợt này harness 5/6 (1 kẹt thật) nhưng gate SẠCH. Hai khía cạnh độc lập — đừng gộp thành một verdict chung.
- **0 retry:** driver `run_one` không retry mù (theo thiết kế từ đợt 142); lần chạy 86n2 WebKit kẹt được ghi đúng là FAIL/timeout 124, không chạy lại. Tiền lệ đợt 141 (retry PASS) không áp dụng ở đây — driver đợt này không có nhánh retry.

## 3. Watchdog trong lượt này — BÀI KIỂM THẬT ĐẦU TIÊN ĐÃ XẢY RA (kẹt thật, cả ba lớp đều nổ)

- **Kẹt thật duy nhất đợt này: WebKit 86n2, P4-lần2 (18:28:08–18:43:09Z).** Dòng sự kiện (log gốc `smoke/run-webkit-86n2.log`): P4-lần1 PASS 18:29:31Z → im lặng → **18:30:32Z `WATCHDOG-137: evaluate im lang >60s tai waitForPlaySync-P4-lần2`** → diag xong 18:30:33Z → **18:31:02Z `WATCHDOG-137 probe waitForPlaySync-P4-lần2: probe-1+1 TIMEOUT 30s (kenh evaluate ket cung / page JS chet)`** → im lặng 726 s → timeout 900 giết 18:43:08Z → `HARNESS/FAIL: page.evaluate: Target page, context or browser has been closed` → `KẾT QUẢ: CÓ FAIL`.
- **Lớp (i) — watchdog chẩn đoán trong script (VÁ 142): NỔ LẦN ĐẦU, ĐÚNG NHƯ THIẾT KẾ.** `ev()` phát hiện evaluate im lặng >60 s, chụp diag ngay (dump `smoke/stall-waitForPlaySync-P4-l_n2-1795113032`, 18:30:32Z), rồi probe 1+1 (một evaluate mới nhỏ) cũng TIMEOUT 30 s — chứng minh **kênh evaluate kẹt theo, không chỉ một lệnh cụ thể** — rồi mới để timeout 900 giết. Không đổi verdict (diag-only).
- **Lớp (ii) — driver canh im lặng >120 s (MỚI 142): NỔ 2/2 LẦN, CẢ HAI ĐỀU TRÚNG KẸT THẬT.** `LIVE-DIAG-148` 18:33:08Z (im lặng 126 s, lan 1/2, devUrl `http://127.0.0.1:5490/`) + 18:37:09Z (im lặng 367 s, lan 2/2) — dump `smoke/stall-live-silence-webkit-86n2-1795113188` + `...-1795113429`. **0 false-positive đợt này** (không có lần diag live nào nổ oan — 5 lần chạy còn lại `live_diags=0`).
- **Bước (4) — dump sau timeout 124: CHẠY ĐÚNG.** Dump `smoke/stall-webkit-86n2-timeout124-1795113789` (18:43:09Z): vite-http 000 (vite theo lượt đã xuống sau khi timeout giết — đúng kỳ vọng, không phải bằng chứng vite chết trước kẹt); avail 858 MB; balloon 6.104.620 kB; 0 process browser còn lại.
- **Bằng chứng live thu được (3 dump lúc kẹt, vite đều 200):**

| Dump | Thời điểm (Z) | WebKitWebProcess | MiniBrowser | vite-http | Avail | Balloon |
|---|---|---|---|---|---|---|
| (i) waitForPlaySync-P4-lần2 | 18:30:32 | RSS 291.516 kB, CPU 55,2% | RSS 182.264 kB | 200 (0,042 s) | 673 MB | ~5,9 GB |
| (ii) live #1 | 18:33:08 | RSS 257.952 kB, CPU 28,5% | RSS 163.856 kB | 200 (0,005 s) | 454 MB | ~5,9 GB |
| (ii) live #2 | 18:37:09 | RSS 209.836 kB, CPU 17,8% | RSS 145.384 kB | 200 (0,028 s) | 510 MB | 5.949.160 kB |

- **Đọc bằng chứng (ghi rõ là SUY LUẬN, không phải chứng minh):** renderer process CÒN SỐNG + vẫn đốt CPU (55,2% → 28,5% → 17,8%, giảm dần) + RSS giảm dần (291 → 258 → 210 MB) trong khi kênh evaluate chết hẳn (probe 1+1 timeout) + vite trả 200 cả 3 lần → **ủng hộ H3 (WebKitGTK treo — JS chết nhưng renderer chưa chết), và LOẠI TRỪ vite chết / process chết / OOM-kill**. CPU/RSS giảm dần trong lúc kẹt là dữ kiện mới (không phải treo cứng 100% CPU) — ghi nhận, chưa giải thích cơ chế.
- **Kết luận:** bản vá watchdog (i)+(ii)+(4) **ĐÃ ĐƯỢC KIỂM CHỨNG BẰNG KẸT THẬT LẦN ĐẦU TIÊN** — cả ba lớp đều nổ đúng lúc và chụp được bằng chứng live có ích. Chuỗi "chưa thử bằng kẹt thật" 6 đợt (142–147) ĐÃ DỪNG ở đợt 148. Bản vá GIỮ NGUYÊN, không revert (quyết parent đợt 142–147 §12.3(l) — nay đã có bằng chứng nó hoạt động).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–148) + đường ổn định `t8-diag-stall.sh` → 148 (symlink đã cập nhật) | 6 lần chạy harness + 3 lần chạy O8; **1 kẹt thật → NỔ 1 lần (86n2 WebKit, 18:30:32Z) + probe 1+1 TIMEOUT 30 s** | **KIỂM CHỨNG XONG BẰNG KẸT THẬT LẦN ĐẦU.** 3 dòng `WATCHDOG-137` chỉ trong log 86n2 WebKit, 0 dòng ở 5 log còn lại |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–148) | 6 lần chạy, `live_diags=2` ở 86n2 WebKit, 0 ở 5 lần còn lại | **NỔ 2/2, cả hai trúng kẹt thật, 0 false-positive.** `dev-url.txt` ghi đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-148t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-148t8.log` đầy đủ (n=55 mẫu) | Balloon 5.225.972–6.166.924 kB trong lúc chạy harness; RAM avail 272–1.390 MB (xem F-148-T8-7) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=10 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 0 restart + P6 PASS |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → kích hoạt 1 lần** (dump timeout124 18:43:09Z) | Dump có đủ ps/RSS/meminfo/loadavg; vite-http 000 (vite đã xuống sau kill — đúng kỳ vọng). Baseline: dmesg 58 B (EPERM tái xác nhận); journalctl -k 17 B (`-- No entries --`) |

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

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file). Driver trong hidden_files có 3 thay đổi nhỏ so với đợt 147: nhãn log `LIVE-DIAG-147` → `LIVE-DIAG-148` (F-148-T8-8), deadline waiter 17:00Z → 20:00Z (hạn cờ đợt này), lock `t8-round147` → `t8-round148` — cả ba chỉ là chuỗi/hằng số trong bản copy, không chạm script repo.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round148` 17:45:04Z (giữ 242 s); driver harness đã nhả lock sau mỗi lần chạy (giữ tối đa ~900 s/lần — lần kẹt giữ đủ 900 s tới timeout).
- Driver harness đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round148` đã nhả.
- Kiểm cuối ~18:52Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` có 3 socket X193/X194/X195 (X193 sinh 18:08Z trong attempt3 T4, X194/X195 sinh 17:51Z trước harness T8 — KHÔNG phải của T8, xem F-148-T8-9), fuser trống (không process nào giữ) — **T8 đã xóa tay, TRỐNG lúc đóng**; lock vite TRỐNG (0 ticket + 100 cooldown).
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 272 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này 5/6 — KHÔNG ĐƯỢC TRÍCH là "6/6 PASS".** WebKit 86n2 KẸT THẬT (exit 124, P4-lần2, report `ok=false`). 5 lần còn lại PASS exit 0, report `ok=true`.
2. **Gate đợt này SẠCH — ĐƯỢC TRÍCH là "harness sau lượt yên #21 hợp lệ"** (F-148-T8-3): cờ T4 18:19Z "#21 ĐÓNG — A3 lượt hợp lệ", GATE-FOUND poll 35 18:19:49Z, harness bắt đầu 18:23:53Z sau khi T4 đóng hẳn. Lần đầu kể từ đợt 145.
3. **Median #21 = 60,0 ms ĐÚNG NGƯỠNG, biên = 0** — dữ kiện của T4 (tái tính độc lập khớp, 269/525 tick ≤60, 9 tick đúng =60). #21 đóng theo luật (median ≤60) nhưng là lượt sát nút tuyệt đối — đừng trích "vượt ngưỡng an toàn" hay "nhanh hơn hẳn".
4. **"Watchdog đã kiểm chứng xong" — CHỈ ĐÚNG Ở MỨC "nó nổ và chụp được bằng chứng".** Bản vá đã qua bài kiểm thật đầu tiên (kẹt 86n2), nhưng kẹt CHƯA ĐƯỢC GIẢI THÍCH (H3 vẫn mở, chỉ được ủng hộ thêm). Đừng trích "kẹt đã hiểu rõ / đã sửa".
5. **Balloon KHÔNG chạm trần trong lúc chạy harness** (F-148-T8-7): max 6.166.924 kB, dưới trần đóng băng 6.443.824 kB (95,7%). Đừng trích trần 6.443.824 kB cho đợt này.
6. **P5 Chromium 86n2 0 restart đợt này** (như đợt 144/145/146/147; khác đợt 143 +1 `ended` tự nhiên) — 0 restart là trường hợp sạch; khác biệt đợt 143 chưa giải thích được, ghi nhận để đối chiếu, không kết luận regression.
7. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–147 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
8. **Chuỗi WebKit FULL PASS = 6 CHỜ T10 xác nhận độc lập VÀ chờ parent/T10 phán về O8 chạy sớm (F-148-T8-1 (bổ sung))** — T8 pass 21/21 ×2 đợt này (trên boot `d8a11644`); nếu T10 pass lúc đóng sổ VÀ chấp nhận trích O8 chạy sớm theo quyết (j) thì chuỗi = 6 vững, nếu không thì vẫn 5.
9. **T8 ĐÓNG TRƯỚC HẠN (cờ ~18:53Z, hạn cờ 20:00Z)** — lần đầu kể từ đợt 146 không lỡ hạn mềm. Đừng trích "T8 xong trước 17:00Z" (hạn đợt này là 20:00Z).
10. **Kẹt 86n2 là dữ kiện của harness T8, không phải của T4** — T4 đã sửa xong kẹt probe của họ (0 kẹt 3/3 attempt); kẹt lần này ở harness WebKit, cùng họ "treo không trả mẫu" nhưng khác cơ chế đo (waitForPlaySync evaluate, không phải writePartial). Đừng gộp hai loại kẹt thành một.

## 8. Sai số mới (F-148-T8-N)

- **F-148-T8-1 — O8 CHẠY SỚM, LỆCH CHỮ QUYẾT (j) ĐÃ LÀM RÕ (BỔ SUNG SAU KHI ĐÓNG — quyết parent đợt 147 §12.3 (j), main chat viết trực tiếp sau khi đợt 148 mở):** quyết (j) CHUẨN HÓA "O8 sau cờ T4", nhưng có giới hạn thời gian — nếu cờ T4 chưa về lúc ~19:30Z đợt 148 (tương đương 16:30Z đợt 147) thì T8 chạy O8 luôn, không chờ nữa. Brief đợt 148 giao cho T8 TRƯỚC KHI quyết (j) xuất hiện ra lệnh ngược lại ("O8 TRƯỚC attempt T4, quay lại 'O8 trước T4'") — brief đó nay ĐÃ LỖI THỜI so với quyết (j). T8 làm theo brief cũ: O8 chạy 17:41:01–17:45:04Z, TRƯỚC mọi cờ T4 (cờ T4 về 18:19Z) và TRƯỚC cả giới hạn 19:30Z — **lệch chữ quyết (j)**. (Ghi chú: bản LIMITS này lúc đóng lần đầu đã viết "cả hai cùng cho một hành động vì cap 16:30Z đã qua trước khi lượt mở" — cách hiểu đó SAI sau khi quyết (j) được làm rõ: cap đợt 148 là ~19:30Z, không phải 16:30Z; T8 sửa lại ở đây.) **KHÔNG chạy lại O8** (theo chỉ đạo bổ sung). **Dữ kiện giảm nhẹ (đã kiểm chứng từ file T4, không chỉ nghe nói):** O8 kết thúc 17:45:04Z; T4 bắt đầu hoạt động đo đầu tiên (smoke-wall45) với acquire lock ~17:49:18Z (vite log `vite-5187-t4-smoke-wall45-d8a11644.log` mtime 17:49:21Z; run log dòng đầu có timestamp 17:49:24Z "đã dọn socket X mồ côi"); poller T4 bắt đầu 17:50:41Z và deadline trong poller ghi rõ `2026-11-19T19:30:00Z` (khớp cap quyết (j) đợt 148); attempt1 probe-start 17:59:48Z. Tức O8 xong TRƯỚC mọi hoạt động đo của T4 ít nhất ~4 phút (trước attempt1 là 14'44") — **không chồng tải lên phép đo yên**. **Để T10/parent phán xem có chấp nhận trích O8 này không** — cho cả kết quả O8 đợt 148 lẫn chuỗi FULL PASS 5 → 6. Quyết (q): hạn T8 đợt 148 được bảo vệ bằng giới hạn 19:30Z — trên thực tế T8 đóng 18:56Z, trước cả 19:30Z, nên lớp bảo vệ này không phải kích hoạt đợt này. T4 LIMITS §10(f) cũng ghi mâu thuẫn chữ về thứ tự O8 (từ góc T4).
- **F-148-T8-2 — "Báo cho T4 khi xong" không có kênh trực tiếp:** T8 và T4 là luồng anh em, không nhắn nhau được; tín hiệu duy nhất là lock vite đã nhả (TRỐNG 17:45:04Z) + `o8-148t8.log` ghi "O8 DONE 17:45:04Z". T4 bắt đầu attempt1 17:59:48Z sau khi tự kiểm gate của họ. Ghi rõ để parent biết giới hạn phối hợp — không phải lỗi thao tác.
- **F-148-T8-3 — GATE SẠCH, LẦN ĐẦU KỂ TỪ ĐỢT 145:** waiter GATE-FOUND poll 35, 18:19:49Z (cờ T4 18:19Z "#21 ĐÓNG — A3 lượt hợp lệ: 20/20, B 5/5, median 60,0 ms" + POSTBOOT_PASS đường (a) cho boot `d8a11644`, t4attempt=no-lock); harness bắt đầu 18:23:53Z sau khi T4 đóng hẳn (0 process T4). **Harness đợt này ĐƯỢC TRÍCH "sau lượt yên #21 hợp lệ" — đúng chuẩn, không còn lệch chuẩn gate họ F-146/147-T8-3.** Caveat: median #21 đúng 60,0 ms, biên = 0 (xem §7.3).
- **F-148-T8-4 — WEBKIT 86N2 KẸT THẬT TẠI P4-LẦN2, CHUỖI "P3 KHÔNG KẸT" 6 → 0:** P1/P2/P3 PASS, P4-lần1 PASS (đồng bộ 2,0 s, ct=1,733), rồi evaluate im lặng >60 s tại waitForPlaySync-P4-lần2 (18:30:32Z); probe 1+1 TIMEOUT 30 s (18:31:02Z); im lặng tới 18:43:08Z (726 s) thì timeout 900 giết → HARNESS/FAIL "Target page, context or browser has been closed", exit 124, report `ok=false` (chỉ phases P1–P3). **Cùng đúng pha kẹt đợt 141 (86n2 WebKit P4-lần2)** — kẹt tái hiện ở cùng một pha lần thứ hai. Tổng kẹt harness: 5 (134/135 ×3 + 141 ×1 + 148 ×1). Chromium 86n2 cùng pha PASS (P4-lần2 PASS, P6 KHÔNG-KẸT 90 s) — kẹt chỉ ở WebKit.
- **F-148-T8-5 — WATCHDOG NỔ LẦN ĐẦU BẰNG KẸT THẬT (xem §3):** (i) WATCHDOG-137 18:30:32Z + diag + probe timeout 18:31:02Z; (ii) LIVE-DIAG-148 ×2 (18:33:08Z im lặng 126 s, 18:37:09Z im lặng 367 s); (4) dump timeout124 18:43:09Z. Cả 3 dump live đều vite-http 200 + WebKitWebProcess còn sống (CPU 55,2% → 28,5% → 17,8%; RSS 291.516 → 257.952 → 209.836 kB). **0 false-positive** (5 lần chạy còn lại `live_diags=0`). Chuỗi "chưa thử bằng kẹt thật" 6 đợt (142–147) ĐÃ DỪNG. Bản vá GIỮ NGUYÊN, không revert.
- **F-148-T8-6 — Chromium 84l10 W1 trôi +1 giữa các lần (artifact test đã biết, cùng họ F-146/147-T8-6):** lần1 0→1, lần2 2→3, lần3 4→5 — mỗi lần delta +1 nhưng mốc xuất phát trôi +1 giữa các lần (double-fire của Chromium khi `ended` còn bật); WebKit cả 3 lần đều 0→1/1→2/2→3 sạch. Script vẫn verdict PASS (ok=true). Ghi nhận để đối chiếu, không đổi verdict.
- **F-148-T8-7 — RAM avail min 272 MB — THẤP NHẤT TỪ TRƯỚC TỚI NAY (sampler n=55):** avail 272–1.390 MB; min 272 MB lúc 18:41:24Z (TRONG LÚC kẹt 86n2, balloon lúc đó 6.166.924 kB); balloon max 6.166.924 kB (95,7% trần 6.443.824 kB — KHÔNG chạm trần). Kẹt BẮT ĐẦU lúc avail còn ~673–1.130 MB (18:28–18:30Z) — avail min xảy ra SAU khi kẹt bắt đầu, không phải trước. H1 tiếp tục BỊ BÁC BỎ mạnh hơn (0 kẹt nào phân tách được bằng ngưỡng RAM tuyệt đối; đợt này kẹt xảy ra dù avail lúc bắt đầu kẹt còn cao).
- **F-148-T8-8 — Nhãn log `LIVE-DIAG-147` ĐÃ ĐỔI thành `LIVE-DIAG-148` (xử lý tiền lệ F-147-T8-7):** đổi chuỗi log trong bản copy driver `run-webkit-148t8.sh` (2 chỗ: echo + grep pattern), không chạm hành vi driver, không chạm script repo. Đợt này nhãn mới ĐÃ XUẤT HIỆN trong log thật 2 lần (18:33:08Z + 18:37:09Z) — lần đầu tiên nhãn live-diag xuất hiện trong log thật (đợt 147 chỉ xác nhận bằng grep). T10/T8 đợt sau giữ nhãn `LIVE-DIAG-148` hay đổi theo đợt thì tùy, nhưng phải đổi trong bản copy driver (không sửa script repo).
- **F-148-T8-9 — 3 socket Xvfb mồ côi X193/X194/X195 — KHÔNG PHẢI CỦA T8 (tinh chỉnh F-147-T8-9):** X194/X195 sinh 17:51Z (TRƯỚC harness T8 18:23Z — trong lúc O8 Chromium? O8 xong 17:45Z; hoặc luồng khác), X193 sinh 18:08Z (TRONG attempt3 T4 18:08:37–18:12:08Z). Đợt 147 kết luận "có thể do Playwright Chromium hoặc Xvfb của harness" — đợt này dữ kiện mới cho thấy socket mồ côi còn sinh ra NGOÀI harness T8 (T4 attempt cũng sinh). T8 đã xóa tay cả 3 (fuser trống), `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối. Nguồn gốc chung vẫn chưa rõ — ghi nhận để đối chiếu; nếu đợt 149 tái hiện thì mở điều tra nhỏ về dọn Xvfb CHUNG (không chỉ harness T8).
- **F-148-T8-10 — Reboot #35 xảy ra TRONG LÚC T10-147 đóng sổ (claim "0 reboot trong phiên" đợt 147 ĐÃ SAI):** boot `d8a11644`, btime 17:27:53Z (/proc/stat) / 17:28:08Z (/proc/1) — chênh 15 s đã hòa giải ở F-148-T2-1/8 (độ trễ init 15,21 s, không phải nghịch lý đồng hồ; xem LIMITS T4-148 F-148-T4-9). T8 mở phiên trên boot mới này; **0 reboot trong phiên T8-148** (boot_id `d8a11644` không đổi từ lúc mở 17:39Z tới lúc đóng 18:52Z). T10-147 đóng 17:33:22Z theo cờ (mtime 17:34:14Z) — reboot #35 lúc ~17:28Z nằm trong phiên đóng sổ của T10, không phải trong phiên T8-148.
- **F-148-T8-11 — O8 đợt này 4'03" tổng (147: 2'27", 146: ~8'):** dao động theo lượt, không kết luận nguyên nhân. Ghi nhận để đối chiếu.
- **F-148-T8-12 — Report JSON 86n2 WebKit chỉ có phases P1–P3 (P4 vắng hẳn):** script chết giữa P4-lần2 nên P4/P5/P6 không có trong JSON; P4-lần1 PASS chỉ còn trong log text (`smoke/run-webkit-86n2.log`). T10 khi đọc report JSON đừng kết luận "P4 chưa chạy lần nào" — P4-lần1 đã PASS, lần2 mới kẹt.

## 9. Nợ cho đợt sau / cần quyết parent

1. **O8 chạy sớm, lệch chữ quyết (j) — parent/T10 phán có chấp nhận trích O8 này không (F-148-T8-1 (bổ sung)):** quyết (j) đã làm rõ (main chat viết trực tiếp sau khi đợt 148 mở): chuẩn hóa "O8 sau cờ T4", cap ~19:30Z đợt 148; brief "O8 trước T4" đã lỗi thời. O8 đợt này chạy 17:41–17:45Z theo brief cũ, trước cờ T4 (18:19Z) và trước cap 19:30Z; KHÔNG chạy lại. Dữ kiện giảm nhẹ đã kiểm chứng: O8 xong 17:45:04Z, trước mọi hoạt động đo của T4 (smoke-wall45 acquire lock ~17:49:18Z; attempt1 17:59:48Z) nên không chồng tải lên phép đo yên. Nếu không chấp nhận: chuỗi FULL PASS giữ 5 (không cộng 6) và kết quả O8 đợt 148 chỉ được trích có điều kiện. Chuẩn đứng cho đợt 149 trở đi là quyết (j) như đã làm rõ (không còn "O8 trước T4").
2. **Kẹt 86n2 WebKit tái hiện đúng pha đợt 141 (P4-lần2) — H3 VẪN MỞ nhưng nay có bằng chứng live đầu tiên (F-148-T8-4/5):** vite sống (200 ×3), renderer sống + đốt CPU giảm dần, kênh evaluate chết hẳn (probe 1+1 timeout). Parent phán: có mở điều tra sâu H3 từ bằng chứng này không (vd: dump stack WebKitWebProcess lúc kẹt, thử waitForPlaySync với timeout riêng), hay tiếp tục giám sát thụ động như trước?
3. **Chuỗi WebKit FULL PASS = 6 (chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 148, trên boot `d8a11644`).**
4. **#21 ĐÃ ĐÓNG (median đúng 60,0 ms, biên = 0)** — đợt 149 đo #22 như thường lệ (cộng dồn (c2) nay 18 lượt hợp lệ). T4 là chủ quản; T8 chỉ ghi nhận để trích gate cho đúng.
5. **Watchdog ĐÃ QUA bài kiểm thật đầu tiên** — giữ nguyên bản vá, không revert (quyết parent đợt 142–147 §12.3(l) — nay có bằng chứng hoạt động). Nếu đợt sau có kẹt thật nữa, (i)+(ii) sẽ chụp tiếp; đừng trích "kẹt đã hiểu rõ" (H3 vẫn mở).
6. **Điều tra kẹt chung VẪN MỞ** (H1 BÁC BỎ — mạnh hơn sau avail min 272 MB, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ, nay được ủng hộ bằng bằng chứng live đầu tiên) — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
7. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.
8. Socket mồ côi: `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối (T8 xóa tay X193/194/195) — không còn nợ dọn socket. Nhưng nguồn gốc nay rộng hơn harness T8 (xem F-148-T8-9).

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 148 (KẸT THẬT ĐẦU TIÊN KỂ TỪ ĐỢT 141)

## B1. Trạng thái giả thuyết sau đợt 148

| Giả thuyết | Trạng thái đợt 147 | Trạng thái đợt 148 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên, mạnh hơn)** | Kẹt xảy ra khi avail lúc bắt đầu còn ~673–1.130 MB; avail min 272 MB chỉ xuất hiện SAU khi kẹt bắt đầu (18:41:24Z). Không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass — 5 lần chạy còn lại pass dù avail xuống 272 MB |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | Balloon max 6.166.924 kB, không chạm trần 6.443.824 kB — chỉ là tương quan; avail tụt trong lúc kẹt là hệ quả (process kẹt giữ tài nguyên), không chứng minh được là nguyên nhân |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ — NHƯNG ĐƯỢC ỦNG HỘ BẰNG BẰNG CHỨNG LIVE ĐẦU TIÊN** | Kẹt 86n2: renderer còn sống + đốt CPU + kênh evaluate chết hẳn (probe 1+1 timeout) + vite 200 cả 3 lần — đúng chữ ký H3. Chưa chứng minh cơ chế cụ thể (deadlock/IPC/GStreamer chưa phân biệt được) |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 148

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–148) + đường ổn định `t8-diag-stall.sh` → 148 (symlink đã cập nhật) | 6 lần chạy harness + 3 lần chạy O8; **1 kẹt thật → NỔ 1 lần + probe 1+1 TIMEOUT** | **KIỂM CHỨNG XONG BẰNG KẸT THẬT LẦN ĐẦU (18:30:32Z + 18:31:02Z).** 3 dòng `WATCHDOG-137` chỉ trong log 86n2 WebKit |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–148) | 6 lần chạy, `live_diags=2` ở 86n2 WebKit, 0 ở 5 lần còn lại | **NỔ 2/2, cả hai trúng kẹt thật, 0 false-positive;** `dev-url.txt` đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-148t8.log` (n=55) | Balloon 5,23–6,17 GB, RAM avail 272–1.390 MB trong lúc chạy harness; KHÔNG chạm trần 6.443.824 kB |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=10 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, truyền devUrl thật) | **1 lần kẹt → kích hoạt 1 lần** (dump timeout124 18:43:09Z) | Dump có đủ ps/RSS/meminfo/loadavg; vite-http 000 (vite đã xuống sau kill). Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3), bổ sung đợt 148

- Chữ ký đợt 148 (86n2 WebKit, P4-lần2): evaluate im lặng >60 s tại `waitForPlaySync` → probe 1+1 (evaluate mới) TIMEOUT 30 s → log im lặng 726 s → timeout 900 giết → `page.evaluate: Target page, context or browser has been closed`. Renderer process còn sống, CPU 55,2% → 28,5% → 17,8%, RSS 291.516 → 257.952 → 209.836 kB; vite-http 200 cả 3 lần lúc kẹt. **Khác đợt 141 ở chỗ: lần này có bằng chứng live đầy đủ (3 dump) thay vì chỉ log + exit code.**
- Điểm kẹt: P4-lần2 của 86n2 — **cùng đúng pha với đợt 141**. Hai lần kẹt 86n2 WebKit (141 + 148) đều ở P4-lần2; ba lần kẹt đợt 134/135 ở pha khác (xem LIMITS đợt 137 §B3). P4-lần2 (waitForPlaySync sau khi ép ended) là điểm nóng tái hiện — ghi nhận để điều tra tập trung nếu parent mở điều tra H3.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 148: 5 LẦN CHẠY HARNESS PASS, 1 KẸT (CHUỖI 6 → 0)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **3 → 4**.
- Đợt 146: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **4 → 5**.
- Đợt 147: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **5 → 6**.
- Đợt 148: **6 lần chạy harness, 1 KẸT (86n2 WebKit, P4-lần2, exit 124), 0 FAIL oan** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **6 → 0 (ĐỨT)**.
- **Năm lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=10 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 148: T4 sửa xong kẹt probe, #21 đóng; kẹt harness là loại khác

- T4 đợt này sửa probe (watchdog 20 phút + abort 3-timeout + re-arm timeout) theo quyết parent §12.3 đợt 147 — **0 kẹt trong 3/3 attempt thật** (so với 2/2 kẹt đợt 147); #21 ĐÓNG ở attempt3 (median đúng 60,0 ms). Kẹt probe T4 (writePartial timeout) và kẹt harness T8 (waitForPlaySync evaluate) là **hai chữ ký khác nhau** — đừng gộp thành một lỗi.
- 0 reboot trong phiên T8-148 (reboot #35 xảy ra trước khi T8 mở, trong lúc T10-147 đóng sổ). Vite server còn sống lúc kẹt: vite-http 200 cả 3 dump live lúc kẹt (0,042 s / 0,005 s / 0,028 s) — **vite KHÔNG phải nguyên nhân kẹt** (bằng chứng trực tiếp lần đầu, thay vì chỉ suy luận).

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (mạnh hơn sau avail min 272 MB + kẹt bắt đầu lúc avail còn cao). H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, nay được ủng hộ bằng bằng chứng live đầu tiên (renderer sống + CPU đốt + evaluate chết + vite 200).
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143 (trạng thái boot mới); đợt này O8 PASS 3/3 thường kỳ, chuỗi FULL PASS 5 → 6 (chờ T10 xác nhận độc lập VÀ chờ parent/T10 phán về O8 chạy sớm theo quyết (j) — xem F-148-T8-1 (bổ sung)).** Không mở điều tra mới về O8; nếu O8 WebKit FAIL lại ở đợt 149 thì mở điều tra lại từ đầu.
- **Lượt yên #21 ĐÃ ĐÓNG (lượt hợp lệ đầu tiên sau 2 đợt) — gate harness đợt này SẠCH, đúng chuẩn lần đầu kể từ đợt 145.** Không còn lệch chuẩn gate họ F-146/147-T8-3.
- **Bản vá watchdog đợt 142 ĐÃ QUA bài kiểm thật đầu tiên**: kẹt 86n2 đợt này kích hoạt (i) + probe timeout + (ii) ×2 + dump bước 4 — cả bốn đều chụp được bằng chứng live có ích. Nếu đợt sau có kẹt thật nữa, giữ nguyên cơ chế để chụp tiếp.

## B7. Bằng chứng mới từ đợt 148 — O8 PASS 3/3 TRƯỚC T4, HARNESS 5/6 (86N2 WEBKIT KẸT THẬT), #21 ĐÓNG, WATCHDOG NỔ LẦN ĐẦU

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot `d8a11644` (17:41:01–17:45:04Z — 4'03", chạy TRƯỚC attempt T4, lệch chữ quyết (j) đã làm rõ — xem F-148-T8-1 (bổ sung)); S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness: WebKit 84l10/85m4 PASS + 86n2 KẸT exit 124 (P4-lần2) + Chromium 84l10/85m4/86n2 PASS exit 0 — **CHẠY SAU LƯỢT YÊN #21 HỢP LỆ (GATE-FOUND poll 35, 18:19:49Z; cờ T4 18:19Z "#21 ĐÓNG — A3 lượt hợp lệ, median 60,0 ms đúng ngưỡng")**.
- Vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, **NỔ LẦN ĐẦU BẰNG KẸT THẬT** (WATCHDOG-137 18:30:32Z + probe 1+1 TIMEOUT 18:31:02Z + LIVE-DIAG-148 ×2 18:33:08Z/18:37:09Z + dump timeout124 18:43:09Z); 0 false-positive; chuỗi "chưa thử bằng kẹt thật" 6 đợt ĐÃ DỪNG.
- Sampler: balloon 5,23–6,17 GB, RAM avail 272–1.390 MB trong lúc chạy harness (KHÔNG chạm trần 6.443.824 kB; avail min 272 MB — thấp nhất từ trước tới nay, H1 tiếp tục BỊ BÁC BỎ).
- T8 đóng TRƯỚC HẠN (~18:53Z, hạn cờ 20:00Z) — lần đầu kể từ đợt 146 không lỡ hạn mềm.
- Nhãn log `LIVE-DIAG-147` đã đổi thành `LIVE-DIAG-148` trong bản copy driver — nhãn mới ĐÃ XUẤT HIỆN trong log thật 2 lần (lần đầu tiên). 3 socket Xvfb mồ côi X193/194/195 đã xóa tay, `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối (nhưng X193 sinh trong attempt3 T4, X194/195 sinh trước harness T8 — nguồn gốc rộng hơn harness).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round148-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI**): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142–147; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round148-t8/` (run-webkit-148t8.sh — ĐÃ CHẠY 5/6 PASS + 1 KẸT 124 (gate SẠCH, sau #21 hợp lệ); diag-stall-148t8.sh — ĐÃ DÙNG 4 LẦN (1× (i) + 2× (ii) live + 1× bước 4 timeout124); rebuild-fixtures-148t8.sh — ĐÃ CHẠY (rebuild đầy đủ, 6/6 md5 khớp đợt 125); wait-t4-t5-148t8.sh — ĐÃ CHẠY (GATE-FOUND poll 35, 18:19:49Z, deadline 20:00Z); o8-driver-148t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21, trước T4); o8-s1-probe-148t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-148t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 145, không cần tạo lại); smoke/wait-t4-t5.log (waiter, GATE-FOUND poll 35); smoke/run-webkit-summary.txt (driver 18:23:53–18:51:07Z, ec webkit 0/0/124; chromium 0/0/0); smoke/ram-148t8.log (sampler 30 s, n=55, có cột balloon_kb); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/stall-waitForPlaySync-P4-l_n2-1795113032 + smoke/stall-live-silence-webkit-86n2-1795113188 + smoke/stall-live-silence-webkit-86n2-1795113429 + smoke/stall-webkit-86n2-timeout124-1795113789 (4 dump chẩn đoán kẹt); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai; O8 ecbd1b40/8911ad3d cả hai); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng); smoke/baseline-meminfo.txt (17:43Z, boot d8a11644); o8-148t8.log + o8-lock.log (driver O8 17:41:01–17:45:04Z, lock giữ 242 s); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round148-t8/diag-stall-148t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild đợt này, 6/6 md5 khớp.
