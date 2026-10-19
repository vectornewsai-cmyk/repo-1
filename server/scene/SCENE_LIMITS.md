# SCENE_LIMITS.md — Giới hạn trung thực của Scene Detection (R1-085)

Scene detection dùng FFmpeg filter `select='gt(scene,T)'` + `showinfo`
(`server/scene/scene.py`, 100% local, không model ML).

## 1. Metric scene của FFmpeg là heuristic, không phải AI
Ngưỡng T chỉ là độ chênh lệch frame-liên-tiếp. Không hiểu ngữ nghĩa cảnh:
video quay 1 cảnh nhưng máy rung mạnh / đèn chớp / vật thể lớn đi ngang
có thể cho điểm giả. Ngược lại, chuyển cảnh nhẹ (fade chậm, dissolve dài)
có thể cho điểm thấp và bị bỏ sót ở ngưỡng cao.

## 2. Màu phẳng cho điểm scene thấp bất thường (đã kiểm chứng)
Video test 3 cảnh màu phẳng (đỏ→xanh lá→xanh dương): ở threshold 0.4 chỉ
detect được xanh lá→xanh dương, **đỏ→xanh lá bị miss ở mọi ngưỡng ≥ 0.1**
(dù frame khác nhau hoàn toàn: RGB (253,0,0) vs (0,127,0)). Với nội dung
tự nhiên (smptebars/testsrc/gradients) thì detect đúng ở 0.3–0.5.
→ Đừng kỳ vọng detect cắt giữa 2 slide màu trơn / màn hình đen→trắng.

## 3. Độ chính xác timestamp: ±1 frame
Điểm cắt là timestamp của frame ĐẦU TIÊN của cảnh mới (theo pts của
showinfo). Với video 30fps, sai số tối đa ~0.033s so với "điểm cắt lý tưởng".
Test dùng dung sai ±0.5s là hào phóng; thực tế thường chính xác ±0.1s.

## 4. Hai điểm cắt gần nhau (< 0.3s) bị gộp
`MIN_SCENE_GAP = 0.3` — giữ điểm đầu, bỏ điểm sau. Tránh tách cảnh vụn do
nhiễu/chớp sáng. Không cấu hình được qua CLI (hằng số trong code).

## 5. Tốc độ ~1x realtime trở lên
Filter phải decode toàn bộ video. Video 10 phút ≈ 10–60s tùy CPU/resolution.
Không có progress % chi tiết (chỉ phase "đang quét").

## 6. Chỉ dùng cho video clip
Audio-only không có frame → không detect được (bridge từ chối file audio).
Ảnh tĩnh (image clip) chỉ có 1 frame → 0 điểm cắt.

## 7. Clip reverse: mapping vẫn đúng nhưng thứ tự cắt đảo
`cutsToTimelineTimes` xử lý reverse (`timelineT = start + (out - cut)/speed`),
nhưng "cảnh" theo nghĩa xem xuôi sẽ bị đảo ngược thứ tự khi phát ngược.
Đây là đúng về mặt kỹ thuật, nhưng user có thể thấy lạ.

## 8. Clip đã speed ≠ 1: điểm cắt chia theo speed
Công thức `timelineT = clip.start + (cut - clip.in) / speed` đúng với mọi
speed > 0 (đã test unit). Speed = 0 không hợp lệ (validator chặn).

## 9. Không tự chạy khi import media
User phải bấm "Tách cảnh" chủ động. Không có batch/auto cho nhiều clip.

## 10. Chưa có
- Không phát hiện chuyển cảnh dạng fade/dissolve dài một cách đáng tin cậy
  (cần ngưỡng thấp → nhiều false positive).
- Không phân loại cảnh (indoor/outdoor, người/vật).
- Không "smart assembly" (tự dựng video từ nhiều source) — R1-085 theo
  master plan là "Auto reframe/object tracking", scene detection là R1-087;
  task này implement phần scene detection theo brief.
