#!/usr/bin/env node
/**
 * r82j5-pan-build.mjs — Phase 9 đợt 82, luồng J5: BUILD video still có
 * MOTION GIẢ (pan ngang) để tách cơ chế (ii) motion mismatch (xem
 * docs/PHASE9_ROUND82_J5_Q4_RESID_MECHANISM_LIMITS.md §1/§5).
 *
 * Ý TƯỞNG: still slovenska/test-pattern gốc → dịch khung hình theo từng
 * frame (pan ngang, edge-replication, KHÔNG upscale nên không làm mờ
 * thêm) → encode x264 crf 18 như I4. Capture headed ở playhead 1,0 s
 * (frame 30) rồi đánh giá 2 cách (r82j5-sweep.mjs):
 *   - render KHỚP frame 30 (cùng frame đã encode): motion tự thân có
 *     làm phồng resid không?
 *   - render LỆCH frame 25 (sai 5 frame, kiểu F7 nếu frame tham chiếu
 *     lệch): resid có tăng theo tốc độ pan không?
 * Nếu (khớp) đứng yên ~baseline ở mọi tốc độ mà (lệch) tăng theo tốc độ
 * → motion chỉ có nghĩa qua LỆCH FRAME, không phải qua nội dung chuyển
 * động. Đây là thí nghiệm (b) trong nhiệm vụ J5.
 *
 * Spec qua argv (mỗi spec một tên), mặc định cả 4:
 *   pan:slov:0  pan:slov:2  pan:slov:8  pan:tp:8
 * (số = px/frame @30fps; 8 px/frame = 240 px/s.)
 *
 * File ra (KHÔNG stage — binary; script này tái lập được):
 *   hidden_files/round82-j5/media/pan-{slov,tp}-s{N}.mp4
 *   hidden_files/round82-j5/render/pan-{slov,tp}-s{N}-{plain,noise05,noise10}.raw
 *   hidden_files/round82-j5/render/pan-{slov,tp}-s{N}-f25-plain.raw (render lệch)
 * Chạy (từ gốc repo): node apps/web/scripts/r82j5-pan-build.mjs [spec...]
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const J5 = path.join(GOAL, "round82-j5");
const MEDIA = path.join(J5, "media");
const RENDER = path.join(J5, "render");
fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(RENDER, { recursive: true });

const W = 1280, H = 720, FPS = 30, DUR = 4, FRAMES = FPS * DUR;
const SPECS = process.argv.slice(2).length ? process.argv.slice(2) : ["pan:slov:0", "pan:slov:2", "pan:slov:8", "pan:tp:8"];

function ff(args, timeoutMs = 300000) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs });
}
function frameStats(buf) {
  const n = buf.length / 3, out = { std: [], kurt: [] };
  for (let c = 0; c < 3; c++) {
    let mean = 0; for (let i = c; i < buf.length; i += 3) mean += buf[i]; mean /= n;
    let s2 = 0, s4 = 0;
    for (let i = c; i < buf.length; i += 3) { const v = buf[i] - mean; s2 += v * v; s4 += v * v * v * v; }
    const sd = Math.sqrt(s2 / n);
    out.std.push(+sd.toFixed(2));
    out.kurt.push(+(s4 / n / (sd ** 4) - 3).toFixed(2));
  }
  return out;
}
function panFrame(src, dx) {
  // Dịch nội dung sang trái dx px (camera pan phải), mép phải replicate.
  const out = Buffer.alloc(src.length);
  for (let y = 0; y < H; y++) {
    const row = y * W * 3;
    for (let x = 0; x < W; x++) {
      const sx = Math.min(x + dx, W - 1);
      const si = row + sx * 3, oi = row + x * 3;
      out[oi] = src[si]; out[oi + 1] = src[si + 1]; out[oi + 2] = src[si + 2];
    }
  }
  return out;
}
function encodePan(mp4, src, speed) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const proc = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-s", `${W}x${H}`, "-pix_fmt", "rgb24",
      "-framerate", String(FPS), "-i", "pipe:0",
      "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-crf", "18", "-g", "30", mp4], { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    proc.stderr.on("data", (d) => { err += d; });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`ffmpeg encode pan s${speed} exit ${code}: ${err.slice(0, 400)}`));
      else resolve((Date.now() - t0) / 1000);
    });
    (async () => {
      for (let n = 0; n < FRAMES; n++) {
        const frame = panFrame(src, Math.round(n * speed));
        if (!proc.stdin.write(frame)) await new Promise((r) => proc.stdin.once("drain", r));
      }
      proc.stdin.end();
    })().catch(reject);
  });
}

async function main() {
  const srcs = {
    slov: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw")),
    tp: fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw")),
  };
  for (const spec of SPECS) {
    const m = spec.match(/^pan:(slov|tp):(\d+(\.\d+)?)$/);
    if (!m) throw new Error(`spec không hiểu: ${spec} (dạng pan:slov:8)`);
    const [, fam, speedS] = m;
    const speed = Number(speedS);
    const name = `pan-${fam}-s${speedS.replace(".", "p")}`;
    console.log(`== build ${name} (pan ${speed} px/frame, ${speed * FPS} px/s) ==`);
    const mp4 = path.join(MEDIA, `${name}.mp4`);
    const encSec = await encodePan(mp4, srcs[fam], speed);
    console.log(`  video: ${mp4} (${fs.statSync(mp4).size} byte, encode ${encSec.toFixed(1)}s)`);
    // Render khớp: decode frame 30 (playhead 1,0 s) + noise; render lệch: frame 25.
    for (const [f, suffix] of [[30, "plain"], [25, "f25-plain"]]) {
      const decP = path.join(RENDER, `${name}-${suffix}.raw`);
      ff(["-i", mp4, "-vf", `select=eq(n\\,${f}),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", decP]);
      console.log(`  ${suffix} (frame ${f}): stats ${JSON.stringify(frameStats(fs.readFileSync(decP)))}`);
    }
    const yuvP = path.join(RENDER, `${name}.yuv`);
    ff(["-i", mp4, "-vf", "select=eq(n\\,30),scale=1280:720", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvP]);
    for (const [lv, alls] of [["noise05", 28], ["noise10", 50]]) {
      const outP = path.join(RENDER, `${name}-${lv}.raw`);
      ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", yuvP,
        "-vf", `noise=alls=${alls}:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", outP]);
      console.log(`  ${lv}: stats ${JSON.stringify(frameStats(fs.readFileSync(outP)))}`);
    }
    // Kiểm chứng encode: MAD decode f30 vs frame pan gốc f30 (x264 crf 18 phải nhỏ).
    const orig30 = panFrame(srcs[fam], Math.round(30 * speed));
    const dec30 = fs.readFileSync(path.join(RENDER, `${name}-plain.raw`));
    let s = 0, mx = 0;
    for (let i = 0; i < dec30.length; i++) { const d = Math.abs(dec30[i] - orig30[i]); s += d; if (d > mx) mx = d; }
    console.log(`  encode check (decode f30 vs pan-gốc f30): MAD=${(s / dec30.length).toFixed(3)} max=${mx}`);
  }
  console.log("\nDONE — video pan + frame render đã build (binary, KHÔNG stage; script này tái lập được).");
}
main().catch((e) => { console.error(`J5-PAN-BUILD LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
