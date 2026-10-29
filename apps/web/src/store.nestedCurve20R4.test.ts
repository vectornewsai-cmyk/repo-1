/**
 * store.nestedCurve20R4.test.ts — Test qua store thật, Phase 9 đợt 20
 * (luồng R4): UI chế độ curve cho nested + i18n 3 toast G2.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedCurve19.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedCurve20R4.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedCurve20R4.test.cjs --log-level=warning
 *   node /tmp/store.nestedCurve20R4.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * NỘI DUNG (mỗi case cài lại spec mới qua useStore.setState):
 *  P1. Preview chế độ giữ duration (logic thuần panel dùng):
 *      nested D=4 trim [0,4) + curve 1→2 → trim.out kỳ vọng 6.
 *  P2. Preview chế độ giữ trim (logic thuần panel dùng):
 *      nested trim [0,6) + curve 1→2 → duration kỳ vọng 4, trim giữ nguyên.
 *  P3. Preview giữ trim fail đúng (reverse; trim hẹp cho duration < 0.2s):
 *      applyNestedCurveFixedTrim trả null — panel hiện câu fail, không số ảo.
 *  E1. Lang en, patchClip xung đột hai tầng → toast tiếng Anh, không rò
 *      key thô "nested.curveTwoLevel", không rò biến "{name}".
 *  E2. Lang en, curve + trim tường minh lệch tích phân → toast tiếng Anh
 *      báo render từ chối kèm đúng số (4 / 6), không rò "{actualOut}".
 *  E3. Lang en, curve vượt nguồn con → toast tiếng Anh cảnh báo vượt
 *      nguồn, không rò "{sourceDuration}".
 *  V1. Lang vi, lệch tích phân → toast BẰNG ĐÚNG câu tiếng Việt gốc của
 *      G2 (nội dung cảnh báo giữ nguyên, chỉ chuyển qua key i18n).
 *  V2. Lang vi, xung đột hai tầng → toast vẫn nói "hai tầng".
 *  A1. Action patchNestedCurveFixedTrim (đường panel gọi ở chế độ giữ
 *      trim): trim [0,6) + curve 1→2 → ok, duration 4, trim giữ nguyên.
 *  A2. Action trim-cố-định khi lá con đã có curve → ok:false, reason
 *      khác rỗng (panel toast reason này — reason rỗng mới là im lặng),
 *      spec không đổi.
 *  C1. Nút áp giữ duration của panel truyền BẢN COPY của curve (không
 *      phải đúng object của clip): patchClip cùng tham chiếu bị cổng
 *      no-change nuốt im lặng (trim.out lệch giữ nguyên 5); bản copy
 *      cùng nội dung thì trim.out tính lại thành 6. Đây là lý do panel
 *      bắt buộc copy trước khi gọi patchClip.
 *
 * KHÔNG test component panel trên DOM: repo không có DOM test runner
 * (không vitest/jsdom/testing-library) nên phần radio/preview/nút áp
 * của NestedCurveModeEditor chưa click-test browser thật — xem LIMITS R4.
 * Phần đã khóa bằng test: helper thuần panel dùng + đường store/i18n
 * mà panel gọi (toast/action), đúng phạm vi test được ở đây.
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang } from "./i18n";
import {
  applyNestedCurveFixedTrim,
  nestedCurveExpectedOut,
} from "./components/nested/nestUtils";
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

function approx(a: number, b: number, tol: number, what = ""): void {
  if (Math.abs(a - b) > tol) throw new Error(`${what} nhận ${a}, muốn ${b} ± ${tol}`);
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
    meta: { name: "nested curve20R4 test", width: 64, height: 64, fps: 30 },
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

const CURVE_1_TO_2: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

// Đợt 21 T2 (ĐỔI CÓ CHỦ ĐÍCH): LEAF_CURVE cũ là hằng 1 nên cặp với
// curve ngoài 1→2 nay HỢP LỆ theo render R1 (tốc độ hợp [1,2]) và
// không còn bị chặn — E1/V2/A2 khóa đường BỊ CHẶN nên đổi lá thành
// 1→3: tốc độ hợp lấy mẫu cuối = 1.732 × 3 = 5.196 > 4 nên vẫn bị
// chặn đúng, toast vẫn nói "hai tầng"/"two curve levels" qua key mới
// nested.curveTwoLevelInvalid (patchClip) / reasonKey cũ (fixedTrim).
const LEAF_CURVE: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 3, easing: "linear" },
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
console.log("== P1–P3. Preview thuần panel dùng (hai chế độ) ==");

test("P1: preview giữ duration — D=4 trim [0,4) curve 1→2 → trim.out kỳ vọng 6", () => {
  const top = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 });
  (top as unknown as Record<string, unknown>)["speedKeyframes"] = CURVE_1_TO_2;
  eq(nestedCurveExpectedOut(top as unknown as NestedClip), 6, "in + ∫₀⁴ (1→2) = 6");
});

test("P2: preview giữ trim — trim [0,6) curve 1→2 → duration kỳ vọng 4, trim giữ nguyên", () => {
  const top = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 8, { in: 0, out: 6 });
  const next = applyNestedCurveFixedTrim(top as unknown as NestedClip, CURVE_1_TO_2);
  assert(next !== null, "phải tính được duration");
  approx(next.duration, 4, 1e-6, "đảo tích phân của nguồn 6 qua curve 1→2");
  eq(next.trim, { in: 0, out: 6 }, "trim giữ nguyên");
});

test("P3: preview giữ trim fail đúng — reverse và trim hẹp (< 0.2s) đều trả null", () => {
  const rev = nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }, { reverse: true });
  eq(applyNestedCurveFixedTrim(rev as unknown as NestedClip, CURVE_1_TO_2), null, "reverse → null");
  const narrow = nestedTop("n2", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 0.15 });
  eq(applyNestedCurveFixedTrim(narrow as unknown as NestedClip, CURVE_1_TO_2), null, "duration tính ra 0.15 < 0.2 → null");
});

// ===========================================================================
console.log("== E1–E3. Toast G2 qua i18n, lang en (không rò key thô) ==");

test("E1: en, xung đột hai tầng → toast tiếng Anh, không rò key/biến", () => {
  setLang("en");
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: LEAF_CURVE })] }]),
    4,
    { in: 0, out: 4 },
  ));
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  const text = toastText();
  assert(text.includes("two curve levels"), `toast en phải nói two curve levels: ${text}`);
  assert(!text.includes("nested.curveTwoLevel"), `không được rò key thô: ${text}`);
  assert(!text.includes("{name}"), `không được rò biến chưa thay: ${text}`);
});

test("E2: en, lệch tích phân → toast báo render từ chối kèm số 4/6, không rò biến", () => {
  setLang("en");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  useStore.getState().patchClip(
    "v1", "n1",
    { speedKeyframes: CURVE_1_TO_2, trim: { in: 0, out: 4 } } as Partial<Clip>,
  );
  const text = toastText();
  assert(text.includes("rejected by render"), `toast en phải nói rejected by render: ${text}`);
  assert(text.includes("(4)") && text.includes("(6)"), `toast en phải kèm số 4/6: ${text}`);
  assert(!text.includes("{actualOut}") && !text.includes("{expectedOut}"), `không được rò biến: ${text}`);
});

test("E3: en, vượt nguồn → toast cảnh báo vượt nguồn, không rò biến", () => {
  setLang("en");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4)] }]), 4, { in: 0, out: 4 }));
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  const text = toastText();
  assert(text.includes("exceeding"), `toast en phải nói exceeding: ${text}`);
  assert(text.includes("tail may have no picture"), `toast en phải giữ cảnh báo đuôi: ${text}`);
  assert(!text.includes("{sourceDuration}"), `không được rò biến: ${text}`);
});

// ===========================================================================
console.log("== V1–V2. Toast G2 giữ nguyên nội dung tiếng Việt (lang vi) ==");

test("V1: vi, lệch tích phân → toast bằng đúng câu gốc G2", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  useStore.getState().patchClip(
    "v1", "n1",
    { speedKeyframes: CURVE_1_TO_2, trim: { in: 0, out: 4 } } as Partial<Clip>,
  );
  const want = "Nested clip “n1” sẽ bị render từ chối: trim.out (4) lệch khỏi in + tích phân speed curve (6) quá 1e-4s. Sửa trim hoặc curve cho khớp rồi thử lại.";
  assert(toastText().includes(want), `toast vi phải giữ nguyên câu gốc: ${toastText()}`);
});

test("V2: vi, xung đột hai tầng → toast vẫn nói hai tầng", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: LEAF_CURVE })] }]),
    4,
    { in: 0, out: 4 },
  ));
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  assert(toastText().includes("hai tầng"), `toast vi phải nói hai tầng: ${toastText()}`);
});

// ===========================================================================
console.log("== A1–A2. Action trim-cố-định (đường panel gọi) ==");

test("A1: action giữ trim — trim [0,6) + curve 1→2 → ok, duration 4, trim giữ nguyên", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 8, { in: 0, out: 6 }));
  const res = useStore.getState().patchNestedCurveFixedTrim("v1", "n1", CURVE_1_TO_2);
  eq(res.ok, true, "action ok");
  approx(res.duration as number, 4, 1e-6, "duration trả về");
  const top = topNow("n1");
  approx(top.duration, 4, 1e-6, "duration theo đảo tích phân");
  eq(top.trim, { in: 0, out: 6 }, "trim giữ nguyên");
});

test("A2: action giữ trim khi lá con đã có curve → ok:false, reason khác rỗng, spec không đổi", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: LEAF_CURVE })] }]),
    4,
    { in: 0, out: 4 },
  ));
  const before = JSON.stringify(topNow("n1"));
  const res = useStore.getState().patchNestedCurveFixedTrim("v1", "n1", CURVE_1_TO_2);
  eq(res.ok, false, "action phải từ chối");
  assert((res.reason ?? "").length > 0, "reason phải khác rỗng để panel toast được (không im lặng)");
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
});

// ===========================================================================
console.log("== C1. Panel áp giữ duration phải copy curve (cổng no-change) ==");

test("C1a: patchClip đúng tham chiếu curve cũ → bị nuốt, trim.out lệch giữ nguyên 5", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 5 }, { speedKeyframes: CURVE_1_TO_2 }));
  const curveRef = (topNow("n1") as unknown as { speedKeyframes: SpeedCurve }).speedKeyframes;
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: curveRef } as Partial<Clip>);
  eq((topNow("n1").trim as { out: number }).out, 5, "cổng no-change so sánh tham chiếu nên không exec");
});

test("C1b: patchClip bản copy cùng nội dung → trim.out tính lại thành 6", () => {
  setLang("vi");
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 5 }, { speedKeyframes: CURVE_1_TO_2 }));
  const copy: SpeedCurve = { ...CURVE_1_TO_2, keyframes: CURVE_1_TO_2.keyframes.map((k) => ({ ...k })) };
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: copy } as Partial<Clip>);
  eq((topNow("n1").trim as { out: number }).out, 6, "trim.out theo tích phân, đúng cách panel áp");
});

setLang("vi");
console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
