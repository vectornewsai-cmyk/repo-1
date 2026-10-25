/**
 * d6.test.ts — Test thật cho Phase 9 đợt 4 (agent D6): hoàn thiện caption.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/d6.test.ts
 *
 * Chỉ test logic thuần (không DOM/store):
 *  (1) xuất SRT/VTT cấp project (collectProjectCaptions + round-trip),
 *  (2) duplicate mang caption + karaoke theo (duplicateClips),
 *  (3) karaoke map chính xác qua tích phân speed curve (linkSegmentsToClips
 *      + refollowCaptions), kể cả clip ngược và trim trái tốc độ hằng.
 */
import {
  karaokeForLinkedSegment,
  linkSegmentsToClips,
  refollowCaptions,
} from "./captionFollow.ts";
import { duplicateClips } from "./clipboard.ts";
import {
  collectProjectCaptions,
  formatSrt,
  formatVtt,
  parseSrt,
  parseVtt,
} from "./subtitles.ts";
import type {
  Clip,
  TextClip,
  Track,
  VideoSpec,
} from "@repo-1/video-spec";
import type { SourceClip } from "./captionFollow.ts";

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

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

/** idGen xác định cho test: n1, n2, ... */
function counterIdGen(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `n${n}`;
  };
}

const STYLE = {
  fontFamily: "Inter",
  fontSize: 56,
  color: "#ffffff",
  bold: true,
  italic: false,
  x: 0.5,
  y: 0.85,
  animation: "none",
} as const;

function videoClip(over: Partial<SourceClip> & { id: string }): SourceClip {
  return {
    kind: "video",
    src: "v.mp4",
    start: 0,
    duration: 10,
    in: 0,
    out: 10,
    ...over,
  } as SourceClip;
}

function capClip(
  over: Partial<TextClip> & { id: string; start: number; duration: number }
): TextClip {
  return {
    kind: "text",
    text: "hello",
    style: { ...STYLE },
    ...over,
  } as TextClip;
}

function track(
  id: string,
  kind: Track["kind"],
  label: string,
  clips: Clip[]
): Track {
  return { id, kind, label, clips };
}

function spec(tracks: Track[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}

// --- (1) Xuất SRT/VTT cấp project -------------------------------------------
test("project export: chỉ lấy câu phụ đề (link hoặc track Phụ đề), title bị loại", () => {
  const s = spec([
    track("v1", "video", "v1", [
      { kind: "video", id: "src", src: "a.mp4", start: 0, duration: 10, in: 0, out: 10 } as Clip,
    ]),
    track("cap", "text", "Phụ đề 1", [
      capClip({ id: "c1", start: 5, duration: 2, text: "câu sau", captionOf: { clipId: "src", mediaStart: 5, mediaEnd: 7 } }),
      capClip({ id: "c2", start: 1, duration: 2, text: "câu trước" }),
    ]),
    track("ttl", "text", "Title", [
      capClip({ id: "t1", start: 0, duration: 3, text: "TIÊU ĐỀ PHIM" }),
    ]),
  ]);
  const { cues, trackLabels } = collectProjectCaptions(s.tracks);
  eq(cues.length, 2, "2 cue phụ đề");
  eq(cues[0].text, "câu trước", "sắp theo start");
  eq(cues[1].text, "câu sau");
  eq(cues[0].start, 1);
  eq(cues[1].end, 7);
  eq(trackLabels, ["Phụ đề 1"], "chỉ track phụ đề góp cue");
});

test("project export: round-trip SRT và VTT từ project mẫu giữ nguyên cue", () => {
  const s = spec([
    track("cap", "text", "Phụ đề 1", [
      capClip({ id: "c1", start: 0.5, duration: 1.5, text: "dòng một\ndòng hai" }),
      capClip({ id: "c2", start: 3, duration: 2, text: "câu hai" }),
    ]),
  ]);
  const { cues } = collectProjectCaptions(s.tracks);
  const backSrt = parseSrt(formatSrt(cues));
  eq(backSrt.errors, [], "SRT round-trip không lỗi");
  eq(backSrt.cues, cues, "SRT round-trip giữ nguyên");
  const backVtt = parseVtt(formatVtt(cues));
  eq(backVtt.errors, [], "VTT round-trip không lỗi");
  eq(backVtt.cues, cues, "VTT round-trip giữ nguyên");
});

// --- (2) Duplicate mang caption ---------------------------------------------
test("duplicate nguồn: caption + karaoke nhân bản theo, link tới id mới", () => {
  const s = spec([
    track("v1", "video", "v1", [
      { kind: "video", id: "src", src: "a.mp4", start: 0, duration: 10, in: 0, out: 10 } as Clip,
    ]),
    track("cap", "text", "Phụ đề 1", [
      capClip({
        id: "c1", start: 2, duration: 2, text: "xin chào",
        captionOf: { clipId: "src", mediaStart: 2, mediaEnd: 4 },
        karaoke: [
          { word: "xin", start: 0, end: 1 },
          { word: "chào", start: 1, end: 2 },
        ],
      }),
      capClip({ id: "c2", start: 5, duration: 2, text: "câu hai", captionOf: { clipId: "src", mediaStart: 5, mediaEnd: 7 } }),
    ]),
  ]);
  const r = duplicateClips(s, [{ trackId: "v1", clipId: "src" }], counterIdGen());
  assert(r !== null, "duplicate được");
  // Bản sao nguồn n1 (10-20) + 2 câu đính kèm = 3 selection.
  eq(r.duplicated.length, 3, "nguồn + 2 câu");
  const capTrack = r.spec.tracks.find((t) => t.id === "cap")!;
  eq(capTrack.clips.length, 4, "2 câu gốc + 2 câu mới");
  const copy1 = capTrack.clips.find((c) => c.id === "n2") as TextClip;
  const copy2 = capTrack.clips.find((c) => c.id === "n3") as TextClip;
  eq(copy1.start, 12, "câu 1 dịch đúng bằng độ dịch nguồn (+10)");
  eq(copy1.captionOf, { clipId: "n1", mediaStart: 2, mediaEnd: 4 }, "link tới nguồn mới, giữ đoạn media");
  eq(copy1.karaoke, [
    { word: "xin", start: 0, end: 1 },
    { word: "chào", start: 1, end: 2 },
  ], "karaoke giữ nguyên (clip-local + duration không đổi)");
  eq(copy2.start, 15, "câu 2 dịch +10");
  eq(copy2.captionOf?.clipId, "n1");
  // Câu gốc không bị đụng tới.
  const orig1 = capTrack.clips.find((c) => c.id === "c1") as TextClip;
  eq(orig1.start, 2);
  eq(orig1.captionOf?.clipId, "src");
});

test("duplicate 2 nguồn: mỗi câu bám theo độ dịch của nguồn mình", () => {
  const s = spec([
    track("v1", "video", "v1", [
      { kind: "video", id: "a", src: "a.mp4", start: 0, duration: 10, in: 0, out: 10 } as Clip,
      { kind: "video", id: "b", src: "b.mp4", start: 20, duration: 10, in: 0, out: 10 } as Clip,
    ]),
    track("cap", "text", "Phụ đề 1", [
      capClip({ id: "ca", start: 2, duration: 2, text: "câu A", captionOf: { clipId: "a", mediaStart: 2, mediaEnd: 4 } }),
      capClip({ id: "cb", start: 22, duration: 2, text: "câu B", captionOf: { clipId: "b", mediaStart: 2, mediaEnd: 4 } }),
    ]),
  ]);
  const r = duplicateClips(s, [
    { trackId: "v1", clipId: "a" },
    { trackId: "v1", clipId: "b" },
  ], counterIdGen());
  assert(r !== null, "duplicate được");
  // copyA 10-20 (shift +10), B bị đẩy 30-40, copyB 40-50 (shift +20).
  const capTrack = r.spec.tracks.find((t) => t.id === "cap")!;
  const copyA = capTrack.clips.find((c) => (c as TextClip).captionOf?.clipId === "n1") as TextClip;
  const copyB = capTrack.clips.find((c) => (c as TextClip).captionOf?.clipId === "n2") as TextClip;
  eq(copyA.start, 12, "câu A dịch +10");
  eq(copyB.start, 42, "câu B dịch +20 (đã tính cả lần đẩy do copyA)");
});

test("duplicate cả nguồn lẫn câu: không nhân đôi câu (chỉ bản đính kèm)", () => {
  const s = spec([
    track("v1", "video", "v1", [
      { kind: "video", id: "src", src: "a.mp4", start: 0, duration: 10, in: 0, out: 10 } as Clip,
    ]),
    track("cap", "text", "Phụ đề 1", [
      capClip({ id: "c1", start: 2, duration: 2, text: "xin chào", captionOf: { clipId: "src", mediaStart: 2, mediaEnd: 4 } }),
    ]),
  ]);
  const r = duplicateClips(s, [
    { trackId: "v1", clipId: "src" },
    { trackId: "cap", clipId: "c1" },
  ], counterIdGen());
  assert(r !== null, "duplicate được");
  eq(r.duplicated.length, 2, "nguồn + 1 câu đính kèm (không có bản trực tiếp)");
  const capTrack = r.spec.tracks.find((t) => t.id === "cap")!;
  eq(capTrack.clips.length, 2, "1 câu gốc + 1 câu mới");
  assert(!capTrack.clips.some((c) => c.start === 4), "không có bản trực tiếp ở 4 (ngay sau câu gốc)");
  assert(capTrack.clips.some((c) => c.start === 12), "chỉ có bản đính kèm ở 12");
});

test("duplicate câu đơn lẻ (nguồn không nhân bản cùng): hủy link thành chữ tự do", () => {
  const s = spec([
    track("v1", "video", "v1", [
      { kind: "video", id: "src", src: "a.mp4", start: 0, duration: 10, in: 0, out: 10 } as Clip,
    ]),
    track("cap", "text", "Phụ đề 1", [
      capClip({ id: "c1", start: 2, duration: 2, text: "xin chào", captionOf: { clipId: "src", mediaStart: 2, mediaEnd: 4 } }),
    ]),
  ]);
  const r = duplicateClips(s, [{ trackId: "cap", clipId: "c1" }], counterIdGen());
  assert(r !== null, "duplicate được");
  const capTrack = r.spec.tracks.find((t) => t.id === "cap")!;
  const copy = capTrack.clips.find((c) => c.id === "n1") as TextClip;
  eq(copy.start, 4, "bản sao ngay sau câu gốc");
  eq("captionOf" in copy, false, "link bị hủy (giống paste)");
});

// --- (3) Karaoke chính xác dưới speed curve ----------------------------------
const RAMP_LINEAR = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" as const },
    { t: 4, v: 2, easing: "linear" as const },
  ],
};
// speed(t) = 1 + t/4 → sourcePosAt(o) = o + o²/8; tiêu thụ 4s output = 6s nguồn.

test("karaoke ramp linear 1→2: từ map qua tích phân, khác hẳn tỉ lệ tuyến tính cũ", () => {
  const src = videoClip({
    id: "v", start: 0, in: 0, out: 10, duration: 4,
    speedKeyframes: RAMP_LINEAR,
  });
  const caps = linkSegmentsToClips(
    [{ start: 2, end: 4, text: "ramp" }],
    src,
    { ...STYLE },
    [[
      { start: 2, end: 3, word: "mot" },
      { start: 3, end: 4, word: "hai" },
    ]]
  );
  eq(caps.length, 1);
  eq(caps[0].start, 1.66, "câu bắt đầu 1.66 như mapMediaRangeToTimeline");
  eq(caps[0].duration, 1.27);
  // Tích phân: media 2→o=1.657, 3→o=2.325, 4→o=2.928; trừ base 1.66:
  // mot [0, 0.66], hai [0.66, 1.27]. Tỉ lệ tuyến tính cũ cho [0, 0.64] /
  // [0.64, 1.27] — sai 0.02s ở biên từ, đủ để test phân biệt.
  eq(caps[0].karaoke, [
    { word: "mot", start: 0, end: 0.66 },
    { word: "hai", start: 0.66, end: 1.27 },
  ]);
});

test("karaoke tốc độ hằng và clip ngược: map đúng cả 2 chiều", () => {
  // Xuôi, speed 2: segment [4,8] → câu [2,4]; từ [4,6]→[0,1], [6,8]→[1,2].
  const fwd = videoClip({ id: "v", start: 0, in: 0, out: 10, duration: 5, speed: 2 });
  const capsF = linkSegmentsToClips(
    [{ start: 4, end: 8, text: "nhanh" }],
    fwd,
    { ...STYLE },
    [[
      { start: 4, end: 6, word: "mot" },
      { start: 6, end: 8, word: "hai" },
    ]]
  );
  eq(capsF[0].start, 2);
  eq(capsF[0].karaoke, [
    { word: "mot", start: 0, end: 1 },
    { word: "hai", start: 1, end: 2 },
  ]);
  // Ngược, speed 2: segment [4,6] → câu [2,3]; phát ngược nên từ media
  // [5,6] hát trước ([0,0.5]), từ [4,5] hát sau ([0.5,1]).
  const rev = videoClip({ id: "v", start: 0, in: 0, out: 10, duration: 5, speed: 2, reverse: true });
  const capsR = linkSegmentsToClips(
    [{ start: 4, end: 6, text: "nguoc" }],
    rev,
    { ...STYLE },
    [[
      { start: 4, end: 5, word: "mot" },
      { start: 5, end: 6, word: "hai" },
    ]]
  );
  eq(capsR[0].start, 2);
  eq(capsR[0].karaoke, [
    { word: "hai", start: 0, end: 0.5 },
    { word: "mot", start: 0.5, end: 1 },
  ]);
});

test("karaokeForLinkedSegment trực tiếp: từ cắt dở giữ phần thấy được, từ ngoài hẳn thì rớt", () => {
  const src = videoClip({ id: "v", start: 0, in: 0, out: 10, duration: 10 });
  // Câu timeline [2,4] = media [2,4] (speed 1): từ [1.5,2.5] chỉ giữ [0,0.5],
  // từ [4.5,5.5] nằm hẳn ngoài câu nên rớt.
  const k = karaokeForLinkedSegment(src, 2, 2, [
    { start: 1.5, end: 2.5, word: "nua" },
    { start: 4.5, end: 5.5, word: "le" },
  ]);
  eq(k, [{ word: "nua", start: 0, end: 0.5 }]);
});

test("refollow trim trái tốc độ hằng: từ media 5 phải về clip-local 3 (không phải 4 của rescale cũ)", () => {
  const before = videoClip({ id: "v1", start: 0, in: 0, out: 10, duration: 10, speed: 1 });
  const caps = linkSegmentsToClips(
    [{ start: 0, end: 10, text: "dai" }],
    before,
    { ...STYLE },
    [[
      { start: 0, end: 5, word: "mot" },
      { start: 5, end: 10, word: "hai" },
    ]]
  );
  eq(caps[0].karaoke, [
    { word: "mot", start: 0, end: 5 },
    { word: "hai", start: 5, end: 10 },
  ]);
  // Trim trái 2s: start 0→2, in 0→2, duration 10→8.
  const after = videoClip({ id: "v1", start: 2, in: 2, out: 10, duration: 8, speed: 1 });
  const out = refollowCaptions(caps, after);
  eq((out[0] as TextClip).start, 2);
  eq((out[0] as TextClip).duration, 8);
  eq((out[0] as TextClip).karaoke, [
    { word: "mot", start: 0, end: 3 },
    { word: "hai", start: 3, end: 8 },
  ]);
});

test("refollow move trên ramp: karaoke giữ nguyên (dịch start, không đổi local)", () => {
  const before = videoClip({
    id: "v1", start: 0, in: 0, out: 10, duration: 4,
    speedKeyframes: RAMP_LINEAR,
  });
  const caps = linkSegmentsToClips(
    [{ start: 2, end: 4, text: "ramp" }],
    before,
    { ...STYLE },
    [[
      { start: 2, end: 3, word: "mot" },
      { start: 3, end: 4, word: "hai" },
    ]]
  );
  const after = videoClip({
    id: "v1", start: 5, in: 0, out: 10, duration: 4,
    speedKeyframes: RAMP_LINEAR,
  });
  const out = refollowCaptions(caps, after);
  eq((out[0] as TextClip).start, 6.66);
  eq((out[0] as TextClip).duration, 1.27);
  eq((out[0] as TextClip).karaoke, caps[0].karaoke);
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) {
  console.error(`Thua ở: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
