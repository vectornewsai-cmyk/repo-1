# Phase 9 đợt 61, luồng R4 — Đóng nợ đợt 60 §5.4 + §7.1–7.4: LIMITS

Đóng nợ Q2: **53 class scoped-only còn lại** (danh sách trong
`sweep-round60-q2-baseline.json`) + **5 rule chỉ đo tổng hợp** +
**chưa đo EN / 1280×720 / mobile**. Quét lại trên đĩa trước khi sửa
(08/11 ~03:40 +07): vẫn đủ 53 class + 1 dương tính giả `.all` (không đổi
so với Q2) — danh sách dưới đây chụp từ lần quét đó, không tin mù số cũ.
Sau sửa, quét lại: scoped-only vẫn 53 tên (không thêm/không mất), chưa
định nghĩa chỉ còn `.all` + 2 mảnh template mới thấy nhờ sweep cải tiến
(`.lane-`, `.toast-`) + 1 class của luồng khác đang chạy song song
(`.storage-cleanup`, xem §6). Test tĩnh mới **59/59** (đỏ-trước/xanh-sau),
hồi quy P4 **33/33**, Q2 **53/59 check chạy được + 5 check còn lại đã
xác minh tương đương** (check 54 kẹt vì `.storage-cleanup` của luồng R9,
xem §5), đo headed thật **R4 6/6 ở EN 1280×720 + EN 390×844** và **Q2
chạy lại 10/10 ở cả 2 viewport/locale** (lượt mobile đầu 8/10 do lỗi
harness, đã sửa harness và chạy lại xanh — xem §4.3), 0 window error
trong cả 4 lượt headed, `tsc` 0 lỗi ở file luồng này (repo-wide còn 1 lỗi
ở file test của luồng R7, xem §5), `vite build` pass.

## 1. Sửa thật duy nhất của đợt (a): `.fx-toggle.on` là class chết

Trong 53 class, **52 class đã khớp tổ tiên thật** (bảng §2), chỉ **1 ca
thiếu thật**: nút effect trong `EffectPanel.tsx` mang
`className={`fx-toggle${active ? " on" : ""}`}` nhưng không có rule nào
khớp `.fx-toggle.on` — chỉ có `.fx-item.on` (đổi viền/nền của item cha)
và `.fx-item.on .fx-check` (đổi màu dấu check). Nút tự thân không đổi
diện mạo khi bật: class `on` trên nút là class chết.

**Sửa** (`components/effects/effects.css`, mirror rule hover có sẵn
`.fx-toggle:hover .fx-name { color: #fff }`):

```css
.fx-toggle.on .fx-name {
  color: #fff;
}
```

Đo headed thật (§3 B6, cả 2 viewport): tên effect chưa bật
`rgb(207, 207, 224)` (#cfcfe0) → sau khi bấm thật nút toggle:
`rgb(255, 255, 255)` (#fff); kèm `.fx-item.on` viền `#4a5cff` và
`.fx-item.on .fx-check` `#4a5cff`. Không đổi JSX, không đổi logic
toggle, không thêm key i18n.

## 2. Kiểm chứng ngữ cảnh 53 class — kết quả

Phương pháp: port `verify61.py` (scratch) sang test tĩnh TS, đối chiếu
từng lần dùng trong JSX với **MỌI** selector định nghĩa class đó (không
chỉ 1 ví dụ như sweep.py). Covered khi tồn tại 1 selector mà phần tử
mang đủ class của compound đích VÀ tổ tiên JSX thỏa các compound trước
(descendant theo thứ tự, child `>` phải kề), hoặc — khi class nằm ở
compound tổ tiên (vd `.tl-track-head.is-hidden .tl-track-label`,
`.kf-live-row.dim b`) — subtree của phần tử chứa cháu thỏa các compound
sau. Tổng **190 lần dùng: 188 covered qua matcher + 2 ca biên khóa tay**
(§2.1–§2.2). Test tĩnh khóa toàn bộ (`cssClasses61R4.test.ts`, 59 check).

| Class | Lần dùng | Selector khớp (ví dụ) | Kết luận |
|---|---|---|---|
| `.active` | 10 | `.m-fab.active` | COVERED |
| `.bad` | 4 | `.valid-banner.bad` | COVERED |
| `.bezier-field` | 1 | `.speed-panel .bezier-field` | COVERED |
| `.bezier-row` | 1 | `.speed-panel .bezier-row` | COVERED |
| `.chip` | 2 | `.chip-row .chip` | COVERED |
| `.confirm-box` | 1 | `.template-modal .confirm-box` | COVERED |
| `.curve-add-btn` | 1 | `.speed-panel .curve-add-btn` | COVERED |
| `.curve-bezier` | 1 | `.speed-panel .curve-bezier` | COVERED |
| `.curve-bezier-input` | 1 | `.speed-panel .curve-bezier-input` | COVERED |
| `.curve-disable-btn` | 1 | `.speed-panel .curve-disable-btn` | COVERED |
| `.curve-enable-btn` | 1 | `.speed-panel .curve-enable-btn` | COVERED |
| `.curve-kf` | 1 | `.speed-panel .curve-kf` | COVERED |
| `.curve-kf-easing` | 1 | `.speed-panel .curve-kf-easing` | COVERED |
| `.curve-kf-label` | 1 | `.speed-panel .curve-kf-label` | COVERED |
| `.curve-kf-remove` | 1 | `.speed-panel .curve-kf-remove` | COVERED |
| `.curve-kf-t` | 1 | `.speed-panel .curve-kf-t` | COVERED |
| `.curve-kf-v` | 1 | `.speed-panel .curve-kf-v` | COVERED |
| `.curve-preset` | 3 | `.speed-panel .curve-preset` | COVERED |
| `.dim` | 2 | `.silence-list .dim` | COVERED |
| `.dirty` | 1 | `.autosave-indicator.dirty` | COVERED |
| `.dropped` | 4 | `.caption-row.dropped` | COVERED |
| `.error` | 13 | `.modal-body .error` | COVERED (trừ 1 dương tính giả §2.1) |
| `.has` | 0 qua matcher | `.kf-tab.has` | COVERED tay (§2.3) |
| `.is-active` | 1 | `.tl-marker-swatch.is-active` | COVERED |
| `.is-hidden` | 1 | `.tl-track-head.is-hidden .tl-track-label` | COVERED |
| `.is-locked` | 2 | `.tl-track-head.is-locked .tl-track-label` | COVERED |
| `.is-selected` | 1 | `.tl-marker.is-selected` | COVERED |
| `.left` | 2 | `.clip-handle.left` | COVERED |
| `.lut-none` | 1 | `.lut-swatch.lut-none` | COVERED |
| `.mask-check` | 6 | `.mask-panel .mask-check` | COVERED |
| `.mono` | 2 | `.scene-cut-list li.dropped .mono` | COVERED |
| `.muted` | 40 | `.modal-body .muted` | COVERED |
| `.ok` | 2 | `.valid-banner.ok` | COVERED |
| `.on` | 9 | `.toggle.on` | COVERED (gồm fix §1) |
| `.play` | 3 | `.tbtn.play` | COVERED |
| `.primary` | 24 | `button.primary` | COVERED |
| `.right` | 2 | `.clip-handle.right` | COVERED |
| `.sel` | 2 | `.kf-diamond.sel` | COVERED |
| `.selected` | 6 | `.tl-clip.selected` | COVERED |
| `.sm` | 2 | `.icon-btn.sm` | COVERED |
| `.small` | 12 | `.modal-body .muted.small` | COVERED |
| `.speed-curve` | 1 | `.speed-panel .speed-curve` | COVERED |
| `.sticker-grid` | 1 | `.sticker-panel .sticker-grid` | COVERED |
| `.sticker-preview-row` | 1 | `.sticker-editor .sticker-preview-row` | COVERED |
| `.sticker-thumb` | 1 | `.sticker-editor .sticker-thumb` | COVERED |
| `.tbtn-label` | 1 | `.topbar-actions .tbtn-label` | COVERED tay (§2.2) |
| `.template-aspect` | 1 | `.template-card .template-aspect` | COVERED |
| `.template-desc` | 1 | `.template-card .template-desc` | COVERED |
| `.template-form` | 1 | `.template-modal .template-form` | COVERED |
| `.template-meta` | 1 | `.template-card .template-meta` | COVERED |
| `.template-name` | 1 | `.template-card .template-name` | COVERED |
| `.warn` | 8 | `.modal-body .warn` | COVERED |
| `.wide` | 1 | `.template-modal.wide` | COVERED |

### 2.1 Dương tính giả: `.error` ở ExportPanel

`ExportPanel.tsx` có 1 lần "dùng" `.error` mà matcher báo gap — thực
chất là literal so sánh `shareStatus === "error" ? "valid-banner bad" :
"tips"`, không phải class (đã ghi ở Q2 §5, test khóa: đúng 1 literal
`"error"` trong `className={...}` của file và nó nằm trong phép so
sánh). Không sửa.

### 2.2 Ca biên: `.tbtn-label` qua component con

`<span className="tbtn-label">` nằm trong component con `ShortLabel`
định nghĩa ở `TopBar.tsx` nên matcher trong-file không thấy tổ tiên.
Kiểm chứng tay + khóa trong test: mọi `<ShortLabel …>` (9 chỗ) đều nằm
trong span của `<div className="topbar-actions">`, selector
`.topbar-actions .tbtn-label` có thật (trong media query 769–1360px,
`display: none` — xem §4.4). Không sửa.

### 2.3 Ca biên: `.has` (matcher cắt tag ở `n > 0`)

`<button className={"kf-tab" + (p === activeProp ? " active" : "") +
(n > 0 ? " has" : "")}>` ở `KeyframePanel.tsx:249` — regex tag dừng ở
`>` trong `n > 0` nên matcher không thấy `" has"`. Khóa tay trong test:
dòng này tồn tại + selector `.kf-tab.has` có trong `keyframes.css`.
Cùng nguyên nhân, matcher từng bỏ sót `.curve-bezier-input`
(`<input>`) và `.sticker-thumb` (`<img>`) vì phần tử void bị bỏ qua —
đã sửa matcher (tính cả lá void/self-closing), nay cả hai đều COVERED.

### 2.4 Cải tiến sweep trong lúc làm (phát hiện thật)

Sweep Q2 bỏ sót class chỉ xuất hiện trong **phần tĩnh của template
literal** `` className={`tbtn play ${...}`} ``. Sweep R61 trích thêm
phần tĩnh backtick → JSX token 330 → **348**, nhưng danh sách scoped-only
vẫn đúng 53 tên (không thêm/không mất) và không phát hiện thêm class
chưa định nghĩa thật nào — chỉ thêm 2 mảnh template (`.lane-` từ
`` `tl-lane lane-${track.kind}…` ``, `.toast-` từ `` `toast-${t.kind}` ``).
Cả hai + `.all` đều là dương tính giả đã biết (test khóa từng cái).

## 3. Đo headed thật 5 rule Q2 chỉ đo tổng hợp (b) + fix R4

Harness mới `~/scratch-round61-r4/clicktest-61r4-scoped.mjs` (mẫu Q2:
vite dev đóng băng + Chromium headed qua Xvfb + CDP Node thuần).
Locale EN (`vcut-lang=en` đặt trước khi app chạy), viewport thật qua
`Emulation.setDeviceMetricsOverride` (xem §4.4). 0 window error cả 2
lượt. **PASS 6/6 ở cả EN 1280×720 và EN 390×844.**

| Section | Kích hoạt thật | Đo computed thật |
|---|---|---|
| B1 `.media-proxy` | Import MP4 thật (ffmpeg testsrc 2s 320×180 H.264, 30 KB) qua store `importFiles`, nút proxy của đúng card `r4-test.mp4` | PASS — font 11px, padding-top 4px, margin 4px 6px 8px; nút hiện "Proxy 720p", enabled. (Lưu ý: app vốn có sẵn 2 video mẫu `mau-*.webm` cũng có nút này — harness scope đúng card để khỏi đo nhầm.) |
| B2 `.sticker-panel .warn` | Upload file `.txt` thật qua input file của StickerPanel (không phải ảnh → `sticker.errImageOnly`) | PASS — warn hiện thật, màu `#f5b453`, 12px; text EN "Only image files are accepted (transparent PNG works best)." |
| B3 `.speed-panel .warn` | Bật curve thật (bấm `.curve-enable-btn`) + patch clip `reverse: true` → warn `warnReverseRamp` | PASS — màu `#fbbf24`, 12px; text EN "⚠️ Clip is reversed — reverse CANNOT be combined with speedKeyframes…". Đã trả clip về `reverse: false` sau khi đo. |
| B4 `.tour-body .warn` | Desktop: gỡ `data-tour` khỏi nút add-text (nút vẫn hoạt động) rồi mở tour, tiến tới step add-text. Mobile: thiếu tự nhiên (xem §4.2). | PASS — warn hiện thật, màu `#f5b453`; font-size **13px kế thừa từ `.tour-body { font-size: 13px }`** (rule `.tour-body .warn` chỉ đặt color + margin — kỳ vọng 12px ban đầu của harness là sai, đã sửa). Text EN "That area was not found on screen…". |
| B5 `.reframe-section` | Mở ExportPanel thật (nút Export trên TopBar); section hiện vì có video trong bin | PASS — margin-top 12px, border-top 1px solid, padding-top 4px. Select video gồm `mau-1.webm`, `mau-2.webm`, `r4-test.mp4` (import B1 đã đăng ký). |
| B6 fix R4 `.fx-toggle.on .fx-name` | Chọn video clip thật → mở EffectPanel → bấm thật nút toggle của 1 effect chưa bật | PASS — tên effect `#cfcfe0` → `#fff` sau khi bật; `.fx-item.on` viền `#4a5cff`, `.fx-item.on .fx-check` `#4a5cff`. |

Bằng chứng (scratch, không stage):
`~/scratch-round61-r4/r4-report-r4-1280x720-en.json` (PASS 6/6) +
`r4-r4-1280x720-en.png` (1280×720) và
`r4-report-r4-390x844-en.json` (PASS 6/6) + `r4-r4-390x844-en.png`
(390×844). Harness: `clicktest-61r4-scoped.mjs` (+
`vite.61r4.config.mjs` đóng băng, `cors-server.py` phục vụ MP4 test
vì fetch cross-origin bị chặn, `r4-test.mp4`).

## 4. Đo headed EN + 1280×720 + mobile (c)

Chạy lại harness Q2 (`clicktest-61r4-q2-rerun.mjs` — bản sao Q2, chỉ
đổi locale/viewport qua env + vá 2 chỗ bấm bằng text theo locale:
tour "Take the 5-step tour", history "History") ở **EN 1280×720: PASS
10/10** và **EN 390×844: PASS 10/10** (lượt mobile đầu 8/10 do lỗi
harness, xem §4.3), 0 window error. Bằng chứng:
`r4-q2-report-r4-q2-1280x720-en.json` + `r4-q2-r4-q2-1280x720-en.png`,
`r4-q2-report-r4-q2-390x844-en.json` + `r4-q2-r4-q2-390x844-en.png`.

| Viewport / locale | R4 (B1–B6) | Q2 chạy lại (S1–S9) | Ghi chú |
|---|---|---|---|
| EN 1280×720 (viewport thật) | 6/6 PASS | 10/10 PASS | S2 reverse-badge lần này đo được **thật** (Q2 chỉ đo tổng hợp); S8 tour warn vẫn tổng hợp trong harness Q2 (đo thật ở B4). |
| EN 390×844 (viewport thật, mobile=true) | 6/6 PASS | 10/10 PASS | S8 tour warn đo được **thật** trên mobile (target thiếu tự nhiên, §4.2). |

### 4.1 `.tbtn-label` ở viewport hẹp (kiểm chứng ca §2.2 bằng headed)

Rule `.topbar-actions .tbtn-label { display: none }` chỉ có hiệu lực
trong media query 769–1360px. Ở 1280×720 (nằm trong khoảng này) các
nhãn chữ trong TopBar phải ẩn (chỉ còn icon). Chưa đo trực tiếp trong
lượt này — test tĩnh khóa selector + span ShortLabel (§2.2); đo headed
trực tiếp `display` của `.tbtn-label` ở 1280 vs 1440 còn là nợ mở (§7.3).

### 4.2 Tour warn thiếu target tự nhiên trên mobile

Ở mobile, MediaBin/Inspector là bottom sheet đóng mặc định nên
`[data-tour="media"]` và `[data-tour="inspector"]` **không có trong DOM**
lúc mount — mở tour thì step 1 (media) thiếu target thật, warn hiện
không cần can thiệp DOM (đo ở B4 mobile + S8 mobile). Trên desktop cả
5 target đều có nên B4 dùng cách gỡ `data-tour` (ghi rõ là induced).

### 4.3 Lỗi harness bắt được trong lúc đo mobile (đã sửa, không phải nợ mở)

1. **Mount check dùng `innerText`:** `mobile.css` ẩn `.brand-name`
   (`display: none`) nên `topbar.innerText` không chứa "VCut Studio" →
   chờ mount timeout 240s. Sửa: dùng `textContent` (không bỏ
   `display: none`). Bài học: check mount phải chịu được phần tử ẩn.
2. **`--window-size` ≠ viewport:** Chrome headed có chiều rộng tối
   thiểu ~500px và trừ ~200px UI nên 1280×720 chỉ cho viewport
   1279×519, 390×844 cho viewport 500×844. Sửa: dùng
   `Emulation.setDeviceMetricsOverride` cho mọi viewport (CSS px thật;
   screenshot xác nhận 1280×720 và 390×844). Lượt R4 1280 đầu (viewport
   1279×519) cũng PASS 6/6 nhưng không tính là số đo 1280×720 — đã chạy
   lại đúng viewport và PASS 6/6.
3. **Đóng sheet mobile bằng tọa độ FAB là sai:** backdrop sheet
   (z-index 80) phủ FAB bar (z-index 60) nên click rơi vào **trong
   sheet** — lượt mobile đầu của Q2 rerun: click đóng sheet rơi trúng
   nút BeatSync trong Inspector → mở nhầm BeatSyncModal (`.modal-backdrop`
   z-100) → click tiếp theo đóng modal thay vì bấm nút Adjustment (S5
   FAIL) và nút History bị modal che (S6 ERROR). Sửa: đóng sheet bằng
   nút ✕ `.m-sheet-close` thật (fallback bấm backdrop phía trên sheet),
   + `closeModalIfAny()` trước S5. Chạy lại: 10/10. **Đây là lỗi
   harness, không phải lỗi app** — probe riêng chứng minh cả hai nút
   đều hoạt động đúng trên mobile khi bấm sạch.
4. **Fetch MP4 cross-origin:** trang vite (127.0.0.1:559x) fetch file từ
   `python3 -m http.server` (127.0.0.1:580x) bị chặn CORS → B1 ERROR
   lượt đầu. Sửa: `cors-server.py` tự viết, gửi
   `Access-Control-Allow-Origin: *`.

### 4.4 Quan sát mobile (không phải bug, không sửa)

Backdrop sheet (z-80) phủ FAB bar (z-60) khi sheet mở: user muốn đổi
panel phải đóng sheet trước (bấm backdrop/✕) rồi mới bấm FAB — thêm 1
thao tác. Đây là hành vi modal có chủ đích (`role="dialog"
aria-modal="true"`), không phải lỗi hiển thị — ghi lại để harness sau
khỏi vấp, không đổi z-index.

## 5. Kiểm chứng khác

- Test tĩnh mới `cssClasses61R4.test.ts`: **PASS 59/59**
  (esbuild bundle + node, mẫu Q2). **Đỏ-trước:** chạy trước khi sửa →
  FAIL đúng check `.fx-toggle.on .fx-name`; sau sửa → 59/59.
- Hồi quy: `modalClasses59P4.test.ts` **33/33**. `cssClasses60Q2.test.ts`
  **53/59 check chạy được**; check 54 (quét toàn repo chỉ còn `.all`)
  FAIL chỉ vì `.storage-cleanup` của luồng R9 (xem §6) — không phải
  file của luồng này, **không sửa test của luồng khác**. 5 check còn lại
  (55–59: literal `.all` + i18n 4 file) đã xác minh tương đương bằng
  regex đúng của Q2: `.all` vẫn chỉ là so sánh (2 chỗ `=== "all"` mỗi
  file, 0 `className="all"`), i18n 47/24/9/20 call site đúng số.
- `tsc --noEmit` (apps/web): **0 lỗi ở mọi file luồng này đụng**
  (effects.css là CSS; test mới đã thêm vào `tsconfig.json` exclude).
  Repo-wide còn **1 lỗi ở `src/lib/gopTrialDecode61R7.test.ts`**
  (TS5097, file test của luồng R7) — không phải file của luồng này,
  không sửa giùm.
- `vite build` (apps/web): **pass, 37.57s** (cảnh báo chunk > 500 kB có sẵn).

## 6. Dương tính giả / ngoài phạm vi (ghi để khỏi sửa nhầm)

- `.all`: literal so sánh `cat === "all"` (TemplatePicker/StickerPanel).
- `.lane-` / `.toast-`: mảnh tĩnh của template `` `tl-lane
  lane-${track.kind}…` `` / `` `toast-${t.kind}` `` — không phải class.
- `.storage-cleanup`: class thật chưa định nghĩa trong
  `components/StorageCleanupPanel.tsx` (`className="modal
  storage-cleanup"`) — nhưng file này thuộc **luồng R9 đợt 61 đang chạy
  song song** (tạo 08/11 03:47 +07, sau khi sweep R4 chạy), R4 không sửa
  file của luồng khác. Test R4 allow-list đúng 1 ngoại lệ này + khóa vị
  trí của nó; test Q2 (không biết R9) fail check 54 vì nó — parent/R9
  xử lý (thêm rule CSS hoặc cập nhật test Q2), không phải nợ R4.
- `className={biến}` (không literal) ở 13–20 file không quét tĩnh được
  (giảm từ 20 xuống 13 nhờ trích backtick) — các class truyền qua biến
  có thể còn sót ngoài danh sách §2; matcher trong-file cũng không thấy
  tổ tiên xuyên file (component cha render wrapper ở file khác) — 3 ca
  xuyên file/biên đã khóa tay (§2.1–§2.3), còn lại là giới hạn đã biết
  của phương pháp tĩnh (harness headed là lưới bắt thứ hai).

## 7. Chưa đo / nợ mở (trung thực)

1. **`.tbtn-label` chưa đo headed trực tiếp:** chưa đo computed
   `display` của `.tbtn-label` ở 1280 (phải `none`) vs 1440 (phải hiện)
   — chỉ khóa tĩnh selector + span ShortLabel (§2.2).
2. **`.speed-panel .warn` mới đo 1 trong 4 đường:** đã đo thật
   `warnReverseRamp` (curve + reverse). Còn `warnTooShort`
   (không tới được qua slider vì `applySpeed` kẹp `sliderMax` nên
   `newDur >= MIN` — có thể là nhánh chết), `warnOverlap` /
   `warnResetOverlap` (cần 2 clip kề nhau), `warnNoGap` — chưa kích
   hoạt thật.
3. **`.sticker-panel .warn` mới đo 1 trong 2 đường:** đã đo thật
   `errImageOnly` (upload `.txt`). Còn `errWebp` (cần file WebP động
   thật) chưa kích hoạt.
4. **`.media-proxy` chưa bấm nút thật:** chỉ đo nút hiện + style; bấm
   thật gọi bridge `/api/proxy` (bridge không chạy trong harness) nên
   chưa đo đường tạo proxy.
5. **Q2 test check 54 + lỗi `tsc` file R7** (§5) — thuộc luồng khác,
   R4 không sửa.
6. **Các file khác đang bị luồng round-61 khác sửa song song** — danh
   sách nợ §2/§6 chụp tại thời điểm quét sau sửa (08/11 ~04:50 +07);
   luồng sau quét lại trước khi sửa. Riêng `tsconfig.json` là file
   chung: luồng này chỉ thêm 1 dòng exclude
   (`src/lib/cssClasses61R4.test.ts`); parent gộp batch cần kiểm tra
   trùng/dư dòng (R9 cũng thêm dòng của họ cùng đợt).

## 8. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round61-r4-css-scoped.txt` —
4 file text:

- `apps/web/src/components/effects/effects.css` (thêm rule `.fx-toggle.on .fx-name`)
- `apps/web/src/lib/cssClasses61R4.test.ts` (mới — 59 check)
- `apps/web/tsconfig.json` (thêm 1 dòng exclude)
- `docs/PHASE9_ROUND61_R4_CSS_SCOPED_LIMITS.md` (mới — file này)

Không có binary. Không sửa `vi.json` / `en.json`, không tạo fragment
i18n (không có chuỗi mới). Harness + report JSON + screenshot + MP4 test
chỉ nằm ở `~/scratch-round61-r4/`, không stage.
