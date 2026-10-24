# PROXY_LIMITS.md — Giới hạn trung thực của proxy editing (Phase 8 Q8)

## Cam kết cốt lõi (đã test)
- **Export cuối LUÔN dùng file gốc.** `render.js` không có bất kỳ logic
  tự thay `src` bằng proxy nào. Test `test_proxy_q8.js` chứng minh:
  mediaDir đã có sẵn proxy mà spec trỏ file gốc → output vẫn 1920×1080.
- Proxy giữ nguyên fps và duration của nguồn (đồng bộ thời gian 1:1),
  chỉ giảm phân giải + bitrate. Audio copy (aac) để preview có tiếng.

## Những gì proxy KHÔNG làm
1. **Không tự động cho mọi nguồn.** Chỉ tạo khi nguồn cao hơn target
   (1080p/4K → 720p/480p). Nguồn ≤ target thì skip, không upscale.
2. **Stale là conservative.** Sidecar ghi size + mtime của nguồn lúc tạo.
   Nguồn bị ghi đè/copy lại (mtime đổi) → `findProxy` trả null dù nội
   dung giống hệt → phải generate lại. Đổi tên file cũng làm mất link
   (sidecar khớp theo basename).
3. **Không có proxy cho ảnh/sticker/text** — chỉ video. Ảnh decode rẻ,
   không cần proxy.
4. **Bridge giữ file gốc upload trong `proxies/`** — thư mục này là cache,
   không có janitor dọn riêng (dọn theo TTL job chung của bridge nếu có).
   Proxy chiếm thêm đĩa (~20-30% dung lượng nguồn ở CRF 23, đo thực tế
   xem benchmarks/RESULTS.md mục Phase 8).
5. **Preview qua proxy vẫn decode bằng trình duyệt** — proxy 720p giảm
   tải decode so với 4K nhưng không biến máy yếu thành máy mạnh; với
   project nhiều track + effect nặng, preview vẫn có thể giật (xem
   PREVIEW_LIMITS.md). FPS preview trên browser thật vẫn phải đo bằng
   tay qua `benchmarks/preview/bench_preview.js` — Q8 không đo được
   phần này (không có browser thật), chỉ đo logic thuần bằng Node.
6. **Chưa có proxy tự động khi import.** User phải bấm "Proxy 720p" ở
   MediaBin (hoặc gọi `POST /api/proxy`). Không tự tạo ngầm vì tạo
   proxy tốn CPU/đĩa và user có thể chỉ edit clip ngắn.
7. **Fallback khi proxy lỗi:** MediaPool tự quay về file gốc 1 lần khi
   element proxy báo lỗi. Nếu cả gốc cũng lỗi thì preview bỏ qua clip
   như hành vi cũ (không crash).
