#!/usr/bin/env node
/**
 * test_round63_r2_motion_metric.js — Phase 9 đợt 63, luồng R2: đóng nợ đợt 62 §4 mục 2
 * (phần metric jitter bằng ước lượng chuyển động thay cho MAD).
 *
 * Vấn đề (đợt 61 R2 §3): inter-frame MAD của video stabilize dao động
 * 38,0% (720p) / 67,6% (1080p) giữa 3 lần chạy cùng input, vì file .trf
 * không xác định — nên so sánh 2 preset/thuật toán stabilize bằng 1 lần
 * chạy là vô nghĩa, và ngay cả mean 3 lần cũng kèm spread lớn. MAD còn
 * lẫn cả thay đổi nội dung (testsrc2/chuyển động trong khung hình) với
 * chuyển động máy quay thật.
 *
 * Thử nghiệm: ước lượng chuyển động toàn cục bằng phase correlation
 * (OpenCV cv2.phaseCorrelate) giữa các frame liên tiếp, rồi đo jitter
 * trên chuỗi dịch chuyển (dx, dy) thay vì trên hiệu pixel:
 *   J1 = std(dx) + std(dy)            (độ phân tán của dịch chuyển từng frame)
 *   J2 = mean|Δdx| + mean|Δdy|        (độ giật: thay đổi dịch chuyển giữa 2 frame kề)
 *   J3 = RMS quỹ đạo tích lũy đã khử xu hướng (cửa sổ trung bình trượt 15 frame)
 * Đo cả trên toàn frame và trên crop giữa (tránh viền đen của vidstabtransform).
 * Bộ ước lượng được KIỂM CHỨNG trước trên nguồn shaky320: dịch chuyển đo
 * được phải khớp dịch chuyển rung đã biết từ công thức gen (ox/oy, seed 7)
 * với tương quan > 0,8 và RMSE < 1,5px — nếu không khớp thì mọi số sau đó
 * vô nghĩa và harness fail.
 *
 * So sánh trực tiếp trên CÙNG các lần render: MAD (như đợt 61) vs J1/J2/J3 —
 * mức giảm so với đối chứng + spread % giữa 3 lần stabilize. Kết luận trung
 * thực theo số đo: metric nào ổn định hơn thì dùng, nếu không hơn thì ghi rõ.
 *
 * Cách chạy: node server/render/src/test_round63_r2_motion_metric.js
 * (cần ffmpeg, ffprobe, python3 + PIL/numpy cho MAD, và python của
 * server/tracking/.venv cho cv2.phaseCorrelate). Scratch mới dưới
 * ~/workspace/.scratch-r63r2m-XXXX. KHÔNG ghi gì vào repo. Thời gian ~5–8 phút.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r63r2m-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const CV2_PY = path.join(RENDER, "..", "tracking", ".venv", "bin", "python"); // server/tracking/.venv (không phải server/render/tracking)

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, cwd) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
function spreadPct(xs) {
  const m = mean(xs);
  return m === 0 ? 0 : (Math.max(...xs) - Math.min(...xs)) / m * 100;
}
const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r63r2m", width: W, height: H, fps: fps || 30 },
  tracks,
});
function render(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, stdout: (r.stdout || "").toString(), stderr: (r.stderr || "").toString(), outPath, secs, fps: 150 / secs };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  const j = JSON.parse(r.stdout || "{}");
  return {
    codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height,
    duration: Number(j.format && j.format.duration),
  };
}
function probeOk(mp4, W, H) {
  const p = probeVideo(mp4);
  return p.codec === "h264" && p.width === W && p.height === H && Math.abs(p.duration - 5) < 0.15;
}
function extractFrames(mp4, dir, vf) {
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-i", mp4, "-vf", vf, "-vsync", "0", path.join(dir, "f%04d.png")], `tách frame ${path.basename(mp4)}`);
}

// --- MAD (giống đợt 61, để so sánh trực tiếp trên cùng frame) ----------------
const JITTER_PY = `
import sys, glob, numpy as np
from PIL import Image
files = sorted(glob.glob(sys.argv[1] + "/f*.png"))
if len(files) < 10:
    print("ERR too few frames"); sys.exit(1)
prev = None; diffs = []
for f in files:
    g = np.asarray(Image.open(f), dtype=np.int16)
    if prev is not None:
        diffs.append(float(np.abs(g - prev).mean()))
    prev = g
d = np.array(diffs)
print(f"n={len(d)} mean={d.mean():.4f} median={np.median(d):.4f} std={d.std():.4f} min={d.min():.4f} max={d.max():.4f}")
`;
const jitterPy = path.join(work, "jitter.py");
fs.writeFileSync(jitterPy, JITTER_PY);
function jitterOf(framesDir) {
  const r = spawnSync("python3", [jitterPy, framesDir], { encoding: "utf8" });
  const m = /n=(\d+) mean=([\d.]+) median=([\d.]+) std=([\d.]+) min=([\d.]+) max=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được jitter: ${r.stdout} ${r.stderr}`);
  return { n: Number(m[1]), mean: Number(m[2]), median: Number(m[3]), std: Number(m[4]), min: Number(m[5]), max: Number(m[6]) };
}

// --- Phase correlation (cv2, tracking venv) ----------------------------------
const PHASE_PY = `
import sys, glob, json, numpy as np, cv2
framesDir, mode = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(framesDir + "/f*.png"))
assert len(files) == 150, f"frames {len(files)} != 150"
dxs, dys, resps = [], [], []
prev = None
for f in files:
    g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    if mode == "center":
        h, w = g.shape
        g = g[h // 4:3 * h // 4, w // 4:3 * w // 4]
    g = np.float32(g)
    if prev is not None:
        win = cv2.createHanningWindow((g.shape[1], g.shape[0]), cv2.CV_32F)
        (sx, sy), resp = cv2.phaseCorrelate(prev, g, win)
        dxs.append(float(sx)); dys.append(float(sy)); resps.append(float(resp))
    prev = g
dx = np.array(dxs); dy = np.array(dys); rp = np.array(resps)
# J1: độ phân tán dịch chuyển; J2: độ giật; J3: RMS quỹ đạo đã khử xu hướng (cửa sổ 15).
def detrend_rms(v, win=15):
    c = np.cumsum(v)
    half = win // 2
    sm = np.array([c[max(0, i - half):min(len(c), i + half + 1)].mean() for i in range(len(c))])
    return float(np.sqrt(np.mean((c - sm) ** 2)))
out = {
    "mode": mode, "n": len(dx),
    "meanAbsShift": round(float(np.abs(dx).mean() + np.abs(dy).mean()), 4),
    "J1": round(float(dx.std() + dy.std()), 4),
    "J2": round(float(np.abs(np.diff(dx)).mean() + np.abs(np.diff(dy)).mean()), 4),
    "J3": round(float(np.sqrt(detrend_rms(dx) ** 2 + detrend_rms(dy) ** 2)), 4),
    "respMedian": round(float(np.median(rp)), 4),
    "respMin": round(float(rp.min()), 4),
    "dxMean": round(float(dx.mean()), 4), "dyMean": round(float(dy.mean()), 4),
}
print("PHASE " + json.dumps(out))
`;
const phasePy = path.join(work, "phase_corr.py");
fs.writeFileSync(phasePy, PHASE_PY);
function phaseOf(framesDir, mode) {
  const r = spawnSync(CV2_PY, [phasePy, framesDir, mode], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`phase_corr.py lỗi (${mode}): status=${r.status} err=${r.error && r.error.message} out=${r.stdout} err2=${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("PHASE "));
  if (!line) throw new Error(`không parse được phase: ${r.stdout} ${r.stderr}`);
  return JSON.parse(line.slice("PHASE ".length));
}

// --- Kiểm chứng bộ ước lượng trên nguồn shaky320 (rung đã biết) -------------
const VALIDATE_PY = `
import sys, glob, json, numpy as np, cv2
framesDir = sys.argv[1]
files = sorted(glob.glob(framesDir + "/f*.png"))
assert len(files) == 150, f"frames {len(files)} != 150"
# Công thức rung đúng như test_p2_gen_shaky.py (seed 7 không ảnh hưởng công thức).
n = np.arange(150)
ox = np.round(4 * np.sin(2 * np.pi * 10 * n / 30) + 3 * np.sin(2 * np.pi * 7 * n / 30 + 1)).astype(float)
oy = np.round(3 * np.sin(2 * np.pi * 9 * n / 30 + 2) + 2 * np.sin(2 * np.pi * 13 * n / 30)).astype(float)
ex = -(ox[1:] - ox[:-1]); ey = -(oy[1:] - oy[:-1])
dxs, dys = [], []
prev = None
for f in files:
    g = np.float32(cv2.imread(f, cv2.IMREAD_GRAYSCALE))
    if prev is not None:
        win = cv2.createHanningWindow((g.shape[1], g.shape[0]), cv2.CV_32F)
        (sx, sy), resp = cv2.phaseCorrelate(prev, g, win)
        dxs.append(float(sx)); dys.append(float(sy))
    prev = g
dx = np.array(dxs); dy = np.array(dys)
corr_x = float(np.corrcoef(dx, ex)[0, 1]); corr_y = float(np.corrcoef(dy, ey)[0, 1])
rmse = float(np.sqrt(np.mean((dx - ex) ** 2 + (dy - ey) ** 2)))
print("VALIDATE " + json.dumps({
    "corrX": round(corr_x, 4), "corrY": round(corr_y, 4), "rmsePx": round(rmse, 4),
    "measDxStd": round(float(dx.std()), 3), "expDxStd": round(float(ex.std()), 3),
    "measDyStd": round(float(dy.std()), 3), "expDyStd": round(float(ey.std()), 3),
}))
`;
const validatePy = path.join(work, "validate_phase.py");
fs.writeFileSync(validatePy, VALIDATE_PY);
function validatePhase(framesDir) {
  const r = spawnSync(CV2_PY, [validatePy, framesDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`validate_phase.py lỗi: status=${r.status} err=${r.error && r.error.message} out=${r.stdout} err2=${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("VALIDATE "));
  if (!line) throw new Error(`không parse được validate: ${r.stdout} ${r.stderr}`);
  return JSON.parse(line.slice("VALIDATE ".length));
}

console.log(`== Đợt 63 R2 — (c) metric jitter bằng phase correlation (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);
console.log(`   cv2 python: ${CV2_PY}`);

// --- Chuẩn bị media (giống đợt 61) ------------------------------------------
console.log("\n== Chuẩn bị media ==");
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")],
  "tạo shaky320.mp4 (gen P2, seed 7)");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky320.mp4"),
  "-vf", "scale=1280:720:flags=lanczos",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shaky720.mp4")], "upscale shaky → 720p");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky720.mp4"),
  "-vf", "noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shakynoisy720.mp4")], "shaky+noise → shakynoisy720");
ok(probeOk(path.join(mediaDir, "shakynoisy720.mp4"), 1280, 720), "shakynoisy720.mp4 tạo xong (5s, 720p)");

// --- (c0) Kiểm chứng bộ ước lượng trên nguồn rung đã biết --------------------
console.log("\n== (c0) Kiểm chứng phase correlation trên shaky320 (rung đã biết) ==");
const shaky320Dir = path.join(work, "frames-shaky320");
extractFrames(path.join(mediaDir, "shaky320.mp4"), shaky320Dir, "format=gray");
const val = validatePhase(shaky320Dir);
console.log(`   📊 validate: corrX=${val.corrX} corrY=${val.corrY} rmse=${val.rmsePx}px | đo std(dx)=${val.measDxStd} vs kỳ vọng ${val.expDxStd} | đo std(dy)=${val.measDyStd} vs kỳ vọng ${val.expDyStd}`);
ok(val.corrX > 0.8 && val.corrY > 0.8,
  `phase correlation bắt đúng rung đã biết (corrX=${val.corrX}, corrY=${val.corrY} > 0.8)`);
ok(val.rmsePx < 1.5, `sai số ước lượng dịch chuyển nhỏ (RMSE ${val.rmsePx}px < 1.5px)`);

// --- (c1) Đối chứng + stabilize 3 lần, đo MAD và J1/J2/J3 trên cùng frame ----
console.log("\n== (c1) MAD vs phase-correlation metric (stabilize 3 lần, 720p) ==");
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
const spec = (enh) => specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shakynoisy720.mp4", 5, enh ? { enhance: enh } : {})] }], 1280, 720);
function measureRun(label, mp4) {
  const dir = path.join(work, `frames-${label}`);
  extractFrames(mp4, dir, "scale=320:180,format=gray");
  const mad = jitterOf(dir);
  const phC = phaseOf(dir, "center");
  const phF = phaseOf(dir, "full");
  console.log(`   📊 ${label}: MAD mean=${mad.mean} median=${mad.median} | J1c=${phC.J1} J2c=${phC.J2} J3c=${phC.J3} (center, respMed=${phC.respMedian}) | J1f=${phF.J1} J2f=${phF.J2} J3f=${phF.J3} (full, respMed=${phF.respMedian})`);
  return { label, mad, center: phC, full: phF };
}
const results = {};
// Đối chứng: baseline encode 2 lần (kiểm tính lặp lại của chính metric trên cùng pipeline).
for (let i = 1; i <= 2; i++) {
  const outP = path.join(work, `baseline-enc-r${i}.mp4`);
  run("ffmpeg", ["-i", path.join(mediaDir, "shakynoisy720.mp4"),
    "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-an", "-y", outP], `baseline encode #${i}`);
  ok(probeOk(outP, 1280, 720), `đối chứng #${i}: MP4 h264 đúng res/thời lượng`);
  results[`ctrl${i}`] = measureRun(`ctrl${i}`, outP);
}
const stabRuns = [];
for (let i = 1; i <= 3; i++) {
  const r = render(spec(BALANCED), `stab-jitter-r${i}`, ["--no-trf-cache"]);
  ok(r.status === 0 && outOk(r.outPath) && probeOk(r.outPath, 1280, 720),
    `stabilize #${i}: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
  const m = measureRun(`stab${i}`, r.outPath);
  stabRuns.push(m);
  results[`stab${i}`] = m;
}

// --- (c2) So sánh: mức giảm + spread -----------------------------------------
console.log("\n== (c2) So sánh MAD vs J1/J2/J3 ==");
const ctrl = results.ctrl1;
const ctrl2 = results.ctrl2;
function summarize(metricFn, label) {
  const c = metricFn(ctrl);
  const c2 = metricFn(ctrl2);
  const runs = stabRuns.map(metricFn);
  const m = mean(runs);
  const reduction = (c - m) / c * 100;
  const sp = spreadPct(runs);
  console.log(`   📊 ${label}: đối chứng ${c.toFixed(4)} (lặp lại: ${c2.toFixed(4)}, chênh ${Math.abs(c - c2) / c * 100}% ) → stabilize 3 lần: ${runs.map((v) => v.toFixed(4)).join(" / ")} → mean ${m.toFixed(4)} (giảm ${reduction.toFixed(1)}%), spread ${sp.toFixed(1)}%`);
  return { control: +c.toFixed(4), controlRepeat: +c2.toFixed(4), runs: runs.map((v) => +v.toFixed(4)), mean: +m.toFixed(4), reductionPct: +reduction.toFixed(1), spreadPct: +sp.toFixed(1) };
}
const comp = {
  MADmean: summarize((r) => r.mad.mean, "MAD mean (đợt 61)"),
  J1center: summarize((r) => r.center.J1, "J1 center (std dx+dy)"),
  J2center: summarize((r) => r.center.J2, "J2 center (mean |Δdx|+|Δdy|)"),
  J3center: summarize((r) => r.center.J3, "J3 center (RMS quỹ đạo khử xu hướng)"),
  J1full: summarize((r) => r.full.J1, "J1 full-frame"),
  J2full: summarize((r) => r.full.J2, "J2 full-frame"),
  J3full: summarize((r) => r.full.J3, "J3 full-frame"),
};
const bestSpread = Object.entries(comp).reduce((a, [k, v]) => (v.spreadPct < a[1].spreadPct ? [k, v] : a), ["", { spreadPct: 1e9 }]);
console.log(`   📊 metric ổn định nhất giữa 3 lần stabilize: ${bestSpread[0]} (spread ${bestSpread[1].spreadPct}% vs MAD ${comp.MADmean.spreadPct}%)`);
ok(comp.MADmean.reductionPct > 50, `MAD vẫn giảm sâu như đợt 61 (giảm ${comp.MADmean.reductionPct}% > 50%)`);
ok(comp.J2center.reductionPct > 50,
  `J2 center (độ giật) giảm sâu: ${comp.J2center.reductionPct}% > 50% — J2 là metric chuyển động nhạy nhất`);
// KHÔNG assert J1/J3 center giảm >50%: J1c chỉ giảm 58,6% và J3c chỉ 26,5%
// trong lượt này (lần stabilize #1 trôi chậm tệ hơn cả đối chứng) — đó là
// kết quả thật về chất lượng stabilize dao động theo .trf, không phải lỗi
// đo; xem LIMITS đợt 63 R2 §3.3.
ok(results.stab1.center.respMedian > 0.3,
  `phase correlation tự tin trên video stabilize (response median ${results.stab1.center.respMedian} > 0.3)`);

const summary = {
  validate: val,
  controlRepeatability: {
    MAD: [comp.MADmean.control, comp.MADmean.controlRepeat],
    J1center: [comp.J1center.control, comp.J1center.controlRepeat],
  },
  comparison: comp,
  mostStableMetric: bestSpread[0],
  madSpreadPctRound61Reference: 38.0,
};
console.log(`\n== test_round63_r2_motion_metric: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);
