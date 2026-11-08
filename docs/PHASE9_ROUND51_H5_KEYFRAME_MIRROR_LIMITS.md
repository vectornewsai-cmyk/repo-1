# Phase 9 đợt 51, luồng H5 — Normalize speed keyframes null + chống lệch mirror video-spec — LIMITS

Ngày: 06/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng.
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **`normalizeSpeedKeyframes` đã lọc entry lỗi ở cả 3 mirror** (§3.1):
   `packages/video-spec/src/speedcurve.ts`, `speedcurve.js` viết tay,
   `server/render/src/speedramp.js`. Đỏ-trước: `[null]` giữ nguyên,
   `[null, hợp lệ]` ném `TypeError: Cannot read properties of null
   (reading 't')` ở sort, `speedAt`/`integrateSpeed` ném TypeError đọc
   `v` của null. Xanh-sau: `[null]` → `[]`; `[null, hợp lệ]` → chỉ entry
   hợp lệ, đã sort; hết entry hợp lệ thì `speedAt`/`integrateSpeed` ném
   lỗi rõ "mảng keyframes rỗng"; `trimSpeedKeyframes` (TS + `.js`) bỏ
   entry lỗi, đếm vào `dropped`, thay vì ném ở `k.t`.
2. **Có cơ chế tự động bắt lệch mirror** (§3.2):
   `packages/video-spec/scripts/check-video-spec-mirror.mjs` — tầng A
   export-set parity cho mọi cặp `.ts`/`.js` trong
   `packages/video-spec/src/`, tầng B differential probes chạy cùng input
   qua `.ts` ↔ `.js` ↔ render CJS. Chạy trên src thật: **64 pass,
   7 known, 0 fail**. Đỏ-trước bằng lệch giả: đổi `DEFAULT_SPEED_BEZIER`
   trong bản sao `.js` → checker exit != 0; xóa export `cubicBezierY`
   → checker exit != 0. Khóa bằng test render 17/17 (M1–M3).
3. **Zod `add_keyframe` đã chặn `Infinity`/`NaN`** (§3.3): `time` và
   `value` thêm `.finite()`; schema tách thành export
   `addKeyframeInputSchema` để test trực tiếp. Test MCP mới **8/8**.
4. **Lệch mirror TS/JS về easing lạ GIỮ NGUYÊN có chủ ý** (§4): TS
   (`applyEasing`, `applySpeedEasing`) trả `undefined` → NaN, bản JS
   ném "easing không hỗ trợ". Đổi TS sang ném sẽ biến NaN lặng thành
   throw giữa tick preview không guard (`audioEngine.computeClipGain`,
   `previewEngine.memoInterpolateKeyframes`/`speedAt`). Checker ghi
   nhận lệch này là KNOWN (in rõ mỗi lần chạy, fail nếu hình dạng lệch
   đổi khác); test F1 khóa hành vi TS (NaN) vẫn xanh 11/11.
5. **Kiểm chứng gộp** (§5): test mới H5 render **17/17**, web **13/13**,
   MCP **8/8**; hồi quy K1 **21/21**, P3 **73/73**, SR **31/31**, nested
   e2e **28/28**, F1 render **26/26**, F1 web **11/11**, E4 **13/13**,
   projectRepo **10/10**, nested22 **7/7**, audioEngine **6/6**,
   pauseLoopGuard **11/11**, curveFixRound27K2 **17/17**,
   twoLevelCurve 12 check, nestedRampPreview 34, speedcurveTrim 18/18,
   nestedSpeedcurve 22/22, speedcurveH3 11/11, splitPatch 14/14,
   keyframes self-test pass; `vite build` pass (53,19 s).
   **Ngoại lệ duy nhất: `tsc --noEmit` toàn apps/web exit 2 với 50 lỗi
   ở 2 file KHÔNG thuộc luồng này** — `previewEngine.ts` (30 lỗi
   TS18048, mtime 11:59 trong cửa sổ đợt 51) và `ttsEstimate51H2.test.ts`
   của luồng H2 song song (20 lỗi TS7006) — xem §5.4. File của luồng
   này sạch (standalone tsc `speedcurve.ts` 0 lỗi, tsc build
   mcp-server pass, grep log tsc không có lỗi nào ở file H5).

## 1. Phân tích trước khi sửa

### 1.1 Ba mirror của `normalizeSpeedKeyframes` (xác định từ F1 LIMITS §7.2)

| # | File | Dạng | Trước luồng này |
|---|---|---|---|
| 1 | `packages/video-spec/src/speedcurve.ts:58` | TS (Vite nạp) | sort trực tiếp `[...kfs].sort((a,b) => a.t - b.t)` |
| 2 | `packages/video-spec/src/speedcurve.js:13` | ESM viết tay (strip-types nạp) | y hệt bản TS |
| 3 | `server/render/src/speedramp.js:105` | CJS render | y hệt, không có `trim/slice/split` |

Cả 3 đều không lọc, không guard non-array (`[...null]` ném
`TypeError: kfs is not iterable`). Consumer đi qua normalize:
`speedAt`, `integrateSpeed` (cả 3 mirror), `planSpeedSegments`,
`trim/slice/split/visibleSpeedKeyframes` (TS + `.js`), render
`nested.js` (qua `speedramp.js`). Đường render thật đã kín nhờ
sanitize F1 ở cổng render + validate (spec thô mang null vẫn bị
validate chặn trước khi tới engine), đường preview có try/catch ramp
— chỉ còn lỗ gọi trực tiếp, cùng họ với builder trước F1.

### 1.2 `trimSpeedKeyframes` — lỗ kề bên cùng họ

`trimSpeedKeyframes` (TS + `.js`) lặp mảng thô `for (const k of kfs)`
và đọc `k.t` TRƯỚC khi gọi `normalizeSpeedKeyframes` ở cuối, nên
`[null]` ném TypeError dù normalize đã lọc. `sliceSpeedKeyframes` /
`splitSpeedKeyframes` / `visibleSpeedKeyframes` normalize trước rồi
mới dùng nên an toàn — kiểm chứng bằng test (slice/split với `[null]`
không ném). Vá trim cùng predicate với normalize.

### 1.3 Easing lạ — soi kỹ trước khi quyết giữ nguyên (§4)

| Hàm | TS | `.js` video-spec | Render JS |
|---|---|---|---|
| `applyEasing` | `undefined` → NaN | `undefined` → NaN (khớp TS) | ném "easing không hỗ trợ" |
| `applySpeedEasing` | `undefined` → NaN | ném (khớp render) | ném |

TS là phía lẻ ở cả hai hàm. Nhưng caller preview KHÔNG guard:
`audioEngine.computeClipGain` gọi `interpolateKeyframes` trực tiếp
(dòng ~73, không try/catch), `previewEngine.memoInterpolateKeyframes`
(dòng ~86, không try/catch), `previewEngine` gọi `speedAt` trực tiếp
(dòng ~1085, ~1139). Đổi TS sang ném = đổi NaN lặng (hiện bị
`clamp(..., 0, 2)` chặn ở gain, và cổng load đã sanitize easing lạ về
linear nên đường project đã load không tới được) thành throw giữa
tick preview khi dữ liệu bị sửa tay in-memory. F1 đã khóa hành vi TS
(NaN) bằng test và ghi rõ lý do không đổi — H5 giữ nguyên quyết định
đó, chỉ thêm cơ chế ghi nhận + bắt đổi hình dạng lệch (§3.2).

### 1.4 Lệch tiền sẵn khác phát hiện khi chạy checker

- `audio.ts` export `FADE_CURVES` nhưng `audio.js` viết tay KHÔNG có
  hằng này (kiểm chứng 06/11/2026). Ngoài phạm vi keyframe/speed nên
  KHÔNG sửa ở H5; ghi vào `KNOWN_EXPORT_GAPS` của checker để mỗi lần
  chạy đều in rõ, và checker FAIL nếu một ngày `.js` đã có nó mà
  allowlist chưa xóa (chống allowlist lỗi thời).

## 2. Đỏ-trước (ghi trước khi sửa)

Script tạm `/tmp/h5-red.cjs` + `/tmp/h5-red-ts.mjs` (đã xóa sau khi đo),
chạy trên code chưa sửa:

| Lời gọi | Kết quả trước sửa |
|---|---|
| `normalizeSpeedKeyframes([null])` (cả 3 mirror) | KHÔNG ném, trả `[null]` (giữ null) |
| `normalizeSpeedKeyframes([null, hợp lệ])` (render) | `TypeError: Cannot read properties of null (reading 't')` |
| `speedAt({keyframes:[null]}, 1)` (cả 3) | `TypeError: Cannot read properties of null (reading 'v')` |
| `integrateSpeed({keyframes:[null]}, 0, 1)` (render) | `TypeError: Cannot read properties of null (reading 'v')` |
| `normalizeSpeedKeyframes(null)` (render) | `TypeError: kfs is not iterable` |
| `trimSpeedKeyframes([null], 0, 2)` (TS) | `TypeError: Cannot read properties of null (reading 't')` |
| `applySpeedEasing('bounce', 0.5)` (TS) | `undefined` (bản JS ném — lệch tiền sẵn, §4) |

Zod đỏ-trước (đo bằng `zod` thật trong `mcp-server/node_modules`):
`z.number().nonnegative().safeParse(Infinity)` = pass (cho qua),
`z.number().safeParse(NaN)` = pass (cho qua) — đúng mô tả F1 §7.5.

## 3. Sửa (đỏ-trước / xanh-sau)

### 3.1 Lọc entry lỗi trong `normalizeSpeedKeyframes` — cả 3 mirror

Cùng predicate với `normalizeKeyframes` của F1: entry phải là object
và `t`, `v` là số hữu hạn; thêm guard `Array.isArray(kfs) ? kfs : []`
(non-array → `[]` thay vì ném "not iterable"). Trùng t vẫn sau thắng,
không mutate mảng gốc, entry hợp lệ giữ nguyên thứ tự/ngữ nghĩa.
`speedAt`/`integrateSpeed` giữ contract ném "mảng keyframes rỗng"
khi hết entry hợp lệ (nay là lỗi rõ thay vì TypeError).
`trimSpeedKeyframes` (TS + `.js`): bỏ entry lỗi ngay đầu vòng lặp,
đếm vào `dropped`, `changed = true`.

- `packages/video-spec/src/speedcurve.ts` — thêm `isFiniteNumber`
  local + lọc trong `normalizeSpeedKeyframes` + guard trong
  `trimSpeedKeyframes` (đánh dấu ROUND51-H5).
- `packages/video-spec/src/speedcurve.js` — mirror y hệt.
- `server/render/src/speedramp.js` — thêm `isFiniteNumber` local +
  lọc trong `normalizeSpeedKeyframes` (file này không có
  trim/slice/split nên chỉ một hunk).

### 3.2 Cơ chế bắt lệch mirror — `packages/video-spec/scripts/check-video-spec-mirror.mjs` (mới)

Chạy từ repo root: `node packages/video-spec/scripts/check-video-spec-mirror.mjs`
(tùy chọn `--src-dir`, `--render-dir`). Thoát 0 khi không có FAIL,
thoát 1 khi có FAIL — dùng được trong CI/test. Không ghi file nào.

- **Tầng A — export-set parity:** quét mọi `.ts` (trừ `*.test.ts`) có
  `.js` kề bên trong `packages/video-spec/src/`, so tập tên runtime
  export (`function/const/let/class/enum`; type/interface không tồn tại
  ở runtime nên bỏ qua). Trên cây hiện tại: 21/22 cặp khớp, chỉ
  `audio` thiếu `FADE_CURVES` trong `.js` (KNOWN, §1.4).
- **Tầng B — differential probes:** chạy cùng input cố định qua các
  cặp module và so kết quả (kể cả ném lỗi — so cả message — và NaN):
  `speedcurve.ts` ↔ `speedcurve.js` (14 probe), `speedcurve.ts` ↔
  render `speedramp.js` (11 probe), `keyframes.ts` ↔ `keyframes.js`
  (7 probe), `keyframes.ts` ↔ render `keyframes.js` (7 probe),
  `speed.ts` ↔ `speed.js` (7 probe). Probe bao phủ cả entry null,
  non-array, trùng t, bezier tường minh + bezier mặc định
  (`DEFAULT_SPEED_BEZIER` — probe này là thứ bắt được lệch giả M2),
  trim/slice, và easing lạ.
- **KNOWN gaps (in rõ, không fail):** `KNOWN_EXPORT_GAPS`
  (`audio`/`FADE_CURVES`) và `KNOWN_BEHAVIOR_GAPS`
  (`easing-unknown`, §4). Nếu hình dạng lệch đổi khác (vd TS bắt đầu
  ném, hoặc hai bên bằng nhau mà probe vẫn gắn knownGap thì không —
  bằng nhau thì pass bình thường; lệch kiểu khác thì FAIL) script báo
  FAIL để có người xem lại. Allowlist export lỗi thời cũng FAIL.
- Giới hạn có chủ ý: chỉ so hành vi các hàm thuần đã liệt kê; các
  mirror cố tình là tập con (vd `lut.js` ngắn hơn `lut.ts`) không nằm
  trong diện bắt hành vi — export-set vẫn quét nhưng chỉ fail khi tên
  lệch ngoài allowlist.

### 3.3 Zod `add_keyframe` — `mcp-server/src/tools/modify.ts`

- `time`: `z.number().nonnegative()` → `z.number().finite().nonnegative()`.
- `value`: `z.number()` → `z.number().finite()`.
- Schema tách thành export `addKeyframeInputSchema` (nội dung y hệt
  shape inline cũ + `.finite()`), tool `add_keyframe` dùng lại const
  đó — không đổi handler hay hành vi nào khác. Khóa bằng test mới
  `mcp-server/src/tools/modifyRound51H5.test.ts` (8 test, §5.1).
  Lưu ý: strip-types trực tiếp KHÔNG resolve được import
  `"./modify.js"` → `"./modify.ts"` trên Node của VM này (cả test
  `roundtrip.test.ts` có sẵn cũng lỗi `ERR_MODULE_NOT_FOUND` y hệt)
  nên test MCP chạy qua tsc build:
  `npm run build && node dist/mcp-server/src/tools/modifyRound51H5.test.js`
  (`dist/` đã gitignore, không vào batch).

### 3.4 Easing lạ — KHÔNG đổi ngữ nghĩa, chỉ ghi nhận

Giữ nguyên hành vi TS (trả `undefined` → NaN) theo quyết định F1 và
phân tích §1.3. Phần làm được ở H5: (a) checker probe cả hai hình
dạng lệch (gọi trực tiếp trả `undefined` vs ném; qua nội suy NaN vs
ném) và ghi vào `KNOWN_BEHAVIOR_GAPS` kèm lý do + trỏ test F1 khóa
hành vi TS; (b) test web mới khóa lại hành vi TS (NaN) để lần sau ai
đổi `applySpeedEasing` TS cũng thấy ngay.

## 4. Kiểm chứng gộp của luồng

### 4.1 Test mới H5

- Render `server/render/test_round51_h5_speed_keyframe_null.js` (chạy
  từ gốc repo: `node server/render/test_round51_h5_speed_keyframe_null.js`):
  **17/17, 0 fail**. U1–U14 unit `speedramp.js` qua code render thật
  (lọc null, non-array, trùng t, không mutate, speedAt/integrate/
  planSpeedSegments trên entry hợp lệ, easing lạ vẫn ném); M1 checker
  trên src thật exit 0; M2/M3 đỏ-trước bằng lệch giả trên bản sao src
  tạm (đổi `DEFAULT_SPEED_BEZIER` / xóa export `cubicBezierY` trong
  `.js` → checker exit != 0 + in FAIL; thư mục tạm dọn sau khi chạy).
- Web `apps/web/src/lib/speedKeyframesRound51H5.test.ts`:
  **13/13, 0 fail**. Chạy:
  `node --experimental-strip-types apps/web/src/lib/speedKeyframesRound51H5.test.ts`.
  Import `@repo-1/video-spec/speedcurve` → nạp đúng `.ts` (bằng chứng:
  test easing-NaN pass — bản `.js` sẽ ném).
- MCP `mcp-server/src/tools/modifyRound51H5.test.ts`: **8/8, 0 fail**.
  Chạy: `npm run build && node dist/mcp-server/src/tools/modifyRound51H5.test.js`
  (từ `mcp-server/`; `tsc` build pass).
- Checker `packages/video-spec/scripts/check-video-spec-mirror.mjs`:
  **64 pass, 7 known, 0 fail** (chạy lại cho cùng kết quả).

### 4.2 Hồi quy

- Render: `keyframes.js --self-test` pass; `test_k1.js` **21/21**;
  `test_p3.js` (strip-types) **73/73, 0 skip** (gồm parity mirror
  TS↔JS↔render của P3 — vẫn khớp sau khi sửa cả 3 mirror);
  `test_keyframes_sr.js` **31/31**; `test_nested_e2e.js` **28/28**;
  F1 render `test_round50_f1_keyframe_null.js` **26/26**.
- Web (strip-types): F1 `keyframeNormalizeRound50F1` **11/11**,
  E4 `projectRepoRound49E4` **13/13**, `projectRepo` **10/10**,
  `projectRepoNested22` **7/7**, `audioEngine44Z2` **6/6**,
  `pauseLoopGuard44Z2` **11/11**, `curveFixRound27K2` **17/17**,
  `twoLevelCurve` 12 check pass, `nestedRampPreview` 34 pass,
  `speedcurveTrim` **18/18**, `nestedSpeedcurve` **22/22**,
  `speedcurveH3` **11/11**, `splitPatch` **14/14** — fail 0.
- `vite build --outDir /tmp/h5-app-dist`: **pass** (53,19 s; cảnh báo
  chunk > 500 kB cũ).

### 4.3 Không chạy lại / không chạy được

- `splitPatch.store.test.ts`: KHÔNG chạy được bằng `node` trực tiếp
  (lỗi `ERR_MODULE_NOT_FOUND` ở import extensionless `"../../store"`);
  chính header file đã ghi "KHÔNG CHẠY BẰNG `node` TRỰC TIẾP" — tiền
  sẵn, không liên quan sửa H5 (file này import store, không đụng
  speedcurve). Cần vitest/harness riêng nếu muốn chạy.
- `tsc --noEmit` toàn apps/web: **exit 2, 50 lỗi, KHÔNG thuộc luồng
  này** — `src/lib/previewEngine.ts` 30 lỗi TS18048 (`'a' is possibly
  'undefined'`, dòng 833–914) và `src/lib/ttsEstimate51H2.test.ts`
  của luồng H2 song song 20 lỗi TS7006. Cả hai file đều có mtime
  trong cửa sổ đợt 51 (11:51/11:59 UTC, sau khi H5 sửa xong
  speedcurve.ts lúc 11:40) — luồng song song đang sửa dở. H5 KHÔNG
  sửa file của luồng khác. Bằng chứng file H5 sạch: log tsc không có
  lỗi nào ở `speedcurve.ts` / `speedKeyframesRound51H5.test.ts`;
  standalone `tsc --strict` trên `speedcurve.ts` 0 lỗi; `tsc` build
  mcp-server pass (bao gồm `modify.ts`); `vite build` pass.
  Parent nên chạy lại `tsc` sau khi các luồng song song xong để có
  verdict toàn dự án.
- Mọi phép đo browser headed / FPS / TTS của các luồng khác; click-test
  headed thật (không đụng UI ở luồng này).

## 5. File đổi/thêm

SỬA (5 file):

- `packages/video-spec/src/speedcurve.ts` — `normalizeSpeedKeyframes`
  lọc entry lỗi + `trimSpeedKeyframes` bỏ entry lỗi (2 hunk + helper
  `isFiniteNumber`).
- `packages/video-spec/src/speedcurve.js` — mirror y hệt (2 hunk +
  helper).
- `server/render/src/speedramp.js` — `normalizeSpeedKeyframes` lọc
  entry lỗi (1 hunk + helper `isFiniteNumber`).
- `mcp-server/src/tools/modify.ts` — export `addKeyframeInputSchema`
  (+ `.finite()` cho `time`/`value`), tool `add_keyframe` dùng lại
  const đó (2 hunk: thêm const + thay shape inline).
- `apps/web/tsconfig.json` — thêm
  `"src/lib/speedKeyframesRound51H5.test.ts"` vào exclude (theo quy
  ước file test; 1 dòng, kề dòng exclude F1).

MỚI (5 file: script + 3 test + LIMITS này):

- `packages/video-spec/scripts/check-video-spec-mirror.mjs` — cơ chế
  bắt lệch mirror (§3.2; 64 pass / 7 known / 0 fail trên cây hiện tại).
- `server/render/test_round51_h5_speed_keyframe_null.js` — 17 test khóa
  (§4.1).
- `apps/web/src/lib/speedKeyframesRound51H5.test.ts` — 13 test khóa
  tầng TS (§4.1).
- `mcp-server/src/tools/modifyRound51H5.test.ts` — 8 test khóa zod
  (§3.3, §4.1).
- `docs/PHASE9_ROUND51_H5_KEYFRAME_MIRROR_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `packages/video-spec/src/keyframes.ts` / `.js`,
`server/render/src/keyframes.js` (đã lọc ở F1, chỉ dùng làm đối chiếu
trong checker); `packages/video-spec/src/audio.ts` / `.js` (lệch
`FADE_CURVES` tiền sẵn, §1.4); `apps/web/src/lib/previewEngine.ts`,
`src/lib/ttsEstimate51H2.test.ts` (file luồng khác, đang sửa dở —
xem §4.3); `server/render/src/render.js`, `validate.js`
(không đụng); paths-loop, build-loop-log (parent ghi log lượt).
Scratch ở `/tmp/h5-red*`, `/tmp/h5-tsc.log`, `/tmp/h5-app-dist`,
`/tmp/vcut-p3-*`, `/tmp/vcut-kfsr-*`, `/tmp/nested-e2e-*`,
`/tmp/h5-mirror-*` (không vào repo, không vào batch).
`mcp-server/dist/` là build output của `npm run build` (đã gitignore,
không vào batch).

## 6. Lưu ý cho parent gộp (tránh đụng luồng song song)

- `apps/web/tsconfig.json` là file chung: luồng này chỉ thêm 1 dòng
  exclude (`speedKeyframesRound51H5.test.ts`) kề dòng exclude F1. Các
  luồng H khác cũng thêm exclude của họ — gộp bằng cách giữ đủ các dòng.
- `packages/video-spec/src/speedcurve.ts` + `.js` là cặp mirror, cộng
  `server/render/src/speedramp.js` là mirror thứ ba: nếu luồng khác
  cũng đụng `normalizeSpeedKeyframes`/`speedAt`/`trimSpeedKeyframes`
  thì đối chiếu cả 3 file, hoặc chạy checker (§3.2) để bắt lệch.
- `mcp-server/src/tools/modify.ts`: chỉ thêm export const + thay shape
  inline của `add_keyframe` bằng const đó; không đụng handler hay tool
  khác trong file.
- Checker chạy được trong CI (`exit 1` khi FAIL); nên nối vào
  `ci-security.yml` hoặc job test khi repo có CI chạy thật (hiện repo
  chưa có CI — nợ cũ từ Batch J, file workflow vẫn 403 chưa lên GitHub).

## 7. Nợ mở (không mạo nhận đã xong)

1. **`tsc --noEmit` toàn apps/web đang đỏ vì 2 file luồng khác**
   (§4.3): `previewEngine.ts` 30 lỗi TS18048 + `ttsEstimate51H2.test.ts`
   20 lỗi TS7006. Không phải do H5 (file H5 sạch, có bằng chứng), nhưng
   verdict toàn dự án cần chạy lại sau khi các luồng song song xong.
2. **Lệch mirror TS/JS về easing lạ — tiền sẵn, giữ nguyên có chủ ý**
   (§4 / F1 §7.6): TS trả `undefined` → NaN, JS ném. Checker ghi nhận
   là KNOWN + fail nếu hình dạng đổi; test F1 khóa hành vi TS. Muốn
   thống nhất thật thì phải đổi TS sang ném KÈM guard try/catch ở mọi
   caller preview không guard (`computeClipGain`,
   `memoInterpolateKeyframes`, `speedAt` trong previewEngine) — việc
   riêng, cần test preview riêng.
3. **`audio.js` thiếu `FADE_CURVES`** (tiền sẵn, §1.4): export-set
   checker đã ghi vào allowlist; sửa thì thêm hằng vào `.js` rồi xóa
   mục allowlist (checker sẽ FAIL nếu allowlist lỗi thời).
4. **Checker chưa bao phủ hành vi toàn bộ cặp mirror:** tầng B chỉ
   probe 5 cặp hàm thuần keyframe/speed; các module khác (lut, color,
   transitions...) chỉ được quét export-set. Mở rộng probe khi có
   mirror khác lệch.
5. **Test MCP chạy qua tsc build, không chạy strip-types trực tiếp**
   (§3.3): import `"./x.js"` → `"./x.ts"` không resolve trên Node của
   VM này (cả test roundtrip có sẵn cũng lỗi y hệt) — tiền sẵn của
   môi trường, không phải do H5.
6. **Click-test headed thật / Safari / máy thật chưa đo** (toàn bộ trên
   Node 24 + ffmpeg CLI, Chromium Linux) — cùng giới hạn như các đợt
   trước.
