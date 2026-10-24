# Q8_LIMITS.md — Giới hạn trung thực: proxy wiring + preview perf (Phase 8 Q8)

## Proxy ở phía web
- `MediaPool.videoFor()` ưu tiên `proxyUrl` khi item có proxy. Đồng bộ
  không đổi vì proxy cùng fps/duration với gốc. Export không bị ảnh
  hưởng: spec dùng `src` = tên file gốc, không bao giờ trỏ proxy.
- Badge "PROXY 720p" chỉ hiện cho clip video đang active tại playhead
  (cập nhật qua DOM trực tiếp, không re-render React mỗi frame).
- Nút "Proxy 720p" ở MediaBin chỉ hiện khi item video còn giữ `File`
  gốc (import trong phiên hiện tại). Project mở lại từ file .vcut (không
  còn File) thì không tạo proxy được — phải import lại file.
- Proxy URL trỏ về bridge (`/api/proxy/file/...`) nên preview bằng proxy
  yêu cầu bridge đang chạy. Bridge tắt → element proxy lỗi → fallback
  về file gốc (1 lần, xem media.ts).

## Preview perf — những gì đã làm và KHÔNG làm
- ĐÃ LÀM (đo bằng Node, xem bench-preview-perf):
  - Memo nội suy keyframe ở previewEngine (lượng tử 120Hz, sai số ≤ ~4ms,
    chỉ preview — render không dùng).
  - Cache `mediaByName` theo identity mảng media (không build Map mới
    mỗi tick rAF).
  - Vòng lặp pause đã có sẵn cơ chế chỉ vẽ khi playhead đổi (R1-062) —
    Q8 không sửa thêm vì đã đúng.
- KHÔNG ĐO ĐƯỢC: FPS preview thật trên browser (cần browser thật +
  `benchmarks/preview/bench_preview.js` chạy tay). Số bench Node chỉ đo
  logic thuần, KHÔNG được trích dẫn như "preview nhanh hơn X lần trên
  trình duyệt".
- KHÔNG GIÚP playback xuôi đều: cache chỉ giúp scrub/vẽ lại cùng frame
  và chia sẻ nội suy trong cùng 1 frame (videoClipVisual +
  videoElementPlacement). Playback 30fps nối tiếp vẫn phải tính mới mỗi
  frame — bench Run 3 chứng minh rõ (hit chỉ từ chia sẻ trong frame).
- Memo giới hạn 256 entry/mảng keyframes (FIFO). Project có keyframe
  dày + scrub xa có thể miss nhiều hơn — chấp nhận được vì miss chỉ
  nghĩa là tính lại như cũ, không sai kết quả.
- `ctx.filter` (CSS filter) và decode video full-res vẫn là chi phí lớn
  nhất của canvas thật — Q8 không can thiệp (đó là việc của proxy +
  giảm phân giải canvas, đã có CHROMA_MAX_W=640 cho chroma).
