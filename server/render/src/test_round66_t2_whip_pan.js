#!/usr/bin/env node
/**
 * test_round66_t2_whip_pan.js — Phase 9 đợt 66, luồng T2.
 *
 * Nợ đợt 65 S2+S3 (docs/PHASE9_ROUND65_LIMITS.md §8 mục 2):
 *   (1) whip-pan thật >14 px/f + motion blur quang học + metric ghost b_large.
 *
 * Ba phần:
 *   A. ĐÁNH GIÁ b_large LÀM METRIC GHOST (không render mới — tính lại từ
 *      frame đã có của S3 (6 điều kiện, pan tổng hợp 14/26/49 px/f) và R4
 *      (4 đoạn footage thật 0,6–7,9 px/f)):
 *      - độ tách phẳng-vs-chi tiết trong thí nghiệm có kiểm soát (S3);
 *      - độ ổn định: SE theo từng cặp frame (mới — script ghost mở rộng
 *        tính b theo từng cặp frame cho từng dải) + tính xác định
 *        (tính lại phải khớp summary đã lưu tới 0,0005);
 *      - độ nhất quán qua các clip không kiểm soát (R4: CV của phần vượt
 *        sàn qua 4 clip).
 *   B. PAN TỔNG HỢP CÓ MOTION BLUR QUANG HỌC MÔ PHỎNG (màn trập ~180°):
 *      dựng từ slovenska như S3 nhưng crop pan chạy ở 200fps rồi trung
 *      bình trượt 4 sub-frame (tmix) về 25fps — mỗi frame đầu ra tích hợp
 *      4 vị trí crop liên tiếp (vệt mờ ≈ 0,38× độ dịch/frame, thấp hơn
 *      0,5× lý thuyết do lấy mẫu rời rạc 4 điểm thay vì tích phân liên
 *      tục; xem LIMITS). So sánh ghost blur vs không-blur (S3) cùng tốc
 *      độ / cùng bề mặt: ghost có tăng theo tốc độ không khi có blur?
 *   C. PAN THẬT BẰNG CAMERA (motion blur quang học thật):
 *      "Rendszerváltó Nagykoncert panning shot.webm" (Wikimedia Commons,
 *      CC BY 4.0) — quét thô 2fps thấy pan nhanh suốt clip; đo ở fps
 *      native 50fps: t=10–15s median 497,6 px/s (resp 0,854), t=0–5s
 *      410,9 px/s (resp 0,873); kiểm tra hướng theo 5 vùng khung hình:
 *      sx ≈ +285–320 px/s đồng nhất, sy ≈ −24…−69 px/s → pan toàn cục
 *      thật, không phải vật thể chuyển động. Cắt về 25fps (bỏ frame xen
 *      kẽ — mỗi frame giữ nguyên phơi sáng 1/50s, tức đúng tương đương
 *      màn trập 180° ở 25fps): ~19,9 và ~16,4 px/f. Render + đo ghost.
 *
 * Phương pháp đo ghost Y HỆT R4/S3 (trail + b từng dải |dC|, kết luận
 * trên PHẦN VƯỢT SÀN b − b_ctrl). Khác S3: script ghost mở rộng thêm
 * thống kê b theo từng cặp frame cho từng dải (mean/median/std/SE) và
 * mean |dC| của frame chuẩn (để kiểm chứng blur làm giảm |dC|).
 *
 * Footage + render + frame .gray chỉ ở scratch, KHÔNG đưa vào batch.
 * Cách chạy: node server/render/src/test_round66_t2_whip_pan.js
 * (cần ffmpeg, ffprobe, python3 + numpy, python server/tracking/.venv
 * cho cv2). Harness resumable: render/đoạn/frame đã có sẽ tái dùng.
 * Thời gian ~30-60 phút tùy tải (4 đoạn blur gen ở 200fps là phần chậm).
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const { spawnSync } = require("child_process");

const work = path.join(process.env.HOME, "workspace", ".scratch-r66t2");
fs.mkdirSync(work, { recursive: true });
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const CV2_PY = path.join(RENDER, "..", "tracking", ".venv", "bin", "python");
const S3_WORK = path.join(process.env.HOME, "workspace", ".scratch-r65s3");
const R4_WORK = path.join(process.env.HOME, "workspace", ".scratch-r64r4-9h00Sj");
const SRC = path.join(process.env.HOME, "workspace", ".scratch-r64r4", "slovenska.webm");
const SRC_SHA256 = "ae8f684c170da8e0ac10f00b62705d51c121a80a05414008c6726491ecd63db5";
const SRC_FPS = 25;
const SRC_START = 5;
const KONCERT = path.join(work, "koncert-pan.webm");
const KONCERT_SHA256 = "767de7457e72b2c0dbdc95d26c5be8b60ff1d976761fec5a172694c48d7da9f6";

const STRENGTHS = [0.5, 0.7, 0.8];

// --- Phần B: pan tổng hợp có blur (cùng thiết kế S3, thêm tmix 180°) ---
const BLUR_SEGMENTS = [
  { id: "flat-12-blur", band: "flat", y: 1440, nominal: 12, duration: 5 },
  { id: "flat-24-blur", band: "flat", y: 1440, nominal: 24, duration: 4 },
  { id: "tex-12-blur", band: "tex", y: 0, nominal: 12, duration: 5 },
  { id: "tex-24-blur", band: "tex", y: 0, nominal: 24, duration: 4 },
];
// --- Phần C: pan thật bằng camera (koncert), cắt về 25fps ---
const KONCERT_SEGMENTS = [
  { id: "koncert-a", start: 10, duration: 5, expectPxF: [14, 25] },
  { id: "koncert-b", start: 0, duration: 5, expectPxF: [14, 25] },
];
// --- Phần A: dữ liệu cũ tính lại ---
const S3_IDS = ["flat-12", "flat-24", "flat-48", "tex-12", "tex-24", "tex-48"];
const R4_IDS = ["ocean-slow", "basgo-mid", "basgo-fast", "slov-fast"];

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
  meta: { name: "r66t2", width: W, height: H, fps },
  tracks,
});
function render(spec, name) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
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

// --- Đo ghost (bản S3 + mở rộng: b theo từng cặp frame từng dải + mean|dC| chuẩn) ---
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
meanAbsDC = float(np.mean([np.abs(dCs[t]).mean() for t in range(1, N)]))
for t in list(bands_id)[:5]:
    c = np.bincount(bands_id[t].ravel(), minlength=4)
    counts += c
npx = W * H * 5
names = ["flat", "small", "mid", "large"]
print("REAL_PIXELS " + json.dumps({names[i]: round(float(counts[i]) / npx * 100, 2) for i in range(4)}))
print("REAL_MEANDC " + json.dumps({"meanAbsDC": round(meanAbsDC, 4)}))
for lab, rdir in jobs:
    rf = sorted(glob.glob(rdir + "/f*.gray"))
    assert len(rf) == N, f"{lab}: frames {len(rf)} != {N}"
    trail = {b: [] for b in names}
    bs = []
    bandNum = np.zeros(4)
    bandDen = np.zeros(4)
    pairB = {i: [] for i in range(4)}
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
        dd = d.ravel(); dc = dC.ravel()
        numPair = np.bincount(bid, weights=dd * dc, minlength=4)
        denPair = np.bincount(bid, weights=dc * dc, minlength=4)
        cntPair = np.bincount(bid, minlength=4)
        for i in range(4):
            if denPair[i] > 0 and cntPair[i] >= 100:
                pairB[i].append(float(-numPair[i] / denPair[i]))
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
    out["bandPairStats"] = {}
    for i in range(4):
        arr = np.array(pairB[i])
        if len(arr) >= 10:
            out["bandPairStats"][names[i]] = {
                "mean": round(float(arr.mean()), 4), "median": round(float(np.median(arr)), 4),
                "std": round(float(arr.std()), 4), "se": round(float(arr.std() / np.sqrt(len(arr))), 4),
                "n": int(len(arr))}
        else:
            out["bandPairStats"][names[i]] = {"mean": None, "n": int(len(arr))}
    print("REAL_GHOST " + json.dumps(out))
`;
const ghostPy = path.join(work, "ghost_real.py");
writeFileEpermRetry(ghostPy, GHOST_PY);

const FLAT_PY = path.join(S3_WORK, "flatness.py");
const scanPy = path.join(S3_WORK, "scan_seg.py");
function measureSpeed(segMp4) {
  const r = spawnSync(CV2_PY, [scanPy, segMp4], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`scan toc do loi: ${r.stdout} ${r.stderr}`);
  return JSON.parse((r.stdout || "").trim().split("\n").pop());
}
function measureFlatness(cleanDir) {
  const r = spawnSync("python3", [FLAT_PY, cleanDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`flatness loi: ${r.stdout} ${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("FLATNESS "));
  return JSON.parse(line.slice("FLATNESS ".length));
}
function ghostOf(cleanDir, renderJobs, cacheTag) {
  // Cache như S2 (ghost-<tag>.json): frame .gray không thay đổi sau khi
  // tách (extractFrames chỉ tạo lại thư mục khi thiếu frame), nên kết quả
  // ghost tính từ cùng frame có thể tái dùng. Cache chỉ hợp lệ khi số
  // frame của cả 5 thư mục khớp số đã lưu; nếu khác, tính lại.
  const cachePath = cacheTag ? path.join(work, `ghost-cache-${cacheTag}.json`) : null;
  if (cachePath && fs.existsSync(cachePath)) {
    try {
      const c = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      const countsOk = c.dirCounts && c.dirCounts.clean === fs.readdirSync(cleanDir).filter((f) => f.endsWith(".gray")).length
        && renderJobs.every(([lab, dir]) => c.dirCounts[lab] === fs.readdirSync(dir).filter((f) => f.endsWith(".gray")).length);
      if (countsOk) {
        console.log(`   📊 ghost ${cacheTag}: tái dùng cache (${c.results ? Object.keys(c.results).length : 0} label)`);
        return c;
      }
      console.log(`   📊 ghost ${cacheTag}: cache lệch số frame, tính lại`);
    } catch (e) {
      console.log(`   📊 ghost ${cacheTag}: cache lỗi (${e.message}), tính lại`);
    }
  }
  const args = [ghostPy, cleanDir];
  for (const [lab, dir] of renderJobs) args.push(`${lab}=${dir}`);
  const r = spawnSync("python3", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ghost_real.py loi: ${r.stdout} ${r.stderr}`);
  const framesLine = (r.stdout || "").split("\n").find((l) => l.startsWith("REAL_FRAMES "));
  const pixelsLine = (r.stdout || "").split("\n").find((l) => l.startsWith("REAL_PIXELS "));
  const dcLine = (r.stdout || "").split("\n").find((l) => l.startsWith("REAL_MEANDC "));
  const out = { frames: framesLine, pixels: JSON.parse(pixelsLine.slice("REAL_PIXELS ".length)),
    meanAbsDC: JSON.parse(dcLine.slice("REAL_MEANDC ".length)).meanAbsDC, results: {} };
  for (const line of (r.stdout || "").split("\n")) {
    if (line.startsWith("REAL_GHOST ")) {
      const j = JSON.parse(line.slice("REAL_GHOST ".length));
      out.results[j.label] = j;
    }
  }
  if (Object.keys(out.results).length !== renderJobs.length) {
    throw new Error(`không parse đủ ghost: ${r.stdout} ${r.stderr}`);
  }
  if (cachePath) {
    out.dirCounts = { clean: fs.readdirSync(cleanDir).filter((f) => f.endsWith(".gray")).length };
    for (const [lab, dir] of renderJobs) {
      out.dirCounts[lab] = fs.readdirSync(dir).filter((f) => f.endsWith(".gray")).length;
    }
    writeFileEpermRetry(cachePath, JSON.stringify(out));
  }
  return out;
}

// --- Kiểm chứng blur: gradient x + |blur-sharp| trên frame chuẩn ----------
// (Đổi ở lần chạy lại sau run 1: assert cũ "mean|dC| giảm ≥10%" SAI tiền
// đề — mean|dC| chủ yếu do độ dịch pan (12–24 px/f), vệt mờ 4,5–9 px
// chỉ giảm |dC| ~2%; xem LIMITS §6. Blur dọc pan phải đo bằng gradient
// theo hướng pan (gx) và độ lệch trực tiếp |blur-sharp|.)
const BLURCHECK_PY = `
import sys, json, glob
import numpy as np
W, H = 1280, 720
def load(p):
    return np.fromfile(p, dtype=np.uint8).reshape(H, W).astype(np.float64)
bd = sorted(glob.glob(sys.argv[1] + "/f*.gray"))
sd = sorted(glob.glob(sys.argv[2] + "/f*.gray"))
n = min(len(bd), len(sd))
assert n >= 10, f"frame {n} < 10"
bgx, bgy, sgx, sgy, diff = [], [], [], [], []
for i in range(2, min(n, 12)):
    b = load(bd[i]); s = load(sd[i])
    bgx.append(float(np.abs(np.diff(b, axis=1)).mean()))
    bgy.append(float(np.abs(np.diff(b, axis=0)).mean()))
    sgx.append(float(np.abs(np.diff(s, axis=1)).mean()))
    sgy.append(float(np.abs(np.diff(s, axis=0)).mean()))
    diff.append(float(np.abs(b - s).mean()))
print("BLURCHECK " + json.dumps({
    "gxRatio": round(float(np.mean(bgx) / np.mean(sgx)), 4),
    "gyRatio": round(float(np.mean(bgy) / np.mean(sgy)), 4),
    "meanAbsDiff": round(float(np.mean(diff)), 4), "nSampled": min(n, 12) - 2}))
`;
const blurCheckPy = path.join(work, "blurcheck.py");
writeFileEpermRetry(blurCheckPy, BLURCHECK_PY);
function blurCheck(blurCleanDir, sharpCleanDir) {
  const r = spawnSync("python3", [blurCheckPy, blurCleanDir, sharpCleanDir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`blurcheck loi: ${r.stdout} ${r.stderr}`);
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("BLURCHECK "));
  return JSON.parse(line.slice("BLURCHECK ".length));
}

console.log(`== Đợt 66 T2 — whip-pan thật >14px/f + motion blur quang học + metric b_large (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- Clip gốc: tái dùng file đợt 64 + verify sha256 -------------------------
console.log("\n== Clip gốc ==");
if (!fs.existsSync(SRC) || sha256(SRC) !== SRC_SHA256) {
  throw new Error("slovenska.webm thiếu hoặc sha256 không khớp đợt 64 — dừng, không tải lại lặng lẽ");
}
console.log(`   📹 slovenska.webm: sha256 khớp (CC BY 3.0)`);
if (!fs.existsSync(KONCERT) || sha256(KONCERT) !== KONCERT_SHA256) {
  throw new Error("koncert-pan.webm thiếu hoặc sha256 không khớp bản đã tải (xem round66-t2.md) — dừng");
}
console.log(`   📹 koncert-pan.webm: sha256 khớp (CC BY 4.0, pan thật)`);

const summary = { partA: {}, partB: {}, partC: {} };

// ================= PHẦN A: tính lại b_large trên dữ liệu cũ =================
console.log("\n== PHẦN A: đánh giá b_large trên dữ liệu S3 + R4 (tính lại, không render mới) ==");
const s3Summary = JSON.parse(fs.readFileSync(path.join(S3_WORK, "summary.json"), "utf8"));
const r4Summary = JSON.parse(fs.readFileSync(path.join(R4_WORK, "summary.json"), "utf8"));
const LABELS = ["ctrl", "d0_5", "d0_7", "d0_8"];
function partA(ids, baseDir, stored) {
  const out = {};
  for (const id of ids) {
    const cleanDir = path.join(baseDir, `frames-${id}-clean`);
    const jobs = LABELS.map((lab) => [lab, path.join(baseDir, `frames-${id}-${lab}`)]);
    const ghost = ghostOf(cleanDir, jobs, `${baseDir === S3_WORK ? "s3" : "r4"}-${id}`);
    const G = ghost.results;
    // Tính xác định: b gộp từng dải phải khớp summary đã lưu (4 chữ số).
    let maxDiff = 0;
    for (const lab of LABELS) {
      for (const band of ["flat", "small", "mid", "large"]) {
        const old = stored.segments[id].results[lab].blendByBand[band];
        maxDiff = Math.max(maxDiff, Math.abs(G[lab].blendByBand[band] - old));
      }
    }
    ok(maxDiff < 0.0005, `${id}: tính lại khớp summary đã lưu (sai lệch tối đa ${maxDiff.toFixed(5)} < 0,0005 — pipeline xác định)`);
    const ex = (lab, band) => G[lab].blendByBand[band] - G.ctrl.blendByBand[band];
    console.log(`   📊 ${id}: vượt sàn @0,7 small=${ex("d0_7", "small").toFixed(4)} large=${ex("d0_7", "large").toFixed(4)} | nhảy 0,5→0,7 small=${(G.d0_7.blendByBand.small - G.d0_5.blendByBand.small).toFixed(4)} large=${(G.d0_7.blendByBand.large - G.d0_5.blendByBand.large).toFixed(4)} | SE cặp-frame @0,7 small=${G.d0_7.bandPairStats.small.se} large=${G.d0_7.bandPairStats.large.se} (n=${G.d0_7.bandPairStats.large.n}) | pixel large=${ghost.pixels.large}%`);
    out[id] = { excess07: { small: +ex("d0_7", "small").toFixed(4), large: +ex("d0_7", "large").toFixed(4) },
      excess08: { small: +ex("d0_8", "small").toFixed(4), large: +ex("d0_8", "large").toFixed(4) },
      jump0507: { small: +(G.d0_7.blendByBand.small - G.d0_5.blendByBand.small).toFixed(4),
        large: +(G.d0_7.blendByBand.large - G.d0_5.blendByBand.large).toFixed(4) },
      se07: { small: G.d0_7.bandPairStats.small.se, large: G.d0_7.bandPairStats.large.se },
      se07n: { small: G.d0_7.bandPairStats.small.n, large: G.d0_7.bandPairStats.large.n },
      pixels: ghost.pixels, meanAbsDC: ghost.meanAbsDC, maxDiff: +maxDiff.toFixed(5) };
  }
  return out;
}
summary.partA.s3 = partA(S3_IDS, S3_WORK, s3Summary);
summary.partA.r4 = partA(R4_IDS, R4_WORK, r4Summary);

// Độ tách phẳng-vs-chi tiết trong S3 (cùng clip, cùng tốc độ, chỉ khác dải y).
console.log("\n== PHẦN A: độ tách phẳng-vs-chi tiết (S3, có kiểm soát) ==");
for (const nom of [12, 24, 48]) {
  const f = summary.partA.s3[`flat-${nom}`];
  const t = summary.partA.s3[`tex-${nom}`];
  const ratioSmall = f.excess07.small / t.excess07.small;
  const ratioLarge = f.excess07.large / t.excess07.large;
  console.log(`   ${nom} px/f: vượt sàn @0,7 — b_small phẳng/tex = ${f.excess07.small}/${t.excess07.small} (tỉ lệ ${ratioSmall.toFixed(2)}x) | b_large phẳng/tex = ${f.excess07.large}/${t.excess07.large} (tỉ lệ ${ratioLarge.toFixed(2)}x)`);
  ok(ratioLarge >= 2.0, `S3 ${nom} px/f: b_large tách phẳng-vs-chi tiết ≥2x (thực ${ratioLarge.toFixed(2)}x)`);
  ok(ratioSmall < 1.5, `S3 ${nom} px/f: b_small KHÔNG tách phẳng-vs-chi tiết (tỉ lệ chỉ ${ratioSmall.toFixed(2)}x < 1,5x)`);
}
// Độ nhất quán qua clip không kiểm soát (R4): hệ số biến thiên CV của vượt sàn @0,7.
function cv(xs) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  return sd / m;
}
const r4Small = R4_IDS.map((id) => summary.partA.r4[id].excess07.small);
const r4Large = R4_IDS.map((id) => summary.partA.r4[id].excess07.large);
const cvSmall = cv(r4Small), cvLarge = cv(r4Large);
console.log(`\n== PHẦN A: độ nhất quán qua 4 clip thật R4 (vượt sàn @0,7) ==`);
console.log(`   b_small: ${r4Small.map((x) => x.toFixed(3)).join(" / ")} → CV=${cvSmall.toFixed(2)}`);
console.log(`   b_large: ${r4Large.map((x) => x.toFixed(3)).join(" / ")} → CV=${cvLarge.toFixed(2)}`);
ok(cvLarge > cvSmall, `R4: b_large biến thiên tương đối qua clip (${cvLarge.toFixed(2)}) LỚN HƠN b_small (${cvSmall.toFixed(2)}) — b_large phụ thuộc nội dung mạnh hơn`);
summary.partA.separation = { s3ratios: {}, cvR4: { small: +cvSmall.toFixed(3), large: +cvLarge.toFixed(3) } };
for (const nom of [12, 24, 48]) {
  const f = summary.partA.s3[`flat-${nom}`];
  const t = summary.partA.s3[`tex-${nom}`];
  summary.partA.separation.s3ratios[nom] = {
    small: +(f.excess07.small / t.excess07.small).toFixed(2),
    large: +(f.excess07.large / t.excess07.large).toFixed(2) };
}

// ================= PHẦN B: pan tổng hợp có motion blur =================
console.log("\n== PHẦN B: pan tổng hợp có motion blur quang học mô phỏng (màn trập ~180°) ==");
function genBlurSegment(seg) {
  const segFile = `${seg.id}-seg.mp4`;
  const segPath = path.join(work, segFile);
  const prev = probeVideo(segPath);
  const end = SRC_START + seg.duration;
  if (fs.existsSync(segPath) && prev.codec === "h264" && prev.width === 1280 && prev.height === 720
      && Math.abs(prev.duration - seg.duration) < 0.15) {
    console.log(`   📹 ${seg.id}: segment đã có, tái dùng`);
    return segPath;
  }
  // fps=200 nhân đôi frame nguồn 25fps (mỗi frame nguồn lặp 8 lần), crop
  // trượt theo n ở 200fps (bước nominal/8 px/sub-frame), tmix trung bình
  // trượt 4 sub-frame liên tiếp (= phơi sáng 20ms ≈ màn trập 180° ở
  // 25fps), fps=25 chọn mỗi frame thứ 8. Xem header về vệt mờ 0,38×.
  const step = seg.nominal / 8;
  const vf = `trim=start=${SRC_START}:end=${end},setpts=PTS-STARTPTS,fps=200,scale=3840:2160:flags=lanczos,crop=1280:720:x='${step}*n':y=${seg.y},tmix=frames=4:weights='1 1 1 1',fps=25`;
  run("ffmpeg", ["-i", SRC, "-vf", vf, "-r", String(SRC_FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", segPath], `tạo segment blur-pan ${seg.id}`);
  return segPath;
}

for (const seg of BLUR_SEGMENTS) {
  const segFile = `${seg.id}-seg.mp4`;
  const segPath = genBlurSegment(seg);
  console.log(`\n== ${seg.id} (${seg.band}, danh nghĩa ${seg.nominal} px/f, ${seg.duration}s, CÓ blur) ==`);
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

  const ghost = ghostOf(cleanDir, jobs, seg.id);
  console.log(`   📊 ${ghost.frames}; tỉ lệ pixel theo dải |dC|: ${JSON.stringify(ghost.pixels)}%; mean|dC| chuẩn=${ghost.meanAbsDC}`);
  const G = ghost.results;
  for (const [lab, g] of Object.entries(G)) {
    console.log(`   📊 ${lab}: trail small=${g.small.mean} | b flat=${g.blendByBand.flat} small=${g.blendByBand.small} mid=${g.blendByBand.mid} large=${g.blendByBand.large} (blend gộp ${g.blend.mean}±${g.blend.se} SE)`);
  }
  ok(G.ctrl.blendByBand.small < 0.25,
    `${seg.id}: sàn encode có giới hạn (b_small ctrl=${G.ctrl.blendByBand.small} < 0.25)`);
  ok(G.d0_5.blendByBand.small > G.ctrl.blendByBand.small + 0.05,
    `${seg.id}: denoise 0.5 tạo ghost vượt rõ sàn encode (b_small ${G.d0_5.blendByBand.small} > ctrl ${G.ctrl.blendByBand.small} + 0.05)`);
  ok(ghost.pixels.small >= 2,
    `${seg.id}: dải small đủ pixel để đo (${ghost.pixels.small}% frame)`);
  // Blur có thật không: gradient x (hướng pan) của frame chuẩn có-blur
  // phải thấp hơn bản không-blur cùng điều kiện (S3), VÀ frame blur phải
  // lệch trực tiếp khỏi frame sắc nét (|blur-sharp| > 1 mức xám).
  // (mean|dC| KHÔNG dùng làm bằng chứng blur nữa — xem đầu file.)
  const noBlurId = seg.id.replace("-blur", "");
  const noBlurCleanDir = path.join(S3_WORK, `frames-${noBlurId}-clean`);
  const bc = blurCheck(cleanDir, noBlurCleanDir);
  const noBlurMeanDC = summary.partA.s3[noBlurId].meanAbsDC;
  const dcRatio = ghost.meanAbsDC / noBlurMeanDC;
  console.log(`   📊 blur check: gx ratio=${bc.gxRatio} (blur/sharp), gy ratio=${bc.gyRatio}, mean|blur-sharp|=${bc.meanAbsDiff} mức xám | mean|dC| chuẩn có-blur=${ghost.meanAbsDC} vs không-blur S3=${noBlurMeanDC} (tỉ lệ ${dcRatio.toFixed(3)} — chỉ tham khảo)`);
  ok(bc.gxRatio < 0.98, `${seg.id}: blur làm giảm gradient x (tỉ lệ ${bc.gxRatio} < 0,98 — blur có thật)`);
  ok(bc.meanAbsDiff > 1.0, `${seg.id}: frame blur lệch khỏi frame sắc nét (mean|blur-sharp|=${bc.meanAbsDiff} > 1,0 mức xám)`);
  summary.partB[seg.id] = {
    band: seg.band, nominal: seg.nominal, duration: seg.duration, blur: "tmix4@200fps (~180 deg shutter)",
    clip: "slovenska.webm", license: "CC BY 3.0", start: SRC_START, fps: SRC_FPS,
    speedMeasured: speed, flatness, pixels: ghost.pixels, meanAbsDC: ghost.meanAbsDC,
    meanAbsDCNoBlur: noBlurMeanDC, dcRatio: +dcRatio.toFixed(3), results: G,
  };
}

// So sánh blur vs không-blur: ghost có tăng theo tốc độ không khi có blur?
console.log("\n== PHẦN B: so sánh blur vs không-blur (b_small vượt sàn @0,7 + nhảy 0,5→0,7) ==");
for (const seg of BLUR_SEGMENTS) {
  const b = summary.partB[seg.id];
  const nb = summary.partA.s3[seg.id.replace("-blur", "")];
  const exB = (lab, band) => b.results[lab].blendByBand[band] - b.results.ctrl.blendByBand[band];
  const exNB = (lab, band) => s3Summary.segments[seg.id.replace("-blur", "")].results[lab].blendByBand[band]
    - s3Summary.segments[seg.id.replace("-blur", "")].results.ctrl.blendByBand[band];
  console.log(`   ${seg.id}: b_small vượt @0,7 blur=${exB("d0_7", "small").toFixed(3)} vs không-blur=${exNB("d0_7", "small").toFixed(3)} | nhảy 0,5→0,7 blur=${(b.results.d0_7.blendByBand.small - b.results.d0_5.blendByBand.small).toFixed(3)} vs không-blur=${(s3Summary.segments[seg.id.replace("-blur", "")].results.d0_7.blendByBand.small - s3Summary.segments[seg.id.replace("-blur", "")].results.d0_5.blendByBand.small).toFixed(3)} | b_large vượt @0,7 blur=${exB("d0_7", "large").toFixed(3)} vs không-blur=${exNB("d0_7", "large").toFixed(3)}`);
}

// ================= PHẦN C: pan thật bằng camera (koncert) =================
console.log("\n== PHẦN C: pan thật bằng camera — koncert (motion blur quang học thật) ==");
function genKoncertSegment(seg) {
  const segFile = `${seg.id}-seg.mp4`;
  const segPath = path.join(work, segFile);
  const prev = probeVideo(segPath);
  if (fs.existsSync(segPath) && prev.codec === "h264" && prev.width === 1280 && prev.height === 720
      && Math.abs(prev.duration - seg.duration) < 0.15) {
    console.log(`   📹 ${seg.id}: segment đã có, tái dùng`);
    return segPath;
  }
  // trim + fps=25: bỏ frame xen kẽ của nguồn 50fps; mỗi frame giữ nguyên
  // phơi sáng 1/50s → đúng tương đương màn trập 180° ở 25fps.
  const vf = `trim=start=${seg.start}:end=${seg.start + seg.duration},setpts=PTS-STARTPTS,fps=25,scale=1280:720`;
  run("ffmpeg", ["-i", KONCERT, "-vf", vf, "-r", String(SRC_FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", segPath], `tạo segment koncert ${seg.id}`);
  return segPath;
}
for (const seg of KONCERT_SEGMENTS) {
  const segFile = `${seg.id}-seg.mp4`;
  const segPath = genKoncertSegment(seg);
  console.log(`\n== ${seg.id} (koncert t=${seg.start}–${seg.start + seg.duration}s, pan thật) ==`);
  const sp = probeVideo(segPath);
  ok(sp.codec === "h264" && sp.width === 1280 && sp.height === 720 && Math.abs(sp.duration - seg.duration) < 0.15,
    `${seg.id}: segment ${seg.duration}s 1280x720 OK (${sp.duration.toFixed(2)}s)`);
  fs.copyFileSync(segPath, path.join(mediaDir, segFile));

  const speed = measureSpeed(segPath);
  console.log(`   📊 tốc độ đo lại @25fps: median ${speed.median_px_s} px/s = ${speed.median_px_per_frame_720p} px/frame (p90 ${speed.p90_px_s} px/s, resp median ${speed.resp_median}, ${speed.n_pairs} cặp)`);
  ok(speed.resp_median > 0.3, `${seg.id}: phase correlation tin được (resp median ${speed.resp_median} > 0.3)`);
  ok(speed.median_px_per_frame_720p >= seg.expectPxF[0] && speed.median_px_per_frame_720p <= seg.expectPxF[1],
    `${seg.id}: đúng dải whip-pan thật >14 px/f (đo được ${speed.median_px_per_frame_720p} px/f, kỳ vọng ${seg.expectPxF[0]}–${seg.expectPxF[1]})`);

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

  const ghost = ghostOf(cleanDir, jobs, seg.id);
  console.log(`   📊 ${ghost.frames}; tỉ lệ pixel theo dải |dC|: ${JSON.stringify(ghost.pixels)}%; mean|dC| chuẩn=${ghost.meanAbsDC}`);
  const G = ghost.results;
  for (const [lab, g] of Object.entries(G)) {
    console.log(`   📊 ${lab}: trail small=${g.small.mean} | b flat=${g.blendByBand.flat} small=${g.blendByBand.small} mid=${g.blendByBand.mid} large=${g.blendByBand.large} (blend gộp ${g.blend.mean}±${g.blend.se} SE)`);
  }
  ok(G.ctrl.blendByBand.small < 0.25,
    `${seg.id}: sàn encode có giới hạn (b_small ctrl=${G.ctrl.blendByBand.small} < 0.25)`);
  ok(G.d0_5.blendByBand.small > G.ctrl.blendByBand.small + 0.05,
    `${seg.id}: denoise 0.5 tạo ghost vượt rõ sàn encode (b_small ${G.d0_5.blendByBand.small} > ctrl ${G.ctrl.blendByBand.small} + 0.05)`);
  ok(ghost.pixels.small >= 2,
    `${seg.id}: dải small đủ pixel để đo (${ghost.pixels.small}% frame)`);
  summary.partC[seg.id] = {
    clip: "Rendszerváltó Nagykoncert panning shot.webm", license: "CC BY 4.0",
    start: seg.start, duration: seg.duration, fps: SRC_FPS, sourceFps: 50,
    speedMeasured: speed, flatness, pixels: ghost.pixels, meanAbsDC: ghost.meanAbsDC, results: G,
  };
}

// --- Bảng tổng hợp: ghost có tăng theo tốc độ không khi có blur thật? ------
console.log("\n== TỔNG HỢP: b_small vượt sàn @0,7 theo tốc độ (có blur vs không blur) ==");
console.log("   điều kiện          tốc độ đo(px/f) | b_small vượt @0,7 | nhảy 0,5→0,7 | b_large vượt @0,7");
const row = (label, speed, G) => {
  const ex = (lab, band) => (G[lab].blendByBand[band] - G.ctrl.blendByBand[band]).toFixed(3);
  const jump = (G.d0_7.blendByBand.small - G.d0_5.blendByBand.small).toFixed(3);
  console.log(`   ${label.padEnd(20)} ${String(speed).padStart(6)} | ${ex("d0_7", "small").padStart(10)} | ${jump.padStart(10)} | ${ex("d0_7", "large").padStart(10)}`);
};
for (const seg of BLUR_SEGMENTS) {
  const b = summary.partB[seg.id];
  row(`${seg.id} (blur)`, b.speedMeasured.median_px_per_frame_720p, b.results);
  const nbId = seg.id.replace("-blur", "");
  row(`${nbId} (không blur)`, s3Summary.segments[nbId].speedMeasured.median_px_per_frame_720p,
    s3Summary.segments[nbId].results);
}
for (const seg of KONCERT_SEGMENTS) {
  const c = summary.partC[seg.id];
  row(`${seg.id} (pan thật)`, c.speedMeasured.median_px_per_frame_720p, c.results);
}

writeFileEpermRetry(path.join(work, "summary.json"), JSON.stringify(summary, null, 1));
console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
console.log(`   WORK=${work} (summary.json + frame .gray trong scratch; footage gốc KHÔNG đưa vào batch)`);
if (fail > 0) process.exit(1);
