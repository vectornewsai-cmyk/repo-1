# Phase 9 đợt 52, luồng I7 — Thống nhất mirror keyframe/speed + FADE_CURVES — LIMITS

Ngày: 07/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file text trong phạm vi luồng.
Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ,
không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Lệch mirror TS/JS về easing lạ đã THỐNG NHẤT THẬT** (§3.1): cả 4 bản
   `applyEasing` / `applySpeedEasing` (TS, JS viết tay, render CJS) nay
   đều ném `easing không hỗ trợ: <easing>` với easing lạ — trước đây TS
   trả `undefined` → NaN, JS ném. Đổi ở 3 chỗ (keyframes.ts,
   speedcurve.ts, keyframes.js — speedcurve.js và 2 bản render vốn đã ném).
2. **Guard ở mọi caller preview chưa guard** (§2, §3.3): `memoInterpolateKeyframes`
   (choke point của mọi nội suy animation trong tick preview),
   `computeClipGain` (gọi mỗi frame từ preview.tsx), `addKeyframeAt`
   (click handler của KeyframePanel). Guard nội suy lại với easing lạ coi
   như `"linear"` (đúng ngữ nghĩa sanitize ở cổng load) nên frame vẫn vẽ
   được thay vì rớt frame; hết đường thì fallback giá trị đầu/volume tĩnh.
3. **`FADE_CURVES` đã có trong audio.js** (§3.2): khớp audio.ts
   `["linear","ease-in","ease-out","sine"]` — xóa mục KNOWN duy nhất của
   tầng A.
4. **Checker mirror mở rộng 64 → 243 probe, 7 known → 0 known, 0 fail**
   (§3.4): thêm probe hàm thuần (speed/audio/timebase/keyframes/
   speedcurve/validators) + probe hằng (`value:`) cho mọi module. Kiểm
   chứng âm: lệch giả `DEFAULT_SPEED_BEZIER` trong bản sao `.js` → checker
   exit 1, 2 FAIL.
5. **Checker bắt được 3 lệch catalog thật trong lúc mở rộng** (§3.5):
   `lut.js` kẹt 20/174 LUT, `sticker.js` kẹt 30/244 sticker,
   `textfx.js` giữ 2 mô tả cũ (slideReveal/curtainIn) — đã đồng bộ cả 3
   từ bản `.ts` (nguồn chính, khớp cả render mirror). Kiểm chứng âm cho
   thấy cơ chế bắt lệch hoạt động đúng mục đích H5 đặt ra.
6. **Kiểm chứng gộp** (§4): checker **243 pass, 0 known, 0 fail**; test
   mới I7 **12/12**; H5 render **17/17**, H5 web **13/13**, F1 web
   **11/11** (2 test NaN cũ đã cập nhật sang assert ném), MCP **8/8**;
   hồi quy K1 **21/21**, P3 **73/73**, SR **31/31**, F1 render **26/26**,
   nested e2e **28/28**, E4 **13/13**, projectRepo **10/10**, nested22
   **7/7**, audioEngine **6/6**, I2 **15/15**, pauseLoopGuard **11/11**,
   curveFixRound27K2 **17/17**, speedcurveTrim **18/18**,
   nestedSpeedcurve **22/22**, speedcurveH3 **11/11**, splitPatch
   **14/14**, nestedRampPreview **34**, twoLevelCurve **12**, keyframes.js
   self-test pass, test_color **40/40**, V11 **29 case 0 lệch**, V12
   **37 case 0 lệch**; `tsc --noEmit` toàn apps/web **exit 0, 0 lỗi**;
   standalone tsc strict video-spec **exit 0**; `vite build` **pass**
   (37,92 s; cảnh báo chunk > 500 kB cũ).

## 1. Phân tích trước khi sửa

### 1.1 Bốn bản applyEasing/applySpeedEasing (xác định từ code + đo thật)

| # | File | Trước luồng này |
|---|---|---|
| 1 | `packages/video-spec/src/keyframes.ts:80` (`applyEasing`) | không default → `undefined` → NaN |
| 2 | `packages/video-spec/src/keyframes.js:46` (`applyEasing`) | không default → `undefined` → NaN (khớp TS) |
| 3 | `packages/video-spec/src/speedcurve.ts:128` (`applySpeedEasing`) | không default → `undefined` → NaN |
| 4 | `packages/video-spec/src/speedcurve.js:71` (`applySpeedEasing`) | ném `easing không hỗ trợ: …` |
| 5 | `server/render/src/keyframes.js:36` (`applyEasing`) | ném (cùng message) |
| 6 | `server/render/src/speedramp.js:168` (`applySpeedEasing`) | ném (cùng message) |

Đo thật trước sửa (script tạm `/tmp` — đã xóa; kết quả ở §2):
`@repo-1/video-spec` → TS (strip-types resolve `./x.js` → `./x.ts`):
`applyEasing("bounce")` → `undefined`, `interpolateKeyframes` → NaN;
`@repo-1/video-spec/speedcurve` → TS: `applySpeedEasing` → `undefined`,
`speedAt` → NaN; `keyframes.js` trực tiếp → `undefined`;
`speedcurve.js` trực tiếp → ném. Render đã ném từ trước nên không đổi.

### 1.2 Easing lạ chỉ vào được bằng đường nào (quyết định phạm vi guard)

- **Cổng load sanitize** (E4): `projectRepo.sanitizeKeyframeArrays` chuẩn
  hóa easing không hợp lệ về `"linear"` cho `volumeKeyframes`,
  `speedKeyframes`, `animations.*`.
- **MCP chặn**: `mcp-server/src/tools/modify.ts:32` — `add_keyframe` dùng
  `z.enum(["linear", "ease-in", "ease-out"])` cho easing.
- **Chỉ còn đường sửa tay in-memory** (devtools/store trực tiếp, hoặc bug
  tương lai) mới đưa easing lạ vào dữ liệu đang chạy. Guard vì vậy là
  phòng thủ chiều sâu, không phải tuyến phòng thủ chính — nhưng bắt buộc
  phải có trước khi đổi TS sang ném (nếu không throw sẽ lọt ra tick).

### 1.3 Kiểm kê caller — mọi nơi `interpolateKeyframes` / `speedAt` /
`integrateSpeed` / `sourcePosAt` / `applySpeedEasing` có thể ném easing lạ

Quét toàn `apps/web/src` (không tính test) rồi soi từng chỗ xem đã guard
chưa. Bảng dưới là TOÀN BỘ caller — không sót chỗ nào trong phạm vi quét.

**A. Guard MỚI ở luồng này (3 chỗ):**

| # | Caller | Đường chạy | Guard mới |
|---|---|---|---|
| A1 | `previewEngine.memoInterpolateKeyframes` (dòng ~87) | tick preview (rAF) — choke point: mọi nội suy animation trong previewEngine (~15 chỗ: videoClipVisual, videoElementPlacement, textClipVisual, SR…) đều qua đây | `interpolateKeyframesSafe`: thử lại với easing lạ → `"linear"`, hết đường → giá trị keyframe đầu tiên, còn không thì 0 |
| A2 | `audioEngine.computeClipGain` (dòng ~92) | tick preview — `preview.tsx:1798` tính gain mỗi frame cho audio source đang active | `interpolateVolumeKeyframes`: thử lại với easing lạ → `"linear"`, hết đường → volume tĩnh |
| A3 | `KeyframePanel.addKeyframeAt` (dòng ~147) | click handler (không phải tick) — tính giá trị khởi tạo cho keyframe mới | try/catch → `meta.def` (cùng fallback với trường hợp mảng rỗng) |

**B. Đã guard sẵn, kiểm chứng lại, KHÔNG đổi:**

| # | Caller | Guard sẵn có |
|---|---|---|
| B1 | `previewEngine.rampSpeedAt` (~1094) | try/catch quanh `speedAt` → fallback speed hằng (`clip.speed ?? 1`) |
| B2 | `previewEngine.rampSourceTimeAt` (~1196) | try/catch quanh `integrateRampSpeed` → fallback `sourceTimeAt` (mapping hằng). `integrateRampSpeed` chỉ được gọi từ trong try này nên các `speedAt` nội bộ của nó cũng được che |
| B3 | `previewEngine` rAF loop (`preview.tsx` ~3140) | try/catch quanh `tickInner` — vòng lặp sống, frame lỗi bị bỏ + log console (phòng tuyến cuối; guard A1/A2 làm cho nhánh này không còn bị chạm vì easing lạ) |
| B4 | `nestedPreview.buildPreviewSpecFailsoft` (gọi ở `preview.tsx:2530`) | try/catch toàn bộ flatten nested → warning + spec fallback; mọi `integrateSpeed`/`speedAt`/`sourcePosAt` trong `nestedPreview.ts` đều chạy trong này (preview path) |
| B5 | `nestUtils` fast path (`fastSegmentIntegral`/`fastSpeedAt`, dòng ~2173/~2232) | chỉ chạy trên curve đã qua `fastCurveOf` validate easing ∈ 4 loại; easing lạ → `fastCurveOf` trả null → caller rơi về engine (rồi về B4/B1/B2 tùy đường) |
| B6 | `KeyframePanel` liveValue (~216) + kf-live rows (~325), `KeyframeGraph` sampling (~85) | try/catch sẵn từ F1/E4 (live → null, điểm mẫu → `meta.def`) |

**C. Đã soi, KHÔNG guard — cố tình, không phải sót (lý do ở §6.2):**

| # | Caller | Vì sao không guard |
|---|---|---|
| C1 | `nestUtils` trim/split (~30 chỗ `sourcePosAt`/`speedAt`) | chạy trên user edit action (trim/split/nested), KHÔNG phải tick preview; throw ở đây làm action đó fail rõ ràng thay vì tính sai in/out lặng lẽ; không tới được qua đường hỗ trợ (load sanitize + MCP validate) |
| C2 | `captionFollow.refollowCaptionsInSpec` (`sourcePosAt`, gọi từ `store.ts` move/trim) | như C1 — edit action, fail-fast là hành vi đúng |
| C3 | Render worker (`server/render/src/*`) | vốn đã ném từ trước; `validate.js` chặn easing lạ trước khi tới engine; không đổi |

### 1.4 `FADE_CURVES` — tiền sẵn đợt 51 §4.5

`audio.ts:19` export `FADE_CURVES = ["linear","ease-in","ease-out","sine"]`
(`as const`); `audio.js` viết tay KHÔNG có hằng này (kiểm chứng lại ở
đầu luồng). Không có hàm nào trong audio.ts dùng nó trực tiếp (fade dùng
`fadeCurveFactor` ở audioEngine/audiomix.js — hai bên đó đã khớp nhau);
đây là lệch export-set thuần, checker tầng A từng ghi KNOWN.

## 2. Đỏ-trước (ghi trước khi sửa)

Checker trước sửa (chạy lại 2 lần, cùng kết quả):
**64 pass, 7 known, 0 fail** (7 known = 6 probe easing-lạ + 1 export gap
audio/FADE_CURVES).

Precheck hành vi trước sửa (`node --experimental-strip-types`, script tạm
trong repo rồi xóa):
`applyEasing("bounce")` qua package → `undefined`;
`interpolateKeyframes` bounce → NaN; `applySpeedEasing("bounce")` qua
subpath → `undefined`; `speedAt` bounce → NaN; `keyframes.js` trực tiếp
→ `undefined`; `speedcurve.js` trực tiếp → ném
`easing không hỗ trợ: bounce`.

## 3. Sửa (đỏ-trước / xanh-sau)

### 3.1 Thống nhất throw — 3 file (bản thứ 4 và 2 bản render vốn đã ném)

Cùng message với bản JS/render: `` `easing không hỗ trợ: ${easing}` ``
(so khớp cả message trong checker — sai 1 ký tự cũng FAIL).

- `packages/video-spec/src/keyframes.ts` — `applyEasing`: thêm
  `default: throw new Error(...)` + ghi `@throws` (đánh dấu ROUND52-I7).
- `packages/video-spec/src/speedcurve.ts` — `applySpeedEasing`: thêm
  `default: throw` + ghi `@throws` (đánh dấu ROUND52-I7).
- `packages/video-spec/src/keyframes.js` — `applyEasing`: thêm `default:
  throw` (bản này trước đây cũng trả `undefined` như TS — không sửa thì
  checker TS↔JS sẽ FAIL sau khi TS đổi).
- KHÔNG ĐỔI: `speedcurve.js`, `server/render/src/keyframes.js`,
  `server/render/src/speedramp.js` (đã ném đúng message).

### 3.2 `FADE_CURVES` vào audio.js

`packages/video-spec/src/audio.js` — thêm
`export const FADE_CURVES = ["linear", "ease-in", "ease-out", "sine"];`
kề `SOURCE_AUDIO_MODES` (đúng thứ tự như audio.ts) + comment nguồn
(Phase 7 P3) và ghi chú đợt 52 I7.

### 3.3 Guard ở 3 caller (bảng A §1.3)

Ngữ nghĩa guard thống nhất: **thử lại với easing lạ coi như `"linear"`**
— đúng ngữ nghĩa sanitize ở cổng load (E4) — để preview tiếp tục hiển
thị animation thay vì đóng băng/rớt frame. Chỉ khi thử lại vẫn ném (mảng
rỗng sau normalize — caller đã lọc bằng `hasUsableKeyframes` nên không
tới được) mới fallback tĩnh.

- `apps/web/src/lib/previewEngine.ts` — import thêm `EASINGS`; helper
  mới `interpolateKeyframesSafe` (ghi chú ROUND52-I7); `memoInterpolateKeyframes`
  gọi helper thay vì `interpolateKeyframes` trực tiếp. Cache memo không
  đổi (key theo identity mảng + frame 120Hz); giá trị fallback cũng được
  cache như giá trị thường.
- `apps/web/src/lib/audioEngine.ts` — import thêm `EASINGS`; helper mới
  `interpolateVolumeKeyframes(kfs, t, fallback)`; `computeClipGain` gọi
  helper thay vì `interpolateKeyframes` trực tiếp. (Lưu ý: file này luồng
  I2 đợt 52 đã sửa trước trong cùng đợt — thêm `hasUsableVolumeKeyframes`;
  guard I7 xếp CHỒNG lên helper đó, không thay nó.)
- `apps/web/src/components/keyframes/KeyframePanel.tsx` — `addKeyframeAt`
  bọc try/catch → `meta.def` (`EASINGS` đã import sẵn trong file).

Kiểm chứng guard bằng dữ liệu xấu thật (test I7 §4.1 + script tạm):
`memoInterpolateKeyframes([{0,0,"bounce"},{2,10}], 1)` → `5` (= linear,
không ném); `computeClipGain` với volumeKeyframes bounce → gain `1`
(= linear, không ném); `rampSpeedAt` với curve bounce → `2` (speed hằng);
`rampSourceTimeAt` với curve bounce → `4` (mapping hằng).

### 3.4 Checker mirror mở rộng — `check-video-spec-mirror.mjs`

- **Xóa known đã xử lý xong:** `KNOWN_EXPORT_GAPS` và
  `KNOWN_BEHAVIOR_GAPS` nay là `{}` rỗng (giữ lại cơ chế + comment ghi rõ
  mục nào đã xóa, khi nào); bỏ `knownGap: "easing-unknown"` khỏi cả 6
  probe easing-lạ — nay so khớp strict (cả hai bên phải ném cùng message).
- **Probe hằng mới (`value:`):** so giá trị export trực tiếp (không gọi
  hàm) qua `valuesEqual` — dùng cho mọi hằng của video-spec.
- **Probe mới: 64 → 243 (+179 = 6 probe easing chuyển từ known sang
  pass + 173 probe mới).** Chi tiết theo nhóm:
  - speedcurve TS↔JS +11 (sourcePosAt, sourceConsumed, averageSpeed,
    planSpeedSegments, split/visible, rampTrimLeftIn/RightOut,
    outputDurationForSource, 2 hằng); TS↔render +3 (sourcePosAt,
    sourceConsumed, planSpeedSegments — render chỉ export 3 hàm này thêm).
  - keyframes TS↔JS +11 (validateAnimations ×3, formatPropValue ×3,
    5 hằng); TS↔render +3 (validateAnimations ×3).
  - speed +25 (sourceTimeAt xuôi/ngược, splitSourceAt, trimLeftTo/
    trimRightTo, inForTrimLeft/outForTrimRight, maxTrimLeft/
    maxTrimRightDuration, effectiveDuration, isDurationConsistent,
    durationForSpeed, outForDuration, sourceDurationOf,
    timelineDurationOf, validateSpeedFields ×2, isSpeedable ×2, 5 hằng).
  - audio (nhóm mới) +17 (4 hằng gồm FADE_CURVES + 13 probe hàm).
  - timebase (nhóm mới) +15 (2 hằng + 13 probe hàm).
  - lut (nhóm mới) +12 (2 hằng — so deep cả bảng 174 mục + 10 probe hàm).
  - validators (nhóm mới) +40: chroma 7, color 8, effects 6,
    transitions 3, textfx 6, markers 10.
  - consts các module còn lại +36 (enhance 3, image 1, sticker 3, mask 2,
    motion 9, tracking 2, migrations 2, nested 4, index 1, chroma 2,
    color 1, effects 3, transitions 1, textfx 1, speed 1).
  - Footer đổi thành "OK: mirror khớp hoàn toàn (0 lệch đã biết, 0 fail)."
    khi known = 0.
- **Cặp nào thêm được / cặp nào chưa probe (đủ cho §4 nhiệm vụ):**
  - Đã probe đủ 100% export: speedcurve 18/18, keyframes 10/10, audio
    10/10, timebase 11/11, markers 7/7, lut 7/7, speed 25/25 (gồm cả
    `SPEED_EPS`), chroma 6/6, color 4/4, effects 6/6, transitions 3/3,
    textfx 5/5.
  - Chỉ probe hằng (hàm cần fixture phức tạp, để đợt sau): adjustment
    (validate + convert cần AdjustmentLayer đầy đủ), image
    (isImageClip/normalize/validateImageClip cần ImageClip),
    sticker fns (cần StickerClip), mask fns (cần mask keyframes),
    motion fns (cần Motion object), nested fns (cần NestedClip/spec
    lồng nhau; `flattenNested` cần spec hoàn chỉnh), migrations fns
    (`migrate` cần spec theo version cũ), tracking fns (cần track
    points), index fns (`isVideoSpec`/`projectDuration` cần VideoSpec
    đầy đủ). Các hằng của những module này ĐÃ được probe (Tier B value)
    nên drift dữ liệu vẫn bị bắt; chỉ logic hàm là chưa có probe.

### 3.5 Ba lệch catalog thật do checker mở rộng bắt được — đã đồng bộ

Cùng một mẫu: `.js` viết tay kẹt ở snapshot gốc, `.ts` (và render mirror)
đã tăng qua nhiều đợt. Cả 3 đều là dữ liệu thuần — đồng bộ bằng script
tạm (đọc từ `.ts` nguồn chính, ghi lại `.js`, xóa script sau khi chạy),
không sửa tay từng mục:

- **`lut.js`: 20 → 174 LUT.** `LUT_IDS` + `LUT_META` đồng bộ từ lut.ts
  (render `server/render/src/lut.js` vốn đã 174 — bằng chứng `.ts` là
  nguồn đúng). Ghi chú số lượng trong header ("20 LUT" → "174 LUT" +
  ghi chú đợt 52 I7).
- **`sticker.js`: 30 → 244 sticker.** `STICKER_LIBRARY` đồng bộ từ
  sticker.ts (giữ nguyên comment batch 1–4 + thứ tự; bỏ `as
  StickerCategory` khi sang JS). H5 từng ghi "sticker 203→244" (Phase 6)
  — `.js` kẹt ở 30 mục gốc từ batch 1.
- **`textfx.js`: 2 mô tả cũ trong `TEXT_ANIMATION_META`.** slideReveal:
  "…quét từ trái sang phải… (ASS, quét khung hình)" → "…quét theo hộp
  chữ từ trái sang phải… (ASS)" (đợt 11 P4 đổi sang clip theo hộp chữ);
  curtainIn: "…cắt mở từ giữa ra hai bên…" → "…cắt mở từ tâm hộp chữ
  ra hai bên…" — `.ts` đã sửa, `.js` chưa theo.
- Kiểm chứng âm sau mỗi lần đồng bộ: checker từ FAIL (2 FAIL cho lut,
  2 FAIL cho sticker+textfx) về **0 fail**.

### 3.6 Test khóa hành vi mới + sửa kỳ vọng lỗi thời

- **Cập nhật 2 test đã khóa NaN cũ** (hành vi đổi có chủ ý, test phải đổi
  theo — không để đỏ): `keyframeNormalizeRound50F1.test.ts` và
  `speedKeyframesRound51H5.test.ts` — test easing-lạ nay assert ném
  `/easing không hỗ trợ: bounce/` thay vì `Number.isNaN(...) === true`.
- **Test mới** `apps/web/src/lib/mirrorUnifyRound52I7.test.ts` (**12/12**,
  §4.1): 4 test ném TS, 3 test hành vi lành, 3 test guard (memo/compute
  với bounce → giá trị linear, không ném), 1 test FADE_CURVES TS↔JS,
  1 test bezier giữ nguyên.
- **`server/render/test_color.js`: kỳ vọng lỗi thời 154 → 174.**
  Test này fail SẴN trước luồng ("catalog 154 LUT nhận 174, muốn 154")
  vì catalog đã lên 174 từ Phase 8 Q4 mà test chưa cập nhật; nó đọc
  `server/render/src/lut.js` (174 — file I7 KHÔNG đụng) nên fail không
  liên quan đồng bộ lut.js của I7. Sửa 1 số + comment. Sau sửa: **40/40**.

## 4. Kiểm chứng gộp của luồng

### 4.1 Test mới I7 + test đã cập nhật

- Web mới `apps/web/src/lib/mirrorUnifyRound52I7.test.ts`:
  **12/12, 0 fail**. Chạy:
  `node --experimental-strip-types apps/web/src/lib/mirrorUnifyRound52I7.test.ts`.
- Checker `packages/video-spec/scripts/check-video-spec-mirror.mjs`:
  **243 pass, 0 known, 0 fail** (trước: 64 pass, 7 known, 0 fail).
  Kiểm chứng âm: bản sao `.js` với `DEFAULT_SPEED_BEZIER` đổi
  `[0.25,…]` → `[0.3,…]` → checker exit 1, **2 FAIL** (probe bezier mặc
  định + value probe hằng) — cơ chế bắt lệch vẫn nhạy sau khi mở rộng.
- H5 render `server/render/test_round51_h5_speed_keyframe_null.js`:
  **17/17**. H5 web `speedKeyframesRound51H5.test.ts`: **13/13**.
  F1 web `keyframeNormalizeRound50F1.test.ts`: **11/11**.
  MCP `mcp-server/src/tools/modifyRound51H5.test.ts`: **8/8**
  (`npm run build` tsc pass rồi chạy dist).

### 4.2 Hồi quy

- Render: `keyframes.js --self-test` pass; `test_k1.js` **21/21**;
  `test_p3.js` (strip-types) **73/73, 0 skip**; `test_keyframes_sr.js`
  **31/31**; `test_nested_e2e.js` **28/28**; F1 render
  `test_round50_f1_keyframe_null.js` **26/26**; `test_color.js`
  **40/40** (sau sửa kỳ vọng §3.6); V11 parity **29 case, 0 lệch**;
  V12 parity **37 case, 0 lệch**.
- Web (strip-types): E4 `projectRepoRound49E4` **13/13**, `projectRepo`
  **10/10**, `projectRepoNested22` **7/7**, `audioEngine44Z2` **6/6**,
  I2 `audioEngine52I2` **15/15** (đụng audioEngine.ts — file I7 sửa),
  `pauseLoopGuard44Z2` **11/11**, `curveFixRound27K2` **17/17**,
  `speedcurveTrim` **18/18**, `nestedSpeedcurve` **22/22**,
  `speedcurveH3` **11/11**, `splitPatch` **14/14**,
  `nestedRampPreview` **34**, `twoLevelCurve` **12** — fail 0.
- `tsc --noEmit` toàn apps/web: **exit 0, 0 lỗi** (nợ tsc đỏ 50 lỗi của
  đợt 51 — previewEngine.ts + ttsEstimate51H2.test.ts — đã được các luồng
  khác sửa xong trước khi I7 chạy tsc; file I7 sạch). Standalone
  `tsc --strict` trên `keyframes.ts`/`speedcurve.ts`/`audio.ts`:
  **exit 0**. `tsc` build mcp-server: pass (trong lúc chạy test MCP).
- `vite build --outDir /tmp/i7-app-dist`: **pass** (37,92 s; cảnh báo
  chunk > 500 kB cũ).
- `node --check` cho `keyframes.js`, `speedcurve.js`, `audio.js`,
  `lut.js`, `sticker.js`, `textfx.js`, checker: OK.

### 4.3 Không chạy lại / không chạy được

- Click-test headed thật / Safari / máy thật chưa đo (toàn bộ trên Node 24
  + ffmpeg CLI, Chromium Linux) — cùng giới hạn như các đợt trước.
- `splitPatch.store.test.ts`: KHÔNG chạy bằng `node` trực tiếp
  (tiền sẵn, xem LIMITS H5 §4.3).

## 5. File đổi/thêm

SỬA (15 file):

- `packages/video-spec/src/keyframes.ts` — `applyEasing` thêm default
  throw (1 hunk + `@throws`).
- `packages/video-spec/src/keyframes.js` — `applyEasing` thêm default
  throw (1 hunk).
- `packages/video-spec/src/speedcurve.ts` — `applySpeedEasing` thêm
  default throw (1 hunk + `@throws`).
- `packages/video-spec/src/audio.js` — thêm `FADE_CURVES` (1 hunk +
  comment).
- `packages/video-spec/src/lut.js` — `LUT_IDS`/`LUT_META` đồng bộ
  20 → 174 (2 const + ghi chú header).
- `packages/video-spec/src/sticker.js` — `STICKER_LIBRARY` đồng bộ
  30 → 244 (1 const, giữ comment batch).
- `packages/video-spec/src/textfx.js` — `TEXT_ANIMATION_META` đồng bộ
  (1 const, 2 mô tả đổi).
- `packages/video-spec/scripts/check-video-spec-mirror.mjs` — known maps
  rỗng, probe `value:`, +173 probe mới, footer mới.
- `apps/web/src/lib/previewEngine.ts` — import `EASINGS` + helper
  `interpolateKeyframesSafe` + `memoInterpolateKeyframes` dùng helper.
- `apps/web/src/lib/audioEngine.ts` — import `EASINGS` + helper
  `interpolateVolumeKeyframes` + `computeClipGain` dùng helper.
- `apps/web/src/components/keyframes/KeyframePanel.tsx` —
  `addKeyframeAt` bọc try/catch → `meta.def`.
- `apps/web/src/lib/keyframeNormalizeRound50F1.test.ts` — test easing-lạ
  NaN → assert ném (đổi có chủ ý, §3.6).
- `apps/web/src/lib/speedKeyframesRound51H5.test.ts` — test easing-lạ
  NaN → assert ném (đổi có chủ ý, §3.6).
- `apps/web/tsconfig.json` — thêm
  `"src/lib/mirrorUnifyRound52I7.test.ts"` vào exclude (theo quy ước
  file test; 1 dòng, kề dòng exclude H5).
- `server/render/test_color.js` — kỳ vọng catalog 154 → 174 (lỗi thời
  từ Phase 8 Q4, §3.6).

MỚI (2 file: test + LIMITS này):

- `apps/web/src/lib/mirrorUnifyRound52I7.test.ts` — 12 test khóa (§4.1).
- `docs/PHASE9_ROUND52_I7_MIRROR_UNIFY_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `packages/video-spec/src/speedcurve.js`,
`server/render/src/keyframes.js`, `server/render/src/speedramp.js` (đã
ném đúng message từ trước); `mcp-server/src/tools/modify.ts` (Zod
`add_keyframe` đã chặn easing lạ bằng `z.enum` — kiểm tra rồi, không
cần sửa); `server/render/src/lut.js` (đã 174, làm chuẩn đối chiếu);
`packages/video-spec/src/index.ts` (không sửa barrel); paths-loop,
build-loop-log (parent ghi log lượt).
Scratch ở `/tmp/i7-*`, `/tmp/i7-app-dist`, `/tmp/vcut-p3-*`,
`/tmp/vcut-kfsr-*`, `/tmp/nested-e2e-*`, `/tmp/v11-parity-*`,
`/tmp/i7-color*.log`, `/tmp/i7-checker-final*.log`, `/tmp/i7-tsc.log`
(không vào repo, không vào batch). `mcp-server/dist/` là build output
của `npm run build` (đã gitignore, không vào batch).

## 6. Lưu ý cho parent gộp (tránh đụng luồng song song)

- **File chung bị nhiều luồng đợt 52 sửa cùng lúc — đối chiếu trên đĩa
  trước khi gộp:** `apps/web/src/lib/audioEngine.ts` (luồng I2 đã thêm
  `hasUsableVolumeKeyframes` TRƯỚC khi I7 sửa — guard I7 xếp chồng lên,
  đã kiểm chứng chung bằng test I2 15/15 + I7 12/12);
  `apps/web/src/components/keyframes/KeyframePanel.tsx` (mtime đổi trong
  cửa sổ đợt 52 — I7 chỉ sửa đúng hunk `addKeyframeAt`);
  `apps/web/tsconfig.json` (nhiều luồng thêm exclude — giữ đủ các dòng).
  Các file I7 sửa đều đã verify lại bằng test/checker/tsc sau lần sửa
  cuối; nếu luồng khác sửa cùng file sau thời điểm này thì chạy lại
  checker + test I7 trước khi push.
- **Ba mirror phải sửa đồng bộ** (TS, JS viết tay, render CJS): đợt này
  đổi `applyEasing`/`applySpeedEasing` ở cả 3 tầng — checker nay khóa
  strict (không còn knownGap) nên lần sau đổi 1 mirror mà quên 2 mirror
  còn lại sẽ FAIL ngay. Tương tự catalog: `lut.js`/`sticker.js`/
  `textfx.js` là mirror viết tay của `.ts` — thêm mục mới ở `.ts` thì
  PHẢI đồng bộ `.js` (đợt này đã phải vá 3 chỗ kẹt từ nhiều đợt trước).
- **Test NaN cũ đã đổi thành assert ném** (F1 + H5): nếu parent thấy
  diff ở 2 file test đó thì đó là đổi có chủ ý theo nhiệm vụ, không phải
  test bị hỏng.
- **test_color.js 154→174:** kỳ vọng cũ lỗi thời từ Phase 8 Q4; file này
  đọc render lut.js (174) nên số 174 là đúng ở cả 3 mirror.

## 7. Nợ mở (không mạo nhận đã xong)

1. **Hàm thuần chưa probe** (§3.4): adjustment/image/sticker/mask/motion/
   nested/migrations/tracking/index fns cần fixture phức tạp (clip/spec/
   layer đầy đủ) — hằng của chúng đã probe, chỉ logic hàm là chưa có
   probe. Thêm được khi có fixture mẫu sẵn.
2. **Caller edit-action chưa guard** (§1.3 C1–C2): `nestUtils` trim/split
   và `captionFollow` — cố tình fail-fast ở action (không phải tick);
   muốn guard thì phải quyết fallback ngữ nghĩa cho in/out (không tự ý
   chọn fallback sai lặng lẽ).
3. **Click-test headed thật / Safari / máy thật chưa đo** (toàn bộ trên
   Node 24 + ffmpeg CLI, Chromium Linux) — cùng giới hạn như các đợt
   trước.
4. **Script đồng bộ catalog chưa thành công cụ trong repo:** việc đồng bộ
   `lut.js`/`sticker.js`/`textfx.js` đợt này chạy bằng script tạm
   (`/tmp/i7-sync-*.mjs`, đã xóa sau khi chạy — không vào batch). Lần sau
   thêm LUT/sticker/animation mới ở `.ts` mà quên `.js` thì checker sẽ
   FAIL (đúng thiết kế), nhưng vẫn cần người chạy lại đồng bộ tay; nên
   đưa script sync vào `packages/video-spec/scripts/` ở đợt sau.
