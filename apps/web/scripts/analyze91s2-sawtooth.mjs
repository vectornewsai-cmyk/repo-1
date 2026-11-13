// analyze91s2-sawtooth.mjs — Đợt 91 S2: mổ xẻ sawtooth lag sau seek từ
// probe-results.json của probe91s2 (mượn sampler R2: 100ms/sample,
// playhead store, element currentTime/seeking, darkCx canvas → ballTime).
// Đọc: node apps/web/scripts/analyze91s2-sawtooth.mjs <probe-results.json>
// In: chuỗi lag theo thời gian sau seekDone, đoạn element đứng yên
// (currentTime không tăng trong lúc phát + không seeking), các lần re-seek
// (seeking true trở lại sau seekDone), đỉnh/thung lũng sawtooth của lag.
import fs from "node:fs";

const file = process.argv[2];
if (!file) { console.error("usage: analyze91s2-sawtooth.mjs <probe-results.json>"); process.exit(2); }
const results = JSON.parse(fs.readFileSync(file, "utf8"));
const samples = results.samples;
const a = results.analysis;

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
const lag = (s) => { const bt = ballTime(s); return bt === null ? null : s.localPh - bt; };

console.log(`== ${results.engine} load=${results.load} phase=${results.phase} n=${samples.length} seekDoneIdx=${a.seekDoneIdx} seekDoneRelMs=${a.seekDoneRelMs}ms playheadAtSeekDone=${a.playheadAtSeekDone}`);
console.log("== chuỗi mẫu sau seekDone (relMs localPh elT seeking ballTime lag holdTicks):");
for (let i = Math.max(0, a.seekDoneIdx); i < samples.length; i++) {
  const s = samples[i];
  const el = elOf(s);
  const bt = ballTime(s);
  const l = lag(s);
  console.log(`  ${String(s.relMs).padStart(6)}ms ph=${s.localPh.toFixed(3)} elT=${el ? el.t.toFixed(3) : "?"} seeking=${el ? el.seeking : "?"} paused=${el ? el.paused : "?"} ball=${bt === null ? "null" : bt.toFixed(3)} lag=${l === null ? "null" : l.toFixed(3)} hold=${s.hold ? s.hold.ticks : "-"}`);
}

// Đoạn element đứng yên: phát + không seeking + currentTime tăng < 0.005
// so với mẫu trước (chu kỳ sampler 100ms → tốc độ < 0.05×). Gom các mẫu
// đứng yên liên tiếp thành đoạn, chỉ giữ đoạn >= 300ms.
console.log("== đoạn element đứng yên sau seekDone (phát, !seeking, ΔelT < 0.005 / mẫu 100ms):");
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
for (const st of stalls) console.log(`  stall ${st.fromMs}→${st.toMs}ms (${st.durMs}ms) elT≈${st.elT} playhead ${st.phFrom.toFixed(3)}→${st.phTo.toFixed(3)} (+${(st.phTo - st.phFrom).toFixed(3)}s trong lúc element đứng yên)`);
if (!stalls.length) console.log("  (không có đoạn đứng yên >= 300ms)");

// Các lần re-seek sau seekDone: seeking false -> true.
console.log("== lần seeking trở lại sau seekDone (re-seek drift):");
let prevSeeking = false, nReseek = 0;
for (let i = a.seekDoneIdx; i < samples.length; i++) {
  const el = elOf(samples[i]);
  if (!el) continue;
  if (el.seeking && !prevSeeking) {
    nReseek++;
    console.log(`  re-seek #${nReseek} tại relMs=${samples[i].relMs} ph=${samples[i].localPh.toFixed(3)} elT=${el.t.toFixed(3)} lag=${(lag(samples[i]) ?? NaN).toFixed(3)}`);
  }
  prevSeeking = el.seeking;
}
if (!nReseek) console.log("  (không có re-seek nào sau seekDone)");

// Đỉnh sawtooth của lag sau seekDone: local max (lag tăng rồi giảm >= 0.1).
console.log("== đỉnh sawtooth lag sau seekDone:");
const lags = samples.map((s, i) => ({ i, relMs: s.relMs, lag: lag(s), ph: s.localPh })).filter((x) => x.lag !== null && x.i >= a.seekDoneIdx);
let peaks = [];
for (let k = 1; k < lags.length - 1; k++) {
  if (lags[k].lag >= lags[k - 1].lag && lags[k].lag > lags[k + 1].lag) peaks.push(lags[k]);
}
for (const p of peaks) console.log(`  đỉnh lag=${p.lag.toFixed(3)}s tại relMs=${p.relMs} ph=${p.ph.toFixed(3)}`);
if (!peaks.length) console.log("  (không có đỉnh local — lag đơn điệu)");
const validLags = lags.map((x) => x.lag);
console.log(`== lag sau seekDone: n=${validLags.length} min=${Math.min(...validLags).toFixed(3)} max=${Math.max(...validLags).toFixed(3)} mean=${(validLags.reduce((x, y) => x + y, 0) / validLags.length).toFixed(3)} reSeeks=${nReseek} stalls>=300ms=${stalls.length} stallTổng=${stalls.reduce((x, s) => x + s.durMs, 0)}ms`);
