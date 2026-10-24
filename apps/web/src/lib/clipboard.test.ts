/**
 * clipboard.test.ts — Test thật cho copy/paste/duplicate clip (K2, Phase 6).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/clipboard.test.ts
 *
 * Chỉ test logic thuần trong clipboard.ts (không cần browser/DOM, không
 * cần store). Theo mẫu harness của assetStore.test.ts (không dùng node:test
 * để tsc của app không đòi @types/node).
 */
import { copyClips, duplicateClips, pasteClips } from "./clipboard.ts";
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

/** idGen xác định cho test: n1, n2, ... */
function counterIdGen(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `n${n}`;
  };
}

function videoClip(id: string, start: number, duration: number, extra: Partial<Clip> = {}): Clip {
  return {
    kind: "video", id, src: "a.mp4", start, duration, in: 0, out: duration, opacity: 1,
    ...extra,
  } as Clip;
}

function textClip(id: string, start: number, duration: number): Clip {
  return {
    kind: "text", id, text: "Hello", start, duration,
    style: { fontFamily: "Inter", fontSize: 48, color: "#fff", x: 0.5, y: 0.5 },
  } as Clip;
}

function track(id: string, kind: Track["kind"], clips: Clip[], flags: Partial<Track> = {}): Track {
  return { id, kind, label: id, clips, ...flags };
}

function spec(tracks: Track[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}

function main(): void {
  console.log("== copy ==");
  test("copy 1 clip: anchor + deep copy", () => {
    const s = spec([track("v1", "video", [videoClip("c1", 2, 5, { opacity: 0.5 })])]);
    const cb = copyClips(s, [{ trackId: "v1", clipId: "c1" }]);
    assert(cb !== null, "clipboard không null");
    eq(cb!.clips.length, 1, "số clip");
    eq(cb!.anchorStart, 2, "anchorStart");
    // Deep copy: sửa bản copy không động tới spec gốc.
    (cb!.clips[0].clip as { opacity?: number }).opacity = 0.9;
    eq((s.tracks[0].clips[0] as { opacity?: number }).opacity, 0.5, "spec gốc không đổi");
  });

  test("copy nhiều clip: thứ tự theo track rồi start", () => {
    const s = spec([
      track("v1", "video", [videoClip("c2", 10, 3), videoClip("c1", 0, 4)]),
      track("t1", "text", [textClip("tx1", 5, 2)]),
    ]);
    const cb = copyClips(s, [
      { trackId: "t1", clipId: "tx1" },
      { trackId: "v1", clipId: "c2" },
      { trackId: "v1", clipId: "c1" },
    ]);
    assert(cb !== null, "clipboard không null");
    eq(cb!.clips.map((c) => c.clip.id).join(","), "c1,c2,tx1", "thứ tự");
    eq(cb!.anchorStart, 0, "anchorStart = min start");
  });

  test("copy rỗng / id lạ -> null", () => {
    const s = spec([track("v1", "video", [videoClip("c1", 0, 4)])]);
    eq(copyClips(s, []), null, "selection rỗng");
    eq(copyClips(s, [{ trackId: "v1", clipId: "không-có" }]), null, "id lạ");
    eq(copyClips(s, [{ trackId: "không-có", clipId: "c1" }]), null, "track lạ");
  });

  console.log("== paste ==");
  test("paste không chồng: đặt tại playhead, giữ offset, id mới", () => {
    const s = spec([track("v1", "video", [videoClip("c1", 2, 4), videoClip("c2", 8, 3)])]);
    const cb = copyClips(s, [
      { trackId: "v1", clipId: "c1" },
      { trackId: "v1", clipId: "c2" },
    ])!;
    const r = pasteClips(s, cb, 20, counterIdGen());
    assert(r !== null, "paste được");
    eq(r!.pasted.length, 2, "2 clip dán");
    const clips = r!.spec.tracks[0].clips;
    eq(clips.length, 4, "tổng 4 clip");
    eq(clips[2].start, 20, "clip đầu tại playhead");
    eq(clips[3].start, 26, "clip sau giữ offset +6");
    assert(clips[2].id !== "c1" && clips[3].id !== "c2", "id mới");
    eq(r!.pasted[0].clipId, clips[2].id, "selection trả về khớp");
  });

  test("paste chồng clip: cả khối dịch sang phải qua clip chắn", () => {
    const s = spec([track("v1", "video", [
      videoClip("c1", 0, 4),
      videoClip("block", 10, 4),
    ])]);
    const cb = copyClips(s, [{ trackId: "v1", clipId: "c1" }])!;
    const r = pasteClips(s, cb, 12, counterIdGen());
    assert(r !== null, "paste được");
    eq(r!.spec.tracks[0].clips.find((c) => c.id === r!.pasted[0].clipId)!.start, 14, "dịch qua clip chắn [10,14)");
  });

  test("paste bỏ qua track khóa / ẩn / đã xóa", () => {
    const s = spec([
      track("v1", "video", [videoClip("c1", 0, 4)], { locked: true }),
      track("v2", "video", [videoClip("c2", 0, 4)], { hidden: true }),
      track("v3", "video", [videoClip("c3", 0, 4)]),
    ]);
    const cb = copyClips(s, [
      { trackId: "v1", clipId: "c1" },
      { trackId: "v2", clipId: "c2" },
      { trackId: "v3", clipId: "c3" },
    ])!;
    const r = pasteClips(s, cb, 20, counterIdGen());
    assert(r !== null, "vẫn paste được clip trên track thường");
    eq(r!.pasted.length, 1, "chỉ 1 clip");
    eq(r!.pasted[0].trackId, "v3", "đúng track v3");
    const onlyLocked = copyClips(s, [{ trackId: "v1", clipId: "c1" }])!;
    eq(pasteClips(s, onlyLocked, 20, counterIdGen()), null, "toàn track khóa -> null");
  });

  test("paste giữ transition nội bộ khối, strip transition ở biên", () => {
    const tr = { type: "fade" as const, duration: 1 };
    const s = spec([track("v1", "video", [
      videoClip("a", 0, 5, { transitionOut: tr }),
      videoClip("b", 5, 5, { transitionIn: tr }),
      videoClip("c", 20, 5, { transitionOut: tr }),
    ])]);
    const cb = copyClips(s, [
      { trackId: "v1", clipId: "a" },
      { trackId: "v1", clipId: "b" },
      { trackId: "v1", clipId: "c" },
    ])!;
    const r = pasteClips(s, cb, 40, counterIdGen());
    assert(r !== null, "paste được");
    const byId = new Map(r!.spec.tracks[0].clips.map((c) => [c.id, c]));
    const [pa, pb, pc] = r!.pasted.map((p) => byId.get(p.clipId)!);
    assert((pa as { transitionOut?: unknown }).transitionOut !== undefined, "a giữ transitionOut (nối với b)");
    assert((pb as { transitionIn?: unknown }).transitionIn !== undefined, "b giữ transitionIn (nối với a)");
    assert((pc as { transitionOut?: unknown }).transitionOut === undefined, "c strip transitionOut (không còn clip kề sau)");
  });

  test("paste 2 lần liên tiếp không chồng nhau", () => {
    const s = spec([track("v1", "video", [videoClip("c1", 0, 4)])]);
    const cb = copyClips(s, [{ trackId: "v1", clipId: "c1" }])!;
    const r1 = pasteClips(s, cb, 10, counterIdGen())!;
    const r2 = pasteClips(r1.spec, cb, 10, counterIdGen())!;
    const starts = r2.spec.tracks[0].clips.map((c) => c.start).sort((a, b) => a - b);
    eq(starts.join(","), "0,10,14", "lần 2 dịch qua lần 1");
  });

  console.log("== duplicate ==");
  test("duplicate 1 clip: copy ngay sau gốc, clip sau bị đẩy", () => {
    const s = spec([track("v1", "video", [
      videoClip("a", 0, 5),
      videoClip("b", 5, 5),
    ])]);
    const r = duplicateClips(s, [{ trackId: "v1", clipId: "a" }], counterIdGen());
    assert(r !== null, "dup được");
    const clips = r!.spec.tracks[0].clips;
    eq(clips.map((c) => `${c.id}@${c.start}`).join(","), "a@0,n1@5,b@10", "vị trí");
    eq(r!.duplicated.length, 1, "1 bản sao");
    eq(r!.duplicated[0].clipId, "n1", "selection là bản sao");
  });

  test("duplicate 2 clip kề nhau: A, copyA, B, copyB", () => {
    const s = spec([track("v1", "video", [
      videoClip("a", 0, 5),
      videoClip("b", 5, 5),
      videoClip("c", 10, 5),
    ])]);
    const r = duplicateClips(s, [
      { trackId: "v1", clipId: "a" },
      { trackId: "v1", clipId: "b" },
    ], counterIdGen());
    assert(r !== null, "dup được");
    eq(
      r!.spec.tracks[0].clips.map((c) => `${c.id}@${c.start}`).join(","),
      "a@0,n1@5,b@10,n2@15,c@20",
      "vị trí",
    );
  });

  test("duplicate giữ thuộc tính, strip transition, deep copy", () => {
    const s = spec([track("v1", "video", [
      videoClip("a", 0, 5, {
        opacity: 0.7,
        effects: [{ type: "blur", intensity: 0.5 }],
        transitionOut: { type: "fade", duration: 1 },
      }),
      videoClip("b", 5, 5),
    ])]);
    const r = duplicateClips(s, [{ trackId: "v1", clipId: "a" }], counterIdGen());
    assert(r !== null, "dup được");
    const copy = r!.spec.tracks[0].clips.find((c) => c.id === "n1")!;
    eq((copy as { opacity?: number }).opacity, 0.7, "giữ opacity");
    eq((copy as { effects?: unknown[] }).effects?.length, 1, "giữ effects");
    assert((copy as { transitionOut?: unknown }).transitionOut === undefined, "strip transitionOut");
    // Deep copy: sửa effects của bản sao không động tới gốc.
    ((copy as { effects: { intensity: number }[] }).effects[0].intensity = 0.1);
    eq(((s.tracks[0].clips[0] as { effects: { intensity: number }[] }).effects[0].intensity), 0.5, "gốc không đổi");
    // Gốc giữ transitionOut (giờ nối vào bản sao, vẫn kề nhau nên hợp lệ).
    assert((r!.spec.tracks[0].clips[0] as { transitionOut?: unknown }).transitionOut !== undefined, "gốc giữ transitionOut");
  });

  test("duplicate bỏ qua track khóa/ẩn, selection rỗng -> null", () => {
    const s = spec([
      track("v1", "video", [videoClip("a", 0, 5)], { locked: true }),
      track("v2", "video", [videoClip("b", 0, 5)], { hidden: true }),
    ]);
    eq(duplicateClips(s, [{ trackId: "v1", clipId: "a" }], counterIdGen()), null, "track khóa");
    eq(duplicateClips(s, [{ trackId: "v2", clipId: "b" }], counterIdGen()), null, "track ẩn");
    const s2 = spec([track("v1", "video", [videoClip("a", 0, 5)])]);
    eq(duplicateClips(s2, [], counterIdGen()), null, "selection rỗng");
    eq(duplicateClips(s2, [{ trackId: "v1", clipId: "không-có" }], counterIdGen()), null, "id lạ");
  });

  console.log("\n== paste mang caption (Phase 8 Q3) ==");
  // Câu link tới nguồn v, đoạn media 1..3, ở timeline 1..3.
  const linkedCap = (id: string, start: number): Clip => ({
    ...textClip(id, start, 2),
    captionOf: { clipId: "v", mediaStart: 1, mediaEnd: 3 },
  } as Clip);
  const capOf = (c: Clip): { clipId: string; mediaStart: number; mediaEnd: number } | undefined =>
    (c as { captionOf?: { clipId: string; mediaStart: number; mediaEnd: number } }).captionOf;

  test("paste mang caption: câu mới link id mới, cùng media, dịch theo shift", () => {
    const s = spec([
      track("v1", "video", [videoClip("v", 0, 10)]),
      track("t1", "text", [linkedCap("cap", 1)]),
    ]);
    const cb = copyClips(s, [{ trackId: "v1", clipId: "v" }]);
    assert(cb !== null && cb.captions.length === 1, "copy thu thập 1 caption đính kèm");
    const r = pasteClips(s, cb!, 20, counterIdGen());
    assert(r !== null, "paste được");
    eq(r!.pasted.length, 2, "selection gồm nguồn + câu mới");
    const nv = r!.spec.tracks[0].clips.find((c) => c.id === "n1")!;
    eq(nv.start, 20, "nguồn dán ở 20");
    const nc = r!.spec.tracks[1].clips.find((c) => c.id === "n2")!;
    eq(nc.start, 21, "câu dịch cùng shift (+20)");
    eq(nc.duration, 2, "câu giữ duration");
    eq(capOf(nc)?.clipId, "n1", "câu link tới id MỚI của nguồn");
    eq(capOf(nc)?.mediaStart, 1, "giữ mediaStart");
    eq(capOf(nc)?.mediaEnd, 3, "giữ mediaEnd");
    // Gốc không đổi (deep copy).
    eq(capOf(s.tracks[1].clips[0])?.clipId, "v", "câu gốc vẫn link v");
  });

  test("copy nguồn + câu cùng lúc: đúng 1 câu mới, không nhân đôi", () => {
    const s = spec([
      track("v1", "video", [videoClip("v", 0, 10)]),
      track("t1", "text", [linkedCap("cap", 1)]),
    ]);
    const cb = copyClips(s, [
      { trackId: "v1", clipId: "v" },
      { trackId: "t1", clipId: "cap" },
    ]);
    assert(cb !== null && cb.captions.length === 1, "câu đã chọn trực tiếp vẫn thu đính kèm (paste dedupe)");
    const r = pasteClips(s, cb!, 20, counterIdGen());
    assert(r !== null, "paste được");
    eq(r!.spec.tracks[1].clips.length, 2, "track chữ: gốc + đúng 1 câu mới");
    const nc = r!.spec.tracks[1].clips.find((c) => c.id !== "cap")!;
    eq(capOf(nc)?.clipId, "n1", "câu mới link id mới (không phải bản copy trực tiếp giữ link cũ)");
  });

  test("copy câu một mình: paste thành chữ tự do (hủy link)", () => {
    const s = spec([
      track("v1", "video", [videoClip("v", 0, 10)]),
      track("t1", "text", [linkedCap("cap", 1)]),
    ]);
    const cb = copyClips(s, [{ trackId: "t1", clipId: "cap" }]);
    assert(cb !== null, "copy được");
    const r = pasteClips(s, cb!, 21, counterIdGen());
    assert(r !== null, "paste được");
    const nc = r!.spec.tracks[1].clips.find((c) => c.id === "n1")!;
    eq(nc.start, 21, "chữ dán ở 21");
    assert(capOf(nc) === undefined, "đã hủy link (không trỏ về clip cũ)");
  });

  test("track caption khóa: nguồn vẫn dán, câu bị bỏ", () => {
    const s = spec([
      track("v1", "video", [videoClip("v", 0, 10)]),
      track("t1", "text", [linkedCap("cap", 1)], { locked: true }),
    ]);
    const cb = copyClips(s, [{ trackId: "v1", clipId: "v" }]);
    assert(cb !== null, "copy được từ track khóa (chỉ đọc)");
    const r = pasteClips(s, cb!, 20, counterIdGen());
    assert(r !== null, "paste được nguồn");
    eq(r!.pasted.length, 1, "chỉ nguồn được dán");
    eq(r!.spec.tracks[1].clips.length, 1, "track khóa không thêm câu");
  });

  test("paste caption tránh chồng lấn câu sẵn có: cả khối dịch thêm", () => {
    const s = spec([
      track("v1", "video", [videoClip("v", 0, 10)]),
      track("t1", "text", [linkedCap("cap", 1), textClip("old", 21, 2)]),
    ]);
    const cb = copyClips(s, [{ trackId: "v1", clipId: "v" }]);
    const r = pasteClips(s, cb!, 20, counterIdGen());
    assert(r !== null, "paste được");
    const nv = r!.spec.tracks[0].clips.find((c) => c.id === "n1")!;
    const nc = r!.spec.tracks[1].clips.find((c) => c.id === "n2")!;
    eq(nc.start, 23, "câu dịch tới sau câu sẵn có (21..23)");
    eq(nv.start, 22, "nguồn dịch cùng khối (+22 thay vì +20)");
    eq(capOf(nc)?.clipId, "n1", "câu vẫn link đúng nguồn mới");
  });

  test("paste mang caption khi nguồn có speedKeyframes: giữ curve + link mới", () => {
    const s = spec([
      track("v1", "video", [videoClip("v", 0, 10, {
        speedKeyframes: {
          keyframes: [
            { t: 0, v: 1, easing: "linear" },
            { t: 4, v: 2, easing: "linear" },
          ],
        },
      } as Partial<Clip>)]),
      track("t1", "text", [linkedCap("cap", 1)]),
    ]);
    const cb = copyClips(s, [{ trackId: "v1", clipId: "v" }]);
    const r = pasteClips(s, cb!, 20, counterIdGen());
    assert(r !== null, "paste được");
    const nv = r!.spec.tracks[0].clips.find((c) => c.id === "n1")!;
    eq(((nv as { speedKeyframes?: { keyframes: unknown[] } }).speedKeyframes?.keyframes.length), 2, "giữ nguyên curve");
    const nc = r!.spec.tracks[1].clips.find((c) => c.id === "n2")!;
    eq(capOf(nc)?.clipId, "n1", "câu link nguồn mới");
    eq(capOf(nc)?.mediaStart, 1, "giữ đoạn media (không tính lại tích phân)");
  });

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  if (fail > 0) {
    console.error("Failed:", failedNames.join(", "));
    process.exitCode = 1;
  }
}

main();
