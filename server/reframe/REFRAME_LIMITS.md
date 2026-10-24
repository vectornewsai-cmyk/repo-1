# REFRAME_LIMITS.md — Giới hạn trung thực của Auto-reframe (R1-083/R1-085)

## 0. Lựa chọn tool: tự build (OpenCV thuần) thay vì pyautoflip

Đã đánh giá **pyautoflip** (PyPI, license MIT theo research) trước khi chốt:

| Tiêu chí | pyautoflip | Tự build (đã chọn) |
|---|---|---|
| Face detection | InsightFace (tốt hơn Haar với mặt nghiêng) | Haar cascade frontal (yếu với mặt nghiêng) |
| Scene detection | Có (PySceneDetect) | Không — trajectory liên tục qua cut |
| Padding | blur/solid (đẹp khi chủ thể sát mép) | Crop cứng |
| Nặng | insightface + onnxruntime ≈ **500MB+**, model tải runtime từ GitHub (~100–300MB) | opencv-headless + numpy ≈ **120MB**, không tải gì thêm |
| License model | InsightFace ghi chú giới hạn **non-commercial cho một số model** — rủi ro pháp lý cho sản phẩm thương mại, chưa verify kỹ trong session này | Haar cascade đi kèm OpenCV (BSD) — sạch |
| Maintain | PyPI crawl cách đây ~69 ngày, project nhỏ — không verify được commit mới nhất (browser fetch lỗi trong session này) | Code của mình, kiểm soát hoàn toàn |
| Tích hợp | CLI black-box | Trajectory JSON, progress %, pattern bridge có sẵn |

**Quyết định: giữ bản tự build.** Lý do: (1) đã implement + kiểm chứng đầy đủ
(subject căn giữa < 0.2% ở 3 frame, E2E qua bridge pass); (2) nhẹ hơn 4x, không
phụ thuộc tải model runtime; (3) sạch về license cho mục tiêu thương mại;
(4) pyautoflip không verify được tình trạng maintain trong session này, và
đánh đổi dependency nặng không xứng đáng khi bản tự build đã đạt yêu cầu.
Không dùng Google AutoFlip gốc (cần build bazel/MediaPipe — quá nặng, đúng như
research đã loại).

> Lưu ý trung thực: Haar cascade thua InsightFace ở mặt nghiêng/thiếu sáng —
> đây là giới hạn có chủ ý của bản tự build (mục 1 dưới đây).

## 1. Phát hiện chủ thể

1. **Haar cascade chỉ bắt mặt chính diện, đủ sáng.** Mặt nghiêng, đeo khẩu trang/kính râm
   đậm, ngược sáng → không nhận ra → rơi xuống motion fallback.
2. **Motion fallback theo vùng chuyển động LỚN NHẤT** — không phân biệt người/vật.
   Video có xe chạy ngang qua người đứng yên → crop sẽ bám theo xe.
3. **Chủ thể tĩnh, không mặt** (phong cảnh, slide thuyết trình) → không phát hiện gì
   → crop giữ nguyên giữa khung hình (center crop). Không tệ, nhưng không "thông minh".
4. **Không theo dõi đa đối tượng.** Hai người hai đầu khung hình → bám theo người
   có mặt lớn hơn / vùng chuyển động lớn hơn; người còn lại có thể bị crop mất.
5. Lấy mẫu mỗi 15 frame (~2 mẫu/giây): chuyển động **rất nhanh** (quay máy lia gấp)
   có thể khiến crop "đuổi" không kịp trong ~0.5s.

## 2. Chất lượng crop

6. Crop window lấy **toàn bộ chiều cao** nguồn rồi resize lên 1080×1920: với nguồn
   720p, upscale 1.78x → hơi mờ so với quay dọc thật. Nguồn 1080p trở lên là tốt nhất.
7. Chủ thể **sát mép** khung hình gốc → window bị kẹp mép, chủ thể không hoàn toàn
   ở giữa (đúng vật lý: không thể crop ra ngoài frame).
8. Video đã là dọc (9:16) → không cần crop ngang; module chỉ crop dọc nếu cần.

## 3. Hiệu năng & vận hành

9. Tốc độ ~0.5–2x realtime trên CPU (phân tích + encode lại toàn bộ). Video 10 phút
   có thể mất 5–20 phút → bridge timeout 10 phút sẽ từ chối video dài.
10. Cần `ffmpeg` có libx264 trong PATH (giống render worker) + venv OpenCV
    (`bash server/reframe/setup.sh`, ~120MB).
11. Audio được copy từ nguồn (AAC 128k); video không có audio vẫn chạy
    (`-map 1:a:0?`).

## 4. Tích hợp

12. Endpoint `/api/reframe` chạy **đồng bộ** (không qua job queue): 1 request nặng
    chiếm 1 worker bridge đến 10 phút. Rate-limit như render (20/phút/IP).
13. Kết quả reframe là file MP4 mới trong kho media — **không tự thay thế** clip gốc
    trên timeline (user tự kéo vào hoặc xuất trực tiếp).
14. ~~Chưa có preview trajectory trước khi render~~ — XONG ở Phase 7 P6:
    `reframe.py --analyze-only --json-out traj.json` chỉ phân tích + tính
    crop window (không encode); render thường cũng kèm trajectory trong
    summary JSON. Bridge có endpoint `POST /api/reframe/analyze` trả JSON
    này; ExportPanel có nút "Xem trước quỹ đạo" vẽ canvas overlay (khung
    nguồn + crop rect mờ + đường tâm crop, điểm đầu xanh lá / cuối đỏ).
    MCP `auto_reframe` lưu thêm file `<out>_trajectory.json` cạnh MP4.
    Trajectory lấy mẫu đều tối đa 240 điểm (flag `--traj-max-points`).
    Test: `server/reframe/test_trajectory.py` (venv python, video thật) và
    `server/bridge/test/test-reframe-analyze.cjs` (6 assert).
    Giới hạn còn lại: chỉ track trục X (window luôn cao toàn frame); nguồn
    hẹp hơn đích thì trajectory hằng số (window = toàn frame).

## Đã kiểm chứng

- Video test 1280×720, chủ thể di chuyển trái→phải 6s: output 1080×1920 h264,
  12/12 mẫu phát hiện bằng motion, subject lệch khỏi tâm **< 0.2%** ở 3 frame
  đầu/giữa/cuối (đo bằng code + xem bằng mắt).
- Endpoint E2E qua bridge: 200 + MP4 đúng; aspect sai → 400; file không phải video → 400.
