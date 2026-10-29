#!/usr/bin/env node
/**
 * test_v16_dissolve16.mjs — Phase 9 đợt 16, luồng H4: đo dissolve ở 16-bit.
 *
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG binary, KHÔNG dist.
 * CHỈ đo: xfade thật của FFmpeg + raster preview frand từ code thật.
 *
 * Chạy từ gốc repo:
 *   node --experimental-strip-types server/render/src/test_v16_dissolve16.mjs
 * Exit 0 khi mọi cell render xong (kể cả cell dưới ngưỡng hoặc xfade
 * từ chối 16-bit — trường hợp đó được BÁO BẰNG CHỨNG, không bịa số);
 * exit 2 khi lỗi harness (không render được gì).
 *
 * Thiết kế:
 * - Timeline như V15: fps 30, duration 0.4, offset 1 → p=0.5 là frame 36.
 * - Nguồn phẳng đỏ/xanh (baseline sạch nhất cho 16-bit: không có chi
 *   tiết chroma để đổ lỗi). Mỗi đường format được đo RIÊNG trong miền
 *   của nó (rgb48le so rgb48le, yuv444p16le so yuv444p16le) để không
 *   lẫn sai số chuyển đổi miền.
 * - Preview: pixel là A hay B theo ffmpegDissolveFrand(x,y) < p (code
 *   thật, dissolveFrand.ts) — ở 16-bit, "là A" nghĩa là đúng mẫu 16-bit
 *   của A đã qua cùng chuỗi format (probe, không đoán giá trị).
 * - Thang 16-bit: MAD16 ≤ 2×257 = 514 và ≥99% pixel có lệch kênh tối đa
 *   ≤ 8×257 = 2056 ⇔ tương đương thang 8-bit của V6/V11/V12.
 * - Kiểm tra lượng tử hoá: tỉ lệ mẫu kênh đầu ra chia hết cho 257.
 *   CẢNH BÁO DIỄN GIẢI (sửa sau khi chạy, xem test_v16_dissolve16_true):
 *   nguồn phẳng lavfi color vốn là 8-bit nên khi nâng lên rgb48le nó
 *   đã là bội của 257 (đỏ = 64764 = 252×257) — đầu ra div257 = 100% ở
 *   đường rgb là HỆ QUẢ của nguồn, KHÔNG chứng minh xfade lượng tử
 *   hoá. Chỉ số div257 của script test_v16_dissolve16_true (nguồn
 *   gradient 16-bit thật, 99,6% mẫu không chia hết cho 257) mới có
 *   giá trị chẩn đoán. Đừng trích div257 của script này như bằng
 *   chứng giới hạn.
 * - Bằng chứng format negotiation: chạy xfade với -loglevel debug và
 *   trích dòng "Parsed_xfade formats" + các dòng auto_scale/format
 *   (nếu có). Không có dòng đó trong log thì ghi rõ là không thấy.
 */
import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ffmpegDissolveFrand } from
  "../../../apps/web/src/lib/dissolveFrand.ts";
import transitionsPkg from "./transitions.js";

const { buildXfadeFilter } = transitionsPkg;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const FPS = 30;
const DUR = 0.4;
const OFFSET = 1.0;
const P = 0.5;
const F = 30 + Math.round(P * 12); // 36
const W = 1280, H = 720;

function log(...a) { console.log(...a); }
function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
}

/** Chạy ffmpeg, ghi rawvideo ra stdout; chỉ giữ các frame đích (định dạng 16-bit). */
function grabFrames16(ffmpegArgs, targets, W, H, bytesPerChannel, channels) {
  const frameBytes = W * H * bytesPerChannel * channels;
  const bufs = new Map(targets.map((f) => [f, Buffer.alloc(frameBytes)]));
  return new Promise((resolve, reject) => {
    let pos = 0;
    let err = "";
    const proc = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", ...ffmpegArgs,
      "-f", "rawvideo", "-"], { stdio: ["ignore", "pipe", "pipe"] });
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

const lavfiFlat = (color) => `color=c=${color}:size=${W}x${H}:rate=${FPS}:d=3`;

/** So sánh 16-bit: render Uint16 vs preview chọn A/B (mỗi mẫu là Uint16). */
function compare16(renderBuf, getA, getB, isBFn) {
  const total = W * H;
  let sum = 0;
  let le = 0;
  let div257 = 0;
  let samples = 0;
  for (let i = 0; i < total; i++) {
    const isB = isBFn(i);
    let mx = 0;
    for (let c = 0; c < 3; c++) {
      const rv = renderBuf.readUInt16LE((i * 3 + c) * 2);
      const pv = isB ? getB(c) : getA(c);
      const d = Math.abs(rv - pv);
      sum += d;
      if (d > mx) mx = d;
      if (rv % 257 === 0) div257++;
      samples++;
    }
    if (mx <= 2056) le++;
  }
  const mad16 = sum / (total * 3);
  return {
    mad16, mad8eq: mad16 / 257,
    le8eq: (le / total) * 100,
    div257pct: (div257 / samples) * 100,
    tier: mad16 <= 514 && le / total * 100 >= 99 ? "MATCHED" : "DUOI-NGUONG",
  };
}

async function main() {
  const cpu = os.cpus()[0];
  const ffver = runCapture("ffmpeg", ["-version"]).split("\n")[0];
  log(`MACHINE cpu=${cpu.model} x${os.cpus().length} mem=${(os.totalmem() / 2 ** 30).toFixed(1)}GiB ffmpeg=${ffver}`);
  log(`ROOT=${ROOT} W=${W} H=${H} p=${P} frame=${F}`);
  const xfade = buildXfadeFilter("dissolve", DUR, OFFSET);
  log(`xfade filter (code that): ${xfade}`);

  // --- Bằng chứng negotiation: debug 1 lần cho đường rgb48le.
  const dbg = runCapture("ffmpeg", ["-hide_banner", "-loglevel", "debug", "-y",
    "-f", "lavfi", "-i", lavfiFlat("red"),
    "-f", "lavfi", "-i", lavfiFlat("blue"),
    "-filter_complex",
    `[0:v]format=rgb48le[a];[1:v]format=rgb48le[b];[a][b]${xfade},format=rgb48le[out]`,
    "-map", "[out]", "-frames:v", "1", "-f", "null", "-"]);
  const fmtLines = dbg.split("\n").filter((l) =>
    /Parsed_xfade|auto_scale|auto-inserted|format.*rgb48|pix_fmt|convert/i.test(l)).slice(0, 30);
  log(`DEBUG xfade rgb48le: ${fmtLines.length ? "" : "(KHONG thay dong negotiation nao trong log debug — ghi ro, khong ket luan)"}`);
  for (const l of fmtLines) log(`  DBG: ${l.trim().slice(0, 300)}`);
  const has16 = /16|48le|gbrp16|yuv444p16/i.test(fmtLines.join(" "));
  log(`DEBUG ket luan so bo: dong negotiation co nhac 16-bit = ${has16}`);

  // --- Đường 1: rgb48le (planar? rgb48le là packed 16-bit/channel).
  // Lưu ý: format rgb48le trong lavfi chain là packed RGB 16-bit, raw
  // bắt ra với -pix_fmt rgb48le, 3 kênh × 2 byte, thứ tự R,G,B.
  {
    const probe = async (color) => {
      const bufs = await grabFrames16(
        ["-f", "lavfi", "-i", lavfiFlat(color), "-vf", "format=rgb48le",
         "-frames:v", "1", "-pix_fmt", "rgb48le"], [0], W, H, 2, 3);
      const b = bufs.get(0);
      return [b.readUInt16LE(0), b.readUInt16LE(2), b.readUInt16LE(4)];
    };
    const flatA = await probe("red");
    const flatB = await probe("blue");
    log(`probe rgb48le: A(red)=${flatA} B(blue)=${flatB}`);
    const bufs = await grabFrames16(
      ["-f", "lavfi", "-i", lavfiFlat("red"),
       "-f", "lavfi", "-i", lavfiFlat("blue"),
       "-filter_complex",
       `[0:v]format=rgb48le[a];[1:v]format=rgb48le[b];[a][b]${xfade},format=rgb48le[out]`,
       "-map", "[out]", "-frames:v", String(F + 1), "-pix_fmt", "rgb48le"],
      [F], W, H, 2, 3);
    const render = bufs.get(F);
    const r = compare16(render,
      (c) => flatA[c], (c) => flatB[c],
      (i) => ffmpegDissolveFrand(i % W, Math.floor(i / W)) < P);
    log(`CELL dissolve-16bit rgb48le p=${P} frame=${F} MAD16=${r.mad16.toFixed(2)} (MAD8eq=${r.mad8eq.toFixed(4)}) le8eq=${r.le8eq.toFixed(3)}% div257=${r.div257pct.toFixed(3)}% tier=${r.tier}`);
  }

  // --- Đường 2: yuv444p16le — đo trong miền YUV (không chuyển về RGB).
  // Layout yuv444p16le raw: 3 mặt phẳng liên tiếp, mỗi mặt W*H mẫu
  // Uint16LE (Y, rồi U, rồi V). Preview chọn A/B theo frand, mẫu lấy
  // từ probe cùng chuỗi format.
  {
    const probeYuv = async (color) => {
      const bufs = await grabFrames16(
        ["-f", "lavfi", "-i", lavfiFlat(color), "-vf", "format=yuv444p16le",
         "-frames:v", "1", "-pix_fmt", "yuv444p16le"], [0], W, H, 2, 3);
      const b = bufs.get(0);
      // Mẫu đầu mỗi mặt phẳng (nguồn phẳng nên mọi pixel như nhau;
      // kiểm chứng bằng mẫu giữa khung).
      const mid = Math.floor((W * H) / 2);
      const y0 = b.readUInt16LE(0), yM = b.readUInt16LE(mid * 2);
      const u0 = b.readUInt16LE(W * H * 2), uM = b.readUInt16LE((W * H + mid) * 2);
      const v0 = b.readUInt16LE(W * H * 4), vM = b.readUInt16LE((2 * W * H + mid) * 2);
      if (y0 !== yM || u0 !== uM || v0 !== vM) {
        log(`  CANH BAO probe yuv444p16le ${color} khong phang: Y ${y0}/${yM} U ${u0}/${uM} V ${v0}/${vM}`);
      }
      return [y0, u0, v0];
    };
    const flatA = await probeYuv("red");
    const flatB = await probeYuv("blue");
    log(`probe yuv444p16le: A(red)=YUV${flatA} B(blue)=YUV${flatB}`);
    const bufs = await grabFrames16(
      ["-f", "lavfi", "-i", lavfiFlat("red"),
       "-f", "lavfi", "-i", lavfiFlat("blue"),
       "-filter_complex",
       `[0:v]format=yuv444p16le[a];[1:v]format=yuv444p16le[b];[a][b]${xfade},format=yuv444p16le[out]`,
       "-map", "[out]", "-frames:v", String(F + 1), "-pix_fmt", "yuv444p16le"],
      [F], W, H, 2, 3);
    const render = bufs.get(F);
    // So sánh theo từng mặt phẳng: mẫu (pixel i, kênh c) ở offset
    // (c*W*H + i)*2.
    const total = W * H;
    let sum = 0, le = 0, div257 = 0, samples = 0;
    for (let i = 0; i < total; i++) {
      const isB = ffmpegDissolveFrand(i % W, Math.floor(i / W)) < P;
      const src = isB ? flatB : flatA;
      let mx = 0;
      for (let c = 0; c < 3; c++) {
        const rv = render.readUInt16LE((c * total + i) * 2);
        const d = Math.abs(rv - src[c]);
        sum += d;
        if (d > mx) mx = d;
        if (rv % 257 === 0) div257++;
        samples++;
      }
      if (mx <= 2056) le++;
    }
    const mad16 = sum / (total * 3);
    const tier = mad16 <= 514 && le / total * 100 >= 99 ? "MATCHED" : "DUOI-NGUONG";
    log(`CELL dissolve-16bit yuv444p16le p=${P} frame=${F} MAD16=${mad16.toFixed(2)} (MAD8eq=${(mad16 / 257).toFixed(4)}) le8eq=${(le / total * 100).toFixed(3)}% div257=${(div257 / samples * 100).toFixed(3)}% tier=${tier}`);
  }

  // --- Validation ánh xạ frame ở 16-bit: frame 29 thuần A, 42 thuần B
  // (đường rgb48le, so với probe A/B).
  {
    const probe = async (color) => {
      const bufs = await grabFrames16(
        ["-f", "lavfi", "-i", lavfiFlat(color), "-vf", "format=rgb48le",
         "-frames:v", "1", "-pix_fmt", "rgb48le"], [0], W, H, 2, 3);
      const b = bufs.get(0);
      return [b.readUInt16LE(0), b.readUInt16LE(2), b.readUInt16LE(4)];
    };
    const flatA = await probe("red");
    const flatB = await probe("blue");
    const bufs = await grabFrames16(
      ["-f", "lavfi", "-i", lavfiFlat("red"),
       "-f", "lavfi", "-i", lavfiFlat("blue"),
       "-filter_complex",
       `[0:v]format=rgb48le[a];[1:v]format=rgb48le[b];[a][b]${xfade},format=rgb48le[out]`,
       "-map", "[out]", "-frames:v", "43", "-pix_fmt", "rgb48le"],
      [29, 42], W, H, 2, 3);
    const check = (buf, expected) => {
      let sum = 0;
      for (let i = 0; i < W * H; i++) {
        for (let c = 0; c < 3; c++) sum += Math.abs(buf.readUInt16LE((i * 3 + c) * 2) - expected[c]);
      }
      return sum / (W * H * 3);
    };
    log(`VALID dissolve-16bit rgb48le: frame29-vs-A MAD16=${check(bufs.get(29), flatA).toFixed(2)} | frame42-vs-B MAD16=${check(bufs.get(42), flatB).toFixed(2)}`);
  }
  log("\nDONE v16-dissolve16");
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
