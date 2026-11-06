# Phase 9 đợt 49, luồng E4 — BUG volumeKeyframes NULL + củng cố vòng lặp preview — LIMITS

Ngày: 06/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng.
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **BUG volumeKeyframes NULL — ĐÃ SỬA, đỏ-trước / xanh-sau (§3).**
   Quyết định: làm CẢ HAI hướng, vai trò khác nhau — (A) sanitize ở
   cổng load là FIX gốc rễ (dữ liệu xấu không bao giờ vào store),
   (B) bọc tick bằng try/catch là PHÒNG THỦ CHIỀU SÂU (đường
   in-memory không qua cổng load cũng không giết được vòng lặp).
   A một mình để hở đường in-memory (MCP/devtools/undo); B một mình
   để dữ liệu xấu nằm lại trong store (volume sai, render vẫn có thể
   nổ). Bằng chứng headed (§3.4): project M1 của D3 nay load seeded,
   vòng lặp sống (ngủ sau settle, ticks 6, 0 lỗi), scrub 2.5 vẽ được;
   lỗi tick tổng hợp trong 3 s làm tickErrors 21→162 nhưng ticks vẫn
   tăng 27→168 (vòng lặp không chết), gỡ lỗi + scrub 2.5 thì hồi phục
   (ngủ, lastDrawn 2.5, tickErrors đóng băng ở 162, 0 lỗi uncaught).
2. **Các keyframe array khác — ĐÃ QUÉT + SỬA CÙNG MẪU (§2).**
   `animations` (x/y/opacity/scale/rotation) có CÙNG lỗi: previewEngine
   chỉ check truthy (`a.x ? memoInterpolateKeyframes(...)`) nên
   `{keyframes: [null]}` vẫn ném trong tick; `speedKeyframes` sống sót
   nhờ try/catch ramp nhưng dữ liệu vẫn bẩn. Cả ba loại field đều được
   sanitize ở cổng load (kèm test khóa từng loại + nested subSpec).
3. **Quirk đáp sai frame khác 0: 2 hướng mới đều không đáp sai (§4).**
   Keyframe 1.0 hỏng (GOP giữa) → seek 1.5 hỏng pipeline error 3
   (cùng chữ ký C3/D3), seek 2.5 đáp đúng (hỏng GOP-local, không lan
   sang GOP sau); file 2 track video đáp đúng 2.5. Quirk VẪN
   NOT_MEASURED.
4. **Hồi quy pause 111/111 + audioEngine 6/6 + E4 mới 13/13 (§5).**
   tsc 0 lỗi, vite build pass.

## 1. Phân tích code trước khi đo

### 1.1 Cơ chế bug (D3 §3.2, đã xác minh bằng stack thật)

Tick pause → `syncMedia` (preview.tsx ~1840) → `collectActives`
→ `computeClipGain` (audioEngine.ts) → `interpolateKeyframes([null])`
→ `normalizeKeyframes` giữ `[null]` → `ks[0].v` ném TypeError.
Tick không có try/catch; `scheduleNext()` ở cuối tick không chạy;
`sleeping` vẫn false nên `wake()` no-op — vòng lặp chết cứng tới
khi reload trang với project khác.

### 1.2 Hai hướng sửa — đánh giá rủi ro (đọc code, chưa đo)

- **A. Sanitize ở cổng load (`parseProjectText`, projectRepo.ts):**
  sau `validateSpecDeep`, trước khi trả spec — loại entry null /
  không hợp lệ khỏi mọi keyframe array (volumeKeyframes,
  speedKeyframes, animations.*), đệ quy cả nested subSpec; mảng
  rỗng sau lọc → xóa luôn field để caller rơi về giá trị tĩnh
  (guard `length > 0` đã có ở `computeClipGain`; animations cần
  kiểm tra caller — xem §2). Mẫu đã có trong cùng hàm:
  `migrateProjectMotion` + `normalizeTextStyles` (đợt 27 K1) làm
  đúng kiểu này — điền/sửa spec tại cổng load để cả mở file lẫn
  khôi phục autosave đều được sửa. Rủi ro thấp: chỉ chạm dữ liệu
  đã qua validate, không đổi control-flow vòng lặp; project lành
  không đổi gì (filter giữ nguyên entry hợp lệ).
- **B. Bọc tick bằng try/catch (preview.tsx):** thân `loop` dài
  (~700 dòng, `scheduleNext()` ở cuối) — bọc trực tiếp đòi thụt
  lề toàn bộ thân; cách ít rủi ro hơn là tách thân thành `tickInner`
  rồi `loop = (now) => { try { tickInner(now); } catch { ...;
  scheduleNext(); } }`. Rủi ro trung bình: catch phải gọi
  `scheduleNext()` (không thì vòng lặp vẫn chết theo cách khác),
  và lỗi dai dẳng sẽ làm loop quay nóng + spam log — cần đếm lỗi
  qua `idleDebug` để harness thấy, không âm thầm nuốt lỗi.
- **Quyết định: làm CẢ HAI, với vai trò khác nhau — A là FIX
  (xử lý gốc rễ: dữ liệu xấu không bao giờ vào store), B là
  PHÒNG THỦ CHIỀU SÂU (mọi đường in-memory khác — sửa tay qua
  MCP/devtools, undo — không qua cổng load cũng không giết được
  vòng lặp).** A một mình để hở đường in-memory; B một mình để
  dữ liệu xấu nằm lại trong store (volume sai, render vẫn có thể
  nổ). Cả hai đều nhỏ, độc lập, test được riêng.

### 1.3 Các keyframe array khác — quét sơ bộ (đọc code, kiểm chứng ở §2)

- `volumeKeyframes` (audio clip): `computeClipGain` gọi
  `interpolateKeyframes` khi `kfs.length > 0` — KHÔNG lọc null →
  **cùng lỗi** (đây chính là bug M1).
- `speedKeyframes`: `rampSpeedAt` / `rampSourceTimeAt` có
  try/catch nội bộ (D3 §1.1) — M10 sống sót headed. Vẫn sanitize
  ở cổng load cho đồng nhất (dữ liệu sạch thì ramp khỏi fallback).
- `animations` (x/y/opacity/scale/rotation): cần kiểm tra caller
  trong previewEngine xem có guard `length > 0` không — xem §2.
- `interpolateKeyframes` (video-spec): giữ nguyên contract
  (ném khi mảng rỗng sau normalize) — KHÔNG đổi để khỏi lệch
  mirror render `server/render/src/keyframes.js`.

## 2. Quét các chỗ interpolateKeyframes được gọi với mảng từ project

Kết quả quét (grep toàn `apps/web/src` + đọc từng caller):

| Nơi gọi | Mảng từ project | Guard trước khi gọi? | Cùng lỗi? |
|---|---|---|---|
| `audioEngine.ts` `computeClipGain` | `clip.volumeKeyframes.keyframes` | `kfs.length > 0` — KHÔNG lọc null | **CÓ — chính bug M1** |
| `previewEngine.ts` `videoClipVisual` (~812–851), `videoElementPlacement` (~898–913), `textSrPlacement` (~1288–1304, ~1372), `nestedPreview` (~1460–1462) | `animations.{x,y,opacity,scale,rotation}.keyframes` qua `memoInterpolateKeyframes` | Chỉ check truthy object (`a.x ? ...`, `a.opacity ? ...`) — `{keyframes: [null]}` là truthy nên vẫn gọi; `{keyframes: []}` cũng truthy → ném "mảng keyframes rỗng" | **CÓ — cùng mẫu lỗi, cả null lẫn mảng rỗng** |
| `previewEngine.ts` `memoInterpolateKeyframes` | (trung gian, gọi `interpolateKeyframes` trực tiếp) | Không | Kế thừa lỗi từ caller trên |
| `KeyframePanel.tsx` (~147, ~216, ~325), `KeyframeGraph.tsx` (~85) | `animations` của clip đang sửa trong UI | Panel ~147 có `kfs.length > 0`, nhưng ~216/~325 gọi trực tiếp khi prop active | Một phần — UI chỉ chạm clip đang mở trong phiên (dữ liệu đã qua load, nay đã sạch); không sửa thêm ở luồng này, xem nợ §7 mục 5 |
| `rampSpeedAt` / `rampSourceTimeAt` (speedKeyframes) | `speedKeyframes.keyframes` | try/catch nội bộ (D3 §1.1) — M10 sống sót headed | Không ném, nhưng dữ liệu bẩn → vẫn sanitize ở cổng load |
| `nestedPreview.ts`, `curveFix.ts` | (không gọi `interpolateKeyframes` trực tiếp) | — | Không |
| Mask keyframes | module riêng, không qua `interpolateKeyframes` | — | Không (đã kiểm tra grep) |

Kết luận quét: **3 loại field cần sanitize — volumeKeyframes,
speedKeyframes, animations.* — tất cả đều được sanitize ở cổng
load (§3.1).** Không đụng `interpolateKeyframes` (giữ contract +
parity với mirror render). Render mirror
`server/render/src/audiomix.js` `buildVolumeInterpExpr` cũng ném
với `[null]` (sort comparator `a.t` ném trước) — sanitize ở cổng
load web cũng bảo vệ đường render nhận spec từ web; đường render
tự đọc file thô (nếu có) vẫn hở — xem nợ §7 mục 4.

## 3. Sửa bug (đỏ-trước / xanh-sau)

### 3.1 Sanitize ở cổng load (fix gốc rễ)

File: `apps/web/src/lib/projectRepo.ts` (chỉ file này + test +
`tsconfig.json` exclude cho test mới; KHÔNG đụng `store.ts` —
luồng E6 cũng chạm `store.ts` (loadSample) nên luồng này chỉ sửa
phần validate keyframes trong projectRepo, đúng như task dặn).

- Mới: `sanitizeKeyframeArrays(spec): string[]` (export) —
  mirror mẫu `normalizeTextStyles`: walk tracks → clips, đệ quy
  nested subSpec (seen-set sao chép theo nhánh), mutate tại chỗ
  (chỉ dùng cho object vừa JSON.parse ở cổng load). Mỗi clip
  sanitize `volumeKeyframes`, `speedKeyframes`,
  `animations.{x,y,opacity,scale,rotation}` qua helper
  `sanitizeOneKeyframedValue`:
  - entry bị loại: null / không phải object / `t` hoặc `v` không
    phải số hữu hạn. KHÔNG loại theo `t` ngoài [0, duration]
    (interpolate clamp được, không đổi ngữ nghĩa thời gian) và
    KHÔNG đụng thứ tự/số lượng entry hợp lệ.
  - easing lạ → chuẩn hóa về `"linear"` (`applyEasing` không có
    default: easing lạ trả undefined → NaN lan ra gain).
    `speedKeyframes` giữ thêm `"bezier"` (speed curve hỗ trợ).
  - KeyframedValue không phải object, `keyframes` không phải mảng,
    hoặc mảng rỗng sau lọc → XÓA LUÔN FIELD để caller rơi về giá
    trị tĩnh (computeClipGain guard `length > 0`; animations:
    `a.x ? ...` thành falsy → dùng giá trị mặc định).
  - Trả về đường dẫn field đã sửa (dạng
    `tracks[i].clips[j] (clip "id").<field>`, kèm `.subSpec.`).
- Nối vào `parseProjectText` sau validate + migrate motion +
  `normalizeTextStyles` (cùng vị trí, cùng lý do: cả mở file lẫn
  khôi phục autosave đều qua đây). Fail-soft như speedCurve:
  project vẫn mở được, chỉ ghi warning + field mới
  `LoadResult.keyframeFixes?: string[]` (mirror `textStyleFixes`);
  cổng fail đặt `keyframeFixes: []`. KHÔNG thêm StructuredNote
  mới (tránh đụng union code + key i18n của các luồng khác);
  warning chuỗi đã đủ cho UI/load-report.
- Đỏ-trước (script `/tmp/e4-red-baseline.mjs`, chạy trước khi sửa):
  load ok, `volumeKeyframes` sau load còn `{"keyframes":[null]}`,
  `computeClipGain` NÉM `TypeError: Cannot read properties of
  null (reading 'v')` — đúng bug D3 M1. Chạy lại sau khi sửa:
  `volumeKeyframes` sau load là `undefined`, `computeClipGain`
  KHÔNG ném (trả 0.5 = volume tĩnh).
- Test khóa: `apps/web/src/lib/projectRepoRound49E4.test.ts`
  (13 test, chạy `node --experimental-strip-types`):
  M1 `[null]` → field bị xóa + có fix/warning; M1 hành vi →
  gain = volume tĩnh 0.5, không ném; `[null, hợp lệ]` giữ entry
  hợp lệ; keyframes không phải mảng / field không phải object →
  xóa field; entry thiếu `v` bị loại; `animations.opacity [null]`
  → xóa; nhiều prop cùng lúc (x giữ, scale giữ, rotation xóa);
  `speedKeyframes [null]` → xóa; easing lạ → linear; nested
  subSpec cũng sanitize; project lành → 0 fix, 0 warning keyframes,
  spec deep-equal (stableStringify); `sanitizeKeyframeArrays`
  trực tiếp trả [] khi không có gì sửa. **13/13 xanh** (trước
  sửa: import `sanitizeKeyframeArrays` lỗi + baseline đỏ như trên).

### 3.2 Bọc tick bằng try/catch (phòng thủ chiều sâu)

File: `apps/web/src/preview.tsx` — hunk duy nhất của luồng này
trong file (đổi tên `loop` → `tickInner` + thêm wrapper `loop` +
field `tickErrors` trong `PreviewIdleDebug`):

- Thân `loop` cũ đổi tên thành `tickInner` (1 dòng); mọi tham
  chiếu `requestAnimationFrame(loop)` trong thân (early-return
  chưa có canvas/wrap, `scheduleNext`, `wake`) GIỮ NGUYÊN tên
  `loop` nên trỏ về wrapper mới — wrapper được định nghĩa sau
  `tickInner` nhưng trước mọi lần gọi nên không vướng TDZ.
- Wrapper: `try { tickInner(now); } catch (err) { tickErrors++;
  idleDebug.tickErrors = tickErrors; console.error("[preview]
  tick lỗi, vòng lặp tiếp tục:", err); scheduleNext(); }`.
  Catch GỌI `scheduleNext()` (không thì vòng lặp vẫn chết theo
  cách khác). KHÔNG nuốt lỗi âm thầm: mỗi lần ném đều
  `console.error` + đếm vào `idleDebug.tickErrors` để harness
  đo được; lỗi dai dẳng thấy rõ qua tickErrors tăng mỗi tick
  thay vì vòng lặp chết im.
- Giới hạn đã biết (ghi rõ, không giấu): double-rAF chỉ xảy ra
  nếu chính `scheduleNext()` ném (gần như không thể — chỉ đọc
  state + requestAnimationFrame); early-return `if (!ctx) return;`
  (preview.tsx ~2467) vẫn trả về mà không đặt lịch — lỗ tiền
  sẵn, `getContext("2d")` trên canvas thực tế không trả null nên
  không sửa trong luồng này (xem nợ §7 mục 6).

### 3.3 Quyết định hướng sửa (chốt)

**Cả hai (A fix + B phòng thủ), lý do ở §1.2.** Không chọn một
hướng duy nhất vì hai hướng vá hai tầng khác nhau (dữ liệu vào
store vs vòng lặp sống sót trước dữ liệu xấu in-memory). Cả hai
đều có test/harness riêng (§3.1 unit, §3.4 headed).

### 3.4 Chứng minh headed (harness mới)

Harness: `apps/web/scripts/pause49E4-tickguard.mjs` (mới, mẫu
D3 malspec: CDP pipe + Xvfb + Chromium-1248, seed qua IDB +
localStorage autosave, scrub qua `.tl-ruler`, poll
`__vcutPreviewIdle`). Dist: `/tmp/e4-app-dist` (build mới từ
source hiện tại; lưu ý /tmp bị dọn giữa chừng — dist build lần
đầu biến mất trước khi harness chạy, đã build lại). Media:
`/tmp/e4-media/tone3s.mp3` (ffmpeg sine 440 Hz, 3 s, tự tạo).

Kết quả (1 lần chạy, exit 0, 5/5 PASS — log `/tmp/e4-tickguard.log`):

| Kiểm tra | Kết quả | Số thật |
|---|---|---|
| E4-M1-loaded | PASS | Project M1 load **seeded** (1 clip, tên `e4-m1-volkf-null`) — D3: load seeded nhưng tick chết |
| E4-M1-loop-alive | PASS | Sau settle: `sleeping: true`, `ticks: 6`, `errors: []` — D3: ticks đóng băng ở 4 |
| E4-GUARD-arm | PASS | Fault `getContext` ném trên `.preview-canvas` đã arm |
| E4-GUARD-ticks-grow-during-fault | PASS | Trong 3 s lỗi: ticks 27→168, tickErrors 21→162, `sleeping: false` — vòng lặp KHÔNG chết, bắt ~141 lỗi liên tiếp |
| E4-GUARD-recovery | PASS | Gỡ lỗi + scrub 2.5: `sleeping: true`, `lastDrawn: 2.5`, tickErrors đóng băng ở 162, `errors: []` (lỗi tick bị bắt, không thoát ra window error) |

Lưu ý nhỏ: tickErrors đã 21 trước khi đo cửa sổ lỗi (fault arm
TRƯỚC khi scrub 1.0 đánh thức vòng lặp) — delta 21→162 mới là
bằng chứng trong cửa sổ 3 s. Tốc độ tick trong lúc lỗi ~43
tick/s (thấp hơn 60 fps vì mỗi tick kèm console.error) — không
dùng làm bằng chứng gì thêm.

## 4. Quirk đáp sai frame khác 0 — hướng mới

Harness: `apps/web/scripts/pause49E4-quirk.mjs` (mới, mẫu D3
chromevar: Xvfb + chromium-1248 + cờ C3 qua
`--remote-debugging-port`, tab mới mỗi probe, trang raw +
seekElement). Chrome: `156.0.8078.4` (DevTools 1.3). Fixture:
`valid-gop.mp4` md5 Y2 `2c2e4771954fd26e1c377ce5900e377d`
(3 s, keyframe I ở 0.0/1.0/2.0).

| Probe | Fixture / seek | Kết quả ở mức raw |
|---|---|---|
| R1 (control) | valid-gop, 1.5 | `seeked@1.500` — PASS |
| R2 | **var-kf10** (keyframe 1.0 zero, 2 packet, 12.535 byte, pos 101.878–122.496), seek 1.5 | **error code 3** `PIPELINE_ERROR_DECODE ... timestamp=1133333 size=4779 is_key_frame=0`, seeking true, rs 1 — **cùng chữ ký C3/D3** (lỗi bung ở packet P-frame đầu sau keyframe hỏng, không phải ở chính keyframe) |
| R3 | var-kf10, seek 2.5 | **`seeked@2.500`** — hỏng keyframe giữa KHÔNG lan sang GOP sau (decoder seek thẳng tới keyframe 2.0 nguyên) — thông tin mới: hỏng GOP-local |
| R4 | **var-multi** (2 track video h264, 627.072 byte, duration 3.0), seek 2.5 | **`seeked@2.500`** — 2 track video không đổi landing |
| R5 (control) | seekElement valid-gop 1.5 | 1 landing @1.5, kind correct — PASS |
| R6 | seekElement trên biến thể đáp sai | **BỎ QUA — không biến thể nào đáp sai khác 0 ở mức raw** |

**Quirk đáp sai frame khác 0 headed VẪN NOT_MEASURED** (nối D3
§8 mục 2). Cộng dồn với C3/D3: Chrome 156 gặp packet keyframe
hỏng (zero hay 0xFF, GOP đầu/cuối/giữa) thì hoặc đáp đúng, hoặc
hỏng pipeline error 3 — chưa bao giờ đáp sai frame. Hướng chưa
thử (để đợt sau, không claim): cắt GOP nhưng giữ moov/stss hợp
lệ, keyframe lỗi ở vị trí khác trong GOP (vd. keyframe thứ 2 của
GOP dài), hoặc fixture đáp sai ổn định khác. Fail-fast
seek-landing-0: KHÔNG đụng trong luồng này (không lặp lại 3 cờ
đã loại trừ, không có biến cờ/binary mới) — vẫn NOT_MEASURED
(nối D3 §8 mục 1).

## 5. Kiểm chứng gộp của luồng

- Hồi quy pause tổng (chạy lại độc lập, strip-types, trừ pause45A2
  chạy esbuild như mẫu C3): seek **15/15**,
  seekZeroLanding44Z2 **5/5**, pauseLoopGuard44Z2 **11/11**,
  pauseSeekCap42X2 **22/22**, pauseSeekRecovery43Y2 **9/9**,
  pauseDraw40V3 **11/11**, pauseDraw41W2 **13/13**,
  pause46B2 **11/11**, pause45A2 **14/14** — cộng lại
  **111/111, fail 0**. Thêm audioEngine44Z2: **6/6**. Thêm test
  mới E4: **13/13**. Tổng cộng **130 test xanh**.
- Hồi quy cổng load (đụng projectRepo.ts): projectRepo **10 pass**,
  projectRepoNested22 **7 pass**, projectRepoRound26J5 **15 pass**,
  textStyle27K1 **6 pass**, loadReport **10 pass**,
  loadReportFix28 **8 pass**, loadReportPerLine29 **14 pass**,
  structuredNotes32 **12 pass** — cộng **82 pass, 0 fail**.
  Ngoại lệ: `archiveNested32P4.test.ts` chạy lỗi
  `ERR_MODULE_NOT_FOUND: Cannot find module '.../lib/projectRepo'`
  (archive.ts import extensionless, strip-types không resolve) —
  **lỗi tiền sẵn, không do luồng này** (luồng này không đụng
  archive.ts; lỗi xảy ra ở khâu resolve module trước khi code nào
  chạy). Ghi để đợt sau khỏi tưởng hồi quy vỡ.
- `tsc --noEmit` (apps/web): **0 lỗi** (sau khi thêm test mới vào
  exclude của tsconfig.json theo đúng quy ước các file test khác;
  lưu ý: `gopBlobUrl49E2.test.ts` (E2) và
  `loadSampleQueue49E6.test.ts` (E6) cũng từng báo TS5097 trong
  lúc các luồng song song đang sửa tsconfig — cuối lượt tsc sạch).
- `vite build --outDir /tmp/e4-app-dist`: **pass** (14,95 s lần
  đầu; 5,67 s lần build lại; cảnh báo chunk > 500 kB cũ).
- Headed tickguard: 5/5 PASS (xem §3.4). Headed quirk: 4 kiểm tra,
  FAIL = 0 (2 control PASS, 1 OBSERVED, 1 NOT_MEASURED — xem §4).
- `node --check` cả 2 harness mới: OK.
- KHÔNG chạy lại: mọi phép đo browser headed/FPS của các luồng
  khác đợt 49, phiên solo thật, đo IDB thật, Safari / máy thật.

## 6. File đổi/thêm

SỬA (3 file):

- `apps/web/src/lib/projectRepo.ts` — `sanitizeKeyframeArrays` +
  `sanitizeOneKeyframedValue` mới; `LoadResult.keyframeFixes?`;
  nối sanitize vào `parseProjectText`; `fail()` đặt
  `keyframeFixes: []`. Hunk keyframes duy nhất trong file; KHÔNG
  đụng logic queue/retry/loadSample của E6 trong `store.ts`
  (không mở file đó).
- `apps/web/src/preview.tsx` — `loop` → `tickInner` + wrapper
  `loop` bọc try/catch + `idleDebug.tickErrors`. Hunk duy nhất
  của luồng này trong file.
- `apps/web/tsconfig.json` — thêm
  `"src/lib/projectRepoRound49E4.test.ts"` vào exclude (theo quy
  ước file test; tránh TS5097 do import `.ts` như các test cũ).

MỚI (3 file test/harness + LIMITS này):

- `apps/web/src/lib/projectRepoRound49E4.test.ts` — 13 test khóa
  sanitize (đỏ-trước / xanh-sau, §3.1).
- `apps/web/scripts/pause49E4-tickguard.mjs` — harness headed
  chứng minh M1 hết chết + tick-guard cứu vòng lặp (§3.4).
- `apps/web/scripts/pause49E4-quirk.mjs` — harness headed thử
  keyframe hỏng GOP giữa + file 2 track video (§4).
- `docs/PHASE9_ROUND49_E4_PAUSE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `store.ts` (E6), mọi file `.ts`/`.tsx` production khác,
paths-loop, build-loop-log (parent ghi log lượt). Scratch +
fixture + dist tạm ở `/tmp/e4-app-dist`, `/tmp/e4-media`,
`/tmp/e4-tickguard-*`, `/tmp/pause49e4-quirk-*`,
`/tmp/e4-red-baseline.mjs`, `/tmp/e4-tsc*.txt`,
`/tmp/e4-tickguard.log`, `/tmp/e4-quirk.log`,
`/tmp/pause45A2.test.mjs` (không vào repo, không vào batch).

## 7. Nợ mở (không mạo nhận đã xong)

1. **Fail-fast seek-landing-0 headed vẫn thiếu** (Z2 + mở rộng
   B2/C3/D3): không đụng trong luồng này (không có biến cờ/binary
   mới). Cần đúng binary/cờ của phiên Chrome Y2 gốc (không còn
   bản ghi), hoặc một fixture đáp sai ổn định khác.
2. **Quirk đáp sai frame khác 0 headed cũng thiếu**: hướng mới
   đợt này (keyframe 1.0 hỏng, file 2 track video) đều không đáp
   sai; cộng C3/D3 thì Chrome 156 luôn hoặc đáp đúng, hoặc hỏng
   pipeline error 3. Cần hướng tạo fixture khác (cắt GOP nhưng
   giữ moov/stss, keyframe lỗi ở vị trí khác trong GOP) — chưa thử.
3. **Kind `"error"` qua spec dị dạng đã đóng theo hướng D3 §3.3**
   (không tạo được qua đường app thật vì lý do cấu trúc). Nay
   đường duy nhất tới kind `"error"` qua spec càng hẹp hơn: entry
   null đã bị sanitize ở cổng load nên không vào được vòng lặp nữa.
4. **Render mirror vẫn hở với keyframe null nếu tự đọc file thô:**
   `server/render/src/audiomix.js` `buildVolumeInterpExpr` ném
   với `[null]` như preview cũ; sanitize lần này chỉ nằm ở cổng
   load web. Nếu render có đường đọc file project thô không qua
   web thì đường đó vẫn nổ — cần đợt sau kiểm tra + vá ở phía
   render (validate.js) hoặc đưa sanitize vào tầng chung.
5. **KeyframePanel/KeyframeGraph gọi `interpolateKeyframes`
   trực tiếp ở vài chỗ không guard độ dài** (§2): UI chỉ chạm
   clip đang mở trong phiên (dữ liệu đã qua load, nay đã sạch)
   nên không phải bug nóng; đường sửa tay in-memory (MCP) vẫn có
   thể đưa null vào panel — tick-guard đã cứu vòng lặp nhưng panel
   vẫn có thể ném khi render. Đợt sau có thể thêm guard
   `length > 0` ở 2 chỗ panel (~216, ~325).
6. **Early-return `if (!ctx) return;` trong tick** (preview.tsx
   ~2467) vẫn trả về mà không đặt lịch rAF — lỗ tiền sẵn, thực tế
   `getContext("2d")` không trả null nên chưa sửa; nếu muốn kín
   hẳn thì chuyển quyền đặt lịch về wrapper `loop` (xem phân tích
   rủi ro ở LIMITS bản nháp — đổi đường này chạm ngữ nghĩa ngủ
   khi chưa có canvas nên cần test riêng).
7. **Vòng lặp preview với footage hoàn toàn không decode được
   quay ~19 tick/s trong ~30–40 s trước khi ngủ** (nợ C3 §9 mục
   4) — chưa đụng tới trong luồng này.
8. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux
   headed 156.0.8078.4) — cùng giới hạn như các đợt trước.
