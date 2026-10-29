#!/usr/bin/env node
/**
 * test_round20_two_level_render.js — Kiểm chứng phía RENDER cho hợp curve
 * hai tầng (Phase 9 đợt 20 R1, đóng nợ đợt 19 G2 §1c/§3 + spec đợt 18 §5/§6).
 *
 * Chạy: node server/render/src/test_round20_two_level_render.js
 * File test MỚI, chỉ gọi nested.js / speedramp.js / render.js — không sửa
 * code sản phẩm, không sửa test của luồng khác.
 *
 * NGỮ NGHĨA KIỂM CHỨNG (định nghĩa bằng tích phân, xem
 * docs/PHASE9_ROUND20_R1_TWO_LEVEL_LIMITS.md):
 *   Lá video/audio mang speedKeyframes riêng s_i(x) dưới nested có curve
 *   s_o(T): thời gian nguồn tại thời gian output ngoài t' là hợp hai
 *   ánh xạ x(t') = leftCut + ∫_{T_start}^{T_start+t'} s_o, rồi
 *   src(t') = lá.in + ∫₀^{x(t')} s_i; tốc độ hợp c(t') = s_o · s_i(x).
 *   Mã hoá c thành speedKeyframes là Hermite-bezier (x1=1/3, x2=2/3):
 *   linear×linear cho c là đa thức bậc 3 nên Hermite tái tạo ĐÚNG HỆT;
 *   easing khác thì sai số O(h⁴), h ≤ 0.25s. Hai trường hợp hằng thì
 *   ĐÚNG HỆT bằng slice (không qua Hermite).
 *
 * TÍNH ĐỘC LẬP: các số (a) suy tay bằng công thức giải tích, ghi cứng —
 * không lấy từ code đang test. Trường hợp (b) ease+bezier không có dạng
 * đóng đơn giản nên chỉ kiểm chứng sai số mã hoá so với hàm hợp ĐÚNG
 * (twoLevelExact, tức định nghĩa tích phân) — đó chính là đại lượng
 * cần đo, không phải kiểm chứng vòng tròn về ngữ nghĩa (ngữ nghĩa đã
 * khóa bằng (a)).
 *
 * Curve chuẩn L (linear 1→2 trên D=4): s(t) = 1 + t/4, ∫₀ᵗ = t + t²/8,
 * tổng C = 6, τ(w) = 4·(√(1+w/2) − 1): τ(1) = 0.8990, τ(4) = 2.9282,
 * τ(5) = 3.4833, τ(6) = 4.
 * Case (a): ngoài L trên D=4, trong linear 1→2 trên duration con 6:
 *   s_i(x) = 1 + x/6, ∫₀ˣ = x + x²/12.
 *   x(t') = t' + t'²/8; src(t') = x + x²/12.
 *   t'=0 → x=0, src=0, c=1. t'=2 → x=2.5, src=3.0208333, c=2.125.
 *   t'=4 → x=6, src=9, c=4. Lá phẳng: start 0, duration 4, in 0, out 9.
 *
 * Nguồn MP4: đỏ 0–4s, xanh lá 4–12s (64×64, 30fps; dài hơn nguồn đợt 18
 * vì nguồn hợp tới 9s). Màu: "green" của FFmpeg là (0,128,0) nên ngưỡng
 * xanh lá là G > 100.
 *
 * LƯU Ý VỀ TEST CŨ: test_round18 có 2 assertion cũ nay ĐÃ LỖI THỜI
 * (U6 "lá có curve riêng dưới ramp" và U6 "hai tầng đều có curve" từng
 * expect throw) — đợt 20 R1 cố tình đổi hành vi đó thành hợp thành
 * công, nên khi chạy lại test_round18 sẽ thấy đúng 2 check đó fail;
 * test này thay thế chúng bằng các assertion thành công tương ứng
 * (A/D8). Không sửa test_round18 (không thuộc file được sửa).
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r20two-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

const {
  flattenSpecForRender, _twoLevelExact, _nestedWindow,
} = require("./nested");
const { speedAt, integrateSpeed } = require("./speedramp");

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
  readToken();
  i++;
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

const LINEAR_1_2_4 = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 4, v: 2, easing: "linear" },
] };
const LINEAR_1_2_6 = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 6, v: 2, easing: "linear" },
] };
function subSpec(clips, trackId, kind = "video") {
  return { version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: [{ id: trackId, kind, clips }] };
}
function specOf(top, kind = "video") {
  return {
    version: "0.2.0",
    meta: { name: "R20 two-level test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind, clips: [top] }],
  };
}
function nestedRampTop(over, clips, trackId = "v-sub") {
  return { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: LINEAR_1_2_4, trim: { in: 0, out: 6 },
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
// (a) Ngoài linear 1→2 + trong linear 1→2 — số nguồn khớp tính tay
// ===========================================================================
console.log("== (a) linear x linear ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6 };
  const top = nestedRampTop({}, [leaf]);
  const { leaves } = flatLeaves(specOf(top));
  ok("a 1 lá phẳng", leaves.length === 1, `nhận ${leaves.length}`);
  const m = leaves[0];
  ok("a start 0, duration 4", approx(m.start, 0, 1e-6) && approx(m.duration, 4, 1e-6),
    `nhận start=${m.start} duration=${m.duration}`);
  ok("a in 0, out 9 (tính tay)", m.in === 0 && approx(m.out, 9, 1e-6),
    `nhận in=${m.in} out=${m.out}`);
  ok("a không còn speed hằng", m.speed === undefined, `nhận speed=${m.speed}`);
  // Hàm hợp ĐÚNG (tích phân) so với tính tay, sai số 1e-6.
  const win = _nestedWindow(top, "test", []);
  const ex = _twoLevelExact(win, { keyframes: LINEAR_1_2_6.keyframes }, leaf, 0, 6);
  ok("a exact sourceAt(2) = 3.0208333", approx(ex.sourceAt(2), 3.0208333333333335, 1e-6),
    `nhận ${ex.sourceAt(2)}`);
  ok("a exact sourceAt(4) = 9", approx(ex.sourceAt(4), 9, 1e-6), `nhận ${ex.sourceAt(4)}`);
  ok("a exact speedAt(2) = 2.125", approx(ex.speedAt(2), 2.125, 1e-6), `nhận ${ex.speedAt(2)}`);
  ok("a exact speedAt(0) = 1, speedAt(4) = 4",
    approx(ex.speedAt(0), 1, 1e-6) && approx(ex.speedAt(4), 4, 1e-6),
    `nhận ${ex.speedAt(0)} ${ex.speedAt(4)}`);
  // Curve mã hoá (Hermite) phải khớp hàm hợp đúng trong 1e-6 ở case này
  // (linear×linear → đa thức bậc 3, Hermite tái tạo đúng hệt).
  let worstS = 0, worstI = 0;
  for (let i = 0; i <= 40; i++) {
    const t = i * 0.1;
    worstS = Math.max(worstS, Math.abs(speedAt(m.speedKeyframes, t) - ex.speedAt(t)));
    worstI = Math.max(worstI, Math.abs(integrateSpeed(m.speedKeyframes, 0, t) - ex.sourceAt(t)));
  }
  ok("a encoded speed khớp exact < 1e-6", worstS < 1e-6, `nhận ${worstS}`);
  ok("a encoded integral khớp exact < 1e-6", worstI < 1e-6, `nhận ${worstI}`);
  ok("a encoded integral toàn phần = 9", approx(integrateSpeed(m.speedKeyframes, 0, 4), 9, 1e-6),
    `nhận ${integrateSpeed(m.speedKeyframes, 0, 4)}`);
  ok("a keyframe <= 128", m.speedKeyframes.keyframes.length <= 128,
    `nhận ${m.speedKeyframes.keyframes.length}`);
}

// ===========================================================================
// (a2) Cắt trái cửa sổ: window [1, 7), lá [0, 6) khả kiến [1, 6)
//   vs − in = 0 nên T_start = τ(0) = 0 (đầu nested vẫn là start ngoài),
//   T_end = τ(5) = 3.4833, duration' = 3.4833.
//   in' = ∫₀¹ s_i = 1 + 1/12 = 1.083333, out' = 9.
// ===========================================================================
console.log("== (a2) linear x linear, cắt trái ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6 };
  const top = nestedRampTop({ trim: { in: 1, out: 7 } }, [leaf]);
  const { leaves } = flatLeaves(specOf(top));
  const m = leaves[0];
  ok("a2 start 0, duration 3.4833",
    approx(m.start, 0, 1e-6) && approx(m.duration, 3.483314, 1e-3),
    `nhận start=${m.start} duration=${m.duration}`);
  ok("a2 in' 1.083333, out' 9",
    approx(m.in, 1.0833333333333333, 1e-6) && approx(m.out, 9, 1e-6),
    `nhận in=${m.in} out=${m.out}`);
}

// ===========================================================================
// (b) Ngoài ease-in + trong bezier — sai số mã hoá nhỏ
//   Ngoài ease-in 1→2 trên [0,4]: ∫ = 5.333333 nên trim out = 5.333333.
// ===========================================================================
console.log("== (b) ease-in x bezier ==");
{
  const outer = { keyframes: [
    { t: 0, v: 1, easing: "ease-in" },
    { t: 4, v: 2, easing: "ease-in" },
  ] };
  const inner = { keyframes: [
    { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
    { t: 6, v: 2, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
  ] };
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 20,
    speedKeyframes: inner };
  const top = { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: outer, trim: { in: 0, out: 5.333333333333333 },
    subSpec: subSpec([leaf], "v-sub") };
  const { leaves } = flatLeaves(specOf(top));
  const m = leaves[0];
  ok("b duration 4, keyframe <= 128",
    approx(m.duration, 4, 1e-6) && m.speedKeyframes.keyframes.length <= 128,
    `nhận duration=${m.duration} kf=${m.speedKeyframes.keyframes.length}`);
  const win = _nestedWindow(top, "test", []);
  const ex = _twoLevelExact(win, { keyframes: inner.keyframes }, leaf, 0, 5.333333333333333);
  ok("b in/out phẳng khớp hàm hợp đúng",
    approx(m.in, ex.in, 1e-9) && approx(m.out, ex.out, 1e-9),
    `nhận in=${m.in} out=${m.out} exact in=${ex.in} out=${ex.out}`);
  let worstS = 0, worstI = 0;
  for (let i = 0; i <= 80; i++) {
    const t = m.duration * (i / 80);
    worstS = Math.max(worstS, Math.abs(speedAt(m.speedKeyframes, t) - ex.speedAt(t)));
    worstI = Math.max(worstI, Math.abs(integrateSpeed(m.speedKeyframes, 0, t) - ex.sourceAt(t)));
  }
  ok("b encoded speed khớp exact < 1e-3", worstS < 1e-3, `nhận ${worstS}`);
  ok("b encoded integral khớp exact < 1e-3", worstI < 1e-3, `nhận ${worstI}`);
}

// ===========================================================================
// (c) Curve hằng ở một tầng gộp đúng về tốc độ hằng (ĐÚNG HỆT, slice)
// ===========================================================================
console.log("== (c) curve hằng ==");
{
  // C1: trong hằng 1.5 dưới ngoài linear → slice ngoài × 1.5.
  const constInner = { keyframes: [
    { t: 0, v: 1.5, easing: "linear" },
    { t: 6, v: 1.5, easing: "linear" },
  ] };
  const leaf1 = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: constInner };
  const { leaves: l1 } = flatLeaves(specOf(nestedRampTop({}, [leaf1])));
  ok("c1 curve [(0,1.5),(4,3)] đúng hệt",
    l1[0].speedKeyframes && l1[0].speedKeyframes.keyframes.length === 2 &&
    approx(l1[0].speedKeyframes.keyframes[0].v, 1.5, 1e-9) &&
    approx(l1[0].speedKeyframes.keyframes[1].t, 4, 1e-9) &&
    approx(l1[0].speedKeyframes.keyframes[1].v, 3, 1e-9),
    JSON.stringify(l1[0].speedKeyframes));
  ok("c1 in 0, out 9", l1[0].in === 0 && approx(l1[0].out, 9, 1e-9),
    `nhận in=${l1[0].in} out=${l1[0].out}`);
  // C1b: trong chỉ 1 keyframe (hằng) cũng gộp như trên.
  const oneInner = { keyframes: [{ t: 0, v: 1.5, easing: "linear" }] };
  const leaf1b = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: oneInner };
  const { leaves: l1b } = flatLeaves(specOf(nestedRampTop({}, [leaf1b])));
  ok("c1b 1 keyframe hằng cũng slice × 1.5",
    l1b[0].speedKeyframes && l1b[0].speedKeyframes.keyframes.length === 2 &&
    approx(l1b[0].speedKeyframes.keyframes[1].v, 3, 1e-9),
    JSON.stringify(l1b[0].speedKeyframes));
  // C2: ngoài hằng 2 (curve hằng đã gộp ở nestedWindow) + trong linear
  //   1→2 trên 6: duration' = 3, curve [(0,2),(3,4)], in 0, out 9.
  const constOuter = { keyframes: [
    { t: 0, v: 2, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ] };
  const leaf2 = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 20,
    speedKeyframes: LINEAR_1_2_6 };
  const top2 = { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: constOuter, trim: { in: 0, out: 8 }, subSpec: subSpec([leaf2], "v-sub") };
  const { leaves: l2 } = flatLeaves(specOf(top2));
  ok("c2 duration 3, curve [(0,2),(3,4)]",
    approx(l2[0].duration, 3, 1e-9) && l2[0].speedKeyframes &&
    l2[0].speedKeyframes.keyframes.length === 2 &&
    approx(l2[0].speedKeyframes.keyframes[0].v, 2, 1e-9) &&
    approx(l2[0].speedKeyframes.keyframes[1].t, 3, 1e-9) &&
    approx(l2[0].speedKeyframes.keyframes[1].v, 4, 1e-9),
    JSON.stringify(l2[0].speedKeyframes));
  ok("c2 in 0, out 9", l2[0].in === 0 && approx(l2[0].out, 9, 1e-9),
    `nhận in=${l2[0].in} out=${l2[0].out}`);
  // C3: ngoài speed hằng thuần 2 (không curve) + trong linear — cùng
  //   đường đổi biến tuyến tính, duration' 3, curve [(0,2),(3,4)].
  const top3 = { kind: "nested", id: "top", start: 0, duration: 3, speed: 2,
    trim: { in: 0, out: 6 }, subSpec: subSpec([leaf2], "v-sub") };
  const { leaves: l3 } = flatLeaves(specOf(top3));
  ok("c3 speed hằng 2 + curve trong: duration 3, curve [(0,2),(3,4)]",
    approx(l3[0].duration, 3, 1e-9) && l3[0].speedKeyframes &&
    approx(l3[0].speedKeyframes.keyframes[1].v, 4, 1e-9),
    JSON.stringify(l3[0].speedKeyframes));
  // C4: ngoài hằng 1 + trong linear: giữ nguyên curve trong.
  const top4 = { kind: "nested", id: "top", start: 0, duration: 6, speed: 1,
    trim: { in: 0, out: 6 }, subSpec: subSpec([leaf2], "v-sub") };
  const { leaves: l4 } = flatLeaves(specOf(top4));
  ok("c4 speed 1 + curve trong: duration 6, curve giữ nguyên",
    approx(l4[0].duration, 6, 1e-9) && l4[0].speedKeyframes &&
    l4[0].speedKeyframes.keyframes.length === 2 &&
    approx(l4[0].speedKeyframes.keyframes[1].v, 2, 1e-9),
    JSON.stringify(l4[0].speedKeyframes));
}

// ===========================================================================
// (d) Vẫn fail-fast cho reverse / attachment; (d8) hai tầng đều có curve
//   nay THÀNH CÔNG (thay thế assertion cũ của đợt 18).
// ===========================================================================
console.log("== (d) fail-fast + hai tầng nested ==");
{
  const base = (leaf) => specOf(nestedRampTop({}, [leaf]));
  const revLeaf = { kind: "video", id: "R", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6, reverse: true };
  throws("d1 lá curve + reverse dưới ramp vẫn fail",
    () => flatLeaves(base(revLeaf)), "reverse");
  const revPlain = { kind: "video", id: "R", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    reverse: true };
  throws("d1b lá reverse (không curve) dưới ramp vẫn fail",
    () => flatLeaves(base(revPlain)), "reverse");
  const animLeaf = { kind: "video", id: "A", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6,
    animations: { opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } } };
  throws("d2 lá curve + keyframes opacity dưới ramp vẫn fail",
    () => flatLeaves(base(animLeaf)), "chưa được hỗ trợ");
  const trackLeaf = { kind: "video", id: "T", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6, track: { points: [{ t: 0, x: 0, y: 0 }] } };
  throws("d3 lá curve + track dưới ramp vẫn fail",
    () => flatLeaves(base(trackLeaf)), "chưa được hỗ trợ");
  const volLeaf = { kind: "audio", id: "V", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6, volumeKeyframes: [{ t: 0, v: 1 }] };
  throws("d4 lá curve + volumeKeyframes dưới ramp vẫn fail",
    () => flatLeaves(base(volLeaf)), "chưa được hỗ trợ");
  const textLeaf = { kind: "text", id: "X", start: 0, duration: 6,
    speedKeyframes: LINEAR_1_2_6 };
  throws("d5 lá text mang curve dưới ramp vẫn fail (ngoài phạm vi)",
    () => flatLeaves(base(textLeaf)), "chỉ hỗ trợ");
  const badInner = { kind: "video", id: "B", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: { keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 6, v: 5, easing: "linear" },
    ] } };
  throws("d6 curve trong v vượt [0.25, 4] vẫn fail",
    () => flatLeaves(base(badInner)), "v phải trong");
  // Tích vượt: ngoài linear 2→3 (∫=10), trong linear 1→2 → hợp cuối 6 > 4.
  const wideOuter = { keyframes: [
    { t: 0, v: 2, easing: "linear" },
    { t: 4, v: 3, easing: "linear" },
  ] };
  const wideLeaf = { kind: "video", id: "W", src: "src.mp4", start: 0, duration: 6, in: 0, out: 20,
    speedKeyframes: LINEAR_1_2_6 };
  const wideTop = { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: wideOuter, trim: { in: 0, out: 10 }, subSpec: subSpec([wideLeaf], "v-sub") };
  throws("d7 tốc độ hợp vượt 4 vẫn fail",
    () => flatLeaves(specOf(wideTop)), "vượt khoảng");
  // D8: hai tầng nested đều có curve — nay thành công. Tầng trong tổng
  //   hợp lá thành ramp L trên [0,4] (duration con 4, in 0, out 6); tầng
  //   ngoài L thấy lá [0,4) trong cửa sổ [0,6): duration' = τ(4) = 2.9282,
  //   nguồn = ∫₀⁴ s_i = 4 + 16/8 = 6.
  const innerLeaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12 };
  const inner = { kind: "nested", id: "in", start: 0, duration: 4,
    speedKeyframes: LINEAR_1_2_4, trim: { in: 0, out: 6 }, subSpec: subSpec([innerLeaf], "v-in") };
  const { leaves: l8 } = flatLeaves(specOf(nestedRampTop({}, [inner])));
  ok("d8 hai tầng đều có curve: 1 lá, duration 2.9282, in 0, out 6",
    l8.length === 1 && approx(l8[0].duration, 2.9282, 1e-3) &&
    l8[0].in === 0 && approx(l8[0].out, 6, 1e-6) && l8[0].speedKeyframes !== undefined,
    JSON.stringify(l8[0] && { duration: l8[0].duration, in: l8[0].in, out: l8[0].out }));
}

// ===========================================================================
// (e2) Lá audio có curve dưới ramp + fade giữ nguyên khi không bị cắt
// ===========================================================================
console.log("== (e2) audio curve dưới ramp ==");
{
  const leaf = { kind: "audio", id: "AU", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6, fadeIn: 1, fadeOut: 1 };
  const top = { kind: "nested", id: "top", start: 0, duration: 4,
    speedKeyframes: LINEAR_1_2_4, trim: { in: 0, out: 6 },
    subSpec: subSpec([leaf], "a-sub", "audio") };
  const spec = { version: "0.2.0",
    meta: { name: "R20 audio", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "a1", kind: "audio", clips: [top] }] };
  const flat = flattenSpecForRender(spec);
  const track = flat.spec.tracks.find((t) => t.id !== "a1");
  const m = track && track.clips[0];
  ok("e2 audio lá thành ramp hợp, duration 4, fade 1/1, out 9",
    !!m && m.speedKeyframes !== undefined && approx(m.duration, 4, 1e-6) &&
    approx(m.fadeIn, 1, 1e-9) && approx(m.fadeOut, 1, 1e-9) && approx(m.out, 9, 1e-6),
    JSON.stringify(m && { duration: m.duration, fadeIn: m.fadeIn, fadeOut: m.fadeOut, out: m.out }));
}

// ===========================================================================
// Chuẩn bị media + render MP4 thật (e)
//   src(t') = x + x²/12 với x = t' + t'²/8:
//   t'=0.5 → src 0.55 đỏ; t'=2.0 → src 3.02 đỏ;
//   t'=3.0 → src 5.54 xanh; t'=3.9 → src 8.61 xanh.
// ===========================================================================
console.log("== Chuẩn bị media ==");
ff(["-f", "lavfi", "-i", "color=c=red:s=64x64:r=30:d=4",
    "-f", "lavfi", "-i", "color=c=green:s=64x64:r=30:d=8",
    "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", path.join(MEDIA, "src.mp4")]);
ok("media đã tạo", fs.existsSync(path.join(MEDIA, "src.mp4")));

console.log("== (e) Render MP4 hai tầng ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 6, in: 0, out: 12,
    speedKeyframes: LINEAR_1_2_6 };
  const r = renderSpec(specOf(nestedRampTop({}, [leaf])), "twoLevel");
  ok("e render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("e duration video ≈ 4s", approx(parseFloat(v.duration), 4, 0.3), `nhận ${v.duration}`);
    const f05 = frameMeanRGB(r.outPath, 0.5);
    const f20 = frameMeanRGB(r.outPath, 2.0);
    const f30 = frameMeanRGB(r.outPath, 3.0);
    const f39 = frameMeanRGB(r.outPath, 3.9);
    ok("e frame t=0.5 đỏ (nguồn ≈ 0.55)", isRed(f05), JSON.stringify(f05));
    ok("e frame t=2.0 đỏ (nguồn ≈ 3.02)", isRed(f20), JSON.stringify(f20));
    ok("e frame t=3.0 xanh lá (nguồn ≈ 5.54)", isGreen(f30), JSON.stringify(f30));
    ok("e frame t=3.9 xanh lá (nguồn ≈ 8.61)", isGreen(f39), JSON.stringify(f39));
  }
}

console.log(`\n${pass}/${pass + fail} check pass, ${fail} fail. tmp=${WORK}`);
if (fail === 0) fs.rmSync(WORK, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);
