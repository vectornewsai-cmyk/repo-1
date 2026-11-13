#!/usr/bin/env node
/**
 * analyze94v4-rvfc-fallback.mjs — phân tích kết quả probe94v4-rvfc-fallback.
 * Chạy: node apps/web/scripts/analyze94v4-rvfc-fallback.mjs <json...>
 * (thường 4 file: webkit-pre, chromium-pre, webkit-post, chromium-post)
 * In mỗi run: cửa sổ mù fallback từng clip, captures, viaRvfc, drift
 * playhead − element ct (loại mẫu ±0.5s quanh biên clip c0→c1 — chuyển clip
 * làm element/ct lệch giả), gradient ngang trung bình (proxy độ mờ motion
 * blur: blend 3 frame làm sọc mờ → gradient thấp; khung sắc nét → gradient cao).
 * So sánh: MAD + gradient WebKit vs Chromium theo mediaTime khớp (±16ms),
 * và WebKit pre vs post cùng engine (cô lập tác động của sửa).
 */
import fs from "node:fs";

const files = process.argv.slice(2);
if (files.length < 1) { console.error("cần ít nhất 1 file JSON"); process.exit(2); }
const runs = files.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));

function activeCt(sm) {
  const els = sm.els || [];
  const playing = els.find((e) => !e.paused);
  if (playing) return playing.ct;
  if (els.length) return els[0].ct;
  return null;
}
function stats(a) {
  if (!a.length) return { n: 0 };
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, mean: +(s.reduce((x, y) => x + y, 0) / s.length).toFixed(3), median: +q(0.5).toFixed(3), p90: +q(0.9).toFixed(3), max: +s[s.length - 1].toFixed(3) };
}
/** Gradient ngang trung bình trong vùng video (cột 20–76 của ảnh 96x54 —
 *  loại 2 dải đen letterbox 2 bên) — proxy độ sắc nét / độ mờ motion blur. */
function gradMean(px) {
  if (!px) return null;
  let sum = 0, n = 0;
  for (let y = 0; y < 54; y++) for (let x = 20; x < 75; x++) { sum += Math.abs(px[y * 96 + x + 1] - px[y * 96 + x]); n++; }
  return sum / n;
}
function winOf(ph) {
  // Cửa sổ mù: 2s đầu mỗi clip 3s (c0: ph 0–2, c1: ph 3–5, c2: ph 6–8…).
  // Còn lại là steady.
  return (ph % 3) < 2 ? "blind" : "steady";
}
function summarize(r) {
  const playT0 = r.playT0rel ?? 0;
  const fbAt = {};
  const ringFirst = {};
  const viaFlip = {};
  let prevVia = null;
  const grad = { blind: [], steady: [] };
  for (const sm of r.samples) {
    const rel = sm.t - playT0;
    for (const d of sm.dbg || []) {
      if (d.fb && fbAt[d.id] === undefined) fbAt[d.id] = rel;
      if (d.ring > 0 && ringFirst[d.id] === undefined) ringFirst[d.id] = rel;
    }
    if (sm.viaRvfc !== null) {
      if (prevVia === 1 && sm.viaRvfc === 0) {
        const clip = `c${Math.floor(sm.ph / 3)}`;
        if (viaFlip[clip] === undefined) viaFlip[clip] = rel;
      }
      prevVia = sm.viaRvfc;
    }
    const g = gradMean(sm.px);
    if (g !== null) grad[winOf(sm.ph)].push(g);
  }
  const caps = {};
  for (const d of r.dbgFinal || []) caps[d.id] = { caps: d.caps, dups: d.dups, clears: d.clears, fb: d.fb, ring: d.ring, active: d.active };
  const drifts = [];
  for (const sm of r.samples) {
    const inClip = sm.ph % 3;
    if (inClip >= 2.5 || inClip <= 1.0) continue; // quanh biên chuyển clip — element/ct lệch giả, chuyển clip mất ~1s playhead
    const els = sm.els || [];
    const playing = els.find((e) => !e.paused);
    if (!playing) continue; // không có element đang phát — không tính drift
    const clipStart = Math.floor(sm.ph / 3) * 3;
    drifts.push((sm.ph - clipStart) - playing.ct);
  }
  const absDrifts = drifts.map((d) => Math.abs(d));
  const firstCb = r.pump.length && r.pump[0].relPlayMs !== null && r.pump[0].relPlayMs !== undefined
    ? r.pump[0].relPlayMs : (r.pump.length ? Math.round(r.pump[0].tInvoke - (r.samples[0]?.t ?? 0) - playT0) : null);
  return {
    engine: r.engine, phase: r.phase, samples: r.samples.length,
    pumpCallbacks: r.pump.length, firstCbRelPlayMs: firstCb,
    fallbackAtMs: fbAt, ringFirstMs: ringFirst, viaRvfcFlipTo0Ms: viaFlip,
    capsFinal: caps, silentEngine: r.silentEngine === true,
    drift: stats(drifts), absDrift: stats(absDrifts),
    gradBlind: stats(grad.blind), gradSteady: stats(grad.steady),
    pageErrs: (r.pageErrs || []).length, loadavg: r.loadavg,
  };
}

const sums = runs.map(summarize);
for (const s of sums) {
  console.log(`\n== ${s.engine} ${s.phase} ==`);
  console.log(`samples=${s.samples} pumpCallbacks=${s.pumpCallbacks} firstCbRelPlayMs=${s.firstCbRelPlayMs}`);
  console.log(`fallbackAtMs=${JSON.stringify(s.fallbackAtMs)} ringFirstMs=${JSON.stringify(s.ringFirstMs)} viaRvfcFlipTo0Ms=${JSON.stringify(s.viaRvfcFlipTo0Ms)}`);
  console.log(`capsFinal=${JSON.stringify(s.capsFinal)} silentEngine=${s.silentEngine}`);
  console.log(`drift ph-elCt (trừ biên clip): ${JSON.stringify(s.drift)} | |drift|: ${JSON.stringify(s.absDrift)}`);
  console.log(`gradient ngang (proxy blur; thấp = mờ hơn): blind ${JSON.stringify(s.gradBlind)} | steady ${JSON.stringify(s.gradSteady)}`);
  console.log(`pageErrs=${s.pageErrs} loadavg=${s.loadavg}`);
}

function mad(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}
function compareMad(a, b, label) {
  const bByCt = b.samples.filter((s) => s.px).map((s) => ({ ct: activeCt(s), ph: s.ph, px: s.px }));
  const buckets = { blind: [], steady: [] };
  for (const sm of a.samples) {
    if (!sm.px) continue;
    const ct = activeCt(sm);
    if (ct === null) continue;
    let best = null, bestD = 1e9;
    for (const c of bByCt) { const d = Math.abs(c.ct - ct); if (d < bestD) { bestD = d; best = c; } }
    if (!best || bestD > 0.016) continue;
    buckets[winOf(sm.ph)].push(mad(sm.px, best.px));
  }
  console.log(`\nMAD ${label} (khớp mediaTime ±16ms, grayscale 96x54, thang 0–255):`);
  for (const [k, v] of Object.entries(buckets)) console.log(`  ${k}: ${JSON.stringify(stats(v))}`);
}
const byKey = {};
for (const r of runs) byKey[`${r.engine}-${r.phase}`] = r;
const wkPre = runs.find((r) => r.engine === "webkit" && r.phase.startsWith("pre"));
const crPre = runs.find((r) => r.engine === "chromium" && r.phase.startsWith("pre"));
const wkPost = runs.find((r) => r.engine === "webkit" && r.phase.startsWith("post"));
const crPost = runs.find((r) => r.engine === "chromium" && r.phase.startsWith("post"));
if (wkPre && crPre) compareMad(wkPre, crPre, `WebKit-${wkPre.phase} vs Chromium-${crPre.phase}`);
if (wkPost && crPost) compareMad(wkPost, crPost, `WebKit-${wkPost.phase} vs Chromium-${crPost.phase}`);
if (wkPre && wkPost) compareMad(wkPre, wkPost, `WebKit-${wkPre.phase} vs WebKit-${wkPost.phase} (cùng engine)`);
if (crPre && crPost) compareMad(crPre, crPost, `Chromium-${crPre.phase} vs Chromium-${crPost.phase} (đối chứng hồi quy)`);
if (runs.length === 2 && !wkPre) compareMad(runs[0], runs[1], `${runs[0].engine}-${runs[0].phase} vs ${runs[1].engine}-${runs[1].phase}`);
