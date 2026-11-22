# Đợt 144 T8 — O8 21/21 ×3 + HARNESS 6/6 QUA GATE (lần đầu sau 2 đợt) + REBOOT #31

Ngày: 19/11/2026 (lượt cron 12:35 +07 = 05:35:51Z; T8 mở ~05:38Z trên boot `691a7403`, REBOOT giữa lúc chờ gate → boot `cc222c8a` btime 05:53:15Z; T8 đóng ~06:41Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (mỗi bên ít nhất 1 lần, WebKit ×2 như đợt 143); (2) harness đứng 6/6 — LẦN NÀY QUA GATE ĐÚNG CHUẨN; (3) watchdog GIỮ NGUYÊN bản vá đợt 142, KHÔNG revert. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG sửa script O8 gốc, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND143_T8_VITEHARNESS_LIMITS.md (harness 6/6 KHÔNG QUA GATE — lệch chuẩn F-143-T8-2, parent đã chấp nhận + thủ tục mới quyết (i)); docs/PHASE9_ROUND143_LIMITS.md §9.3, §12.1(b)(i).

## 0. Kết luận ngắn — O8 PASS 3/3, HARNESS 6/6 QUA GATE, WATCHDOG 0 KÍCH HOẠT (ĐỢT THỨ 3 LIÊN TIẾP)

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (05:41:10–05:43:53Z, boot `691a7403` ~1h45m tuổi lúc chạy, cùng cây preview.tsx `530e10a7` + cùng script O8 gốc md5 `ecbd1b40`, KHÔNG sửa). S1 PASS cả 3 lần ("checked=true → false, Playwright mouse click lần 2" WebKit; "CDP mouse click lần 2" Chromium). Report JSON: 21 kết quả, 0 fail cả hai engine. Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL). **KHÔNG có điều tra lại** — O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143, đợt này chỉ kiểm lại thường kỳ.
- **Chuỗi WebKit FULL PASS: 1 → 2** (đợt 143 = 1, đợt 144 pass lại; chờ T10 chạy lại O8 lúc đóng sổ để xác nhận độc lập).
- **Harness 6/6 PASS, exit 0 toàn bộ (06:22:35–06:38:47Z), 0 kẹt, 0 retry — VÀ LẦN NÀY QUA GATE ĐÚNG CHUẨN** (xem §1): waiter2 GATE-FOUND poll 28 lúc 06:22:24Z (cờ T4 06:21:25Z + POSTBOOT_PASS đường (a) cho boot mới `cc222c8a`, pass_at 06:00:44Z). WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2. 86n2 WebKit P4-lần2 PASS (điểm kẹt đợt 141) + P6 KHÔNG-KẸT 90 s cả hai engine.
- **Caveat gate (F-144-T8-3, nói rõ — không giấu):** gate mở bằng cờ T4 + postboot (đúng chuẩn thủ tục), NHƯNG lượt yên #19 của T4 có 0 lượt hợp lệ theo luật đã lập trình (5 attempt 20/20, lớp B loại hết; xem §1). Harness đợt này chạy sau cờ T4, qua gate — nhưng KHÔNG có lượt yên #19 hợp lệ đi kèm. Đừng trích "harness sau lượt yên #19 hợp lệ" cho đợt này.
- **Watchdog: 0 kích hoạt — vì 0 kẹt (F-144-T8-5):** 0 dòng `WATCHDOG-137` trong 6 log, 0 `LIVE-DIAG`, `live_diags=0` cả 6, 0 dir dump live mới. Bài kiểm thật đầu tiên của bản vá **VẪN CHƯA XẢY RA (đợt thứ ba liên tiếp)** — 18/18 lần chạy harness sạch sau vá.
- **Cây: preview.tsx `530e10a7` (GIỮ VĨNH VIỄN), media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 KHÔNG ĐỔI so với đợt 142/143 (b8c08a7c/610ee003/628088bd — bản vá watchdog còn nguyên).** Không sửa file repo nào khác ngoài LIMITS này.
- **Chia đôi boot (F-144-T8-4):** O8 chạy trên boot cũ `691a7403`, harness chạy trên boot mới `cc222c8a` (reboot #31 ở giữa). Hai nửa bằng chứng của T8 nằm trên hai boot khác nhau — chuỗi FULL PASS đếm theo đợt, không theo boot; T10 lưu ý khi xác nhận.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 05:35:51 19/11 | Lượt cron 12:35 +07 mở đợt 144; `round-in-progress.md` tạo; boot lúc mở `691a7403` (btime 03:55:45Z, #106? chặt) |
| ~05:38 | T8 mở: RAM avail 570 MB, balloon 6.237.772 kB; đọc LIMITS T8-143 + aggregate 143 §9.3/§12.1(b)(i) |
| 05:40:23 | tree-md5-open: cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 143 (không đổi) |
| 05:40–05:41 | Fixture /tmp kiểm md5: 6/6 khớp đợt 125 (không cần rebuild — /tmp còn nguyên trước reboot) |
| 05:41:10–05:43:53 | **Driver O8 chạy trên boot `691a7403`: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) |
| 05:44:12 | T4 gate0 MỞ poll #1 (cờ T5 cho boot cũ + RAM 1.815 MB) → attempt1 lượt yên chạy ngay |
| 05:44–05:53 | T4 attempt1 boot cũ: 20/20 NHƯNG lớp B vi phạm (nhiễm tải) → retry attempt2 (05:48:15Z) |
| 05:44:42 | Waiter1 T8 bắt đầu (deadline 07:30Z); T5 POSTBOOT_PASS boot cũ pass_at 05:43:07Z đã có |
| 05:53:15 | **REBOOT #31 (TẠM — T4 đặt số; T2/T7 xác nhận): `691a7403` → `cc222c8a`, btime 05:53:15Z** — giết waiter1 (poll 10 cuối 05:53:44Z) + T4 attempt2 giữa chừng (HB129 cuối 05:53:42Z) + xóa /tmp; xem F-144-T8-1 |
| 05:55:19 | Waiter2 T8 khởi động lại (boot mới; deadline giữ 07:30Z) |
| 05:55:51 | T4 poller khởi động lại trên boot mới; T5 b2 postboot đang chạy (ram-sampler-b2) |
| ~05:56 | Fixture rebuild sau reboot: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549) |
| 05:58:52 | **T4 gate0 MỞ bằng đường dự phòng T4-check-only (quyết (j) đợt 143 — KÍCH HOẠT LẦN ĐẦU):** T5 b2 poll0 còn FAIL GST/apt (replay đang cài) nhưng kiểm postboot của chính T4 đã PASS → attempt1 boot mới chạy ngay |
| 06:00:44 | T5 POSTBOOT_PASS mới cho boot `cc222c8a` (poll=2, replay-full dpkg 1545/221) — đường (a) về sau |
| 06:03:03–06:11:34 | T4 attempt1/2/3 boot mới: cả 3 đều 20/20 NHƯNG lớp B vi phạm (nhiễm tải) → hết 3 attempt, poller thoát 06:11:34Z |
| 06:21:25 | **T4 ghi cờ `round144-t4.done`:** 0 lượt hợp lệ theo luật lập trình; hậu kiểm attempt3 median 55,0 ms + P1/P3-A1/P7/P3' ĐÚNG, B4 giả-dương — CHỜ QUYẾT PARENT có chấp nhận làm #19 hợp lệ (lên 16 lượt) hay không |
| 06:22:24 | **GATE-FOUND poll 28 — waiter2 exit 0 (t4=OK + postboot đường (a))** |
| 06:22:35–06:38:47 | **Harness 6/6 QUA GATE (xem §2)** |
| ~06:41 | Kiểm cuối + LIMITS + stage file + cờ `round144-t8.done` — **T8 đóng** |

## A. O8 — PASS 3/3 trên boot cũ (không điều tra lại)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 05:41:10–05:42:08 | 0 | **21/21 PASS** — S0 PASS 05:41:21, S1 PASS 05:41:24 "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 05:42:08–05:43:03 | 0 | **21/21 PASS** — S1 PASS 05:42:20, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 05:43:03–05:43:53 | 0 | **21/21 PASS** — S1 PASS 05:43:22 "checked=true → false, CDP mouse click lần 2" |

- Report JSON: `o8-webkit/o8w-clicktest-report.json` 21 kết quả `ok=true` 21/21; `o8-chromium/o8-clicktest-report.json` 21/21 `ok=true`. WebKit launched 27.2 cả hai attempt. 0 dòng `HARNESS LỖI`, 0 `Target crashed` trong `o8-144t8.log`.
- Driver O8 giữ 1 lock vite `t8-round144` suốt lượt (giữ 163 s, đã nhả 05:43:53Z; vite sau release curl 5560/5554 = 000000 — đã kiểm trong driver).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-144t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 1 → 2** (đợt 143 = 1, đợt 144 pass; T10 chạy lại O8 lúc đóng sổ để xác nhận độc lập — nếu T10 cũng pass thì chuỗi = 2 vững).
- **Caveat:** O8 chạy trên boot `691a7403` lúc ~1h45m tuổi — boot này đã chết theo reboot #31 lúc 05:53:15Z, sau khi O8 xong ~10 phút. Kết quả O8 là đo thật trên boot đó, không bị ảnh hưởng bởi reboot sau đó (file report + log còn nguyên trên đĩa).

## 2. Kết quả 6 lần chạy harness (6/6 PASS, 0 retry, QUA GATE)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 | 0 | 06:22:39–06:23:59 | **PASS** — W1 3/3 (delta +1 mỗi lần), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit | 85m4-hb128 | 0 | 06:24:14–06:26:34 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 1,9–2,0 s; P5 40 s 0 restart dư, seek kẹt dài nhất 1 mẫu ~0,2 s) |
| 3 | WebKit | 86n2 | 0 | 06:26:49–06:30:50 | **PASS** — P1–P6 đủ (P4 3/3 delta +1, đồng bộ 1,4–2,0 s; P5 0 restart, seek kẹt 0 mẫu; P6 KHÔNG-KẸT 90 s) |
| 4 | Chromium | 84l10 | 0 | 06:31:05–06:32:15 | **PASS** — W1 3/3 (delta +1 mỗi lần; bộ đếm 0→1, 2→3, 4→5 — artifact Chromium đã biết), W2 PASS, E4 PASS |
| 5 | Chromium | 85m4-hb128 | 0 | 06:32:31–06:34:41 | **PASS** — P1–P5 đủ (P4 3/3 delta +1, đồng bộ 0,5–1,0 s; P5 40 s 0 restart dư, seek kẹt 0 mẫu) |
| 6 | Chromium | 86n2 | 0 | 06:34:56–06:38:46 | **PASS (ok=true)** — P1–P6 đủ (P4 3/3; P5 0 restart — khác đợt 143 có +1 `ended` tự nhiên, xem F-144-T8-7; P6 KHÔNG-KẸT 90 s) |

- 6 report JSON đều `ok=true` (3 WebKit + 3 Chromium, kiểm độc lập bằng python — không chỉ đọc log).
- Fixture rebuild sau reboot: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- Gate: harness bắt đầu 06:22:35Z, 11 giây sau GATE-FOUND 06:22:24Z; T4 đã đóng cờ 06:21:25Z và không còn attempt nào đang chạy — 0 lần đo yên nào bị phiền (T4 đã xong toàn bộ trước khi harness bắt đầu).
- Khác đợt 143: đợt 143 harness chạy KHÔNG QUA GATE (waiter hết hạn, T4 0 attempt); đợt này waiter exit 0 đúng chuẩn — lần đầu tiên sau 2 đợt harness qua gate.

## 3. Watchdog trong lượt này — bài kiểm thật đầu tiên VẪN CHƯA XẢY RA (0 kẹt, đợt thứ ba liên tiếp)

- **0 kẹt thật đợt này** nên cả hai lớp watchdog mới đều không có dịp nổ: 0 dòng `WATCHDOG-137` trong 6 log lần chạy; 0 dòng `LIVE-DIAG` trong summary; 0 dir `stall-live-*` / `stall-*-timeout124-*` mới (chỉ có `diag-stall-144t8.sh` chưa dùng).
- **Vòng canh mtime đã chạy thật trên cả 6 lần chạy:** mỗi `run_one` poll mtime 10 s/lần trong suốt lần chạy (tổng ~16 phút chạy, `live_diags=0` cả 6 lần) — không false-positive nào dù W2 im lặng tới ~70 s và P5/P6 chờ 40–90 s (ngưỡng 120 s đủ dự trữ). `dev-url.txt` được ghi đúng cả 6 scratch (`http://127.0.0.1:5390/` / `:5490/`) — đường truyền devUrl cho diag live đã sẵn sàng, chỉ chưa có dịp dùng.
- **Kết luận:** bản vá (i)+(ii) đã triển khai đúng + chạy sạch qua 6/6 lần chạy đợt này (cộng dồn **18/18 lần chạy sạch sau vá, 3 đợt**), nhưng **CHƯA được kiểm chứng bằng kẹt thật** — đừng trích "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo (nếu có) mới là bài kiểm thật đầu tiên.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–144) + đường ổn định `t8-diag-stall.sh` → 144 (symlink đã cập nhật) | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 3 liên tiếp).** 18/18 lần chạy sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–144) | 6 lần chạy, poll 10 s/lần, `live_diags=0` cả 6 | **Chạy đúng, 0 false-positive.** `dev-url.txt` ghi đủ 6 scratch — đường devUrl sẵn sàng |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-144t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-144t8.log` đầy đủ (n=33 mẫu) | Balloon 4.546.384–6.000.656 kB trong lúc chạy; RAM avail 569–1.916 MB (xem F-144-T8-8) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=6 mỗi pha** (đợt 137/139/141/142/143/144 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 0 restart + P6 PASS |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | 0 lần kẹt → không kích hoạt | Baseline đã lưu: dmesg EPERM tái xác nhận; journalctl -k `-- No entries --`. Cơ chế (ii) + devUrl thật chưa có dịp dùng |

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

## 6. Dọn dẹp + kiểm cuối — sạch (trừ 1 socket mồ côi của T4)

- Driver O8 đã nhả lock `t8-round144` 05:43:53Z (giữ 163 s); driver harness đã nhả lock sau mỗi lần chạy (giữ tối đa ~4 phút/lần).
- Driver harness đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round144` đã nhả.
- Kiểm cuối 06:39Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; không có `/tmp/.X199-lock` / `/tmp/.X188-lock`; không có `vite.lock` trong repo; lock vite TRỐNG (0 ticket + 97 cooldown).
- **Còn 1 socket mồ côi `/tmp/.X11-unix/X193` (của T4, Xvfb :193 — không còn process nào sở hữu; T4 đã đóng cờ). T8 KHÔNG tự xóa socket của luồng khác — để T10 dọn lúc đóng sổ như tiền lệ đợt 143.**
- Không kiểm lại TTS 39; không thử birefnet (RAM avail lúc chạy xuống 569 MB — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **Harness đợt này QUA GATE nhưng KHÔNG có lượt yên #19 hợp lệ đi kèm** (F-144-T8-3) — gate mở bằng cờ T4 + postboot (đúng chuẩn), nhưng T4 có 0 lượt hợp lệ theo luật lập trình. Đừng trích "harness sau lượt yên #19 hợp lệ".
2. **O8 và harness chạy trên HAI BOOT KHÁC NHAU** (F-144-T8-4) — O8 trên `691a7403` (chết theo reboot #31), harness trên `cc222c8a`. Chuỗi FULL PASS đếm theo đợt; đừng trích cả hai nửa như cùng một boot.
3. **"0 WATCHDOG" đợt này KHÔNG có nghĩa "watchdog đã kiểm chứng xong".** Có 0 kẹt thật để thử — đợt thứ ba liên tiếp. Bản vá mới chỉ qua smoke-test (đợt 142) + 18 lần chạy sạch.
4. **Balloon KHÔNG chạm trần đợt này** (F-144-T8-8): max 6.000.656 kB trong lúc chạy, dưới trần đóng băng 6.443.824 kB của các đợt trước. Đừng trích trần 6.443.824 kB cho đợt này.
5. **P5 Chromium 86n2 0 restart đợt này** (F-144-T8-7) — khác đợt 143 (+1 `ended` tự nhiên). 0 restart là trường hợp sạch; khác biệt chưa giải thích được, ghi nhận để đối chiếu, không kết luận regression.
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142/143 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Reboot #31 là số TẠM của T4** — T2/T7 xác nhận số hiệu + khung chết; T8 chỉ ghi quan sát của mình (xem F-144-T8-1).

## 8. Sai số mới (F-144-T8-N)

- **F-144-T8-1 — REBOOT #31 (TẠM) giữa lúc chờ gate (`691a7403` → `cc222c8a`, btime 05:53:15Z) + DẤU HIỆU ĐỒNG HỒ NHẢY LÙI:** T8 mở trên boot `691a7403` (~05:38Z, RAM 570 MB, balloon 6.237.772 kB); reboot xảy ra trong khung (05:53:44Z, 05:54:08Z] theo đồng hồ cũ (mốc cuối: waiter1 poll 10 lúc 05:53:44Z còn thấy boot cũ; exec 05:54:08Z đã thấy boot mới). NHƯNG btime boot mới theo `/proc/stat` là 05:53:15Z — NẰM TRƯỚC mốc cuối thấy boot cũ sống 29+ s. `/proc/1` mtime 05:53:30Z (chênh btime +15 s, cùng họ F-143-T8-7 nhưng lần này +15 s thay vì +10 s). Giải thích khả dĩ nhất: đồng hồ VM nhảy lùi ~30 s ở reboot (hoặc nguồn btime lệch). T8 KHÔNG tự chốt khung chết tuyệt đối — ghi cả hai mốc để T2/T7 hòa giải (số hiệu #31 là TẠM theo cờ T4; khung chết theo đồng-hồ-cũ (05:53:44Z, 05:54:08Z] (24 s)). Hậu quả: waiter1 chết (poll 10 cuối); T4 attempt2 chết giữa chừng (HB129 cuối 05:53:42Z trong chain-t4.log); /tmp bị xóa (fixture mất — rebuild sau, 6/6 md5 khớp); POSTBOOT_PASS boot cũ thành stale. O8 (xong 05:43:53Z) không ảnh hưởng.
- **F-144-T8-2 — Runtime restart giết phiên waiter1 + phiên làm việc của T8:** waiter1 (bắt đầu 05:44:42Z) bị giết cùng reboot; phiên exec của T8 cũng bị runtime restart gián đoạn (thông báo recovery: session `proc_234c07a3dded` không có kết quả cuối xác nhận sau restart). T8 kiểm lại trạng thái trên đĩa (wait log còn tới poll 10, cờ T4 chưa có, boot đã đổi) rồi khởi động lại waiter2 05:55:19Z (deadline giữ 07:30Z) — không mất dữ liệu, không chạy trùng (waiter1 đã chết theo reboot, không còn process nào).
- **F-144-T8-3 — T4 0 lượt yên hợp lệ (5 attempt, 4 nhiễm tải + 1 chết theo reboot):** boot cũ: attempt1 20/20 nhưng lớp B vi phạm (nhiễm tải) → attempt2 chạy 05:48:15Z, chết theo reboot #31. Boot mới: attempt1/2/3 (05:58:52Z–06:11:34Z) cả 3 đều 20/20 nhưng lớp B vi phạm → hết 3 attempt, poller thoát 06:11:34Z. T4 ghi cờ 06:21:25Z: 0 lượt hợp lệ theo luật lập trình; hậu kiểm attempt3 (boot mới) median 55,0 ms + P1/P3-A1/P7/P3' ĐÚNG, B4 giả-dương — CHỜ QUYẾT PARENT có chấp nhận làm #19 hợp lệ (lên 16 lượt) hay không. Cộng dồn lượt yên hợp lệ: đứng nguyên 15 nếu parent không chấp nhận hậu kiểm; lên 16 nếu chấp nhận. **Gate cho harness vẫn mở đúng chuẩn** (cờ T4 + postboot) — nhưng harness đợt này không có lượt yên hợp lệ đi kèm; T8 chạy sau khi T4 đã xong toàn bộ (không attempt nào bị phiền).
- **F-144-T8-4 — O8 và harness chạy trên hai boot khác nhau:** O8 05:41–05:43Z trên `691a7403`; harness 06:22–06:38Z trên `cc222c8a`. Không phải lỗi quy trình (reboot xen giữa là sự kiện ngoài ý muốn) — nhưng khi trích số phải ghi rõ boot từng nửa; chuỗi FULL PASS đếm theo đợt (1 → 2), không đếm theo boot.
- **F-144-T8-5 — 0 kẹt đợt này, chuỗi "P3 không kẹt" 2 → 3:** 6/6 lần chạy harness + 3/3 lần chạy O8, 0 kẹt, 0 FAIL. 86n2 WebKit P4-lần2 PASS nhanh (đồng bộ 1,4–2,0 s) — điểm kẹt đợt 141 không tái hiện lần thứ ba liên tiếp.
- **F-144-T8-6 — Driver ghi baseline-meminfo thất bại (file read-only 444):** `cp /proc/meminfo smoke/baseline-meminfo.txt` trong driver báo Permission denied vì file đã tồn tại từ 05:41Z ở chế độ read-only (cp giữ mode nguồn 444). Baseline dmesg/journalctl -k của driver vẫn ghi đè được (boot mới). T8 đã lưu riêng `smoke/baseline-meminfo-boot-cc222c8a.txt` (boot mới) sau harness; file cũ `baseline-meminfo.txt` (05:41Z, boot cũ) giữ nguyên. Không ảnh hưởng lần chạy nào.
- **F-144-T8-7 — P5 Chromium 86n2 0 restart đợt này (khác đợt 143 +1 `ended` tự nhiên):** đợt 143 Chromium 86n2 P5 ghi 1 sự kiện `ended` đúng tại ct=30=dur (nhãn CÓ-RESTART +1, verdict vẫn ok=true); đợt này 0 sự kiện trong cửa sổ P5 40 s. Khác biệt chưa giải thích được (có thể do playhead bắt đầu cửa sổ khác nhau), ghi nhận để T10/T8 đợt sau đối chiếu. 0 restart là trường hợp sạch — không phải regression.
- **F-144-T8-8 — Balloon trong lúc chạy 4.546.384–6.000.656 kB, RAM avail 569–1.916 MB (n=33 mẫu):** max balloon 6.000.656 kB (lúc mở harness, avail 803 MB) — KHÔNG chạm trần đóng băng 6.443.824 kB của đợt 138–143. Avail min 569 MB trong lúc chạy (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB) — H1 (ngưỡng RAM tuyệt đối) tiếp tục BỊ BÁC BỎ. Tương quan ghi nhận, không kết luận nhân quả (H2 vẫn KHÔNG ỦNG HỘ).
- **F-144-T8-9 — Lệch chuẩn stage đợt 143 ĐÃ SỬA:** file paths đợt 143 của T8 chứa đường dẫn TUYỆT ĐỐI (aggregate 143 §9.1). Đợt này T8 stage bằng **đường dẫn TƯƠNG ĐỐI** (`docs/PHASE9_ROUND144_T8_VITEHARNESS_LIMITS.md`) như mọi luồng khác (xem Phụ lục). Mục tuyệt đối cũ trong `phase9-round143-t8-viteharness.txt` vẫn nằm đó — T10 chuẩn hóa nếu cần khi gộp; T8 không tự sửa file paths của đợt đã đóng.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 2** (đếm lại từ 0 sau đợt 142: 143 = 1, 144 = 2) — chờ T10 xác nhận độc lập bằng O8 lúc đóng sổ đợt 144.
2. **Lượt yên WebKit #19: T4 0 lượt hợp lệ theo luật lập trình; hậu kiểm attempt3 median 55,0 ms chờ quyết parent** (chấp nhận → lên 16 lượt hợp lệ; không chấp nhận → đứng nguyên 15). Việc T4/parent, không phải T8.
3. **Quy trình gate0 mới (quyết (j) đợt 143) ĐÃ CHẠY THẬT LẦN ĐẦU VÀ CÓ TÁC DỤNG:** T4-check-only mở cửa yên lúc 05:58:52Z khi cờ T5 còn FAIL (replay đang cài); T5 viết POSTBOOT_PASS sau (06:00:44Z). Không còn kẹt gate0 cả lượt như đợt 143. Ghi nhận để parent đánh giá thủ tục mới.
4. **Điều tra kẹt chung VẪN MỞ** (H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ) — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
5. **Watchdog VẪN CHƯA được thử bằng kẹt thật** (3 đợt liên tiếp 0 kẹt) — giữ nguyên bản vá, không revert (quyết parent đợt 142/143).
6. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.
7. Reboot #31 (TẠM): số hiệu + khung chết chờ T2/T7 xác nhận (xem F-144-T8-1 — dấu hiệu đồng hồ nhảy lùi ~30 s).

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 144

## B1. Trạng thái giả thuyết sau đợt 144

| Giả thuyết | Trạng thái đợt 143 | Trạng thái đợt 144 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Đợt này 0 kẹt dù RAM avail xuống 569 MB trong lúc chạy harness (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB) — không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | 0 kẹt đợt này nên không có mẫu mới; balloon max 6.000.656 kB, không chạm trần 6.443.824 kB — chỉ là tương quan |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | 0 kẹt đợt này — không thêm mẫu nào; bản vá watchdog (i)+(ii) đã sẵn sàng để bắt bằng chứng live ở lần kẹt sau |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 144

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–144) + đường ổn định `t8-diag-stall.sh` → 144 | 6 lần chạy harness + 3 lần chạy O8, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật (đợt 3 liên tiếp).** 18/18 lần chạy harness sạch sau vá |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–144) | 6 lần chạy harness, `live_diags=0` cả 6 | Chạy đúng, 0 false-positive; `dev-url.txt` đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-144t8.log` (n=33) | Balloon 4,55–6,00 GB, RAM avail 569–1.916 MB trong lúc chạy; KHÔNG chạm trần 6.443.824 kB |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=6 mỗi pha** (đợt 137/139/141/142/143/144 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, truyền devUrl thật) | 0 lần kẹt → không kích hoạt | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3)

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 144: 6 LẦN CHẠY HARNESS, 0 KẸT (CHUỖI 2 → 3)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** (không retry) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi "P3 không kẹt" **2 → 3**.
- Bốn lần kẹt vẫn là: đợt 134/135 (3 lần) + đợt 141 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=6 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 144: không có yếu tố chung mới (0 kẹt). Reboot #31 giữa lúc chờ gate (691a7403 → cc222c8a, btime 05:53:15Z) xảy ra TRƯỚC khi harness chạy — không ảnh hưởng lần chạy nào (O8 chạy xong trước reboot 10 phút; harness chạy sau gate trên boot mới). Vite server còn sống lúc chạy: cả 6 lần chạy harness đều tới được `vite dev sẵn sàng` + `dev-url.txt` ghi đủ — không có bằng chứng vite chết đợt này (nhưng cũng không có kẹt để kiểm vite-HTTP lúc kẹt). T4 0 lượt yên hợp lệ (5 attempt nhiễm tải/chết reboot) — việc T4, không phải yếu tố kẹt của harness.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- **O8 WebKit FAIL đợt 142 đã kết luận xong ở đợt 143 (trạng thái boot mới); đợt này O8 PASS 3/3 thường kỳ, chuỗi FULL PASS 1 → 2.** Không mở điều tra mới; nếu O8 WebKit FAIL lại ở đợt 145 thì mở điều tra lại từ đầu.
- **Quy trình gate0 mới (quyết (j) đợt 143) đã chạy thật lần đầu và có tác dụng** (T4-check-only mở cửa yên khi cờ T5 còn FAIL) — nhưng đợt này T4 vẫn 0 lượt hợp lệ vì nhiễm tải (lớp B), không phải vì gate0.
- **Bản vá watchdog đợt 142 là bước kiểm mới nhất**: nếu đợt này (hoặc đợt sau) có kẹt thật mà watchdog (i) và/hoặc (ii) nổ, đó sẽ là bằng chứng live đầu tiên về trạng thái browser lúc kẹt (ps/RSS, vite-HTTP, probe 1+1).

## B7. Bằng chứng mới từ đợt 144 — O8 PASS 3/3, HARNESS 6/6 QUA GATE, REBOOT #31

- O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0 trên boot cũ 691a7403; S1 PASS cả 3 lần (WebKit: Playwright mouse click lần 2; Chromium: CDP mouse click lần 2).
- Harness: WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, toàn bộ PASS exit 0, 0 FAIL oan, 0 retry — **QUA GATE** (waiter2 GATE-FOUND poll 28, 06:22:24Z; cờ T4 06:21:25Z + POSTBOOT_PASS đường (a) cho boot mới cc222c8a pass_at 06:00:44Z).
- Vá watchdog (i)+(ii) GIỮ NGUYÊN, 0 kích hoạt đợt thứ ba liên tiếp (0 kẹt); 18/18 lần chạy harness sạch sau vá.
- 0 WATCHDOG-137 trong 6 log — nhưng đây là 0 kẹt, không phải "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo mới là bài kiểm thật đầu tiên của bản vá.
- Sampler: balloon 4,55–6,00 GB, RAM avail 569–1.916 MB trong lúc chạy harness (KHÔNG chạm trần 6.443.824 kB).
- Reboot #31 (TẠM) giữa lúc chờ gate (691a7403 → cc222c8a, btime 05:53:15Z; khung chết theo đồng-hồ-cũ (05:53:44Z, 05:54:08Z] — btime nằm trước mốc cuối 29+ s, dấu hiệu đồng hồ nhảy lùi); `/tmp/.X11-unix/` còn 1 socket mồ côi X193 của T4 lúc kiểm cuối (06:39Z).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round144-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary, **đường dẫn TƯƠNG ĐỐI** — đã sửa lệch chuẩn đợt 143): LIMITS này. Đợt này KHÔNG sửa file repo nào khác (3 script harness giữ md5 đợt 142/143; 2 script O8 gốc không đụng). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round144-t8/` (run-webkit-144t8.sh — ĐÃ CHẠY 6/6 QUA GATE; diag-stall-144t8.sh — KHÔNG DÙNG (0 kẹt); rebuild-fixtures-144t8.sh — ĐÃ DÙNG sau reboot (6/6 md5 khớp); wait-t4-t5-144t8.sh — ĐÃ CHẠY, waiter1 chết theo reboot (poll 10) + waiter2 GATE-FOUND poll 28 exit 0; o8-driver-144t8.sh — ĐÃ CHẠY (WebKit 21/21 ×2 + Chromium 21/21); o8-s1-probe-144t8.mjs — KHÔNG DÙNG (chỉ chạy khi FAIL; `node --check` OK); make-probe-144t8.py — KHÔNG DÙNG đợt này (probe đã có sẵn từ đợt 143, không cần tạo lại); smoke/wait-t4-t5.log (waiter2) + smoke/wait-t4-t5-boot691a7403.log (waiter1, poll 1–10); smoke/REBOOT-144t8-NOTE.txt; smoke/run-webkit-summary.txt (driver 06:22:35–06:38:47Z, ec webkit 0/0/0; chromium 0/0/0); smoke/ram-144t8.log (sampler 30 s, n=33, có cột balloon_kb); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/attempt1/ (snapshot 6 log + summary); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai; O8 ecbd1b40/8911ad3d cả hai); smoke/baseline-dmesg-tail50.txt + smoke/baseline-journalctl-k.txt (dmesg EPERM + journalctl rỗng, boot mới); smoke/baseline-meminfo.txt (05:41Z, boot cũ) + smoke/baseline-meminfo-boot-cc222c8a.txt (boot mới); o8-144t8.log + o8-lock.log (driver O8 05:41:10–05:43:53Z); o8-webkit/ + o8-chromium/ + o8-probe/ (scratch; o8-probe TRỐNG vì probe không chạy — chỉ có fixture copy). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round144-t8/diag-stall-144t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild sau reboot (round76-d8, round81-i7, l10, m4, n2 — 6/6 md5 khớp).
