/**
 * audio.ts — Audio routing cho video-spec.
 *
 * Định nghĩa cách xử lý audio stream bên trong file video nguồn:
 * - "inherit": giữ tiếng gốc của video (mặc định) — render sẽ trích audio
 *   từ video source, áp cùng trim/speed/reverse rồi mix vào output.
 * - "mute": bỏ qua audio của video (video câm).
 * - "detach": (chưa hỗ trợ) tách audio thành clip riêng để chỉnh độc lập.
 */
export const SOURCE_AUDIO_MODES = ["inherit", "mute", "detach"];
/** Mặc định: giữ tiếng gốc. */
export const DEFAULT_SOURCE_AUDIO_MODE = "inherit";
export function isSourceAudioMode(v) {
    return typeof v === "string" && SOURCE_AUDIO_MODES.includes(v);
}
/**
 * Validate sourceAudioMode. Trả về danh sách lỗi (rỗng = hợp lệ).
 * "detach" hợp lệ về mặt schema nhưng render worker hiện chưa hỗ trợ
 * (sẽ báo lỗi rõ ràng ở tầng render, không im lặng bỏ qua).
 */
export function validateSourceAudioMode(v) {
    if (v === undefined)
        return [];
    if (!isSourceAudioMode(v)) {
        return [
            `sourceAudioMode phải là một trong ${SOURCE_AUDIO_MODES.map((m) => `"${m}"`).join(" | ")}, ` +
                `nhận được: ${JSON.stringify(v)}`,
        ];
    }
    return [];
}
/** true nếu có ít nhất 1 effect đang bật. */
export function hasAudioEffects(fx) {
    if (!fx)
        return false;
    return (Math.abs(fx.bass ?? 0) > 1e-9 ||
        Math.abs(fx.treble ?? 0) > 1e-9 ||
        (fx.noiseReduction ?? 0) > 1e-9 ||
        fx.compressor !== undefined ||
        (fx.reverb ?? 0) > 1e-9);
}
/** Validate AudioEffects. Trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateAudioEffects(v) {
    if (v === undefined || v === null)
        return [];
    if (typeof v !== "object" || Array.isArray(v))
        return ["audioEffects phải là object"];
    const fx = v;
    const errs = [];
    const numIn = (key, min, max) => {
        const val = fx[key];
        if (val === undefined)
            return;
        if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
            errs.push(`audioEffects.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`);
        }
    };
    numIn("bass", -12, 12);
    numIn("treble", -12, 12);
    numIn("noiseReduction", 0, 1);
    numIn("reverb", 0, 1);
    const c = fx["compressor"];
    if (c !== undefined) {
        if (typeof c !== "object" || c === null || Array.isArray(c)) {
            errs.push("audioEffects.compressor phải là object");
        }
        else {
            const cc = c;
            const cnum = (key, min, max) => {
                const val = cc[key];
                if (val === undefined)
                    return;
                if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
                    errs.push(`audioEffects.compressor.${key} phải là số trong [${min}, ${max}], ` +
                        `nhận được: ${JSON.stringify(val)}`);
                }
            };
            cnum("thresholdDb", -60, 0);
            cnum("ratio", 1, 20);
            cnum("attackMs", 0.1, 2000);
            cnum("releaseMs", 10, 9000);
        }
    }
    return errs;
}
// ---------------------------------------------------------------------------
// Audio ducking — nhạc tự nhỏ khi có lời thoại (kiểu CapCut "ducking").
// Cấp PROJECT. Render: server/render/src/render.js tách mix thành 2 nhánh
// (voice mix + music mix), áp FFmpeg `sidechaincompress` rồi amix lại —
// xem DUCKING_LIMITS.md. Mặc định TẮT: không khai `ducking`, hoặc `enabled`
// khác true, thì render y hệt cũ.
// ---------------------------------------------------------------------------
/** Giá trị mặc định của ducking khi field bị bỏ trống (enabled vẫn tắt). */
export const DEFAULT_DUCKING_SETTINGS = {
    thresholdDb: -20,
    ratio: 4,
    attackMs: 20,
    releaseMs: 250,
    duckAmountDb: 12,
};
/** true khi ducking được bật rõ ràng (enabled === true). */
export function isDuckingEnabled(d) {
    return d?.enabled === true;
}
/** Validate DuckingSettings. Trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateDuckingSettings(v) {
    if (v === undefined || v === null)
        return [];
    if (typeof v !== "object" || Array.isArray(v))
        return ["ducking phải là object"];
    const d = v;
    const errs = [];
    if (d["enabled"] !== undefined && typeof d["enabled"] !== "boolean") {
        errs.push(`ducking.enabled phải là boolean, nhận được: ${JSON.stringify(d["enabled"])}`);
    }
    const vt = d["voiceTrackId"];
    if (vt !== undefined && (typeof vt !== "string" || vt.length === 0)) {
        errs.push(`ducking.voiceTrackId phải là chuỗi id track khác rỗng, nhận được: ${JSON.stringify(vt)}`);
    }
    if (d["enabled"] === true && vt === undefined) {
        errs.push("ducking.enabled=true nhưng thiếu voiceTrackId (chưa chọn track giọng)");
    }
    const numIn = (key, min, max) => {
        const val = d[key];
        if (val === undefined)
            return;
        if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
            errs.push(`ducking.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`);
        }
    };
    numIn("thresholdDb", -60, 0);
    numIn("ratio", 1, 20);
    numIn("attackMs", 0.1, 2000);
    numIn("releaseMs", 10, 9000);
    numIn("duckAmountDb", 0, 24);
    return errs;
}
// ---------------------------------------------------------------------------
// Module augmentation: gắn `ducking?` vào VideoSpec mà KHÔNG sửa index.ts.
// (index.ts thuộc sở hữu của agent chính — khi index.ts chính thức hỗ trợ
// field này thì xóa block này đi. Cùng mẫu với chroma.ts / lut.ts.)
// ---------------------------------------------------------------------------
import "./index.js";
