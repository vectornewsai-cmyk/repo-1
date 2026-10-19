# ARCHIVE_LIMITS.md — Giới hạn trung thực của archive export/import (R1-034)

## Định dạng

File `.vcut.zip` là ZIP thường chứa:

| Entry | Nội dung |
|---|---|
| `project.json` | ProjectEnvelope (giống `.vcut.json`: spec + tên + version) |
| `manifest.json` | Danh sách file media + SHA-256 + kích thước |
| `media/<ten-file>` | File media gốc, tên = `src` trong spec |

## Đã kiểm chứng (19/10)

- **38/38 test pass** (`scripts/test-archive.sh`): round-trip export→import giữ
  nguyên spec + nội dung media; từ chối archive bị giả mạo (sai SHA-256),
  path traversal (`../`), thiếu manifest, file không phải zip.
- TypeScript strict pass (`tsc --noEmit` trong apps/web).

## Giới hạn

1. **Tải toàn bộ vào RAM khi export/import.** JSZip giữ mọi file trong bộ nhớ
   trước khi ghi zip. Project vài GB media có thể làm trình duyệt chậm hoặc
   crash tab. Chưa stream từng file (cần rewrite bằng Compression Streams API
   + ZIP writer thủ công — để dành P2.x).
2. **Tên media phải là tên file đơn** (không chứa `/`). Spec hiện tại dùng tên
   file làm `src` nên luôn thỏa; nếu sau này `src` là đường dẫn tương đối có thư
   mục con, export sẽ báo lỗi tên không an toàn.
3. **Trùng tên media.** Nếu 2 file khác nhau trùng tên, archive chỉ giữ 1
   (store đã đảm bảo tên duy nhất khi import — xem `importFiles` trong store.ts).
4. **Không nén lại video/audio** (dùng STORE) — đúng vì mp4/mp3 đã nén; nhưng
   dung lượng archive ≈ tổng dung lượng media gốc.
5. **SHA-256 verify ở import** cần WebCrypto (`crypto.subtle`, yêu cầu secure
   context: HTTPS hoặc localhost). Nếu không có, fallback FNV (không an toàn
   bằng) — import thật trên production luôn có WebCrypto.
6. **Giới hạn chống zip-bomb:** tối đa 10.000 file, tổng 8 GiB. Vượt → từ chối.
7. **Media thiếu file gốc** (vd: project mở từ `.vcut.json` cũ, media đã mất):
   export vẫn thành công kèm warning; khi import sẽ báo cần relink (R1-033).
8. **Không mã hóa.** Archive là zip thường — ai có file đều đọc được media.
   Không dùng cho project cần bảo mật.
9. **Chưa tích hợp "collect files"** (P2.4): media trỏ tới `blob:` URL hoặc file
   ngoài project không được gom tự động — export báo thiếu để user tự xử lý.
