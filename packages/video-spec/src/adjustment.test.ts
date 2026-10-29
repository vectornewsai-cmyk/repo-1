/**
 * adjustment.test.ts — Test cho thống nhất spec adjustment layer (Phase 9, R2).
 *
 * Phạm vi R2 (xem server/render/src/ADJUSTMENT_LIMITS.md §"R2"):
 *   - adjustment.ts đã export từ index.ts; VideoSpec có field
 *     `adjustmentLayers?: AdjustmentLayer[]` (danh sách cấp project).
 *   - validateAdjustmentLayers(): project cũ (field vắng) vẫn hợp lệ.
 *   - Project chứa layer round-trip JSON (parse → serialize → parse)
 *     không mất field nào; project cũ round-trip không bị chèn field.
 * KHÔNG thuộc phạm vi test này (không claim): wiring render.js (luồng R1),
 * preview, panel UI, chuyển đổi bản ghi UI kind "adjustment" của N4.
 *
 * Chạy bằng (theo mẫu nested.test.ts):
 *   npx tsc packages/video-spec/src/index.ts \
 *     packages/video-spec/src/adjustment.test.ts \
 *     --outDir /tmp/adj-spec-test --module nodenext --target es2022 \
 *     --moduleResolution nodenext --skipLibCheck
 *   node --test /tmp/adj-spec-test/adjustment.test.js
 * (tsc biên dịch cả graph index.ts vì test import isVideoSpec runtime;
 * output nằm ở /tmp, không ghi đè file .js trong repo.)
 *
 * Quy ước số: mọi thời gian tính bằng GIÂY. So sánh deepEqual dùng
 * node:assert/strict (không dung sai float — fixture dùng số nguyên
 * hoặc thập phân nhị phân chính xác).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adjustmentAppliesTo,
  adjustmentLayerAppliesToTrack,
  adjustmentLayersForClip,
  adjustmentOverlapsClip,
  isLegacyAdjustmentTrackClip,
  legacyTrackClipToLayer,
  specLayerToLegacyTrackClip,
  validateAdjustmentLayer,
  validateAdjustmentLayers,
} from "./adjustment.js";
import { isVideoSpec, projectDuration, SPEC_VERSION } from "./index.js";
import type { AdjustmentLayer, VideoSpec } from "./index.js";

// ---- fixture ----

function meta() {
  return { name: "spec", width: 1280, height: 720, fps: 30 };
}

function videoClip(id: string, start: number, duration: number) {
  return {
    kind: "video" as const,
    id,
    src: `${id}.mp4`,
    start,
    duration,
    in: 0,
    out: duration,
  };
}

function layerColor(id: string, start: number, duration: number): AdjustmentLayer {
  return {
    id,
    start,
    duration,
    filters: [{ color: { brightness: 20 } }],
  };
}

function layerLutFx(id: string, start: number, duration: number): AdjustmentLayer {
  return {
    id,
    start,
    duration,
    filters: [{ lut: "vcut-cyberpunk", effects: [{ type: "grayscale", intensity: 1 }] }],
  };
}

function specWithLayers(): VideoSpec {
  return {
    version: SPEC_VERSION,
    meta: meta(),
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [videoClip("a", 0, 4), videoClip("b", 4, 4)],
      },
    ],
    adjustmentLayers: [layerColor("adj1", 0, 2), layerLutFx("adj2", 2, 4)],
  };
}

function specOld(): VideoSpec {
  return {
    version: SPEC_VERSION,
    meta: meta(),
    tracks: [
      { id: "v1", kind: "video", clips: [videoClip("a", 0, 4)] },
    ],
  };
}

// ---- A. validate một layer (hồi quy N3 qua bản TS) ----

test("A1: layer hợp lệ (color / lut+effects) → không lỗi", () => {
  assert.deepEqual(validateAdjustmentLayer(layerColor("x", 0, 2)), []);
  assert.deepEqual(validateAdjustmentLayer(layerLutFx("y", 1, 1)), []);
});

test("A2: layer lỗi từng field → mỗi case ít nhất 1 lỗi", () => {
  const good = layerColor("x", 1, 2);
  const bad: unknown[] = [
    undefined,
    null,
    "chuỗi",
    [],
    { ...good, id: "" },
    { ...good, start: -0.5 },
    { ...good, duration: 0 },
    { ...good, filters: [] },
    { ...good, filters: {} },
    { ...good, filters: [{}] },
    { ...good, filters: [{ lut: "không-tồn-tại" }] },
    { ...good, filters: [{ enhance: {} }] },
    { ...good, keyLạ: 1 },
  ];
  for (const b of bad) {
    assert.ok(
      validateAdjustmentLayer(b).length > 0,
      `phải lỗi với input ${JSON.stringify(b)}`
    );
  }
});

test("A3: chọn layer theo thời gian — chạm biên không tính giao", () => {
  const layers = [layerColor("l1", 0, 2), layerColor("l2", 2, 2)];
  assert.equal(adjustmentAppliesTo(layers[0], 0), true);
  assert.equal(adjustmentAppliesTo(layers[0], 1.999), true);
  assert.equal(adjustmentAppliesTo(layers[0], 2), false);
  assert.equal(adjustmentOverlapsClip(layers[0], 2, 1), false); // chạm biên phải
  assert.equal(adjustmentOverlapsClip(layers[1], 0, 2), false); // chạm biên trái
  assert.deepEqual(
    adjustmentLayersForClip(layers, 1, 2).map((l) => l.id),
    ["l1", "l2"]
  );
  assert.deepEqual(
    adjustmentLayersForClip(layers, 0, 2).map((l) => l.id),
    ["l1"]
  );
});

// ---- B. validate danh sách cấp project ----

test("B1: undefined (project cũ, field vắng) → hợp lệ", () => {
  assert.deepEqual(validateAdjustmentLayers(undefined), []);
});

test("B2: mảng rỗng → hợp lệ; mảng hợp lệ → không lỗi", () => {
  assert.deepEqual(validateAdjustmentLayers([]), []);
  assert.deepEqual(
    validateAdjustmentLayers([layerColor("a", 0, 1), layerLutFx("b", 1, 1)]),
    []
  );
});

test("B3: null / không phải mảng → lỗi", () => {
  assert.ok(validateAdjustmentLayers(null).length > 0);
  assert.ok(validateAdjustmentLayers({}).length > 0);
  assert.ok(validateAdjustmentLayers("x").length > 0);
});

test("B4: layer lỗi trong danh sách → lỗi gắn tiền tố index", () => {
  const errs = validateAdjustmentLayers([
    layerColor("a", 0, 1),
    { ...layerColor("b", 1, 1), duration: 0 },
  ]);
  assert.ok(errs.length > 0);
  assert.ok(errs.some((e) => e.startsWith("adjustmentLayers[1]:")));
});

test("B5: trùng id → lỗi, ghi rõ cả 2 index", () => {
  const errs = validateAdjustmentLayers([
    layerColor("dup", 0, 1),
    layerColor("dup", 2, 1),
  ]);
  assert.ok(errs.some((e) => e.includes('trùng id "dup"')));
  assert.ok(errs.some((e) => e.includes("0") && e.includes("1")));
});

test("B6: 2 layer chồng nhau về thời gian → HỢP LỆ (nối filter, không cấm)", () => {
  assert.deepEqual(
    validateAdjustmentLayers([layerColor("a", 0, 3), layerColor("b", 1, 3)]),
    []
  );
});

// ---- C. round-trip project qua JSON ----

test("C1: project có layer — parse → serialize → parse không mất field", () => {
  const spec = specWithLayers();
  assert.equal(isVideoSpec(spec), true);
  assert.deepEqual(validateAdjustmentLayers(spec.adjustmentLayers), []);
  const json = JSON.stringify(spec);
  const parsed = JSON.parse(json) as VideoSpec;
  assert.deepEqual(parsed, spec);
  // Kiểm tra từng field của từng layer, không chỉ deepEqual tổng thể.
  assert.equal(parsed.adjustmentLayers!.length, 2);
  assert.equal(parsed.adjustmentLayers![0].id, "adj1");
  assert.equal(parsed.adjustmentLayers![0].start, 0);
  assert.equal(parsed.adjustmentLayers![0].duration, 2);
  assert.deepEqual(parsed.adjustmentLayers![0].filters, [
    { color: { brightness: 20 } },
  ]);
  assert.equal(parsed.adjustmentLayers![1].id, "adj2");
  assert.deepEqual(parsed.adjustmentLayers![1].filters, [
    { lut: "vcut-cyberpunk", effects: [{ type: "grayscale", intensity: 1 }] },
  ]);
  // Vòng 2 vẫn nguyên vẹn + validate vẫn xanh.
  const reparsed = JSON.parse(JSON.stringify(parsed)) as VideoSpec;
  assert.deepEqual(reparsed, spec);
  assert.deepEqual(validateAdjustmentLayers(reparsed.adjustmentLayers), []);
  assert.equal(isVideoSpec(reparsed), true);
});

test("C2: layer không làm đổi projectDuration (duration tính theo clip)", () => {
  // specWithLayers: clip tới 8s, layer tới 6s → duration = 8.
  assert.equal(projectDuration(specWithLayers()), 8);
  // Layer vươn xa hơn clip (0–10s) nhưng clip chỉ tới 2s → duration vẫn 2.
  const spec: VideoSpec = {
    version: SPEC_VERSION,
    meta: meta(),
    tracks: [{ id: "v1", kind: "video", clips: [videoClip("a", 0, 2)] }],
    adjustmentLayers: [layerColor("far", 0, 10)],
  };
  assert.equal(projectDuration(spec), 2);
  assert.equal(spec.tracks[0].clips.length, 1);
  assert.equal(spec.adjustmentLayers!.length, 1);
});

test("C3: project cũ — parse → serialize → parse: không bị chèn field", () => {
  const spec = specOld();
  assert.equal(isVideoSpec(spec), true);
  assert.equal("adjustmentLayers" in spec, false);
  assert.deepEqual(validateAdjustmentLayers(spec.adjustmentLayers), []);
  const parsed = JSON.parse(JSON.stringify(spec)) as VideoSpec;
  assert.deepEqual(parsed, spec);
  assert.equal("adjustmentLayers" in parsed, false);
  assert.deepEqual(validateAdjustmentLayers(parsed.adjustmentLayers), []);
});

test("C4: project cũ đọc từ JSON thô (không qua constructor TS)", () => {
  const raw = JSON.stringify({
    version: SPEC_VERSION,
    meta: meta(),
    tracks: [{ id: "v1", kind: "video", clips: [videoClip("a", 0, 4)] }],
  });
  const parsed = JSON.parse(raw) as VideoSpec;
  assert.equal(isVideoSpec(parsed), true);
  assert.deepEqual(validateAdjustmentLayers(parsed.adjustmentLayers), []);
});

// ---- D. đợt 7: tracks scope + source ----

test("D1: tracks vắng/rỗng = áp mọi track; tracks có chỉ số = chỉ track đó", () => {
  const unscoped = layerColor("u", 0, 2);
  const empty = { ...layerColor("e", 0, 2), tracks: [] as number[] };
  const scoped = { ...layerColor("s", 0, 2), tracks: [1] };
  assert.equal(adjustmentLayerAppliesToTrack(unscoped, 0), true);
  assert.equal(adjustmentLayerAppliesToTrack(unscoped, 5), true);
  assert.equal(adjustmentLayerAppliesToTrack(empty, 3), true);
  assert.equal(adjustmentLayerAppliesToTrack(scoped, 1), true);
  assert.equal(adjustmentLayerAppliesToTrack(scoped, 0), false);
  assert.equal(adjustmentLayerAppliesToTrack(scoped, 2), false);
});

test("D2: validate tracks — số nguyên >= 0, không trùng, không vượt trackCount", () => {
  const base = layerColor("x", 0, 2);
  assert.deepEqual(validateAdjustmentLayer({ ...base, tracks: [0, 2] }), []);
  assert.deepEqual(validateAdjustmentLayer({ ...base, tracks: [] }), []);
  assert.deepEqual(validateAdjustmentLayer({ ...base, tracks: [0, 2] }, 3), []);
  const bad: unknown[] = [
    { ...base, tracks: [0, 0] }, // trùng
    { ...base, tracks: [-1] },
    { ...base, tracks: [1.5] },
    { ...base, tracks: ["1"] },
    { ...base, tracks: "1" },
    { ...base, tracks: [2] }, // vượt khi trackCount = 2 (được check ở dưới)
  ];
  for (const b of bad.slice(0, 5)) {
    assert.ok(validateAdjustmentLayer(b).length > 0, JSON.stringify(b));
  }
  assert.ok(validateAdjustmentLayer({ ...base, tracks: [2] }, 2).length > 0);
  assert.ok(validateAdjustmentLayers([{ ...base, tracks: [5] }], 3).length > 0);
  // Không truyền trackCount thì không chặn giới hạn trên (không biết).
  assert.deepEqual(validateAdjustmentLayer({ ...base, tracks: [99] }), []);
});

test("D3: validate source — chỉ panel / legacy-track-clip", () => {
  const base = layerColor("x", 0, 2);
  assert.deepEqual(validateAdjustmentLayer({ ...base, source: "panel" }), []);
  assert.deepEqual(
    validateAdjustmentLayer({ ...base, source: "legacy-track-clip" }),
    []
  );
  assert.ok(validateAdjustmentLayer({ ...base, source: "ui" }).length > 0);
});

test("D4: adjustmentLayersForClip có trackIndex lọc theo scope, không có thì giữ hành vi cũ", () => {
  const layers = [
    { ...layerColor("all", 0, 4) },
    { ...layerColor("only1", 0, 4), tracks: [1] },
    { ...layerColor("only0", 0, 4), tracks: [0] },
  ];
  // Không trackIndex: cả 3 đều giao thời gian → trả cả 3 (hành vi cũ).
  assert.deepEqual(
    adjustmentLayersForClip(layers, 1, 1).map((l) => l.id),
    ["all", "only1", "only0"]
  );
  // Có trackIndex: chỉ layer áp track đó, giữ nguyên thứ tự mảng.
  assert.deepEqual(
    adjustmentLayersForClip(layers, 1, 1, 1).map((l) => l.id),
    ["all", "only1"]
  );
  assert.deepEqual(
    adjustmentLayersForClip(layers, 1, 1, 0).map((l) => l.id),
    ["all", "only0"]
  );
  // Layer scope hẹp nhưng không giao thời gian thì vẫn bị loại.
  assert.deepEqual(adjustmentLayersForClip(layers, 10, 1, 1), []);
});

// ---- E. đợt 7: legacy track clip → spec layer ----

test("E1: nestUtils shape (filterType/intensity) → layer tracks=[trackIndex], source legacy", () => {
  const r = legacyTrackClipToLayer(
    { kind: "adjustment", id: "adj", start: 2, duration: 3, filterType: "grayscale", intensity: 0.7 },
    1
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.value, {
      id: "adj",
      start: 2,
      duration: 3,
      filters: [{ effects: [{ type: "grayscale", intensity: 0.7 }] }],
      tracks: [1],
      source: "legacy-track-clip",
    });
  }
});

test("E2: nestedPreview shape filter.lut + effects → 1 filter entry gộp", () => {
  const r = legacyTrackClipToLayer(
    {
      kind: "adjustment",
      id: "adj",
      start: 0,
      duration: 2,
      filter: { lut: "vcut-cyberpunk" },
      effects: [{ type: "sepia", intensity: 0.5 }],
    },
    0
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.value.filters, [
      { lut: "vcut-cyberpunk", effects: [{ type: "sepia", intensity: 0.5 }] },
    ]);
    assert.deepEqual(r.value.tracks, [0]);
  }
});

test("E3: hình dạng adjustment: { lut, color } → layer hợp lệ", () => {
  const r = legacyTrackClipToLayer(
    {
      kind: "adjustment",
      id: "adj",
      start: 1,
      duration: 2,
      adjustment: { lut: "vcut-cyberpunk", color: { brightness: 10 } },
    },
    2
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.value.filters, [
      { lut: "vcut-cyberpunk", color: { brightness: 10 } },
    ]);
  }
});

test("E4: legacy lỗi → ok:false kèm lý do, không bịa filter", () => {
  const cases: Array<[unknown, number]> = [
    [{ kind: "video", id: "x", start: 0, duration: 1 }, 0], // không phải legacy
    [{ kind: "adjustment", id: "", start: 0, duration: 1, filterType: "blur" }, 0],
    [{ kind: "adjustment", id: "a", start: -1, duration: 1, filterType: "blur" }, 0],
    [{ kind: "adjustment", id: "a", start: 0, duration: 0, filterType: "blur" }, 0],
    [{ kind: "adjustment", id: "a", start: 0, duration: 1, filterType: "blur" }, -1],
    [{ kind: "adjustment", id: "a", start: 0, duration: 1, filterType: "blur" }, 1.5],
    [{ kind: "adjustment", id: "a", start: 0, duration: 1, filterType: "không-tồn-tại" }, 0],
    [{ kind: "adjustment", id: "a", start: 0, duration: 1, filterType: "blur", intensity: 2 }, 0],
    [{ kind: "adjustment", id: "a", start: 0, duration: 1 }, 0], // không có filter nào
    [{ kind: "adjustment", id: "a", start: 0, duration: 1, filter: { lut: "không-tồn-tại" } }, 0],
    [{ kind: "adjustment", id: "a", start: 0, duration: 1, filterType: "blur", effects: [{ type: "blur" }] }, 0], // trùng effect
  ];
  for (const [clip, ti] of cases) {
    const r = legacyTrackClipToLayer(clip, ti);
    assert.equal(r.ok, false, JSON.stringify(clip));
    if (!r.ok) assert.ok(r.reason.length > 0);
  }
  assert.equal(isLegacyAdjustmentTrackClip({ kind: "adjustment", id: "a" }), true);
  assert.equal(isLegacyAdjustmentTrackClip({ kind: "video", id: "a" }), false);
});

// ---- F. đợt 7: spec layer → legacy track clip ----

test("F1: layer 1 track + 1 effect → legacy có cả filterType và effects (cùng effect)", () => {
  const r = specLayerToLegacyTrackClip({
    id: "adj",
    start: 2,
    duration: 3,
    filters: [{ effects: [{ type: "grayscale", intensity: 0.7 }] }],
    tracks: [1],
    source: "legacy-track-clip",
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.trackIndex, 1);
    assert.equal(r.value.kind, "adjustment");
    assert.equal(r.value.id, "adj");
    assert.equal(r.value.filterType, "grayscale");
    assert.equal(r.value.intensity, 0.7);
    assert.deepEqual(r.value.effects, [{ type: "grayscale", intensity: 0.7 }]);
  }
});

test("F2: layer không scope hoặc đa-track → ok:false kèm lý do, không bịa scope", () => {
  const noScope = specLayerToLegacyTrackClip(layerColor("a", 0, 2));
  assert.equal(noScope.ok, false);
  if (!noScope.ok) assert.ok(noScope.reason.includes("mọi track"));
  const multi = specLayerToLegacyTrackClip({
    ...layerColor("b", 0, 2),
    tracks: [0, 1],
  });
  assert.equal(multi.ok, false);
  if (!multi.ok) assert.ok(multi.reason.includes("2 track"));
  const empty = specLayerToLegacyTrackClip({
    ...layerColor("c", 0, 2),
    tracks: [],
  });
  assert.equal(empty.ok, false);
});

test("F3: layer LUT+color+effects → legacy filter+effects gộp; nhiều LUT → fail", () => {
  const r = specLayerToLegacyTrackClip({
    id: "adj",
    start: 0,
    duration: 2,
    filters: [{ lut: "vcut-cyberpunk", color: { brightness: 10 }, effects: [{ type: "sepia" }] }],
    tracks: [0],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.value.filter, { lut: "vcut-cyberpunk", color: { brightness: 10 } });
    assert.deepEqual(r.value.effects, [{ type: "sepia" }]);
    assert.equal(r.value.filterType, undefined); // không phải single-effect nên không có shortcut
  }
  const multiLut = specLayerToLegacyTrackClip({
    id: "adj",
    start: 0,
    duration: 2,
    filters: [{ lut: "vcut-cyberpunk" }, { lut: "vcut-cinematic" }],
    tracks: [0],
  });
  assert.equal(multiLut.ok, false);
  const badLayer = specLayerToLegacyTrackClip({
    id: "adj",
    start: 0,
    duration: 0,
    filters: [{ effects: [{ type: "sepia" }] }],
    tracks: [0],
  });
  assert.equal(badLayer.ok, false);
});

test("F4: round-trip legacy (nestUtils) → spec → legacy giữ filterType/intensity/vị trí", () => {
  const legacy = {
    kind: "adjustment" as const,
    id: "adj",
    start: 2,
    duration: 3,
    filterType: "grayscale",
    intensity: 0.7,
  };
  const toSpec = legacyTrackClipToLayer(legacy, 1);
  assert.equal(toSpec.ok, true);
  if (!toSpec.ok) return;
  const back = specLayerToLegacyTrackClip(toSpec.value);
  assert.equal(back.ok, true);
  if (back.ok) {
    assert.equal(back.trackIndex, 1);
    assert.equal(back.value.filterType, legacy.filterType);
    assert.equal(back.value.intensity, legacy.intensity);
    assert.equal(back.value.start, legacy.start);
    assert.equal(back.value.duration, legacy.duration);
  }
  // Round-trip qua JSON của layer spec không mất tracks/source.
  const reparsed = JSON.parse(JSON.stringify(toSpec.value)) as typeof toSpec.value;
  assert.deepEqual(reparsed, toSpec.value);
  assert.deepEqual(validateAdjustmentLayer(reparsed), []);
});
