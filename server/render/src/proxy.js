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
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port CJS của
// apps/web/scripts/eperm-retry.mjs; xem server/eperm-retry.cjs).
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const { execFileSync, spawn, spawnSync } = require("child_process");
// Phase 9 đợt 74 B4: timeout cho mọi lần chạy ffmpeg/ffprobe trong proxy
// (trước đây run() không timeout — encode proxy treo thì bridge treo theo).
const {
  KILL_SIGNAL, encodeTimeoutMs, ffprobeTimeoutMs,
} = require("./timeouts");

const PROXY_HEIGHTS = [480, 720];

function run(cmd, args, opts = {}) {
  // Mặc định: timeout probe ffprobe (30s). Lệnh encode truyền timeout
  // riêng theo độ dài (opts.timeout ghi đè mặc định này).
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: ffprobeTimeoutMs(), killSignal: KILL_SIGNAL, ...opts });
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
    // Đợt 74 B4: timeout encode tỉ lệ với độ dài nguồn (cùng công thức
    // encodeTimeoutMs như render chính); treo → execFileSync ném ETIMEDOUT.
    run(ffmpeg, args, { timeout: encodeTimeoutMs(meta.duration || 0) });
  } catch (e) {
    try { fs.rmSync(outFile, { force: true }); } catch {}
    throw new Error(`Tạo proxy thất bại: ${(e.stderr || e.message || "").toString().trim().split("\n").pop()}`);
  }

  const pmeta = probeMedia(outFile, opts);
  const sidecarPath = writeProxySidecar(input, outFile, meta, pmeta, height);
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
 * Đợt 85 M8 — ghi sidecar JSON cho 1 proxy (tách từ generateProxy để
 * bản đồng bộ và bản có tiến trình dùng chung một định dạng; sidecar cũ
 * đọc được như trước vì các trường giữ nguyên).
 */
function writeProxySidecar(input, outFile, meta, pmeta, height) {
  const st = fs.statSync(input);
  // Đợt 38 U2: ghi kích thước của chính file proxy vào manifest
  // (trường mới, cộng thêm — findProxy không kiểm tra trường này nên
  // sidecar cũ/mới đều đọc được). Client dùng proxySizeBytes do bridge
  // trả về làm nguồn chính; manifest là nguồn dự phòng cho tool ngoài.
  const pst = fs.statSync(outFile);
  const sidecar = {
    version: 1,
    source: path.basename(input),
    sourceWidth: meta.width,
    sourceHeight: meta.height,
    sourceSize: st.size,
    sourceMtimeMs: st.mtimeMs,
    proxy: path.basename(outFile),
    proxySize: pst.size,
    proxyWidth: pmeta.width,
    proxyHeight: pmeta.height,
    fps: meta.fps,
    height,
    createdAt: new Date().toISOString(),
  };
  const sidecarPath = path.join(path.dirname(outFile), sidecarFileName(input, height));
  writeFileEpermRetry(sidecarPath, JSON.stringify(sidecar, null, 2), { label: "render-proxy-sidecar" });
  return sidecarPath;
}

/**
 * Đợt 85 M8 — tạo proxy BẤT ĐỒNG BỘ với tiến trình % THẬT.
 * Cùng encode args và cùng kết quả trả về như generateProxy đồng bộ,
 * nhưng chạy ffmpeg bằng spawn + `-progress pipe:2` và gọi
 * `opts.onProgress(pct)` mỗi khi % đổi (pct = out_time_ms / duration,
 * làm tròn xuống, kẹp 0..99 trong lúc chạy; 100 chỉ khi encode xong và
 * sidecar đã ghi — caller tự đặt 100 lúc done, không fake 100 sớm).
 * - duration <= 0 (probe không đọc được) → không gọi onProgress lần
 *   nào (caller hiện "Đang tạo…" không %, thay vì % bịa).
 * - Timeout tỉ lệ độ dài như bản đồng bộ (encodeTimeoutMs); treo →
 *   kill + reject, file dở bị xóa như bản đồng bộ.
 * - Trả Promise: resolve cùng shape generateProxy, reject Error cùng
 *   message "Tạo proxy thất bại: …" khi ffmpeg lỗi/timeout.
 */
function generateProxyWithProgress(input, outDir, opts = {}) {
  const height = opts.height || 720;
  if (!PROXY_HEIGHTS.includes(height)) {
    return Promise.reject(new Error(`Proxy height phải là một trong ${PROXY_HEIGHTS.join("/")} (nhận ${height}).`));
  }
  if (!fs.existsSync(input)) {
    return Promise.reject(new Error(`Không tìm thấy file nguồn: ${input}`));
  }
  fs.mkdirSync(outDir, { recursive: true });

  let meta;
  try {
    meta = probeMedia(input, opts);
  } catch (e) {
    return Promise.reject(e);
  }
  if (meta.height <= height) {
    return Promise.resolve({ skipped: true, reason: "source-already-small", sourceHeight: meta.height, targetHeight: height });
  }

  const outFile = path.join(outDir, proxyFileName(input, height));
  const ffmpeg = opts.ffmpeg || "ffmpeg";
  const vf = `scale=-2:${height}`;
  // Đợt 85 M8: -progress pipe:2 (stderr) thay vì pipe:1 — pipe stdout bị
  // ffmpeg buffer tới cuối encode nên client chỉ thấy 99% một lần duy
  // nhất; stderr flush theo từng đợt tiến trình (đo thật: clip 20 s cho
  // 26 mẫu, mẫu đầu sau 653 ms). out_time_ms của ffmpeg tính bằng
  // MICRO giây (dù tên có "ms") nên chia cho duration*1e6.
  const args = ["-y", "-v", "error", "-nostats", "-progress", "pipe:2", "-i", input, "-vf", vf];
  if (meta.fps > 0) args.push("-r", String(meta.fps));
  args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p");
  if (meta.hasAudio) args.push("-c:a", "aac", "-b:a", "128k");
  else args.push("-an");
  args.push("-movflags", "+faststart", outFile);

  const onProgress = typeof opts.onProgress === "function" ? opts.onProgress : null;
  // out_time_ms tính bằng micro giây → tổng thời lượng cũng đổi ra µs.
  const durationUs = (meta.duration || 0) * 1e6;
  let lastPct = -1;
  const emit = (pct) => {
    const p = Math.max(0, Math.min(99, Math.floor(pct)));
    if (onProgress && p !== lastPct) { lastPct = p; onProgress(p); }
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      try { fs.rmSync(outFile, { force: true }); } catch {}
      reject(err);
    };
    let child;
    try {
      child = spawn(ffmpeg, args, { stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      fail(new Error(`Tạo proxy thất bại: ${(e.message || "").toString().trim().split("\n").pop()}`));
      return;
    }
    // Đợt 74 B4: timeout encode tỉ lệ với độ dài nguồn (cùng công thức
    // encodeTimeoutMs như bản đồng bộ); treo → kill + reject.
    const timer = setTimeout(() => {
      try { child.kill(KILL_SIGNAL); } catch {}
      fail(new Error("Tạo proxy thất bại: timeout encode (ffmpeg không kết thúc trong giới hạn)"));
    }, encodeTimeoutMs(meta.duration || 0));
    if (typeof timer.unref === "function") timer.unref();
    let stderr = "";
    let buf = "";
    // -progress pipe:2 ghi vào stderr cùng với log lỗi: parse từng dòng
    // out_time_ms=… để lấy % thật, các dòng còn lại giữ làm message lỗi.
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stderr += text;
      buf += text;
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        const m = /^out_time_ms=(\d+)$/.exec(line);
        if (m && durationUs > 0) emit(Number(m[1]) / durationUs * 100);
      }
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      fail(new Error(`Tạo proxy thất bại: ${(e.message || "").toString().trim().split("\n").pop()}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      if (code !== 0) {
        fail(new Error(`Tạo proxy thất bại: ${(stderr || `ffmpeg exit ${code}`).toString().trim().split("\n").pop()}`));
        return;
      }
      settled = true;
      try {
        const pmeta = probeMedia(outFile, opts);
        const sidecarPath = writeProxySidecar(input, outFile, meta, pmeta, height);
        resolve({
          skipped: false,
          proxy: outFile,
          sidecar: sidecarPath,
          proxyWidth: pmeta.width,
          proxyHeight: pmeta.height,
          source: input,
          sourceWidth: meta.width,
          sourceHeight: meta.height,
          fps: meta.fps,
        });
      } catch (e) {
        try { fs.rmSync(outFile, { force: true }); } catch {}
        reject(e);
      }
    });
  });
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

module.exports = { generateProxy, generateProxyWithProgress, findProxy, readSidecar, probeMedia, proxyFileName, sidecarFileName, PROXY_HEIGHTS };
