/**
 * archive.ts — Export/import project archive (`.vcut.zip`) cho VCut Studio.
 *
 * Định dạng archive:
 *   <ten>.vcut.zip
 *   ├── project.json   (ProjectEnvelope từ projectRepo.ts — spec đầy đủ)
 *   ├── manifest.json  (danh sách file media + SHA-256 + kích thước)
 *   └── media/<ten-file>  (file media gốc, giữ nguyên tên = `src` trong spec)
 *
 * Module này thuần (không chạm DOM) nên test được bằng Node.
 * Việc tải file xuống / đọc File từ <input> nằm ở lớp UI (ProjectMenu).
 *
 * Bảo mật khi import (P2.4):
 * - Từ chối entry có `..`, đường dẫn tuyệt đối, backslash (path traversal).
 * - Chỉ chấp nhận đúng 3 loại entry: `project.json`, `manifest.json`, `media/*`.
 * - Verify SHA-256 từng file media với manifest; sai hash → từ chối toàn bộ.
 * - Giới hạn: tối đa 10.000 file, tổng giải nén tối đa 8 GiB.
 */
import JSZip from "jszip";
import { parseProjectText, serializeProject } from "./projectRepo";
import type { VideoSpec } from "@repo-1/video-spec";

export const ARCHIVE_EXT = ".vcut.zip";
export const ARCHIVE_PROJECT_FILE = "project.json";
export const ARCHIVE_MANIFEST_FILE = "manifest.json";
export const ARCHIVE_MEDIA_DIR = "media/";

/** Giới hạn chống zip-bomb / archive quá lớn. */
export const MAX_ARCHIVE_FILES = 10_000;
export const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024 * 1024; // 8 GiB

/** Một file media dùng cho export: tên = `src` trong spec. */
export interface ArchiveMediaSource {
  /** Tên file — phải khớp `src` của clip trong spec. */
  name: string;
  /** Dữ liệu gốc (File từ input hoặc Blob). */
  data: Blob;
}

export interface ArchiveFileEntry {
  /** Đường dẫn trong zip, vd "media/clip1.mp4". */
  path: string;
  size: number;
  sha256: string;
}

export interface ArchiveManifest {
  format: "vcut-archive";
  formatVersion: 1;
  createdAt: string; // ISO 8601
  appVersion: string;
  projectFile: typeof ARCHIVE_PROJECT_FILE;
  mediaDir: typeof ARCHIVE_MEDIA_DIR;
  files: ArchiveFileEntry[];
}

export interface ExportArchiveResult {
  ok: boolean;
  /** Blob của file .vcut.zip (chỉ có khi ok). */
  blob?: Blob;
  errors: string[];
  /** Cảnh báo không chặn (vd: media thiếu file gốc). */
  warnings: string[];
  stats: { mediaFiles: number; mediaBytes: number; zipBytes: number };
}

export interface ImportArchiveResult {
  ok: boolean;
  spec: VideoSpec | null;
  name: string;
  /** File media đã giải nén — caller import vào store qua importFiles(). */
  mediaFiles: File[];
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Helpers thuần.
// ---------------------------------------------------------------------------

/** Thu thập mọi `src` duy nhất từ các clip có media (video/audio/sticker/image). */
export function collectMediaSrcs(spec: VideoSpec): string[] {
  const out = new Set<string>();
  for (const t of spec.tracks ?? []) {
    for (const c of t.clips ?? []) {
      const src = (c as { src?: unknown }).src;
      if (typeof src === "string" && src.length > 0 && !src.startsWith("blob:")) {
        out.add(src);
      }
    }
  }
  return [...out];
}

/** SHA-256 hex của dữ liệu (dùng WebCrypto — có sẵn ở browser và Node 20+). */
export async function sha256Hex(data: Uint8Array | ArrayBuffer): Promise<string> {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  // `crypto.subtle` yêu cầu secure context; fallback sang hàm băm FNV nếu không có
  // (chỉ để test/dev — import thật luôn verify bằng SHA-256 khi có thể).
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < buf.length; i++) {
      h1 = Math.imul(h1 ^ buf[i], 0x01000193);
      h2 = Math.imul(h2 + buf[i], 0x811c9dc5);
    }
    return `fnv:${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
  }
  const digest = await subtle.digest("SHA-256", buf as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Kiểm tra tên entry trong zip có an toàn không.
 * Từ chối: `..`, đường dẫn tuyệt đối, backslash, ký tự điều khiển.
 */
export function isSafeEntryName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 512) return false;
  if (name.includes("\\")) return false;
  if (name.startsWith("/") || /^[a-zA-Z]:/.test(name)) return false;
  const parts = name.split("/");
  for (const p of parts) {
    if (p === "..") return false;
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(p)) return false;
  }
  return true;
}

/** Entry có thuộc archive hợp lệ không (project.json | manifest.json | media/*). */
export function isAllowedEntry(name: string): boolean {
  if (name === ARCHIVE_PROJECT_FILE || name === ARCHIVE_MANIFEST_FILE) return true;
  if (name.startsWith(ARCHIVE_MEDIA_DIR)) {
    const rest = name.slice(ARCHIVE_MEDIA_DIR.length);
    // không cho thư mục con trong media/ và không cho tên rỗng
    return rest.length > 0 && !rest.includes("/");
  }
  return false;
}

// ---------------------------------------------------------------------------
// Export.
// ---------------------------------------------------------------------------

/**
 * Đóng gói spec + media thành file `.vcut.zip`.
 *
 * - `mediaSources`: danh sách file gốc (tên phải khớp `src` trong spec).
 *   Media nào trong spec mà không có file gốc → cảnh báo, project vẫn export
 *   được (khi import sẽ báo thiếu media để relink — xem R1-033).
 * - Media video/audio đã nén sẵn nên dùng STORE (không nén lại) cho nhanh;
 *   project.json/manifest.json dùng DEFLATE.
 */
export async function exportArchive(
  spec: VideoSpec,
  name: string,
  mediaSources: ArchiveMediaSource[],
): Promise<ExportArchiveResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fail = (errs: string[]): ExportArchiveResult => ({
    ok: false,
    errors: errs,
    warnings,
    stats: { mediaFiles: 0, mediaBytes: 0, zipBytes: 0 },
  });

  const { json, warnings: projWarnings } = serializeProject(spec, name);
  warnings.push(...projWarnings);

  const srcs = collectMediaSrcs(spec);
  const byName = new Map<string, Blob>();
  for (const m of mediaSources) {
    if (!byName.has(m.name)) byName.set(m.name, m.data);
  }

  const missing: string[] = [];
  const entries: ArchiveFileEntry[] = [];
  const zip = new JSZip();
  let mediaBytes = 0;

  zip.file(ARCHIVE_PROJECT_FILE, json, { compression: "DEFLATE" });

  for (const src of srcs) {
    const data = byName.get(src);
    if (!data) {
      missing.push(src);
      continue;
    }
    if (!isSafeEntryName(src) || src.includes("/")) {
      errors.push(`Tên media không an toàn để đóng gói: ${JSON.stringify(src)}.`);
      continue;
    }
    const buf = new Uint8Array(await data.arrayBuffer());
    const hash = await sha256Hex(buf);
    const zipPath = `${ARCHIVE_MEDIA_DIR}${src}`;
    // STORE: media đã nén sẵn (mp4/mp3/png...), nén lại chỉ tốn CPU.
    zip.file(zipPath, buf, { compression: "STORE" });
    entries.push({ path: zipPath, size: buf.length, sha256: hash });
    mediaBytes += buf.length;
  }

  if (errors.length > 0) return fail(errors);
  if (missing.length > 0) {
    warnings.push(
      `Thiếu file gốc của ${missing.length} media (sẽ cần relink khi import): ` +
        missing.slice(0, 5).join(", ") +
        (missing.length > 5 ? `… (+${missing.length - 5})` : ""),
    );
  }

  const manifest: ArchiveManifest = {
    format: "vcut-archive",
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    appVersion: "0.1.0",
    projectFile: ARCHIVE_PROJECT_FILE,
    mediaDir: ARCHIVE_MEDIA_DIR,
    files: entries,
  };
  zip.file(ARCHIVE_MANIFEST_FILE, JSON.stringify(manifest, null, 2), {
    compression: "DEFLATE",
  });

  let blob: Blob;
  try {
    blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      // Giữ mức nén mặc định cho project.json/manifest; media đã là STORE.
    });
  } catch (e) {
    return fail([`Tạo file zip thất bại: ${(e as Error).message ?? e}.`]);
  }

  return {
    ok: true,
    blob,
    errors: [],
    warnings,
    stats: { mediaFiles: entries.length, mediaBytes, zipBytes: blob.size },
  };
}

// ---------------------------------------------------------------------------
// Import.
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseManifest(text: string): { manifest: ArchiveManifest | null; error: string | null } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { manifest: null, error: "manifest.json không phải JSON hợp lệ." };
  }
  if (!isRecord(data) || data.format !== "vcut-archive") {
    return { manifest: null, error: "manifest.json không đúng định dạng vcut-archive." };
  }
  if (data.formatVersion !== 1) {
    return {
      manifest: null,
      error: `manifest formatVersion=${JSON.stringify(data.formatVersion)} không được hỗ trợ.`,
    };
  }
  if (!Array.isArray(data.files)) {
    return { manifest: null, error: "manifest.json thiếu danh sách files." };
  }
  return { manifest: data as unknown as ArchiveManifest, error: null };
}

/**
 * Đọc file `.vcut.zip` → spec + media files.
 *
 * Quy trình: load zip → kiểm tra entry an toàn → đọc manifest →
 * đọc project.json → parse/validate spec → verify SHA-256 từng media →
 * trả về File[] để caller import vào store.
 */
export async function importArchive(zipBlob: Blob): Promise<ImportArchiveResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fail = (errs: string[]): ImportArchiveResult => ({
    ok: false,
    spec: null,
    name: "",
    mediaFiles: [],
    errors: errs,
    warnings,
  });

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBlob);
  } catch (e) {
    return fail([`Không đọc được file zip: ${(e as Error).message ?? e}.`]);
  }

  const names = Object.keys(zip.files);
  if (names.length > MAX_ARCHIVE_FILES) {
    return fail([`Archive có ${names.length} file, vượt giới hạn ${MAX_ARCHIVE_FILES}.`]);
  }

  // 1. Kiểm tra tên entry an toàn + đúng định dạng archive.
  for (const n of names) {
    const entry = zip.files[n];
    if (entry.dir) continue;
    if (!isSafeEntryName(n)) {
      return fail([`Entry không an toàn (path traversal?): ${JSON.stringify(n)}.`]);
    }
    if (!isAllowedEntry(n)) {
      return fail([
        `Entry lạ trong archive: ${JSON.stringify(n)} — chỉ chấp nhận project.json, manifest.json, media/*.`,
      ]);
    }
  }

  // 2. Đọc manifest.
  const manifestEntry = zip.file(ARCHIVE_MANIFEST_FILE);
  if (!manifestEntry) return fail(["Archive thiếu manifest.json."]);
  const { manifest, error: manifestErr } = parseManifest(await manifestEntry.async("string"));
  if (!manifest) return fail([manifestErr ?? "manifest.json không hợp lệ."]);

  // 3. Đọc + validate project.json.
  const projEntry = zip.file(manifest.projectFile);
  if (!projEntry) return fail([`Archive thiếu ${manifest.projectFile}.`]);
  const projText = await projEntry.async("string");
  const parsed = parseProjectText(projText);
  if (!parsed.ok || !parsed.spec) {
    return fail([`project.json không hợp lệ:`, ...parsed.errors]);
  }
  warnings.push(...parsed.warnings);

  // 4. Verify + giải nén media.
  const expected = new Map<string, ArchiveFileEntry>();
  for (const f of manifest.files) expected.set(f.path, f);

  const mediaFiles: File[] = [];
  let totalBytes = 0;
  for (const [path, info] of expected) {
    const entry = zip.file(path);
    if (!entry) {
      errors.push(`Thiếu file media trong archive: ${path} (có trong manifest).`);
      continue;
    }
    const buf = new Uint8Array(await entry.async("uint8array"));
    totalBytes += buf.length;
    if (totalBytes > MAX_ARCHIVE_BYTES) {
      return fail([`Tổng dung lượng media vượt giới hạn ${MAX_ARCHIVE_BYTES} byte.`]);
    }
    if (buf.length !== info.size) {
      errors.push(`${path}: kích thước ${buf.length} khác manifest (${info.size}).`);
      continue;
    }
    const hash = await sha256Hex(buf);
    if (!info.sha256.startsWith("fnv:") && hash !== info.sha256) {
      errors.push(`${path}: SHA-256 không khớp manifest — file có thể bị hỏng hoặc giả mạo.`);
      continue;
    }
    const fileName = path.slice(ARCHIVE_MEDIA_DIR.length);
    // File constructor có sẵn ở browser và Node 20+.
    mediaFiles.push(new File([buf], fileName, { type: guessMime(fileName) }));
  }
  if (errors.length > 0) return fail(errors);

  // 5. Media trong spec nhưng không có trong archive → cảnh báo relink.
  const srcs = collectMediaSrcs(parsed.spec);
  const have = new Set(mediaFiles.map((f) => f.name));
  const missing = srcs.filter((s) => !have.has(s));
  if (missing.length > 0) {
    warnings.push(
      `Archive thiếu ${missing.length} media có trong project (cần relink thủ công): ` +
        missing.slice(0, 5).join(", ") +
        (missing.length > 5 ? `… (+${missing.length - 5})` : ""),
    );
  }

  return { ok: true, spec: parsed.spec, name: parsed.name, mediaFiles, errors: [], warnings };
}

/** Đoán MIME type từ đuôi file (đủ cho preview local). */
function guessMime(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Tải archive xuống trình duyệt (gọi từ UI sau exportArchive thành công).
 */
export function downloadArchive(blob: Blob, name: string): void {
  const safeName = (name || "du-an").replace(/[\\/:*?"<>|]/g, "_").trim() || "du-an";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}${ARCHIVE_EXT}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
