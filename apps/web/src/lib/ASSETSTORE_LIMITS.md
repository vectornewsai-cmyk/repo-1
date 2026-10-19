# ASSETSTORE_LIMITS.md — Giới hạn trung thực của AssetStore (R1-032)

## Đã làm (kiểm chứng thật)

- `ingest()` tính SHA-256 bằng Web Crypto API thật, lưu blob vào IndexedDB
  (2 store: `manifests` nhẹ + `blobs`), dedup theo hash qua unique index.
- Test: **22/22 pass** (`bash apps/web/scripts/test-asset-store.sh`) —
  gồm vector SHA-256 chuẩn của `"hello"`, dedup, ingest song song
  (đường retry `ConstraintError`), refCount, remove/force, persistence qua
  instance thứ hai, và các helper `asset:` src.
- TypeScript strict: 0 lỗi.

## Giới hạn

1. **Hash đọc toàn bộ file vào RAM** (`blob.arrayBuffer()` trước khi
   `subtle.digest`). Web Crypto không có API hash streaming. File vài trăm MB
   vẫn ổn trên desktop; file nhiều GB có thể tràn bộ nhớ → chưa có giới hạn
   cứng, cũng chưa có hash theo chunk (việc tương lai).
2. **Quota IndexedDB tuỳ trình duyệt.** Safari (đặc biệt private mode) có thể
   từ chối hoặc giới hạn thấp. Lỗi quota sẽ throw từ `ingest()` — caller
   (UI) phải bắt và báo cho người dùng (chưa có UI).
3. **`crypto.subtle` đòi secure context** (https:// hoặc localhost). Mở file
   HTML qua `file://` có thể không có Web Crypto → `ingest()` throw với
   thông báo rõ ràng.
4. **assetId chỉ là 64 bit đầu của hash** (`a_` + 16 hex). Dedup tra theo
   full 256-bit qua unique index nên va chạm nội dung khác nhau là không
   thể trong thực tế; nhưng đừng dùng assetId làm checksum bảo mật.
5. **refCount là gợi ý, không tự động.** `ingest()` tạo manifest với
   `refCount: 0`; UI phải gọi `addRef()` khi clip tham chiếu asset và
   `releaseRef()` khi gỡ. Chưa có code nào trong app gọi các hàm này
   (tích hợp UI thuộc R1-033).
6. **`src: "asset:<id>"` chưa được render worker hiểu.** `validate.js`
   hiện tại sẽ báo "không tìm thấy file" vì nó resolve src theo tên file
   trong media-dir. Bridge server phải materialize asset ra file tạm trước
   khi gọi render (thuộc R1-034 archive/export).
7. **`remove()` từ chối khi `refCount > 0`** (trừ `force: true`) để tránh
   clip bị treo. Không có quét rác tự động cho asset mồ côi (refCount 0
   nhưng không clip nào dùng) — việc tương lai.
8. **Thumbnail/metadata không tự probe.** `ingest()` chỉ nhận metadata
   passthrough (`width/height/duration/thumbnail`); việc probe vẫn do
   `media.ts` (`fileToMediaItem`) đảm nhiệm. Caller tự nối hai bước này.
9. **Không mã hoá.** Blob lưu thô trong IndexedDB của origin; ai có quyền
   truy cập profile trình duyệt đều đọc được.
10. **Fake IndexedDB trong test** chỉ implement đúng surface AssetStore dùng
    (open/deleteDatabase, transaction, put/get/getAll/delete/clear,
    index().get). Hành vi trên IndexedDB thật của trình duyệt chưa được
    kiểm chứng trong task này — cần click-test trên browser thật (nợ chung).
