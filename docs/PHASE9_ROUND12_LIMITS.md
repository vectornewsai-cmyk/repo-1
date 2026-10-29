# Phase 9 đợt 12 — Đóng nợ đợt 11: preview–render parity vòng 3 (LIMITS tổng hợp)

> Ngày: 2026-10-27 (lượt cron 08:03). Đợt lớn, 6 luồng song song, KHÔNG push.
> Chủ đề: toàn bộ nợ mở đợt 11 (ghost vô hình, 14 type V3 chưa có hình học,
> badge lệch số đo, migrateMotion chưa vào web load, speed-curve UI thiếu để
> click-test nhánh dương cảnh báo stabilize+ramp, harness V11 chưa phủ V3).
> Kiểm chứng gộp của parent chạy lại độc lập, không tin mù báo cáo luồng.

## 1. Đã xong trong đợt

| Mảng | Kết quả (số đo thật, kiểm chứng lại bởi parent) |
|---|---|
| T1 ghost motion blur | Composite mới = trung bình có trọng số đúng nguyên lý tmix: probe 10/10 (pixel cũ 240 → sau sửa 90 đúng tmix; weights đảo cho 160/40 đúng công thức). previewEngine 14/14, tsc 0, vite build pass. |
| T2 hình học 14 type V3 + circleopen | 14/14 type V3 KHỚP ở harness V11/V12 (MAD 0.00–0.52, ≤8 ≥ 99.7%); unit test transitionPreview 18/18. Quy ước tọa độ khối V3: expr đánh giá tại chỉ số pixel nguyên → hình học tính trong không gian chỉ số rồi dịch +0.5 sang tâm điểm (không dịch: blinds-diag MAD 75.56, rings 77.34). Sửa 3 lỗi: rings ngược nhánh (77.34 → 0.05), spiral đóng dải bằng dây cung thẳng (84.95 → 0.05, đóng bằng cung tròn ngoài), squareopen/close thiếu 1 cột ở cận lte (1.89 → 0.00). |
| T2 circleopen | Probe bán kính: gradient cosin rộng, `w(rho) ≈ (1+cos(pi·rho))/2` (±0.01), bán kính giữa dải `rho_mid = 3P−1` (sai số ≤0.005), hoàn thành sớm ~P=0.8. Mô hình mới `clamp(3p−1,0,1)*rMax` thắng mô hình cũ mọi P (MAD trung bình 38.57 → 23.67) nhưng frame giữa vẫn LỆCH 43.50 — dải gradient không vẽ được bằng 1 vùng biên cứng + alpha đều. |
| T3 badge | Nâng 4 type lên "khớp" theo đúng số đo P2 + ngưỡng V6/V11 (MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8): pixelate, shake, rgb-shift, mirror. Badge test 141 assertions PASS, i18n PASS, panel vẫn 82 type. |
| T4 migrateMotion vào web load | `parseProjectText` nối migrate → cả mở file lẫn autosave đều được migrate; project mới trả đúng tham chiếu, không đổi field. Test projectRepo 10/10; render legacy P6 chạy lại 14/14 (clip cũ weights 0 → MP4 đúng 60 frame / 2s). |
| T5 speed-curve editor + click-test | Editor thật trong SpeedPanel (tạo/sửa/xóa điểm, preset, easing, cảnh báo reverse+ramp, curve ghi đè tốc độ hằng). Click-test CDP parent chạy lại: **16/16 PASS** — nhánh dương cảnh báo stabilize+ramp HIỆN ở cả MotionPanel lẫn EnhancePanel, tắt curve thì biến mất; curve survive đổi selection; weights/miMode; badge ghost BLUR≈. |
| T6 harness V12 | Parent chạy lại sau khi T2 xong: **PENDING V3 = 0** (lúc T6 chạy thì T2 chưa xong nên báo PENDING — nay đã đóng). Tổng V12: 32 case, chỉ còn LỆCH: circleopen (43.50) và dissolve (85.52, nợ cũ). Text: slideReveal/curtainIn KHỚP, tiltIn/skewIn XẤP XỈ. Effect: pixelate/shake/rgb-shift/mirror KHỚP, sharpen XẤP XỈ — badge và số đo nhất quán. |

## 2. Xung đột tích hợp đã xử lý

1. **tsc lỗi projectRepo.test.ts mà T5 báo**: lỗi thời — T5 chạy tsc trước khi
   exclude của T4 vào `apps/web/tsconfig.json`. Parent chạy lại: **tsc 0 lỗi**.
   Exclude hiện chứa cả `projectRepo.test.ts` và `ghostBlend.probe.test.ts`.
2. **Lỗi TS6133 import thừa ở preview.tsx mà T4 báo**: cũng lỗi thời — T1 sửa
   xong preview.tsx sau đó; tsc toàn app của parent = 0.
3. **tsconfig.json bị 2 luồng sửa**: hợp nhất sạch, không mất entry nào
   (kiểm chứng bằng danh sách exclude đầy đủ).
4. Không có sửa logic chồng chéo khác: 6 luồng giữ đúng ranh giới file đã giao.

## 3. Chưa xong / nợ mở (trung thực, không claim quá)

- **circleopen vẫn LỆCH (MAD 43.50 tại p=0.5)**: mô hình mới tốt hơn nhưng
  chưa đủ — muốn khớp cần vẽ gradient alpha theo bán kính trong canvas
  (không phải 1 vùng biên cứng), hoặc giữ nhãn xấp xỉ. Badge T3 giữ approx
  là đúng cho tới khi có mô hình đó + số đo lại.
- **dissolve LỆCH (MAD 85.52)**: lưới hash preview vs nhiễu từng pixel render —
  nợ cũ, chưa có hướng sửa trong đợt này.
- **Ghost canvas thật chưa chụp màn hình**: probe T1 đo toán composite +
  kế hoạch blend (hàm preview.tsx gọi), không phải ảnh chụp trình duyệt;
  vùng mask trong suốt chỉ lập luận bằng công thức, chưa có probe pixel
  alpha từng phần. FPS khi bật blend ở 1080p chưa đo (nợ đo FPS kế thừa).
- **Preview canvas thật vẽ 14 type V3**: harness chỉ chứng minh hình học
  (composite 2 lớp); preview thật vẽ 1 clip/lần trên nền đen — cần click-test
  CDP riêng, chưa làm trong đợt này.
- **MAD 14 type V3 mới chỉ đo ở 72×45, p=0.5**; chưa đo 1080p hay p khác
  (trừ circleopen đo nhiều P). Quét hàng ở khung lớn là xấp xỉ (tối đa 160 dải).
- **Migrate chưa có ở**: `projectHistory.restoreVersion` (snapshot IndexedDB
  bypass `parseProjectText`) và MCP server (grep không thấy call migrate/
  validate) — snapshot cũ vẫn được cổng render cứu khi export.
- **T5 chưa chứng minh**: render thật clip có ramp từ UI mới (validator đã có
  test riêng); easing bezier chưa có UI sửa 4 số; keyframe `t` vượt duration
  sau trim chưa tự cắt (preview clamp nên không vỡ, nhưng keyframe thừa còn
  trong project); click-test mới chỉ trên clip video mẫu 4s, chưa phủ audio.
- **Nợ cũ còn nguyên**: circleclose có cùng gradient với circleopen không
  (chưa đo); type diamond cũ lệch nửa pixel so với expr; wipeleft XẤP XỈ
  (lệch 1 cột biên); edgedetect/noise/glitch chỉ xấp xỉ; chưa đo footage quay
  thật / clip dài / HD cho các số đợt này.

## 4. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round12-parity3.txt`
  (23 file text, NUL-delimited, không binary, không dist, không
  benchmarks/results; đã verify read-back khớp danh sách và đối chiếu mtime
  ngày 27/10 — đúng 22 file luồng + file LIMITS này).
- Tổng chờ push sau đợt này: 8 batch / 264 file (241 + 23).
