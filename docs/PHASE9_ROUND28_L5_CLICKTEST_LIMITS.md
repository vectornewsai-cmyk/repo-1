# Phase 9 đợt 28, luồng L5 — Click-test nốt K6: locale en + mốc âm/sâu + NaN (nợ đợt 27 §3.5) — LIMITS

Ngày: 2026-10-31 (lượt cron 08:03, chạy thực tế buổi sáng theo giờ
Asia/Saigon). Luồng L5 trong đợt lớn round 28. KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào repo, KHÔNG code giả, KHÔNG sửa code
sản phẩm (không phát hiện bug thật nào — mọi case đều pass trên UI
thật, xem §5 về 2 timeout hồi quy lần 1), KHÔNG stage batch (parent
gộp), KHÔNG tự ghi build-loop-log. Chỉ đo trên browser thật.

Đóng nợ docs/PHASE9_ROUND27_K6_CLICKTEST_LIMITS.md §7: (1) câu guard
mốc rỗng ở phiên en chưa bấm thật, (2) mốc âm / trước cửa sổ ở chain
sâu qua panel chưa bấm riêng (store đã khóa cả hai hướng), (3) NaN
qua UI không tạo được (chưa có bảng đường đã thử).

## 0. Kết luận ngắn (không vượt số đo)

1. **Guard mốc rỗng ở locale en — PASS, msg đúng từng chữ:**
   `No outer time entered (the field is empty) — not split.`, 0 toast
   chứa câu guard (lúc đọc toasts = []), không key thô, không rò vi,
   spec không đổi, Ctrl+Z no-op. Nợ (1) của K6 đã đóng. Xem §1.
2. **Mốc âm và mốc trước cửa sổ ở chain sâu qua panel — PASS cả hai
   hướng, cả hai độ sâu:** "-1" ở chain 2 tầng (TOP-NEG2) và 3 tầng
   (TOP-NEG3) đều chặn OutOfRange (msg + toast); "9.9" dương nhưng
   trước cửa sổ (fixture mới top start=10, cửa sổ bắt đầu ở 10) ở cả
   2 tầng và 3 tầng cũng chặn OutOfRange. Lá còn 1, spec không đổi,
   Ctrl+Z no-op ở cả 4 case. Nợ (2) của K6 đã đóng ở phiên vi; phiên
   en đã bấm thêm mốc âm 2 tầng (msg + toast en OutOfRange đúng).
   Xem §2.
3. **NaN qua UI — KẾT LUẬN: không tạo được.** 8 đường nhập hợp lệ đã
   thử trên ô mốc (type `number`, step `any`, controlled React):
   gõ "NaN", paste "NaN", gõ "Infinity", paste "1e999", gõ "0/0", gõ
   "e", kéo ngang qua ô, click vùng spinner. Không đường nào cho
   value "NaN": 6 đường về "" → câu guard mốc rỗng, 1 đường ("0/0")
   về "00" → OutOfRange, 1 đường (spinner) không đổi giá trị. Nhánh
   `!isFinite` trong guard panel và trong store vẫn chỉ là phòng thủ
   — không có case click-test NaN thật nào, và cũng không thể có qua
   ô này. Xem §3.
4. **Hồi quy — J6 17/17, K6 8/8 (sau 1 lần chạy lại):** lần chạy K6 đầu
   6/8 với 2 fail đều là timeout CDP 120s (không phải assert app
   fail — K4 đã cho msg + toast en đúng trước khi treo, K5 treo ngay
   evaluate đầu tiên chưa kịp assert; 0 exception). Chạy lại xanh
   8/8. Xem §4 — ghi rõ giới hạn suy luận ở đó, không giấu lần fail.
5. **Bundle đo thay đổi 2 lần giữa lượt do các luồng round 28 khác
   build lại dist:** L5 chạy trên bundle cũ mIzUrd00 (bundle guard
   của K6), hồi quy J6 + K6 lần 1 trên Dc8sHsbE, hồi quy K6 lần 2
   trên B5xTAP7g. Mỗi lần chạy đều snapshot dist đầu giờ nên kết quả
   nào cũng gắn đúng bundle của nó — nhưng không được đọc gộp thành
   "cùng một bundle". Xem §6.

## 1. Guard mốc rỗng ở locale en (L6) — bấm thật

Phiên en riêng (Chrome profile mới, `localStorage vcut-lang=en` đặt
trước reload, như K6). Gõ "11.4641" bằng CDP char thật, xoá trắng
bằng click + Ctrl+A + Backspace thật (không fallback lần nào), xác
nhận input = "" rồi bấm "Split leaf at outer time" trên lá trực tiếp
TOP-SPLIT-OUT (start = 10).

| Hạng mục | Số đo thật |
|---|---|
| Msg sau click | `No outer time entered (the field is empty) — not split.` — so từng chữ với `en.json:770`, khớp tuyệt đối |
| Toast | 0 toast chứa câu guard (lúc đọc, danh sách toast = [] — guard không tự toast, đúng thiết kế K6) |
| Key thô / rò vi | msg không chứa `nested.`, không chứa marker vi (`Mốc`, `không tách`, `clip lá`, `quá sát mép`, `tổ tiên`, `đang reverse`) |
| Spec / undo | Lá còn 1, spec không đổi sau 7000ms, Ctrl+Z no-op |

Đây là lần đầu câu guard en được bấm thật (K6 chỉ bấm câu vi + nhánh
OutOfRange ở en). Cùng code path với câu vi đã bấm ở K6, nay khóa
thêm phía en.

## 2. Mốc âm và mốc trước cửa sổ ở chain sâu qua panel (L1–L4, L7)

Fixture mới trong seed L5 (harness, không phải code sản phẩm):
TOP-NEG2 = chain 2 tầng như TOP-SPLIT2 nhưng top start=10
(MID-NEG2, lá neg2-leaf.mp4); TOP-NEG3 = chain 3 tầng như TOP-SPLIT3
nhưng top start=10 (A-NEG3, B-NEG3, lá neg3-leaf.mp4). Vì cửa sổ khả
kiến của lá bắt đầu ở 10 (top start), "9.9" là mốc trước cửa sổ
nhưng vẫn dương — tách được khỏi hướng âm "-1", điều mà fixture cũ
(top start=0) không làm được. Cả 4 case vi + 1 case en đều chặn bằng
store (msg + toast), không phải guard panel.

| Case | Chain qua panel | Nhập | Msg + toast | Lá / spec / undo |
|---|---|---|---|---|
| L1-neg-two-level | TOP-NEG2 > MID-NEG2 > lá | "-1" gõ trực tiếp CDP char, value đọc được "-1" ngay lần thử đầu | `Mốc ngoài nằm ngoài phần khả kiến của clip lá — không tách.` + toast cùng câu | Lá còn 1, spec không đổi, Ctrl+Z no-op |
| L2-neg-three-level | TOP-NEG3 > A-NEG3 > B-NEG3 > lá | "-1" gõ trực tiếp, value "-1" | OutOfRange vi + toast | Lá còn 1, spec không đổi, Ctrl+Z no-op |
| L3-before-window-two-level | TOP-NEG2 > MID-NEG2 > lá | "9.9" gõ CDP char | OutOfRange vi + toast | Lá còn 1, spec không đổi, Ctrl+Z no-op |
| L4-before-window-three-level | TOP-NEG3 > A-NEG3 > B-NEG3 > lá | "9.9" gõ CDP char | OutOfRange vi + toast | Lá còn 1, spec không đổi, Ctrl+Z no-op |
| L7-en-neg-two-level | TOP-NEG2 > MID-NEG2 > lá (phiên en) | "-1" gõ trực tiếp, value "-1" | `The outer time is outside the leaf clip's visible window — not split.` + toast cùng câu, không key thô, không rò vi | Spec không đổi, Ctrl+Z no-op |

Ghi chú trung thực về gõ "-1": harness L5 có sẵn 3 đường thử
(gõ trực tiếp → gõ "1" + Home + "-" → paste insertText), nhưng
đường đầu tiên đã thành công ở cả 3 phiên (vi 2 lần, en 1 lần) nên
2 đường dự phòng chưa từng được thực thi — không mạo nhận đã thử
chúng. Lý do đường trực tiếp thành công (suy từ hành vi quan sát,
không đọc code Chrome): ký tự "-" đơn lẻ không làm `.value` đổi
(vẫn ""), nên React controlled input không re-render để xoá nó;
ký tự "1" tới sau hoàn thành chuỗi "-1" hợp lệ trong một lần sửa.
Điều này cũng giải thích vì sao K6 ghi "gõ '-' cho value ''" mà vẫn
gõ được "-1" nguyên chuỗi.

## 3. NaN qua UI — 8 đường đã thử, không đường nào tạo được NaN

Ô mốc là `<input type="number" step="any">` controlled
(`value={outerOffset}`, `onChange` ghi `e.target.value`). Mỗi attempt
trên lá trực tiếp TOP-SPLIT-OUT (start=10): xoá trắng → nhập bằng
đường đó → đọc value thật → bấm tách → đọc msg thật. Tất cả đều
bằng CDP Input event thật, không JS setter.

| # | Đường nhập | Text đưa vào | Value đọc được | Msg sau click | Giải thích |
|---|---|---|---|---|---|
| 1 | Gõ phím (CDP char) | `NaN` | `""` | Guard mốc rỗng vi | Chrome sanitize ký tự không phải số về "" |
| 2 | Paste (Input.insertText) | `NaN` | `""` | Guard mốc rỗng vi | Paste nguyên chuỗi không hợp lệ cũng về "" |
| 3 | Gõ phím | `Infinity` | `""` | Guard mốc rỗng vi | Như (1) |
| 4 | Paste | `1e999` | `""` | Guard mốc rỗng vi | Tràn double → không hợp lệ → "" |
| 5 | Gõ phím | `0/0` | `"00"` | OutOfRange vi | "/" bị từ chối từng ký tự, 2 số 0 còn lại thành "00" (= 0 < 10) — không phải NaN |
| 6 | Gõ phím | `e` | `""` | Guard mốc rỗng vi | "e" đơn lẻ không hợp lệ → "" |
| 7 | Kéo ngang qua ô (CDP drag) | — | `""` (trước và sau đều "") | Guard mốc rỗng vi | Kéo chỉ chọn text, không đổi giá trị |
| 8 | Click vùng spinner (cạnh phải, 1/4 trên của ô) | — | `""` (không đổi) | Guard mốc rỗng vi | Click không làm đổi giá trị — xem giới hạn dưới |

Sau cả 8 attempt: spec không đổi, Ctrl+Z no-op, 0 exception phiên vi.
**Kết luận:** không tạo được NaN qua UI của ô này; nhánh `!isFinite`
trong `splitAtOuterOffset` (panel) và guard `isFinite` trong
`nestedSplitOffset` (store) là phòng thủ không tới được qua đường
nhập này. Không fake case NaN, không claim đã bấm NaN.

Giới hạn của attempt 8 (ghi rõ, không giấu): click vùng spinner chỉ
là 1 điểm tọa độ (1107,521) ở cạnh phải 1/4 trên của ô — giá trị
không đổi, nhưng không chứng minh được spinner có hiện hay không ở
tọa độ đó dưới headed Chrome (spinner của `type="number"` chỉ hiện
khi hover/focus theo UA stylesheet). Dù sao spinner theo cấu tạo
cũng chỉ tăng/giảm hữu hạn theo step, không sinh được NaN; kết luận
"không tạo được NaN" dựa trên 7 đường còn lại + cơ chế sanitize
của `type="number"`, không dựa vào attempt 8.

## 4. Hồi quy J6/K6 — và 2 timeout lần 1 (ghi đầy đủ, không giấu)

Chạy bản sao tạm của 2 harness cũ (đổi scratch/display/port/tên JSON;
bản sao đã xóa sau khi chạy, chỉ giữ JSON — theo tiền lệ J6/K6):

- **J6 (split-intermediate): 17/17 PASS** trên bundle Dc8sHsbE
  (J0–J15 đầy đủ: tách thành công 3 độ sâu + playhead + trung gian
  sâu + risky, 0 exception cả 2 phiên).
- **K6 lần 1: 6/8** trên cùng bundle Dc8sHsbE. Vi 5/5 xanh
  (K0–K3, K6-no-crash). Phiên en: K4 log đã ghi msg + toast en
  OutOfRange ĐÚNG (`The outer time is outside the leaf clip's
  visible window — not split.`) lúc 01:27:53, rồi evaluate đọc
  autosave sau đó timeout 120s → FAIL; K5 timeout 120s ngay
  evaluate đầu tiên (drill), chưa kịp assert nào → FAIL; K7
  (0 exception phiên en) vẫn PASS. Tức 2 fail này là treo CDP, không
  phải assert hành vi app nào fail.
- **K6 lần 2 (chạy lại toàn bộ, bundle lúc đó đã là B5xTAP7g do luồng
  khác build lại dist): 8/8 PASS**, K4/K5 xanh với cùng msg en đúng
  (lần này toast K4 sạch, chỉ 1 toast OutOfRange — khác lần 1 còn
  toast cảnh báo preview lúc load, đúng kiểu nhiễu tải lúc load).

Đánh giá (trung thực về mức chắc chắn): bằng chứng nghiêng mạnh về
nhiễu hạ tầng thoáng qua (treo toàn bộ CDP evaluate ~4 phút, 0
exception, UI đã đúng trước khi treo, chạy lại xanh, J6 xanh trên
chính bundle lần 1) — nhưng KHÔNG có snapshot process lúc treo nên
không loại trừ tuyệt đối khả năng page hang thoáng qua trên bundle
Dc8sHsbE. Bundle đó hiện không còn trên đĩa (dist đã build lại 2
lần trong lượt, snapshot scratch đã dọn theo tiền lệ) nên không tái
hiện đúng bundle được nữa. Thực tế: đường en đã xanh trên bundle
mới hơn (B5xTAP7g), và L5 en (L6/L7) xanh trên bundle cũ hơn
(mIzUrd00) — dải bundle đều xanh, chỉ lần chạy giữa bị treo CDP.
Giao parent quyết có cần chạy lại K6-en chuyên biệt hay không;
luồng này không chạy lần 3 chỉ để săn nhiễu (tiền lệ J6/K6 về nhiễu
thoáng qua).

## 5. Không có bug sản phẩm mới — và những gì KHÔNG làm

- Không sửa code sản phẩm: toàn bộ case pass trên UI thật, không có
  hành vi app nào sai để fix. Không đụng `apps/web/dist/` (chỉ
  snapshot đọc), không đụng store, không đụng dict i18n.
- Không chạy `tsc`/`vite build` riêng: không đổi code sản phẩm nên
  không có gì để kiểm chứng thêm ở tầng đó (harness qua
  `node --check`; bundle đo là build của cây do luồng khác build).
- Không đo lại: I6 deep-leaf/ramp canvas (không thuộc nợ L5; K6/J6
  đã đủ làm hồi quy panel), scrub ruler cho NEG fixture (chỉ gõ tay
  và paste — playhead đã khóa ở J8/J6), máy thật / Safari / touch /
  dpr > 1 / viewport khác (toàn bộ đo là Chromium headed dưới Xvfb,
  raster phần mềm, dpr = 1, cửa sổ 1920×1200 — cấm trích thành hành
  vi trên máy user).

## 6. Harness, bundle đo và file đổi/thêm

- Harness mới: `apps/web/scripts/clicktest-l5-round28-pipe.mjs`
  (kế thừa infra K6: pipe CDP + snapshot dist + seed qua autosave +
  đóng WelcomeModal/RelinkPanel bằng click thật; thêm: fixture
  TOP-NEG2/TOP-NEG3 top start=10, helper `typeNegative` 3 đường thử,
  8 attempt NaN, so msg en từng chữ; cổng 4195, display :95).
- Bundle đo (snapshot đầu mỗi lần chạy — dist đổi giữa chừng do các
  luồng round 28 khác build lại, xem §0.5):
  - L5 10/10: `index-mIzUrd00.js`, sha256[:16] = ae6342b5876a41c0
    (trùng bundle guard của K6).
  - J6 hồi quy 17/17 + K6 hồi quy lần 1 6/8: `index-Dc8sHsbE.js`,
    sha256[:16] = 17b4378f080407bb.
  - K6 hồi quy lần 2 8/8: `index-B5xTAP7g.js`, sha256[:16] =
    09affe8f6120cc77.
- Kết quả JSON (parent quyết có stage hay không):
  - `benchmarks/results/v28-l5-clicktest.json` — 10/10
    (L0, L1, L2, L3, L4, L5, L8-vi, L6-en, L7-en, L9-en).
  - `benchmarks/results/v28-l5-regress-j6.json` — 17/17.
  - `benchmarks/results/v28-l5-regress-k6.json` — 6/8 lần 1
    (K4/K5 timeout CDP, giữ lại làm bằng chứng, không ghi đè).
  - `benchmarks/results/v28-l5-regress-k6-rerun.json` — 8/8 lần 2.
- `node --check` harness L5 + 3 bản sao hồi quy: pass.
- Scratch của luồng (`~/workspace/tmp-round28-l5/`,
  `tmp-round28-l5-regress-j6/`, `tmp-round28-l5-regress-k6/`,
  `tmp-round28-l5-regress-k6-rerun/`) và 3 bản sao harness hồi quy
  tạm đã dọn cuối luồng, xác nhận bằng `ls` trước khi báo cáo.
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub
  connector, KHÔNG stage (parent gộp batch).

## 7. Nợ còn lại (không mạo nhận đã xong)

- Mốc âm 3 tầng và mốc trước cửa sổ ở phiên en chưa bấm riêng (chỉ
  có mốc âm 2 tầng en L7 + guard en L6 + hồi quy en K4/K5): cùng code
  path không phân biệt locale ngoài `i18nT` và cùng store action đã
  khóa ở vi 3 tầng, nhưng chưa có click en 3 tầng tường minh.
- Hành vi spinner dương của ô number chưa chứng minh được (attempt
  8 §3 không đổi giá trị — có thể do tọa độ chưa trúng nút spinner
  thật). Nếu parent muốn khóa spinner, cần 1 attempt chuyên biệt
  (hover hiện spinner rồi click nửa dưới cho step-down).
- Nhánh `!isFinite` của guard panel và store không tới được qua UI
  (xem §3) — chỉ còn là phòng thủ; không có cách nào click-test nó
  mà không dùng JS setter (bị cấm vì đó không còn là đường UI).
- Lần treo CDP ở hồi quy K6 lần 1 (§4) chưa có nguyên nhân gốc chắc
  chắn 100% (thiếu snapshot process lúc treo) — chỉ có kết luận
  nghiêng về nhiễu hạ tầng + chạy lại xanh.
- D7 text-style (đợt 26 §6): seed L5 không có text leaf nên không đo
  lại; phiên vi/en L5 đều 0 exception nhưng đó không phải bằng
  chứng về D7.
