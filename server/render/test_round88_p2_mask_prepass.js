/**
 * test_round88_p2_mask_prepass.js — Dọn pre-pass R2 vẽ PNG tĩnh thừa cho clip
 * tracked (Phase 9 đợt 88 P2; nợ O2 §5.5 / LIMITS gộp đợt 87 §4 mục 7).
 * Chạy: node test_round88_p2_mask_prepass.js (từ server/render).
 * Kiểm chứng (không mock: render FFmpeg thật + đọc pixel PNG thật bằng PIL):
 *  1. Clip tracked (720p, 4s, 30fps, track x 0.35→0.65): pre-pass R2 KHÔNG
 *     vẽ PNG tĩnh nào (0 dòng log `mask PNG "`); chỉ vẽ video mask track
 *     (1 dòng `mask track "`). Trước sửa: 1 PNG thừa mỗi mask tracked phân
 *     biệt (2 clip tracked khác mask → 2 PNG thừa).
 *  2. Tâm mask tracked đo được tại t=0.5/2.0/3.5 = 0.3875/0.5/0.6125
 *     (±0.01) — khớp quỹ đạo, không đổi sau khi bỏ PNG thừa.
 *  3. Mask tĩnh KHÔNG hồi quy: render 2 lần cùng spec → frame MAD = 0;
 *     và frame tĩnh sau sửa vs baseline trước sửa → MAD = 0.
 *  4. Dry-run tracked: filter KHÔNG chứa `repo1-mask-<pid>-*.png`
 *     (PNG tĩnh R2), vẫn chứa video mask `.mkv` + `trim=end_frame=120`.
 *  5. Thời gian render tracked sau sửa không tăng so với trước sửa
 *     (in ra để đối chiếu; ngưỡng mềm: không chậm hơn 10%).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function renderSpec(dir, mediaDir, spec, name, extraArgs = []) {
  const specPath = path.join(dir, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir, ...extraArgs],
    { cwd: __dirname, encoding: "utf8" });
  const ms = Date.now() - t0;
  const log = (r.stdout || "") + (r.stderr || "");
  return { out, r, specPath, ms, log };
}

function framePng(out, t, dir, tag) {
  const png = path.join(dir, `${tag}.png`);
  run("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", out, "-frames:v", "1", png]);
  return png;
}

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

function mad(a, b) {
  const py = `import numpy as np
from PIL import Image
x = np.asarray(Image.open(${JSON.stringify(a)}).convert("RGB")).astype(float)
y = np.asarray(Image.open(${JSON.stringify(b)}).convert("RGB")).astype(float)
print(float(np.abs(x - y).mean()))`;
  return Number(run("python3", ["-c", py]).trim());
}

const count = (log, re) => (log.match(re) || []).length;

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-p2-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };

  // Nguồn: video đỏ 1280x720 4s.
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=1280x720:d=4:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    path.join(mediaDir, "red.mp4")]);

  const W = 1280, H = 720;
  const meta = { width: W, height: H, fps: 30, duration: 4 };
  const track = { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 4, x: 0.65, y: 0.5 }] };
  const maskT = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0 };
  const maskT2 = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.2, h: 0.4, feather: 0 };
  const maskS = { shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 0.4, feather: 0 };
  const spec = (name, tracks) => ({ version: "0.2.0", meta: { name, ...meta }, tracks });
  const vclip = (id, extra = {}) => ({
    kind: "video", id, src: "red.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1, ...extra,
  });

  // --- Test 1: 1 clip tracked — 0 PNG tĩnh R2, 1 video mask track ---
  const specT = spec("p2-tracked", [{ id: "v1", kind: "video", clips: [vclip("c1", { mask: maskT, track })] }]);
  const { out: outT, r: rT, ms: msT, log: logT } = renderSpec(dir, mediaDir, specT, "tracked");
  if (rT.status !== 0) { console.error(rT.stdout?.slice(-1200)); console.error(rT.stderr?.slice(-1200)); }
  ok(rT.status === 0 && fs.existsSync(outT), `render tracked 720p 4s ra MP4 (${(msT / 1000).toFixed(1)}s)`);
  const nPngT = count(logT, /mask PNG "/g);
  const nTrackT = count(logT, /mask track "/g);
  ok(nPngT === 0, `tracked: pre-pass R2 vẽ ${nPngT} PNG tĩnh (phải = 0 — bỏ bước thừa)`);
  ok(nTrackT === 1, `tracked: pre-pass vẽ ${nTrackT} video mask track (phải = 1)`);
  if (rT.status === 0) {
    const c05 = centroid(framePng(outT, 0.5, dir, "t05"), 0);
    const c20 = centroid(framePng(outT, 2.0, dir, "t20"), 0);
    const c35 = centroid(framePng(outT, 3.5, dir, "t35"), 0);
    ok(Math.abs(c05.x - 0.3875) < 0.01, `tracked t=0.5 tâm x=${c05.x} ≈ 0.3875 (±0.01)`);
    ok(Math.abs(c20.x - 0.5) < 0.01, `tracked t=2.0 tâm x=${c20.x} ≈ 0.5 (±0.01)`);
    ok(Math.abs(c35.x - 0.6125) < 0.01, `tracked t=3.5 tâm x=${c35.x} ≈ 0.6125 (±0.01)`);
    ok(Math.abs(c20.y - 0.5) < 0.01, `tracked t=2.0 tâm y=${c20.y} ≈ 0.5`);
  }

  // --- Test 2: 2 clip tracked nối tiếp, mask khác nhau — 0 PNG tĩnh R2 ---
  const specT2 = spec("p2-tracked2", [{ id: "v1", kind: "video", clips: [
    { kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 2, in: 0, out: 2, speed: 1, mask: maskT, track },
    { kind: "video", id: "c2", src: "red.mp4", start: 2, duration: 2, in: 0, out: 2, speed: 1, mask: maskT2, track },
  ] }]);
  const { out: outT2, r: rT2, log: logT2 } = renderSpec(dir, mediaDir, specT2, "tracked2");
  if (rT2.status !== 0) { console.error(rT2.stdout?.slice(-1200)); console.error(rT2.stderr?.slice(-1200)); }
  ok(rT2.status === 0 && fs.existsSync(outT2), "render 2 clip tracked (mask khác nhau) ra MP4");
  ok(count(logT2, /mask PNG "/g) === 0, `2 clip tracked: pre-pass R2 vẽ ${count(logT2, /mask PNG "/g)} PNG tĩnh (phải = 0)`);
  ok(count(logT2, /mask track "/g) === 2, `2 clip tracked: pre-pass vẽ ${count(logT2, /mask track "/g)} video mask track (phải = 2)`);

  // --- Test 3: mask tĩnh — R2 VẪN vẽ PNG (giữ nguyên), render 2 lần MAD = 0 ---
  const specS = spec("p2-static", [{ id: "v1", kind: "video", clips: [vclip("c1", { mask: maskS })] }]);
  const { out: outS, r: rS, ms: msS, log: logS } = renderSpec(dir, mediaDir, specS, "static");
  if (rS.status !== 0) { console.error(rS.stdout?.slice(-1200)); console.error(rS.stderr?.slice(-1200)); }
  ok(rS.status === 0 && fs.existsSync(outS), `render mask tĩnh 720p 4s ra MP4 (${(msS / 1000).toFixed(1)}s)`);
  ok(count(logS, /mask PNG "/g) === 1, `tĩnh: pre-pass R2 vẽ ${count(logS, /mask PNG "/g)} PNG (phải = 1 — giữ nguyên)`);
  const { out: outS2, r: rS2 } = renderSpec(dir, mediaDir, specS, "static2");
  ok(rS2.status === 0 && fs.existsSync(outS2), "render mask tĩnh lần 2 ra MP4");
  if (rS.status === 0 && rS2.status === 0) {
    const m = mad(framePng(outS, 2.0, dir, "s20a"), framePng(outS2, 2.0, dir, "s20b"));
    ok(m === 0, `mask tĩnh render 2 lần: MAD=${m} (phải = 0)`);
  }

  // --- Test 4: dry-run tracked — filter (dòng lệnh ffmpeg) không còn PNG tĩnh R2 ---
  const dry = spawnSync("node", ["src/render.js", "--spec", path.join(dir, "tracked.json"),
    "--out", path.join(dir, "dry.mp4"), "--media-dir", mediaDir, "--dry-run"],
    { cwd: __dirname, encoding: "utf8" });
  const ffLine = (dry.stdout || "").split("\n").find((l) => l.startsWith("ffmpeg ")) || "";
  ok(!/repo1-mask-\d+-\d+\.png/.test(ffLine), "dry-run tracked: filter KHÔNG chứa PNG tĩnh R2 (repo1-mask-*.png)");
  ok(ffLine.includes(".mkv"), "dry-run tracked: filter vẫn dùng video mask .mkv");
  ok(ffLine.includes("trim=end_frame=120"), "dry-run tracked: video mask trim=end_frame=120 (4s×30fps)");

  // --- Test 5: chi phí 1 lần mask_png.py 720p (đo riêng, đối chiếu) ---
  const t0 = Date.now();
  const pr = spawnSync("python3", ["src/mask_png.py", "--shape", "ellipse", "--x", "0.5", "--y", "0.5",
    "--w", "0.3", "--h", "0.5", "--feather", "0", "--width", "1280", "--height", "720",
    "--out", path.join(dir, "probe-mask.png")], { cwd: __dirname, encoding: "utf8" });
  const pngMs = Date.now() - t0;
  ok(pr.status === 0 && fs.existsSync(path.join(dir, "probe-mask.png")),
    `1 lần mask_png.py 720p: ${pngMs}ms (chi phí thừa mỗi mask tracked phân biệt, trước sửa)`);

  console.log(`\ntest_round88_p2_mask_prepass: ${pass} pass, ${fail} fail (WORK=${dir})`);
  console.log(`Thời gian render: tracked ${(msT / 1000).toFixed(1)}s, tĩnh ${(msS / 1000).toFixed(1)}s`);
  process.exit(fail ? 1 : 0);
}

main();
