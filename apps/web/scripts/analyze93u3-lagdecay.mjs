// analyze93u3-lagdecay.mjs — Phase 9 đợt 93, luồng U3.
// Phân rã lag sau stall: đọc probe-results.json của probe93u3 và báo cáo
// cho MỖI stall >= 300ms sau seekDone: độ dài stall, playhead tăng trong
// stall, lagPh/lagEl ở cuối stall và +500/+1000/+2000ms sau khi stall hết
// (mẫu gần nhất), lag đỉnh sau seekDone, lag ổn định 2s cuối, re-seek,
// và tóm tắt rVFC. Dùng để trả lời: trần 5000ms có giữ không, lag sau
// stall phân rã ra sao, lag dư có phải frame trình chiếu tụt không.
//
// Chạy: node apps/web/scripts/analyze93u3-lagdecay.mjs <probe-results.json>
import fs from "node:fs";

const file = process.argv[2];
if (!file) { console.error("usage: analyze93u3-lagdecay.mjs <probe-results.json>"); process.exit(2); }
const results = JSON.parse(fs.readFileSync(file, "utf8"));
const samples = results.samples;
const a = results.analysis;
const mean = (arr) => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : null;
const pct = (arr, q) => {
  if (!arr.length) return null;
  const s = [...arr].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

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
// Mẫu gần nhất tại/thời điểm sau relMs mục tiêu.
const nearestAt = (relMs) => {
  let best = null, bestD = 1e9;
  for (const s of samples) { const d = Math.abs(s.relMs - relMs); if (d < bestD) { bestD = d; best = s; } }
  return best && bestD <= 800 ? best : null;
};

console.log(`== ${results.engine} load=${results.load} loadN=${results.loadN ?? "?"} phase=${results.phase} gop=${results.gop} n=${samples.length} seekDoneIdx=${a.seekDoneIdx} seekDoneRelMs=${a.seekDoneRelMs}ms`);

// ---- Stall element sau seekDone (>= 300ms), như analyzer T3.
const stalls = [];
let seg = null;
for (let i = a.seekDoneIdx + 1; i < samples.length; i++) {
  const s = samples[i], prev = samples[i - 1];
  const el = elOf(s), elPrev = elOf(prev);
  const frozen = s.playing && el && elPrev && !el.seeking && Math.abs(el.t - elPrev.t) < 0.005;
  if (frozen && !seg) seg = { fromIdx: i - 1, fromMs: prev.relMs, elT: elPrev.t, phFrom: prev.localPh };
  if (!frozen && seg) {
    seg.toIdx = i - 1; seg.toMs = prev.relMs; seg.durMs = prev.relMs - seg.fromMs; seg.phTo = prev.localPh;
    if (seg.durMs >= 300) stalls.push(seg);
    seg = null;
  }
}
if (seg) {
  const last = samples[samples.length - 1];
  seg.toIdx = samples.length - 1; seg.toMs = last.relMs; seg.durMs = last.relMs - seg.fromMs; seg.phTo = last.localPh;
  if (seg.durMs >= 300) stalls.push(seg);
}
console.log(`== stall >=300ms sau seekDone: ${stalls.length}`);
for (const st of stalls) {
  const endS = samples[st.toIdx];
  const lagEndPh = lagPh(endS), lagEndEl = lagEl(endS);
  const fmt = (relMs) => {
    const s = nearestAt(relMs);
    if (!s) return "n/a";
    return `ph=${s.localPh.toFixed(3)} elT=${elOf(s)?.t.toFixed(3) ?? "?"} lagPh=${lagPh(s) === null ? "null" : lagPh(s).toFixed(3)} lagEl=${lagEl(s) === null ? "null" : lagEl(s).toFixed(3)}`;
  };
  console.log(`  stall ${st.fromMs}→${st.toMs}ms (${st.durMs}ms) elT≈${st.elT} playhead ${st.phFrom.toFixed(3)}→${st.phTo.toFixed(3)} (Δ${(st.phTo - st.phFrom).toFixed(3)}s)${st.durMs > 1500 ? "  <-- VƯỢT 1500ms" : ""}${st.durMs > 5000 ? "  <-- VƯỢT TRẦN 5000ms" : ""}`);
  console.log(`    cuối stall: lagPh=${lagEndPh === null ? "null" : lagEndPh.toFixed(3)} lagEl=${lagEndEl === null ? "null" : lagEndEl.toFixed(3)}`);
  console.log(`    +500ms:  ${fmt(st.toMs + 500)}`);
  console.log(`    +1000ms: ${fmt(st.toMs + 1000)}`);
  console.log(`    +2000ms: ${fmt(st.toMs + 2000)}`);
}
const over1500 = stalls.filter((x) => x.durMs > 1500);
const over5000 = stalls.filter((x) => x.durMs > 5000);

// ---- Re-seek sau seekDone.
let prevSeeking = false, nReseek = 0;
for (let i = a.seekDoneIdx; i < samples.length; i++) {
  const el = elOf(samples[i]);
  if (!el) continue;
  if (el.seeking && !prevSeeking) nReseek++;
  prevSeeking = el.seeking;
}

// ---- Lag đỉnh + lag ổn định 2s cuối.
const after = samples.slice(Math.max(0, a.seekDoneIdx));
const lagElAfter = after.map(lagEl).filter((v) => v !== null);
const lagPhAfter = after.map(lagPh).filter((v) => v !== null);
const tailFrom = Math.max(a.canvasChangeIdx >= 0 ? a.canvasChangeIdx : a.seekDoneIdx, samples.length - 20);
const tail = samples.slice(tailFrom); // từ lúc canvas LẦN ĐẦU rời khung t=5 (tránh mẫu chuyển tiếp seekDone→canvas-đổi-khung làm lệch mean âm)
const lagElTail = tail.map(lagEl).filter((v) => v !== null);
const lagPhTail = tail.map(lagPh).filter((v) => v !== null);
// Playhead - element currentTime (độ lệch đồng hồ store vs media clock).
const phElAfter = after.map((s) => { const el = elOf(s); return el ? s.localPh - el.t : null; }).filter((v) => v !== null);
console.log(`== reSeeks=${nReseek} stalls>=300ms=${stalls.length} stalls>1500ms=${over1500.length} stalls>5000ms=${over5000.length}`);
console.log(`== lag sau seekDone: lagEl max=${lagElAfter.length ? Math.max(...lagElAfter).toFixed(3) : "-"} mean=${mean(lagElAfter) === null ? "-" : mean(lagElAfter).toFixed(3)} p95=${pct(lagElAfter, 0.95) === null ? "-" : pct(lagElAfter, 0.95).toFixed(3)} | lagPh max=${lagPhAfter.length ? Math.max(...lagPhAfter).toFixed(3) : "-"} mean=${mean(lagPhAfter) === null ? "-" : mean(lagPhAfter).toFixed(3)} | ph-elT max=${phElAfter.length ? Math.max(...phElAfter).toFixed(3) : "-"} mean=${mean(phElAfter) === null ? "-" : mean(phElAfter).toFixed(3)}`);
console.log(`== lag ổn định (20 mẫu cuối): lagEl mean=${mean(lagElTail) === null ? "-" : mean(lagElTail).toFixed(3)} max=${lagElTail.length ? Math.max(...lagElTail).toFixed(3) : "-"} | lagPh mean=${mean(lagPhTail) === null ? "-" : mean(lagPhTail).toFixed(3)} max=${lagPhTail.length ? Math.max(...lagPhTail).toFixed(3) : "-"}`);
const rvfc = results.rvfcSamples || [];
if (rvfc.length) {
  const lags = rvfc.map((r) => +(r.ct - r.mediaTime).toFixed(3));
  console.log(`== rVFC: n=${rvfc.length} lag trình chiếu (ct-mediaTime) mean=${mean(lags).toFixed(3)}s p95=${pct(lags, 0.95).toFixed(3)} max=${Math.max(...lags).toFixed(3)}s`);
} else {
  console.log(`== rVFC: 0 mẫu (attach: ${JSON.stringify(results.rvfcAttached)})`);
}
