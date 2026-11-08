# Phase 9 đợt 60, luồng Q3 — Sửa nút text CaptionModal dùng class .tbtn + modal vừa viewport: LIMITS

Đóng nợ đợt 59 §6.2 (P4) + §4.5 (P5): nút text trong CaptionModal dùng
class `.tbtn` — nút tròn icon 36×36 — nên chữ tràn/chồng nhau ("Bắt đầu
tạo ph…" đè "Đóng"; "Start generating" bị cắt ở mép phải modal); modal
chạm trần max-height. **Đã sửa cả 9 nút text trong CaptionModal.tsx theo
đúng mẫu footer của SilenceModal / BeatSyncModal (đã đo headed đúng ở P4):
`<button>` trần + `className="primary"` cho nút chính. KHÔNG thêm CSS
mới, KHÔNG đổi key i18n / literal, KHÔNG sửa `styles.css` / `mobile.css`.
Đo headed thật 6/6 PASS (vi + en, config + review) + test tĩnh 23/23.**

## 1. Cách sửa (chỉ `CaptionModal.tsx`, 9 nút)

| Vị trí cũ | Sửa thành | Vì sao |
|---|---|---|
| Footer config: nút Đóng `className="tbtn"` | `<button>` trần | Nút text phải dùng style nút text chung (`button`: padding 6px 12px, border-radius 8px, `white-space: nowrap`) thay vì nút icon tròn. |
| Footer config: nút Start `className="tbtn primary"` | `className="primary"` | Giữ accent, bỏ khung tròn 36px. |
| Footer review: nút Làm lại `className="tbtn"` | `<button>` trần | Như trên. |
| Footer review: nút Áp dụng `className="tbtn primary"` | `className="primary"` | Như trên. |
| Body config: 2 nút "⬇ SRT/VTT project" `className="tbtn"` | `<button>` trần | Ngoài việc tràn chữ, `.tbtn` có `display: flex` nên mỗi nút là block-level, chiếm 1 dòng riêng — 2 nút xếp dọc (đúng ảnh B3 của P5). Sau sửa 2 nút nằm chung 1 dòng. |
| Body review: 2 nút xuất SRT/VTT `className="tbtn"` | `<button>` trần | Như trên. |
| Bước running: nút Huỷ `className="tbtn"` | `<button>` trần | Như trên. |

Thêm 1 comment ngắn trên `.modal-actions` ghi rõ quy ước (không dùng
`.tbtn` cho nút text) để luồng sau khỏi lặp lại. Nút ✕ ở `.modal-head`
giữ nguyên `icon-btn` (đúng là nút icon). Không đổi logic, không đổi key
i18n: caption 45 key / 55 call site `t(` (khớp baseline trước sửa; P4 ghi
49 key là đếm theo cách khác — đếm lại trực tiếp object `caption` trong
`vi.json`/`en.json` = 45 key). Không có chuỗi mới → **không tạo fragment
JSON** (không sửa `vi.json` / `en.json`).

## 2. Đỏ-trước/xanh-sau — headed thật (harness mới, xem §4)

Harness riêng đợt này: `apps/web/scripts/clicktest-60q3-caption-modal.mjs`
(vite dev đóng băng + Chromium headed qua Xvfb display :171 + CDP Node
thuần, mẫu P5; cổng dev 5470, debug 9570). Đo hình học ở lần vẽ đầu,
không scroll, không click trong modal. `MEASURE_FN` khóa 5 bất biến cho
mọi nút trong dialog: (a) chữ vừa hộp nút (`scrollWidth <= clientWidth`);
(b) hộp chữ nhìn thấy được (nút flex căn giữa nên chữ tràn đối xứng quanh
tâm, rộng = `scrollWidth`) không chồng lên hộp chữ nút kề; (c) hộp chữ
không vượt khỏi mép modal (bị `.modal overflow:hidden` cắt); (d) nút
action trong viewport; (e) modal vừa viewport (`bottom <= innerHeight`).
`window.onerror` / unhandledrejection trong cả phiên: **0 lỗi**.

### Trước sửa (lần chạy 1, 17:45 +07 07/11) — FAIL 2/2 case đo

| Đo trước sửa | Config vi | Review vi |
|---|---|---|
| Viewport thực | 1439×699 | 1439×699 |
| Modal | 640×639, top 30 → bottom 669 (chạm trần `max-height: 639px`) | 640×493, top 103 → bottom 596 |
| Chữ tràn hộp nút | "⬇ SRT project" 34px hộp / 67px chữ; "⬇ VTT project" 34/67; "Đóng" 34/36; "🎙 Bắt đầu tạo phụ đề" 34/91 | "⬇ Xuất SRT" 34/58; "⬇ Xuất VTT" 34/59; "← Làm lại" 34/51; "✓ Áp dụng 2 câu phụ đề" 34/105 |
| Chữ chồng nhau | "Đóng" ↔ "🎙 Bắt đầu tạo phụ đề" | "← Làm lại" ↔ "✓ Áp dụng 2 câu phụ đề" |
| Chữ vượt mép modal | "🎙 Bắt đầu tạo phụ đề" | "✓ Áp dụng 2 câu phụ đề" |
| Body scroll | 543/510, overflow-y auto (nội dung dài hơn body) | 364/364 |
| Verdict | **FAIL** | **FAIL** |

### Sau sửa (lần chạy 2, 17:58 +07 07/11) — PASS 6/6

| Đo sau sửa | Config vi | Review vi | Config en | Review en |
|---|---|---|---|---|
| Viewport thực | 1439×699 | 1439×699 | 1439×699 | 1439×699 |
| Modal | 640×614, top 42.5 → bottom 656.5 | 640×445, top 127 → bottom 572 | 640×614, top 42.5 → bottom 656.5 | 640×445, top 127 → bottom 572 |
| Nút action | "Đóng" 59×36; "🎙 Bắt đầu tạo phụ đề" 154×36 | "← Làm lại" 85.4×30; "✓ Áp dụng 2 câu phụ đề" 177.9×30 | "Close" 60.9×36; "🎙 Start generating captions" 196.3×36 | "← Start over" 102.1×30; "✓ Apply 2 caption sentences" 208×30 |
| Nút xuất body | "⬇ SRT project" 112.2×30; "⬇ VTT project" 112.8×30 | "⬇ Xuất SRT" 97.4×30; "⬇ Xuất VTT" 98.1×30 | như vi | "⬇ Export SRT" 109.3×30; "⬇ Export VTT" 110×30 |
| Chữ tràn / chồng / vượt mép | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Body scroll | 485/485 auto (không cần cuộn) | 322/322 auto | 485/485 auto | 322/322 auto |
| Verdict | **PASS** | **PASS** | **PASS** | **PASS** |

Q0 setup + H9 cũng PASS cả 2 lần chạy: boot ổn định, mẫu tự load (3 clip,
media bin 2 item), nút TopBar "💬 Phụ đề" tại (1103, 73); Q2 Apply bằng
chuột thật tạo track "Phụ đề 2" lên timeline (lần chạy 2). Bằng chứng:
`hidden_files/round60-q3/headed/q3-headed-report.json`,
`q3-measure-{config,review}-{vi,en}.json`,
`q3-{config,review}-{vi,en}.png`.

Đọc screenshot bằng mắt sau sửa (đã xem lại file PNG): footer "Close" +
"🎙 Start generating captions" là nút chữ nhật bình thường, đọc rõ, không
chồng, không cắt; 2 nút "⬇ SRT/VTT project" nằm chung 1 dòng; review vi
"← Làm lại" + "✓ Áp dụng 2 câu phụ đề" đọc rõ, modal gọn 445px.

### Đính chính mô tả bug (b) — "modal cao hơn viewport 900px"

Số đo trước sửa cho thấy **bản thân modal KHÔNG vượt viewport**: config
640×639, bottom 669 < 699 (đúng trần `max-height: calc(100vh − 60px)` của
`.modal`, body cuộn nội bộ). Cái "bị cắt nửa ở mép dưới" trong screenshot
B3 của P5 thực chất là **chữ của nút bị cắt ở mép PHẢI modal** (chữ tràn
khỏi hộp 36px rồi bị `.modal overflow:hidden` cắt) + chữ 2 nút chồng lên
nhau — nhìn thoáng qua như nút bị cắt. Sau sửa modal còn ngắn đi
(639 → 614px ở config) vì 2 nút xuất không còn xếp dọc thành 2 dòng.
Không cần đổi CSS `max-height` / layout modal — hình học modal đã đúng
từ đầu, lỗi nằm ở class nút. Ghi rõ để luồng sau khỏi sửa nhầm `.modal`.

## 3. Test mới — `apps/web/src/lib/captionModal60Q3.test.ts`: PASS 23/23

Chạy: esbuild bundle `--format=cjs` (theo nhiệm vụ) rồi node —
`./node_modules/.bin/esbuild apps/web/src/lib/captionModal60Q3.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/round60-q3/q3.test.cjs &&
node /tmp/round60-q3/q3.test.cjs` → `23 passed, 0 failed`.

**Đỏ-trước/xanh-sau:** chạy test trước khi sửa → **14 pass / 9 fail**
(đúng 9 check liên quan `.tbtn` fail, gồm cả 9 lần xuất hiện class);
sau sửa → 23/23. Hai check fail lúc đầu do **lỗi test, không phải lỗi
sản phẩm** (đã sửa test rồi chạy lại): (a) check "không còn chuỗi 'tbtn'"
bắt cả từ trong comment giải thích mới thêm → đổi thành "không còn 'tbtn'
ngoài comment"; (b) check "body đóng ngay trước actions" không khớp vì
comment mới chen giữa `</div>` và `<div className="modal-actions">` →
regex cho phép 1 khối comment ở giữa. Khóa 6 bất biến: (1) không còn
`.tbtn` trong `CaptionModal.tsx`; (2–3) footer config/review đúng mẫu
trần + `primary`; (4) 4 nút xuất + nút Huỷ running là `<button>` trần;
(5) cấu trúc modal giữ nguyên (1 khối `.modal-actions` chung, ngoài
`.modal-body`, modal giữ `role="dialog"` + nút ✕ `icon-btn`); (6) i18n
giữ nguyên (45 key / 55 call site, `caption.start` + `caption.apply`
khớp 2 locale).

## 4. Kiểm chứng khác

- `tsc --noEmit` (apps/web): **0 lỗi ở mọi file luồng này đụng**
  (CaptionModal.tsx / captionModal60Q3.test.ts / harness `.mjs` không nằm
  trong diện tsc). Repo-wide lúc đo KHÔNG 0 lỗi: còn 10 lỗi ở file của
  luồng round-60 khác đang chạy song song (`gopRangeFetch39T3.ts` 1 lỗi
  `trKey` chưa dùng, `gopTrialDecode60Q5.test.ts` 3 lỗi, `i18nOrphans60Q4.
  test.ts` 6 lỗi) — không phải file của luồng này, không sửa giùm. Test
  mới KHÔNG cần thêm vào `tsconfig.json` exclude (tsc không báo lỗi ở
  file này — `fs`/`path`/`process` resolve được), khác với test của P4.
- `vite build` (apps/web): **pass, 29.40s** (cảnh báo chunk > 500 kB có sẵn).
- Hồi quy (esbuild + node, vi + en):
  `captionsExport59P5.test.ts` **7/7 vi + 7/7 en**,
  `captionsTrack58O5.test.ts` **12/12 vi + 12/12 en**,
  `i18nAudit56M4.test.ts` **25/25 vi + 25/25 en**,
  `modalClasses59P4.test.ts` **33/33**,
  `modalCard58O4.test.ts` **24/24**,
  `silenceModal57N1.test.ts` **11/11**,
  `subtitles.test.ts` **14/14**, `d6.test.ts` **11/11**.

### Harness vấp 1 bug trong lúc chạy, đã sửa (ghi để luồng sau khỏi vấp lại)

Lần chạy đỏ-trước: Q0–Q2 pass/fail đúng, nhưng Q3 (en) timeout 30s chờ
CaptionModal mở — click nút TopBar "💬 Captions" không mở được modal.
Probe chẩn đoán (`/tmp/round60-q3/probe-en.mjs`, `/tmp/round60-q3/
probe-en2.mjs`, không stage): chỉ có đúng 1 nút chứa "Captions" (nút
TopBar, visible, không disabled); click vào nó khi không có overlay thì
modal mở ngay ("💬 Auto-generate captions…"). Nguyên nhân: **welcome
modal mở TRỄ** (khi `ready` bật sau khi mẫu load xong) nên có thể phủ
lên TopBar SAU khi `ensureNoModal` đã chạy xong — click rơi vào backdrop
của welcome modal. Đây là **lỗi harness, không phải lỗi sản phẩm** (P4
cũng từng vấp biến thể tương tự: click nhầm nút trùng text — xem P4
LIMITS §7.5). Đã sửa harness `openModal`: scope nút TopBar vào
`header.topbar`, kiểm tra lại overlay ngay trước mỗi cú click, bấm lại
tối đa 3 lần (mỗi lần chờ 8s). Lần chạy xanh-sau dùng harness đã sửa:
Q3/Q4 pass ngay lần bấm đầu.

## 5. Chưa đo / nợ mở (trung thực)

1. **Bước running chưa đo headed** (nút Huỷ đã đổi class nhưng chưa có
   lần đo hình học riêng — cùng mẫu nút trần như các nút đã đo, suy ra từ
   cùng phép sửa; chạy caption thật cần bridge + media có lời thoại).
2. **Chưa đo viewport 1280×720** (P4 đã đo modal Caption ở 1280×720 là
   vừa viewport với cùng CSS `.modal`; phép sửa này chỉ đổi class nút
   nên hình học modal không đổi theo hướng xấu — nhưng chưa có số đo
   riêng ở viewport này sau sửa).
3. **Chưa đo viewport mobile** (mobile.css có `.modal` riêng — chưa kiểm
   chứng headed; ngoài phạm vi).
4. **Các class `.tbtn` còn lại trong repo không thuộc phạm vi**: `.tbtn`
   vẫn dùng đúng chỗ ở toolbar/preview (nút icon) — luồng này chỉ gỡ
   khỏi CaptionModal; các modal khác dùng `.tbtn` cho nút text (nếu có)
   cần quét riêng — quét nhanh: `grep -rn 'className="tbtn' apps/web/src`
   sau sửa chỉ còn `CaptionModal.tsx: 0` (xem §3); các file khác không
   dùng `tbtn` cho nút text theo grep đó — nhưng grep literal không bắt
   được `className={...}` động, nên chưa khẳng định tuyệt đối.
5. **`tsconfig.json` là file chung**: luồng này KHÔNG sửa (test mới
   không cần exclude); các luồng đợt 60 khác đang thêm dòng của họ —
   parent gộp batch cần kiểm tra trùng/dư dòng như P4 đã dặn.
6. **Tổng chờ push trong log là ước tính tại thời điểm ghi** (các luồng
   đợt 60 khác đang stage song song) — xem log vòng lặp.

## 6. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round60-q3-caption-modal.txt` —
4 file text:

- `apps/web/src/components/CaptionModal.tsx`
- `apps/web/src/lib/captionModal60Q3.test.ts` (mới)
- `apps/web/scripts/clicktest-60q3-caption-modal.mjs` (mới)
- `docs/PHASE9_ROUND60_Q3_CAPTION_MODAL_LIMITS.md` (mới — file này)

Không có binary. Không sửa `styles.css` / `mobile.css`, không sửa
`vi.json` / `en.json`, không tạo fragment i18n (không có chuỗi mới).
Harness + report JSON + screenshot chỉ nằm ở
`hidden_files/round60-q3/headed/`, không stage (harness script thì có
stage để luồng sau tái dùng). Probe chẩn đoán nằm ở `/tmp/round60-q3/`,
không stage. Đã append mục log ngắn vào
`workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
theo nhiệm vụ (tổng chờ push 769 entry tại thời điểm ghi — ước tính, các
luồng đợt 60 khác có thể stage thêm sau).
