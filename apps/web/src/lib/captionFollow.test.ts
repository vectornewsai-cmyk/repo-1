/**
 * captionFollow.test.ts — Test thật cho phụ đề bám theo clip nguồn (P6, Phase 7).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/captionFollow.test.ts
 *
 * Chỉ test logic thuần trong captionFollow.ts (không DOM/store).
 * Theo mẫu harness của clipboard.test.ts.
 */
import {
  isLinkedCaption,
  linkSegmentsToClips,
  mapMediaRangeToTimeline,
  refollowCaptions,
  shiftCaptionsForMovedClips,
  splitLinkedCaptions,
  unlinkCaption,
} from "./captionFollow.ts";
import type {
  AudioClip,
  TextClip,
  VideoClip,
  VideoSpec,
} from "@repo-1/video-spec";

/** Clip video/audio nguồn (khớp SourceClip trong captionFollow.ts). */
type SourceClip = VideoClip | AudioClip;

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

function near(a: number, b: number, eps = 0.011): void {
  if (Math.abs(a - b) > eps) throw new Error(`nhận ${a}, muốn ~${b}`);
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

function capClip(over: Partial<TextClip> & { id: string }): TextClip {
  return {
    kind: "text",
    text: "hello",
    start: 0,
    duration: 1,
    style: { ...STYLE },
    ...over,
  } as TextClip;
}

// --- mapMediaRangeToTimeline -------------------------------------------------
test("map xuôi: clip start=5 in=2 → media [3,5] ra timeline [6,8]", () => {
  const m = mapMediaRangeToTimeline(videoClip({ id: "v", start: 5, in: 2, out: 12 }), 3, 5);
  eq(m?.start, 6);
  eq(m?.duration, 2);
});

test("map speed=2: media [4,6] với in=2 → start=6, duration=1", () => {
  const m = mapMediaRangeToTimeline(
    videoClip({ id: "v", start: 5, in: 2, out: 12, speed: 2, duration: 5 }),
    4,
    6
  );
  eq(m?.start, 6);
  eq(m?.duration, 1);
});

test("map reverse: in=0 out=10 start=0 → media [2,4] ra timeline [6,8]", () => {
  const m = mapMediaRangeToTimeline(
    videoClip({ id: "v", start: 0, in: 0, out: 10, reverse: true }),
    2,
    4
  );
  eq(m?.start, 6);
  eq(m?.duration, 2);
});

test("map ngoài hẳn [in,out] → null", () => {
  const m = mapMediaRangeToTimeline(videoClip({ id: "v", in: 2, out: 10 }), 11, 13);
  eq(m, null);
});

test("map cắt dở: media [1,4] với in=2 → thu hẹp về [2,4]", () => {
  const m = mapMediaRangeToTimeline(videoClip({ id: "v", start: 0, in: 2, out: 10 }), 1, 4);
  eq(m?.start, 0);
  eq(m?.duration, 2);
  eq(m?.visStart, 2);
  eq(m?.visEnd, 4);
});

// --- linkSegmentsToClips -----------------------------------------------------
test("link: câu ngoài clip bị bỏ, câu trong giữ link media", () => {
  const src = videoClip({ id: "v1", start: 5, in: 2, out: 12 });
  const clips = linkSegmentsToClips(
    [
      { start: 0, end: 1, text: "ngoài" },
      { start: 3, end: 5, text: "trong" },
    ],
    src,
    { ...STYLE }
  );
  eq(clips.length, 1);
  eq(clips[0].text, "trong");
  eq(clips[0].start, 6);
  eq(clips[0].captionOf, { clipId: "v1", mediaStart: 3, mediaEnd: 5 });
});

// --- refollow: trim/move ----------------------------------------------------
test("refollow trim trái: in 0→2, câu [1,3] thu hẹp thành [2,3]", () => {
  const before = videoClip({ id: "v1", start: 0, in: 0, out: 10 });
  const caps = linkSegmentsToClips([{ start: 1, end: 3, text: "x" }], before, { ...STYLE });
  const after = videoClip({ id: "v1", start: 2, in: 2, out: 10, duration: 8 });
  const out = refollowCaptions(caps, after);
  eq(out.length, 1);
  const c = out[0] as TextClip;
  eq(c.start, 2);
  eq(c.duration, 1);
  eq(c.captionOf, { clipId: "v1", mediaStart: 2, mediaEnd: 3 });
});

test("refollow trim trái: câu [0.5,1.5] nằm hẳn trước in=2 → bị xoá", () => {
  const before = videoClip({ id: "v1", start: 0, in: 0, out: 10 });
  const caps = linkSegmentsToClips([{ start: 0.5, end: 1.5, text: "x" }], before, {
    ...STYLE,
  });
  const after = videoClip({ id: "v1", start: 2, in: 2, out: 10, duration: 8 });
  eq(refollowCaptions(caps, after).length, 0);
});

test("refollow trim phải: out 10→6, câu [7,9] bị xoá, câu [5,7] thu hẹp [5,6]", () => {
  const before = videoClip({ id: "v1", start: 0, in: 0, out: 10 });
  const caps = linkSegmentsToClips(
    [
      { start: 5, end: 7, text: "nửa" },
      { start: 7, end: 9, text: "ngoài" },
    ],
    before,
    { ...STYLE }
  );
  const after = videoClip({ id: "v1", start: 0, in: 0, out: 6, duration: 6 });
  const out = refollowCaptions(caps, after);
  eq(out.length, 1);
  const c = out[0] as TextClip;
  eq(c.text, "nửa");
  eq(c.start, 5);
  eq(c.duration, 1);
  eq(c.captionOf, { clipId: "v1", mediaStart: 5, mediaEnd: 6 });
});

test("refollow move: start 0→3 → mọi câu dịch +3, captionOf không đổi", () => {
  const before = videoClip({ id: "v1", start: 0, in: 0, out: 10 });
  const caps = linkSegmentsToClips([{ start: 2, end: 4, text: "x" }], before, {
    ...STYLE,
  });
  const after = videoClip({ id: "v1", start: 3, in: 0, out: 10 });
  const out = refollowCaptions(caps, after);
  eq((out[0] as TextClip).start, 5);
  eq((out[0] as TextClip).captionOf, { clipId: "v1", mediaStart: 2, mediaEnd: 4 });
});

test("refollow speed: speed 1→2, câu [2,4] co lại một nửa", () => {
  const before = videoClip({ id: "v1", start: 0, in: 0, out: 10 });
  const caps = linkSegmentsToClips([{ start: 2, end: 4, text: "x" }], before, {
    ...STYLE,
  });
  const after = videoClip({ id: "v1", start: 0, in: 0, out: 10, speed: 2, duration: 5 });
  const out = refollowCaptions(caps, after);
  eq((out[0] as TextClip).start, 1);
  eq((out[0] as TextClip).duration, 1);
});

test("refollow không đụng câu link clip khác hoặc chữ gõ tay", () => {
  const other = capClip({
    id: "c2",
    start: 9,
    duration: 1,
    captionOf: { clipId: "khác", mediaStart: 9, mediaEnd: 10 },
  });
  const free = capClip({ id: "c3", start: 3, duration: 1 });
  const after = videoClip({ id: "v1", start: 5, in: 0, out: 10 });
  const out = refollowCaptions([other, free], after);
  eq((out[0] as TextClip).start, 9);
  eq((out[1] as TextClip).start, 3);
});

// --- split -------------------------------------------------------------------
test("split: câu vắt qua điểm cắt tách thành 2, mỗi nửa link đúng clip", () => {
  const orig = videoClip({ id: "v1", start: 0, in: 0, out: 10 });
  const caps = linkSegmentsToClips([{ start: 4, end: 6, text: "vắt" }], orig, {
    ...STYLE,
  });
  const left = videoClip({ id: "vL", start: 0, in: 0, out: 5, duration: 5 });
  const right = videoClip({ id: "vR", start: 5, in: 5, out: 10, duration: 5 });
  const out = splitLinkedCaptions(caps, "v1", left, right);
  eq(out.length, 2);
  const [a, b] = out as TextClip[];
  eq(a.captionOf, { clipId: "vL", mediaStart: 4, mediaEnd: 5 });
  eq(a.start, 4);
  eq(a.duration, 1);
  eq(b.captionOf, { clipId: "vR", mediaStart: 5, mediaEnd: 6 });
  eq(b.start, 5);
  eq(b.duration, 1);
  if (a.id === b.id) throw new Error("2 nửa tách phải có id khác nhau");
});

test("split reverse: câu vắt qua điểm cắt vẫn tách đúng 2 phía", () => {
  const orig = videoClip({ id: "v1", start: 0, in: 0, out: 10, reverse: true });
  const caps = linkSegmentsToClips([{ start: 4, end: 6, text: "vắt" }], orig, {
    ...STYLE,
  });
  // Timeline 0..10, reverse: điểm cắt timeline 5 ↔ media 5.
  const left = videoClip({ id: "vL", start: 0, in: 0, out: 5, duration: 5, reverse: true });
  const right = videoClip({ id: "vR", start: 5, in: 5, out: 10, duration: 5, reverse: true });
  const out = splitLinkedCaptions(caps, "v1", left, right);
  eq(out.length, 2);
  // Nửa trái (timeline 0..5) chứa media [0,5] phát ngược → câu [4,5] ở cuối nửa trái.
  const [a, b] = out as TextClip[];
  eq(a.captionOf, { clipId: "vL", mediaStart: 4, mediaEnd: 5 });
  eq(a.start, 0); // reverse: media 5 ↔ offset 0
  eq(b.captionOf, { clipId: "vR", mediaStart: 5, mediaEnd: 6 });
  eq(b.start, 9); // reverse: media 6 ↔ offset (10-6)=4 → 5+4=9
});

// --- shiftCaptionsForMovedClips (ripple) -------------------------------------
test("ripple: clip sau bị dồn -2s thì câu bám theo cũng -2s", () => {
  // Spec mới sau ripple: clip nguồn đã dồn 10→8, nhưng câu phụ đề vẫn còn
  // ở vị trí cũ (11) vì ripple không chạm tới nó — hàm phải dịch nó về 9.
  const mkSpec = (startV: number, startCap: number): VideoSpec => ({
    version: "0.2.0",
    meta: { name: "t", width: 640, height: 360, fps: 30 },
    tracks: [
      {
        id: "tv",
        kind: "video",
        clips: [videoClip({ id: "v2", start: startV, in: 0, out: 10 })],
      },
      {
        id: "tt",
        kind: "text",
        clips: [
          capClip({
            id: "c1",
            start: startCap,
            duration: 1,
            captionOf: { clipId: "v2", mediaStart: 1, mediaEnd: 2 },
          }),
        ],
      },
    ],
  });
  const out = shiftCaptionsForMovedClips(mkSpec(10, 11), mkSpec(8, 11));
  const cap = out.tracks[1].clips[0] as TextClip;
  eq(cap.start, 9);
});

// --- unlink ------------------------------------------------------------------
test("unlinkCaption: xoá link, giữ nguyên start/duration/text", () => {
  const c = capClip({
    id: "c1",
    start: 4,
    duration: 2,
    captionOf: { clipId: "v1", mediaStart: 4, mediaEnd: 6 },
  });
  const u = unlinkCaption(c);
  eq("captionOf" in u, false);
  eq(u.start, 4);
  eq(u.text, "hello");
  if (isLinkedCaption(u)) throw new Error("sau unlink không còn là linked caption");
});

// --- project-level: trim/move thật trên spec ----------------------------------
test("project: trim + move liên tiếp, caption khớp thời gian mới", () => {
  // Project: video clip start=0 in=0 out=10 + 3 câu [1,2] [4,6] [8,9].
  const src0 = videoClip({ id: "v1", start: 0, in: 0, out: 10 });
  let caps = linkSegmentsToClips(
    [
      { start: 1, end: 2, text: "một" },
      { start: 4, end: 6, text: "hai" },
      { start: 8, end: 9, text: "ba" },
    ],
    src0,
    { ...STYLE }
  );
  // Trim trái 3s: start=3 in=3 → câu "một" [1,2] mất, "hai" còn nguyên.
  const src1 = videoClip({ id: "v1", start: 3, in: 3, out: 10, duration: 7 });
  caps = refollowCaptions(caps, src1) as TextClip[];
  eq(caps.map((c) => c.text), ["hai", "ba"]);
  eq(caps[0].start, 4); // media 4 → timeline 3 + (4-3) = 4
  eq(caps[1].start, 8);
  // Move +2s: start=5 → câu dịch +2.
  const src2 = videoClip({ id: "v1", start: 5, in: 3, out: 10, duration: 7 });
  caps = refollowCaptions(caps, src2) as TextClip[];
  eq(caps[0].start, 6);
  eq(caps[1].start, 10);
  // Kiểm tra không còn câu nào nằm ngoài clip [5,12).
  for (const c of caps) {
    if (c.start < 5 || c.start + c.duration > 12 + 0.01)
      throw new Error(`câu "${c.text}" nằm ngoài clip sau edit`);
  }
  near(caps[0].duration, 2);
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) {
  console.error(`Thua ở: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
