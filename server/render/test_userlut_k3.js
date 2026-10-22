#!/usr/bin/env node
/**
 * test_userlut_k3.js — Test E2E cho K3 (Phase 6): LUT .cube user tự nhập +
 * sticker động APNG.
 *
 * Chạy: node server/render/test_userlut_k3.js
 * Yêu cầu: ffmpeg/ffprobe trong PATH, PIL (python3 -c "import PIL") để đo pixel.
 *
 * Kiểm tra:
 *  1. parseCube (web, transpile từ apps/web/src/lib/userLut.ts): file hợp lệ
 *     pass; các file sai (thiếu LUT_3D_SIZE, sai số dòng, LUT 1D, size ngoài
 *     khoảng) bị từ chối với thông báo rõ.
 *  2. Render với LUT user: pixel khác rõ so với render không LUT.
 *  3. Render thiếu file .cube user → fail fast với thông báo rõ.
 *  4. Render với sticker APNG động: vùng sticker thay đổi theo thời gian.
 *  5. Regression: LUT catalog cũ vẫn render bình thường.
 */
"use strict";

const assert = require("assert");
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const RENDER_JS = path.join(__dirname, "src", "render.js");
const { buildLutFilter, validateVideoFilter } = require("./src/lut");

let pass = 0;
function ok(name, cond, extra) {
  assert.ok(cond, `FAIL: ${name} ${extra ?? ""}`);
  pass += 1;
  console.log(`  ✅ ${name}`);
}

function sh(cmd, args, opts) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts });
}

function frameMean(pngPath, box) {
  // Dùng PIL để đo mean RGB của vùng (x0,y0,x1,y1).
  const out = sh("python3", ["-c", `
from PIL import Image
im = Image.open(${JSON.stringify(pngPath)}).convert("RGB")
r = im.crop(${JSON.stringify(box)})
px = list(r.getdata())
print(",".join(str(round(sum(c)/len(c), 1)) for c in zip(*px)))
`]);
  return out.trim().split(",").map(Number);
}

function regionHash(pngPath, box) {
  return sh("python3", ["-c", `
from PIL import Image
import hashlib
im = Image.open(${JSON.stringify(pngPath)}).convert("RGB")
print(hashlib.md5(im.crop(${JSON.stringify(box)}).tobytes()).hexdigest()[:12])
`]).trim();
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-k3-"));
  console.log(`tmp: ${tmp}`);
  const mediaDir = path.join(tmp, "media");
  fs.mkdirSync(mediaDir);

  // ---- Fixture: video nền 3s + APNG động 2s ----
  sh("ffmpeg", ["-v", "error", "-y", "-f", "lavfi",
    "-i", "color=c=0x224488:size=640x360:rate=30:duration=3",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(mediaDir, "bg.mp4")]);
  sh("ffmpeg", ["-v", "error", "-y", "-f", "lavfi",
    "-i", "testsrc2=size=200x200:rate=10:duration=2",
    "-vf", "format=rgba", "-c:v", "apng", "-plays", "0",
    path.join(mediaDir, "anim.apng")]);

  // ---- Fixture: .cube user — đảo kênh R/B mạnh (dễ thấy bằng mắt + pixel) ----
  // LUT 2x2x2: output = (B, G, R) của input.
  const cubeLines = ["# test look", 'TITLE "Swap RB"', "LUT_3D_SIZE 2"];
  for (const b of [0, 1]) for (const g of [0, 1]) for (const r of [0, 1]) {
    cubeLines.push(`${b} ${g} ${r}`);
  }
  const cubeText = cubeLines.join("\n") + "\n";
  fs.writeFileSync(path.join(mediaDir, "__lut_user-test-look.cube"), cubeText);

  // ---- 1. parseCube (transpile web lib sang CommonJS tạm) ----
  const tsOut = path.join(tmp, "userLut.js");
  sh("npx", ["tsc", path.join(ROOT, "apps/web/src/lib/userLut.ts"),
    "--outDir", tmp, "--module", "commonjs", "--target", "es2020",
    "--skipLibCheck"], { cwd: ROOT });
  const userLut = require(tsOut);
  const parsed = userLut.parseCube(cubeText, Buffer.byteLength(cubeText));
  ok("parseCube: file hợp lệ (size 2, 8 dòng)", parsed.size === 2 && parsed.rows === 8);
  ok("parseCube: đọc TITLE", parsed.title === "Swap RB");
  for (const [name, bad, size] of [
    ["thiếu LUT_3D_SIZE", "0 0 0\n1 1 1\n", 100],
    ["sai số dòng", "LUT_3D_SIZE 2\n0 0 0\n", 100],
    ["LUT 1D", "LUT_1D_SIZE 4\n0 0 0\n", 100],
    ["size ngoài khoảng", "LUT_3D_SIZE 300\n0 0 0\n", 100],
    ["quá 10MB", cubeText, 11 * 1024 * 1024],
  ]) {
    let threw = false;
    try { userLut.parseCube(bad, size); } catch (e) { threw = true; }
    ok(`parseCube: từ chối ${name}`, threw);
  }
  ok("isUserLutId: chấp nhận user-test-look", userLut.isUserLutId("user-test-look"));
  ok("isUserLutId: từ chối user- rỗng / ký tự lạ",
    !userLut.isUserLutId("user-") && !userLut.isUserLutId("user-A/B"));
  ok("userLutFileName", userLut.userLutFileName("user-test-look") === "__lut_user-test-look.cube");

  // ---- 2+3+5. Render: user LUT vs không LUT vs thiếu file vs catalog ----
  const baseSpec = {
    meta: { name: "k3", width: 640, height: 360, fps: 30 },
    tracks: [{ id: "v1", kind: "video", label: "bg", clips: [
      { id: "bg", kind: "video", src: "bg.mp4", start: 0, in: 0, out: 3, duration: 3 },
    ] }],
    version: "0.2.0",
  };
  function render(spec, outName) {
    const specPath = path.join(tmp, `${outName}.json`);
    fs.writeFileSync(specPath, JSON.stringify(spec));
    const r = spawnSync(process.execPath, [RENDER_JS, "--spec", specPath,
      "--out", path.join(tmp, `${outName}.mp4`), "--media-dir", mediaDir, "-y"],
      { encoding: "utf8" });
    return r;
  }
  function grab(mp4, t, png) {
    sh("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", mp4, "-frames:v", "1", png]);
  }

  const withUser = JSON.parse(JSON.stringify(baseSpec));
  withUser.tracks[0].clips[0].filter = { lut: "user-test-look" };
  const r1 = render(withUser, "with_user");
  ok("render với LUT user thành công", r1.status === 0, r1.stderr?.slice(-200));

  const plain = render(baseSpec, "plain");
  ok("render không LUT thành công", plain.status === 0);
  grab(path.join(tmp, "with_user.mp4"), 1.0, path.join(tmp, "u.png"));
  grab(path.join(tmp, "plain.mp4"), 1.0, path.join(tmp, "p.png"));
  const mu = frameMean(path.join(tmp, "u.png"), [0, 0, 640, 360]);
  const mp = frameMean(path.join(tmp, "p.png"), [0, 0, 640, 360]);
  const diff = Math.abs(mu[0] - mp[0]) + Math.abs(mu[2] - mp[2]);
  ok(`LUT user đổi màu thật (|dR|+|dB|=${diff.toFixed(1)} > 30)`, diff > 30,
    `user=${mu} plain=${mp}`);

  const missing = JSON.parse(JSON.stringify(baseSpec));
  missing.tracks[0].clips[0].filter = { lut: "user-khong-co" };
  const r3 = render(missing, "missing");
  ok("thiếu file .cube user → fail fast", r3.status !== 0 &&
    /Không tìm thấy file LUT user/.test((r3.stderr || "") + (r3.stdout || "")));

  const catalog = JSON.parse(JSON.stringify(baseSpec));
  catalog.tracks[0].clips[0].filter = { lut: "cartcut-teal-orange" };
  const r4 = render(catalog, "catalog");
  ok("regression: LUT catalog vẫn render", r4.status === 0);

  // validateVideoFilter phía render worker
  ok("validateVideoFilter chấp nhận user-",
    validateVideoFilter({ lut: "user-test-look" }).length === 0);
  ok("validateVideoFilter từ chối id lạ",
    validateVideoFilter({ lut: "user-" }).length > 0);
  ok("buildLutFilter user trỏ đúng file mediaDir",
    buildLutFilter("user-test-look", path.join(ROOT, "assets"), mediaDir)
      .includes("__lut_user-test-look.cube"));

  // ---- 4. Sticker APNG động: vùng sticker thay đổi theo thời gian ----
  const apngSpec = JSON.parse(JSON.stringify(baseSpec));
  apngSpec.tracks.push({ id: "s1", kind: "sticker", label: "stickers", clips: [
    { id: "st1", kind: "sticker", src: "anim.apng", start: 0, duration: 3,
      x: 0.5, y: 0.5, scale: 0.3, opacity: 1, rotation: 0 },
  ] });
  const r5 = render(apngSpec, "apng");
  ok("render sticker APNG thành công", r5.status === 0, r5.stderr?.slice(-200));
  grab(path.join(tmp, "apng.mp4"), 0.2, path.join(tmp, "a1.png"));
  grab(path.join(tmp, "apng.mp4"), 1.5, path.join(tmp, "a2.png"));
  const h1 = regionHash(path.join(tmp, "a1.png"), [224, 84, 416, 276]);
  const h2 = regionHash(path.join(tmp, "a2.png"), [224, 84, 416, 276]);
  ok(`sticker APNG động thật (hash ${h1} ≠ ${h2})`, h1 !== h2);

  console.log(`\n✅ K3 E2E: ${pass} pass, 0 fail (tmp: ${tmp})`);
}

main().catch((e) => {
  console.error(`\n❌ K3 E2E FAIL: ${e.message}`);
  process.exit(1);
});
