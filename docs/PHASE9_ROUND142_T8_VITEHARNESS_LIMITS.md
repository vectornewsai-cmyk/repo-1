# Đợt 142 T8 — VÁ WATCHDOG (quyết parent (e) đợt 141) + HARNESS 6/6

Ngày: 19/11/2026 (lượt cron 06:35 +07 = 23:35:51Z 18/11; T8 mở ~23:39Z trên boot `bde599df`, REBOOT giữa lúc chờ gate → boot `9afdaa89` btime 23:54:20Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: VÁ WATCHDOG theo đúng quyết parent (e) đợt 141 + chạy harness 6/6 theo quy trình (gate MỞ thì chạy; gate KHÔNG MỞ thì ghi rõ + exit — brief đợt 141). KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG tự cài apt, KHÔNG sửa preview.tsx, KHÔNG can thiệp host lấy dmesg.
Nợ: docs/PHASE9_ROUND141_T8_VITEHARNESS_LIMITS.md (GATE MỞ, 7 lần chạy: 86n2 WebKit TIMEOUT 124 kẹt thật thứ 4; watchdog 0 kích hoạt — lỗ phủ evaluate trần P4).

## 0. Kết luận ngắn — VÁ XONG, HARNESS 6/6 PASS, 0 KẸT (WATCHDOG CHƯA ĐƯỢC THỬ BẰNG KẸT THẬT)

- **Vá watchdog: XONG, kiểm chứng 3/3 script PASS** (xem §A): 102 evaluate trần đã wrap qua `ev()` → `evalDiag137` (84l10: 31, 85m4: 34, 86n2: 37); `node --check` 3/3 OK; smoke-test logic `ev()` PASS (fast-path 0 WATCHDOG, hang-path WATCHDOG nổ đúng label stack); diag-stall smoke-test 10/10 file qua đường ổn định; vòng canh mtime driver test PASS (nổ 2 lần đúng ngưỡng thu nhỏ). KHÔNG revert script nào.
- **Gate MỞ 00:29:41Z (waiter poll=29 / watch poll=29):** T4 lượt yên #18 HỢP LỆ ở attempt3 (20/20, median 49,0 ms, lớp B 5/5; a1+a2 20/20 nhưng B2 vi phạm — việc T4); `POSTBOOT_PASS` mới cho boot `9afdaa89` (pass_at 00:00:22Z, poll=3). T8 CHẠY 6/6, KHÔNG retry.
- **Harness 6/6 PASS, exit 0 toàn bộ (00:30:32–00:46:19Z):** WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2 — KHÔNG FAIL, KHÔNG kẹt, KHÔNG retry. 86n2 WebKit qua P4-lần2 (điểm kẹt đợt 141) trong 1,3 s đồng bộ + PASS.
- **Watchdog: 0 kích hoạt — vì 0 kẹt (F-142-T8-2):** 0 dòng `WATCHDOG-137` trong 6 log, 0 lần `LIVE-DIAG-142`, 0 dir dump live mới (chỉ có dir smoke-test). Bài kiểm thật đầu tiên của bản vá CHƯA XẢY RA (không có kẹt thật để thử); bản vá mới chỉ được kiểm chứng bằng smoke-test + 6 lần chạy sạch (xem §B).
- **Cây: preview.tsx `530e10a7` (GIỮ VĨNH VIỄN), media.ts `2c384ed1`, vite.config.ts `ee80d093`; 3 script harness md5 MỚI (đã vá): 84l10 `b8c08a7c`, 85m4 `610ee003`, 86n2 `628088bd`.**

## A. Vá watchdog — chi tiết (quyết parent (e) đợt 141)

### A1. Điểm (i): wrap TOÀN BỘ `page.evaluate` bằng `evalDiag137`

- Cơ chế: thêm hàm `ev(page, fn)` ngay sau `evalDiag137` trong cả 3 script; `ev()` lấy label từ stack trace (tên hàm + số dòng nơi gọi, vd `setupProject:204`, `waitForNotSeeking:283`) rồi gọi `evalDiag137(page, fn, site)`. Mọi evaluate (setup/startPlaying, vòng P4, `waitForNotSeeking`, `sampleFor`, mount...) giờ đều được canh 60 s như `waitForPlaySync`/`sampleFor` trước đây.
- Cách vá: script `hidden_files/round142-t8/patch-watchdog-142t8.py` thay thế chuỗi `page.evaluate(` → `ev(page, ` trên mọi dòng NGOÀI thân hàm `evalDiag137` (thay thế thuần túy, không đụng dấu ngoặc — không rủi ro phá nesting). Backup pre-vá: `/tmp/84l10-pre142.mjs`, `/tmp/85m4-pre142.mjs`, `/tmp/86n2-pre142.mjs` (chỉ để đối chiếu, không stage).
- Số lượng đã wrap (đếm bằng patcher, đã assert không còn `page.evaluate(` ngoài span):

| Script | Dòng `ev()` chèn sau | Số evaluate wrap | `page.evaluate(` trần còn lại (CỐ Ý) |
|---|---|---|---|
| `clicktest-84l10-webkit-loop-w1.mjs` | sau `evalDiag137` dòng 75–94 | **31** | 2: dòng 76 (`const p = page.evaluate(fn)` trong `evalDiag137`) + dòng 86 (probe 1+1 trong watchdog) |
| `clicktest-85m4-webkit-w7-hb128.mjs` | sau `evalDiag137` dòng 87–106 | **34** | 2: dòng 88 + dòng 98 (như trên) |
| `clicktest-86n2-webkit-w7.mjs` | sau `evalDiag137` dòng 72–91 | **37** | 2: dòng 73 + dòng 83 (như trên) |
| **Tổng** | | **102** | 6 (2/script, đều trong watchdog) |

- Ghi chú đếm: `grep -c 'ev(page, '` = 32/35/38 (tổng 105 dòng) = 102 wrap (31+34+37) + 3 dòng định nghĩa `function ev(page, fn)` (1/file). `grep -c 'evalDiag137(page, '` = 3/4/4 = 1 dòng định nghĩa + 1 dòng `return evalDiag137(...)` trong `ev()` + số gọi trực tiếp có từ trước (84l10: 1, 85m4: 2, 86n2: 2).
- Comment scope cũ ("trong waitForPlaySync/sampleFor") đã sửa thành "BẤT KỲ (đợt 142 mở rộng qua ev())" ở cả 3 file.
- Không đổi verdict, không đổi ngưỡng/timeout harness (60 s watchdog, 900 s timeout giữ nguyên). Không đụng `preview.tsx` / `media.ts` / `vite.config.ts`.

### A2. Điểm (ii): driver canh mtime log — diag live TRƯỚC khi timeout giết process

- `hidden_files/round142-t8/run-webkit-142t8.sh` (adapt từ 141): `run_one` chạy node NỀN (`timeout 900 node ... &`), poll mtime log mỗi 10 s; im lặng >120 s → gọi `diag-stall-142t8.sh live-silence-<phase>-<tag>` với devUrl THẬT (đọc từ `$scratch/dev-url.txt`), tối đa 2 lần/lần chạy, cách nhau ≥240 s. Chẩn đoán-only: không kill, không đổi verdict.
- DevUrl thật: cả 3 script ghi `dev-url.txt` vào SCRATCH ngay sau khi vite sẵn sàng (`DIAG137_DEV_URL = devUrl;` + `writeFileEpermRetry(path.join(SCRATCH, "dev-url.txt"), devUrl + "\n")` — dòng 531/626/648). Driver truyền devUrl này cả cho diag live lẫn diag sau timeout 124 (sửa F-141-T8-3: đợt 141 truyền `""` nên kiểm vite-HTTP bị bỏ qua).
- Ngưỡng 120 s có dự trữ: im lặng hợp lệ dài nhất trong harness ~70 s (vòng W2); nếu diag live nổ oan thì chỉ là dump thừa, ghi rõ `LIVE-DIAG-142` trong summary.
- Retry script `run-webkit-142t8-retry84l10.sh` cũng áp dụng cùng cơ chế (ii).

### A3. Đường diag ổn định + smoke-test

- `hidden_files/t8-diag-stall.sh` đã trỏ lại sang `round142-t8/diag-stall-142t8.sh` (copy từ 141, đổi tên/dir; `bash -n` OK). Smoke-test tay qua đường ổn định lúc ~23:5xZ: dir `smoke/stall-smoke-142t8-1795045644/` — **10/10 file** (README, ps, ps-top-rss, meminfo, free, loadavg, vite-http, dmesg, dmesg-tail100, journalctl-k-tail200).

## B. Kiểm chứng lại 3 script sau khi vá (trước khi chạy harness)

| Kiểm chứng | Kết quả |
|---|---|
| `node --check` 3 script | **3/3 OK** (84l10, 85m4, 86n2) |
| Đếm wrap + assert không còn `page.evaluate(` ngoài span watchdog | **PASS**: 31/34/37 wrap; còn lại đúng 2/script trong watchdog (CỐ Ý) |
| Smoke-test logic `ev()` (`/tmp/ev142-smoke.mjs`, trích `evalDiag137`+`ev` từ file đã vá, timer rút 60000→300 CHỈ trong bản test) | **PASS**: fast-path trả đúng giá trị, 0 dòng WATCHDOG; hang-path WATCHDOG nổ đúng label stack `testHang:23`, probe 1+1 trả 2 (kênh còn sống), diag stub được gọi |
| Smoke-test diag-stall qua symlink ổn định | **PASS 10/10 file** |
| Test vòng canh mtime driver (`/tmp/test-mtime-loop.sh`, ngưỡng thu nhỏ 5 s/2 s/8 s, fake node im 25 s) | **PASS**: live-diag nổ đúng 2 lần (silence 7 s, 15 s), exit code process được giữ nguyên |
| **Kết luận kiểm chứng** | **3/3 script PASS — KHÔNG revert script nào.** Harness chạy sau đây vừa là chạy thường lệ vừa là kiểm chứng chức năng. |

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 23:35:51 18/11 | Lượt cron 06:35 +07 mở đợt 142; `round-in-progress.md` tạo (9 luồng T1–T9 + T10); boot lúc mở `bde599df` (btime ~22:48Z) |
| ~23:39 | T8 mở: RAM avail 715 MB, Balloon 6.087.484 kB |
| ~23:42–00:01 | Vá watchdog (i)+(ii) + kiểm chứng xong (xem §A, §B); tree-md5-open 00:01:04Z |
| 23:54:20 | **REBOOT giữa lúc chờ gate** (`bde599df` → `9afdaa89`, btime 23:54:20Z — xem F-142-T8-1) |
| 00:00:22 | T5 viết `POSTBOOT_PASS` mới cho boot `9afdaa89` (poll=3) |
| 00:00:55 | T4 cửa yên mở poll #8 (RAM 1.170 MB) — chạy attempt1 ngay |
| 00:01:41 | T8 waiter + watch bắt đầu (deadline 02:00Z); postboot=1, chỉ chờ cờ T4 |
| 00:29:41 | **Gate MỞ** — waiter GATE-FOUND poll=29 (t4=OK postboot=OK); watch GATE-FOUND poll=29 | 
| 00:30:09 | Rebuild fixture xong: 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); blend media bền còn nguyên |
| 00:30:32–00:46:19 | Driver `run-webkit-142t8.sh`: 6 lần chạy (xem §2) |
| ~00:48 | Kiểm cuối + LIMITS + stage file + cờ `round142-t8.done` — **T8 đóng** |

## 2. Kết quả 6 lần chạy (6/6 PASS, 0 retry)

| # | Pha | Harness | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|---|
| 1 | WebKit | 84l10 | 0 | 00:30:32–00:31:42 | **PASS** — W1 3/3 (delta +1 mỗi lần), W2 PASS (playhead 30, restart tự nhiên Δ=0), E4 PASS |
| 2 | WebKit | 85m4-hb128 | 0 | 00:31:57–00:34:17 | **PASS** — P1–P5 đủ (P4 3/3 delta +1; P5 40 s 0 restart dư) |
| 3 | WebKit | 86n2 | 0 | 00:34:33–00:38:33 | **PASS** — P1–P6 đủ (P4-lần2 PASS — điểm kẹt đợt 141; P6 KHÔNG-KẸT 90 s) |
| 4 | Chromium | 84l10 | 0 | 00:38:48–00:39:58 | **PASS** — W1 3/3, W2 PASS, E4 PASS (W1-lần2 delta=+2 là artifact ghi đè ended, đã biết) |
| 5 | Chromium | 85m4-hb128 | 0 | 00:40:13–00:42:14 | **PASS** — P1–P5 đủ |
| 6 | Chromium | 86n2 | 0 | 00:42:29–00:46:19 | **PASS** — P1–P6 đủ (P4 3/3; P6 KHÔNG-KẸT 90 s) |

- 6 report JSON đều `ok=true`. 84l10 WebKit W1 delta đúng +1 cả 3 lần (sạch hơn Chromium lần2 +2 do artifact ghi đè — không phải regression, xem script comment forceOnce).
- 86n2 WebKit P4-lần2: đồng bộ sau 1,3 s (playhead=0.933, ct=1), PASS delta=+1, ct=2.133 — trái ngược hoàn toàn đợt 141 (im lặng 13,7 phút sau P4-lần1 PASS).

## 3. Watchdog trong lượt này — bài kiểm thật đầu tiên của bản vá CHƯA XẢY RA (0 kẹt)

- **0 kẹt thật đợt này** nên cả hai lớp watchdog mới đều không có dịp nổ: 0 dòng `WATCHDOG-137` trong 6 log lần chạy (grep toàn bộ `run-*.log` = 0); 0 dòng `LIVE-DIAG-142` trong summary; 0 dir `stall-live-*` / `stall-*-timeout124-*` mới (chỉ có dir smoke-test `stall-smoke-142t8-1795045644/`).
- **Vòng canh mtime đã chạy thật trên cả 6 lần chạy:** mỗi `run_one` poll mtime 10 s/lần trong suốt lần chạy (tổng ~16 phút chạy, `live_diags=0` cả 6 lần) — không false-positive nào dù W2 im lặng tới ~70 s và P5/P6 chờ 40–90 s (ngưỡng 120 s đủ dự trữ như tính toán). `dev-url.txt` được ghi đúng cả 6 scratch (vd `l10-scratch/dev-url.txt` = `http://127.0.0.1:5390/`) — đường truyền devUrl cho diag live đã sẵn sàng, chỉ chưa có dịp dùng.
- **Kết luận:** bản vá (i)+(ii) đã triển khai đúng + chạy sạch qua 6/6 lần chạy, nhưng **CHƯA được kiểm chứng bằng kẹt thật** — đừng trích "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo (nếu có) mới là bài kiểm thật đầu tiên.

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142) + đường ổn định `t8-diag-stall.sh` | 6 lần chạy, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật.** Smoke-test `ev()` PASS trước lượt; 6 lần chạy sạch (xem §3) |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142) | 6 lần chạy, poll 10 s/lần, `live_diags=0` cả 6 | **Chạy đúng, 0 false-positive.** `dev-url.txt` ghi đủ 6 scratch — đường devUrl sẵn sàng |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-142t8.sh` (cột `balloon_kb`) | Driver chạy → có `ram-142t8.log` đầy đủ (n=32 mẫu) | Balloon 5.009.336–5.687.344 kB trong lúc chạy; RAM avail 581–1.702 MB (xả bền so với đợt 141, xem F-142-T8-2) |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **3/3 pha PASS** | N cộng dồn **N=4 mỗi pha** (đợt 137 N=1 + đợt 139 N=1 + đợt 141 N=1 + đợt 142 N=1; đợt 138/140 N=0) — Chromium 86n2 P4 3/3 + P5 + P6 PASS |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (giờ truyền devUrl thật) + baseline lúc bắt đầu | 0 lần kẹt → không kích hoạt | Baseline đã lưu: dmesg EPERM tái xác nhận; journalctl -k `-- No entries --`. Cơ chế (ii) + devUrl thật chưa có dịp dùng |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không (fix GIỮ vĩnh viễn) |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c (đã vá) | b8c08a7c | Vá watchdog (i) — 31 wrap + ev() + dev-url.txt |
| `clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 (đã vá) | 610ee003 | Vá watchdog (i) — 34 wrap + ev() + dev-url.txt |
| `clicktest-86n2-webkit-w7.mjs` | 628088bd (đã vá) | 628088bd | Vá watchdog (i) — 37 wrap + ev() + dev-url.txt |

- Fixture: rebuild sau gate, 6/6 md5 khớp đợt 125 (ba0c7c62 / f05daed8 / fbaa3d1a ×3 / a1fb8549); blend media bền còn nguyên (f1e277f0 / f4c35a6a).
- Không sửa code app, không sửa script harness sau khi vá nên không có file production nào khác trong batch stage ngoài LIMITS này + 3 script đã vá.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver đã dọn Xvfb `:199` của mình (trap EXIT + unlink socket/lock); RAM sampler nền đã kill cả nhóm; lock `t8-round142` đã nhả sau mỗi lần chạy (giữ 230 s ở lần cuối).
- Kiểm cuối 00:47:45Z: 0 process Xvfb/vite/MiniBrowser/WebKit/Chromium; `/tmp/.X11-unix/` TRỐNG (socket `X193` sót từ đợt 141 đã biến mất theo reboot 23:54Z — xem F-142-T8-3); không có `/tmp/.X199-lock`; không có `vite.lock` trong repo; không lock `t8-round142` nào được giữ.
- Không kiểm lại TTS 39; không thử birefnet (RAM cao nhất lúc chạy ~1.702 MB lúc sampler — xa guard 6.144 MiB; u2net là fallback chính thức); không tự cài apt; không push. Không append vào `build-loop-log.md` (parent ghi).

## 7. Giới hạn — đọc trước khi trích số

1. **Bản vá là chẩn đoán-only:** không đổi verdict, ngưỡng hay timeout nào của harness. Mọi kết quả PASS/FAIL đợt này vẫn theo logic cũ; chỉ khác là mọi evaluate đều được canh + driver canh im lặng.
2. **Watchdog vẫn chưa chứng minh nếu đợt này 0 kẹt:** kiểm chứng trên chỉ là smoke-test + chạy thường lệ. Chỉ khi có kẹt thật mà watchdog nổ (log WATCHDOG-137 / diag live) thì mới gọi là "đã kiểm chứng bằng kẹt thật".
3. **"0 WATCHDOG" đợt này KHÔNG có nghĩa "watchdog đã kiểm chứng xong".** Có 0 kẹt thật để thử — đừng trích bản vá là "đã qua bài kiểm thật". Nó mới chỉ qua smoke-test + 6 lần chạy sạch.
4. **Balloon đợt này XẢ BỀN (khác đợt 141):** balloon 5,01–5,69 GB trong lúc chạy harness (avail 581–1.702 MB), không phồng lại về ~6,16 GB như đợt 141; RAM lúc gate mở 1.170–2.232 MB. Đừng trích một con số RAM "lúc chạy" làm đại diện.
5. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — tăng từ 37.903 B do vá `ev()`; lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.

## 8. Sai số mới (F-142-T8-N)

- **F-142-T8-1 — REBOOT giữa lúc chờ gate (`bde599df` → `9afdaa89`, btime 23:54:20Z):** T8 mở trên boot `bde599df` (~23:39Z, RAM 715 MB, balloon 6.087.484 kB); lúc ghi tree-md5-open 00:01:04Z boot đã là `9afdaa89`. T5 đã viết lại `POSTBOOT_PASS` mới cho boot mới (pass_at 00:00:22Z, poll=3); T4 poll #8 00:00:55Z trên boot mới thấy gate0 PASS + gateA (RAM 1.170 MB) và chạy attempt1 ngay. T8 chỉ ghi lại, không tự kết luận số hiệu reboot/khung chết — việc T2/T6. Vá watchdog không bị ảnh hưởng (file trên đĩa bền qua reboot; fixture /tmp đã mất từ trước, rebuild sau gate như thường lệ).
- **F-142-T8-2 — 0 kẹt đợt này, chuỗi "P3 không kẹt" 0 → 1:** 6/6 lần chạy, 0 kẹt, 0 FAIL (khác đợt 141: 1 kẹt + 1 FAIL oan). 86n2 WebKit P4-lần2 PASS nhanh (đồng bộ 1,3 s) — điểm kẹt đợt 141 không tái hiện. Balloon xả bền trong lúc chạy (5,01–5,69 GB; avail 581–1.702 MB) thay vì phồng lại như đợt 141 — tương quan ghi nhận, không kết luận nhân quả (H2 vẫn KHÔNG ỦNG HỘ).
- **F-142-T8-3 — socket `X193` sót đợt 141 đã biến mất theo reboot:** `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối 00:47:45Z (reboot 23:54Z xóa /tmp). Không còn socket sót nào của T8 hay luồng khác trong dir này. Không phải hành động dọn của T8 — chỉ ghi lại.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Điều tra kẹt chung VẪN MỞ** (H1 BÁC BỎ, H2 KHÔNG ỦNG HỘ, H3 VẪN MỞ) — T8 chỉ giám sát thụ động; quyết đóng/mở lại là việc parent. Điều tra (c2) GIỮ ĐÓNG.
2. **Chuỗi "P3 không kẹt" đếm lại từ 0** (đứt ở đợt 141): đợt này 0 kẹt thì +1.
3. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử khi available ≥ 6.144 MiB (u2net là fallback chính thức); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm.

---

# PHẦN B — Điều tra chung các lần kẹt "treo không trả mẫu" — CẬP NHẬT ĐỢT 142

## B1. Trạng thái giả thuyết sau đợt 142

| Giả thuyết | Trạng thái đợt 141 | Trạng thái đợt 142 | Thay đổi |
|---|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** | Đợt này 0 kẹt dù RAM avail xuống 581 MB trong lúc chạy (thấp hơn lúc kẹt đợt 141 bắt đầu ~687 MB) — không có ngưỡng RAM tuyệt đối nào phân tách kẹt/pass |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** | 0 kẹt đợt này nên không có mẫu mới; balloon xả bền (không phồng lại như đợt 141) chỉ là tương quan |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ (chưa chứng minh) | **VẪN MỞ (chưa chứng minh)** | 0 kẹt đợt này — không thêm mẫu nào; bản vá watchdog (i)+(ii) đã sẵn sàng để bắt bằng chứng live ở lần kẹt sau |

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 142

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142) + đường ổn định `t8-diag-stall.sh` | 6 lần chạy, 0 kẹt → 0 kích hoạt | **Chưa thử bằng kẹt thật.** Smoke-test `ev()` PASS; 6 lần chạy sạch |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142) | 6 lần chạy, `live_diags=0` cả 6 | Chạy đúng, 0 false-positive; `dev-url.txt` đủ 6 scratch |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | Driver chạy → có `ram-142t8.log` (n=32) | Balloon 5,01–5,69 GB, RAM avail 581–1.702 MB trong lúc chạy |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **3/3 pha PASS** | N cộng dồn **N=4 mỗi pha** (đợt 137/139/141/142 mỗi đợt N=1; đợt 138/140 N=0) |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | CƠ CHẾ SẴN SÀNG (driver gọi khi exit 124, giờ truyền devUrl thật) | 0 lần kẹt → không kích hoạt | Baseline: dmesg EPERM tái xác nhận; journalctl -k rỗng |

## B3. Chữ ký kẹt — không đổi (xem LIMITS đợt 137 §B3 + đợt 141 §B3)

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 142: 6 LẦN CHẠY, 0 KẸT (CHUỖI 0 → 1)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL** (không retry). Chuỗi "P3 không kẹt" **0 → 1**.
- Bốn lần kẹt vẫn là: đợt 134/135 (3 lần) + đợt 141 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=4 mỗi pha, 0 kẹt).

## B5. Yếu tố chung khác — đợt 142: không có yếu tố chung mới (0 kẹt). Reboot giữa lúc chờ gate (bde599df → 9afdaa89, btime 23:54:20Z) xảy ra TRƯỚC khi harness chạy — không ảnh hưởng lần chạy nào; T4 ghi "reboot #26? do T2 chốt" (số hiệu chờ T2 xác nhận). Vite server còn sống lúc chạy: cả 6 lần chạy đều tới được `vite dev sẵn sàng` + `dev-url.txt` ghi đủ — không có bằng chứng vite chết đợt này (nhưng cũng không có kẹt để kiểm vite-HTTP lúc kẹt).

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ. H2: KHÔNG ỦNG HỘ. H3: VẪN MỞ, giả thuyết khả dĩ nhất, chưa chứng minh.
- **Bản vá watchdog đợt 142 là bước kiểm mới nhất**: nếu đợt này (hoặc đợt sau) có kẹt thật mà watchdog (i) và/hoặc (ii) nổ, đó sẽ là bằng chứng live đầu tiên về trạng thái browser lúc kẹt (ps/RSS, vite-HTTP, probe 1+1).

## B7. Bằng chứng mới từ đợt 142 — VÁ WATCHDOG XONG, 0 KẸT ĐỂ THỬ

- 6 lần chạy: WebKit 84l10/85m4/86n2 + Chromium 84l10/85m4/86n2, toàn bộ PASS exit 0, 0 FAIL oan (khác đợt 141).
- Vá (i): 102 evaluate trần đã wrap qua `ev()` → `evalDiag137` (31/34/37); kiểm chứng 3/3 script PASS (`node --check`, smoke-test `ev()`, 6 lần chạy sạch) — KHÔNG revert.
- Vá (ii): driver canh mtime log >120 s → diag live (tối đa 2 lần/lần chạy) đã chạy đúng trên cả 6 lần chạy, 0 false-positive, 0 kích hoạt (vì 0 kẹt); `dev-url.txt` ghi đủ 6 scratch.
- 0 WATCHDOG-137 trong 6 log — nhưng đây là 0 kẹt, không phải "watchdog đã kiểm chứng xong". Lần kẹt thật tiếp theo mới là bài kiểm thật đầu tiên của bản vá.
- Sampler: balloon 5,01–5,69 GB, RAM avail 581–1.702 MB trong lúc chạy (xả bền, khác đợt 141 phồng lại).
- Reboot giữa lúc chờ gate (`bde599df` → `9afdaa89`, btime 23:54:20Z; T4 ghi "reboot #26? do T2 chốt" — số hiệu chờ T2 xác nhận); `/tmp/.X11-unix/` trống sau reboot (socket X193 sót đợt 141 đã mất).

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round142-t8-viteharness.txt` — **4 file** (chỉ text, 0 binary): LIMITS này (25.219 B) + 3 script harness đã vá (84l10 32.680 B, 85m4 37.111 B, 86n2 39.194 B — 86n2 oversize >37.768 B, lúc push cần `ENABLE_PRIVSEP=0`). Đã verify read-back bằng `od -c` (NUL-delimited). Dữ liệu thô: `hidden_files/round142-t8/` (patch-watchdog-142t8.py — ĐÃ CHẠY, wrap 31/34/37; adapt-142t8.py — ĐÃ CHẠY; diag-stall-142t8.sh — smoke-test tay OK + chưa có dịp dùng thật; run-webkit-142t8.sh — ĐÃ CHẠY 6/6; run-webkit-142t8-retry84l10.sh — KHÔNG DÙNG (không cần retry); rebuild-fixtures-142t8.sh — ĐÃ DÙNG sau gate (6/6 md5 khớp); wait-t4-t5-142t8.sh — GATE-FOUND poll=29 00:29:41Z exit 0; watch-gate-142t8.sh — GATE-FOUND poll=29 00:29:41Z; smoke/wait-t4-t5.log + smoke/watch-t8.log; smoke/stall-smoke-142t8-1795045644/ (smoke-test tay QUA ĐƯỜNG ỔN ĐỊNH — 10 file, dmesg EPERM + journalctl rỗng); smoke/run-webkit-summary.txt (driver 00:30:32–00:46:19Z, ec webkit 0/0/0; chromium 0/0/0); smoke/ram-142t8.log (sampler 30 s, n=32, có cột balloon_kb); smoke/run-webkit-*.log + smoke/run-chromium-*.log (6 log lần chạy); smoke/attempt1/ (snapshot 6 log); smoke/tree-md5-open.txt + smoke/tree-md5-close.txt (530e10a7 cả hai; 3 script b8c08a7c/610ee003/628088bd cả hai); smoke/baseline-dmesg-tail50.txt + baseline-journalctl-k.txt + baseline-meminfo.txt). Symlink ổn định: `hidden_files/t8-diag-stall.sh` → `round142-t8/diag-stall-142t8.sh` (ngoài repo, KHÔNG stage). Fixture `/tmp` đã rebuild sau gate (round76-d8, round81-i7, l10, m4, n2 — 6/6 md5 khớp).
