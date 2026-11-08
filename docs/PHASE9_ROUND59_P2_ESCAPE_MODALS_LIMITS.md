# Phase 9 — Đợt 59, luồng P2: Escape đóng TourCard / TemplatePackModal / TemplatePicker — LIMITS

Ngày: 07/11/2026 (~21:40–21:50 +07, lượt cron 21:35 +07).
Phạm vi: đóng nợ đợt 58 §6.2 (O1) — thống nhất Escape đóng modal cho
3 modal còn lại, theo đúng pattern chuẩn O1 của WelcomeModal
(`docs/PHASE9_ROUND58_O1_WELCOME_ESCAPE_LIMITS.md`). **Chỉ sửa 3 modal
này**, KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa
`vi.json`/`en.json` (không có chuỗi mới — chỉ comment code).

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Nợ 58 §6.2 | **Đóng.** Escape nay đóng cả 3 modal trên app thật. |
| Nguyên nhân gốc | Cả 3 modal đều không có keydown listener riêng; handler toàn cục của `App.tsx:355` chỉ đóng export/caption/silence/load-report, không có nhánh tour/pack/template. |
| Cách sửa | Thêm `useEffect` keydown tự chứa trong mỗi modal, đúng pattern O1 (guard INPUT/TEXTAREA/SELECT, không chặn BUTTON, cleanup `removeEventListener`, deps theo closure). |
| Test tĩnh mới | **26/26 pass** sau sửa; **7/26 trước sửa** (đỏ-trước, 19 check fail đúng thiết kế). |
| Click-test headed | **5/5 pass** sau sửa; **1/5 trước sửa** (E1–E4 fail: modal vẫn mở — tái hiện đúng bug). |
| Hồi quy | `tsc` apps/web **0 lỗi** (cả trước và sau khi thêm exclude); `vite build` **pass 6.28s**; test O1 cũ **9/9**, test M8 cũ **7/7**. |
| Focus trap | **Không có** focus trap trong cả 3 modal (grep `focusTrap\|trapFocus\|useFocusTrap` = 0, đã kiểm tra lại đợt này) nên không có gì để phá. |
| Double-close | **Không.** Handler toàn cục của App không chạm `tourOpen`/`packOpen`/`templateOpen`; mỗi Escape chỉ gọi đúng 1 đường đóng (xem §1). |

## 1. Cách sửa (3 file sản phẩm)

### 1.1 TourCard — Escape = nút ✕ / "Bỏ qua"

`apps/web/src/components/onboarding/TourCard.tsx` — thêm `useEffect`
keydown (file đã import sẵn `useEffect`):

```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
    if (e.key === "Escape") {
      onClose();
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [onClose]);
```

Quyết định: Escape gọi `onClose()` như nút ✕, **KHÔNG** gọi `finish()`.
`finish()` ghi `vcut-tour-done` — chỉ nút "Hoàn thành" (bước 5) mới làm
vậy; nút ✕ và "Bỏ qua" đều chỉ `onClose()` không đánh dấu. Escape mà
ghi tour-done thì sai đường đóng của nút đóng hiện có (user bỏ tour
giữa chừng nhưng hệ thống lại ghi là đã xem xong). Test tĩnh khóa cả
hai chiều: nhánh Escape có `onClose()` và **không** có `finish()` /
`TOUR_DONE_KEY`.

### 1.2 TemplatePackModal — Escape = nút ✕ / backdrop

`apps/web/src/components/onboarding/TemplatePackModal.tsx` — thêm
`import { useEffect }` + effect y hệt §1.1 (deps `[onClose]`).

Quyết định: **không chặn Escape khi đang tạo (busy)** — nút ✕ và
backdrop cũng không chặn, nên Escape giữ đúng parity. `create()` async
vẫn chạy nền sau khi modal unmount; `setState` trên component đã
unmount là no-op ở React 18+ (cùng hành vi với bấm ✕ giữa chừng, đã
có từ trước đợt này). Không thêm guard mới — việc chặn đóng khi busy
là thay đổi hành vi ngoài phạm vi nợ Escape, cần đợt riêng nếu parent
muốn.

### 1.3 TemplatePicker — Escape = nút ✕ của từng bước (quyết định cần đọc)

`apps/web/src/components/TemplatePicker.tsx` — thêm `import { useEffect }`
+ effect rẽ theo `selected` (deps `[onClose, selected]`):

```tsx
if (e.key === "Escape") {
  if (selected) {
    setSelected(null);
    setError(null);
  } else {
    onClose();
  }
}
```

**Đây là điểm duy nhất có 2 cách đọc, và đợt này chọn theo nút ✕:**
ở bước 2 (form điền placeholder), nút ✕ trên header KHÔNG đóng modal
mà là "quay lại danh sách" (`setSelected(null); setError(null);` —
title `templatePicker.backToList`); nút đóng hẳn modal ở bước 2 là
"Hủy". Nhiệm vụ yêu cầu "Escape gọi đúng handler đóng như nút đóng
hiện có" nên Escape ở bước 2 **quay lại gallery, không đóng hẳn**;
Escape lần 2 từ gallery mới đóng hẳn. Hành vi này đã được khóa bằng
test tĩnh (check `onClose()` nằm trong nhánh `else`, không nằm trong
nhánh `selected`) và headed E4 (lần 1: `gallery=true form=false`,
lần 2: `gallery=false form=false`).

Nếu parent muốn Escape ở bước 2 đóng hẳn modal luôn (bỏ qua bước
trung gian), đó là đổi 1 nhánh `if` trong effect trên + sửa 2 check
tĩnh (mục "bước 2" / "bước 1") và case headed E4 — không đụng gì khác.
Đợt này KHÔNG chọn cách đó vì nó làm Escape khác với nút ✕ đang hiện
trên cùng header.

Guard INPUT/TEXTAREA/SELECT có ý nghĩa thật ở bước 2 (form có input
text + select chọn media): Escape khi đang gõ trong ô nhập không làm
gì, đúng quy ước SceneModal/BeatSyncModal/WelcomeModal. Khi focus ở
nút trong form (vd nút "Tạo project từ mẫu"), Escape hoạt động — headed
E4 đã focus đúng nút này bằng `.focus()` rồi mới gửi Escape.

### 1.4 Không đụng `App.tsx`

Handler toàn cục của App vẫn chạy trước trên Escape (đóng
export/caption/silence/load-report, toàn no-op khi 3 modal này mở) và
không `stopPropagation`, nên listener của modal vẫn nhận phím. Không
cần thêm nhánh tour/pack/template vào App — sửa tự chứa trong modal là
đủ và khớp pattern O1. Cả 3 modal chỉ mở 1 cái tại 1 thời điểm
(`welcomeOpen` đóng trước khi mở tour/pack; `templateOpen` độc lập),
nên không có chuyện 2 listener Escape cùng chạy.

## 2. Kiểm chứng

### 2.1 Test tĩnh mới — đỏ-trước / xanh-sau

`apps/web/src/lib/escapeModals59P2.test.ts` (26 check, chạy bằng
esbuild bundle + node, theo mẫu O1 — repo không có jsdom nên không
mount React độc lập được; xem §4):

| Thời điểm | Kết quả |
|---|---|
| Trước sửa | **7/26 pass** — 19 check fail: thiếu import `useEffect` (Pack/Picker), thiếu `addEventListener`, thiếu nhánh Escape, thiếu cleanup, thiếu deps, thiếu guard INPUT/TEXTAREA/SELECT (7 check pass sẵn theo thiết kế: TourCard đã import `useEffect`, 3 check "không chặn BUTTON", 3 check hồi quy nút đóng cũ còn nguyên) |
| Sau sửa | **26/26 pass** |

Test khóa: đăng ký listener + nhánh `e.key === "Escape"` + đúng
đường đóng từng modal (TourCard: `onClose()` và **không** `finish()`;
PackModal: `onClose()`; Picker: bước 2 `setSelected(null)` +
`setError(null)`, bước 1 `onClose()` trong nhánh `else`) + cleanup +
deps (`[onClose]` cho Tour/Pack, `[onClose, selected]` cho Picker) +
guard input + không chặn BUTTON + nút đóng cũ còn nguyên (3 check hồi
quy). Trích nhánh Escape bằng đếm ngoặc nhọn cân bằng (nhánh Picker
chứa if/else lồng nhau, regex `[\s\S]*?}` sẽ cắt sai).

### 2.2 Click-test headed — đỏ-trước / xanh-sau (app thật)

Harness mới `apps/web/scripts/clicktest-59p2-escape-modals.mjs`
(vite dev + Chromium headed qua Xvfb + CDP, Node thuần, theo mẫu O1;
cổng riêng dev 5420/debug 9520, display riêng `:169`, config tạm tắt
HMR `/tmp/round59-p2/vite.p2.config.mjs`, profile Chrome mới mỗi lần
chạy → localStorage trống → WelcomeModal hiện lúc mount):

| Case | Trước sửa | Sau sửa |
|---|---|---|
| E1 Escape đóng TourCard (mở từ WelcomeModal → "🧭 Xem tour 5 bước", focus nút "Bỏ qua") | **FAIL** — sau Escape: `tour=true`, focus vẫn ở BUTTON "Bỏ qua" | **PASS** — `tour=false` |
| E2 Escape đóng TemplatePackModal (TopBar "👋 Bắt đầu" → "⚡ Tạo video 1 chạm", focus nút ✕) | **FAIL** — `pack=true` | **PASS** — `pack=false` |
| E3 Escape đóng TemplatePicker gallery (TopBar "🎬 Mẫu", focus nút ✕) | **FAIL** — `gallery=true` | **PASS** — `gallery=false form=false` |
| E4 Escape bước 2 quay lại gallery, Escape lần 2 đóng hẳn (chọn 1 template → form, focus nút "Tạo project từ mẫu") | **FAIL** — lần 1: `gallery=false form=true`; lần 2: `gallery=false form=true` | **PASS** — lần 1: `gallery=true form=false`; lần 2: `gallery=false form=false` |
| E5 0 lỗi trang trong phiên | PASS | PASS |
| **Tổng** | **1/5 (exit 1)** | **5/5 (exit 0)** |

Bằng chứng chạy: `hidden_files/round59-p2/headed/p2-headed-report.json`
+ `p2-*-before/after-escape*.png` + `p2-vite.log` / `p2-chrome.log`.
Lần chạy sau sửa dọn 1 socket X mồ côi `:169` (Xvfb cũ đã chết) —
harness tự xử lý, không ảnh hưởng kết quả. Trong lần chạy đỏ-trước,
harness từng lỗi 1 lần vì title nút TopBar "Bắt đầu" đoán sai
(`topbar.welcomeHint` thật là "Mở lại màn chào / tour / template pack
1 chạm", không phải "Mở lại màn chào") — đã sửa harness, không phải
lỗi sản phẩm; lần chạy đỏ-trước sau đó hoàn tất 1/5.

### 2.3 Hồi quy

- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi** (log
  `/tmp/round59-p2/tsc-after-exclude.log`, 0 byte; đã chạy lại sau khi
  thêm exclude).
- `vite build` apps/web: **pass, 6.28s** (cảnh báo chunk >500kB có
  sẵn, không phải do đợt này).
- Test O1 đợt 58 (`welcomeEscape58O1.test.ts`): **9/9 pass**.
- Test M8 đợt 56 (`onboardingOt56M8.test.ts`, render SSR cả 3 caller
  onboarding): **7/7 pass**.

## 3. i18n

**Không có fragment.** Đợt này không thêm/sửa bất kỳ chuỗi UI nào —
chỉ thêm comment code + logic keydown. Không sửa `vi.json`/`en.json`,
không tạo file `hidden_files/round59-p2-fragment.json` (không có gì
để gộp). Số key i18n giữ nguyên 1942 (mốc đợt 58).

## 4. Giới hạn trung thực

1. **Test tĩnh, không mount React thật.** Repo không có jsdom trong
   devDeps và cả 3 modal đều kéo store/i18n nên không bundle/mount
   độc lập bằng esbuild (cùng lý do test O1 đợt 58 dùng phương pháp
   tĩnh). Hành vi thật được chứng minh bằng click-test headed §2.2
   (Escape thật qua CDP trên app thật), không phải bằng test tĩnh.
2. **Chưa đo headed Escape khi focus đang ở trong input/select của
   TemplatePicker bước 2.** Guard bỏ qua INPUT/TEXTAREA/SELECT chỉ
   được khóa bằng test tĩnh §2.1; headed E4 cố tình focus nút (không
   phải input) để chứng minh nhánh đóng. Về lý thuyết guard chạy đúng
   vì cùng code với O1, nhưng chưa có case headed nào gửi Escape khi
   focus trong ô nhập của form.
3. **Chưa click-test headed Escape khi TemplatePackModal đang busy
   (đang tạo pack).** Chỉ có parity lập luận ở §1.2 (✕/backdrop cũng
   không chặn) — chưa đo thật vì tạo pack cần ghi media mẫu + import
   file, ngoài phạm vi harness Escape.
4. **Chưa đo Escape khi 2 modal chồng nhau** (vd TourCard mở trong lúc
   WelcomeModal chưa đóng). Theo code App chỉ 1 modal trong 3 mở tại
   1 thời điểm (welcome đóng trước khi mở tour/pack), nên trường hợp
   này không xảy ra bằng UI hiện tại; không có case headed cho nó.
5. **`vite build` tạo `dist/`** trong lúc kiểm chứng — không đưa vào
   batch (chỉ stage file text liệt kê ở §5).
6. **Xung đột tiềm ẩn với luồng song song đợt 59:** đợt này sửa
   `apps/web/tsconfig.json` (thêm 1 dòng exclude, quy ước repo).
   Nếu luồng P khác của đợt 59 cũng sửa cùng file thì parent gộp cần
   giữ cả 2 dòng exclude — file này chỉ có 1 dòng đổi duy nhất từ
   luồng P2.

## 5. Nợ mở (cho đợt sau)

1. **Quyết định chờ parent (xem §1.3):** Escape ở bước 2 của
   TemplatePicker hiện quay lại gallery như nút ✕. Nếu parent muốn
   Escape đóng hẳn modal luôn thì sửa 1 nhánh `if` + 2 check tĩnh +
   case headed E4.
2. **Nợ đợt 57 §6.1(b) vẫn mở:** sau reload, autosave khôi phục spec
   nhưng mất media mẫu (O2 đợt 58 kết luận bin trống là đúng thiết
   kế rehydrate theo spec; bug thật kề bên đã sửa) — P2 không đụng tới.
3. **Nợ đợt 58 §6 còn lại giữ nguyên** (thiết kế bin theo spec, class
   chưa định nghĩa còn sót, các nợ khác trong LIMITS tổng hợp đợt 58).
4. Headed case còn thiếu (ghi ở §4.2, §4.3): Escape khi focus trong
   input/select form Picker; Escape khi PackModal đang busy.

## 6. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/components/onboarding/TourCard.tsx` | Sửa | `useEffect` keydown Escape → `onClose()` (không `finish()`), guard input, cleanup |
| `apps/web/src/components/onboarding/TemplatePackModal.tsx` | Sửa | Thêm `useEffect` import + keydown Escape → `onClose()`, guard input, cleanup |
| `apps/web/src/components/TemplatePicker.tsx` | Sửa | Thêm `useEffect` import + keydown Escape rẽ theo `selected` (bước 2 về gallery, bước 1 `onClose()`), guard input, cleanup |
| `apps/web/src/lib/escapeModals59P2.test.ts` | Mới | Test tĩnh 26 check (đỏ-trước 7/26, xanh-sau 26/26) |
| `apps/web/tsconfig.json` | Sửa | Thêm 1 dòng exclude cho test mới (quy ước repo) |
| `apps/web/scripts/clicktest-59p2-escape-modals.mjs` | Mới | Harness headed E1–E5 (đỏ-trước 1/5, xanh-sau 5/5) |
| `docs/PHASE9_ROUND59_P2_ESCAPE_MODALS_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round59-p2-escape-modals.txt` — 7 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag. `dist/` (vite
build kiểm chứng) và bằng chứng headed (`hidden_files/round59-p2/`)
không stage theo quy ước.
