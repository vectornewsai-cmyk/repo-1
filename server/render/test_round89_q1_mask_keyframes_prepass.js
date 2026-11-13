/**
 * test_round89_q1_mask_keyframes_prepass.js — Dọn pre-pass R2 vẽ PNG tĩnh thừa
 * cho mask có keyframes (Phase 9 đợt 89 Q1; nợ LIMITS gộp đợt 88 §4 mục 7,
 * phát hiện thêm của đợt 88 P2).
 * Chạy: node test_round89_q1_mask_keyframes_prepass.js (từ server/render).
 * Kiểm chứng (không mock: render FFmpeg thật + đọc pixel PNG thật bằng PIL):
 *  1. Mask keyframes w/h (ellipse w 0.2→0.6, h 0.3→0.7, 720p/4s/30fps):
 *     pre-pass R2 vẽ 0 PNG tĩnh; chỉ vẽ 1 video mask anim (D4). Trước sửa:
 *     1 PNG thừa. Bề rộng vùng đỏ tăng theo keyframes (t=0.5 hẹp, t=3.5 rộng).
 *  2. Mask keyframes geometry (rect x 0.2→0.8): 0 PNG tĩnh R2, 1 video mask
 *     anim; tâm đỏ di chuyển 0.275 → 0.725 tại t=0.5/3.5 (±0.01).
 *  3. Dedup: clip keyframes đứng TRƯỚC clip tĩnh cùng hình học gốc (cùng
 *     maskKey — maskKey bỏ qua keyframes) → clip tĩnh VẪN được vẽ 1 PNG R2
 *     (skip phải nằm trước seen.add, không được chặn oan clip tĩnh).
 *  4. Mask tĩnh KHÔNG hồi quy: R2 vẫn vẽ 1 PNG; render 2 lần MAD = 0.
 *  5. Dry-run keyframes: filter dùng video mask .mkv, KHÔNG chứa PNG R2.
 *  6. MAD trước/sau sửa = 0 (khi chạy với Q1_BASELINE_DIR trỏ tới thư mục
 *     chứa frame baseline trước sửa: wh-t05/t2/t35.png, geo-t05/t2/t35.png).
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

// Tâm + bề rộng bbox của vùng đỏ (pixel đỏ = trong mask, nền đen).
function redStats(png) {
  const py = `import numpy as np
from PIL import Image
im = np.asarray(Image.open(${JSON.stringify(png)}).convert("RGB")).astype(float)
m = (im[:, :, 0] > 100) & (im[:, :, 1] < 100) & (im[:, :, 2] < 100)
ys, xs = np.nonzero(m)
H, W = m.shape
print(f"{xs.mean()/W:.4f} {ys.mean()/H:.4f} {(xs.max()-xs.min()+1)/W:.4f} {(ys.max()-ys.min()+1)/H:.4f} {len(xs)}")`;
  const s = run("python3", ["-c", py]).trim().split(/\s+/).map(Number);
  return { x: s[0], y: s[1], w: s[2], h: s[3], n: s[4] };
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-q1-"));
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
  const maskWH = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0,
    keyframes: [{ t: 0, x: 0.5, y: 0.5, w: 0.2, h: 0.3 }, { t: 4, x: 0.5, y: 0.5, w: 0.6, h: 0.7 }] };
  const maskGeo = { shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 0.4, feather: 0,
    keyframes: [{ t: 0, x: 0.2, y: 0.5, w: 0.4, h: 0.4 }, { t: 4, x: 0.8, y: 0.5, w: 0.4, h: 0.4 }] };
  const maskStatic = { shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 0.4, feather: 0 };
  const spec = (name, tracks) => ({ version: "0.2.0", meta: { name, ...meta }, tracks });
  const vclip = (id, extra = {}) => ({
    kind: "video", id, src: "red.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1, ...extra,
  });

  // --- Test 1: mask keyframes w/h — 0 PNG R2, 1 video mask anim, w tăng theo t ---
  const specWH = spec("q1-wh", [{ id: "v1", kind: "video", clips: [vclip("c1", { mask: maskWH })] }]);
  const { out: outWH, r: rWH, ms: msWH, log: logWH } = renderSpec(dir, mediaDir, specWH, "wh");
  if (rWH.status !== 0) { console.error(rWH.stdout?.slice(-1200)); console.error(rWH.stderr?.slice(-1200)); }
  ok(rWH.status === 0 && fs.existsSync(outWH), `render mask keyframes w/h 720p 4s ra MP4 (${(msWH / 1000).toFixed(1)}s)`);
  ok(count(logWH, /mask PNG "/g) === 0, `w/h keyframes: pre-pass R2 vẽ ${count(logWH, /mask PNG "/g)} PNG tĩnh (phải = 0)`);
  ok(count(logWH, /mask anim "/g) === 1, `w/h keyframes: pre-pass vẽ ${count(logWH, /mask anim "/g)} video mask anim (phải = 1)`);
  if (rWH.status === 0) {
    const s05 = redStats(framePng(outWH, 0.5, dir, "wh-t05"));
    const s35 = redStats(framePng(outWH, 3.5, dir, "wh-t35"));
    ok(Math.abs(s05.x - 0.5) < 0.01 && Math.abs(s05.y - 0.5) < 0.01,
      `w/h t=0.5 tâm=(${s05.x}, ${s05.y}) ≈ (0.5, 0.5)`);
    ok(Math.abs(s05.w - 0.25) < 0.02, `w/h t=0.5 bề rộng vùng đỏ=${s05.w} ≈ 0.25 (w nội suy 0.2→0.6)`);
    ok(Math.abs(s35.w - 0.55) < 0.02, `w/h t=3.5 bề rộng vùng đỏ=${s35.w} ≈ 0.55 (w nội suy 0.2→0.6)`);
    ok(s35.w > s05.w + 0.2, `w/h: mask nở ra theo keyframes (${s05.w} → ${s35.w})`);
  }

  // --- Test 2: mask keyframes geometry (x 0.2→0.8) — 0 PNG R2, tâm di chuyển ---
  const specGeo = spec("q1-geo", [{ id: "v1", kind: "video", clips: [vclip("c1", { mask: maskGeo })] }]);
  const { out: outGeo, r: rGeo, ms: msGeo, log: logGeo } = renderSpec(dir, mediaDir, specGeo, "geo");
  if (rGeo.status !== 0) { console.error(rGeo.stdout?.slice(-1200)); console.error(rGeo.stderr?.slice(-1200)); }
  ok(rGeo.status === 0 && fs.existsSync(outGeo), `render mask keyframes geometry 720p 4s ra MP4 (${(msGeo / 1000).toFixed(1)}s)`);
  ok(count(logGeo, /mask PNG "/g) === 0, `geometry keyframes: pre-pass R2 vẽ ${count(logGeo, /mask PNG "/g)} PNG tĩnh (phải = 0)`);
  ok(count(logGeo, /mask anim "/g) === 1, `geometry keyframes: pre-pass vẽ ${count(logGeo, /mask anim "/g)} video mask anim (phải = 1)`);
  if (rGeo.status === 0) {
    const g05 = redStats(framePng(outGeo, 0.5, dir, "geo-t05"));
    const g20 = redStats(framePng(outGeo, 2.0, dir, "geo-t20"));
    const g35 = redStats(framePng(outGeo, 3.5, dir, "geo-t35"));
    ok(Math.abs(g05.x - 0.275) < 0.01, `geometry t=0.5 tâm x=${g05.x} ≈ 0.275 (±0.01)`);
    ok(Math.abs(g20.x - 0.5) < 0.01, `geometry t=2.0 tâm x=${g20.x} ≈ 0.5 (±0.01)`);
    ok(Math.abs(g35.x - 0.725) < 0.01, `geometry t=3.5 tâm x=${g35.x} ≈ 0.725 (±0.01)`);
  }

  // --- Test 3: dedup — clip keyframes TRƯỚC clip tĩnh cùng maskKey → tĩnh vẫn được vẽ 1 PNG ---
  const specMix = spec("q1-mix", [{ id: "v1", kind: "video", clips: [
    { kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 2, in: 0, out: 2, speed: 1, mask: maskGeo },
    { kind: "video", id: "c2", src: "red.mp4", start: 2, duration: 2, in: 0, out: 2, speed: 1, mask: maskStatic },
  ] }]);
  const { out: outMix, r: rMix, log: logMix } = renderSpec(dir, mediaDir, specMix, "mix");
  if (rMix.status !== 0) { console.error(rMix.stdout?.slice(-1200)); console.error(rMix.stderr?.slice(-1200)); }
  ok(rMix.status === 0 && fs.existsSync(outMix), "render keyframes + tĩnh cùng maskKey ra MP4");
  ok(count(logMix, /mask PNG "/g) === 1, `mix: pre-pass R2 vẽ ${count(logMix, /mask PNG "/g)} PNG (phải = 1 — chỉ cho clip tĩnh)`);
  ok(count(logMix, /mask anim "/g) === 1, `mix: pre-pass vẽ ${count(logMix, /mask anim "/g)} video mask anim (phải = 1)`);

  // --- Test 4: mask tĩnh không hồi quy — 1 PNG R2, render 2 lần MAD = 0 ---
  const specS = spec("q1-static", [{ id: "v1", kind: "video", clips: [vclip("c1", { mask: maskStatic })] }]);
  const { out: outS, r: rS, log: logS } = renderSpec(dir, mediaDir, specS, "static");
  ok(rS.status === 0 && fs.existsSync(outS), "render mask tĩnh 720p 4s ra MP4");
  ok(count(logS, /mask PNG "/g) === 1, `tĩnh: pre-pass R2 vẽ ${count(logS, /mask PNG "/g)} PNG (phải = 1 — giữ nguyên)`);
  const { out: outS2, r: rS2 } = renderSpec(dir, mediaDir, specS, "static2");
  ok(rS2.status === 0 && fs.existsSync(outS2), "render mask tĩnh lần 2 ra MP4");
  if (rS.status === 0 && rS2.status === 0) {
    const m = mad(framePng(outS, 2.0, dir, "s20a"), framePng(outS2, 2.0, dir, "s20b"));
    ok(m === 0, `mask tĩnh render 2 lần: MAD=${m} (phải = 0)`);
  }

  // --- Test 5: dry-run keyframes — filter dùng .mkv, không chứa PNG tĩnh R2 ---
  const dry = spawnSync("node", ["src/render.js", "--spec", path.join(dir, "wh.json"),
    "--out", path.join(dir, "dry.mp4"), "--media-dir", mediaDir, "--dry-run"],
    { cwd: __dirname, encoding: "utf8" });
  const ffLine = (dry.stdout || "").split("\n").find((l) => l.startsWith("ffmpeg ")) || "";
  ok(!/repo1-mask-\d+-\d+\.png/.test(ffLine), "dry-run keyframes: filter KHÔNG chứa PNG tĩnh R2 (repo1-mask-*.png)");
  ok(ffLine.includes(".mkv"), "dry-run keyframes: filter vẫn dùng video mask .mkv");
  ok(ffLine.includes("trim=end_frame=120"), "dry-run keyframes: video mask trim=end_frame=120 (4s×30fps)");

  // --- Test 6: MAD trước/sau sửa = 0 (cần Q1_BASELINE_DIR với frame trước sửa) ---
  const base = process.env.Q1_BASELINE_DIR;
  if (base) {
    const pairs = [["wh", "wh-t05", 0.5], ["wh", "wh-t2", 2.0], ["wh", "wh-t35", 3.5],
      ["geo", "geo-t05", 0.5], ["geo", "geo-t2", 2.0], ["geo", "geo-t35", 3.5]];
    const outs = { wh: outWH, geo: outGeo };
    for (const [name, tag, t] of pairs) {
      const b = path.join(base, `${tag}.png`);
      if (!fs.existsSync(b)) { console.log(`  (bỏ qua MAD ${tag}: không có baseline)`); continue; }
      const a = framePng(outs[name], t, dir, `${tag}-after`);
      const m = mad(a, b);
      ok(m === 0, `MAD trước/sau sửa ${tag} (t=${t}) = ${m} (phải = 0)`);
    }
  } else {
    console.log("  (bỏ qua MAD trước/sau: chưa đặt Q1_BASELINE_DIR)");
  }

  console.log(`\ntest_round89_q1_mask_keyframes_prepass: ${pass} pass, ${fail} fail (WORK=${dir})`);
  console.log(`Thời gian render: w/h ${(msWH / 1000).toFixed(1)}s, geometry ${(msGeo / 1000).toFixed(1)}s`);
  process.exit(fail ? 1 : 0);
}

main();
