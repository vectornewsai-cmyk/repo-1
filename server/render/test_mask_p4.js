#!/usr/bin/env node
/**
 * test_mask_p4.js — Test Phase 7 P4: mask rect/ellipse/feather/invert cho
 * clip video/image + keyframe graph (phần render). Chạy:
 *   node server/render/test_mask_p4.js
 *
 * Gồm: unit (validateMask/buildMaskExpr/buildMaskChain/validateSpec) +
 * render thật với pixel đo bằng test_mask_p4_measure.py (PIL):
 *   - rect: tâm đỏ, góc đen (ngoài mask bị che)
 *   - ellipse: tâm đỏ, góc đen
 *   - feather: pixel ngay viền nằm giữa đen và đỏ (chuyển tiếp mềm)
 *   - invert: tâm đen, góc đỏ
 *   - image clip + rect mask: tâm đỏ, góc đen
 *   - mask + transition fade: render thành công (không lỗi format xfade)
 *   - mask sai trên text clip: chỉ cảnh báo, không lỗi
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname);
const WORK = path.join(os.homedir(), "workspace", ".tmp-mask-p4");
const PY = path.join(ROOT, "test_mask_p4_measure.py");

const { validateMask, buildMaskExpr, buildMaskChain } = require("./src/mask");
const { validateSpec } = require("./src/validate");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ""}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`); }
}
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function sh(cmd) {
  const r = run("bash", ["-c", cmd]);
  if (r.status !== 0) throw new Error(`lệnh fail: ${cmd}\n${r.stderr}`);
  return r.stdout;
}
/** Đo pixel tại các vị trí tương đối (x,y) trong frame giữa video. */
function sample(video, points) {
  const r = run("python3", [PY, video, ...points]);
  if (r.status !== 0) throw new Error(`measure fail: ${r.stderr}`);
  const out = {};
  for (const line of r.stdout.trim().split("\n")) {
    const m = /^px_([\d.]+)_([\d.]+)=(\d+),(\d+),(\d+)$/.exec(line);
    if (m) out[`${m[1]},${m[2]}`] = [Number(m[3]), Number(m[4]), Number(m[5])];
  }
  return out;
}
function isRed(px) { return px && px[0] > 180 && px[1] < 80 && px[2] < 80; }
function isBlack(px) { return px && px[0] < 40 && px[1] < 40 && px[2] < 40; }
function makeVideoSpec(clipExtra, name, secondClip) {
  const clips = [{
    kind: "video", id: "c1", src: "SRC", start: 0, duration: 3,
    in: 0, out: 3, sourceAudioMode: "mute", ...clipExtra,
  }];
  if (secondClip) clips.push(secondClip);
  return {
    version: "0.2.0",
    meta: { name, width: 320, height: 180, fps: 30 },
    tracks: [{ kind: "video", id: "v1", clips }],
  };
}
function render(specObj, mediaMap, outName) {
  const specPath = path.join(WORK, `${outName}.json`);
  const spec = JSON.parse(JSON.stringify(specObj));
  for (const t of spec.tracks)
    for (const c of t.clips) c.src = mediaMap[c.src] || c.src;
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const out = path.join(WORK, `${outName}.mp4`);
  const r = run("node", [path.join(ROOT, "src", "render.js"), "--spec", specPath,
    "--out", out, "-y", "--media-dir", WORK]);
  return { r, out };
}

console.log("== P4 unit: mask validate/expr/chain ==");
ok("validate ok rect", validateMask({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }).length === 0);
ok("validate ok ellipse invert", validateMask({ shape: "ellipse", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.3, invert: true }).length === 0);
ok("validate sai shape", validateMask({ shape: "circle", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }).length > 0);
ok("validate sai w", validateMask({ shape: "rect", x: 0.5, y: 0.5, w: 0, h: 0.5, feather: 0 }).length > 0);
ok("validate sai feather", validateMask({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 2 }).length > 0);
ok("expr rect chứa biên", buildMaskExpr({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 320, 180).includes("80-X"));
ok("expr ellipse chứa sqrt", buildMaskExpr({ shape: "ellipse", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 320, 180).includes("sqrt("));
{
  let n = 0; const lbl = (p) => `${p}${n++}`;
  const ch = buildMaskChain("[cv0]", { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 320, 180, lbl);
  ok("chain 3 entry + alphamerge", ch.entries.length === 3 && ch.entries[2].includes("alphamerge"));
}
ok("spec validate mask ok", validateSpec(makeVideoSpec({ mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 } }, "x")).ok);
ok("spec validate mask sai", !validateSpec(makeVideoSpec({ mask: { shape: "rect", x: 0.5, y: 0.5, w: 0, h: 0.5, feather: 0 } }, "x")).ok);
{
  const s = {
    version: "0.2.0", meta: { name: "t", width: 320, height: 180, fps: 30 },
    tracks: [{ kind: "text", id: "t1", clips: [{
      kind: "text", id: "tx", text: "hi", start: 0, duration: 3,
      style: { fontSize: 24, fontFamily: "Arial", color: "#FFFFFF", animation: "none" },
      mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 },
    }] }],
  };
  const v = validateSpec(s);
  ok("mask trên text chỉ cảnh báo, không lỗi", v.ok && v.warnings.length > 0, v.warnings.join("; ").slice(0, 120));
}

console.log("== P4 render thật: tạo media ==");
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
sh(`ffmpeg -v error -y -f lavfi -i "color=c=0xFF0000:s=320x180:d=4:r=30" -c:v libx264 -pix_fmt yuv420p ${WORK}/red.mp4`);
sh(`ffmpeg -v error -y -f lavfi -i "color=c=0x0000FF:s=320x180:d=4:r=30" -c:v libx264 -pix_fmt yuv420p ${WORK}/blue.mp4`);
sh(`ffmpeg -v error -y -f lavfi -i "color=c=0xFF0000:s=320x180" -frames:v 1 ${WORK}/red.png`);
ok("media tạo xong", ["red.mp4", "blue.mp4", "red.png"].every((f) => fs.existsSync(path.join(WORK, f))));

// Mask tâm (0.5,0.5), w=0.5, h=0.5 trên 320x180 → hình 160x90, biên x 80..240, y 45..135.
console.log("== P4 render thật: rect mask ==");
{
  const { r, out } = render(makeVideoSpec({ mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 } }, "rect"), { SRC: "red.mp4" }, "rect");
  ok("render rect thành công", r.status === 0, r.stderr.slice(-300));
  const px = sample(out, ["0.5,0.5", "0.05,0.05", "0.95,0.95", "0.5,0.3"]);
  ok("rect: tâm đỏ", isRed(px["0.5,0.5"]), JSON.stringify(px["0.5,0.5"]));
  ok("rect: góc trên-trái đen", isBlack(px["0.05,0.05"]), JSON.stringify(px["0.05,0.05"]));
  ok("rect: góc dưới-phải đen", isBlack(px["0.95,0.95"]), JSON.stringify(px["0.95,0.95"]));
  ok("rect: điểm trong hình đỏ", isRed(px["0.5,0.3"]), JSON.stringify(px["0.5,0.3"]));
}

console.log("== P4 render thật: ellipse mask ==");
{
  const { r, out } = render(makeVideoSpec({ mask: { shape: "ellipse", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 } }, "el"), { SRC: "red.mp4" }, "el");
  ok("render ellipse thành công", r.status === 0, r.stderr.slice(-300));
  const px = sample(out, ["0.5,0.5", "0.05,0.05", "0.95,0.05", "0.3,0.5"]);
  ok("ellipse: tâm đỏ", isRed(px["0.5,0.5"]), JSON.stringify(px["0.5,0.5"]));
  ok("ellipse: góc đen", isBlack(px["0.05,0.05"]) && isBlack(px["0.95,0.05"]),
    `${JSON.stringify(px["0.05,0.05"])} / ${JSON.stringify(px["0.95,0.05"])}`);
  ok("ellipse: điểm trong ellipse đỏ", isRed(px["0.3,0.5"]), JSON.stringify(px["0.3,0.5"]));
}

console.log("== P4 render thật: feather mask ==");
{
  // feather 0.4 → band = 0.4 × min(160,90) = 36px. Điểm ngay biên trái (x=80/320=0.25)
  // phải ở giữa đen và đỏ (~50% → R khoảng 80..200), không phải đen hẳn hay đỏ hẳn.
  const { r, out } = render(makeVideoSpec({ mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.4 } }, "fe"), { SRC: "red.mp4" }, "fe");
  ok("render feather thành công", r.status === 0, r.stderr.slice(-300));
  const px = sample(out, ["0.25,0.5", "0.5,0.5", "0.05,0.05"]);
  const edgeR = px["0.25,0.5"] ? px["0.25,0.5"][0] : -1;
  ok("feather: viền mềm (R giữa)", edgeR > 40 && edgeR < 220, `R=${edgeR}`);
  ok("feather: tâm vẫn đỏ", isRed(px["0.5,0.5"]), JSON.stringify(px["0.5,0.5"]));
  ok("feather: góc vẫn đen", isBlack(px["0.05,0.05"]), JSON.stringify(px["0.05,0.05"]));
}

console.log("== P4 render thật: invert mask ==");
{
  const { r, out } = render(makeVideoSpec({ mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0, invert: true } }, "inv"), { SRC: "red.mp4" }, "inv");
  ok("render invert thành công", r.status === 0, r.stderr.slice(-300));
  const px = sample(out, ["0.5,0.5", "0.05,0.05"]);
  ok("invert: tâm đen", isBlack(px["0.5,0.5"]), JSON.stringify(px["0.5,0.5"]));
  ok("invert: góc đỏ", isRed(px["0.05,0.05"]), JSON.stringify(px["0.05,0.05"]));
}

console.log("== P4 render thật: image clip + mask ==");
{
  const spec = {
    version: "0.2.0",
    meta: { name: "img", width: 320, height: 180, fps: 30 },
    tracks: [{ kind: "image", id: "i1", clips: [{
      kind: "image", id: "im1", src: "red.png", start: 0, duration: 3,
      mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 },
    }] }],
  };
  const { r, out } = render(spec, { "red.png": "red.png" }, "img");
  ok("render image mask thành công", r.status === 0, r.stderr.slice(-300));
  const px = sample(out, ["0.5,0.5", "0.05,0.05"]);
  ok("image mask: tâm đỏ", isRed(px["0.5,0.5"]), JSON.stringify(px["0.5,0.5"]));
  ok("image mask: góc đen", isBlack(px["0.05,0.05"]), JSON.stringify(px["0.05,0.05"]));
}

console.log("== P4 render thật: mask + transition fade ==");
{
  const spec = makeVideoSpec({ mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 } }, "tr", {
    kind: "video", id: "c2", src: "BLUE", start: 3, duration: 3,
    in: 0, out: 3, sourceAudioMode: "mute",
    transitionIn: { type: "fade", duration: 0.5 },
  });
  const { r, out } = render(spec, { SRC: "red.mp4", BLUE: "blue.mp4" }, "tr");
  ok("render mask + fade thành công", r.status === 0, r.stderr.slice(-500));
  ok("output tồn tại", fs.existsSync(out));
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail ? 1 : 0);
