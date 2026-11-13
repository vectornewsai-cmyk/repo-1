#!/usr/bin/env node
/**
 * analyze95w3-frame-parity.mjs — Phase 9 đợt 95, luồng W3.
 * Phân tích MAD theo đúng (clip, frameIdx) giữa các run frame-parity.
 * Chạy: node apps/web/scripts/analyze95w3-frame-parity.mjs <tagA> <tagB> [...]
 *   mỗi tag = thư mục hidden_files/round95-w3/<tag>/frame-parity-results.json
 *   hoặc đường dẫn JSON trực tiếp.
 * In: số frame khớp được mỗi cặp, MAD mean/median/p90/max, tách theo clip
 *   và blind/steady (WebKit, theo fbAt của chính run đó), gradient blind vs
 *   steady, max inter-callback gap Chromium (kill-oan), fallback/silentEngine.
 * Ghi tóm tắt JSON vào hidden_files/round95-w3/analysis-<ts>.json khi chạy
 * với >= 2 file.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round95-w3");
function loadRun(a) {
  const p = a.endsWith(".json") ? a : path.join(BASE, a, "frame-parity-results.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function stats(a) {
  if (!a.length) return { n: 0, mean: null, median: null, p90: null, max: null };
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const mean = s.reduce((x, y) => x + y, 0) / s.length;
  return { n: s.length, mean: +mean.toFixed(2), median: +q(0.5).toFixed(2), p90: +q(0.9).toFixed(2), max: +s[s.length - 1].toFixed(2) };
}
function mad(pxA, pxB) {
  let sum = 0;
  for (let i = 0; i < pxA.length; i++) sum += Math.abs(pxA[i] - pxB[i]);
  return sum / pxA.length;
}
function gradMean(px) {
  if (!px) return null;
  let sum = 0, n = 0;
  for (let y = 0; y < 54; y++) for (let x = 20; x < 75; x++) { sum += Math.abs(px[y * 96 + x + 1] - px[y * 96 + x]); n++; }
  return sum / n;
}
// Cửa sổ mù của 1 clip trong run WebKit: frame có relPlay < fbAt[clip]
// (fbAt = lúc fallback no-callback được ghi, tính từ lúc phát). Clip không
// fallback (memo, c2 trở đi) thì toàn bộ là steady.
function isBlind(cap, run) {
  const fb = run.fbAt && run.fbAt[cap.clip];
  if (fb === undefined) return false;
  return cap.relPlay !== null && cap.relPlay < fb;
}

function summarizeRun(r) {
  const byClip = {};
  const byTag = {};
  const gradBlind = [], gradSteady = [];
  const seqIssues = [];
  for (const c of r.caps) {
    byClip[c.clip] = (byClip[c.clip] || 0) + 1;
    byTag[c.tag] = (byTag[c.tag] || 0) + 1;
    const g = gradMean(c.px);
    if (g !== null) (isBlind(c, r) ? gradBlind : gradSteady).push(g);
  }
  // Kiểm tra dãy frameIdx đơn điệu theo từng clip (phát hiện gắn nhãn sai).
  for (const clip of ["c0", "c1", "c2"]) {
    const seq = r.caps.filter((c) => c.clip === clip).map((c) => c.frameIdx);
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] < seq[i - 1]) seqIssues.push(`${clip}: ${seq[i - 1]}->${seq[i]}`);
      if (seq[i] - seq[i - 1] > 5) seqIssues.push(`${clip}: nhảy ${seq[i - 1]}->${seq[i]}`);
    }
  }
  // Max inter-callback gap (pump events, Chromium — phơi nguy cơ kill oan).
  let maxGapMs = null, nCb = r.pump ? r.pump.length : 0;
  if (r.pump && r.pump.length > 1) {
    let mx = 0;
    for (let i = 1; i < r.pump.length; i++) mx = Math.max(mx, r.pump[i].tInvoke - r.pump[i - 1].tInvoke);
    maxGapMs = Math.round(mx);
  }
  const pumpDecisions = {};
  for (const e of r.pump || []) pumpDecisions[e.decision] = (pumpDecisions[e.decision] || 0) + 1;
  const caps = {};
  for (const d of r.dbgFinal || []) caps[d.id] = { caps: d.caps, fb: d.fb, ring: d.ring, active: d.active };
  return {
    tag: r.tag, engine: r.engine, config: r.config,
    nCaps: r.nCaps, byClip, byTag, collisions: r.collisions,
    tagAgree: r.tagAgree, tagDisagree: r.tagDisagree, tagBoth: r.tagBoth,
    seqIssues: seqIssues.slice(0, 10), nSeqIssues: seqIssues.length,
    gradBlind: stats(gradBlind), gradSteady: stats(gradSteady),
    pumpCallbacks: nCb, pumpDecisions, maxInterCallbackGapMs: maxGapMs,
    fbAt: r.fbAt, ringFirstAt: r.ringFirstAt, silentEngine: r.silentEngine,
    silentSeenAt: r.silentSeenAt, capsFinal: caps,
    mtimeChangedMidRun: r.mtimeChangedMidRun, pageErrs: (r.pageErrs || []).length,
    envBefore: r.envBefore, envAfter: r.envAfter,
  };
}

function comparePair(A, B) {
  const mapB = new Map(B.caps.map((c) => [c.key, c]));
  const perFrame = [];
  const missingA = [], missingB = [];
  let nOutOfRange = 0, nStaleBoundary = 0;
  // Chỉ khớp frameIdx 0..89 (clip 3 s @30fps). frameIdx 90 là artifact biên
  // (element ct chạm 3,0 đúng lúc chuyển clip, tick vẽ trước khi seek xong).
  const inRange = (c) => c.frameIdx >= 0 && c.frameIdx <= 89;
  // Bỏ frame "stale biên": 1–2 capture đầu mỗi clip sau c0 vẽ vị trí element
  // cũ trước khi seek xong (vd c1 mở đầu 82, 90 rồi mới 6, 7, 8...). Các
  // frame này không khớp được giữa các lượt (giá trị ngẫu nhiên theo thời
  // điểm seek) nên loại khỏi MAD, đếm riêng. CẨN THẬN: không được để 2 frame
  // stale đầu "đầu độc" cả clip — sau khi bỏ prefix stale thì dãy còn lại
  // phải được xét đơn điệu từ đầu (bản trước so với lastKept=90 nên bỏ cả
  // clip, matched chỉ còn 4).
  const dropStale = (caps) => {
    const byClip = {};
    for (const c of caps) (byClip[c.clip] = byClip[c.clip] || []).push(c);
    const out = [];
    for (const clip of Object.keys(byClip)) {
      const seq = byClip[clip];
      let start = 0;
      // Prefix stale: dãy giảm trong ≤3 capture đầu, biên độ > 20.
      for (let i = 1; i <= 3 && i < seq.length; i++) {
        if (seq[i].frameIdx < seq[i - 1].frameIdx && seq[i - 1].frameIdx - seq[i].frameIdx > 20) {
          nStaleBoundary += i;
          start = i;
          break;
        }
      }
      let lastKept = -1;
      for (let i = start; i < seq.length; i++) {
        const c = seq[i];
        if (c.frameIdx < lastKept) { nStaleBoundary++; continue; }
        lastKept = c.frameIdx;
        out.push(c);
      }
    }
    // Giữ thứ tự thời gian gốc (capList đã theo thời gian).
    const order = new Map(caps.map((c, i) => [c, i]));
    return out.sort((a, b) => order.get(a) - order.get(b));
  };
  const capsA = dropStale(A.caps);
  const capsB = dropStale(B.caps);
  const mapB2 = new Map(capsB.map((c) => [c.key, c]));
  // Loại capture (b) có |ctGap| > 0,5 s (probe cũ chưa chặn trong sampler):
  // draw lạ (preload/thumbnail) gắn sai nhãn.
  const badGap = (c) => c.tag === "draw" && c.ctGap !== null && c.ctGap !== undefined && Math.abs(c.ctGap) > 0.5;
  let nBadGap = 0;
  for (const a of capsA) {
    if (!inRange(a)) { nOutOfRange++; continue; }
    if (badGap(a)) { nBadGap++; continue; }
    const b = mapB2.get(a.key);
    if (!b) { missingA.push(a.key); continue; }
    if (badGap(b)) { nBadGap++; continue; }
    const winA = a.dbg && a.dbg[a.clip];
    const winB = b.dbg && b.dbg[b.clip];
    // Cửa sổ blend đã vẽ (chỉ có ở lượt chạy bằng probe mới — có
    // lastDrawnLast/lastDrawnPrev): cùng (k, last, prev) thì cùng 3 frame
    // nguồn, MAD mới cô lập được khác biệt đường vẽ khỏi khác biệt ring.
    const winMatch = (winA && winB && winA.lastDrawnLast !== undefined && winB.lastDrawnLast !== undefined)
      ? (winA.lastDrawnLast === winB.lastDrawnLast && winA.lastDrawnPrev === winB.lastDrawnPrev)
      : null;
    perFrame.push({ key: a.key, clip: a.clip, frameIdx: a.frameIdx, mad: +mad(a.px, b.px).toFixed(2), blindA: isBlind(a, A), blindB: isBlind(b, B), tagA: a.tag, tagB: b.tag, winMatch, winA: winA ? [winA.lastDrawn, winA.lastDrawnLast, winA.lastDrawnPrev] : null, winB: winB ? [winB.lastDrawn, winB.lastDrawnLast, winB.lastDrawnPrev] : null });
  }
  for (const b of capsB) if (inRange(b) && !capsA.find((a) => a.key === b.key)) missingB.push(b.key);
  const all = perFrame.map((f) => f.mad);
  const steady = perFrame.filter((f) => !f.blindA && !f.blindB).map((f) => f.mad);
  const anyBlind = perFrame.filter((f) => f.blindA || f.blindB).map((f) => f.mad);
  const winMatched = perFrame.filter((f) => f.winMatch === true).map((f) => f.mad);
  const winMismatched = perFrame.filter((f) => f.winMatch === false).map((f) => f.mad);
  const tickOnly = perFrame.filter((f) => f.tagA === "tick" && f.tagB === "tick").map((f) => f.mad);
  const drawInvolved = perFrame.filter((f) => f.tagA === "draw" || f.tagB === "draw").map((f) => f.mad);
  const byClip = {};
  for (const clip of ["c0", "c1", "c2"]) {
    const xs = perFrame.filter((f) => f.clip === clip).map((f) => f.mad);
    if (xs.length) byClip[clip] = stats(xs);
  }
  return {
    pair: `${A.tag} vs ${B.tag}`,
    nMatched: perFrame.length, nOnlyA: missingA.length, nOnlyB: missingB.length,
    nOutOfRangeExcluded: nOutOfRange, nStaleBoundaryDropped: nStaleBoundary, nBadGapDropped: nBadGap,
    madAll: stats(all), madSteady: stats(steady), madAnyBlind: stats(anyBlind),
    madWinMatched: stats(winMatched), madWinMismatched: stats(winMismatched),
    madTickOnly: stats(tickOnly), madDrawInvolved: stats(drawInvolved),
    byClip, perFrame,
  };
}

const args = process.argv.slice(2);
if (args.length < 1) { console.error("cần ít nhất 1 tag/json"); process.exit(2); }
const runs = args.map(loadRun);
const summaries = runs.map(summarizeRun);
for (const s of summaries) {
  console.log(`\n=== RUN ${s.tag} (${s.engine}, ${s.config}) ===`);
  console.log(`caps=${s.nCaps} byClip=${JSON.stringify(s.byClip)} byTag=${JSON.stringify(s.byTag)} collisions=${s.collisions}`);
  console.log(`tagAgree=${s.tagAgree}/${s.tagBoth} tagDisagree=${s.tagDisagree} seqIssues=${s.nSeqIssues} ${JSON.stringify(s.seqIssues)}`);
  console.log(`grad blind=${JSON.stringify(s.gradBlind)} steady=${JSON.stringify(s.gradSteady)}`);
  console.log(`pump callbacks=${s.pumpCallbacks} decisions=${JSON.stringify(s.pumpDecisions)} maxGapMs=${s.maxInterCallbackGapMs}`);
  console.log(`fbAt=${JSON.stringify(s.fbAt)} ringFirstAt=${JSON.stringify(s.ringFirstAt)} silentEngine=${s.silentEngine} silentSeenAt=${s.silentSeenAt}`);
  console.log(`capsFinal=${JSON.stringify(s.capsFinal)} mtimeChanged=${s.mtimeChangedMidRun} pageErrs=${s.pageErrs}`);
  console.log(`envBefore: ${s.envBefore && s.envBefore.uptime || ""} psOther=${s.envBefore && s.envBefore.psOther}`);
  console.log(`envAfter:  ${s.envAfter && s.envAfter.uptime || ""} psOther=${s.envAfter && s.envAfter.psOther}`);
}
const pairs = [];
for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
  const p = comparePair(runs[i], runs[j]);
  pairs.push(p);
  console.log(`\n=== MAD ${p.pair} ===`);
  console.log(`matched=${p.nMatched} onlyA=${p.nOnlyA} onlyB=${p.nOnlyB} outOfRange=${p.nOutOfRangeExcluded} staleBoundary=${p.nStaleBoundaryDropped}`);
  console.log(`MAD all=${JSON.stringify(p.madAll)}`);
  console.log(`MAD steady (cả 2 ngoài mù)=${JSON.stringify(p.madSteady)}`);
  console.log(`MAD anyBlind=${JSON.stringify(p.madAnyBlind)}`);
  console.log(`MAD windowMatched (cùng cửa sổ blend)=${JSON.stringify(p.madWinMatched)}`);
  console.log(`MAD windowMismatched (khác cửa sổ blend)=${JSON.stringify(p.madWinMismatched)}`);
  console.log(`MAD tickOnly (cả 2 gắn bằng tick record)=${JSON.stringify(p.madTickOnly)}`);
  console.log(`MAD drawInvolved (≥1 bên gắn bằng draw)=${JSON.stringify(p.madDrawInvolved)}`);
  console.log(`byClip=${JSON.stringify(p.byClip)}`);
  const worst = [...p.perFrame].sort((a, b) => b.mad - a.mad).slice(0, 5);
  console.log(`worst frames: ${JSON.stringify(worst)}`);
}
if (runs.length >= 2) {
  const out = path.join(BASE, `analysis-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(out, JSON.stringify({ summaries, pairs: pairs.map(({ perFrame, ...rest }) => rest) }, null, 2));
  console.log(`\nĐã ghi tóm tắt: ${out}`);
}
