#!/usr/bin/env node
/**
 * roundtrip.test.ts — Round-trip test cho MCP schema parity (R1-020, P0-10).
 *
 * Kiểm tra: spec đầy đủ field mới (speed, reverse, keyframes, chromaKey,
 * filter/LUT, effects, sticker, image, 13 transitions, 8 text animations)
 * đi qua MCP validate → serialize JSON → parse → KHÔNG mất field nào.
 *
 * Chạy: node --experimental-strip-types src/roundtrip.test.ts
 * (hoặc: npx tsc rồi node dist test)
 */
import { validateVideoSpec, validateClipForTrack, ValidationError } from "./validate.js";
import { SPEC_VERSION } from "../../packages/video-spec/src/index.js";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ ${msg}`);
  }
}

function assertThrows(fn: () => void, msg: string) {
  try {
    fn();
    failed++;
    console.log(`  ❌ ${msg} (không ném lỗi như kỳ vọng)`);
  } catch (e) {
    if (e instanceof ValidationError) {
      passed++;
      console.log(`  ✅ ${msg}`);
    } else {
      failed++;
      console.log(`  ❌ ${msg} (ném lỗi sai loại: ${e})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Spec đầy đủ mọi field mới
// ---------------------------------------------------------------------------
function buildFullSpec() {
  return {
    version: SPEC_VERSION,
    meta: { name: "Roundtrip Test", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        label: "Video",
        clips: [
          {
            kind: "video",
            id: "c1",
            src: "clip1.mp4",
            start: 0,
            duration: 5,
            in: 0,
            out: 10,
            transitionIn: { type: "fade", duration: 0.5 },
            transitionOut: { type: "wipeleft", duration: 0.5 },
            opacity: 0.9,
            speed: 2,
            reverse: false,
            animations: {
              x: { keyframes: [{ t: 0, v: 0.5, easing: "linear" }, { t: 5, v: 0.8, easing: "ease-out" }] },
              opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 5, v: 0.5, easing: "ease-in" }] },
            },
            chromaKey: { color: "#00FF00", similarity: 0.3, blend: 0.1 },
            filter: { lut: "cartcut-teal-orange" },
            effects: [
              { type: "vignette", intensity: 0.6 },
              { type: "grayscale", intensity: 1 },
            ],
          },
        ],
      },
      {
        id: "a1",
        kind: "audio",
        clips: [
          {
            kind: "audio",
            id: "a1c1",
            src: "music.mp3",
            start: 0,
            duration: 5,
            in: 0,
            out: 5,
            volume: 0.8,
            speed: 1.5,
            reverse: true,
          },
        ],
      },
      {
        id: "t1",
        kind: "text",
        clips: [
          {
            kind: "text",
            id: "t1c1",
            text: "Xin chào",
            start: 1,
            duration: 3,
            style: {
              fontFamily: "Noto Sans",
              fontSize: 48,
              color: "#ffffff",
              animation: "bounce",
            },
          },
        ],
      },
      {
        id: "s1",
        kind: "sticker",
        label: "Sticker",
        clips: [
          {
            kind: "sticker",
            id: "s1c1",
            src: "star.png",
            start: 2,
            duration: 2,
            x: 0.8,
            y: 0.2,
            scale: 0.3,
            opacity: 0.9,
            rotation: 15,
          },
        ],
      },
      {
        id: "i1",
        kind: "image",
        label: "Ảnh",
        clips: [
          {
            kind: "image",
            id: "i1c1",
            src: "photo.jpg",
            start: 0,
            duration: 4,
            fit: "cover",
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Test 1: Full spec round-trip không mất field
// ---------------------------------------------------------------------------
console.log("\n[Test 1] Full spec với mọi field mới → validate → serialize → parse");
try {
  const input = buildFullSpec();
  const validated = validateVideoSpec(input);
  const json = JSON.stringify(validated);
  const parsed = JSON.parse(json);
  const revalidated = validateVideoSpec(parsed);
  const json2 = JSON.stringify(revalidated);

  assert(json === json2, "serialize → parse → revalidate cho JSON giống hệt nhau");

  // Kiểm tra từng field mới còn nguyên
  const vc = revalidated.tracks[0].clips[0] as any;
  assert(vc.speed === 2, "video.speed = 2 còn nguyên");
  assert(vc.reverse === false, "video.reverse = false còn nguyên");
  assert(vc.animations?.x?.keyframes?.length === 2, "video.animations.x có 2 keyframes");
  assert(vc.animations?.opacity?.keyframes[1]?.easing === "ease-in", "keyframe easing còn nguyên");
  assert(vc.chromaKey?.color === "#00FF00", "video.chromaKey còn nguyên");
  assert(vc.filter?.lut === "cartcut-teal-orange", "video.filter.lut còn nguyên");
  assert(vc.effects?.length === 2, "video.effects có 2 items");
  assert(vc.effects[1].type === "grayscale", "effects[1].type = grayscale");
  assert(vc.transitionOut?.type === "wipeleft", "transition wipeleft còn nguyên");

  const ac = revalidated.tracks[1].clips[0] as any;
  assert(ac.speed === 1.5, "audio.speed = 1.5 còn nguyên");
  assert(ac.reverse === true, "audio.reverse = true còn nguyên");

  const tc = revalidated.tracks[2].clips[0] as any;
  assert(tc.style.animation === "bounce", "text animation bounce còn nguyên");

  const sc = revalidated.tracks[3].clips[0] as any;
  assert(sc.kind === "sticker", "sticker kind còn nguyên");
  assert(sc.x === 0.8 && sc.rotation === 15, "sticker x/rotation còn nguyên");

  const ic = revalidated.tracks[4].clips[0] as any;
  assert(ic.kind === "image", "image kind còn nguyên");
  assert(ic.fit === "cover", "image fit=cover còn nguyên");
} catch (e) {
  failed++;
  console.log(`  ❌ Test 1 crash: ${e instanceof Error ? e.message : e}`);
}

// ---------------------------------------------------------------------------
// Test 2: Tất cả 13 transition types
// ---------------------------------------------------------------------------
console.log("\n[Test 2] 13 transition types đều validate được");
const allTransitions = [
  "none", "fade", "fadeblack", "fadewhite",
  "wipeleft", "wiperight", "wipeup", "wipedown",
  "slideleft", "slideright", "dissolve", "circleopen", "radial",
];
for (const t of allTransitions) {
  try {
    validateClipForTrack({
      kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
      in: 0, out: 2, transitionIn: { type: t, duration: t === "none" ? 0 : 0.5 },
    }, "video");
    assert(true, `transition "${t}" pass`);
  } catch (e) {
    assert(false, `transition "${t}" fail: ${e instanceof Error ? e.message : e}`);
  }
}

// ---------------------------------------------------------------------------
// Test 3: Tất cả 8 text animations
// ---------------------------------------------------------------------------
console.log("\n[Test 3] 8 text animations đều validate được");
const allAnims = ["none", "fadeUp", "fadeIn", "slideInLeft", "slideInRight", "slideUp", "bounce", "typewriter"];
for (const a of allAnims) {
  try {
    validateClipForTrack({
      kind: "text", id: "t1", text: "hi", start: 0, duration: 2,
      style: { fontFamily: "Arial", fontSize: 32, color: "#ffffff", animation: a },
    }, "text");
    assert(true, `animation "${a}" pass`);
  } catch (e) {
    assert(false, `animation "${a}" fail: ${e instanceof Error ? e.message : e}`);
  }
}

// ---------------------------------------------------------------------------
// Test 4: Tất cả 10 LUT + 7 effects
// ---------------------------------------------------------------------------
console.log("\n[Test 4] 10 LUT ids đều validate được");
const allLuts = [
  "cartcut-blockbuster", "cartcut-teal-orange", "cartcut-nordic-noir",
  "cartcut-honey", "cartcut-golden-hour", "cartcut-winter-blue",
  "cartcut-ocean", "cartcut-mono-neutral", "cartcut-faded-seventies",
  "cartcut-super-eight",
];
for (const lut of allLuts) {
  try {
    const c = validateClipForTrack({
      kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
      in: 0, out: 2, filter: { lut },
    }, "video") as any;
    assert(c.filter.lut === lut, `LUT "${lut}" pass`);
  } catch (e) {
    assert(false, `LUT "${lut}" fail`);
  }
}

console.log("\n[Test 5] 7 effect types đều validate được");
const allEffects = ["blur", "sharpen", "grayscale", "sepia", "vignette", "noise", "brightness"];
for (const ef of allEffects) {
  try {
    const c = validateClipForTrack({
      kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
      in: 0, out: 2, effects: [{ type: ef, intensity: 0.7 }],
    }, "video") as any;
    assert(c.effects[0].type === ef, `effect "${ef}" pass`);
  } catch (e) {
    assert(false, `effect "${ef}" fail`);
  }
}

// ---------------------------------------------------------------------------
// Test 6: Input sai bị từ chối
// ---------------------------------------------------------------------------
console.log("\n[Test 6] Input sai bị từ chối");
assertThrows(() => validateClipForTrack({
  kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
  in: 0, out: 2, speed: 10,
}, "video"), "speed=10 (> 4) bị từ chối");

assertThrows(() => validateClipForTrack({
  kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
  in: 0, out: 2, filter: { lut: "khong-ton-tai" },
}, "video"), "LUT không tồn tại bị từ chối");

assertThrows(() => validateClipForTrack({
  kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
  in: 0, out: 2, effects: [{ type: "glitch" }],
}, "video"), "effect không hỗ trợ bị từ chối");

assertThrows(() => validateClipForTrack({
  kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
  in: 0, out: 2, chromaKey: { color: "red" },
}, "video"), "chromaKey color sai format bị từ chối");

assertThrows(() => validateClipForTrack({
  kind: "sticker", id: "s1", src: "x.png", start: 0, duration: 2,
  x: 5,
}, "sticker"), "sticker x=5 (> 1) bị từ chối");

assertThrows(() => validateClipForTrack({
  kind: "video", id: "c1", src: "x.mp4", start: 0, duration: 2,
  in: 0, out: 2,
  animations: { x: { keyframes: [{ t: 99, v: 0.5, easing: "linear" }] } },
}, "video"), "keyframe t=99 (> duration) bị từ chối");

// ---------------------------------------------------------------------------
// Tổng kết
// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(50)}`);
console.log(`Kết quả: ${passed} pass, ${failed} fail`);
if (failed > 0) {
  console.log("❌ CÓ TEST FAIL");
  process.exit(1);
} else {
  console.log("🎉 TẤT CẢ PASS");
}
