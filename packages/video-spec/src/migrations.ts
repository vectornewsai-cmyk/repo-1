/**
 * migrations.ts — Schema versioning và migration cho video-spec.
 *
 * R1-019 / P0-12: Tách schema version khỏi app version, cung cấp migration
 * giữa các version, và từ chối file có version không hỗ trợ với thông báo rõ ràng.
 *
 * ## Lịch sử version
 *
 * - **0.1.0**: Schema gốc — track kinds: video, audio, text. VideoClip có
 *   transitionIn/Out, opacity, speed, reverse cơ bản.
 * - **0.2.0** (hiện tại): Thêm sticker và image track kinds; thêm filter (LUT),
 *   effects, chromaKey, animations (keyframes) cho VideoClip; thêm ImageClip,
 *   StickerClip types; thêm TextAnimation mở rộng.
 *
 * ## Nguyên tắc migration
 *
 * 1. Migration chỉ đi TIẾN (0.1.0 → 0.2.0), không hỗ trợ downgrade.
 * 2. Mọi migration phải bảo toàn dữ liệu — không mất field, không đổi ngữ nghĩa.
 * 3. Version không hỗ trợ → throw MigrationError với thông báo rõ ràng.
 * 4. Luôn validate sau khi migrate.
 *
 * ## Tránh circular import
 *
 * File này KHÔNG import value từ "./index.js" để tránh circular dependency
 * (index.ts re-export file này). Chỉ dùng `import type` (bị xóa khi compile).
 */

import type { VideoSpec } from "./index.js";

/** Các schema version mà code hiện tại đọc được (sau khi migrate). */
export const SUPPORTED_VERSIONS = ["0.1.0", "0.2.0"] as const;

export type SchemaVersion = (typeof SUPPORTED_VERSIONS)[number];

/** Version hiện tại mà code sinh ra. */
export const CURRENT_SCHEMA_VERSION: SchemaVersion = "0.2.0";

/** Lỗi migration với thông báo thân thiện cho user. */
export class MigrationError extends Error {
  /** Version của file gây lỗi (nếu đọc được). */
  readonly fromVersion: string | null;
  /** Version đích mong muốn. */
  readonly toVersion: string;

  constructor(message: string, fromVersion: string | null, toVersion: string = CURRENT_SCHEMA_VERSION) {
    super(message);
    this.name = "MigrationError";
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
  }
}

/**
 * Đọc version từ một object chưa xác thực.
 * Trả về null nếu không đọc được version.
 */
export function readSchemaVersion(v: unknown): string | null {
  if (typeof v !== "object" || v === null) return null;
  const version = (v as Record<string, unknown>)["version"];
  return typeof version === "string" ? version : null;
}

/**
 * Kiểm tra version có được hỗ trợ không (có thể migrate được).
 */
export function isSupportedVersion(v: string): v is SchemaVersion {
  return (SUPPORTED_VERSIONS as readonly string[]).includes(v);
}

/**
 * Validate cấu trúc tối thiểu của một VideoSpec (không phụ thuộc version).
 * Dùng nội bộ cho migrate — không thay thế validator đầy đủ.
 */
function hasValidStructure(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  if (typeof s["meta"] !== "object" || s["meta"] === null) return false;
  if (!Array.isArray(s["tracks"])) return false;
  return true;
}

/**
 * Migration 0.1.0 → 0.2.0.
 *
 * Thay đổi giữa 2 version đều là ADDITIVE (thêm field optional, thêm union member):
 * - TrackKind: thêm "sticker", "image"
 * - VideoClip: thêm filter?, effects?, chromaKey?, animations?
 * - Thêm ImageClip, StickerClip vào Clip union
 * - TextAnimation: thêm fadeIn, slideInLeft, slideInRight, slideUp, bounce
 *
 * Vì tất cả đều optional/additive, migration chỉ cần:
 * 1. Verify cấu trúc 0.1.0 hợp lệ
 * 2. Bump version lên 0.2.0
 * 3. Không cần transform dữ liệu — các field mới đều optional
 */
export function migrate010To020(spec: Record<string, unknown>): VideoSpec {
  // Deep clone để không mutate input
  const cloned = JSON.parse(JSON.stringify(spec)) as Record<string, unknown>;

  // Bump version
  cloned["version"] = "0.2.0";

  // Không cần transform — mọi field mới đều optional.
  // Các clip 0.1.0 (video/audio/text) vẫn hợp lệ trong 0.2.0.

  return cloned as unknown as VideoSpec;
}

/**
 * Migrate một spec từ version bất kỳ lên version hiện tại.
 *
 * @param v Object chưa xác thực (đọc từ JSON)
 * @returns VideoSpec ở version hiện tại (0.2.0)
 * @throws MigrationError nếu version không hỗ trợ hoặc migrate thất bại
 *
 * @example
 * ```ts
 * const raw = JSON.parse(fs.readFileSync("project.json", "utf-8"));
 * const spec = migrate(raw); // VideoSpec v0.2.0
 * ```
 */
export function migrate(v: unknown): VideoSpec {
  const fromVersion = readSchemaVersion(v);

  // Không đọc được version
  if (fromVersion === null) {
    throw new MigrationError(
      "File không có trường \"version\" — không xác định được schema version. " +
      `App hỗ trợ: ${SUPPORTED_VERSIONS.join(", ")}.`,
      null
    );
  }

  // Version không hỗ trợ
  if (!isSupportedVersion(fromVersion)) {
    // Version mới hơn app? (vd: file từ app mới hơn)
    const isNewer = compareVersions(fromVersion, CURRENT_SCHEMA_VERSION) > 0;
    if (isNewer) {
      throw new MigrationError(
        `File dùng schema version ${fromVersion}, mới hơn app hiện tại ` +
        `(hỗ trợ tới ${CURRENT_SCHEMA_VERSION}). ` +
        `Hãy cập nhật app lên bản mới nhất để mở file này.`,
        fromVersion
      );
    }
    // Version quá cũ, không có migration path
    throw new MigrationError(
      `Schema version ${fromVersion} quá cũ, không còn được hỗ trợ. ` +
      `App hỗ trợ migrate từ: ${SUPPORTED_VERSIONS.join(", ")}.`,
      fromVersion
    );
  }

  // Đã ở version hiện tại — validate cấu trúc và trả về
  if (fromVersion === CURRENT_SCHEMA_VERSION) {
    if (!hasValidStructure(v)) {
      throw new MigrationError(
        `File khai báo version ${fromVersion} nhưng cấu trúc không hợp lệ. ` +
        `File có thể bị hỏng.`,
        fromVersion
      );
    }
    return v as VideoSpec;
  }

  // Cần migrate: 0.1.0 → 0.2.0
  if (fromVersion === "0.1.0") {
    const s = v as Record<string, unknown>;
    if (s["version"] !== "0.1.0" || !hasValidStructure(v)) {
      throw new MigrationError(
        `File khai báo version 0.1.0 nhưng cấu trúc không hợp lệ. ` +
        `File có thể bị hỏng.`,
        fromVersion
      );
    }
    const migrated = migrate010To020(s);
    // Validate sau migrate
    if (!hasValidStructure(migrated)) {
      throw new MigrationError(
        `Migration 0.1.0 → 0.2.0 thất bại: kết quả không hợp lệ. ` +
        `Đây là lỗi internal, vui lòng báo cáo.`,
        fromVersion
      );
    }
    return migrated;
  }

  // Không tới được đây vì đã check isSupportedVersion, nhưng để chắc chắn
  throw new MigrationError(
    `Không có migration path từ version ${fromVersion} lên ${CURRENT_SCHEMA_VERSION}.`,
    fromVersion
  );
}

/**
 * So sánh 2 version string (semver đơn giản).
 * @returns -1 nếu a < b, 0 nếu bằng, 1 nếu a > b
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      // Fallback: so sánh string nếu không parse được số
      const sa = a.split(".")[i] ?? "";
      const sb = b.split(".")[i] ?? "";
      if (sa < sb) return -1;
      if (sa > sb) return 1;
      continue;
    }
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

/**
 * Thông tin version để hiển thị cho user hoặc ghi vào file.
 */
export function getVersionInfo(): {
  current: string;
  supported: readonly string[];
} {
  return {
    current: CURRENT_SCHEMA_VERSION,
    supported: SUPPORTED_VERSIONS,
  };
}
