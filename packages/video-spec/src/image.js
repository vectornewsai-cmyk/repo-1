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
import { validateMask } from "./mask.js";
export const IMAGE_DEFAULTS = {
    fit: "contain",
};
export function isImageFit(v) {
    return v === "contain" || v === "cover";
}
export function isImageClip(c) {
    return (typeof c === "object" &&
        c !== null &&
        c["kind"] === "image");
}
function isFiniteNumber(x) {
    return typeof x === "number" && Number.isFinite(x);
}
/** Chuẩn hoá image clip: điền giá trị mặc định cho các trường optional. */
export function normalizeImageClip(c) {
    return {
        kind: "image",
        id: c.id,
        src: c.src,
        start: c.start,
        duration: c.duration,
        fit: c.fit ?? IMAGE_DEFAULTS.fit,
        // Phase 7 P4: giữ mask qua chuẩn hoá (không làm rơi field).
        ...(c.mask ? { mask: c.mask } : {}),
    };
}
/**
 * Validate một image clip. Trả về mảng thông báo lỗi (rỗng = hợp lệ).
 * (Không kiểm tra file tồn tại — việc đó thuộc về validateMedia của render worker.)
 */
export function validateImageClip(c) {
    const errors = [];
    if (typeof c !== "object" || c === null)
        return ["image phải là một object"];
    const s = c;
    const where = `image "${String(s["id"] ?? "?")}"`;
    if (s["kind"] !== "image")
        errors.push(`${where}: kind phải là "image"`);
    if (typeof s["id"] !== "string" || s["id"].length === 0)
        errors.push(`${where}: thiếu id`);
    if (typeof s["src"] !== "string" || s["src"].length === 0)
        errors.push(`${where}: thiếu src (đường dẫn file ảnh)`);
    if (!isFiniteNumber(s["start"]) || s["start"] < 0)
        errors.push(`${where}: start phải là số >= 0`);
    if (!isFiniteNumber(s["duration"]) || s["duration"] <= 0)
        errors.push(`${where}: duration phải là số > 0`);
    if (s["fit"] !== undefined && !isImageFit(s["fit"]))
        errors.push(`${where}: fit phải là "contain" | "cover", nhận được: ${JSON.stringify(s["fit"])}`);
    // Phase 7 P4: mask (rect/ellipse + feather).
    if (s["mask"] !== undefined) {
        for (const m of validateMask(s["mask"]))
            errors.push(`${where}: ${m}`);
    }
    return errors;
}
