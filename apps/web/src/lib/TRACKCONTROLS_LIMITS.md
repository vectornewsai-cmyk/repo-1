# TRACKCONTROLS_LIMITS.md — Giới hạn trung thực: track controls (R1-054)

Mute / lock / hide trên track. Ngày implement: 2026-10-19.

## Ngữ nghĩa đã chốt

| Flag | Tác dụng |
|---|---|
| `muted` | Audio track → câm hoàn toàn (preview + render). Video track → audio kế thừa từ file nguồn bị bỏ, hình vẫn render. |
| `locked` | Chỉ ở editor: chặn move/trim/split/patch/delete/add clip trên track. Render bỏ qua. Xóa cả track vẫn được (thao tác tường minh ở header). |
| `hidden` | Track hình ảnh (video/text/sticker/image) → không vẽ trong preview, không render. Track audio: `hidden` vô nghĩa (validator warn). |

## Quyết định thiết kế (có thể gây tranh cãi)

1. **Hidden video track nhưng audio kế thừa vẫn phát.** `hidden` chỉ ẩn hình; muốn câm thì dùng `muted`. Giống Premiere (eye icon), khác một số app mobile gộp chung.
2. **Lock không chặn xóa cả track.** Xóa track là thao tác tường minh, không phải "sửa clip".
3. **Mute video track trong preview:** đặt `volume = 0` trên phần tử video thay vì bỏ qua — giữ phát hình mượt, chỉ tắt tiếng.
4. **Shared media element:** nếu cùng 1 file media nằm trên 2 video track (1 muted, 1 không), `volume` do track duyệt sau quyết định (last-writer-wins). Hiếm gặp, chấp nhận.

## Giới hạn còn lại

1. **Chưa có solo.** Tắt tiếng "tất cả trừ track này" phải mute tay từng track.
2. **Chưa có rename track inline.** Đổi tên qua `label` trong file JSON.
3. **Lock là UI-level.** File spec mở bằng render worker trực tiếp vẫn render bình thường (đúng thiết kế — lock không phải bảo mật).
4. **Hidden track vẫn chiếm chỗ trong timeline.** Lane không collapse; chỉ mờ label (gạch ngang).
5. **Chưa test trên browser thật** (nợ chung của dự án). Preview logic đã review kỹ nhưng chưa click-test.
6. **Undo/redo (R1-051) chưa xong:** toggle flag hiện không hoàn tác được — sẽ tự có khi command stack xong.
