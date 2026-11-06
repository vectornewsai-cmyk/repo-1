# Phase 9 đợt 28, luồng L4 — Nối nút "Sửa" vào LoadReportPanel + i18n J5 + đồng bộ version-history — GIỚI HẠN

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không sửa `store.ts`, `preview.tsx`, `curveFix.ts`, `ExportPanel.tsx`
— toàn bộ luồng này chỉ dùng lại action/hàm đã có của K2 đợt 27.

Đọc cùng: `docs/PHASE9_ROUND27_K5_LOAD_REPORT_LIMITS.md` (gốc panel),
`docs/PHASE9_ROUND27_K2_CURVE_EXPORT_LIMITS.md` (gốc nút sửa),
`apps/web/src/lib/loadReport.ts`, `apps/web/src/components/project/LoadReportPanel.tsx`.

## 1. Đã làm

### (1) Nút "Sửa" đã nối thật trong App.tsx

- `App.tsx` truyền `onFixWarning={handleFixWarning}` vào
  `LoadReportPanel` — nút "🔧 Sửa" nay hiện trên mỗi dòng warning
  (trước đây panel có sẵn nút nhưng App không truyền handler nên
  nút không hiện — đúng nợ §3.4 đợt 27 của K5).
- Handler làm đúng quy trình K2, không tự sửa âm thầm:
  1. Tính trước `sanitizeSpecSpeedCurves(spec)` (không mutate).
  2. Không đổi gì → chỉ toast tóm tắt, không push undo, không
     confirm thừa.
  3. Có đổi → `window.confirm` liệt kê TỪNG thay đổi (từng clip,
     từng keyframe), cộng curve không cứu được, track khóa, và câu
     cảnh báo timing — rồi mới gọi `st.fixSpeedCurveViolations()`
     (store action K2, 1 bước undo duy nhất, label "Sửa curve tốc
     độ vi phạm").
  4. Sau khi sửa: quét lại spec hiện tại bằng
     `collectSpeedCurveWarnings` (J5) rồi
     `refreshLoadReportAfterFix` — warning đã sửa BIẾN MẤT khỏi báo
     cáo, warning chưa sửa được (không cứu được / track khóa) Ở LẠI.
     Panel đang mở tự cập nhật qua subscribe; strip ẩn khi hết
     warning (panel đang mở hiện câu "không có cảnh báo").
- Nói thẳng về phạm vi nút: nút nằm trên MỖI DÒNG nhưng hành động
  sửa là TOÀN SPEC (đúng action `fixSpeedCurveViolations` mà nhiệm
  vụ chỉ định), không phải chỉ sửa dòng vừa bấm. Tiêu đề confirm
  nói rõ "Sửa TẤT CẢ curve tốc độ vi phạm sau?" để user không hiểu
  lầm, và confirm liệt kê đủ mọi thay đổi trước khi áp dụng. Sửa
  riêng từng clip cần thêm store action mới (phải đụng `store.ts`)
  — ngoài phạm vi luồng này, để đợt sau nếu user muốn.

### (2) Khôi phục từ Lịch sử phiên bản đồng bộ báo cáo

- `HistoryPanel.doRestore`: sau `replaceProject` + `markSaved`, quét
  lại spec vừa khôi phục bằng `collectSpeedCurveWarnings` (khôi phục
  bypass `parseProjectText` nên J5 không chạy ở đó — đây chính là
  nguyên nhân nợ cũ), rồi:
  - có vi phạm → `setLastLoadReport(buildHistoryLoadReport(...))`
    (nguồn mới `"history"`, panel ghi "Khôi phục từ lịch sử phiên
    bản" / "Restored from version history");
  - không còn vi phạm → `clearLastLoadReport()` để strip cũ không
    chỉ vào project đã bị thay thế.
- `buildHistoryLoadReport` khác `buildLoadReport` ở 2 điểm, đều có
  chủ đích: `otherWarnings` rỗng (khôi phục không sinh warnings
  chuỗi blob/migration — không bịa dữ liệu), `atCap` luôn false vì
  đây là quét lại TOÀN BỘ spec (không cắt 100 như cổng load), nên
  báo cáo history dài hơn 100 mục vẫn đầy đủ, không ghi "có thể
  còn thêm" sai.
- Strip/panel ở App tự hiện nhờ subscribe module loadReport có sẵn
  — không cần sửa App cho luồng này.

### (3) J5 message theo locale hiện tại (vi/en)

- `projectRepo.ts` (`checkSpeedKeyframes`, cổng duy nhất sinh
  warnings J5 — cả `validateSpecDeep` lẫn `collectSpeedCurveWarnings`
  đều đi qua nó): mỗi warning nay kèm thêm `messageKey` (vd
  `"speedCurve.vOutOfRange"`) + `messageVars` (vd `{ value: "5" }`,
  `{ value: "12", duration: "10" }`, `{ value: "2", prev: "2" }`)
  cho đủ 10 loại vi phạm. `message` tiếng Việt GIỮ NGUYÊN TỪNG CHỮ
  (test khóa chuỗi v=5) để tương thích ngược: chuỗi
  `LoadResult.warnings`, `formatStructured` của loadReport, và các
  test cũ không đổi gì.
- `LoadReportPanel` hiển thị qua `resolveWarningMessage` (mới trong
  `loadReport.ts`): có key → dịch bằng `t()` theo locale HIỆN TẠI
  (đổi ngôn ngữ sau khi load vẫn dịch đúng, vì key + vars không
  phụ thuộc locale lúc load); key thiếu hoặc warning cũ không có
  key → fallback về `message` gốc, không crash, không hiện key thô.
- i18n: 10 key `speedCurve.*` mới + 5 key `loadReport.*` mới
  (`sourceHistory`, `fixConfirmTitle`, `fixConfirmUnsalvageable`,
  `fixConfirmLocked`, `fixConfirmTiming`), vi/en khớp 1–1 — kiểm tra
  bằng test flatten toàn bộ dict (0 key mồ côi cả hai chiều).
- `loadReport.ts` cố tình KHÔNG import `i18n` (i18n import JSON,
  Node type-stripping của test không resolve như vite/tsc — đúng
  lý do K5 đã tránh import projectRepo): hàm dịch nhận `lookup`
  từ UI truyền vào, panel truyền `(k, v) => t(k, v)`.

### (4) Báo cáo "chỉ sống trong phiên": khảo sát + mức tối thiểu

Khảo sát (đọc code thật, không đoán):

- Autosave CÓ SẴN và đã nối báo cáo từ trước (K5): `projectRepo.ts`
  `autosave` ghi spec vào localStorage key `vcut-studio:autosave:v1`
  (debounce 5s qua subscribe spec ở `App.tsx`); `loadAutosave` đi
  qua `parseProjectText` nên sinh lại warnings J5; `App.tsx` lúc
  khởi tạo gọi `buildLoadReport(auto, "autosave", ...)` — tức báo
  cáo ĐÃ được tái tạo từ autosave mỗi lần reload có autosave. Báo
  cáo không cần key localStorage riêng: nó là hàm suy ra từ spec.
- Trường hợp "mất khi reload" còn lại thực chất chỉ là: reload mà
  KHÔNG có autosave → không còn project nào để gắn báo cáo (App
  rơi về project mẫu) — mất báo cáo lúc đó là ĐÚNG, không phải lỗi.
  Ghi key báo cáo riêng cho trường hợp này sẽ gây báo cáo stale
  (mở project B mà strip vẫn chỉ báo cáo của project A) — nên
  luồng này KHÔNG thêm persistence riêng, và nói rõ như vậy thay
  vì fake "đã nối persistence".
- Mức tối thiểu đã implement thật: sau khi bấm "Sửa", App gọi
  `autosaveNow` ngay (không chờ debounce 5s) để spec đã sửa được
  ghi bền vững — đóng cửa sổ "sửa xong reload trong 5s thì báo cáo
  cũ hiện lại". Lưu ý trung thực: `autosaveNow` vẫn nuốt lặng lỗi
  quota/storage (hành vi có sẵn của projectRepo, không phải do
  luồng này thêm); và khôi phục từ history thì autosave vẫn theo
  debounce 5s thường (qua subscribe spec), không gọi autosaveNow —
  vì restore là thao tác xem lại, chưa phải sửa chữa.
- Chưa làm: không có nút "lưu báo cáo ra file" hay đồng bộ báo cáo
  qua history export — báo cáo vẫn là trạng thái phiên làm việc,
  tái tạo được từ spec qua các cổng trên.

## 2. Kết quả kiểm chứng (chạy thật, 31/10/2026)

- Mới `loadReportFix28.test.ts`: **8 pass, 0 fail** (node trực
  tiếp): messageKey đủ 10 loại vi phạm + vars đúng (duration,
  prev, value JSON); message v=5 giữ nguyên từng chữ; dịch en/vi
  đủ vars qua dict thật; thiếu key + warning cũ fallback đúng;
  parity toàn file vi == en + đủ 15 key mới; builder history
  (101 mục vẫn atCap false); refresh giữ nguồn/tên/giờ/lưu ý khác
  và chỉ thay warnings; chuỗi sanitize → quét lại → refresh (v=5
  biến mất, track khóa + keyframes rỗng ở lại).
- Hồi quy (node trực tiếp): K5 `loadReport` **10/10**, J5
  `projectRepoRound26J5` **15/15**, K2 `curveFixRound27K2` **17/17**,
  `projectRepo` **10/10**, `projectRepoNested22` **7/7**,
  `projectHistory` **15/15** — tổng hồi quy 74, cộng 8 mới = **82
  xanh, 0 fail**.
- `npx tsc --noEmit` (apps/web): **0 lỗi** (sạch hoàn toàn).
- `npx vite build` (apps/web): **pass** (5.32s).
- JSON vi/en đã parse kiểm chứng sau khi sửa (không vỡ cú pháp).
- Chưa có click-test browser thật cho nút "Sửa" trong panel (VM
  browser không tới được dev server — cùng giới hạn các đợt trước;
  nút dùng `window.confirm` theo đúng mẫu `ExportPanel.fixCurves`
  và `HistoryPanel`, logic sửa/quét/refresh đã test thuần).

## 3. Chưa làm / giới hạn trung thực

1. **Nút "Sửa" sửa toàn spec, không sửa riêng từng dòng** (xem §1).
   Confirm nói rõ "tất cả" nên không sửa lén, nhưng user nào chỉ
   muốn sửa 1 dòng thì vẫn phải sửa tay hoặc chấp nhận sửa hết.
2. **Chưa dịch hết mọi chỗ hiện message J5.** Chỉ panel đã dịch
   theo locale hiện tại. Còn tiếng Việt hardcode ở: banner
   ExportPanel (`formatSpeedCurveWarning` dùng `message` gốc),
   toast lúc mở file/khôi phục autosave (chuỗi `LoadResult.warnings`
   + tiền tố toast trong App/ProjectMenu), toast tóm tắt sau sửa
   (`formatSanitizeSummary` của curveFix — hàm thuần không import
   i18n được, cùng lý do như §1), và từng dòng thay đổi trong
   confirm (chuỗi `changes` của curveFix). Dịch nốt các chỗ này
   cần đụng ExportPanel + curveFix + ProjectMenu — ngoài phạm vi
   file của luồng này, để đợt sau.
3. **Báo cáo history không có `otherWarnings`.** Khôi phục không
   chạy migration/blob check của cổng load nên không có warnings
   chuỗi để ghi — rỗng là đúng, không phải thiếu. Nếu version cũ
   có blob: URL thì panel history sẽ không nhắc (cổng relink lúc
   mở project vẫn bắt riêng qua `checkMissingMedia`).
4. **Restore từ history không tự mở panel.** Strip hiện (khi có
   warning) để user bấm "Xem báo cáo" — giống hành vi cổng file/
   autosave, không tự bật modal chen ngang thao tác khôi phục.
5. **Panel vẫn chỉ định vị tới clip cấp cao** (giới hạn cũ của K5,
   không đổi): vi phạm trong nested được định vị qua clip ngoài
   cùng + ghi chú rõ.
6. **Không có test render React** cho App handler và doRestore
   (không chạy được bằng Node type-stripping). Hai chỗ này là lớp
   mỏng gọi đúng các hàm thuần đã test: handler = sanitize +
   confirm + store action K2 + collect + refresh + autosaveNow;
   doRestore = collect + buildHistory/clear. Rủi ro còn lại chủ yếu
   là wiring (sai tên prop/import) — đã khóa bằng tsc 0 lỗi +
   vite build pass.

## 4. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/projectRepo.ts` (thêm `messageKey` /
  `messageVars` vào `SpeedCurveWarning` + sinh key/vars ở
  `checkSpeedKeyframes`; `message` giữ nguyên)
- `apps/web/src/i18n/vi.json` (15 key mới)
- `apps/web/src/i18n/en.json` (15 key mới)
- `apps/web/src/lib/loadReport.ts` (nguồn `"history"`,
  `buildHistoryLoadReport`, `refreshLoadReportAfterFix`,
  `resolveWarningMessage`)
- `apps/web/src/components/project/LoadReportPanel.tsx` (hiển thị
  message đã dịch, nhãn nguồn history)
- `apps/web/src/App.tsx` (`handleFixWarning` + truyền
  `onFixWarning` + `autosaveNow` sau sửa)
- `apps/web/src/components/project/HistoryPanel.tsx` (doRestore
  đồng bộ báo cáo)
- `apps/web/tsconfig.json` (thêm `loadReportFix28.test.ts` vào
  exclude, theo quy ước repo)
- `apps/web/src/lib/loadReportFix28.test.ts` (mới, 8 test)
- `docs/PHASE9_ROUND28_L4_LOADREPORT_FIX_LIMITS.md` (mới, file này)

Không đụng: `store.ts`, `preview.tsx`, `curveFix.ts`,
`ExportPanel.tsx`, `ProjectMenu.tsx`. Không push, không tag,
không binary, không file paths-loop (parent lo stage).
