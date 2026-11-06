/**
 * renderErrors.ts — Adapter lỗi render cho MCP server (Phase 9 đợt 28, luồng L3).
 *
 * Logic canonical nằm ở server/bridge/src/errorDetail.js (CommonJS, load
 * qua createRequire đúng mẫu cli/src/project.ts load validate.js). File
 * này chỉ là adapter mỏng: gọi buildErrorDetail/formatErrorDetail, và nếu
 * module bridge không load được thì fallback an toàn (không bao giờ trả
 * stderr thô về cho agent — chỉ basename + mã UNKNOWN).
 */
import { createRequire } from "node:module";
import path from "node:path";
import { REPO_ROOT } from "../store.js";

const require = createRequire(import.meta.url);

export interface RenderErrorDetail {
  code: string;
  summary: string;
  // Đợt 34 Q4 (additive, bridge phát thêm): key + params để web dịch
  // khung tóm tắt. MCP không có hệ i18n nên chỉ lộ qua, không dịch;
  // payload bridge cũ thiếu 2 field này vẫn hợp lệ (optional).
  summaryKey?: string;
  summaryParams?: Record<string, string>;
  details: string[];
  detailsOmitted: number;
  redactedTail: string;
}

interface ErrorDetailModule {
  redactStderr?: (text: string) => string;
  buildErrorDetail: (input: {
    stderr?: string;
    message?: string;
    exitCode?: number | null;
    signal?: string | null;
  }) => RenderErrorDetail;
  formatErrorDetail: (detail: RenderErrorDetail) => string;
}

const BRIDGE_ERROR_DETAIL_JS = path.join(
  REPO_ROOT,
  "server",
  "bridge",
  "src",
  "errorDetail.js"
);

function loadModule(): ErrorDetailModule | null {
  try {
    const mod = require(BRIDGE_ERROR_DETAIL_JS) as ErrorDetailModule;
    if (typeof mod.buildErrorDetail === "function" && typeof mod.formatErrorDetail === "function") {
      return mod;
    }
  } catch {
    // Fallback ở dưới — module bridge thiếu không được làm MCP trả stderr thô.
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
 * Đợt 29 L3 — redact stderr của ffprobe (probeVideo): trước đây cả 2 bản
 * probeVideo đều `slice(0, 500)` stderr thô, có thể lộ đường dẫn tuyệt
 * đối trong message tool. Dùng redactStderr của bridge khi load được,
 * fallback basename-only khi không. Trả tối đa 3 dòng cuối, ≤ 500 ký tự.
 */
export function redactProbeStderr(stderr: string): string {
  const mod = loadModule();
  let text = String(stderr || "");
  if (mod && typeof (mod as unknown as { redactStderr?: unknown }).redactStderr === "function") {
    text = (mod as unknown as { redactStderr: (t: string) => string }).redactStderr(text);
  } else {
    text = fallbackFormat(text, null).replace(/^Render thất bại \[UNKNOWN\]: /, "");
  }
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const joined = lines.slice(-3).join(" ");
  return joined.length > 500 ? joined.slice(0, 500) : joined;
}

/**
 * Đợt 34 Q4 — lộ errorDetail có cấu trúc của bridge cho caller nào cần
 * (kể cả summaryKey/summaryParams mới); formatRenderFailure ở dưới vẫn
 * in summary thô như cũ để message tool không đổi.
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
 * Định dạng lỗi worker thành chuỗi có cấu trúc, đã redact, để MCP tool
 * trả nguyên văn qua fail()/ValidationError (handleError in nguyên văn).
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
