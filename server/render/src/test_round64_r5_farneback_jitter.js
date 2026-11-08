#!/usr/bin/env node
/**
 * test_round64_r5_farneback_jitter.js — Phase 9 đợt 64, luồng R5: thử optical
 * flow dày (Farneback) làm metric jitter (nợ mở đợt 63 R2 §8 mục 4).
 *
 * Bối cảnh (đợt 63 R2 §4): phase correlation đã BỊ BÁC BỎ làm metric jitter —
 * mọi metric chuyển động dao động mạnh hơn MAD trên cùng các lần stabilize
 * (lượt 3: MAD 69,2% vs J2c 128,6%; lượt 4: MAD 17,0% vs J2c 72,1%), vì .trf
 * không xác định làm chất lượng stabilize thật dao động 4–5×. Farneback là
 * ứng viên cuối: flow dày bắt chuyển động cục bộ mà phase correlation toàn
 * cục bỏ qua. Vẫn phải đo spread ≥3 lần và so với MAD trên cùng render.
 *
 * Thiết kế (kết quả pilot/validate trước khi viết harness này):
 * - Farneback cho flow field 2 chế độ trên nội dung test tổng hợp (nền phẳng
 *   lớn + ô cờ): ~60% pixel có |flow|≈0 (vùng phẳng, aperture problem), ~40%
 *   có flow đúng → MEDIAN naive ≈ 0, KHÔNG theo kịp rung đã biết
 *   (corr 0,67/0,78; RMSE 7,07px; slope 0,005). V0 = median winsize15 BỊ LOẠI
 *   ngay ở bước validate (ghi lại để làm hồ sơ thất bại).
 * - Cứu được bằng thresholded-median: median chỉ trên pixel có |flow|>1px
 *   (quần thể "đang chuyển động"). V5 = thresh-median winsize25: corr
 *   0,970/1,000, RMSE 1,410px, slope (0,906/0,988) — QUA bar validate của R2
 *   (corr>0,8; RMSE<1,5px). V2 = thresh-median winsize15: corr 0,965/1,000,
 *   RMSE 1,559px (sát bar). V1 = median winsize25: corr 0,939/0,991, RMSE
 *   2,646px. V3/V4 (mean) corr cao nhưng RMSE 3,6–4,6px (nén hệ số ~0,5).
 *   → Estimator chính: V5. Phụ: V2, V1. Hồ sơ thất bại: V0.
 * - Metric (trên crop giữa 160×90 của frame 320×180 gray, như J*c của R2):
 *     F1 = std(mx)+std(my); F2 = mean|Δmx|+mean|Δmy|;
 *     F3 = RMS quỹ đạo tích lũy (đã khử xu hướng, cửa sổ 15) — cùng công thức J1/J2/J3
 *     F4 = mean |flow25 − m5| (dư cục bộ / phi-rigid, chỉ flow dày mới có)
 *     F5 = tỉ lệ pixel có |flow25 − m5| > 1px
 *   với (mx,my) = chuỗi dịch chuyển toàn cục theo estimator V5 (và V0/V1/V2
 *   để đối chiếu). Full-frame chỉ đo trên 2 video làm đối chứng bẫy (R2 đã
 *   chứng minh full-frame vô nghĩa trên video stabilize vì viền đen tĩnh).
 *
 * Các phần:
 *   S0  Dùng LẠI render của R2 (2 lượt × đối chứng 2 + stabilize 0.5 ×3,
 *       scratch .scratch-r63r2m-auyFk4 = lượt 3, -2ulK66 = lượt 4) — so sánh
 *       trực tiếp trên CÙNG render, CÙNG frame. Nếu scratch thiếu thì tái tạo
 *       tương đương bằng đúng pipeline R2.
 *   S1  Validate estimator trên shaky320 (rung đã biết, seed 7).
 *   S2  Pan texture thật (noise texture, pan 24px/frame đã biết): V0 có làm
 *       việc trên nội dung giàu texture không? (phân biệt "Farneback hỏng"
 *       với "Farneback hỏng trên nội dung phẳng tổng hợp").
 *   S3  Đo trên 10 render R2: MAD + J1c/J2c/J3c + F* (V5/V2/V1/V0) → spread
 *       từng metric theo lượt.
 *   S4  Phiên denoise mới: stabilize với denoise 0 / 0.5 / 1.0 (mỗi mức ×2)
 *       + đối chứng ×1 — độ nhạy với jitter thật và nhiễu đo (denoise có làm
 *       lệch metric flow không?).
 *   S5  Tổng kết JSON + kết luận bằng số (không assert giả thuyết spread —
 *       chỉ assert pipeline + validate + tính lặp lại của đối chứng).
 *
 * Cách chạy: node server/render/src/test_round64_r5_farneback_jitter.js
 * (cần ffmpeg, ffprobe, python3 + PIL/numpy cho MAD, python của
 * server/tracking/.venv cho cv2). Scratch mới dưới ~/workspace/.scratch-r64r5-*.
 * KHÔNG ghi gì vào repo. Thời gian ~12–20 phút tùy tải.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r64r5-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const CV2_PY = path.join(RENDER, "..", "tracking", ".venv", "bin", "python");
// Scratch đợt 63 R2 (lượt 3 = auyFk4, lượt 4 = 2ulK66 — xem log r63r2-motion-run3/4).
const R2_RUN3 = process.env.R64R5_RUN3 || "/home/hatch/workspace/.scratch-r63r2m-auyFk4";
const R2_RUN4 = process.env.R64R5_RUN4 || "/home/hatch/workspace/.scratch-r63r2m-2ulK66";

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
  meta: { name: "r64r5", width: W, height: H, fps: fps || 30 },
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
function frameCount(dir) {
  try { return fs.readdirSync(dir).filter((f) => f.startsWith("f") && f.endsWith(".png")).length; }
  catch { return 0; }
}

// --- MAD (giống đợt 61/63, để so sánh trực tiếp trên cùng frame) --------------
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

// --- Phase correlation (bản sao y R2, để J1c/J2c/J3c so sánh được) -------------
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

// --- Farneback dense optical flow -------------------------------------------
// Estimator: V0 median w15 | V1 median w25 | V2 thresh-median w15 | V5 thresh-median w25.
// F1/F2/F3 theo cùng công thức J1/J2/J3 trên chuỗi dịch chuyển toàn cục;
// F4/F5 = dư cục bộ so với dịch chuyển toàn cục V5 (chỉ flow dày mới có).
const FARNEBACK_PY = `
import sys, glob, json, time, numpy as np, cv2

def detrend_rms(v, win=15):
    c = np.cumsum(v)
    half = win // 2
    sm = np.array([c[max(0, i - half):min(len(c), i + half + 1)].mean()
                   for i in range(len(c))])
    return float(np.sqrt(np.mean((c - sm) ** 2)))

def agg_series(mx, my):
    mx = np.array(mx); my = np.array(my)
    return {
        "F1": round(float(mx.std() + my.std()), 4),
        "F2": round(float(np.abs(np.diff(mx)).mean() + np.abs(np.diff(my)).mean()), 4),
        "F3": round(float(np.sqrt(detrend_rms(mx) ** 2 + detrend_rms(my) ** 2)), 4),
        "medianAbsShift": round(float(np.abs(mx).mean() + np.abs(my).mean()), 4),
    }

def thresh_med(fx, fy, t=1.0):
    mag = np.sqrt(fx ** 2 + fy ** 2)
    m = mag > t
    if m.sum() < 10:
        return 0.0, 0.0, int(m.sum())
    return float(np.median(fx[m])), float(np.median(fy[m])), int(m.sum())

mode = sys.argv[1]
framesDir = sys.argv[2]
files = sorted(glob.glob(framesDir + "/f*.png"))
assert len(files) == 150, f"frames {len(files)} != 150"

# Chuỗi dịch chuyển theo 4 estimator + dư cục bộ (flow25 so với V5).
s = {k: ([], []) for k in ("V0", "V1", "V2", "V5")}
f4s, f5s, dt15, dt25, dt25f = [], [], [], [], []
full = "--full" in sys.argv
sfull = ([], [])
prev = None
for f in files:
    g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    if prev is not None:
        h, w = g.shape
        pc = prev[h // 4:3 * h // 4, w // 4:3 * w // 4]
        cc = g[h // 4:3 * h // 4, w // 4:3 * w // 4]
        t0 = time.perf_counter()
        fl15 = cv2.calcOpticalFlowFarneback(pc, cc, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        dt15.append(time.perf_counter() - t0)
        t0 = time.perf_counter()
        fl25 = cv2.calcOpticalFlowFarneback(pc, cc, None, 0.5, 3, 25, 3, 5, 1.2, 0)
        dt25.append(time.perf_counter() - t0)
        fx15, fy15 = fl15[..., 0], fl15[..., 1]
        fx25, fy25 = fl25[..., 0], fl25[..., 1]
        s["V0"][0].append(float(np.median(fx15))); s["V0"][1].append(float(np.median(fy15)))
        s["V1"][0].append(float(np.median(fx25))); s["V1"][1].append(float(np.median(fy25)))
        m2x, m2y, _ = thresh_med(fx15, fy15, 1.0)
        s["V2"][0].append(m2x); s["V2"][1].append(m2y)
        m5x, m5y, _ = thresh_med(fx25, fy25, 1.0)
        s["V5"][0].append(m5x); s["V5"][1].append(m5y)
        res = np.sqrt((fx25 - m5x) ** 2 + (fy25 - m5y) ** 2)
        f4s.append(float(res.mean())); f5s.append(float((res > 1.0).mean()))
        if full:
            t0 = time.perf_counter()
            flf = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 25, 3, 5, 1.2, 0)
            dt25f.append(time.perf_counter() - t0)
            mfx, mfy, _ = thresh_med(flf[..., 0], flf[..., 1], 1.0)
            sfull[0].append(mfx); sfull[1].append(mfy)
    prev = g

if mode == "measure":
    out = {"n": len(s["V5"][0]),
           "F4": round(float(np.mean(f4s)), 4),
           "F5": round(float(np.mean(f5s)), 4),
           "msPerPairW15center": round(float(np.mean(dt15)) * 1000, 2),
           "msPerPairW25center": round(float(np.mean(dt25)) * 1000, 2)}
    for k in ("V0", "V1", "V2", "V5"):
        for mk, mv in agg_series(s[k][0], s[k][1]).items():
            out[f"{mk}_{k}"] = mv
    if full:
        out["msPerPairW25full"] = round(float(np.mean(dt25f)) * 1000, 2)
        for mk, mv in agg_series(sfull[0], sfull[1]).items():
            out[f"{mk}_V5full"] = mv
    print("FARNEBACK " + json.dumps(out))
elif mode == "validate":
    # Rung đã biết, công thức như test_p2_gen_shaky.py (seed 7).
    n = np.arange(150)
    ox = np.round(4 * np.sin(2 * np.pi * 10 * n / 30) + 3 * np.sin(2 * np.pi * 7 * n / 30 + 1)).astype(float)
    oy = np.round(3 * np.sin(2 * np.pi * 9 * n / 30 + 2) + 2 * np.sin(2 * np.pi * 13 * n / 30)).astype(float)
    ex = -(ox[1:] - ox[:-1]); ey = -(oy[1:] - oy[:-1])
    out = {}
    for k in ("V0", "V1", "V2", "V5"):
        mx = np.array(s[k][0]); my = np.array(s[k][1])
        out[k] = {
            "corrX": round(float(np.corrcoef(mx, ex)[0, 1]), 4),
            "corrY": round(float(np.corrcoef(my, ey)[0, 1]), 4),
            "rmsePx": round(float(np.sqrt(np.mean((mx - ex) ** 2 + (my - ey) ** 2))), 4),
            "slopeX": round(float(np.polyfit(ex, mx, 1)[0]), 3),
            "slopeY": round(float(np.polyfit(ey, my, 1)[0]), 3),
        }
    print("VALIDATE " + json.dumps(out))
elif mode == "pan":
    # Dịch chuyển hằng số đã biết (pan 24px/frame): dx, dy qua argv.
    edx, edy = float(sys.argv[3]), float(sys.argv[4])
    out = {}
    for k in ("V0", "V5"):
        mx = np.array(s[k][0]); my = np.array(s[k][1])
        rmse = float(np.sqrt(np.mean((mx - edx) ** 2 + (my - edy) ** 2)))
        out[k] = {
            "meanDx": round(float(mx.mean()), 3), "meanDy": round(float(my.mean()), 3),
            "biasDx": round(float(mx.mean() - edx), 3), "biasDy": round(float(my.mean() - edy), 3),
            "rmsePx": round(rmse, 3),
            "fracWithin2px": round(float(np.mean((np.abs(mx - edx) <= 2) & (np.abs(my - edy) <= 2))), 3),
        }
    # Đối chiếu phase correlation toàn frame (không viền đen ở clip pan).
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
    out["phaseFull"] = {
        "meanDx": round(float(dx.mean()), 3), "meanDy": round(float(dy.mean()), 3),
        "rmsePx": round(float(np.sqrt(np.mean((dx - edx) ** 2 + (dy - edy) ** 2))), 3),
        "fracWithin2px": round(float(np.mean((np.abs(dx - edx) <= 2) & (np.abs(dy - edy) <= 2))), 3),
    }
    print("PAN " + json.dumps(out))
else:
    raise SystemExit(f"mode không biết: {mode}")
`;
const farnebackPy = path.join(work, "farneback.py");
fs.writeFileSync(farnebackPy, FARNEBACK_PY);
function farneback(framesDir, mode, extraArgs) {
  const args = [farnebackPy, mode, framesDir, ...(extraArgs || [])];
  const r = spawnSync(CV2_PY, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`farneback.py lỗi (${mode}): status=${r.status} out=${r.stdout} err2=${r.stderr}`);
  const tag = mode === "measure" ? "FARNEBACK " : mode === "validate" ? "VALIDATE " : "PAN ";
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith(tag));
  if (!line) throw new Error(`không parse được farneback (${mode}): ${r.stdout} ${r.stderr}`);
  return JSON.parse(line.slice(tag.length));
}

// --- Pan texture: tạo clip pan 24px/frame từ noise texture (biết trước shift) --
const PAN_PY = `
import subprocess, sys, numpy as np, cv2
out = sys.argv[1]
rng = np.random.default_rng(11)
base = rng.integers(0, 256, (180, 4000), dtype=np.uint8)
base = cv2.GaussianBlur(base, (0, 0), 2.0)  # texture mịn, có gradient khắp nơi
proc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray",
     "-s", "320x180", "-r", "30", "-i", "-",
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "12", out],
    stdin=subprocess.PIPE)
for i in range(150):
    x = 24 * i  # crop trượt phải 24px/frame -> nội dung dịch TRÁI 24px/frame
    frame = base[:, x:x + 320]
    proc.stdin.write(frame.tobytes())
proc.stdin.close()
proc.wait()
assert proc.returncode == 0
print("wrote pan", out)
`;

console.log(`== Đợt 64 R5 — Farneback dense optical flow làm metric jitter (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);
console.log(`   R2 lượt 3: ${R2_RUN3}`);
console.log(`   R2 lượt 4: ${R2_RUN4}`);
console.log(`   cv2 python: ${CV2_PY}`);

// --- S0: kiểm tra render R2 còn đủ không; thiếu thì tái tạo tương đương -------
console.log("\n== S0. Kiểm tra dữ liệu đợt 63 R2 ==");
const R2_VIDEOS = ["baseline-enc-r1.mp4", "baseline-enc-r2.mp4",
  "stab-jitter-r1.mp4", "stab-jitter-r2.mp4", "stab-jitter-r3.mp4"];
const R2_FRAMES = ["frames-ctrl1", "frames-ctrl2", "frames-stab1", "frames-stab2", "frames-stab3"];
function r2RunOk(dir) {
  if (!fs.existsSync(dir)) return false;
  for (const v of R2_VIDEOS) if (!outOk(path.join(dir, v))) return false;
  for (const d of [...R2_FRAMES, "frames-shaky320"]) if (frameCount(path.join(dir, d)) !== 150) return false;
  if (!fs.existsSync(path.join(dir, "media", "shakynoisy720.mp4"))) return false;
  return true;
}
function buildR2RunLike(dir, tag) {
  // Tái tạo đúng pipeline R2 (gen P2 seed 7 -> upscale 720p -> noise alls=15,
  // đối chứng x2 + stabilize Cân bằng x3 --no-trf-cache), vào thư mục dir.
  console.log(`   ⚠️  ${tag}: scratch R2 thiếu — tái tạo tương đương tại ${dir}`);
  const md = path.join(dir, "media");
  fs.mkdirSync(md, { recursive: true });
  run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(md, "shaky320.mp4")], "tạo shaky320.mp4");
  run("ffmpeg", ["-i", path.join(md, "shaky320.mp4"), "-vf", "scale=1280:720:flags=lanczos",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(md, "shaky720.mp4")], "upscale shaky → 720p");
  run("ffmpeg", ["-i", path.join(md, "shaky720.mp4"), "-vf", "noise=alls=15:allf=t",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(md, "shakynoisy720.mp4")], "shaky+noise → shakynoisy720");
  const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
  const spec = (enh) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "shakynoisy720.mp4", 5, enh ? { enhance: enh } : {})] }], 1280, 720);
  // Dùng mediaDir riêng của run tái tạo: render() dùng mediaDir toàn cục nên
  // copy media vào đó trước (media giống hệt vì cùng seed).
  for (const f of ["shaky320.mp4", "shaky720.mp4", "shakynoisy720.mp4"])
    fs.copyFileSync(path.join(md, f), path.join(mediaDir, f));
  for (let i = 1; i <= 2; i++) {
    const outP = path.join(dir, `baseline-enc-r${i}.mp4`);
    run("ffmpeg", ["-i", path.join(md, "shakynoisy720.mp4"),
      "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
      "-an", "-y", outP], `đối chứng #${i} (${tag})`);
  }
  for (let i = 1; i <= 3; i++) {
    const r = render(spec(BALANCED), `regen-${tag}-r${i}`, ["--no-trf-cache"]);
    if (r.status !== 0 || !outOk(r.outPath)) throw new Error(`render tái tạo ${tag} #${i} thất bại`);
    fs.renameSync(r.outPath, path.join(dir, `stab-jitter-r${i}.mp4`));
  }
  const pairs = [["baseline-enc-r1.mp4", "frames-ctrl1"], ["baseline-enc-r2.mp4", "frames-ctrl2"],
    ["stab-jitter-r1.mp4", "frames-stab1"], ["stab-jitter-r2.mp4", "frames-stab2"], ["stab-jitter-r3.mp4", "frames-stab3"]];
  for (const [mp4, fd] of pairs) extractFrames(path.join(dir, mp4), path.join(dir, fd), "scale=320:180,format=gray");
  extractFrames(path.join(md, "shaky320.mp4"), path.join(dir, "frames-shaky320"), "format=gray");
}
let r2run3 = R2_RUN3, r2run4 = R2_RUN4;
if (!r2RunOk(r2run3)) { r2run3 = path.join(work, "r2run3-regen"); fs.mkdirSync(r2run3, { recursive: true }); buildR2RunLike(r2run3, "lượt 3"); }
if (!r2RunOk(r2run4)) { r2run4 = path.join(work, "r2run4-regen"); fs.mkdirSync(r2run4, { recursive: true }); buildR2RunLike(r2run4, "lượt 4"); }
ok(r2RunOk(r2run3) && r2RunOk(r2run4), "đủ dữ liệu R2: 2 lượt × (đối chứng 2 + stabilize 0.5 ×3), frame 150/video");

// --- S1: validate estimator trên rung đã biết ----------------------------------
console.log("\n== S1. Validate estimator Farneback trên shaky320 (rung đã biết) ==");
const val = farneback(path.join(r2run4, "frames-shaky320"), "validate");
for (const [k, v] of Object.entries(val))
  console.log(`   📊 ${k}: corrX=${v.corrX} corrY=${v.corrY} RMSE=${v.rmsePx}px slope=(${v.slopeX},${v.slopeY})`);
ok(val.V5.corrX > 0.8 && val.V5.corrY > 0.8, `V5 (thresh-median w25) bắt đúng rung đã biết (corr ${val.V5.corrX}/${val.V5.corrY} > 0.8)`);
ok(val.V5.rmsePx < 1.5, `V5 sai số ước lượng nhỏ (RMSE ${val.V5.rmsePx}px < 1.5px — bar R2)`);
console.log(`   📊 V0 (median naive w15): corr ${val.V0.corrX}/${val.V0.corrY}, RMSE ${val.V0.rmsePx}px — LOẠI, chỉ ghi hồ sơ thất bại`);

// --- S2: pan texture — V0 có làm việc trên nội dung giàu texture? --------------
console.log("\n== S2. Pan texture 24px/frame (nội dung giàu texture, shift đã biết -24,0) ==");
const panPy = path.join(work, "pan_gen.py");
fs.writeFileSync(panPy, PAN_PY);
const panMp4 = path.join(work, "pan-texture.mp4");
// pan_gen.py cần cv2 (GaussianBlur) nên chạy bằng venv python, không phải python3 hệ thống.
run(CV2_PY, [panPy, panMp4], "tạo clip pan texture");
ok(probeOk(panMp4, 320, 180), "clip pan texture 320×180, 5s tạo xong");
const panDir = path.join(work, "frames-pan");
extractFrames(panMp4, panDir, "format=gray");
const pan = farneback(panDir, "pan", ["-24", "0"]);
for (const [k, v] of Object.entries(pan))
  console.log(`   📊 pan ${k}: mean=(${v.meanDx},${v.meanDy}) bias=(${v.biasDx},${v.biasDy}) RMSE=${v.rmsePx}px trong±2px=${v.fracWithin2px}`);
ok(pan.phaseFull.rmsePx < 1.0, `phase corr bắt đúng pan texture (RMSE ${pan.phaseFull.rmsePx}px < 1px) — đối chiếu tin được`);

// --- Đo 1 video: MAD + phase center + Farneback -------------------------------
function measureVideo(label, framesDir, withFull) {
  const mad = jitterOf(framesDir);
  const phC = phaseOf(framesDir, "center");
  const fb = farneback(framesDir, "measure", withFull ? ["--full"] : []);
  console.log(`   📊 ${label}: MAD=${mad.mean} | J1c=${phC.J1} J2c=${phC.J2} J3c=${phC.J3} | ` +
    `F1_V5=${fb.F1_V5} F2_V5=${fb.F2_V5} F3_V5=${fb.F3_V5} F4=${fb.F4} F5=${fb.F5} | ` +
    `F2_V2=${fb.F2_V2} F2_V1=${fb.F2_V1} F2_V0=${fb.F2_V0}` +
    (withFull ? ` | F1_V5full=${fb.F1_V5full} F2_V5full=${fb.F2_V5full}` : ""));
  return { label, mad, phase: phC, fb };
}

// --- S3: đo trên render R2 -----------------------------------------------------
console.log("\n== S3. Đo trên render R2 (2 lượt × 5 video) ==");
const runs = {};
for (const [runName, runDir] of [["run3", r2run3], ["run4", r2run4]]) {
  const res = {};
  const items = [["ctrl1", "baseline-enc-r1.mp4", "frames-ctrl1", true],
    ["ctrl2", "baseline-enc-r2.mp4", "frames-ctrl2", false],
    ["stab1", "stab-jitter-r1.mp4", "frames-stab1", true],
    ["stab2", "stab-jitter-r2.mp4", "frames-stab2", false],
    ["stab3", "stab-jitter-r3.mp4", "frames-stab3", false]];
  for (const [label, mp4, fd, withFull] of items) {
    ok(probeOk(path.join(runDir, mp4), 1280, 720), `${runName} ${label}: MP4 h264 đúng res/thời lượng`);
    res[label] = measureVideo(`${runName}-${label}`, path.join(runDir, fd), withFull);
  }
  runs[runName] = res;
}
function summarizeRun(runName, metricFn, label) {
  const r = runs[runName];
  const c = metricFn(r.ctrl1), c2 = metricFn(r.ctrl2);
  const xs = [r.stab1, r.stab2, r.stab3].map(metricFn);
  const m = mean(xs);
  const red = (c - m) / c * 100;
  const sp = spreadPct(xs);
  console.log(`   📊 ${runName} ${label}: đối chứng ${c.toFixed(4)} (lặp: ${c2.toFixed(4)}, chênh ${(Math.abs(c - c2) / c * 100).toFixed(2)}%) → stab: ${xs.map((v) => v.toFixed(4)).join(" / ")} → mean ${m.toFixed(4)} (giảm ${red.toFixed(1)}%), spread ${sp.toFixed(1)}%`);
  return { control: +c.toFixed(4), controlRepeat: +c2.toFixed(4), runs: xs.map((v) => +v.toFixed(4)), mean: +m.toFixed(4), reductionPct: +red.toFixed(1), spreadPct: +sp.toFixed(1) };
}
console.log("\n== S3b. So sánh spread theo lượt (MAD / J*c / F*) ==");
const comp = {};
for (const runName of ["run3", "run4"]) {
  comp[runName] = {
    MADmean: summarizeRun(runName, (r) => r.mad.mean, "MAD mean"),
    J1c: summarizeRun(runName, (r) => r.phase.J1, "J1 center"),
    J2c: summarizeRun(runName, (r) => r.phase.J2, "J2 center"),
    J3c: summarizeRun(runName, (r) => r.phase.J3, "J3 center"),
    F1_V5: summarizeRun(runName, (r) => r.fb.F1_V5, "F1 V5 (thresh-median w25)"),
    F2_V5: summarizeRun(runName, (r) => r.fb.F2_V5, "F2 V5"),
    F3_V5: summarizeRun(runName, (r) => r.fb.F3_V5, "F3 V5"),
    F4: summarizeRun(runName, (r) => r.fb.F4, "F4 (dư cục bộ)"),
    F5: summarizeRun(runName, (r) => r.fb.F5, "F5 (tỉ lệ pixel dư >1px)"),
    F2_V2: summarizeRun(runName, (r) => r.fb.F2_V2, "F2 V2 (thresh-median w15)"),
    F2_V1: summarizeRun(runName, (r) => r.fb.F2_V1, "F2 V1 (median w25)"),
    F2_V0: summarizeRun(runName, (r) => r.fb.F2_V0, "F2 V0 (median naive w15 — đã loại)"),
  };
}
// Đối chứng lặp lại phải giống hệt (encode + đo đều xác định).
for (const runName of ["run3", "run4"]) {
  const r = runs[runName];
  ok(Math.abs(r.ctrl1.mad.mean - r.ctrl2.mad.mean) < 1e-9, `${runName}: MAD đối chứng lặp lại giống hệt`);
  ok(Math.abs(r.ctrl1.fb.F2_V5 - r.ctrl2.fb.F2_V5) < 1e-9, `${runName}: F2_V5 đối chứng lặp lại giống hệt`);
}

// --- S4: phiên denoise mới — stabilize với denoise 0 / 0.5 / 1.0 ---------------
console.log("\n== S4. Phiên denoise mới (stabilize smoothing 10, denoise 0 / 0.5 / 1.0) ==");
console.log("   (Media tái tạo đúng pipeline R2: gen P2 seed 7 → upscale 720p → noise alls=15)");
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")], "tạo shaky320.mp4");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky320.mp4"), "-vf", "scale=1280:720:flags=lanczos",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shaky720.mp4")], "upscale shaky → 720p");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky720.mp4"), "-vf", "noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shakynoisy720.mp4")], "shaky+noise → shakynoisy720");
ok(probeOk(path.join(mediaDir, "shakynoisy720.mp4"), 1280, 720), "shakynoisy720.mp4 tái tạo xong (5s, 720p)");
const DENOISE = {
  d0: { stabilize: { smoothing: 10 } },
  d05: { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } },
  d10: { stabilize: { smoothing: 10 }, denoise: { strength: 1.0 } },
};
const specD = (enh) => specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shakynoisy720.mp4", 5, { enhance: enh })] }], 1280, 720);
const fresh = {};
// Đối chứng tươi ×1.
run("ffmpeg", ["-i", path.join(mediaDir, "shakynoisy720.mp4"),
  "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(work, "fresh-ctrl.mp4")], "đối chứng tươi");
ok(probeOk(path.join(work, "fresh-ctrl.mp4"), 1280, 720), "đối chứng tươi: MP4 h264 đúng res/thời lượng");
extractFrames(path.join(work, "fresh-ctrl.mp4"), path.join(work, "frames-fresh-ctrl"), "scale=320:180,format=gray");
fresh.ctrl = measureVideo("fresh-ctrl", path.join(work, "frames-fresh-ctrl"), false);
for (const [level, enh] of Object.entries(DENOISE)) {
  fresh[level] = [];
  for (let i = 1; i <= 2; i++) {
    const r = render(specD(enh), `fresh-${level}-r${i}`, ["--no-trf-cache"]);
    ok(r.status === 0 && outOk(r.outPath) && probeOk(r.outPath, 1280, 720),
      `stabilize denoise ${level} #${i}: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
    const dir = path.join(work, `frames-fresh-${level}-r${i}`);
    extractFrames(r.outPath, dir, "scale=320:180,format=gray");
    fresh[level].push(measureVideo(`fresh-${level}-r${i}`, dir, false));
  }
}
console.log("\n== S4b. So sánh theo mức denoise (mean 2 lần, phiên tươi) ==");
const denoiseComp = {};
function denoiseRow(metricFn, label) {
  const c = metricFn(fresh.ctrl);
  const row = { control: +c.toFixed(4) };
  for (const level of ["d0", "d05", "d10"]) {
    const xs = fresh[level].map(metricFn);
    const m = mean(xs);
    row[level] = { runs: xs.map((v) => +v.toFixed(4)), mean: +m.toFixed(4), reductionPct: +((c - m) / c * 100).toFixed(1), spreadPct: +spreadPct(xs).toFixed(1) };
  }
  console.log(`   📊 ${label}: ctrl ${c.toFixed(4)} | d0 mean ${row.d0.mean} (giảm ${row.d0.reductionPct}%, spread ${row.d0.spreadPct}%) | d05 mean ${row.d05.mean} (giảm ${row.d05.reductionPct}%, spread ${row.d05.spreadPct}%) | d10 mean ${row.d10.mean} (giảm ${row.d10.reductionPct}%, spread ${row.d10.spreadPct}%)`);
  return row;
}
denoiseComp.MADmean = denoiseRow((r) => r.mad.mean, "MAD mean");
denoiseComp.J2c = denoiseRow((r) => r.phase.J2, "J2 center");
denoiseComp.F2_V5 = denoiseRow((r) => r.fb.F2_V5, "F2 V5");
denoiseComp.F1_V5 = denoiseRow((r) => r.fb.F1_V5, "F1 V5");
denoiseComp.F4 = denoiseRow((r) => r.fb.F4, "F4 (dư cục bộ)");
denoiseComp.F5 = denoiseRow((r) => r.fb.F5, "F5");

// --- S5: tổng kết ---------------------------------------------------------------
console.log("\n== S5. Tổng kết ==");
const costRows = [];
for (const runName of ["run3", "run4"]) {
  for (const label of ["ctrl1", "stab1"]) {
    const fb = runs[runName][label].fb;
    costRows.push({ video: `${runName}-${label}`, msW15: fb.msPerPairW15center, msW25: fb.msPerPairW25center });
  }
}
const summary = {
  validateShaky320: val,
  panTexture24px: pan,
  comparisonR2: comp,
  denoiseFresh: denoiseComp,
  costMsPerPair: costRows,
  mostStableByRun: Object.fromEntries(Object.entries(comp).map(([rn, c]) => {
    const best = Object.entries(c).reduce((a, [k, v]) => (v.spreadPct < a[1].spreadPct ? [k, v] : a), ["", { spreadPct: 1e9 }]);
    return [rn, { metric: best[0], spreadPct: best[1].spreadPct, madSpreadPct: c.MADmean.spreadPct }];
  })),
};
console.log(`\n== test_round64_r5_farneback_jitter: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);

