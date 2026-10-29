# Phase 9 đợt 13 — Đóng nợ đợt 12: preview–render parity vòng 4 (LIMITS tổng hợp)

> Ngày: 2026-10-27 (lượt cron 14:03). Đợt lớn, 6 luồng song song, KHÔNG push.
> Chủ đề: toàn bộ nợ mở đợt 12 (circleopen gradient, dissolve, click-test canvas
> thật V3+ghost, migrate restoreVersion/MCP, bezier + trim keyframe, đo V3 ở
> HD/nhiều p). Kiểm chứng gộp của parent chạy lại độc lập, không tin mù báo cáo luồng.

## 1. Đã xong trong đợt

| Mảng | Kết quả (số đo thật, kiểm chứng lại bởi parent) |
|---|---|
| C1 circleopen/circleclose | Gradient cosin đầy đủ `w=(1+cos(pi·clamp(rho-(3P-1)+0.5,0,1)))/2`; circleclose = ảnh gương thời gian `1-w_open(rho,1-P)`. MAD 1.56 (từ 43.50), ≤8 = 100%, đo mở rộng 18 điểm 0.07–1.56. Badge nâng lên "matched" cho đúng 2 type. Preview canvas vẽ gradient thật bằng mask radial 64 điểm dừng. |
| C2 dissolve | FFmpeg dissolve là XÁC ĐỊNH (3 lần render byte-identical), không phải ngẫu nhiên — nhưng hàm ngưỡng T(x,y) chưa tái tạo được (10 họ hash chỉ đạt mức ngẫu nhiên 3.2–4.5%). Giữ nguyên preview + badge approx. MAD tái lập 85.52 tại p=0.5. |
| C3 click-test canvas thật | 12/14 type V3 PASS trên canvas trình duyệt thật (trong vùng sáng 91.3–100%, ngoài vùng ≤2.5%). diamondclose FAIL do frame không tới sau 45s nhưng từng PASS 100%/0% ở lượt chẩn đoán — lỗi frame, không phải vẽ sai. split-v chưa từng PASS trên canvas. Ghost KHÔNG ĐO ĐƯỢC (blocker seek pause, không phải bằng chứng ghost hỏng). Không sửa code sản phẩm. |
| C4 migrate restoreVersion/MCP | restoreVersion migrate trên bản sao (snapshot gốc giữ nguyên hash/spec). MCP: validateVideoClip nay migrate trước khi validate — sửa tận gốc lỗi cũ làm mất motion lặng lẽ qua MCP. Test 15/15 + 8/8, render thật clip cũ 60 frame/2s. |
| C5 bezier + trim | UI 4 số bezier (x trong [0,1], y tự do — sửa sai chuẩn cũ chặn cả 4 số). trimClip dịch/cắt speedKeyframes theo đúng ngữ nghĩa trim hiện tại + toast báo số điểm bị cắt. Test mới 18/18, hồi quy P3 73 pass. |
| C6 đo V3 HD/nhiều p | 14 type V3 đều KHỚP ở 1920×1080 × p=0.25/0.5/0.75 (48 case, 0 FAIL). Fix rowScanPair (rowH=1), wipeleft (nợ cũ, lệch>8 về 0), diamond cũ (tâm +0.5; còn tie-break biên ở HD, tier vẫn KHỚP). |

## 2. Xung đột tích hợp đã xử lý

1. `transitionPreview.ts` bị C1 (radial) và C6 (rowScanPair/wipeleft/diamond) cùng sửa
   — kiểm tra trên đĩa: cả 3 nhóm thay đổi đều có mặt (radialGradientWeight,
   rowH = 1, wipeleft), test gộp 20/20, tsc 0, vite build pass.
2. `transitionPreview.test.ts` bị C1 và C6 cùng sửa — test gộp chạy lại 20/20.
3. File stage riêng của C4 (`phase9-round13-c4-migrate.txt`, 7 path) đã gỡ để
   khỏi đếm trùng — toàn bộ 7 file đã nằm trong batch gộp của parent.
4. Không có sửa logic chồng chéo khác: 6 luồng giữ đúng ranh giới file đã giao.

## 3. Kiểm chứng gộp của parent (chạy lại độc lập)

- tsc apps/web: 0 lỗi; vite build: pass (5.20s).
- transitionPreview.test.ts 20/20; speedcurveTrim.test.ts 18/18;
  projectHistory.test.ts 15/15; badge v5 141 assertions PASS.
- Harness V11 chạy lại: 24 case, chỉ FAIL dissolve (nợ cũ) — circleopen/
  circleclose nay KHỚP, không còn PENDING V3.
- Harness V13 HD của C6 KHÔNG chạy lại toàn bộ ở parent (mỗi lượt ~12 phút,
  48 case đã có log post-fix trên đĩa tại benchmarks/results/v13-hd-post-fix.log);
  parent chỉ đối chiếu bảng số trong LIMITS C6 với log đó ở mức báo cáo.

## 4. Chưa xong / nợ mở (trung thực, không claim quá)

- **Nợ lớn nhất, thuộc luồng render đợt sau: FFmpeg 8.1.2 đánh giá expr custom
  với P GIẢM 1→0 qua các frame transition, trong khi built-in và preview tăng
  0→1** (phát hiện của C6, bằng chứng B% đơn điệu ngược nhau). Diễn tiến theo
  thời gian của transition custom khi render thực tế chạy NGƯỢC so với ý đồ
  preview. Sửa thuộc về luồng render (viết lại expr theo P giảm cho cả 23 type
  custom, hoặc đổi cách ghép xfade) rồi đo lại toàn bộ 23 type — KHÔNG đảo p
  của preview để hợp thức hoá render ngược.
- **Dissolve vẫn LỆCH (MAD 85.52)**: hàm sinh T(x,y) của FFmpeg chưa xác định
  được; cần đọc source vf_xfade.c qua kênh khác (code.ffmpeg.org chặn Anubis).
- **Ghost chưa đo được trên canvas** (blocker seek pause headless: canvas đóng
  băng, MAD = 0.00 dù playhead nhích đúng); split-v chưa từng PASS trên canvas
  dù hình học đã KHỚP ở harness.
- **C1 còn sai số dư hệ thống nhỏ tại p=0.5** (MAD 1.12–1.56 vs 0.07–0.19 tại
  p khác): trọng số đo thấp hơn cosin thuần ~0.011 ở rho 0.2–0.5, nguyên nhân
  chưa xác định — không bịa hệ số hiệu chỉnh; vẫn trong ngưỡng KHỚP.
- **C5 còn nợ**: nested trim đi đường riêng (không qua trimClip), split không
  tách speedKeyframes, in/out dưới ramp còn tính bằng tốc độ hằng, đổi duration
  ngoài trimClip không cắt/dịch curve.
- **C4 còn nợ**: motion trên clip không phải video trong MCP validate vẫn bị
  drop lặng lẽ; `listVersions`/`exportHistory` cố ý trả spec gốc (migrate chỉ
  lúc restore); migration MCP chỉ bền vững khi có saveProject sau đó.
- **C3 chỉ đo** p=0.5, lớp A (transitionOut), clip 2, media mẫu tổng hợp —
  chưa đo lớp B, HD/1080p, FPS khi blend, footage thật.
- **C6 chưa đo** wiperight/wipeup/wipedown biên; checker-alt tại p=0.25 suy biến
  (B% = 0 cả hai phía); spiral/star là 2 type V3 yếu nhất dù vẫn KHỚP.

## 5. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round13-parity4.txt`
  (31 file text, NUL-delimited, không binary, không dist, không benchmarks/results;
  đã verify read-back khớp danh sách và mọi file tồn tại trên đĩa).
- Tổng chờ push sau đợt này: 9 batch / 295 file (264 + 31).
