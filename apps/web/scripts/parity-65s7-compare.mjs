#!/usr/bin/env node
/**
 * parity-65s7-compare.mjs — Phase 9 đợt 65, luồng S7: đối chiếu snapshot
 * preview headed (r65-preview-snaps.json) với frame render FFmpeg thật
 * ở 3 đích (để TÁCH lỗi mô phỏng khỏi lỗi encoder/resampler):
 *   (a) pre-encode: đúng chuỗi filter render.js (trim/setpts/scale/pad/
 *       setsar/fps=30/format=yuv420p,<effect>), xuất rawvideo yuv420p,
 *       KHÔNG qua codec — đo lõi mô hình preview (noise N3, sharpen S7).
 *   (b) CRF 0: tái dùng render R64 R9 (render-{v}-veryfast-crf0.mp4,
 *       spec R65 ≡ R63 đã verify byte-identical nên tái dùng hợp lệ).
 *   (c) CRF 18: tái dùng render R64 R9 (render-{v}-veryfast-crf18.mp4).
 * Mỗi đích × 2 scaler về viewport (bilinear, lanczos) — preview
 * drawImage với imageSmoothingQuality="high" (Chrome dùng lọc chất
 * lượng cao, gần lanczos hơn bilinear; R64 R9 phân rã resampler
 * bilinear→lanczos = 1.44×).
 *
 * Chạy SAU parity-65s7-rail-clamp-headed.mjs (từ gốc repo):
 *   node apps/web/scripts/parity-65s7-compare.mjs
 * Với mỗi variant (plain, sharp05, sharp10, noise05, noise10):
 *   - plain: MAD/le8/le32 preview↔render (sàn sai số chuỗi đo).
 *   - sharpen: thêm MAD của DELTA (preview_sharp−preview_plain so với
 *     render_sharp−render_plain) — triệt tiêu YUV/CRF chung.
 *   - noise: thống kê delta (std/kurtosis/corr từng kênh) preview vs
 *     render — tiêu chí parity test Node đợt 63 R8: tỉ lệ std [0.85,
 *     1.18], |Δkurt| ≤ 0.35, |Δcorr| ≤ 0.12.
 * Tiêu chí (V6/V14): KHỚP = MAD <= 2 và >= 99% pixel lệch <= 8;
 * XẤP XỈ = MAD <= 20 và >= 90% pixel lệch <= 32.
 * Exit 0 khi mọi variant đo xong có verdict; 1 có variant lỗi đo; 2 harness lỗi.
 * KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round65-s7");
const GOAL64 = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round64-r9");
const SCRATCH = path.join(GOAL, "headed");
const MEDIA_DIR = path.join(GOAL, "media");
const RENDER_DIR = path.join(GOAL, "render");
const MEDIA = path.join(MEDIA_DIR, "test-pattern.mp4");

const VARIANTS = ["plain", "sharp05", "sharp10", "noise05", "noise10"];
const EFFECT = {
  plain: "",
  sharp05: ",unsharp=5:5:1.1:5:5:0",
  sharp10: ",unsharp=5:5:2:5:5:0",
  noise05: ",noise=alls=28:allf=t",
  noise10: ",noise=alls=50:allf=t",
};
const SCALERS = ["bilinear", "lanczos"];

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại (exit ${r.status}): ${(r.stderr || r.stdout || "").slice(0, 500)}`);
  return r;
}

// (a) Pre-encode: đúng chuỗi render.js cho spec này (không motion/enh/
// chroma/color/lut/plugin/adj; W=1280 H=720 fps=30, outFormat=yuv420p).
function renderPreEncode(v) {
  const out = path.join(RENDER_DIR, `preencode-${v}.yuv`);
  if (!fs.existsSync(out)) {
    const chain =
      `[0:v]trim=start=0:end=4,setpts=PTS-STARTPTS,` +
      `scale=1280:720:force_original_aspect_ratio=decrease,` +
      `pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,` +
      `setsar=1,fps=30,format=yuv420p${EFFECT[v]}[vout]`;
    run("ffmpeg", ["-v", "error", "-y", "-i", MEDIA, "-filter_complex", chain,
      "-map", "[vout]", "-f", "rawvideo", "-pix_fmt", "yuv420p", out], `pre-encode ${v}`);
  }
  return out;
}

function extractFrameFromRaw(yuvPath, vw, vh, scaler, rawPath) {
  run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-r", "30", "-i", yuvPath,
    "-vf", `select='eq(n,30)',scale=${vw}:${vh}:flags=${scaler}:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", rawPath], `extract pre-encode ${yuvPath} ${scaler}`);
  const buf = fs.readFileSync(rawPath);
  if (buf.length !== vw * vh * 3) throw new Error(`frame raw sai kích thước: ${buf.length} != ${vw * vh * 3}`);
  return buf;
}

function extractFrameFromMp4(mp4, vw, vh, scaler, rawPath) {
  run("ffmpeg", ["-v", "error", "-y", "-i", mp4,
    "-vf", `select='eq(n,30)',scale=${vw}:${vh}:flags=${scaler}:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", rawPath], `extract frame ${mp4} ${scaler}`);
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
  for (const p of pts) {
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(preview.data[pi + c] - renderBuf[ri + c]);
      sum += d;
      if (d > dmax) dmax = d;
    }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  const n = pts.length;
  return { n, mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}

function deltaStats(previewA, previewB, renderA, renderB, vw, vh, rect) {
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
  const snapsPath = path.join(SCRATCH, "r65-preview-snaps.json");
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
  // Kiểm tra render R64 tái dùng có đủ không.
  for (const v of VARIANTS) {
    for (const crf of ["crf0", "crf18"]) {
      const p = path.join(GOAL64, `render-${v}-veryfast-${crf}.mp4`);
      if (!fs.existsSync(p)) { console.error(`BLOCKER: thiếu render R64 ${p}`); process.exitCode = 2; return; }
    }
  }

  const report = {
    canvas: { w: plain.w, h: plain.h },
    videoRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: vw, h: vh, scale: rect.scale },
    targets: ["preencode", "crf0", "crf18"],
    scalers: SCALERS,
    variants: {},
  };
  let failCount = 0;
  // frames[target][scaler][variant] = Buffer
  const frames = {};
  for (const target of ["preencode", "crf0", "crf18"]) {
    frames[target] = {};
    for (const scaler of SCALERS) {
      frames[target][scaler] = {};
      for (const v of VARIANTS) {
        try {
          const rawPath = path.join(RENDER_DIR, `frame-${target}-${scaler}-${v}.raw`);
          if (target === "preencode") {
            const yuv = renderPreEncode(v);
            frames[target][scaler][v] = extractFrameFromRaw(yuv, vw, vh, scaler, rawPath);
          } else {
            const mp4 = path.join(GOAL64, `render-${v}-veryfast-${target}.mp4`);
            frames[target][scaler][v] = extractFrameFromMp4(mp4, vw, vh, scaler, rawPath);
          }
        } catch (e) {
          console.error(`  ✗ ${target}/${scaler}/${v}: ${e.message}`);
          failCount++;
        }
      }
    }
  }

  for (const v of VARIANTS) {
    report.variants[v] = {};
    for (const target of ["preencode", "crf0", "crf18"]) {
      report.variants[v][target] = {};
      for (const scaler of SCALERS) {
        const fb = frames[target][scaler][v];
        const fp = frames[target][scaler].plain;
        if (!fb || !snaps[v]) { report.variants[v][target][scaler] = { error: "thiếu frame/snapshot" }; failCount++; continue; }
        const m = compareSamples(snaps[v], fb, vw, vh, rect);
        const verdict = verdictMad(m);
        const entry = { absolute: { ...m, verdict } };
        if (v === "sharp05" || v === "sharp10") {
          const d = deltaStats(snaps.plain, snaps[v], fp, fb, vw, vh, rect);
          const dv = verdictMad({ mad: d.deltaMad, le8: d.deltaLe8, le32: d.deltaLe32 });
          entry.delta = {
            mad: d.deltaMad, le8: d.deltaLe8, le32: d.deltaLe32, verdict: dv,
            previewStd: d.preview.std, renderStd: d.render.std,
          };
          console.log(`  ${v} ${target}/${scaler}: tuyệt đối MAD=${m.mad} le8=${(m.le8 * 100).toFixed(1)}% → ${verdict}; DELTA MAD=${d.deltaMad} le8=${(d.deltaLe8 * 100).toFixed(1)}% → ${dv}`);
        } else if (v === "noise05" || v === "noise10") {
          const d = deltaStats(snaps.plain, snaps[v], fp, fb, vw, vh, rect);
          const ratios = d.render.std.map((s, i) => +(d.preview.std[i] / s).toFixed(2));
          const okStd = ratios.every((r) => r >= 0.85 && r <= 1.18);
          const dCorr = d.preview.corr.map((c, i) => Math.abs(c - d.render.corr[i]));
          const okCorr = dCorr.every((x) => x <= 0.12);
          const dKurt = d.preview.kurt.map((k, i) => Math.abs(k - d.render.kurt[i]));
          const okKurt = dKurt.every((x) => x <= 0.35);
          const nv = okStd && okCorr && okKurt ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ";
          entry.deltaStats = {
            previewStd: d.preview.std, renderStd: d.render.std, stdRatio: ratios,
            previewKurt: d.preview.kurt, renderKurt: d.render.kurt, kurtDiff: dKurt.map((x) => +x.toFixed(3)),
            previewCorr: d.preview.corr, renderCorr: d.render.corr, corrDiff: dCorr.map((x) => +x.toFixed(3)),
            deltaMad: d.deltaMad, verdict: nv,
          };
          console.log(`  ${v} ${target}/${scaler}: tuyệt đối MAD=${m.mad} le8=${(m.le8 * 100).toFixed(1)}% → ${verdict}; NOISE std tỉ lệ [${ratios}] (cần [0.85,1.18]: ${okStd}) Δkurt [${dKurt.map((x) => x.toFixed(2))}] (≤0.35: ${okKurt}) Δcorr [${dCorr.map((x) => x.toFixed(3))}] (≤0.12: ${okCorr}) → ${nv}`);
        } else {
          console.log(`  ${v} ${target}/${scaler}: tuyệt đối MAD=${m.mad} le8=${(m.le8 * 100).toFixed(1)}% le32=${(m.le32 * 100).toFixed(1)}% → ${verdict}`);
        }
        report.variants[v][target][scaler] = entry;
      }
    }
  }
  writeFileEpermRetry(path.join(SCRATCH, "r65-compare-report.json"), JSON.stringify(report, null, 2));
  console.log(`JSON kết quả: ${path.join(SCRATCH, "r65-compare-report.json")}`);
  process.exitCode = failCount ? 1 : 0;
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e instanceof Error ? e.stack || e.message : e}`);
  process.exitCode = 2;
});
