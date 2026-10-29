/**
 * store.nestedCurve21T4.test.ts — Test qua store thật, Phase 9 đợt 21
 * (luồng T4): UI tạo speed curve MỚI cho nested clip từ số 0.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedCurve20R4.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedCurve21T4.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedCurve21T4.test.cjs --log-level=warning
 *   node /tmp/store.nestedCurve21T4.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4 đợt 20: validate.js dùng dynamic require.)
 *
 * PHẠM VI (giống R4): repo không có DOM test runner nên nút tạo của
 * NestedCurveCreateEditor chưa click-test browser thật — phần đã khóa
 * bằng test là module thuần panel dùng (nestedCurveCreate.ts: preset +
 * luật chặn) và đường store panel gọi (patchClip tạo curve + undo +
 * toast chặn hai tầng), đúng phạm vi test được ở đây. Việc block tạo
 * tự ẩn và block chế độ hiện ngay sau khi tạo là hệ quả của cùng một
 * spec đổi (cả hai component mount sẵn cho mọi item, chỉ đổi nhánh
 * null/nội dung theo clip có curve hay chưa) — không mạo nhận đã chạy
 * DOM thật.
 *
 * NỘI DUNG (mỗi case cài lại spec mới qua useStore.setState):
 *  P1. Preset khởi đầu: đúng 1 keyframe { t: 0, v: 1, linear } — v trong
 *      [0.25, 4], t = 0 nên hợp lệ với mọi duration (không như preset
 *      2 keyframe cố định t = D của clip khác).
 *  P2. Luật chặn thuần (nestedCurveCreateBlock, theo luật T2 mới):
 *      clip thường → null; đã có curve → alreadyHas; reverse (clip
 *      ngoài) → reverse; lá con có curve HỢP LỆ (hằng 1×, tốc độ hợp
 *      với preset = 1) → null (được tạo, không chặn oan); lá con
 *      reverse → twoLevel + reason khác rỗng; duration 0 → previewFail.
 *  C1. Tạo từ 0 qua patchClip(preset): curve xuất hiện, trim [0,4) và
 *      duration 4 giữ nguyên (tích phân hằng 1× = D), validateNestedClip
 *      rỗng (clip tạo ra hợp lệ thật, không chỉ có field).
 *  C2. Undo 1 bước về 0 curve: undoDepth +1 khi tạo, undo xong curve
 *      biến mất và spec quay đúng trạng thái trước khi tạo.
 *  C3. Tạo trùng không sinh undo rỗng: sau khi tạo, patchClip cùng
 *      tham chiếu preset trả 0, undoDepth không đổi, spec không đổi;
 *      helper cũng báo alreadyHas (panel không gọi store trong trường
 *      hợp này).
 *  C4. Hai tầng HỢP LỆ được tạo (luật T2): lá con mang curve hằng 1×
 *      → block null, patchClip tạo thành công, outer có curve, lá con
 *      không đổi, validateNestedClip(outer) rỗng.
 *  C4b. Hai tầng VI PHẠM vẫn bị chặn đúng lý do: lá con reverse →
 *      block twoLevel + reason khác rỗng, patchClip trả 0, spec không
 *      đổi, toast vi (key curveTwoLevelInvalid của T2) nói reverse.
 *  C5. Nested hai tầng HỢP LỆ không bị chặn oan: outer chứa nested con
 *      (không clip nào mang curve) → block null, tạo thành công, nested
 *      con vẫn không có curve, validateNestedClip(outer) rỗng.
 *  C6. Curve rỗng [] được tính là chưa có curve: block null, tạo thành
 *      công (đồng nhất với cách NestedCurveModeEditor coi [] là không
 *      có curve).
 *  C7. Duration lẻ 2.5s tạo được và validate rỗng — chứng minh preset
 *      1 keyframe không phụ thuộc duration (preset t = 2.5 cố định
 *      cũng qua, nhưng preset t = 4 cố định thì lỗi t > duration).
 *  E1. Lang en, 10 key curveCreate* mới đều render được, không rò key
 *      thô, không rò biến {…} chưa thay (preview có biến được thay
 *      bằng số thật); kèm key curveTwoLevelInvalid của T2 mà panel
 *      dùng cho nhánh twoLevel.
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang, t as i18nT } from "./i18n";
import {
  createNestedCurvePreset,
  nestedCurveCreateBlock,
  nestedCurveCreateTwoLevelReason,
} from "./components/nested/nestedCurveCreate";
import {
  nestedCurveExpectedOut,
} from "./components/nested/nestUtils";
import {
  validateNestedClip,
  type Clip,
  type NestedClip,
  type SpeedCurve,
  type VideoSpec,
} from "@repo-1/video-spec";

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

type AnyClip = Record<string, unknown> & { id: string; start: number; duration: number };

function subSpec(tracks: { id: string; clips: AnyClip[] }[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: tracks.map((t) => ({ id: t.id, kind: "video", clips: t.clips as unknown as Clip[] })),
  } as unknown as VideoSpec;
}

function videoLeaf(id: string, start: number, duration: number, extra?: Record<string, unknown>): AnyClip {
  return { kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration, ...(extra ?? {}) };
}

function nestedTop(
  id: string,
  inner: VideoSpec,
  duration: number,
  trim?: { in: number; out: number },
  extra?: Record<string, unknown>,
): AnyClip {
  return {
    kind: "nested", id, start: 0, duration, speed: 1,
    ...(trim !== undefined ? { trim } : {}),
    subSpec: inner,
    ...(extra ?? {}),
  };
}

function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested curve21T4 test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  };
  useStore.setState({ spec: spec as never, selection: [], playhead: 0, rippleMode: false });
}

function topNow(id: string): NestedClip {
  const track = useStore.getState().spec.tracks.find((t) => t.id === "v1");
  if (!track) throw new Error("mất track v1");
  const top = track.clips.find((c) => c.id === id);
  if (!top || top.kind !== "nested") throw new Error(`mất nested ${id}`);
  return top as unknown as NestedClip;
}

function ownCurve(top: NestedClip): SpeedCurve | undefined {
  return (top as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
}

const LEAF_CURVE: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 1, easing: "linear" },
  ],
};

// Toast hiện tại (subscribe giữ snapshot mới nhất).
let seenToasts: ToastItem[] = [];
subscribeToasts((items) => {
  seenToasts = items;
});
function freshToasts(): void {
  clearToasts();
  seenToasts = [];
}
function toastText(): string {
  return seenToasts.map((t) => `${t.kind}:${t.message}`).join(" | ");
}

// ===========================================================================
console.log("== P1–P2. Preset + luật chặn thuần ==");

test("P1: preset là 1 keyframe hằng 1× — t=0, v=1 trong [0.25,4], easing linear", () => {
  const preset = createNestedCurvePreset();
  eq(preset.keyframes.length, 1, "chỉ 1 keyframe");
  eq(preset.keyframes[0], { t: 0, v: 1, easing: "linear" }, "keyframe duy nhất");
  assert(preset.keyframes[0].v >= 0.25 && preset.keyframes[0].v <= 4, "v trong [0.25, 4]");
  // Mỗi lần gọi trả object mới (panel tạo mới mỗi lần bấm, không dùng
  // chung tham chiếu với lần tạo trước).
  assert(createNestedCurvePreset() !== preset, "preset mới mỗi lần gọi");
});

test("P2: luật chặn (T2) — thường null; đã có curve / reverse ngoài / lá reverse / duration 0 chặn đúng lý do; lá curve hợp lệ thì KHÔNG chặn", () => {
  const plain = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 });
  eq(nestedCurveCreateBlock(plain as unknown as NestedClip), null, "clip thường tạo được");
  const has = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }, { speedKeyframes: LEAF_CURVE });
  eq(nestedCurveCreateBlock(has as unknown as NestedClip), "alreadyHas", "đã có curve");
  const rev = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }, { reverse: true });
  eq(nestedCurveCreateBlock(rev as unknown as NestedClip), "reverse", "reverse clip ngoài");
  // Luật T2: lá hằng 1× × preset hằng 1× → tốc độ hợp 1, hợp lệ → cho qua.
  const twoValid = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: LEAF_CURVE })] }]), 4, { in: 0, out: 4 });
  eq(nestedCurveCreateBlock(twoValid as unknown as NestedClip), null, "cặp hai tầng hợp lệ không bị chặn oan");
  eq(nestedCurveCreateTwoLevelReason(twoValid as unknown as NestedClip), null, "cặp hợp lệ không có reason");
  // Lá reverse: render cấm lá reverse dưới nested có curve → chặn + reason.
  const twoBad = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { reverse: true })] }]), 4, { in: 0, out: 4 });
  eq(nestedCurveCreateBlock(twoBad as unknown as NestedClip), "twoLevel", "lá con reverse → chặn");
  const reason = nestedCurveCreateTwoLevelReason(twoBad as unknown as NestedClip);
  assert((reason ?? "").length > 0, "reason hai tầng vi phạm phải khác rỗng để panel toast được");
  assert(reason!.includes("reverse"), `reason phải nói reverse: ${reason}`);
  const zero = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 0, { in: 0, out: 4 });
  eq(nestedCurveCreateBlock(zero as unknown as NestedClip), "previewFail", "duration 0 không tính được trim.out");
});

// ===========================================================================
console.log("== C1–C3. Tạo từ 0, undo 1 bước, tạo trùng ==");

test("C1: tạo từ 0 — curve xuất hiện, trim [0,4) + duration 4 giữ nguyên, validate rỗng", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  // Preview panel dùng: tích phân hằng 1× trên D=4 đúng bằng 4.
  const tmp = { ...topNow("n1"), speedKeyframes: createNestedCurvePreset() } as unknown as NestedClip;
  eq(nestedCurveExpectedOut(tmp), 4, "trim.out kỳ vọng = in + D = 4");
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: createNestedCurvePreset() } as Partial<Clip>);
  const top = topNow("n1");
  const curve = ownCurve(top);
  assert(curve && curve.keyframes.length === 1, "curve mới phải có 1 keyframe");
  eq(curve.keyframes[0], { t: 0, v: 1, easing: "linear" }, "curve mới là preset hằng 1×");
  eq(top.trim, { in: 0, out: 4 }, "trim giữ nguyên (nested tốc độ 1)");
  eq(top.duration, 4, "duration giữ nguyên");
  eq(validateNestedClip(top), [], "clip tạo ra phải qua validator");
});

test("C2: undo 1 bước về 0 curve — undoDepth +1 khi tạo, undo xong spec quay đúng trạng thái trước tạo", () => {
  setLang("vi");
  freshToasts();
  // Dùng clip id n2 (khác case trước): CommandStack gộp các patchClip
  // cùng mergeKey `patch:v1:<id>` trong 800ms — test chạy nhanh hơn
  // cửa sổ đó nên cùng id sẽ gộp entry với case trước và đo depth sai.
  // (Hành vi gộp này là của patchClip chung, xem LIMITS §3.)
  install(nestedTop("n2", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  const before = JSON.stringify(topNow("n2"));
  const depthBefore = useStore.getState().undoDepth;
  useStore.getState().patchClip("v1", "n2", { speedKeyframes: createNestedCurvePreset() } as Partial<Clip>);
  assert(ownCurve(topNow("n2")) !== undefined, "sau tạo phải có curve");
  eq(useStore.getState().undoDepth, depthBefore + 1, "tạo là đúng 1 entry undo");
  useStore.getState().undo();
  eq(JSON.stringify(topNow("n2")), before, "undo xong spec quay đúng trạng thái trước tạo (0 curve)");
  eq(useStore.getState().undoDepth, depthBefore, "undoDepth quay về mức trước tạo");
});

test("C3: tạo trùng không sinh undo rỗng — cùng tham chiếu trả 0, depth không đổi, helper báo alreadyHas", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  const preset = createNestedCurvePreset();
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: preset } as Partial<Clip>);
  eq(nestedCurveCreateBlock(topNow("n1")), "alreadyHas", "panel thấy đã có curve thì không gọi store nữa");
  const depthAfterCreate = useStore.getState().undoDepth;
  const specAfterCreate = JSON.stringify(topNow("n1"));
  const ret = useStore.getState().patchClip("v1", "n1", { speedKeyframes: preset } as Partial<Clip>);
  eq(ret, 0, "cùng tham chiếu bị cổng no-change nuốt");
  eq(useStore.getState().undoDepth, depthAfterCreate, "không sinh entry undo rỗng");
  eq(JSON.stringify(topNow("n1")), specAfterCreate, "spec không đổi");
});

// ===========================================================================
console.log("== C4–C6. Chặn hai tầng, hai tầng hợp lệ, curve rỗng ==");

test("C4: hai tầng HỢP LỆ được tạo (luật T2) — lá hằng 1× → block null, patchClip tạo thành công, validate rỗng", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: LEAF_CURVE })] }]),
    4,
    { in: 0, out: 4 },
  ));
  eq(nestedCurveCreateBlock(topNow("n1")), null, "cặp hợp lệ: helper không chặn");
  const leafBefore = JSON.stringify(topNow("n1").subSpec.tracks[0].clips[0]);
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: createNestedCurvePreset() } as Partial<Clip>);
  const top = topNow("n1");
  const curve = ownCurve(top);
  assert(curve && curve.keyframes.length === 1, "outer tạo được curve dù lá đã có curve (luật T2)");
  eq(JSON.stringify(top.subSpec.tracks[0].clips[0]), leafBefore, "lá con không đổi");
  eq(validateNestedClip(top), [], "outer mang curve hai tầng hợp lệ vẫn qua validator");
});

test("C4b: hai tầng VI PHẠM vẫn bị chặn đúng lý do — lá reverse → patchClip trả 0, spec không đổi, toast T2 nói reverse", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { reverse: true })] }]),
    4,
    { in: 0, out: 4 },
  ));
  eq(nestedCurveCreateBlock(topNow("n1")), "twoLevel", "helper chặn trước");
  const before = JSON.stringify(topNow("n1"));
  const ret = useStore.getState().patchClip("v1", "n1", { speedKeyframes: createNestedCurvePreset() } as Partial<Clip>);
  eq(ret, 0, "guard store (T2) từ chối");
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
  assert(toastText().includes("reverse"), `toast T2 phải nói reverse: ${toastText()}`);
});

test("C5: nested hai tầng HỢP LỆ không bị chặn oan — outer chứa nested con, không curve nào → tạo được, con vẫn không curve, validate rỗng", () => {
  setLang("vi");
  freshToasts();
  const inner = nestedTop("inner", subSpec([{ id: "iit1", clips: [videoLeaf("lc1", 0, 4)] }]), 4, { in: 0, out: 4 });
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [inner] }]), 4, { in: 0, out: 4 }));
  eq(nestedCurveCreateBlock(topNow("n1")), null, "độ sâu lồng nhau tự nó không chặn");
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: createNestedCurvePreset() } as Partial<Clip>);
  const top = topNow("n1");
  assert(ownCurve(top) !== undefined, "outer tạo được curve");
  const innerNow = top.subSpec.tracks[0].clips.find((c) => c.id === "inner") as unknown as Record<string, unknown>;
  eq(innerNow["speedKeyframes"], undefined, "nested con không bị gắn curve ké");
  eq(validateNestedClip(top), [], "outer mang curve vẫn qua validator");
});

test("C6: curve rỗng [] được tính là chưa có curve — block null, tạo thành công", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }, { speedKeyframes: { keyframes: [] } }));
  eq(nestedCurveCreateBlock(topNow("n1")), null, "[] không tính là đã có curve (đồng nhất với mode editor)");
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: createNestedCurvePreset() } as Partial<Clip>);
  const curve = ownCurve(topNow("n1"));
  assert(curve && curve.keyframes.length === 1, "tạo đè lên [] thành preset 1 keyframe");
});

// ===========================================================================
console.log("== C7. Preset không phụ thuộc duration ==");

test("C7: duration lẻ 2.5s — tạo được, trim [0,2.5) giữ nguyên, validate rỗng", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 2.5, { in: 0, out: 2.5 }));
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: createNestedCurvePreset() } as Partial<Clip>);
  const top = topNow("n1");
  eq(top.trim, { in: 0, out: 2.5 }, "trim giữ nguyên");
  eq(top.duration, 2.5, "duration giữ nguyên");
  eq(validateNestedClip(top), [], "validate rỗng ở duration lẻ");
});

// ===========================================================================
console.log("== E1. Key i18n mới, lang en ==");

test("E1: en, 10 key curveCreate* đều render được, không rò key thô hay biến chưa thay", () => {
  setLang("en");
  const keys = [
    "nested.curveCreateHead",
    "nested.curveCreateNote",
    "nested.curveCreatePreviewSame",
    "nested.curveCreatePreviewChange",
    "nested.curveCreatePreviewFail",
    "nested.curveCreateButton",
    "nested.curveCreateOk",
    "nested.curveCreateAlreadyHas",
    "nested.curveCreateReverse",
    "nested.curveCreateFail",
  ];
  const vars = { dur: "4", tin: "0", tout: "4", oldOut: "4", newOut: "4", name: "n1", reason: "r" };
  for (const k of keys) {
    const text = i18nT(k, vars);
    assert(!text.includes(k), `key ${k} không được rò key thô: ${text}`);
    assert(!text.includes("{") && !text.includes("}"), `key ${k} không được rò biến: ${text}`);
    assert(text.length > 0, `key ${k} không được rỗng`);
  }
  // Key T2 mà panel dùng cho nhánh twoLevel (do luồng T2 thêm, panel này
  // chỉ dùng, không sở hữu): cũng phải render được ở lang en.
  const t2 = i18nT("nested.curveTwoLevelInvalid", vars);
  assert(!t2.includes("nested.curveTwoLevelInvalid"), `key T2 không được rò key thô: ${t2}`);
  assert(!t2.includes("{") && !t2.includes("}"), `key T2 không được rò biến: ${t2}`);
  assert(i18nT("nested.curveCreatePreviewSame", vars).includes("4"), "preview same phải chứa số đã thay");
  assert(i18nT("nested.curveCreateButton").includes("1"), "nút en phải nói 1×");
});

setLang("vi");
console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
