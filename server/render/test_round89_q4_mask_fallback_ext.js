/**
 * test_round89_q4_mask_fallback_ext.js — Ép fallback video-mask cho các case
 * còn thiếu sau P1 (Phase 9 đợt 89 Q4; nợ LIMITS gộp đợt 88 §4 mục 10).
 * Chạy: node test_round89_q4_mask_fallback_ext.js (từ server/render).
 * Chạy riêng 1 mảng: Q4_SECTIONS=D4|IMG|GEQ|INV|T240 (phẩy, vd "GEQ,INV").
 *
 * P1 đã ép fallback end-to-end cho clip video + track + mask, mode png mặc
 * định (30/30). File này mở rộng sang 4 case còn lại + đo giới hạn:
 *  D4  — mask keyframes (không track), video: mask_anim fail → PNG t=0;
 *        cả 2 fail → geq tĩnh t=0; hồi quy không shim → mask chạy theo
 *        keyframes. (Đường D4 dùng chung pre-pass với O2 nên P1 suy ra
 *        giống — nay đo thật.)
 *  IMG — image clip + track + mask: cùng 3 biến thể (PNG fallback / geq
 *        fallback / hồi quy). Image đi qua cùng pre-pass D4/O2 (track
 *        kind "image" được lọc vào vòng pre-pass) và site image
 *        (render.js:931) nên fallback phải hoạt động y hệt video.
 *  GEQ — --mask-mode geq: mode này BỎ QUA cả 2 pre-pass (R2 + D4) nên
 *        không có video-mask để fail; kiểm chứng shim fail cả 2 helper
 *        vẫn render đúng và pixel-identical với geq không shim (MAD=0),
 *        KHÔNG warn fallback nào — tức geq tĩnh chính là đường cuối, miễn
 *        nhiễm với lỗi helper vẽ mask. Lưu ý: mask geq "tĩnh" vẫn cưỡi
 *        theo shift D3 của clip có track (render.js ~900, O2 §2) nên tâm
 *        cuối trên canvas = vị trí track, không phải mask.x — hình học
 *        mask tĩnh theo clip, clip dịch theo track.
 *  INV — mask invert: tracked + invert, shim anim fail → PNG fallback t=0
 *        invert (trong ellipse đen, ngoài đỏ; centroid bù ≈ 0.52); cả 2
 *        fail → geq t=0 invert; keyframes + invert → PNG fallback t=0.
 *  T240 — track 240 điểm, --mask-mode trackgeq, 720p 4s: xác nhận lại fix
 *        cây if cân bằng của P4 trên cây hiện tại (trước fix: exit 2 từ
 *        83 điểm); tâm lệch ≤1px so với kỳ vọng; + 240 điểm mode png.
 *
 * Cách ép fail: shim `python3` trên PATH riêng của tiến trình render con
 * (mẫu P1 — chỉ fail khi argv chứa mask_anim.py / mask_png.py, còn lại
 * exec /usr/bin/python3 thật; KHÔNG sửa file thật).
 *
 * Chống sóng EPERM (đợt 89 Q4, xem LIMITS): VM này có sóng EPERM thoáng
 * qua ("Operation not permitted" khi ghi file) kéo dài 1–3 phút, đủ giết
 * test dài. Nên file này retry RỘNG mọi thao tác ghi file phụ (sinh nguồn,
 * trích frame: tới ~4 phút) và retry render CHỈ khi fail đúng vì EPERM
 * (tối đa 4 lần, ngủ 15/30/60s) — mọi lỗi khác trả về ngay để fail render
 * là dữ liệu. Lưu ý: Atomics.wait trả ngay 0ms trên VM này (futex bị
 * chặn?) nên backoff dùng spawnSync("sleep") thật.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const SECTIONS = new Set(
  (process.env.Q4_SECTIONS || "D4,IMG,GEQ,INV,T240").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
const runSection = (name) => SECTIONS.has(name);

function run(cmd, args, env) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env });
}

// Chạy lệnh có retry — sóng EPERM thoáng qua trên VM này có thể làm lệnh
// ghi file fail ("Operation not permitted") dù lệnh đúng; thử lại với
// backoff thay vì crash cả test (mẫu retry như writeFileEpermRetry).
// Cửa sổ retry RỘNG (tới ~4 phút): sóng EPERM đo được đợt này kéo dài
// 1–3 phút, cửa sổ 36s của bản đầu đã không đủ (chết 2 lần ở ffmpeg đầu).
// Chỉ dùng cho các lệnh TẠO file (sinh nguồn, trích frame).
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

// Render chính: CHỈ retry khi fail đúng vì EPERM ("Operation not
// permitted" trong output) — lỗi môi trường, không phải lỗi sản phẩm.
// Mọi lỗi khác (exit 2, lỗi filter, timeout...) trả về ngay, không retry,
// để fail render là dữ liệu và thấy rõ. Tối đa 4 lần chạy.
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
  // Trích frame bằng ffmpeg ghi file PNG xuống /tmp — sóng EPERM thoáng
  // qua có thể làm lệnh ghi fail dù render đã xong; thử lại với cửa sổ
  // rộng (~2,5 phút) thay vì crash cả test.
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

// Centroid theo pixel (dùng cho track 240 điểm — so lệch tuyệt đối theo px).
function centroidPx(png, chan, W, H) {
  const c = centroid(png, chan);
  return { x: c.x * W, y: c.y * H, n: c.n };
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

// Shim python3: fail đúng script được liệt kê, còn lại exec python3 thật.
function makeShim(dir, failScripts) {
  const shimDir = path.join(dir, "shim");
  fs.mkdirSync(shimDir, { recursive: true });
  const cases = failScripts.map((s) =>
    `    *${s}) echo "Q4-SHIM: simulated ${s} failure (fault injection, test only)" >&2; exit 1;;`
  ).join("\n");
  const script = `#!/bin/sh
# Q4 fault-injection shim (test_round89_q4): chỉ fail script được liệt kê.
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

// Cache media dùng chung ngoài repo (không stage): sinh 1 lần bằng ffmpeg,
// các lượt sau copy bằng node fs (đường ghi tin cậy nhất trên VM này).
// Cache hợp lệ = file tồn tại và > 0 byte (ffmpeg fail EPERM để lại file
// 0 byte — không bao giờ coi là cache hợp lệ).
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
  // Sinh ra file TẠM rồi rename vào cache khi thành công — KHÔNG ghi đè
  // trực tiếp lên cache: ffmpeg -y truncate file đích ngay khi mở, nên
  // regen fail vì EPERM sẽ phá luôn cache tốt (đã xảy ra 12:43Z).
  // File tạm PHẢI giữ đuôi .mp4/.png để ffmpeg đoán được output format.
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-q4-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };
  const dump = (r) => { console.error((r.stdout || "").slice(-800)); console.error((r.stderr || "").slice(-800)); };

  // Nguồn: video đỏ 1280x720 4s + ảnh đỏ 1280x720.
  // Đợt 89 Q4: cache media dùng chung (sinh 1 lần, các lượt sau copy bằng
  // node fs — đường ghi tin cậy nhất trên VM này) để lượt chạy không chết
  // ngay ở bước sinh nguồn khi sóng EPERM đang hoạt động.
  ensureMedia(mediaDir);

  const W = 1280, H = 720;
  const meta = { width: W, height: H, fps: 30, duration: 4 };
  const track = { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 4, x: 0.65, y: 0.5 }] };
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
  const iclip = (extra = {}) => ({
    kind: "image", id: "im1", src: "red.png", start: 0, duration: 4, ...extra,
  });
  const spec = (name, tracks) => ({ version: "0.2.0", meta: { name, ...meta }, tracks });
  const vtrack = (clips) => [{ id: "v1", kind: "video", clips }];
  const itrack = (clips) => [{ id: "i1", kind: "image", clips }];

  const shimA = makeShim(path.join(dir, "a"), ["mask_anim.py"]);
  const shimB = makeShim(path.join(dir, "b"), ["mask_anim.py", "mask_png.py"]);

  // Spec dùng chung các mảng (mỗi mảng tự render ref của mình).
  const kfSpec = spec("q4-kf", vtrack([vclip({ mask: maskKf })]));
  const kfStatic0 = spec("q4-kf-static0", vtrack([vclip({ mask: { ...mask, x: 0.3 } })]));
  const trackedSpec = spec("q4-tracked", vtrack([vclip({ mask, track })]));
  const imgTracked = spec("q4-img-tracked", itrack([iclip({ mask, track })]));
  const imgStatic0 = spec("q4-img-static0", itrack([iclip({ mask: { ...mask, x: 0.35 } })]));
  const invMask = { ...mask, invert: true };
  const invTracked = spec("q4-inv-tracked", vtrack([vclip({ mask: invMask, track })]));
  const invStatic035 = spec("q4-inv-static035", vtrack([vclip({ mask: { ...invMask, x: 0.35 } })]));
  const invKf = spec("q4-inv-kf", vtrack([vclip({ mask: { ...maskKf, invert: true } })]));
  const invStatic03 = spec("q4-inv-static03", vtrack([vclip({ mask: { ...invMask, x: 0.3 } })]));
  const pts240 = [];
  for (let i = 0; i < 240; i++) {
    pts240.push({ t: (4 * i) / 239, x: 0.275 + (0.45 * i) / 239, y: 0.5 });
  }
  const spec240 = spec("q4-track240", vtrack([vclip({ mask, track: { points: pts240 } })]));

  // ================= D4: mask keyframes (không track), video =================
  if (runSection("D4")) {
    console.log("== D4-A: keyframes, mask_anim fail -> PNG fallback t=0 (x=0.3) ==");
    const { out: outD4A, r: rD4A, secs: sD4A } = renderSpec(dir, mediaDir, kfSpec, "d4-fb-png", [], shimA);
    if (rD4A.status !== 0) dump(rD4A);
    ok(rD4A.status === 0 && fs.existsSync(outD4A), `D4-A: render ra MP4 (job không fail) [${sD4A.toFixed(1)}s]`);
    ok(/mask anim/.test(rD4A.stderr || "") && /không vẽ được video mask/.test(rD4A.stderr || "") &&
      /thử PNG tĩnh tại t=0/.test(rD4A.stderr || ""),
      "D4-A: warn pre-pass 'mask anim ... không vẽ được video mask → thử PNG tĩnh tại t=0'");
    ok(/mask anim fallback PNG t=0/.test(rD4A.stdout || ""), "D4-A: log 'mask anim fallback PNG t=0'");
    ok(!/PNG fallback cũng thất bại/.test((rD4A.stdout || "") + (rD4A.stderr || "")),
      "D4-A: KHÔNG có warn 'PNG fallback cũng thất bại'");
    ok(!/\.mkv/.test(rD4A.stdout || ""), "D4-A: không dùng video mask .mkv (đường video đã fail)");
    if (rD4A.status === 0) {
      for (const [t, tag] of [[0.5, "d4a05"], [2.0, "d4a20"], [3.5, "d4a35"]]) {
        const c = centroid(framePng(outD4A, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `D4-A: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5) — tĩnh tại t=0, không chạy keyframes`);
      }
      const ctr = probe(outD4A, 2.0, 384, 360, dir, "d4a-ctr"); // tâm t=0: x=0.3*1280
      const outX = probe(outD4A, 2.0, 700, 360, dir, "d4a-outx");
      ok(isRed(ctr), `D4-A: tâm fallback (384,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `D4-A: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outD4S, r: rD4S } = renderSpec(dir, mediaDir, kfStatic0, "d4-static0");
    ok(rD4S.status === 0 && fs.existsSync(outD4S), "đối chiếu D4-A: render mask tĩnh x=0.3 ra MP4");
    if (rD4A.status === 0 && rD4S.status === 0) {
      const m = mad(framePng(outD4A, 2.0, dir, "d4a20b"), framePng(outD4S, 2.0, dir, "d4s20"));
      ok(m < 1, `D4-A: fallback PNG t=2.0 vs mask tĩnh x=0.3: MAD=${m.toFixed(3)} < 1`);
    }

    console.log("== D4-B: keyframes, mask_anim + mask_png fail -> geq tĩnh t=0 ==");
    const { out: outD4B, r: rD4B, secs: sD4B } = renderSpec(dir, mediaDir, kfSpec, "d4-fb-geq", [], shimB);
    if (rD4B.status !== 0) dump(rD4B);
    ok(rD4B.status === 0 && fs.existsSync(outD4B), `D4-B: render ra MP4 (job không fail) [${sD4B.toFixed(1)}s]`);
    ok(/PNG fallback cũng thất bại → geq tĩnh tại t=0/.test(rD4B.stderr || ""),
      "D4-B: warn pre-pass 'PNG fallback cũng thất bại → geq tĩnh tại t=0'");
    if (rD4B.status === 0) {
      for (const [t, tag] of [[0.5, "d4b05"], [2.0, "d4b20"], [3.5, "d4b35"]]) {
        const c = centroid(framePng(outD4B, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `D4-B: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5)`);
      }
      const ctr = probe(outD4B, 2.0, 384, 360, dir, "d4b-ctr");
      const outX = probe(outD4B, 2.0, 700, 360, dir, "d4b-outx");
      ok(isRed(ctr), `D4-B: tâm fallback (384,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `D4-B: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outD4Sg, r: rD4Sg, secs: sD4Sg } =
      renderSpec(dir, mediaDir, kfStatic0, "d4-static0-geq", ["--mask-mode", "geq"]);
    ok(rD4Sg.status === 0 && fs.existsSync(outD4Sg),
      `đối chiếu D4-B: render mask tĩnh geq x=0.3 ra MP4 [${sD4Sg.toFixed(1)}s]`);
    if (rD4B.status === 0 && rD4Sg.status === 0) {
      const m = mad(framePng(outD4B, 2.0, dir, "d4b20b"), framePng(outD4Sg, 2.0, dir, "d4sg20"));
      ok(m < 1, `D4-B: fallback geq t=2.0 vs mask tĩnh geq x=0.3: MAD=${m.toFixed(3)} < 1`);
    }

    console.log("== D4-C: hồi quy keyframes, không shim ==");
    const { out: outD4C, r: rD4C, secs: sD4C } = renderSpec(dir, mediaDir, kfSpec, "d4-ok");
    if (rD4C.status !== 0) dump(rD4C);
    ok(rD4C.status === 0 && fs.existsSync(outD4C), `D4-C: render keyframes bình thường ra MP4 [${sD4C.toFixed(1)}s]`);
    const outD4CAll = (rD4C.stdout || "") + (rD4C.stderr || "");
    ok(!/không vẽ được video mask/.test(outD4CAll), "D4-C: KHÔNG có warn fallback video mask");
    ok(/mask anim/.test(rD4C.stdout || "") && /\.mkv/.test(rD4C.stdout || ""),
      "D4-C: log pre-pass 'mask anim' + video .mkv (đường video hoạt động)");
    if (rD4C.status === 0) {
      for (const [t, ex, tag] of [[0.5, 0.35, "d4c05"], [2.0, 0.5, "d4c20"], [3.5, 0.65, "d4c35"]]) {
        const c = centroid(framePng(outD4C, t, dir, tag), 0);
        ok(Math.abs(c.x - ex) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `D4-C: t=${t} tâm mask x=${c.x} y=${c.y} ≈ keyframes ${ex}`);
      }
    }
  }

  // ================= IMG: image clip + track + mask =================
  if (runSection("IMG")) {
    console.log("== IMG-A: image+track, mask_anim fail -> PNG fallback t=0 (x=0.35) ==");
    const { out: outIA, r: rIA, secs: sIA } = renderSpec(dir, mediaDir, imgTracked, "img-fb-png", [], shimA);
    if (rIA.status !== 0) dump(rIA);
    ok(rIA.status === 0 && fs.existsSync(outIA), `IMG-A: render ra MP4 (job không fail) [${sIA.toFixed(1)}s]`);
    ok(/mask track/.test(rIA.stderr || "") && /không vẽ được video mask/.test(rIA.stderr || "") &&
      /thử PNG tĩnh tại t=0/.test(rIA.stderr || ""),
      "IMG-A: warn pre-pass 'mask track ... không vẽ được video mask → thử PNG tĩnh tại t=0'");
    ok(/mask track fallback PNG t=0/.test(rIA.stdout || ""), "IMG-A: log 'mask track fallback PNG t=0'");
    ok(!/PNG fallback cũng thất bại/.test((rIA.stdout || "") + (rIA.stderr || "")),
      "IMG-A: KHÔNG có warn 'PNG fallback cũng thất bại'");
    ok(!/\.mkv/.test(rIA.stdout || ""), "IMG-A: không dùng video mask .mkv (đường video đã fail)");
    if (rIA.status === 0) {
      for (const [t, tag] of [[0.5, "ia05"], [2.0, "ia20"], [3.5, "ia35"]]) {
        const c = centroid(framePng(outIA, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.35) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `IMG-A: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.35, 0.5) — tĩnh tại t=0`);
      }
      const ctr = probe(outIA, 2.0, 448, 360, dir, "ia-ctr");
      const outX = probe(outIA, 2.0, 700, 360, dir, "ia-outx");
      ok(isRed(ctr), `IMG-A: tâm fallback (448,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `IMG-A: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outIS, r: rIS } = renderSpec(dir, mediaDir, imgStatic0, "img-static0");
    ok(rIS.status === 0 && fs.existsSync(outIS), "đối chiếu IMG-A: render image mask tĩnh x=0.35 ra MP4");
    if (rIA.status === 0 && rIS.status === 0) {
      const m = mad(framePng(outIA, 2.0, dir, "ia20b"), framePng(outIS, 2.0, dir, "is20"));
      ok(m < 1, `IMG-A: fallback PNG t=2.0 vs image mask tĩnh x=0.35: MAD=${m.toFixed(3)} < 1`);
    }

    console.log("== IMG-B: image+track, mask_anim + mask_png fail -> geq tĩnh t=0 ==");
    const { out: outIB, r: rIB, secs: sIB } = renderSpec(dir, mediaDir, imgTracked, "img-fb-geq", [], shimB);
    if (rIB.status !== 0) dump(rIB);
    ok(rIB.status === 0 && fs.existsSync(outIB), `IMG-B: render ra MP4 (job không fail) [${sIB.toFixed(1)}s]`);
    ok(/PNG fallback cũng thất bại → geq tĩnh tại t=0/.test(rIB.stderr || ""),
      "IMG-B: warn pre-pass 'PNG fallback cũng thất bại → geq tĩnh tại t=0'");
    ok(/mask bám track: không vẽ được video mask \(xem log pre-pass\)/.test(rIB.stderr || ""),
      "IMG-B: warn site 'mask bám track: không vẽ được video mask (xem log pre-pass)'");
    if (rIB.status === 0) {
      for (const [t, tag] of [[0.5, "ib05"], [2.0, "ib20"], [3.5, "ib35"]]) {
        const c = centroid(framePng(outIB, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.35) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `IMG-B: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.35, 0.5)`);
      }
      const ctr = probe(outIB, 2.0, 448, 360, dir, "ib-ctr");
      const outX = probe(outIB, 2.0, 700, 360, dir, "ib-outx");
      ok(isRed(ctr), `IMG-B: tâm fallback (448,360) đỏ: [${ctr}]`);
      ok(isBlack(outX), `IMG-B: ngoài ellipse phải (700,360) đen: [${outX}]`);
    }
    const { out: outISg, r: rISg, secs: sISg } =
      renderSpec(dir, mediaDir, imgStatic0, "img-static0-geq", ["--mask-mode", "geq"]);
    ok(rISg.status === 0 && fs.existsSync(outISg),
      `đối chiếu IMG-B: render image mask tĩnh geq x=0.35 ra MP4 [${sISg.toFixed(1)}s]`);
    if (rIB.status === 0 && rISg.status === 0) {
      const m = mad(framePng(outIB, 2.0, dir, "ib20b"), framePng(outISg, 2.0, dir, "isg20"));
      ok(m < 1, `IMG-B: fallback geq t=2.0 vs image mask tĩnh geq x=0.35: MAD=${m.toFixed(3)} < 1`);
    }

    console.log("== IMG-C: hồi quy image+track, không shim ==");
    const { out: outIC, r: rIC, secs: sIC } = renderSpec(dir, mediaDir, imgTracked, "img-ok");
    if (rIC.status !== 0) dump(rIC);
    ok(rIC.status === 0 && fs.existsSync(outIC), `IMG-C: render image+track bình thường ra MP4 [${sIC.toFixed(1)}s]`);
    const outICAll = (rIC.stdout || "") + (rIC.stderr || "");
    ok(!/không vẽ được video mask/.test(outICAll), "IMG-C: KHÔNG có warn fallback video mask");
    ok(/mask track/.test(rIC.stdout || "") && /\.mkv/.test(rIC.stdout || ""),
      "IMG-C: log pre-pass 'mask track' + video .mkv (đường video hoạt động cho image)");
    if (rIC.status === 0) {
      for (const [t, ex, tag] of [[0.5, 0.3875, "ic05"], [2.0, 0.5, "ic20"], [3.5, 0.6125, "ic35"]]) {
        const c = centroid(framePng(outIC, t, dir, tag), 0);
        ok(Math.abs(c.x - ex) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `IMG-C: t=${t} tâm mask x=${c.x} y=${c.y} ≈ track ${ex} — image mask bám track`);
      }
    }
  }

  // ================= GEQ: --mask-mode geq miễn nhiễm helper fail =================
  if (runSection("GEQ")) {
    console.log("== GEQ-A: tracked + --mask-mode geq, shim cả 2 helper fail ==");
    const { out: outGA, r: rGA, secs: sGA } =
      renderSpec(dir, mediaDir, trackedSpec, "geq-tracked-shim", ["--mask-mode", "geq"], shimB);
    if (rGA.status !== 0) dump(rGA);
    ok(rGA.status === 0 && fs.existsSync(outGA), `GEQ-A: render geq ra MP4 dù helper fail [${sGA.toFixed(1)}s]`);
    const outGAAll = (rGA.stdout || "") + (rGA.stderr || "");
    ok(!/không vẽ được video mask/.test(outGAAll), "GEQ-A: KHÔNG warn 'không vẽ được video mask'");
    ok(!/fallback PNG/.test(outGAAll), "GEQ-A: KHÔNG log fallback PNG");
    ok(!/PNG fallback cũng thất bại/.test(outGAAll), "GEQ-A: KHÔNG warn 'PNG fallback cũng thất bại'");
    ok(!/\.mkv/.test(rGA.stdout || ""), "GEQ-A: không dùng video mask .mkv (pre-pass bị bỏ qua)");
    if (rGA.status === 0) {
      // Mask geq tĩnh tại hình học gốc (mask.x=0.5) NHƯNG cưỡi theo shift
      // D3 của clip có track (render.js ~900, O2 §2) nên tâm cuối trên
      // canvas = vị trí track: 0.3875 / 0.5 / 0.6125 — KHÔNG phải 0.5 tĩnh.
      for (const [t, ex, tag] of [[0.5, 0.3875, "ga05"], [2.0, 0.5, "ga20"], [3.5, 0.6125, "ga35"]]) {
        const c = centroid(framePng(outGA, t, dir, tag), 0);
        ok(Math.abs(c.x - ex) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `GEQ-A: t=${t} tâm mask x=${c.x} y=${c.y} ≈ track ${ex} — mask tĩnh cưỡi theo shift D3`);
      }
    }
    const { out: outGAn, r: rGAn, secs: sGAn } =
      renderSpec(dir, mediaDir, trackedSpec, "geq-tracked-noshim", ["--mask-mode", "geq"]);
    ok(rGAn.status === 0 && fs.existsSync(outGAn), `đối chiếu GEQ-A: render geq không shim ra MP4 [${sGAn.toFixed(1)}s]`);
    if (rGA.status === 0 && rGAn.status === 0) {
      const m = mad(framePng(outGA, 2.0, dir, "ga20b"), framePng(outGAn, 2.0, dir, "gan20"));
      ok(m < 0.5, `GEQ-A: geq shim-fail t=2.0 vs geq không shim: MAD=${m.toFixed(3)} < 0.5 (miễn nhiễm helper fail)`);
    }

    console.log("== GEQ-B: keyframes + --mask-mode geq, shim cả 2 helper fail ==");
    const { out: outGB, r: rGB, secs: sGB } =
      renderSpec(dir, mediaDir, kfSpec, "geq-kf-shim", ["--mask-mode", "geq"], shimB);
    if (rGB.status !== 0) dump(rGB);
    ok(rGB.status === 0 && fs.existsSync(outGB), `GEQ-B: render geq keyframes ra MP4 dù helper fail [${sGB.toFixed(1)}s]`);
    const outGBAll = (rGB.stdout || "") + (rGB.stderr || "");
    ok(!/không vẽ được video mask/.test(outGBAll), "GEQ-B: KHÔNG warn 'không vẽ được video mask'");
    ok(!/fallback PNG/.test(outGBAll), "GEQ-B: KHÔNG log fallback PNG");
    ok(!/\.mkv/.test(rGB.stdout || ""), "GEQ-B: không dùng video mask .mkv (pre-pass bị bỏ qua)");
    if (rGB.status === 0) {
      for (const [t, tag] of [[0.5, "gb05"], [2.0, "gb20"], [3.5, "gb35"]]) {
        const c = centroid(framePng(outGB, t, dir, tag), 0);
        ok(Math.abs(c.x - 0.3) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `GEQ-B: t=${t} tâm mask x=${c.x} y=${c.y} ≈ (0.3, 0.5) — geq tĩnh tại hình học keyframes t=0`);
      }
    }
    // Đối chiếu riêng trong mảng GEQ (không phụ thuộc mảng D4): mask tĩnh geq x=0.3.
    const { out: outGBref, r: rGBref } =
      renderSpec(dir, mediaDir, kfStatic0, "geq-kf-ref", ["--mask-mode", "geq"]);
    ok(rGBref.status === 0 && fs.existsSync(outGBref), "đối chiếu GEQ-B: render mask tĩnh geq x=0.3 ra MP4");
    if (rGB.status === 0 && rGBref.status === 0) {
      const m = mad(framePng(outGB, 2.0, dir, "gb20b"), framePng(outGBref, 2.0, dir, "gb-ref20"));
      ok(m < 0.5, `GEQ-B: geq keyframes shim-fail t=2.0 vs mask tĩnh geq x=0.3: MAD=${m.toFixed(3)} < 0.5`);
    }
  }

  // ================= INV: mask invert =================
  if (runSection("INV")) {
    // Ellipse x=0.35, w=0.3 h=0.5: diện tích π*0.15*0.25 ≈ 0.1178 khung.
    // Centroid vùng đỏ (phần bù) kỳ vọng x = (0.5 − 0.1178*0.35)/0.8822 ≈ 0.52, y = 0.5.
    console.log("== INV-A: tracked + invert, mask_anim fail -> PNG fallback t=0 invert ==");
    const { out: outVA, r: rVA, secs: sVA } = renderSpec(dir, mediaDir, invTracked, "inv-fb-png", [], shimA);
    if (rVA.status !== 0) dump(rVA);
    ok(rVA.status === 0 && fs.existsSync(outVA), `INV-A: render ra MP4 (job không fail) [${sVA.toFixed(1)}s]`);
    ok(/mask track fallback PNG t=0/.test(rVA.stdout || ""), "INV-A: log 'mask track fallback PNG t=0'");
    if (rVA.status === 0) {
      const c = centroid(framePng(outVA, 2.0, dir, "va20"), 0);
      ok(Math.abs(c.x - 0.52) < 0.02 && Math.abs(c.y - 0.5) < 0.01,
        `INV-A: t=2.0 centroid vùng đỏ x=${c.x} y=${c.y} ≈ (0.52, 0.5) — phần bù của ellipse t=0`);
      const ctr = probe(outVA, 2.0, 448, 360, dir, "va-ctr");
      const outL = probe(outVA, 2.0, 100, 360, dir, "va-outl");
      const outT = probe(outVA, 2.0, 448, 100, dir, "va-outt");
      const outR = probe(outVA, 2.0, 700, 360, dir, "va-outr");
      ok(isBlack(ctr), `INV-A: trong ellipse (448,360) đen (invert che trong): [${ctr}]`);
      ok(isRed(outL), `INV-A: ngoài ellipse trái (100,360) đỏ: [${outL}]`);
      ok(isRed(outT), `INV-A: ngoài ellipse trên (448,100) đỏ: [${outT}]`);
      ok(isRed(outR), `INV-A: ngoài ellipse phải (700,360) đỏ: [${outR}]`);
    }
    const { out: outVS, r: rVS } = renderSpec(dir, mediaDir, invStatic035, "inv-static035");
    ok(rVS.status === 0 && fs.existsSync(outVS), "đối chiếu INV-A: render invert tĩnh x=0.35 ra MP4");
    if (rVA.status === 0 && rVS.status === 0) {
      const m = mad(framePng(outVA, 2.0, dir, "va20b"), framePng(outVS, 2.0, dir, "vs20"));
      ok(m < 1, `INV-A: fallback PNG invert t=2.0 vs invert tĩnh x=0.35: MAD=${m.toFixed(3)} < 1`);
    }

    console.log("== INV-B: tracked + invert, cả 2 helper fail -> geq tĩnh t=0 invert ==");
    const { out: outVB, r: rVB, secs: sVB } = renderSpec(dir, mediaDir, invTracked, "inv-fb-geq", [], shimB);
    if (rVB.status !== 0) dump(rVB);
    ok(rVB.status === 0 && fs.existsSync(outVB), `INV-B: render ra MP4 (job không fail) [${sVB.toFixed(1)}s]`);
    ok(/PNG fallback cũng thất bại → geq tĩnh tại t=0/.test(rVB.stderr || ""),
      "INV-B: warn pre-pass 'PNG fallback cũng thất bại → geq tĩnh tại t=0'");
    if (rVB.status === 0) {
      const c = centroid(framePng(outVB, 2.0, dir, "vb20"), 0);
      ok(Math.abs(c.x - 0.52) < 0.02 && Math.abs(c.y - 0.5) < 0.01,
        `INV-B: t=2.0 centroid vùng đỏ x=${c.x} y=${c.y} ≈ (0.52, 0.5)`);
      const ctr = probe(outVB, 2.0, 448, 360, dir, "vb-ctr");
      const outL = probe(outVB, 2.0, 100, 360, dir, "vb-outl");
      ok(isBlack(ctr), `INV-B: trong ellipse (448,360) đen: [${ctr}]`);
      ok(isRed(outL), `INV-B: ngoài ellipse trái (100,360) đỏ: [${outL}]`);
    }
    const { out: outVSg, r: rVSg, secs: sVSg } =
      renderSpec(dir, mediaDir, invStatic035, "inv-static035-geq", ["--mask-mode", "geq"]);
    ok(rVSg.status === 0 && fs.existsSync(outVSg),
      `đối chiếu INV-B: render invert tĩnh geq x=0.35 ra MP4 [${sVSg.toFixed(1)}s]`);
    if (rVB.status === 0 && rVSg.status === 0) {
      const m = mad(framePng(outVB, 2.0, dir, "vb20b"), framePng(outVSg, 2.0, dir, "vsg20"));
      ok(m < 1, `INV-B: fallback geq invert t=2.0 vs invert tĩnh geq x=0.35: MAD=${m.toFixed(3)} < 1`);
    }

    console.log("== INV-D4-A: keyframes + invert, mask_anim fail -> PNG fallback t=0 invert ==");
    // Phần bù ellipse x=0.3: centroid x = (0.5 − 0.1178*0.3)/0.8822 ≈ 0.527.
    const { out: outVDA, r: rVDA, secs: sVDA } = renderSpec(dir, mediaDir, invKf, "invkf-fb-png", [], shimA);
    if (rVDA.status !== 0) dump(rVDA);
    ok(rVDA.status === 0 && fs.existsSync(outVDA), `INV-D4-A: render ra MP4 (job không fail) [${sVDA.toFixed(1)}s]`);
    ok(/mask anim/.test(rVDA.stderr || "") && /không vẽ được video mask/.test(rVDA.stderr || ""),
      "INV-D4-A: warn pre-pass 'mask anim ... không vẽ được video mask'");
    if (rVDA.status === 0) {
      const c = centroid(framePng(outVDA, 2.0, dir, "vda20"), 0);
      ok(Math.abs(c.x - 0.527) < 0.02 && Math.abs(c.y - 0.5) < 0.01,
        `INV-D4-A: t=2.0 centroid vùng đỏ x=${c.x} y=${c.y} ≈ (0.527, 0.5) — phần bù ellipse t=0`);
      const ctr = probe(outVDA, 2.0, 384, 360, dir, "vda-ctr");
      const outL = probe(outVDA, 2.0, 100, 360, dir, "vda-outl");
      ok(isBlack(ctr), `INV-D4-A: trong ellipse (384,360) đen: [${ctr}]`);
      ok(isRed(outL), `INV-D4-A: ngoài ellipse trái (100,360) đỏ: [${outL}]`);
    }
    const { out: outVDS, r: rVDS } = renderSpec(dir, mediaDir, invStatic03, "invkf-static03");
    ok(rVDS.status === 0 && fs.existsSync(outVDS), "đối chiếu INV-D4-A: render invert tĩnh x=0.3 ra MP4");
    if (rVDA.status === 0 && rVDS.status === 0) {
      const m = mad(framePng(outVDA, 2.0, dir, "vda20b"), framePng(outVDS, 2.0, dir, "vds20"));
      ok(m < 1, `INV-D4-A: fallback PNG invert t=2.0 vs invert tĩnh x=0.3: MAD=${m.toFixed(3)} < 1`);
    }
  }

  // ================= T240: track 240 điểm (xác nhận lại fix P4) =================
  if (runSection("T240")) {
    console.log("== 240PT: track 240 điểm, --mask-mode trackgeq (xác nhận lại P4) ==");
    // t=0.5 → x=0.33125 (424px); t=2.0 → 0.5 (640px); t=3.5 → 0.66875 (856px).
    const { out: out240, r: r240, secs: s240, lastSecs: ls240 } =
      renderSpec(dir, mediaDir, spec240, "track240-geq", ["--mask-mode", "trackgeq"]);
    if (r240.status !== 0) dump(r240);
    ok(r240.status === 0 && fs.existsSync(out240),
      `240PT-geq: render 240 điểm trackgeq ra MP4 (trước fix P4: exit 2 từ 83 điểm) [${ls240.toFixed(1)}s, ${(120 / ls240).toFixed(2)} fps]`);
    if (r240.status === 0) {
      for (const [t, exPx, tag] of [[0.5, 424, "t240-05"], [2.0, 640, "t240-20"], [3.5, 856, "t240-35"]]) {
        const c = centroidPx(framePng(out240, t, dir, tag), 0, W, H);
        const dev = Math.abs(c.x - exPx);
        ok(dev <= 1.0, `240PT-geq: t=${t} tâm mask x=${c.x.toFixed(1)}px vs kỳ vọng ${exPx}px (lệch ${dev.toFixed(2)}px ≤ 1px)`);
        console.log(`    (240PT-geq t=${t}: tâm đo ${c.x.toFixed(2)}px, kỳ vọng ${exPx}px, lệch ${dev.toFixed(2)}px)`);
      }
    }

    console.log("== 240PT-png: track 240 điểm, mode png mặc định ==");
    const { out: out240p, r: r240p, secs: s240p, lastSecs: ls240p } = renderSpec(dir, mediaDir, spec240, "track240-png");
    if (r240p.status !== 0) dump(r240p);
    ok(r240p.status === 0 && fs.existsSync(out240p),
      `240PT-png: render 240 điểm mode png ra MP4 [${ls240p.toFixed(1)}s, ${(120 / ls240p).toFixed(2)} fps]`);
    if (r240p.status === 0) {
      for (const [t, ex, tag] of [[0.5, 0.33125, "t240p05"], [2.0, 0.5, "t240p20"], [3.5, 0.66875, "t240p35"]]) {
        const c = centroid(framePng(out240p, t, dir, tag), 0);
        ok(Math.abs(c.x - ex) < 0.01 && Math.abs(c.y - 0.5) < 0.01,
          `240PT-png: t=${t} tâm mask x=${c.x} y=${c.y} ≈ track ${ex}`);
      }
    }
  }

  console.log(`\ntest_round89_q4_mask_fallback_ext [${[...SECTIONS].join(",")}]: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main();
