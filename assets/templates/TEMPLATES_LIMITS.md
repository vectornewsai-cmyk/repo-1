# TEMPLATES_LIMITS.md — giới hạn trung thực của hệ template (R1-104/R1-105)

## Đã kiểm chứng thật

- 10/10 template qua `validateSpec` (zod của render worker) — 0 lỗi.
- `youtube-intro` render thật thành MP4 5s (1280×720, H.264+AAC) bằng render worker.
- `tsc --noEmit`: 0 lỗi. `test-templates.sh`: 10/10 assertions pass.

## Giới hạn còn lại

1. **Áp template = tạo project mới** (replaceProject, xóa history). Không có
   chế độ "chèn template vào project hiện tại" và không undo xuyên project —
   cùng ngữ nghĩa với newProject/loadProject.
2. **Media mẫu không đi kèm**: template tham chiếu tên file mặc định
   (`intro-bg.mp4`, `photo-1.jpg`...). User phải nạp file thật vào kho media
   (chọn trong form hoặc RelinkPanel sau khi tạo). Chưa có media mẫu dựng sẵn.
3. **Slideshow cắt cứng giữa các ảnh**: ImageClip trong engine hiện chưa hỗ
   trợ `transitionOut`/LUT/effects — đây là giới hạn của render worker,
   không phải của template. Khi engine hỗ trợ, template sẽ được cập nhật.
4. **Lyric/title-card không có LUT/effects trên ảnh nền** (cùng lý do #3).
   Thiết kế đã chọn ảnh nền tối + chữ sáng để vẫn đẹp khi không có grade.
5. **Chỉ text + media tĩnh**: template không chứa keyframe phức tạp hay
   hiệu ứng audio; giữ đơn giản để validate 100% pass.
6. **Chưa có preview template trước khi áp dụng**: gallery chỉ hiển thị mô
   tả text (chưa render thumbnail động). Preview = áp dụng rồi xem.
7. **Chưa lưu template của user**: user chưa thể lưu project hiện tại thành
   template riêng (định hướng P6.4/P11.1, future work).
8. **Chưa có import/export gói template** (manifest/license riêng lẻ) —
   hiện template là tài sản gốc MIT của dự án nên không cần.
9. Logo/brand trong `assets/brand/` là thiết kế gốc; tên "VCut Studio" là tên
   làm việc, có thể đổi trước phát hành chính thức.

## Đánh số master plan

Brief giao R1-105 = Templates + brand kit; trong master plan nội dung này là
**R1-104** ("User templates/brand kit/asset manager"), còn R1-105 là
"Plugin API and capability registry" (do agent khác đảm nhận).
Implement theo đúng nội dung brief.
