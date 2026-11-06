/**
 * renderErrors.ts — Adapter lỗi render cho CLI (Phase 9 đợt 28, luồng L3).
 *
 * Logic canonical nằm ở server/bridge/src/errorDetail.js (CommonJS, load
 * qua createRequire đúng mẫu project.ts load validate.js). File này chỉ
 * là adapter mỏng: gọi buildErrorDetail/formatErrorDetail, và nếu module
 * bridge không load được thì fallback an toàn (không bao giờ in stderr
 * thô — chỉ basename + mã UNKNOWN), để CLI không bao giờ leak đường dẫn
 * tuyệt đối hay token qua thông báo lỗi trả về.
 */
import { createRequire } from "node:module";
import { BRIDGE_ERROR_DETAIL_JS } from "./paths.js";

const require = createRequire(import.meta.url);

export interface RenderErrorDetail {
  code: string;
  summary: string;
  // Đợt 34 Q4 (additive, bridge phát thêm): key + params để web dịch
  // khung tóm tắt. CLI không có hệ i18n nên chỉ lộ qua, không dịch;
  // payload bridge cũ thiếu 2 field này vẫn hợp lệ (optional).
  summaryKey?: string;
  summaryParams?: Record<string, string>;
  details: string[];
  detailsOmitted: number;
  redactedTail: string;
}

interface ErrorDetailModule {
  buildErrorDetail: (input: {
    stderr?: string;
    message?: string;
    exitCode?: number | null;
    signal?: string | null;
  }) => RenderErrorDetail;
  formatErrorDetail: (detail: RenderErrorDetail) => string;
  redactStderr?: (input: string) => string;
}

function loadModule(): ErrorDetailModule | null {
  try {
    const mod = require(BRIDGE_ERROR_DETAIL_JS) as ErrorDetailModule;
    if (typeof mod.buildErrorDetail === "function" && typeof mod.formatErrorDetail === "function") {
      return mod;
    }
  } catch {
    // Fallback ở dưới — module bridge thiếu không được làm CLI in stderr thô.
  }
  return null;
}

/** Fallback tối thiểu khi không load được module bridge: basename-only. */
function fallbackFormat(stderr: string, exitCode?: number | null): string {
  const safe = String(stderr || "")
    .replace(
      /[A-Za-z]:[\\/]((?:[^\\/:\s'"()[\]]+[\\/])*)([^\\/:\s'"()[\]]+)/g,
      (_m, _dirs, base) => `<path>/${base}`
    )
    .replace(
      /(^|[\s"'([=:])((?:\/[A-Za-z0-9._~%+\-]+)+)/g,
      (_m, boundary, p) => `${boundary}<path>/${String(p).split("/").filter(Boolean).pop() ?? ""}`
    )
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{20,})\b/g, "<redacted>")
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(-5)
    .join("\n");
  const code = exitCode === null || exitCode === undefined ? "UNKNOWN" : "WORKER_EXIT";
  return `Render thất bại [${code}]: ${safe || "không rõ lý do (module lỗi bridge không load được)."}`;
}

/**
 * Đợt 30 M3 — redact MỘT dòng stderr worker để CLI stream trực tiếp ở
 * chế độ không-quiet: dùng redactStderr canonical của bridge (cùng chuẩn
 * với bridge: cắt đường dẫn tuyệt đối/home/token/stack). Áp cho từng
 * dòng nên hàm tail (giữ 20 dòng cuối, 1500 ký tự) của redactStderr
 * không có tác dụng gộp — mỗi dòng dài > 1500 ký tự vẫn bị cắt đuôi.
 * Dòng stack trace Node ("    at ...") → chuỗi rỗng (caller bỏ qua,
 * không in dòng trống). Fallback khi module bridge không load được:
 * chỉ giữ basename đường dẫn + che token đã biết (không bao giờ in
 * dòng thô).
 */
export function redactWorkerLine(line: string): string {
  const mod = loadModule();
  if (mod && typeof mod.redactStderr === "function") {
    return mod.redactStderr(line).trim();
  }
  const safe = String(line || "")
    .replace(
      /[A-Za-z]:[\\/]((?:[^\\/:\s'"()[\]]+[\\/])*)([^\\/:\s'"()[\]]+)/g,
      (_m, _dirs, base) => `<path>/${base}`
    )
    .replace(
      /(^|[\s"'([=:])((?:\/[A-Za-z0-9._~%+\-]+)+)/g,
      (_m, boundary, p) => `${boundary}<path>/${String(p).split("/").filter(Boolean).pop() ?? ""}`
    )
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{20,})\b/g, "<redacted>")
    .trim();
  if (/^\s*at\s+/.test(line)) return "";
  return safe;
}

/**
 * Đợt 34 Q4 — lộ errorDetail có cấu trúc của bridge cho caller nào cần
 * (kể cả summaryKey/summaryParams mới); formatRenderFailure ở dưới vẫn
 * in summary thô như cũ để output CLI không đổi.
 */
export function buildRenderErrorDetail(
  stderr: string,
  exitCode?: number | null,
  signal?: string | null
): RenderErrorDetail {
  const mod = loadModule();
  if (mod) {
    const detail = mod.buildErrorDetail({ stderr, exitCode, signal });
    return {
      ...detail,
      summaryKey: detail.summaryKey,
      summaryParams: detail.summaryParams,
    };
  }
  return {
    code: exitCode === null || exitCode === undefined ? "UNKNOWN" : "WORKER_EXIT",
    summary: fallbackFormat(stderr, exitCode).replace(/^Render thất bại \[[A-Z_]+\]: /, ""),
    summaryKey: "unknown",
    summaryParams: {},
    details: [],
    detailsOmitted: 0,
    redactedTail: "",
  };
}

/**
 * Định dạng lỗi worker thành chuỗi có cấu trúc, đã redact, để CLI in
 * nguyên văn (qua CliError). stderr rỗng (worker không bắt được gì,
 * vd lỗi spawn) thì trả thông báo chỉ rõ exit code thay vì bịa chi
 * tiết. Từ đợt 30 M3, chế độ không-quiet cũng bắt được stderr (pipe +
 * lọc theo dòng) nên nhánh này chỉ còn cho trường hợp thật sự rỗng.
 */
export function formatRenderFailure(
  stderr: string,
  exitCode?: number | null,
  signal?: string | null
): string {
  const mod = loadModule();
  if (mod) {
    const detail = mod.buildErrorDetail({ stderr, exitCode, signal });
    return mod.formatErrorDetail(detail);
  }
  return fallbackFormat(stderr, exitCode);
}
