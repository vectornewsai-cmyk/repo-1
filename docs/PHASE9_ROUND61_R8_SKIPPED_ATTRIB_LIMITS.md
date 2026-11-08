# Phase 9 đợt 61 — R8: `skippedReasons` attribution theo clip + clip thiếu media vào `tickSkippedClipIds` + đo stall decoder thật (LIMITS)

Ngày: 2026-11-08. Luồng R8, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Đóng nợ đợt 60 §5.8 (= LIMITS đợt 60 Q6 §5.1 + §5.2 + §5.5):
(a) badge spec-wide hiện lý do cả khi playhead ngoài clip;
(b) clip thiếu media (`!item`) không vào `tickSkippedClipIds`;
(c) chưa đo stall decoder thật.
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG sửa vi.json/en.json
(không cần key mới — badge/toast dùng lại key cũ, xem §2.5).

## 0. Kết quả ngắn

- (a) Lib nay trả thêm `skippedReasonsByClip` (clipId + type + reason +
  cửa sổ trong timeline spec preview đã phẳng) trên cả 2 result
  (`detailed` + `failsoft`, cả đường nhanh, đường chậm và early-return).
  Badge chỉ hiện lý do của clip đang ở frame hiện tại VÀ đã vẽ được
  (cửa sổ chứa playhead + clip không nằm trong `tickSkippedClipIds`).
  **Contract O3/N4 KHÔNG phá vỡ mà MỞ RỘNG kiểu cộng thêm:**
  `skippedReasons: string[]` giữ nguyên nội dung + ngữ nghĩa nên test
  khóa O3 13/13 và N4 14/14 chạy lại NGUYÊN VẸN không sửa (xem §1.1).
- (b) `drawVideoClip` nhánh `!item` và guard `drawImageClip` nay ghi
  `tickSkippedClipIds.add(clip.id)` — ĐẢO quyết định Q6 §5.2
  ("placeholder tính là đã vẽ"): thiếu media = không vẽ được.
- (c) Stall decoder thật ĐÃ ĐO headed (không còn NOT-MEASURED): fixture
  `stall.mp4` (moov nguyên duration 10s, mdat cắt 40%) làm decoder kẹt
  thật (`error:3`, `seeking=true` kẹt, readyState 1); badge/helper phản
  ứng đúng ở chế độ PHÁT (skip → ẩn; hold → hiện), và giới hạn ở chế
  độ PAUSE được đo bằng số (xem §3.3).
- Test mới 20/20 (đỏ-trước: bundle lỗi 2 export mới → 15/20 → 19/20 →
  20/20); hồi quy O3 13/13, N4 14/14, P3 16/16, nestedPreview 46,
  Q6 15/15 (sau khi cập nhật 1 dòng wiring, xem §2.4), J1 6.
  `tsc` 0 lỗi ở file R8 (lần 1 có 2 lỗi ở file luồng khác R4/R7, lần 2
  chạy lại 0 lỗi toàn apps/web — xem §3.2); `vite build` pass 20,29 s.
  Harness headed PASS ngay lượt chạy cuối (xem §3.3).

## 1. Thiết kế đã chọn

### 1.1 (a) Attribution — mở rộng cộng thêm, không phá contract chuỗi

Quyết định: KHÔNG đổi kiểu `skippedReasons: string[]` (chuỗi spec-wide
của O3/N4) mà THÊM field song song:

```ts
export interface SkippedReasonAttribution {
  clipId: string;   // id clip lá (nested → id lá đã phẳng)
  type: string;     // type effect bị bỏ (vd "weird-xyz")
  reason: string;   // đúng chuỗi đã dịch của `skippedReasons`
  start: number;    // cửa sổ trong timeline spec preview ĐÃ PHẲNG
  duration: number;
}
// BuildPreviewSpecDetailedResult + BuildPreviewSpecFailsoftResult +=
skippedReasonsByClip: SkippedReasonAttribution[];
```

- `reason` lấy cùng chỉ số với `skippedEffects` trong
  `applyAdjustmentPreview` nên khớp từng chuỗi với `skippedReasons`
  (badge hợp nhất không đếm trùng; test khóa điều này trực tiếp).
- Cửa sổ là cửa sổ ĐOẠN sau khi cắt theo adjustment (layer chỉ phủ giữa
  clip thì chỉ đoạn phủ mới mang attribution đó — test §B khóa).
  Lá nested đã chỉnh start/duration theo vị trí ngoài (`FlatClip.clip`)
  nên cửa sổ luôn ở tọa độ timeline đã phẳng, khớp playhead của badge.
- Cùng (clipId, type) ở 2 đoạn rời nhau → 2 entry riêng (giữ chính xác
  cửa sổ); chỉ dedupe trùng hệt (cùng clipId + type + cửa sổ).
  Cùng type ở 2 clip → 2 entry trong khi `skippedReasons` dedupe còn 1
  chuỗi (đúng ngữ nghĩa: attribution theo clip, lý do theo chuỗi).
- Badge hiển thị `badgeEffectReasons` = `visibleSkippedReasons(byClip,
  playhead, tickSkippedClipIds)` + `frameReasons` (helper frame đã chỉ
  tính clip tại playhead và đã loại notDrawn). Toast + `skippedKey`
  VẪN dùng `effectReasons` spec-wide như cũ — cố ý: toast báo "project
  có N effect không vẽ được" 1 lần khi spec đổi; badge báo "frame này
  có M effect không vẽ được". Hai con số có thể khác nhau (vd playhead
  ngoài clip: toast 1, badge 0) — chấp nhận để không spam toast khi
  scrub playhead; ghi rõ ở comment code + §5.
- Không sửa test khóa O3/N4: chúng assert đúng contract chuỗi cũ và vẫn
  xanh nguyên — đó chính là bằng chứng mở rộng không phá vỡ.

### 1.2 (b) Thiếu media = không vẽ được

`drawVideoClip` nhánh `!item`: ghi id vào `tickSkippedClipIds` TRƯỚC
khi vẽ placeholder (placeholder vẫn vẽ như cũ, chỉ thay đổi phân loại
đối với badge). `drawImageClip` guard `!item || kind !== "image"` cũng
ghi id — cùng quyết định, vì attribution lib cũng thu lý do cho image
clip (đường flat thu mọi leaf kind). Wrapper dip gọi lại `drawVideoClip`
nên chỉ ghi 1 lần (Set cũng chống trùng). Hệ quả cố ý: kỳ vọng headed
Q6 B1 bị thay thế — clip không có media ở playhead 0 nay ẨN badge
(trước đây hiện), vì clip đó không vẽ được (xem §5.4).

### 1.3 (c) Stall decoder thật — đo ở chế độ phát, ghi nhận giới hạn pause

- Fixture xác định (chỉ giữ script gen, không binary):
  `gen-stall-fixture.py` (scratch): ffmpeg testsrc 10s 320×180 30fps
  libx264 +faststart → `valid.mp4` 43.666 byte; `stall.mp4` = 40% đầu
  (17.466 byte, moov nguyên nên ffprobe vẫn báo duration 10,0 nhưng
  mdat cắt giữa chừng); `garbage.mp4` = bytes ngẫu nhiên cùng kích thước
  (không moov). Thêm `stall2.mp4` = bản copy của `stall.mp4` (tên khác
  → MediaPool tạo element mới — cần cho bước transition, xem §3.3).
- Vùng dữ liệu còn lại của stall ≈ 4s đầu (40% của 10s): seek tới 6s
  stall xác định; seek/play trong 0..4s vẫn decode được.

## 2. Đã làm

### 2.1 lib — `apps/web/src/lib/nestedPreview.ts`

- `SkippedReasonAttribution` (mới, export) + `SkippedReasonsCollector`
  (mới, export: `{ skippedReasons, skippedByClip? }`) +
  `dedupeAttributions` (nội bộ) + `visibleSkippedReasons(attributions,
  t, notDrawnClipIds?)` (mới, export — helper lọc cho badge).
- `flatSpecSkippedAttributions` (mới, export): cùng vòng quét +
  classifier với `flatSpecSkippedReasons`; `flatSpecSkippedReasons`
  nay suy ra từ nó (`dedupeStrings(att.map(reason))`) nên 2 hàm khớp
  từng chuỗi (Q6 test "trực tiếp == failsoft" vẫn xanh).
- `splitClipByAdjustments`: collector đổi kiểu sang
  `SkippedReasonsCollector`; cả 2 nhánh (không layer áp / cắt đoạn)
  đều đẩy attribution song song với chuỗi lý do (cửa sổ đoạn).
- `BuildPreviewSpecDetailedResult` /
  `BuildPreviewSpecFailsoftResult`: thêm `skippedReasonsByClip`.
  Cả 3 đường trả về đều set field: early-return (qua
  `flatSpecSkippedAttributions`), đường nhanh (truyền của detailed),
  đường chậm (base detailed + từng nested riêng lẻ qua slowCollect).

### 2.2 UI — `apps/web/src/preview.tsx`

- Import `visibleSkippedReasons` + type `SkippedReasonAttribution`.
- Hoist `failsoftSkippedReasonsByClip` cạnh `failsoftSkippedReasons`,
  gán từ `failsoft.skippedReasonsByClip` trong try.
- Khối badge: `badgeEffectReasons = [...visibleSkippedReasons(...),
  ...frameReasons]`; badge text/title đếm `badgeEffectReasons`; toast
  + `skippedKey` vẫn dùng `effectReasons` spec-wide (xem §1.1).
- `drawVideoClip` nhánh `!item`: `tickSkippedClipIds.add(clip.id)` +
  comment; comment cũ ở điểm `!srcEl` ("KHÔNG vào đây") đã đính chính.
- `drawImageClip` guard: thêm `tickSkippedClipIds.add(clip.id)`.
- KHÔNG đụng logic enhance của R3 (import `enhancePreview` +
  `enhanceCanvas` còn nguyên — kiểm bằng grep sau khi sửa).

### 2.3 Test mới — `apps/web/src/lib/skippedAttrib61R8.test.ts`: 20 case

- §A attribution spec phẳng (7): đúng clipId/type/reason/cửa sổ +
  identity spec; VI không lookup/lokup vi; 2 clip cùng type → 2 entry,
  chuỗi dedupe 1; 1 clip 2 type giữ thứ tự; effect chuẩn → []; clip
  phẳng không effect → [] (khóa O3 §B'); `flatSpecSkippedAttributions`
  trực tiếp == detailed + reasons == `flatSpecSkippedReasons`; thiếu
  id/duration 0 → không attribution, không crash.
- §B attribution qua flatten (5): lá nested + layer; lá nested không
  layer; layer mang effect lạ chỉ phủ giữa clip → attribution chỉ cửa
  sổ đoạn (1, 1); 2 lá cùng type → 2 entry; đường chậm failsoft (nested
  v=5 → 1×) vẫn có attribution (cửa sổ lá đã phẳng 0..4 — host nested
  0..4 kẹp lá 0..6).
- §C helper `visibleSkippedReasons` (4): nửa mở `[start, start+duration)`;
  notDrawn loại clip; cùng reason 2 clip, 1 tụt → vẫn hiện; rỗng/
  undefined → [].
- §D wiring (4): badge dùng `skippedReasonsByClip` +
  `visibleSkippedReasons`, toast giữ key spec-wide; `!item` video ghi
  tickSkipped; guard image ghi tickSkipped; lib trả attribution ở cả
  early-return/đường nhanh/đường chậm.
- 2 lỗi test trong lúc làm (đều là lỗi TEST, không phải lỗi sản phẩm):
  (1) fixture MID_LAYER đặt `effects` top-level cùng `filters` —
  `convertCanonicalLayer` chỉ đọc `effects` trong từng entry `filters`
  (hoặc legacy top-level khi KHÔNG có `filters`) nên layer bị bỏ qua
  đúng schema; đã sửa fixture đặt effects trong filters entry.
  (2) kỳ vọng slow-path duration 6 — thực tế lá 0..6 bị host 0..4 kẹp
  còn 0..4; đã sửa kỳ vọng + comment.

### 2.4 Test khóa cập nhật (1 dòng wiring, có kiểm soát)

`apps/web/src/lib/skippedFlat60Q6.test.ts` — CHỈ 1 assert wiring đổi:
dòng early-return kỳ vọng nay thêm `, skippedReasonsByClip:
flatSpecSkippedAttributions(spec, lookup)` (early-return + identity
spec + `skipped []` GIỮ NGUYÊN, chỉ bổ sung field). O3/N4/P3 KHÔNG sửa.

### 2.5 i18n — không cần key mới, không fragment

Badge/toast dùng lại key `preview.effectSkippedBadge` /
`preview.effectSkippedToast` (chỉ đổi số đếm truyền vào). `vi.json` /
`en.json` KHÔNG sửa; không có file
`round61-r8-fragment.json` (không có key mới để ghi).

## 3. Kiểm chứng (số thật, chạy 2026-11-08)

### 3.1 Đỏ-trước — test mới viết trước khi code

Bundle esbuild lỗi 2 export mới chưa tồn tại
(`flatSpecSkippedAttributions`, `visibleSkippedReasons`) → sau khi
xong lib: 15/20 (2 lỗi lib là lỗi test, xem §2.3 + 3 wiring preview.tsx
chưa làm); sau khi xong preview.tsx: 19/20 (needle wiring image cũ);
sửa test: **20/20**.

### 3.2 Hồi quy + tsc + build

| Suite | Kết quả |
|---|---|
| `skippedAttrib61R8.test.ts` (mới) | 20/20 pass |
| `failsoftSurface58O3.test.ts` (khóa, không sửa) | 13/13 pass |
| `i18nRound57N4.test.ts` (khóa, không sửa) | 14/14 pass |
| `skippedReasons59P3.test.ts` (không sửa) | 16/16 pass |
| `skippedFlat60Q6.test.ts` (1 dòng wiring cập nhật, §2.4) | 15/15 pass |
| `nestedPreview.test.ts` | 46 pass |
| `nestedPreviewFailsoft26J1.test.ts` | 6 pass |

`tsc --noEmit` apps/web: lần 1 có 2 lỗi ở file luồng song song khác
(`cssClasses61R4.test.ts` TS6133 biến `rel` thừa — luồng R4;
`gopTrialDecode61R7.test.ts` TS5097 import `.ts` — luồng R7), **0 lỗi
ở mọi file R8 đụng**; lần 2 chạy lại để grep riêng file R8: **0 lỗi
toàn apps/web** (R4/R7 đã tự sửa giữa 2 lần chạy — đúng mẫu đợt 60).
Không sửa hộ file luồng khác.
`vite build` apps/web: **pass, 20,29 s** (cảnh báo chunk >500 kB có sẵn).

### 3.3 Click-test headed — PASS

Harness `~/scratch-round61-r8/clicktest-61r8-skipped-attrib.mjs`
(adapt từ harness Q6: vite dev đóng băng + Chromium headed qua Xvfb
:165 + CDP, Node thuần; display :165, tag run-1440x900; fixture phục
vụ qua node server CORS :8899 — python http.server bị chặn CORS nên
đã đổi sang `fixture-server.mjs`).
Report: `~/scratch-round61-r8/r8-report-run-1440x900.json`.
Screenshot: `~/scratch-round61-r8/r8-badge-run-1440x900.png`
(đã xem bằng mắt: cuối C2-play, preview chỉ còn chữ "Xin chào", không
badge effect — đúng vì clip garbage bị ẩn lý do).

- **P0 (decoder thật, element độc lập):** valid seek 6.00 →
  `seeked@6.00`, readyState 4, currentTime chạy tới 10, error null;
  stall seek 6.00 → `error:3` (MEDIA_ERR_DECODE), `seeking=true` KẸT
  ở 6.00 suốt 5,5 s mẫu, readyState 1, videoWidth 320 (đã decode được
  frame đầu); garbage → `error:4`, readyState 0, duration null.
- **A1/A1b/A1c/A1d (a, đối chứng):** clip valid trong clip, pause →
  badge `⚠ 1 hiệu ứng không vẽ được trong preview` hiện + title chứa
  `type "weird-xyz" chưa biết`, holdDelta draw:1/skip:0 mỗi lần.
- **A2 (a, ngoài cửa sổ):** cùng clip valid, playhead 5 (ngoài 0..2)
  → badge ẨN. Đổi so với Q6 B0 (badge spec-wide cũ vẫn hiện ở đây).
- **B1 (b, thiếu media):** clip src `no-such.mp4` (không có media item),
  playhead 1 → badge ẨN, holdDelta 0/0/0 (không cần seek — draw chạy
  ngay tới nhánh placeholder).
- **C1b-play (c, chuyển trạng thái, element MỚI stall2.mp4):** phát từ
  ph 2 → draw 61, hold 413, skip 4; badge HIỆN 15/16 mẫu trong cửa sổ
  (chỉ ẩn ở ph=10, ngoài cửa sổ). Kết luận đúng: decoder stall nhưng
  frame giữ vẫn được vẽ qua đúng pipeline nên effect thật sự bị skip —
  badge HIỆN là đúng (thiết kế hold của Q6). Kỳ vọng ban đầu của luồng
  ("stall → badge ẩn") SAI ở trường hợp này; gate đã sửa theo hành vi
  đúng sau khi thấy số đo (xem §5.3).
- **C1-play (c, skip thật):** element stall.mp4 đã error từ bước pause
  (chưa từng có frame) → phát từ ph 5: draw 0, hold 0, **skip 297**;
  badge ẨN 9/16 mẫu trong cửa sổ (ph 5,5..9,5; các mẫu ph=10 ngoài
  cửa sổ không tính). Đây là phản ứng đúng khi decoder stall mà không
  có frame nào để giữ/hiện.
- **C2-play (c, garbage):** phát từ ph 1: draw 0, hold 0, **skip 483**;
  badge ẨN 16/16 mẫu trong cửa sổ.
- **C1-pause (c, GIỚI HẠN pause-seek — đo bằng số, không ép pass):**
  stall, ph 6, pause 12 s: badge HIỆN 12/12 mẫu, holdDelta 0/0/0,
  idleDebug `pendingSeek=true`, `lastRequested=6`,
  `seekFailureCount=9`, `seekFailureKind="timeout"`,
  `seekFailureExhausted=false`. Nguyên nhân: seek kẹt → timeout 1200ms
  → retry (fix bug B đợt 31 N1: timeout KHÔNG được vẽ) → `renderFrame`
  không chạy → `tickSkippedClipIds` không ghi được clip stall → badge
  vẫn hiện lý do. Đây là giới hạn kiến trúc có sẵn, không phải lỗi của
  đợt này (xem §5.1).
- Chống false-positive: mọi case "badge ẩn" đều đi ngay sau 1 bước
  badge đang HIỆN ở cùng playhead (visible→hidden mới tính); case
  stall còn yêu cầu skip Δ > 0.

## 4. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round61-r8-skipped-attrib.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/nestedPreview.ts`
- `apps/web/src/preview.tsx`
- `apps/web/src/lib/skippedAttrib61R8.test.ts`
- `apps/web/src/lib/skippedFlat60Q6.test.ts`
- `docs/PHASE9_ROUND61_R8_SKIPPED_ATTRIB_LIMITS.md`

Không có fragment i18n mới (không thêm key — xem §2.5). Harness +
report + screenshot + fixture + script gen chỉ nằm ở
`~/scratch-round61-r8/` (scratch, không stage). Không có binary/dist/
`__pycache__` trong batch.

## 5. Nợ mở / giới hạn trung thực

1. **Pause-seek stall: badge vẫn hiện lý do khi decoder stall ở chế độ
   pause.** Đo bằng số ở §3.3 (C1-pause). Muốn sửa phải đụng vòng lặp
   pause-seek (vd ghi clip vào `tickSkippedClipIds` khi seek timeout
   cạn cap, hoặc cho badge đọc `seekFailureKind`) — ngoài phạm vi luồng
   này vì chạm fix bug B đợt 31 N1 (timeout không được vẽ để khỏi đen
   canvas + ngủ vĩnh viễn). Cần quyết của parent + đợt riêng.
2. **Toast spec-wide vs badge theo frame:** toast effect vẫn đếm
   spec-wide (`effectReasons`), badge đếm theo frame
   (`badgeEffectReasons`) — 2 con số có thể khác nhau (vd playhead
   ngoài clip: toast "1 hiệu ứng", badge ẩn). Đây là quyết định cố ý
   (§1.1) để không spam toast khi scrub; nếu muốn đồng nhất thì phải
   đổi cơ chế toast (vd chỉ toast khi tập theo frame đổi — sẽ spam).
3. **Lỗi decoder là sticky (Chromium):** element đã `error:3` thì seek/
   play lại không hồi phục kể cả khi playhead về vùng decode được
   (đo được: lần chạy harness đầu, element stall đã error ở bước pause
   rồi skip Δ=263 + badge ẩn cả vùng ph 2,5–4,1). Khôi phục chỉ qua
   drop element + tạo mới (cơ chế `seekFailureExhausted` đã có từ đợt
   43 Y2 — cap chưa cạn ở lần đo này: count 9, exhausted=false).
4. **Kỳ vọng headed Q6 B1 bị thay thế (cố ý):** clip không media ở
   playhead trong clip nay ẨN badge (trước đây hiện). Ai chạy lại
   harness Q6 cũ trên cây này sẽ thấy B1 khác — đó là hành vi mới của
   (b), không phải hồi quy.
5. **Trùng clipId giữa 2 instance nested:** attribution + tickSkipped
   đều key theo id — 2 instance cùng id lá thì 1 instance stall sẽ ẩn
   lý do của cả 2 (cùng giới hạn id-based đã có từ Q6, không mở rộng).
6. **`skippedReasonsByClip` không bao gồm `skipped` (flatten):** chỉ
   attribution cho lý do effect; lý do flatten bỏ lá/nested (`skipped`)
   vẫn spec-wide như O3 (badge nested không lọc theo frame — ngoài
   phạm vi).
7. **Cửa sổ attribution của đoạn bị cắt theo adjustment là cửa sổ đoạn,
   không phải cả clip:** layer phủ 2 vùng rời cùng type → 2 entry rời;
   badge hiện lý do khi playhead trong 1 trong 2 vùng (đúng), nhưng
   không gộp thành 1 vùng liên tục (không cần gộp — lọc theo entry).
8. **Chưa đo Safari/Firefox:** stall fixture + hành vi hold/skip đo
   trên Chromium (Playwright chromium-1248) — readyState/error code có
   thể khác trình duyệt khác; `decideVideoFrame` + Seeker timeout là
   logic chung nên kỳ vọng cùng hướng, chưa đo.
