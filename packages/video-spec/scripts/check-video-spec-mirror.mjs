// check-video-spec-mirror.mjs — Bắt lệch mirror `.js` viết tay so với `.ts`
// trong packages/video-spec/src/ (đợt 51 H5, nợ F1 §7.4; mở rộng đợt 52 I7).
//
// Bối cảnh: video-spec giữ cặp song sinh `<tên>.ts` (Vite nạp) và
// `<tên>.js` viết tay (node --experimental-strip-types nạp qua re-export
// trong index.ts / exports map), cộng mirror thứ ba ở
// server/render/src/speedramp.js (CJS) cho speed curve. Đợt 50 F1 đã gặp
// lệch thật: `.ts` sửa `normalizeKeyframes` mà `.js` kề bên vẫn bản cũ,
// test web vẫn đỏ dù `.ts` đã đúng. Trước script này không có cơ chế nào
// bắt lệch — lần sau đổi `.ts` mà quên `.js` sẽ lặp lại.
//
// Script kiểm tra 2 tầng:
//   A. Export-set parity: mọi file `.ts` (trừ `*.test.ts`) có `.js` kề bên
//      phải export cùng tập tên runtime (function/const/class/enum).
//      Type/interface không tồn tại ở runtime nên được bỏ qua. Lệch đã
//      biết, có lý do, ghi trong KNOWN_EXPORT_GAPS (không fail).
//   B. Differential probes: chạy cùng input cố định qua cả hai (ba)
//      implementation của các hàm thuần và so sánh kết quả — gồm cả
//      trường hợp ném lỗi (so cả message) và NaN. Ngoài probe hàm còn có
//      probe hằng (`value:` — so giá trị export trực tiếp). Lệch đã biết,
//      có lý do, ghi trong KNOWN_BEHAVIOR_GAPS (in KNOWN, không fail,
//      nhưng nếu hình dạng lệch đổi khác thì FAIL để có người xem lại).
//      Đợt 52 I7 đã thống nhất xong lệch easing-unknown (TS nay ném như JS)
//      và bổ sung FADE_CURVES vào audio.js nên cả hai map known hiện RỖNG
//      — cơ chế giữ lại cho lệch mới trong tương lai.
//
// Chạy (từ repo root):
//   node packages/video-spec/scripts/check-video-spec-mirror.mjs
//   node packages/video-spec/scripts/check-video-spec-mirror.mjs --src-dir <dir>
// Thoát 0 khi không có FAIL; thoát 1 khi có FAIL (dùng được trong CI/test).
// Chạy lại phải cho cùng kết quả (không ghi file nào).
//
// Phạm vi: tầng B probe các cặp hàm thuần đã liệt kê trong PROBES; các
// module còn lại chỉ được quét export-set (tầng A) — xem LIMITS đợt 52 I7
// §4 để biết cặp nào chưa probe được và vì sao. Đợt 53 J9 đã probe nốt
// các hàm thuần của adjustment/image/sticker/mask/motion/nested/
// migrations/tracking/index (xem LIMITS đợt 53 J9 để biết hàm nào vẫn
// chưa probe được và vì sao). Thêm cặp/probe mới thì thêm vào bảng dưới,
// không sửa logic so sánh.

import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = join(here, "..");
const repoRoot = resolve(pkgDir, "..", "..");

const args = process.argv.slice(2);
function argVal(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : fallback;
}
const srcDir = argVal("--src-dir", join(pkgDir, "src"));
const renderDir = argVal("--render-dir", join(repoRoot, "server", "render", "src"));

// ---------------------------------------------------------------------------
// Lệch đã biết (tiền sẵn, có lý do — không fail, nhưng in rõ mỗi lần chạy)
// ---------------------------------------------------------------------------

/** Export runtime có trong `.ts` nhưng cố tình vắng trong `.js` kề bên.
 * Đợt 52 I7: RỖNG — mục duy nhất trước đây (audio/FADE_CURVES, tiền sẵn
 * từ đợt 51 §4.5) đã được sửa: audio.js nay export FADE_CURVES, tầng A
 * khớp 22/22 cặp. Map giữ lại (rỗng) cho lệch mới trong tương lai. */
const KNOWN_EXPORT_GAPS = {};

/**
 * Lệch hành vi đã biết, theo probe id. `shape` mô tả đúng hình dạng lệch
 * đang quan sát; nếu probe cho kết quả khác hẳn (vd hai bên bằng nhau
 * hoặc lệch kiểu khác) thì FAIL để có người xem lại thay vì lặng im.
 *
 * Đợt 52 I7: RỖNG — mục duy nhất trước đây (easing-unknown, F1 §7.6, giữ
 * nguyên có chủ ý ở H5 §4) đã được thống nhất thật: cả 4 bản applyEasing /
 * applySpeedEasing (TS, JS viết tay, render CJS) đều ném
 * "easing không hỗ trợ: <easing>", các probe easing lạ nay so khớp strict
 * (không còn knownGap) kèm guard try/catch ở mọi caller preview (xem
 * LIMITS đợt 52 I7 §2). Map giữ lại (rỗng) cho lệch mới trong tương lai.
 */
const KNOWN_BEHAVIOR_GAPS = {
  // Đợt 87 O1 — maskGeometryAtTrack TS ↔ render CJS: bản TS (qua
  // maskGeometryAt) trả `keyframes: undefined` — key có mặt, giá trị
  // undefined (quy ước video-spec từ D4); bản render CJS `delete` key đó
  // (quy ước render từ D4, maskGeometryAt ở server/render/src/mask.js).
  // Hai bên cho cùng JSON và cùng mọi giá trị số — chỉ lệch tập key.
  // Hình dạng lệch CHỈ chấp nhận khi JSON giống hệt nhau và tập key chỉ
  // lệch đúng key "keyframes": số lệch dù 1 bit cũng FAIL để có người xem.
  "mask-keyframes-undefined-vs-absent": {
    reason:
      "TS đặt keyframes: undefined, render CJS delete key — JSON và số giống hệt, chỉ lệch key (quy ước D4 hai bên)",
    shape: (a, b) => {
      if (a.threw || b.threw) return false;
      if (JSON.stringify(a.value) !== JSON.stringify(b.value)) return false;
      const ka = Object.keys(a.value ?? {}).sort();
      const kb = Object.keys(b.value ?? {}).sort();
      const onlyKeyframes = (x, y) =>
        x.length === y.length + 1 && x.filter((k) => !y.includes(k)).join() === "keyframes";
      return onlyKeyframes(ka, kb) || onlyKeyframes(kb, ka);
    },
  },
};

// ---------------------------------------------------------------------------
// So sánh kết quả (NaN-aware, đệ quy)
// ---------------------------------------------------------------------------

function outcomesEqual(a, b) {
  if (a.threw !== b.threw) return false;
  if (a.threw) return a.message === b.message;
  return valuesEqual(a.value, b.value);
}

function valuesEqual(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));
  }
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((v, i) => valuesEqual(v, b[i]));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => valuesEqual(a[k], b[k]));
}

function runOutcome(fn, input) {
  try {
    return { threw: false, value: fn(...input) };
  } catch (e) {
    return { threw: true, message: e instanceof Error ? e.message : String(e) };
  }
}

function describeOutcome(o) {
  if (o.threw) return `ném "${o.message}"`;
  const v = o.value;
  if (typeof v === "number" && Number.isNaN(v)) return "NaN";
  return JSON.stringify(v);
}

// ---------------------------------------------------------------------------
// Tầng A — export-set parity
// ---------------------------------------------------------------------------

const EXPORT_RE = /export\s+(?:function|const|let|class|enum)\s+([A-Za-z_$][\w$]*)/g;

function exportNames(src) {
  const out = new Set();
  for (const m of src.matchAll(EXPORT_RE)) out.add(m[1]);
  return out;
}

let pass = 0;
let fail = 0;
let known = 0;
const failures = [];

function checkExportParity() {
  console.log(`== Tầng A: export-set parity (${srcDir}) ==`);
  const files = readdirSync(srcDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts")).sort();
  for (const f of files) {
    const base = f.slice(0, -3);
    const jsPath = join(srcDir, `${base}.js`);
    let jsSrc;
    try {
      jsSrc = readFileSync(jsPath, "utf8");
    } catch {
      console.log(`  - ${base}: không có .js kề bên (bỏ qua)`);
      continue;
    }
    const tsNames = exportNames(readFileSync(join(srcDir, f), "utf8"));
    const jsNames = exportNames(jsSrc);
    const missingInJs = [...tsNames].filter((n) => !jsNames.has(n));
    const extraInJs = [...jsNames].filter((n) => !tsNames.has(n));
    const gap = KNOWN_EXPORT_GAPS[base];
    const knownMissing = gap?.missingInJs ?? [];
    const unexplainedMissing = missingInJs.filter((n) => !knownMissing.includes(n));
    const unexplainedKnown = knownMissing.filter((n) => !missingInJs.includes(n));
    if (unexplainedKnown.length > 0) {
      fail++;
      failures.push(`${base}: KNOWN_EXPORT_GAPS ghi ${unexplainedKnown.join(", ")} nhưng .js nay đã có — xóa mục allowlist`);
      console.log(`  ✗ ${base}: allowlist lỗi thời (đã có: ${unexplainedKnown.join(", ")})`);
    }
    if (unexplainedMissing.length > 0 || extraInJs.length > 0) {
      fail++;
      failures.push(
        `${base}: thiếu trong .js: ${unexplainedMissing.join(", ") || "—"}; thừa trong .js: ${extraInJs.join(", ") || "—"}`,
      );
      console.log(
        `  ✗ ${base}: thiếu trong .js: ${unexplainedMissing.join(", ") || "—"}; thừa trong .js: ${extraInJs.join(", ") || "—"}`,
      );
      continue;
    }
    if (missingInJs.length > 0) {
      known++;
      console.log(`  ~ ${base}: KNOWN thiếu trong .js: ${missingInJs.join(", ")} (${gap.reason})`);
    } else {
      pass++;
      console.log(`  ✓ ${base}: export khớp (${tsNames.size})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Tầng B — differential probes
// ---------------------------------------------------------------------------

const KF_VALID = [
  { t: 0, v: 0, easing: "linear" },
  { t: 2, v: 10, easing: "linear" },
];
const SK_VALID = [
  { t: 0, v: 1, easing: "linear" },
  { t: 2, v: 3, easing: "linear" },
];
const SK_BEZIER = [
  { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
  { t: 2, v: 2, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
];
// Clip speed mẫu cho probe speed.ts: thỏa invariant duration = (out-in)/speed.
const SP_CLIP = { kind: "video", id: "c1", start: 10, in: 2, out: 6, duration: 2, speed: 2 };
const SP_CLIP_REV = { ...SP_CLIP, reverse: true };
const MK_LIST = [
  { id: "m1", time: 1, label: "A" },
  { id: "m2", time: 3, label: "B" },
];

// Đợt 53 J9 — fixture phức tạp cho các hàm thuần còn lại (adjustment,
// image, sticker, mask, motion, nested, migrations, tracking, index).
// Fixture là dữ liệu thật, đúng shape spec (lấy theo mẫu nested.test.ts /
// adjustment.test.ts / motion.test.ts trong cùng thư mục), không mock kết
// quả: checker chỉ so TS ↔ JS trên cùng input; giá trị kỳ vọng đọc từ
// output in ra (vd flattenNested in cả absoluteStart tuyệt đối).
const SPEC_META = { name: "spec", width: 1280, height: 720, fps: 30 };
const VIDEO_LEAF = (id, start, duration) => ({
  kind: "video",
  id,
  src: `${id}.mp4`,
  start,
  duration,
  in: 0,
  out: duration,
});
// SubSpec 6 s: v1 [0,4), v2 [4,6).
const SUB_SPEC = {
  version: "0.2.0",
  meta: SPEC_META,
  tracks: [{ id: "t1", kind: "video", clips: [VIDEO_LEAF("v1", 0, 4), VIDEO_LEAF("v2", 4, 2)] }],
};
// Nested 1 tầng: trim 0..6, speed 2 → duration 3, start 10.
const NEST = {
  kind: "nested",
  id: "n1",
  start: 10,
  duration: 3,
  speed: 2,
  trim: { in: 0, out: 6 },
  subSpec: SUB_SPEC,
};
// Nested 2 tầng: n2 [1,3) trong subSpec ngoài, chứa lá v3 [0,4).
const INNER_SUB = {
  version: "0.2.0",
  meta: SPEC_META,
  tracks: [{ id: "t1", kind: "video", clips: [VIDEO_LEAF("v3", 0, 4)] }],
};
const NEST2 = {
  kind: "nested",
  id: "n2",
  start: 1,
  duration: 2,
  speed: 2,
  trim: { in: 0, out: 4 },
  subSpec: INNER_SUB,
};
const SUB_SPEC_2LEVEL = {
  version: "0.2.0",
  meta: SPEC_META,
  tracks: [{ id: "t1", kind: "video", clips: [NEST2] }],
};
const TOP2 = {
  kind: "nested",
  id: "n1",
  start: 10,
  duration: 3,
  speed: 2,
  trim: { in: 0, out: 6 },
  subSpec: SUB_SPEC_2LEVEL,
};
const SPEC_020 = {
  version: "0.2.0",
  meta: SPEC_META,
  tracks: [{ id: "t1", kind: "video", clips: [VIDEO_LEAF("v1", 0, 4)] }],
};
const SPEC_010 = {
  version: "0.1.0",
  meta: SPEC_META,
  tracks: [{ id: "t1", kind: "video", clips: [VIDEO_LEAF("v1", 0, 4)] }],
};
const ADJ_LAYER = {
  id: "a1",
  start: 2,
  duration: 4,
  filters: [{ lut: "vcut-cinematic" }],
};
const ADJ_LAYER_SCOPED = {
  id: "a2",
  start: 3,
  duration: 2,
  filters: [{ color: { brightness: 10 } }],
  tracks: [1],
};
const ADJ_LAYER_1EFFECT = {
  id: "a3",
  start: 0,
  duration: 1,
  filters: [{ effects: [{ type: "blur", intensity: 0.7 }] }],
  tracks: [2],
};
const ADJ_LEGACY_BLUR = {
  kind: "adjustment",
  id: "l1",
  start: 1,
  duration: 2,
  filterType: "blur",
  intensity: 0.5,
};
const ADJ_LEGACY_LUT = {
  kind: "adjustment",
  id: "l2",
  start: 1,
  duration: 2,
  filter: { lut: "vcut-cinematic" },
};
const IMG_CLIP = { kind: "image", id: "i1", src: "a.png", start: 2, duration: 3 };
const IMG_MASK = { shape: "rect", x: 0.5, y: 0.5, w: 0.8, h: 0.8, feather: 0.1 };
const STK_CLIP = { kind: "sticker", id: "s1", src: "fluent-smile.png", start: 1, duration: 2 };
const MASK_KF = {
  shape: "rect",
  x: 0.5,
  y: 0.5,
  w: 1,
  h: 1,
  feather: 0,
  keyframes: [
    { t: 0, x: 0.2, y: 0.2, w: 0.4, h: 0.4 },
    { t: 2, x: 0.8, y: 0.8, w: 0.6, h: 0.6 },
  ],
};
const MASK_STATIC = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.8, h: 0.6, feather: 0.2 };
const TRACK_PTS = [
  { t: 0, x: 0.2, y: 0.3 },
  { t: 2, x: 0.6, y: 0.7 },
];
const TRACK_PTS_241 = Array.from({ length: 241 }, (_, i) => ({ t: i, x: 0.5, y: 0.5 }));

/**
 * PROBES: mỗi mục so một hàm giữa hai module.
 * - moduleA/moduleB: "ts:<file>" (import ESM, .ts qua strip-types),
 *   "js:<file>" (mirror .js kề bên), "render:<file>" (CJS require).
 * - fn: tên hàm. probes: [{ name, args, knownGap? }].
 * - value: tên hằng export — so giá trị trực tiếp (không gọi hàm).
 */
const PROBE_GROUPS = [
  {
    label: "keyframes: speedcurve.ts ↔ speedcurve.js",
    a: "ts:speedcurve.ts",
    b: "js:speedcurve.js",
    probes: [
      { fn: "normalizeSpeedKeyframes", name: "null → []", args: [[null]] },
      {
        fn: "normalizeSpeedKeyframes",
        name: "null + hợp lệ → chỉ hợp lệ, sort",
        args: [[null, { t: 2, v: 2, easing: "linear" }, { t: 0, v: 1, easing: "linear" }]],
      },
      { fn: "normalizeSpeedKeyframes", name: "non-array → []", args: [null] },
      { fn: "normalizeSpeedKeyframes", name: "trùng t → sau thắng", args: [[{ t: 0, v: 1, easing: "linear" }, { t: 0, v: 2, easing: "linear" }]] },
      { fn: "speedAt", name: "linear giữa đoạn = 2", args: [{ keyframes: SK_VALID }, 1] },
      { fn: "speedAt", name: "[null] → ném rỗng", args: [{ keyframes: [null] }, 1] },
      { fn: "integrateSpeed", name: "linear 0→2 = 4", args: [{ keyframes: SK_VALID }, 0, 2] },
      { fn: "integrateSpeed", name: "[null] → ném rỗng", args: [{ keyframes: [null] }, 0, 1] },
      { fn: "cubicBezierY", name: "bezier CSS ease @0.5", args: [0.25, 0.1, 0.25, 1, 0.5] },
      { fn: "applySpeedEasing", name: "bezier @0.5", args: ["bezier", 0.5, [0.25, 0.1, 0.25, 1]] },
      { fn: "applySpeedEasing", name: "bezier mặc định (không kèm mảng)", args: ["bezier", 0.5] },
      { fn: "applySpeedEasing", name: "easing lạ", args: ["bounce", 0.5] },
      { fn: "speedAt", name: "easing lạ → ném cả hai (thống nhất đợt 52 I7)", args: [{ keyframes: [{ t: 0, v: 1, easing: "bounce" }, { t: 2, v: 3, easing: "linear" }] }, 1] },
      {
        fn: "trimSpeedKeyframes",
        name: "[null] → dropped 1",
        args: [[null, { t: 0, v: 1, easing: "linear" }, { t: 2, v: 2, easing: "linear" }], 0, 2],
      },
      {
        fn: "sliceSpeedKeyframes",
        name: "slice linear [0.5, 1.5)",
        args: [[{ t: 0, v: 1, easing: "linear" }, { t: 2, v: 3, easing: "linear" }], 0.5, 1.5],
      },
      { fn: "speedAt", name: "bezier giữa đoạn", args: [{ keyframes: SK_BEZIER }, 1] },
      // Đợt 52 I7 — mở rộng: các hàm thuần còn lại của speedcurve.
      { fn: "sourcePosAt", name: "linear ∫0→2 = 4", args: [{ keyframes: SK_VALID }, 2] },
      { fn: "sourceConsumed", name: "linear duration 2 = 4", args: [{ keyframes: SK_VALID }, 2] },
      { fn: "averageSpeed", name: "linear duration 2 = 2", args: [{ keyframes: SK_VALID }, 2] },
      { fn: "planSpeedSegments", name: "linear duration 2 → 10 đoạn", args: [{ keyframes: SK_VALID }, 2] },
      { fn: "splitSpeedKeyframes", name: "split tại 1 / duration 2", args: [SK_VALID, 1, 2] },
      { fn: "visibleSpeedKeyframes", name: "cửa sổ [0.5, 1.5)", args: [SK_VALID, 0, 2, 0.5, 1.5] },
      { fn: "rampTrimLeftIn", name: "in=10, shift 1 → 11.5", args: [10, { keyframes: SK_VALID }, 1] },
      { fn: "rampTrimRightOut", name: "in=10, dur 2 → 14", args: [10, { keyframes: SK_VALID }, 2] },
      { fn: "outputDurationForSource", name: "nguồn 4 → out 2", args: [{ keyframes: SK_VALID }, 4] },
      { value: "SPEED_EASINGS", name: "hằng SPEED_EASINGS" },
      { value: "DEFAULT_SPEED_BEZIER", name: "hằng DEFAULT_SPEED_BEZIER" },
    ],
  },
  {
    label: "speedcurve: speedcurve.ts ↔ render speedramp.js",
    a: "ts:speedcurve.ts",
    b: "render:speedramp.js",
    probes: [
      { fn: "normalizeSpeedKeyframes", name: "null → []", args: [[null]] },
      {
        fn: "normalizeSpeedKeyframes",
        name: "null + hợp lệ → chỉ hợp lệ, sort",
        args: [[null, { t: 2, v: 2, easing: "linear" }, { t: 0, v: 1, easing: "linear" }]],
      },
      { fn: "normalizeSpeedKeyframes", name: "non-array → []", args: [null] },
      { fn: "speedAt", name: "linear giữa đoạn = 2", args: [{ keyframes: SK_VALID }, 1] },
      { fn: "speedAt", name: "[null] → ném rỗng", args: [{ keyframes: [null] }, 1] },
      { fn: "integrateSpeed", name: "linear 0→2 = 4", args: [{ keyframes: SK_VALID }, 0, 2] },
      { fn: "cubicBezierY", name: "bezier CSS ease @0.5", args: [0.25, 0.1, 0.25, 1, 0.5] },
      { fn: "applySpeedEasing", name: "bezier @0.5", args: ["bezier", 0.5, [0.25, 0.1, 0.25, 1]] },
      { fn: "applySpeedEasing", name: "bezier mặc định (không kèm mảng)", args: ["bezier", 0.5] },
      { fn: "applySpeedEasing", name: "easing lạ", args: ["bounce", 0.5] },
      { fn: "speedAt", name: "easing lạ → ném cả hai (thống nhất đợt 52 I7)", args: [{ keyframes: [{ t: 0, v: 1, easing: "bounce" }, { t: 2, v: 3, easing: "linear" }] }, 1] },
      { fn: "speedAt", name: "bezier giữa đoạn", args: [{ keyframes: SK_BEZIER }, 1] },
      // Đợt 52 I7 — mở rộng: render speedramp.js chỉ export 3 hàm này thêm.
      { fn: "sourcePosAt", name: "linear ∫0→2 = 4", args: [{ keyframes: SK_VALID }, 2] },
      { fn: "sourceConsumed", name: "linear duration 2 = 4", args: [{ keyframes: SK_VALID }, 2] },
      { fn: "planSpeedSegments", name: "linear duration 2 → 10 đoạn", args: [{ keyframes: SK_VALID }, 2] },
    ],
  },
  {
    label: "keyframes: keyframes.ts ↔ keyframes.js",
    a: "ts:keyframes.ts",
    b: "js:keyframes.js",
    probes: [
      { fn: "normalizeKeyframes", name: "null → []", args: [[null]] },
      {
        fn: "normalizeKeyframes",
        name: "null + hợp lệ → chỉ hợp lệ",
        args: [[null, { t: 2, v: 20, easing: "linear" }, { t: 0, v: 0, easing: "linear" }]],
      },
      { fn: "interpolateKeyframes", name: "linear giữa đoạn = 5", args: [KF_VALID, 1] },
      { fn: "interpolateKeyframes", name: "[null] → ném rỗng", args: [[null], 0] },
      { fn: "interpolateKeyframes", name: "easing lạ → ném cả hai (thống nhất đợt 52 I7)", args: [[{ t: 0, v: 0, easing: "bounce" }, { t: 2, v: 10, easing: "linear" }], 1] },
      { fn: "applyEasing", name: "ease-in @0.5 = 0.25", args: ["ease-in", 0.5] },
      { fn: "applyEasing", name: "easing lạ", args: ["bounce", 0.5] },
      // Đợt 52 I7 — mở rộng: validate + metadata thuần của keyframes.
      { fn: "validateAnimations", name: "hợp lệ → []", args: [{ x: { keyframes: KF_VALID } }, 4] },
      { fn: "validateAnimations", name: "easing lạ → 1 lỗi", args: [{ x: { keyframes: [{ t: 0, v: 0, easing: "bounce" }] } }, 4] },
      { fn: "validateAnimations", name: "mảng rỗng → 1 lỗi", args: [{ x: { keyframes: [] } }, 4] },
      { fn: "formatPropValue", name: "opacity 0.5 → 50%", args: ["opacity", 0.5] },
      { fn: "formatPropValue", name: "rotation 30 → 30°", args: ["rotation", 30] },
      { fn: "formatPropValue", name: "scale 1.5 → 1.5×", args: ["scale", 1.5] },
      { value: "EASINGS", name: "hằng EASINGS" },
      { value: "ANIMATABLE_PROPS", name: "hằng ANIMATABLE_PROPS" },
      { value: "MAX_KEYFRAMES_PER_PROP", name: "hằng MAX_KEYFRAMES_PER_PROP" },
      { value: "PROP_META", name: "hằng PROP_META" },
      { value: "EASING_LABEL", name: "hằng EASING_LABEL" },
    ],
  },
  {
    label: "keyframes: keyframes.ts ↔ render keyframes.js",
    a: "ts:keyframes.ts",
    b: "render:keyframes.js",
    probes: [
      { fn: "normalizeKeyframes", name: "null → []", args: [[null]] },
      {
        fn: "normalizeKeyframes",
        name: "null + hợp lệ → chỉ hợp lệ",
        args: [[null, { t: 2, v: 20, easing: "linear" }, { t: 0, v: 0, easing: "linear" }]],
      },
      { fn: "interpolateKeyframes", name: "linear giữa đoạn = 5", args: [KF_VALID, 1] },
      { fn: "interpolateKeyframes", name: "[null] → ném rỗng", args: [[null], 0] },
      { fn: "interpolateKeyframes", name: "easing lạ → ném cả hai (thống nhất đợt 52 I7)", args: [[{ t: 0, v: 0, easing: "bounce" }, { t: 2, v: 10, easing: "linear" }], 1] },
      { fn: "applyEasing", name: "ease-in @0.5 = 0.25", args: ["ease-in", 0.5] },
      { fn: "applyEasing", name: "easing lạ", args: ["bounce", 0.5] },
      // Đợt 52 I7 — mở rộng: validateAnimations cũng có ở render.
      { fn: "validateAnimations", name: "hợp lệ → []", args: [{ x: { keyframes: KF_VALID } }, 4] },
      { fn: "validateAnimations", name: "easing lạ → 1 lỗi", args: [{ x: { keyframes: [{ t: 0, v: 0, easing: "bounce" }] } }, 4] },
      { fn: "validateAnimations", name: "mảng rỗng → 1 lỗi", args: [{ x: { keyframes: [] } }, 4] },
    ],
  },
  {
    label: "speed: speed.ts ↔ speed.js",
    a: "ts:speed.ts",
    b: "js:speed.js",
    probes: [
      { fn: "clampSpeed", name: "NaN → 1", args: [Number.NaN] },
      { fn: "clampSpeed", name: "10 → 4", args: [10] },
      { fn: "clampSpeed", name: "0.1 → 0.25", args: [0.1] },
      { fn: "atempoFactors", name: "4 → [2,2]", args: [4] },
      { fn: "atempoFactors", name: "1 → []", args: [1] },
      { fn: "atempoFactors", name: "0.25 → [0.5,0.5]", args: [0.25] },
      { fn: "clipSpeed", name: "vắng speed → 1", args: [{ kind: "video" }] },
      // Đợt 52 I7 — mở rộng: time mapping + trim/split thuần của speed.ts.
      { fn: "clipReversed", name: "reverse=true", args: [SP_CLIP_REV] },
      { fn: "effectiveDuration", name: "(6-2)/2 = 2", args: [SP_CLIP] },
      { fn: "isDurationConsistent", name: "clip mẫu khớp", args: [SP_CLIP] },
      { fn: "durationForSpeed", name: "speed 4 → dur 1", args: [SP_CLIP, 4] },
      { fn: "outForDuration", name: "dur 1 → out 4", args: [SP_CLIP, 1] },
      { fn: "sourceDurationOf", name: "6-2 = 4", args: [SP_CLIP] },
      { fn: "timelineDurationOf", name: "= effectiveDuration = 2", args: [SP_CLIP] },
      { fn: "sourceTimeAt", name: "xuôi t=11 → 4", args: [SP_CLIP, 11] },
      { fn: "sourceTimeAt", name: "ngược t=10.5 → 5", args: [SP_CLIP_REV, 10.5] },
      { fn: "splitSourceAt", name: "cắt t=11 → {2,4,4,6}", args: [SP_CLIP, 11] },
      { fn: "inForTrimLeft", name: "newStart 11 → in 4", args: [SP_CLIP, 11] },
      { fn: "outForTrimRight", name: "newEnd 11 → out 4", args: [SP_CLIP, 11] },
      { fn: "trimLeftTo", name: "newStart 11 → {11,1,4,6}", args: [SP_CLIP, 11] },
      { fn: "trimRightTo", name: "dur 1 → {1,2,4}", args: [SP_CLIP, 1] },
      { fn: "maxTrimLeft", name: "in/speed = 1", args: [SP_CLIP] },
      { fn: "maxTrimRightDuration", name: "không trần → Infinity", args: [SP_CLIP] },
      { fn: "validateSpeedFields", name: "clip mẫu hợp lệ → []", args: [SP_CLIP] },
      { fn: "validateSpeedFields", name: "speed 9 → 2 lỗi (range + duration)", args: [{ ...SP_CLIP, speed: 9 }] },
      { fn: "isSpeedable", name: "video → true", args: [{ kind: "video" }] },
      { fn: "isSpeedable", name: "text → false", args: [{ kind: "text" }] },
      { value: "SPEED_MIN", name: "hằng SPEED_MIN" },
      { value: "SPEED_MAX", name: "hằng SPEED_MAX" },
      { value: "DEFAULT_SPEED", name: "hằng DEFAULT_SPEED" },
      { value: "SPEED_PRESETS", name: "hằng SPEED_PRESETS" },
    ],
  },
  {
    // Đợt 52 I7 — nhóm mới: audio.ts ↔ audio.js (kèm FADE_CURVES vừa bổ sung).
    label: "audio: audio.ts ↔ audio.js",
    a: "ts:audio.ts",
    b: "js:audio.js",
    probes: [
      { value: "FADE_CURVES", name: "hằng FADE_CURVES (đợt 52 I7 bổ sung vào .js)" },
      { value: "SOURCE_AUDIO_MODES", name: "hằng SOURCE_AUDIO_MODES" },
      { value: "DEFAULT_SOURCE_AUDIO_MODE", name: "hằng DEFAULT_SOURCE_AUDIO_MODE" },
      { value: "DEFAULT_DUCKING_SETTINGS", name: "hằng DEFAULT_DUCKING_SETTINGS" },
      { fn: "isSourceAudioMode", name: "\"mute\" → true", args: ["mute"] },
      { fn: "isSourceAudioMode", name: "\"loud\" → false", args: ["loud"] },
      { fn: "validateSourceAudioMode", name: "\"mute\" → []", args: ["mute"] },
      { fn: "validateSourceAudioMode", name: "\"loud\" → 1 lỗi", args: ["loud"] },
      { fn: "hasAudioEffects", name: "bass 3 → true", args: [{ bass: 3 }] },
      { fn: "hasAudioEffects", name: "rỗng → false", args: [{}] },
      { fn: "hasAudioEffects", name: "undefined → false", args: [undefined] },
      { fn: "validateAudioEffects", name: "bass 99 → 1 lỗi", args: [{ bass: 99 }] },
      { fn: "validateAudioEffects", name: "bass 3 + compressor → []", args: [{ bass: 3, compressor: { ratio: 4 } }] },
      { fn: "isDuckingEnabled", name: "enabled=true → true", args: [{ enabled: true }] },
      { fn: "isDuckingEnabled", name: "rỗng → false", args: [{}] },
      { fn: "validateDuckingSettings", name: "enabled=true thiếu track → 1 lỗi", args: [{ enabled: true }] },
      { fn: "validateDuckingSettings", name: "enabled=true + track → []", args: [{ enabled: true, voiceTrackId: "a1" }] },
    ],
  },
  {
    // Đợt 52 I7 — nhóm mới: timebase.ts ↔ timebase.js (số học thuần).
    label: "timebase: timebase.ts ↔ timebase.js",
    a: "ts:timebase.ts",
    b: "js:timebase.js",
    probes: [
      { value: "DEFAULT_FPS", name: "hằng DEFAULT_FPS" },
      { value: "TIMEBASE_EPS", name: "hằng TIMEBASE_EPS" },
      { fn: "normalizeFps", name: "undefined → 30", args: [undefined] },
      { fn: "normalizeFps", name: "0 → 30", args: [0] },
      { fn: "normalizeFps", name: "25 → 25", args: [25] },
      { fn: "frameDuration", name: "30fps → 1/30", args: [30] },
      { fn: "toFrames", name: "1s @30 → 30", args: [1, 30] },
      { fn: "toSeconds", name: "45f @30 → 1.5", args: [45, 30] },
      { fn: "snapToFrame", name: "0.0333 @30 → 1/30", args: [0.0333, 30] },
      { fn: "snapToFrameFloor", name: "0.05 @30 → 1/30", args: [0.05, 30] },
      { fn: "snapToFrameCeil", name: "0.05 @30 → 2/30", args: [0.05, 30] },
      { fn: "isFrameAligned", name: "1/30 @30 → true", args: [1 / 30, 30] },
      { fn: "isFrameAligned", name: "0.05 @30 → false", args: [0.05, 30] },
      { fn: "formatTimecode", name: "61s @30 → 00:01:01:00", args: [61, 30] },
      { fn: "formatTimecode", name: "1.5s @30 → 00:00:01:15", args: [1.5, 30] },
    ],
  },
  {
    // Đợt 52 I7 — nhóm mới: các validator thuần có fixture nhỏ (mỗi cặp
    // TS↔JS một vài probe). Các module khác xem LIMITS đợt 52 I7 §4.
    label: "validators: chroma/color/effects/transitions/textfx/markers (TS ↔ JS)",
    a: "ts:chroma.ts",
    b: "js:chroma.js",
    probes: [
      { fn: "isChromaKey", name: "#00FF00 → true", args: [{ color: "#00FF00" }] },
      { fn: "isChromaKey", name: "red → false", args: [{ color: "red" }] },
      { fn: "validateChromaKey", name: "hợp lệ → []", args: [{ color: "#00FF00" }] },
      { fn: "validateChromaKey", name: "màu sai → 1 lỗi", args: [{ color: "red" }] },
      { fn: "normalizeChromaKey", name: "điền mặc định", args: [{ color: "#00FF00" }] },
      { fn: "chromaColorToFFmpeg", name: "#00ff00 → 0x00FF00", args: ["#00ff00"] },
      { fn: "chromaColorToFFmpeg", name: "red → ném", args: ["red"] },
    ],
  },
  {
    label: "validators: color.ts ↔ color.js",
    a: "ts:color.ts",
    b: "js:color.js",
    probes: [
      { fn: "isColorNoop", name: "rỗng → true", args: [{}] },
      { fn: "isColorNoop", name: "brightness 10 → false", args: [{ brightness: 10 }] },
      { fn: "isColorNoop", name: "undefined → true", args: [undefined] },
      { fn: "validateColorAdjust", name: "brightness 200 → 1 lỗi", args: [{ brightness: 200 }] },
      { fn: "validateColorAdjust", name: "brightness 10 → []", args: [{ brightness: 10 }] },
      { fn: "buildColorAdjustFilter", name: "rỗng → \"\"", args: [{}] },
      { fn: "buildColorAdjustFilter", name: "brightness 50 → eq", args: [{ brightness: 50 }] },
      { fn: "buildColorAdjustFilter", name: "temperature 50 → colorbalance", args: [{ temperature: 50 }] },
    ],
  },
  {
    label: "validators: effects/transitions/textfx/markers (TS ↔ JS)",
    a: "ts:effects.ts",
    b: "js:effects.js",
    probes: [
      { fn: "isVideoEffectType", name: "\"blur\" → true", args: ["blur"] },
      { fn: "isVideoEffectType", name: "\"flare\" → false", args: ["flare"] },
      { fn: "validateVideoEffect", name: "blur 0.5 → []", args: [{ type: "blur", intensity: 0.5 }] },
      { fn: "validateVideoEffect", name: "type lạ → 1 lỗi", args: [{ type: "flare" }] },
      { fn: "validateVideoEffects", name: "2 effect → []", args: [[{ type: "blur" }, { type: "sepia" }]] },
      { fn: "validateVideoEffects", name: "trùng type → 1 lỗi", args: [[{ type: "blur" }, { type: "blur" }]] },
    ],
  },
  {
    label: "validators: transitions.ts ↔ transitions.js",
    a: "ts:transitions.ts",
    b: "js:transitions.js",
    probes: [
      { fn: "isTransitionType", name: "\"dissolve\" → true", args: ["dissolve"] },
      { fn: "isTransitionType", name: "\"zoom\" → false", args: ["zoom"] },
      { value: "TRANSITION_TYPES", name: "hằng TRANSITION_TYPES" },
    ],
  },
  {
    label: "validators: textfx.ts ↔ textfx.js",
    a: "ts:textfx.ts",
    b: "js:textfx.js",
    probes: [
      { fn: "isTextAnimation", name: "\"bounce\" → true", args: ["bounce"] },
      { fn: "isTextAnimation", name: "\"spin\" → false", args: ["spin"] },
      { fn: "isDrawtextAnimation", name: "\"bounce\" → true", args: ["bounce"] },
      { fn: "isDrawtextAnimation", name: "\"tiltIn\" → false (chỉ ASS)", args: ["tiltIn"] },
      { value: "TEXT_ANIMATIONS", name: "hằng TEXT_ANIMATIONS" },
      { value: "DRAWTEXT_ANIMATIONS", name: "hằng DRAWTEXT_ANIMATIONS" },
    ],
  },
  {
    // Đợt 52 I7 — nhóm mới: lut.ts ↔ lut.js. H5 ghi "lut.js ngắn hơn lut.ts"
    // (tập con cố tình) nhưng export-set đã khớp 7/7 nên các hàm thuần
    // vẫn probe được; LUT_META so deep (bảng lớn — lệch 1 mục cũng bắt).
    label: "lut: lut.ts ↔ lut.js",
    a: "ts:lut.ts",
    b: "js:lut.js",
    probes: [
      { value: "LUT_IDS", name: "hằng LUT_IDS" },
      { value: "LUT_META", name: "hằng LUT_META (bảng lớn)" },
      { fn: "isLutId", name: "\"vcut-cinematic\" → true", args: ["vcut-cinematic"] },
      { fn: "isLutId", name: "\"nope\" → false", args: ["nope"] },
      { fn: "lutFileName", name: "vcut-cinematic → .cube", args: ["vcut-cinematic"] },
      { fn: "isUserLutId", name: "\"user-foo\" → true", args: ["user-foo"] },
      { fn: "isUserLutId", name: "\"vcut-cinematic\" → false", args: ["vcut-cinematic"] },
      { fn: "userLutFileName", name: "user-foo → user-foo.cube", args: ["user-foo"] },
      { fn: "validateVideoFilter", name: "lut hợp lệ → []", args: [{ lut: "vcut-cinematic" }] },
      { fn: "validateVideoFilter", name: "lut lạ → 1 lỗi", args: [{ lut: "nope" }] },
      { fn: "validateVideoFilter", name: "user lut → []", args: [{ lut: "user-foo" }] },
      { fn: "validateVideoFilter", name: "undefined → []", args: [undefined] },
    ],
  },
  {
    // Đợt 52 I7 — value probe cho các hằng còn lại: rẻ, không cần fixture,
    // khóa nốt Tier B const parity cho mọi module (hàm thuần cần fixture
    // phức tạp hơn thì xem LIMITS đợt 52 I7 §4).
    label: "consts: enhance.ts ↔ enhance.js",
    a: "ts:enhance.ts",
    b: "js:enhance.js",
    probes: [
      { value: "ENHANCE_META", name: "hằng ENHANCE_META" },
      { value: "STABILIZE_DEFAULTS", name: "hằng STABILIZE_DEFAULTS" },
      { value: "DENOISE_DEFAULT_STRENGTH", name: "hằng DENOISE_DEFAULT_STRENGTH" },
    ],
  },
  {
    label: "consts: image.ts ↔ image.js",
    a: "ts:image.ts",
    b: "js:image.js",
    probes: [{ value: "IMAGE_DEFAULTS", name: "hằng IMAGE_DEFAULTS" }],
  },
  {
    label: "consts: sticker.ts ↔ sticker.js",
    a: "ts:sticker.ts",
    b: "js:sticker.js",
    probes: [
      { value: "STICKER_DEFAULTS", name: "hằng STICKER_DEFAULTS" },
      { value: "STICKER_CATEGORIES", name: "hằng STICKER_CATEGORIES" },
      { value: "STICKER_LIBRARY", name: "hằng STICKER_LIBRARY" },
    ],
  },
  {
    label: "consts: mask.ts ↔ mask.js",
    a: "ts:mask.ts",
    b: "js:mask.js",
    probes: [
      { value: "MASK_SHAPES", name: "hằng MASK_SHAPES" },
      { value: "MASK_DEFAULTS", name: "hằng MASK_DEFAULTS" },
    ],
  },
  {
    label: "consts: motion.ts ↔ motion.js",
    a: "ts:motion.ts",
    b: "js:motion.js",
    probes: [
      { value: "MOTION_INTERPOLATIONS", name: "hằng MOTION_INTERPOLATIONS" },
      { value: "MOTION_MI_MODES", name: "hằng MOTION_MI_MODES" },
      { value: "MOTION_TARGET_FPS_MIN", name: "hằng MOTION_TARGET_FPS_MIN" },
      { value: "MOTION_TARGET_FPS_MAX", name: "hằng MOTION_TARGET_FPS_MAX" },
      { value: "MOTION_BLUR_FRAMES_MIN", name: "hằng MOTION_BLUR_FRAMES_MIN" },
      { value: "MOTION_BLUR_FRAMES_MAX", name: "hằng MOTION_BLUR_FRAMES_MAX" },
      { value: "MOTION_DEFAULT_MI_MODE", name: "hằng MOTION_DEFAULT_MI_MODE" },
      { value: "MOTION_BLUR_DEFAULT_FRAMES", name: "hằng MOTION_BLUR_DEFAULT_FRAMES" },
      { value: "MOTION_META", name: "hằng MOTION_META" },
    ],
  },
  {
    label: "consts: tracking.ts ↔ tracking.js",
    a: "ts:tracking.ts",
    b: "js:tracking.js",
    probes: [
      { value: "TRACK_MAX_POINTS", name: "hằng TRACK_MAX_POINTS" },
      { value: "TRACK_LOST_SCORE", name: "hằng TRACK_LOST_SCORE" },
    ],
  },
  {
    label: "consts: migrations.ts ↔ migrations.js",
    a: "ts:migrations.ts",
    b: "js:migrations.js",
    probes: [
      { value: "SUPPORTED_VERSIONS", name: "hằng SUPPORTED_VERSIONS" },
      { value: "CURRENT_SCHEMA_VERSION", name: "hằng CURRENT_SCHEMA_VERSION" },
    ],
  },
  {
    label: "consts: nested.ts ↔ nested.js",
    a: "ts:nested.ts",
    b: "js:nested.js",
    probes: [
      { value: "MAX_NESTED_DEPTH", name: "hằng MAX_NESTED_DEPTH" },
      { value: "NESTED_MIN_SPEED", name: "hằng NESTED_MIN_SPEED" },
      { value: "NESTED_MAX_SPEED", name: "hằng NESTED_MAX_SPEED" },
      { value: "NESTED_DURATION_EPSILON", name: "hằng NESTED_DURATION_EPSILON" },
    ],
  },
  {
    label: "consts: index.ts ↔ index.js",
    a: "ts:index.ts",
    b: "js:index.js",
    probes: [{ value: "SPEC_VERSION", name: "hằng SPEC_VERSION" }],
  },
  {
    label: "consts: chroma/color/effects/transitions/textfx (bổ sung)",
    a: "ts:chroma.ts",
    b: "js:chroma.js",
    probes: [
      { value: "CHROMA_DEFAULTS", name: "hằng CHROMA_DEFAULTS" },
      { value: "CHROMA_PRESETS", name: "hằng CHROMA_PRESETS" },
    ],
  },
  {
    label: "consts: color.ts ↔ color.js",
    a: "ts:color.ts",
    b: "js:color.js",
    probes: [{ value: "COLOR_PARAMS", name: "hằng COLOR_PARAMS" }],
  },
  {
    label: "consts: effects.ts ↔ effects.js",
    a: "ts:effects.ts",
    b: "js:effects.js",
    probes: [
      { value: "EFFECT_TYPES", name: "hằng EFFECT_TYPES" },
      { value: "EFFECT_META", name: "hằng EFFECT_META" },
      { value: "EFFECT_DEFAULT_INTENSITY", name: "hằng EFFECT_DEFAULT_INTENSITY" },
    ],
  },
  {
    label: "consts: transitions.ts ↔ transitions.js",
    a: "ts:transitions.ts",
    b: "js:transitions.js",
    probes: [{ value: "TRANSITION_META", name: "hằng TRANSITION_META" }],
  },
  {
    label: "consts: textfx.ts ↔ textfx.js",
    a: "ts:textfx.ts",
    b: "js:textfx.js",
    probes: [{ value: "TEXT_ANIMATION_META", name: "hằng TEXT_ANIMATION_META" }],
  },
  {
    label: "consts: speed.ts ↔ speed.js (bổ sung)",
    a: "ts:speed.ts",
    b: "js:speed.js",
    probes: [{ value: "SPEED_EPS", name: "hằng SPEED_EPS" }],
  },
  {
    label: "validators: markers.ts ↔ markers.js",
    a: "ts:markers.ts",
    b: "js:markers.js",
    probes: [
      { fn: "validateMarkers", name: "1 marker hợp lệ → []", args: [[{ id: "m1", time: 1 }]] },
      { fn: "validateMarkers", name: "id rỗng + time âm → 2 lỗi", args: [[{ id: "", time: -1 }]] },
      { fn: "addMarkerToList", name: "thêm m3 vào [m1,m2]", args: [MK_LIST, { id: "m3", time: 2 }] },
      { fn: "addMarkerToList", name: "trùng id → error", args: [MK_LIST, { id: "m1", time: 5 }] },
      { fn: "removeMarkerFromList", name: "xóa m1", args: [MK_LIST, "m1"] },
      { fn: "updateMarkerInList", name: "đổi label m1", args: [MK_LIST, "m1", { label: "C" }] },
      { fn: "nearestMarkerBefore", name: "t=2 → m1", args: [MK_LIST, 2] },
      { fn: "nearestMarkerBefore", name: "rỗng → null", args: [[], 1] },
      { value: "MARKER_COLORS", name: "hằng MARKER_COLORS" },
      { value: "DEFAULT_MARKER_COLOR", name: "hằng DEFAULT_MARKER_COLOR" },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: adjustment.ts ↔ adjustment.js (layer + converter
    // legacy 2 chiều; fixture layer thật, clip legacy thật).
    label: "adjustment: adjustment.ts ↔ adjustment.js",
    a: "ts:adjustment.ts",
    b: "js:adjustment.js",
    probes: [
      { fn: "adjustmentEnd", name: "layer 2+4 → 6", args: [ADJ_LAYER] },
      { fn: "adjustmentAppliesTo", name: "t=2 (đầu bao) → true", args: [ADJ_LAYER, 2] },
      { fn: "adjustmentAppliesTo", name: "t=6 (cuối không bao) → false", args: [ADJ_LAYER, 6] },
      { fn: "adjustmentAppliesTo", name: "t=5.9 → true", args: [ADJ_LAYER, 5.9] },
      { fn: "adjustmentOverlapsClip", name: "clip [5,7) giao [2,6) → true", args: [ADJ_LAYER, 5, 2] },
      { fn: "adjustmentOverlapsClip", name: "clip [6,8) chạm biên → false", args: [ADJ_LAYER, 6, 2] },
      { fn: "adjustmentOverlapsClip", name: "clip [0,2) chạm biên → false", args: [ADJ_LAYER, 0, 2] },
      { fn: "adjustmentLayerAppliesToTrack", name: "không scope → mọi track", args: [ADJ_LAYER, 0] },
      { fn: "adjustmentLayerAppliesToTrack", name: "scope [1], track 0 → false", args: [ADJ_LAYER_SCOPED, 0] },
      { fn: "adjustmentLayerAppliesToTrack", name: "scope [1], track 1 → true", args: [ADJ_LAYER_SCOPED, 1] },
      { fn: "adjustmentLayersForClip", name: "clip [3,5) không track → cả 2 layer", args: [[ADJ_LAYER, ADJ_LAYER_SCOPED], 3, 2] },
      { fn: "adjustmentLayersForClip", name: "clip [3,5) track 0 → chỉ layer không scope", args: [[ADJ_LAYER, ADJ_LAYER_SCOPED], 3, 2, 0] },
      { fn: "adjustmentLayersForClip", name: "clip [3,5) track 1 → cả 2 layer", args: [[ADJ_LAYER, ADJ_LAYER_SCOPED], 3, 2, 1] },
      { fn: "validateAdjustmentFilter", name: "lut hợp lệ → []", args: [{ lut: "vcut-cinematic" }] },
      { fn: "validateAdjustmentFilter", name: "lut lạ → 1 lỗi", args: [{ lut: "nope" }] },
      { fn: "validateAdjustmentFilter", name: "filter rỗng → 1 lỗi", args: [{}] },
      { fn: "validateAdjustmentFilter", name: "không phải object → 1 lỗi", args: ["x"] },
      { fn: "validateAdjustmentFilter", name: "color + effects hợp lệ → []", args: [{ color: { brightness: 10 }, effects: [{ type: "blur", intensity: 0.5 }] }] },
      { fn: "isLegacyAdjustmentTrackClip", name: "kind adjustment + id → true", args: [ADJ_LEGACY_BLUR] },
      { fn: "isLegacyAdjustmentTrackClip", name: "kind video → false", args: [{ kind: "video" }] },
      { fn: "legacyTrackClipToLayer", name: "filterType blur 0.5, track 0 → ok", args: [ADJ_LEGACY_BLUR, 0] },
      { fn: "legacyTrackClipToLayer", name: "filter lut, track 1 → ok", args: [ADJ_LEGACY_LUT, 1] },
      { fn: "legacyTrackClipToLayer", name: "không mang filter → ok:false", args: [{ kind: "adjustment", id: "l9", start: 1, duration: 2 }, 0] },
      { fn: "legacyTrackClipToLayer", name: "filterType lạ → ok:false", args: [{ kind: "adjustment", id: "l9", start: 1, duration: 2, filterType: "flare" }, 0] },
      { fn: "legacyTrackClipToLayer", name: "shape adjustment nestedPreview → ok", args: [{ kind: "adjustment", id: "l3", start: 0, duration: 2, adjustment: { lut: "vcut-cinematic", color: { brightness: 5 } } }, 2] },
      { fn: "legacyTrackClipToLayer", name: "trùng effect giữa filterType và effects → ok:false", args: [{ kind: "adjustment", id: "l9", start: 1, duration: 2, filterType: "blur", effects: [{ type: "blur" }] }, 0] },
      { fn: "legacyTrackClipToLayer", name: "trackIndex âm → ok:false", args: [ADJ_LEGACY_BLUR, -1] },
      { fn: "specLayerToLegacyTrackClip", name: "layer 1 track + lut → ok, trackIndex 0", args: [{ ...ADJ_LAYER, tracks: [0] }] },
      { fn: "specLayerToLegacyTrackClip", name: "layer 1 effect → filterType shortcut, trackIndex 2", args: [ADJ_LAYER_1EFFECT] },
      { fn: "specLayerToLegacyTrackClip", name: "layer không scope → ok:false", args: [ADJ_LAYER] },
      { fn: "specLayerToLegacyTrackClip", name: "layer 2 track → ok:false", args: [{ ...ADJ_LAYER, tracks: [0, 1] }] },
      { fn: "specLayerToLegacyTrackClip", name: "layer 2 LUT khác nhau → ok:false", args: [{ id: "a9", start: 0, duration: 1, filters: [{ lut: "vcut-cinematic" }, { lut: "vcut-noir-contrast" }], tracks: [0] }] },
      { fn: "specLayerToLegacyTrackClip", name: "layer trùng effect giữa 2 entry → ok:false", args: [{ id: "a9", start: 0, duration: 1, filters: [{ effects: [{ type: "blur" }] }, { effects: [{ type: "blur" }] }], tracks: [0] }] },
      { fn: "validateAdjustmentLayer", name: "layer mẫu → []", args: [ADJ_LAYER] },
      { fn: "validateAdjustmentLayer", name: "duration 0 → lỗi", args: [{ ...ADJ_LAYER, duration: 0 }] },
      { fn: "validateAdjustmentLayer", name: "tracks trùng → lỗi", args: [{ ...ADJ_LAYER, tracks: [0, 0] }] },
      { fn: "validateAdjustmentLayer", name: "tracks [5] vượt trackCount 2 → lỗi", args: [{ ...ADJ_LAYER, tracks: [5] }, 2] },
      { fn: "validateAdjustmentLayer", name: "source lạ → lỗi", args: [{ ...ADJ_LAYER, source: "panel-x" }] },
      { fn: "validateAdjustmentLayers", name: "undefined (project cũ) → []", args: [undefined] },
      { fn: "validateAdjustmentLayers", name: "1 layer → []", args: [[ADJ_LAYER]] },
      { fn: "validateAdjustmentLayers", name: "trùng id → lỗi", args: [[ADJ_LAYER, ADJ_LAYER]] },
      { fn: "validateAdjustmentLayers", name: "không phải mảng → lỗi", args: ["x"] },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: image.ts ↔ image.js.
    label: "image: image.ts ↔ image.js",
    a: "ts:image.ts",
    b: "js:image.js",
    probes: [
      { fn: "isImageFit", name: "\"cover\" → true", args: ["cover"] },
      { fn: "isImageFit", name: "\"fill\" → false", args: ["fill"] },
      { fn: "isImageClip", name: "clip mẫu → true", args: [IMG_CLIP] },
      { fn: "isImageClip", name: "kind video → false", args: [{ kind: "video" }] },
      { fn: "normalizeImageClip", name: "điền fit mặc định contain", args: [IMG_CLIP] },
      { fn: "normalizeImageClip", name: "giữ mask qua chuẩn hoá", args: [{ ...IMG_CLIP, mask: IMG_MASK }] },
      { fn: "validateImageClip", name: "clip mẫu → []", args: [IMG_CLIP] },
      { fn: "validateImageClip", name: "fit lạ → 1 lỗi", args: [{ ...IMG_CLIP, fit: "fill" }] },
      { fn: "validateImageClip", name: "duration 0 → 1 lỗi", args: [{ ...IMG_CLIP, duration: 0 }] },
      { fn: "validateImageClip", name: "thiếu src → 1 lỗi", args: [{ ...IMG_CLIP, src: "" }] },
      { fn: "validateImageClip", name: "mask shape lạ → 1 lỗi", args: [{ ...IMG_CLIP, mask: { shape: "circle", x: 0.5, y: 0.5, w: 1, h: 1, feather: 0 } }] },
      { fn: "validateImageClip", name: "null → 1 lỗi", args: [null] },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: sticker.ts ↔ sticker.js.
    label: "sticker: sticker.ts ↔ sticker.js",
    a: "ts:sticker.ts",
    b: "js:sticker.js",
    probes: [
      { fn: "stickerUrl", name: "a.png → /stickers/a.png", args: ["a.png"] },
      { fn: "isStickerClip", name: "clip mẫu → true", args: [STK_CLIP] },
      { fn: "isStickerClip", name: "kind text → false", args: [{ kind: "text" }] },
      { fn: "normalizeStickerClip", name: "điền mặc định x/y/scale/opacity/rotation", args: [STK_CLIP] },
      { fn: "normalizeStickerClip", name: "giữ track khi có", args: [{ ...STK_CLIP, track: { points: TRACK_PTS } }] },
      { fn: "validateStickerClip", name: "clip mẫu → []", args: [STK_CLIP] },
      { fn: "validateStickerClip", name: "opacity 2 → 1 lỗi", args: [{ ...STK_CLIP, opacity: 2 }] },
      { fn: "validateStickerClip", name: "x 1.5 → 1 lỗi", args: [{ ...STK_CLIP, x: 1.5 }] },
      { fn: "validateStickerClip", name: "scale 0 → 1 lỗi", args: [{ ...STK_CLIP, scale: 0 }] },
      { fn: "validateStickerClip", name: "rotation chuỗi → 1 lỗi", args: [{ ...STK_CLIP, rotation: "90" }] },
      { fn: "validateStickerClip", name: "kèm track points → [] (track không validate ở đây)", args: [{ ...STK_CLIP, track: { points: TRACK_PTS } }] },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: mask.ts ↔ mask.js (keyframe hình học D4).
    label: "mask: mask.ts ↔ mask.js",
    a: "ts:mask.ts",
    b: "js:mask.js",
    probes: [
      { fn: "sortMaskKeyframes", name: "chưa sort + trùng t (sau thắng)", args: [[{ t: 2, x: 0.8, y: 0.8, w: 0.6, h: 0.6 }, { t: 0, x: 0.1, y: 0.1, w: 0.4, h: 0.4 }, { t: 0, x: 0.2, y: 0.2, w: 0.4, h: 0.4 }]] },
      { fn: "hasMaskKeyframes", name: "có keyframes → true", args: [MASK_KF] },
      { fn: "hasMaskKeyframes", name: "không keyframes → false", args: [MASK_STATIC] },
      { fn: "normalizeMask", name: "điền invert=false", args: [MASK_STATIC] },
      { fn: "normalizeMask", name: "sort keyframes chưa sort", args: [{ ...MASK_KF, keyframes: [MASK_KF.keyframes[1], MASK_KF.keyframes[0]] }] },
      { fn: "interpolateMaskAt", name: "giữa đoạn t=1 → x/y/w/h = 0.5", args: [MASK_KF, 1] },
      { fn: "interpolateMaskAt", name: "trước kf đầu → hold kf đầu", args: [MASK_KF, -1] },
      { fn: "interpolateMaskAt", name: "sau kf cuối → hold kf cuối", args: [MASK_KF, 5] },
      { fn: "interpolateMaskAt", name: "không keyframes → giá trị tĩnh", args: [MASK_STATIC, 1] },
      { fn: "maskGeometryAt", name: "t=1 → nội suy + keyframes undefined", args: [MASK_KF, 1] },
      // Đợt 87 O1 — mask bám motion track (maskGeometryAtTrack).
      { fn: "maskGeometryAtTrack", name: "track 2 điểm, t=1 → tâm (0.4,0.5), w/h keyframe 0.5", args: [MASK_KF, { points: TRACK_PTS }, 1] },
      { fn: "maskGeometryAtTrack", name: "không track → giống maskGeometryAt", args: [MASK_KF, undefined, 1] },
      { fn: "maskGeometryAtTrack", name: "track rỗng → fallback maskGeometryAt", args: [MASK_KF, { points: [] }, 1] },
      { fn: "maskGeometryAtTrack", name: "t sau điểm cuối → kẹp điểm cuối (0.6,0.7)", args: [MASK_KF, { points: TRACK_PTS }, 5] },
      { fn: "maskGeometryAtTrack", name: "mask tĩnh + track → tâm track, w/h tĩnh", args: [MASK_STATIC, { points: TRACK_PTS }, 1] },
      { fn: "validateMask", name: "mask tĩnh hợp lệ → []", args: [MASK_STATIC] },
      { fn: "validateMask", name: "mask có keyframes → []", args: [MASK_KF] },
      { fn: "validateMask", name: "shape lạ → 1 lỗi", args: [{ ...MASK_STATIC, shape: "circle" }] },
      { fn: "validateMask", name: "feather 1.5 → 1 lỗi", args: [{ ...MASK_STATIC, feather: 1.5 }] },
      { fn: "validateMask", name: "w = 0 → 1 lỗi", args: [{ ...MASK_STATIC, w: 0 }] },
      { fn: "validateMask", name: "keyframe t âm → 1 lỗi", args: [{ ...MASK_STATIC, keyframes: [{ t: -1, x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] }] },
      { fn: "validateMask", name: "chuỗi → 1 lỗi", args: ["x"] },
    ],
  },
  {
    // Đợt 87 O1 — mask bám track: TS canonical ↔ render worker CJS
    // (server/render/src/mask.js). Cùng fixture với nhóm mask trên để 3
    // implementation (TS, JS mirror, CJS render) cho cùng kết quả số.
    label: "mask-track: mask.ts ↔ render mask.js",
    a: "ts:mask.ts",
    b: "render:mask.js",
    probes: [
      { fn: "maskGeometryAtTrack", name: "track 2 điểm, t=1 → tâm (0.4,0.5), w/h keyframe 0.5", args: [MASK_KF, { points: TRACK_PTS }, 1], knownGap: "mask-keyframes-undefined-vs-absent" },
      { fn: "maskGeometryAtTrack", name: "không track → giống maskGeometryAt", args: [MASK_KF, undefined, 1], knownGap: "mask-keyframes-undefined-vs-absent" },
      { fn: "maskGeometryAtTrack", name: "track rỗng → fallback maskGeometryAt", args: [MASK_KF, { points: [] }, 1], knownGap: "mask-keyframes-undefined-vs-absent" },
      { fn: "maskGeometryAtTrack", name: "t sau điểm cuối → kẹp điểm cuối (0.6,0.7)", args: [MASK_KF, { points: TRACK_PTS }, 5], knownGap: "mask-keyframes-undefined-vs-absent" },
      { fn: "maskGeometryAtTrack", name: "mask tĩnh + track → tâm track, w/h tĩnh", args: [MASK_STATIC, { points: TRACK_PTS }, 1], knownGap: "mask-keyframes-undefined-vs-absent" },
      { fn: "maskGeometryAtTrack", name: "track 1 điểm → tâm hằng (0.25,0.75)", args: [MASK_KF, { points: [{ t: 0, x: 0.25, y: 0.75 }] }, 1], knownGap: "mask-keyframes-undefined-vs-absent" },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: motion.ts ↔ motion.js (validate fail-fast,
    // resolve blur, migrate project cũ).
    label: "motion: motion.ts ↔ motion.js",
    a: "ts:motion.ts",
    b: "js:motion.js",
    probes: [
      { fn: "validateMotion", name: "undefined → không throw", args: [undefined] },
      { fn: "validateMotion", name: "minterpolate 60fps → không throw", args: [{ interpolation: "minterpolate", targetFps: 60 }] },
      { fn: "validateMotion", name: "none + targetFps → throw", args: [{ interpolation: "none", targetFps: 60 }] },
      { fn: "validateMotion", name: "minterpolate thiếu targetFps → throw", args: [{ interpolation: "minterpolate" }] },
      { fn: "validateMotion", name: "targetFps 200 → throw", args: [{ interpolation: "minterpolate", targetFps: 200 }] },
      { fn: "validateMotion", name: "miMode dup → throw", args: [{ interpolation: "minterpolate", targetFps: 60, miMode: "dup" }] },
      { fn: "validateMotion", name: "blur hợp lệ → không throw", args: [{ interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 3, weights: [1, 1, 1] } }] },
      { fn: "validateMotion", name: "weights toàn 0 → throw (tổng 0)", args: [{ interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 3, weights: [0, 0, 0] } }] },
      { fn: "validateMotion", name: "kind text → throw", args: [{ interpolation: "minterpolate", targetFps: 60 }, "text"] },
      { fn: "validateMotion", name: "key lạ → throw", args: [{ interpolation: "minterpolate", targetFps: 60, foo: 1 }] },
      { fn: "validateMotion", name: "weights dài lệch frames → throw", args: [{ interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 2, weights: [1, 1, 1] } }] },
      { fn: "validateMotion", name: "frames 9 → throw", args: [{ interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 9 } }] },
      { fn: "resolveMotionBlur", name: "undefined → undefined", args: [undefined] },
      { fn: "resolveMotionBlur", name: "không blur → undefined", args: [{ interpolation: "minterpolate", targetFps: 60 }] },
      { fn: "resolveMotionBlur", name: "frames 4 → weights đều 0.25", args: [{ motionBlur: { frames: 4 } }] },
      { fn: "resolveMotionBlur", name: "weights [1,3] → [0.25,0.75]", args: [{ motionBlur: { weights: [1, 3] } }] },
      { fn: "migrateMotion", name: "undefined → không migrate", args: [undefined] },
      { fn: "migrateMotion", name: "chuỗi → không migrate", args: ["x"] },
      { fn: "migrateMotion", name: "weights toàn 0 → weights đều + frames 3", args: [{ motionBlur: { weights: [0, 0, 0] } }] },
      { fn: "migrateMotion", name: "blur rỗng {} → frames 3", args: [{ motionBlur: {} }] },
      { fn: "migrateMotion", name: "weights [1,2] thiếu frames → frames 2", args: [{ motionBlur: { weights: [1, 2] } }] },
      { fn: "migrateMotion", name: "frames 2 lệch weights dài 3 → frames 3", args: [{ interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 2, weights: [1, 1, 1] } }] },
      { fn: "migrateMotion", name: "hợp lệ sẵn → không migrate", args: [{ interpolation: "minterpolate", targetFps: 60, motionBlur: { frames: 3, weights: [1, 1, 1] } }] },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: nested.ts ↔ nested.js (fixture subSpec thật,
    // 1 tầng + 2 tầng; flatten/compose/normalize).
    label: "nested: nested.ts ↔ nested.js",
    a: "ts:nested.ts",
    b: "js:nested.js",
    probes: [
      { fn: "isNestedClip", name: "clip nested → true", args: [NEST] },
      { fn: "isNestedClip", name: "lá video → false", args: [VIDEO_LEAF("v1", 0, 4)] },
      { fn: "nestedSourceDuration", name: "subSpec 6 s", args: [SUB_SPEC] },
      { fn: "nestedEffectiveSpeed", name: "speed 2", args: [NEST] },
      { fn: "nestedEffectiveSpeed", name: "vắng speed → 1", args: [{ ...NEST, speed: undefined }] },
      { fn: "nestedEffectiveTrim", name: "trim 0..6", args: [NEST] },
      { fn: "nestedEffectiveTrim", name: "vắng trim → toàn bộ subSpec", args: [{ ...NEST, trim: undefined }] },
      { fn: "nestedDuration", name: "(6-0)/2 = 3", args: [NEST] },
      { fn: "validateNestedClip", name: "clip mẫu → []", args: [NEST] },
      { fn: "validateNestedClip", name: "duration sai 2 → lỗi", args: [{ ...NEST, duration: 2 }] },
      { fn: "validateNestedClip", name: "speed 9 → lỗi", args: [{ ...NEST, speed: 9 }] },
      { fn: "validateNestedClip", name: "chuỗi → lỗi (không throw)", args: ["x"] },
      { fn: "flattenNested", name: "1 tầng → 2 lá (v1 @10 dur 2, v2 @12 dur 1)", args: [NEST] },
      { fn: "flattenNested", name: "2 tầng → 1 lá v3 @10.5 dur 1, depth 2", args: [TOP2] },
      { fn: "flattenNested", name: "speedKeyframes hằng 2 → như speed hằng", args: [{ ...NEST, speedKeyframes: { keyframes: [{ t: 0, v: 2, easing: "linear" }, { t: 3, v: 2, easing: "linear" }] } }] },
      { fn: "flattenNested", name: "speedKeyframes ramp 1→3 (đường τ) → 2 lá", args: [{ ...NEST, speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 3, v: 3, easing: "linear" }] } }] },
      { fn: "flattenNested", name: "speedKeyframes easing lạ → throw", args: [{ ...NEST, speedKeyframes: { keyframes: [{ t: 0, v: 2, easing: "bounce" }, { t: 3, v: 2, easing: "linear" }] } }] },
      { fn: "flattenNested", name: "speed 0 → throw", args: [{ ...NEST, speed: 0 }] },
      { fn: "flattenNested", name: "kind video → throw", args: [{ kind: "video" }] },
      { fn: "composeNestedLeafWindow", name: "1 tầng lá v1 → visible [0,4) @10 dur 2", args: [NEST, [], VIDEO_LEAF("v1", 0, 4)] },
      { fn: "composeNestedLeafWindow", name: "2 tầng lá v3 → @10.5 dur 1, speed tích lũy 4", args: [TOP2, [NEST2], VIDEO_LEAF("v3", 0, 4)] },
      { fn: "composeNestedLeafWindow", name: "top ramp 1→3, lá v1 → đường τ", args: [{ ...NEST, speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 3, v: 3, easing: "linear" }] } }, [], VIDEO_LEAF("v1", 0, 4)] },
      { fn: "validateNestedClip", name: "nested ramp 1→3 hợp lệ → []", args: [{ ...NEST, speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 3, v: 3, easing: "linear" }] } }] },
      { fn: "validateNestedClip", name: "nested ramp trim.out sai → lỗi", args: [{ ...NEST, trim: { in: 0, out: 5 }, speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 3, v: 3, easing: "linear" }] } }] },
      { fn: "composeNestedLeafWindow", name: "lá không có trong subSpec → throw", args: [NEST, [], VIDEO_LEAF("v9", 0, 4)] },
      { fn: "normalizeNestedClip", name: "shape chuẩn → ok", args: [NEST] },
      { fn: "normalizeNestedClip", name: "shape tracks cũ + opts.meta → ok", args: [{ kind: "nested", id: "n9", start: 0, duration: 4, tracks: [{ id: "t1", kind: "video", clips: [VIDEO_LEAF("v1", 0, 4)] }] }, { meta: SPEC_META }] },
      { fn: "normalizeNestedClip", name: "shape tracks cũ thiếu meta → ok:false", args: [{ kind: "nested", id: "n9", start: 0, duration: 4, tracks: [{ id: "t1", kind: "video", clips: [VIDEO_LEAF("v1", 0, 4)] }] }, {}] },
      { fn: "normalizeNestedClip", name: "field in legacy → trim, ok", args: [{ kind: "nested", id: "n9", start: 0, duration: 4, in: 1, tracks: [{ id: "t1", kind: "video", clips: [VIDEO_LEAF("v1", 0, 4)] }] }, { meta: SPEC_META }] },
      { fn: "normalizeNestedClip", name: "kind video → ok:false", args: [{ kind: "video" }] },
      { fn: "normalizeNestedClip", name: "subSpec + tracks khác nhau → ok:false", args: [{ kind: "nested", id: "n9", start: 0, duration: 4, subSpec: SUB_SPEC, tracks: [{ id: "tX", kind: "video", clips: [] }] }] },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: migrations.ts ↔ migrations.js.
    label: "migrations: migrations.ts ↔ migrations.js",
    a: "ts:migrations.ts",
    b: "js:migrations.js",
    probes: [
      { fn: "readSchemaVersion", name: "0.1.0 → \"0.1.0\"", args: [{ version: "0.1.0" }] },
      { fn: "readSchemaVersion", name: "không version → null", args: [{}] },
      { fn: "readSchemaVersion", name: "null → null", args: [null] },
      { fn: "readSchemaVersion", name: "version số → null", args: [{ version: 3 }] },
      { fn: "isSupportedVersion", name: "0.1.0 → true", args: ["0.1.0"] },
      { fn: "isSupportedVersion", name: "0.2.0 → true", args: ["0.2.0"] },
      { fn: "isSupportedVersion", name: "0.3.0 → false", args: ["0.3.0"] },
      { fn: "compareVersions", name: "0.1.0 < 0.2.0 → -1", args: ["0.1.0", "0.2.0"] },
      { fn: "compareVersions", name: "0.2.0 = 0.2.0 → 0", args: ["0.2.0", "0.2.0"] },
      { fn: "compareVersions", name: "1.0 > 0.2.0 → 1", args: ["1.0", "0.2.0"] },
      { fn: "getVersionInfo", name: "current 0.2.0 + supported [0.1.0, 0.2.0]", args: [] },
      { fn: "migrate010To020", name: "bump version 0.1.0 → 0.2.0, giữ tracks", args: [SPEC_010] },
      { fn: "migrate", name: "spec 0.2.0 hợp lệ → trả nguyên", args: [SPEC_020] },
      { fn: "migrate", name: "spec 0.1.0 → migrate lên 0.2.0", args: [SPEC_010] },
      { fn: "migrate", name: "không version → throw MigrationError", args: [{}] },
      { fn: "migrate", name: "null → throw MigrationError", args: [null] },
      { fn: "migrate", name: "version 9.9.9 (mới hơn app) → throw", args: [{ version: "9.9.9", meta: SPEC_META, tracks: [] }] },
      { fn: "migrate", name: "version 0.0.1 (quá cũ) → throw", args: [{ version: "0.0.1", meta: SPEC_META, tracks: [] }] },
      { fn: "migrate", name: "0.2.0 nhưng thiếu tracks → throw", args: [{ version: "0.2.0", meta: SPEC_META }] },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: tracking.ts ↔ tracking.js.
    label: "tracking: tracking.ts ↔ tracking.js",
    a: "ts:tracking.ts",
    b: "js:tracking.js",
    probes: [
      { fn: "validateTrackPoint", name: "điểm hợp lệ → []", args: [{ t: 0, x: 0.5, y: 0.5 }, "p"] },
      { fn: "validateTrackPoint", name: "t âm → 1 lỗi", args: [{ t: -1, x: 0.5, y: 0.5 }, "p"] },
      { fn: "validateTrackPoint", name: "x 1.5 → 1 lỗi", args: [{ t: 0, x: 1.5, y: 0.5 }, "p"] },
      { fn: "validateTrackPoint", name: "score 2 → 1 lỗi", args: [{ t: 0, x: 0.5, y: 0.5, score: 2 }, "p"] },
      { fn: "validateTrackPoint", name: "null → 1 lỗi", args: [null, "p"] },
      { fn: "validateTrackAttachment", name: "2 điểm → []", args: [{ points: TRACK_PTS }] },
      { fn: "validateTrackAttachment", name: "undefined → [] (vắng track)", args: [undefined] },
      { fn: "validateTrackAttachment", name: "points rỗng → 1 lỗi", args: [{ points: [] }] },
      { fn: "validateTrackAttachment", name: "241 điểm → 1 lỗi quá dài", args: [{ points: TRACK_PTS_241 }] },
      { fn: "validateTrackAttachment", name: "t không tăng dần → 1 lỗi", args: [{ points: [TRACK_PTS[1], TRACK_PTS[0]] }] },
      { fn: "validateTrackAttachment", name: "không phải object → 1 lỗi", args: ["x"] },
      { fn: "interpolateTrack", name: "giữa đoạn t=1 → (0.4, 0.5)", args: [TRACK_PTS, 1] },
      { fn: "interpolateTrack", name: "trước điểm đầu → kẹp điểm đầu", args: [TRACK_PTS, -1] },
      { fn: "interpolateTrack", name: "sau điểm cuối → kẹp điểm cuối", args: [TRACK_PTS, 5] },
      { fn: "interpolateTrack", name: "điểm chưa sort → vẫn nội suy đúng", args: [[TRACK_PTS[1], TRACK_PTS[0]], 1] },
      { fn: "interpolateTrack", name: "rỗng → (0.5, 0.5)", args: [[], 1] },
    ],
  },
  {
    // Đợt 53 J9 — nhóm mới: index.ts ↔ index.js (isVideoSpec/projectDuration).
    label: "index: index.ts ↔ index.js",
    a: "ts:index.ts",
    b: "js:index.js",
    probes: [
      { fn: "isVideoSpec", name: "spec mẫu → true", args: [SPEC_020] },
      { fn: "isVideoSpec", name: "version 0.1.0 → false", args: [{ ...SPEC_020, version: "0.1.0" }] },
      { fn: "isVideoSpec", name: "thiếu tracks → false", args: [{ version: "0.2.0", meta: SPEC_META }] },
      { fn: "isVideoSpec", name: "null → false", args: [null] },
      { fn: "projectDuration", name: "1 clip 4 s → 4", args: [SPEC_020] },
      { fn: "projectDuration", name: "subSpec 2 clip → 6", args: [SUB_SPEC] },
      { fn: "projectDuration", name: "tracks rỗng → 0", args: [{ version: "0.2.0", meta: SPEC_META, tracks: [] }] },
      { fn: "projectDuration", name: "nested clip tính bằng duration của nó → 13", args: [{ version: "0.2.0", meta: SPEC_META, tracks: [{ id: "t1", kind: "video", clips: [NEST] }] }] },
    ],
  },
];

async function loadModule(spec) {
  const [kind, file] = spec.split(":");
  if (kind === "render") {
    const req = createRequire(join(renderDir, "noop.cjs"));
    return req(join(renderDir, file));
  }
  const base = kind === "ts" ? join(srcDir, file) : join(srcDir, file);
  return import(pathToFileURL(base).href);
}

async function checkProbes() {
  console.log("== Tầng B: differential probes ==");
  const cache = new Map();
  const get = async (spec) => {
    if (!cache.has(spec)) cache.set(spec, await loadModule(spec));
    return cache.get(spec);
  };
  for (const group of PROBE_GROUPS) {
    console.log(`-- ${group.label}`);
    let modA;
    let modB;
    try {
      modA = await get(group.a);
      modB = await get(group.b);
    } catch (e) {
      fail++;
      failures.push(`${group.label}: không nạp được module (${e.message})`);
      console.log(`  ✗ không nạp được module: ${e.message}`);
      continue;
    }
    for (const probe of group.probes) {
      // Probe hằng (value:): so giá trị export trực tiếp, không gọi hàm.
      if (probe.value !== undefined) {
        const vA = modA[probe.value];
        const vB = modB[probe.value];
        if (vA === undefined || vB === undefined) {
          fail++;
          failures.push(`${group.label} / ${probe.value}: thiếu hằng ở một bên`);
          console.log(`  ✗ ${probe.value} (${probe.name}): thiếu hằng ở một bên`);
        } else if (valuesEqual(vA, vB)) {
          pass++;
          console.log(`  ✓ ${probe.value} (${probe.name}): khớp (${JSON.stringify(vA)})`);
        } else {
          fail++;
          failures.push(`${group.label} / ${probe.value} (${probe.name}): A ${JSON.stringify(vA)} vs B ${JSON.stringify(vB)}`);
          console.log(`  ✗ ${probe.value} (${probe.name}): A ${JSON.stringify(vA)} vs B ${JSON.stringify(vB)}`);
        }
        continue;
      }
      const fnA = modA[probe.fn];
      const fnB = modB[probe.fn];
      if (typeof fnA !== "function" || typeof fnB !== "function") {
        fail++;
        failures.push(`${group.label} / ${probe.fn}: thiếu hàm ở một bên`);
        console.log(`  ✗ ${probe.fn} (${probe.name}): thiếu hàm ở một bên`);
        continue;
      }
      const outA = runOutcome(fnA, probe.args);
      const outB = runOutcome(fnB, probe.args);
      if (outcomesEqual(outA, outB)) {
        pass++;
        console.log(`  ✓ ${probe.fn} (${probe.name}): khớp (${describeOutcome(outA)})`);
      } else if (probe.knownGap) {
        const gap = KNOWN_BEHAVIOR_GAPS[probe.knownGap];
        if (gap && gap.shape(outA, outB)) {
          known++;
          console.log(
            `  ~ ${probe.fn} (${probe.name}): KNOWN lệch (${probe.knownGap}): A ${describeOutcome(outA)} vs B ${describeOutcome(outB)} — ${gap.reason}`,
          );
        } else {
          fail++;
          failures.push(`${group.label} / ${probe.fn} (${probe.name}): lệch khác hình dạng đã biết (${probe.knownGap}): A ${describeOutcome(outA)} vs B ${describeOutcome(outB)}`);
          console.log(`  ✗ ${probe.fn} (${probe.name}): lệch khác hình dạng đã biết: A ${describeOutcome(outA)} vs B ${describeOutcome(outB)}`);
        }
      } else {
        fail++;
        failures.push(`${group.label} / ${probe.fn} (${probe.name}): A ${describeOutcome(outA)} vs B ${describeOutcome(outB)}`);
        console.log(`  ✗ ${probe.fn} (${probe.name}): A ${describeOutcome(outA)} vs B ${describeOutcome(outB)}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------

async function main() {
  if (process.features.typescript !== "strip") {
    console.error(
      "check-video-spec-mirror cần Node có type stripping (Node >= 22.6, chạy với --experimental-strip-types trên Node cũ).",
    );
    process.exit(2);
  }
  checkExportParity();
  await checkProbes();
  console.log(`\nTổng: ${pass} pass, ${known} known, ${fail} fail.`);
  if (fail > 0) {
    console.log("FAIL:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("OK: mirror khớp hoàn toàn (0 lệch đã biết, 0 fail).");
}

await main();
