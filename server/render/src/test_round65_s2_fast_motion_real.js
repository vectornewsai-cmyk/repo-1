#!/usr/bin/env node
/**
 * test_round65_s2_fast_motion_real.js — Phase 9 đợt 65, luồng S2.
 *
 * Nợ đợt 64 §8 mục 2 (LIMITS gộp §4 + R2 §6/R4 §8): hiệu chuẩn ngưỡng
 * detector R2 (fastMotion, FAST=6,0/MEDIUM=4,0) trên FOOTAGE QUAY THẬT +
 * pan 12px/frame; thống nhất cảnh báo denoise ≥0,7 với kết luận R4.
 *
 * Căng thẳng R2↔R4 cần giải quyết (LIMITS gộp §4):
 *  - R2: chỉ cảnh báo denoise ≥0,7 khi detector nói clip NHANH (FAST ≥ 6,0),
 *    hiệu chuẩn trên 7 clip tổng hợp.
 *  - R4: trên footage thật, bước nhảy ghost b_small 0,5→0,7 gần như KHÔNG
 *    ĐỔI theo tốc độ trong dải 0,6–7,9 px/f (+0,057–0,077), kể cả camera
 *    gần như đứng yên — kết luận "nếu có cảnh báo thì áp ở ≥0,7 bất kể
 *    tốc độ (trong dải đã đo)".
 *
 * Harness này đo 3 thứ trên footage thật (không đoán):
 *  A. Detector score trên 4 đoạn thật của R4 (tái dùng *-seg.mp4 đã có,
 *     nguồn đã verify SHA256 ở R4 — kiểm lại ở đây) + 4 clip pan ~12px/f
 *     dựng từ footage thật (xem dưới).
 *  B. Ghost b_small ở pan ~12px/f (render thật qua render.js, ctrl/0,5/
 *     0,7/0,8) — nhảy 0,5→0,7 có còn ~0,06 như R4 hay tăng theo tốc độ?
 *  C. Bảng false positive / false negative của cổng cảnh báo CŨ (chỉ fast
 *     mới cảnh báo) so với quy tắc MỚI (cảnh báo ở ≥0,7 với mọi mức đo
 *     được — slow/medium/fast; unknown vẫn cảnh báo chung).
 *
 * Pan 12px/f "dựng từ footage thật" (đúng gợi ý R4 §8 — không dùng crop
 * ảnh tĩnh như R2): lấy cửa sổ 960×540 trong footage thật rồi trượt
 * 9px/frame ở 30fps, scale lên 1280×720 → 12px/frame ở đầu ra; cửa sổ
 * 1280×720 trượt 12px/frame trực tiếp làm đối chứng native (không upscale).
 * Nền: ocean t=0 (camera gần như đứng yên, 0,54 px/f) và slovenska t=30
 * (cửa sổ tĩnh nhất, 0,59 px/f, resp 0,86 — xem scan-slovenska.json đợt 64).
 * Tốc độ CUỐI được đo lại bằng phase correlation trên đúng clip đã dựng
 * (không lấy số danh nghĩa làm kết quả).
 *
 * Footage (tái dùng file đợt 64 R4, license rõ ràng — KHÔNG đưa vào batch):
 *   - ocean06.ogv — Wikimedia Commons, CC0, Mostafameraji.
 *   - basgo.webm — Wikimedia Commons, CC BY 3.0.
 *   - slovenska.webm — Wikimedia Commons, CC BY 3.0.
 * Clip tĩnh tổng hợp (đối chứng false-positive cho quy tắc mới): texture
 * seed 64 như R2 (GEN_PY giống hệt test_round64_r2_fast_motion.js).
 *
 * Phương pháp ghost Y HỆT R4 (render.js veryfast/CRF23, frame gray thô,
 * hồi quy b theo dải |dC|; kết luận trên PHẦN VƯỢT SÀN b − b_ctrl).
 *
 * Cách chạy: node server/render/src/test_round65_s2_fast_motion_real.js
 * (cần ffmpeg/ffprobe, python3 + numpy/PIL, tracking .venv cho cv2).
 * Thư mục làm việc cố định ~/workspace/.scratch-r65s2, resumable:
 * render/đoạn/frame đã có sẽ tái dùng; kết quả ghost đã tính được cache
 * vào ghost-<tag>.json để chạy lại không tính lại. KHÔNG ghi gì vào repo
 * ngoài file harness này + LIMITS. Thời gian ~15–30 phút tùy tải VM.
 * LỊCH SỬ CHẠY: run 1 bị giết giữa chừng ở B3 (phiên nền mất — tiền lệ
 * đợt 63) sau khi đã đo xong A1/A2/B/B2; số run 1 giữ nguyên trong log và
 * được run 2 tái hiện (pipeline xác định). Bản sửa sau run 1: assert đối
 * chứng tĩnh (B2) sai — áp assert clip chuyển động lên clip tĩnh tuyệt
 * đối (dải small suy biến 0,02% pixel) nên fail 3 assert dù số đo đúng
 * (nhảy −0,0054 ≈ 0); đã đổi sang assert đúng cho đối chứng tĩnh + thêm
 * cache ghost. Xem LIMITS §7.
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  measureMotion,
  classifyMotion,
  shouldWarnDenoiseGhosting,
  FAST_THRESHOLD,
  MEDIUM_THRESHOLD,
  DENOISE_WARN_STRENGTH,
} = require("./fastMotion");

const work = path.join(process.env.HOME, "workspace", ".scratch-r65s2");
fs.mkdirSync(work, { recursive: true });
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const CV2_PY = path.join(RENDER, "..", "tracking", ".venv", "bin", "python");
const R4_SCRATCH = path.join(process.env.HOME, "workspace", ".scratch-r64r4-9h00Sj");

// Clip gốc đợt 64 R4 (tái dùng + kiểm sha256 ở đây, không tải lại).
const CLIPS = {
  ocean06: {
    file: "ocean06.ogv",
    sha256: "4b9e690dce0108898809314213cab90945c1f9dc0c4c46831e650a871c598d3e",
    fps: 25, license: "CC0",
  },
  basgo: {
    file: "basgo.webm",
    sha256: "7ed32bc7d0a8b9532fce46140c38622dee8c743cd1ad3cdb951631021263ad93",
    fps: 30, license: "CC BY 3.0",
  },
  slovenska: {
    file: "slovenska.webm",
    sha256: "ae8f684c170da8e0ac10f00b62705d51c121a80a05414008c6726491ecd63db5",
    fps: 25, license: "CC BY 3.0",
  },
};

// 4 đoạn thật của R4 (đoạn 5s 1280×720 CRF18 đã có sẵn) + tốc độ phase
// correlation đã đo ở R4 (đo lại ở đây để kiểm chứng, không tin mù).
const R4_SEGMENTS = [
  { id: "ocean-slow", clip: "ocean06", speedNote: "0.60 px/f", expectScore: 0.714, expectLevel: "slow", jump0507: 0.058 },
  { id: "basgo-mid", clip: "basgo", speedNote: "2.48 px/f", expectScore: 1.649, expectLevel: "slow", jump0507: 0.071 },
  { id: "basgo-fast", clip: "basgo", speedNote: "5.98 px/f", expectScore: 2.909, expectLevel: "slow", jump0507: 0.057 },
  { id: "slov-fast", clip: "slovenska", speedNote: "7.86 px/f", expectScore: 6.471, expectLevel: "fast", jump0507: 0.077 },
];

// Pan ~12px/f dựng từ footage thật (xem đầu file). duration 3.5s @30fps.
const PAN12 = [
  { id: "ocean-pan12", clip: "ocean06", seek: 0, kind: "upscaled", speedNote: "danh nghĩa 12 px/f" },
  { id: "slov-pan12", clip: "slovenska", seek: 30, kind: "upscaled", speedNote: "danh nghĩa 12 px/f" },
  { id: "ocean-pan12-native", clip: "ocean06", seek: 0, kind: "native", speedNote: "danh nghĩa 12 px/f" },
  { id: "slov-pan12-native", clip: "slovenska", seek: 30, kind: "native", speedNote: "danh nghĩa 12 px/f" },
];

const STRENGTHS = [0.5, 0.7, 0.8];

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
const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r65s2", width: W, height: H, fps },
  tracks,
});
function render(spec, name) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const prev = probeVideo(outPath);
  if (fs.existsSync(outPath) && prev.codec === "h264" && prev.width === 1280 && prev.height === 720) {
    return { status: 0, stdout: "", stderr: "", outPath, secs: 0, reused: true };
  }
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, stdout: (r.stdout || "").toString(), stderr: (r.stderr || "").toString(), outPath, secs };
}
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  if (r.status !== 0) return {};
  const j = JSON.parse(r.stdout || "{}");
  const s = (j.streams || [])[0] || {};
  return { codec: s.codec_name, width: s.width, height: s.height, duration: parseFloat((j.format || {}).duration || "0") };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function extractFrames(mp4, dir, expectN) {
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).filter((f) => f.endsWith(".gray")).length;
  if (existing === expectN) return existing;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-i", mp4, "-vf", "format=gray", "-f", "image2", "-c:v", "rawvideo", "-pix_fmt", "gray",
    "-vsync", "0", path.join(dir, "f%04d.gray")], `tách frame ${path.basename(mp4)}`);
  return fs.readdirSync(dir).filter((f) => f.endsWith(".gray")).length;
}

// --- Script đo ghost (y hệt R4: ghost_real.py trong scratch R4) ------------
const GHOST_PY = `
import sys, json, glob
import numpy as np
W, H = 1280, 720
SZ = W * H
cleanDir = sys.argv[1]
jobs = []
for a in sys.argv[2:]:
    lab, d = a.split("=", 1)
    jobs.append((lab, d))
def load(p):
    a = np.fromfile(p, dtype=np.uint8)
    assert a.size == SZ, f"{p}: {a.size} != {SZ}"
    return a.reshape(H, W).astype(np.int16)
cf = sorted(glob.glob(cleanDir + "/f*.gray"))
N = len(cf)
assert N >= 60, f"clean frames {N} < 60"
print(f"REAL_FRAMES usable={N - 1} total={N}")
clean = [load(f) for f in cf]
bands_id = {}
dCs = {}
for t in range(1, N):
    dC = clean[t] - clean[t - 1]
    a = np.abs(dC)
    b = np.zeros(a.shape, dtype=np.uint8)
    b[(a > 2) & (a <= 8)] = 1
    b[(a > 8) & (a <= 24)] = 2
    b[a > 24] = 3
    bands_id[t] = b
    dCs[t] = dC
counts = np.zeros(4)
for t in list(bands_id)[:5]:
    c = np.bincount(bands_id[t].ravel(), minlength=4)
    counts += c
npx = W * H * 5
names = ["flat", "small", "mid", "large"]
print("REAL_PIXELS " + json.dumps({names[i]: round(float(counts[i]) / npx * 100, 2) for i in range(4)}))
for lab, rdir in jobs:
    rf = sorted(glob.glob(rdir + "/f*.gray"))
    assert len(rf) == N, f"{lab}: frames {len(rf)} != {N}"
    trail = {b: [] for b in names}
    bs = []
    bandNum = np.zeros(4)
    bandDen = np.zeros(4)
    for t in range(1, N):
        d = load(rf[t]).astype(np.float64) - clean[t].astype(np.float64)
        dC = dCs[t].astype(np.float64)
        ad = np.abs(d)
        bid = bands_id[t].ravel()
        cnt = np.bincount(bid, minlength=4).astype(np.float64)
        sAd = np.bincount(bid, weights=ad.ravel(), minlength=4)
        for i, b in enumerate(names):
            trail[b].append(float(sAd[i] / cnt[i]) if cnt[i] > 0 else 0.0)
        bandNum += np.bincount(bid, weights=(d.ravel() * dC.ravel()), minlength=4)
        bandDen += np.bincount(bid, weights=(dC.ravel() ** 2), minlength=4)
        mv = bid > 0
        den = float((dC.ravel()[mv] ** 2).sum())
        num = float((d.ravel()[mv] * dC.ravel()[mv]).sum())
        bs.append(-num / den if den > 0 else 0.0)
    out = {"label": lab, "frames": N - 1}
    for b in names:
        a = np.array(trail[b])
        out[b] = {"mean": round(float(a.mean()), 4), "median": round(float(np.median(a)), 4),
                  "p90": round(float(np.percentile(a, 90)), 4), "max": round(float(a.max()), 4)}
    ba = np.array(bs)
    out["blend"] = {"mean": round(float(ba.mean()), 4), "median": round(float(np.median(ba)), 4),
                    "p90": round(float(np.percentile(ba, 90)), 4)}
    out["blendByBand"] = {names[i]: (round(float(-bandNum[i] / bandDen[i]), 4) if bandDen[i] > 0 else 0.0)
                          for i in range(4)}
    print("REAL_GHOST " + json.dumps(out))
`;
const ghostPy = path.join(work, "ghost_real.py");
fs.writeFileSync(ghostPy, GHOST_PY);

// --- Script đo tốc độ đoạn (phase correlation, y hệt R4) --------------------
const SCAN_PY = `
import sys, json, os, subprocess, tempfile, glob
import numpy as np
import cv2
clip = sys.argv[1]
tmp = tempfile.mkdtemp(prefix="scan-seg-")
cmd = ["ffmpeg", "-v", "error", "-i", clip, "-vf", "scale=640:360,format=gray",
       os.path.join(tmp, "f%06d.png")]
r = subprocess.run(cmd, capture_output=True, text=True)
assert r.returncode == 0, r.stderr[-500:]
frames = sorted(glob.glob(os.path.join(tmp, "f*.png")))
probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                        "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", clip],
                       capture_output=True, text=True).stdout.strip()
num, den = probe.split("/")
fps = float(num) / float(den)
dt = 1.0 / fps
spd, resp, prev = [], [], None
for f in frames:
    g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    h, w = g.shape
    cw, ch = w // 2, h // 2
    cx, cy = (w - cw) // 2, (h - ch) // 2
    g = g[cy:cy + ch, cx:cx + cw].astype(np.float32)
    if prev is not None:
        win = cv2.createHanningWindow((g.shape[1], g.shape[0]), cv2.CV_32F)
        (sx, sy), rp = cv2.phaseCorrelate(prev, g, win)
        spd.append(float(np.hypot(sx, sy)) * 2.0 / dt)
        resp.append(float(rp))
    prev = g
print(json.dumps({"frames": len(frames), "fps": fps,
  "median_px_s": round(float(np.median(spd)), 2),
  "median_px_per_frame_720p": round(float(np.median(spd)) / fps, 2),
  "p90_px_s": round(float(np.percentile(spd, 90)), 2),
  "resp_median": round(float(np.median(resp)), 3), "n_pairs": len(spd)}))
for f in frames:
    os.unlink(f)
os.rmdir(tmp)
`;
const scanPy = path.join(work, "scan_seg.py");
fs.writeFileSync(scanPy, SCAN_PY);

function measureSpeed(segMp4) {
  const r = spawnSync(CV2_PY, [scanPy, segMp4], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`scan toc do loi: ${r.stdout} ${r.stderr}`);
  return JSON.parse((r.stdout || "").trim().split("\n").pop());
}

function ghostOf(cleanDir, renderJobs, cacheTag, expectN) {
  // Cache: kết quả ghost đã tính được lưu ghost-<tag>.json; chạy lại tái
  // dùng khi frame còn đủ số lượng (pipeline xác định — số tái hiện y hệt,
  // R4 đã chứng minh) để phiên nền bị giết giữa chừng không mất công tính
  // lại. Cache chỉ hợp lệ khi đúng số frame kỳ vọng ở mọi thư mục.
  const cachePath = cacheTag ? path.join(work, `ghost-${cacheTag}.json`) : null;
  if (cachePath && fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      const dirsOk = [cleanDir, ...renderJobs.map(([, d]) => d)].every((d) => {
        try { return fs.readdirSync(d).filter((f) => f.endsWith(".gray")).length === expectN; }
        catch { return false; }
      });
      if (dirsOk && cached.expectN === expectN && cached.results) {
        console.log(`   ♻️ ghost ${cacheTag}: tái dùng kết quả đã tính (${cachePath})`);
        return cached;
      }
    } catch { /* cache hỏng → tính lại */ }
  }
  const args = [ghostPy, cleanDir];
  for (const [lab, dir] of renderJobs) args.push(`${lab}=${dir}`);
  const r = spawnSync("python3", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ghost_real.py loi: ${r.stdout} ${r.stderr}`);
  const framesLine = (r.stdout || "").split("\n").find((l) => l.startsWith("REAL_FRAMES "));
  const pixelsLine = (r.stdout || "").split("\n").find((l) => l.startsWith("REAL_PIXELS "));
  const out = { frames: framesLine, pixels: JSON.parse(pixelsLine.slice("REAL_PIXELS ".length)), results: {}, expectN };
  for (const line of (r.stdout || "").split("\n")) {
    if (line.startsWith("REAL_GHOST ")) {
      const j = JSON.parse(line.slice("REAL_GHOST ".length));
      out.results[j.label] = j;
    }
  }
  if (Object.keys(out.results).length !== renderJobs.length) {
    throw new Error(`không parse đủ ghost: ${r.stdout} ${r.stderr}`);
  }
  if (cachePath) fs.writeFileSync(cachePath, JSON.stringify(out, null, 1));
  return out;
}

console.log(`== Đợt 65 S2 — hiệu chuẩn detector R2 trên footage thật + pan 12px/f (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- Clip gốc: tái dùng file đợt 64 R4 + verify sha256 ----------------------
console.log("\n== Clip gốc (tái dùng đợt 64 R4, verify sha256) ==");
for (const [key, c] of Object.entries(CLIPS)) {
  const dest = path.join(work, c.file);
  const prev = path.join(R4_SCRATCH, c.file);
  if (!fs.existsSync(prev)) throw new Error(`không thấy clip gốc đợt 64: ${prev}`);
  if (sha256(prev) !== c.sha256) throw new Error(`sha256 ${c.file} đợt 64 không khớp nguồn đã ghi`);
  fs.copyFileSync(prev, dest);
  const p = probeVideo(dest);
  ok(p.width === 1920 && p.height === 1080, `${c.file}: probe OK (${p.width}x${p.height}, ${p.duration.toFixed(1)}s, ${c.license})`);
  fs.copyFileSync(dest, path.join(mediaDir, c.file));
}

const summary = { segments: {}, pan12: {}, staticClean: null, fpFn: {} };

// --- A1. Detector trên 4 đoạn thật của R4 ------------------------------------
console.log("\n== A1. Detector trên 4 đoạn thật của R4 (tái dùng *-seg.mp4) ==");
for (const seg of R4_SEGMENTS) {
  const segPath = path.join(R4_SCRATCH, `${seg.id}-seg.mp4`);
  const sp = probeVideo(segPath);
  ok(sp.codec === "h264" && sp.width === 1280 && sp.height === 720 && Math.abs(sp.duration - 5) < 0.15,
    `${seg.id}: đoạn 5s 1280x720 OK (${sp.duration.toFixed(2)}s, ${seg.speedNote})`);
  const m = measureMotion(segPath);
  console.log(`   📊 ${seg.id} (${seg.speedNote}): score=${m.score} level=${m.level} median=${m.medianAbsDiff} p90=${m.p90AbsDiff} smallBand=${m.smallBandShare} nPairs=${m.nPairs}`);
  ok(Math.abs(m.score - seg.expectScore) < 0.05,
    `${seg.id}: score tái hiện số đo tay (${m.score} ≈ ${seg.expectScore} ±0,05 — pipeline xác định)`);
  ok(m.level === seg.expectLevel, `${seg.id}: level ${m.level} đúng như đo tay (${seg.expectLevel})`);
  summary.segments[seg.id] = { speedNote: seg.speedNote, jump0507_r4: seg.jump0507, detector: m };
}

// --- A2. Dựng pan 12px/f từ footage thật + đo tốc độ + detector -------------
console.log("\n== A2. Pan ~12px/f dựng từ footage thật ==");
for (const p of PAN12) {
  const clip = CLIPS[p.clip];
  const outPath = path.join(work, `${p.id}.mp4`);
  const prev = probeVideo(outPath);
  const dur = p.kind === "native" ? 1.75 : 3.5;
  if (fs.existsSync(outPath) && prev.codec === "h264" && prev.width === 1280 && prev.height === 720 && Math.abs(prev.duration - dur) < 0.15) {
    console.log(`   📹 ${p.id}: đã có, tái dùng`);
  } else {
    const vf = p.kind === "native"
      ? "fps=30,crop=1280:720:x='12*n':y=180,format=yuv420p"
      : "fps=30,crop=960:540:x='9*n':y=270,scale=1280:720,format=yuv420p";
    const args = ["-v", "error", "-y", "-ss", String(p.seek), "-i", path.join(work, clip.file),
      "-vf", vf, "-t", String(dur), "-r", "30", "-c:v", "libx264", "-preset", "veryfast",
      "-crf", "18", "-an", outPath];
    run("ffmpeg", args, `dựng ${p.id}`);
  }
  const sp = probeVideo(outPath);
  ok(sp.codec === "h264" && sp.width === 1280 && sp.height === 720 && Math.abs(sp.duration - dur) < 0.15,
    `${p.id}: clip ${dur}s 1280x720 OK (${sp.duration.toFixed(2)}s)`);
  fs.copyFileSync(outPath, path.join(mediaDir, `${p.id}.mp4`));
  const speed = measureSpeed(outPath);
  console.log(`   📊 ${p.id}: tốc độ đo lại ${speed.median_px_per_frame_720p} px/f (p90 ${speed.p90_px_s} px/s, resp ${speed.resp_median}, ${speed.n_pairs} cặp)`);
  ok(speed.resp_median > 0.3, `${p.id}: phase correlation tin được (resp ${speed.resp_median} > 0,3)`);
  ok(speed.median_px_per_frame_720p >= 11.0 && speed.median_px_per_frame_720p <= 14.5,
    `${p.id}: tốc độ đo trong 11,0–14,5 px/f quanh danh nghĩa 12 (đo được ${speed.median_px_per_frame_720p})`);
  const m = measureMotion(outPath);
  console.log(`   📊 ${p.id}: detector score=${m.score} level=${m.level} median=${m.medianAbsDiff} p90=${m.p90AbsDiff} smallBand=${m.smallBandShare} nPairs=${m.nPairs}`);
  summary.pan12[p.id] = { kind: p.kind, seek: p.seek, speedMeasured: speed, detector: m };
}
// Cùng tốc độ 12px/f, 2 nội dung cho 2 level đối nhau (nội dung át tốc độ).
ok(summary.pan12["ocean-pan12-native"].detector.level === "slow",
  "ocean-pan12-native (12,0 px/f, mặt nước phẳng) → slow (false negative đã báo trước ở R2 §6.3)");
ok(summary.pan12["slov-pan12-native"].detector.level === "fast",
  "slov-pan12-native (12,0 px/f, đường phố) → fast");
ok(summary.pan12["ocean-pan12"].detector.score < 4.0 && summary.pan12["slov-pan12"].detector.score > 6.0,
  "bản upscale cũng đối nhau: ocean-pan12 slow, slov-pan12 fast (cùng tốc độ danh nghĩa 12px/f)");

// --- B. Ghost ở pan ~12px/f (render thật) ------------------------------------
console.log("\n== B. Ghost ở pan ~12px/f (render thật qua render.js) ==");
function ghostForClip(clipId, duration, fps, opts) {
  const staticControl = !!(opts && opts.staticControl);
  const segFile = `${clipId}.mp4`;
  const expectN = Math.round(duration * fps);
  const cleanDir = path.join(work, `frames-${clipId}-clean`);
  const nClean = extractFrames(path.join(work, segFile), cleanDir, expectN);
  ok(nClean === expectN, `${clipId}: frame chuẩn đủ ${nClean}/${expectN}`);
  const specDenoise = (s) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", segFile, duration, s === null ? {} : { enhance: { denoise: { strength: s } } })] }], 1280, 720, fps);
  const jobs = [];
  const doRender = (s, name) => {
    const r = render(specDenoise(s), `${clipId}-${name}`);
    ok(r.status === 0 && outOk(r.outPath) && probeVideo(r.outPath).width === 1280,
      `${clipId}-${name}: render OK (${r.reused ? "tái dùng" : `${r.secs.toFixed(1)}s`})`);
    const dir = path.join(work, `frames-${clipId}-${name}`);
    const n = extractFrames(r.outPath, dir, expectN);
    ok(n === expectN, `${clipId}-${name}: đủ frame ${n}/${expectN}`);
    jobs.push([name, dir]);
  };
  doRender(null, "ctrl");
  for (const s of STRENGTHS) doRender(s, `d${String(s).replace(".", "_")}`);
  const ghost = ghostOf(cleanDir, jobs, clipId, expectN);
  const G = ghost.results;
  console.log(`   📊 ${clipId}: ${ghost.frames}; pixel theo dải: ${JSON.stringify(ghost.pixels)}%`);
  for (const [lab, g] of Object.entries(G)) {
    console.log(`   📊 ${lab}: trail small=${g.small.mean} | b flat=${g.blendByBand.flat} small=${g.blendByBand.small} mid=${g.blendByBand.mid} large=${g.blendByBand.large}`);
  }
  if (staticControl) {
    // Đối chứng tĩnh: dải small suy biến (clip tĩnh → |dC| ≈ 0 khắp frame)
    // nên b_small KHÔNG có ý nghĩa đo (ctrl 0,53 chỉ là nhiễu trên ~0,02%
    // pixel) — không áp assert của clip chuyển động. Cái đo được là NHẢY
    // ≈ 0 (không chuyển động thì hqdn3d không có gì để blend) và dải small
    // gần như vắng. Xem LIMITS §5.
    ok(ghost.pixels.small < 1,
      `${clipId}: dải small gần như vắng (${ghost.pixels.small}% — đúng clip tĩnh tuyệt đối, b_small suy biến)`);
  } else {
    ok(G.ctrl.blendByBand.small < 0.25,
      `${clipId}: sàn encode có giới hạn (b_small ctrl=${G.ctrl.blendByBand.small} < 0,25)`);
    ok(G.d0_5.blendByBand.small > G.ctrl.blendByBand.small + 0.05,
      `${clipId}: denoise 0,5 tạo ghost vượt rõ sàn (b_small ${G.d0_5.blendByBand.small} > ctrl ${G.ctrl.blendByBand.small} + 0,05)`);
    ok(ghost.pixels.small >= 2, `${clipId}: dải small đủ pixel (${ghost.pixels.small}%)`);
  }
  const jump0507 = +(G.d0_7.blendByBand.small - G.d0_5.blendByBand.small).toFixed(4);
  const jump0708 = +(G.d0_8.blendByBand.small - G.d0_7.blendByBand.small).toFixed(4);
  console.log(`   📊 ${clipId}: NHẢY b_small 0,5→0,7 = ${jump0507} | 0,7→0,8 = ${jump0708} (R4: 0,057–0,077 ở 0,6–7,9 px/f)`);
  if (staticControl) {
    ok(Math.abs(jump0507) < 0.02,
      `${clipId}: nhảy ghost ≈ 0 (|${jump0507}| < 0,02 — không chuyển động thì denoise 0,7 không thêm ghost)`);
  }
  return { ghost: G, pixels: ghost.pixels, jump0507, jump0708 };
}
for (const id of ["ocean-pan12", "slov-pan12"]) {
  summary.pan12[id].ghost = ghostForClip(id, 3.5, 30);
}

// --- B2. Đối chứng tĩnh tổng hợp (false-positive của quy tắc mới) -----------
console.log("\n== B2. Đối chứng tĩnh tổng hợp (static-clean, texture seed 64 như R2) ==");
const GEN_PY = `
import numpy as np
from PIL import Image
rng = np.random.default_rng(64)
W, H = 2200, 720
x = np.linspace(0, 1, W)[None, :]
y = np.linspace(0, 1, H)[:, None]
base = (90 + 90 * x + 40 * y)[:, :, None] * np.ones((1, 1, 3))
img = base.copy()
for _ in range(260):
    cx, cy = int(rng.integers(0, W)), int(rng.integers(0, H))
    r = int(rng.integers(6, 70))
    val = rng.uniform(-70, 70, size=3)
    yy, xx = np.ogrid[:H, :W]
    m = (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r
    img[m] += val
for _ in range(40):
    cx = int(rng.integers(0, W))
    wdt = int(rng.integers(2, 9))
    img[:, max(0, cx - wdt):cx + wdt, :] += rng.uniform(-45, 45)
img = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(img).save("${path.join(work, "texture-wide.png")}")
print("texture ok")
`;
const genPy = path.join(work, "gen_texture.py");
const tex = path.join(work, "texture-wide.png");
const staticClean = path.join(work, "static-clean.mp4");
if (!fs.existsSync(staticClean) || probeVideo(staticClean).duration < 4.9) {
  fs.writeFileSync(genPy, GEN_PY);
  run("python3", [genPy], "tạo ảnh texture 2200x720 (seed 64)");
  run("ffmpeg", ["-v", "error", "-y", "-loop", "1", "-i", tex,
    "-vf", "crop=1280:720:0:0,format=yuv420p", "-t", "5", "-r", "30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-an", staticClean],
    "encode static-clean.mp4");
}
{
  const sp = probeVideo(staticClean);
  ok(sp.codec === "h264" && sp.width === 1280 && sp.height === 720 && Math.abs(sp.duration - 5) < 0.15,
    `static-clean: clip tĩnh 5s OK (${sp.duration.toFixed(2)}s)`);
  fs.copyFileSync(staticClean, path.join(mediaDir, "static-clean.mp4"));
  const m = measureMotion(staticClean);
  console.log(`   📊 static-clean: detector score=${m.score} level=${m.level} (R2: 0,001 slow)`);
  ok(m.score < 0.1 && m.level === "slow", `static-clean → slow (score ${m.score} < 0,1)`);
  const g = ghostForClip("static-clean", 5, 30, { staticControl: true });
  // Chỉ cần ctrl/0.5/0.7 để đo nhảy — ghostForClip đã render cả 0.8, giữ
  // luôn cho đủ bộ (không tốn thêm lần chạy sau).
  summary.staticClean = { detector: m, ghost: g };
  console.log(`   📊 static-clean: NHẢY b_small 0,5→0,7 = ${g.jump0507} (kỳ vọng ≈ 0: không chuyển động thì hqdn3d không có gì để blend)`);
}

// --- B3. Ghost 4 đoạn R4: tính lại từ frame đã có (không render lại) --------
console.log("\n== B3. Ghost 4 đoạn R4 — tính lại từ frame đợt 64 (không render lại) ==");
for (const seg of R4_SEGMENTS) {
  const cleanDir = path.join(R4_SCRATCH, `frames-${seg.id}-clean`);
  const jobs = ["ctrl", "d0_5", "d0_7", "d0_8"].map((n) => [n, path.join(R4_SCRATCH, `frames-${seg.id}-${n}`)]);
  const ghost = ghostOf(cleanDir, jobs, `r4-${seg.id}`, 5 * CLIPS[seg.clip].fps);
  const G = ghost.results;
  const jump = +(G.d0_7.blendByBand.small - G.d0_5.blendByBand.small).toFixed(4);
  console.log(`   📊 ${seg.id}: b_small ctrl=${G.ctrl.blendByBand.small} 0,5=${G.d0_5.blendByBand.small} 0,7=${G.d0_7.blendByBand.small} 0,8=${G.d0_8.blendByBand.small} | NHẢY 0,5→0,7 = ${jump} (R4 ghi ${seg.jump0507})`);
  ok(Math.abs(jump - seg.jump0507) < 0.005,
    `${seg.id}: nhảy ghost tái hiện số R4 (${jump} ≈ ${seg.jump0507} ±0,005)`);
  summary.segments[seg.id].ghostJump0507_remeasured = jump;
  summary.segments[seg.id].ghost = G;
}

// --- C. Bảng FP/FN: cổng cũ (chỉ fast) vs quy tắc mới (mọi mức đo được) ----
console.log("\n== C. Bảng false positive / false negative (ngưỡng ghost-positive: nhảy 0,5→0,7 ≥ 0,05) ==");
const GHOST_POS_FLOOR = 0.05;
const rows = [];
for (const seg of R4_SEGMENTS) {
  const s = summary.segments[seg.id];
  rows.push({ clip: seg.id, speed: seg.speedNote, score: s.detector.score, level: s.detector.level, jump: s.ghostJump0507_remeasured });
}
for (const id of ["ocean-pan12", "slov-pan12"]) {
  const p = summary.pan12[id];
  rows.push({ clip: id, speed: `${p.speedMeasured.median_px_per_frame_720p} px/f (đo)`, score: p.detector.score, level: p.detector.level, jump: p.ghost.jump0507 });
}
rows.push({ clip: "static-clean (tổng hợp)", speed: "0 px/f", score: summary.staticClean.detector.score, level: summary.staticClean.detector.level, jump: summary.staticClean.ghost.jump0507 });
console.log("   clip                    tốc độ        score  level   nhảy 0,5→0,7 | ghost+ | cổng CŨ cảnh báo? | quy tắc MỚI cảnh báo?");
let fnOld = 0, fpOld = 0, fnNew = 0, fpNew = 0;
for (const r of rows) {
  const ghostPos = r.jump >= GHOST_POS_FLOOR;
  const warnOld = shouldWarnDenoiseGhostingOld(0.8, r.level);
  const warnNew = shouldWarnDenoiseGhosting(0.8, r.level);
  if (ghostPos && !warnOld) fnOld++;
  if (!ghostPos && warnOld) fpOld++;
  if (ghostPos && !warnNew) fnNew++;
  if (!ghostPos && warnNew) fpNew++;
  console.log(`   ${r.clip.padEnd(24)} ${String(r.speed).padEnd(13)} ${String(r.score).padStart(6)}  ${r.level.padEnd(6)}  ${String(r.jump).padStart(6)} | ${ghostPos ? "CÓ " : "không"}  | ${warnOld ? "CÓ " : "không"}             | ${warnNew ? "CÓ" : "không"}`);
  r.ghostPositive = ghostPos; r.warnOld = warnOld; r.warnNew = warnNew;
}
console.log(`   📊 Cổng CŨ (chỉ fast): FN=${fnOld} (bỏ sót clip ghost thật), FP=${fpOld}`);
console.log(`   📊 Quy tắc MỚI (mọi mức đo được, ≥0,7): FN=${fnNew}, FP=${fpNew}`);
ok(fnOld >= 3, `cổng cũ bỏ sót ≥3 clip ghost-positive trên footage thật (FN=${fnOld}/6 clip thật ghost-positive — đây là mâu thuẫn R2↔R4 cần sửa)`);
ok(fnNew === 0, `quy tắc mới không bỏ sót clip ghost-positive nào (FN=${fnNew})`);
// FP duy nhất của quy tắc mới là clip tĩnh tổng hợp (không có chuyển động
// thật — footage thật không bao giờ tĩnh tuyệt đối, xem LIMITS §5).
ok(fpNew <= 1, `quy tắc mới FP ≤ 1 (FP=${fpNew}: chỉ clip tĩnh tổng hợp, xem LIMITS §5)`);
summary.fpFn = { floor: GHOST_POS_FLOOR, rows, fnOld, fpOld, fnNew, fpNew };

// --- D. Logic cảnh báo mới (đơn vị) ------------------------------------------
console.log("\n== D. Logic cảnh báo mới (shouldWarnDenoiseGhosting — quy tắc mới) ==");
ok(shouldWarnDenoiseGhosting(0.8, "fast") === true, "0,8 + fast → cảnh báo (như cũ)");
ok(shouldWarnDenoiseGhosting(0.7, "fast") === true, "0,7 + fast → cảnh báo (đúng ngưỡng)");
ok(shouldWarnDenoiseGhosting(1.0, "fast") === true, "1,0 + fast → cảnh báo");
ok(shouldWarnDenoiseGhosting(0.8, "slow") === true, "0,8 + slow → CẢNH BÁO (MỚI: R4 chứng minh clip chậm vẫn ghost)");
ok(shouldWarnDenoiseGhosting(0.8, "medium") === true, "0,8 + medium → CẢNH BÁO (MỚI)");
ok(shouldWarnDenoiseGhosting(0.7, "slow") === true, "0,7 + slow → cảnh báo (đúng ngưỡng)");
ok(shouldWarnDenoiseGhosting(0.69, "fast") === false, "0,69 + fast → không cảnh báo (dưới ngưỡng 0,7)");
ok(shouldWarnDenoiseGhosting(0.5, "fast") === false, "0,5 + fast → không cảnh báo (dưới ngưỡng 0,7)");
ok(shouldWarnDenoiseGhosting(0.8, "unknown") === false, "0,8 + unknown → KHÔNG cảnh báo cụ thể (caller hiện cảnh báo chung riêng)");
ok(shouldWarnDenoiseGhosting(0.8, undefined) === false, "0,8 + undefined → false");
ok(shouldWarnDenoiseGhosting(NaN, "fast") === false, "NaN strength → false");
ok(FAST_THRESHOLD === 6.0 && MEDIUM_THRESHOLD === 4.0 && DENOISE_WARN_STRENGTH === 0.7,
  "ngưỡng phân loại GIỮ NGUYÊN FAST=6,0/MEDIUM=4,0, cảnh báo 0,7 (không có ngưỡng nào phân tách được tốc độ pan trên footage thật — xem LIMITS §3)");
ok(classifyMotion(2.909) === "slow" && classifyMotion(6.471) === "fast",
  "classifyMotion khớp số đo thật trên footage (basgo-fast 2,909 slow; slov-fast 6,471 fast)");

fs.writeFileSync(path.join(work, "summary.json"), JSON.stringify(summary, null, 1));
console.log(`\n== test_round65_s2_fast_motion_real: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify({ thresholds: { FAST_THRESHOLD, MEDIUM_THRESHOLD, DENOISE_WARN_STRENGTH }, fpFn: summary.fpFn }, null, 1));
if (fail > 0) process.exit(1);

/**
 * Cổng cảnh báo CŨ (đợt 64 R2): chỉ fast + ≥0,7 mới cảnh báo.
 * Giữ lại TRONG HARNESS để tính bảng FP/FN đối chứng — không dùng trong
 * code production nữa (fastMotion.js đã chuyển sang quy tắc mới).
 */
function shouldWarnDenoiseGhostingOld(strength, motionLevel) {
  if (typeof strength !== "number" || !Number.isFinite(strength)) return false;
  return strength >= DENOISE_WARN_STRENGTH && motionLevel === "fast";
}
