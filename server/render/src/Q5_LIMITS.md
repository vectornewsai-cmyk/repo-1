# Q5_LIMITS.md — Giới hạn thật của Phase 8 Q5 (motion tracking, beat sync, voice effects)

Tài liệu này ghi những gì Q5 KHÔNG làm được hoặc chỉ làm xấp xỉ. Không có
mục nào dưới đây được "làm tròn" thành tính năng hoàn chỉnh.

## 1. Motion tracking (`server/tracking/track.py` + `server/render/src/tracking.js`)

- **Cần vật thể có vân/khác biệt rõ.** Tracker mặc định là template matching
  (matchTemplate, OpenCV Apache-2.0) rồi tới MIL; cả hai đều thất bại trên
  vật phẳng, không vân, hoặc trùng màu nền. Đây là giới hạn của thuật toán,
  không phải lỗi cấu hình.
- **Không xử lý che khuất (occlusion).** Khi vật bị che, điểm match tụt dưới
  0.3 → `lost=true`, quỹ đạo kết thúc tại điểm tốt cuối cùng. Render kẹp
  (clamp) sticker tại điểm cuối đó — KHÔNG bịa chuyển động tiếp theo.
- **Không bám vật đổi hình dạng mạnh** (xoay sâu, scale lớn, biến dạng):
  template cố định từ frame đầu nên càng về sau càng lệch.
- **Quỹ đạo tối đa 240 điểm** (TRACK_MAX_POINTS). Với sample-fps mặc định 10,
  tương đương 24 giây; video dài hơn phải tăng sample-fps (mất mịn) hoặc
  chia đoạn.
- **Smoothing là moving average (mặc định cửa sổ 5).** Làm mịn rung nhưng
  cũng làm trễ nhẹ ở khúc cua gắt — đánh đổi cố hữu, không có "smoothing
  hoàn hảo".
- **CSRT/KCF không còn trong OpenCV 5.0.0 headless** (legacy module đã gỡ).
  Đừng tìm `TrackerCSRT_create` — nó không tồn tại ở bản này.
- **Text clip chưa bám track.** Chỉ sticker clip mới có trường `track`;
  text/clip video bám track là việc chưa làm (cần pipeline overlay khác).
- **Track chỉ chạy ngoài editor** (CLI Python). UI chỉ nạp trajectory JSON
  đã tạo sẵn, chưa có nút "track ngay trong trình duyệt" (cần bridge
  endpoint + upload video, chưa làm).

## 2. Beat sync (`server/beats/beat.py` + bridge `/api/beats/analyze`)

- **Chỉ chính xác trên nhạc có beat rõ.** Đo thật trên click track 120 BPM:
  BPM sai 0.24, beat lệch ≤ 19ms, miss 1/16 (beat tại t=0, không có context
  trước đó). Trên nhạc thật có rubato, nhịp phức tạp, hoặc nhiều lớp nhạc
  cụ, DP có thể chọn sai tempo (lệch quãng 8) hoặc bỏ/thừa beat.
- **Tempo giới hạn 40–240 BPM** (mặc định; UI cho chỉnh 30–300 nhưng DP vẫn
  bị giới hạn bởi khoảng lag của autocorrelation).
- **Độ phân giải thời gian ~23ms** (hop 512 @ 22050 Hz). Beat lệch dưới
  ngưỡng này là không đo được, không phải "khớp tuyệt đối".
- **Cắt clip là thao tác phá hủy có undo** (1 bước undo cho toàn bộ điểm
  cắt), nhưng điểm cắt sai vẫn phải review thủ công — modal cho bỏ điểm
  trước khi áp dụng, không cắt mù.
- **Không tách beat theo nhạc cụ, không downbeat detection.** Chỉ có 1
  chuỗi beat duy nhất, không phân biệt phách mạnh/nhẹ.
- **Không dùng librosa** (cố tình, để tránh dependency nặng): toàn bộ bằng
  numpy + FFmpeg decode. Chất lượng thấp hơn thư viện chuyên dụng trên
  nhạc phức tạp — đánh đổi đã chọn.

## 3. Voice effects (`server/render/src/voicefx.js`, FFmpeg thật)

- **Robot KHÔNG phải vocoder thật.** Dùng filter `vibrato` (điều chế tần số
  giọng nói) để nghe "máy móc". Vocoder thật (carrier × modulator, ring
  modulator) không có filter sẵn trong FFmpeg 8.1.2 nên không làm được
  mà không viết filter mới. UI ghi rõ "vibrato xấp xỉ".
- **Telephone chỉ là bandpass đơn giản** (highpass 300 Hz + lowpass 3400 Hz),
  không mô phỏng méo tiếng, nhiễu đường dây, hay codec điện thoại thật.
- **Pitch shift qua `rubberband`:** đổi cao độ nhưng giữ tempo. Ở ±12
  semitone chất lượng vẫn tốt trên giọng đơn; ở cực trị hoặc trên nhạc
  đa âm có thể nghe artifacts (pha, transient smearing).
- **Echo chỉ là 1 tap** (`aecho` 1 delay). Reverb thật nhiều tap đã có ở
  AudioFxPanel riêng — voice echo không thay thế nó.
- **Preview (Web Audio) chưa áp dụng voice effects.** Nghe thử voice chỉ
  có sau khi render thật — xem AUDIOFX_LIMITS.md cho pattern tương tự
  (reverb + giảm nhiễu cũng render-only).

## 4. Những gì CapCut có mà Q5 KHÔNG làm (ghi rõ, không giả vờ)

- **Motion tracking tự động phát hiện vật thể** (không cần khoanh bbox tay):
  cần model detection (YOLO...) — chưa làm, cần cân nhắc license/weights.
- **Beat sync tự động chọn nhạc + cắt theo cảm xúc/đoạn nhạc:** chỉ cắt
  theo beat cơ học, không hiểu cấu trúc bài nhạc (verse/chorus/drop).
- **Voice changer AI (giọng nhân vật, giọng ca sĩ):** cần model voice
  conversion — ngoài phạm vi, và đa số model tốt có license hạn chế.
- **Text bám track, clip video bám track, mask bám track:** chưa làm.
