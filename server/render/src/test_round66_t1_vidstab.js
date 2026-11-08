#!/usr/bin/env node
/**
 * test_round66_t1_vidstab.js — Phase 9 đợt 66, luồng T1: điều tra nguồn
 * không-xác-định trong vidstabtransform (nợ đợt 65 S1, LIMITS đợt 65 §8 mục 1).
 *
 * Bối cảnh (đợt 65 S1, kiểm chứng lại trên đĩa trước khi viết harness này):
 * - vidstabdetect: .trf khác byte giữa các lần chạy nhưng nội dung LM giống
 *   hệt (median từng frame maxDiff 0px, 149/149) — detect KHÔNG phải nguồn
 *   spread.
 * - vidstabtransform: cùng file .trf byte-identical, output khác sha256;
 *   đo trên frame đã tách: MAD 7,85 vs 5,45 (spread 36,1%), F2_V5 2,19 vs
 *   1,49 (38,0%), wild8 10 vs 2.
 * - Kiểm chứng trực tiếp (luồng này, trước harness): so pixel 2 output cũ
 *   frames-transform-1 vs frames-transform-2: 149/150 frame khác nhau,
 *   meanAbsDiff trung bình 18,59 mức xám (max 45,35); chỉ frame 0 giống hệt,
 *   chênh lệch NHỎ ở frame đầu (0,06–0,4) rồi LỚN dần (35–45) — mẫu hình
 *   khuếch đại qua các frame.
 *
 * Phân tích mã nguồn libvidstab 1.1.0 (đã cài trên VM, ffmpeg 8.1.2) + master
 * trên GitHub (georgmartius/vid.stab) trước khi đo:
 * - .trf CHỈ lưu local motions (LM); mỗi lần transform đều FIT LẠI transform
 *   toàn cục từng frame qua vsMotionsToTransform → vsGradientDescent.
 * - Trong 1.1.0, vsGradientDescent là CHỖ DUY NHẤT gọi rand() (kiểm chứng
 *   bằng objdump: 1 call site rand@plt, nằm trong vsGradientDescent).
 *   Upstream đã sửa (issue #111: đổi sang xen kẽ dấu bước xác định) nhưng
 *   1.1.0 vẫn còn rand().
 * - GOMP_parallel CHỈ có 1 call site, nằm trong calcTransFields (detect),
 *   KHÔNG nằm trong đường transform.
 * - KIỂM CHỨNG QUAN TRỌNG (luồng này): chạy transform với debug=1 ×2, file
 *   global_motions.trf (transform đã fit) GIỐNG HỆT byte (sha
 *   1eac131f…) — bước FIT LÀ XÁC ĐỊNH (rand() glibc không seed nên cho cùng
 *   dãy số mỗi process mới). Nguồn spread nằm ở HẠ NGUỒN của fit.
 * - Nghi phạm còn lại: vsPreprocessTransforms (smoothing gauss / optzoom),
 *   vsDoTransform (warp, crop=keep mặc định dùng destbuf = frame trước làm
 *   nền → vòng phản hồi khuếch đại chênh lệch nhỏ qua các frame), decode,
 *   encode x264, hoặc bộ nhớ chưa khởi tạo.
 *
 * Thí nghiệm (mỗi cấu hình ≥3 lần, cùng input + cùng .trf, trừ khi ghi khác):
 *   C0  decode-only ×3 (đối chứng chuỗi đo: decode có xác định không?)
 *   E0  replicate S1: transform + encode x264 veryfast crf23 ×3
 *   E1  transform → PNG ×3 (mặc định; chứng minh không-encoder)
 *   E2  OMP_NUM_THREADS=1 ×3
 *   E3  LD_PRELOAD srand(12345) cố định ×3 (khóa RNG — nếu hết spread thì
 *       rand() là cơ chế; nếu vẫn spread thì không phải rand)
 *   E4  ffmpeg -threads 1 ×3
 *   E5  ffmpeg -filter_threads 1 ×3
 *   E6  smoothing=0 ×3 (tắt smoothing — tách tầng smoothing)
 *   E7  optalgo=avg ×3
 *   E8  optalgo=opt (L1) ×3 — có thể chậm, timeout 600s/lần
 *   E9  optzoom=0 ×3 (tắt tối ưu zoom)
 *   E10 crop=black ×3 (tắt vòng phản hồi destbuf của crop=keep)
 *   E11 trfB (khác byte, cùng nội dung LM) ×3 — thứ tự LM có ảnh hưởng?
 *   E12 tải: 4 transform mặc định chạy SONG SONG ×1 đợt — spread dưới tải?
 *   E13 debug=1 ×3 — so global_motions.trf (fit có xác định không?)
 *   E14 crop=black + smoothing=0 ×3 (transform tối thiểu)
 *
 * Mỗi lần chạy đo: MAD mean, F2_V5, F2_V2, wild8, maxDm (module đo gộp trích
 * từ harness S1, MAD full-frame) + so pixel trực tiếp với lần 1 (mean/max
 * abs diff từng frame, số frame khác nhau / 150). Spread = (max-min)/mean.
 *
 * Cách chạy: node server/render/src/test_round66_t1_vidstab.js
 * (cần ffmpeg, ffprobe, python3, python của server/tracking/.venv cho cv2,
 * gcc cho thí nghiệm E3). Scratch mới dưới ~/workspace/.scratch-r66t1-*.
 * KHÔNG ghi gì vào repo ngoài harness này (LIMITS viết riêng sau).
 * Thời gian ~25–40 phút tùy tải (các luồng đợt 66 khác chạy song song).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r66t1-"));
const S1 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph";
const SRC = path.join(S1, "media", "shakynoisy720.mp4");
const TRF_A = path.join(S1, "detect-a.trf");
const TRF_B = path.join(S1, "detect-b.trf");
const CV2_PY = path.join(__dirname, "..", "..", "tracking", ".venv", "bin", "python");
const S1_HARNESS = path.join(__dirname, "test_round65_s1_motion_metric.js");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
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
function run(cmd, args, label, opts) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...(opts || {}) });
  if (r.error || r.status !== 0) {
    throw new Error(`${label} thất bại (mã ${r.status}): ${(r.stderr || "").toString().slice(-800)}`);
  }
  return r;
}

// --- Module đo gộp trích từ harness S1 (MAD full-frame + Farneback V5/V2) ---
const harnessSrc = fs.readFileSync(S1_HARNESS, "utf8");
const mMot = /const MOTION_PY = `([\s\S]*?)`;\nconst motionPy/.exec(harnessSrc);
if (!mMot) { console.error("không trích được MOTION_PY từ harness S1"); process.exit(2); }
const motionPy = path.join(work, "motion_metric.py");
fs.writeFileSync(motionPy, mMot[1]);
function measure(framesDir) {
  const r = spawnSync(CV2_PY, [motionPy, "measure", framesDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`motion_metric.py measure lỗi: ${r.stdout} ${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("MEASURE "));
  if (!line) throw new Error(`không parse được measure: ${r.stdout} ${r.stderr}`);
  return JSON.parse(line.slice("MEASURE ".length));
}

// --- So pixel trực tiếp 2 thư mục frame (320x180 gray PNG) ---
const FRAMEDIFF_PY = `
import sys, glob, json, numpy as np, cv2
def load(d):
    fs = sorted(glob.glob(d + "/f*.png"))
    return [cv2.imread(f, cv2.IMREAD_GRAYSCALE) for f in fs]
a = load(sys.argv[1]); b = load(sys.argv[2])
assert len(a) == len(b) and len(a) > 0, f"frame count {len(a)} vs {len(b)}"
diffs = []
for x, y in zip(a, b):
    diffs.append(float(np.abs(x.astype(np.int16) - y.astype(np.int16)).mean()))
d = np.array(diffs)
print("FRAMEDIFF " + json.dumps({
    "n": len(d), "differing": int((d > 0).sum()), "identical": int((d == 0).sum()),
    "meanAbsDiff": round(float(d.mean()), 4), "maxAbsDiff": round(float(d.max()), 4),
    "medianAbsDiff": round(float(np.median(d)), 4),
    "firstDiffFrame": int(np.argmax(d > 0)) if (d > 0).any() else -1,
    "worstFrame": int(np.argmax(d)), "worstValue": round(float(d.max()), 4),
}))
`;
const frameDiffPy = path.join(work, "framediff.py");
fs.writeFileSync(frameDiffPy, FRAMEDIFF_PY);
function frameDiff(dirA, dirB) {
  const r = spawnSync(CV2_PY, [frameDiffPy, dirA, dirB], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`framediff lỗi: ${r.stdout} ${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("FRAMEDIFF "));
  return JSON.parse(line.slice("FRAMEDIFF ".length));
}
function frameCount(dir) {
  try { return fs.readdirSync(dir).filter((f) => f.startsWith("f") && f.endsWith(".png")).length; }
  catch { return 0; }
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }

// --- Biên dịch .so khóa srand cho E3 (tự chứa trong harness) ---
const SEED_C = `#include <stdlib.h>\n__attribute__((constructor)) static void r66t1_seed(void) { srand(12345); }\n`;
const seedC = path.join(work, "seed.c");
fs.writeFileSync(seedC, SEED_C);
const seedSo = path.join(work, "seed.so");
let seedSoOk = false;
{
  const r = spawnSync("gcc", ["-shared", "-fPIC", "-o", seedSo, seedC], { stdio: ["ignore", "pipe", "pipe"] });
  seedSoOk = r.status === 0 && fs.existsSync(seedSo);
}
console.log(`== Đợt 66 T1 — điều tra vidstabtransform không xác định (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);
console.log(`   SRC=${SRC} | TRF_A=${TRF_A} | TRF_B=${TRF_B}`);
console.log(`   seed.so cho E3: ${seedSoOk ? "biên dịch OK" : "BIÊN DỊCH LỖI — E3 sẽ bị bỏ qua"}`);

// --- Kiểm chứng đầu vào giống hệt S1 ---
const shaA = sha256(TRF_A), shaB = sha256(TRF_B), shaSrc = sha256(SRC);
console.log(`   📊 sha256 trfA=${shaA.slice(0, 12)}… (S1 log: 4b35c5fd86c2…) | trfB=${shaB.slice(0, 12)}… (S1: 48d9c496617c…) | src=${shaSrc.slice(0, 12)}…`);
ok(shaA.startsWith("4b35c5fd86c2"), "trfA đúng file S1 đã dùng (sha khớp log run3)");
ok(shaB.startsWith("48d9c496617c"), "trfB đúng file S1 đã dùng (sha khớp log run3)");
ok(shaSrc.startsWith("af87a113db26"), "shakynoisy720.mp4 đúng file S1 đã dùng");

// --- 1 lần transform → PNG frames -------------------------------------------
function transformToFrames(tag, runIdx, vfExtra, globalArgs, envExtra, trfPath, cwdOverride) {
  const dir = path.join(work, tag, `r${runIdx}`);
  fs.mkdirSync(dir, { recursive: true });
  const vf = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trfPath || TRF_A}':smoothing=10:optalgo=gauss${vfExtra || ""},scale=320:180,format=gray`;
  const args = [...(globalArgs || []), "-v", "error", "-i", SRC,
    "-vf", vf, "-vsync", "0", path.join(dir, "f%04d.png")];
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", args, {
    stdio: ["ignore", "pipe", "pipe"], timeout: 300000,
    env: { ...process.env, ...(envExtra || {}) },
    cwd: cwdOverride || dir,
  });
  const secs = (Date.now() - t0) / 1000;
  if (r.error || r.status !== 0) {
    throw new Error(`transform ${tag} r${runIdx} thất bại (${r.status}): ${(r.stderr || "").toString().slice(-500)}`);
  }
  const n = frameCount(dir);
  if (n !== 150) throw new Error(`transform ${tag} r${runIdx}: chỉ có ${n}/150 frame`);
  return { dir, secs };
}
function transformToMp4(tag, runIdx) {
  // E0: y hệt lệnh S1 (transform + x264 veryfast crf23).
  const outPath = path.join(work, tag, `r${runIdx}.mp4`);
  fs.mkdirSync(path.join(work, tag), { recursive: true });
  const t0 = Date.now();
  run("ffmpeg", ["-v", "error", "-i", SRC,
    "-vf", `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF_A}':smoothing=10:optalgo=gauss`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-an", "-y", outPath], `transform+encode ${tag} r${runIdx}`);
  const secs = (Date.now() - t0) / 1000;
  const dir = path.join(work, tag, `r${runIdx}-frames`);
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-i", outPath, "-vf", "scale=320:180,format=gray", "-vsync", "0",
    path.join(dir, "f%04d.png")], `tách frame ${tag} r${runIdx}`);
  return { outPath, dir, secs, sha: sha256(outPath) };
}

// --- Chạy 1 thí nghiệm: n lần, đo metric + so pixel với lần 1 ---------------
const summary = {};
function experiment(tag, desc, nRuns, runFn) {
  console.log(`\n== ${tag}. ${desc} (loadavg: ${loadAvg()}) ==`);
  const runs = [];
  for (let i = 1; i <= nRuns; i++) {
    const res = runFn(i);
    const mt = measure(res.dir);
    runs.push({ ...res, metric: mt });
    console.log(`   📊 ${tag}-r${i} (${res.secs.toFixed(1)}s): MAD=${mt.mad.mean} F2_V5=${mt.fbV5.F2} F2_V2=${mt.fbV2.F2} wild8=${mt.fbV5.wild8} maxDm=${mt.fbV5.maxDm}`);
  }
  const diffs = [];
  for (let i = 2; i <= nRuns; i++) {
    const d = frameDiff(runs[0].dir, runs[i - 1].dir);
    diffs.push(d);
    console.log(`   📊 ${tag} r1↔r${i}: khác ${d.differing}/150 frame, meanAbsDiff=${d.meanAbsDiff}, max=${d.maxAbsDiff}, frame khác đầu tiên=${d.firstDiffFrame}, tệ nhất frame ${d.worstFrame} (${d.worstValue})`);
  }
  const mads = runs.map((r) => r.metric.mad.mean);
  const f2s = runs.map((r) => r.metric.fbV5.F2);
  const det = diffs.every((d) => d.differing === 0);
  console.log(`   📊 ${tag} KẾT LUẬN: ${det ? "XÁC ĐỊNH (0 frame khác)" : `KHÔNG XÁC ĐỊNH (${diffs.map((d) => d.differing).join("/")} frame khác)`} | spread MAD=${spreadPct(mads).toFixed(1)}% | spread F2_V5=${spreadPct(f2s).toFixed(1)}% | thời gian TB ${(mean(runs.map((r) => r.secs))).toFixed(1)}s/lần`);
  summary[tag] = {
    desc, deterministic: det,
    mads, f2v5: f2s,
    spreadMadPct: +spreadPct(mads).toFixed(2), spreadF2Pct: +spreadPct(f2s).toFixed(2),
    frameDiffs: diffs.map((d) => ({ differing: d.differing, meanAbsDiff: d.meanAbsDiff, maxAbsDiff: d.maxAbsDiff, firstDiffFrame: d.firstDiffFrame })),
    secsMean: +mean(runs.map((r) => r.secs)).toFixed(1),
  };
  return summary[tag];
}

// C0 — decode-only ×3 (đối chứng chuỗi đo).
experiment("C0", "decode-only ×3 (không vidstab — đối chứng chuỗi đo)", 3, (i) => {
  const dir = path.join(work, "C0", `r${i}`);
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  run("ffmpeg", ["-v", "error", "-i", SRC, "-vf", "trim=start=0:end=5,setpts=PTS-STARTPTS,scale=320:180,format=gray",
    "-vsync", "0", path.join(dir, "f%04d.png")], `decode-only C0 r${i}`);
  return { dir, secs: (Date.now() - t0) / 1000 };
});

// E0 — replicate S1 (transform + encode) ×3.
console.log("\n== E0. Replicate S1: transform + x264 encode ×3 (loadavg: " + loadAvg() + ") ==");
{
  const runs = [];
  for (let i = 1; i <= 3; i++) {
    const res = transformToMp4("E0", i);
    const mt = measure(res.dir);
    runs.push({ ...res, metric: mt });
    console.log(`   📊 E0-r${i} (${res.secs.toFixed(1)}s): sha=${res.sha.slice(0, 12)}… MAD=${mt.mad.mean} F2_V5=${mt.fbV5.F2} wild8=${mt.fbV5.wild8}`);
  }
  const sameSha = runs[0].sha === runs[1].sha && runs[1].sha === runs[2].sha;
  const diffs = [frameDiff(runs[0].dir, runs[1].dir), frameDiff(runs[0].dir, runs[2].dir)];
  for (let i = 0; i < 2; i++) console.log(`   📊 E0 r1↔r${i + 2}: khác ${diffs[i].differing}/150 frame, meanAbsDiff=${diffs[i].meanAbsDiff}, max=${diffs[i].maxAbsDiff}`);
  const mads = runs.map((r) => r.metric.mad.mean);
  const f2s = runs.map((r) => r.metric.fbV5.F2);
  console.log(`   📊 E0 KẾT LUẬN: mp4 sha ${sameSha ? "GIỐNG HỆT" : "KHÁC NHAU"} | spread MAD=${spreadPct(mads).toFixed(1)}% (S1: 36,1%) | spread F2_V5=${spreadPct(f2s).toFixed(1)}% (S1: 38,0%)`);
  summary.E0 = { desc: "replicate S1 transform+x264 encode", mp4Identical: sameSha, mads, f2v5: f2s,
    spreadMadPct: +spreadPct(mads).toFixed(2), spreadF2Pct: +spreadPct(f2s).toFixed(2),
    frameDiffs: diffs.map((d) => ({ differing: d.differing, meanAbsDiff: d.meanAbsDiff, maxAbsDiff: d.maxAbsDiff, firstDiffFrame: d.firstDiffFrame })),
    secsMean: +mean(runs.map((r) => r.secs)).toFixed(1) };
}

// E1 — transform → PNG mặc định ×3.
experiment("E1", "transform → PNG mặc định ×3 (không encoder)", 3,
  (i) => transformToFrames("E1", i));
// E2 — OMP_NUM_THREADS=1.
experiment("E2", "transform OMP_NUM_THREADS=1 ×3", 3,
  (i) => transformToFrames("E2", i, "", [], { OMP_NUM_THREADS: "1" }));
// E3 — khóa srand qua LD_PRELOAD.
if (seedSoOk) {
  experiment("E3", "transform LD_PRELOAD srand(12345) ×3", 3,
    (i) => transformToFrames("E3", i, "", [], { LD_PRELOAD: seedSo }));
} else {
  console.log("\n== E3. BỎ QUA (không biên dịch được seed.so) ==");
  summary.E3 = { desc: "LD_PRELOAD srand — SKIPPED (gcc lỗi)", skipped: true };
}
// E4 — ffmpeg -threads 1.
experiment("E4", "transform ffmpeg -threads 1 ×3", 3,
  (i) => transformToFrames("E4", i, "", ["-threads", "1"]));
// E5 — ffmpeg -filter_threads 1.
experiment("E5", "transform ffmpeg -filter_threads 1 ×3", 3,
  (i) => transformToFrames("E5", i, "", ["-filter_threads", "1"]));
// E6/E7/E8/E9/E10/E11/E14 dùng biến thể riêng (vf khác nhau) — xem
// transformVariant / experimentVariant bên dưới.

function transformVariant(tag, runIdx, vfTail, globalArgs, envExtra, trfPath) {
  const dir = path.join(work, tag, `r${runIdx}`);
  fs.mkdirSync(dir, { recursive: true });
  const vf = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${trfPath || TRF_A}'${vfTail},scale=320:180,format=gray`;
  const args = [...(globalArgs || []), "-v", "error", "-i", SRC,
    "-vf", vf, "-vsync", "0", path.join(dir, "f%04d.png")];
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", args, {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, ...(envExtra || {}) }, cwd: dir,
  });
  const secs = (Date.now() - t0) / 1000;
  if (r.error || r.status !== 0) {
    throw new Error(`transform ${tag} r${runIdx} thất bại (${r.status}): ${(r.stderr || "").toString().slice(-500)}`);
  }
  const n = frameCount(dir);
  if (n !== 150) throw new Error(`transform ${tag} r${runIdx}: chỉ có ${n}/150 frame`);
  return { dir, secs };
}
function experimentVariant(tag, desc, nRuns, vfTail, globalArgs, envExtra, trfPath) {
  return experiment(tag, desc, nRuns,
    (i) => transformVariant(tag, i, vfTail, globalArgs, envExtra, trfPath));
}

experimentVariant("E6", "transform smoothing=0 ×3", 3, ":smoothing=0:optalgo=gauss");
experimentVariant("E7", "transform optalgo=avg ×3", 3, ":smoothing=10:optalgo=avg");
experimentVariant("E8", "transform optalgo=opt (L1) ×3", 3, ":smoothing=10:optalgo=opt");
experimentVariant("E9", "transform optzoom=0 ×3", 3, ":smoothing=10:optalgo=gauss:optzoom=0");
experimentVariant("E10", "transform crop=black ×3", 3, ":smoothing=10:optalgo=gauss:crop=black");
experimentVariant("E11", "transform với trfB (khác byte, cùng LM) ×3", 3, ":smoothing=10:optalgo=gauss", [], {}, TRF_B);
experimentVariant("E14", "transform crop=black + smoothing=0 ×3", 3, ":smoothing=0:optalgo=gauss:crop=black");

// E12 — tải: 4 transform mặc định song song (spawn thật, chờ bằng node -e bọc ngoài).
console.log(`\n== E12. Tải: 4 transform mặc định SONG SONG (loadavg trước: ${loadAvg()}) ==`);
{
  const dirs = [];
  for (let i = 1; i <= 4; i++) {
    const dir = path.join(work, "E12p", `r${i}`);
    fs.mkdirSync(dir, { recursive: true });
    dirs.push(dir);
  }
  const t0 = Date.now();
  const script = `
    const { spawn } = require("child_process");
    const dirs = ${JSON.stringify(dirs)};
    const jobs = dirs.map((dir) => new Promise((resolve, reject) => {
      const p = spawn("ffmpeg", ["-v", "error", "-i", ${JSON.stringify(SRC)}, "-vf",
        "trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input=${TRF_A}:smoothing=10:optalgo=gauss,scale=320:180,format=gray",
        "-vsync", "0", dir + "/f%04d.png"],
        { stdio: ["ignore", "pipe", "pipe"], cwd: dir });
      let err = "";
      p.stderr.on("data", (d) => { err += d.toString(); });
      p.on("error", reject);
      p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg mã " + code + ": " + err.slice(-400)))));
    }));
    Promise.all(jobs).then(() => console.log("E12P-ALL-DONE")).catch((e) => { console.error(e.message); process.exit(1); });
  `;
  const wait = spawnSync("node", ["-e", script], { stdio: ["ignore", "pipe", "pipe"], timeout: 600000 });
  if (wait.status !== 0) throw new Error(`E12 song song thất bại: ${(wait.stderr || "").toString().slice(-600)}`);
  const secs = (Date.now() - t0) / 1000;
  const runs = dirs.map((dir) => ({ dir, metric: measure(dir) }));
  for (let i = 0; i < 4; i++) {
    ok(frameCount(dirs[i]) === 150, `E12 song song r${i + 1}: đủ 150 frame`);
    console.log(`   📊 E12-r${i + 1}: MAD=${runs[i].metric.mad.mean} F2_V5=${runs[i].metric.fbV5.F2} wild8=${runs[i].metric.fbV5.wild8}`);
  }
  const diffs = [1, 2, 3].map((i) => frameDiff(dirs[0], dirs[i]));
  diffs.forEach((d, i) => console.log(`   📊 E12 r1↔r${i + 2}: khác ${d.differing}/150 frame, meanAbsDiff=${d.meanAbsDiff}, max=${d.maxAbsDiff}`));
  const mads = runs.map((r) => r.metric.mad.mean);
  const f2s = runs.map((r) => r.metric.fbV5.F2);
  console.log(`   📊 E12 KẾT LUẬN (song song, ${secs.toFixed(1)}s cho 4 lần): spread MAD=${spreadPct(mads).toFixed(1)}% | spread F2_V5=${spreadPct(f2s).toFixed(1)}% (so E1 tuần tự)`);
  summary.E12 = { desc: "4 transform mặc định song song", parallel: true,
    mads, f2v5: f2s, spreadMadPct: +spreadPct(mads).toFixed(2), spreadF2Pct: +spreadPct(f2s).toFixed(2),
    frameDiffs: diffs.map((d) => ({ differing: d.differing, meanAbsDiff: d.meanAbsDiff, maxAbsDiff: d.maxAbsDiff, firstDiffFrame: d.firstDiffFrame })),
    secsTotal: +secs.toFixed(1) };
}

// E13 — debug=1 ×3: so global_motions.trf (fit có xác định không?).
console.log(`\n== E13. debug=1 ×3 — so file global_motions.trf đã fit (loadavg: ${loadAvg()}) ==`);
{
  const hashes = [];
  for (let i = 1; i <= 3; i++) {
    const dir = path.join(work, "E13", `r${i}`);
    fs.mkdirSync(dir, { recursive: true });
    run("ffmpeg", ["-v", "error", "-i", SRC, "-vf",
      `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF_A}':smoothing=10:optalgo=gauss:debug=1`,
      "-an", "-f", "null", "-"], `transform debug E13 r${i}`, { cwd: dir });
    const gm = path.join(dir, "global_motions.trf");
    ok(outOk(gm), `E13 r${i}: có global_motions.trf`);
    hashes.push(sha256(gm));
    console.log(`   📊 E13-r${i}: global_motions.trf sha=${hashes[i - 1].slice(0, 12)}…`);
  }
  const fitSame = hashes[0] === hashes[1] && hashes[1] === hashes[2];
  console.log(`   📊 E13 KẾT LUẬN: fit toàn cục ${fitSame ? "GIỐNG HỆT ×3 (xác định)" : "KHÁC NHAU — fit là nguồn spread"}`);
  summary.E13 = { desc: "debug=1 so global_motions.trf", fitIdentical: fitSame, hashes: hashes.map((h) => h.slice(0, 12)) };
}

console.log(`\n== test_round66_t1_vidstab: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
fs.writeFileSync(path.join(work, "summary.json"), JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);
