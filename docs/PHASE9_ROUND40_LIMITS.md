# Phase 9 đợt 40: đóng nợ đợt 39 — LIMITS tổng hợp

> Đợt 40 gồm 6 luồng V1–V6 chạy song song sáng 03/11/2026 từ lượt cron
> (chốt chặn sạch: không có `round-in-progress.md`), đóng nợ §5 của
> `docs/PHASE9_ROUND39_LIMITS.md`. KHÔNG push, KHÔNG tag/release,
> KHÔNG binary, KHÔNG dist. Mọi số dưới đây đều là số đã chạy thật;
> chỗ nào chưa đo được thì ghi rõ, không mạo nhận.

## 1. Đợt 40 đã làm gì (tóm tắt theo luồng)

- **V1 — solo runner + perSeek** (`PHASE9_ROUND40_V1_SOLO_PERSEEK_LIMITS.md`):
  runner `seek-ab-solo-run.mjs` nay đọc thật `perSeek` từ
  forward-hold.json qua `extractPerSeekReport` (3 trạng thái
  present / absent / enabled-but-missing), thay chuỗi hardcode
  "absent…" cũ; `buildProbeEnv` chỉ spread env + ghi đè đúng 6 khóa
  `Q6_*`, không tự sinh `N2_PERSEEK`. Luồng cờ N2_PERSEEK=1
  solo→Q6→N2 đã xác nhận bằng unit + fixture + audit code
  (Q6 spread env khi spawn N2, N2 đọc cờ ở dòng 76). Test runner
  16/16 (11 cũ + 5 mới), cổng v3 13/13, probe T2 10/10, self-test
  và dry-run exit 0. **Không chạy phiên solo thật, không khóa
  <10%, không chốt v3, không đổi ngưỡng/cổng nào.**
- **V2 — nối GOP Range vào ReversePreviewController**
  (`PHASE9_ROUND40_V2_GOP_WIRING_LIMITS.md`): module T3 nay được
  controller gọi thật trước khi tải toàn file, chỉ 1 lần/controller;
  lỗi → rơi về `load()` cũ, không throw. Ngưỡng khóa bằng test:
  **32 MiB < size ≤ 128 MiB và chỉ khi đã biết size trước cửa sổ
  đầu tiên**, mặc định TẮT (preview bật tường minh, marker
  `ROUND40-V2-GOP`). Trên 128 MiB cố tình KHÔNG mở lại để giữ
  khóa 0-request của đợt 39 T4. Cache GOP LRU 32 MiB / 32 GOP,
  cửa sổ khác bị miss thì fetch bù đúng 1 GOP bằng Range; cửa sổ
  chỉ decode khi mọi GOP giao nó đã có mặt. Test mới 16/16
  (fixture ffmpeg 6 GOP: 8 request 206, 0 GET toàn file), hồi quy
  T3 10/10, gate U2 20/20, S4 6/6, T5 6/6, T4-toggle 11/11, R3 10/10.
  Decode thật cần VideoDecoder nên test Node chỉ khẳng định đường
  nối tới bước decode — không mạo nhận đã decode.
- **V3 — sửa lỗi vòng lặp preview pause t=0 không vẽ**
  (`PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md`): nguyên nhân gốc khớp
  trace T6 §3.3 (tick seek xong skip vì element chưa có frame
  nhưng vẫn gán `lastDrawn=t` → ngủ với nền đen). Hướng gợi ý cũ
  ("chỉ gán lastDrawn khi vẽ được") đúng nhưng chưa đủ — sửa đầy
  đủ 2 nửa: `.then` của seek ở nhánh pause chỉ gán lastDrawn khi
  không skip thêm clip nào (delta `holdStats.skip`), và tick sau
  vẽ lại mà không seek mới khi seek đã xong nhưng frame chưa vẽ.
  Không đụng nhánh playing, guard 2 s, `seekCompletedThisTick`.
  Unit mới `pauseDraw40V3` 11/11, hồi quy T6 đủ. Đối chứng browser
  Chromium headed: DSF=1 PASS (mean 130,0 vs nền 12,67), DSF=2
  PASS (backing 1424×468 đúng trần min(dpr,2)), DSF=1 dưới tải
  nặng PASS với skip 3 → draw 1 — đúng đường retry mới.
- **V4 — settle-drop + seekRuler**
  (`PHASE9_ROUND40_V4_SETTLE_RULER_LIMITS.md`): **settle-drop nay
  có bằng chứng browser** — lượt 1 bắt được `inFlightPrefetchWindows
  = 1`, tắt toggle + pause ngay, sau settle + refresh mirror:
  `settledPrefetchDroppedFrames` 0 → 60 (delta 60 frame),
  `uiStatus = off`, `prefetch = 0`, badge "TẮT". Nợ browser của T4
  đóng. **seekRuler KHÔNG hỏng nên KHÔNG sửa handler**: T4 báo
  "0 → 0" là lỗi harness (click thô ngoài viewport 1440 px trên
  ruler rộng 4200 px); cuộn `.tl-scroll` cho mục tiêu vào viewport
  rồi click lại → cur = 33 đúng. Chỉ tách phép ánh xạ ra hàm thuần
  `timelineRulerSeek40V4` để test khóa được. Click-test mới 7/7,
  unit mới 6/6, hồi quy U1 12/12, T4 11/11, i18n 962/962.
  Delta 60 ≠ prefetch 91 lúc setup — chỉ khẳng định delta > 0 +
  trạng thái cuối đúng, không claim dọn toàn bộ 91 frame.
- **V5 — relink/alias + importFiles %**
  (`PHASE9_ROUND40_V5_RELINK_LIMITS.md`): `importFiles` thường nay
  có callback tiến trình (pha hashing có % thật, pha storing ghi
  rõ "đang ghi — không có %"); MediaBin hiện banner + thanh % ở
  pha hashing. Alias liên tab dùng Web Locks
  (`vcut-alias:<assetId>`, hàng đợi trong-tab trước, lock liên tab
  trong, throw → chạy tiếp không lock). Click-test Chromium thật
  5/5: import MP4 65,3 MiB, hashing ≈ 14,4 s, **ghi IDB thật
  ≈ 11,6 s — lần đầu đo ghi đĩa IDB thật** (đợt 39 chỉ fake IDB).
  Test mới 6/6, hồi quy T5 11/11, U3 7/7, assetStore 22/22,
  importAsset 8/8, rehydrate 19/19. Mọi số V5 đều under-load
  (6 luồng song song), cấm dùng làm baseline quiet.
- **V6 — cổng CPU (chuẩn bị khóa, KHÔNG khóa) + probe per-seek v2**
  (`PHASE9_ROUND40_V6_CPU_PERSEEK_LIMITS.md`): tách 2 tiêu chí Node
  thành `cpuGateNodeDiag40V6` đo được từng tiêu chí (passed, vòng
  trượt, margin, pattern, verdict pass/fail-busy/fail-idle/…),
  tiêu chí cấu hình/tắt riêng, hàm `evaluateGateWithNodeDecision`
  luôn ghi "CHƯA KHÓA". Chẩn đoán trên số thật under-load: cả 3 bộ
  U4 + T6 lần 1/2 **chỉ trượt busy, idle luôn đạt** — phiên quiet
  chỉ cần quyết câu hỏi busy. Không tìm thấy bug tầng Node
  (sampler chạy lại: busy 96,3% / idle 4,5%), không sửa sampler,
  không nới ngưỡng, `locked: false` giữ nguyên, chưa nối vào
  harness nào. Probe v2 (mặc định TẮT): thêm `elementId` + mẫu
  `decodedSamplesWhileSeeking` trong lúc seeking (trần 1000
  mẫu/entry), 17 trường spec cũ giữ nguyên, entry v1 vẫn validate
  đạt. Test diag mới 17/17, cổng T6 cũ 8/8, probe 18/18 (10 cũ +
  8 mới), gate v3 13/13, solo 16/16.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập)

- Đối chiếu đĩa với baseline hash đầu đợt (`round40-baseline.sha256`,
  32.550 file): đúng **31 file** đổi/mới, khớp chính xác hợp
  6 danh sách LIMITS (15 sửa + 16 mới, 0 file lạ, 0 file xóa,
  không binary, không dist). File chung gộp nguyên vẹn:
  `preview.tsx` đủ marker V2 (`ROUND40-V2-GOP`) và V3
  (`ROUND40-V3-T0`, V4 không đụng preview vì handler ruler nằm ở
  `Timeline.tsx`); `tsconfig.json` đủ 5 dòng exclude test mới
  đợt 40 (gopWiring, pauseDraw, timelineRulerSeek, relink, cpuGateNodeDiag);
  i18n phẳng vi=en **962/962**, vi-only = en-only = [].
- `tsc --noEmit`: **0 lỗi**; `vite build`: **pass (5,45 s)**,
  cảnh báo chunk > 500 kB cũ, không phải lỗi mới.
- Chạy lại test (bundle esbuild, reporter spec; test script chạy
  trực tiếp bằng node --test): solo 16/16 + per-seek 18/18 = 34/34
  script; gopWiring 16/16, pauseDraw 11/11, relink V5 6/6,
  timelineRulerSeek 6/6, cpuGateNodeDiag 17/17, T3 10/10, gate U2
  20/20, T4-toggle 11/11, relink T5 11/11, cpuGate T6 8/8,
  reversePlayback T6 10/10 — tất cả fail 0. Hai test relink cần
  format ESM do top-level await (cùng tiền lệ các đợt trước, lỗi
  của cách bundle CJS, không phải lỗi code); solo `--self-test`
  và `--dry-run` đều exit 0.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của
  các luồng (chỉ đối chiếu LIMITS + JSON đã lưu), phiên solo thật,
  đo ingest IDB Chromium thật, click-test full-app V4 (đối chiếu
  báo cáo + script `node --check` pass).
- Sửa của parent ở bước gộp: không sửa logic luồng nào; chỉ viết
  LIMITS tổng hợp này, file paths và log. Đính chính chéo: nợ "solo
  runner dùng được probe" trong LIMITS V6 §nợ đã được V1 đóng
  trong cùng đợt (đừng làm lại ở đợt 41).

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round40-closing-debts39.txt`
  (32 file text, NUL-delimited, không binary, không dist, đã
  verify read-back 32 entry + mọi file tồn tại): 31 file đợt 40 +
  file LIMITS tổng hợp này.
- Tổng batch đang chờ user push sau đợt này: 19 file paths
  (đợt 22–40; các đợt 1–21 đã push xong chiều 29/10).
  Tổng số file cộng dồn theo các file paths: đợt 22–39 là 844 file
  (theo log đợt 39), + 32 đợt 40 = 876 file — con số này là tổng
  các entry paths (có file xuất hiện ở nhiều đợt), không phải số
  file duy nhất.

## 4. Loại khỏi batch — và lý do

- `apps/web/dist/`: build lại ở bước gộp, theo tiền lệ không vào
  batch.
- Scratch ngoài repo: `~/workspace/tmp-round40-v1/` … `v6/`,
  `/tmp/r40tests/`, `/tmp/round40-current.sha256` — không vào batch.
- `package-lock.json`: không đổi trong đợt này (baseline hash khớp)
  nên không có gì để loại thêm; lưu ý đợt 38 về lock vẫn giữ nguyên
  khi user push.

## 5. Nợ mở cho đợt 41 (từ LIMITS V1–V6, không trùng batch đã stage)

1. **Phiên solo A/B thật vẫn chờ cửa sổ yên liên tục ~20–40 phút**
   (V1): chạy từ main chat kèm `N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10`,
   lượt đầu kiểm tra `perSeekProbe.status == "present"` trước khi
   chạy tiếp; sau đó mới khóa <10% + chốt v3. Cờ
   `near-threshold-load5` vẫn chưa tự ghi trong runner; Q6 labeled
   vẫn chưa mang perSeek (cần copy tường minh).
2. **Phiên headed/solo quiet đầu tiên với probe v2** (V6): tách
   seek-scheduling khỏi decode stall trên số thật; đối chiếu entry
   unresolved bằng `elementId` + `flushElementSrc`; quyết có cần
   nhãn cơ chế mới từ mẫu seeking hay `analyzeSeekingSamples`
   đã đủ.
3. **Cổng CPU: khóa chỉ sau phiên quiet có điều phối** (V6): chạy
   probe U4 3 vòng lúc máy yên, dùng `diagnoseNodeLayer` đọc từng
   tiêu chí; nếu busy vẫn trượt thì quyết sửa ngưỡng hay loại
   busy — cấm khóa từ dữ liệu under-load.
4. **GOP wiring:** đo trên file > 128 MiB thật qua bridge thật chỉ
   có ý nghĩa ở đợt riêng quyết mở lại file lớn kèm chứng minh
   heap (đường hiện tại không kích hoạt trên 128 MiB); proxy chưa
   biết size vẫn đi đường full-file cũ; lần tải T3 đầu vẫn tốn
   tổng byte ≈ file (lợi ích GOP chỉ từ cửa sổ thứ hai trở đi);
   ngưỡng 32 MiB chưa hiệu chuẩn bằng số bridge thật; Safari /
   máy thật / fragmented / moov > 16 MiB chưa đo.
5. **Settle-drop nhánh hoãn-dọn** (V4): prefetch settle đúng lúc
   decode cửa sổ đang bay vẫn chỉ có test thuần, chưa có bằng
   chứng browser; bằng chứng settle hiện chỉ trên fixture testsrc2
   360p, Chrome headless, under-load.
6. **Relink:** đua alias 2 tab app thật end-to-end chưa chứng minh
   (mới chứng minh từng mắt xích); Safari/Firefox/máy thật chưa
   kiểm chứng lock; % mới chỉ hiện ở MediaBin, các caller
   importFiles khác chưa truyền callback; file > 128 MiB và số lúc
   máy yên chưa đo.
7. **Preview t=0:** DSF=2 + race (skip rồi retry) chưa bắt trực tiếp
   trên browser (bằng chứng race hiện ở DSF=1 dưới tải); media hỏng
   vĩnh viễn → vòng lặp tick rAF mãi thay vì ngủ (đánh đổi đã ghi,
   chưa đặt cap); dpr phân số, 4K ở dpr > 1, Safari/máy thật chưa đo.
8. **Chung:** mọi số timing đợt 40 đều under-load (6 luồng song
   song) hoặc gắn dist cũ — cấm dùng làm baseline quiet hay claim
   fps; footage B-frame vẫn chưa đo cho nhiều mảng trên.
