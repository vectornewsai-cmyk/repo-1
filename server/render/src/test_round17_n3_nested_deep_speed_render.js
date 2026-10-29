#!/usr/bin/env node
/**
 * test_round17_n3_nested_deep_speed_render.js — Kiểm chứng render MP4 THẬT
 * cho nested sâu đã ĐỔI SPEED (Phase 9 đợt 17, luồng N3; đóng nợ đợt 16:
 * "chưa đo với speed khác 1 ở tầng render").
 *
 * Chạy: node server/render/src/test_round17_n3_nested_deep_speed_render.js
 * Media test nhỏ (64×64) trong thư mục tạm /tmp, dọn khi pass hết.
 * File này CHỈ GỌI render.js, không sửa render.js hay harness nào.
 *
 * TÍNH ĐỘC LẬP (tránh kiểm chứng vòng tròn — cùng triết lý H2): các con
 * số dưới đây suy bằng tay từ công thức flattenInto của nested.js
 * (start' = S + (vs − in) / speed; speed' = speed_gốc × speed tổ tiên),
 * rồi ghi cứng — không lấy từ code patchClip/deep đang test.
 *
 * Nguồn: đỏ 0–4s, xanh lá 4–8s (64×64, 30fps, cùng nguồn với test H2).
 * Màu: "green" của FFmpeg là (0,128,0) nên ngưỡng xanh lá là G > 100.
 *
 * CASE A — top đổi speed qua patchClip (1 → 2), fixture S của H2:
 * - Lá L: [0,8) in 0–8. Inner "in": [0,4) trim [2,6) speed 1.
 * - Mid "mid": [0,2) trim [1,3) speed 1.
 * - Top: start 0, trim [0,2) KHÔNG ĐỔI, speed 2 → duration = 2/2 = 1
 *   (đây chính là duration mà patchClip N3 tính lại; trước N3 duration
 *   vẫn là 2 trong khi speed đã là 2, phá bất biến).
 * Suy tay ánh xạ thời gian output t → nguồn lá: t → mid 2t → inner
 * 1+2t → lá 3+2t. Vậy frame t=0.2 → nguồn 3.4 ĐỎ; t=0.8 → nguồn 4.6
 * XANH LÁ; duration video ≈ 1s.
 *
 * CASE B — lá sâu đổi speed qua deep action (1 → 2), fixture D của N3:
 * - Lá L2: [0,4) in 0–8 speed 2 (sau deep patch: duration 8 → 4, out
 *   giữ nguyên 8). Anh em S2: [4,8) in 0–4 speed 1 (giữ nguồn inner 8s).
 * - Inner [0,8) trim [0,8), mid [0,8) trim [0,8), top [0,8) trim [0,8),
 *   đều speed 1 → top duration 8.
 * Suy tay: nửa đầu output [0,4) là L2, nguồn = 2t: t=0.2 → 0.4 ĐỎ;
 * t=2.1 → 4.2 XANH LÁ; t=3.9 → 7.8 XANH LÁ. Nửa sau [4,8) là S2
 * (nguồn 0–4 toàn đỏ): t=6 → ĐỎ. Duration video ≈ 8s. Nếu deep patch
 * không đổi duration lá (lỗi cũ: lá vẫn dài 8s đè S2) thì render đã
 * khác hẳn ở nửa sau — case này bắt đúng lỗi đó.
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-n3deep-"));
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

/** Đọc 1 frame tại t giây, trả về { r, g, b } trung bình (PPM P6, mẫu H2). */
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

function subSpec(clips, trackId) {
  return { version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: [{ id: trackId, kind: "video", clips }] };
}
function specOf(top) {
  return {
    version: "0.2.0",
    meta: { name: "N3 deep speed render test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  };
}

// ===========================================================================
// CASE A. Top speed 2 sau patchClip (fixture S, top duration 1)
// ===========================================================================
console.log("== A. Top speed 2 (patchClip N3) ==");
{
  const leaf = { kind: "video", id: "L", src: "src.mp4", start: 0, duration: 8, in: 0, out: 8 };
  const inner = { kind: "nested", id: "in", start: 0, duration: 4, speed: 1,
    trim: { in: 2, out: 6 }, subSpec: subSpec([leaf], "v-in") };
  const mid = { kind: "nested", id: "mid", start: 0, duration: 2, speed: 1,
    trim: { in: 1, out: 3 }, subSpec: subSpec([inner], "v-mid") };
  const top = { kind: "nested", id: "top", start: 0, duration: 1, speed: 2,
    trim: { in: 0, out: 2 }, subSpec: subSpec([mid], "v-top") };
  const r = renderSpec(specOf(top), "topSpeed2");
  ok("A render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("A duration video ≈ 1s", approx(parseFloat(v.duration), 1, 0.15), `nhận ${v.duration}`);
    const f02 = frameMeanRGB(r.outPath, 0.2);
    const f08 = frameMeanRGB(r.outPath, 0.8);
    ok("A frame t=0.2 đỏ (nguồn ≈ 3.4)", isRed(f02), JSON.stringify(f02));
    ok("A frame t=0.8 xanh lá (nguồn ≈ 4.6)", isGreen(f08), JSON.stringify(f08));
  }
}

// ===========================================================================
// CASE B. Lá sâu speed 2 sau deep patch (fixture D, top duration 8)
// ===========================================================================
console.log("== B. Lá sâu speed 2 (deep patch N3) ==");
{
  const leaf = { kind: "video", id: "L2", src: "src.mp4", start: 0, duration: 4, in: 0, out: 8, speed: 2 };
  const sib = { kind: "video", id: "S2", src: "src.mp4", start: 4, duration: 4, in: 0, out: 4 };
  const inner = { kind: "nested", id: "in", start: 0, duration: 8, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([leaf, sib], "v-in") };
  const mid = { kind: "nested", id: "mid", start: 0, duration: 8, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([inner], "v-mid") };
  const top = { kind: "nested", id: "top", start: 0, duration: 8, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([mid], "v-top") };
  const r = renderSpec(specOf(top), "leafSpeed2");
  ok("B render ok", r.ok, r.stderr.slice(-300));
  if (r.ok) {
    const probe = ffProbe(r.outPath);
    const v = probe.streams.find((s) => s.codec_type === "video");
    ok("B duration video ≈ 8s", approx(parseFloat(v.duration), 8, 0.3), `nhận ${v.duration}`);
    const f02 = frameMeanRGB(r.outPath, 0.2);
    const f21 = frameMeanRGB(r.outPath, 2.1);
    const f39 = frameMeanRGB(r.outPath, 3.9);
    const f60 = frameMeanRGB(r.outPath, 6);
    ok("B frame t=0.2 đỏ (lá nguồn ≈ 0.4)", isRed(f02), JSON.stringify(f02));
    ok("B frame t=2.1 xanh lá (lá nguồn ≈ 4.2)", isGreen(f21), JSON.stringify(f21));
    ok("B frame t=3.9 xanh lá (lá nguồn ≈ 7.8)", isGreen(f39), JSON.stringify(f39));
    ok("B frame t=6 đỏ (anh em S2 nguồn 0–4)", isRed(f60), JSON.stringify(f60));
  }
}

console.log(`\n${pass}/${pass + fail} check pass, ${fail} fail. tmp=${WORK}`);
if (fail === 0) fs.rmSync(WORK, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);
