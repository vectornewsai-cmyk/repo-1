/**
 * lut.ts — Định nghĩa bộ lọc màu LUT cho video-spec.
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Mỗi LUT trong catalog tương ứng 1 file .cube trong assets/filters/
 * (nguồn: cartcut, MIT — xem assets/SOURCES.md) và đã được kiểm chứng
 * bằng MP4 render thật qua filter `lut3d` của FFmpeg.
 *
 * ⚠️ MIRROR: server/render/src/lut.js có bản mirror bằng JS thuần —
 * thêm LUT mới ở đây thì PHẢI cập nhật cả lut.js.
 */

/** 10 LUT có sẵn (id = tên file .cube không đuôi). */
export const LUT_IDS = [
  "cartcut-blockbuster",
  "cartcut-teal-orange",
  "cartcut-nordic-noir",
  "cartcut-honey",
  "cartcut-golden-hour",
  "cartcut-winter-blue",
  "cartcut-ocean",
  "cartcut-mono-neutral",
  "cartcut-faded-seventies",
  "cartcut-super-eight",
] as const;

export type LutId = (typeof LUT_IDS)[number];

/** Metadata hiển thị cho UI (tiếng Việt). */
export const LUT_META: Record<LutId, { label: string; description: string }> = {
  "cartcut-blockbuster": {
    label: "Bom tấn",
    description: "Tương phản cao, màu điện ảnh Hollywood",
  },
  "cartcut-teal-orange": {
    label: "Teal & Cam",
    description: "Da cam ấm trên nền xanh teal lạnh — phong cách phim hành động",
  },
  "cartcut-nordic-noir": {
    label: "Nordic Noir",
    description: "Lạnh, trầm, u ám kiểu phim trinh thám Bắc Âu",
  },
  "cartcut-honey": {
    label: "Mật ong",
    description: "Ấm áp, vàng óng như nắng chiều",
  },
  "cartcut-golden-hour": {
    label: "Giờ vàng",
    description: "Vàng rực rỡ của khoảnh khắc hoàng hôn",
  },
  "cartcut-winter-blue": {
    label: "Xanh mùa đông",
    description: "Xanh băng lạnh lẽo, trong trẻo",
  },
  "cartcut-ocean": {
    label: "Đại dương",
    description: "Xanh biển sâu, tươi mát",
  },
  "cartcut-mono-neutral": {
    label: "Đơn sắc",
    description: "Đen trắng trung tính, cổ điển",
  },
  "cartcut-faded-seventies": {
    label: "Thập niên 70",
    description: "Màu phai mờ vintage như phim cũ",
  },
  "cartcut-super-eight": {
    label: "Super 8",
    description: "Màu phim nhựa 8mm hoài cổ",
  },
};

/** Kiểm tra một giá trị có phải LutId hợp lệ không. */
export function isLutId(v: unknown): v is LutId {
  return (
    typeof v === "string" &&
    (LUT_IDS as readonly string[]).includes(v)
  );
}

/** Tên file .cube tương ứng với một LutId. */
export function lutFileName(id: LutId): string {
  return `${id}.cube`;
}

/** Bộ lọc màu áp cho một video clip. */
export interface VideoFilter {
  /** Id LUT trong catalog (vd "cartcut-teal-orange"). Không đặt = không lọc. */
  lut?: LutId;
}

/** Validate VideoFilter, trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateVideoFilter(f: unknown): string[] {
  if (f === undefined || f === null) return [];
  if (typeof f !== "object" || Array.isArray(f)) {
    return ["filter phải là một object"];
  }
  const errors: string[] = [];
  const lut = (f as Record<string, unknown>).lut;
  if (lut !== undefined && !isLutId(lut)) {
    errors.push(
      `filter.lut không hợp lệ: ${JSON.stringify(lut)} ` +
      `(chỉ chấp nhận: ${LUT_IDS.join(", ")})`
    );
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Module augmentation: gắn `filter?` vào VideoClip mà KHÔNG sửa index.ts.
// (index.ts của agent khác — parent sẽ tích hợp chính thức sau.)
// ---------------------------------------------------------------------------
import "./index";

declare module "./index" {
  interface VideoClip {
    filter?: VideoFilter;
  }
}
