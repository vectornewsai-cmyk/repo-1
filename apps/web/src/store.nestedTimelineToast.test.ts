/**
 * store.nestedTimelineToast.test.ts — Test qua store thật, Phase 9 đợt 19
 * (luồng G3): toast đúng thời điểm tách/trim nested clip bị từ chối +
 * i18n cho toàn bộ câu báo nested.
 *
 * CHẠY NHƯ CÁC FILE `.store.test.ts` KHÁC (store.ts dùng import không
 * đuôi mở rộng mà chỉ Vite mới phân giải — không chạy bằng `node`
 * trực tiếp):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedTimelineToast.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedTimelineToast.test.cjs --log-level=warning
 *   node /tmp/store.nestedTimelineToast.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * NỘI DUNG (mỗi case cài spec mới qua useStore.setState, toast đọc qua
 * subscribeToasts + clearToasts của lib/toast; mỗi case dùng nested id
 * RIÊNG vì store có dedup toast 5s theo (op, track, clip, field) —
 * dùng chung id sẽ làm case sau bị dedup oan, xem T5):
 *  S1. splitAtPlayhead nested mang curve → false, spec không đổi,
 *      undoDepth không đổi, đúng 1 toast error vi chứa tên + field + fix.
 *  S2. splitAtPlayhead nested reverse → false + toast reverse.
 *  S3. splitAtPlayhead nested cả hai field → toast "speedKeyframes + reverse"
 *      + fix cả hai.
 *  S4. splitAtPlayhead nested thường → true, thành 2 clip, 0 toast.
 *  S5. splitAtPlayhead video mang curve (hợp lệ, không phải nested)
 *      → true, 0 toast (detector không được báo oan clip thường).
 *  S6. splitAtPlayhead nested curve nhưng playhead sát mép (0.03, trong
 *      margin 0.05) → false nhưng 0 toast (thất bại do margin, không
 *      phải do field — không báo giả).
 *  S7. splitAtPlayhead nested curve trên track khóa → false, 0 toast.
 *  T1. trimClip trái nested curve (delta +1) → spec không đổi, 1 toast.
 *  T2. trimClip phải nested reverse (delta -1) → spec không đổi, 1 toast.
 *  T3. trimClip trái nested thường (delta +1) → start 1/duration 3, 0 toast.
 *  T4. trimClip trái nested curve delta 0 (no-op) → 0 toast.
 *  T5. trimClip trái nested curve 2 lần liên tiếp (kéo trim) → tổng 1
 *      toast (dedup chống spam pointermove).
 *  M1. splitClipAtTimes nested curve, điểm trong clip → 0 + 1 toast.
 *  M2. splitClipAtTimes nested curve, điểm ngoài clip → 0 + 0 toast.
 *  M3. splitClipAtTimes nested thường, điểm trong clip → 1 + 0 toast.
 *  I1. i18n: builder + detector — vi/en đều resolve đủ key (không rò
 *      key thô), reverse:false và clip thường không bị tính vi phạm.
 *
 * GIỚI HẠN (trung thực): test này chạy store + toast module + i18n
 * thuần, KHÔNG chạy DOM — TopBar (flash suppression) và NestedClipPanel
 * (toast khi liệt kê) vẫn chỉ được kiểm chứng bằng tsc + build, như
 * đợt 18 đã ghi. Xem docs/PHASE9_ROUND19_G3_TIMELINE_TOAST_I18N_LIMITS.md.
 */

import { useStore } from "./store";
import { subscribeToasts, clearToasts, type ToastItem } from "./lib/toast";
import { t as i18nT, setLang } from "./i18n";
import {
  nestedSpeedRejectionFields,
  nestedSpeedRejectionMessage,
} from "./components/nested/nestedRejection";
import type { Clip, VideoSpec } from "@repo-1/video-spec";

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

function contains(hay: string, needle: string, what = ""): void {
  if (!hay.includes(needle)) {
    throw new Error(`${what} thiếu "${needle}" trong: ${hay}`);
  }
}

type AnyClip = Record<string, unknown> & {
  id: string;
  start: number;
  duration: number;
};

function subSpec(tracks: { id: string; kind: string; clips: AnyClip[] }[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: tracks.map((t) => ({
      id: t.id,
      kind: t.kind,
      clips: t.clips as unknown as Clip[],
    })),
  } as unknown as VideoSpec;
}

function videoLeaf(id: string, start: number, duration: number): AnyClip {
  return {
    kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration,
  };
}

const CURVE = {
  keyframes: [
    { time: 0, speed: 1, easing: "linear" },
    { time: 4, speed: 2, easing: "linear" },
  ],
};

function nestedTop(
  id: string,
  inner: VideoSpec,
  extra?: Record<string, unknown>,
): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Compound ${id}`,
    ...(extra ?? {}),
  };
}

/** Cài spec mới toanh vào store (mỗi case gọi lại để độc lập). */
function install(
  top: AnyClip,
  opts?: { playhead?: number; select?: boolean; locked?: boolean },
): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested timeline toast test", width: 64, height: 64, fps: 30 },
    tracks: [{
      id: "v1", kind: "video", locked: opts?.locked ?? false,
      clips: [top],
    }],
  };
  useStore.setState({
    spec: spec as never,
    selection: opts?.select === false ? [] : [{ trackId: "v1", clipId: top.id }],
    playhead: opts?.playhead ?? 2,
    rippleMode: false,
  });
  clearToasts();
}

function toastsNow(): ToastItem[] {
  let out: ToastItem[] = [];
  const unsub = subscribeToasts((list) => {
    out = list;
  });
  unsub();
  return out;
}

function topNow(id: string): AnyClip {
  const track = useStore.getState().spec.tracks.find((t) => t.id === "v1");
  if (!track) throw new Error("mất track v1");
  const top = track.clips.find((c) => c.id === id);
  if (!top) throw new Error(`mất clip ${id}`);
  return top as unknown as AnyClip;
}

function leafSpec(): VideoSpec {
  return subSpec([{ id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 4)] }]);
}

// ===========================================================================
// S1–S7. splitAtPlayhead
// ===========================================================================
console.log("== S. splitAtPlayhead ==");

test("S1: nested curve tách tại playhead → false, spec + undoDepth không đổi, 1 toast error vi", () => {
  const top = nestedTop("nS1", leafSpec(), { speedKeyframes: CURVE });
  install(top);
  const before = JSON.stringify(topNow("nS1"));
  const depthBefore = useStore.getState().undoDepth;
  eq(useStore.getState().splitAtPlayhead(), false, "phải tách thất bại");
  eq(JSON.stringify(topNow("nS1")), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh entry undo");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  eq(ts[0].kind, "error", "toast kind error");
  contains(ts[0].message, "Compound nS1", "toast tên clip");
  contains(ts[0].message, "speedKeyframes", "toast field");
  contains(ts[0].message, "Gỡ speed curve khỏi nested clip rồi thử lại.", "toast fix curve vi");
});

test("S2: nested reverse tách tại playhead → false + toast reverse", () => {
  const top = nestedTop("nS2", leafSpec(), { reverse: true });
  install(top);
  const before = JSON.stringify(topNow("nS2"));
  eq(useStore.getState().splitAtPlayhead(), false, "phải tách thất bại");
  eq(JSON.stringify(topNow("nS2")), before, "spec không đổi");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  contains(ts[0].message, "reverse", "toast field");
  contains(ts[0].message, "Tắt reverse khỏi nested clip rồi thử lại.", "toast fix reverse vi");
});

test("S3: nested cả curve + reverse → toast cả hai field + fix cả hai", () => {
  const top = nestedTop("nS3", leafSpec(), { speedKeyframes: CURVE, reverse: true });
  install(top);
  eq(useStore.getState().splitAtPlayhead(), false, "phải tách thất bại");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  contains(ts[0].message, "speedKeyframes + reverse", "toast cả hai field");
  contains(ts[0].message, "Gỡ speed curve và tắt reverse khỏi nested clip rồi thử lại.", "toast fix cả hai vi");
});

test("S4: nested thường tách tại playhead → true, thành 2 clip, 0 toast", () => {
  const top = nestedTop("nS4", leafSpec());
  install(top);
  eq(useStore.getState().splitAtPlayhead(), true, "phải tách được");
  eq(useStore.getState().spec.tracks[0].clips.length, 2, "thành 2 clip");
  eq(toastsNow().length, 0, "không toast");
});

test("S5: video mang curve (không phải nested) tách tại playhead → true, 0 toast", () => {
  const video = {
    kind: "video", id: "vS5", src: "src.mp4", start: 0, duration: 4,
    in: 0, out: 4, speedKeyframes: CURVE,
  } as unknown as AnyClip;
  install(video);
  eq(useStore.getState().splitAtPlayhead(), true, "video curve phải tách được");
  eq(toastsNow().length, 0, "không toast cho clip thường mang curve");
});

test("S6: nested curve nhưng playhead sát mép (0.03) → false, 0 toast", () => {
  const top = nestedTop("nS6", leafSpec(), { speedKeyframes: CURVE });
  install(top, { playhead: 0.03 });
  eq(useStore.getState().splitAtPlayhead(), false, "sát mép phải thất bại");
  eq(toastsNow().length, 0, "thất bại do margin thì không báo field");
});

test("S7: nested curve trên track khóa → false, 0 toast", () => {
  const top = nestedTop("nS7", leafSpec(), { speedKeyframes: CURVE });
  install(top, { locked: true });
  eq(useStore.getState().splitAtPlayhead(), false, "track khóa phải thất bại");
  eq(toastsNow().length, 0, "thất bại do khóa thì không báo field");
});

// ===========================================================================
// T1–T5. trimClip (Timeline kéo trim)
// ===========================================================================
console.log("== T. trimClip ==");

test("T1: trim trái nested curve (delta +1) → spec không đổi, 1 toast", () => {
  const top = nestedTop("nT1", leafSpec(), { speedKeyframes: CURVE });
  install(top);
  const before = JSON.stringify(topNow("nT1"));
  useStore.getState().trimClip("v1", "nT1", "left", 1);
  eq(JSON.stringify(topNow("nT1")), before, "spec không đổi");
  eq(toastsNow().length, 1, "đúng 1 toast");
  eq(toastsNow()[0].kind, "error", "toast kind error");
});

test("T2: trim phải nested reverse (delta -1) → spec không đổi, 1 toast", () => {
  const top = nestedTop("nT2", leafSpec(), { reverse: true });
  install(top);
  const before = JSON.stringify(topNow("nT2"));
  useStore.getState().trimClip("v1", "nT2", "right", -1);
  eq(JSON.stringify(topNow("nT2")), before, "spec không đổi");
  eq(toastsNow().length, 1, "đúng 1 toast");
});

test("T3: trim trái nested thường (delta +1) → start 1/duration 3, 0 toast", () => {
  const top = nestedTop("nT3", leafSpec());
  install(top);
  useStore.getState().trimClip("v1", "nT3", "left", 1);
  eq(topNow("nT3").start, 1, "start mới");
  eq(topNow("nT3").duration, 3, "duration mới");
  eq(toastsNow().length, 0, "trim thành công thì không toast");
});

test("T4: trim trái nested curve delta 0 (no-op) → 0 toast", () => {
  const top = nestedTop("nT4", leafSpec(), { speedKeyframes: CURVE });
  install(top);
  useStore.getState().trimClip("v1", "nT4", "left", 0);
  eq(toastsNow().length, 0, "no-op thì không báo");
});

test("T5: trim trái nested curve 2 lần liên tiếp (mô phỏng kéo) → tổng 1 toast", () => {
  const top = nestedTop("nT5", leafSpec(), { speedKeyframes: CURVE });
  install(top);
  useStore.getState().trimClip("v1", "nT5", "left", 1);
  useStore.getState().trimClip("v1", "nT5", "left", 1);
  eq(toastsNow().length, 1, "dedup 5s chặn toast thứ hai");
});

// ===========================================================================
// M1–M3. splitClipAtTimes (Scene/Beat modal)
// ===========================================================================
console.log("== M. splitClipAtTimes ==");

test("M1: nested curve, điểm trong clip → 0 + 1 toast", () => {
  const top = nestedTop("nM1", leafSpec(), { speedKeyframes: CURVE });
  install(top);
  eq(useStore.getState().splitClipAtTimes("v1", "nM1", [2]), 0, "không tách được điểm nào");
  eq(toastsNow().length, 1, "đúng 1 toast");
});

test("M2: nested curve, điểm ngoài clip → 0 + 0 toast", () => {
  const top = nestedTop("nM2", leafSpec(), { speedKeyframes: CURVE });
  install(top);
  eq(useStore.getState().splitClipAtTimes("v1", "nM2", [10]), 0, "không tách được điểm nào");
  eq(toastsNow().length, 0, "điểm ngoài clip thì không báo field");
});

test("M3: nested thường, điểm trong clip → 1 + 0 toast", () => {
  const top = nestedTop("nM3", leafSpec());
  install(top);
  eq(useStore.getState().splitClipAtTimes("v1", "nM3", [2]), 1, "tách được 1 điểm");
  eq(toastsNow().length, 0, "tách thành công thì không toast");
});

// ===========================================================================
// I1. i18n + detector
// ===========================================================================
console.log("== I. i18n + detector ==");

test("I1: đủ key vi/en, không rò key thô; reverse:false và clip thường không vi phạm", () => {
  setLang("en");
  const enMsg = nestedSpeedRejectionMessage(i18nT, "Comp", ["speedKeyframes", "reverse"]);
  contains(enMsg, "carries", "en speedRejected");
  contains(enMsg, "render worker forbids", "en cấm");
  contains(enMsg, "Remove the speed curve and turn off reverse", "en fix cả hai");
  assert(!enMsg.includes("nested."), "en không được rò key thô");
  setLang("vi");
  const viMsg = nestedSpeedRejectionMessage(i18nT, "Comp", ["speedKeyframes"]);
  contains(viMsg, "mang", "vi speedRejected");
  contains(viMsg, "cấm", "vi cấm");
  contains(viMsg, "Gỡ speed curve khỏi nested clip", "vi fix curve");
  assert(!viMsg.includes("nested."), "vi không được rò key thô");
  eq(nestedSpeedRejectionMessage(i18nT, "Comp", []), "", "không field → chuỗi rỗng");
  const sub = leafSpec();
  eq(nestedSpeedRejectionFields(nestedTop("nI1", sub, { reverse: false })), [], "reverse:false không vi phạm");
  eq(nestedSpeedRejectionFields(nestedTop("nI1", sub)), [], "nested thường không vi phạm");
  eq(
    nestedSpeedRejectionFields({ kind: "video", id: "v", subSpec: sub, speedKeyframes: CURVE }),
    [],
    "clip thường mang curve không vi phạm (kind không phải nested)",
  );
  eq(
    nestedSpeedRejectionFields(nestedTop("nI1", sub, { speedKeyframes: CURVE })),
    ["speedKeyframes"],
    "nested curve vi phạm",
  );
});

console.log(`\nstore.nestedTimelineToast: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
