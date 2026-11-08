# Phase 9 — Đợt 51: LIMITS tổng hợp (gộp muộn, KHÔNG push)

Ngày gộp: 06/11/2026 (lượt cron 21:35 +07). Đợt 51 chạy 06/11/2026 với
9 luồng H1–H9 trong lượt cron 18:35 (8 luồng theo kế hoạch + H9
click-test Electron ngoài kế hoạch 8 luồng). Bước gộp của parent chưa
từng xảy ra — không có LIMITS tổng hợp, không có mục log đợt 51, không
có file paths cho H1–H6/H9; chỉ có 2 file paths tự stage của H7/H8 và
1 mục log riêng của luồng H8. Lượt này KHÔNG làm lại code đợt 51 mà
đóng vai parent gộp muộn (cùng mẫu đợt 49/50). KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào batch.

## 0. Chủ đề đợt 51 (từ nợ mở đợt 50 §4, không trùng batch đã stage)

- Mô hình đường cong TTS theo giọng thay ngưỡng nhị phân 13% (H1).
- Đo lặp hệ số TTS cho các giọng n = 1 (H2).
- Fail-fast seek-landing-0 headed + quirk frame khác 0 (H3).
- Settled heap GOP + baseline dao động (H4).
- Normalize speed keyframes null + chống lệch mirror video-spec (H5).
- Click-test headed thật KeyframePanel với `[null]` + thao tác cốt lõi (H6).
- Pidfile + dọn bridge mồ côi lúc khởi động — nợ Phase 10 §5.2 (H7).
- Ship services vào app đóng gói — nợ Phase 10 §5.1 (H8).
- Click-test menu/dialog native + double-click .vcut trên AppImage —
  nợ Phase 10 (H9, ngoài kế hoạch 8 luồng; xem §2.9).

## 1. Đối chiếu baseline (kiểm chứng đĩa trước khi kết luận)

- Baseline đợt 51: `hidden_files/round51-baseline.sha256` (3.354 entry).
  `sha256sum -c` → đúng 25 file đổi, khớp chính xác hợp 9 danh sách
  LIMITS H1–H8 + file H9 (xem §1.1); 0 file lạ, 0 file thiếu.
- File mới so với baseline (không tính node_modules/dist/release/
  build/.venv/__pycache__): 32 file, gồm 31 file của H1–H8 + 1 file
  của H9 (`apps/desktop/scripts/click-test-menu.mjs`).
- Hai entry baseline đổi nhưng KHÔNG đưa vào batch (build output):
  `apps/desktop/dist-web/index.html` và
  `apps/desktop/dist-web/assets/index-GGqEvue2.js` (asset hash cũ mất
  sau khi rebuild web trong đợt; dist-web là output build, theo tiền lệ
  không stage).
- File chung `apps/web/tsconfig.json`: đủ 5 dòng exclude mới
  (H1/H2/H4/H5/H6). `docs/DESKTOP.md`: chứa cả nội dung H7 (pidfile)
  lẫn H8 (bundled services) — không xung đột. `TtsButton.tsx`: chỉ
  hunk H1/H2. `serviceManager.js`: chỉ hunk H7 (H8 không chạm).
  `main.ts`: chỉ hunk H8.

### 1.1 Bảng đổi theo luồng (đối chiếu LIMITS từng luồng)

| Luồng | File đổi | File mới |
|---|---|---|
| H1 TTS curve | TtsButton.tsx, ttsEstimate46B3/48D1/49E1/50F3.test.ts, tsconfig.json (1 dòng) | ttsEstimate51H1.ts, ttsEstimate51H1.test.ts, LIMITS H1 |
| H2 TTS coeff | tsconfig.json (1 dòng) | ttsEstimate51H2.ts, ttsEstimate51H2.test.ts, LIMITS H2 |
| H3 fail-fast/quirk | — (không đổi production) | 4 harness pause51H3-*.mjs, LIMITS H3 |
| H4 GOP heap | gopRangeFetch39T3.ts, gopCache40V2.ts, reverseWebcodecs.ts, gopTail47C5.test.ts, tsconfig.json (1 dòng) | gopTailStream51H4.test.ts, LIMITS H4 |
| H5 keyframe mirror | speedcurve.ts/.js, speedramp.js, modify.ts, tsconfig.json (1 dòng) | check-video-spec-mirror.mjs, test_round51_h5_speed_keyframe_null.js, speedKeyframesRound51H5.test.ts, modifyRound51H5.test.ts, LIMITS H5 |
| H6 click-test | previewEngine.ts, tsconfig.json (1 dòng) | previewEngine51H6.test.ts, clicktest-51h6-keyframe-panel.mjs, LIMITS H6 |
| H7 orphan bridge | serviceManager.js/.d.ts, serviceLifecycle.ts, verify-desktop.mjs, DESKTOP.md | bridgePidfile.js/.d.ts/.test.cjs, verify-orphan-cleanup.mjs, LIMITS H7 |
| H8 ship services | main.ts, package.json, prepackage.mjs, DESKTOP.md | bundledRuntime.ts/.test.cjs, copy-bundled-server.mjs, vcut-node, LIMITS H8 |
| H9 click-test menu | — (không đổi production) | click-test-menu.mjs (KHÔNG có LIMITS H9 — xem §2.9) |

Tổng đợt 51: 23 file đổi + 32 file mới = 55 entry (chưa tính LIMITS
tổng hợp này). Trong đó H7/H8 đã tự stage 2 file paths (10 + 9 entry,
kể cả DESKTOP.md ở cả hai); parent stage thêm 1 file paths cho
H1–H6 + H9 + LIMITS tổng hợp: 38 entry (xem §5).

## 2. Tóm tắt từng luồng (chỉ số nào parent đã đối chiếu/kiểm chứng lại)

### 2.1 H1 — Mô hình đường cong TTS theo giọng (thay ngưỡng 13%)

- Đo thêm 13 mẫu thật (neo Kim Thanh M3 + Q07/Q09/Q14 × 4 giọng) bằng
  driver TTS thật; driver bị SIGKILL 14 lần + VM reboot 12:05 UTC xóa
  /tmp (2 WAV đầu mất nhưng đã ffprobe khớp trước reboot, số đo còn
  trong backup). Khóa φ(r) chung cho mọi giọng, nội suy tuyến tính
  từng đoạn giữa 8 nút; đường cong rơi nhanh (6,98% đã đi 67% quãng
  xuống dense; 15,96% vượt dense φ = 1,16). Sửa được lỗi gốc: khoảng
  đường cong chứa số thật của cả 6 mẫu F3 P10/P13 + phản ví dụ X2.
- Helper mới `ttsEstimate51H1.ts` (nhận bảng hệ số qua interface),
  TtsButton chuyển sang helper H1. Tốc độ tổng hợp đo được 0,03–0,39×
  realtime (median ~0,10×) — vẫn mâu thuẫn "~1,5–2,5×" trong memory;
  không sửa memory theo quy ước.
- Kiểm chứng lại ở bước gộp: test mới 11/11; hồi quy C4 10/10, D1
  12/12, B3 7/7, A3 10/10, Z3 9/9, E1 13/13, F3 15/15.

### 2.2 H2 — Đo lặp hệ số TTS (nợ F3 §8.2)

- Đo được 37/83 mẫu kế hoạch rồi dừng (VM restart, SIGKILL 2 lần,
  synth median 0,10× vì tải nặng; 83 mẫu cần ~3,5 giờ, vượt khung
  lượt). 10/25 giọng nay n ≥ 3 cả hai chế độ; 15 giọng còn n < 3
  (khóa đúng trong test, không khai đã đóng nợ). Bảng hệ số H2 mới
  trong `ttsEstimate51H2.ts` (tính lại từ pool gộp, không sửa file
  F3/E1, không sửa helper/TtsButton).
- **Nối bảng H2 vào helper H1 (điểm nối parent): đã có sẵn trên cây
  lúc gộp** — `TtsButton.tsx` đã import
  `TTS_VOICE_COEFFICIENTS_51H2` và truyền
  `coefficients: TTS_VOICE_COEFFICIENTS_51H2` vào
  `ttsDoneSuffixRange51H1` (comment "ROUND51-H2 (parent gộp)").
  Parent KHÔNG sửa thêm; kiểm chứng lại xanh (H1 11/11, H2 10/10).
- Kiểm chứng lại ở bước gộp: test mới 10/10 (chạy qua bundle CJS —
  xem §4.1); hồi quy TTS như H1.
- Đính chính: H2 LIMITS §8 ghi "TtsButton.tsx (vẫn nối helper F3)"
  là **lỗi thời** — TtsButton đã nối helper H1 (H1) + bảng H2 (nối
  sẵn lúc gộp).

### 2.3 H3 — Fail-fast seek-landing-0 + quirk frame khác 0

- **Nợ đứng nhiều đợt ĐÃ ĐÓNG:** fail-fast seek-landing-0 đo được
  headed — `seekElement` fail sau đúng 3 landing sai liên tiếp, trả
  `{seeked:false, timedOut:false}` trong 10–84 ms, 3/6 lượt qua server
  không Content-Length. Nguyên nhân landing-0 đã rõ: server không
  Content-Length (serve43 chunked) → `seekable=[[0,0]]` lúc seek nên
  Chrome clamp về 0 (tương quan 6/6); file lành cũng đáp 0 với tỉ lệ
  ~40–44%. Không phải fixture hỏng, không phải binary.
- Quirk pixel: chỉ file cắt đuôi cho `seeked` bắn dù frame đích không
  còn (frame cũ hiển thị); mọi dạng hỏng khác đều error 3/4 trước khi
  `seeked` kịp bắn. Kết luận: **KHÔNG thêm kiểm tra pixel vào đường
  seek** (bằng chứng không ủng hộ; chi phí/lợi ích không xứng).
- Không đổi production code; chỉ thêm 4 harness. Kiểm chứng lại ở
  bước gộp: seek 15/15, pauseSeekRecovery43Y2 9/9, pause45A2 14/14.
  KHÔNG chạy lại ở bước gộp: các probe headed của H3 (số trong LIMITS
  H3 chỉ đối chiếu, không đo lại).

### 2.4 H4 — Settled heap GOP + baseline dao động

- Trần cache LRU chốt **16 MiB** (32 → 16): 6 lượt headed app thật,
  cache GOP thật tối đa 8,24 MiB, `evictedBytes = 0` ở mọi trần; settled
  heap không đổi theo trần (24,56–31,99 MiB, do frame cache) — trần mới
  là giới hạn an toàn, không phải knob tiết kiệm. Không chọn 8 MiB vì
  mức tối đa quan sát (8,24 MiB) đã vượt 8.
- Tail-scan đã stream: đuôi fetch theo chunk gấp đôi từ EOF (2 → 4 →
  8 → 16 MiB); fixture 37 MiB chỉ cần 4 MiB đuôi thay vì 16,7 MiB.
- Baseline dao động 21–59 MiB **đã giải thích**: baseline sau `gc()`
  ổn định ~21,4 MiB trong cả 6 lượt; số ~58 MiB của F4 là transient
  sau import (+37,5 MiB đúng kích thước file, 0–2 s sau khi card xuất
  hiện, tự rơi về ~21 MiB trước khi phát ngược) — không phải code chung
  bị luồng khác sửa.
- Kiểm chứng lại ở bước gộp: test mới 8/8; hồi quy GOP đủ bộ xanh
  (T3 10/10, U2 20/20, V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4
  13/13, C5 11/11 với 1 assertion đếm request đã cập nhật theo
  streaming mới, Z4 19/19, Y4 10/10, E2 8/8, F4 6/6, reversePlayback
  10/10, reversePreviewGate 12/12, A6 12/12, Y6 11/11, errorDetail34Q4
  35/35). KHÔNG chạy lại ở bước gộp: các lượt headed E2E đo heap.

### 2.5 H5 — Normalize speed keyframes + chống lệch mirror

- `normalizeSpeedKeyframes` lọc entry lỗi ở cả 3 mirror
  (video-spec TS, video-spec JS viết tay, render CJS) + guard
  non-array; `trimSpeedKeyframes` bỏ entry lỗi đếm vào `dropped`.
  Zod `add_keyframe` chặn `Infinity`/`NaN` (`.finite()` cho time/value).
- Cơ chế bắt lệch mirror mới `check-video-spec-mirror.mjs`: export-set
  parity + differential probes — chạy lại ở bước gộp: **64 pass,
  7 known, 0 fail** (khớp H5).
- Lệch mirror TS/JS về easing lạ GIỮ NGUYÊN có chủ ý (TS trả
  `undefined` → NaN, JS ném; đổi TS sang ném sẽ thành throw giữa tick
  preview không guard) — checker ghi nhận là KNOWN.
- Kiểm chứng lại ở bước gộp: render 17/17, web 13/13, MCP 8/8; hồi
  quy K1 21/21, P3 73/73, SR 31/31, nested e2e 28/28, F1 render 26/26,
  F1 web 11/11, E4 13/13, projectRepo 10/10, nested22 7/7, audioEngine
  6/6, pauseLoopGuard 11/11, keyframes.js self-test pass.

### 2.6 H6 — Click-test headed KeyframePanel với `[null]`

- Tìm ra 1 bug sản phẩm thật bằng click-test đỏ-trước: preview render
  ném `interpolateKeyframes: mảng keyframes rỗng` khi
  `animations.x.keyframes = [null]` in-memory (panel tự thân không
  crash). Sửa tối thiểu 1 file production: helper `hasUsableKeyframes`
  + guard 17 call site trong `previewEngine.ts` (contract
  `interpolateKeyframes` không đổi).
- Headed 18/18 case PASS sau fix (9 keyframe + 9 thao tác cốt lõi:
  trim, kéo, undo/redo, split, delete, box-select) trên 2 lượt, 0 lỗi
  console trong phiên xanh. Lượt 3 phase B không chạy được do renderer
  treo sau reload dưới tải VM (loadavg 18,89 → 29,01) — kết luận là
  nhiễu môi trường, không phải bug sản phẩm; bằng chứng B-phase xanh
  đã có ở lượt 2 cùng code.
- Kiểm chứng lại ở bước gộp: unit 15/15 (đỏ-trước 9/6 đã chứng minh
  bằng revert tạm — chỉ đối chiếu, không chạy lại revert); F1 web
  11/11. Suite `test-preview-engine.sh` chạy lại ở bước gộp: compile
  sạch, dừng ở fail pre-existing dòng 547 (wipeleft p=0,5 → B x=51,5
  thay vì 50 kỳ vọng; `transitionPreview.ts` mtime 2026-11-01 cố tình
  tính `+1.5` theo comment đo biên round-13 C6, test mtime 2026-10-26
  vẫn kỳ vọng 50) — **không phải hồi quy đợt 51**, không sửa kỳ vọng.

### 2.7 H7 — Pidfile + dọn bridge mồ côi (nợ Phase 10 §5.2)

- Module `bridgePidfile.js` mới: ghi pidfile lúc spawn (trước khi chờ
  healthy), dọn mồ côi lúc `start()` — fail-closed (pid sống không
  phải bridge VCut thì KHÔNG kill). Nối vào `serviceManager.js` +
  `serviceLifecycle.ts` (+ điểm nối `cleanupOrphanBridgeOnStartup` cho
  H8). Sửa 2 bug thật gặp trong smoke: (a) vòng poll health race với
  tick 250 ms (health chậm > 250 ms bị vứt; `/api/health` spawn
  `ffmpeg -version` mỗi request, 3/6 lần > 250 ms) → poll tuần tự;
  (b) pidfile chỉ ghi sau healthy → bridge mồ côi "vô hình" khi kill
  -9 giữa lúc chờ health.
- Smoke thật kill -9 → mở lại: pha #3 xanh toàn bộ (dọn chết bridge
  cũ, bridge mới healthy đúng cổng 8787, thoát sạch exitCode=0).
  Giới hạn kiến trúc còn lại: Electron bind CDP trước khi `main.ts`
  chạy nên lần chạy dọn mồ côi tự mất CDP (chỉ trống cho lần sau);
  renderer/GPU con mồ côi cũng có thể giữ socket CDP (chưa có cơ chế
  dọn).
- Kiểm chứng lại ở bước gộp: `bridgePidfile.test.cjs` 14/14. KHÔNG
  chạy lại ở bước gộp: smoke Electron kill -9 các lượt (số trong LIMITS
  H7 chỉ đối chiếu).

### 2.8 H8 — Ship services vào app đóng gói (nợ Phase 10 §5.1)

- Bridge + render worker ĐÃ chạy được trong app đóng gói: loader
  `bundledRuntime.ts` (chọn node: `VCUT_NODE` → `bin/node` → launcher
  `bin/vcut-node` chạy Electron dạng Node → node hệ thống), cây bundle
  `resources/vcut-server/` 1.026 file / 63.349.996 byte (bridge +
  render + script Python text + closure 79 package 5,8M + LUT 181 file
  56M; closure đặt ở `server/node_modules/` vì electron-builder prune
  `node_modules` ở gốc extraResources).
- Bài học đắt nhất: đặt `ELECTRON_RUN_AS_NODE=1` vào env main process
  làm nhiễm tiến trình con Chromium (chết `/proc/self/exe: bad option`)
  — đã sửa bằng launcher giới hạn biến chỉ trong cây bridge.
- AppImage 128.102.744 → 147.915.613 byte (+15,5%), sha
  `8898971f…` (bản verify ở `~/workspace/tmp-h8-electron/release-h8c/`);
  smoke AppImage thật `ok:true`, `bridgeFromRenderer:"ok"`, render MP4
  thật qua bridge của AppImage (2.279.729 byte, đúng bằng lần stage),
  thoát sạch không mồ côi. **.deb trong `release/` chứa launcher bản cũ
  (sai đường `../../vcut-studio`) — phải build lại trước khi dùng thật.**
  Python venv + model AI KHÔNG bundle đợt này (kế hoạch chi tiết trong
  LIMITS H8 §5: venv ~1,6G, venv+models ~4,9G; đề xuất bundle venv thu
  gọn + model tải riêng lần đầu).
- Kiểm chứng lại ở bước gộp: unit loader 10/10. KHÔNG chạy lại ở bước
  gộp: boot bridge từ cây stage, smoke AppImage, render qua AppImage
  (số trong LIMITS H8 chỉ đối chiếu).

### 2.9 H9 — Click-test menu/dialog/.vcut (KHÔNG có LIMITS, chỉ có bằng chứng trên đĩa)

- H9 không viết LIMITS, không stage paths, không ghi log. Bằng chứng
  duy nhất trên đĩa: harness
  `apps/desktop/scripts/click-test-menu.mjs` (107.981 byte, mtime
  14:32 UTC — sau lần chạy báo cáo 14:30 UTC, tức harness còn được
  sửa sau lần chạy cuối) + `hidden_files/h9/h9-report.json` (11/11
  case diag PASS, 0 fail, 14:30 UTC) + screenshots
  `hidden_files/h9/shots/` + `make-fixture.mjs` +
  `settings-after.json`.
- Báo cáo H9 chỉ gồm các case **diag** D0–D8 (baseline cửa sổ, đóng
  welcome modal, mở popup Tệp/Trợ giúp, dời/ẩn cửa sổ 200×200) — KHÔNG
  có bằng chứng các phase menu/dclick/deb/cross đã chạy xong. Parent
  KHÔNG mạo nhận H9 đã xong: nợ click-test menu/dialog/double-click
  .vcut vẫn mở (xem §3.9).
- Phát hiện thật trong báo cáo H9 (ghi lại để đợt sau xử lý, parent
  không tự suy diễn thêm): case D3 "Lưu thành…" — click đúng mục
  nhưng sinh 1 exception mới `Uncaught (in promise)` trong
  `app://vcut/assets/index-9ARqOofy.js` (line 56, col 112484) + 1 cửa
  sổ 200×200 xuất hiện. Chưa rõ exception này có phải bug sản phẩm
  hay artifact của harness (dialog native trên Xvfb) — cần chạy lại
  click-test để xác định.
- Harness H9 được đưa vào batch stage của parent (1 file) để không mất
  code; báo cáo + screenshot ở `hidden_files/h9/` không stage (không
  phải file repo).

## 3. Kiểm chứng gộp của parent (lượt này, chạy lại độc lập)

- Đối chiếu baseline: đúng 23 file đổi + 32 file mới, khớp chính xác
  hợp 9 danh sách LIMITS + file H9 (0 file lạ, 0 file thiếu, không
  binary/dist/pycache; 2 file dist-web đổi nhưng loại khỏi batch theo
  tiền lệ). tsconfig đủ 5 dòng exclude mới. i18n leaf: vi = en = 982,
  0 key mồ côi — parity thật vẫn đúng (xem §3.7).
- `tsc --noEmit` apps/web: **0 lỗi** (đính chính các lần đo giữa chừng
  của H2/H3/H5/H6 thấy 10–50 lỗi ở file test TTS đang viết dở +
  previewEngine.ts đang sửa dở — trạng thái giữa chừng, nay đã sạch).
  `tsc --noEmit` apps/desktop: **0 lỗi**.
- `vite build`: **pass** (5,98 s; chỉ cảnh báo chunk > 500 kB có sẵn).
- Checker mirror H5 chạy lại: **64 pass, 7 known, 0 fail**.
- Test mới chạy lại: H1 11/11, H2 10/10, H4 8/8, H5 render 17/17 +
  web 13/13 + MCP 8/8, H6 15/15, H7 14/14, H8 10/10 — fail 0.
- Hồi quy chạy lại: TTS C4 10/10, D1 12/12, B3 7/7, A3 10/10, Z3 9/9,
  E1 13/13, F3 15/15; GOP T3 10/10, U2 20/20, V2 16/16, W4 15/15, X4
  10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10, E2 8/8, F4
  6/6, reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6
  11/11, errorDetail34Q4 35/35; keyframe/render K1 21/21, P3 73/73,
  SR 31/31, nested e2e 28/28, F1 render 26/26, F1 web 11/11, E4 13/13,
  projectRepo 10/10, nested22 7/7, audioEngine 6/6, pauseLoopGuard
  11/11, seek 15/15, pauseSeekRecovery43Y2 9/9, pause45A2 14/14;
  keyframes.js self-test pass.
- Lưu ý cách chạy: 4 test (H2, C4, projectRepo, nested22) import
  extensionless qua chuỗi require vòng nhau nên bundle ESM của esbuild
  ném `ERR_REQUIRE_CYCLE_MODULE` lúc nạp — **lỗi cách chạy, không phải
  code**: bundle lại bằng `--format=cjs` thì chạy xanh (H2 10/10, C4
  10/10, projectRepo 10/10, nested22 7/7). Các test khác chạy ESM bình
  thường. Ghi lại để đợt sau khỏi tưởng code vỡ.
- Suite `test-preview-engine.sh` chạy lại: compile sạch, dừng ở fail
  pre-existing dòng 547 (wipeleft, xem §2.6) — không phải hồi quy.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS/TTS WAV/
  heap/smoke AppImage của các luồng, phiên solo thật, đo IDB thật,
  click-test headed từng panel (trừ H6 unit), Safari/máy thật.
  Parent không sửa logic luồng nào; chỉ viết LIMITS tổng hợp này, file
  paths và mục log. Ngoại lệ duy nhất: điểm nối H2→H1 đã có sẵn trên
  cây lúc gộp (xem §2.2), parent chỉ kiểm chứng lại.

## 4. Nợ mở cho đợt 52 (tổng hợp từ LIMITS H1–H9 + phát hiện lúc gộp)

1. **TTS — 46 mẫu còn lại của kế hoạch H2 (83 mẫu):** đo tiếp bằng
   driver resume (`hidden_files/tts51h2/drive51h2.py` tự bỏ qua 37 mẫu
   đã đo) — 15 giọng còn n < 3 ở ít nhất một chế độ. Ưu tiên đo lúc
   máy yên / tránh chạy 2 driver TTS cùng lúc (nguyên nhân SIGKILL +
   synth 0,02–0,10×). Đo lặp thêm điểm giữa đường cong (ưu tiên Q14,
   Trúc Ly chỉ có 5 điểm); ngoại suy ngoài 15,96% chưa đo; text khác
   nhau gây nhiễu ngoài tỉ lệ chữ số (mô hình theo đặc trưng text).
2. **TTS — transfer theo text 1,172 (nợ F3 §8.3)** vẫn mở: chưa đo
   thêm text medium thứ hai cho giọng chậm.
3. **Fail-fast/quirk:** pixel của một lần landing-0 thật chưa đo được
   (3 probe pixel nolength đều đáp đúng; cần ≥ 10 probe); cơ chế
   seekable=[0,0] là tương quan 6/6, chưa chứng minh nhân quả từ code
   Chrome; "155 + http chunked" chưa đo trực tiếp (không còn cần để
   giải thích Y2).
4. **GOP heap:** settled heap vẫn do frame cache quyết định (muốn giảm
   thì đụng frame cache, ngoài phạm vi H4); cơ chế giữ +37 MiB sau
   import chưa xác định dứt điểm (ingest IDB vs video preload); tail
   streaming còn rủi ro file chế tác moov giả (xem LIMITS H4 §5.3);
   phiên lùi dài > 60 s chưa đo (trần 8 MiB có thể cắn — lý do chốt
   16 MiB).
5. **Keyframe/speed:** lệch mirror TS/JS về easing lạ giữ nguyên có
   chủ ý (muốn thống nhất thật thì đổi TS sang ném KÈM guard try/catch
   ở mọi caller preview không guard); `audio.js` thiếu `FADE_CURVES`
   (tiền sẵn); checker mới chỉ probe 5 cặp hàm thuần.
6. **Preview/audio:** `audioEngine.computeClipGain` có cùng pattern
   `[null]` chưa guard (H6 §6.1) — audio clip có `volumeKeyframes:
   [null]` in-memory sẽ ném y hệt bug H6 đã sửa; chưa chứng minh
   headed, chưa sửa. Tab badge KeyframePanel hiện số thô (1) trong khi
   panel count hiện 0 với `[null]` (chỉ hiển thị).
7. **i18n — test khóa cứng tổng 973 đã lỗi thời:** vi = en = 982 leaf
   key, 0 mồ côi (parent đo lại lúc gộp); các test E2i18n/D4/B6/Z6/
   saveToast31/structuredNotes32 khóa 973 nên fail đếm (2/3, 2/3, 7/8,
   9/10, 14/15, 11/12) — parity thật vẫn đúng, chỉ cần cập nhật kỳ
   vọng 973 → 982 (9 key thêm từ E2, trước đợt 51).
8. **Electron — build lại .deb với launcher đã sửa** (bản trong
   `release/` chứa launcher cũ sai đường); ship venv Python + model AI
   theo kế hoạch H8 §5 (bundle venv thu gọn + model tải riêng lần đầu);
   `START_TIMEOUT_MS` 30 s quá chặt khi tải cao (flake
   serviceManager.test); cache `ffmpegVersion()` trong bridge (health
   spawn lại mỗi request, tới 1895 ms dưới tải); pidfile: dọn
   renderer/GPU con mồ côi giữ socket CDP; click-test menu/dialog +
   double-click .vcut (H9 dở dang) + exception D3 "Lưu thành…" chưa
   xác định; cài .deb máy sạch; macOS/Windows/arm64.
9. **H9 dở dang:** không có LIMITS H9; các phase menu/dclick/deb/cross
   chưa có bằng chứng hoàn thành; harness còn sửa sau lần chạy báo cáo
   cuối (14:32 > 14:30 UTC). Đợt sau chạy lại
   `click-test-menu.mjs` trọn vẹn rồi viết LIMITS H9.
10. **Chung:** tốc độ tổng hợp TTS 0,03–0,39× realtime (median ~0,10×
    đợt này), mâu thuẫn "~1,5–2,5×" trong memory — chưa rõ memory ghi
    trên máy/model khác; không sửa memory theo quy ước. Safari/Firefox/
    máy thật/GPU thật/máy yên vẫn chưa đo cho mọi số đợt này. Log
    harness nên ghi thẳng vào `~/workspace/` thay vì /tmp (nhiều log
    H3 đã mất theo /tmp bị dọn giữa các lượt).

## 5. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round51-h7-orphan-bridge.txt`
  (10 entry, đã có từ luồng H7 — parent chỉ verify read-back: đủ file)
- `~/workspace/repo-1-push/paths-loop/phase9-round51-h8-ship-services.txt`
  (9 entry, đã có từ luồng H8 — parent chỉ verify read-back: đủ file)
- `~/workspace/repo-1-push/paths-loop/phase9-round51-closing-debts50.txt`
  (**38 entry**, parent stage ở lượt này: 15 file đổi H1–H6 + 21 file
  mới H1–H6 + harness H9 + LIMITS tổng hợp này; NUL-delimited, NUL
  cuối, không binary, không dist; đã verify read-back 38 entry + mọi
  file tồn tại)

Tổng batch đang chờ user push sau đợt này: **4 file paths / 120 entry**
(63 Phase 10 Electron + 10 H7 + 9 H8 + 38 đợt 51 H1–H6/H9; các đợt
1–50 đã push xong — đợt 22–50 push chiều 06/11, HEAD e2cb35e1).

## 6. Bổ sung sau gộp (parent build + i18n, 06/11/2026 ~22:00 +07)

- **Nối H2→H1 đã có sẵn trên cây lúc lượt 21:35 gộp** (xem §2.2) — đó là
  sửa của parent từ lượt giao 18:35 (TtsButton truyền bảng H2 vào helper
  H1), đã kiểm chứng xanh lúc đó (H1 11/11, H2 10/10, hồi quy TTS đủ bộ).
- **Snapshot i18n 973→982 đã sửa xong (nợ §4.7 đã đóng):** 7 file test
  (reverseToggleI18n48D4, saveToast31, structuredNotes32,
  errorDetail34Q4 comment, reverseBadge46B6, reverseCompat44Z6,
  reversePlaybackI18n49E2) — 9 key mới là key thật từ Phase 10, vi == en
  == 982, 0 key mồ côi. Kiểm chứng lại: D4 3/3, saveToast31 15/15,
  structuredNotes32 12/12, B6 8/8, Z6 10/10, E2 3/3. Stage riêng batch
  phụ `phase9-round51-i18n-snapshot.txt` (7 entry, NUL cuối) — tổng chờ
  push thành **5 file paths / 127 entry**.
- **Gói Linux rebuild từ cây đã gộp** (`npm run package:linux`,
  TMPDIR ra đĩa, 14:57–14:59 UTC): AppImage **147.919.285 byte** sha256
  `88c13f47…`, .deb **120.232.492 byte** sha256 `960c39c3…`. Kiểm chứng:
  launcher trong gói đã sửa đúng (`BIN="$HERE/../../../vcut-studio"`),
  `vcut-server` 1.214 entry trong .deb (express + bridge đủ),
  app.asar chứa bundledRuntime + bridgePidfile + services-status +
  bridgeFromRenderer. Smoke AppImage mới (Xvfb): `ok:true`,
  `bridgeFromRenderer:"ok"`, bridge tự start 8787, không mồ côi sau
  thoát. Nợ .deb cũ (launcher sai) trong §4.8 đã đóng bằng rebuild này
  — .deb trong `release/` giờ là bản mới; vẫn chưa chạy được binary đã
  cài trên VM này (thiếu 5 lib hệ thống, giới hạn VM).
