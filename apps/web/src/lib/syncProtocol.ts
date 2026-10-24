/**
 * syncProtocol.ts — Định nghĩa format đồng bộ project VCut (Phase 8 Q7).
 *
 * TRUNG THỰC — ĐỌC TRƯỚC KHI GỌI ĐÂY LÀ "CLOUD":
 * - Đây CHỈ là format + logic kiểm chứng phía client. KHÔNG có server cloud
 *   thật, KHÔNG có tài khoản, KHÔNG có đồng bộ tự động trong đợt này.
 * - Dữ liệu vẫn ở local (IndexedDB / file). Format này được thiết kế để khi
 *   có server sau này, client và server dùng chung một manifest mà không phải
 *   đổi format: server chỉ cần nhận bundle, kiểm tra checksum, lưu version.
 * - Chính sách merge v1: last-write-wins theo versionId, KHÔNG tự merge nội
 *   dung. Khi baseVersionId của client khác version mới nhất trên server thì
 *   server phải giữ cả hai version và báo conflict — không bao giờ ghi đè
 *   lặng lẽ (xem thêm docs/SYNC_PROTOCOL.md).
 *
 * Logic thuần (không DOM, không network) — test bằng Node type-stripping:
 *   node apps/web/src/lib/syncProtocol.test.ts
 */

// ---------------------------------------------------------------------------
// SHA-256 thuần TypeScript (không phụ thuộc WebCrypto async, chạy được cả
// Node lẫn trình duyệt). Implement chuẩn FIPS 180-4, test bằng vector chuẩn.
// ---------------------------------------------------------------------------

const SHA_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/** SHA-256 của chuỗi UTF-8 → hex lowercase (64 ký tự). */
export function sha256Hex(input: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < input.length) {
      const c2 = input.charCodeAt(i + 1);
      if (c2 >= 0xdc00 && c2 <= 0xdfff) {
        const cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
        i++;
      } else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 0xff);

  let [h0, h1, h2, h3, h4, h5, h6, h7] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const w = new Array<number>(64);
  for (let off = 0; off < bytes.length; off += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = ((bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) | (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3]) | 0;
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA_K[t] + w[t]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

// ---------------------------------------------------------------------------
// Sync manifest
// ---------------------------------------------------------------------------

export const SYNC_BUNDLE_VERSION = 1;

export interface SyncFileEntry {
  /** Đường dẫn tương đối trong bundle, vd "spec.json", "media/clip1.mp4". */
  path: string;
  /** Kích thước byte. */
  size: number;
  /** SHA-256 hex của nội dung file (đối với spec: của chuỗi JSON đã ổn định). */
  sha256: string;
}

export interface SyncManifest {
  format: "vcut-sync-bundle";
  bundleVersion: typeof SYNC_BUNDLE_VERSION;
  projectId: string;
  /** Version mà client dựa vào khi tạo bundle ("" nếu là version đầu tiên). */
  baseVersionId: string;
  /** Version mới mà bundle này tạo ra. */
  versionId: string;
  createdAt: string; // ISO 8601
  specHash: string; // hash ổn định của spec (dùng specHash của projectRepo khi có)
  files: SyncFileEntry[];
}

export interface SyncFileInput {
  path: string;
  /** Nội dung dạng chuỗi (spec JSON, text). File binary sau này hash ở tầng upload. */
  content: string;
}

/** Tạo manifest từ danh sách file + thông tin version. Không chạm network/DOM. */
export function buildManifest(args: {
  projectId: string;
  baseVersionId: string;
  versionId: string;
  specHash: string;
  files: SyncFileInput[];
  createdAt?: string;
}): SyncManifest {
  const seen = new Set<string>();
  const entries: SyncFileEntry[] = args.files.map((f) => {
    if (!f.path || f.path.startsWith("/") || f.path.includes("..")) {
      throw new Error(`Đường dẫn bundle không hợp lệ: ${JSON.stringify(f.path)}`);
    }
    if (seen.has(f.path)) throw new Error(`Trùng đường dẫn trong bundle: ${f.path}`);
    seen.add(f.path);
    return {
      path: f.path,
      size: new TextEncoder().encode(f.content).length,
      sha256: sha256Hex(f.content),
    };
  });
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    format: "vcut-sync-bundle",
    bundleVersion: SYNC_BUNDLE_VERSION,
    projectId: args.projectId,
    baseVersionId: args.baseVersionId,
    versionId: args.versionId,
    createdAt: args.createdAt ?? new Date().toISOString(),
    specHash: args.specHash,
    files: entries,
  };
}

/**
 * Kiểm chứng bundle: manifest khớp file thật (đủ file, đúng size, đúng hash).
 * Trả về danh sách lỗi; rỗng = bundle nguyên vẹn. Server tương lai dùng đúng
 * hàm này trước khi nhận version (không tin manifest tự khai).
 */
export function verifyManifest(manifest: SyncManifest, files: SyncFileInput[]): string[] {
  const errors: string[] = [];
  if (manifest.format !== "vcut-sync-bundle") errors.push("Sai format manifest.");
  if (manifest.bundleVersion !== SYNC_BUNDLE_VERSION) errors.push("Bundle version không hỗ trợ.");
  const byPath = new Map(files.map((f) => [f.path, f]));
  for (const e of manifest.files) {
    const f = byPath.get(e.path);
    if (!f) { errors.push(`Thiếu file: ${e.path}`); continue; }
    const size = new TextEncoder().encode(f.content).length;
    if (size !== e.size) errors.push(`Sai size: ${e.path} (khai ${e.size}, thật ${size})`);
    if (sha256Hex(f.content) !== e.sha256) errors.push(`Sai checksum: ${e.path}`);
  }
  for (const f of files) {
    if (!manifest.files.some((e) => e.path === f.path)) errors.push(`File thừa ngoài manifest: ${f.path}`);
  }
  return errors;
}

/**
 * Quyết định merge v1 (server tương lai): nếu baseVersionId của client bằng
 * version mới nhất trên server → nhận; khác → conflict, giữ cả hai, không
 * ghi đè. Trả về "accept" | "conflict".
 */
export function decideSync(baseVersionId: string, serverLatestVersionId: string): "accept" | "conflict" {
  return baseVersionId === serverLatestVersionId ? "accept" : "conflict";
}
