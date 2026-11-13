// analyze-71y3-gate-fn.mjs — Phase 9 đợt 71, luồng Y3.
// Phân tích OFFLINE dữ liệu đo thật của launcher Y3 (không đo mới, không Chrome):
//   - re-gate có bắt được FN của gate 6 s không? (FN = gate1a PASS + slot draw < 2 fps;
//     bắt được iff re-gate FAIL đúng phiên FN; an toàn iff PASS ở phiên không FN)
//   - resume-probe: vì sao draw đóng băng sau resume trong khi presented vẫn chạy?
//     (ticks/s, histogram rs, tỉ lệ seeking, delta syncReseeksVideo, mark element,
//     tốc độ draw/hold/skip theo từng giây trong cửa sổ resume)
// Chạy: node apps/web/scripts/analyze-71y3-gate-fn.mjs
// Nguồn: hidden_files/round71-y3/session*/presented-fps.json (+ session4-burner).
// Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4) để cập nhật tỉ lệ FN gộp.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y3DIR = path.join(GOAL, "round71-y3");

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
const wilson95 = (k, n, z = 1.96) => {
  if (n === 0) return [null, null];
  const p = k / n, z2 = z * z;
  const den = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / den;
  const h = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, c - h), Math.min(1, c + h)];
};
const fmtCI = (k, n) => {
  const [lo, hi] = wilson95(k, n);
  return lo === null ? "n/a" : `[${(lo * 100).toFixed(0)}%, ${(hi * 100).toFixed(0)}%]`;
};

const out = [];
const L = (...a) => out.push(a.join(" "));

// ---- Đọc các phiên Y3 ----
const sessions = [];
for (const d of fs.readdirSync(Y3DIR).filter((x) => x.startsWith("session"))) {
  const f = path.join(Y3DIR, d, "presented-fps.json");
  if (!fs.existsSync(f)) { L(`(bỏ qua ${d}: không có presented-fps.json — phiên chết ở gate hoặc chưa chạy)`); continue; }
  try {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    sessions.push({ dir: d, ...j });
  } catch (e) { L(`(bỏ qua ${d}: JSON lỗi ${e.message})`); }
}
sessions.sort((a, b) => a.dir.localeCompare(b.dir));

L("=== 1. RE-GATE vs FN (gate 6 s) — từng phiên Y3 ===");
L("Phiên | gate1a delta (fps) | slot draw fps (rep1/rep2/rep3) | re-gate delta (fps) | FN? | FN bị bắt? | re-gate FP?");
let fnSlotsY3 = 0, totalSlotsY3 = 0, fnSessions = 0, caughtSessions = 0, fpRegateSessions = 0;
for (const s of sessions) {
  const g1 = s.gate1a, g2 = s.gate1b;
  const draws = (s.slots || []).filter((x) => x.valid).map((x) => x.drawFps);
  totalSlotsY3 += draws.length;
  const fnHere = draws.filter((d) => d < 2);
  fnSlotsY3 += fnHere.length;
  const isFn = g1?.verdict === "PASS" && fnHere.length > 0;
  const caught = isFn && g2?.verdict === "FAIL";
  const fp = !isFn && g2?.verdict === "FAIL";
  if (isFn) fnSessions++;
  if (caught) caughtSessions++;
  if (fp) fpRegateSessions++;
  L(`${s.dir} | ${g1 ? `${g1.delta} (${g1.rateFps})` : "?"} ${g1?.verdict ?? ""} | ${draws.join(" / ") || "?"} | ${g2 ? `${g2.delta} (${g2.rateFps})` : "?"} ${g2?.verdict ?? ""} | ${isFn ? `CÓ (${fnHere.length} slot)` : "không"} | ${isFn ? (caught ? "CÓ" : "KHÔNG") : "—"} | ${fp ? "CÓ" : "không"}`);
}
L("");
L(`Gộp Y3: FN ${fnSlotsY3}/${totalSlotsY3} slot; phiên FN ${fnSessions}/${sessions.length}; trong đó re-gate bắt được ${caughtSessions}/${fnSessions}; re-gate FP ${fpRegateSessions}/${sessions.length - fnSessions} phiên không FN.`);
L(`Wilson 95% FN (slot): ${fmtCI(fnSlotsY3, totalSlotsY3)}; FP re-gate (phiên): ${fmtCI(fpRegateSessions, Math.max(sessions.length - fnSessions, 0))}.`);

// ---- Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9) ----
const OLD_FN = 3, OLD_N = 9;
const totFn = OLD_FN + fnSlotsY3, totN = OLD_N + totalSlotsY3;
L("");
L("=== 2. TỈ LỆ FN GỘP (V4 P1/P2 + X2 S4 + Y3) ===");
L(`Trước Y3: FN 3/9 slot (33%). Sau Y3: FN ${totFn}/${totN} slot (${totN ? (totFn / totN * 100).toFixed(0) : "?"}%), Wilson 95% ${fmtCI(totFn, totN)}.`);
L("Đọc đúng: FN là hiện tượng theo PHIÊN (tập trung ở phiên lạnh); tỉ lệ gộp theo slot chỉ có ý nghĩa khi các phiên tương đương nhau, mà chúng không tương đương (lạnh/ấm/tải).");

// ---- 3. Resume-probe: cơ chế ----
L("");
L("=== 3. RESUME-PROBE — vì sao draw đóng băng sau resume? ===");
const printProbe = (label, rp) => {
  if (!rp) { L(`${label}: không có resumeProbe.`); return; }
  L(`--- ${label} (nResume=${rp.nResume}, wall ${rp.wallSecs}s) ---`);
  L(`  draw ${rp.drawRateFps} fps | hold ${rp.holdRateFps} fps | skip ${rp.skipRateFps} fps | presented ${rp.presentedRateFps} fps | ticks ${rp.ticksRateFps}/s`);
  L(`  rs hist ${JSON.stringify(rp.rsHist)} | seekingFrac=${rp.seekingFrac} | pausedFrac=${rp.pausedFrac} | ct ${rp.ct0} → ${rp.ct1}`);
  const rs = (rp.samples || []).filter((x) => x.phase === "resume");
  const lastRs = rs[rs.length - 1];
  // Probe B không ghi 2 cờ cap vào summary — lấy từ mẫu resume cuối (cùng giá trị).
  const prExh = rp.pauseRetryExhausted ?? lastRs?.pauseRetryExhausted ?? null;
  const sfExh = rp.seekFailureExhausted ?? lastRs?.seekFailureExhausted ?? null;
  const seRec0 = rp.seekElementRecreated0 ?? null, seRec1 = rp.seekElementRecreated1 ?? lastRs?.seekElementRecreated ?? null;
  const deRp0 = rp.decoderErrorRecoveredPlaying0 ?? null, deRp1 = rp.decoderErrorRecoveredPlaying1 ?? lastRs?.decoderErrorRecoveredPlaying ?? null;
  L(`  syncReseeks ${rp.syncReseeks0} → ${rp.syncReseeks1} (video ${rp.syncReseeksVideo0} → ${rp.syncReseeksVideo1}) | sleepingAny=${rp.sleepingAny} | pauseRetryExh=${prExh} | seekFailExh=${sfExh} | seekElementRecreated ${seRec0} → ${seRec1} | decoderErrorRecoveredPlaying ${deRp0} → ${deRp1}`);
  if (rp.shortPause !== undefined) L(`  shortPause (mẫu ngay trước resume): ${JSON.stringify(rp.shortPause)}`);
  if (rp.rafStats) L(`  rafStats trong cửa sổ resume: ${JSON.stringify(rp.rafStats)}`);
  // Bucket theo giây: tốc độ draw/hold/skip + rs chủ đạo + seeking.
  if (rs.length >= 4) {
    const t0 = rs[0].wall;
    const buckets = new Map();
    for (const smp of rs) {
      const b = Math.floor((smp.wall - t0) / 1000);
      if (!buckets.has(b)) buckets.set(b, []);
      buckets.get(b).push(smp);
    }
    L("  Theo từng giây (resume):");
    for (const [b, arr] of [...buckets.entries()].sort((x, y) => x[0] - y[0])) {
      const a = arr[0], z = arr[arr.length - 1];
      const dt = Math.max((z.wall - a.wall) / 1000, 0.01);
      const rsMode = {};
      for (const x of arr) rsMode[x.el?.rs ?? "null"] = (rsMode[x.el?.rs ?? "null"] || 0) + 1;
      const top = Object.entries(rsMode).sort((x, y) => y[1] - x[1])[0];
      const seekF = arr.filter((x) => x.el?.seeking).length;
      L(`    +${b}s: draw ${((z.draw - a.draw) / dt).toFixed(2)} fps, hold ${((z.holdN - a.holdN) / dt).toFixed(2)} fps, skip ${((z.skip - a.skip) / dt).toFixed(2)} fps, ticks ${((z.ticks - a.ticks) / dt).toFixed(1)}/s, rs chủ đạo=${top[0]} (${top[1]}/${arr.length}), seeking ${seekF}/${arr.length}, ct ${a.el?.ct} → ${z.el?.ct}, sleeping=${arr.some((x) => x.sleeping)}`);
    }
  }
  // Pha pause: loop có ngủ không? justPaused seek có xong không?
  const ps = (rp.samples || []).filter((x) => x.phase === "pause");
  if (ps.length) {
    const p0 = ps[0], p1 = ps[ps.length - 1];
    L(`  Pha pause (${ps.length} mẫu, ${(ps.length ? ((p1.wall - p0.wall) / 1000).toFixed(1) : "?")}s): sleeping ${ps.filter((x) => x.sleeping).length}/${ps.length} mẫu; pendingSeek ${p0.pendingSeek} → ${p1.pendingSeek}; lastDrawn ${p0.lastDrawn} → ${p1.lastDrawn}; lastRequested ${p0.lastRequested} → ${p1.lastRequested}; el rs ${p0.el?.rs} → ${p1.el?.rs}, seeking ${p0.el?.seeking} → ${p1.el?.seeking}, ct ${p0.el?.ct} → ${p1.el?.ct}; mark ${p0.el?.mark} → ${p1.el?.mark}.`);
  }
  // Mark có đổi trong resume không (element bị drop/tạo lại)?
  const marks = [...new Set(rs.map((x) => x.el?.mark))];
  L(`  Mark element trong resume: ${JSON.stringify(marks)} ${marks.length > 1 ? "— ELEMENT ĐỔI GIỮA CỬA SỔ (pool drop/tạo lại)" : "(không đổi)"}.`);
};
for (const s of sessions) {
  printProbe(`${s.dir} probe A (pause dài)`, s.resumeProbe);
  printProbe(`${s.dir} probe B (pause ngắn ~1s)`, s.resumeProbeB);
}

console.log(out.join("\n"));
