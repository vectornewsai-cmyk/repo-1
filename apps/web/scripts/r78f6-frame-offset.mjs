#!/usr/bin/env node
/**
 * r78f6-frame-offset.mjs — Phase 9 đợt 78, luồng F6: chẩn đoán lệch khung
 * cho ocean (plain MAD 1,94–2,17, cao hơn test-pattern 1,02 và basgo
 * 0,73): preview snapshot plain có đúng là frame 30 của render không?
 * So MAD plain (trilinear) giữa snapshot preview và frame render
 * n = 29 / 30 / 31 trích từ preencode-plain.yuv. Nếu n≠30 cho MAD ~1,0
 * thì preview đang lệch 1 khung so với render (seek/timestamp của file
 * thật khác file test-pattern tổng hợp).
 * Chạy (từ gốc repo): node apps/web/scripts/r78f6-frame-offset.mjs
 * KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const F6 = path.join(GOAL, "round78-f6");
const R66T3 = path.join(GOAL, "round66-t3", "render");

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại: ${(r.stderr || r.stdout || "").slice(0, 400)}`);
}
function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
  }
  return { mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4) };
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

function check(content, snapFile, yuvPath, projW, projH) {
  const doc = JSON.parse(fs.readFileSync(snapFile, "utf8"));
  const snaps = doc.snaps[content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const prev = b64ToRgb(snaps.plain.rgbB64);
  console.log(`\n== ${content} ${doc.window} p${projW}x${projH}: rect ${vw}x${vh}, preview plain mean=${snaps.plain.mean} ==`);
  for (const n of [29, 30, 31]) {
    const out = path.join(F6, `r78f6-offset-${content}-n${n}.raw`);
    run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${projW}x${projH}`, "-r", "30", "-i", yuvPath,
      "-vf", `select='eq(n,${n})',scale=${projW}:${projH}:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], `extract n=${n}`);
    const frame = fs.readFileSync(out);
    const rs = resampleRgb24Trilinear(frame, projW, projH, vw, vh);
    const m = absMad(prev, rs);
    console.log(`  render frame n=${n}: plain MAD=${m.mad} le8=${(m.le8 * 100).toFixed(1)}% ${n === 30 ? "(mốc)" : ""}`);
    fs.unlinkSync(out);
  }
}

function main() {
  // ocean w1920-p1280 và w2560-p1280 (cùng preencode plain 1280×720).
  const yuvOcean = path.join(F6, "render", "ocean", "preencode-plain.yuv");
  check("ocean", path.join(F6, "headed-w1920x1080-p1280x720", "r78f6-snaps-w1920x1080-p1280x720.json"), yuvOcean, 1280, 720);
  check("ocean", path.join(F6, "headed-w2560x1440-p1280x720", "r78f6-snaps-w2560x1440-p1280x720.json"), yuvOcean, 1280, 720);
  // Đối chứng test-pattern w1920 (kỳ vọng n=30 tốt nhất, MAD ~1,0).
  const yuvTP = path.join(GOAL, "round65-s7", "render", "preencode-plain.yuv");
  check("test-pattern", path.join(F6, "headed-w1920x1080-p1280x720", "r78f6-snaps-w1920x1080-p1280x720.json"), yuvTP, 1280, 720);
}
main();
