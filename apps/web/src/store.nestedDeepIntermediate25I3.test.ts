/**
 * store.nestedDeepIntermediate25I3.test.ts — Test Phase 9 đợt 25
 * (luồng I3): store action mới updateNestedDeepIntermediateClip —
 * sửa vị trí (start/duration) của 1 nested TRUNG GIAN ở cấp sâu.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedDeepLeaf24H6.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedDeepIntermediate25I3.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedDeepIntermediate25I3.test.cjs --log-level=warning
 *   node /tmp/store.nestedDeepIntermediate25I3.test.cjs
 *
 * ĐỊA CHỈ (quy ước hàm thuần sâu): parentChainIds là chain tới tầng
 * CHỨA TRỰC TIẾP đích, không bao gồm đích. Fixture chuẩn 3 tầng:
 * top (timeline v1) > mid > in > deep (đích) + lá dl trong deep.
 * Đích "deep" có parentChainIds ["mid", "in"] (chain sâu ≥ 2 theo
 * yêu cầu nhiệm vụ); mỗi test cài lại spec mới qua useStore.setState.
 *
 * NỘI DUNG:
 *  S1. Đích nested hợp lệ ở chain sâu ["mid","in"] sửa được start
 *      (0 → 1): ok, +1 undo, undo khôi phục, curveDropped 0.
 *  S2. Đổi duration của đích (2 → 1) khi nguồn tầng chứa còn dài
 *      (lá dài 0..4 giữ source = 4): ok, deep.duration = 1.
 *  S3. Cặp hai tầng HỢP LỆ của chính đích (đích 1× × lá 1×) không bị
 *      chặn oan khi dời: ok, curve đích giữ nguyên.
 *  B1. Chain sai id (["mid","wrong"]) → ok:false, không reason/
 *      reasonKey/check, không toast, spec + undo không đổi.
 *  B2. Đích là lá (clip thường trong tầng chứa) → ok:false, không
 *      reason (action này chỉ sửa nested trung gian).
 *  B3. Đè clip anh em cùng track → ok:false, spec không đổi.
 *  B4. Vượt duration tầng chứa → ok:false, spec không đổi.
 *  B5. Cặp hai tầng của chính đích VI PHẠM (đích 4× × lá 2×, tích
 *      8 > 4) → ok:false + twoLevelCheck.reasonCode combinedRange +
 *      reasonKey nested.twoLevelCombinedRange + reason đã dịch,
 *      spec + undo không đổi (không sinh undo khi bị chặn), ở cả
 *      vi lẫn en (en không rò dấu Việt).
 *
 * PHẠM VI: panel không có DOM test runner nên DeepIntermediateEditor
 * chỉ kiểm chứng bằng tsc + build như các đợt trước; phần khóa bằng
 * test là store action mà editor gọi (đúng hình gọi của editor).
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang } from "./i18n";
import type { Clip, NestedClip, SpeedCurve, VideoSpec } from "@repo-1/video-spec";

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

type AnyClip = Record<string, unknown> & {
  id: string;
  start: number;
  duration: number;
};

function subSpec(tracks: { id: string; clips: AnyClip[] }[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: tracks.map((t) => ({
      id: t.id,
      kind: "video",
      clips: t.clips as unknown as Clip[],
    })),
  } as unknown as VideoSpec;
}

function videoLeaf(id: string, start: number, duration: number, extra?: Record<string, unknown>): AnyClip {
  return { kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration, ...(extra ?? {}) };
}

function constCurve(v: number, dur: number): SpeedCurve {
  return {
    keyframes: [
      { t: 0, v, easing: "linear" },
      { t: dur, v, easing: "linear" },
    ],
  };
}

function nested(id: string, start: number, duration: number, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start, duration, speed: 1,
    trim: { in: 0, out: duration }, subSpec: inner, name: `Compound ${id}`,
    ...(extra ?? {}),
  };
}

/**
 * Cài fixture 3 tầng top > mid > in > deep. deepExtra gắn lên chính
 * đích deep (curve riêng); leafExtra gắn lên lá dl trong deep;
 * sibOnIt1 thêm clip anh em cùng track it1 của đích (cho test đè).
 */
function install(opts?: {
  deepExtra?: Record<string, unknown>;
  leafExtra?: Record<string, unknown>;
  sibOnIt1?: boolean;
}): void {
  const deep = nested(
    "deep", 0, 2,
    subSpec([{ id: "dt1", clips: [videoLeaf("dl", 0, 2, opts?.leafExtra)] }]),
    opts?.deepExtra,
  );
  const inClips: AnyClip[] = [deep];
  if (opts?.sibOnIt1) inClips.push(videoLeaf("sib", 2, 2));
  const inner = nested(
    "in", 0, 4,
    subSpec([
      { id: "it1", clips: inClips },
      { id: "it2", clips: [videoLeaf("il", 0, 4)] },
    ]),
  );
  const mid = nested(
    "mid", 0, 4,
    subSpec([
      { id: "mt1", clips: [inner] },
      { id: "mt2", clips: [videoLeaf("ml", 0, 4)] },
    ]),
  );
  const top = nested("top", 0, 4, subSpec([{ id: "t1", clips: [mid] }]));
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested deep intermediate 25I3 test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  };
  useStore.setState({ spec: spec as never, selection: [], playhead: 0, rippleMode: false });
}

/** Đọc đích deep hiện tại từ spec của store (top > mid > in > deep). */
function deepNow(): NestedClip {
  const top = useStore.getState().spec.tracks.find((t) => t.id === "v1")
    ?.clips.find((c) => c.id === "top") as unknown as NestedClip;
  if (!top) throw new Error("mất top");
  const mid = top.subSpec.tracks.flatMap((t) => t.clips).find((c) => c.id === "mid") as unknown as NestedClip;
  if (!mid) throw new Error("mất mid");
  const inner = mid.subSpec.tracks.flatMap((t) => t.clips).find((c) => c.id === "in") as unknown as NestedClip;
  if (!inner) throw new Error("mất in");
  const deep = inner.subSpec.tracks.flatMap((t) => t.clips).find((c) => c.id === "deep") as unknown as NestedClip;
  if (!deep) throw new Error("mất deep");
  return deep;
}

function specJson(): string {
  return JSON.stringify(useStore.getState().spec);
}

// Toast hiện tại (subscribe giữ snapshot mới nhất).
let seenToasts: ToastItem[] = [];
subscribeToasts((items) => {
  seenToasts = items;
});
function freshToasts(): void {
  clearToasts();
  seenToasts = [];
}

// ===========================================================================
console.log("== S1–S3. Sửa được ở chain sâu ==");

test("S1: chain sâu [mid,in] — dời đích deep 0 → 1: ok, +1 undo, undo khôi phục, curveDropped 0", () => {
  setLang("vi");
  freshToasts();
  install();
  const before = specJson();
  const depthBefore = useStore.getState().undoDepth;
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it1", "deep", { start: 1 });
  eq(res.ok, true, "dời hợp lệ phải ok");
  eq(res.curveDropped, 0, "dời thuần không cắt keyframe");
  eq(deepNow().start, 1, "deep.start mới");
  eq(deepNow().duration, 2, "deep.duration giữ nguyên");
  eq(useStore.getState().undoDepth, depthBefore + 1, "sửa là đúng 1 entry undo");
  useStore.getState().undo();
  eq(specJson(), before, "undo xong spec quay đúng trạng thái trước sửa");
  eq(useStore.getState().undoDepth, depthBefore, "undoDepth quay về mức trước sửa");
});

test("S2: đổi duration đích 2 → 1 (nguồn tầng chứa còn dài nhờ lá il 0..4): ok, duration mới", () => {
  setLang("vi");
  freshToasts();
  install();
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it1", "deep", { duration: 1 });
  eq(res.ok, true, "thu ngắn hợp lệ phải ok");
  eq(deepNow().duration, 1, "deep.duration mới");
  eq(deepNow().start, 0, "deep.start giữ nguyên");
});

test("S3: cặp hai tầng HỢP LỆ của đích (đích 1× × lá 1×) — dời không bị chặn oan, curve đích giữ nguyên", () => {
  setLang("vi");
  freshToasts();
  install({ deepExtra: { speedKeyframes: constCurve(1, 2) }, leafExtra: { speedKeyframes: constCurve(1, 2) } });
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it1", "deep", { start: 1 });
  eq(res.ok, true, "cặp hợp lệ không được chặn");
  eq(deepNow().start, 1, "deep.start mới");
  const curve = (deepNow() as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  assert(curve !== undefined, "curve đích còn nguyên sau khi dời");
  eq(curve, constCurve(1, 2), "curve đích không đổi");
});

// ===========================================================================
console.log("== B1–B4. Chain sai / đích sai / hình học sai ==");

test("B1: chain sai id [mid,wrong] → ok:false, không reason/reasonKey/check/toast, spec + undo không đổi", () => {
  setLang("vi");
  freshToasts();
  install();
  const before = specJson();
  const depthBefore = useStore.getState().undoDepth;
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "wrong"], "it1", "deep", { start: 1 });
  eq(res.ok, false, "chain sai phải chặn");
  eq(res.reason, undefined, "lỗi chain không mạo nhận thành nhánh cổng");
  eq(res.reasonKey, undefined, "lỗi chain không có reasonKey");
  eq(res.twoLevelCheck, undefined, "lỗi chain không có check");
  eq(seenToasts.length, 0, "lỗi chain không toast");
  eq(specJson(), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh undo");
});

test("B2: đích là lá (clip il trên it2) → ok:false, không reason, spec không đổi", () => {
  setLang("vi");
  freshToasts();
  install();
  const before = specJson();
  const depthBefore = useStore.getState().undoDepth;
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it2", "il", { start: 1 });
  eq(res.ok, false, "đích lá phải chặn (dùng action lá sâu)");
  eq(res.reason, undefined, "đích lá không có reason cổng");
  eq(specJson(), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh undo");
});

test("B3: đè clip anh em cùng track (sib 2..4 trên it1, dời deep tới 1) → ok:false, spec không đổi", () => {
  setLang("vi");
  freshToasts();
  install({ sibOnIt1: true });
  const before = specJson();
  const depthBefore = useStore.getState().undoDepth;
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it1", "deep", { start: 1 });
  eq(res.ok, false, "đè anh em phải chặn");
  eq(specJson(), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh undo");
});

test("B4: vượt duration tầng chứa (dời deep tới 3, duration 2 → hết 5 > 4) → ok:false, spec không đổi", () => {
  setLang("vi");
  freshToasts();
  install();
  const before = specJson();
  const depthBefore = useStore.getState().undoDepth;
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it1", "deep", { start: 3 });
  eq(res.ok, false, "vượt tầng chứa phải chặn");
  eq(specJson(), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh undo");
});

// ===========================================================================
console.log("== B5. Cổng hai tầng của chính đích ==");

test("B5-vi: đích 4× × lá 2× (tích 8 > 4) → chặn đúng combinedRange, reasonKey đúng, spec + undo không đổi", () => {
  setLang("vi");
  freshToasts();
  install({ deepExtra: { speedKeyframes: constCurve(4, 2) }, leafExtra: { speedKeyframes: constCurve(2, 2) } });
  const before = specJson();
  const depthBefore = useStore.getState().undoDepth;
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it1", "deep", { start: 1 });
  eq(res.ok, false, "cặp vi phạm phải chặn");
  assert(res.twoLevelCheck !== undefined, "phải trả check nguyên");
  eq(res.twoLevelCheck.reasonCode, "combinedRange", "code phải là combinedRange");
  eq(res.reasonKey, "nested.twoLevelCombinedRange", "reasonKey phải ánh xạ từ code");
  assert((res.reason ?? "").includes("vượt khoảng"), `reason vi phải nói vượt khoảng: ${res.reason}`);
  eq(specJson(), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh undo khi bị chặn");
});

test("B5-en: cùng cặp vi phạm ở locale en → reasonKey đúng, reason không rò dấu Việt", () => {
  setLang("en");
  freshToasts();
  install({ deepExtra: { speedKeyframes: constCurve(4, 2) }, leafExtra: { speedKeyframes: constCurve(2, 2) } });
  const before = specJson();
  const res = useStore.getState().updateNestedDeepIntermediateClip("v1", "top", ["mid", "in"], "it1", "deep", { start: 1 });
  eq(res.ok, false, "cặp vi phạm phải chặn ở en");
  eq(res.reasonKey, "nested.twoLevelCombinedRange", "reasonKey không đổi theo locale");
  assert(res.twoLevelCheck !== undefined && res.twoLevelCheck.reasonCode === "combinedRange", "check en vẫn mang code");
  const reason = res.reason ?? "";
  assert(!reason.includes("vượt khoảng") && !reason.includes("tổ tiên"), `reason en không được rò tiếng Việt: ${reason}`);
  assert(reason.includes("exceeds"), `reason en phải là bản dịch combinedRange: ${reason}`);
  eq(specJson(), before, "spec không đổi");
});

setLang("vi");
console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
