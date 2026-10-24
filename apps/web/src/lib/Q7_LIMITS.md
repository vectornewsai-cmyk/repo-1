# Q7 — Cloud foundation: giới hạn trung thực (Phase 8)

## Chữ "cloud" trong đợt này nghĩa là gì — và không nghĩa là gì

- CÓ: lịch sử phiên bản project lưu local, trang chia sẻ HTML tĩnh, format
  + logic kiểm chứng bundle đồng bộ phía client (có test).
- KHÔNG CÓ: server cloud thật, tài khoản, đăng nhập, link chia sẻ công khai,
  đồng bộ tự động giữa các máy, đếm lượt xem, phân quyền, mã hoá.
- Bất kỳ câu nào trong UI/docs nói "cloud" mà không kèm "chưa có server"
  đều là sai — HistoryPanel và ExportPanel đều ghi rõ "lưu local" /
  "chỉ phát video, không chỉnh sửa".

## 1. Lịch sử phiên bản (projectHistory.ts)

- Lưu TOÀN BỘ spec mỗi snapshot (không delta) — khôi phục chắc chắn nhưng
  tốn dung lượng; mặc định giữ 50 version/project, vượt thì prune version cũ.
- Đổi tên project bắt đầu chuỗi lịch sử mới (projectId gắn với tên lúc
  tạo/mở). Mở lại cùng file `.vcut.json` thì tiếp tục đúng chuỗi cũ.
- Snapshot trùng hash với version mới nhất tự bỏ qua (không tạo rác).
- Khôi phục luôn snapshot trạng thái hiện tại trước (nhãn "trước khi khôi
  phục") để không mất dữ liệu nếu khôi phục nhầm.
- IndexedDBBackend chỉ chạy trên trình duyệt: test Node dùng MemoryBackend
  nên code mở DB/chuyển đổi store chưa được test tự động — cần click-test
  trên trình duyệt thật (nợ chung của dự án, xem Nợ mở trong MEMORY).
- Version lưu spec nhưng KHÔNG lưu media binaries: khôi phục version cũ mà
  media đã bị xoá khỏi máy thì clip vẫn thiếu (panel relink sẽ hiện).
- Xung đột giữa các tab: hai tab cùng sửa một project sẽ ghi đè version
  của nhau theo thứ tự thời gian (last-write-wins ở tầng IndexedDB, không
  có khoá). Không mở cùng project ở hai tab khi cần lịch sử chính xác.

## 2. Trang chia sẻ (sharePage.ts)

- Chỉ phát video đã render + liệt kê clip. Không phải editor, không sửa
  được, không có bình luận/lượt xem.
- Embedded: video base64 trong đúng 1 file HTML; vượt 100MB thì từ chối và
  bắt dùng linked. Video 50–100MB vẫn xuất được nhưng file rất nặng, gửi
  qua chat/email có thể bị chặn — UI đã cảnh báo.
- Linked: HTML + file video.mp4 đặt cạnh nhau; gửi thiếu file video thì
  trang không phát được (đã cảnh báo trong UI và trong trang).
- "Chia sẻ" = gửi file cho người khác, KHÔNG phải link công khai. Ai có
  file là xem được toàn bộ video + spec đính kèm trong trang.
- Tiêu đề/tên clip được escape HTML; spec JSON trong trang được escape
  chuỗi `</script` để không phá được khối JSON (đã có test).

## 3. Giao thức đồng bộ (syncProtocol.ts + docs/SYNC_PROTOCOL.md)

- SHA-256 thuần TS đã test bằng vector chuẩn (rỗng, "abc", 1MB 'a', UTF-8
  có dấu) — dùng được cả Node lẫn trình duyệt, không phụ thuộc WebCrypto.
- Manifest v1 chỉ nhận `content: string`; file binary thật sau này phải
  hash ở tầng upload (đọc bytes), không qua chuỗi UTF-8.
- Merge v1 là last-write-wins + giữ cả hai khi conflict; KHÔNG tự gộp
  timeline (gộp tự động dễ tạo project hỏng lặng lẽ).
- Chưa có mã hoá, phân quyền, delta/chunking, hay endpoint server nào.

## 4. Không đụng bridge

- Đợt này KHÔNG thêm endpoint bridge nào: lịch sử và trang chia sẻ đều
  chạy phía client. Bridge chỉ được dùng sẵn để tải MP4 đã render về khi
  xuất trang chia sẻ (endpoint download có sẵn từ trước).

## Test đã chạy (Node type-stripping, thật)

- syncProtocol.test.ts: 9/9 (SHA-256 vector + manifest + tamper + conflict)
- projectHistory.test.ts: 10/10 (diff + dedup + prune + export/import + hash)
- sharePage.test.ts: 7/7 (escape + embedded + linked + ngưỡng 100MB + trống)
- tsc + vite build: xem kết quả verify cuối của agent (ghi trong báo cáo).
