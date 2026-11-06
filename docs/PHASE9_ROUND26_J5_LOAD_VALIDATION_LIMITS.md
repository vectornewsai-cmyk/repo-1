# Phase 9 đợt 26, luồng J5 — Load-validation fail-soft cho speedKeyframes — LIMITS

Ngày: 2026-10-30. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không đụng `buildPreviewSpec` hay flatten (phần đó của luồng J1
song song); luồng này chỉ làm phía VALIDATION lúc load.

## 0. Vấn đề gốc (đợt 25 I6 §5a)

Load-validation cho qua curve nested vi phạm (v=5) vì
`validateSpecDeep` không kiểm tra `speedKeyframes` ở clip nào — nên
project vi phạm lọt tới preview mới nổ exception (seed deep của I6:
parse ok, 0 error, 0 warning, kể cả curve v=5 của MID-CURVINV).
Đợt này bắt vi phạm ngay lúc load, nhưng FAIL-SOFT: project vi
phạm vẫn mở được, chỉ bị cảnh báo.

## 1. Đã làm

File đổi/thêm (chỉ 4 file, xem §6):

- `apps/web/src/lib/projectRepo.ts`:
  - `SpeedCurveWarning` (có cấu trúc: `path` đầy đủ kể cả qua
    `.subSpec.`, `clipId`, `keyframeIndex` (null = vi phạm mức cả
    curve), `field`, `value`, `message`) + `formatSpeedCurveWarning`.
  - `checkSpeedKeyframes(curve, path, clipId, duration)`: kiểm tra
    MỘT curve, không throw. Luật mirror validator render/preview
    (`resolveNestedRampCurve`, `validateNestedSpeedCurveShape`):
    object `{ keyframes: [...] }`, ít nhất 1 keyframe, tối đa 128;
    t hữu hạn, t ≥ 0, t ≤ duration (khi duration biết), t đơn điệu
    tăng ngặt theo thứ tự viết (bằng nhau cũng vi phạm — khác
    normalize của engine vốn sort + dedupe); v hữu hạn trong
    [0.25, 4]; easing ∈ { linear, ease-in, ease-out, bezier };
    bezier cần `[x1, y1, x2, y2]` với x1, x2 ∈ [0, 1] (y tự do,
    chuẩn CSS).
  - `validateSpecDeep` nhận thêm `opts.speedCurveWarnings` (tùy
    chọn): thu warnings trong cùng lần duyệt, kể cả clip trong
    subSpec đệ quy (đường dẫn kèm tiền tố `.subSpec.`). KHÔNG
    truyền opts → hành vi cũ nguyên vẹn (chỉ errors).
  - `collectSpeedCurveWarnings(spec)`: quét độc lập mọi clip
    video/audio/nested (cấp cao + trong subSpec đệ quy, chống vòng
    lặp bằng seen-set sao chép theo nhánh như validateSpecDeep).
  - `parseProjectText`: vi phạm curve KHÔNG thành errors nên
    KHÔNG làm load thất bại; warnings được append vào
    `LoadResult.warnings` (dạng chuỗi) và `speedCurveWarnings`
    (có cấu trúc, giới hạn 100 mục đầu + 1 câu tổng kết nếu vượt).
  - `loadAutosave`: nay trả kèm `warnings` +
    `speedCurveWarnings` (trước đây bỏ warnings).
- `apps/web/src/App.tsx`: khôi phục autosave có warnings thì hiện
  toast info (kênh đã có sẵn `pushToast`; trước đây cổng autosave
  nuốt warnings).
- `apps/web/src/lib/projectRepoRound26J5.test.ts`: 15 test (xem §3).

## 2. Warnings đã tới UI chưa — trả lời thẳng

- Mở file (ProjectMenu): CÓ, qua kênh đã có sẵn — `onFile` gọi
  `warnList(res.warnings)` → 1 toast info liệt kê các warning.
  Speed warnings nằm trong `res.warnings` nên tự hiện, không cần
  sửa ProjectMenu.
- Khôi phục autosave (App.tsx): CÓ, từ đợt này — toast info mới
  thêm (trước đây cổng này nuốt warnings).
- CHƯA CÓ: panel/list load-report riêng để xem lại từng warning
  có cấu trúc (đường dẫn/keyframe/giá trị) sau khi toast tự đóng
  (toast tự đóng sau 4.5s ở component Toasts). `speedCurveWarnings`
  đã có sẵn trong `LoadResult` để UI sau này dùng, nhưng đợt này
  KHÔNG bịa là đã có panel đó.

## 3. Kiểm chứng (số thật)

- Test mới `projectRepoRound26J5.test.ts`: 15/15 pass, khóa:
  v=5 bị bắt (path `tracks[0].clips[0].subSpec.tracks[0].clips[0]`,
  clip MID-CURVINV, keyframe 0, field v, value 5); v biên 0.25/4
  cho qua; t giảm và t bằng nhau đều bị bắt; easing lạ
  (`ease-in-out`) bị bắt; nested sâu 3 tầng (TOP→A→B) bắt được
  với đủ 2 đoạn `.subSpec.` trong path; project lành 0 warning
  (kể cả bezier hợp lệ); keyframes rỗng, bezier malformed
  (x1=1.5, thiếu mảng), t vượt duration, v=0.1 đều bị bắt; lá
  video cấp cao v=5 bị bắt qua cổng load; clip không có curve
  không sinh warning giả.
- Hồi quy: `projectRepoNested22.test.ts` 7/7,
  `projectRepo.test.ts` 10/10 (validator cũ nguyên vẹn: speed
  hằng 9 và thiếu subSpec vẫn là errors; `validateSpecDeep`
  mặc định không coi curve là error — đó là thiết kế fail-soft,
  không phải hồi quy hỏng).
- `vite build`: pass (built in 8.61s).
- `tsc --noEmit`: file production của đợt này (`projectRepo.ts`,
  `App.tsx`) 0 lỗi. Toàn repo tại thời điểm đo KHÔNG đạt tsc 0:
  (a) test file mới và các test file cũ (`holdFrame.test.ts`,
  file test của luồng J1 song song) đều dính TS5097 vì dùng
  import `.ts` theo mẫu harness chạy bằng Node type-stripping —
  đây là quy ước có sẵn, không phải lỗi type thật, và test chạy
  xanh bằng node; (b) các lỗi ở file khác (`transitionPreview.ts`,
  trước đó là `relink.ts`) thay đổi theo từng lần chạy vì các
  luồng song song đợt 26 đang sửa cùng cây — không phải file của
  luồng này, parent gộp cần đo lại sau khi các luồng xong.

## 4. Phạm vi — chỉ speedKeyframes

- Chỉ kiểm tra `speedKeyframes`. Các curve khác KHÔNG được kiểm
  tra ở cổng này: `volumeKeyframes`, `animations`,
  `positionKeyframes`/keyframe animation khác (nếu có) vẫn như cũ.
- Chỉ kiểm tra clip kind video/audio/nested mang field
  `speedKeyframes`. Clip text/sticker/image mang field này (nếu
  có) không được quét — render có luật riêng cho lá phi-media
  dưới ramp, không gộp vào đây để tránh warning giả.
- Chỉ kiểm tra, KHÔNG sửa/chuẩn hoá: curve vi phạm được giữ
  nguyên trong spec đã load (không clamp v về [0.25, 4], không
  sort lại t). Việc preview khỏi nổ exception với curve này là
  phần của luồng J1 (fail-soft ở preview), không thuộc đợt này.

## 5. Nợ còn lại

1. Chưa có panel/list load-report để xem lại warnings có cấu trúc
   sau khi toast đóng (xem §2).
2. `tsc` toàn repo chưa sạch do file của luồng khác đang sửa dở
   + TS5097 ở test file (xem §3) — cần đo lại sau khi gộp đợt 26.
3. Load không tự sửa curve vi phạm (theo thiết kế fail-soft, chỉ
   cảnh báo); user vẫn cần sửa tay curve hoặc chờ J1 fail-soft ở
   preview để không nổ exception.

## 6. File đổi/thêm (để parent stage, luồng này KHÔNG tự stage)

- `apps/web/src/lib/projectRepo.ts` (sửa)
- `apps/web/src/App.tsx` (sửa, thêm toast autosave)
- `apps/web/src/lib/projectRepoRound26J5.test.ts` (thêm)
- `docs/PHASE9_ROUND26_J5_LOAD_VALIDATION_LIMITS.md` (thêm, file này)
