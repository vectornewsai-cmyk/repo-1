/**
 * test_round90_r4_fallback_warn_keyframes.js — Warn cấp site cho nhánh
 * keyframes fallback (Phase 9 đợt 90 R4; đóng quan sát 1 LIMITS Q4).
 * Chạy: node test_round90_r4_fallback_warn_keyframes.js (từ server/render).
 * Chạy riêng 1 mảng: R4_SECTIONS=A|B|C|D|E (phẩy, vd "B,C").
 *
 * Q4 đã đo: nhánh keyframes fallback (D4-A/B, INV-D4-A) chỉ có warn ở log
 * pre-pass, nhánh tracked có warn site "mask bám track: ...". Đợt này thêm
 * warn site cho nhánh keyframes trong render.js (maskChainForSite), mirror
 * đúng mẫu tracked — chỉ khác ngữ cảnh keyframes:
 *  R4-A — keyframes, mask_anim fail -> PNG fallback t=0 (x=0.3): warn
 *         pre-pass có, log PNG fallback có; KHÔNG có warn site "mask
 *         keyframes:" (mirror tracked: tầng PNG chỉ có warn pre-pass,
 *         như IMG-A / P1-A). Tâm tĩnh 0.3, MAD=0 vs mask tĩnh x=0.3.
 *  R4-B — keyframes, cả 2 helper fail -> geq tĩnh t=0: warn pre-pass
 *         "PNG fallback cũng thất bại" + warn site MỚI "mask keyframes:
 *         không vẽ được video mask (xem log pre-pass) → mask tĩnh tại t=0
 *         (KHÔNG chạy keyframes...)". Tâm tĩnh 0.3, MAD=0 vs geq tĩnh x=0.3.
 *  R4-C — hồi quy keyframes, không shim: KHÔNG có warn fallback nào (cả
 *         "không vẽ được video mask" lẫn "mask keyframes:"), video .mkv
 *         chạy thật, tâm 0.35/0.5/0.65 theo keyframes.
 *  R4-D — keyframes + --mask-mode geq, shim cả 2 helper fail: warn MỚI
 *         "mask keyframes: --mask-mode geq không chạy keyframes → mask
 *         tĩnh tại t=0" (quan sát 2 LIMITS Q4 — geq không có đường video
 *         nên keyframes đứng yên theo thiết kế, báo rõ thay vì lặng lẽ);
 *         KHÔNG warn "không vẽ được video mask", KHÔNG log fallback PNG
 *         (pre-pass bị bỏ qua). Tâm tĩnh 0.3, MAD=0 vs geq tĩnh x=0.3.
 *  R4-E — keyframes + invert, cả 2 helper fail -> geq invert t=0: warn
 *         site "mask keyframes:" có; centroid vùng đỏ ≈ (0.527, 0.5)
 *         (phần bù ellipse x=0.3); MAD=0 vs invert tĩnh geq x=0.3.
 *
 * Cách ép fail: shim `python3` trên PATH riêng của tiến trình render con
 * (mẫu P1/Q4 — chỉ fail khi argv chứa mask_anim.py / mask_png.py, còn lại
 * exec /usr/bin/python3 thật; KHÔNG sửa file thật).
 *
 * Chống sóng EPERM (mẫu Q4): retry RỘNG mọi thao tác ghi file phụ, render
 * chỉ retry khi fail đúng vì EPERM (tối đa 4 lần); backoff bằng
 * spawnSync("sleep") vì Atomics.wait trả ngay 0ms trên VM này.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const SECTIONS = new Set(
  (process.env.R4_SECTIONS || "A,B,C,D,E").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
const runSection = (name) => SECTIONS.has(name);

function run(cmd, args, env) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env });
}

function runRetry(cmd, args, env, attempts = 20) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      return run(cmd, args, env);
    } catch (e) {
      lastErr = e;
      spawnSync("sleep", [String(Math.min(2 * i, 15))], { stdio: "ignore" });
    }
  }
  throw lastErr;
}

function renderSpec(dir, mediaDir, spec, name, extraArgs = [], shimDir = null) {
  const specPath = path.join(dir, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  const env = shimDir ? { ...process.env, PATH: `${shimDir}:${process.env.PATH}` } : process.env;
  const t0 = Date.now();
  let r = null;
  let lastSecs = 0;
  const waits = [15, 30, 60];
  for (let attempt = 1; attempt <= 4; attempt++) {
    const tA = Date.now();
    r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir, ...extraArgs],
      { cwd: __dirname, encoding: "utf8", env });
    lastSecs = (Date.now() - tA) / 1000;
    const all = (r.stdout || "") + (r.stderr || "");
    if (r.status === 0 || !/Operation not permitted/.test(all)) break;
    console.error(`  (render "${name}" fail vì EPERM, thử lại lần ${attempt}/4 sau ${waits[attempt - 1] || 60}s)`);
    spawnSync("sleep", [String(waits[attempt - 1] || 60)], { stdio: "ignore" });
  }
  return { out, r, specPath, secs: (Date.now() - t0) / 1000, lastSecs };
}

function framePng(out, t, dir, tag) {
  const png = path.join(dir, `${tag}.png`);
  let lastErr = null;
  for (let attempt = 1; attempt <= 25; attempt++) {
    try {
      run("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", out, "-frames:v", "1", png]);
      if (fs.existsSync(png) && fs.statSync(png).size > 0) return png;
      lastErr = new Error(`ffmpeg exit 0 nhưng ${png} rỗng/thiếu (attempt ${attempt})`);
    } catch (e) {
      lastErr = e;
    }
    spawnSync("sleep", [String(Math.min(0.5 * attempt, 12))], { stdio: "ignore" });
  }
  throw lastErr;
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

function makeShim(dir, failScripts) {
  const shimDir = path.join(dir, "shim");
  fs.mkdirSync(shimDir, { recursive: true });
  const cases = failScripts.map((s) =>
    `    *${s}) echo "R4-SHIM: simulated ${s} failure (fault injection, test only)" >&2; exit 1;;`
  ).join("\n");
  const script = `#!/bin/sh
# R4 fault-injection shim (test_round90_r4): chỉ fail script được liệt kê.
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

// Cache media dùng chung ngoài repo (mẫu Q4, không stage): sinh 1 lần bằng
// ffmpeg, các lượt sau copy bằng node fs. Cache hợp lệ = file > 0 byte.
const MEDIA_CACHE = path.join(os.homedir(), "workspace", "q4-media-cache");
function copyCached(mediaDir) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      fs.mkdirSync(MEDIA_CACHE, { recursive: true });
      const mp4 = path.join(MEDIA_CACHE, "red.mp4");
      const png = path.join(MEDIA_CACHE, "red.png");
      if (!fs.existsSync(mp4) || fs.statSync(mp4).size === 0 ||
          !fs.existsSync(png) || fs.statSync(png).size === 0) return false;
      fs.copyFileSync(mp4, path.join(mediaDir, "red.mp4"));
      fs.copyFileSync(png, path.join(mediaDir, "red.png"));
      if (fs.statSync(path.join(mediaDir, "red.mp4")).size > 0 &&
          fs.statSync(path.join(mediaDir, "red.png")).size > 0) return true;
    } catch (e) { /* thử lại */ }
    spawnSync("sleep", ["5"], { stdio: "ignore" });
  }
  return false;
}
function ensureMedia(mediaDir) {
  if (copyCached(mediaDir)) return;
  fs.mkdirSync(MEDIA_CACHE, { recursive: true });
  const tmpMp4 = path.join(MEDIA_CACHE, `red.${process.pid}.mp4`);
  const tmpPng = path.join(MEDIA_CACHE, `red.${process.pid}.png`);
  runRetry("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=1280x720:d=4:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", tmpMp4]);
  runRetry("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xff0000:s=1280x720:d=1:r=1",
    "-frames:v", "1", tmpPng]);
  if (fs.statSync(tmpMp4).size > 0) fs.renameSync(tmpMp4, path.join(MEDIA_CACHE, "red.mp4"));
  if (fs.statSync(tmpPng).size > 0) fs.renameSync(tmpPng, path.join(MEDIA_CACHE, "red.png"));
  if (!copyCached(mediaDir)) throw new Error("ensureMedia: không copy được media từ cache sau khi sinh");
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r4-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };
  const dump = (r) => { console.error((r.stdout || "").slice(-800)); console.error((r.stderr || "").slice(-800)); };

  ensureMedia(mediaDir);

  const W = 1280, H = 720;
  const meta = { width: W, height: H, fps: 30, duration: 4 };
  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0 };
  // D4: keyframes x 0.3 → 0.7 (t=0: 0.3; t=0.5: 0.35; t=2.0: 0.5; t=3.5: 0.65).
  const maskKf = {
    ...mask,
    keyframes: [
      { t: 0, x: 0.3, y: 0.5, w: 0.3, h: 0.5 },
      { t: 4, x: 0.7, y: 0.5, w: 0.3, h: 0.5 },
    ],
  };
  const vclip = (extra = {}) => ({
    kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1, ...extra,
  });
  const spec = (name, tracks) => ({ version: "0.2.0", meta: { name, ...meta }, tracks });
  const vtrack = (clips) => [{ id: "v1", kind: "video", clips }];

  const shimA = makeShim(path.join(dir, "a"), ["mask_anim.py"]);
  const shimB = makeShim(path.join(dir, "b"), ["mask_anim.py", "mask_png.py"]);

  const kfSpec = spec("r4-kf", vtrack([vclip({ mask: maskKf })]));
  const kfStatic0 = spec("r4-kf-static0", vtrack([vclip({ mask: { ...mask, x: 0.3 } })]));
  const invKf = spec("r4-inv-kf", vtrack([vclip({ mask: { ...maskKf, invert: true } })]));
  const invStatic03 = spec("r4-inv-static03", vtrack([vclip({ mask: { ...mask, invert: true, x: 0.3 } })]));

  // ================= R4-A: keyframes, mask_anim fail -> PNG fallback t=0 =================
  if (runSection("A")) {
    console.log("== R4-A: keyframes, mask_anim fail -> PNG fallback t=0 (x=0.3) ==");
    const { out: outA, r: rA, secs: sA } = renderSpec(dir, mediaDir, kfSpec, "r4-fb-png", [], shimA);
    if (rA.status !== 0) dump(rA);
    ok(rA.status === 0 && fs.existsSync(outA), `R4-A: render ra MP4 (job không fail) [${sA.toFixed(1)}s]`);
    ok(/mask anim/.test(rA.stderr || "") && /không vẽ được video mask/.test(rA.stderr || "") &&
      /thử PNG tĩnh tại t=0/.test(rA.stderr || ""),
      "R4-A: warn pre-pass 'mask anim ... không vẽ được video mask → thử PNG tĩnh tại t=0'");
    ok(/mask anim fallback PNG t=0/.test(rA.stdout || ""), "R4-A: log 'mask anim fallback PNG t=0'");
    ok(!/PNG fallback cũng thất bại/.test((rA.stdout || "") + (rA.stderr || "")),
      "R4-A: KHÔNG có warn 'PNG fallback cũng thất bại'");
    ok(!/mask keyframes:/.test(rA.stderr || ""),
      "R4-A: KHÔNG có warn site 'mask keyframes:' ở tầng PNG (mirror tracked IMG-A/P1-A)");
    ok(!/\.mkv/.test(rA.stdout || ""), "R4-A: không dùng video mask .mkv (đường video đã fail)");
    if (rA.status === 0) {
      for (const [t, tag] of [[0.5, "r4a05"], [2.0, "r4a20"], [3.5, "r4a35"]]) {
        const c = centroid(framePng(outA, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `R4-A: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5) — tĩnh tại t=0, không chạy keyframes`);
      }
      const ctr = probe(outA, 2.0, 384, 360, dir, "r4a-ctr");
      const outX = probe(outA, 2.0, 700, 360, dir, "r4a-outx");
      ok(isRed(ctr), `R4-A: tâm fallback (384,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `R4-A: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outAS, r: rAS } = renderSpec(dir, mediaDir, kfStatic0, "r4-static0");
    ok(rAS.status === 0 && fs.existsSync(outAS), "đối chiếu R4-A: render mask tĩnh x=0.3 ra MP4");
    if (rA.status === 0 && rAS.status === 0) {
      const m = mad(framePng(outA, 2.0, dir, "r4a20b"), framePng(outAS, 2.0, dir, "r4as20"));
      ok(m < 1, `R4-A: fallback PNG t=2.0 vs mask tĩnh x=0.3: MAD=${m.toFixed(3)} < 1`);
    }
  }

  // ================= R4-B: keyframes, cả 2 helper fail -> geq tĩnh t=0 =================
  if (runSection("B")) {
    console.log("== R4-B: keyframes, mask_anim + mask_png fail -> geq tĩnh t=0 ==");
    const { out: outB, r: rB, secs: sB } = renderSpec(dir, mediaDir, kfSpec, "r4-fb-geq", [], shimB);
    if (rB.status !== 0) dump(rB);
    ok(rB.status === 0 && fs.existsSync(outB), `R4-B: render ra MP4 (job không fail) [${sB.toFixed(1)}s]`);
    ok(/PNG fallback cũng thất bại → geq tĩnh tại t=0/.test(rB.stderr || ""),
      "R4-B: warn pre-pass 'PNG fallback cũng thất bại → geq tĩnh tại t=0'");
    ok(/mask keyframes: không vẽ được video mask \(xem log pre-pass\)/.test(rB.stderr || ""),
      "R4-B: warn site MỚI 'mask keyframes: không vẽ được video mask (xem log pre-pass)'");
    ok(/mask keyframes:.*KHÔNG chạy keyframes/.test(rB.stderr || ""),
      "R4-B: warn site nói rõ 'KHÔNG chạy keyframes, mask đứng yên theo thiết kế D4'");
    if (rB.status === 0) {
      for (const [t, tag] of [[0.5, "r4b05"], [2.0, "r4b20"], [3.5, "r4b35"]]) {
        const c = centroid(framePng(outB, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `R4-B: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5)`);
      }
      const ctr = probe(outB, 2.0, 384, 360, dir, "r4b-ctr");
      const outX = probe(outB, 2.0, 700, 360, dir, "r4b-outx");
      ok(isRed(ctr), `R4-B: tâm fallback (384,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `R4-B: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outBSg, r: rBSg, secs: sBSg } =
      renderSpec(dir, mediaDir, kfStatic0, "r4-static0-geq", ["--mask-mode", "geq"]);
    ok(rBSg.status === 0 && fs.existsSync(outBSg),
      `đối chiếu R4-B: render mask tĩnh geq x=0.3 ra MP4 [${sBSg.toFixed(1)}s]`);
    if (rB.status === 0 && rBSg.status === 0) {
      const m = mad(framePng(outB, 2.0, dir, "r4b20b"), framePng(outBSg, 2.0, dir, "r4bsg20"));
      ok(m < 1, `R4-B: fallback geq t=2.0 vs mask tĩnh geq x=0.3: MAD=${m.toFixed(3)} < 1`);
    }
  }

  // ================= R4-C: hồi quy keyframes, không shim =================
  if (runSection("C")) {
    console.log("== R4-C: hồi quy keyframes, không shim ==");
    const { out: outC, r: rC, secs: sC } = renderSpec(dir, mediaDir, kfSpec, "r4-ok");
    if (rC.status !== 0) dump(rC);
    ok(rC.status === 0 && fs.existsSync(outC), `R4-C: render keyframes bình thường ra MP4 [${sC.toFixed(1)}s]`);
    const outCAll = (rC.stdout || "") + (rC.stderr || "");
    ok(!/không vẽ được video mask/.test(outCAll), "R4-C: KHÔNG có warn fallback video mask");
    ok(!/mask keyframes:/.test(outCAll), "R4-C: KHÔNG có warn site 'mask keyframes:' khi render bình thường");
    ok(/mask anim/.test(rC.stdout || "") && /\.mkv/.test(rC.stdout || ""),
      "R4-C: log pre-pass 'mask anim' + video .mkv (đường video hoạt động)");
    if (rC.status === 0) {
      for (const [t, ex, tag] of [[0.5, 0.35, "r4c05"], [2.0, 0.5, "r4c20"], [3.5, 0.65, "r4c35"]]) {
        const c = centroid(framePng(outC, t, dir, tag), 0);
        ok(Math.abs(c.x - ex) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `R4-C: t=${t} tâm mask x=${c.x} y=${c.y} ≈ keyframes ${ex}`);
      }
    }
  }

  // ================= R4-D: keyframes + --mask-mode geq =================
  if (runSection("D")) {
    console.log("== R4-D: keyframes + --mask-mode geq, shim cả 2 helper fail ==");
    const { out: outD, r: rD, secs: sD } =
      renderSpec(dir, mediaDir, kfSpec, "r4-geq-kf-shim", ["--mask-mode", "geq"], shimB);
    if (rD.status !== 0) dump(rD);
    ok(rD.status === 0 && fs.existsSync(outD), `R4-D: render geq keyframes ra MP4 dù helper fail [${sD.toFixed(1)}s]`);
    const outDAll = (rD.stdout || "") + (rD.stderr || "");
    ok(/mask keyframes: --mask-mode geq không chạy keyframes/.test(rD.stderr || ""),
      "R4-D: warn site MỚI 'mask keyframes: --mask-mode geq không chạy keyframes → mask tĩnh tại t=0'");
    ok(!/không vẽ được video mask/.test(outDAll), "R4-D: KHÔNG warn 'không vẽ được video mask' (pre-pass bị bỏ qua)");
    ok(!/fallback PNG/.test(outDAll), "R4-D: KHÔNG log fallback PNG");
    ok(!/\.mkv/.test(rD.stdout || ""), "R4-D: không dùng video mask .mkv (pre-pass bị bỏ qua)");
    if (rD.status === 0) {
      for (const [t, tag] of [[0.5, "r4d05"], [2.0, "r4d20"], [3.5, "r4d35"]]) {
        const c = centroid(framePng(outD, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `R4-D: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5) — geq tĩnh tại hình học keyframes t=0`);
      }
    }
    const { out: outDref, r: rDref } =
      renderSpec(dir, mediaDir, kfStatic0, "r4-geq-kf-ref", ["--mask-mode", "geq"]);
    ok(rDref.status === 0 && fs.existsSync(outDref), "đối chiếu R4-D: render mask tĩnh geq x=0.3 ra MP4");
    if (rD.status === 0 && rDref.status === 0) {
      const m = mad(framePng(outD, 2.0, dir, "r4d20b"), framePng(outDref, 2.0, dir, "r4d-ref20"));
      ok(m < 0.5, `R4-D: geq keyframes t=2.0 vs mask tĩnh geq x=0.3: MAD=${m.toFixed(3)} < 0.5`);
    }
  }

  // ================= R4-E: keyframes + invert, cả 2 helper fail -> geq invert =================
  if (runSection("E")) {
    console.log("== R4-E: keyframes + invert, cả 2 helper fail -> geq tĩnh t=0 invert ==");
    // Phần bù ellipse x=0.3: centroid x = (0.5 − 0.1178*0.3)/0.8822 ≈ 0.527.
    const { out: outE, r: rE, secs: sE } = renderSpec(dir, mediaDir, invKf, "r4-invkf-fb-geq", [], shimB);
    if (rE.status !== 0) dump(rE);
    ok(rE.status === 0 && fs.existsSync(outE), `R4-E: render ra MP4 (job không fail) [${sE.toFixed(1)}s]`);
    ok(/PNG fallback cũng thất bại → geq tĩnh tại t=0/.test(rE.stderr || ""),
      "R4-E: warn pre-pass 'PNG fallback cũng thất bại → geq tĩnh tại t=0'");
    ok(/mask keyframes: không vẽ được video mask \(xem log pre-pass\)/.test(rE.stderr || ""),
      "R4-E: warn site 'mask keyframes: không vẽ được video mask (xem log pre-pass)' (keyframes+invert)");
    if (rE.status === 0) {
      const c = centroid(framePng(outE, 2.0, dir, "r4e20"), 0);
      ok(Math.abs(c.x - 0.527) < 0.02 && Math.abs(c.y - 0.5) < 0.01,
        `R4-E: t=2.0 centroid vùng đỏ x=${c.x} y=${c.y} ≈ (0.527, 0.5) — phần bù ellipse t=0`);
      const ctr = probe(outE, 2.0, 384, 360, dir, "r4e-ctr");
      const outL = probe(outE, 2.0, 100, 360, dir, "r4e-outl");
      ok(isBlack(ctr), `R4-E: trong ellipse (384,360) đen (invert che trong): [${ctr}]`);
      ok(isRed(outL), `R4-E: ngoài ellipse trái (100,360) đỏ: [${outL}]`);
    }
    const { out: outESg, r: rESg, secs: sESg } =
      renderSpec(dir, mediaDir, invStatic03, "r4-inv-static03-geq", ["--mask-mode", "geq"]);
    ok(rESg.status === 0 && fs.existsSync(outESg),
      `đối chiếu R4-E: render invert tĩnh geq x=0.3 ra MP4 [${sESg.toFixed(1)}s]`);
    if (rE.status === 0 && rESg.status === 0) {
      const m = mad(framePng(outE, 2.0, dir, "r4e20b"), framePng(outESg, 2.0, dir, "r4esg20"));
      ok(m < 1, `R4-E: fallback geq invert t=2.0 vs invert tĩnh geq x=0.3: MAD=${m.toFixed(3)} < 1`);
    }
  }

  console.log(`\ntest_round90_r4_fallback_warn_keyframes [${[...SECTIONS].join(",")}]: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main();
