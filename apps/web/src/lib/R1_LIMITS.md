# R1 (Phase 9) — Phút đầu tiên dùng app + template dùng ngay: giới hạn & ghi chú trung thực

Ngày: 2026-10-24. Agent: R1. **KHÔNG PUSH** — code chỉ nằm trên đĩa, chờ parent gom batch.

## Đã làm

1. **Màn chào lần đầu** (`components/onboarding/WelcomeModal.tsx`):
   mở app lần đầu (chưa có `vcut-welcomed` trong localStorage) thì hiện modal
   giá trị + 3 bước bắt đầu. Nút: Xem project mẫu (gọi `loadSample` có sẵn),
   Tạo video 1 chạm (mở pack modal), Xem tour 5 bước, Project trống, Để sau.
   Đóng bằng nút nào cũng đánh dấu đã chào; mở lại bằng nút “👋 Bắt đầu” trên TopBar.
2. **Tour 5 bước** (`components/onboarding/TourCard.tsx`): thẻ nổi góc dưới phải,
   đi qua thêm media → cắt → chữ → hiệu ứng → xuất. Mỗi bước highlight khu vực
   thật qua `[data-tour]` (media, timeline, add-text, inspector, export); panel
   đang đóng (vd: mobile chưa mở sheet) thì chỉ hiện hướng dẫn, không kẹt.
   Hoàn thành ghi `vcut-tour-done`. Bỏ qua được bất kỳ lúc nào, không chặn user.
3. **Template pack 1 chạm** (`components/onboarding/TemplatePackModal.tsx` +
   `lib/templatePack.ts` + `lib/sampleMedia.ts`): 6 pack tuyển (title-card,
   youtube-intro, birthday-card, app-launch, travel-vlog-intro, sale-countdown —
   mỗi pack đúng 1 placeholder media, phủ 16:9 / 1:1 / 9:16). Media mẫu sinh
   ngay trên máy: video = webm ghi từ Canvas qua MediaRecorder, ảnh = PNG
   Canvas. Chữ lấy đúng default của template. Sau khi tạo: “Xem ngay” (tua về 0
   + phát), “Tạo giọng đọc mẫu” (gọi /api/tts thật qua bridge, giọng mặc định
   của server — bridge chưa chạy thì báo lỗi rõ, không có audio giả).
4. **Chuỗi riêng** (`lib/onboardingCopy.ts`, vi/en): cố tình KHÔNG sửa
   `i18n/vi.json` và `i18n/en.json` (agent khác đang làm i18n). Ngôn ngữ lấy từ
   `getLang()` nên vẫn đổi theo nút đổi ngôn ngữ. Khi agent i18n xong, gộp key
   trong file này vào vi/en.json rồi đổi `ot()` sang `t()`.

## Kiểm chứng thật (đều xanh)

- `npx tsc --noEmit`: file R1 sạch 0 lỗi. Toàn app còn đúng 1 lỗi ở
  `lib/webglLut.ts` (của agent khác đang làm WebGL LUT) — R1 không sửa file người khác.
- `npx vite build`: pass.
- `bash apps/web/scripts/test-r1-pack.sh`: logic pack **28/28** + render thật
  pack youtube-intro bằng `server/render/src/render.js` → MP4 2.3MB, đúng 5.0s.
- Click-test Chromium thật (Playwright + CDP, dev server Vite, script
  `/tmp/r1-clicktest/click-r1.js` — scratch ngoài repo): **11/11 pass** —
  welcome hiện lần đầu, mở pack từ welcome, tạo pack thành công, tên project
  đổi theo pack, timeline có 2 clip, mở lại welcome từ TopBar, tour hiện,
  highlight đúng panel media, đi hết 5 bước, tour đóng, ghi dấu localStorage.

## Giới hạn — nói thẳng, không claim hơn

- **TopBar vẫn tràn ngang ở màn 1440px** (đã tràn từ trước, Q2 xác nhận:
  scrollW ~2384px; nút “Bắt đầu” mới đẩy lên ~2547px). Nút mới vẫn bấm được
  bằng cách cuộn ngang TopBar — giống nút Xuất bản/ngôn ngữ hiện tại — nhưng
  đây là điểm cần thiết kế lại TopBar ở đợt sau, R1 không làm (ngoài phạm vi,
  dễ xung đột với agent khác).
- **Pack chỉ nhận placeholder video/image/text.** Placeholder audio → lỗi rõ
  ràng, không sinh audio giả. Video sinh thất bại (thiếu MediaRecorder) →
  lỗi rõ ràng, không dùng ảnh tĩnh giả làm video.
- **Giọng đọc mẫu cần bridge local chạy** (127.0.0.1:8787 + model VieNeu-TTS).
  Chưa chạy bridge thì nút báo lỗi rõ, không tự bịa file.
- **Media mẫu là hình vẽ Canvas trừu tượng** (gradient + vòng tròn + nhãn),
  đủ để xem/preview/xuất thử ngay nhưng không phải footage thật. Đừng quảng
  cáo là “kho footage”.
- **Project mẫu có sẵn (loadSample) vẫn là project mặc định** khi chưa có
  autosave; màn chào chỉ thêm đường vào pack/tour, không thay hành vi đó.
- **Tour chưa tự thao tác hộ user** (không tự bấm nút, không tự tạo clip):
  nó chỉ dẫn + highlight. Click-test tour cũng chỉ kiểm chứng luồng, chưa kiểm
  chứng user làm theo từng bước có ra kết quả không.
- **Chưa test trên mobile thật / Safari thật** — modal dùng class `.modal`
  có sẵn (max-width theo viewport) nên co được, nhưng chưa bấm thử trên điện thoại.
- **Chưa gộp chuỗi vào vi.json/en.json** (cố tình, xem mục 4) — nếu agent i18n
  đổi cấu trúc key thì file này vẫn chạy độc lập, không vỡ.

## File đã tạo/sửa (chưa push)

- Tạo: `apps/web/src/lib/onboardingCopy.ts`, `apps/web/src/lib/sampleMedia.ts`,
  `apps/web/src/lib/templatePack.ts`, `apps/web/src/lib/R1_LIMITS.md` (file này),
  `apps/web/src/components/onboarding/WelcomeModal.tsx`,
  `apps/web/src/components/onboarding/TourCard.tsx`,
  `apps/web/src/components/onboarding/TemplatePackModal.tsx`,
  `apps/web/scripts/r1-pack.test.cjs`, `apps/web/scripts/test-r1-pack.sh`.
- Sửa (tối thiểu): `apps/web/src/App.tsx` (state + render 3 modal),
  `apps/web/src/TopBar.tsx` (prop onWelcome + nút “👋 Bắt đầu” + data-tour
  cho nút chữ/xuất), `apps/web/src/MediaBin.tsx`, `apps/web/src/Timeline.tsx`,
  `apps/web/src/Inspector.tsx` (mỗi file chỉ thêm thuộc tính `data-tour`),
  `apps/web/src/styles.css` (thêm cuối file: .tour-card, .tour-highlight, .pack-row).
- KHÔNG sửa: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`,
  `apps/web/src/store.ts` (dùng sẵn replaceProject/importFiles/checkMissingMedia),
  mọi file ngoài `apps/web/src` và `apps/web/scripts`.
- Scratch ngoài repo (không push): `/tmp/r1-clicktest/click-r1.js`,
  `/tmp/r1-clicktest/final.png`, `/tmp/vcut-test-r1pack/`, `/tmp/vcut-test-r1render/`.
