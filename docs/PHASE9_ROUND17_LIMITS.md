# Phase 9 đợt 17 — LIMITS tổng hợp: parity vòng 8 (đóng nợ đợt 16)

Chủ đề: hợp nhất harness, V13 radial-soft/dissolve-noise, nested speed + clip con sâu,
effect residuals, truy nguyên clip1/clip2, đo thật (FPS canvas + footage).
KHÔNG push, KHÔNG release/tag. Kiểm chứng gộp của parent: tsc 0 lỗi, vite build pass
(5.56s), V11 29 case FAIL 0, V12 37 case FAIL 0, V14 KHỚP 21/XẤP XỈ 1/LỆCH 0/PENDING 0,
script N5 chạy lại exit 0, render N3 chạy lại 11/11. V13 HD và các suite web là số đo của
luồng (parent không chạy lại: V13 ~9–14 phút, suite web đã có trong báo cáo luồng).

## Đã đóng

- N1: rasterizeTransitionPreview chỉ còn 1 bản trong harnessShared.js; V11/V12/V14 log
  trước/sau hợp nhất giống hệt nhau (đã lược thời gian render + tên tmp).
- N2: V13 hỗ trợ radial-soft + dissolve-noise; 6 case HD 1080p đều KHỚP, hồi quy 42 FAIL 0.
  Đính chính: radial-soft dùng trọng số tuyến tính đã xác minh, không phải smoothstep
  (smoothstep là mô hình của circleopen).
- N3: patchClip đổi speed nested tính lại duration; sửa clip con sâu ≥2 tầng qua 2 action
  store mới; test thuần 16 + store 8 + render MP4 thật 11/11.
- N4: edgedetect sang gray nguyên swscale + Gaussian σ=1.4 r=2; tổng 6 ô MAD 10.11 → 8.48,
  pattern tốt lên nhưng tự nhiên gốc tệ đi (2.13 → 3.82 ở 72×45) — giữ badge approx.
  Glitch không phải ngẫu nhiên theo thời gian: 5 process FFmpeg cho cùng output; lần lật
  tier đợt 16 là do code/tiêu chí đổi giữa chừng. Cách đo ổn định đã khóa trong parity test.
- N5: clip1/clip2 XẤP XỈ KHÔNG phải căn frame — là miền màu đo: xfade chạy trong YUV gốc
  của mp4, preview blend RGB. Ép rgb24 trước xfade: dissolve 1.2424 → 0.0057, circleopen
  1.5943 → 0.3820, đều KHỚP. Không sửa code sản phẩm.
- N6: parity nguồn phức tạp + chuyển động đều KHỚP ở rgb24; yuv420p e2e dissolve vẫn
  LỆCH (18.58/43.95%) — phạm vi badge giữ nguyên mức mô hình xfade rgb24.

## Chưa đóng / giới hạn trung thực

- FPS canvas trình duyệt thật VẪN CHƯA ĐO ĐƯỢC: headed Chrome không mở cổng CDP trên VM
  này (đã thử Xvfb + meta-chromium 152 + Playwright 156); số headless không phải FPS thật.
  Kết luận "ghost f8 sụp" của H4 chỉ đúng cho binary 152 + tải VM, không phải kết luận chung.
- Footage máy quay thật: không có trong repo (3 mp4 lớn nhất đều là smptebars + chữ tổng hợp);
  không tải video ngoài vì license không sạch.
- Edgedetect vẫn approx: cần qua cả tự nhiên gốc lẫn pattern 144×90 mới nâng được; nếu
  footage thật cho thấy biên mỏng phổ biến thì cần cân nhắc lại giữa Gaussian 1.4 và kernel cũ.
- Nested mang speedKeyframes vẫn chưa có ngữ nghĩa duration (render worker cấm field này ở
  nested); patch speed hằng trên nested đã mang curve giữ nguyên duration.
- Dissolve ở HD: ~83 pixel/khung lệch >8 do biên sinf 1-ulp (≤8 = 99.996%, vẫn KHỚP xa ngưỡng).
- Phạm vi đo V13/N2 là mức mô hình xfade rgb24 qua pipe, không phải xuất file yuv420p
  end-to-end; nợ LỆCH ~50 ở tầng đó từ đợt 15/16 vẫn còn.
- Còn lại ngoài phạm vi: rasterizeTextPreview vẫn riêng ở V11/V12 (chưa đối chiếu);
  updateNestedInnerClip tầng 1 (R5) chưa có guard nguồn của cha như hàm deep mới;
  pixelate còn dư 0.13 chưa truy nguyên; file rác `apps/web/~/workspace/repo-1-push/scratch16/`
  (từ đợt 16, đường dẫn `~` lọt vào repo) chưa dọn, không đưa vào batch.

## Nợ mở cho đợt sau

- Thử `--remote-debugging-pipe` hoặc máy thật để đo FPS canvas headed.
- Sửa phương pháp đo harness cho nguồn mp4 yuv: ép rgb24 trước xfade (theo N5) hoặc so trong
  miền YUV, rồi đo lại clip1/clip2 + yuv420p e2e.
- Áp guard nguồn của cha cho updateNestedInnerClip R5; nested speedKeyframes cần spec + render
  hỗ trợ trước khi tính duration.
- Tìm nguồn footage/ảnh thật license sạch (hoặc ghi rõ là không có) thay cho nguồn tổng hợp.
