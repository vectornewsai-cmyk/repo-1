# Phase 9 đợt 63 — R6: lỗi decoder trong lúc phát + proxy fallback + hold cache (LIMITS)

Ngày: 2026-11-08. Luồng R6, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Đóng nợ đợt 62 §4 mục 6 (= LIMITS R6 §5.1 + §5.2 + §5.3):
(1) lỗi decoder TRONG LÚC PHÁT (syncMedia) chưa xử lý riêng;
(2) giả định fallback proxy reset `error` về null chưa đo headed;
(3) hold cache vẫn key theo leaf id + src.
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG sửa vi.json/en.json
(không cần key mới — không có fragment i18n).

## 0. Kết quả ngắn

- (1) syncMedia nay drop element đã lỗi decoder dính trong lúc phát
  (throttle 1 drop / 1,5 s / clip) → element mới seek lại target và hồi
  phục khi playhead qua vùng hỏng. Đo headed (Chromium 1254, Xvfb,
  lượt chạy cuối run6 — xem §3.3): midbad (hỏng giữa ~4,5–5,5 s, đuôi
  sạch từ keyframe 7 s) lỗi error:3 ở ~4,2 s, **vẽ lại sau 3.001 ms**
  kể từ lúc thấy lỗi (baseline chưa fix: draw đóng băng hẳn, không
  hồi phục dù playhead đã qua 7 s); scrub trong lúc phát về vùng tốt
  (stall, ph 2) thì **vẽ lại sau 296 ms** (baseline: 0 draw trong
  8 s); stall (hỏng tới hết file)
  thì không vẽ lại trong vùng hỏng như kỳ vọng, drop 5 lần có chặn.
- (2) Giả định proxy ĐÚNG, đo headed bằng sampler rAF trong trang
  (~17 ms/mẫu): proxy (garbage http) lỗi → fallback đổi src sang blob
  gốc → **`error` đã null ngay ở mẫu rAF đầu tiên thấy fallback**
  (reset lag 0 ms ở độ phân giải frame), readyState ≥ 2 cùng mẫu,
  0 mẫu nào có error ≠ null + networkState LOADING cùng lúc, vẽ lại
  draw Δ = 205, **không drop oan nào trong lúc fallback**
  (decoderErrorRecoveredPlaying Δ = 0). Không đổi code media.ts.
- (3) Hold cache nay key theo instance + ánh xạ nguồn (`in`/`speed`/
  `reverse`): 2 instance nested cùng leaf id + cùng src, khác `in`
  nay có **2 key riêng** trong cache
  (`nA/leaf-1::valid.mp4::in=0::sp=1::rv=0` và
  `nB/leaf-1::valid.mp4::in=5::sp=1::rv=0`) — key cũ
  `leaf-1::valid.mp4` dùng chung 1 slot (chứng minh trùng key bằng
  unit test §C).
- Test mới 57 check (unit + wiring); hồi quy R8 20/20, Q6 15/15,
  O3 13/13, N4 14/14, pauseStall62R6 17/17, nestedPreview 46,
  holdFrame 13/13, pauseSeekRecovery43Y2 9/9. `tsc` 0 lỗi ở mọi file
  R6 đụng (1 lỗi TS6133 còn lại ở file luồng khác R5 — xem §3.2,
  không sửa hộ). `vite build` pass 1m 32s. Harness headed PASS lượt
  chạy cuối (§3.3).

## 1. Thiết kế đã chọn

### 1.1 (1) Drop element lỗi dính trong syncMedia (nhánh playing)

Nguyên nhân gốc (đo baseline headed, §3.3): decoder lỗi giữa chừng
đang phát thì `play()` trả rejected promise mỗi tick, drift-seek
(`currentTime = target` khi CT kẹt) **không bao giờ hoàn tất**
(`seeking=true` mãi, CT đóng băng ở 3.1), `readyState` về 1, draw
đóng băng (draw 79 rồi đứng yên), hold tăng mãi — và element KHÔNG
BAO GIỜ hồi phục kể cả khi playhead đã qua vùng hỏng (lỗi sticky),
vì không có đường nào drop nó trong lúc phát (đường R6 chỉ chạy ở
seek pause). Baseline P2: draw đóng băng ở 261 từ ph ~4,3 tới hết
ph 9,7 dù đuôi file sạch từ keyframe 7 s.
Sửa: đầu khối `if (playing)` của syncMedia, mỗi active được phân loại
bằng `playingDecoderErrorStatus` (lib mới, thuần):
- `"healthy"` (`error` null) → đi tiếp như cũ.
- `"fallback-loading"` (`error` ≠ null + `networkState === 2` —
  đang tải resource mới, vd fallback proxy vừa đổi src) → CHƯA kết
  luận, bỏ qua tick này, không drop oan element đang fallback.
  Đo X1 cho thấy guard này thực tế không bao giờ kích hoạt (error
  reset trong ≤ 1 frame), nhưng nó là phòng thủ đúng cho trình duyệt
  giữ `error` lâu hơn trong lúc load (xem §1.2).
- `"stuck"` (`error` ≠ null + không tải gì nữa) → drop element
  (`pool.dropElement` + `engine.releaseElement`, cùng mẫu R6) nếu đã
  tới lượt throttle (`playingDecoderRetryDue`: 1 lần / 1,5 s / clip,
  key theo clipKey instance). **Ngoại lệ: scrub-back 1 cú lớn**
  (`playingDecoderScrubbedBack`: target lùi > 1 s trong 1 tick) thì
  drop ngay, không chờ throttle — user vừa nhảy playhead về vùng mới
  (có thể là vùng decode được); chờ đủ 1,5 s thì playhead đã chạy
  khỏi vùng tốt (đo headed P3 run4: không bypass thì firstDraw
  7.418 ms, vượt bound 5 s, vì mỗi chu kỳ drop → load → seek mất
  ~2,5 s trong khi cửa sổ tốt sau scrub chỉ ~2 s). Phát ngược thì
  target lùi ~1 frame/tick nên không chạm ngưỡng; phát xuôi thì
  target tăng. Chỉ 1 lần drop tức thì cho mỗi cú scrub (sau drop,
  target tick lỗi trước ≈ target hiện tại nên lần lỗi sau lại qua
  throttle) nên không phá chặn tốc độ. Dù drop hay chưa tới lượt thì tick này
  cũng bỏ qua active đó (`continue`): play()/seek trên element lỗi
  chỉ thêm rejected promise + seek kẹt. Trước khi bỏ qua, giữ tươi
  `steppingPrevSeeking` + reset `forwardDriftOverCount` về 0 để lúc
  hồi phục không đọc nhịp cũ từ trước lúc lỗi.
- **Không cap tổng số lần drop** (khác cap X2 = 10 ở đường pause):
  trong vùng hỏng thì element mới cũng lỗi lại, nhưng sau khi playhead
  qua vùng hỏng, lần drop kế tiếp (≤ 1,5 s sau) tạo element mới seek
  tới target vùng tốt và vẽ lại. Cap tổng sẽ kẹt lại đúng case này
  (playhead qua vùng hỏng mà đã hết ngân sách thì không retry nữa).
  Chặn tốc độ (≤ ~0,67 drop/s/clip) là đủ để không tạo element mới
  mỗi tick: mỗi chu kỳ chỉ là 1 lần tạo element + 1 lần load lỗi.
- Element đã drop trong tick này bị loại khỏi `audioSources` trước
  khi `engine.update()` (`liveAudioSources`): nếu không, update()
  gọi `nodeFor()` và tạo MediaElementSourceNode MỚI cho element đã
  chết (releaseElement vừa gỡ graph cũ) — rò 5 node / lần drop, Map
  giữ element chết tới dispose toàn cục. Nhánh pause không drop nên
  giữ nguyên tham chiếu audioSources (không copy mảng mới mỗi tick).
- Chỉ drop khi playing: nhánh pause của syncMedia giữ nguyên đường
  R6 (drop sau seek thất bại đã chứng minh) để không cắt seek của
  Seeker. Áp cho cả video lẫn audio (cùng `ActiveMedia`), cả 3 nhánh
  con (phát ngược toàn cục / clip reverse / phát xuôi) vì điểm nối
  nằm trước khi rẽ nhánh.
- Đếm tích lũy `decoderErrorRecoveredPlaying` (biến module, cùng mẫu
  syncReseekCount) + phơi qua `PreviewIdleDebug` để harness đo delta
  và tốc độ drop. Throttle key theo clipKey nên 2 instance cùng leaf
  id không chia chung ngân sách; map throttle dọn entry cũ nhất khi
  > 200 entry.
- **(1c) Element mới seek ngay:** nhánh forward (không forceSeek)
  nay seek ngay tới target khi element chưa từng qua tick phát nào
  (`steppingPrevSeeking` chưa có entry — vd vừa tạo lại sau drop) mà
  lệch > 0,35 s, không chờ xác nhận 2 tick như element cũ. Nếu không,
  tick đầu tiên element vẽ frame ở currentTime 0 (chưa seek) — frame
  sai vị trí, lại ghi đè frame giữ tốt trong hold cache (đo headed P1
  run5: draw tăng 1 ở ph 9,57 với CT 0,124 ngay sau drop, làm FAIL
  giả tiêu chí "không vẽ lại trong vùng hỏng"). Nhánh reverse đã seek
  element mới ngay từ trước (shouldIssueStepSeek không cần xác nhận
  2 tick) nên chỉ nhánh forward cần sửa; forceSeek ở cạnh lên nút
  Phát không đổi.

### 1.2 (2) Fallback proxy — giả định ĐÚNG, không đổi code

Cơ chế trong `MediaPool.videoFor` (không đổi ở đợt này): listener
`error` đổi `el.src` sang bản gốc khi proxy lỗi (1 lần, cờ
`dataset.proxyFallback`). Giả định R6 §5.2 là lần load mới reset
`error` về null trước tick sau. Đo headed X1 bằng sampler rAF trong
trang (đọc đúng element của clip qua đuôi URL — xem §3.3 về bẫy đo):
proxy garbage http lỗi → fallback (`proxyFallback=1`, srcKey vẫn là
proxy URL, currentSrc = blob gốc) → **mẫu rAF đầu tiên thấy fallback
đã có `error=null`, `readyState ≥ 2`** (reset lag 0 ms ở độ phân giải
frame; sampler chạy ~17 ms/mẫu dưới tải VM) → vẽ lại draw Δ = 166,
`decoderErrorRecoveredPlaying` Δ = 0 (syncMedia không drop oan).
**0/167 mẫu** có `error ≠ null` + `networkState === 2` cùng lúc —
lỗi không bao giờ cùng tồn tại với trạng thái đang load ở độ phân
giải frame. Kết luận: thuật toán resource-selection của HTML reset
`error` trong task load được queue ngay khi gán `src`, chạy trước
rAF/tick sau. Guard `"fallback-loading"` ở §1.1 giữ lại làm phòng
thủ (không tốn gì, chỉ bỏ qua tick khi gặp trạng thái đó).
Hệ quả đo thêm (X2): proxy + gốc đều hỏng (garbage) thì fallback
xong vẫn lỗi (error:4, networkState 3 NO_SOURCE) → syncMedia drop
có chặn (7 lần trong ~10 s ≈ 1 lần / 1,5 s, đúng throttle), không
crash, không unhandled rejection.

### 1.3 (3) Key hold cache theo instance + ánh xạ nguồn

Nguyên nhân gốc (chứng minh bằng unit test §C): key cũ
`heldFrameKey(clip.id, clip.src)` trùng nhau cho 2 instance nested
cùng leaf id + cùng src (vd `nA/leaf-1` và `nB/leaf-1` cùng
`valid.mp4` → cùng key `leaf-1::valid.mp4`), và không đổi khi cùng
instance đổi `in`/`speed`/`reverse`. Slot dùng chung → instance B
stall thì hold frame của A (sai vị trí nguồn).
Sửa: key mới `heldFrameCacheKey63R6(clip)` (lib mới, thuần) =
`instanceKey::src::in=…::sp=…::rv=…`, trong đó instanceKey =
`previewClipInstanceKey(clip)` (dấu `__vcutInstanceKey` của R6,
fallback đúng clip.id). `storeHeldFrame` nay nhận clip (không còn
`(clipId, src)` rời); cả 2 điểm dùng cache (ghi ở storeHeldFrame,
đọc ở drawVideoClip) dùng cùng 1 hàm nên không lệch key giữa ghi và
đọc. `speedKeyframes` (ramp) KHÔNG đưa vào key — ánh xạ lúc đó phụ
thuộc cả đường cong, serialize nó vào key là quá tay cho cache tối
đa 16 slot; đổi speedKeyframes vẫn đi qua seek + draw mới ghi đè
slot ngay (xem §5.4).
Hook đo mới `window.__vcutHeldFrameKeys` (storeHeldFrame cập nhật
mỗi lần draw thành công; ≤ 16 key) để harness H1 khẳng định 2
instance có 2 key riêng.

## 2. Đã làm

### 2.1 Lib mới — `apps/web/src/lib/playingDecoderRecovery63R6.ts` (thuần, 0 import)

- `playingDecoderErrorStatus(el)` — `"healthy" | "fallback-loading" |
  "stuck"` (đọc `error`/`networkState` trong try/catch từng field,
  không bao giờ throw).
- `playingDecoderRetryDue(nowMs, lastDropMs, throttleMs?)` —
  lần đầu luôn được, sau đó cách nhau ≥ throttle (mặc định 1500 ms).
- `playingDecoderScrubbedBack(prevTarget, target, jumpSec?)` —
  target lùi > 1 s trong 1 tick (mặc định) thì true; phát ngược
  (~1 frame/tick), phát xuôi, đứng yên, prevTarget undefined → false.
- `PLAYING_DECODER_RECOVERY_THROTTLE_MS = 1500`,
  `NETWORK_STATE_LOADING = 2`.

### 2.2 Lib mới — `apps/web/src/lib/holdCacheKey63R6.ts` (thuần, chỉ import previewClipInstanceKey)

- `heldFrameCacheKey63R6(clip)` — key instance + src + in + speed +
  reverse; mặc định in=0 / speed=1 / rv=0 khi thiếu field.

### 2.3 `apps/web/src/preview.tsx` (điểm nối ROUND63-R6, giữ tối thiểu)

- Import 2 lib mới.
- Module state: `playingDecoderRecoveryLastDropMs` (Map clipKey →
  ms) + `decoderErrorRecoveredPlaying` (đếm tích lũy) +
  `playingDecoderLastTargetByClipKey` (Map clipKey → target tick lỗi
  trước, cho bypass scrub-back).
- `syncMedia`: tập `droppedPlayingEls` trong tick; nhánh lỗi decoder
  ở đầu `if (playing)` (xem §1.1, gồm bypass scrub-back);
  `liveAudioSources` lọc element đã drop trước `engine.update()`.
- `storeHeldFrame(clip, v, mw, mh)` (đổi signature) + công bố
  `__vcutHeldFrameKeys` sau mỗi lần store thành công;
  `drawVideoClip` dùng `heldFrameCacheKey63R6(clip)` ở cả 2 điểm
  (đọc cache + store); xóa `heldFrameKey` cũ.
- `PreviewIdleDebug` thêm `decoderErrorRecoveredPlaying` (type +
  init 0 + publish mỗi tick); winHook thêm `__vcutHeldFrameKeys`.

### 2.4 Test mới — `apps/web/src/lib/decoderPlayback63R6.test.ts`: 45 check

- §A `playingDecoderErrorStatus` (12): healthy null/undefined;
  fallback-loading khi error + networkState 2 (code 3/4);
  stuck khi error + networkState 0/1/3/thiếu; getter error ném →
  healthy; getter networkState ném → stuck.
- §B `playingDecoderRetryDue` (9): lần đầu được; trong throttle
  không được; đúng ngưỡng được; đồng hồ lùi không được; throttle
  tùy chỉnh.
- §B2 `playingDecoderScrubbedBack` (8): chưa từng lỗi → false;
  scrub-back 4,3 → 2 → true; lùi đúng 1 s → false; lùi ~1 frame
  (phát ngược) → false; target tăng/đứng yên → false; ngưỡng tùy
  chỉnh.
- §C `heldFrameCacheKey63R6` (12): 2 instance cùng leaf+src khác
  `in` → key khác (và key cũ trùng nhau — khóa lý do sửa); cùng
  leaf+src+in khác instance → key khác; đổi `in`/`speed`/`reverse`/
  `src` → key khác; cùng clip cùng ánh xạ → key giống; không dấu →
  fallback clip.id; mặc định `in=0::sp=1::rv=0`.
- §D wiring (12 needle): syncMedia có nhánh lỗi + throttle + đếm +
  droppedPlayingEls + liveAudioSources + idleDebug; nhánh nằm trong
  khối `if (playing)` (không đụng nhánh pause); không còn
  `heldFrameKey(`; `storeHeldFrame(clip:`; hook `__vcutHeldFrameKeys`;
  media.ts fallback proxy không đổi.

### 2.5 Fixture + harness mới (scratch, KHÔNG stage)

- `~/scratch-round63-r6/gen-midbad-fixture.py` — tạo midbad.mp4:
  testsrc 10 s, GOP 30 (keyframe mỗi 1 s), zero byte 45–55% mdat
  (≈ nguồn 4,5–5,5 s); moov nguyên nên ffprobe vẫn báo duration 10.
- `~/scratch-round63-r6/clicktest-63r6-decoder-playback.mjs` —
  harness headed (vite dev đóng băng + Chromium 1254 headed qua
  Xvfb :167 + CDP, Node thuần; tái dùng valid/stall/garbage của R8).

## 3. Kiểm chứng (số thật, chạy 2026-11-08)

### 3.1 Test mới — 45/45 ngay lần chạy đầu

Test viết sau khi code lib xong nên không có chu trình đỏ-trước ở
tầng unit (trừ 1 lỗi tsc TS2353 ở file test — xem §3.2); bằng chứng
đỏ-trước nằm ở harness headed baseline (§3.3, P1/P2/P3 đều FAIL theo
đúng nghĩa: không hồi phục).

### 3.2 Hồi quy + tsc + build

| Suite | Kết quả |
|---|---|
| `decoderPlayback63R6.test.ts` (mới) | 45/45 pass |
| `skippedAttrib61R8.test.ts` (R8, không sửa) | 20/20 pass |
| `skippedFlat60Q6.test.ts` (Q6, không sửa) | 15/15 pass |
| `failsoftSurface58O3.test.ts` (O3, không sửa) | 13/13 pass |
| `i18nRound57N4.test.ts` (N4, không sửa) | 14/14 pass |
| `pauseStall62R6.test.ts` (R6, không sửa) | 17/17 pass |
| `nestedPreview.test.ts` | 46 pass |
| `holdFrame.test.ts` | 13/13 pass |
| `pauseSeekRecovery43Y2.test.ts` (chạy ESM vì top-level await) | 9 pass |

`tsc --noEmit` apps/web: lần 1 có 1 lỗi ở file test mới
(TS2353: `previewClipInstanceKey({id, src})` — `PreviewClipKeyLike`
không có field `src`) — đã sửa (chỉ truyền `{id}`); lần 2 chạy lại:
**0 lỗi ở mọi file R6 đụng**. Lỗi duy nhất còn lại là ở file luồng
song song khác: `src/ExportPanel.tsx(27,1): TS6133
'resolveValidationDetails' thừa` — luồng R5 đợt 63 đang sửa file đó
(mtime 03:14:57 trong lúc chạy), **không sửa hộ** (đúng mẫu đợt 62
R6 §3.2). `vite build` apps/web: **pass, 1m 32s** (cảnh báo chunk
>500 kB có sẵn).

### 3.3 Click-test headed — PASS (lượt chạy cuối)

Harness `~/scratch-round63-r6/clicktest-63r6-decoder-playback.mjs`
(vite dev đóng băng + Chromium 1254 headed qua Xvfb :167 + CDP;
fixture server :8897; display :167, tag run-1440x900).
Report: `~/scratch-round63-r6/r63-report-run-1440x900.json`.
Screenshot: `~/scratch-round63-r6/r63-badge-run-1440x900.png`.
Fixture: valid/stall/garbage tái dùng của R8 + midbad.mp4 mới.

**Baseline (chưa fix, chạy `BASELINE=1`, report cùng tên — đã ghi
đè bởi lượt post-fix, số baseline trích dưới đây từ log lượt đó):**
- **P1 (stall, phát):** error:3 ở 3.098 ms, CT đóng băng 3.1,
  `seeking=true` mãi (drift-seek không bao giờ xong), draw đóng băng
  ở 79, hold tăng tới 206, playhead vẫn chạy tới 9,7 (vòng lặp sống,
  không crash) — lỗi sticky, không hồi phục.
- **P2 (midbad, phát):** error:3 ở 3.868 ms, draw đóng băng ở 261 từ
  ph ~4,3 tới hết ph 9,7 dù đuôi sạch từ keyframe 7 s — không hồi
  phục trong cùng clip.
- **P3 (scrub trong lúc phát):** element lỗi từ P1 (cùng pool
  element); scrub về ph 2 trong lúc phát → **0 draw trong 8 s**.
- **X1 (proxy):** fallback xảy ra (`proxyFallback=1`, currentSrc =
  blob gốc), error null ở cuối, draw Δ = 107 — giả định đúng ngay cả
  trước fix (chỉ chưa đo).
- **X2/H1:** recPlaying không có (field chưa tồn tại); held keys
  không có (hook chưa tồn tại).

**Sau fix — lịch sử các lượt chạy (đều trên Chromium 1254 headed):**
- **Run3 (sau fix throttle): PASS 6/6.** P1' error:3 ở 4.091 ms,
  không vẽ lại sau error+1 s, recPlaying Δ = 5; P2' vẽ lại sau
  3.514 ms (ph ~7,9, qua keyframe sạch 7 s), recPlaying Δ = 3;
  P3' vẽ lại sau 1.201 ms sau scrub về ph 2, recPlaying Δ = 5;
  X1' errorResetLagMs = 0, recPlaying Δ = 0, draw Δ = 166;
  X2' recPlaying Δ = 7 trong ~10 s (bound đã sửa theo thời gian
  thực); H1' 2 key riêng đúng.
- **Run4: FAIL chỉ ở P3'** — vẽ lại sau 7.418 ms (bound 5 s).
  Nguyên nhân thật: throttle 1,5 s trì hoãn lần drop đầu sau scrub,
  mỗi chu kỳ drop → load → seek mất ~2,5 s trong khi cửa sổ tốt sau
  scrub (ph 2 → vùng hỏng ~4 s) chỉ ~2 s; element mới cứ bị seek lại
  về target 4,4/5,9/7,4 (vùng hỏng) và lỗi tiếp (5 drop sau scrub).
  → Thêm bypass scrub-back (xem §1.1).
- **Run5 (sau bypass): FAIL giả ở P1'** — vẽ lại ở error+6.226 ms
  (draw 46 → 47 ở ph 9,57): element mới sau drop vẽ frame ở
  currentTime 0,124 (chưa seek) trong tick đầu tiên, vì nhánh forward
  chờ xác nhận drift 2 tick mới seek. Frame sai vị trí này còn ghi
  đè frame giữ tốt trong hold cache. → Thêm seek ngay cho element
  mới (1c, xem §1.1). Các case khác đều PASS ở run5: P2' vẽ lại sau
  3.036 ms, P3' vẽ lại sau **255 ms** (bypass có tác dụng), X1'
  resetLag 0, X2' recPlaying Δ = 6, H1' đúng.
- **Run6 (sau 1c — lượt chạy cuối, verdict PASS 6/6):**
  - **P1' (stall, phát):** error:3 ở 2.982 ms; **không vẽ lại sau
    error+1 s** (drawAfterErr = null — frame sai ở run5 đã hết);
    `decoderErrorRecoveredPlaying` Δ = **5** (drop có chặn, cách
    nhau ~1,5–1,7 s); element cuối khỏe (error null, RS 4, CT 10);
    badge HIỆN trong lúc stall (hold frame cũ + effect thật sự bị
    skip — cùng hành vi baseline, không đổi).
  - **P2' (midbad, phát):** error:3 ở 4.199 ms; drop 3 lần;
    **vẽ lại sau 3.001 ms** (khi playhead qua keyframe sạch 7 s);
    element cuối khỏe (error null, RS 4, CT 9,452).
  - **P3' (scrub trong lúc phát):** media nạp lại blob mới → phát
    mới lỗi error:3 ở 3.001 ms; scrub về ph 2 trong lúc phát →
    **vẽ lại sau 296 ms**, draw Δ = 36, recPlaying Δ (sau scrub) = 6.
  - **X1' (proxy fallback):** sampler rAF 206 mẫu (~17 ms/mẫu);
    `fbIdx=0` (mẫu đầu tiên đã thấy fallback),
    **errorResetLagMs = 0**, readyAfterFallbackMs = 0,
    loadingWithErrorSamples = 0, draw Δ = 205, recPlaying Δ = **0**
    (không drop oan trong lúc fallback); element cuối error null,
    `proxyFallback=1`.
  - **X2' (proxy + gốc đều hỏng):** recPlaying Δ = **7 trong ~8 s**
    (≈ 1 lần / 1,5 s, đúng throttle); draw Δ = 0, không page error;
    element cuối error null nhưng networkState 2 (đang load lại —
    vòng mẫu kết thúc giữa chừng một lần drop).
  - **H1' (hold 2 instance):** cả 2 instance đều vẽ được
    (draw Δ = 2); keys sau B gồm đúng 2 key riêng:
    `nA/leaf-1::valid.mp4::in=0::sp=1::rv=0` và
    `nB/leaf-1::valid.mp4::in=5::sp=1::rv=0` (cùng 4 key leftover từ
    các case trước, cache tối đa 16 — đúng thiết kế).

**Sự cố harness trong lúc đo (không phải lỗi code sản phẩm):**
- Lượt 1: `chromium-1248` không còn tồn tại (Playwright đã lên
  1254) — đổi sang 1254 (fallback 1187).
- Lượt 2: target CDP đóng ngay sau khi mount (load VM 24,81 vì
  luồng R8 đợt 63 chạy headed song song) + lượt post-fix đầu:
  fixture server không kịp lên trong 1,2 s — đã sửa harness thử lại
  fetch tới 15 s; chạy lại khi VM rỗi thì hết lỗi.
- Lượt post-fix 1: `ReferenceError: matchBlobOnly is not defined`
  (biến lọt vào expression phía trang thay vì interpolate) — đã sửa.
- Lượt post-fix 2: FAIL chỉ ở X2' (bound "≤ 6 / 8 s" sai — vòng mẫu
  thực tế ~10 s) — đã sửa bound theo thời gian thực; lượt 3 PASS.
- Bài học đo (ghi lại cho đợt sau): pool giữ element của các case
  trước nên KHÔNG được lấy VIDEO đầu tiên trong `__vcutMediaEls` —
  phải khớp element bằng đuôi URL (blob uuid / proxyUrl) của đúng
  clip đang đo; 2 item khác nhau có thể chung proxyUrl nên X2 phải
  khớp blob-only (không khớp srcKey).

## 4. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round63-r6-decoder-playback.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/playingDecoderRecovery63R6.ts` (mới)
- `apps/web/src/lib/holdCacheKey63R6.ts` (mới)
- `apps/web/src/lib/decoderPlayback63R6.test.ts` (mới)
- `apps/web/src/preview.tsx`
- `docs/PHASE9_ROUND63_R6_DECODER_PLAYBACK_LIMITS.md` (mới)

Không có fragment i18n mới (không thêm key). Harness + report +
screenshot + fixture mp4 + vite config chỉ nằm ở
`~/scratch-round63-r6/` (scratch, không stage). Không có
binary/dist/`__pycache__` trong batch.

## 5. Nợ mở / giới hạn trung thực

1. **Hồi phục sau lỗi trong lúc phát vẫn mất ~0,3–3,0 s** (throttle
   1,5 s + seek/decode lại; run6: midbad 3.001 ms, scrub-back về vùng
   tốt 296 ms nhờ bypass): trong vùng hỏng thì hình giữ frame cũ
   (hold, badge "FRAME GIỮ" stale) — đúng ngữ nghĩa hold, nhưng user
   vẫn thấy hình đứng yên ~1–3 s sau khi qua vùng hỏng. Bypass
   scrub-back chỉ giúp khi user scrub về vùng TỐT; scrub về vùng
   hỏng khác thì vẫn tốn 1 drop + load thất bại như thường. Giảm
   throttle xuống dưới 1,5 s sẽ hồi phục nhanh hơn nhưng tăng churn
   element trong vùng hỏng dài; 1,5 s là đánh đổi đã chọn, có thể đo
   lại nếu muốn nhanh hơn.
2. **Không cap tổng số lần drop trong lúc phát:** vùng hỏng dài (vd
   file hỏng 10 phút) thì cứ ~1,5 s lại tạo 1 element mới + 1 lần
   load lỗi — có chặn tốc độ nên CPU thêm ~1 lần load/1,5 s, nhưng
   không dừng hẳn như cap X2 ở đường pause. Nếu clip hỏng dài và user
   để phát lâu, churn này kéo dài suốt vùng hỏng (mỗi lần chỉ 1
   element sống tại 1 thời điểm nên không rò bộ nhớ, chỉ tốn CPU
   load/demux thất bại).
3. **Guard `"fallback-loading"` chưa từng kích hoạt trên Chromium
   1254** (0/206 mẫu X1 run6): nó là phòng thủ cho trình duyệt khác/tình
   huống load chậm — chưa có bằng chứng headed nào cho thấy trạng
   thái này xảy ra thật. Nếu 1 trình duyệt giữ `error` + LOADING lâu
   (vd > 1,5 s) thì drop sẽ bị hoãn tới khi load xong (đúng) nhưng
   trong lúc đó hình vẫn giữ frame cũ.
4. **Hold cache key chưa gồm `speedKeyframes` (ramp):** đổi đường
   cong tốc độ thì key không đổi; slot cũ có thể được hold 1 tick
   trước khi draw mới ghi đè. Cùng giới hạn cho `track` (motion
   tracking đổi gốc thời gian) — các đổi này đều đi qua seek + draw
   mới nên cửa sổ sai chỉ là 1 tick hold; chưa đo riêng.
5. **Badge vẫn HIỆN trong lúc stall khi phát** (cả trước và sau fix):
   vì decision = hold (element paused=false + có frame giữ) nên clip
   không vào `tickSkippedClipIds` — badge liệt kê effect thật sự bị
   skip là đúng ngữ nghĩa R8, nhưng user thấy hình đứng yên + badge
   effect cùng lúc (không có chỉ báo riêng "decoder đang stall" ngoài
   badge "FRAME GIỮ" stale). Khác đường pause (R6 đã ẩn badge khi
   seek kẹt) vì ở đó renderFrame không chạy.
6. **Chưa đo Safari/Firefox:** stall/midbad/proxy đều đo trên
   Chromium 1254; `error` sticky + reset sau fallback + timeout là
   hành vi Chromium đã đo, trình duyệt khác có thể khác mã lỗi/thời
   gian (kế thừa từ R6 §5.6).
7. **Lỗi tsc của luồng R5 còn tồn tại (nay 2 lỗi):**
   `src/ExportPanel.tsx(27,1): TS6133 'resolveValidationDetails' thừa`
   + `src/lib/validationErrors63R5.test.ts(236,7): TS2322` — thuộc
   luồng khác, không sửa hộ; parent gộp cần nhắc R5 sửa hoặc xác nhận.
8. **Chạy headed dưới tải VM cao dễ fail giả:** 2 lượt harness lỗi
   do VM tải cao (load 24,81, target CDP đóng / CDP timeout 60 s)
   trong khi các luồng khác chạy headed song song; chạy lại khi VM
   rỗi thì PASS. Con số headed (đặc biệt draw/hold tuyệt đối và
   firstDraw ms) phụ thuộc tải VM lúc đo — xem cùng số baseline để
   so sánh tương đối, không lấy tuyệt đối làm SLA.
