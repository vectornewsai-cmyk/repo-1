#!/usr/bin/env node
/**
 * test_adjustment_spec.js — Kiểm chứng phía mirror CJS cho thống nhất spec
 * adjustment layer (Phase 9, R2).
 *
 * Đối tác của packages/video-spec/src/adjustment.test.ts (bản TS):
 *   - validateAdjustmentLayers() của server/render/src/adjustment.js phải
 *     cho cùng kết quả với bản TS trên cùng bộ case (parity, kể cả message
 *     trùng id và tiền tố index).
 *   - Project chứa adjustmentLayers round-trip JSON qua mirror này không
 *     mất field; project cũ (không field) round-trip không bị chèn field.
 *   - buildAdjustmentChain() cũ vẫn chạy (hồi quy N3, không vỡ mirror).
 *
 * KHÔNG thuộc phạm vi test này (không claim): wiring render.js (luồng R1),
 * preview, panel UI. File này chỉ kiểm chứng mirror + JSON, không render
 * qua render.js.
 *
 * Chạy: node test_adjustment_spec.js   (từ server/render/)
 */
"use strict";

const assert = require("node:assert/strict");
const adj = require("./src/adjustment");

let pass = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { console.log(`  ❌ ${name} ${extra}`); throw new Error(`FAIL: ${name} ${extra}`); }
}
function eq(a, b, m) { ok(m, a === b, `nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`); }
function deep(a, b, m) {
  try { assert.deepEqual(a, b); ok(m, true); }
  catch (e) { ok(m, false, e.message); }
}

function layerColor(id, start, duration) {
  return { id, start, duration, filters: [{ color: { brightness: 20 } }] };
}
function layerLutFx(id, start, duration) {
  return { id, start, duration, filters: [{ lut: "vcut-cyberpunk", effects: [{ type: "grayscale", intensity: 1 }] }] };
}

// ---- A. validateAdjustmentLayers (parity bản TS) ----
console.log("== A. validateAdjustmentLayers (mirror CJS) ==");
eq(adj.validateAdjustmentLayers(undefined).length, 0, "undefined (project cũ) → hợp lệ");
eq(adj.validateAdjustmentLayers([]).length, 0, "mảng rỗng → hợp lệ");
eq(adj.validateAdjustmentLayers([layerColor("a", 0, 1), layerLutFx("b", 1, 1)]).length, 0, "mảng hợp lệ → không lỗi");
ok("null → lỗi", adj.validateAdjustmentLayers(null).length > 0);
ok("object → lỗi", adj.validateAdjustmentLayers({}).length > 0);
{
  const errs = adj.validateAdjustmentLayers([layerColor("a", 0, 1), { ...layerColor("b", 1, 1), duration: 0 }]);
  ok("layer lỗi trong danh sách → có lỗi", errs.length > 0);
  ok("lỗi gắn tiền tố index", errs.some((e) => e.startsWith("adjustmentLayers[1]:")));
}
{
  const errs = adj.validateAdjustmentLayers([layerColor("dup", 0, 1), layerColor("dup", 2, 1)]);
  ok("trùng id → lỗi ghi rõ id + 2 index", errs.some((e) => e.includes('trùng id "dup"') && e.includes("0") && e.includes("1")));
}
eq(adj.validateAdjustmentLayers([layerColor("a", 0, 3), layerColor("b", 1, 3)]).length, 0, "2 layer chồng nhau → HỢP LỆ (nối filter)");

// ---- B. round-trip JSON qua mirror ----
console.log("== B. round-trip JSON ==");
{
  const spec = {
    version: "0.2.0",
    meta: { name: "spec", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "a", src: "a.mp4", start: 0, duration: 4, in: 0, out: 4 }] }],
    adjustmentLayers: [layerColor("adj1", 0, 2), layerLutFx("adj2", 2, 4)],
  };
  const parsed = JSON.parse(JSON.stringify(spec));
  deep(parsed, spec, "parse → serialize → parse giữ nguyên toàn bộ spec");
  eq(parsed.adjustmentLayers.length, 2, "giữ đủ 2 layer");
  deep(parsed.adjustmentLayers[1].filters, [{ lut: "vcut-cyberpunk", effects: [{ type: "grayscale", intensity: 1 }] }], "giữ nguyên filters layer 2 (lut + effects)");
  eq(adj.validateAdjustmentLayers(parsed.adjustmentLayers).length, 0, "sau round-trip validate vẫn xanh");
  const reparsed = JSON.parse(JSON.stringify(parsed));
  deep(reparsed, spec, "vòng round-trip thứ 2 vẫn nguyên vẹn");
}
{
  const old = {
    version: "0.2.0",
    meta: { name: "old", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "a", src: "a.mp4", start: 0, duration: 4, in: 0, out: 4 }] }],
  };
  const parsed = JSON.parse(JSON.stringify(old));
  deep(parsed, old, "project cũ round-trip giữ nguyên");
  eq("adjustmentLayers" in parsed, false, "project cũ không bị chèn field");
  eq(adj.validateAdjustmentLayers(parsed.adjustmentLayers).length, 0, "project cũ validate list → hợp lệ");
}

// ---- C. hồi quy chain builder N3 ----
console.log("== C. hồi quy buildAdjustmentChain (N3) ==");
eq(adj.buildAdjustmentChain([], undefined, undefined), "", "không layer → chuỗi rỗng");
eq(adj.buildAdjustmentFilterChain({ color: { brightness: 20 } }), "eq=brightness=0.2", "chain color vẫn đúng");
{
  const chain = adj.buildClipAdjustmentChain(
    [layerColor("a", 0, 2)],
    { start: 0, duration: 1 }
  );
  ok("clip giao layer → chain khác rỗng", chain.length > 0);
  eq(adj.buildClipAdjustmentChain([layerColor("a", 0, 2)], { start: 5, duration: 1 }), "", "clip ngoài layer → chain rỗng");
}

console.log(`\ntest_adjustment_spec: ${pass} kiểm tra xanh`);
