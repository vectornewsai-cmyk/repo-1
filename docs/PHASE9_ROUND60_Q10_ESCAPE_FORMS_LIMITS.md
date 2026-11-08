# Phase 9 — Đợt 60, luồng Q10: Escape ở form Picker + PackModal busy + TemplatePicker bước 2 — LIMITS

Ngày: 07/11/2026 (~17:44–17:47 +07, lượt cron 00:35 +07 08/11).
Phạm vi: đóng nợ đợt 59 §6.8 (P2) — 3 việc còn thiếu sau đợt 59 P2
(`docs/PHASE9_ROUND59_P2_ESCAPE_MODALS_LIMITS.md` §4.2, §4.3, §5.1):
(a) đo headed thật Escape khi focus trong input/select của form
TemplatePicker bước 2 + Escape khi TemplatePackModal đang busy;
(b) quyết định + triển khai Escape ở bước 2 TemplatePicker;
(c) test tĩnh mở rộng cho các case mới. **Chỉ sửa 2 modal này**,
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa `vi.json`/
`en.json` (không có chuỗi UI mới — chỉ comment code + logic keydown),
KHÔNG đụng `CaptionModal.tsx` (luồng Q3 sở hữu).

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Nợ 59 §6.8 (a) — đo headed input/select | **Đóng, không cần sửa.** Guard INPUT/TEXTAREA/SELECT hoạt động thật: Escape khi focus trong input text (F1) và trong select (F2) đều không làm gì, form vẫn mở. |
| Nợ 59 §6.8 (a) — đo headed PackModal busy | **Đóng, PHẢI SỬA và đã sửa.** Trước sửa, Escape lúc busy đóng modal trong khi job tạo pack vẫn chạy nền (hành vi P2 giữ theo parity ✕/backdrop). Nay Escape bị chặn lúc busy/ttsBusy; nút ✕ disabled và backdrop vô hiệu cùng lúc để chuột không lách qua cùng lỗ hổng. |
| Nợ 59 §6.8 (b) — quyết định bước 2 | **Đổi quyết định P2: Escape ở bước 2 ĐÓNG HẲN modal** (onClose()), không quay lại gallery nữa. Lý do ở §1.3. Nút ← quay lại gallery vẫn còn nguyên để bấm chuột. |
| Test tĩnh mới | **15/15 pass** sau sửa; **8/15 trước sửa** (đỏ-trước, 7 check hành vi mới fail đúng thiết kế). |
| Test tĩnh P2 cũ (đã cập nhật 5 check theo Q10) | **26/26 pass** sau sửa; **21/26 giữa chừng** (sau khi sửa code, trước khi cập nhật test — đúng 5 check hành vi cũ fail). |
| Click-test headed mới | **6/6 pass** ngay lần chạy đầy đủ đầu tiên (sau 1 lần harness lỗi do escape lồng nhau trong FOCUS_INPUT_FN — lỗi harness, không phải lỗi sản phẩm; xem §2.2). |
| Hồi quy | Test O1 đợt 58 **9/9**; `vite build` **pass 30.79s** (chỉ cảnh báo chunk >500kB có sẵn). `tsc` repo-wide hiện có lỗi ở file test của luồng Q khác đang chạy song song (xem §2.3) — **0 lỗi trong mọi file Q10**. |

## 1. Cách sửa (2 file sản phẩm) + 2 quyết định

### 1.1 TemplatePicker — Escape bước 2 nay đóng hẳn (đổi quyết định P2)

`apps/web/src/components/TemplatePicker.tsx` — effect keydown bỏ nhánh
rẽ theo `selected`, cả 2 bước đều `onClose()`; deps `[onClose, selected]`
→ `[onClose]`:

```tsx
if (e.key === "Escape") {
  onClose();
}
```

**Lý do đổi (ghi rõ để parent khỏi hỏi lại):** P2 chọn "quay lại
gallery" với lập luận Escape = nút ✕ của từng bước, nhưng nút trên
header bước 2 KHÔNG phải ✕ mà là ← (điều hướng "quay lại danh sách",
`title=templatePicker.backToList`). Đường đóng thật của bước 2 là nút
"Hủy" (`common.cancel` → `onClose()`) và click backdrop (cũng
`onClose()`). Escape là phím dismiss toàn cục nên phải bằng "Hủy" =
đóng hẳn mới nhất quán; gán Escape cho ← là lẫn lộn điều hướng với
đóng modal (user bấm Escape mong modal biến mất, không mong bị đẩy
về 1 bước trung gian). Nút ← vẫn còn nguyên — quay lại gallery bằng
chuột vẫn được, chỉ Escape không làm việc đó nữa. Đây đúng là nhánh
`if` 1 dòng mà P2 đã dự báo ở LIMITS §1.3/§5.1.

### 1.2 TemplatePackModal — chặn đóng khi busy/ttsBusy (đổi quyết định P2)

`apps/web/src/components/onboarding/TemplatePackModal.tsx` — 3 chỗ
cùng 1 điều kiện `busy || ttsBusy`:

```tsx
// Escape: chặn
if (e.key === "Escape") {
  if (busy || ttsBusy) return;
  onClose();
}
// ... deps [onClose, busy, ttsBusy]
// nút ✕: disabled={busy || ttsBusy}
// backdrop: onClick={busy || ttsBusy ? undefined : onClose}
```

**Lý do đổi (ghi rõ):** P2 giữ parity "✕/backdrop cũng không chặn nên
Escape cũng không chặn", nhưng parity đó giữ lại 1 lỗ hổng thật:
`create()` / `makeTts()` KHÔNG hủy được an toàn —
`generatePackFiles` / `recordPackMedia` / `importFiles` không nhận
`AbortSignal`. Đóng modal giữa chừng thì job vẫn chạy nền:
`replaceProject()` đã áp spec mới + media tiếp tục import sau lưng
user (user tưởng đã hủy nhưng project đã bị thay). Chặn đóng lúc busy
là pattern modal chuẩn (disable dismiss while busy). Chặn cả 3 đường
(Escape + ✕ + backdrop) cùng lúc vì chỉ chặn Escape thì user vẫn lách
được bằng chuột qua đúng lỗ hổng đó — sửa nửa vời.

**Vì sao chặn cả `ttsBusy` (không chỉ `busy`):** `makeTts()` cũng
`importFiles()` 1 file WAV mới vào kho sau khi POST TTS xong; đóng
modal lúc đó cũng để lại import chạy nền + `addMediaAtPlayhead` sau
lưng user. Cùng 1 điều kiện, cùng 1 lý do, không thêm code.

**Vì sao không kẹt modal:** `create()` và `makeTts()` đều reset
`busy`/`ttsBusy` trong `finally{}` trên mọi đường (thành công hay lỗi)
— job luôn kết thúc rồi Escape lại hoạt động. `generatePackFiles` có
thể throw `PackError("NO_RECORDER")` khi thiếu MediaRecorder, vẫn đi
qua `finally`. Không có đường nào treo `busy=true` vĩnh viễn trong
code hiện tại (xem §4.4).

### 1.3 Không đụng `App.tsx`, không đụng `TourCard.tsx`

Handler toàn cục của App vẫn không có nhánh pack/template; listener
tự chứa trong modal là đường Escape duy nhất (như P2). TourCard không
có input/select nên không thuộc phạm vi nợ này.

## 2. Kiểm chứng

### 2.1 Test tĩnh mới — đỏ-trước / xanh-sau

`apps/web/src/lib/escapeForms60Q10.test.ts` (15 check, esbuild bundle +
node, mẫu P2/O1):

| Thời điểm | Kết quả |
|---|---|
| Trước sửa | **8/15 pass** — 7 check hành vi mới fail đúng thiết kế (Picker: nhánh Escape còn `setSelected(null)`, deps còn `[onClose, selected]`; PackModal: nhánh Escape chưa kiểm tra `busy`/`ttsBusy`, ✕ chưa disabled, backdrop chưa vô hiệu, deps chưa có `busy`/`ttsBusy`) |
| Sau sửa | **15/15 pass** |

Test khóa: Picker bước 2 `onClose()` + KHÔNG `setSelected(null)`/
`setError(null)`/rẽ `selected` trong nhánh Escape + deps `[onClose]` +
nút ← và nút Hủy còn nguyên; PackModal nhánh Escape kiểm tra cả `busy`
và `ttsBusy` + ✕ `disabled={busy || ttsBusy}` + backdrop
`onClick={busy || ttsBusy ? undefined : onClose}` + deps
`[onClose, busy, ttsBusy]` + `finally` reset cả 2 cờ + guard
INPUT/TEXTAREA/SELECT + cleanup còn nguyên ở cả 2 file.

### 2.2 Click-test headed — 6/6 pass (app thật)

Harness mới `apps/web/scripts/clicktest-60q10-escape-forms.mjs`
(vite dev + Chromium headed qua Xvfb + CDP, Node thuần, theo mẫu P2;
cổng riêng dev 5430/debug 9530, display riêng `:170`, config tạm tắt
HMR `/tmp/round60-q10/vite.q10.config.mjs`, profile Chrome mới mỗi lần
chạy → localStorage trống → WelcomeModal hiện lúc mount):

| Case | Kết quả sau sửa |
|---|---|
| F1 Escape khi focus trong input text của form bước 2 (card đầu "Bìa album": input tên album) | **PASS** — sau Escape: `gallery=false form=true`, focus vẫn ở `INPUT` |
| F2 Escape khi focus trong select của form bước 2 (select ảnh bìa) | **PASS** — sau Escape: `gallery=false form=true`, focus vẫn ở `SELECT` (giá trị hiện "(mặc định: album-cov…") |
| F3 Escape khi focus nút "Tạo project từ mẫu" ở bước 2 | **PASS** — sau Escape: `gallery=false form=false` — **đóng hẳn, không về gallery** (hành vi mới Q10, đo thật) |
| F4a Escape khi PackModal đang busy (bấm "Tạo ngay" pack thứ 2 "Intro YouTube", video 5s → cửa sổ busy ~6.5s; poll 200ms bắt được busy ngay) | **PASS** — sau Escape: `pack=true busy=true closeDisabled=true` (nút ✕ disabled thật lúc busy) |
| F4b Escape sau khi tạo xong (nút "▶ Xem ngay" hiện) | **PASS** — sau Escape: `pack=false` |
| F5 0 lỗi trang trong phiên | **PASS** |
| **Tổng** | **6/6 (exit 0)** |

Bằng chứng chạy: `hidden_files/round60-q10/headed/q10-headed-report.json`
+ `q10-*-before/after-escape*.png` + `q10-vite.log` / `q10-chrome.log`.
Thời gian: vite lên ~4s, app mount ~29s (VM đang tải, loadavg 4.26),
pack tạo xong sau ~6.5s kể từ lúc bấm tạo (5s ghi MediaRecorder +
import). Lần chạy đầy đủ đầu tiên đã 6/6 — trước đó harness lỗi 1 lần
do escape lồng nhau trong chuỗi `FOCUS_INPUT_FN` (`input[type=\"text\"]`
trong template literal sinh ra JS sai khi `Runtime.evaluate` parse —
lỗi harness, đã sửa bằng nháy đơn, không phải lỗi sản phẩm; xem §4.5).
Trong lần chạy đó harness dọn 1 socket X mồ côi `:170` (Xvfb cũ đã
chết) — harness tự xử lý, không ảnh hưởng kết quả.

**Không có lần chạy đỏ-trước headed** cho F3/F4a: hành vi cũ đã được
chứng minh bằng code (P2 ghi rõ nhánh cũ + parity cũ trong LIMITS
§1.2/§1.3) và test tĩnh đỏ-trước §2.1 khóa đúng 2 nhánh đó; chạy lại
headed trên code cũ chỉ để tái hiện điều đã biết nên không chạy (tiết
kiệm 1 lượt vite+Chrome dưới tải VM). Ghi rõ ở đây để không nhận vơ.

### 2.3 Hồi quy

- Test P2 đợt 59 (`escapeModals59P2.test.ts`, đã cập nhật 5 check theo
  Q10 — 2 check bước 2 Picker, deps Picker, deps PackModal, hồi quy
  ✕/backdrop PackModal): **26/26 pass** (giữa chừng, sau khi sửa code
  nhưng trước khi cập nhật test: **21/26** — đúng 5 check hành vi cũ
  fail, đã cập nhật xong).
- Test O1 đợt 58 (`welcomeEscape58O1.test.ts`): **9/9 pass**.
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi trong mọi file
  Q10** (grep 2 lần chạy: không có lỗi nào ở `TemplatePicker`,
  `TemplatePackModal`, `escapeForms60Q10`, `escapeModals59P2`).
  **Lưu ý trung thực:** `tsc` repo-wide lúc chạy KHÔNG sạch — lần 1 có
  lỗi ở `gopTrialDecode60Q5.test.ts` (luồng Q5), lần 2 có 13 lỗi ở
  `cssClasses60Q2.test.ts` (luồng Q2). Đó là file test của luồng đợt 60
  khác đang chạy song song và sửa dở lúc tsc chạy (lỗi đổi file giữa
  2 lần chạy), KHÔNG phải do Q10 và Q10 không đụng tới. Parent gộp
  cần chạy lại `tsc` sau khi các luồng khác xong việc.
- `vite build` apps/web: **pass, 30.79s** (chỉ cảnh báo chunk >500kB
  có sẵn, không phải do đợt này).

## 3. i18n

**Không có fragment.** Đợt này không thêm/sửa bất kỳ chuỗi UI nào —
chỉ comment code + logic keydown + thuộc tính `disabled`/`onClick`.
Không sửa `vi.json`/`en.json`, không tạo file
`hidden_files/round60-q10-fragment.json` (không có gì để gộp).

## 4. Giới hạn trung thực

1. **Test tĩnh, không mount React thật** (cùng giới hạn P2/O1: repo
   không có jsdom, modal kéo store/i18n). Hành vi thật được chứng
   minh bằng click-test headed §2.2, không phải bằng test tĩnh.
2. **Chưa đo Escape khi dropdown native của select đang mở.** F2 chỉ
   focus select (dropdown chưa mở) rồi gửi Escape — guard trả về
   đúng. Nếu user mở dropdown native rồi bấm Escape, trình duyệt có
   thể nuốt phím để đóng dropdown trước khi event tới listener; kết
   quả cuối vẫn là modal không đóng (cả 2 đường đều giữ modal mở)
   nên không phải bug, nhưng chưa đo thật case này.
3. **Chưa đo Escape khi `makeTts()` đang busy (`ttsBusy`).** Guard
   `ttsBusy` chỉ được khóa bằng test tĩnh §2.1 (cùng 1 nhánh `if`
   với `busy` đã đo headed ở F4a). Đo headed cần bridge TTS chạy
   thật + đợi POST xong — ngoài phạm vi harness Escape; nếu parent
   muốn, đợt sau đo riêng với bridge local.
4. **Chặn đóng lúc busy dựa vào `finally` luôn chạy.** Nếu
   `recordPackMedia` treo vĩnh viễn (MediaRecorder `onstop` không
   bao giờ fire — chưa từng quan sát), modal sẽ kẹt không đóng được
   bằng Escape/✕/backdrop cho tới khi reload. Đây là rủi ro có sẵn
   của job không-timeout, không phải do Q10 tạo ra; Q10 chỉ làm nó
   lộ ra (trước đây user đóng được modal nhưng job vẫn chạy nền).
   Đợt sau có thể thêm timeout cho `recordPackMedia` nếu parent muốn.
5. **Harness từng lỗi 1 lần do escape lồng nhau** (`FOCUS_INPUT_FN`
   dùng `\"` trong template literal) — đã sửa bằng nháy đơn, lần
   chạy đầy đủ sau đó 6/6. Lỗi harness, không phải lỗi sản phẩm.
6. **`vite build` tạo `dist/`** trong lúc kiểm chứng — không đưa vào
   batch (chỉ stage file text liệt kê ở §5).
7. **Xung đột tiềm ẩn với luồng song song đợt 60:** đợt này sửa
   `apps/web/tsconfig.json` (thêm 1 dòng exclude, quy ước repo).
   Nếu luồng Q khác của đợt 60 cũng sửa cùng file thì parent gộp cần
   giữ tất cả các dòng exclude — file này Q10 chỉ đổi 1 dòng duy
   nhất. Tương tự, file `escapeModals59P2.test.ts` là file chung với
   đợt 59 — Q10 đã sửa 5 check trong đó; luồng khác không nên sửa
   cùng file mà không đối chiếu.

## 5. Nợ mở (cho đợt sau)

1. **Nợ đợt 59 §6.8 đã đóng hết** (cả 3 việc a/b/c). Nợ còn lại từ
   P2 §5.2–§5.3 giữ nguyên: nợ đợt 57 §6.1(b) (autosave mất media
   mẫu sau reload), nợ đợt 58 §6 còn lại, 30 class CSS chưa định
   nghĩa (đợt 60 luồng khác có thể đang làm).
2. Đo headed Escape khi dropdown select đang mở (§4.2) và khi
   `ttsBusy` (§4.3) — cần bridge TTS cho case sau.
3. Cân nhắc timeout cho `recordPackMedia` để job busy không treo
   vĩnh viễn (§4.4).
4. `tsc` repo-wide cần chạy lại sau khi các luồng đợt 60 khác xong
   việc (§2.3).

## 6. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/components/TemplatePicker.tsx` | Sửa | Escape bước 2 đóng hẳn (`onClose()` cả 2 bước), deps `[onClose]` |
| `apps/web/src/components/onboarding/TemplatePackModal.tsx` | Sửa | Escape/✕/backdrop chặn khi `busy \|\| ttsBusy`; deps `[onClose, busy, ttsBusy]` |
| `apps/web/src/lib/escapeForms60Q10.test.ts` | Mới | Test tĩnh 15 check (đỏ-trước 8/15, xanh-sau 15/15) |
| `apps/web/src/lib/escapeModals59P2.test.ts` | Sửa | Cập nhật 5 check theo hành vi Q10 mới (26/26) |
| `apps/web/tsconfig.json` | Sửa | Thêm 1 dòng exclude cho test mới (quy ước repo) |
| `apps/web/scripts/clicktest-60q10-escape-forms.mjs` | Mới | Harness headed F1–F5 (6/6 pass) |
| `docs/PHASE9_ROUND60_Q10_ESCAPE_FORMS_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round60-q10-escape-forms.txt` — 7 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag. `dist/` (vite
build kiểm chứng) và bằng chứng headed (`hidden_files/round60-q10/`)
không stage theo quy ước.
