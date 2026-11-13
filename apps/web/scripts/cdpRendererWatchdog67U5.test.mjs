#!/usr/bin/env node
// cdpRendererWatchdog67U5.test.mjs — test cho watchdog CDP (đợt 67 U5).
// Chạy: node --test apps/web/scripts/cdpRendererWatchdog67U5.test.mjs
// (không cần Chrome thật — heartbeat/collect đều inject fake).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  createRendererWatchdog,
  collectChromeDiagnostics,
  probeBrowserAlive,
  heartbeatEval,
  DEFAULT_MAX_CONSECUTIVE_HEARTBEAT_FAILURES,
  DEFAULT_HEARTBEAT_TIMEOUT_MS,
} from "./cdpRendererWatchdog67U5.mjs";

test("hằng số mặc định: 3 lần lỗi liên tiếp, heartbeat timeout 60 s", () => {
  assert.equal(DEFAULT_MAX_CONSECUTIVE_HEARTBEAT_FAILURES, 3);
  assert.equal(DEFAULT_HEARTBEAT_TIMEOUT_MS, 60_000);
});

test("2 lỗi rồi thành công → reset; lỗi thứ 3 liên tiếp → frozen, onFrozen gọi 1 lần", () => {
  const frozenReports = [];
  const w = createRendererWatchdog({
    maxConsecutiveFailures: 3,
    collectDiagnostics: () => ({ marker: "diag-ok" }),
    onFrozen: (r) => frozenReports.push(r),
  });
  assert.equal(w.recordFailure(new Error("e1")).frozen, false);
  assert.equal(w.recordFailure(new Error("e2")).frozen, false);
  assert.equal(w.recordSuccess().consecutiveFailures, 0);
  assert.equal(w.recordFailure(new Error("e3")).frozen, false);
  assert.equal(w.recordFailure(new Error("e4")).frozen, false);
  const third = w.recordFailure(new Error("e5"));
  assert.equal(third.frozen, true);
  assert.equal(third.report.verdict, "renderer-frozen");
  assert.equal(third.report.consecutiveFailures, 3);
  assert.equal(third.report.lastFailureError, "e5");
  assert.equal(third.report.diagnostics.marker, "diag-ok");
  assert.equal(frozenReports.length, 1);
  // Lỗi sau khi frozen không gọi onFrozen lần nữa.
  w.recordFailure(new Error("e6"));
  assert.equal(frozenReports.length, 1);
  assert.equal(w.state().frozen, true);
});

test("collectDiagnostics ném lỗi → vẫn báo frozen, ghi diagnosticsError", () => {
  let called = 0;
  const w = createRendererWatchdog({
    maxConsecutiveFailures: 1,
    collectDiagnostics: () => {
      throw new Error("proc đã chết");
    },
    onFrozen: () => {
      called++;
    },
  });
  const r = w.recordFailure(new Error("hb-timeout"));
  assert.equal(r.frozen, true);
  assert.equal(r.report.diagnostics, null);
  assert.equal(r.report.diagnosticsError, "proc đã chết");
  assert.equal(called, 1);
});

test("heartbeatEval: send trả về → ok; send treo → timeout → ok:false", async () => {
  const okRes = await heartbeatEval(async () => ({ result: { value: 2 } }), 1000);
  assert.equal(okRes.ok, true);
  assert.equal(okRes.value, 2);
  const slow = await heartbeatEval(
    () => new Promise(() => {}),
    50,
  );
  assert.equal(slow.ok, false);
  assert.match(slow.error, /heartbeat timeout 50ms/);
  const err = await heartbeatEval(async () => {
    throw new Error("ws closed");
  }, 1000);
  assert.equal(err.ok, false);
  assert.match(err.error, /ws closed/);
});

test("probeBrowserAlive: server /json/list đáp → alive; cổng chết → alive:false", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/json/list") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([{ type: "page" }, { type: "browser" }]));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  try {
    const alive = await probeBrowserAlive(port, 2000);
    assert.equal(alive.alive, true);
    assert.equal(alive.targets, 2);
  } finally {
    await new Promise((r) => server.close(r));
  }
  const dead = await probeBrowserAlive(port, 1000);
  assert.equal(dead.alive, false);
  assert.ok(typeof dead.error === "string" && dead.error.length > 0);
});

test("collectChromeDiagnostics: không có Chrome → không throw, có loadavg + meminfo", () => {
  const d = collectChromeDiagnostics({ chromePid: null });
  assert.equal(d.chrome, null);
  assert.deepEqual(d.renderers, []);
  assert.ok(typeof d.loadavg === "string" && d.loadavg.length > 0);
  assert.ok(d.meminfo && typeof d.meminfo.MemTotal === "string");
  // dmesg có thể bị chặn trong container → null cũng là kết quả hợp lệ
  // (best-effort); khi đọc được thì phải là mảng các dòng OOM.
  assert.ok(d.dmesgTail === null || Array.isArray(d.dmesgTail));
});

test("collectChromeDiagnostics: pid hiện tại → đọc được stat/status/wchan", () => {
  const d = collectChromeDiagnostics({ chromePid: process.pid });
  assert.ok(d.chrome !== null);
  assert.equal(d.chrome.pid, process.pid);
  assert.ok(typeof d.chrome.stat === "string" && d.chrome.stat.length > 0);
  assert.ok(typeof d.chrome.status === "string" && d.chrome.status.includes("State:"));
  assert.ok(Array.isArray(d.chrome.threads) && d.chrome.threads.length >= 1);
});
