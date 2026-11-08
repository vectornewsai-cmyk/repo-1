#!/usr/bin/env node
/**
 * test_round63_r2_render_cost.js — Phase 9 đợt 63, luồng R2: đóng nợ đợt 62 §4 mục 2
 * (phần chi phí render enhance còn lại + ghosting denoise trên footage thật).
 *
 * (a) TÁCH NỐT ~5,6–6,4s còn lại trong full render enhance 720p.
 *     Đợt 61 (a2): full Cân bằng 29,44s = detect 9,56s + decode 5,03s +
 *     transform thuần 1,26s + encode thuần 6,49s + phần còn lại 7,10s
 *     (denoise 0.5 + khởi động node + graph). Đợt 62 (b): denoise 0.5 cỡ ~1s
 *     (0,7–1,5s) → còn ~5,6–6,4s chưa tách. Harness này đo TRỰC TIẾP từng
 *     pass bằng probe to-null + median 3 lần, xen kẽ round-robin, trong CÙNG
 *     phiên (bài học đợt 61 R2: phép trừ transform-only − baseline ra số ÂM
 *     do tải VM — chỉ giữ số đo trực tiếp; phần dư FULL − DET − MAIN được
 *     báo riêng kèm spread, KHÔNG kết luận thành một thành phần đo được):
 *       vi mô (5 lần, median): M1 node render.js --help (khởi động node +
 *         require), M2 ffprobe (đúng lệnh probeFile của validateMedia),
 *         M3 ffmpeg -filters (probeFilterSupport), M4 ffmpeg -version
 *         (ffmpegVersionLine), M5 probeGpuEncoder (3 lần encode thử 1 frame),
 *         M6 spawn ffmpeg encode 1 frame nullsrc (chi phí spawn process).
 *       vĩ mô (3 vòng round-robin, median): A decode-only → null,
 *         B decode+hqdn3d(0.5) → null, C decode+vidstabtransform → null,
 *         D decode+hqdn3d+transform → null, E full-chain (transform+scale+
 *         pad+fps+format+hqdn3d) → null, F tiến trình ffmpeg CHÍNH y hệt
 *         render.js (lệnh lấy từ --dry-run, thay .trf placeholder bằng .trf
 *         thật, chạy trực tiếp + encode MP4), G baseline encode MP4,
 *         H detect mới (runStabilizeDetect), I full render render.js
 *         balanced --no-trf-cache.
 *     Tất cả probe dùng đúng chuỗi filter của enhance.js / render.js
 *     (buildEnhancePostChain, buildEnhancePreChain, graph chính).
 *
 * (b) GHOSTING DENOISE 0.5/0.7/0.8/1.0 TRÊN FOOTAGE PAN THẬT.
 *     Đợt 61/62 chỉ đo trên khối gradient tổng hợp. Nay: ảnh chụp thật
 *     (picsum seed vcut-pan-c, 4000x2250 — biển mờ + bãi sỏi; chỉ dùng làm
 *     vật liệu đo trong scratch, KHÔNG đưa vào batch), pan ngang 24px/frame
 *     (720px/s, cùng tốc độ với các test tổng hợp đợt 61) bằng crop
 *     x=mod(24*n,2720), y=500. Đo trên cả 2 nguồn: pan SẠCH (khử nhiễu áp
 *     trên nội dung sạch — so sánh được trực tiếp với số gradient đợt 61)
 *     và pan NHIỄU (noise alls=15 — gần footage thật). Metric theo dải
 *     thay đổi liên-frame |dC| của frame sạch: flat ≤2, small 2–8 (nhạy
 *     ghost nhất — dưới ngưỡng temporal hqdn3d ở mọi mức), mid 8–24,
 *     large >24 (đối chứng — trên ngưỡng blend), và hệ số blend b hồi quy
 *     D_t = C_t − b·(C_t − C_{t-1}) tính RIÊNG TỪNG DẢI (b gộp cả frame bị
 *     pha loãng bởi dải large không blend — xem LIMITS đợt 63 R2). b≈0
 *     không ghost, b→1 trễ hẳn 1 frame. LƯU Ý: ngưỡng trail <2 mức xám
 *     của đợt 61 chỉ đúng trên gradient tổng hợp (lỗi không gian ≈ 0);
 *     trên ảnh thật, lỗi làm mịn không gian đã ~2 mức ở dải flat nên
 *     trail tuyệt đối không so được với số tổng hợp — kết luận ghost
 *     dựa vào b từng dải + trail trừ sàn flat, không dựa vào ngưỡng <2.
 *     Hình học pan được kiểm chứng bằng cách so frame sạch với crop PIL
 *     trực tiếp từ ảnh gốc tại x=(24t)%2720.
 *
 * Cách chạy: node server/render/src/test_round63_r2_render_cost.js
 * (cần ffmpeg, ffprobe, python3 + PIL/numpy; mạng chỉ để tải ảnh nếu chưa
 * có trong ~/workspace/.scratch-r63r2/vcut-pan-c.jpg). Scratch mới dưới
 * ~/workspace/.scratch-r63r2-XXXX. KHÔNG ghi gì vào repo. Thời gian
 * ~15–25 phút tùy tải.
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r63r2-"));
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
  meta: { name: "r63r2", width: W, height: H, fps: fps || 30 },
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
/** Tách từ shell theo dấu nháy đơn (đủ cho lệnh --dry-run: không có khoảng trắng trong ngoặc). */
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
function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

console.log(`== Đợt 63 R2 — (a) tách chi phí + (b) ghosting pan thật (loadavg lúc bắt đầu: ${loadAvg()}) ==`);
console.log(`   WORK=${work}`);

// --- Chuẩn bị media ---------------------------------------------------------
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
ok(probeOk(path.join(mediaDir, "shakynoisy720.mp4"), 1280, 720), "shakynoisy720.mp4 tạo xong (5s, 720p)");

// Ảnh pan thật: tái dùng file đã tải, không thì tải từ picsum (seed cố định).
const photoPrev = path.join(process.env.HOME, "workspace", ".scratch-r63r2", "vcut-pan-c.jpg");
const photoPath = path.join(work, "pan-photo.jpg");
if (fs.existsSync(photoPrev)) {
  fs.copyFileSync(photoPrev, photoPath);
  console.log(`   📷 ảnh pan: tái dùng ${photoPrev}`);
} else {
  run("curl", ["-sL", "--max-time", "90", "https://picsum.photos/seed/vcut-pan-c/4000/2250",
    "-o", photoPath], "tải ảnh pan thật (picsum seed vcut-pan-c)");
  console.log("   📷 ảnh pan: tải mới từ picsum (seed vcut-pan-c)");
}
const photoSha = sha256(photoPath);
const photoInfo = JSON.parse(execFileSync("python3", ["-c",
  "import sys, json; from PIL import Image; im = Image.open(sys.argv[1]); print(json.dumps({'size': im.size, 'mode': im.mode}))",
  photoPath], { encoding: "utf8" }));
console.log(`   📷 ảnh pan thật: ${photoInfo.size[0]}x${photoInfo.size[1]} ${photoInfo.mode}, sha256=${photoSha.slice(0, 16)}… (biển mờ + bãi sỏi, chỉ làm vật liệu đo trong scratch)`);
ok(photoInfo.size[0] === 4000 && photoInfo.size[1] === 2250, "ảnh pan đúng 4000x2250");
const PAN_X_SPAN = 4000 - 1280; // 2720
const PAN_Y = 500, PAN_STEP = 24;
const panVf = `crop=1280:720:x='mod(${PAN_STEP}*n,${PAN_X_SPAN})':y=${PAN_Y},fps=30`;
run("ffmpeg", ["-loop", "1", "-framerate", "30", "-i", photoPath,
  "-vf", panVf, "-frames:v", "150",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "pan-clean720.mp4")], "pan sạch từ ảnh thật");
run("ffmpeg", ["-loop", "1", "-framerate", "30", "-i", photoPath,
  "-vf", `${panVf},noise=alls=15:allf=t`, "-frames:v", "150",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "pan-noisy720.mp4")], "pan nhiễu từ ảnh thật");
ok(probeOk(path.join(mediaDir, "pan-clean720.mp4"), 1280, 720)
  && probeOk(path.join(mediaDir, "pan-noisy720.mp4"), 1280, 720),
  "pan-clean720 + pan-noisy720 tạo xong (24px/frame, wrap 1 lần ở frame 114)");

// .trf dùng chung cho probe C/D/E/F (detect 1 lần).
const src720 = path.join(mediaDir, "shakynoisy720.mp4");
const clipStab = { in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10 } } };
const trfPath = path.join(work, "stab-720.trf");
{
  const t0 = Date.now();
  const r = runStabilizeDetect("ffmpeg", src720, clipStab, trfPath);
  if (!r.ok) throw new Error(`vidstabdetect lỗi: ${r.error}`);
  console.log(`   📊 detect lấy .trf chung: ${((Date.now() - t0) / 1000).toFixed(2)}s wall (${fs.statSync(trfPath).size} byte)`);
}
ok(fs.existsSync(trfPath) && fs.statSync(trfPath).size > 0, ".trf chung tạo được");

// --- (a0) Lệnh ffmpeg chính từ --dry-run (để probe F replay y hệt) --------
const BALANCED = { stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } };
const specBalanced = specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shakynoisy720.mp4", 5, { enhance: BALANCED })] }], 1280, 720);
const drySpecPath = path.join(work, "dryrun.json");
fs.writeFileSync(drySpecPath, JSON.stringify(specBalanced));
let mainArgs;
{
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", drySpecPath,
    "--out", path.join(work, "dryrun.mp4"), "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", "--no-trf-cache", "--dry-run"],
    { cwd: ROOT, encoding: "utf8" });
  const dryWall = (Date.now() - t0) / 1000;
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("ffmpeg "));
  if (r.status !== 0 || !line) throw new Error(`--dry-run thất bại: status=${r.status} out=${r.stdout} err=${r.stderr}`);
  console.log(`   📊 --dry-run wall: ${dryWall.toFixed(2)}s (node + validate + probe filter/GPU + dựng graph, KHÔNG detect/encode)`);
  const tokens = splitShell(line);
  ok(tokens[0] === "ffmpeg" && tokens.includes("-filter_complex"), "--dry-run trả lệnh ffmpeg parse được");
  const fcIdx = tokens.indexOf("-filter_complex");
  const fc = tokens[fcIdx + 1];
  ok(fc.includes("vidstabtransform") && fc.includes("hqdn3d=12:9:12:9")
    && fc.includes("overlay") && fc.includes("anullsrc"),
    "--dry-run filter_complex đúng chain balanced (transform + hqdn3d 0.5 + overlay + anullsrc)");
  // Thay .trf placeholder bằng .trf thật (escape kiểu filter).
  const escTrf = trfPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
  const fcReal = fc.replace(/\/tmp\/repo1-vidstab-[^']+\.trf/, escTrf);
  ok(fcReal !== fc && fcReal.includes(escTrf), "filter_complex đã thay .trf placeholder bằng .trf thật");
  mainArgs = [...tokens.slice(1, fcIdx + 1), fcReal, ...tokens.slice(fcIdx + 2)];
  console.log(`   📊 filter_complex chính (đã thay trf): ${fcReal.slice(0, 220)}…`);
}

// === (a) Tách chi phí — vi mô (5 lần, median) ================================
console.log("\n== (a) Vi mô — chi phí khởi động/probe (5 lần, median) ==");
const GPU_PROBE_JS = `
const { probeGpuEncoder } = require(${JSON.stringify(path.join(__dirname, "gpuencode.js"))});
const t0 = Date.now();
const r = probeGpuEncoder("ffmpeg");
console.log(JSON.stringify({ secs: (Date.now() - t0) / 1000, tried: r.tried, encoder: r.encoder }));
`;
const gpuProbeJs = path.join(work, "gpu-probe.js");
fs.writeFileSync(gpuProbeJs, GPU_PROBE_JS);
const micro = {};
function microProbe(key, label, fn, parse) {
  const vals = [];
  for (let i = 1; i <= 5; i++) {
    const t0 = Date.now();
    const out = fn();
    const secs = (Date.now() - t0) / 1000;
    vals.push(secs);
    if (parse) parse(out, i);
  }
  micro[key] = { runs: vals.map((v) => +v.toFixed(3)), median: +median(vals).toFixed(3), spreadPct: +spreadPct(vals).toFixed(1) };
  console.log(`   📊 ${label}: ${vals.map((v) => v.toFixed(2)).join(" / ")} → median ${median(vals).toFixed(3)}s (spread ${spreadPct(vals).toFixed(1)}%, loadavg ${loadAvg()})`);
}
microProbe("nodeHelp", "M1 node render.js --help", () =>
  run("node", [path.join(RENDER, "src", "render.js"), "--help"], "node --help"));
microProbe("ffprobe", "M2 ffprobe (probeFile validateMedia)", () =>
  run("ffprobe", ["-v", "error",
    "-show_entries", "stream=codec_type,codec_name,width,height,nb_frames,avg_frame_rate,pix_fmt",
    "-show_entries", "format=duration", "-of", "json", src720], "ffprobe"));
microProbe("filters", "M3 ffmpeg -filters (probeFilterSupport)", () =>
  run("ffmpeg", ["-hide_banner", "-filters"], "ffmpeg -filters"));
microProbe("version", "M4 ffmpeg -version", () =>
  run("ffmpeg", ["-version"], "ffmpeg -version"));
microProbe("gpuProbe", "M5 probeGpuEncoder (nvenc→qsv→vaapi)", () => {
  const r = spawnSync("node", [gpuProbeJs], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`gpu-probe lỗi: ${r.stderr}`);
  return JSON.parse(r.stdout.trim());
}, (out, i) => {
  if (i === 1) console.log(`      (thử ${out.tried.join(" → ")}, encoder=${out.encoder})`);
});
microProbe("spawn1f", "M6 spawn ffmpeg encode 1 frame nullsrc", () =>
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1",
    "-c:v", "libx264", "-frames:v", "1", "-f", "null", "-"], "ffmpeg 1 frame"));
const microSum = Object.values(micro).reduce((a, m) => a + m.median, 0);
console.log(`   📊 TỔNG vi mô (median cộng): ${microSum.toFixed(3)}s — trần trên cho phần "khởi động node + probe" trong 1 lần full render`);
for (const [k, m] of Object.entries(micro)) {
  // Ngưỡng 2s là sanity "không treo/không bệnh" — riêng probeGpuEncoder được
  // đo thật ~2,5s (3 lần encode thử đều fail trên VM không GPU): đó là chi
  // phí thật của render (encoder=auto mặc định), KHÔNG phải lỗi harness,
  // nên ngưỡng của nó là 5s + kiểm tra hành vi trả về null encoder.
  const bound = k === "gpuProbe" ? 5 : 2;
  ok(m.median < bound, `vi mô ${k}: median ${m.median}s < ${bound}s (không treo/bệnh)`);
}

// === (a) Tách chi phí — vĩ mô (3 vòng round-robin, median) ==================
console.log("\n== (a) Vĩ mô — probe to-null + render thật (3 vòng round-robin, median) ==");
const HQ05 = buildEnhancePostChain({ denoise: { strength: 0.5 } }); // ",hqdn3d=12:9:12:9"
const TRF_ESC = trfPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
const TRIM = "trim=start=0:end=5,setpts=PTS-STARTPTS";
const TRANSF = `vidstabtransform=input='${TRF_ESC}':smoothing=10:optalgo=gauss`;
const SCALE_PAD = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,format=yuv420p";
function ffNull(vf) {
  return run("ffmpeg", ["-i", src720, "-vf", vf, "-an", "-f", "null", "-"], "probe to-null");
}
function timedProbe(label, fn) {
  const t0 = Date.now();
  fn();
  const secs = (Date.now() - t0) / 1000;
  console.log(`   📊 ${label}: ${secs.toFixed(2)}s wall → ${(150 / secs).toFixed(2)} fps (loadavg ${loadAvg()})`);
  return secs;
}
const macro = { A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [], I: [] };
for (let round = 1; round <= 3; round++) {
  console.log(`-- vòng ${round} (loadavg ${loadAvg()}) --`);
  macro.A.push(timedProbe(`A decode-only v${round}`, () => ffNull(TRIM)));
  macro.B.push(timedProbe(`B decode+hqdn3d(0.5) v${round}`, () => ffNull(`${TRIM}${HQ05}`)));
  macro.C.push(timedProbe(`C decode+transform v${round}`, () => ffNull(`${TRIM},${TRANSF}`)));
  macro.D.push(timedProbe(`D decode+hqdn3d+transform v${round}`, () => ffNull(`${TRIM},${TRANSF}${HQ05}`)));
  macro.E.push(timedProbe(`E full-chain → null v${round}`, () => ffNull(`${TRIM},${TRANSF},${SCALE_PAD}${HQ05}`)));
  const outF = path.join(work, `main-replay-r${round}.mp4`);
  const argsF = mainArgs.map((a) => (a === path.join(work, "dryrun.mp4") ? outF : a));
  macro.F.push(timedProbe(`F tiến trình ffmpeg chính (replay dry-run) v${round}`, () => {
    const r = spawnSync("ffmpeg", argsF, { stdio: ["ignore", "ignore", "ignore"] });
    if (r.error || r.status !== 0) throw new Error(`main replay lỗi (mã ${r.status})`);
  }));
  ok(outOk(outF) && probeOk(outF, 1280, 720), `F v${round}: MP4 h264 đúng res/thời lượng`);
  const outG = path.join(work, `baseline-enc-r${round}.mp4`);
  macro.G.push(timedProbe(`G baseline encode v${round}`, () => run("ffmpeg", ["-i", src720,
    "-vf", TRIM, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-an", "-y", outG], `baseline encode v${round}`)));
  ok(outOk(outG) && probeOk(outG, 1280, 720), `G v${round}: MP4 h264 đúng res/thời lượng`);
  const trfH = path.join(work, `det-r${round}.trf`);
  macro.H.push(timedProbe(`H detect mới v${round}`, () => {
    const r = runStabilizeDetect("ffmpeg", src720, clipStab, trfH);
    if (!r.ok) throw new Error(`vidstabdetect lỗi: ${r.error}`);
  }));
  ok(fs.existsSync(trfH) && fs.statSync(trfH).size > 0, `H v${round}: .trf > 0 byte`);
  const rf = render(specBalanced, `full-balanced-r${round}`, ["--no-trf-cache"]);
  macro.I.push(rf.secs);
  console.log(`   📊 I full render balanced --no-trf-cache v${round}: ${rf.secs.toFixed(2)}s wall → ${rf.fps.toFixed(2)} fps (loadavg ${loadAvg()})`);
  ok(rf.status === 0 && outOk(rf.outPath) && probeOk(rf.outPath, 1280, 720),
    `I v${round}: full balanced render thật OK`);
}
const med = {};
for (const k of Object.keys(macro)) med[k] = median(macro[k]);
console.log("\n   📊 (a) TỔNG HỢP vĩ mô (median 3 vòng):");
for (const [k, label] of Object.entries({
  A: "decode-only", B: "decode+hqdn3d(0.5)", C: "decode+transform",
  D: "decode+hqdn3d+transform", E: "full-chain → null",
  F: "tiến trình ffmpeg chính (replay)", G: "baseline encode",
  H: "detect mới", I: "full render balanced",
})) {
  console.log(`      ${k} ${label}: ${macro[k].map((v) => v.toFixed(2)).join(" / ")} → median ${med[k].toFixed(2)}s (${(150 / med[k]).toFixed(2)} fps, spread ${spreadPct(macro[k]).toFixed(1)}%)`);
}
// Chỉ báo số đo TRỰC TIẾP; các hiệu là residual kèm spread, không kết luận thành phần.
const denoiseDirect = med.B - med.A; // phép trừ median — chỉ tham chiếu, xem chú thích
const transformDirect = med.C - med.A;
const fullMinusParts = med.I - med.H - med.F;
console.log(`   📊 tham chiếu (median − median, KHÔNG dùng làm kết luận thành phần): denoise 0.5 thuần ≈ ${denoiseDirect.toFixed(2)}s | transform thuần ≈ ${transformDirect.toFixed(2)}s | ` +
  `FULL − DET − MAIN = ${fullMinusParts.toFixed(2)}s (residual: node/probe/JS + sai số tải + tương tác encode)`);
console.log(`   📊 kiểm chứng cộng: DET(${med.H.toFixed(2)}) + MAIN(${med.F.toFixed(2)}) = ${(med.H + med.F).toFixed(2)}s vs FULL(${med.I.toFixed(2)}s) → ${(med.H + med.F) / med.I * 100}% full`);
ok(med.A > 0 && med.B > 0 && med.C > 0 && med.D > 0 && med.E > 0 && med.F > 0 && med.G > 0 && med.H > 0 && med.I > 0,
  "mọi probe vĩ mô median > 0 (không có số âm — bài học đợt 61)");
ok(med.F > med.E, `tiến trình chính F (${med.F.toFixed(2)}s) chậm hơn full-chain → null E (${med.E.toFixed(2)}s) — encode + overlay có chi phí thật`);
ok(med.I > med.H, `full render I (${med.I.toFixed(2)}s) chậm hơn detect H (${med.H.toFixed(2)}s)`);
ok(med.B >= med.A - 0.5, `decode+hqdn3d B (${med.B.toFixed(2)}s) không nhanh hơn decode-only A (${med.A.toFixed(2)}s) quá 0.5s (denoise không âm)`);

// === (b) Ghosting denoise trên footage pan thật =================================
console.log("\n== (b) Ghosting denoise trên pan ảnh thật (720p, 24px/frame) ==");
const GHOST_PAN_PY = `
import sys, json, numpy as np
from PIL import Image
import glob, os

photo, cleanDir = sys.argv[1], sys.argv[2]
jobs = []  # (label, rendDir)
for a in sys.argv[3:]:
    lab, d = a.split("=", 1)
    jobs.append((lab, d))
STEP, SPAN, Y0 = 24, 2720, 500
W, H = 1280, 720

# 1) Kiểm chứng hình học pan: frame sạch phải khớp crop PIL từ ảnh gốc.
photo_g = np.asarray(Image.open(photo).convert("L"), dtype=np.int16)
cf = sorted(glob.glob(cleanDir + "/f*.png"))
assert len(cf) == 150, f"clean frames {len(cf)} != 150"
geo = []
for t in [0, 10, 50, 100, 113, 114, 140]:
    x = (t * STEP) % SPAN
    expect = photo_g[Y0:Y0 + H, x:x + W]
    got = np.asarray(Image.open(cf[t]).convert("L"), dtype=np.int16)
    geo.append({"t": t, "x": x, "mad": round(float(np.abs(got - expect).mean()), 3)})
print("PAN_GEO " + json.dumps(geo))

# 2) Tải frame sạch 1 lần; mask theo |dC| dùng chung cho mọi render.
clean = [np.asarray(Image.open(f).convert("L"), dtype=np.int16) for f in cf]
masks = {}   # t -> dict band -> mask bool
for t in range(1, 150):
    x_prev = ((t - 1) * STEP) % SPAN
    x = (t * STEP) % SPAN
    if x != x_prev + STEP:
        continue  # frame wrap: bỏ qua
    dC = clean[t] - clean[t - 1]
    a = np.abs(dC)
    masks[t] = {
        "flat": a <= 2,
        "small": (a > 2) & (a <= 8),
        "mid": (a > 8) & (a <= 24),
        "large": a > 24,
        "moved": a > 2,
        "dC": dC,
    }
print(f"PAN_FRAMES usable={len(masks)} (wrap bỏ 1 frame)")
# tỉ lệ pixel trung bình mỗi dải (tính trên 5 frame mẫu)
import itertools
tot = {}
for t in list(masks)[:5]:
    for b in ["flat", "small", "mid", "large"]:
        tot[b] = tot.get(b, 0) + int(masks[t][b].sum())
npx = W * H * 5
print("PAN_PIXELS " + json.dumps({b: round(v / npx * 100, 2) for b, v in tot.items()}))

for lab, rdir in jobs:
    rf = sorted(glob.glob(rdir + "/f*.png"))
    assert len(rf) == 150, f"{lab}: frames {len(rf)} != 150"
    bands = {"flat": [], "small": [], "mid": [], "large": []}
    bs = []
    bandNum = {"flat": 0.0, "small": 0.0, "mid": 0.0, "large": 0.0}
    bandDen = {"flat": 0.0, "small": 0.0, "mid": 0.0, "large": 0.0}
    for t, m in masks.items():
        d = np.asarray(Image.open(rf[t]).convert("L"), dtype=np.int16) - clean[t]
        ad = np.abs(d)
        df = d.astype(np.float64); dC = m["dC"].astype(np.float64)
        for b in bands:
            mk = m[b]
            bands[b].append(float(ad[mk].mean()) if mk.any() else 0.0)
            if mk.any():
                bandNum[b] += float((df[mk] * dC[mk]).sum())
                bandDen[b] += float((dC[mk] ** 2).sum())
        # hệ số blend b: D_t = C_t - b*dC  ->  b = -sum(d*dC)/sum(dC^2) trên moved
        dC = m["dC"]; mv = m["moved"]
        den = float((dC[mv].astype(np.float64) ** 2).sum())
        num = float((d[mv].astype(np.float64) * dC[mv].astype(np.float64)).sum())
        bs.append(-num / den if den > 0 else 0.0)
    out = {"label": lab}
    for b, v in bands.items():
        a = np.array(v)
        out[b] = {"mean": round(float(a.mean()), 4), "median": round(float(np.median(a)), 4),
                  "p90": round(float(np.percentile(a, 90)), 4), "max": round(float(a.max()), 4)}
    ba = np.array(bs)
    out["blend"] = {"mean": round(float(ba.mean()), 4), "median": round(float(np.median(ba)), 4),
                    "p90": round(float(np.percentile(ba, 90)), 4)}
    # b riêng từng dải (không bị pha loãng bởi dải large không blend).
    out["blendByBand"] = {b: (round(-bandNum[b] / bandDen[b], 4) if bandDen[b] > 0 else 0.0)
                          for b in ["flat", "small", "mid", "large"]}
    print("PAN_GHOST " + json.dumps(out))
`;
const ghostPanPy = path.join(work, "ghost_pan.py");
fs.writeFileSync(ghostPanPy, GHOST_PAN_PY);
function ghostPanOf(renderJobs) {
  const args = [ghostPanPy, photoPath, path.join(work, "frames-pan-clean")];
  for (const [lab, dir] of renderJobs) args.push(`${lab}=${dir}`);
  const r = spawnSync("python3", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ghost_pan.py lỗi: ${r.stdout} ${r.stderr}`);
  const geoLine = (r.stdout || "").split("\n").find((l) => l.startsWith("PAN_GEO "));
  const geo = JSON.parse(geoLine.slice("PAN_GEO ".length));
  const framesLine = (r.stdout || "").split("\n").find((l) => l.startsWith("PAN_FRAMES "));
  const pixelsLine = (r.stdout || "").split("\n").find((l) => l.startsWith("PAN_PIXELS "));
  const out = { geo, frames: framesLine, pixels: JSON.parse(pixelsLine.slice("PAN_PIXELS ".length)), results: {} };
  for (const line of (r.stdout || "").split("\n")) {
    if (line.startsWith("PAN_GHOST ")) {
      const j = JSON.parse(line.slice("PAN_GHOST ".length));
      out.results[j.label] = j;
    }
  }
  if (Object.keys(out.results).length !== renderJobs.length) {
    throw new Error(`không parse đủ ghost pan: ${r.stdout} ${r.stderr}`);
  }
  return out;
}
const cleanFramesDir = path.join(work, "frames-pan-clean");
extractFrames(path.join(mediaDir, "pan-clean720.mp4"), cleanFramesDir, "format=gray");
const specDenoise = (srcFile, s) => specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", srcFile, 5, s === null ? {} : { enhance: { denoise: { strength: s } } })] }], 1280, 720);
const ghostJobs = []; // [label, framesDir]
function denoiseRender(srcFile, s, name) {
  const r = render(specDenoise(srcFile, s), name);
  ok(r.status === 0 && outOk(r.outPath) && probeOk(r.outPath, 1280, 720),
    `${name}: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
  const dir = path.join(work, `frames-${name}`);
  extractFrames(r.outPath, dir, "format=gray");
  return dir;
}
// Nguồn SẠCH: denoise 0.5/0.7/0.8/1.0 + đối chứng không enhance (sàn encode).
ghostJobs.push(["clean-ctrl", denoiseRender("pan-clean720.mp4", null, "pan-clean-ctrl")]);
for (const s of [0.5, 0.7, 0.8, 1.0]) {
  ghostJobs.push([`clean-${s}`, denoiseRender("pan-clean720.mp4", s, `pan-clean-d${String(s).replace(".", "_")}`)]);
}
// Nguồn NHIỄU: denoise 0.5/0.8/1.0 + đối chứng không enhance (b ≈ 0 kỳ vọng).
ghostJobs.push(["noisy-ctrl", denoiseRender("pan-noisy720.mp4", null, "pan-noisy-ctrl")]);
for (const s of [0.5, 0.8, 1.0]) {
  ghostJobs.push([`noisy-${s}`, denoiseRender("pan-noisy720.mp4", s, `pan-noisy-d${String(s).replace(".", "_")}`)]);
}
const ghost = ghostPanOf(ghostJobs);
console.log(`   📊 pan geometry (frame sạch vs crop PIL từ ảnh gốc): ${ghost.geo.map((g) => `t${g.t}=x${g.x} mad=${g.mad}`).join(", ")}`);
console.log(`   📊 ${ghost.frames}; tỉ lệ pixel theo dải |dC|: ${JSON.stringify(ghost.pixels)}%`);
for (const [lab, g] of Object.entries(ghost.results)) {
  console.log(`   📊 ${lab}: small trail mean=${g.small.mean} median=${g.small.median} p90=${g.small.p90} | mid=${g.mid.mean} | large=${g.large.mean} | flat=${g.flat.mean} | blend b mean=${g.blend.mean} median=${g.blend.median} p90=${g.blend.p90} | b từng dải flat/small/mid/large=${g.blendByBand.flat}/${g.blendByBand.small}/${g.blendByBand.mid}/${g.blendByBand.large}`);
}
const G = ghost.results;
ok(ghost.geo.every((g) => g.mad < 5), `hình học pan đúng (mad crop PIL < 5 ở mọi frame mẫu, max ${Math.max(...ghost.geo.map((g) => g.mad))})`);
ok(ghost.pixels.small >= 5, `dải small (2<|dC|≤8) đủ pixel để đo (${ghost.pixels.small}% frame)`);
ok(G["clean-ctrl"].small.mean < 1.5, `sàn encode (clean, không enhance): trail small ${G["clean-ctrl"].small.mean} < 1.5 (sàn ~1 mức)`);
ok(G["clean-ctrl"].blendByBand.small < 0.05, `sàn encode: b dải small ở đối chứng ${G["clean-ctrl"].blendByBand.small} < 0.05 (bộ ước lượng không lệch)`);
ok(G["clean-0.5"].blendByBand.small < G["clean-1"].blendByBand.small, `b dải small tăng theo strength trên pan sạch (0.5: ${G["clean-0.5"].blendByBand.small} → 1.0: ${G["clean-1"].blendByBand.small})`);
ok(G["clean-0.5"].blendByBand.small < 0.7, `b dải small ở 0.5 còn dưới 0.7 (${G["clean-0.5"].blendByBand.small} — trễ thời gian có giới hạn)`);
ok(G["clean-1"].blendByBand.large < 0.05, `không ghost trên cạnh lớn ngay cả ở 1.0 (b dải large ${G["clean-1"].blendByBand.large} < 0.05 — khớp phát hiện cạnh cứng đợt 61)`);
ok(G["clean-1"].small.mean > G["clean-0.5"].small.mean, `trail small tăng theo strength trên pan sạch (0.5: ${G["clean-0.5"].small.mean} → 1.0: ${G["clean-1"].small.mean})`);
ok(G["clean-1"].blend.mean > G["clean-0.5"].blend.mean, `hệ số blend b gộp tăng theo strength trên pan sạch (0.5: ${G["clean-0.5"].blend.mean} → 1.0: ${G["clean-1"].blend.mean})`);
ok(Math.abs(G["noisy-ctrl"].blend.mean) < 0.05, `đối chứng nhiễu không ghost (blend b=${G["noisy-ctrl"].blend.mean}, |b|<0.05 — bộ ước lượng không lệch)`);
ok(G["noisy-1"].blend.mean > G["noisy-0.5"].blend.mean, `blend b tăng theo strength trên pan nhiễu (0.5: ${G["noisy-0.5"].blend.mean} → 1.0: ${G["noisy-1"].blend.mean})`);

// === Tổng kết ================================================================
const summary = {
  photo: { sha256: photoSha, size: photoInfo.size, pan: { step: PAN_STEP, span: PAN_X_SPAN, y: PAN_Y } },
  micro: micro,
  microSumMedian: +microSum.toFixed(3),
  macro: Object.fromEntries(Object.entries(macro).map(([k, v]) => [k, {
    runs: v.map((x) => +x.toFixed(2)), median: +med[k].toFixed(2), fps: +(150 / med[k]).toFixed(2), spreadPct: +spreadPct(v).toFixed(1),
  }])),
  residualFullMinusDetectMinusMain: +fullMinusParts.toFixed(2),
  detectPlusMainVsFullPct: +((med.H + med.F) / med.I * 100).toFixed(1),
  ghost: {
    geo: ghost.geo, frames: ghost.frames, pixels: ghost.pixels,
    results: Object.fromEntries(Object.entries(G).map(([k, g]) => [k, {
      smallMean: g.small.mean, smallMedian: g.small.median, smallP90: g.small.p90,
      midMean: g.mid.mean, largeMean: g.large.mean, flatMean: g.flat.mean,
      blendMean: g.blend.mean, blendMedian: g.blend.median, blendP90: g.blend.p90,
      blendByBand: g.blendByBand,
    }])),
  },
};
console.log(`\n== test_round63_r2_render_cost: ${pass} pass, ${fail} fail (WORK=${work}, loadavg cuối: ${loadAvg()}) ==`);
console.log("== SUMMARY (JSON) ==");
console.log(JSON.stringify(summary, null, 1));
if (fail > 0) process.exit(1);
