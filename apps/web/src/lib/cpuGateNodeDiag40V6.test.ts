// cpuGateNodeDiag40V6.test.ts — Chẩn đoán tầng Node của cổng CPU, đợt 40 V6.
// Chạy bằng Node type-stripping:
//   node --experimental-strip-types apps/web/src/lib/cpuGateNodeDiag40V6.test.ts
// (chạy từ gốc repo). Số liệu U4/T6 là số đo thật under-load từ LIMITS
// đợt 38/39 — chỉ dùng để khóa HÀM CHẨN ĐOÁN, không phải để khóa cổng.
// Cổng vẫn locked:false (xem test đầu tiên); phiên quiet mới được quyết.
import assert from "node:assert/strict";
import {
  PROPOSED_CPU_GATE,
  type CpuCalibrationRound,
} from "./cpuGate39T6.ts";
import {
  CDP_GATE_DEFAULTS,
  DEFAULT_NODE_GATE_CONFIG,
  diagnoseNodeLayer,
  evaluateGateWithNodeDecision,
} from "./cpuGateNodeDiag40V6.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

// Số thật, under-load (T6 §5, U4): busy trượt, idle đạt, CDP đạt.
const U4: CpuCalibrationRound[] = [
  { nodeBusy: 41.4, nodeIdle: 0.0, cdpH1: 5.7, cdpH2: 102.0 },
  { nodeBusy: 55.0, nodeIdle: 0.5, cdpH1: 0.7, cdpH2: 95.9 },
  { nodeBusy: 58.9, nodeIdle: 3.0, cdpH1: 0.0, cdpH2: 87.3 },
];
const T6_RUN1: CpuCalibrationRound[] = [
  { nodeBusy: 39.9, nodeIdle: 0.0, cdpH1: 1.0, cdpH2: 92.2 },
  { nodeBusy: 39.4, nodeIdle: 0.0, cdpH1: 0.3, cdpH2: 98.3 },
  { nodeBusy: 39.4, nodeIdle: 0.0, cdpH1: 0.3, cdpH2: 98.6 },
];
const T6_RUN2: CpuCalibrationRound[] = [
  { nodeBusy: 77.4, nodeIdle: 0.0, cdpH1: 2.7, cdpH2: 94.9 },
  { nodeBusy: 39.4, nodeIdle: 0.0, cdpH1: 0.3, cdpH2: 99.9 },
  { nodeBusy: 39.5, nodeIdle: 0.0, cdpH1: 0.0, cdpH2: 98.9 },
];
const QUIET_HYPOTHETICAL: CpuCalibrationRound[] = [
  { nodeBusy: 95.0, nodeIdle: 0.0, cdpH1: 1.0, cdpH2: 98.0 },
  { nodeBusy: 96.0, nodeIdle: 0.0, cdpH1: 0.5, cdpH2: 97.0 },
  { nodeBusy: 94.0, nodeIdle: 0.0, cdpH1: 0.0, cdpH2: 99.0 },
];

console.log("== cổng vẫn chưa khóa + module không lệch ngưỡng gốc ==");
ok("PROPOSED_CPU_GATE.locked === false (luồng này không khóa)", () => {
  assert.equal(PROPOSED_CPU_GATE.locked, false);
});
ok("ngưỡng mặc định của module V6 khớp PROPOSED_CPU_GATE của T6 (chống drift)", () => {
  assert.equal(DEFAULT_NODE_GATE_CONFIG.busyMin, PROPOSED_CPU_GATE.nodeBusyMin);
  assert.equal(DEFAULT_NODE_GATE_CONFIG.idleMax, PROPOSED_CPU_GATE.nodeIdleMax);
  assert.equal(DEFAULT_NODE_GATE_CONFIG.minRounds, PROPOSED_CPU_GATE.minRounds);
  assert.equal(CDP_GATE_DEFAULTS.cdpH2Min, PROPOSED_CPU_GATE.cdpH2Min);
  assert.equal(CDP_GATE_DEFAULTS.cdpH1Max, PROPOSED_CPU_GATE.cdpH1Max);
  assert.equal(CDP_GATE_DEFAULTS.cdpGapMin, PROPOSED_CPU_GATE.cdpGapMin);
  assert.equal(CDP_GATE_DEFAULTS.minRounds, PROPOSED_CPU_GATE.minRounds);
});

console.log("== chẩn đoán từng tiêu chí trên số under-load thật ==");
ok("T6 lần 1: busy TRƯỢT phẳng (all-fail-flat), idle đạt, verdict fail-busy", () => {
  const d = diagnoseNodeLayer(T6_RUN1);
  assert.equal(d.verdict, "fail-busy");
  assert.equal(d.busy.passed, false);
  assert.equal(d.busy.pattern, "all-fail-flat");
  assert.deepEqual(d.busy.failingRoundIndices, [0, 1, 2]);
  assert.equal(d.busy.min, 39.4);
  assert.equal(d.busy.median, 39.4);
  assert.ok(d.busy.margin !== null && d.busy.margin < 0);
  assert.ok(d.busy.detail.includes("39.4"));
  assert.ok(d.busy.detail.includes("TRƯỢT"));
  assert.equal(d.idle.passed, true);
  assert.equal(d.idle.pattern, "all-pass");
  assert.deepEqual(d.excluded, []);
  assert.ok(d.reasons.some((r) => r.includes("busy")));
});
ok("T6 lần 2: busy TRƯỢT lẫn (mixed: 1 vòng đạt, 2 vòng trượt)", () => {
  const d = diagnoseNodeLayer(T6_RUN2);
  assert.equal(d.verdict, "fail-busy");
  assert.equal(d.busy.pattern, "mixed");
  assert.deepEqual(d.busy.failingRoundIndices, [1, 2]);
  assert.deepEqual(d.busy.failingValues, [39.4, 39.5]);
  assert.equal(d.idle.passed, true);
});
ok("U4: busy TRƯỢT lẫn (41.4 trượt, 55.0/58.9 đạt), idle đạt", () => {
  const d = diagnoseNodeLayer(U4);
  assert.equal(d.verdict, "fail-busy");
  assert.equal(d.busy.pattern, "mixed");
  assert.deepEqual(d.busy.failingRoundIndices, [0]);
  assert.equal(d.idle.passed, true);
  assert.equal(d.idle.median, 0.5);
});
ok("quiet giả định: cả 2 tiêu chí đạt, verdict pass, reasons rỗng", () => {
  const d = diagnoseNodeLayer(QUIET_HYPOTHETICAL);
  assert.equal(d.verdict, "pass");
  assert.equal(d.busy.passed, true);
  assert.equal(d.idle.passed, true);
  assert.deepEqual(d.reasons, []);
});

console.log("== tiêu chí idle trượt độc lập với busy ==");
ok("idle trượt một mình → verdict fail-idle, busy vẫn đạt", () => {
  const rounds: CpuCalibrationRound[] = [
    { nodeBusy: 95, nodeIdle: 25, cdpH1: 1, cdpH2: 98 },
    { nodeBusy: 96, nodeIdle: 0, cdpH1: 1, cdpH2: 98 },
    { nodeBusy: 94, nodeIdle: 0, cdpH1: 1, cdpH2: 98 },
  ];
  const d = diagnoseNodeLayer(rounds);
  assert.equal(d.verdict, "fail-idle");
  assert.equal(d.busy.passed, true);
  assert.equal(d.idle.passed, false);
  assert.deepEqual(d.idle.failingRoundIndices, [0]);
  // idle margin = ngưỡng − max = 20 − 25 = −5.
  assert.equal(d.idle.margin, -5);
});
ok("cả 2 tiêu chí trượt → verdict fail-both", () => {
  const rounds: CpuCalibrationRound[] = [
    { nodeBusy: 10, nodeIdle: 90, cdpH1: 1, cdpH2: 98 },
    { nodeBusy: 10, nodeIdle: 90, cdpH1: 1, cdpH2: 98 },
    { nodeBusy: 10, nodeIdle: 90, cdpH1: 1, cdpH2: 98 },
  ];
  assert.equal(diagnoseNodeLayer(rounds).verdict, "fail-both");
});

console.log("== cấu hình / tắt riêng từng tiêu chí ==");
ok("tắt busy: T6 lần 1 → verdict pass, excluded=[busy], busy không tính trượt", () => {
  const d = diagnoseNodeLayer(T6_RUN1, { busyEnabled: false });
  assert.equal(d.verdict, "pass");
  assert.deepEqual(d.excluded, ["busy"]);
  assert.equal(d.busy.enabled, false);
  assert.equal(d.busy.pattern, "disabled");
  assert.deepEqual(d.reasons, []);
});
ok("tắt cả 2 tiêu chí → verdict disabled, excluded=[busy, idle]", () => {
  const d = diagnoseNodeLayer(T6_RUN1, { busyEnabled: false, idleEnabled: false });
  assert.equal(d.verdict, "disabled");
  assert.deepEqual(d.excluded, ["busy", "idle"]);
});
ok("nới ngưỡng busy xuống 30: T6 lần 1 đạt (chứng minh ngưỡng cấu hình được)", () => {
  const d = diagnoseNodeLayer(T6_RUN1, { busyMin: 30 });
  assert.equal(d.busy.passed, true);
  assert.equal(d.verdict, "pass");
  // Ngưỡng mặc định vẫn 50 — cấu hình thử không đổi hằng số gốc.
  assert.equal(PROPOSED_CPU_GATE.nodeBusyMin, 50);
  assert.equal(diagnoseNodeLayer(T6_RUN1).busy.passed, false);
});
ok("tắt idle: idle trượt cũng không chặn verdict", () => {
  const rounds: CpuCalibrationRound[] = [
    { nodeBusy: 95, nodeIdle: 99, cdpH1: 1, cdpH2: 98 },
    { nodeBusy: 96, nodeIdle: 99, cdpH1: 1, cdpH2: 98 },
    { nodeBusy: 95, nodeIdle: 99, cdpH1: 1, cdpH2: 98 },
  ];
  const d = diagnoseNodeLayer(rounds, { idleEnabled: false });
  assert.equal(d.verdict, "pass");
  assert.deepEqual(d.excluded, ["idle"]);
});

console.log("== đủ vòng / rỗng ==");
ok("ít hơn 3 vòng → insufficient-rounds dù số đẹp", () => {
  const d = diagnoseNodeLayer(QUIET_HYPOTHETICAL.slice(0, 2));
  assert.equal(d.verdict, "insufficient-rounds");
  assert.equal(d.enoughRounds, false);
  assert.ok(d.reasons.some((r) => r.includes("2 vòng")));
});
ok("rỗng → insufficient-rounds, pattern no-data", () => {
  const d = diagnoseNodeLayer([]);
  assert.equal(d.verdict, "insufficient-rounds");
  assert.equal(d.busy.pattern, "no-data");
  assert.equal(d.idle.pattern, "no-data");
});

console.log("== kết hợp với tầng CDP (không khóa, chỉ trả lời 'nếu… thì…') ==");
ok("T6 lần 1 đủ tiêu chí: gateable=false, cdpPass=true, node fail-busy", () => {
  const g = evaluateGateWithNodeDecision(T6_RUN1);
  assert.equal(g.cdpPass, true);
  assert.equal(g.node.verdict, "fail-busy");
  assert.equal(g.nodeExcluded, false);
  assert.equal(g.gateableUnderNodeDecision, false);
  assert.ok(g.note.includes("CHƯA KHÓA"));
});
ok("T6 lần 1 tắt busy: gateable=true NHƯNG nodeExcluded=true + note CHƯA KHÓA", () => {
  const g = evaluateGateWithNodeDecision(T6_RUN1, { busyEnabled: false });
  assert.equal(g.gateableUnderNodeDecision, true);
  assert.equal(g.nodeExcluded, true);
  assert.ok(g.note.includes("CHƯA KHÓA"));
  assert.ok(g.note.includes("busy"));
});
ok("quiet giả định đủ tiêu chí: gateable=true, nodeExcluded=false", () => {
  const g = evaluateGateWithNodeDecision(QUIET_HYPOTHETICAL);
  assert.equal(g.cdpPass, true);
  assert.equal(g.node.verdict, "pass");
  assert.equal(g.gateableUnderNodeDecision, true);
  assert.equal(g.nodeExcluded, false);
  assert.ok(g.note.includes("CHƯA KHÓA"));
});

console.log(`\ncpuGateNodeDiag40V6: ${pass} test passed`);
