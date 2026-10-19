/**
 * image.ts — Định nghĩa image clip (ảnh tĩnh) cho video-spec.
 *
 * Image clip = một file ảnh (PNG/JPEG/...) hiển thị full-frame trên timeline
 * trong `duration` giây, kiểu slideshow / CapCut "photo".
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Render worker triển khai bằng FFmpeg (xem server/render/src/image.js):
 * ảnh tĩnh được loop thành stream video (filter-level, giống sticker module)
 * rồi đặt lên timeline như video unit.
 */

/** Cách lấp đầy khung hình khi tỉ lệ ảnh khác tỉ lệ output. */
export type ImageFit = "contain" | "cover";

/** Clip ảnh tĩnh trên timeline. Thời gian tính bằng GIÂY. */
export interface ImageClip {
  kind: "image";
  id: string;
  /** Đường dẫn file ảnh (tương đối từ thư mục media của project) */
  src: string;
  /** Vị trí bắt đầu trên timeline (giây) */
  start: number;
  /** Độ dài hiển thị trên timeline (giây) */
  duration: number;
  /**
   * Cách lấp đầy khung hình, mặc định "contain":
   * - "contain": giữ nguyên tỉ lệ ảnh, letterbox/pillarbox (nền đen) cho vừa khung hình
   * - "cover": phóng to lấp đầy khung hình, crop phần thừa ở giữa
   */
  fit?: ImageFit;
}

export interface ImageTrack {
  id: string;
  kind: "image";
  label?: string;
  clips: ImageClip[];
}

export const IMAGE_DEFAULTS = {
  fit: "contain",
} as const satisfies { fit: ImageFit };

export function isImageFit(v: unknown): v is ImageFit {
  return v === "contain" || v === "cover";
}

export function isImageClip(c: unknown): c is ImageClip {
  return (
    typeof c === "object" &&
    c !== null &&
    (c as Record<string, unknown>)["kind"] === "image"
  );
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Chuẩn hoá image clip: điền giá trị mặc định cho các trường optional. */
export function normalizeImageClip(c: ImageClip): Required<ImageClip> {
  return {
    kind: "image",
    id: c.id,
    src: c.src,
    start: c.start,
    duration: c.duration,
    fit: c.fit ?? IMAGE_DEFAULTS.fit,
  };
}

/**
 * Validate một image clip. Trả về mảng thông báo lỗi (rỗng = hợp lệ).
 * (Không kiểm tra file tồn tại — việc đó thuộc về validateMedia của render worker.)
 */
export function validateImageClip(c: unknown): string[] {
  const errors: string[] = [];
  if (typeof c !== "object" || c === null) return ["image phải là một object"];
  const s = c as Record<string, unknown>;
  const where = `image "${String(s["id"] ?? "?")}"`;
  if (s["kind"] !== "image") errors.push(`${where}: kind phải là "image"`);
  if (typeof s["id"] !== "string" || (s["id"] as string).length === 0)
    errors.push(`${where}: thiếu id`);
  if (typeof s["src"] !== "string" || (s["src"] as string).length === 0)
    errors.push(`${where}: thiếu src (đường dẫn file ảnh)`);
  if (!isFiniteNumber(s["start"]) || (s["start"] as number) < 0)
    errors.push(`${where}: start phải là số >= 0`);
  if (!isFiniteNumber(s["duration"]) || (s["duration"] as number) <= 0)
    errors.push(`${where}: duration phải là số > 0`);
  if (s["fit"] !== undefined && !isImageFit(s["fit"]))
    errors.push(
      `${where}: fit phải là "contain" | "cover", nhận được: ${JSON.stringify(s["fit"])}`
    );
  return errors;
}
