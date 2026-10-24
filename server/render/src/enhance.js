#!/usr/bin/env node
/**
 * enhance.js — Clip enhancement cho render worker (Phase 7 P2, Node, zero-deps).
 *
 * Ba nhóm xử lý, đều bằng filter NATIVE của FFmpeg (không cần shader/OpenGL):
 *   1. deinterlace — yadif (khử răng cưa video interlaced). PHẢI chạy TRƯỚC
 *      scale, vì scale trên frame interlaced sẽ "nướng" răng cưa vào ảnh.
 *   2. stabilize — vidstab 2-pass: vidstabdetect (pass phân tích, chạy riêng
 *      trước render chính) + vidstabtransform (áp trong graph chính, ngay
 *      sau trim/setpts, trước speed — cùng đúng đoạn nguồn đã phân tích).
 *   3. denoise — hqdn3d (khử nhiễu không gian + thời gian), áp sau scale/pad
 *      cùng vị trí effects (trên pixel output).
 *
 * Spec (xem packages/video-spec/src/enhance.ts):
 *   clip.enhance = {
 *     deinterlace?: true | { mode?: 0 | 1 },
 *     stabilize?: { smoothing?, shakiness?, accuracy?, stepsize?, mincontrast? },
 *     denoise?: true | { strength?: number },   // strength 0..1
 *   }
 * Tất cả đều optional; không khai = hành vi cũ 100%.
 *
 * NGUYÊN TẮC TRUNG THỰC: chỉ liệt kê filter đã render thật thành công
 * trên VM này — xem ENHANCE_LIMITS.md.
 */
"use strict";

const assert = require("assert");
const { spawnSync } = require("child_process");

function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function isNum(x) {
  return typeof x === "number" && Number.isFinite(x);
}

/** Mặc định vidstab (theo doc FFmpeg vidstabtransform). */
const STABILIZE_DEFAULTS = {
  smoothing: 10, // số frame làm mượt (1..100)
  shakiness: 5, // 1..10
  accuracy: 15, // 1..15
  stepsize: 6, // pixel, 1..32
  mincontrast: 0.3, // 0..1
};

const STABILIZE_RANGES = {
  smoothing: [1, 100],
  shakiness: [1, 10],
  accuracy: [1, 15],
  stepsize: [1, 32],
  mincontrast: [0, 1],
};

/** Escape đường dẫn .trf cho filter (vidstab result=... dùng cú pháp filter). */
function escapeFilterPath(p) {
  return p.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/** Chuẩn hoá 1 tham số stabilize: thiếu → default, sai → throw. */
function normStabParam(enh, key) {
  const [lo, hi] = STABILIZE_RANGES[key];
  const v = enh[key] === undefined ? STABILIZE_DEFAULTS[key] : enh[key];
  if (!isNum(v) || v < lo || v > hi) {
    throw new Error(`stabilize.${key} phải là số trong [${lo}, ${hi}], nhận được: ${JSON.stringify(enh[key])}`);
  }
  return key === "mincontrast" ? v : Math.round(v);
}

/**
 * Validate clip.enhance, trả về danh sách lỗi (rỗng = hợp lệ).
 * Không throw — render worker gom lỗi như các validator khác.
 */
function validateEnhance(enh) {
  if (enh === undefined) return [];
  if (typeof enh !== "object" || enh === null || Array.isArray(enh)) {
    return ["enhance phải là object { deinterlace?, stabilize?, denoise? }"];
  }
  const errors = [];
  const known = new Set(["deinterlace", "stabilize", "denoise"]);
  for (const k of Object.keys(enh)) {
    if (!known.has(k)) errors.push(`enhance.${k} không hỗ trợ (chỉ có deinterlace, stabilize, denoise)`);
  }
  // deinterlace: true | { mode?: 0|1 }
  if (enh.deinterlace !== undefined) {
    const d = enh.deinterlace;
    if (d !== true) {
      if (typeof d !== "object" || d === null || Array.isArray(d)) {
        errors.push("enhance.deinterlace phải là true hoặc { mode?: 0|1 }");
      } else {
        for (const k of Object.keys(d)) {
          if (k !== "mode") errors.push(`enhance.deinterlace.${k} không hỗ trợ`);
        }
        if (d.mode !== undefined && d.mode !== 0 && d.mode !== 1) {
          errors.push(`enhance.deinterlace.mode phải là 0 (giữ fps) hoặc 1 (mỗi field 1 frame), nhận được: ${JSON.stringify(d.mode)}`);
        }
      }
    }
  }
  // stabilize: object, các key số trong khoảng
  if (enh.stabilize !== undefined) {
    const s = enh.stabilize;
    if (typeof s !== "object" || s === null || Array.isArray(s)) {
      errors.push("enhance.stabilize phải là object { smoothing?, shakiness?, accuracy?, stepsize?, mincontrast? }");
    } else {
      for (const k of Object.keys(s)) {
        if (!(k in STABILIZE_RANGES)) {
          errors.push(`enhance.stabilize.${k} không hỗ trợ`);
          continue;
        }
        const [lo, hi] = STABILIZE_RANGES[k];
        if (!isNum(s[k]) || s[k] < lo || s[k] > hi) {
          errors.push(`enhance.stabilize.${k} phải là số trong [${lo}, ${hi}], nhận được: ${JSON.stringify(s[k])}`);
        }
      }
    }
  }
  // denoise: true | { strength?: 0..1 }
  if (enh.denoise !== undefined) {
    const d = enh.denoise;
    if (d !== true) {
      if (typeof d !== "object" || d === null || Array.isArray(d)) {
        errors.push("enhance.denoise phải là true hoặc { strength?: number 0..1 }");
      } else {
        for (const k of Object.keys(d)) {
          if (k !== "strength") errors.push(`enhance.denoise.${k} không hỗ trợ`);
        }
        if (d.strength !== undefined && (!isNum(d.strength) || d.strength < 0 || d.strength > 1)) {
          errors.push(`enhance.denoise.strength phải là số trong [0, 1], nhận được: ${JSON.stringify(d.strength)}`);
        }
      }
    }
  }
  return errors;
}

function hasStabilize(enh) {
  return !!(enh && enh.stabilize !== undefined);
}

function hasEnhance(enh) {
  return !!(enh && (enh.deinterlace !== undefined || enh.stabilize !== undefined || enh.denoise !== undefined));
}

/**
 * Chuỗi filter áp TRƯỚC scale (ngay sau trim/setpts, trước speed):
 * deinterlace rồi vidstabtransform (transform chỉ khi có trfPath).
 * @returns {string} "" nếu không có gì (để nối trực tiếp vào chain)
 */
function buildEnhancePreChain(enh, trfPath) {
  if (!enh) return "";
  const parts = [];
  if (enh.deinterlace !== undefined) {
    const mode = enh.deinterlace === true ? 0 : (enh.deinterlace.mode ?? 0);
    // yadif mode 0 = 1 frame / cặp field (giữ fps) — an toàn với fps filter sau đó.
    // parity -1 = tự detect từ stream.
    parts.push(`yadif=mode=${mode}:parity=-1:deint=0`);
  }
  if (enh.stabilize !== undefined) {
    if (!trfPath) throw new Error("stabilize cần file .trf từ pass vidstabdetect (chưa chạy detect?)");
    // LƯU Ý QUAN TRỌNG (phát hiện khi test thật trên FFmpeg 8.1.2):
    // vidstabtransform CHỈ có input/smoothing/optalgo/... — shakiness,
    // accuracy, stepsize, mincontrast là option của vidstabdetect (pass 1),
    // đưa vào transform sẽ lỗi "Option not found" và fail cả job.
    const s = enh.stabilize;
    const smoothing = normStabParam(s, "smoothing");
    parts.push(
      `vidstabtransform=input='${escapeFilterPath(trfPath)}':` +
      `smoothing=${smoothing}:optalgo=gauss`
    );
  }
  return parts.length ? `,${parts.join(",")}` : "";
}

/**
 * Chuỗi filter áp SAU scale/pad (cùng vị trí effects, trên pixel output):
 * hqdn3d khử nhiễu. strength 0..1 → luma_spatial 0..24, chroma_spatial 0..18,
 * luma_tmp 0..24, chroma_tmp 0..18 (giữ tỉ lệ 4:3 của mặc định FFmpeg).
 * LÝ DO THANG NÀY (đo thật trên FFmpeg 8.1.2): thang cũ (tối đa 8:6:9:6.75)
 * gần như không có tác dụng — trên nhiễu alls=40 (std 26) chỉ giảm xuống ~25,
 * trên nhiễu vừa alls=15 (std 9.3) chỉ giảm xuống 6.8. Thang mới: hqdn3d=24
 * giảm nhiễu vừa xuống ~50%, và vẫn an toàn (hqdn3d=80 mới bắt đầu phá chi
 * tiết mạnh). Nhiễu cực mạnh (alls=40) thì strength 1.0 cũng chỉ giảm một
 * phần — xem ENHANCE_LIMITS.md, đừng quảng cáo "khử sạch mọi nhiễu".
 * @returns {string} "" nếu không có denoise
 */
function buildEnhancePostChain(enh) {
  if (!enh || enh.denoise === undefined) return "";
  const t = enh.denoise === true ? 0.5 : (enh.denoise.strength ?? 0.5);
  if (!isNum(t) || t < 0 || t > 1) {
    throw new Error(`denoise.strength phải là số trong [0, 1], nhận được: ${JSON.stringify(enh.denoise && enh.denoise.strength)}`);
  }
  const ls = num(t * 24);
  const cs = num(t * 18);
  const lt = num(t * 24);
  const ct = num(t * 18);
  return `,hqdn3d=${ls}:${cs}:${lt}:${ct}`;
}

/**
 * Pass 1 vidstabdetect cho 1 clip: phân tích đúng đoạn nguồn mà render chính
 * sẽ dùng (cùng trim [in, in+duration*speed)), ghi .trf ra trfPath.
 * @returns {{ok:boolean, error?:string}}
 */
function runStabilizeDetect(ffmpeg, inputAbs, clip, trfPath) {
  const s = clip.enhance.stabilize;
  const shakiness = normStabParam(s, "shakiness");
  const accuracy = normStabParam(s, "accuracy");
  const stepsize = normStabParam(s, "stepsize");
  const mincontrast = normStabParam(s, "mincontrast");
  const end = clip.in + clip.duration * (clip.speed ?? 1);
  const vf =
    `trim=start=${num(clip.in)}:end=${num(end)},setpts=PTS-STARTPTS,` +
    `vidstabdetect=result='${escapeFilterPath(trfPath)}':` +
    `shakiness=${shakiness}:accuracy=${accuracy}:stepsize=${stepsize}:mincontrast=${num(mincontrast)}`;
  const r = spawnSync(ffmpeg, [
    "-i", inputAbs, "-vf", vf, "-an", "-f", "null", "-",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  if (r.error) return { ok: false, error: `không chạy được ffmpeg cho vidstabdetect: ${r.error.message}` };
  if (r.status !== 0) {
    return { ok: false, error: `vidstabdetect thoát mã ${r.status}: ${(r.stderr || "").toString().trim().slice(-300)}` };
  }
  return { ok: true };
}

/** Probe 1 lần: FFmpeg build này có những filter nào (để fail fast rõ ràng). */
function probeFilterSupport(ffmpeg) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-filters"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const out = (r.stdout || "") + (r.stderr || "");
  const has = (name) => new RegExp(`\\b${name}\\b`).test(out);
  return { vidstabdetect: has("vidstabdetect"), vidstabtransform: has("vidstabtransform"), hqdn3d: has("hqdn3d"), yadif: has("yadif") };
}

// ---------------------------------------------------------------------------
// Self-test: node src/enhance.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  assert.deepStrictEqual(validateEnhance(undefined), []);
  assert.deepStrictEqual(validateEnhance({}), []);
  assert.deepStrictEqual(validateEnhance({ deinterlace: true }), []);
  assert.deepStrictEqual(validateEnhance({ deinterlace: { mode: 1 } }), []);
  assert.deepStrictEqual(validateEnhance({ stabilize: { smoothing: 30 } }), []);
  assert.deepStrictEqual(validateEnhance({ denoise: { strength: 0.7 } }), []);
  assert.ok(validateEnhance("x").length > 0);
  assert.ok(validateEnhance({ bogus: 1 }).length > 0);
  assert.ok(validateEnhance({ deinterlace: { mode: 2 } }).length > 0);
  assert.ok(validateEnhance({ stabilize: { smoothing: 0 } }).length > 0);
  assert.ok(validateEnhance({ stabilize: { smoothing: 101 } }).length > 0);
  assert.ok(validateEnhance({ stabilize: "x" }).length > 0);
  assert.ok(validateEnhance({ denoise: { strength: 2 } }).length > 0);

  assert.strictEqual(buildEnhancePreChain(undefined), "");
  assert.strictEqual(buildEnhancePreChain({}), "");
  assert.ok(buildEnhancePreChain({ deinterlace: true }).includes("yadif=mode=0"));
  assert.ok(buildEnhancePreChain({ deinterlace: { mode: 1 } }).includes("yadif=mode=1"));
  const tr = buildEnhancePreChain({ stabilize: { smoothing: 20 } }, "/tmp/x.trf");
  assert.ok(tr.includes("vidstabtransform=input=") && tr.includes("smoothing=20"), tr);
  assert.throws(() => buildEnhancePreChain({ stabilize: {} }, null), /trf/);
  assert.ok(buildEnhancePostChain({ denoise: true }).startsWith(",hqdn3d="));
  assert.ok(buildEnhancePostChain({ denoise: { strength: 1 } }).includes("hqdn3d=24:18:24:18"));
  assert.strictEqual(buildEnhancePostChain({}), "");
  assert.ok(hasStabilize({ stabilize: {} }));
  assert.ok(!hasStabilize({ denoise: true }));
  assert.ok(hasEnhance({ denoise: true }));
  assert.ok(!hasEnhance({}));

  console.log("✅ enhance.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("enhance.js — module clip enhancement (deinterlace/stabilize/denoise). Chạy với --self-test.");
    process.exit(2);
  }
}

module.exports = {
  STABILIZE_DEFAULTS,
  validateEnhance,
  hasStabilize,
  hasEnhance,
  buildEnhancePreChain,
  buildEnhancePostChain,
  runStabilizeDetect,
  probeFilterSupport,
};
