/**
 * projectRepoRound26J5.test.ts — Test khóa validation speedKeyframes lúc
 * load (Phase 9 đợt 26, luồng J5; sửa lỗ hổng đợt 25 I6 §5a).
 *
 * I6 §5a: load-validation cho qua curve nested vi phạm (v=5) vì
 * validateSpecDeep không kiểm tra speedKeyframes ở clip nào — nên
 * project vi phạm lọt tới preview mới nổ exception. Đợt này kiểm tra
 * speedKeyframes ngay lúc load, nhưng FAIL-SOFT: project vi phạm vẫn
 * mở được (ok: true), chỉ thu thập warnings có cấu trúc (đường dẫn
 * clip, keyframe nào, giá trị nào) để UI hiển thị qua toast lúc mở
 * file (ProjectMenu.warnList) và lúc khôi phục autosave (App.tsx).
 * Luồng J1 song song làm fail-soft ở phía preview; luồng này KHÔNG
 * đụng buildPreviewSpec hay flatten.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, mẫu projectRepo.test.ts):
 *   node apps/web/src/lib/projectRepoRound26J5.test.ts
 */
import {
  checkSpeedKeyframes,
  collectSpeedCurveWarnings,
  parseProjectText,
  validateSpecDeep,
} from "./projectRepo.ts";

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

function kf(t: number, v: number, easing = "linear", extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { t, v, easing, ...extra };
}

function curve(kfs: Record<string, unknown>[]): Record<string, unknown> {
  return { keyframes: kfs };
}

function videoClip(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "video", id, src: "a.mp4", start: 0, duration: 2, in: 0, out: 2, ...extra };
}

function specWith(clips: unknown[]): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 640, height: 360, fps: 30 },
    tracks: [{ id: "v", kind: "video", clips }],
  };
}

function nestedClip(id: string, sub: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "nested", id, start: 0, duration: 2, trim: { in: 0, out: 2 }, subSpec: sub, ...extra };
}

function envelope(spec: unknown): string {
  return JSON.stringify({
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion: "0.2.0",
    savedAt: "2026-10-30T00:00:00.000Z",
    name: "test",
    spec,
  });
}

/** Project: TOP nested → MID nested mang curve v=5 (đúng seed I6 §5a). */
function i6SeedLike(): Record<string, unknown> {
  const leaf = specWith([videoClip("leaf")]);
  const mid = specWith([nestedClip("MID-CURVINV", leaf, { speedKeyframes: curve([kf(0, 5)]) })]);
  return specWith([nestedClip("TOP-CURVINV", mid)]);
}

test("v=5 trên nested bị bắt (đường dẫn, keyframe, giá trị đầy đủ)", () => {
  const spec = i6SeedLike();
  const ws = collectSpeedCurveWarnings(spec);
  assert(ws.length === 1, `muốn đúng 1 warning, nhận ${JSON.stringify(ws)}`);
  const w = ws[0];
  assert(w.path === "tracks[0].clips[0].subSpec.tracks[0].clips[0]", `path sai: ${w.path}`);
  assert(w.clipId === "MID-CURVINV", `clipId sai: ${w.clipId}`);
  assert(w.keyframeIndex === 0, `keyframeIndex sai: ${w.keyframeIndex}`);
  assert(w.field === "v", `field sai: ${w.field}`);
  assert(w.value === 5, `value sai: ${JSON.stringify(w.value)}`);
  assert(w.message.includes("5"), `message thiếu giá trị: ${w.message}`);
});

test("load project vi phạm: KHÔNG từ chối (ok:true), có warnings cấu trúc + chuỗi", () => {
  const res = parseProjectText(envelope(i6SeedLike()));
  assert(res.ok === true, `load bị từ chối: ${JSON.stringify(res.errors)}`);
  assert(res.spec !== null, "spec null sau load fail-soft");
  assert(res.speedCurveWarnings.length === 1, `muốn 1 warning cấu trúc, nhận ${JSON.stringify(res.speedCurveWarnings)}`);
  assert(res.speedCurveWarnings[0].value === 5, "warning cấu trúc thiếu giá trị 5");
  assert(
    res.warnings.some((s) => s.includes("MID-CURVINV") && s.includes("5")),
    `warnings chuỗi thiếu clip/giá trị: ${JSON.stringify(res.warnings)}`,
  );
});

test("validateSpecDeep mặc định KHÔNG coi curve là error (fail-soft, hồi quy hành vi load)", () => {
  const errs = validateSpecDeep(i6SeedLike());
  assert(errs.length === 0, `curve không được thành error: ${JSON.stringify(errs)}`);
});

test("validateSpecDeep với opts thu warnings trong cùng lần duyệt, khớp collector độc lập", () => {
  const spec = i6SeedLike();
  const viaOpts: unknown[] = [];
  const errs = validateSpecDeep(spec, new Set(), { speedCurveWarnings: viaOpts as never[] });
  assert(errs.length === 0, `errors lạ: ${JSON.stringify(errs)}`);
  const viaCollect = collectSpeedCurveWarnings(spec);
  assert(viaOpts.length === viaCollect.length, `opts ${viaOpts.length} != collect ${viaCollect.length}`);
  assert(
    JSON.stringify(viaOpts) === JSON.stringify(viaCollect),
    `nội dung khác nhau: ${JSON.stringify(viaOpts)} vs ${JSON.stringify(viaCollect)}`,
  );
});

test("v biên 0.25/4 cho qua (0 warning)", () => {
  const leaf = specWith([videoClip("leaf", { speedKeyframes: curve([kf(0, 0.25), kf(2, 4)]) })]);
  const outer = specWith([nestedClip("n1", leaf)]);
  assert(collectSpeedCurveWarnings(outer).length === 0, "v biên bị bắt oan");
  const res = parseProjectText(envelope(outer));
  assert(res.ok === true, `load lành thất bại: ${JSON.stringify(res.errors)}`);
  assert(res.speedCurveWarnings.length === 0, `lành mà có warning: ${JSON.stringify(res.speedCurveWarnings)}`);
  assert(res.warnings.length === 0, `lành mà có warning chuỗi: ${JSON.stringify(res.warnings)}`);
});

test("t không đơn điệu tăng bị bắt (giảm và bằng nhau đều bắt)", () => {
  const bad1 = videoClip("c1", { speedKeyframes: curve([kf(0, 1), kf(2, 2), kf(1, 1.5)]) });
  const ws1 = checkSpeedKeyframes(
    (bad1 as Record<string, unknown>)["speedKeyframes"], "tracks[0].clips[0]", "c1", 4,
  );
  assert(ws1.some((w) => w.field === "t" && w.keyframeIndex === 2), `t giảm không bị bắt: ${JSON.stringify(ws1)}`);
  const bad2 = videoClip("c2", { speedKeyframes: curve([kf(0, 1), kf(1, 2), kf(1, 1.5)]) });
  const ws2 = checkSpeedKeyframes(
    (bad2 as Record<string, unknown>)["speedKeyframes"], "tracks[0].clips[0]", "c2", 4,
  );
  assert(ws2.some((w) => w.field === "t" && w.keyframeIndex === 2), `t bằng nhau không bị bắt: ${JSON.stringify(ws2)}`);
});

test("easing lạ bị bắt, easing hợp lệ cho qua", () => {
  const bad = videoClip("c1", { speedKeyframes: curve([kf(0, 1, "ease-in-out")]) });
  const ws = checkSpeedKeyframes(
    (bad as Record<string, unknown>)["speedKeyframes"], "tracks[0].clips[0]", "c1", 2,
  );
  assert(ws.some((w) => w.field === "easing" && w.value === "ease-in-out"), `easing lạ không bị bắt: ${JSON.stringify(ws)}`);
  const good = videoClip("c2", {
    speedKeyframes: curve([kf(0, 1, "linear"), kf(1, 1, "ease-in"), kf(2, 1, "bezier", { bezier: [0.25, 0.1, 0.25, 1] })]),
  });
  assert(
    checkSpeedKeyframes((good as Record<string, unknown>)["speedKeyframes"], "tracks[0].clips[0]", "c2", 2).length === 0,
    "easing hợp lệ bị bắt oan",
  );
});

test("nested sâu 3 tầng vẫn bắt được, đường dẫn đủ 2 đoạn subSpec", () => {
  const leaf = specWith([videoClip("leaf")]);
  const levelB = specWith([nestedClip("B-DEEP", leaf, { speedKeyframes: curve([kf(0, 5)]) })]);
  const levelA = specWith([nestedClip("A-DEEP", levelB)]);
  const outer = specWith([nestedClip("TOP", levelA)]);
  const ws = collectSpeedCurveWarnings(outer);
  assert(ws.length === 1, `muốn 1 warning, nhận ${JSON.stringify(ws)}`);
  assert(
    ws[0].path === "tracks[0].clips[0].subSpec.tracks[0].clips[0].subSpec.tracks[0].clips[0]",
    `path sâu sai: ${ws[0].path}`,
  );
  assert(ws[0].clipId === "B-DEEP", `clipId sai: ${ws[0].clipId}`);
});

test("project lành 0 warning (kể cả curve bezier hợp lệ + nested không curve)", () => {
  const leaf = specWith([
    videoClip("leaf", { speedKeyframes: curve([kf(0, 1, "bezier", { bezier: [0.25, 0.1, 0.25, 1] }), kf(2, 2)]) }),
    videoClip("plain"),
  ]);
  const outer = specWith([nestedClip("n1", leaf), videoClip("top-leaf")]);
  const res = parseProjectText(envelope(outer));
  assert(res.ok === true, `load lành thất bại: ${JSON.stringify(res.errors)}`);
  assert(res.speedCurveWarnings.length === 0, `lành mà có warning: ${JSON.stringify(res.speedCurveWarnings)}`);
});

test("keyframes rỗng bị bắt (cần ít nhất 1 keyframe khi có curve)", () => {
  const ws = checkSpeedKeyframes(curve([]), "tracks[0].clips[0]", "c1", 2);
  assert(ws.length === 1 && ws[0].keyframeIndex === null, `rỗng không bị bắt: ${JSON.stringify(ws)}`);
});

test("bezier malformed bị bắt (x1 ngoài [0,1], thiếu mảng)", () => {
  const ws1 = checkSpeedKeyframes(
    curve([kf(0, 1, "bezier", { bezier: [1.5, 0, 0.25, 1] })]), "tracks[0].clips[0]", "c1", 2,
  );
  assert(ws1.some((w) => w.field === "bezier"), `bezier x1=1.5 không bị bắt: ${JSON.stringify(ws1)}`);
  const ws2 = checkSpeedKeyframes(curve([kf(0, 1, "bezier")]), "tracks[0].clips[0]", "c1", 2);
  assert(ws2.some((w) => w.field === "bezier"), `bezier thiếu mảng không bị bắt: ${JSON.stringify(ws2)}`);
});

test("t vượt duration và v dưới 0.25 bị bắt", () => {
  const ws = checkSpeedKeyframes(
    curve([kf(0, 0.1), kf(5, 1)]), "tracks[0].clips[0]", "c1", 2,
  );
  assert(ws.some((w) => w.field === "v" && w.value === 0.1), `v=0.1 không bị bắt: ${JSON.stringify(ws)}`);
  assert(ws.some((w) => w.field === "t" && w.value === 5), `t=5 vượt duration không bị bắt: ${JSON.stringify(ws)}`);
});

test("lá video cấp cao mang curve v=5 cũng bị bắt qua cổng load", () => {
  const spec = specWith([videoClip("leaf-bad", { speedKeyframes: curve([kf(0, 5)]) })]);
  const res = parseProjectText(envelope(spec));
  assert(res.ok === true, `load bị từ chối: ${JSON.stringify(res.errors)}`);
  assert(res.speedCurveWarnings.length === 1, `muốn 1 warning: ${JSON.stringify(res.speedCurveWarnings)}`);
  assert(res.speedCurveWarnings[0].path === "tracks[0].clips[0]", `path lá sai: ${res.speedCurveWarnings[0].path}`);
});

test("hồi quy validator cũ: speed hằng 9 và thiếu subSpec vẫn là errors", () => {
  const leaf = specWith([videoClip("leaf")]);
  const badSpeed = specWith([nestedClip("n1", leaf, { speed: 9 })]);
  assert(validateSpecDeep(badSpeed).some((e) => e.includes("speed")), "speed hằng 9 mất lỗi");
  const badSub = specWith([{ kind: "nested", id: "n1", start: 0, duration: 2 }]);
  assert(validateSpecDeep(badSub).some((e) => e.includes("thiếu subSpec")), "thiếu subSpec mất lỗi");
  const good = specWith([nestedClip("n1", leaf)]);
  assert(validateSpecDeep(good).length === 0, "nested lành sinh error");
});

test("clip không có speedKeyframes thì không sinh warning giả", () => {
  const spec = specWith([videoClip("a"), nestedClip("n1", specWith([videoClip("b")]))]);
  assert(collectSpeedCurveWarnings(spec).length === 0, "clip không curve mà có warning");
});

console.log(`\nprojectRepoRound26J5: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
