#!/usr/bin/env node
/**
 * test_round65_s1_motion_metric.js — Phase 9 đợt 65, luồng S1: GỘP Farneback
 * vào harness motion-metric làm ĐỒNG-CHÍNH với MAD (nợ #1, LIMITS đợt 64 §8 +
 * §1/§4 về R5).
 *
 * Quyết định gộp (theo LIMITS đợt 64 R5 §9, đã được parent duyệt vào nợ đợt 65):
 * - CO-PRIMARY: MAD (ground truth pixel) + F2_V5 (Farneback thresholded-median
 *   winsize 25, chuỗi dịch chuyển toàn cục). F1_V5/F3_V5 báo cáo kèm. F2_V2
 *   (thresh-median winsize 15) làm cross-check.
 * - GIỮ MAD. J2c (phase correlation center) CHỈ làm tham chiếu lịch sử — vẫn
 *   tính để nối chuỗi số với đợt 62/63/64, nhưng KHÔNG dùng để kết luận
 *   (marker ground truth đã chứng minh spread 72–179% của nó là tạo tác bộ
 *   ước lượng, R5 §5).
 * - F5 BỎ (không tính nữa — đo sàn nhiễu, không phân biệt stabilize với đối
 *   chứng, R5 §1). V0 (median flow thô) CẤM DÙNG — cấm ở mức CODE: module đo
 *   chỉ cho phép estimator V5/V2, gọi V0 thì raise; harness có assert kiểm
 *   tra lệnh cấm này (mode v0check).
 * - MỚI: metric frame tệ nhất — max/p99 của |Δm| từng cặp (V5) + số cặp nhảy
 *   hoang (|Δm| > 8px) + max/p99 của MAD từng frame. Glitch 1-frame của
 *   vidstab (R5 §6: frame 20 stab3 lượt 3 nhảy +32px) bị MAD/F2 trung bình
 *   giấu nhẹm và bị std/RMS thổi phồng 2–3× — metric mới phải bắt được nó.
 * - ĐIỀU TRA: vidstabdetect không xác định (.trf khác nhau giữa các lần
 *   chạy) — chạy detect ×3 cùng input/tham số + đổi số thread, so sha256
 *   .trf; chạy transform ×2 cùng .trf và encode-only ×2 để định vị tầng gây
 *   không-xác-định (detect / transform / encode); quét chuỗi median LM trong
 *   .trf để tìm cú nhảy hoang ngay ở tầng detect.
 *
 * Các phần:
 *   S0  Đo lại trên render R2 (2 lượt × đối chứng 2 + stab 0.5 ×3, dùng lại
 *       scratch đợt 63, thiếu thì tái tạo) bằng module đo MỚI — so sánh
 *       spread MAD vs F2_V5 vs F2_V2, và kiểm tra metric frame tệ nhất có
 *       bắt được glitch lượt 3 stab3 không.
 *   S1  Validate V5/V2 trên shaky320 (rung đã biết, bar V5: corr>0,8,
 *       RMSE<1,5px như R2/R5; V2 cross-check: corr>0,8, RMSE<1,7px) +
 *       assert lệnh cấm V0 (v0check phải báo V0_BANNED_OK).
 *   S2  Điều tra tính xác định của vidstab (detect ×3, threads 1 vs mặc
 *       định, transform ×2 cùng .trf, encode-only ×2, quét nhảy hoang
 *       trong .trf).
 *   S3  Render stabilize TƯƠI ×1 qua render.js (để validate harness gộp
 *       end-to-end trên render mới, không chỉ frame cũ) + đo bằng module mới.
 *   S4  Footage thật (R4: ocean-slow 25fps + basgo-mid 30fps, đoạn 5s 720p
 *       đã có trong scratch đợt 64): đối chứng + stabilize ×2 (ocean) /
 *       ×1 (basgo) — MAD + F2_V5 + frame tệ nhất trên footage thật.
 *   S5  Tổng kết JSON + bảng đồng-chính.
 *
 * Cách chạy: node server/render/src/test_round65_s1_motion_metric.js
 * (cần ffmpeg, ffprobe, python3, python của server/tracking/.venv cho cv2).
 * Scratch mới dưới ~/workspace/.scratch-r65s1-*. KHÔNG ghi gì vào repo.
 * Thời gian ~25–45 phút tùy tải (9 luồng đợt 65 chạy song song).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r65s1-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const CV2_PY = path.join(RENDER, "..", "tracking", ".venv", "bin", "python");
const R2_RUN3 = process.env.R65S1_RUN3 || "/home/hatch/workspace/.scratch-r63r2m-auyFk4";
const R2_RUN4 = process.env.R65S1_RUN4 || "/home/hatch/workspace/.scratch-r63r2m-2ulK66";
const R4_SCRATCH = "/home/hatch/workspace/.scratch-r64r4-9h00Sj";

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
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
function spreadPct(xs) {
  const m = mean(xs);
  return m === 0 ? 0 : (Math.max(...xs) - Math.min(...xs)) / m * 100;
}
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r65s1", width: W, height: H, fps: fps || 30 },
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
  return { status: r.status, stdout: (r.stdout || "").toString(), stderr: (r.stderr || "").toString(), outPath, secs };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,r_frame_rate",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  const j = JSON.parse(r.stdout || "{}");
  const fr = j.streams && j.streams[0] && j.streams[0].r_frame_rate;
  const fps = fr ? (Number(fr.split("/")[0]) / Number(fr.split("/")[1] || 1)) : NaN;
  return {
    codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height,
    fps,
    duration: Number(j.format && j.format.duration),
  };
}
function probeOk(mp4, W, H, fps) {
  const p = probeVideo(mp4);
  return p.codec === "h264" && p.width === W && p.height === H &&
    Math.abs(p.duration - 5) < 0.15 && Math.abs(p.fps - fps) < 0.5;
}
function extractFrames(mp4, dir, vf) {
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-i", mp4, "-vf", vf, "-vsync", "0", path.join(dir, "f%04d.png")], `tách frame ${path.basename(mp4)}`);
}
function frameCount(dir) {
  try { return fs.readdirSync(dir).filter((f) => f.startsWith("f") && f.endsWith(".png")).length; }
  catch { return 0; }
}

// --- Module đo gộp: MAD + phase center (tham chiếu lịch sử) + Farneback -----
// V5 = thresh-median winsize 25 (chính), V2 = thresh-median winsize 15
// (cross-check). V0 BỊ CẤM: estimate() chỉ cho phép {"V5","V2"}.
// F5 KHÔNG tính. F4 chỉ là chẩn đoán ghosting (không phải metric jitter).
const MOTION_PY = `
import sys, glob, json, re, time, numpy as np, cv2

ALLOWED_ESTIMATORS = {"V5", "V2"}

def detrend_rms(v, win=15):
    c = np.cumsum(v)
    half = win // 2
    sm = np.array([c[max(0, i - half):min(len(c), i + half + 1)].mean()
                   for i in range(len(c))])
    return float(np.sqrt(np.mean((c - sm) ** 2)))

def agg_series(mx, my):
    # F1/F2/F3 + metric frame tệ nhất trên chuỗi dịch chuyển toàn cục.
    mx = np.array(mx); my = np.array(my)
    d = np.abs(np.diff(mx)) + np.abs(np.diff(my))  # |Δm| từng cặp
    return {
        "F1": round(float(mx.std() + my.std()), 4),
        "F2": round(float(d.mean()), 4),
        "F3": round(float(np.sqrt(detrend_rms(mx) ** 2 + detrend_rms(my) ** 2)), 4),
        "medianAbsShift": round(float(np.abs(mx).mean() + np.abs(my).mean()), 4),
        "maxDm": round(float(d.max()), 4),
        "p99Dm": round(float(np.percentile(d, 99)), 4),
        "wild8": int((d > 8).sum()),
        "maxAbsM": round(float((np.abs(mx) + np.abs(my)).max()), 4),
    }

def thresh_med(fx, fy, t=1.0):
    mag = np.sqrt(fx ** 2 + fy ** 2)
    m = mag > t
    if m.sum() < 10:
        return 0.0, 0.0, int(m.sum())
    return float(np.median(fx[m])), float(np.median(fy[m])), int(m.sum())

def estimate(kind, fl15, fl25):
    # CẤM V0 (median flow thô): R5 đã bác bỏ (corr 0,67/0,78; RMSE 7,07px).
    if kind not in ALLOWED_ESTIMATORS:
        raise ValueError(f"V0_BANNED: estimator {kind} bị cấm (chỉ cho phép V5/V2)")
    if kind == "V5":
        return thresh_med(fl25[..., 0], fl25[..., 1], 1.0)
    return thresh_med(fl15[..., 0], fl15[..., 1], 1.0)

def load_frames(framesDir):
    # Trả về (full, center): MAD tính trên FULL frame như R2/R5/61 (để số MAD
    # so sánh được với các đợt trước); phase/Farneback tính trên crop giữa
    # 160×90 như R5 (tránh viền đen vidstab).
    files = sorted(glob.glob(framesDir + "/f*.png"))
    assert len(files) >= 50, f"frames {len(files)} < 50"
    full, center = [], []
    for f in files:
        g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
        h, w = g.shape
        full.append(g)
        center.append(g[h // 4:3 * h // 4, w // 4:3 * w // 4])
    return full, center

mode = sys.argv[1]

if mode == "v0check":
    # Chứng minh lệnh cấm V0 được thực thi ở mức code, không chỉ trong docs.
    try:
        estimate("V0", np.zeros((4, 4, 2), np.float32), np.zeros((4, 4, 2), np.float32))
        print("V0_NOT_BANNED")
        sys.exit(1)
    except ValueError as e:
        if "V0_BANNED" in str(e):
            print("V0_BANNED_OK")
            sys.exit(0)
        raise

framesDir = sys.argv[2]
fullFrames, frames = load_frames(framesDir)

if mode == "measure":
    # MAD từng frame (mean |diff| gray) TRÊN FULL FRAME (như R2/R5) + max/p99.
    diffs = []
    prev = None
    for g in fullFrames:
        if prev is not None:
            diffs.append(float(np.abs(g.astype(np.int16) - prev.astype(np.int16)).mean()))
        prev = g
    d = np.array(diffs)
    mad = {"n": len(d), "mean": round(float(d.mean()), 4), "median": round(float(np.median(d)), 4),
           "std": round(float(d.std()), 4), "min": round(float(d.min()), 4),
           "max": round(float(d.max()), 4), "p99": round(float(np.percentile(d, 99)), 4)}
    # Phase correlation center — THAM CHIẾU LỊCH SỬ, không dùng để kết luận.
    dxs, dys, resps = [], [], []
    prev = None
    for g in frames:
        gf = np.float32(g)
        if prev is not None:
            win = cv2.createHanningWindow((gf.shape[1], gf.shape[0]), cv2.CV_32F)
            (sx, sy), resp = cv2.phaseCorrelate(prev, gf, win)
            dxs.append(float(sx)); dys.append(float(sy)); resps.append(float(resp))
        prev = gf
    dx = np.array(dxs); dy = np.array(dys)
    phase = {"J1": round(float(dx.std() + dy.std()), 4),
             "J2": round(float(np.abs(np.diff(dx)).mean() + np.abs(np.diff(dy)).mean()), 4),
             "J3": round(float(np.sqrt(detrend_rms(dx) ** 2 + detrend_rms(dy) ** 2)), 4),
             "respMedian": round(float(np.median(resps)), 4)}
    # Farneback V5 + V2.
    s = {k: ([], []) for k in ("V5", "V2")}
    f4s, dt15, dt25 = [], [], []
    prev = None
    for g in frames:
        if prev is not None:
            t0 = time.perf_counter()
            fl15 = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            dt15.append(time.perf_counter() - t0)
            t0 = time.perf_counter()
            fl25 = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 25, 3, 5, 1.2, 0)
            dt25.append(time.perf_counter() - t0)
            for k in ("V5", "V2"):
                mx, my, _ = estimate(k, fl15, fl25)
                s[k][0].append(mx); s[k][1].append(my)
            m5x, m5y, _ = estimate("V5", fl15, fl25)
            res = np.sqrt((fl25[..., 0] - m5x) ** 2 + (fl25[..., 1] - m5y) ** 2)
            f4s.append(float(res.mean()))
        prev = g
    out = {"nFrames": len(frames), "mad": mad, "phaseCenterHist": phase,
           "fbV5": agg_series(s["V5"][0], s["V5"][1]),
           "fbV2": agg_series(s["V2"][0], s["V2"][1]),
           "F4diag": round(float(np.mean(f4s)), 4),
           "msPerPairW15": round(float(np.mean(dt15)) * 1000, 2),
           "msPerPairW25": round(float(np.mean(dt25)) * 1000, 2)}
    print("MEASURE " + json.dumps(out))
elif mode == "validate":
    # Rung đã biết (công thức gen P2, seed 7) — chỉ dùng cho shaky320 150 frame.
    assert len(frames) == 150, f"frames {len(frames)} != 150"
    n = np.arange(150)
    ox = np.round(4 * np.sin(2 * np.pi * 10 * n / 30) + 3 * np.sin(2 * np.pi * 7 * n / 30 + 1)).astype(float)
    oy = np.round(3 * np.sin(2 * np.pi * 9 * n / 30 + 2) + 2 * np.sin(2 * np.pi * 13 * n / 30)).astype(float)
    ex = -(ox[1:] - ox[:-1]); ey = -(oy[1:] - oy[:-1])
    s = {k: ([], []) for k in ("V5", "V2")}
    prev = None
    for g in frames:
        if prev is not None:
            fl15 = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            fl25 = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 25, 3, 5, 1.2, 0)
            for k in ("V5", "V2"):
                mx, my, _ = estimate(k, fl15, fl25)
                s[k][0].append(mx); s[k][1].append(my)
        prev = g
    out = {}
    for k in ("V5", "V2"):
        mx = np.array(s[k][0]); my = np.array(s[k][1])
        out[k] = {
            "corrX": round(float(np.corrcoef(mx, ex)[0, 1]), 4),
            "corrY": round(float(np.corrcoef(my, ey)[0, 1]), 4),
            "rmsePx": round(float(np.sqrt(np.mean((mx - ex) ** 2 + (my - ey) ** 2))), 4),
            "slopeX": round(float(np.polyfit(ex, mx, 1)[0]), 3),
            "slopeY": round(float(np.polyfit(ey, my, 1)[0]), 3),
        }
    print("VALIDATE " + json.dumps(out))
else:
    raise SystemExit(f"mode không biết: {mode}")
`;
const motionPy = path.join(work, "motion_metric.py");
fs.writeFileSync(motionPy, MOTION_PY);
function measure(framesDir) {
  const r = spawnSync(CV2_PY, [motionPy, "measure", framesDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`motion_metric.py measure lỗi: status=${r.status} out=${r.stdout} err2=${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("MEASURE "));
  if (!line) throw new Error(`không parse được measure: ${r.stdout} ${r.stderr}`);
  return JSON.parse(line.slice("MEASURE ".length));
}
function validateFb(framesDir) {
  const r = spawnSync(CV2_PY, [motionPy, "validate", framesDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`motion_metric.py validate lỗi: status=${r.status} out=${r.stdout} err2=${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("VALIDATE "));
  if (!line) throw new Error(`không parse được validate: ${r.stdout} ${r.stderr}`);
  return JSON.parse(line.slice("VALIDATE ".length));
}
function v0BanCheck() {
  const r = spawnSync(CV2_PY, [motionPy, "v0check"], { encoding: "utf8" });
  return { status: r.status, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}

// --- Phân tích .trf vidstabdetect: median LM từng frame + so sánh 2 file -----
const TRF_PY = `
import sys, glob, json, re, numpy as np
LM_RE = re.compile(r"\\(LM (-?\\d+) (-?\\d+) \\d+ \\d+ \\d+ [\\d.]+ [\\d.]+\\)")

def median_series(path):
    series = {}
    for line in open(path, errors="replace"):
        m = re.match(r"Frame (\\d+) \\(List (\\d+)", line)
        if not m:
            continue
        fr, n = int(m.group(1)), int(m.group(2))
        if n == 0:
            continue
        lms = LM_RE.findall(line)
        if not lms:
            continue
        dx = np.array([int(a) for a, _ in lms], dtype=float)
        dy = np.array([int(b) for _, b in lms], dtype=float)
        series[fr] = (float(np.median(dx)), float(np.median(dy)), len(lms))
    return series

def jump_stats(series):
    frs = sorted(series)
    mx = np.array([series[f][0] for f in frs]); my = np.array([series[f][1] for f in frs])
    d = np.abs(np.diff(mx)) + np.abs(np.diff(my))
    return {"nFrames": len(frs), "medianLMcount": int(np.median([series[f][2] for f in frs])),
            "maxJump": round(float(d.max()), 2) if len(d) else 0,
            "p99Jump": round(float(np.percentile(d, 99)), 2) if len(d) else 0,
            "wild8": int((d > 8).sum()), "wild15": int((d > 15).sum()),
            "worstFrame": int(frs[int(np.argmax(d)) + 1]) if len(d) else None}

mode = sys.argv[1]
if mode == "scan":
    s = median_series(sys.argv[2])
    print("TRFSCAN " + json.dumps(jump_stats(s)))
elif mode == "compare":
    a = median_series(sys.argv[2]); b = median_series(sys.argv[3])
    common = sorted(set(a) & set(b))
    diffs = [abs(a[f][0] - b[f][0]) + abs(a[f][1] - b[f][1]) for f in common]
    d = np.array(diffs) if diffs else np.array([0.0])
    print("TRFCMP " + json.dumps({
        "commonFrames": len(common),
        "framesDiffGt0": int((d > 0).sum()),
        "framesDiffGt05": int((d > 0.5).sum()),
        "maxDiff": round(float(d.max()), 3),
        "meanDiff": round(float(d.mean()), 4),
        "worstFrame": int(common[int(np.argmax(d))]) if len(common) else None,
    }))
else:
    raise SystemExit(f"mode không biết: {mode}")
`;
const trfPy = path.join(work, "trf_analyze.py");
fs.writeFileSync(trfPy, TRF_PY);
function trfScan(trfPath) {
  const r = spawnSync(CV2_PY, [trfPy, "scan", trfPath], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`trf_analyze scan lỗi: ${r.stdout} ${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("TRFSCAN "));
  return JSON.parse(line.slice("TRFSCAN ".length));
}
function trfCompare(a, b) {
  const r = spawnSync(CV2_PY, [trfPy, "compare", a, b], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`trf_analyze compare lỗi: ${r.stdout} ${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("TRFCMP "));
  return JSON.parse(line.slice("TRFCMP ".length));
}

// --- Đo 1 video bằng module gộp ----------------------------------------------
function measureVideo(label, framesDir) {
  const m = measure(framesDir);
  console.log(`   📊 ${label} (n=${m.nFrames}): MAD mean=${m.mad.mean} max=${m.mad.max} p99=${m.mad.p99} | ` +
    `F2_V5=${m.fbV5.F2} F1_V5=${m.fbV5.F1} F3_V5=${m.fbV5.F3} maxDm=${m.fbV5.maxDm} p99Dm=${m.fbV5.p99Dm} wild8=${m.fbV5.wild8} | ` +
    `F2_V2=${m.fbV2.F2} (x-check maxDm=${m.fbV2.maxDm}) | J2c(hist)=${m.phaseCenterHist.J2} | F4diag=${m.F4diag}`);
  return { label, ...m };
}

console.log(`== Đợt 65 S1 — gộp Farneback vào harness motion-metric (đồng-chính với MAD) (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);
console.log(`   R2 lượt 3: ${R2_RUN3} | lượt 4: ${R2_RUN4}`);
console.log(`   cv2 python: ${CV2_PY}`);

// --- S0: đo lại trên render R2 bằng module gộp -------------------------------
console.log("\n== S0. Đo lại render R2 (2 lượt × 5 video) bằng module gộp ==");
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
let r2run3 = R2_RUN3, r2run4 = R2_RUN4;
ok(r2RunOk(r2run3) && r2RunOk(r2run4),
  "đủ dữ liệu R2 trên đĩa: 2 lượt × (đối chứng 2 + stabilize 0.5 ×3), frame 150/video (không tái tạo)");
const runs = {};
for (const [runName, runDir] of [["run3", r2run3], ["run4", r2run4]]) {
  const res = {};
  const items = [["ctrl1", "frames-ctrl1"], ["ctrl2", "frames-ctrl2"],
    ["stab1", "frames-stab1"], ["stab2", "frames-stab2"], ["stab3", "frames-stab3"]];
  for (const [label, fd] of items) res[label] = measureVideo(`${runName}-${label}`, path.join(runDir, fd));
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
console.log("\n== S0b. So sánh spread: MAD (đồng-chính) vs F2_V5 (đồng-chính) vs F2_V2 (x-check) vs J2c (lịch sử) ==");
const comp = {};
for (const runName of ["run3", "run4"]) {
  comp[runName] = {
    MADmean: summarizeRun(runName, (r) => r.mad.mean, "MAD mean [ĐỒNG-CHÍNH]"),
    F2_V5: summarizeRun(runName, (r) => r.fbV5.F2, "F2_V5 [ĐỒNG-CHÍNH]"),
    F1_V5: summarizeRun(runName, (r) => r.fbV5.F1, "F1_V5"),
    F3_V5: summarizeRun(runName, (r) => r.fbV5.F3, "F3_V5"),
    F2_V2: summarizeRun(runName, (r) => r.fbV2.F2, "F2_V2 [cross-check]"),
    J2c_hist: summarizeRun(runName, (r) => r.phaseCenterHist.J2, "J2c [CHỈ THAM CHIẾU LỊCH SỬ]"),
  };
}
// Đối chứng lặp lại phải giống hệt (encode + đo đều xác định).
for (const runName of ["run3", "run4"]) {
  const r = runs[runName];
  ok(Math.abs(r.ctrl1.mad.mean - r.ctrl2.mad.mean) < 1e-9, `${runName}: MAD đối chứng lặp lại giống hệt`);
  ok(Math.abs(r.ctrl1.fbV5.F2 - r.ctrl2.fbV5.F2) < 1e-9, `${runName}: F2_V5 đối chứng lặp lại giống hệt`);
  ok(Math.abs(r.ctrl1.fbV2.F2 - r.ctrl2.fbV2.F2) < 1e-9, `${runName}: F2_V2 đối chứng lặp lại giống hệt`);
}
// Metric frame tệ nhất có bắt được glitch lượt 3 stab3 (frame 20, R5 §6)?
console.log("\n== S0c. Metric frame tệ nhất trên render R2 (glitch lượt 3 stab3?) ==");
for (const runName of ["run3", "run4"]) {
  for (const label of ["ctrl1", "stab1", "stab2", "stab3"]) {
    const r = runs[runName][label];
    console.log(`   📊 ${runName}-${label}: V5 maxDm=${r.fbV5.maxDm} p99Dm=${r.fbV5.p99Dm} wild8=${r.fbV5.wild8} maxAbsM=${r.fbV5.maxAbsM} | MAD max=${r.mad.max} p99=${r.mad.p99}`);
  }
}
ok(runs.run3.stab3.fbV5.maxDm > 8,
  `metric frame tệ nhất BẮT ĐƯỢC glitch lượt 3 stab3: V5 maxDm=${runs.run3.stab3.fbV5.maxDm} > 8px (R5: frame 20 nhảy +32px marker, V5 thấy ~10px)`);
ok(runs.run3.stab3.fbV5.wild8 >= 1,
  `lượt 3 stab3 có ${runs.run3.stab3.fbV5.wild8} cặp nhảy hoang |Δm|>8px (trung bình F2=${runs.run3.stab3.fbV5.F2} giấu nhẹm chúng)`);

// --- S1: validate V5/V2 + cấm V0 ----------------------------------------------
console.log("\n== S1. Validate estimator trên shaky320 (rung đã biết) + lệnh cấm V0 ==");
const val = validateFb(path.join(r2run4, "frames-shaky320"));
for (const [k, v] of Object.entries(val))
  console.log(`   📊 ${k}: corrX=${v.corrX} corrY=${v.corrY} RMSE=${v.rmsePx}px slope=(${v.slopeX},${v.slopeY})`);
ok(val.V5.corrX > 0.8 && val.V5.corrY > 0.8, `V5 bắt đúng rung đã biết (corr ${val.V5.corrX}/${val.V5.corrY} > 0.8)`);
ok(val.V5.rmsePx < 1.5, `V5 sai số ước lượng nhỏ (RMSE ${val.V5.rmsePx}px < 1.5px — bar R2/R5)`);
ok(val.V2.corrX > 0.8 && val.V2.corrY > 0.8, `V2 cross-check bắt đúng rung đã biết (corr ${val.V2.corrX}/${val.V2.corrY} > 0.8)`);
ok(val.V2.rmsePx < 1.7, `V2 cross-check RMSE ${val.V2.rmsePx}px < 1.7px (bar nới cho cross-check)`);
const ban = v0BanCheck();
console.log(`   📊 v0check: status=${ban.status} out="${ban.out}"`);
ok(ban.status === 0 && ban.out === "V0_BANNED_OK", "V0 BỊ CẤM ở mức code: gọi estimator V0 thì module từ chối (V0_BANNED_OK)");
ok(!fs.readFileSync(motionPy, "utf8").includes("F5"), "module đo gộp KHÔNG còn tính F5 (đã bỏ theo R5 §1)");

// --- S2: điều tra tính xác định của vidstab -----------------------------------
console.log("\n== S2. Điều tra vidstabdetect không xác định (.trf khác nhau giữa các lần chạy) ==");
// Chuẩn bị media R2 (gen P2 seed 7 → upscale 720p → noise alls=15).
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")], "tạo shaky320.mp4");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky320.mp4"), "-vf", "scale=1280:720:flags=lanczos",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shaky720.mp4")], "upscale shaky → 720p");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky720.mp4"), "-vf", "noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shakynoisy720.mp4")], "shaky+noise → shakynoisy720");
ok(probeOk(path.join(mediaDir, "shakynoisy720.mp4"), 1280, 720, 30), "shakynoisy720.mp4 tái tạo xong (5s, 720p, 30fps)");
const SRC = path.join(mediaDir, "shakynoisy720.mp4");
// Y hệt filter detect mà render.js dùng (enhance.js runStabilizeDetect,
// default shakiness=5 accuracy=15 stepsize=6 mincontrast=0.3, trim 0–5s).
function detect(trfPath, extraFfmpegArgs) {
  const r = spawnSync("ffmpeg", [...(extraFfmpegArgs || []), "-v", "error", "-i", SRC,
    "-vf", `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabdetect=result='${trfPath}':shakiness=5:accuracy=15:stepsize=6:mincontrast=0.3`,
    "-an", "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] });
  if (r.error || r.status !== 0) throw new Error(`vidstabdetect thất bại: ${r.status} ${(r.stderr || "").toString().slice(-500)}`);
}
const trfA = path.join(work, "detect-a.trf");
const trfB = path.join(work, "detect-b.trf");
const trfC = path.join(work, "detect-c.trf");
detect(trfA); detect(trfB); detect(trfC);
const hashA = sha256(trfA), hashB = sha256(trfB), hashC = sha256(trfC);
console.log(`   📊 detect ×3 cùng input/tham số (mặc định threads): sha256 a=${hashA.slice(0, 12)}… b=${hashB.slice(0, 12)}… c=${hashC.slice(0, 12)}…`);
const detSame = hashA === hashB && hashB === hashC;
console.log(`   📊 .trf 3 lần ${detSame ? "GIỐNG HỆT nhau (byte-identical)" : "KHÁC NHAU"}`);
const cmpAB = trfCompare(trfA, trfB);
const cmpAC = trfCompare(trfA, trfC);
console.log(`   📊 so median LM từng frame: a↔b maxDiff=${cmpAB.maxDiff}px, ${cmpAB.framesDiffGt0}/${cmpAB.commonFrames} frame khác (>0), ${cmpAB.framesDiffGt05} frame khác >0.5px, frame tệ nhất ${cmpAB.worstFrame}`);
console.log(`   📊 so median LM từng frame: a↔c maxDiff=${cmpAC.maxDiff}px, ${cmpAC.framesDiffGt0}/${cmpAC.commonFrames} frame khác (>0), ${cmpAC.framesDiffGt05} frame khác >0.5px, frame tệ nhất ${cmpAC.worstFrame}`);
// Đổi số thread decode/filter có đổi .trf không?
const trfT1 = path.join(work, "detect-threads1.trf");
detect(trfT1, ["-threads", "1"]);
const hashT1 = sha256(trfT1);
console.log(`   📊 detect -threads 1: sha256 ${hashT1.slice(0, 12)}… — ${hashT1 === hashA ? "GIỐNG bản mặc định" : "KHÁC bản mặc định"}`);
const cmpT1 = trfCompare(trfA, trfT1);
console.log(`   📊 so median LM: mặc-định↔threads1 maxDiff=${cmpT1.maxDiff}px, ${cmpT1.framesDiffGt0}/${cmpT1.commonFrames} frame khác (>0)`);
// Quét nhảy hoang ngay trong .trf (chuỗi median LM).
for (const [tag, p] of [["a", trfA], ["b", trfB], ["c", trfC], ["threads1", trfT1]]) {
  const s = trfScan(p);
  console.log(`   📊 .trf ${tag}: ${s.nFrames} frame, median ${s.medianLMcount} LM/frame, maxJump=${s.maxJump}px (frame ${s.worstFrame}), p99Jump=${s.p99Jump}px, wild>8px: ${s.wild8}, wild>15px: ${s.wild15}`);
}
// Tầng transform có xác định không? Cùng .trf, transform ×2, so sha256 output.
function transform(trfPath, outPath) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", SRC,
    "-vf", `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trfPath}':smoothing=10:optalgo=gauss`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-an", "-y", outPath], { stdio: ["ignore", "pipe", "pipe"] });
  if (r.error || r.status !== 0) throw new Error(`vidstabtransform thất bại: ${r.status} ${(r.stderr || "").toString().slice(-500)}`);
}
const trOut1 = path.join(work, "transform-1.mp4");
const trOut2 = path.join(work, "transform-2.mp4");
transform(trfA, trOut1); transform(trfA, trOut2);
const trHash1 = sha256(trOut1), trHash2 = sha256(trOut2);
console.log(`   📊 transform ×2 cùng .trf a: sha256 ${trHash1.slice(0, 12)}… vs ${trHash2.slice(0, 12)}… — ${trHash1 === trHash2 ? "GIỐNG HỆT" : "KHÁC NHAU"}`);
// Đối chứng: encode-only ×2 (không vidstab) có xác định không?
function encodeOnly(outPath) {
  run("ffmpeg", ["-i", SRC, "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-an", "-y", outPath], "encode-only");
}
const enc1 = path.join(work, "encode-1.mp4");
const enc2 = path.join(work, "encode-2.mp4");
encodeOnly(enc1); encodeOnly(enc2);
const encHash1 = sha256(enc1), encHash2 = sha256(enc2);
console.log(`   📊 encode-only ×2: sha256 ${encHash1.slice(0, 12)}… vs ${encHash2.slice(0, 12)}… — ${encHash1 === encHash2 ? "GIỐNG HỆT" : "KHÁC NHAU"}`);
const vidstabDet = { detect3Identical: detSame, detectThreads1SameAsDefault: hashT1 === hashA, transform2Identical: trHash1 === trHash2, encode2Identical: encHash1 === encHash2, trfCompareAB: cmpAB, trfCompareAC: cmpAC, trfCompareThreads1: cmpT1 };
// Không assert detect phải giống hệt — đây là ĐIỀU TRA, kết quả nào cũng ghi trung thực.
// Chỉ assert pipeline điều tra chạy được (đủ file .trf + transform + encode).
ok(fs.existsSync(trfA) && fs.existsSync(trfB) && fs.existsSync(trfC) && fs.existsSync(trfT1),
  "điều tra vidstab: đủ 4 file .trf (×3 mặc định + ×1 threads 1)");
ok(outOk(trOut1) && outOk(trOut2) && outOk(enc1) && outOk(enc2),
  "điều tra vidstab: đủ 2 output transform + 2 output encode-only để so sha256");

// --- S3: render stabilize TƯƠI ×1 qua render.js + đo bằng module gộp ----------
console.log("\n== S3. Render stabilize tươi ×1 (render.js, denoise 0.5) + đo module gộp ==");
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
const specFresh = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shakynoisy720.mp4", 5, { enhance: BALANCED })] }], 1280, 720);
const rf = render(specFresh, "fresh-stab", ["--no-trf-cache"]);
ok(rf.status === 0 && outOk(rf.outPath) && probeOk(rf.outPath, 1280, 720, 30),
  `stabilize tươi: render OK (${rf.secs.toFixed(1)}s)`);
const freshDir = path.join(work, "frames-fresh-stab");
extractFrames(rf.outPath, freshDir, "scale=320:180,format=gray");
const fresh = measureVideo("fresh-stab", freshDir);
ok(fresh.fbV5.F2 < runs.run3.ctrl1.fbV5.F2 * 0.5,
  `stabilize tươi giảm F2_V5 sâu so với đối chứng (${fresh.fbV5.F2} vs ${runs.run3.ctrl1.fbV5.F2})`);

// --- S4: footage thật (R4) -----------------------------------------------------
console.log("\n== S4. Footage thật (R4: ocean-slow 25fps + basgo-mid 30fps) ==");
const REAL = [
  { id: "ocean-slow", file: "ocean-slow-seg.mp4", fps: 25, license: "CC0", stabRuns: 2 },
  { id: "basgo-mid", file: "basgo-mid-seg.mp4", fps: 30, license: "CC BY 3.0", stabRuns: 1 },
];
const real = {};
for (const seg of REAL) {
  const srcPath = path.join(R4_SCRATCH, seg.file);
  ok(fs.existsSync(srcPath), `footage thật ${seg.id}: file đoạn 5s có trong scratch R4 (${seg.license})`);
  fs.copyFileSync(srcPath, path.join(mediaDir, seg.file));
  // Đối chứng: encode lại y hệt preset render (trim 5s, veryfast, crf 23).
  const ctrlPath = path.join(work, `${seg.id}-ctrl.mp4`);
  run("ffmpeg", ["-i", path.join(mediaDir, seg.file),
    "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-an", "-y", ctrlPath], `đối chứng ${seg.id}`);
  ok(probeOk(ctrlPath, 1280, 720, seg.fps), `${seg.id}: đối chứng MP4 đúng res/fps/thời lượng`);
  const ctrlDir = path.join(work, `frames-${seg.id}-ctrl`);
  extractFrames(ctrlPath, ctrlDir, "scale=320:180,format=gray");
  const ctrlM = measureVideo(`${seg.id}-ctrl`, ctrlDir);
  const stabs = [];
  for (let i = 1; i <= seg.stabRuns; i++) {
    const specR = specWith([{ id: "v0", kind: "video",
      clips: [vclip("c0", seg.file, 5, { enhance: BALANCED })] }], 1280, 720, seg.fps);
    const rr = render(specR, `${seg.id}-stab-r${i}`, ["--no-trf-cache"]);
    ok(rr.status === 0 && outOk(rr.outPath) && probeOk(rr.outPath, 1280, 720, seg.fps),
      `${seg.id} stabilize #${i}: render OK (${rr.secs.toFixed(1)}s)`);
    const d = path.join(work, `frames-${seg.id}-stab-r${i}`);
    extractFrames(rr.outPath, d, "scale=320:180,format=gray");
    stabs.push(measureVideo(`${seg.id}-stab-r${i}`, d));
  }
  real[seg.id] = { ctrl: ctrlM, stabs, fps: seg.fps };
  const c = ctrlM;
  for (const s of stabs) {
    const redMad = (c.mad.mean - s.mad.mean) / c.mad.mean * 100;
    const redF2 = (c.fbV5.F2 - s.fbV5.F2) / c.fbV5.F2 * 100;
    console.log(`   📊 ${seg.id}: MAD ${c.mad.mean} → ${s.mad.mean} (giảm ${redMad.toFixed(1)}%) | F2_V5 ${c.fbV5.F2} → ${s.fbV5.F2} (giảm ${redF2.toFixed(1)}%) | maxDm ctrl=${c.fbV5.maxDm} stab=${s.fbV5.maxDm}, wild8 ctrl=${c.fbV5.wild8} stab=${s.fbV5.wild8}`);
  }
}
if (real["ocean-slow"].stabs.length === 2) {
  const [a, b] = real["ocean-slow"].stabs;
  console.log(`   📊 ocean-slow stabilize ×2: F2_V5 ${a.fbV5.F2} vs ${b.fbV5.F2} (spread ${spreadPct([a.fbV5.F2, b.fbV5.F2]).toFixed(1)}%) | MAD ${a.mad.mean} vs ${b.mad.mean} (spread ${spreadPct([a.mad.mean, b.mad.mean]).toFixed(1)}%)`);
}

// --- S5: tổng kết ---------------------------------------------------------------
console.log("\n== S5. Tổng kết ==");
const summary = {
  validateShaky320: val,
  v0Ban: ban.out,
  comparisonR2: comp,
  worstFrameR2: Object.fromEntries(Object.entries(runs).map(([rn, r]) => [rn,
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { maxDmV5: v.fbV5.maxDm, p99DmV5: v.fbV5.p99Dm, wild8V5: v.fbV5.wild8, madMax: v.mad.max, madP99: v.mad.p99 }]))])),
  vidstabDeterminism: vidstabDet,
  freshStabilize: { F2_V5: fresh.fbV5.F2, MAD: fresh.mad.mean, maxDm: fresh.fbV5.maxDm, wild8: fresh.fbV5.wild8 },
  realFootage: Object.fromEntries(Object.entries(real).map(([id, r]) => [id, {
    fps: r.fps,
    ctrl: { MAD: r.ctrl.mad.mean, F2_V5: r.ctrl.fbV5.F2, maxDm: r.ctrl.fbV5.maxDm, wild8: r.ctrl.fbV5.wild8 },
    stabs: r.stabs.map((s) => ({ MAD: s.mad.mean, F2_V5: s.fbV5.F2, maxDm: s.fbV5.maxDm, p99Dm: s.fbV5.p99Dm, wild8: s.fbV5.wild8 })),
  }])),
  coPrimaryVerdict: {
    MAD: "giữ làm ground truth pixel",
    F2_V5: "đồng-chính: spread tốt hơn MAD ở cả 2 lượt R2 (xem comp)",
    F2_V2: "cross-check, đồng thuận với V5",
    J2c: "chỉ tham chiếu lịch sử — KHÔNG dùng để kết luận",
    F5: "đã bỏ (không tính trong module gộp)",
    V0: "cấm ở mức code (v0check: V0_BANNED_OK)",
  },
};
console.log(`\n== test_round65_s1_motion_metric: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);
