# PHASE9_ROUND107_I3_2MIB_LIMITS.md — I3: chạy lại H2Q trên máy yên + queue2 hiện diện + H2EXT

> Luồng I3, Phase 9 đợt 107 (VCut Studio). Chạy: 13/11/2026 ~17:41–17:58Z
> (Sat 14/11 00:41–00:58 +07). Boot `14:50:59Z` (reboot #33) suốt lượt,
> KHÔNG reboot trong lúc đo. Repo local `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ main chat.
> Không sửa production code — preview.tsx md5 `ced42efd785724c8c0d1b16fc32c7341`
> (đầu = cuối lượt, khớp đợt 106).
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B) + c8 cùng thư mục. **Cấm:** TTS 39, birefnet,
> `.github/workflows/*`. Prereg: `hidden_files/round107-i3/prereg-i3.md`
> (viết TRƯỚC khi chạy, bar: ≥1 run tới bước media VÀ GST log >0 byte).

## Kết luận chính (TL;DR)

1. **Queue2 CÓ MẶT trong pipeline WebKit — lần đầu đo được trực tiếp.**
   H2Q (c2 blob-direct, GST `queue2:5,...`, DOT, shim H2 v3) 3/3 run
   playOk: GST log 7.626–7.782 dòng `queue2` mỗi run (element `queue2-0`);
   DOT 6/15 file có `queue2-0`, label ghi `ring-buffer-max-size=2097152`
   (= 2 MiB đúng hằng số cần truy nguyên), `current-level-bytes=1884314`
   lúc READY_PAUSED. Vị trí: `typefindelement0 src → queue2-0 sink`
   (caps `video/quicktime`) → `queue2-0 src → parsebin0 sink` → qtdemux0.
   Queue2 nằm **SAU typefind, TRƯỚC parsebin/qtdemux** — không nằm giữa
   webkitwebsrc và typefind. Pull log: 0 PULL `elem=queue2` (queue2
   push-mode, không `pull_range` — phù hợp với vị trí này).
2. **Nhân quả queue2→splice VẪN CHƯA chứng minh.** 3/3 run H2Q SẠCH:
   398 PULL/run toàn EXACT (198 qtdemux0 + 198 typefind + 1 NODATA mỗi
   loại), 0 spliced pulls (analyze-h2.py). Không có run bogus nào để đối
   chiếu offset splice với ring buffer 2 MiB. Giả thuyết "queue2 không có
   trong pipeline" bị bác; ứng viên queue2 vẫn đứng, nhưng chưa hẹp thêm
   về nhân quả. Đây là tiến bộ thật so với H2 (đợt 106: 0 byte dữ liệu).
3. **Nguyên nhân lỗi H2 (đợt 106) đã tìm ra: THIẾU `GST_PLUGIN_PATH`.**
   I3 tái hiện đúng 3/3 lỗi `page.evaluate: Target page, context or
   browser has been closed` khi chạy không có biến này, rồi sửa bằng một
   dòng env và H2Q chạy 3/3 playOk. Đây là lỗi **môi trường chạy probe**,
   không phải lỗi sản phẩm, không phải OOM, không phải GST_DEBUG/shim
   (xem §2). Header comment của runner gốc đã ghi cách chạy gồm
   `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, nhưng H2
   không ghi biến này trong `h2-run.log` — bài học phương pháp cho mọi
   lượt sau (xem §7).
4. **H2EXT (.mp4 vs noext, progressive http, 1 run mỗi biến thể): cả hai
   đều sạch** (0 spliced pulls, playOk: EXT 189 frames, NOEXT 165 frames).
   Dấu vết extension còn lại duy nhất: typefind tìm caps nhanh hơn có đuôi
   (EXT 0,184 s vs NOEXT 0,369 s — n=1, chỉ là quan sát, không kết luận).
   Mitigation `.mp4` cho **blob URL không chuyển thẳng được**: blob: URL
   không mang extension, nên H2EXT chỉ đo được hiệu ứng extension trên
   đường http; đường blob vẫn mở (xem §5).
5. **H2C8 KHÔNG CHẠY** (cần ≥1 run bogus trên c8; tỉ lệ bogus đợt này
   0/5 trên c2 nên không lấy mẫu trong lượt) — nợ mở.

## 1. H2Q lần 1 — tái hiện lỗi đợt 106 (không GST_PLUGIN_PATH)

- Lệnh: `DISPLAY=:197 GST_DEBUG_BLOB=1 node benchmarks/render/webkit_blob_flaky_107i3_2mib.mjs H2Q 3`
  (runner I3 = copy runner H2, chỉ đổi đường dẫn sang `round107-i3`).
- Kết quả: 3/3 run lỗi `page.evaluate: Target page, context or browser
  has been closed` (17:42:17.882Z / 19.326Z / 20.774Z). GST log 0 byte
  cả 3 file; pull log 641 B (10 dòng `F2PROBE start`, không có
  `WebKitWebProcess`). Bar prereg KHÔNG đạt ở lần chạy này.
- Chẩn đoán mới (watcher 1 s + stdout launcher đầy đủ — hai thứ đợt 106
  thiếu): WebKitWebProcess **CÓ spawn** (pid 30673 run1, 30764 run2, thấy
  trong watcher lúc 17:42:17Z/18Z) rồi chết trong ~1–2 s, đúng lúc
  `page.evaluate` lỗi. Pull log không có dòng start-line WebProcess vì
  chết trước khi destructor flush (khớp giả thuyết (b) LIMITS 106 §3 —
  nay có bằng chứng watcher độc lập, không còn là suy đoán).
- RAM lúc run1 chết: MemAvailable ~1.044.396 kB (~1 GB) → **KHÔNG phải
  OOM**. Load lúc chết 3,85/1,66/0,81. journalctl 17:41–17:44Z và dmesg:
  không có dòng webkit/oom/segfault/crash nào. ENV probe (browser không
  GST/LD_PRELOAD) chạy OK → MiniBrowser/Playwright không hỏng.
- Dữ liệu lần 1 đã lưu nguyên ở `hidden_files/round107-i3/nogst/` (3 GST
  log 0 byte, 3 pull log 641 B, JSON 3 case lỗi, stdout `i3-h2q.log`).

## 2. Chẩn đoán phân biệt — loại trừ GST/shim, khoanh vùng tới "gán src"

- Diag runner (`benchmarks/render/webkit_blob_flaky_107i3_diag.mjs`,
  thêm `I3_DIAG=none|gst|preload|both`): mode `none` (không GST_DEBUG,
  không LD_PRELOAD) 1 run (Q6_START=11) **vẫn chết y hệt**
  (17:45:10.907Z) → loại GST_DEBUG và shim khỏi danh sách nghi phạm.
- Minprobe (`benchmarks/render/i3_minprobe_107.mjs`, không GST/shim):
  step1 evaluate thường OK; step2 (video http + play 5 s) crash ~117 ms
  sau khi bắt đầu, kèm `EVENT page crash`; stepA (video trần, không src)
  OK 3 s; stepB (gán src + `preload=metadata`, không play) crash ~38 ms
  sau khi gán src → điểm chết là **lúc tạo media pipeline khi gán src**,
  không phải `play()`, không phải decode frame, không phải pool/blob.
- MiniBrowser trực tiếp (`pw_run.sh http://127.0.0.1:8934/`, trang có
  `<video autoplay>`), stderr bắt được:
  ```
  GStreamer element appsink not found. Please install it.
  GStreamer element autoaudiosink not found. Please install it
  (WebKitWebProcess): GLib-GObject-CRITICAL: invalid (NULL) pointer instance
  (WebKitWebProcess): g_signal_connect_data: assertion 'G_TYPE_CHECK_INSTANCE (instance)' failed
  (MiniBrowser): WARNING: WebProcess CRASHED
  ```
  Trong khi `gst-inspect-1.0 appsink` / `autoaudiosink` trên hệ thống đều
  tìm thấy (libgstapp.so có trong `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/`).
  → WebProcess không thấy plugin hệ thống vì `GST_PLUGIN_PATH` không được
  set trong môi trường chạy probe.
- Kiểm chứng đảo ngược: với
  `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`, minprobe
  step2 chạy OK (ct 5.095, 123 frames, playErr null) trên cả display
  :197 và :198 → không phải lỗi display, không phải lỗi Xvfb.
- Ghi chú: các luồng đợt 107 khác dùng Chrome (headless) nên không gặp
  lỗi này; chỉ probe WebKitGTK bị ảnh hưởng.

## 3. H2Q lần 2 — phép thử queue2 chạy được (có GST_PLUGIN_PATH)

- Lệnh: `DISPLAY=:198 GST_DEBUG_BLOB=1 GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
  node benchmarks/render/webkit_blob_flaky_107i3_2mib.mjs H2Q 3`
  (stdout đầy đủ: `hidden_files/round107-i3/i3-h2q-gst.log`).

| Run | playOk | Frames | Dropped | finalCt | GST log (byte) | Dòng queue2 | memAvailMB |
|---|---|---|---|---|---|---|---|
| 1 | true | 191 | 0 | 8 | 2.029.888 | 7.757 | 3.618 |
| 2 | true | 191 | 0 | 8 | 2.033.941 | 7.782 | 3.641 |
| 3 | true | 189 | 0 | 8 | 2.001.222 | 7.626 | 3.478 |

- Bar prereg **ĐẠT**: 3/3 run tới bước media, GST log >0 byte.
- Phân tích pull log (`analyze-h2.py`, output
  `hidden_files/round107-i3/i3-h2q-analysis-run{1,2,3}.txt`):
  398 PULL/run, toàn EXACT; `BOGUS RUN: NO (0 spliced pulls)` cả 3 run.
  APUSH 202, ATAKE 736 (run1). Scan typefind vẫn diễn ra đầy đủ ở
  adapter webkitwebsrc (push: toàn file @0; 32 B @2139941 = EOF−32;
  128 B @2139845 = EOF−128; 2.119.493 B @20480; 1.069.987 B @1069986 =
  size//2; 2.066.245 B @73728) nhưng không splice lần này.
- DOT (`hidden_files/round107-i3/dot/`, 15 file): 6 file chứa `queue2-0`;
  node label `ring-buffer-max-size=2097152`, `current-level-bytes=1884314`
  (READY_PAUSED). Cạnh: `typefindelement0 src → queue2-0 sink`
  (caps `video/quicktime, variant: iso`) và `queue2-0 src → parsebin0
  sink`. Các element khác cùng dot: qtdemux0, multiqueue0, decodebin3-0,
  uridecodebin3, urisourcebin0, typefind, h264parse0, deinterlace.
- Tỉ lệ bogus 0/3 khác G6 (blob-direct 2/3): máy yên hơn, RAM cao hơn
  (3,5–3,6 GB lúc đo vs 1,1–2,1 GB ở G6), load 1,2–1,5. Đây là race theo
  thời gian/tải; n=3 nhỏ nên **không tách được** yếu tố nào quyết định,
  và không được ghi "GST_PLUGIN_PATH làm hết bogus" — biến này chỉ sửa
  crash khởi tạo pipeline, không có cơ chế ảnh hưởng splice.

## 4. H2EXT — extension `.mp4` vs noext (progressive http)

- Lệnh: như H2Q lần 2, mode `H2EXT 1` (stdout `i3-h2ext.log`).
- Kết quả: EXT playOk=true, 189 frames; NOEXT playOk=true, 165 frames;
  cả hai `BOGUS RUN: NO (0 spliced pulls)`, 398 PULL mỗi run, GST log
  230.029 / 213.993 byte. Không đo được khác biệt bogus (cả hai đều sạch).
- Dấu vết duy nhất: typefind tìm caps nhanh hơn khi có đuôi —
  EXT `found caps` lúc 0,184 s vs NOEXT 0,369 s (typefindelement0;
  typefind: 0,207 s vs 0,398 s), tức NOEXT chậm hơn ~185 ms. n=1 mỗi
  biến thể → chỉ ghi là quan sát, không kết luận thống kê.
- Khác biệt đường đi so với blob: ở progressive, adapter webkitwebsrc
  chỉ có **1 push toàn file** (2.139.973 B @0) cả EXT lẫn NOEXT; các lần
  peek scan của typefind không hiện thành push riêng (chúng là take từ
  buffer adapter). Vì vậy H2EXT **không đo được** số lần scan 40-vs-1
  của G6 §4 trên đường này; số đó vẫn chỉ có từ đo offline filesrc.
- Hệ quả cho mitigation: H2EXT đo hiệu ứng extension trên đường http.
  Nhưng mitigation gốc (G6 §8.5a) nhắm vào **blob URL** — mà blob: URL
  không mang extension được — nên phép đo này không chứng minh mitigation
  cho đường blob. Cần một cơ chế khác để typefind nhận caps sớm trên
  đường blob (nợ mở, xem §6).

## 5. H2C8 — không chạy

- Cần ≥1 run bogus trên c8 để xem offset splice có cố định 2097152
  không. Tỉ lệ bogus đợt này là 0/5 trên c2 (3 H2Q + 2 H2EXT) nên không
  lấy được mẫu bogus trong thời gian còn lại của lượt. G6C8 0/2 sạch vẫn
  là số duy nhất về c8.

## 6. Kết luận trung thực về queue2 (cập nhật sau I3)

- **Đã chứng minh:** queue2 (`queue2-0`) có trong pipeline phát blob
  của WebKit; ring buffer đúng 2097152 byte (DOT + gst-inspect G6);
  vị trí sau typefind, trước parsebin/qtdemux; push-mode (0 PULL
  `elem=queue2`).
- **Chưa chứng minh:** queue2 gây splice. 3 run có queue2 đầy đủ đều
  sạch; không có run bogus nào để đối chiếu. Cần run bogus trên cùng
  cấu hình (GST queue2:5 + DOT + shim) rồi kiểm tra (a) offset splice
  có đổi khi `max-size-bytes` đổi không, (b) `current-level-bytes` của
  queue2 lúc splice. Thí nghiệm phân biệt này vẫn là bước tiếp theo
  quyết định (G6 §8.2), chưa làm được vì chưa có run bogus.
- **Đã loại:** "queue2 không có trong pipeline" (bị bác bằng 3 nguồn
  độc lập: GST log, DOT, vị trí cạnh); "H2 chết do OOM/tải nặng"
  (RAM ~1 GB lúc chết, load <4); "H2 chết do GST_DEBUG/shim"
  (diag `none` vẫn chết); "lỗi display/Xvfb" (crash trên cả :197/:198,
  hết crash khi set GST_PLUGIN_PATH).

## 7. Phương pháp và giới hạn

- Không sửa production code, không đụng file luồng khác (display :197/:198
  riêng, port 8931 runner + 8932/8933/8934 minprobe/serve riêng, thư mục
  `round107-i3` riêng). Không push. Không release/tag.
- **Bài học vận hành (quan trọng nhất lượt này):** mọi probe WebKitGTK
  sau này PHẢI chạy với
  `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` (như header
  comment runner gốc đã ghi). Thiếu biến này, WebProcess crash ngay khi
  gán src video và mọi phép thử media đều cho 0 byte dữ liệu — đúng như
  đợt 106. Ghi đầy đủ env vào run log; `h2-run.log` đợt 106 không ghi
  biến này nên lỗi bị hiểu lầm là "browser chết không rõ nguyên nhân".
- Mẫu nhỏ: H2Q n=3, H2EXT n=1+1. Mọi so sánh tỉ lệ bogus/ thời gian caps
  đều thiếu lực thống kê; chỉ dùng làm quan sát.
- Diag `none` (run11) chỉ có trong JSON diag riêng, không gộp vào JSON
  chính (để JSON chính sạch: 5 case đều playOk).
- Minprobe step3 (fetch blob + blob URL + play) chưa chạy độc lập (H2Q
  lần 2 đã bao phủ đường blob-direct đầy đủ nên không cần nữa).
- Registry GStreamer (`~/.cache/gstreamer-1.0/registry.x86_64.bin`) được
  rebuild lúc 17:49:29Z bởi lần chạy `gst-launch` kiểm tra — không phải
  nguyên nhân (crash vẫn tái hiện sau đó khi thiếu GST_PLUGIN_PATH, và
  hết crash khi set biến này mà không đụng registry).

## 8. Nợ mở cho đợt sau

1. **Thí nghiệm phân biệt queue2 (quyết định):** chạy H2Q tới khi có ≥1
   run bogus (máy tải nặng hơn có thể giúp, theo hướng race), rồi đổi
   `max-size-bytes` của queue2 (qua playbin `buffer-size` nếu pipeline
   dùng nó) và xem offset splice có dời theo không. Cần GST_PLUGIN_PATH
   trong mọi lần chạy.
2. **H2C8:** chạy thêm run c8 blob-direct tới khi có ≥1 run bogus để xem
   offset có cố định 2097152 không (G6C8 0/2 vẫn là số duy nhất).
3. **Mitigation `.mp4` trên đường blob:** blob: URL không mang extension;
   cần cơ chế khác giúp typefind nhận caps sớm (vd: kiểm tra xem
   `Content-Type`/Blob type có được WebKit truyền xuống typefind không,
   hoặc preload đầy đủ trước khi playbin seek — G6 §8.5c).
4. Nợ đứng yên từ đợt 106 (xem LIMITS gộp đợt 106 §4): G1 chờ user quyết
   metric G5/M2, mù #22 chờ user quyết mức tin cậy, re-arm, zombie gate
   (b), blur B-band, EPERM probe #26 + mù #25, birefnet 0 lần, TTS 39 CẤM
   kiểm lại, ci-security.yml 403, release gate.

## 9. Batch stage (KHÔNG push)

`phase9-round107-i3-2mib.txt` (7 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_107i3_2mib.mjs` (runner I3: copy
  runner H2, chỉ đổi đường dẫn sang `round107-i3`)
- `benchmarks/render/webkit_blob_flaky_107i3_diag.mjs` (runner chẩn đoán:
  thêm `I3_DIAG=none|gst|preload|both`)
- `benchmarks/render/i3_minprobe_107.mjs` (minprobe tách bước chết:
  evaluate thường / video http / blob)
- `benchmarks/render/i3_minprobe2_107.mjs` (minprobe2: video trần /
  metadata-only)
- `benchmarks/results/webkit-blob-flaky-107i3-2mib.json` (5 case, đều
  playOk: 3 H2Q + EXT + NOEXT)
- `benchmarks/results/webkit-blob-flaky-107i3-diag.json` (1 case run11,
  mode `none`, lỗi page.evaluate — bằng chứng loại GST/shim)
- `docs/PHASE9_ROUND107_I3_2MIB_LIMITS.md` (file này)

Không stage binary (`.so` ở lại `hidden_files/round107-i3/`, copy từ đợt
106). Không stage log nhị phân. Dữ liệu thô đầy đủ ở
`hidden_files/round107-i3/` (gst/pull/dot/analysis/log/nogst/).
KHÔNG push.
