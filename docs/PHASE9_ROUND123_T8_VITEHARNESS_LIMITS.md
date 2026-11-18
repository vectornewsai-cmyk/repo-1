# Đợt 123 T8 — Vite harness: kiểm mirror L8 sau boot mới + phủ nốt 4 file chỉ tiêu thụ config khác + kiểm kê lại toàn repo

Ngày: 16/11/2026 (lượt cron 21:35 +07; làm 14:41–14:59Z). Máy đo: VM này (CPU-only, Chromium qua Xvfb).
Phạm vi: CHỈ sửa script harness/test + 1 file config ngoài repo (68v2). KHÔNG sửa production (`apps/web/vite.config.ts`, `media.ts`, `preview.tsx` không động), KHÔNG push, KHÔNG release/tag.
Nợ: docs/PHASE9_ROUND122_T8_VITEHARNESS_LIMITS.md §9 mục 2 (4 file chỉ tiêu thụ config khác) + kiểm kê lại sau đợt 122.

## 0. Boot giữa đợt — đọc trước

Lượt này chạy qua **2 boot**. T8 bắt đầu trên boot **#66?** (btime 14:24:43Z, boot_id `9bbda390…`, số tạm theo T5 — journal chỉ giữ boot hiện tại nên không xác minh độc lập được) và **reboot lúc 14:52:19Z** giữa đợt; phần sau làm trên boot **#67?** (btime 14:52:19Z, boot_id `94e29be5…`, up 2 phút lúc 14:55Z). Boot #66? chỉ sống 27p36 (theo T5 đợt 123).

- Trên #66?: xác minh mirror 25/25 md5, sửa config 68v2, sửa harness 57n9, chạy kiểm kê lại.
- Trên #67?: đối chứng vite config mặc định (1.617 watch, HTTP 200), smoke sweep 13/13.
- `/tmp` bị xóa ở reboot 14:52:19Z (clip `r3-auto-proxy-test.mp4` + mọi config `/tmp/round*/` đã tạo trước đó đều mất) — các harness tự ghi config đã chứng minh ghi lại được trong smoke; xem §4. File trên đĩa bền (`/home/hatch`) không ảnh hưởng.

## 1. Kết luận ngắn

- **Mirror L8 đợt 122 còn nguyên vẹn: 25/25 file khớp md5_after** trong `round122-t8/edit-log.json`, 0 file đổi sau reboot. `vite.config.ts` md5 `ee80d093…`, `media.ts` md5 `2c384ed1…`, `preview.tsx` md5 `03bf029f…` — cả ba khớp đúng số đợt 122.
- **4 file chỉ tiêu thụ config khác — ĐÃ XỬ LÝ HẾT (nợ T9 §10 mục 2 ĐÃ ĐÓNG):**
  - `measure-65r8-perf-overlay.mjs` và `probe-82j3-sample-load.mjs`: **thừa hưởng mirror từ harness viết config** (đã mirror từ trước) — xác minh bằng template + config đã sinh + import-check, không cần sửa.
  - `clicktest-68v2-stab-toggle-headed.mjs`: **mirror tay file config ngoài repo** `hidden_files/round68-v2/vite.config.cjs` (1 dòng, `hmr: false` → thêm `watch.ignored`; md5 `cf0c0194…` → `1596c6ec…`, require-verify OK) — không stage được vì ngoài repo.
  - `clicktest-57n9-timeline-core-ops.mjs`: **thêm khối tự ghi config mirror** (mẫu đợt 122, +8/−1 dòng; md5 `4d6d309d…` → `4a2694a7…`, `node --check` PASS, import-check config OK) — lần đầu tiên 57n9 tự tạo lại được config của nó sau reboot.
- **Smoke sweep mẫu 13 config: 13/13 PASS** (vite lên, HTTP 200, **0 inotify watch**, 0 ENOSPC) — gồm cả 5 file `.cjs` (PASS ngay lượt 1 với driver thử `localhost` trước, không lặp lại lỗi driver đợt 122) và 2 harness viết config (65r8-presented, 77e1-deint-fps).
- **Kiểm kê lại toàn repo: 201 harness vite dev — 201/201 đã phủ mirror** (198 tự ghi config mirror trong source + 2 thừa hưởng + 1 config ngoài repo đã mirror tay). Thêm 2 harness mới từ đợt 121/122 (`probe121t8-h3fext-ab.mjs`, `probe122t3-h3f-ab.mjs`) đều sinh ra đã có mirror. 35 file không chạy vite dev không đổi.
- **Đính chính quan trọng về headroom (§2):** số đếm `/proc` (~63.733 "trống") **không phải headroom dùng được**. Probe trực tiếp của T5 trên cả 2 boot của lượt này chỉ thêm được **2.830 watch trước khi ENOSPC**. Vite config mặc định giữ ~1.617 watch nên thực tế chỉ chạy được **1 vite mặc định tại một thời điểm**; 2 vite mặc định song song sẽ ENOSPC. Mirror (0 watch) vì vậy là **điều kiện để chạy được, không chỉ phòng ngừa** — nâng mức kết luận của đợt 122.

## 2. Bối cảnh: headroom thật chỉ ~2.830 watch

- `max_user_watches = 63.747` trên cả 2 boot. Đếm qua `/proc/*/fdinfo` (`inotify wd:`): **14 watch đang dùng** (1 entry fdinfo không đọc được — xem dưới) → "headroom" ngây thơ 63.733, giống số đợt 122.
- **Probe trực tiếp của T5 đợt 123 (đo bằng cách thêm watch cho tới khi lỗi): trên boot #66? lúc 14:43Z và trên boot #67? lúc 14:53:53Z đều dừng ở đúng 2.830 watch thêm vào rồi `inotify_add_watch errno=28`.** T8 không chạy probe riêng (tránh tranh trần với các luồng khác) mà lấy số của T5 làm chuẩn — 2 lần đo độc lập trên 2 boot cho cùng một số.
- Giải thích khả dĩ (chưa chứng minh, T5/T6 theo dõi): có một tiến trình giữ một fd inotify với ~60.000 watch mà fdinfo của nó không đọc được (T8 gặp `PermissionError` khi đọc `/proc/14123/fdinfo` trên boot #66?; tiến trình đó đã chết theo reboot). Đếm `/proc` vì vậy thiếu sót — **đừng trích 63.733 làm headroom dùng được nữa**.
- Bằng chứng độc lập của T8 trên boot #67?: vite config mặc định boot được, HTTP 200, `ready in 354 ms`, giữ **1.617 watch** (đo trên pid vite thật, phương pháp đếm fdinfo như đợt 122; đợt 122 đo 1.613 — cùng bậc). 1.617 < 2.830 nên 1 vite mặc định vừa đủ; 2 vite mặc định (3.234) vượt trần. Đây là lần đầu tiên sau các boot #60–#63 mà giới hạn này được đo trực tiếp thay vì suy từ `/proc`.
- Hệ quả: mọi harness chưa mirror sẽ chết ENOSPC ngay khi có 2 vite mặc định chạy cùng lúc (hoặc 1 vite mặc định + ~1.200 watch khác). Sau đợt này không còn harness vite dev nào ở trạng thái đó (xem §5).

## 3. Mirror L8 đợt 122 còn nguyên vẹn

Đối chiếu md5 25 file harness đợt 122 với `md5_after` trong `hidden_files/round122-t8/edit-log.json` (script trong `round123-t8/` không lưu riêng — chạy bằng python một lần, xem log dưới):

- **25/25 khớp, 0 file đổi.** Cả 25 file vẫn chứa `watch: { ignored` trong khối ghi config mirror.
- Production không động: `apps/web/vite.config.ts` md5 `ee80d09370b6bfb1ad86efd9a737e411` (mtime 18/10), `apps/web/src/media.ts` md5 `2c384ed13703809d5e999311147745e7`, `apps/web/src/preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b` — khớp đúng số đợt 122 (preview.tsx đổi lúc 11:45:30Z đợt 122 bởi luồng khác, từ đó không đổi nữa).
- Đối chứng đường serve không cần chạy lại: đợt 122 §3 đã chứng minh byte-identical; đợt này chỉ đổi 1 harness (57n9, xem §4.4) theo đúng mẫu đó.

## 4. Xử lý 4 file chỉ tiêu thụ config khác

### 4.1 Thừa hưởng mirror, không cần sửa (2 file)

| File tiêu thụ | Config lấy từ | Harness viết config | Trạng thái |
|---|---|---|---|
| `apps/web/scripts/measure-65r8-perf-overlay.mjs` | `/tmp/round65-r8/vite.r8-presented.config.mjs` | `measure-65r8-presented-fps.mjs` (Form B, mirror T9) | **Thừa hưởng** — template viết config chứa `watch.ignored` + `hmr: false`; smoke đợt này chạy writer → config sinh lại (1.757 B) → import-check OK (`hmr=false`, `watch.ignored=["**/**"]`, 2 plugin react+media) |
| `apps/web/scripts/probe-82j3-sample-load.mjs` | `/tmp/round77-e1/vite.e1.headed.config.mjs` | `clicktest-77e1-deint-fps.mjs` (mirror đợt 120 T8) | **Thừa hưởng** — như trên; config sinh lại (2.121 B) → import-check OK (2 plugin react+media) |

- Cả hai file tiêu thụ đều `spawn vite -c <config>` trực tiếp, không tự viết config — đúng thiết kế "thừa hưởng", không có gì để sửa trong chính chúng.
- Lưu ý vận hành: `/tmp` mất sau mỗi reboot nên cả hai config đều không tồn tại cho tới khi harness viết chạy trước. `65r8-perf-overlay` kiểm tra rõ và báo lỗi "`không thấy vite config … (chạy measure-65r8-presented-fps.mjs trước để tạo)`"; `82j3` không kiểm tra trước — vite sẽ fail vì thiếu file config nếu chạy trước writer. Đây là hành vi có từ trước, không phải do mirror; ghi lại để đợt sau không nhầm là lỗi mirror.
- Ghi chú thêm: `probe-78f1-tick-time.mjs` và `probe-79g1-tick-time.mjs` cũng tự ghi file cùng tên `vite.e1.headed.config.mjs` nhưng vào `/tmp/round78-f1/` và `/tmp/round79-g1/` riêng — template của cả hai cũng đã mirror (đã kiểm tra, xem §7). Chúng không liên quan tới config mà 82j3 dùng (`/tmp/round77-e1/`).

### 4.2 `clicktest-68v2-stab-toggle-headed.mjs` — mirror tay config ngoài repo

- File tiêu thụ: `hidden_files/round68-v2/vite.config.cjs` (ngoài repo, 269 B, từ 08/11). Harness kiểm tra file tồn tại rồi mới spawn (`if (!fs.existsSync(VITE_CFG)) throw …`), dùng `-c` tới file này. Nội dung gốc: `module.exports = { plugins: [react()], server: { hmr: false } };` — **chưa mirror**.
- **Đã mirror tay (đúng nợ T9 §10 mục 2):** 1 dòng đổi — `server: { hmr: false }` → `server: { hmr: false, watch: { ignored: ["**/**"] } }` (+ comment ghi đợt 123 T8). Backup file gốc tại `hidden_files/round123-t8/backup/vite.config.cjs.round68-v2` (md5 `cf0c0194…`).
- Kiểm chứng: md5 sau sửa `1596c6ec953d78e98b22fbe18fdb1419`; diff đúng 1 dòng; `node -e require(...)` xác nhận `server.hmr === false`, `server.watch.ignored === ["**/**"]`, đúng 1 plugin (react). `node --check` harness tiêu thụ PASS (không sửa harness).
- **Không đưa vào batch stage:** file nằm ngoài repo nên push-files không đẩy được; thay đổi này chỉ có hiệu lực trên VM này. Nếu `hidden_files` bị dọn, mirror mất theo — sửa bền vững (để harness 68v2 tự ghi config như 57n9) là việc đợt sau, không làm trong lượt kiểm chứng này để giữ thay đổi tối thiểu theo đúng chỉ dẫn của T9.

### 4.3 `clicktest-57n9-timeline-core-ops.mjs` — thêm khối tự ghi config mirror

- Vấn đề gốc: harness spawn vite `-c /tmp/round57-n9/vite.n9.config.mjs` nhưng **không có ai viết file đó** — nội dung gốc chỉ còn trong doc `PHASE9_ROUND57_N9_CLICKTEST_LIMITS.md` §5.1 (sao y config thật: react plugin + `hmr: false`). File mất sau mỗi reboot; T9 kết luận "KHÔNG BIẾT" (không chạy được cho tới khi viết lại).
- **Đã sửa bền vững theo mẫu đợt 122:** chèn khối tự ghi config ngay trước dòng spawn (dùng `writeFileEpermRetry` đã import sẵn trong file), sao y đúng nội dung gốc N9 + thêm `watch.ignored`. Diff vs backup: **+8 dòng / −1 dòng** (4 dòng comment giải thích + 3 dòng code + 1 dòng comment cập nhật; dòng spawn `-c` giữ nguyên đường dẫn cũ nên không đổi hành vi nào khác). md5 `4d6d309dd410023bb674da1c7d189a26` → `4a2694a7ba9cdbf46a3a3d227ff1a112` (35.052 B, dưới ngưỡng oversize 37.768 B). Backup tại `hidden_files/round123-t8/backup/clicktest-57n9-timeline-core-ops.mjs`.
- Kiểm chứng 3 lớp:
  1. `node --check` PASS.
  2. Trích template từ file đã sửa (`round123-t8/verify-57n9-config.mjs`) → config sinh ra đúng nội dung gốc N9 + mirror → dynamic-import OK (`hmr=false`, `watch.ignored=["**/**"]`, 1 plugin react).
  3. Smoke (§6): harness tự ghi lại `/tmp/round57-n9/vite.n9.config.mjs` (279 B) rồi spawn vite lên, HTTP 200, 0 watch — tức **lần đầu tiên 57n9 chạy được mà không cần tạo tay config sau reboot**.

## 5. Kiểm kê lại toàn repo

Phương pháp: chạy lại `inventory.py` của T9 (copy sang `round123-t8/inventory123.py`, chỉ đổi đường dẫn output — không đổi logic), rồi đối chiếu từng file với `round121-t9/inventory.json`. Kiểm kê chạy trên boot #66?, trước khi sửa 57n9; số liệu cuối đã cộng tay hiệu ứng của sửa 57n9 (đã xác minh bằng grep sau sửa).

| Nhóm | Đợt 121 (T9, lúc bắt đầu) | Đợt 123 (đếm lại) |
|---|---|---|
| File ứng viên quét được (candidate) | 234 | **237** |
| Chứa `watch.ignored` (mirror) | 30 | **198** (199 sau sửa 57n9) |
| Chưa có mirror | 204 | **39** (38 sau sửa 57n9) |
| Harness vite dev (tổng) | 199 | **201** |
| File không chạy vite dev | 35 | **35** (không đổi) |

- **+3 file ứng viên so với T9, không file nào mất:** `probe121t8-h3fext-ab.mjs` và `probe122t3-h3f-ab.mjs` (harness A/B H3f của T8/T3 đợt 121/122 — sinh ra đã có mirror, `cfg_write=true`) và `apps/web/vite.n3.config.mjs` (236 B, file config do harness 86n3 sinh ra lúc chạy trong `apps/web/`, đã có mirror — **không phải source, không stage**, đúng như T9 đã ghi).
- **165 file lật từ chưa-mirror sang đã-mirror kể từ T9:** đúng 140 (T9) + 25 (đợt 122), 0 file lệch.
- **39 file "chưa có mirror" lúc đếm lại = 35 file không chạy vite dev + 4 file tiêu thụ config khác.** 35 file không-dev giữ nguyên danh mục T9 §4.5 (10 file `vite preview`/`-pipe`, chỉ `vite build`, 5 launcher, 2 lock script, 1 test spawn harness con, 1 comment trong bridge — danh sách đầy đủ trong `round123-t8/inventory.json`; không liệt kê lại hết ở đây để tránh trùng).
- **Trạng thái cuối sau xử lý §4 (57n9 tự ghi + 68v2 mirror tay):**

| Nhóm vite dev (201) | Số | Cách phủ mirror |
|---|---|---|
| Tự ghi config mirror trong source (`-c`, `hmr:false` + `watch.ignored`) | 198 | 30 trước T9 + 140 T9 + 25 đợt 122 + 2 mới (121t8/122t3) + 1 mới sửa (57n9) |
| Chỉ tiêu thụ config của harness khác (thừa hưởng) | 2 | 65r8-perf-overlay ← 65r8-presented; 82j3 ← 77e1-deint-fps |
| Tiêu thụ config ngoài repo (đã mirror tay) | 1 | 68v2 ← `hidden_files/round68-v2/vite.config.cjs` |
| **Tổng phủ mirror** | **201/201** | Không còn harness vite dev nào dùng config không-mirror |

- **Nợ "4 file chỉ tiêu thụ config khác" (T9 §10 mục 2) ĐÃ ĐÓNG.** Nợ còn lại xem §8.

## 6. Kiểm chứng — smoke sweep mẫu 13 config

Driver `hidden_files/round123-t8/smoke-sweep.py` (copy từ đợt 122, chỉ đổi danh sách harness — cơ chế thử HTTP **`localhost` trước rồi mới `127.0.0.1`** giữ nguyên). Chạy tuần tự trên boot #67?, log từng file tại `hidden_files/round123-t8/smoke/<tag>.log`, tổng hợp `smoke-summary.json`. Clip `check-proxy-auto` cần (`/tmp/r3-auto-proxy-test.mp4`) đã mất sau reboot 14:52Z nên tái tạo bằng ffmpeg testsrc2 1920x1080 5s (3.841.283 B, giống cách T8 đợt 122) trước khi chạy.

- **PASS: 13/13** (vite lên, HTTP 200, **0 inotify watch**, 0 ENOSPC). Vite lên sau 2,0–3,1 s mỗi file.

| # | Harness | Cổng | Vite lên sau | Watch | HTTP |
|---|---|---|---|---|---|
| 1 | c3-round13-clicktest.cjs (.cjs) | 5193 | 2,1 s | 0 | 200 |
| 2 | p5-round11-clicktest.cjs (.cjs) | 5191 | 2,0 s | 0 | 200 |
| 3 | r14-round14-clicktest.cjs (.cjs) | 5199 | 2,0 s | 0 | 200 |
| 4 | t5-round12-clicktest.cjs (.cjs) | 5192 | 2,0 s | 0 | 200 |
| 5 | v10-parity-clicktest.cjs (.cjs) | 5190 | 2,0 s | 0 | 200 |
| 6 | check-proxy-auto.mjs | 5173 | 2,0 s | 0 | 200 |
| 7 | clicktest-51h6-keyframe-panel.mjs | 5261 | 2,0 s | 0 | 200 |
| 8 | clicktest-53j5-proxy-persist.mjs | 5281 | 3,1 s | 0 | 200 |
| 9 | probe-media-clock.mjs --serve | 5173 | 2,0 s | 0 | 200 |
| 10 | clicktest-68v8-export-dest-electron.mjs | 5173 | 2,0 s | 0 | 200 |
| 11 | clicktest-57n9-timeline-core-ops.mjs (mới sửa) | 5370 | 2,0 s | 0 | 200 |
| 12 | measure-65r8-presented-fps.mjs (writer cho 65r8-overlay) | 5550 | 2,1 s | 0 | 200 |
| 13 | clicktest-77e1-deint-fps.mjs (writer cho 82j3) | 5580 | 2,1 s | 0 | 200 |

- **5 file `.cjs` PASS ngay lượt 1** — không lặp lại `VITE-UP-NOHTTP` của đợt 122 (driver đợt 122 đã sửa đúng lỗi đó; đợt này xác nhận sửa có tác dụng).
- **0 lần ENOSPC** trong toàn bộ 13 log smoke (grep toàn bộ). 3 config `/tmp` đã sinh lại trong lúc smoke đều chứa `watch.ignored` (57n9, r8-presented, e1.headed) — xem §4.
- **Không process mồ côi của T8 sau đo:** 0 vite dùng config T8 còn sống (kiểm tra `ps` sau sweep; 2 pid "trúng" trong lần kiểm đầu là chính tiến trình kiểm tra tự khớp chuỗi tìm kiếm — đã xác minh là false positive, cả 2 pid đều đã thoát).
- **Giới hạn của smoke (như T9/T8):** chỉ chứng minh vite lên qua config mirror, không chứng minh từng case đo của harness vẫn pass. Không chạy đầy đủ harness nào trong lượt này.

## 7. Ghi chú môi trường + tác dụng phụ (trung thực)

- **Reboot giữa đợt (14:52:19Z, #66? → #67?):** T8 không gây ra; T5 đợt 123 theo dõi boot. Mọi kết quả đều ghi rõ boot nào đo (xem §0).
- **Một lệnh exec bị kẹt:** lệnh đầu tiên sửa 68v2 (gồm `grep -rln` toàn bộ `hidden_files`) treo >3,5 phút không ra output rồi bị kill bằng SIGTERM; kiểm tra sau đó cho thấy **không có tác dụng phụ** (backup chưa tạo, config chưa đổi — md5 vẫn `cf0c0194…` trước khi sửa lại). Làm lại bằng các bước nhỏ thì xong ngay. Bài học: không grep đệ quy cả cây `hidden_files` nữa (quá lớn, nhiều file nhị phân).
- **Một lệnh đối chứng vite mặc định tự kill chính nó:** `pkill -f 'vite --port 5998'` khớp luôn dòng lệnh của shell đang chạy (chứa đúng chuỗi đó) và SIGTERM phiên exec — cùng cái bẫy tự khớp mà đợt 122 §3 đã ghi. Số liệu HTTP 200 / `ready in 385 ms` của lần đó vẫn dùng được (ghi trước khi kill); lần đối chứng sạch sau đó (port 5997, kill theo PID thật) cho 1.617 watch. Không còn vite nào sót lại từ các lần đối chứng (đã kiểm tra `ps`).
- **Lỗi verify script lần đầu:** script inline `node -e` chứa backtick/`${}` bị bash diễn giải sai (`+m[1]+: command not found`) — viết lại thành file `round123-t8/verify-57n9-config.mjs` thì chạy đúng. Không ảnh hưởng kết quả (config đã verify lại đầy đủ sau đó).
- **Disk:** 71 GB trống trên `/home/hatch` lúc làm việc (giống đợt 122).
- **Không kiểm lại TTS 39; không thử birefnet; không sửa production; không push.** Symlink chromium-1248 → 1254 của T9 vẫn còn (smoke dùng được).

## 8. Giới hạn — đọc trước khi trích số

1. **Headroom `/proc` không phải headroom dùng được.** Đừng trích "còn trống ~63.733 watch" — số đo trực tiếp (T5, 2 boot) là ~2.830. Cơ chế của số ~60.000 watch ẩn chưa rõ (T5/T6 theo dõi); T8 chỉ ghi nhận số đo và bằng chứng độc lập (vite mặc định 1.617 watch boot được).
2. **Mirror giờ là điều kiện để chạy, không chỉ phòng ngừa** — với ~2.830 watch trống, 2 vite config mặc định chạy song song sẽ ENOSPC. Kết luận này dựa trên trần đo được hiện tại; nếu trần hồi sau này thì mirror trở lại vai trò phòng ngừa.
3. **Smoke chỉ chứng minh vite lên** (xem §6). Các harness cũ vẫn có thể bit-rot vì fixture/API đổi — lỗi nào gặp trong smoke đều phải ghi rõ là lỗi pre-vite từ trước, không đổ cho mirror.
4. **Config `/tmp` không sống qua reboot.** 57n9 giờ tự ghi lại mỗi lần chạy (bền). 65r8-overlay/82j3 vẫn phụ thuộc harness viết chạy trước (đã ghi trong code của 65r8-overlay; 82j3 không có kiểm tra trước). 68v2 phụ thuộc file ngoài repo đã mirror tay — mất nếu `hidden_files` bị dọn.
5. **Số đo chỉ đúng trên VM này** trong giờ vòng lặp 9–10 luồng song song (load là biến số lớn nhất; ready 354 ms lúc đo so với 1.377 ms lúc máy tải hơn).
6. **Chế độ SHARED của gopHeaded47C5/48D4/49E2** (dùng vite :5173 đang chạy thì không spawn vite mirror) vẫn như đợt 122 mục 4 — không kiểm lại trong đợt này.

## 9. Cách chạy lại

```bash
# Kiểm kê lại (quét toàn repo; chỉ đổi đường dẫn output so với T9):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round123-t8/inventory123.py
# node --check file đã sửa + 3 file tiêu thụ còn lại:
cd ~/workspace/repo-1/apps/web/scripts
node --check clicktest-57n9-timeline-core-ops.mjs
node --check measure-65r8-perf-overlay.mjs probe-82j3-sample-load.mjs clicktest-68v2-stab-toggle-headed.mjs
# Trích template 57n9 -> import-check config:
node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round123-t8/verify-57n9-config.mjs
# Verify config 68v2 ngoài repo:
node -e "const c=require('/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round68-v2/vite.config.cjs'); console.log(JSON.stringify(c.server));"
# Smoke mẫu 13 (driver tự kill khi vite lên):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round123-t8/smoke-sweep.py
# Smoke 1 harness:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round123-t8/smoke-sweep.py 57n9
# Đối chứng vite mặc định giữ bao nhiêu watch (kill theo PID thật, KHÔNG pkill -f):
#   mặc định -> ~1.617 watch; mirror (-c config có watch.ignored) -> 0 watch
```

## 10. Nợ cho đợt sau

1. **ĐÃ ĐÓNG:** nợ 4 file tiêu thụ config (T9 §10 mục 2) + kiểm kê lại sau đợt 122.
2. Nợ còn lại từ T9 §10 mục 3–6 + đợt 122 §9 mục 2 vẫn đứng: khôi phục fixture cho 7 harness EXIT:2 đợt 121; WebKit headed (thiếu `libevent-2.1.so.7`); chạy đầy đủ thêm các harness fps/parity quan trọng khi có cửa sổ yên.
3. Mới: làm 68v2 tự ghi config mirror như 57n9 (để không phụ thuộc file ngoài repo); thêm kiểm tra tồn tại config cho 82j3 (như 65r8-overlay đã có) để lỗi rõ ràng hơn khi chạy trước writer sau reboot.
4. Mới: theo dõi trần inotify thực (probe T5) qua các boot sau — nếu số ~2.830 giữ nguyên thì đây là trần vận hành mới, và mọi harness mới PHẢI sinh ra đã có mirror (2 harness mới đợt 121/122 đã làm đúng).
5. G1 vẫn MỞ chờ user quyết; ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round123-t8-viteharness.txt` — 2 file (LIMITS này + harness 57n9 đã sửa), đã verify read-back, 0 binary. **0 file > 37.768 B** (57n9: 35.052 B). File config 68v2 đã mirror KHÔNG có trong batch vì nằm ngoài repo (xem §4.2). Dữ liệu thô: `hidden_files/round123-t8/` (inventory123.py + inventory.json/txt, smoke-sweep.py, smoke/ 13 log + smoke-summary.json, verify-57n9-config.mjs, backup/ 2 file gốc).
