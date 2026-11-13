/**
 * test_round87_o2_mask_track.js — Test tracked mask render thật (Phase 9 đợt 87 O2).
 * Chạy: node test_round87_o2_mask_track.js (từ server/render).
 * Kiểm chứng (không mock: render FFmpeg thật + đọc pixel PNG thật bằng PIL):
 *  1. Video clip + mask ellipse bám track (x 0.35 → 0.65 trong 3s, clip
 *     ĐỨNG YÊN theo thiết kế O2/O3 — track lái mask, không shift D3):
 *     tâm vùng đỏ đo được = đúng điểm track tại t=0.5 (0.4) và t=2.5 (0.6).
 *  2. Image clip + mask ellipse bám track: tâm vùng xanh = điểm track.
 *  3. Frame tại t mà track trùng tâm mask tĩnh (t=1.5, track=0.5) gần giống
 *     frame mask tĩnh cùng shape (MAD < 1).
 *  4. Mask tĩnh không hồi quy: render 2 lần cùng spec cho frame MAD = 0.
 *  5. Dry-run: filter dùng movie video .mkv + trim=end_frame=90 (đường
 *     tracked video), KHÔNG dùng geq.
 *  6. Mask keyframes + track cùng lúc: x/y bám track, w/h theo keyframes
 *     (helper O1) — điểm ngoài ellipse nhỏ ở t=0.5, trong ellipse lớn ở t=2.5.
 *  7. --mask-mode geq: đường tracked KHÔNG áp (giữ hành vi cũ — mask tĩnh
 *     cưỡi theo shift D3, tâm cuối vẫn = điểm track); render thành công.
 *  8. Text clip + track + mask: validator chỉ cảnh báo (mask bị bỏ qua),
 *     render thành công, chữ vẫn hiện, mask không có tác dụng.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { validateSpec } = require("./src/validate");

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function renderSpec(dir, mediaDir, spec, name, extraArgs = []) {
  const specPath = path.join(dir, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir, ...extraArgs],
    { cwd: __dirname, encoding: "utf8" });
  return { out, r, specPath };
}

// Trích frame tại t ra PNG.
function framePng(out, t, dir, tag) {
  const png = path.join(dir, `${tag}.png`);
  run("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", out, "-frames:v", "1", png]);
  return png;
}

// Tâm (centroid) của vùng màu thuần (đỏ: kênh 0; xanh: kênh 2), tọa độ 0..1.
function centroid(png, chan) {
  const py = `import numpy as np
from PIL import Image
im = np.asarray(Image.open(${JSON.stringify(png)}).convert("RGB")).astype(float)
m = im[:, :, ${chan}] > 100
m &= (im[:, :, ( ${chan} + 1) % 3] < 100) & (im[:, :, (${chan} + 2) % 3] < 100)
ys, xs = np.nonzero(m)
H, W = m.shape
print(f"{xs.mean()/W:.4f} {ys.mean()/H:.4f} {len(xs)}")`;
  const s = run("python3", ["-c", py]).trim().split(/\s+/).map(Number);
  return { x: s[0], y: s[1], n: s[2] };
}

function probe(out, t, x, y, dir, tag) {
  const png = framePng(out, t, dir, tag);
  const py = `from PIL import Image; im = Image.open(${JSON.stringify(png)}).convert("RGB"); print(*im.getpixel((${x}, ${y})))`;
  return run("python3", ["-c", py]).trim().split(/\s+/).map(Number);
}

function mad(a, b) {
  const py = `import numpy as np
from PIL import Image
x = np.asarray(Image.open(${JSON.stringify(a)}).convert("RGB")).astype(float)
y = np.asarray(Image.open(${JSON.stringify(b)}).convert("RGB")).astype(float)
print(float(np.abs(x - y).mean()))`;
  return Number(run("python3", ["-c", py]).trim());
}

const isRed = (px) => px[0] > 150 && px[1] < 100 && px[2] < 100;
const isBlue = (px) => px[2] > 150 && px[0] < 100 && px[1] < 100;
const isBlack = (px) => px[0] < 50 && px[1] < 50 && px[2] < 50;

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-o2-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };

  // Nguồn: video đỏ 640x360 3s + ảnh xanh 640x360.
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=640x360:d=3:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    path.join(mediaDir, "red.mp4")]);
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x0000ff:s=640x360:d=1:r=30",
    "-frames:v", "1", path.join(mediaDir, "blue.png")]);

  const W = 640, H = 360;
  const meta = { width: W, height: H, fps: 30, duration: 3 };
  const track = { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 3, x: 0.65, y: 0.5 }] };
  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0 };
  const vclip = (extra = {}) => ({
    kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 3, in: 0, out: 3, speed: 1, ...extra,
  });
  const spec = (name, tracks) => ({ version: "0.2.0", meta: { name, ...meta }, tracks });

  // --- Test 1: video + tracked mask ---
  const spec1 = spec("o2-video", [{ id: "v1", kind: "video", clips: [vclip({ mask, track })] }]);
  const { out: out1, r: r1 } = renderSpec(dir, mediaDir, spec1, "video");
  if (r1.status !== 0) { console.error(r1.stdout?.slice(-1200)); console.error(r1.stderr?.slice(-1200)); }
  ok(r1.status === 0 && fs.existsSync(out1), "render video + tracked mask ra MP4");
  if (r1.status === 0) {
    const c05 = centroid(framePng(out1, 0.5, dir, "v05"), 0);
    const c25 = centroid(framePng(out1, 2.5, dir, "v25"), 0);
    ok(Math.abs(c05.x - 0.4) < 0.01, `t=0.5 tâm mask x=${c05.x} ≈ track 0.4 (±0.01)`);
    ok(Math.abs(c05.y - 0.5) < 0.01, `t=0.5 tâm mask y=${c05.y} ≈ 0.5`);
    ok(Math.abs(c25.x - 0.6) < 0.01, `t=2.5 tâm mask x=${c25.x} ≈ track 0.6 (±0.01)`);
    ok(Math.abs(c25.y - 0.5) < 0.01, `t=2.5 tâm mask y=${c25.y} ≈ 0.5`);
  }

  // --- Test 2: image + tracked mask ---
  const spec2 = spec("o2-image", [{ id: "i1", kind: "image",
    clips: [{ kind: "image", id: "im1", src: "blue.png", start: 0, duration: 3, mask, track }] }]);
  const { out: out2, r: r2 } = renderSpec(dir, mediaDir, spec2, "image");
  if (r2.status !== 0) { console.error(r2.stdout?.slice(-1200)); console.error(r2.stderr?.slice(-1200)); }
  ok(r2.status === 0 && fs.existsSync(out2), "render image + tracked mask ra MP4");
  if (r2.status === 0) {
    const c05 = centroid(framePng(out2, 0.5, dir, "i05"), 2);
    const c25 = centroid(framePng(out2, 2.5, dir, "i25"), 2);
    ok(Math.abs(c05.x - 0.4) < 0.01, `image t=0.5 tâm mask x=${c05.x} ≈ track 0.4 (±0.01)`);
    ok(Math.abs(c25.x - 0.6) < 0.01, `image t=2.5 tâm mask x=${c25.x} ≈ track 0.6 (±0.01)`);
  }

  // --- Test 3: frame tại track=0.5 (t=1.5) ≈ frame mask tĩnh cùng shape ---
  const specS = spec("o2-static", [{ id: "v1", kind: "video", clips: [vclip({ mask })] }]);
  const { out: outS, r: rS } = renderSpec(dir, mediaDir, specS, "static");
  ok(rS.status === 0 && fs.existsSync(outS), "render mask tĩnh đối chiếu ra MP4");
  if (r1.status === 0 && rS.status === 0) {
    const m = mad(framePng(out1, 1.5, dir, "v15"), framePng(outS, 1.5, dir, "s15"));
    ok(m < 1, `tracked t=1.5 vs tĩnh t=1.5: MAD=${m.toFixed(3)} < 1`);
  }

  // --- Test 4: mask tĩnh render 2 lần → MAD = 0 (không hồi quy) ---
  const { out: outS2, r: rS2 } = renderSpec(dir, mediaDir, specS, "static2");
  if (rS.status === 0 && rS2.status === 0) {
    const m = mad(framePng(outS, 1.5, dir, "s15a"), framePng(outS2, 1.5, dir, "s15b"));
    ok(m === 0, `mask tĩnh render 2 lần: MAD=${m} (phải = 0)`);
  }

  // --- Test 5: dry-run dùng đường video tracked, không geq ---
  const dry = spawnSync("node", ["src/render.js", "--spec", path.join(dir, "video.json"),
    "--out", path.join(dir, "dry.mp4"), "--media-dir", mediaDir, "--dry-run"],
    { cwd: __dirname, encoding: "utf8" });
  const cmd = dry.stdout || "";
  ok(cmd.includes(".mkv"), "dry-run: filter dùng movie video .mkv (đường tracked)");
  ok(cmd.includes("trim=end_frame=90"), "dry-run: video mask có trim=end_frame=90 (3s×30fps)");
  ok(!cmd.includes("geq=lum="), "dry-run: tracked mask KHÔNG dùng geq");

  // --- Test 6: keyframes + track: x/y bám track, w/h theo keyframes ---
  const kfMask = {
    ...mask,
    keyframes: [
      { t: 0, x: 0.5, y: 0.5, w: 0.2, h: 0.2 },
      { t: 3, x: 0.5, y: 0.5, w: 0.4, h: 0.6 },
    ],
  };
  const spec6 = spec("o2-kf-track", [{ id: "v1", kind: "video", clips: [vclip({ mask: kfMask, track })] }]);
  const { out: out6, r: r6 } = renderSpec(dir, mediaDir, spec6, "kftrack");
  if (r6.status !== 0) { console.error(r6.stdout?.slice(-1200)); console.error(r6.stderr?.slice(-1200)); }
  ok(r6.status === 0 && fs.existsSync(out6), "render keyframes + track ra MP4");
  if (r6.status === 0) {
    // t=0.5: track x=256px, rx≈75px → (346,180) ngoài (đen); t=2.5: track
    // x=384px, rx≈117px → (474,180) trong (đỏ); tâm luôn đỏ.
    const a = probe(out6, 0.5, 346, 180, dir, "k05");
    const b = probe(out6, 2.5, 474, 180, dir, "k25");
    const c = probe(out6, 2.5, 384, 180, dir, "k25c");
    ok(isBlack(a), `keyframes+track t=0.5 điểm (346,180) đen (ngoài ellipse nhỏ): [${a}]`);
    ok(isRed(b), `keyframes+track t=2.5 điểm (474,180) đỏ (trong ellipse lớn): [${b}]`);
    ok(isRed(c), `keyframes+track t=2.5 tâm (384,180) đỏ: [${c}]`);
  }

  // --- Test 7: --mask-mode geq giữ hành vi cũ (mask tĩnh cưỡi shift D3) ---
  const { out: out7, r: r7 } = renderSpec(dir, mediaDir, spec1, "video-geq", ["--mask-mode", "geq"]);
  if (r7.status !== 0) { console.error(r7.stdout?.slice(-1200)); console.error(r7.stderr?.slice(-1200)); }
  ok(r7.status === 0 && fs.existsSync(out7), "render tracked mask mode geq ra MP4");
  if (r7.status === 0) {
    const c05 = centroid(framePng(out7, 0.5, dir, "g05"), 0);
    const c25 = centroid(framePng(out7, 2.5, dir, "g25"), 0);
    ok(Math.abs(c05.x - 0.4) < 0.01, `geq t=0.5 tâm mask x=${c05.x} ≈ track 0.4 (±0.01)`);
    ok(Math.abs(c25.x - 0.6) < 0.01, `geq t=2.5 tâm mask x=${c25.x} ≈ track 0.6 (±0.01)`);
  }

  // --- Test 8: text + track + mask → chỉ warn, render ok, mask không tác dụng ---
  const spec8 = spec("o2-text", [
    { id: "v1", kind: "video", clips: [vclip({})] },
    { id: "t1", kind: "text", clips: [{ kind: "text", id: "tx1", text: "TRACKED", start: 0, duration: 3,
      mask, track, style: { fontFamily: "DejaVu Sans", fontSize: 48, color: "#ffffff", x: 0.5, y: 0.5, animation: "none" } }] },
  ]);
  const v8 = validateSpec(spec8);
  ok(v8.ok && v8.warnings.some((w) => /mask chưa hỗ trợ cho clip text/.test(w)),
    "text+track+mask: validator cảnh báo mask bị bỏ qua (không lỗi)");
  const { out: out8, r: r8 } = renderSpec(dir, mediaDir, spec8, "text");
  ok(r8.status === 0 && fs.existsSync(out8), "render text+track+mask ra MP4");
  if (r8.status === 0) {
    // Khung nền đỏ nguyên (mask không cắt text track) + chữ trắng hiện.
    const png = framePng(out8, 1.5, dir, "t15");
    const py = `import numpy as np
from PIL import Image
im = np.asarray(Image.open(${JSON.stringify(png)}).convert("RGB")).astype(float)
print(f"{im[:, :, 0].mean():.1f} {int((im.mean(axis=2) > 150).sum())}")`;
    const [meanR, bright] = run("python3", ["-c", py]).trim().split(/\s+/).map(Number);
    ok(meanR > 200, `text frame nền đỏ nguyên (mean R=${meanR} > 200 — mask không cắt)`);
    ok(bright > 100, `text frame có chữ trắng (${bright} pixel sáng)`);
  }

  console.log(`\ntest_round87_o2_mask_track: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main();
