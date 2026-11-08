# Phase 9 đợt 57 — N7: loadReport nhận câu tràn đã dịch (LIMITS)

Ngày: 2026-11-07. Luồng N7, repo `vectornewsai-cmyk/repo-1`, nhánh main.
Phạm vi: CHỈ `apps/web/src/lib/loadReport.ts` + fragment mới
`apps/web/src/i18n/fragments/round57-n7.json` + test mới
`apps/web/src/lib/loadReport57N7.test.ts` + file LIMITS này.
KHÔNG push, KHÔNG release/tag, KHÔNG binary. `projectRepo.ts` CHỈ ĐỌC,
không sửa (file này có thể liên quan luồng khác). `vi.json` / `en.json`
KHÔNG sửa (parent gộp fragment cuối đợt).

## 1. Đã làm — đóng nợ M5 (LIMITS đợt 56 §5.3)

Nợ M5: `loadReport.ts` có `OVERFLOW_RE = /^Còn \d+ cảnh báo
speedKeyframes khác/` chỉ khớp chuỗi tiếng Việt đóng băng mà
`projectRepo.ts:1112` đẩy ra; dịch câu đó sẽ làm dòng tràn rơi vào
`otherWarnings` và đặt `atCap=false`.

**Đính chính tiền đề của task:** key `projectRepo.moreWarnings` KHÔNG
có sẵn như task mô tả — đã kiểm tra thực tế 2026-11-07: không có trong
fragment round56-m5.json, không có trong bất kỳ fragment nào, không có
trong `vi.json`/`en.json`. M5 chỉ nối `curveFix.moreViolations` (key
khác, cho curveFix), còn site `projectRepo.moreWarnings` ở
projectRepo.ts:1112 vẫn là literal VI chưa nối (LIMITS M5 §5.3 ghi rõ).
Đợt này tạo key mới trong fragment round57-n7.json:

- vi: `Còn {n} cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100).`
  — đúng từng byte template literal ở projectRepo.ts:1112 (test khóa).
- en: `Still {n} more speedKeyframes warnings (limited to showing 100).`

### Regex cũ / mới

Cũ:

```ts
const OVERFLOW_RE = /^Còn \d+ cảnh báo speedKeyframes khác/;
```

Mới (`apps/web/src/lib/loadReport.ts`):

```ts
const OVERFLOW_RE =
  /^(?:Còn (\d+) cảnh báo speedKeyframes khác|Still (\d+) more speedKeyframes warnings)/;
```

Hai nhánh ghim đúng từng chữ template vi/en trong fragment; nhánh EN
giữ hậu tố `warnings` (không neo phần đuôi `(limited…)`) để regex ngắn
gọn nhưng vẫn đủ đặc hiệu nhờ `Still … more speedKeyframes warnings`
— test khóa các dòng gần giống không được khớp (xem §3).

### Đường dịch + số đếm tràn

- `parseOverflowCount(line): number | null` — trích số đếm từ câu tràn
  ở cả hai locale; dòng khác → null.
- `formatOverflowLine(count, lookup?)` — dựng câu tràn theo locale
  hiện tại qua key `projectRepo.moreWarnings` + vars `{n}` (cùng mẫu
  `resolveWarningMessage`: KHÔNG import i18n để test Node
  type-stripping/esbuild vẫn chạy; panel truyền `(k, v) => t(k, v)`).
  Không lookup, hoặc lookup trả đúng key (key chưa gộp vào dict) →
  fallback chuỗi VI cũ đúng từng byte, không hiện key thô.
- `LoadReport` thêm field optional `overflowCount?: number | null`
  (optional để literal `LoadReport` cũ trong
  loadReportFix28.test.ts:229 vẫn biên dịch — không sửa file test cũ).
  `buildLoadReport` gán số đếm đọc từ câu tràn (null khi không có);
  `buildHistoryLoadReport` gán null; `refreshLoadReportAfterFix` reset
  về null cùng `atCap` (quét lại không cắt 100 nên không còn câu tràn).

## 2. Kiểm chứng (số thật, chạy 2026-11-07)

Test mới `apps/web/src/lib/loadReport57N7.test.ts` — **16/16 pass**,
chạy theo mẫu L2 đợt 56 M5 (import extensionless để tsc pass + bundle
esbuild rồi chạy node, vì file này không nằm trong exclude của
tsconfig):

```
./node_modules/.bin/esbuild apps/web/src/lib/loadReport57N7.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round57-n7/n7.test.cjs
node /tmp/round57-n7/n7.test.cjs   →  loadReport57N7: 16 pass, 0 fail
```

Test gồm: fragment parity (chỉ 1 key, vi≠en, placeholder `{n}` cả hai,
vi đúng từng byte literal projectRepo.ts:1112, en không rò VI);
tương thích pre/post merge (nếu dict đã gộp key thì phải khớp
fragment); `formatOverflowLine` không lookup / lookup vi / lookup en /
lookup trả key; `parseOverflowCount` VI+EN + 6 dòng lạ → null;
`buildLoadReport` câu tràn VI/EN (atCap true, trừ khỏi otherWarnings,
`overflowCount` 7, dựng lại đúng câu EN từ count); 100 mục không câu
tràn → `overflowCount` null; dòng gần giống vẫn ở lại otherWarnings;
history/refresh reset count.

Hồi quy (Node type-stripping, từ repo root):

| Suite | Kết quả |
|---|---|
| `loadReport.test.ts` | 10 pass, 0 fail |
| `loadReportFix28.test.ts` | 8 pass, 0 fail |
| `loadReportPerLine29.test.ts` | 14 pass, 0 fail |

`tsc --noEmit` trong `apps/web`: **0 lỗi** (lần kiểm cuối; xem §4 về
lỗi thoáng qua của luồng khác giữa chừng).

`vite build` trong `apps/web`: **pass** (10.81s; cảnh báo chunk
>500kB có sẵn từ trước).

## 3. Trường hợp còn fallback VI + vì sao

1. **Chưa có lookup / key chưa gộp vào dict** — `formatOverflowLine`
   không lookup, hoặc `t()` trả về đúng key → chuỗi VI cũ. Đây là
   thiết kế (cùng mẫu `resolveWarningMessage`): fragment phải được
   parent gộp vào `vi.json`/`en.json` thì bản EN mới tới được runtime.
2. **projectRepo.ts:1112 vẫn đẩy literal VI** — M5 chưa nối site này,
   và file đó ngoài phạm vi luồng N7. Cho tới khi một luồng khác nối
   `trKey(lookup, "projectRepo.moreWarnings", …)` tại đó, câu tràn tới
   `buildLoadReport` luôn là VI; nhánh VI của regex giữ hành vi cũ đúng
   từng byte. Nhánh EN chỉ kích hoạt sau khi site đó được nối.
3. **Panel/toast vẫn hiện `loadReport.atCap` chung chung** — App.tsx,
   LoadReportPanel.tsx, openProjectFlow.ts (ngoài phạm vi) hiện dùng key
   `loadReport.atCap` không có số đếm. `overflowCount` +
   `formatOverflowLine` đã sẵn để một luồng sau đổi panel sang hiện câu
   tràn đã dịch có số thật; luồng này không sửa UI.
4. **Đổi wording fragment → phải đổi regex cùng lúc** — `OVERFLOW_RE`
   ghim đúng từng chữ template vi/en. Test khóa bằng cách dựng câu EN
   trực tiếp từ fragment nên đổi wording mà quên regex sẽ vỡ test chứ
   không lặng lẽ rò chuỗi thô vào `otherWarnings`.

## 4. Ghi chú khác

- Trong lúc chạy, `tsc` có lúc báo 5–6 lỗi ở
  `src/lib/gopTrialDecode57N10.test.ts` (luồng N10 khác đang sửa dở
  file đó); lần kiểm cuối sau đó `tsc` sạch 0 lỗi mà N7 không đụng gì
  tới file đó. Lỗi thoáng qua thuộc luồng khác, không phải nợ của N7.
- `OVERFLOW_KEY = "projectRepo.moreWarnings"` được export để panel /
  luồng nối projectRepo dùng chung một hằng, tránh gõ key lệch nhau.
- Không có binary/dist/`__pycache__`/benchmarks/results trong batch.

## 5. File stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round57-n7-loadreport.txt`
(NUL-delimited, đường dẫn tương đối từ repo root, chỉ file text):

- `apps/web/src/lib/loadReport.ts`
- `apps/web/src/i18n/fragments/round57-n7.json`
- `apps/web/src/lib/loadReport57N7.test.ts`
- `docs/PHASE9_ROUND57_N7_LOADREPORT_LIMITS.md`

## 6. Việc còn lại (cho luồng khác)

1. Nối `projectRepo.ts:1112` bằng
   `trKey(lookup, "projectRepo.moreWarnings", { n: String(...) }, …)`
   (site M5 §5.3) — sau đó câu tràn EN sẽ đi qua regex mới ở đây.
2. Đổi panel/toast (App.tsx / LoadReportPanel.tsx / openProjectFlow.ts)
   từ `t("loadReport.atCap")` sang
   `formatOverflowLine(report.overflowCount ?? 0, t)` khi
   `overflowCount !== null` để hiện số tràn thật đã dịch.
3. Parent gộp `round57-n7.json` vào `vi.json`/`en.json` cuối đợt 57.
