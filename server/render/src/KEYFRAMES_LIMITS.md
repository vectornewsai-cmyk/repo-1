# Keyframes — Giới hạn trung thực (cập nhật 2026-10-19)

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
| Validate shape keyframes (t trong [0, duration], easing hợp lệ, ≤128 kf/prop) | ✅ | `validateAnimations` (cả TS lẫn JS) |

## Chưa làm được (nói thẳng)

1. **`scale` và `rotation` chưa render được bằng FFmpeg.**
   - `drawtext` không cho `fontsize` là biểu thức theo thời gian → không scale chữ từng frame.
   - `drawtext` không có xoay; filter `rotate` cho video tồn tại nhưng chưa nối vào pipeline.
   - Spec + UI vẫn cho phép nhập/lưu 2 thuộc tính này (để sau này implement), nhưng render hiện tại **bỏ qua** chúng.
2. **`opacity` của video clip chưa render.** Pipeline `render.js` Phase 1 dựng video bằng
   `overlay` trên nền đen, chưa có kênh alpha từng frame cho opacity keyframes.
3. **Tích hợp vào `render.js` / `validate.js` chưa có.** Hai file đó thuộc về agent khác
   (không được sửa) nên keyframes hiện render qua **demo script độc lập**
   (`demo_keyframes_text.js`, `demo_keyframes_video.js`), chưa phải qua
   `node src/render.js --spec project.json`. Việc nối vào render worker chính là
   bước tiếp theo (cần sửa `buildFilterGraph` + `validateSpec`).
4. **Preview trong editor chưa áp dụng keyframes.** `preview.tsx` thuộc về agent khác;
   panel keyframe chỉ hiển thị "giá trị nội suy tại playhead" bằng số. Canvas preview
   vẫn vẽ vị trí tĩnh.
5. **Keyframe times là clip-local** (giây tính từ đầu clip), không phải timeline-global.
   Đây là lựa chọn thiết kế có chủ ý (giống CapCut), đã ghi trong spec.
6. **Chưa có keyframe cho audio** (volume/pan theo thời gian) — ngoài phạm vi đợt này.
7. **UI panel chưa được mount vào Inspector** — cần 1 dòng tích hợp, xem
   `apps/web/src/components/keyframes/README.md` (do `Inspector.tsx` thuộc về agent khác).

## Ngữ nghĩa easing (khóa cứng, không được đổi một bên)

Easing của keyframe **bắt đầu** đoạn áp dụng cho cả đoạn `[t_i, t_{i+1}]`.
Đổi công thức ở `keyframes.ts` mà không đổi `keyframes.js` (và ngược lại)
là **bug** — hai file có comment chéo nhắc nhau.
