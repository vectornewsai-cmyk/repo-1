#!/usr/bin/env node
/**
 * test_q5.js — Kiểm chứng Phase 8 Q5 bằng render + đo thật (không mock).
 *
 * A. Unit (Node, không ffmpeg):
 *    - tracking: buildAxisExpr nội suy đúng cấu trúc, kẹp ngoài khoảng,
 *      1 điểm = hằng số, >240 điểm bị từ chối, rỗng bị từ chối.
 *    - voice: buildVoiceFilters sinh đúng chuỗi filter, validateVoice
 *      từ chối giá trị ngoài khoảng.
 * B. Voice FFT (ffmpeg + numpy): sine 440Hz qua pitch +12 → đỉnh ~880Hz;
 *    telephone dập 100Hz và 8000Hz, giữ 1000Hz; robot làm phổ lan rộng
 *    (không còn là 1 đỉnh duy nhất); echo tạo lặp lại sau 200ms.
 * C. Sticker + track render thật: video tổng hợp (vuông đỏ di chuyển
 *    80→240px, ground truth biết trước) → track.py → render spec có
 *    sticker gắn track → đo pixel: sticker xanh lá phải nằm quanh tâm
 *    vật thể tại t=1s và t=3s.
 *
 * Chạy: node test_q5.js
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-q5-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function ff(args) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);
}
function writePy(name, code) {
  const p = path.join(WORK, name);
  fs.writeFileSync(p, code);
  return p;
}

// ================= A. Unit =================
console.log("== A. Unit: tracking + voice ==");
const { buildAxisExpr, buildTrackOverlayExprs } = require("./src/tracking");
const { validateTrackAttachment } = require("./src/tracking_validate");
const { hasVoiceEffect, validateVoice, buildVoiceFilters } = require("./src/voicefx");

const pts2 = [{ t: 0, x: 0.2, y: 0.5 }, { t: 2, x: 0.8, y: 0.5 }];
const exprX = buildAxisExpr(pts2, "x", "(t-0)");
ok("axis expr chứa nội suy tuyến tính", exprX.includes("0.2") && exprX.includes("0.6") && exprX.includes("(t-0)"), exprX);
ok("axis expr kẹp trước/sau khoảng", exprX.includes("lt((t-0),0)") && exprX.includes("gt((t-0),2)"), exprX);
ok("axis 1 điểm = hằng số", buildAxisExpr([{ t: 1, x: 0.3 }], "x", "(t-0)") === "0.3");
let threw = false;
try { buildAxisExpr([], "x", "(t-0)"); } catch { threw = true; }
ok("axis rỗng bị từ chối", threw);
const pts241 = Array.from({ length: 241 }, (_, i) => ({ t: i * 0.1, x: 0.5, y: 0.5 }));
ok("track >240 điểm bị từ chối", validateTrackAttachment({ points: pts241 }).length > 0);
ok("track hợp lệ không lỗi", validateTrackAttachment({ points: pts2 }).length === 0);
const ov = buildTrackOverlayExprs({ points: pts2 }, 1.5);
ok("overlay expr dùng main_w/main_h và trừ nửa overlay", ov.x.includes("main_w") && ov.x.includes("overlay_w/2") && ov.y.includes("main_h"));

ok("voice pitch +12 -> rubberband pitch=2", buildVoiceFilters({ pitch: 12 }).includes("rubberband=tempo=1:pitch=2"));
ok("voice pitch -12 -> pitch=0.5", buildVoiceFilters({ pitch: -12 }).includes("pitch=0.5"));
ok("voice robot -> vibrato", buildVoiceFilters({ robot: { rate: 25, depth: 0.6 } }).includes("vibrato=f=25:d=0.6"));
ok("voice telephone -> highpass+lowpass", buildVoiceFilters({ telephone: true }).includes("highpass=f=300") && buildVoiceFilters({ telephone: true }).includes("lowpass=f=3400"));
ok("voice echo -> aecho 200ms/0.5", buildVoiceFilters({ echo: { delayMs: 200, decay: 0.5 } }).includes("aecho=") && buildVoiceFilters({ echo: { delayMs: 200, decay: 0.5 } }).includes("200"));
ok("voice rỗng -> không filter", buildVoiceFilters({}) === "" && !hasVoiceEffect({}));
ok("voice validate từ chối pitch ngoài ±12", validateVoice({ pitch: 13 }).length > 0);
ok("voice validate chấp nhận hợp lệ", validateVoice({ pitch: 12, robot: { rate: 25, depth: 0.6 }, telephone: true, echo: { delayMs: 200, decay: 0.5 } }).length === 0);

// ================= B. Voice FFT =================
console.log("== B. Voice FFT ==");
const measurePy = writePy("measure_audio.py", `
import sys, numpy as np, subprocess, json
# Đọc wav -> raw f32 mono 48k rồi phân tích phổ.
def load(wav):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-f", "f32le",
                          "-ac", "1", "-ar", "48000", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)
def peak_freq(x, sr=48000):
    w = x * np.hanning(len(x))
    mag = np.abs(np.fft.rfft(w))
    f = np.fft.rfftfreq(len(x), 1 / sr)
    return float(f[int(np.argmax(mag))]), mag, f
def band_energy(mag, f, lo, hi):
    m = (f >= lo) & (f <= hi)
    return float(np.sum(mag[m] ** 2))
mode = sys.argv[1]
if mode == "peak":
    x = load(sys.argv[2])
    p, _, _ = peak_freq(x)
    print(f"peak={p}")
elif mode == "bands":
    x = load(sys.argv[2])
    _, mag, f = peak_freq(x)
    out = {}
    for name, lo, hi in [("b100", 80, 120), ("b1000", 980, 1020), ("b8000", 7900, 8100)]:
        out[name] = band_energy(mag, f, lo, hi)
    print(json.dumps(out))
elif mode == "spread":
    # Tỉ lệ năng lượng ngoài ±5Hz quanh 440Hz (robot làm phổ lan rộng).
    x = load(sys.argv[2])
    _, mag, f = peak_freq(x)
    tot = float(np.sum(mag ** 2))
    inside = band_energy(mag, f, 435, 445)
    print(f"spread={1 - inside / tot if tot else 0}")
elif mode == "echo":
    # Năng lượng cửa sổ lặp (0.29-0.31s) / cửa sổ chính (0.09-0.11s).
    x = load(sys.argv[2])
    sr = 48000
    main = float(np.sum(x[int(0.09 * sr):int(0.11 * sr)] ** 2))
    rep = float(np.sum(x[int(0.29 * sr):int(0.31 * sr)] ** 2))
    print(f"ratio={rep / main if main else 0}")
`);
// sine 440Hz 2s
ff(["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=2:sample_rate=48000",
  "-ac", "1", path.join(MEDIA, "sine440.wav")]);
function afx(inWav, filterStr, outName) {
  const out = path.join(MEDIA, outName);
  ff(["-y", "-i", inWav, "-af", filterStr.replace(/^,/, ""), "-ac", "1", "-ar", "48000", out]);
  return out;
}
function pyMeasure(args) {
  const r = run("python3", [measurePy, ...args]);
  if (r.status !== 0) throw new Error(`measure fail: ${r.stderr}`);
  return r.stdout.trim();
}
const pitched = afx(path.join(MEDIA, "sine440.wav"), buildVoiceFilters({ pitch: 12 }), "pitched.wav");
const peak = parseFloat(pyMeasure(["peak", pitched]).split("=")[1]);
ok("pitch +12: 440Hz -> ~880Hz", peak >= 840 && peak <= 920, `peak=${peak}`);
// mix 100 + 1000 + 8000 Hz
ff(["-y",
  "-f", "lavfi", "-i", "sine=frequency=100:duration=2:sample_rate=48000",
  "-f", "lavfi", "-i", "sine=frequency=1000:duration=2:sample_rate=48000",
  "-f", "lavfi", "-i", "sine=frequency=8000:duration=2:sample_rate=48000",
  "-filter_complex", "[0:a][1:a][2:a]amix=inputs=3:duration=first:dropout_transition=0[m]",
  "-map", "[m]", "-ac", "1", path.join(MEDIA, "mix.wav")]);
const tel = afx(path.join(MEDIA, "mix.wav"), buildVoiceFilters({ telephone: true }), "tel.wav");
const bands = JSON.parse(pyMeasure(["bands", tel]));
ok("telephone: dập 100Hz (<10% năng lượng 1000Hz)", bands.b100 < 0.10 * bands.b1000, JSON.stringify(bands));
ok("telephone: dập 8000Hz (<10% năng lượng 1000Hz)", bands.b8000 < 0.10 * bands.b1000, JSON.stringify(bands));
const robot = afx(path.join(MEDIA, "sine440.wav"), buildVoiceFilters({ robot: { rate: 25, depth: 0.6 } }), "robot.wav");
const spread = parseFloat(pyMeasure(["spread", robot]).split("=")[1]);
const spreadCtl = parseFloat(pyMeasure(["spread", path.join(MEDIA, "sine440.wav")]).split("=")[1]);
ok("robot: phổ lan rộng (>15% năng lượng ngoài ±5Hz quanh 440)", spread > 0.15 && spreadCtl < 0.05, `spread=${spread.toFixed(3)} ctl=${spreadCtl.toFixed(3)}`);
// impulse cho echo
const impPy = writePy("gen_impulse.py", `
import numpy as np, wave
sr = 48000
x = np.zeros(sr, dtype=np.float32)
x[int(0.1 * sr)] = 1.0
w = wave.open("${path.join(MEDIA, "impulse.wav").replace(/\\/g, "\\\\")}", "wb")
w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
`);
{
  const r = run("python3", [impPy]);
  if (r.status !== 0) throw new Error(`gen impulse fail: ${r.stderr}`);
}
const echo = afx(path.join(MEDIA, "impulse.wav"), buildVoiceFilters({ echo: { delayMs: 200, decay: 0.5 } }), "echo.wav");
const ratio = parseFloat(pyMeasure(["echo", echo]).split("=")[1]);
ok("echo: lặp lại sau 200ms (>5% năng lượng chính)", ratio > 0.05, `ratio=${ratio.toFixed(3)}`);

// ================= C. Sticker + track render =================
console.log("== C. Sticker bám track (render thật) ==");
// Video tổng hợp giống test_track.py: nền nhiễu tĩnh + vuông đỏ di chuyển.
const genPy = writePy("gen_move.py", `
import cv2, numpy as np, os
W, H, FPS, DUR = 320, 180, 30, 4.0
rng = np.random.default_rng(7)
bg = cv2.cvtColor(rng.integers(60, 140, size=(H, W), dtype=np.uint8), cv2.COLOR_GRAY2BGR)
vw = cv2.VideoWriter("${path.join(MEDIA, "move.mp4").replace(/\\/g, "\\\\")}", cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))
assert vw.isOpened()
for i in range(int(FPS * DUR)):
    f = bg.copy(); t = i / FPS
    cx = 80 + 160 * (t / DUR); cy = 90
    cv2.rectangle(f, (int(cx - 20), int(cy - 20)), (int(cx + 20), int(cy + 20)), (0, 0, 255), -1)
    cv2.circle(f, (int(cx), int(cy)), 8, (255, 255, 255), -1)
    vw.write(f)
vw.release()
print("gen ok")
`);
{
  const venvPy = path.join(HERE, "..", "tracking", ".venv", "bin", "python");
  const py = fs.existsSync(venvPy) ? venvPy : "python3";
  const r = run(py, [genPy]);
  if (r.status !== 0) throw new Error(`gen video fail: ${r.stderr}`);
}
// Chạy track.py: bbox ban đầu ôm vuông ở t=0 (tâm 80,90; 40x40) —
// track.py nhận bbox TƯƠNG ĐỐI 0..1: x=60/320, y=70/180, w=40/320, h=40/180.
const trackPy = path.join(HERE, "..", "tracking", "track.py");
const venvPy2 = path.join(HERE, "..", "tracking", ".venv", "bin", "python");
const trajPath = path.join(WORK, "traj.json");
{
  const py = fs.existsSync(venvPy2) ? venvPy2 : "python3";
  const r = run(py, [trackPy, "--input", path.join(MEDIA, "move.mp4"),
    "--bbox", "0.1875,0.3889,0.125,0.2222", "--out", trajPath]);
  if (r.status !== 0) throw new Error(`track.py fail: ${r.stderr}`);
}
const traj = JSON.parse(fs.readFileSync(trajPath, "utf8"));
ok("track.py: có điểm, không lost", traj.points.length >= 32 && !traj.lost, `n=${traj.points.length} lost=${traj.lost}`);
// Sticker xanh lá 40x40.
ff(["-y", "-f", "lavfi", "-i", "color=c=0x00ff00:s=40x40:d=1:r=1", "-frames:v", "1",
  path.join(MEDIA, "green.png")]);
const spec = {
  version: "0.2.0",
  meta: { name: "q5-track", width: 320, height: 180, fps: 30 },
  tracks: [
    { kind: "video", id: "v1", clips: [{ kind: "video", id: "c1", src: "move.mp4", start: 0, duration: 4, in: 0, out: 4, sourceAudioMode: "mute" }] },
    { kind: "sticker", id: "s1", clips: [{ kind: "sticker", id: "st1", src: "green.png", start: 0, duration: 4, x: 0.25, y: 0.5, scale: 0.125, opacity: 1, rotation: 0, track: { points: traj.points, lost: traj.lost, source: "track.py" } }] },
  ],
};
const specPath = path.join(WORK, "spec.json");
fs.writeFileSync(specPath, JSON.stringify(spec));
const outMp4 = path.join(WORK, "tracked.mp4");
{
  const r = run("node", [path.join(HERE, "src", "render.js"), "--spec", specPath,
    "--out", outMp4, "-y", "--media-dir", MEDIA]);
  if (r.status !== 0) throw new Error(`render fail: ${r.stderr}`);
}
ok("render sticker+track ra MP4", fs.existsSync(outMp4) && fs.statSync(outMp4).size > 1000);
// Đo pixel: cửa sổ 21x21 quanh tâm kỳ vọng phải có đa số pixel xanh lá.
const pxPy = writePy("measure_px.py", `
import sys, subprocess, numpy as np
video, t, cx, cy = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", video,
                      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True).stdout
W, H = 320, 180
arr = np.frombuffer(raw, dtype=np.uint8).reshape(H, W, 3)
x0, x1 = max(0, cx - 10), min(W, cx + 11)
y0, y1 = max(0, cy - 10), min(H, cy + 11)
win = arr[y0:y1, x0:x1]
green = (win[:, :, 1] > 180) & (win[:, :, 0] < 80) & (win[:, :, 2] < 80)
print(f"greenfrac={green.mean():.3f}")
`);
function greenFrac(t, cxPx, cyPx) {
  const r = run("python3", [pxPy, outMp4, String(t), String(cxPx), String(cyPx)]);
  if (r.status !== 0) throw new Error(`px fail: ${r.stderr}`);
  return parseFloat(r.stdout.trim().split("=")[1]);
}
// Ground truth: tâm x = 80 + 40t (px), tâm y = 90.
for (const t of [1, 3]) {
  const cx = Math.round(80 + 40 * t);
  const frac = greenFrac(t, cx, 90);
  ok(`sticker bám vật tại t=${t}s (tâm ${cx},90)`, frac > 0.5, `greenfrac=${frac}`);
}
// Đối chứng: cửa sổ xa vật thể không có sticker.
const fracFar = greenFrac(1, 280, 30);
ok("đối chứng: xa vật thể không có sticker xanh", fracFar < 0.1, `greenfrac=${fracFar}`);

console.log(`\ntest_q5: ${pass} pass, ${fail} fail (WORK=${WORK})`);
process.exit(fail ? 1 : 0);
