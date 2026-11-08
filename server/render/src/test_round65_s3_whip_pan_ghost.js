#!/usr/bin/env node
/**
 * test_round65_s3_whip_pan_ghost.js — Phase 9 đợt 65, luồng S3.
 *
 * Nợ mở đợt 64 R4 (docs/PHASE9_ROUND64_LIMITS.md §8 mục 3 + §4.3):
 *   (a) pan thật >8 px/f (whip-pan) chưa có số;
 *   (b) giả thuyết "bề mặt phẳng dự báo ghost tốt hơn tốc độ pan" chưa kiểm chứng.
 *
 * Thiết kế — whip-pan TỔNG HỢP TRÊN FOOTAGE THẬT (R4 §8 cho phép: "dựng pan
 * nhanh từ footage thật bằng cách quay lại — không dùng crop ảnh tĩnh"):
 *   - Nguồn: slovenska.webm (Wikimedia Commons, CC BY 3.0, camera tĩnh,
 *     đã verify sha256 ở đợt 64), cửa sổ t=5s (camera tĩnh, median ~0,7 px/f).
 *   - Upscale 2x (3840x2160, lanczos) rồi crop cửa sổ 1280x720 chuyển động
 *     ngang với tốc độ không đổi -> pan ảo trên footage thật, tốc độ đo lại
 *     bằng phase correlation (không tin số danh nghĩa).
 *   - 2 bề mặt TRÊN CÙNG MỘT CLIP, cùng tốc độ (so sánh có kiểm soát):
 *       flat = dải dưới (mặt đường/vỉa hè, y=1440/2160),
 *       tex  = dải trên (nhà/cây/trời, y=0/2160).
 *     Độ phẳng đo bằng gradient không gian trung bình trên frame clean
 *     (flat ~1,16 vs tex ~4,9 — chênh ~4,2x; xem LIMITS).
 *   - 3 tốc độ danh nghĩa 12 / 24 / 48 px/f (đo lại ~14 / ~26 / ~49 px/f —
 *     cộng thêm ~+1..2,4 px/f do chuyển động riêng của nguồn phóng đại 2x
 *     qua crop zoom; hai bề mặt khớp nhau trong 0,4 px/f ở cùng tốc độ).
 *   - Mỗi điều kiện render thật qua render.js: ctrl + denoise 0.5/0.7/0.8.
 *
 * Phương pháp đo ghost Y HỆT R4 (trail + b từng dải |dC|, b_small là số kết
 * luận; sàn encode CRF23 trừ ra, kết luận tính trên PHẦN VƯỢT SÀN).
 * Khác R4: clip 48 px/f chỉ dài 2s (50 frame) vì cửa sổ crop hết hành trình
 * 2560px — assert số frame tối thiểu hạ 60 -> 40; thêm std của b theo từng
 * cặp frame để ước lượng sai số chuẩn.
 *
 * BẪY ĐÃ GẶP KHI DỰNG PAN (ghi để đợt sau khỏi vấp lại): dùng `-ss` TRƯỚC `-i`
 * làm biến đếm `n` của filter crop bắt đầu từ ~125 (5s x 25fps) thay vì 0,
 * nên x='24*n' vượt max 2560 và bị kẹp đứng yên — 3 biểu thức khác nhau cho
 * ra file mp4 BYTE-IDENTICAL. Cách sửa: trim=start=5,setpts=PTS-STARTPTS
 * trong filter chain để `n` đếm từ 0. Đã kiểm chứng: tốc độ đo lại khớp
 * danh nghĩa + offset chuyển động nguồn; resp 0,78-0,86.
 *
 * Footage + render + frame .gray chỉ ở scratch, KHÔNG đưa vào batch.
 * Cách chạy: node server/render/src/test_round65_s3_whip_pan_ghost.js
 * (cần ffmpeg, ffprobe, python3 + numpy, python server/tracking/.venv
 * cho cv2). Harness resumable: render/đoạn/frame đã có sẽ tái dùng.
 * Thời gian ~20-40 phút tùy tải.
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const work = path.join(process.env.HOME, "workspace", ".scratch-r65s3");
fs.mkdirSync(work, { recursive: true });
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const CV2_PY = path.join(RENDER, "..", "tracking", ".venv", "bin", "python");
const SRC = path.join(process.env.HOME, "workspace", ".scratch-r64r4", "slovenska.webm");
const SRC_SHA256 = "ae8f684c170da8e0ac10f00b62705d51c121a80a05414008c6726491ecd63db5";
const SRC_FPS = 25;
const SRC_START = 5; // cửa sổ nguồn: camera tĩnh (median ~0,7 px/f, resp 0,84)

// id, dải y trong ảnh upscale 3840x2160, tốc độ danh nghĩa (px/f ở 720p), dài (s)
const SEGMENTS = [
  { id: "flat-12", band: "flat", y: 1440, nominal: 12, duration: 5 },
  { id: "flat-24", band: "flat", y: 1440, nominal: 24, duration: 4 },
  { id: "flat-48", band: "flat", y: 1440, nominal: 48, duration: 2 },
  { id: "tex-12", band: "tex", y: 0, nominal: 12, duration: 5 },
  { id: "tex-24", band: "tex", y: 0, nominal: 24, duration: 4 },
  { id: "tex-48", band: "tex", y: 0, nominal: 48, duration: 2 },
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
  meta: { name: "r65s3", width: W, height: H, fps },
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

// --- Đo ghost (bản R4, chỉ đổi: assert N>=40 cho clip 2s + thêm std của b) ---
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
assert N >= 40, f"clean frames {N} < 40"
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
                    "p90": round(float(np.percentile(ba, 90)), 4),
                    "std": round(float(ba.std()), 4),
                    "se": round(float(ba.std() / np.sqrt(len(ba))), 4)}
    out["blendByBand"] = {names[i]: (round(float(-bandNum[i] / bandDen[i]), 4) if bandDen[i] > 0 else 0.0)
                          for i in range(4)}
    print("REAL_GHOST " + json.dumps(out))
`;
const ghostPy = path.join(work, "ghost_real.py");
fs.writeFileSync(ghostPy, GHOST_PY);

// --- Đo độ phẳng: gradient không gian trung bình trên frame clean ---------
const FLAT_PY = `
import sys, json, glob
import numpy as np
W, H = 1280, 720
cleanDir = sys.argv[1]
cf = sorted(glob.glob(cleanDir + "/f*.gray"))
gs = []
for f in cf[:5]:
    a = np.fromfile(f, dtype=np.uint8).reshape(H, W).astype(np.float64)
    gx = np.abs(np.diff(a, axis=1)); gy = np.abs(np.diff(a, axis=0))
    gs.append(float((gx.mean() + gy.mean()) / 2))
print("FLATNESS " + json.dumps({"frames": len(cf), "grad_mean": round(float(np.mean(gs)), 4),
                                 "grad_std": round(float(np.std(gs)), 4)}))
`;
const flatPy = path.join(work, "flatness.py");
fs.writeFileSync(flatPy, FLAT_PY);

// --- Đo tốc độ (phase correlation, bản R4) ---------------------------------
const scanPy = path.join(work, "scan_seg.py");
if (!fs.existsSync(scanPy)) {
  throw new Error("thiếu scan_seg.py trong scratch (copy từ đợt 64)");
}
function measureSpeed(segMp4) {
  const r = spawnSync(CV2_PY, [scanPy, segMp4], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`scan toc do loi: ${r.stdout} ${r.stderr}`);
  return JSON.parse((r.stdout || "").trim().split("\n").pop());
}
function measureFlatness(cleanDir) {
  const r = spawnSync("python3", [flatPy, cleanDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`flatness loi: ${r.stdout} ${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("FLATNESS "));
  return JSON.parse(line.slice("FLATNESS ".length));
}
function ghostOf(cleanDir, renderJobs) {
  const args = [ghostPy, cleanDir];
  for (const [lab, dir] of renderJobs) args.push(`${lab}=${dir}`);
  const r = spawnSync("python3", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ghost_real.py loi: ${r.stdout} ${r.stderr}`);
  const framesLine = (r.stdout || "").split("\n").find((l) => l.startsWith("REAL_FRAMES "));
  const pixelsLine = (r.stdout || "").split("\n").find((l) => l.startsWith("REAL_PIXELS "));
  const out = { frames: framesLine, pixels: JSON.parse(pixelsLine.slice("REAL_PIXELS ".length)), results: {} };
  for (const line of (r.stdout || "").split("\n")) {
    if (line.startsWith("REAL_GHOST ")) {
      const j = JSON.parse(line.slice("REAL_GHOST ".length));
      out.results[j.label] = j;
    }
  }
  if (Object.keys(out.results).length !== renderJobs.length) {
    throw new Error(`không parse đủ ghost: ${r.stdout} ${r.stderr}`);
  }
  return out;
}

console.log(`== Đợt 65 S3 — ghost whip-pan >8px/f + giả thuyết bề mặt phẳng (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- Clip gốc: tái dùng file đợt 64 + verify sha256 -------------------------
console.log("\n== Clip gốc ==");
if (!fs.existsSync(SRC) || sha256(SRC) !== SRC_SHA256) {
  throw new Error("slovenska.webm thiếu hoặc sha256 không khớp đợt 64 — dừng, không tải lại lặng lẽ");
}
console.log(`   📹 slovenska.webm: sha256 khớp (CC BY 3.0), dùng lại từ đợt 64`);

// --- Tạo segment whip-pan (tái dùng nếu đã có + probe đúng) -----------------
function genSegment(seg) {
  const segFile = `${seg.id}-seg.mp4`;
  const segPath = path.join(work, segFile);
  const prev = probeVideo(segPath);
  const end = SRC_START + seg.duration;
  if (fs.existsSync(segPath) && prev.codec === "h264" && prev.width === 1280 && prev.height === 720
      && Math.abs(prev.duration - seg.duration) < 0.15) {
    console.log(`   📹 ${seg.id}: segment đã có, tái dùng`);
    return segPath;
  }
  // trim+setpts để biến đếm n của crop bắt đầu từ 0 (xem header: -ss trước -i làm n lệch).
  const vf = `trim=start=${SRC_START}:end=${end},setpts=PTS-STARTPTS,scale=3840:2160:flags=lanczos,crop=1280:720:x='${seg.nominal}*n':y=${seg.y}`;
  run("ffmpeg", ["-i", SRC, "-vf", vf, "-r", String(SRC_FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", segPath], `tạo segment whip-pan ${seg.id}`);
  return segPath;
}

const summary = { segments: {} };
for (const seg of SEGMENTS) {
  const segFile = `${seg.id}-seg.mp4`;
  const segPath = genSegment(seg);
  console.log(`\n== ${seg.id} (${seg.band}, danh nghĩa ${seg.nominal} px/f, ${seg.duration}s) ==`);
  const sp = probeVideo(segPath);
  ok(sp.codec === "h264" && sp.width === 1280 && sp.height === 720 && Math.abs(sp.duration - seg.duration) < 0.15,
    `${seg.id}: segment ${seg.duration}s 1280x720 OK (${sp.duration.toFixed(2)}s)`);
  fs.copyFileSync(segPath, path.join(mediaDir, segFile));

  const speed = measureSpeed(segPath);
  console.log(`   📊 tốc độ đo lại: median ${speed.median_px_s} px/s = ${speed.median_px_per_frame_720p} px/frame @720p (p90 ${speed.p90_px_s} px/s, resp median ${speed.resp_median}, ${speed.n_pairs} cặp)`);
  ok(speed.resp_median > 0.3, `${seg.id}: phase correlation tin được (resp median ${speed.resp_median} > 0.3)`);
  ok(speed.median_px_per_frame_720p > 8, `${seg.id}: đúng dải whip-pan >8 px/f (đo được ${speed.median_px_per_frame_720p})`);
  ok(Math.abs(speed.median_px_per_frame_720p - seg.nominal) < 0.3 * seg.nominal,
    `${seg.id}: tốc độ đo khớp danh nghĩa trong 30% (${speed.median_px_per_frame_720p} vs ${seg.nominal})`);

  const expectN = seg.duration * SRC_FPS;
  const cleanDir = path.join(work, `frames-${seg.id}-clean`);
  const nClean = extractFrames(segPath, cleanDir, expectN);
  ok(nClean === expectN, `${seg.id}: frame chuẩn đủ ${nClean}/${expectN}`);
  const flatness = measureFlatness(cleanDir);
  console.log(`   📊 độ phẳng: gradient trung bình ${flatness.grad_mean} (std ${flatness.grad_std}, ${flatness.frames} frame)`);

  const specDenoise = (s) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", segFile, seg.duration, s === null ? {} : { enhance: { denoise: { strength: s } } })] }], 1280, 720, SRC_FPS);
  const jobs = [];
  const doRender = (s, name) => {
    const r = render(specDenoise(s), `${seg.id}-${name}`);
    ok(r.status === 0 && outOk(r.outPath) && probeVideo(r.outPath).width === 1280,
      `${seg.id}-${name}: render OK (${r.reused ? "tái dùng" : `${r.secs.toFixed(1)}s`})`);
    const dir = path.join(work, `frames-${seg.id}-${name}`);
    const n = extractFrames(r.outPath, dir, expectN);
    ok(n === expectN, `${seg.id}-${name}: đủ frame ${n}/${expectN}`);
    jobs.push([name, dir]);
  };
  doRender(null, "ctrl");
  for (const s of STRENGTHS) doRender(s, `d${String(s).replace(".", "_")}`);

  const ghost = ghostOf(cleanDir, jobs);
  console.log(`   📊 ${ghost.frames}; tỉ lệ pixel theo dải |dC|: ${JSON.stringify(ghost.pixels)}%`);
  const G = ghost.results;
  for (const [lab, g] of Object.entries(G)) {
    console.log(`   📊 ${lab}: trail small=${g.small.mean} flat=${g.flat.mean} mid=${g.mid.mean} large=${g.large.mean} | b flat=${g.blendByBand.flat} small=${g.blendByBand.small} mid=${g.blendByBand.mid} large=${g.blendByBand.large} (blend gộp ${g.blend.mean}±${g.blend.se} SE)`);
  }
  ok(G.ctrl.blendByBand.small < 0.25,
    `${seg.id}: sàn encode có giới hạn (b_small ctrl=${G.ctrl.blendByBand.small} < 0.25)`);
  ok(G.d0_5.blendByBand.small > G.ctrl.blendByBand.small + 0.05,
    `${seg.id}: denoise 0.5 tạo ghost vượt rõ sàn encode (b_small ${G.d0_5.blendByBand.small} > ctrl ${G.ctrl.blendByBand.small} + 0.05)`);
  console.log(`   📊 ${seg.id}: vượt sàn b_large ở 0.8 = ${(G.d0_8.blendByBand.large - G.ctrl.blendByBand.large).toFixed(4)} (ctrl ${G.ctrl.blendByBand.large} → 0.8 ${G.d0_8.blendByBand.large})`);
  ok(ghost.pixels.small >= 2,
    `${seg.id}: dải small đủ pixel để đo (${ghost.pixels.small}% frame)`);
  summary.segments[seg.id] = {
    band: seg.band, nominal: seg.nominal, duration: seg.duration,
    clip: "slovenska.webm", license: "CC BY 3.0", start: SRC_START, fps: SRC_FPS,
    speedMeasured: speed, flatness, pixels: ghost.pixels, results: G,
  };
}

// --- Bảng so sánh: b_small vượt sàn theo tốc độ x bề mặt --------------------
console.log("\n== So sánh b_small vượt sàn (b - b_ctrl) theo tốc độ x bề mặt ==");
console.log("   đoạn            tốc độ đo(px/f) grad | b_small ctrl | 0.5 (vượt) | 0.7 (vượt) | 0.8 (vượt) | nhảy 0.5→0.7");
for (const seg of SEGMENTS) {
  const s = summary.segments[seg.id];
  const g = s.results;
  const ex = (x) => (g[x].blendByBand.small - g.ctrl.blendByBand.small).toFixed(3);
  const jumpEx = (g.d0_7.blendByBand.small - g.d0_5.blendByBand.small).toFixed(3);
  console.log(`   ${seg.id.padEnd(15)} ${String(s.speedMeasured.median_px_per_frame_720p).padStart(6)} ${String(s.flatness.grad_mean).padStart(6)} | ${g.ctrl.blendByBand.small.toFixed(3).padStart(9)} | ${g.d0_5.blendByBand.small.toFixed(3)} (${ex("d0_5")}) | ${g.d0_7.blendByBand.small.toFixed(3)} (${ex("d0_7")}) | ${g.d0_8.blendByBand.small.toFixed(3)} (${ex("d0_8")}) | ${jumpEx.padStart(10)}`);
}
console.log("\n== Kiểm chứng giả thuyết: flat vs tex ở cùng tốc độ (b_small vượt sàn) ==");
for (const nom of [12, 24, 48]) {
  const f = summary.segments[`flat-${nom}`].results;
  const t = summary.segments[`tex-${nom}`].results;
  const exF = (x) => (f[x].blendByBand.small - f.ctrl.blendByBand.small).toFixed(3);
  const exT = (x) => (t[x].blendByBand.small - t.ctrl.blendByBand.small).toFixed(3);
  console.log(`   ${nom} px/f: flat 0.5=${exF("d0_5")} 0.7=${exF("d0_7")} 0.8=${exF("d0_8")} | tex 0.5=${exT("d0_5")} 0.7=${exT("d0_7")} 0.8=${exT("d0_8")} | chênh flat-tex ở 0.7 = ${(f.d0_7.blendByBand.small - f.ctrl.blendByBand.small - (t.d0_7.blendByBand.small - t.ctrl.blendByBand.small)).toFixed(3)}`);
}
fs.writeFileSync(path.join(work, "summary.json"), JSON.stringify(summary, null, 1));
console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
console.log(`   WORK=${work} (summary.json + frame .gray trong scratch; footage gốc KHÔNG đưa vào batch)`);
if (fail > 0) process.exit(1);
