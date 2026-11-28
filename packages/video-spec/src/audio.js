/**
 * audio.ts — Audio routing cho video-spec.
 *
 * Định nghĩa cách xử lý audio stream bên trong file video nguồn:
 * - "inherit": giữ tiếng gốc của video (mặc định) — render sẽ trích audio
 *   từ video source, áp cùng trim/speed/reverse rồi mix vào output.
 * - "mute": bỏ qua audio của video (video câm).
 * - "detach": (chưa hỗ trợ) tách audio thành clip riêng để chỉnh độc lập.
 */
/**
 * Phase 7 P3 — Đường cong fade (áp cho fadeIn/fadeOut của AudioClip).
 * - "linear": tuyến tính (khớp afade cũ).
 * - "ease-in": p^2 (mở đầu chậm, về cuối nhanh).
 * - "ease-out": 1-(1-p)^2 (mở đầu nhanh, về cuối chậm).
 * - "sine": sin(p·π/2) cho fade-in, sin(q·π/2) cho fade-out (mượt kiểu equal-power).
 * Mặc định khi không khai: "linear".
 * Đợt 52 I7: bổ sung mirror của FADE_CURVES bên audio.ts (tiền sẵn từ
 * đợt 51 §4.5 — checker Tier A từng ghi KNOWN thiếu trong .js).
 */
export const FADE_CURVES = ["linear", "ease-in", "ease-out", "sine"];
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
        (fx.reverb ?? 0) > 1e-9 ||
        fx.voice !== undefined);
}
// ---------------------------------------------------------------------------
// Đợt 191 P1 — Mặc định + resolve cho voice effects (mirror audio.ts).
// Cùng 1 nguồn số cho cả render (FFmpeg) và preview (Web Audio).
// ---------------------------------------------------------------------------
/** Robot mặc định: vibrato f=25 Hz (mirror voicefx.js). */
export const DEFAULT_VOICE_ROBOT_RATE = 25;
/** Robot mặc định: vibrato d=0.6 (mirror voicefx.js). */
export const DEFAULT_VOICE_ROBOT_DEPTH = 0.6;
/** Echo mặc định: aecho delays=200 ms (mirror voicefx.js). */
export const DEFAULT_VOICE_ECHO_DELAY_MS = 200;
/** Echo mặc định: aecho decays=0.5 (mirror voicefx.js). */
export const DEFAULT_VOICE_ECHO_DECAY = 0.5;
/**
 * Hằng số aecho của render (đo thật bằng impulse trên FFmpeg 8.1.2,
 * đợt 191 P1): out = outGain × (inGain × in + Σ decay × in(t−delay)).
 * Dry = inGain × outGain = 0.72 (không phải inGain 0.8); wet = outGain × decay.
 */
export const VOICE_ECHO_IN_GAIN = 0.8;
/** Xem VOICE_ECHO_IN_GAIN. */
export const VOICE_ECHO_OUT_GAIN = 0.9;
/** true nếu có ít nhất 1 voice effect đang bật (mirror voicefx.js hasVoiceEffect). */
export function hasVoiceEffect(voice) {
    if (!voice || typeof voice !== "object")
        return false;
    if (Math.abs(Number(voice.pitch ?? 0)) > 1e-9)
        return true;
    if (voice.robot !== undefined && voice.robot !== false)
        return true;
    if (voice.telephone === true)
        return true;
    if (voice.echo !== undefined && voice.echo !== false)
        return true;
    return false;
}
/**
 * Resolve VoiceEffect về tham số cụ thể, điền mặc định render khi field thiếu.
 * robot true → { rate: 25, depth: 0.6 }; echo true → { delayMs: 200, decay: 0.5 }.
 * Không validate khoảng — validateAudioEffects vẫn là cổng chặn giá trị sai.
 */
export function resolveVoiceEffect(voice) {
    const pitch = Number(voice?.pitch ?? 0);
    const robotRaw = voice?.robot;
    const robot = robotRaw === undefined || robotRaw === false
        ? null
        : {
            rate: robotRaw === true ? DEFAULT_VOICE_ROBOT_RATE : Number(robotRaw.rate ?? DEFAULT_VOICE_ROBOT_RATE),
            depth: robotRaw === true ? DEFAULT_VOICE_ROBOT_DEPTH : Number(robotRaw.depth ?? DEFAULT_VOICE_ROBOT_DEPTH),
        };
    const echoRaw = voice?.echo;
    const echo = echoRaw === undefined || echoRaw === false
        ? null
        : {
            delayMs: echoRaw === true ? DEFAULT_VOICE_ECHO_DELAY_MS : Number(echoRaw.delayMs ?? DEFAULT_VOICE_ECHO_DELAY_MS),
            decay: echoRaw === true ? DEFAULT_VOICE_ECHO_DECAY : Number(echoRaw.decay ?? DEFAULT_VOICE_ECHO_DECAY),
        };
    return {
        active: hasVoiceEffect(voice),
        pitchSemitones: pitch,
        pitchRatio: Math.pow(2, pitch / 12),
        robot,
        telephone: voice?.telephone === true,
        echo,
    };
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
    // Phase 8 Q5: voice effects (mirror audio.ts — bản .js cũ thiếu đoạn này,
    // đợt 191 P1 bổ sung cho khớp; trước đây validate web bỏ qua voice sai).
    const voice = fx["voice"];
    if (voice !== undefined) {
        if (typeof voice !== "object" || voice === null || Array.isArray(voice)) {
            errs.push("audioEffects.voice phải là object");
        }
        else {
            const vv = voice;
            const vnum = (key, min, max) => {
                const val = vv[key];
                if (val === undefined)
                    return;
                if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
                    errs.push(`audioEffects.voice.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`);
                }
            };
            vnum("pitch", -12, 12);
            const r = vv["robot"];
            if (r !== undefined && r !== true && r !== false) {
                if (typeof r !== "object" || r === null || Array.isArray(r)) {
                    errs.push("audioEffects.voice.robot phải là true hoặc object { rate?, depth? }");
                }
                else {
                    const rr = r;
                    const rnum = (key, min, max) => {
                        const val = rr[key];
                        if (val === undefined)
                            return;
                        if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
                            errs.push(`audioEffects.voice.robot.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`);
                        }
                    };
                    rnum("rate", 5, 60);
                    rnum("depth", 0, 1);
                }
            }
            if (vv["telephone"] !== undefined && typeof vv["telephone"] !== "boolean")
                errs.push("audioEffects.voice.telephone phải là boolean");
            const e = vv["echo"];
            if (e !== undefined && e !== true && e !== false) {
                if (typeof e !== "object" || e === null || Array.isArray(e)) {
                    errs.push("audioEffects.voice.echo phải là true hoặc object { delayMs?, decay? }");
                }
                else {
                    const ee = e;
                    const enm = (key, min, max) => {
                        const val = ee[key];
                        if (val === undefined)
                            return;
                        if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
                            errs.push(`audioEffects.voice.echo.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`);
                        }
                    };
                    enm("delayMs", 50, 1000);
                    enm("decay", 0, 1);
                }
            }
        }
    }
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
