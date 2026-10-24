/**
 * silenceFollow.test.ts — Test thật: caption bám theo sau khi cắt khoảng lặng
 * (Phase 8 Q3, nối vào store.removeSilence).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/silenceFollow.test.ts
 *
 * Test tái tạo ĐÚNG tổ hợp của store.ts (không cần browser/DOM):
 *   removeSilenceFromClip → splitLinkedCaptionsInSpec (chia câu theo đoạn
 *   giữ) → shiftCaptionsForMovedClips (caption của clip bị ripple dịch theo).
 * Project: clip v1 (0..10) + câu link [1,2], [4,6], [8,9], câu trong khoảng
 * lặng [2.7,3.2], câu cắt ngang [2,4]; clip sau v2@10 + câu của nó ở 11.
 * Cắt khoảng lặng local [2.5,3.5] → đoạn giữ [0,2.5] và [3.5,10].
 */
import { removeSilenceFromClip } from "./silence.ts";
import { isSourceClip, shiftCaptionsForMovedClips, splitLinkedCaptionsInSpec } from "./captionFollow.ts";
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

function near(a: number, b: number, eps: number, msg: string): void {
  if (Math.abs(a - b) > eps) throw new Error(`${msg} — nhận ${a}, muốn ${b} ± ${eps}`);
}

function videoClip(id: string, start: number, duration: number): Clip {
  return {
    kind: "video", id, src: "a.mp4", start, duration, in: 0, out: duration, opacity: 1,
  } as Clip;
}

function linkedCap(id: string, start: number, duration: number, sourceId: string, ms: number, me: number): Clip {
  return {
    kind: "text", id, text: "Cau", start, duration,
    style: { fontFamily: "Inter", fontSize: 48, color: "#fff", x: 0.5, y: 0.5 },
    captionOf: { clipId: sourceId, mediaStart: ms, mediaEnd: me },
  } as Clip;
}

function track(id: string, kind: Track["kind"], clips: Clip[]): Track {
  return { id, kind, label: id, clips };
}

function spec(tracks: Track[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}

const capOf = (c: Clip): { clipId: string; mediaStart: number; mediaEnd: number } | undefined =>
  (c as { captionOf?: { clipId: string; mediaStart: number; mediaEnd: number } }).captionOf;

/** Tổ hợp đúng như store.removeSilence (Phase 8 Q3). */
function storeRemoveSilence(oldSpec: VideoSpec, trackId: string, clipId: string, silences: { start: number; end: number }[]): VideoSpec | null {
  let n = 0;
  const res = removeSilenceFromClip(oldSpec, trackId, clipId, silences, () => `k${++n}`);
  if (!res) return null;
  const oldTrack = oldSpec.tracks.find((t) => t.id === trackId);
  const oldIds = new Set(oldTrack?.clips.map((c) => c.id) ?? []);
  const newTrack = res.spec.tracks.find((t) => t.id === trackId);
  const pieces = (newTrack?.clips ?? [])
    .filter((c) => !oldIds.has(c.id))
    .filter(isSourceClip);
  let next = splitLinkedCaptionsInSpec(res.spec, clipId, pieces);
  next = shiftCaptionsForMovedClips(oldSpec, next);
  return next;
}

function main(): void {
  console.log("== caption bám theo sau khi remove silence ==");
  const build = () => spec([
    track("v1", "video", [videoClip("v", 0, 10), videoClip("v2", 10, 5)]),
    track("t1", "text", [
      linkedCap("c1", 1, 1, "v", 1, 2),
      linkedCap("c2", 4, 2, "v", 4, 6),
      linkedCap("c3", 8, 1, "v", 8, 9),
      linkedCap("cDead", 2.7, 0.5, "v", 2.7, 3.2),
      linkedCap("cSpan", 2, 2, "v", 2, 4),
      linkedCap("cLater", 11, 1, "v2", 1, 2),
    ]),
  ]);

  test("cắt [2.5,3.5]: 2 đoạn giữ, removedTotal = 1", () => {
    const s = build();
    const res = removeSilenceFromClip(s, "v1", "v", [{ start: 2.5, end: 3.5 }], () => "k1");
    assert(res !== null, "cắt được");
    eq(res!.keepCount, 2, "2 đoạn giữ");
    eq(res!.removedTotal, 1, "cắt đúng 1s");
  });

  test("câu trong đoạn giữ 1 và 2 dịch đúng vị trí mới", () => {
    const next = storeRemoveSilence(build(), "v1", "v", [{ start: 2.5, end: 3.5 }]);
    assert(next !== null, "cắt được");
    const caps = next!.tracks[1].clips;
    // Key gồm cả id nguồn (cLater của v2 cũng có media 1-2, tránh ghi đè c1).
    const byMedia = new Map(caps.map((c) => [`${capOf(c)?.clipId}:${capOf(c)?.mediaStart}-${capOf(c)?.mediaEnd}`, c]));
    const piece1 = next!.tracks[0].clips.find((c) => c.start === 0 && c.id !== "v2")!;
    const piece2 = next!.tracks[0].clips.find((c) => c.start === 2.5)!;
    // [1,2] ở đoạn giữ 1: giữ nguyên start 1.
    const c1 = byMedia.get(`${piece1.id}:1-2`)!;
    eq(c1.start, 1, "[1,2] giữ start 1");
    // [4,6] ở đoạn giữ 2 (bắt đầu timeline 2.5, media 3.5): 2.5 + (4-3.5) = 3.
    const c2 = byMedia.get(`${piece2.id}:4-6`)!;
    eq(c2.start, 3, "[4,6] → start 3");
    eq(c2.duration, 2, "[4,6] giữ duration");
    // [8,9] → 2.5 + (8-3.5) = 7.
    const c3 = byMedia.get(`${piece2.id}:8-9`)!;
    eq(c3.start, 7, "[8,9] → start 7");
  });

  test("câu nằm gọn trong khoảng lặng bị RỚT, không caption ma", () => {
    const next = storeRemoveSilence(build(), "v1", "v", [{ start: 2.5, end: 3.5 }]);
    assert(next !== null, "cắt được");
    const caps = next!.tracks[1].clips;
    assert(!caps.some((c) => capOf(c)?.mediaStart === 2.7), "câu [2.7,3.2] đã rớt");
    // Câu gốc của v không còn link tới id cũ (đã chia sang đoạn giữ hoặc rớt).
    assert(!caps.some((c) => capOf(c)?.clipId === "v"), "không câu nào còn link tới clip gốc đã mất");
  });

  test("câu cắt ngang khoảng lặng bị chẻ theo 2 đoạn giữ", () => {
    const next = storeRemoveSilence(build(), "v1", "v", [{ start: 2.5, end: 3.5 }]);
    assert(next !== null, "cắt được");
    const caps = next!.tracks[1].clips;
    // [2,4] → [2,2.5] trên đoạn giữ 1 và [3.5,4] trên đoạn giữ 2 (start 2.5).
    const part1 = caps.find((c) => capOf(c)?.mediaStart === 2 && capOf(c)?.mediaEnd === 2.5);
    const part2 = caps.find((c) => capOf(c)?.mediaStart === 3.5 && capOf(c)?.mediaEnd === 4);
    assert(part1 !== undefined, "có mảnh [2,2.5]");
    eq(part1!.start, 2, "mảnh 1 ở start 2");
    assert(part2 !== undefined, "có mảnh [3.5,4]");
    eq(part2!.start, 2.5, "mảnh 2 ở start 2.5 (đầu đoạn giữ 2)");
    near(part2!.duration, 0.5, 1e-9, "mảnh 2 dài 0.5");
  });

  test("clip sau ripple trái + caption của nó dịch theo", () => {
    const next = storeRemoveSilence(build(), "v1", "v", [{ start: 2.5, end: 3.5 }]);
    assert(next !== null, "cắt được");
    const v2 = next!.tracks[0].clips.find((c) => c.id === "v2")!;
    eq(v2.start, 9, "v2 ripple 10 → 9");
    const cLater = next!.tracks[1].clips.find((c) => capOf(c)?.clipId === "v2")!;
    eq(cLater.start, 10, "caption của v2 dịch 11 → 10");
    eq(capOf(cLater)?.mediaStart, 1, "caption v2 giữ đoạn media");
  });

  test("câu của đoạn giữ link đúng id đoạn giữ (không link chéo)", () => {
    const next = storeRemoveSilence(build(), "v1", "v", [{ start: 2.5, end: 3.5 }]);
    assert(next !== null, "cắt được");
    const pieces = next!.tracks[0].clips.filter((c) => c.id !== "v2");
    eq(pieces.length, 2, "2 đoạn giữ");
    const piece1 = pieces.find((c) => c.start === 0)!;
    const piece2 = pieces.find((c) => c.start === 2.5)!;
    const caps = next!.tracks[1].clips;
    eq(capOf(caps.find((c) => capOf(c)?.mediaStart === 1)!)?.clipId, piece1.id, "[1,2] link đoạn giữ 1");
    eq(capOf(caps.find((c) => capOf(c)?.mediaStart === 4)!)?.clipId, piece2.id, "[4,6] link đoạn giữ 2");
  });

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  if (fail > 0) {
    console.error("Failed:", failedNames.join(", "));
    process.exitCode = 1;
  }
}

main();
