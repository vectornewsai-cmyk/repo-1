/**
 * test_proxy_q8.js — Test proxy editing (Phase 8 Q8).
 * Chạy: node test_proxy_q8.js (từ server/render).
 * Kiểm chứng thật bằng ffmpeg/ffprobe, không mock:
 *  1. generateProxy 1080p → 720p/480p đúng kích thước, giữ fps.
 *  2. findProxy: hit khi nguồn không đổi, null khi nguồn đổi (stale).
 *  3. Nguồn nhỏ hơn target → skip, không tạo file.
 *  4. QUAN TRỌNG NHẤT: render spec trỏ file GỐC trong mediaDir đã có
 *     sẵn proxy → output vẫn là phân giải GỐC (render không tự thay
 *     bằng proxy). Đây là cam kết cốt lõi của proxy editing.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const { generateProxy, findProxy } = require("./src/proxy");

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function probeDims(file) {
  const out = run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0", file]);
  const [w, h] = out.trim().split(",").map(Number);
  return { w, h };
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-q8-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; } else { fail++; console.error(`  FAIL: ${m}`); } };

  // Nguồn 1080p 5s + nguồn nhỏ 360p.
  const src1080 = path.join(mediaDir, "src1080.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=5",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", src1080]);
  const small = path.join(mediaDir, "small.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=2",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", small]);

  // 1. Proxy 720p + 480p.
  const r720 = generateProxy(src1080, mediaDir, { height: 720 });
  ok(!r720.skipped && r720.proxyWidth === 1280 && r720.proxyHeight === 720, "proxy 720p = 1280x720");
  ok(Math.abs(r720.fps - 30) < 0.01, "proxy giữ fps 30");
  const d720 = probeDims(r720.proxy);
  ok(d720.w === 1280 && d720.h === 720, "ffprobe xác nhận proxy 720p");
  const r480 = generateProxy(src1080, mediaDir, { height: 480 });
  ok(r480.proxyWidth === 854 && r480.proxyHeight === 480, "proxy 480p = 854x480");

  // 2. findProxy hit / stale.
  ok(findProxy(mediaDir, "src1080.mp4", 720) === r720.proxy, "findProxy hit sau khi generate");
  fs.appendFileSync(src1080, Buffer.alloc(512));
  ok(findProxy(mediaDir, "src1080.mp4", 720) === null, "nguồn đổi → stale → null");
  // Khôi phục nguồn (tạo lại đúng file) để test render sau dùng file sạch.
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=5",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", src1080]);
  generateProxy(src1080, mediaDir, { height: 720 });
  ok(findProxy(mediaDir, "src1080.mp4", 720) !== null, "generate lại → findProxy hit trở lại");

  // 3. Nguồn nhỏ → skip.
  const rs = generateProxy(small, mediaDir, { height: 720 });
  ok(rs.skipped === true, "nguồn 360p → skip");
  ok(!fs.existsSync(path.join(mediaDir, "small__proxy_720p.mp4")), "không tạo file proxy cho nguồn nhỏ");

  // 4. Render spec trỏ file GỐC trong mediaDir đã có proxy → output 1080p.
  const spec = {
    version: "0.2.0",
    meta: { name: "q8-proxy-proof", width: 1920, height: 1080, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [
      { kind: "video", id: "c1", src: "src1080.mp4", start: 0, duration: 2, in: 0, out: 2 },
    ] }],
  };
  const specPath = path.join(dir, "spec.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const out = path.join(dir, "out.mp4");
  run("node", [path.join(__dirname, "src", "render.js"), "--spec", specPath, "--out", out,
    "--media-dir", mediaDir, "-y", "-q"]);
  const dOut = probeDims(out);
  ok(dOut.w === 1920 && dOut.h === 1080, `render dùng file gốc → output 1920x1080 (nhận ${dOut.w}x${dOut.h})`);

  console.log(`\n== Q8 proxy: ${pass} pass, ${fail} fail (tmp: ${dir}) ==`);
  if (fail) process.exit(1);
}

main().catch((e) => { console.error("Q8 proxy test lỗi:", e.message); process.exit(1); });
