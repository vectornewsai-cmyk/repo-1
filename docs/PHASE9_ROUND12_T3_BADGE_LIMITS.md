# Phase 9 đợt 12 — Luồng T3: nâng nhãn badge preview theo số đo đợt 11 (LIMITS)

Ngày: 2026-10-27. Một luồng trong đợt lớn Phase 9 đợt 12 (đóng nợ đợt 11).
KHÔNG push, KHÔNG tag/release, KHÔNG binary. Không tạo file stage
paths-loop (parent đợt lớn gộp). Chỉ sửa file thuộc mảng badge/previewStatus
+ test badge — không đụng transitionPreview.ts, ghost preview,
projectRepo.ts, speed-curve UI.

## 1. Đã sửa gì

### Nâng 4 type effect canvas từ "approx" lên "matched"

Căn cứ duy nhất: số đo thật đợt 11 luồng P2
(`docs/PHASE9_ROUND11_P2_PIXELATE_LIMITS.md`), theo ngưỡng V6/V11 mà P2
đã dùng — **KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8** (FFmpeg 8.1.2,
harness V6, nguồn tổng hợp video-like):

| Effect | Số đo đợt 11 P2 | Nhãn mới |
|---|---|---|
| pixelate (k=2/6/9/16) | MAD 0.667, ≤8 = 100% | matched |
| shake (t=0 và t=0.5, frame 15/30) | MAD 0.000 | matched |
| rgb-shift (s=9) | MAD 0.000, ≤8 = 100% | matched |
| mirror | MAD 0.000 | matched |

Thực hiện: tách `EFFECT_CANVAS_MATCHED` (4 type trên) khỏi
`EFFECT_CANVAS_APPROX` trong `previewStatus.ts`; thứ tự nhánh
`effectPreviewStatus` nay là matched → canvas-matched → approx →
canvas-approx → none. Badge ở TransitionPanel/EffectPanel tự đổi theo
vì hai panel đã gọi `transitionPreviewStatus` / `effectPreviewStatus`
từ trước — không sửa panel.

### circleopen: giữ "approx", ghi chú chờ T2

Tại thời điểm T3 làm việc, **không có file đợt 12 nào của luồng T2 trên
đĩa** nên không đọc được kết quả T2 để đối chiếu — theo đúng quy tắc
task, không tự nâng. Hơn nữa số đo V11 đợt 11 đã có sẵn và đi ngược
hướng nâng: circleopen **LỆCH MAD 43.50** vì FFmpeg là gradient rộng
hoàn thành sớm ~P=0.8 trong khi preview mô hình biên cứng
(`docs/PHASE9_ROUND11_PREVIEW_PARITY2_LIMITS.md` §3.3). Nhãn "approx"
hiện tại vì thế là đúng, không phải nợ xấu. Khi T2 (hoặc đợt sau) đổi
mô hình preview sang gradient + đo lại đạt ngưỡng KHỚP, mới nâng
circleopen — T3 đã ghi rõ điều kiện này vào comment đầu
`previewStatus.ts`. Lưu ý: circleopen là transition, nhãn của nó đi
qua nhánh mặc định `approx` của `transitionPreviewStatus` (chỉ fade và
none là matched) nên không cần đổi code cho riêng nó.

### Test badge cập nhật theo thực tế sau đợt 11

- Parse thêm tập `EFFECT_CANVAS_MATCHED`; kiểm tra thân hàm khớp thứ tự
  nhánh mới; `CANVAS_MATCHED` (4 type) assert → matched,
  `CANVAS_APPROX` còn 4 type assert → approx; vòng kiểm tra
  `EFFECT_TYPES` mở rộng sang 3 nhóm phân loại.
- Số lượng panel transition: kiểm chứng lại bằng grep trực tiếp trên
  `TransitionPanel.tsx` — **đúng 82 type** (81 catalog + "none"), không
  thêm/bớt sau đợt 11; assertion 82 giữ nguyên, chỉ cập nhật comment
  ghi rõ đã kiểm chứng lại ở đợt 12.

## 2. Kết quả kiểm chứng (chạy thật, không tin mù)

- `node apps/web/scripts/v5-preview-badge.test.cjs`: **PASS 141 assertions**
  (trước sửa: 139 — tăng 2 do assert kích thước 2 tập canvas mới).
- `node apps/web/scripts/r6-i18n-check.cjs`: **PASS** (370 literal key,
  427 key mới R6, panel 82 type, picker 22 anim). T3 không thêm key i18n
  mới — badge tái dùng 3 nhãn matched/approx/none có sẵn — nhưng vẫn
  chạy check này theo yêu cầu task vì đụng code dùng key badge.
- `npx tsc --noEmit` (apps/web): **0 lỗi**.

## 3. Type nào vẫn "xấp xỉ" và vì sao (trung thực)

- **sharpen** — MAD 1.044, ≤32 = 100% nhưng không đạt tiêu chí ≤8 của
  ngưỡng KHỚP; nguyên nhân có cơ sở: preview box-blur 3×3, render
  unsharp 5×5 của FFmpeg. Không nâng dù MAD < 2, vì tiêu chí KHỚP có
  hai vế và P2 đã kết luận "xấp xỉ".
- **edgedetect** — MAD 6.769, ≤8 = 97.3%: xấp xỉ về số nhưng KHÁC CẤU
  TRÚC (Sobel canvas cho 2 cột đủ chiều cao, Canny render chỉ cho 4
  pixel thưa trên nguồn step). Ép khớp số này là overfit nguồn tổng hợp.
- **noise** — không đo được từng frame theo thiết kế: render dùng
  nhiễu thời gian, canvas dùng seed xác định để tua lại được. Chỉ xấp
  xỉ về thống kê.
- **glitch** — phần rgb-shift của nó thì khớp (đã đo ở rgb-shift),
  nhưng phần nhiễu/slice ngẫu nhiên chỉ xấp xỉ về thống kê nên cả type
  giữ "approx". Nâng glitch lên matched sẽ là claim sai cho phần nhiễu.
- **Mọi transition trừ fade/none** (gồm circleopen, wipe, dissolve,
  diamondclose, squareopen…) — vẫn "approx": preview vẽ từng clip riêng
  lẻ, không phải crossfade thật; V11 đợt 11 đo LỆCH cho circleopen
  (MAD 43.50), dissolve, diamondclose, squareopen và 14 type custom-expr
  V3 fallback fade (MAD 85).

## 4. Giới hạn của chính lần nâng này — đọc trước khi claim "badge = render"

- **"Matched" ở đây chỉ đúng trong phạm vi số đo P2**: nguồn tổng hợp
  video-like, máy đo VM này, FFmpeg 8.1.2. Chưa đo trên footage thật,
  HD, clip dài. Badge không chứng minh khớp tuyệt đối mọi nguồn.
- **Pixelate trên nguồn nhiễu ngẫu nhiên qua đường rgb24 vẫn lệch**
  (P2 đo MAD 36.83) do chuyển đổi không gian màu của đường scale, không
  phải lỗi lấy mẫu; chỉ trên nguồn mượt/pattern/video-like và đường
  yuv444p thì tâm khối mới khớp. Nhãn matched cho pixelate cần hiểu
  kèm giới hạn này.
- **Shake lệch pha khi clip không bắt đầu ở 0** (preview dùng thời gian
  clip-local, render dùng thời gian timeline) — vấn đề chung mọi effect
  theo thời gian, tồn tại từ trước, chưa sửa; nhãn matched cho shake
  đúng ở điều kiện clip bắt đầu ở 0 như harness đã đo.
- **Kích thước không chia hết cho k**: pixelate preview giữ nguyên khung
  và clamp điểm mẫu ở rìa, render co khung — vẫn xấp xỉ ở rìa theo lựa
  chọn có chủ ý, không phải bug chưa phát hiện.
- **T2 chưa đối chiếu được**: nếu T2 sau đó đổi mô hình circleopen và đo
  lại, đợt sau phải cập nhật cả nhãn lẫn test badge này — đừng coi
  comment "chờ T2" trong `previewStatus.ts` là xong việc.

## 5. File đã đổi/thêm (đường dẫn đầy đủ, tương đối từ gốc repo)

- `apps/web/src/components/transitions/previewStatus.ts` (sửa: tách
  `EFFECT_CANVAS_MATCHED`, cập nhật comment đầu file + comment tập)
- `apps/web/scripts/v5-preview-badge.test.cjs` (sửa: parse tập mới,
  assert 4 matched / 4 approx, kiểm chứng panel 82 type)
- `docs/PHASE9_ROUND12_T3_BADGE_LIMITS.md` (mới: file này)

Không đụng: `transitionPreview.ts`, ghost preview, `projectRepo.ts`,
speed-curve UI, `TransitionPanel.tsx`, `EffectPanel.tsx`, i18n JSON
(không thêm key), bất kỳ file binary nào.
