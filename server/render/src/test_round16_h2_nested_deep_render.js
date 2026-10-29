#!/usr/bin/env node
/**
 * test_round16_h2_nested_deep_render.js — Kiểm chứng render MP4 THẬT cho lá
 * sâu đã trim/split qua store (Phase 9 đợt 16, luồng H2; đóng nợ đợt 15:
 * "chưa có test render MP4 thật cho lá sâu đã trim/split").
 *
 * Chạy: node server/render/src/test_round16_h2_nested_deep_render.js
 * Media test nhỏ (64×64) trong thư mục tạm /tmp, dọn khi pass hết.
 *
 * TÍNH ĐỘC LẬP CỦA TEST (tránh kiểm chứng vòng tròn — cùng triết lý T4):
 * các con số trim/duration/màu dưới đây KHÔNG lấy từ code split/trim của
 * store mà suy bằng tay từ fixture 3 cấp (xem header), rồi ghi cứng:
 *
 * Fixture 3 cấp (cùng fixture S của nestedStore.test.ts):
 * - Lá L: video src.mp4 [0,8) in 0–8. Nguồn: đỏ 0–4s, xanh lá 4–8s.
 * - Inner "in": [0,4) trim [2,6) → phát lá ở thời gian 2–6.
 * - Mid "mid": [0,2) trim [1,3) → phát inner ở thời gian 1–3.
 * - Top "top": start 0, duration 2, trim [0,2) → phát mid 0–2.
 * Suy ra top nguyên vẹn phát lá ở nguồn 3–5 (đỏ rồi xanh lá).
 *
 * CASE (mỗi spec render độc lập qua render.js, render tự làm phẳng nested):
 *  R1. Top nguyên vẹn (duration 2): frame t=0.3 → nguồn 3.3 ĐỎ,
 *      frame t=1.7 → nguồn 4.7 XANH LÁ.
 *  R2. Nửa PHẢI sau khi store split top tại t=1 (trim [1,2), duration 1,
 *      rebase start về 0 chỉ để render độc lập — trim mới là thứ được
 *      kiểm chứng): toàn bộ nguồn 4–5 → frame 0.2 và 0.8 đều XANH LÁ.
 *      Nếu split chỉ rút duration mà không dời trim (lỗi cũ của trim
 *      generic) thì nửa này sẽ phát nguồn 3–4 (đỏ) và test rớt.
 *  R3. Top sau khi store trim trái 0.5 (trim [0.5,2), duration 1.5,
 *      rebase start về 0): frame t=0.2 → nguồn 3.7 ĐỎ, frame t=1.3 →
 *      nguồn 4.8 XANH LÁ; duration ≈ 1.5s.
 *
 * Màu: "green" của FFmpeg là (0,128,0) nên ngưỡng xanh lá là G > 100
 * (kinh nghiệm T4). Mỗi spec còn kiểm tra duration video qua ffprobe.
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-h2deep-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }
function ff(args) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);
}
function ffProbe(file) {
  const out = execFileSync("ffprobe", ["-v", "quiet", "-print_format", "json",
    "-show_streams", "-show_format", file], { encoding: "utf8" });
  return JSON.parse(out);
}

function renderSpec(spec, outName) {
  const specPath = path.join(WORK, `spec-${outName}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(WORK, `${outName}.mp4`);
  const r = spawnSync(process.execPath, [
    path.join(HERE, "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
    "--crf", "28", "--x264-preset", "ultrafast", "-y", "-q",
  ], { encoding: "utf8" });
  return { ok: r.status === 0, code: r.status, stderr: (r.stderr || "") + (r.stdout || ""), outPath };
}

/** Đọc 1 frame tại t giây, trả về { r, g, b } trung bình (PPM P6, mẫu T4). */
function frameMeanRGB(file, t) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error",
    "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "image2pipe",
    "-vcodec", "ppm", "-"]);
  let i = 0;
  const readToken = () => {
    while (buf[i] === 0x0a || buf[i] === 0x20 || buf[i] === 0x23) {
      if (buf[i] === 0x23) while (buf[i] !== 0x0a) i++;
      else i++;
    }
    let s = "";
    while (buf[i] !== 0x0a && buf[i] !== 0x20) s += String.fromCharCode(buf[i++]);
    return s;
  };
  const magic = readToken();
  const w = parseInt(readToken(), 10);
  const h = parseInt(readToken(), 10);
  readToken(); // maxval
  i++; // 1 byte whitespace sau maxval
  if (magic !== "P6" || !w || !h) throw new Error(`PPM parse lỗi: ${magic} ${w}x${h}`);
  let r = 0, g = 0, b = 0;
  const n = w * h;
  for (let p = 0; p < n; p++) {
    r += buf[i + p * 3]; g += buf[i + p * 3 + 1]; b += buf[i + p * 3 + 2];
  }
  return { r: r / n, g: g / n, b: b / n };
}

const isRed = (f) => f.r > 150 && f.g < 100;
const isGreen = (f) => f.g > 100 && f.r < 100 && f.g > f.b;

// ===========================================================================
// Chuẩn bị media: đỏ 0–4s + xanh lá 4–8s (64×64, 30fps)
// ===========================================================================
console.log("== Chuẩn bị media ==");
ff(["-f", "lavfi", "-i", "color=c=red:s=64x64:r=30:d=4",
    "-f", "lavfi", "-i", "color=c=green:s=64x64:r=30:d=4",
    "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", path.join(MEDIA, "src.mp4")]);
ok("media đã tạo", fs.existsSync(path.join(MEDIA, "src.mp4")));

// ===========================================================================
// Fixture 3 cấp (số ghi cứng, suy tay — xem header)
// ===========================================================================
function leaf() {
  return { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 8, in: 0, out: 8 };
}
function inner() {
  return { kind: "nested", id: "in", start: 0, duration: 4, speed: 1,
    trim: { in: 2, out: 6 },
    subSpec: { version: "0.2.0",
      meta: { name: "sub", width: 64, height: 64, fps: 30 },
      tracks: [{ id: "v-in", kind: "video", clips: [leaf()] }] } };
}
function mid() {
  return { kind: "nested", id: "mid", start: 0, duration: 2, speed: 1,
    trim: { in: 1, out: 3 },
    subSpec: { version: "0.2.0",
      meta: { name: "sub", width: 64, height: 64, fps: 30 },
      tracks: [{ id: "v-mid", kind: "video", clips: [inner()] }] } };
}
function topWith(start, duration, trim) {
  return { kind: "nested", id: "top", start, duration, speed: 1, trim,
    subSpec: { version: "0.2.0",
      meta: { name: "sub", width: 64, height: 64, fps: 30 },
      tracks: [{ id: "v-top", kind: "video", clips: [mid()] }] } };
}
function specOf(top) {
  return {
    version: "0.2.0",
    meta: { name: "H2 deep render test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  };
}

// ===========================================================================
// R1. Top nguyên vẹn: nguồn 3–5 (đỏ → xanh lá)
// ===========================================================================
console.log("== R1. Top nguyên vẹn ==");
{
  const r = renderSpec(specOf(topWith(0, 2, { in: 0, out: 2 })), "full");
  ok("R1 render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("R1 duration video ≈ 2s", approx(parseFloat(v.duration), 2, 0.15), `nhận ${v.duration}`);
    const f03 = frameMeanRGB(r.outPath, 0.3);
    const f17 = frameMeanRGB(r.outPath, 1.7);
    ok("R1 frame t=0.3 đỏ (nguồn ≈ 3.3)", isRed(f03), JSON.stringify(f03));
    ok("R1 frame t=1.7 xanh lá (nguồn ≈ 4.7)", isGreen(f17), JSON.stringify(f17));
  }
}

// ===========================================================================
// R2. Nửa phải sau split (trim [1,2), duration 1): toàn xanh lá
// ===========================================================================
console.log("== R2. Nửa phải sau split ==");
{
  const r = renderSpec(specOf(topWith(0, 1, { in: 1, out: 2 })), "right");
  ok("R2 render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("R2 duration video ≈ 1s", approx(parseFloat(v.duration), 1, 0.15), `nhận ${v.duration}`);
    const f02 = frameMeanRGB(r.outPath, 0.2);
    const f08 = frameMeanRGB(r.outPath, 0.8);
    ok("R2 frame t=0.2 xanh lá (nguồn ≈ 4.2)", isGreen(f02), JSON.stringify(f02));
    ok("R2 frame t=0.8 xanh lá (nguồn ≈ 4.8)", isGreen(f08), JSON.stringify(f08));
  }
}

// ===========================================================================
// R3. Top sau trim trái 0.5 (trim [0.5,2), duration 1.5): đỏ → xanh lá
// ===========================================================================
console.log("== R3. Top sau trim trái ==");
{
  const r = renderSpec(specOf(topWith(0, 1.5, { in: 0.5, out: 2 })), "trimmed");
  ok("R3 render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("R3 duration video ≈ 1.5s", approx(parseFloat(v.duration), 1.5, 0.15), `nhận ${v.duration}`);
    const f02 = frameMeanRGB(r.outPath, 0.2);
    const f13 = frameMeanRGB(r.outPath, 1.3);
    ok("R3 frame t=0.2 đỏ (nguồn ≈ 3.7)", isRed(f02), JSON.stringify(f02));
    ok("R3 frame t=1.3 xanh lá (nguồn ≈ 4.8)", isGreen(f13), JSON.stringify(f13));
  }
}

console.log(`\n${pass}/${pass + fail} check pass, ${fail} fail. tmp=${WORK}`);
if (fail === 0) fs.rmSync(WORK, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);
