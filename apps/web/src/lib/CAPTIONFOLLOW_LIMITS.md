# CAPTIONFOLLOW_LIMITS.md — Phụ đề bám theo clip nguồn (Phase 7 P6)

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
- `captionFollow.test.ts`: 17 test (map xuôi/ngược/speed, trim trái/phải,
  move, speed-change, split xuôi/ngược, ripple, unlink, project trim+move
  liên tiếp) — chạy bằng Node type-stripping, không cần browser.
- Render validate: spec có captionOf hợp lệ → 0 lỗi; captionOf sai hình
  dạng → chỉ warning, không chặn render.
- `tsc --noEmit` sạch, `vite build` pass.

## Những gì CHƯA làm / giới hạn trung thực
- **Speed curve (P3, `speedKeyframes`):** mapping hiện dùng `speed` hằng số.
  Clip nguồn có speedKeyframes thì phụ đề bám theo xấp xỉ hằng số, không
  theo đường cong tích phân. Cần P3 chốt ngữ nghĩa rồi mới implement đúng.
- **Cắt khoảng lặng (removeSilence):** thao tác này cắt clip thành nhiều
  mảnh theo timeline mới nhưng CHƯA nối caption theo (ngoài phạm vi
  trim/move/split của P6). Sau removeSilence, phụ đề của clip đó có thể
  lệch — user cần tạo lại phụ đề hoặc sửa tay.
- **Trim phá huỷ phần đã cắt:** câu bị trim mất không khôi phục khi kéo
  dài clip lại (giống như video bị trim). Đây là hành vi có chủ ý, không
  phải bug.
- **Copy/paste/duplicate KHÔNG mang caption theo** (clipboard copy clip
  nguồn không copy câu link tới nó) — tránh nhân đôi phụ đề không kiểm
  soát. User paste xong cần tạo phụ đề lại cho bản copy nếu muốn.
- **Click-test trên browser thật chưa làm được** (giới hạn chung của dự án:
  VM browser không tới được dev server) — tích hợp store chỉ được kiểm
  chứng ở mức logic thuần + typecheck + build, chưa click thật qua UI.
