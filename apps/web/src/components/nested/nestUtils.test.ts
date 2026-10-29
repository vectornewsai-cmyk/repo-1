/**
 * nestUtils.test.ts — Test thật cho logic gom/rã nested clip + adjustment layer (N4, Phase 9).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/nested/nestUtils.test.ts
 *
 * Chỉ test logic thuần trong nestUtils.ts (không cần browser/DOM, không cần
 * store). Theo mẫu harness của lib/clipboard.test.ts (không dùng node:test
 * để tsc của app không đòi @types/node).
 */
import {
  addAdjustmentLayer,
  addSpecAdjustmentLayer,
  convertLegacyLayerToSpec,
  deleteAdjustmentLayer,
  deleteSpecAdjustmentLayer,
  isAdjustmentLayer,
  isNestedClip,
  legacyLayerToSpec,
  listAdjustmentLayers,
  listNestedClips,
  listSpecAdjustmentLayers,
  listUnifiedAdjustmentLayers,
  moveAdjustmentLayer,
  nestClips,
  nestedInnerCount,
  readNestedBoundary,
  setNestedClipBoundary,
  specLayerToLegacy,
  trimAdjustmentLayer,
  unnestClip,
  updateAdjustmentLayer,
  updateNestedInnerClip,
  updateSpecAdjustmentLayer,
} from "./nestUtils.ts";
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

function videoClip(id: string, start: number, duration: number): Clip {
  return {
    kind: "video", id, src: "a.mp4", start, duration, in: 0, out: duration, opacity: 1,
  } as Clip;
}

function audioClip(id: string, start: number, duration: number): Clip {
  return {
    kind: "audio", id, src: "a.mp3", start, duration, in: 0, out: duration, volume: 1,
  } as Clip;
}

function specWith(tracks: Track[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "Test", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}

test("nest 2 clip: nested clip đúng start/duration, clip gốc biến mất khỏi timeline", () => {
  const spec = specWith([
    { id: "v1", kind: "video", label: "Video 1", clips: [videoClip("c1", 2, 3), videoClip("c2", 6, 2)] },
  ]);
  const res = nestClips(spec, [{ trackId: "v1", clipId: "c1" }, { trackId: "v1", clipId: "c2" }], counterIdGen(), "Compound 1");
  assert(!("error" in res), `mong thành công, nhận ${JSON.stringify(res)}`);
  eq(res.nested.start, 2, "nested.start");
  eq(res.nested.duration, 6, "nested.duration (8 - 2)");
  eq(res.nestedTrackId, "v1", "nestedTrackId");
  eq(res.spec.tracks[0].clips.length, 1, "chỉ còn 1 clip trên timeline");
  assert(isNestedClip(res.spec.tracks[0].clips[0]), "clip còn lại phải là nested");
});

test("nest: subSpec rebase về 0, giữ đúng track gốc", () => {
  const spec = specWith([
    { id: "v1", kind: "video", label: "Video 1", clips: [videoClip("c1", 2, 3)] },
    { id: "a1", kind: "audio", label: "Audio 1", clips: [audioClip("c9", 3, 4)] },
  ]);
  const res = nestClips(spec, [{ trackId: "v1", clipId: "c1" }, { trackId: "a1", clipId: "c9" }], counterIdGen(), "Mix");
  assert(!("error" in res), `mong thành công, nhận ${JSON.stringify(res)}`);
  eq(res.nested.subSpec.tracks.length, 2, "subSpec có 2 track");
  eq(res.nested.subSpec.tracks[0].clips[0].start, 0, "clip video rebase về 0");
  eq(res.nested.subSpec.tracks[1].clips[0].start, 1, "clip audio rebase (3 - 2)");
  eq(nestedInnerCount(res.nested), 2, "inner count");
});

test("nest: từ chối khi chọn < 2 clip", () => {
  const spec = specWith([{ id: "v1", kind: "video", clips: [videoClip("c1", 0, 3)] }]);
  const res = nestClips(spec, [{ trackId: "v1", clipId: "c1" }], counterIdGen(), "X");
  assert("error" in res, "phải trả error");
});

test("nest: từ chối clip không tồn tại và track khóa", () => {
  const spec = specWith([
    { id: "v1", kind: "video", clips: [videoClip("c1", 0, 3)] },
    { id: "v2", kind: "video", locked: true, clips: [videoClip("c2", 0, 3)] },
  ]);
  const missing = nestClips(spec, [{ trackId: "v1", clipId: "c1" }, { trackId: "v1", clipId: "zz" }], counterIdGen(), "X");
  assert("error" in missing, "clip không tồn tại phải error");
  const locked = nestClips(spec, [{ trackId: "v1", clipId: "c1" }, { trackId: "v2", clipId: "c2" }], counterIdGen(), "X");
  assert("error" in locked, "track khóa phải error");
});

test("unnest: khôi phục đúng vị trí + track gốc, nested clip biến mất", () => {
  const spec = specWith([
    { id: "v1", kind: "video", label: "Video 1", clips: [videoClip("c1", 2, 3), videoClip("c2", 6, 2)] },
  ]);
  const nested = nestClips(spec, [{ trackId: "v1", clipId: "c1" }, { trackId: "v1", clipId: "c2" }], counterIdGen(), "C");
  assert(!("error" in nested), "nest phải thành công");
  const back = unnestClip(nested.spec, "v1", nested.nested.id, counterIdGen());
  assert(!("error" in back), `unnest phải thành công, nhận ${JSON.stringify(back)}`);
  eq(back.restoredCount, 2, "restoredCount");
  const clips = back.spec.tracks[0].clips;
  eq(clips.length, 2, "2 clip gốc trở lại");
  eq(clips[0].start, 2, "clip 1 về đúng start");
  eq(clips[1].start, 6, "clip 2 về đúng start");
  assert(!clips.some((c) => isNestedClip(c)), "không còn nested clip");
});

test("unnest: từ chối khi clip khôi phục đè lên clip khác", () => {
  const spec = specWith([
    { id: "v1", kind: "video", clips: [videoClip("c1", 2, 3), videoClip("c2", 6, 2)] },
  ]);
  const nested = nestClips(spec, [{ trackId: "v1", clipId: "c1" }, { trackId: "v1", clipId: "c2" }], counterIdGen(), "C");
  assert(!("error" in nested), "nest phải thành công");
  // Chèn clip lạ vào đúng khoảng của clip gốc c1 (2..5) rồi mới rã.
  const tampered: VideoSpec = {
    ...nested.spec,
    tracks: nested.spec.tracks.map((t) =>
      t.id === "v1" ? { ...t, clips: [...t.clips, videoClip("cx", 3, 1)] } : t,
    ),
  };
  const back = unnestClip(tampered, "v1", nested.nested.id, counterIdGen());
  assert("error" in back, "đè clip khác phải error, không được rã nửa vời");
});

test("adjustment layer: thêm được, list được, từ chối khi đè layer khác", () => {
  const spec = specWith([{ id: "v1", kind: "video", clips: [videoClip("c1", 0, 10)] }]);
  const first = addAdjustmentLayer(spec, "grayscale", 0.5, 2, 4, counterIdGen());
  assert(!("error" in first), `thêm layer phải thành công, nhận ${JSON.stringify(first)}`);
  eq(first.hostTrackId, "v1", "host là track video đầu tiên");
  assert(isAdjustmentLayer(first.layer), "layer đúng kind");
  eq(listAdjustmentLayers(first.spec).length, 1, "list có 1 layer");
  const clash = addAdjustmentLayer(first.spec, "sepia", 0.5, 5, 2, counterIdGen());
  assert("error" in clash, "đè layer khác phải error");
  const ok = addAdjustmentLayer(first.spec, "sepia", 0.5, 6, 2, counterIdGen());
  assert(!("error" in ok), "không đè thì được thêm");
});

test("adjustment layer: từ chối khi không có track video / duration quá ngắn", () => {
  const noVideo = specWith([{ id: "a1", kind: "audio", clips: [audioClip("c1", 0, 5)] }]);
  const r1 = addAdjustmentLayer(noVideo, "blur", 0.5, 0, 3, counterIdGen());
  assert("error" in r1, "không có track video phải error");
  const spec = specWith([{ id: "v1", kind: "video", clips: [] }]);
  const r2 = addAdjustmentLayer(spec, "blur", 0.5, 0, 0.1, counterIdGen());
  assert("error" in r2, "duration < 0.2 phải error");
});

test("deleteAdjustmentLayer: chỉ gỡ layer, clip thường giữ nguyên", () => {
  const spec = specWith([{ id: "v1", kind: "video", clips: [videoClip("c1", 0, 10)] }]);
  const added = addAdjustmentLayer(spec, "blur", 0.5, 1, 3, counterIdGen());
  assert(!("error" in added), "thêm layer phải thành công");
  const after = deleteAdjustmentLayer(added.spec, "v1", added.layer.id);
  assert(after !== null, "xoá phải thành công");
  eq(after!.tracks[0].clips.length, 1, "chỉ còn clip thường");
  eq(listAdjustmentLayers(after!).length, 0, "không còn layer");
  const wrong = deleteAdjustmentLayer(added.spec, "v1", "c1");
  assert(wrong === null, "xoá clip thường bằng hàm này phải trả null");
});

test("guards: phân biệt đúng nested / adjustment / clip thường", () => {
  const spec = specWith([{ id: "v1", kind: "video", clips: [videoClip("c1", 0, 10)] }]);
  const added = addAdjustmentLayer(spec, "blur", 0.5, 1, 3, counterIdGen());
  assert(!("error" in added), "thêm layer phải thành công");
  const nested = nestClips(spec, [], counterIdGen(), "X");
  assert("error" in nested, "nest rỗng phải error");
  assert(!isNestedClip(videoClip("x", 0, 1)), "clip video không phải nested");
  assert(!isAdjustmentLayer(videoClip("x", 0, 1)), "clip video không phải adjustment");
  assert(isAdjustmentLayer(added.layer), "layer nhận đúng kind");
  eq(listNestedClips(spec).length, 0, "spec chưa có nested clip");
});

// ---- R5: kéo/trim/sửa layer trên hàng FX + sửa clip con ----

function specWithLayer(): { spec: VideoSpec; layerId: string; idGen: () => string } {
  const spec = specWith([{ id: "v1", kind: "video", clips: [videoClip("c1", 0, 10)] }]);
  // Dùng CHUNG một idGen cho cả setup lẫn layer thứ hai trong test — dùng
  // counter riêng cho mỗi lần add sẽ cấp trùng id "n1" cho cả hai layer
  // (lỗi setup test, không phải lỗi code: production dùng uid("c")).
  const idGen = counterIdGen();
  const added = addAdjustmentLayer(spec, "grayscale", 0.5, 2, 4, idGen);
  assert(!("error" in added), "setup: thêm layer phải thành công");
  return { spec: added.spec, layerId: added.layer.id, idGen };
}

test("R5 move layer: dời được, clip thường giữ nguyên, không ripple", () => {
  const { spec, layerId } = specWithLayer();
  const moved = moveAdjustmentLayer(spec, "v1", layerId, 5);
  assert(!("error" in moved), `dời layer phải thành công, nhận ${JSON.stringify(moved)}`);
  eq(moved.layer.start, 5, "layer.start mới");
  eq(moved.layer.duration, 4, "duration giữ nguyên");
  eq(moved.spec.tracks[0].clips.length, 2, "vẫn 2 clip (video + layer)");
  const video = moved.spec.tracks[0].clips.find((c) => c.id === "c1")!;
  eq(video.start, 0, "clip video không bị dời theo");
});

test("R5 move layer: từ chối start âm, đè layer khác, track khóa", () => {
  const { spec, layerId, idGen } = specWithLayer();
  const neg = moveAdjustmentLayer(spec, "v1", layerId, -1);
  assert("error" in neg, "start âm phải error");
  const second = addAdjustmentLayer(spec, "sepia", 0.5, 7, 2, idGen);
  assert(!("error" in second), "thêm layer thứ hai phải thành công");
  const clash = moveAdjustmentLayer(second.spec, "v1", layerId, 6);
  assert("error" in clash, "dời đè layer khác phải error");
  const locked: VideoSpec = {
    ...spec,
    tracks: spec.tracks.map((t) => (t.id === "v1" ? { ...t, locked: true } : t)),
  };
  const lockedRes = moveAdjustmentLayer(locked, "v1", layerId, 5);
  assert("error" in lockedRes, "track khóa phải error");
});

test("R5 trim layer: mép phải dài ra được, mép trái dời start được, chặn đè + dưới 0.2s", () => {
  const { spec, layerId, idGen } = specWithLayer();
  const right = trimAdjustmentLayer(spec, "v1", layerId, "right", 8);
  assert(!("error" in right), "trim phải phải thành công");
  eq(right.layer.duration, 6, "duration 2..8");
  const left = trimAdjustmentLayer(spec, "v1", layerId, "left", 3);
  assert(!("error" in left), "trim trái phải thành công");
  eq(left.layer.start, 3, "start mới");
  eq(left.layer.duration, 3, "duration 3..6");
  const tooShort = trimAdjustmentLayer(spec, "v1", layerId, "right", 2.1);
  assert("error" in tooShort, "duration < 0.2 phải error");
  const negStart = trimAdjustmentLayer(spec, "v1", layerId, "left", -0.5);
  assert("error" in negStart, "start âm phải error");
  const second = addAdjustmentLayer(spec, "sepia", 0.5, 7, 2, idGen);
  assert(!("error" in second), "setup layer thứ hai");
  const clash = trimAdjustmentLayer(second.spec, "v1", layerId, "right", 8);
  assert("error" in clash, "trim đè layer khác phải error");
});

test("R5 update layer: đặt start+duration một lần, chặn đè layer khác", () => {
  const { spec, layerId, idGen } = specWithLayer();
  const ok = updateAdjustmentLayer(spec, "v1", layerId, 1, 3);
  assert(!("error" in ok), "update phải thành công");
  eq(ok.layer.start, 1, "start mới");
  eq(ok.layer.duration, 3, "duration mới");
  const second = addAdjustmentLayer(spec, "sepia", 0.5, 7, 2, idGen);
  assert(!("error" in second), "setup layer thứ hai");
  const clash = updateAdjustmentLayer(second.spec, "v1", layerId, 6, 3);
  assert("error" in clash, "update đè layer khác phải error");
});

function textClip(id: string, start: number, duration: number, text: string): Clip {
  return { kind: "text", id, text, start, duration } as Clip;
}

function specWithNested(): { spec: VideoSpec; nestedId: string } {
  const spec = specWith([
    {
      id: "v1", kind: "video", label: "Video 1",
      clips: [videoClip("c1", 2, 3), textClip("t1", 6, 2, "Xin chào")],
    },
  ]);
  const nested = nestClips(spec, [{ trackId: "v1", clipId: "c1" }, { trackId: "v1", clipId: "t1" }], counterIdGen(), "C");
  assert(!("error" in nested), "setup: nest phải thành công");
  return { spec: nested.spec, nestedId: nested.nested.id };
}

test("R5 sửa clip con: dời start + đổi duration trong compound clip được, in/out giữ nguyên", () => {
  const { spec, nestedId } = specWithNested();
  // Clip con c1 đang ở 0..3 trong compound clip dài 6 (2..8 ngoài).
  const res = updateNestedInnerClip(spec, "v1", nestedId, "v1", "c1", { start: 1, duration: 2 });
  assert(!("error" in res), `sửa clip con phải thành công, nhận ${JSON.stringify(res)}`);
  const inner = res.nested.subSpec.tracks[0].clips.find((c) => c.id === "c1")!;
  eq(inner.start, 1, "inner start mới");
  eq(inner.duration, 2, "inner duration mới");
  eq((inner as { in: number }).in, 0, "in nguồn giữ nguyên");
  eq((inner as { out: number }).out, 3, "out nguồn giữ nguyên");
  eq(res.nested.duration, 6, "duration compound clip ngoài không đổi");
  const outer = res.spec.tracks[0].clips.find((c) => c.id === nestedId)!;
  eq(outer.start, 2, "compound clip ngoài không bị dời");
});

test("R5 sửa clip con: sửa text clip chữ được, sửa text trên clip video bị từ chối", () => {
  const { spec, nestedId } = specWithNested();
  const ok = updateNestedInnerClip(spec, "v1", nestedId, "v1", "t1", { text: "Tạm biệt" });
  assert(!("error" in ok), "sửa text phải thành công");
  const inner = ok.nested.subSpec.tracks[0].clips.find((c) => c.id === "t1")!;
  eq((inner as { text: string }).text, "Tạm biệt", "text mới");
  const bad = updateNestedInnerClip(spec, "v1", nestedId, "v1", "c1", { text: "không được" });
  assert("error" in bad, "sửa text trên clip video phải error");
});

test("R5 sửa clip con: từ chối vượt ngoài compound clip, đè clip khác, track khóa", () => {
  const { spec, nestedId } = specWithNested();
  const over = updateNestedInnerClip(spec, "v1", nestedId, "v1", "c1", { start: 5, duration: 2 });
  assert("error" in over, "end 7 > duration compound 6 phải error");
  const clash = updateNestedInnerClip(spec, "v1", nestedId, "v1", "c1", { start: 3, duration: 2 });
  assert("error" in clash, "đè clip t1 (4..6 trong) phải error");
  const locked: VideoSpec = {
    ...spec,
    tracks: spec.tracks.map((t) => (t.id === "v1" ? { ...t, locked: true } : t)),
  };
  const lockedRes = updateNestedInnerClip(locked, "v1", nestedId, "v1", "c1", { start: 1 });
  assert("error" in lockedRes, "host track khóa phải error");
  const missing = updateNestedInnerClip(spec, "v1", nestedId, "v1", "zz", { start: 1 });
  assert("error" in missing, "clip con không tồn tại phải error");
});

// ---- R7: layer chuẩn spec + converter legacy + boundary nested ----

function specWithVideo(): VideoSpec {
  return specWith([
    { id: "v1", kind: "video", label: "Video 1", clips: [videoClip("c1", 0, 10)] },
    { id: "v2", kind: "video", label: "Video 2", clips: [videoClip("c2", 0, 10)] },
  ]);
}

test("R7 legacy->spec: grayscale 0.5 thành filters effects duy nhất, giữ id/thời gian", () => {
  const spec = specWithVideo();
  const added = addAdjustmentLayer(spec, "grayscale", 0.5, 2, 4, counterIdGen());
  assert(!("error" in added), "setup legacy phải thành công");
  const conv = legacyLayerToSpec(added.layer, "all");
  assert(!("error" in conv), `convert phải thành công, nhận ${JSON.stringify(conv)}`);
  eq(conv.layer.id, added.layer.id, "giữ id");
  eq(conv.layer.start, 2, "giữ start");
  eq(conv.layer.duration, 4, "giữ duration");
  eq(conv.layer.filters.length, 1, "1 filter entry");
  eq(conv.layer.filters[0].effects!.length, 1, "1 effect");
  eq(conv.layer.filters[0].effects![0].type, "grayscale", "đúng effect");
  eq(conv.layer.filters[0].effects![0].intensity, 0.5, "đúng intensity");
});

test("R7 legacy->spec: filter lạ bị chặn; scope một track ghi được tracks (parent tích hợp đợt 7)", () => {
  const bad = legacyLayerToSpec(
    { kind: "adjustment", id: "x", start: 0, duration: 2, filterType: "khong-co", intensity: 0.5 },
    "all",
  );
  assert("error" in bad, "filter lạ phải error");
  const spec = specWithVideo();
  const added = addAdjustmentLayer(spec, "blur", 0.5, 0, 3, counterIdGen());
  assert(!("error" in added), "setup legacy phải thành công");
  const scoped = legacyLayerToSpec(added.layer, { trackIndices: [0] });
  assert(!("error" in scoped), `scope một track phải ghi được, nhận ${JSON.stringify(scoped)}`);
  eq((scoped as { layer: { tracks?: number[] } }).layer.tracks!.join(","), "0", "ghi tracks=[0]");
  const scopedEmpty = legacyLayerToSpec(added.layer, { trackIndices: [] });
  assert("error" in scopedEmpty, "scope rỗng phải error");
});

test("R7 spec->legacy: layer đơn effect đọc lại được, layer phức tạp trả null", () => {
  const single = {
    id: "s1", start: 1, duration: 3,
    filters: [{ effects: [{ type: "sepia" as const, intensity: 0.7 }] }],
  };
  const back = specLayerToLegacy(single);
  assert(back !== null, "layer đơn effect phải đọc lại được");
  eq(back!.filterType, "sepia", "đúng filter");
  eq(back!.intensity, 0.7, "đúng intensity");
  const complex = {
    id: "s2", start: 0, duration: 2,
    filters: [{ lut: "noir" as never }],
  };
  assert(specLayerToLegacy(complex) === null, "layer LUT phải trả null (phức tạp)");
  const multi = {
    id: "s3", start: 0, duration: 2,
    filters: [{ effects: [{ type: "blur" as const }, { type: "sepia" as const }] }],
  };
  assert(specLayerToLegacy(multi) === null, "layer nhiều effect phải trả null");
});

test("R7 addSpec: ghi vào adjustmentLayers, không tạo clip kind adjustment, chồng nhau được", () => {
  const spec = specWithVideo();
  // Dùng CHUNG idGen cho cả hai lần add (idGen riêng sẽ cấp trùng "n1").
  const sharedIdGen = counterIdGen();
  const first = addSpecAdjustmentLayer(
    spec, { filterType: "grayscale", intensity: 0.5, start: 2, duration: 4, scope: "all" }, sharedIdGen,
  );
  assert(!("error" in first), `addSpec phải thành công, nhận ${JSON.stringify(first)}`);
  eq(first.spec.adjustmentLayers!.length, 1, "1 layer spec");
  eq(listAdjustmentLayers(first.spec).length, 0, "không có clip legacy mới");
  eq(first.spec.tracks[0].clips.length, 1, "track không thêm clip");
  // Spec cho phép chồng nhau (nối filter tuần tự) — khác luật legacy cấm đè.
  const second = addSpecAdjustmentLayer(
    first.spec, { filterType: "sepia", intensity: 0.5, start: 3, duration: 4, scope: "all" }, sharedIdGen,
  );
  assert(!("error" in second), "layer spec chồng nhau phải được (ngữ nghĩa spec)");
  eq(second.spec.adjustmentLayers!.length, 2, "2 layer spec");
  eq(listSpecAdjustmentLayers(second.spec)[0].start, 2, "list hiển thị sort theo start");
});

test("R7 addSpec: từ chối filter lạ, intensity ngoài 0..1, duration < 0.2, track ngoài phạm vi; scope một track ghi được", () => {
  const spec = specWithVideo();
  const draft = { filterType: "blur", intensity: 0.5, start: 0, duration: 3, scope: "all" as const };
  assert("error" in addSpecAdjustmentLayer(spec, { ...draft, filterType: "khong-co" }, counterIdGen()), "filter lạ phải error");
  assert("error" in addSpecAdjustmentLayer(spec, { ...draft, intensity: 1.5 }, counterIdGen()), "intensity > 1 phải error");
  assert("error" in addSpecAdjustmentLayer(spec, { ...draft, duration: 0.1 }, counterIdGen()), "duration < 0.2 phải error");
  const scoped = addSpecAdjustmentLayer(spec, { ...draft, scope: { trackIndices: [1] } }, counterIdGen());
  assert(!("error" in scoped), `scope một track phải ghi được, nhận ${JSON.stringify(scoped)}`);
  eq((scoped as { layer: { tracks?: number[] } }).layer.tracks!.join(","), "1", "ghi tracks=[1]");
  assert("error" in addSpecAdjustmentLayer(spec, { ...draft, scope: { trackIndices: [99] } }, counterIdGen()), "chỉ số track ngoài phạm vi phải error");
});

test("R7 updateSpec: sửa thời gian + filter đơn được, giữ thứ tự mảng; layer phức tạp chặn sửa filter", () => {
  const spec = specWithVideo();
  const sharedIdGen = counterIdGen();
  const first = addSpecAdjustmentLayer(
    spec, { filterType: "grayscale", intensity: 0.5, start: 2, duration: 4, scope: "all" }, sharedIdGen,
  );
  assert(!("error" in first), "setup spec phải thành công");
  const second = addSpecAdjustmentLayer(
    first.spec, { filterType: "sepia", intensity: 0.5, start: 6, duration: 2, scope: "all" }, sharedIdGen,
  );
  assert(!("error" in second), "setup layer thứ hai phải thành công");
  const upd = updateSpecAdjustmentLayer(second.spec, first.layer.id, { start: 1, filterType: "blur", intensity: 0.8 });
  assert(!("error" in upd), `update spec phải thành công, nhận ${JSON.stringify(upd)}`);
  eq(upd.layer.start, 1, "start mới");
  eq(upd.layer.filters[0].effects![0].type, "blur", "filter mới");
  // Thứ tự mảng giữ nguyên (không sort lại theo start) vì thứ tự = thứ tự áp filter.
  eq(upd.spec.adjustmentLayers![0].id, first.layer.id, "layer đầu vẫn ở đầu mảng");
  const complexSpec: VideoSpec = {
    ...spec,
    adjustmentLayers: [{ id: "cx", start: 0, duration: 2, filters: [{ lut: "noir" as never }] }],
  };
  const blocked = updateSpecAdjustmentLayer(complexSpec, "cx", { filterType: "blur" });
  assert("error" in blocked, "layer phức tạp chặn sửa filter");
  const timeOk = updateSpecAdjustmentLayer(complexSpec, "cx", { start: 1 });
  assert(!("error" in timeOk), "layer phức tạp vẫn sửa được thời gian");
  eq(timeOk.layer.start, 1, "start mới của layer phức tạp");
});

test("R7 deleteSpec + convertLegacy: xoá đúng layer, convert gỡ clip legacy và thêm layer spec", () => {
  const spec = specWithVideo();
  const added = addSpecAdjustmentLayer(
    spec, { filterType: "blur", intensity: 0.5, start: 0, duration: 3, scope: "all" }, counterIdGen(),
  );
  assert(!("error" in added), "setup spec phải thành công");
  const afterDel = deleteSpecAdjustmentLayer(added.spec, added.layer.id);
  assert(afterDel !== null, "xoá spec phải thành công");
  eq(afterDel!.adjustmentLayers!.length, 0, "không còn layer spec");
  assert(deleteSpecAdjustmentLayer(added.spec, "khong-co") === null, "xoá id lạ phải null");

  const legacy = addAdjustmentLayer(spec, "sepia", 0.6, 1, 3, counterIdGen());
  assert(!("error" in legacy), "setup legacy phải thành công");
  const conv = convertLegacyLayerToSpec(legacy.spec, legacy.hostTrackId, legacy.layer.id, "all", counterIdGen());
  assert(!("error" in conv), `convert phải thành công, nhận ${JSON.stringify(conv)}`);
  eq(listAdjustmentLayers(conv.spec).length, 0, "không còn clip legacy");
  eq(conv.spec.adjustmentLayers!.length, 1, "1 layer spec sau convert");
  eq(conv.spec.adjustmentLayers![0].filters[0].effects![0].type, "sepia", "filter giữ nguyên sau convert");
  eq(conv.spec.adjustmentLayers![0].filters[0].effects![0].intensity, 0.6, "intensity giữ nguyên sau convert");
  const unified = listUnifiedAdjustmentLayers(conv.spec);
  eq(unified.length, 1, "unified list có 1 dòng");
  eq(unified[0].origin, "spec", "dòng đó là spec");
});

test("R7 unified list: spec + legacy cùng hiển thị, legacy mang host track để convert", () => {
  const spec = specWithVideo();
  const legacy = addAdjustmentLayer(spec, "blur", 0.5, 0, 2, counterIdGen());
  assert(!("error" in legacy), "setup legacy phải thành công");
  const withSpec = addSpecAdjustmentLayer(
    legacy.spec, { filterType: "grayscale", intensity: 0.5, start: 5, duration: 2, scope: "all" }, counterIdGen(),
  );
  assert(!("error" in withSpec), "setup spec phải thành công");
  const unified = listUnifiedAdjustmentLayers(withSpec.spec);
  eq(unified.length, 2, "2 dòng");
  eq(unified[0].origin, "legacy", "dòng đầu là legacy (start 0)");
  eq(unified[0].legacyHostTrackId, "v1", "legacy mang host track");
  eq(unified[1].origin, "spec", "dòng sau là spec");
});

function specWithNestedPair(): { spec: VideoSpec; nestedId: string } {
  const spec = specWithVideo();
  const nested = nestClips(
    spec,
    [{ trackId: "v1", clipId: "c1" }],
    counterIdGen(),
    "C",
  );
  // nest 1 clip bị từ chối nên dựng nested trực tiếp: 2 clip kề nhau trên v1,
  // clip thứ hai là nested (subSpec chứa 1 clip video).
  assert("error" in nested, "nest 1 clip phải bị từ chối (setup kiểm chứng)");
  const inner: Clip = videoClip("in1", 0, 2);
  const nestedClip = {
    kind: "nested", id: "n1", name: "N", start: 4, duration: 2,
    subSpec: { version: "0.2.0", meta: { name: "Sub", width: 1280, height: 720, fps: 30 }, tracks: [{ id: "v1", kind: "video", clips: [inner] }] },
  } as unknown as Clip;
  const full: VideoSpec = {
    ...spec,
    tracks: spec.tracks.map((t) =>
      t.id === "v1" ? { ...t, clips: [videoClip("c0", 0, 4), nestedClip] } : t,
    ),
  };
  return { spec: full, nestedId: "n1" };
}

test("R7 nested boundary: đặt opacity + fade vào được, đọc lại đúng", () => {
  const { spec, nestedId } = specWithNestedPair();
  const res = setNestedClipBoundary(spec, "v1", nestedId, {
    opacity: 0.5,
    transitionIn: { type: "fade", duration: 1 },
  });
  assert(!("error" in res), `đặt boundary phải thành công, nhận ${JSON.stringify(res)}`);
  const view = readNestedBoundary(res.nested);
  eq(view.opacity, 0.5, "opacity đọc lại");
  eq(view.transitionIn!.type, "fade", "transitionIn đọc lại");
  eq(view.transitionIn!.duration, 1, "duration đọc lại");
  const cleared = setNestedClipBoundary(res.spec, "v1", nestedId, { opacity: null, transitionIn: null });
  assert(!("error" in cleared), "xoá boundary phải thành công");
  const view2 = readNestedBoundary(cleared.nested);
  assert(view2.opacity === undefined, "opacity đã xoá");
  assert(view2.transitionIn === undefined, "transitionIn đã xoá");
});

test("R7 nested boundary: fail-fast — type khác fade, cả hai đầu, không có clip kề, opacity ngoài 0..1", () => {
  const { spec, nestedId } = specWithNestedPair();
  const wipe = setNestedClipBoundary(spec, "v1", nestedId, {
    transitionIn: { type: "wipeleft", duration: 1 },
  });
  assert("error" in wipe, "wipe qua biên phải error");
  assert((wipe as { error: string }).error.includes('"fade"'), "message phải nêu rõ chỉ hỗ trợ fade");
  const both = setNestedClipBoundary(spec, "v1", nestedId, {
    transitionIn: { type: "fade", duration: 1 },
    transitionOut: { type: "fade", duration: 1 },
  });
  assert("error" in both, "đặt cả hai đầu phải error (R3 từ chối)");
  // Nested là clip cuối track (không có clip kề sau) nên transition ra phải error.
  const noNext = setNestedClipBoundary(spec, "v1", nestedId, {
    transitionOut: { type: "fade", duration: 1 },
  });
  assert("error" in noNext, "transition ra không có clip kề sau phải error");
  const badOp = setNestedClipBoundary(spec, "v1", nestedId, { opacity: 1.5 });
  assert("error" in badOp, "opacity > 1 phải error");
  const tooLong = setNestedClipBoundary(spec, "v1", nestedId, {
    transitionIn: { type: "fade", duration: 2 },
  });
  assert("error" in tooLong, "fade dài bằng độ dài nested phải error");
  const notNested = setNestedClipBoundary(spec, "v1", "c0", { opacity: 0.5 });
  assert("error" in notNested, "clip thường không đặt được boundary");
  const locked: VideoSpec = {
    ...spec,
    tracks: spec.tracks.map((t) => (t.id === "v1" ? { ...t, locked: true } : t)),
  };
  assert("error" in setNestedClipBoundary(locked, "v1", nestedId, { opacity: 0.5 }), "track khóa phải error");
});

test("R7 nested boundary: transition kề trước khai ngược chiều thì phải khớp duration", () => {
  const { spec, nestedId } = specWithNestedPair();
  // Clip kề trước c0 khai transitionOut fade 0.5 — nested khai fade vào 1s thì lệch.
  const withPrev: VideoSpec = {
    ...spec,
    tracks: spec.tracks.map((t) =>
      t.id === "v1"
        ? {
            ...t,
            clips: t.clips.map((c) =>
              c.id === "c0" ? ({ ...c, transitionOut: { type: "fade", duration: 0.5 } } as Clip) : c,
            ),
          }
        : t,
    ),
  };
  const mismatch = setNestedClipBoundary(withPrev, "v1", nestedId, {
    transitionIn: { type: "fade", duration: 1 },
  });
  assert("error" in mismatch, "duration lệch với clip kề phải error");
  const match = setNestedClipBoundary(withPrev, "v1", nestedId, {
    transitionIn: { type: "fade", duration: 0.5 },
  });
  assert(!("error" in match), "khớp duration với clip kề thì được");
});

console.log(`\nnestUtils: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
