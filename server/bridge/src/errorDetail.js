/**
 * errorDetail.js — Lỗi render có ích mà KHÔNG leak (Phase 9 đợt 28, luồng L3).
 *
 * Bối cảnh (đợt 27 K2 §5): render worker nói RÕ (validate.js in cả đường
 * dẫn clip + keyframe + giá trị vi phạm), nhưng bridge cắt sạch stderr ở
 * jobQueue._onError nên API chỉ trả "Render worker thoát với mã 1.".
 * Module này là cửa duy nhất biến stderr thô thành "lỗi có cấu trúc":
 *   { code, summary, details, detailsOmitted, redactedTail }
 * mà bridge / CLI / MCP đều dùng chung (CLI và MCP load file này qua
 * createRequire, đúng mẫu cli/src/project.ts load validate.js — không
 * nhân bản logic phân loại sang TypeScript).
 *
 * NGUYÊN TẮC AN TOÀN (mặc định an toàn, opt-in mới thấy detail):
 *  - job.error (chuỗi cũ) KHÔNG ĐỔI — ExportPanel không xin detail vẫn
 *    nhận đúng thông báo cũ, không hồi quy.
 *  - errorDetail CHỈ xuất hiện trên API khi caller xin tường minh
 *    GET /api/render/:id?detail=1 (xem publicJob.js). Danh sách job
 *    (GET /api/render) không bao giờ kèm detail.
 *  - Mọi chuỗi đi vào errorDetail đều qua redactStderr() trước.
 *  - Log server (console.error trong _onError) vẫn giữ stderr thô vì đó
 *    là log local của chính máy chạy bridge, không phải kênh API.
 *
 * Không phụ thuộc bên ngoài (chỉ dùng node builtins).
 *
 * Đợt 34 Q4 — summary có cấu trúc (ADDITIVE, không vỡ contract cũ):
 * mỗi kết quả phân loại nay kèm thêm `summaryKey` + `summaryParams`
 * (toàn chuỗi đã redact, giá trị nào cũng là string). Web dịch khung
 * tóm tắt qua i18n key `errorDetail.summary.<summaryKey>` với params
 * đó; các dòng validator/ffmpeg thô vẫn là DỮ LIỆU (giữ nguyên trong
 * `details`/`redactedTail` và trong `summary` cũ) vì chúng không dịch
 * được trọn vẹn bằng template — chỉ khung câu đóng (mã thoát, signal,
 * asset trích tên trong ngoặc kép, vi phạm curve parse được) mới dịch
 * trọn vẹn. Consumer cũ (CLI/MCP formatErrorDetail, ExportPanel cũ)
 * chỉ đọc code/summary/details nên nhận payload mới KHÔNG vỡ; consumer
 * mới gặp payload cũ (không có summaryKey) thì fallback về summary thô.
 * Không field nào bị đổi tên hay bỏ đi.
 */
"use strict";

const os = require("os");

/** Số dòng detail tối đa trả về; phần còn lại chỉ đếm, không gửi. */
const MAX_DETAIL_LINES = 5;
/** Số dòng stderr tail tối đa giữ trong redactedTail. */
const MAX_TAIL_LINES = 20;
/** Số ký tự tối đa của redactedTail (khớp thói quen slice(-1500) cũ). */
const MAX_TAIL_CHARS = 1500;

const SECRET_KEY_RE =
  /(api[-_ ]?key|access[-_ ]?token|auth[-_ ]?token|secret|password|passwd|bearer)\s*[:=]\s*[^\s"'`,;]+/gi;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._~+\/-]+=*=?/gi;
const KNOWN_TOKEN_RE =
  /\b(?:sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]+)\b/g;
const URL_CREDENTIAL_RE = /(https?:\/\/)[^:\s/@]+:[^@\s/]+@/gi;
/** Token mờ dài (>= 40 ký tự) không thuộc từ khóa đã biết — thường là key/hash. */
const LONG_TOKEN_RE = /\b[A-Za-z0-9_-]{40,}\b/g;
const STACK_LINE_RE = /^\s+at\s+.*$/;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Redact stderr thô:
 *  - Bỏ dòng stack trace Node ("    at ...") — không có ích cho user,
 *    chỉ toàn đường dẫn nội bộ.
 *  - URL có credential, "Bearer <token>", key=value bí mật, token prefix
 *    đã biết, token mờ dài → <redacted> / <token>.
 *  - Home dir (homedir thật của máy + dạng /home/<user>, /Users/<user>,
 *    C:\Users\<user>) → <home>.
 *  - Mọi đường dẫn tuyệt đối còn lại → <path>/<basename> (giữ basename
 *    để user vẫn nhận ra file của mình, ví dụ clip.mp4 bị thiếu; KHÔNG
 *    còn dấu "/" đầu dòng nên không thể khôi phục cây thư mục).
 *  - Chỉ giữ MAX_TAIL_LINES dòng cuối, tối đa MAX_TAIL_CHARS ký tự.
 * Hàm lũy đẳng: redact(redact(x)) === redact(x) (marker <path>/, <home>,
 * <redacted>, <token> không chứa ký tự kích hoạt lại các rule).
 */
function redactStderr(input) {
  if (input === null || input === undefined) return "";
  const rawLines = String(input).replace(/\r/g, "\n").split("\n");
  const kept = rawLines.filter((line) => !STACK_LINE_RE.test(line));
  let text = kept.join("\n");

  text = text.replace(URL_CREDENTIAL_RE, "$1<redacted>@");
  text = text.replace(BEARER_RE, "Bearer <redacted>");
  text = text.replace(SECRET_KEY_RE, "$1=<redacted>");
  text = text.replace(KNOWN_TOKEN_RE, "<redacted>");

  // Home dir: callback ăn CẢ đường dẫn phía sau, để không sót dạng
  // "<home>/projects/secret/clip.mp4" (vẫn lộ cây thư mục). Chỉ đúng
  // thư mục home trần mới thành "<home>"; có file phía sau thì thành
  // "<path>/<basename>" như mọi đường dẫn tuyệt đối khác.
  const homePathResult = (rest) => {
    if (!rest) return "<home>";
    const base = String(rest).split(/[\\/]/).filter(Boolean).pop() || "";
    return base ? "<path>/" + base : "<home>";
  };
  const home = (() => { try { return os.homedir(); } catch { return ""; } })();
  const envHome = process.env.HOME || process.env.USERPROFILE || "";
  for (const h of [home, envHome]) {
    if (!h || h.length <= 1) continue;
    const re = new RegExp(
      escapeRegExp(h) + "((?:[\\/][A-Za-z0-9._~%+\\-]+)*)", "g"
    );
    text = text.replace(re, (_m, rest) => homePathResult(rest));
  }
  text = text.replace(
    /\/(home|Users)\/([^/\s:'"()[\]]+)((?:\/[A-Za-z0-9._~%+\-]+)*)/g,
    (_m, _kind, _user, rest) => homePathResult(rest)
  );
  text = text.replace(
    /[A-Za-z]:[\\/]Users[\\/][^\\/:\s:'"()[\]]+((?:[\\/][^\\/:\s:'"()[\]]+)*)/g,
    (_m, rest) => homePathResult(rest)
  );
  text = text.replace(/\$?\{(?:HOME|USERPROFILE)\}|\$HOME/g, "<home>");

  // Đường dẫn tuyệt đối Unix: giữ basename, bỏ toàn bộ cây thư mục.
  // Boundary đầu: không phải chữ/số (tránh nuốt "2026/10/31" hay URL
  // "https://..." — "//example.com/..." không khớp vì segment rỗng).
  text = text.replace(
    /(^|[\s"'([=:])((?:\/[A-Za-z0-9._~%+\-]+)+)/g,
    (_m, boundary, p) => {
      const base = p.split("/").filter(Boolean).pop() || "";
      return boundary + "<path>/" + base;
    }
  );
  // Đường dẫn Windows còn sót (C:\... hoặc C:/... chưa bị rule trên bắt),
  // và phần đuôi backslash còn lại sau khi đã cắt "C:\Users\<user>".
  text = text.replace(
    /[A-Za-z]:[\\/]((?:[^\\/:\s'"()[\]]+[\\/])*)([^\\/:\s'"()[\]]+)/g,
    (_m, _dirs, base) => "<path>/" + base
  );
  text = text.replace(
    /(^|[\s"'([=:])((?:\\[A-Za-z0-9._~%+\-]+)+)/g,
    (_m, boundary, p) => boundary + "<path>/" + p.split("\\").filter(Boolean).pop()
  );

  text = text.replace(LONG_TOKEN_RE, "<token>");

  const lines = text.split("\n");
  const tail = lines.slice(-MAX_TAIL_LINES).join("\n");
  return tail.length > MAX_TAIL_CHARS ? tail.slice(-MAX_TAIL_CHARS) : tail;
}

/** Lấy tối đa MAX_DETAIL_LINES dòng khớp predicate, đếm số dòng bị lược. */
function pickLines(lines, predicate, max) {
  const hit = lines.filter(predicate);
  return {
    details: hit.slice(0, max),
    omitted: Math.max(0, hit.length - max),
  };
}

function lastLines(lines, max) {
  const hit = lines.filter(Boolean);
  return {
    details: hit.slice(-max),
    omitted: Math.max(0, hit.length - max),
  };
}

/**
 * Đợt 34 Q4 — tách tham số có cấu trúc khỏi dòng validator speed-curve.
 * Dạng dòng: "1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải
 * trong 0.25..4 (nhận được: 5)". Không khớp → null (caller dùng key raw
 * với detail nguyên dòng, không bịa tham số).
 */
function parseCurveViolationLine(line) {
  const m = String(line || "").match(
    /^\s*(?:\d+\.\s*)?\[(.+?)\]\s+(\S+)\s+phải trong\s+(\S+)\s+\(nhận được:\s*([^)]+)\)/
  );
  if (!m) return null;
  return { clip: m[1], field: m[2], range: m[3], value: m[4].trim() };
}

/** Đợt 34 Q4 — tên asset nằm trong ngoặc kép của dòng "không tìm thấy". */
function quotedName(line) {
  const m = String(line || "").match(/"([^"]+)"/);
  return m ? m[1] : null;
}

/** Đợt 34 Q4 — toàn bộ summaryKey mà classifyRenderError có thể phát. */
const ERROR_SUMMARY_KEYS = [
  "speedCurveViolation",
  "speedCurveViolationRaw",
  "missingAsset",
  "missingAssetRaw",
  "specValidation",
  "outputQa",
  "workerStart",
  "workerExitNoOutput",
  "workerExitSignal",
  "workerExitCode",
  "ffmpegError",
  "unknownDetail",
  "unknown",
];

/**
 * Phân loại stderr/message đã redact thành mã có cấu trúc.
 * Thứ tự quan trọng: curve → asset thiếu → spec chung → QA → spawn →
 * ffmpeg → worker exit. "No such file" của ffmpeg cũng là MISSING_ASSET
 * (file đầu vào thiếu) nên nằm trước FFMPEG_ERROR.
 */
function classifyRenderError(input, opts) {
  const options = opts || {};
  const raw = String(input === null || input === undefined ? "" : input);
  const redacted = redactStderr(raw);
  const lines = redacted.split("\n").map((l) => l.trim()).filter(Boolean);
  const clean = lines.map((l) =>
    l.replace(/\s*\(file lỗi đã bị giữ lại, không trả cho người dùng\)\s*\.?/g, "").trim()
  ).filter(Boolean);

  const has = (re) => re.test(raw) || re.test(redacted);

  if (has(/speedKeyframes/)) {
    const picked = pickLines(
      clean,
      (l) => /speedKeyframes|Spec không hợp lệ/.test(l),
      MAX_DETAIL_LINES
    );
    const first = picked.details.find((l) => /speedKeyframes/.test(l)) || picked.details[0];
    const parsed = first ? parseCurveViolationLine(first) : null;
    return {
      code: "SPEED_CURVE_VIOLATION",
      summary: first
        ? `Vi phạm speed-curve: ${first}`
        : "Vi phạm speed-curve (xem chi tiết).",
      // Đợt 34 Q4: parse được → tham số rời; không parse được → detail thô.
      summaryKey: parsed ? "speedCurveViolation" : "speedCurveViolationRaw",
      summaryParams: parsed || { detail: first || "" },
      details: picked.details,
      detailsOmitted: picked.omitted,
      redactedTail: redacted,
    };
  }

  if (has(/không tìm thấy asset|không tìm thấy file|No such file or directory/)) {
    const picked = pickLines(
      clean,
      (l) => /không tìm thấy asset|không tìm thấy file|No such file or directory/.test(l),
      MAX_DETAIL_LINES
    );
    const first = picked.details[0];
    const asset = first ? quotedName(first) : null;
    return {
      code: "MISSING_ASSET",
      summary: first
        ? `Thiếu asset/file đầu vào: ${first}`
        : "Thiếu asset/file đầu vào.",
      // Đợt 34 Q4: có tên trong ngoặc kép → param asset rời; không thì detail thô.
      summaryKey: asset ? "missingAsset" : "missingAssetRaw",
      summaryParams: asset ? { asset } : { detail: first || "" },
      details: picked.details.length > 0 ? picked.details : lastLines(clean, 1).details,
      detailsOmitted: picked.omitted,
      redactedTail: redacted,
    };
  }

  if (has(/Spec không hợp lệ/)) {
    const picked = pickLines(
      clean,
      (l) => /Spec không hợp lệ|^\d+\.\s/.test(l),
      MAX_DETAIL_LINES
    );
    const first = picked.details.find((l) => /^\d+\./.test(l)) || picked.details[0];
    return {
      code: "SPEC_VALIDATION",
      summary: first ? `Spec không hợp lệ: ${first}` : "Spec không hợp lệ.",
      // Đợt 34 Q4: dòng validator là dữ liệu (đa dạng, không parse hết
      // thành tham số rời được) nên template chỉ dịch khung câu.
      summaryKey: "specValidation",
      summaryParams: { detail: first || "" },
      details: picked.details,
      detailsOmitted: picked.omitted,
      redactedTail: redacted,
    };
  }

  if (has(/Kiểm tra chất lượng output thất bại/)) {
    const picked = pickLines(
      clean,
      (l) => /Kiểm tra chất lượng output thất bại/.test(l),
      MAX_DETAIL_LINES
    );
    // Đợt 34 Q4: tách tiền tố QA khỏi dòng để template en không lặp tiền tố.
    const qaLine = picked.details[0] || "";
    const qaDetail = qaLine.replace(/^Kiểm tra chất lượng output thất bại:?\s*/, "");
    return {
      code: "OUTPUT_QA",
      summary: picked.details[0] || "Kiểm tra chất lượng output thất bại.",
      summaryKey: "outputQa",
      summaryParams: { detail: qaDetail },
      details: picked.details,
      detailsOmitted: picked.omitted,
      redactedTail: redacted,
    };
  }

  if (has(/Không khởi động được render worker|Lỗi spawn render worker|spawnJob phải trả về/)) {
    return {
      code: "WORKER_START",
      summary: clean[0] || "Không khởi động được render worker.",
      // Đợt 34 Q4: thông điệp spawn đa dạng → template passthrough {detail}.
      summaryKey: "workerStart",
      summaryParams: { detail: clean[0] || "" },
      details: clean.slice(0, MAX_DETAIL_LINES),
      detailsOmitted: Math.max(0, clean.length - MAX_DETAIL_LINES),
      redactedTail: redacted,
    };
  }

  if (has(/thoát mã 0 nhưng không tạo được file output/)) {
    return {
      code: "WORKER_EXIT",
      summary: "Render worker thoát mã 0 nhưng không tạo được file output.",
      // Đợt 34 Q4: câu đóng khung, dịch trọn vẹn, không tham số.
      summaryKey: "workerExitNoOutput",
      summaryParams: {},
      details: [],
      detailsOmitted: 0,
      redactedTail: redacted,
    };
  }

  if (has(/ffmpeg|Invalid argument|Invalid data|Unknown encoder|Error opening|Failed to|Permission denied|Conversion failed|is not supported|not found/i)) {
    const picked = pickLines(
      clean,
      (l) => /Invalid argument|Invalid data|Unknown encoder|Error opening|Failed to|Permission denied|Conversion failed|not found|No such/i.test(l),
      MAX_DETAIL_LINES
    );
    const chosen = picked.details.length > 0 ? picked : lastLines(clean, MAX_DETAIL_LINES);
    const first = chosen.details[chosen.details.length - 1];
    return {
      code: "FFMPEG_ERROR",
      summary: first ? `Lỗi ffmpeg: ${first}` : "Lỗi ffmpeg (xem chi tiết).",
      // Đợt 34 Q4: dòng ffmpeg là dữ liệu (thường đã là tiếng Anh) → template dịch khung.
      summaryKey: "ffmpegError",
      summaryParams: { detail: first || "" },
      details: chosen.details,
      detailsOmitted: chosen.omitted,
      redactedTail: redacted,
    };
  }

  if (options.signal) {
    return {
      code: "WORKER_EXIT",
      summary: `Render worker bị kill bởi signal ${options.signal}.`,
      // Đợt 34 Q4: câu đóng khung, dịch trọn vẹn.
      summaryKey: "workerExitSignal",
      summaryParams: { signal: String(options.signal) },
      details: [],
      detailsOmitted: 0,
      redactedTail: redacted,
    };
  }
  if (options.exitCode !== null && options.exitCode !== undefined) {
    return {
      code: "WORKER_EXIT",
      summary: `Render worker thoát với mã ${options.exitCode}.`,
      // Đợt 34 Q4: câu đóng khung, dịch trọn vẹn.
      summaryKey: "workerExitCode",
      summaryParams: { exitCode: String(options.exitCode) },
      details: clean.slice(0, MAX_DETAIL_LINES),
      detailsOmitted: Math.max(0, clean.length - MAX_DETAIL_LINES),
      redactedTail: redacted,
    };
  }
  return {
    code: "UNKNOWN",
    summary: clean[0] || "Render thất bại (không rõ lý do).",
    // Đợt 34 Q4: có dòng lỗi → passthrough; không có → câu đóng khung.
    summaryKey: clean[0] ? "unknownDetail" : "unknown",
    summaryParams: clean[0] ? { detail: clean[0] } : {},
    details: clean.slice(0, MAX_DETAIL_LINES),
    detailsOmitted: Math.max(0, clean.length - MAX_DETAIL_LINES),
    redactedTail: redacted,
  };
}

/**
 * Xây errorDetail từ stderr thô và/hoặc message của bridge.
 * message kiểu cũ "Render worker thoát với mã 1. Chi tiết: <tail>" được
 * tách tail ra trước khi phân loại; phần trước " Chi tiết:" không đưa
 * vào details (nó đã là job.error).
 */
function buildErrorDetail(input) {
  const opts = input || {};
  let stderr = opts.stderr || "";
  let message = opts.message || "";
  const tailMarker = " Chi tiết: ";
  if (!stderr && message.includes(tailMarker)) {
    stderr = message.slice(message.indexOf(tailMarker) + tailMarker.length);
    message = message.slice(0, message.indexOf(tailMarker));
  }
  const source = stderr || message;
  const classified = classifyRenderError(source, {
    exitCode: opts.exitCode,
    signal: opts.signal,
  });
  // Khi chỉ có message tóm tắt (spawn/QA, không có stderr), redactedTail
  // không lặp lại message — detail lúc đó nằm ở summary/details.
  const redactedTail = stderr ? redactStderr(stderr) : "";
  return {
    code: classified.code,
    summary: classified.summary,
    // Đợt 34 Q4: lộ summaryKey/summaryParams ra API (additive).
    summaryKey: classified.summaryKey,
    summaryParams: classified.summaryParams,
    details: classified.details,
    detailsOmitted: classified.detailsOmitted,
    redactedTail,
  };
}

/**
 * buildTaskError — Lỗi có cấu trúc cho các tác vụ bridge KHÔNG phải render
 * job (caption, translate, silence, reframe, beats, scene, bgremove, tts).
 * Đợt 29 L3: các route này trước đây trả nguyên tail stderr thô
 * (lộ đường dẫn tuyệt đối, token) trong `error`. Nay:
 *  - `error`: chuỗi ngắn đã redact (giữ tiền tố tên script + exit code,
 *    tối đa ~500 ký tự, giữ đầu + đuôi để không mất cả tiền tố lẫn tail).
 *  - `errorCode`: enum an toàn từ classify (luôn kèm, như render job).
 *  - `errorDetail`: canonical { code, summary, details, detailsOmitted,
 *    redactedTail } — KHÁC render job ở chỗ route đồng bộ trả luôn detail
 *    (one-shot, không poll lặp), vì toàn bộ đã redact nên an toàn.
 * Exit code được tách từ message dạng "thoát mã N" / "(exit N)" /
 * "exit N" khi caller không truyền riêng. `stderr` riêng (vd bgremove
 * err.stderrTail) được ưu tiên làm nguồn phân loại + redactedTail.
 */
function buildTaskError(input) {
  const opts = input || {};
  const raw = String(opts.message || opts.stderr || "");
  const exitMatch = raw.match(/thoát mã\s+(\d+)|\(exit\s+(\d+)\)|\bexit\s+(\d+)/);
  const exitCode = opts.exitCode !== undefined && opts.exitCode !== null
    ? opts.exitCode
    : exitMatch
      ? Number(exitMatch[1] || exitMatch[2] || exitMatch[3])
      : undefined;
  const signal = opts.signal || null;
  const detail = buildErrorDetail({ message: raw, stderr: opts.stderr || "", exitCode, signal });
  const redacted = redactStderr(raw);
  const lines = redacted.split("\n").map((l) => l.trim()).filter(Boolean);
  const joined = lines.slice(-3).join(" ");
  let short = joined || detail.summary || "Tác vụ thất bại.";
  if (short.length > 500) short = short.slice(0, 200) + " … " + short.slice(-280);
  return { error: short, errorCode: detail.code, errorDetail: detail };
}

/**
 * Render errorDetail thành chuỗi nhiều dòng để CLI/MCP in nguyên văn.
 * Đợt 34 Q4: KHÔNG đổi — CLI/MCP không có hệ i18n nên vẫn in summary
 * thô (đã redact); summaryKey/summaryParams chỉ là field cộng thêm mà
 * hàm này cố tình bỏ qua, đó chính là điểm tương thích consumer cũ.
 */
function formatErrorDetail(detail) {
  const d = detail || {};
  const out = [`Render thất bại [${d.code || "UNKNOWN"}]: ${d.summary || "không rõ lý do."}`];
  for (const line of d.details || []) out.push(`  - ${line}`);
  if (d.detailsOmitted > 0) {
    out.push(`  ... và ${d.detailsOmitted} dòng lỗi khác đã lược bớt.`);
  }
  return out.join("\n");
}

module.exports = {
  redactStderr,
  classifyRenderError,
  buildErrorDetail,
  buildTaskError,
  formatErrorDetail,
  ERROR_SUMMARY_KEYS,
  MAX_DETAIL_LINES,
  MAX_TAIL_LINES,
  MAX_TAIL_CHARS,
};
