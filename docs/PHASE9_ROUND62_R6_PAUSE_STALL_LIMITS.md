# Phase 9 đợt 62 — R6: badge pause-seek stall + phục hồi decoder error sticky + attribution theo instance (LIMITS)

Ngày: 2026-11-08. Luồng R6, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Đóng nợ đợt 61 §5.8 (= LIMITS R8 §5.1 + §5.3 + §5.5):
(a) badge vẫn hiện lý do khi decoder stall ở chế độ pause;
(b) lỗi decoder sticky (`error:3` không hồi phục khi playhead về vùng
decode được);
(c) trùng clipId giữa 2 instance nested → 1 instance stall ẩn lý do cả 2.
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG sửa vi.json/en.json
(không cần key mới — badge/toast dùng lại key cũ; không có fragment i18n).

## 0. Kết quả ngắn

- (a) Seek pause thất bại đã chứng minh (timeout/error) nay ghi ngay
  key instance của các active tại t vào `tickSkippedClipIds` → badge
  ẨN lý do sau ~1 lần timeout (~1,3 s) thay vì hiện suốt như R8 C1-pause
  (12/12 mẫu hiện). Đo headed: mẫu đầu (0,5 s) HIỆN, 5/5 mẫu cuối
  (5,5–8 s) ẨN, skip Δ = 0, `seekFailureKind=timeout`, count = 6.
- (b) Sau mỗi lần seek thất bại đã chứng minh (chưa cạn cap), element
  ĐÃ LỖI (`error !== null`) bị drop ngay → lần retry sau tạo element
  mới. Đo headed: scrub từ vùng stall (ph 6) về vùng decode được
  (ph 2) thì frame vẽ lại sau **1.629 ms** (baseline chưa fix: ~13 s
  chờ cạn cap Y2), `decoderErrorRecovered` tăng 3 trong đúng phase
  stall, badge hiện lại sau hồi phục (frame vẽ được, effect thật sự
  bị skip).
- (c) Attribution theo INSTANCE: `skippedReasonsByClip.clipId` nay là
  key instance (`"nA/leaf-1"`) thay cho leaf id trần; clip trong spec
  phẳng được đóng dấu `__vcutInstanceKey`; `tickSkippedClipIds` +
  `frameSkippedEffectTypes` đối chiếu bằng đúng key này. Đo headed:
  stall instance A (ph 6) → badge ẨN; scrub sang instance B (ph 10,
  vẽ được) → badge HIỆN lại + draw Δ = 1 (trước fix, stall A ẩn cả
  lý do của B).
- Contract O3/N4 GIỮ NGUYÊN: `skippedReasons: string[]` không đổi nội
  dung — test §E khóa trực tiếp; O3 13/13, N4 14/14 chạy lại nguyên vẹn
  không sửa.
- Test mới 17/17; hồi quy R8 20/20, Q6 15/15, O3 13/13, N4 14/14,
  P3 16/16, nestedPreview 46, J1 6. `tsc` 0 lỗi ở mọi file R6 đụng
  (1 lỗi TS6133 còn lại ở file luồng khác R5 — xem §3.2, không sửa hộ).
  `vite build` pass 22,62 s. Harness headed PASS lượt chạy cuối (§3.3).

## 1. Thiết kế đã chọn

### 1.1 (c) Key instance — namespace theo `nestedPath`

Key instance của một clip lá = `nestedPath` (chuỗi id nested bao ngoài,
từ ngoài vào trong) + leaf id, nối bằng `/` (`scopedClipId`):
- clip tầng ngoài: `nestedPath []` → key = đúng `clip.id` (không đổi).
- lá trong nested `"nA"`: key = `"nA/leaf-1"`.
- lá lồng 2 cấp `"nA" > "nB"`: key = `"nA/nB/leaf-1"`.

`nestedPath` đã có sẵn trong `FlatClip` + `ClipScope` nên không cần
thêm dữ liệu ở tầng flatten. Hai điểm phải khớp nhau thì attribution
mới tách đúng:
- **Lib** (`splitClipByAdjustments`, cả 2 nhánh thu attribution):
  `clipId = scopedClipId(clipScope?.nestedPath, clip.id)`. Scope đã
  được truyền đúng ở mọi call site (tầng ngoài `[]`, lá nested
  `f.nestedPath`, failsoft đường chậm cũng vậy).
- **Phía vẽ**: clip trong spec phẳng được đóng dấu key instance bằng
  field `__vcutInstanceKey` (`stampPreviewInstanceKey`, luôn copy mới
  nên không sửa clip gốc của flatten; `clip.id` giữ nguyên). Mọi nơi
  đọc/ghi tập not-drawn đều qua `previewClipInstanceKey(clip)`:
  `drawVideoClip` (3 điểm: `!item`, `!srcEl`), `drawImageClip`
  (guard), `collectActives` (thêm `clipKey` vào `ActiveMedia`),
  `frameSkippedEffectTypes` (previewEngine.ts).
- Clip không có dấu (spec phẳng, spec chưa phẳng, test cũ) thì key =
  đúng `clip.id` — tương thích ngược hoàn toàn.
- Field dấu CHỈ sống trên bản sao spec phẳng của preview (clip lá đã
  copy khi flatten/split), không chạm spec gốc trong store, không đi
  vào render hay file lưu (render có đường flatten riêng). Đã khóa
  bằng test: spec gốc sau `buildPreviewSpecDetailed` không có dấu.
- `dedupeAttributions` key theo clipId nên 2 instance cùng type nay
  dedupe thành 2 entry (đúng), trong khi `skippedReasons` vẫn dedupe
  còn 1 chuỗi (đúng ngữ nghĩa cũ).

### 1.2 (a) Ghi `tickSkippedClipIds` từ nhánh `.then` seek-thất-bại

Nguyên nhân gốc (R8 §3.3 C1-pause): seek kẹt timeout → fix bug B đợt
31 N1 (timeout KHÔNG được vẽ) → `renderFrame` không chạy →
`tickSkippedClipIds` không bao giờ được ghi → badge vẫn hiện lý do.
Sửa: trong nhánh `.then` seek-thất-bại của vòng lặp pause (kind khác
null — timeout/error đã chứng minh), ghi ngay `clipKey` của các
active tại t vào `tickSkippedClipIds` (qua `collectActives`, bọc
try/catch để `collectActives` ném thì không thành unhandled
rejection). Ghi trên MỌI lần thất bại, kể cả lần cạn cap (badge kịp
cập nhật ở tick trước khi vòng lặp ngủ), không chờ cạn cap 10 lần.
- **Tự sửa:** khi seek sau thành công thì `renderFrame` chạy lại và
  reset + ghi lại tập từ đầu (clip vẽ được sẽ không còn trong tập,
  badge hiện lại nếu effect của nó thật sự bị skip); khi seek vẫn
  thất bại thì ghi lại đúng key đó ở lần `.then` sau.
- **Nhiễu thoáng qua chấp nhận được:** decode chỉ-chậm (timeout 1 lần
  rồi hồi phục ở retry sau) thì badge ẩn ~1 tick rồi hiện lại — đúng
  ngữ nghĩa (trong lúc đó frame thật sự chưa vẽ được), không phải
  hành vi sai.
- Toast + `skippedKey` vẫn dùng tập spec-wide như R8 (không đổi).

### 1.3 (b) Drop element ĐÃ LỖI sau thất bại đã chứng minh

Nguyên nhân gốc (R8 §5.3): lỗi decoder Chromium là sticky — element
đã `error:3` thì seek/play lại không hồi phục. Cơ chế duy nhất là
drop element + tạo mới. Y2 (đợt 43) chỉ drop ở lúc CẠN CAP (10 lần
≈ 12,8 s) nên scrub về vùng tốt vẫn kẹt ~13 s.
Sửa: trong cùng nhánh `.then` trên, khi chưa cạn cap, drop ngay các
active có `error !== null` (`planDecoderErrorRecovery`, pure, test
được bằng mock) + `engine.releaseElement` (cùng ngữ cảnh Y2 nên an
toàn: seek đã settle, không còn seek bay) + đếm tích lũy vào
`decoderErrorRecovered` (phơi qua `PreviewIdleDebug`, harness đọc
delta). Đã cạn cap thì khối Y2 drop toàn bộ actives như cũ — không
drop trùng ở đây để khỏi lệch số đếm `seekElementRecreated` của Y2.
- **Chỉ drop element ĐÃ LỖI, không drop mọi element timeout:**
  timeout có thể chỉ là decode chậm (seek sẽ xong ở retry sau — X2:
  seek chậm ~5 s hội tụ trong ~4 lần timeout); drop element chỉ-chậm
  thì phí lần nạp metadata + phá hội tụ. `error !== null` là tín hiệu
  dính chắc chắn.
- **Chỉ drop sau thất bại đã chứng minh (trong `.then`), không drop
  trước khi seek:** lúc đó seek đã settle nên không cắt seek đang bay
  hay fallback proxy đang load (cơ chế proxy của `MediaPool.videoFor`
  đổi src đồng bộ trong handler `error`; lần load mới reset `error`
  về null trước khi tick sau chạy — xem §5.4).
- Mỗi chu kỳ stall (thử lại ở vùng hỏng) tạo ~1 element mới, chặn
  bởi cap X2 (10 lần) — không vô hạn.

## 2. Đã làm

### 2.1 Lib mới — `apps/web/src/lib/previewClipKey62R6.ts` (thuần, 0 import)

- `PREVIEW_INSTANCE_KEY = "__vcutInstanceKey"`.
- `scopedClipId(nestedPath, clipId)` — namespace theo nestedPath.
- `previewClipInstanceKey(clip)` — đọc dấu, fallback `clip.id`.
- `stampPreviewInstanceKey(clip, nestedPath)` — copy mới có dấu;
  nestedPath rỗng → trả đúng object cũ.

### 2.2 Lib mới — `apps/web/src/lib/decoderErrorRecovery62R6.ts` (thuần, 0 import)

- `planDecoderErrorRecovery(actives)` — chỉ lấy element có
  `error !== null`, dedup theo identity, kèm mã lỗi để chẩn đoán;
  không bao giờ throw (đọc `error` trong try/catch từng element).
- `hasDecoderError(el)`.

### 2.3 `apps/web/src/lib/nestedPreview.ts`

- Import 2 helper trên (dòng đơn + `@ts-ignore` TS5097, theo đúng mẫu
  `twoLevelCurve` có sẵn — import nhiều dòng làm `@ts-ignore` không
  che được lỗi ở dòng module specifier, xem §3.2).
- `splitClipByAdjustments`: cả 2 điểm thu attribution dùng
  `scopedClipId(clipScope?.nestedPath, clip.id)`.
- `buildPreviewSpecDetailed` (đường nhanh) + failsoft đường chậm:
  đóng dấu `stampPreviewInstanceKey(seg, f.nestedPath)` lên từng đoạn
  lá nested trong spec phẳng.
- Doc `SkippedReasonAttribution.clipId` cập nhật: nay là key instance.

### 2.4 `apps/web/src/lib/previewEngine.ts`

- `frameSkippedEffectTypes`: đối chiếu `notDrawnClipIds` bằng
  `previewClipInstanceKey(clip)` thay cho `clip.id`; doc
  `FrameSkippedEffectOptions` cập nhật tương ứng.

### 2.5 `apps/web/src/preview.tsx`

- Import 2 helper mới.
- `drawVideoClip` (nhánh `!item` + nhánh `!srcEl`) và `drawImageClip`
  (guard): ghi `previewClipInstanceKey(clip)` vào `tickSkippedClipIds`
  thay cho `clip.id`; comment module của tập cập nhật (key instance +
  đường ghi mới từ `.then`).
- `ActiveMedia` thêm `clipKey`; `collectActives` tính
  `previewClipInstanceKey(clip)` ở cả 2 điểm push (video/audio).
- `PreviewIdleDebug` thêm `decoderErrorRecovered: number` (đếm TÍCH
  LŨY từ lúc mount, khác `seekElementRecreated` của Y2 là số ở lần
  cạn cap gần nhất) + closure var + publish ở snapshot tick.
- Nhánh `.then` seek-thất-bại (kind khác null):
  - (a) ghi `clipKey` của actives tại t vào `tickSkippedClipIds`
    (try/catch).
  - (b) khi chưa cạn cap: `planDecoderErrorRecovery` → drop element
    đã lỗi + `engine.releaseElement` + đếm (try/catch).

### 2.6 Test mới — `apps/web/src/lib/pauseStall62R6.test.ts`: 17 case

- §A key instance (3): `scopedClipId` 0/1/2 cấp; `previewClipInstanceKey`
  (không dấu / có dấu / dấu rỗng-không chuỗi); `stampPreviewInstanceKey`
  (rỗng → đúng object cũ; có path → copy mới, gốc không đổi, id giữ nguyên).
- §B recovery helper (3): rỗng/khỏe/error:3; error:4 + dedup + error
  undefined; code lạ → drop + code null, getter ném → bỏ qua không crash.
- §C attribution 2 instance (5): 2 entry key instance + chuỗi dedupe 1;
  spec phẳng đóng dấu + spec gốc không bị sửa; `visibleSkippedReasons`
  (stall A không ẩn B); `frameSkippedEffectTypes` tách theo key;
  failsoft đường chậm (nested v=5) cũng đóng dấu + attribution key instance.
- §D wiring (3): preview.tsx 3 điểm ghi key instance + (a)/(b) +
  idleDebug; nestedPreview.ts attribution + đóng dấu 2 đường;
  previewEngine.ts đối chiếu key instance.
- §E contract chuỗi (2): clip tầng ngoài 2 clip cùng type → chuỗi
  dedupe 1, attribution giữ id trần; nested 1 instance → chuỗi không đổi.

### 2.7 Test khóa cập nhật (thay đổi có kiểm soát, đúng bản chất (c))

- `skippedAttrib61R8.test.ts`: 4 kỳ vọng `clipId` lá nested → key
  instance (`"leaf"` → `"n1/leaf"`, `"l1"/"l2"` → `"n1/l1"/"n1/l2"`,
  failsoft-slow `"leaf"` → `"BAD/leaf"`); 2 needle wiring
  `tickSkippedClipIds.add(clip.id)` →
  `tickSkippedClipIds.add(previewClipInstanceKey(clip))`.
- `skippedFlat60Q6.test.ts`: 1 needle wiring tương tự.
- O3/N4/P3 KHÔNG sửa (chuỗi `skippedReasons` không đổi).

## 3. Kiểm chứng (số thật, chạy 2026-11-08)

### 3.1 Test mới — 17/17 ngay lần chạy đầu

Test viết sau khi code lib xong nên không có chu trình đỏ-trước ở
tầng unit; bằng chứng đỏ-trước nằm ở harness headed (§3.3, lượt 1
C1 FAIL do fixture của harness sai — không phải lỗi code).

### 3.2 Hồi quy + tsc + build

| Suite | Kết quả |
|---|---|
| `pauseStall62R6.test.ts` (mới) | 17/17 pass |
| `skippedAttrib61R8.test.ts` (cập nhật §2.7) | 20/20 pass |
| `skippedFlat60Q6.test.ts` (cập nhật §2.7) | 15/15 pass |
| `failsoftSurface58O3.test.ts` (khóa, không sửa) | 13/13 pass |
| `i18nRound57N4.test.ts` (khóa, không sửa) | 14/14 pass |
| `skippedReasons59P3.test.ts` (không sửa) | 16/16 pass |
| `nestedPreview.test.ts` | 46 pass |
| `nestedPreviewFailsoft26J1.test.ts` | 6 pass |

`tsc --noEmit` apps/web: lần 1 có 3 lỗi ở file R6 (2× TS5097 do
import `previewClipKey62R6.ts` nhiều dòng trong nestedPreview.ts +
import `.ts` trong file test, 1× TS6133 biến `DICT_VI` thừa trong
file test) — đã sửa (import gộp 1 dòng; test import không đuôi `.ts`;
xóa `DICT_VI`); lần 2 chạy lại: **0 lỗi ở mọi file R6 đụng**.
Lỗi duy nhất còn lại là ở file luồng song song khác:
`src/lib/bridgeErrors62R5.test.ts(15,10): TS6133 'existsSync' thừa`
— luồng R5, **không sửa hộ** (đúng mẫu đợt 61 R8 §3.2).
`vite build` apps/web: **pass, 22,62 s** (cảnh báo chunk >500 kB có sẵn).

### 3.3 Click-test headed — PASS (lượt chạy cuối)

Harness `~/scratch-round62-r6/clicktest-62r6-pause-stall.mjs`
(adapt từ harness R8: vite dev đóng băng + Chromium headed qua Xvfb
:166 + CDP, Node thuần; fixture tái dùng
`~/scratch-round61-r8/{valid,stall,stall2,garbage}.mp4`; display
:166, tag run-1440x900).
Report: `~/scratch-round62-r6/r6-report-run-1440x900.json`.
Screenshot: `~/scratch-round62-r6/r6-badge-run-1440x900.png`
(đã xem bằng mắt: cuối A1b, preview hiện color bars + chữ
"Xin chào", badge "⚠ 1 hiệu ứng không vẽ được trong preview" hiện —
đúng vì clip valid vẽ được và effect thật sự bị skip).

- **A2 (đối chứng, pause):** valid ph 1 → badge HIỆN, draw Δ = 1.
- **A1 (a, pause-stall, stall 10s ph 6, 8 s, mẫu 0,5 s):** mẫu đầu
  (0,5 s) badge HIỆN (chưa có seek thất bại — chống false-positive);
  **5/5 mẫu cuối (5,5–8 s) badge ẨN**; holdDelta 0/0/0
  (renderFrame không chạy); `seekFailureKind=timeout`, count = 6,
  `decoderErrorRecovered` = 6. So với R8 C1-pause (badge hiện 12/12):
  badge nay ẩn sau ~1 lần timeout.
- **B1 (b, scrub-back):** stall ph 6 trong 4 s → `decoderErrorRecovered`
  tăng **3 trong đúng phase stall** (tiền đề: element đã lỗi thật);
  scrub về ph 2 → **firstDrawMs = 1.629 ms** (lượt chạy đầu 1.516 ms),
  draw Δ = 1, badge HIỆN lại ở cuối. Baseline chưa fix: ~13 s chờ
  cạn cap Y2 (10 lần timeout).
- **C1 (c, 2 instance nested):** nA (stall.mp4, leaf 0..7) ph 6 →
  badge ẨN sau đúng 1 lần seek thất bại (`seekFailureCount=1`,
  kind timeout); scrub sang nB (valid.mp4) ph 10 → badge HIỆN lại +
  draw Δ = 1, `lastDrawn=10`.
- **A1b (vòng lặp còn sống):** valid lại ph 1 → badge HIỆN, draw Δ = 1.
- **Lượt chạy 1 FAIL ở C1 do FIXTURE CỦA HARNESS (không phải lỗi
  code):** leaf A lúc đầu chỉ dài 0..4 nên ph 2 nằm trọn trong vùng
  decode được của stall.mp4 (~0..4 s) → seek thành công, badge hiện
  là ĐÚNG (`lastDrawn=2`, draw Δ = 1). Đã sửa fixture: leaf A dài
  0..7, pause ở ph 6 (quá vùng dữ liệu) → lượt 2 PASS toàn bộ.
  Bài học ghi lại: vùng stall của fixture chỉ ~4 s đầu, mọi case
  stall phải đặt playhead > 4 s.

## 4. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round62-r6-pause-stall.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/previewClipKey62R6.ts` (mới)
- `apps/web/src/lib/decoderErrorRecovery62R6.ts` (mới)
- `apps/web/src/lib/nestedPreview.ts`
- `apps/web/src/lib/previewEngine.ts`
- `apps/web/src/preview.tsx`
- `apps/web/src/lib/pauseStall62R6.test.ts` (mới)
- `apps/web/src/lib/skippedAttrib61R8.test.ts`
- `apps/web/src/lib/skippedFlat60Q6.test.ts`
- `docs/PHASE9_ROUND62_R6_PAUSE_STALL_LIMITS.md` (mới)

Không có fragment i18n mới (không thêm key — xem đầu file). Harness +
report + screenshot + vite config chỉ nằm ở `~/scratch-round62-r6/`
(scratch, không stage). Fixture mp4 tái dùng của R8, không stage.
Không có binary/dist/`__pycache__` trong batch.

## 5. Nợ mở / giới hạn trung thực

1. **(b) chỉ phục hồi ở đường seek pause.** Element lỗi TRONG LÚC
   PHÁT (phát tới vùng stall rồi mới lỗi) thì nhánh playing không
   drop — phải pause/scrub (đi qua executor/`.then` của seek pause)
   mới hồi phục. Trong thực tế user thường pause/scrub sau khi thấy
   hình đứng yên nên đường này phủ hầu hết trường hợp; phục hồi
   trong `syncMedia` (đường phát) là nợ mở cho đợt sau (cần cân nhắc
   kỹ vì đó là hot path mỗi tick + tương tác với fallback proxy).
2. **Giả định về fallback proxy (chưa đo headed):** (b) drop element
   khi `error !== null` dựa trên việc lần load mới (listener của
   `MediaPool.videoFor` đổi src sang file gốc) reset `error` về null
   trước khi tick sau chạy (theo thuật toán resource-selection của
   HTML). Nếu trên thực tế Chrome giữ `error` cũ trong lúc load mới
   thì executor/`.then` có thể drop oan element đang fallback — chưa
   đo vì harness không có proxy; cần 1 case headed proxy-lỗi để
   khẳng định.
3. **Hold cache vẫn key theo leaf id + src** (`heldFrameKey(clip.id,
   clip.src)`): 2 instance cùng leaf id + cùng src nhưng khác `in`
   có thể dùng chung frame giữ sai vị trí nguồn. Ngoài phạm vi (c)
   của đợt này (chỉ attribution + tickSkipped); cần đợt riêng nếu
   muốn key hold cache theo instance.
4. **`skippedReasonsByClip` không bao gồm `skipped` (flatten):** chỉ
   attribution cho lý do effect; lý do flatten bỏ lá/nested vẫn
   spec-wide như O3 (kế thừa từ R8 §5.6, không đổi ở đợt này).
5. **Badge ẩn thoáng qua khi decode chỉ-chậm:** 1 lần timeout rồi
   hồi phục thì badge ẩn ~1 tick rồi hiện lại (xem §1.2) — đúng ngữ
   nghĩa nhưng là thay đổi hành vi nhỏ so với R8 (badge chỉ đổi khi
   tickSkipped đổi). Không đo riêng vì cần file decode chậm thật
   (không phải file hỏng) — fixture stall là hỏng hẳn.
6. **Chưa đo Safari/Firefox:** stall fixture + hành vi hold/skip đo
   trên Chromium (Playwright chromium-1248) như R8; `error` sticky +
   timeout 1200 ms là hành vi Chromium đã đo, trình duyệt khác có
   thể khác mã lỗi/thời gian.
7. **Lỗi tsc của luồng R5 còn tồn tại:** `bridgeErrors62R5.test.ts`
   TS6133 `existsSync` thừa — thuộc luồng khác, không sửa hộ; parent
   gộp cần nhắc R5 sửa hoặc xác nhận.
