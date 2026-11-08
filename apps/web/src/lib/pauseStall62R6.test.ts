// pauseStall62R6.test.ts — Phase 9 đợt 62, luồng R6: đóng nợ đợt 61 §5.8
// (LIMITS R8 §5.1 + §5.3 + §5.5):
//   (a) pause-seek stall: badge vẫn hiện lý do khi decoder stall ở chế
//       độ pause — vòng lặp pause nay ghi key instance của active vào
//       `tickSkippedClipIds` ngay khi seek thất bại đã chứng minh
//       (timeout/error), thay vì đợi renderFrame (không bao giờ chạy
//       khi seek kẹt). Đo headed thật bằng harness riêng (xem LIMITS
//       R6); file này khóa logic thuần + wiring.
//   (b) lỗi decoder sticky: element `error:3` không hồi phục khi
//       playhead về vùng decode được — sau mỗi lần seek thất bại đã
//       chứng minh (chưa cạn cap) thì drop ngay element ĐÃ LỖI để lần
//       retry sau tạo element mới. Đo headed thật bằng harness riêng.
//   (c) trùng clipId giữa 2 instance nested → attribution theo instance
//       (namespace/scoped id): `skippedReasonsByClip.clipId` nay là key
//       instance "nA/leaf-1" thay cho leaf id trần, và clip trong spec
//       phẳng được đóng dấu `__vcutInstanceKey` để phía vẽ đối chiếu
//       đúng instance.
// Contract O3/N4 GIỮ NGUYÊN: `skippedReasons: string[]` (chuỗi
// spec-wide) không đổi nội dung — test §E khóa trực tiếp. Test R8 đã
// cập nhật 4 kỳ vọng clipId lá nested + 2 needle wiring sang key
// instance (thay đổi có kiểm soát, đúng bản chất của (c)); test Q6 cập
// nhật 1 needle wiring tương tự.
//
// Chạy từ gốc repo (mẫu R8 — esbuild bundle rồi chạy node):
//   ./node_modules/.bin/esbuild apps/web/src/lib/pauseStall62R6.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round62-r6/r6.test.cjs
//   node /tmp/round62-r6/r6.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildPreviewSpecDetailed,
  buildPreviewSpecFailsoft,
  visibleSkippedReasons,
} from "./nestedPreview";
import { frameSkippedEffectTypes } from "./previewEngine";
import {
  PREVIEW_INSTANCE_KEY,
  previewClipInstanceKey,
  scopedClipId,
  stampPreviewInstanceKey,
} from "./previewClipKey62R6";
import {
  hasDecoderError,
  planDecoderErrorRecovery,
} from "./decoderErrorRecovery62R6";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

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

// --- Dict thật + lookup mô phỏng t() (mẫu R8) ---------------------------
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
const EN = readJson("apps/web/src/i18n/en.json");
function flatten(d: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Dict, q, out);
    else out.set(q, v as string);
  }
  return out;
}
const DICT_EN = flatten(EN);
type Lookup = (key: string, vars?: Record<string, string>) => string;
function lookupFrom(map: Map<string, string>): Lookup {
  return (key: string, vars?: Record<string, string>): string => {
    const raw = map.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
const lookupEn = lookupFrom(DICT_EN);

const NEW_EN = `unknown type "weird-xyz", no draw path in preview`;

// --- Fixture (mẫu R8) ----------------------------------------------------
type AnyRec = Record<string, unknown>;
function video(id: string, start: number, duration: number, extra: AnyRec = {}): AnyRec {
  return { kind: "video", id, start, duration, in: 0, out: duration, ...extra };
}
function nestedPlain(id: string, inner: unknown[], extra: AnyRec = {}): AnyRec {
  return {
    kind: "nested", id, start: 0, duration: 4, in: 0,
    tracks: [{ kind: "video", clips: inner }],
    ...extra,
  };
}
function track(id: string, clips: unknown[], extra: AnyRec = {}): AnyRec {
  return { id, kind: "video", clips, ...extra };
}
function specOf(...tracks: AnyRec[]): AnyRec {
  return { version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 }, tracks };
}
/**
 * Spec 2 instance nested CÙNG leaf id "leaf-1" (đóng nợ R8 §5.5):
 * instance nA 0..5 chứa leaf stall.mp4, instance nB 6..11 chứa leaf
 * valid.mp4 — cùng leaf id, khác nested id ngoài + khác src. Lá dài 4s
 * trong nested dài 5s nên cửa sổ phẳng là A 0..4, B 6..10.
 */
function twoInstanceSpec(): AnyRec {
  const leafA = video("leaf-1", 0, 4, { src: "stall.mp4", effects: [{ type: "weird-xyz" }] });
  const leafB = video("leaf-1", 0, 4, { src: "valid.mp4", effects: [{ type: "weird-xyz" }] });
  return specOf(track("v", [
    nestedPlain("nA", [leafA], { start: 0, duration: 5 }),
    nestedPlain("nB", [leafB], { start: 6, duration: 5 }),
  ]));
}

console.log("== R6: pause-seek stall badge + decoder-error recovery + attribution theo instance ==");

// --- A. Key instance (thuần) ----------------------------------------------
ok("key/scopedClipId: tầng ngoài → đúng id; 1 cấp → nA/leaf-1; 2 cấp → nA/nB/leaf-1", () => {
  assert.equal(scopedClipId([], "leaf-1"), "leaf-1");
  assert.equal(scopedClipId(undefined, "leaf-1"), "leaf-1");
  assert.equal(scopedClipId(["nA"], "leaf-1"), "nA/leaf-1");
  assert.equal(scopedClipId(["nA", "nB"], "leaf-1"), "nA/nB/leaf-1");
});

ok("key/previewClipInstanceKey: không dấu → id; có dấu → dấu; dấu rỗng/không chuỗi → id", () => {
  assert.equal(previewClipInstanceKey({ id: "c1" }), "c1");
  assert.equal(
    previewClipInstanceKey({ id: "leaf-1", [PREVIEW_INSTANCE_KEY]: "nA/leaf-1" }),
    "nA/leaf-1",
  );
  assert.equal(previewClipInstanceKey({ id: "c1", [PREVIEW_INSTANCE_KEY]: "" }), "c1");
  assert.equal(previewClipInstanceKey({ id: "c1", [PREVIEW_INSTANCE_KEY]: 42 }), "c1");
});

ok("key/stampPreviewInstanceKey: nestedPath [] → đúng object cũ; có path → copy mới có dấu, gốc không đổi", () => {
  const clip = { id: "leaf-1", start: 0, duration: 4 };
  assert.equal(stampPreviewInstanceKey(clip, []), clip, "không path thì không copy");
  const stamped = stampPreviewInstanceKey(clip, ["nA"]);
  assert.notEqual(stamped, clip, "có path thì copy mới");
  assert.equal(previewClipInstanceKey(stamped), "nA/leaf-1");
  assert.equal(previewClipInstanceKey(clip), "leaf-1", "gốc không bị đóng dấu");
  assert.equal(stamped.id, "leaf-1", "id gốc giữ nguyên (không đổi clip.id)");
});

// --- B. Phục hồi decoder error (thuần) ------------------------------------
function mockEl(error: { code: number } | null | undefined): { error?: { code: number } | null } {
  return error === undefined ? {} : { error };
}

ok("recovery: [] → rỗng; toàn element khỏe → rỗng; 1 error:3 → đúng element + code 3", () => {
  assert.deepEqual(planDecoderErrorRecovery([]), { elements: [], errorCodes: [] });
  const healthy = mockEl(null);
  assert.deepEqual(planDecoderErrorRecovery([healthy]), { elements: [], errorCodes: [] });
  const bad = mockEl({ code: 3 });
  assert.deepEqual(planDecoderErrorRecovery([healthy, bad]), { elements: [bad], errorCodes: [3] });
});

ok("recovery: error:4 cũng drop; cùng element 2 lần → dedup 1; error undefined → không drop", () => {
  const bad4 = mockEl({ code: 4 });
  assert.deepEqual(planDecoderErrorRecovery([bad4]).errorCodes, [4]);
  const bad3 = mockEl({ code: 3 });
  const plan = planDecoderErrorRecovery([bad3, mockEl(null), bad3]);
  assert.equal(plan.elements.length, 1, "cùng element 2 lần chỉ drop 1 lần");
  assert.deepEqual(plan.errorCodes, [3]);
  assert.deepEqual(planDecoderErrorRecovery([mockEl(undefined)]), { elements: [], errorCodes: [] });
});

ok("recovery: element có error code lạ (không số) → vẫn drop, code null; getter ném → bỏ qua không crash", () => {
  const weird = mockEl({} as { code: number });
  const plan = planDecoderErrorRecovery([weird]);
  assert.equal(plan.elements.length, 1);
  assert.deepEqual(plan.errorCodes, [null]);
  const throwing = {
    get error(): { code: number } | null {
      throw new Error("getter boom");
    },
  };
  assert.deepEqual(planDecoderErrorRecovery([throwing as never]), { elements: [], errorCodes: [] });
  assert.equal(hasDecoderError(mockEl({ code: 3 })), true);
  assert.equal(hasDecoderError(mockEl(null)), false);
  assert.equal(hasDecoderError(mockEl(undefined)), false);
  assert.equal(hasDecoderError(throwing as never), false);
});

// --- C. Attribution theo instance (2 nested cùng leaf id) -----------------
ok("attrib/instance: 2 instance cùng leaf id → 2 entry key instance, skippedReasons vẫn dedupe 1 chuỗi", () => {
  const res = buildPreviewSpecFailsoft(twoInstanceSpec() as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN], "contract chuỗi O3/N4 không đổi");
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "nA/leaf-1", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
    { clipId: "nB/leaf-1", type: "weird-xyz", reason: NEW_EN, start: 6, duration: 4 },
  ]);
  const detailed = buildPreviewSpecDetailed(twoInstanceSpec() as never, lookupEn);
  assert.deepEqual(detailed.skippedReasonsByClip, res.skippedReasonsByClip, "detailed == failsoft");
});

ok("attrib/instance: spec phẳng đóng dấu key instance lên từng lá; spec gốc không bị sửa", () => {
  const input = twoInstanceSpec();
  const detailed = buildPreviewSpecDetailed(input as never, lookupEn);
  const flat = detailed.spec as unknown as { tracks: Array<{ id: string; clips: AnyRec[] }> };
  const nestedTrack = flat.tracks.find((tr) => tr.id === "__nested-video");
  assert.ok(nestedTrack, "phải có track __nested-video trong spec phẳng");
  assert.equal(nestedTrack.clips.length, 2);
  const keys = nestedTrack.clips.map((c) => previewClipInstanceKey(c as { id: string }));
  assert.deepEqual(keys, ["nA/leaf-1", "nB/leaf-1"]);
  assert.deepEqual(
    nestedTrack.clips.map((c) => c["id"]),
    ["leaf-1", "leaf-1"],
    "clip.id gốc giữ nguyên (chỉ thêm dấu instance)",
  );
  // Spec gốc không bị đóng dấu (stamp luôn copy mới).
  const outer = (input as unknown as { tracks: Array<{ clips: AnyRec[] }> }).tracks[0].clips;
  for (const n of outer) {
    const inner = (n as AnyRec)["tracks"] as Array<{ clips: AnyRec[] }>;
    for (const leaf of inner[0].clips) {
      assert.ok(!(PREVIEW_INSTANCE_KEY in leaf), "lá trong spec gốc không được đóng dấu");
    }
  }
});

ok("attrib/instance: 1 instance stall (trong notDrawn) không ẩn lý do của instance kia", () => {
  const res = buildPreviewSpecFailsoft(twoInstanceSpec() as never, lookupEn);
  const att = res.skippedReasonsByClip;
  // Playhead trong A (t=1), A stall → lý do của A ẩn.
  assert.deepEqual(visibleSkippedReasons(att, 1, new Set(["nA/leaf-1"])), []);
  // Playhead trong B (t=7), chỉ A stall → lý do của B VẪN HIỆN
  // (đây chính là bug R8 §5.5: trước đây cùng leaf id nên stall A ẩn cả B).
  assert.deepEqual(visibleSkippedReasons(att, 7, new Set(["nA/leaf-1"])), [NEW_EN]);
  // Cả 2 stall → ẩn hết.
  assert.deepEqual(visibleSkippedReasons(att, 7, new Set(["nA/leaf-1", "nB/leaf-1"])), []);
  // Không có notDrawn → cả 2 hiện theo cửa sổ.
  assert.deepEqual(visibleSkippedReasons(att, 1), [NEW_EN]);
  assert.deepEqual(visibleSkippedReasons(att, 7), [NEW_EN]);
});

ok("attrib/instance: frameSkippedEffectTypes tách theo key instance trên spec phẳng", () => {
  const flat = buildPreviewSpecDetailed(twoInstanceSpec() as never, lookupEn).spec;
  // t=7 trong B: chỉ A trong notDrawn → B vẫn đóng góp weird-xyz.
  assert.deepEqual(
    frameSkippedEffectTypes(flat as never, 7, { notDrawnClipIds: new Set(["nA/leaf-1"]) }),
    ["weird-xyz"],
  );
  // t=1 trong A: A trong notDrawn → không còn type nào.
  assert.deepEqual(
    frameSkippedEffectTypes(flat as never, 1, { notDrawnClipIds: new Set(["nA/leaf-1"]) }),
    [],
  );
  // t=7, B trong notDrawn → không còn type nào (dù A cũng mang type đó).
  assert.deepEqual(
    frameSkippedEffectTypes(flat as never, 7, { notDrawnClipIds: new Set(["nB/leaf-1"]) }),
    [],
  );
  // Không notDrawn → cả 2 cửa sổ đều có type.
  assert.deepEqual(frameSkippedEffectTypes(flat as never, 1), ["weird-xyz"]);
  assert.deepEqual(frameSkippedEffectTypes(flat as never, 7), ["weird-xyz"]);
});

ok("attrib/instance: failsoft đường chậm cũng đóng dấu + attribution key instance", () => {
  // Kích đường chậm như R8: nested mang speedKeyframes v=5 (về 1×).
  const V5 = { keyframes: [{ t: 0, v: 5, easing: "linear" }, { t: 4, v: 5, easing: "linear" }] };
  const bad = nestedPlain("BAD", [video("leaf-1", 0, 6, { src: "stall.mp4", effects: [{ type: "weird-xyz" }] })], {
    speedKeyframes: V5,
  });
  const spec = specOf(track("v", [bad]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.equal(res.warnings.length, 1, `phải có 1 warning, nhận ${res.warnings.length}`);
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "BAD/leaf-1", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ]);
  const flat = res.spec as unknown as { tracks: Array<{ id: string; clips: AnyRec[] }> };
  const nestedTrack = flat.tracks.find((tr) => tr.id === "__nested-video");
  assert.ok(nestedTrack, "đường chậm phải có track __nested-video");
  assert.equal(
    previewClipInstanceKey(nestedTrack.clips[0] as { id: string }),
    "BAD/leaf-1",
    "đường chậm cũng phải đóng dấu key instance",
  );
});

// --- D. Wiring UI -----------------------------------------------------------
ok("wiring: preview.tsx ghi tickSkippedClipIds bằng key instance ở cả 3 điểm vẽ", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  const uses = src.split("tickSkippedClipIds.add(previewClipInstanceKey(clip))").length - 1;
  assert.ok(uses >= 3, `phải có ≥3 điểm ghi key instance (video !item, video !srcEl, image guard), nhận ${uses}`);
  assert.ok(!src.includes("tickSkippedClipIds.add(clip.id)"), "không còn điểm ghi leaf id trần");
});

ok("wiring: preview.tsx (a) ghi actives vào tickSkippedClipIds khi seek thất bại + (b) drop element lỗi", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  // (a) — trong nhánh `.then` seek-thất-bại (kind !== null).
  assert.ok(src.includes("tickSkippedClipIds.add(a.clipKey)"), "(a) thiếu ghi clipKey của actives khi seek thất bại");
  assert.ok(src.includes("clipKey: previewClipInstanceKey(clip)"), "collectActives phải tính clipKey");
  // (b) — drop element đã lỗi sau thất bại đã chứng minh, chưa cạn cap.
  assert.ok(src.includes("planDecoderErrorRecovery(actives.map((a) => a.el))"), "(b) thiếu gọi planDecoderErrorRecovery");
  assert.ok(src.includes("decoderErrorRecovered"), "(b) thiếu bộ đếm decoderErrorRecovered phơi qua idleDebug");
  assert.ok(src.includes("decoderErrorRecovered: number"), "(b) thiếu field decoderErrorRecovered trong PreviewIdleDebug");
});

ok("wiring: nestedPreview.ts attribution + đóng dấu đều dùng key instance", () => {
  const src = readFileSync("apps/web/src/lib/nestedPreview.ts", "utf8");
  const attribUses = src.split("scopedClipId(clipScope?.nestedPath, clip.id)").length - 1;
  assert.ok(attribUses >= 2, `attribution phải dùng scopedClipId ở cả 2 nhánh split, nhận ${attribUses}`);
  const stampUses = src.split("stampPreviewInstanceKey(seg, f.nestedPath)").length - 1;
  assert.ok(stampUses >= 2, `đóng dấu phải có ở cả đường detailed + failsoft chậm, nhận ${stampUses}`);
});

ok("wiring: previewEngine.ts frameSkippedEffectTypes đối chiếu bằng key instance", () => {
  const src = readFileSync("apps/web/src/lib/previewEngine.ts", "utf8");
  assert.ok(src.includes("previewClipInstanceKey(clip)"), "frameSkippedEffectTypes phải dùng previewClipInstanceKey");
  assert.ok(!src.includes("notDrawnClipIds?.has(clip.id)"), "không còn đối chiếu leaf id trần");
});

// --- E. Hồi quy contract chuỗi (O3/N4) --------------------------------------
ok("contract: clip tầng ngoài 2 clip cùng type → skippedReasons dedupe 1, attribution giữ id trần", () => {
  const a = video("a", 0, 2, { effects: [{ type: "weird-xyz" }] });
  const b = video("b", 2, 2, { effects: [{ type: "weird-xyz" }] });
  const res = buildPreviewSpecFailsoft(specOf(track("v", [a, b])) as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN], "chuỗi lý do không đổi");
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "a", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 2 },
    { clipId: "b", type: "weird-xyz", reason: NEW_EN, start: 2, duration: 2 },
  ]);
});

ok("contract: nested 1 instance — skippedReasons vẫn [NEW_EN] (chuỗi không đổi)", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [nestedPlain("n1", [leaf])]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

console.log(`pause-stall 62 R6: ${pass} pass`);
