/**
 * exportPresets.ts — Preset xuất video cho VCut Studio (R1-042, Batch D).
 *
 * Preset là lựa chọn ở THỜI ĐIỂM RENDER, không phải thuộc tính của project:
 * UI clone spec, override meta.width/height/fps theo preset, gửi kèm
 * quality params (crf/x264Preset/audioBitrate) qua bridge → render.js.
 * Project gốc trong store không bị đổi.
 *
 * Module thuần (không DOM, không dependency) để test được bằng Node.
 */

/** Các x264 preset ffmpeg chấp nhận (từ nhanh-nhất tới nén-tốt-nhất). */
export const X264_PRESETS = [
  "ultrafast",
  "superfast",
  "veryfast",
  "faster",
  "fast",
  "medium",
  "slow",
  "slower",
  "veryslow",
] as const;
export type X264Preset = (typeof X264_PRESETS)[number];

export function isX264Preset(v: unknown): v is X264Preset {
  return typeof v === "string" && (X264_PRESETS as readonly string[]).includes(v);
}

export interface ExportPreset {
  id: string;
  /** Nhãn hiện trên dropdown, vd "1080p · Cân bằng". */
  label: string;
  /** Mô tả ngắn cho user. */
  description: string;
  width: number;
  height: number;
  fps: number;
  /** Constant Rate Factor 0..51 — số càng nhỏ chất lượng càng cao, file càng lớn. */
  crf: number;
  x264Preset: X264Preset;
  audioBitrateKbps: number;
}

/** Giới hạn hợp lệ cho từng field (dùng chung cho UI + validate). */
export const PRESET_LIMITS = {
  width: { min: 16, max: 7680 },
  height: { min: 16, max: 7680 },
  fps: { min: 1, max: 120 },
  crf: { min: 0, max: 51 },
  audioBitrateKbps: { min: 32, max: 512 },
} as const;

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "720p",
    label: "720p · Nhanh",
    description: "1280×720 @30fps — file nhẹ, render nhanh, hợp xem trên điện thoại",
    width: 1280,
    height: 720,
    fps: 30,
    crf: 23,
    x264Preset: "veryfast",
    audioBitrateKbps: 128,
  },
  {
    id: "1080p",
    label: "1080p · Cân bằng",
    description: "1920×1080 @30fps — chất lượng tốt, dung lượng vừa phải",
    width: 1920,
    height: 1080,
    fps: 30,
    crf: 20,
    x264Preset: "medium",
    audioBitrateKbps: 160,
  },
  {
    id: "4k",
    label: "4K · Chất lượng cao",
    description: "3840×2160 @30fps — chi tiết tối đa, render chậm, file lớn",
    width: 3840,
    height: 2160,
    fps: 30,
    crf: 18,
    x264Preset: "slow",
    audioBitrateKbps: 192,
  },
  {
    id: "tiktok",
    label: "TikTok / Reels 9:16",
    description: "1080×1920 dọc @30fps — khổ chuẩn TikTok, Reels, Shorts",
    width: 1080,
    height: 1920,
    fps: 30,
    crf: 20,
    x264Preset: "medium",
    audioBitrateKbps: 160,
  },
  {
    id: "youtube",
    label: "YouTube 1080p",
    description: "1920×1080 @30fps — bitrate cao hơn, hợp upload YouTube",
    width: 1920,
    height: 1080,
    fps: 30,
    crf: 18,
    x264Preset: "medium",
    audioBitrateKbps: 192,
  },
  {
    id: "ig-square",
    label: "Instagram vuông 1:1",
    description: "1080×1080 @30fps — khổ vuông cho feed Instagram",
    width: 1080,
    height: 1080,
    fps: 30,
    crf: 21,
    x264Preset: "medium",
    audioBitrateKbps: 128,
  },
  {
    id: "custom",
    label: "Tùy chỉnh…",
    description: "Tự chỉnh độ phân giải, fps và chất lượng nén",
    width: 1920,
    height: 1080,
    fps: 30,
    crf: 20,
    x264Preset: "medium",
    audioBitrateKbps: 160,
  },
];

export function getPreset(id: string): ExportPreset | undefined {
  return EXPORT_PRESETS.find((p) => p.id === id);
}

/** Giá trị mặc định khi UI khởi tạo form custom (lấy từ preset 1080p). */
export function defaultCustomPreset(): ExportPreset {
  const base = getPreset("1080p")!;
  return { ...base, id: "custom", label: "Tùy chỉnh", description: "" };
}

function isIntIn(v: unknown, min: number, max: number): boolean {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

/**
 * Kiểm tra preset hợp lệ. Trả về danh sách lỗi (rỗng = hợp lệ).
 * Dùng cho cả UI (disable nút Xuất) và bridge/render.js (fail fast).
 */
export function validateExportPreset(p: unknown): string[] {
  const errs: string[] = [];
  if (!p || typeof p !== "object") return ["Preset phải là object."];
  const o = p as Record<string, unknown>;
  if (!isIntIn(o.width, PRESET_LIMITS.width.min, PRESET_LIMITS.width.max))
    errs.push(`width phải là số nguyên ${PRESET_LIMITS.width.min}..${PRESET_LIMITS.width.max}.`);
  if (!isIntIn(o.height, PRESET_LIMITS.height.min, PRESET_LIMITS.height.max))
    errs.push(`height phải là số nguyên ${PRESET_LIMITS.height.min}..${PRESET_LIMITS.height.max}.`);
  if (!isIntIn(o.fps, PRESET_LIMITS.fps.min, PRESET_LIMITS.fps.max))
    errs.push(`fps phải là số nguyên ${PRESET_LIMITS.fps.min}..${PRESET_LIMITS.fps.max}.`);
  if (!isIntIn(o.crf, PRESET_LIMITS.crf.min, PRESET_LIMITS.crf.max))
    errs.push(`crf phải là số nguyên ${PRESET_LIMITS.crf.min}..${PRESET_LIMITS.crf.max} (0 = tốt nhất).`);
  if (!isX264Preset(o.x264Preset))
    errs.push(`x264Preset phải thuộc: ${X264_PRESETS.join(", ")}.`);
  if (
    !isIntIn(
      o.audioBitrateKbps,
      PRESET_LIMITS.audioBitrateKbps.min,
      PRESET_LIMITS.audioBitrateKbps.max,
    )
  )
    errs.push(
      `audioBitrateKbps phải là số nguyên ${PRESET_LIMITS.audioBitrateKbps.min}..${PRESET_LIMITS.audioBitrateKbps.max}.`,
    );
  return errs;
}

/** Chuỗi bitrate cho ffmpeg, vd 160 → "160k". */
export function audioBitrateArg(kbps: number): string {
  return `${kbps}k`;
}

/** Tóm tắt 1 dòng cho UI, vd "1920×1080 @30fps · CRF 20 · medium · audio 160k". */
export function presetSummary(p: ExportPreset): string {
  return (
    `${p.width}×${p.height} @${p.fps}fps · CRF ${p.crf} · ${p.x264Preset} · audio ${p.audioBitrateKbps}k`
  );
}

// ---------------------------------------------------------------------------
// R1-064 (Batch F): ước tính dung lượng file xuất.
// ---------------------------------------------------------------------------

/**
 * Ước tính video bitrate (kbps) theo công thức heuristic:
 *
 *   bpppf = 0.1 × 2^((23 − crf) / 6)      (bits / pixel / frame)
 *   videoKbps = width × height × fps × bpppf / 1000
 *
 * Cơ sở: với x264, tăng ~6 điểm CRF thì bitrate giảm còn một nửa (ngược lại).
 * 0.1 bpppf ở CRF 23 là mức điển hình cho video quay thường (live action).
 * Đây là ƯỚC TÍNH: video tĩnh (slide) có thể nhỏ hơn 2–5 lần, video nhiễu/
 * phức tạp (mưa, cỏ cây, pháo hoa) có thể lớn hơn 2–3 lần.
 * x264Preset không được tính (chỉ ảnh hưởng tốc độ encode, không đổi nhiều
 * dung lượng ở cùng CRF).
 */
export function estimateVideoBitrateKbps(p: ExportPreset): number {
  const bpppf = 0.1 * Math.pow(2, (23 - p.crf) / 6);
  return (p.width * p.height * p.fps * bpppf) / 1000;
}

/**
 * Ước tính dung lượng file MP4 (bytes) = (videoKbps + audioKbps) × duration.
 * Nhân thêm 1.02 cho overhead container MP4 (~2%).
 * Trả về số nguyên. Xem estimateVideoBitrateKbps về độ chính xác.
 */
export function estimateSize(p: ExportPreset, durationSec: number): number {
  if (!(durationSec > 0)) return 0;
  const totalKbps = estimateVideoBitrateKbps(p) + p.audioBitrateKbps;
  return Math.round((totalKbps * 1000 * durationSec) / 8 * 1.02);
}

/** Định dạng bytes → "1.2 GB" / "67.2 MB" / "845 KB". */
export function formatBytes(bytes: number): string {
  if (!(bytes >= 0)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Nhãn 1 dòng cho UI: "≈ 67.2 MB · ước tính (không chính xác)". */
export function sizeEstimateLabel(p: ExportPreset, durationSec: number): string {
  return `≈ ${formatBytes(estimateSize(p, durationSec))} · ước tính, file thật có thể chênh lệch`;
}
