#!/usr/bin/env node
/**
 * test_v16_dissolve16_true.mjs — Phase 9 đợt 16, luồng H4 (bổ sung cho
 * test_v16_dissolve16.mjs): dissolve 16-bit với NGUỒN 16-BIT THẬT.
 *
 * Vì sao cần file này: test_v16_dissolve16 dùng nguồn phẳng lavfi
 * color (8-bit). Khi nâng lên rgb48le, giá trị đỏ = 64764 = 252×257
 * nên đầu ra div257 = 100% là HỆ QUẢ của nguồn 8-bit, KHÔNG chứng
 * minh xfade lượng tử hoá xuống 8-bit. Muốn kết luận về 16-bit thật
 * thì nguồn vào phải chứa giá trị KHÔNG chia hết cho 257.
 *
 * Cách làm: sinh 2 file raw tĩnh (gradient 16-bit, mọi kênh đều có
 * giá trị không chia hết cho 257) bằng Node, ghi vào /tmp (KHÔNG
 * đưa vào repo, KHÔNG stage), mỗi file 50 frame giống nhau; chạy
 * xfade dissolve thật giữa chúng; so frame 36 (p=0.5) với frame gốc
 * theo frand (code thật dissolveFrand.ts). Vì nguồn tĩnh nên frame
 * gốc = frame 0 của file.
 *
 * Đường đo:
 * (a) rgb48le: raw packed R,G,B Uint16LE, xfade ở rgb48le (FFmpeg tự
 *     chuyển nội bộ sang gbrp16le — xem debug của script trước).
 * (b) yuv444p16le: raw 3 mặt phẳng Y,U,V Uint16LE, xfade ở yuv444p16le.
 * Thang: MAD16 ≤ 514 và le8eq (lệch kênh ≤ 2056) ≥ 99% ⇔ MATCHED.
 * Chẩn đoán lượng tử hoá: tỉ lệ mẫu đầu ra KHÔNG chia hết cho 257
 * phải xấp xỉ tỉ lệ của nguồn (≈ 99,6%); nếu đầu ra về 0% thì xfade
 * đã lượng tử hoá — khi đó mới được kết luận giới hạn.
 *
 * Chạy từ gốc repo:
 *   node --experimental-strip-types server/render/src/test_v16_dissolve16_true.mjs
 * Exit 0 khi mọi cell render xong; 2 khi lỗi harness.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
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
const W = 640, H = 360;
const NFRAMES = 50;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "h4-diss16-"));

function log(...a) { console.log(...a); }

/** Sinh 1 frame gradient 16-bit (packed RGB hoặc planar YUV). */
function frameRgb(seed) {
  const buf = Buffer.alloc(W * H * 3 * 2);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 6;
      buf.writeUInt16LE((x * 103 + y * 7 + seed) % 65536, o);
      buf.writeUInt16LE((x * 57 + y * 131 + seed * 2) % 65536, o + 2);
      buf.writeUInt16LE(((W - x) * 131 + y * 29 + seed * 3) % 65536, o + 4);
    }
  }
  return buf;
}
function frameYuv(seed) {
  const buf = Buffer.alloc(W * H * 3 * 2);
  const put = (plane, x, y, v) => buf.writeUInt16LE(v, (plane * W * H + y * W + x) * 2);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      put(0, x, y, (x * 89 + y * 13 + seed) % 65536);
      put(1, x, y, (x * 41 + y * 173 + seed * 2) % 65536);
      put(2, x, y, ((W - x) * 67 + y * 37 + seed * 3) % 65536);
    }
  }
  return buf;
}

function writeRaw(name, frame) {
  const p = path.join(TMP, name);
  const fd = fs.openSync(p, "w");
  for (let i = 0; i < NFRAMES; i++) fs.writeSync(fd, frame);
  fs.closeSync(fd);
  return p;
}

function nonDiv257Pct(buf) {
  let non = 0;
  let total = 0;
  for (let o = 0; o + 1 < buf.length; o += 2) {
    if (buf.readUInt16LE(o) % 257 !== 0) non++;
    total++;
  }
  return (non / total) * 100;
}

function grabFrames(ffmpegArgs, targets, frameBytes) {
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

async function main() {
  log(`ROOT=${ROOT} W=${W} H=${H} p=${P} frame=${F} tmp=${TMP}`);
  const xfade = buildXfadeFilter("dissolve", DUR, OFFSET);
  const frameBytes = W * H * 3 * 2;

  // --- (a) rgb48le.
  {
    const fa = frameRgb(12345);
    const fb = frameRgb(54321);
    log(`nguon rgb48le: A nonDiv257=${nonDiv257Pct(fa).toFixed(3)}% B nonDiv257=${nonDiv257Pct(fb).toFixed(3)}%`);
    const pa = writeRaw("a.rgb48le", fa);
    const pb = writeRaw("b.rgb48le", fb);
    const bufs = await grabFrames(
      ["-f", "rawvideo", "-pix_fmt", "rgb48le", "-s", `${W}x${H}`, "-r", String(FPS), "-i", pa,
       "-f", "rawvideo", "-pix_fmt", "rgb48le", "-s", `${W}x${H}`, "-r", String(FPS), "-i", pb,
       "-filter_complex",
       `[0:v]format=rgb48le[a];[1:v]format=rgb48le[b];[a][b]${xfade},format=rgb48le[out]`,
       "-map", "[out]", "-frames:v", String(F + 1), "-pix_fmt", "rgb48le"],
      [F], frameBytes);
    const render = bufs.get(F);
    let sum = 0, le = 0;
    const total = W * H;
    for (let i = 0; i < total; i++) {
      const isB = ffmpegDissolveFrand(i % W, Math.floor(i / W)) < P;
      const src = isB ? fb : fa;
      let mx = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(render.readUInt16LE((i * 3 + c) * 2) - src.readUInt16LE((i * 3 + c) * 2));
        sum += d;
        if (d > mx) mx = d;
      }
      if (mx <= 2056) le++;
    }
    const mad16 = sum / (total * 3);
    const tier = mad16 <= 514 && le / total * 100 >= 99 ? "MATCHED" : "DUOI-NGUONG";
    log(`CELL dissolve-16bit-TRUE rgb48le p=${P} frame=${F} MAD16=${mad16.toFixed(2)} (MAD8eq=${(mad16 / 257).toFixed(4)}) le8eq=${(le / total * 100).toFixed(3)}% outNonDiv257=${nonDiv257Pct(render).toFixed(3)}% tier=${tier}`);
    fs.unlinkSync(pa);
    fs.unlinkSync(pb);
  }

  // --- (b) yuv444p16le.
  {
    const fa = frameYuv(11111);
    const fb = frameYuv(77777);
    log(`nguon yuv444p16le: A nonDiv257=${nonDiv257Pct(fa).toFixed(3)}% B nonDiv257=${nonDiv257Pct(fb).toFixed(3)}%`);
    const pa = writeRaw("a.yuv444p16le", fa);
    const pb = writeRaw("b.yuv444p16le", fb);
    const bufs = await grabFrames(
      ["-f", "rawvideo", "-pix_fmt", "yuv444p16le", "-s", `${W}x${H}`, "-r", String(FPS), "-i", pa,
       "-f", "rawvideo", "-pix_fmt", "yuv444p16le", "-s", `${W}x${H}`, "-r", String(FPS), "-i", pb,
       "-filter_complex",
       `[0:v]format=yuv444p16le[a];[1:v]format=yuv444p16le[b];[a][b]${xfade},format=yuv444p16le[out]`,
       "-map", "[out]", "-frames:v", String(F + 1), "-pix_fmt", "yuv444p16le"],
      [F], frameBytes);
    const render = bufs.get(F);
    let sum = 0, le = 0;
    const total = W * H;
    for (let i = 0; i < total; i++) {
      const isB = ffmpegDissolveFrand(i % W, Math.floor(i / W)) < P;
      const src = isB ? fb : fa;
      let mx = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(render.readUInt16LE((c * total + i) * 2) - src.readUInt16LE((c * total + i) * 2));
        sum += d;
        if (d > mx) mx = d;
      }
      if (mx <= 2056) le++;
    }
    const mad16 = sum / (total * 3);
    const tier = mad16 <= 514 && le / total * 100 >= 99 ? "MATCHED" : "DUOI-NGUONG";
    log(`CELL dissolve-16bit-TRUE yuv444p16le p=${P} frame=${F} MAD16=${mad16.toFixed(2)} (MAD8eq=${(mad16 / 257).toFixed(4)}) le8eq=${(le / total * 100).toFixed(3)}% outNonDiv257=${nonDiv257Pct(render).toFixed(3)}% tier=${tier}`);
    fs.unlinkSync(pa);
    fs.unlinkSync(pb);
  }
  fs.rmdirSync(TMP, { recursive: true });
  log("\nDONE v16-dissolve16-true");
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
