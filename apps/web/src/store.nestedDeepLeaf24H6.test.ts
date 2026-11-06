/**
 * store.nestedDeepLeaf24H6.test.ts — Test Phase 9 đợt 24 (luồng H6):
 * nút panel cho lá SÂU hơn 1 tầng (DeepInnerLevel, chain ≥ 1).
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedLeafGate23G2.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedDeepLeaf24H6.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedDeepLeaf24H6.test.cjs --log-level=warning
 *   node /tmp/store.nestedDeepLeaf24H6.test.cjs
 *
 * NỘI DUNG (mọi case đều qua STORE ACTION THẬT updateNestedDeepInnerClip
 * với chain sâu ["mid", "in"] — đúng hình gọi của nút "Đặt curve 1×
 * cho lá" trong DeepInnerLevel; panel không có DOM test runner nên
 * phần component chỉ kiểm chứng bằng tsc + build như các đợt trước):
 *  D. 3 nhánh G2-ghi-nợ ở chain sâu: leafSelfCurveInvalid,
 *     ancestorCurveInvalid (curve của tầng "in" vi phạm R1),
 *     ancestorKeyframeProduct (tổ tiên 4× × lá 2×, patch chế tay —
 *     xem ghi chú trung thực bên dưới về preset 1×).
 *  P. Nút preset 1× ở chain sâu (đúng patch createNestedCurvePreset):
 *     thành công khi cặp hợp lệ; bị chặn đúng nhánh ancestorReverse
 *     (tầng "in" reverse) và leafNonMedia (lá chữ sâu) — 2 nhánh này
 *     nút preset TỚI ĐƯỢC trong use thường vì preset đi qua kiểm tra
 *     lá/tổ tiên trước khi tới tích keyframe.
 *  N. Chain sai id → ok:false, không reason, không toast (lỗi dây
 *     chain không được mạo nhận thành nhánh cổng).
 *
 * GHI CHÚ TRUNG THỰC (khóa bằng thiết kế test, không bằng claim):
 * với preset 1×, leafSelfCurveInvalid và ancestorKeyframeProduct KHÔNG
 * thể sinh ra từ trạng thái chỉ tạo bằng panel: preset 1 keyframe
 * t=0/v=1 luôn hợp lệ với mọi duration, và tích keyframe với 1× bằng
 * đúng keyframe tổ tiên — tổ tiên đã hợp lệ thì tích nằm trong
 * [0.25, 4] (cổng kiểm tra ancestorCurveInvalid TRƯỚC product nên
 * tổ tiên vi phạm sẽ rơi vào nhánh invalid, không rơi vào product).
 * Vì vậy 2 nhánh này trong nhóm D dùng patch chế tay (lá v=5; lá 2×
 * trên tổ tiên 4×) để khóa đường dây store ở chain sâu, còn nút preset
 * chỉ tới được chúng khi project đã có sẵn curve vi phạm (import/MCP/
 * dựng tay) — xem LIMITS H6. ancestorCurveInvalid thì nút preset
 * tới được ngay khi tầng tổ tiên đã mang curve vi phạm sẵn (nhóm D
 * dùng patch preset cho nhánh này cũng được, nhưng test dùng patch
 * chế tay cho nhất quán với G2; nhánh preset-ancestor-invalid được
 * suy ra từ cùng thứ tự kiểm tra của cổng, không claim riêng).
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang } from "./i18n";
import { createNestedCurvePreset } from "./components/nested/nestedCurveCreate";
import type { Clip, SpeedCurve, VideoSpec } from "@repo-1/video-spec";

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
  if (hay.includes(needle)) return;
  throw new Error(`${what} thiếu "${needle}" trong: ${hay}`);
}

function notContains(hay: string, needle: string, what = ""): void {
  if (hay.includes(needle)) throw new Error(`${what} thừa "${needle}" trong: ${hay}`);
}

/** Dấu tiếng Việt: toast locale en không được chứa bất kỳ dấu nào trong này. */
const VI_MARKERS = [
  "đang reverse",
  "tổ tiên",
  "clip lá",
  "không hợp lệ",
  "vượt khoảng",
  "mang attachment",
  "trục nguồn",
  "Không đặt",
];

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

function videoLeaf(id: string, extra?: Record<string, unknown>): AnyClip {
  return { kind: "video", id, src: "src.mp4", start: 0, duration: 4, in: 0, out: 4, ...(extra ?? {}) };
}

function textLeaf(id: string): AnyClip {
  return { kind: "text", id, start: 0, duration: 4, text: "x" };
}

/** Curve hằng v (2 keyframe, đủ cho kiểm tra keyframe/range của cổng). */
function constCurve(v: number, dur = 4): SpeedCurve {
  return {
    keyframes: [
      { t: 0, v, easing: "linear" },
      { t: dur, v, easing: "linear" },
    ],
  };
}

function nestedTop(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Compound ${id}`,
    ...(extra ?? {}),
  };
}

function nestedChild(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Child ${id}`,
    ...(extra ?? {}),
  };
}

function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested deep leaf 24H6 test", width: 64, height: 64, fps: 30 },
    tracks: [{
      id: "v1", kind: "video", locked: false,
      clips: [top],
    }],
  };
  useStore.setState({
    spec: spec as never,
    selection: [{ trackId: "v1", clipId: top.id }],
    playhead: 2,
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

/** Lá sâu top → mid → in (chain ["mid", "in"]) sau khi action chạy. */
function deepLeaf(): AnyClip | undefined {
  const top = useStore.getState().spec.tracks[0]?.clips[0] as unknown as AnyClip | undefined;
  const findNested = (spec: VideoSpec | undefined, id: string): AnyClip | undefined =>
    spec?.tracks.flatMap((t) => t.clips).find((c) => c.id === id) as unknown as AnyClip | undefined;
  const mid = findNested(top?.["subSpec"] as unknown as VideoSpec | undefined, "mid");
  const inner = findNested(mid?.["subSpec"] as unknown as VideoSpec | undefined, "in");
  const track = (inner?.["subSpec"] as unknown as VideoSpec | undefined)?.tracks
    .find((t) => t.id === "v-in");
  return track?.clips.find((c) => c.id === "L") as unknown as AnyClip | undefined;
}

/**
 * Cây sâu top → mid → in → lá. midExtra/inExtra cho phép đặt curve/
 * reverse lên từng tầng trung gian (để khóa nhánh tổ tiên sâu).
 */
function deepTop(
  leaf: AnyClip,
  topExtra: Record<string, unknown>,
  midExtra: Record<string, unknown> = {},
  inExtra: Record<string, unknown> = {},
): AnyClip {
  return nestedTop("top",
    subSpec([{
      id: "v-mid",
      clips: [nestedChild("mid",
        subSpec([{
          id: "v-mid-in",
          clips: [nestedChild("in",
            subSpec([{ id: "v-in", clips: [leaf] }]),
            inExtra,
          ) as unknown as AnyClip],
        }]),
        midExtra,
      ) as unknown as AnyClip],
    }]),
    topExtra);
}

interface DeepBranchCase {
  name: string;
  top: AnyClip;
  patch: SpeedCurve;
  reasonKey: string;
  viNeedle: string;
  enNeedle: string;
}

function deepBranchCase(c: DeepBranchCase): void {
  for (const lang of ["vi", "en"] as const) {
    test(`D/P: ${c.name} (${lang}) → chặn + toast + reasonKey + 0 undo`, () => {
      install(c.top);
      setLang(lang);
      const specBefore = JSON.stringify(useStore.getState().spec);
      const undoBefore = useStore.getState().undoDepth;
      const res = useStore.getState().updateNestedDeepInnerClip(
        "v1", "top", ["mid", "in"], "v-in", "L", { speedKeyframes: c.patch },
      );
      eq(res.ok, false, "phải bị chặn");
      eq(res.reasonKey, c.reasonKey, "reasonKey");
      assert(typeof res.reason === "string" && res.reason.length > 0, "phải có reason");
      contains(res.reason, lang === "vi" ? c.viNeedle : c.enNeedle, `${lang} reason`);
      contains(res.reason, "Compound top", "reason phải nêu tên nested clip ngoài");
      const ts = toastsNow();
      eq(ts.length, 1, "đúng 1 toast");
      eq(ts[0].kind, "error", "toast error");
      eq(ts[0].message, res.reason, "toast phải đúng reason trả về");
      contains(ts[0].message, lang === "vi" ? c.viNeedle : c.enNeedle, `${lang} toast`);
      if (lang === "en") {
        for (const m of VI_MARKERS) notContains(ts[0].message, m, "en không rò tiếng Việt");
      }
      eq(JSON.stringify(useStore.getState().spec), specBefore, "spec không đổi");
      eq(useStore.getState().undoDepth, undoBefore, "không sinh entry undo");
      const leaf = deepLeaf();
      assert(leaf !== undefined, "phải đọc được lá sâu sau action");
      eq(
        (leaf as Record<string, unknown>)["speedKeyframes"],
        undefined,
        "lá sâu không được nhận curve",
      );
      setLang("vi");
    });
  }
}

// ===========================================================================
// D. 3 nhánh nợ ở chain sâu (patch chế tay — xem ghi chú đầu file)
// ===========================================================================
console.log("== D. 3 nhánh nợ ở chain sâu ==");

deepBranchCase({
  name: "leafSelfCurveInvalid sâu — curve lá v=5, chain [mid, in]",
  top: deepTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }),
  patch: constCurve(5),
  reasonKey: "nested.twoLevelLeafSelfCurveInvalid",
  viNeedle: "Speed curve của clip lá không hợp lệ",
  enNeedle: "leaf clip's speed curve is invalid",
});

deepBranchCase({
  name: "ancestorCurveInvalid sâu — curve tầng in v=5, chain [mid, in]",
  top: deepTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }, {}, { speedKeyframes: constCurve(5) }),
  patch: constCurve(1),
  reasonKey: "nested.twoLevelAncestorCurveInvalid",
  viNeedle: 'Speed curve của nested clip tổ tiên "in" không hợp lệ',
  enNeedle: "speed curve of ancestor nested clip",
});

deepBranchCase({
  name: "ancestorKeyframeProduct sâu — top 4× × lá 2×, chain [mid, in]",
  top: deepTop(videoLeaf("L"), { speedKeyframes: constCurve(4), trim: { in: 0, out: 16 } }),
  patch: constCurve(2),
  reasonKey: "nested.twoLevelAncestorKeyframeProduct",
  viNeedle: 'Tích tốc độ keyframe của curve tổ tiên "top"',
  enNeedle: "keyframe speed product of ancestor curve",
});

// ===========================================================================
// P. Nút preset 1× ở chain sâu — đúng patch nút panel dùng
// ===========================================================================
console.log("== P. Nút preset 1× ở chain sâu ==");

deepBranchCase({
  name: "ancestorReverse sâu qua preset — tầng in reverse, chain [mid, in]",
  top: deepTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }, {}, { reverse: true }),
  patch: createNestedCurvePreset(),
  reasonKey: "nested.twoLevelAncestorReverse",
  viNeedle: 'tổ tiên "in" đang reverse',
  enNeedle: "is reversed",
});

deepBranchCase({
  name: "leafNonMedia sâu qua preset — lá chữ sâu, chain [mid, in]",
  top: deepTop(textLeaf("L"), { speedKeyframes: constCurve(1) }),
  patch: createNestedCurvePreset(),
  reasonKey: "nested.twoLevelLeafNonMedia",
  viNeedle: "Chỉ lá video/audio mới mang speed curve",
  enNeedle: "Only video/audio leaves",
});

test("P-success: preset 1× ở chain sâu, top 1× → ok, 0 toast, lá nhận preset, +1 undo", () => {
  install(deepTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }));
  setLang("vi");
  const undoBefore = useStore.getState().undoDepth;
  const preset = createNestedCurvePreset();
  const res = useStore.getState().updateNestedDeepInnerClip(
    "v1", "top", ["mid", "in"], "v-in", "L", { speedKeyframes: preset },
  );
  eq(res.ok, true, "cặp hợp lệ sâu phải cho qua");
  eq(toastsNow().length, 0, "0 toast");
  assert(useStore.getState().undoDepth > undoBefore, "phải có entry undo");
  const leaf = deepLeaf();
  assert(leaf !== undefined, "phải đọc được lá sâu");
  eq(
    (leaf as Record<string, unknown>)["speedKeyframes"],
    preset,
    "lá sâu nhận đúng preset 1× của nút panel",
  );
});

// ===========================================================================
// N. Chain sai không mạo nhận thành nhánh cổng
// ===========================================================================
console.log("== N. Chain sai ==");

test("N: chain sai id → ok:false, không reason, 0 toast, spec không đổi", () => {
  install(deepTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }));
  setLang("vi");
  const specBefore = JSON.stringify(useStore.getState().spec);
  const res = useStore.getState().updateNestedDeepInnerClip(
    "v1", "top", ["mid", "wrong"], "v-in", "L", { speedKeyframes: createNestedCurvePreset() },
  );
  eq(res.ok, false, "chain sai phải bị chặn");
  eq(res.reason, undefined, "lỗi chain không có reason cổng");
  eq(res.reasonKey, undefined, "lỗi chain không có reasonKey cổng");
  eq(toastsNow().length, 0, "lỗi chain không toast cổng");
  eq(JSON.stringify(useStore.getState().spec), specBefore, "spec không đổi");
});

console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
