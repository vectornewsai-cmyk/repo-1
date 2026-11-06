#!/usr/bin/env node
/**
 * measure_r32_o1_scan06.js — Phase 9 đợt 32, luồng O1 (quét bổ sung).
 *
 * Câu hỏi: ứng cử strict O1 làm ô FW/FG phẳng gốc 0,6 tụt tier so
 * với N6 (1,3333 KHỚP -> 2,3333 XẤP XỈ, bằng đúng mức CUR) vì nút
 * B@0,6 phải về gần CUR để sửa ô single fadegrays 0,6. Ô cặp 0,6
 * còn phụ thuộc A@0,1 (p2 = 0,1) mà descent đã đóng băng — quét 2D
 * (B@0,6 × A@0,1) xem có cặp giá trị nào vừa giữ FW/FG 0,6 KHỚP
 * (MAD<=2) vừa không tăng MAD ô nào so với CUR trên các ô liên
 * quan (cặp localT=0,6 cả 2 bộ màu phẳng + single p=0,1/0,6 cả 2
 * bộ màu) hay không. Nếu không có, trade-off là không thể tránh
 * bằng vặn 2 nút này (chứng minh bằng quét, không phải phỏng đoán).
 * Footage 0,6 không quét ở đây (đắt) — combo thắng (nếu có) sẽ
 * được kiểm chứng lại bằng lưới đầy đủ trước khi áp.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const ROOT = path.join(__dirname, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-o1-scan06-"));
function run(cmd, a) {
  const r = spawnSync(cmd, a, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} exit ${r.status}: ${(r.stderr || "").slice(0, 300)}`);
  return r;
}
function ffmpeg(a) { return run("ffmpeg", ["-v", "error", ...a]); }
function rm(f) { try { fs.unlinkSync(f); } catch { /* bỏ qua */ } }
let tagSeq = 0;
function tag(p) { return `${p}-${tagSeq++}`; }
function flatFrame(color, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  ffmpeg(["-f", "lavfi", "-i", `color=${color}:s=${W}x${H}:d=1:r=${fps}`, "-vf", `scale=${W}:${H},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function singleChainFrame(type, colA, colB, p, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + p) * fps);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=${fps}`, "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=4:r=${fps}`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[a][b]xfade=transition=${type}:duration=1:offset=3,format=rgb24,select='eq(n,${n})'[v]`, "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function chainedFlatFrame(inType, outType, colA, colB, colC, localT, W, H, fps, name) {
  const out = path.join(TMP, `${name}.raw`);
  const n = Math.round((3 + localT) * fps);
  ffmpeg(["-f", "lavfi", "-i", `color=${colA}:s=${W}x${H}:d=4:r=${fps}`, "-f", "lavfi", "-i", `color=${colB}:s=${W}x${H}:d=1.5:r=${fps}`, "-f", "lavfi", "-i", `color=${colC}:s=${W}x${H}:d=4:r=${fps}`,
    "-filter_complex", `[0:v]format=rgb24[a];[1:v]format=rgb24[b];[2:v]format=rgb24[c];[a][b]xfade=transition=${inType}:duration=1:offset=3[ab];[ab][c]xfade=transition=${outType}:duration=1:offset=3.5,format=rgb24,select='eq(n,${n})'[v]`, "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const b = fs.readFileSync(out); rm(out); return b;
}
function meanPixel(buf) {
  const n = buf.length / 3; let r = 0, g = 0, b = 0;
  for (let i = 0; i < buf.length; i += 3) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; }
  return [r / n, g / n, b / n];
}
function smooth(t) { const c = t < 0 ? 0 : t > 1 ? 1 : t; return 3 * c * c - 2 * c * c * c; }
function weightsCUR(p) {
  return { aAlpha: p <= 0 ? 1 : 1 - smooth((p + 0.01) / 0.206), bAlpha: p >= 1 ? 1 : smooth((p - 0.122) / 0.954) };
}
// Nút ứng cử O1 đã áp (làm tròn 4 chữ số).
const KNOTS_A = [[0, 1], [0.05, 0.8012], [0.1, 0.4497], [0.15, 0.1329], [0.2, 0], [0.25, 0], [0.3, 0], [0.35, 0], [0.4, 0], [0.45, 0], [0.5, 0], [0.55, 0], [0.6, 0], [0.65, 0], [0.7, 0], [0.75, 0], [0.8, 0], [0.85, 0], [0.9, 0], [0.95, 0], [1, 0]];
const KNOTS_B = [[0, 0], [0.05, 0], [0.1, 0], [0.12, 0], [0.15, 0.0128], [0.2, 0.0313], [0.25, 0.0562], [0.3, 0.0955], [0.35, 0.1441], [0.4, 0.2016], [0.45, 0.2659], [0.5, 0.345], [0.55, 0.4216], [0.6, 0.5016], [0.65, 0.5934], [0.7, 0.6697], [0.75, 0.7419], [0.8, 0.7982], [0.85, 0.8479], [0.9, 0.9039], [0.95, 0.9523], [1, 1]];
function interpKnots(knots, p) {
  if (p <= 0) return knots[0][1];
  if (p >= 1) return knots[knots.length - 1][1];
  for (let i = 1; i < knots.length; i++) {
    if (p <= knots[i][0]) {
      const t = (p - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0]);
      return knots[i - 1][1] + t * (knots[i][1] - knots[i - 1][1]);
    }
  }
  return knots[knots.length - 1][1];
}
function grayOf(px) { return (px[0] + px[1] + px[2]) / 3; }
function compPx(A, B, type, p, wf) {
  const { aAlpha, bAlpha } = wf(p);
  const mode = type === "fadeblack" ? "black" : type === "fadewhite" ? "white" : "gray";
  const dipA = 1 - p - aAlpha, dipB = p - bAlpha;
  const midA = mode === "black" ? 0 : mode === "white" ? 255 : grayOf(A);
  const midB = mode === "black" ? 0 : mode === "white" ? 255 : grayOf(B);
  return [0, 1, 2].map((c) => Math.round(aAlpha * A[c] + bAlpha * B[c] + dipA * midA + dipB * midB));
}
function madPx(pred, ref) { return (Math.abs(pred[0] - ref[0]) + Math.abs(pred[1] - ref[1]) + Math.abs(pred[2] - ref[2])) / 3; }

const W = 320, H = 180, fps = 120;
const COMBOS = [
  { inType: "fadewhite", outType: "fadewhite" },
  { inType: "fadegrays", outType: "fadewhite" },
  { inType: "fadewhite", outType: "fadegrays" },
  { inType: "fadeblack", outType: "fadeblack" },
  { inType: "fadeblack", outType: "fadewhite" },
];
const cells = [];
for (const s of [{ kind: "flat-orig", cols: ["red", "green", "magenta"] }, { kind: "flat-new", cols: ["blue", "yellow", "cyan"] }]) {
  const A = meanPixel(flatFrame(s.cols[0], W, H, fps, tag("s-A")));
  const B = meanPixel(flatFrame(s.cols[1], W, H, fps, tag("s-B")));
  const C = meanPixel(flatFrame(s.cols[2], W, H, fps, tag("s-C")));
  for (const { inType, outType } of COMBOS) {
    const ref = meanPixel(chainedFlatFrame(inType, outType, s.cols[0], s.cols[1], s.cols[2], 0.6, W, H, fps, tag("s-chain")));
    cells.push({ id: `${s.kind}|${inType}/${outType}@0.6`, kind: "pair", inType, outType, A, B, C, ref });
  }
}
for (const s of [{ kind: "single-new", cols: ["blue", "yellow"] }, { kind: "single-orig", cols: ["red", "green"] }]) {
  const A = meanPixel(flatFrame(s.cols[0], W, H, fps, tag("s-sA")));
  const B = meanPixel(flatFrame(s.cols[1], W, H, fps, tag("s-sB")));
  for (const type of ["fadeblack", "fadewhite", "fadegrays"]) {
    for (const p of [0.1, 0.6]) {
      const ref = meanPixel(singleChainFrame(type, s.cols[0], s.cols[1], p, W, H, fps, tag("s-single")));
      cells.push({ id: `${s.kind}|${type}@${p}`, kind: "single", inType: type, p, A, B, ref });
    }
  }
}
console.log(`quét: ${cells.length} ô liên quan`);
function evalCell(c, wf) {
  if (c.kind === "single") return madPx(compPx(c.A, c.B, c.inType, c.p, wf), c.ref);
  const first = compPx(c.A, c.B, c.inType, 0.6, wf);
  return madPx(compPx(first, c.C, c.outType, 0.1, wf), c.ref);
}
const curMad = {};
for (const c of cells) curMad[c.id] = evalCell(c, weightsCUR);
const bVals = [];
for (let v = 0.5000; v <= 0.50801; v += 0.0005) bVals.push(+v.toFixed(4));
const aVals = [0.4497, 0.4472, 0.4522, 0.4447, 0.4547, 0.4397, 0.4597, 0.4297, 0.4697];
let best = null;
for (const b06 of bVals) {
  for (const a01 of aVals) {
    const aK = KNOTS_A.map(([p, v]) => [p, p === 0.1 ? a01 : v]);
    const bK = KNOTS_B.map(([p, v]) => [p, p === 0.6 ? b06 : v]);
    const wf = (p) => ({ aAlpha: interpKnots(aK, p), bAlpha: interpKnots(bK, p) });
    let nInc = 0, tot = 0;
    const details = {};
    for (const c of cells) {
      const m = evalCell(c, wf);
      tot += m; details[c.id] = +m.toFixed(4);
      if (m > curMad[c.id] + 1e-9) nInc++;
    }
    const fwfg06 = details["flat-orig|fadewhite/fadegrays@0.6"];
    const ok = nInc === 0 && fwfg06 <= 2;
    console.log(`B@0.6=${b06} A@0.1=${a01} | tăng=${nInc} tổng=${tot.toFixed(4)} FWFG06=${fwfg06} ${ok ? "<< THỎA CẢ HAI" : ""}`);
    if (ok && (!best || tot < best.tot)) best = { b06, a01, tot, details };
  }
}
if (best) console.log(`KẾT LUẬN: có combo thỏa cả hai: B@0.6=${best.b06} A@0.1=${best.a01} tổng=${best.tot.toFixed(4)}`);
else console.log("KẾT LUẬN: KHÔNG có combo (B@0.6 × A@0.1) nào trong lưới quét vừa giữ FW/FG 0.6 KHỚP vừa 0 ô tăng — trade-off không tránh được bằng 2 nút này.");
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
