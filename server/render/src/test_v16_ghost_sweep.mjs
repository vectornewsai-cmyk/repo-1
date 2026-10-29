#!/usr/bin/env node
/**
 * test_v16_ghost_sweep.mjs — Phase 9 đợt 16, luồng H4: quét ghost frames 2..8.
 *
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG binary, KHÔNG dist.
 * CHỈ đo: render tmix thật + raster preview từ code thật (motionBlurBlendPlan).
 *
 * Chạy từ gốc repo:
 *   node --experimental-strip-types server/render/src/test_v16_ghost_sweep.mjs
 * Exit 0 khi mọi cell render xong (kể cả cell dưới ngưỡng); 2 khi lỗi harness.
 *
 * Thiết kế (nối tiếp V15 §6, không copy số V15):
 * - Nguồn động duy nhất: testsrc2 (natA của V15), fps 30.
 * - Cell = (độ phân giải × mode × frames N × bộ weights).
 *   Mode: "yuv" = tmix trên yuv420p thật (gần product) rồi về rgb24 để
 *   bắt frame; "rgb" = tmix trên rgb24 (đối chứng mô hình thuần).
 * - Bộ weights:
 *   (a) "v15" chỉ cho N=3: [0.2, 0.3, 0.5] — NEO ĐỐI CHIẾU, phải tái
 *       tạo gần đúng số V15 (1080p yuv MAD ~0.0535, rgb ~0.0057). Nếu
 *       neo lệch xa thì phương pháp đo đã đổi, không được tin sweep.
 *   (b) "uniform": w_i = 1/N — mặc định product khi weights vắng
 *       (motion.js: Array(frames).fill(1) → tmix chuẩn hoá).
 *   (c) "ramp": w_i = (i+1)/sum(1..N), cũ nhất nhẹ nhất — khái quát hoá
 *       dạng bất đối xứng tăng dần của V15 sang mọi N.
 * - Cửa sổ đo: ends 46, 47; tmix outputs 45..48. Diagonal = (end==k):
 *   tmix output k phải bằng blend của đúng cửa sổ kết thúc ở k. Báo
 *   MAD diagonal tốt nhất + MAD off-diagonal tốt nhất; tier MATCHED
 *   theo thang V6/V11/V12 (MAD ≤ 2 và le8 ≥ 99%) áp cho diagonal.
 *   Nguồn frame 39..47 trích một lần mỗi độ phân giải (1 lần chạy
 *   ffmpeg, chỉ giữ frame đích) rồi dùng chung mọi N/weights/mode.
 * - Preview blend: chuỗi source-over theo motionBlurBlendPlan THẬT
 *   (previewEngine.ts), giống blendFrames của V15 — không copy công thức.
 */
import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { motionBlurBlendPlan } from
  "../../../apps/web/src/lib/previewEngine.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const FPS = 30;

function log(...a) { console.log(...a); }
function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
}

/** Chạy ffmpeg, ghi rawvideo rgb24 ra stdout; chỉ giữ các frame đích. */
function grabFrames(ffmpegArgs, targets, W, H) {
  const frameBytes = W * H * 3;
  const bufs = new Map(targets.map((f) => [f, Buffer.alloc(frameBytes)]));
  return new Promise((resolve, reject) => {
    let pos = 0;
    let err = "";
    const proc = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", ...ffmpegArgs,
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { stdio: ["ignore", "pipe", "pipe"] });
    proc.stderr.on("data", (d) => { err += d; });
    proc.stdout.on("data", (chunk) => {
      let off = 0;
      while (off < chunk.length) {
        const frameIdx = Math.floor(pos / frameBytes);
        const frameOff = pos % frameBytes;
        const take = Math.min(chunk.length - off, frameBytes - frameOff);
        const buf = bufs.get(frameIdx);
        if (buf) chunk.copy(buf, frameOff, off, off + take);
        off += take;
        pos += take;
      }
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve(bufs);
      else reject(new Error(`ffmpeg exit ${code}: ${err.slice(0, 600)}`));
    });
  });
}

const lavfiNat = (W, H) => `testsrc2=size=${W}x${H}:rate=${FPS}`;

function compare(render, previewBuf, W, H) {
  let sum = 0;
  let le8 = 0;
  const total = W * H;
  for (let i = 0; i < total; i++) {
    const o = i * 3;
    let mx = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(render[o + c] - previewBuf[o + c]);
      sum += d;
      if (d > mx) mx = d;
    }
    if (mx <= 8) le8++;
  }
  const mad = sum / (total * 3);
  return { mad, le8: (le8 / total) * 100, tier: mad <= 2 && le8 / total * 100 >= 99 ? "MATCHED" : "DUOI-NGUONG" };
}

/** Blend preview từ code thật: plan source-over của motionBlurBlendPlan. */
function blendFrames(framesOldToNew, weights) {
  const plan = motionBlurBlendPlan(weights, weights.length - 1);
  if (plan.length !== framesOldToNew.length) {
    throw new Error(`plan dài ${plan.length} khác frames ${framesOldToNew.length}`);
  }
  const n = framesOldToNew[0].length;
  const out = new Float64Array(n);
  for (let f = 0; f < framesOldToNew.length; f++) {
    const a = plan[f].blendAlpha;
    const src = framesOldToNew[f];
    if (f === 0) { for (let i = 0; i < n; i++) out[i] = src[i]; }
    else { for (let i = 0; i < n; i++) out[i] = a * src[i] + (1 - a) * out[i]; }
  }
  const buf = Buffer.alloc(n);
  for (let i = 0; i < n; i++) buf[i] = Math.round(out[i]);
  return buf;
}

const weightSets = (N) => {
  const sets = [];
  if (N === 3) sets.push(["v15", [0.2, 0.3, 0.5]]);
  sets.push(["uniform", Array.from({ length: N }, () => 1 / N)]);
  const s = (N * (N + 1)) / 2;
  sets.push(["ramp", Array.from({ length: N }, (_, i) => (i + 1) / s)]);
  return sets;
};

async function main() {
  const cpu = os.cpus()[0];
  const ffver = runCapture("ffmpeg", ["-version"]).split("\n")[0];
  log(`MACHINE cpu=${cpu.model} x${os.cpus().length} mem=${(os.totalmem() / 2 ** 30).toFixed(1)}GiB ffmpeg=${ffver}`);
  log(`ROOT=${ROOT}`);
  const ENDS = [46, 47];
  const OUTS = [45, 46, 47, 48];
  for (const [W, H] of [[1280, 720], [1920, 1080]]) {
    // Trích nguồn 39..47 một lần (testsrc2, rgb24).
    const src = await grabFrames(
      ["-f", "lavfi", "-i", lavfiNat(W, H), "-vf", "format=rgb24", "-frames:v", "48"],
      [39, 40, 41, 42, 43, 44, 45, 46, 47], W, H);
    log(`\n== GHOST-SWEEP ${W}x${H} (nguon frames 39..47 san) ==`);
    for (const mode of ["yuv", "rgb"]) {
      const inFmt = mode === "yuv" ? "yuv420p" : "rgb24";
      const tail = mode === "yuv" ? ",format=rgb24" : "";
      for (let N = 2; N <= 8; N++) {
        for (const [wname, weights] of weightSets(N)) {
          const wStr = weights.map((w) => String(Math.round(w * 1e6) / 1e6)).join(" ");
          const graph = `[0:v]format=${inFmt},tmix=frames=${N}:weights=${wStr}${tail}[out]`;
          const outs = await grabFrames(
            ["-f", "lavfi", "-i", lavfiNat(W, H), "-filter_complex", graph,
             "-map", "[out]", "-frames:v", "49"], OUTS, W, H);
          let bestDiag = null;
          let bestOff = null;
          for (const end of ENDS) {
            const win = [];
            for (let i = N - 1; i >= 0; i--) win.push(src.get(end - i));
            const blend = blendFrames(win, weights);
            for (const k of OUTS) {
              const r = compare(outs.get(k), blend, W, H);
              const rec = { end, k, ...r };
              if (end === k) { if (!bestDiag || r.mad < bestDiag.mad) bestDiag = rec; }
              else { if (!bestOff || r.mad < bestOff.mad) bestOff = rec; }
            }
          }
          log(`CELL ${W}x${H} tmix-${mode} frames=${N} w=${wname} DIAG winEnd=${bestDiag.end}/out=${bestDiag.k} MAD=${bestDiag.mad.toFixed(4)} le8=${bestDiag.le8.toFixed(3)}% tier=${bestDiag.tier} | bestOFF winEnd=${bestOff.end}/out=${bestOff.k} MAD=${bestOff.mad.toFixed(4)} le8=${bestOff.le8.toFixed(3)}%`);
        }
      }
    }
  }
  log("\nDONE v16-ghost-sweep");
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
