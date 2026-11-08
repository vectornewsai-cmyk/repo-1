#!/usr/bin/env node
/**
 * run-node-test-63r9.test.mjs — Phase 9 đợt 63, luồng R9: hồi quy cho
 * runner test chuẩn (scripts/run-node-test.mjs) + bằng chứng ESM cho webglLut.
 *
 * Khóa:
 *  1. Runner chọn đúng mode=cjs cho webglLut + speedcurveTrim, test xanh,
 *     và KHÔNG còn warning `empty-import-meta` ở bundle cjs (đợt 63 R9
 *     triệt bằng `--define:import.meta.env={}` — cho giá trị thật, không
 *     giấu log; xem docs/PHASE9_ROUND63_R9_MCP_CLI_I18N_LIMITS.md §3).
 *  2. webglLut bundle ESM cũng chạy được 7/7, MAE giống hệt cjs
 *     (0.4510/0.5058) — đường ESM khả thi nhưng giữ cjs (mặc định từ O7).
 *
 * Chạy (từ gốc repo, không cần build):
 *   node --test scripts/run-node-test-63r9.test.mjs
 * Exit 0 khi tất cả pass.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const RUNNER = path.join(REPO, "scripts", "run-node-test.mjs");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");

function run(cmd, args, cwd = REPO) {
  const r = spawnSync(cmd, args, { encoding: "utf8", cwd });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

test("runner: webglLut mode=cjs, 7/7, không warning empty-import-meta", () => {
  const r = run(process.execPath, [RUNNER, "apps/web/src/lib/webglLut.test.ts"]);
  assert.equal(r.status, 0, `runner exit ${r.status}:\n${r.out.slice(-2000)}`);
  assert.match(r.out, /mode=cjs/, "runner phải chọn mode=cjs cho webglLut");
  assert.match(r.out, /7 pass/, "webglLut phải 7/7");
  assert.doesNotMatch(r.out, /empty-import-meta/, "không được còn warning empty-import-meta");
});

test("runner: speedcurveTrim mode=cjs, 18/18, không warning empty-import-meta", () => {
  const r = run(process.execPath, [RUNNER, "apps/web/src/components/speed/speedcurveTrim.test.ts"]);
  assert.equal(r.status, 0, `runner exit ${r.status}:\n${r.out.slice(-2000)}`);
  assert.match(r.out, /mode=cjs/, "runner phải chọn mode=cjs cho speedcurveTrim");
  assert.match(r.out, /18 pass, 0 fail/, "speedcurveTrim phải 18 pass, 0 fail");
  assert.doesNotMatch(r.out, /empty-import-meta/, "không được còn warning empty-import-meta");
});

test("webglLut bundle ESM khả thi: 7/7, MAE giống cjs, không warning", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "vcut-esm-63r9-"));
  try {
    const out = path.join(dir, "webglLut.test.mjs");
    const b = run(ESBUILD, [
      "apps/web/src/lib/webglLut.test.ts",
      "--bundle", "--platform=node", "--format=esm",
      `--outfile=${out}`, "--log-level=warning",
    ]);
    assert.equal(b.status, 0, `esbuild esm lỗi:\n${b.out.slice(-1000)}`);
    assert.doesNotMatch(b.out, /empty-import-meta/, "bundle esm không được có warning empty-import-meta");
    const r = run(process.execPath, [out]);
    assert.equal(r.status, 0, `node esm exit ${r.status}:\n${r.out.slice(-2000)}`);
    assert.match(r.out, /7 pass/, "webglLut esm phải 7/7");
    assert.match(r.out, /MAE=0\.4510/, "MAE vcut-cinematic phải 0.4510 như cjs");
    assert.match(r.out, /MAE=0\.5058/, "MAE cartcut-teal-orange phải 0.5058 như cjs");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
