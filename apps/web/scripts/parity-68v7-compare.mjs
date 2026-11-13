#!/usr/bin/env node
/**
 * parity-68v7-compare.mjs — Phase 9 đợt 68, luồng V7: compare sharpen với
 * metric trừ sàn cải tiến (đóng nợ U3 §9 mục 2: le8_net_nb under-correct
 * trên texture cao tần).
 *
 * Hai chế độ (R68V7_MODE):
 *  - headed (mặc định): phân tích lại snaps headed (lưới step 4) + frame
 *    render pre-encode. Metric chính VẪN là le8_net_nb của U3 (xem dưới);
 *    thêm phân tích per-cell (ô 16×16 mẫu) và 2 metric lưới chẩn đoán.
 *  - fullres: phân tích shots full-res within-decoder-exact (scale 1,0)
 *    + frame render. Metric chính là le8_net_hp (cao tần luma, blur 5×5
 *    đúng kernel sharpen) và le8_net_est (thêm sai số estimator).
 *
 * KẾT LUẬN PHƯƠNG PHÁP (đợt 68 V7, xem docs/PHASE9_ROUND68_V7_SHARPEN_RESIDUAL_LIMITS.md):
 *  - M-hp LƯỚI (D_Y − mean 3×3 mẫu lưới): BÁC — tệ hơn le8_net_nb cũ ở
 *    hầu hết các ô (vd ocean w1440 sharp10: 6,08% vs 2,15%; testsrc2 w1to1
 *    sharp10: 2,21% vs 0,12%). Nguyên nhân: lưới step 4 alias trường sàn
 *    ở thang blur 5px, và mô hình luma-thuần bỏ sót sai số estimator +
 *    nhánh direct + clip. Script vẫn in số này để chẩn đoán, KHÔNG dùng
 *    làm verdict ở chế độ headed.
 *  - M-range LƯỚI (amount × range D_Y trên 3×3 mẫu): CHỈ DÙNG THAM KHẢO —
 *    xoá được phần dư ocean/basgo (0,02–0,45%) nhưng VI PHẠM quy tắc
 *    chấp nhận trên testsrc2 w2560 sharp05 (HYB4 1,55% > 1% trong khi
 *    metric cũ cho KHỚP 0,46%; đảo thứ hạng vs S7). Chỉ có ý nghĩa trên
 *    cảnh add-dominated, không phải metric chung.
 *  - M-hp FULL-RES (D_Y − blur5(D_Y), blur đúng kernel [1,4,6,4,1]):
 *    CHẤP NHẬN — HYB4 0,00–0,17% trên cả 8 ô cảnh×mức; đối chứng âm
 *    amount×1,5 / blur 3-tap bị bắt (1,15–15,81% trên testsrc2+ocean);
 *    S7 tệ hơn HYB4 ở mọi nơi nó khác HYB4. Verdict fullres dùng metric này.
 *  - M-est full-res (thêm số hạng sai số estimator E_p): cho cùng verdict
 *    với M-hp trên dữ liệu này (phần dư là pixel nhánh direct, sàn luma
 *    nhỏ theo mọi nghĩa — cả 4 predictor trùng nhau); giữ lại để đối chứng.
 *  - Per-cell: phần dư ocean 100% nằm ở ô sàn bẩn (floorMad > 1,5);
 *    basgo w1440 tương tự. Đây là bằng chứng độc lập với mọi metric trừ sàn.
 *
 * Verdict headed: KHỚP-trừ-sàn ⇔ le8_net_nb ≤ 1% (quy tắc U3, giữ nguyên).
 * Verdict cell (phụ): KHỚP-theo-ô ⇔ residual (tập le8_net_nb) nằm ở ô sạch
 *   (floorMad ≤ 1,0) ≤ 0,05% tổng số điểm. Ocean/basgo-w1440 đạt 0%.
 * Verdict fullres: KHỚP-trừ-sàn-cao-tần ⇔ le8_net_hp ≤ 1%.
 *
 * Chạy:
 *   headed:  R68V7_MODE=headed R68V7_CONTENT=ocean R68V7_SNAPS=<snaps.json> node apps/web/scripts/parity-68v7-compare.mjs
 *   fullres: R68V7_MODE=fullres R68V7_CONTENT=ocean node apps/web/scripts/parity-68v7-compare.mjs
 * Env: R68V7_RENDER_DIR, R68V7_MEDIA (chỉ headed, khi cần trích pre-encode),
 *   R68V7_EXACT_DIR (fullres, mặc định hidden_files/round67-u3/within-decoder-exact/<content>),
 *   R68V7_OUT (đường dẫn report JSON).
 * Khung render: tái dùng frame-67u3-bilinear-*.raw đã trích nếu đúng cỡ,
 *   nếu không trích lại từ preencode-*.yuv bằng ffmpeg (cần ffmpeg ghi được;
 *   nếu bị chặn EPERM thì báo BLOCKER, exit 2 — xem round68-v7.md).
 * KHÔNG push/tag/binary. Chỉ đọc snaps/shots + preencode, ghi report JSON.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const HOME = os.homedir();
const GOALHF = path.join(HOME, "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const GOAL65 = path.join(GOALHF, "round65-s7");
const GOAL66 = path.join(GOALHF, "round66-t4");
const GOAL67 = path.join(GOALHF, "round67-u3");
const GOAL68 = path.join(GOALHF, "round68-v7");

const MODE = process.env.R68V7_MODE || "headed";
const CONTENT = process.env.R68V7_CONTENT || "ocean";
const AMOUNT = { sharp05: 1.1, sharp10: 2.0 };
const K5 = [1, 4, 6, 4, 1];
const TILE = 16;

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại (exit ${r.status}): ${(r.stderr || r.stdout || "").slice(0, 500)}`);
  return r;
}

// ---------- PNG decoder tối thiểu (8-bit, RGB/RGBA) — đã kiểm chứng khớp từng
// byte với ffmpeg trên shot ocean (r68v7-png-debug.mjs: 0/2764800 byte lệch) ----------
function decodePng(pngPath) {
  const buf = fs.readFileSync(pngPath);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`không phải PNG: ${pngPath}`);
  let off = 8, w = 0, h = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) throw new Error(`PNG không hỗ trợ: depth=${bitDepth} ctype=${colorType}`);
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  if (raw.length !== h * (stride + 1)) throw new Error(`PNG inflate sai kích thước: ${raw.length}`);
  const rgb = Buffer.alloc(w * h * 3);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v = (v + a) & 255;
      else if (f === 2) v = (v + b) & 255;
      else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else if (f !== 0) throw new Error(`filter PNG lạ: ${f}`);
      line[x] = v;
    }
    for (let x = 0; x < w; x++) {
      const si = x * bpp, di = (y * w + x) * 3;
      rgb[di] = line[si]; rgb[di + 1] = line[si + 1]; rgb[di + 2] = line[si + 2];
    }
    prev = line;
  }
  return { rgb, w, h };
}

// ---------- Estimator HYB4 (sao chép verbatim, như parity-67u3-compare.mjs) ----------
function rgbToYuv709(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return [16 + 219 * yl, 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722), 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126)];
}
function yuv709ToRgb(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function estimateNativeChroma(d, k) { const e = 128 + k * (d - 128); return e < 16 ? 16 : e > 240 ? 240 : e; }
function nativeLumaOffset(yD, cbE, crE) {
  const [r, g, b] = yuv709ToRgb(yD, cbE, crE);
  let off = 0;
  if (r > 255) off += 0.2126 * (r - 255); else if (r < 0) off += 0.2126 * r;
  if (g > 255) off += 0.7152 * (g - 255); else if (g < 0) off += 0.7152 * g;
  if (b > 255) off += 0.0722 * (b - 255); else if (b < 0) off += 0.0722 * b;
  return off * (219 / 255);
}
function estimateNativeY(yD, cbE, crE) {
  const o1 = nativeLumaOffset(yD, cbE, crE);
  return yD + (o1 + nativeLumaOffset(yD + o1, cbE, crE)) / 2;
}
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
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, nn = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= vw || y >= vh) continue;
      const p = (y * vw + x) * 3;
      const [, cb, cr] = rgbToYuv709(rgb[p], rgb[p + 1], rgb[p + 2]);
      sCb += cb; sCr += cr; nn++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma(sCb / nn, 1.04);
    estCr[i] = estimateNativeChroma(sCr / nn, 1.09);
  }
  let nDirect = 0;
  for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
    const i = y * vw + x, ci = (y >> 1) * cw + (x >> 1);
    const lumEst = estimateNativeY(lumY[i], estCb[ci], estCr[ci]);
    const [r0, g0, b0] = yuv709ToRgb(lumEst, estCb[ci], estCr[ci]);
    let direct = 0;
    for (const c of [r0, g0, b0]) {
      const excess = c > 255 ? c - 255 : c < 0 ? -c : 0;
      if (excess > 4) { direct = 1; break; }
    }
    mask[i] = direct;
    nDirect += direct;
  }
  return { mask, nDirect, frac: nDirect / (vw * vh) };
}
function estimateLumEst(rgb, w, h) {
  const lumY = new Float64Array(w * h), lumEst = new Float64Array(w * h);
  const CB = new Float64Array(w * h), CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    lumY[i] = 16 + (219 * (0.2126 * r + 0.7152 * g + 0.0722 * b)) / 255;
    const [, cb, cr] = rgbToYuv709(r, g, b);
    CB[i] = cb; CR[i] = cr;
  }
  const cw = (w + 1) >> 1, ch = (h + 1) >> 1;
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, nn = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= w || y >= h) continue;
      const i = y * w + x; sCb += CB[i]; sCr += CR[i]; nn++;
    }
    estCb[cy * cw + cx] = estimateNativeChroma(sCb / nn, 1.04);
    estCr[cy * cw + cx] = estimateNativeChroma(sCr / nn, 1.09);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = (y >> 1) * cw + (x >> 1);
    lumEst[i] = estimateNativeY(lumY[i], estCb[ci], estCr[ci]);
  }
  return { lumY, lumEst };
}
function blurSepArr(arr, w, h, K) {
  const r = K.length >> 1, ksum = K.reduce((a, b) => a + b, 0);
  const tmp = new Float64Array(w * h), out = new Float64Array(w * h);
  const at = (x, y, a) => a[(y < 0 ? 0 : y >= h ? h - 1 : y) * w + (x < 0 ? 0 : x >= w ? w - 1 : x)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let dx = -r; dx <= r; dx++) s += K[dx + r] * at(x + dx, y, arr);
    tmp[y * w + x] = s / ksum;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0; for (let dy = -r; dy <= r; dy++) s += K[dy + r] * at(x, y + dy, tmp);
    out[y * w + x] = s / ksum;
  }
  return out;
}

// ---------- Khung render: tái dùng frame đã trích, nếu không trích bằng ffmpeg ----------
function renderFrame(renderDir, v, vw, vh) {
  const reuse = path.join(renderDir, `frame-67u3-bilinear-${v}.raw`);
  if (fs.existsSync(reuse)) {
    const buf = fs.readFileSync(reuse);
    if (buf.length === vw * vh * 3) return buf;
  }
  // Cache probe đợt 68 (frame 1280×720 đã trích bằng ffmpeg trước khi bị chặn EPERM).
  const reuse2 = path.join(GOAL68, "scratch", "fullres", `${path.basename(renderDir)}-render-${v}-${vw}x${vh}.raw`);
  if (fs.existsSync(reuse2)) {
    const buf = fs.readFileSync(reuse2);
    if (buf.length === vw * vh * 3) return buf;
  }
  const yuv = path.join(renderDir, `preencode-${v}.yuv`);
  if (!fs.existsSync(yuv)) throw new Error(`BLOCKER: thiếu preencode ${yuv} (không có frame tái dùng)`);
  const raw = path.join(GOAL68, "scratch", "compare", `${path.basename(renderDir)}-${vw}x${vh}-${v}.raw`);
  fs.mkdirSync(path.dirname(raw), { recursive: true });
  if (!fs.existsSync(raw) || fs.readFileSync(raw).length !== vw * vh * 3) {
    run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-r", "30", "-i", yuv,
      "-vf", `select='eq(n,30)',scale=${vw}:${vh}:flags=bilinear:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", raw], `extract render ${v} ${vw}x${vh}`);
  }
  const buf = fs.readFileSync(raw);
  if (buf.length !== vw * vh * 3) throw new Error(`frame render sai kích thước ${v}`);
  return buf;
}
function yPlaneFrame(renderDir) {
  const yuv = path.join(renderDir, "preencode-plain.yuv");
  const fd = fs.openSync(yuv, "r");
  const frameSize = 1280 * 720 * 3 / 2;
  const buf = Buffer.alloc(1280 * 720);
  fs.readSync(fd, buf, 0, buf.length, 30 * frameSize);
  fs.closeSync(fd);
  return buf;
}

// ================= CHẾ ĐỘ HEADED =================
function runHeaded() {
  const SNAPS = process.env.R68V7_SNAPS ||
    (CONTENT === "testsrc2" ? path.join(GOAL66, "headed", "r66t4-preview-snaps-w1to1.json") : path.join(GOAL67, "headed", `${CONTENT}-w1to1-snaps.json`));
  const RENDER_DIR = process.env.R68V7_RENDER_DIR ||
    (CONTENT === "testsrc2" ? path.join(GOAL65, "render") : path.join(GOAL67, "render", CONTENT));
  const OUT = process.env.R68V7_OUT || path.join(GOAL68, "compare", `${CONTENT}-headed.json`);
  if (!fs.existsSync(SNAPS)) { console.error(`BLOCKER: thiếu snaps ${SNAPS}`); process.exitCode = 2; return; }
  const snaps = JSON.parse(fs.readFileSync(SNAPS, "utf8"));
  const plain = snaps.plain;
  if (!plain?.ok) { console.error("BLOCKER: snapshot plain thiếu/không ok"); process.exitCode = 2; return; }
  const rect = plain.rect;
  const vw = Math.round(rect.w), vh = Math.round(rect.h);
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const step = plain.step;
  const cols = Math.ceil(plain.w / step), rows = Math.ceil(plain.h / step);
  const pts = [];
  for (let i = 0; i < plain.n; i++) {
    const x = (i % cols) * step, y = Math.floor(i / cols) * step;
    if (x >= vx0 && x < vx0 + vw && y >= vy0 && y < vy0 + vh) pts.push({ i, x, y });
  }
  const n = pts.length;
  console.log(`headed content=${CONTENT} canvas ${plain.w}x${plain.h}, vùng video ${vw}x${vh} @(${vx0},${vy0}) scale=${rect.scale.toFixed(4)} n=${n}`);
  const frames = {};
  for (const v of ["plain", "sharp05", "sharp10"]) frames[v] = renderFrame(RENDER_DIR, v, vw, vh);
  const floorMax = new Float64Array(n), floorY = new Float64Array(n);
  let sumFloor = 0;
  for (let k = 0; k < n; k++) {
    const p = pts[k], rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3, pi = p.i * 3;
    let dmax = 0, dy = 0;
    for (let c = 0; c < 3; c++) {
      const d = plain.data[pi + c] - frames.plain[ri + c];
      sumFloor += Math.abs(d);
      if (Math.abs(d) > dmax) dmax = Math.abs(d);
      dy += [0.2126, 0.7152, 0.0722][c] * d;
    }
    floorMax[k] = dmax; floorY[k] = dy;
  }
  const floorMad = sumFloor / (n * 3);
  const fGrid = new Float64Array(plain.n).fill(NaN), yGrid = new Float64Array(plain.n).fill(NaN);
  for (let k = 0; k < n; k++) { fGrid[pts[k].i] = floorMax[k]; yGrid[pts[k].i] = floorY[k]; }
  const nbOf = (p, grid) => {
    const gx = p.i % cols, gy = Math.floor(p.i / cols);
    let mn = Infinity, mx = -Infinity, sum = 0, cnt = 0;
    for (let dyy = -1; dyy <= 1; dyy++) for (let dxx = -1; dxx <= 1; dxx++) {
      const xx = gx + dxx, yy = gy + dyy;
      if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
      const v = grid[yy * cols + xx];
      if (Number.isNaN(v)) continue;
      if (v < mn) mn = v; if (v > mx) mx = v; sum += v; cnt++;
    }
    return { mn, mx, mean: cnt ? sum / cnt : 0 };
  };
  const report = { mode: "headed", content: CONTENT, snaps: SNAPS,
    canvas: { w: plain.w, h: plain.h }, videoRect: { x: vx0, y: vy0, w: vw, h: vh, scale: rect.scale },
    n, floorMad: +floorMad.toFixed(3), levels: {} };
  for (const lv of ["sharp05", "sharp10"]) {
    if (!snaps[lv]?.ok) { report.levels[lv] = { error: "thiếu snapshot" }; continue; }
    const amount = AMOUNT[lv];
    const snapB = snaps[lv];
    let sumDelta = 0, le8 = 0, netNb = 0, netHp = 0, netRange = 0, nErr8 = 0, explHp = 0, explRange = 0;
    const tcols = Math.ceil(vw / (TILE * step)), trows = Math.ceil(vh / (TILE * step));
    const tiles = [];
    for (let ty = 0; ty < trows; ty++) for (let tx = 0; tx < tcols; tx++)
      tiles.push({ tx, ty, n: 0, sumFloor: 0, le8: 0, residNb: 0, residHp: 0, residRange: 0 });
    for (let k = 0; k < n; k++) {
      const p = pts[k], rx = p.x - vx0, ry = p.y - vy0;
      const ri = (ry * vw + rx) * 3, pi = p.i * 3;
      let dmax = 0;
      for (let c = 0; c < 3; c++) {
        const dp = snapB.data[pi + c] - plain.data[pi + c];
        const dr = frames[lv][ri + c] - frames.plain[ri + c];
        const d = Math.abs(dp - dr);
        sumDelta += d;
        if (d > dmax) dmax = d;
      }
      const nb = nbOf(p, fGrid), nbY = nbOf(p, yGrid);
      const predHp = amount * Math.abs(floorY[k] - nbY.mean);
      const predRange = amount * (nbY.mx - nbY.mn);
      if (dmax <= 8) le8++;
      const rNb = dmax > 8 && nb.mx <= 8, rHp = dmax > 8 && predHp <= 8, rRg = dmax > 8 && predRange <= 8;
      if (rNb) netNb++;
      if (rHp) netHp++;
      if (rRg) netRange++;
      if (dmax > 8) { nErr8++; if (predHp > 8) explHp++; if (predRange > 8) explRange++; }
      const tx = Math.floor((p.x - vx0) / (TILE * step)), ty = Math.floor((p.y - vy0) / (TILE * step));
      const t = tiles[ty * tcols + tx];
      t.n++; t.sumFloor += floorMax[k];
      if (dmax <= 8) t.le8++;
      if (rNb) t.residNb++;
      if (rHp) t.residHp++;
      if (rRg) t.residRange++;
    }
    let residNbClean = 0, nCleanTiles = 0, maxTileFloor = 0;
    for (const t of tiles) {
      if (!t.n) continue;
      t.floorMad = +(t.sumFloor / t.n).toFixed(3);
      t.floorLe8 = +(t.le8 / t.n).toFixed(4);
      delete t.sumFloor; delete t.le8;
      if (t.floorMad > maxTileFloor) maxTileFloor = t.floorMad;
      if (t.floorMad <= 1.0) { nCleanTiles++; residNbClean += t.residNb; }
    }
    const le8NetNb = netNb / n;
    const cleanFrac = residNbClean / n;
    report.levels[lv] = {
      deltaMad: +(sumDelta / (n * 3)).toFixed(3), deltaLe8: +(le8 / n).toFixed(4),
      le8NetNb: +le8NetNb.toFixed(4),
      le8NetHpGrid: +(netHp / n).toFixed(4), // CHẨN ĐOÁN — BÁC làm verdict lưới (xem header)
      le8NetRangeGrid: +(netRange / n).toFixed(4), // CHẨN ĐOÁN — chỉ tham khảo
      nErr8, err8ExplHp: nErr8 ? +(explHp / nErr8).toFixed(3) : null,
      err8ExplRange: nErr8 ? +(explRange / nErr8).toFixed(3) : null,
      verdictFloorSub: le8NetNb <= 0.01 ? "KHỚP-trừ-sàn" : le8NetNb <= 0.10 ? "XẤP XỈ-trừ-sàn" : "LỆCH-trừ-sàn",
      tiles: { nTiles: tiles.length, nCleanTiles, maxTileFloor: +maxTileFloor.toFixed(3),
        residNbClean, residNbCleanFrac: +cleanFrac.toFixed(4),
        verdictCell: cleanFrac <= 0.0005 ? "KHỚP-theo-ô" : "dư-không-tập-trung-ô-bẩn" },
      tileDetail: tiles.map((t) => [t.tx, t.ty, t.n, t.floorMad, t.floorLe8, t.residNb, t.residHp, t.residRange]),
    };
    console.log(`  ${lv}: floorMAD=${floorMad.toFixed(3)} deltaMAD=${report.levels[lv].deltaMad} le8netNB=${(100 * le8NetNb).toFixed(2)}% → ${report.levels[lv].verdictFloorSub} | le8netHP-lưới=${(100 * netHp / n).toFixed(2)}% le8netRange-lưới=${(100 * netRange / n).toFixed(2)}% (chẩn đoán) | ô sạch: dư ${residNbClean} (${(100 * cleanFrac).toFixed(2)}% điểm) → ${report.levels[lv].tiles.verdictCell}`);
  }
  writeReport(OUT, report);
}

// ================= CHẾ ĐỘ FULLRES =================
function runFullres() {
  const EXACT_DIR = process.env.R68V7_EXACT_DIR || path.join(GOAL67, "within-decoder-exact", CONTENT);
  const RENDER_DIR = process.env.R68V7_RENDER_DIR ||
    (CONTENT === "testsrc2" ? path.join(GOAL65, "render") : path.join(GOAL67, "render", CONTENT));
  const OUT = process.env.R68V7_OUT || path.join(GOAL68, "compare", `${CONTENT}-fullres.json`);
  const geo = JSON.parse(fs.readFileSync(path.join(EXACT_DIR, "r67u3-within-decoder-geo.json"), "utf8"));
  const shots = {};
  for (const v of ["plain", "sharp05", "sharp10"]) {
    const { rgb, w, h } = decodePng(path.join(EXACT_DIR, `r67u3-shot-${v}.png`));
    const rx = Math.round(geo.rect.x), ry = Math.round(geo.rect.y);
    const vw = Math.round(geo.rect.w), vh = Math.round(geo.rect.h);
    const sx = w / geo.bitmap.w, sy = h / geo.bitmap.h;
    const cx = Math.round(rx * sx), cy = Math.round(ry * sy), cw = Math.round(vw * sx), ch = Math.round(vh * sy);
    const crop = Buffer.alloc(cw * ch * 3);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const si = ((cy + y) * w + (cx + x)) * 3, di = (y * cw + x) * 3;
      crop[di] = rgb[si]; crop[di + 1] = rgb[si + 1]; crop[di + 2] = rgb[si + 2];
    }
    shots[v] = { rgb: crop, w: cw, h: ch };
  }
  const { w: vw, h: vh } = shots.plain;
  const n = vw * vh;
  console.log(`fullres content=${CONTENT} video ${vw}x${vh} (geo scale ${geo.rect.scale})`);
  const rsPlain = renderFrame(RENDER_DIR, "plain", vw, vh);
  const rs05 = renderFrame(RENDER_DIR, "sharp05", vw, vh);
  const rs10 = renderFrame(RENDER_DIR, "sharp10", vw, vh);
  const dY = new Float64Array(n);
  for (let i = 0; i < n; i++)
    dY[i] = 0.2126 * (shots.plain.rgb[i * 3] - rsPlain[i * 3]) + 0.7152 * (shots.plain.rgb[i * 3 + 1] - rsPlain[i * 3 + 1]) + 0.0722 * (shots.plain.rgb[i * 3 + 2] - rsPlain[i * 3 + 2]);
  const dYblur = blurSepArr(dY, vw, vh, K5);
  const dYrange = new Float64Array(n);
  const fmax = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let m = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(shots.plain.rgb[i * 3 + c] - rsPlain[i * 3 + c]); if (d > m) m = d; }
    fmax[i] = m;
  }
  const floorMax5 = new Float64Array(n);
  for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
    let mn = Infinity, mx = -Infinity, fm = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= vw || yy >= vh) continue;
      const v = dY[yy * vw + xx];
      if (v < mn) mn = v; if (v > mx) mx = v;
      const fv = fmax[yy * vw + xx];
      if (fv > fm) fm = fv;
    }
    dYrange[y * vw + x] = mx - mn;
    floorMax5[y * vw + x] = fm; // mảng riêng — KHÔNG ghi đè fmax tại chỗ (sẽ làm max lan truyền sai)
  }
  let predEst = null;
  if (vw === 1280 && vh === 720) {
    const { lumEst } = estimateLumEst(shots.plain.rgb, vw, vh);
    const yf = yPlaneFrame(RENDER_DIR);
    const yfBlur = blurSepArr(Float64Array.from(yf), 1280, 720, K5);
    const lumEstBlur = blurSepArr(lumEst, vw, vh, K5);
    predEst = new Float64Array(n);
    for (let i = 0; i < n; i++) predEst[i] = (lumEst[i] - lumEstBlur[i]) - (yf[i] - yfBlur[i]);
  } else console.log("  (bỏ qua pred_est: video không phải 1280x720)");
  const report = { mode: "fullres", content: CONTENT, size: { w: vw, h: vh }, levels: {} };
  const maskShot = directMask(shots.plain.rgb, vw, vh);
  const maskRender = directMask(rsPlain, vw, vh);
  for (const [lv, rs] of [["sharp05", rs05], ["sharp10", rs10]]) {
    const amount = AMOUNT[lv];
    let nErr8 = 0, netHp = 0, netRange = 0, netNb5 = 0, netEst = 0, explHp = 0, explRange = 0, explEst = 0;
    let dShot = 0, dRender = 0, dEither = 0;
    let sumAbs = 0, le8 = 0;
    for (let i = 0; i < n; i++) {
      let dmax = 0, amax = 0;
      for (let c = 0; c < 3; c++) {
        const dp = shots[lv].rgb[i * 3 + c] - shots.plain.rgb[i * 3 + c];
        const dr = rs[i * 3 + c] - rsPlain[i * 3 + c];
        const d = Math.abs(dp - dr);
        sumAbs += d;
        if (d > dmax) dmax = d;
        const da = Math.abs((shots.plain.rgb[i * 3 + c] + dp) - rs[i * 3 + c]);
        if (da > amax) amax = da;
      }
      if (amax <= 8) le8++;
      if (dmax <= 8) continue;
      nErr8++;
      const pHp = amount * Math.abs(dY[i] - dYblur[i]);
      const pRange = amount * dYrange[i];
      if (pHp > 8) explHp++; else netHp++;
      if (pRange > 8) explRange++; else netRange++;
      if (floorMax5[i] <= 8) netNb5++;
      if (predEst) {
        const pEst = amount * Math.abs(predEst[i]);
        if (pEst > 8) explEst++; else netEst++;
      }
      const a = maskShot.mask[i], b = maskRender.mask[i];
      if (a) dShot++;
      if (b) dRender++;
      if (a || b) dEither++;
    }
    const le8NetHp = netHp / n;
    report.levels[lv] = {
      deltaMad: +(sumAbs / (n * 3)).toFixed(3), crossLe8: +(le8 / n).toFixed(4),
      nErr8, err8Frac: +(nErr8 / n).toFixed(4),
      le8NetHp: +le8NetHp.toFixed(4), le8NetRange5: +(netRange / n).toFixed(4),
      le8NetNb5: +(netNb5 / n).toFixed(4), le8NetEst: predEst ? +(netEst / n).toFixed(4) : null,
      err8ExplHp: nErr8 ? +(explHp / nErr8).toFixed(3) : null,
      err8ExplRange: nErr8 ? +(explRange / nErr8).toFixed(3) : null,
      err8ExplEst: predEst && nErr8 ? +(explEst / nErr8).toFixed(3) : null,
      verdictFloorSubHp: le8NetHp <= 0.01 ? "KHỚP-trừ-sàn-cao-tần" : le8NetHp <= 0.10 ? "XẤP XỈ-trừ-sàn-cao-tần" : "LỆCH-trừ-sàn-cao-tần",
      directDiag: { directFracShot: +maskShot.frac.toFixed(4), directFracRender: +maskRender.frac.toFixed(4),
        errDirectShot: nErr8 ? +(dShot / nErr8).toFixed(3) : null,
        errDirectRender: nErr8 ? +(dRender / nErr8).toFixed(3) : null,
        errDirectEither: nErr8 ? +(dEither / nErr8).toFixed(3) : null },
    };
    console.log(`  ${lv}: delta MAD=${report.levels[lv].deltaMad} | tuyệt đối le8=${report.levels[lv].crossLe8} | nErr8=${nErr8} netHp=${(100 * le8NetHp).toFixed(2)}% netRange5=${(100 * netRange / n).toFixed(2)}% netEst=${predEst ? (100 * netEst / n).toFixed(2) + "%" : "n/a"} → ${report.levels[lv].verdictFloorSubHp} | dư là direct: shot ${report.levels[lv].directDiag.errDirectShot} either ${report.levels[lv].directDiag.errDirectEither}`);
  }
  writeReport(OUT, report);
}

function writeReport(outPath, report) {
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileEpermRetry(outPath, JSON.stringify(report, null, 2));
    console.log(`JSON kết quả: ${outPath}`);
  } catch (e) {
    console.log(`(ghi file thất bại: ${e.message} — in tóm tắt JSON ra stdout để lưu tay)`);
    console.log(`R68V7-REPORT-JSON-BEGIN ${report.content}-${report.mode}`);
    console.log(JSON.stringify(report));
    console.log(`R68V7-REPORT-JSON-END ${report.content}-${report.mode}`);
  }
  process.exitCode = 0;
}

async function main() {
  if (MODE === "headed") runHeaded();
  else if (MODE === "fullres") runFullres();
  else { console.error(`R68V7_MODE không hợp lệ: ${MODE} (headed|fullres)`); process.exitCode = 2; }
}
main().catch((e) => { console.error(`HARNESS LỖI: ${e instanceof Error ? e.stack || e.message : e}`); process.exitCode = 2; });
