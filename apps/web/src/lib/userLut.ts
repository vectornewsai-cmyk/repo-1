/**
 * userLut.ts — LUT .cube do user tự nhập + phát hiện sticker động.
 *
 * K3 (Phase 6): cho phép user nhập file .cube tự chế vào LutPicker và dùng
 * như LUT thường khi render. Khác LUT hệ thống ở chỗ:
 * - Id luôn có prefix `user-` (không đè được LUT hệ thống).
 * - File .cube KHÔNG nằm trong assets/filters/ mà được lưu vào IndexedDB
 *   (DB riêng `vcut-user-luts`) và upload kèm theo spec lúc export với tên
 *   dành riêng `__lut_<id>.cube` — render worker resolve từ mediaDir.
 * - LUT nhập chỉ có hiệu lực trong app này (theo trình duyệt/profile),
 *   không đi kèm project khi mở project ở máy khác trừ khi nhập lại file.
 *
 * Xem giới hạn đầy đủ: ./USERLUT_LIMITS.md
 */

/** Kích thước file .cube tối đa chấp nhận (10MB theo brief K3). */
export const MAX_CUBE_BYTES = 10 * 1024 * 1024;

/** LUT_3D_SIZE cho phép: 2..256 (file size^3 dòng, 256^3 ≈ 16.7M dòng là trần thực tế). */
const CUBE_SIZE_MIN = 2;
const CUBE_SIZE_MAX = 256;

/** Kết quả parse .cube hợp lệ. */
export interface ParsedCube {
  /** Tiêu đề từ dòng TITLE (nếu có). */
  title?: string;
  /** Kích thước lưới 3D. */
  size: number;
  /** DOMAIN_MIN (mặc định [0,0,0]). */
  domainMin: [number, number, number];
  /** DOMAIN_MAX (mặc định [1,1,1]). */
  domainMax: [number, number, number];
  /** Số dòng dữ liệu (phải = size^3). */
  rows: number;
}

/** Metadata một LUT user đã nhập (lưu trong IndexedDB). */
export interface UserLutMeta {
  /** Id dạng `user-<slug>`, dùng làm clip.filter.lut. */
  id: string;
  /** Tên hiển thị (TITLE trong file, hoặc tên file). */
  label: string;
  /** Kích thước lưới 3D. */
  size: number;
  /** Thời điểm nhập (ms epoch). */
  addedAt: number;
}

/** Một LUT user đầy đủ (meta + nội dung file gốc). */
export interface UserLut extends UserLutMeta {
  /** Nội dung .cube gốc (giữ nguyên để upload lúc export). */
  text: string;
}

/** Id LUT user hợp lệ: `user-` + slug an toàn cho tên file. */
export function isUserLutId(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^user-[a-z0-9][a-z0-9-]*$/.test(v) &&
    v.length <= 64
  );
}

/** Tên file dành riêng khi upload LUT user lên bridge (khớp render worker). */
export function userLutFileName(id: string): string {
  return `__lut_${id}.cube`;
}

/** Tạo id từ tên file: `user-` + slug kebab-case (tối đa 48 ký tự). */
export function userLutIdFromName(filename: string): string {
  const base = filename.replace(/\.[^.]*$/, "");
  const slug = base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `user-${slug || "lut"}`;
}

function parseTriple(
  parts: string[],
  what: string,
): [number, number, number] {
  if (parts.length !== 3) {
    throw new Error(`${what} phải có đúng 3 số (nhận được: ${parts.join(" ")})`);
  }
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) {
    throw new Error(`${what} chứa số không hợp lệ: ${parts.join(" ")}`);
  }
  return nums as [number, number, number];
}

/**
 * Parse + validate nội dung file .cube (Adobe IRIDAS Cube, chỉ LUT 3D).
 * Ném Error với thông báo rõ ràng khi file sai định dạng.
 */
export function parseCube(text: string, byteSize: number): ParsedCube {
  if (byteSize > MAX_CUBE_BYTES) {
    throw new Error(
      `File .cube quá lớn (${(byteSize / 1024 / 1024).toFixed(1)}MB, tối đa 10MB).`,
    );
  }
  if (byteSize === 0 || text.trim().length === 0) {
    throw new Error("File .cube rỗng.");
  }
  let title: string | undefined;
  let size: number | undefined;
  let domainMin: [number, number, number] = [0, 0, 0];
  let domainMax: [number, number, number] = [1, 1, 1];
  let rows = 0;
  let sawData = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const [key, ...rest] = line.split(/\s+/);
    if (!sawData && key === "TITLE") {
      // TITLE có thể chứa khoảng trắng: lấy phần sau từ khóa gốc.
      const m = rawLine.match(/TITLE\s+(.*)/);
      title = (m?.[1] ?? "").trim().replace(/^"(.*)"$/, "$1") || undefined;
      continue;
    }
    if (!sawData && key === "LUT_3D_SIZE") {
      const n = Number(rest[0]);
      if (!Number.isInteger(n) || n < CUBE_SIZE_MIN || n > CUBE_SIZE_MAX) {
        throw new Error(
          `LUT_3D_SIZE không hợp lệ: ${rest[0]} (cần số nguyên ${CUBE_SIZE_MIN}..${CUBE_SIZE_MAX}).`,
        );
      }
      if (size !== undefined) throw new Error("File có 2 dòng LUT_3D_SIZE.");
      size = n;
      continue;
    }
    if (!sawData && key === "LUT_1D_SIZE") {
      throw new Error(
        "Chỉ hỗ trợ LUT 3D (LUT_3D_SIZE). File LUT 1D chưa được hỗ trợ.",
      );
    }
    if (!sawData && key === "DOMAIN_MIN") {
      domainMin = parseTriple(rest, "DOMAIN_MIN");
      continue;
    }
    if (!sawData && key === "DOMAIN_MAX") {
      domainMax = parseTriple(rest, "DOMAIN_MAX");
      continue;
    }
    // Dòng dữ liệu: đúng 3 số thực.
    const parts = line.split(/\s+/);
    if (parts.length !== 3) {
      throw new Error(
        `Dòng dữ liệu sai định dạng (cần đúng 3 số): "${line.slice(0, 60)}"`,
      );
    }
    const nums = parts.map(Number);
    if (nums.some((n) => !Number.isFinite(n) || n < -1 || n > 2)) {
      throw new Error(
        `Giá trị màu ngoài khoảng cho phép (-1..2): "${line.slice(0, 60)}"`,
      );
    }
    sawData = true;
    rows += 1;
  }

  if (size === undefined) {
    throw new Error("Thiếu dòng LUT_3D_SIZE trong file .cube.");
  }
  const expected = size * size * size;
  if (rows !== expected) {
    throw new Error(
      `Số dòng dữ liệu không khớp LUT_3D_SIZE ${size}: có ${rows} dòng, cần ${expected} dòng.`,
    );
  }
  return { title, size, domainMin, domainMax, rows };
}

// ---------------------------------------------------------------------------
// Lưu trữ IndexedDB (DB riêng, không dùng chung AssetStore để tránh lẫn
// media timeline — LUT user chỉ là file đính kèm lúc export).
// ---------------------------------------------------------------------------

const DB_NAME = "vcut-user-luts";
const STORE = "luts";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
    t.onerror = () => reject(t.error);
  });
}

/** Lưu (hoặc ghi đè cùng id) một LUT user. Trả về meta đã lưu. */
export async function saveUserLut(
  id: string,
  label: string,
  parsed: ParsedCube,
  text: string,
): Promise<UserLutMeta> {
  const meta: UserLutMeta = {
    id,
    label,
    size: parsed.size,
    addedAt: Date.now(),
  };
  const db = await openDb();
  await tx(db, "readwrite", (s) => s.put({ ...meta, text }));
  return meta;
}

/** Liệt kê mọi LUT user đã lưu (chỉ meta, không nạp nội dung). */
export async function listUserLuts(): Promise<UserLutMeta[]> {
  const db = await openDb();
  const all = await tx<UserLut[]>(db, "readonly", (s) => s.getAll());
  return all
    .map(({ id, label, size, addedAt }) => ({ id, label, size, addedAt }))
    .sort((a, b) => b.addedAt - a.addedAt);
}

/** Lấy một LUT user kèm nội dung file (để upload lúc export). */
export async function getUserLut(id: string): Promise<UserLut | null> {
  const db = await openDb();
  const row = await tx<UserLut | undefined>(db, "readonly", (s) => s.get(id));
  return row ?? null;
}

/** Xóa một LUT user. */
export async function deleteUserLut(id: string): Promise<void> {
  const db = await openDb();
  await tx(db, "readwrite", (s) => s.delete(id));
}

// ---------------------------------------------------------------------------
// Phát hiện sticker động (WebP/APNG) — đọc magic + chunk marker.
// ---------------------------------------------------------------------------

export interface AnimatedInfo {
  /** Định dạng nhận diện được: webp | apng | png (tĩnh) | gif | unknown */
  format: "webp" | "apng" | "png" | "gif" | "unknown";
  /** true nếu file chứa nhiều frame (động). */
  animated: boolean;
}

/**
 * Đọc header file ảnh, trả về định dạng + có động hay không.
 * - WebP động: RIFF/WEBP + chunk "ANMF" trong file.
 * - APNG: chữ ký PNG + chunk "acTL" trước IDAT đầu tiên.
 * - GIF: chỉ nhận diện định dạng (ngoài phạm vi K3).
 * Đọc tối đa toàn bộ file (sticker thường < 10MB); file > 32MB thì chỉ
 * quét 32MB đầu (đủ cho marker vì chunk animation nằm gần đầu file).
 */
export async function detectAnimatedImage(file: Blob): Promise<AnimatedInfo> {
  const head = new Uint8Array(await file.slice(0, 32 * 1024 * 1024).arrayBuffer());
  const ascii = (off: number, len: number) =>
    String.fromCharCode(...head.slice(off, off + len));
  const contains = (needle: string): boolean => {
    const n = new TextEncoder().encode(needle);
    outer: for (let i = 0; i + n.length <= head.length; i++) {
      for (let j = 0; j < n.length; j++) {
        if (head[i + j] !== n[j]) continue outer;
      }
      return true;
    }
    return false;
  };

  if (head.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return { format: "webp", animated: contains("ANMF") };
  }
  if (
    head.length >= 8 &&
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47
  ) {
    // APNG = PNG + chunk acTL; PNG tĩnh không có acTL.
    return { format: "apng", animated: contains("acTL") };
  }
  if (head.length >= 6 && (ascii(0, 6) === "GIF89a" || ascii(0, 6) === "GIF87a")) {
    // GIF ngoài phạm vi K3: chỉ nhận diện định dạng, không kết luận động/tĩnh
    // (GIF89a một frame vẫn hợp lệ và render như ảnh tĩnh).
    return { format: "gif", animated: false };
  }
  return { format: "unknown", animated: false };
}
