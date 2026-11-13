# Phase 9 đợt 90 — R3: WebKit clip D — prefetch blob cho clip proxy/HTTP nhỏ (ĐÃ SHIP, CÓ GIỚI HẠN)

- **Nhiệm vụ:** đóng nợ LIMITS gộp đợt 89 §4 mục 3 — prefetch blob cho
  clip proxy/HTTP nhỏ (hướng mạnh nhất từ Q6: F4 blob 2/2 + N1 P6 5/5
  = 7/7 loop sạch khi toàn bộ file ở trong bộ nhớ).
- **Kết luận ngắn:** **ĐÃ SHIP prefetch blob vào production
  (`MediaPool.videoFor`, `apps/web/src/media.ts`) với ngưỡng 8 MiB.**
  Clip D thật (1,3 MB): **loop 5/5 ở cả 8 run** (P1 6/6 + P2 2/2, build
  16 MiB và build 8 MiB) so với baseline progressive 1/3 trên cùng
  boot (Q6: 0/5). **Giới hạn đo được:** blob KHÔNG cứu được clip
  10–14 MB bitrate cao (P3a 0/4 + P3b 0/2 dưới build 16 MiB) — và
  chính clip đó qua progressive cũng fail tương tự (B8 1/3, B16 1/3)
  nên không kết luận blob gây lỗi; nhưng load-probe tách riêng cho
  thấy blob 10,2 MB bitrate thực tế chỉ play được 2/3 (progressive
  3/3). Vì vậy **ngưỡng chốt 8 MiB** (dưới vùng đã thấy lỗi), proxy
  dài hơn fallback về progressive như cũ — không hồi quy, chỉ không
  được fix race. **Câu hỏi mở Q6 §6.4 đã có đáp án bằng số:**
  `buffered.end(0) >= duration` KHÔNG tương quan với pass (đầy mà
  vẫn fail 7/20 run) — không dùng làm tín hiệu gate.
- **Probe:** `benchmarks/render/webkit_loop_d_blob_prefetch_90r3.mjs`
  (server HTTP range-support port 8897, clip tại `/tmp/q6r3/clips/`,
  encode lại sau reboot, KHÔNG stage binary) + load-probe tách riêng
  `benchmarks/render/webkit_blob_load_90r3.mjs` (port 8898).
  Kết quả: `benchmarks/results/webkit-loop-d-blob-prefetch-90r3.json`
  (27 run) + `benchmarks/results/webkit-blob-load-90r3.json` (6 run).
- **Môi trường đo:** WebKitGTK 27.2 (UA Safari 27.2), headed, Xvfb
  :199, `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0`,
  VM 4 vCPU, RAM khả dụng ~1,6–2,1 GB, `hardwareConcurrency` 4,
  MediaRecorder `undefined`. Hai boot khác nhau trong lượt (reboot
  giữa chừng, xem §5): lượt 1 tải nặng (load ~5,4, 9 luồng đợt 90
  chạy song song), lượt 2 sau reboot tải nhẹ (load ~0,6–2,1).
  Mỗi run loop = 5 vòng clip 4 s, 24 fps, 1280×720, libx264.
  Pass = đủ 5 vòng `ended`, không stall ≥ 1,5 s (như Q6).

## 1. Implement production (media.ts — MediaPool.videoFor)

`MediaPool.videoFor(item)` là điểm duy nhất gán `proxyUrl` vào `src`
của `<video>` preview (2 chỗ còn lại trong `preview.tsx` dùng
`proxyUrl ?? url` cho reverse-WebCodecs, không phải element src).
Prefetch chạy ở đây nên mọi đường preview proxy/HTTP đều được hưởng,
không sửa call-site nào khác.

- **Ngưỡng:** `BLOB_PREFETCH_MAX_BYTES = 8 MiB` (chọn theo §3, sửa từ
  16 MiB sau khi đo xong); tổng blob cache kẹp
  `BLOB_PREFETCH_TOTAL_CAP_BYTES = 64 MiB` (FIFO thu hồi blob cũ
  nhất); fetch timeout 30 s.
- **Quyết định size:** `proxySizeBytes` đã biết (bridge trả) mà
  > ngưỡng thì khỏi fetch; chưa biết size thì fetch streaming có kẹp
  (đọc qua `ReadableStream.getReader`, abort ngay khi vượt ngưỡng —
  cả khi `Content-Length` nói dối hoặc vắng mặt; fallback
  `arrayBuffer()` khi không có body stream). Clip gốc của item
  (`item.file.size`) cũng được dùng khi không có proxyUrl.
- **Đổi src an toàn:** chỉ swap `src` sang blob khi element còn
  "sạch" (`paused && currentTime === 0 && !seeking`) — đang phát thì
  KHÔNG đổi giữa chừng (đổi src reset playback); blob đã cache sẽ
  được dùng ở lần `videoFor` sau (khi element sạch) hoặc lần tạo
  element mới. Fetch chạy nền, dedup theo itemId; quyết định
  "không prefetch" được ghi nhớ theo từng source URL để `videoFor`
  gọi mỗi frame không thành fetch storm (bug đã bắt được ở unit test,
  xem §4).
- **Thu hồi blob URL:** khi source URL đổi, khi blob lỗi (error
  handler), khi vượt cap tổng (FIFO), hoặc khi caller gọi
  `revokeBlobPrefetch(itemId?)`. Element bị `dropElement` KHÔNG thu
  hồi blob (element tạo lại dùng lại blob đã có). Chỉ thu hồi blob do
  prefetch tạo (có trong map nội bộ); blob: URL gốc của local import
  không bao giờ bị đụng.
- **Fallback:** fetch lỗi / HTTP lỗi / quá ngưỡng / timeout / máy yếu
  (`navigator.deviceMemory < 1`) → phát bằng URL gốc như cũ, không
  retry vô hạn. Error handler cũ của proxy (lỗi → về `item.url` 1
  lần) giữ nguyên, cộng thêm thu hồi blob lỗi.
- **Chẩn đoán:** `pool.blobPrefetchInfo(item)` trả
  `{mode: "blob"|"pending"|"skipped"|"none", bytes?, source?}` để
  probe/test đọc (không ảnh hưởng hành vi phát). Hằng số +
  `isBlobPrefetchCandidateUrl` / `knownProxySizeBytesForPrefetch` /
  `isLowMemoryDeviceForPrefetch` được export để test khóa.

## 2. Validate trên production (probe loop-D, code production thật)

Probe bundle `media.ts` thật bằng esbuild rồi chạy loop trên WebKit
thật qua `MediaPool.videoFor` (không reimplement logic). Các mode:

| mode | clip | đường | pass | ghi chú |
|------|------|-------|------|---------|
| B0 | d.mp4 1,3 MB | progressive thuần | 1/3 | baseline boot này (Q6: 0/5) |
| P1 | d.mp4 1,3 MB | pool, size đã biết | **6/6** | blobReady 70–669 ms |
| P2 | d.mp4 1,3 MB | pool, size chưa biết | **2/2** | blobReady 77–78 ms |
| P3a | d8.mp4 10,8 MB noise 21,6 Mbps | pool, build 16 MiB | 0/4 | §3 |
| P3b | d16.mp4 14,3 MB noise 28,6 Mbps | pool, build 16 MiB | 0/2 | §3 |
| P3a-run5 | d8.mp4 | pool, build 8 MiB | 1/1 | **skipped đúng**, pass dạng progressive |
| B8 | d8.mp4 | progressive thuần | 1/3 | control §3 |
| B16 | d16.mp4 | progressive thuần | 1/3 | control §3 |
| P4 | d32.mp4 35,0 MB | pool, quá ngưỡng | 1/2 | skipped đúng, như baseline |
| P5 | 404 | pool, fetch lỗi | 0/1 | skipped, không crash/hang |
| P1-run6 | d.mp4 | pool, build 8 MiB | 1/1 | re-validate sau khi hạ ngưỡng |

- **P1+P2 = 8/8 pass, 0 stall, 313–501 frame/run** (đủ 5 vòng, resume
  median 211–1089 ms). Baseline B0 trên cùng boot chỉ 1/3 (run1
  fail 4/5 stall 16,8 s ở ct=3,958; run2 fail 0/5 stall 40,1 s ở
  ct=0,667; run3 pass). So với Q6 (B0 0/5, F4 blob 2/2): prefetch
  production tái hiện đúng hiệu quả của F4 trên clip D thật.
- **blobReadyMs (14 lần play bằng blob): min 70, median 182, max
  895 ms** — fetch 1,3 MB trên localhost xong trong < 1 s; cửa sổ
  "videoFor gọi trước khi user bấm play" trong app thật thường dài
  hơn thế nhiều nên swap kịp trước lần play đầu.
- **P4 (quá ngưỡng):** pool báo `skipped`, `src` giữ http, không
  fetch — fallback đúng thiết kế; loop 1/2 như baseline (run1 fail
  2 stall ngắn, run2 pass). Không hồi quy.
- **P5 (404):** pool báo `skipped`, play reject "The operation is
  not supported.", 0 frame, không stall, không hang, không crash.
  Lưu ý: probe chỉ play 1 lần nên chưa chứng minh error handler đã
  đổi `src` về `item.url` — phần đó được khóa bằng unit test (§4),
  không claim hơn.

## 3. Ngưỡng 8 MiB — vì sao không phải 16 MiB

Clip noise 10,8/14,3 MB được sinh bằng `testsrc2 + noise` để đạt đủ
byte trong 4 s — nhưng noise đồng thời đẩy bitrate lên 21,6/28,6 Mbps
(decode nặng gấp ~8–10× proxy thật). Kết quả loop:

- P3a (blob, build 16 MiB): 0/4 — run1: 1 vòng rồi kẹt seeking sau
  restart (`seeked`=0, ct=0, không stall vì `seeking=true` nên
  detector miễn); run2/run3: blob play bị reject "not supported" →
  error handler thu hồi blob → skipped → fallback http, 0 frame;
  run4: 1 vòng với 0 frame rồi paused ở 0, blob bị thu hồi.
- P3b (blob, build 16 MiB): 0/2 — run1: stall kinh điển ct=2,375
  đứng 35,8 s, 6 frame; run2: 1 vòng 0 frame rồi paused ở 0.
- Control progressive cùng clip: B8 1/3, B16 1/3 — clip noise fail
  cả khi không có blob (B8-run1/2 tải nặng fail 3/5 và 1/5, 36/11
  frame; B16-run2/3 fail 1/5 và 2/5 với stall 31,6 s). **Nên không
  kết luận blob gây lỗi loop** — nội dung + tải cũng đủ gây fail.
- **Load-probe tách riêng (d40.mp4: 40 s, 720p, 2 Mbps, 10,2 MB —
  cùng cỡ file, bitrate thực tế của proxy CRF 23):** chỉ đo load +
  phát 8 s, không loop. Blob (P6) **2/3** (run1 play-timeout-10s,
  0 frame; run2/3 play OK, 185/186 frame, ct ~7,7 s); progressive
  (B40) **3/3** (136–185 frame). Cùng file, cùng boot: blob kém
  hơn progressive 1 run và run lỗi là play không bao giờ bắt đầu
  (pipeline không khởi động, không phải stall giữa chừng).
- **Quyết định:** hạ ngưỡng 16 → **8 MiB**. Vùng đã chứng minh tốt
  là ≤ 1,3 MB (8/8); vùng đã thấy lỗi bắt đầu ở 10 MB (cả load lẫn
  loop). 8 MiB nằm dưới vùng lỗi với biên độ, vẫn phủ proxy 720p
  CRF 23 (~2 Mbps) dài tới ~32 s — đa số clip timeline ngắn hơn;
  proxy dài hơn fallback về progressive (hành vi cũ, không hồi
  quy). Khoảng 1,3–10 MB chưa có điểm đo với bitrate thực tế — nợ
  đo tiếp (xem §6). Sau khi hạ ngưỡng, re-validate: P1-run6 pass
  5/5 (blob 115 ms); P3a-run5 **skipped đúng** và pass 5/5 dạng
  progressive trên boot yên (382 frame) — logic ngưỡng hoạt động
  end-to-end.

## 4. Phân tích hậu nghiệm: buffered vs pass (câu hỏi mở Q6 §6.4)

JSON Q6 **không chứa dữ liệu này** (chỉ lưu summary, `samples` và
`buffered` không được ghi — kiểm chứng trực tiếp: 0/27 case có
`buffered`). Probe đợt này ghi `buf` + `dur` vào từng sample nên
trả lời được bằng số mới (27 run loop + 6 run load không có
buffered — chỉ tính 27 run loop):

| | pass | fail |
|---|---|---|
| `buffered.end(0) >= duration` lúc play đầu (full) | 13 | 7 |
| chưa đầy (not-full) | 0 | 4 |
| không có dữ liệu (chưa play được) | 0 | 3 |

- **Full buffer KHÔNG dự đoán pass:** 7/20 run đầy buffer vẫn fail
  (gồm B0-run1/2, P4-run1, B8-run1/2, B16-run2/3 — buffered
  `[[0,4]]` đầy từ sample đầu nhưng vẫn stall). Q6 ghi "buffered
  đầy ngay từ đầu" nay có số xác nhận.
- Not-full (4 run, toàn clip blob 10–14 MB, bufEnd 1,9–2,6/4 s)
  thì 0 pass — nhưng n nhỏ và cùng nhóm clip lỗi load nên chỉ là
  tín hiệu yếu, không đủ làm gate.
- **Kết luận: không dùng `buffered` làm tín hiệu gate/preroll.**
  (Và không đầu tư thêm vào delay/gate/load()/canplay như Q6 đã
  chốt — đợt này không thử lại các hướng đó.)

## 5. Hồi quy + môi trường

- **Unit test mới** `apps/web/src/media.blobPrefetch90R3.test.ts`:
  **19/19 pass** (esbuild bundle rồi chạy node — media.ts import
  `"./lib"` không đuôi nên Node strip-types không resolve được,
  xem ghi chú trong file). Bao phủ: ngưỡng, skip khi quá cap,
  stream abort khi vượt cap, Content-Length nói trước, fetch
  reject/404, path arrayBuffer, KHÔNG swap khi đang phát (pause về
  0 thì swap), dropElement giữ blob, revoke + fetch lại, máy yếu,
  blob: local không fetch, lỗi trên blob src → thu hồi + fallback,
  FIFO vượt cap tổng 64 MiB, dedup khi pending. **Bug thật bắt
  được nhờ test:** `startBlobPrefetch` thiếu guard `blobSkipped`
  nên videoFor gọi mỗi frame sẽ fetch lại vô hạn sau mỗi lần fail
  (test "không fetch lại" fail 2 !== 1) — đã sửa bằng guard, test
  xanh lại 19/19.
- **Hồi quy chạy lại:** `webkitLoopRestart80H5` PASS,
  `webkitRestartTrace85M4` PASS, `seek.test.ts` 20 passed.
- **tsc web 0 lỗi** (thêm test file vào `exclude` của
  `apps/web/tsconfig.json` theo quy ước repo — test dùng import
  `.ts`); **vite build pass** (7,00 s lần cuối; lần đầu 50,63 s).
- **Bug probe đã gặp và sửa:** `toUpperCase()` toàn bộ mode làm
  `CLIPS["P3A"]` undefined rồi throw trong chính catch-block
  (`CLIPS[mode].file`) khiến tiến trình P3a/P3b chết lặng, không ghi
  case nào (mất 4 run lượt đầu). Đã sửa: match mode không phân biệt
  hoa/thường + catch-block dùng `?.` — chạy lại P3a/P3b đủ số.
- **VM reboot giữa lượt (uptime reset, ~15:29):** /tmp mất hết
  (clip, bundle, Xvfb, smoke script), GStreamer về 0 plugin,
  gschemas.compiled về bản stale 2.349 B. Khôi phục theo đường vòng
  Q6: `dpkg-deb -x` 170 .deb cache (đủ) ra
  `~/workspace/tmp-q6r3-debroot` (413 MB, **để trong workspace để
  lần reboot sau còn dùng**, không để /tmp) + `cp -an` vào `/` →
  269 plugin; `glib-compile-schemas` → 41.821 B; sinh lại clip
  (d.mp4 byte-identical 1.320.168; d8/d16/d32 lệch < 1% do encode
  không xác định — đã cập nhật size hardcode trong probe); Xvfb
  :199 dựng lên ngay lần thử 1; smoke WebKit OK. Các run trước
  reboot (tải nặng) và sau reboot (tải nhẹ) được ghi rõ boot/tải
  khác nhau trong §2–§3 — so sánh B8 trước/sau reboot (0/2 → 1/1)
  cho thấy tải là yếu tố lớn, không gộp chung số hai boot.
- **EPERM:** không gặp sóng ghi file nào đáng kể trong lượt này
  (ghi JSON qua `writeFileEpermRetry` như Q6; `cp -an` vào `/`
  chạy 1 lần xong).

## 6. Nợ mở / hướng tiếp theo

1. **Đo nốt điểm ngưỡng thật (1,3–10 MB, bitrate thực tế):** clip
   4 MB và 8 MB ở ~2 Mbps (vd 16 s / 32 s, đo load + loop rút gọn
   thay vì 5 vòng 4 s) để tìm cliff chính xác thay vì chọn 8 MiB
   theo biên an toàn. Nếu 8 MB cũng lỗi load thì hạ tiếp về 4 MiB.
2. **Blob-load fail ở file lớn (chữ ký "not supported" / play
   timeout / ended-với-0-frame):** chưa chẩn đoán được tầng nào
   (WebKit blob loader vs GStreamer playbin vs thiếu CPU decode) —
   cần probe GStreamer log (`GST_DEBUG`) nếu muốn sửa thay vì chỉ
   né bằng ngưỡng. Hiện fallback che được (về progressive, không
   crash) nên không chặn ship.
3. **Prefetch chỉ áp cho lần play đầu của element:** clip đang
   phát bằng progressive mà fetch xong thì blob chỉ được dùng ở lần
   tạo element sau (dropElement) — lần loop đầu tiên sau khi user
   bấm play ngay vẫn có thể dính race nếu fetch chưa xong. Trong
   thực tế videoFor được gọi từ lúc clip hiện trên timeline nên cửa
   sổ này nhỏ (blobReady median 182 ms); chưa đo tỉ lệ swap-trượt
   trong app thật (cần click-test/harness đếm `srcAtPlay`).
4. **Proxy dài > ~32 s (720p CRF 23) vượt ngưỡng 8 MiB** nên không
   được fix race — hành vi cũ, ghi rõ để không ai tưởng prefetch
   phủ mọi proxy. Muốn phủ proxy dài thì cần chia nhỏ fetch theo
   đoạn (range-prefetch) thay vì fetch toàn bộ — hướng khác, chưa
   làm.
5. **Câu hỏi mở Q6 §6.4 còn lại** (playbin có preroll khi pause
   không) vẫn mở — đợt này không thử vì đã có fix ship được cho
   clip nhỏ; không đầu tư thêm.
6. **Môi trường:** debroot khôi phục WebKit nay ở
   `~/workspace/tmp-q6r3-debroot` (413 MB, ngoài repo — không
   stage); Chromium Playwright SIGTRAP vẫn còn (không thuộc phạm vi
   luồng này); Xvfb :199 cần dựng lại sau mỗi reboot (script
   `/tmp/q6r3/xvfb-tight.sh` đã mất cùng reboot — lần sau viết lại
   vào workspace).

## 7. Files (stage, KHÔNG push)

- `apps/web/src/media.ts` — prefetch blob production (ngưỡng 8 MiB,
  cap tổng 64 MiB, swap khi element sạch, revoke + fallback).
- `apps/web/src/media.blobPrefetch90R3.test.ts` — unit test 19/19.
- `apps/web/tsconfig.json` — thêm test file vào exclude (quy ước repo).
- `benchmarks/render/webkit-blob-prefetch-entry.ts` — entry bundle
  MediaPool cho probe.
- `benchmarks/render/webkit_loop_d_blob_prefetch_90r3.mjs` — probe
  loop-D (27 run) + control B8/B16.
- `benchmarks/render/webkit_blob_load_90r3.mjs` — load-probe tách
  riêng (6 run: P6 2/3, B40 3/3).
- `benchmarks/results/webkit-loop-d-blob-prefetch-90r3.json` — 27 run.
- `benchmarks/results/webkit-blob-load-90r3.json` — 6 run.
- `docs/PHASE9_ROUND90_R3_WEBKIT_CLIPD_BLOB_PREFETCH_LIMITS.md` —
  file này.
- Không stage: clip `.mp4` (binary, sinh lại được), bundle probe
  (`/tmp/q6r3/bundle/`, sinh lại bằng esbuild mỗi lần chạy),
  `apps/web/dist/` (gitignored), `~/workspace/tmp-q6r3-debroot/`
  (413 MB, ngoài repo).
