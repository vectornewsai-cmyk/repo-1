# Schema Versioning Policy

> R1-019 / P0-12 — Chính sách version và migration cho video-spec.

## Tại sao cần versioning?

`video-spec` là "ngôn ngữ chung" giữa editor (web), render worker (FFmpeg),
MCP server (AI agent) và file project lưu trên disk. Khi schema thay đổi
(thêm field, thêm track kind), file cũ phải vẫn đọc được — nếu không user mất
project.

## Phân biệt các loại version

| Version | Ý nghĩa | Ví dụ | Nằm ở đâu |
|---|---|---|---|
| `schemaVersion` | Format của JSON video-spec | `0.2.0` | `spec.version` trong file JSON |
| `formatVersion` | Format của file `.vcut.json` (envelope) | `1` | `formatVersion` trong envelope |
| `appVersion` | Version của ứng dụng | `0.3.1` | package.json, không lưu trong spec |

**Quy tắc:** schema version chỉ bump khi cấu trúc JSON thay đổi theo cách
mà code cũ không đọc được. Thêm field optional KHÔNG bắt buộc bump major,
nhưng chúng ta bump minor để rõ ràng.

## Lịch sử schema

### 0.1.0 — Schema gốc
- Track kinds: `video`, `audio`, `text`
- VideoClip: `src`, `start`, `duration`, `in`, `out`, `transitionIn/Out`,
  `opacity`, `speed`, `reverse`

### 0.2.0 — Hiện tại
Thêm (tất cả đều additive, không breaking):
- Track kinds: `sticker`, `image`
- VideoClip: `filter?` (LUT), `effects?`, `chromaKey?`, `animations?` (keyframes)
- Types mới: `ImageClip`, `StickerClip`
- TextAnimation: thêm `fadeIn`, `slideInLeft`, `slideInRight`, `slideUp`, `bounce`
- Module mới: `migrations.ts`

## Quy tắc migration

### Khi nào cần viết migration?

- **Thêm field optional** → không cần migration code, chỉ bump version.
  Ví dụ: thêm `filter?` vào VideoClip.
- **Thêm union member** → không cần migration code.
  Ví dụ: thêm `"sticker"` vào TrackKind.
- **Đổi tên field** → CẦN migration (copy giá trị sang tên mới).
- **Xóa field** → CẦN migration (hoặc bump major + từ chối file cũ).
- **Đổi ngữ nghĩa field** → CẦN migration (transform giá trị).

### Cách viết migration mới

1. Thêm version mới vào `SUPPORTED_VERSIONS` trong `migrations.ts`.
2. Cập nhật `CURRENT_SCHEMA_VERSION`.
3. Viết hàm `migrateXXXToYYY()` — phải là pure function, không mutate input.
4. Thêm case trong `migrate()` để chain migrations (0.1.0 → 0.2.0 → 0.3.0).
5. Thêm test trong `migrations.test.ts`:
   - Migrate từ version cũ → không mất data
   - Input không bị mutate
   - Từ chối version không hỗ trợ
6. Cập nhật `SPEC_VERSION` trong `index.ts`.
7. Cập nhật file này (lịch sử schema).

### Ví dụ: thêm version 0.3.0

```ts
// migrations.ts
export const SUPPORTED_VERSIONS = ["0.1.0", "0.2.0", "0.3.0"] as const;
export const CURRENT_SCHEMA_VERSION: SchemaVersion = "0.3.0";

export function migrate020To030(spec: Record<string, unknown>): VideoSpec {
  const cloned = JSON.parse(JSON.stringify(spec));
  // Transform ở đây...
  cloned["version"] = "0.3.0";
  return cloned as unknown as VideoSpec;
}

// Trong migrate():
if (fromVersion === "0.2.0") {
  // ... validate, migrate, validate
}
```

## Xử lý file không đọc được

| Tình huống | Hành vi |
|---|---|
| Không có trường `version` | `MigrationError`: "File không có trường version..." |
| Version quá cũ (không trong SUPPORTED) | `MigrationError`: "Schema version X quá cũ..." |
| Version mới hơn app | `MigrationError`: "File dùng schema version X, mới hơn app..." + gợi ý update app |
| Version đúng nhưng cấu trúc hỏng | `MigrationError`: "File có thể bị hỏng" |

**Không bao giờ** tự đoán version hoặc bỏ qua lỗi validation để "cho qua".

## Dùng trong code

### Đọc file (web, render worker, MCP)

```ts
import { migrate, MigrationError } from "@repo-1/video-spec";

try {
  const raw = JSON.parse(fileContent);
  const spec = migrate(raw); // luôn trả về 0.2.0
  // ... dùng spec
} catch (e) {
  if (e instanceof MigrationError) {
    // Hiển thị e.message cho user (đã thân thiện)
  }
}
```

### Ghi file

Luôn ghi với version hiện tại:

```ts
import { SPEC_VERSION } from "@repo-1/video-spec";

const spec: VideoSpec = {
  version: SPEC_VERSION, // "0.2.0"
  meta: { ... },
  tracks: [ ... ],
};
```

## Test

```bash
cd packages/video-spec
npx tsc --noEmit          # typecheck
npx tsc                   # compile sang dist/
node --test dist/migrations.test.js  # chạy test
```

## Checklist khi thay đổi schema

- [ ] Đã xác định có cần migration code không (xem "Khi nào cần viết migration")
- [ ] Đã viết migration function (nếu cần)
- [ ] Đã thêm test cho migration
- [ ] Đã bump SPEC_VERSION
- [ ] Đã cập nhật file này
- [ ] Đã chạy test: `node --test`
- [ ] Đã kiểm tra backward compat: mở file version cũ
