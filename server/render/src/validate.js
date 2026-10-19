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
const { validateAnimations } = require("./keyframes");
const { validateChroma } = require("./chroma");
const { isTextFxAnimation } = require("./textfx");
const { validateVideoFilter } = require("./lut");
const { validateEffects: validateVideoEffects } = require("./effects");
const { validateSticker } = require("./sticker");

const SPEC_VERSION = "0.1.0";
/** Sai số khi so sánh số thực (giây). */
const EPS = 1e-6;
/** Dung sai khi so sánh out với duration file thực (metadata container có thể lệch chút). */
const MEDIA_EPS = 0.15;
/** Codec của ảnh tĩnh — Phase 1 chưa hỗ trợ ảnh làm clip video. */
const STILL_CODECS = new Set(["png", "bmp", "tiff", "mjpeg", "mng"]);

/**
 * Mirror của isVideoSpec() trong packages/video-spec — kiểm tra tối thiểu.
 * @param {unknown} v
 * @returns {v is object}
 */
function isVideoSpec(v) {
  if (typeof v !== "object" || v === null) return false;
  return (
    v.version === SPEC_VERSION &&
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
  if (spec.version !== SPEC_VERSION) {
    err("version", `không hỗ trợ "${spec.version}" — worker này chỉ render spec version "${SPEC_VERSION}"`);
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
    if (!["video", "audio", "text", "sticker"].includes(track.kind)) {
      err(`${tw}.kind`, `phải là "video" | "audio" | "text" | "sticker", nhận được: ${JSON.stringify(track.kind)}`);
      continue;
    }
    if (!Array.isArray(track.clips)) {
      err(`${tw}.clips`, "phải là một mảng"); continue;
    }

    const clips = track.clips;
    // Validate từng clip
    for (let ci = 0; ci < clips.length; ci++) {
      validateClip(track, clips[ci], `${tw}.clips[${ci}]`, err, warn);
    }

    // Clip trên cùng track video không được chồng lấn thời gian
    // (track khác nhau được phép chồng — sẽ composite theo thứ tự track).
    if (track.kind === "video") {
      const sorted = [...clips].sort((a, b) => a.start - b.start);
      for (let i = 0; i + 1 < sorted.length; i++) {
        const a = sorted[i], b = sorted[i + 1];
        if (a.start + a.duration > b.start + EPS) {
          err(tw, `clip "${a.id}" [${a.start}, ${a.start + a.duration}] chồng lấn clip "${b.id}" ` +
            `(bắt đầu ${b.start}) — trên cùng một track video các clip không được đè lên nhau`);
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
    if (isFiniteNumber(clip.duration) && isFiniteNumber(clip.in) && isFiniteNumber(clip.out) &&
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
    if (clip.opacity !== undefined) {
      if (!isFiniteNumber(clip.opacity) || clip.opacity < 0 || clip.opacity > 1)
        err(where, `opacity phải trong khoảng 0..1, nhận được: ${clip.opacity}`);
      else if (clip.opacity < 1 - EPS)
        err(where, `opacity=${clip.opacity} chưa được hỗ trợ ở Phase 1 ` +
          `(render worker hiện tại chỉ render được opacity = 1)`);
    }
    // Keyframe animations (chỉ x/y/opacity được render; scale/rotation lưu nhưng bỏ qua)
    if (clip.animations !== undefined) {
      for (const m of validateAnimations(clip.animations, clip.duration))
        err(where, m);
      if (clip.animations.scale || clip.animations.rotation)
        warn(where, "keyframes scale/rotation hiện chỉ lưu trong spec, render worker chưa áp dụng " +
          "(xem KEYFRAMES_LIMITS.md)");
    }
    // Chroma key (xoá phông xanh)
    if (clip.chromaKey !== undefined) {
      for (const m of validateChroma(clip.chromaKey))
        err(where, m);
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
  }

  if (track.kind === "sticker") {
    // Sticker clip: validate riêng
    for (const m of validateSticker(clip))
      err(where, m);
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
    // Keyframe animations cho text (x/y/opacity được render; scale/rotation lưu nhưng bỏ qua)
    if (clip.animations !== undefined) {
      for (const m of validateAnimations(clip.animations, clip.duration))
        err(where, m);
      if (clip.animations.scale || clip.animations.rotation)
        warn(where, "keyframes scale/rotation hiện chỉ lưu trong spec, render worker chưa áp dụng");
    }
  }
}

/**
 * Giải quyết đường dẫn media: src tương đối → dưới mediaDir; src tuyệt đối → dùng nguyên.
 * Chặn path traversal (../ thoát khỏi mediaDir).
 */
function resolveSrc(src, mediaDir) {
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
     "-show_entries", "stream=codec_type,codec_name,width,height,nb_frames,avg_frame_rate",
     "-show_entries", "format=duration",
     "-of", "json", absPath],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  return JSON.parse(raw);
}

/**
 * Validate file media thực tế: tồn tại, đúng loại stream, đủ dài cho in/out.
 * @returns {{ ok: boolean, errors: string[], warnings: string[], probes: Map<string, object> }}
 */
function validateMedia(spec, mediaDir, ffprobeBin) {
  const errors = [];
  const warnings = [];
  /** @type {Map<string, object>} */
  const probes = new Map();
  const err = (msg) => errors.push(msg);
  const warn = (msg) => warnings.push(msg);
  const warnedAudioSkip = new Set();

  const jobs = [];
  for (const track of spec.tracks) {
    if (track.kind !== "video" && track.kind !== "audio") continue;
    for (const clip of track.clips) {
      jobs.push({ track, clip });
    }
  }

  for (const { track, clip } of jobs) {
    const where = `clip "${clip.id}" (src: ${clip.src})`;
    const abs = resolveSrc(clip.src, mediaDir);
    if (!abs) {
      err(`[${where}] đường dẫn thoát khỏi media-dir (không cho phép "../")`);
      continue;
    }
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      err(`[${where}] không tìm thấy file: ${abs}`);
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
      // Ảnh tĩnh: chỉ 1 frame, hoặc codec vốn là ảnh.
      if (vs.nb_frames === "1" || STILL_CODECS.has(vs.codec_name)) {
        err(`[${where}] là ảnh tĩnh (${vs.codec_name}) — Phase 1 chưa hỗ trợ ảnh làm clip video`);
        continue;
      }
      if (Number.isFinite(dur) && clip.out > dur + MEDIA_EPS) {
        err(`[${where}] out=${clip.out}s vượt quá độ dài file (${dur.toFixed(2)}s)`);
      }
      const as = streams.find((s) => s.codec_type === "audio");
      if (as && !warnedAudioSkip.has(abs)) {
        warnedAudioSkip.add(abs);
        warn(`[${where}] file có audio stream nhưng Phase 1 BỎ QUA audio của video clip ` +
          `— hãy dùng track "audio" riêng nếu cần tiếng`);
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
