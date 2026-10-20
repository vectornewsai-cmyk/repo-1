# Keyframes — Giới hạn trung thực (cập nhật 2026-10-20)

Tài liệu này liệt kê **chính xác** những gì keyframe animation làm được và
chưa làm được ở thời điểm hiện tại. Không phóng đại, không giấu.

## Đã làm được và đã kiểm chứng

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Spec `ClipAnimations` (`x/y/opacity/scale/rotation`) | ✅ | `packages/video-spec/src/keyframes.ts` |
| Nội suy linear / ease-in (p²) / ease-out (1-(1-p)²), clamp ngoài khoảng | ✅ | `node src/keyframes.js --self-test` (13 nhóm assertion) |
| Bản TS và bản JS cho kết quả **giống hệt nhau** | ✅ | so sánh 60 điểm nội suy + validate, khớp 100% |
| UI chỉnh keyframe (thêm/xoá/kéo diamond, easing, giá trị nội suy live) | ✅ | `apps/web` build pass (`tsc` strict + vite) |
| Render text: **x, y, opacity** theo thời gian (drawtext expressions) | ✅ | `demos/keyframe-text.mp4` — frame t=0.4/2.5/4.6 đã xem bằng mắt |
| Render video: **x, y** theo thời gian (overlay expressions) | ✅ | `demos/keyframe-video.mp4` — frame t=0.3/3.0/5.7 đã xem bằng mắt |
| Render video: **scale** theo thời gian (filter `scale` eval=frame, biểu thức nội suy) | ✅ | `node src/test_keyframes_sr.js` (31 assertion pixel): scale 1.05 → rect 336px, scale 1.95 → 624px (sai số ≤1px) |
| Render video: **rotation** theo thời gian (filter `rotate`, dương = kim đồng hồ như CSS/canvas) | ✅ | Cùng test trên: ô đỏ đỉnh-giữa di chuyển (320,30) → (426,73) ở 45° → (469,168) ở 85.5° |
| Khi có scale/rotation: element giữ **kênh alpha** (letterbox + góc xoay trong suốt, lộ track dưới) | ✅ | Test A3 trong `test_keyframes_sr.js` (135k pixel xanh của track dưới lộ qua) |
| **x/y bắt đầu có tác dụng** khi clip có scale/rotation (element nhỏ hơn khung) | ✅ | Test A2: scale 0.5 + x 0→1, tâm rect đo được 176 → 464px |
| Preview: scale/rotation + vị trí hình bao cho video clip (canvas transform) | ✅ | `videoElementPlacement` trong previewEngine.ts; `preview-engine.test.cjs` mục 10 (tổng 198 assertion) |
| SR + transition: validator **cảnh báo** và render bỏ qua SR cho unit đã merge | ✅ | Test C trong `test_keyframes_sr.js` (rect giữ nguyên 320×180 ở t=1.0) |
| Validate shape keyframes (t trong [0, duration], easing hợp lệ, ≤128 kf/prop) | ✅ | `validateAnimations` (cả TS lẫn JS) |

## Chưa làm được / giới hạn của scale-rotation (nói thẳng)

1. **`scale`/`rotation` của TEXT clip vẫn chưa render được.**
   - `drawtext` không cho `fontsize` là biểu thức theo thời gian → không scale chữ từng frame.
   - `drawtext` không có xoay. (Video clip thì đã render thật cả 2 — xem bảng trên.)
   - Validator cảnh báo riêng cho text clip để không ai tưởng đã áp dụng.
2. **`scale`/`rotation` bị BỎ QUA khi clip dính transition** (cả clip trước lẫn
   clip sau của cặp). Unit bị gộp qua `xfade` trước khi đặt lên timeline, và
   transform chỉ áp cho unit đơn. Validator **cảnh báo rõ** cho từng clip như
   vậy (không render sai lặng lẽ); preview chưa mô phỏng việc bỏ qua này ở
   đoạn chuyển cảnh.
3. **Scale bị clamp về [0.01, 8] khi render** (tránh frame 0px / nổ bộ nhớ).
   Keyframe nằm ngoài khoảng này vẫn lưu trong spec; validator cảnh báo và
   render dùng giá trị đã clamp. Preview clamp giống hệt.
4. **`opacity` KEYFRAME của video clip vẫn chưa render** (opacity TĨNH của clip
   thì render thật từ R1-011). Chuỗi transform scale/rotate chưa nhân alpha
   theo keyframe.
5. **Hành vi x/y thay đổi khi có scale/rotation** (đã kiểm chứng, không phải bug):
   không có SR → unit luôn full khung hình nên `(main_w - overlay_w) = 0` và
   x/y vô hình (quirk cũ, giữ nguyên). Có SR → overlay_w/h là kích thước hình
   bao của element tại frame đó, x/y nội suy trên khoảng trống còn lại; không
   có keyframes x/y thì element được **căn giữa** (mặc định của overlay
   expressions), không còn dính góc trên-trái.
6. **Clip có SR mang kênh alpha suốt pipeline** (pad trong suốt thay vì đen):
   vùng letterbox của nguồn không lấp đầy khung sẽ TRONG SUỐT (lộ track dưới)
   thay vì đen như clip thường. Đây là hệ quả cần thiết để góc xoay không vẽ
   đè hình chữ nhật đen, nhưng là khác biệt nhìn thấy được — ghi rõ tại đây.
7. **Chất lượng lấy mẫu lại:** scale dùng bộ lọc mặc định của FFmpeg, rotate
   dùng bilinear → hình có thể mềm hơn gốc khi scale lớn/xoay góc lẻ. Preview
   dùng drawImage của trình duyệt nên cũng chỉ khớp tương đối, không
   pixel-perfect với render.
8. **Đã tích hợp vào `render.js` / `validate.js`** (cập nhật 19/10/2026,
   commit `1844e2cc`). `buildTextExprs`/`buildOverlayExprs` được gọi trong
   `buildFilterGraph`; `validate.js` gọi `validateAnimations()`.
   Bổ sung 20/10/2026: `buildKeyframeTransform` (scale/rotate) nối vào bước
   đặt unit lên timeline của `render.js`.
9. **Preview trong editor đã áp dụng keyframes** (cập nhật 20/10/2026):
   x/y/opacity cho text, scale/rotation + vị trí cho video qua
   `videoElementPlacement` (previewEngine.ts) — chi tiết ở PREVIEW_LIMITS.md.
10. **Keyframe times là clip-local** (giây tính từ đầu clip), không phải timeline-global.
    Đây là lựa chọn thiết kế có chủ ý (giống CapCut), đã ghi trong spec.
11. **Chưa có keyframe cho audio** (volume/pan theo thời gian) — ngoài phạm vi đợt này.
12. **UI panel đã được mount vào Inspector** (cập nhật 19/10/2026,
    commit `1844e2cc`). `KeyframePanel` được import và render trong
    `apps/web/src/Inspector.tsx`.

## Ngữ nghĩa easing (khóa cứng, không được đổi một bên)

Easing của keyframe **bắt đầu** đoạn áp dụng cho cả đoạn `[t_i, t_{i+1}]`.
Đổi công thức ở `keyframes.ts` mà không đổi `keyframes.js` (và ngược lại)
là **bug** — hai file có comment chéo nhắc nhau.
