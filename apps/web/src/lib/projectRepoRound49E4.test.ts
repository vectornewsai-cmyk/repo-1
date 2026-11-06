/**
 * projectRepoRound49E4.test.ts — Đợt 49 luồng E4: BUG volumeKeyframes NULL
 * (nợ D3 §8 mục 4) + củng cố vòng lặp preview.
 *
 * Bug: project có audio clip mang `volumeKeyframes.keyframes: [null]` qua
 * được cổng load, rồi `computeClipGain` → `interpolateKeyframes([null])`
 * ném TypeError trong `syncMedia` ở ĐẦU mỗi tick pause, TRƯỚC khi nhánh
 * pause phát seek request — tick không có try/catch nên vòng lặp preview
 * chết cứng (chỉ reload mới hết; xem docs/PHASE9_ROUND48_D3_PAUSE_LIMITS.md
 * §3.2). Test này khóa hướng sửa A (sanitize ở cổng load, fail-soft):
 * entry null / không hợp lệ bị loại khỏi mọi keyframe array khi load,
 * project lành không đổi gì.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, từ gốc repo):
 *   node --experimental-strip-types apps/web/src/lib/projectRepoRound49E4.test.ts
 *
 * Chỉ test logic thuần trong projectRepo.ts (+ computeClipGain, không
 * DOM/store). Theo mẫu harness của projectRepo.test.ts.
 */
import assert from "node:assert/strict";
import { parseProjectText, sanitizeKeyframeArrays, stableStringify } from "./projectRepo.ts";
import { computeClipGain } from "./audioEngine.ts";

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

function eqJson(a: unknown, b: unknown, msg: string): void {
  assert.equal(stableStringify(a), stableStringify(b), `${msg} — nhận ${stableStringify(a)}, muốn ${stableStringify(b)}`);
}

const KF = (t: number, v: number, easing = "linear"): Record<string, unknown> => ({ t, v, easing });

function audioClip(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "audio", id, src: "a.mp3", start: 0, duration: 4, in: 0, out: 4, volume: 0.5, ...extra };
}
function videoClip(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "video", id, src: "a.mp4", start: 0, duration: 4, in: 0, out: 4, ...extra };
}
function specWithClips(clips: Record<string, unknown>[]): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips }],
  };
}
function envelopeJson(spec: Record<string, unknown>): string {
  return JSON.stringify({
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion: "0.2.0",
    savedAt: "2026-10-27T00:00:00.000Z",
    name: "Test",
    spec,
  });
}

/** Lấy clip đầu tiên của spec đã load (đã qua sanitize). */
function firstClip(result: ReturnType<typeof parseProjectText>): Record<string, unknown> {
  assert.ok(result.ok, `load phải ok, lỗi: ${result.errors.join("; ")}`);
  const spec = result.spec as unknown as Record<string, unknown>;
  const tracks = spec["tracks"] as Record<string, unknown>[];
  return (tracks[0]["clips"] as Record<string, unknown>[])[0];
}

// --- Bug gốc D3 M1: volumeKeyframes [null] trên clip audio ---

test("M1 đỏ-trước: volumeKeyframes [null] được sanitize, không còn entry null", () => {
  const r = parseProjectText(envelopeJson(specWithClips([audioClip("a1", { volumeKeyframes: { keyframes: [null] } })])));
  const clip = firstClip(r);
  assert.equal(clip["volumeKeyframes"], undefined, "field volumeKeyframes phải bị xóa khi mọi entry đều null");
  assert.ok((r.keyframeFixes ?? []).length > 0, "phải ghi keyframeFixes");
  assert.ok(r.warnings.some((w) => w.includes("volumeKeyframes")), "phải có warning nhắc volumeKeyframes");
});

test("M1 xanh-sau (hành vi): clip đã sanitize tính gain được, không ném", () => {
  const r = parseProjectText(envelopeJson(specWithClips([audioClip("a1", { volumeKeyframes: { keyframes: [null] } })])));
  const clip = firstClip(r) as unknown as Parameters<typeof computeClipGain>[0];
  // Rơi về volume tĩnh 0.5 (không còn keyframes) — đúng ngữ nghĩa computeClipGain.
  assert.equal(computeClipGain(clip, 2, false, 1), 0.5);
});

test("volumeKeyframes [null, hợp lệ] giữ lại entry hợp lệ, bỏ null", () => {
  const r = parseProjectText(envelopeJson(specWithClips([audioClip("a1", { volumeKeyframes: { keyframes: [null, KF(0, 0.5), KF(3, 0.5)] } })])));
  const clip = firstClip(r);
  const vk = clip["volumeKeyframes"] as Record<string, unknown>;
  eqJson(vk["keyframes"], [KF(0, 0.5), KF(3, 0.5)], "chỉ giữ 2 entry hợp lệ");
  assert.equal(computeClipGain(clip as unknown as Parameters<typeof computeClipGain>[0], 1.5, false, 1), 0.5);
});

test("volumeKeyframes keyframes không phải mảng → xóa field", () => {
  const r = parseProjectText(envelopeJson(specWithClips([audioClip("a1", { volumeKeyframes: { keyframes: "x" } })])));
  assert.equal(firstClip(r)["volumeKeyframes"], undefined);
});

test("volumeKeyframes không phải object → xóa field", () => {
  const r = parseProjectText(envelopeJson(specWithClips([audioClip("a1", { volumeKeyframes: "x" })])));
  assert.equal(firstClip(r)["volumeKeyframes"], undefined);
});

test("entry thiếu v / v NaN (qua JSON thành null) bị loại", () => {
  const r = parseProjectText(envelopeJson(specWithClips([audioClip("a1", { volumeKeyframes: { keyframes: [{ t: 0 }, KF(1, 0.8)] } })])));
  const clip = firstClip(r);
  const vk = clip["volumeKeyframes"] as Record<string, unknown>;
  eqJson(vk["keyframes"], [KF(1, 0.8)], "entry thiếu v bị loại, entry hợp lệ giữ lại");
});

// --- Các keyframe array khác: cùng mẫu lỗi ---

test("animations.opacity [null] trên clip video được sanitize (cùng mẫu lỗi)", () => {
  const r = parseProjectText(envelopeJson(specWithClips([videoClip("v1", { animations: { opacity: { keyframes: [null] } } })])));
  const clip = firstClip(r);
  const anims = clip["animations"] as Record<string, unknown>;
  assert.equal(anims["opacity"], undefined, "animations.opacity phải bị xóa khi mọi entry đều null");
  assert.ok((r.keyframeFixes ?? []).some((f) => f.includes("animations.opacity")), "fix phải ghi rõ animations.opacity");
});

test("animations giữ entry hợp lệ, bỏ null (nhiều prop cùng lúc)", () => {
  const r = parseProjectText(envelopeJson(specWithClips([videoClip("v1", {
    animations: {
      x: { keyframes: [null, KF(0, 0.5)] },
      scale: { keyframes: [KF(0, 1)] },
      rotation: { keyframes: [null] },
    },
  })])));
  const clip = firstClip(r);
  const anims = clip["animations"] as Record<string, unknown>;
  eqJson((anims["x"] as Record<string, unknown>)["keyframes"], [KF(0, 0.5)], "x giữ entry hợp lệ");
  eqJson((anims["scale"] as Record<string, unknown>)["keyframes"], [KF(0, 1)], "scale không đổi");
  assert.equal(anims["rotation"], undefined, "rotation toàn null → xóa");
});

test("speedKeyframes [null] được sanitize (dù ramp có try/catch, dữ liệu vẫn phải sạch)", () => {
  const r = parseProjectText(envelopeJson(specWithClips([videoClip("v1", { speedKeyframes: { keyframes: [null] } })])));
  assert.equal(firstClip(r)["speedKeyframes"], undefined);
});

test("easing không hợp lệ được chuẩn hóa về linear (tránh NaN ở applyEasing)", () => {
  const r = parseProjectText(envelopeJson(specWithClips([audioClip("a1", { volumeKeyframes: { keyframes: [{ t: 0, v: 0.5, easing: "weird" }] } })])));
  const clip = firstClip(r);
  const vk = clip["volumeKeyframes"] as Record<string, unknown>;
  eqJson(vk["keyframes"], [KF(0, 0.5, "linear")], "easing lạ → linear");
});

// --- Đệ quy nested + project lành không đổi ---

test("nested subSpec: audio clip trong subSpec cũng được sanitize", () => {
  const inner = specWithClips([audioClip("inner-a", { volumeKeyframes: { keyframes: [null] } })]);
  const nested: Record<string, unknown> = {
    kind: "nested", id: "n1", start: 0, duration: 4, subSpec: inner,
  };
  const r = parseProjectText(envelopeJson(specWithClips([nested])));
  assert.ok(r.ok, `load nested phải ok, lỗi: ${r.errors.join("; ")}`);
  const outer = firstClip(r);
  const sub = outer["subSpec"] as Record<string, unknown>;
  const innerClip = ((sub["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[])[0];
  assert.equal(innerClip["volumeKeyframes"], undefined, "clip audio trong subSpec phải được sanitize");
});

test("project lành: không fix, không warning keyframes, spec giữ nguyên", () => {
  const healthy = specWithClips([
    audioClip("a1", { volumeKeyframes: { keyframes: [KF(0, 0.5), KF(3, 0.5)] } }),
    videoClip("v1", { animations: { opacity: { keyframes: [KF(0, 1)] } }, speedKeyframes: { keyframes: [KF(0, 1), KF(4, 1)] } }),
  ]);
  const before = stableStringify(healthy);
  const r = parseProjectText(envelopeJson(healthy));
  assert.ok(r.ok, `load phải ok, lỗi: ${r.errors.join("; ")}`);
  assert.equal((r.keyframeFixes ?? []).length, 0, "project lành không có keyframeFixes");
  assert.ok(!r.warnings.some((w) => w.includes("keyframe")), "project lành không có warning keyframes");
  // Spec trả về deep-equal với spec gốc (chỉ khác: sanitize không đụng gì).
  const spec = r.spec as unknown as Record<string, unknown>;
  assert.equal(stableStringify(spec), before, "spec lành phải giữ nguyên từng byte (theo stableStringify)");
});

// --- sanitizeKeyframeArrays trực tiếp (unit, không qua parse) ---

test("sanitizeKeyframeArrays trả về [] khi không có gì để sửa", () => {
  const spec = specWithClips([audioClip("a1")]) as unknown as Parameters<typeof sanitizeKeyframeArrays>[0];
  assert.deepEqual(sanitizeKeyframeArrays(spec), []);
});

console.log(`\nprojectRepoRound49E4: ${pass} passed, ${fail} failed.`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
