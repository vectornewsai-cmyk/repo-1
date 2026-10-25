# R6 Phase 9 — i18n sub-panel + mở rộng click-test — GIỚI HẠN & KẾT QUẢ

> Trạng thái: code XONG, kiểm chứng xong, **CHƯA PUSH** (theo lệnh vòng lặp
> Phase 9: chỉ để trên đĩa, gom batch sau). Không sửa `Inspector.tsx`.
> Không sửa file của agent khác. Không đụng `server/`, `packages/`, `mcp-server/`.

## 1. i18n sub-panel — đã làm

17 file chuyển toàn bộ chuỗi UI sang hệ i18n sẵn có (`t(key, vars?)`,
fallback vi, `localStorage` key `vcut-lang`):

- `components/transitions/TransitionPanel.tsx`
- `components/speed/SpeedPanel.tsx`
- `components/keyframes/KeyframePanel.tsx`, `components/keyframes/KeyframeGraph.tsx`
- `components/chroma/ChromaPanel.tsx`
- `components/BgRemovePanel.tsx`
- `components/textfx/TextAnimPicker.tsx`
- `components/lut/LutPicker.tsx`, `components/lut/ColorAdjustPanel.tsx`
- `components/effects/EffectPanel.tsx`
- `components/sticker/StickerPanel.tsx` (cả sub-component `StickerEditor`)
- `components/audiofx/AudioFxPanel.tsx`
- `components/mask/MaskPanel.tsx`
- `components/FontPicker.tsx`
- `components/SceneModal.tsx`, `components/TtsButton.tsx`
- `lib/drop.ts` (lý do từ chối thả clip)
- `i18n/vi.json`, `i18n/en.json`: **+372 key** (tổng 528 key mỗi file, parity
  tuyệt đối). Kiểm chứng bằng `apps/web/scripts/r6-i18n-check.cjs`:
  **0 thiếu ở vi, 0 thiếu ở en, 0 key thừa** (trong phạm vi R6; key động
  `transition.opt.*`/`textanim.opt.*` được expand qua catalog 68 type /
  18 animation, không match literal).

Quy ước import thống nhất (tránh bug shadow như Q2 gặp ở Timeline):
`import { t as i18nT, useLang } from "../../i18n";` + gọi trần `useLang();`
trong component (không gán `const t = ...` vì callback `.map((t) => ...)`
trong các panel sẽ shadow).

### Thay đổi export cần biết (breaking nội bộ, đã verify không còn consumer)

- `TransitionPanel`: `TRANSITION_OPTIONS` trước đây là `{ type, label, desc }`,
  nay chỉ còn `{ type }`; label/desc lấy qua key
  `transition.opt.<type>.label/.desc` lúc render. Consumer duy nhất trước đây
  là `components/transitions/index.ts` (re-export) — đã kiểm tra bằng grep
  toàn `apps/web/src`, không còn nơi nào đọc `.label/.desc` của nó.
- `TextAnimPicker`: hằng local `TEXT_ANIMATION_META` đã XÓA, thay bằng key
  `textanim.opt.<anim>.label/.desc` (18 animation).
- `FontPicker`: `CAT_LABEL` → `CAT_LABEL_KEY` map sang key `font.cat*`.
- `KeyframePanel`: đoạn tips mất bold markup (chuỗi thuần, ghép từ
  `keyframe.tipsA/tipsB/tipsC` + `keyframe.xyOpacity`/`keyframe.xy`) — đơn giản
  hóa hiển thị, không đổi nội dung.
- `MaskPanel`: câu tip unsupported giữ nguyên cả "(chỉ video và ảnh)" trong
  key `mask.tipUnsupported`; component chỉ nối thêm đường dẫn
  `server/render/src/MASK_LIMITS.md`.
- `SpeedPanel`: badge ngược giữ ký tự "◀" trong key (`speed.reverseBadge`).
- `drop.ts`: trước đây là module thuần (comment cũ nói "không phụ thuộc
  React"); nay import `i18n/index` — chấp nhận được vì `i18n/index.ts` đọc
  `localStorage` trong try/catch (chạy được dưới node khi react resolve được)
  và `Timeline` dùng `check.reason` trực tiếp trong toast nên ngôn ngữ theo
  đúng thời điểm gọi. Comment đầu file đã cập nhật.

### Cố tình CHƯA dịch (dữ liệu catalog, không phải chuỗi UI của panel)

Các catalog này thuộc `packages/video-spec` — hợp đồng chung với
render/MCP/CLI, dịch ở UI sẽ làm lệch contract nên giữ nguyên tiếng Việt
khi ở chế độ en (đã xác nhận bằng mắt trên trang thật sau toggle en:
mục "Manual color adjust" vẫn hiện "Độ sáng/Tương phản/Bão hòa", mục
"Effects" vẫn hiện "Làm mờ/Sắc nét/Đen trắng"):

- `EFFECT_META`, `PROP_META` (EffectPanel chỉ dịch chrome: tips + sáng/tối/gốc)
- `EASING_LABEL`, `LUT_META` (LutPicker chỉ dịch chrome; label/desc LUT giữ nguyên)
- `COLOR_PARAMS` (ColorAdjustPanel)
- `CHROMA_PRESETS` labels, `STICKER_CATEGORIES`/`STICKER_LIBRARY` labels,
  `validate*` error strings, bridge phase messages, tên/giới tính giọng TTS
  từ bridge API, label LUT của user.
- Việc dịch các catalog này (nếu muốn) cần tách lớp hiển thị khỏi video-spec,
  là việc riêng, không làm trong R6.

## 2. Click-test mở rộng — kết quả (chạy thật qua CDP, không claim chay)

Harness: `apps/web/scripts/r6-clicktest.cjs` (Node thuần, WebSocket có sẵn,
không cần Playwright; cần vite dev đang chạy + `R6_DEV_URL`, mặc định
`http://localhost:5173/`). Chrome headless từ ms-playwright cache, profile
mới nên editor tải project mẫu (3 clip: 2 video + 1 text). Lần chạy cuối:
**11/12 PASS**. Bảng chi tiết:

| Test | Kết quả | Số đo |
|---|---|---|
| T0 load sample | PASS | 3 clip: video 240px, video 240px, text 300px |
| T0b welcome modal | PASS | Modal tự mở ở profile mới, đóng được bằng click backdrop |
| T-i18n vi→en | PASS | SpeedPanel hiện "⏩ Speed" + "Playback speed", hết "⏩ Tốc độ" |
| T-i18n en→vi | PASS | Về lại "⏩ Tốc độ" |
| **T1 trim mép phải** | **FAIL — BUG THẬT (xem §3)** | Kéo -60px nhiều bước → 240px → **12px** (kỳ vọng ~180px) |
| T2 split (S) | PASS | Clip 3 → 4; 2 đoạn video trên track v1 tổng 252px (gốc 240px, lệch do snap frame) |
| T3 delete (Del) | PASS | Clip 4 → 3 |
| T4 box-select | PASS | Kéo vùng trống qua 2 clip → 2 clip được chọn |
| T5a undo sau kéo | PASS | x 512 → 632 → undo về 512 |
| T5b redo sau kéo | PASS | redo lại 632 |
| T6a mobile không tràn ngang | PASS | 390px: scrollWidth = clientWidth = 390 |
| T6b mobile FAB hiện | PASS | 2 FAB 48×48, `matchMedia(mobile)=true` |

Lưu ý về harness (để lần chạy sau không hiểu lầm là bug app):

- `/json/list` trả cả target `browser_ui` (chrome://webui-toolbar) — phải chọn
  target `type === "page"`, nếu không `Page.navigate` bị `ERR_ABORTED` và
  trang trắng (lỗi harness lúc đầu, đã sửa).
- `innerText` TÔN TRỌNG `text-transform: uppercase` của CSS: panel-head và
  label hiện thành "⏩ SPEED"/"PLAYBACK SPEED" nên assert phải so sánh
  không phân biệt hoa/thường (đã sửa trong harness).
- Nút ngôn ngữ ở viewport 1440px nằm trong vùng cuộn ngang của `.topbar`
  (xem §4) — harness cuộn topbar tới cuối trước khi bấm, đúng như user phải làm.
- Vite dev của agent R5 trên cổng 5173 chết giữa phiên (không rõ ai kill);
  R6 tự chạy vite riêng trên **5179** (`R6_DEV_URL=http://127.0.0.1:5179/`).
  Harness không tự chạy vite — phải có server đang chạy trước.
- T6b từng FAIL 1 lần (run 4: `fabbar=false` dù `matchMedia=true`,
  `innerW=390`); chạy lại có chờ settle 10s thì PASS, và repro độc lập
  cũng PASS ngay từ giây thứ 2. Ghi nhận là **flake chưa tái hiện ổn định**,
  không kết luận là bug app. Nếu tái hiện: nghi ngờ race giữa
  `Emulation.setDeviceMetricsOverride` + `Page.reload` và lần render đầu
  của `useIsMobile`.

## 3. BUG TÌM ĐƯỢC — trim mép clip áp delta nhiều lần (KHÔNG SỬA trong R6)

**Hiện tượng (đo thật, đối chứng):** kéo mép phải clip 240px sang trái 60px
(60px/s = 1s):

- Kéo 1 bước nhảy duy nhất: 240px → **180px (đúng)**.
- Kéo 12 bước nhỏ (như tay user thật): 240px → **12px (sai)** — bằng đúng
  độ dài tối thiểu 0.2s.

**Nguyên nhân gốc (đọc code, không đoán):**

- `Timeline.tsx` `onMove` tính `dxSec = (clientX - drag.startClientX) / pps`
  — delta TUYỆT ĐỐI tính từ điểm bắt đầu kéo — rồi gọi
  `st.trimClip(trackId, clipId, edge, dxSec)` mỗi lần pointermove.
- `store.ts` `trimClip` áp delta lên giá trị HIỆN TẠI:
  mép phải `newDur = clip.duration + deltaSec`, mép trái
  `newStart = clip.start + deltaSec`.
- `lib/commands.ts` `execute` với `mergeKey` chỉ gộp ENTRY UNDO, không
  rebase spec về trạng thái trước group — nên N lần move cộng dồn N delta
  tuyệt đối (≈ tổng cấp số cộng, vượt xa delta thật) rồi kẹp về min 0.2s.
- Mép trái có cùng mẫu lỗi (`clip.start + deltaSec`).
- Kéo di chuyển clip (move) KHÔNG bị lỗi này vì `moveClipsBy`
  (`lib/multiselect.ts`) tính `raw = m.origStart + dxSec` từ gốc đã snapshot
  — đó cũng là lý do Q2 chỉ test kéo body thì pass, còn trim chưa từng
  được click-test trước R6.

**Vì sao không sửa:** `Timeline.tsx`/`store.ts` nằm ngoài phạm vi file của
R6 (chỉ sub-panel + i18n json + script click-test) và là file nóng nhiều
agent cùng sờ trong đợt Phase 9 — sửa lén dễ xung đột batch. Ghi issue rõ
để parent route cho agent phù hợp.

**Hướng sửa đề xuất (chưa áp dụng):** trong `Timeline.tsx`, thêm
`lastDxSec` vào `dragRef` của trim; mỗi lần move chỉ truyền delta tăng thêm
`(dxSec - lastDxSec)` cho `trimClip` rồi cập nhật `lastDxSec` — giữ nguyên
contract `deltaSec` của `trimClip`, đúng cho cả 2 mép. Hoặc snapshot
`origStart`/`origDuration` trong `beginEdgeDrag` và tính patch từ gốc
(kiểu `moveClipsBy`).

## 4. Vấn đề UX ghi nhận (không sửa, ngoài phạm vi)

- **TopBar tràn ở 1440px:** nội dung topbar hiện ~2600px (Q2 đo 2384px, từ
  đó đã thêm nút onboarding "👋 Bắt đầu" v.v.). Fix `overflow-x: auto` của
  Q2 vẫn còn (`styles.css` `.topbar`) nên nút không mất hẳn, nhưng nút ngôn
  ngữ nằm ở x≈2515 (trước toggle) và x≈1457 (sau khi toggle sang en vì
  nhãn tiếng Anh dài hơn) — user phải tự phát hiện và cuộn ngang topbar
  mới bấm được. Harness đã làm đúng thao tác đó và PASS cả 2 chiều.
  Nếu muốn nút ngôn ngữ luôn bấm được ngay: cần đưa nút lên đầu topbar
  hoặc cho topbar wrap — việc của agent sở hữu TopBar, không làm trong R6.
- **Welcome modal tự mở ở profile mới:** che toàn màn hình; đóng bằng click
  backdrop (đã dùng trong test). Không phải bug — chỉ ghi để test sau biết.
- **T5 lần đầu FAIL do test sai, không phải bug app:** kéo clip vào clip
  bên cạnh bị `overlapsOthers` chặn đúng (đứng yên x=158). Đã sửa test:
  kéo clip phải nhất sang vùng trống → PASS cả undo/redo.

## 5. Kiểm chứng khác

- `npx tsc --noEmit` (apps/web): **0 lỗi** ở lần kiểm cuối. Giữa phiên từng
  có 4 lỗi ở file của agent khác (`EnhancePanel.tsx`: truy cập `.mode` /
  `.strength` trên union có `false`; `preview.tsx`: biến thừa
  `drawKaraokeWords`/`hasKaraoke`) — không phải file R6, không sửa, và ở
  lần kiểm cuối đã hết (agent đó tự sửa).
- `npx vite build`: **pass** (13.89s) sau toàn bộ sửa source R6.
- Key lạ `inspector.secEnhance`: do agent song song khác thêm vào cả 2
  JSON trong lúc R6 chạy (tổng key 526 → 527 rồi 528 sau khi R6 thêm
  `bgremove.bridgeHttp`). R6 giữ nguyên key đó khi ghi JSON; parity
  vi/en vẫn tuyệt đối, check vẫn PASS. Không phải key R6, không nhận
  công cũng không xóa.
- `Inspector.tsx`: **không sửa** (đúng lệnh).
- **KHÔNG PUSH.** Toàn bộ file dưới đây chỉ nằm trên đĩa, chờ gom batch.

## 6. File đã đổi (để gom batch — KHÔNG push)

i18n + sub-panel (19 file):

- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`
- `apps/web/src/components/transitions/TransitionPanel.tsx`
- `apps/web/src/components/speed/SpeedPanel.tsx`
- `apps/web/src/components/keyframes/KeyframePanel.tsx`
- `apps/web/src/components/keyframes/KeyframeGraph.tsx`
- `apps/web/src/components/chroma/ChromaPanel.tsx`
- `apps/web/src/components/BgRemovePanel.tsx`
- `apps/web/src/components/textfx/TextAnimPicker.tsx`
- `apps/web/src/components/lut/LutPicker.tsx`
- `apps/web/src/components/lut/ColorAdjustPanel.tsx`
- `apps/web/src/components/effects/EffectPanel.tsx`
- `apps/web/src/components/sticker/StickerPanel.tsx`
- `apps/web/src/components/audiofx/AudioFxPanel.tsx`
- `apps/web/src/components/mask/MaskPanel.tsx`
- `apps/web/src/components/FontPicker.tsx`
- `apps/web/src/components/SceneModal.tsx`
- `apps/web/src/components/TtsButton.tsx`
- `apps/web/src/lib/drop.ts`

Click-test + docs R6 (3 file):

- `apps/web/scripts/r6-i18n-check.cjs` (mới)
- `apps/web/scripts/r6-clicktest.cjs` (mới)
- `apps/web/src/lib/R6_LIMITS.md` (file này)

## Parent fix sau R6 (24/10, kazumi — đã kiểm chứng)

Bug trim §3 đã được sửa trong `apps/web/src/Timeline.tsx` (không sửa
`store.ts`/`trimClip`): `DragState` trim snapshot thêm `origStart` +
`origDuration` lúc bắt đầu kéo; mỗi lần pointermove tính delta từ đích
tuyệt đối (orig + dxSec) trừ giá trị hiện tại rồi mới gọi `trimClip`.
Cách này giữ nguyên contract của `trimClip` và snap theo frame vẫn tích
lũy đúng (khác với phương án delta tăng thêm từng move, vốn có thể làm
mất bước nhỏ do snap từng lần). Kiểm chứng: chạy lại
`scripts/r6-clicktest.cjs` → **12/12 pass**, gồm T1 trim 240px → 180px
đúng kỳ vọng.
