/**
 * previewEngine51H6.test.ts — Đợt 51 luồng H6: preview ném uncaught khi
 * animations toàn entry lỗi (nợ F1 §7.3 — F1 vá panel + builder render,
 * nhưng đường preview vẫn gọi interpolateKeyframes trực tiếp).
 *
 * Đỏ-trước (click-test headed thật, harness clicktest-51h6-keyframe-panel):
 * đưa `animations: { x: { keyframes: [null] } }` vào store qua patchClip
 * (đường in-memory duy nhất, F1 §3.4) rồi vẽ preview → vòng rAF ném
 * uncaught `Error: interpolateKeyframes: mảng keyframes rỗng` qua
 * videoClipVisual → drawVideoClip → renderFrame (2 lỗi window.onerror +
 * Runtime.exceptionThrown), trong khi KeyframePanel thì không sao (F1 đã
 * vá normalize + guard panel). Nguyên nhân: mọi chỗ gọi
 * memoInterpolateKeyframes trong previewEngine.ts chỉ guard `a?.x`
 * (field tồn tại) mà không guard "keyframes còn entry hợp lệ sau
 * normalize" — `[null]` có length 1 nên guard cũ không cứu, normalize
 * của F1 lọc thành [] rồi interpolateKeyframes ném theo contract.
 *
 * Fix (đợt 51 H6, tối thiểu): helper `hasUsableKeyframes` (normalize rồi
 * kiểm tra còn entry) + thay điều kiện ở cả 17 chỗ gọi
 * memoInterpolateKeyframes (videoClipVisual 5, videoElementPlacement 4,
 * textSrPlacement 4, textClipVisual SR 1 + keyframes 3). Ngữ nghĩa khớp
 * sanitize render của F1: field rỗng sau lọc ≡ không có animation ≡
 * giá trị mặc định của prop đó (x/y 0.5, opacity/scale 1, rotation 0).
 *
 * Test này khóa (qua code thật, không mock kết quả):
 *  - hasUsableKeyframes: [null]/[]/undefined → false; [null, hợp lệ] → true.
 *  - videoClipVisual / videoElementPlacement / textSrPlacement /
 *    textClipVisual với animations [null] ở MỌI prop → không ném, rơi về
 *    đúng giá trị mặc định; hỗn hợp [null, hợp lệ] vẫn nội suy trên entry
 *    hợp lệ (không đổi hành vi project lành).
 *  - Contract giữ nguyên: interpolateKeyframes([null]) vẫn ném lỗi rõ
 *    "mảng keyframes rỗng" (F1) — fix nằm ở tầng gọi, không nới builder.
 *
 * Chạy (từ gốc repo): node --experimental-strip-types apps/web/src/lib/previewEngine51H6.test.ts
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import {
  hasUsableKeyframes,
  textClipVisual,
  textSrPlacement,
  videoClipVisual,
  videoElementPlacement,
} from "./previewEngine.ts";
import { interpolateKeyframes } from "@repo-1/video-spec";

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

const NULL_KF = [null] as never;
const MIXED_X = [null, { t: 0, v: 0, easing: "linear" }, { t: 2, v: 1, easing: "linear" }, null] as never;
const VALID_X = [
  { t: 0, v: 0, easing: "linear" },
  { t: 2, v: 1, easing: "linear" },
] as never;

const videoClip = (animations?: unknown) => ({
  kind: "video",
  id: "c",
  src: "a.mp4",
  start: 0,
  duration: 4,
  in: 0,
  out: 4,
  ...(animations ? { animations } : {}),
});

const textClip = (animations?: unknown) => ({
  kind: "text",
  id: "t",
  start: 0,
  duration: 4,
  text: "Xin chào",
  style: { x: 0.5, y: 0.5, fontSize: 48, fontFamily: "Inter", color: "#fff", animation: "none" },
  ...(animations ? { animations } : {}),
});
const MEASURE = { textW: 200, textH: 64.8 };

// --- 1. hasUsableKeyframes ---
test("hasUsableKeyframes([null]) → false", () => {
  assert.equal(hasUsableKeyframes({ keyframes: NULL_KF }), false);
});
test("hasUsableKeyframes([]) → false", () => {
  assert.equal(hasUsableKeyframes({ keyframes: [] }), false);
});
test("hasUsableKeyframes(undefined) → false", () => {
  assert.equal(hasUsableKeyframes(undefined), false);
});
test("hasUsableKeyframes([null, hợp lệ]) → true", () => {
  assert.equal(hasUsableKeyframes({ keyframes: MIXED_X }), true);
});
test("hasUsableKeyframes(hợp lệ) → true", () => {
  assert.equal(hasUsableKeyframes({ keyframes: VALID_X }), true);
});

// --- 2. videoClipVisual với [null] ở mọi prop: không ném, về mặc định ---
test("videoClipVisual: mọi prop [null] → opacity tĩnh, offset 0, scale 1, rot 0", () => {
  const clip = videoClip({
    x: { keyframes: NULL_KF },
    y: { keyframes: NULL_KF },
    opacity: { keyframes: NULL_KF },
    scale: { keyframes: NULL_KF },
    rotation: { keyframes: NULL_KF },
  });
  const v = videoClipVisual(clip as never, 1, 600, 480, 1000, 480);
  assert.equal(v.opacity, 1, "opacity [null] → mặc định 1 (clip không opacity tĩnh)");
  assert.equal(v.offsetX, 0, "x [null] → offset 0");
  assert.equal(v.offsetY, 0, "y [null] → offset 0");
  assert.equal(v.scale, 1, "scale [null] → 1");
  assert.equal(v.rotation, 0, "rotation [null] → 0");
});
test("videoClipVisual: opacity [null] + opacity tĩnh 0.5 → giữ 0.5", () => {
  const clip = { ...videoClip({ opacity: { keyframes: NULL_KF } }), opacity: 0.5 };
  const v = videoClipVisual(clip as never, 1, 640, 480, 640, 480);
  assert.equal(v.opacity, 0.5, "opacity [null] rơi về opacity tĩnh, không ném");
});
test("videoClipVisual: x hỗn hợp [null, hợp lệ] → nội suy trên entry hợp lệ", () => {
  const clip = videoClip({ x: { keyframes: MIXED_X } });
  const v = videoClipVisual(clip as never, 1, 600, 480, 1000, 480);
  assert.equal(v.offsetX, 200, "0.5*(1000-600) như keyframes lành");
});

// --- 3. videoElementPlacement với [null]: không ném, về mặc định ---
test("videoElementPlacement: mọi prop [null] → scale 1, rot 0, căn giữa", () => {
  const clip = videoClip({
    x: { keyframes: NULL_KF },
    y: { keyframes: NULL_KF },
    scale: { keyframes: NULL_KF },
    rotation: { keyframes: NULL_KF },
  });
  const p = videoElementPlacement(clip as never, 1, 640, 480, 1000, 480);
  assert.equal(p.scale, 1, "scale [null] → 1");
  assert.equal(p.rotationDeg, 0, "rotation [null] → 0");
  assert.equal(p.topLeftX, 0.5 * (1000 - p.bboxW), "x [null] → căn giữa 0.5");
  assert.equal(p.topLeftY, 0.5 * (480 - p.bboxH), "y [null] → căn giữa 0.5");
});

// --- 4. textSrPlacement với [null]: không ném, về mặc định ---
test("textSrPlacement: mọi prop [null] → scale 1, rot 0, căn giữa", () => {
  const clip = textClip({
    x: { keyframes: NULL_KF },
    y: { keyframes: NULL_KF },
    scale: { keyframes: NULL_KF },
    rotation: { keyframes: NULL_KF },
  });
  const p = textSrPlacement(clip as never, 1, 1280, 720, MEASURE);
  assert.equal(p.scale, 1, "scale [null] → 1");
  assert.equal(p.rotationDeg, 0, "rotation [null] → 0");
  assert.equal(p.topLeftX, 0.5 * (1280 - p.bboxW), "x [null] → căn giữa 0.5");
  assert.equal(p.topLeftY, 0.5 * (720 - p.bboxH), "y [null] → căn giữa 0.5");
});

// --- 5. textClipVisual với [null] (cả 2 nhánh): không ném, về mặc định ---
test("textClipVisual nhánh SR: scale/rotation/opacity [null] → alpha 1, sr true", () => {
  const clip = textClip({
    scale: { keyframes: NULL_KF },
    rotation: { keyframes: NULL_KF },
    opacity: { keyframes: NULL_KF },
  });
  const v = textClipVisual(clip as never, 1, 1280, 720, MEASURE);
  assert.equal(v.sr, true, "vẫn vào nhánh SR (field tồn tại)");
  assert.equal(v.alpha, 1, "opacity [null] → alpha 1");
  assert.equal(v.scale, 1, "scale [null] → 1");
  assert.equal(v.rotationDeg, 0, "rotation [null] → 0");
});
test("textClipVisual nhánh keyframes: x/y/opacity [null] → vị trí style, alpha 1", () => {
  const clip = textClip({
    x: { keyframes: NULL_KF },
    y: { keyframes: NULL_KF },
    opacity: { keyframes: NULL_KF },
  });
  const v = textClipVisual(clip as never, 2, 1280, 720, MEASURE);
  assert.equal(v.alpha, 1, "opacity [null] → alpha 1");
  assert.equal(v.cx, (1280 - MEASURE.textW) * 0.5 + MEASURE.textW / 2, "x [null] → st.x 0.5");
  assert.equal(v.cy, (720 - MEASURE.textH) * 0.5 + MEASURE.textH / 2, "y [null] → st.y 0.5");
});

// --- 6. Hồi quy: keyframes lành vẫn nội suy như cũ ---
test("hồi quy: videoClipVisual x lành → offset đúng công thức", () => {
  const clip = videoClip({ x: { keyframes: VALID_X } });
  const v = videoClipVisual(clip as never, 1, 600, 480, 1000, 480);
  assert.equal(v.offsetX, 200, "0.5*(1000-600)");
});
test("hồi quy: textClipVisual x lành → cx theo keyframe", () => {
  const clip = textClip({ x: { keyframes: VALID_X } });
  const v = textClipVisual(clip as never, 2, 1280, 720, MEASURE);
  assert.equal(v.cx, (1280 - MEASURE.textW) * 1 + MEASURE.textW / 2, "x=1 cuối clip");
});

// --- 7. Contract giữ nguyên: builder vẫn ném lỗi rõ với [null] ---
test("contract: interpolateKeyframes([null]) vẫn ném 'mảng keyframes rỗng'", () => {
  assert.throws(
    () => interpolateKeyframes(NULL_KF, 0),
    /mảng keyframes rỗng/,
    "fix nằm ở tầng gọi preview, không nới builder (F1)",
  );
});

console.log(`\npreviewEngine51H6: ${pass} passed, ${fail} failed${fail ? ` (${failedNames.join(", ")})` : ""}`);
if (fail > 0) process.exitCode = 1;
