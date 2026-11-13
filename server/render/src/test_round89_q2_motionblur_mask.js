#!/usr/bin/env node
/**
 * test_round89_q2_motionblur_mask.js — Test THẬT Phase 9 đợt 89 Q2:
 * motion blur + mask lệch preview–render (nợ LIMITS gộp đợt 88 §4 mục 8).
 *
 * Đóng nợ P3 (d): đo lại với footage thật CÓ VÂN (sọc đỏ/trắng, chu kỳ
 * 48px) thay vì nguồn trắng trơn — nguồn trơn làm tmix render vô hình nên
 * P3 chưa phân biệt được "render thiếu blur" với "preview vẽ vệt thừa".
 * Footage: sọc đỏ (255,0,0) / trắng (255,255,255) — kênh R=255 khắp vùng
 * có nội dung nên vùng mask = R>128; độ tương phản sọc đo bằng kênh G
 * (đỏ: G=0, trắng: G=255).
 *
 * 3 setup, mỗi setup render blur (tmix frames=3, weights [1,1,1]) và
 * không-blur (đối chứng), 720p 3s, mask ellipse w=0.4 h=0.5 feather=0:
 *   A. Sọc TĨNH + mask bám track (0.3→0.7): chỉ mask chuyển động.
 *   B. Sọc CUỘN 12px/frame + mask tĩnh x=0.5: chỉ nội dung chuyển động.
 *   C. Sọc CUỘN + mask bám track: cả hai cùng chuyển động.
 * Đo bằng numpy trên frame PNG trích ra (t=0.5/1.0/1.5):
 *   - MAD(blur, noblur) từng mốc; tâm/bbox mask (R>128); biên trái/phải
 *     10-90% trên profile R qua hàng centroid; w50; độ tương phản G trong
 *     lõi mask (gStd, tỉ lệ pixel giữa 30..225); vệt trái (pixel R>128
 *     ngoài mép trái sắc kỳ vọng).
 *
 * Kết quả đã đo (11/11/2026, VM 4vCPU, tải nặng — xem
 * docs/PHASE9_ROUND89_Q2_MOTIONBLUR_MASK_LIMITS.md):
 *   A. MAD = 0.0 cả 3 mốc (render blur = identity khi nguồn tĩnh, kể cả
 *      footage có vân); mép mask sắc (≤1.6px); tâm đúng track.
 *   B/C. Blur NỘI DUNG thật: gStd lõi 127→43..96, gMidFrac 0→0.49..1.0,
 *      MAD 4.5..13.4, 15-17% pixel đổi; mép mask VẪN SẮC (≤1.9px);
 *      trail trái = 0; tâm đúng track (C).
 * Kết luận khóa bởi test này: render blur CHỈ áp lên nội dung trong mask,
 * KHÔNG bao giờ làm mờ mép mask — lệch với preview (ghost blend làm mờ
 * cả mép mask, vệt 0..25px tùy pha/tải) là do preview ghost unit ĐÃ MASK,
 * không phải do render thiếu blur nội dung.
 *
 * Cách chạy: node src/test_round89_q2_motionblur_mask.js
 * (cần ffmpeg, ffprobe, python3+PIL+numpy). File tạm trong os.tmpdir().
 * Thời gian chạy ~4-6 phút (6 render 720p 3s, tuần tự vì RAM VM thấp).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r89q2-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..");

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
function render(spec, name) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec), { label: "test-r89-q2-spec" });
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "-y", "--mask-mode", "png"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], timeout: 900000 });
  const secs = (Date.now() - t0) / 1000;
  if (r.error || r.status !== 0) {
    console.error(`❌ render "${name}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-2000)}`);
    process.exit(2);
  }
  return { status: r.status, outPath, secs };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function frameAt(mp4, t, out) {
  run("ffmpeg", ["-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", out], `lấy frame ${mp4}@${t}`);
}

const MEASURE_PY = `
import sys, json
import numpy as np
from PIL import Image
p = sys.argv[1]
img = np.asarray(Image.open(p).convert("RGB")).astype(np.float64)
H, W = img.shape[:2]
R, G = img[:, :, 0], img[:, :, 1]
ys, xs = np.where(R > 128)
cx, cy = float(xs.mean()), float(ys.mean())
x0, x1 = int(xs.min()), int(xs.max())
row = R[int(round(cy)), :]
mx = float(row.max()); bg = float(np.median(row))
cc = int(round(cx))
def at(a, b, frac):
    thr = bg + frac * (mx - bg)
    step = 1 if b > a else -1
    for x in range(a, b, step):
        x2 = x + step
        if (row[x] - thr) * (row[x2] - thr) <= 0:
            d = row[x2] - row[x]
            return x if d == 0 else x + (thr - row[x]) / d
    return float(b)
lo, hi = cc, cc
while lo > 0 and row[lo - 1] > bg + 0.1 * (mx - bg): lo -= 1
while hi < W - 1 and row[hi + 1] > bg + 0.1 * (mx - bg): hi += 1
l90, l10 = at(cc, max(lo - 1, 0), 0.9), at(cc, max(lo - 1, 0), 0.1)
r90, r10 = at(cc, min(hi + 1, W - 1), 0.9), at(cc, min(hi + 1, W - 1), 0.1)
l50, r50 = at(cc, max(lo - 1, 0), 0.5), at(cc, min(hi + 1, W - 1), 0.5)
ix0 = max(0, int(cx - 0.10 * W)); ix1 = min(W, int(cx + 0.10 * W))
iy0 = max(0, int(cy - 60)); iy1 = min(H, int(cy + 60))
core = G[iy0:iy1, ix0:ix1]
gstd = float(core.std()); mid = float(((core > 30) & (core < 225)).mean())
sharp_left = cx - 0.2 * W
trail = row[:max(0, int(sharp_left))]
trail_n = int((trail > 128).sum())
print(json.dumps({"cx": round(cx / W, 4), "cy": round(cy / H, 4),
  "x0": x0, "x1": x1, "count": int(len(xs)),
  "edgeL": round(abs(l90 - l10), 1), "edgeR": round(abs(r90 - r10), 1),
  "w50": round(abs(r50 - l50), 1),
  "gStd": round(gstd, 1), "gMid": round(mid, 3), "trailN": trail_n}))
`;
const measurePy = path.join(work, "measure.py");
writeFileEpermRetry(measurePy, MEASURE_PY, { label: "test-r89-q2-measure-py" });
function measure(p) {
  const r = spawnSync("python3", [measurePy, p], { encoding: "utf8" });
  try { return JSON.parse((r.stdout || "").trim()); }
  catch { throw new Error(`không parse được measure: ${r.stdout} ${r.stderr}`); }
}
const MAD_PY = `
import sys
import numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.float64)
b = np.asarray(Image.open(sys.argv[2]).convert("RGB")).astype(np.float64)
d = np.abs(a - b)
print(f"{float(d.mean()):.4f} {float((d.max(axis=2) > 0).mean()):.4f}")
`;
const madPy = path.join(work, "mad.py");
writeFileEpermRetry(madPy, MAD_PY, { label: "test-r89-q2-mad-py" });
function mad(a, b) {
  const r = spawnSync("python3", [madPy, a, b], { encoding: "utf8" });
  const parts = (r.stdout || "").trim().split(" ");
  return { mad: Number(parts[0]), frac: Number(parts[1]) };
}

// --- Media thật: sọc đỏ/trắng chu kỳ 48px, tĩnh + cuộn 12px/frame ---
console.log("== Chuẩn bị media ==");
const GEN_PY = `
import numpy as np
from PIL import Image
W, H = 1280, 720
x = np.arange(W)
stripe = ((x // 24) % 2 == 0)
base = np.zeros((H, W, 3), dtype=np.uint8)
base[:, :, 0] = 255
base[:, :, 1] = np.where(stripe[None, :], 0, 255).astype(np.uint8)
base[:, :, 2] = np.where(stripe[None, :], 0, 255).astype(np.uint8)
Image.fromarray(base).save("${path.join(mediaDir, "stripes-static.png")}")
xw = np.arange(2360)
stripew = ((xw // 24) % 2 == 0)
wide = np.zeros((H, 2360, 3), dtype=np.uint8)
wide[:, :, 0] = 255
wide[:, :, 1] = np.where(stripew[None, :], 0, 255).astype(np.uint8)
wide[:, :, 2] = np.where(stripew[None, :], 0, 255).astype(np.uint8)
Image.fromarray(wide).save("${path.join(mediaDir, "stripes-wide.png")}")
print("png ok")
`;
run("python3", ["-c", GEN_PY], "vẽ sọc");
run("ffmpeg", ["-v", "error", "-loop", "1", "-i", path.join(mediaDir, "stripes-static.png"),
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-r", "30", "-t", "3", "-an", "-y", path.join(mediaDir, "stripes-static.mp4")], "tạo stripes-static.mp4");
run("ffmpeg", ["-v", "error", "-loop", "1", "-i", path.join(mediaDir, "stripes-wide.png"),
  "-vf", "crop=1280:720:x='12*n':y=0",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-r", "30", "-t", "3", "-an", "-y", path.join(mediaDir, "stripes-scroll.mp4")], "tạo stripes-scroll.mp4");

const MASK = { shape: "ellipse", x: 0.3, y: 0.5, w: 0.4, h: 0.5, feather: 0 };
const MASK_STATIC = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 };
const TRACK = { points: [{ t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 }] };
const BLUR = { motionBlur: { frames: 3, weights: [1, 1, 1] } };
const spec = (src, mask, track, motion) => {
  const clip = { id: "c0", kind: "video", src, start: 0, duration: 3, in: 0, out: 3, mask };
  if (track) clip.track = track;
  if (motion) clip.motion = motion;
  return {
    version: "0.2.0",
    meta: { name: "r89q2", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips: [clip] }],
  };
};
const TIMES = [0.5, 1.0, 1.5];
const expectCx = (t) => 0.3 + 0.2 * t; // track tuyến tính 0.3→0.7 trong 2s

const jobs = {};
for (const [name, s, m, tr, mo] of [
  ["a-blur", "stripes-static.mp4", MASK, TRACK, BLUR],
  ["a-noblur", "stripes-static.mp4", MASK, TRACK, null],
  ["b-blur", "stripes-scroll.mp4", MASK_STATIC, null, BLUR],
  ["b-noblur", "stripes-scroll.mp4", MASK_STATIC, null, null],
  ["c-blur", "stripes-scroll.mp4", MASK, TRACK, BLUR],
  ["c-noblur", "stripes-scroll.mp4", MASK, TRACK, null],
]) {
  console.log(`render ${name} ...`);
  const r = render(spec(s, m, tr, mo), name);
  ok(r.status === 0 && outOk(r.outPath), `render ${name} OK (${r.secs.toFixed(1)}s, ${(90 / r.secs).toFixed(2)} fps)`);
  jobs[name] = r.outPath;
  for (const t of TIMES) frameAt(r.outPath, t, path.join(work, `${name}-t${t}.png`));
}
const M = {};
for (const name of Object.keys(jobs)) {
  M[name] = {};
  for (const t of TIMES) M[name][t] = measure(path.join(work, `${name}-t${t}.png`));
}

// --- A: nguồn tĩnh + mask chuyển động → blur phải là identity ---
console.log("A: sọc tĩnh + track (blur phải = identity)");
for (const t of TIMES) {
  const d = mad(path.join(work, `a-blur-t${t}.png`), path.join(work, `a-noblur-t${t}.png`));
  console.log(`   📊 A t=${t}: MAD=${d.mad} frac=${d.frac} | blur cx=${M["a-blur"][t].cx} edgeL=${M["a-blur"][t].edgeL} edgeR=${M["a-blur"][t].edgeR} gStd=${M["a-blur"][t].gStd}`);
  ok(d.mad === 0 && d.frac === 0, `A t=${t}: MAD blur vs noblur = 0.0 (nguồn tĩnh → tmix vô hình)`);
  ok(Math.abs(M["a-blur"][t].cx - expectCx(t)) <= 0.001, `A t=${t}: tâm đúng track (${M["a-blur"][t].cx} ~ ${expectCx(t)})`);
  ok(M["a-blur"][t].edgeL <= 3 && M["a-blur"][t].edgeR <= 3, `A t=${t}: mép mask sắc (edgeL/R ≤ 3px, đo ${M["a-blur"][t].edgeL}/${M["a-blur"][t].edgeR})`);
  ok(M["a-blur"][t].trailN === 0, `A t=${t}: không vệt trái (trailN=0)`);
}

// --- B: nội dung chuyển động + mask tĩnh → blur nội dung thật, mép sắc ---
console.log("B: sọc cuộn + mask tĩnh (blur nội dung thật, mép sắc)");
for (const t of TIMES) {
  const d = mad(path.join(work, `b-blur-t${t}.png`), path.join(work, `b-noblur-t${t}.png`));
  console.log(`   📊 B t=${t}: MAD=${d.mad} frac=${d.frac} | blur gStd=${M["b-blur"][t].gStd} gMid=${M["b-blur"][t].gMid} (noblur gStd=${M["b-noblur"][t].gStd}) edgeL=${M["b-blur"][t].edgeL} edgeR=${M["b-blur"][t].edgeR}`);
  ok(d.mad > 4, `B t=${t}: MAD blur vs noblur > 4 (đo ${d.mad})`);
  ok(M["b-blur"][t].gStd < 100 && M["b-noblur"][t].gStd > 120, `B t=${t}: tương phản sọc giảm do blur (gStd ${M["b-blur"][t].gStd} < 100, noblur ${M["b-noblur"][t].gStd} > 120)`);
  ok(M["b-blur"][t].gMid > 0.4 && M["b-noblur"][t].gMid === 0, `B t=${t}: pixel giữa tăng do blur (gMid ${M["b-blur"][t].gMid} > 0.4, noblur 0)`);
  ok(Math.abs(M["b-blur"][t].cx - 0.5) <= 0.001, `B t=${t}: tâm mask tĩnh 0.5 (đo ${M["b-blur"][t].cx})`);
  ok(M["b-blur"][t].edgeL <= 3 && M["b-blur"][t].edgeR <= 3, `B t=${t}: mép mask VẪN SẮC dù có blur (edgeL/R ≤ 3px)`);
  ok(M["b-blur"][t].trailN === 0, `B t=${t}: không vệt trái (trailN=0)`);
}

// --- C: cả hai cùng chuyển động → blur nội dung thật + tâm bám track + mép sắc ---
console.log("C: sọc cuộn + track (blur nội dung + bám track, mép sắc)");
for (const t of TIMES) {
  const d = mad(path.join(work, `c-blur-t${t}.png`), path.join(work, `c-noblur-t${t}.png`));
  console.log(`   📊 C t=${t}: MAD=${d.mad} frac=${d.frac} | blur gStd=${M["c-blur"][t].gStd} gMid=${M["c-blur"][t].gMid} cx=${M["c-blur"][t].cx} edgeL=${M["c-blur"][t].edgeL} edgeR=${M["c-blur"][t].edgeR}`);
  ok(d.mad > 4, `C t=${t}: MAD blur vs noblur > 4 (đo ${d.mad})`);
  ok(M["c-blur"][t].gStd < 100 && M["c-blur"][t].gMid > 0.4, `C t=${t}: tương phản sọc giảm do blur (gStd ${M["c-blur"][t].gStd}, gMid ${M["c-blur"][t].gMid})`);
  ok(Math.abs(M["c-blur"][t].cx - expectCx(t)) <= 0.001, `C t=${t}: tâm đúng track (${M["c-blur"][t].cx} ~ ${expectCx(t)})`);
  ok(M["c-blur"][t].edgeL <= 3 && M["c-blur"][t].edgeR <= 3, `C t=${t}: mép mask VẪN SẮC dù có blur (edgeL/R ≤ 3px)`);
  ok(M["c-blur"][t].trailN === 0, `C t=${t}: không vệt trái (trailN=0)`);
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail (thư mục tạm ${work})`);
process.exit(fail === 0 ? 0 : 1);
