// analyze-72z3-gate-fn2.mjs — Phase 9 đợt 72, luồng Z3.
// Phân tích OFFLINE dữ liệu đo thật của launcher Z3 (không đo mới, không Chrome):
//   - re-gate làm cửa kiểm tra thứ hai: phiên chết nếu gate1a HOẶC re-gate FAIL.
//     FN = gate1a PASS + slot draw < 2 fps; bắt được iff re-gate FAIL đúng phiên FN.
//     Phiên chết ở re-gate chỉ còn slot 1 làm ground truth → FP ở phiên chết
//     chỉ xác định được theo slot 1 (kiểm duyệt — ghi rõ, không gộp mù với FP
//     ground-truth đầy đủ).
//   - Hiệu chuẩn ngưỡng re-gate: liệt kê toàn bộ delta re-gate theo FN/khỏe,
//     max delta FN vs min delta khỏe, khoảng trống (gap) và ngưỡng đề xuất + cơ sở.
//   - Gộp tỉ lệ FN slot với dữ liệu cũ (V4 P1/P2 + X2 S4 + Y3).
//   - Resume-probe: như Y3 (chỉ in khi phiên không chết ở re-gate).
// Chạy: node apps/web/scripts/analyze-72z3-gate-fn2.mjs
// Nguồn: hidden_files/round72-z3/session*/presented-fps.json (+ round71-y3 để gộp).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z3DIR = path.join(GOAL, "round72-z3");
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

// ---- Đọc các phiên Z3 + Y3 ----
const sessions = [];
const readDir = (dir, round) => {
  if (!fs.existsSync(dir)) { L(`(không có thư mục ${dir})`); return; }
  for (const d of fs.readdirSync(dir).filter((x) => x.startsWith("session"))) {
    const f = path.join(dir, d, "presented-fps.json");
    if (!fs.existsSync(f)) { L(`(bỏ qua ${round}/${d}: không có presented-fps.json — phiên chết ở gate hoặc chưa chạy)`); continue; }
    try {
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      const notesF = path.join(dir, d, "z3-notes.txt");
      const notes = fs.existsSync(notesF) ? fs.readFileSync(notesF, "utf8").trim() : null;
      sessions.push({ round, dir: `${round}/${d}`, notes, ...j });
    } catch (e) { L(`(bỏ qua ${round}/${d}: JSON lỗi ${e.message})`); }
  }
};
readDir(Z3DIR, "Z3");
readDir(Y3DIR, "Y3");
sessions.sort((a, b) => a.dir.localeCompare(b.dir));

L("=== 1. RE-GATE vs FN (gate 6 s) — từng phiên Z3 + Y3 ===");
L("Phiên | gate1a delta | slot draw fps | re-gate delta (ngưỡng/chế độ) | chết ở re-gate? | FN? | FN bị bắt? | re-gate FP? (phạm vi ground truth)");
let fnSlots = 0, totalSlots = 0, fnSessions = 0, caughtSessions = 0;
let fpFull = 0, fpFullDenom = 0, fpCensored = 0, fpCensoredDenom = 0;
const regateDeltas = []; // { delta, fn, round, dir }
for (const s of sessions) {
  const g1 = s.gate1a, g2 = s.gate1b;
  const killed = !!s.z3?.killedByRegate;
  const draws = (s.slots || []).filter((x) => x.valid).map((x) => x.drawFps);
  totalSlots += draws.length;
  const fnHere = draws.filter((d) => d < 2);
  fnSlots += fnHere.length;
  const isFn = g1?.verdict === "PASS" && fnHere.length > 0;
  const caught = isFn && g2?.verdict === "FAIL";
  const fp = !isFn && g2?.verdict === "FAIL";
  if (isFn) fnSessions++;
  if (caught) caughtSessions++;
  if (g2 && typeof g2.delta === "number") regateDeltas.push({ delta: g2.delta, fn: isFn, round: s.round, dir: s.dir });
  if (!isFn && g2) {
    if (killed) { fpCensoredDenom++; if (fp) fpCensored++; }
    else { fpFullDenom++; if (fp) fpFull++; }
  }
  L(`${s.dir} | ${g1 ? `${g1.delta}` : "?"} ${g1?.verdict ?? ""} | ${draws.join(" / ") || "?"} | ${g2 ? `${g2.delta} (ngưỡng ${g2.threshold ?? "?"}, ${g2.gateMode ?? "?"})` : "?"} ${g2?.verdict ?? ""} | ${killed ? "CÓ" : "không"} | ${isFn ? `CÓ (${fnHere.length} slot)` : "không"} | ${isFn ? (caught ? "CÓ" : "KHÔNG") : "—"} | ${fp ? "CÓ" : "không"}${fp ? (killed ? " (chỉ slot 1 — kiểm duyệt)" : " (ground truth đầy đủ)") : ""}`);
  if (s.notes) L(`  ghi chú phiên: ${s.notes.replace(/\n/g, " | ")}`);
}
L("");
L(`Gộp Z3+Y3: FN ${fnSlots}/${totalSlots} slot; phiên FN ${fnSessions}/${sessions.length}; trong đó re-gate bắt được ${caughtSessions}/${fnSessions}.`);
L(`Re-gate FP (ground truth ĐẦY ĐỦ): ${fpFull}/${fpFullDenom} phiên không FN, Wilson 95% ${fmtCI(fpFull, fpFullDenom)}.`);
L(`Re-gate FP (phiên CHẾT ở re-gate, chỉ slot 1 làm ground truth — kiểm duyệt, KHÔNG gộp vào số trên): ${fpCensored}/${fpCensoredDenom}.`);
L(`Wilson 95% FN (slot): ${fmtCI(fnSlots, totalSlots)}.`);

// ---- Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9) ----
const OLD_FN = 3, OLD_N = 9;
const totFn = OLD_FN + fnSlots, totN = OLD_N + totalSlots;
L("");
L("=== 2. TỈ LỆ FN GỘP (V4 P1/P2 + X2 S4 + Y3 + Z3) ===");
L(`Trước Y3: FN 3/9 slot (33%). Sau Y3+Z3: FN ${totFn}/${totN} slot (${totN ? (totFn / totN * 100).toFixed(0) : "?"}%), Wilson 95% ${fmtCI(totFn, totN)}.`);
L("Đọc đúng: FN là hiện tượng theo PHIÊN (tập trung ở phiên lạnh/tải); tỉ lệ gộp theo slot chỉ có ý nghĩa khi các phiên tương đương nhau, mà chúng không tương đương (lạnh/ấm/tải).");

// ---- 3. Hiệu chuẩn ngưỡng re-gate ----
L("");
L("=== 3. HIỆU CHUẨN NGƯỠNG RE-GATE (delta re-gate theo FN/khỏe) ===");
const fnDeltas = regateDeltas.filter((x) => x.fn).map((x) => x.delta).sort((a, b) => a - b);
const okDeltas = regateDeltas.filter((x) => !x.fn).map((x) => x.delta).sort((a, b) => a - b);
L(`Delta re-gate ở phiên FN (n=${fnDeltas.length}): ${fnDeltas.join(", ") || "—"}`);
L(`Delta re-gate ở phiên không FN (n=${okDeltas.length}): ${okDeltas.join(", ") || "—"}`);
if (fnDeltas.length && okDeltas.length) {
  const maxFn = Math.max(...fnDeltas), minOk = Math.min(...okDeltas);
  L(`Max delta FN = ${maxFn}; min delta khỏe = ${minOk}; khoảng trống (gap) = (${maxFn}, ${minOk}]${minOk > maxFn ? `, rộng ${minOk - maxFn} draws` : " — CHỒNG LẤN, không có ngưỡng tách sạch"}.`);
  if (minOk > maxFn) {
    const geoMid = Math.sqrt(maxFn * minOk);
    L(`Mọi ngưỡng trong (${maxFn}, ${minOk}] đều tách sạch dữ liệu đã quan sát. Ngưỡng giữa hình học (max-margin log) ≈ ${geoMid.toFixed(0)}; ngưỡng 30 nằm trong khoảng và bắt FN tới delta 29 (rộng hơn 20 một nửa dải bắt) trong khi vẫn cách min khỏe ${minOk - 30} draws.`);
    L(`CẢNH BÁO: n(FN)=${fnDeltas.length} — ngưỡng mới chỉ là tạm thời, phải xem lại khi có thêm phiên FN (đặc biệt FN ở vùng 20–30).`);
  } else {
    L("Không đề xuất đổi ngưỡng: dữ liệu FN và khỏe chồng lấn — cần thêm phiên trước khi kết luận.");
  }
} else {
  L("Chưa đủ dữ liệu hai phía (cần ít nhất 1 phiên FN + 1 phiên khỏe có delta re-gate) để hiệu chuẩn ngưỡng — giữ ngưỡng 20.");
}

// ---- 4. Resume-probe: cơ chế ----
L("");
L("=== 4. RESUME-PROBE — vì sao draw đóng băng sau resume? ===");
const printProbe = (label, rp) => {
  if (!rp) { L(`${label}: không có resumeProbe (phiên chết ở re-gate hoặc chưa chạy probe).`); return; }
  L(`--- ${label} (nResume=${rp.nResume}, wall ${rp.wallSecs}s) ---`);
  L(`  draw ${rp.drawRateFps} fps | hold ${rp.holdRateFps} fps | skip ${rp.skipRateFps} fps | presented ${rp.presentedRateFps} fps | ticks ${rp.ticksRateFps}/s`);
  L(`  rs hist ${JSON.stringify(rp.rsHist)} | seekingFrac=${rp.seekingFrac} | pausedFrac=${rp.pausedFrac} | ct ${rp.ct0} → ${rp.ct1}`);
  const rs = (rp.samples || []).filter((x) => x.phase === "resume");
  const lastRs = rs[rs.length - 1];
  const prExh = rp.pauseRetryExhausted ?? lastRs?.pauseRetryExhausted ?? null;
  const sfExh = rp.seekFailureExhausted ?? lastRs?.seekFailureExhausted ?? null;
  const seRec0 = rp.seekElementRecreated0 ?? null, seRec1 = rp.seekElementRecreated1 ?? lastRs?.seekElementRecreated ?? null;
  const deRp0 = rp.decoderErrorRecoveredPlaying0 ?? null, deRp1 = rp.decoderErrorRecoveredPlaying1 ?? lastRs?.decoderErrorRecoveredPlaying ?? null;
  L(`  syncReseeks ${rp.syncReseeks0} → ${rp.syncReseeks1} (video ${rp.syncReseeksVideo0} → ${rp.syncReseeksVideo1}) | sleepingAny=${rp.sleepingAny} | pauseRetryExh=${prExh} | seekFailExh=${sfExh} | seekElementRecreated ${seRec0} → ${seRec1} | decoderErrorRecoveredPlaying ${deRp0} → ${deRp1}`);
  if (rp.shortPause !== undefined) L(`  shortPause (mẫu ngay trước resume): ${JSON.stringify(rp.shortPause)}`);
  if (rp.rafStats) L(`  rafStats trong cửa sổ resume: ${JSON.stringify(rp.rafStats)}`);
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
  const ps = (rp.samples || []).filter((x) => x.phase === "pause");
  if (ps.length) {
    const p0 = ps[0], p1 = ps[ps.length - 1];
    L(`  Pha pause (${ps.length} mẫu, ${(ps.length ? ((p1.wall - p0.wall) / 1000).toFixed(1) : "?")}s): sleeping ${ps.filter((x) => x.sleeping).length}/${ps.length} mẫu; pendingSeek ${p0.pendingSeek} → ${p1.pendingSeek}; lastDrawn ${p0.lastDrawn} → ${p1.lastDrawn}; lastRequested ${p0.lastRequested} → ${p1.lastRequested}; el rs ${p0.el?.rs} → ${p1.el?.rs}, seeking ${p0.el?.seeking} → ${p1.el?.seeking}, ct ${p0.el?.ct} → ${p1.el?.ct}; mark ${p0.el?.mark} → ${p1.el?.mark}.`);
  }
  const marks = [...new Set(rs.map((x) => x.el?.mark))];
  L(`  Mark element trong resume: ${JSON.stringify(marks)} ${marks.length > 1 ? "— ELEMENT ĐỔI GIỮA CỬA SỔ (pool drop/tạo lại)" : "(không đổi)"}.`);
};
for (const s of sessions.filter((x) => x.round === "Z3")) {
  printProbe(`${s.dir} probe A (pause dài)`, s.resumeProbe);
  printProbe(`${s.dir} probe B (pause ngắn ~1s)`, s.resumeProbeB);
}

console.log(out.join("\n"));
