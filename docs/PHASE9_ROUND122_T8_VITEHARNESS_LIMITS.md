# Đợt 122 T8 — Vite harness: mirror L8 cho 25 harness config production mặc định còn lại

Ngày: 16/11/2026 (lượt cron 18:35 +07; làm 11:37–11:53Z). Máy đo: VM này (boot #64, CPU-only, Chromium qua Xvfb).
Phạm vi: CHỈ sửa script harness/test (thêm khối ghi config mirror + `-c` khi spawn vite). KHÔNG sửa production (`apps/web/vite.config.ts` không động — md5 `ee80d093…`), KHÔNG push, KHÔNG release/tag.
Nợ: docs/PHASE9_ROUND121_T9_VITEHARNESS_LIMITS.md §6.1 + §10 mục 1 (25 file config mặc định chưa mirror được bằng mẫu T8 đợt 121).

## 1. Kết luận ngắn

- **25/25 harness đã mirror** (mỗi file: 8 dòng chèn — 5 dòng comment + 3 dòng code — + 1 dòng spawn đổi thêm `-c`; 68v8 thêm 4 dòng comment cũ đổi thành 3 dòng mới). `node --check` 25/25 PASS. Diff từng file vs backup đúng như thiết kế (9 dòng thêm / 1 dòng bớt; 68v8: 12/5 do cập nhật comment).
- **Cách mirror khác mẫu T8 ở một điểm có chủ ý:** config mirror SAO CHÉP Y HỆT production (`plugins: [react()]`, `port: 5173`) + chỉ thêm `watch: { ignored: ["**/**"] }`; **KHÔNG thêm `hmr: false`** — vì production không tắt HMR, và 140 harness đợt 121 có `hmr: false` là do template của chúng đã tắt từ trước. Thêm `hmr: false` vào 25 file này sẽ là đổi hành vi serve so với production. Xem chứng minh đường serve không đổi ở §3.
- **Đối chứng cơ chế (trước khi patch):** vite config mặc định giữ **1.613 inotify watch**, vite config mirror giữ **0 watch** — cùng HTTP 200, cùng `ready`. Đây chính là tài nguyên gây ENOSPC khi trần đầy.
- **Đính chính tiền đề ENOSPC trên boot hiện tại (§2):** trên boot #64 (btime 11:05:18Z), vite config mặc định LÊN BÌNH THƯỜNG (`ready in 343 ms`, 0 ENOSPC) — trần inotify đã hồi sau reboot (headroom ~63.733 theo đếm /proc, khác hẳn 434–545 các boot trước; quan sát "reboot không hồi" của T8/T9 không còn đúng ở boot #64). Nghĩa là **25 harness này hiện KHÔNG chết ENOSPC**; mirror đợt này là phòng ngừa + thống nhất toàn bộ 199 harness theo cùng một mẫu, để lần tới trần đầy thì chúng không chết. Đừng trích "25 harness đã hết ENOSPC" như một lỗi đã sửa — đúng hơn là "đã loại bỏ 1.613 watch/harness khỏi đường chết ENOSPC".
- **Smoke sweep 25 harness: 25/25 PASS** (vite lên, HTTP 200, 0 inotify watch, 0 ENOSPC — xem §5). 20 PASS ngay lượt 1; 5 file `.cjs` (c3/p5/r14/t5/v10) lượt 1 vite đã lên nhưng driver kiểm HTTP sai địa chỉ (127.0.0.1 trong khi 5 file này spawn vite không `--host` nên vite chỉ bind `localhost`) — chạy lại với driver sửa (thử `localhost` trước) thì 5/5 PASS. Đây là lỗi driver của T8, không phải lỗi mirror.
- **Production:** `media.ts` md5 `2c384ed1…` khớp đợt 121; `vite.config.ts` không động (mtime 18/10). `preview.tsx` md5 `03bf029f…` KHÁC số đợt 121 (`5be5a250…`) — file này bị sửa lúc **11:45:30Z trong đợt 122 bởi một luồng song song khác (không phải T8)**; T8 chỉ viết 25 file harness (chứng minh bằng backup diff, §4). Đối chứng serve §3 đo trên cây tại thời điểm đó.

## 2. Bối cảnh: trần inotify đã hồi trên boot #64

- Boot hiện tại là **#64** (boot_id `3fe7e89e…`, btime 11:05:18Z theo `who -b`/`uptime -s`) — reboot xảy ra giữa lúc đóng đợt 121 (10:28Z) và mở đợt 122 (11:35Z). T5 đợt 122 là luồng hạ tầng theo dõi boot; T8 chỉ ghi nhận những gì tự đo được.
- Đếm watch qua `/proc/*/fdinfo` (`inotify wd:`): **14 watch đang dùng / max 63.747 → headroom 63.733**. Các boot #60–#63 headroom chỉ 434–545 theo T8/T9. Dù phương pháp đếm của T8 có thể khác, bằng chứng thực nghiệm mới là chuẩn: vite config mặc định boot được ngay.
- Đối chứng trực tiếp (config viết tay ngoài repo, `/tmp/t8-mirror-test.config.mjs`, trước khi patch):
  - Config mặc định (`apps/web/vite.config.ts`): `VITE v6.4.5 ready in 343 ms`, HTTP 200, **1.613 inotify watch** (đếm trên pid vite), 0 ENOSPC, exit 124 (bị `timeout 30` kill — chết do hết giờ, không phải do lỗi).
  - Cùng app + config mirror: `ready in 395 ms`, HTTP 200, **0 inotify watch**.
- Kết luận: mirror loại bỏ đúng tài nguyên gây ENOSPC (1.613 watch/vite), nhưng trên boot #64 lỗi ENOSPC không còn tái hiện được với config mặc định — mirror là phòng ngừa, không phải sửa một lỗi đang cháy.

## 3. Mẫu mirror + chứng minh đường serve không đổi

Config mirror mỗi harness tự ghi ra `/tmp/round<NN>-<tag>/vite.<tag>.config.mjs` trước khi spawn vite (tạo lại mỗi lần chạy vì /tmp mất sau reboot; cùng mẫu 58o1 đã kiểm chứng đợt 121):

```js
import { createRequire } from "node:module";
const require = createRequire("<WEB_DIR>/package.json");
const react = require("@vitejs/plugin-react").default;
export default { plugins: [react()], server: { port: 5173, watch: { ignored: ["**/**"] } } };
```

So với `apps/web/vite.config.ts` (`plugins: [react()]`, `server: { port: 5173 }`): chỉ thêm `watch.ignored`. CLI `--port/--strictPort/--host` của harness đè lên port trong config như trước. Không media plugin — đúng vì production cũng không có; các harness cần media đều tự dựng clip server/bridge riêng (53j5/54k7) hoặc dùng `public/` (gopHeaded).

Chứng minh serve không đổi — chạy song song 2 vite trên cùng cây, cùng lúc (script `/tmp/t8-equiv.sh`, log `/tmp/t8-default.log` + `/tmp/t8-mirror.log`):

| Kiểm tra | Config mặc định (:5998) | Config mirror (:5997) | Kết quả |
|---|---|---|---|
| `GET /` (index.html) | 1.291 B | 1.291 B | **diff rỗng — IDENTICAL** (gồm cả script `@vite/client` + react-refresh inject, tức HMR client vẫn được chèn như production) |
| `GET /src/main.tsx` (đã transform) | 3.403 B | 3.403 B | **diff rỗng — IDENTICAL** (cùng hash dep `?v=c22e0ee7`, cùng sourcemap) |
| Thời gian ready | 2.302 ms | 2.329 ms | tương đương (dưới tải 9–10 luồng song song) |
| Inotify watch | 1.613 | 0 | mirror loại bỏ đúng tài nguyên gây ENOSPC |

(Lưu ý vận hành: 2 lần chạy đối chứng đầu bị hỏng do lỗi grouping shell của chính T8 — lần 1 vite mirror chạy sai cwd nên trả rỗng, lần 2 `pkill -f` tự khớp shell của mình và SIGKILL phiên exec; đã sửa bằng script file `/tmp/t8-equiv.sh` + kill theo PID, kết quả trên là lần chạy thứ 3, sạch. Không có vite mồ côi nào sót lại từ các lần hỏng — đã kiểm tra `pgrep` sau mỗi lần; vite của T3 đợt 122 trên cổng 5590 không bị động vào.)

## 4. Kiểm kê 25 harness + cách patch

### 4.1 Liệt kê chính xác 25 harness (tên + lý do chưa mirror được đợt trước)

Tất cả đều spawn vite dev với `cwd=apps/web`, không `-c` → vite tự load `apps/web/vite.config.ts`. Không file nào trong 25 cần media plugin (grep `mediaPlugin|configureServer` = 0). Phân loại theo dạng spawn:

| # | File | Dạng spawn cũ | Cổng | Ghi chú |
|---|---|---|---|---|
| 1 | `apps/web/scripts/c3-round13-clicktest.cjs` | `spawn(viteBin, ["--port", DEV_PORT, "--strictPort"])` | 5193 cố định | .cjs |
| 2 | `apps/web/scripts/check-proxy-auto.mjs` | `viteArgs` điều kiện: dev `["--port", 5173, ...]`, preview `["preview", ...]` | 5173 | Chỉ nhánh dev thêm `-c`; nhánh `vite preview` không watch nên không đổi |
| 3 | `apps/web/scripts/clicktest-51h6-keyframe-panel.mjs` | `spawn(VITE_BIN, ["--port", DEV_PORT, "--strictPort", "--host", "127.0.0.1"])` | pickFreePort 5261–5279 | Trong vòng retry theo attempt |
| 4 | `apps/web/scripts/clicktest-52i2-audio-null-badge.mjs` | như trên | pickFreePort 5281–5299 | |
| 5 | `apps/web/scripts/clicktest-53j5-proxy-persist.mjs` | như trên (+ `VITE_BRIDGE_URL`) | pickFreePort 5281–5299 | Bridge + clip server riêng |
| 6 | `apps/web/scripts/clicktest-53j5-tick-null-gain.mjs` | như trên | pickFreePort 5281–5299 | Tone server riêng |
| 7 | `apps/web/scripts/clicktest-54k7-proxy-toolbar-stale.mjs` | như trên (+ `VITE_BRIDGE_URL`) | pickFreePort 5301–5319 | Bridge + clip server riêng |
| 8 | `apps/web/scripts/clicktest-55l1-i18n-projectmenu-topbar.mjs` | như trên | pickFreePort 5350–5369 | |
| 9 | `apps/web/scripts/clicktest-68v8-export-dest-electron.mjs` | `["--configLoader", "runner", "--port", 5173, ...]` | 5173 cố định | Giữ `--configLoader runner` (tránh file tạm `.vite-temp/*.mjs` + lỗi EPERM); comment cũ nói "config thật của apps/web" đã cập nhật thành "config mirror" |
| 10 | `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` | `spawn(viteBin, ["--port", APP_PORT, ...])` | 5197 mặc định | |
| 11 | `apps/web/scripts/gopHeaded46B4.mjs` | `spawn(viteBin, ["--host", "127.0.0.1", "--port", 5173, "--strictPort"])` | 5173 | Fixture `~/scratch-round46-b4/trailing-b4.mp4` còn |
| 12 | `apps/web/scripts/gopHeaded47C5.mjs` | `SHARED ? null : spawn(...)` | 5173 | SHARED: dùng vite :5173 đang chạy thì không spawn (mirror chỉ có tác dụng khi tự spawn) |
| 13 | `apps/web/scripts/gopHeaded48D4.mjs` | `SHARED ? null : spawn(...)` | 5173 | Fixture `~/scratch-round47-c5/trailing-real37.mp4` (38.996.431 B, đúng `FIXTURE_SIZE`) còn |
| 14 | `apps/web/scripts/gopHeaded49E2.mjs` | `SHARED ? null : spawn(...)` | 5173 | Cùng fixture 48D4 |
| 15 | `apps/web/scripts/p5-round11-clicktest.cjs` | `spawn(viteBin, ["--port", DEV_PORT, "--strictPort"])` | 5191 cố định | .cjs |
| 16 | `apps/web/scripts/probe-53j5-playhead-drift.mjs` | như mục 3 | pickFreePort 5281–5299 | Tone server riêng |
| 17 | `apps/web/scripts/probe-54k7-geo.mjs` | như trên (+ `VITE_BRIDGE_URL`) | pickFreePort 5301–5319 | Bridge + clip server riêng |
| 18 | `apps/web/scripts/probe-54k9-audio-reseek.mjs` | như trên | pickFreePort 5281–5299 | Tone server riêng |
| 19 | `apps/web/scripts/probe-55l6-audio-drift.mjs` | như trên | pickFreePort 5481–5499 | Tone server riêng |
| 20 | `apps/web/scripts/probe-cpu-profile.mjs` | `spawn(viteBin, ["--port", port, ...])` trong `if (SERVE)` | port từ `--url` (mặc định 5173) | Chỉ spawn vite khi có cờ `--serve` |
| 21 | `apps/web/scripts/probe-media-clock.mjs` | như trên | port từ `--url` (mặc định 5173) | Chỉ spawn vite khi có cờ `--serve` |
| 22 | `apps/web/scripts/probe-trace.mjs` | như trên | port từ `--url` (mặc định 5173) | Chỉ spawn vite khi có cờ `--serve` |
| 23 | `apps/web/scripts/r14-round14-clicktest.cjs` | `spawn(viteBin, ["--port", DEV_PORT, "--strictPort"])` | 5199 cố định | .cjs |
| 24 | `apps/web/scripts/t5-round12-clicktest.cjs` | như trên | 5192 cố định | .cjs |
| 25 | `apps/web/scripts/v10-parity-clicktest.cjs` | như trên | 5190 cố định | .cjs |

Đối chiếu với LIMITS T9 §6.1: khớp đủ 25 tên. Lưu ý: `default-config-files.json` của T9 chỉ có 24 entry (thiếu `check-proxy-auto.mjs` — file này chỉ dùng config mặc định ở chế độ dev thường, chế độ preview-dist dùng `vite preview`); T8 đã xác minh trực tiếp cả 25 file đều spawn vite không `-c` nên danh sách đúng là 25.

### 4.2 Cách patch (script `hidden_files/round122-t8/apply-mirror-122t8.py`)

- Mỗi file: chèn 8 dòng ngay trước dòng spawn (5 dòng comment giải thích + `const VITE_CFG`, `fs.mkdirSync`, câu ghi config); thêm `"-c", VITE_CFG` vào đầu mảng args spawn. File dùng `writeFileEpermRetry` thì ghi config bằng helper đó (17 file); file không import helper thì dùng `fs.writeFileSync` (8 file: 5 `.cjs` + `check-proxy-auto` + `gopHeaded48D4/49E2` + `probe-media-clock`).
- Script assert trước khi viết: file chưa có `watch: { ignored` và chưa có `VITE_CFG`; chuỗi spawn cũ xuất hiện đúng 1 lần; mỗi file spawn vite đúng 1 lần (đã đếm `grep -c` trước).
- Backup file gốc: `hidden_files/round122-t8/backup/` (25 file). Log sửa: `hidden_files/round122-t8/edit-log.json` (md5 trước/sau từng file).
- Diff vs backup: **24 file đúng 9 dòng thêm / 1 dòng bớt; 68v8 đúng 12 dòng thêm / 5 dòng bớt** (thêm cập nhật comment 4 dòng cũ → 3 dòng mới). 0 file lệch.
- `node --check`: **25/25 PASS**.

## 5. Kiểm chứng — smoke sweep 25 harness

Driver `hidden_files/round122-t8/smoke-sweep.py`: chạy tuần tự từng harness (`node <file>`, cwd repo), phát hiện vite lên qua cmdline tiến trình vite chứa đường dẫn config mirror, curl HTTP tới cổng vite, đếm inotify watch của pid vite đó, rồi kill toàn bộ process-group của harness + quét lại vite dùng config đó; tối đa 150 s/file (gopHeaded 300 s). Log từng file tại `hidden_files/round122-t8/smoke/<tag>.log`, tổng hợp `smoke/smoke-summary-final.json` (25 entry; `smoke-summary.json` là bản của lượt chạy lại 5 file — đã gộp tay thành bản final).

- **PASS (vite lên, HTTP 200, 0 watch, 0 ENOSPC): 25/25.** Thời gian tới lúc vite lên: 2,0–8,6 s (trừ 47c5: 30,4 s — fixture encode/proxy kiểm tra trước khi spawn vite; và các `.cjs`: 4,3–7,5 s lượt retry).
- **Lượt 1: 20/25 PASS.** 5 file `.cjs` (c3, p5, r14, t5, v10) ghi `VITE-UP-NOHTTP`: vite đã lên (pid tìm thấy qua cmdline `-c`, **0 watch**), nhưng driver curl `http://127.0.0.1:<port>/` 5 lần đều không trả về. Nguyên nhân: 5 file `.cjs` spawn vite **không `--host`** (hành vi từ trước khi mirror — xem §4.1), vite log ghi `Local: http://localhost:519x/` + `Network: use --host to expose`, tức vite chỉ bind `localhost`; driver kiểm sai địa chỉ. Log vite của cả 5 đều ghi `ready in 140–1.227 ms` nên vite thực tế đã lên ngay lượt 1. **Lỗi driver của T8, không phải lỗi mirror** — đã sửa driver thử `localhost` trước rồi mới `127.0.0.1`, chạy lại 5 file: **5/5 PASS** (HTTP 200, 0 watch). Tổng kết cuối: **vite lên thực tế 25/25**.
- **0 lần ENOSPC** trong toàn bộ log smoke (25 file) + 5 file log vite `/tmp/{c3,p5,r14,t5,v10}-vite.log` (grep toàn bộ, 0 kết quả). 25/25 file config đã sinh ra trên đĩa (`/tmp/round*/vite.*.config.mjs`) đều chứa `watch: { ignored }`, 0 file không chứa.
- **Import-check 25 config đã sinh** (script `/tmp/t8-import-check.mjs`, dynamic-import từng file): **25/25 OK** — `server.watch.ignored === ["**/**"]`, đúng 1 plugin (react), `server.port === 5173`, `server.hmr === undefined` (giữ mặc định production — HMR không bị tắt).
- **Chạy đầy đủ 1 harness đại diện (đường đo không đổi):** `probe-media-clock.mjs --serve` chạy trọn vẹn, exit 0, ~50 s (log `smoke/media-clock-full.log`): vite mirror lên, Chrome nạp app, playhead chạy thật 00:00.0 → 00:07.5 trong ~10 s lấy mẫu, rAF đếm 1 → 23, longtask quan sát được (count 24 → 46). `videos:[]` trong log là vì project mẫu của probe không có thẻ `<video>` — nội dung mẫu của probe, không liên quan mirror; playhead chạy + app sống chứng minh đường serve/đo qua config mirror vẫn đúng. (Không chạy đầy đủ thêm harness khác: thay đổi duy nhất là config vite, và §3 đã chứng minh nội dung serve giống hệt production ở mức byte.)
- **Không process mồ côi của T8 sau đo:** 0 vite dùng config T8, 0 Xvfb/Chrome của T8 còn sống (kiểm tra `ps` lúc 11:52Z). Vite :5590 + Xvfb :193 + Chrome đang chạy lúc đó là của T3 đợt 122 (`probe122t3-h3f-ab.mjs`, pid 14243) — T8 không động vào.

## 6. Giới hạn — đọc trước khi trích số

1. **Mirror ≠ sửa lỗi đang cháy trên boot này.** Trên boot #64, config mặc định vẫn boot được; mirror chỉ loại bỏ 1.613 watch/harness khỏi đường chết ENOSPC và thống nhất 199 harness theo cùng một mẫu. Nếu trần lại đầy ở boot sau, 25 harness này mới phát huy tác dụng.
2. **Smoke sweep chỉ chứng minh vite lên, không chứng minh từng case đo của harness vẫn pass** (giống giới hạn của T9 §7 mục 2). Các harness cũ (đợt 10–68) có thể đã bit-rot vì fixture/API đổi — lỗi nào gặp trong smoke đều ghi rõ là lỗi pre-vite từ trước, không đổ cho mirror.
3. **Config mirror nằm trong /tmp** (tạo lại mỗi lần harness chạy). Sau reboot, lần chạy đầu của mỗi harness sẽ ghi lại config — không cần thao tác tay.
4. **Chế độ SHARED của gopHeaded47C5/48D4/49E2:** nếu đã có vite :5173 đang chạy (của luồng khác), harness dùng chung vite đó và KHÔNG spawn vite mirror của mình — mirror không có tác dụng trong chế độ này (đúng thiết kế SHARED từ trước, không phải lỗi).
5. **`check-proxy-auto.mjs` chế độ preview-dist** (`CHECK_PROXY_PREVIEW_DIST=1`, `vite preview`) không bị ENOSPC và không đổi gì — chỉ nhánh dev thường được mirror.
6. **68v8 vẫn dùng `--configLoader runner`** (giữ nguyên để tránh lỗi EPERM `loadConfigFromBundledFile`); config mirror được load qua runner, đã kiểm chứng bằng smoke.
7. **Số đo chỉ đúng trên VM này** trong giờ vòng lặp 9–10 luồng song song (load là biến số lớn nhất; ready 2,3 s lúc đo so với 343 ms lúc máy yên).
8. **Không kiểm lại TTS 39; không thử birefnet; không sửa production; không push.** `preview.tsx` đổi lúc 11:45:30Z là việc của luồng song song đợt 122, không phải T8 — T10 recount lúc đóng đợt cần lưu ý cây đã đổi so với HEAD a8f26d48.

## 7. Ghi chú môi trường + tác dụng phụ (trung thực)

- **Boot #64 (btime 11:05:18Z, boot_id `3fe7e89e…`):** reboot giữa đợt 121 và đợt 122; headroom inotify hồi về ~63.733 (đếm /proc) — trái với quan sát "reboot không hồi" của T8/T9 trên các boot #60–#63. T5 đợt 122 theo dõi boot; nếu T5 đo headroom bằng phương pháp khác ra số khác, lấy số của T5 làm chuẩn cho đợt 122.
- **Symlink `~/.cache/ms-playwright/chromium-1248 → chromium-1254`** của T9 vẫn còn, smoke dùng được.
- **Vite của T3 đợt 122** (pid 8154, cổng 5590, config `/tmp/round122-t3/vite.w3.config.mjs`) đang chạy trong lúc T8 làm việc — T8 không động vào, không kill.
- **Clip cho check-proxy-auto:** `/tmp/r3-auto-proxy-test.mp4` đã mất sau reboot; T8 tái tạo bằng `ffmpeg -f lavfi -i testsrc2=size=1920x1080:rate=30:duration=5 -c:v libx264` (3.841.283 B) để smoke chạy được — clip này chỉ phục vụ smoke, không phải fixture đo chính thức của R3.
- **Không có vite/bridge/Xvfb/Chrome mồ côi của T8 sau đo** (driver smoke kill theo process-group + quét lại cmdline chứa đường dẫn config; đã kiểm tra `pgrep` sau sweep — xem §5).
- **Disk:** 71 GB trống trên `/home/hatch` lúc làm việc (khác hẳn 0,49 GB T9 ghi — có thể T9 đọc bridge health trên tmpfs hoặc đĩa đã được dọn; T8 đọc `df` trực tiếp).

## 8. Cách chạy lại

```bash
# Patch lại từ đầu (đã chạy xong; script assert file chưa có mirror nên
# chạy lần 2 sẽ dừng ở assert — muốn chạy lại thì restore từ backup trước):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round122-t8/apply-mirror-122t8.py
# node --check 25 file đã sửa:
cd ~/workspace/repo-1/apps/web/scripts
for f in c3-round13-clicktest.cjs check-proxy-auto.mjs clicktest-51h6-keyframe-panel.mjs clicktest-52i2-audio-null-badge.mjs clicktest-53j5-proxy-persist.mjs clicktest-53j5-tick-null-gain.mjs clicktest-54k7-proxy-toolbar-stale.mjs clicktest-55l1-i18n-projectmenu-topbar.mjs clicktest-68v8-export-dest-electron.mjs clicktest-round37-t5-fallback-pipe.mjs gopHeaded46B4.mjs gopHeaded47C5.mjs gopHeaded48D4.mjs gopHeaded49E2.mjs p5-round11-clicktest.cjs probe-53j5-playhead-drift.mjs probe-54k7-geo.mjs probe-54k9-audio-reseek.mjs probe-55l6-audio-drift.mjs probe-cpu-profile.mjs probe-media-clock.mjs probe-trace.mjs r14-round14-clicktest.cjs t5-round12-clicktest.cjs v10-parity-clicktest.cjs; do node --check "$f" || echo "FAIL $f"; done
# Smoke 1 harness (driver tự kill khi vite lên, tối đa 150s):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round122-t8/smoke-sweep.py media-clock
# Smoke toàn bộ 25:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round122-t8/smoke-sweep.py
# Đối chứng config mặc định vs mirror (vite giữ bao nhiêu watch):
#   mặc định -> 1.613 watch; mirror (-c config có watch.ignored) -> 0 watch
```

## 9. Nợ cho đợt sau

1. Toàn bộ 199 harness dùng vite dev giờ đều đã mirror (174 config riêng + 25 config mặc định) — không còn harness nào dùng config không-mirror. Nợ "25 config mặc định" của T9 §10 mục 1 **ĐÃ ĐÓNG**.
2. Nợ còn lại từ T9 §10 mục 2–6 vẫn đứng: mirror tay `hidden_files/round68-v2/vite.config.cjs` + viết lại config `/tmp/round57-n9/vite.n9.config.mjs` (hoặc ghi rõ 2 harness này đã bỏ); khôi phục fixture cho 7 harness EXIT:2 đợt 121; WebKit headed (thiếu `libevent-2.1.so.7`); chạy đầy đủ thêm các harness fps/parity quan trọng khi có cửa sổ yên.
3. Theo dõi headroom inotify qua các boot sau: nếu trần lại đầy như boot #60–#63 thì mirror đợt này mới chứng minh được giá trị thực chiến; nếu headroom vẫn hồi sau mỗi reboot thì ENOSPC có thể đã hết hẳn (do tiến trình rò rỉ đã chết ở boot #64) — T5/T6 các đợt sau xác nhận.
4. G1 vẫn MỞ chờ user quyết; ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round122-t8-viteharness.txt` — 26 file (LIMITS này + 25 harness), đã verify read-back 26/26, 0 binary. **4 file > 37.768 B cần `ENABLE_PRIVSEP=0` khi push:** `c3-round13-clicktest.cjs` (65.438 B), `clicktest-51h6-keyframe-panel.mjs` (44.617 B), `gopHeaded49E2.mjs` (43.623 B), `r14-round14-clicktest.cjs` (66.477 B). LIMITS này 22.796 B, không oversize. Dữ liệu thô: `hidden_files/round122-t8/` (apply-mirror-122t8.py, edit-log.json, backup/ 25 file gốc, smoke-sweep.py, smoke/ 25 log + smoke-summary.json/final + media-clock-full.log).
