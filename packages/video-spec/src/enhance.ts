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

/**
 * Tham số chống rung vidstab (2-pass: detect rồi transform).
 * CHIA PASS (phát hiện khi test thật trên FFmpeg 8.1.2 — đưa nhầm là fail job):
 * - smoothing: dùng ở pass TRANSFORM (lowpass, số frame*2+1).
 * - shakiness/accuracy/stepsize/mincontrast: chỉ dùng ở pass DETECT.
 */
export interface StabilizeParams {
  /** Số frame làm mượt (transform), 1..100, mặc định 10 */
  smoothing?: number;
  /** Độ rung kỳ vọng (detect), 1..10, mặc định 5 */
  shakiness?: number;
  /** Độ chính xác (detect), 1..15, mặc định 15 */
  accuracy?: number;
  /** Bước tìm kiếm pixel (detect), 1..32, mặc định 6 */
  stepsize?: number;
  /** Ngưỡng tương phản tối thiểu (detect), 0..1, mặc định 0.3 */
  mincontrast?: number;
}

/** Tham số khử nhiễu hqdn3d. */
export interface DenoiseParams {
  /** Cường độ 0..1, mặc định 0.5 */
  strength?: number;
}

/** Tham số khử răng cưa yadif. */
export interface DeinterlaceParams {
  /**
   * 0 = 1 frame / cặp field (giữ fps, mặc định, an toàn với fps filter sau đó);
   * 1 = 1 frame / field (tăng gấp đôi fps — fps filter sau đó sẽ resample).
   */
  mode?: 0 | 1;
}

/**
 * Enhancement áp lên video clip. Tất cả optional; không khai = hành vi cũ.
 * - deinterlace: yadif, chạy TRƯỚC scale (scale trên frame interlaced sẽ
 *   "nướng" răng cưa vào ảnh).
 * - stabilize: vidstab 2-pass, transform chạy sau trim/setpts, trước speed
 *   (cùng đoạn nguồn đã phân tích ở pass detect).
 * - denoise: hqdn3d, chạy SAU scale/pad cùng vị trí effects.
 */
export interface ClipEnhance {
  /** true = mode 0 mặc định */
  deinterlace?: boolean | DeinterlaceParams;
  stabilize?: StabilizeParams;
  /** true = strength 0.5 mặc định */
  denoise?: boolean | DenoiseParams;
}

/** Metadata hiển thị cho UI (tiếng Việt). */
export const ENHANCE_META = {
  deinterlace: { label: "Khử răng cưa", description: "Yadif — video interlaced (quay TV/camcorder cũ) về progressive" },
  stabilize: { label: "Chống rung", description: "Vidstab 2-pass — làm mượt chuyển động máy quay rung tay" },
  denoise: { label: "Khử nhiễu", description: "HQDN3D — giảm nhiễu hạt không gian + thời gian" },
} as const;

/** Mặc định vidstab (mirror STABILIZE_DEFAULTS trong enhance.js). */
export const STABILIZE_DEFAULTS: Required<StabilizeParams> = {
  smoothing: 10,
  shakiness: 5,
  accuracy: 15,
  stepsize: 6,
  mincontrast: 0.3,
};

/** Cường độ denoise mặc định khi khai `denoise: true`. */
export const DENOISE_DEFAULT_STRENGTH = 0.5;
