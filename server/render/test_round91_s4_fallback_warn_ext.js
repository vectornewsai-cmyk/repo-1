/**
 * test_round91_s4_fallback_warn_ext.js — Mở rộng warn fallback keyframes
 * (Phase 9 đợt 91 S4; đóng nợ LIMITS gộp đợt 90 §4 mục 4).
 * Chạy: node test_round91_s4_fallback_warn_ext.js (từ server/render).
 * Chạy riêng 1 mảng: S4_SECTIONS=A|B|C|D|E|F|G|H (phẩy, vd "D,E").
 *
 * R4 (đợt 90) đã đo: video clip + mask keyframes — warn site khi cả 2
 * helper fail -> geq t=0, warn riêng mode geq, tầng PNG không warn site.
 * Đợt này đo 3 nợ còn lại của R4 §3:
 *  S4-A — IMAGE clip + mask keyframes, mask_anim fail -> PNG fallback t=0
 *         (x=0.3): warn pre-pass có, log PNG fallback có; KHÔNG warn site
 *         "mask keyframes:" (cùng nhánh maskChainForSite, mirror video);
 *         tâm tĩnh 0.3, MAD=0 vs mask tĩnh image x=0.3.
 *  S4-B — IMAGE clip + mask keyframes, cả 2 helper fail -> geq tĩnh t=0:
 *         warn pre-pass "PNG fallback cũng thất bại" + warn site MỚI
 *         "mask keyframes: không vẽ được video mask (xem log pre-pass)";
 *         tâm tĩnh 0.3, MAD=0 vs image tĩnh geq x=0.3.
 *  S4-C — IMAGE clip + mask keyframes, không shim (hồi quy): KHÔNG warn
 *         fallback nào, video .mkv chạy thật, tâm 0.35/0.5/0.65 theo
 *         keyframes.
 *  S4-D — video clip + mask keyframes, KHÔNG track, --mask-mode trackgeq,
 *         shim cả 2 helper fail: warn site MỚI "mask keyframes:
 *         --mask-mode trackgeq không chạy keyframes → mask tĩnh tại t=0";
 *         KHÔNG warn "không vẽ được video mask", KHÔNG log fallback PNG,
 *         không .mkv (pre-pass bị bỏ qua ở mode này); tâm tĩnh 0.3,
 *         MAD=0 vs tĩnh geq x=0.3.
 *  S4-E — video clip + mask keyframes CÓ track, --mask-mode trackgeq:
 *         track LÁI mask (đường trackgeq O3), keyframes bị bỏ qua theo
 *         thiết kế — KHÔNG có warn "mask keyframes:" nào (cũng không có
 *         warn "mask bám track:"); tâm mask bám track 0.425/0.5/0.575.
 *  S4-F — adjustment layer CẮT GIỮA video clip có mask keyframes: cổng
 *         fail fast ở render.js ném lỗi, job FAIL (exit != 0), stderr
 *         chứa "adjustment layer cắt giữa clip có mask keyframes", KHÔNG
 *         có warn site "mask keyframes:" nào (chưa tới bước dựng graph),
 *         KHÔNG ra file MP4.
 *  S4-G — adjustment layer BAO TRỌN video clip có mask keyframes (không
 *         tách, parts == 1) + shim cả 2 fail: render OK, warn site
 *         "mask keyframes:" xuất hiện ĐÚNG 1 lần (1 site = 1 đoạn), tâm
 *         tĩnh 0.3, MAD=0 vs tĩnh geq cùng layer.
 *  S4-H — video clip mask TĨNH (không keyframes) bị adjustment layer cắt
 *         thành 3 đoạn: render OK, KHÔNG có warn "mask keyframes:" nào
 *         (nhánh mask tĩnh không warn) — đường tách đoạn tự nó không sinh
 *         warn lặp.
 *
 * Kết luận thiết kế (đo ở F/G/H): warn site keyframes KHÔNG THỂ in lặp
 * theo số đoạn — cổng fail fast chặn mọi clip có mask keyframes bị tách
 * (render.js ~664), nên mỗi clip có keyframes tối đa 1 site = 1 warn.
 * Không cần sửa code production cho mục (c); chỉ khóa hành vi bằng test.
 *
 * Cách ép fail: shim `python3` trên PATH riêng của tiến trình render con
 * (mẫu P1/Q4/R4 — chỉ fail khi argv chứa mask_anim.py / mask_png.py, còn
 * lại exec /usr/bin/python3 thật; KHÔNG sửa file thật).
 *
 * Chống sóng EPERM (mẫu Q4/R4): retry RỘNG mọi thao tác ghi file phụ,
 * render chỉ retry khi fail đúng vì EPERM (tối đa 4 lần); backoff bằng
 * spawnSync("sleep") vì Atomics.wait trả ngay 0ms trên VM này.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const SECTIONS = new Set(
  (process.env.S4_SECTIONS || "A,B,C,D,E,F,G,H").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
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

function countOcc(hay, re) {
  return (hay.match(re) || []).length;
}

function makeShim(dir, failScripts) {
  const shimDir = path.join(dir, "shim");
  fs.mkdirSync(shimDir, { recursive: true });
  const cases = failScripts.map((s) =>
    `    *${s}) echo "S4-SHIM: simulated ${s} failure (fault injection, test only)" >&2; exit 1;;`
  ).join("\n");
  const script = `#!/bin/sh
# S4 fault-injection shim (test_round91_s4): chỉ fail script được liệt kê.
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

// Cache media dùng chung ngoài repo (mẫu Q4/R4, không stage): sinh 1 lần
// bằng ffmpeg, các lượt sau copy bằng node fs. Cache hợp lệ = file > 0 byte.
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-s4-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };
  const dump = (r) => { console.error((r.stdout || "").slice(-800)); console.error((r.stderr || "").slice(-800)); };

  ensureMedia(mediaDir);

  const W = 1280, H = 720;
  const meta = { width: W, height: H, fps: 30, duration: 4 };
  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0 };
  // Keyframes x 0.3 → 0.7 (t=0: 0.3; t=0.5: 0.35; t=2.0: 0.5; t=3.5: 0.65) — như R4.
  const maskKf = {
    ...mask,
    keyframes: [
      { t: 0, x: 0.3, y: 0.5, w: 0.3, h: 0.5 },
      { t: 4, x: 0.7, y: 0.5, w: 0.3, h: 0.5 },
    ],
  };
  const track = { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 4, x: 0.65, y: 0.5 }] };
  const vclip = (extra = {}) => ({
    kind: "video", id: "c1", src: "red.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1, ...extra,
  });
  const iclip = (extra = {}) => ({
    kind: "image", id: "im1", src: "red.png", start: 0, duration: 4, ...extra,
  });
  const spec = (name, tracks, adjustmentLayers) => {
    const s = { version: "0.2.0", meta: { name, ...meta }, tracks };
    if (adjustmentLayers) s.adjustmentLayers = adjustmentLayers;
    return s;
  };
  const vtrack = (clips) => [{ id: "v1", kind: "video", clips }];
  const itrack = (clips) => [{ id: "i1", kind: "image", clips }];

  const shimA = makeShim(path.join(dir, "a"), ["mask_anim.py"]);
  const shimB = makeShim(path.join(dir, "b"), ["mask_anim.py", "mask_png.py"]);

  const kfImgSpec = spec("s4-kf-img", itrack([iclip({ mask: maskKf })]));
  const imgStatic0 = spec("s4-img-static0", itrack([iclip({ mask: { ...mask, x: 0.3 } })]));
  const kfSpec = spec("s4-kf", vtrack([vclip({ mask: maskKf })]));
  const kfStatic0 = spec("s4-kf-static0", vtrack([vclip({ mask: { ...mask, x: 0.3 } })]));
  const kfTrackSpec = spec("s4-kf-track", vtrack([vclip({ mask: maskKf, track })]));

  // ================= S4-A: image + keyframes, mask_anim fail -> PNG t=0 =================
  if (runSection("A")) {
    console.log("== S4-A: image + keyframes, mask_anim fail -> PNG fallback t=0 (x=0.3) ==");
    const { out: outA, r: rA, secs: sA } = renderSpec(dir, mediaDir, kfImgSpec, "s4-img-fb-png", [], shimA);
    if (rA.status !== 0) dump(rA);
    ok(rA.status === 0 && fs.existsSync(outA), `S4-A: render image keyframes ra MP4 (job không fail) [${sA.toFixed(1)}s]`);
    ok(/mask anim/.test(rA.stderr || "") && /không vẽ được video mask/.test(rA.stderr || "") &&
      /thử PNG tĩnh tại t=0/.test(rA.stderr || ""),
      "S4-A: warn pre-pass 'mask anim ... không vẽ được video mask → thử PNG tĩnh tại t=0'");
    ok(/mask anim fallback PNG t=0/.test(rA.stdout || ""), "S4-A: log 'mask anim fallback PNG t=0'");
    ok(!/PNG fallback cũng thất bại/.test((rA.stdout || "") + (rA.stderr || "")),
      "S4-A: KHÔNG có warn 'PNG fallback cũng thất bại'");
    ok(!/mask keyframes:/.test(rA.stderr || ""),
      "S4-A: KHÔNG có warn site 'mask keyframes:' ở tầng PNG (mirror video R4-A)");
    ok(!/\.mkv/.test(rA.stdout || ""), "S4-A: không dùng video mask .mkv (đường video đã fail)");
    if (rA.status === 0) {
      for (const [t, tag] of [[0.5, "s4a05"], [2.0, "s4a20"], [3.5, "s4a35"]]) {
        const c = centroid(framePng(outA, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `S4-A: t=${t} tâm mask image x=${c.x} y=${c.y} ≈ (0.3, 0.5) — tĩnh tại t=0`);
      }
      const ctr = probe(outA, 2.0, 384, 360, dir, "s4a-ctr");
      const outX = probe(outA, 2.0, 700, 360, dir, "s4a-outx");
      ok(isRed(ctr), `S4-A: tâm fallback (384,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `S4-A: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outAS, r: rAS } = renderSpec(dir, mediaDir, imgStatic0, "s4-img-static0");
    ok(rAS.status === 0 && fs.existsSync(outAS), "đối chiếu S4-A: render image mask tĩnh x=0.3 ra MP4");
    if (rA.status === 0 && rAS.status === 0) {
      const m = mad(framePng(outA, 2.0, dir, "s4a20b"), framePng(outAS, 2.0, dir, "s4as20"));
      ok(m < 1, `S4-A: fallback PNG image t=2.0 vs image tĩnh x=0.3: MAD=${m.toFixed(3)} < 1`);
    }
  }

  // ================= S4-B: image + keyframes, cả 2 helper fail -> geq t=0 =================
  if (runSection("B")) {
    console.log("== S4-B: image + keyframes, mask_anim + mask_png fail -> geq tĩnh t=0 ==");
    const { out: outB, r: rB, secs: sB } = renderSpec(dir, mediaDir, kfImgSpec, "s4-img-fb-geq", [], shimB);
    if (rB.status !== 0) dump(rB);
    ok(rB.status === 0 && fs.existsSync(outB), `S4-B: render image keyframes ra MP4 (job không fail) [${sB.toFixed(1)}s]`);
    ok(/PNG fallback cũng thất bại → geq tĩnh tại t=0/.test(rB.stderr || ""),
      "S4-B: warn pre-pass 'PNG fallback cũng thất bại → geq tĩnh tại t=0'");
    ok(/mask keyframes: không vẽ được video mask \(xem log pre-pass\)/.test(rB.stderr || ""),
      "S4-B: warn site 'mask keyframes: không vẽ được video mask (xem log pre-pass)' (image)");
    ok(/mask keyframes:.*KHÔNG chạy keyframes/.test(rB.stderr || ""),
      "S4-B: warn site nói rõ 'KHÔNG chạy keyframes, mask đứng yên theo thiết kế D4'");
    if (rB.status === 0) {
      for (const [t, tag] of [[0.5, "s4b05"], [2.0, "s4b20"], [3.5, "s4b35"]]) {
        const c = centroid(framePng(outB, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `S4-B: t=${t} tâm mask image x=${c.x} y=${c.y} ≈ (0.3, 0.5)`);
      }
      const ctr = probe(outB, 2.0, 384, 360, dir, "s4b-ctr");
      const outX = probe(outB, 2.0, 700, 360, dir, "s4b-outx");
      ok(isRed(ctr), `S4-B: tâm fallback (384,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `S4-B: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outBSg, r: rBSg, secs: sBSg } =
      renderSpec(dir, mediaDir, imgStatic0, "s4-img-static0-geq", ["--mask-mode", "geq"]);
    ok(rBSg.status === 0 && fs.existsSync(outBSg),
      `đối chiếu S4-B: render image tĩnh geq x=0.3 ra MP4 [${sBSg.toFixed(1)}s]`);
    if (rB.status === 0 && rBSg.status === 0) {
      const m = mad(framePng(outB, 2.0, dir, "s4b20b"), framePng(outBSg, 2.0, dir, "s4bsg20"));
      ok(m < 1, `S4-B: fallback geq image t=2.0 vs image tĩnh geq x=0.3: MAD=${m.toFixed(3)} < 1`);
    }
  }

  // ================= S4-C: image + keyframes, không shim (hồi quy) =================
  if (runSection("C")) {
    console.log("== S4-C: hồi quy image + keyframes, không shim ==");
    const { out: outC, r: rC, secs: sC } = renderSpec(dir, mediaDir, kfImgSpec, "s4-img-ok");
    if (rC.status !== 0) dump(rC);
    ok(rC.status === 0 && fs.existsSync(outC), `S4-C: render image keyframes bình thường ra MP4 [${sC.toFixed(1)}s]`);
    const outCAll = (rC.stdout || "") + (rC.stderr || "");
    ok(!/không vẽ được video mask/.test(outCAll), "S4-C: KHÔNG có warn fallback video mask");
    ok(!/mask keyframes:/.test(outCAll), "S4-C: KHÔNG có warn site 'mask keyframes:' khi render bình thường");
    ok(/mask anim/.test(rC.stdout || "") && /\.mkv/.test(rC.stdout || ""),
      "S4-C: log pre-pass 'mask anim' + video .mkv (đường video image hoạt động)");
    if (rC.status === 0) {
      for (const [t, ex, tag] of [[0.5, 0.35, "s4c05"], [2.0, 0.5, "s4c20"], [3.5, 0.65, "s4c35"]]) {
        const c = centroid(framePng(outC, t, dir, tag), 0);
        ok(Math.abs(c.x - ex) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `S4-C: t=${t} tâm mask image x=${c.x} y=${c.y} ≈ keyframes ${ex}`);
      }
    }
  }

  // ================= S4-D: keyframes, KHÔNG track, --mask-mode trackgeq =================
  if (runSection("D")) {
    console.log("== S4-D: keyframes, không track, --mask-mode trackgeq, shim cả 2 helper fail ==");
    const { out: outD, r: rD, secs: sD } =
      renderSpec(dir, mediaDir, kfSpec, "s4-tgeq-notrack-shim", ["--mask-mode", "trackgeq"], shimB);
    if (rD.status !== 0) dump(rD);
    ok(rD.status === 0 && fs.existsSync(outD), `S4-D: render trackgeq không track ra MP4 dù helper fail [${sD.toFixed(1)}s]`);
    const outDAll = (rD.stdout || "") + (rD.stderr || "");
    ok(/mask keyframes: --mask-mode trackgeq không chạy keyframes/.test(rD.stderr || ""),
      "S4-D: warn site 'mask keyframes: --mask-mode trackgeq không chạy keyframes → mask tĩnh tại t=0'");
    ok(!/không vẽ được video mask/.test(outDAll), "S4-D: KHÔNG warn 'không vẽ được video mask' (pre-pass bị bỏ qua)");
    ok(!/fallback PNG/.test(outDAll), "S4-D: KHÔNG log fallback PNG");
    ok(!/\.mkv/.test(rD.stdout || ""), "S4-D: không dùng video mask .mkv (pre-pass bị bỏ qua)");
    if (rD.status === 0) {
      for (const [t, tag] of [[0.5, "s4d05"], [2.0, "s4d20"], [3.5, "s4d35"]]) {
        const c = centroid(framePng(outD, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `S4-D: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5) — geq tĩnh tại hình học keyframes t=0`);
      }
    }
    const { out: outDref, r: rDref } =
      renderSpec(dir, mediaDir, kfStatic0, "s4-tgeq-notrack-ref", ["--mask-mode", "geq"]);
    ok(rDref.status === 0 && fs.existsSync(outDref), "đối chiếu S4-D: render mask tĩnh geq x=0.3 ra MP4");
    if (rD.status === 0 && rDref.status === 0) {
      const m = mad(framePng(outD, 2.0, dir, "s4d20b"), framePng(outDref, 2.0, dir, "s4d-ref20"));
      ok(m < 0.5, `S4-D: trackgeq không track t=2.0 vs mask tĩnh geq x=0.3: MAD=${m.toFixed(3)} < 0.5`);
    }
  }

  // ================= S4-E: keyframes CÓ track, --mask-mode trackgeq =================
  if (runSection("E")) {
    console.log("== S4-E: keyframes + track, --mask-mode trackgeq (track lái mask, O3) ==");
    const { out: outE, r: rE, secs: sE } =
      renderSpec(dir, mediaDir, kfTrackSpec, "s4-tgeq-track", ["--mask-mode", "trackgeq"]);
    if (rE.status !== 0) dump(rE);
    ok(rE.status === 0 && fs.existsSync(outE), `S4-E: render trackgeq có track ra MP4 [${sE.toFixed(1)}s]`);
    const outEAll = (rE.stdout || "") + (rE.stderr || "");
    ok(!/mask keyframes:/.test(outEAll),
      "S4-E: KHÔNG có warn site 'mask keyframes:' — track lái mask, keyframes bị bỏ qua theo thiết kế O3");
    ok(!/mask bám track:/.test(outEAll),
      "S4-E: KHÔNG có warn 'mask bám track:' (đường trackgeq không qua nhánh tracked png)");
    if (rE.status === 0) {
      // Track 0.35 → 0.65 trong 4s: t=1 → 0.425; t=2 → 0.5; t=3 → 0.575.
      for (const [t, ex, tag] of [[1.0, 0.425, "s4e10"], [2.0, 0.5, "s4e20"], [3.0, 0.575, "s4e30"]]) {
        const c = centroid(framePng(outE, t, dir, tag), 0);
        ok(Math.abs(c.x - ex) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `S4-E: t=${t} tâm mask x=${c.x} y=${c.y} ≈ track ${ex} (track lái, không phải keyframes)`);
      }
    }
  }

  // ================= S4-F: adjustment layer CẮT clip có mask keyframes -> fail fast =================
  if (runSection("F")) {
    console.log("== S4-F: adjustment layer cắt giữa clip có mask keyframes (cổng fail fast) ==");
    const cutLayer = [{ id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] }];
    const cutSpec = spec("s4-kf-cut", vtrack([vclip({ mask: maskKf })]), cutLayer);
    const { out: outF, r: rF, secs: sF } = renderSpec(dir, mediaDir, cutSpec, "s4-kf-cut");
    ok(rF.status !== 0, `S4-F: job FAIL (exit ${rF.status}) khi layer cắt clip có mask keyframes [${sF.toFixed(1)}s]`);
    ok(/adjustment layer cắt giữa clip có mask keyframes/.test(rF.stderr || ""),
      "S4-F: stderr chứa đúng thông điệp cổng fail fast 'adjustment layer cắt giữa clip có mask keyframes'");
    ok(countOcc(rF.stderr || "", /mask keyframes:/g) === 0,
      "S4-F: KHÔNG có warn site 'mask keyframes:' nào — job chết trước khi dựng graph, warn không thể lặp");
    ok(!fs.existsSync(outF), "S4-F: KHÔNG ra file MP4 (job chết trước khi encode)");
  }

  // ================= S4-G: adjustment layer BAO TRỌN clip có mask keyframes -> đúng 1 warn =================
  if (runSection("G")) {
    console.log("== S4-G: adjustment layer bao trọn clip có mask keyframes, shim cả 2 fail ==");
    const fullLayer = [{ id: "adj", start: 0, duration: 4, filters: [{ color: { brightness: 20 } }] }];
    const fullSpec = spec("s4-kf-full", vtrack([vclip({ mask: maskKf })]), fullLayer);
    const { out: outG, r: rG, secs: sG } = renderSpec(dir, mediaDir, fullSpec, "s4-kf-full", [], shimB);
    if (rG.status !== 0) dump(rG);
    ok(rG.status === 0 && fs.existsSync(outG), `S4-G: render clip bao trọn layer ra MP4 [${sG.toFixed(1)}s]`);
    ok(/mask keyframes: không vẽ được video mask \(xem log pre-pass\)/.test(rG.stderr || ""),
      "S4-G: warn site 'mask keyframes: không vẽ được video mask' có mặt");
    ok(countOcc(rG.stderr || "", /mask keyframes:/g) === 1,
      `S4-G: warn site 'mask keyframes:' xuất hiện ĐÚNG 1 lần (1 site = 1 đoạn, đếm được ${countOcc(rG.stderr || "", /mask keyframes:/g)})`);
    if (rG.status === 0) {
      const c = centroid(framePng(outG, 2.0, dir, "s4g20"), 0);
      ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
        `S4-G: t=2.0 tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5) — geq tĩnh t=0`);
    }
    // Đối chiếu: cùng layer bao trọn + mask tĩnh x=0.3 + --mask-mode geq
    // (layer brightness 20 áp cả 2 bên nên triệt tiêu trong MAD).
    const refSpec = spec("s4-kf-full-ref", vtrack([vclip({ mask: { ...mask, x: 0.3 } })]), fullLayer);
    const { out: outGref, r: rGref } =
      renderSpec(dir, mediaDir, refSpec, "s4-kf-full-ref", ["--mask-mode", "geq"]);
    ok(rGref.status === 0 && fs.existsSync(outGref), "đối chiếu S4-G: render tĩnh geq cùng layer ra MP4");
    if (rG.status === 0 && rGref.status === 0) {
      const m = mad(framePng(outG, 2.0, dir, "s4g20b"), framePng(outGref, 2.0, dir, "s4g-ref20"));
      ok(m < 1, `S4-G: fallback geq t=2.0 vs tĩnh geq cùng layer: MAD=${m.toFixed(3)} < 1`);
    }
  }

  // ================= S4-H: mask TĨNH bị adjustment layer cắt -> render, không warn =================
  if (runSection("H")) {
    console.log("== S4-H: mask tĩnh bị adjustment layer cắt thành 3 đoạn ==");
    const cutLayer = [{ id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] }];
    const staticCutSpec = spec("s4-static-cut", vtrack([vclip({ mask: { ...mask, x: 0.3 } })]), cutLayer);
    const { out: outH, r: rH, secs: sH } = renderSpec(dir, mediaDir, staticCutSpec, "s4-static-cut");
    if (rH.status !== 0) dump(rH);
    ok(rH.status === 0 && fs.existsSync(outH), `S4-H: render mask tĩnh bị cắt 3 đoạn ra MP4 [${sH.toFixed(1)}s]`);
    const outHAll = (rH.stdout || "") + (rH.stderr || "");
    ok(!/mask keyframes:/.test(outHAll),
      "S4-H: KHÔNG có warn 'mask keyframes:' — nhánh mask tĩnh không warn, tách đoạn không sinh warn lặp");
    ok(!/không vẽ được video mask/.test(outHAll),
      "S4-H: KHÔNG có warn fallback video mask (mask tĩnh không đi đường video)");
  }

  console.log(`\ntest_round91_s4_fallback_warn_ext [${[...SECTIONS].join(",")}]: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main();
