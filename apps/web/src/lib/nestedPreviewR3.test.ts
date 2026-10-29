// nestedPreviewR3.test.ts — Test cho transition qua biên nested + opacity kế
// thừa ở PREVIEW (R3, Phase 9). Chạy bằng Node type-stripping (không cần
// browser, không cần bundler):
//   node --experimental-strip-types src/lib/nestedPreviewR3.test.ts
//
// Preview không render frame thật bằng canvas ở đây (cần browser + media):
// test kiểm chứng logic mà renderFrame dùng — spec sau buildPreviewSpec
// phải có 2 clip cùng active trong cửa sổ transition với opacity bù nhau
// (clip dưới = 1, lá biên nội suy = 0.5 giữa transition) thì canvas mới
// vẽ ra blend thật (renderFrame vẽ mọi clip active theo thứ tự track với
// globalAlpha = opacity). Nội suy keyframes trong test là linear 2 điểm,
// khớp previewEngine.interpolateKeyframes với easing "linear".
import assert from "node:assert/strict";
import {
  buildPreviewSpec,
  flattenForPreview,
  type LeafClipInput,
} from "./nestedPreview.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.log(`  ✗ ${name} — ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
function eq(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}
function throws(fn: () => void, re: RegExp): boolean {
  try {
    fn();
    return false;
  } catch (e) {
    return re.test((e as Error).message);
  }
}
// Nội suy linear 2 keyframe, clamp ngoài khoảng (mirror interpolateKeyframes).
function interp2(
  kfs: Array<{ t: number; v: number }>,
  t: number,
): number {
  if (kfs.length === 1) return kfs[0].v;
  const [a, b] = kfs;
  if (t <= a.t) return a.v;
  if (t >= b.t) return b.v;
  return a.v + (b.v - a.v) * ((t - a.t) / (b.t - a.t));
}
function opKeyframes(
  clip: LeafClipInput,
): Array<{ t: number; v: number }> | null {
  const anims = clip["animations"] as
    | { opacity?: { keyframes?: Array<{ t: number; v: number }> } }
    | undefined;
  return anims?.opacity?.keyframes ?? null;
}

const video = (
  id: string,
  start: number,
  duration: number,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
  kind: "video",
  id,
  src: `${id}.mp4`,
  start,
  duration,
  ...extra,
});
const vtrack = (
  id: string,
  clips: unknown[],
): Record<string, unknown> => ({ id, kind: "video", clips });
const nested = (
  id: string,
  start: number,
  duration: number,
  tracks: unknown[],
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({ kind: "nested", id, start, duration, tracks, ...extra });
const flatLeaves = (r: { clips: Array<{ clip: LeafClipInput }> }): LeafClipInput[] =>
  r.clips.map((f) => f.clip);
const leafById = (
  r: { clips: Array<{ clip: LeafClipInput }> },
  id: string,
): LeafClipInput | undefined =>
  r.clips.map((f) => f.clip).find((c) => c.id === id);

// Clip video đang active tại t trong spec đã build (mirror renderFrame:
// duyệt track video, clip nào thỏa start <= t < start + duration thì vẽ).
function activesAt(
  specTracks: Array<{ kind?: string; clips: Array<Record<string, unknown>> }>,
  t: number,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const track of specTracks) {
    if (track.kind !== "video") continue;
    for (const clip of track.clips) {
      if (clip["kind"] !== "video") continue;
      const s = clip["start"] as number;
      const d = clip["duration"] as number;
      if (t >= s && t < s + d) out.push(clip);
    }
  }
  return out;
}

console.log("[P1] fade-in qua biên phẳng→lồng nhau (preview)");
ok("P1 lá dịch sớm + keyframes fade-in 0→1", () => {
  const r = flattenForPreview({
    tracks: [
      vtrack("v", [
        video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
        nested("n", 2, 2, [vtrack("sv", [video("leaf", 0, 2)])]),
      ]),
    ],
  });
  const leaf = leafById(r, "leaf");
  assert.ok(leaf);
  assert.ok(eq(leaf.start, 1) && eq(leaf.duration, 2));
  const kf = opKeyframes(leaf);
  assert.ok(kf && kf.length === 2 && eq(kf[0].v, 0) && eq(kf[1].v, 1));
  assert.equal(r.skipped.length, 0);
});
ok("P1 buildPreviewSpec: t=1.5 có 2 clip active, opacity (1, 0.5) → blend", () => {
  const spec = buildPreviewSpec({
    version: "0.2.0",
    meta: { name: "p", width: 320, height: 240, fps: 10 },
    tracks: [
      vtrack("v", [
        video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
        nested("n", 2, 2, [vtrack("sv", [video("leaf", 0, 2)])]),
      ]),
    ],
  } as never);
  const act = activesAt(
    spec.tracks as never,
    1.5,
  );
  assert.equal(act.length, 2);
  const a = act.find((c) => c["id"] === "a") as LeafClipInput;
  const leaf = act.find((c) => c["id"] === "leaf") as LeafClipInput;
  assert.ok(a && leaf);
  assert.ok(opKeyframes(a) === null); // clip dưới opacity tĩnh 1
  const kf = opKeyframes(leaf);
  assert.ok(kf);
  assert.ok(eq(interp2(kf, 1.5 - 1), 0.5)); // localT = 0.5 → alpha 0.5
});

console.log("[P2] fade-out qua biên lồng nhau→phẳng (preview)");
ok("P2 clip phẳng dịch sớm + lá keyframes fade-out 1→0", () => {
  const r = flattenForPreview({
    tracks: [
      vtrack("v", [
        nested("n", 0, 2, [vtrack("sv", [video("leaf", 0, 2)])], {
          transitionOut: { type: "fade", duration: 1 },
        }),
        video("b", 2, 2),
      ]),
    ],
  });
  const b = leafById(r, "b");
  assert.ok(b && eq(b.start, 1));
  const leaf = leafById(r, "leaf");
  const kf = leaf && opKeyframes(leaf);
  assert.ok(kf && eq(kf[0].t, 1) && eq(kf[0].v, 1) && eq(kf[1].t, 2) && eq(kf[1].v, 0));
});
ok("P2 buildPreviewSpec không sửa spec gốc (clip phẳng vẫn start=2)", () => {
  const bClip = video("b", 2, 2);
  const spec = {
    version: "0.2.0",
    meta: { name: "p", width: 320, height: 240, fps: 10 },
    tracks: [
      vtrack("v", [
        nested("n", 0, 2, [vtrack("sv", [video("leaf", 0, 2)])], {
          transitionOut: { type: "fade", duration: 1 },
        }),
        bClip,
      ]),
    ],
  } as never;
  const built = buildPreviewSpec(spec);
  const builtB = (built.tracks as Array<{ clips: Array<Record<string, unknown>> }>)
    .flatMap((t) => t.clips)
    .find((c) => c["id"] === "b");
  assert.ok(builtB && eq(builtB["start"] as number, 1));
  assert.ok(eq(bClip["start"] as number, 2)); // spec gốc không đổi
});

console.log("[P3] fade lồng nhau→lồng nhau (preview)");
ok("P3 chỉ lá sau fade-in, lá trước giữ nguyên", () => {
  const r = flattenForPreview({
    tracks: [
      vtrack("v", [
        nested("n1", 0, 2, [vtrack("s1", [video("l1", 0, 2)])], {
          transitionOut: { type: "fade", duration: 1 },
        }),
        nested("n2", 2, 2, [vtrack("s2", [video("l2", 0, 2)])]),
      ]),
    ],
  });
  const l1 = leafById(r, "l1");
  const l2 = leafById(r, "l2");
  assert.ok(l1 && eq(l1.start, 0) && opKeyframes(l1) === null);
  assert.ok(l2 && eq(l2.start, 1));
  const kf = l2 && opKeyframes(l2);
  assert.ok(kf && eq(kf[0].v, 0) && eq(kf[1].v, 1));
});

console.log("[P4] opacity kế thừa (preview)");
ok("P4 tĩnh ×, keyframes ×, lồng 2 cấp ×", () => {
  const r = flattenForPreview({
    tracks: [
      vtrack("v", [
        nested("n", 0, 2, [
          vtrack("sv", [
            video("s1", 0, 1, { opacity: 0.8 }),
            video("s2", 1, 1, {
              animations: { opacity: { keyframes: [{ t: 0, v: 0.8 }, { t: 1, v: 0.8 }] } },
            }),
          ]),
        ], { opacity: 0.5 }),
      ]),
    ],
  });
  const s1 = leafById(r, "s1");
  const s2 = leafById(r, "s2");
  assert.ok(s1 && eq(s1["opacity"] as number, 0.4));
  const kf = s2 && opKeyframes(s2);
  assert.ok(kf && eq(kf[0].v, 0.4) && eq(kf[1].v, 0.4));
  const r2 = flattenForPreview({
    tracks: [
      vtrack("v", [
        nested("outer", 0, 2, [
          vtrack("so", [
            nested("inner", 0, 2, [vtrack("si", [video("deep", 0, 2)])], { opacity: 0.5 }),
          ]),
        ], { opacity: 0.5 }),
      ]),
    ],
  });
  const deep = leafById(r2, "deep");
  assert.ok(deep && eq(deep["opacity"] as number, 0.25));
});

console.log("[P5] fail fast (preview)");
ok("P5 type wipeleft qua biên bị từ chối", () => {
  assert.ok(
    throws(
      () =>
        flattenForPreview({
          tracks: [
            vtrack("v", [
              video("a", 0, 2, { transitionOut: { type: "wipeleft", duration: 1 } }),
              nested("n", 2, 2, [vtrack("sv", [video("leaf", 0, 2)])]),
            ]),
          ],
        }),
      /chỉ hỗ trợ type "fade"/,
    ),
  );
});
ok("P5 dual 2 đầu lồng nhau bị từ chối", () => {
  assert.ok(
    throws(
      () =>
        flattenForPreview({
          tracks: [
            vtrack("v", [
              video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
              nested("n", 2, 2, [vtrack("sv", [video("leaf", 0, 2)])], {
                transitionOut: { type: "fade", duration: 1 },
              }),
              video("b", 4, 2),
            ]),
          ],
        }),
      /cả hai đầu/,
    ),
  );
});
ok("P5 clip phẳng bị dịch còn dính transition khác bị từ chối", () => {
  assert.ok(
    throws(
      () =>
        flattenForPreview({
          tracks: [
            vtrack("v", [
              nested("n", 0, 2, [vtrack("sv", [video("leaf", 0, 2)])], {
                transitionOut: { type: "fade", duration: 1 },
              }),
              video("b", 2, 2, { transitionOut: { type: "fade", duration: 1 } }),
              video("c", 4, 2),
            ]),
          ],
        }),
      /không giữ được transition khác/,
    ),
  );
});
ok("P5 lá biên có keyframes opacity sẵn bị từ chối", () => {
  assert.ok(
    throws(
      () =>
        flattenForPreview({
          tracks: [
            vtrack("v", [
              video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
              nested("n", 2, 2, [
                vtrack("sv", [
                  video("leaf", 0, 2, {
                    animations: { opacity: { keyframes: [{ t: 0, v: 1 }, { t: 2, v: 1 }] } },
                  }),
                ]),
              ]),
            ]),
          ],
        }),
      /keyframes opacity/,
    ),
  );
});
ok("P5 lá biên bị cắt trái (fade-in) bị từ chối", () => {
  assert.ok(
    throws(
      () =>
        flattenForPreview({
          tracks: [
            vtrack("v", [
              video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
              // Nested phát từ in=1: lá [0,4) bị cắt trái, biên ở 2 nhưng
              // nội dung trước cửa sổ sẽ lộ ra khi dịch sớm.
              nested("n", 2, 2, [vtrack("sv", [video("leaf", 0, 4)])], { in: 1 }),
            ]),
          ],
        }),
      /cắt trái/,
    ),
  );
});
ok("P5 lá biên kind image bị từ chối", () => {
  assert.ok(
    throws(
      () =>
        flattenForPreview({
          tracks: [
            vtrack("v", [
              video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
              nested("n", 2, 2, [
                vtrack("sv", [{ kind: "image", id: "img", src: "x.png", start: 0, duration: 2 }]),
              ]),
            ]),
          ],
        }),
      /không áp opacity keyframes/,
    ),
  );
});
ok("P5 opacity lồng nhau > 1 bị từ chối", () => {
  assert.ok(
    throws(
      () =>
        flattenForPreview({
          tracks: [
            vtrack("v", [
              nested("n", 0, 2, [vtrack("sv", [video("leaf", 0, 2)])], { opacity: 1.5 }),
            ]),
          ],
        }),
      /0\.\.1/,
    ),
  );
});

console.log("[P6] track không phải video (preview)");
ok("P6 cảnh báo + bỏ qua, không throw, không dịch", () => {
  const r = flattenForPreview({
    tracks: [
      {
        id: "a",
        kind: "audio",
        clips: [
          { kind: "audio", id: "aa", src: "a.mp3", start: 0, duration: 2,
            transitionOut: { type: "fade", duration: 1 } },
          nested("n", 2, 2, [
            { id: "sa", kind: "audio", clips: [
              { kind: "audio", id: "aleaf", src: "b.mp3", start: 0, duration: 2 },
            ] },
          ]),
        ],
      },
    ],
  });
  assert.ok(r.skipped.some((s) => /không phải video/.test(s)));
  const leaf = leafById(r, "aleaf");
  assert.ok(leaf && eq(leaf.start, 2));
});

console.log("[P7] spec phẳng hồi quy (preview)");
ok("P7 buildPreviewSpec không có nested/adjustment trả đúng object cũ", () => {
  const spec = {
    version: "0.2.0",
    meta: { name: "p", width: 320, height: 240, fps: 10 },
    tracks: [vtrack("v", [video("a", 0, 2), video("b", 2, 2)])],
  } as never;
  assert.strictEqual(buildPreviewSpec(spec), spec);
});
ok("P7 flatten spec phẳng: plainShifts rỗng, clip giữ nguyên", () => {
  const r = flattenForPreview({
    tracks: [vtrack("v", [video("a", 0, 2), video("b", 2, 2)])],
  });
  assert.equal(r.plainShifts.size, 0);
  assert.equal(flatLeaves(r).length, 2);
});

console.log("[P8] fade + opacity kết hợp (preview)");
ok("P8 ramp kết thúc ở effOp 0.5", () => {
  const r = flattenForPreview({
    tracks: [
      vtrack("v", [
        video("a", 0, 2, { transitionOut: { type: "fade", duration: 1 } }),
        nested("n", 2, 2, [vtrack("sv", [video("leaf", 0, 2)])], { opacity: 0.5 }),
      ]),
    ],
  });
  const leaf = leafById(r, "leaf");
  const kf = leaf && opKeyframes(leaf);
  assert.ok(kf && eq(kf[1].v, 0.5));
  assert.ok(leaf && eq(leaf["opacity"] as number, 0.5));
});

console.log(`\n${pass} test passed`);
