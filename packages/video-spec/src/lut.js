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
import { validateColorAdjust } from "./color.js";
/** 20 LUT có sẵn (id = tên file .cube không đuôi).
 *  - "cartcut-*": từ dự án cartcut (MIT) — xem assets/SOURCES.md
 *  - "vcut-*": tự tạo bằng script assets/filters/gen_vcut_luts.py (tác phẩm gốc) */
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
    "vcut-cinematic",
    "vcut-vintage-fade",
    "vcut-noir-contrast",
    "vcut-cyberpunk",
    "vcut-pastel-dream",
    "vcut-sunset-glow",
    "vcut-arctic",
    "vcut-faded-film",
    "vcut-moody-forest",
    "vcut-warm-bloom",
];
/** Metadata hiển thị cho UI (tiếng Việt). */
export const LUT_META = {
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
    // --- vcut-*: tự tạo (tác phẩm gốc của VCut Studio) ---
    "vcut-cinematic": {
        label: "Điện ảnh",
        description: "Tương phản điện ảnh, highlight ấm, shadow xanh teal",
    },
    "vcut-vintage-fade": {
        label: "Phai vintage",
        description: "Màu phai mờ hoài cổ, đen nâng sáng",
    },
    "vcut-noir-contrast": {
        label: "Noir tương phản",
        description: "Đen trắng tương phản gắt, phong cách noir",
    },
    "vcut-cyberpunk": {
        label: "Cyberpunk",
        description: "Magenta/cyan rực rỡ, bão hòa cao kiểu neon",
    },
    "vcut-pastel-dream": {
        label: "Pastel mộng",
        description: "Pastel nhẹ nhàng, mềm mại như mơ",
    },
    "vcut-sunset-glow": {
        label: "Hoàng hôn rực",
        description: "Vàng cam rực rỡ của nắng chiều muộn",
    },
    "vcut-arctic": {
        label: "Bắc cực",
        description: "Xanh băng sạch, lạnh và trong",
    },
    "vcut-faded-film": {
        label: "Phim phai",
        description: "Tương phản thấp, phai ấm như phim cũ",
    },
    "vcut-moody-forest": {
        label: "Rừng u ám",
        description: "Xanh lá trầm, tối và đầy tâm trạng",
    },
    "vcut-warm-bloom": {
        label: "Ấm áp",
        description: "Sáng ấm áp, mềm mại, tràn đầy nắng",
    },
};
/** Kiểm tra một giá trị có phải LutId hợp lệ không. */
export function isLutId(v) {
    return (typeof v === "string" &&
        LUT_IDS.includes(v));
}
/** Tên file .cube tương ứng với một LutId. */
export function lutFileName(id) {
    return `${id}.cube`;
}
/** K3 (Phase 6): kiểm tra id LUT user hợp lệ (mirror lut.ts). */
export function isUserLutId(v) {
    return (typeof v === "string" &&
        /^user-[a-z0-9][a-z0-9-]*$/.test(v) &&
        v.length <= 64);
}
/** K3: tên file dành riêng khi upload LUT user lên bridge. */
export function userLutFileName(id) {
    return `__lut_${id}.cube`;
}
/** Validate VideoFilter, trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateVideoFilter(f) {
    if (f === undefined || f === null)
        return [];
    if (typeof f !== "object" || Array.isArray(f)) {
        return ["filter phải là một object"];
    }
    const errors = [];
    const lut = f.lut;
    if (lut !== undefined && !isLutId(lut) && !isUserLutId(lut)) {
        errors.push(`filter.lut không hợp lệ: ${JSON.stringify(lut)} ` +
            `(chỉ chấp nhận id trong catalog hoặc dạng "user-<slug>")`);
    }
    // R1-075: chỉnh màu thủ công
    for (const m of validateColorAdjust(f.color)) {
        errors.push(m);
    }
    return errors;
}
// ---------------------------------------------------------------------------
// Module augmentation: gắn `filter?` vào VideoClip mà KHÔNG sửa index.ts.
// (index.ts của agent khác — parent sẽ tích hợp chính thức sau.)
// ---------------------------------------------------------------------------
import "./index.js";
