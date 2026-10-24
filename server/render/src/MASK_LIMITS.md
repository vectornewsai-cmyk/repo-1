# MASK_LIMITS.md — Giới hạn mask (Phase 7 P4)

## Mask là gì

`ClipMask { shape: "rect" | "ellipse", x, y, w, h, feather, invert? }`
gắn vào clip video hoặc image. Render giữ lại phần clip trong hình, phần
ngoài trở nên trong suốt (composite lên nền/timeline sẽ lộ nội dung bên
dưới). Xem định nghĩa đầy đủ trong `packages/video-spec/src/mask.ts`.

## Ngữ nghĩa tọa độ (đọc kỹ trước khi dùng)

- x/y/w/h là **tương đối theo KHUNG HÌNH OUTPUT** (unit đã letterbox về
  đúng W×H), không phải theo file nguồn. x=0.5, y=0.5 = giữa khung.
- Mask áp **sau** effects/plugin, **trước** xfade và bước đặt timeline
  (setpts/overlay). Vì vậy mask là thuộc tính của clip: đi qua transition
  cùng clip, và biến đổi cùng clip khi có scale/rotation keyframe (mask áp
  trước SR ở bước timeline).
- Feather: dải chuyển tiếp ở viền, rộng `feather × cạnh ngắn hơn của mask`
  (tính theo pixel). 0 = viền cứng. Công thức viền mềm: rect dùng khoảng
  cách Chebyshev có dấu tới biên; ellipse dùng khoảng cách xấp xỉ bậc nhất
  `(r−1)/|∇F|` — không phải khoảng cách Euclid chính xác, nhưng sai số
  nhỏ so với band feather và đã pixel-verified (xem test_mask_p4.js).
- Invert: đảo mask (giữ ngoài, che trong).

## Implement

`server/render/src/mask.js` — mirror pattern opacity keyframes của K1:

```
<unit> format=rgba,split=2 → alphaextract,geq=lum='lum(X,Y)*(MASK_EXPR)'
       → alphamerge,format=yuva420p
```

- geq **không** đọc được alpha gốc nên phải tách nhánh alphaextract;
  nhờ vậy mask **giữ** alpha gốc (chroma key, video nguồn có alpha)
  thay vì ghi đè.
- Mask chain luôn xuất `yuva420p` (cần alpha để overlay composite đúng),
  kể cả khi clip gốc là `yuv420p`.

## ĐÃ KIỂM CHỨNG (test_mask_p4.js, 33/33)

- rect / ellipse / feather (R viền = 128, đúng ~50%) / invert: pixel thật.
- image clip + rect mask: pixel thật.
- mask + transition fade (clip có mask nối tiếp clip không mask qua xfade):
  render thành công — FFmpeg tự thương lượng format giữa yuva420p và
  yuv420p ở xfade.
- mask sai trên video/image → lỗi validate; mask trên text → chỉ cảnh báo.

## CHƯA HỖ TRỢ (ghi rõ, không giấu)

1. **Text clip: KHÔNG mask.** drawtext vẽ trực tiếp lên timeline, không
   qua pipeline alpha nên không mask được mà không render text thành ảnh
   trước. Validate chỉ cảnh báo và bỏ qua mask (project cũ vẫn render).
   UI cũng không hiện panel mask cho text.
2. **Sticker clip: KHÔNG mask.** `mask` chỉ có trên VideoClip/ImageClip.
3. **Preview canvas: CHƯA hiển thị mask.** `previewEngine.ts` thuộc phạm
   vi P1 (preview parity) nên P4 cố tình không chạm để tránh xung đột.
   Ô "Minh hoạ" trong MaskPanel chỉ là sơ đồ vị trí/hình dạng, không phải
   preview thật — mask chỉ có tác dụng khi render FFmpeg.
4. **Mask không có keyframe riêng.** Mask là tĩnh theo clip (không đổi
   theo thời gian). Muốn mask động: dùng keyframe x/y/scale/rotation của
   clip — mask di chuyển/xoay cùng clip vì áp trước bước SR timeline.
5. **Mask + chroma key / source alpha:** đã giữ alpha gốc (xem trên),
   nhưng chưa có test pixel riêng cho tổ hợp mask+chroma — chỉ test mask
   trên nguồn opaque. Tổ hợp này về lý thuyết đúng (nhân alpha), chưa
   được pixel-verified.
6. **Viền ellipse feather là xấp xỉ bậc nhất**, không phải khoảng cách
   Euclid chính xác — với feather lớn trên ellipse rất dẹt, dải mềm có
   thể không đều hoàn toàn quanh biên.

## UI

- `apps/web/src/components/mask/MaskPanel.tsx` — bật/tắt mask, shape,
  slider x/y/w/h/feather (%), invert, ô minh hoạ. Gắn trong Inspector cho
  nhánh video và nhánh image.
- `apps/web/src/components/keyframes/KeyframeGraph.tsx` — đồ thị SVG cho
  property đang chọn trong KeyframePanel: đường cong lấy mẫu qua
  `interpolateKeyframes` (kèm easing), kéo-thả điểm đổi cả t và v, nhấp
  đúp nền để thêm điểm, nhấp điểm để chọn (đồng bộ editor số).
