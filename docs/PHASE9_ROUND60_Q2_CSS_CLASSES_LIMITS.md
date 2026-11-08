# Phase 9 đợt 60, luồng Q2 — Dọn 30 class CSS chưa định nghĩa: LIMITS

Đóng nợ LIMITS đợt 59 P4 §5.1–§5.2: còn 30 class CSS chưa định nghĩa + 5 class
scoped-only dùng ngoài tổ tiên. **Quét lại trên đĩa trước khi sửa (08/11):
đủ 30 class thật + 1 dương tính giả `.all` (không đổi so với P4) — danh sách
dưới đây chụp từ lần quét đó, không tin mù số cũ.** Sau sửa, quét toàn repo
chỉ còn `.all` (dương tính giả đã biết). Test tĩnh mới **59/59**, hồi quy P4
**33/33**, đo headed thật **10/10 section PASS** ở 1440×900 (vi), 0 window
error, `tsc` 0 lỗi ở file luồng này, `vite build` pass.

Nguyên tắc sửa (theo nhiệm vụ): với mỗi class, hoặc thêm định nghĩa CSS đúng
vào stylesheet của component đó, hoặc đổi JSX sang class đã định nghĩa tương
đương. **Giữ nguyên mọi tên class trong JSX** — các harness click-test hiện
có query chúng làm selector (`.speed-curve` / `.curve-enable-btn` /
`.curve-kf-t` / `.preview-proxy-badge` / `.preview-motion-badge` /
`.media-proxy` / `.preview-reverse-badge` / `.preview-hold-badge` trong
`apps/web/scripts/*.cjs`), đổi tên sẽ phá harness. Không sửa `CaptionModal.tsx`
(luồng Q3 sở hữu), không sửa file test của luồng khác, không sửa `vi.json` /
`en.json` (không cần key mới → **không tạo fragment JSON**), không đổi logic.

## 1. Cách sửa từng class (30 class chưa định nghĩa)

### 1.1 SpeedPanel — 12 class, thêm rule vào `components/speed/speed.css`

| Class | Rule thêm | Vì sao |
|---|---|---|
| `speed-curve` | `border-top: 1px solid var(--border-soft)` + `padding-top: 4px` | Đường kẻ phân cách section curve với phần tốc độ hằng phía trên (mẫu `.tl-toolbar` border-bottom / `.info-rows` border-bottom). |
| `curve-enable-btn`, `curve-disable-btn`, `curve-add-btn`, `curve-preset` | `white-space: nowrap` | Các nút đã có class `.toggle` (đủ style nút); hook chỉ cần khóa không ngắt dòng nhãn ("Chậm → nhanh", "Tắt đường cong") trong `flex-basis: 28%` của `.speed-presets .toggle`. |
| `curve-kf` | Card: `border 1px var(--border-soft)`, `radius 8px`, `padding 8px 10px`, `margin 8px 12px`, `background rgba(255,255,255,0.02)` | Card từng điểm keyframe; margin 12px khớp padding ngang 12px của `.btn-row` / `.field` / `.tips` trong panel. |
| `curve-kf-label` | `display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px` | Hàng nhãn điểm + nút xoá: nhãn trái, nút xoá phải (thiết kế hiển nhiên của hàng này). |
| `curve-kf-remove` | `flex: none` | Nút xoá mang class `.toggle` (`flex: 1` mặc định) — trong hàng label flex mà không khoá thì nó giãn hết hàng. Rule này là bắt buộc, không phải trang trí. |
| `curve-kf-t`, `curve-kf-v`, `curve-kf-easing` | `display: block` | Rule toàn cục `input[type="range"]` / `select` đã cho `width: 100%` — ở đây chỉ khoá mỗi control là 1 hàng riêng trong label `.field`. |
| `curve-bezier-input` | `text-align: right; font-variant-numeric: tabular-nums` | 4 ô số bezier: căn phải + số tabular cho dễ đọc khi sửa từng số. |

### 1.2 preview.tsx — 9 badge, chuyển style tĩnh từ inline sang `styles.css`

Cả 9 phần tử trước đây có **đủ style inline** (position, màu, padding, font)
nên nhìn đúng, nhưng class là hook không rule — quét báo "chưa định nghĩa"
và mọi sửa style sau này phải đụng JSX. Đã chuyển **y hệt giá trị inline cũ**
sang rule CSS (nhóm chung: `position: absolute; padding: 2px 8px;
border-radius: 4px; font-size: 12px; font-weight: 700; z-index: 5;
pointer-events: none; white-space: nowrap`, rồi từng class giữ vị trí/màu
riêng), và strip inline:

| Class | Inline còn lại sau sửa | Ghi chú |
|---|---|---|
| `preview-proxy-badge` (left 8, top 8, `rgba(255,170,0,0.9)`, `#111`) | chỉ `display: "none"` | JS bật/tắt qua ref. |
| `preview-lut-badge` (right 8, top 8, `rgba(140,90,0,0.85)`, `#fff`) | chỉ `display: "none"` | JS còn ghi đè `background` qua `el.style.background` khi có `lutBg` — inline thắng CSS mặc định khi được set, không set thì CSS mặc định hiện (hành vi giữ nguyên). |
| `preview-motion-badge` (left 50%, top 8, `translateX(-50%)`, `rgba(90,60,160,0.9)`) | chỉ `display: "none"` | |
| `preview-reverse-badge` (right 8, bottom 8, `rgba(120,40,160,0.92)`) | **bỏ hẳn prop `style`** | Render có điều kiện theo `isReversePlayback`, không cần `display: none`. |
| `preview-hold-badge` (left 50%, bottom 8, `rgba(180,120,0,0.92)`) | chỉ `display: "none"` | |
| `preview-reverse-engine-badge` (left 8, bottom 32, `rgba(40,120,180,0.92)`) | chỉ `display: "none"` | Như LUT: JS ghi đè `background` khi có `engineBg`. |
| `preview-curve-warn-badge` (left 8, bottom 8, `rgba(180,40,40,0.92)`) | chỉ `display: "none"` | |
| `preview-decodeahead-warn-badge` (left 8, bottom 32, `rgba(150,90,0,0.92)`) | chỉ `display: "none"` | |
| `preview-decodeahead-toggle` (top 10, right 50, `rgba(0,0,0,0.55)`, border `rgba(255,255,255,0.25)`) | **bỏ hẳn prop `style`** | Nút thật, luôn render; thêm `:hover` nền `rgba(0,0,0,0.8)` mirror `.preview-fs-btn:hover`. |

Không đổi `title` / `aria-*` / `role` / `data-status` / ref nào. Harness cũ đọc
`hold.style.display` và `rev.offsetParent` vẫn đúng vì `display` vẫn inline.

### 1.3 Timeline — 3 class, thêm rule vào `styles.css`

| Class | Rule thêm | Vì sao |
|---|---|---|
| `tl-marker-editor-title` | `font-weight: 600` | Tiêu đề "Sửa marker" trong `.tl-marker-editor` (sibling `.tl-marker-editor-time` đã có màu muted + tabular-nums). |
| `tl-markers`, `tl-nested` | `display: flex; gap: 6px; align-items: center` + `button { padding: 5px 10px; font-size: 12px }` | Mirror `.tl-add-track` / `.tl-ripple` cùng toolbar. |
| (kèm theo) `.tl-nested button.active` | `opacity: 1; border-color: var(--accent); color: var(--accent); background: var(--accent-dim)` (mirror `.tl-ripple button.active`) | **Sửa lỗi thật có sẵn:** nút Nested/Adjustment dùng `className="active"` nhưng trước đây không có rule nào khớp (`.active` chỉ có trong `.tl-ripple button.active`) nên bật không đổi diện mạo. Nay có. |

### 1.4 HistoryPanel / MediaBin / ExportPanel — 1 class mỗi cái

| Class | Sửa |
|---|---|
| `history-panel` | Rule mới trong `styles.css` = y hệt inline style cũ (`border: 1px solid #444; padding: 12px; margin-top: 8px`); **bỏ inline style** khỏi `HistoryPanel.tsx`. (Inline style khác trong file — `<label style={{ border ... }}>` ở dòng 164 — không liên quan, không đụng.) |
| `media-proxy` | Rule mới trong `styles.css`, cùng hình học với `.media-add` (`width: calc(100% - 12px); margin: 4px 6px 8px; padding: 4px 0; font-size: 11px`), giữ màu nút mặc định để phân biệt với nút thêm vào timeline. |
| `reframe-section` | Rule mới trong `styles.css`: `margin-top: 12px; border-top: 1px solid var(--border-soft); padding-top: 4px` — đường kẻ phân cách với nhóm normalize phía trên, không đổi layout con bên trong (panel-head / tips / preset-row giữ nguyên). |

### 1.5 TrackPanel — 1 class + 1 lỗi scoped, thêm rule vào `components/sticker/sticker.css`

- `.track-panel`: rule trống **có chủ đích** (comment giải thích: kế thừa layout
  `.inspector` như tiền lệ `.speed-panel` trong `speed.css`) — các con
  (panel-head / tips / field-row / button) đều đã có style riêng, root không
  cần thêm hình học. Import `./sticker.css` vào `TrackPanel.tsx` (file này
  trước đây không import CSS nào).
- `.track-panel .error` (mới): `color: #ff7b7b; font-size: 13px; margin: 0;
  white-space: pre-wrap` — khớp `.modal-body .error`. Lỗi validate JSON quỹ
  đạo trước đây hiện màu mặc định, nay đỏ thật (đo headed §2 S4).

### 1.6 TtsButton — 2 class + scoped `.muted`/`.small`, file CSS mới `components/TtsButton.css`

TtsButton trước đây không có file CSS riêng. File mới:

- `.field.tts-box { display: flex; flex-direction: column; gap: 8px }` —
  **chú ý specificity (xem §4):** phải viết `.field.tts-box` (0,2,0), không
  được viết `.tts-box` trần, vì `.field { display: block }` cùng specificity
  (0,1,0) sẽ thắng/thua tùy thứ tự import. Test khóa selector này (§3).
- `.tts-box .muted { color: var(--muted); font-size: 12px; line-height: 1.5 }`,
  `.tts-box .muted.small { font-size: 11px }` — hint clone giọng (khớp
  `.modal-body .muted.small` 12px, thu nhỏ thêm 1px cho hint phụ).
- `.tts-msg { font-size: 12px; line-height: 1.5; color: var(--muted);
  word-break: break-word }` — thông báo busy/lỗi/tiến trình: giữ màu trung
  tính vì lỗi đã có tiền tố ❌ trong chuỗi; cho ngắt dòng dài (tên file/URL).

## 2. Class scoped-only dùng ngoài tổ tiên — kết quả kiểm chứng ngữ cảnh

Script context-check của P4 (chỉ kiểm tra tổ tiên `.modal-body`) báo OUT cho
5 class. Kiểm chứng lại bằng tay từng ca — **đa số là dương tính giả** (rule
riêng của panel đã có), chỉ 4 ca là thiếu thật và đã sửa:

| Class | Ngoài `.modal-body` | Kết luận |
|---|---|---|
| `.error` | TemplatePicker:155, TrackPanel:116, ExportPanel (literal so sánh) | TemplatePicker nằm trong `.modal.template-modal` → rule `.template-modal .error` (styles.css:1819) đã có — **không sửa**. ExportPanel chỉ là literal `shareStatus === "error"` trong className ternary, không phải class — **không sửa** (test khóa: đúng 1 className chứa `"error"` và nó là phép so sánh). TrackPanel — **sửa**: thêm `.track-panel .error` (§1.5). |
| `.muted` | TtsButton, TemplatePicker ×3, SpeedPanel, StickerPanel ×2, TourCard | TemplatePicker ×3 trong `.template-modal` → `.template-modal .muted` đã có. SpeedPanel → `.speed-panel .muted` đã có. StickerPanel: 1 trong `.sticker-panel` (rule đã có), 1 trong `.sticker-editor` (nhánh editor trả về root riêng, ngoài `.sticker-panel`) — **sửa**: thêm `.sticker-editor .muted` mirror rule trên. TtsButton — **sửa**: `.tts-box .muted` (§1.6). TourCard — **sửa**: `.tour-body .muted` trước đây chỉ `margin: 0`, thêm `color: var(--muted)` (§2 S8). |
| `.warn` | SpeedPanel ×3, ChromaPanel, EffectPanel, StickerPanel, TourCard | SpeedPanel → `.speed-panel .warn` đã có. ChromaPanel → `.chroma-panel .warn` đã có. EffectPanel → `.effects-panel .warn` đã có. StickerPanel — **sửa**: thêm `.sticker-panel .warn` (`#f5b453`, 12px). TourCard — **sửa**: `.tour-body .warn` trước đây chỉ `margin: 0`, thêm `color: #f5b453` (khớp `.modal-body .warn`). |
| `.small` | TtsButton (cùng phần tử với `.muted`) | **Sửa**: `.tts-box .muted.small` (§1.6). |
| `.dim` | KeyframePanel (`<div className="kf-live-row dim">`) | **Không sửa — đã có style:** `.dim` là hook cho rule `.kf-live-row.dim b` (keyframes.css:188) — hàng live phụ hiện giá trị mờ. Class có tác dụng thật, chỉ là modifier, không phải thiếu định nghĩa. |

## 3. Kiểm chứng

### 3.1 Test tĩnh mới — `apps/web/src/lib/cssClasses60Q2.test.ts`: PASS 59/59

Chạy: esbuild bundle `--format=cjs` rồi node (mẫu P4) —
`./node_modules/.bin/esbuild apps/web/src/lib/cssClasses60Q2.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/round60-q2/cssClasses60Q2.test.cjs &&
node /tmp/round60-q2/cssClasses60Q2.test.cjs` → `PASS (59/59)`.

**Đỏ-trước/xanh-sau:** chạy test trước khi sửa → FAIL ngay check đầu
(`.speed-curve chưa có trong speed.css`); sau sửa → 59/59. Test khóa:
(a) 30 class §1 đều định nghĩa + nằm đúng file CSS của component;
(b) 9 badge preview: styles.css có `position: absolute` cho từng class,
preview.tsx không còn inline `position: "absolute"` / `zIndex: 5` /
`pointerEvents: "none"` nào, 7 badge ref chỉ còn `display: "none"`, 2 phần
tử render có điều kiện không còn prop `style`;
(c) các ca scoped §2 (span lồng nhau cho mọi thẻ, mẫu context-check.py P4);
(d) quét toàn repo: chưa định nghĩa chỉ còn `.all`, và `.all` chỉ là literal
`cat === "all"`;
(e) i18n không đổi ở 4 file `.tsx` đụng tới (preview 47 call/41 key,
HistoryPanel 24/24, TrackPanel 9/9, TtsButton 20/17);
(f) `.field.tts-box { display:flex }` — khóa fix cascade §4.

Hai chi tiết test đã vấp và sửa trong lúc làm (ghi để luồng sau khỏi vấp lại):
- Regex literal JS không được chứa `/` trần trong nhóm: `/<(/?).../` bị
  lexer cắt regex ngay tại `/` trong `(/?)` → "Unexpected )". Phải viết
  `<(\/?)`. (Python dùng string nên không gặp — đây là khác biệt JS/Python.)
- File test ban đầu bị nhân đôi backslash trong regex literal do transport
  ghi file (`\w` thành `\\w`); đã sửa bằng script Python dùng `chr(92)`.
  Luồng sau viết test có regex thì kiểm tra bằng `od -c` sau khi ghi.
- Assertion đầu tiên bắt nhầm `<label style={{ border ... }}>` ở
  HistoryPanel:164 (không liên quan) — đã thu hẹp assertion đúng phần tử
  `.history-panel`.

### 3.2 Đo headed thật — harness `~/scratch-round60-q2/clicktest-60q2-css-classes.mjs`: PASS 10/10 section

Mẫu harness P4 (vite dev đóng băng + Chromium headed qua Xvfb display :196 +
CDP Node thuần, cổng dev 5490/debug 9600), viewport 1440×900, locale vi.
Chạy 4 lượt (3 lượt đầu sửa harness, lượt cuối xanh hết), 0 window error
(`window.onerror` / unhandledrejection) trong cả 4 lượt.

| Section | Đo | Kết quả |
|---|---|---|
| S1 speedCurve | Bấm thật `.curve-enable-btn` → card keyframe hiện; đo computed | PASS — `.speed-curve` border-top 1px solid + padding-top 4px; `.curve-kf` border 1px, radius 8px, padding 8px 10px, margin 8px 12px; label flex space-between 12px; remove flex-grow 0; t/v/easing display block; preset nowrap; bezier (patch qua store sang easing bezier) 4 ô, text-align right, tabular-nums. |
| S2 previewBadges | Ép `display: block` từng badge (trừ toggle luôn hiện; reverse-badge bật qua `setReversePlayback(true)`), đo computed | PASS 9/9 — vị trí/màu/font/padding/radius/z-index/pointer-events khớp đúng giá trị inline cũ (proxy `#111` trên `rgba(255,170,0,0.9)`, LUT/motion/hold/reverse/reverse-engine/curve-warn/decodeahead-warn nền đúng rgba cũ, toggle top 10/right 50/nền `rgba(0,0,0,0.55)`/cursor pointer). Motion/hold `left: 50%` đo ra 435.5px = nửa chiều rộng preview-wrap (871px) + `transform` khác `none`. |
| S3 tts | Thêm text clip thật (`addTextClip`), chọn, bấm thật checkbox clone → hint hiện; bấm thật nút Đọc (bridge không chạy → lỗi thật) → msg hiện | PASS — `.tts-box` display flex, gap 8px; hint `.muted.small` màu `rgb(139,148,169)` (var(--muted)), 11px; `.tts-msg` màu muted, 12px, break-word. |
| S4 trackError | Text clip đang chọn → TrackPanel hiện; nạp file JSON lỗi thật qua input file (DataTransfer + native files setter + change event) | PASS — `<p class="error">` hiện, màu `rgb(255,123,123)` = #ff7b7b, 13px. |
| S5 timeline | Bấm thật nút Adjustment trong `.tl-nested`; thêm marker thật + bấm marker trên ruler → MarkerEditor mở | PASS — `.tl-markers`/`.tl-nested` flex gap 6px; nút Adjustment có class `active`, border/color `rgb(139,124,246)` (var(--accent)); `.tl-marker-editor-title` fontWeight 600. |
| S6 history | Bấm thật nút "🕘 Lịch sử" (ProjectMenu) | PASS — `.history-panel` border 1px solid, padding-top 12px, margin-top 8px. |
| S7 mediaProxy | Tổng hợp (xem §7.1) | PASS — font 11px, padding-top 4px, margin 4px 6px. |
| S8 tour | Mở tour thật qua nút "🧭 Xem tour 5 bước" trong WelcomeModal | PASS — `.tour-body .muted` màu `rgb(139,148,169)` thật; `.tour-body .warn` đo tổng hợp (target đều tìm thấy nên warn thật không hiện) màu `#f5b453`. |
| S9 syntheticRules | Đo tổng hợp 5 rule còn lại (reframe-section, sticker `.warn`, sticker-editor `.muted`, speed `.warn`, speed `.muted`) | PASS — reframe margin-top 12px/border-top 1px/padding-top 4px; sticker warn `#f5b453` 12px; sticker-editor muted `#8a8a94` 11px; speed warn `#fbbf24`, muted `#8b94a9`. |

Bằng chứng (scratch, không stage):
`~/scratch-round60-q2/q2-report-q2-1440x900.json` (verdict PASS, 10 section)
+ screenshot `q2-q2-1440x900.png`. Harness:
`~/scratch-round60-q2/clicktest-60q2-css-classes.mjs` (+ `vite.60q2.config.mjs`
đóng băng, tái dùng pattern CDP của P4). Lưu ý khi chạy lại harness:
display :196, cổng dev 5490–5499 / debug 9600–9609; WelcomeModal có root là
`.modal-backdrop` (không phải class `.welcome-modal` — lượt đầu check sai
nên SKIP); nút checkbox/nút Đọc/marker trên ruler phải `scrollIntoView`
trước khi bấm thật (Inspector cuộn được, click trượt nếu không scroll);
`left: 50%` đo computed ra pixel, phải so với nửa chiều rộng parent.

### 3.3 Kiểm chứng khác

- `tsc --noEmit` (apps/web): **0 lỗi ở mọi file luồng này đụng**
  (preview.tsx, SpeedPanel/TtsButton/TrackPanel/HistoryPanel,
  cssClasses60Q2.test.ts — test mới đã thêm vào `tsconfig.json` exclude).
  Repo-wide lúc đo KHÔNG 0 lỗi: còn 14 lỗi ở file test của 2 luồng round-60
  khác đang chạy song song (`src/lib/i18nOrphans60Q4.test.ts` 11 lỗi,
  `src/lib/gopTrialDecode60Q5.test.ts` 3 lỗi) — không phải file của luồng
  này, không sửa giùm.
- `vite build` (apps/web): **pass, 24.68s** (cảnh báo chunk > 500 kB có sẵn).
- Hồi quy: `modalClasses59P4.test.ts` **33/33** (chạy lại sau mọi sửa).
- Quét lại bằng `sweep.py` (P4) sau sửa: CSS 346 → **376 token** (+30 đúng
  số class đã thêm); JSX 330 token không đổi; chưa định nghĩa chỉ còn `.all`.

## 4. Bug thật bắt được trong lúc đo headed (đã sửa, không phải nợ mở)

**`.tts-box { display: flex }` thua `.field { display: block }` theo cascade.**
TtsButton root mang cả 2 class (`className="field tts-box"`). Hai rule cùng
specificity (0,1,0); `styles.css` được bundle sau `TtsButton.css` nên
`.field` thắng — lượt headed thứ 3 đo `.tts-box` computed ra `block` (test
tĩnh vẫn xanh vì nó chỉ kiểm tra rule tồn tại, không kiểm tra cascade).
Đã sửa: viết `.field.tts-box` (0,2,0) + thêm check khóa trong test tĩnh (§3.1f).
Lượt headed cuối đo lại: `display: flex`, gap 8px. **Bài học cho luồng sau:
test tĩnh "class đã định nghĩa" không bắt được xung đột cascade — với class
kép trên cùng phần tử, phải đo computed headed hoặc khóa specificity trong test.**

## 5. Dương tính giả / không sửa (ghi để khỏi sửa nhầm)

- `.all`: chỉ là literal so sánh `cat === "all"` trong
  `className={cat === "all" ? "chip active" : "chip"}` (TemplatePicker /
  StickerPanel), không phải class. Test khóa (§3.1d).
- `"error"` trong `ExportPanel.tsx`: literal so sánh trạng thái
  `shareStatus === "error"`, không phải class.
- `.dim` ở KeyframePanel: hook của `.kf-live-row.dim b` — có tác dụng thật.
- Các class scoped-only còn lại (53 tên trong `sweep-round60-q2-baseline.json`:
  `.active`, `.selected`, `.on`, `.play`, `.primary`, `.sm`, `.chip`,
  `.bezier-field`, `.bezier-row`, `.curve-bezier`, `.confirm-box`,
  `.mask-check`, `.sel`, `.has`, `.is-active`, `.is-hidden`, `.is-locked`,
  `.is-selected`, `.left`, `.right`, `.lut-none`, `.dirty`, `.dropped`,
  `.bad`, `.ok`, `.tbtn-label`, `.template-*`, `.sticker-*`, `.wide`, …) —
  **ngữ cảnh của chúng CHƯA được kiểm chứng** (trừ các ca §2); đa số là
  modifier đi kèm class cha đã định nghĩa (vd `.tbtn.play`,
  `.tl-clip.selected`) nên có thể vẫn khớp rule. Luồng sau kiểm tra ngữ cảnh
  trước khi kết luận là lỗi hay đúng. Ngoại lệ đã biết: `.tl-nested
  button.active` nay đã có rule (§1.3) nên `.active` ở Timeline đã khớp.
- `className={biến}` (không literal) ở 20 file không quét tĩnh được — danh
  sách file xem trong `sweep-baseline.json`; các class truyền qua biến có thể
  còn sót ngoài danh sách §1.

## 6. Phát hiện thêm trong lúc làm (ngoài phạm vi, KHÔNG sửa)

- Nút text CaptionModal dùng `.tbtn` tràn chữ (đã ghi ở P4 §6) — vẫn còn,
  không thuộc luồng này.
- `.curve-kf-remove` mang `.toggle` (`flex: 1`) — nếu ai bỏ rule
  `.speed-panel .curve-kf-remove { flex: none }` thì nút xoá sẽ giãn hết
  hàng label. Test tĩnh không khóa flex-grow; chỉ có đo headed S1 khóa.
  (Đã ghi chú trong `speed.css`.)

## 7. Chưa đo / nợ mở (trung thực)

1. **`.media-proxy` chưa đo trên nút thật** (S7 tổng hợp): cần 1 file video
   trong MediaBin để nút proxy thật render — harness chỉ tạo được WAV. Rule
   đã đo tổng hợp đúng giá trị.
2. **`.sticker-panel .warn` chưa kích hoạt thật headed** (chỉ đo tổng hợp):
   cần lỗi upload sticker để `err` hiện. Tương tự `.speed-panel .warn`
   (cần overlap/too-short) và `.tour-body .warn` (cần tour target thiếu —
   lượt đo target đều tìm thấy nên warn thật không hiện).
3. **`.reframe-section` chỉ đo tổng hợp** (rule khung, không có đường thao
   tác riêng).
4. **Chưa đo ở locale EN** (đo ở vi mặc định) và **chưa đo viewport
   1280×720 / mobile** (chỉ 1440×900).
5. **Chưa đo `.curve-kf` ở clip video thật** (đo trên audio clip — SpeedPanel
   chấp nhận cả audio lẫn video theo `isSpeedable`, cùng code path panel).
6. **53 class scoped-only còn lại chưa kiểm chứng ngữ cảnh** (§5).
7. **`tsconfig.json` là file chung**: luồng này chỉ thêm 1 dòng exclude
   (`src/lib/cssClasses60Q2.test.ts`); các luồng đợt 60 khác cũng đang thêm
   dòng của họ — parent gộp batch cần kiểm tra trùng/dư dòng. Tương tự,
   `tsc` repo-wide còn 14 lỗi ở file test của luồng Q4/Q5 (§3.3).
8. **Các file khác đang bị luồng round-60 khác sửa song song** — danh sách
   nợ §1 chụp tại thời điểm quét sau sửa (08/11 ~00:40 +07); luồng sau quét
   lại trước khi sửa.

## 8. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round60-q2-css-classes.txt` —
11 file text:

- `apps/web/src/components/speed/speed.css`
- `apps/web/src/styles.css`
- `apps/web/src/preview.tsx`
- `apps/web/src/components/sticker/sticker.css`
- `apps/web/src/components/sticker/TrackPanel.tsx`
- `apps/web/src/components/TtsButton.css` (mới)
- `apps/web/src/components/TtsButton.tsx`
- `apps/web/src/components/project/HistoryPanel.tsx`
- `apps/web/src/lib/cssClasses60Q2.test.ts` (mới)
- `apps/web/tsconfig.json` (thêm 1 dòng exclude)
- `docs/PHASE9_ROUND60_Q2_CSS_CLASSES_LIMITS.md` (mới — file này)

Không có binary. Không sửa `vi.json` / `en.json`, không tạo fragment i18n
(không có chuỗi mới). Harness + report JSON + screenshot chỉ nằm ở
`~/scratch-round60-q2/`, không stage.
