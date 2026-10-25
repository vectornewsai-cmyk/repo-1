# D1 Phase 9 đợt 4 — Sửa triệt để TopBar tràn ngang (LIMITS trung thực)

## Vấn đề gốc (đo thật trước khi sửa, Chromium headless + CDP)
- Ở viewport 1440px, `.topbar` có `scrollWidth = 2547px` (khớp số R1/R6 đã ghi:
  Q2 đo 2384px, R1 đo ~2547px sau khi thêm nút "Bắt đầu").
- 12/23 nút nằm ngoài viewport (từ x=1484 trở đi: thêm chữ, tách, sao chép,
  dán, nhân bản, phụ đề, cắt lặng, mẫu, xoá, xuất bản, bắt đầu, ngôn ngữ)
  và **bấm thật không có tác dụng** — CDP click vào tọa độ ngoài viewport
  không tới được nút. Đây chính là lỗi user phàn nàn.
- Workaround cũ của Q2 (`overflow-x: auto` trên `.topbar`) chỉ giấu lỗi: nút
  vẫn ở đó nhưng user phải tự phát hiện và cuộn ngang mới bấm được.

## Đã làm (chỉ 2 file sửa + 2 file mới, không động file agent khác)
- `apps/web/src/TopBar.tsx`:
  - Tách nhóm ưu tiên (xuất bản, bắt đầu, ngôn ngữ) ra khỏi
    `.topbar-actions` thành `.topbar-priority` đặt ngay sau transport —
    hàng 1 luôn thấy/bấm được 3 nút này trước.
  - 9 nút công cụ clip (thêm chữ, tách, sao chép, dán, nhân bản, phụ đề,
    cắt lặng, mẫu, xoá) dùng chung component `ShortLabel`: tách chuỗi i18n
    dạng "emoji + chữ" thành icon + `<span className="tbtn-label">` để CSS
    ẩn riêng phần chữ ở viewport hẹp. **Không sửa key i18n nào** (vẫn gọi
    đúng `t("topbar.*Short")`), không sửa `i18n/vi.json`/`en.json`.
  - Giữ nguyên 100%: mọi handler, `title`, `aria-label`, `disabled`,
    `data-tour="add-text"` và `data-tour="export"` của R1, nút "👋 Bắt đầu"
    (title/aria-label hardcoded giữ verbatim).
- `apps/web/src/styles.css` (chỉ phần TopBar):
  - `.topbar`: `flex-wrap: wrap` + `row-gap: 6px`, bỏ `overflow-x: auto`,
    đặt `overflow: visible` (overflow-x khác visible sẽ ép overflow-y
    thành auto theo spec và cắt flash-msg absolute dưới header).
  - `.topbar-actions`: `flex: 1 1 100%` (ép xuống hàng 2) + `flex-wrap: wrap`
    (lưới an toàn: không bao giờ tràn ngang dù nội dung có dài thêm) +
    `min-width: 0` (xem mục mobile) + thu gọn (gap 4px, padding 5px 6px,
    font 12px).
  - `.project-menu`: `flex-wrap: wrap` + gap 4px (chỉ CSS — không sửa
    `ProjectMenu.tsx`).
  - Media query `(min-width: 769px) and (max-width: 1360px)`: ẩn
    `.tbtn-label` (nút clip chỉ còn icon, tooltip `title` vẫn đầy đủ).
    Không chạm khoảng mobile `<=768px` vốn do `mobile.css` quản lý, trừ
    1 rule `min-height: 44px` cho nút `.topbar-priority` (mobile.css chỉ
    phủ `.topbar-actions`, không biết element mới này).
- Mới: `apps/web/scripts/d1-topbar-test.cjs` (đo + click-test thật qua CDP,
  mẫu R6, không cần Playwright; chạy với `D1_DEV_URL`, `D1_VIEWPORTS`).

## Số đo thật sau khi sửa (script trên, bản `vite build` + `vite preview`)
- **1440px: 24/24 tiêu chí pass.** TopBar cao 98px = đúng 2 hàng (hàng 1:
  brand + tên + transport + ưu tiên; hàng 2: toàn bộ công cụ 1 hàng),
  `scrollWidth = clientWidth = 1440`, 23/23 nút có `right <= 1440`, bấm thật
  phát/tạm dừng, thêm chữ (3 -> 4 clip), xuất bản (panel Xuất video mở),
  bắt đầu (welcome mở), ngôn ngữ (`vcut-lang` null -> en -> vi).
- **1280px: pass toàn bộ, cũng 2 hàng 98px.** Nhãn clip ở dạng icon-only
  (media query <=1360px), 23/23 nút trong viewport, bấm thật đủ 5 nút.
- **390px (mobile, emulation R6): pass toàn bộ, không tràn.**
  `scrollWidth = clientWidth = 390`, 23/23 nút trong viewport, bấm thật đủ
  5 nút. TopBar mobile cao 437px (nhiều hàng wrap — chấp nhận được, đúng
  triết lý wrap sẵn của `mobile.css`).
- Hồi quy: `tsc --noEmit` 0 lỗi, `vite build` pass, `r6-i18n-check` PASS,
  **click-test R6 12/12 pass** trên cùng bản build — đáng chú ý: test i18n
  của R6 trước đây "phải cuộn topbar 1107px để tới nút" nay ghi
  **"cuộn topbar 0px"**; T6a mobile `scrollWidth=390` vẫn pass.

## Hai cái bẫy đã gặp (đừng lặp lại)
1. **Mobile tràn là lỗi thật, không phải lỗi đo — nhưng gốc không phải
   TopBar mà là `min-width: auto` của flex item.** `.project-menu` vốn
   `nowrap`, 7 nút + chỉ báo rộng ~700px ở mobile; flex item mặc định
   không co dưới min-content nên `.topbar-actions` phình tới 702px dù
   topbar chỉ 390px. Sửa bằng `flex-wrap: wrap` cho `.project-menu` và
   `min-width: 0` cho `.topbar-actions` (đo offset-based xác nhận:
   topbar `scrollWidth` 712 -> 390). Lưu ý: trước D1, lỗi này bị che vì
   `.topbar` có `overflow-x: auto` (cuộn nội bộ) nên check
   `documentElement.scrollWidth` của R6 vẫn pass dù nút mobile cũng phải
   cuộn mới bấm được — R6 chưa từng kiểm tra nút topbar ở mobile.
2. **Đo viewport phải dùng `Emulation.setDeviceMetricsOverride` + reload
   cho MỌI cỡ, không dùng `--window-size`.** `--window-size=390,844` cho
   ra `clientWidth=500` khó hiểu; không set override cho 1280 thì kẹt ở
   1440 của cửa sổ. Ngoài ra sau `Page.reload` phải chờ cả `.topbar` lẫn
   clip — chỉ chờ clip sẽ dính DOM cũ trước reload và cho kết quả rỗng.
   Bài học phụ: `window.innerWidth` dưới emulation mobile/dsf=2 báo 712
   trong khi layout viewport là 390 — đừng dùng `innerWidth` làm chuẩn,
   dùng `documentElement.clientWidth` + tọa độ offset.

## Giới hạn còn lại (nói thẳng)
- TopBar desktop cao 98px thay vì 59px trước đây (2 hàng thay cho 1 hàng
  + cuộn). Đánh đổi có chủ ý: mọi nút đều thấy được ngay, không còn nút
  bị giấu ngoài viewport. Nếu muốn gọn hơn nữa thì phải gom nút vào menu
  "..." (mất 1 click) hoặc thu hẹp ProjectMenu — không làm trong D1 vì
  vượt phạm vi "giữ nguyên mọi chức năng".
- Ở 769–1360px, nút clip chỉ còn icon (chữ ẩn bằng CSS, tooltip vẫn đủ).
  Người dùng chưa quen có thể phải hover để đọc tooltip trong khoảng này.
- Ở mobile, TopBar cao 437px (7+ hàng wrap). Nút vẫn bấm được hết nhưng
  chiếm nhiều diện tích dọc — cải thiện tiếp (gom menu mobile) là việc
  của đợt sau, ngoài phạm vi D1.
- Chỉ báo autosave trong ProjectMenu vẫn hiện đầy đủ (không ẩn) — hàng 2
  ở 1440px vừa khít với ~60px dư (right max 1350/1426), nên nếu ProjectMenu
  thêm nút dài trong tương lai, hàng 2 sẽ wrap thêm 1 hàng phụ (vẫn không
  tràn, nhờ `flex-wrap` lưới an toàn).
- Chưa test trên trình duyệt thật / Safari / Firefox (chỉ Chromium
  headless) và chưa test màn hình cảm ứng thật.
- Dev server vite cổng 5180 do D1 khởi động vẫn đang chạy (workspace
  dùng chung, các agent khác cũng đang sửa file nên không kill để khỏi
  phá test của họ); preview 5181 đã tắt sau khi đo xong.

## File đã tạo/sửa (CHƯA PUSH — code chỉ nằm trên đĩa)
- Sửa: `apps/web/src/TopBar.tsx`, `apps/web/src/styles.css`.
- Mới: `apps/web/scripts/d1-topbar-test.cjs`, `apps/web/src/lib/D1_LIMITS.md`
  (file này).
- KHÔNG sửa: `ProjectMenu.tsx`, `i18n/vi.json`, `i18n/en.json`,
  `mobile.css`, và mọi file khác. Build output `dist/` không thuộc batch.
