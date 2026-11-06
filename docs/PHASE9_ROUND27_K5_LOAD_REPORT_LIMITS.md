# Phase 9 đợt 27 — Luồng K5: Load-report panel cho warnings J5 — GIỚI HẠN

Đọc cùng: `docs/PHASE9_ROUND26_J5_LOAD_VALIDATION_LIMITS.md` (gốc warnings),
`apps/web/src/lib/loadReport.ts`, `apps/web/src/components/project/LoadReportPanel.tsx`.

## Đã làm (có số đo thật)

- Panel "Báo cáo tải project" bền vững sau khi toast 4.5s của J5 đóng:
  strip dưới TopBar ở `App.tsx` (chỉ hiện khi lần load gần nhất có
  warning cấu trúc) → nút "Xem báo cáo" mở panel; đóng panel thì strip
  quay lại nên mở lại được; "Bỏ qua" mới xoá hẳn báo cáo.
- Panel liệt kê warnings cấu trúc của lần load gần nhất: field vi phạm,
  id clip, đường dẫn đầy đủ (kể cả qua `.subSpec` của nested),
  keyframe nào, giá trị sai, câu J5 nguyên văn, gợi ý sửa; cộng thêm
  mục "Lưu ý khác" cho các cảnh báo chuỗi không phải speedCurve
  (blob: URL, migration, format...).
- Nối đủ 3 cổng load: mở file (`.vcut.json`), khôi phục autosave,
  nhập bản nén (`.vcut.zip`). Cổng archive trước đây nuốt
  `speedCurveWarnings` của `parseProjectText` — nay `ImportArchiveResult`
  kèm trường này (thêm trường tùy chọn, không đổi hành vi cũ).
- Định vị: nút mỗi dòng chọn clip cấp cao chứa vi phạm trên timeline
  (`store.selectMany`) + nhảy playhead tới đầu clip. Clip trong nested
  → chọn clip ngoài cùng + ghi chú rõ. Path không còn khớp spec hiện
  tại (user đã sửa project sau khi load) → không có nút, chỉ ghi chú,
  không crash.
- Điểm nối sửa lỏng cho luồng K2: `LoadReportFixHandler` + prop
  `onFixWarning` của panel. App hiện KHÔNG truyền handler nên chưa có
  nút "Sửa" — K2 chỉ cần truyền handler vào là nút tự hiện, không cần
  sửa module này.
- i18n: 31 key `loadReport.*` mới, vi/en khớp tập key 1–1; kiểm tra
  bằng script: 0 key mồ côi, 0 key dùng mà thiếu trong dict.

## Kết quả kiểm chứng (chạy thật, 31/10/2026)

- `node apps/web/src/lib/loadReport.test.ts`: **10 pass, 0 fail**
  (build/tách chuỗi, cờ tràn 100, store subscribe/clear, resolve
  cấp cao + nested sâu 2 tầng, path lạ/vượt → null, map gợi ý đủ
  field J5, format giá trị + cắt dài, khóa format khớp J5 thật).
- Hồi quy: `projectRepoRound26J5.test.ts` **15/15**,
  `projectRepo.test.ts` **10/10**, `projectRepoNested22.test.ts` **7/7**.
- `npx vite build` (apps/web): **pass** (11.10s).
- `npx tsc --noEmit` toàn repo: chỉ còn **1 lỗi duy nhất** ở
  `src/lib/reversePlayback.test.ts` (TS5097) — file của luồng khác
  trong đợt 27, KHÔNG phải của K5, K5 không sửa (parent gộp sẽ xử lý
  theo quy ước exclude của luồng đó). Mọi file K5 đều sạch tsc.
- `scripts/test-archive.sh`: **37 pass, 1 fail**. Fail đó KHÔNG do K5:
  assertion round-trip text style (kỳ vọng style không có
  bold/italic/x/y/animation nhưng migration trả về có đủ) — K5 chỉ
  thêm 1 trường tùy chọn vào object trả về của `importArchive`,
  không đụng nội dung spec. Ghi ở đây để parent không nhầm là hồi
  quy của đợt này; fail này tồn tại độc lập với thay đổi K5.

## Chưa làm / giới hạn trung thực

1. **Chưa tự sửa/clamp gì.** Panel chỉ xem lại + định vị. Nút "Sửa"
   chưa hiện vì luồng K2 chưa nối handler — đây là điểm nối có chủ
   đích, không phải tính năng bị quên một nửa mà không báo.
2. **Báo cáo chỉ sống trong phiên làm việc** (state module, không ghi
   localStorage). Reload trang mà không có autosave → mất báo cáo.
   Reload có autosave → App khôi phục lại báo cáo từ cổng autosave
   (vì autosave được parse lại và sinh warnings như cũ).
3. **Khôi phục từ Lịch sử phiên bản (HistoryPanel) không set/xoá báo
   cáo.** Restore đi qua `restoreVersion` + `replaceProject`, không
   qua `parseProjectText` nên không có warnings mới; báo cáo của lần
   load trước đó vẫn nằm đó (có tên project + thời gian để nhận
   biết là cũ). Muốn đúng hẳn thì HistoryPanel cũng phải ghi báo cáo
   — để đợt sau, tránh đụng file của luồng khác trong đợt này.
4. **Câu `warning.message` luôn tiếng Việt** (do J5 sinh ở cổng load).
   Panel hiển thị nguyên văn; chỉ chrome panel + gợi ý sửa là i18n.
   Muốn dịch message thì phải sửa J5 (sinh message theo locale) —
   ngoài phạm vi K5.
5. **Định vị chỉ tới clip cấp cao.** Vi phạm nằm sâu trong nested
   được định vị qua clip ngoài cùng; panel ghi chú rõ điều này chứ
   không giả vờ chọn được clip lá trong nested (store chỉ chọn được
   clip cấp cao).
6. **Cờ tràn 100 là best-effort.** Cổng J5 cắt ở 100 mục; khi đúng 100
   mục panel ghi "có thể còn thêm" (không phân biệt được đúng-100
   với tràn-100 nếu thiếu câu tràn). Khi có câu tràn thì chắc chắn
   là tràn.
7. **Không có click-test browser thật.** Harness CDP sẵn có cần dev
   server + Chromium headed; các đợt trước đã ghi VM browser không
   tới được dev server. Panel là lớp hiển thị mỏng trên các hàm đã
   test thuần + store action đã có test riêng, nên rủi ro còn lại chủ
   yếu là layout/CSS — cần 1 lần click-test tay khi parent chạy app.
8. **Strip đặt dưới TopBar, chưa phải nút/badge trong TopBar.**
   Cố tình tránh sửa `TopBar.tsx` trong đợt nhiều luồng song song;
   chuyển strip thành nút TopBar sau này chỉ là việc nhỏ (truyền prop
   từ App). Hành vi (mở lại được sau khi toast đóng) thì đã đủ.
9. **Báo cáo chỉ cho lần LOAD, không cho lần LƯU.** Warnings lúc lưu
   (vd blob: URL khi Ctrl+S) vẫn chỉ qua toast như cũ; tạo project
   mới thì xoá báo cáo load cũ (để không hiển thị báo cáo của
   project đã bỏ).
10. **Chưa có sao chép đường dẫn / lọc theo field / tìm kiếm** trong
    panel. Danh sách tối đa 100 mục, cuộn dọc — đủ cho mục đích xem
    lại, chưa phải công cụ quản lý warnings đầy đủ.
