/**
 * gpuProbe65S4.ts — Trạng thái probe GPU + nút "Probe lại GPU" trong
 * ExportPanel (Phase 9 đợt 65, luồng S4 — đóng nợ đợt 64 R1 §1/§8.4).
 *
 * Đường đi: bridge `GET /api/gpu-probe` (chỉ đọc cache đĩa, không probe)
 * → trạng thái hiện trong panel Export; nút bấm gọi
 * `POST /api/gpu-probe/reprobe` (xoá cache cũ, kể cả cache lỗi do tháo GPU
 * trong TTL, rồi probe lại thật) → cập nhật trạng thái + thông báo.
 * Mặt render: nếu encoder GPU (kể cả từ cache) fail LÚC ENCODE, render
 * worker tự thử lại 1 lần bằng libx264 + xoá cache lỗi
 * (server/render/src/render.js bước 7).
 *
 * Cách đọc chuỗi (đúng mẫu lib/jobNote64R8.ts đợt 64 R8): fragment
 * round65-s4 được import trực tiếp lúc chạy nên chuỗi en hiện ngay, không
 * chờ parent gộp dict vào vi.json/en.json. Key đầy đủ
 * `export.gpuProbe.*` xuất hiện nguyên văn trong GPU_PROBE_KEYS dưới đây
 * nên scan tĩnh (i18nAudit59P7) thấy là đã tiêu thụ; parent gộp fragment
 * vào dict thì không collision (key mới hoàn toàn).
 *
 * Không bao giờ trả key thô (`export.gpuProbe.*`) ra UI: thiếu key → rớt
 * về vi → rớt về "" (component ẩn khối khi không có chuỗi).
 */
import fragment from "../i18n/fragments/round65-s4.json";
import type { Lang } from "../i18n";

/**
 * Toàn bộ key của cụm này — KHỚP 1:1 với fragment round65-s4
 * (vi + en, chuỗi không rỗng, vi khác en, placeholder khớp).
 * Khai đầy đủ dạng literal để scan tĩnh thấy key đã tiêu thụ.
 */
export const GPU_PROBE_KEYS: readonly string[] = [
  "export.gpuProbe.title",
  "export.gpuProbe.reprobe",
  "export.gpuProbe.probing",
  "export.gpuProbe.statusGpu",
  "export.gpuProbe.statusCpu",
  "export.gpuProbe.statusUnknown",
  "export.gpuProbe.statusCacheOff",
  "export.gpuProbe.fallbackNote",
  "export.gpuProbe.reprobeDone",
  "export.gpuProbe.reprobeError",
];

/** Key lá (không tiền tố) trong bảng fragment `export.gpuProbe.*`. */
export const GPU_PROBE_LEAF_KEYS: readonly string[] = [
  "title",
  "reprobe",
  "probing",
  "statusGpu",
  "statusCpu",
  "statusUnknown",
  "statusCacheOff",
  "fallbackNote",
  "reprobeDone",
  "reprobeError",
];

/** Payload bridge `GET /api/gpu-probe` / `POST /api/gpu-probe/reprobe`
 *  (xem server/bridge/src/gpuProbe.js). */
export interface GpuProbeStatus {
  probed: boolean;
  encoder: string | null;
  detail: string;
  cached: boolean;
  source: string | null;
  probedAtMs: number | null;
  cacheEnabled: boolean;
}

/** Bảng song ngữ cụm GPU probe: `export.gpuProbe.<key>` trong fragment. */
export interface GpuProbeTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng từ fragment (test có thể truyền bảng riêng). */
export function gpuProbeTable(): GpuProbeTable {
  const f = fragment as unknown as {
    vi?: { export?: { gpuProbe?: Record<string, string> } };
    en?: { export?: { gpuProbe?: Record<string, string> } };
  };
  return {
    vi: (f.vi && f.vi.export && f.vi.export.gpuProbe) || {},
    en: (f.en && f.en.export && f.en.export.gpuProbe) || {},
  };
}

/** Thay {var} trong chuỗi mẫu (đúng quy ước i18n/index.ts). */
function fillVars(s: string, vars?: Record<string, string>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) =>
    vars[k] !== undefined ? vars[k] : m,
  );
}

/**
 * Một chuỗi của cụm theo key lá + locale; fallback vi khi thiếu key en;
 * trả undefined khi cả hai đều thiếu — caller không bao giờ in key thô.
 */
export function gpuProbeString(
  leafKey: string,
  lang: Lang,
  vars?: Record<string, string>,
  table: GpuProbeTable = gpuProbeTable(),
): string | undefined {
  const hit = table[lang] && table[lang][leafKey];
  if (typeof hit === "string" && hit.length > 0) return fillVars(hit, vars);
  const vi = table.vi[leafKey];
  if (typeof vi === "string" && vi.length > 0) return fillVars(vi, vars);
  return undefined;
}

/** Toàn bộ chuỗi cụm theo locale (thiếu key → "" để component ẩn). */
export function gpuProbeStrings(
  lang: Lang,
  table: GpuProbeTable = gpuProbeTable(),
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of GPU_PROBE_LEAF_KEYS) {
    out[k] = gpuProbeString(k, lang, undefined, table) ?? "";
  }
  return out;
}

/**
 * Dòng trạng thái GPU hiển thị trong ExportPanel, theo payload bridge:
 *   - cache tắt → statusCacheOff (render nào cũng probe lại)
 *   - chưa probe → statusUnknown
 *   - đã probe, có GPU → statusGpu {encoder} {date}
 *   - đã probe, không GPU → statusCpu
 * Ngày probe định dạng theo locale; probedAtMs thiếu thì bỏ phần ngày.
 */
export function gpuProbeStatusText(
  status: GpuProbeStatus | null | undefined,
  lang: Lang,
  table: GpuProbeTable = gpuProbeTable(),
): string {
  if (!status) return gpuProbeString("statusUnknown", lang, undefined, table) ?? "";
  if (!status.cacheEnabled) {
    return gpuProbeString("statusCacheOff", lang, undefined, table) ?? "";
  }
  if (!status.probed) {
    return gpuProbeString("statusUnknown", lang, undefined, table) ?? "";
  }
  if (status.encoder) {
    const date =
      typeof status.probedAtMs === "number"
        ? new Date(status.probedAtMs).toLocaleString(
            lang === "vi" ? "vi-VN" : "en-US",
          )
        : "";
    return (
      gpuProbeString(
        "statusGpu",
        lang,
        { encoder: status.encoder, date },
        table,
      ) ?? ""
    );
  }
  return gpuProbeString("statusCpu", lang, undefined, table) ?? "";
}

/**
 * Thông báo sau khi bấm "Probe lại GPU" thành công:
 * có GPU → "Probe xong: <encoder>"; không GPU → "Probe xong: libx264 (CPU)".
 */
export function gpuProbeDoneText(
  encoder: string | null | undefined,
  lang: Lang,
  table: GpuProbeTable = gpuProbeTable(),
): string {
  const result = encoder || "libx264 (CPU)";
  return (
    gpuProbeString("reprobeDone", lang, { result }, table) ?? ""
  );
}

/** Thông báo khi probe lại lỗi (lỗi mạng / bridge không trả JSON). */
export function gpuProbeErrorText(
  error: string,
  lang: Lang,
  table: GpuProbeTable = gpuProbeTable(),
): string {
  return (
    gpuProbeString("reprobeError", lang, { error }, table) ?? ""
  );
}
