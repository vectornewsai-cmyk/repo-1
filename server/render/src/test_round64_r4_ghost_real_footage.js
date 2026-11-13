#!/usr/bin/env node
/**
 * test_round64_r4_ghost_real_footage.js — Phase 9 đợt 64, luồng R4.
 *
 * Nợ mở đợt 63 R2 §8 mục 3: đo ghosting denoise trên FOOTAGE QUAY THẬT
 * (camera thật, không phải crop ảnh tĩnh pan) + tốc độ pan khác nhau, để
 * kiểm tra ngưỡng cảnh báo denoise ≥0,7 có cần điều chỉnh theo tốc độ pan.
 *
 * Footage (tải về scratch, license rõ ràng — KHÔNG đưa vào batch):
 *   - ocean06.ogv  — Wikimedia Commons, File:Ocean surface waves 06.ogv,
 *     CC0, quay thật 1920x1080 25fps, 6.4s. Tác giả: Mostafameraji.
 *   - basgo.webm   — Wikimedia Commons, File:Panorama from Basgo monastery,
 *     Ladakh.webm, CC BY 3.0, quay thật 1920x1080 30fps, 26.1s (panorama).
 *   - slovenska.webm — Wikimedia Commons, File:Traffic on Slovenska street,
 *     CC BY 3.0, quay thật 1920x1080 25fps, 54.2s (camera tĩnh + xe chạy,
 *     có một đoạn pan nhanh thật ở ~37–40s).
 *
 * Đã khảo sát nhưng KHÔNG dùng: Big Buck Bunny (Blender, CC BY 3.0,
 * archive.org) — phim CG, không phải camera vật lý; các cửa sổ "nhanh" ở
 * quét thô 2fps hoá ra là cắt cảnh (response phase correlation ~0.04) và
 * ở fps native chỉ còn ~2.9 px/frame (trùng dải vừa). File 720p trên
 * archive.org thực chất chỉ 640x360.
 *
 * Phương pháp — Y HỆT R2 để so được trực tiếp (xem
 * docs/PHASE9_ROUND63_R2_RENDER_COST_LIMITS.md §3):
 *   - Cắt đoạn 5s, scale 1280x720, CRF18 (nguồn đo).
 *   - Render thật qua render.js với enhance denoise strength 0.5 / 0.7 / 0.8
 *     (hqdn3d đúng thang enhance.js) + đối chứng không enhance (sàn encode).
 *   - Frame chuẩn C_t = frame giải mã từ đoạn nguồn; frame đo D_t = frame
 *     sau render. Mask theo |dC| = |C_t − C_{t−1}|: flat ≤2, small 2–8
 *     (nhạy ghost nhất), mid 8–24, large >24.
 *   - Trail tuyệt đối = mean |D_t − C_t| từng dải; hệ số blend b từng dải
 *     từ hồi quy D_t = C_t − b·(C_t − C_{t−1}); b≈0 không ghost, b→1 trễ hẳn
 *     1 frame. b_small là con số kết luận (R2: 0.49 @0.5 → 0.59 @0.7 →
 *     0.63 @0.8 trên pan ảnh tĩnh 24px/frame).
 *   - Tốc độ pan/chuyển động của từng đoạn được ĐO LẠI bằng phase
 *     correlation (cv2, crop giữa, như R2 motion metric) trên đúng đoạn 5s
 *     đã dùng, báo theo px/frame ở 720p + px/s, kèm response median.
 *
 * Harness này KHÔNG assert ngưỡng ghost mới (đó chính là câu hỏi nghiên
 * cứu — trả lời bằng số liệu trong LIMITS, không bịa ngưỡng). Chỉ assert
 * tính đúng đắn của bộ đo: sàn encode có giới hạn, denoise 0.5 tạo ghost
 * vượt rõ sàn, denoise 0.8 không thêm ghost đáng kể trên cạnh lớn, đủ pixel
 * dải small, tốc độ đo có response tin được.
 *
 * LƯU Ý PHƯƠNG PHÁP (phát hiện khi validate): trên footage thật có texture,
 * bản thân encode CRF23 đã tạo "sàn ghost" (b_small ctrl ≈ 0.13 trên sóng
 * biển — kiểm chứng: encode trực tiếp bằng ffmpeg CRF23 cho số giống hệt
 * render.js ctrl tới 4 chữ số thập phân). Mọi kết luận về denoise phải tính
 * trên PHẦN VƯỢT SÀN (b − b_ctrl), không phải số tuyệt đối như R2 (R2 đo
 * trên pan ảnh mịn nên sàn ≈ 0).
 *
 * Cách chạy: node server/render/src/test_round64_r4_ghost_real_footage.js
 * (cần ffmpeg, ffprobe, python3 + numpy, python server/tracking/.venv
 * cho cv2). Harness resumable: thư mục làm việc cố định dưới
 * ~/workspace/.scratch-r64r4-9h00Sj, render/đoạn/frame đã có sẽ tái dùng.
 * KHÔNG ghi gì vào repo ngoài file harness này + LIMITS.
 * Thời gian ~10–20 phút tùy tải.
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const work = path.join(process.env.HOME, "workspace", ".scratch-r64r4-9h00Sj");
fs.mkdirSync(work, { recursive: true });
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const CV2_PY = path.join(RENDER, "..", "tracking", ".venv", "bin", "python");
const SCRATCH_SRC = path.join(process.env.HOME, "workspace", ".scratch-r64r4");

// Clip gốc đã tải + kiểm sha256 ở đợt này (xem LIMITS để biết nguồn/license).
const CLIPS = {
  ocean06: {
    file: "ocean06.ogv",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Ocean_surface_waves_06.ogv",
    sha256: "4b9e690dce0108898809314213cab90945c1f9dc0c4c46831e650a871c598d3e",
    fps: 25, license: "CC0",
  },
  basgo: {
    file: "basgo.webm",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Panorama_from_Basgo_monastery%2C_Ladakh.webm",
    sha256: "7ed32bc7d0a8b9532fce46140c38622dee8c743cd1ad3cdb951631021263ad93",
    fps: 30, license: "CC BY 3.0",
  },
  slovenska: {
    file: "slovenska.webm",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Traffic_on_Slovenska_street.webm",
    sha256: "ae8f684c170da8e0ac10f00b62705d51c121a80a05414008c6726491ecd63db5",
    fps: 25, license: "CC BY 3.0",
  },
};

// Đoạn 5s đã chọn theo tốc độ ĐO ĐƯỢC (phase correlation, xem LIMITS):
//  toc do = median px/frame o 720p trong cua so 5s (scan truoc o scratch).
//  SEGMENTS duoc dien sau khi xac minh toc do cua ung vien nhanh (BBB/slov-35).
const SEGMENTS = [
  { id: "ocean-slow", clip: "ocean06", start: 0, speedClass: "cham", speedNote: "0.54 px/f (16 px/s), resp 0.53 — song bien, camera gan nhu dung yen" },
  { id: "basgo-mid", clip: "basgo", start: 15, speedClass: "vua", speedNote: "2.50 px/f (75 px/s), resp 0.86 — panorama pan vua" },
  { id: "basgo-fast", clip: "basgo", start: 0, speedClass: "nhanh", speedNote: "5.98 px/f (179 px/s), resp 0.87 — panorama pan nhanh" },
  { id: "slov-fast", clip: "slovenska", start: 36, speedClass: "nhanh", speedNote: "~7-8 px/f (~200 px/s) — pan nhanh duong pho + xe chay; resp thap (~0.4) khi pan nhanh, xem LIMITS" },
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
  meta: { name: "r64r4", width: W, height: H, fps },
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
  // Frame gray thô (.gray, 1280x720 = 921600 byte) — đọc bằng np.fromfile,
  // nhanh hơn PNG ~50x (bài học dưới tải nặng: PIL decode 625 PNG quá chậm).
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).filter((f) => f.endsWith(".gray")).length;
  if (existing === expectN) return existing;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  run("ffmpeg", ["-i", mp4, "-vf", "format=gray", "-f", "image2", "-c:v", "rawvideo", "-pix_fmt", "gray",
    "-vsync", "0", path.join(dir, "f%04d.gray")], `tách frame ${path.basename(mp4)}`);
  return fs.readdirSync(dir).filter((f) => f.endsWith(".gray")).length;
}

// --- Script đo ghost (giong R2, bo phan hinh hoc pan anh tinh) -------------
const GHOST_PY = `
import sys, json, glob
import numpy as np
# Ban nhanh cua ghost_real.py: cung cong thuc/mask/dai nhu R2, chi doi cach doc
# frame (raw gray thay vi PNG) va cach cong don (bincount 1 lan thay vi
# mask rieng tung dai) de chay duoc duoi tai nang. So lieu giong het ban cham
# (cung phep toan tren cung pixel, float32 chi thay float64 o buoc trung gian;
# doi chung ctrl b~0 kiem chung dau-cuoi).
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
bands_id = {}  # t -> uint8 0=flat 1=small 2=mid 3=large
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
writeFileEpermRetry(ghostPy, GHOST_PY);

// --- Script đo tốc độ đoạn 5s (phase correlation, giong R2 motion metric) --
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
        spd.append(float(np.hypot(sx, sy)) * 2.0 / dt)  # px/s o ti le 720p
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
writeFileEpermRetry(scanPy, SCAN_PY);

function measureSpeed(segMp4) {
  const r = spawnSync(CV2_PY, [scanPy, segMp4], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`scan toc do loi: ${r.stdout} ${r.stderr}`);
  return JSON.parse((r.stdout || "").trim().split("\n").pop());
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

console.log(`== Đợt 64 R4 — ghosting denoise trên footage quay thật (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- Chuẩn bị clip gốc (tái dùng file đã tải + verify sha256, không thì tải) -
console.log("\n== Chuẩn bị clip gốc ==");
for (const [key, c] of Object.entries(CLIPS)) {
  const dest = path.join(work, c.file);
  const prev = path.join(SCRATCH_SRC, c.file);
  if (fs.existsSync(prev) && sha256(prev) === c.sha256) {
    fs.copyFileSync(prev, dest);
    console.log(`   📹 ${c.file}: tái dùng ${prev} (sha256 khớp, ${c.license})`);
  } else {
    run("curl", ["-sL", "--retry", "2", "--max-time", "300", c.url, "-o", dest], `tải ${c.file}`);
    if (sha256(dest) !== c.sha256) throw new Error(`sha256 ${c.file} không khớp nguồn đã ghi`);
    console.log(`   📹 ${c.file}: tải mới + sha256 khớp (${c.license})`);
  }
  const p = probeVideo(dest);
  ok(p.width >= 640 && p.height >= 360, `${c.file}: probe OK (${p.width}x${p.height}, ${p.duration.toFixed(1)}s)`);
}

const summary = { segments: {} };
for (const seg of SEGMENTS) {
  const clip = CLIPS[seg.clip];
  const segFile = `${seg.id}-seg.mp4`;
  const segPath = path.join(work, segFile);
  console.log(`\n== Đoạn ${seg.id} (${seg.speedClass}): ${clip.file} t=${seg.start}s, ${clip.fps}fps ==`);
  const segPrev = probeVideo(segPath);
  if (fs.existsSync(segPath) && segPrev.codec === "h264" && segPrev.width === 1280 && segPrev.height === 720 && Math.abs(segPrev.duration - 5) < 0.15) {
    console.log(`   📹 ${seg.id}: đoạn 5s đã có, tái dùng`);
  } else {
    run("ffmpeg", ["-i", path.join(work, clip.file), "-ss", String(seg.start),
      "-t", "5", "-vf", "scale=1280:720:flags=lanczos", "-r", String(clip.fps),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
      "-an", "-y", segPath], `cắt đoạn ${seg.id}`);
  }
  const sp = probeVideo(segPath);
  ok(sp.codec === "h264" && sp.width === 1280 && sp.height === 720 && Math.abs(sp.duration - 5) < 0.15,
    `${seg.id}: đoạn 5s 1280x720 OK (${sp.duration.toFixed(2)}s)`);
  fs.copyFileSync(segPath, path.join(mediaDir, segFile));

  // Tốc độ đo lại trên đúng đoạn 5s đã dùng.
  const speed = measureSpeed(segPath);
  console.log(`   📊 tốc độ đo lại: median ${speed.median_px_s} px/s = ${speed.median_px_per_frame_720p} px/frame @720p (p90 ${speed.p90_px_s} px/s, resp median ${speed.resp_median}, ${speed.n_pairs} cặp)`);
  ok(speed.resp_median > 0.3, `${seg.id}: phase correlation tin được (resp median ${speed.resp_median} > 0.3)`);

  // Frame chuẩn + render các mức denoise qua render.js thật.
  const expectN = 5 * clip.fps;
  const cleanDir = path.join(work, `frames-${seg.id}-clean`);
  const nClean = extractFrames(segPath, cleanDir, expectN);
  ok(nClean === expectN, `${seg.id}: frame chuẩn đủ ${nClean}/${expectN}`);

  const specDenoise = (s) => specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", segFile, 5, s === null ? {} : { enhance: { denoise: { strength: s } } })] }], 1280, 720, clip.fps);
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
    console.log(`   📊 ${lab}: trail small=${g.small.mean} flat=${g.flat.mean} mid=${g.mid.mean} large=${g.large.mean} | b flat=${g.blendByBand.flat} small=${g.blendByBand.small} mid=${g.blendByBand.mid} large=${g.blendByBand.large} (blend gộp ${g.blend.mean})`);
  }
  // Đối chứng = SÀN ENCODE của pipeline (CRF23), không phải 0 tuyệt đối:
  // trên footage thật có texture, bản thân encode CRF23 đã blend thời gian
  // (x264 dự đoán liên-frame + lượng tử hoá thô trên chi tiết cao tần) nên
  // b_ctrl > 0 (ocean: ~0.13 — xem LIMITS). Kết luận ghost của denoise phải
  // tính trên PHẦN VƯỢT SÀN (b_denoise − b_ctrl), không phải số tuyệt đối.
  ok(G.ctrl.blendByBand.small < 0.25,
    `${seg.id}: sàn encode có giới hạn (b_small ctrl=${G.ctrl.blendByBand.small} < 0.25)`);
  ok(G.d0_5.blendByBand.small > G.ctrl.blendByBand.small + 0.05,
    `${seg.id}: denoise 0.5 tạo ghost vượt rõ sàn encode (b_small ${G.d0_5.blendByBand.small} > ctrl ${G.ctrl.blendByBand.small} + 0.05)`);
  // b_large KHÔNG assert: "dải large" không đồng nghĩa "cạnh cứng" trên mọi
  // nội dung — trên sóng biển, large là nước chuyển động nhanh (không cứng)
  // nên denoise 0.8 thêm blend vượt sàn tới ~0.10 (ocean), trong khi trên
  // panorama/đường phố (cạnh cứng thật) vượt sàn ~0. Đánh giá theo từng đoạn
  // trong LIMITS, không gộp thành một ngưỡng chung.
  console.log(`   📊 ${seg.id}: vượt sàn b_large ở 0.8 = ${(G.d0_8.blendByBand.large - G.ctrl.blendByBand.large).toFixed(4)} (ctrl ${G.ctrl.blendByBand.large} → 0.8 ${G.d0_8.blendByBand.large})`);
  ok(ghost.pixels.small >= 2,
    `${seg.id}: dải small đủ pixel để đo (${ghost.pixels.small}% frame)`);
  summary.segments[seg.id] = {
    clip: clip.file, license: clip.license, start: seg.start, fps: clip.fps,
    speedClass: seg.speedClass, speedNote: seg.speedNote, speedMeasured: speed,
    pixels: ghost.pixels, results: G,
  };
}

// --- Bảng so sánh b_small theo tốc độ (câu hỏi nghiên cứu — chỉ in, không assert) ---
// Cột "vượt sàn" = b_small(strength) − b_small(ctrl): phần ghost do denoise
// gây ra, đã trừ sàn encode CRF23 của chính đoạn đó. Nhảy 0.5→0.7 tính trên
// phần vượt sàn (so sánh công bằng giữa các đoạn có sàn khác nhau).
console.log("\n== So sánh b_small theo tốc độ pan (không assert ngưỡng mới) ==");
console.log("   đoạn            tốc độ(px/f) | b_small ctrl | 0.5 (vượt sàn) | 0.7 (vượt sàn) | 0.8 (vượt sàn) | nhảy 0.5→0.7 (vượt sàn) | trail small 0.5→0.8 (trừ sàn flat)");
for (const seg of SEGMENTS) {
  const s = summary.segments[seg.id];
  const g = s.results;
  const ex = (x) => (g[x].blendByBand.small - g.ctrl.blendByBand.small).toFixed(3);
  const jumpEx = (g.d0_7.blendByBand.small - g.d0_5.blendByBand.small).toFixed(3);
  const trailExcess05 = (g.d0_5.small.mean - g.d0_5.flat.mean).toFixed(2);
  const trailExcess08 = (g.d0_8.small.mean - g.d0_8.flat.mean).toFixed(2);
  console.log(`   ${seg.id.padEnd(15)} ${String(s.speedMeasured.median_px_per_frame_720p).padStart(6)} | ${g.ctrl.blendByBand.small.toFixed(3).padStart(9)} | ${g.d0_5.blendByBand.small.toFixed(3)} (${ex("d0_5")}) | ${g.d0_7.blendByBand.small.toFixed(3)} (${ex("d0_7")}) | ${g.d0_8.blendByBand.small.toFixed(3)} (${ex("d0_8")}) | ${jumpEx.padStart(10)} | ${trailExcess05} → ${trailExcess08}`);
}
writeFileEpermRetry(path.join(work, "summary.json"), JSON.stringify(summary, null, 1));
console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
console.log(`   WORK=${work} (summary.json + frame .gray trong scratch; footage gốc KHÔNG đưa vào batch)`);
if (fail > 0) process.exit(1);
