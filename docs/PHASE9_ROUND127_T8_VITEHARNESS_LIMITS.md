# Đợt 127 T8 — Vite harness webkit 84l10/85m4/86n2: 2/3 exit 0, 85m4 timeout (boot #72 → #73)

Ngày: 17/11/2026 (lượt cron 09:35 +07; làm 02:40–03:34Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb).
Phạm vi: CHỈ chạy lại 3 harness webkit + fixture khôi phục + kiểm mirror + tsc/vite build + LIMITS này. KHÔNG sửa production (`preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` — khớp đúng số đợt 124/125/126, không động trước/sau), KHÔNG sửa harness nào, KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet. KHÔNG tự cài apt — hạ tầng WebKit do T5 sở hữu, T8 chỉ chờ T5 sửa xong rồi chạy lại.
Nợ: docs/PHASE9_ROUND126_T8_VITEHARNESS_LIMITS.md §7 mục 1 (84l10/85m4/86n2 nhánh webkit — theo quyết parent đợt 126, nhóm 7 EXIT:2 đã pass cả hai nhánh đợt 125/126 nên đây là chạy lại kiểm chứng trên boot mới, không phải nợ tồn). Kết quả: 84l10 + 86n2 ĐÃ PASS lại trên boot #73; 85m4 CHƯA CÓ kết quả đầy đủ — nợ chuyển đợt sau.

## 0. Hai boot trong một đợt — #72 rồi #73

- Lượt mở trên boot **#72** (boot_id `81464315-ba1a-460d-b370-92a1673accc1`, btime 02:10:17Z 17/11; `stat /proc/1` 02:10:28Z — chênh 11 s, cùng mẫu các boot trước).
- Giữa đợt, máy **reboot lần nữa → boot #73** (boot_id `5e522260-235e-4394-a888-bce604728204`, btime 03:04:25Z theo T5; `stat /proc/1` 03:04:36Z — chênh 11 s; uptime 6 phút lúc 03:11:24Z). Reboot xảy ra đúng lúc T5 bắt đầu repair (03:04:31Z) — xem §4.
- `/tmp` bị xóa theo mỗi reboot: fixture phải tạo lại 2 lần (boot #72 lúc 02:41, boot #73 lúc 03:12). Không mất file trên đĩa bền (`/home/hatch`). RAM khả dụng dao động 521 MB–1.637 MB lúc mở, xuống ~325–361 MB lúc 85m4 kẹt (xem §5), ~952 MB cuối đợt — dưới guard 6 GB, birefnet không thử (đúng luật).

## 1. Kết luận ngắn

- **84l10 nhánh WEBKIT — exit 0, KHÔNG FAIL (boot #73):** W1-lần1/2/3 PASS, W2 PASS, E4 PASS (67 s giữ lock, 03:12:33–03:13:40Z).
- **86n2 nhánh WEBKIT — exit 0, KHÔNG FAIL (boot #73):** P1–P5 PASS, P6 KHÔNG-KẸT (232 s, 03:29:11–03:33:03Z).
- **85m4 nhánh WEBKIT — exit 124, KHÔNG CÓ kết quả đầy đủ:** bị driver `timeout 900` kill lúc 03:28:55Z sau 15 phút. P1 PASS, P2 PASS (reset xong 705 ms), rồi **kẹt ở P3, không thêm một dòng log nào từ 03:14:45Z tới lúc bị kill**; report JSON chỉ có P1/P2. 86n2 chạy ngay sau đó bình thường (đồng bộ 0,8–1,9 s) nên kẹt này là cục bộ theo lượt chạy, không phải trạng thái máy kéo dài — nhưng nguyên nhân kẹt chưa chứng minh được (xem §5).
- **Boot #72: 0/3 ở cả 2 lần chạy (attempt 1 lúc 02:42 + retry 1 lúc 02:56)** — MiniBrowser không khởi động nổi vì thiếu thư viện hệ thống (loader error: attempt 1 `libevent-2.1.so.7`, retry 1 `libavif.so.16`; exit 1 sau ~2 s mỗi harness). Không phải lỗi harness hay lỗi sản phẩm — hạ tầng boot #72 thiếu gói WebKit/GST (xem §2–§4).
- **Fixture `/tmp` tạo lại 2 lần — md5 khớp đủ 32 ký tự đợt 126 (cả 4 file):** hevc-a `ba0c7c623901a9a7b428ea664f1fff53`, i7-clip `f05daed87b2eb12bc15c9dbf0835e931`, h-30s `fbaa3d1a5b32301c78a07221315382c0`, g-4s `a1fb8549165c526cf89b69e6cdcfeba3`; m4/n2 là copy byte-identical của h-30s. Blend media bền qua cả 2 reboot: `blend-tp-ocean-a50.mp4` 881.516 B (md5 `f1e277f0…`), `blend-tp-slov-a085.mp4` md5 `f4c35a6a…` — khớp số đợt 125/126.
- **Mirror còn nguyên sau cả 2 reboot:** 25/25 file mirror L8 khớp `md5_after` trong `round122-t8/edit-log.json`, 0 đổi 0 mất (kiểm 2 lần: boot #72 và boot #73). **Kiểm kê toàn repo: 237 file ứng viên, 0 mới, 0 mất** so với đợt 126 (diff 0 dòng); **201/201 harness vite dev đã phủ mirror** (199 tự ghi + 2 thừa hưởng 65r8/82j3; `has_ignored`=200 gồm 199 harness + 1 file config `vite.n3.config.mjs`).
- **tsc-web exit 0, vite build exit 0 — chạy 2 lần (mỗi boot một lần):** boot #72: tsc 27 s, vite built 9,21 s; boot #73: tsc 19 s, vite built 6,93 s.

## 2. Chẩn đoán attempt 1 (boot #72): MiniBrowser thiếu thư viện hệ thống

Lỗi loader trong log 84l10 attempt 1 (02:42:05Z):
`MiniBrowser: error while loading shared libraries: libevent-2.1.so.7: cannot open shared object file` (exitCode=127). Cả 3 harness cùng lỗi, cùng chết sau ~2 s — vite dev đã sẵn sàng, browser không launch nổi.

Kiểm chứng độc lập sau đó:
- `ldconfig -p`: chỉ có `libevent_core-2.1.so.7`, không có `libevent-2.1.so.7` (gói `libevent-2.1-7t64` chưa cài).
- `ldd` MiniBrowser: 22 mục `not found` nếu chạy trần. Nhưng Playwright khi launch tự thêm `minibrowser-gtk/lib` (5 file: webkitgtk, javascriptcore, injectedbundle) + `minibrowser-gtk/sys/lib` (120 file hệ thống đóng gói: libgtk-4, libsoup, libmanette, libenchant, libjxl, libgraphene, gstreamer…) vào `LD_LIBRARY_PATH` — kiểm bằng `LD_LIBRARY_PATH=lib:sys/lib ldd` thì chỉ còn **4 mục thiếu thật: `libavif.so.16` (×2), `libEGL.so.1`, `libevdev.so.2`** — đúng 3 lib T5 liệt kê thiếu ở postboot check.
- T5 postboot boot #72 (try1, 02:42Z): FAIL libs thiếu `libevent-2.1.so.7 libEGL.so.1 libavif.so.16 libdw.so.1 libevdev.so.2`; FAIL GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` không tồn tại, 0 file plugin; FAIL apt: chưa cài `libevent-2.1-7t64 gstreamer1.0-plugins-base/good/bad/ugly/gl/libav/x libavif16 libgstreamer1.0-0 libevdev2`. T5 kết luận "CHUA DU — chờ apt replay xong rồi chạy lại".
- Xvfb `:197` lên bình thường (log chỉ có warning xkbcomp không fatal). Lock v2: TRỐNG, 0 ticket lúc chạy — không phải tranh lock.

## 3. Replay boot #72 kết thúc giữa chừng + retry 1 (02:56Z)

- Replay hệ thống boot #72 khởi động muộn 02:35:39Z: `apt-get update` 02:35–~02:46Z (partial 26→56), installs 02:47–02:48:06Z (**48 gói, gói cuối `gstreamer1.0-tools`**), wrapper pid 821 CHẾT 02:48:06Z, 0 apt/dpkg sau đó. GST chỉ có 2 file (`libgstcoreelements.so`, `libgstcoretracers.so`).
- Theo quyết định repair của T5 (`round127-t5/t5-repair-decision.md`): lists `noble` gốc không về (8 file kẹt ở `partial/`; chỉ updates/security/backports đủ) nên các gói chỉ có ở noble (bad, ugly, libav, libavif16, libevdev2) "no installation candidate"; kể cả gói resolvable (plugins-base) cũng FAIL do dep closure cần noble. Đây là dạng (A) "tới nhưng thiếu GST", giống #58.
- **Retry 1 (02:56:00–02:56:35Z, cùng driver, Xvfb :197): 0/3, exit 1 sau ~2 s mỗi harness.** Loader error chuyển sang `libavif.so.16` (đã qua được libevent nhờ replay cài `libevent-2.1-7t64` + `libgstreamer1.0-0`, nhưng libavif vẫn thiếu). Đây là bằng chứng tiến triển từng bước của loader, không phải fail mới.
- Lưu ý ghi chép: driver viết log từng harness ra tên file cố định nên **log attempt 1 bị retry 1 ghi đè**; summary attempt 1 chỉ còn trong run record (84l10 exit=1 02:42:05, 85m4 exit=1 02:42:22, 86n2 exit=1 02:42:38, loader error libevent). Từ retry 1 trở đi log được snapshot vào `smoke/retry1/` và `smoke/attempt3/` trước mỗi lần chạy lại.

## 4. T5 repair + reboot #73 + POSTBOOT_PASS (03:04–03:11Z)

- T5 watcher poll 10 (03:04:30Z): **TRIGGER=YES** (dạng §8.2 (A)); T5 ghi quyết định repair, bắt đầu repair 03:04:31Z (PID 18652).
- **Reboot #73 xảy ra xen giữa (btime 03:04:25Z)** — repair trên boot #72 bị cắt; replay mới trên boot #73 khởi động 03:05Z (wrapper pid 772, `apt-get update`), installs chạy tới 03:09:05Z (dpkg last_line 03:09:05, last_install=installed).
- T5 watcher b73: poll 2 lúc 03:11:16Z ghi **FLAG_WRITTEN `round127-t5/POSTBOOT_PASS`**, `WATCHER_END reason=done_pass_stable_2polls`. Postboot try1 b73: PASS libs (đủ libevent/libEGL/libavif/libdw/libevdev), GST là thư mục thật với **269 file plugin** (bằng debroot=269), PASS GST (đủ isomp4 + libav), PASS apt (đủ 11 package WebKit/GST) → "DU DIEU KIEN chay WebKit".
- T8 tự kiểm lại lúc 03:11Z: `ldconfig` có đủ libavif/libEGL/libevdev; GST 269 file gồm `libgstisomp4.so`, `libgstlibav.so`, `libgstapp.so`. **T8 không chạy apt, không sửa gì ở tầng hệ thống** — toàn bộ việc sửa hạ tầng là của T5; T8 chỉ chờ cờ POSTBOOT_PASS rồi chạy lại harness.
- Lưu ý: lúc 03:05:11Z (giữa lúc reboot/replay) T8 đo được thư mục GST "không tồn tại" — trạng thái thoáng qua trong lúc replay, không phải kết luận; lúc 03:07Z thư mục đã có lại đầy đủ.

## 5. Attempt 3 (boot #73) — 2/3 exit 0, 85m4 timeout 900 s

Driver: `hidden_files/round127-t8/run-webkit-127t8.sh` (Xvfb mới `:197` + `GST_PLUGIN_PATH` + `GST_PLUGIN_SYSTEM_PATH` = `/usr/lib/x86_64-linux-gnu/gstreamer-1.0`; mỗi harness acquire lock v2 riêng `t8-round127` rồi nhả ngay). Tổng hợp `smoke/run-webkit-attempt3-summary.txt`, log từng harness `smoke/run-webkit-<tag>.log` (+ snapshot `smoke/attempt3/`), scratch riêng `round127-t8/<tag>-scratch/`.

| Harness | Lock giữ | Thời gian | Kết quả |
|---|---|---|---|
| 84l10 `clicktest-84l10-webkit-loop-w1.mjs` (L10_ENGINE=webkit) | 67 s | 03:12:33–03:13:40Z | **exit 0, KHÔNG FAIL** — W1-lần1/2/3 PASS (đồng bộ 1,9/1,7/1,3 s; restartEndedVideo 0→1→2→3, hạ-cánh-về-target=true, errors=0), W2 PASS (playhead cuối=30, restart tự nhiên Δ=0), E4 PASS (tới cuối, ct cuối=4, ended=true) |
| 85m4 `clicktest-85m4-webkit-w7.mjs` (M4_ENGINE=webkit) | 900 s (timeout kill) | 03:13:55–03:28:55Z | **exit 124, CÓ FAIL (timeout)** — P1 PASS (đồng bộ 0,6 s; ép ended restart 0→1, fired=true; 0 restart dư), P2 PASS (reset xong 705 ms; 0 restart dư), rồi **kẹt ở P3: không một dòng log nào từ 03:14:45Z tới lúc bị kill**; report JSON chỉ có P1/P2; lỗi cuối chỉ là `page.evaluate: Target page, context or browser has been closed` do kill |
| 86n2 `clicktest-86n2-webkit-w7.mjs` (N2_ENGINE=webkit) | 232 s | 03:29:11–03:33:03Z | **exit 0, KHÔNG FAIL** — P1 PASS (đồng bộ 0,8 s), P2 PASS (reset xong 709 ms), P3 PASS (đồng bộ 1,9 s; 0 restart), P4-lần1/2/3 PASS (đồng bộ 1,8/1,3/1,8 s; delta=+1, hạ-cánh-về-target=true, errors=0), P5 PASS (không restart dư trong 40 s sau reset; seek kẹt dài nhất 0 mẫu), P6 KHÔNG-KẸT (phát thường suốt 90 s chờ, 0 restart) |

Về kẹt 85m4 ở P3 — những gì biết và chưa biết:
- P3 = `waitForPlaySync("P3")` (tối đa 60 s, có `.catch(() => null)`) + `sampleFor(20 s)`. Mọi vòng chờ trong harness đều có chặn trên (sync 60 s, not-seeking 15 s, ép ended 8 s, sampling 20/40 s) nên tổng worst-case của 85m4 chỉ ~10 phút; thực tế nó im lặng 14 phút không log — **vượt cả worst-case tính trên lý thuyết**, nghĩa là một (hoặc nhiều) `page.evaluate` đã treo lâu hơn mọi timeout nội bộ, hoặc vòng lặp sync đã quay lại nhiều lần mà không ghi log. Không có bằng chứng trực tiếp nào cho thấy nó treo ở lời gọi nào — harness không ghi heartbeat trong lúc chờ.
- Bối cảnh tải: RAM khả dụng lúc kẹt chỉ ~325–361 MB, swap đã dùng ~428 MB, CPU 94% idle (máy không bận tính toán mà có vẻ nghẽn I/O/swap); 84l10 chạy trước đó (lúc RAM ~1.081 MB) pass trong 67 s; 86n2 chạy ngay sau 85m4 (RAM ~534 MB) pass bình thường với thời gian đồng bộ 0,8–1,9 s. Vì vậy kẹt này **nhiều khả năng là tác dụng phụ của áp lực RAM/swap + tải 9 luồng song song tại đúng cửa sổ 03:14–03:28Z, không phải hồi quy sản phẩm** — nhưng đây là suy luận, chưa chứng minh; không được trích thành "85m4 fail do RAM".
- Không gặp crash "Target crashed" (đợt 125) và không gặp kẹt W2 (đợt 125); không process mồ côi sau đo (0 vite/chrome/MiniBrowser/Xvfb của T8; Xvfb `:197` đã kill; lock TRỐNG, 0 ticket).

## 6. Kiểm chứng sau mọi việc (boot #73)

- Fixture rebuild sau reboot #73 (script `rebuild-fixtures-127t8.sh`, log `smoke/rebuild-fixtures-b73.log`): md5 đủ 32 ký tự khớp đợt 126 (xem §1).
- Mirror + kiểm kê chạy lại trên boot #73: 25/25 OK; inventory diff 0 dòng so với đợt 126 (237 file, `has_ignored`=200, 68v2 31.685 B, 82j3 8.146 B — khớp số đợt 125/126).
- `npx tsc --noEmit` (apps/web): **exit 0** (19 s; `tsc-web-b73.log`). Trên boot #72 cũng exit 0 (27 s; `tsc-web.log`).
- `npx vite build` (apps/web): **exit 0**, built 6,93 s (`vite-build-b73.log`). Trên boot #72 cũng exit 0 (built 9,21 s).
- Production không động: `preview.tsx` `03bf029f…`, `media.ts` `2c384ed1…`, `vite.config.ts` `ee80d093…` — kiểm trước (boot #72, 02:40Z) và sau (boot #73, 03:33Z).
- Không kiểm lại TTS 39; không thử birefnet (RAM khả dụng 0,5–1,6 GB < guard 6 GB); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **2/3 exit 0 là nhánh webkit trên boot #73** (84l10/86n2). 85m4 webkit CHƯA CÓ kết quả đầy đủ đợt này — không được ghi "85m4 fail" như kết luận về sản phẩm; đúng là "85m4 timeout ở P3, nguyên nhân chưa rõ, cần chạy lại".
2. **0/3 trên boot #72 là lỗi hạ tầng** (thiếu thư viện hệ thống sau reboot), không phải lỗi harness/sản phẩm — đã được sửa bởi replay boot #73 + T5.
3. **Fixture `/tmp` không sống qua reboot** — phải tạo lại sau mỗi reboot bằng đúng script đã ghi; md5 đợt này khớp đủ 32 ký tự với đợt 126 (khắc phục điểm yếu chỉ khớp 8 ký tự của đợt 125, theo §7 mục 3 đợt 126).
4. Số đo chỉ đúng trên VM này trong giờ vòng lặp 9 luồng song song (tải + RAM là biến số lớn nhất); cửa sổ 85m4 kẹt trùng lúc RAM khả dụng thấp nhất đợt (~325 MB).
5. `probe-82j3-sample-load.mjs` vẫn exit 0 ngay cả khi probe lỗi (catch-all không set exit code) — hành vi có từ trước, không sửa trong đợt này (nợ đợt 125 §9 mục 5, vẫn mở).
6. Log attempt 1 (boot #72) từng harness đã bị retry 1 ghi đè (driver viết tên file cố định) — chỉ còn summary trong run record; từ retry 1 trở đi đã snapshot vào `smoke/retry1/` và `smoke/attempt3/`.
7. Trong lúc chờ replay, runtime có một lần restart (recovery notice cho lệnh sleep chờ replay) — lệnh sleep đó không có kết quả cuối xác nhận; T8 đã kiểm tra lại trạng thái bằng tay ngay sau đó (03:05:11Z) thay vì tin kết quả sleep.

## 8. Nợ cho đợt sau

1. **Ưu tiên cao nhất: chạy lại 85m4 nhánh webkit** (1 harness) trên boot ổn định — đây là nợ duy nhất đợt này để lại. Nếu kẹt P3 tái hiện, cần log heartbeat trong `waitForPlaySync`/`sampleFor` (hoặc chạy 85m4 một mình khi RAM rảnh) để định vị chỗ treo thay vì đoán.
2. **Mở từ trước, vẫn đứng:** G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi available ≥ 6 GB; 25 file config mặc định không cần làm gì (quyết §12(d) đứng); `probe-82j3` exit code khi lỗi (nợ nhỏ, xem §7 mục 5).
3. **Cân nhắc:** driver `run-webkit-*.sh` nên ghi log từng harness ra tên file riêng theo attempt (tránh ghi đè như attempt 1); và nên snapshot summary ngay sau mỗi attempt.
4. Boot #73 đã POSTBOOT_PASS ổn định (2 poll) lúc 03:11:16Z — đợt sau kiểm tra lại cờ này trước khi chạy webkit thay vì chạy mù.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round127-t8-viteharness.txt` — **1 file** (LIMITS này), đã verify read-back, 0 binary, **< 37.768 B**. Không sửa code nên không có harness nào trong batch. Fixture binary KHÔNG có trong batch (đúng luật). Dữ liệu thô: `hidden_files/round127-t8/` (rebuild-fixtures-127t8.sh, run-webkit-127t8.sh, inventory127.py/.txt/.json + inventory127-b73.txt, mirror-verify127.py, mirror-verify.log, tsc-web.log/vite-build.log (boot #72) + tsc-web-b73.log/vite-build-b73.log (boot #73), smoke/ 8 log + summary attempt 1/2/3 + attempt1/README.txt + retry1/ + attempt3/ snapshots, l10/m4/n2-scratch với report JSON + screenshot).
