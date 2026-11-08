# Phase 9 đợt 62, luồng R1 — Sửa bug FPS pill đè footer modal ở mobile: LIMITS

Ngày: 08/11/2026 (lượt cron 06:35 +07; headed chạy 23:46–23:59 UTC 07/11, tức 06:46–06:59 +07 08/11).
Phạm vi: đóng nợ đợt 61 §5.1 (LIMITS R5): nút nổi FPS (PerfOverlay,
z-index 300) đè lên footer modal bottom-sheet ở mobile, che đuôi nút
chính (`.modal-backdrop` chỉ z-index 100). Bug thấy ở screenshot
`r5-config-390-vi.png`.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG thêm key i18n (không
cần fragment), KHÔNG sửa `vi.json`/`en.json`.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Bug gốc (pill đè nút chính @390×844) | **ĐÃ SỬA + đo lại headed 8/8.** Trước sửa: pill đè nút chính 1996.8px² (vi + en), panel FPS mở đè trọn nút 6776px², click chuột thật vào đuôi nút mở panel FPS thay vì bấm nút. Sau sửa: backdrop z=400 > pill/panel z=300; nút chính bấm được (elementFromPoint + click thật), pill vẫn bấm được khi không có modal. |
| Hướng sửa | **Nâng `.modal-backdrop` 100 → 400** (không ẩn pill FPS). Lý do + bằng chứng ở §1. Kèm nâng `.toasts` 200 → 500 và `.tour-card` 120 → 450 để giữ thứ tự cũ (cả 2 vốn trên backdrop). |
| Test tĩnh mới | **6/6** (đỏ-trước 3/6: T1/T2/T5 fail đúng thiết kế trước sửa). |
| Hồi quy | Modal/Escape/caption/i18n: Q3 23/23, Q10 15/15, P2 26/26, P5 7/7 vi + 7/7 en, O5 12/12 vi + 12/12 en, M4 25/25 vi + 25/25 en, P4 33/33, O4 24/24, N1 11/11, subtitles 14/14, d6 11/11, R5 8/8. `tsc` 0 lỗi toàn repo lúc đo cuối (xem §4), `vite build` pass 22,33s. |
| Screenshot đối chiếu | `r1-config-390-vi.png`: nút "🎙 Bắt đầu tạo phụ đề" hiện đầy đủ, không còn pill FPS đè lên. `r1-panel-390-vi.png`: panel FPS đang mở + modal mở — modal sạch, không thấy panel đè lên. |

## 1. Cách sửa + lý do chọn hướng (quyết bằng đo)

### 1.1 Hai hướng ứng viên, chọn hướng A

- **Hướng A — nâng `.modal-backdrop` lên trên 300 (đã chọn):** modal theo
  định nghĩa phải là lớp trên cùng và nhận mọi pointer input khi mở; sửa
  1 chỗ trong `styles.css`, áp dụng cho MỌI modal dùng `.modal-backdrop`
  (12 component: CaptionModal, TemplatePackModal, TemplatePicker,
  SilenceModal, ExportPanel, SceneModal, BeatSyncModal, WelcomeModal,
  StorageCleanupPanel, LoadReportPanel, RenameProjectDialog, RelinkPanel)
  vì tất cả đều render qua class này — bug R5 ghi "ảnh hưởng mọi modal
  bottom-sheet ở ≤768px, không riêng CaptionModal" nên sửa ở lớp chung
  là đúng chỗ. Pill/panel FPS giữ z 300, không đổi code TSX.
- **Hướng B — ẩn pill FPS khi có modal mở (không chọn):** trạng thái "có
  modal mở" nằm rải ở App + ~12 modal (captionOpen, packOpen,
  exportOpen, silenceOpen, templateOpen, tourOpen, loadReportOpen,
  relink, WelcomeModal...) — nối vào PerfOverlay đòi sửa App + nhiều
  component, xâm lấn hơn; panel FPS đang mở cũng cần xử lý y hệt (không
  chỉ pill); và pill là công cụ đo, giấu nó mỗi lần mở modal là mất
  tính năng. Không có bằng chứng nào cho thấy B tốt hơn A.

### 1.2 `apps/web/src/styles.css` — 3 dòng z-index + chú thích

```css
.modal-backdrop { z-index: 100 → 400; }   /* trên PerfOverlay 300 */
.toasts         { z-index: 200 → 500; }   /* giữ trên backdrop mới */
.tour-card      { z-index: 120 → 450; }   /* giữ trên backdrop mới */
```

Thứ tự cuối: splash 200 < pill/panel FPS 300 < backdrop 400 <
tour-card 450 < toasts 500. `.splash` giữ 200: nó chỉ render khi
`!ready` (App.tsx:649), chưa modal nào mở được lúc đó; nếu modal có mở
được trong lúc splash thì modal trên splash là đúng về mặt hiển thị.
`mobile.css` không override z-index của `.modal-backdrop` (khóa bằng
test T6) nên sửa ở `styles.css` có hiệu lực cả mobile.

**Hệ quả có chủ đích (không phải lỗi):** toast hiện trong lúc modal mở
vẫn nổi trên modal (đúng — toast mang phản hồi hành động); toast cũng
che pill FPS trong vài giây nó hiện (toast là UI transient ưu tiên cao
nhất, chấp nhận được; pill hiện lại ngay khi toast tắt). Pill FPS khi
không có modal vẫn ở đúng chỗ cũ, bấm được như thường (F0).

## 2. Đo headed thật — trước sửa (đỏ) vs sau sửa (xanh)

Harness mới `apps/web/scripts/clicktest-62r1-fps-modal.mjs` (vite dev
đóng băng + Chromium headed qua Xvfb + CDP, Node thuần, mẫu R5; display
riêng `:173`/`:174`, cổng dev 549x, debug 959x; KHÔNG cần bridge — chỉ
mở CaptionModal bước config, không chạy caption thật). 8 case: R0 setup,
F0 baseline (modal đóng), F1 config vi @390×844, F2 config en @390×844,
F3 config vi @1280×720, F4 panel FPS mở + modal @390×844, F5 click
chuột thật vào đuôi nút @390×844, H9 0 lỗi trang.

### 2.1 Trước sửa — 4/8 (đỏ đúng chỗ)

| Case | Kết quả đo |
|---|---|
| F1 vi @390×844 | FAIL — pill 70,2×44 tại (307,8, 788)–(378, 832) đè nút chính (205, 783)–(359, 827): **giao nhau 1996.8px²**; backdrop z=100, pill z=300. Tâm nút chính vẫn trúng nút (tâm nút x=282 nằm trái mép pill 307,8) nên MEASURE_FN kiểu cũ không bắt được — cái che là ĐUÔI nút, đúng như screenshot R5. |
| F2 en @390×844 | FAIL — y hệt vi: **1996.8px²** (nút en rộng hơn 196,3px nhưng vùng giao nhau như nhau vì pill cố định góc phải). |
| F3 vi @1280×720 | PASS — giao nhau 0px² (modal căn giữa, không chạm pill). Khóa hồi quy desktop. |
| F4 panel mở + modal @390×844 | FAIL — panel FPS **378×219** (rộng hơn min-width 210 vì shrink-to-fit theo nội dung dài) đè **trọn nút chính 6776px²**; elementFromPoint tại tâm nút chính trúng div "Đo bằng rAF của app…" (con của panel, ngoài dialog) — nút hoàn toàn không bấm được khi panel mở. |
| F5 click thật @390×844 | FAIL — click tại tâm vùng giao nhau pill∩nút (333,4, 807,5) → **panel FPS mở** (panel=true), modal vẫn ở config — click rơi vào pill, không tới nút. |
| F0 / H9 | PASS — modal đóng: pill bấm được (elementFromPoint tại tâm pill = "📈 FPS"); 0 lỗi trang. |

### 2.2 Sau sửa — 8/8 (xanh)

| Case | Kết quả đo |
|---|---|
| F1 vi @390×844 | PASS — backdrop z=400, pill z=300; elementFromPoint tại tâm nút = "🎙 Bắt đầu tạo phụ đề" (trong dialog); elementFromPoint tại tâm vùng giao nhau pill∩nút cũng trúng nút (trong dialog). Giao hình học vẫn 1996.8px² — xem §2.3 vì sao đó không còn là lỗi. |
| F2 en @390×844 | PASS — y hệt vi ("🎙 Start generating captions", trong dialog). |
| F3 vi @1280×720 | PASS — giao nhau 0px², nút bấm được (không đổi so trước sửa). |
| F4 panel mở + modal @390×844 | PASS — panel 378×219 z=300, backdrop z=400; elementFromPoint tại tâm panel = "Project chưa có phụ đề nào…" (nội dung dialog); tại tâm nút chính = nút chính. Panel nằm dưới backdrop. |
| F5 click thật @390×844 | PASS — click tại (333,4, 807,5) (tâm vùng giao nhau cũ) → **panel KHÔNG mở**, modal vẫn mở ở config — click tới nút Start (bridge không chạy trong harness này nên Start lỗi sạch, modal ở lại config; chỉ khẳng định click không rơi vào pill). |
| F0 / H9 | PASS — như trước sửa: pill bấm được khi không có modal; 0 lỗi trang cả phiên. |

### 2.3 Bài học đo trong lúc làm (ghi để luồng sau khỏi vấp lại)

**Lần chạy headed đầu tiên sau sửa vẫn báo F1/F2/F4 FAIL dù sửa đã đúng**
(backdrop z=400 đã hiện trong log, F5 đã PASS). Nguyên nhân: verdict
ban đầu fail theo **diện tích giao nhau hình học** (rect ∩) — nhưng sau
sửa, pill/panel vẫn chiếm cùng tọa độ nên giao hình học còn nguyên
(1996.8px² / 6776px²); cái đổi là **thứ tự chồng**: pill/panel nằm
DƯỚI backdrop nên không nhìn thấy, không nhận click. Verdict đã sửa
thành tiêu chí đúng: **elementFromPoint** (phần tử trên cùng thật tại
điểm đó) — tâm nút chính, tâm vùng giao nhau, tâm pill/panel đều phải
thuộc về dialog/backdrop; diện tích giao nhau chỉ ghi lại để theo dõi.
Screenshot `r1-config-390-vi.png` sau sửa đọc bằng mắt xác nhận: nút
chính hiện đầy đủ "🎙 Bắt đầu tạo phụ đề", không còn pill đè lên.

**2 bug harness đã sửa trong lúc chạy (lỗi harness, không phải lỗi sản phẩm):**

1. **Selector `[role="status"]` bắt nhầm element ẩn:** `document.querySelector('[role="status"]')`
   trả về `.flash-msg` của TopBar (0×0, z-index 5) thay vì panel FPS —
   F4 lần đầu đo panel 0×0 và `fpsPanelOpen` luôn true. Sửa: chọn panel
   bằng text đặc trưng "FPS preview" (`[...querySelectorAll('[role="status"]')].find(el =>
   el.textContent.includes("FPS preview"))`) ở cả FPS_FN, STATE_FN và
   bước đóng panel. Phát hiện thêm nhờ đó: panel FPS khi mở rộng tới
   378px (shrink-to-fit theo dòng note dài), không phải 210px như
   min-width — đo thật, xem §2.1 F4.
2. **F5 lần đầu click nhầm điểm:** click tâm nút chính (x=282) không rơi
   vào pill (pill bắt đầu từ x=307,8) nên F5 PASS giả trước sửa. Sửa:
   F5 click tại **tâm vùng giao nhau** pill∩nút (333,4, 807,5); sau sửa
   không còn giao nhau hiệu dụng thì click tâm nút. Nhờ đó F5 đỏ-trước
   đúng (panel mở sau click) và xanh-sau đúng (panel không mở).
3. **Display `:173` bị luồng khác chiếm:** lần chạy lại sau sửa vấp guard
   display — Xvfb `:173` + Chrome debug 9590 đang thuộc luồng round62-r10
   (chạy song song). Không giết process của luồng khác; chạy lại với
   `R1_DISPLAY=:174` (harness tự chọn cổng dev/debug trống).

## 3. Test tĩnh mới — `apps/web/src/lib/fpsModal62R1.test.ts`: PASS 6/6

Chạy: esbuild bundle `--format=cjs` rồi node (mẫu R5) —
`./node_modules/.bin/esbuild apps/web/src/lib/fpsModal62R1.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/round62-r1/r1.test.cjs &&
node /tmp/round62-r1/r1.test.cjs` → `6 passed, 0 failed`.

| Check | Nội dung |
|---|---|
| T1 | `.modal-backdrop` z đúng 400 (> 300) |
| T2 | PerfOverlay pill + panel đều z 300, đều dưới backdrop |
| T3 | `.toasts` z 500 > backdrop 400 (toast lúc modal mở vẫn thấy) |
| T4 | `.tour-card` z 450 > backdrop 400 (giữ thứ tự cũ) |
| T5 | `.splash` z 200 < backdrop 400 |
| T6 | `mobile.css` không override z-index của `.modal-backdrop` |

Đỏ-trước: **3/6 pass** (T1/T2/T5 fail đúng thiết kế; T3/T4 pass cả
trước sửa vì 200>100 và 120>100 — 2 check này khóa thứ tự tương đối
phải giữ, không phải khóa giá trị mới).

## 4. Kiểm chứng khác

- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0, 0 lỗi toàn repo**
  ở lần đo cuối. Lưu ý trung thực: lần chạy tsc đầu tiên trong lượt này
  còn 4 lỗi ở file của luồng đợt 62 khác đang chạy song song
  (`nestedPreview.ts` 1 lỗi TS5097, `pauseStall62R6.test.ts` 3 lỗi
  TS5097/TS6133) — không phải file của luồng này, không sửa giùm; các
  luồng đó đã sửa xong file của họ giữa 2 lần chạy nên lần 2 sạch 0 lỗi.
  File R1 (`fpsModal62R1.test.ts`) 0 lỗi ở cả 2 lần chạy.
- `vite build` (apps/web): **pass, 22,33s** (chỉ cảnh báo chunk >500kB
  có sẵn).
- Hồi quy (esbuild + node, chạy 1 lượt `/tmp/round62-r1/regress.sh` +
  lượt en riêng cho 3 suite dùng `VCUT_TEST_LANG`):
  `captionModal60Q3.test.ts` **23/23**, `escapeForms60Q10.test.ts`
  **15/15**, `escapeModals59P2.test.ts` **26/26**,
  `captionsExport59P5.test.ts` **7/7 vi + 7/7 en**,
  `captionsTrack58O5.test.ts` **12/12 vi + 12/12 en**,
  `i18nAudit56M4.test.ts` **25/25 vi + 25/25 en**,
  `modalClasses59P4.test.ts` **33/33**, `modalCard58O4.test.ts` **24/24**,
  `silenceModal57N1.test.ts` **11/11**, `subtitles.test.ts` **14/14**,
  `d6.test.ts` **11/11**, `recordPackMedia61R5.test.ts` **8/8**,
  `fpsModal62R1.test.ts` **6/6**.
  (Lưu ý: `regress.sh` tự viết trả exit 1 do grep kiểm tra "0 failed"
  không khớp vài suite in "15/15 pass" — lỗi script kiểm tra, không phải
  lỗi test; từng suite đã kiểm tra tay: tất cả 0 failed.)

## 5. Chưa đo / nợ mở (trung thực)

1. **Chỉ đo CaptionModal** (bước config) — bug ảnh hưởng mọi modal
   bottom-sheet nhưng sửa ở lớp chung `.modal-backdrop` nên mọi modal
   cùng hưởng; chưa đo headed từng modal khác (TemplatePackModal,
   SilenceModal...) ở 390px. Rủi ro thấp vì cùng 1 class backdrop, nhưng
   chưa có số đo riêng từng modal.
2. **Chưa đo headed toast + tour cùng lúc modal mở:** T3/T4 chỉ khóa
   bằng test tĩnh (z-index). Chưa có lần chạy headed nào mở toast/tour
   trong lúc modal mở để thấy bằng mắt toast/tour vẫn nổi trên modal.
3. **Chưa đo bước review/running ở mobile sau sửa:** chỉ đo config
   (vi + en) — review dùng cùng backdrop + cùng footer nên hành vi
   giống, chưa đo riêng.
4. **Chưa đo click thật vào nút chính khi panel FPS đang mở:** F4 chỉ đo
   elementFromPoint; F5 chỉ đo với pill (panel đóng). Suy ra từ cùng
   z-order (panel 300 < backdrop 400) click sẽ tới nút, chưa có lần
   click thật chứng minh.
5. **`styles.css` là file chung:** các luồng đợt 62 khác đang chạy song
   song (đã thấy R6, R10) có thể sửa cùng file — parent gộp cần kiểm tra
   trùng/dư khi push. Sửa R1 chỉ chạm 3 rule z-index + chú thích, không
   đổi rule nào khác.
6. **Giao hình học pill/panel ∩ nút vẫn còn** (1996.8px² / 6776px²) —
   pill/panel vẫn ở cùng tọa độ, chỉ nằm dưới backdrop. Đây là trạng
   thái đúng sau hướng A (không phải lỗi còn sót): pill không nhìn thấy
   khi modal mở (screenshot xác nhận), không nhận click (F5 xác nhận).
   Nếu sau này có luồng muốn dọn cả giao hình học (vd di chuyển pill
   khi modal mở) thì đó là polish thêm, không phải sửa bug.

## 6. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round62-r1-fps-modal.txt` —
4 file text:

- `apps/web/src/styles.css` (sửa: backdrop 100→400, toasts 200→500, tour-card 120→450 + chú thích)
- `apps/web/src/lib/fpsModal62R1.test.ts` (mới: test tĩnh z-index 6 check)
- `apps/web/scripts/clicktest-62r1-fps-modal.mjs` (mới: harness headed 8 case)
- `docs/PHASE9_ROUND62_R1_FPS_MODAL_LIMITS.md` (mới — file này)

Không có binary. Không sửa `vi.json` / `en.json` (không thêm key i18n
nên không có fragment), không sửa `PerfOverlay.tsx` (pill/panel giữ
z 300), không sửa `mobile.css`, không sửa `CaptionModal.tsx` / `App.tsx`.
Harness + report JSON + screenshot chỉ nằm ở
`hidden_files/round62-r1/headed/`, không stage. `dist/` (vite build
kiểm chứng) không stage. Log test/tsc nằm ở `/tmp/round62-r1/`, không
stage.
