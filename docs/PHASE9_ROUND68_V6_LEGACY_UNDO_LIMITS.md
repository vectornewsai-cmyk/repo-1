# Phase 9 — Đợt 68, luồng V6: Stack hoàn tác nhiều mức cho legacy adopt — LIMITS

Ngày: 09/11/2026 (lượt cron ~00:35 +07). Đóng nợ đợt 67 U6 §5.2
("Hoàn tác chỉ một mức, chỉ lần nhận gần nhất"). KHÔNG push, KHÔNG
release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Hoàn tác nhiều mức | **ĐÃ XONG.** Stack LIFO tối đa 20 mức; mỗi lần nhận (lẻ hoặc từng mảnh trong loạt "nhận tất cả") push một bản ghi; hoàn tác pop từng mức theo thứ tự ngược. |
| Tính đúng đắn | **ĐÃ XONG.** Mỗi mức khôi phục đúng trạng thái history trước lần nhận đó (đúng id gốc qua bảng id gốc → id migrate, khôi phục khóa con trỏ khi chuỗi là con trỏ); nhận sau khi hoàn tác một phần chồng đúng lên mức còn lại. |
| Trường hợp biên | **ĐÃ XONG + test bao phủ.** Stack rỗng → null, không đụng kho; envelope lệch → bản ghi đẩy lại stack, không mất; version bị xóa sau khi nhận → mức đã dùng, không pop thêm; vượt 20 mức → bỏ mức cũ nhất + toast báo. |
| Banner/modal | **ĐÃ XONG.** Banner hiện đúng mức trên đỉnh (lần hoàn tác tới sẽ khôi phục chuỗi nào, bao nhiêu version) + số mức còn lại (`Còn {depth} mức hoàn tác.`), kèm `data-depth` để test assert. |
| Test | Unit mới **13/13**; headed thật **7/7** (lần chạy thứ 2; xem §4.3). Hồi quy U6 **20/20**, T7 **16/16**, projectHistory **15/15**. |
| tsc | **0 lỗi (kiểm lại sau khi đính chính — xem §4.2).** Lần chạy đầu báo 5 lỗi TS6133 trong `ExportPanel.tsx` (file luồng khác đang sửa song song, không phải file V6); đã kiểm lại bằng binary tsc gốc: exit 0, 0 lỗi. |
| vite build | **Pass** (58,42 s; `index-*.js` 1.545,98 kB / gzip 456,40 kB; chỉ cảnh báo chunk >500 kB có sẵn). |
| i18n | Fragment riêng **4 key** (`apps/web/src/i18n/fragments/round68-v6.json`), 0 key vi==en giống hệt. **KHÔNG gộp dict** — dict giữ 2369 key; parent gộp sau (xem §6). |
| r6-i18n-check / audit P7 / orphans Q4 | **PASS** / **8/8** / **16/16** (xem §4.5 — lưu ý trung thực về key chết `confirmAllBody` ở §5.5). |

## 1. Thiết kế

### 1.1 Stack hoàn tác — projectHistory.ts

- `ManualAdoptRecord` (một mức): `envelopeId`, `fragmentId`,
  `moved`, `movedVersions` (bảng id gốc → id migrate — id gốc không
  suy ra được từ id migrate vì `makeVersionId` dùng hậu tố ngẫu
  nhiên), `wasPointerChain`, `adoptedAt` (chỉ hiển thị/sắp xếp).
- `LEGACY_ADOPT_UNDO_MAX_LEVELS = 20`. `LegacyAdoptUndoStack` (lớp
  thuần, không chạm kho, test được bằng Node): `push` / `peek` /
  `pop` / `size` / `list` (cũ → mới) / `clear`. Push vượt giới hạn
  thì bỏ mức CŨ NHẤT (đáy stack, FIFO) và trả về bản ghi đã bỏ để
  caller báo cho user — các version của mức bị bỏ KHÔNG còn hoàn tác
  được nữa.
- `makeManualAdoptRecord(envelopeId, fragmentId, result,
  adoptedAt?)`: dựng bản ghi từ `ManualAdoptResult`, COPY từng cặp
  id (đổi kết quả gốc sau đó không đổi bản ghi — test S4).
- `undoLastManualAdopt(stack, envelopeId, deps?)`: pop đỉnh stack
  rồi gọi `undoManualAdopt` với đúng bản ghi đó. Stack rỗng → trả
  `null` (không pop, không đụng kho). Envelope của bản ghi lệch với
  envelope hiện tại → bản ghi được đẩy TRỞ LẠI đỉnh stack (không
  mất) + kết quả `reason: "envelope-mismatch"` (modal dọn stack vì
  phiên đã cũ). Bản ghi đã pop thì coi như ĐÃ DÙNG kể cả khi kết quả
  là `"nothing-to-undo"` (version đã bị xóa/prune sau khi nhận nên
  không còn gì để trả — một lần bấm chỉ pop đúng một mức, không pop
  thêm mức khác để "tìm" mức có cái hoàn tác).
- `undoManualAdopt` + `rekeyVersions` của đợt 67 U6 giữ nguyên, không
  sửa (hồi quy U6 20/20 làm chứng).

### 1.2 Modal — LegacyHistoryAdoptModal.tsx

- Thay state `lastAdopt` (một mức) bằng: `undoStackRef` (instance
  `LegacyAdoptUndoStack` trong ref) + `undoDepth` (state số mức, để
  re-render) + `undoItemsRef` (map `fragmentId → AmbiguousLegacyItem`
  để hoàn tác trả mục về hàng đợi). Bất biến (dựa trên hàng đợi khử
  trùng theo `from` của `legacyAdoptUi`): một chuỗi chỉ có tối đa
  MỘT bản ghi đang sống trong stack — nhận xong mục rời khỏi hàng
  đợi, hoàn tác mới trả mục về hàng đợi và pop bản ghi; không thể
  nhận cùng chuỗi 2 lần mà không hoàn tác ở giữa — nên map theo
  `fragmentId` là đủ (test T8).
- `doAdopt`: sau khi nhận thành công, chỉ push khi `moved > 0` hoặc
  `wasPointerChain` (có gì để hoàn tác: version đã chuyển, hoặc khóa
  con trỏ để khôi phục). Nhận chuỗi rỗng không phải con trỏ thì
  không push mức rỗng. Vượt 20 mức → toast `undoStackFull` (không
  lặng lẽ bỏ mức cũ). `doAdoptAll` gọi `doAdopt` từng mục theo thứ
  tự hàng đợi nên mỗi mảnh trong loạt có một mức riêng — đây chính
  là điểm sửa nợ U6: nhận "tất cả" 3 chuỗi rồi hoàn tác 3 lần sẽ trả
  về đúng 3 chuỗi theo thứ tự ngược với lúc nhận.
- `doUndo`: pop mức gần nhất qua `undoLastManualAdopt`. Các nhánh:
  - `"error"` (lỗi kho): đẩy bản ghi TRỞ LẠI đỉnh stack để user bấm
    Hoàn tác thử lại sau (không mất mức); mục không về hàng đợi.
  - `"envelope-mismatch"`: dọn sạch stack (phiên đã cũ) + toast
    `undoEnvelopeMismatch`.
  - `"nothing-to-undo"`: bản ghi đã dùng, toast `undoNothing`, mục
    không về hàng đợi (chuỗi đã rỗng — đúng hành vi đợt 67 U6 với
    mức duy nhất).
  - `"undone"` / `"undone-empty"`: trả mục về hàng đợi (lấy item từ
    map theo `fragmentId`), `notifyHistoryChanged()` khi
    `movedBack > 0`, toast `undoDone` / `undoEmpty` như cũ.
- Banner: hiện mức trên đỉnh stack (`undoBanner` với `n`/`from` của
  mức đó — chính là cái lần hoàn tác tới sẽ khôi phục) + dòng
  `undoDepth` (`Còn {depth} mức hoàn tác.`) + thuộc tính
  `data-depth={undoDepth}` trên banner (headed test assert số, không
  assert chuỗi dịch trước lúc gộp). Banner hiện khi `undoDepth > 0`.
- Nút Ẩn: dọn TOÀN BỘ stack (không chỉ mức trên đỉnh) — banner là UI
  duy nhất để hoàn tác, ẩn banner thì không còn đường hoàn tác các
  mức đó nữa. Đã ghi rõ trong comment code. Version đã nhận vẫn ở
  nguyên trong envelope (Ẩn không hoàn tác ngầm — headed V5 kiểm).
- Đổi project (`projectId` đổi): effect dọn sạch stack + map (bản ghi
  gắn với envelope cũ, không hoàn tác sang project khác được).
- Xác nhận "nhận tất cả" nay dùng key mới `confirmAllBodyMulti`
  (thay `confirmAllBody` cũ — câu cũ "chỉ hoàn tác được lần nhận
  gần nhất" đã SAI sau đợt này; xem §5.5).

### 1.3 i18n — fragment round68-v6.json (4 key, chưa gộp)

| Key | vi | en |
|---|---|---|
| `legacyAdopt.undoDepth` | Còn {depth} mức hoàn tác. | {depth} undo levels left. |
| `legacyAdopt.undoStackFull` | Đã đạt tối đa {max} mức hoàn tác — mức cũ nhất đã bị bỏ và không hoàn tác được nữa. | Reached the maximum of {max} undo levels — the oldest level was dropped and can no longer be undone. |
| `legacyAdopt.confirmAllBodyMulti` | Sẽ nhận {n} phiên bản từ {m} chuỗi vào lịch sử của project hiện tại. Mỗi lần nhận được ghi lại riêng — có thể hoàn tác từng mức theo thứ tự ngược. | This will adopt {n} versions from {m} chains into the current project's history. Each adoption is recorded separately — you can undo them one level at a time, in reverse order. |
| `legacyAdopt.undoEnvelopeMismatch` | Không hoàn tác được: project đã đổi từ lúc nhận. | Cannot undo: the project changed since the adoption. |

Không tạo key `trKey` mới trong `projectHistory.ts` (audit i18n P7
chỉ chấp nhận trKey trỏ key đã có trong dict — đợt này không thêm
trKey nào; `reason: "envelope-mismatch"` là chuỗi mã nội bộ, chuỗi
hiển thị nằm ở modal qua `t()` như tiền lệ U6).

## 2. Thay đổi hành vi (cần biết)

- Trước đợt này: nhận lần 2 ghi đè bản ghi hoàn tác của lần 1; nhận
  "tất cả" cũng chỉ hoàn tác được lần nhận cuối trong loạt. Nay mỗi
  lần nhận có một mức riêng, hoàn tác đi ngược từng mức cho tới khi
  hết stack (tối đa 20 mức).
- Banner sau khi nhận nay hiện thêm số mức còn lại; nút Ẩn nay bỏ
  toàn bộ các mức còn lại (trước đây chỉ có đúng một mức nên Ẩn =
  bỏ mức đó — hành vi tương đương, nay mở rộng cho cả stack).
- Bảng xác nhận "nhận tất cả" nay nói rõ mỗi lần nhận được ghi lại
  riêng và hoàn tác được từng mức theo thứ tự ngược (thay câu cũ nói
  chỉ hoàn tác được lần gần nhất).
- Mọi hành vi khác giữ nguyên: xác nhận lần 2, mở lại mục đã bỏ qua,
  nhập archive mang lịch sử, panel tự làm mới (đợt 67 U6).

## 3. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/projectHistory.ts` | Sửa | `ManualAdoptRecord`, `LEGACY_ADOPT_UNDO_MAX_LEVELS = 20`, `makeManualAdoptRecord`, `LegacyAdoptUndoStack`, `undoLastManualAdopt` |
| `apps/web/src/components/project/LegacyHistoryAdoptModal.tsx` | Sửa | Stack nhiều mức thay `lastAdopt` 1 mức; banner + `data-depth`; Ẩn dọn cả stack; dọn stack khi đổi project; `confirmAllBodyMulti` |
| `apps/web/src/i18n/fragments/round68-v6.json` | Mới | Fragment 4 key (vi+en) — KHÔNG gộp dict |
| `apps/web/src/lib/legacyAdopt68V6.test.ts` | Mới | Unit 13 test (S/T) |
| `apps/web/tsconfig.json` | Sửa | Exclude test mới (mẫu mọi test node strip-types) |
| `apps/web/scripts/clicktest-68v6-legacy-undo.mjs` | Mới | Headed 7 case (V0–V6) |
| `docs/PHASE9_ROUND68_V6_LEGACY_UNDO_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): log chi tiết
`hidden_files/round68-v6.md`; headed evidence
`hidden_files/round68-v6/headed/` (report.json, 1 screenshot PNG,
log vite/chrome — PNG là evidence test, không phải asset sản phẩm);
scratch `/tmp/round68-v6/` (bundle test i18n, log tsc).

Stage: `paths-loop/phase9-round68-v6-legacy-undo.txt` — 7 entry,
verify bằng read-back. KHÔNG push, KHÔNG release/tag.

## 4. Kiểm chứng (số thật)

### 4.1 Unit mới `apps/web/src/lib/legacyAdopt68V6.test.ts` — 13/13

Chạy: `node apps/web/src/lib/legacyAdopt68V6.test.ts` (~6 s).

- S. Stack thuần (4): S1 LIFO (push/peek/pop, peek không pop, rỗng
  → undefined); S2 giới hạn 20 (push mức 21 bỏ mức cũ nhất, trả về
  đúng bản ghi đã bỏ, `list()` còn đúng 20 mức theo thứ tự); S3
  clear + push sau clear; S4 factory copy bảng id (đổi kết quả gốc
  không đổi bản ghi).
- T. Tích hợp adopt + `undoLastManualAdopt` trên store thật (9): T1
  nhận 2 chuỗi → hoàn tác ngược, envelope sạch sau mức cuối; T2 nhận
  tất cả 3 chuỗi (kể cả chuỗi 2 version) → hoàn tác ngược từng mức,
  mỗi mức khôi phục đúng chuỗi (C trả đúng 2 version); T3 nhận sau
  khi hoàn tác một phần (stack [A, B] → undo B → nhận C → stack
  [A, C], pop C rồi A); T4 chuỗi con trỏ nằm giữa stack (undo chuỗi
  thường không chạm khóa, undo con trỏ khôi phục khóa về đúng chuỗi);
  T5 stack rỗng → null, kho không đổi; T6 envelope lệch → bản ghi
  đẩy lại stack, kho không đổi, undo lại với đúng envelope thì xong;
  T7 version bị xóa sau khi nhận → `nothing-to-undo`, chỉ pop đúng
  1 mức, mức A còn lại vẫn hoàn tác được; T8 nhận lại cùng chuỗi sau
  hoàn tác → stack chỉ giữ 1 mức mới; T9 chuỗi rỗng là con trỏ → mức
  vẫn push, undo `undone-empty`, chỉ khôi phục khóa.

### 4.2 Hồi quy (chạy lại sau mọi sửa)

- U6 `legacyAdopt67U6.test.ts` **20/20** (undo 1 mức cũ vẫn y nguyên).
- T7 `legacyAdopt66T7.test.ts` **16/16**.
- `projectHistory.test.ts` **15/15**.
- i18n audit P7 **8/8** (esbuild bundle `/tmp/round68-v6/p7.test.cjs`,
  chạy Node).
- i18n orphans Q4 **16/16** (bundle `/tmp/round68-v6/q4.test.cjs`).
- `r6-i18n-check` **PASS** (585 literal key, 458 key R6).
- `tsc` apps/web: **0 lỗi (đính chính — xem ghi chú dưới).**
  Lần chạy đầu (`npx tsc --noEmit | tail -5`, 132,7 s, lúc nhiều luồng
  đợt 68 chạy song song) thực ra có **5 lỗi TS6133 trong
  `src/ExportPanel.tsx` (dòng 475–482: `downloadAvailable` /
  `setDownloadAvailable` / `downloadChecking` / `setDownloadChecking`
  / `restoreExportDest` declared but never read)** — nhưng pipe qua
  `tail` làm `$?` thành exit của `tail` nên luồng này đã kết luận sai
  là "0 lỗi". Các lỗi đó KHÔNG nằm trong file nào của V6 (V6 chỉ sửa
  `projectHistory.ts`, `LegacyHistoryAdoptModal.tsx`, fragment,
  test, tsconfig, script headed, LIMITS). Kiểm lại sau đó bằng binary
  tsc gốc (`../../node_modules/.bin/tsc --noEmit`, log ra file,
  không pipe): **exit 0, 0 lỗi** (~14 s, VM đã lặng). Bằng chứng lỗi
  đầu chỉ là snapshot giữa chừng của file luồng khác: cùng các khai
  báo đó nay ở dòng 480/487 và ĐÃ có chỗ dùng (dòng 968/982/1032/
  1589/1596/1616 — `restoreExportDest(job.id)`, `data-download-state`,
  …), tức file đã được luồng U7 (job history / ExportPanel) sửa tiếp
  xong sau lần chạy đầu. Bài học: không pipe tsc qua `tail` khi cần
  exit code thật; luôn ghi log ra file rồi đếm `error TS`.
- `vite build` apps/web: **pass** (58,42 s; `index-*.js` 1.545,98 kB
  / gzip 456,40 kB; chỉ cảnh báo chunk >500 kB có sẵn).

### 4.3 i18n fragment (kiểm bằng node, không qua dict)

- `apps/web/src/i18n/fragments/round68-v6.json`: **4 key lá**,
  vi==en cùng tập key, placeholder khớp từng key, không key rỗng,
  **0 key vi==en giống hệt**.

### 4.4 Headed thật `apps/web/scripts/clicktest-68v6-legacy-undo.mjs` — 7/7 (lần chạy thứ 2)

Chạy: `node apps/web/scripts/clicktest-68v6-legacy-undo.mjs`
(~47 s; vite dev :5670, Chromium qua Xvfb :179, profile mới).
Report: `hidden_files/round68-v6/headed/report.json`.
loadavg lúc bắt đầu lần 2: `10.23 11.03 7.24`; lúc kết thúc: `5.85 9.84 7.02`.

- V0: app projectId envelope là UUID thật (`86feda4a-…`).
- V1: seed autosave spec A (2 clip) + mảnh B (spec B, 1 version) +
  mảnh D (spec D1+D2, 2 version) + con trỏ C (spec C, 1 version,
  khóa legacy trỏ tới), cả ba mơ hồ.
- V2: nhận từng mảnh bằng UI thật (có xác nhận lần 2) — banner
  `data-depth` 1 → 2 → 3 đúng sau mỗi lần; envelope lần lượt có
  hashB/hashD/hashC; chuỗi nguồn rỗng; khóa con trỏ dọn sau khi nhận
  C (screenshot `legacy-undo-stack-depth3.png`).
- V3: hoàn tác từng mức bằng UI thật — C (nhận sau cùng) về trước +
  khóa con trỏ khôi phục về C, rồi D (2 version), rồi B; depth
  3 → 2 → 1 → 0, banner biến mất, envelope sạch.
- V4: "Nhận tất cả" bằng UI thật (1 lần xác nhận) → depth=3, modal
  hết mục; hoàn tác ngược đúng thứ tự nhận (hàng đợi lúc đó là
  [C, D, B] nên nhận theo C → D → B, hoàn tác B → D → C), envelope
  sạch sau mức cuối, banner biến mất.
- V5: nhận B → depth=1, bấm Ẩn → banner + nút Hoàn tác biến mất
  (depth 0), modal còn 2 mục chờ; version của B vẫn ở envelope (Ẩn
  không hoàn tác ngầm).
- V6: **0** window.onerror/unhandledrejection trong suốt phiên.

**Lịch sử 2 lần chạy (trung thực):** lần 1 **5/7** — V4 FAIL do
harness (giả định thứ tự nhận-tất-cả là B → D → C theo thứ tự seed,
nhưng hàng đợi sau V3 là [C, D, B] vì hoàn tác trả mục về theo thứ
tự đó, nên mức trên đỉnh sau nhận-tất-cả là B chứ không phải C —
sản phẩm hoàn tác đúng LIFO theo thứ tự nhận thật, harness chờ sai
chuỗi nên timeout 30 s), V5 FAIL dây chuyền theo V4 (stack lúc đó
còn 2 mức, không phải 0). Đã sửa harness đọc đúng thứ tự hàng đợi
trước khi bấm "Nhận tất cả" rồi hoàn tác theo thứ tự ngược với nó;
lần 2 **7/7**. Không sửa code sản phẩm giữa 2 lần chạy.

## 5. Nợ mở / giới hạn (trung thực)

1. **Stack chỉ sống trong phiên modal (không persist).** Tải lại
   trang hoặc đổi project thì mất hết các mức hoàn tác. Muốn bền qua
   reload thì cần lưu stack xuống IndexedDB/localStorage (kèm bảng
   id) — việc cho đợt sau nếu cần.
2. **Nút Ẩn bỏ toàn bộ stack.** Không có cách "ẩn banner nhưng giữ
   lại các mức để hoàn tác sau" vì banner là UI duy nhất để hoàn
   tác. Đóng modal (nút ✕) khi còn mức cũng vậy: modal chỉ mở lại
   khi có mục mơ hồ MỚI (hành vi kế thừa đợt 67 U6) — các mức "ngủ"
   trong state tới lúc đó.
3. **Lỗi kho giữa chừng khi undo:** `rekeyVersions` put-trước-xóa-sau
   nên version đã chuyển xong không mất; bản ghi được đẩy lại đỉnh
   stack để thử lại — lần thử lại chỉ chuyển nốt phần còn lại (theo
   idMap, version đã về rồi thì không còn trong envelope để chuyển
   nữa). Chưa có test headed cho đường này (chỉ unit O7 đợt U6 cho
   `undoManualAdopt` gốc).
4. **Version lưu mới vào envelope sau khi nhận mà trỏ cha tới version
   đã nhận thì `parentId` vẫn trỏ id đã migrate (dangling)** — cùng
   hành vi prune cũ, kế thừa đợt 67 U6 §5.3 (stack không đổi gì ở đây).
5. **Key `legacyAdopt.confirmAllBody` chết trong dict.** Không còn
   code nào đọc nó (modal đã chuyển sang `confirmAllBodyMulti`).
   Test orphan Q4 vẫn **16/16** vì header comment của modal trích
   đúng key này trong backtick — scan tĩnh của test tính cả comment
   nên không liệt kê là mồ côi. Đây là kết quả đúng theo luật scan
   của test, nhưng về bản chất key đã chết: parent nên XÓA nó khỏi
   dict khi gộp (xem §6) thay vì giữ lại nhờ comment.
6. **Undo "nothing-to-undo" không trả mục về hàng đợi** (chuỗi đã
   rỗng — kế thừa đợt 67 U6). User muốn nhận lại chuỗi đó phải chờ
   lần quét/adopt sau hỏi lại.
7. **Modal dùng chung backdrop z 400 nên che TopBar khi mở** (cùng
   hạn chế S10 đã ghi ở T7 §5.7). Đổi locale giữa chừng khi modal mở
   phải đóng modal trước.
8. **Headed script dùng display :179 + port vite 5670–5679 + debug
   9770–9779 riêng** (tránh đụng luồng khác đợt 68), dọn socket X mồ
   côi khi Xvfb cũ đã chết; chạy song song 2 luồng headed cùng dải
   port vẫn có thể đụng nhau — tiền lệ U6 dùng :178/:5660.
9. **Cây chung có nhiều luồng đợt 68 sửa song song:** kiểm chứng cuối
   (tsc 0, build pass, unit/headed xanh) chạy trên cây tại thời điểm
   kết thúc luồng; parent gộp cần chạy lại sau khi gộp như tiền lệ
   đợt 66/67.

## 6. Ghi chú cho parent gộp (theo lệnh task)

- **Fragment cần gộp:** `apps/web/src/i18n/fragments/round68-v6.json`
  — **4 key**. Sau gộp dict: vi = en = **2369 + 4 = 2373 key lá**;
  key vi==en giống hệt giữ **52** (không đổi — 4 key mới đều vi≠en).
- **XÓA `legacyAdopt.confirmAllBody` khỏi dict** (vi+en) khi gộp —
  câu cũ sai sau đợt này ("chỉ hoàn tác được lần nhận gần nhất") và
  không còn code nào đọc. Sau khi xóa: dict = **2372 key lá**
  (2369 + 4 − 1); vi==en vẫn **52** (key xóa cũng vi≠en). Giữ nguyên
  key này trong fragment `round67-u6.json` (lịch sử, không sửa
  fragment đợt cũ).
- **Test khóa số key cần cập nhật số 2369 → 2372** (số vi==en 52
  không đổi): `i18nAudit59P7.test.ts`, `i18nOrphans60Q4.test.ts`,
  `i18nRound57N4.test.ts`, `reverseBadge46B6.test.ts`,
  `reverseCompat44Z6.test.ts`, `reversePlaybackI18n49E2.test.ts`,
  `reverseToggleI18n48D4.test.ts`, `saveToast31.test.ts`,
  `structuredNotes32.test.ts`, `errorDetail34Q4.test.ts` (xem comment
  lịch sử trong từng file — chỉ dòng assert/tên test/mô tả trạng thái
  hiện tại mới đổi, comment lịch sử giữ nguyên số cũ, theo bài học
  đợt 64 §7). Luồng này KHÔNG tự sửa các file đó (không gộp dict).
  Riêng test "dict" trong `i18nOrphans60Q4.test.ts` còn ghi rõ công
  thức cộng dồn 43 key fragment đợt 67 — cập nhật thêm "+ 4 key
  fragment đợt 68 V6 − 1 key chết confirmAllBody".
- **KHÔNG sửa `vi.json`/`en.json`** trong luồng này (đã kiểm: dict
  vẫn 2369/2369, r6-i18n-check PASS).
- Lưu ý khi gộp: 4 key mới đều dùng qua `t()` literal trong modal
  (không thêm trKey mới vào 36 file audit P7 quét); key
  `legacyAdopt.confirmAllBody` cũ vẫn nằm trong fragment
  `round67-u6.json` — chỉ xóa khỏi dict, không sửa fragment cũ.

## 7. Môi trường chạy

- VM này, không GPU. /tmp tmpfs 512M. loadavg lúc bắt đầu headed lần
  2: `10.23 11.03 7.24` (nhiều luồng đợt 68 chạy song song).
- Lệnh chạy (từ gốc repo):
  `node apps/web/src/lib/legacyAdopt68V6.test.ts` — exit 0 khi 13/13 pass.
  `node apps/web/src/lib/legacyAdopt67U6.test.ts` — hồi quy U6 20/20.
  `node apps/web/src/lib/legacyAdopt66T7.test.ts` — hồi quy T7 16/16.
  `node apps/web/scripts/r6-i18n-check.cjs` — PASS.
  `node apps/web/scripts/clicktest-68v6-legacy-undo.mjs` — headed 7/7.
- `tsc` chạy từ `apps/web` (`npx tsc --noEmit`).
- `vite build` chạy từ `apps/web`.
