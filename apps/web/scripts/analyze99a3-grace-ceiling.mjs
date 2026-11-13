#!/usr/bin/env node
/**
 * analyze99a3-grace-ceiling.mjs — Phase 9 đợt 99, luồng A3 (bản sao
 * analyze98z3-grace-ceiling.mjs của Z3, chỉ thêm §6 + đối chiếu tốc độ
 * playhead; §1–§5 giữ nguyên để số cũ tái hiện đúng):
 *  (a) §6 mới: phân loại/đếm RỘNG "seek bị re-arm chặn" (ARM-HELD —
 *      xem apps/web/scripts/armHeld99a3.mjs): một lần arm ở tick k được
 *      đếm khi watch vừa arm còn sống ở CẢ k+1 lẫn k+2, drift phản-thực
 *      (tốc độ thiết kế 1,0×) vượt ngưỡng ở CẢ k+1 lẫn k+2, không tail
 *      sống ở tick arm, không resync ở k+1..k+3. Đóng nợ LIMITS đợt 98
 *      §4 mục 4: CANCELLED hẹp = 0 vì đòi drift due ở ĐÚNG tick arm
 *      (300 ms đóng băng < 0,35 s ngưỡng drift nên hầu như không bao
 *      giờ due ở tick arm) — ARM-HELD đếm đúng ca máy re-arm chặn
 *      seek (vd e1r tick 41: drift 0,133 ở tick arm, phản-thực 0,406 /
 *      0,825 ở k+1/k+2, không resync, element resume ở k+3).
 *  (b) Đối chiếu tốc độ playhead: median dph/dt ở tick không giữ
 *      (kỳ vọng ~1,0× theo thiết kế R2; PREVIEW_DT_CAP_S = 2 s không
 *      siết ở gap < 2 s) — in kèm mỗi lượt để người đọc tự kiểm tốc
 *      độ 1,0× dùng trong phản-thực.
 * Phân tích tick vận tốc rAF (window.__w5ticks) + mẫu 100ms của
 * probe96x4/96x4b/97y4/98z3/99a3 cho 3 câu hỏi cũ của X4 + §4 của Y4
 * + §5 của Z3 + §6 của A3.
 * Chạy: node apps/web/scripts/analyze99a3-grace-ceiling.mjs <probe-results.json> [...]
 *  (a) Ngưỡng nhảy hại NỚI từ Δct < 1 frame tuyệt đối thành
 *      Δct < 1,5 frame (đóng nợ LIMITS đợt 96 X4 §5 mục 6: ca b5
 *      Δct = 0,0334 — hơn đúng 0,0001 s so với 1 frame 1/30 — bị bỏ
 *      sót; 1,5 frame = 0,05 s vẫn nhỏ hơn nhiều so với Δph >= 0,5 s
 *      nên chỉ bắt thêm ca biên, không đổi định nghĩa nhảy hại).
 *  (b) §4 mới: đếm seek-bị-ân-hạn-chặn (grace tail 97Y4 + watch sống):
 *      chuỗi >= 2 tick liên tiếp drift vượt ngưỡng mà grace đang bật
 *      (tailLive hoặc watchCeil != null) mà KHÔNG có resync tăng
 *      trong chuỗi + 1 tick sau = 1 lần seek đã bị chặn; có resync
 *      tăng = grace LỌT (báo riêng). Đọc trường `tail` trong tick
 *      (probe97y4 ghi thêm); JSON cũ (b1–b5/c1/c2) không có `tail`
 *      thì chỉ tính phần watchCeil, ghi rõ "không có dữ liệu tail".
 * Phân tích tick vận tốc rAF (window.__w5ticks) + mẫu 100ms của
 * probe96x4/96x4b/97y4 cho 3 câu hỏi cũ của X4 + §4 mới của Y4.
 * Chạy: node apps/web/scripts/analyze97y4-grace-ceiling.mjs <probe-results.json> [...]
 * In tóm tắt từng lượt + bảng gộp. Không đụng code production.
 * Caveat (kế thừa W5 §6 mục 3): tick probe != tick app (±1 tick),
 * hook resyncsV có thể cập nhật chậm 1 nhịp.
 */
import fs from "node:fs";
import { classifyArmHeld99A3 } from "./armHeld99a3.mjs";

const FRAME = 1 / 30;
const DRIFT = 0.35;
// Đợt 97 Y4 — ngưỡng nhảy hại NỚI: Δct < 1,5 frame (0,05 s) thay vì
// đúng 1 frame (xem header (a)): bắt ca biên như b5 (Δct = 0,0334).
const HARMFUL_CT_MAX = 1.5 * FRAME;
const files = process.argv.slice(2);
if (!files.length) { console.error("usage: analyze98z3-grace-ceiling.mjs <probe-results.json> [...]"); process.exit(2); }

function pct(arr, p) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
}

  const pool = {
  rearms: [], cancels: 0, delayed: 0, notDue: 0, ambiguous: 0,
  harmfulJumps: 0, harmfulCarveOut: 0, resyncs: [], driftResyncsTotal: 0, resyncAfterJump: 0, seekStuckGe3s: 0,
  stalls: [], ceilingReleases: 0, ceilingCandidates: 0,
  advTicksGt035: 0, advTicks: 0,
  // Đợt 97 Y4 §4 — grace (tail + watch sống) chặn seek:
  tailTicks: 0, tailOverTicks: 0, suppressedSeeks: 0, leakedSeeks: 0, tailRuns: [],
  // Đợt 98 Z3 §5 — bò (crawl):
  crawlArms: 0, crawlTicks: 0, crawlLeaks: 0,
  // Đợt 99 A3 §6 — seek bị re-arm chặn (ARM-HELD, phân loại rộng):
  armHeld: 0, armHeldInconclusive: 0, armHeldEvents: [],
  // Đợt 99 A3 — đối chiếu tốc độ playhead khi không giữ (mỗi lượt):
  phRates: [],
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
  // Đợt 98 Z3 — carve-out nhảy hại ở đầu khoảng seeking (xem header (a)):
  // tick nằm trong phần mở rộng TRƯỚC mốc bắt đầu của một khoảng seeking
  // ([start−600, start)) thì seeking chưa bay — nhảy ở đó là nguyên nhân
  // (drift re-seek bắn rồi element mới seeking), không phải hệ quả.
  // Tick TRONG khoảng seeking thật vẫn loại như cũ (seek đang bay lo).
  const inPreSeeking = (relMs) => seekingIntervals.some((iv) => relMs >= iv.start - 600 && relMs < iv.start);
  const usableJump = ticks.map((tk, i) => {
    if (usable[i]) return true;
    const relMs = tk.t + offset;
    return inPreSeeking(relMs) && relMs >= seekDoneRel && relMs <= lastSampleRel + 1000 && tk.ph < 5.9;
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
  const harmfulCarveOutIdx = [];
  for (let i = 1; i < ticks.length; i++) {
    if (!usableJump[i] || !usableJump[i - 1]) continue;
    // Đợt 97 Y4 — ngưỡng NỚI 1,5 frame (xem HARMFUL_CT_MAX).
    // Đợt 98 Z3 — đếm bằng usableJump (carve-out đầu-seeking, xem trên).
    if (dph[i] >= 0.5 && dct[i] < HARMFUL_CT_MAX - 1e-9) {
      harmful++;
      harmfulIdx.push(i);
      if (!usable[i]) harmfulCarveOutIdx.push(i); // chỉ carve-out mới bắt được
    }
  }
  pool.harmfulJumps += harmful;
  pool.harmfulCarveOut += harmfulCarveOutIdx.length;
  console.log(`  tick ph nhảy hại (Δph>=0,5 & Δct<1,5 frame): ${harmful} (trong đó carve-out đầu-seeking: ${harmfulCarveOutIdx.length})`);
  for (const i of harmfulIdx.slice(0, 12)) {
    console.log(`    nhảy hại relMs=${ticks[i].t + offset} Δph=${dph[i].toFixed(3)} Δct=${dct[i].toFixed(3)} drift=${drift[i].toFixed(3)}${harmfulCarveOutIdx.includes(i) ? " [CARVE-OUT đầu-seeking]" : ""}`);
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

  // ---- (4) Đợt 97 Y4 — grace (tail 97Y4 + watch sống) chặn seek ----
  // Tick nào grace đang bật: tail != null (probe97y4 ghi thêm) hoặc
  // watchCeil != null (watch sống — JSON cũ vẫn có trường này).
  // Chuỗi >= 2 tick liên tiếp drift vượt ngưỡng mà grace bật suốt
  // chuỗi = 1 lần seek đáng lẽ bắn ở tick thứ 2 (confirmTicks = 2)
  // mà KHÔNG có resync tăng trong chuỗi + 1 tick sau => BỊ CHẶN;
  // có resync tăng => grace LỌT. Chuỗi đứt khi drift về dưới ngưỡng
  // hoặc tick không usable (seeking / ngoài cửa sổ) — đúng luật
  // overCount reset của shouldIssueForwardReseek.
  const hasTailData = ticks.some((tk) => tk.tail !== undefined);
  const graceOn = ticks.map((tk) => tk.tail != null || tk.watchCeil != null);
  let tailTicks = 0, tailOverTicks = 0;
  for (let i = 0; i < ticks.length; i++) {
    if (!usable[i]) continue;
    if (tkHasTail(ticks[i])) tailTicks++;
    if (graceOn[i] && Math.abs(drift[i]) > DRIFT) tailOverTicks++;
  }
  function tkHasTail(tk) { return tk.tail != null; }
  pool.tailTicks += tailTicks; pool.tailOverTicks += tailOverTicks;
  const resyncUpAt = (j) => {
    if (j < 1 || j >= ticks.length) return false;
    const a = ticks[j - 1].resyncsV, b = ticks[j].resyncsV;
    return typeof a === "number" && typeof b === "number" && b > a;
  };
  const runs = [];
  {
    let i = 0;
    while (i < ticks.length) {
      if (!usable[i] || !graceOn[i] || Math.abs(drift[i]) <= DRIFT) { i++; continue; }
      let j = i;
      while (j + 1 < ticks.length && usable[j + 1] && graceOn[j + 1] && Math.abs(drift[j + 1]) > DRIFT) j++;
      const len = j - i + 1;
      let leaked = false;
      for (let k = i + 1; k <= Math.min(j + 1, ticks.length - 1); k++) if (resyncUpAt(k)) { leaked = true; break; }
      const maxDrift = Math.max(...drift.slice(i, j + 1).map((d) => Math.abs(d)));
      const tailCovered = ticks.slice(i, j + 1).some((tk) => tk.tail != null);
      runs.push({ startRel: ticks[i].t + offset, endRel: ticks[j].t + offset, len, maxDrift, leaked, tailCovered });
      i = j + 1;
    }
  }
  const suppressed = runs.filter((r) => r.len >= 2 && !r.leaked);
  const leaked = runs.filter((r) => r.len >= 2 && r.leaked);
  pool.suppressedSeeks += suppressed.length;
  pool.leakedSeeks += leaked.length;
  for (const r of runs) pool.tailRuns.push({ ...r, label });
  console.log(`  grace (tail 97Y4 + watch sống): tick tail sống=${tailTicks}${hasTailData ? "" : " (JSON cũ — không có dữ liệu tail, chỉ tính watchCeil)"} | tick grace bật + drift vượt=${tailOverTicks} | chuỗi grace >=2 tick: ${runs.length} (BỊ CHẶN=${suppressed.length}, LỌT=${leaked.length}, chuỗi 1 tick=${runs.filter((r) => r.len === 1).length})`);
  for (const r of runs) {
    console.log(`    chuỗi grace relMs=${r.startRel}→${r.endRel} len=${r.len} maxDrift=${r.maxDrift.toFixed(3)} tail=${r.tailCovered ? "có" : "không (chỉ watch)"} => ${r.len >= 2 ? (r.leaked ? "LỌT (resync vẫn tăng)" : "BỊ CHẶN (không resync)") : "chưa đủ 2 tick xác nhận"}`);
  }

  // ---- (5) Đợt 98 Z3 — bò (crawl): arm vì bò + re-seek sau arm-vì-bò ----
  // Trường crawlArms/crawlTicks do probe98z3 ghi từ hook
  // __vcutResumeFreezeCrawl98Z3 (JSON cũ không có → ghi rõ, chỉ tính
  // phần watchCeil như §4). Re-seek trong 3 tick sau 1 lần arm-vì-bò
  // = fix LỌT (watch arm vì bò mà seek vẫn bắn); không có = fix giữ được.
  const hasCrawlData = ticks.some((tk) => typeof tk.crawlArms === "number");
  let crawlArmsTotal = 0, crawlTicksTotal = 0;
  const crawlArmEvents = [];
  if (hasCrawlData) {
    const firstC = ticks.find((tk) => typeof tk.crawlArms === "number");
    const lastC = [...ticks].reverse().find((tk) => typeof tk.crawlArms === "number");
    crawlArmsTotal = (lastC?.crawlArms ?? 0) - (firstC?.crawlArms ?? 0);
    const firstT = ticks.find((tk) => typeof tk.crawlTicks === "number");
    const lastT = [...ticks].reverse().find((tk) => typeof tk.crawlTicks === "number");
    crawlTicksTotal = (lastT?.crawlTicks ?? 0) - (firstT?.crawlTicks ?? 0);
    for (let k = 1; k < ticks.length; k++) {
      const a = ticks[k - 1].crawlArms, b = ticks[k].crawlArms;
      if (typeof a === "number" && typeof b === "number" && b > a) {
        let resyncAfter = null;
        for (let j = k; j <= Math.min(k + 3, ticks.length - 1); j++) {
          const ra = ticks[j - 1].resyncsV, rb = ticks[j].resyncsV;
          if (typeof ra === "number" && typeof rb === "number" && rb > ra) { resyncAfter = j - k; break; }
        }
        crawlArmEvents.push({ relMs: ticks[k].t + offset, drift: drift[k], resyncAfter });
      }
    }
  }
  pool.crawlArms += crawlArmsTotal;
  pool.crawlTicks += crawlTicksTotal;
  pool.crawlLeaks += crawlArmEvents.filter((e) => e.resyncAfter !== null).length;
  console.log(`  bò (crawl) 98Z3: arm-vì-bò=${crawlArmsTotal} tick-bò=${crawlTicksTotal}${hasCrawlData ? "" : " (JSON cũ — không có dữ liệu crawl)"} | re-seek trong 3 tick sau arm-vì-bò: ${crawlArmEvents.filter((e) => e.resyncAfter !== null).length}`);
  for (const e of crawlArmEvents) console.log(`    arm-vì-bò relMs=${e.relMs} drift=${e.drift.toFixed(3)} re-seek sau=${e.resyncAfter === null ? "không trong 3 tick (đã giữ được)" : "+" + e.resyncAfter + " tick (LỌT)"}`);

  // ---- (6) Đợt 99 A3 — seek bị re-arm chặn (ARM-HELD, phân loại rộng) ----
  // Đối chiếu tốc độ playhead khi KHÔNG giữ (median dph/dt ở tick không
  // watch/tail, ph tăng): kỳ vọng ~1,0× theo thiết kế R2 (playhead tăng
  // đúng wall-clock; PREVIEW_DT_CAP_S = 2 s không siết ở gap < 2 s).
  // Tốc độ phản-thực dùng 1,0× cố định (xem armHeld99a3.mjs); median đo
  // được chỉ để đối chiếu — lệch khỏi 1,0× quá 0,3 hoặc n < 5 thì báo
  // rõ để người đọc tự xét độ tin cậy của ca ARM-HELD lượt đó.
  const phRateSamples = [];
  for (let i = 1; i < ticks.length; i++) {
    if (ticks[i].watchCeil == null && ticks[i].tail == null) {
      const dt = ticks[i].t - ticks[i - 1].t;
      const dph = ticks[i].ph - ticks[i - 1].ph;
      if (dt > 0 && dph > 0) phRateSamples.push(dph / (dt / 1000));
    }
  }
  const phRateMedian = pct(phRateSamples, 50);
  pool.phRates.push({ label, median: phRateMedian, n: phRateSamples.length });
  const rateFlag = phRateSamples.length < 5
    ? " (n<5 — median không đủ mẫu, đối chiếu yếu)"
    : (phRateMedian !== null && Math.abs(phRateMedian - 1) > 0.3
      ? " (lệch thiết kế 1,0× quá 0,3 — ARM-HELD lượt này tin cậy thấp)"
      : "");
  console.log(`  tốc độ playhead khi không giữ: median=${phRateMedian === null ? "?" : phRateMedian.toFixed(2)}x (n=${phRateSamples.length})${rateFlag}`);
  // Phân loại lại TỪNG lần arm ở §1 bằng classifier §6 (xem armHeld99a3.mjs):
  // ARM-HELD = watch giữ đủ 2 tick + phản-thực due 2 tick + không tail ở
  // tick arm + không resync k+1..k+3. INCONCLUSIVE = thiếu tick k+3.
  for (const k of rearmIdx) {
    const cls6 = classifyArmHeld99A3(ticks, k);
    const ev6 = cls6.evidence;
    if (cls6.verdict === "ARM-HELD") pool.armHeld++;
    else if (cls6.verdict === "INCONCLUSIVE") pool.armHeldInconclusive++;
    pool.armHeldEvents.push({ label, relMs: ticks[k].t + offset, ...cls6 });
    const iv = ev6.rateIntervalDesign
      ? `[${ev6.rateIntervalDesign[0].toFixed(2)}, ${ev6.rateIntervalDesign[1] === Infinity ? "∞" : ev6.rateIntervalDesign[1].toFixed(2)}]`
      : "—";
    console.log(`    §6 arm relMs=${ticks[k].t + offset} driftArm=${ev6.driftAtArm} (CANCELLED-hẹp due=${ev6.oldCancelledDue}) tail@k=${ev6.tailAtArm} watch@k+1/k+2=${ev6.watchAtK1}/${ev6.watchAtK2} driftCF=${ev6.driftCfK1}/${ev6.driftCfK2} resyncSau=${ev6.resyncAt === null ? "không" : "+" + ev6.resyncAt + " tick"} khoảng-tốc-độ-chứa-1,0×=${iv}${ev6.windowContaminated ? ` [NHIỄM-PAUSE-SEEK: ${ev6.contaminationKind ?? "ct lùi trong cửa sổ"}]` : ""} => ${cls6.verdict} (${cls6.reason})`);
  }
  if (!rearmIdx.length) console.log(`  §6 ARM-HELD: không có lần arm nào trong lượt`);
}

console.log(`\n===== GỘP ${files.length} lượt =====`);
console.log(`re-arm: ${pool.rearms.length} | CANCELLED=${pool.cancels} DELAYED=${pool.delayed} NOT-DUE=${pool.notDue} AMBIGUOUS=${pool.ambiguous}`);
for (const ev of pool.rearms) console.log(`  ${ev.label} relMs=${ev.relMs} driftPrev=${ev.dPrev} driftArm=${ev.dArm} => ${ev.cls}`);
console.log(`ARM-HELD §6 (99A3): ${pool.armHeld} | INCONCLUSIVE (thiếu tick k+3): ${pool.armHeldInconclusive}`);
for (const ev of pool.armHeldEvents) {
  const e6 = ev.evidence;
  const iv = e6.rateIntervalDesign
    ? `[${e6.rateIntervalDesign[0].toFixed(2)}, ${e6.rateIntervalDesign[1] === Infinity ? "∞" : e6.rateIntervalDesign[1].toFixed(2)}]`
    : "—";
  console.log(`  ${ev.label} relMs=${ev.relMs} driftArm=${e6.driftAtArm} (due-hẹp=${e6.oldCancelledDue}) driftCF=${e6.driftCfK1}/${e6.driftCfK2} khoảng-tốc-độ=${iv}${e6.windowContaminated ? " [NHIỄM-PAUSE-SEEK]" : ""} => ${ev.verdict} (${ev.reason})`);
}
console.log(`tốc độ playhead khi không giữ (đối chiếu 1,0×): ${pool.phRates.map((x) => `${x.label}: ${x.median === null ? "?" : x.median.toFixed(2)}x (n=${x.n})`).join(" | ")}`);
console.log(`tick ph nhảy hại: ${pool.harmfulJumps} (carve-out đầu-seeking: ${pool.harmfulCarveOut}) | re-seek video: ${pool.resyncs.length} | drift re-seek (đã trừ forceSeek+restart): ${pool.driftResyncsTotal} | sau nhảy hại ≤2 tick: ${pool.resyncAfterJump} | seeking kẹt >=3s: ${pool.seekStuckGe3s}`);
console.log(`bò (crawl) 98Z3: arm-vì-bò=${pool.crawlArms} tick-bò=${pool.crawlTicks} | re-seek sau arm-vì-bò (LỌT)=${pool.crawlLeaks}`);
console.log(`tick element tăng >=1 frame: ${pool.advTicks}, trong đó Δct>0,35: ${pool.advTicksGt035} (${pool.advTicks ? (100 * pool.advTicksGt035 / pool.advTicks).toFixed(0) : "?"}%)`);
console.log(`stall >=300ms: ${pool.stalls.length} | ứng viên trần (>=4,5s): ${pool.ceilingCandidates} | NHẢ TRẦN quan sát được: ${pool.ceilingReleases}`);
console.log(`grace 97Y4 §4: tick tail sống=${pool.tailTicks} | tick grace bật + drift vượt=${pool.tailOverTicks} | chuỗi grace >=2 tick BỊ CHẶN=${pool.suppressedSeeks} LỌT=${pool.leakedSeeks}`);
for (const r of pool.tailRuns) console.log(`  ${r.label} relMs=${r.startRel}→${r.endRel} len=${r.len} maxDrift=${r.maxDrift.toFixed(3)} tail=${r.tailCovered ? "có" : "không (chỉ watch)"} => ${r.len >= 2 ? (r.leaked ? "LỌT" : "BỊ CHẶN") : "chuỗi 1 tick"}`);
