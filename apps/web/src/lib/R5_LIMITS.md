# R5 (Phase 9) — WebGL 3D LUT preview: giới hạn & ghi chú trung thực

Ngày: 2026-10-24. Agent: R5. Phạm vi: preview LUT bằng WebGL thật.
KHÔNG push (lệnh Phase 9: chỉ để code trên đĩa, gom batch sau).

## 1. Đã làm gì

- `apps/web/src/lib/webglLut.ts` (mới):
  - `parseCubeData` — parse + validate `.cube` (Adobe IRIDAS Cube, chỉ LUT 3D),
    mirror quy tắc của `userLut.parseCube` (size 2..256, đủ size³ dòng, giá
    trị −1..2, từ chối LUT 1D) nhưng TRẢ VỀ dữ liệu để dùng thật.
  - `trilinearSample` / `applyLutToPixels` — nội suy trilinear trên CPU,
    mirror đúng công thức shader (để test đối chiếu FFmpeg không cần GPU).
  - `WebglLutRenderer` — shader trilinear 8 tap, texture LUT đóng gói
    (rộng size×size, cao size; texel (r + g×size, b)), đúng thứ tự dữ liệu
    `.cube` (R nhanh nhất, rồi G, rồi B) và đúng DOMAIN_MIN/MAX (khớp FFmpeg
    `lut3d`). Ưu tiên texture float (OES_texture_float); không có thì lượng
    tử hoá 8-bit (sai số tối đa 0.5/255).
  - `applyWebglLut` (đồng bộ, theo thiết kế vòng lặp vẽ): LUT đã load thì
    áp và trả canvas; chưa load thì kick-off load bất đồng bộ và trả null để
    caller giữ đường CSS cũ. LUT load lỗi được retry sau 30s (để bridge khởi
    động muộn vẫn tự lên WebGL mà không spam fetch mỗi frame).
  - `getLutBadge` — trạng thái lần áp gần nhất cho UI badge.
- `apps/web/src/lib/previewEngine.ts`: `VideoClipVisual` thêm `lut` và
  `cssFilterNoLut` (color + effects, không có LUT) — để khi WebGL đã áp LUT
  thì `ctx.filter` không áp LUT lần nữa. `cssFilter` cũ giữ nguyên cho các
  consumer khác.
- `apps/web/src/preview.tsx`: `drawVideoClip` áp WebGL LUT lên frame nguồn ở
  kích thước letterbox (dw×dh, không vượt độ phân giải project) TRƯỚC
  mask/SR/opacity, đúng thứ tự render. Badge góc trên-phải báo chế độ:
  "LUT WebGL" (xanh) / "LUT…" (đang tải .cube) / "LUT CSS ≈" (vàng, đang dùng
  xấp xỉ). Badge cập nhật qua DOM ref như badge PROXY (không re-render
  React mỗi frame).
- `server/bridge/src/index.js`: `GET /api/luts/:id` phục vụ file `.cube` từ
  `assets/filters/` (local-first). Regex id chặn mọi ký tự phân cách thư mục
  nên không traversal được; id lạ → 404, id sai định dạng → 400.
- Lựa chọn "đưa .cube tới browser": **bridge local, không bundle**.
  Bundle 174 file `.cube` (~20MB) vào web sẽ phình build và phình repo;
  bridge đã chạy sẵn cho render/proxy nên phục vụ thêm .cube là tự nhiên
  nhất. LUT user (`user-*`) đọc từ IndexedDB, không qua bridge.

## 2. Số đo thật (24/10/2026, VM này)

### Sai số vs FFmpeg `lut3d` — tốt hơn CSS ~35×
- CPU trilinear vs FFmpeg (fixture gradient 64×64, `webglLut.test.ts`):
  vcut-cinematic MAE 0.4510 max 1; cartcut-teal-orange MAE 0.5058 max 2.
- GPU WebGL vs FFmpeg (Chromium headless + SwiftShader, gradient 256×256,
  LUT vcut-cinematic, texture float): **MAE 0.4552, RMSE 0.6747, max 1** —
  ngang mức làm tròn 8-bit. Góc ảnh đối chiếu đúng hướng (không bị lật dọc).
- So sánh: CSS approx sau Phase 8 fit có RMSE trung bình ~16/255, LUT cong
  mạnh (solarized) sai tới ~100. WebGL đưa sai số về dưới 1/255.

### Hiệu năng 1080p — VƯỢT xa mốc 30fps (kể cả trên software GL)
- Đo bằng vòng lặp kín (không đợi rAF) trên Chromium headless + SwiftShader,
  nguồn 1920×1080 vẽ lại mỗi frame (gradient dịch chuyển), LUT
  vcut-cinematic, qua đúng đường `applyWebglLut` + `drawImage`:
  - **WebGL: 2511 frame / 12.27s = 204.7 fps.**
  - **CSS filter (chuỗi LUT_CSS verbatim của cùng LUT): 556 frame / 5.51s
    = 100.9 fps.**
- Lưu ý trung thực: lần đo WebGL có 1 frame chậm ~7s xen giữa (elapsed
  12.27s thay vì ~5s — spike của SwiftShader / tranh CPU với agent khác
  đang chạy cùng VM 2 vCPU); con số fps đã tính cả spike đó nên vẫn là
  trung bình thật, không phải đỉnh. Dù vậy cả hai đường đều vượt mốc 30fps
  với biên độ lớn, và GPU thật của user sẽ còn nhanh hơn SwiftShader.
- Hai lần đo sai trước đó (đừng trích dẫn): (1) vòng lặp đợi rAF cho 0.77
  fps (WebGL) / 0.99 fps (CSS) — rAF ở headless bị throttle khi trang không
  hiển thị, không phản ánh thông lượng; (2) lần đo vòng kín đầu tiên kẹt
  vĩnh viễn vì `rafRate` đợi rAF không bao giờ fire trong instance headless
  đó — đã bỏ phần đo rAF, thêm watchdog 90s cho driver.

## 3. Kiểm chứng đã chạy

- `npx tsc --noEmit`: 0 lỗi (sau khi sửa 1 lỗi kiểu TexImageSource).
- `node --experimental-strip-types src/lib/webglLut.test.ts`: **7/7 pass**
  (parse thật 17³, domain, từ chối 4 dạng file sai, identity passthrough,
  clamp domain, CPU ≈ FFmpeg 2 LUT).
- Bridge smoke test `server/bridge/test/test-luts-r5.sh`: **5/5**
  (200 + nội dung .cube, traversal → 400, id lạ → 404).
- Browser E2E (CDP + Chromium headless, vite dev + bridge thật): accuracy
  GPU như mục 2 (mode webgl, floatTex true) + fps 1080p như mục 2 (WebGL
  204.7 fps, CSS 100.9 fps). Chưa click-test qua UI editor thật (badge +
  đường vẽ trong editor chỉ kiểm chứng ở mức wiring + test page;
  click-test editor thuộc R6).

## 4. Giới hạn còn lại (đừng claim hơn)

1. **WebGL LUT chỉ áp cho clip video.** Render cũng không áp LUT cho ảnh
   nên preview ảnh giữ nguyên (khớp render, không phải thiếu sót).
2. **Cần bridge đang chạy để có LUT hệ thống.** Bridge chưa chạy → badge
   "LUT CSS ≈", preview vẫn xem được bằng CSS. LUT user không cần bridge
   (đọc IndexedDB) nhưng vẫn cần WebGL.
3. **Color adjust và effects vẫn là CSS**, chưa qua WebGL. Thứ tự áp:
   color (CSS) → LUT (WebGL, trên frame nguồn) → effects (CSS) — thứ tự này
   KHÁC render ở chỗ render áp color TRƯỚC LUT trên cùng pipeline FFmpeg,
   còn preview áp color bằng CSS lên frame nguồn trước khi đưa vào WebGL,
   nên kết quả cuối vẫn đúng thứ tự (color trước LUT), chỉ khác công nghệ.
4. **Pixel bán trong suốt:** frame qua WebGL bị un-premultiply rồi
   premultiply lại khi composite — với frame video đục (alpha = 1) không
   ảnh hưởng; với frame đã chroma-key (có alpha) có sai số làm tròn nhỏ.
   Mask áp SAU WebGL nên không bị ảnh hưởng.
5. **Context WebGL mất** (hết tài nguyên GPU) → tự rơi về CSS, texture sẽ
   load lại khi context restore. Không crash, không mất frame.
6. **LUT 1D không hỗ trợ** (parse từ chối rõ ràng, rơi về CSS). Lưới lớn
   (32³, 64³) vẫn chạy được nhưng texture (4096×64) tốn VRAM hơn; catalog
   hiện tại toàn 17³ nên không thành vấn đề.
7. **Chưa đo trên GPU thật / Safari / iOS.** Số fps và float-texture ở đây
   đo trên SwiftShader (software GL) của Chromium headless; trình duyệt
   thật có GPU sẽ khác (kỳ vọng nhanh hơn). Safari cũ không có
   `ctx.filter` thì CSS fallback cũng mất LUT — WebGL là đường cứu cho
   trường hợp đó khi bridge chạy.
8. **File test page `apps/web/r5-test.html` đã XOÁ** sau khi đo xong
   (chỉ phục vụ đo E2E, không thuộc sản phẩm, không nằm trong batch push).

## 5. File R5 chạm vào (chưa push — để parent gom batch sau)

- Mới: `apps/web/src/lib/webglLut.ts`, `apps/web/src/lib/webglLut.test.ts`,
  `apps/web/src/lib/__fixtures__-webglLut.json`,
  `apps/web/src/lib/R5_LIMITS.md` (file này),
  `server/bridge/test/test-luts-r5.sh`.
- Sửa: `apps/web/src/lib/previewEngine.ts` (thêm `lut` + `cssFilterNoLut`),
  `apps/web/src/preview.tsx` (wiring WebGL + badge LUT),
  `apps/web/src/lib/PREVIEW_LIMITS.md` (mục LUT),
  `apps/web/tsconfig.json` (exclude test mới),
  `server/bridge/src/index.js` (endpoint `/api/luts/:id`).
- Tạm (XOÁ trước khi push): `apps/web/r5-test.html`.
- KHÔNG sửa logic render FFmpeg.
