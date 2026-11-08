# P8 — Preset + badge trạng thái cho Enhance (E3) — giới hạn trung thực (Phase 9 đợt 59)

## 0. Đính chính phạm vi: E3 đã đóng một nửa từ R2

Gap analysis §2.1 E3 ghi "Enhance KHÔNG CÓ UI — stabilize/denoise/deinterlace
đã có ở render nhưng không có UI nào trong apps/web/src expose". Kiểm chứng
trên đĩa trước khi code cho thấy câu này **đã lỗi thời một nửa**:

- Panel Enhance **ĐÃ TỒN TẠI** từ Phase 9 R2 (`apps/web/src/components/enhance/EnhancePanel.tsx`,
  nối vào Inspector tại `Inspector.tsx` — section "🎥 Tăng cường video"):
  toggle khử răng cưa + chọn mode yadif, toggle chống rung + slider smoothing,
  toggle khử nhiễu + slider strength, cảnh báo mask+nặng, cảnh báo xung đột
  speed curve. Không có code giả ở đây — panel ghi thẳng vào `clip.enhance`.
- Phần E3 **còn thiếu thật** và là phạm vi của luồng này: (a) **preset một chạm**
  cho stabilize/denoise (task yêu cầu rõ "thêm điều khiển bật/tắt + preset"),
  (b) **chỉ báo trạng thái enhance trên clip** (badge/chỉ báo nhỏ).
- Đính chính P10 đã xác nhận hướng này, và luồng đã kiểm chứng thêm từng điều
  khiển R2 (case headed B4, xem §1.3): checkbox khử răng cưa → `deinterlace:true`,
  select yadif → `{mode:1}`, checkbox chống rung → `stabilize:{smoothing:10}`,
  slider smoothing → ghi đúng số, checkbox khử nhiễu → `denoise:true`, slider
  strength → ghi đúng số — tất cả khớp field/flag render dùng, và đúng giá trị
  cuối do click thật tạo ra đã qua `validateEnhance` với 0 lỗi. Dòng cảnh báo
  "render-only, preview chưa áp enhance" (`enhance.renderOnly`) CÓ hiện trong
  panel — khoảng cách thật còn lại theo P10 (preview chưa áp enhance) vẫn đúng,
  không thuộc phạm vi UI của luồng này.
- Luồng này KHÔNG viết lại panel R2, chỉ thêm preset + dòng tóm tắt trạng thái
  trong panel + badge ✨ trên timeline. Không đổi shape `clip.enhance`,
  không sửa `packages/video-spec` (không cần — mọi field đã tồn tại).

## 1. Cái gì đã làm xong

### 1.1 Logic preset thuần — `apps/web/src/components/enhance/presets.ts` (mới)
- `ENHANCE_PRESETS` (chỉ field đã có trong `ClipEnhance`, không thêm shape):
  - `light`: `{ denoise: { strength: 0.3 } }` — khử nhiễu nhẹ, không chống rung.
  - `balanced`: `{ stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } }`
    — đúng default render (`STABILIZE_DEFAULTS.smoothing = 10`,
    `DENOISE_DEFAULT_STRENGTH = 0.5`).
  - `strong`: `{ stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } }`.
  - Stabilize trong preset chỉ có `smoothing`; denoise chỉ có `strength`.
- `matchEnhancePreset(enh)`: `off` / `light` / `balanced` / `strong` / `custom`.
  Deinterlace KHÔNG tham gia match (preset không định nghĩa khử răng cưa —
  đó là tính năng theo nguồn, chỉ bật khi video interlaced). Field thiếu được
  điền default render trước khi so (`stabilize:{}` + `denoise:true` == balanced).
- `applyEnhancePreset(current, preset)`: `off` → `undefined` (tắt tất cả);
  preset khác thay stabilize + denoise, **giữ nguyên deinterlace**;
  `custom` → giữ nguyên. Object lồng được copy mới, không chia sẻ tham chiếu
  với hằng preset.
- `enhanceActiveFeatures` / `clipHasEnhance` / `enhanceActiveLabels`: thứ tự
  deinterlace → stabilize → denoise. `deinterlace:false` / `denoise:false`
  (render coi là lỗi — xem §5) KHÔNG tính là active.
- `enhanceT(key, fallback, vars?)`: fallback VI đúng từng chữ khi key fragment
  chưa gộp (mẫu O5), kể cả thay `{list}` trong fallback.

### 1.2 UI — `EnhancePanel.tsx` + `Timeline.tsx`
- Panel: thêm `<select data-testid="enhance-preset">` (Tắt / Nhẹ / Cân bằng /
  Mạnh; option "Tùy chỉnh" disabled chỉ hiện khi giá trị hiện tại không khớp
  preset nào) + dòng tóm tắt `<p data-testid="enhance-summary">` dạng
  "Đang bật: Chống rung, Khử nhiễu" (chỉ hiện khi có tính năng bật). Toàn bộ
  điều khiển R2 cũ giữ nguyên, không đổi hành vi.
- Timeline: clip video có enhance hiện badge `<span className="clip-badge"
  data-enhance-badge>✨</span>` trước tên clip (tái dùng pattern `.clip-badge`
  của clip nested 📦), `title` = "Clip có tăng cường — xem mục Tăng cường
  video trong Inspector" (key fragment `enhance.badgeTitle`, fallback VI).
- i18n: KHÔNG sửa `vi.json` / `en.json`. 11 key mới trong fragment riêng
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round59-p8-fragment.json`
  (dạng `{"vi": {...}, "en": {...}}`), parent gộp sau. Trước khi gộp, UI
  hiển thị đúng từng chữ VI nhờ `enhanceT` (đã khóa bằng test pre-merge).

### 1.3 Test
- Mới `apps/web/src/components/enhance/enhancePresets59P8.test.ts` — **21/21
  pass cả vi và en** (`VCUT_TEST_LANG=en`):
  `./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePresets59P8.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round59-p8/presets.test.cjs && node /tmp/round59-p8/presets.test.cjs`
  - Đỏ-trước: esbuild fail vì `./presets` chưa tồn tại (1 error) — test viết
    trước, module viết sau.
  - Khóa: preset không thêm shape; smoothing ∈ [1,100], strength ∈ [0,1];
    balanced đúng default render; match off/light/balanced/strong/custom
    (kể cả bỏ qua deinterlace, `denoise:true` + `stabilize:{}`); apply giữ
    deinterlace / ghi đè đúng field / custom không đổi; features theo thứ tự;
    fragment đúng 11 key, parity vi/en, `{list}` khớp, nội dung đúng từng chữ;
    pre-merge fallback VI đúng từng chữ (cả `{list}` và locale en);
    post-merge `t()` + `enhanceT` theo locale.
- Headed thật (vite dev HMR tắt + Chromium headed qua Xvfb + CDP, mẫu O2), **6/6 PASS**:
  B0 setup (mẫu load, clip video chưa enhance, 0 badge); B1 preset Cân bằng
  bằng phím thật → store `{"stabilize":{"smoothing":10},"denoise":{"strength":0.5}}`,
  select=balanced, tóm tắt "Đang bật: Chống rung, Khử nhiễu", badge ✨ trên
  đúng clip; B2 preset Nhẹ → `{"denoise":{"strength":0.3}}`, tóm tắt chỉ còn
  "Khử nhiễu", badge vẫn còn; B3 bấm "Tắt tất cả tăng cường" bằng chuột thật →
  enhance undefined, badge + tóm tắt biến mất, select về off; **B4 (đính chính
  P10 — kiểm chứng từng điều khiển R2 bằng chuột/phím thật)**: checkbox khử
  răng cưa → `deinterlace:true`, select yadif → `{mode:1}`, checkbox chống
  rung → `stabilize:{smoothing:10}`, slider smoothing bấm chuột thật ở 25% →
  smoothing 24 (preset chuyển "custom"), checkbox khử nhiễu → `denoise:true`,
  slider strength bấm ở 70% → 0.71; enhance cuối
  `{"deinterlace":{"mode":1},"stabilize":{"smoothing":24},"denoise":{"strength":0.71}}`,
  tóm tắt đủ 3 tính năng, badge còn 1; đồng thời khóa dòng cảnh báo render-only
  ("chỉ có tác dụng khi render") có hiện trong panel; H9 0 lỗi trang.
  Chạy: `node apps/web/scripts/clicktest-59p8-enhance-presets.mjs` (exit 0).
  Screenshot + report JSON tại `hidden_files/round59-p8/headed/`; giá trị
  enhance cuối của B4 lưu tại `p8-b4-final-enhance.json`.
- Kiểm chứng từng điều khiển R2 + preset bằng **validator render thật** (ngoài
  test bundle — xem §4): `validateEnhance` từ `server/render/src/enhance.js`
  trả `[]` cho cả 3 preset VÀ cho đúng giá trị enhance cuối mà B4 tạo ra bằng
  click thật (`{"deinterlace":{"mode":1},"stabilize":{"smoothing":24},
  "denoise":{"strength":0.71}}`); `node server/render/src/enhance.js --self-test` pass.
- Hồi quy: `timelineRulerSeek40V4.test.ts` 6/6 pass (Timeline.tsx vừa đụng).
  `tsc --noEmit` apps/web: **0 lỗi ở file P8 đụng** (xem §3); `vite build`
  pass 14,62 s (chunk 1.346,67 kB, warning chunk lớn có sẵn).

## 2. File đổi (7 entry, đã stage — KHÔNG push)
- `apps/web/src/components/enhance/presets.ts` (mới)
- `apps/web/src/components/enhance/enhancePresets59P8.test.ts` (mới)
- `apps/web/src/components/enhance/EnhancePanel.tsx` (thêm preset select + summary)
- `apps/web/src/Timeline.tsx` (badge ✨, 1 dòng + 1 import)
- `apps/web/tsconfig.json` (thêm exclude cho test mới — 1 dòng)
- `apps/web/scripts/clicktest-59p8-enhance-presets.mjs` (mới)
- `docs/PHASE9_ROUND59_P8_ENHANCE_UI_LIMITS.md` (file này)
- KHÔNG stage: fragment i18n (parent gộp, xem §1.2), screenshot/log headed
  (`hidden_files/round59-p8/headed/`, không phải file repo).

## 3. tsc: 22 lỗi còn lại KHÔNG phải của P8
`tsc --noEmit` apps/web trả 22 lỗi, toàn bộ thuộc file test của 2 luồng
round-59 khác đang chạy song song (không đụng — parent gộp sẽ xử lý):
- 19 lỗi `src/lib/binPersist59P1.test.ts` (luồng P1).
- 3 lỗi `src/lib/gopTrialDecode59P6.test.ts` (luồng P6, TS5097/TS6196).
File P8 (presets.ts, EnhancePanel.tsx, Timeline.tsx, test đã exclude) 0 lỗi.
`tsconfig.json` đã có thêm exclude của P2/P4 trước khi P8 thêm dòng của mình
(`modalClasses59P4`, `escapeModals59P2`) — stage có thể đếm trùng file này
với batch P2/P4, parent dedupe khi gộp (mẫu N6/N10 đợt 57).

## 4. Vì sao không import thẳng validateEnhance vào test bundle
`server/render/src/enhance.js` có guard `if (require.main === module)` ở cuối:
không có `--self-test` thì `process.exit(2)`. Trong bundle esbuild cjs,
`require.main === module` đúng với chính bundle nên import thẳng sẽ kill
test run. Vì vậy test bundle chỉ khóa khoảng giá trị theo spec mirror, còn
đối chiếu validator thật chạy bằng script node riêng (kết quả §1.3, cả 3
preset `[]`). Đây là giới hạn của harness, không phải của preset.

## 5. Nợ mở / giới hạn còn lại
1. **Fragment chưa gộp**: 11 key `enhance.*` mới chỉ có trong
   `hidden_files/round59-p8-fragment.json`. Trước khi parent gộp, user locale
   en vẫn thấy nhãn preset/tóm tắt/badge bằng TIẾNG VIỆT (fallback đúng từng
   chữ theo thiết kế O5 — đã test). Sau gộp, `t()` tự theo locale.
2. **Chưa đo render cho đúng combo preset**: 3 giá trị preset đều qua
   `validateEnhance` và nằm trong khoảng đã render thật (P2/Q8), nhưng KHÔNG
   có lần render MP4 mới nào cho đúng combo stabilize+denoise của preset
   trong luồng này. Chi phí render suy ra từ số đo cũ: R2 đo 720p mask +
   khử nhiễu ~17,6 fps trên VM 2 vCPU không GPU; chống rung cộng thêm 1 pass
   phân tích toàn clip. Đường render thật do luồng P9 đợt 59 test riêng
   (`phase9-round59-p9-enhance-render.txt` đã stage).
3. **Preset không từ chối stabilize khi clip có speedKeyframes**: panel R2
   chỉ cảnh báo ("chống rung KHÔNG dùng chung được với speedKeyframes, render
   sẽ bị chặn"). Chọn preset Cân bằng/Mạnh trên clip có speed curve vẫn tạo
   trạng thái bị render chặn, chỉ có cảnh báo chữ. Preset giữ cùng hành vi
   với toggle tay (không tự chặn) — nếu muốn chặn thì là quyết định UX riêng.
4. **Enhance vẫn render-only**: badge ✨ và tóm tắt chỉ báo "sẽ áp khi render";
   preview canvas không áp enhance (giới hạn có sẵn từ R2, không đổi).
5. **Preset không đụng deinterlace**: deinterlace vẫn phải bật tay (đúng thiết
   kế — chỉ video interlaced mới cần). Đổi preset giữ nguyên deinterlace cũ.
6. **Lệch ngữ nghĩa nhỏ có sẵn, không sửa**: `EnhancePanel` cũ tính
   `deintOn = base.deinterlace !== undefined` nên `deinterlace:false` vẫn
   hiện checkbox bật, trong khi helper P8 và render đều coi `false` là
   không-active / lỗi. Giá trị `false` không sinh ra được qua UI (checkbox chỉ
   ghi `true` hoặc xóa key) nên không ảnh hưởng thực tế; ghi lại để khỏi ai
   "sửa đồng bộ" nhầm.
7. **Ghi chú harness headed** (để luồng sau khỏi mất thời gian lặp lại):
   - Click chuột thật vào `<select>` native mở popup của Chrome; popup này
     KHÔNG nhận phím CDP (`ArrowDown` không đổi giá trị — 2 lượt chạy đầu
     B1/B2 FAIL đúng chỗ này). Cách làm: focus select bằng JS (setup) rồi
     gửi phím thật qua CDP khi popup chưa mở — ArrowDown/Up đổi thẳng giá trị
     và bắn `change`.
   - `Escape` trong lúc popup select mở sẽ HOÀN TÁC lựa chọn về giá trị cũ
     (lượt 2 FAIL vì lý do này); `Enter` trên select đang focus sẽ MỞ popup
     (lượt B4 FAIL vì lý do này). Cách đóng popup an toàn sau khi đổi bằng
     phím: `blur()` qua JS — giữ nguyên giá trị đã chọn.
   - Nút "Tắt tất cả tăng cường" nằm dưới fold của Inspector — phải
     `scrollIntoView` trước khi click thật (lượt 3 B3 FAIL vì click trượt).
   - Control ở mép dưới Inspector bị toolbar timeline che: probe B4 đo
     `elementFromPoint` tại tâm checkbox chống rung trả về `DIV.tl-hint` —
     đây là LỖI HÌNH HỌC CỦA HARNESS, không phải bug sản phẩm (checkbox nằm
     đúng ranh giới panel/timeline, user thật cuộn panel là bấm được).
     Cách làm: `scrollIntoView({block:"center"})` từng checkbox/slider
     trước khi bấm chuột thật.
   - EnhancePanel tái dùng class CSS `mask-panel` của MaskPanel nên query
     `".mask-panel"` trần trả về panel Mask đứng trước trong DOM — harness
     phải neo từ `[data-testid="enhance-preset"]` rồi `closest(".mask-panel")`
     (lượt B4 đầu FAIL vì lý do này).
   - Display Xvfb đụng luồng khác: `:161`/`:162` đã có X server khác chạy
     (nhiều luồng đợt 59 headed song song); harness P8 tự quét display trống
     `:182–:189` và dọn socket mồ côi.
8. **`enhanceT` so sánh `out === key`**: nếu một ngày giá trị dict trùng
   đúng chuỗi key thì fallback kích hoạt nhầm — không thể xảy ra với key
   `enhance.*` hiện tại; ghi lại cho đủ.

## 6. Không làm trong luồng này (đúng phạm vi task)
- Không đổi shape `clip.enhance`, không sửa `packages/video-spec`, không thêm
  field mới (nếu thiếu field thì báo — không thiếu field nào).
- Không render MP4 mới cho preset (P9 làm đường render), không preview
  enhance, không preset cho deinterlace mode, không push/tag/release, không
  binary trong batch.
