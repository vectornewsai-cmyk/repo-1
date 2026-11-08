#!/usr/bin/env node
/**
 * test_round63_r2_render_cost_cpu.js — Phase 9 đợt 63, luồng R2: bổ sung cho
 * test_round63_r2_render_cost.js (phần (a) chi phí render enhance).
 *
 * Vấn đề: wall time trên VM này nhiễm tải nặng khi 8–10 luồng đợt 63 chạy
 * song song (loadavg 0,3–25 trong một phiên; decode-only wall dao động
 * 5–42s cho cùng 1 probe). Median 3 lần + round-robin chỉ khử một phần.
 * Bổ sung này đo thêm CPU TIME (user+sys qua bash `time`, cộng dồn qua mọi
 * process con — node + ffmpeg + ffprobe) cho đúng các probe A–I và vi mô
 * M1–M6: CPU time là công thật phải làm, gần như không đổi khi tải dao động
 * (kiểm chứng trước khi viết harness: decode-only wall 42,09s/37,08s nhưng
 * CPU 6,90s/6,93s — chênh 0,4%). Kế toán chi phí full render được đóng
 * bằng CPU time; wall time chỉ báo kèm để thấy trải nghiệm user.
 *
 * Phương pháp: mỗi probe chạy qua `bash -c 'TIMEFORMAT=...; time "$@"'`
 * (tránh /usr/bin/time — không có trên VM); parse dòng `TIME real=.. user=..
 * sys=..` trên stderr. 3 vòng round-robin, median. Chuỗi filter / lệnh
 * ffmpeg y hệt harness chính (dry-run capture cho probe F).
 *
 * Cách chạy: node server/render/src/test_round63_r2_render_cost_cpu.js
 * (cần ffmpeg, ffprobe, bash). Scratch mới dưới
 * ~/workspace/.scratch-r63r2c-XXXX. KHÔNG ghi gì vào repo. Thời gian
 * ~15–25 phút tùy tải (wall bị kéo dài bởi tải, CPU thì không).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r63r2c-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");
const { runStabilizeDetect, buildEnhancePostChain } = require("./enhance");

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
  meta: { name: "r63r2c", width: W, height: H, fps: fps || 30 },
  tracks,
});
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
function splitShell(line) {
  const out = [];
  let cur = "", inS = false;
  for (const ch of line) {
    if (ch === "'") { inS = !inS; continue; }
    if (!inS && /\s/.test(ch)) { if (cur) { out.push(cur); cur = ""; } continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Chạy 1 lệnh qua bash `time`, trả {wall, cpu, real, status}.
 * cpu = user + sys (cộng dồn mọi process con). stderr của lệnh được giữ
 * (parse chỉ dòng bắt đầu "TIME "), stdout bỏ qua trừ khi lỗi.
 */
function timedBash(label, argv) {
  const t0 = Date.now();
  const r = spawnSync("bash", ["-c", "TIMEFORMAT=$'TIME real=%R user=%U sys=%S'; time \"$@\"", "_", ...argv],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const wall = (Date.now() - t0) / 1000;
  const m = /TIME real=([\d.]+) user=([\d.]+) sys=([\d.]+)/.exec(r.stderr || "");
  if (!m) throw new Error(`${label}: không parse được bash time (status=${r.status}): ${(r.stderr || "").slice(-500)}`);
  const cpu = Number(m[2]) + Number(m[3]);
  const real = Number(m[1]);
  console.log(`   📊 ${label}: wall ${wall.toFixed(2)}s | CPU ${cpu.toFixed(2)}s (user ${m[2]} + sys ${m[3]}, real ${real.toFixed(2)}s) | loadavg ${loadAvg()}`);
  if (r.status !== 0) throw new Error(`${label}: lệnh thoát mã ${r.status}: ${(r.stderr || "").slice(-500)}`);
  return { wall, cpu, real };
}

console.log(`== Đợt 63 R2 CPU — (a) tách chi phí bằng CPU time (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- Chuẩn bị media (giống harness chính) -----------------------------------
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
{
  const p = probeVideo(path.join(mediaDir, "shakynoisy720.mp4"));
  ok(p.codec === "h264" && p.width === 1280 && p.height === 720 && Math.abs(p.duration - 5) < 0.15,
    "shakynoisy720.mp4 tạo xong (5s, 720p)");
}
const src720 = path.join(mediaDir, "shakynoisy720.mp4");
const clipStab = { in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10 } } };
const trfPath = path.join(work, "stab-720.trf");
{
  const r = runStabilizeDetect("ffmpeg", src720, clipStab, trfPath);
  if (!r.ok) throw new Error(`vidstabdetect lỗi: ${r.error}`);
}
ok(fs.existsSync(trfPath) && fs.statSync(trfPath).size > 0, ".trf chung tạo được");

// --- (a0) Lệnh ffmpeg chính từ --dry-run --------------------------------------
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
const specBalanced = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shakynoisy720.mp4", 5, { enhance: BALANCED })] }], 1280, 720);
const drySpecPath = path.join(work, "dryrun.json");
fs.writeFileSync(drySpecPath, JSON.stringify(specBalanced));
let mainArgs;
{
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", drySpecPath,
    "--out", path.join(work, "dryrun.mp4"), "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", "--no-trf-cache", "--dry-run"],
    { cwd: ROOT, encoding: "utf8" });
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("ffmpeg "));
  if (r.status !== 0 || !line) throw new Error(`--dry-run thất bại: status=${r.status} out=${r.stdout} err=${r.stderr}`);
  const tokens = splitShell(line);
  ok(tokens[0] === "ffmpeg" && tokens.includes("-filter_complex"), "--dry-run trả lệnh ffmpeg parse được");
  const fcIdx = tokens.indexOf("-filter_complex");
  const fc = tokens[fcIdx + 1];
  const escTrf = trfPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
  const fcReal = fc.replace(/\/tmp\/repo1-vidstab-[^']+\.trf/, escTrf);
  ok(fcReal !== fc && fcReal.includes(escTrf), "filter_complex đã thay .trf placeholder bằng .trf thật");
  mainArgs = [...tokens.slice(1, fcIdx + 1), fcReal, ...tokens.slice(fcIdx + 2)];
}

// --- Vi mô M1–M6 (5 lần, median CPU + wall) ----------------------------------
console.log("\n== Vi mô — CPU time (5 lần, median) ==");
const GPU_PROBE_JS = `
const { probeGpuEncoder } = require(${JSON.stringify(path.join(__dirname, "gpuencode.js"))});
const r = probeGpuEncoder("ffmpeg");
console.log("GPU_PROBE " + JSON.stringify({ tried: r.tried, encoder: r.encoder }));
`;
const gpuProbeJs = path.join(work, "gpu-probe.js");
fs.writeFileSync(gpuProbeJs, GPU_PROBE_JS);
const DETECT_ONE_JS = `
const { runStabilizeDetect } = require(${JSON.stringify(path.join(__dirname, "enhance.js"))});
const [src, trf] = process.argv.slice(2);
const clip = { in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10 } } };
const r = runStabilizeDetect("ffmpeg", src, clip, trf);
if (!r.ok) { console.error(r.error); process.exit(1); }
console.log("DETECT_OK " + trf);
`;
const detectOneJs = path.join(work, "detect-one.js");
fs.writeFileSync(detectOneJs, DETECT_ONE_JS);
const micro = {};
function microProbe(key, label, argv) {
  const cpus = [], walls = [];
  for (let i = 1; i <= 5; i++) {
    const t = timedBash(`${label} #${i}`, argv);
    cpus.push(t.cpu); walls.push(t.wall);
  }
  micro[key] = { cpuRuns: cpus.map((v) => +v.toFixed(2)), cpuMedian: +median(cpus).toFixed(2),
    cpuSpreadPct: +spreadPct(cpus).toFixed(1), wallMedian: +median(walls).toFixed(2), wallSpreadPct: +spreadPct(walls).toFixed(1) };
  console.log(`   📊 ${label} TỔNG HỢP: CPU ${cpus.map((v) => v.toFixed(2)).join(" / ")} → median ${median(cpus).toFixed(2)}s (spread ${spreadPct(cpus).toFixed(1)}%) | wall median ${median(walls).toFixed(2)}s (spread ${spreadPct(walls).toFixed(1)}%)`);
}
microProbe("nodeHelp", "M1 node render.js --help", ["node", path.join(RENDER, "src", "render.js"), "--help"]);
microProbe("ffprobe", "M2 ffprobe (probeFile)", ["ffprobe", "-v", "error",
  "-show_entries", "stream=codec_type,codec_name,width,height,nb_frames,avg_frame_rate,pix_fmt",
  "-show_entries", "format=duration", "-of", "json", src720]);
microProbe("filters", "M3 ffmpeg -filters", ["ffmpeg", "-hide_banner", "-filters"]);
microProbe("version", "M4 ffmpeg -version", ["ffmpeg", "-version"]);
microProbe("gpuProbe", "M5 probeGpuEncoder", ["node", gpuProbeJs]);
microProbe("spawn1f", "M6 spawn ffmpeg 1 frame", ["ffmpeg", "-hide_banner", "-loglevel", "error",
  "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1", "-c:v", "libx264", "-frames:v", "1", "-f", "null", "-"]);
const microCpuSum = Object.values(micro).reduce((a, m) => a + m.cpuMedian, 0);
const microWallSum = Object.values(micro).reduce((a, m) => a + m.wallMedian, 0);
console.log(`   📊 TỔNG vi mô (median cộng): CPU ${microCpuSum.toFixed(2)}s | wall ${microWallSum.toFixed(2)}s`);
for (const [k, m] of Object.entries(micro)) {
  ok(m.cpuMedian > 0 && m.cpuMedian < 10, `vi mô ${k}: CPU median ${m.cpuMedian}s hợp lý (0 < x < 10)`);
}

// --- Vĩ mô A–I (3 vòng round-robin, median CPU + wall) ------------------------
console.log("\n== Vĩ mô — CPU time (3 vòng round-robin, median) ==");
const HQ05 = buildEnhancePostChain({ denoise: { strength: 0.5 } });
const TRF_ESC = trfPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
const TRIM = "trim=start=0:end=5,setpts=PTS-STARTPTS";
const TRANSF = `vidstabtransform=input='${TRF_ESC}':smoothing=10:optalgo=gauss`;
const SCALE_PAD = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,format=yuv420p";
const ffNullArgs = (vf) => ["ffmpeg", "-v", "error", "-i", src720, "-vf", vf, "-an", "-f", "null", "-"];
const macro = { A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [], I: [] };
const macroWall = { A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [], I: [] };
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
for (let round = 1; round <= 3; round++) {
  console.log(`-- vòng ${round} (loadavg ${loadAvg()}) --`);
  let t;
  t = timedBash(`A decode-only v${round}`, ffNullArgs(TRIM)); macro.A.push(t.cpu); macroWall.A.push(t.wall);
  t = timedBash(`B decode+hqdn3d(0.5) v${round}`, ffNullArgs(`${TRIM}${HQ05}`)); macro.B.push(t.cpu); macroWall.B.push(t.wall);
  t = timedBash(`C decode+transform v${round}`, ffNullArgs(`${TRIM},${TRANSF}`)); macro.C.push(t.cpu); macroWall.C.push(t.wall);
  t = timedBash(`D decode+hqdn3d+transform v${round}`, ffNullArgs(`${TRIM},${TRANSF}${HQ05}`)); macro.D.push(t.cpu); macroWall.D.push(t.wall);
  t = timedBash(`E full-chain → null v${round}`, ffNullArgs(`${TRIM},${TRANSF},${SCALE_PAD}${HQ05}`)); macro.E.push(t.cpu); macroWall.E.push(t.wall);
  const outF = path.join(work, `main-replay-r${round}.mp4`);
  const argsF = ["ffmpeg", ...mainArgs.map((a) => (a === path.join(work, "dryrun.mp4") ? outF : a))];
  t = timedBash(`F tiến trình ffmpeg chính v${round}`, argsF); macro.F.push(t.cpu); macroWall.F.push(t.wall);
  ok(outOk(outF) && probeOk(outF, 1280, 720), `F v${round}: MP4 h264 đúng res/thời lượng`);
  const outG = path.join(work, `baseline-enc-r${round}.mp4`);
  t = timedBash(`G baseline encode v${round}`, ["ffmpeg", "-v", "error", "-i", src720,
    "-vf", TRIM, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-an", "-y", outG]); macro.G.push(t.cpu); macroWall.G.push(t.wall);
  ok(outOk(outG) && probeOk(outG, 1280, 720), `G v${round}: MP4 h264 đúng res/thời lượng`);
  const trfH = path.join(work, `det-r${round}.trf`);
  t = timedBash(`H detect mới v${round}`, ["node", detectOneJs, src720, trfH]); macro.H.push(t.cpu); macroWall.H.push(t.wall);
  ok(fs.existsSync(trfH) && fs.statSync(trfH).size > 0, `H v${round}: .trf > 0 byte`);
  const specPathI = path.join(work, `full-balanced-r${round}.json`);
  fs.writeFileSync(specPathI, JSON.stringify(specBalanced));
  const outI = path.join(work, `full-balanced-r${round}.mp4`);
  t = timedBash(`I full render balanced v${round}`, ["node", path.join(RENDER, "src", "render.js"),
    "--spec", specPathI, "--out", outI, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", "--no-trf-cache"]);
  macro.I.push(t.cpu); macroWall.I.push(t.wall);
  ok(outOk(outI) && probeOk(outI, 1280, 720), `I v${round}: full balanced render thật OK`);
}
const medCpu = {}, medWall = {};
for (const k of Object.keys(macro)) { medCpu[k] = median(macro[k]); medWall[k] = median(macroWall[k]); }
console.log("\n   📊 (a) TỔNG HỢP vĩ mô — CPU time (median 3 vòng):");
for (const [k, label] of Object.entries({
  A: "decode-only", B: "decode+hqdn3d(0.5)", C: "decode+transform",
  D: "decode+hqdn3d+transform", E: "full-chain → null",
  F: "tiến trình ffmpeg chính (replay)", G: "baseline encode",
  H: "detect mới", I: "full render balanced",
})) {
  console.log(`      ${k} ${label}: CPU ${macro[k].map((v) => v.toFixed(2)).join(" / ")} → median ${medCpu[k].toFixed(2)}s (spread ${spreadPct(macro[k]).toFixed(1)}%) | wall median ${medWall[k].toFixed(2)}s (spread ${spreadPct(macroWall[k]).toFixed(1)}%)`);
}
const residualCpu = medCpu.I - medCpu.H - medCpu.F;
const residualWall = medWall.I - medWall.H - medWall.F;
console.log(`   📊 kế toán CPU: DET(${medCpu.H.toFixed(2)}) + MAIN(${medCpu.F.toFixed(2)}) = ${(medCpu.H + medCpu.F).toFixed(2)}s vs FULL(${medCpu.I.toFixed(2)}s) → residual CPU ${residualCpu.toFixed(2)}s (node/probe/JS + sai số) vs tổng vi mô CPU ${microCpuSum.toFixed(2)}s`);
console.log(`   📊 kế toán wall (tham chiếu, nhiễm tải): DET(${medWall.H.toFixed(2)}) + MAIN(${medWall.F.toFixed(2)}) = ${(medWall.H + medWall.F).toFixed(2)}s vs FULL(${medWall.I.toFixed(2)}s) → residual wall ${residualWall.toFixed(2)}s vs tổng vi mô wall ${microWallSum.toFixed(2)}s`);
console.log(`   📊 denoise 0.5 thuần (CPU): B−A = ${(medCpu.B - medCpu.A).toFixed(2)}s | transform thuần (CPU): C−A = ${(medCpu.C - medCpu.A).toFixed(2)}s | encode thuần (CPU): G−A = ${(medCpu.G - medCpu.A).toFixed(2)}s`);
ok(medCpu.A > 0 && medCpu.B > 0 && medCpu.C > 0 && medCpu.D > 0 && medCpu.E > 0 && medCpu.F > 0 && medCpu.G > 0 && medCpu.H > 0 && medCpu.I > 0,
  "mọi probe vĩ mô CPU median > 0 (không có số âm — bài học đợt 61)");
ok(medCpu.F > medCpu.E, `tiến trình chính F CPU (${medCpu.F.toFixed(2)}s) > full-chain → null E CPU (${medCpu.E.toFixed(2)}s) — encode + overlay có chi phí thật`);
ok(medCpu.I > medCpu.H, `full render I CPU (${medCpu.I.toFixed(2)}s) > detect H CPU (${medCpu.H.toFixed(2)}s)`);
ok(medCpu.B >= medCpu.A - 0.3, `decode+hqdn3d B CPU (${medCpu.B.toFixed(2)}s) không nhỏ hơn decode-only A (${medCpu.A.toFixed(2)}s) quá 0.3s`);
ok(residualCpu > 0, `residual CPU > 0 (${residualCpu.toFixed(2)}s — kế toán CPU đóng được, không âm như phép trừ wall đợt 61)`);
ok(spreadPct(macro.A) < spreadPct(macroWall.A), `CPU ổn định hơn wall ở probe A (spread CPU ${spreadPct(macro.A).toFixed(1)}% < wall ${spreadPct(macroWall.A).toFixed(1)}%)`);

const summary = {
  micro: micro,
  microCpuSum: +microCpuSum.toFixed(2),
  microWallSum: +microWallSum.toFixed(2),
  macroCpu: Object.fromEntries(Object.entries(macro).map(([k, v]) => [k, {
    runs: v.map((x) => +x.toFixed(2)), median: +medCpu[k].toFixed(2), spreadPct: +spreadPct(v).toFixed(1),
  }])),
  macroWall: Object.fromEntries(Object.entries(macroWall).map(([k, v]) => [k, {
    runs: v.map((x) => +x.toFixed(2)), median: +medWall[k].toFixed(2), spreadPct: +spreadPct(v).toFixed(1),
  }])),
  residualCpu: +residualCpu.toFixed(2),
  residualWall: +residualWall.toFixed(2),
  detectPlusMainVsFullCpuPct: +((medCpu.H + medCpu.F) / medCpu.I * 100).toFixed(1),
};
console.log(`\n== test_round63_r2_render_cost_cpu: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);
