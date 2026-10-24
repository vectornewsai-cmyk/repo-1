# Q6 — Mobile-web foundation: phạm vi thật và giới hạn (Phase 8)

> Tài liệu trung thực cho phần mobile-web của VCut Studio. Đọc trước khi
> hứa hẹn bất cứ điều gì về "mobile" với người dùng.

## Đây là mobile-WEB, không phải app native

- **Chưa có app iOS/Android thật.** Không có build Xcode/Android Studio,
  không có app trên App Store/Play Store, không có native code (Swift/Kotlin),
  không có push notification native, không có quyền hệ thống của app.
  App native thật là một phase sau, riêng biệt.
- **Cài đặt được lên màn hình chính** qua PWA ("Add to Home Screen" trên
  iOS Safari, "Install app" trên Android Chrome). Trên iOS, đây là Web Clip
  chạy Safari engine, không phải app App Store.

## Những gì đã làm thật (Q6, Phase 8)

1. **Responsive editor** (`mobile.css`, nạp sau `styles.css`, desktop không đổi):
   - Breakpoint `max-width: 768px`, kích hoạt bằng hook `useIsMobile`
     (matchMedia + listener, xoay màn hình/resize tự cập nhật, không cần reload).
   - Preview full-width; Inspector và MediaBin thành bottom sheet mở bằng
     nút FAB (📁 Thư viện, ⚙️ Thuộc tính, 48px, aria-expanded, đóng mở độc lập,
     backdrop click đóng, role=dialog aria-modal); desktop vẫn render inline
     đúng như cũ (`!isMobile && <MediaBin />` / `!isMobile && <Inspector />`).
   - TopBar wrap 2 hàng, nút transport 44–48px, input/select/textarea 16px
     (tránh iOS tự zoom khi focus), timeline cao 250px, gutter 92px, nhãn
     track ẩn trên mobile, tay cầm trim 22px, modal gần full-screen cuộn được.
   - Tất cả viewport đều có `touch-action` đúng: clip/handle/ruler `none`,
     vùng cuộn timeline `pan-x`, nút `manipulation` (chống double-tap zoom).
2. **PWA** (`public/manifest.webmanifest`, `public/sw.js`, `public/icons/`):
   - Manifest: tên "VCut Studio", display standalone, start_url/scope ".",
     theme/background `#0f131b`/`#05070b`, icon 192 + 512 + maskable 512
     (vẽ gốc bằng PIL: nền gradient tím→chàm + tam giác play trắng, KHÔNG
     dùng logo/trade-dress của CapCut).
   - Service worker `vcut-shell-v1`: precache app shell (`./`, `./index.html`),
     navigation network-first với fallback cache, `/assets/*` và js/css/font/
     ảnh/json cache-first + stale-while-revalidate. Chỉ áp dụng cho GET
     same-origin; bridge (localhost:8787), blob:, POST đều bypass nguyên vẹn.
   - Đăng ký SW chỉ khi `import.meta.env.PROD`, lỗi tự nuốt — editor vẫn chạy
     bình thường nếu SW không đăng ký được.
3. **Touch**:
   - Kéo clip bằng cảm ứng: clip dùng pointer events (đã có từ trước, nay
     thêm `touch-action: none` để trình duyệt không giành gesture).
   - Pinch-zoom timeline: ruler (touch-action none) + vùng trống của lanes,
     2 ngón đổi zoom qua `pinchZoom` (clamp 8..240, giống `store.setZoom`),
     xử lý bằng pointer tracking window-level.
   - Scrub timeline 1 ngón trên ruler.

## Những gì CHƯA làm / chưa đúng như native

- **Offline chỉ là UI shell.** Service worker cache app shell, KHÔNG cache
  media (blob:/data:), KHÔNG cache nội dung IndexedDB, KHÔNG cache traffic
  bridge. **Render/export và mọi tính năng AI local vẫn bắt buộc bridge
  local đang chạy (localhost:8787).** Mở editor offline mà không có bridge
  thì chỉ xem được giao diện, không render được.
- **Pinch bắt đầu trên một clip thì không zoom** (clip nuốt pointerdown cho
  drag; pinch chỉ hoạt động khi cả 2 ngón bắt đầu trên ruler hoặc vùng trống
  của lanes). Pinch trong lúc đang kéo clip là undefined (không xử lý).
- **Box-select trên cảm ứng bị suy giảm:** 1 ngón trên vùng trống cuộn native
  (pan-x), không vẽ được khung chọn; chọn nhiều clip bằng cảm ứng chưa có
  cách thuận tiện như desktop (Shift+click).
- **FAB bar đặt ở bottom 262px**, giả định timeline mobile cao 250px. Nếu
  chiều cao timeline mobile đổi, vị trí FAB phải đổi theo.
- **Chưa test trên điện thoại thật.** Chỉ kiểm chứng bằng headless Chromium
  emulation 390×844 (xem "Kiểm chứng" bên dưới) + screenshot. Chưa test
  Safari iOS thật, chưa test Android Chrome thật, chưa test màn hình gập/
  tablet, chưa test xoay ngang dọc đầy đủ.
- **Desktop CSS (`styles.css`) không được sửa bởi Q6** — mọi thay đổi mobile
  nằm trong `mobile.css` và component, để tránh vỡ layout desktop.
- **Full-repo `tsc` tại thời điểm Q6 kết thúc vẫn lỗi ở file của các agent
  Phase 8 khác chạy song song** (LutPicker/previewEngine trùng key,
  beatSync/silenceFollow import `.ts`, store/sticker type) — không phải file
  Q6. File Q6 sạch tsc; `vite build` riêng của Q6 pass. Parent merge cần
  kiểm tra lại sau khi các agent khác xong.

## Kiểm chứng đã chạy (thật, không claim thừa)

- `bash apps/web/scripts/test-mobile.sh` — **58/58 assertions**: pinch math
  (clamp + NaN guard), manifest field + icon tồn tại, PNG magic + IHDR,
  SW handler + same-origin guard + không hardcode bridge trong code,
  index.html wiring, mobile.css rules (768px, pan-x, 44px, handle 22px, dvh),
  App desktop-inline + mobile sheet markers, Timeline pinch wiring +
  pointercancel, main.tsx PROD guard.
- `npx vite build` pass; dist chứa SW registration, media query 768px,
  `touch-action:pan-x`, `100dvh`, `m-sheet`, manifest, sw.js, icons.
- Headless Chromium (binary Playwright cache) + CDP, viewport 390×844
  (device metrics override, DSF 2, mobile): splash biến mất, 3 clip load,
  FAB 48×48 hiển thị, MediaBin không nằm trong flow khi sheet đóng,
  mở/đóng sheet bằng click thật OK, clip `touch-action` tính toán = none,
  scrub 1 ngón đổi playhead, **pinch 2 ngón đổi zoom 60 → 150**.
- **Lưu ý về phương pháp test pinch (trung thực):** CDP
  `Input.synthesizePinchGesture` và JS `dispatchEvent(new PointerEvent)`
  KHÔNG tới được handler React trong headless Chrome (cái đầu chỉ lái
  compositor page-zoom, cái sau React không xử lý) — cả hai đều cho kết
  quả "fail" giả. Pinch được xác minh bằng CDP `Input.dispatchTouchEvent`
  (trusted touch, gần nhất với ngón tay thật) — script tái chạy được ở
  `apps/web/scripts/mobile-touch-check.mjs` (cần preview server đang chạy
  ở 127.0.0.1:4173 và Chromium tại `~/.cache/ms-playwright/`).

## Cách tái kiểm chứng

```bash
cd apps/web
bash scripts/test-mobile.sh          # 58 assertions, không cần server
npx vite build                        # build pass
npx vite preview --port 4173 --host 127.0.0.1   # rồi chạy:
node scripts/mobile-touch-check.mjs   # CDP trusted-touch: scrub + pinch
```
