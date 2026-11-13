#!/usr/bin/env node
/**
 * analyze96x4-grace-ceiling.mjs — Phase 9 đợt 96, luồng X4.
 * Phân tích tick vận tốc rAF (window.__w5ticks) + mẫu 100ms của
 * probe95w5-velocity.mjs / probe96x4.mjs cho 3 câu hỏi:
 *  (1) Ân hạn 1 tick sau re-arm (Đợt 95 W5) có HỦY được re-seek nào
 *      không ở tải vừa (rAF gap 300–500 ms)? Chữ ký HỦY: tại tick arm,
 *      drift đã vượt ngưỡng ở tick trước VÀ tick arm (seek đáng lẽ bắn
 *      tick arm), sau đó element resume trong 1–2 tick (drift về dưới
 *      ngưỡng) mà resyncsV KHÔNG tăng. Đối chiếu: DELAYED (resync tăng
 *      1 tick sau arm — như p3b đợt 95), NOT-DUE (drift chưa đủ 2 tick
 *      xác nhận lúc arm nên grace là no-op).
 *  (2) Chu kỳ stall dài (nợ W5 §2.3): đếm tick ph nhảy hại
 *      (Δph >= 0,5 trong khi Δct < 1 frame), re-seek nào đi sau nhảy
 *      hại trong 2 tick, khoảng seeking kẹt >= 3 s, và phân phối chung
 *      Δph/Δct (kẹp dt cố định có phá phát lành không?).
 *  (3) Bằng chứng NHẢ trần 5000 ms: stall >= 4500 ms — playhead có
 *      chạy tiếp trong khi ct còn đóng băng sau mốc stall+5000 ms
 *      không? rTicks có ngừng tăng đúng mốc đó không?
 *
 * Chạy: node apps/web/scripts/analyze96x4-grace-ceiling.mjs <probe-results.json> [...]
 * In tóm tắt từng lượt + bảng gộp. Không đụng code production.
 * Caveat (kế thừa W5 §6 mục 3): tick probe != tick app (±1 tick),
 * hook resyncsV có thể cập nhật chậm 1 nhịp.
 */
import fs from "node:fs";

const FRAME = 1 / 30;
const DRIFT = 0.35;
const files = process.argv.slice(2);
if (!files.length) { console.error("usage: analyze96x4-grace-ceiling.mjs <probe-results.json> [...]"); process.exit(2); }

function pct(arr, p) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
}

const pool = {
  rearms: [], cancels: 0, delayed: 0, notDue: 0, ambiguous: 0,
  harmfulJumps: 0, resyncs: [], driftResyncsTotal: 0, resyncAfterJump: 0, seekStuckGe3s: 0,
  stalls: [], ceilingReleases: 0, ceilingCandidates: 0,
  advTicksGt035: 0, advTicks: 0,
};

for (const f of files) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const ticks = r.velocityTicks || [];
  const label = `${r.engine} load${r.loadN} gop${r.gop} ${r.phase}`;
  console.log(`\n===== ${label} (${f})`);
  console.log(`  velocityTicks=${ticks.length} samples100ms=${(r.samples || []).length} seekDoneRelMs=${r.analysis?.seekDoneRelMs ?? "?"}`);
  if (ticks.length < 10) { console.log("  (không đủ tick — bỏ qua)"); continue; }

  const gaps = [];
  for (let i = 1; i < ticks.length; i++) gaps.push(ticks[i].t - ticks[i - 1].t);
  const gapMean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  console.log(`  rAF gap: n=${gaps.length} mean=${gapMean.toFixed(0)}ms p50=${pct(gaps, 50)} p95=${pct(gaps, 95)} max=${Math.max(...gaps)}`);
  const band = gapMean >= 300 && gapMean <= 500 ? "TẢI VỪA (300–500ms)" : (gapMean < 300 ? "nhẹ" : "nặng");

  const offset = (r.velT0 ?? 0) - (r.samplerT0 ?? 0);
  const samples0 = r.samples || [];
  const bk0 = r.analysis?.ballElKey;
  // Khoảng seeking từ mẫu 100ms (ball el), mở rộng ±600ms như W5.
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
  const lastSampleRel = samples0.length ? samples0[samples0.length - 1].relMs : Infinity;
  const seekDoneRel = r.analysis?.seekDoneRelMs ?? 0;
  const usable = ticks.map((tk) => {
    const relMs = tk.t + offset;
    return relMs >= seekDoneRel && relMs <= lastSampleRel + 1000 && !inSeeking(relMs) && tk.ph < 5.9;
  });
  const adv = ticks.map((tk, i) => i === 0 ? true : (tk.ct - ticks[i - 1].ct) >= FRAME - 1e-9);
  const drift = ticks.map((tk) => tk.ph - tk.ct);
  const dph = ticks.map((tk, i) => i === 0 ? 0 : tk.ph - ticks[i - 1].ph);
  const dct = ticks.map((tk, i) => i === 0 ? 0 : tk.ct - ticks[i - 1].ct);

  // ---- (1) re-arm + ân hạn: phân loại từng lần arm ----
  const rearmIdx = [];
  for (let k = 1; k < ticks.length; k++) {
    const a = ticks[k - 1].rearms, b = ticks[k].rearms;
    if (typeof a === "number" && typeof b === "number" && b > a) rearmIdx.push(k);
  }
  console.log(`  re-arm: ${rearmIdx.length} lần [${band}]`);
  for (const k of rearmIdx) {
    const relMs = ticks[k].t + offset;
    const dPrev = k - 1 >= 0 ? drift[k - 1] : null;
    const dArm = drift[k];
    const due = dPrev !== null && Math.abs(dPrev) > DRIFT && Math.abs(dArm) > DRIFT;
    // resyncsV tăng trong 3 tick sau arm?
    let resyncAt = null;
    for (let j = k + 1; j <= Math.min(k + 3, ticks.length - 1); j++) {
      const a = ticks[j - 1].resyncsV, b = ticks[j].resyncsV;
      if (typeof a === "number" && typeof b === "number" && b > a) { resyncAt = j - k; break; }
    }
    // drift về dưới ngưỡng trong 2 tick sau arm? (element resume)
    let resumeAt = null;
    for (let j = k + 1; j <= Math.min(k + 2, ticks.length - 1); j++) {
      if (Math.abs(drift[j]) <= DRIFT) { resumeAt = j - k; break; }
    }
    let cls;
    if (!due) cls = "NOT-DUE";
    else if (resyncAt === null && resumeAt !== null) cls = "CANCELLED";
    else if (resyncAt !== null) cls = "DELAYED(resync+" + resyncAt + "tick)";
    else cls = "AMBIGUOUS";
    if (cls === "CANCELLED") pool.cancels++;
    else if (cls.startsWith("DELAYED")) pool.delayed++;
    else if (cls === "NOT-DUE") pool.notDue++;
    else pool.ambiguous++;
    pool.rearms.push({ label, relMs, cls, dPrev: dPrev?.toFixed(3), dArm: dArm.toFixed(3), resyncAt, resumeAt });
    console.log(`    arm relMs=${relMs} driftPrev=${dPrev === null ? "?" : dPrev.toFixed(3)} driftArm=${dArm.toFixed(3)} due=${due} resyncSau=${resyncAt === null ? "không" : "+" + resyncAt + " tick"} driftVềDướiNgưỡng=${resumeAt === null ? "không" : "+" + resumeAt + " tick"} => ${cls}`);
  }

  // ---- (2) chu kỳ stall dài: nhảy hại + re-seek + seek kẹt ----
  let harmful = 0;
  const harmfulIdx = [];
  for (let i = 1; i < ticks.length; i++) {
    if (!usable[i] || !usable[i - 1]) continue;
    if (dph[i] >= 0.5 && dct[i] < FRAME - 1e-9) { harmful++; harmfulIdx.push(i); }
  }
  pool.harmfulJumps += harmful;
  console.log(`  tick ph nhảy hại (Δph>=0,5 & Δct<1 frame): ${harmful}`);
  for (const i of harmfulIdx.slice(0, 12)) {
    console.log(`    nhảy hại relMs=${ticks[i].t + offset} Δph=${dph[i].toFixed(3)} Δct=${dct[i].toFixed(3)} drift=${drift[i].toFixed(3)}`);
  }
  if (harmfulIdx.length > 12) console.log(`    ... và ${harmfulIdx.length - 12} lần nữa`);
  // re-seek: đếm CHÍNH từ tick trace (sampler 100ms dừng ngay khi
  // localPh>=5,0 nên có thể bỏ lỡ re-seek bắn sau re-arm cuối lượt;
  // tick trace ghi tiếp qua hook). resyncsV GỘP 3 đường (forceSeek lúc
  // bắt đầu phát + drift + restartEnded); tách drift = tổng tăng
  // resyncsV − tăng restartV − 1 forceSeek đầu lượt. Số mẫu chỉ đối chiếu.
  const samples = r.samples || [];
  let resyncCount = 0, resyncAfterJump = 0, restartCount = 0;
  let tickResync = 0, tickRestart = 0;
  for (let k = 1; k < ticks.length; k++) {
    const a = ticks[k - 1].resyncsV, b = ticks[k].resyncsV;
    if (typeof a === "number" && typeof b === "number" && b > a) tickResync += (b - a);
    const ra = ticks[k - 1].restartV, rb = ticks[k].restartV;
    if (typeof ra === "number" && typeof rb === "number" && rb > ra) tickRestart += (rb - ra);
  }
  const tickDrift = Math.max(0, tickResync - tickRestart - 1);
  pool.driftResyncsTotal += tickDrift;
  for (let k = 1; k < samples.length; k++) {
    const a = samples[k - 1].restartV, b = samples[k].restartV;
    if (typeof a === "number" && typeof b === "number" && b > a) restartCount += (b - a);
  }
  for (let k = 1; k < samples.length; k++) {
    const a = samples[k - 1].resyncsV, b = samples[k].resyncsV;
    if (typeof a === "number" && typeof b === "number" && b > a) {
      resyncCount += (b - a);
      const relMs = samples[k].relMs;
      // tick gần nhất <= relMs
      let tkIdx = -1;
      for (let i = 0; i < ticks.length; i++) if (ticks[i].t + offset <= relMs) tkIdx = i;
      let jumped = false;
      for (let j = Math.max(1, tkIdx - 2); j <= tkIdx; j++) if (harmfulIdx.includes(j)) jumped = true;
      if (jumped) resyncAfterJump++;
      pool.resyncs.push({ label, relMs, jumped });
    }
  }
  pool.resyncAfterJump += resyncAfterJump;
  const driftResyncs = Math.max(0, resyncCount - restartCount - 1);
  console.log(`  re-seek video: tick trace tổng tăng resyncsV=${tickResync} (restartEnded=${tickRestart}, forceSeek=1) → drift re-seek ≈ ${tickDrift} | mẫu 100ms: tổng tăng=${resyncCount} (restart=${restartCount}) → drift ≈ ${driftResyncs} (đối chiếu — mẫu có thể thiếu re-seek cuối lượt); sau nhảy hại ≤2 tick: ${resyncAfterJump}`);
  // seeking kẹt >= 3 s (mẫu 100ms)
  let stuck = 0;
  for (const iv of seekingIntervals) if (iv.end - iv.start >= 3000) stuck++;
  pool.seekStuckGe3s += stuck;
  console.log(`  khoảng seeking (mẫu 100ms): ${seekingIntervals.map((iv) => `${iv.start}→${iv.end} (${iv.end - iv.start}ms)`).join(", ") || "không có"} | kẹt >=3s: ${stuck}`);
  // Phân phối chung Δph/Δct: kẹp dt cố định 0,35 có phá tick lành?
  let advN = 0, advGt = 0;
  for (let i = 1; i < ticks.length; i++) {
    if (!usable[i] || !usable[i - 1]) continue;
    if (adv[i]) { advN++; if (dct[i] > DRIFT) advGt++; }
  }
  pool.advTicks += advN; pool.advTicksGt035 += advGt;
  console.log(`  tick element TĂNG >=1 frame: ${advN}, trong đó Δct>0,35 (kẹp 0,35 sẽ cắt): ${advGt} (${advN ? (100 * advGt / advN).toFixed(0) : "?"}%)`);

  // ---- (3) trần 5000 ms: stall dài, rTicks + ph quanh mốc +5000 ----
  const stalls = [];
  let i = 0;
  while (i < ticks.length) {
    if (!usable[i] || adv[i]) { i++; continue; }
    const lastAdvIdx = i - 1;
    if (lastAdvIdx < 0 || !usable[lastAdvIdx]) { i++; continue; }
    let j = i;
    while (j < ticks.length && usable[j] && !adv[j]) j++;
    const firstAdvIdx = (j < ticks.length && usable[j] && adv[j]) ? j : -1;
    if (firstAdvIdx >= 0) {
      const dur = ticks[firstAdvIdx].t - ticks[lastAdvIdx].t;
      if (dur >= 300) {
        stalls.push({ startTick: lastAdvIdx, endTick: firstAdvIdx, dur,
          startRel: ticks[lastAdvIdx].t + offset, endRel: ticks[firstAdvIdx].t + offset,
          frozenCt: ticks[lastAdvIdx].ct });
      }
    }
    i = j;
  }
  console.log(`  stall >=300ms: ${stalls.length}`);
  for (const st of stalls) {
    pool.stalls.push({ ...st, label });
    const tag = st.dur >= 4500 ? " [ỨNG VIÊN TRẦN]" : "";
    console.log(`    stall ${st.dur}ms rel ${st.startRel}→${st.endRel} ct≈${st.frozenCt.toFixed(3)}${tag}`);
    if (st.dur >= 4500) {
      pool.ceilingCandidates++;
      // Mốc trần: stallStart + 5000 ms (theo đồng hồ tick).
      const ceilT = ticks[st.startTick].t + 5000;
      // Tick đầu tiên sau mốc trần (vẫn trong stall).
      let ceilIdx = -1;
      for (let k = st.startTick + 1; k <= st.endTick; k++) if (ticks[k].t >= ceilT) { ceilIdx = k; break; }
      if (ceilIdx < 0) { console.log(`      (stall kết thúc trước khi tới mốc trần theo tick — stall đo theo tick, mốc trần theo rAF `); continue; }
      const rTicksBefore = ticks[ceilIdx - 1].rTicks;
      const rTicksAfter = ticks[Math.min(ceilIdx + 1, st.endTick)].rTicks;
      // ph chạy bao nhiêu trong khi ct còn đóng băng, từ mốc trần tới cuối stall?
      const phAtCeil = ticks[ceilIdx].ph;
      const phAtEnd = ticks[st.endTick - 1].ph;
      const phRunAfterCeil = phAtEnd - phAtCeil;
      const released = phRunAfterCeil > 0.1;
      if (released) pool.ceilingReleases++;
      console.log(`      mốc trần tick relMs=${ticks[ceilIdx].t + offset} | rTicks trước/sau mốc: ${rTicksBefore} → ${rTicksAfter} | ph chạy sau mốc trần (ct vẫn đóng băng): +${phRunAfterCeil.toFixed(3)}s => ${released ? "NHẢ TRẦN (playhead chạy tiếp)" : "CHƯA NHẢ (ph vẫn đứng)"}`);
      // resync nào bắn trong 2 tick sau mốc trần?
      let rsAfterCeil = null;
      for (let j = ceilIdx; j <= Math.min(ceilIdx + 2, ticks.length - 1); j++) {
        const a = ticks[j - 1]?.resyncsV, b = ticks[j]?.resyncsV;
        if (typeof a === "number" && typeof b === "number" && b > a) { rsAfterCeil = j - ceilIdx; break; }
      }
      console.log(`      re-seek sau mốc trần: ${rsAfterCeil === null ? "không trong 2 tick" : "+" + rsAfterCeil + " tick"}`);
    }
  }
}

console.log(`\n===== GỘP ${files.length} lượt =====`);
console.log(`re-arm: ${pool.rearms.length} | CANCELLED=${pool.cancels} DELAYED=${pool.delayed} NOT-DUE=${pool.notDue} AMBIGUOUS=${pool.ambiguous}`);
for (const ev of pool.rearms) console.log(`  ${ev.label} relMs=${ev.relMs} driftPrev=${ev.dPrev} driftArm=${ev.dArm} => ${ev.cls}`);
console.log(`tick ph nhảy hại: ${pool.harmfulJumps} | re-seek video: ${pool.resyncs.length} | drift re-seek (đã trừ forceSeek+restart): ${pool.driftResyncsTotal} | sau nhảy hại ≤2 tick: ${pool.resyncAfterJump} | seeking kẹt >=3s: ${pool.seekStuckGe3s}`);
console.log(`tick element tăng >=1 frame: ${pool.advTicks}, trong đó Δct>0,35: ${pool.advTicksGt035} (${pool.advTicks ? (100 * pool.advTicksGt035 / pool.advTicks).toFixed(0) : "?"}%)`);
console.log(`stall >=300ms: ${pool.stalls.length} | ứng viên trần (>=4,5s): ${pool.ceilingCandidates} | NHẢ TRẦN quan sát được: ${pool.ceilingReleases}`);
