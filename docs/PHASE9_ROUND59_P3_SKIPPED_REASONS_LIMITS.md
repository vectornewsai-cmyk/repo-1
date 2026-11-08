# Phase 9 đợt 59 — P3: `skippedReasons` nêu tên type + lý do skip của đường vẽ từng frame ra UI (LIMITS)

Ngày: 2026-11-07. Luồng P3, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Đóng nợ đợt 58 §6.3 (O3) = LIMITS đợt 58 §5.2 + §5.3 + §5.4 và
LIMITS tổng hợp đợt 58 §6.3:
(a) `skippedReasons` chỉ sinh khi có layer adjustment;
(b) chuỗi lý do effect không nêu tên type (key N4
`unknownEffectType` thiếu biến `{type}`);
(c) đường vẽ từng frame vẫn chỉ console.warn.
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết quả ngắn

- (a) `splitClipByAdjustments` nay thu `skippedReasons` cả khi không có
  layer nào áp lên clip (kể cả layer có nhưng scope không áp); đường
  nhanh + đường chậm của failsoft đều được bao (cùng đi qua hàm này).
- (a') `skippedEffectReason` truyền `{type}` cho trKey; giá trị mới của
  key `nested.failsoft.unknownEffectType` (có `{type}`) nằm trong
  fragment riêng — parent gộp cuối đợt (ghi đè, xem §5.1 checklist).
- (b) Badge cảnh báo dưới preview nay hợp nhất lý do effect-skip từ
  failsoft (flatten) + lý do của FRAME HIỆN TẠI (helper thuần mới
  `frameSkippedEffectTypes`) thành 1 dòng badge + 1 toast effect
  (kind `info`); cùng 1 type chỉ đếm 1 lần. Spec phẳng (không nested/
  adjustment) — nơi failsoft trả rỗng — nay cũng hiện được badge.
- Test mới 16/16 (đỏ-trước 8/16); O3 13/13; N4 14/14; hồi quy
  nestedPreview 46, nestedRampPreview 34, previewEngine 14, H6 15,
  M5 21, L2 20/20. `tsc` apps/web 0 lỗi; `vite build` pass 9.30s.
  Click-test headed 2 lượt PASS (pre-merge + merge tạm, xem §3.3).

## 1. Thiết kế đã chọn

### 1.1 (a) Thu lý do ở early-return của split, không đụng hot path nhanh

`splitClipByAdjustments` return ngay khi `applicable.length === 0`
(mọi layer đều không áp — vì không có layer, hoặc scope loại clip).
Fix: khi caller truyền collector (`collect`, chỉ `buildPreviewSpec`/
failsoft truyền) thì chạy 1 lần `applyAdjustmentPreview(clip, [], midpoint,
clipScope, lookup)` để thu `skippedReasons` của riêng clip; không có
collector thì vẫn return nhanh như cũ — caller cũ (3 call-site 4 tham
số, kể cả đường render) không tốn thêm. `applyAdjustmentPreview` với
layers rỗng cho `adjustmentActive=false`, effects = chính `clip.effects`
nên skip tính đúng từ clip (không bịa thêm layer).
Không đụng early-return `!hasNestedOrAdjustment` của
`buildPreviewSpecDetailed` (trả đúng object cũ + skipped rỗng, khóa O3
§B'): spec phẳng mang effect lạ được đường frame (§1.2) bao thay cho
đường flatten.

### 1.2 (b) Helper thuần theo (spec phẳng, playhead), KHÔNG state theo frame

Đã cân nhắc pattern `tickHadHold` (accumulator module-level, badge đọc
tick trước): bỏ vì lý do effect-skip là hàm thuần của (spec, playhead),
không phải trạng thái nhất thời như hold (decoder tụt). Accumulator sẽ
stale 1 frame — và khi vòng lặp ngủ lúc pause thì stale tới lần wake sau
(seek từ đoạn có effect sang đoạn trống: badge vẫn hiện effect cũ trong
khi màn hình đã là frame mới). Helper mới `frameSkippedEffectTypes`
trong `previewEngine.ts` tính lại tươi mỗi tick từ spec cuối +
playhead hiện tại, kể cả lúc pause; điều kiện hiện MIRROR vòng lặp video
của `renderFrame` (track video không hidden, clip video, `t` trong
`[start, start+duration)`) nên tập này đúng bằng tập đường vẽ bỏ qua.
`console.warn` của `warnSkippedEffects` GIỮ NGUYÊN song song (kênh debug);
badge là kênh user thấy. Không chọn NestedClipPanel/LoadReportPanel
(giữ quyết định O3 §1).

### 1.3 Hợp nhất 2 nguồn thành 1 dòng badge + 1 toast (không đếm trùng)

Khối badge trong `tickInner` nay hoist `failsoft.skipped` /
`failsoft.skippedReasons` ra biến ngoài try (để dùng chung cả đường
flatten ném lỗi — khi đó 2 tập rỗng, chỉ còn lý do frame), rồi sau
try/catch tính `effectReasons = [...failsoftSkippedReasons,
...frameReasons]` (lọc trùng theo chuỗi lý do đã dịch — cả hai nguồn
đều qua `skippedEffectReason` với cùng lookup `i18nT` nên chuỗi trùng
nhau; classifier 16 type chuẩn của 2 nguồn khớp nhau từng type, đã
kiểm chứng: `EFFECT_TYPES` 16 type đều có case trong `effectsVisual`
và đều nằm trong `PREVIEW_SUPPORTED_EFFECTS` ∪ `PREVIEW_CANVAS_EFFECTS`).
Toast keyed theo tập hợp nhất (`lastFailsoftSkippedKeyRef`); toast
effect = `info`, toast nested giữ `error`. Không thêm key i18n mới:
tái dùng 2 key O3 `preview.effectSkippedBadge` / `preview.effectSkippedToast`.

## 2. Đã làm

### 2.1 lib — `apps/web/src/lib/nestedPreview.ts`

- `skippedEffectReason(type, lookup)`: truyền `{ type }` cho trKey
  (thay `{}` cũ). Dict cũ chưa có placeholder nên chuỗi không đổi cho
  tới khi parent gộp (tương thích pre-merge, khóa bằng test §B).
  Fallback KHÔNG đổi (giữ chuỗi VI cũ không nêu tên — xem §5.2).
- `splitClipByAdjustments`: nhánh `applicable.length === 0` thu
  skippedReasons qua `applyAdjustmentPreview` khi có collector (xem
  §1.1). Đường chậm failsoft được bao cùng lúc (cùng gọi hàm này với
  `slowCollect`).
- Comment giới hạn ở `BuildPreviewSpecDetailedResult` +
  `BuildPreviewSpecFailsoftResult` cập nhật theo hành vi mới.

### 2.2 lib — `apps/web/src/lib/previewEngine.ts`

- `frameSkippedEffectTypes(spec, t)` (mới, export): hợp
  `effectsVisual(clip.effects).skipped` trên video clip đang hiện tại
  `t`, dedupe giữ thứ tự. TextClip không có field `effects` (xác nhận
  từ `packages/video-spec/src/index.ts`), image/sticker cũng không —
  helper chỉ xét video clip là đủ và khớp `renderFrame`.

### 2.3 UI — `apps/web/src/preview.tsx`

- Import thêm `skippedEffectReason` (nestedPreview) +
  `frameSkippedEffectTypes` (previewEngine).
- Khối badge: hoist kết quả failsoft + hợp nhất sau try/catch (xem
  §1.3). Không đổi ngữ nghĩa throw/fail-fast, không đổi thứ tự spec,
  không đổi `warnSkippedEffects` / các call-site của nó.

### 2.4 i18n — fragment P3 (1 key, CHƯA gộp)

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round59-p3-fragment.json`
(không nằm trong `apps/web/src/i18n/fragments/` — theo task luồng này;
test N4 "không trùng fragment khác" chỉ quét thư mục fragments nên
không bị ảnh hưởng):

| Key | VI | EN |
|---|---|---|
| `nested.failsoft.unknownEffectType` | `type "{type}" chưa biết, không có đường vẽ trong preview` | `unknown type "{type}", no draw path in preview` |

`vi.json`/`en.json` KHÔNG sửa trong luồng này (parent gộp cuối đợt).
Gộp là GHI ĐÈ key cũ (không tăng số key: 1942 giữ nguyên — snapshot
khóa 1942 không vỡ vì ghi đè, xem §5.1).

### 2.5 Test O3 cập nhật (bắt buộc vì hành vi cũ bị đổi có chủ ý)

`apps/web/src/lib/failsoftSurface58O3.test.ts`: lookup merge thêm
fragment P3 (đọc từ hidden_files) để xanh cả pre-merge lẫn post-merge;
4 assert chuỗi `unknownEffectType` đổi sang giá trị mới có tên type
(§C ×2 + §G ×2); case "không layer → []" đổi thành "vẫn có
skippedReasons" (đúng nợ đã đóng). §E (fallback) giữ nguyên. Test N4
KHÔNG sửa (xem §5.1 — việc của parent lúc gộp).

## 3. Kiểm chứng (số thật, chạy 2026-11-07)

### 3.1 Test mới — `apps/web/src/lib/skippedReasons59P3.test.ts`: 16/16 pass

Chạy mẫu N4/O3 (esbuild bundle `--format=cjs` rồi `node`):
`./node_modules/.bin/esbuild apps/web/src/lib/skippedReasons59P3.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round59-p3/p3.test.cjs && node /tmp/round59-p3/p3.test.cjs`

- Đỏ-trước (chạy trước khi sửa code): 8/16 đỏ — đúng các assert hành
  vi mới: `{type}` còn nguyên literal trong chuỗi lý do, 5 case
  không-layer/scope-lệch/slow-path trả `[]`, wiring thiếu
  `skippedEffectReason`; 5 test còn lại xanh ngay từ đầu (fragment,
  tương thích pre-merge, fallback, boundary spec phẳng, effectsVisual).
- §A fragment: đúng 1 key, vi/en đều có đúng `{type}`, khác nhau;
  merge-proof: dict hiện tại hoặc là giá trị cũ hoặc đã bằng fragment.
- §B `skippedEffectReason("weird-xyz", lookupP3)` → đúng tên type cả
  vi/en; type khác (`hologram`) cũng nêu tên; lookup chỉ từ dict →
  chuỗi cũ (tương thích pre-merge); không lookup → fallback cũ.
- §C không-layer: lá nested effect lạ không layer → skippedReasons
  nêu tên; layer có nhưng scope không áp clip (track 1, clip track 0)
  → vẫn thu; 2 lá cùng effect → dedupe 1; có layer phủ → hồi quy O3
  đúng; clip tầng ngoài + layer scope ngoài → thu; đường chậm
  (nested v=5 về 1×) + lá effect lạ không layer → warning linear-1x
  + skippedReasons; spec phẳng không nested/adjustment → skipped
  rỗng + trả đúng object cũ (ranh giới đã ghi); `applyAdjustmentPreview`
  không layer → skipped + nêu tên, `adjustmentActive=false`.
- §D wiring: preview.tsx chứa `frameSkippedEffectTypes`,
  `skippedEffectReason`, `effectReasons`, `failsoft.skippedReasons`,
  `lastFailsoftSkippedKeyRef`, 2 key effect; `effectReasons` trước
  chỗ ghi badge; toast effect qua `i18nT`; giữ `warnSkippedEffects`.
- §E helper frame: `effectsVisual` chỉ skip type lạ (blur/sharpen/
  glitch không skip); `frameSkippedEffectTypes` chỉ lấy video clip
  đang hiện (ngoài cửa sổ → rỗng, 2 type lạ cùng frame đều liệt kê),
  bỏ track hidden / track text.

### 3.2 Hồi quy (chạy lại, toàn bộ xanh)

| Suite | Kết quả |
|---|---|
| `failsoftSurface58O3.test.ts` | 13/13 pass |
| `i18nRound57N4.test.ts` | 14/14 pass |
| `nestedPreview.test.ts` | 46 pass |
| `nestedRampPreview.test.ts` | 34 pass |
| `previewEngine.test.ts` | 14 pass |
| `previewEngine51H6.test.ts` | 15 pass |
| `i18nRound56M5.test.ts` | 21 pass |
| `i18nAudit55L2.test.ts` | 20/20 pass |

`tsc --noEmit` apps/web: **0 lỗi** (lúc chạy đầu thấy 2 lỗi TS5097 ở
`binPersist59P1.test.ts` — file của luồng P1 song song, không phải
file P3; chạy lại sau đó hết — P1 tự sửa; 0 lỗi ở mọi file P3 đụng
trong mọi lần chạy). `vite build` apps/web: **pass, 9.30s** (cảnh báo
chunk >500kB có sẵn).

### 3.3 Click-test headed — PASS cả 2 lượt (browser thật)

Harness `~/scratch-round59-p3/clicktest-59p3-frame-skipped.mjs`
(mẫu O3: vite dev đóng băng + Chromium headed qua Xvfb + CDP, Node
thuần): chích spec PHẲNG qua `import("/src/store.ts")` — track V1
video clip mang effect `weird-xyz` (0..4s, playhead 0), track T1 text
"Xin chào"; KHÔNG nested, KHÔNG adjustmentLayers (failsoft trả rỗng
cho spec này — badge hiện được CHỈ CÓ THỂ là nhờ đường frame).

- **Lượt 1 (dict chưa gộp fragment, trạng thái stage thật): PASS** —
  badge `⚠ 1 hiệu ứng không vẽ được trong preview`, visible + trong
  viewport, KHÔNG có dòng nested; title
  `type chưa biết, không có đường vẽ trong preview` (chuỗi cũ,
  đúng hành vi pre-merge); toast effect kind `info`, text
  `Preview không vẽ được 1 hiệu ứng (ví dụ: type chưa biết, …). Bản
  render vẫn có hiệu ứng.` Report:
  `~/scratch-round59-p3/p3-report-p3-1440x900.json`.
  Lưu ý harness: lần đo đầu FAIL giả vì toast React chậm hơn badge
  1 nhịp render (badge đã hiện, toast chưa kịp mount — `reMeasured`
  300ms sau đã thấy toast đúng); đã sửa harness chờ cả badge + toast
  rồi chạy lại mới PASS — không phải bug sản phẩm.
- **Lượt 2 (merge TẠM fragment P3 vào vi/en để đo text cuối, rồi khôi
  phục): PASS** — badge như lượt 1; title + toast nay nêu tên:
  `type "weird-xyz" chưa biết, không có đường vẽ trong preview`.
  Screenshot: `~/scratch-round59-p3/p3-badge-p3-1440x900-merged.png`
  (đã xem bằng mắt: badge đỏ dưới preview + toast góc dưới-phải +
  preview vẫn vẽ được chữ "Xin chào").
- **Khôi phục sau lượt 2 (đã verify):** `vi.json`/`en.json` chép lại
  từ backup `/tmp/round59-p3/backup/`, `sha256sum -c` OK, đếm lại
  **1942 key lá mỗi bên, `unknownEffectType` về giá trị cũ** — batch
  stage KHÔNG chứa vi/en.json. (Repo local không có `.git` nên không
  dùng `git checkout` được; backup + checksum là cơ chế khôi phục,
  mẫu O3.)

## 4. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round59-p3-skipped-reasons.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/nestedPreview.ts`
- `apps/web/src/lib/previewEngine.ts`
- `apps/web/src/preview.tsx`
- `apps/web/src/lib/skippedReasons59P3.test.ts`
- `apps/web/src/lib/failsoftSurface58O3.test.ts`
- `docs/PHASE9_ROUND59_P3_SKIPPED_REASONS_LIMITS.md`

Fragment P3 nằm ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round59-p3-fragment.json`
(ngoài repo — parent đọc từ đó để gộp, không nằm trong batch push).
`vi.json` / `en.json` KHÔNG sửa. Click-test + report + screenshot chỉ
nằm ở `~/scratch-round59-p3/` (scratch, không stage). Không có
binary/dist/`__pycache__` trong batch.

## 5. Nợ mở / giới hạn trung thực

1. **Fragment chưa gộp — parent gộp theo checklist sau (ghi đè CÓ kiểm
   chứng, theo task luồng này):** gộp
   `hidden_files/round59-p3-fragment.json` vào `vi.json`/`en.json`
   (deep-merge, GHI ĐÈ key `nested.failsoft.unknownEffectType`, số key
   giữ 1942 — không phải key mới nên snapshot 1942 không vỡ). Sau khi
   gộp, các test sau sẽ ĐỎ nếu không cập nhật cùng lúc (đã kiểm chứng
   logic — parent đối chiếu rồi sửa):
   - `i18nRound57N4.test.ts` — "sau gộp": dict phải bằng fragment
     `round57-n4.json` (giá trị cũ) → cần cập nhật giá trị
     `unknownEffectType` trong `round57-n4.json` thành giá trị mới
     (giữ 11 key, placeholder `{type}` khớp vi/en thì §A vẫn xanh).
   - N4 §C (lookup en): `skippedEffectReason("sharpen", lookupEn)` +
     `applyAdjustmentPreview(...).skippedReasons` → chuỗi mới
     `unknown type "sharpen", no draw path in preview`.
   - N4 §D: `lookupVi("nested.failsoft.unknownEffectType")` → chuỗi
     mới `type "sharpen" chưa biết, không có đường vẽ trong preview`
     (đúng hơn: chuỗi mới với type tương ứng); và assert
     `skippedEffectReason("sharpen", lookupVi) ==
     skippedEffectReason("sharpen")` sẽ vỡ vì fallback vẫn cũ (xem #2)
     → parent quyết: hoặc cập nhật fallback theo #2, hoặc sửa assert
     này (khuyến nghị cập nhật fallback cho nhất quán — 1 dòng code +
     sửa O3 §E cùng lúc).
   - Test O3 đã merge-proof (lookup của nó gộp fragment P3) nên KHÔNG
     cần sửa thêm sau khi gộp; test P3 mới cũng vậy.
2. **Fallback không lookup vẫn chuỗi cũ không nêu tên:** `trKey` trả
   fallback nguyên văn khi không có lookup, mà fallback là chuỗi tĩnh
   `"type chưa biết, không có đường vẽ trong preview"` (không có
   `{type}` để thế). Giữ nguyên có chủ ý để N4 §D + O3 §E xanh
   pre-merge; đường UI thật luôn truyền `i18nT` nên không ảnh hưởng
   user. Muốn fallback cũng nêu tên thì đổi fallback thành chuỗi ráp
   từ `type` (vd `` `type "${type}" chưa biết, …` ``) + sửa O3 §E
   (khóa fallback cũ) và N4 §D (xem #1) — việc nhỏ, để chung với lần
   gộp của parent.
3. **Spec phẳng không qua flatten → `skippedReasons` vẫn rỗng:**
   `buildPreviewSpecDetailed` trả đúng object cũ khi không có nested/
   adjustment (khóa O3 §B'). Effect lạ ở spec phẳng chỉ được đường
   frame (`frameSkippedEffectTypes` + badge) phát hiện — đủ cho UI,
   nhưng code nào chỉ đọc `buildPreviewSpecFailsoft(...).skippedReasons`
   mà không qua badge sẽ không thấy. Muốn đủ 100% ở tầng lib thì phải
   bỏ early-return (đổi hot path + vỡ khóa O3 §B') — ngoài phạm vi
   luồng này.
4. **Decoder tụt (hold) thì helper vẫn liệt kê effect:** helper tính
   từ spec (clip đang hiện) nên kể cả frame mà decoder tụt làm cả clip
   không được vẽ (guard `readyState>=2` trong `drawVideoClip` bỏ qua
   frame, `warnSkippedEffects` cũng im) thì badge vẫn hiện effect —
   đúng theo nghĩa "effect không được vẽ ở frame này" nhưng nguyên
   nhân thật lúc đó là decoder, không phải type effect. Hiếm, chỉ khi
   tụt decoder; chấp nhận được cho chỉ báo (cùng tinh thần badge hold).
5. **Badge `whiteSpace: nowrap` (nợ cũ J1/O3):** text gộp curve +
   nested + effect có thể dài và tràn ngang trên preview hẹp — chưa đo
   layout tràn. Title hover vẫn đọc đủ.
6. **Toast bắn khi tập hợp nhất đổi:** scrub/phát qua các đoạn có
   effect khác nhau thì mỗi lần đổi tập bắn 1 toast effect (theo thiết
   kế keyed của O3 — không spam từng frame, chỉ khi tập đổi). Project
   có nhiều effect lạ ở nhiều đoạn có thể thấy vài toast khi phát qua
   — chấp nhận được, đúng ngữ nghĩa "tập đổi".
7. **Không đụng NestedClipPanel / LoadReportPanel:** giữ quyết định
   O3 — badge preview là điểm hiển thị duy nhất (panel không chạy
   flatten nên không biết lá nào bị bỏ).
8. **Tạm thời trong lúc chạy:** `tsc` lần đầu thấy 2 lỗi TS5097 ở
   `binPersist59P1.test.ts` của luồng P1 song song (không phải file
   P3); chạy lại sau đó hết — P1 tự sửa, không phải do P3 gây ra hay
   sửa hộ.
