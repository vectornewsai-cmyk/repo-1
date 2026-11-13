/**
 * test_round88_p1_mask_fallback.js — Ép kích hoạt end-to-end đường fallback
 * video-mask khi sinh video mask thất bại (Phase 9 đợt 88 P1; nợ O2 §5.5 mục 2).
 * Chạy: node test_round88_p1_mask_fallback.js (từ server/render).
 *
 * Cách ép fail (fault injection có kiểm soát, KHÔNG đổi tên/sửa file thật —
 * các luồng song song đợt 88 vẫn dùng mask_anim.py bình thường): chạy
 * render.js con với PATH chèn một shim `python3` ở đầu; shim chỉ fail khi
 * argv chứa mask_anim.py (biến thể A) hoặc mask_anim.py + mask_png.py
 * (biến thể B), mọi lệnh python3 khác exec sang /usr/bin/python3 thật.
 * Từ góc nhìn render.js, mask_anim.py được gọi thật và thoát != 0 — đúng
 * đường lỗi production (thiếu PIL/numpy, tham số sai, crash vẽ frame).
 *
 * Clip kiểm chứng (1280x720, 30fps, 4s, giống O2 §4): video đỏ trơn +
 * mask ellipse w=0.3 h=0.5 + track x 0.35 → 0.65. Hình học fallback t=0:
 * tâm (0.35, 0.5) = pixel (448, 360), rx=192, ry=180.
 *
 * Kiểm chứng (render FFmpeg thật + đọc pixel PNG thật bằng PIL):
 *  A. mask_anim fail → PNG fallback t=0: job không fail; warn pre-pass
 *     "không vẽ được video mask → thử PNG tĩnh tại t=0" + log
 *     "mask track fallback PNG t=0" xuất hiện; tâm vùng đỏ = (0.35, 0.5)
 *     ở MỌI mốc t=0.5/2.0/3.5 (mask tĩnh, KHÔNG bám track — ở t=3.5 track
 *     đã là 0.6125); điểm trong ellipse đỏ, điểm ngoài đen; frame t=2.0
 *     gần giống frame mask tĩnh cùng hình học (MAD < 1).
 *  B. mask_anim + mask_png đều fail → geq tĩnh t=0: job không fail; warn
 *     "PNG fallback cũng thất bại → geq tĩnh tại t=0" + warn site
 *     "mask bám track: không vẽ được video mask (xem log pre-pass)" xuất
 *     hiện; tâm vùng đỏ = (0.35, 0.5) ở mọi mốc; frame t=2.0 gần giống
 *     frame mask tĩnh --mask-mode geq cùng hình học (MAD < 1).
 *  C. Hồi quy (không shim, mask_anim chạy tốt): job ok; KHÔNG có warn
 *     fallback nào; tâm vùng đỏ bám track 0.3875 / 0.5 / 0.6125 tại
 *     t=0.5/2.0/3.5; log "mask track" + video .mkv xuất hiện.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

function run(cmd, args, env) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env });
}

function renderSpec(dir, mediaDir, spec, name, extraArgs = [], shimDir = null) {
  const specPath = path.join(dir, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  const env = shimDir ? { ...process.env, PATH: `${shimDir}:${process.env.PATH}` } : process.env;
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir, ...extraArgs],
    { cwd: __dirname, encoding: "utf8", env });
  return { out, r, specPath };
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

// Shim python3: fail đúng script được chỉ định, còn lại exec python3 thật.
function makeShim(dir, failScripts) {
  const shimDir = path.join(dir, "shim");
  fs.mkdirSync(shimDir, { recursive: true });
  const cases = failScripts.map((s) =>
    `    *${s}) echo "P1-SHIM: simulated ${s} failure (fault injection, test only)" >&2; exit 1;;`
  ).join("\n");
  const script = `#!/bin/sh
# P1 fault-injection shim (test_round88_p1): chỉ fail script được liệt kê.
for a in "$@"; do
  case "$a" in
${cases}
  esac
done
exec /usr/bin/python3 "$@"
`;
  const p = path.join(shimDir, "python3");
  writeFileEpermRetry(p, script);
  fs.chmodSync(p, 0o755);
  return shimDir;
}

const isRed = (px) => px[0] > 150 && px[1] < 100 && px[2] < 100;
const isBlack = (px) => px[0] < 50 && px[1] < 50 && px[2] < 50;

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-p1-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };
  const dump = (r) => { console.error((r.stdout || "").slice(-800)); console.error((r.stderr || "").slice(-800)); };

  // Nguồn: video đỏ 1280x720 4s.
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=1280x720:d=4:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    path.join(mediaDir, "red.mp4")]);

  const W = 1280, H = 720;
  const meta = { width: W, height: H, fps: 30, duration: 4 };
  const track = { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 4, x: 0.65, y: 0.5 }] };
  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0 };
  const vclip = (extra = {}) => ({
    kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1, ...extra,
  });
  const spec = (name, tracks) => ({ version: "0.2.0", meta: { name, ...meta }, tracks });
  const tracked = spec("p1-tracked", [{ id: "v1", kind: "video", clips: [vclip({ mask, track })] }]);
  // Mask tĩnh cùng hình học fallback t=0 (tâm 0.35, 0.5) để đối chiếu MAD.
  const staticAt0 = spec("p1-static0", [{ id: "v1", kind: "video",
    clips: [vclip({ mask: { ...mask, x: 0.35 } })] }]);

  const shimA = makeShim(path.join(dir, "a"), ["mask_anim.py"]);
  const shimB = makeShim(path.join(dir, "b"), ["mask_anim.py", "mask_png.py"]);

  // --- Biến thể A: mask_anim fail → PNG fallback t=0 ---
  console.log("== A: mask_anim fail -> PNG fallback t=0 ==");
  const tA0 = Date.now();
  const { out: outA, r: rA } = renderSpec(dir, mediaDir, tracked, "fb-png", [], shimA);
  const secsA = ((Date.now() - tA0) / 1000).toFixed(1);
  if (rA.status !== 0) dump(rA);
  ok(rA.status === 0 && fs.existsSync(outA), `A: render ra MP4 (job không fail) [${secsA}s]`);
  const outAAll = (rA.stdout || "") + (rA.stderr || "");
  ok(/không vẽ được video mask/.test(rA.stderr || "") && /thử PNG tĩnh tại t=0/.test(rA.stderr || ""),
    "A: warn pre-pass 'không vẽ được video mask → thử PNG tĩnh tại t=0'");
  ok(/mask track fallback PNG t=0/.test(rA.stdout || ""), "A: log 'mask track fallback PNG t=0'");
  ok(!/PNG fallback cũng thất bại/.test(outAAll), "A: KHÔNG có warn 'PNG fallback cũng thất bại'");
  ok(!/\.mkv/.test(rA.stdout || ""), "A: không dùng video mask .mkv (đường video đã fail)");
  if (rA.status === 0) {
    const c05 = centroid(framePng(outA, 0.5, dir, "a05"), 0);
    const c20 = centroid(framePng(outA, 2.0, dir, "a20"), 0);
    const c35 = centroid(framePng(outA, 3.5, dir, "a35"), 0);
    ok(Math.abs(c05.x - 0.35) < 0.01 && Math.abs(c05.y - 0.5) < 0.01,
      `A: t=0.5 tâm mask x=${c05.x} y=${c05.y} ≈ (0.35, 0.5)`);
    ok(Math.abs(c20.x - 0.35) < 0.01 && Math.abs(c20.y - 0.5) < 0.01,
      `A: t=2.0 tâm mask x=${c20.x} y=${c20.y} ≈ (0.35, 0.5) — tĩnh, không bám track`);
    ok(Math.abs(c35.x - 0.35) < 0.01 && Math.abs(c35.y - 0.5) < 0.01,
      `A: t=3.5 tâm mask x=${c35.x} y=${c35.y} ≈ (0.35, 0.5) — track lúc này đã 0.6125`);
    const ctr = probe(outA, 2.0, 448, 360, dir, "a-ctr");
    const outX = probe(outA, 2.0, 700, 360, dir, "a-outx");
    const outY = probe(outA, 2.0, 448, 100, dir, "a-outy");
    ok(isRed(ctr), `A: tâm fallback (448,360) đỏ: [${ctr}]`);
    ok(isBlack(outX), `A: ngoài ellipse phải (700,360) đen: [${outX}]`);
    ok(isBlack(outY), `A: ngoài ellipse trên (448,100) đen: [${outY}]`);
  }

  // --- Đối chiếu A: mask tĩnh cùng hình học t=0 (đường PNG thường) ---
  const { out: outS, r: rS } = renderSpec(dir, mediaDir, staticAt0, "static0");
  ok(rS.status === 0 && fs.existsSync(outS), "đối chiếu A: render mask tĩnh tâm 0.35 ra MP4");
  if (rA.status === 0 && rS.status === 0) {
    const m = mad(framePng(outA, 2.0, dir, "a20b"), framePng(outS, 2.0, dir, "s20"));
    ok(m < 1, `A: fallback PNG t=2.0 vs mask tĩnh tâm 0.35: MAD=${m.toFixed(3)} < 1`);
  }

  // --- Biến thể B: mask_anim + mask_png đều fail → geq tĩnh t=0 ---
  console.log("== B: mask_anim + mask_png fail -> geq tĩnh t=0 ==");
  const tB0 = Date.now();
  const { out: outB, r: rB } = renderSpec(dir, mediaDir, tracked, "fb-geq", [], shimB);
  const secsB = ((Date.now() - tB0) / 1000).toFixed(1);
  if (rB.status !== 0) dump(rB);
  ok(rB.status === 0 && fs.existsSync(outB), `B: render ra MP4 (job không fail) [${secsB}s]`);
  ok(/PNG fallback cũng thất bại → geq tĩnh tại t=0/.test(rB.stderr || ""),
    "B: warn pre-pass 'PNG fallback cũng thất bại → geq tĩnh tại t=0'");
  ok(/mask bám track: không vẽ được video mask \(xem log pre-pass\)/.test(rB.stderr || ""),
    "B: warn site 'mask bám track: không vẽ được video mask (xem log pre-pass)'");
  if (rB.status === 0) {
    const c05 = centroid(framePng(outB, 0.5, dir, "b05"), 0);
    const c20 = centroid(framePng(outB, 2.0, dir, "b20"), 0);
    const c35 = centroid(framePng(outB, 3.5, dir, "b35"), 0);
    ok(Math.abs(c05.x - 0.35) < 0.01 && Math.abs(c05.y - 0.5) < 0.01,
      `B: t=0.5 tâm mask x=${c05.x} y=${c05.y} ≈ (0.35, 0.5)`);
    ok(Math.abs(c20.x - 0.35) < 0.01 && Math.abs(c20.y - 0.5) < 0.01,
      `B: t=2.0 tâm mask x=${c20.x} y=${c20.y} ≈ (0.35, 0.5)`);
    ok(Math.abs(c35.x - 0.35) < 0.01 && Math.abs(c35.y - 0.5) < 0.01,
      `B: t=3.5 tâm mask x=${c35.x} y=${c35.y} ≈ (0.35, 0.5)`);
    const ctr = probe(outB, 2.0, 448, 360, dir, "b-ctr");
    const outX = probe(outB, 2.0, 700, 360, dir, "b-outx");
    ok(isRed(ctr), `B: tâm fallback (448,360) đỏ: [${ctr}]`);
    ok(isBlack(outX), `B: ngoài ellipse phải (700,360) đen: [${outX}]`);
  }

  // --- Đối chiếu B: mask tĩnh tâm 0.35, --mask-mode geq ---
  const tSg0 = Date.now();
  const { out: outSg, r: rSg } = renderSpec(dir, mediaDir, staticAt0, "static0-geq", ["--mask-mode", "geq"]);
  const secsSg = ((Date.now() - tSg0) / 1000).toFixed(1);
  ok(rSg.status === 0 && fs.existsSync(outSg), `đối chiếu B: render mask tĩnh geq tâm 0.35 ra MP4 [${secsSg}s]`);
  if (rB.status === 0 && rSg.status === 0) {
    const m = mad(framePng(outB, 2.0, dir, "b20b"), framePng(outSg, 2.0, dir, "sg20"));
    ok(m < 1, `B: fallback geq t=2.0 vs mask tĩnh geq tâm 0.35: MAD=${m.toFixed(3)} < 1`);
  }

  // --- Biến thể C: hồi quy, không shim — mask_anim chạy tốt ---
  console.log("== C: hồi quy, không shim ==");
  const tC0 = Date.now();
  const { out: outC, r: rC } = renderSpec(dir, mediaDir, tracked, "tracked-ok");
  const secsC = ((Date.now() - tC0) / 1000).toFixed(1);
  if (rC.status !== 0) dump(rC);
  ok(rC.status === 0 && fs.existsSync(outC), `C: render tracked bình thường ra MP4 [${secsC}s]`);
  const outCAll = (rC.stdout || "") + (rC.stderr || "");
  ok(!/không vẽ được video mask/.test(outCAll), "C: KHÔNG có warn fallback video mask");
  ok(!/fallback PNG/.test(outCAll), "C: KHÔNG có log fallback PNG");
  ok(/mask track/.test(rC.stdout || "") && /\.mkv/.test(rC.stdout || ""),
    "C: log pre-pass 'mask track' + video .mkv (đường video hoạt động)");
  if (rC.status === 0) {
    const c05 = centroid(framePng(outC, 0.5, dir, "c05"), 0);
    const c20 = centroid(framePng(outC, 2.0, dir, "c20"), 0);
    const c35 = centroid(framePng(outC, 3.5, dir, "c35"), 0);
    ok(Math.abs(c05.x - 0.3875) < 0.01 && Math.abs(c05.y - 0.5) < 0.01,
      `C: t=0.5 tâm mask x=${c05.x} y=${c05.y} ≈ track 0.3875`);
    ok(Math.abs(c20.x - 0.5) < 0.01 && Math.abs(c20.y - 0.5) < 0.01,
      `C: t=2.0 tâm mask x=${c20.x} y=${c20.y} ≈ track 0.5`);
    ok(Math.abs(c35.x - 0.6125) < 0.01 && Math.abs(c35.y - 0.5) < 0.01,
      `C: t=3.5 tâm mask x=${c35.x} y=${c35.y} ≈ track 0.6125`);
  }

  console.log(`\ntest_round88_p1_mask_fallback: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main();
