#!/usr/bin/env node
/**
 * parity-62r8-compare.mjs — Phase 9 đợt 62, luồng R8 (b): đối chiếu snapshot
 * preview headed (r8-preview-snaps.json) với frame render FFmpeg thật.
 *
 * Chạy SAU parity-62r8-sharpen-noise-headed.mjs (từ gốc repo):
 *   node apps/web/scripts/parity-62r8-compare.mjs
 *
 * Với mỗi variant (plain, sharp05, sharp10, noise05, noise10):
 *  1. Render spec bằng render worker thật (libx264, CRF 18).
 *  2. Lấy đúng frame 30 (playhead 1.0s @30fps) bằng select='eq(n,30)'.
 *  3. Downscale bilinear về đúng kích thước vùng video trong canvas
 *     preview (preview vẽ effect ở 1280×720 rồi drawImage xuống viewport).
 *  4. So trên cùng lưới mẫu step-4 của snapshot (chỉ điểm trong vùng video):
 *     - plain: MAD/le8/le32 preview↔render (sàn sai số chuỗi đo).
 *     - sharpen: thêm MAD của DELTA (preview_sharp−preview_plain so với
 *       render_sharp−render_plain) — triệt tiêu YUV/CRF chung.
 *     - noise: thống kê delta (std/kurtosis/corr từng kênh) preview vs
 *       render — nhiễu 2 bên là 2 dãy ngẫu nhiên độc lập nên không so
 *       từng pixel (tiêu chí parity test Node đợt 16 H5).
 *
 * Tiêu chí (V6/V14): KHỚP = MAD <= 2 và >= 99% pixel lệch <= 8;
 * XẤP XỈ = MAD <= 20 và >= 90% pixel lệch <= 32. Noise: tỉ lệ std
 * [0.8, 1.25], |corr| <= 0.1, kurtosis [-0.6, 0.6].
 * Exit 0 khi mọi variant đo xong có verdict; 1 có variant lỗi đo; 2 harness lỗi.
 * KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round62-r8");
const SCRATCH = path.join(GOAL, "headed");
const MEDIA_DIR = path.join(GOAL, "media");
const RENDER_DIR = path.join(GOAL, "render");
const RENDER_JS = path.join(ROOT, "server", "render", "src", "render.js");

const VARIANTS = ["plain", "sharp05", "sharp10", "noise05", "noise10"];

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại (exit ${r.status}): ${(r.stderr || r.stdout || "").slice(0, 500)}`);
  return r;
}

function renderVariant(v) {
  const spec = path.join(RENDER_DIR, `spec-${v}.json`);
  const out = path.join(RENDER_DIR, `render-${v}.mp4`);
  if (!fs.existsSync(spec)) throw new Error(`thiếu spec ${spec} — chạy headed script trước`);
  run(process.execPath, [RENDER_JS, "--spec", spec, "--out", out, "--media-dir", MEDIA_DIR, "--crf", "18", "--x264-preset", "veryfast", "-y"], `render ${v}`);
  const probe = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-show_entries", "stream=codec_name,width,height,avg_frame_rate", "-of", "json", out], `ffprobe ${v}`);
  const info = JSON.parse(probe.stdout);
  return { out, duration: Number(info.format?.duration ?? NaN), width: info.streams?.[0]?.width, height: info.streams?.[0]?.height };
}

function extractFrame(mp4, vw, vh, rawPath) {
  // Ép ma trận màu bt709 cả 2 đầu: nguồn testsrc2 không tag color_space
  // nên scale mặc định dùng bt601, trong khi trình duyệt decode video HD
  // bằng bt709 — sai ma trận này một mình đã gây MAD 9.22 ở đối chứng
  // plain (chẩn đoán /tmp/r62-r8-diag.mjs: bt709 → MAD 1.304).
  run("ffmpeg", ["-v", "error", "-y", "-i", mp4,
    "-vf", `select='eq(n,30)',scale=${vw}:${vh}:flags=bilinear:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", rawPath], `extract frame ${mp4}`);
  const buf = fs.readFileSync(rawPath);
  if (buf.length !== vw * vh * 3) throw new Error(`frame raw sai kích thước: ${buf.length} != ${vw * vh * 3}`);
  return buf;
}

function gridPoints(snap) {
  const cols = Math.ceil(snap.w / snap.step);
  const pts = [];
  for (let i = 0; i < snap.n; i++) {
    const x = (i % cols) * snap.step;
    const y = Math.floor(i / cols) * snap.step;
    pts.push({ i, x, y });
  }
  return pts;
}

function compareSamples(preview, renderBuf, vw, vh, rect) {
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const pts = gridPoints(preview).filter((p) => p.x >= vx0 && p.x < vx0 + vw && p.y >= vy0 && p.y < vy0 + vh);
  let sum = 0, le8 = 0, le32 = 0;
  const diffs = [];
  for (const p of pts) {
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(preview.data[pi + c] - renderBuf[ri + c]);
      sum += d;
      diffs.push(preview.data[pi + c] - renderBuf[ri + c]);
      if (d > dmax) dmax = d;
    }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  const n = pts.length;
  return { n, mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4), diffs };
}

function deltaStats(previewA, previewB, renderA, renderB, vw, vh, rect) {
  // delta = B − A trên cùng lưới (A=plain, B=effect). Trả thống kê delta 2 bên.
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const pts = gridPoints(previewA).filter((p) => p.x >= vx0 && p.x < vx0 + vw && p.y >= vy0 && p.y < vy0 + vh);
  const dP = [], dR = [];
  let sumAbs = 0, le8 = 0, le32 = 0;
  for (const p of pts) {
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const dp = previewB.data[pi + c] - previewA.data[pi + c];
      const dr = renderB[ri + c] - renderA[ri + c];
      dP.push(dp); dR.push(dr);
      const d = Math.abs(dp - dr);
      sumAbs += d;
      if (d > dmax) dmax = d;
    }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  const n = pts.length;
  return {
    n,
    deltaMad: +(sumAbs / (n * 3)).toFixed(3),
    deltaLe8: +(le8 / n).toFixed(4),
    deltaLe32: +(le32 / n).toFixed(4),
    preview: channelStats(dP),
    render: channelStats(dR),
  };
}

function channelStats(d) {
  // d: mảng lệch (đã trừ base), xen kẽ R,G,B.
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let i = c; i < d.length; i += 3) s += d[i];
    mean[c] = s / n;
  }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) {
      const v = d[i] - mean[c];
      s2 += v * v; s4 += v * v * v * v;
    }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(+(s4 / n / (std ** 4) - 3).toFixed(2));
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(+(s / n / (out.std[a] * out.std[b])).toFixed(3));
  }
  return out;
}

function verdictMad(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}

async function main() {
  const snapsPath = path.join(SCRATCH, "r8-preview-snaps.json");
  if (!fs.existsSync(snapsPath)) {
    console.error(`BLOCKER: thiếu ${snapsPath} — chạy headed script trước`);
    process.exitCode = 2;
    return;
  }
  const snaps = JSON.parse(fs.readFileSync(snapsPath, "utf8"));
  const plain = snaps.plain;
  if (!plain?.ok) { console.error("BLOCKER: snapshot plain thiếu/không ok"); process.exitCode = 2; return; }
  const rect = plain.rect;
  const vw = Math.round(rect.w), vh = Math.round(rect.h);
  console.log(`canvas preview ${plain.w}x${plain.h}, vùng video ${vw}x${vh} @(${Math.round(rect.x)},${Math.round(rect.y)}) scale=${rect.scale.toFixed(4)}`);

  const frames = {};
  const report = { canvas: { w: plain.w, h: plain.h }, videoRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: vw, h: vh, scale: rect.scale }, variants: {} };
  let failCount = 0;
  for (const v of VARIANTS) {
    try {
      const meta = renderVariant(v);
      console.log(`render ${v}: ${meta.out} (${meta.width}x${meta.height}, ${meta.duration}s)`);
      const rawPath = path.join(RENDER_DIR, `frame-${v}.raw`);
      frames[v] = extractFrame(meta.out, vw, vh, rawPath);
      const m = compareSamples(snaps[v], frames[v], vw, vh, rect);
      const verdict = verdictMad(m);
      report.variants[v] = { absolute: { ...m, verdict, diffs: undefined } };
      delete report.variants[v].absolute.diffs;
      console.log(`  ${v}: preview↔render MAD=${m.mad} <=8=${(m.le8 * 100).toFixed(1)}% <=32=${(m.le32 * 100).toFixed(1)}% (n=${m.n}) → ${verdict}`);
    } catch (e) {
      console.error(`  ✗ ${v}: ${e.message}`);
      report.variants[v] = { error: e.message };
      failCount++;
    }
  }
  // Delta sharpen.
  for (const v of ["sharp05", "sharp10"]) {
    if (!frames.plain || !frames[v] || !snaps[v]) continue;
    const d = deltaStats(snaps.plain, snaps[v], frames.plain, frames[v], vw, vh, rect);
    const verdict = verdictMad({ mad: d.deltaMad, le8: d.deltaLe8, le32: d.deltaLe32 });
    report.variants[v].delta = {
      mad: d.deltaMad, le8: d.deltaLe8, le32: d.deltaLe32, verdict,
      previewStd: d.preview.std, renderStd: d.render.std,
    };
    console.log(`  ${v} DELTA: MAD=${d.deltaMad} <=8=${(d.deltaLe8 * 100).toFixed(1)}% <=32=${(d.deltaLe32 * 100).toFixed(1)}% → ${verdict}; std preview [${d.preview.std}] render [${d.render.std}]`);
  }
  // Delta noise: thống kê.
  for (const v of ["noise05", "noise10"]) {
    if (!frames.plain || !frames[v] || !snaps[v]) continue;
    const d = deltaStats(snaps.plain, snaps[v], frames.plain, frames[v], vw, vh, rect);
    const ratios = d.render.std.map((s, i) => +(d.preview.std[i] / s).toFixed(2));
    const okStd = ratios.every((r) => r >= 0.8 && r <= 1.25);
    const okCorr = d.preview.corr.every((c) => Math.abs(c) <= 0.1) && d.render.corr.every((c) => Math.abs(c) <= 0.1);
    const okKurt = [...d.preview.kurt, ...d.render.kurt].every((k) => k >= -0.6 && k <= 0.6);
    const verdict = okStd && okCorr && okKurt ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ";
    report.variants[v].deltaStats = {
      previewStd: d.preview.std, renderStd: d.render.std, stdRatio: ratios,
      previewKurt: d.preview.kurt, renderKurt: d.render.kurt,
      previewCorr: d.preview.corr, renderCorr: d.render.corr,
      deltaMad: d.deltaMad, verdict,
    };
    console.log(`  ${v} NOISE-THỐNG-KÊ: std preview [${d.preview.std}] render [${d.render.std}] tỉ lệ [${ratios}] (cần [0.8,1.25]: ${okStd}); kurt preview [${d.preview.kurt}] render [${d.render.kurt}] (${okKurt}); corr preview [${d.preview.corr}] render [${d.render.corr}] (${okCorr}); MAD delta từng pixel=${d.deltaMad} (kỳ vọng LỚN — 2 dãy ngẫu nhiên độc lập, không phải tiêu chí) → ${verdict}`);
  }
  fs.writeFileSync(path.join(SCRATCH, "r8-compare-report.json"), JSON.stringify(report, null, 2));
  console.log(`JSON kết quả: ${path.join(SCRATCH, "r8-compare-report.json")}`);
  process.exitCode = failCount ? 1 : 0;
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e instanceof Error ? e.stack || e.message : e}`);
  process.exitCode = 2;
});
