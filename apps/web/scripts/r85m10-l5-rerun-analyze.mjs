#!/usr/bin/env node
/**
 * r85m10-l5-rerun-analyze.mjs — Phase 9 đợt 85, luồng M10:
 * tính MAD của S3 (viewport snapshot trong app, sau fix plainNativeSource)
 * so với model render MITCHELL ĐÚNG HÌNH HỌC APP (thang đều rect.scale,
 * phiX = -offX/scale — KHÔNG dùng chromeResampleRgb24 thang naive 809/640,
 * thang đó lệch X ~0,06px và phồng MAD lineart lên ~1,35 một cách giả tạo).
 * Input: l5-rerun/r84l5-snaps-w1920x1080-p640x360.json (harness L5 chạy lại
 * sau khi sửa preview.tsx). Baseline L5: plain lineart 5,39.
 * Chạy: node apps/web/scripts/r85m10-l5-rerun-analyze.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const SNAPS = JSON.parse(fs.readFileSync(path.join(M10, "l5-rerun", "r84l5-snaps-w1920x1080-p640x360.json"), "utf8"));
const PROBE = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-l5-rerun-analysis.json");
const G5MEDIA = path.join(GOAL, "round79-g5", "media");
const FILES = { lineart640: path.join(G5MEDIA, "lineart-640.mp4"), textsmall640: path.join(G5MEDIA, "textsmall-640.mp4") };
const W = 640, H = 360;
const b64buf = (s) => Buffer.from(s, "base64");
function bc(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
const mitchell = (x) => bc(x, 1 / 3, 1 / 3);
function roundU8(v) { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; }
function weights(i, sc, srcLen, kernel, h = 1, phi = 0) {
  const S = (i + 0.5) / sc + phi;
  const j0 = Math.max(0, Math.floor(S - h - 0.5));
  const j1 = Math.min(srcLen - 1, Math.ceil(S + h - 0.5));
  const ws = [];
  let wsum = 0;
  for (let j = j0; j <= j1; j++) {
    const w = kernel((j + 0.5 - S) / h);
    if (w === 0) continue;
    ws.push([j, w]);
    wsum += w;
  }
  if (wsum === 0) return [[Math.min(srcLen - 1, Math.max(0, Math.round(S))), 1]];
  return ws.map(([j, w]) => [j, w / wsum]);
}
function resampleU8(rgb, srcW, srcH, dstW, dstH, kernel, h = 1, phiX = 0, phiY = 0, scX = null, scY = null) {
  scX = scX ?? dstW / srcW; scY = scY ?? dstH / srcH;
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const tmp = new Float64Array(dstW * srcH);
    const wx = new Array(dstW);
    for (let i = 0; i < dstW; i++) wx[i] = weights(i, scX, srcW, kernel, h, phiX);
    for (let y = 0; y < srcH; y++) {
      const sRow = y * srcW, tRow = y * dstW;
      for (let i = 0; i < dstW; i++) {
        let acc = 0;
        for (const [j, w] of wx[i]) acc += w * pl[sRow + j];
        tmp[tRow + i] = acc;
      }
    }
    const wy = new Array(dstH);
    for (let i = 0; i < dstH; i++) wy[i] = weights(i, scY, srcH, kernel, h, phiY);
    for (let x = 0; x < dstW; x++) {
      for (let i = 0; i < dstH; i++) {
        let acc = 0;
        for (const [j, w] of wy[i]) acc += w * tmp[j * dstW + x];
        out[(i * dstW + x) * 3 + c] = roundU8(acc);
      }
    }
  }
  return out;
}
function madU8(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return +(s / a.length).toFixed(3); }
function decodeOneFrame(file, t) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
    const chunks = [];
    let err = "";
    ff.stdout.on("data", (d) => chunks.push(d));
    ff.stderr.on("data", (d) => { err += d; });
    ff.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exit ${code}: ${err.slice(-300)}`));
      const buf = Buffer.concat(chunks);
      if (buf.length !== W * H * 3) return reject(new Error(`frame ngắn: ${buf.length}`));
      resolve(buf);
    });
  });
}
async function main() {
  const res = {
    generatedAt: new Date().toISOString(),
    playhead: SNAPS.playhead,
    model: "Mitchell (B=C=1/3), round+clamp, hình học app (thang đều rect.scale, phiX=-offX/scale)",
    appScale: PROBE.appScale, appOffX: PROBE.appOffX,
    note: "S3 viewport trong app sau fix plainNativeSource vs model render đúng hình học app",
  };
  const phiX = -PROBE.appOffX / PROBE.appScale;
  for (const [content, snaps] of Object.entries(SNAPS.snaps)) {
    const ff = await decodeOneFrame(FILES[content], SNAPS.playhead);
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const sc = snaps.plain.rect.scale;
    const model = resampleU8(ff, W, H, vw, vh, mitchell, 1, phiX, 0, sc, sc);
    // So kiểu L5 (chuẩn): Mitchell áp trên S0 của chính app (directDraw
    // native) thay vì ffmpeg — textsmall decode Chrome vs ffmpeg lệch tới
    // 1,344 MAD nên so với ffmpeg sẽ lẫn nhiễu decode.
    const dd = SNAPS.directDraws[content].plain.native;
    const s0app = b64buf(dd.rgbB64);
    const modelS0 = resampleU8(s0app, W, H, vw, vh, mitchell, 1, phiX, 0, sc, sc);
    res[content] = { viewport: `${vw}x${vh}`, scale: sc, phiX, s0VsFfmpegMad: madU8(s0app, ff) };
    for (const v of ["plain", "sharp05", "sharp10"]) {
      const got = b64buf(snaps[v].rgbB64);
      res[content][v] = { vsAppGeomMitchellFf: madU8(got, model), vsAppGeomMitchellS0: madU8(got, modelS0), mean: snaps[v].mean };
      console.log(`  ${content}/${v}: vs Mitchell(ff) ${res[content][v].vsAppGeomMitchellFf} | vs Mitchell(S0-app) ${res[content][v].vsAppGeomMitchellS0} (mean ${snaps[v].mean})`);
    }
    console.log(`  ${content}: S0-app vs ffmpeg MAD ${res[content].s0VsFfmpegMad}`);
  }
  // Đối chứng: S3 plain mới vs C2app probe (two-step bare-page) và vs S3 plain L5 gốc.
  const old = JSON.parse(fs.readFileSync(path.join(GOAL, "round84-l5", "headed-w1920x1080-p640x360-ph1", "r84l5-snaps-w1920x1080-p640x360.json"), "utf8"));
  const s3new = b64buf(SNAPS.snaps.lineart640.plain.rgbB64);
  const s3old = b64buf(old.snaps.lineart640.plain.rgbB64);
  const c2app = b64buf(PROBE.statics.lineart640.caps.apptwo1264.rgbB64);
  const bapp = b64buf(PROBE.statics.lineart640.caps.app1264.rgbB64);
  res.crossCheck = {
    s3new_vs_c2app_twoStep: madU8(s3new, c2app),
    s3new_vs_s3old_L5: madU8(s3new, s3old),
    s3old_vs_bapp_directVideo: madU8(s3old, bapp),
  };
  console.log("  cross-check:", JSON.stringify(res.crossCheck));
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main().catch((e) => { console.error("LỖI:", e); process.exit(2); });
