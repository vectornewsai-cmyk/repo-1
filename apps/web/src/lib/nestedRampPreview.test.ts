// nestedRampPreview.test.ts — Phase 9 đợt 19 G1: preview parity cho
// nested speedKeyframes (mirror render đợt 18).
// Chạy từ gốc repo (alias @repo-1/video-spec resolve qua node_modules):
//   node --experimental-strip-types apps/web/src/lib/nestedRampPreview.test.ts
// Ngữ nghĩa kiểm chứng (spec đợt 18): duration của nested có curve là
// thời gian OUTPUT; cửa sổ con [in, in + ∫curve); u(t) = in + ∫₀ᵗ s;
// τ(w) là nghiệm của ∫₀^τ s = w. Các số kỳ vọng dưới đây suy tay bằng
// công thức giải tích (linear 1→2: ∫₀ᵗ = t + t²/8; ease-in 1→2 trên
// [0,4]: ∫₀ᵗ = t + t³/48), KHÔNG lấy từ code đang test.
import assert from "node:assert/strict";
import {
  flattenForPreview,
  buildPreviewSpec,
  nestedRampTauOffset,
  resolveNestedRampCurve,
  type LeafClipInput,
} from "./nestedPreview.ts";
import { rampSourceTimeAt } from "./previewEngine.ts";
import { composeTwoLevelCurve } from "./twoLevelCurve.ts";
import type { VideoSpec } from "@repo-1/video-spec";

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
function approx(actual: number, expected: number, eps = 1e-3, what = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${what} kỳ vọng ${expected}, nhận ${actual} (sai ${Math.abs(actual - expected)})`,
  );
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
const LINEAR_1_2 = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};
function nestedRamp(
  extra: Record<string, unknown>,
  inner: unknown[],
): Record<string, unknown> {
  return {
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: LINEAR_1_2,
    tracks: [{ kind: "video", clips: inner }],
    ...extra,
  };
}
function flat1(nested: Record<string, unknown>) {
  return flattenForPreview({
    tracks: [{ kind: "video", clips: [nested] }],
  });
}

console.log("== G1: nested ramp preview parity ==");
ok("τ trực tiếp: linear 1→2 cho τ(0)=0, τ(3)=2.3246, τ(6)=4", () => {
  const ramp = resolveNestedRampCurve(LINEAR_1_2, 4, "test")!;
  approx(nestedRampTauOffset(ramp, 0), 0, 1e-9, "τ(0)");
  approx(nestedRampTauOffset(ramp, 3), 2.3246, 1e-3, "τ(3)");
  approx(nestedRampTauOffset(ramp, 6), 4, 1e-3, "τ(6)");
});
ok("linear 1→2, lá đơn: start/duration qua τ, curve giữ nguyên, source khớp u(t)", () => {
  const r = flat1(nestedRamp({}, [video("leaf", 0, 6)]));
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 4, 1e-9, "outerDuration");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 6);
  const kfs = (c.clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  assert.equal(kfs.length, 2);
  approx(kfs[0].v, 1, 1e-9, "slice v đầu");
  approx(kfs[1].v, 2, 1e-9, "slice v cuối");
  // previewEngine: tại timeline 12 (localT=2) nguồn = ∫₀² (1+t/4) = 2.5.
  approx(rampSourceTimeAt(c.clip as never, 12), 2.5, 1e-3, "source tại t=12");
  approx(rampSourceTimeAt(c.clip as never, 14), 6, 1e-3, "source tại t=14");
});
ok("ease-in 1→2: τ(1)≈0.9804 giải tích, slice v đầu ≈1.0601", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 1, easing: "ease-in" },
      { t: 4, v: 2, easing: "linear" },
    ],
  };
  const r = flat1({
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: curve,
    tracks: [{ kind: "video", clips: [video("leaf", 1, 3)] }],
  });
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10.9804, 1e-3, "outerStart");
  // Chú ý: τ(4) ≠ 4 — τ(4) là nghiệm của τ + τ³/48 = 4, ≈ 3.2709
  // (chỉ τ(C)=τ(5.3333) mới bằng duration 4).
  approx(c.outerDuration, 2.2905, 1e-3, "outerDuration");
  const kfs = (c.clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  approx(kfs[0].v, 1.0601, 1e-3, "slice v đầu");
});
ok("nested có trim: cửa sổ [in, in+∫), lá cắt trái dời in/out đúng", () => {
  const r = flat1(nestedRamp(
    { start: 0, in: 2, trim: { in: 2, out: 8 } },
    [video("a", 0, 10), video("b", 0, 3)],
  ));
  assert.equal(r.clips.length, 2);
  const a = r.clips.find((c) => c.sourceId === "a")!;
  approx(a.outerStart, 0, 1e-9, "a start");
  approx(a.outerDuration, 4, 1e-9, "a duration");
  assert.equal(a.clip.in, 2);
  assert.equal(a.clip.out, 8);
  const b = r.clips.find((c) => c.sourceId === "b")!;
  approx(b.outerStart, 0, 1e-9, "b start");
  approx(b.outerDuration, 0.8990, 1e-3, "b duration τ(1)");
  assert.equal(b.clip.in, 2);
  assert.equal(b.clip.out, 3);
});
ok("hai lá slice: biên tại τ(3)=2.3246 (khớp render đợt 18 R2), lá B mang slice", () => {
  const r = flat1(nestedRamp({}, [video("A", 0, 3), video("B", 3, 3)]));
  assert.equal(r.clips.length, 2);
  const A = r.clips.find((c) => c.sourceId === "A")!;
  const B = r.clips.find((c) => c.sourceId === "B")!;
  approx(A.outerStart, 10, 1e-9, "A start");
  approx(A.outerDuration, 2.3246, 1e-3, "A duration");
  approx(B.outerStart, 12.3246, 1e-3, "B start");
  approx(B.outerDuration, 1.6754, 1e-3, "B duration");
  assert.equal(B.clip.in, 0);
  assert.equal(B.clip.out, 3);
  const kfs = (B.clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  approx(kfs[0].v, 1.5811, 1e-3, "B slice v đầu");
  approx(kfs[kfs.length - 1].v, 2, 1e-3, "B slice v cuối");
});
ok("lá tốc độ hằng c=2: curve slice nhân 2, out capped ở out gốc", () => {
  const r = flat1(nestedRamp({}, [video("leaf", 0, 3, { speed: 2, out: 6 })]));
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerDuration, 2.3246, 1e-3, "duration");
  const kfs = (c.clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  approx(kfs[0].v, 2, 1e-9, "v đầu ×2");
  approx(kfs[kfs.length - 1].v, 3.1623, 1e-3, "v cuối ×2");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 6);
  assert.equal((c.clip as Record<string, unknown>)["speed"], undefined);
});
ok("lá text dưới ramp: chỉ đổi start/duration qua τ, không mang curve", () => {
  const r = flat1(nestedRamp({}, [{
    kind: "text", id: "t1", start: 1, duration: 2,
  }]));
  assert.equal(r.clips.length, 1);
  approx(r.clips[0].outerStart, 10.8990, 1e-3, "text start");
  approx(r.clips[0].outerDuration, 1.4256, 1e-3, "text duration");
  assert.equal((r.clips[0].clip as Record<string, unknown>)["speedKeyframes"], undefined);
});
ok("adjustment trong nested ramp: start/duration qua τ", () => {
  const r = flat1({
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: LINEAR_1_2,
    tracks: [
      { kind: "video", clips: [video("leaf", 0, 6)] },
      { kind: "adjustment", clips: [{ kind: "adjustment", id: "adj", start: 1, duration: 3 }] },
    ],
  });
  assert.equal(r.adjustments.length, 1);
  approx(r.adjustments[0].start, 10.8990, 1e-3, "adj start");
  // τ(4) linear = nghiệm t + t²/8 = 4 ≈ 2.9282 (không phải 4);
  // duration = τ(4) − τ(1) ≈ 2.0292.
  approx(r.adjustments[0].duration, 2.0292, 1e-3, "adj duration");
});
ok("ramp trong nested tốc độ hằng: τ hợp thành với map tuyến tính cha", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "outer", start: 0, duration: 10, in: 0, speed: 2,
        tracks: [{
          kind: "video",
          clips: [nestedRamp({ start: 4, id: "inner" }, [video("leaf", 0, 6)])],
        }],
      }],
    }],
  });
  assert.equal(r.clips.length, 1);
  approx(r.clips[0].outerStart, 2, 1e-9, "leaf start (4+0)/2");
  approx(r.clips[0].outerDuration, 2, 1e-9, "leaf duration (4+4)/2−2");
});
ok("curve hằng gộp về tốc độ hằng: lá co đúng 1/2, không mang speedKeyframes", () => {
  const r = flat1({
    kind: "nested", id: "n1", start: 0, duration: 4, in: 0,
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 2, easing: "linear" },
        { t: 4, v: 2, easing: "bezier", bezier: [0.1, 2, 0.9, -1] },
      ],
    },
    tracks: [{ kind: "video", clips: [video("leaf", 4, 4)] }],
  });
  assert.equal(r.clips.length, 1);
  approx(r.clips[0].outerStart, 2, 1e-9, "start 4/2");
  approx(r.clips[0].outerDuration, 2, 1e-9, "duration 4/2");
  assert.equal((r.clips[0].clip as Record<string, unknown>)["speedKeyframes"], undefined);
});
ok("buildPreviewSpec: lá ramp bị adjustment cắt thành đoạn, mỗi đoạn mang slice + in theo ∫", () => {
  const spec = {
    tracks: [{
      id: "v0", kind: "video",
      clips: [nestedRamp({}, [video("leaf", 0, 6, { out: 6 })])],
    }],
    adjustmentLayers: [{ id: "adj1", start: 11, duration: 2, filters: [{ color: { brightness: 10 } }] }],
  } as unknown as VideoSpec;
  const out = buildPreviewSpec(spec);
  const track = (out.tracks as unknown as Array<{ id: string; clips: Array<Record<string, unknown>> }>)
    .find((t) => t.id === "__nested-video");
  assert.ok(track, "có track __nested-video");
  const segs = [...track.clips].sort((a, b) => (a["start"] as number) - (b["start"] as number));
  assert.equal(segs.length, 3);
  approx(segs[0]["start"] as number, 10, 1e-9, "seg1 start");
  approx(segs[0]["duration"] as number, 1, 1e-9, "seg1 duration");
  approx(segs[1]["in"] as number, 1.125, 1e-3, "seg2 in = ∫₀¹");
  approx(segs[2]["in"] as number, 4.125, 1e-3, "seg3 in = ∫₀³");
  const kfs2 = (segs[1]["speedKeyframes"] as { keyframes: Array<{ t: number; v: number }> }).keyframes;
  approx(kfs2[0].v, 1.25, 1e-9, "seg2 slice v đầu");
});
function audio(
  id: string,
  start: number,
  duration: number,
  extra: Record<string, unknown> = {},
): LeafClipInput {
  return {
    kind: "audio", id, start, duration, in: 0, out: duration, ...extra,
  } as LeafClipInput;
}
function nestedWith(
  curve: Record<string, unknown>,
  extra: Record<string, unknown>,
  inner: unknown[],
): Record<string, unknown> {
  return {
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: curve,
    tracks: [{ kind: "video", clips: inner }],
    ...extra,
  };
}
function opKeyframes(clip: LeafClipInput): Array<{ t: number; v: number }> {
  const a = (clip as unknown as { animations?: { opacity?: { keyframes: Array<{ t: number; v: number }> } } }).animations;
  assert.ok(a?.opacity, "lá phải có opacity keyframes");
  return a.opacity.keyframes;
}
ok("bezier [0,0,1,1] đồng nhất linear: τ(3)=2.3246 như linear 1→2", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 1, easing: "bezier", bezier: [0, 0, 1, 1] },
      { t: 4, v: 2, easing: "linear" },
    ],
  };
  const r = flat1(nestedWith(curve, {}, [video("leaf", 0, 3)]));
  assert.equal(r.clips.length, 1);
  approx(r.clips[0].outerDuration, 2.3246, 1e-3, "duration τ(3)");
  const kfs = (r.clips[0].clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  approx(kfs[0].v, 1, 1e-9, "slice v đầu");
  approx(kfs[kfs.length - 1].v, 1.5811, 1e-3, "slice v cuối");
});
ok("bezier CSS ease: τ khớp render worker (crosscheck /tmp, diff 0)", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
      { t: 4, v: 2, easing: "linear" },
    ],
  };
  const r = flat1(nestedWith(curve, {}, [video("leaf", 1, 3)]));
  assert.equal(r.clips.length, 1);
  approx(r.clips[0].outerStart, 10.8830, 1e-3, "start τ(1)");
  approx(r.clips[0].outerDuration, 1.7631, 1e-3, "duration τ(4)−τ(1)");
});
ok("ease-out 1→2 giải tích: τ(3)=2.0946, slice v cuối 1.7731", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 1, easing: "ease-out" },
      { t: 4, v: 2, easing: "linear" },
    ],
  };
  const r = flat1(nestedWith(curve, {}, [video("leaf", 0, 3)]));
  assert.equal(r.clips.length, 1);
  approx(r.clips[0].outerDuration, 2.0946, 1e-3, "duration τ(3)");
  const kfs = (r.clips[0].clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  approx(kfs[0].v, 1, 1e-9, "slice v đầu");
  approx(kfs[kfs.length - 1].v, 1.7731, 1e-3, "slice v cuối");
});
ok("tốc độ biên 0.25→4: τ(3)=2.2772, slice v 0.25→2.3849, cửa sổ đủ dài 4s", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 0.25, easing: "linear" },
      { t: 4, v: 4, easing: "linear" },
    ],
  };
  const r = flat1(nestedWith(curve, {}, [video("leaf", 0, 3)]));
  assert.equal(r.clips.length, 1);
  approx(r.clips[0].outerDuration, 2.2772, 1e-3, "duration τ(3)");
  const kfs = (r.clips[0].clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  approx(kfs[0].v, 0.25, 1e-9, "slice v đầu = biên 0.25");
  approx(kfs[kfs.length - 1].v, 2.3849, 1e-3, "slice v cuối");
  const r2 = flat1(nestedWith(curve, {}, [video("full", 0, 8.5)]));
  assert.equal(r2.clips.length, 1);
  approx(r2.clips[0].outerDuration, 4, 1e-3, "lá phủ đủ C=8.5 → duration 4");
});
ok("R3(a) fade biên dưới ramp: fadeIn 1s con → 0.7579s output, lá dịch đúng τ", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [nestedRamp({}, [
        video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
        {
          kind: "nested", id: "inner", start: 2, duration: 2, in: 0,
          tracks: [{ kind: "video", clips: [video("leaf", 0, 2)] }],
        },
      ])],
    }],
  });
  const leaf = r.clips.find((c) => c.sourceId === "leaf")!;
  assert.ok(leaf, "có lá leaf");
  approx(leaf.outerStart, 10.8990, 1e-3, "lá dịch sớm: 10+τ(1)");
  approx(leaf.outerDuration, 1.4256, 1e-3, "duration τ(3)−τ(1)");
  const kf = opKeyframes(leaf.clip);
  assert.equal(kf.length, 2);
  approx(kf[0].t, 0, 1e-9, "kf t đầu");
  approx(kf[0].v, 0, 1e-9, "kf v đầu");
  approx(kf[1].t, 0.7579, 1e-3, "fade duration τ(2)−τ(1)");
  approx(kf[1].v, 1, 1e-9, "kf v cuối");
  // Phía lá phẳng của cặp biên đã bị cơ chế biên tiêu thụ → strip.
  const a = r.clips.find((c) => c.sourceId === "a")!;
  assert.equal((a.clip as Record<string, unknown>)["transitionOut"], undefined, "A strip transitionOut");
});
ok("R3(a) fadeOut biên dưới ramp: lá A fade-out 0.8990→1.6569, lá B strip transitionIn", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [nestedRamp({}, [
        {
          kind: "nested", id: "inner", start: 0, duration: 2, in: 0,
          tracks: [{ kind: "video", clips: [video("leafA", 0, 2)] }],
        },
        video("b", 2, 2, { transitionIn: { type: "fade", duration: 1 } }),
      ])],
    }],
  });
  const leafA = r.clips.find((c) => c.sourceId === "leafA")!;
  const kf = opKeyframes(leafA.clip);
  assert.equal(kf.length, 2);
  approx(kf[0].t, 0.8990, 1e-3, "fade-out bắt đầu ở duration−T'");
  approx(kf[0].v, 1, 1e-9, "kf v đầu");
  approx(kf[1].t, 1.6569, 1e-3, "fade-out kết thúc ở cuối lá");
  approx(kf[1].v, 0, 1e-9, "kf v cuối");
  const b = r.clips.find((c) => c.sourceId === "b")!;
  approx(b.outerStart, 10.8990, 1e-3, "B dịch sớm: 10+τ(1)");
  assert.equal((b.clip as Record<string, unknown>)["transitionIn"], undefined, "B strip transitionIn");
});
ok("R3(a) cặp phẳng nội bộ dưới ramp: duration transition 1s con → 0.7579s output cả 2 phía", () => {
  const r = flat1(nestedRamp({}, [
    video("A", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
    video("B", 2, 2, { transitionIn: { type: "fade", duration: 1 } }),
  ]));
  assert.equal(r.clips.length, 2);
  const A = r.clips.find((c) => c.sourceId === "A")!;
  const B = r.clips.find((c) => c.sourceId === "B")!;
  approx(A.outerDuration, 1.6569, 1e-3, "A duration τ(2)");
  approx(B.outerStart, 11.6569, 1e-3, "B start 10+τ(2)");
  approx(B.outerDuration, 1.2713, 1e-3, "B duration τ(4)−τ(2)");
  approx(((A.clip as Record<string, unknown>)["transitionOut"] as { duration: number }).duration, 0.7579, 1e-3, "A transitionOut rescale");
  approx(((B.clip as Record<string, unknown>)["transitionIn"] as { duration: number }).duration, 0.7579, 1e-3, "B transitionIn rescale");
});
ok("R3(a) cặp phẳng bị cửa sổ cắt → strip cả 2 phía (render hard cut)", () => {
  const r = flat1(nestedRamp(
    { start: 0, in: 1, trim: { in: 1, out: 7 } },
    [
      video("A", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
      video("B", 2, 2, { transitionIn: { type: "fade", duration: 1 } }),
    ],
  ));
  const A = r.clips.find((c) => c.sourceId === "A")!;
  const B = r.clips.find((c) => c.sourceId === "B")!;
  assert.equal((A.clip as Record<string, unknown>)["transitionOut"], undefined, "A strip khi bị cắt trái");
  assert.equal((B.clip as Record<string, unknown>)["transitionIn"], undefined, "B strip khi cặp vỡ");
  approx(A.outerStart, 0, 1e-9, "A start τ(0)");
  approx(A.outerDuration, 0.8990, 1e-3, "A duration τ(1)");
});
ok("R3(a) đường tốc độ hằng cũng rescale: fade biên + cặp phẳng T=1 → 0.5 ở speed 2", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "outer", start: 0, duration: 4, in: 0, speed: 2,
        tracks: [{
          kind: "video",
          clips: [
            video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
            {
              kind: "nested", id: "inner", start: 2, duration: 2, in: 0,
              tracks: [{ kind: "video", clips: [video("leaf", 0, 2)] }],
            },
          ],
        }],
      }],
    }],
  });
  const leaf = r.clips.find((c) => c.sourceId === "leaf")!;
  approx(leaf.outerStart, 0.5, 1e-9, "lá dịch sớm đúng 1/2 (không phải trừ 1 sau ánh xạ)");
  approx(leaf.outerDuration, 1, 1e-9, "duration 2/2");
  const kf = opKeyframes(leaf.clip);
  approx(kf[1].t, 0.5, 1e-9, "fade duration 1/2");
  const r2 = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "outer", start: 0, duration: 4, in: 0, speed: 2,
        tracks: [{
          kind: "video",
          clips: [
            video("A", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
            video("B", 2, 2, { transitionIn: { type: "fade", duration: 1 } }),
          ],
        }],
      }],
    }],
  });
  const A = r2.clips.find((c) => c.sourceId === "A")!;
  const B = r2.clips.find((c) => c.sourceId === "B")!;
  approx(((A.clip as Record<string, unknown>)["transitionOut"] as { duration: number }).duration, 0.5, 1e-9, "A transitionOut 1/2");
  approx(((B.clip as Record<string, unknown>)["transitionIn"] as { duration: number }).duration, 0.5, 1e-9, "B transitionIn 1/2");
});
ok("R3(b) fade audio dưới ramp: cắt đo bằng thời gian output qua τ (ngoại suy biên)", () => {
  // Chú ý: phần cắt trái [0,2) nằm TRƯỚC in=2 nên τ ngoại suy tuyến tính
  // theo tốc độ biên speedAt(0)=1 (đúng render §4: τ ngoại suy chỉ dùng
  // cho fade) — cắt trái output = 2/1 = 2, KHÔNG phải τ(2)=1.6569.
  const nested = {
    kind: "nested", id: "n1", start: 0, duration: 4, in: 2,
    speedKeyframes: LINEAR_1_2,
    trim: { in: 2, out: 8 },
    tracks: [{ kind: "audio", clips: [audio("au", 0, 6, { fadeIn: 3, fadeOut: 1 })] }],
  };
  const r = flattenForPreview({ tracks: [{ kind: "audio", clips: [nested] }] });
  assert.equal(r.clips.length, 1);
  const au = r.clips[0].clip as unknown as Record<string, unknown>;
  approx(au["fadeIn"] as number, 1, 1e-9, "fadeIn 3 − 2/1");
  approx(au["fadeOut"] as number, 1, 1e-9, "fadeOut giữ (không cắt phải)");
  const nested2 = {
    kind: "nested", id: "n1", start: 0, duration: 4, in: 2,
    speedKeyframes: LINEAR_1_2,
    trim: { in: 2, out: 8 },
    tracks: [{ kind: "audio", clips: [audio("au2", 0, 6, { fadeIn: 1, fadeOut: 5 })] }],
  };
  const r2 = flattenForPreview({ tracks: [{ kind: "audio", clips: [nested2] }] });
  const au2 = r2.clips[0].clip as unknown as Record<string, unknown>;
  approx(au2["fadeIn"] as number, 0, 1e-9, "fadeIn bị cắt hết → 0 (max)");
  // Cắt phải: lá [0,10) chỉ thấy tới 8, cắt phải output = (10−8)/speedAt(4) = 1.
  const nested3 = {
    kind: "nested", id: "n1", start: 0, duration: 4, in: 2,
    speedKeyframes: LINEAR_1_2,
    trim: { in: 2, out: 8 },
    tracks: [{ kind: "audio", clips: [audio("au3", 0, 10, { fadeIn: 3, fadeOut: 3 })] }],
  };
  const r3 = flattenForPreview({ tracks: [{ kind: "audio", clips: [nested3] }] });
  assert.equal(r3.clips.length, 1);
  const au3 = r3.clips[0].clip as unknown as Record<string, unknown>;
  approx(au3["fadeIn"] as number, 1, 1e-9, "fadeIn 3 − 2/1");
  approx(au3["fadeOut"] as number, 2, 1e-9, "fadeOut 3 − 2/2");
});
ok("R3(b) fade audio đường tốc độ hằng: cắt trái 1s con → fadeIn 1 − 0.5", () => {
  const nested = {
    kind: "nested", id: "n1", start: 0, duration: 3, in: 1, speed: 2,
    trim: { in: 1, out: 7 },
    tracks: [{ kind: "audio", clips: [audio("au", 0, 4, { fadeIn: 1, fadeOut: 2 })] }],
  };
  const r = flattenForPreview({ tracks: [{ kind: "audio", clips: [nested] }] });
  assert.equal(r.clips.length, 1);
  const au = r.clips[0].clip as unknown as Record<string, unknown>;
  approx(au["fadeIn"] as number, 0.5, 1e-9, "fadeIn 1 − 1/2");
  approx(au["fadeOut"] as number, 2, 1e-9, "fadeOut giữ (lá kết thúc 4 < trim 7)");
});
ok("fail fast: lá reverse / animations dưới ramp đều throw (curve riêng nay được hợp — xem T1)", () => {
  assert.throws(() => flat1(nestedRamp({}, [video("x", 0, 3, { reverse: true })])), /reverse/);
  assert.throws(() => flat1(nestedRamp({}, [{
    kind: "video", id: "x", start: 0, duration: 3, in: 0, out: 3,
    animations: { opacity: { keyframes: [{ t: 0, v: 1 }] } },
  }])), /animations/);
});
ok("fail fast: nested reverse+ramp, trim out lệch ∫, tích v vượt khoảng (hai tầng nay thành công — xem T1)", () => {
  assert.throws(() => flat1(nestedRamp({ reverse: true }, [video("x", 0, 3)])), /reverse/);
  assert.throws(() => flat1(nestedRamp(
    { start: 0, in: 2, trim: { in: 2, out: 5 } }, [video("x", 0, 3)],
  )), /trim\.out/);
  assert.throws(() => flat1(nestedRamp({}, [video("x", 0, 3, { speed: 4 })])), /0\.25\.\.4/);
  assert.throws(() => flat1({
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: { keyframes: [{ t: 0, v: 5, easing: "linear" }] },
    tracks: [{ kind: "video", clips: [video("x", 0, 3)] }],
  }), /0\.25\.\.4/);
});
console.log("== T1 (đợt 21): preview nối hợp curve hai tầng (mirror render đợt 20 R1) ==");
// Số tay R1 case (a), cùng input với test render test_round20_two_level_render.js:
// ngoài linear 1→2 trên D=4: s_o(t) = 1 + t/4, ∫₀ᵗ = t + t²/8, C = 6.
// trong linear 1→2 trên duration con 6: s_i(x) = 1 + x/6, ∫₀ˣ = x + x²/12.
// x(t') = t' + t'²/8; src(t') = x + x²/12.
// t'=1 → x=1.125, src=1.23046875. t'=2 → x=2.5, src=3.0208333, c=2.125.
// t'=3 → x=4.125, src=5.54296875. t'=4 → x=6, src=9, c=4.
const INNER_LINEAR_1_2_6 = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 6, v: 2, easing: "linear" },
  ],
};
ok("T1(a) linear×linear: khớp số tay R1 + crosscheck render (sourceAt/speedAt)", () => {
  const r = flat1(nestedRamp({}, [video("leaf", 0, 6, { speedKeyframes: INNER_LINEAR_1_2_6, out: 9 })]));
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 4, 1e-9, "outerDuration");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 9);
  // linear×linear tái tạo ĐÚNG HỆT qua Hermite nên sai số < 1e-3 (R1 đo ~1e-15).
  approx(rampSourceTimeAt(c.clip as never, 11), 1.23046875, 1e-3, "source tại localT=1");
  approx(rampSourceTimeAt(c.clip as never, 12), 3.0208333, 1e-3, "source tại localT=2 (render R1: 3.0208333)");
  approx(rampSourceTimeAt(c.clip as never, 13), 5.54296875, 1e-3, "source tại localT=3");
  approx(rampSourceTimeAt(c.clip as never, 14), 9, 1e-3, "source tại localT=4 (render R1: 9)");
  // Tốc độ hợp tại t'=2 theo render R1 là 2.125 — đo bằng sai phân nguồn
  // (preview không expose speedAt cho clip ramp; Hermite đúng hệt nên
  // sai phân h=0.01 cho sai số ~5e-7, xem LIMITS T1).
  const fd = (rampSourceTimeAt(c.clip as never, 12.01) - rampSourceTimeAt(c.clip as never, 11.99)) / 0.02;
  approx(fd, 2.125, 1e-3, "speedAt(2) qua sai phân (render R1: 2.125)");
});
ok("T1(a2) linear×linear cắt trái THẬT: lá bắt đầu trước cửa sổ", () => {
  // Lá [−1,5) trong timeline con, cửa sổ [0,6): vs=0, ve=5, leftCut=1.
  // T_start = τ(0) = 0; T_end = τ(5) = 3.4833 (nghiệm t + t²/8 = 5).
  // in' = ∫₀¹ s_i = 1.0833333; out' = 9 (x cuối = 1 + 5 = 6 → 6 + 36/12).
  // sourceAt(t'=2): x = 1 + ∫₀² s_o = 3.5; src = 3.5 + 3.5²/12 = 4.5208333.
  const r = flat1(nestedRamp({}, [video("leaf", -1, 6, { speedKeyframes: INNER_LINEAR_1_2_6, out: 9 })]));
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 3.4833, 1e-3, "outerDuration = τ(5)");
  approx(c.clip.in as number, 1.0833333, 1e-3, "in' = ∫₀¹ s_i");
  assert.equal(c.clip.out, 9);
  approx(rampSourceTimeAt(c.clip as never, 12), 4.5208333, 1e-3, "source tại localT=2");
});
ok("T1(a3) linear×linear cắt phải: lá tràn quá cửa sổ bên phải", () => {
  // Lá [1,7) trong timeline con, cửa sổ [0,6): vs=1, ve=6, leftCut=0
  // (đoạn khả kiến bắt đầu đúng đầu lá — KHÔNG phải cắt trái).
  // T_start = τ(1) = 0.8989795; duration = 4 − 0.8989795 = 3.1010205.
  // in' = 0; out' = sourceAt(3.1010205): x = 5 → 5 + 25/12 = 7.0833333.
  // sourceAt(t'=2): x = ∫_{0.899}^{2.899} s_o = 2.9494885;
  // src = 2.9494885 + 2.9494885²/12 = 3.6744585.
  const r = flat1(nestedRamp({}, [video("leaf", 1, 6, { speedKeyframes: INNER_LINEAR_1_2_6, out: 9 })]));
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10.8989795, 1e-3, "outerStart = 10 + τ(1)");
  approx(c.outerDuration, 3.1010205, 1e-3, "outerDuration");
  assert.equal(c.clip.in, 0);
  approx(c.clip.out as number, 7.0833333, 1e-3, "out'");
  approx(rampSourceTimeAt(c.clip as never, 12.8989795), 3.6744585, 1e-3, "source tại localT=2");
});
ok("T1(b) ease-in×linear: số tay + curve mã hoá khớp hàm hợp ĐÚNG trong 5e-3", () => {
  // Ngoài ease-in 1→2 trên [0,4]: s_o(T) = 1 + (T/4)², ∫₀ᵀ = T + T³/48, C = 16/3.
  // Trong linear 1→2 trên duration con 16/3: s_i(x) = 1 + 3x/16, ∫₀ˣ = x + 3x²/32.
  // t'=2 → x = 2 + 8/48 = 2.1666667, src = 2.6067708, c = 1.25 × 1.40625 = 1.7578125.
  // t'=1 → x = 1.0208333, src = 1.1185302. t'=3 → x = 3.5625, src = 4.7523193.
  // out' = ∫₀^(16/3) s_i = 8.
  const outerEaseIn = {
    keyframes: [
      { t: 0, v: 1, easing: "ease-in" },
      { t: 4, v: 2, easing: "linear" },
    ],
  };
  const innerLin = {
    keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 16 / 3, v: 2, easing: "linear" },
    ],
  };
  const r = flat1({
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: outerEaseIn,
    tracks: [{ kind: "video", clips: [video("leaf", 0, 16 / 3, { speedKeyframes: innerLin, out: 8 })] }],
  });
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 4, 1e-9, "outerDuration");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 8);
  approx(rampSourceTimeAt(c.clip as never, 11), 1.1185302, 5e-3, "source tại localT=1");
  approx(rampSourceTimeAt(c.clip as never, 12), 2.6067708, 5e-3, "source tại localT=2");
  approx(rampSourceTimeAt(c.clip as never, 13), 4.7523193, 5e-3, "source tại localT=3");
  // Crosscheck: curve mã hoá của preview so với hàm hợp ĐÚNG (tích phân)
  // của twoLevelCurve — cùng input, lệch phải nhỏ (R1 đo sai số mã hoá
  // ease-in×bezier ~4.2e-6 tích phân; lấy ngưỡng rộng 5e-3).
  const exact = composeTwoLevelCurve({
    outerCurve: outerEaseIn,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: innerLin,
    leafStart: 0,
    leafDuration: 16 / 3,
    leafIn: 0,
    leafOut: 8,
  });
  for (const tp of [0.5, 1.5, 2.5, 3.5]) {
    approx(
      rampSourceTimeAt(c.clip as never, 10 + tp),
      exact.sourceAt(tp),
      5e-3,
      `encoded vs exact tại t'=${tp}`,
    );
  }
});
ok("T1(c) hai tầng nested đều có curve (trước đây fail-fast): khớp số render R1 (d8)", () => {
  // Trước đợt này case này throw /hai tầng/. Nay: lá phẳng [0,6) qua
  // inner linear 1→2 thành curve tổng hợp trên đoạn output [0,4) của
  // inner, rồi hợp với outer linear 1→2: duration = τ_o(4) = 2.9282032
  // (nghiệm t + t²/8 = 4), in 0, out 6 — đúng số render R1 (d8).
  // sourceAt(t'=2): x = ∫₀² s_o = 2.5 (thời gian output inner);
  // src = ∫₀^2.5 s_inner = 2.5 + 2.5²/8 = 3.28125.
  // speedAt(2) theo §2.1 đợt 20 = 1.5 × 1.625 = 2.4375 (đo bằng sai phân).
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [nestedRamp({}, [{
        kind: "nested", id: "inner", start: 0, duration: 4, in: 0,
        speedKeyframes: LINEAR_1_2,
        tracks: [{ kind: "video", clips: [video("x", 0, 6)] }],
      }])],
    }],
  });
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 2.9282032, 1e-3, "outerDuration (render R1 d8: 2.9282)");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 6);
  approx(rampSourceTimeAt(c.clip as never, 12), 3.28125, 1e-3, "source tại localT=2");
  approx(rampSourceTimeAt(c.clip as never, 12.9282032), 6, 1e-3, "source tại cuối");
  const fd = (rampSourceTimeAt(c.clip as never, 12.01) - rampSourceTimeAt(c.clip as never, 11.99)) / 0.02;
  approx(fd, 2.4375, 1e-3, "speedAt(2) qua sai phân (render §2.1: 2.4375)");
});
ok("T1(f) ba tầng ramp (outer > middle > inner > lá): τ hợp thành tay", () => {
  // GHI CHÚ GIỚI HẠN THẬT (phát hiện khi viết test này): ba tầng đều
  // linear 1→2 thì tốc độ hợp cuối lên tới 2×2×2 = 8 > 4 nên render
  // cũng phải fail-fast (định dạng speedKeyframes chỉ cho v ≤ 4) —
  // fixture đó KHÔNG thể thành công ở cả render lẫn preview. Vì vậy
  // test này dùng biên độ nhẹ hơn: outer 1→2, middle/inner 1→1.5.
  // s_o(T) = 1 + T/4, C_o = 6; s_m = s_i = 1 + T/8, C = 5.
  // Lá [0,5) qua inner → output [0,4); qua middle: τ_m(4) = 3.3137085
  // (nghiệm T + T²/16 = 4); qua outer: τ_o(3.3137085) = 2.5199440
  // (nghiệm T + T²/8 = 3.3137085). in 0, out 5 (nguồn lá speed 1).
  // Tốc độ hợp cực đại ở cuối: 1.63 × 2.1213 ≈ 3.46 < 4 nên hợp được.
  // sourceAt(t'=1) đi theo chuỗi ∫ (output→child, ngược với τ dùng
  // cho placement): w_o = ∫₀¹ s_o = 1.125 (= middle-output);
  // w_m = ∫₀^1.125 s_m = 1.125 + 1.125²/16 = 1.2041016 (= inner-output);
  // w_i = ∫₀^1.2041016 s_i = 1.2947178; lá speed 1 → src = 1.2947178.
  const lin1_1p5 = {
    keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 1.5, easing: "linear" },
    ],
  };
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [nestedRamp({}, [{
        kind: "nested", id: "mid", start: 0, duration: 4, in: 0,
        speedKeyframes: lin1_1p5,
        tracks: [{ kind: "video", clips: [{
          kind: "nested", id: "inner", start: 0, duration: 4, in: 0,
          speedKeyframes: lin1_1p5,
          tracks: [{ kind: "video", clips: [video("x", 0, 5)] }],
        }] }],
      }])],
    }],
  });
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 2.5199440, 1e-3, "outerDuration = τ_o(τ_m(4))");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 5);
  approx(rampSourceTimeAt(c.clip as never, 11), 1.2947178, 1e-3, "source tại localT=1");
});
ok("T1(f2) ba tầng 1→2 đều nhau: tốc độ hợp vượt 4 nên fail-fast (đúng render)", () => {
  // Tích tốc độ cuối = 2×2×2 = 8 > 4: composeTwoLevelCurve ở wrapper
  // tầng ngoài phải throw, giống render R1 (fail-fast, không hợp sai).
  assert.throws(() => flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [nestedRamp({}, [{
        kind: "nested", id: "mid", start: 0, duration: 4, in: 0,
        speedKeyframes: LINEAR_1_2,
        tracks: [{ kind: "video", clips: [{
          kind: "nested", id: "inner", start: 0, duration: 4, in: 0,
          speedKeyframes: LINEAR_1_2,
          tracks: [{ kind: "video", clips: [video("x", 0, 6)] }],
        }] }],
      }])],
    }],
  }), /vượt khoảng/);
});
ok("T1(g) lá mang curve dưới nested tốc độ hằng: slice + đổi biến đúng hệt (render R1 §1c)", () => {
  // Nested speed 2 (không curve), lá linear 1→2 trên duration con 4:
  // flat duration = 4/2 = 2; curve rescale t/2, v×2 → [{t:0,v:2},{t:2,v:4}];
  // in 0, out = ∫₀⁴ s_i = 6; source tại localT=1: ∫₀¹ (2 + t) dt = 2.5.
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "n1", start: 10, duration: 2, in: 0, speed: 2,
        tracks: [{ kind: "video", clips: [video("leaf", 0, 4, {
          speedKeyframes: {
            keyframes: [
              { t: 0, v: 1, easing: "linear" },
              { t: 4, v: 2, easing: "linear" },
            ],
          },
          out: 6,
        })] }],
      }],
    }],
  });
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 2, 1e-9, "outerDuration");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 6);
  const kfs = (c.clip as unknown as { speedKeyframes: { keyframes: Array<{ t: number; v: number }> } }).speedKeyframes.keyframes;
  approx(kfs[0].v, 2, 1e-9, "rescale v đầu 1×2");
  approx(kfs[kfs.length - 1].v, 4, 1e-9, "rescale v cuối 2×2");
  approx(kfs[kfs.length - 1].t, 2, 1e-9, "rescale t cuối 4/2");
  approx(rampSourceTimeAt(c.clip as never, 11), 2.5, 1e-3, "source tại localT=1");
});
ok("T1(i) lá audio mang curve dưới ramp: hợp như video (không phải phi-media)", () => {
  const r = flat1({
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: LINEAR_1_2,
    tracks: [{ kind: "audio", clips: [{
      kind: "audio", id: "au", start: 0, duration: 6, in: 0, out: 9,
      speedKeyframes: INNER_LINEAR_1_2_6,
    }] }],
  });
  assert.equal(r.clips.length, 1);
  const c = r.clips[0];
  approx(c.outerStart, 10, 1e-9, "outerStart");
  approx(c.outerDuration, 4, 1e-9, "outerDuration");
  assert.equal(c.clip.in, 0);
  assert.equal(c.clip.out, 9);
  approx(rampSourceTimeAt(c.clip as never, 12), 3.0208333, 1e-3, "source tại localT=2 (như video T1a)");
});
ok("T1(h) fail-fast giữ nguyên: curve + reverse/attachment/phi-media/tích vượt", () => {
  assert.throws(() => flat1(nestedRamp({}, [video("x", 0, 3, {
    speedKeyframes: LINEAR_1_2, reverse: true,
  })])), /reverse/);
  assert.throws(() => flat1(nestedRamp({}, [{
    kind: "video", id: "x", start: 0, duration: 3, in: 0, out: 3,
    speedKeyframes: LINEAR_1_2,
    animations: { opacity: { keyframes: [{ t: 0, v: 1 }] } },
  }])), /animations/);
  assert.throws(() => flat1(nestedRamp({}, [{
    kind: "text", id: "x", start: 0, duration: 3, in: 0, out: 3,
    speedKeyframes: LINEAR_1_2,
  }])), /video\/audio/);
  // Tích vượt: ngoài lên tới 2 × trong lên tới 4 = 8 > 4 → throw.
  assert.throws(() => flat1(nestedRamp({}, [video("x", 0, 6, {
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 2, easing: "linear" },
        { t: 6, v: 4, easing: "linear" },
      ],
    },
    out: 18,
  })])), /vượt khoảng/);
  // Curve trong lỗi hình dạng vẫn throw (v = 5).
  assert.throws(() => flat1(nestedRamp({}, [video("x", 0, 6, {
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 5, easing: "linear" },
        { t: 6, v: 5, easing: "linear" },
      ],
    },
    out: 30,
  })])), /0\.25\.\.4/);
});
console.log(`nestedRampPreview: ${pass} test pass`);
