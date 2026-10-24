/**
 * sticker.ts — Định nghĩa sticker overlay cho video-spec.
 *
 * Sticker = ảnh PNG (nền trong suốt) dán lên video tại vị trí/tỉ lệ/độ mờ
 * do người dùng chỉnh, kiểu CapCut.
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Render worker triển khai bằng FFmpeg overlay (xem server/render/src/sticker.js).
 *
 * Tích hợp còn thiếu (cho agent chính):
 * - Thêm "sticker" vào union TrackKind trong index.ts
 * - Store/UI: track sticker, panel, preview
 * File này KHÔNG sửa index.ts (theo phân công) — panel UI tự kiểm tra
 * `clip.kind === "sticker"` bằng type guard bên dưới.
 */
export const STICKER_DEFAULTS = {
    x: 0.5,
    y: 0.5,
    scale: 0.25,
    opacity: 1,
    rotation: 0,
};
export const STICKER_CATEGORIES = [
    { id: "emoji", label: "Emoji" },
    { id: "shapes", label: "Hình khối" },
    { id: "arrows", label: "Mũi tên" },
    { id: "badges", label: "Huy hiệu" },
    { id: "bubbles", label: "Bong bóng" },
];
/** Thư viện sticker mẫu đi kèm dự án (tự vẽ 100%, xem assets/stickers/SOURCES.md). */
export const STICKER_LIBRARY = [
    // --- batch 1 (2026-10-19) ---
    { file: "star.png", label: "Ngôi sao", category: "shapes" },
    { file: "heart.png", label: "Trái tim", category: "emoji" },
    { file: "arrow-right.png", label: "Mũi tên", category: "arrows" },
    { file: "lightning.png", label: "Tia sét", category: "emoji" },
    { file: "badge.png", label: "Huy hiệu", category: "badges" },
    { file: "bubble.png", label: "Bong bóng chat", category: "bubbles" },
    // --- batch 2 (2026-10-19, R1-078) ---
    { file: "smile.png", label: "Mặt cười", category: "emoji" },
    { file: "wink.png", label: "Mắt nháy", category: "emoji" },
    { file: "laugh.png", label: "Cười lớn", category: "emoji" },
    { file: "cool.png", label: "Ngầu", category: "emoji" },
    { file: "party.png", label: "Tiệc tùng", category: "emoji" },
    { file: "fire.png", label: "Ngọn lửa", category: "emoji" },
    { file: "shape-circle.png", label: "Hình tròn", category: "shapes" },
    { file: "shape-square.png", label: "Hình vuông", category: "shapes" },
    { file: "shape-triangle.png", label: "Tam giác", category: "shapes" },
    { file: "shape-diamond.png", label: "Hình thoi", category: "shapes" },
    { file: "shape-plus.png", label: "Dấu cộng", category: "shapes" },
    { file: "arrow-up.png", label: "Mũi tên lên", category: "arrows" },
    { file: "arrow-down.png", label: "Mũi tên xuống", category: "arrows" },
    { file: "arrow-left.png", label: "Mũi tên trái", category: "arrows" },
    { file: "arrow-curved.png", label: "Mũi tên cong", category: "arrows" },
    { file: "arrow-double.png", label: "Mũi tên đôi", category: "arrows" },
    { file: "badge-check.png", label: "Tích xanh", category: "badges" },
    { file: "badge-cross.png", label: "Dấu X đỏ", category: "badges" },
    { file: "badge-medal.png", label: "Huy chương", category: "badges" },
    { file: "badge-crown.png", label: "Vương miện", category: "badges" },
    { file: "bubble-speech.png", label: "Bóng thoại", category: "bubbles" },
    { file: "bubble-thought.png", label: "Bóng suy nghĩ", category: "bubbles" },
    { file: "bubble-shout.png", label: "Bóng hét", category: "bubbles" },
    { file: "bubble-tag.png", label: "Thẻ giá", category: "bubbles" },
];
/** URL phục vụ sticker mẫu trong web app (Vite serve apps/web/public/). */
export function stickerUrl(file) {
    return `/stickers/${file}`;
}
export function isStickerClip(c) {
    return (typeof c === "object" &&
        c !== null &&
        c["kind"] === "sticker");
}
function isFiniteNumber(x) {
    return typeof x === "number" && Number.isFinite(x);
}
/** Chuẩn hoá sticker: điền giá trị mặc định cho các trường optional. */
export function normalizeStickerClip(c) {
    return {
        kind: "sticker",
        id: c.id,
        src: c.src,
        start: c.start,
        duration: c.duration,
        x: c.x ?? STICKER_DEFAULTS.x,
        y: c.y ?? STICKER_DEFAULTS.y,
        scale: c.scale ?? STICKER_DEFAULTS.scale,
        opacity: c.opacity ?? STICKER_DEFAULTS.opacity,
        rotation: c.rotation ?? STICKER_DEFAULTS.rotation,
        // Phase 8 Q5: giữ nguyên quỹ đạo tracking nếu có (validate ở dưới).
        ...(c.track !== undefined ? { track: c.track } : {}),
    };
}
/**
 * Validate một sticker clip. Trả về mảng thông báo lỗi (rỗng = hợp lệ).
 * (Không kiểm tra file tồn tại — việc đó thuộc về validateMedia của render worker.)
 */
export function validateStickerClip(c) {
    const errors = [];
    if (typeof c !== "object" || c === null)
        return ["sticker phải là một object"];
    const s = c;
    const where = `sticker "${String(s["id"] ?? "?")}"`;
    if (s["kind"] !== "sticker")
        errors.push(`${where}: kind phải là "sticker"`);
    if (typeof s["id"] !== "string" || s["id"].length === 0)
        errors.push(`${where}: thiếu id`);
    if (typeof s["src"] !== "string" || s["src"].length === 0)
        errors.push(`${where}: thiếu src (đường dẫn file PNG)`);
    if (!isFiniteNumber(s["start"]) || s["start"] < 0)
        errors.push(`${where}: start phải là số >= 0`);
    if (!isFiniteNumber(s["duration"]) || s["duration"] <= 0)
        errors.push(`${where}: duration phải là số > 0`);
    for (const key of ["x", "y"]) {
        const v = s[key];
        if (v !== undefined && (!isFiniteNumber(v) || v < 0 || v > 1))
            errors.push(`${where}: ${key} phải trong khoảng 0..1, nhận được: ${String(v)}`);
    }
    if (s["scale"] !== undefined && (!isFiniteNumber(s["scale"]) || s["scale"] <= 0))
        errors.push(`${where}: scale phải là số > 0, nhận được: ${String(s["scale"])}`);
    if (s["opacity"] !== undefined &&
        (!isFiniteNumber(s["opacity"]) || s["opacity"] < 0 || s["opacity"] > 1))
        errors.push(`${where}: opacity phải trong khoảng 0..1, nhận được: ${String(s["opacity"])}`);
    if (s["rotation"] !== undefined && !isFiniteNumber(s["rotation"]))
        errors.push(`${where}: rotation phải là số (độ), nhận được: ${String(s["rotation"])}`);
    // Phase 8 Q5: quỹ đạo tracking (validate chi tiết trong tracking.js).
    if (s["track"] !== undefined) {
        const tr = s["track"];
        if (!tr || typeof tr !== "object" || !Array.isArray(tr.points) || tr.points.length === 0) {
            errors.push(`${where}: track.points phải là mảng không rỗng`);
        }
        else {
            if (tr.points.length > 240)
                errors.push(`${where}: track.points tối đa 240 điểm, nhận được: ${tr.points.length}`);
            let prevT = -Infinity;
            tr.points.forEach((p, i) => {
                if (!p || typeof p !== "object") {
                    errors.push(`${where}: track.points[${i}] phải là object`);
                    return;
                }
                if (!isFiniteNumber(p.t) || p.t < 0)
                    errors.push(`${where}: track.points[${i}].t phải là số >= 0`);
                if (!isFiniteNumber(p.x) || p.x < 0 || p.x > 1)
                    errors.push(`${where}: track.points[${i}].x phải là số 0..1`);
                if (!isFiniteNumber(p.y) || p.y < 0 || p.y > 1)
                    errors.push(`${where}: track.points[${i}].y phải là số 0..1`);
                if (isFiniteNumber(p.t)) {
                    if (p.t <= prevT && i > 0)
                        errors.push(`${where}: track.points[${i}].t phải tăng dần`);
                    prevT = p.t;
                }
            });
        }
    }
    return errors;
}
