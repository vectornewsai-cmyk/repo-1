# Phase 9 đợt 73 A9 — Safe-area overlay + preset xuất 4:5 (hướng S4)

> Ngày: 09/11/2026. Luồng A9, đợt 73. Hướng chọn: **S4 (§2.6 gap analysis)** —
> "Xuất bản thiếu preset mạng xã hội hoàn chỉnh (có export presets nhưng
> chưa rõ đủ 9:16/1:1/4:5 + bitrate từng nền tảng + safe-area guide)".

## 0. Vì sao chọn S4, và đã kiểm tra không trùng bằng cách nào

- Đọc `PHASE9_GAP_ANALYSIS.md` §3 Top 10 + §2, kiểm tra từng hướng bằng
  grep trực tiếp code + LIMITS các đợt gần đây (60–72) + `paths-loop/`:
  - **Top 1 N1 onboarding:** đã có `WelcomeModal` + `TourCard` +
    `TemplatePackModal` (`apps/web/src/components/onboarding/`).
  - **Top 2 E3 enhance preview:** đã xong đợt 60 Q1
    (`lib/enhancePreview.ts`, `enhancePreview60Q1.test.ts`).
  - **Top 3 E1/P2 mask PNG pre-render:** đã là mặc định
    (`render.js:206 maskMode: "png"`, `ctx.maskPng`).
  - **Top 4 P1+P3:** preview FPS đã đo đợt 52 I9; GPU encode cần máy có
    GPU thật — VM này không có, không làm được trong lượt.
  - **Top 5 A1 karaoke + SRT/VTT:** karaoke đã có (`captions.ts`
    `wordsToKaraoke`, `clip.karaoke`, render ASS `\k` + preview); xuất
    SRT/VTT xong đợt 59 P5.
  - **Top 6 A3 voice cloning:** đã expose (`TtsButton.tsx` clone mode +
    `POST /api/tts/clone`).
  - **Top 7 E2 WebGL 3D LUT:** đã có (`lib/webglLut.ts`, test 7/7 đợt 58 O7).
  - **Top 8 P5 proxy tự động:** đã có (`shouldAutoProxy`, `proxyAuto.test.ts`).
  - **Top 9 C4 one-click template pack:** đã có `TemplatePackModal`.
  - **Top 10 N2+N3 i18n + click-test:** i18n 2400 key vi==en (sau đợt này),
    click-test Q2 9/9 đã có — không còn lát cắt rõ ràng cho một lượt.
  - **E7 ducking + markers:** cả hai đã có (`DUCKING_LIMITS.md`,
    `markers.ts`, nút 📍 trên Timeline).
- **S4 còn thiếu thật:** preset xuất có `tiktok` 9:16 và `ig-square` 1:1
  nhưng **thiếu preset 4:5**; grep `safeArea|safe-area` toàn repo = **0 hit**
  trước đợt này — chưa từng có chỉ dẫn vùng an toàn trên preview.
- **Tránh trùng A1–A8 đợt 73** (resample blend, vidstab trace, ocean w1440,
  TTS 39, birefnet, gate, keyframe/Safari, GPU fallback): S4 không chạm
  mảng nào trong số đó. Lúc chạy, `paths-loop/` chưa có file round73 nào
  (đợt 73 mới bắt đầu, các luồng chạy song song).

## 1. Đã xây gì

1. **Preset xuất 4:5 mới** (`lib/exportPresets.ts`): `ig-portrait`
   1080×1350 @30fps, CRF 21, x264 medium, audio 128k — cùng dải với preset
   1:1. Bộ preset giờ đủ 9:16 / 1:1 / 4:5 / 16:9 như gap S4 yêu cầu.
2. **Module thuần `lib/safeArea.ts`** (không DOM): 4 nền tảng với vùng UI
   che lên video theo tỉ lệ 0..1 + khung title-safe:
   - TikTok/Reels 9:16: thanh trên 7,5%, ray nút phải 13% rộng
     (32–78% cao), caption + thanh dưới 24% cao.
   - YouTube 16:9: end-screen góc dưới-phải 25%×22%, title-safe 5%.
   - Instagram vuông 1:1: thanh trên 6%, caption dưới 13%.
   - Instagram dọc 4:5: thanh trên 6%, caption dưới 15%.
   - Hàm: `safeAreaPlatformForPreset()` (preset xuất → nền tảng),
     `platformForAspect()` (đoán theo tỉ lệ, sai số ≤ 6%, lệch hơn thì
     trả null — không đoán mò), `zoneStyle()` / `titleSafeStyle()` /
     `letterboxRect()` (cùng công thức letterbox với preview), và
     `validateSafeAreaPlatform()` (zone trong [0,1], title-safe không
     giao zone nào).
3. **Overlay preview** (`components/SafeAreaOverlay.tsx` + nối vào
   `preview.tsx`): nút toggle `⌖ Vùng an toàn` dưới nút fullscreen
   (aria-pressed để harness đọc), vẽ zone thành vệt sọc đỏ có nhãn +
   khung title-safe nét đứt xanh, **chỉ lên đúng khung video đã
   letterbox** (tính từ kích thước thật của preview-wrap qua
   ResizeObserver — không vẽ lên viền đen hai bên). Ô `<select>` trong
   overlay cho đổi nền tảng tay; mặc định theo preset xuất đang chọn
   (đồng bộ từ `ExportPanel` qua pub/sub module mới
   `lib/exportPresetSelection.ts`), rơi về đoán theo tỉ lệ project khi
   preset là custom. Trạng thái bật/tắt + nền tảng nhớ qua localStorage
   (`vcut.safeArea`, `vcut.safeAreaPlatform`) — không thuộc spec project.
4. **i18n:** 19 key mới, vi==en 2400/2400 (17 `safeArea.*` + 2
   `exportPreset.igPortrait*`); snapshot test khóa số key đã bump
   2381 → 2400 (`ProjectMenu.i18n55L1.test.ts`).
5. **CSS** (`styles.css`): `.preview-safearea-toggle`,
   `.safe-area-overlay/zone/title-safe/select` — overlay
   `pointer-events: none` (không chặn kéo clip/canvas), chỉ select
   nhận thao tác.

## 2. Kiểm chứng (số thật)

| Kiểm tra | Kết quả |
|---|---|
| `safeArea73A9.test.ts` (node strip-types) | **12/12 pass** |
| `safeAreaOverlay73A9.render.test.ts` (esbuild bundle + react-dom/server render thật) | **4/4 pass** — TikTok render đủ 3 zone + title-safe + select 5 option, tọa độ caption px khớp (top 729.6 / height 230.4 trên khung 540×960); tắt thì render rỗng; auto + 16:9 → YouTube 1 zone; auto + 4:3 → rỗng (không đoán mò) |
| `ProjectMenu.i18n55L1.test.ts` (esbuild bundle) | **6/6 pass** (parity vi/en + snapshot 2400) |
| Parity vi/en toàn file (script node) | **2400 == 2400, 0 key lệch** |
| `tsc --noEmit` apps/web | **0 lỗi cho file đợt này** (xem §4: còn 4 lỗi TS5097 của file test luồng A7) |
| `vite build` | **pass** (17.1s); bundle production chứa `safe-area-zone`, `ig-portrait`, `rightRail`, `Vùng title-safe`, `preview-safearea-toggle` (JS + CSS đều có) |

## 3. Giới hạn trung thực

- **Số vùng là XẤP XỈ, không đo pixel-exact:** tỉ lệ lấy từ bố cục UI
  công khai của TikTok/Instagram/YouTube, không đo từ ảnh chụp màn hình
  có bản quyền; nền tảng đổi UI thì số lệch theo. Overlay ghi rõ "xấp
  xỉ" trong title; chỉ dùng để căn chữ, không dùng để cắt video.
- **Overlay là gợi ý trực quan, không ảnh hưởng render/export:** vùng
  an toàn không cắt hay dịch clip khi xuất — user vẫn phải tự giữ chữ
  trong khung title-safe.
- **Chưa click-test headed trên browser thật:** overlay mới chỉ kiểm
  chứng bằng render SSR + tsc + vite build; chưa bấm toggle thật trên
  Chrome (VM browser không tới được dev server — nợ chung của repo).
  Harness có thể query `.preview-safearea-toggle[aria-pressed]` và
  `.safe-area-zone` khi chạy click-test.
- **Preset 4:5 chưa render thật end-to-end:** preset là config thuần
  (độ phân giải/fps/CRF) qua đúng đường `EXPORT_PRESETS` đã dùng cho
  các preset khác; chưa chạy render MP4 1080×1350 thật trong đợt này.
- **Chọn nền tảng tay chỉ nhớ local:** `vcut.safeAreaPlatform` lưu ở
  localStorage, không đi kèm file project — mở project trên máy khác
  thì về mặc định theo preset xuất.
- **TikTok vs Reels vs Shorts gộp chung 1 bộ vùng:** 3 nền tảng dọc
  9:16 dùng chung geometry TikTok; khác biệt nhỏ giữa chúng (vị trí nút
  mua sắm, caption) không tách riêng.

## 4. Nợ mở / lưu ý cho parent gộp

- `tsc` toàn app còn **4 lỗi TS5097, tất cả thuộc file test của luồng A7
  đợt 73** (`canvasRoundRect73A7.test.ts`, `keyframeBeyond90Round73A7.test.ts`,
  `sampleMime73A7.test.ts` — import `.ts` nhưng chưa được thêm vào
  `exclude` của `tsconfig.json`). Không phải file của A9, A9 không sửa —
  luồng A7 (hoặc parent gộp) thêm 3 file đó vào exclude theo đúng mẫu
  các test khác thì tsc sạch hoàn toàn.
- File test của A9 đã thêm vào exclude:
  `src/lib/safeArea73A9.test.ts` (import `.ts` theo quy ước test của repo).
  File render test (`safeAreaOverlay73A9.render.test.ts`) tsc chấp nhận
  được nên không cần exclude.
- Snapshot key i18n đã bump 2381 → 2400; các luồng khác trong đợt 73 nếu
  thêm key i18n thì parent gộp cần cộng dồn lại từ 2400 (không lấy số
  trong file này làm gốc tuyệt đối nếu có luồng khác cũng thêm key).

## 5. File stage (batch `phase9-round73-a9-gap.txt`)

14 file text, đường dẫn tương đối từ gốc repo — xem file paths đã stage.
Không binary, không workflow.
