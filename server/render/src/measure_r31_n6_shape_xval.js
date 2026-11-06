#!/usr/bin/env node
/**
 * measure_r31_n6_shape_xval.js — Phase 9 đợt 31, luồng N6 (thí nghiệm
 * chéo cho hiệu chuẩn dạng đường cong).
 *
 * Câu hỏi: đường cong trọng số suy ra trực tiếp từ probe xfade đơn
 * (nội suy tuyến tính qua các nút p cách 0,05, trung bình 3 type) có
 * phải là hiệu chuẩn thật hay chỉ là overfit cặp màu đỏ→xanh lá?
 * Thí nghiệm chéo (không dùng dữ liệu fit):
 *  (a) cặp màu MỚI phẳng blue→yellow→cyan, lưới cặp 15 ô exact-p
 *      120fps + lưới xfade đơn 3 type × 21 p;
 *  (b) footage K->L->J exact-p 120fps, 6 ô.
 * So sánh CUR (smoothstep sản phẩm) vs SHAPE (nút đảo ngược) trên
 * cùng chuỗi tham chiếu. Hồi quy = MAD tăng > 0,5 hoặc tụt verdict
 * so với CUR. Chỉ khi SHAPE thắng cả (a)+(b) không hồi quy thì mới
 * xem xét đưa vào code sản phẩm.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const JSON_OUT = getOpt("--json", null);
const FOOTDIR = getOpt("--footdir", path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-n6-r31x-"));
const FILE_K = path.join(FOOTDIR, "clip-k-dod-iwo.mp4");
const FILE_J = path.join(FOOTDIR, "clip-j-dod-pistol.mp4");
const FILE_L = path.join(FOOTDIR, "clip-l-nasa-avatar-vertical.mp4");

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(a) { return run("ffmpeg", ["-v", "error", ...a]); }
function rm(f) { try { fs.unlinkSync(f); } catch { /* bỏ qua */ } }
let tagSeq = 0;
function tag(p) { return `${p}-${tagSeq++}`; }
function classify(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le8 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
function compareFrames(a, b) {
  let sum = 0, le8 = 0, maxD = 0;
  const n = a.length;
  for (let k = 0; k < n; k++) {
    const d = Math.abs(a[k] - b[k]);
    sum += d; if (d <= 8) le8++; if (d > maxD) maxD = d;
  }
  return { mad: sum / n, le8: le8 / n, maxDiff: maxD };
}
function fmt(m) { return `MAD=${m.mad.toFixed(4)} le8=${(m.le8 * 100).toFixed(2)}% max=${m.maxDiff} ${classify(m)}`; }

/* Đường cong sản phẩm (smoothstep) và đường cong SHAPE (nút đảo ngược). */
function smooth(t) { const c = t < 0 ? 0 : t > 1 ? 1 : t; return 3 * c * c - 2 * c * c * c; }
function weightsCUR(p) {
  return {
    aAlpha: p <= 0 ? 1 : 1 - smooth((p + 0.01) / 0.206),
    bAlpha: p >= 1 ? 1 : smooth((p - 0.122) / 0.954),
  };
}
const KNOTS = [
  [0.00, 1.0000, 0.0000], [0.05, 0.8012, 0.0005], [0.10, 0.4497, 0.0039],
  [0.15, 0.1329, 0.0128], [0.20, 0.0000, 0.0288], [0.25, 0.0000, 0.0562],
  [0.30, 0.0000, 0.0955], [0.35, 0.0000, 0.1427], [0.40, 0.0000, 0.2004],
  [0.45, 0.0000, 0.2659], [0.50, 0.0000, 0.3435], [0.55, 0.0000, 0.4191],
  [0.60, 0.0000, 0.5059], [0.65, 0.0000, 0.5884], [0.70, 0.0000, 0.6697],
  [0.75, 0.0000, 0.7419], [0.80, 0.0000, 0.8007], [0.85, 0.0000, 0.8479],
  [0.90, 0.0000, 0.8989], [0.95, 0.0000, 0.9476], [1.00, 0.0000, 1.0000],
];
function weightsSHAPE(p) {
  const interp = (knots, col) => {
    if (p <= 0) return knots[0][col];
    if (p >= 1) return knots[knots.length - 1][col];
    for (let i = 1; i < knots.length; i++) {
      if (p <= knots[i][0]) {
        const t = (p - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0]);
        return knots[i - 1][col] + t * (knots[i][col] - knots[i - 1][col]);
      }
    }
    return knots[knots.length - 1][col];
  };
  if (process.env.SHAPE_CLAMP === "1") {
    // Biến thể kẹp: bB = 0 tới p=0,12 (giữ đúng test b(0.12)===0),
    // sau đó nội suy lên nút 0,15; aA giữ bảng nút gốc.
    const BK = [[0.00, 0.0000], [0.05, 0.0000], [0.10, 0.0000], [0.12, 0.0000],
      [0.15, 0.0128], [0.20, 0.0288], [0.25, 0.0562], [0.30, 0.0955],
      [0.35, 0.1427], [0.40, 0.2004], [0.45, 0.2659], [0.50, 0.3435],
      [0.55, 0.4191], [0.60, 0.5059], [0.65, 0.5884], [0.70, 0.6697],
      [0.75, 0.7419], [0.80, 0.8007], [0.85, 0.8479], [0.90, 0.8989],
      [0.95, 0.9476], [1.00, 1.0000]];
    if (p <= 0) return { aAlpha: 1, bAlpha: 0 };
    if (p >= 1) return { aAlpha: 0, bAlpha: 1 };
    let b = 0;
    for (let i = 1; i < BK.length; i++) {
      if (p <= BK[i][0]) { b = BK[i - 1][1] + ((p - BK[i - 1][0]) / (BK[i][0] - BK[i - 1][0])) * (BK[i][1] - BK[i - 1][1]); break; }
    }
    return { aAlpha: interp(KNOTS, 1), bAlpha: b };
  }
  if (p <= 0) return { aAlpha: 1, bAlpha: 0 };
  if (p >= 1) return { aAlpha: 0, bAlpha: 1 };
  for (let i = 1; i < KNOTS.length; i++) {
    if (p <= KNOTS[i][0]) {
      const [p0, a0, b0] = KNOTS[i - 1], [p1, a1, b1] = KNOTS[i];
      const t = (p - p0) / (p1 - p0);
      return { aAlpha: a0 + t * (a1 - a0), bAlpha: b0 + t * (b1 - b0) };
    }
  }
  return { aAlpha: 0, bAlpha: 1 };
}
function grayOf(px) { return (px[0] + px[1] + px[2]) / 3; }
function compPixels(A, B, type, p, wf) {
  const { aAlpha, bAlpha } = wf(p);
  const dipA = 1 - p - aAlpha, dipB = p - bAlpha;
  const mode = type === "fadeblack" ? "black" : type === "fadewhite" ? "white" : "gray";
  const npix = A.length / 3;
  const out = Buffer.alloc(A.length);
  for (let i = 0; i < npix; i++) {
    const o = i * 3;
    const midA = mode === "black" ? 0 : mode === "white" ? 255 : grayOf([A[o], A[o + 1], A[o + 2]]);
    const midB = mode === "black" ? 0 : mode === "white" ? 255 : grayOf([B[o], B[o + 1], B[o + 2]]);
    out[o] = Math.round(aAlpha * A[o] + bAlpha * B[o] + dipA * midA + dipB * midB);
    out[o + 1] = Math.round(aAlpha * A[o + 1] + bAlpha * B[o + 1] + dipA * midA + dipB * midB);
    out[o + 2] = Math.round(aAlpha * A[o + 2] + bAlpha * B[o + 2] + dipA * midA + dipB * midB);
  }
  return out;
}
function modelM2(A, B, C, inType, outType, p1, p2, wf) {
  return compPixels(compPixels(A, B, inType, p1, wf), C, outType, p2, wf);
}
function flatFrame(color, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=${fps}`,
    "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function meanPixel(buf) {
  const n = buf.length / 3;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < buf.length; i += 3) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; }
  return [r / n, g / n, b / n];
}
function singleChainFrame(type, colA, colB, p, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + p) * fps);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=${fps}`,
    "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=4:r=${fps}`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=3,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function chainedFlatFrame(inType, outType, colA, colB, colC, localT, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + localT) * fps);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=${fps}`,
    "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=1.5:r=${fps}`,
    "-f", "lavfi", "-i", `color=${colC}:s=${W}x${H}:d=4:r=${fps}`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[2:v]format=rgb24[c];[a][b]xfade=transition=${inType}:duration=1:offset=3[ab];[ab][c]xfade=transition=${outType}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function normFrame(file, ss, idx, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  ffmpeg(["-ss", String(ss), "-i", file,
    "-vf", `fps=${fps},scale=${W}:${H},format=rgb24,settb=AVTB,select='eq(n,${idx})'`,
    "-vsync", "0", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function chainedFootFrame(inType, outType, localT, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + localT) * fps);
  const norm = `fps=${fps},scale=${W}:${H},format=rgb24,settb=AVTB`;
  ffmpeg(["-vsync", "0", "-ss", "28", "-t", "4", "-i", FILE_K,
    "-ss", "24", "-t", "1.5", "-i", FILE_L,
    "-ss", "28", "-t", "4", "-i", FILE_J,
    "-filter_complex", `[0:v]${norm}[a];[1:v]${norm}[b];[2:v]${norm}[c];[a][b]xfade=transition=${inType}:duration=1:offset=3[ab];[ab][c]xfade=transition=${outType}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
const COMBOS = [
  { inType: "fadewhite", outType: "fadewhite" },
  { inType: "fadegrays", outType: "fadewhite" },
  { inType: "fadewhite", outType: "fadegrays" },
  { inType: "fadeblack", outType: "fadeblack" },
  { inType: "fadeblack", outType: "fadewhite" },
];
const LOCALTS = [0.6, 0.75, 0.9];
function regress(cur, shp) {
  const order = v => v === "KHỚP" ? 0 : v === "XẤP XỈ" ? 1 : 2;
  return shp.mad > cur.mad + 0.5 || order(shp.verdict) > order(cur.verdict);
}
const out = {};
// (a1) Cặp màu mới: blue -> yellow -> cyan, phẳng exact-p.
{
  console.log("== N6-xval (a1): cặp màu mới blue/yellow/cyan, phẳng 120fps ==");
  const W = 320, H = 180, fps = 120;
  const A = flatFrame("blue", W, H, fps, tag("x-A"));
  const B = flatFrame("yellow", W, H, fps, tag("x-B"));
  const C = flatFrame("cyan", W, H, fps, tag("x-C"));
  console.log(`pure A(blue)=${JSON.stringify(meanPixel(A))} B(yellow)=${JSON.stringify(meanPixel(B))} C(cyan)=${JSON.stringify(meanPixel(C))}`);
  const rows = [];
  for (const { inType, outType } of COMBOS) {
    for (const localT of LOCALTS) {
      const chain = chainedFlatFrame(inType, outType, "blue", "yellow", "cyan", localT, W, H, fps, tag("x-chain"));
      const gc = compareFrames(chain, modelM2(A, B, C, inType, outType, localT, localT - 0.5, weightsCUR));
      const gs = compareFrames(chain, modelM2(A, B, C, inType, outType, localT, localT - 0.5, weightsSHAPE));
      const cur = { mad: +gc.mad.toFixed(4), le8: +gc.le8.toFixed(4), verdict: classify(gc) };
      const shp = { mad: +gs.mad.toFixed(4), le8: +gs.le8.toFixed(4), verdict: classify(gs) };
      console.log(`flat-new | ${inType}/${outType} localT=${localT} | CUR ${fmt(gc)} | SHAPE ${fmt(gs)} | regress=${regress(cur, shp)}`);
      rows.push({ kind: "flat-new", inType, outType, localT, cur, shp, regress: regress(cur, shp) });
    }
  }
  out.flatNew = rows;
}
// (a2) Xfade đơn màu mới: blue -> yellow, 3 type x 21 p.
{
  console.log("== N6-xval (a2): xfade đơn màu mới blue->yellow 120fps ==");
  const W = 320, H = 180, fps = 120;
  const A = flatFrame("blue", W, H, fps, tag("x-sA"));
  const B = flatFrame("yellow", W, H, fps, tag("x-sB"));
  const rows = [];
  for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
    for (let k = 0; k <= 20; k++) {
      const p = +(k * 0.05).toFixed(2);
      const chain = singleChainFrame(type, "blue", "yellow", p, W, H, fps, tag("x-single"));
      const gc = compareFrames(chain, compPixels(A, B, type, p, weightsCUR));
      const gs = compareFrames(chain, compPixels(A, B, type, p, weightsSHAPE));
      const cur = { mad: +gc.mad.toFixed(4), le8: +gc.le8.toFixed(4), verdict: classify(gc) };
      const shp = { mad: +gs.mad.toFixed(4), le8: +gs.le8.toFixed(4), verdict: classify(gs) };
      rows.push({ type, p, cur, shp, regress: regress(cur, shp) });
    }
  }
  const mean = rs => rs.reduce((s, r) => s + r.mad, 0) / rs.length;
  const worst = rs => Math.max(...rs.map(r => r.mad));
  for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
    const sub = rows.filter(r => r.type === type);
    console.log(`single-new | ${type} CUR meanMAD=${mean(sub.map(r => r.cur)).toFixed(3)} worst=${worst(sub.map(r => r.cur)).toFixed(3)} | SHAPE meanMAD=${mean(sub.map(r => r.shp)).toFixed(3)} worst=${worst(sub.map(r => r.shp)).toFixed(3)} | nRegress=${sub.filter(r => r.regress).length}/21`);
  }
  out.singleNew = rows;
}
// (b) Footage exact-p.
{
  console.log("== N6-xval (b): footage K->L->J 120fps ==");
  const W = 360, H = 640, fps = 120;
  const rows = [];
  for (const { inType, outType } of [
    { inType: "fadewhite", outType: "fadewhite" },
    { inType: "fadeblack", outType: "fadewhite" },
  ]) {
    for (const localT of LOCALTS) {
      const n = Math.round((3 + localT) * fps);
      const A = normFrame(FILE_K, 28, n, W, H, fps, tag("x-fA"));
      const B = normFrame(FILE_L, 24, Math.round(localT * fps), W, H, fps, tag("x-fB"));
      const C = normFrame(FILE_J, 28, Math.round((localT - 0.5) * fps), W, H, fps, tag("x-fC"));
      const chain = chainedFootFrame(inType, outType, localT, W, H, fps, tag("x-fchain"));
      const gc = compareFrames(chain, modelM2(A, B, C, inType, outType, localT, localT - 0.5, weightsCUR));
      const gs = compareFrames(chain, modelM2(A, B, C, inType, outType, localT, localT - 0.5, weightsSHAPE));
      const cur = { mad: +gc.mad.toFixed(4), le8: +gc.le8.toFixed(4), verdict: classify(gc) };
      const shp = { mad: +gs.mad.toFixed(4), le8: +gs.le8.toFixed(4), verdict: classify(gs) };
      console.log(`foot | K->L->J ${inType}/${outType} localT=${localT} | CUR ${fmt(gc)} | SHAPE ${fmt(gs)} | regress=${regress(cur, shp)}`);
      rows.push({ kind: "footage", inType, outType, localT, cur, shp, regress: regress(cur, shp) });
    }
  }
  out.footage = rows;
}
if (JSON_OUT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(out, null, 2));
  console.log(`JSON: ${p}`);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
