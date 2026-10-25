/**
 * test_d4_mask_keyframes.js — Test mask keyframes render thật (Phase 9 D4).
 * Chạy: node test_d4_mask_keyframes.js (từ server/render).
 * Kiểm chứng (không mock: render FFmpeg thật + đọc pixel PNG thật bằng PIL):
 *  1. Video clip + mask rect di chuyển ngang (x 0.2 → 0.8 trong 3s):
 *     t=0.5 mask ở trái (pixel trái đỏ, phải đen); t=2.5 mask ở phải
 *     (pixel trái đen, phải đỏ). Đỏ = màu nguồn, đen = ngoài mask lộ nền.
 *  2. Image clip + mask ellipse phóng to (w/h 0.2 → 0.8 trong 3s):
 *     điểm (260,90) ở t=0.5 còn ngoài ellipse (đen), ở t=2.5 đã trong
 *     ellipse (xanh). Chứng minh cả 2 site render (video + image).
 *  3. Dry-run: filter graph dùng movie video .mkv + trim=end_frame
 *     (đường animation), KHÔNG dùng geq chậm cho mask có keyframes.
 *  4. Spec keyframes sai (t âm) → render thoát lỗi (validate chặn).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function renderSpec(dir, mediaDir, spec, name) {
  const specPath = path.join(dir, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir],
    { cwd: __dirname, encoding: "utf8" });
  return { out, r };
}

// Trích frame tại t, đọc pixel (x,y) bằng PIL, trả về [R,G,B].
function probe(out, t, x, y, dir, tag) {
  const png = path.join(dir, `${tag}.png`);
  run("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", out, "-frames:v", "1", png]);
  const py = `from PIL import Image; im = Image.open(${JSON.stringify(png)}).convert("RGB"); print(*im.getpixel((${x}, ${y})))`;
  return run("python3", ["-c", py]).trim().split(/\s+/).map(Number);
}

const isRed = (px) => px[0] > 150 && px[1] < 100 && px[2] < 100;
const isBlue = (px) => px[2] > 150 && px[0] < 100 && px[1] < 100;
const isBlack = (px) => px[0] < 50 && px[1] < 50 && px[2] < 50;

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-d4-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };

  // Nguồn: video đỏ 320x180 3s + ảnh xanh 320x180.
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=320x180:d=3:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    path.join(mediaDir, "red.mp4")]);
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x0000ff:s=320x180:d=1:r=30",
    "-frames:v", "1", path.join(mediaDir, "blue.png")]);

  // --- Test 1: video + rect di chuyển ---
  const spec1 = {
    version: "0.2.0",
    meta: { name: "d4-rect-move", width: 320, height: 180, fps: 30, duration: 3 },
    tracks: [{
      id: "v1", kind: "video", label: "Video",
      clips: [{
        kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 3, in: 0, out: 3, speed: 1,
        mask: {
          shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 1.0, feather: 0,
          keyframes: [
            { t: 0, x: 0.2, y: 0.5, w: 0.4, h: 1.0 },
            { t: 3, x: 0.8, y: 0.5, w: 0.4, h: 1.0 },
          ],
        },
      }],
    }],
  };
  const { out: out1, r: r1 } = renderSpec(dir, mediaDir, spec1, "rect");
  if (r1.status !== 0) { console.error(r1.stdout?.slice(-1500)); console.error(r1.stderr?.slice(-1500)); }
  ok(r1.status === 0 && fs.existsSync(out1), "render video + rect di chuyển ra MP4");
  if (r1.status === 0) {
    // t=0.5: x=0.3 → rect 32..160: (64,90) trong, (256,90) ngoài.
    const aL = probe(out1, 0.5, 64, 90, dir, "r05L");
    const aR = probe(out1, 0.5, 256, 90, dir, "r05R");
    ok(isRed(aL), `t=0.5 pixel trái đỏ (mask ở trái): [${aL}]`);
    ok(isBlack(aR), `t=0.5 pixel phải đen (ngoài mask): [${aR}]`);
    // t=2.5: x=0.7 → rect 160..288: (64,90) ngoài, (256,90) trong.
    const bL = probe(out1, 2.5, 64, 90, dir, "r25L");
    const bR = probe(out1, 2.5, 256, 90, dir, "r25R");
    ok(isBlack(bL), `t=2.5 pixel trái đen (mask đã đi): [${bL}]`);
    ok(isRed(bR), `t=2.5 pixel phải đỏ (mask ở phải): [${bR}]`);
  }

  // --- Test 2: image + ellipse phóng to ---
  const spec2 = {
    version: "0.2.0",
    meta: { name: "d4-ellipse-grow", width: 320, height: 180, fps: 30, duration: 3 },
    tracks: [{
      id: "i1", kind: "image", label: "Image",
      clips: [{
        kind: "image", id: "im1", src: "blue.png", start: 0, duration: 3,
        mask: {
          shape: "ellipse", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0,
          keyframes: [
            { t: 0, x: 0.5, y: 0.5, w: 0.2, h: 0.2 },
            { t: 3, x: 0.5, y: 0.5, w: 0.8, h: 0.8 },
          ],
        },
      }],
    }],
  };
  const { out: out2, r: r2 } = renderSpec(dir, mediaDir, spec2, "ellipse");
  if (r2.status !== 0) { console.error(r2.stdout?.slice(-1500)); console.error(r2.stderr?.slice(-1500)); }
  ok(r2.status === 0 && fs.existsSync(out2), "render image + ellipse phóng to ra MP4");
  if (r2.status === 0) {
    // Điểm (260,90): t=0.5 (w≈0.5, rx=80, dx=100/80>1) ngoài; t=2.5 (w≈0.7,
    // rx=112, dx=100/112<1) trong. Tâm (160,90) luôn trong.
    const c = probe(out2, 0.5, 260, 90, dir, "e05");
    const d = probe(out2, 2.5, 260, 90, dir, "e25");
    const e = probe(out2, 2.5, 160, 90, dir, "e25c");
    ok(isBlack(c), `t=0.5 điểm (260,90) đen (ngoài ellipse nhỏ): [${c}]`);
    ok(isBlue(d), `t=2.5 điểm (260,90) xanh (trong ellipse lớn): [${d}]`);
    ok(isBlue(e), `t=2.5 tâm (160,90) xanh: [${e}]`);
  }

  // --- Test 3: dry-run dùng đường video animation, không geq ---
  const specPath = path.join(dir, "rect.json");
  const dry = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", path.join(dir, "dry.mp4"),
    "--media-dir", mediaDir, "--dry-run"], { cwd: __dirname, encoding: "utf8" });
  const cmd = dry.stdout || "";
  ok(cmd.includes(".mkv"), "dry-run: filter dùng movie video .mkv (đường animation)");
  ok(cmd.includes("trim=end_frame="), "dry-run: video mask có trim=end_frame chặn tràn");
  ok(!/geq=lum=.*mask/i.test(cmd) && !cmd.includes("lum(X,Y)*("), "dry-run: mask keyframes KHÔNG dùng geq");

  // --- Test 4: keyframes sai → validate chặn, không render bừa ---
  const bad = JSON.parse(JSON.stringify(spec1));
  bad.tracks[0].clips[0].mask.keyframes[0].t = -1;
  const badPath = path.join(dir, "bad.json");
  fs.writeFileSync(badPath, JSON.stringify(bad));
  const rb = spawnSync("node", ["src/render.js", "--spec", badPath, "--out", path.join(dir, "bad.mp4"),
    "--media-dir", mediaDir], { cwd: __dirname, encoding: "utf8" });
  ok(rb.status !== 0, "keyframes t âm → render thoát lỗi (validate chặn)");

  console.log(`\ntest_d4_mask_keyframes: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main();
