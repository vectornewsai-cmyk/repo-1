/**
 * codecProbe.ts — Phase 9 đợt 74, luồng B3 (đóng nợ đợt 73 §4 mục 7, A7 §4.3 S5).
 *
 * Vấn đề (A7): import chấp nhận `video/*` mà không có codec-probe nào —
 * file VP9/WebM/AV1/HEVC của user có thể không phát được trên trình duyệt
 * hiện tại (đặc biệt Safari cũ: VP9/WebM cần Safari ≥ 14.1, AV1 cần
 * Safari 17+), nhưng clip vẫn import "thành công" rồi chết lặng lúc
 * preview (probeVideo trong media.ts lỗi → item giữ duration 0, không
 * một lời cảnh báo nào).
 *
 * Module này probe TRƯỚC khi phát, bằng chính API của trình duyệt:
 *  - `HTMLVideoElement.canPlayType` (element playback = đúng đường
 *    preview dùng) — nguồn duy nhất quyết định verdict.
 *  - `MediaSource.isTypeSupported` — chỉ ghi vào kết quả để chẩn đoán
 *    (MSE ≠ element playback, vd Safari phát được HEVC bằng element
 *    nhưng MSE có thể khác) — KHÔNG đổi verdict.
 *  - Sniff header file (MP4 stsd / WebM EBML CodecID) để biết codec
 *    thật thay vì đoán theo đuôi file: file MP4 có thể là H.264, HEVC
 *    hay AV1 — probe sai codec là báo sai. Sniff thất bại → fallback
 *    probe mọi ứng viên của container, verdict lấy tín hiệu tốt nhất
 *    (chỉ dùng để QUYẾT "unsupported" khi mọi ứng viên đều ""; xem
 *    `probeCodecSupport`).
 *
 * Không có bảng phiên bản trình duyệt hard-code: kết quả là lời của
 * trình duyệt đang chạy, nên đúng cả trên Safari thật khi có máy đo.
 * Hàm thuần (`probeCodecSupport`, `sniffMp4Codec`, `sniffWebmCodec`)
 * test được bằng Node, không cần DOM. Adapter `probeImportedFileCodec`
 * chạy ở trình duyệt, không bao giờ throw (fail-open: lỗi → null,
 * import tiếp tục lặng lẽ như cũ).
 *
 * Kiểm chứng: apps/web/src/lib/codecProbe74B3.test.ts (hàm thuần) +
 * headed Chromium 1254 (xem docs/PHASE9_ROUND74_B3_SAFARI_CODEC_PROBE_LIMITS.md).
 */

/** Kết quả probe cho 1 file import. */
export type CodecVerdict = "supported" | "maybe" | "unsupported";

export interface CodecProbeEnv {
  canPlayType(mime: string): string;
  isTypeSupported?(mime: string): boolean;
}

export interface TriedCandidate {
  mime: string;
  canPlayType: "" | "maybe" | "probably" | string;
  /** MediaSource.isTypeSupported — null khi API vắng. Chỉ chẩn đoán. */
  mse: boolean | null;
  /** true khi ứng viên này là codec đã sniff được (quyết định verdict). */
  decisive: boolean;
}

export interface CodecProbeResult {
  verdict: CodecVerdict;
  /** Container suy ra từ đuôi file / file.type: "webm" | "mp4" | ... */
  container: string;
  /** Codec đã sniff / suy ra, vd "VP9", "HEVC", "AV1", "H.264". */
  codec: string;
  /** Nhãn gọn cho toast/UI, vd "VP9 / WebM", "HEVC / MP4", "không rõ / MP4". */
  codecLabel: string;
  /** MIME đã probe để quyết định verdict. */
  probedMime: string;
  canPlayType: "" | "maybe" | "probably" | string;
  /** MediaSource.isTypeSupported cho probedMime — null khi API vắng. */
  mseSupported: boolean | null;
  /** Toàn bộ ứng viên đã thử (chẩn đoán / test). */
  tried: TriedCandidate[];
}

export type FileLike = { name: string; type: string };

/** Đuôi file, thường hoá (không dấu chấm, chữ thường). */
export function extensionOfFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Sniff header
// ---------------------------------------------------------------------------

function readU32(bytes: Uint8Array, off: number): number {
  return (
    ((bytes[off] ?? 0) << 24) |
    ((bytes[off + 1] ?? 0) << 16) |
    ((bytes[off + 2] ?? 0) << 8) |
    (bytes[off + 3] ?? 0)
  ) >>> 0;
}

function readAscii(bytes: Uint8Array, off: number, len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += String.fromCharCode(bytes[off + i] ?? 0);
  return s;
}

const MP4_CODEC_TAG: Record<string, string> = {
  avc1: "avc1",
  avc3: "avc1",
  hvc1: "hevc",
  hev1: "hevc",
  dvh1: "hevc",
  dvav: "hevc",
  dvhe: "hevc",
  av01: "av1",
  mp4v: "mp4v",
  mp4a: "aac",
};

/**
 * Tìm sample-entry codec trong box `stsd` của MP4/MOV (ftyp/moov/trak/
 * mdia/minf/stbl/stsd). Trả tag chuẩn hoá ("avc1" | "hevc" | "av1" |
 * "mp4v" | "aac") hoặc null khi header thiếu / cắt / không parse được.
 * Chỉ quét trong `bytes` (caller cắt slice đầu file, vd 1 MiB) — moov
 * nằm sau mdat (file chưa faststart) thì trả null, không phải lỗi.
 */
export function sniffMp4Codec(bytes: Uint8Array): string | null {
  const found = findStsd(bytes, 0, bytes.length, 0);
  return found;
}

function findStsd(bytes: Uint8Array, start: number, end: number, depth: number): string | null {
  if (depth > 6) return null;
  let off = start;
  while (off + 8 <= end) {
    let size = readU32(bytes, off);
    const type = readAscii(bytes, off + 4, 4);
    let header = 8;
    if (size === 1) {
      // 64-bit largesize.
      if (off + 16 > end) return null;
      const hi = readU32(bytes, off + 8);
      const lo = readU32(bytes, off + 12);
      if (hi !== 0) return null; // box > 4 GiB — ngoài slice, bỏ.
      size = lo;
      header = 16;
    } else if (size === 0) {
      size = end - off;
    }
    if (size < header || off + size > end) return null;
    const payloadStart = off + header;
    const payloadEnd = off + size;
    if (type === "stsd") {
      // stsd: version/flags (4) + entry_count (4), entry đầu: size (4) +
      // format (4) — format nằm ở payload+12, không phải +8 (đó là size).
      if (payloadEnd - payloadStart < 16) return null;
      const format = readAscii(bytes, payloadStart + 12, 4);
      return MP4_CODEC_TAG[format] ?? null;
    }
    if (type === "moov" || type === "trak" || type === "mdia" || type === "minf" || type === "stbl") {
      const inner = findStsd(bytes, payloadStart, payloadEnd, depth + 1);
      if (inner) return inner;
    }
    off += size;
  }
  return null;
}

const WEBM_CODEC_ID: Array<[string, string]> = [
  ["V_VP9", "vp9"],
  ["V_VP8", "vp8"],
  ["V_AV1", "av1"],
  ["A_OPUS", "opus"],
  ["A_VORBIS", "vorbis"],
  ["A_AAC", "aac"],
];

/**
 * Tìm phần tử EBML CodecID (id 0x86) trong header WebM. Trả tag chuẩn hoá
 * ("vp9" | "vp8" | "av1" | "opus" | "vorbis" | "aac") hoặc null khi không
 * thấy / header cắt. Đọc đúng cấu trúc vint của EBML (không quét chuỗi
 * thô — tránh nhận nhầm "V_VP9" trong metadata/title).
 */
export function sniffWebmCodec(bytes: Uint8Array): string | null {
  for (let i = 0; i + 2 < bytes.length; i++) {
    if (bytes[i] !== 0x86) continue;
    // EBML vint: số bit 0 dẫn đầu của byte đầu = độ dài − 1.
    const first = bytes[i + 1] ?? 0;
    let len = 1;
    let mask = 0x80;
    while (len <= 8 && (first & mask) === 0) {
      mask >>= 1;
      len++;
    }
    if (len > 8 || i + 1 + len > bytes.length) continue;
    let size = first & (mask - 1);
    for (let j = 1; j < len; j++) size = (size << 8) | (bytes[i + 1 + j] ?? 0);
    if (size < 4 || size > 16) continue;
    const start = i + 1 + len;
    if (start + size > bytes.length) continue;
    const id = readAscii(bytes, start, size);
    for (const [text, tag] of WEBM_CODEC_ID) {
      if (id === text) return tag;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Ứng viên MIME
// ---------------------------------------------------------------------------

interface Candidate {
  mime: string;
  codec: string;
  decisive: boolean;
}

const CODEC_MIME: Record<string, { mime: string; label: string }> = {
  vp9: { mime: 'video/webm;codecs="vp9"', label: "VP9" },
  vp8: { mime: 'video/webm;codecs="vp8"', label: "VP8" },
  av1webm: { mime: 'video/webm;codecs="av1"', label: "AV1" },
  avc1: { mime: 'video/mp4;codecs="avc1.42E01E"', label: "H.264" },
  hevc: { mime: 'video/mp4;codecs="hev1.1.6.L93.B0"', label: "HEVC" },
  av1mp4: { mime: 'video/mp4;codecs="av01.0.05M.08"', label: "AV1" },
  mp4v: { mime: 'video/mp4;codecs="mp4v.20.3"', label: "MPEG-4" },
  opusWebm: { mime: 'audio/webm;codecs="opus"', label: "Opus" },
  vorbisWebm: { mime: 'audio/webm;codecs="vorbis"', label: "Vorbis" },
  aac: { mime: 'audio/mp4;codecs="mp4a.40.2"', label: "AAC" },
};

/**
 * Danh sách ứng viên theo container + codec đã sniff. `decisive` = ứng
 * viên của codec đã sniff được (chỉ nó quyết định verdict); không sniff
 * được thì mọi ứng viên đều không-decisive, verdict lấy tín hiệu tốt
 * nhất — "unsupported" chỉ khi TẤT CẢ đều "" (an toàn: không báo oan
 * file nào mà trình duyệt chơi được bằng một codec nào đó).
 */
export function candidateMimesFor(
  file: FileLike,
  sniffedCodec: string | null,
): { container: string; kind: "video" | "audio"; candidates: Candidate[] } | null {
  const ext = extensionOfFileName(file.name);
  const type = (file.type || "").toLowerCase();
  const isVideo =
    type.startsWith("video/") ||
    ["webm", "mp4", "m4v", "mov", "mkv", "avi", "ogv"].includes(ext);
  const isAudio =
    !isVideo &&
    (type.startsWith("audio/") ||
      ["mp3", "m4a", "aac", "ogg", "oga", "opus", "flac", "wav"].includes(ext));
  if (!isVideo && !isAudio) return null;

  const generic = (mime: string, label: string): Candidate => ({ mime, codec: label, decisive: false });
  const decisive = (key: string): Candidate => ({
    mime: CODEC_MIME[key]!.mime,
    codec: CODEC_MIME[key]!.label,
    decisive: true,
  });

  if (isVideo) {
    if (ext === "webm" || type === "video/webm") {
      if (sniffedCodec === "vp9") return { container: "webm", kind: "video", candidates: [decisive("vp9")] };
      if (sniffedCodec === "vp8") return { container: "webm", kind: "video", candidates: [decisive("vp8")] };
      if (sniffedCodec === "av1") return { container: "webm", kind: "video", candidates: [decisive("av1webm")] };
      if (sniffedCodec === "opus" || sniffedCodec === "vorbis")
        return { container: "webm", kind: "video", candidates: [generic("video/webm", "WebM")] };
      return {
        container: "webm",
        kind: "video",
        candidates: [decisive("vp9"), decisive("vp8"), generic("video/webm", "WebM")].map((c) => ({
          ...c,
          decisive: false,
        })),
      };
    }
    if (ext === "mp4" || ext === "m4v" || ext === "mov" || type === "video/mp4" || type === "video/quicktime") {
      const container = ext === "mov" || type === "video/quicktime" ? "mov" : "mp4";
      if (sniffedCodec === "avc1") return { container, kind: "video", candidates: [decisive("avc1")] };
      if (sniffedCodec === "hevc") return { container, kind: "video", candidates: [decisive("hevc")] };
      if (sniffedCodec === "av1") return { container, kind: "video", candidates: [decisive("av1mp4")] };
      if (sniffedCodec === "mp4v") return { container, kind: "video", candidates: [decisive("mp4v")] };
      return {
        container,
        kind: "video",
        candidates: [
          generic(CODEC_MIME.avc1.mime, "H.264"),
          generic(CODEC_MIME.hevc.mime, "HEVC"),
          generic(CODEC_MIME.av1mp4.mime, "AV1"),
          generic("video/mp4", "MP4"),
        ],
      };
    }
    if (ext === "mkv" || type === "video/x-matroska") {
      return {
        container: "mkv",
        kind: "video",
        candidates: [
          generic('video/x-matroska;codecs="vp9"', "VP9"),
          generic('video/x-matroska;codecs="avc1.42E01E"', "H.264"),
          generic("video/x-matroska", "Matroska"),
        ],
      };
    }
    if (ext === "ogv" || type === "video/ogg") {
      return {
        container: "ogv",
        kind: "video",
        candidates: [
          generic('video/ogg;codecs="theora"', "Theora"),
          generic("video/ogg", "Ogg"),
        ],
      };
    }
    if (ext === "avi" || type === "video/avi" || type === "video/x-msvideo") {
      return {
        container: "avi",
        kind: "video",
        candidates: [generic("video/avi", "AVI"), generic("video/x-msvideo", "AVI")],
      };
    }
    // Video lạ: chỉ còn file.type làm ứng viên chung.
    if (type.startsWith("video/")) {
      return { container: ext || "video", kind: "video", candidates: [generic(type, "Video")] };
    }
    return null;
  }

  // Audio.
  if (ext === "mp3" || type === "audio/mpeg") {
    return { container: "mp3", kind: "audio", candidates: [generic("audio/mpeg", "MP3")] };
  }
  if (ext === "m4a" || ext === "aac" || type === "audio/mp4" || type === "audio/aac") {
    if (sniffedCodec === "aac") return { container: "m4a", kind: "audio", candidates: [decisive("aac")] };
    return {
      container: "m4a",
      kind: "audio",
      candidates: [generic(CODEC_MIME.aac.mime, "AAC"), generic("audio/aac", "AAC"), generic("audio/mp4", "AAC")],
    };
  }
  if (ext === "ogg" || ext === "oga" || type === "audio/ogg") {
    return {
      container: "ogg",
      kind: "audio",
      candidates: [
        generic('audio/ogg;codecs="vorbis"', "Vorbis"),
        generic('audio/ogg;codecs="opus"', "Opus"),
        generic("audio/ogg", "Ogg"),
      ],
    };
  }
  if (ext === "opus") {
    return {
      container: "opus",
      kind: "audio",
      candidates: [generic('audio/ogg;codecs="opus"', "Opus"), generic(CODEC_MIME.opusWebm.mime, "Opus")],
    };
  }
  if (ext === "flac" || type === "audio/flac" || type === "audio/x-flac") {
    return { container: "flac", kind: "audio", candidates: [generic("audio/flac", "FLAC"), generic("audio/x-flac", "FLAC")] };
  }
  if (ext === "wav" || type === "audio/wav" || type === "audio/x-wav") {
    return {
      container: "wav",
      kind: "audio",
      candidates: [generic("audio/wav", "WAV"), generic("audio/x-wav", "WAV")],
    };
  }
  if (ext === "webm" || type === "audio/webm") {
    if (sniffedCodec === "opus") return { container: "webm", kind: "audio", candidates: [decisive("opusWebm")] };
    if (sniffedCodec === "vorbis") return { container: "webm", kind: "audio", candidates: [decisive("vorbisWebm")] };
    return {
      container: "webm",
      kind: "audio",
      candidates: [
        generic(CODEC_MIME.opusWebm.mime, "Opus"),
        generic(CODEC_MIME.vorbisWebm.mime, "Vorbis"),
        generic("audio/webm", "WebM"),
      ],
    };
  }
  if (ext === "mp4" || type === "audio/mp4") {
    return {
      container: "mp4",
      kind: "audio",
      candidates: [generic(CODEC_MIME.aac.mime, "AAC"), generic("audio/mp4", "AAC")],
    };
  }
  if (type.startsWith("audio/")) {
    return { container: ext || "audio", kind: "audio", candidates: [generic(type, "Audio")] };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Verdict thuần
// ---------------------------------------------------------------------------

function verdictOf(answer: string): CodecVerdict {
  if (answer === "probably") return "supported";
  if (answer === "maybe") return "maybe";
  return "unsupported";
}

function rankVerdict(v: CodecVerdict): number {
  return v === "supported" ? 2 : v === "maybe" ? 1 : 0;
}

/**
 * Probe thuần: cho file + codec đã sniff (null nếu không sniff được) +
 * env trình duyệt → verdict. Không chạm DOM, test được bằng Node.
 *
 * - Có codec decisive (sniff được): verdict theo ĐÚNG mime của codec
 *   đó — file HEVC mà trình duyệt không chơi HEVC thì "unsupported"
 *   dù H.264 có chơi được.
 * - Không sniff được: verdict = tốt nhất trong mọi ứng viên; chỉ
 *   "unsupported" khi tất cả đều "".
 * - MSE chỉ ghi nhận, không đổi verdict.
 */
export function probeCodecSupport(
  file: FileLike,
  sniffedCodec: string | null,
  env: CodecProbeEnv,
): CodecProbeResult | null {
  const plan = candidateMimesFor(file, sniffedCodec);
  if (!plan) return null;
  const tried: TriedCandidate[] = plan.candidates.map((c) => {
    let answer = "";
    try {
      answer = env.canPlayType(c.mime) ?? "";
    } catch {
      answer = "";
    }
    let mse: boolean | null = null;
    try {
      mse = typeof env.isTypeSupported === "function" ? env.isTypeSupported(c.mime) : null;
    } catch {
      mse = null;
    }
    return { mime: c.mime, canPlayType: answer, mse, decisive: c.decisive };
  });
  const decisive = tried.filter((t) => t.decisive);
  const pool = decisive.length > 0 ? decisive : tried;
  let best: TriedCandidate = pool[0]!;
  for (const t of pool) {
    if (rankVerdict(verdictOf(t.canPlayType)) > rankVerdict(verdictOf(best.canPlayType))) best = t;
  }
  const bestCandidate = plan.candidates.find((c) => c.mime === best.mime) ?? plan.candidates[0]!;
  const codec = bestCandidate.codec;
  return {
    verdict: verdictOf(best.canPlayType),
    container: plan.container,
    codec,
    codecLabel: `${codec} / ${plan.container.toUpperCase()}`,
    probedMime: best.mime,
    canPlayType: best.canPlayType,
    mseSupported: best.mse,
    tried,
  };
}

// ---------------------------------------------------------------------------
// Adapter trình duyệt
// ---------------------------------------------------------------------------

/**
 * Đợt 75 C6 — rút gọn danh sách tên file cho toast gộp (import nhiều
 * file không hỗ trợ cùng lúc): hiện tối đa `maxShown` tên đầu, phần còn
 * lại gộp thành `+N` (trung lập ngôn ngữ — chuỗi i18n nhận {names} đã
 * rút gọn này). 0 tên → ""; ≤ maxShown tên → nối bằng ", " như cũ.
 */
export function formatUnsupportedNameList(names: string[], maxShown = 3): string {
  if (names.length === 0) return "";
  const shown = names.slice(0, Math.max(1, maxShown));
  const extra = names.length - shown.length;
  const base = shown.join(", ");
  return extra > 0 ? `${base} +${extra}` : base;
}

/** Cắt đầu file để sniff codec (1 MiB đủ chứa ftyp+moov của file thường). */
export const CODEC_SNIFF_BYTES = 1024 * 1024;

/**
 * Probe 1 File user vừa chọn import. Đọc slice đầu để sniff codec
 * thật, rồi hỏi `canPlayType`/`MediaSource.isTypeSupported` của trình
 * duyệt đang chạy. Không bao giờ throw — lỗi nào (không DOM, đọc file
 * lỗi, API vắng) cũng trả null để import tiếp tục lặng lẽ như cũ.
 */
export async function probeImportedFileCodec(file: File): Promise<CodecProbeResult | null> {
  try {
    if (typeof document === "undefined") return null;
    const ext = extensionOfFileName(file.name);
    let sniffed: string | null = null;
    try {
      const head = new Uint8Array(await file.slice(0, CODEC_SNIFF_BYTES).arrayBuffer());
      if (ext === "webm") sniffed = sniffWebmCodec(head);
      else if (ext === "mp4" || ext === "m4v" || ext === "mov" || ext === "m4a") sniffed = sniffMp4Codec(head);
    } catch {
      sniffed = null;
    }
    const plan = candidateMimesFor(file, sniffed);
    if (!plan) return null;
    const el = document.createElement(plan.kind === "video" ? "video" : "audio");
    const env: CodecProbeEnv = {
      canPlayType: (mime: string) => {
        try {
          return el.canPlayType(mime);
        } catch {
          return "";
        }
      },
    };
    if (typeof MediaSource !== "undefined" && typeof MediaSource.isTypeSupported === "function") {
      env.isTypeSupported = (mime: string) => {
        try {
          return MediaSource.isTypeSupported(mime);
        } catch {
          return false;
        }
      };
    }
    return probeCodecSupport(file, sniffed, env);
  } catch {
    return null;
  }
}
