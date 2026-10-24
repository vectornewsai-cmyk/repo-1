# VCut Sync Protocol — Thiết kế đồng bộ project (Phase 8 Q7)

> **Trạng thái: THIẾT KẾ + CODE KIỂM CHỨNG PHÍA CLIENT. Chưa có server.**
>
> Tài liệu này định nghĩa format để khi có server sau này, client và server
> dùng chung một format mà không phải đổi lại. Mọi câu "server sẽ…" trong tài
> liệu này là **thiết kế**, không phải tính năng đã chạy. Tính năng đã chạy
> trong đợt này chỉ gồm: lịch sử phiên bản local (IndexedDB), trang chia sẻ
> HTML tĩnh, và các hàm build/verify manifest phía client (có test).

## 1. Mục tiêu

- Một project VCut gồm spec JSON + media binaries phải đóng gói được thành
  một bundle duy nhất, kiểm chứng được tính nguyên vẹn, và khôi phục được
  đúng version đã gửi — kể cả khi client và server ở hai máy khác nhau.
- Không bao giờ mất dữ liệu do ghi đè lặng lẽ: conflict phải được phát hiện
  và giữ cả hai version.

## 2. Bundle format (v1)

```
bundle/
  manifest.json        # SyncManifest (xem apps/web/src/lib/syncProtocol.ts)
  spec.json            # VideoSpec, JSON đã ổn định thứ tự key
  media/<tên file>     # media binaries, tên khớp clip.src trong spec
```

`manifest.json` (field bắt buộc):

| Field | Ý nghĩa |
|---|---|
| `format` | Luôn `"vcut-sync-bundle"` |
| `bundleVersion` | `1` |
| `projectId` | id project (chuỗi, do client tạo, bền vững qua rename? xem §5) |
| `baseVersionId` | version mà client dựa vào (`""` nếu là version đầu tiên) |
| `versionId` | version mới mà bundle này tạo ra |
| `createdAt` | ISO 8601 |
| `specHash` | hash ổn định của spec |
| `files[]` | `{ path, size, sha256 }` cho từng file trong bundle |

Checksum: SHA-256 hex của nội dung file. Đối với `spec.json`, hash tính
trên chuỗi JSON đã ổn định thứ tự key (stableStringify) để cùng một spec
không cho ra hai hash khác nhau chỉ vì thứ tự key.

## 3. Luồng đồng bộ (thiết kế, chưa implement server)

```
Client                          Server (tương lai)
  │  1. buildManifest(bundle)      │
  │  2. POST /sync/push ───────────>│  3. verifyManifest(bundle)
  │                                │  4. decideSync(baseVersionId, latest)
  │  5. accept → lưu version       │     - accept: lưu, trả versionId
  │     conflict → giữ cả hai      │     - conflict: trả latest + giữ bundle
  │                                │       chờ user chọn (không tự merge)
  │  6. GET /sync/pull ────────────>│  7. trả manifest mới nhất + bundle
```

## 4. Chính sách merge v1 (cố tình đơn giản)

- **Last-write-wins theo versionId, không merge nội dung.** Hai người sửa
  cùng project cùng lúc → server giữ cả hai version, client hiện conflict
  và user chọn version giữ lại (hoặc giữ cả hai dưới hai tên khác nhau).
- **Không tự động resolve conflict bằng cách gộp clip.** Gộp timeline tự
  động dễ tạo project hỏng lặng lẽ (trùng id clip, lệch thời gian) — v1
  không làm việc này.
- **Không tin manifest tự khai.** Server phải tự hash lại từng file và so
  với manifest trước khi nhận version (hàm `verifyManifest` phía client
  dùng đúng logic này; server sẽ implement lại tương đương).

## 5. Giới hạn và việc chưa làm (trung thực)

- **Chưa có server, auth, tài khoản, hay đồng bộ tự động.** Mọi endpoint
  `/sync/*` trong tài liệu này đều chưa tồn tại.
- **projectId hiện tại gắn với tên project lúc tạo/mở** (xem Q7_LIMITS.md):
  đổi tên project bắt đầu chuỗi lịch sử mới. Khi có server, projectId phải
  là UUID bền vững lưu trong envelope `.vcut.json`, không suy ra từ tên.
- **Media binaries chưa nằm trong manifest test:** hàm `buildManifest`
  nhận `content: string`; file binary sau này phải hash ở tầng upload
  (đọc bytes, không qua chuỗi UTF-8) rồi mới đưa vào manifest.
- **Chưa có mã hoá, chưa có phân quyền chia sẻ:** bundle chứa toàn bộ
  media gốc — ai có bundle là có toàn bộ project. Không dùng bundle này
  để chia sẻ công khai khi chưa có lớp quyền.
- **Chưa có delta/sync tăng dần:** mỗi version là full snapshot. Với
  project có media lớn, push lặp lại sẽ tốn băng thông — bản sau cần
  chunking + chỉ gửi file đổi (so checksum với manifest cũ).
