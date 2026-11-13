#!/usr/bin/env node
/**
 * Phase 9 đợt 43, luồng Y5 — test seam Q6 mang perSeek sang labeled.
 *
 * Đóng nợ V1 §4.3 / đợt 42 §5.6: Q6 labeled nay copy nguyên vẹn
 * perSeek từ forward-hold.json. Test đi qua CLI `classify` thật của Q6
 * (không import module Q6 trực tiếp, vì module đó tự chạy mode run khi
 * được load — import từ test sẽ thoát 2 do thiếu env; classify và run
 * dùng chung buildLabeled nên seam được kiểm tra đúng hàm). Bằng chứng
 * runtime mode run trên Chrome thật nằm ở lượt chain-run
 * (docs/PHASE9_ROUND43_Y5_PROBE_LIMITS.md).
 *
 * Quy tắc tương thích ngược được khóa ở đây:
 *  - mọi khóa labeled cũ giữ nguyên tên/giá trị (chỉ thêm khóa perSeek);
 *  - perSeek copy nguyên vẹn, không pick field: 17 trường spec của mỗi
 *    entry + trường v2 đều còn đủ, validate sạch;
 *  - probe tắt / harness cũ → labeled.perSeek === null (khóa vẫn có);
 *  - file labeled cũ (vắng khóa) không thuộc phạm vi hàm này — người
 *    đọc phải coi vắng khóa là "không rõ", không phải probe tắt.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { PERSEEK_SPEC_FIELDS, validatePerSeekEntry } from "./per-seek-probe.mjs";
import { buildProbeEnv, extractPerSeekReport } from "./seek-ab-solo-run.mjs";

const Q6 = path.join(import.meta.dirname, "probe-round34-q6-measure-protocol.mjs");

function quietN2(over = {}) {
  return {
    bundle: "index-TEST.js",
    video: "sparse-gop-noise.mp4",
    verdict: "PARTIAL",
    load: { beforeFwd: "0.5 0.4 0.3", beforeRev: "0.6 0.5 0.4", atEnd: "0.5 0.4 0.3" },
    forward: { interpRate: 1.0, playheadRate: 1.0, drawDelta: 10, holdDelta: 0 },
    reverse: { fps: 0.43, drawDelta: 10, holdDelta: 0, wallSec: 23.3, blackSamplesAfterWarmup: 0 },
    raf: { forward: { gapP50: 0.008, gapP95: 0.01, gapMax: 0.02, countOver100ms: 0, exclFirst: { countOver100ms: 0, lostSec: 0, predictedRate: 0.999 }, predictedRate: 0.999 } },
    checks: { ok: true },
    ...over,
  };
}

function specEntry(k, targetTime) {
  return {
    k, targetTime,
    seekRequestedAtMs: 1000 + k * 100, seekedAtMs: 1100 + k * 100, firstDrawAfterSeekAtMs: 1150 + k * 100,
    seekLatencyMs: 100, drawLatencyMs: 50,
    currentTimeAtSeek: targetTime, currentTimeAtSeeked: targetTime,
    decodedFramesAtSeek: 600 + k, decodedFramesAtSeeked: 610 + k,
    droppedFramesAtSeek: 0, droppedFramesAtSeeked: 0,
    rafTicksWhileWaiting: 6,
    holdCountAtSeek: 0, holdCountAtFirstDraw: 0,
    // Extra + v2 (ngoài 17 trường spec, phải còn nguyên sau copy):
    firstDecodedAfterSeekAtMs: 1120 + k * 100, decodedFramesAtFirstDraw: 612 + k,
    decodedDeltaToFirstDraw: 2, phase: "reverse", status: "completed", elementKind: "video",
    seekedEvent: true, firstDrawBasis: "raf-eligible",
    elementId: 0, decodedSamplesWhileSeeking: [{ tMs: 1010 + k * 100, decoded: 601 + k, dropped: 0 }],
    droppedSeekingSamples: 0, flushElementSrc: null, flushElementReadyState: null,
  };
}

const OLD_KEYS = ["protocol", "runAt", "bundle", "video", "n2Verdict", "load", "machine",
  "forward", "reverse", "checks", "loadLabel", "labelReasons", "signals", "comparability"];

/** Chạy Q6 classify thật trên 1 forward-hold tổng hợp, trả labeled đã đọc. */
function classify(n2) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "y5-q6-"));
  try {
    const input = path.join(dir, "forward-hold.json");
    writeFileEpermRetry(input, JSON.stringify(n2));
    const r = spawnSync("node", [Q6, "classify", input, "0"], { encoding: "utf8" });
    assert.equal(r.status, 0, `Q6 classify exit ${r.status}: ${r.stderr}`);
    return JSON.parse(fs.readFileSync(input.replace(/\.json$/, "") + ".labeled.json", "utf8"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("y5: labeled mang perSeek nguyên vẹn khi probe bật — đủ 17 trường spec, validate sạch", () => {
  const perSeek = {
    enabled: true, version: "per-seek-v2", gopSeconds: 10,
    entries: [specEntry(0, 25), specEntry(1, 20)],
    marks: [], droppedOverflow: 0, counts: { completed: 2 },
    summaryAll: { count: 2 }, summaryReverse: { count: 2 },
  };
  const labeled = classify(quietN2({ perSeekEnabled: true, perSeek }));
  // Mọi khóa cũ còn đủ, giá trị cũ không đổi.
  for (const k of OLD_KEYS) assert.ok(k in labeled, `thiếu khóa cũ ${k}`);
  assert.equal(labeled.bundle, "index-TEST.js");
  assert.equal(labeled.loadLabel, "quiet");
  // perSeek: copy nguyên vẹn (deep-equal), không pick field.
  assert.deepEqual(labeled.perSeek, perSeek);
  assert.equal(labeled.perSeek.entries.length, 2);
  for (const e of labeled.perSeek.entries) {
    for (const f of PERSEEK_SPEC_FIELDS) assert.ok(f in e, `entry mất trường spec ${f}`);
    assert.deepEqual(validatePerSeekEntry(e), []);
  }
});

test("y5: probe tắt / harness cũ → labeled.perSeek === null nhưng khóa vẫn có", () => {
  const off = classify(quietN2({ perSeekEnabled: false, perSeek: null }));
  assert.ok("perSeek" in off);
  assert.equal(off.perSeek, null);
  assert.equal(off.loadLabel, "quiet");
  // Forward-hold cũ hoàn toàn không có khóa perSeek cũng cho null, không crash.
  const n2old = quietN2({ perSeekEnabled: false });
  delete n2old.perSeek;
  const old = classify(n2old);
  assert.ok("perSeek" in old);
  assert.equal(old.perSeek, null);
});

test("y5: nhãn loadLabel độc lập với perSeek — under-load vẫn mang perSeek", () => {
  const n2 = quietN2({ perSeekEnabled: true, perSeek: { enabled: true, version: "per-seek-v2", gopSeconds: 10, entries: [specEntry(0, 25)], counts: { completed: 1 } } });
  n2.load.beforeRev = "5.0 4.0 3.0";
  const labeled = classify(n2);
  assert.equal(labeled.loadLabel, "under-load");
  assert.ok(labeled.labelReasons.length > 0);
  assert.equal(labeled.perSeek.entries.length, 1);
});

test("y5: seam chuỗi solo→Q6→N2 — cùng forward-hold cho present ở cả Q6 lẫn solo report", () => {
  const forwardHold = quietN2({
    perSeekEnabled: true,
    perSeek: {
      enabled: true, version: "per-seek-v2", gopSeconds: 10,
      entries: [specEntry(0, 25), specEntry(1, 20)],
      counts: { completed: 2 },
    },
  });
  // Tầng Q6 (classify → buildLabeled) và tầng solo (extractPerSeekReport)
  // đọc cùng một forward-hold — cả hai đều phải present, cùng số entry.
  const labeled = classify(forwardHold);
  const soloReport = extractPerSeekReport(forwardHold);
  assert.equal(labeled.perSeek.entries.length, 2);
  assert.equal(soloReport.status, "present");
  assert.equal(soloReport.entryCount, 2);
  assert.equal(labeled.perSeek.entries.length, soloReport.entryCount);
  // Tầng solo env vẫn giữ đủ khóa Q6 (hàm solo runner dùng, đã khóa ở test solo).
  const env = buildProbeEnv({ fixture: "/tmp/f.mp4", scratch: "/tmp/s", display: ":96", port: 4196, distDir: "/tmp/d" });
  assert.ok("Q6_VIDEO" in env && "Q6_OUT" in env);
});
