# PROJECT_LIMITS.md — Giới hạn trung thực của project persistence (web)

> VCut Studio — `apps/web/src/lib/projectRepo.ts`
> Cập nhật: 2026-10-19 (P0-12 / R1-019 hoàn thành)

## 1. Migration schema — ĐÃ TÍCH HỢP (P0-12)

`parseProjectText()` gọi `migrate()` từ `@repo-1/video-spec` **trước khi validate**:

- File có `spec.version` cũ hơn (hiện tại: `0.1.0`) → **tự động nâng cấp** lên
  `SPEC_VERSION` hiện tại (`0.2.0`), không mất dữ liệu. User nhận được warning:
  _"File dùng schema version 0.1.0 — đã tự động nâng cấp lên 0.2.0 (không mất dữ liệu).
  Lưu lại file để hoàn tất nâng cấp."_
- Migration chỉ đi **tiến** (không downgrade). Mọi thay đổi 0.1.0 → 0.2.0 đều
  additive (thêm field optional, thêm union member) nên không cần transform dữ liệu.
- Version không hỗ trợ → **từ chối với lỗi rõ ràng**:
  - Quá cũ (vd `0.0.5`): _"Schema version 0.0.5 quá cũ, không còn được hỗ trợ."_
  - Mới hơn app (vd `9.9.9`): _"File dùng schema version 9.9.9, mới hơn app hiện tại…
    Hãy cập nhật app lên bản mới nhất để mở file này."_
  - Thiếu `version`: validate sâu báo file hỏng như cũ.

Kiểm chứng: `apps/web/scripts/projectRepo.test.cjs` — section
_"parseProjectText: migrate 0.1.0 → 0.2.0 (P0-12)"_, **55/55 pass**.

## 2. Giới hạn còn lại (trung thực)

1. **Media binaries không lưu trong file project** (P2.2): `src` của clip là tên
   file do user import trong phiên làm việc. Mở file project trên máy khác /
   sau khi tải lại trang → media phải import lại thủ công.
2. **Không bao giờ lưu `blob:` URL bền vững**: save/load chỉ cảnh báo, media đó
   mất khi tải lại trang.
3. **Autosave dùng localStorage (~5MB)**: media binaries không autosave được;
   autosave hỏng → bỏ lặng lẽ, không crash app.
4. **Không có JSON Schema versioned** (master plan §3.1): hiện chỉ có TypeScript
   types + runtime validation. Canonical serializer (thứ tự field ổn định) chưa có.
5. **Envelope `specVersion` chỉ là metadata**: version thật để migrate là
   `spec.version`. Nếu envelope và spec lệch nhau, spec.version được ưu tiên.
6. **File 0.1.0 sau khi migrate vẫn giữ nguyên dữ liệu** nhưng các tính năng mới
   (sticker, image, LUT, effects…) đương nhiên không có trong file cũ — user cần
   thêm thủ công sau khi mở.
