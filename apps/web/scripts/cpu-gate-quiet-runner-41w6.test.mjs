#!/usr/bin/env node
/**
 * cpu-gate-quiet-runner-41w6.test.mjs — Test runner quiet W6 (đợt 41).
 * Chạy: node --test apps/web/scripts/cpu-gate-quiet-runner-41w6.test.mjs
 * (từ gốc repo). Không cần máy yên thật: cổng yên test bằng fixture;
 * test probe chỉ khẳng định HÌNH DẠNG số (finite + ghi loadavg), KHÔNG
 * khẳng định ngưỡng — giá trị probe trong test này đo under-load nên
 * cấm dùng làm bằng chứng khóa. Diag helper test bằng đúng bộ số thật
 * U4/T6 từ LIMITS V6 (chỉ để khóa hàm, không phải để khóa cổng).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  QUIET_GATE_DEFAULTS,
  REFUSAL_LINE,
  evaluateQuietGate,
  runNodeProbeRounds,
  sampleSystemLoad,
} from "./cpu-gate-quiet-runner-41w6.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const DIAG_HELPER = path.join(SCRIPTS_DIR, "cpu-gate-quiet-diag-41w6.ts");

function sample(load1, load5, frac) {
  return { at: "2026-11-03T00:00:00.000Z", load1, load5, load15: 0.5, nproc: 4, memTotalBytes: 8000, memAvailableBytes: 8000 * frac, memAvailableFrac: frac, memSource: "fixture" };
}

test("cổng yên: 3 mẫu yên (load1 < 1.0, load5 < 2.0, RAM >= 20%) -> quiet", () => {
  const g = evaluateQuietGate([sample(0.2, 0.4, 0.5), sample(0.3, 0.4, 0.5), sample(0.25, 0.5, 0.45)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, true);
  assert.deepEqual(g.blockers, []);
});

test("cổng bận: load1 thật đợt này (2.03) -> từ chối, blocker ghi load1", () => {
  const g = evaluateQuietGate([sample(2.03, 1.05, 0.35), sample(1.9, 1.0, 0.35), sample(2.1, 1.1, 0.35)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.ok(g.blockers.some((b) => b.startsWith("load1")), JSON.stringify(g.blockers));
});

test("cổng bận: RAM available thật đợt này (15.1%) -> từ chối, blocker ghi memAvailable", () => {
  const g = evaluateQuietGate([sample(0.2, 0.4, 0.151), sample(0.3, 0.4, 0.151), sample(0.25, 0.4, 0.151)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.ok(g.blockers.some((b) => b.startsWith("memAvailable")), JSON.stringify(g.blockers));
});

test("một mẫu spike cũng chặn (chống khe yên ảo)", () => {
  const g = evaluateQuietGate([sample(0.2, 0.4, 0.5), sample(1.5, 0.4, 0.5), sample(0.2, 0.4, 0.5)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
});

test("biên: load1 đúng ngưỡng 1.0 (4 core) thì KHÔNG yên (so sánh <, không <=)", () => {
  const g = evaluateQuietGate([sample(1.0, 0.4, 0.5), sample(1.0, 0.4, 0.5), sample(1.0, 0.4, 0.5)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
});

test("thiếu mẫu -> không yên", () => {
  const g = evaluateQuietGate([sample(0.2, 0.4, 0.5), sample(0.2, 0.4, 0.5)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.ok(g.blockers.some((b) => b.includes("2 mẫu")));
});

test("dòng từ chối bắt buộc có chuỗi CHƯA KHÓA — máy bận/under-load", () => {
  assert.equal(REFUSAL_LINE, "CHƯA KHÓA — máy bận/under-load");
});

test("sampleSystemLoad thật: hình dạng hợp lệ, nproc khớp máy", () => {
  const s = sampleSystemLoad();
  assert.equal(s.nproc, os.cpus().length);
  assert.ok(Number.isFinite(s.load1) && Number.isFinite(s.load5));
  assert.ok(s.memAvailableFrac > 0 && s.memAvailableFrac <= 1);
  assert.ok(["proc-meminfo", "os-freemem-fallback"].includes(s.memSource));
});

function diagOn(rounds) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "w6-test-diag-"));
  const f = path.join(dir, "rounds.json");
  fs.writeFileSync(f, JSON.stringify(rounds));
  const r = spawnSync(process.execPath, ["--experimental-strip-types", DIAG_HELPER, f], { encoding: "utf8", timeout: 60000 });
  fs.unlinkSync(f);
  fs.rmdirSync(dir);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test("diag helper trên số T6 lần 1 thật: fail-busy, all-fail-flat, margin -10.6", () => {
  const d = diagOn([
    { busyCpuPctOneCore: 39.9, idleCpuPctOneCore: 0 },
    { busyCpuPctOneCore: 39.4, idleCpuPctOneCore: 0 },
    { busyCpuPctOneCore: 39.4, idleCpuPctOneCore: 0 },
  ]);
  assert.equal(d.cdpMeasured, false);
  assert.equal(d.node.verdict, "fail-busy");
  assert.equal(d.node.busy.pattern, "all-fail-flat");
  assert.ok(Math.abs(d.node.busy.margin - -10.6) < 1e-9, `margin=${d.node.busy.margin}`);
  assert.equal(d.node.idle.passed, true);
});

test("diag helper trên số quiet giả định: pass (số GIẢ ĐỊNH, chỉ khóa hàm)", () => {
  const d = diagOn([
    { busyCpuPctOneCore: 95, idleCpuPctOneCore: 5 },
    { busyCpuPctOneCore: 96, idleCpuPctOneCore: 4 },
    { busyCpuPctOneCore: 94, idleCpuPctOneCore: 6 },
  ]);
  assert.equal(d.node.verdict, "pass");
});

test("probe 1 vòng smoke: chỉ khẳng định hình dạng, KHÔNG khẳng định ngưỡng", async () => {
  const rounds = await runNodeProbeRounds({ rounds: 1, windowMs: 500 });
  assert.equal(rounds.length, 1);
  const r = rounds[0];
  assert.ok(Number.isFinite(r.busyCpuPctOneCore) && Number.isFinite(r.idleCpuPctOneCore));
  assert.ok(Number.isFinite(r.loadBefore.load1) && Number.isFinite(r.loadAfter.load1));
  assert.ok(r.busyDeltaTicks >= 0 && r.idleDeltaTicks >= 0);
  // Cố tình KHÔNG assert busy > 50 hay busy > idle: giá trị này đo
  // under-load, chỉ chứng minh đường code chạy được, không phải bằng
  // chứng ngưỡng.
});
