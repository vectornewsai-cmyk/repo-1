#!/usr/bin/env node
/**
 * Phase 9 đợt 38, luồng U6 — test unit cho runner phiên solo
 * (seek-ab-solo-run.mjs). Chỉ test hàm thuần + phân loại trên dữ
 * liệu cũ; KHÔNG chạy browser, KHÔNG chạy chế độ run.
 * Chạy: node --test apps/web/scripts/seek-ab-solo-run.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SOLO, PROBE_Q6, loadMaxima, summarizeSide, pairwiseRatios, welchCI,
  driftCheck, planOrder, buildSummary, distManifest,
  extractPerSeekReport, buildProbeEnv,
} from "./seek-ab-solo-run.mjs";

const OLD_R1 = SOLO.defaultOldR1;
const OLD_B36 = SOLO.defaultOldB36;

test("loadMaxima chỉ xét đúng 3 checkpoint Q6 (atStart không tính)", () => {
  const load = {
    atStart: "9.99 9.99 9.99",
    beforeFwd: "1.10 1.50 1.20",
    beforeRev: "1.30 1.40 1.10",
    atEnd: "1.20 1.60 1.30",
  };
  assert.deepEqual(loadMaxima(load), { load1Max: 1.3, load5Max: 1.6, load15Max: 1.3 });
});

test("distManifest xác định (chạy 2 lần cùng sha) và khớp manifest Q6 đã công bố của dist-retry", () => {
  const a = distManifest(SOLO.defaultRetryDist);
  const b = distManifest(SOLO.defaultRetryDist);
  assert.equal(a.manifestSha256, b.manifestSha256);
  assert.equal(a.fileCount, 254);
  assert.equal(a.manifestSha256, "71ddbb25e2e5f8ba52bebf068990a6c3f00b533887e2270f5970537d75803681");
});

test("planOrder: xen kẽ bắt đầu retry, khối 8 = 4 retry + 4 single", () => {
  const order = planOrder(8);
  assert.equal(order.length, 16);
  assert.deepEqual(order.slice(0, 8), ["retry", "single", "retry", "single", "retry", "single", "retry", "single"]);
  assert.equal(order.filter((v) => v === "retry").length, 8);
  assert.equal(order.filter((v) => v === "single").length, 8);
});

test("pairwiseRatios ghép theo thứ tự nhận (không sắp xếp lại)", () => {
  // Dùng fps đầy đủ độ chính xác từ file cũ (bản tóm tắt R1 công bố
  // 0,9895/1,0939 tính từ fps đầy đủ, không phải fps làm tròn 3 chữ số).
  const fpsOf = (run) => JSON.parse(fs.readFileSync(path.join(OLD_R1, run, "forward-hold.json"), "utf8")).reverse.fps;
  const pairs = pairwiseRatios(
    [{ run: "retry-a4", fps: fpsOf("retry-a4") }, { run: "retry-a5", fps: fpsOf("retry-a5") }],
    [{ run: "single-a1", fps: fpsOf("single-a1") }, { run: "single-a2", fps: fpsOf("single-a2") }],
  );
  assert.equal(pairs[0].ratio, 0.9895);
  assert.equal(pairs[1].ratio, 1.0939);
});

test("welchCI trên tập R1-v3 đã biết: n nhỏ nên nửa khoảng vượt ±10% (không khóa được)", () => {
  const ci = welchCI([8.907, 8.746, 9.345], [8.813, 9.567]);
  assert.ok(ci.half > 0.1 * 8.999, `nửa khoảng ${ci.half} phải vượt 10% trung bình retry 8,999`);
  assert.equal(ci.lo < -0.1 * 8.999 || ci.hi > 0.1 * 8.999, true);
});

test("driftCheck: lệch 22% bị gắn cờ, lệch 5% đạt", () => {
  const mk = (side, first, second) => [
    { run: "a", variant: side, fps: first }, { run: "b", variant: side, fps: first },
    { run: "c", variant: side, fps: second }, { run: "d", variant: side, fps: second },
  ];
  assert.equal(driftCheck(mk("retry", 9, 7)).pass, false);
  assert.equal(driftCheck(mk("retry", 9, 9.45)).pass, true);
  assert.equal(driftCheck(mk("retry", 9, 7)).perSide.retry.driftPct, -22.22);
});

test("buildSummary: tập 8+8 giả với phương sai R1 và điểm ước lượng gần 0 thì locked", () => {
  const mk = (prefix, side, base) => Array.from({ length: 8 }, (_, i) => ({
    run: `${prefix}${i + 1}`, variant: side, fps: base + (i % 2 === 0 ? 0.15 : -0.15),
  }));
  const ordered = [];
  for (let i = 0; i < 8; i++) { ordered.push(mk("r", "retry", 9.0)[i], mk("s", "single", 9.0)[i]); }
  const s = buildSummary(ordered, []);
  assert.equal(s.lock.locked, true);
  assert.equal(s.counts.retryAccepted, 8);
  assert.equal(s.counts.singleAccepted, 8);
});

test("buildSummary: tập R1-v3 thật (3+2) không locked (thiếu n)", () => {
  const ordered = [];
  for (const [run, variant] of [["retry-a4", "retry"], ["single-a1", "single"], ["retry-a5", "retry"], ["single-a2", "single"], ["retry-a6", "retry"]]) {
    const j = JSON.parse(fs.readFileSync(path.join(OLD_R1, run, "forward-hold.json"), "utf8"));
    ordered.push({ run, variant, fps: j.reverse.fps });
  }
  const s = buildSummary(ordered, []);
  assert.equal(s.lock.locked, false);
  assert.equal(s.lock.conditions.enoughAccepted, false);
});

test("summarizeSide tính đúng trung vị/trung bình/sd", () => {
  const s = summarizeSide([{ run: "a", fps: 8 }, { run: "b", fps: 9 }, { run: "c", fps: 10 }]);
  assert.equal(s.mean, 9);
  assert.equal(s.median, 9);
  assert.equal(s.sd, 1);
});

test("đợt 39 T1 hồi quy: PROBE_Q6 mà chế độ run spawn phải tồn tại (bản đợt 38 trỏ sai apps/apps/... gây NO_RESULT toàn phiên)", () => {
  assert.ok(fs.existsSync(PROBE_Q6), `probe Q6 không tồn tại: ${PROBE_Q6}`);
  assert.ok(!PROBE_Q6.includes("apps/apps/"), `đường dẫn probe vẫn sai: ${PROBE_Q6}`);
});

test("đợt 40 V1: extractPerSeekReport present — copy thật entries + summaryReverse từ forward-hold", () => {
  const entries = [
    { k: 17, targetTime: 29.2, phase: "reverse", status: "completed", seekLatencyMs: 1500.6, drawLatencyMs: 0.9 },
    { k: 18, targetTime: 27.633, phase: "reverse", status: "completed", seekLatencyMs: 1706.8, drawLatencyMs: 8.9 },
  ];
  const raw = {
    perSeekEnabled: true,
    perSeek: {
      enabled: true, version: 1, gopSeconds: 10, entries,
      marks: ["reverse"], counts: { completed: 2 },
      summaryReverse: { byMechanism: { mixed: 2 } },
    },
  };
  const r = extractPerSeekReport(raw);
  assert.equal(r.status, "present");
  assert.equal(r.perSeekEnabled, true);
  assert.equal(r.entryCount, 2);
  assert.equal(r.gopSeconds, 10);
  assert.deepEqual(r.entries, entries);
  assert.deepEqual(r.summaryReverse, { byMechanism: { mixed: 2 } });
});

test("đợt 40 V1: extractPerSeekReport present với 0 entry — đường WebCodecs không gán currentTime nên 0 entry là đúng, không phải missing", () => {
  const r = extractPerSeekReport({ perSeekEnabled: true, perSeek: { enabled: true, entries: [], summaryReverse: null } });
  assert.equal(r.status, "present");
  assert.equal(r.entryCount, 0);
});

test("đợt 40 V1: extractPerSeekReport absent — cờ tắt và forward-hold cũ đều báo absent, không bịa entry", () => {
  assert.equal(extractPerSeekReport({ perSeekEnabled: false, perSeek: null }).status, "absent");
  assert.equal(extractPerSeekReport({}).status, "absent");
  assert.equal(extractPerSeekReport(null).status, "absent");
  assert.equal(extractPerSeekReport({ perSeekEnabled: false, perSeek: null }).entries, undefined);
});

test("đợt 40 V1: extractPerSeekReport enabled-but-missing — cờ bật mà không có entries thì không được đọc thành present hay absent", () => {
  const r = extractPerSeekReport({ perSeekEnabled: true, perSeek: null });
  assert.equal(r.status, "enabled-but-missing");
  assert.equal(r.perSeekEnabled, true);
  const r2 = extractPerSeekReport({ perSeekEnabled: true, perSeek: { enabled: true } });
  assert.equal(r2.status, "enabled-but-missing");
});

test("đợt 40 V1: buildProbeEnv giữ nguyên N2_PERSEEK=1 + GOP_SEC khi đặt ngoài, và không tự sinh cờ khi không đặt", () => {
  const savedFlag = process.env.N2_PERSEEK;
  const savedGop = process.env.N2_PERSEEK_GOP_SEC;
  try {
    process.env.N2_PERSEEK = "1";
    process.env.N2_PERSEEK_GOP_SEC = "10";
    const envOn = buildProbeEnv({ fixture: "/tmp/f.mp4", scratch: "/tmp/s", display: ":91", port: 4191, distDir: "/tmp/d" });
    assert.equal(envOn.N2_PERSEEK, "1");
    assert.equal(envOn.N2_PERSEEK_GOP_SEC, "10");
    assert.equal(envOn.Q6_VIDEO, "/tmp/f.mp4");
    assert.equal(envOn.Q6_OUT, "/tmp/s/q6-labeled.json");
    assert.equal(envOn.Q6_DIST, "/tmp/d");
    assert.equal(envOn.Q6_PORT, "4191");
    delete process.env.N2_PERSEEK;
    delete process.env.N2_PERSEEK_GOP_SEC;
    const envOff = buildProbeEnv({ fixture: "/tmp/f.mp4", scratch: "/tmp/s", display: ":91", port: 4191, distDir: "/tmp/d" });
    assert.equal("N2_PERSEEK" in envOff, false);
  } finally {
    if (savedFlag === undefined) delete process.env.N2_PERSEEK; else process.env.N2_PERSEEK = savedFlag;
    if (savedGop === undefined) delete process.env.N2_PERSEEK_GOP_SEC; else process.env.N2_PERSEEK_GOP_SEC = savedGop;
  }
});

test("file mẫu cũ vẫn tồn tại cho self-test/dry-run (không bịa khi thiếu)", () => {
  for (const [dir, run] of [[OLD_R1, "retry-a5"], [OLD_R1, "single-a4"], [OLD_B36, "retry-b6"], [OLD_B36, "retry-b8"]]) {
    assert.equal(fs.existsSync(path.join(dir, run, "forward-hold.json")), true, `${dir}/${run} phải tồn tại`);
  }
});
