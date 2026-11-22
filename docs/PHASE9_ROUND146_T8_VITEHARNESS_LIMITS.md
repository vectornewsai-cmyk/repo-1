# Đợt 146 T8 — O8 21/21 ×3 PASS + HARNESS 6/6 PASS NHƯNG KHÔNG CÓ LƯỢT YÊN #21 HỢP LỆ ĐI KÈM + REBOOT #34 GIỮA LƯỢT

Ngày: 19/11/2026 (lượt cron 18:35 +07 = 11:35:51Z; T8 mở ~11:37Z trên boot `98a7c93f` btime 09:54:03Z = #109? chặt; T8 đóng ~12:36Z trên boot mới `6fb582df` btime 12:13:26Z = #110? chặt). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (mỗi bên ít nhất 1 lần, WebKit ×2 như đợt 143/144/145); (2) harness đứng 6/6 — PASS kỹ thuật nhưng **KHÔNG QUA GATE ĐÚNG CHUẨN** (xem §0); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND145_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 + harness 6/6 QUA GATE SAU #20 HỢP LỆ; watchdog 0 kích hoạt đợt thứ 4); docs/PHASE9_ROUND145_LIMITS.md §7, §11, §12.3 (quyết (j) watchdog GIỮ NGUYÊN bản vá, chờ kẹt thật).

## 0. Kết luận ngắn — O8 PASS 3/3, HARNESS 6/6 PASS NHƯNG KHÔNG CÓ #21 HỢP LỆ, WATCHDOG 0 KÍCH HOẠT (ĐỢT THỨ 5 LIÊN TIẾP), REBOOT #34

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (11:39:07–11:47:11Z, boot `98a7c93f` ~3h45' tuổi lúc chạy, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần ("checked=true → false, Playwright mouse click lần 2" WebKit; "CDP mouse click lần 2" Chromium). Report JSON: 21 kết quả, 0 fail cả hai engine (kiểm độc lập bằng python). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL). **KHÔNG có điều tra lại** — O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143, đợt này chỉ kiểm lại thường kỳ.
- **Chuỗi WebKit FULL PASS: 3 → 4 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 145 = 3 (T8 + T10 độc lập); đợt này T8 pass 21/21 ×2; nếu T10 cũng pass lúc đóng sổ thì chuỗi = 4 vững.
- **Lượt yên #21: KHÔNG CÓ LƯỢT HỢP LỆ (cờ T4 12:18:31Z)** — 3/3 attempt đều 20/20 nhưng median **99,0 / 101,0 / 97,0 ms > 60 ms**; attempt2 thêm vi phạm lớp B (load1max 4,67); attempt3 probe xong 20/20 nhưng reboot #34 giết finalization (B hậu kiểm cửa sổ probe ĐẠT 5/5). (c2)=0 cả 3 attempt; **cộng dồn KHÔNG ĐỔI (17 lượt: P1 51/51, P2 42/42, P3-A1 46/51, P3' 23/23, P7 37/37)**. Đây là đợt đầu tiên kể từ khi có lượt yên mà KHÔNG có lượt hợp lệ nào (đợt 145: #20 hợp lệ ngay attempt1, median 58,0 ms).
- **Harness 6/6 PASS, exit 0 toàn bộ (12:19:34–12:35:05Z), 0 kẹt, 0 retry — NHƯNG KHÔNG ĐƯỢC TRÍCH LÀ "QUA GATE SAU LƯỢT YÊN HỢP LỆ" (F-146-T8-3, cùng họ F-144-T8-3):** waiter TÌM ĐƯỢC gate kỹ thuật (GATE-FOUND poll 5 lúc 12:18:51Z — cờ T4 12:18:31Z + POSTBOOT_PASS đường (a) cho boot `6fb582df`, pass_at 12:17:25Z, poll=2) nhưng nội dung cờ T4 là "KHÔNG CÓ lượt hợp lệ". T4 đã đóng hẳn (ngân sách 3/3 đã dùng hết, không còn attempt nào đang chạy) nên harness không thể làm phiền phép đo yên nào nữa — T8 chạy harness theo tiền lệ quyết parent (i) đợt 143 (được chạy sau khi waiter hết hạn kèm ghi rõ), và ghi rõ lệch chuẩn này để parent/T10 phán. WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2. 86n2 WebKit P4-lần2 PASS (điểm kẹt đợt 141) + P6 KHÔNG-KẸT 90 s cả hai engine.
- **Watchdog: 0 kích hoạt — vì 0 kẹt (F-146-T8-4):** 0 dòng `WATCHDOG-137` trong 6 log, 0 `LIVE-DIAG`, `live_diags=0` cả 6, 0 dir dump live mới. Bài kiểm thật đầu tiên của bản vá **VẪN CHƯA XẢY RA (đợt thứ năm liên tiếp)** — 30/30 lần chạy harness sạch sau vá.
- **1 reboot giữa lượt: #34 (`98a7c93f` → `6fb582df`, btime 12:13:26Z)** — giết vòng chờ cờ đầu của T8 (waiter poll 1–27) + finalization attempt3 của T4 + mọi process đang chạy; O8 chạy trên boot cũ, harness chạy trên boot mới (chia đôi boot như đợt 144). Boot `98a7c93f` sống ~2h19m (09:54:03Z → ~12:13:3xZ).
- **Cây: preview.tsx `530e10a7` (GIỮ VĨNH VIỄN), media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 KHÔNG ĐỔI so với đợt 142/143/144/145 (b8c08a7c/610ee003/628088bd — bản vá watchdog còn nguyên).** Không sửa file repo nào khác ngoài LIMITS này.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 11:35:51 19/11 | Lượt cron 18:35 +07 mở đợt 146; boot lúc mở `98a7c93f` (btime 09:54:03Z, #109? chặt) |
| ~11:37 | T8 mở: RAM avail 1.036 MB, balloon 5.724.628 kB; đọc LIMITS T8-145 + aggregate 145 §7/§11/§12.3(j) |
| 11:37:12 | tree-md5-open: cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 145 (không đổi) |
| 11:37–11:38 | Fixture /tmp MẤT theo reboot #33 — rebuild lần 1: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549) |
| 11:39:07–11:47:11 | **Driver O8 chạy trên boot `98a7c93f`: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) |
| 11:47:31 | Waiter T8 (vòng 1) bắt đầu (deadline 13:30Z); postboot=1 từ poll 1 (đường (a) cho boot `98a7c93f`, pass_at 11:37:57Z), chỉ chờ cờ T4 |
| 11:53:54–11:59:10 | T4 poller chờ cửa yên (poll #17–#24; load1 1,39–1,45, RAM avail 3.959–5.958 MB); cửa yên mở poll #24 11:59:10Z (gate0 T5 + gateA đủ) → attempt1 chạy ngay |
| 11:59:10–12:04:00 | T4 attempt1: 20/20 + lớp B ĐẠT 5/5 NHƯNG **median 99,0 ms > 60 ms — KHÔNG ĐẠT #21** (retry-agent 12:06:24Z, ngân sách 1/3) |
| 12:06–12:11 | T4 attempt2: 20/20 NHƯNG **lớp B VI PHẠM (load1max 4,67)** — lượt nhiễm tải, không dùng verdict (ngân sách 2/3) |
| 12:11:13–12:13:15 | T4 attempt3: probe xong 20/20 (partial JSON 12:13:13Z, tickCost ok n=424) — **reboot #34 giết finalization** trước khi analyzer chạy (ngân sách 3/3) |
| ~12:13:3x | **REBOOT #34: `98a7c93f` → `6fb582df`, btime 12:13:26Z** — giết waiter vòng 1 của T8 (dừng ở poll 27, 12:13:34Z) + finalization T4 attempt3; runtime restart, session T8 bị gián đoạn (xem F-146-T8-2) |
| 12:14:09–12:14:51 | T8 khôi phục sau gián đoạn: xác nhận boot mới `6fb582df`, sao lưu log waiter vòng 1, kiểm attempt3 (20/20, exit=0, chưa có verdict analyzer) |
| 12:14:51 | Waiter T8 (vòng 2) bắt đầu lại trên boot `6fb582df` (deadline 13:30Z giữ nguyên) |
| 12:17:25 | T5 POSTBOOT_PASS cho boot `6fb582df` (poll=2, replay-full dpkg 1545/221) — đường (a) cho boot mới sẵn |
| 12:18:31 | **T4 ghi cờ `round146-t4.done`: KHÔNG CÓ lượt hợp lệ #21** (median 99,0/101,0/97,0 ms; attempt3 median 97,0 ms, B hậu kiểm ĐẠT 5/5; cộng dồn KHÔNG ĐỔI) |
| 12:18:51 | **GATE-FOUND poll 5 (vòng 2) — waiter exit 0** (t4=OK + postboot đường (a) cho boot `6fb582df`, t4attempt=no-lock) |
| 12:19:11–12:19:34 | Fixture /tmp MẤT theo reboot #34 — rebuild lần 2: 6/6 md5 khớp đợt 125 (lần thứ hai trong lượt) |
| 12:19:34–12:35:05 | **Harness 6/6 PASS, 0 kẹt, 0 retry — NHƯNG KHÔNG CÓ #21 HỢP LỆ ĐI KÈM (F-146-T8-3)** (xem §2) |
| ~12:36 | Kiểm cuối + LIMITS + stage file + cờ `round146-t8.done` — **T8 đóng** |

## A. O8 — PASS 3/3 trên boot `98a7c93f` (không điều tra lại)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 11:39:07–11:42:11 | 0 | **21/21 PASS** — S0 PASS 11:39:51, S1 PASS 11:39:51 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 11:42:11–11:45:29 | 0 | **21/21 PASS** — S1 PASS 11:43:21, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 11:45:29–11:47:11 | 0 | **21/21 PASS** — S1 PASS 11:46:22 "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true` (kiểm độc lập bằng python — cấu trúc dict `{results, logLines}`, không phải list). WebKit launched 27.2 cả hai attempt. 0 dòng `HARNESS LỖI`, 0 `Target crashed` trong `o8-146t8.log`.
- Driver O8 giữ 1 lock vite `t8-round146` suốt lượt (giữ 484 s, đã nhả 11:47:11Z; vite sau release curl 5560/5554 = 000000 — đã kiểm trong driver).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-146t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 3 → 4 (chờ T10 xác nhận độc lập lúc đóng sổ)** — đợt 145 = 3 (T8 + T10 độc lập); đợt này T8 pass 21/21 ×2 trên boot `98a7c93f`.
- **Caveat:** O8 chạy TRƯỚC khi T4 mở cửa yên (11:39–11:47Z, T4 attempt1 bắt đầu 11:59:10Z) — O8 không nhiễm tải vào phép đo yên của T4; thứ tự này giữ nguyên từ đợt 144/145. O8 chạy trên boot cũ `98a7c93f`, harness chạy trên boot mới `6fb582df` — chia đôi boot như đợt 144.

## 2. Kết quả 6 lần chạy harness (6/6 PASS, 0 retry — KHÔNG CÓ #21 HỢP LỆ ĐI KÈM)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 | 0 | 12:19:37–12:20:48 | **PASS** — W1 3/3 (delta +1 mỗi lần), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit | 85m4-hb128 | 0 | 12:21:03–12:23:13 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,3/1,4/1,8 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 3 | WebKit | 86n2 | 0 | 12:23:28–12:27:28 | **PASS** — P1–P6 đủ (P4 3/3 delta +1, đồng bộ 1,9/1,3/1,3 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s) |
| 4 | Chromium | 84l10 | 0 | 12:27:44–12:28:44 | **PASS** — W1 3/3 (lần2 delta +2, artifact test đã biết — xem F-146-T8-6), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 5 | Chromium | 85m4-hb128 | 0 | 12:28:59–12:30:59 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,0/1,0/0,5 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 6 | Chromium | 86n2 | 0 | 12:31:15–12:35:05 | **PASS (ok=true)** — P1–P6 đủ (P4 lần1 delta +2 artifact, lần2/3 +1, đồng bộ 0,5/1,0/1,0 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s) |

- 6 report JSON đều `ok=true` (3 WebKit + 3 Chromium, kiểm độc lập bằng python — không chỉ đọc log).
- Fixture rebuild lần 2 sau reboot #34: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- Gate: harness bắt đầu 12:19:34Z, 43 giây sau GATE-FOUND 12:18:51Z; T4 đã đóng cờ 12:18:31Z và không còn attempt nào đang chạy (ngân sách 3/3 đã hết) — 0 lần đo yên nào bị phiền (T4 đã xong toàn bộ trước khi harness bắt đầu). **Nhưng cờ T4 mang verdict "KHÔNG CÓ lượt hợp lệ" — harness đợt này KHÔNG được trích là "sau lượt yên #21 hợp lệ"** (F-146-T8-3).
- Khác đợt 145: đợt 145 harness qua gate VÀ có #20 hợp lệ đi kèm (attempt1, 20/20, median 58,0 ms); đợt này **#21 không tồn tại** — 3/3 attempt median 97–101 ms, vượt ngưỡng 60 ms gần gấp đôi. Median nhảy 58,0 ms (#20) → 97–101 ms (#21) là dữ kiện lớn nhất đợt này về phía T4 (xem §7.1).

## 3. Watchdog trong lượt này — bài kiểm thật đầu tiên VẪN CHƯA XẢY RA (0 kẹt, đợt thứ năm liên tiếp)

- **0 kẹt thật đợt này** nên cả hai lớp watchdog mới đều không có dịp nổ: 0 dòng `WATCHDOG-137` trong 6 log lần chạy; 0 dòng `LIVE-DIAG` trong summary; 0 dir `stall-live-*` / `stall-*-timeout124-*` mới (chỉ có `diag-stall-146t8.sh` chưa dùng).
- **Vòng canh mtime đã chạy thật trên cả 6 lần chạy:** mỗi `run_one` poll mtime 10 s/lần trong suốt lần chạy (tổng ~16 phút chạy, `live_diags=0` cả 6 lần) — không false-positive nào dù W2 im lặng tới ~70 s và P5/P6 chờ 40–90 s (ngưỡng 120 s đủ dự trữ). `dev-url.txt` được ghi đúng cả 6 scratch (`http://127.0.0.1:5390/` / `:5490/`) — đường truyền devUrl cho diag live đã sẵn sàng, chỉ chưa có dịp dùng.
- **Kết luận:** bản vá (i)+(ii) đã triển khai đúng + chạy sạch qua 6/6 lần chạy đợt này (cộng dồn **30/30 lần chạy sạch sau vá, 5 đợt**), nhưng **CHƯA được kiểm chứng bằng kẹt thật** — đừng trích "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo (nếu có) mới là bài kiểm thật đầu tiên.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–146) + đường ổn định `t8-diag-stall.sh` → 146 (symlink đã cập nhật) | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 5 liên tiếp).** 30/30 lần chạy sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–146) | 6 lần chạy, poll 10 s/lần, `live_diags=0` cả 6 | **Chạy đúng, 0 false-positive.** `dev-url.txt` ghi đủ 6 scratch — đường devUrl sẵn sàng |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-146t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-146t8.log` đầy đủ (n=32 mẫu) | Balloon 5.207.612–6.034.272 kB trong lúc chạy harness; RAM avail 461–1.366 MB (xem F-146-T8-7) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=8 mỗi pha** (đợt 137/139/141/142/143/144/145/146 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 0 restart + P6 PASS |
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

- Không sửa code app, không sửa script harness/O8 nào trong đợt này. Batch stage chỉ có LIMITS này (1 file).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round146` 11:47:11Z (giữ 484 s); driver harness đã nhả lock sau mỗi lần chạy (giữ tối đa ~240 s/lần).
- Driver harness đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round146` đã nhả.
- Kiểm cuối 12:35Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; không có `/tmp/.X199-lock` / `/tmp/.X188-lock`; `/tmp/.X11-unix/` TRỐNG (reboot #34 đã xóa /tmp, T10 đợt 145 cũng đã dọn tay); lock vite TRỐNG (0 ticket + 100 cooldown — bằng số file lúc T10-145 đóng, không tăng).
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 461 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này 6/6 PASS NHƯNG KHÔNG CÓ lượt yên #21 hợp lệ đi kèm** — cùng họ lệch chuẩn F-144-T8-3 (đợt 144 harness qua gate nhưng không có #19 hợp lệ lúc chạy — sau đó #19 được hậu kiểm hợp lệ; đợt này #21 KHÔNG hợp lệ cả 3 attempt, không có hậu kiểm nào cứu được). Trích đúng: "harness 6/6 PASS, chạy sau khi T4 đóng cờ nhưng không có lượt yên #21 hợp lệ (3/3 attempt median 97–101 ms > 60 ms)". **Đừng trích "harness QUA GATE sau #21 hợp lệ" — sai.**
2. **"0 WATCHDOG" đợt này KHÔNG có nghĩa "watchdog đã kiểm chứng xong".** Có 0 kẹt thật để thử — đợt thứ năm liên tiếp. Bản vá mới chỉ qua smoke-test (đợt 142) + 30 lần chạy sạch.
3. **Balloon KHÔNG chạm trần trong lúc chạy harness** (F-146-T8-7): max 6.034.272 kB, dưới trần đóng băng 6.443.824 kB. Đừng trích trần 6.443.824 kB cho đợt này.
4. **P5 Chromium 86n2 0 restart đợt này** (như đợt 144/145; khác đợt 143 +1 `ended` tự nhiên) — 0 restart là trường hợp sạch; khác biệt đợt 143 chưa giải thích được, ghi nhận để đối chiếu, không kết luận regression.
5. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142/143/144/145 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
6. **Chuỗi WebKit FULL PASS = 4 CHỜ T10 xác nhận độc lập** — T8 pass 21/21 ×2 đợt này (trên boot `98a7c93f`); nếu T10 pass lúc đóng sổ (trên boot `6fb582df`) thì chuỗi = 4 vững, nếu không thì vẫn 3.
7. **O8 và harness đợt này chạy trên HAI BOOT KHÁC NHAU** (O8 trên `98a7c93f`, harness trên `6fb582df`, chia cắt bởi reboot #34) — như đợt 144. Đừng trích "O8 + harness cùng một boot" cho đợt này.

## 8. Sai số mới (F-146-T8-N)

- **F-146-T8-1 — /proc/1 mtime lệch btime +10 s (cùng họ F-143-T8-7 / F-144-T8-1 / F-145-T8-1):** driver harness ghi btime header `12:13:36Z` (lấy từ `stat -c %Y /proc/1`), trong khi btime thật theo `/proc/stat` là `12:13:26Z` (+10 s). Không ảnh hưởng lần chạy nào (chỉ là header log); T8 ghi rõ để T2/T7 không nhầm mốc.
- **F-146-T8-2 — Reboot #34 giết waiter vòng 1 + gián đoạn session T8 (cùng họ F-145-T10-1):** waiter vòng 1 (bắt đầu 11:47:31Z) dừng ở poll 27 (12:13:34Z) khi boot đổi `98a7c93f` → `6fb582df`; runtime restart, session T8 bị gián đoạn ~26 phút theo ghi nhận runtime (khởi động 11:47:31Z, recovery nhận ra lúc ~12:14:02Z). T8 khôi phục 12:14:09Z: sao lưu log waiter vòng 1 (`wait-t4-t5-pre-reboot34.log`, polls 1–27) rồi khởi động lại waiter vòng 2 12:14:51Z (deadline 13:30Z giữ nguyên). Không mất dữ kiện O8 (đã xong 11:47:11Z, log + report JSON còn nguyên trên workspace bền).
- **F-146-T8-3 — Harness 6/6 PASS nhưng KHÔNG có lượt yên #21 hợp lệ đi kèm (lệch chuẩn gate, cùng họ F-144-T8-3):** waiter tìm được gate kỹ thuật (cờ T4 + postboot đường (a) cho boot `6fb582df`) nhưng nội dung cờ là "KHÔNG CÓ lượt hợp lệ" — 3/3 attempt median 99,0/101,0/97,0 ms > 60 ms. T4 đã đóng hẳn (ngân sách 3/3 hết, 0 attempt đang chạy) nên harness không phiền phép đo nào; T8 chạy theo tiền lệ quyết parent (i) đợt 143 và ghi rõ lệch chuẩn để parent/T10 phán. Không có hậu kiểm nào cứu được #21 (khác đợt 144: #19 được hậu kiểm hợp lệ sau đó).
- **F-146-T8-4 — 0 kẹt đợt này, chuỗi "P3 không kẹt" 4 → 5:** 6/6 lần chạy harness + 3/3 lần chạy O8, 0 kẹt, 0 FAIL. 86n2 WebKit P4-lần2 PASS (đồng bộ 1,3 s) — điểm kẹt đợt 141 không tái hiện lần thứ năm liên tiếp.
- **F-146-T8-5 — Nghịch lý đồng hồ ở reboot #34 (cùng họ F-145-T9-2, 6 s — lần này ≥23 s):** boot mới btime 12:13:26Z (theo `/proc/stat` + `uptime -s`, khớp T4) nhưng boot cũ còn dấu vết SAU mốc đó: waiter poll 27 ghi boot `98a7c93f` còn sống 12:13:34Z; file `attempt-done-attempt3-98a7c93f` của T4 ghi 12:13:49Z (exit=0). Btime mới sớm hơn dấu vết cuối của boot cũ 8–23 s — đồng hồ VM nhảy lùi tại reboot. Khung chết boot `98a7c93f` KHÔNG chốt được bằng dữ kiện T8; giao T2-146 merged mù #65/#66. T8 dùng btime 12:13:26Z theo ba nguồn (T4 + T5 POSTBOOT_PASS + uptime -s).
- **F-146-T8-6 — Chromium delta +2 ở 2 chỗ (artifact test đã biết, không phải regression):** Chromium 84l10 W1-lần2 delta +2 (2→4, "gồm bắn lặp do ghi đè ended còn bật") và Chromium 86n2 P4-lần1 delta +2 — cùng mẫu double-fire của Chromium khi `ended` còn bật; WebKit cả 6 lần đều delta +1 sạch. Script vẫn verdict PASS cả hai (ok=true). Ghi nhận để đối chiếu, không đổi verdict.
- **F-146-T8-7 — Balloon trong lúc chạy harness 5.207.612–6.034.272 kB, RAM avail 461–1.366 MB (n=32 mẫu):** max balloon 6.034.272 kB — KHÔNG chạm trần đóng băng 6.443.824 kB. Avail min **461 MB** — thấp nhất trong các đợt gần đây (đợt 145: 566 MB; lúc kẹt đợt 141 bắt đầu ~687 MB) — H1 (ngưỡng RAM tuyệt đối) tiếp tục BỊ BÁC BỎ mạnh hơn. Balloon lúc T8 mở 5.724.628 kB, lúc harness bắt đầu ~5.469.756 kB.
- **F-146-T8-8 — Fixture /tmp MẤT 2 LẦN TRONG CÙNG MỘT LƯỢT (reboot #33 rồi #34):** rebuild lần 1 lúc 11:37–11:38Z (sau #33) và rebuild lần 2 lúc 12:19Z (sau #34); cả hai lần 6/6 md5 khớp đợt 125. Không ảnh hưởng lần chạy nào (rebuild xong trước O8 / trước harness). Mẫu này cho thấy fixture /tmp không bền qua reboot — T8 đợt sau vẫn phải rebuild sau mỗi reboot, không được giả định /tmp còn nguyên.
- **F-146-T8-9 — Nhãn log `LIVE-DIAG-143` giữ nguyên từ đợt 143:** driver run-webkit-146t8.sh (copy từ đợt 145) vẫn in nhãn `LIVE-DIAG-143` cho diag live (0 lần đợt này). Nhãn cũ chỉ là chuỗi log, không đổi hành vi; T8 không sửa để tránh chạm driver đang chạy ổn định — T10/T8 đợt sau đổi nhãn nếu muốn (nợ từ F-145-T8-8, giữ nguyên).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 4 (chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 146, trên boot `6fb582df`).**
2. **Lượt yên #21 KHÔNG CÓ lượt hợp lệ — lần đầu tiên trong chuỗi lượt yên** (3/3 attempt median 99,0/101,0/97,0 ms; cộng dồn KHÔNG ĐỔI ở 17 lượt). Median nhảy 58,0 ms (#20) → ~99 ms (#21): T4 là chủ quản, T8 chỉ ghi nhận để trích gate cho đúng. Đợt 147 đo #22 như thường lệ hay có điều tra riêng về cú nhảy median — việc parent.
3. **Harness 6/6 PASS nhưng lệch chuẩn gate (F-146-T8-3)** — parent/T10 phán xem có chấp nhận trích "harness sau khi T4 đóng cờ" hay yêu cầu chuẩn khác cho đợt 147.
4. **Điều tra kẹt chung VẪN MỞ** (H1 BÁC BỎ — mạnh hơn sau avail min 461 MB, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ) — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
5. **Watchdog VẪN CHƯA được thử bằng kẹt thật** (5 đợt liên tiếp 0 kẹt) — giữ nguyên bản vá, không revert (quyết parent đợt 142/143/144/145 §12.3(j)).
6. **Reboot #34 giữa lượt** — khung chết boot `98a7c93f` không chốt được bằng dữ kiện T8 (nghịch lý đồng hồ ≥23 s, F-146-T8-5); giao T2-146 merged mù #65/#66 + T10 đóng sổ.
7. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.
8. Socket mồ côi: `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối (reboot #34 xóa /tmp) — không còn nợ dọn socket từ đợt 144/145.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 146

## B1. Trạng thái giả thuyết sau đợt 146

| Giả thuyết | Trạng thái đợt 145 | Trạng thái đợt 146 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên, mạnh hơn)** | Đợt này 0 kẹt dù RAM avail xuống **461 MB** trong lúc chạy harness (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB và thấp hơn min đợt 145 là 566 MB) — không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | 0 kẹt đợt này nên không có mẫu mới; balloon max 6.034.272 kB, không chạm trần 6.443.824 kB — chỉ là tương quan |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | 0 kẹt đợt này — không thêm mẫu nào; bản vá watchdog (i)+(ii) đã sẵn sàng để bắt bằng chứng live ở lần kẹt sau |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 146

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–146) + đường ổn định `t8-diag-stall.sh` → 146 | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 5 liên tiếp).** 30/30 lần chạy harness sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–146) | 6 lần chạy harness, `live_diags=0` cả 6 | Chạy đúng, 0 false-positive; `dev-url.txt` đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-146t8.log` (n=32) | Balloon 5,21–6,03 GB, RAM avail 461–1.366 MB trong lúc chạy harness; KHÔNG chạm trần 6.443.824 kB |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=8 mỗi pha** (đợt 137/139/141/142/143/144/145/146 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, truyền devUrl thật) | 0 lần kẹt → không kích hoạt | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3)

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 146: 6 LẦN CHẠY HARNESS, 0 KẸT (CHUỖI 4 → 5)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **3 → 4**.
- Đợt 146: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **4 → 5**.
- Bốn lần kẹt vẫn là: đợt 134/135 (3 lần) + đợt 141 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=8 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 146: không có yếu tố chung mới (0 kẹt). 1 reboot giữa lượt (#34) — boot `98a7c93f` chết, boot mới `6fb582df` lên thay, btime 12:13:26Z. Vite server còn sống lúc chạy: cả 6 lần chạy harness đều tới được `vite dev sẵn sàng` + `dev-url.txt` ghi đủ — không có bằng chứng vite chết đợt này (nhưng cũng không có kẹt để kiểm vite-HTTP lúc kẹt). T4 #21 KHÔNG có lượt hợp lệ (median 99,0/101,0/97,0 ms) — dữ kiện mới thuộc về T4, T8 chỉ ghi nhận.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (mạnh hơn sau avail min 461 MB). H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143 (trạng thái boot mới); đợt này O8 PASS 3/3 thường kỳ, chuỗi FULL PASS 3 → 4 (chờ T10 xác nhận độc lập).** Không mở điều tra mới; nếu O8 WebKit FAIL lại ở đợt 147 thì mở điều tra lại từ đầu.
- **Lượt yên #21 KHÔNG có lượt hợp lệ — lệch chuẩn gate của harness (F-146-T8-3) — parent/T10 phán.** Harness 6/6 PASS kỹ thuật, nhưng không được trích là "sau lượt yên hợp lệ".
- **Bản vá watchdog đợt 142 là bước kiểm mới nhất**: nếu đợt này (hoặc đợt sau) có kẹt thật mà watchdog (i) và/hoặc (ii) nổ, đó sẽ là bằng chứng live đầu tiên về trạng thái browser lúc kẹt (ps/RSS, vite-HTTP, probe 1+1).

## B7. Bằng chứng mới từ đợt 146 — O8 PASS 3/3, HARNESS 6/6 PASS NHƯNG KHÔNG CÓ #21 HỢP LỆ, REBOOT #34

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot `98a7c93f` (11:39:07–11:47:11Z); S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness: WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, toàn bộ PASS exit 0, 0 FAIL oan, 0 retry — **CHẠY SAU KHI T4 ĐÓNG CỜ NHƯNG KHÔNG CÓ LƯỢT YÊN #21 HỢP LỆ ĐI KÈM** (waiter GATE-FOUND poll 5 vòng 2, 12:18:51Z; cờ T4 12:18:31Z + POSTBOOT_PASS đường (a) cho boot `6fb582df` pass_at 12:17:25Z; #21: 3/3 attempt 20/20, median 99,0/101,0/97,0 ms > 60 ms, cộng dồn KHÔNG ĐỔI ở 17 lượt).
- Vá watchdog (i)+(ii) GIỮ NGUYÊN, 0 kích hoạt đợt thứ năm liên tiếp (0 kẹt); 30/30 lần chạy harness sạch sau vá.
- 0 WATCHDOG-137 trong 6 log — nhưng đây là 0 kẹt, không phải "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo mới là bài kiểm thật đầu tiên của bản vá.
- Sampler: balloon 5,21–6,03 GB, RAM avail 461–1.366 MB trong lúc chạy harness (KHÔNG chạm trần 6.443.824 kB; avail min 461 MB — thấp nhất nhiều đợt, H1 tiếp tục BỊ BÁC BỎ).
- 1 reboot giữa lượt (#34, `98a7c93f` → `6fb582df`, btime 12:13:26Z) — giết waiter vòng 1 của T8 + finalization attempt3 của T4; nghịch lý đồng hồ ≥23 s (btime mới sớm hơn dấu vết cuối boot cũ); O8 + harness chia đôi boot (như đợt 144). `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối (12:35Z).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round146-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI**): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142/143/144/145; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round146-t8/` (run-webkit-146t8.sh — ĐÃ CHẠY 6/6 PASS (không có #21 hợp lệ đi kèm); diag-stall-146t8.sh — KHÔNG DÙNG (0 kẹt); rebuild-fixtures-146t8.sh — ĐÃ DÙNG 2 LẦN (sau reboot #33 và #34, 6/6 md5 khớp cả hai lần); wait-t4-t5-146t8.sh — ĐÃ CHẠY 2 VÒNG (vòng 1 bị reboot #34 giết ở poll 27; vòng 2 GATE-FOUND poll 5 exit 0, deadline 13:30Z); o8-driver-146t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21); o8-s1-probe-146t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-146t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 145, không cần tạo lại); smoke/wait-t4-t5-pre-reboot34.log (waiter vòng 1, poll 1–27); smoke/wait-t4-t5.log (waiter vòng 2, GATE-FOUND poll 5, 12:18:51Z); smoke/run-webkit-summary.txt (driver 12:19:34–12:35:05Z, ec webkit 0/0/0; chromium 0/0/0); smoke/ram-146t8.log (sampler 30 s, n=32, có cột balloon_kb); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/attempt1/ (snapshot 6 log + summary); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai; O8 ecbd1b40/8911ad3d cả hai); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng); smoke/baseline-meminfo.txt (12:19Z, boot 6fb582df); smoke/rebuild-fixtures.log + smoke/rebuild-fixtures-2.log (2 lần rebuild, 6/6 md5 khớp); o8-146t8.log + o8-lock.log (driver O8 11:39:07–11:47:11Z, lock giữ 484 s); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round146-t8/diag-stall-146t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild 2 lần trong lượt (sau reboot #33 và #34).
