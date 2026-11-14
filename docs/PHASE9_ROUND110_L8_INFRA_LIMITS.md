# PHASE9_ROUND110_L8_INFRA_LIMITS — Hạ tầng bền vững: WebKit sau reboot + vite watch + log append

> Luồng L8, đợt 110, lượt cron 09:35 +07 14/11/2026 (bắt đầu ~02:36Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ LIMITS gộp đợt 109 §4 mục 10 (ENOSPC + WebKit sau reboot #37).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (`preview.tsx` không
> đụng — md5 không đổi, xem §7). Chỉ sửa 1 script harness trong repo + 3
> script harness trong hidden_files + thêm 1 script kiểm tra + file này.

## 1. Kết luận ngắn

1. **WebKit sau reboot — ĐÃ CÓ ĐƯỜNG BỀN VỮNG (cơ chế: apt replay của hệ
   thống + OS-intent ledger), không cần vá tay sau mỗi reboot nữa — với 1
   điều kiện: chờ replay cài xong.** Reboot #39 (02:50:48Z) xảy ra GIỮA đợt
   này và là bằng chứng sống: ngay sau boot, plugin GStreamer hệ thống chỉ
   có 32 file (thiếu isomp4/mp4-demux, libav chỉ còn `.dpkg-new`), 4 package
   chưa cài; replay cài dần và tới 03:07Z đủ cả 10 package, plugin dir thật
   270 file, postboot-check PASS toàn bộ. Launch WebKit OK cả 2 chế độ
   (có/không GST env) trên boot #39.
2. **Wrapper MiniBrowser (vá K1) vẫn còn sau 2 reboot (#37, #39)** — nằm
   trong `~/.cache`, sống qua reboot. Thí nghiệm mô phỏng trên boot #38:
   cả bản gốc lẫn bản vá đều launch được khi lib hệ thống đã đủ — tức bản
   vá hiện KHÔNG còn là điểm sống còn cho launch, mà là belt-and-braces
   cho DEBROOT. Giữ nguyên, không revert.
3. **Symlink GST -> debroot của K1 KHÔNG bền vững — và đã có người khác
   tạo lại nó lúc 02:57Z trên boot #39, rồi replay tự thay bằng thư mục
   thật khi cài plugins-good.** Không nên dựa vào symlink nữa; đường bền
   vững là apt/replay. (Người tạo lại symlink 02:57Z chưa xác định được —
   không thấy `ln -s` trong script L7/L5/L4; ghi rõ để khỏi nhận vơ.)
4. **Headroom inotify trên boot #39: 1854 (lúc L4 vite đang chạy) / 248
   (lúc L5 vite đang chạy, 3 lần đo giống hệt).** Ngoài cell vẫn ~61,8k
   watch. Với headroom ~1854 thì 1 vite thường (1578) vừa, vite thứ hai
   chết chắc — vite nối tiếp vẫn BẮT BUỘC.
5. **Đo watch.ignored — XONG, đúng như K7:** vite config gốc giữ
   **1585 watch** (K8 đo 1578); vite config tạm `watch.ignored`
   `["**/**"]` giữ **0 watch** (tổng watch trong cell giữ nguyên 14 như
   lúc chưa bật vite), vẫn phục vụ trang 200. Trade-off stale-module
   (phần C) CHƯA đo được — script lần đầu sai cờ CLI vite 6 + vite B
   mồ côi làm nhiễu phép đo (xem §3.3); script đã sửa cho đợt sau.
6. **Script O8 WebKit đã sửa + chạy lại end-to-end THÀNH CÔNG:
   21/21 PASS, 0 fail, exit 0** (03:26:37–03:27:29Z, vite config tạm
   đã có watch.ignored + LD_LIBRARY_PATH debroot + log append tên theo
   lượt). Đây cũng là bằng chứng decode video WebKit trên boot #39
   (phát mp4 H.264 thật qua app, mask bám track đúng vị trí).
7. **Vite log ghi đè: đã sửa 4 chỗ** (O8 script trong repo; run-k7.sh,
   run-k7-quiet.sh, k8-enospc-vite.sh trong hidden_files). Còn nợ: 52 file
   `clicktest-*.mjs` vẫn mở vite log bằng `"w"` + `run-l7-quiet.sh`
   (đang dùng bởi luồng L7 — KHÔNG sửa khi luồng khác đang chạy).

## 2. WebKit sau reboot — điều tra + xử lý bền vững

### 2.1 Reboot #38 và #39 cắt ngang đợt này

| Boot | `uptime -s` | Ghi chú |
|---|---|---|
| #37 | 2026-11-14 00:55:42Z | K1 §6.3 (WebKit không launch, GST mất) |
| #38 | 2026-11-14 02:24:45Z | Đã chạy lúc L8 bắt đầu (~02:36Z); gap #37→#38 = 1h29'03" |
| #39 | 2026-11-14 02:50:48Z | Xảy ra GIỮA đợt L8 (sau lần đo headroom 2127, trước khi L8 sửa xong O8); gap #38→#39 = 26'03" — sàn gap mới (sàn cũ 19'07") |

- Mọi đo đạc trước 02:50:48Z (launch test 02:43, headroom 2127, apt
  no-op 02:48, wrapper simulation 02:46) đều thuộc boot #38 — đã đo lại
  trên boot #39 ở các mục dưới, số boot #38 chỉ giữ làm tham chiếu.
- `/tmp` bị xóa sau reboot #39 (bản copy wrapper mô phỏng mất — phải tạo
  lại nếu cần chạy lại thí nghiệm đó; kết quả đã lưu trong LIMITS này).

### 2.2 Apt replay của hệ thống LÀ cơ chế bền vững (đã chứng minh bằng reboot #39)

- Replay (tiến trình `sh -c # ... os-intent replay ...`, pid 796 trên boot
  #38, pid 777 trên boot #39) đọc ledger `/var/lib/hatch/os-intent/`
  và cài lại các package đã ghi sau mỗi boot. Ledger hiện tại: 1 entry
  compacted, `added` 170 package (gồm `gstreamer1.0-gl`,
  `gstreamer1.0-plugins-base/good/bad/ugly`, `gstreamer1.0-libav`,
  `gstreamer1.0-x`, `libevent-2.1-7t64`, `libgstreamer1.0-0`,
  `libavif16`, `gstreamer1.0-tools`, ...), `removed` 0 package.
- Diễn biến trên boot #39 (giờ UTC, đo trực tiếp):
  - 02:50:48 boot. 02:56: plugin dir hệ thống 32 file, `libgstlibav.so`
    chỉ còn bản `.dpkg-new`, thiếu `libgstisomp4.so`; `dpkg -s`
    good/bad/ugly: not installed; `dpkg -l` cũng không có.
  - 02:57: symlink `gstreamer-1.0 -> debroot/.../gstreamer-1.0` xuất hiện
    (ai đó tạo lại theo K1 — không xác định được là luồng nào).
  - 03:01–03:06: replay cài `gstreamer1.0-libav` (02:56:06–02:56:49),
    rồi `gstreamer1.0-plugins-good` (trạng thái `iU` lúc 03:06),
    `bad`, `ugly`, `x`; dpkg tự thay symlink bằng thư mục thật.
  - 03:07: đủ 10/10 package (`ii`), plugin dir thật **270 file** (debroot
    269 file — hơn 1 file, chưa rõ file nào; không ảnh hưởng kết luận),
    `libgstisomp4.so` + `libgstlibav.so` đều có, `dpkg --audit` sạch.
  - `apt-cache policy libevent-2.1-7t64` phân giải được (lists đã có
    `azure.archive.ubuntu.com noble*`) — khác K1 lúc 01:0x ("Unable to
    locate package", lists rỗng).
- L8 chạy `apt-get install -y --no-install-recommends` cho 11 package
  (libevent ×2, plugins-base/good/bad/ugly, gl, libav, x, libavif16,
  libgstreamer1.0-0) lúc 02:48Z trên boot #38: **0 upgraded, 0 newly
  installed, 0 to remove** (đã đủ lúc đó), exit 0, log
  `round110-l8/l8-apt-install.log`. Không chạy `apt-get upgrade` (24
  package chờ upgrade — ngoài phạm vi, không đụng).
- **Kết luận:** không cần cài tay sau reboot — chỉ cần CHỜ replay cài xong
  (trên boot #39 mất ~17 phút từ boot tới đủ 10 package; lần sau có thể
  khác). Script postboot-check (§2.4) là cách kiểm tra, không phải cách
  cài. Foreground `apt-get install` của L8 không làm gì thêm (đã đủ) và
  không tranh lock với replay (chạy lúc replay đang nghỉ giữa 2
  transaction; đã kiểm `ps` trước khi chạy).

### 2.3 Launch WebKit thật trên boot #39 (sau replay đủ package)

- Script tối thiểu `round110-l8/l8-webkit-launch.mjs` (Playwright-core
  1.65.0, Xvfb :195): launch headed + `page.goto(about:blank)` +
  `evaluate(1+1)` + userAgent.
  - Chế độ `o8env` (chỉ `GST_PLUGIN_SYSTEM_PATH`, không LD_LIBRARY_PATH —
    đúng như O8 trước khi sửa): **OK, version 27.2, eval 2, 28.392 ms**
    (03:02:01Z; chậm do máy tải cao: load5 ~6, replay + L5/L7 đang chạy).
  - Chế độ `clean` (không GST var nào, không LD_LIBRARY_PATH):
    **OK, version 27.2, eval 2, 26.308 ms** (03:02:53Z).
  - File kết quả: `l8-launch-o8env-b39.json`, `l8-launch-clean-b39.json`.
  - Trên boot #38 (trước reboot #39) cũng đã OK cả 2 chế độ (2.499 ms /
    1.638 ms, lúc máy yên hơn) — `l8-launch-o8env.json`,
    `l8-launch-clean.json`.
- **Decode video trên boot #39 ĐÃ kiểm chứng: O8 end-to-end 21/21
  PASS (§3.2)** — phát mp4 H.264 thật qua app, mask bám track đúng.
  Launch + evaluate OK ở trên không phải bằng chứng duy nhất nữa.

### 2.4 Script kiểm tra/khôi phục sau reboot (mới, trong repo)

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (bash, +x).
- Kiểm tra 5 mục, in PASS/FAIL từng mục, exit 0 khi đủ điều kiện chạy
  WebKit: (1) wrapper đã vá K1; (2) đủ 5 lib hệ thống (libevent, libEGL,
  libavif, libdw, libevdev); (3) plugin GST đủ isomp4 + libav, báo
  `.dpkg-new` còn sót; (4) đủ 10 package apt; (5, tùy chọn
  `--launch-test`) launch WebKit tối thiểu.
- `--repair`: vá lại wrapper (sed 1 dòng, có backup timestamped), tạo lại
  symlink GST -> debroot (chỉ khi plugin hệ thống thiếu), cài apt các
  package thiếu — **chỉ khi lock apt rảnh; nếu replay đang giữ lock thì
  SKIP bước apt và báo rõ, không tranh lock**.
- Chạy thử trên boot #39: lần 1 (03:04Z, giữa lúc replay đang cài):
  FAIL apt (thiếu good/bad/ugly/x) — đúng trạng thái lúc đó; lần 2
  (03:08Z, sau khi replay cài xong): **PASS toàn bộ, kết luận "ĐỦ ĐIỀU
  KIỆN chạy WebKit"**, exit 0. Log: `l8-postboot-check1.log`,
  `l8-postboot-check2.log`.
- Cách dùng cho đợt sau: chạy script này sau mỗi reboot, trước probe
  WebKit đầu tiên; nếu FAIL apt thì chờ replay (không cài tay chen ngang
  khi lock bận).

### 2.5 Wrapper MiniBrowser — mô phỏng bản gốc vs bản vá (boot #38)

- Phương pháp: copy wrapper gốc (`.orig`, backup K1) và wrapper đã vá ra
  `/tmp/l8-wrap-orig|patched`, symlink `bin/`, `lib/`, `sys/lib` về
  bundle thật (wrapper tính `MYDIR` từ đường dẫn của chính nó nên không
  copy trần được); chạy `MiniBrowser about:blank` dưới Xvfb :195 với env
  đã scrub (không LD_LIBRARY_PATH, không GST var), xem tiến trình còn
  sống sau 4s không.
- Kết quả (02:46Z, boot #38, lib hệ thống đã đủ): **cả 2 bản đều ALIVE
  sau 4s** (orig: có thêm cảnh báo Gtk dbus-launch cosmetic; patched:
  chỉ cảnh báo libEGL DRI3). Tức khi lib hệ thống đủ, wrapper gốc cũng
  launch được — bản vá K1 hiện không còn là điểm sống còn cho launch.
- Giữ bản vá (không revert): nó là điều kiện để `LD_LIBRARY_PATH`
  DEBROOT mà probe đặt được giữ lại (bản gốc nuốt mất), và DEBROOT vẫn
  là fallback khi lib hệ thống thiếu (vd ngay sau reboot, trước khi
  replay cài xong). Bản vá đã tồn tại qua reboot #37 và #38 (kiểm
  `grep` sau boot #39: vẫn là dòng vá).
- `/tmp` bị xóa sau reboot #39 nên bản copy mô phỏng đã mất; log thí
  nghiệm chỉ còn trong LIMITS này (không có file raw riêng — ghi nhận
  thiếu sót này; lần sau lưu output ra hidden_files ngay).

## 3. Đo riêng workaround server.watch.ignored (K8 §3.5 mục 2)

Đo lúc 03:25:48–03:26:36Z trên boot #39, trong cửa vite do L8 giữ
(watcher chờ 225s sau khi L5-run31 nhả lock lúc ~03:25:46Z; nhả lock
03:27:30Z). Script: `round110-l8/l8-watch-measure.sh`, log
`l8-watch-measure.log`, log vite A/B riêng theo lượt.

### 3.1 Kết quả A/B (số chính)

| | A: config gốc repo (`vite.config.ts`) | B: config tạm `watch.ignored ["**/**"]` |
|---|---|---|
| Cổng | :5599 | :5599 |
| Tổng watch trong cell trước | 14 | 14 |
| **Tổng watch trong cell lúc vite chạy** | **1598** | **14 (= baseline)** |
| **Watch của tiến trình vite** | **1585** | **0** |
| Trang `/` | 200, 1291 byte | 200, 1093 byte |
| Vite log | `ready in 479 ms` (log `l8-viteA-...log`) | `ready in 479 ms` (log `l8-viteB-...log`) |
| Sau kill | tổng về 14, vite 0 | tổng về 14, vite 0 |

- A = 1585 watch, khớp K8 (1578; +7 file do repo lớn lên). B = **0 watch
  thật** (2 cách đếm độc lập đều 0: tổng cell không đổi + chỉ đếm tiến
  trình vite), vẫn phục vụ trang bình thường.
- **Kết luận: workaround ĐÃ ĐƯỢC CHỨNG MINH bằng số đo riêng** — vite
  với `watch.ignored ["**/**"]` không dùng inotify watch nào. Với
  headroom 248–1854 (xem §5), đây là cách duy nhất để 2 vite cùng sống.
  Đã áp dụng vào config tạm của O8 (§3.2) và khuyến nghị áp dụng cho
  mọi vite tạm của luồng đo (HMR đã tắt trong các config tạm đó nên
  không mất gì thêm — xem trade-off §3.3).
- Lưu ý đo: chỉ số `inotify_fds_of_vite_pid` trong log lần đầu là **0 ở
  cả A lẫn B — SỐ NÀY SAI** (do `pgrep -f "vite --port 5599"` trả về
  tiến trình vỏ npx, không phải node con giữ watch; với B thì pattern
  không khớp dạng `-c <config> --port` nên pid rỗng). Số đúng để dùng
  là `vite_wd` (đếm mọi tiến trình có "vite" trong cmdline) + tổng
  cell. Script đã sửa (hàm `vite_node_pid` + `kill_vite_5599`).

### 3.2 Kiểm chứng chức năng trên vite ignored: O8 end-to-end 21/21

- Chạy `clicktest-87o8-mask-track-webkit.mjs` (đã sửa, xem §4.1) lúc
  03:26:37–03:27:29Z, O8W_SCRATCH=`round110-l8/o8-webkit`,
  DISPLAY=:188 (tự spawn Xvfb), vite dev :5560 với config tạm đã có
  `watch.ignored`, bridge :8861.
- **Kết quả: 21/21 PASS, 0 fail, 0 note, exit 0.** S0–S7 + E0 đều pass;
  video mp4 H.264 phát thật, mask bám track đúng (S5 Δx=0,194 đúng kỳ
  vọng; S7 bóng di chuyển Δx=0,197). Report:
  `o8-webkit/o8w-clicktest-report.json` (21 result `"ok": true`).
  Vite log tên mới theo lượt:
  `o8w-vite-2026-11-14T03-26-37-attempt1.log` ("ready in 163 ms").
- Đây đồng thời là bằng chứng **decode video WebKit trên boot #39**
  (mục §2.3 còn nợ) — decode qua plugin hệ thống đã đủ (không cần
  symlink debroot nữa).

### 3.3 Phần C (trade-off stale-module / hot-reload) — VÔ HIỆU, chưa đo được

- Thiết kế: scratch root `/tmp/l8-vite-root` (index.html + app.js),
  vite thường vs vite ignored; sửa app.js v1→v2 rồi curl lại xem có
  nhận nội dung mới không (kỳ vọng: thường → v2; ignored → v1 cũ do
  module graph không bị invalidate khi không có watcher).
- **Lần chạy này VÔ HIỆU, không dùng số của nó:** (a) script dùng cờ
  `--root` mà vite 6.4.5 không có → cả 2 vite scratch chết ngay lỗi
  `CACError: Unknown option '--root'` (log `l8-scratch-*.log`);
  (b) vite B (phần 3.1) bị mồ côi — xem §3.4 — nên các curl trong phần
  C trúng vite B còn sống (trả index.html của apps/web thay vì app.js).
  Cả 2 dòng C đều ghi `vite_wd=0 before=[<!doctype html>...]` (nội
  dung apps/web, không phải app.js) — số này là rác.
- Script đã sửa (root là positional arg `vite $R ...`; ready-check curl
  phải grep đúng nội dung app.js; kill theo pid node thật) để đợt sau
  chạy lại phần C. Trade-off hiện chỉ là suy luận từ hành vi vite đã
  biết (không watcher → không invalidate module graph → sửa file không
  lan tới trang đang chạy khi chưa restart), KHÔNG phải số đo — ghi rõ
  để khỏi trích như kết quả đo.
- Phạm vi áp dụng an toàn (đã có bằng chứng): vite tạm một-lần-chạy
  của luồng đo (O8, K7, ghost driver...) — không sửa file trong lúc
  chạy, HMR đã tắt. **Không** áp dụng cho dev tương tác (sửa code chờ
  reload) khi chưa có số phần C.

### 3.4 Bài học dọn vite: kill vỏ npx không giết được node con

- Lần chạy đầu: `kill $VB` chỉ giết tiến trình vỏ npx; node con của
  vite B (pid 18589) **sống mồ côi**, tiếp tục phục vụ apps/web trên
  :5599 sau khi script kết thúc; `pkill -f "vite --port 5599"` không
  khớp cmdline dạng `vite -c /tmp/... --port 5599` nên bỏ sót.
- Phát hiện lúc 03:29Z (curl :5599 vẫn 200, `ps` thấy 18589); đã kill
  tay (TERM rồi KILL), kiểm tra :5599 về 000, cell_wd về 14. Không còn
  vite mồ côi nào sau đó.
- Bài học: kill vite phải theo **pid node thật** (tìm bằng
  `pgrep -f "vite.*--port <port>"` rồi lọc cmdline chứa `.bin/vite`),
  và pattern pkill phải khớp cả dạng `-c <config> --port`. Đã sửa trong
  `l8-watch-measure.sh` (hàm `kill_vite_5599`); các script khác (K7,
  K8, O8) dùng `kill $VITE_PID`/spawn nên không dính mẫu này, nhưng
  đợt sau nên kiểm `ps` + `curl` cổng sau khi kill vite trong mọi
  script đo.

## 4. Vite log append theo lượt

### 4.1 Đã sửa

| Script | Đổi | Kiểm chứng |
|---|---|---|
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` (O8, repo) | vite log `"w"` → `"a"` + tên `o8w-vite-<RUN_STAMP>-attemptN.log` (RUN_STAMP = ISO UTC tới giây); cả chỗ đọc lại log khi vite fail | `node --check` OK; chạy lại end-to-end xem §2.3/§3 |
| `hidden_files/round109-k7/run-k7.sh` | `> vite-5184-k7.log` → `>> vite-5184-k7-<stamp>.log` (tên theo lượt, log tên file vào chain-k7.log) | `bash -n` OK |
| `hidden_files/round109-k7/run-k7-quiet.sh` (script xác nhận F6' cho đợt sau) | như trên, tên `vite-5184-k7-quiet-<stamp>.log` | `bash -n` OK |
| `hidden_files/round109-k8/k8-enospc-vite.sh` | `> /tmp/k8-vite1|2.log` → `>> /tmp/k8-vite1|2-<stamp>.log`, cập nhật mọi chỗ grep/tail (giữ nguyên logic ready-check — tên mới tránh false-positive "ready in" từ lần chạy cũ) | `bash -n` OK |

- Backup các file gốc trước khi sửa: `round110-l8/*.orig`
  (`o8-webkit.mjs.orig`, `run-k7.sh.orig`, `run-k7-quiet.sh.orig`,
  `k8-enospc-vite.sh.orig`, `MiniBrowser-wrapper.orig`).
- Lưu ý khi sửa O8: chuỗi `"**/**"` trong comment khối `/** */` chứa
  `*/` nên đóng sớm comment → lỗi syntax; đã diễn đạt lại không dùng
  literal đó trong comment (bài học: không viết glob `**/` trong block
  comment JS).

### 4.2 Chưa sửa (nợ)

- **52 file `apps/web/scripts/clicktest-*.mjs`** vẫn mở vite log bằng
  `"w"` (đếm bằng grep `openSync.*vite.*"w"`, gồm clicktest-77e1,
  51h6, 52i2, 53j5 ×2, 54k7, 55l1, 57n9, 58o1, 58o2, 59p1, ...). Sửa
  hàng loạt ngoài phạm vi 1 luồng — giao đợt sau (mẫu sửa đã có ở O8:
  `"a"` + RUN_STAMP).
- **`hidden_files/round110-l7/run-l7-quiet.sh`** (vite log `>`):
  KHÔNG sửa vì luồng L7 đang chạy trong đợt này (sửa script của luồng
  khác đang chạy có thể phá lượt đo của họ).
- Các probe `.mjs` (probe104f5...) spawn vite qua stdio pipe hoặc log
  riêng, không dùng `>` shell — không thuộc diện sửa này.

## 5. Headroom inotify — đo lại trên boot #39

- Probe K8 (`k8-headroom.py`: `inotify_add_watch` tới ENOSPC):
  - Boot #38 (02:41Z): **2127** (trần 63747).
  - Boot #39, lúc L5 vite đang chạy (03:03Z): **248, 248, 248** (3 lần
    giống hệt; trần 63747; cell thấy 1632 wd — L5 vite giữ 1609, systemd
    14, chrome 9).
  - Boot #39, lúc L4 vite đang chạy (03:08Z): **1854** (trần 63747).
- Suy ra watch ngoài cell: ~61,8k (63747 − 1632 − 248) — khớp K8 (~61,2k),
  dao động theo boot/tải, không phải hằng số.
- Hệ quả: headroom 248 nghĩa là lúc đó KHÔNG vite thường nào khởi động
  thêm được (cần 1578); headroom 1854 thì đúng 1 vite vừa. **Vite nối
  tiếp vẫn bắt buộc; watch.ignored (0 FD) là cách duy nhất để 2 vite
  cùng sống.** Xem §3 sau khi đo xong.

## 6. Phối hợp vite trong đợt 110 (ghi lại để đợt sau khỏi vấp)

- Lock `hidden_files/vite.lock` (mkdir): L5 giữ 02:44–02:51 (run26),
  lại giữ 02:53–~03:07 (run28/run30 — đổi tên owner liên tục), rồi L4
  giữ từ 03:07:18 (vite :5590 + chromium, đang đo; driver xong 03:17:58Z),
  L5-run31 giữ 03:18–~03:25. Watcher của L8 chờ 225s rồi lấy được cửa
  03:25:46Z, làm xong đo watch + O8, nhả lock 03:27:30Z (log
  `l8-vite-window.log`).
- **Lỗi protocol:** lock dir của L4 lúc 03:07:18 KHÔNG có file `owner`
  bên trong (dir trống) — không biết ai giữ nếu chỉ đọc owner. Đề xuất:
  mọi luồng tạo lock phải ghi owner ngay trong cùng lệnh (vd
  `mkdir ... && echo <tên> > .../owner`), và luồng chờ kiểm tra cả
  tiến trình vite đang chạy chứ không chỉ owner file.
- L7 cũng chạy vite lúc 02:58–03:0x trong khi L5 giữ lock (pid 5127
  vite -c ... đã thấy trong `ps` lúc L5 là owner) — có thể là vi phạm
  lock hoặc L7 dùng lock riêng; không kết luận được từ ngoài, ghi lại
  để parent kiểm tra với L7.

## 7. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa (luồng infra không đụng production; L1 là
  luồng duy nhất được sửa production trong đợt 110). md5 hiện tại
  `9b27abe57975ec5b69ec2e21c3fa281c` = bản L1-fix (file chia sẻ
  `round110-preview-md5.txt`: "9b27abe5... 2026-11-14T02:55:02Z L1-fix"),
  không phải cây `ced42efd` của đợt 109 — thay đổi là của L1, không
  phải L8.
- `node --check` O8 script: OK (sau khi sửa lỗi comment `**/`).
- `bash -n` cả 3 script shell đã sửa: OK.
- `tsc`/`vite build` toàn repo: KHÔNG chạy trong luồng này (không sửa
  production; O8 dùng vite dev, không build. Hồi quy build do
  verify/parent chạy — ghi rõ để khỏi nhận vơ.)
- O8 end-to-end sau khi sửa: **21/21 PASS, 0 fail, exit 0**
  (03:26:37–03:27:29Z; vite log mới
  `o8w-vite-2026-11-14T03-26-37-attempt1.log`, "ready in 163 ms").
  Chi tiết xem §3.2.

## 8. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND110_L8_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` (sửa: §2.3,
  §3 config, §4.1 log).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (mới — script kiểm
  tra/khôi phục WebKit sau reboot).
- Harness trong hidden_files (KHÔNG stage — tiền lệ K7/K8: chỉ stage
  file repo): `round109-k7/run-k7.sh`, `round109-k7/run-k7-quiet.sh`,
  `round109-k8/k8-enospc-vite.sh` (sửa log append); dữ liệu đo:
  `round110-l8/` (launch JSON ×4, headroom log, apt log, postboot log ×2,
  script đo watch, backup `.orig` ×5, file này).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round110-l8-infra.txt`
  (NUL-delimited; chỉ 3 file repo trên).
- Cờ done: `hidden_files/round110-l8-done` (tạo sau khi LIMITS + batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa (vá wrapper/symlink/apt khi lock rảnh) + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo lại headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Đo watch.ignored (cần giữ vite.lock trước):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round110-l8/l8-watch-measure.sh
```

## 9. Nợ mở sang đợt sau

1. **Decode video WebKit trên boot #39 — ĐÃ KIỂM CHỨNG** (O8 21/21,
   §3.2: phát mp4 H.264 thật qua app). Không còn nợ mục này.
2. **52 file clicktest-*.mjs còn ghi đè vite log** — sửa hàng loạt theo
   mẫu O8 (`"a"` + RUN_STAMP).
3. **`run-k7-quiet.sh` (xác nhận F6') còn thiếu `vite.config.k7-temp.ts`**
   — K7 đã xóa config tạm sau khi đo; muốn chạy lại phải tạo lại config
   (nên tạo theo mẫu O8: react plugin + `watch.ignored`, HMR tắt) hoặc
   để script tự sinh config như O8. L8 không tự tạo vì đó là việc của
   luồng F6'.
4. **Lock vite không có owner file (L4)** + L7 chạy vite khi L5 giữ lock
   — xem §6; cần chuẩn hóa protocol lock (ghi owner nguyên tử + kiểm
   tra tiến trình vite thật trước khi bật vite mới).
5. **Phần C (trade-off stale-module của watch.ignored) chưa đo** — script
   `l8-watch-measure.sh` đã sửa (root positional, ready-check grep đúng
   nội dung, kill theo pid node); đợt sau chạy lại phần C trong cửa vite
   để có số thật thay vì suy luận.
6. **Kill vite phải theo pid node thật** (xem §3.4) — `kill` vỏ npx và
   `pkill -f "vite --port ..."` đều có thể bỏ sót node con (đã có 1 vite
   B mồ côi trong đợt này, đã dọn).
5. **Symlink GST 02:57Z chưa rõ ai tạo** — nếu là một luồng trong đợt
   110 thì họ cũng đang vá infra song song; parent nên hỏi lại để khỏi
   trùng việc.
6. **Replay apt sau reboot mất ~17 phút mới đủ package WebKit** (boot
   #39) — các probe WebKit đầu đợt sau reboot sẽ fail nếu chạy ngay;
   dùng postboot-check làm cổng trước mọi probe WebKit sau reboot.
7. **Headroom dao động mạnh theo vite đang chạy (248 ↔ 1854 ↔ 2127)** —
   mọi lượt vite nặng nên đo headroom bằng probe trước khi bật vite
   (K8 §3.5), không đếm watch trong cell.
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 109 §4: G1 + mù #22
   chờ user quyết; sửa E4 + A/B xác nhận; 2 MiB offset +4.194.304;
   zombie dạng mạnh; E6 thiếu 1 sự kiện; E1 gate; EPERM probe #29 +
   mù #28; F6' lượt xác nhận lúc yên; birefnet 0 lần; TTS 39 CẤM kiểm
   lại; ci-security.yml 403.
