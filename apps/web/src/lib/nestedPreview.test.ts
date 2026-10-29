// nestedPreview.test.ts — test thuần flattenForPreview + applyAdjustmentPreview.
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types src/lib/nestedPreview.test.ts
import assert from "node:assert/strict";
import {
  adjustmentAppliesToClip,
  applyAdjustmentPreview,
  buildPreviewSpec,
  convertCanonicalLayer,
  flattenForPreview,
  hasNestedOrAdjustment,
  normalizeNestedClip,
  skippedEffectReason,
  type AdjustmentWindow,
  type LeafClipInput,
} from "./nestedPreview.ts";
// P3 (đợt 11): chứng minh effect của adjustment tới được đường vẽ canvas
// (canvasEffectOps là hàm thuần, không cần DOM — phần DOM chỉ nằm ở
// effectCanvasSource trong preview.tsx, vốn chỉ bọc applyCanvasEffects).
import { canvasEffectOps } from "./effectCanvas.ts";

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

function video(
  id: string,
  start: number,
  duration: number,
  extra: Record<string, unknown> = {},
): LeafClipInput {
  return {
    kind: "video", id, start, duration, in: 0, out: duration, ...extra,
  } as LeafClipInput;
}

console.log("== nestedPreview: flatten ==");
ok("clip tầng ngoài giữ nguyên start/duration, nestedPath rỗng", () => {
  const r = flattenForPreview({
    tracks: [{ kind: "video", clips: [video("a", 2, 5)] }],
  });
  assert.equal(r.clips.length, 1);
  assert.equal(r.clips[0].outerStart, 2);
  assert.equal(r.clips[0].outerDuration, 5);
  assert.deepEqual(r.clips[0].nestedPath, []);
  assert.equal(r.clips[0].sourceId, "a");
  assert.equal(r.adjustments.length, 0);
  assert.equal(r.skipped.length, 0);
});

ok("nested 1 cấp: offset đúng, clip cắt mép trái dời in", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "n1", start: 10, duration: 5, in: 2,
        tracks: [
          { kind: "video", clips: [video("inner1", 3, 4)] },
          // inner2 [0,3) chỉ chồng [2,3) với cửa sổ sequence [2,7)
          { kind: "video", clips: [video("inner2", 0, 3, { in: 0, out: 3 })] },
        ],
      }],
    }],
  });
  assert.equal(r.clips.length, 2);
  const c1 = r.clips.find((c) => c.sourceId === "inner1")!;
  assert.equal(c1.outerStart, 11); // 10 + (3 - 2)
  assert.equal(c1.outerDuration, 4);
  assert.deepEqual(c1.nestedPath, ["n1"]);
  const c2 = r.clips.find((c) => c.sourceId === "inner2")!;
  assert.equal(c2.outerStart, 10); // 10 + (2 - 2)
  assert.equal(c2.outerDuration, 1);
  assert.equal(c2.clip.in, 2); // cắt 2s mép trái -> in 0 -> 2
  assert.equal(c2.clip.out, 3); // in mới 2 + duration mới 1
});

ok("nested 2 cấp: ánh xạ hợp thành đúng", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "outer", start: 20, duration: 20, in: 0,
        tracks: [{
          kind: "video",
          clips: [{
            kind: "nested", id: "inner", start: 5, duration: 10, in: 1,
            tracks: [{ kind: "video", clips: [video("leaf", 2, 4)] }],
          }],
        }],
      }],
    }],
  });
  assert.equal(r.clips.length, 1);
  // leaf [2,6) trong sequence inner, cửa sổ inner [1,11) -> giữ nguyên;
  // inner-seq 2 -> outer-seq 5 + (2-1) = 6 -> timeline 20 + 6 = 26.
  assert.equal(r.clips[0].outerStart, 26);
  assert.equal(r.clips[0].outerDuration, 4);
  assert.deepEqual(r.clips[0].nestedPath, ["outer", "inner"]);
});

ok("nested có speed 2: sequence tiêu thụ gấp đôi, clip co lại một nửa", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "fast", start: 0, duration: 5, in: 0, speed: 2,
        tracks: [{ kind: "video", clips: [video("leaf", 4, 4)] }],
      }],
    }],
  });
  assert.equal(r.clips.length, 1);
  assert.equal(r.clips[0].outerStart, 2); // 4 / 2
  assert.equal(r.clips[0].outerDuration, 2); // 4 / 2
});

ok("nested chu trình (id lặp trong path) bị bỏ qua, không treo", () => {
  const selfRef: Record<string, unknown> = {
    kind: "nested", id: "loop", start: 0, duration: 10, in: 0, tracks: [],
  };
  // Con trỏ tới chính nó qua cùng id (mô phỏng chu trình theo id).
  selfRef["tracks"] = [{ kind: "video", clips: [selfRef] }];
  const r = flattenForPreview({
    tracks: [{ kind: "video", clips: [selfRef] }],
  });
  assert.equal(r.clips.length, 0);
  assert.ok(r.skipped.some((s) => s.includes("chu trình")));
});

ok("nested không hợp lệ (duration 0) bị bỏ qua kèm lý do", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "bad", start: 0, duration: 0,
        tracks: [{ kind: "video", clips: [video("leaf", 0, 2)] }],
      }],
    }],
  });
  assert.equal(r.clips.length, 0);
  assert.equal(r.skipped.length, 1);
});

ok("adjustment trong nested được quy về timeline ngoài", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "n1", start: 10, duration: 10, in: 0,
        tracks: [
          { kind: "video", clips: [video("leaf", 0, 10)] },
          { kind: "adjustment", clips: [{ kind: "adjustment", id: "adj", start: 2, duration: 3, filter: { lut: "vcut-cinematic" } }] },
        ],
      }],
    }],
  });
  assert.equal(r.adjustments.length, 1);
  assert.equal(r.adjustments[0].start, 12);
  assert.equal(r.adjustments[0].duration, 3);
  assert.deepEqual(r.adjustments[0].nestedPath, ["n1"]);
});

console.log("== nestedPreview: applyAdjustmentPreview ==");
const layers: AdjustmentWindow[] = [
  { id: "adj1", start: 3, duration: 4, filter: { lut: "vcut-cinematic", color: { brightness: 20 } }, effects: [{ type: "blur", intensity: 0.5 }] },
  { id: "adj2", start: 5, duration: 4, filter: { lut: "vcut-noir-contrast" }, effects: [{ type: "sharpen", intensity: 0.8 }] },
];
const baseClip = {
  filter: { lut: "vcut-vintage-fade", color: { brightness: 10, contrast: 5 } },
  effects: [{ type: "grayscale", intensity: 1 }],
};

ok("ngoài khoảng adjustment: giữ filter gốc, không layer active", () => {
  const f = applyAdjustmentPreview(baseClip, layers, 2);
  assert.deepEqual(f.activeLayerIds, []);
  assert.equal(f.adjustmentActive, false);
  assert.equal(f.lut, "vcut-vintage-fade");
  assert.deepEqual(f.color, { brightness: 10, contrast: 5 });
});

ok("trong 1 layer: LUT layer thắng, color cộng dồn, effect gộp", () => {
  const f = applyAdjustmentPreview(baseClip, layers, 4);
  assert.deepEqual(f.activeLayerIds, ["adj1"]);
  assert.equal(f.lut, "vcut-cinematic");
  assert.deepEqual(f.color, { brightness: 30, contrast: 5 });
  assert.deepEqual(f.effects.map((e) => e.type), ["grayscale", "blur"]);
  assert.deepEqual(f.skippedEffects, []);
});

ok("chồng 2 layer: layer sau thắng LUT, effect canvas (sharpen) KHÔNG bị ghi skipped", () => {
  const f = applyAdjustmentPreview(baseClip, layers, 6);
  assert.deepEqual(f.activeLayerIds, ["adj1", "adj2"]);
  assert.equal(f.lut, "vcut-noir-contrast"); // adj2 thắng
  assert.deepEqual(f.color, { brightness: 30, contrast: 5 });
  assert.ok(f.effects.some((e) => e.type === "sharpen"));
  // P3 (đợt 11): sharpen vẽ thật bằng effectCanvas từ đợt 10 nên không
  // còn là skipped — test cũ assert ["sharpen"] là hành vi R4 đã lỗi thời.
  assert.deepEqual(f.skippedEffects, []);
  assert.deepEqual(f.skippedReasons, []);
});

ok("biên phải là độc quyền: time = start + duration thì layer hết hiệu lực", () => {
  const f = applyAdjustmentPreview(baseClip, layers, 7);
  assert.deepEqual(f.activeLayerIds, ["adj2"]);
});

ok("color clamp [-100, 100] khi cộng dồn vượt ngưỡng", () => {
  const f = applyAdjustmentPreview(
    { filter: { color: { brightness: 90 } } },
    [{ id: "hot", start: 0, duration: 10, filter: { color: { brightness: 50 } } }],
    5,
  );
  assert.deepEqual(f.color, { brightness: 100 });
});

console.log("== nestedPreview: buildPreviewSpec ==");
ok("không nested/adjustment: trả đúng object spec cũ", () => {
  const spec = {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [{ id: "v", kind: "video", clips: [video("a", 0, 5)] }],
  } as never;
  assert.equal(buildPreviewSpec(spec), spec);
  assert.equal(hasNestedOrAdjustment(spec as never), false);
});

ok("có nested + adjustment: spec phẳng, clip cắt theo biên, đoạn giữa mang LUT", () => {
  const spec = {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [
      { id: "v", kind: "video", clips: [video("plain", 0, 10)] },
      { id: "n", kind: "video", clips: [{
        kind: "nested", id: "n1", start: 0, duration: 10, in: 0,
        tracks: [{ kind: "video", clips: [video("leaf", 0, 10)] }],
      }] },
      { id: "a", kind: "adjustment", clips: [{ kind: "adjustment", id: "adj", start: 3, duration: 2, filter: { lut: "vcut-cinematic" } }] },
    ],
  } as never;
  const out = buildPreviewSpec(spec);
  // Không còn track adjustment, không còn clip nested.
  assert.ok(!out.tracks.some((t) => t.kind === "adjustment"));
  assert.ok(!out.tracks.some((t) => t.clips.some((c) => (c as { kind: string }).kind === "nested")));
  // Clip thường bị cắt thành 3 đoạn, đoạn giữa mang LUT adjustment.
  const plainTrack = out.tracks.find((t) => t.id === "v")!;
  assert.equal(plainTrack.clips.length, 3);
  assert.deepEqual(plainTrack.clips.map((c) => [c.start, c.duration]), [[0, 3], [3, 2], [5, 5]]);
  const mid = plainTrack.clips[1] as unknown as { filter?: { lut?: string } };
  assert.equal(mid.filter?.lut, "vcut-cinematic");
  const first = plainTrack.clips[0] as unknown as { filter?: { lut?: string } };
  assert.equal(first.filter?.lut, undefined);
  // Clip lá từ nested nằm trên track __nested-video, cũng cắt 3 đoạn.
  const nestedTrack = out.tracks.find((t) => t.id === "__nested-video")!;
  assert.equal(nestedTrack.clips.length, 3);
  // Spec gốc không bị sửa (clip gốc vẫn 1 đoạn, không có LUT).
  const origPlain = (spec as unknown as { tracks: Array<{ clips: Array<{ start: number; filter?: unknown }> }> }).tracks[0].clips[0];
  assert.equal(origPlain.start, 0);
  assert.equal(origPlain.filter, undefined);
});

console.log("== nestedPreview U3: scope của adjustment (thay thứ tự track R4) ==");
function spec3(
  t0: Record<string, unknown>,
  t1: Record<string, unknown>,
  t2?: Record<string, unknown>,
): never {
  const tracks = [t0, t1, ...(t2 ? [t2] : [])];
  return {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks,
  } as never;
}
function adjTrack(id: string, start: number, duration: number, lut: string): Record<string, unknown> {
  return { id, kind: "adjustment", clips: [{ kind: "adjustment", id, start, duration, filter: { lut } }] };
}
function vidTrack(id: string, clips: unknown[]): Record<string, unknown> {
  return { id, kind: "video", clips };
}

ok("U3 track adjustment chuyên biệt (không scope) áp mọi track, bất kể vị trí", () => {
  // U3 thay R4: không còn "track trên áp xuống" — track adjustment
  // chuyên biệt không có host nên normalize thành không scope (mọi track).
  const above = buildPreviewSpec(spec3(
    vidTrack("v", [video("a", 0, 10)]),
    adjTrack("adj", 3, 2, "vcut-cinematic"),
  ));
  const aTrack = above.tracks.find((t) => t.id === "v")!;
  assert.equal(aTrack.clips.length, 3);
  assert.equal((aTrack.clips[1] as unknown as { filter?: { lut?: string } }).filter?.lut, "vcut-cinematic");
  const below = buildPreviewSpec(spec3(
    adjTrack("adj", 3, 2, "vcut-cinematic"),
    vidTrack("v", [video("a", 0, 10)]),
  ));
  const bTrack = below.tracks.find((t) => t.id === "v")!;
  assert.equal(bTrack.clips.length, 3);
  assert.equal((bTrack.clips[1] as unknown as { filter?: { lut?: string } }).filter?.lut, "vcut-cinematic");
});

ok("U3 layer legacy host trên track video chỉ áp clip cùng track đó", () => {
  const out = buildPreviewSpec(spec3(
    vidTrack("v", [
      video("a", 0, 10),
      { kind: "adjustment", id: "adj", start: 3, duration: 2, filter: { lut: "vcut-cinematic" } },
    ]),
    vidTrack("w", [video("b", 0, 10)]),
  ));
  // Clip a cùng track host với layer: cắt 3 đoạn, đoạn giữa mang LUT.
  // Clip b khác track: không cắt, không LUT (U3: scope = [track host]).
  const vTrack = out.tracks.find((t) => t.id === "v")!;
  assert.equal(vTrack.clips.length, 3);
  assert.equal((vTrack.clips[1] as unknown as { filter?: { lut?: string } }).filter?.lut, "vcut-cinematic");
  const wTrack = out.tracks.find((t) => t.id === "w")!;
  assert.equal(wTrack.clips.length, 1);
  assert.equal((wTrack.clips[0] as unknown as { filter?: { lut?: string } }).filter?.lut, undefined);
});

ok("U3 layer chuẩn cấp project áp vào lá trong nested theo track ngoài", () => {
  const nestedClip = {
    kind: "nested", id: "n1", start: 0, duration: 10, in: 0,
    tracks: [{ kind: "video", clips: [video("leaf", 0, 10)] }],
  };
  const withScope = (tracks: number[] | undefined) => {
    const spec = spec3(vidTrack("v", [nestedClip]), vidTrack("w", [])) as unknown as {
      tracks: unknown[]; adjustmentLayers: unknown[];
    };
    spec.adjustmentLayers = [{
      id: "adj", start: 3, duration: 2,
      filters: [{ lut: "vcut-cinematic" }],
      ...(tracks === undefined ? {} : { tracks }),
    }];
    return buildPreviewSpec(spec as never);
  };
  // Không scope: áp (nested nằm trên track 0, layer xét track ngoài).
  const unscoped = withScope(undefined).tracks.find((t) => t.id === "__nested-video")!;
  assert.equal(unscoped.clips.length, 3);
  assert.equal((unscoped.clips[1] as unknown as { filter?: { lut?: string } }).filter?.lut, "vcut-cinematic");
  // Scope [0]: nested nằm trên track ngoài 0 → áp.
  const scopedIn = withScope([0]).tracks.find((t) => t.id === "__nested-video")!;
  assert.equal(scopedIn.clips.length, 3);
  // Scope [1]: nested nằm trên track ngoài 0 → không áp.
  const scopedOut = withScope([1]).tracks.find((t) => t.id === "__nested-video")!;
  assert.equal(scopedOut.clips.length, 1);
  assert.equal((scopedOut.clips[0] as unknown as { filter?: { lut?: string } }).filter?.lut, undefined);
});

ok("U3 layer legacy trong nested chỉ áp lá cùng track host, không áp clip ngoài", () => {
  const nestedClip = {
    kind: "nested", id: "n1", start: 0, duration: 10, in: 0,
    tracks: [
      { kind: "video", clips: [video("leafLow", 0, 10)] },
      // Layer host trên track 1 của subSpec (cùng track với leafMid).
      { kind: "video", clips: [
        video("leafMid", 0, 10),
        { kind: "adjustment", id: "adj", start: 3, duration: 2, filter: { lut: "vcut-cinematic" } },
      ] },
      { kind: "video", clips: [video("leafHigh", 0, 10)] },
    ],
  };
  const out = buildPreviewSpec(spec3(
    vidTrack("v", [video("plain", 0, 10)]),
    vidTrack("n", [nestedClip]),
  ));
  const plain = out.tracks.find((t) => t.id === "v")!;
  assert.equal(plain.clips.length, 1); // clip ngoài không chịu layer trong nested
  const nested = out.tracks.find((t) => t.id === "__nested-video")!;
  const low = nested.clips.filter((c) => c.id === "leafLow");
  const mid = nested.clips.filter((c) => c.id === "leafMid");
  const high = nested.clips.filter((c) => c.id === "leafHigh");
  assert.equal(low.length, 1); // khác track host → không chịu layer
  assert.equal(mid.length, 3);
  assert.equal((mid[1] as unknown as { filter?: { lut?: string } }).filter?.lut, "vcut-cinematic");
  assert.equal(high.length, 1); // khác track host → không chịu layer
});

ok("U3 layer trong nested ngoài áp vào lá trong nested con theo scope", () => {
  const inner = {
    kind: "nested", id: "inner", start: 0, duration: 10, in: 0,
    tracks: [{ kind: "video", clips: [video("deepLeaf", 0, 10)] }],
  };
  const outerWith = (hostTrack: number) => {
    // Layer host trên track `hostTrack` của subSpec ngoài; nested con
    // nằm trên track 0 của subSpec ngoài → chỉ hostTrack 0 mới áp.
    const tracks: unknown[] = [
      { kind: "video", clips: [inner] },
      { kind: "video", clips: [] },
    ];
    (tracks[hostTrack] as { clips: unknown[] }).clips.push(
      { kind: "adjustment", id: "adj", start: 3, duration: 2, filter: { lut: "vcut-cinematic" } },
    );
    return {
      kind: "nested", id: "outer", start: 0, duration: 10, in: 0, tracks,
    };
  };
  const outIn = buildPreviewSpec(spec3(vidTrack("v", [outerWith(0)]), vidTrack("w", [])));
  const leafIn = outIn.tracks.find((t) => t.id === "__nested-video")!.clips.filter((c) => c.id === "deepLeaf");
  assert.equal(leafIn.length, 3);
  assert.equal((leafIn[1] as unknown as { filter?: { lut?: string } }).filter?.lut, "vcut-cinematic");
  const outOut = buildPreviewSpec(spec3(vidTrack("v", [outerWith(1)]), vidTrack("w", [])));
  const leafOut = outOut.tracks.find((t) => t.id === "__nested-video")!.clips.filter((c) => c.id === "deepLeaf");
  assert.equal(leafOut.length, 1);
  // Track adjustment chuyên biệt trong nested ngoài: không scope → áp
  // vào lá trong nested con (nhưng không áp clip ngoài).
  const outerAdjTrack = {
    kind: "nested", id: "outer", start: 0, duration: 10, in: 0,
    tracks: [
      { kind: "video", clips: [inner] },
      adjTrack("adj", 3, 2, "vcut-cinematic"),
    ],
  };
  const outAdj = buildPreviewSpec(spec3(
    vidTrack("v", [video("plain", 0, 10)]),
    vidTrack("n", [outerAdjTrack]),
  ));
  const plain = outAdj.tracks.find((t) => t.id === "v")!;
  assert.equal(plain.clips.length, 1); // clip ngoài không chịu layer trong nested
  const leafAdj = outAdj.tracks.find((t) => t.id === "__nested-video")!.clips.filter((c) => c.id === "deepLeaf");
  assert.equal(leafAdj.length, 3);
});

ok("U3 adjustmentAppliesToClip: scope + nhánh (không còn trên/dưới)", () => {
  // Layer cấp project scope [2]: chỉ clip track ngoài 2 mới áp.
  const outer = { nestedPath: [] as string[], scopeTracks: [2] };
  assert.equal(adjustmentAppliesToClip(outer, { nestedPath: [], trackStack: [0] }), false);
  assert.equal(adjustmentAppliesToClip(outer, { nestedPath: [], trackStack: [2] }), true);
  assert.equal(adjustmentAppliesToClip(outer, { nestedPath: [], trackStack: [3] }), false);
  // Layer trong nested n1 scope [1]: xét track trong n1 (trackStack[1]).
  const inner = { nestedPath: ["n1"], scopeTracks: [1] };
  assert.equal(adjustmentAppliesToClip(inner, { nestedPath: [], trackStack: [0] }), false);
  assert.equal(adjustmentAppliesToClip(inner, { nestedPath: ["n2"], trackStack: [0, 1] }), false);
  assert.equal(adjustmentAppliesToClip(inner, { nestedPath: ["n1"], trackStack: [0, 0] }), false);
  assert.equal(adjustmentAppliesToClip(inner, { nestedPath: ["n1"], trackStack: [0, 1] }), true);
  // Layer trong nested n1 scope [1] áp cả lá trong nested con (prefix khớp,
  // trackStack[1] vẫn là track trong n1).
  assert.equal(adjustmentAppliesToClip(inner, { nestedPath: ["n1", "n2"], trackStack: [0, 1, 0] }), true);
  // Layer không scope: áp mọi clip cùng nhánh (default chuẩn).
  assert.equal(adjustmentAppliesToClip({ nestedPath: [] }, { nestedPath: [], trackStack: [5] }), true);
  assert.equal(adjustmentAppliesToClip({ nestedPath: ["n1"] }, { nestedPath: ["n1"], trackStack: [0, 9] }), true);
  // Field R4 cũ (trackStack trên layer) không còn được đọc nữa.
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [], trackStack: [2] }, { nestedPath: [], trackStack: [0] }),
    true,
  );
});

ok("R4 applyAdjustmentPreview không scope giữ hành vi cũ (tương thích ngược)", () => {
  const f = applyAdjustmentPreview(
    {},
    [{ id: "low", start: 0, duration: 10, filter: { lut: "vcut-cinematic" }, trackStack: [0], nestedPath: [] }],
    5,
  );
  assert.equal(f.adjustmentActive, true);
  assert.deepEqual(f.lutChain, ["vcut-cinematic"]);
});

console.log("== nestedPreview U3: chuỗi LUT (thứ tự mảng) ==");
ok("U3 clip LUT + 1 layer LUT → chuỗi [clip, layer], lut đơn = cuối chuỗi", () => {
  const f = applyAdjustmentPreview(
    { filter: { lut: "vcut-vintage-fade" } },
    [{ id: "adj", start: 0, duration: 10, filter: { lut: "vcut-cinematic" }, scopeTracks: [0], nestedPath: [] }],
    5,
    { nestedPath: [], trackStack: [0] },
  );
  assert.deepEqual(f.lutChain, ["vcut-vintage-fade", "vcut-cinematic"]);
  assert.equal(f.lut, "vcut-cinematic");
});

ok("U3 clip LUT + 2 layer → chuỗi 3 đúng thứ tự mảng (khớp render)", () => {
  const f = applyAdjustmentPreview(
    { filter: { lut: "vcut-vintage-fade" } },
    [
      { id: "low", start: 0, duration: 10, filter: { lut: "vcut-cinematic" }, scopeTracks: [0], nestedPath: [] },
      { id: "high", start: 0, duration: 10, filter: { lut: "vcut-noir-contrast" }, scopeTracks: [0], nestedPath: [] },
    ],
    5,
    { nestedPath: [], trackStack: [0] },
  );
  assert.deepEqual(f.lutChain, ["vcut-vintage-fade", "vcut-cinematic", "vcut-noir-contrast"]);
  assert.equal(f.lut, "vcut-noir-contrast");
});

ok("U3 layer chỉ chỉnh color (không LUT) không phá chuỗi", () => {
  const f = applyAdjustmentPreview(
    { filter: { lut: "vcut-vintage-fade" } },
    [{ id: "adj", start: 0, duration: 10, filter: { color: { brightness: 10 } }, scopeTracks: [0], nestedPath: [] }],
    5,
    { nestedPath: [], trackStack: [0] },
  );
  assert.deepEqual(f.lutChain, ["vcut-vintage-fade"]);
  assert.equal(f.lut, "vcut-vintage-fade");
});

ok("U3 không có LUT nào → chuỗi rỗng, lut null", () => {
  const f = applyAdjustmentPreview(
    {},
    [{ id: "adj", start: 0, duration: 10, filter: { color: { brightness: 10 } }, scopeTracks: [0], nestedPath: [] }],
    5,
    { nestedPath: [], trackStack: [0] },
  );
  assert.deepEqual(f.lutChain, []);
  assert.equal(f.lut, null);
});

ok("U3 layer ngoài scope clip bị lọc khỏi chuỗi LUT", () => {
  const f = applyAdjustmentPreview(
    { filter: { lut: "vcut-vintage-fade" } },
    [
      { id: "low", start: 0, duration: 10, filter: { lut: "vcut-cinematic" }, scopeTracks: [0], nestedPath: [] },
      { id: "high", start: 0, duration: 10, filter: { lut: "vcut-noir-contrast" }, scopeTracks: [1], nestedPath: [] },
    ],
    5,
    { nestedPath: [], trackStack: [1] },
  );
  assert.deepEqual(f.lutChain, ["vcut-vintage-fade", "vcut-noir-contrast"]);
});

ok("R4 buildPreviewSpec: đoạn giữa mang đủ chuỗi LUT, đoạn ngoài không, spec gốc không đổi", () => {
  const spec = spec3(
    vidTrack("v", [video("a", 0, 10, { filter: { lut: "vcut-vintage-fade" } })]),
    adjTrack("adj", 3, 2, "vcut-cinematic"),
  );
  const out = buildPreviewSpec(spec);
  const vTrack = out.tracks.find((t) => t.id === "v")!;
  assert.equal(vTrack.clips.length, 3);
  const mid = vTrack.clips[1] as unknown as { filter?: { lut?: string; lutChain?: string[] } };
  assert.deepEqual(mid.filter?.lutChain, ["vcut-vintage-fade", "vcut-cinematic"]);
  assert.equal(mid.filter?.lut, "vcut-cinematic");
  const first = vTrack.clips[0] as unknown as { filter?: { lutChain?: string[] } };
  assert.equal(first.filter?.lutChain, undefined);
  const orig = (spec as unknown as { tracks: Array<{ clips: Array<{ filter?: unknown }> }> }).tracks[0].clips[0];
  assert.deepEqual(orig.filter, { lut: "vcut-vintage-fade" });
});

console.log("== nestedPreview U3: effect preview bỏ qua (đồng bộ P3 đợt 11) ==");
ok("P3 8 effect canvas KHÔNG còn bị ghi skipped (vẽ thật bằng effectCanvas)", () => {
  const canvas = ["sharpen", "noise", "glitch", "rgb-shift", "shake", "pixelate", "mirror", "edgedetect"];
  for (const type of canvas) {
    const f = applyAdjustmentPreview(
      {},
      [{ id: "adj", start: 0, duration: 10, effects: [{ type }], scopeTracks: [0], nestedPath: [] }],
      5,
      { nestedPath: [], trackStack: [0] },
    );
    assert.deepEqual(f.skippedEffects, [], `effect canvas ${type} không được báo skipped`);
    assert.deepEqual(f.skippedReasons, []);
    assert.ok(f.effects.some((e) => e.type === type));
  }
  // Tập tĩnh "thật sự chưa có đường vẽ" hiện rỗng: không còn type chuẩn
  // nào bị skip; lý do cũ R4 cho sharpen/mirror đã bị xóa (không còn
  // claim "không có CSS filter tương đương" cho thứ đã vẽ được).
  assert.equal(skippedEffectReason("sharpen"), "type chưa biết, không có đường vẽ trong preview");
});

ok("R4 effect type lạ → bỏ qua với lý do 'chưa biết'", () => {
  const f = applyAdjustmentPreview(
    {},
    [{ id: "adj", start: 0, duration: 10, effects: [{ type: "hologram" }], scopeTracks: [0], nestedPath: [] }],
    5,
    { nestedPath: [], trackStack: [0] },
  );
  assert.deepEqual(f.skippedEffects, ["hologram"]);
  assert.ok(f.skippedReasons[0].includes("chưa biết"));
});

ok("R4 8 effect vẽ được không bị ghi skipped", () => {
  const supported = ["blur", "grayscale", "sepia", "vignette", "brightness", "invert", "hue-rotate", "old-film"];
  const f = applyAdjustmentPreview(
    {},
    [{ id: "adj", start: 0, duration: 10, effects: supported.map((type) => ({ type })), scopeTracks: [0], nestedPath: [] }],
    5,
    { nestedPath: [], trackStack: [0] },
  );
  assert.deepEqual(f.skippedEffects, []);
  assert.deepEqual(f.skippedReasons, []);
  assert.equal(f.effects.length, 8);
});

console.log("== nestedPreview P3 (đợt 11): adjustment → effectCanvas ==");
ok("P3 adjustment layer gộp effect canvas vào clip video, tới được canvasEffectOps", () => {
  const spec = {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [
      { id: "v", kind: "video", clips: [video("plain", 0, 10)] },
      { id: "a", kind: "adjustment", clips: [{ kind: "adjustment", id: "adj", start: 3, duration: 4, effects: [{ type: "mirror" }, { type: "sharpen", intensity: 0.8 }] }] },
    ],
  } as never;
  const out = buildPreviewSpec(spec);
  const track = out.tracks.find((t) => t.id === "v")!;
  assert.equal(track.clips.length, 3);
  const mid = track.clips[1] as unknown as { effects?: Array<{ type: string }> };
  assert.deepEqual((mid.effects ?? []).map((e) => e.type), ["mirror", "sharpen"]);
  // Đường vẽ video trong preview.tsx: drawVideoClip đọc clip.effects qua
  // canvasEffectOps → effectCanvasSource → applyCanvasEffects. Ops phải
  // chứa đúng 2 type (không bị lọc bỏ như đường CSS cũ).
  assert.deepEqual(canvasEffectOps(mid.effects, 1).map((o) => o.type), ["mirror", "sharpen"]);
  // Đoạn ngoài layer không mang effect adjustment.
  const first = track.clips[0] as unknown as { effects?: unknown };
  assert.equal(first.effects, undefined);
});

ok("P3 clip lá trong nested + adjustment ngoài cũng tới được canvasEffectOps", () => {
  const spec = {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [
      { id: "n", kind: "video", clips: [{
        kind: "nested", id: "n1", start: 0, duration: 10, in: 0,
        tracks: [{ kind: "video", clips: [video("leaf", 0, 10)] }],
      }] },
      { id: "a", kind: "adjustment", clips: [{ kind: "adjustment", id: "adj", start: 2, duration: 4, effects: [{ type: "mirror" }] }] },
    ],
  } as never;
  const out = buildPreviewSpec(spec);
  const nestedTrack = out.tracks.find((t) => t.id === "__nested-video")!;
  assert.equal(nestedTrack.clips.length, 3);
  const mid = nestedTrack.clips[1] as unknown as { effects?: Array<{ type: string }> };
  assert.deepEqual((mid.effects ?? []).map((e) => e.type), ["mirror"]);
  assert.deepEqual(canvasEffectOps(mid.effects, 1).map((o) => o.type), ["mirror"]);
});

ok("P3 effect bỏ qua từ layer vẫn nằm trong merged effects (để draw path cảnh báo)", () => {
  // Dùng type lạ thật sự bị skip (hologram) thay cho sharpen cũ: sharpen
  // nay đã vẽ được bằng canvas nên không còn minh họa được tính chất này.
  const f = applyAdjustmentPreview(
    {},
    [{ id: "adj", start: 0, duration: 10, effects: [{ type: "hologram", intensity: 0.8 }], scopeTracks: [0], nestedPath: [] }],
    5,
    { nestedPath: [], trackStack: [0] },
  );
  assert.ok(f.effects.some((e) => e.type === "hologram"));
  assert.deepEqual(f.skippedEffects, ["hologram"]);
});

console.log("== nestedPreview U3: normalize nested (subSpec/trim) + layer trong subSpec ==");
ok("U3 normalize: hình cũ tracks trực tiếp giữ nguyên, không trimOut, không subSpec layer", () => {
  const n = normalizeNestedClip({
    kind: "nested", id: "n1", start: 10, duration: 5, in: 2, speed: 1,
    tracks: [{ kind: "video", clips: [video("a", 0, 5)] }],
  });
  assert.equal(n.in, 2);
  assert.equal(n.trimOut, undefined);
  assert.equal(n.subSpecLayers, undefined);
  assert.equal(n.tracks.length, 1);
});

ok("U3 normalize: hình chuẩn subSpec + trim lấy tracks/layer từ subSpec", () => {
  const n = normalizeNestedClip({
    kind: "nested", id: "n1", start: 10, duration: 4, speed: 1,
    trim: { in: 2, out: 6 },
    subSpec: {
      tracks: [{ kind: "video", clips: [video("a", 0, 10)] }],
      adjustmentLayers: [{ id: "adj", start: 1, duration: 2, filters: [{ lut: "vcut-cinematic" }] }],
    },
  });
  assert.equal(n.in, 2);
  assert.equal(n.trimOut, 6);
  assert.equal(n.tracks.length, 1);
  assert.equal(n.subSpecLayers!.length, 1);
  assert.equal(n.subSpecLayers![0].id, "adj");
});

ok("U3 normalize: tracks cũ khớp subSpec thì dùng subSpec (kèm layer)", () => {
  const tracks = [{ kind: "video", clips: [video("a", 0, 5)] }];
  const n = normalizeNestedClip({
    kind: "nested", id: "n1", start: 0, duration: 5, in: 0,
    tracks,
    subSpec: {
      tracks,
      adjustmentLayers: [{ id: "adj", start: 0, duration: 5, filters: [{ color: { brightness: 5 } }] }],
    },
  });
  assert.equal(n.subSpecLayers!.length, 1);
});

ok("U3 normalize: tracks cũ khác subSpec thì throw (fail fast)", () => {
  assert.throws(() => normalizeNestedClip({
    kind: "nested", id: "n1", start: 0, duration: 5, in: 0,
    tracks: [{ kind: "video", clips: [video("a", 0, 5)] }],
    subSpec: { tracks: [{ kind: "video", clips: [video("b", 0, 5)] }] },
  }), /khác nhau/);
});

ok("U3 normalize: trim.in khác in cũ thì throw; duration lệch trim thì throw", () => {
  assert.throws(() => normalizeNestedClip({
    kind: "nested", id: "n1", start: 0, duration: 4, in: 1, speed: 1,
    trim: { in: 2, out: 6 },
    subSpec: { tracks: [] },
  }), /mâu thuẫn/);
  assert.throws(() => normalizeNestedClip({
    kind: "nested", id: "n1", start: 0, duration: 5, speed: 1,
    trim: { in: 2, out: 6 },
    subSpec: { tracks: [] },
  }), /không khớp/);
  // Không có nested nào thì throw (không có gì để phẳng).
  assert.throws(() => normalizeNestedClip({
    kind: "nested", id: "n1", start: 0, duration: 5,
  }), /không có/);
});

ok("U3 nested chuẩn subSpec + trim: lá phẳng đúng offset, trim kẹp cửa sổ", () => {
  const r = flattenForPreview({
    tracks: [{ kind: "video", clips: [{
      kind: "nested", id: "n1", start: 10, duration: 4, speed: 1,
      trim: { in: 2, out: 6 },
      subSpec: { tracks: [
        { kind: "video", clips: [video("inside", 3, 2)] },
        // outside [0,2) chạm biên trim.in đúng điểm → không hiện.
        { kind: "video", clips: [video("outside", 0, 2)] },
        // tail [5,9) chỉ chồng [5,6) với trim → còn 1s.
        { kind: "video", clips: [video("tail", 5, 4)] },
      ] },
    }] }],
  });
  assert.equal(r.clips.length, 2);
  const inside = r.clips.find((c) => c.sourceId === "inside")!;
  assert.equal(inside.outerStart, 11); // 10 + (3 - 2)
  assert.equal(inside.outerDuration, 2);
  const tail = r.clips.find((c) => c.sourceId === "tail")!;
  assert.equal(tail.outerStart, 13); // 10 + (5 - 2)
  assert.equal(tail.outerDuration, 1);
});

ok("U3 nested chuẩn subSpec + trim + speed: ánh xạ đúng tốc độ", () => {
  const r = flattenForPreview({
    tracks: [{ kind: "video", clips: [{
      kind: "nested", id: "n1", start: 20, duration: 4, speed: 2,
      trim: { in: 0, out: 8 },
      subSpec: { tracks: [{ kind: "video", clips: [video("leaf", 2, 4)] }] },
    }] }],
  });
  assert.equal(r.clips.length, 1);
  assert.equal(r.clips[0].outerStart, 21); // 20 + 2/2
  assert.equal(r.clips[0].outerDuration, 2); // 4/2
});

ok("U3 layer trong subSpec giữ lại qua flatten, offset đúng, scope theo track subSpec", () => {
  const spec = spec3(
    vidTrack("v", [video("plain", 0, 20)]),
    vidTrack("n", [{
      kind: "nested", id: "n1", start: 10, duration: 10, in: 0,
      subSpec: {
        tracks: [
          { kind: "video", clips: [video("leafA", 0, 10)] },
          { kind: "video", clips: [video("leafB", 0, 10)] },
        ],
        // Layer scope = track 1 của subSpec → chỉ leafB chịu.
        adjustmentLayers: [{ id: "adj", start: 1, duration: 2, tracks: [1], filters: [{ lut: "vcut-cinematic" }] }],
      },
    }]),
  );
  const out = buildPreviewSpec(spec);
  const nested = out.tracks.find((t) => t.id === "__nested-video")!;
  const a = nested.clips.filter((c) => c.id === "leafA");
  const b = nested.clips.filter((c) => c.id === "leafB");
  assert.equal(a.length, 1); // ngoài scope subSpec → không cắt
  assert.equal(b.length, 3); // layer subSpec [1,3) → ngoài [11,13)
  assert.deepEqual(b.map((c) => [c.start, c.duration]), [[10, 1], [11, 2], [13, 7]]);
  assert.equal((b[1] as unknown as { filter?: { lut?: string } }).filter?.lut, "vcut-cinematic");
  // Clip ngoài không chịu layer trong subSpec.
  const plain = out.tracks.find((t) => t.id === "v")!;
  assert.equal(plain.clips.length, 1);
});

ok("U3 layer trong subSpec ngoài cửa sổ thấy thì không áp, không crash", () => {
  const spec = spec3(vidTrack("n", [{
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    subSpec: {
      tracks: [{ kind: "video", clips: [video("leaf", 0, 10)] }],
      adjustmentLayers: [{ id: "adj", start: 8, duration: 2, filters: [{ lut: "vcut-cinematic" }] }],
    },
  }]), vidTrack("w", []));
  const out = buildPreviewSpec(spec);
  const nested = out.tracks.find((t) => t.id === "__nested-video")!;
  assert.equal(nested.clips.length, 1);
  assert.equal((nested.clips[0] as unknown as { filter?: { lut?: string } }).filter?.lut, undefined);
});

ok("U3 layer chuẩn cấp project: nhiều entry filters nối LUT + cộng color đúng thứ tự", () => {
  const spec = spec3(vidTrack("v", [video("a", 0, 10)]), vidTrack("w", [])) as unknown as {
    tracks: unknown[]; adjustmentLayers: unknown[];
  };
  spec.adjustmentLayers = [{
    id: "adj", start: 3, duration: 2,
    filters: [
      { lut: "vcut-cinematic", color: { brightness: 10 } },
      { lut: "vcut-noir-contrast", color: { brightness: 20 } },
    ],
  }];
  const out = buildPreviewSpec(spec as never);
  const vTrack = out.tracks.find((t) => t.id === "v")!;
  assert.equal(vTrack.clips.length, 3);
  const mid = vTrack.clips[1] as unknown as { filter?: { lut?: string; lutChain?: string[]; color?: { brightness?: number } } };
  assert.deepEqual(mid.filter?.lutChain, ["vcut-cinematic", "vcut-noir-contrast"]);
  assert.equal(mid.filter?.lut, "vcut-noir-contrast");
  assert.equal(mid.filter?.color?.brightness, 30);
  // Spec đầu ra không còn adjustmentLayers (đã gộp, tránh double-apply).
  assert.equal("adjustmentLayers" in (out as unknown as Record<string, unknown>), false);
});

ok("U3 layer chuẩn cấp project: thứ tự mảng = thứ tự áp, effect sau ghi đè effect trước", () => {
  const spec = spec3(vidTrack("v", [video("a", 0, 10)]), vidTrack("w", [])) as unknown as {
    tracks: unknown[]; adjustmentLayers: unknown[];
  };
  spec.adjustmentLayers = [
    { id: "l1", start: 0, duration: 10, filters: [{ lut: "vcut-cinematic", effects: [{ type: "blur", intensity: 0.5 }] }] },
    { id: "l2", start: 0, duration: 10, filters: [{ lut: "vcut-noir-contrast", effects: [{ type: "blur", intensity: 0.9 }] }] },
  ];
  const out = buildPreviewSpec(spec as never);
  const mid = out.tracks.find((t) => t.id === "v")!.clips[0] as unknown as {
    filter?: { lutChain?: string[] }; effects?: Array<{ type: string; intensity?: number }>;
  };
  assert.deepEqual(mid.filter?.lutChain, ["vcut-cinematic", "vcut-noir-contrast"]);
  const blur = mid.effects!.find((e) => e.type === "blur")!;
  assert.equal(blur.intensity, 0.9); // layer sau (mảng) ghi đè
});

ok("U3 layer chuẩn: scope rác / layer rỗng thì throw (fail fast)", () => {
  assert.throws(() => convertCanonicalLayer(
    { id: "bad", start: 0, duration: 5, tracks: [-1], filters: [{ lut: "vcut-cinematic" }] },
    "test",
  ), /chỉ số không hợp lệ/);
  assert.throws(() => convertCanonicalLayer(
    { id: "empty", start: 0, duration: 5, filters: [] },
    "test",
  ), /rỗng/);
  assert.throws(() => buildPreviewSpec({
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [{ id: "v", kind: "video", clips: [video("a", 0, 10)] }],
    adjustmentLayers: [{ id: "bad", start: 0, duration: 5, tracks: [1.5], filters: [{ lut: "vcut-cinematic" }] }],
  } as never), /chỉ số không hợp lệ/);
});

ok("U3 hasNestedOrAdjustment nhận cả spec chỉ có adjustmentLayers", () => {
  assert.equal(hasNestedOrAdjustment({
    tracks: [{ kind: "video", clips: [video("a", 0, 5)] }],
    adjustmentLayers: [{ id: "adj", start: 0, duration: 5, filters: [{ lut: "vcut-cinematic" }] }],
  }), true);
  assert.equal(hasNestedOrAdjustment({
    tracks: [{ kind: "video", clips: [video("a", 0, 5)] }],
    adjustmentLayers: [],
  }), false);
});

console.log(`\n${pass} test passed`);
