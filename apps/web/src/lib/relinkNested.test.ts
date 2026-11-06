/**
 * relinkNested.test.ts — Test thật cho nested relink (Phase 9 đợt 26, J2).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/relinkNested.test.ts
 *
 * Chỉ test logic thuần trong relink.ts (không cần browser/DOM, không cần
 * store). Theo mẫu harness của clipboard.test.ts (không dùng node:test để
 * tsc của app không đòi @types/node).
 *
 * Khóa: thiếu ở tầng 1, tầng 2, nhiều nested cùng thiếu, lá không thiếu
 * không bị liệt kê, relink lá sâu đổi đúng src, hồi quy relink cũ, vòng
 * lặp tự tham chiếu không treo, subSpec dùng lại ở 2 nhánh anh em được
 * tính cả hai, lá trim/curve trong nested giữ nguyên field ngoài src.
 */
import { findMissingAssets, relinkAsset } from "./relink.ts";
import type { Clip, Track, VideoSpec } from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg} — nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

/** Clip lá video/ảnh thường. */
function leaf(id: string, src: string, extra: Record<string, unknown> = {}): Clip {
  return {
    kind: "video", id, src, start: 0, duration: 4, in: 0, out: 4, opacity: 1, ...extra,
  } as unknown as Clip;
}

function textLeaf(id: string): Clip {
  return {
    kind: "text", id, text: "hi", start: 0, duration: 2,
    style: { fontFamily: "Inter", fontSize: 48, color: "#fff", x: 0.5, y: 0.5 },
  } as unknown as Clip;
}

/** Nested clip chuẩn (subSpec). */
function nested(id: string, subTracks: Track[], name?: string): Clip {
  return {
    kind: "nested", id, name, start: 0, duration: 4,
    subSpec: {
      meta: { name: id, width: 640, height: 360, fps: 30 },
      tracks: subTracks,
    } as unknown as VideoSpec["tracks"],
    trim: { in: 0, out: 4 },
  } as unknown as Clip;
}

/** Nested clip legacy: tracks trực tiếp, không có subSpec. */
function nestedLegacy(id: string, subTracks: Track[]): Clip {
  return {
    kind: "nested", id, start: 0, duration: 4, tracks: subTracks,
  } as unknown as Clip;
}

function track(id: string, clips: Clip[], label?: string): Track {
  return { id, kind: "video", label, clips } as Track;
}

function spec(tracks: Track[]): VideoSpec {
  return {
    meta: { name: "t", width: 640, height: 360, fps: 30 },
    tracks,
  } as unknown as VideoSpec;
}

function missingOf(s: VideoSpec, names: string[]) {
  return findMissingAssets(s, new Set(names));
}

// --- Quét: thiếu trong nested ------------------------------------------------

test("thiếu tầng 1: lá trong 1 nested được liệt kê kèm chain", () => {
  const s = spec([track("v", [nested("comp", [track("in1", [leaf("l1", "a.mp4")], "V1")], "MyComp")])]);
  const m = missingOf(s, []);
  eq(m.length, 1, "số asset thiếu");
  eq(m[0].src, "a.mp4", "src");
  eq(m[0].clipCount, 1, "clipCount");
  eq(m[0].topLevelClipCount, 0, "topLevelClipCount");
  eq(m[0].nestedClipCount, 1, "nestedClipCount");
  eq(m[0].nestedChains.join(";"), "MyComp", "nestedChains dùng name");
  eq(m[0].locations[0].depth, 1, "depth tầng 1");
  eq(m[0].locations[0].chain.join(","), "MyComp", "chain tầng 1");
  eq(m[0].locations[0].clipId, "l1", "clipId lá");
});

test("thiếu tầng 2: chain ngoài → trong, depth 2", () => {
  const inner = nested("inner", [track("in2", [leaf("deep", "deep.mp4")])]);
  const s = spec([track("v", [nested("outer", [track("mid", [inner])])])]);
  const m = missingOf(s, []);
  eq(m.length, 1, "số asset thiếu");
  eq(m[0].locations[0].depth, 2, "depth tầng 2");
  eq(m[0].locations[0].chainLabel, "outer › inner", "chainLabel dùng id khi không có name");
});

test("nhiều nested cùng thiếu 1 src: gộp 1 entry, đủ chain, đủ count", () => {
  const s = spec([
    track("v", [
      leaf("top", "shared.mp4"),
      nested("A", [track("a1", [leaf("la", "shared.mp4")])]),
      nested("B", [track("b1", [leaf("lb", "shared.mp4")])]),
    ]),
  ]);
  const m = missingOf(s, []);
  eq(m.length, 1, "gộp theo src thành 1 entry");
  eq(m[0].clipCount, 3, "clipCount = 1 cấp cao + 2 nested");
  eq(m[0].topLevelClipCount, 1, "topLevel");
  eq(m[0].nestedClipCount, 2, "nested");
  eq(m[0].nestedChains.join(";"), "A;B", "cả hai chain");
});

test("lá không thiếu không bị liệt kê (cấp cao + nested + text clip)", () => {
  const s = spec([
    track("v", [
      leaf("ok1", "have.mp4"),
      textLeaf("txt"),
      nested("comp", [track("in1", [leaf("ok2", "have2.mp4")])]),
    ]),
  ]);
  const m = missingOf(s, ["have.mp4", "have2.mp4"]);
  eq(m.length, 0, "không còn asset thiếu");
});

test("blob: trong nested vẫn coi là thiếu dù tên trùng media", () => {
  const s = spec([track("v", [nested("comp", [track("in1", [leaf("l", "blob:abc")])])])]);
  const m = missingOf(s, ["blob:abc"]);
  eq(m.length, 1, "blob: trong nested vẫn thiếu");
});

test("nested legacy (tracks trực tiếp) cũng được quét", () => {
  const s = spec([track("v", [nestedLegacy("old", [track("in1", [leaf("l", "old.mp4")])])])]);
  const m = missingOf(s, []);
  eq(m.length, 1, "legacy nested vẫn quét được");
  eq(m[0].nestedChains.join(";"), "old", "chain legacy");
});

test("subSpec dùng lại ở 2 nhánh anh em: tính cả hai, không coi là vòng lặp", () => {
  const shared = {
    meta: { name: "s", width: 640, height: 360, fps: 30 },
    tracks: [track("in1", [leaf("l", "shared.mp4")])],
  } as unknown as VideoSpec;
  const mk = (id: string): Clip =>
    ({ kind: "nested", id, start: 0, duration: 4, subSpec: shared }) as unknown as Clip;
  const s = spec([track("v", [mk("A"), mk("B")])]);
  const m = missingOf(s, []);
  eq(m.length, 1, "1 entry");
  eq(m[0].clipCount, 2, "subSpec dùng lại → đếm 2 clip");
  eq(m[0].nestedChains.join(";"), "A;B", "cả hai chain anh em");
});

test("vòng lặp tự tham chiếu (subSpec chứa chính clip đó) không treo, không liệt kê rác", () => {
  const innerTrack = track("in1", []);
  const selfNested = {
    kind: "nested", id: "self", start: 0, duration: 4,
    subSpec: {
      meta: { name: "self", width: 640, height: 360, fps: 30 },
      tracks: [innerTrack],
    },
  } as unknown as Clip;
  (innerTrack.clips as Clip[]).push(selfNested);
  const s = spec([track("v", [selfNested])]);
  const m = missingOf(s, []);
  eq(m.length, 0, "nested tự tham chiếu không có lá src → không thiếu, không treo");
  const r = relinkAsset(s, "x.mp4", "y.mp4");
  eq(r.updatedCount, 0, "relink trên cây vòng lặp không treo, 0 đổi");
});

// --- Relink lá sâu ------------------------------------------------------------

test("relink lá sâu tầng 2 đổi đúng src, clip khác không đổi", () => {
  const inner = nested("inner", [track("in2", [leaf("deep", "old.mp4"), leaf("keep", "keep.mp4")])]);
  const s = spec([track("v", [leaf("top-other", "other.mp4"), nested("outer", [track("mid", [inner])])])]);
  const r = relinkAsset(s, "old.mp4", "new.mp4");
  eq(r.updatedCount, 1, "chỉ 1 lá sâu đổi");
  const out = r.spec.tracks[0].clips[1] as unknown as Record<string, unknown>;
  const sub = out["subSpec"] as Record<string, unknown>;
  const midTrack = (sub["tracks"] as Track[])[0];
  const innerClip = midTrack.clips[0] as unknown as Record<string, unknown>;
  const inSub = innerClip["subSpec"] as Record<string, unknown>;
  const inTrack = (inSub["tracks"] as Track[])[0];
  eq((inTrack.clips[0] as unknown as Record<string, unknown>)["src"], "new.mp4", "lá sâu đã đổi src");
  eq((inTrack.clips[1] as unknown as Record<string, unknown>)["src"], "keep.mp4", "lá khác giữ nguyên");
  eq((r.spec.tracks[0].clips[0] as unknown as Record<string, unknown>)["src"], "other.mp4", "clip cấp cao khác giữ nguyên");
});

test("relink không mutate input; nhánh không đổi giữ tham chiếu", () => {
  const untouched = track("v2", [leaf("u", "u.mp4")]);
  const s = spec([
    track("v", [nested("comp", [track("in1", [leaf("l", "old.mp4")])])]),
    untouched,
  ]);
  const r = relinkAsset(s, "old.mp4", "new.mp4");
  eq(r.updatedCount, 1, "1 đổi");
  const origNested = s.tracks[0].clips[0] as unknown as Record<string, unknown>;
  const origSub = origNested["subSpec"] as Record<string, unknown>;
  eq(((origSub["tracks"] as Track[])[0].clips[0] as unknown as Record<string, unknown>)["src"], "old.mp4", "input không bị mutate");
  assert(r.spec.tracks[1] === untouched, "track không đổi giữ nguyên tham chiếu");
});

test("relink lá trim/speed trong nested: chỉ đổi src, giữ nguyên field còn lại", () => {
  const trimmed = leaf("l", "old.mp4", { in: 2, out: 8, speed: 2 });
  const s = spec([track("v", [nested("comp", [track("in1", [trimmed])], "Comp")])]);
  const r = relinkAsset(s, "old.mp4", "new.mp4");
  const out = r.spec.tracks[0].clips[0] as unknown as Record<string, unknown>;
  eq((out["trim"] as Record<string, unknown>)["in"], 0, "trim của nested clip giữ nguyên");
  const sub = out["subSpec"] as Record<string, unknown>;
  const got = (sub["tracks"] as Track[])[0].clips[0] as unknown as Record<string, unknown>;
  eq(got["src"], "new.mp4", "src đổi");
  eq(got["in"], 2, "in của lá giữ nguyên");
  eq(got["out"], 8, "out của lá giữ nguyên");
  eq(got["speed"], 2, "speed của lá giữ nguyên");
});

test("relink nested legacy đổi đúng src trong tracks trực tiếp", () => {
  const s = spec([track("v", [nestedLegacy("old", [track("in1", [leaf("l", "old.mp4")])])])]);
  const r = relinkAsset(s, "old.mp4", "new.mp4");
  eq(r.updatedCount, 1, "1 đổi ở legacy");
  const out = r.spec.tracks[0].clips[0] as unknown as Record<string, unknown>;
  eq(((out["tracks"] as Track[])[0].clips[0] as unknown as Record<string, unknown>)["src"], "new.mp4", "lá legacy đã đổi");
});

// --- Hồi quy relink cũ --------------------------------------------------------

test("hồi quy: relink cấp cao đổi mọi clip cùng src; old==new → 0 và giữ spec", () => {
  const s = spec([track("v", [leaf("a", "a.mp4"), leaf("b", "a.mp4"), leaf("c", "c.mp4")])]);
  const r = relinkAsset(s, "a.mp4", "z.mp4");
  eq(r.updatedCount, 2, "cả 2 clip cấp cao cùng src đều đổi");
  eq((r.spec.tracks[0].clips[2] as unknown as Record<string, unknown>)["src"], "c.mp4", "clip khác giữ nguyên");
  const same = relinkAsset(s, "a.mp4", "a.mp4");
  eq(same.updatedCount, 0, "old==new → 0");
  assert(same.spec === s, "old==new giữ nguyên spec");
  const none = relinkAsset(s, "nope.mp4", "z.mp4");
  eq(none.updatedCount, 0, "src không tồn tại → 0");
  assert(none.spec === s, "không đổi → giữ nguyên spec");
});

console.log(`relinkNested: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
