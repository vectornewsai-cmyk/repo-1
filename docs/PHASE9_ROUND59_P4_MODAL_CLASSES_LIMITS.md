# Phase 9 đợt 59, luồng P4 — Đóng nợ class modal chưa định nghĩa: LIMITS

Đóng nợ LIMITS đợt 58 O4 §5–§6.5: còn class CSS chưa định nghĩa —
`caption-modal` (CaptionModal), `modal-x` / `modal-label` / `modal-hint` /
`modal-err` (SilenceModal), và `<p className="error">` top-level của
BeatSyncModal (con trực tiếp của `.modal`, ngoài mọi `.modal-body`, chỉ có
rule scoped `.modal-body .error` nên không đỏ). **Đã sửa cả 3 file theo
đúng mẫu O4/N1: chỉ dùng class ĐÃ định nghĩa sẵn, KHÔNG thêm CSS mới,
KHÔNG đổi key i18n / literal. Đo headed thật 6/6 PASS + 1 lượt kiểm tra
lỗi thật headed (lỗi BeatSync đỏ #ff7b7b, trong body, trong viewport).**

## 1. Cách sửa (không sửa `styles.css` / `mobile.css`, không thêm CSS mới)

| Vị trí cũ | Sửa thành | Vì sao tương đương |
|---|---|---|
| CaptionModal `className="modal caption-modal"` | `className="modal"` | `caption-modal` không có rule nào — modifier vô tác dụng, layout vẫn nhờ `.modal` gốc (flex column, max-height calc(100vh − 60px)). Bỏ modifier, không đổi hình học. |
| SilenceModal nút ✕ `modal-x` | `icon-btn` | Đã định nghĩa: 30×30, border-radius 50%, nền trong suốt — đúng mẫu nút ✕ trong `.modal-head` của CaptionModal. |
| SilenceModal 3 label `modal-label` | `field` | Đã định nghĩa: `display: block`, padding 6px 12px — đúng class label form của repo (CaptionModal / BeatSyncModal / Inspector dùng). |
| SilenceModal 3 hint `modal-hint` | `muted` | Rule scoped `.modal-body .muted` (color var(--muted)); cả 3 lần dùng đều trong `.modal-body` (test khóa bằng span). |
| SilenceModal 3 lỗi `modal-err` | `error` | Rule scoped `.modal-body .error` (color #ff7b7b); cả 3 lần dùng đều trong `.modal-body` (test khóa bằng span). |
| BeatSyncModal `<p className="error">` top-level (chung cho 3 bước, con trực tiếp của `.modal`) | Dời vào đầu mỗi `.modal-body` của 3 bước config / running / review (là con đầu của body) | Không có class sẵn nào tương đương ở top-level mà không đổi diện mạo (`.valid-banner.bad` là banner nền đỏ, khác hẳn); dời vào body thì hưởng đúng rule `.modal-body .error` đã có. Đặt làm con đầu body để giữ vị trí hiển thị gần như cũ (ngay dưới header). Nhánh early-return noClip không có error nên không đụng. |

Không đổi logic, không đổi key i18n: Caption 49 key / 55 call site,
Silence 25 key / 28 call site, BeatSync 26 key / 29 call site (khớp O4).
Không có chuỗi mới cần dịch → **không tạo fragment JSON** (không sửa
`vi.json` / `en.json`). Không sửa file test snapshot nào.

## 2. Đo headed SAU sửa (cùng mẫu harness O4, 6 lượt, bước config)

Harness riêng đợt này (scratch, không stage): vite dev đóng băng (tắt HMR +
watcher) + Chromium headed qua Xvfb display :195 + CDP Node thuần. Mở
modal thật qua nút TopBar ("💬 Phụ đề", "🔇 Cắt lặng") hoặc Inspector
("Phân tích beat & cắt clip") sau khi import WAV mẫu qua store thật +
`addMediaAtPlayhead` (+ select clip cho BeatSync). Đo hình học ở lần vẽ
đầu, **không scroll, không click trong modal**. `window.onerror` /
unhandledrejection trong cả 6 lượt: **0 lỗi**.

| Đo sau sửa (bước config) | Caption 1440×900 | Caption 1280×720 | Silence 1440×900 | Silence 1280×720 | BeatSync 1440×900 | BeatSync 1280×720 |
|---|---|---|---|---|---|---|
| Viewport thực | 1439×699 | 1280×520 | 1439×699 | 1280×520 | 1439×699 | 1280×520 |
| Modal | 640×639, top 30 → bottom 669, **căn giữa** | 640×460, top 30 → bottom 490, **căn giữa** | 640×407, top 146 → bottom 553, **căn giữa** | 640×407, top 56 → bottom 464, **căn giữa** | 640×270, top 214 → bottom 485, **căn giữa** | 640×270, top 125 → bottom 395, **căn giữa** |
| Nút chính bottom | "🎙 Bắt đầu tạo phụ đề" 652 (< 699) | 473 (< 520) | "🔍 Phân tích khoảng lặng" 536 (< 699) | 447 (< 520) | "Phân tích beat" 468 (< 699) | 378 (< 520) |
| Nút phụ bottom | "Đóng" 652 | 473 | "Huỷ" 536 | 447 | "Huỷ" 468 | 378 |
| `actionsInsideBody` | false | false | false | false | false | false |
| Card style (computed) | flex, max-height 639px (= 699−60), overflow hidden | như trái, max-height 460px (= 520−60) | flex, max-height 639px | như trái | flex, max-height 639px | như trái |
| Verdict | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |

Ghi chú hình học:
- Caption 1440×900: modal cao 639px = đúng trần `100vh − 60px`, body cuộn
  nội bộ, footer vẫn thấy (nút bottom 652 < 699). Nội dung config dài
  nên modal chạm trần — đúng thiết kế `.modal`, không phải lỗi.
- BeatSync giữ nguyên hình học O4 (640×270, top 214 / 125) — đúng kỳ vọng
  vì bước config không có lỗi nên việc dời `<p className="error">` không
  đổi layout khi `error === null`.

Đo thêm computed style của các phần tử đã đổi class (headed thật):
- Silence ✕: 30×30, border-radius 50% (`.icon-btn`) — cả 2 viewport.
- Silence label đầu tiên: display block, padding 6px 12px (`.field`) —
  cả 2 viewport.
- Silence hint: color rgb(139, 148, 169) = màu muted (`.modal-body
  .muted`) — cả 2 viewport.
- Caption hint: color rgb(139, 148, 169) (muted) — 1440×900.
- Caption ✕: 30×30, border-radius 50% (`.icon-btn`) — 1440×900.

### Kiểm tra lỗi thật headed (BeatSync, 1440×900, lượt riêng)

Sau đo config, bấm nút "Phân tích beat" **trong dialog** (bridge không
chạy trong harness → fetch fail): lỗi hiện ra ở bước config với text
`Failed to fetch`, **màu rgb(255, 123, 123) = #ff7b7b** (đúng rule
`.modal-body .error`), rect top 248 → bottom 264 (con đầu của body, ngay
dưới header), `errInBody: true`, `errInViewport: true`, 0 window error.
Screenshot `p4-error-beatsync-1440x900.png` cho thấy chữ lỗi đỏ thật.
Đây là bằng chứng động cho chính phần sửa của BeatSync (trước sửa, cùng
lỗi này hiển thị bằng màu mặc định vì không có rule nào khớp).

Bằng chứng (scratch, không stage):
`~/scratch-round59-p4/p4-report-{caption,silence,beatsync}-{1440x900,1280x720}.json`
+ screenshot `p4-config-<tag>.png` tương ứng + `p4-error-beatsync-1440x900.png`.
Harness: `~/scratch-round59-p4/clicktest-59p4-modal-classes.mjs`
(+ `vite.59p4.config.mjs` đóng băng, tái dùng pattern CDP của O4).
Lưu ý khi chạy harness: display :162/:169 đang bị luồng round-59 khác
chiếm nên luồng này dùng :195; cổng dev 5390–5399 / debug 9500–9509.

## 3. Test mới — `apps/web/src/lib/modalClasses59P4.test.ts`: PASS 33/33

Chạy: esbuild bundle `--format=cjs` (theo nhiệm vụ) rồi node —
`./node_modules/.bin/esbuild apps/web/src/lib/modalClasses59P4.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/round59-p4/modalClasses59P4.test.cjs &&
node /tmp/round59-p4/modalClasses59P4.test.cjs` → `PASS (33/33)`.

**Đỏ-trước/xanh-sau:** chạy test trước khi sửa → FAIL ngay check đầu
("còn dùng caption-modal chưa định nghĩa"); sau sửa → 33/33.
**Phương pháp ghi rõ:** test TĨNH trên source (không render React — repo
không có jsdom trong devDeps, component kéo cả store/i18n nên không bundle
độc lập). Khóa 3 bất biến: (a) 3 modal trong phạm vi chỉ dùng class ĐÃ
định nghĩa (tập token class trích từ selector của mọi file `.css` dưới
`apps/web/src`: styles.css + mobile.css + components/*/*.css); class
scoped (`.modal-body .muted/.error/.warn`, `.silence-list .mono/.dim`)
chỉ tính là "đã định nghĩa" khi lần dùng nằm trong đúng tổ tiên (span
lồng nhau, helper `divSpans` của O4); (b) footer `.modal-actions` vẫn là
con trực tiếp của `.modal`, ngoài `.modal-body`; (c) i18n giữ nguyên
(Caption 49/55, Silence 25/28, BeatSync 26/29).
Hai chi tiết test đã vấp và sửa trong lúc làm (ghi để luồng sau khỏi vấp
lại):
- Regex khóa i18n phải có `\b` (`/\bt\("/`): không có `\b` thì
  `exportProject("srt")` / `createElement("a")` trong CaptionModal bị
  bắt nhầm thành key `srt` / `vtt` / `a`.
- Helper quét span của O4 chỉ theo `<div>` — `.silence-list` là `<ul>`
  nên script quét ngữ cảnh repo-wide phải dùng stack parser cho mọi thẻ
  (xem §5); test khóa 3 file phạm vi vẫn dùng `divSpans` vì
  `.modal-body` luôn là `<div>`.

## 4. Kiểm chứng khác

- `tsc --noEmit` (apps/web): **0 lỗi ở mọi file luồng này đụng**
  (CaptionModal / SilenceModal / BeatSyncModal / modalClasses59P4.test.ts
  — test mới đã thêm vào `tsconfig.json` exclude, 147 → 148 entry).
  Repo-wide lúc đo KHÔNG 0 lỗi: còn lỗi ở 2 file test của luồng round-59
  khác đang chạy song song (`src/lib/binPersist59P1.test.ts` 19 lỗi,
  `src/lib/gopTrialDecode59P6.test.ts` 3 lỗi; tập lỗi đổi giữa 2 lần chạy
  liên tiếp vì các luồng khác đang sửa file — không phải file của luồng
  này, không sửa giùm). Ghi rõ để khỏi hiểu lầm là "tsc xanh toàn repo".
- `vite build` (apps/web): **pass, 10.05s** (cảnh báo chunk > 500 kB có sẵn).
- Hồi quy: `modalCard58O4.test.ts` **24/24**, `silenceModal57N1.test.ts`
  **11/11**.

## 5. Quét nợ còn lại — class chưa định nghĩa toàn repo (trung thực)

Sau sửa, **5 class đã sửa không còn xuất hiện trong bất cứ `.tsx` nào**
(trừ file test, nơi chúng chỉ nằm trong chuỗi assert — test khóa bằng
sweep repo-wide). Nhưng quét toàn bộ class JSX đối chiếu CSS cho thấy vẫn
còn class chưa định nghĩa — **ngoài phạm vi luồng này, không sửa, liệt kê
để luồng sau xử lý**. Phương pháp: token class sau dấu `.` trong phần
selector của mọi `.css` dưới `apps/web/src` (345 token) đối chiếu mọi
chuỗi trong `className="..."` và literal trong `className={...}` của mọi
`.tsx` (trừ `*.test.ts`, 334 token). Script quét:
`~/scratch-round59-p4/sweep.py` (+ `context-check.py` cho class scoped).

### 5.1 Class chưa định nghĩa ở đâu cả — còn 30 class thật (ngoài phạm vi)

(`.all` trong danh sách thô của script là dương tính giả — xem §5.3.)

| Class chưa định nghĩa | Dùng ở | Ghi chú |
|---|---|---|
| `curve-add-btn`, `curve-bezier-input`, `curve-disable-btn`, `curve-enable-btn`, `curve-kf`, `curve-kf-easing`, `curve-kf-label`, `curve-kf-remove`, `curve-kf-t`, `curve-kf-v`, `curve-preset`, `speed-curve` (12) | `components/speed/SpeedPanel.tsx` | Cả cụm speed-curve editor không có rule nào trong `speed.css` (file chỉ có 2 lần nhắc "curve" — kiểm tra bằng grep). Lớn nhất trong nợ còn lại. |
| `preview-curve-warn-badge`, `preview-decodeahead-toggle`, `preview-decodeahead-warn-badge`, `preview-hold-badge`, `preview-lut-badge`, `preview-motion-badge`, `preview-proxy-badge`, `preview-reverse-badge`, `preview-reverse-engine-badge` (9) | `preview.tsx` | Các badge trạng thái của preview không có style riêng. |
| `tl-marker-editor-title`, `tl-markers`, `tl-nested` (3) | `Timeline.tsx` | |
| `history-panel` (1) | `components/project/HistoryPanel.tsx` | Có inline style `border/padding/margin` nên vẫn hiển thị được — class chỉ là hook chưa có rule. |
| `media-proxy` (1) | `MediaBin.tsx` | |
| `reframe-section` (1) | `ExportPanel.tsx` | |
| `track-panel` (1) | `components/sticker/TrackPanel.tsx` | |
| `tts-box`, `tts-msg` (2) | `components/TtsButton.tsx` | `tts-box` đi kèm `field` đã định nghĩa (`className="field tts-box"`) nên chỉ nửa sau thiếu. |

### 5.2 Class scoped-only dùng NGOÀI tổ tiên (có rule nhưng không khớp)

Đã kiểm chứng ngữ cảnh bằng stack parser cho 6 class (`.modal-body`
cho error/muted/warn/small; `.silence-list` / `.scene-cut-list` cho
mono/dim). Ngoài phạm vi luồng này:

| Class | Ngoài scope (chưa có style) | Trong scope (đã có style) |
|---|---|---|
| `.error` (chỉ `.modal-body .error`) | `TemplatePicker.tsx:155`, `TrackPanel.tsx:116` — 2 `<p className="error">` hiển thị màu mặc định, không đỏ | 10 (Caption 1, Scene 2, BeatSync 3, Silence 3, TemplatePackModal 1) |
| `.muted` (chỉ `.modal-body .muted`) | 8: `TtsButton`, `TemplatePicker` ×3, `SpeedPanel`, `StickerPanel` ×2, `TourCard` | 32 |
| `.warn` (chỉ `.modal-body .warn`) | 7: `SpeedPanel` ×3, `ChromaPanel`, `EffectPanel`, `StickerPanel`, `TourCard` | 1 |
| `.small` (chỉ `.modal-body .muted.small`) | 1: `TtsButton` (cùng phần tử với `.muted` ngoài scope) | 11 |
| `.dim` (chỉ `.silence-list .dim`) | 1: `KeyframePanel` (`<div className="kf-live-row dim">`) | 1 (SilenceModal) |
| `.mono` | 0 ngoài scope | 2 (SceneModal, SilenceModal) |

Các class scoped-only còn lại (`.active`, `.selected`, `.on`, `.play`,
`.primary`, `.sm`, `.chip`, `.bezier-field`, `.bezier-row`,
`.curve-bezier`, `.confirm-box`, `.mask-check`, `.sel`, `.has`,
`.is-active`, `.is-hidden`, `.is-locked`, `.is-selected`, `.left`,
`.right`, `.lut-none`, `.dirty`, `.dropped`, `.bad`, `.ok`,
`.tbtn-label`, `.template-*`, `.sticker-*`, `.wide`, `.has`, … — 41
class) chỉ liệt kê tên + file dùng trong `sweep-baseline.json`; **ngữ
cảnh của chúng CHƯA được kiểm chứng** — luồng sau cần kiểm tra trước khi
kết luận là lỗi hay đúng (đa số là modifier đi kèm class cha đã định
nghĩa, vd `.tbtn.play`, `.tl-clip.selected`, nên có thể vẫn khớp rule).

### 5.3 Dương tính giả của script quét (ghi để khỏi sửa nhầm)

- `.all`: chỉ là literal so sánh `cat === "all"` trong
  `className={cat === "all" ? "chip active" : "chip"}` (TemplatePicker /
  StickerPanel), không phải class.
- `"error"` trong `ExportPanel.tsx`: literal so sánh trạng thái
  `shareStatus === "error"` trong `className={... ? "valid-banner bad" :
  "tips"}`, không phải class.
- `className={biến}` (không literal) ở 20 file không quét tĩnh được —
  danh sách file xem trong `sweep-baseline.json`; các class truyền qua
  biến có thể còn sót ngoài danh sách §5.1.

## 6. Phát hiện thêm trong lúc đo headed (ngoài phạm vi, KHÔNG sửa)

**CaptionModal: nút text dùng class `.tbtn` (nút tròn icon 36×36) nên
chữ tràn/kẹp.** Bằng chứng headed thật (screenshot
`p4-config-caption-1440x900.png` + rect đo được): footer "Đóng" và
"🎙 Bắt đầu tạo phụ đề" đều có rect 36×36, chữ tràn ra ngoài và chồng
lên nhau ("Bắt đầu tạo ph…" đè lên "Đóng"); 2 nút "SRT project" /
"VTT project" trong body cũng bị tương tự. Nguyên nhân: `.tbtn` được
định nghĩa là nút icon tròn (`width/height 36px`, `border-radius: 50%`,
`padding: 0`), nhưng CaptionModal dùng nó cho nút text ở footer
(`className="tbtn"` / `"tbtn primary"`), bước running (`"tbtn"`) và nút
xuất SRT/VTT. Đây là **lỗi có sẵn từ trước, không do đợt này gây ra**
(luồng này không đụng các nút đó), và **không sửa trong luồng này** vì
ngoài phạm vi nhiệm vụ (chỉ đổi 5 class chưa định nghĩa + lỗi BeatSync).
Đề xuất luồng sau: đổi các nút text đó sang `<button>` trần +
`className="primary"` như footer của SilenceModal / BeatSyncModal (đã
đo headed là hiển thị đúng: xem screenshot Silence/BeatSync).
Lưu ý: verdict PASS của 6 lượt headed chỉ khóa **hình học modal**
(modal căn giữa, footer thấy ở lần vẽ đầu, actions ngoài body) — không
khóa việc chữ trong nút `.tbtn` có kẹp hay không.

## 7. Chưa đo / nợ mở (trung thực)

1. **Bước review + running chưa đo headed** (cùng cấu trúc `.modal` +
   footer mới, cùng class đã định nghĩa — suy ra từ cùng phép sửa, chưa
   có số đo riêng). Ngoại lệ duy nhất: lỗi thật ở bước config của
   BeatSync đã đo headed (§2, đỏ #ff7b7b). Review của CaptionModal có
   `.caption-list` cuộn riêng, review của SilenceModal có
   `.silence-list` cuộn riêng — lập luận cấu trúc là footer không bị
   đẩy xuống dưới, chưa khóa bằng số đo.
2. **Chưa đo ở locale EN** (đo ở vi mặc định).
3. **Chưa đo viewport mobile** (mobile.css đã có `.modal` riêng
   `max-height: calc(100dvh - 48px)` + backdrop `align-items: flex-end`
   — chưa kiểm chứng headed).
4. **Kiểm tra lỗi thật headed chỉ làm 1 lượt** (BeatSync 1440×900);
   không lặp ở 1280×720 (cùng code path + cùng rule CSS, chỉ khác
   viewport — nhưng chưa có số đo riêng).
5. **Harness vấp 1 bug trong lúc chạy, đã sửa:** lượt kiểm tra lỗi đầu
   tiên dùng `clickByText("Phân tích beat")` toàn-document nên bấm nhầm
   nút Inspector "Phân tích beat & cắt clip" nằm sau backdrop → modal
   đóng (kết quả `no-dialog`, không phải lỗi sản phẩm). Đã sửa harness:
   bấm nút **trong** `[role="dialog"]` rồi chạy lại → lỗi hiện đúng
   (§2). Luồng sau dùng harness này lưu ý: luôn scope click vào dialog
   khi text nút trùng với nút ngoài modal.
6. **`tsconfig.json` là file chung**: luồng này chỉ thêm 1 dòng exclude
   (`src/lib/modalClasses59P4.test.ts`, 147 → 148 entry); các luồng đợt
   59 khác cũng đang thêm dòng của họ — parent gộp batch cần kiểm tra
   trùng/dư dòng. Tương tự, `tsc` repo-wide còn lỗi ở file test của
   luồng P1/P6 đang chạy song song (§4) — không phải nợ của luồng này.
7. **Các file khác đang bị luồng round-59 khác sửa song song**
   (vd `TemplatePicker.tsx` đổi vị trí dòng giữa 2 lần quét) — danh sách
   nợ §5 chụp tại thời điểm quét sau sửa (07/11 ~21:55 +07); luồng sau
   quét lại trước khi sửa.

## 8. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round59-p4-modal-classes.txt` —
6 file text:

- `apps/web/src/components/CaptionModal.tsx`
- `apps/web/src/components/SilenceModal.tsx`
- `apps/web/src/components/BeatSyncModal.tsx`
- `apps/web/src/lib/modalClasses59P4.test.ts` (mới)
- `apps/web/tsconfig.json` (thêm 1 dòng exclude)
- `docs/PHASE9_ROUND59_P4_MODAL_CLASSES_LIMITS.md` (mới — file này)

Không có binary. Không sửa `styles.css` / `mobile.css`, không sửa
`vi.json` / `en.json`, không tạo fragment i18n (không có chuỗi mới).
Harness + report JSON + screenshot chỉ nằm ở `~/scratch-round59-p4/`,
không stage. Không ghi build-loop-log (parent làm).
