# PHASE9 ROUND 57 N3 — TIPGONE LIMITS

Đợt 57, luồng N3: đóng nợ LIMITS đợt 56 §4.3 — nhánh `tipGone` của
`EnhancePanel` là nhánh chết qua UI thật. Ngày 2026-11-07.
**KHÔNG push, KHÔNG release/tag, KHÔNG sửa vi.json/en.json trực tiếp.**

## 0. Kết quả tổng — NỢ ĐÃ ĐÓNG: nhánh tipGone nay ĐO ĐƯỢC qua UI thật

| Nhánh | Verdict | Tóm tắt |
|---|---|---|
| (A) control clip thật, không probe | **PASS** | Inspector hiện panel video + section Enhance, không tipGone, không marker probe |
| (B) control ghost, không probe | **PASS** | Tái hiện đúng nợ M9: ghost → ProjectInfo, không tipGone trong DOM, `.mask-panel`=0 |
| (C) probe + ghost, EN | **PASS** | tipGone hiện đúng EN từng chữ: `"The clip no longer exists."` |
| (D) probe + ghost, VI | **PASS** | tipGone hiện đúng VI từng chữ: `"Clip không còn tồn tại."` |
| (E) probe + clip thật | **PASS** | Panel video thường, nhắc Enhance, không tipGone, không marker probe |
| (H) 0 lỗi trang | **PASS** | Không có `window.onerror` / `unhandledrejection` trong phiên |

Tổng probe headed (lượt cuối, run #4): **6 PASS / 0 FAIL / 0 KHÔNG ĐO ĐƯỢC**.

## 1. Thay đổi code (ít xâm lấn nhất, đúng phương án task cho phép)

**`apps/web/src/Inspector.tsx`** — duy nhất 1 chỗ sửa, trong gate
`if (!track || !clip)` (dòng ~196, vốn `return <ProjectInfo />`):

- Chỉ khi URL có `?vcut-probe=enhance-tipgone` thì gate render
  `<EnhancePanel />` trực tiếp trong `<div className="inspector"
  data-tour="inspector" data-probe="enhance-tipgone">`; `EnhancePanel`
  tự rơi vào nhánh `!track || !clip` → `t("keyframe.tipGone")`.
- Không có param → hành vi cũ (`<ProjectInfo />`), không đổi gì cho
  người dùng thường. Param chỉ có tác dụng khi selection trỏ clip
  không tồn tại; clip thật không bị ảnh hưởng (verdict E).
- `EnhancePanel.tsx` **không cần sửa** (nhánh tipGone đã đúng sẵn, chỉ
  thiếu đường tới). Các panel khác trong Inspector không đụng (test
  khóa: khối probe chỉ chứa `<EnhancePanel />`, tổng cộng đúng 2 chỗ
  render `EnhancePanel` trong file).

**Không chọn phương án xóa nhánh chết**, vì:
- Key `keyframe.tipGone` dùng chung với `KeyframePanel.tsx:112`
  (cũng sau cùng gate Inspector, cũng chết qua UI) — xóa key sẽ vỡ
  panel kia, mà task cấm sửa trực tiếp vi.json/en.json nên không dọn
  key sạch được.
- Guard `!track || !clip` trong `EnhancePanel` (và các panel anh em
  `MaskPanel`/`MotionPanel`/`KeyframePanel`) là phòng thủ rẻ tiền cho
  bất biến "selection luôn trỏ clip tồn tại" — bất biến này hiện chỉ
  được giữ bằng quy ước ở ~10 call site trong store (xem §2), không
  có choke point duy nhất, nên giữ guard an toàn hơn xóa.

## 2. Vì sao nhánh chết qua UI thật (chứng minh bằng code + đo)

- `EnhancePanel` chỉ có 1 render site: `Inspector.tsx:378`, trong
  section video, sau gate `if (!track || !clip) return <ProjectInfo />`.
  Ghost selection không bao giờ tới được `EnhancePanel`.
- Store giữ bất biến selection→clip-tồn-tại bằng quy ước, không bằng
  enforce: `deleteSelection` truyền `nextSelection=[]` cho
  `execCommand`; `deleteClipRipple` / các path tách/trim lọc selection
  theo clipId đã xóa; `loadSample`/`newProject`/`loadProject` set
  `selection: []`; undo/redo khôi phục cặp spec+selection cùng
  snapshot. Không tìm thấy path nào trong store hiện tại để lại
  selection mồ côi — nhưng cũng không có điểm chặn duy nhất nào
  bảo đảm điều đó cho code tương lai. Đây là lý do giữ guard thay vì
  xóa nhánh (xem §1).
- Dict đã đủ (không còn nợ M9 §2): sau merge cuối đợt 56, cả 2 dict
  đều 1722 key; `keyframe.tipGone` đúng từng chữ cả 2 ngôn ngữ
  (EN `"The clip no longer exists."`, VI `"Clip không còn tồn tại."`),
  và đủ 16 key `enhance.*` mà `EnhancePanel` dùng (kiểm chứng bằng
  script lúc 15:5x 07/11 — lưu ý M9 đo lúc dict chưa gộp nên
  `enhance.*` khi đó hiện raw key; nay đã gộp xong).

## 3. Kiểm chứng

- **Test mới** `apps/web/src/lib/tipgoneProbe57N3.test.ts` (mẫu esbuild
  L2/M3): **4/4 pass** — gate có đường probe dev-only sau
  `if (!track || !clip)`, hành vi mặc định vẫn `ProjectInfo`, khối
  probe chỉ render `EnhancePanel`, `EnhancePanel` giữ
  `t("keyframe.tipGone")` không literal cứng, dict đúng từng chữ,
  key còn được `KeyframePanel` dùng chung.
- **tsc --noEmit**: 3 lỗi, **toàn bộ trong file luồng khác**
  `src/lib/loadReport57N7.test.ts` (import `.ts` + type không export)
  — không sửa file họ; file của N3 (`Inspector.tsx`,
  `tipgoneProbe57N3.test.ts`, `EnhancePanel.tsx`) sạch 0 lỗi.
  Lưu ý: vì tsc lỗi do file N7 nên `npm run build` (tsc && vite
  build) sẽ fail ở bước tsc cho đến khi N7 sửa file họ.
- **vite build** (chạy trực tiếp, bỏ qua tsc): pass, built in 12.69s.
- **Probe headed** `~/scratch-round57-n3/clicktest-57n3-tipgone.mjs`
  (tái dùng pattern CDP của M9/clicktest-55l1; vite đóng băng
  hmr:false + watch ignored; Chromium headed qua Xvfb display :161;
  dev :5370, debug :9470; TMPDIR riêng): **6/6 PASS** (run #4,
  2026-11-07 08:55 UTC, exit 0). Snapshot code lúc đo (sha256-16):
  `Inspector.tsx` aa2ba44d…, `EnhancePanel.tsx` 63ba42f7… (không đổi
  từ lúc M9 đo), `en.json` 8535f66c…, `vi.json` f8d4e2fe….
- Bằng chứng (log JSON + 6 screenshot) tại
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round57-n3/`:
  `n3-headed-report.json`, `n3-topbar-en.png`,
  `n3-a-real-clip-no-probe.png`, `n3-b-ghost-no-probe.png`,
  `n3-c-ghost-probe-en.png` (Inspector phải hiện đúng
  `"The clip no longer exists."` — đã xem ảnh xác nhận),
  `n3-d-ghost-probe-vi.png`, `n3-e-real-clip-probe.png`.
  Harness + config đóng băng tại `~/scratch-round57-n3/`
  (không đưa vào stage).

## 4. Lỗi harness đã bắt và sửa trong lúc đo (ghi để khỏi hiểu nhầm log cũ)

1. **Run #1, 2 FAIL giả ở (A)/(E)**: harness check chuỗi `"enhance"`
   trên `inspectorText` đã slice 600 ký tự — panel video dài, section
   Enhance nằm cuối nên bị cắt trước khi tới. Sửa: check trên toàn bộ
   `innerText` (`inspectorHasEnhance`). Không phải lỗi sản phẩm.
2. **Run #2, (E) FAIL giả tiếp**: (E) chạy sau khi đã chuyển sang VI
   nên section tên `"Tăng cường video"`, không chứa `"enhance"`. Sửa:
   chấp nhận cả `"enhance"` lẫn `"tăng cường"`. Không phải lỗi sản phẩm.
3. **Run #3, harness lỗi (exit 2)**: `CDP.send timeout 60s` sau khi
   X connection của Chrome báo lỗi (`X connection error received`
   08:52:54, Xvfb :161) — không rõ nguyên nhân gốc (nghi transient;
   cùng thời điểm có Xvfb :181 của luồng khác đang chạy, nhưng display
   khác nhau). Chạy lại nguyên harness (run #4) thì xanh hết, không
   đổi code. Report JSON của run #3 (dạng error) đã bị run #4 ghi đè
   bằng report PASS cuối.

## 5. Hạn chế / nợ còn mở (không thuộc phạm vi N3)

- Nhánh `!primary` (`enhance.selectClip`) và nhánh `clip.kind !==
  "video"` (`enhance.videoOnly`) của `EnhancePanel` cũng chết qua UI
  thật theo cùng cơ chế (Inspector chặn trước) — chưa mở đường đo
  cho 2 nhánh này; probe `?vcut-probe=enhance-tipgone` hiện chỉ phủ
  nhánh tipGone. Nếu cần, mở rộng cùng pattern (param khác hoặc cùng
  param + selection rỗng / clip audio).
- Các panel anh em (`KeyframePanel`/`MaskPanel`/`MotionPanel`) có
  nhánh tipGone tương tự, cũng chết qua UI thật — chưa mở đường đo;
  key `keyframe.tipGone`/`mask.tipGone`/`motion.tipGone` vẫn cần giữ
  vì các panel đó còn dùng.
- `tsc` toàn repo còn 3 lỗi do file test của luồng N7
  (`loadReport57N7.test.ts`) — ngoài phạm vi N3, không sửa.
- Trong lúc N3 đo, một luồng round-57 khác (N9) cũng chạy probe
  headed và dùng trùng cổng dev 5370 / debug 9470 (pattern M9) —
  không xung đột với lượt đo cuối của N3 (N9 khởi động sau khi N3
  xong), nhưng các luồng sau nên pick cổng/display riêng để tránh
  va chạm.

## 6. Stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round57-n3-tipgone.txt`
(3 entry, NUL cuối, verify read-back, toàn file text):

- `apps/web/src/Inspector.tsx` (đường probe dev-only)
- `apps/web/src/lib/tipgoneProbe57N3.test.ts` (test mới 4/4)
- `docs/PHASE9_ROUND57_N3_TIPGONE_LIMITS.md` (file này)

Không stage: `EnhancePanel.tsx` (không đổi), harness
`~/scratch-round57-n3/` + bằng chứng `hidden_files/round57-n3/`
(nằm ngoài repo, theo mẫu M9).
