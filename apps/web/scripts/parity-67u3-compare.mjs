#!/usr/bin/env node
/**
 * parity-67u3-compare.mjs — Phase 9 đợt 67, luồng U3: TÁCH SÀN DECODE khỏi
 * effect khi đo sharpen headed (nợ đợt 66 §8 mục 3).
 *
 * Vấn đề đợt 66 T4: sharpen HYB4 full-res pre-encode KHỚP 8/8 nhưng headed
 * vẫn XẤP XỈ (delta le8 tốt nhất 98,5%) vì sàn decode Chrome-vs-ffmpeg
 * (plain MAD ~1,17 ngay cả ở 1:1 không resample) và nhánh direct khuếch đại
 * sàn đó. Metric delta thô không tách được "effect sai" khỏi "decode sai".
 *
 * Metric mới (mỗi ô variant × preencode/bilinear là chính; lanczos đối chứng):
 *   - floor F: plain preview↔render MAD/le8/le32 (như cũ).
 *   - delta thô D: |Δp−Δr| MAD/le8 (như cũ).
 *   - le8_net: tỉ lệ pixel có |Δp−Δr|_max > 8 VÀ |Pp−Pr|_max ≤ 8 — lỗi thấy
 *     được mà sàn plain KHÔNG giải thích được. KHỚP-trừ-sàn ⇔ le8_net ≥ 0,99
 *     (≤1% pixel mang lỗi vượt sàn) và mad_net_quad ≤ 2.
 *   - mad_net_quad = sqrt(max(0, MAD_delta² − MAD_floor²)) — ước lượng bậc
 *     hai, giả định sai số delta và sai số sàn độc lập (ghi rõ là ước lượng).
 *   - mad_clean = MAD |Δp−Δr| chỉ trên pixel có floor_max ≤ 8.
 *   - excess_le8 = le8_delta − le8_floor (chênh tỉ lệ lỗi thấy được).
 *   - Phân rã theo nhánh sharpen: mask direct = pixel có ≥1 kênh
 *     excess_est > 4, tính từ frame render plain bằng ĐÚNG estimator HYB4
 *     (sao chép verbatim từ apps/web/src/lib/effectCanvas.ts, xem dưới);
 *     báo floor/delta/le8_net riêng cho tập direct vs delta-add. Cùng một
 *     mask dùng cho cả HYB4 lẫn S7 nên so được trên cùng tập pixel.
 *     Lưu ý: mask tính ở khổ viewport (sharpen preview chạy ở 1280×720 rồi
 *     drawImage xuống viewport) nên là xấp xỉ; ở 1:1 gần như chính xác.
 *
 * Chạy (từ gốc repo), sau headed script của cùng content/cỡ:
 *   R67U3_CONTENT=testsrc2 R67U3_SNAPS=<snaps.json> node apps/web/scripts/parity-67u3-compare.mjs
 * Env: R67U3_CONTENT (testsrc2|slovenska|basgo|ocean), R67U3_SNAPS (đường dẫn
 *   snaps JSON), R67U3_RENDER_DIR (thư mục chứa preencode-*.yuv của content),
 *   R67U3_MEDIA (mp4 input render), R67U3_OUT (đường dẫn report JSON).
 * Mặc định testsrc2 tái dùng snaps + preencode đợt 65 S7 / đợt 66 T4.
 * Exit 0 khi mọi variant đo xong có verdict; 1 có variant lỗi đo; 2 harness lỗi.
 * KHÔNG push/tag/binary. Chỉ đọc snaps + render reference, ghi report JSON.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const HOME = os.homedir();
const GOALHF = path.join(HOME, "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const GOAL65 = path.join(GOALHF, "round65-s7");
const GOAL66 = path.join(GOALHF, "round66-t4");
const GOAL67 = path.join(GOALHF, "round67-u3");

const CONTENT = process.env.R67U3_CONTENT || "testsrc2";
const SNAPS = process.env.R67U3_SNAPS ||
  (CONTENT === "testsrc2" ? path.join(GOAL66, "headed", "r66t4-preview-snaps.json") : path.join(GOAL67, "headed", `${CONTENT}-snaps.json`));
const RENDER_DIR = process.env.R67U3_RENDER_DIR ||
  (CONTENT === "testsrc2" ? path.join(GOAL65, "render") : path.join(GOAL67, "render", CONTENT));
const MEDIA = process.env.R67U3_MEDIA ||
  (CONTENT === "testsrc2" ? path.join(GOAL65, "media", "test-pattern.mp4")
    : path.join(GOAL67, "media", `${CONTENT}-720p.mp4`));
const OUT = process.env.R67U3_OUT || path.join(GOAL67, "compare", `${CONTENT}-report.json`);

const VARIANTS = ["plain", "sharp05", "sharp10"];
const EFFECT = {
  plain: "",
  sharp05: ",unsharp=5:5:1.1:5:5:0",
  sharp10: ",unsharp=5:5:2:5:5:0",
};
const SCALERS = ["bilinear", "lanczos"];

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại (exit ${r.status}): ${(r.stderr || r.stdout || "").slice(0, 500)}`);
  return r;
}

// ---------- Estimator HYB4, sao chép verbatim từ apps/web/src/lib/effectCanvas.ts ----------
// (hàm thuần, không export; copy để tính mask nhánh direct từ frame render plain)
function rgbToYuv709(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const y = 16 + 219 * yl;
  const cb = 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722);
  const cr = 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126);
  return [y, cb, cr];
}
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  const r = yy + 1.79274 * (cr - 128);
  const g = yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128);
  const b = yy + 2.1122 * (cb - 128);
  return [r, g, b];
}
function estimateNativeChroma(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
function nativeLumaOffset(yDerived, cbEst, crEst) {
  const [r, g, b] = yuv709ToRgb(yDerived, cbEst, crEst);
  let off = 0;
  if (r > 255) off += 0.2126 * (r - 255);
  else if (r < 0) off += 0.2126 * r;
  if (g > 255) off += 0.7152 * (g - 255);
  else if (g < 0) off += 0.7152 * g;
  if (b > 255) off += 0.0722 * (b - 255);
  else if (b < 0) off += 0.0722 * b;
  return off * (219 / 255);
}
function estimateNativeY(yDerived, cbEst, crEst) {
  const o1 = nativeLumaOffset(yDerived, cbEst, crEst);
  const o2 = nativeLumaOffset(yDerived + o1, cbEst, crEst);
  return yDerived + (o1 + o2) / 2;
}
const SHARPEN_K_CB = 1.04, SHARPEN_K_CR = 1.09;
// Mask direct: pixel có ≥1 kênh excess_est > 4 (đúng ngưỡng HYB4).
function directMask(rgb, vw, vh) {
  const mask = new Uint8Array(vw * vh);
  const cw = (vw + 1) >> 1, ch = (vh + 1) >> 1;
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  const lumY = new Float64Array(vw * vh);
  for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
    const i = y * vw + x, p = i * 3;
    const [, cb, cr] = rgbToYuv709(rgb[p], rgb[p + 1], rgb[p + 2]);
    lumY[i] = 16 + (219 * (0.2126 * rgb[p] + 0.7152 * rgb[p + 1] + 0.0722 * rgb[p + 2])) / 255;
    void cb; void cr;
  }
  // mean chroma theo khối 2x2 (như applySharpen)
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= vw || y >= vh) continue;
      const p = (y * vw + x) * 3;
      const [, cb, cr] = rgbToYuv709(rgb[p], rgb[p + 1], rgb[p + 2]);
      sCb += cb; sCr += cr; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma(sCb / n, SHARPEN_K_CB);
    estCr[i] = estimateNativeChroma(sCr / n, SHARPEN_K_CR);
  }
  let nDirect = 0;
  for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
    const i = y * vw + x, ci = (y >> 1) * cw + (x >> 1);
    const lumEst = estimateNativeY(lumY[i], estCb[ci], estCr[ci]);
    const [r0, g0, b0] = yuv709ToRgb(lumEst, estCb[ci], estCr[ci]);
    const r0c = [r0, g0, b0];
    let direct = 0;
    for (let c = 0; c < 3; c++) {
      const excess = r0c[c] > 255 ? r0c[c] - 255 : r0c[c] < 0 ? -r0c[c] : 0;
      if (excess > 4) { direct = 1; break; }
    }
    mask[i] = direct;
    nDirect += direct;
  }
  return { mask, nDirect, frac: nDirect / (vw * vh) };
}
// ---------- hết phần sao chép ----------

function renderPreEncode(v) {
  const out = path.join(RENDER_DIR, `preencode-${v}.yuv`);
  if (!fs.existsSync(out)) {
    fs.mkdirSync(RENDER_DIR, { recursive: true });
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

// So sánh tuyệt đối preview↔render + floor theo pixel (để trừ sàn ở delta).
function compareAbsolute(preview, renderBuf, vw, vh, rect) {
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const pts = gridPoints(preview).filter((p) => p.x >= vx0 && p.x < vx0 + vw && p.y >= vy0 && p.y < vy0 + vh);
  let sum = 0, le8 = 0, le32 = 0;
  const floorMax = new Float64Array(pts.length);
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k];
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(preview.data[pi + c] - renderBuf[ri + c]);
      sum += d;
      if (d > dmax) dmax = d;
    }
    floorMax[k] = dmax;
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  const n = pts.length;
  return { n, pts, floorMax, mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}

// Delta sharpen + metric trừ sàn + phân rã theo nhánh.
function deltaFloorSubtracted(previewA, previewB, renderA, renderB, vw, vh, rect, floorPlain, maskInfo) {
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const pts = floorPlain.pts;
  let sumAbs = 0, le8 = 0, le32 = 0;
  let net8 = 0, net32 = 0;           // lỗi thấy được mà sàn không giải thích
  let sumCleanAbs = 0, nClean = 0;   // MAD delta trên pixel sàn sạch (floor_max ≤ 8)
  // theo nhánh
  const br = {
    direct: { n: 0, sumFloor: 0, sumDelta: 0, le8: 0, net8: 0 },
    add: { n: 0, sumFloor: 0, sumDelta: 0, le8: 0, net8: 0 },
  };
  // Sàn theo vùng lân cận 3×3 mẫu (≈ ±4px, phủ support blur 5px của sharpen):
  // delta sharpen phụ thuộc cả vùng lân cận, nên sàn local tại đúng pixel
  // chưa đủ — pixel có floor local ≤8 nhưng lân cận decode lệch vẫn mang
  // lỗi delta do decode. le8_net_nb là metric trừ sàn đúng hơn.
  const cols = Math.ceil(previewA.w / previewA.step);
  const fGrid = new Float64Array(previewA.n);
  for (let k = 0; k < pts.length; k++) fGrid[pts[k].i] = floorPlain.floorMax[k];
  const nbFloor = (p) => {
    const gx = p.i % cols, gy = Math.floor(p.i / cols);
    let m = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = gx + dx, yy = gy + dy;
      if (xx < 0 || yy < 0 || xx >= cols || yy >= Math.ceil(previewA.h / previewA.step)) continue;
      const v = fGrid[yy * cols + xx];
      if (v > m) m = v;
    }
    return m;
  };
  let netNb8 = 0;
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k];
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const dp = previewB.data[pi + c] - previewA.data[pi + c];
      const dr = renderB[ri + c] - renderA[ri + c];
      const d = Math.abs(dp - dr);
      sumAbs += d;
      if (d > dmax) dmax = d;
    }
    const fmax = floorPlain.floorMax[k];
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
    if (dmax > 8 && fmax <= 8) net8++;
    if (dmax > 32 && fmax <= 32) net32++;
    if (dmax > 8 && nbFloor(p) <= 8) netNb8++;
    if (fmax <= 8) {
      nClean++;
      for (let c = 0; c < 3; c++) {
        const dp = previewB.data[pi + c] - previewA.data[pi + c];
        const dr = renderB[ri + c] - renderA[ri + c];
        sumCleanAbs += Math.abs(dp - dr);
      }
    }
    const b = maskInfo.mask[ry * vw + rx] ? br.direct : br.add;
    b.n++;
    b.sumFloor += fmax;
    b.sumDelta += dmax;
    if (dmax <= 8) b.le8++;
    if (dmax > 8 && fmax <= 8) b.net8++;
  }
  const n = pts.length;
  const deltaMad = sumAbs / (n * 3);
  const floorMad = floorPlain.mad;
  const madNetQuad = Math.sqrt(Math.max(0, deltaMad * deltaMad - floorMad * floorMad));
  const fin = (x) => {
    const frac = x.n ? x.n / n : 0;
    return {
      n: x.n, frac: +frac.toFixed(4),
      floorMad: +(x.sumFloor / Math.max(1, x.n)).toFixed(3),
      deltaMadMaxMean: +(x.sumDelta / Math.max(1, x.n)).toFixed(3),
      deltaLe8: +(x.le8 / Math.max(1, x.n)).toFixed(4),
      le8NetFrac: +(x.net8 / Math.max(1, x.n)).toFixed(4),
    };
  };
  return {
    n,
    deltaMad: +deltaMad.toFixed(3),
    deltaLe8: +(le8 / n).toFixed(4),
    deltaLe32: +(le32 / n).toFixed(4),
    le8Net: +(net8 / n).toFixed(4),
    le8NetNb: +(netNb8 / n).toFixed(4),
    le32Net: +(net32 / n).toFixed(4),
    le8NetPctOfVisible: net8 ? +((net8 / Math.max(1, n - le8)) ).toFixed(4) : 0,
    excessLe8: +((le8 / n) - floorPlain.le8).toFixed(4),
    madNetQuad: +madNetQuad.toFixed(3),
    madClean: nClean ? +(sumCleanAbs / (nClean * 3)).toFixed(3) : null,
    nClean, cleanFrac: +(nClean / n).toFixed(4),
    branch: { direct: fin(br.direct), add: fin(br.add) },
  };
}

function verdictMad(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
// Verdict sau khi trừ sàn (dùng le8_net_nb — sàn theo vùng lân cận blur):
// lỗi thấy được vượt sàn-lân-cận ≤1% và MAD trừ sàn ≤2.
function verdictFloorSub(d) {
  if (d.le8NetNb <= 0.01 && d.madNetQuad <= 2) return "KHỚP-trừ-sàn";
  if (d.le8NetNb <= 0.10 && d.madNetQuad <= 20) return "XẤP XỈ-trừ-sàn";
  return "LỆCH-trừ-sàn";
}

async function main() {
  if (!fs.existsSync(SNAPS)) { console.error(`BLOCKER: thiếu snaps ${SNAPS}`); process.exitCode = 2; return; }
  if (!fs.existsSync(MEDIA)) { console.error(`BLOCKER: thiếu media ${MEDIA}`); process.exitCode = 2; return; }
  const snaps = JSON.parse(fs.readFileSync(SNAPS, "utf8"));
  const plain = snaps.plain;
  if (!plain?.ok) { console.error("BLOCKER: snapshot plain thiếu/không ok"); process.exitCode = 2; return; }
  const rect = plain.rect;
  const vw = Math.round(rect.w), vh = Math.round(rect.h);
  console.log(`content=${CONTENT} canvas ${plain.w}x${plain.h}, vùng video ${vw}x${vh} @(${Math.round(rect.x)},${Math.round(rect.y)}) scale=${rect.scale.toFixed(4)}`);
  const report = {
    content: CONTENT, snaps: SNAPS,
    canvas: { w: plain.w, h: plain.h },
    videoRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: vw, h: vh, scale: rect.scale },
    target: "preencode", scalers: SCALERS, variants: {},
  };
  let failCount = 0;
  const frames = {};
  for (const scaler of SCALERS) {
    frames[scaler] = {};
    for (const v of VARIANTS) {
      try {
        const rawPath = path.join(RENDER_DIR, `frame-67u3-${scaler}-${v}.raw`);
        const yuv = renderPreEncode(v);
        frames[scaler][v] = extractFrameFromRaw(yuv, vw, vh, scaler, rawPath);
      } catch (e) { console.error(`  ✗ ${scaler}/${v}: ${e.message}`); failCount++; }
    }
  }
  // Mask nhánh direct từ frame render plain (bilinear — mask ít nhạy scaler).
  const maskInfo = directMask(frames.bilinear.plain, vw, vh);
  console.log(`  mask direct HYB4 (từ render plain bilinear): ${(maskInfo.frac * 100).toFixed(1)}% pixel direct (${maskInfo.nDirect}/${vw * vh})`);
  report.directFrac = +maskInfo.frac.toFixed(4);

  for (const v of VARIANTS) {
    report.variants[v] = {};
    for (const scaler of SCALERS) {
      const fb = frames[scaler][v];
      const fp = frames[scaler].plain;
      if (!fb || !snaps[v]) { report.variants[v][scaler] = { error: "thiếu frame/snapshot" }; failCount++; continue; }
      const floor = compareAbsolute(snaps.plain, fp, vw, vh, rect);
      const entry = { floor: { n: floor.n, mad: floor.mad, le8: floor.le8, le32: floor.le32, verdict: verdictMad(floor) } };
      const abs = compareAbsolute(snaps[v], fb, vw, vh, rect);
      entry.absolute = { n: abs.n, mad: abs.mad, le8: abs.le8, le32: abs.le32, verdict: verdictMad(abs) };
      if (v === "sharp05" || v === "sharp10") {
        const d = deltaFloorSubtracted(snaps.plain, snaps[v], fp, fb, vw, vh, rect, floor, maskInfo);
        entry.delta = { ...d, verdictRaw: verdictMad({ mad: d.deltaMad, le8: d.deltaLe8, le32: d.deltaLe32 }), verdictFloorSub: verdictFloorSub(d) };
        console.log(`  ${v} ${scaler}: floor MAD=${floor.mad} le8=${(floor.le8 * 100).toFixed(1)}% | delta MAD=${d.deltaMad} le8=${(d.deltaLe8 * 100).toFixed(1)}% → ${entry.delta.verdictRaw} | TRỪ SÀN le8_net=${(d.le8Net * 100).toFixed(2)}% le8_net_nb=${(d.le8NetNb * 100).toFixed(2)}% mad_net_quad=${d.madNetQuad} mad_clean=${d.madClean} → ${entry.delta.verdictFloorSub} | direct ${(maskInfo.frac * 100).toFixed(1)}%: deltaMadMax=${d.branch.direct.deltaMadMaxMean} le8_net=${(d.branch.direct.le8NetFrac * 100).toFixed(2)}% vs add: deltaMadMax=${d.branch.add.deltaMadMaxMean} le8_net=${(d.branch.add.le8NetFrac * 100).toFixed(2)}%`);
      } else {
        console.log(`  ${v} ${scaler}: floor MAD=${floor.mad} le8=${(floor.le8 * 100).toFixed(1)}% le32=${(floor.le32 * 100).toFixed(1)}% → ${entry.floor.verdict}`);
      }
      report.variants[v][scaler] = entry;
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`JSON kết quả: ${OUT}`);
  process.exitCode = failCount ? 1 : 0;
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e instanceof Error ? e.stack || e.message : e}`);
  process.exitCode = 2;
});
