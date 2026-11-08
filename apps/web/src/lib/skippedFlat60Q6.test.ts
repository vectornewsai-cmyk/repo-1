// skippedFlat60Q6.test.ts — Phase 9 đợt 60, luồng Q6: đóng nợ đợt 59 §6.5
// (= LIMITS đợt 59 P3 §5.3 + §5.4):
//   (a) spec phẳng không qua flatten → `skippedReasons` tầng lib vẫn rỗng
//       (đường frame ở UI bao được nhưng lib chưa đủ);
//   (b) decoder tụt thì helper frame vẫn liệt kê effect (nguyên nhân thật
//       lúc đó là decoder, không phải type effect).
// Phạm vi:
//   - lib: `flatSpecSkippedReasons` (mới, export) + early-return của
//     `buildPreviewSpecDetailed` / `buildPreviewSpecFailsoft` nay trả
//     skippedReasons của spec phẳng (GIỮ early-return + identity spec,
//     không bỏ early-return — khóa O3 §B' không vỡ, xem LIMITS Q6 §1).
//   - engine: `frameSkippedEffectTypes(spec, t, { notDrawnClipIds })`
//     loại clip tick trước không vẽ được (decoder tụt / chưa có element).
//   - UI: preview.tsx ghi `tickSkippedClipIds` tại điểm `!srcEl` của
//     `drawVideoClip`, reset cùng `tickHadHold`, truyền vào helper ở
//     khối badge.
//   - test P3 (§C boundary) được CẬP NHẬT cùng lúc: case "spec phẳng →
//     skippedReasons rỗng" nay kỳ vọng [NEW_EN] (hành vi cũ đổi có chủ
//     ý, khóa O3 §B' vẫn xanh nguyên — fixture của nó không có effect
//     lạ; xem LIMITS Q6 §1 + §5).
//
// Chạy từ gốc repo (mẫu N4/O3/P3 — esbuild bundle rồi chạy node):
//   ./node_modules/.bin/esbuild apps/web/src/lib/skippedFlat60Q6.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round60-q6/q6.test.cjs
//   node /tmp/round60-q6/q6.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildPreviewSpecDetailed,
  buildPreviewSpecFailsoft,
  flatSpecSkippedReasons,
} from "./nestedPreview";
import { frameSkippedEffectTypes } from "./previewEngine";

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

// --- Dict thật + lookup mô phỏng t() -----------------------------------
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
const VI = readJson("apps/web/src/i18n/vi.json");
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
const DICT_VI = flatten(VI);
const DICT_EN = flatten(EN);
type Lookup = (key: string, vars?: Record<string, string>) => string;
function lookupFrom(map: Map<string, string>): Lookup {
  return (key: string, vars?: Record<string, string>): string => {
    const raw = map.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
const lookupVi = lookupFrom(DICT_VI);
const lookupEn = lookupFrom(DICT_EN);

const NEW_EN = `unknown type "weird-xyz", no draw path in preview`;
const NEW_VI = `type "weird-xyz" chưa biết, không có đường vẽ trong preview`;
const HOLO_EN = `unknown type "hologram", no draw path in preview`;

// --- Fixture -----------------------------------------------------------
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

console.log("== Q6: skippedReasons tầng lib cho spec phẳng + decoder tụt không liệt kê sai ==");

// --- A. Lib: spec phẳng nay có skippedReasons (giữ early-return) --------
ok("flat/lib: clip video effect lạ → skippedReasons nêu tên, spec giữ identity, skipped []", () => {
  const clip = video("flat", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  const detailed = buildPreviewSpecDetailed(spec as never, lookupEn);
  assert.equal(detailed.spec, spec as never, "phải trả đúng object spec cũ (không copy)");
  assert.deepEqual(detailed.skipped, [], "spec phẳng không có skipped flatten");
  assert.deepEqual(detailed.skippedReasons, [NEW_EN]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.equal(res.spec, spec as never);
  assert.deepEqual(res.warnings, []);
  assert.deepEqual(res.skipped, []);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

ok("flat/lib: không lookup → fallback VI nêu tên type", () => {
  const clip = video("flat", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  assert.deepEqual(buildPreviewSpecFailsoft(spec as never).skippedReasons, [NEW_VI]);
  assert.deepEqual(buildPreviewSpecDetailed(spec as never).skippedReasons, [NEW_VI]);
});

ok("flat/lib: lookup vi → chuỗi vi; spec không effect lạ → skippedReasons [] (khóa O3 §B' giữ nguyên)", () => {
  const clip = video("flat", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  assert.deepEqual(buildPreviewSpecFailsoft(spec as never, lookupVi).skippedReasons, [NEW_VI]);
  // Fixture của khóa O3 §B' (clip phẳng không effect): identity + rỗng giữ nguyên.
  const plain = specOf(track("v", [video("flat", 0, 4)]));
  const detailed = buildPreviewSpecDetailed(plain as never);
  assert.equal(detailed.spec, plain as never, "phải trả đúng object spec cũ");
  assert.deepEqual(detailed.skipped, []);
  assert.deepEqual(detailed.skippedReasons, []);
  const res = buildPreviewSpecFailsoft(plain as never);
  assert.equal(res.spec, plain as never);
  assert.deepEqual(res.skippedReasons, []);
});

ok("flat/lib: 2 clip cùng effect lạ → dedupe 1; 2 type lạ → cả 2 giữ thứ tự", () => {
  const a = video("a", 0, 2, { effects: [{ type: "weird-xyz" }] });
  const b = video("b", 2, 2, { effects: [{ type: "weird-xyz" }] });
  assert.deepEqual(
    buildPreviewSpecFailsoft(specOf(track("v", [a, b])) as never, lookupEn).skippedReasons,
    [NEW_EN],
  );
  const c = video("c", 0, 2, { effects: [{ type: "weird-xyz" }, { type: "hologram" }] });
  assert.deepEqual(
    buildPreviewSpecFailsoft(specOf(track("v", [c])) as never, lookupEn).skippedReasons,
    [NEW_EN, HOLO_EN],
  );
});

ok("flat/lib: chỉ effect chuẩn (blur/sharpen) → skippedReasons []", () => {
  const clip = video("flat", 0, 4, {
    effects: [{ type: "blur" }, { type: "sharpen" }, { type: "glitch" }],
  });
  const spec = specOf(track("v", [clip]));
  assert.deepEqual(buildPreviewSpecFailsoft(spec as never, lookupEn).skippedReasons, []);
  assert.deepEqual(buildPreviewSpecDetailed(spec as never, lookupEn).skippedReasons, []);
});

ok("flat/lib: clip text/image không effects + clip thiếu id/duration 0 → bỏ qua lặng lẽ, không crash", () => {
  const textTrack = { id: "t", kind: "text", clips: [{ kind: "text", id: "tx", start: 0, duration: 4, text: "hi" }] };
  const imgTrack = { id: "i", kind: "image", clips: [{ kind: "image", id: "im", start: 0, duration: 4, src: "x.png" }] };
  const spec = specOf(textTrack, imgTrack);
  assert.deepEqual(buildPreviewSpecFailsoft(spec as never, lookupEn).skippedReasons, []);
  // Clip video mang effect lạ nhưng thiếu id → không phải leaf (isLeafClip)
  // nên không thu lý do — cùng ngữ nghĩa với đường flatten (không bịa).
  const noId = { kind: "video", start: 0, duration: 4, effects: [{ type: "weird-xyz" }] };
  const spec2 = specOf(track("v", [noId]));
  assert.deepEqual(buildPreviewSpecFailsoft(spec2 as never, lookupEn).skippedReasons, []);
  const zeroDur = video("z", 0, 0, { effects: [{ type: "weird-xyz" }] });
  const spec3 = specOf(track("v", [zeroDur]));
  assert.deepEqual(buildPreviewSpecFailsoft(spec3 as never, lookupEn).skippedReasons, []);
});

ok("flat/lib: flatSpecSkippedReasons trực tiếp == failsoft.skippedReasons (cùng classifier)", () => {
  const clip = video("flat", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  assert.deepEqual(flatSpecSkippedReasons(spec as never, lookupEn), [NEW_EN]);
  assert.deepEqual(flatSpecSkippedReasons(spec as never), [NEW_VI]);
  assert.deepEqual(
    flatSpecSkippedReasons(spec as never, lookupEn),
    buildPreviewSpecFailsoft(spec as never, lookupEn).skippedReasons,
  );
  const plain = specOf(track("v", [video("flat", 0, 4)]));
  assert.deepEqual(flatSpecSkippedReasons(plain as never, lookupEn), []);
});

ok("flat/lib hồi quy: lá nested effect lạ vẫn có skippedReasons (đường flatten không đổi)", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [nestedPlain("n1", [leaf])]));
  assert.deepEqual(buildPreviewSpecFailsoft(spec as never, lookupEn).skippedReasons, [NEW_EN]);
});

// --- B. Engine: decoder tụt → helper không liệt kê effect của clip đó ---
ok("frame: clip trong notDrawnClipIds bị loại, clip khác cùng frame vẫn liệt kê", () => {
  const a = video("a", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const b = video("b", 0, 4, { effects: [{ type: "hologram" }] });
  const spec = specOf(track("v1", [a]), track("v2", [b]));
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 1).sort(), ["hologram", "weird-xyz"]);
  assert.deepEqual(
    frameSkippedEffectTypes(spec as never, 1, { notDrawnClipIds: new Set(["a"]) }),
    ["hologram"],
  );
  assert.deepEqual(
    frameSkippedEffectTypes(spec as never, 1, { notDrawnClipIds: new Set(["b"]) }),
    ["weird-xyz"],
  );
});

ok("frame: không opts / set rỗng → hành vi cũ (tương thích ngược)", () => {
  const a = video("a", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [a]));
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 1), ["weird-xyz"]);
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 1, {}), ["weird-xyz"]);
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 1, { notDrawnClipIds: new Set() }), ["weird-xyz"]);
});

ok("frame: mọi clip đang hiện đều notDrawn → [] (không liệt kê sai thay vì 'không biết')", () => {
  const a = video("a", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [a]));
  assert.deepEqual(
    frameSkippedEffectTypes(spec as never, 1, { notDrawnClipIds: new Set(["a"]) }),
    [],
  );
});

ok("frame: id lạ trong set không ảnh hưởng clip khác; clip ngoài cửa sổ thời gian không tính", () => {
  const a = video("a", 0, 2, { effects: [{ type: "weird-xyz" }] });
  const b = video("b", 2, 2, { effects: [{ type: "hologram" }] });
  const spec = specOf(track("v", [a, b]));
  assert.deepEqual(
    frameSkippedEffectTypes(spec as never, 1, { notDrawnClipIds: new Set(["zzz"]) }),
    ["weird-xyz"],
  );
  // t=3: chỉ clip b hiện; a trong set cũng không đổi kết quả.
  assert.deepEqual(
    frameSkippedEffectTypes(spec as never, 3, { notDrawnClipIds: new Set(["a"]) }),
    ["hologram"],
  );
});

// --- C. Wiring: lib + UI nối đúng ---------------------------------------
ok("wiring: nestedPreview.ts dùng flatSpecSkippedReasons ở cả 2 early-return", () => {
  const src = readFileSync("apps/web/src/lib/nestedPreview.ts", "utf8");
  assert.ok(src.includes("export function flatSpecSkippedReasons"), "thiếu export flatSpecSkippedReasons");
  const uses = src.split("skippedReasons: flatSpecSkippedReasons(spec, lookup)").length - 1;
  assert.ok(uses >= 2, `early-return phải dùng helper ở cả detailed + failsoft, nhận ${uses}`);
  // Early-return KHÔNG bị bỏ: vẫn trả đúng object cũ khi không nested/adjustment.
  // Đợt 61 R8: dòng này thêm `skippedReasonsByClip` (attribution theo clip)
  // — early-return + identity spec + skipped [] GIỮ NGUYÊN, chỉ bổ sung field.
  assert.ok(src.includes("if (!hasNestedOrAdjustment(input)) return { spec, skipped: [], skippedReasons: flatSpecSkippedReasons(spec, lookup), skippedReasonsByClip: flatSpecSkippedAttributions(spec, lookup) };"), "detailed phải giữ early-return (+ attribution R8)");
});

ok("wiring: preview.tsx ghi tickSkippedClipIds ở điểm clip không vẽ được + truyền vào helper ở badge", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  for (const needle of [
    "let tickSkippedClipIds",
    // Đợt 62 R6: ghi key INSTANCE (previewClipInstanceKey) thay cho
    // leaf id trần — 2 instance nested cùng leaf id không lẫn nhau.
    "tickSkippedClipIds.add(previewClipInstanceKey(clip))",
    "notDrawnClipIds: tickSkippedClipIds",
    "frameSkippedEffectTypes(spec, useStore.getState().playhead, { notDrawnClipIds: tickSkippedClipIds })",
  ]) {
    assert.ok(src.includes(needle), `preview.tsx thiếu ${needle}`);
  }
  // Reset cùng tickHadHold ở đầu renderFrame (badge đọc giá trị tick trước).
  // Tìm đúng lệnh gán trong renderFrame (không phải dòng khai báo `let ...`).
  const resetIdx = src.indexOf("tickSkippedClipIds = new Set()");
  assert.ok(resetIdx > 0, "thiếu reset tickSkippedClipIds");
  const holdResetIdx = src.indexOf("\n  tickHadHold = false;");
  assert.ok(holdResetIdx > 0, "không tìm thấy tickHadHold = false trong renderFrame");
  assert.ok(
    Math.abs(holdResetIdx - resetIdx) < 200,
    "reset phải nằm ngay cạnh tickHadHold = false trong renderFrame",
  );
});

ok("wiring: previewEngine.ts nhận opts notDrawnClipIds", () => {
  const src = readFileSync("apps/web/src/lib/previewEngine.ts", "utf8");
  assert.ok(src.includes("notDrawnClipIds"), "previewEngine.ts thiếu notDrawnClipIds");
  assert.ok(
    src.includes("frameSkippedEffectTypes(spec: VideoSpec, t: number, opts?: FrameSkippedEffectOptions)"),
    "frameSkippedEffectTypes phải nhận opts thứ 3",
  );
});

console.log(`skipped flat 60 Q6: ${pass} pass`);
