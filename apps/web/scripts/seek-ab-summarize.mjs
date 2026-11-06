#!/usr/bin/env node
/**
 * Phase 9 đợt 34, luồng Q1 — tổng hợp số liệu A/B seekElement từ các
 * forward-hold.json của harness N2. Chỉ tính toán trên số đo thật, không
 * bịa, không làm tròn che lệch. Cách dùng:
 *   node apps/web/scripts/seek-ab-summarize.mjs <label:json> [<label:json> ...]
 * Ví dụ: node seek-ab-summarize.mjs retry:~/.../retry-1/forward-hold.json ...
 * In ra bảng từng lượt + trung vị/trung bình/khoảng theo biến thể và
 * chênh lệch so với mốc N2 8,97 (n=1) và quiet đợt 33 tv 7,09.
 */
import fs from "node:fs";

const N2_SPARSE = 8.97;
const R33_QUIET_MEDIAN = 7.09;

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  const n = s.length;
  if (!n) return null;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
function mean(a) {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
}
const fmt = (v, d = 2) => (v === null || v === undefined ? "null" : Number(v).toFixed(d));

const groups = {};
for (const arg of process.argv.slice(2)) {
  const idx = arg.indexOf(":");
  const label = arg.slice(0, idx);
  const file = arg.slice(idx + 1);
  const r = JSON.parse(fs.readFileSync(file, "utf8"));
  (groups[label] ??= []).push({
    file, bundle: r.bundle, fps: r.reverse.fps,
    draw: r.reverse.drawDelta, hold: r.reverse.holdDelta,
    wall: r.reverse.wallSec, verdict: r.verdict,
    fwdInterp: r.forward.interpRate,
    rafRevP50: r.raf.reverse?.gapP50 ?? null,
    rafRevP95: r.raf.reverse?.gapP95 ?? null,
    rafRevOver100: r.raf.reverse?.countOver100ms ?? null,
    rafRevExclOver100: r.raf.reverse?.exclFirst?.countOver100ms ?? null,
    loadBeforeRev: r.load.beforeRev, loadEnd: r.load.atEnd,
  });
}
for (const [label, runs] of Object.entries(groups)) {
  console.log(`\n== ${label} (n=${runs.length}) ==`);
  for (const r of runs) {
    console.log(`  ${r.bundle} fps=${fmt(r.fps)} draw=${r.draw} hold=${r.hold} ` +
      `wall=${fmt(r.wall)}s fwd=${fmt(r.fwdInterp, 3)} ` +
      `rafP50=${fmt(r.rafRevP50, 4)} rafP95=${fmt(r.rafRevP95, 4)} ` +
      `over100=${r.rafRevOver100} exclFirstOver100=${r.rafRevExclOver100} ` +
      `loadRev=${r.loadBeforeRev} verdict=${r.verdict}`);
  }
  const fps = runs.map((r) => r.fps);
  const med = median(fps);
  console.log(`  -> median=${fmt(med)} mean=${fmt(mean(fps))} ` +
    `range=${fmt(Math.min(...fps))}–${fmt(Math.max(...fps))} ` +
    `vs N2 ${N2_SPARSE}: ${fmt(((med - N2_SPARSE) / N2_SPARSE) * 100, 1)}% ` +
    `vs r33-quiet-tv ${R33_QUIET_MEDIAN}: ${fmt(((med - R33_QUIET_MEDIAN) / R33_QUIET_MEDIAN) * 100, 1)}%`);
}
const labels = Object.keys(groups);
if (labels.length === 2) {
  const [a, b] = labels.map((l) => median(groups[l].map((r) => r.fps)));
  console.log(`\n== CHÊNH LỆCH TRUNG VỊ ${labels[0]} vs ${labels[1]}: ${fmt(a - b)} fps (${fmt(((a - b) / b) * 100, 1)}%) ==`);
}
