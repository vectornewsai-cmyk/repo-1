/**
 * projectNameRegistry64R6.ts — Registry project theo projectId + hiển thị
 * phân biệt tên trùng nhau (Phase 9 đợt 64, luồng R6 — đóng nợ đợt 63 R7
 * §5: R7 đã khóa sổ tham chiếu theo `id:<uuid>` nhưng các chỗ còn lại
 * vẫn dùng TÊN project làm định danh).
 *
 * Vấn đề: sau đợt 63 R7, envelope `.vcut` đã có projectId ổn định và sổ
 * tham chiếu đã khóa theo id, nhưng vẫn còn những chỗ dùng tên làm khóa:
 *  (1) chuỗi lịch sử version (projectHistory.ts) khóa theo id legacy
 *      `proj-<time>-<rand>` (xoay mỗi lần tạo project mới) hoặc
 *      `file-<hash spec>-<tên file>` (đổi mỗi khi nội dung đổi) — đổi
 *      tên project hoặc sửa nội dung rồi mở lại đều bắt đầu chuỗi mới;
 *  (2) panel Dọn kho liệt kê các bản ghi sổ tham chiếu chỉ bằng tên —
 *      hai project trùng tên hiện y hệt nhau, không phân biệt được;
 *  (3) `usedByOther` trong quét dọn kho khử trùng theo TÊN thô — hai
 *      project trùng tên dùng chung một asset chỉ hiện một mục.
 *
 * Module này thuần + tự chứa (không import value từ file anh em, cùng
 * quy ước projectId63R7.ts / projectAssetRefs62R7.ts — chạy được bằng
 * `node --experimental-strip-types`): nhãn hiển thị phân biệt tên trùng
 * + luật nhận diện/nhận chuỗi lịch sử legacy để migration. Logic
 * migration (đổi khóa version) nằm ở HistoryStore.migrateVersions
 * (projectHistory.ts); wrapper nhận chuỗi ở adoptLegacyHistoryChain.
 *
 * Đợt 65 S9 — sửa nợ #9 (LIMITS đợt 64 R6 §5.1): luật nhận cũ chỉ so
 * hậu tố tên file nên 2 file khác nhau cùng tên nhận nhầm chuỗi của
 * nhau ở lần nhận đầu. Nay nhận cần thêm BẰNG CHỨNG NỘI DUNG (hash
 * spec đang mở khớp hash nhúng trong id `file-` hoặc hash một version
 * trong chuỗi — xem §3); chuỗi rỗng thì dọn con trỏ chết; chuỗi legacy
 * phân mảnh (`file-<hash cũ>-<tên>`, `proj-`) được quét + tự nhận khi
 * chắc chắn, báo mơ hồ khi không đủ bằng chứng (xem
 * docs/PHASE9_ROUND65_S9_LIMITS.md).
 *
 * NGUYÊN TẮC HIỂN THỊ (chỉ UI liệt kê, không đổi tên file của user):
 * - Tên duy nhất trong danh sách → hiện tên trần, không thêm gì.
 * - Tên trùng nhau → kèm qualifier rút gọn: bản ghi khóa id thì kèm 8
 *   ký tự đầu của projectId; bản ghi legacy khóa tên (không có id) thì
 *   kèm ngày/giờ ghi `YYYY-MM-DD HH:mm` (lấy từ updatedAt, dạng ISO
 *   nên không phụ thuộc locale). Hai qualifier không bao giờ giống nhau
 *   về hình thức (hex ngắn vs ngày) nên luôn phân biệt được.
 */

// ---------------------------------------------------------------------------
// 1. Nhãn hiển thị phân biệt tên trùng nhau (panel Dọn kho).
// ---------------------------------------------------------------------------

/** Dữ liệu tối thiểu để tính nhãn — khớp ProjectRefRecordLike. */
export interface RegistryDisplayRecord {
  projectKey: string;
  projectName: string;
  projectId?: string;
  updatedAt?: string;
}

/** 8 ký tự đầu của projectId — đủ phân biệt trong danh sách ngắn. */
export function shortProjectId(projectId: string): string {
  return typeof projectId === "string" ? projectId.slice(0, 8) : "";
}

/** projectId từ khóa sổ `id:<uuid>`; null khi khóa legacy/khóa lạ. */
export function projectIdFromRegistryKey(projectKey: string): string | null {
  if (typeof projectKey !== "string" || !projectKey.startsWith("id:")) return null;
  const id = projectKey.slice("id:".length);
  return id.length > 0 ? id : null;
}

/**
 * Qualifier rút gọn cho một bản ghi khi tên của nó bị trùng: bản ghi
 * khóa id → 8 ký tự đầu projectId (lấy từ field `projectId`, rơi về
 * khóa `id:` khi field vắng); bản ghi legacy khóa tên → ngày/giờ ghi;
 * không có cả hai → chuỗi "legacy" (trung lập ngôn ngữ).
 */
export function registryQualifier(record: RegistryDisplayRecord): string {
  const id = record.projectId ?? projectIdFromRegistryKey(record.projectKey);
  if (typeof id === "string" && id.length > 0) return shortProjectId(id);
  if (typeof record.updatedAt === "string" && record.updatedAt.length >= 10) {
    return record.updatedAt.slice(0, 16).replace("T", " ");
  }
  return "legacy";
}

/**
 * Nhãn hiển thị cho từng bản ghi, keyed theo projectKey. Tên duy nhất
 * → tên trần; tên xuất hiện ≥2 lần → `Tên · qualifier`. Bản ghi trùng
 * khóa (cùng projectKey) nhận cùng nhãn — đúng vì đó là cùng một bản
 * ghi. Trả về Map rỗng khi danh sách rỗng.
 */
export function registryDisplayLabels(
  records: ReadonlyArray<RegistryDisplayRecord>,
): Map<string, string> {
  const labels = new Map<string, string>();
  const nameCount = new Map<string, number>();
  for (const r of records) {
    nameCount.set(r.projectName, (nameCount.get(r.projectName) ?? 0) + 1);
  }
  for (const r of records) {
    if ((nameCount.get(r.projectName) ?? 0) <= 1) {
      labels.set(r.projectKey, r.projectName);
    } else {
      labels.set(r.projectKey, `${r.projectName} · ${registryQualifier(r)}`);
    }
  }
  return labels;
}

// ---------------------------------------------------------------------------
// 2. Nhận diện chuỗi lịch sử legacy (khóa theo tên file) để migration.
// ---------------------------------------------------------------------------

/**
 * Biến đổi tên file y hệt setProjectIdForFile (projectHistory.ts):
 * chỉ giữ [a-zA-Z0-9_-], tối đa 40 ký tự. Giữ hai bản đồng bộ khi sửa
 * thuật toán — hàm này là bản canonical cho code mới; hàm cũ giữ nguyên
 * vì đã deprecated (xem projectHistory.ts).
 */
export function sanitizeLegacyFileName(fileName: string): string {
  return typeof fileName === "string"
    ? fileName.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40)
    : "";
}

/** true khi id là chuỗi lịch sử legacy dạng file (`file-<hash>-<tên>`). */
export function isLegacyFileHistoryId(id: unknown): id is string {
  return typeof id === "string" && id.startsWith("file-");
}

/**
 * true khi id là chuỗi lịch sử legacy bất kỳ (`file-...` hoặc
 * `proj-...`). UUID envelope / id fallback `proj-` của envelope KHÔNG
 * phân biệt được bằng hình thức với `proj-` legacy — hàm này chỉ dùng
 * để nhận diện id ĐỌC TỪ KHÓA LỊCH SỬ (HISTORY_PROJECT_KEY), nơi code
 * cũ chỉ ghi hai dạng legacy (xem LIMITS đợt 64 R6 §2.2).
 */
export function isLegacyHistoryId(id: unknown): id is string {
  return (
    isLegacyFileHistoryId(id) ||
    (typeof id === "string" && id.startsWith("proj-"))
  );
}

/**
 * Chuỗi legacy `file-<hash>-<tên>` có thuộc về file đang mở không?
 * Chỉ kiểm tra hậu tố tên file đã sanitize — hash đầu đổi theo nội
 * dung nên không so được (file đã sửa sau lần mở trước thì hash khác).
 * Trả false khi tên sanitize rỗng (không có tín hiệu quy kết).
 */
export function legacyFileChainMatchesName(legacyId: string, fileName: string): boolean {
  if (!isLegacyFileHistoryId(legacyId)) return false;
  const sanitized = sanitizeLegacyFileName(fileName);
  if (sanitized.length === 0) return false;
  return legacyId.endsWith(`-${sanitized}`);
}

/** Kết quả quyết định nhận chuỗi legacy về id envelope. */
export interface AdoptDecision {
  adopt: boolean;
  reason: string;
}

/**
 * CỔNG TÊN (cần nhưng KHÔNG đủ — đợt 65 S9): chỉ kiểm tra chuỗi legacy
 * có phải `file-` và hậu tố tên file có khớp file đang mở không. Đợt 64
 * dùng riêng nó làm luật nhận nên 2 file khác nhau cùng tên nhận nhầm
 * nhau (nợ #9). Từ đợt 65 S9, luật nhận đầy đủ là
 * `decideLegacyAdoption` (§3): cổng tên + bằng chứng nội dung (hash
 * spec). Hàm này giữ nguyên để test B3 + code ngoài còn dùng làm cổng
 * lọc nhanh khóa. Không có tên file (đường autosave-restore / panel)
 * thì không nhận.
 */
export function shouldAdoptLegacyChain(
  legacyId: string | null | undefined,
  fileName?: string,
): AdoptDecision {
  if (!legacyId) return { adopt: false, reason: "no-legacy-id" };
  if (!isLegacyFileHistoryId(legacyId)) {
    return { adopt: false, reason: "not-file-chain" };
  }
  if (!fileName) return { adopt: false, reason: "no-file-name" };
  if (!legacyFileChainMatchesName(legacyId, fileName)) {
    return { adopt: false, reason: "name-mismatch" };
  }
  return { adopt: true, reason: "file-chain-name-match" };
}

// ---------------------------------------------------------------------------
// 3. Bằng chứng nội dung (đợt 65 S9) — phân biệt 2 file cùng tên bằng
// hash spec, và tự nhận chuỗi legacy phân mảnh.
// ---------------------------------------------------------------------------

/**
 * Bằng chứng nội dung để quyết định nhận một chuỗi legacy. Chỉ mang
 * HASH (chuỗi), không mang spec — module này giữ nguyên quy ước thuần
 * + tự chứa, không import value từ file anh em; caller
 * (projectHistory.ts) tính hash bằng specHash của nó rồi truyền vào.
 * Hash là FNV-1a 8 hex của stableStringify(spec) — cùng thuật toán với
 * field `hash` của mỗi version và hash nhúng trong id `file-`.
 */
export interface LegacyAdoptionEvidence {
  /** Hash của spec file đang mở; null khi caller không có spec (không có bằng chứng nội dung). */
  openedSpecHash?: string | null;
  /** Hash (field `hash`) của từng version trong chuỗi đang xét; null khi chưa liệt kê được. */
  chainVersionHashes?: string[] | null;
  /**
   * true khi spec đang mở có ≥1 clip. Spec rỗng (0 clip) có hash trùng
   * nhau giữa hai project mới tinh nên hash của nó KHÔNG đủ làm bằng
   * chứng chắc chắn — mọi luật hash dưới đây đều yêu cầu cờ này.
   */
  specNonTrivial?: boolean;
}

/** Tách id `file-<hash>-<tên>` thành hash nhúng + phần tên; null khi sai dạng. */
export function parseLegacyFileId(legacyId: string): { hash: string; namePart: string } | null {
  if (typeof legacyId !== "string") return null;
  const m = /^file-([0-9a-f]+)-(.+)$/.exec(legacyId);
  if (!m) return null;
  return { hash: m[1], namePart: m[2] };
}

/** Hash nhúng trong id `file-<hash>-<tên>` (hash spec lúc mở file lần cuối); null khi sai dạng. */
export function legacyFileEmbeddedHash(legacyId: string): string | null {
  return parseLegacyFileId(legacyId)?.hash ?? null;
}

/**
 * Hash nội dung có khớp không? Khớp khi hash spec đang mở bằng hash
 * nhúng trong id (spec trên đĩa chưa đổi từ lần mở cuối) HOẶC bằng hash
 * của một version trong chuỗi (file đã về một trạng thái đã snapshot
 * trước đó). Yêu cầu spec phi tầm thường (≥1 clip) — xem
 * LegacyAdoptionEvidence.specNonTrivial.
 */
function contentHashMatches(legacyId: string, evidence: LegacyAdoptionEvidence): boolean {
  const opened = evidence.openedSpecHash;
  if (typeof opened !== "string" || opened.length === 0) return false;
  if (!evidence.specNonTrivial) return false;
  if (legacyFileEmbeddedHash(legacyId) === opened) return true;
  const chain = evidence.chainVersionHashes;
  return Array.isArray(chain) && chain.includes(opened);
}

/**
 * Luật nhận ĐẦY ĐỦ cho chuỗi legacy mà con trỏ HISTORY_PROJECT_KEY
 * đang trỏ tới (đợt 65 S9 — thay luật chỉ-so-tên của đợt 64):
 *
 *  CHẮC CHẮN — nhận:
 *   - `content-hash-match`: hash spec đang mở khớp hash nhúng trong id
 *     hoặc hash một version trong chuỗi. Tên file lúc này chỉ là nhãn —
 *     nhận cả khi file đã đổi tên trên đĩa (tên khác, hash khớp).
 *   - `adopted-empty-chain`: chuỗi rỗng (0 version) + tên khớp — không
 *     có version nào để nhận nhầm, chỉ dọn con trỏ chết.
 *  MƠ HỒ — từ chối, GIỮ khóa để lần mở sau thử lại:
 *   - `ambiguous-no-content-evidence`: tên khớp nhưng caller không đưa
 *     spec (không có bằng chứng nội dung — vd đường autosave-restore).
 *   - `ambiguous-trivial-spec`: spec đang mở rỗng (0 clip) — hash của
 *     nó trùng nhau giữa hai project mới tinh nên không phân biệt được.
 *   - `ambiguous-name-only-hash-mismatch`: tên khớp nhưng hash lệch —
 *     hoặc là file khác cùng tên (ĐÚNG lỗi nợ #9 — phải từ chối), hoặc
 *     là cùng file nhưng đã sửa nội dung bên ngoài app. Hai trường hợp
 *     này không phân biệt được bằng dữ liệu còn lại nên đều từ chối.
 *  TỪ CHỐI HẲN (không phải mơ hồ): `no-legacy-id`, `not-file-chain`
 *  (chuỗi `proj-` — xem classifyLegacyFragment để nhận mảnh proj-),
 *  `no-file-name`, `name-mismatch` (tên lệch VÀ hash lệch).
 *
 * Giới hạn trung thực: hash FNV-1a 32-bit có thể va chạm (2^-32/cặp)
 * và file sao chép y hệt nội dung (Save-As/copy) có cùng hash nên sẽ
 * được nhận như cùng một project tới điểm sao chép — lịch sử tới điểm
 * đó vốn là chung nên đây là nhận đúng, chỉ file nào mở trước thì
 * hưởng chuỗi chung đó (xem LIMITS đợt 65 S9 §4).
 */
export function decideLegacyAdoption(
  legacyId: string | null | undefined,
  fileName: string | undefined,
  evidence: LegacyAdoptionEvidence,
): AdoptDecision {
  if (!legacyId) return { adopt: false, reason: "no-legacy-id" };
  if (!isLegacyFileHistoryId(legacyId)) {
    return { adopt: false, reason: "not-file-chain" };
  }
  if (!fileName) return { adopt: false, reason: "no-file-name" };
  const chain = evidence.chainVersionHashes;
  if (Array.isArray(chain) && chain.length === 0 && legacyFileChainMatchesName(legacyId, fileName)) {
    return { adopt: true, reason: "adopted-empty-chain" };
  }
  if (contentHashMatches(legacyId, evidence)) {
    return { adopt: true, reason: "content-hash-match" };
  }
  if (!legacyFileChainMatchesName(legacyId, fileName)) {
    return { adopt: false, reason: "name-mismatch" };
  }
  if (!evidence.openedSpecHash) {
    return { adopt: false, reason: "ambiguous-no-content-evidence" };
  }
  if (!evidence.specNonTrivial) {
    return { adopt: false, reason: "ambiguous-trivial-spec" };
  }
  return { adopt: false, reason: "ambiguous-name-only-hash-mismatch" };
}

/**
 * Thông tin hiển thị cho một chuỗi legacy MƠ HỒ (đợt 66 T7) — bằng chứng
 * để user quyết định nhận/bỏ thủ công trong UI (LegacyHistoryAdoptModal).
 * Chỉ mang dữ liệu đã có trong kho (id + version), không mang spec.
 */
export interface LegacyChainDisplay {
  /** Phần tên trong id `file-<hash>-<tên>`; "" khi chuỗi `proj-` (không có tên file). */
  namePart: string;
  /** Hash nhúng trong id `file-`; null khi chuỗi `proj-` / sai dạng. */
  embeddedHash: string | null;
  /** Số version trong chuỗi. */
  versionCount: number;
  /** createdAt (ms) của version cũ nhất; null khi chuỗi rỗng. */
  firstCreatedAt: number | null;
  /** createdAt (ms) của version mới nhất; null khi chuỗi rỗng. */
  lastCreatedAt: number | null;
}

/**
 * Tính thông tin hiển thị cho một chuỗi legacy từ id + danh sách version
 * của nó. Thuần — test được trực tiếp, không chạm kho.
 */
export function legacyChainDisplay(
  chainId: string,
  versions: ReadonlyArray<{ createdAt?: number }>,
): LegacyChainDisplay {
  const parsed = parseLegacyFileId(chainId);
  let first: number | null = null;
  let last: number | null = null;
  for (const v of versions) {
    if (typeof v.createdAt !== "number" || !Number.isFinite(v.createdAt)) continue;
    if (first === null || v.createdAt < first) first = v.createdAt;
    if (last === null || v.createdAt > last) last = v.createdAt;
  }
  return {
    namePart: parsed?.namePart ?? "",
    embeddedHash: parsed?.hash ?? null,
    versionCount: versions.length,
    firstCreatedAt: first,
    lastCreatedAt: last,
  };
}

/**
 * true khi reason là một lý do MƠ HỒ của decideLegacyAdoption (từ chối
 * nhưng GIỮ khóa/dữ liệu để user quyết định sau — khác với từ chối hẳn
 * như `name-mismatch` / `not-file-chain`).
 */
export function isAmbiguousAdoptionReason(reason: string): boolean {
  return typeof reason === "string" && reason.startsWith("ambiguous-");
}

/** Kết quả phân loại một chuỗi legacy KHÔNG phải chuỗi con trỏ. */
export type FragmentVerdict = "certain" | "ambiguous" | "unrelated";
export interface FragmentClassification {
  verdict: FragmentVerdict;
  reason: string;
}

/**
 * Phân loại một chuỗi legacy phân mảnh (đợt 65 S9): chuỗi `file-` từ
 * lần mở trước (mỗi lần sửa nội dung rồi mở lại là một chuỗi mới dưới
 * code cũ) hoặc chuỗi `proj-` lúc project chưa từng lưu file. Chỉ
 * phân loại — migration do caller (adoptLegacyHistoryChain) thực hiện.
 *
 *  CHẮC CHẮN (`certain`) — nhận:
 *   - `content-hash-match`: chuỗi `file-`, hash khớp (tên khớp hoặc
 *     không — cùng file, hoặc bản sao y hệt nội dung).
 *   - `content-hash-match-renamed`: như trên nhưng tên đã khác (file
 *     đổi tên trên đĩa sau lần mở cuối).
 *   - `content-hash-match-proj`: chuỗi `proj-`, hash spec đang mở nằm
 *     trong các version của chuỗi — file này đã được lưu ra từ project
 *     chưa từng lưu file đó (không có tín hiệu tên file nên chỉ hash
 *     mới quy kết được).
 *  MƠ HỒ (`ambiguous`) — báo cáo, KHÔNG nhận, KHÔNG đụng:
 *   - chuỗi `file-` cùng tên nhưng hash lệch / thiếu bằng chứng (cùng
 *     3 lý do như decideLegacyAdoption: `ambiguous-no-content-evidence`,
 *     `ambiguous-trivial-spec`, `ambiguous-name-only-hash-mismatch`).
 *     Đây là mảnh cũ của cùng file đã sửa ngoài app HOẶC file khác
 *     cùng tên — không phân biệt được nên để nguyên.
 *  KHÔNG LIÊN QUAN (`unrelated`) — bỏ qua lặng lẽ:
 *   - `no-signal`: chuỗi `file-` khác tên + khác hash, hoặc chuỗi
 *     `proj-` không có hash trùng (không có tín hiệu nào quy kết được —
 *     có thể là mảnh của project này, cũng có thể của project khác;
 *     không liệt kê để khỏi nhiễu).
 *   - `not-legacy`: id không phải legacy (UUID envelope của project khác).
 */
export function classifyLegacyFragment(
  chainId: string,
  fileName: string | undefined,
  evidence: LegacyAdoptionEvidence,
): FragmentClassification {
  // Kiểm tra `proj-` TRƯỚC: isLegacyFileHistoryId là type guard
  // (`id is string`) nên nhánh false của nó thu hẹp chainId: string
  // thành never — không gọi startsWith sau nó được (tsc TS2339).
  if (chainId.startsWith("proj-")) {
    // Chuỗi proj- không có tín hiệu tên file: chỉ quy kết được bằng hash nội dung.
    if (contentHashMatches(chainId, evidence)) {
      return { verdict: "certain", reason: "content-hash-match-proj" };
    }
    return { verdict: "unrelated", reason: "no-signal" };
  }
  if (isLegacyFileHistoryId(chainId)) {
    if (contentHashMatches(chainId, evidence)) {
      const renamed = !!fileName && !legacyFileChainMatchesName(chainId, fileName);
      return {
        verdict: "certain",
        reason: renamed ? "content-hash-match-renamed" : "content-hash-match",
      };
    }
    if (fileName && legacyFileChainMatchesName(chainId, fileName)) {
      if (!evidence.openedSpecHash) {
        return { verdict: "ambiguous", reason: "ambiguous-no-content-evidence" };
      }
      if (!evidence.specNonTrivial) {
        return { verdict: "ambiguous", reason: "ambiguous-trivial-spec" };
      }
      return { verdict: "ambiguous", reason: "ambiguous-name-only-hash-mismatch" };
    }
    return { verdict: "unrelated", reason: "no-signal" };
  }
  return { verdict: "unrelated", reason: "not-legacy" };
}
