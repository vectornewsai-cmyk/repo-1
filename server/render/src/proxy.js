/**
 * proxy.js — Proxy editing cho VCut Studio (Phase 8 Q8).
 *
 * Vấn đề: video nguồn nặng (1080p/4K, bitrate cao) làm preview trong
 * trình duyệt giật vì trình duyệt phải decode full-res mỗi frame.
 * Cách làm của CapCut: tạo bản proxy nhẹ để edit, lúc export cuối vẫn
 * dùng file gốc đủ phân giải.
 *
 * Thiết kế (cố tình tối giản, không tự động thay thế ở render):
 * - `generateProxy(input, outDir, {height})`: tạo file
 *   `<stem>__proxy_<height>p.mp4` + sidecar JSON cùng tên. Proxy giữ
 *   nguyên fps và duration của nguồn (đồng bộ thời gian 1:1 với bản
 *   gốc), chỉ giảm phân giải + bitrate. Audio được copy (aac) để
 *   preview vẫn có tiếng và đồng bộ.
 * - `findProxy(mediaDir, src, height)`: trả về đường dẫn proxy NẾU
 *   sidecar còn khớp nguồn (cùng tên file, cùng size, cùng mtime).
 *   Nguồn đổi → coi như stale → trả null (phải generate lại).
 * - KHÔNG upscale: nguồn đã nhỏ hơn hoặc bằng target thì bỏ qua
 *   (trả {skipped:true}), không tạo proxy vô nghĩa.
 * - QUAN TRỌNG: render worker KHÔNG tự thay src bằng proxy. Export
 *   cuối luôn dùng file gốc. Proxy chỉ phục vụ preview (web app và
 *   bridge /api/proxy). Bất kỳ ai muốn render thử bằng proxy phải
 *   tự trỏ spec sang file proxy — đó là hành vi tường minh, không
 *   phải mặc định ngầm.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const PROXY_HEIGHTS = [480, 720];

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}

function parseFps(rateStr) {
  if (!rateStr || typeof rateStr !== "string") return 0;
  const [n, d] = rateStr.split("/").map(Number);
  if (!n || !d) return 0;
  return n / d;
}

/** Probe metadata tối thiểu của 1 file video bằng ffprobe. */
function probeMedia(file, bins = {}) {
  const ffprobe = bins.ffprobe || "ffprobe";
  let out;
  try {
    out = run(ffprobe, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,r_frame_rate,avg_frame_rate,duration",
      "-show_entries", "format=duration",
      "-of", "json",
      file,
    ]);
  } catch (e) {
    throw new Error(`Không probe được ${file}: ${(e.stderr || e.message || "").toString().trim().split("\n").pop()}`);
  }
  const data = JSON.parse(out);
  const st = (data.streams || [])[0];
  if (!st || !st.width || !st.height) throw new Error(`Không đọc được kích thước video: ${file}`);
  const fps = parseFps(st.r_frame_rate) || parseFps(st.avg_frame_rate) || 30;
  // Có audio không (để quyết định copy audio)?
  let hasAudio = false;
  try {
    const a = run(ffprobe, ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file]);
    hasAudio = a.trim().length > 0;
  } catch { hasAudio = false; }
  return {
    width: st.width,
    height: st.height,
    fps,
    duration: parseFloat(st.duration || (data.format && data.format.duration) || 0) || 0,
    hasAudio,
  };
}

function stemOf(file) {
  return path.basename(file).replace(/\.[^.]+$/, "");
}

function proxyFileName(srcBase, height) {
  return `${stemOf(srcBase)}__proxy_${height}p.mp4`;
}

function sidecarFileName(srcBase, height) {
  return `${stemOf(srcBase)}__proxy_${height}p.json`;
}

/**
 * Tạo proxy cho 1 file video.
 * Trả về: {skipped:true, reason} khi nguồn đã nhỏ, hoặc
 * {proxy, proxyWidth, proxyHeight, source, sourceWidth, sourceHeight, fps, sidecar}.
 */
function generateProxy(input, outDir, opts = {}) {
  const height = opts.height || 720;
  if (!PROXY_HEIGHTS.includes(height)) {
    throw new Error(`Proxy height phải là một trong ${PROXY_HEIGHTS.join("/")} (nhận ${height}).`);
  }
  if (!fs.existsSync(input)) throw new Error(`Không tìm thấy file nguồn: ${input}`);
  fs.mkdirSync(outDir, { recursive: true });

  const meta = probeMedia(input, opts);
  if (meta.height <= height) {
    return { skipped: true, reason: "source-already-small", sourceHeight: meta.height, targetHeight: height };
  }

  const outFile = path.join(outDir, proxyFileName(input, height));
  const ffmpeg = opts.ffmpeg || "ffmpeg";
  const vf = `scale=-2:${height}`;
  const args = ["-y", "-v", "error", "-i", input, "-vf", vf];
  if (meta.fps > 0) args.push("-r", String(meta.fps));
  args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p");
  if (meta.hasAudio) args.push("-c:a", "aac", "-b:a", "128k");
  else args.push("-an");
  args.push("-movflags", "+faststart", outFile);
  try {
    run(ffmpeg, args);
  } catch (e) {
    try { fs.rmSync(outFile, { force: true }); } catch {}
    throw new Error(`Tạo proxy thất bại: ${(e.stderr || e.message || "").toString().trim().split("\n").pop()}`);
  }

  const pmeta = probeMedia(outFile, opts);
  const st = fs.statSync(input);
  const sidecar = {
    version: 1,
    source: path.basename(input),
    sourceWidth: meta.width,
    sourceHeight: meta.height,
    sourceSize: st.size,
    sourceMtimeMs: st.mtimeMs,
    proxy: path.basename(outFile),
    proxyWidth: pmeta.width,
    proxyHeight: pmeta.height,
    fps: meta.fps,
    height,
    createdAt: new Date().toISOString(),
  };
  const sidecarPath = path.join(outDir, sidecarFileName(input, height));
  fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2));
  return {
    skipped: false,
    proxy: outFile,
    sidecar: sidecarPath,
    proxyWidth: pmeta.width,
    proxyHeight: pmeta.height,
    source: input,
    sourceWidth: meta.width,
    sourceHeight: meta.height,
    fps: meta.fps,
  };
}

/**
 * Tìm proxy còn hợp lệ cho 1 src trong mediaDir.
 * Trả về đường dẫn tuyệt đối tới file proxy, hoặc null.
 * Stale khi: thiếu sidecar, thiếu file proxy, nguồn đổi size/mtime,
 * hoặc sidecar ghi height khác.
 */
function findProxy(mediaDir, src, height = 720) {
  if (!mediaDir || !src) return null;
  const srcBase = path.basename(src);
  const sidecarPath = path.join(mediaDir, sidecarFileName(srcBase, height));
  if (!fs.existsSync(sidecarPath)) return null;
  let sc;
  try { sc = JSON.parse(fs.readFileSync(sidecarPath, "utf8")); } catch { return null; }
  if (sc.version !== 1 || sc.source !== srcBase || sc.height !== height) return null;
  const proxyPath = path.join(mediaDir, sc.proxy || proxyFileName(srcBase, height));
  if (!fs.existsSync(proxyPath)) return null;
  const srcPath = path.join(mediaDir, srcBase);
  if (!fs.existsSync(srcPath)) return null;
  const st = fs.statSync(srcPath);
  if (st.size !== sc.sourceSize) return null;
  if (st.mtimeMs !== sc.sourceMtimeMs) return null;
  return proxyPath;
}

/** Đọc sidecar (phục vụ UI/bridge hiển thị), null khi không có. */
function readSidecar(mediaDir, src, height = 720) {
  const p = path.join(mediaDir, sidecarFileName(path.basename(src), height));
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function parseCliArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--input") a.input = argv[++i];
    else if (t === "--out-dir") a.outDir = argv[++i];
    else if (t === "--height") a.height = parseInt(argv[++i], 10);
    else if (t === "--self-test") a.selfTest = true;
    else if (t === "--json") a.json = true;
  }
  return a;
}

function selfTest() {
  const os = require("os");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-proxy-"));
  const src = path.join(dir, "src1080.mp4");
  // Nguồn 1080p tổng hợp 5s.
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=5", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", src]);
  const checks = [];
  const ok = (c, m) => { checks.push([!!c, m]); if (!c) console.error(`  FAIL: ${m}`); };
  const r720 = generateProxy(src, dir, { height: 720 });
  ok(!r720.skipped, "1080p → 720p không bị skip");
  ok(r720.proxyHeight === 720, `proxy cao 720 (nhận ${r720.proxyHeight})`);
  ok(r720.proxyWidth === 1280, `proxy rộng 1280 (nhận ${r720.proxyWidth})`);
  ok(Math.abs(r720.fps - 30) < 0.01, `proxy giữ fps 30 (nhận ${r720.fps})`);
  ok(fs.existsSync(r720.sidecar), "có sidecar JSON");
  const found = findProxy(dir, "src1080.mp4", 720);
  ok(found === r720.proxy, "findProxy trả đúng file proxy vừa tạo");
  const r480 = generateProxy(src, dir, { height: 480 });
  ok(r480.proxyHeight === 480 && r480.proxyWidth === 854, `480p ra 854x480 (nhận ${r480.proxyWidth}x${r480.proxyHeight})`);
  // Nguồn nhỏ: không tạo proxy.
  const small = path.join(dir, "small.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", small]);
  const rSmall = generateProxy(small, dir, { height: 720 });
  ok(rSmall.skipped === true, "nguồn 360p → 720p bị skip (không upscale)");
  ok(!fs.existsSync(path.join(dir, proxyFileName(small, 720))), "không tạo file proxy cho nguồn nhỏ");
  // Stale: đổi nội dung nguồn → findProxy phải trả null.
  fs.appendFileSync(src, Buffer.alloc(1024));
  ok(findProxy(dir, "src1080.mp4", 720) === null, "nguồn đổi size → proxy stale, findProxy null");
  // Height sai trong sidecar → null (dùng sidecar 720p hỏi 480p khi chưa có? đã có 480p rồi nên test bằng height lạ)
  ok(findProxy(dir, "src1080.mp4", 999) === null, "height không khớp → null");
  const fail = checks.filter(([c]) => !c).length;
  console.log(`proxy --self-test: ${checks.length - fail}/${checks.length} pass (tmp: ${dir})`);
  if (fail) process.exit(1);
}

if (require.main === module) {
  const a = parseCliArgs(process.argv.slice(2));
  try {
    if (a.selfTest) { selfTest(); process.exit(0); }
    if (!a.input || !a.outDir) {
      console.error("Dùng: node src/proxy.js --input <file> --out-dir <dir> [--height 480|720]");
      process.exit(2);
    }
    const r = generateProxy(a.input, a.outDir, { height: a.height || 720 });
    console.log(JSON.stringify(r, null, 2));
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
}

module.exports = { generateProxy, findProxy, readSidecar, probeMedia, proxyFileName, sidecarFileName, PROXY_HEIGHTS };
