# CAPTIONFOLLOW_LIMITS.md — Phụ đề bám theo clip nguồn (Phase 7 P6 + Phase 8 Q3)

## Vấn đề cũ
Auto-caption sinh TextClip từ segments theo THỜI GIAN MEDIA rồi thả thẳng
lên timeline, không link gì tới clip nguồn. User trim/move/split clip nguồn
xong là phụ đề lệch khỏi tiếng nói, phải sửa tay từng câu.

## Cách sửa
Mỗi câu phụ đề mang `captionOf: {clipId, mediaStart, mediaEnd}` (thời gian
trong FILE NGUỒN, không đổi khi edit) — xem `CaptionLink` trong
`packages/video-spec/src/index.ts`. Mỗi khi clip nguồn đổi hình học, store
tính lại vị trí timeline của câu từ captionOf + hình học mới
(`apps/web/src/lib/captionFollow.ts`, hàm thuần, test bằng Node):
- **Move** (kéo clip, multi-select): captionOf giữ nguyên, timeline dịch theo.
- **Trim** (cả 2 mép, cả ripple): câu ngoài `[in, out]` mới bị cắt/xoá; câu
  cắt dở bị THU HẸP cả captionOf lẫn timeline về phần còn thấy.
- **Split** (1 điểm, nhiều điểm/tách cảnh): câu nằm hẳn 1 phía đổi link sang
  nửa đó; câu vắt qua điểm cắt TÁCH thành nhiều clip (mỗi mảnh 1 clip).
- **Speed/reverse** (patchClip): phụ đề co/giãn/đảo theo đúng công thức
  `speed.ts` (forward: `(media - in)/speed`; reverse: `(out - media)/speed`).
- **Speed curve** (Phase 8 Q3): clip có `speedKeyframes` thì caption map
  đúng theo tích phân đường cong (`sourcePosAt` + nghịch đảo nhị phân
  trong `captionFollow.ts`), khớp render P3. Đòi hỏi sửa bug thượng nguồn
  trong `integrateSpeed` (xem mục "Đã kiểm chứng" — bản cũ tính sai đoạn
  con). Reverse + speedKeyframes: validator cấm tổ hợp này nên fallback
  về speed hằng.
- **Cắt khoảng lặng** (Phase 8 Q3, `store.removeSilence`): câu link tới clip
  bị cắt được CHIA theo các đoạn giữ (câu trong khoảng lặng bị RỚT, câu
  cắt ngang bị chẻ); caption của clip sau bị ripple dịch theo delta start.
  Test thật: `silenceFollow.test.ts` (6/6).
- **Copy/paste mang caption** (Phase 8 Q3, `clipboard.ts`): copy clip nguồn
  thì câu link tới nó cũng copy theo; paste tạo câu mới link tới id mới,
  giữ nguyên đoạn media, dịch theo shift khối. Xem CLIPBOARD_LIMITS.md.
- **Ripple delete/trim**: câu của các clip bị dồn/đẩy dịch theo delta start.
- **Xoá clip nguồn**: câu thành "mồ côi" — ĐỨNG YÊN vị trí cuối, KHÔNG bị
  xoá theo (tránh mất dữ liệu lặng lẽ); lần edit sau không bám nữa.
- **User tự kéo/sửa chính câu phụ đề** (move/trim/patch start/duration):
  HỦY LINK — câu thành chữ tự do, lần edit sau không kéo nó về nữa.

Render worker và preview KHÔNG đọc captionOf: chúng vẽ TextClip ở
start/duration đã được editor tính sẵn. Render validate chỉ cảnh báo mềm
nếu captionOf sai hình dạng (không chặn render).

Caption chỉ được link khi tạo từ CaptionModal và tìm được clip timeline
cùng file nguồn (ưu tiên clip đang chọn). Caption file chưa lên timeline,
import tay, hoặc mọi câu đều nằm ngoài clip nguồn → giữ hành vi cũ (chữ
tự do, không link).

## Đã kiểm chứng
- `captionFollow.test.ts`: 22 test (17 cũ + 5 curve mới: map xuôi/ngược/
  speed, trim trái/phải, move, speed-change, split xuôi/ngược, ripple,
  unlink, project trim+move liên tiếp, ramp linear/ease-in, reverse+curve
  fallback, refollow sau move trên clip ramp) — chạy bằng Node
  type-stripping, không cần browser.
- `silenceFollow.test.ts`: 6 test (đoạn giữ, câu rớt trong khoảng lặng, câu
  chẻ ngang, ripple + caption clip sau, link đúng đoạn giữ).
- `clipboard.test.ts`: 18 test (12 cũ + 6 paste-caption mới).
- Render validate: spec có captionOf hợp lệ → 0 lỗi; captionOf sai hình
  dạng → chỉ warning, không chặn render.
- `vite build` pass. `tsc --noEmit`: các file Q3 chạm tới SẠCH (0 lỗi), nhưng
  toàn app còn 4 dòng lỗi ở file của agent Phase 8 khác (LutPicker.tsx
  TS1117 x2, sticker.ts TS2322, beatSync.test.ts TS5097 — beatSync cũng
  chỉ thiếu 1 dòng exclude như silenceFollow từng thiếu) — KHÔNG phải do
  Q3 gây ra, để parent điều phối agent sở hữu sửa.
- **Bug thượng nguồn đã sửa (Phase 8 Q3):** `integrateSpeed` trong cả 3 bản
  mirror (`packages/video-spec/src/speedcurve.ts`, `speedcurve.js`,
  `server/render/src/speedramp.js`) tính SAI đoạn con của segment (dùng
  trung bình 2 đầu mút segment thay vì nguyên hàm theo easing — linear
  (0,2) trên [0,4] trả 3 thay vì 2.5; bug đã được P1 ghi nhận trong
  `previewEngine.ts` nhưng chưa sửa). Nay sửa bằng nguyên hàm đoạn con
  (linear p²/2, ease-in p³/3, ease-out p+(1-p)³/3); đoạn đầy đủ cho kết quả
  Y HỆT bản cũ nên consumer cũ (sourceConsumed, validate) không đổi.
  Hồi quy trong `server/render/test_p3.js` (5 assert đoạn con mới, tổng
  P3 73/73) + parity 3 bản mirror vẫn xanh. Ghi chú bug cũ trong
  `previewEngine.ts` đã cập nhật thành "đã sửa".

## Những gì CHƯA làm / giới hạn trung thực
- **Split clip có speedKeyframes:** điểm split của store vẫn tính bằng
  speed hằng (`speed.ts`) dù caption mapping nay đã đúng curve — split
  ramp clip có thể cho điểm cắt lệch nhẹ so với mapping mới. Cần 1 task
  riêng làm split curve-aware (ngoài phạm vi Q3).
- **Silence + speed ramp:** geometry đoạn giữ của `removeSilenceFromClip`
  dùng `sourceTimeAt` speed hằng, nên clip ramp bị cắt khoảng lặng thì
  đoạn giữ đã xấp xỉ trước khi caption bám theo (caption bám theo hình
  học đoạn giữ như đã đặt, không tự sửa hình học đó).
- **Trim phá huỷ phần đã cắt:** câu bị trim mất không khôi phục khi kéo
  dài clip lại (giống như video bị trim). Đây là hành vi có chủ ý, không
  phải bug.
- **Duplicate KHÔNG mang caption theo** (chỉ paste mang theo): duplicate
  đẩy clip sau sang phải nhưng không ripple track chữ, nên mang caption
  theo cần thiết kế riêng — để dành, không hứa.
- **Caption translation chỉ tiếng Anh** (xem `server/caption/
  TRANSLATE_LIMITS.md`): kết luận Q3 là không mở rộng được bằng model sẵn
  có (argos-translate không cài được trong môi trường này).
- **Click-test trên browser thật chưa làm được** (giới hạn chung của dự án:
  VM browser không tới được dev server) — tích hợp store chỉ được kiểm
  chứng ở mức logic thuần + typecheck + build, chưa click thật qua UI.
