/**
 * video-spec v0.2.0 — "ngôn ngữ chung" của dự án.
 *
 * Mọi thứ trong editor đều biểu diễn được bằng JSON theo schema này.
 * - apps/web: UI đọc/ghi spec này (project model).
 * - server/render: đọc spec này để render MP4 bằng FFmpeg.
 * - mcp-server (Phase 4): AI agent sinh spec này để tạo video.
 *
 * NGUYÊN TẮC: chỉ đưa vào spec những gì render được THẬT.
 * Thêm field mới = phải implement ở cả preview (web) lẫn render (ffmpeg).
 *
 * ## Versioning (R1-019)
 * Xem ./migrations.ts và ./SCHEMA_VERSIONING.md.
 * - 0.1.0: schema gốc (video/audio/text tracks)
 * - 0.2.0: thêm sticker/image kinds, filter/effects/chroma/keyframes
 */
export const SPEC_VERSION = "0.2.0";
// Schema versioning & migration (R1-019)
export * from "./migrations.js";
// Re-export các module tính năng (Phase 3): transitions, speed, keyframes.
export * from "./transitions.js";
export * from "./speed.js";
export * from "./keyframes.js";
// Phase 3b: chroma key, text animations.
export * from "./chroma.js";
export * from "./textfx.js";
// Phase 3c: LUT filters, video effects, stickers.
export * from "./lut.js";
export * from "./effects.js";
export * from "./sticker.js";
// R1-074/075: chỉnh màu thủ công (color correction/grading).
export * from "./color.js";
// P0-03: image clip (ảnh tĩnh thành media type chính thức).
export * from "./image.js";
// Phase 7 P4: mask cho clip video/image.
export * from "./mask.js";
// Phase 7 P2: clip enhancement (deinterlace/stabilize/denoise).
export * from "./enhance.js";
// R1-015: audio routing cho video nguồn (inherit/mute/detach).
export * from "./audio.js";
// R1-055: frame-accurate timebase (snap theo frame, timecode).
export * from "./timebase.js";
/** Kiểm tra nhanh spec có hợp lệ tối thiểu không (validate đầy đủ bằng zod ở render worker). */
export function isVideoSpec(v) {
    if (typeof v !== "object" || v === null)
        return false;
    const s = v;
    return (s["version"] === SPEC_VERSION &&
        typeof s["meta"] === "object" &&
        Array.isArray(s["tracks"]));
}
/** Tính tổng thời lượng project (giây) = clip kết thúc muộn nhất. */
export function projectDuration(spec) {
    let max = 0;
    for (const t of spec.tracks) {
        for (const c of t.clips) {
            max = Math.max(max, c.start + c.duration);
        }
    }
    return max;
}
