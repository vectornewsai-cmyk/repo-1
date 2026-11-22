# Đợt 141 T8 — GATE MỞ, 7 LẦN CHẠY: 86n2 WebKit TIMEOUT 124 — KẸT THẬT ĐẦU TIÊN TỪ ĐỢT 135/136; WATCHDOG KHÔNG KÍCH HOẠT

Ngày: 18/11/2026 (lượt cron 03:35 +07 19/11 = 20:35:51Z; T8 mở ~20:39Z, đóng ~21:30Z trên boot `2c0efe57`). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: chờ cờ + chạy harness 6/6 theo quy trình (gate MỞ thì chạy; gate KHÔNG MỞ thì ghi rõ + exit — brief đợt 141). **Gate MỞ 20:52:13Z (watch poll 10) / 20:52:52Z (waiter poll 11) nên T8 CHẠY 6/6 + 1 retry.** KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND140_T8_VITEHARNESS_LIMITS.md (GATE NOT MET, 0 lần chạy — đợt này gate mở, chạy được).

## 0. Kết luận ngắn — GATE MỞ; 86n2 WebKit KẸT THẬT (timeout 124); watchdog 0 lần kích hoạt; 84l10 FAIL oan, retry PASS

- **Gate MỞ:** watch `WATCH-GATE-FOUND poll=10 20:52:13Z t4=OK postboot=OK`; waiter `GATE-FOUND poll=11 20:52:52Z` (exit 0). T4 cửa yên mở poll #2 20:42:47Z (RAM 1.485 MB), attempt1 20/20 exit 0 xong 20:46:41Z; T5 `POSTBOOT_PASS` boot `2c0efe57` từ 20:41:02Z (pass_at, poll=0) — gate0 xanh từ đầu lượt.
- **Harness 6/6 + 1 retry (7 lần chạy):** WebKit 85m4 PASS; Chromium 84l10/85m4/86n2 PASS toàn bộ; WebKit 84l10 attempt1 FAIL (exit=1) nhưng **retry PASS** (flaky — F-141-T8-4); **WebKit 86n2 TIMEOUT 124 — KẸT THẬT** (F-141-T8-1): im lặng ~13,7 phút sau P4-lần1 PASS, đúng chữ ký 3 lần kẹt đợt 134/135.
- **Watchdog KHÔNG kích hoạt trong kẹt thật (F-141-T8-2 — phát hiện lớn nhất đợt này):** 0 dòng `WATCHDOG-137`, không dump live nào, không probe 1+1 — dù script 86n2 CÓ chứa `evalDiag137`. Đây là lần kẹt thật đầu tiên kể từ khi watchdog triển khai (đợt 137–140: 0 kẹt để thử; đợt 141: kẹt thật, watchdog không nổ). Lỗ phủ: `evalDiag137` chỉ wrap evaluate trong `waitForPlaySync`/`sampleFor`; các evaluate trần trong vòng P4 (dòng 453, `waitForNotSeeking`, 459, 465, 471–474) không được canh.
- **Chuỗi "P3 không kẹt" ĐỨT (F-141-T8-5):** từ 10 về **0** — đợt 141 có kẹt. Đếm lại từ đợt sau.
- **Balloon xả rồi phồng lại (F-141-T8-6):** đóng băng đúng 6.443.824 kB lúc mở đợt (giá trị đợt 138/139/140), xả nhanh 20:40→20:42 (xuống ~5,18 GB, RAM vọt 462→1.501 MB — nhờ đó gate mở), rồi phồng lại trong lúc chạy harness (5,29→6,16 GB; RAM 990→290 MB). Gate A nhấp nháy theo balloon.
- **Cây không đổi:** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 KHÔNG ĐỔI so với đợt 139/140. Fixture rebuild 6/6 md5 khớp đợt 125.
- **Dọn sạch:** 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium sót; socket `:199` của T8 đã dọn; socket `X193` + lock sót lại KHÔNG phải của T8 (process đã chết) — để yên, báo T4/T10 (F-141-T8-8). Không `vite.lock`.
- **Stage đợt này: 1 file** — LIMITS này (3 script harness không đổi nên không stage lại). KHÔNG push.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 20:35:51 | Lượt cron 03:35 +07 mở đợt 141; `round-in-progress.md` tạo (9 luồng T1–T9 + T10); boot lúc mở `2c0efe57` (btime 19:54:12Z) |
| 20:39:49 | T8 mở: RAM avail 462 MB, Balloon **6.443.824 kB** (đóng băng đúng giá trị đợt 138/139/140); T4/T5 đợt 141 chưa có dir |
| 20:40–20:42 | Adapt 6 script 140→141 (`bash -n` OK ×6; `node --check` OK ×3); symlink `t8-diag-stall.sh` trỏ lại sang `round141-t8/diag-stall-141t8.sh`; tree-md5-open (530e10a7 / 2c384ed1 / ee80d093; harness a92432a2 / 6e3ce0a0 / 847a818f) |
| 20:41:02 | T5 viết `POSTBOOT_PASS` boot `2c0efe57` (pass_at 20:41:02Z, poll=0) — gate0 xanh |
| 20:42:47 | **T4 cửa yên mở poll #2 (gate0 PASS + gateA RAM 1.485 MB) — attempt1 chạy ngay, 20/20 exit 0, xong 20:46:41Z, coverage 6/6** |
| 20:42:52 | Waiter bắt đầu (deadline 22:30Z, epoch 1795041000); RAM avail **1.227 MB**, balloon 5.375.956 kB — balloon ĐANG XẢ |
| 20:43:13 | Watch bắt đầu (poll 60 s); poll 1: avail 924 MB, balloon 5.179.348 kB — RAM dao động mạnh theo balloon |
| 20:52:13 | **Watch GATE-FOUND poll=10 (t4=OK postboot=OK)** — `round141-t4.done` (0 byte, viết 20:52) đã có |
| 20:52:52 | **Waiter GATE-FOUND poll=11, exit 0** |
| 20:52:51 | Rebuild fixture `/tmp`: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); blend media bền còn nguyên |
| 20:53:00–21:18:20 | Driver `run-webkit-141t8.sh`: 6 lần chạy (xem §2) |
| 20:53:03–20:53:14 | WebKit 84l10 attempt1: exit=1 FAIL (W1-lần1, 11 s) |
| 20:53:29–20:55:37 | WebKit 85m4: exit=0 PASS |
| 20:55:52–21:10:52 | **WebKit 86n2: exit=124 TIMEOUT — KẸT ở P4-lần2** (xem §3) |
| 21:11:08–21:18:20 | Chromium 84l10/85m4/86n2: exit=0 PASS toàn bộ |
| 21:22:13–21:23:20 | Retry 84l10 WebKit: exit=0 PASS (W1 3/3, W2, E4) |
| 21:24:04 | Kiểm cuối: 0 process sót, `:199` đã dọn, cây không đổi |
| ~21:30 | LIMITS + stage file verify od + cờ `round141-t8.done` — **T8 đóng** |

## 2. Kết quả 7 lần chạy (6/6 + retry)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 attempt1 | 1 | 20:53:03–20:53:14 | **FAIL** — W1-lần1 "video chưa phát thật trước khi ép ended": ct=0.4, seeking=true, readyState=4, playhead=0.4 (flaky — xem F-141-T8-4) |
| 2 | WebKit | 85m4-hb128 | 0 | 20:53:29–20:55:37 | **PASS** — KHÔNG FAIL (P1–P5 đủ) |
| 3 | WebKit | 86n2 | **124** | 20:55:52–21:10:52 | **TIMEOUT — KẸT** ở P4-lần2 (xem §3) |
| 4 | Chromium | 84l10 | 0 | 21:11:08–21:12:09 | **PASS** — KHÔNG FAIL |
| 5 | Chromium | 85m4-hb128 | 0 | 21:12:24–21:14:23 | **PASS** — KHÔNG FAIL (P1–P5, HB128 đều đặn tới 40 s) |
| 6 | Chromium | 86n2 | 0 | 21:14:38–21:18:20 | **PASS** — KHÔNG FAIL (P1–P5, P4 3/3) |
| 7 | WebKit | 84l10 retry | 0 | 21:22:13–21:23:20 | **PASS** — W1 3/3, W2, E4 (67 s) |

- 84l10 attempt1 FAIL vs retry PASS: cùng cây, cùng boot, cùng fixture — chỉ khác thời điểm (RAM lúc attempt1: avail 1.447 MB lúc bắt đầu, 1.721 MB lúc kết thúc; lúc retry: 752 MB → 1.320 MB). FAIL oan do video kẹt seeking ngay lúc setup — không tái hiện ở retry.
- Chromium đối chứng: 3/3 PASS, gồm 86n2 P4 3/3 + P5 — app logic đúng trên Chromium trong cùng cửa sổ; kẹt 86n2 là WebKit-specific (ủng hộ H3, xem §B).

## 3. Kẹt 86n2 WebKit — chữ ký cũ tái hiện, watchdog im lặng (F-141-T8-1, F-141-T8-2)

- **Dòng log cuối trước khi im:** `[webkit] P4-lần1 PASS — delta=+1, hạ-cánh-về-target=true, ct=1.667, playing=true, errors=0` lúc **20:57:08.663Z**. Sau đó KHÔNG CÒN DÒNG NÀO cho tới `21:10:52.835Z [webkit] HARNESS/FAIL: page.evaluate: Target page, context or browser has been closed` (lúc `timeout 900` giết node). **Im lặng ~13,7 phút.**
- **Report JSON xác nhận:** `n2-webkit-w7-report.json` — `phases` chỉ có P1/P2/P3, `P4: null`, `P5: null` → kẹt trong iteration 2 của vòng P4, trước mọi kết quả P4-lần2.
- **RAM/balloon trong lúc kẹt (sampler 30 s, `ram-141t8.log`):**

| Thời điểm (Z) | RAM avail | Balloon (kB) | load1 |
|---|---|---|---|
| 20:55:00 | 990 MB | 5.288.928 | 1,83 |
| 20:57:01 | 687 MB | 5.558.496 | 1,64 |
| 20:58:31 | 618 MB | 5.739.356 | 0,45 |
| 21:00:01 | 556 MB | 5.863.352 | 0,68 |
| 21:02:01 | 410 MB | 6.025.544 | 0,16 |
| 21:04:01 | 547 MB | 5.906.964 | 0,09 |
| 21:06:01 | 630 MB | 5.829.720 | 0,95 |
| 21:08:01 | 449 MB | 5.995.040 | 0,70 |
| 21:10:31 | 290 MB | 6.160.716 | 0,12 |

- Kẹt bắt đầu lúc RAM ~687 MB và đang rơi (balloon phồng lại 5,29→6,16 GB trong lúc chạy); load1 rơi về 0,05–0,2 trong cửa sổ 21:02–21:10 — **process idle**, đúng chữ ký 3 lần kẹt cũ (evaluate không trả, ngay sau một bước PASS, process idle, không verdict FAIL).
- **Watchdog không nổ:** 0 dòng `WATCHDOG-137` trong `run-webkit-86n2.log`; không có dir dump live nào từ ~20:58 (chỉ có dir smoke-test + dir post-mortem 21:10:52). Script 86n2 CÓ `evalDiag137` (dòng 66–87; dùng ở dòng 238 `waitForPlaySync` và 298 `sampleFor`) — nhưng nó chỉ wrap evaluate trong 2 hàm đó. Vòng P4 (dòng 447–485) gọi evaluate trần ở: dòng 453 (`STATE_FN` ngay sau `waitForPlaySync`), `waitForNotSeeking` (dòng 283/288), 459 (`FORCE_ENDED_FN`), 465, 471–474. Hai khả năng (không phân biệt được từ log — ghi rõ, không tự kết luận):
  - (a) `waitForPlaySync("P4-lần2")` chạy 60 s không đồng bộ rồi throw (bị `.catch(() => null)` dòng 452 nuốt — không để lại dòng log), rồi evaluate trần dòng 453 kẹt vĩnh viễn → watchdog theo thiết kế không thể nổ.
  - (b) Kẹt nằm trong evaluate đã wrap nhưng timer 60 s của Node không nổ (event loop đóng băng) — không có bằng chứng ủng hộ hay bác bỏ; sampler bash vẫn chạy đều 30 s nên VM không chết.
  - Hệ quả chung cho cả (a)/(b): **không có bằng chứng live nào về trạng thái browser lúc kẹt** (không probe 1+1 → không biết kênh evaluate còn sống hay page JS chết; không ps/RSS lúc kẹt).
- **Bước 4 chỉ thu được post-mortem (F-141-T8-3):** driver gọi `diag-stall-141t8.sh` SAU khi `timeout 900` đã giết node → `ps.txt` RỖNG (0 byte — node chết, MiniBrowser/WebKitWebProcess chết theo Playwright cleanup); `ps-top-rss.txt` chỉ còn Xvfb `:199` (pid 22818, RSS 39 MB) + bash hệ thống; loadavg 0,24; avail 779 MB; balloon 6.181.396 kB. dmesg EPERM + journalctl -k rỗng như mọi đợt. Dir dump: `smoke/stall-webkit-86n2-timeout124-1795036252/` (10 file).
- **Driver cũng không truyền devUrl cho diag** (`diag-stall ... ""`) nên bước kiểm vite-HTTP bị bỏ qua ngay cả lúc timeout — lỗ nhỏ, xem §9 đề xuất.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế (đợt 137, giữ nguyên + đường ổn định đợt 139) | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `evalDiag137` trong 3 script, đường ổn định `t8-diag-stall.sh` | **Kẹt thật 1 lần → 0 kích hoạt** | **LẦN ĐẦU watchdog được thử bằng kẹt thật — KHÔNG NỔ (F-141-T8-2).** Bằng chứng đường mới hoạt động: smoke-test tay 20:42Z qua symlink, 10/10 file. Chưa từng kích hoạt thật trong bất kỳ lần kẹt nào (đợt 134/135 chưa có watchdog; đợt 137/139: 0 kẹt; đợt 141: 1 kẹt, 0 nổ) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-141t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-141t8.log` đầy đủ | Balloon phồng lại 5,29→6,16 GB trong lúc chạy; RAM 990→290 MB (§3). Đây là lần đầu sampler ghi được balloon TRONG lúc kẹt thật |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=3 mỗi pha** (đợt 137 N=1 + đợt 139 N=1 + đợt 141 N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 PASS trong khi WebKit 86n2 kẹt ở P4-lần2 |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 + baseline lúc bắt đầu | Kích hoạt 1 lần (timeout 124) — **nhưng post-mortem** | **dmesg EPERM tái xác nhận** (F-141-T8-3); journalctl -k rỗng; ps.txt rỗng vì node đã chết trước khi diag chạy; vite-HTTP bị bỏ qua (devUrl rỗng) |

## 5. Cây + md5 — mở / cuối đều khớp, 3 script harness KHÔNG ĐỔI

| File | md5 lúc mở 20:40Z | md5 lúc cuối 21:24Z | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `clicktest-84l10-webkit-loop-w1.mjs` | a92432a2 | a92432a2 | Không (31.359 B) |
| `clicktest-85m4-webkit-w7-hb128.mjs` | 6e3ce0a0 | 6e3ce0a0 | Không (35.805 B) |
| `clicktest-86n2-webkit-w7.mjs` | 847a818f | 847a818f | Không (37.903 B, vẫn oversize — xem §7.6) |

- Không sửa code app, không sửa script harness đợt này nên không có file production nào trong batch stage ngoài LIMITS này.
- Fixture: rebuild sau gate, 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); ffprobe đúng spec; blend media bền còn nguyên (f1e277f0 / f4c35a6a).

## 6. Dọn dẹp + kiểm cuối — sạch (trừ socket X193 không phải của T8)

- Driver + retry đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round141` đã nhả sau mỗi lần chạy.
- Kiểm cuối 21:24:04Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` chỉ còn `X193` (socket sót, process đã chết — KHÔNG phải của T8, để yên — F-141-T8-8); không có `/tmp/.X199-lock`; không có `vite.lock` trong repo; không lock `t8-round141` nào được giữ.
- Không kiểm lại TTS 39; không thử birefnet (RAM cao nhất lúc chạy ~1.721 MB lúc 84l10 bắt đầu — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **"86n2 WebKit kẹt" là đúng — nhưng đừng trích "WebKit hay kẹt" hay "H3 đã chứng minh".** Đây là kẹt thứ 4 (sau 3 lần đợt 134/135), mẫu duy nhất đợt này; H3 vẫn MỞ, chưa chứng minh (xem §B).
2. **Watchdog 0 kích hoạt KHÔNG có nghĩa "không có kẹt".** Có kẹt thật 13,7 phút mà watchdog không nổ — đừng trích "watchdog đã kiểm chứng xong". Nó mới chỉ qua smoke-test.
3. **Bước 4 thiếu dmesg vĩnh viễn trong cell này** (F-141-T8-3): dmesg EPERM + journalctl -k rỗng — và lần này còn thiếu cả ps lúc kẹt (post-mortem).
4. **84l10 attempt1 FAIL là flaky, không phải regression:** retry PASS toàn bộ 67 s sau đó, cùng cây/boot/fixture. Nhưng nó cùng họ seeking/media với kẹt 86n2 — ghi riêng, không gộp vào đếm kẹt, không bỏ qua hẳn.
5. **RAM "rơi trong lúc kẹt" (687→290 MB) không chứng minh nguyên nhân:** balloon phồng lại là host-driven, xảy ra cả khi không kẹt (đợt 140: RAM phẳng ~500 MB cả đợt mà không có lần chạy nào để so). H2 vẫn KHÔNG ỦNG HỘ.
6. **86n2 vẫn oversize 37.903 B (>37.768 B giới hạn push)** — không đổi đợt này; lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp.
7. **Gate A nhấp nháy theo balloon:** T4 thấy RAM 1.485–1.501 MB lúc 20:42, watch thấy 924 MB lúc 20:43:13 — cùng một cửa sổ, chênh ~570 MB trong 26 s. Đừng trích một con số RAM "lúc gate mở" làm đại diện.
8. **T4 `.done` 0 byte là đúng thiết kế** (tín hiệu = sự tồn tại của file, như đợt 140); số đo lượt yên #17 là việc T4 (attempt1 20/20, coverage 6/6, xong 20:46:41Z) — T8 chỉ ghi lại, không tự kết luận verdict lượt yên.

## 8. Sai số mới (F-141-T8-N)

- **F-141-T8-1 — 86n2 WebKit TIMEOUT 124: kẹt thật thứ 4, P4-lần2, im lặng ~13,7 phút:** dòng cuối P4-lần1 PASS 20:57:08.663Z; im lặng tới 21:10:52.835Z (timeout 900 giết node, lỗi `page.evaluate: Target page, context or browser has been closed`); report JSON phases chỉ P1–P3, P4 null. Load1 0,05–0,2 trong cửa sổ 21:02–21:10 (idle); RAM lúc kẹt bắt đầu ~687 MB, rơi về 290 MB lúc giết (balloon phồng 5,29→6,16 GB). Đúng chữ ký 3 lần kẹt đợt 134/135 (evaluate không trả, ngay sau bước PASS, idle, không FAIL). Chromium 86n2 PASS toàn bộ trong cùng cửa sổ → kẹt WebKit-specific.
- **F-141-T8-2 — watchdog KHÔNG kích hoạt trong kẹt thật (lần đầu được thử bằng kẹt thật):** 0 dòng `WATCHDOG-137` trong log 86n2; không dir dump live nào từ ~20:58; probe 1+1 không chạy → không biết kênh evaluate còn sống hay page JS chết. Nguyên nhân khả dĩ: (a) kẹt nằm ở evaluate TRẦN ngoài phủ của `evalDiag137` (vòng P4: dòng 453, `waitForNotSeeking`, 459, 465, 471–474 — `waitForPlaySync` throw sau 60 s không đồng bộ bị `.catch(() => null)` dòng 452 nuốt, rồi evaluate dòng 453 kẹt); (b) timer Node không nổ (không bằng chứng). T8 KHÔNG tự kết luận (a) hay (b) — chỉ ghi lại lỗ phủ đã thấy trong code. Đề xuất cho parent (CHƯA quyết — xem §9.1): wrap toàn bộ `page.evaluate` trong 3 script harness bằng `evalDiag137` + driver canh log im lặng >120 s → gọi diag live TRƯỚC khi timeout giết process.
- **F-141-T8-3 — diag bước 4 chỉ thu được post-mortem:** driver gọi diag SAU khi `timeout` giết node → `ps.txt` rỗng (0 byte); MiniBrowser/WebKitWebProcess đã chết theo Playwright cleanup; chỉ còn Xvfb `:199` trong `ps-top-rss.txt`. dmesg EPERM tái xác nhận (`dmesg: read kernel buffer failed: Operation not permitted`); journalctl -k `-- No entries --`. Driver không truyền devUrl nên kiểm vite-HTTP bị bỏ qua. Bước 4 vẫn chỉ nửa bằng chứng — lần này còn thiếu cả ps lúc kẹt.
- **F-141-T8-4 — 84l10 WebKit attempt1 FAIL flaky (không phải regression):** W1-lần1 `HARNESS/FAIL: video chưa phát thật trước khi ép ended` — ct=0.4, seeking=true, readyState=4, playhead=0.4, exit=1 sau 11 s; retry 21:22:13–21:23:20 exit=0 PASS toàn bộ (W1 3/3, W2, E4). Cùng cây/boot/fixture. Ghi riêng khỏi đếm kẹt (verdict FAIL ≠ hang), nhưng cùng họ seeking/media với F-141-T8-1.
- **F-141-T8-5 — chuỗi "P3 không kẹt" ĐỨT, reset về 0:** đợt 137 = 9, đợt 139 = 10 (đợt 138/140 = 0 lần chạy, không đếm); đợt 141 có kẹt thật → chuỗi về **0**. Đếm lại từ đợt sau (mỗi đợt chạy được mà 0 kẹt +1).
- **F-141-T8-6 — balloon xả rồi phồng lại trong một lượt:** đóng băng đúng 6.443.824 kB lúc mở đợt (20:39:49Z, RAM 462 MB — giá trị đợt 138/139/140); xả nhanh 20:40→20:42 xuống ~5,18 GB (RAM vọt 462→1.501 MB — T4 poll #1 20:42:02Z thấy 1.501 MB, poll #2 1.485 MB); phồng lại trong lúc chạy harness 5,29→6,16 GB (RAM 990→290 MB lúc 21:10:31Z); sau retry lại 1.259 MB lúc 21:24Z (balloon 5.614.428 kB). Gate A nhấp nháy: watch poll 1 (20:43:13Z) thấy 924 MB trong khi T4 thấy 1.485 MB lúc 20:42:47Z.
- **F-141-T8-7 — `/proc/1` btime 19:54:22Z vs `uptime -s` 19:54:12Z (chênh 10 s):** cùng lớp F-138-T8-6/F-139-T8-3/F-140-T8-1. T8 chỉ ghi lại, không tự kết luận khung chết; T2/T6 đối chiếu. Boot id `2c0efe57-5559-4e92-9f8b-aecf1f9866a3` khớp cả hai nguồn.
- **F-141-T8-8 — socket `X193` + `/tmp/.X193-lock` sót lại, process đã chết:** không phải của T8 (T8 dùng `:199`, đã dọn sạch cả socket + lock). T8 KHÔNG đụng vào (đồ của luồng khác — có thể T4). Báo T4/T10 dọn.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Watchdog lỗ phủ (F-141-T8-2) — ĐỀ XUẤT, CHƯA QUYẾT:** (i) wrap toàn bộ `page.evaluate` trong 3 script harness bằng `evalDiag137` (hiện chỉ wrap `waitForPlaySync`/`sampleFor`); (ii) driver canh mtime của log từng lần chạy — im lặng >120 s thì gọi `diag-stall` live (truyền devUrl thật để kiểm vite-HTTP) TRƯỚC khi `timeout 900` giết process, để bước 4 thu được ps lúc kẹt; (iii) nếu (i)+(ii) xong mà đợt sau vẫn có kẹt không watchdog thì xem lại giả thuyết event-loop đóng băng. (i)+(ii) là chẩn đoán-only, không đổi verdict — nhưng vẫn cần quyết parent vì đụng 3 script harness đã ổn định.
2. **Điều tra chung ba lần kẹt (§B):** nay là BỐN lần (thêm F-141-T8-1) — H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ, chưa chứng minh. Điều tra (c2) đã ĐÓNG — T8 chỉ giám sát thụ động, không mở lại điều tra; quyết đóng/mở lại là việc parent.
3. **Balloon xả rồi phồng lại trong một lượt (F-141-T8-6):** mẫu mới (trước đây hoặc xả bền cả đợt như 139, hoặc đóng băng cả đợt như 138/140). T9/T10 theo dõi; quyết parent (d) đợt 139 (không có kênh can thiệp host, giữ gate A) vẫn đứng, không cần quyết mới trừ khi parent muốn đổi.
4. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (đợt này RAM max lúc chạy ~1.721 MB — xa guard; u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung ba lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 141 (KẸT THỨ 4 — 86n2 WebKit)

## B1. Trạng thái giả thuyết sau đợt 141

| Giả thuyết | Trạng thái đợt 140 | Trạng thái đợt 141 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Kẹt bắt đầu lúc RAM ~687 MB; 85m4 PASS lúc ~874–990 MB; retry 84l10 PASS lúc bắt đầu 752 MB — không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ (đứng nguyên) | **KHÔNG ỦNG HỘ (đứng nguyên)** | RAM rơi 687→290 MB TRONG lúc kẹt (balloon host phồng 5,29→6,16 GB) — tương quan, chưa chứng minh nhân quả; kẹt bắt đầu trước khi RAM rơi sâu; Chromium PASS trong cùng cửa sổ RAM thấp |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | Thêm mẫu thứ 4 đúng chữ ký; Chromium 86n2 PASS toàn bộ trong cùng cửa sổ → WebKit-specific; nhưng vẫn KHÔNG có bằng chứng live (watchdog không nổ, ps post-mortem) để chứng minh cơ chế |

## B2. Trạng thái 4 bước kiểm (quyết parent đợt 136 §12.3(i)) — chi tiết đợt 141

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | ĐƯỜNG ỔN ĐỊNH `t8-diag-stall.sh` (quyết (g)); md5 3 script không đổi | **Kẹt thật 1 lần → 0 kích hoạt** | **LẦN ĐẦU thử bằng kẹt thật: KHÔNG NỔ.** Lỗ phủ đã xác định trong code (chỉ wrap `waitForPlaySync`/`sampleFor`; evaluate trần vòng P4 không canh). Smoke-test tay 20:42Z (10/10 file) chỉ chứng minh đường đi + cú pháp |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-141t8.log` | **Lần đầu sampler ghi được balloon TRONG lúc kẹt thật:** balloon phồng 5,29→6,16 GB, RAM 990→290 MB, load1 0,05–0,2 (idle) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=3 mỗi pha** (đợt 137 N=1 + đợt 139 N=1 + đợt 141 N=1; đợt 138/140 N=0). Chromium 86n2 P4 3/3 + P5 PASS vs WebKit 86n2 kẹt P4-lần2 |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124) | Kích hoạt 1 lần — **post-mortem** | **dmesg BỊ CHẶN (EPERM) tái xác nhận; journalctl -k rỗng; ps.txt RỖNG** (node đã chết trước khi diag chạy); vite-HTTP bị bỏ qua (devUrl rỗng) — bước 4 lần này yếu hơn cả đợt 137–140 (lúc đó chưa có kẹt thật để thử) |

## B3. Chữ ký kẹt của cả bốn lần — không đổi (ghi lại để đối chiếu)

Xem docs/PHASE9_ROUND137_T8_VITEHARNESS_LIMITS.md §B3: cả bốn đều là một lệnh `page.evaluate` không bao giờ trả kết quả, ngay sau một bước PASS, process idle (loadavg ~0,1), không verdict FAIL. Mẫu mới đợt 141: P4-lần1 PASS 20:57:08Z → im lặng tới timeout 21:10:52Z; report JSON P4 null; Chromium cùng pha PASS.

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 141 ĐỨT CHUỖI

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: **0 lần chạy** (không đếm — quyết parent (i)). Đợt 139: **6 lần chạy, 0 kẹt**. Đợt 140: **0 lần chạy** (không đếm — cùng quyết (i)). Đợt 141: **7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS)**.
- Chuỗi "P3 không kẹt" **ĐỨT: 10 → 0** (đợt 141). Đếm lại từ đợt sau.
- Bốn lần kẹt: đợt 134/135 (3 lần) + đợt 141 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=3 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — cập nhật đợt 141

- Cùng boot? KHÔNG — 4 lần kẹt ở 4 boot khác nhau (cc1f9de0, 8ae55060, 78b55838, 2c0efe57); đợt 137 chạy không kẹt trên boot 17db9652; đợt 139 chạy không kẹt trên boot 541524e2; đợt 141 kẹt 1/7 lần chạy trên boot 2c0efe57.
- Vite server còn sống lúc kẹt? VẪN KHÔNG CÓ BẰNG CHỨNG — cơ chế kiểm đã sẵn sàng (watchdog probe vite-HTTP + diag script, giờ qua đường ổn định), nhưng watchdog không nổ nên không kiểm được; driver gọi diag với devUrl rỗng nên vite-HTTP bị bỏ qua cả lúc timeout.
- Tải từ luồng song song khác trong cửa sổ kẹt? Load1 trong lúc kẹt 0,05–1,79 (sampler 30 s); T4 attempt1 đã xong từ 20:46:41Z, trước khi harness chạy — không có luồng nặng nào khác trong cửa sổ kẹt (load5 ~0,5–0,9 lúc kẹt, thấp).

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh — nay có mẫu thứ 4.
- Yếu tố chung duy nhất đã chứng minh: cả bốn đều là `page.evaluate` chờ trạng thái media element không trả, ngay sau một bước PASS, process idle, không verdict FAIL.
- **4 bước kiểm GIỮ NGUYÊN cho đợt sau, không cần triển khai lại** — TRỪ đề xuất §9.1 (wrap toàn bộ evaluate + driver canh im lặng live; cần quyết parent). Chỉ lưu ý: symlink `t8-diag-stall.sh` hiện trỏ `round141-t8/diag-stall-141t8.sh` — đợt sau nhớ trỏ lại; nếu quên, dump sẽ rơi vào dir đợt 141.
- Đề xuất nhỏ cho đợt sau (không cần quyết parent — chẩn đoán-only, nhắc lại từ đợt 137): tăng N đối chứng Chromium lên 2 lần mỗi pha nếu thời gian cho phép (cộng dồn N=3 → N=5 sau 1 đợt chạy được nữa), để baseline Chromium dày hơn trước khi kết luận gì về H3.

## B7. Bằng chứng mới từ đợt 141 — KẸT THỨ 4 + WATCHDOG KHÔNG NỔ

- 7 lần chạy: WebKit 85m4 PASS; WebKit 84l10 attempt1 FAIL (flaky) + retry PASS; WebKit 86n2 TIMEOUT 124 (kẹt P4-lần2); Chromium 3/3 PASS.
- 0 WATCHDOG-137 trong kẹt thật 13,7 phút — lần đầu watchdog được thử bằng kẹt thật và không nổ; lỗ phủ đã xác định trong code (evaluate trần vòng P4).
- Sampler ghi được balloon TRONG lúc kẹt lần đầu: phồng 5,29→6,16 GB, RAM 990→290 MB, load1 0,05–0,2.
- Bước 4 post-mortem: ps.txt rỗng, dmesg EPERM, journalctl rỗng, vite-HTTP bị bỏ qua.
- 84l10 FAIL oan (seeking kẹt ở ct=0.4 lúc setup) + retry PASS — cùng họ seeking/media, ghi riêng khỏi đếm kẹt.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round141-t8-viteharness.txt` — **1 file** (chỉ text, 0 binary): LIMITS này. 3 script harness md5 không đổi so với đợt 139/140 nên không stage lại. Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round141-t8/` (wait-t4-t5-141t8.sh — deadline gõ tay 22:30Z, KHÔNG fallback cờ cũ, boot 2c0efe57; run-webkit-141t8.sh — Balloon + Chromium + diag-khi-124, ĐÃ CHẠY (6/6); run-webkit-141t8-retry84l10.sh — ĐÃ CHẠY 1 lần (retry PASS); rebuild-fixtures-141t8.sh — ĐÃ DÙNG sau gate (6/6 md5 khớp); diag-stall-141t8.sh — smoke-test tay OK qua đường ổn định 20:42Z + diag post-mortem 21:10:52Z; watch-gate-141t8.sh — vòng kiểm tay 60 s; smoke/wait-t4-t5.log — GATE-FOUND poll 11 20:52:52Z exit 0; smoke/watch-t8.log — GATE-FOUND poll 10 20:52:13Z exit 0; smoke/stall-smoke-test-1795034558/ (smoke-test tay QUA ĐƯỜNG ỔN ĐỊNH — 10 file, dmesg EPERM + journalctl rỗng); smoke/stall-webkit-86n2-timeout124-1795036252/ (diag post-mortem lúc timeout — 10 file, ps.txt RỖNG); smoke/run-webkit-summary.txt (driver 20:53:00–21:18:20Z, ec webkit 84l10=1 85m4=0 86n2=124; chromium 0/0/0); smoke/run-webkit-retry84l10-summary.txt (retry 21:22:13–21:23:20Z ec=0); smoke/ram-141t8.log (sampler 30 s, có cột balloon_kb — ghi được cả lúc kẹt); smoke/ram-141t8-retry84l10.log; smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/attempt1/ (snapshot 6 log); smoke/attempt2/ (snapshot retry); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai); smoke/baseline-dmesg-tail50.txt + baseline-journalctl-k.txt + baseline-meminfo.txt). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round141-t8/diag-stall-141t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild sau gate (round76-d8, round81-i7, l10, m4, n2 — 6/6 md5 khớp).
