# Đợt 147 T8 — O8 21/21 ×3 PASS + HARNESS 6/6 PASS NHƯNG #21 VẪN CHƯA CÓ LƯỢT HỢP LỆ + T4 KẸT 2/2 ATTEMPT

Ngày: 19/11/2026 (lượt cron 21:35 +07 = 14:35:51Z; T8 mở ~14:39Z, đóng ~17:20Z trên boot `6fb582df` btime 12:13:26Z = #110? chặt — KHÔNG có reboot trong phiên T8). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (mỗi bên ít nhất 1 lần, WebKit ×2 như đợt 143–146); (2) harness đứng 6/6 — PASS kỹ thuật nhưng **KHÔNG QUA GATE ĐÚNG CHUẨN** (xem §0); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND146_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 + harness 6/6 KHÔNG có #21 hợp lệ; watchdog 0 kích hoạt đợt thứ 5; reboot #34 giữa lượt); docs/PHASE9_ROUND146_LIMITS.md §7, §11, §12.3 (k)(n) (quyết (k) CHẤP NHẬN harness-lệch-chuẩn với trích "sau khi T4 đóng cờ"; quyết (n) watchdog GIỮ NGUYÊN bản vá, chờ kẹt thật; quyết (h) đo lại #21 ở đợt 147 trên boot mới 6fb582df).

## 0. Kết luận ngắn — O8 PASS 3/3, HARNESS 6/6 PASS NHƯNG #21 VẪN CHƯA CÓ LƯỢT HỢP LỆ, WATCHDOG 0 KÍCH HOẠT (ĐỢT THỨ 6 LIÊN TIẾP), T8 LỠ HẠN MỀM 17:00Z

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (16:58:16–17:00:43Z, boot `6fb582df` ~4h45' tuổi lúc chạy, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần ("checked=true → false, Playwright mouse click lần 2" WebKit; "CDP mouse click lần 2" Chromium — xem §A). Report JSON: 21 kết quả, 0 fail cả hai engine (kiểm độc lập bằng python). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL). **KHÔNG có điều tra lại** — O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143, đợt này chỉ kiểm lại thường kỳ.
- **Chuỗi WebKit FULL PASS: 4 → 5 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 146 = 4 (chờ xác nhận); đợt này T8 pass 21/21 ×2 trên boot `6fb582df`; nếu T10 cũng pass lúc đóng sổ thì chuỗi = 5 vững.
- **Lượt yên #21: VẪN CHƯA CÓ LƯỢT HỢP LỆ (cờ T4 16:53Z, tìm thấy 16:57:43Z)** — đo lại trên boot mới `6fb582df` theo quyết (h) đợt 146: A1 median **51,0 ms** (17/20, n=472), A2 median **37,0 ms** (11/20, n=351) — cả hai đều DƯỚI ngưỡng 60 ms, nhưng cả hai attempt đều **KẸT (wedge sau writePartial timeout)** nên KHÔNG có verdict hợp lệ nào. Kết luận T4: **chậm là BOOT-SPECIFIC (98a7c93f), không phải hệ thống** — thí nghiệm phân biệt (h) trả lời: median về ~50 ms trên boot mới. Poller T4 đã có cổng tickCost (unit-test ok, chưa kích hoạt live). Ngân sách 2/3, attempt3 không chạy (hết giờ cờ 17:00Z).
- **Harness 6/6 PASS, exit 0 toàn bộ (17:00:58–17:16:46Z), 0 kẹt, 0 retry — NHƯNG KHÔNG ĐƯỢC TRÍCH LÀ "QUA GATE SAU LƯỢT YÊN HỢP LỆ" (F-147-T8-3, cùng họ F-146-T8-3 / F-144-T8-3):** waiter TÌM ĐƯỢC gate kỹ thuật (GATE-FOUND poll 136 lúc 16:57:16Z — cờ T4 16:53Z + POSTBOOT_PASS đường (a) cho boot `6fb582df`) nhưng nội dung cờ T4 là "#21 VẪN CHƯA có lượt hợp lệ". T4 đã đóng hẳn (0 process T4 đang chạy lúc kiểm 16:58:01Z, ngân sách 2/3, attempt3 không chạy) nên harness không thể làm phiền phép đo yên nào nữa — T8 chạy harness theo quyết parent (k) đợt 146 (CHẤP NHẬN trích "harness sau khi T4 đóng cờ"), và ghi rõ lệch chuẩn này để parent/T10 phán. WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2. 86n2 WebKit P4-lần2 PASS (điểm kẹt đợt 141) + P6 KHÔNG-KẸT 90 s cả hai engine.
- **Watchdog: 0 kích hoạt — vì 0 kẹt (F-147-T8-4):** 0 dòng `WATCHDOG-137` trong 6 log, 0 `LIVE-DIAG-147`, `live_diags=0` cả 6, 0 dir dump live mới. Bài kiểm thật đầu tiên của bản vá **VẪN CHƯA XẢY RA (đợt thứ sáu liên tiếp)** — 36/36 lần chạy harness sạch sau vá.
- **T8 LỠ HẠN MỀM 17:00Z (F-147-T8-2):** cờ T4 chỉ về 16:53Z (T4 kẹt 2/2 attempt, xem §1) nên O8 chỉ bắt đầu được 16:58:16Z và harness 17:00:58Z; T8 đóng ~17:20Z — TRONG hạn cứng toàn đợt 17:30Z, nhưng sau hạn mềm T8 17:00Z. Nguyên nhân là chờ gate (quyết parent (i) đợt 143 + nhiệm vụ T8 đợt này), không phải chậm thao tác: O8 chỉ mất 2'27" và harness 15'48".
- **Nhãn log `LIVE-DIAG-143` ĐÃ ĐỔI thành `LIVE-DIAG-147`** trong bản copy driver đợt này (F-146-T8-9 — ĐÃ XỬ LÝ, xem F-147-T8-7): chỉ đổi chuỗi log, không chạm hành vi driver, không chạm script repo.
- **Cây: preview.tsx `530e10a7` (GIỮ VĨNH VIỄN), media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 KHÔNG ĐỔI so với đợt 142–146 (b8c08a7c/610ee003/628088bd — bản vá watchdog còn nguyên).** Không sửa file repo nào khác ngoài LIMITS này.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 14:35:51 19/11 | Lượt cron 21:35 +07 mở đợt 147; boot lúc mở `6fb582df` (btime 12:13:26Z, #110? chặt) |
| ~14:39 | T8 mở: RAM avail 1.463 MB, balloon 5.321.684 kB; đọc LIMITS T8-146 + aggregate 146 §7/§12.3(k)(n) |
| 14:40 | tree-md5-open: cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 146 (không đổi); fixture /tmp CÒN NGUYÊN 6/6 md5 khớp đợt 125 — KHÔNG cần rebuild |
| 14:41:53 | Waiter T8 bắt đầu (deadline sửa 13:30Z → 17:00Z trong bản copy đợt này, xem F-147-T8-5); postboot=1 từ poll 1 (đường (a) T5 cho boot `6fb582df`), chỉ chờ cờ T4 |
| 14:45:01–14:47:43 | T4 poller chờ cửa yên (poll #1–#4; load1 4,23→1,46, RAM avail 2.109–2.457 MB); cửa yên mở poll #4 14:47:43Z (gate0 T5 + gateA đủ) → attempt1 chạy ngay |
| 14:47:43–16:38:50 | **T4 attempt1: 17/20 pass rồi KẸT** — writePartial timeout 30 s liên tục (tickCost n=472, blendTick n=384, c2DrawLog n=915), treo ~1h48' giữa pass 17 và 18, cuối cùng target-closed ở pass 18, exit=2, partial JSON, KHÔNG verdict (ngân sách 1/3) |
| 16:39–~16:53 | **T4 attempt2: 11/20 pass rồi KẸT cùng mẫu** — writePartial timeout 30 s (tickCost n=351, blendTick n=288, c2DrawLog n=686), KHÔNG verdict (ngân sách 2/3); attempt3 KHÔNG chạy (hết giờ cờ 17:00Z) |
| 16:42:03 | Vòng theo dõi cờ T4 lần 1 của T8 hết 120' — chưa có cờ; T4 attempt2 đang chạy (vite 5187 + probe còn sống) — T8 KHÔNG chạy O8 song song để không nhiễm tải vào phép đo lại #21 (F-147-T8-1) |
| 16:53 | **T4 ghi cờ `round147-t4.done`: #21 VẪN CHƯA có lượt hợp lệ** (A1 median 51,0 ms 17/20; A2 median 37,0 ms 11/20; BOOT-SPECIFIC; tickCost đã có trong poller, unit-test ok, chưa live) |
| 16:57:16 | **GATE-FOUND poll 136 — waiter exit 0** (t4=OK + postboot đường (a) cho boot `6fb582df`, t4attempt=no-lock); T4 đã đóng hẳn (0 process T4, kiểm 16:58:01Z) |
| 16:58:16–17:00:43 | **Driver O8 chạy trên boot `6fb582df`: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) |
| 17:00:58–17:16:46 | **Harness 6/6 PASS, 0 kẹt, 0 retry — NHƯNG KHÔNG CÓ #21 HỢP LỆ ĐI KÈM (F-147-T8-3)** (xem §2) |
| ~17:20 | Kiểm cuối + LIMITS + stage file + cờ `round147-t8.done` — **T8 đóng** (sau hạn mềm 17:00Z, trong hạn cứng 17:30Z — F-147-T8-2) |

## A. O8 — PASS 3/3 trên boot `6fb582df` (không điều tra lại)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 16:58:16–16:59:06 | 0 | **21/21 PASS** — S1 PASS 16:58:28 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 16:59:06–16:59:53 | 0 | **21/21 PASS** — S1 PASS 16:59:15, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 16:59:53–17:00:43 | 0 | **21/21 PASS** — S1 PASS "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true` (kiểm độc lập bằng python — cấu trúc dict `{results, logLines}`, không phải list). WebKit launched 27.2 cả hai attempt. 0 dòng `HARNESS LỖI`, 0 `Target crashed` trong `o8-147t8.log`.
- Driver O8 giữ 1 lock vite `t8-round147` suốt lượt (giữ 147 s, đã nhả 17:00:43Z; vite sau release curl 5560/5554 = 000000 — đã kiểm trong driver).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-147t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 4 → 5 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 146 = 4 (chờ xác nhận); đợt này T8 pass 21/21 ×2 trên boot `6fb582df`.
- **Caveat:** O8 đợt này chạy SAU khi T4 đóng cờ (16:58Z, cờ T4 16:53Z) — KHÁC đợt 144/145/146 (O8 chạy trước khi T4 mở cửa yên). Lý do: hoãn O8 để không nhiễm tải vào phép đo lại #21 (F-147-T8-1). O8 và harness đợt này chạy CÙNG boot `6fb582df` (khác đợt 146 chia đôi boot).
- **O8 đợt này nhanh bất thường: 2'27" tổng (mỗi attempt ~50 s)** so với ~8' đợt 146 (mỗi attempt ~3'). Không rõ nguyên nhân — có thể do boot mới nhẹ tải hơn, hoặc do fixture/vite đã ấm. Ghi nhận để đối chiếu, không kết luận.

## 2. Kết quả 6 lần chạy harness (6/6 PASS, 0 retry — KHÔNG CÓ #21 HỢP LỆ ĐI KÈM)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 | 0 | 17:00:58–17:02:08 | **PASS** — W1 3/3 (delta +1 mỗi lần), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit | 85m4-hb128 | 0 | 17:02:24–17:04:34 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ ~1,2 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 3 | WebKit | 86n2 | 0 | 17:04:49–17:08:49 | **PASS** — P1–P6 đủ (P4 3/3 delta +1, đồng bộ 1,2 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s) |
| 4 | Chromium | 84l10 | 0 | 17:09:05–17:10:15 | **PASS** — W1 3/3 (delta +1 mỗi lần, kèm trôi +1 giữa các lần — artifact đã biết, xem F-147-T8-6), W2 PASS (playhead 29,933, restart tự nhiên Δ=0), E4 PASS |
| 5 | Chromium | 85m4-hb128 | 0 | 17:10:30–17:12:41 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 0,5–1,1 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 6 | Chromium | 86n2 | 0 | 17:12:56–17:16:46 | **PASS (ok=true)** — P1–P6 đủ (P4 3/3 delta +1, đồng bộ 1,0 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s) |

- 6 report JSON đều `ok=true` (3 WebKit + 3 Chromium, kiểm độc lập bằng python — không chỉ đọc log).
- Fixture KHÔNG cần rebuild đợt này (còn nguyên sau reboot #34, 6/6 md5 khớp đợt 125); blend media bền còn nguyên (f1e277f0 / f4c35a6a — kiểm trong rebuild script, không chạy lại).
- Gate: harness bắt đầu 17:00:58Z, 3'42" sau GATE-FOUND 16:57:16Z; T4 đã đóng cờ 16:53Z và không còn attempt nào đang chạy (ngân sách 2/3, attempt3 không chạy) — 0 lần đo yên nào bị phiền (T4 đã xong toàn bộ trước khi harness bắt đầu). **Nhưng cờ T4 mang verdict "#21 VẪN CHƯA có lượt hợp lệ" — harness đợt này KHÔNG được trích là "sau lượt yên #21 hợp lệ"** (F-147-T8-3).
- Khác đợt 146: đợt 146 #21 không hợp lệ vì median 97–101 ms (vượt ngưỡng); đợt này #21 không hợp lệ vì **cả 2 attempt đều kẹt (wedge)** dù median partial 51,0/37,0 ms đều DƯỚI ngưỡng 60 ms. Hai kiểu "không hợp lệ" khác nhau — đợt này là kẹt probe, không phải chậm hệ thống.

## 3. Watchdog trong lượt này — bài kiểm thật đầu tiên VẪN CHƯA XẢY RA (0 kẹt, đợt thứ sáu liên tiếp)

- **0 kẹt thật đợt này** nên cả hai lớp watchdog mới đều không có dịp nổ: 0 dòng `WATCHDOG-137` trong 6 log lần chạy; 0 dòng `LIVE-DIAG-147` trong summary; 0 dir `stall-live-*` / `stall-*-timeout124-*` mới (chỉ có `diag-stall-147t8.sh` chưa dùng).
- **Vòng canh mtime đã chạy thật trên cả 6 lần chạy:** mỗi `run_one` poll mtime 10 s/lần trong suốt lần chạy (tổng ~16 phút chạy, `live_diags=0` cả 6 lần) — không false-positive nào dù W2 im lặng tới ~70 s và P5/P6 chờ 40–90 s (ngưỡng 120 s đủ dự trữ). `dev-url.txt` được ghi đúng cả 6 scratch (`http://127.0.0.1:5390/` / `:5490/`) — đường truyền devUrl cho diag live đã sẵn sàng, chỉ chưa có dịp dùng.
- **Kết luận:** bản vá (i)+(ii) đã triển khai đúng + chạy sạch qua 6/6 lần chạy đợt này (cộng dồn **36/36 lần chạy sạch sau vá, 6 đợt**), nhưng **CHƯA được kiểm chứng bằng kẹt thật** — đừng trích "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo (nếu có) mới là bài kiểm thật đầu tiên.
- **Lưu ý chéo:** T4 đợt này kẹt 2/2 attempt với chữ ký `page.evaluate` timeout 30 s rồi target-closed — cùng họ "treo không trả mẫu" mà watchdog được vá để bắt. Nhưng kẹt đó xảy ra ở probe T4 (ngoài harness T8, không qua script đã vá), nên watchdog T8 vẫn chưa có mẫu kẹt thật. T4 là chủ quản điều tra kẹt của họ; T8 chỉ ghi nhận chữ ký khớp (xem §7.1).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–147) + đường ổn định `t8-diag-stall.sh` → 147 (symlink đã cập nhật) | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 6 liên tiếp).** 36/36 lần chạy sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–147) | 6 lần chạy, poll 10 s/lần, `live_diags=0` cả 6 | **Chạy đúng, 0 false-positive.** `dev-url.txt` ghi đủ 6 scratch — đường devUrl sẵn sàng |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-147t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-147t8.log` đầy đủ (n=32 mẫu) | Balloon 4.832.692–5.910.060 kB trong lúc chạy harness; RAM avail 456–1.888 MB (xem F-147-T8-8) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=9 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 0 restart + P6 PASS |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | 0 lần kẹt → không kích hoạt | Baseline đã lưu: dmesg 58 B (EPERM tái xác nhận); journalctl -k 17 B (`-- No entries --`). Cơ chế (ii) + devUrl thật chưa có dịp dùng |

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

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file). Driver trong hidden_files có 2 thay đổi nhỏ so với đợt 146: nhãn log `LIVE-DIAG-143` → `LIVE-DIAG-147` (F-147-T8-7) và deadline waiter 13:30Z → 17:00Z (F-147-T8-5) — cả hai chỉ là chuỗi/hằng số trong bản copy, không chạm script repo.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round147` 17:00:43Z (giữ 147 s); driver harness đã nhả lock sau mỗi lần chạy (giữ tối đa ~240 s/lần).
- Driver harness đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round147` đã nhả.
- Kiểm cuối ~17:18Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` có 3 socket mồ côi X193/X194/X195 (sinh 17:13Z trong lúc chạy Chromium 86n2, KHÔNG process nào giữ — fuser trống) — **T8 đã xóa tay, TRỐNG lúc đóng** (F-147-T8-9); lock vite TRỐNG (0 ticket + 101 cooldown).
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 456 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này 6/6 PASS NHƯNG #21 VẪN CHƯA có lượt hợp lệ đi kèm** — cùng họ lệch chuẩn F-146-T8-3 (đợt 146 #21 không hợp lệ vì median 97–101 ms; đợt này vì cả 2 attempt đều kẹt dù median partial 51,0/37,0 ms dưới ngưỡng). Trích đúng: "harness 6/6 PASS, chạy sau khi T4 đóng cờ nhưng #21 vẫn chưa có lượt hợp lệ (2/2 attempt kẹt, không verdict)". **Đừng trích "harness QUA GATE sau #21 hợp lệ" — sai.**
2. **"0 WATCHDOG" đợt này KHÔNG có nghĩa "watchdog đã kiểm chứng xong".** Có 0 kẹt thật để thử — đợt thứ sáu liên tiếp. Bản vá mới chỉ qua smoke-test (đợt 142) + 36 lần chạy sạch.
3. **Balloon KHÔNG chạm trần trong lúc chạy harness** (F-147-T8-8): max 5.910.060 kB, dưới trần đóng băng 6.443.824 kB. Đừng trích trần 6.443.824 kB cho đợt này.
4. **P5 Chromium 86n2 0 restart đợt này** (như đợt 144/145/146; khác đợt 143 +1 `ended` tự nhiên) — 0 restart là trường hợp sạch; khác biệt đợt 143 chưa giải thích được, ghi nhận để đối chiếu, không kết luận regression.
5. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–146 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
6. **Chuỗi WebKit FULL PASS = 5 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này (trên boot `6fb582df`); nếu T10 pass lúc đóng sổ thì chuỗi = 5 vững, nếu không thì vẫn 4.
7. **T8 LỠ HẠN MỀM 17:00Z (F-147-T8-2)** — đóng ~17:20Z, trong hạn cứng 17:30Z. Đừng trích "T8 xong trước 17:00Z".
8. **T4 kẹt 2/2 attempt là dữ kiện của T4, không phải của T8** — T8 chỉ ghi nhận chữ ký (writePartial timeout 30 s → target-closed) để đối chiếu với điều tra kẹt chung; không kết luận nguyên nhân, không mở điều tra mới.

## 8. Sai số mới (F-147-T8-N)

- **F-147-T8-1 — O8 HOÃN tới sau cờ T4 (quyết mới trong lượt, khác đợt 144/145/146):** đợt 144–146 O8 chạy TRƯỚC khi T4 mở cửa yên; đợt này T4 đã mở cửa yên 14:47:43Z (trước khi T8 kịp chạy O8) và attempt1/2 đang đo, nên T8 hoãn O8 tới sau cờ T4 (16:58:16Z) để không nhiễm tải vào phép đo lại #21 — thí nghiệm phân biệt quyết (h) đợt 146. Hệ quả: T8 lỡ hạn mềm 17:00Z (F-147-T8-2). Đánh đổi có chủ ý, ghi rõ để parent/T10 phán xem thứ tự này có nên thành chuẩn mới hay quay lại O8-trước-T4 ở đợt 148.
- **F-147-T8-2 — T8 lỡ hạn mềm 17:00Z, đóng ~17:20Z (trong hạn cứng 17:30Z):** cờ T4 về 16:53Z; O8 16:58:16–17:00:43Z (2'27"); harness 17:00:58–17:16:46Z (15'48"); kiểm cuối + LIMITS + stage ~17:17–17:20Z. Không phải chậm thao tác — thời gian chạy thực tế ngắn hơn đợt 146 (O8 2'27" so với ~8'; harness 15'48" so với ~16'). Nguyên nhân duy nhất là chờ gate tới 16:53Z.
- **F-147-T8-3 — Harness 6/6 PASS nhưng #21 VẪN CHƯA có lượt hợp lệ đi kèm (lệch chuẩn gate, cùng họ F-146-T8-3):** waiter tìm được gate kỹ thuật (cờ T4 16:53Z + postboot đường (a) cho boot `6fb582df`, GATE-FOUND poll 136, 16:57:16Z) nhưng nội dung cờ là "#21 VẪN CHƯA có lượt hợp lệ" — 2/2 attempt kẹt (wedge sau writePartial timeout), không verdict, dù median partial 51,0/37,0 ms đều dưới ngưỡng 60 ms. T4 đã đóng hẳn (0 process đang chạy lúc kiểm 16:58:01Z, ngân sách 2/3, attempt3 không chạy) nên harness không phiền phép đo nào; T8 chạy theo quyết parent (k) đợt 146 và ghi rõ lệch chuẩn để parent/T10 phán. Khác đợt 146: kiểu "không hợp lệ" đợt này là kẹt probe, không phải median vượt ngưỡng.
- **F-147-T8-4 — 0 kẹt đợt này, chuỗi "P3 không kẹt" 5 → 6:** 6/6 lần chạy harness + 3/3 lần chạy O8, 0 kẹt, 0 FAIL. 86n2 WebKit P4-lần2 PASS (đồng bộ 1,2 s) — điểm kẹt đợt 141 không tái hiện lần thứ sáu liên tiếp.
- **F-147-T8-5 — Deadline waiter trong bản copy đợt 146 đã qua (13:30Z) — T8 sửa thành 17:00Z trước khi chạy:** script `wait-t4-t5-146t8.sh` copy sang đợt 147 mang deadline cứng 13:30Z 19/11 (đã qua lúc T8 mở 14:39Z); T8 sửa `2026-11-19 13:30:00 UTC` → `2026-11-19 17:00:00 UTC` trong bản copy `wait-t4-t5-147t8.sh` (chỉ đổi hằng số deadline, không đổi logic gate) và kiểm `bash -n` OK. Waiter chạy đúng: GATE-FOUND poll 136, 16:57:16Z. Đợt sau lưu ý: deadline waiter phải sửa theo hạn T8 của đợt đó, không copy mù.
- **F-147-T8-6 — Chromium 84l10 W1 trôi +1 giữa các lần (artifact test đã biết, cùng họ F-146-T8-6):** lần1 0→1, lần2 2→3, lần3 4→5 — mỗi lần delta +1 nhưng mốc xuất phát trôi +1 giữa các lần (double-fire của Chromium khi `ended` còn bật); WebKit cả 3 lần đều 0→1/1→2/2→3 sạch. Script vẫn verdict PASS (ok=true). Ghi nhận để đối chiếu, không đổi verdict.
- **F-147-T8-7 — Nhãn log `LIVE-DIAG-143` ĐÃ ĐỔI thành `LIVE-DIAG-147` (xử lý F-146-T8-9):** đổi chuỗi log trong bản copy driver `run-webkit-147t8.sh` (2 chỗ: echo + grep pattern), không chạm hành vi driver, không chạm script repo. Đợt này 0 lần diag live nên nhãn mới chưa xuất hiện trong log thật — chỉ xác nhận bằng grep trong script. T10/T8 đợt sau giữ nhãn `LIVE-DIAG-147` hay đổi theo đợt thì tùy, nhưng phải đổi trong bản copy driver (không sửa script repo).
- **F-147-T8-8 — Balloon trong lúc chạy harness 4.832.692–5.910.060 kB, RAM avail 456–1.888 MB (n=32 mẫu):** max balloon 5.910.060 kB — KHÔNG chạm trần đóng băng 6.443.824 kB. Avail min **456 MB** — thấp nhất trong các đợt gần đây (đợt 146: 461 MB; lúc kẹt đợt 141 bắt đầu ~687 MB) — H1 (ngưỡng RAM tuyệt đối) tiếp tục BỊ BÁC BỎ mạnh hơn. Balloon lúc T8 mở 5.321.684 kB, lúc harness bắt đầu ~5.4 GB.
- **F-147-T8-9 — 3 socket Xvfb mồ côi X193/X194/X195 (sinh 17:13Z trong lúc chạy Chromium 86n2):** `/tmp/.X11-unix/` có 3 socket, fuser trống (không process nào giữ), T8 đã xóa tay lúc kiểm cuối, TRỐNG lúc đóng. Nguồn gốc chưa rõ (có thể do Playwright Chromium hoặc Xvfb của harness) — ghi nhận để đối chiếu; nếu đợt 148 tái hiện thì mở điều tra nhỏ về dọn Xvfb của harness.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 5 (chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 147, trên boot `6fb582df`).**
2. **Lượt yên #21 VẪN CHƯA có lượt hợp lệ — lần thứ hai liên tiếp** (đợt 146: median 97–101 ms vượt ngưỡng; đợt này: 2/2 attempt kẹt dù median partial 51,0/37,0 ms dưới ngưỡng). Thí nghiệm (h) đợt 146 đã trả lời phần "chậm có phải hệ thống không" (BOOT-SPECIFIC), nhưng #21 vẫn chưa có lượt hợp lệ nào để làm mốc — T4 là chủ quản, T8 chỉ ghi nhận để trích gate cho đúng. Đợt 148 đo #22 như thường lệ hay điều tra kẹt probe T4 trước — việc parent.
3. **Harness 6/6 PASS nhưng lệch chuẩn gate (F-147-T8-3)** — parent/T10 phán xem có chấp nhận trích "harness sau khi T4 đóng cờ" như quyết (k) đợt 146 hay yêu cầu chuẩn khác cho đợt 148.
4. **Thứ tự O8-trước-T4 hay O8-sau-T4 (F-147-T8-1)** — đợt này T8 tự hoãn O8 tới sau cờ T4 và lỡ hạn mềm; parent/T10 phán xem có nên chuẩn hóa "O8 sau cờ T4" (an toàn cho phép đo yên, nhưng rủi ro lỡ hạn khi T4 kẹt lâu) hay quay lại "O8 trước T4" ở đợt 148.
5. **Điều tra kẹt chung VẪN MỞ** (H1 BÁC BỎ — mạnh hơn sau avail min 456 MB, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ) — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG. **Dữ kiện mới:** T4 kẹt 2/2 attempt với chữ ký evaluate-timeout → target-closed trên cùng boot `6fb582df` mà harness T8 chạy 6/6 sạch — kẹt probe T4 và kẹt harness có thể khác cơ chế, hoặc cùng H3 nhưng chỉ lộ ở probe dài. T4 là chủ quản điều tra kẹt của họ.
6. **Watchdog VẪN CHƯA được thử bằng kẹt thật** (6 đợt liên tiếp 0 kẹt) — giữ nguyên bản vá, không revert (quyết parent đợt 142–146 §12.3(n)).
7. **T8 lỡ hạn mềm 17:00Z (F-147-T8-2)** — đóng ~17:20Z trong hạn cứng 17:30Z; nguyên nhân chờ gate, không phải chậm thao tác. Parent lưu ý khi đặt hạn T8 đợt 148 nếu T4 còn kẹt lâu.
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.
9. Socket mồ côi: `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối (T8 xóa tay X193/194/195) — không còn nợ dọn socket.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 147

## B1. Trạng thái giả thuyết sau đợt 147

| Giả thuyết | Trạng thái đợt 146 | Trạng thái đợt 147 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên, mạnh hơn)** | Đợt này 0 kẹt dù RAM avail xuống **456 MB** trong lúc chạy harness (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB và thấp hơn min đợt 146 là 461 MB) — không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | 0 kẹt đợt này nên không có mẫu mới; balloon max 5.910.060 kB, không chạm trần 6.443.824 kB — chỉ là tương quan |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | 0 kẹt ở harness đợt này — không thêm mẫu nào; **nhưng T4 kẹt 2/2 attempt với chữ ký evaluate-timeout → target-closed trên cùng boot** — mẫu mới thuộc về T4, chưa rõ cùng cơ chế H3 hay khác; bản vá watchdog (i)+(ii) đã sẵn sàng để bắt bằng chứng live ở lần kẹt sau |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 147

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–147) + đường ổn định `t8-diag-stall.sh` → 147 (symlink đã cập nhật) | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 6 liên tiếp).** 36/36 lần chạy harness sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–147) | 6 lần chạy harness, `live_diags=0` cả 6 | Chạy đúng, 0 false-positive; `dev-url.txt` đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-147t8.log` (n=32) | Balloon 4,83–5,91 GB, RAM avail 456–1.888 MB trong lúc chạy harness; KHÔNG chạm trần 6.443.824 kB |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=9 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, truyền devUrl thật) | 0 lần kẹt → không kích hoạt | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3)

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 147: 6 LẦN CHẠY HARNESS, 0 KẸT (CHUỖI 5 → 6)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **3 → 4**.
- Đợt 146: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **4 → 5**.
- Đợt 147: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **5 → 6**.
- Bốn lần kẹt vẫn là: đợt 134/135 (3 lần) + đợt 141 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=9 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 147: T4 kẹt 2/2 attempt (dữ kiện của T4, ghi nhận để đối chiếu)

- T4 attempt1 (14:47–16:38Z): 17/20 pass rồi treo ~1h48' giữa pass 17 và 18 (writePartial timeout 30 s liên tục, cuối cùng target-closed, exit=2, partial JSON). Attempt2 (16:39–~16:53Z): 11/20 pass rồi kẹt cùng mẫu (writePartial timeout 30 s, tickCost n=351, blendTick n=288, c2DrawLog n=686). Cả hai đều KHÔNG verdict; median partial 51,0/37,0 ms dưới ngưỡng 60 ms.
- Harness T8 chạy 6/6 sạch trên CÙNG boot `6fb582df` ngay sau đó (17:00–17:16Z) — kẹt probe T4 không tái hiện ở harness ngắn. Khác biệt có thể: probe T4 dài hơn (20 pass + writePartial sau mỗi pass), hoặc kẹt chỉ lộ sau thời gian dài chạy liên tục. T4 là chủ quản điều tra kẹt của họ; T8 không kết luận.
- 0 reboot trong phiên T8. Vite server còn sống lúc chạy: cả 6 lần chạy harness đều tới được `vite dev sẵn sàng` + `dev-url.txt` ghi đủ — không có bằng chứng vite chết đợt này (nhưng cũng không có kẹt để kiểm vite-HTTP lúc kẹt).

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (mạnh hơn sau avail min 456 MB). H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143 (trạng thái boot mới); đợt này O8 PASS 3/3 thường kỳ, chuỗi FULL PASS 4 → 5 (chờ T10 xác nhận độc lập).** Không mở điều tra mới; nếu O8 WebKit FAIL lại ở đợt 148 thì mở điều tra lại từ đầu.
- **Lượt yên #21 VẪN CHƯA có lượt hợp lệ — lệch chuẩn gate của harness (F-147-T8-3) — parent/T10 phán.** Harness 6/6 PASS kỹ thuật, nhưng không được trích là "sau lượt yên hợp lệ".
- **Bản vá watchdog đợt 142 là bước kiểm mới nhất**: nếu đợt này (hoặc đợt sau) có kẹt thật mà watchdog (i) và/hoặc (ii) nổ, đó sẽ là bằng chứng live đầu tiên về trạng thái browser lúc kẹt (ps/RSS, vite-HTTP, probe 1+1).

## B7. Bằng chứng mới từ đợt 147 — O8 PASS 3/3, HARNESS 6/6 PASS NHƯNG #21 VẪN CHƯA CÓ LƯỢT HỢP LỆ, T4 KẸT 2/2, T8 LỠ HẠN MỀM

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot `6fb582df` (16:58:16–17:00:43Z — chỉ 2'27", nhanh bất thường so với ~8' đợt 146); S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness: WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, toàn bộ PASS exit 0, 0 FAIL oan, 0 retry — **CHẠY SAU KHI T4 ĐÓNG CỜ NHƯNG #21 VẪN CHƯA CÓ LƯỢT HỢP LỆ ĐI KÈM** (waiter GATE-FOUND poll 136, 16:57:16Z; cờ T4 16:53Z + POSTBOOT_PASS đường (a) cho boot `6fb582df`; #21: A1 median 51,0 ms 17/20, A2 median 37,0 ms 11/20, cả hai kẹt sau writePartial timeout, không verdict).
- Vá watchdog (i)+(ii) GIỮ NGUYÊN, 0 kích hoạt đợt thứ sáu liên tiếp (0 kẹt); 36/36 lần chạy harness sạch sau vá.
- 0 WATCHDOG-137 trong 6 log — nhưng đây là 0 kẹt, không phải "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo mới là bài kiểm thật đầu tiên của bản vá.
- Sampler: balloon 4,83–5,91 GB, RAM avail 456–1.888 MB trong lúc chạy harness (KHÔNG chạm trần 6.443.824 kB; avail min 456 MB — thấp nhất nhiều đợt, H1 tiếp tục BỊ BÁC BỎ).
- T8 lỡ hạn mềm 17:00Z (đóng ~17:20Z, trong hạn cứng 17:30Z) vì chờ cờ T4 tới 16:53Z; O8 hoãn tới sau cờ T4 theo quyết mới trong lượt (F-147-T8-1).
- Nhãn log `LIVE-DIAG-143` đã đổi thành `LIVE-DIAG-147` trong bản copy driver (F-147-T8-7). 3 socket Xvfb mồ côi X193/194/195 đã xóa tay, `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round147-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI**): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142–146; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round147-t8/` (run-webkit-147t8.sh — ĐÃ CHẠY 6/6 PASS (không có #21 hợp lệ đi kèm); diag-stall-147t8.sh — KHÔNG DÙNG (0 kẹt); rebuild-fixtures-147t8.sh — KHÔNG DÙNG (fixture còn nguyên 6/6 md5 khớp); wait-t4-t5-147t8.sh — ĐÃ CHẠY (GATE-FOUND poll 136, 16:57:16Z, deadline 17:00Z); o8-driver-147t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21); o8-s1-probe-147t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-147t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 145, không cần tạo lại); smoke/wait-t4-t5.log (waiter, GATE-FOUND poll 136); smoke/run-webkit-summary.txt (driver 17:00:58–17:16:46Z, ec webkit 0/0/0; chromium 0/0/0); smoke/ram-147t8.log (sampler 30 s, n=32, có cột balloon_kb); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai; O8 ecbd1b40/8911ad3d cả hai); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng); smoke/baseline-meminfo.txt (14:41Z, boot 6fb582df); o8-147t8.log + o8-lock.log (driver O8 16:58:16–17:00:43Z, lock giữ 147 s); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round147-t8/diag-stall-147t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` còn nguyên, không cần rebuild đợt này.
