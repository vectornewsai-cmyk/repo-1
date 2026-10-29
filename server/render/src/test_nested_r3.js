#!/usr/bin/env node
/**
 * test_nested_r3.js — Test cho transition qua biên nested + opacity kế thừa
 * (R3, Phase 9). Chạy: node src/test_nested_r3.js (từ server/render/).
 * Thoát 0 khi tất cả pass, 1 khi có fail. Tự tạo media test bằng FFmpeg
 * (color đỏ/xanh) trong thư mục tạm rồi dọn dẹp.
 *
 * Bao gồm:
 *  A. Unit flatten (require nested.js, không chạy render worker):
 *     U1 fade-in qua biên phẳng→lồng nhau (lá dịch sớm + keyframes 0→1,
 *        transitionOut của clip phẳng bị strip);
 *     U2 fade-out qua biên lồng nhau→phẳng (clip phẳng dịch sớm + keyframes
 *        1→0, transitionIn bị strip);
 *     U3 lồng nhau→lồng nhau (chỉ phía sau fade-in, phía trước giữ nguyên);
 *     U4 opacity kế thừa (tĩnh nhân, keyframes nhân giá trị, lồng 2 cấp
 *        nhân dồn 0.5×0.5=0.25);
 *     U5 fail fast: type khác fade, dual 2 đầu, clip phẳng bị dịch còn dính
 *        transition khác, clip phẳng đầu trái đã có transition phẳng,
 *        lá biên có keyframes opacity sẵn, lá biên bị cắt trái (fade-in),
 *        lá biên kind image, T dài hơn lá biên, opacity lồng nhau > 1;
 *     U6 track không phải video: cảnh báo + bỏ qua, không throw, không dịch;
 *     U7 spec phẳng hồi quy (deep-equal, cặp phẳng không bị đụng);
 *     U8 fade + opacity lồng nhau kết hợp (ramp kết thúc ở effOp, không
 *        nhân đôi).
 *  B. Render thật bằng FFmpeg qua render.js CLI:
 *     B1 fade-in: frame giữa transition là blend thật (không cắt cứng),
 *        frame đầu đỏ thuần, frame cuối xanh thuần;
 *     B2 opacity 0.5 trên nested: frame lá tối đúng tỉ lệ (đỏ ~50%);
 *     B3 fade-out: frame giữa transition là blend thật;
 *     B4 type wipeleft qua biên → CLI exit != 0, message nêu rõ chỉ "fade".
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SRC_DIR = __dirname;
const { flattenSpecForRender } = require("./nested");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "repo1-nstr3-"));
const MEDIA = path.join(TMP, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let failures = 0;
let checks = 0;
function check(name, cond, extra = "") {
  checks += 1;
  if (cond) console.log(`  PASS ${name}`);
  else { failures += 1; console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`); }
}
function eq(a, b, eps = 1e-6) { return Math.abs(a - b) <= eps; }
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", ...opts });
}
function throws(fn, re) {
  try { fn(); return false; }
  catch (e) { return !re || re.test(e.message); }
}

const meta = { name: "nested-r3-test", width: 320, height: 240, fps: 10 };
const vclip = (id, src, start, duration, inn, out, extra = {}) =>
  ({ kind: "video", id, src, start, duration, in: inn, out, ...extra });
const track = (id, kind, clips, extra = {}) => ({ id, kind, clips, ...extra });
const spec = (tracks) => ({ version: "0.2.0", meta, tracks });
// Clip lồng nhau shape N1: trim {in, out}, speed mặc định 1.
const nested = (id, start, duration, subTracks, extra = {}) => ({
  kind: "nested", id, start, duration,
  subSpec: { tracks: subTracks },
  trim: { in: 0, out: duration },
  ...extra,
});
const flatTracksOf = (flat) => flat.spec.tracks;
const findClip = (flat, id) => {
  for (const t of flat.spec.tracks)
    for (const c of (t.clips || [])) if (c.id === id) return c;
  return null;
};
const opKeyframes = (clip) => (clip.animations && clip.animations.opacity)
  ? clip.animations.opacity.keyframes : null;

// --- Media test: color đỏ/xanh 6s, 320x240, 10fps ---------------------------
console.log(`[media] tmp=${TMP}`);
for (const [file, color] of [["red.mp4", "red"], ["blue.mp4", "blue"]]) {
  const r = run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i",
    `color=c=${color}:size=320x240:rate=10:duration=6`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(MEDIA, file)]);
  if (r.status !== 0) {
    console.log(`  FAIL tạo media ${file}: ${r.stderr}`);
    failures += 1;
  }
}

// --- U1. Fade-in phẳng → lồng nhau -----------------------------------------
console.log("[U1] fade-in qua biên phẳng→lồng nhau");
{
  const s = spec([track("v", "video", [
    vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
    nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 2, 0, 2)])]),
  ])]);
  const flat = flattenSpecForRender(s);
  const a = findClip(flat, "a");
  const leaf = findClip(flat, "leaf");
  check("U1 clip phẳng bị strip transitionOut", a && a.transitionOut === undefined,
    JSON.stringify(a));
  check("U1 lá dịch sớm 1s", leaf && eq(leaf.start, 1) && eq(leaf.duration, 2),
    JSON.stringify(leaf));
  const kf = leaf && opKeyframes(leaf);
  check("U1 lá có keyframes fade-in 0→1",
    kf && kf.length === 2 && eq(kf[0].t, 0) && eq(kf[0].v, 0) &&
    eq(kf[1].t, 1) && eq(kf[1].v, 1), JSON.stringify(kf));
  check("U1 không warning", flat.warnings.length === 0, JSON.stringify(flat.warnings));
}

// --- U2. Fade-out lồng nhau → phẳng ---------------------------------------
console.log("[U2] fade-out qua biên lồng nhau→phẳng");
{
  const s = spec([track("v", "video", [
    nested("n", 0, 2, [track("sv", "video", [vclip("leaf", "red.mp4", 0, 2, 0, 2)])],
      { transitionOut: { type: "fade", duration: 1 } }),
    vclip("b", "blue.mp4", 2, 2, 0, 2),
  ])]);
  const flat = flattenSpecForRender(s);
  const b = findClip(flat, "b");
  const leaf = findClip(flat, "leaf");
  check("U2 clip phẳng dịch sớm 1s", b && eq(b.start, 1) && eq(b.duration, 2),
    JSON.stringify(b));
  const kf = leaf && opKeyframes(leaf);
  check("U2 lá có keyframes fade-out 1→0",
    kf && kf.length === 2 && eq(kf[0].t, 1) && eq(kf[0].v, 1) &&
    eq(kf[1].t, 2) && eq(kf[1].v, 0), JSON.stringify(kf));
}

// --- U3. Lồng nhau → lồng nhau (chỉ phía sau fade-in) ----------------------
console.log("[U3] fade lồng nhau→lồng nhau");
{
  const s = spec([track("v", "video", [
    nested("n1", 0, 2, [track("s1", "video", [vclip("l1", "red.mp4", 0, 2, 0, 2)])],
      { transitionOut: { type: "fade", duration: 1 } }),
    nested("n2", 2, 2, [track("s2", "video", [vclip("l2", "blue.mp4", 0, 2, 0, 2)])]),
  ])]);
  const flat = flattenSpecForRender(s);
  const l1 = findClip(flat, "l1");
  const l2 = findClip(flat, "l2");
  check("U3 lá trước giữ nguyên (không fade, không dịch)",
    l1 && eq(l1.start, 0) && !opKeyframes(l1), JSON.stringify(l1));
  const kf = l2 && opKeyframes(l2);
  check("U3 lá sau dịch sớm + fade-in",
    l2 && eq(l2.start, 1) && kf && eq(kf[0].v, 0) && eq(kf[1].v, 1),
    JSON.stringify(l2));
}

// --- U4. Opacity kế thừa ----------------------------------------------------
console.log("[U4] opacity kế thừa");
{
  const s = spec([track("v", "video", [
    nested("n", 0, 2, [track("sv", "video", [
      vclip("s1", "red.mp4", 0, 1, 0, 1, { opacity: 0.8 }),
      vclip("s2", "red.mp4", 1, 1, 0, 1,
        { animations: { opacity: { keyframes: [{ t: 0, v: 0.8 }, { t: 1, v: 0.8 }] } } }),
    ])], { opacity: 0.5 }),
  ])]);
  const flat = flattenSpecForRender(s);
  const s1 = findClip(flat, "s1");
  const s2 = findClip(flat, "s2");
  check("U4 tĩnh 0.8 × 0.5 = 0.4", s1 && eq(s1.opacity, 0.4),
    JSON.stringify(s1 && s1.opacity));
  const kf = s2 && opKeyframes(s2);
  check("U4 keyframes 0.8 × 0.5 = 0.4",
    kf && eq(kf[0].v, 0.4) && eq(kf[1].v, 0.4), JSON.stringify(kf));
  check("U4 lá có keyframes thì giữ nguyên static (undefined)",
    s2 && s2.opacity === undefined, JSON.stringify(s2 && s2.opacity));
  // Lồng 2 cấp: 0.5 × 0.5 = 0.25.
  const sB = spec([track("v", "video", [
    nested("outer", 0, 2, [track("so", "video", [
      nested("inner", 0, 2, [track("si", "video", [vclip("deep", "red.mp4", 0, 2, 0, 2)])],
        { opacity: 0.5 }),
    ])], { opacity: 0.5 }),
  ])]);
  const flatB = flattenSpecForRender(sB);
  const deep = findClip(flatB, "deep");
  check("U4 lồng 2 cấp 0.5 × 0.5 = 0.25", deep && eq(deep.opacity, 0.25),
    JSON.stringify(deep && deep.opacity));
}

// --- U5. Fail fast -----------------------------------------------------------
console.log("[U5] fail fast");
{
  const base = (clips) => spec([track("v", "video", clips)]);
  check("U5 type wipeleft qua biên bị từ chối",
    throws(() => flattenSpecForRender(base([
      vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "wipeleft", duration: 1 } }),
      nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 2, 0, 2)])]),
    ])), /chỉ hỗ trợ type "fade"/));
  check("U5 dual 2 đầu lồng nhau bị từ chối",
    throws(() => flattenSpecForRender(base([
      vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
      nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 2, 0, 2)])],
        { transitionOut: { type: "fade", duration: 1 } }),
      vclip("b", "blue.mp4", 4, 2, 0, 2),
    ])), /cả hai đầu/));
  check("U5 clip phẳng bị dịch còn transitionOut bị từ chối",
    throws(() => flattenSpecForRender(base([
      nested("n", 0, 2, [track("sv", "video", [vclip("leaf", "red.mp4", 0, 2, 0, 2)])],
        { transitionOut: { type: "fade", duration: 1 } }),
      vclip("b", "blue.mp4", 2, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
      vclip("c", "red.mp4", 4, 2, 0, 2),
    ])), /không giữ được transition khác/));
  check("U5 clip phẳng bị dịch còn là đầu trái cặp phẳng (qua transitionIn của clip sau) bị từ chối",
    throws(() => flattenSpecForRender(base([
      nested("n", 0, 2, [track("sv", "video", [vclip("leaf", "red.mp4", 0, 2, 0, 2)])],
        { transitionOut: { type: "fade", duration: 1 } }),
      vclip("b", "blue.mp4", 2, 2, 0, 2),
      vclip("c", "red.mp4", 4, 2, 0, 2, { transitionIn: { type: "fade", duration: 1 } }),
    ])), /không giữ được transition khác/));
  check("U5 clip phẳng đầu trái đã có transition phẳng bị từ chối",
    throws(() => flattenSpecForRender(base([
      vclip("pp", "red.mp4", 0, 1, 0, 1, { transitionOut: { type: "fade", duration: 0.5 } }),
      vclip("a", "blue.mp4", 1, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
      nested("n", 3, 2, [track("sv", "video", [vclip("leaf", "red.mp4", 0, 2, 0, 2)])]),
    ])), /đoạn đen cuối/));
  check("U5 lá biên có keyframes opacity sẵn bị từ chối",
    throws(() => flattenSpecForRender(base([
      vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
      nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 2, 0, 2,
        { animations: { opacity: { keyframes: [{ t: 0, v: 1 }, { t: 2, v: 1 }] } } })])]),
    ])), /keyframes opacity/));
  check("U5 lá biên bị cắt trái (fade-in) bị từ chối",
    throws(() => flattenSpecForRender(base([
      vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
      {
        kind: "nested", id: "n", start: 2, duration: 2,
        subSpec: { tracks: [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 4, 0, 4)])] },
        trim: { in: 1, out: 3 },
      },
    ])), /cắt trái/));
  check("U5 lá biên kind image bị từ chối",
    throws(() => flattenSpecForRender(base([
      vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
      nested("n", 2, 2, [track("sv", "video", [
        { kind: "image", id: "img", src: "red.mp4", start: 0, duration: 2 },
      ])]),
    ])), /không áp opacity keyframes/));
  check("U5 T dài hơn lá biên bị từ chối",
    throws(() => flattenSpecForRender(base([
      vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1.5 } }),
      nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 1, 0, 1)])]),
    ])), /ngắn hơn transition/));
  check("U5 opacity lồng nhau > 1 bị từ chối",
    throws(() => flattenSpecForRender(base([
      nested("n", 0, 2, [track("sv", "video", [vclip("leaf", "red.mp4", 0, 2, 0, 2)])],
        { opacity: 1.5 }),
    ])), /0\.\.1/));
}

// --- U6. Track không phải video: cảnh báo, không throw ----------------------
console.log("[U6] track audio + transition qua biên");
{
  const s = spec([track("a", "audio", [
    { kind: "audio", id: "aa", src: "red.mp4", start: 0, duration: 2, in: 0, out: 2,
      transitionOut: { type: "fade", duration: 1 } },
    nested("n", 2, 2, [track("sa", "audio", [
      { kind: "audio", id: "aleaf", src: "blue.mp4", start: 0, duration: 2, in: 0, out: 2 },
    ])]),
  ])]);
  let flat;
  let threw = false;
  try { flat = flattenSpecForRender(s); } catch (e) { threw = true; }
  const leaf = flat && findClip(flat, "aleaf");
  check("U6 không throw", !threw);
  check("U6 có warning track không phải video",
    flat && flat.warnings.some((w) => /không phải video/.test(w)),
    JSON.stringify(flat && flat.warnings));
  check("U6 lá không bị dịch", leaf && eq(leaf.start, 2), JSON.stringify(leaf));
}

// --- U7. Spec phẳng hồi quy ---------------------------------------------------
console.log("[U7] spec phẳng không đổi");
{
  const s = spec([track("v", "video", [
    vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 0.5 } }),
    vclip("b", "blue.mp4", 2, 2, 0, 2, { transitionIn: { type: "fade", duration: 0.5 } }),
  ])]);
  const flat = flattenSpecForRender(s);
  check("U7 flatten spec phẳng deep-equal",
    JSON.stringify(flat.spec) === JSON.stringify(s));
  check("U7 cặp phẳng giữ nguyên",
    flat.spec.tracks[0].clips[0].transitionOut &&
    flat.spec.tracks[0].clips[1].transitionIn);
}

// --- U8. Fade + opacity kết hợp ----------------------------------------------
console.log("[U8] fade-in + opacity lồng nhau");
{
  const s = spec([track("v", "video", [
    vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
    nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 2, 0, 2)])],
      { opacity: 0.5 }),
  ])]);
  const flat = flattenSpecForRender(s);
  const leaf = findClip(flat, "leaf");
  const kf = leaf && opKeyframes(leaf);
  check("U8 ramp kết thúc ở effOp 0.5 (không nhân đôi)",
    kf && eq(kf[1].v, 0.5), JSON.stringify(kf));
  check("U8 static = effOp 0.5", leaf && eq(leaf.opacity, 0.5));
}

// --- B. Render thật ----------------------------------------------------------
console.log("[B] render thật qua render.js CLI");
function renderSpec(s, outName) {
  const specPath = path.join(TMP, `${outName}.json`);
  const outPath = path.join(TMP, `${outName}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(s));
  const r = run("node", [path.join(SRC_DIR, "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", MEDIA, "-y", "-q"]);
  return { r, outPath };
}
function probeDuration(mp4) {
  const r = run("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", mp4]);
  return parseFloat(r.stdout.trim());
}
// Đọc pixel trung tâm (160,120) của frame tại t giây, trả về [r, g, b].
// format=rgb24 TRƯỚC crop: crop 1x1 trực tiếp trên yuv420p bị làm tròn về
// 0x0 do subsampling (ffmpeg báo lỗi) nên phải convert trước.
function centerPixel(mp4, t) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", mp4, "-ss", String(t),
    "-frames:v", "1", "-vf", "format=rgb24,crop=1:1:160:120",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { encoding: null });
  if (r.status !== 0 || !r.stdout || r.stdout.length < 3) return null;
  return [r.stdout[0], r.stdout[1], r.stdout[2]];
}
function near(px, target, tol) {
  return px && Math.abs(px[0] - target[0]) <= tol &&
    Math.abs(px[1] - target[1]) <= tol && Math.abs(px[2] - target[2]) <= tol;
}

// B1: fade-in phẳng → lồng nhau.
{
  const s = spec([track("v", "video", [
    vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
    nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 2, 0, 2)])]),
  ])]);
  const { r, outPath } = renderSpec(s, "b1");
  check("B1 render exit 0", r.status === 0, r.stderr.slice(-500));
  check("B1 MP4 tồn tại", fs.existsSync(outPath));
  const p05 = centerPixel(outPath, 0.5);
  const p15 = centerPixel(outPath, 1.5);
  const p25 = centerPixel(outPath, 2.5);
  check("B1 t=0.5 đỏ thuần", near(p05, [255, 0, 0], 25), JSON.stringify(p05));
  check("B1 t=1.5 là blend thật (đỏ+xanh trộn, không cắt cứng)",
    p15 && p15[0] > 80 && p15[0] < 180 && p15[2] > 80 && p15[2] < 180 &&
    Math.abs(p15[0] - p15[2]) < 60, JSON.stringify(p15));
  check("B1 t=2.5 xanh thuần", near(p25, [0, 0, 255], 25), JSON.stringify(p25));
}

// B2: opacity 0.5 trên nested.
{
  const s = spec([track("v", "video", [
    nested("n", 0, 2, [track("sv", "video", [vclip("leaf", "red.mp4", 0, 2, 0, 2)])],
      { opacity: 0.5 }),
  ])]);
  const { r, outPath } = renderSpec(s, "b2");
  check("B2 render exit 0", r.status === 0, r.stderr.slice(-500));
  const p = centerPixel(outPath, 1);
  check("B2 t=1 đỏ ~50% (tối đúng tỉ lệ, không đỏ thuần, không đen)",
    p && p[0] > 95 && p[0] < 165 && p[1] < 40 && p[2] < 40, JSON.stringify(p));
}

// B3: fade-out lồng nhau → phẳng.
{
  const s = spec([track("v", "video", [
    nested("n", 0, 2, [track("sv", "video", [vclip("leaf", "red.mp4", 0, 2, 0, 2)])],
      { transitionOut: { type: "fade", duration: 1 } }),
    vclip("b", "blue.mp4", 2, 2, 0, 2),
  ])]);
  const { r, outPath } = renderSpec(s, "b3");
  check("B3 render exit 0", r.status === 0, r.stderr.slice(-500));
  const p05 = centerPixel(outPath, 0.5);
  const p15 = centerPixel(outPath, 1.5);
  const p25 = centerPixel(outPath, 2.5);
  check("B3 t=0.5 đỏ thuần", near(p05, [255, 0, 0], 25), JSON.stringify(p05));
  check("B3 t=1.5 là blend thật",
    p15 && p15[0] > 80 && p15[0] < 180 && p15[2] > 80 && p15[2] < 180 &&
    Math.abs(p15[0] - p15[2]) < 60, JSON.stringify(p15));
  check("B3 t=2.5 xanh thuần", near(p25, [0, 0, 255], 25), JSON.stringify(p25));
  check("B3 duration ≈ 3s (clip phẳng dịch sớm)", eq(probeDuration(outPath), 3, 0.15),
    String(probeDuration(outPath)));
}

// B4: wipeleft qua biên → CLI từ chối rõ ràng.
{
  const s = spec([track("v", "video", [
    vclip("a", "red.mp4", 0, 2, 0, 2, { transitionOut: { type: "wipeleft", duration: 1 } }),
    nested("n", 2, 2, [track("sv", "video", [vclip("leaf", "blue.mp4", 0, 2, 0, 2)])]),
  ])]);
  const { r } = renderSpec(s, "b4");
  check("B4 CLI exit != 0", r.status !== 0, `status=${r.status}`);
  check("B4 message nêu rõ chỉ hỗ trợ fade",
    /chỉ hỗ trợ type "fade"/.test(r.stderr), r.stderr.slice(-500));
}

console.log(`\n${checks - failures}/${checks} check pass, ${failures} fail. tmp=${TMP}`);
if (failures > 0) process.exit(1);
