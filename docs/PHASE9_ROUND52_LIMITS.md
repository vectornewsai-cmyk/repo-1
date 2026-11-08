# Phase 9 — Đợt 52: LIMITS tổng hợp (gộp, KHÔNG push)

Ngày gộp: 07/11/2026 (lượt cron 00:35 +07). Đợt 52 chạy 06–07/11/2026
với 9 luồng I1–I9 song song trong lượt cron 00:35. KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào batch.

## 0. Chủ đề đợt 52 (từ nợ mở đợt 51 §4, không trùng batch đã stage)

- TTS: đo tiếp 46 mẫu còn lại của kế hoạch H2 (I1).
- Guard `[null]` cho `audioEngine.computeClipGain` + badge
  KeyframePanel (I2).
- Click-test menu/dialog/double-click .vcut trọn vẹn + xác định
  exception D3 (I3, viết LIMITS H9 còn thiếu).
- Electron: cache `ffmpegVersion()`, timeout start thích ứng, dọn
  con Electron mồ côi giữ CDP (I4).
- Ship venv/model theo kế hoạch H8 §5 (I5).
- GOP: phiên lùi dài >60 s + moov giả + settled heap (I6).
- Thống nhất mirror easing TS/JS + `FADE_CURVES` + mở rộng checker
  (I7).
- Fail-fast/quirk: ≥10 probe pixel landing-0 + nhân quả seekable (I8).
- Preview FPS thật trên browser headed (I9).

## 1. Đối chiếu baseline (kiểm chứng đĩa trước khi kết luận)

- Baseline đợt 52: `hidden_files/round52-baseline.sha256` (3.386 entry,
  đã loại node_modules/.venv/__pycache__/dist/release/build).
  `sha256sum -c` → đúng **40 file đổi** (không tính 2 file dist-web),
  khớp chính xác hợp 9 danh sách LIMITS I1–I9 (0 file lạ, 0 file thiếu);
  **55 file mới** (không tính 1 file dist-web), khớp hợp 9 danh sách.
- 2 file dist-web đổi (`apps/desktop/dist-web/index.html`,
  `assets/index-B4nXx6dQ.js`) + 1 file dist-web mới
  (`assets/index-CysPjIj-.js`) là build output, loại khỏi batch theo
  tiền lệ.
- File chung có nhiều luồng sửa — đã đối chiếu trên đĩa, không xung
  đột text, nội dung cuối chứa đủ hunk của mọi luồng:
  - `apps/web/tsconfig.json`: đủ 4 dòng exclude mới (I2, I6, I7, I3).
  - `apps/web/src/lib/audioEngine.ts`: đủ helper I2
    (`hasUsableVolumeKeyframes`) + helper I7
    (`interpolateVolumeKeyframes` fail-soft).
  - `apps/web/src/components/keyframes/KeyframePanel.tsx`: đủ hunk
    badge I2 + guard I7.
  - `apps/desktop/src/services/serviceManager.js` (+ `.d.ts`):
    hunk I4 (timeout thích ứng, race stop-trong-start) + hunk I5
    (`MODEL_CHECKS` nối pythonServices) — không xung đột.
  - `apps/desktop/src/main.ts`: hunk I4 (electron pidfile) + hunk I5
    (model downloader lifecycle) — không xung đột.
  - `docs/DESKTOP.md`: hunk I4 (§7.1, §7.2, §11) + hunk I5 (§2).
  - `apps/web/src/lib/ttsEstimate51H2.test.ts`: chỉ I1 sửa.
- Lưu ý: `tsconfig.json` xuất hiện trong 3 batch (I3, I6, parent) và
  `DESKTOP.md` trong 2 batch (I4, I5) — cùng tiền lệ đợt 51
  (DESKTOP.md ở cả H7 lẫn H8): file chung mang trạng thái mới nhất,
  cây cuối đúng.

### 1.1 Bảng đổi theo luồng

| Luồng | File đổi | File mới |
|---|---|---|
| I1 TTS samples | ttsEstimate51H2.ts, ttsEstimate51H2.test.ts | LIMITS I1 |
| I2 audio null | audioEngine.ts, KeyframePanel.tsx, tsconfig.json | audioEngine52I2.test.ts, clicktest-52i2-audio-null-badge.mjs, LIMITS I2 |
| I3 menu click-test | desktop.ts, tsconfig.json, click-test-menu.mjs | desktopSaveAs52I3.test.ts, LIMITS I3 |
| I4 Electron reliability | bridge/index.js, serviceManager.js/.d.ts, serviceManager.test.cjs, serviceLifecycle.ts, main.ts, DESKTOP.md | electronOrphanCleanup.js/.d.ts/.test.cjs, verify-electron-orphan-cleanup.mjs, LIMITS I4 |
| I5 ship venv/models | package.json, copy-bundled-server.mjs, copy-services-js.mjs, prepackage.mjs, pythonServices.js/.d.ts, serviceManager.js/.d.ts, main.ts, preload.ts, tts.py, caption.py, bgremove.py, DESKTOP.md | build-slim-venv.mjs, gen-model-manifest.mjs, model-manifest.json, modelDownloader.js/.d.ts/.test.cjs, LIMITS I5 |
| I6 GOP long session | mp4Demux.ts, gopRangeFetch39T3.ts, tsconfig.json | gopFakeMoov52I6.test.ts, LIMITS I6 |
| I7 mirror unify | keyframes.ts/.js, speedcurve.ts, audio.js, lut.js, sticker.js, textfx.js, check-video-spec-mirror.mjs, previewEngine.ts, audioEngine.ts, KeyframePanel.tsx, keyframeNormalizeRound50F1.test.ts, speedKeyframesRound51H5.test.ts, tsconfig.json, test_color.js | mirrorUnifyRound52I7.test.ts, LIMITS I7 |
| I8 seek pixel | — (không đổi production) | pause52I8-seek-pixel.mjs, LIMITS I8 |
| I9 preview FPS | bench-preview-fps.mjs, RESULTS.md | 8 script probe/bench, LIMITS I9, 23 JSON kết quả |

Tổng đợt 52: 40 file đổi + 55 file mới = 95 entry (chưa tính LIMITS
tổng hợp này). Trong đó I3/I4/I5/I6 đã tự stage 4 file paths (5 + 12
+ 21 + 5 entry); parent stage thêm 1 file paths cho I1/I2/I7/I8/I9
+ LIMITS tổng hợp: 60 entry (xem §5).

## 2. Tóm tắt từng luồng (chỉ số nào parent đã đối chiếu/kiểm chứng lại)

### 2.1 I1 — TTS: đủ 83/83 mẫu, nợ F3 §8.2 ĐÃ ĐÓNG

- Đo tiếp 46/46 mẫu còn lại bằng driver resume (4 lần chạy, 1 driver
  duy nhất, `nice -n 10`). Tổng 83 mẫu (2 neo + 42 M3 + 39 M4).
  **25/25 giọng nay n ≥ 3 cả hai chế độ** (Kim Thanh dense n = 5).
- Bảng hệ số tính lại từ pool 83 mẫu: tỉ lệ dense/normal 0,6199–
  0,6829; mọi mẫu trong khoảng h = 0,17 (`outOfRange: []`); lệch lớn
  nhất so với tâm gộp vẫn 11,3% (Hải Đăng normal). Ngoại lệ duy nhất
  vượt trôi 5%: Thùy Dung normal **+7,01%** vs F3 — F3 chỉ có n = 1
  mẫu chậm 9,36 s; nay n = 3 với 2 mẫu mới 8,56/8,32 s (đúng điều nợ
  n = 1 cảnh báo, không phải lỗi đo; test khóa đúng tên + mức).
- Tốc độ tổng hợp: 46 mẫu đợt 52: 0,02–0,51×, median 0,18×, tổng
  5449,2 s. Tổng 83 mẫu: 0,02–0,51×, median 0,12×, tổng 11427,5 s.
  Chậm nhất W38 (455,3 s synth, lúc load 24,7); nhanh nhất W28
  (19,1 s, 0,51×). Vẫn mâu thuẫn "~1,5–2,5×" trong memory; không sửa
  memory theo quy ước.
- Verify WAV: 35/46 WAV đợt 52 khớp ffprobe từng mili-giây, 0 flag im
  lặng. 11 WAV đầu đợt 52 + 37 WAV đợt 51 đã mất theo /tmp qua 2 lần
  VM restart — chỉ còn số đo trong backup (đã khóa, khớp xu hướng
  pool).
- Sự cố: VM restart 1 lần giữa lượt (~17:53 UTC), mất 11 WAV + 1 mẫu
  đang tổng hợp dở (W31, đo lại sau); dual-write backup cứu toàn bộ
  số đo. Ghi WAV lỗi thoáng qua 2 lần (W39 `sf.write` "System error";
  V32 lỗi mở file + fallback wave EPERM) — đã vá driver (retry 1 lần
  + fallback ghi sang đĩa persistent); cả 2 lỗi xảy ra TRƯỚC khi vá,
  sau vá không còn lỗi nào. KHÔNG có SIGKILL nào ở đợt 52 (RSS tối
  đa ~3,0 GB). RAM lúc bắt đầu lượt rất căng (MemAvailable ~550 MB).
- Kiểm chứng lại ở bước gộp: H2 10/10 (bundle CJS), H1 11/11; hồi
  quy C4 10/10, F3 15/15.

### 2.2 I2 — Guard `[null]` audio + badge KeyframePanel

- `computeClipGain` (`audioEngine.ts`): thêm helper export
  `hasUsableVolumeKeyframes` (normalize rồi kiểm tra còn entry, cùng
  mẫu H6) + guard 1 call site; `[null]` rơi về volume tĩnh,
  `[null, valid]` vẫn nội suy. Contract `interpolateKeyframes`
  không đổi.
- Badge KeyframePanel nay đếm `normalizeKeyframes(...).length`,
  khớp panel count (`[null]` → không hiện số, `[null, valid]` → 1).
  Cùng mẫu sửa luôn filter hàng live của prop khác (trước đây hiện
  hàng "—" với `[null]`).
- Kiểm chứng lại ở bước gộp: test mới 15/15 (đỏ-trước đã verify bằng
  probe: code chưa sửa ném `interpolateKeyframes: mảng keyframes
  rỗng` với `[null]`); hồi quy audioEngine44Z2 6/6, previewEngine51H6
  15/15, E4 13/13, F1 web 11/11.
- Headed 8/8 PASS (chỉ đối chiếu LIMITS I2, không chạy lại): badge
  `[null]` không hiện số, panel count "0 điểm", 0 lỗi console;
  đỏ-trước headed bằng revert tạm 1 dòng badge → I1/I2 FAIL đúng
  chỗ, đã khôi phục.
- Giới hạn trung thực: I3 trong LIMITS I2 §6.1 — chứng minh
  `computeClipGain` qua module thật trong browser, **chưa chứng minh
  đường tick preview thật** (project mẫu không có audio clip; call
  site duy nhất là `preview.tsx:1798`).

### 2.3 I3 — Click-test menu/dialog/.vcut (LIMITS H9, đã xác định D3)

- **D3 "Lưu thành…" — BUG SẢN PHẨM THẬT, ĐÃ SỬA + KIỂM CHỨNG
  XANH.** Renderer Electron chạy `sandbox:true` nên
  `window.prompt()` ném `"prompt() is not supported"`;
  `desktop.ts:183` gọi `window.prompt(...)` không guard trong hàm
  async `saveProjectDesktop(true)` → uncaught promise rejection →
  Lưu thành… chết lặng, dialog lưu native không mở. Fix tối thiểu 1
  file production: try/catch quanh `window.prompt`, ném thì `name =
  ""` (bỏ qua bước đổi tên, vẫn mở dialog lưu native). Test mới 19
  assertions (T1–T4), **19/19 PASS**, đỏ-trước đã verify (revert
  tạm → T1 fail 8/8 đúng như bug). E2E trên AppImage thật: M3 xanh
  ở cả 2 lượt full run, D3 xanh ở 3 lượt diag sau fix. Hệ quả trung
  thực: bước đổi tên qua prompt bị bỏ qua trên desktop — cần dialog
  nhập tên trong app nếu muốn giữ tính năng (nợ §4.6).
- **Cửa sổ 200×200 — KHÔNG phải do D3, còn sót sau fix nhưng VÔ
  HẠI.** D2 probe: xuất hiện khi mở/đóng popup menu; D6 đo
  mapState=0 (Unmapped) ở cả 3 lượt; D7/D8 dời/ẩn nó không đổi gì.
  Là cửa sổ phụ của Electron/Chromium cho popup menu.
- **Menu không mở sau dialog — artifact môi trường Xvfb (không có
  WM), KHÔNG phải bug sản phẩm.** Sau dialog GTK đóng, focus lạc
  khỏi cửa sổ chính; harness retry `XSetInputFocus` + click lại mở
  được (ghi nhận trực tiếp ở D4/D5 diag và nhiều case full run).
- **Diag D0–D8 (+D3b): 11/11 PASS** ở lượt cuối r52g (harness cuối).
- **Full run menu #2: 8/27** (M3/M8/M9 xanh — action tới renderer;
  M4/M5/D2a gõ path qua dialog GTK không ghi file; M10–M26 action
  không tới renderer sau M9 — cả hai CHƯA xác định dứt điểm, xem
  §4). **Double-click .vcut: 1/5** (D3 xdg-open PASS ghi nhận hành
  vi; D1/D2b fail do fixture bị reboot xóa + probe miss event).
  **.deb: 3/3** (launcher trong gói ĐÚNG `../../../vcut-studio`;
  cài lỗi dependency như kỳ vọng — thiếu 5 lib hệ thống trên VM).
  **Cross-build: 4/4** (ghi nhận, không build thử).
- **Lưu ý đối chiếu của parent:** bảng §0 trong LIMITS I3 ghi
  "Full run menu+dclick 16/25 (16 passed / 25 failed)" — con số này
  KHÔNG khớp với các bảng chi tiết (§4.2 menu 8/27, §4.3 dclick 1/5;
  16 = 8+1+3+4 nếu cộng cả .deb 3/3 + cross 4/4, mẫu số không rõ).
  Parent lấy số theo bảng chi tiết (menu 8/27, dclick 1/5, deb 3/3,
  cross 4/4, diag 11/11); dòng tóm tắt 16/25 của I3 là chưa nhất
  quán, đợt sau sửa lại khi chạy tiếp.
- Rebuild gói Linux đợt này (`npm run package:linux`, ~28 phút):
  AppImage **147.931.593 byte** sha256 `da2b85d5…`, .deb
  **120.245.784 byte** sha256 `f8b3f034…` (đã chứa fix D3; bundle mới
  `index-DAcH2F5R.js` chứa chuỗi fix). Build output KHÔNG stage.
- Kiểm chứng lại ở bước gộp: test mới 19/19 (ALL PASS); tsc web 0,
  desktop 0; vite build pass. KHÔNG chạy lại ở bước gộp: các lượt
  diag/full run headed, smoke AppImage (số trong LIMITS I3 chỉ đối
  chiếu).

### 2.4 I4 — Electron: cache health + timeout thích ứng + dọn con mồ côi

- Cache `ffmpegVersion()` trong bridge: `/api/health` không còn
  spawn `ffmpeg -version` mỗi request (cache vĩnh viễn trong vòng
  đời process, request đồng thời chia sẻ cùng promise đang bay).
  Trước (tải nặng, loadavg ~6,6): SEQ median **1007 ms** / max 1603
  ms; CONC 10 median **1521 ms** / max 1815 ms. Sau (tải nặng hơn,
  loadavg ~16–19): SEQ median **19 ms** / max 127 ms; CONC 10
  median **97 ms** / max 101 ms. **SEQ ~53×, CONC ~16×.** Tải nhẹ
  SEQ 194 ms → 14 ms. Phần dư ~100 ms dưới tải cực nặng là
  scheduling delay của event loop, không còn là spawn ffmpeg.
- Timeout khởi động thích ứng: `30 s × min(loadavg/CPU, 4)`, trần
  120 s (máy yên vẫn 30 s); timeout từng health check nới theo tải
  (tối đa 8 s); gia hạn +30 s một lần nếu bridge đã trả lời health.
  Bằng chứng: test "trạng thái event" chạy 40,2 s dưới tải và pass
  (vượt 30 s cũ).
- Pidfile Electron + dọn con mồ côi giữ CDP: module mới
  `electronOrphanCleanup.js` (`electron.pid.json` trong userData;
  dọn fail-closed, kill từng pid, tối đa 3 lượt, không kill theo
  group). **Bug thật bắt được nhờ smoke:** con Chromium giữ cmdline
  nối bằng khoảng trắng (1 NUL cuối) — parser cũ không bao giờ
  khớp; đã sửa `parseProcessCmdline()` + test hồi quy. **Đính chính
  H7:** renderer/GPU con KHÔNG giữ socket CDP (đo thật: sau kill -9
  chỉ bridge giữ fd listen). Smoke kill -9 → mở lại: lượt 1: 31/32
  (fail đúng bug parser); lượt 2–3: 32/32; lượt 4: 32/32 + kill thật
  [gpu, utility, renderer], bridge mồ côi dọn riêng, bind lại CDP,
  bridge mới healthy :8788, thoát sạch exitCode=0, cả hai pidfile
  xoá.
- Race stop-trong-start (phát hiện ở lần chạy kiểm chứng cuối, đã
  sửa + hồi quy): một lượt full-suite TREO >6 phút (bridge còn sống
  trên cổng 18870 sau khi test timeout): timeout thích ứng tối đa
  150 s vượt timeout test 90 s cũ → `stop()` chạy khi `bridgeChild`
  còn null rồi return, `start()` sau đó vẫn spawn bridge mồ côi. Đã
  sửa: `start()` kiểm tra cờ dừng sau mỗi bước trước spawn + đầu
  mỗi vòng chờ healthy; `stop()` chờ start đang bay huỷ xong (tối
  đa 30 s); cờ dừng reset đồng bộ ở đầu `start()`; timeout các test
  có `start()` nới 90 s → 180 s. Test hồi quy mới (2 cửa sổ
  pre-spawn + health-wait): tắt tạm fix → FAIL, bật fix → PASS.
- Kiểm chứng lại ở bước gộp: `bridgePidfile` 14/14,
  `bundledRuntime` 10/10, `electronOrphanCleanup` 11/11,
  `serviceManager` 10/10 (chạy lại 41 s, fail 0). KHÔNG chạy lại ở
  bước gộp: smoke kill -9 các lượt (số trong LIMITS I4 chỉ đối
  chiếu).

### 2.5 I5 — Ship venv + model AI vào app đóng gói (kế hoạch H8 §5)

- First-run model downloader: module `modelDownloader.js`
  (resume / hủy / skip-if-present / verify SHA256) + manifest
  `model-manifest.json` (3 model đã verify) + script
  `gen-model-manifest.mjs`. **Tải thật từ Hugging Face:**
  `config.json` của faster-whisper-small (2.370 byte), verify SHA256
  khớp manifest (~1 s). Manifest: caption-small
  (Systran/faster-whisper-small, MIT, 486.212.372 byte, 4 file),
  tts-turbo (pnnbao-ump/VieNeu-TTS-v3-Turbo, Apache-2.0,
  2.157.916.899 byte, 86 file), tts-codec (OpenMOSS
  MOSS-Audio-Tokenizer-Nano-ONNX, Apache-2.0, 90.578.835 byte, 8
  file) — tổng ~2,55 GiB, tải riêng lần đầu về `userData/models`,
  không bundle. bgremove `birefnet-general.onnx` chưa verify
  checksum → downloader từ chối (đúng thiết kế).
- Slim venv (script `build-slim-venv.mjs`, đo byte thật):

  | Service | Trước | Sau | Giảm |
  |---|---|---|---|
  | caption | 516.672.763 | 453.597.096 | −12,2% |
  | tts | 894.862.978 | 306.872.496 | −65,7% |
  | reframe | 241.220.388 | 227.717.700 | −5,6% |
  | **Tổng** | **1.652.756.129** | **988.187.292** | **−40,2% (−664.568.837 byte)** |

  TTS loại gradio/fastapi/pandas/sklearn/scipy/numba/llvmlite/
  librosa… sau khi chứng minh bằng grep + chạy thật (librosa chỉ
  optional, fallback soundfile+soxr đã chạy thật qua test clone).
- Nối vào lifecycle desktop: app thiếu model thì báo rõ trong
  UI/services-status (không crash, không treo); Python AI chỉ bật
  khi model đã có. Workload thật trên venv slim: caption 2 segment/
  14 từ đúng nội dung; TTS preset WAV 2,72 s; TTS clone WAV 3,2 s
  `cloned:true`; reframe MP4 9:16, 300 frame. Probe thật: dev
  caption/tts `available:true`; với `VCUT_MODELS_DIR` rỗng →
  `available:false` kèm reason nêu tên model + kích thước + thư mục.
  Cây bundle stage lại: 11.215 file / 1.052.443.303 byte,
  `slimVenvs: [caption, tts, reframe]`. Relocation proof: giấu
  `build/slim-venv` bằng rename cùng filesystem, 3 venv staged vẫn
  import OK, `sys.prefix` TTS trỏ đúng đường staged.
- Sự cố đã xử lý (ghi trung thực): lệnh `mv build/slim-venv
  /tmp/...` thất bại — /tmp chỉ là tmpfs 512M, không chứa nổi ~1G →
  `mv` chết giữa chừng, để lại bản copy dở 288M lồng trong
  `build/slim-venv/i5-slim-venv-hidden/`. Đã xóa bản dở, rebuild lại
  cả 3 slim venv pristine (số byte khớp y hệt), stage lại bundle, làm
  lại relocation proof đúng cách (rename cùng filesystem). Cuối
  phiên, shell VM bắt đầu chặn copy nội dung file có mtime cũ (EPERM
  trên `cp`/`copyFileSync`/`write`, kể cả `cat file > dest`; file
  tạo mới trong phiên vẫn copy được; `touch` làm lại mtime thì copy
  được) — quirk môi trường VM, không phải lỗi sản phẩm; đã xử lý
  bằng `touch` cây nguồn rồi stage lại thành công.
- Kiểm chứng lại ở bước gộp: modelDownloader 11/11,
  bundledRuntime 10/10, bridgePidfile 14/14 (chạy chung 36/36,
  fail 0). KHÔNG chạy lại ở bước gộp: workload venv slim, tải model
  thật, relocation proof (số trong LIMITS I5 chỉ đối chiếu).

### 2.6 I6 — GOP: phiên lùi dài + moov giả + settled heap

- **Phiên lùi dài >60 s — xong cả 2 trần.** 16 MiB (tải nặng):
  playhead 72→2,9 s (lùi 69,1 s/150 s, 0,46×), gopActive suốt, 0
  fallback; cache 16,28 MiB/30 seg, eviction bắt đầu sau ~110 s,
  tổng evicted 4.317.300 byte; heap baseline 22,60 → đỉnh 57,54 →
  settled 40,72 MiB; 0 stall, 0 lỗi trang; 16/17 cổng. 8 MiB (đối
  chứng): playhead lùi trọn 72 s (~110 s); eviction cắn từ ~30 s,
  tổng evicted 16.244.324 byte (gấp ~4×), cache ghim ~8,13 MiB/15
  seg; heap 22,83 → đỉnh 66,09 → settled 35,07 MiB; 16/17 cổng.
  Trần đã khôi phục về 16 MiB (verify grep + H4 8/8 assert hằng 16).
  Lưu ý: tốc độ lùi nhanh hơn ở đợt 8 MiB là do tải máy khác nhau,
  không quy cho trần.
- **Moov giả — 2 lỗ hổng thật đã sửa + khóa bằng test.** Allocation
  bomb `parseMp4VideoTrack` (stts/stsz/ctts count 0xFFFFFFFF → OOM
  exit 134 cả 3 biến thể): guard `MAX_MP4_SAMPLES = 1.000.000`
  trong `mp4Demux.ts` — sau sửa lỗi ném trong 10–94 ms, heap ~8 MiB.
  Moov giả lồng nhau (stco 100.000.000 vượt EOF) → stream mode trả
  `gop-range` trước sửa: guard sample-bounds sau demux trong
  `gopRangeFetch39T3.ts` → giờ `full-file` cả 2 mode. Test mới 17/17
  (red-before đã verify trên source revert). Rủi ro dư: moov giả trỏ
  VÀO trong file vẫn qua được tầng T3 (ghi rõ trong LIMITS).
- **Settled heap — KẾT LUẬN ĐƯỢC:** transient +37 MiB sau import là
  ArrayBuffer của `sha256Hex` (app tự rơi về ~20,8 MiB ở t≈9,9 s
  nhờ GC tự nhiên, tái hiện ở cả 2 đợt). Cô lập 4 arm: A control (1
  copy → GC tự nhiên ~22 s → 0,46 MiB); B ingest clone (2 copy → 1
  giữ lại 37,7 MiB qua cả gc() ép); C thumb clone (→ 0,56 MiB —
  video preload minh oan); D thứ tự import thật (như B, giữ 37,8
  MiB). Nuance quan trọng: retention ở B/D là artefact của clone
  (Blob tạo từ ArrayBuffer); app thật put File disk-backed vào IDB
  nên không giữ — bằng chứng là idle-decay app về baseline. Settled
  thật sau import: ~20,8–22,8 MiB.
- **2 GET không Range đã xác định:** blob chính file 37 MiB (177 GET
  Range, 0 không Range) không bị tải toàn file; 2 GET không Range nằm
  trên 2 blob phụ (clip mẫu 8 s, probe metadata). Cổng FAIL theo chữ,
  đạt theo bản chất — đề xuất thu hẹp cổng cho blob chính ở đợt sau.
- Kiểm chứng lại ở bước gộp: test mới 17/17; hồi quy T3 10/10, H4
  8/8. KHÔNG chạy lại ở bước gộp: các lượt headed đo heap/phiên lùi
  (số trong LIMITS I6 chỉ đối chiếu).
- Vấn đề môi trường: page gọi `window.gc()` trong page treo renderer
  3/3 lần (gc từ ngoài qua CDP vẫn chạy tốt); Xvfb spawn tay hỏng
  (xkbcomp) → phải chạy headed dưới `xvfb-run -a`; file
  `heapIso52I6.mjs` bị truncate 0 byte do EPERM thoáng qua (đã làm
  tiếp trên bản headed, không mất số liệu).

### 2.7 I7 — Thống nhất mirror easing + FADE_CURVES + checker 243/0/0

- Cả 4 bản `applyEasing`/`applySpeedEasing` (TS, JS viết tay, render
  CJS) nay đều ném `easing không hỗ trợ: <easing>`. Đo thật trước
  sửa: package import → TS trả `undefined` → NaN; sau sửa → ném cùng
  message.
- Guard 3 caller preview chưa guard (kiểm kê toàn bộ caller trong
  `apps/web/src`, liệt kê trong LIMITS §1.3): `memoInterpolateKeyframes`
  (choke point mọi nội suy animation trong tick), `computeClipGain`
  (mỗi frame từ preview.tsx), `addKeyframeAt` (click KeyframePanel).
  Guard thử lại với easing lạ coi như `"linear"` (khớp sanitize cổng
  load) — đo thật: memo với keyframe bounce → `5` (= linear),
  computeClipGain bounce → gain `1`, không ném. Các caller khác đã
  guard sẵn — đã xác minh, không đổi. Caller edit-action (nestUtils
  trim/split, captionFollow) cố tình không guard (fail-fast ở action,
  không phải tick) — ghi rõ lý do trong LIMITS.
- `FADE_CURVES` đã có trong audio.js, khớp audio.ts. Xóa mục KNOWN
  duy nhất của tầng A.
- Checker mirror mở rộng: **64 pass / 7 known / 0 fail → 243 pass /
  0 known / 0 fail** (exit 0). Thêm probe hàm thuần
  (speed/audio/timebase/keyframes/speedcurve/validators/lut) + probe
  hằng (`value:`) cho mọi module. Kiểm chứng âm: lệch giả
  `DEFAULT_SPEED_BEZIER` → exit 1, 2 FAIL. Trong lúc mở rộng,
  checker bắt được **3 lệch catalog thật** (cùng mẫu `.js` kẹt
  snapshot gốc): `lut.js` 20→174 LUT, `sticker.js` 30→244 sticker,
  `textfx.js` 2 mô tả cũ — đã đồng bộ cả 3 từ `.ts` (khớp cả render
  mirror), checker về 0 fail.
- Kiểm chứng lại ở bước gộp: checker chạy lại **243 pass, 0 known,
  0 fail**; test mới 12/12; H5 render 17/17 (chỉ đối chiếu LIMITS),
  H5 web 13/13, F1 web 11/11 (2 test NaN cũ đã cập nhật sang assert
  ném — hòa giải xung đột với I2: F1 từng tụt 10/11 giữa lượt do
  hunk I7, nay về 11/11); MCP 8/8 (chỉ đối chiếu); hồi quy K1/P3/SR
  (chỉ đối chiếu LIMITS I7). Test I2 15/15 vẫn xanh sau hunk I7.
- Nợ mở: hàm thuần của adjustment/image/sticker/mask/motion/
  nested/migrations/tracking/index cần fixture phức tạp nên chưa
  probe (hằng của chúng đã probe); script đồng bộ catalog
  (lut/sticker/textfx) đợt này chạy bằng script tạm đã xóa — nên đưa
  vào `packages/video-spec/scripts/` ở đợt sau.

### 2.8 I8 — Seek pixel: landing-0 đáp đúng frame 0, KHÔNG thêm pixel check

- 46 probe pixel qua server không Content-Length (Chrome 156
  headed): landing-0 xảy ra **24/46 (≈52%)**, và **24/24 lần
  landing-0 đều hiển thị đúng frame 0.0** (hash `d4828fc3`); 22 lần
  đáp đúng đều là frame 2.5 (`8a8a7fa5`, 22/22). Không có lần nào
  hiển thị frame khác. Tỉ lệ std ở 3 s gộp 8/20 = 40%, khớp ~40–44%
  của H3. Đối chứng server CÓ Content-Length: 0/10 landing-0.
- Nhân quả seekable — mạnh hơn tương quan 6/6 của H3, nhưng vẫn ở
  mức hành vi: phân tách hoàn hảo mở rộng thành **56/56**:
  preSeekable `[[0,0]]` ⟺ landing-0, `[[0,3]]` ⟺ đáp đúng (cả file
  lành lẫn hỏng, cả 3 mode seek). Can thiệp chờ (arm W): đợi 12 s
  KHÔNG cứu được — seekable dính ở `[0,0]` suốt 12 s trong 6/10 tab
  rồi vẫn đáp 0; 4 tab seekable thành `[0,3]` sau ~100 ms thì đáp
  đúng. Loại trừ giả thuyết "race nhất thời, đợi thêm là hết".
  Liều-đáp ứng: seek ngay tại loadedmetadata → 10/16 (62,5%) đáp 0,
  cao hơn seek ở 3 s (gap 50%, valid 30%). **Kết luận:** nhân quả ở
  mức hành vi (trạng thái seekable tại lúc seek quyết định landing);
  đường clamp cụ thể trong source Chromium vẫn chưa đọc nên không
  claim mức code.
- "155 + http chunked" — VẪN NOT_MEASURED, nhưng sự chặn đã đo kỹ:
  binary 155.0.8059.91 khởi động được qua CDP, nhưng **70/70 lần
  navigate tới loopback bị chặn** (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`):
  127.0.0.1 cờ chuẩn (14), 127.0.0.1 + cờ tắt PNA (28), localhost +
  cờ PNA (28). Cờ
  `--disable-features=BlockInsecurePrivateNetworkRequests` không mở
  được. Cần daemon hoặc đổi policy hệ thống — ngoài phạm vi.
- Có nên thêm kiểm tra pixel vào đường seek? — **KHÔNG, giữ nguyên
  H3.** Tầng seek đã bắt landing-0 bằng fail-fast; pixel check vẫn
  đắt + dễ false-positive. Điểm mới: đề xuất thay thế rẻ hơn là
  **kiểm tra `seekable` trước khi seek** (phân tách 56/56) — chỉ đề
  xuất trong LIMITS, không implement (không đổi production code theo
  lệnh).
- Kiểm chứng lại ở bước gộp: seek 15/15, pauseSeekRecovery43Y2 9/9
  (chạy lại độc lập). KHÔNG chạy lại ở bước gộp: các probe headed
  của I8. Sự cố: lượt 1 bị VM restart cắt ở E-run6; log ở
  `~/workspace/` còn nguyên nên không mất dữ liệu — arm E chạy bù
  lượt 2, arm 155 chạy lượt 3–5. Trong lúc làm tự tìm và sửa 3 bug
  harness của chính mình (ghi trong LIMITS §8).

### 2.9 I9 — Preview FPS thật: ~1,4–4,6 fps, nghẽn là scheduler VM, không sửa code app

- **Preview FPS khi phát trên VM này: ~1,4–4,6 fps** (nhẹ/vừa/nặng,
  dev lẫn prod, headless lẫn headed) — rất xa 30 fps. Clip 1080p 1
  clip trơn nhanh hơn (7–10 fps) nhưng vẫn xa 30. Trang trống (đối
  chứng): 32,46 fps. **Điểm nghẽn là scheduler của VM, không phải
  code app** — nên **không còn thay đổi nào trong code app** (tối ưu
  đã thử đều không cải thiện và đã revert).
- Số đo (Chromium thật, viewport 1440×900, canvas 872×276 dpr=1,
  VM 4 vCPU không GPU, đếm rAF 6 s/lần): nhẹ dev headless 4,66;
  nhẹ dev headed Xvfb 1,59; vừa dev headed/headless 1,48/1,40; vừa
  dev **tạm dừng 19,65**; chỉ text (không video) dev headless 1,47;
  vừa prod headless 4,09/4,59/1,43 (3 lần); vừa prod ẩn canvas 1,56;
  nặng prod 3,27; **1080p 1 clip proxy ON prod 9,79/10,47**;
  **1080p 1 clip gốc (proxy OFF) prod 6,98/8,22**. Phương sai lớn
  theo từng lần chạy (cùng project vừa trên prod: 1,43/4,09/4,59) —
  không có "một con số" duy nhất. Proxy nhanh hơn gốc ~25–40% (lặp
  lại cả 2 lần) nhưng vẫn << 30 fps. Playhead chỉ tiến ~0,14–0,2×
  realtime khi FPS thấp (clamp `dt` 0,1 s).
- Bằng chứng nghẽn scheduler: CDP trace có `tdur` — tick preview dài
  nhất 1096 ms wall nhưng chỉ **20,6 ms thread-time**; các tick khác
  71–85 ms wall / 4–7 ms thread-time. Main thread gần như không có
  task giữa các frame — nó **chờ compositor**, còn compositor/GPU
  process cũng chờ được schedule. Loại trừ bằng đo thật: decode
  (text-only 1,47), LUT/effect (nhẹ 1,59), raster (ẩn canvas 1,56),
  kích thước cửa sổ/canvas (960×600 vẫn 4,59), load VM (1,43 fps ở
  load 0,86), JS bão hòa (steady-state 94,9% idle), GPU process
  (~7% CPU), rAF riêng (setInterval 16 ms chỉ chạy 31–45 lần/s thay
  vì ~62 — renderer đói chung). Cơ chế: mỗi frame là chuỗi nối tiếp
  main thread → compositor → GPU process → present; trên VM
  oversubscribed (load 1–26 do luồng khác) mỗi hop trả phí
  scheduling 100–1000 ms.
- Tối ưu đã thử: `desynchronized: true` trên canvas 2D — đo trước/
  sau (medium 1,79; heavy 1,84 fps — nằm trong khoảng nhiễu
  1,43–4,59) → **không cải thiện nên đã revert toàn bộ**,
  `preview.tsx` không còn thay đổi nào (grep `desynchronized` = 0).
  Hoãn AudioContext: đóng — `kickAudio` đã warm sẵn ở pointerdown,
  ngoài cửa sổ đo. Không làm tối ưu mù khác (canvas đã đúng kích
  thước hiển thị; proxy đã là mặc định khi bridge chạy).
- Phát hiện phụ quan trọng: **proxy chỉ sống trong phiên** — manifest
  AssetStore không lưu `proxyUrl`; item restore sau reload không có
  `file` nên nút Proxy không render (đo proxy phải import→proxy→
  phát cùng phiên). Caveat: media mẫu mau-1/2 chỉ có trên origin
  `:5173`; manifests trên `:4173` rỗng — các lần đo prod chạy với
  asset thiếu (không decode video). Số dev (media đủ) và prod đều
  ~1,4–4,6 nên kết luận không đổi, nhưng đừng so dev-vs-prod như
  cùng điều kiện. Số VM này **không kết luận được máy người dùng**
  — cần đo lại trên máy thật có GPU.
- Kiểm chứng lại ở bước gộp: `previewEngine.test.ts` 14/14;
  `test-preview-engine.sh` fail đúng chỗ **pre-existing dòng 547**
  (wipeleft 51,5 vs 50, như ROUND51 §2.6) — không phải hồi quy
  (chỉ đối chiếu LIMITS I9, không chạy lại suite). `tsc` 0 + vite
  build pass (2 lần, lần cuối sau revert). 23 JSON kết quả đã kiểm
  tra: 22 file JSON hợp lệ, 1 file 0 byte
  (`preview-fps-r52-medium-prod-timer.json`, lần chạy bị kill — giữ
  làm bằng chứng theo I9).

## 3. Kiểm chứng gộp của parent (lượt này, chạy lại độc lập)

- Đối chiếu baseline: đúng 40 file đổi + 55 file mới, khớp chính
  xác hợp 9 danh sách LIMITS (0 file lạ, 0 file thiếu, không
  binary/dist; 2 file dist-web đổi + 1 file dist-web mới loại khỏi
  batch theo tiền lệ). tsconfig đủ 4 dòng exclude mới. i18n không
  đụng tới đợt này.
- `tsc --noEmit` apps/web: **0 lỗi**. `tsc --noEmit`
  apps/desktop: **0 lỗi**.
- `vite build`: **pass** (5,17 s; chỉ cảnh báo chunk > 500 kB có sẵn).
- Checker mirror chạy lại: **243 pass, 0 known, 0 fail**.
- Test mới chạy lại: H2 10/10, I2 15/15, I7 12/12, I6 17/17, I3
  19/19 (ALL PASS), desktop modelDownloader 11/11 +
  electronOrphanCleanup 11/11 + bridgePidfile 14/14 (36/36) — fail 0.
- Hồi quy chạy lại: H1 11/11, F1 web 11/11, H5 web 13/13,
  audioEngine44Z2 6/6, previewEngine51H6 15/15, previewEngine 14/14,
  T3 10/10, F3 15/15, C4 10/10, E4 13/13, H4 8/8, seek 15/15,
  pauseSeekRecovery43Y2 9/9, serviceManager 10/10, bundledRuntime
  10/10.
- Lưu ý cách chạy: test có top-level await (`seek.test.ts`) phải
  chạy bằng `node --experimental-strip-types`, không bundle CJS
  (esbuild ném lỗi top-level await — lỗi cách chạy, không phải
  code). Các test import extensionless khác bundle `--format=cjs`
  như ghi chú ROUND51 §3.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS/TTS
  WAV/heap/smoke AppImage/full-run H9 của các luồng, phiên solo
  thật, đo IDB thật, click-test headed từng panel, Safari/máy
  thật/GPU thật. Parent không sửa logic luồng nào; chỉ viết LIMITS
  tổng hợp này, file paths và mục log. Ngoại lệ duy nhất: không có
  — mọi điểm nối (H2→H1 đã có từ đợt 51; I2↔I7 trên audioEngine/
  KeyframePanel) chỉ kiểm chứng lại, không sửa thêm.

## 4. Nợ mở cho đợt 53 (tổng hợp từ LIMITS I1–I9 + phát hiện lúc gộp)

1. **TTS:** transfer theo text 1.172 (F3 §8.3) — chưa đo text medium
   thứ hai cho giọng chậm; điểm giữa đường cong Q14/Trúc Ly (chỉ 5
   điểm) chưa đo thêm; fallback ghi WAV sang đĩa chưa từng kích hoạt
   thật; nguyên nhân gốc 2 lần lỗi ghi WAV thoáng qua chưa xác định
   (không quyền đọc dmesg).
2. **Audio/preview:** đường tick preview thật cho `computeClipGain`
   với `[null]` chưa chứng minh headed (I2 §6.1); playhead chậm do
   clamp `dt` 0,1 s khi FPS thấp (I9); proxy mất sau reload (manifest
   không lưu `proxyUrl`) — cần nối proxy vào restore.
3. **Electron/menu (nặng nhất):** dialog GTK gõ path không ghi file
   (M4/M5/D2a — chụp dialog sau khi gõ + thử XSetInputFocus lên
   dialog + click nút Save thay vì Return + log kết quả
   `showSaveDialog` ở main); menu action M10–M26 không tới renderer
   sau M9 (probe riêng từng menu 1–4, kiểm tra textBands popup
   Chỉnh sửa/Xem/Cửa sổ/Trợ giúp, load lại sample trước M12); harness
   tự tạo fixture + fail-fast khi thiếu (lưu fixture vào
   `hidden_files/h9/`, không phải /tmp); M6 (Escape không đóng dialog
   Thêm media) + M7 (submenu Mở gần đây hover không mở); D4
   exitCode=127 đợt 51 (đo lại khi app sống); dialog nhập tên trong
   app thay `window.prompt` trên desktop; `startXvfb` xóa cả
   `.tX<N>-lock`; GPU FATAL trên Xvfb (cân nhắc `--disable-gpu` /
   `--disable-gpu-sandbox` cho AppImage khi chạy click-test).
4. **Electron khác:** CDP bind trước khi dọn (lần chạy dọn tự mất
   CDP, chỉ trống cho lần sau — cần wrapper launcher pre-spawn nếu
   muốn sửa); con Chromium tự thoát không đều (<1 s tới ≥7 s);
   `stop()` chờ start đang bay tối đa 30 s; Windows/macOS chưa triển
   khai (no-op); bgremove **không có venv** (rembg ≤2.0.54 cần Python
   <3.11, VM chỉ có 3.12.3) và model chưa verify checksum; tốc độ tải
   file model lớn chưa đo (chỉ chứng minh 2.370 byte); cần ~4G đĩa
   cho AI đầy đủ; venv chỉ Linux x86_64 + Python 3.12; AppImage tăng
   ~1G khi opt-in venv (mặc định không bundle); downloader chưa kiểm
   tra dung lượng trống trước khi tải.
5. **GOP/seek:** moov giả trỏ VÀO trong file vẫn qua được tầng T3;
   tách settled heap sau phiên lùi dài thành frame cache vs GOP
   cache; thu hẹp cổng GET không Range cho blob chính; "155 + http
   chunked" (cần daemon/policy hệ thống); đường clamp trong source
   Chromium chưa đọc; cutoff `buffered [[0,2.367]]` xuất hiện trong
   mọi lần đáp 0 ở mode std nhưng chưa giải thích được; guard
   `seekable` pre-seek chưa implement (đề xuất I8, chưa làm).
6. **Keyframe/mirror:** hàm thuần của adjustment/image/sticker/mask/
   motion/nested/migrations/tracking/index cần fixture phức tạp nên
   chưa probe (hằng của chúng đã probe); script đồng bộ catalog nên
   đưa vào `packages/video-spec/scripts/` ở đợt sau.
7. **Preview FPS:** Safari/máy thật/GPU thật chưa đo; heavy-dev +
   light-prod chưa đo; Chrome từng SIGTRAP ~19:00–19:10 ngày 06/11
   (tự hết, nguyên nhân không rõ). Số FPS trên VM này không kết luận
   được máy người dùng.
8. **Chung:** tốc độ tổng hợp TTS 0,02–0,51× realtime (median 0,12×
   trên 83 mẫu), mâu thuẫn "~1,5–2,5×" trong memory — chưa rõ memory
   ghi trên máy/model khác; không sửa memory theo quy ước. VM restart
   2 lần trong đợt (17:53 UTC + 1 lần lúc I8 E-run6); /tmp tmpfs
   512M mất sau reboot — fixture/log quan trọng phải copy về
   `hidden_files/` ngay. Shell VM chặn copy file mtime cũ (EPERM,
   I5/I6 gặp) — xử lý bằng `touch` rồi copy lại.

## 5. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round52-i3-menu-clicktest.txt`
  (5 entry, đã có từ luồng I3 — parent chỉ verify read-back: đủ file)
- `~/workspace/repo-1-push/paths-loop/phase9-round52-i4-electron-reliability.txt`
  (12 entry, đã có từ luồng I4 — parent chỉ verify read-back)
- `~/workspace/repo-1-push/paths-loop/phase9-round52-i5-ship-venv-models.txt`
  (21 entry, đã có từ luồng I5 — parent chỉ verify read-back)
- `~/workspace/repo-1-push/paths-loop/phase9-round52-i6-gop-long-session.txt`
  (5 entry, đã có từ luồng I6 — parent chỉ verify read-back)
- `~/workspace/repo-1-push/paths-loop/phase9-round52-closing-debts51.txt`
  (**60 entry**, parent stage ở lượt này: 19 file đổi I1/I2/I7/I8/I9
  + 40 file mới I1/I2/I7/I8/I9 + LIMITS tổng hợp này; NUL-delimited,
  NUL cuối, không binary, không dist; đã verify read-back 60 entry +
  mọi file tồn tại)

Tổng batch đang chờ user push sau đợt này: **10 file paths / 230
entry** (127 trước đợt 52 + 5 I3 + 12 I4 + 21 I5 + 5 I6 + 60 parent;
các đợt 1–51 đã push xong — đợt 22–50 push chiều 06/11, HEAD
e2cb35e1; Phase 10 + H7 + H8 + đợt 51 vẫn chờ).
