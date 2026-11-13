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
// Phase 9 đợt 74 B4: timeout cho vidstabdetect + probe -filters (trước
// đây cả hai đều không timeout — detect treo thì render treo theo).
const {
  KILL_SIGNAL, detectTimeoutMs, probeTimeoutMs, isTimeoutResult,
} = require("./timeouts");

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
    // Đợt 70 X8 — `copy` BẮT BUỘC ngay trước vidstabtransform (đừng bỏ):
    // vidstabtransform kiểm tra av_frame_is_writable(in); nếu writable thì
    // warp NGAY TRÊN buffer frame của decoder (out = in) làm bẩn reference
    // frame → output không xác định với decode đa luồng (cơ chế M1, xem
    // docs/PHASE9_ROUND69_W4_VIDSTAB_MECHANISM_LIMITS.md §1). Filter `copy`
    // clone frame nên khi transform chạy, frame vẫn còn 1 reference nữa
    // (giữ bởi filter copy trong cùng call stack đồng bộ) → non-writable →
    // transform cấp buffer output riêng, không chạm tới buffer decoder.
    // Đã đo thật (harness test_round70_x8_vidstab_fix.js): 720p threads mặc
    // định 134–138/150 frame khác (W4 X2/X2b) → 0/150 ×3 với `copy`, sha
    // TRÙNG ground truth rawvideo X1 (4a42bdd3…). `crop=iw:ih` KHÔNG cứu
    // được (133–135/150 — crop toàn khung là passthrough, vẫn chia sẻ
    // buffer). `copy` giữ nguyên pixel (pha A: 0/150 khác decode-only) và
    // chi phí ~0 (chỉ 1 lần clone frame). Cờ `-threads 1` (đợt 67 U1) +
    // toggle UI (đợt 68 V2) vẫn giữ nguyên bên cạnh — defense in depth.
    parts.push("copy");
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
 * Đợt 67 U1 — quyết định detect có ép decode đơn luồng không: KHÔNG.
 * Đã đo (docs/PHASE9_ROUND67_U1_THREADS1_LIMITS.md §2): vidstabdetect trên
 * clip 1080p 60s, mỗi cấu hình ×3 — mặc định cho 3 sha `.trf` khác nhau
 * (de510f62… / 5c3ef612… / 8d2996bd…), `-threads 1` cũng cho 3 sha khác nhau
 * (08525fc3… / 6bdb685e… / 1312514d…). Nội dung LM thì giống hệt nhau ở cả
 * 2 cấu hình (0/1800 frame khác tập LM, median lệch max 0,0px — xem
 * trf_compare.py). Tức ép đơn luồng cho detect không thêm tính xác định nào
 * (byte vẫn khác, nội dung vốn đã giống), chỉ làm chậm pass đắt nhất của
 * stabilize. Chỉ bước TRANSFORM mới cần `-threads 1` (render.js).
 * Đổi const này thành true CHỈ KHI một lần đo sau chứng minh detect threads1
 * cho `.trf` byte-identical; khi đó nhớ bump TRF_CACHE_VERSION (trfCache.js)
 * vì nội dung `.trf` trong cache sẽ đổi.
 */
const STAB_DETECT_SINGLE_THREAD = false;

/**
 * Dựng argv ffmpeg cho pass 1 vidstabdetect (tách riêng để test được mà
 * không cần chạy ffmpeg thật). `-threads 1` (nếu opts.singleThread) phải
 * đứng TRƯỚC `-i` — đó là option của input (decode), không phải output.
 * @returns {string[]} argv (chưa gồm tên lệnh ffmpeg)
 */
function buildStabilizeDetectArgs(inputAbs, clip, trfPath, opts) {
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
  const args = [];
  // Đợt 67 U1: decode đơn luồng cho detect CHỈ khi STAB_DETECT_SINGLE_THREAD
  // (mặc định false — xem const trên). Không ép bừa: detect đã xác định ở
  // mức nội dung LM, ép threads1 chỉ tốn thời gian.
  if (opts && opts.singleThread) args.push("-threads", "1");
  args.push("-i", inputAbs, "-vf", vf, "-an", "-f", "null", "-");
  return args;
}

/**
 * Pass 1 vidstabdetect cho 1 clip: phân tích đúng đoạn nguồn mà render chính
 * sẽ dùng (cùng trim [in, in+duration*speed)), ghi .trf ra trfPath.
 * Đợt 74 B4: timeout tỉ lệ với độ dài đoạn phân tích (60s + 10s/giây);
 * treo → {ok:false} với thông điệp timeout → caller fail-fast exit 1.
 * @param {object} [opts] { singleThread?: boolean } — xem buildStabilizeDetectArgs.
 * @returns {{ok:boolean, error?:string}}
 */
function runStabilizeDetect(ffmpeg, inputAbs, clip, trfPath, opts) {
  const segSec = (clip.duration || 0) * (clip.speed ?? 1);
  const timeoutMs = detectTimeoutMs(segSec);
  const r = spawnSync(ffmpeg, buildStabilizeDetectArgs(inputAbs, clip, trfPath, opts),
    { stdio: ["ignore", "ignore", "pipe"], timeout: timeoutMs, killSignal: KILL_SIGNAL });
  if (r.error) {
    if (isTimeoutResult(r)) {
      return { ok: false, error: `vidstabdetect treo quá timeout ${(timeoutMs / 1000).toFixed(0)}s (đoạn ${segSec}s) — đã kill ${KILL_SIGNAL}` };
    }
    return { ok: false, error: `không chạy được ffmpeg cho vidstabdetect: ${r.error.message}` };
  }
  if (r.status !== 0) {
    return { ok: false, error: `vidstabdetect thoát mã ${r.status}: ${(r.stderr || "").toString().trim().slice(-300)}` };
  }
  return { ok: true };
}

/** Probe 1 lần: FFmpeg build này có những filter nào (để fail fast rõ ràng).
 * Đợt 74 B4: timeout 15s; treo → timedOut=true để caller báo đúng nguyên
 * nhân thay vì "thiếu filter" (trước đây out rỗng → has() false → báo thiếu). */
function probeFilterSupport(ffmpeg) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-filters"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: probeTimeoutMs(), killSignal: KILL_SIGNAL });
  const out = (r.stdout || "") + (r.stderr || "");
  const has = (name) => new RegExp(`\\b${name}\\b`).test(out);
  return { vidstabdetect: has("vidstabdetect"), vidstabtransform: has("vidstabtransform"), hqdn3d: has("hqdn3d"), yadif: has("yadif"), timedOut: isTimeoutResult(r) };
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
  // Đợt 70 X8: `copy` phải đứng NGAY TRƯỚC vidstabtransform (khử spread do
  // ghi in-place lên buffer decoder — xem comment trong buildEnhancePreChain).
  assert.ok(tr.includes(",copy,vidstabtransform="), tr);
  const trYadif = buildEnhancePreChain({ deinterlace: true, stabilize: { smoothing: 10 } }, "/tmp/x.trf");
  assert.ok(trYadif.includes("yadif=mode=0") && trYadif.includes(",copy,vidstabtransform="), trYadif);
  assert.throws(() => buildEnhancePreChain({ stabilize: {} }, null), /trf/);
  assert.ok(buildEnhancePostChain({ denoise: true }).startsWith(",hqdn3d="));
  assert.ok(buildEnhancePostChain({ denoise: { strength: 1 } }).includes("hqdn3d=24:18:24:18"));
  assert.strictEqual(buildEnhancePostChain({}), "");
  assert.ok(hasStabilize({ stabilize: {} }));
  assert.ok(!hasStabilize({ denoise: true }));
  assert.ok(hasEnhance({ denoise: true }));
  assert.ok(!hasEnhance({}));

  // Đợt 67 U1: argv vidstabdetect — mặc định KHÔNG có -threads (giữ hành vi
  // cũ); opts.singleThread=true thì "-threads 1" đứng TRƯỚC "-i".
  const detClip = { in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10 } } };
  const detArgs = buildStabilizeDetectArgs("/tmp/in.mp4", detClip, "/tmp/x.trf");
  assert.deepStrictEqual(detArgs.slice(0, 2), ["-i", "/tmp/in.mp4"], detArgs.join(" "));
  assert.ok(!detArgs.includes("-threads"), detArgs.join(" "));
  assert.ok(detArgs.join(" ").includes("vidstabdetect=result="), detArgs.join(" "));
  const detArgsT1 = buildStabilizeDetectArgs("/tmp/in.mp4", detClip, "/tmp/x.trf", { singleThread: true });
  assert.deepStrictEqual(detArgsT1.slice(0, 3), ["-threads", "1", "-i"], detArgsT1.join(" "));
  assert.strictEqual(STAB_DETECT_SINGLE_THREAD, false, "detect threads1 mặc định TẮT cho tới khi số đo đợt 67 chốt");

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
  STAB_DETECT_SINGLE_THREAD, // đợt 67 U1: detect có ép -threads 1 không (xem const trên)
  buildStabilizeDetectArgs, // đợt 67 U1: dựng argv detect (test được không cần ffmpeg)
  normStabParam, // đợt 62 R2: trfCache dùng để chuẩn hoá tham số detect trong key
  validateEnhance,
  hasStabilize,
  hasEnhance,
  buildEnhancePreChain,
  buildEnhancePostChain,
  runStabilizeDetect,
  probeFilterSupport,
};
