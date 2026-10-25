/**
 * validate.js — Kiểm tra video-spec v0.1.0 trước khi render.
 *
 * Đây là bản mirror bằng JavaScript thuần của `packages/video-spec/src/index.ts`
 * (không import trực tiếp được TypeScript nên viết lại thủ công).
 * ⚠️ Mọi thay đổi schema ở video-spec PHẢI được cập nhật ở đây.
 *
 * Nguyên tắc: gom TẤT CẢ lỗi rồi trả về một lần để người dùng sửa một lượt.
 * Không throw giữa chừng (trừ lỗi hệ thống như ffprobe crash).
 */
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { isSupportedTransition } = require("./transitions");
const { SPEED_MIN, SPEED_MAX } = require("./speed");
const { validateAnimations, SCALE_MIN, SCALE_MAX } = require("./keyframes");
const { validateChroma } = require("./chroma");
const { isTextFxAnimation } = require("./textfx");
const { validateVideoFilter } = require("./lut");
const { validateEffects: validateVideoEffects } = require("./effects");
const { validateSticker } = require("./sticker");
const { validateTrackAttachment } = require("./tracking_validate");
const { validateSourceAudioMode, validateAudioEffects } = require("./audioroute");
const { validateImage } = require("./image");
const { validateOpacity } = require("./opacity");
// Phase 7 P2: clip enhancement (deinterlace/stabilize/denoise)
const { validateEnhance } = require("./enhance");
// Phase 7 P4: mask cho clip video/image.
const { validateMask } = require("./mask");
// Phase 7 P3: speed ramp — chỉ dùng hàm toán (không dùng chain builder) để
// tính nguồn tiêu thụ cho cảnh báo out lệch.
const { sourceConsumed } = require("./speedramp");

const SPEC_VERSION = "0.2.0";
/** Các version cũ vẫn đọc được (backward compat). */
const SUPPORTED_VERSIONS = new Set(["0.1.0", "0.2.0"]);
/** Sai số khi so sánh số thực (giây). */
const EPS = 1e-6;
/** Dung sai khi so sánh out với duration file thực (metadata container có thể lệch chút). */
const MEDIA_EPS = 0.15;
/** Codec của ảnh tĩnh — video clip từ chối ảnh (dùng image track thay thế, xem P0-03). */
const STILL_CODECS = new Set(["png", "bmp", "tiff", "mjpeg", "mng"]);

/**
 * Mirror của isVideoSpec() trong packages/video-spec — kiểm tra tối thiểu.
 * @param {unknown} v
 * @returns {v is object}
 */
function isVideoSpec(v) {
  if (typeof v !== "object" || v === null) return false;
  return (
    SUPPORTED_VERSIONS.has(v.version) &&
    typeof v.meta === "object" &&
    v.meta !== null &&
    Array.isArray(v.tracks)
  );
}

function isHexColor(s) {
  return typeof s === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

/**
 * Validate cấu trúc spec (không chạm vào file media).
 * @returns {{ ok: boolean, errors: string[], warnings: string[], transitions: Array<{trackId:string,from:string,to:string,duration:number}> }}
 */
function validateSpec(spec) {
  const errors = [];
  const warnings = [];
  /** @type {Array<{trackId:string,from:string,to:string,duration:number}>} */
  const transitions = [];
  const err = (where, msg) => errors.push(`[${where}] ${msg}`);
  const warn = (where, msg) => warnings.push(`[${where}] ${msg}`);

  if (typeof spec !== "object" || spec === null) {
    return { ok: false, errors: ["spec phải là một object JSON"], warnings, transitions };
  }

  // ---- version ----
  if (!SUPPORTED_VERSIONS.has(spec.version)) {
    err("version", `không hỗ trợ "${spec.version}" — worker này chỉ render spec version ${[...SUPPORTED_VERSIONS].join(", ")}`);
  }

  // ---- meta ----
  const meta = spec.meta;
  if (typeof meta !== "object" || meta === null) {
    err("meta", "thiếu object meta");
  } else {
    if (typeof meta.name !== "string" || meta.name.length === 0)
      err("meta.name", "phải là chuỗi khác rỗng");
    if (!Number.isInteger(meta.width) || meta.width <= 0)
      err("meta.width", `phải là số nguyên dương, nhận được: ${meta.width}`);
    else if (meta.width % 2 !== 0)
      err("meta.width", `phải là số chẵn (yêu cầu của H.264), nhận được: ${meta.width}`);
    if (!Number.isInteger(meta.height) || meta.height <= 0)
      err("meta.height", `phải là số nguyên dương, nhận được: ${meta.height}`);
    else if (meta.height % 2 !== 0)
      err("meta.height", `phải là số chẵn (yêu cầu của H.264), nhận được: ${meta.height}`);
    if (!isFiniteNumber(meta.fps) || meta.fps <= 0)
      err("meta.fps", `phải là số dương, nhận được: ${meta.fps}`);
  }

  // ---- plugins (tùy chọn — Batch J plugin wiring) ----
  // Mirror của PluginRef trong packages/video-spec/src/index.ts.
  // Chỉ kiểm tra CẤU TRÚC ở đây; việc nạp plugin (đọc file, sandbox, manifest)
  // do render worker làm sau khi validate xong (src/plugins.js). Không có
  // trường `plugins` = hành vi cũ, không kiểm tra gì thêm.
  if (spec.plugins !== undefined) {
    if (!Array.isArray(spec.plugins)) {
      err("plugins", "phải là một mảng các { id | path, config? }");
    } else {
      const seenPluginKeys = new Set();
      spec.plugins.forEach((p, pi) => {
        const pw = `plugins[${pi}]`;
        if (typeof p !== "object" || p === null || Array.isArray(p)) {
          err(pw, "phải là object { id | path, config? }"); return;
        }
        const hasId = typeof p.id === "string" && p.id.length > 0;
        const hasPath = typeof p.path === "string" && p.path.length > 0;
        if (p.id !== undefined && !hasId)
          err(`${pw}.id`, `phải là chuỗi khác rỗng, nhận được: ${JSON.stringify(p.id)}`);
        if (p.path !== undefined && !hasPath)
          err(`${pw}.path`, `phải là chuỗi khác rỗng, nhận được: ${JSON.stringify(p.path)}`);
        if (hasId && hasPath)
          err(pw, "chỉ khai đúng MỘT trong hai: id hoặc path");
        if (!hasId && !hasPath)
          err(pw, "thiếu id (plugin đóng gói sẵn) hoặc path (file plugin.js)");
        // id được join vào plugins/<id>/plugin.js nên cấm ký tự đường dẫn.
        if (hasId && !/^[a-z0-9][a-z0-9-]*$/.test(p.id))
          err(`${pw}.id`, `id chỉ gồm chữ thường, số và dấu "-" (nhận: ${JSON.stringify(p.id)})`);
        if (hasPath && !p.path.endsWith(".js"))
          err(`${pw}.path`, `path phải trỏ tới file .js (nhận: ${JSON.stringify(p.path)})`);
        if (p.config !== undefined &&
            (typeof p.config !== "object" || p.config === null || Array.isArray(p.config)))
          err(`${pw}.config`, "config phải là object JSON thuần");
        const key = hasId ? `id:${p.id}` : hasPath ? `path:${p.path}` : null;
        if (key) {
          if (seenPluginKeys.has(key))
            warn(pw, `plugin "${key.slice(key.indexOf(":") + 1)}" khai báo trùng — registry sẽ từ chối nạp bản thứ hai`);
          seenPluginKeys.add(key);
        }
      });
    }
  }

  // ---- tracks ----
  if (!Array.isArray(spec.tracks)) {
    err("tracks", "phải là một mảng");
    return { ok: errors.length === 0, errors, warnings, transitions };
  }
  if (spec.tracks.length === 0) {
    err("tracks", "mảng rỗng — không có gì để render");
    return { ok: errors.length === 0, errors, warnings, transitions };
  }

  const seenTrackIds = new Set();

  for (let ti = 0; ti < spec.tracks.length; ti++) {
    const track = spec.tracks[ti];
    const tw = `tracks[${ti}]`;
    if (typeof track !== "object" || track === null) {
      err(tw, "phải là object"); continue;
    }
    if (typeof track.id !== "string" || track.id.length === 0) {
      err(tw, "thiếu id (chuỗi khác rỗng)"); continue;
    }
    if (seenTrackIds.has(track.id)) err(tw, `trùng id track: "${track.id}"`);
    seenTrackIds.add(track.id);
    if (!["video", "audio", "text", "sticker", "image"].includes(track.kind)) {
      err(`${tw}.kind`, `phải là "video" | "audio" | "text" | "sticker" | "image", nhận được: ${JSON.stringify(track.kind)}`);
      continue;
    }
    // R1-054: track controls — 3 flag boolean tùy chọn.
    for (const flag of ["muted", "locked", "hidden"]) {
      if (track[flag] !== undefined && typeof track[flag] !== "boolean") {
        err(`${tw}.${flag}`, "phải là boolean");
      }
    }
    // Phase 7 P3: track volume (0..2, mặc định 1) — nhân vào gain mọi clip trên track.
    if (track.volume !== undefined &&
        (!isFiniteNumber(track.volume) || track.volume < 0 || track.volume > 2)) {
      err(`${tw}.volume`, `phải trong khoảng 0..2, nhận được: ${track.volume}`);
    }
    if (track.kind === "audio" && track.hidden === true) {
      warn(`${tw}: hidden không có tác dụng với track audio (chỉ mute mới tắt tiếng)`);
    }
    if (!Array.isArray(track.clips)) {
      err(`${tw}.clips`, "phải là một mảng"); continue;
    }

    const clips = track.clips;
    // Validate từng clip
    for (let ci = 0; ci < clips.length; ci++) {
      validateClip(track, clips[ci], `${tw}.clips[${ci}]`, err, warn);
    }

    // Clip trên cùng track video/image không được chồng lấn thời gian
    // (track khác nhau được phép chồng — sẽ composite theo thứ tự track).
    if (track.kind === "video" || track.kind === "image") {
      const sorted = [...clips].sort((a, b) => a.start - b.start);
      for (let i = 0; i + 1 < sorted.length; i++) {
        const a = sorted[i], b = sorted[i + 1];
        if (a.start + a.duration > b.start + EPS) {
          err(tw, `clip "${a.id}" [${a.start}, ${a.start + a.duration}] chồng lấn clip "${b.id}" ` +
            `(bắt đầu ${b.start}) — trên cùng một track ${track.kind} các clip không được đè lên nhau`);
        }
      }
    }

    // Ghép cặp transition: transitionOut của clip A cần clip B kề ngay sau trên cùng track.
    // Hỗ trợ mọi transition type (trừ "none").
    if (track.kind === "video") {
      const sorted = [...clips].sort((a, b) => a.start - b.start);
      for (let i = 0; i < sorted.length; i++) {
        const clip = sorted[i];
        const outTr = clip.transitionOut && clip.transitionOut.type !== "none" ? clip.transitionOut : null;
        const next = sorted[i + 1] || null;
        const inTr = next && next.transitionIn && next.transitionIn.type !== "none" ? next.transitionIn : null;
        const outT = outTr ? outTr.duration : 0;
        const inT = inTr ? inTr.duration : 0;

        if (outT > EPS || inT > EPS) {
          // Phải có clip kề sau, bắt đầu đúng lúc clip hiện tại kết thúc.
          if (!next || Math.abs(next.start - (clip.start + clip.duration)) > EPS) {
            err(`${tw}.clips "${clip.id}"`,
              `có transition (${outTr ? outTr.type : inTr.type}) nhưng không có clip kề ngay sau trên cùng track ` +
              `(clip kết thúc ở ${clip.start + clip.duration}s) — transition yêu cầu 2 clip nối tiếp nhau`);
            continue;
          }
          if (outT > EPS && inT > EPS && Math.abs(outT - inT) > EPS) {
            err(`${tw}.clips "${clip.id}"`,
              `transitionOut (${outT}s) và transitionIn của clip "${next.id}" (${inT}s) không khớp nhau — ` +
              `chỉ đặt một trong hai, hoặc đặt bằng nhau`);
            continue;
          }
          const T = Math.max(outT, inT);
          const Ttype = outT >= inT ? outTr.type : inTr.type;
          if (T > clip.duration + EPS)
            err(`${tw}.clips "${clip.id}"`, `transition (${T}s) dài hơn cả clip (${clip.duration}s)`);
          if (T > next.duration + EPS)
            err(`${tw}.clips "${next.id}"`, `transition (${T}s) dài hơn cả clip (${next.duration}s)`);
          // Ghi nhận cặp transition — chỉ dùng khi spec hợp lệ (ok === true),
          // nên dù có lỗi ở trên thì entry này cũng không bao giờ được render.
          transitions.push({ trackId: track.id, from: clip.id, to: next.id, duration: T, type: Ttype });
        } else if (clip.transitionIn && clip.transitionIn.type !== "none" && i === 0) {
          warn(`${tw}.clips "${clip.id}"`, "có transitionIn nhưng là clip đầu track — transition bị bỏ qua");
        }
      }
    }
  }

  // R1-011: opacity kết hợp transition — unit đã merge dùng opacity của clip đích
  // cho toàn bộ đoạn chuyển cảnh (xem OPACITY_LIMITS.md).
  for (const tr of transitions) {
    const track = spec.tracks.find((t) => t.id === tr.trackId);
    if (!track || !Array.isArray(track.clips)) continue;
    const from = track.clips.find((c) => c.id === tr.from);
    const to = track.clips.find((c) => c.id === tr.to);
    for (const c of [from, to]) {
      if (c && c.opacity !== undefined && c.opacity < 1 - EPS) {
        warn(`tracks "${track.id}" clips "${c.id}"`,
          `có opacity=${c.opacity} và transition — đoạn chuyển cảnh đã merge sẽ dùng ` +
          `opacity của clip đích ("${to.id}") cho toàn bộ unit (xem OPACITY_LIMITS.md)`);
        break;
      }
    }
  }

  // Keyframes scale/rotation kết hợp transition: unit bị gộp qua xfade trước khi
  // đặt lên timeline nên render BỎ QUA scale/rotation của cả 2 clip trong cặp
  // (giống keyframes x/y cho unit đã merge). Cảnh báo rõ thay vì render sai lặng lẽ.
  for (const tr of transitions) {
    const track = spec.tracks.find((t) => t.id === tr.trackId);
    if (!track || !Array.isArray(track.clips)) continue;
    for (const id of [tr.from, tr.to]) {
      const c = track.clips.find((cl) => cl.id === id);
      if (c && c.animations && (c.animations.scale || c.animations.rotation)) {
        warn(`tracks "${track.id}" clips "${c.id}"`,
          `có keyframes scale/rotation và transition — đoạn chuyển cảnh được gộp qua xfade ` +
          `nên keyframes scale/rotation của clip này bị bỏ qua khi render (xem KEYFRAMES_LIMITS.md)`);
      }
    }
  }

  // K1 (Phase 6): opacity keyframes kết hợp transition — giống SR, unit đã
  // merge không áp được keyframes opacity (timestamp của stream đã gộp
  // không còn khớp thời gian cục bộ của từng clip) nên render bỏ qua và
  // dùng opacity tĩnh của clip đích. Cảnh báo rõ thay vì render sai lặng lẽ.
  for (const tr of transitions) {
    const track = spec.tracks.find((t) => t.id === tr.trackId);
    if (!track || !Array.isArray(track.clips)) continue;
    for (const id of [tr.from, tr.to]) {
      const c = track.clips.find((cl) => cl.id === id);
      if (c && c.animations && c.animations.opacity) {
        warn(`tracks "${track.id}" clips "${c.id}"`,
          `có keyframes opacity và transition — đoạn chuyển cảnh được gộp qua xfade ` +
          `nên keyframes opacity của clip này bị bỏ qua khi render (dùng opacity tĩnh ` +
          `của clip đích, xem OPACITY_LIMITS.md)`);
      }
    }
  }

  // Tổng thời lượng phải > 0
  let D = 0;
  for (const t of spec.tracks) {
    if (!Array.isArray(t.clips)) continue;
    for (const c of t.clips) {
      if (isFiniteNumber(c.start) && isFiniteNumber(c.duration)) {
        D = Math.max(D, c.start + c.duration);
      }
    }
  }
  if (!(D > 0)) err("tracks", "tổng thời lượng project phải > 0");

  return { ok: errors.length === 0, errors, warnings, transitions };
}

/** Validate một clip theo kind của track. */
function validateVolumeKeyframes(v, duration) {
  // R1-063: kiểm tra hình dạng { keyframes: [{ t, v, easing }] } cho AudioClip.volumeKeyframes.
  const msgs = [];
  if (typeof v !== "object" || v === null || !Array.isArray(v.keyframes)) {
    msgs.push("volumeKeyframes phải là object { keyframes: [...] }");
    return msgs;
  }
  const kfs = v.keyframes;
  if (kfs.length === 0) msgs.push("volumeKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe");
  if (kfs.length > 128) msgs.push("volumeKeyframes.keyframes: quá 128 keyframe");
  kfs.forEach((kf, i) => {
    const w = `volumeKeyframes.keyframes[${i}]`;
    if (typeof kf !== "object" || kf === null) {
      msgs.push(`${w} phải là object { t, v, easing }`);
      return;
    }
    if (!isFiniteNumber(kf.t) || kf.t < 0 || kf.t > duration + EPS)
      msgs.push(`${w}.t phải trong [0, ${duration}] (nhận được: ${kf.t})`);
    if (!isFiniteNumber(kf.v) || kf.v < 0 || kf.v > 1)
      msgs.push(`${w}.v phải trong 0..1 (nhận được: ${kf.v})`);
    if (!["linear", "ease-in", "ease-out"].includes(kf.easing))
      msgs.push(`${w}.easing phải là linear | ease-in | ease-out (nhận được: ${JSON.stringify(kf.easing)})`);
  });
  return msgs;
}

// ---------------------------------------------------------------------------
// Phase 7 P3: validate speedKeyframes (speed ramp) cho VideoClip/AudioClip.
// Trả về { errors, warnings } (tách riêng để caller ghi warn đúng kênh).
// ---------------------------------------------------------------------------
function validateSpeedKeyframes(v, duration) {
  const errors = [];
  const warnings = [];
  if (typeof v !== "object" || v === null || !Array.isArray(v.keyframes)) {
    errors.push("speedKeyframes phải là object { keyframes: [...] }");
    return { errors, warnings };
  }
  const kfs = v.keyframes;
  if (kfs.length === 0) errors.push("speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe");
  if (kfs.length > 128) errors.push("speedKeyframes.keyframes: quá 128 keyframe");
  let shapeOk = true;
  kfs.forEach((kf, i) => {
    const w = `speedKeyframes.keyframes[${i}]`;
    if (typeof kf !== "object" || kf === null) {
      errors.push(`${w} phải là object { t, v, easing }`);
      shapeOk = false;
      return;
    }
    if (!isFiniteNumber(kf.t) || kf.t < 0 || kf.t > duration + EPS) {
      errors.push(`${w}.t phải trong [0, ${duration}] (nhận được: ${kf.t})`);
      shapeOk = false;
    }
    if (!isFiniteNumber(kf.v) || kf.v < SPEED_MIN || kf.v > SPEED_MAX) {
      errors.push(`${w}.v phải trong ${SPEED_MIN}..${SPEED_MAX} (nhận được: ${kf.v})`);
      shapeOk = false;
    }
    if (!["linear", "ease-in", "ease-out", "bezier"].includes(kf.easing)) {
      errors.push(`${w}.easing phải là linear | ease-in | ease-out | bezier (nhận được: ${JSON.stringify(kf.easing)})`);
      shapeOk = false;
    }
    if (kf.easing === "bezier") {
      const b = kf.bezier;
      if (!Array.isArray(b) || b.length !== 4 || !b.every((x) => isFiniteNumber(x) && x >= 0 && x <= 1)) {
        errors.push(`${w}.bezier phải là [x1, y1, x2, y2], mỗi số trong [0, 1] (nhận được: ${JSON.stringify(b)})`);
        shapeOk = false;
      }
    }
  });
  if (shapeOk && kfs.length > 0 && isFiniteNumber(duration) && duration > 0) {
    // Thông tin nguồn tiêu thụ (ramp mode bỏ qua out, dùng in + ∫speed).
    try {
      const consumed = sourceConsumed({ keyframes: kfs }, duration);
      if (isFiniteNumber(consumed)) {
        warnings.push(
          `speedKeyframes đang bật: nguồn tiêu thụ = ${consumed.toFixed(3)}s ` +
          `(∫speed trên duration=${duration}s) — render dùng in + nguồn tiêu thụ, ` +
          `không dùng out (xem P3_LIMITS.md)`
        );
      }
    } catch { /* toán lỗi → shape đã báo ở trên, không cảnh báo thêm */ }
  }
  return { errors, warnings };
}

/** Validate một clip theo kind của track. */
function validateClip(track, clip, where, err, warn) {
  if (typeof clip !== "object" || clip === null) {
    err(where, "phải là object"); return;
  }
  if (typeof clip.id !== "string" || clip.id.length === 0) {
    err(where, "thiếu id (chuỗi khác rỗng)"); return;
  }
  if (clip.kind !== track.kind) {
    err(where, `clip.kind là "${clip.kind}" nhưng nằm trong track kind "${track.kind}" — phải khớp nhau`);
  }
  if (!isFiniteNumber(clip.start) || clip.start < 0)
    err(where, `start phải là số >= 0, nhận được: ${clip.start}`);
  if (!isFiniteNumber(clip.duration) || clip.duration <= 0)
    err(where, `duration phải là số > 0, nhận được: ${clip.duration}`);
  // Phase 7 P2: enhance chỉ dùng cho video clip.
  if (track.kind !== "video" && clip.enhance !== undefined)
    err(where, "enhance chỉ dùng cho video clip");

  if (track.kind === "video" || track.kind === "audio") {
    if (typeof clip.src !== "string" || clip.src.length === 0)
      err(where, "thiếu src (đường dẫn file media)");
    if (!isFiniteNumber(clip.in) || clip.in < 0)
      err(where, `in phải là số >= 0, nhận được: ${clip.in}`);
    if (!isFiniteNumber(clip.out) || !(clip.out > clip.in))
      err(where, `out phải > in, nhận được: in=${clip.in}, out=${clip.out}`);
    // Speed: duration hiệu dụng = (out - in) / speed
    const spd = clip.speed === undefined ? 1 : clip.speed;
    if (clip.speed !== undefined) {
      if (!isFiniteNumber(clip.speed) || clip.speed < SPEED_MIN || clip.speed > SPEED_MAX)
        err(where, `speed phải trong khoảng ${SPEED_MIN}–${SPEED_MAX}, nhận được: ${clip.speed}`);
      if (typeof clip.reverse !== "undefined" && typeof clip.reverse !== "boolean")
        err(where, `reverse phải là boolean, nhận được: ${JSON.stringify(clip.reverse)}`);
    }
    // Phase 7 P3: speed ramp — ghi đè speed hằng, không dùng chung với reverse.
    // Kiểm tra duration-vs-nguồn của speed hằng BỊ BỎ QUA ở ramp mode (out không
    // còn là biên nguồn; render dùng in + ∫speed).
    const hasRamp = clip.speedKeyframes !== undefined;
    if (hasRamp) {
      const r = validateSpeedKeyframes(clip.speedKeyframes, clip.duration);
      for (const m of r.errors) err(where, m);
      for (const m of r.warnings) warn(where, m);
      if (clip.reverse === true)
        err(where, "speedKeyframes không dùng chung được với reverse=true (chưa hỗ trợ)");
      if (clip.speed !== undefined)
        warn(where, "có cả speed và speedKeyframes — render dùng speedKeyframes, speed hằng bị bỏ qua");
    }
    if (!hasRamp && isFiniteNumber(clip.duration) && isFiniteNumber(clip.in) && isFiniteNumber(clip.out) &&
        isFiniteNumber(spd) && spd > 0 &&
        clip.duration > (clip.out - clip.in) / spd + EPS)
      err(where, `duration (${clip.duration}s) vượt quá đoạn nguồn hiệu dụng ` +
        `[in=${clip.in}, out=${clip.out}] / speed=${spd} ` +
        `(${((clip.out - clip.in) / spd).toFixed(3)}s) — không đủ frame để phát`);
  }

  if (track.kind === "video") {
    for (const key of ["transitionIn", "transitionOut"]) {
      const tr = clip[key];
      if (tr === undefined || tr === null) continue;
      if (typeof tr !== "object") { err(where, `${key} phải là object`); continue; }
      if (!isSupportedTransition(tr.type))
        err(where, `${key}.type không hỗ trợ: ${JSON.stringify(tr.type)}`);
      if (!isFiniteNumber(tr.duration) || tr.duration < 0)
        err(where, `${key}.duration phải là số >= 0, nhận được: ${tr.duration}`);
      if (tr.type !== "none" && tr.duration > clip.duration + EPS)
        err(where, `${key}.duration (${tr.duration}s) dài hơn duration của clip (${clip.duration}s)`);
    }
    // Opacity (R1-011): 0..1, render thật bằng format=rgba + colorchannelmixer.
    if (clip.opacity !== undefined) {
      for (const m of validateOpacity(clip.opacity))
        err(where, m);
    }
    // Keyframe animations (x/y/opacity/scale/rotation đều render thật cho video;
    // scale/rotation và opacity keyframes bị bỏ qua nếu clip dính transition —
    // cảnh báo ở vòng lặp transition phía dưới, xem KEYFRAMES_LIMITS.md)
    if (clip.animations !== undefined) {
      for (const m of validateAnimations(clip.animations, clip.duration))
        err(where, m);
      // K1: cả opacity tĩnh và keyframes opacity → keyframes thắng (tuyệt đối),
      // opacity tĩnh bị bỏ qua. Cảnh báo để không ai tưởng chúng nhân với nhau.
      if (clip.opacity !== undefined && clip.opacity < 1 - EPS &&
          clip.animations.opacity) {
        warn(where, `có cả opacity tĩnh (${clip.opacity}) và keyframes opacity — ` +
          `render dùng keyframes (tuyệt đối), opacity tĩnh bị bỏ qua (xem OPACITY_LIMITS.md)`);
      }
      const skf = clip.animations.scale && clip.animations.scale.keyframes;
      if (Array.isArray(skf)) {
        for (const kf of skf) {
          if (isFiniteNumber(kf.v) && (kf.v < SCALE_MIN || kf.v > SCALE_MAX)) {
            warn(where, `keyframe scale=${kf.v} nằm ngoài [${SCALE_MIN}, ${SCALE_MAX}] — ` +
              `render sẽ clamp về khoảng này (xem KEYFRAMES_LIMITS.md)`);
            break;
          }
        }
      }
    }
    // Chroma key (xoá phông xanh)
    if (clip.chromaKey !== undefined) {
      for (const m of validateChroma(clip.chromaKey))
        err(where, m);
      // R1-012: cảnh báo khi kết hợp chroma key với transition (xfade làm mất alpha)
      const hasTrans = (clip.transitionIn && clip.transitionIn.type !== "none") ||
                       (clip.transitionOut && clip.transitionOut.type !== "none");
      if (hasTrans) {
        warn(where, "clip có chromaKey + transition: xfade không giữ alpha, " +
          "vùng trong suốt có thể bị blend sai (xem CHROMA_LIMITS.md)");
      }
    }
    // LUT filter
    if (clip.filter !== undefined) {
      for (const m of validateVideoFilter(clip.filter))
        err(where, m);
    }
    // Video effects
    if (clip.effects !== undefined) {
      for (const m of validateVideoEffects(clip.effects))
        err(where, m);
    }
    // Phase 7 P4: mask (rect/ellipse + feather) — render thật qua mask.js.
    if (clip.mask !== undefined) {
      for (const m of validateMask(clip.mask))
        err(where, m);
    }
    // Phase 7 P2: clip enhancement (deinterlace/stabilize/denoise)
    if (clip.enhance !== undefined) {
      for (const m of validateEnhance(clip.enhance))
        err(where, m);
      // Phase 7 P3: stabilize + ramp không tương thích (vidstab detect theo trim
      // gốc, không khớp các đoạn ramp) — chặn sớm thay vì render sai transform.
      if (clip.speedKeyframes !== undefined && clip.enhance.stabilize !== undefined)
        err(where, "speedKeyframes không dùng chung được với enhance.stabilize " +
          "(vidstab detect theo trim gốc, không khớp các đoạn ramp)");
    }
    // R1-015: audio routing cho video nguồn
    if (clip.sourceAudioMode !== undefined) {
      for (const m of validateSourceAudioMode(clip.sourceAudioMode))
        err(where, m);
      if (clip.sourceAudioMode === "detach")
        err(where, `sourceAudioMode="detach" chưa được hỗ trợ ` +
          `(render worker chỉ hỗ trợ "inherit" | "mute")`);
    }
    // R1-076: audio effects cho tiếng kế thừa của video clip
    if (clip.audioEffects !== undefined) {
      for (const m of validateAudioEffects(clip.audioEffects))
        err(where, m);
    }
  }

  if (track.kind === "sticker") {
    // Sticker clip: validate riêng
    for (const m of validateSticker(clip))
      err(where, m);
  }

  if (track.kind === "image") {
    // Image clip: cần src; không có in/out (ảnh không có trục thời gian).
    // fit được validate bởi validateImage.
    if (typeof clip.src !== "string" || clip.src.length === 0)
      err(where, "thiếu src (đường dẫn file ảnh)");
    for (const m of validateImage(clip))
      err(where, m);
  }

  // Phase 7 P4: mask chỉ render cho video/image. Text clip dùng drawtext vẽ
  // trực tiếp nên không qua pipeline alpha — mask bị bỏ qua (cảnh báo, không
  // lỗi, để project cũ vẫn render). Sticker/audio cũng vậy.
  if (clip.mask !== undefined && track.kind !== "video" && track.kind !== "image") {
    warn(where, `mask chưa hỗ trợ cho clip ${track.kind} — mask sẽ bị bỏ qua ` +
      `(chỉ video/image render mask, xem MASK_LIMITS.md)`);
  }

  // Phase 9 D3: motion tracking mở rộng từ sticker sang video/text.
  // Sticker đã validate track trong validateSticker — ở đây chỉ xử lý
  // video/text (và cảnh báo khi track gắn vào kind chưa hỗ trợ).
  if (clip.track !== undefined && (track.kind === "video" || track.kind === "text")) {
    for (const m of validateTrackAttachment(clip.track))
      err(where, `track: ${m}`);
    if (track.kind === "video" &&
        (clip.transitionIn !== undefined || clip.transitionOut !== undefined)) {
      warn(where, `clip video có track nhưng dính transition — track bị bỏ qua ` +
        `ở unit đã merge (keyframes cũng vậy, xem D3_LIMITS.md)`);
    }
    if (track.kind === "text" &&
        (clip.style?.animation === "typewriter" ||
         (Array.isArray(clip.karaoke) && clip.karaoke.length > 0))) {
      warn(where, `clip text có track nhưng vẽ bằng ASS (typewriter/karaoke) — ` +
        `track bị bỏ qua, chữ giữ vị trí tĩnh (xem D3_LIMITS.md)`);
    }
  } else if (clip.track !== undefined && track.kind !== "sticker") {
    warn(where, `track chưa hỗ trợ cho clip ${track.kind} — track sẽ bị bỏ qua ` +
      `(chỉ video/text/sticker bám quỹ đạo, xem D3_LIMITS.md)`);
  }

  if (track.kind === "audio") {
    const vol = clip.volume === undefined ? 1 : clip.volume;
    if (!isFiniteNumber(vol) || vol < 0 || vol > 1)
      err(where, `volume phải trong khoảng 0..1, nhận được: ${clip.volume}`);
    for (const key of ["fadeIn", "fadeOut"]) {
      const f = clip[key] === undefined ? 0 : clip[key];
      if (!isFiniteNumber(f) || f < 0)
        err(where, `${key} phải là số >= 0, nhận được: ${clip[key]}`);
      else if (isFiniteNumber(clip.duration) && f > clip.duration + EPS)
        err(where, `${key} (${f}s) dài hơn duration của clip (${clip.duration}s)`);
    }
    // Phase 7 P3: đường cong fade (mặc định linear).
    for (const key of ["fadeInCurve", "fadeOutCurve"]) {
      const c = clip[key];
      if (c !== undefined && !["linear", "ease-in", "ease-out", "sine"].includes(c))
        err(where, `${key} phải là linear | ease-in | ease-out | sine (nhận được: ${JSON.stringify(c)})`);
    }
    // Phase 7 P3: volumeKeyframes đã được RENDER áp dụng (volume eval=frame),
    // không còn chỉ preview như R1-063 — bỏ cảnh báo cũ.
    if (clip.volumeKeyframes !== undefined) {
      for (const m of validateVolumeKeyframes(clip.volumeKeyframes, clip.duration))
        err(where, m);
    }
    // R1-076: audio effects cho audio clip
    if (clip.audioEffects !== undefined) {
      for (const m of validateAudioEffects(clip.audioEffects))
        err(where, m);
    }
  }

  if (track.kind === "text") {
    if (typeof clip.text !== "string")
      err(where, `text phải là chuỗi, nhận được: ${JSON.stringify(clip.text)}`);
    else if (clip.text.length === 0)
      warn(where, "text rỗng — clip này sẽ không hiển thị gì");
    const st = clip.style;
    if (typeof st !== "object" || st === null) {
      err(where, "thiếu style"); return;
    }
    if (typeof st.fontFamily !== "string" || st.fontFamily.length === 0)
      err(where, "style.fontFamily phải là chuỗi khác rỗng");
    if (!isFiniteNumber(st.fontSize) || st.fontSize <= 0)
      err(where, `style.fontSize phải là số > 0, nhận được: ${st.fontSize}`);
    if (!isHexColor(st.color))
      err(where, `style.color phải là mã hex (#rgb hoặc #rrggbb), nhận được: ${JSON.stringify(st.color)}`);
    if (st.backgroundColor !== undefined && !isHexColor(st.backgroundColor))
      err(where, `style.backgroundColor phải là mã hex, nhận được: ${JSON.stringify(st.backgroundColor)}`);
    if (st.highlightColor !== undefined && !isHexColor(st.highlightColor))
      err(where, `style.highlightColor phải là mã hex, nhận được: ${JSON.stringify(st.highlightColor)}`);
    for (const key of ["bold", "italic"]) {
      if (st[key] !== undefined && typeof st[key] !== "boolean")
        err(where, `style.${key} phải là boolean, nhận được: ${JSON.stringify(st[key])}`);
    }
    for (const key of ["x", "y"]) {
      if (st[key] !== undefined && (!isFiniteNumber(st[key]) || st[key] < 0 || st[key] > 1))
        err(where, `style.${key} là vị trí tương đối, phải trong khoảng 0..1, nhận được: ${st[key]}`);
    }
    if (!isTextFxAnimation(st.animation) && st.animation !== "typewriter")
      err(where, `style.animation không hỗ trợ: ${JSON.stringify(st.animation)}`);
    // Keyframe animations cho text: x/y/opacity render qua drawtext; scale/
    // rotation nay render qua PNG path (K1, Phase 6) — TRỪ typewriter (ASS
    // không hỗ trợ scale/rotate theo thời gian nên vẫn bị bỏ qua + cảnh báo).
    if (clip.animations !== undefined) {
      for (const m of validateAnimations(clip.animations, clip.duration))
        err(where, m);
      if ((clip.animations.scale || clip.animations.rotation) &&
          clip.style.animation === "typewriter")
        warn(where, "keyframes scale/rotation của text clip typewriter bị bỏ qua " +
          "khi render (ASS không hỗ trợ scale/rotate theo thời gian)");
      if ((clip.animations.scale || clip.animations.rotation) &&
          Array.isArray(clip.karaoke) && clip.karaoke.length > 0)
        warn(where, "keyframes scale/rotation của text clip karaoke bị bỏ qua " +
          "khi render (ASS không hỗ trợ scale/rotate theo thời gian)");
    }
    // Phase 9 R4: karaoke — từ kèm thời gian tô sáng (giây, tương đối clip.start).
    if (clip.karaoke !== undefined) {
      if (!Array.isArray(clip.karaoke) || clip.karaoke.length === 0) {
        err(where, "karaoke phải là mảng không rỗng các {word, start, end}");
      } else {
        let prevEnd = -Infinity;
        for (const w of clip.karaoke) {
          if (typeof w !== "object" || w === null || typeof w.word !== "string" ||
              w.word.length === 0 || !isFiniteNumber(w.start) ||
              !isFiniteNumber(w.end) || w.end <= w.start) {
            err(where, `karaoke word sai hình dạng (cần {word: string khác rỗng, ` +
              `start, end: number, end > start}), nhận được: ${JSON.stringify(w)}`);
            break;
          }
          if (w.start < -0.01 || w.end > clip.duration + 0.01) {
            err(where, `karaoke word ngoài duration clip (${w.start}–${w.end} ` +
              `trong khi duration=${clip.duration})`);
            break;
          }
          if (w.start < prevEnd - 0.01) {
            err(where, "karaoke words phải theo thứ tự thời gian không chồng lấn");
            break;
          }
          prevEnd = w.end;
        }
      }
    }
    // Phase 7 P6: captionOf chỉ là metadata của editor (render vẽ TextClip
    // theo start/duration sẵn có, không đọc link). Chỉ cảnh báo nếu link
    // sai hình dạng — không chặn render vì câu chữ vẫn hiển thị đúng.
    if (clip.captionOf !== undefined) {
      const l = clip.captionOf;
      if (typeof l !== "object" || l === null || typeof l.clipId !== "string" ||
          !Number.isFinite(l.mediaStart) || !Number.isFinite(l.mediaEnd) ||
          l.mediaEnd <= l.mediaStart) {
        warn(where, "captionOf sai hình dạng (cần {clipId: string, mediaStart, " +
          "mediaEnd: number, mediaEnd > mediaStart}) — render vẫn vẽ câu chữ " +
          "theo start/duration, nhưng editor sẽ không bám link này");
      }
    }
  }
}

/**
 * Giải quyết đường dẫn media: src tương đối → dưới mediaDir; src tuyệt đối → dùng nguyên.
 * Chặn path traversal (../ thoát khỏi mediaDir).
 *
 * P7 — src dạng `asset:<id>` (kho asset của editor):
 *  1. Tra assetMap trước (map do bridge/export truyền kèm qua --asset-map):
 *     value tuyệt đối → dùng thẳng (map do caller tin cậy cung cấp);
 *     value tương đối → resolve dưới mediaDir, vẫn chặn traversal.
 *  2. Không có map (hoặc id không có trong map) → fallback: file cùng tên
 *     `<id>` trong mediaDir (trường hợp bridge/export đã copy file asset
 *     vào mediaDir kèm spec).
 *  3. Không tìm thấy ở đâu → vẫn trả về đường dẫn fallback dưới mediaDir
 *     để validateMedia báo lỗi thiếu asset rõ ràng (thay vì fail khó hiểu).
 * Trả về null chỉ khi: src rỗng, id asset rỗng, hoặc traversal.
 */
function resolveSrc(src, mediaDir, assetMap) {
  if (typeof src === "string" && src.startsWith("asset:")) {
    const id = src.slice("asset:".length);
    if (!id) return null;
    if (assetMap && Object.prototype.hasOwnProperty.call(assetMap, id)) {
      const mapped = assetMap[id];
      if (typeof mapped !== "string" || !mapped) return null;
      if (path.isAbsolute(mapped)) return mapped;
      const abs = path.resolve(mediaDir, mapped);
      const root = path.resolve(mediaDir) + path.sep;
      if (!abs.startsWith(root)) return null; // traversal qua map
      return abs;
    }
    const abs = path.resolve(mediaDir, id);
    const root = path.resolve(mediaDir) + path.sep;
    if (!abs.startsWith(root)) return null; // traversal qua id
    return abs;
  }
  if (path.isAbsolute(src)) return src;
  const abs = path.resolve(mediaDir, src);
  const root = path.resolve(mediaDir) + path.sep;
  if (!abs.startsWith(root)) return null; // traversal
  return abs;
}

/** Chạy ffprobe lấy thông tin streams + duration của 1 file. */
function probeFile(ffprobeBin, absPath) {
  const raw = execFileSync(
    ffprobeBin,
    ["-v", "error",
     "-show_entries", "stream=codec_type,codec_name,width,height,nb_frames,avg_frame_rate,pix_fmt",
     "-show_entries", "format=duration",
     "-of", "json", absPath],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  return JSON.parse(raw);
}

/**
 * Validate file media thực tế: tồn tại, đúng loại stream, đủ dài cho in/out.
 * P7: thêm `assetMap` (xem resolveSrc) và kiểm tra tồn tại cho sticker clip
 * (trước đây sticker thiếu file chỉ fail khó hiểu ở ffmpeg; nay fail fast
 * với thông báo rõ). Sticker chỉ kiểm tra tồn tại, không probe stream.
 * @returns {{ ok: boolean, errors: string[], warnings: string[], probes: Map<string, object> }}
 */
function validateMedia(spec, mediaDir, ffprobeBin, assetMap) {
  const errors = [];
  const warnings = [];
  /** @type {Map<string, object>} */
  const probes = new Map();
  const err = (msg) => errors.push(msg);
  const warn = (msg) => warnings.push(msg);

  const jobs = [];
  for (const track of spec.tracks) {
    if (track.kind !== "video" && track.kind !== "audio" && track.kind !== "image" && track.kind !== "sticker") continue;
    for (const clip of track.clips) {
      jobs.push({ track, clip });
    }
  }

  for (const { track, clip } of jobs) {
    const where = `clip "${clip.id}" (src: ${clip.src})`;
    const abs = resolveSrc(clip.src, mediaDir, assetMap);
    const isAsset = typeof clip.src === "string" && clip.src.startsWith("asset:");
    if (!abs) {
      if (isAsset) {
        err(`[${where}] asset "${clip.src.slice("asset:".length)}" không hợp lệ (id rỗng hoặc thoát khỏi media-dir)`);
      } else {
        err(`[${where}] đường dẫn thoát khỏi media-dir (không cho phép "../")`);
      }
      continue;
    }
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      if (isAsset) {
        // P7: báo tên asset + cách sửa, thay vì chỉ in đường dẫn fallback.
        err(`[${where}] không tìm thấy asset "${clip.src.slice("asset:".length)}": ` +
          `không có trong asset map và không có file cùng tên trong media-dir ` +
          `(upload file asset kèm spec, hoặc truyền asset map cho render worker)`);
      } else {
        err(`[${where}] không tìm thấy file: ${abs}`);
      }
      continue;
    }
    // P7: sticker chỉ cần tồn tại (ảnh PNG/APNG); không probe stream.
    if (track.kind === "sticker") {
      if (!stat.isFile()) {
        err(`[${where}] không phải file thường: ${abs}`);
      }
      continue;
    }
    if (!stat.isFile()) {
      err(`[${where}] không phải file thường: ${abs}`);
      continue;
    }

    let probe = probes.get(abs);
    if (!probe) {
      try {
        probe = probeFile(ffprobeBin, abs);
        probes.set(abs, probe);
      } catch (e) {
        err(`[${where}] ffprobe đọc file thất bại: ${(e.message || e).toString().split("\n")[0]}`);
        continue;
      }
    }
    const streams = probe.streams || [];
    const dur = parseFloat(probe.format && probe.format.duration);

    if (track.kind === "video") {
      const vs = streams.find((s) => s.codec_type === "video");
      if (!vs) {
        err(`[${where}] file không có video stream`);
        continue;
      }
      // Ảnh tĩnh: chỉ 1 frame. Codec ảnh (png...) NHƯNG có nhiều frame
      // (VD: MOV PNG có alpha từ bgremove.py — R1-084) vẫn là video thật.
      const nbFrames = parseInt(vs.nb_frames || "", 10);
      const isStill = vs.nb_frames === "1" ||
        (STILL_CODECS.has(vs.codec_name) && !(Number.isFinite(nbFrames) && nbFrames > 1));
      if (isStill) {
        err(`[${where}] là ảnh tĩnh (${vs.codec_name}) — video clip yêu cầu file video, ` +
          `dùng image track cho ảnh tĩnh (xem P0-03)`);
        continue;
      }
      if (Number.isFinite(dur) && clip.out > dur + MEDIA_EPS) {
        err(`[${where}] out=${clip.out}s vượt quá độ dài file (${dur.toFixed(2)}s)`);
      }
      const as = streams.find((s) => s.codec_type === "audio");
      const mode = clip.sourceAudioMode ?? "inherit";
      if (!as && mode === "inherit") {
        // File không có audio nhưng user để inherit (mặc định) — không lỗi,
        // chỉ báo để user biết video này vốn đã câm.
        warn(`[${where}] file không có audio stream (sourceAudioMode="inherit" nhưng không có gì để giữ)`);
      }
      // R1-015: không còn cảnh báo "bỏ qua audio" — audio inherit đã được render xử lý.
    } else if (track.kind === "image") {
      // Image clip: file phải là ảnh tĩnh (video stream 1 frame hoặc codec ảnh).
      // Không kiểm tra in/out — ảnh không có trục thời gian.
      const vs = streams.find((s) => s.codec_type === "video");
      if (!vs) {
        err(`[${where}] file không có video stream (không phải ảnh?)`);
        continue;
      }
      const isStill = vs.nb_frames === "1" || STILL_CODECS.has(vs.codec_name);
      if (!isStill) {
        err(`[${where}] không phải ảnh tĩnh (codec=${vs.codec_name}, nb_frames=${vs.nb_frames}) — ` +
          `image clip yêu cầu file ảnh, dùng video track cho file video`);
        continue;
      }
    } else {
      const as = streams.find((s) => s.codec_type === "audio");
      if (!as) {
        err(`[${where}] file không có audio stream`);
        continue;
      }
      if (Number.isFinite(dur) && clip.out > dur + MEDIA_EPS) {
        err(`[${where}] out=${clip.out}s vượt quá độ dài file (${dur.toFixed(2)}s)`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings, probes };
}

/**
 * Tìm font file thật qua fontconfig cho text clip (drawtext cần fontfile).
 * Trả về null nếu không tìm được.
 */
function resolveFontFile(fontFamily, { bold = false, italic = false } = {}) {
  const style =
    (bold ? ":weight=bold" : "") + (italic ? ":slant=italic" : "");
  const candidates = [
    `${fontFamily}${style}`,
    fontFamily,
    `DejaVu Sans${style}`,
    "sans-serif",
  ];
  for (const c of candidates) {
    try {
      const out = execFileSync("fc-match", ["-f", "%{file}\n", c], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim().split("\n")[0];
      if (out && fs.existsSync(out)) return out;
    } catch {
      /* thử candidate tiếp theo */
    }
  }
  return null;
}

module.exports = {
  SPEC_VERSION,
  EPS,
  isVideoSpec,
  validateSpec,
  validateMedia,
  resolveFontFile,
  resolveSrc,
};
