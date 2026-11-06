// nestedPreviewFailsoft26J1.test.ts — Phase 9 đợt 26 luồng J1:
// fail-soft ở preview hot path cho nested curve vi phạm (đợt 25 I6 §5a).
// Chạy từ gốc repo:
//   node --experimental-strip-types apps/web/src/lib/nestedPreviewFailsoft26J1.test.ts
// Quy ước: flatten thuần VẪN throw (fail-fast có chủ ý, khớp render);
// chỉ wrapper fail-soft ở tầng preview mới bắt lỗi từng nested riêng lẻ.
import assert from "node:assert/strict";
import {
  buildPreviewSpec,
  buildPreviewSpecFailsoft,
  flattenForPreview,
  resolveNestedRampCurve,
} from "./nestedPreview.ts";

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
function approx(actual: number, expected: number, eps = 1e-6, what = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${what} kỳ vọng ${expected}, nhận ${actual}`,
  );
}
type AnyRec = Record<string, unknown>;
function video(id: string, start: number, duration: number, extra: AnyRec = {}): AnyRec {
  return { kind: "video", id, start, duration, in: 0, out: duration, ...extra };
}
function nested(id: string, start: number, duration: number, extra: AnyRec, inner: unknown[]): AnyRec {
  return {
    kind: "nested", id, start, duration, in: 0,
    tracks: [{ kind: "video", clips: inner }],
    ...extra,
  };
}
function specOf(...tracks: AnyRec[]): AnyRec {
  return { version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 }, tracks };
}
function track(id: string, clips: unknown[]): AnyRec {
  return { id, kind: "video", clips };
}
function nestedTrackClips(out: AnyRec): AnyRec[] {
  const t = (out.tracks as AnyRec[]).find((x) => (x.id as string).startsWith("__nested-"));
  assert.ok(t, "phải có track __nested-video");
  return t.clips as AnyRec[];
}
const V5 = { keyframes: [
  { t: 0, v: 5, easing: "linear" },
  { t: 4, v: 5, easing: "linear" },
] };
const LINEAR_1_2 = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 4, v: 2, easing: "linear" },
] };
const CONST_1 = { keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 4, v: 1, easing: "linear" },
] };

console.log("== J1: preview fail-soft cho nested curve vi phạm ==");
ok("1. nested vi phạm v=5 KHÔNG ném uncaught ở failsoft, lá giữ lại ở 1×", () => {
  const bad = nested("BAD", 10, 4, { speedKeyframes: V5 }, [video("leaf", 0, 6)]);
  const spec = specOf(track("v", [bad]));
  const res = buildPreviewSpecFailsoft(spec as never);
  assert.equal(res.warnings.length, 1);
  assert.equal(res.warnings[0].nestedId, "BAD");
  assert.equal(res.warnings[0].fallback, "linear-1x");
  assert.match(res.warnings[0].reason, /0\.25\.\.4/);
  assert.match(res.warnings[0].reason, /5/);
  const clips = nestedTrackClips(res.spec as unknown as AnyRec);
  assert.equal(clips.length, 1);
  approx(clips[0].start as number, 10, 1e-9, "leaf start");
  approx(clips[0].duration as number, 4, 1e-9, "leaf duration ở 1× = duration nested");
  assert.equal(clips[0].in, 0);
  assert.equal(clips[0].out, 4);
  // Spec gốc không bị sửa: curve vi phạm vẫn còn nguyên v=5.
  assert.equal((((bad.speedKeyframes as AnyRec).keyframes as AnyRec[])[0]).v, 5);
});

ok("2. nested lành giữ ramp đúng, không warning, spec bằng đường nhanh", () => {
  const good = nested("GOOD", 10, 4, { speedKeyframes: LINEAR_1_2 }, [video("leaf", 0, 6)]);
  const spec = specOf(track("v", [good]));
  const res = buildPreviewSpecFailsoft(spec as never);
  assert.deepEqual(res.warnings, []);
  const clips = nestedTrackClips(res.spec as unknown as AnyRec);
  assert.equal(clips.length, 1);
  approx(clips[0].duration as number, 4, 1e-9, "duration output");
  const kfs = ((clips[0].speedKeyframes as AnyRec).keyframes as AnyRec[]);
  approx(kfs[0].v as number, 1, 1e-9, "slice v đầu");
  approx(kfs[kfs.length - 1].v as number, 2, 1e-9, "slice v cuối");
  // Đường nhanh: failsoft trả đúng kết quả buildPreviewSpec thuần.
  assert.deepEqual(res.spec, buildPreviewSpec(spec as never));
});

ok("3. lỗi ở tầng sâu (I6: MID-CURVINV v=5 trong TOP-CURVINV) — warning quy về tầng ngoài, reason nêu đúng tên tầng sâu + luật", () => {
  const mid = nested("MID-CURVINV", 0, 4, { speedKeyframes: V5 }, [video("leaf", 0, 6)]);
  const top = nested("TOP-CURVINV", 0, 4, { speedKeyframes: CONST_1 }, [mid]);
  const spec = specOf(track("v", [top]));
  const res = buildPreviewSpecFailsoft(spec as never);
  assert.equal(res.warnings.length, 1);
  assert.equal(res.warnings[0].nestedId, "TOP-CURVINV");
  assert.match(res.warnings[0].reason, /MID-CURVINV/);
  assert.match(res.warnings[0].reason, /0\.25\.\.4/);
  assert.equal(res.warnings[0].fallback, "linear-1x");
  const clips = nestedTrackClips(res.spec as unknown as AnyRec);
  assert.equal(clips.length, 1);
  approx(clips[0].duration as number, 4, 1e-9, "lá về 1× ở cả hai tầng");
});

ok("4. trộn lành + lỗi: nested lành giữ ramp, chỉ nested lỗi có warning", () => {
  const good = nested("GOOD", 0, 4, { speedKeyframes: LINEAR_1_2 }, [video("g", 0, 6)]);
  const bad = nested("BAD", 10, 4, { speedKeyframes: V5 }, [video("b", 0, 6)]);
  const spec = specOf(track("v", [good]), track("w", [bad]));
  const res = buildPreviewSpecFailsoft(spec as never);
  assert.equal(res.warnings.length, 1);
  assert.equal(res.warnings[0].nestedId, "BAD");
  const clips = nestedTrackClips(res.spec as unknown as AnyRec);
  assert.equal(clips.length, 2);
  const g = clips.find((c) => c.id === "g")!;
  const b = clips.find((c) => c.id === "b")!;
  const gkfs = ((g.speedKeyframes as AnyRec).keyframes as AnyRec[]);
  approx(gkfs[gkfs.length - 1].v as number, 2, 1e-9, "lá lành giữ ramp 1→2");
  approx(b.duration as number, 4, 1e-9, "lá lỗi về 1×");
});

ok("5. hợp hai tầng vượt ngưỡng (lá 2× dưới nested hằng 4×) — force-all về 1×, không dropped", () => {
  const leaf = video("leaf", 0, 8, { speedKeyframes: { keyframes: [
    { t: 0, v: 2, easing: "linear" },
    { t: 8, v: 2, easing: "linear" },
  ] } });
  const outer = nested("OUTER4", 0, 4, { speedKeyframes: { keyframes: [
    { t: 0, v: 4, easing: "linear" },
    { t: 4, v: 4, easing: "linear" },
  ] } }, [leaf]);
  const spec = specOf(track("v", [outer]));
  // Đường thuần phải throw ở bước hợp (2 × 4 = 8 vượt [0.25, 4]).
  assert.throws(() => flattenForPreview(spec as never), /hợp hai tầng|0\.25\.\.4/);
  const res = buildPreviewSpecFailsoft(spec as never);
  assert.equal(res.warnings.length, 1);
  assert.equal(res.warnings[0].fallback, "linear-1x");
  assert.match(res.warnings[0].reason, /hợp hai tầng/);
  const clips = nestedTrackClips(res.spec as unknown as AnyRec);
  assert.equal(clips.length, 1);
  approx(clips[0].duration as number, 4, 1e-9, "lá về 1×");
  const kfs = ((clips[0].speedKeyframes as AnyRec).keyframes as AnyRec[]);
  assert.ok(kfs.every((k) => (k.v as number) === 1), "mọi keyframe về 1");
});

ok("6. hồi quy: hàm thuần vẫn fail-fast (flatten / resolve / buildPreviewSpec đều throw)", () => {
  const bad = nested("BAD", 10, 4, { speedKeyframes: V5 }, [video("leaf", 0, 6)]);
  const spec = specOf(track("v", [bad]));
  assert.throws(() => resolveNestedRampCurve(V5, 4, "test"), /0\.25\.\.4/);
  assert.throws(() => flattenForPreview(spec as never), /0\.25\.\.4/);
  assert.throws(() => buildPreviewSpec(spec as never), /0\.25\.\.4/);
  // Spec không có nested vẫn trả đúng object cũ, không warning.
  const plain = specOf(track("v", [video("a", 0, 5)]));
  const res = buildPreviewSpecFailsoft(plain as never);
  assert.equal(res.spec, plain as never);
  assert.deepEqual(res.warnings, []);
});

console.log(`\n${pass} test passed`);
