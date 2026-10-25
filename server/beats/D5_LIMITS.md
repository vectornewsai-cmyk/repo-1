# D5_LIMITS.md — Beat sync hiểu cấu trúc nhạc (Phase 9 đợt 4, gap A7)

## Làm gì
- `server/beats/structure.py` (mới, numpy-only): downbeat + meter từ
  accent onset; phân đoạn từ chroma + năng lượng + self-similarity +
  novelty trung bình.
- `server/beats/beat.py` (sửa tối thiểu): gắn thêm trường `structure`
  vào JSON output; lỗi ở bước cấu trúc không làm hỏng beat.
- `apps/web/src/components/BeatSyncModal.tsx` (chỉ thêm hiển thị):
  nhịp/downbeat/đoạn + checkbox "Chỉ giữ điểm cắt ở downbeat".
- `server/bridge/src/beats.js` + endpoint `/api/beats/analyze` KHÔNG
  cần sửa (trả JSON của beat.py nguyên vẹn, đã kiểm chứng qua node).
- Không đụng: `preview.tsx`, `store.ts`, mọi file của agent khác.

## Số đo thật (nhạc test tổng hợp 64s, 120 BPM, 4/4, cấu trúc
A/B/A/C biết trước — xem test_structure.py)
- BPM: 119.79 (thật 120, sai 0.21).
- Downbeat: khớp 31/32 ô nhịp trong ±0.15s, sai số TB 0.008s, max 0.019s.
- Phân đoạn: biên 15.999/31.997/47.996s so với thật 16/32/48s (sai ≤ 4ms);
  nhãn A/B/A/C đúng; đoạn lặp A==A đúng; đoạn năng lượng cao nhất = C đúng.
- Unit: chroma 440 Hz → pc 9; downbeat tổng hợp → meter 4 pha 0;
  novelty khối A/B/A → biên 16/32, nhãn A/B/A.
- Hồi quy: test_beat.py (Q5) vẫn PASS (119.76 BPM, miss 1/16);
  tsc 0; vite build pass; bridge node trả đủ structure.

## Giới hạn trung thực — đọc trước khi tin kết quả trên nhạc thật
1. **Đây là heuristic, không phải hiểu nhạc.** Downbeat = "beat có flux
   mạnh hơn", đoạn = "chroma/năng lượng giống nhau". Không hiểu cảm xúc,
   thể loại, lời, hay "đoạn nào hay". Nhãn "kiểu chorus"/"kiểu drop"
   trong UI chỉ là gợi ý.
2. **Chỉ tin được trên nhạc có beat rõ, nhịp đều.** Nhạc rubato, đổi
   tempo giữa bài, nhịp lẻ (5/4, 7/8), hoặc beat mờ sẽ cho meter/
   downbeat/đoạn sai — modal vẫn cho review trước khi cắt, đừng cắt mù.
3. **Meter chỉ thử 4/4 và 3/4.** Nhạc 2/4 sẽ về 4/4 (downbeat thưa gấp
   đôi nhưng vẫn đúng pha); 6/8 có thể về 3/4 hoặc 4/4 tùy accent.
   Hòa 50/50 giữa 4 và 3 thì ưu tiên 4/4 (ghi rõ trong code).
4. **Confidence của meter chỉ là độ tách biệt giữa các ứng viên**,
   không phải xác suất đúng. Tin cậy 0.98 trên nhạc test không có nghĩa
   98% đúng trên nhạc thật.
5. **Ngưỡng gom đoạn:** cosine đoạn > 0.90 mới coi là lặp; biên cách
   nhau < 8 beat bị gộp; biên trong 2 beat đầu/cuối nhạc bị bỏ qua
   (novelty cần >= 2 beat mỗi phía); nhạc > 1500 beat sẽ gom 2 beat/
   đơn vị trước khi tính SSM (độ phân giải biên giảm một nửa).
6. **Ngưỡng tempo 0.80 (sửa từ 0.85 ở beat.py):** cần thiết vì nhạc có
   downbeat nhấn mạnh làm corr lag 2 beat cao hơn lag 1 beat (đo thật
   0.879 vs 0.736, tỉ lệ 0.837) và kẹt ở half-time 60 BPM. Đánh đổi:
   nhạc thật 60 BPM nhưng có pattern 8th-note mạnh có thể bị đọc lên
   120 BPM — chưa có test cho trường hợp này.
7. **Chưa kiểm chứng:** nhạc thật (mọi số trên đều là nhạc tổng hợp),
   nhạc dài > 10 phút (hiệu năng SSM), click-test BeatSyncModal trên
   browser thật (chỉ tsc + build + bridge node), và combo
   downbeat-only + clip có speed curve (map thời gian dùng công thức
   tốc độ 1 như beat cũ).

## Bug tìm ra và sửa trong lúc làm (đều có test khóa lại)
- Tempo half-time trên nhạc accent (xem §6): ngưỡng octave 0.85 → 0.80.
- Novelty tổng checkerboard tạo đỉnh giả 16.0 ở beat 0 và 9.0 ở beat
  cuối (cửa sổ lệch một phía làm góc kernel toàn +1): đổi sang dạng
  trung bình (mean trước + sau - 2*mean chéo) + sàn ngưỡng tuyệt đối.
