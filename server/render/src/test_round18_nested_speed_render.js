#!/usr/bin/env node
/**
 * test_round18_nested_speed_render.js — Kiểm chứng phía RENDER cho
 * speedKeyframes trên clip lồng nhau (Phase 9 đợt 18, spec xem
 * docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md).
 *
 * Chạy: node server/render/src/test_round18_nested_speed_render.js
 * File test MỚI, chỉ gọi nested.js / speedramp.js / render.js — không sửa
 * code sản phẩm, không sửa test của luồng khác.
 *
 * TÍNH ĐỘC LẬP (tránh kiểm chứng vòng tròn): mọi con số suy bằng tay từ
 * spec đợt 18, ghi cứng — không lấy từ code đang test.
 *
 * Curve chuẩn L (linear 1→2 trên D=4): s(t) = 1 + t/4, tích phân
 * u(t) = t + t²/8, tổng tiêu thụ C = 6. Nghịch đảo τ(w) = 4·(√(1+w/2) − 1):
 *   τ(1) = 0.8990, τ(2) = 1.6569, τ(3) = 2.3246, τ(4) = 2.9282,
 *   τ(5) = 3.4833, τ(6) = 4.
 *   speedAt(L, τ(w)) = 1 + τ(w)/4: tại τ(3) = 1.5811, τ(5) = 1.8708.
 *
 * Nguồn MP4: đỏ 0–4s, xanh lá 4–8s (64×64, 30fps, cùng nguồn với test N3).
 * Màu: "green" của FFmpeg là (0,128,0) nên ngưỡng xanh lá là G > 100.
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-n18speed-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

const { flattenSpecForRender, _sliceNestedRampKeyframes } = require("./nested");
const { speedAt } = require("./speedramp");

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }
function ff(args) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);
}
function ffProbe(file) {
  const out = execFileSync("ffprobe", ["-v", "quiet", "-print_format", "json",
    "-show_streams", "-show_format", file], { encoding: "utf8" });
  return JSON.parse(out);
}
function renderSpec(spec, outName) {
  const specPath = path.join(WORK, `spec-${outName}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(WORK, `${outName}.mp4`);
  const r = spawnSync(process.execPath, [
    path.join(HERE, "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
    "--crf", "28", "--x264-preset", "ultrafast", "-y", "-q",
  ], { encoding: "utf8" });
  return { ok: r.status === 0, code: r.status, stderr: (r.stderr || "") + (r.stdout || ""), outPath };
}
function frameMeanRGB(file, t) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error",
    "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "image2pipe",
    "-vcodec", "ppm", "-"]);
  let i = 0;
  const readToken = () => {
    while (buf[i] === 0x0a || buf[i] === 0x20 || buf[i] === 0x23) {
      if (buf[i] === 0x23) while (buf[i] !== 0x0a) i++;
      else i++;
    }
    let s = "";
    while (buf[i] !== 0x0a && buf[i] !== 0x20) s += String.fromCharCode(buf[i++]);
    return s;
  };
  const magic = readToken();
  const w = parseInt(readToken(), 10);
  const h = parseInt(readToken(), 10);
  readToken(); // maxval
  i++; // 1 byte whitespace sau maxval
  if (magic !== "P6" || !w || !h) throw new Error(`PPM parse lỗi: ${magic} ${w}x${h}`);
  let r = 0, g = 0, b = 0;
  const n = w * h;
  for (let p = 0; p < n; p++) {
    r += buf[i + p * 3]; g += buf[i + p * 3 + 1]; b += buf[i + p * 3 + 2];
  }
  return { r: r / n, g: g / n, b: b / n };
}
const isRed = (f) => f.r > 150 && f.g < 100;
const isGreen = (f) => f.g > 100 && f.r < 100 && f.g > f.b;

const CURVE_L = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 4, v: 2, easing: "linear" },
] };
function subSpec(clips, trackId, kind = "video") {
  return { version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: [{ id: trackId, kind, clips }] };
}
function specOf(top, kind = "video") {
  return {
    version: "0.2.0",
    meta: { name: "R18 nested speed test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind, clips: [top] }],
  };
}
function nestedTop(over, clips, trackId = "v-sub") {
  return { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: CURVE_L, trim: { in: 0, out: 6 },
    subSpec: subSpec(clips, trackId), ...over };
}
function flatLeaves(spec) {
  const flat = flattenSpecForRender(spec);
  const track = flat.spec.tracks.find((t) => t.id !== "v1" && t.id !== "a1");
  return { flat, leaves: track ? track.clips : [] };
}
function throws(name, fn, needle) {
  try {
    fn();
    ok(name, false, "(không throw)");
  } catch (e) {
    ok(name, !needle || String(e.message).includes(needle),
      `lỗi không khớp "${needle}": ${e.message}`);
  }
}

// ===========================================================================
// U1. Lá đơn phủ hết cửa sổ ramp → thành clip ramp giữ nguyên curve
// ===========================================================================
console.log("== U1. Lá đơn dưới ramp ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8 };
  const { leaves } = flatLeaves(specOf(nestedTop({}, [leaf])));
  ok("U1 1 lá phẳng", leaves.length === 1, `nhận ${leaves.length}`);
  const m = leaves[0];
  ok("U1 start 0, duration 4", approx(m.start, 0, 1e-6) && approx(m.duration, 4, 1e-6),
    `nhận start=${m.start} duration=${m.duration}`);
  ok("U1 in 0, out 6", m.in === 0 && m.out === 6, `nhận in=${m.in} out=${m.out}`);
  ok("U1 curve giữ nguyên [(0,1),(4,2)]",
    m.speedKeyframes && m.speedKeyframes.keyframes.length === 2 &&
    approx(m.speedKeyframes.keyframes[0].v, 1, 1e-9) &&
    approx(m.speedKeyframes.keyframes[1].t, 4, 1e-9) &&
    approx(m.speedKeyframes.keyframes[1].v, 2, 1e-9),
    JSON.stringify(m.speedKeyframes));
  ok("U1 không còn speed hằng", m.speed === undefined, `nhận speed=${m.speed}`);
}

// ===========================================================================
// U2. Hai lá kề nhau → slice curve tại τ(3) = 2.3246
// ===========================================================================
console.log("== U2. Hai lá kề nhau, slice tại biên ==");
{
  const a = { kind: "video", id: "A", src: "src.mp4", start: 0, duration: 3, in: 0, out: 3 };
  const b = { kind: "video", id: "B", src: "src.mp4", start: 3, duration: 3, in: 3, out: 6 };
  const { leaves } = flatLeaves(specOf(nestedTop({}, [a, b])));
  ok("U2 2 lá phẳng", leaves.length === 2, `nhận ${leaves.length}`);
  const [ma, mb] = leaves;
  ok("U2 A start 0, duration 2.3246",
    approx(ma.start, 0, 1e-3) && approx(ma.duration, 2.3246, 1e-3),
    `nhận ${ma.start} ${ma.duration}`);
  ok("U2 A curve [(0,1),(2.3246,1.5811)]",
    ma.speedKeyframes && ma.speedKeyframes.keyframes.length === 2 &&
    approx(ma.speedKeyframes.keyframes[1].t, 2.3246, 1e-3) &&
    approx(ma.speedKeyframes.keyframes[1].v, 1.5811, 1e-3),
    JSON.stringify(ma.speedKeyframes));
  ok("U2 B start 2.3246, duration 1.6754",
    approx(mb.start, 2.3246, 1e-3) && approx(mb.duration, 1.6754, 1e-3),
    `nhận ${mb.start} ${mb.duration}`);
  ok("U2 B curve [(0,1.5811),(1.6754,2)]",
    mb.speedKeyframes && mb.speedKeyframes.keyframes.length === 2 &&
    approx(mb.speedKeyframes.keyframes[0].v, 1.5811, 1e-3) &&
    approx(mb.speedKeyframes.keyframes[1].t, 1.6754, 1e-3) &&
    approx(mb.speedKeyframes.keyframes[1].v, 2, 1e-3),
    JSON.stringify(mb.speedKeyframes));
  ok("U2 B in 3, out 6", mb.in === 3 && mb.out === 6, `nhận in=${mb.in} out=${mb.out}`);
}

// ===========================================================================
// U3. Cửa sổ cắt trái (in=1): lá [0,6) khả kiến [1,6) → outer [0, 3.4833)
// ===========================================================================
console.log("== U3. Cửa sổ cắt trái ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8 };
  const top = nestedTop({ trim: { in: 1, out: 7 } }, [leaf]);
  const { leaves } = flatLeaves(specOf(top));
  ok("U3 1 lá phẳng", leaves.length === 1, `nhận ${leaves.length}`);
  const m = leaves[0];
  ok("U3 start 0, duration 3.4833",
    approx(m.start, 0, 1e-3) && approx(m.duration, 3.4833, 1e-3),
    `nhận ${m.start} ${m.duration}`);
  ok("U3 in' = 1, out' = 6", m.in === 1 && m.out === 6, `nhận in=${m.in} out=${m.out}`);
  ok("U3 curve [(0,1),(3.4833,1.8708)]",
    m.speedKeyframes && m.speedKeyframes.keyframes.length === 2 &&
    approx(m.speedKeyframes.keyframes[1].t, 3.4833, 1e-3) &&
    approx(m.speedKeyframes.keyframes[1].v, 1.8708, 1e-3),
    JSON.stringify(m.speedKeyframes));
}

// ===========================================================================
// U4. Lá tốc độ hằng 2 dưới ramp → curve nhân 2: [(0,2),(2.9282,3.4641)]
// ===========================================================================
console.log("== U4. Lá speed 2 dưới ramp ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 4, in: 0, out: 8, speed: 2 };
  const { leaves } = flatLeaves(specOf(nestedTop({}, [leaf])));
  const m = leaves[0];
  ok("U4 duration 2.9282", approx(m.duration, 2.9282, 1e-3), `nhận ${m.duration}`);
  ok("U4 curve nhân 2",
    m.speedKeyframes && m.speedKeyframes.keyframes.length === 2 &&
    approx(m.speedKeyframes.keyframes[0].v, 2, 1e-9) &&
    approx(m.speedKeyframes.keyframes[1].t, 2.9282, 1e-3) &&
    approx(m.speedKeyframes.keyframes[1].v, 3.4641, 1e-3),
    JSON.stringify(m.speedKeyframes));
  ok("U4 in 0, out 8 (capped đúng đoạn nguồn)", m.in === 0 && m.out === 8,
    `nhận in=${m.in} out=${m.out}`);
}

// ===========================================================================
// U5. Curve hằng gộp về tốc độ hằng (đẳng thức, không gần đúng)
// ===========================================================================
console.log("== U5. Curve hằng ==");
{
  const flatCurve = { keyframes: [
    { t: 0, v: 2, easing: "linear" },
    { t: 2, v: 2, easing: "linear" },
  ] };
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 4, in: 0, out: 4 };
  const top = { kind: "nested", id: "top", start: 0, duration: 2,
    speedKeyframes: flatCurve, trim: { in: 0, out: 4 }, subSpec: subSpec([leaf], "v-sub") };
  const { leaves } = flatLeaves(specOf(top));
  ok("U5 lá duration 2, speed 2, không còn curve",
    leaves.length === 1 && approx(leaves[0].duration, 2, 1e-9) &&
    leaves[0].speed === 2 && leaves[0].speedKeyframes === undefined,
    JSON.stringify(leaves[0]));
  const animLeaf = { kind: "video", id: "A", src: "src.mp4", start: 0, duration: 4, in: 0, out: 4,
    animations: { opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } } };
  throws("U5 lá có keyframes dưới curve hằng v=2 vẫn fail (luật speed != 1)",
    () => flatLeaves(specOf({ ...top, subSpec: subSpec([animLeaf], "v-sub") })));
  const flatOne = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 1, easing: "linear" },
  ] };
  const curveLeaf = { kind: "video", id: "C", src: "src.mp4", start: 0, duration: 4, in: 0, out: 4,
    speedKeyframes: CURVE_L };
  const topOne = { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: flatOne, trim: { in: 0, out: 4 }, subSpec: subSpec([curveLeaf], "v-sub") };
  const { leaves: leavesOne } = flatLeaves(specOf(topOne));
  ok("U5 curve hằng v=1: lá giữ nguyên curve riêng",
    leavesOne.length === 1 && leavesOne[0].speedKeyframes &&
    leavesOne[0].speedKeyframes.keyframes.length === 2,
    JSON.stringify(leavesOne[0] && leavesOne[0].speedKeyframes));
}

// ===========================================================================
// U6. Các trường hợp fail fast
// ===========================================================================
console.log("== U6. Fail fast ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8 };
  throws("U6 out không khớp in + ∫curve (ghi 5, đúng 6)",
    () => flatLeaves(specOf(nestedTop({ trim: { in: 0, out: 5 } }, [leaf]))), "không khớp");
  throws("U6 keyframe t vượt duration",
    () => flatLeaves(specOf(nestedTop({
      speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 5, v: 2, easing: "linear" }] },
    }, [leaf]))), "t phải trong");
  throws("U6 keyframe v vượt [0.25, 4]",
    () => flatLeaves(specOf(nestedTop({
      speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 5, easing: "linear" }] },
    }, [leaf]))), "v phải trong");
  throws("U6 reverse + curve trên nested",
    () => flatLeaves(specOf(nestedTop({ reverse: true }, [leaf]))), "reverse");
  throws("U6 speed hằng vượt khoảng dù có curve",
    () => flatLeaves(specOf(nestedTop({ speed: 5 }, [leaf]))), "speed phải trong");
  const revLeaf = { kind: "video", id: "R", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8, reverse: true };
  throws("U6 lá reverse dưới ramp",
    () => flatLeaves(specOf(nestedTop({}, [revLeaf]))), "reverse");
  // ĐỢT 20 R1 ĐỔI NGỮ NGHĨA (có chủ đích, xem docs/PHASE9_ROUND20_R1_TWO_LEVEL_LIMITS.md):
  // lá có curve riêng dưới ramp nay HỢP thành công thay vì throw. Fixture này dùng
  // CURVE_L (1→2 trên t∈[0,4]) cho cả hai tầng; tốc độ hợp tại t'=2 là
  // s_o(2)·s_i(u_o(2)) = 1.5·(1+2.5/4) = 2.4375 (tính tay). out' cap ở out gốc 8
  // theo đúng luật cap của R1 (đường ramp đợt 18), dù ∫ hợp = 10.
  const ownCurveLeaf = { kind: "video", id: "C", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8,
    speedKeyframes: CURVE_L };
  {
    const { leaves } = flatLeaves(specOf(nestedTop({}, [ownCurveLeaf])));
    ok("U6 lá có curve riêng dưới ramp nay hợp thành công (đợt 20 R1)",
      leaves.length === 1 && approx(leaves[0].start, 0, 1e-6) && approx(leaves[0].duration, 4, 1e-6)
      && leaves[0].in === 0 && leaves[0].out === 8 && !!leaves[0].speedKeyframes
      && approx(speedAt(leaves[0].speedKeyframes, 2), 2.4375, 1e-6),
      `nhận ${JSON.stringify(leaves.map((c) => ({ start: c.start, duration: c.duration, in: c.in, out: c.out })))}`);
  }
  const animLeaf = { kind: "video", id: "A", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8,
    animations: { opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } } };
  throws("U6 lá có keyframes opacity dưới ramp",
    () => flatLeaves(specOf(nestedTop({}, [animLeaf]))), "chưa được hỗ trợ");
  // Curve 2→2.5, C = 9; lá [0,7) in 0–14 speed 2 phủ hết cửa sổ con của
  // nó nên điểm biên slice có v = speedAt(τ(7)) ≈ 2.405, nhân 2 ≈ 4.81 > 4.
  const fastLeaf = { kind: "video", id: "F", src: "src.mp4", start: 0, duration: 7, in: 0, out: 14, speed: 2 };
  const wideCurve = { keyframes: [
    { t: 0, v: 2, easing: "linear" },
    { t: 4, v: 2.5, easing: "linear" },
  ] };
  throws("U6 tích tốc độ lá × curve vượt 4 (2 × ≈2.405)",
    () => flatLeaves(specOf(nestedTop({ speedKeyframes: wideCurve, trim: { in: 0, out: 9 } }, [fastLeaf]))),
    "vượt khoảng");
  const innerLeaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8 };
  // ĐỢT 20 R1 ĐỔI NGỮ NGHĨA (có chủ đích): hai tầng đều có curve nay hợp thành
  // công qua cùng đường hợp. duration' = τ(4) = 2.9282 (τ của CURVE_L), out' = 6
  // (trim out của tầng trong), tốc độ hợp tại t'=2 vẫn 2.4375 như case trên.
  const inner = { kind: "nested", id: "in", start: 0, duration: 4,
    speedKeyframes: CURVE_L, trim: { in: 0, out: 6 }, subSpec: subSpec([innerLeaf], "v-in") };
  {
    const { leaves } = flatLeaves(specOf(nestedTop({}, [inner])));
    ok("U6 hai tầng đều có curve nay hợp thành công (đợt 20 R1)",
      leaves.length === 1 && approx(leaves[0].duration, 2.9282032302755088, 1e-6)
      && leaves[0].in === 0 && leaves[0].out === 6 && !!leaves[0].speedKeyframes
      && approx(speedAt(leaves[0].speedKeyframes, 2), 2.4375, 1e-6),
      `nhận ${JSON.stringify(leaves.map((c) => ({ start: c.start, duration: c.duration, in: c.in, out: c.out })))}`);
  }
}

// ===========================================================================
// U7. Slice đánh giá đúng hệt với curve gốc (linear/ease/bezier/đa đoạn)
// ===========================================================================
console.log("== U7. Slice parity ==");
{
  const curves = {
    linear: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }],
    "ease-in": [{ t: 0, v: 1, easing: "ease-in" }, { t: 4, v: 2, easing: "ease-in" }],
    "ease-out": [{ t: 0, v: 1, easing: "ease-out" }, { t: 4, v: 2, easing: "ease-out" }],
    bezier: [{ t: 0, v: 1, easing: "bezier", bezier: [0.25, 2, 0.75, -1] },
             { t: 4, v: 2, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] }],
    multi: [{ t: 0, v: 1, easing: "linear" }, { t: 1, v: 2, easing: "ease-in" },
            { t: 3, v: 0.5, easing: "bezier", bezier: [0.42, 0, 0.58, 1] },
            { t: 4, v: 1.5, easing: "linear" }],
  };
  for (const [name, kfs] of Object.entries(curves)) {
    for (const [from, to] of [[0.7, 3.1], [1.3, 2.9], [0, 2.5], [2.0, 4]]) {
      const sliced = _sliceNestedRampKeyframes(kfs, from, to);
      let worst = 0;
      for (let i = 0; i <= 20; i++) {
        const tp = (to - from) * (i / 20);
        const a = speedAt({ keyframes: sliced }, tp);
        const b = speedAt({ keyframes: kfs }, from + tp);
        worst = Math.max(worst, Math.abs(a - b));
      }
      ok(`U7 slice ${name} [${from}, ${to}) sai số tối đa < 1e-3`, worst < 1e-3,
        `nhận ${worst}`);
    }
  }
}

// ===========================================================================
// U8. Transition trong project con dưới ramp: T' = τ(3) − τ(2) = 0.6677
// ===========================================================================
console.log("== U8. Transition trong dưới ramp ==");
{
  const a = { kind: "video", id: "A", src: "src.mp4", start: 0, duration: 3, in: 0, out: 3,
    transitionOut: { type: "fade", duration: 1 } };
  const b = { kind: "video", id: "B", src: "src.mp4", start: 3, duration: 3, in: 3, out: 6,
    transitionIn: { type: "fade", duration: 1 } };
  const { leaves } = flatLeaves(specOf(nestedTop({}, [a, b])));
  ok("U8 transitionOut' ≈ 0.6677",
    leaves[0].transitionOut && approx(leaves[0].transitionOut.duration, 0.6677, 1e-3),
    JSON.stringify(leaves[0].transitionOut));
  ok("U8 transitionIn' ≈ 0.6677",
    leaves[1].transitionIn && approx(leaves[1].transitionIn.duration, 0.6677, 1e-3),
    JSON.stringify(leaves[1].transitionIn));
}

// ===========================================================================
// U9. Fade audio dưới ramp: cắt trái 1s con → fadeIn 1 → 0, fadeOut giữ 1
// ===========================================================================
console.log("== U9. Fade audio dưới ramp ==");
{
  const leaf = { kind: "audio", id: "AU", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8,
    fadeIn: 1, fadeOut: 1 };
  const top = { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: CURVE_L, trim: { in: 1, out: 7 },
    subSpec: subSpec([leaf], "a-sub", "audio") };
  const spec = { version: "0.2.0",
    meta: { name: "R18 audio", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "a1", kind: "audio", clips: [top] }] };
  const flat = flattenSpecForRender(spec);
  const track = flat.spec.tracks.find((t) => t.id !== "a1");
  const m = track && track.clips[0];
  ok("U9 audio lá thành ramp, fadeIn 0, fadeOut 1",
    !!m && m.speedKeyframes !== undefined &&
    approx(m.fadeIn, 0, 1e-9) && approx(m.fadeOut, 1, 1e-9),
    JSON.stringify(m && { fadeIn: m.fadeIn, fadeOut: m.fadeOut, hasRamp: !!m.speedKeyframes }));
}

// ===========================================================================
// Chuẩn bị media + render MP4 thật
// ===========================================================================
console.log("== Chuẩn bị media ==");
ff(["-f", "lavfi", "-i", "color=c=red:s=64x64:r=30:d=4",
    "-f", "lavfi", "-i", "color=c=green:s=64x64:r=30:d=4",
    "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", path.join(MEDIA, "src.mp4")]);
ok("media đã tạo", fs.existsSync(path.join(MEDIA, "src.mp4")));

// ===========================================================================
// R1. Render lá đơn dưới ramp: u(t) = t + t²/8, duration 4
// ===========================================================================
console.log("== R1. Render lá đơn dưới ramp ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8 };
  const r = renderSpec(specOf(nestedTop({}, [leaf])), "rampSingle");
  ok("R1 render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("R1 duration video ≈ 4s", approx(parseFloat(v.duration), 4, 0.3), `nhận ${v.duration}`);
    const f05 = frameMeanRGB(r.outPath, 0.5);
    const f20 = frameMeanRGB(r.outPath, 2.0);
    const f30 = frameMeanRGB(r.outPath, 3.0);
    const f39 = frameMeanRGB(r.outPath, 3.9);
    ok("R1 frame t=0.5 đỏ (nguồn ≈ 0.53)", isRed(f05), JSON.stringify(f05));
    ok("R1 frame t=2.0 đỏ (nguồn ≈ 2.50)", isRed(f20), JSON.stringify(f20));
    ok("R1 frame t=3.0 xanh lá (nguồn ≈ 4.13)", isGreen(f30), JSON.stringify(f30));
    ok("R1 frame t=3.9 xanh lá (nguồn ≈ 5.80)", isGreen(f39), JSON.stringify(f39));
  }
}

// ===========================================================================
// R2. Render hai lá dưới ramp: biên lá tại outer τ(3) = 2.3246
// ===========================================================================
console.log("== R2. Render hai lá dưới ramp ==");
{
  const a = { kind: "video", id: "A", src: "src.mp4", start: 0, duration: 3, in: 0, out: 3 };
  const b = { kind: "video", id: "B", src: "src.mp4", start: 3, duration: 3, in: 3, out: 6 };
  const r = renderSpec(specOf(nestedTop({}, [a, b])), "rampTwo");
  ok("R2 render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("R2 duration video ≈ 4s", approx(parseFloat(v.duration), 4, 0.3), `nhận ${v.duration}`);
    const f10 = frameMeanRGB(r.outPath, 1.0);
    const f25 = frameMeanRGB(r.outPath, 2.5);
    const f35 = frameMeanRGB(r.outPath, 3.5);
    ok("R2 frame t=1.0 đỏ (lá A, nguồn ≈ 1.13)", isRed(f10), JSON.stringify(f10));
    ok("R2 frame t=2.5 đỏ (lá B, nguồn ≈ 3.28)", isRed(f25), JSON.stringify(f25));
    ok("R2 frame t=3.5 xanh lá (lá B, nguồn ≈ 5.03)", isGreen(f35), JSON.stringify(f35));
  }
}

// ===========================================================================
// R3. Spec out không khớp phải fail render (không render bừa)
// ===========================================================================
console.log("== R3. Out không khớp phải fail ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 8 };
  const r = renderSpec(specOf(nestedTop({ trim: { in: 0, out: 5 } }, [leaf])), "rampBadOut");
  ok("R3 render fail (exit != 0)", !r.ok, `nhận code=${r.code}`);
  ok("R3 stderr nhắc nested/out", /nested/.test(r.stderr) || /không khớp/.test(r.stderr),
    r.stderr.slice(-200));
}

console.log(`\n${pass}/${pass + fail} check pass, ${fail} fail. tmp=${WORK}`);
if (fail === 0) fs.rmSync(WORK, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);
