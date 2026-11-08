/**
 * projectId63R7.ts — projectId ổn định cho envelope .vcut + sổ tham chiếu
 * (Phase 9 đợt 63, luồng R7 — đóng nợ đợt 62 R7 §6.2/§6.3: hai file .vcut
 * trùng tên project chung một khóa sổ, ghi sau thắng; lock không chặn
 * stale giữa các lượt sync).
 *
 * Vấn đề: từ đợt 62 R7, sổ tham chiếu liên project khóa theo TÊN
 * (`name:<tên>`). Hai file .vcut khác nhau mà trùng tên project sẽ chung
 * một khóa — file mở sau ghi đè tập asset của file mở trước, bytes của
 * file trước mất bảo vệ (lỗ hổng theo hướng KHÔNG an toàn, ngược với đếm
 * thừa tên thô). Muốn hết hẳn cần một id ổn định theo FILE, không theo
 * tên: sinh một lần lúc tạo project, persist trong envelope `.vcut.json`
 * (và autosave), và khóa sổ theo id đó.
 *
 * Module này thuần + tự chứa (không import value từ file anh em, cùng
 * quy ước idbCleanup61R9.ts / projectAssetRefs62R7.ts — chạy được bằng
 * `node --experimental-strip-types`): chỉ sinh/kiểm tra id, định dạng
 * khóa sổ `id:<uuid>` và luật migration cho project cũ chưa có id.
 *
 * KHÔNG dùng projectId của lịch sử (lib/projectHistory.ts): id đó gắn
 * với tên lúc tạo/mở (`proj-...` xoay mỗi lần newProject,
 * `file-<hash spec>-<tên file>` đổi mỗi khi spec đổi) nên không ổn định
 * theo file — không dùng làm khóa sổ được.
 */

/**
 * UUID v4 (crypto.randomUUID). Fallback `proj-<time36>-<rand>` khi
 * crypto.randomUUID không có (môi trường cũ / không secure context) —
 * cùng mẫu với rotateProjectId của projectHistory.ts; vẫn duy nhất
 * trong thực tế (thời gian + 6 ký tự ngẫu nhiên) nhưng KHÔNG phải UUID
 * nên isValidProjectId vẫn chấp nhận nó (xem dưới).
 */
export function generateProjectId(): string {
  try {
    const ru = (globalThis as unknown as { crypto?: Crypto }).crypto?.randomUUID;
    if (typeof ru === "function") {
      const id = ru.call(globalThis.crypto) as string;
      if (typeof id === "string" && id.length > 0) return id;
    }
  } catch {
    // rơi xuống fallback bên dưới
  }
  return `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FALLBACK_ID_RE = /^proj-[0-9a-z]+-[0-9a-z]+$/i;

/**
 * true khi chuỗi là projectId hợp lệ: UUID do generateProjectId sinh,
 * hoặc dạng fallback `proj-<time>-<rand>` (môi trường không có
 * crypto.randomUUID). Mọi dạng khác — kể cả id lịch sử `file-...`
 * (đổi theo hash spec) và chuỗi rỗng — đều KHÔNG hợp lệ: parse sẽ coi
 * như file chưa có id và migration sinh id mới (xem
 * resolveEnvelopeProjectId).
 */
export function isValidProjectId(id: unknown): id is string {
  if (typeof id !== "string" || id.length === 0) return false;
  return UUID_RE.test(id) || FALLBACK_ID_RE.test(id);
}

/** Tiền tố khóa sổ tham chiếu theo id (phân biệt với khóa cũ `name:`). */
export const PROJECT_KEY_ID_PREFIX = "id:";

/**
 * Khóa sổ tham chiếu của một project, từ projectId ổn định của nó.
 * Hai file .vcut trùng tên nhưng khác id → hai khóa khác nhau, không
 * còn ghi đè lẫn nhau (khác với projectKeyForName của đợt 62 R7).
 * Id không hợp lệ → throw (caller phải validate/migrate trước bằng
 * resolveEnvelopeProjectId hoặc isValidProjectId).
 */
export function projectKeyForId(projectId: string): string {
  if (!isValidProjectId(projectId)) {
    throw new Error("projectKeyForId cần projectId hợp lệ (UUID hoặc proj-<time>-<rand>).");
  }
  return `${PROJECT_KEY_ID_PREFIX}${projectId}`;
}

/**
 * projectId từ khóa sổ `id:<uuid>`; null khi khóa không phải dạng id
 * (khóa cũ `name:...` của đợt 62 R7 hoặc khóa lạ — bản ghi legacy, xem
 * LIMITS R7 §2.2).
 */
export function projectIdFromKey(projectKey: string): string | null {
  if (typeof projectKey !== "string" || !projectKey.startsWith(PROJECT_KEY_ID_PREFIX)) return null;
  const id = projectKey.slice(PROJECT_KEY_ID_PREFIX.length);
  return isValidProjectId(id) ? id : null;
}

/** Kết quả phân giải projectId trong envelope lúc mở file. */
export interface ResolvedProjectId {
  /** Id sẽ dùng cho project này (id trong file, hoặc id mới vừa sinh). */
  projectId: string;
  /**
   * true khi file CHƯA có id hợp lệ (file cũ / id lạ / không phải
   * chuỗi) nên vừa sinh id mới — app phải lưu lại file/autosave để id
   * này bền vững (parseProjectText đã gắn warning cho trường hợp này).
   * false = id trong file được giữ nguyên, không đổi gì.
   */
  migrated: boolean;
}

/**
 * Migration cho project cũ chưa có id: envelope có `projectId` hợp lệ
 * thì giữ nguyên (migrated: false); thiếu/không hợp lệ thì sinh id mới
 * (migrated: true). KHÔNG suy id từ tên file/tên project/hash spec —
 * cả ba đều đổi được (đổi tên, sửa nội dung) nên không ổn định theo
 * file; id mới sinh là lựa chọn duy nhất đúng, và lần lưu sau sẽ
 * persist nó vào file.
 */
export function resolveEnvelopeProjectId(raw: unknown): ResolvedProjectId {
  if (isValidProjectId(raw)) return { projectId: raw, migrated: false };
  return { projectId: generateProjectId(), migrated: true };
}
