#!/usr/bin/env node
/**
 * r83k2-mitchell-ab.mjs — Phase 9 đợt 83, luồng K2: QUYẾT ĐỊNH kernel
 * Mitchell vs BC cho nhánh upscale của production (chrome-resample.mjs).
 *
 * Đóng nợ đợt 82 §4.2 (J2): probe headed chứng minh kernel upscale
 * drawImage thật của Chrome là Mitchell (1/3, 1/3), MAD 0,000–0,003,
 * thắng BC(0,25, 0,375) 5/6 số trên đối chiếu I3 — nhưng production giữ
 * BC vì BC đang bù lệch đường sharp (H3 §1.4 / I3). Câu hỏi của luồng
 * này: Mitchell có bù được lệch sharp không? A/B có kiểm soát trên
 * CÙNG capture, 3 kernel (tri / BC / Mitchell), 3 cánh:
 *
 *   Arm A — toán tử trực tiếp: probe J2 (gpu0, headed Chromium 1254),
 *     9 mẫu hàng × 3 thang + checker 2D + sweep impulse + step overshoot.
 *   Arm B — đường sharp trên test-pattern: snaps H3 run D (w1920-p640,
 *     s=1,2641) + run A2 (w2560-p1280, s=1,1320), nội dung sqw4/8/16/32
 *     (+ lineart2px ở run D): plain MAD, abs sharp MAD + le8, delta MAD.
 *   Arm C — nội dung tự nhiên: snaps F6 w2560-p1280 (s=1,132, SẠCH) gồm
 *     ocean/basgo/slovenska + w1920-p640 (s=1,264) & w2560-p640
 *     (s=2,264, NHIỄM downscale nội bộ 1280→640 — báo riêng, không dùng
 *     để quyết):
 *     plain MAD, abs sharp MAD + le8, delta MAD.
 *
 * Quy ước resample giống hệt E9/F6/I3/J2: S=(i+0,5)/s, h=1 (kernel bị
 * cắt ở |x|≤1,5 rồi chuẩn hoá lại), làm tròn thường + kẹp 0..255 ở
 * RGB; delta tính trên float không làm tròn (như I3 V0).
 *
 * Verdict: abs KHỚP iff MAD ≤ 2 và le8 ≥ 0,99; delta KHỚP iff delta MAD ≤ 2
 * (ngưỡng F6/E9). Thắng/thua đếm theo từng case (pattern×thang / nội
 * dung×biến thể), không gộp mù.
 *
 * Quy tắc quyết định (đăng ký trước khi chạy):
 *   - Đổi sang Mitchell iff (i) Mitchell thắng hoặc hòa BC trên delta
 *     sharp (Arm B+C gộp: số case Mitchell thắng ≥ số case BC thắng, và
 *     không có verdict nào lật từ KHỚP → tệ hơn dưới Mitchell), VÀ
 *     (ii) Mitchell thắng lớn trên toán tử trực tiếp (Arm A), VÀ
 *     (iii) không có verdict plain nào lật tệ hơn.
 *   - Hybrid (Mitchell cho plain + BC cho sharp) chỉ xét nếu nó thắng
 *     Mitchell-mọi-chỗ >20% trên tổng delta MAD — và dù vậy vẫn phải
 *     bác vì Chrome chỉ dùng MỘT kernel cho mọi frame (không có cơ chế
 *     vật lý nào cho 2 kernel theo biến thể); hybrid là fit, không phải
 *     mô hình. Ghi số rồi bác/hay chấp nhận theo đúng luật này.
 *   - Nếu hòa trong nhiễu đo (mọi chênh < 0,05 MAD và 0 verdict lật)
 *     thì GIỮ NGUYÊN production, ghi nợ lại.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r83k2-mitchell-ab.mjs
 * Env: R83K2_OUT (mặc định hidden_files/round83-k2/r83k2-mitchell-ab.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production (script đo).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeWeights1D, triangleKernel, bcCubicKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const J2 = path.join(GOAL, "round82-j2");
const H3 = path.join(GOAL, "round80-h3");
const F6 = path.join(GOAL, "round78-f6");
const OUT = process.env.R83K2_OUT || path.join(GOAL, "round83-k2", "r83k2-mitchell-ab.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const KERNELS = {
  tri: triangleKernel,
  bc: (x) => bcCubicKernel(x, 0.25, 0.375),
  mitchell: (x) => bcCubicKernel(x, 1 / 3, 1 / 3),
};
const KNAMES = ["tri", "bc", "mitchell"];

function roundU8(v) { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; }
function resampleRow1D(row, dstLen, kernel) {
  const srcLen = row.length, s = dstLen / srcLen;
  const out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, s, srcLen, kernel)) acc += w * row[j];
    out[i] = acc;
  }
  return out;
}
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, kernel) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  for (let y = 0; y < srcH; y++) for (let i = 0; i < dstW; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, sx, srcW, kernel, 1)) acc += w * src[y * srcW + j];
    tmp[y * dstW + i] = acc;
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) for (let i = 0; i < dstH; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, sy, srcH, kernel, 1)) acc += w * tmp[j * dstW + x];
    out[i * dstW + x] = acc;
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, kernel);
    for (let i = 0; i < dstW * dstH; i++) out[i * 3 + c] = roundU8(r[i]);
  }
  return out;
}
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) { const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]); sum += d; if (d > dmax) dmax = d; }
    if (dmax <= 8) le8++;
  }
  return { mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4) };
}
function deltaOf(a, b) { const o = new Float64Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] - b[i]; return o; }
function deltaMadFloat(dp, dr) { let s = 0; for (let i = 0; i < dp.length; i++) s += Math.abs(dp[i] - dr[i]); return +(s / dp.length).toFixed(3); }
function madRows(chromeRows, predRow) {
  let sum = 0, n = 0;
  for (const r of chromeRows) for (let i = 0; i < r.length; i++) { sum += Math.abs(r[i] - predRow[i]); n++; }
  return +(sum / n).toFixed(3);
}
const verdictAbs = (m) => (m.mad <= 2 && m.le8 >= 0.99 ? "KHỚP" : m.mad <= 2 ? "XẤP XỈ" : "LỆCH");
const verdictDelta = (d) => (d <= 2 ? "KHỚP" : "LỆCH");
const r3 = (v) => +v.toFixed(3);

const report = { generated: new Date().toISOString(), kernels: { tri: "triangle", bc: "BC(0.25, 0.375) — production hiện tại", mitchell: "Mitchell (1/3, 1/3)" }, arms: {} };

// ================= Arm A: toán tử trực tiếp (probe J2) =================
function patternRow(kind, w = 512) {
  const row = new Float64Array(w);
  for (let x = 0; x < w; x++) {
    switch (kind) {
      case "sqw4": row[x] = (Math.floor(x / 4) % 2 === 0) ? 64 : 192; break;
      case "sqw8": row[x] = (Math.floor(x / 8) % 2 === 0) ? 64 : 192; break;
      case "sqw4-hi": row[x] = (Math.floor(x / 4) % 2 === 0) ? 0 : 255; break;
      case "sqw4-lo": row[x] = (Math.floor(x / 4) % 2 === 0) ? 112 : 144; break;
      case "step": row[x] = x < 256 ? 64 : 192; break;
      case "impulse": row[x] = x === 256 ? 255 : 128; break;
      case "linA": row[x] = x === 200 ? 128 : 0; break;
      case "linB": row[x] = x === 208 ? 128 : 0; break;
      case "linAB": row[x] = (x === 200 || x === 208) ? 128 : 0; break;
      default: throw new Error("mẫu không biết: " + kind);
    }
  }
  return row;
}
function patternPlane(kind, w = 512, h = 512) {
  const pl = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    pl[y * w + x] = kind === "checker8"
      ? (((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 64 : 192)
      : patternRow(kind, w)[x];
  }
  return pl;
}
{
  const probe = JSON.parse(fs.readFileSync(path.join(J2, "r82j2-probe-gpu0.json"), "utf8"));
  const SCALES = [{ key: "s1132", dw: 580 }, { key: "s1264", dw: 647 }, { key: "s2000", dw: 1024 }];
  const ROW_PATTERNS = ["sqw4", "sqw8", "sqw4-hi", "sqw4-lo", "step", "impulse", "linA", "linB", "linAB"];
  const armA = { source: "r82j2-probe-gpu0.json (headed Chromium 1254, gpu0)", rows: {}, checker: {}, sweep: {}, stepOvershoot: {} };
  console.log("\n######## ARM A — toán tử trực tiếp (probe J2 gpu0) ########");
  for (const k of ROW_PATTERNS) {
    armA.rows[k] = {};
    for (const sc of SCALES) {
      const c = probe.captures[`${k}@${sc.key}`];
      const srcRow = patternRow(k);
      const row = {};
      for (const name of KNAMES) {
        const pred = Array.from(resampleRow1D(srcRow, sc.dw, KERNELS[name]), roundU8);
        row[name] = madRows(c.rows, pred);
      }
      armA.rows[k][sc.key] = row;
      const win = row.mitchell < row.bc ? "mitchell" : row.bc < row.mitchell ? "bc" : "hòa";
      console.log(`  ${k}@${sc.key}: tri=${row.tri} bc=${row.bc} mit=${row.mitchell} → ${win}`);
    }
  }
  // Checker 2D full-frame.
  for (const sc of SCALES) {
    const c = probe.captures[`checker8@${sc.key}`];
    const chrome = Buffer.from(c.rgbB64, "base64");
    const src = patternPlane("checker8");
    const row = {};
    for (const name of KNAMES) {
      const pl = resamplePlaneKernel(src, 512, 512, sc.dw, sc.dw, KERNELS[name]);
      const model = Buffer.alloc(sc.dw * sc.dw * 3);
      for (let i = 0; i < sc.dw * sc.dw; i++) { const v = roundU8(pl[i]); model[i * 3] = v; model[i * 3 + 1] = v; model[i * 3 + 2] = v; }
      row[name] = mad3(chrome, model);
    }
    armA.checker[sc.key] = row;
    console.log(`  checker8@${sc.key}: tri=${row.tri.mad} bc=${row.bc.mad} mit=${row.mitchell.mad}`);
  }
  // Step overshoot: đếm under (<64) / over (>192) trên hàng giữa của step.
  for (const sc of SCALES) {
    const c = probe.captures[`step@${sc.key}`];
    const chromeRow = c.rows[2];
    const srcRow = patternRow("step");
    const count = (arr) => { let u = 0, o = 0; for (const v of arr) { if (v < 64) u++; if (v > 192) o++; } return { under: u, over: o }; };
    const ent = { chrome: count(chromeRow) };
    for (const name of KNAMES) ent[name] = count(Array.from(resampleRow1D(srcRow, sc.dw, KERNELS[name]), roundU8));
    armA.stepOvershoot[sc.key] = ent;
    console.log(`  step@${sc.key} under/over: chrome=${ent.chrome.under}/${ent.chrome.over} tri=${ent.tri.under}/${ent.tri.over} bc=${ent.bc.under}/${ent.bc.over} mit=${ent.mitchell.under}/${ent.mitchell.over}`);
  }
  // Sweep impulse: MAD trên support + exact-rate.
  for (const sc of [SCALES[0], SCALES[2]]) {
    const sw = probe.sweep[sc.key];
    const rows = Buffer.from(sw.rowsB64, "base64");
    const dw = sw.w;
    const res = {};
    for (const name of KNAMES) {
      let sum = 0, n = 0, exact = 0;
      for (let i = 0; i < dw; i++) {
        const wmap = new Map(chromeWeights1D(i, dw / 512, 512, KERNELS[name]));
        for (let p = 0; p < 512; p++) {
          const meas = rows[p * dw + i];
          const w = wmap.get(p) || 0;
          const pred = roundU8(255 * w);
          if (meas > 0 || pred > 0) { sum += Math.abs(meas - pred); n++; if (meas === pred) exact++; }
        }
      }
      res[name] = { madSupport: r3(sum / n), nSupport: n, exactRate: +(exact / n).toFixed(4) };
    }
    armA.sweep[sc.key] = res;
    console.log(`  sweep@${sc.key}: ` + KNAMES.map((n) => `${n} MAD=${res[n].madSupport} exact=${res[n].exactRate}`).join(" | "));
  }
  report.arms.A = armA;
}

// ================= Arm B: sharp-delta test-pattern (snaps H3) =================
{
  const RUNS = [
    { snapFile: "headed-w1920x1080-p640x360-ph1/r80h3-snaps-w1920x1080-p640x360.json", contents: ["sqw4-640", "sqw8-640", "sqw16-640", "sqw32-640", "lineart2px-640"] },
    { snapFile: "headed-w2560x1440-p1280x720-ph1/r80h3-snaps-w2560x1440-p1280x720.json", contents: ["sqw4", "sqw8", "sqw16", "sqw32"] },
  ];
  const armB = { source: "snaps H3 (headed) + frame render fullrgb", runs: {} };
  console.log("\n######## ARM B — sharp-delta test-pattern (H3 run D + A2) ########");
  for (const run of RUNS) {
    const doc = JSON.parse(fs.readFileSync(path.join(H3, run.snapFile), "utf8"));
    const projW = doc.projW, projH = doc.projH;
    const runKey = `${doc.window}-p${projW}x${projH}`;
    armB.runs[runKey] = { snapFile: run.snapFile, projW, projH, scale: null, contents: {} };
    for (const content of run.contents) {
      const snaps = doc.snaps[content];
      const rect = snaps.plain.rect;
      const vw = snaps.plain.w, vh = snaps.plain.h;
      const rdir = path.join(H3, "render", content);
      const fullRgb = {};
      for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
      const prev = {};
      for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
      armB.runs[runKey].scale = rect.scale;
      const ent = {};
      for (const name of KNAMES) {
        const rend = {};
        for (const v of ["plain", "sharp05", "sharp10"]) rend[v] = resampleRgbKernel(fullRgb[v], projW, projH, vw, vh, KERNELS[name]);
        const plain = mad3(prev.plain, rend.plain);
        const a05 = mad3(prev.sharp05, rend.sharp05), a10 = mad3(prev.sharp10, rend.sharp10);
        const d05 = deltaMadFloat(deltaOf(prev.sharp05, prev.plain), deltaOf(rend.sharp05, rend.plain));
        const d10 = deltaMadFloat(deltaOf(prev.sharp10, prev.plain), deltaOf(rend.sharp10, rend.plain));
        ent[name] = {
          plainMad: plain.mad, plainLe8: plain.le8, plainVerdict: verdictAbs(plain),
          abs05: a05.mad, abs05Le8: a05.le8, abs05Verdict: verdictAbs(a05),
          abs10: a10.mad, abs10Le8: a10.le8, abs10Verdict: verdictAbs(a10),
          delta05: d05, delta05Verdict: verdictDelta(d05),
          delta10: d10, delta10Verdict: verdictDelta(d10),
        };
      }
      armB.runs[runKey].contents[content] = ent;
      console.log(`  ${runKey} ${content} (s=${rect.scale.toFixed(4)}):`);
      for (const name of KNAMES) {
        const e = ent[name];
        console.log(`    ${name}: plain=${e.plainMad}(${e.plainVerdict}) abs05=${e.abs05}(${e.abs05Verdict}) abs10=${e.abs10}(${e.abs10Verdict}) d05=${e.delta05}(${e.delta05Verdict}) d10=${e.delta10}(${e.delta10Verdict})`);
      }
    }
  }
  report.arms.B = armB;
}

// ================= Arm C: nội dung tự nhiên (snaps F6) =================
{
  const RUNS = [
    { snapFile: "headed-w2560x1440-p1280x720/r78f6-snaps-w2560x1440-p1280x720.json", clean: true, note: "s=1,132 SẠCH" },
    { snapFile: "headed-w1920x1080-p640x360/r78f6-snaps-w1920x1080-p640x360.json", clean: false, note: "s=1,264 NHIỄM downscale nội bộ 1280→640" },
    { snapFile: "headed-w2560x1440-p640x360/r78f6-snaps-w2560x1440-p640x360.json", clean: false, note: "s=2,264 NHIỄM downscale nội bộ 1280→640" },
  ];
  const armC = { source: "snaps F6 (headed) + frame render fullrgb", runs: {} };
  console.log("\n######## ARM C — nội dung tự nhiên (F6) ########");
  for (const run of RUNS) {
    const doc = JSON.parse(fs.readFileSync(path.join(F6, run.snapFile), "utf8"));
    const projW = doc.projW, projH = doc.projH;
    const runKey = `${doc.window}-p${projW}x${projH}`;
    armC.runs[runKey] = { snapFile: run.snapFile, projW, projH, clean: run.clean, note: run.note, contents: {} };
    for (const content of Object.keys(doc.snaps)) {
      const snaps = doc.snaps[content];
      const rect = snaps.plain.rect;
      const vw = snaps.plain.w, vh = snaps.plain.h;
      const rdir = content === "test-pattern"
        ? path.join(GOAL, "round66-t3", "render")
        : projW === 640 ? path.join(F6, "render", "ocean640") : path.join(F6, "render", content);
      const fullRgb = {};
      for (const v of ["plain", "sharp05", "sharp10"]) fullRgb[v] = fs.readFileSync(path.join(rdir, `fullrgb-${v}.raw`));
      const prev = {};
      for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
      const ent = {};
      for (const name of KNAMES) {
        const rend = {};
        for (const v of ["plain", "sharp05", "sharp10"]) rend[v] = resampleRgbKernel(fullRgb[v], projW, projH, vw, vh, KERNELS[name]);
        const plain = mad3(prev.plain, rend.plain);
        const a05 = mad3(prev.sharp05, rend.sharp05), a10 = mad3(prev.sharp10, rend.sharp10);
        const d05 = deltaMadFloat(deltaOf(prev.sharp05, prev.plain), deltaOf(rend.sharp05, rend.plain));
        const d10 = deltaMadFloat(deltaOf(prev.sharp10, prev.plain), deltaOf(rend.sharp10, rend.plain));
        ent[name] = {
          plainMad: plain.mad, plainLe8: plain.le8, plainVerdict: verdictAbs(plain),
          abs05: a05.mad, abs05Le8: a05.le8, abs05Verdict: verdictAbs(a05),
          abs10: a10.mad, abs10Le8: a10.le8, abs10Verdict: verdictAbs(a10),
          delta05: d05, delta05Verdict: verdictDelta(d05),
          delta10: d10, delta10Verdict: verdictDelta(d10),
        };
      }
      armC.runs[runKey].contents[content] = ent;
      console.log(`  ${runKey} ${content} (s=${rect.scale.toFixed(4)}, ${run.note}):`);
      for (const name of KNAMES) {
        const e = ent[name];
        console.log(`    ${name}: plain=${e.plainMad}(${e.plainVerdict}) abs05=${e.abs05}(${e.abs05Verdict}) abs10=${e.abs10}(${e.abs10Verdict}) d05=${e.delta05}(${e.delta05Verdict}) d10=${e.delta10}(${e.delta10Verdict})`);
      }
    }
  }
  report.arms.C = armC;
}

// ================= Tổng hợp: đếm thắng / verdict lật / hybrid =================
function tally() {
  const t = {
    armA_rows: { mitchellWins: 0, bcWins: 0, ties: 0, n: 0, mitchellMadSum: 0, bcMadSum: 0, triMadSum: 0 },
    armA_checker: { mitchellWins: 0, bcWins: 0, n: 0 },
    armB_delta: { mitchellWins: 0, bcWins: 0, ties: 0, n: 0, mitchellSum: 0, bcSum: 0 },
    armB_plain: { mitchellWins: 0, bcWins: 0, ties: 0, n: 0, mitchellSum: 0, bcSum: 0 },
    armC_clean_delta: { mitchellWins: 0, bcWins: 0, ties: 0, n: 0, mitchellSum: 0, bcSum: 0 },
    armC_clean_plain: { mitchellWins: 0, bcWins: 0, ties: 0, n: 0, mitchellSum: 0, bcSum: 0 },
    armC_contam_delta: { mitchellWins: 0, bcWins: 0, ties: 0, n: 0, mitchellSum: 0, bcSum: 0 },
    verdictFlips: [],
  };
  const cmp = (bucket, m, b) => {
    bucket.n++;
    if (m < b - 0.001) bucket.mitchellWins++;
    else if (b < m - 0.001) bucket.bcWins++;
    else bucket.ties++;
    bucket.mitchellSum = r3((bucket.mitchellSum || 0) + m);
    bucket.bcSum = r3((bucket.bcSum || 0) + b);
  };
  for (const k of Object.keys(report.arms.A.rows)) for (const sc of Object.keys(report.arms.A.rows[k])) {
    const r = report.arms.A.rows[k][sc];
    cmp(t.armA_rows, r.mitchell, r.bc);
    t.armA_rows.triMadSum = r3(t.armA_rows.triMadSum + r.tri);
  }
  for (const sc of Object.keys(report.arms.A.checker)) {
    const r = report.arms.A.checker[sc];
    t.armA_checker.n++;
    if (r.mitchell.mad < r.bc.mad) t.armA_checker.mitchellWins++; else t.armA_checker.bcWins++;
  }
  const scanBC = (runs, dBucket, pBucket, cleanOnly) => {
    for (const rk of Object.keys(runs)) {
      const run = runs[rk];
      if (cleanOnly !== undefined && run.clean !== cleanOnly) continue;
      for (const ck of Object.keys(run.contents)) {
        const e = run.contents[ck];
        cmp(dBucket, e.mitchell.delta05, e.bc.delta05);
        cmp(dBucket, e.mitchell.delta10, e.bc.delta10);
        cmp(pBucket, e.mitchell.plainMad, e.bc.plainMad);
        for (const [label, field] of [["plain", "plainVerdict"], ["abs05", "abs05Verdict"], ["abs10", "abs10Verdict"], ["delta05", "delta05Verdict"], ["delta10", "delta10Verdict"]]) {
          const bv = e.bc[field], mv = e.mitchell[field];
          const rank = { "KHỚP": 0, "XẤP XỈ": 1, "LỆCH": 2 };
          if (rank[mv] > rank[bv]) t.verdictFlips.push({ run: rk, content: ck, metric: label, bc: bv, mitchell: mv, direction: "tệ hơn" });
          if (rank[mv] < rank[bv]) t.verdictFlips.push({ run: rk, content: ck, metric: label, bc: bv, mitchell: mv, direction: "tốt hơn" });
        }
      }
    }
  };
  scanBC(report.arms.B.runs, t.armB_delta, t.armB_plain);
  scanBC(report.arms.C.runs, t.armC_clean_delta, t.armC_clean_plain, true);
  scanBC(report.arms.C.runs, t.armC_contam_delta, { n: 0, mitchellWins: 0, bcWins: 0, ties: 0, mitchellSum: 0, bcSum: 0 }, false);
  // Hybrid: Mitchell cho plain + BC cho sharp-delta, so tổng delta với Mitchell-mọi-chỗ (chỉ cánh sạch B+C).
  const hybridDelta = r3(t.armB_delta.bcSum + t.armC_clean_delta.bcSum);
  const mitchellDelta = r3(t.armB_delta.mitchellSum + t.armC_clean_delta.mitchellSum);
  t.hybrid = {
    deltaSumMitchellEverywhere: mitchellDelta,
    deltaSumHybridBcForSharp: hybridDelta,
    hybridAdvantagePct: mitchellDelta > 0 ? +(((mitchellDelta - hybridDelta) / mitchellDelta) * 100).toFixed(1) : 0,
    note: "Hybrid = BC cho delta sharp + Mitchell cho plain. Chrome chỉ dùng MỘT kernel cho mọi frame nên hybrid không có cơ chế vật lý — chỉ chấp nhận nếu thắng >20% (luật đăng ký trước).",
  };
  return t;
}
report.tally = tally();
console.log("\n######## TỔNG HỢP ########");
console.log(JSON.stringify(report.tally, null, 2));
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nĐã ghi ${OUT}`);
