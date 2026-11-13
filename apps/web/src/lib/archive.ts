/**
 * archive.ts — Export/import project archive (`.vcut.zip`) cho VCut Studio.
 *
 * Định dạng archive:
 *   <ten>.vcut.zip
 *   ├── project.json   (ProjectEnvelope từ projectRepo.ts — spec đầy đủ)
 *   ├── manifest.json  (danh sách file media + SHA-256 + kích thước)
 *   ├── history.json   (TÙY CHỌN, đợt 67 U6: HistoryExport `vcut-history`
 *   │                   v1 — lịch sử phiên bản của project, để nhập sang
 *   │                   máy khác mang theo chuỗi lịch sử; archive cũ
 *   │                   không có file này vẫn nhập bình thường)
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
import { archiveMissingNote, parseProjectText, serializeProject } from "./projectRepo";
import { t } from "../i18n";
import type { VideoSpec } from "@repo-1/video-spec";
// Đợt 67 U6 — chỉ import TYPE (bị xóa lúc biên dịch) nên archive.ts vẫn
// chạy được bằng Node type-stripping/esbuild như cũ.
import type { HistoryExport } from "./projectHistory";

export const ARCHIVE_EXT = ".vcut.zip";
export const ARCHIVE_PROJECT_FILE = "project.json";
export const ARCHIVE_MANIFEST_FILE = "manifest.json";
/** Đợt 67 U6 — file lịch sử tùy chọn trong archive (xem history.json ở đầu file). */
export const ARCHIVE_HISTORY_FILE = "history.json";
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
  /**
   * Đợt 31 N4 — dạng cấu trúc của warnings từ serializeProject (hiện
   * chỉ blobUrl). Đợt 32 O4 — thêm note archiveMissingExport khi thiếu
   * file gốc. Tùy chọn như speedCurveWarnings: đường fail không đặt.
   * UI dịch qua key `structuredNotes.*`, chuỗi trong warnings giữ
   * nguyên để tương thích — UI trừ trùng bằng fallback (xem loadReport
   * .formatNoteLines).
   */
  structuredNotes?: import("./projectRepo").StructuredNote[];
  stats: { mediaFiles: number; mediaBytes: number; zipBytes: number };
}

export interface ImportArchiveResult {
  ok: boolean;
  spec: VideoSpec | null;
  name: string;
  /**
   * Đợt 63 R7 — projectId ổn định đọc từ project.json trong archive
   * (parseProjectText đã migration sinh mới khi archive cũ thiếu id).
   * Cổng fail đặt "" (không có project để nhận id).
   */
  projectId: string;
  /** File media đã giải nén — caller import vào store qua importFiles(). */
  mediaFiles: File[];
  /**
   * Đợt 67 U6 — lịch sử kèm trong archive (`history.json`, CHƯA kiểm
   * chứng ở đây — caller (openProjectFlow) kiểm qua
   * HistoryStore.importArchiveHistory rồi mới nhập; null/vắng khi
   * archive cũ không có history.json). Đặt `unknown` ở tầng transport
   * để archive lỗi định dạng không làm hỏng cả lần nhập archive.
   */
  history?: HistoryExport | null;
  /**
   * Đợt 67 U6 — lỗi khi đọc `history.json` (parse JSON hỏng / không
   * phải object): lịch sử bị bỏ qua nhưng archive vẫn nhập bình thường.
   * Chuỗi tiếng Việt trực tiếp (không qua key i18n) để panel/toast
   * hiện đúng nghĩa ngay cả trước khi parent gộp fragment.
   * Đợt 79 G9 — kèm mã `historyErrorCode` để caller dịch qua key
   * `openProject.archiveHistory*`; `historyError` giữ nguyên để test
   * A4/A5 (khóa nhắc "history.json") và archive cũ không vỡ.
   */
  historyError?: string;
  /** Đợt 79 G9 — mã lỗi history.json, song hành với `historyError`. */
  historyErrorCode?: "notObject" | "badJson";
  errors: string[];
  warnings: string[];
  /**
   * Đợt 27 K5: warnings speedKeyframes có cấu trúc từ parseProjectText
   * (trước đây importArchive nuốt mất — chỉ còn chuỗi trong warnings).
   * Tùy chọn để các đường fail cũ không phải sửa; panel load report
   * dùng trường này, vắng thì coi như rỗng.
   */
  speedCurveWarnings?: import("./projectRepo").SpeedCurveWarning[];
  /**
   * Đợt 31 N4 — dạng cấu trúc của warnings từ parseProjectText
   * (blob/migration/format/style), cùng mẫu speedCurveWarnings trên.
   */
  structuredNotes?: import("./projectRepo").StructuredNote[];
}

// ---------------------------------------------------------------------------
// Helpers thuần.
// ---------------------------------------------------------------------------

/**
 * Thu thập mọi `src` duy nhất từ các clip có media (video/audio/sticker/image).
 *
 * Đợt 32 P4 — đệ quy vào subSpec của clip nested (đóng nợ §3.2 của
 * LIMITS đợt 32 O4: trước đây chỉ quét clip cấp cao nên media trong
 * nested thiếu file gốc không được archive cảnh báo, dù cảnh báo blob
 * đã quét đệ quy từ O4). Cùng mẫu duyệt của findBlobWarningItems
 * (projectRepo.ts): pre-order, seen-set sao chép theo nhánh để subSpec
 * dùng chung ở 2 clip anh em vẫn quét đủ cả hai và subSpec tự trỏ lại
 * không treo. `blob:` vẫn loại như cũ (archive không đóng gói được
 * blob: URL — cảnh báo đó thuộc về save/load, không thuộc archive).
 * Hệ quả có chủ đích: stats export (mediaFiles/mediaBytes) và chuỗi
 * thiếu media nay tính cả src trong nested.
 */
export function collectMediaSrcs(spec: VideoSpec): string[] {
  const out = new Set<string>();
  const walk = (s: unknown, seen: Set<object>): void => {
    if (typeof s !== "object" || s === null || seen.has(s as object)) return;
    const chain = new Set(seen);
    chain.add(s as object);
    const tracks = (s as { tracks?: unknown }).tracks;
    if (!Array.isArray(tracks)) return;
    for (const t of tracks) {
      if (typeof t !== "object" || t === null || !Array.isArray((t as { clips?: unknown }).clips)) continue;
      for (const c of (t as { clips: unknown[] }).clips) {
        if (typeof c !== "object" || c === null) continue;
        const src = (c as { src?: unknown }).src;
        if (typeof src === "string" && src.length > 0 && !src.startsWith("blob:")) {
          out.add(src);
        }
        if ((c as { kind?: unknown }).kind === "nested") {
          const sub = (c as { subSpec?: unknown }).subSpec;
          if (typeof sub === "object" && sub !== null) walk(sub, chain);
        }
      }
    }
  };
  walk(spec, new Set());
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

/** Entry có thuộc archive hợp lệ không (project.json | manifest.json | history.json | media/*). */
export function isAllowedEntry(name: string): boolean {
  if (name === ARCHIVE_PROJECT_FILE || name === ARCHIVE_MANIFEST_FILE) return true;
  // Đợt 67 U6 — history.json là entry tùy chọn (lịch sử mang theo archive).
  if (name === ARCHIVE_HISTORY_FILE) return true;
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
  /**
   * Đợt 63 R7 — projectId ổn định để ghi vào project.json trong
   * archive (nhập lại archive giữ nguyên id của project gốc thay vì
   * sinh id mới). Không truyền = hành vi cũ (project.json thiếu id).
   */
  projectId?: string,
  /**
   * Đợt 67 U6 — lịch sử của project (HistoryExport `vcut-history` v1,
   * caller dựng bằng HistoryStore.exportHistory) để ghi kèm thành
   * `history.json` — nhập sang máy khác mang theo chuỗi lịch sử.
   * Không truyền / rỗng version → archive như cũ (không có history.json).
   */
  history?: HistoryExport | null,
): Promise<ExportArchiveResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fail = (errs: string[]): ExportArchiveResult => ({
    ok: false,
    errors: errs,
    warnings,
    stats: { mediaFiles: 0, mediaBytes: 0, zipBytes: 0 },
  });

  const { json, warnings: projWarnings, structuredNotes: projNotes } = serializeProject(spec, name, undefined, undefined, projectId, (k, vars) => t(k, vars));
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

  // Đợt 67 U6 — lịch sử đi kèm archive (để nhập sang máy khác mang theo
  // chuỗi lịch sử — đóng nợ đợt 66 T7 §5.2: trước đây lịch sử của file
  // gốc không đi theo `.vcut.zip`). Chỉ ghi khi có version thật; nội
  // dung file do caller dựng bằng HistoryStore.exportHistory nên đúng
  // định dạng `vcut-history` v1 (import kiểm chứng lại trước khi nhập).
  if (history && history.versions.length > 0) {
    zip.file(ARCHIVE_HISTORY_FILE, JSON.stringify(history, null, 2), { compression: "DEFLATE" });
  }

  for (const src of srcs) {
    const data = byName.get(src);
    if (!data) {
      missing.push(src);
      continue;
    }
    if (!isSafeEntryName(src) || src.includes("/")) {
      errors.push(t("archive.unsafeName", { name: JSON.stringify(src) }));
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
  // Đợt 32 O4 — thiếu media sang dạng cấu trúc (cùng thứ tự với warnings
  // chuỗi): note archiveMissingExport, fallback byte-identical với chuỗi
  // cũ để UI trừ trùng qua formatNoteLines/buildLoadReport.
  let archiveNote: import("./projectRepo").StructuredNote | undefined;
  if (missing.length > 0) {
    archiveNote = archiveMissingNote("export", missing);
    warnings.push(archiveNote.fallback);
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
    return fail([t("archive.zipFailed", { error: String((e as Error).message ?? e) })]);
  }

  return {
    ok: true,
    blob,
    errors: [],
    warnings,
    structuredNotes: archiveNote ? [...projNotes, archiveNote] : projNotes,
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
    return { manifest: null, error: t("archive.manifestNotJson") };
  }
  if (!isRecord(data) || data.format !== "vcut-archive") {
    return { manifest: null, error: t("archive.manifestBadFormat") };
  }
  if (data.formatVersion !== 1) {
    return {
      manifest: null,
      error: t("archive.manifestVersion", { version: JSON.stringify(data.formatVersion) }),
    };
  }
  if (!Array.isArray(data.files)) {
    return { manifest: null, error: t("archive.manifestNoFiles") };
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
    projectId: "",
    mediaFiles: [],
    errors: errs,
    warnings,
  });

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBlob);
  } catch (e) {
    return fail([t("archive.zipUnreadable", { error: String((e as Error).message ?? e) })]);
  }

  const names = Object.keys(zip.files);
  if (names.length > MAX_ARCHIVE_FILES) {
    return fail([t("archive.tooManyFiles", { n: String(names.length), limit: String(MAX_ARCHIVE_FILES) })]);
  }

  // 1. Kiểm tra tên entry an toàn + đúng định dạng archive.
  for (const n of names) {
    const entry = zip.files[n];
    if (entry.dir) continue;
    if (!isSafeEntryName(n)) {
      return fail([t("archive.unsafeEntry", { name: JSON.stringify(n) })]);
    }
    if (!isAllowedEntry(n)) {
      return fail([
        t("archive.unknownEntry", { name: JSON.stringify(n) }),
      ]);
    }
  }

  // 2. Đọc manifest.
  const manifestEntry = zip.file(ARCHIVE_MANIFEST_FILE);
  if (!manifestEntry) return fail([t("archive.noManifest")]);
  const { manifest, error: manifestErr } = parseManifest(await manifestEntry.async("string"));
  if (!manifest) return fail([manifestErr ?? t("archive.manifestInvalid")]);

  // 3. Đọc + validate project.json.
  const projEntry = zip.file(manifest.projectFile);
  if (!projEntry) return fail([t("archive.missingEntry", { name: manifest.projectFile })]);
  const projText = await projEntry.async("string");
  const parsed = parseProjectText(projText, t);
  if (!parsed.ok || !parsed.spec) {
    return fail([t("archive.projectJsonInvalid"), ...parsed.errors]);
  }
  warnings.push(...parsed.warnings);

  // 3b. Đợt 67 U6 — đọc lịch sử kèm theo (TÙY CHỌN, không chặn import):
  // history.json hỏng / sai dạng thì chỉ ghi historyError để caller bỏ
  // qua lịch sử; kiểm chứng đầy đủ (định dạng + projectId + hash từng
  // version) nằm ở HistoryStore.importArchiveHistory bên caller.
  let parsedHistory: HistoryExport | null = null;
  let historyError: string | undefined;
  let historyErrorCode: "notObject" | "badJson" | undefined;
  const historyEntry = zip.file(ARCHIVE_HISTORY_FILE);
  if (historyEntry) {
    try {
      const raw: unknown = JSON.parse(await historyEntry.async("string"));
      if (isRecord(raw) && !Array.isArray(raw)) parsedHistory = raw as unknown as HistoryExport;
      else {
        historyError = "File history.json trong bản nén không phải JSON object — bỏ qua lịch sử.";
        historyErrorCode = "notObject";
      }
    } catch {
      historyError = "File history.json trong bản nén không phải JSON hợp lệ — bỏ qua lịch sử.";
      historyErrorCode = "badJson";
    }
  }

  // 4. Verify + giải nén media.
  const expected = new Map<string, ArchiveFileEntry>();
  for (const f of manifest.files) expected.set(f.path, f);

  const mediaFiles: File[] = [];
  let totalBytes = 0;
  for (const [path, info] of expected) {
    const entry = zip.file(path);
    if (!entry) {
      errors.push(t("archive.missingMedia", { name: path }));
      continue;
    }
    const buf = new Uint8Array(await entry.async("uint8array"));
    totalBytes += buf.length;
    if (totalBytes > MAX_ARCHIVE_BYTES) {
      return fail([t("archive.mediaTooBig", { limit: String(MAX_ARCHIVE_BYTES) })]);
    }
    if (buf.length !== info.size) {
      errors.push(t("archive.sizeMismatch", { name: path, actual: String(buf.length), expected: String(info.size) }));
      continue;
    }
    const hash = await sha256Hex(buf);
    if (!info.sha256.startsWith("fnv:") && hash !== info.sha256) {
      errors.push(t("archive.shaMismatch", { name: path }));
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
  // Đợt 32 O4 — như export: note archiveMissingImport, fallback
  // byte-identical với chuỗi cũ; buildLoadReport trừ fallback nên panel
  // không hiện trùng, toast dịch qua key structuredNotes.*.
  const importNotes = [...(parsed.structuredNotes ?? [])];
  if (missing.length > 0) {
    const note = archiveMissingNote("import", missing);
    warnings.push(note.fallback);
    importNotes.push(note);
  }

  return { ok: true, spec: parsed.spec, name: parsed.name, projectId: parsed.projectId, mediaFiles, history: parsedHistory, historyError, historyErrorCode, errors: [], warnings, speedCurveWarnings: parsed.speedCurveWarnings, structuredNotes: importNotes };
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
