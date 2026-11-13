#!/usr/bin/env node
/**
 * analyze95w5-velocity.mjs — Phase 9 đợt 95, luồng W5.
 * Phân tích tick vận tốc rAF (window.__w5ticks) + mẫu 100ms của
 * probe95w5-velocity.mjs để quyết định hướng sửa nợ re-arm trễ 1 tick:
 *  (a) dự đoán stall bằng vận tốc advance — đo tỉ lệ giữ oan;
 *  (b) khoan kích drift re-seek 1 tick sau re-arm — đo re-seek nào bắn
 *      cùng tick / ngay sau re-arm trong khi hold đang active.
 *
 * Chạy: node apps/web/scripts/analyze95w5-velocity.mjs <probe-results.json> [<probe-results2.json> ...]
 * In tóm tắt từng lượt + bảng gộp. Không đụng code production.
 */
import fs from "node:fs";

const FRAME = 1 / 30;
const THRESHOLDS = [0.5, 0.3, 0.25, 0.15, 0.1];
const files = process.argv.slice(2);
if (!files.length) { console.error("usage: analyze95w5-velocity.mjs <probe-results.json> [...]"); process.exit(2); }

function pct(arr, p) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
}

const pool = { normalV: [], stalls: [], falseArmTicks: {}, falseArmEpisodes: {}, onsetWouldArm: {}, resyncs: [] };
for (const T of THRESHOLDS) { pool.falseArmTicks[T] = 0; pool.falseArmEpisodes[T] = 0; pool.onsetWouldArm[T] = 0; }

for (const f of files) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const ticks = r.velocityTicks || [];
  const label = `${r.engine} load${r.loadN} gop${r.gop} ${r.phase}`;
  console.log(`\n===== ${label} (${f})`);
  console.log(`  velocityTicks=${ticks.length} samples100ms=${(r.samples || []).length} seekDoneRelMs=${r.analysis?.seekDoneRelMs ?? "?"} seekDoneIdx=${r.analysis?.seekDoneIdx ?? "?"}`);
  if (ticks.length < 10) { console.log("  (không đủ tick — bỏ qua)"); continue; }

  // Per-tick velocity v = dCt/dt. Tick 0 không có v.
  const v = [null];
  for (let i = 1; i < ticks.length; i++) {
    const dt = (ticks[i].t - ticks[i - 1].t) / 1000;
    const dct = ticks[i].ct - ticks[i - 1].ct;
    v.push(dt > 0 ? dct / dt : null);
  }
  const gaps = [];
  for (let i = 1; i < ticks.length; i++) gaps.push(ticks[i].t - ticks[i - 1].t);
  console.log(`  rAF gap: n=${gaps.length} mean=${(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(0)}ms p50=${pct(gaps, 50)} p95=${pct(gaps, 95)} max=${Math.max(...gaps)}`);

  // Khoảng seeking từ mẫu 100ms (ball el seeking=true): mở rộng ±600ms
  // mỗi bên vì sampler 100ms dưới tải chỉ bắn ~700ms/lần. Tick trong
  // khoảng seeking KHÔNG phải "phát bình thường" và cũng không phải
  // stall resume (R2 seeking-hold lo đường này; detector dừng theo dõi
  // khi seeking) — loại khỏi cả pool bình thường lẫn phát hiện stall.
  // Cũng loại tick sau khi clip hết (ph >= 5.9).
  const offset = (r.velT0 ?? 0) - (r.samplerT0 ?? 0); // tick.t + offset = relMs hệ sampler
  const seekDoneRel = r.analysis?.seekDoneRelMs ?? 0;
  const samples0 = r.samples || [];
  const bk0 = r.analysis?.ballElKey;
  const seekingIntervals = [];
  {
    let cur = null;
    for (const s of samples0) {
      const vids = (s.els || []).filter((e) => e.tag === "VIDEO");
      const el = bk0 !== null && bk0 !== undefined ? vids[Number(bk0)] ?? null : null;
      if (el && el.seeking) {
        if (cur === null) cur = { start: s.relMs, end: s.relMs };
        else cur.end = s.relMs;
      } else if (cur !== null) { seekingIntervals.push(cur); cur = null; }
    }
    if (cur !== null) seekingIntervals.push(cur);
  }
  const inSeeking = (relMs) => seekingIntervals.some((iv) => relMs >= iv.start - 600 && relMs <= iv.end + 600);
  console.log(`  khoảng seeking (mẫu 100ms, ±600ms): ${seekingIntervals.map((iv) => `${iv.start}→${iv.end}`).join(", ") || "không có"}`);
  // Cắt tick sau khi probe dừng phát (mẫu 100ms cuối + 1000ms): sampler
  // rAF vẫn chạy sau khi togglePlay tắt nên tick đuôi (ph đóng băng,
  // element đóng băng, playing=false) không phải tick phát bình thường.
  const lastSampleRel = samples0.length ? samples0[samples0.length - 1].relMs : Infinity;
  // Tick dùng được: sau seekDone, không trong khoảng seeking, chưa hết clip,
  // chưa qua thời điểm dừng phát.
  const usable = ticks.map((tk) => {
    const relMs = tk.t + offset;
    return relMs >= seekDoneRel && relMs <= lastSampleRel + 1000 && !inSeeking(relMs) && tk.ph < 5.9;
  });
  const adv = ticks.map((tk, i) => i === 0 ? true : (tk.ct - ticks[i - 1].ct) >= FRAME - 1e-9);
  const stalls = [];
  let i = 0;
  while (i < ticks.length) {
    // tìm tick tăng cuối trước 1 chạy đóng băng (chỉ trên tick usable)
    if (!usable[i] || adv[i]) { i++; continue; }
    const lastAdvIdx = i - 1;
    if (lastAdvIdx < 0 || !usable[lastAdvIdx]) { i++; continue; }
    let j = i;
    while (j < ticks.length && usable[j] && !adv[j]) j++;
    const firstAdvIdx = (j < ticks.length && usable[j] && adv[j]) ? j : -1;
    if (firstAdvIdx >= 0) {
      const dur = ticks[firstAdvIdx].t - ticks[lastAdvIdx].t;
      const stallStartRel = ticks[lastAdvIdx].t + offset;
      if (dur >= 300) {
        stalls.push({ startTick: lastAdvIdx, endTick: firstAdvIdx, dur,
          startRel: stallStartRel, endRel: ticks[firstAdvIdx].t + offset,
          frozenCt: ticks[lastAdvIdx].ct,
          vOnset: v[lastAdvIdx], vPrev: lastAdvIdx > 0 ? v[lastAdvIdx - 1] : null });
      }
    }
    i = j;
  }
  console.log(`  stall >=300ms sau seekDone (từ tick trace): ${stalls.length}`);
  for (const st of stalls) {
    console.log(`    stall ${st.dur}ms rel ${st.startRel}→${st.endRel} ct≈${st.frozenCt.toFixed(3)} v_onset=${st.vOnset === null ? "?" : st.vOnset.toFixed(2)} v_prev=${st.vPrev === null ? "?" : st.vPrev.toFixed(2)} | arm-sớm ở ngưỡng: ${THRESHOLDS.map((T) => `${T}:${st.vOnset !== null && st.vOnset < T ? "CÓ" : "không"}`).join(" ")}`);
    pool.stalls.push({ ...st, label });
    for (const T of THRESHOLDS) if (st.vOnset !== null && st.vOnset < T) pool.onsetWouldArm[T]++;
  }

  // Tick "bình thường": không nằm trong stall và không nằm trong 600ms
  // trước onset của 1 stall. Phân phối v + đếm giữ oan theo ngưỡng.
  const inStallOrPre = (idx) => {
    const t = ticks[idx].t;
    for (const st of stalls) {
      if (t >= ticks[st.startTick].t - 600 && t <= ticks[st.endTick].t) return true;
    }
    return false;
  };
  const normalV = [];
  const normalIdx = [];
  for (let k = 1; k < ticks.length; k++) {
    if (v[k] === null) continue;
    if (!usable[k] || !usable[k - 1]) continue;
    if (inStallOrPre(k)) continue;
    normalV.push(v[k]);
    normalIdx.push(k);
  }
  pool.normalV.push(...normalV);
  const sorted = [...normalV].sort((a, b) => a - b);
  console.log(`  tick bình thường: n=${normalV.length} v p5=${pct(sorted, 5)?.toFixed(2)} p10=${pct(sorted, 10)?.toFixed(2)} p25=${pct(sorted, 25)?.toFixed(2)} p50=${pct(sorted, 50)?.toFixed(2)} p75=${pct(sorted, 75)?.toFixed(2)} min=${sorted.length ? sorted[0].toFixed(2) : "?"}`);
  for (const T of THRESHOLDS) {
    const bad = normalIdx.filter((k) => v[k] !== null && v[k] < T);
    // gộp tick oan liên tiếp thành 1 episode (1 lần giữ oan ~1 tick)
    let eps = 0;
    for (let m = 0; m < bad.length; m++) if (m === 0 || bad[m] !== bad[m - 1] + 1) eps++;
    pool.falseArmTicks[T] += bad.length;
    pool.falseArmEpisodes[T] += eps;
    console.log(`    ngưỡng v<${T}: giữ oan ${bad.length}/${normalV.length} tick (${normalV.length ? (100 * bad.length / normalV.length).toFixed(1) : "?"}%), ${eps} episode`);
  }

  // (b) re-seek video (từ mẫu 100ms: resyncsV tăng) so với re-arm (từ tick:
  // rearms tăng). Đổi tick.t sang hệ relMs sampler bằng offset.
  const samples = r.samples || [];
  const resyncEvents = [];
  for (let k = 1; k < samples.length; k++) {
    const a = samples[k - 1].resyncsV, b = samples[k].resyncsV;
    if (typeof a === "number" && typeof b === "number" && b > a) {
      resyncEvents.push({ relMs: samples[k].relMs, from: a, to: b,
        ph: samples[k].localPh, hold: samples[k].hold });
    }
  }
  // re-arm tick: tick đầu tiên rearms tăng lên giá trị mới
  const rearmTicks = [];
  for (let k = 1; k < ticks.length; k++) {
    const a = ticks[k - 1].rearms, b = ticks[k].rearms;
    if (typeof a === "number" && typeof b === "number" && b > a) {
      rearmTicks.push({ relMs: ticks[k].t + offset, tickIdx: k, from: a, to: b });
    }
  }
  console.log(`  re-seek video (mẫu 100ms): ${resyncEvents.length} | re-arm (tick trace): ${rearmTicks.length}`);
  for (const ev of resyncEvents) {
    // re-arm gần nhất TRƯỚC re-seek (trong 2000ms) + hold có active không
    let prevRearm = null;
    for (const rt of rearmTicks) if (rt.relMs <= ev.relMs + 200 && (!prevRearm || rt.relMs > prevRearm.relMs)) prevRearm = rt;
    const dtRearm = prevRearm ? ev.relMs - prevRearm.relMs : null;
    console.log(`    re-seek relMs=${ev.relMs} ph=${ev.ph} resyncsV ${ev.from}→${ev.to} rTicks=${ev.hold?.resumeTicks ?? "?"} rHolds=${ev.hold?.resumeHolds ?? "?"} rearms=${ev.hold?.resumeRearms94V2 ?? "?"} | re-arm gần nhất trước đó: ${prevRearm ? `relMs=${prevRearm.relMs} (${dtRearm}ms trước re-seek)` : "không có trong 2s"}`);
    pool.resyncs.push({ ...ev, label, dtRearmMs: dtRearm });
  }
  for (const rt of rearmTicks) {
    console.log(`    re-arm relMs=${rt.relMs} rearms ${rt.from}→${rt.to}`);
  }
}

console.log(`\n===== GỘP ${files.length} lượt =====`);
console.log(`stall >=300ms: ${pool.stalls.length}`);
for (const T of THRESHOLDS) {
  console.log(`ngưỡng v<${T}: onset arm-sớm ${pool.onsetWouldArm[T]}/${pool.stalls.length} stall | giữ oan ${pool.falseArmTicks[T]} tick / ${pool.normalV.length} tick bình thường (${pool.normalV.length ? (100 * pool.falseArmTicks[T] / pool.normalV.length).toFixed(1) : "?"}%), ${pool.falseArmEpisodes[T]} episode`);
}
const nv = [...pool.normalV].sort((a, b) => a - b);
console.log(`v bình thường gộp: n=${nv.length} p5=${pct(nv, 5)?.toFixed(2)} p10=${pct(nv, 10)?.toFixed(2)} p25=${pct(nv, 25)?.toFixed(2)} p50=${pct(nv, 50)?.toFixed(2)}`);
console.log(`re-seek video gộp: ${pool.resyncs.length}`);
for (const ev of pool.resyncs) {
  console.log(`  ${ev.label} relMs=${ev.relMs} ph=${ev.ph} dtRearmMs=${ev.dtRearmMs ?? "?"}`);
}
