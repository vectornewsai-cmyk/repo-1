// analyze92t3-canvas-stale.mjs — Đợt 92 T3: tách thành phần lag đỉnh do
// canvas stale dưới tải từ probe-results.json của probe92t3.
//
// Đọc: node apps/web/scripts/analyze92t3-canvas-stale.mjs <probe-results.json>
// In:
//  - chuỗi lag sau seekDone (ph-ball, elT-ball), đỉnh/mean, re-seek, stall
//    element (đoạn currentTime đứng yên >= 300ms; riêng stall > 1500ms —
//    vượt ân hạn S2).
//  - khoảng canvas stale: ballTime đứng yên (±0.005) trong khi elT tiến
//    >= 0.05s; mỗi khoảng quy thành phần: ticks rAF trong khoảng, gap rAF
//    max (từ __vcutPreviewRaf, căn theo samplerT0), tick render trong
//    khoảng (preMs/renderMs mean/max, số tick skipped/hold), holdStats
//    delta, và lag trình chiếu rVFC (ct - mediaTime, mẫu gần nhất).
//  - tóm tắt phân bổ: tổng thời gian stale do (a) không có tick rAF,
//    (b) tick chạy nhưng hold-frame, (c) tick chạy + draw nhưng frame
//    trình chiếu cũ (rVFC lag), (d) tick bỏ vẽ N3, (e) chưa phân loại.
//
// Quy ước căn thời gian: mẫu sampler có relMs (gốc samplerT0); ring rAF
// và ring render có t tuyệt đối (performance.now) → abs = samplerT0 +
// relMs. Mẫu rVFC có wallMs gốc lúc attach (ngay trước sampler, lệch
// < 100ms) nên chỉ dùng để nội suy lag trình chiếu gần đúng, không căn
// tuyệt đối.
import fs from "node:fs";

const file = process.argv[2];
if (!file) { console.error("usage: analyze92t3-canvas-stale.mjs <probe-results.json>"); process.exit(2); }
const results = JSON.parse(fs.readFileSync(file, "utf8"));
const samples = results.samples;
const a = results.analysis;
const t0 = results.samplerT0 ?? null;

const ballTime = (s) => {
  if (s.darkN <= 0 || s.darkCx === null || !s.W || !s.H) return null;
  const sc = Math.min(s.W / 1280, s.H / 720);
  const dw = 1280 * sc;
  const dx = (s.W - dw) / 2;
  const projX = (s.darkCx * s.W - dx) / dw;
  return (projX - 0.35) / 0.05;
};
const elOf = (s) => {
  const vids = (s.els || []).filter((e) => e.tag === "VIDEO");
  return a.ballElKey !== null ? vids[Number(a.ballElKey)] ?? null : null;
};
const lagPh = (s) => { const bt = ballTime(s); return bt === null ? null : s.localPh - bt; };
const lagEl = (s) => { const bt = ballTime(s); const el = elOf(s); return bt === null || !el ? null : el.t - bt; };
const pct = (arr, q) => {
  if (!arr.length) return null;
  const s = [...arr].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const mean = (arr) => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : null;

console.log(`== ${results.engine} load=${results.load} phase=${results.phase} gop=${results.gop} clip=${results.clip} n=${samples.length} seekDoneIdx=${a.seekDoneIdx} seekDoneRelMs=${a.seekDoneRelMs}ms playheadAtSeekDone=${a.playheadAtSeekDone} samplerT0=${t0}`);
console.log("== chuỗi mẫu sau seekDone (relMs localPh elT seeking ball lagPh lagEl ticks hold skip rfPre/rfRender rfHeld):");
for (let i = Math.max(0, a.seekDoneIdx); i < samples.length; i++) {
  const s = samples[i];
  const el = elOf(s);
  const bt = ballTime(s);
  const lp = lagPh(s), le = lagEl(s);
  console.log(`  ${String(s.relMs).padStart(6)}ms ph=${s.localPh.toFixed(3)} elT=${el ? el.t.toFixed(3) : "?"} sk=${el ? el.seeking : "?"} ball=${bt === null ? "null" : bt.toFixed(3)} lagPh=${lp === null ? "null" : lp.toFixed(3)} lagEl=${le === null ? "null" : le.toFixed(3)} ticks=${s.ticks ?? "-"} hold=${s.holdStats ? `${s.holdStats.draw}/${s.holdStats.hold}/${s.holdStats.skip}` : "-"} skipT=${s.skipTicks ?? "-"} rf=${s.rfLast ? `${s.rfLast.preMs}/${s.rfLast.renderMs}${s.rfLast.skipped ? "S" : ""}${s.rfLast.held ? "H" : ""}` : "-"}`);
}

// ---- Stall element (như S2): phát + !seeking + ΔelT < 0.005/mẫu, >= 300ms.
console.log("== đoạn element đứng yên sau seekDone (stall resume-decode):");
const stalls = [];
let seg = null;
for (let i = a.seekDoneIdx + 1; i < samples.length; i++) {
  const s = samples[i], prev = samples[i - 1];
  const el = elOf(s), elPrev = elOf(prev);
  const frozen = s.playing && el && elPrev && !el.seeking && Math.abs(el.t - elPrev.t) < 0.005;
  if (frozen && !seg) seg = { fromIdx: i - 1, fromMs: prev.relMs, elT: elPrev.t, phFrom: prev.localPh };
  if (!frozen && seg) {
    seg.toMs = prev.relMs; seg.durMs = prev.relMs - seg.fromMs; seg.phTo = prev.localPh;
    if (seg.durMs >= 300) stalls.push(seg);
    seg = null;
  }
}
if (seg) {
  const last = samples[samples.length - 1];
  seg.toMs = last.relMs; seg.durMs = last.relMs - seg.fromMs; seg.phTo = last.localPh;
  if (seg.durMs >= 300) stalls.push(seg);
}
for (const st of stalls) console.log(`  stall ${st.fromMs}→${st.toMs}ms (${st.durMs}ms) elT≈${st.elT} playhead ${st.phFrom.toFixed(3)}→${st.phTo.toFixed(3)} (+${(st.phTo - st.phFrom).toFixed(3)}s)${st.durMs > 1500 ? "  <-- VƯỢT ÂN HẠN S2 1500ms" : ""}`);
if (!stalls.length) console.log("  (không có đoạn đứng yên >= 300ms)");
const over1500 = stalls.filter((x) => x.durMs > 1500);

// ---- Re-seek sau seekDone.
console.log("== lần seeking trở lại sau seekDone (re-seek drift):");
let prevSeeking = false, nReseek = 0;
for (let i = a.seekDoneIdx; i < samples.length; i++) {
  const el = elOf(samples[i]);
  if (!el) continue;
  if (el.seeking && !prevSeeking) {
    nReseek++;
    console.log(`  re-seek #${nReseek} tại relMs=${samples[i].relMs} ph=${samples[i].localPh.toFixed(3)} elT=${el.t.toFixed(3)} lagPh=${(lagPh(samples[i]) ?? NaN).toFixed(3)}`);
  }
  prevSeeking = el.seeking;
}
if (!nReseek) console.log("  (không có re-seek nào sau seekDone)");

// ---- Khoảng canvas stale: ballTime đứng yên trong khi elT tiến.
console.log("== khoảng canvas stale sau seekDone (ballTime ±0.005 đứng yên, elT tiến >= 0.05s):");
// Căn tuyệt đối cho ring rAF/render: abs = samplerT0 + relMs.
const raf = (results.rafSamples || []).filter((x) => x.playing && !x.justWoke);
const render = results.renderTicks || [];
const rvfc = results.rvfcSamples || [];
function rvfcLagNear(relMs) {
  // Mẫu rVFC gần nhất (wallMs gốc attach ≈ relMs, lệch < 100ms).
  let best = null, bestD = 1e9;
  for (const r of rvfc) { const d = Math.abs(r.wallMs - relMs); if (d < bestD) { bestD = d; best = r; } }
  if (!best || bestD > 500) return null;
  return { lag: +(best.ct - best.mediaTime).toFixed(3), ageMs: bestD, mediaTime: best.mediaTime, ct: best.ct };
}
const staleIntervals = [];
let cur = null;
for (let i = a.seekDoneIdx + 1; i < samples.length; i++) {
  const s = samples[i], prev = samples[i - 1];
  const bt = ballTime(s), btPrev = ballTime(prev);
  const el = elOf(s), elPrev = elOf(prev);
  const frozenBall = bt !== null && btPrev !== null && Math.abs(bt - btPrev) < 0.005;
  const elAdv = el && elPrev ? el.t - elPrev.t : 0;
  if (frozenBall && elAdv > 0) {
    if (!cur) cur = { fromIdx: i - 1, fromMs: prev.relMs, ball: btPrev, elFrom: elPrev.t, phFrom: prev.localPh, ticksFrom: prev.ticks, holdFrom: prev.holdStats, skipFrom: prev.skipTicks };
    cur.toIdx = i; cur.toMs = s.relMs; cur.elTo = el.t; cur.phTo = s.localPh; cur.ticksTo = s.ticks; cur.holdTo = s.holdStats; cur.skipTo = s.skipTicks;
  } else if (cur) {
    const durMs = cur.toMs - cur.fromMs;
    const elDelta = cur.elTo - cur.elFrom;
    if (durMs >= 200 && elDelta >= 0.05) staleIntervals.push(cur);
    cur = null;
  }
}
if (cur) {
  const durMs = cur.toMs - cur.fromMs;
  const elDelta = cur.elTo - cur.elFrom;
  if (durMs >= 200 && elDelta >= 0.05) staleIntervals.push(cur);
}
for (const iv of staleIntervals) {
  const durMs = iv.toMs - iv.fromMs;
  const elDelta = +(iv.elTo - iv.elFrom).toFixed(3);
  const ticksDelta = (iv.ticksTo !== null && iv.ticksFrom !== null) ? iv.ticksTo - iv.ticksFrom : null;
  const holdDelta = (iv.holdTo && iv.holdFrom) ? iv.holdTo.hold - iv.holdFrom.hold : null;
  const drawDelta = (iv.holdTo && iv.holdFrom) ? iv.holdTo.draw - iv.holdFrom.draw : null;
  const skipDelta = (iv.skipTo !== null && iv.skipFrom !== null) ? iv.skipTo - iv.skipFrom : null;
  // Ring render trong khoảng (căn tuyệt đối).
  let rIn = [];
  if (t0 !== null) {
    const a0 = t0 + iv.fromMs, a1 = t0 + iv.toMs;
    rIn = render.filter((x) => x.t >= a0 && x.t <= a1);
  }
  const rPre = rIn.map((x) => x.preMs), rRen = rIn.filter((x) => !x.skipped).map((x) => x.renderMs);
  const rSkipped = rIn.filter((x) => x.skipped).length, rHeld = rIn.filter((x) => x.held).length;
  // Gap rAF max trong khoảng.
  let rafMax = null, rafN = 0;
  if (t0 !== null) {
    const a0 = t0 + iv.fromMs, a1 = t0 + iv.toMs;
    const inWin = raf.filter((x) => x.t >= a0 && x.t <= a1);
    rafN = inWin.length;
    if (inWin.length) rafMax = Math.max(...inWin.map((x) => x.gapMs));
  }
  const rv = rvfcLagNear(Math.round((iv.fromMs + iv.toMs) / 2));
  console.log(`  stale ${iv.fromMs}→${iv.toMs}ms (${durMs}ms) ball=${iv.ball.toFixed(3)} elT ${iv.elFrom.toFixed(3)}→${iv.elTo.toFixed(3)} (+${elDelta}s) | ticks+${ticksDelta ?? "?"} hold+${holdDelta ?? "?"} draw+${drawDelta ?? "?"} skipN3+${skipDelta ?? "?"} | renderTicks n=${rIn.length} preMs mean=${mean(rPre) === null ? "-" : mean(rPre).toFixed(1)} max=${rPre.length ? Math.max(...rPre).toFixed(1) : "-"} renderMs mean=${mean(rRen) === null ? "-" : mean(rRen).toFixed(1)} max=${rRen.length ? Math.max(...rRen).toFixed(1) : "-"} skipped=${rSkipped} held=${rHeld} | rAF maxGap=${rafMax === null ? "-" : rafMax.toFixed(0) + "ms"} (n=${rafN}) | rVFC lag=${rv ? rv.lag + "s (mediaTime " + rv.mediaTime + " ct " + rv.ct + ")" : "-"}`);
}
if (!staleIntervals.length) console.log("  (không có khoảng stale >= 200ms với elT tiến >= 0.05s)");

// ---- Tóm tắt lag + phân bổ.
const after = samples.slice(Math.max(0, a.seekDoneIdx)).map(lagEl).filter((v) => v !== null);
const afterPh = samples.slice(Math.max(0, a.seekDoneIdx)).map(lagPh).filter((v) => v !== null);
const staleTotalMs = staleIntervals.reduce((x, iv) => x + (iv.toMs - iv.fromMs), 0);
const winMs = samples.length && a.seekDoneIdx >= 0 ? samples[samples.length - 1].relMs - samples[a.seekDoneIdx].relMs : 0;
console.log(`== TÓM TẮT: lagEl sau seekDone n=${after.length} max=${after.length ? Math.max(...after).toFixed(3) : "-"} mean=${mean(after) === null ? "-" : mean(after).toFixed(3)} p95=${pct(after, 0.95) === null ? "-" : pct(after, 0.95).toFixed(3)} | lagPh max=${afterPh.length ? Math.max(...afterPh).toFixed(3) : "-"} mean=${mean(afterPh) === null ? "-" : mean(afterPh).toFixed(3)}`);
console.log(`== TÓM TẮT: reSeeks=${nReseek} stalls>=300ms=${stalls.length} (tổng ${stalls.reduce((x, s) => x + s.durMs, 0)}ms) stalls>1500ms=${over1500.length} | staleIntervals=${staleIntervals.length} tổng ${staleTotalMs}ms / cửa sổ ${winMs}ms (${winMs ? (100 * staleTotalMs / winMs).toFixed(0) : "-"}%)`);
const rfAll = render;
if (rfAll.length) {
  const pre = rfAll.map((x) => x.preMs), ren = rfAll.filter((x) => !x.skipped).map((x) => x.renderMs);
  console.log(`== TÓM TẮT RENDER (toàn lượt): ticks=${rfAll.length} preMs mean=${mean(pre).toFixed(1)} p95=${pct(pre, 0.95).toFixed(1)} max=${Math.max(...pre).toFixed(1)} | renderMs mean=${mean(ren).toFixed(1)} p95=${pct(ren, 0.95).toFixed(1)} max=${Math.max(...ren).toFixed(1)} | skipped=${rfAll.filter((x) => x.skipped).length} held=${rfAll.filter((x) => x.held).length}`);
}
if (raf.length) {
  const gaps = raf.map((x) => x.gapMs);
  console.log(`== TÓM TẮT rAF (playing, trừ justWoke): n=${gaps.length} gap mean=${mean(gaps).toFixed(1)}ms p50=${pct(gaps, 0.5).toFixed(1)} p95=${pct(gaps, 0.95).toFixed(1)} max=${Math.max(...gaps).toFixed(1)}ms gaps>100ms=${gaps.filter((g) => g > 100).length} gaps>300ms=${gaps.filter((g) => g > 300).length}`);
}
if (rvfc.length) {
  const lags = rvfc.map((r) => +(r.ct - r.mediaTime).toFixed(3));
  console.log(`== TÓM TẮT rVFC: n=${rvfc.length} lag trình chiếu (ct-mediaTime) mean=${mean(lags).toFixed(3)}s p95=${pct(lags, 0.95).toFixed(3)} max=${Math.max(...lags).toFixed(3)}s`);
} else {
  console.log(`== TÓM TẮT rVFC: không có mẫu (trình duyệt không hỗ trợ hoặc attach thất bại: ${JSON.stringify(results.rvfcAttached)})`);
}
