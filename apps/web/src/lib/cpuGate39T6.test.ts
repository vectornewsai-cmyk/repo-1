// cpuGate39T6.test.ts — Khóa khung cổng CPU đợt 39 T6 (chưa khóa thật).
// Chạy bằng Node type-stripping:
//   node --experimental-strip-types apps/web/src/lib/cpuGate39T6.test.ts
// (chạy từ gốc repo). Số liệu U4/T6 là số đo thật từ LIMITS của 2 luồng
// (ghi trong test để khóa hành vi đánh giá, không phải để khóa cổng).
import assert from "node:assert/strict";
import {
  PROPOSED_CPU_GATE,
  evaluateCpuGate,
  type CpuCalibrationRound,
} from "./cpuGate39T6.ts";

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

// Số thật, under-load — chỉ dùng để khóa HÀM ĐÁNH GIÁ, không khóa cổng.
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

console.log("== cổng chưa khóa (hằng số) ==");
ok("PROPOSED_CPU_GATE.locked === false", () => {
  assert.equal(PROPOSED_CPU_GATE.locked, false);
});

console.log("== dữ liệu under-load thật → không lockable ==");
for (const [name, rounds] of [
  ["U4", U4],
  ["T6 lần 1", T6_RUN1],
  ["T6 lần 2", T6_RUN2],
] as const) {
  ok(`${name} → lockable=false, tầng CDP đạt, tầng Node chặn`, () => {
    const ev = evaluateCpuGate(rounds);
    assert.equal(ev.lockable, false);
    assert.equal(ev.checks.cdpH2AllAbove, true);
    assert.equal(ev.checks.cdpH1AllBelow, true);
    assert.equal(ev.checks.cdpGapAbove, true);
    assert.equal(ev.checks.nodeBusyAllAbove, false);
    assert.ok(ev.reasons.some((r) => r.includes("Node")));
  });
}

console.log("== dữ liệu quiet giả định → lockable (hàm đúng, chưa phải quyết định) ==");
ok("3 vòng quiet giả định → lockable=true, không lý do", () => {
  const ev = evaluateCpuGate(QUIET_HYPOTHETICAL);
  assert.equal(ev.lockable, true);
  assert.deepEqual(ev.reasons, []);
});

console.log("== các trường hợp chặn khác ==");
ok("ít hơn 3 vòng → không lockable dù số đẹp", () => {
  const ev = evaluateCpuGate(QUIET_HYPOTHETICAL.slice(0, 2));
  assert.equal(ev.lockable, false);
  assert.equal(ev.checks.enoughRounds, false);
});
ok("gap CDP ≤ 30 → không lockable", () => {
  const ev = evaluateCpuGate([
    { nodeBusy: 95, nodeIdle: 0, cdpH1: 40, cdpH2: 60 },
    { nodeBusy: 95, nodeIdle: 0, cdpH1: 40, cdpH2: 60 },
    { nodeBusy: 95, nodeIdle: 0, cdpH1: 40, cdpH2: 60 },
  ]);
  assert.equal(ev.lockable, false);
  assert.equal(ev.checks.cdpGapAbove, false);
});
ok("rỗng → không lockable", () => {
  assert.equal(evaluateCpuGate([]).lockable, false);
});

console.log(`\ncpuGate39T6: ${pass} test passed`);
