/**
 * enhance.ts — Clip enhancement cho video-spec (Phase 7 P2).
 *
 * NGUYÊN TẮC (giống effects.ts): chỉ đưa vào spec những gì render được THẬT.
 * Mỗi trường dưới đây tương ứng filter NATIVE của FFmpeg trong
 * `server/render/src/enhance.js` và đã được kiểm chứng bằng MP4 thật.
 *
 * ⚠️ MIRROR: validate.js của render worker có bản mirror bằng JS thuần —
 * thêm/sửa type ở đây thì PHẢI cập nhật cả validate.js và enhance.js.
 */
/** Metadata hiển thị cho UI (tiếng Việt). */
export const ENHANCE_META = {
    deinterlace: { label: "Khử răng cưa", description: "Yadif — video interlaced (quay TV/camcorder cũ) về progressive" },
    stabilize: { label: "Chống rung", description: "Vidstab 2-pass — làm mượt chuyển động máy quay rung tay" },
    denoise: { label: "Khử nhiễu", description: "HQDN3D — giảm nhiễu hạt không gian + thời gian" },
};
/** Mặc định vidstab (mirror STABILIZE_DEFAULTS trong enhance.js). */
export const STABILIZE_DEFAULTS = {
    smoothing: 10,
    shakiness: 5,
    accuracy: 15,
    stepsize: 6,
    mincontrast: 0.3,
};
/** Cường độ denoise mặc định khi khai `denoise: true`. */
export const DENOISE_DEFAULT_STRENGTH = 0.5;
