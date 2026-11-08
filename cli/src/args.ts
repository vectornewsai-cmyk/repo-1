/**
 * args.ts — Parse command-line arguments đơn giản, zero dependency.
 *
 * Hỗ trợ: --flag value, --flag=value, --bool-flag, positional args.
 */

export interface ParsedArgs {
  /** Tên lệnh (arg đầu tiên không phải flag) */
  command: string;
  /** Positional args còn lại */
  positional: string[];
  /** Flags: --name value → { name: "value" } */
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  let command = "";

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        const key = arg.slice(2, eq);
        flags[key] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2);
        // Xem arg tiếp theo có phải value không
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      // Short flag: -y → { y: true }
      flags[arg.slice(1)] = true;
    } else {
      if (command === "") command = arg;
      else positional.push(arg);
    }
    i++;
  }

  return { command, positional, flags };
}

/** Lấy flag dạng string, throw nếu thiếu (khi required). */
export function reqFlag(flags: Record<string, string | boolean>, name: string, aliases: string[] = []): string {
  const v = flags[name] ?? (aliases.length > 0 ? flags[aliases[0]] : undefined);
  // Check all aliases
  let val: string | boolean | undefined = flags[name];
  for (const a of aliases) {
    if (val === undefined) val = flags[a];
  }
  if (val === undefined || val === true) {
    throw new CliError("MISSING_FLAG", `Thiếu tham số bắt buộc: --${name}`);
  }
  return String(val);
}

/** Lấy flag dạng string, trả default nếu không có. */
export function optFlag(flags: Record<string, string | boolean>, name: string, def: string): string {
  const v = flags[name];
  if (v === undefined || v === true) return def;
  return String(v);
}

/** Lấy flag dạng number. */
export function numFlag(flags: Record<string, string | boolean>, name: string, def: number): number {
  const v = flags[name];
  if (v === undefined || v === true) return def;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new CliError("INVALID_NUMBER", `--${name} phải là số, nhận được: ${v}`);
  return n;
}

/** Lấy flag dạng boolean. */
export function boolFlag(flags: Record<string, string | boolean>, name: string): boolean {
  return flags[name] === true || flags[name] === "true" || flags[name] === "1";
}

/**
 * Đợt 63 R9: CliError mang mã ổn định (catalog CLI_CODES dưới đây,
 * cùng quy ước đặt tên với VALIDATION_CODES của MCP — client là
 * máy/agent khớp lỗi bằng mã thay vì parse câu tiếng Việt; message
 * tiếng Việt giữ nguyên từng chữ, KHÔNG dịch, KHÔNG nối dict i18n
 * web vì CLI không có locale/t()).
 */
export const CLI_CODES = [
  "ENUM_INVALID",
  "INTEGER_OUT_OF_RANGE",
  "INVALID_HEX_COLOR",
  "INVALID_NUMBER",
  "INVALID_OUTPUT_PATH",
  "KIND_MISMATCH",
  "MISSING_FLAG",
  "NOT_FOUND",
  "NUMBER_NEGATIVE",
  "NUMBER_NOT_POSITIVE",
  "NUMBER_OUT_OF_RANGE",
  "OUT_NOT_AFTER_IN",
  "PROJECT_EMPTY",
  "PROJECT_NOT_JSON",
  "PROJECT_NOT_SPEC",
  "PROJECT_READ_FAILED",
  "RENDER_FAILED",
  "SCRIPT_FAILED",
  "SCRIPT_INVALID_OUTPUT",
  "SPEC_INVALID",
  "STRING_REQUIRED",
  "STRING_TOO_LONG",
  "VALIDATION_FAILED",
] as const;
export type CliCode = (typeof CLI_CODES)[number];

export class CliError extends Error {
  readonly code: CliCode;
  constructor(code: CliCode, message: string) {
    super(message);
    this.name = "CliError";
    this.code = code;
  }
}
