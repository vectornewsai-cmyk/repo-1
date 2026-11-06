# Phase 9 đợt 29, luồng L4 — Nút "Sửa dòng này" (sửa riêng từng dòng) + dịch nốt J5 + click-test nút Sửa — GIỚI HẠN

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không sửa `ExportPanel.tsx` (luồng L3 sở hữu) và không sửa
`ProjectMenu.tsx` — các chỗ chưa dịch trong hai file đó chỉ liệt kê
thành nợ ở §3, không sửa lén. Đọc cùng:
`docs/PHASE9_ROUND28_L4_LOADREPORT_FIX_LIMITS.md` (nút Sửa toàn spec
cũ + i18n J5 đợt 28), `docs/PHASE9_ROUND27_K2_CURVE_EXPORT_LIMITS.md`
(gốc luật sanitize), `apps/web/src/lib/curveFix.ts`.

## 1. Đã làm

### (1) Sửa RIÊNG từng dòng: store action + hàm thuần mới

- `curveFix.sanitizeOneSpeedCurve(spec, targetPath)` (mới, thuần,
  không mutate): parse path J5 của clip (`tracks[i].clips[j]`, nối
  `.subSpec.` cho nested), sanitize ĐÚNG luật K2 cũ nhưng CHỈ cho
  curve của clip đó. Clip/track khác giữ nguyên tham chiếu
  (structural sharing); track khóa ở bất kỳ tầng nào trên đường đi →
  clip đích vào `skippedLocked` (không đổi gì); curve không cứu được
  → `unsalvageable` kèm `reasonKey`; path không parse được / không
  tìm thấy clip / clip không mang speedKeyframes / clip đã hợp lệ →
  `changed=false`, các danh sách rỗng, trả đúng tham chiếu spec cũ.
- `store.fixOneSpeedCurveViolation(path, summary?)` (mới): 1 bước
  undo duy nhất qua `execCommand` (label riêng "Sửa curve tốc độ của
  1 clip (báo cáo tải)", phân biệt với label sửa toàn spec của K2);
  không đổi gì thì không push entry undo, không toast (giống action
  K2). `summary` tùy chọn là tóm tắt đã dịch theo locale (App
  truyền); không truyền → tóm tắt tiếng Việt mặc định.
- `store.fixSpeedCurveViolations(summary?)`: chỉ thêm tham số tùy
  chọn, hành vi cũ giữ nguyên — ExportPanel gọi không tham số nên
  vẫn toast tiếng Việt như trước (xem nợ §3.3).
- `LoadReportPanel`: mỗi dòng nay có nút "🔧 Sửa dòng này"
  (`loadReport.fixLine`); trên danh sách có thêm MỘT nút riêng
  "🔧 Sửa tất cả curve vi phạm" (`loadReport.fixAll`, prop mới
  `onFixAllWarnings`) giữ hành vi sửa toàn spec của đợt 28 nhưng
  nhãn nay nói rõ là "tất cả" — không còn nút nào mang nhãn "Sửa"
  chung chung gây hiểu lầm. Prop `onFixWarning` giữ nguyên tên
  (không vỡ caller cũ) nhưng ngữ nghĩa đổi từ sửa-toàn-spec thành
  sửa-riêng-dòng — ghi rõ trong comment của panel + App.
- `App.handleFixWarning(w)` (mới): preview bằng sanitizeOne →
  không sửa được gì thì chỉ toast tóm tắt đã dịch (không confirm
  thừa, không push undo) → có sửa thì `window.confirm` liệt kê
  CHỈ thay đổi của clip đó (tiêu đề `fixLineConfirmTitle` ghi rõ
  clip + path) → gọi store action per-line → quét lại spec, báo cáo
  cập nhật (dòng đã sửa biến mất, dòng khác ở lại), `autosaveNow`
  ngay. `App.handleFixAllWarnings` giữ chuỗi đợt 28 cho nút tất cả.
- Nói thẳng về hạt sửa: "riêng từng dòng" có nghĩa là riêng từng
  CLIP (một dòng = một warning, nhưng một clip có thể có nhiều
  warning). Bấm "Sửa dòng này" sửa hết mọi vi phạm của clip đó
  trong một lần — vì sanitize làm việc ở mức curve, không cắt nhỏ
  tới từng keyframe. Các dòng khác của cùng clip cũng biến mất cùng
  lúc (đúng, vì chúng cùng một curve đã sạch), các clip khác không
  đụng tới. Đây là hạt tự nhiên của luật K2, không phải sửa nửa
  curve rồi để lại warning giả.

### (2) Dịch nốt các chỗ hiện message J5 (trong phạm vi luồng)

- `curveFix` nay sinh bản song song có cấu trúc cho mọi thay đổi:
  `SanitizeCurveResult.changeItems` + `CurveFixEntry.changeItems`
  (key `curveFix.change*` + vars, cùng thứ tự/độ dài với `changes`),
  và `reasonKey` (`curveFix.reason*`) cho 3 lý do không cứu được.
  Chuỗi `changes` / `reason` tiếng Việt GIỮ NGUYÊN TỪNG CHỮ (test
  khóa: dịch vi của changes khớp từng chữ changes gốc; tóm tắt vi
  khớp từng chữ `formatSanitizeSummary` cũ).
- `curveFix.formatSanitizeSummaryLocalized(res, lookup)` (mới):
  tóm tắt sau sửa theo locale hiện tại (4 key `curveFix.summary*`);
  key thiếu → fallback về mảnh tiếng Việt cũ, không hiện key thô.
  `curveFix` vẫn KHÔNG import i18n (cùng lý do đợt 28: test Node
  type-stripping không resolve JSON import như vite/tsc) — UI truyền
  lookup `(k, v) => t(k, v)`.
- `loadReport.formatFixEntryChanges` (mới): từng dòng thay đổi trong
  confirm theo locale hiện tại; thiếu/mismatch changeItems → fallback
  về chuỗi gốc từng dòng. `loadReport.resolveUnsalvageableReason`
  (mới): lý do không cứu được theo locale, thiếu key → chuỗi gốc.
  `loadReport.formatWarningTranslated` (mới): chuỗi đầy đủ
  `path (clip "id"): message-đã-dịch`, cùng format J5.
- `App` áp dụng dịch ở 3 chỗ: (a) confirm sửa per-line + confirm
  sửa tất cả (từng dòng thay đổi + lý do không cứu được đều qua
  helper trên); (b) toast tóm tắt sau sửa (store action nhận
  summary đã dịch từ App, cả hai nút); (c) toast khôi phục autosave
  (dựng lại từ báo cáo có cấu trúc: warnings J5 qua
  `formatWarningTranslated` + `otherWarnings` giữ nguyên + câu atCap
  khi bị cắt 100 — thay cho chuỗi tiếng Việt đóng băng lúc load).
- i18n: 4 key `loadReport.*` mới (`fixLine`, `fixAll`,
  `fixLineConfirmTitle`, `autosaveRestoredNote`) + nhóm
  `curveFix.*` mới 17 key (4 summary + 10 change + 3 reason),
  vi/en khớp 1–1 — kiểm tra bằng test flatten toàn bộ dict
  (0 key mồ côi cả hai chiều). Key `loadReport.fix` cũ ("Sửa" /
  "Fix") không còn code nào dùng sau đợt này nhưng vẫn giữ trong
  cả hai dict (tránh vỡ caller/test ngoài luồng kiểm tra key cũ);
  ghi nhận là key legacy, đợt sau có thể xoá cùng lúc hai locale.
- Lưu ý vi về toast autosave: message J5 dịch là dạng ngắn của dict
  `speedCurve` (không còn tiền tố `.speedKeyframes.keyframes[i]`
  như message J5 gốc) — cùng dạng panel đã hiện từ đợt 28. Toast vi
  vì vậy ngắn hơn chuỗi gốc ở các warning từng keyframe, nhưng vẫn
  giữ đủ path clip / clipId / field / giá trị qua vars; message J5
  gốc đầy đủ không mất (panel + báo cáo vẫn giữ `message` gốc
  trong dữ liệu, chỉ cách hiển thị dùng dạng ngắn).

### (3) Click-test browser thật cho nút Sửa (nợ đợt 28 đã đóng)

- Script mới `apps/web/scripts/clicktest-l4-round29-pipe.mjs` (tái
  dùng infra L5: pipe CDP `--remote-debugging-pipe` + snapshot dist
  + seed qua autosave + static server; khác L5 ở chỗ PipeCdp tự
  động CHẤP NHẬN `window.confirm` thật và GHI LẠI message để assert
  — không stub confirm, nút bấm là click chuột CDP thật).
- Seed: 1 track, CLIP-A v=5, CLIP-B v=9 (cùng duration 10) → báo cáo
  đúng 2 warnings theo thứ tự A, B. Kết quả 6/6 pass (log đầy đủ ở
  `~/workspace/tmp-round29-l4/v29-l4-clicktest.json`):
  - K1: click strip "Xem báo cáo" (cdp-input) mở panel: head
    "(2)", đúng 2 dòng, 2 nút "Sửa dòng này" + 1 nút "Sửa tất cả".
  - K2: click "Sửa dòng này" dòng đầu (cdp-input) → confirm thật
    CHỈ nhắc CLIP-A, KHÔNG nhắc CLIP-B, tiêu đề ghi rõ clip;
    autosave sau sửa: A=4, B vẫn 9 (không sửa lén); panel còn đúng
    1 dòng CLIP-B.
  - K3: click "Sửa tất cả" (cdp-input) → confirm nhắc CLIP-B +
    tiêu đề "tất cả"; autosave A=4, B=4; panel hiện câu không có
    cảnh báo.
  - K4/K6: 0 `Runtime.exceptionThrown` ở cả hai phiên.
  - K5 (locale en, phiên riêng): strip/panel en bấm thật, nút
    "Fix this line" / "Fix all violating curves" hiện đủ; confirm
    en chỉ nhắc CLIP-A, không rò key thô (`loadReport.*` /
    `curveFix.*`), không rò tiếng Việt; autosave A=4, B=9.

## 2. Kết quả kiểm chứng (chạy thật, 31/10/2026)

- Mới `loadReportPerLine29.test.ts`: **14 pass, 0 fail** (node trực
  tiếp): per-line chỉ clip đích đổi (tham chiếu clip khác giữ
  nguyên), một dòng sửa hết vi phạm của clip đó, path nested chỉ
  sửa clip trong, track khóa → skippedLocked không đổi spec, curve
  rỗng → unsalvageable + reasonKey, path lạ/hợp lệ/không-curve →
  không đổi rỗng, changeItems song song changes đủ key, dịch changes
  vi khớp từng chữ + en không rò key/vi, fallback thiếu/mismatch
  key, reason vi/en, tóm tắt vi khớp từng chữ hàm cũ + en đủ 3
  mảnh, parity toàn file vi == en + đủ 21 key mới, formatWarning
  dịch, chuỗi App per-line (A biến mất, B ở lại sau refresh).
- Hồi quy (node trực tiếp): K5 `loadReport` **10/10**, đợt 28
  `loadReportFix28` **8/8**, J5 `projectRepoRound26J5` **15/15**, K2
  `curveFixRound27K2` **17/17**, `projectRepo` **10/10**,
  `projectRepoNested22` **7/7**, `projectHistory` **15/15** — tổng
  hồi quy 82, cộng 14 mới = **96 xanh, 0 fail**.
- `npx tsc --noEmit` (apps/web): **0 lỗi** (sau khi sửa 2 lỗi type
  phát hiện trong lượt: annotation unsalvageable cục bộ thiếu
  reasonKey và skippedLocked per-line thiếu `changes: []`).
- `npx vite build` (apps/web): **pass** (5.02s).
- JSON vi/en đã parse kiểm chứng sau khi sửa (không vỡ cú pháp).
- Click-test: **6/6 pass** (xem §1.3; bundle snapshot chứa đủ 4
  nhãn mới nên dist dùng để test đúng là code đợt 29).

## 3. Chưa làm / giới hạn trung thực

1. **Chưa dịch banner ExportPanel** (`formatSpeedCurveWarning` dùng
   `message` gốc) — file này thuộc luồng L3, luồng này KHÔNG sửa
   lén. Muốn dịch cần thêm `formatWarningTranslated` vào banner
   (đã có sẵn helper, chỉ cần nối prop/lookup ở ExportPanel).
2. **Chưa dịch toast lúc mở file / nhập bản nén trong
   ProjectMenu** (`warnList` dùng `LoadResult.warnings` chuỗi) —
   file này ngoài phạm vi luồng; sửa được bằng cách dựng toast từ
   `speedCurveWarnings` có cấu trúc qua `formatWarningTranslated`
   như App đã làm cho toast autosave (nhưng ProjectMenu có cả cổng
   save-current-project chỉ có chuỗi, cần xử lý riêng).
3. **Toast sau sửa từ ExportPanel vẫn tiếng Việt** (cả hai locale):
   ExportPanel gọi `fixSpeedCurveViolations()` không tham số nên
   nhận tóm tắt vi mặc định — đúng thiết kế tương thích (tham số
   summary là tùy chọn), nhưng muốn toast đó dịch theo locale thì
   ExportPanel phải truyền summary đã dịch (thuộc luồng L3).
4. **Confirm per-line không liệt kê warning chưa sửa của clip khác**
   (đúng chủ đích: chỉ liệt kê thay đổi của clip đích). User muốn
   biết toàn cảnh trước khi bấm từng dòng thì mở panel xem danh
   sách đầy đủ — confirm không phải chỗ xem toàn cảnh.
5. **Hạt sửa là mức clip, không phải mức keyframe** (xem §1.1):
   không có cách chỉ sửa 1 keyframe trong khi giữ nguyên keyframe
   vi phạm khác của cùng clip qua nút này — muốn vậy phải sửa tay
   trong Speed panel.
6. **Panel vẫn chỉ định vị tới clip cấp cao** (giới hạn cũ của K5,
   không đổi): vi phạm trong nested được định vị qua clip ngoài
   cùng + ghi chú rõ; nhưng nút "Sửa dòng này" thì sửa đúng clip
   trong (theo path đầy đủ), không bị giới hạn định vị này.
7. **Không có test render React** cho App handler và panel (không
   chạy được bằng Node type-stripping, như mọi đợt trước). Hai chỗ
   này là lớp mỏng gọi đúng các hàm thuần đã test; wiring đã khóa
   bằng tsc 0 lỗi + vite build pass + click-test browser thật 6/6
   (click-test chính là bằng chứng wiring đúng: nút → confirm →
   store action → autosave → panel cập nhật).
8. **Click-test auto-accept confirm** (ghi rõ, không giấu): dialog
   `window.confirm` là thật (browser tự mở, CDP ghi lại message),
   chỉ có thao tác "bấm OK" là harness tự chấp nhận qua
   `Page.handleJavaScriptDialog` — vì không có người bấm OK thật.
   Nội dung confirm được assert đầy đủ nên việc chấp nhận tự động
   không làm giảm giá trị kiểm chứng của các case K2/K3/K5; trường
   hợp user bấm Cancel (không áp dụng gì) chỉ được khóa bằng logic
   thuần (`if (!confirm) return` trước mọi store action), chưa có
   case click-test cho Cancel.

## 4. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/curveFix.ts` (changeItems + reasonKey,
  `sanitizeOneSpeedCurve`, `formatSanitizeSummaryLocalized`;
  `changes`/`reason`/`formatSanitizeSummary` cũ giữ nguyên)
- `apps/web/src/lib/loadReport.ts` (`formatWarningTranslated`,
  `formatFixEntryChanges`, `resolveUnsalvageableReason`)
- `apps/web/src/store.ts` (action mới `fixOneSpeedCurveViolation`,
  tham số `summary?` cho `fixSpeedCurveViolations`)
- `apps/web/src/components/project/LoadReportPanel.tsx` (nút
  "Sửa dòng này" mỗi dòng + nút "Sửa tất cả" riêng, prop mới
  `onFixAllWarnings`)
- `apps/web/src/App.tsx` (`handleFixWarning` per-line mới,
  `handleFixAllWarnings`, toast autosave dịch, truyền cả hai
  handler vào panel)
- `apps/web/src/i18n/vi.json` (4 key `loadReport.*` + 17 key
  `curveFix.*` mới; key `loadReport.fix` cũ giữ lại, xem §1.2)
- `apps/web/src/i18n/en.json` (như vi, parity 1–1)
- `apps/web/tsconfig.json` (thêm `loadReportPerLine29.test.ts` vào
  exclude, theo quy ước repo)
- `apps/web/src/lib/loadReportPerLine29.test.ts` (mới, 14 test)
- `apps/web/scripts/clicktest-l4-round29-pipe.mjs` (mới, click-test
  CDP 6/6; log ở `~/workspace/tmp-round29-l4/v29-l4-clicktest.json`
  — thư mục tmp ngoài repo, không đưa vào batch)
- `docs/PHASE9_ROUND29_L4_PERLINE_FIX_LIMITS.md` (mới, file này)

Không đụng: `ExportPanel.tsx`, `ProjectMenu.tsx`, `projectRepo.ts`
(message J5 giữ nguyên), `preview.tsx`, `HistoryPanel.tsx`.
Không push, không tag, không binary, không file paths-loop (parent
lo stage). `apps/web/dist/` chỉ được build lại tại chỗ để
click-test snapshot, không tính là file đổi của đợt.
