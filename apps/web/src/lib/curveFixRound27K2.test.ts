/**
 * curveFixRound27K2.test.ts — Test sanitize curve + thông báo lỗi export
 * (Phase 9 đợt 27, luồng K2; nợ #2 của đợt 26).
 *
 * Nợ #2: đợt 26 J5 chỉ cảnh báo lúc load, J1 chỉ cứu preview — project
 * vi phạm vẫn không export được, và bridge cắt chi tiết stderr nên user
 * chỉ thấy "Render worker thoát với mã 1." (đã kiểm chứng thật bằng
 * render.js + mô phỏng jobQueue._onError, xem LIMITS §1). Luồng này:
 * (a) chặn export sớm ở web với thông báo nêu rõ clip/curve vi phạm
 * (exportCurveBlockers), (b) nút "Sửa curve vi phạm" do user bấm:
 * sanitize qua warnings J5, xác nhận trước, undo 1 bước qua store
 * (phần store/ExportPanel không test được bằng Node nên test ở đây là
 * các hàm thuần mà chúng dùng: sanitize + format + blockers).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, mẫu projectRepo.test.ts):
 *   node apps/web/src/lib/curveFixRound27K2.test.ts
 */
import {
  collectSpeedCurveWarnings,
} from "./projectRepo.ts";
import {
  exportCurveBlockers,
  formatExportCurveError,
  formatSanitizeSummary,
  sanitizeSpecSpeedCurves,
  sanitizeSpeedKeyframes,
} from "./curveFix.ts";

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

function eq(a: unknown, b: unknown, msg: string): void {
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg} — nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

function kf(t: number, v: number, easing = "linear", extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { t, v, easing, ...extra };
}

function curve(kfs: Record<string, unknown>[]): Record<string, unknown> {
  return { keyframes: kfs };
}

function videoClip(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "video", id, src: "a.mp4", start: 0, duration: 2, in: 0, out: 2, ...extra };
}

function specWith(clips: unknown[], trackExtra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 640, height: 360, fps: 30 },
    tracks: [{ id: "v", kind: "video", clips, ...trackExtra }],
  };
}

function nestedClip(id: string, sub: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "nested", id, start: 0, duration: 2, trim: { in: 0, out: 2 }, subSpec: sub, ...extra };
}

// ---- sanitize: v ----

test("v=5 clamp về 4, v=0.1 clamp về 0.25, ghi rõ thay đổi", () => {
  const r1 = sanitizeSpeedKeyframes(curve([kf(0, 5)]), 2);
  assert(r1.changed === true, "v=5 phải changed");
  eq((r1.curve as Record<string, unknown>)["keyframes"], [{ t: 0, v: 4, easing: "linear" }], "v=5 clamp sai");
  assert(r1.changes.some((c) => c.includes("5") && c.includes("4")), `thiếu mô tả clamp: ${JSON.stringify(r1.changes)}`);
  const r2 = sanitizeSpeedKeyframes(curve([kf(0, 0.1)]), 2);
  eq((r2.curve as Record<string, unknown>)["keyframes"], [{ t: 0, v: 0.25, easing: "linear" }], "v=0.1 clamp sai");
});

test("v biên 0.25/4 và curve hợp lệ không đổi (trả đúng tham chiếu cũ)", () => {
  const c = curve([kf(0, 0.25), kf(2, 4)]);
  const r = sanitizeSpeedKeyframes(c, 2);
  assert(r.changed === false, "curve hợp lệ bị đổi oan");
  assert(r.curve === c, "curve hợp lệ phải giữ tham chiếu cũ");
  assert(r.changes.length === 0, "curve hợp lệ sinh changes giả");
});

// ---- sanitize: t ----

test("t không đơn điệu: giữ thứ tự viết, loại keyframe sau (giảm và trùng đều loại)", () => {
  const r1 = sanitizeSpeedKeyframes(curve([kf(0, 1), kf(2, 2), kf(1, 1.5)]), 4);
  eq((r1.curve as Record<string, unknown>)["keyframes"], [kf(0, 1), kf(2, 2)], "t giảm: phải giữ [0,2], loại t=1 sau");
  const r2 = sanitizeSpeedKeyframes(curve([kf(0, 1), kf(1, 2), kf(1, 1.5)]), 4);
  eq((r2.curve as Record<string, unknown>)["keyframes"], [kf(0, 1), kf(1, 2)], "t trùng: phải giữ cái trước, loại cái sau");
});

test("t vượt duration clamp về duration; t âm / không hữu hạn thì loại keyframe", () => {
  const r1 = sanitizeSpeedKeyframes(curve([kf(0, 1), kf(5, 1)]), 2);
  eq((r1.curve as Record<string, unknown>)["keyframes"], [kf(0, 1), kf(2, 1)], "t=5 phải clamp về 2");
  const r2 = sanitizeSpeedKeyframes(curve([kf(-1, 1), kf(0, 1), kf(1, 1)]), 2);
  eq((r2.curve as Record<string, unknown>)["keyframes"], [kf(0, 1), kf(1, 1)], "t=-1 phải bị loại");
  const r3 = sanitizeSpeedKeyframes(curve([{ t: NaN, v: 1, easing: "linear" }, kf(0, 1)]), 2);
  eq((r3.curve as Record<string, unknown>)["keyframes"], [kf(0, 1)], "t=NaN phải bị loại");
});

test("v không hữu hạn thì loại keyframe (không bịa số thay thế)", () => {
  const r = sanitizeSpeedKeyframes(curve([{ t: 0, v: NaN, easing: "linear" }, kf(1, 1)]), 2);
  eq((r.curve as Record<string, unknown>)["keyframes"], [kf(1, 1)], "v=NaN phải bị loại");
});

// ---- sanitize: easing / bezier ----

test("easing lạ về linear; bezier malformed về linear + bỏ field bezier; bezier hợp lệ giữ nguyên", () => {
  const r1 = sanitizeSpeedKeyframes(curve([kf(0, 1, "ease-in-out")]), 2);
  eq((r1.curve as Record<string, unknown>)["keyframes"], [kf(0, 1, "linear")], "easing lạ phải về linear");
  const r2 = sanitizeSpeedKeyframes(curve([kf(0, 1, "bezier", { bezier: [1.5, 0, 0.25, 1] })]), 2);
  eq((r2.curve as Record<string, unknown>)["keyframes"], [kf(0, 1, "linear")], "bezier x1=1.5 phải về linear, bỏ bezier");
  const good = curve([kf(0, 1, "bezier", { bezier: [0.25, 0.1, 0.25, 1] })]);
  const r3 = sanitizeSpeedKeyframes(good, 2);
  assert(r3.changed === false && r3.curve === good, "bezier hợp lệ bị đổi oan");
});

// ---- sanitize: không cứu được / số lượng ----

test("curve không phải object, keyframes rỗng, mọi keyframe bị loại → null, không tự bỏ curve", () => {
  const r1 = sanitizeSpeedKeyframes("nope", 2);
  assert(r1.curve === null && r1.unsalvageableReason !== undefined, "curve sai dạng phải null + có lý do");
  const r2 = sanitizeSpeedKeyframes(curve([]), 2);
  assert(r2.curve === null, "keyframes rỗng phải null");
  const r3 = sanitizeSpeedKeyframes(curve([{ t: -1, v: 1, easing: "linear" }]), 2);
  assert(r3.curve === null, "mọi keyframe bị loại phải null");
});

test("quá 128 keyframe → giữ 128 đầu, có ghi chú", () => {
  const kfs: Record<string, unknown>[] = [];
  for (let i = 0; i < 130; i++) kfs.push(kf(i * 0.01, 1));
  const r = sanitizeSpeedKeyframes(curve(kfs), 2);
  assert(((r.curve as Record<string, unknown>)["keyframes"] as unknown[]).length === 128, "phải cắt về 128");
  assert(r.changes.some((c) => c.includes("128")), "thiếu ghi chú cắt 128");
});

// ---- sanitize cả spec ----

test("sanitize spec: nested sâu được sửa, curve hợp lệ của clip anh em giữ nguyên tham chiếu", () => {
  const goodCurve = curve([kf(0, 1), kf(2, 2)]);
  const leaf = specWith([
    videoClip("leaf-bad", { speedKeyframes: curve([kf(0, 5)]) }),
    videoClip("leaf-good", { speedKeyframes: goodCurve }),
  ]);
  const outer = specWith([nestedClip("n1", leaf)]);
  const res = sanitizeSpecSpeedCurves(outer as never);
  assert(res.changed === true, "spec vi phạm phải changed");
  assert(res.fixed.length === 1 && res.fixed[0].clipId === "leaf-bad", `fixed sai: ${JSON.stringify(res.fixed)}`);
  assert(res.fixed[0].path === "tracks[0].clips[0].subSpec.tracks[0].clips[0]", `path fixed sai: ${res.fixed[0].path}`);
  assert(res.unsalvageable.length === 0 && res.skippedLocked.length === 0, "không được có unsalvageable/skipped giả");
  // Curve hợp lệ giữ nguyên tham chiếu qua cây mới.
  const newLeaf = (res.spec.tracks[0].clips[0] as unknown as Record<string, unknown>)["subSpec"] as Record<string, unknown>;
  const newClips = (newLeaf["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[];
  assert(newClips[1]["speedKeyframes"] === goodCurve, "curve hợp lệ của clip anh em bị copy/đổi oan");
  // Sau sanitize, J5 quét lại phải sạch.
  assert(collectSpeedCurveWarnings(res.spec).length === 0, `sau sanitize vẫn còn warning J5: ${JSON.stringify(collectSpeedCurveWarnings(res.spec))}`);
});

test("sanitize spec không mutate input; spec lành trả đúng tham chiếu cũ", () => {
  const good = specWith([videoClip("a", { speedKeyframes: curve([kf(0, 1)]) })]);
  const before = JSON.stringify(good);
  const res = sanitizeSpecSpeedCurves(good as never);
  assert(res.changed === false && res.spec === (good as never), "spec lành phải giữ tham chiếu");
  assert(JSON.stringify(good) === before, "sanitize mutate input");
  const bad = specWith([videoClip("b", { speedKeyframes: curve([kf(0, 9)]) })]);
  const badBefore = JSON.stringify(bad);
  sanitizeSpecSpeedCurves(bad as never);
  assert(JSON.stringify(bad) === badBefore, "sanitize spec vi phạm mutate input");
});

test("track khóa thì bỏ qua (không đổi), curve không cứu được thì để nguyên + báo lý do", () => {
  const spec = specWith(
    [
      videoClip("locked-bad", { speedKeyframes: curve([kf(0, 5)]) }),
      videoClip("empty-bad", { speedKeyframes: curve([]) }),
    ],
    { locked: true },
  );
  const res = sanitizeSpecSpeedCurves(spec as never);
  assert(res.changed === false, "track khóa + unsalvageable không được đổi spec");
  // Lưu ý: clip empty-bad nằm trên cùng track khóa nên cũng vào skippedLocked,
  // không vào unsalvageable — khóa được tôn trọng trước khi xét cứu được hay không.
  assert(res.skippedLocked.length === 2, `cả 2 clip trên track khóa đều phải skipped, nhận ${JSON.stringify(res.skippedLocked)}`);
  const spec2 = specWith([videoClip("empty-bad", { speedKeyframes: curve([]) })]);
  const res2 = sanitizeSpecSpeedCurves(spec2 as never);
  assert(res2.unsalvageable.length === 1 && res2.unsalvageable[0].reason.length > 0, "curve rỗng ngoài track khóa phải unsalvageable + có lý do");
  assert(res2.changed === false, "unsalvageable không được đổi spec");
});

// ---- thông báo lỗi export ----

test("thông báo lỗi export: v=5 nêu rõ đường dẫn clip + keyframe + giá trị + nút sửa", () => {
  const spec = specWith([videoClip("bad-clip", { speedKeyframes: curve([kf(0, 5)]) })]);
  const msg = exportCurveBlockers(spec);
  assert(msg !== null, "v=5 phải chặn export");
  assert(msg.includes("tracks[0].clips[0]"), `thiếu đường dẫn clip: ${msg}`);
  assert(msg.includes("bad-clip"), `thiếu clipId: ${msg}`);
  assert(msg.includes("5"), `thiếu giá trị vi phạm: ${msg}`);
  assert(msg.includes("Sửa curve vi phạm"), `thiếu hướng sửa: ${msg}`);
});

test("thông báo lỗi export: curve chỉ lệch đơn điệu thì KHÔNG chặn (render sort + dedupe, vẫn export được)", () => {
  const spec = specWith([videoClip("mono", { speedKeyframes: curve([kf(0, 1), kf(2, 2), kf(1, 1.5)]) })]);
  assert(exportCurveBlockers(spec) === null, "chỉ lệch đơn điệu mà chặn export là chặn oan project render chấp nhận");
});

test("thông báo lỗi export: project lành → null; nested v=5 → đường dẫn qua subSpec", () => {
  const good = specWith([videoClip("a", { speedKeyframes: curve([kf(0, 1), kf(2, 2)]) })]);
  assert(exportCurveBlockers(good) === null, "project lành bị chặn oan");
  const leaf = specWith([videoClip("leaf")]);
  const mid = specWith([nestedClip("MID-CURVINV", leaf, { speedKeyframes: curve([kf(0, 5)]) })]);
  const outer = specWith([nestedClip("TOP-CURVINV", mid)]);
  const msg = exportCurveBlockers(outer);
  assert(msg !== null && msg.includes("subSpec") && msg.includes("MID-CURVINV"), `nested v=5 thiếu đường dẫn subSpec: ${msg}`);
});

test("formatExportCurveError: liệt kê tối đa 5 + câu tổng kết số còn lại", () => {
  const ws = [];
  for (let i = 0; i < 7; i++) {
    ws.push({
      path: `tracks[0].clips[${i}]`,
      clipId: `c${i}`,
      keyframeIndex: 0,
      field: "v",
      value: 9,
      message: `keyframes[0].v phải trong [0.25, 4] (nhận được: 9).`,
    });
  }
  const msg = formatExportCurveError(ws as never);
  assert(msg.includes("c0") && msg.includes("c4"), "phải liệt kê 5 đầu");
  assert(!msg.includes("c5"), "không được liệt kê quá 5");
  assert(msg.includes("2 vi phạm khác"), `thiếu câu tổng kết: ${msg}`);
});

test("formatSanitizeSummary: nêu đủ số đã sửa / chưa sửa được / bỏ qua do khóa", () => {
  const res = sanitizeSpecSpeedCurves(
    specWith([videoClip("bad", { speedKeyframes: curve([kf(0, 5)]) })]) as never,
  );
  const s = formatSanitizeSummary(res);
  assert(s.includes("Đã sửa 1 curve") && s.includes("bad"), `summary thiếu thông tin sửa: ${s}`);
});

// ---- hồi quy: sanitize không làm hỏng các luật J5 khác ----

test("hồi quy: sau sanitize, easing bezier hợp lệ + v biên vẫn qua J5 (không đổi oan thành lỗi khác)", () => {
  const spec = specWith([
    videoClip("mix", {
      speedKeyframes: curve([
        kf(0, 0.25, "bezier", { bezier: [0.25, 0.1, 0.25, 1] }),
        kf(1, 9, "ease-in-out"),
        kf(2, 4),
      ]),
    }),
  ]);
  const res = sanitizeSpecSpeedCurves(spec as never);
  assert(collectSpeedCurveWarnings(res.spec).length === 0, "sau sanitize phải sạch J5");
  const fixedCurve = ((res.spec.tracks[0].clips[0] as unknown as Record<string, unknown>)["speedKeyframes"] as Record<string, unknown>)["keyframes"] as Record<string, unknown>[];
  eq(fixedCurve[0], kf(0, 0.25, "bezier", { bezier: [0.25, 0.1, 0.25, 1] }), "keyframe bezier hợp lệ đầu bị đổi oan");
  eq(fixedCurve[1], kf(1, 4, "linear"), "keyframe giữa phải clamp v=9→4 và easing→linear");
});

console.log(`\ncurveFixRound27K2: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
