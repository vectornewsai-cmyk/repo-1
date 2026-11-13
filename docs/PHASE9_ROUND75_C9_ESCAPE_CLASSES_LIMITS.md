# Phase 9 — Đợt 75, luồng C9: gap O1+O4 — Escape chưa thống nhất + class CSS chưa định nghĩa còn sót

> **Kết luận trước (đọc dòng này là đủ): O1 và O4 ĐÃ ĐÓNG từ trước — đợt 59 P2/P4
> (Escape + class) và đợt 60 Q10 (đổi quyết định TemplatePicker bước 2) — code
> trên đĩa đã có đủ. Luồng C9 không sửa file sản phẩm nào; công việc của đợt
> này là KIỂM CHỨNG LẠI độc lập sau gộp (re-probe): chạy lại toàn bộ test
> tĩnh liên quan + click-test headed mới 9/9 + tsc + vite build. Không thêm
> key i18n (dict giữ 2405 key), không đổi call site CSS (css60/css61 giữ
> nguyên expected list/count), không đụng file dùng chung nào ngoài việc thêm
> 1 harness headed mới.**

## 0. Vì sao không có code sửa — đối chiếu với gap analysis

Gap analysis § "Nợ mở lớn nhất còn lại (từ ROUND58 §6)" ghi O1/O4 như nợ mở,
nhưng §0.2 cùng file đã cập nhật: **đợt 59 P2 đóng O1 (test 26/26, headed
5/5), đợt 59 P4 đóng O4 (test 33/33, headed 6/6), đợt 60 Q10 đổi quyết định
Escape bước 2 của TemplatePicker**. Kiểm tra trực tiếp trên đĩa ngày
09/11/2026 xác nhận cả ba việc vẫn còn nguyên:

| Hạng mục | Trạng thái trên đĩa |
|---|---|
| TourCard Escape | `apps/web/src/components/onboarding/TourCard.tsx:48-60` — `useEffect` keydown window, guard INPUT/TEXTAREA/SELECT, không chặn BUTTON, `onClose()` (không gọi `finish()`), cleanup `removeEventListener` |
| TemplatePackModal Escape | `apps/web/src/components/onboarding/TemplatePackModal.tsx:75-87` — cùng pattern; chặn đóng khi busy/ttsBusy (Q10) |
| TemplatePicker Escape | `apps/web/src/components/TemplatePicker.tsx:61-72` — cùng pattern; **ĐÓNG HẲN ở cả 2 bước** (Q10, đổi so với P2) |
| `caption-modal` | Không còn trong JSX — CaptionModal dùng class `modal` đã định nghĩa (P4 chọn **đổi sang class đã có**, không định nghĩa class mới) |
| `modal-x` / `modal-label` / `modal-hint` / `modal-err` | Không còn trong JSX — SilenceModal dùng `icon-btn` / `field` / `muted` / `error` đã định nghĩa |
| `<p className="error">` BeatSyncModal | Nằm trong `.modal-body` cả 3 bước (config/running/review) nên rule `.modal-body .error` áp dụng được — không còn "top-level không style" |

Sweep toàn repo: 5 class đã sửa không còn xuất hiện trong bất cứ `.tsx` nào
(trừ file test khóa) — `modalClasses59P4.test.ts` check 33 đã khóa điều này.

## 1. Lựa chọn "định nghĩa class mới hay đổi sang class đã có" (yêu cầu nhiệm vụ)

Đợt 59 P4 đã chọn **đổi sang class đã có**, và C9 xác nhận lựa chọn đó vẫn
đúng, không đảo ngược:

- `caption-modal` → `modal`: CaptionModal không có nhu cầu layout khác các
  modal khác (cùng width 640px, cùng head/body/actions); class riêng chỉ
  thêm 1 selector chết phải bảo trì.
- `modal-x` → `icon-btn` (nút ✕), `modal-label` → `field`,
  `modal-hint` → `muted`, `modal-err` → `error`: cả bốn đều là alias của
  class đã định nghĩa, không có style riêng nào bị mất khi đổi — kiểm chứng
  bằng computed style headed ở §3 (E5/E6).
- Không định nghĩa thêm class mới nào trong đợt này: 0 selector CSS mới.

## 2. Kiểm chứng tĩnh (chạy lại, 09/11/2026, từ gốc repo, esbuild bundle + node)

| Test | Kết quả |
|---|---|
| `escapeModals59P2.test.ts` (O1: 3 modal) | **26/26 pass** |
| `modalClasses59P4.test.ts` (O4: 5 class + sweep repo) | **33/33 pass** |
| `escapeForms60Q10.test.ts` (Q10: đóng hẳn + busy guard) | **15/15 pass** |
| `modalCard58O4.test.ts` (hồi quy modal-card/overlay) | **24/24 pass** |
| `welcomeEscape58O1.test.ts` (pattern gốc O1) | **9/9 pass** |
| `captionModal60Q3.test.ts` | **23 passed, 0 failed** |
| `silenceModal57N1.test.ts` | **11/11 pass** |
| `cssClasses60Q2.test.ts` (css60) | **59/59 pass** — không đổi expected list |
| `cssClasses61R4.test.ts` (css61) | **60/60 pass** — không đổi expected list |
| `i18nOrphans60Q4.test.ts` | **16/16 pass** |
| i18n dict | **2405 key, vi == en** (đếm flat) — không thêm/bớt key |
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `vite build` (apps/web) | **pass** (built 16.79s; cảnh báo chunk >500kB có sẵn, không liên quan đợt này) |

## 3. Click-test headed mới (09/11/2026, Chromium 1254 qua Xvfb + CDP)

Harness mới: `apps/web/scripts/clicktest-75c9-escape-classes.mjs` — phỏng theo
mẫu 59P2 nhưng cập nhật: Chromium **1254** (1248 không còn trên máy),
port/dev **5460–5469**, debug **9560–9569**, display **:175**, E4 theo quyết
định Q10, thêm E5/E6 đo computed style thật. Chạy 2 lần:

- Lần 1: **8/9** — E6 fail duy nhất do assertion harness quá chặt:
  Chromium mới serialize `justify-content: flex-end` thành `"flow-end"`
  (giá trị computed đúng theo spec mới, CSS sản phẩm không sai). Đã sửa
  harness chấp nhận cả hai dạng, không sửa CSS.
- Lần 2: **9/9 pass**, 0 lỗi trang trong phiên.

| Check | Kết quả đo thật |
|---|---|
| E1 Escape đóng TourCard (focus nút "Bỏ qua") | PASS — `tour=false` |
| E2 Escape đóng TemplatePackModal (focus nút ✕) | PASS — `pack=false` |
| E3 Escape đóng TemplatePicker gallery | PASS — `gallery=false form=false` |
| E4 Escape bước 2 ĐÓNG HẲN TemplatePicker (Q10) | PASS — `gallery=false form=false` |
| E5 CaptionModal: class có hiệu lực thật | PASS — `.modal` radius `14px`, bg `rgb(15, 19, 27)`, width `640px`; `.modal-backdrop` position `fixed`, bg `rgba(4, 6, 10, 0.7)`; `.modal-body .muted` color `rgb(139, 148, 169)`; rule `.modal-body .error` color `rgb(255, 123, 123)` (đọc qua CSSOM) |
| E5b Escape đóng CaptionModal (handler toàn cục App R1-107) | PASS — `caption=false` |
| E6 SilenceModal: class có hiệu lực thật | PASS — `.modal-body` padding `16px 18px`, font `13px`; `.modal-actions` display `flex`, justify `flow-end` (= flex-end); rule `.modal-ok` color `var(--ok, #4ade80)`; rule `.silence-list` `list-style: none` |
| E6b Escape đóng SilenceModal (App R1-107) | PASS — `silence=false` |
| E7 0 lỗi trang trong phiên | PASS |

Báo cáo JSON + screenshot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round75-c9/headed/c9-headed-report.json`
(ảnh `c9-*.png` cùng thư mục — chỉ là bằng chứng chạy, không đưa vào batch).

## 4. Giới hạn trung thực / nợ còn lại

1. **Đợt này không viết code sản phẩm** — O1/O4 đã đóng từ đợt 59/60. Nếu
   parent/gap analysis vẫn liệt O1/O4 là nợ mở thì đó là do § "Nợ mở lớn
   nhất (từ ROUND58 §6)" chưa được cập nhật sau đợt 59, không phải do code
   thiếu. Đề nghị cập nhật gap analysis § đó khi gộp đợt 75.
2. Test tĩnh 59P2/P4 chứng minh bất biến trên source, không mount React thật
   (repo không có jsdom; 3 modal kéo store/i18n). Bằng chứng động là
   headed 9/9 ở §3 — đủ bù cho điểm này trong phạm vi O1/O4.
3. `.modal-body .error` chỉ được đo qua CSSOM (rule tồn tại trong stylesheet
   trình duyệt đã load), không render `<p class="error">` thật lên màn hình
   trong phiên headed (cần trạng thái lỗi của CaptionModal/SilenceModal —
   ngoài phạm vi O1/O4). Rule có màu `#ff7b7b` và selector khớp đúng vị trí
   `<p>` trong `.modal-body` ở cả 3 modal, nên hiệu lực khi lỗi xuất hiện là
   suy ra chắc chắn từ cấu trúc DOM + CSSOM, không phải đoán.
4. Harness headed dùng display/port/scratch riêng (:175, 5460–5469,
   9560–9569) để không đụng các luồng đợt 75 khác; Chromium 1254 thay cho
   1248 đã ghi trong harness 59P2 (1248 không còn trên máy). Harness 59P2
   gốc không sửa.
5. `vite build` vẫn cảnh báo chunk JS 1,568.72 kB (>500 kB) — có sẵn từ
   trước, không do đợt này gây ra, không sửa trong phạm vi C9.

## 5. File trong batch (stage, không push)

- `apps/web/scripts/clicktest-75c9-escape-classes.mjs` (mới — harness headed re-probe 9/9)
- `docs/PHASE9_ROUND75_C9_ESCAPE_CLASSES_LIMITS.md` (mới — file này)

Không sửa file sản phẩm, không thêm key i18n, không đổi CSS, không binary,
không file `.github/workflows/*`.
