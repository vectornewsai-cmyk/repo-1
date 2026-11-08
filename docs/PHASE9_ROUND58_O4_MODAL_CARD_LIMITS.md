# Phase 9 đợt 58, luồng O4 — BeatSyncModal + SceneModal dùng `modal-card`: LIMITS

Đóng nợ LIMITS đợt 57 §6.3: `BeatSyncModal.tsx` + `SceneModal.tsx` cũng
dùng class `modal-card` chưa từng được định nghĩa trong CSS (chỉ card
thiếu style, overlay `modal-backdrop` đã đúng). **Đã sửa cả 2 theo đúng
mẫu N1 (SilenceModal) + đo headed thật ở cả 2 viewport, PASS cả 4 lượt.**

## 1. Cách sửa (không sửa `styles.css`, không thêm CSS mới)

Cả 2 file: `modal-card` → `modal` (class đã định nghĩa: flex column,
`max-height: calc(100vh - 60px)`, `overflow: hidden`), giữ nguyên
`modal-backdrop` cho overlay. Nội dung cuộn vào `.modal-body`
(`overflow-y: auto`), nút hành động dời ra `.modal-actions` làm con
trực tiếp của `.modal` (footer luôn thấy, không cuộn theo nội dung).

- **BeatSyncModal.tsx** (4 chỗ `modal-card` → 2 card `.modal`):
  early-return noClip (body + footer Đóng) + main (config/running/review).
  Config: `field-row` nút Phân tích/Huỷ → `.modal-actions`; `field-row`
  còn lại duy nhất là hàng nhập BPM. Review: danh sách điểm cắt
  (maxHeight 240, cuộn riêng — giữ nguyên) vào body, nút Áp dụng/Huỷ
  ra footer. Running không có nút (huỷ bằng unmount) nên không có
  footer ở bước đó — giữ nguyên hành vi.
- **SceneModal.tsx** (2 chỗ `modal-card` → `modal` + `modal scene-modal`):
  giữ modifier `scene-modal` đã định nghĩa (min-width 420px, max-width
  520px — đo headed ra đúng 520px). Cả 3 hàng nút `.row` (class **chưa
  định nghĩa** — xem §5) → `.modal-actions` ở config/running/review;
  `.scene-cut-list` (max-height 280px, cuộn riêng — giữ nguyên) vào body.
- Không đổi key i18n / literal: BeatSync đúng 26 key / 29 call site,
  Scene đúng 29 key / 32 call site (test khóa bằng set-equality).

## 2. Đo headed SAU sửa (cùng mẫu harness N1, 4 lượt, bước config)

Harness riêng đợt này (scratch, không stage): vite dev đóng băng (tắt HMR +
watcher) + Chromium headed qua Xvfb display :184 + CDP Node thuần. Mở
modal thật qua nút Inspector sau khi import media mẫu qua store thật +
`addMediaAtPlayhead` + select clip. Đo hình học ở lần vẽ đầu, **không
scroll, không click trong modal**. `window.onerror` /
unhandledrejection trong cả 4 lượt: **0 lỗi**.

| Đo sau sửa (bước config) | BeatSync 1440×900 | BeatSync 1280×720 | Scene 1440×900 | Scene 1280×720 |
|---|---|---|---|---|
| Viewport thực | 1439×699 | 1280×520 | 1439×699 | 1280×520 |
| Modal | 640×270, top 214 → bottom 485, **căn giữa** | 640×270, top 125 → bottom 395, **căn giữa** | 520×250, top 225 → bottom 475, **căn giữa** | 520×250, top 135 → bottom 385, **căn giữa** |
| Nút chính bottom | "Phân tích beat" 468 (< 699) | "Phân tích beat" 378 (< 520) | "Quét chuyển cảnh" 458 (< 699) | "Quét chuyển cảnh" 368 (< 520) |
| Nút Huỷ bottom | 468 (< 699) | 378 (< 520) | 458 (< 699) | 368 (< 520) |
| `actionsInsideBody` | false | false | false | false |
| Card style (computed) | flex, max-height 639px (= 699−60), overflow hidden | như trái, max-height 460px (= 520−60) | flex, max-height 639px | như trái |
| Overlay style (computed) | fixed, flex, full 1439×699 | fixed, flex, full 1280×520 | fixed, flex, full 1439×699 | fixed, flex, full 1280×520 |
| Verdict | **PASS** | **PASS** | **PASS** | **PASS** |

Bằng chứng (scratch, không stage):
`~/scratch-round58-o4/o4-report-beatsync-1440x900.json`,
`o4-report-beatsync-1280x720.json`, `o4-report-scene-1440x900.json`,
`o4-report-scene-1280x720.json` + screenshot `o4-config-<tag>.png`
tương ứng. Harness:
`~/scratch-round58-o4/clicktest-58o4-modal-card.mjs`
(+ `vite.58o4.config.mjs` đóng băng, tái dùng pattern CDP của N1).
Lưu ý khi chạy harness: display :161 đang bị luồng O2 đợt 58 chiếm nên
luồng này dùng :184; cổng dev 5380–5389 / debug 9480–9489 (tránh đụng
O2 dùng 9490).

## 3. Test mới — `apps/web/src/lib/modalCard58O4.test.ts`: PASS 24/24

Chạy: esbuild bundle `--format=cjs` (theo nhiệm vụ) rồi node —
`./node_modules/.bin/esbuild apps/web/src/lib/modalCard58O4.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/round58-o4/modalCard58O4.test.cjs &&
node /tmp/round58-o4/modalCard58O4.test.cjs` → `PASS (24/24)`.

**Phương pháp ghi rõ:** test TĨNH trên source (không render React — repo
không có jsdom trong devDeps, component kéo cả store/i18n nên không bundle
độc lập). Khóa 3 bất biến: (a) dùng class đã định nghĩa + hợp đồng CSS
(`.modal` flex column + `max-height: calc(100vh - 60px)`,
`.modal-backdrop` fixed + căn giữa, `.modal-body` `overflow-y: auto`,
`.scene-modal` min 420 / max 520); (b) footer `.modal-actions` là con
trực tiếp của `.modal`, ngoài `.modal-body`, kề sau body của chính bước
đó, mỗi footer còn đúng nút của bước đó; (c) i18n giữ nguyên (BeatSync
26 key / 29 call site, Scene 29 key / 32 call site). Thêm sweep: không
component nào trong `apps/web/src/components/` còn dùng `modal-card` /
`modal-overlay` trong JSX.

Hai bug của chính test/harness đã gặp và sửa trong lúc làm (ghi để luồng
sau khỏi vấp lại):
- Helper quét span div của N1 không xử lý div tự đóng: SceneModal bước
  running có `<div className="spinner" />` trong `.modal-body` làm span
  body nuốt luôn footer kề sau → test báo sai "actions nằm trong body".
  Đã sửa helper: bỏ qua thẻ mở tự đóng (`/>`) khi đếm độ sâu.
- Cùng helper không khớp dialog bằng `role="dialog"` vì regex quét thẻ
  `<div ...>` bị cắt ở dấu `>` đầu tiên của `onClick={(e) => ...}`.
  Đã khớp bằng `className="modal"` / `className="modal scene-modal"`
  (đứng đầu thẻ, trước onClick).

## 4. Kiểm chứng khác

- `tsc --noEmit` (apps/web): **0 lỗi** (test mới đã thêm vào
  `tsconfig.json` exclude — 144 → 145 entry, theo đúng quy ước repo).
- `vite build` (apps/web): **pass, 19.99s** (cảnh báo chunk > 500 kB
  có sẵn).
- Hồi quy N1: `silenceModal57N1.test.ts` chạy lại **11/11**.

## 5. Quét nợ còn lại — class modal chưa định nghĩa (trung thực)

Sau sửa, **không còn** `modal-card` / `modal-overlay` trong JSX ở bất cứ
đâu trong `apps/web/src` (chỉ còn trong comment đầu file của 3 modal đã
sửa, giải thích phép sửa). Nhưng quét toàn bộ class `modal*` dùng trong
JSX đối chiếu CSS cho thấy vẫn còn class chưa định nghĩa — **ngoài phạm
vi luồng này, không sửa, liệt kê để luồng sau xử lý**:

| Class chưa định nghĩa | Dùng ở | Ảnh hưởng |
|---|---|---|
| `caption-modal` (modifier) | `CaptionModal.tsx` (`className="modal caption-modal"`) | Không có rule nào — modifier vô tác dụng, layout vẫn nhờ `.modal` gốc. Cùng họ lỗi latent như `modal-card` nhưng vô hại hơn vì base đã đủ. |
| `modal-x` | `SilenceModal.tsx` (nút ✕ đóng) | Nút ✕ không có style riêng — hiển thị mặc định. |
| `modal-label` | `SilenceModal.tsx` (3 label) | Label không có style riêng — hiển thị mặc định. |
| `modal-hint` | `SilenceModal.tsx` (3 đoạn) | Gợi ý không có style riêng — hiển thị mặc định. |
| `modal-err` | `SilenceModal.tsx` (3 chỗ báo lỗi) | Lỗi không đỏ — chỉ có rule scoped `.modal-body .error`, còn `modal-err` thì không có rule nào. |
| `row` | **đã hết** — SceneModal dùng `className="row"` cho 3 hàng nút, đã thay bằng `.modal-actions` trong đợt này | Đã đóng cùng đợt (tác dụng phụ của phép sửa). |

Các class `modal*` còn lại đều đã định nghĩa: `modal`,
`modal-backdrop`, `modal-actions`, `modal-body`, `modal-head`,
`modal-ok`, `template-modal` (+ `.wide`).

## 6. Chưa đo / nợ mở (trung thực)

1. **Không đo headed TRƯỚC sửa cho 2 modal này** (không stash code giữa
   lúc các luồng đợt 58 khác đang sửa song song). Lỗi gốc được chứng minh
   bằng sự kiện tĩnh: class `modal-card` không tồn tại trong bất cứ file
   CSS nào (test khóa), cùng nguyên nhân và cùng hệ quả đã đo trước sửa
   ở SilenceModal đợt 57 N1 (card 1439×391, top 394 → bottom 785, nút
   dưới fold). Không claim số đo trước sửa riêng cho 2 modal này.
2. **Bước review + running chưa đo headed** (cùng cấu trúc footer mới,
   cùng class `.modal` — suy ra từ cùng phép sửa, chưa có số đo riêng).
   Review của BeatSync có danh sách điểm cắt cuộn riêng 240px, của Scene
   có `.scene-cut-list` cuộn riêng 280px — lập luận cấu trúc là footer
   không bị đẩy xuống dưới, chưa khóa bằng số đo.
3. **Chưa đo ở locale EN** (đo ở vi mặc định).
4. **Chưa đo viewport mobile** (mobile.css đã có `.modal` riêng
   `max-height: calc(100dvh - 48px)` + backdrop `align-items: flex-end`
   — chưa kiểm chứng headed).
5. **BeatSyncModal: `<p className="error">` ở top-level** (con trực tiếp
   của `.modal`, ngoài mọi `.modal-body`, chung cho cả 3 bước) vẫn không
   có style — không có rule `.error` toàn cục, chỉ có scoped
   `.modal-body .error`. Giữ nguyên theo nhiệm vụ "không đổi hành vi
   khác"; lỗi vẫn hiển thị (kiểu đoạn văn mặc định), chỉ không đỏ.
   Ngược lại, `<p className="error">` / `.muted` của SceneModal nay nằm
   trong `.modal-body` nên được hưởng rule scoped (đỏ / mờ) — cải thiện
   phụ, không đổi logic.
6. **Lượt đo Scene headed chọn clip video mẫu có sẵn** (track v1, clip
   4s) chứ không phải clip MP4 vừa import (track v11_*): app mount sẵn
   có clip mẫu trên timeline; harness chọn clip video đầu tiên. File
   MP4 mẫu (ffmpeg testsrc 640×360 3s, 23.029 byte) đã import thành công
   vào media (`o4-scene.mp4`, duration 3). Hình học bước config không
   phụ thuộc clip nào — ghi rõ để khỏi hiểu lầm.
7. **`tsconfig.json` là file chung**: luồng này chỉ thêm 1 dòng exclude
   (`src/lib/modalCard58O4.test.ts`); nếu luồng đợt 58 khác cũng sửa
   file này thì parent gộp batch cần kiểm tra trùng/dư dòng.

## 7. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round58-o4-modal-card.txt` —
5 file text:

- `apps/web/src/components/BeatSyncModal.tsx`
- `apps/web/src/components/SceneModal.tsx`
- `apps/web/src/lib/modalCard58O4.test.ts` (mới)
- `apps/web/tsconfig.json` (thêm 1 dòng exclude)
- `docs/PHASE9_ROUND58_O4_MODAL_CARD_LIMITS.md` (mới — file này)

Không có binary. Harness + report JSON + screenshot chỉ nằm ở
`~/scratch-round58-o4/`, không stage. Không ghi build-loop-log (parent làm).
