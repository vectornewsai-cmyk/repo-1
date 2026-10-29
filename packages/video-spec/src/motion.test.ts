/**
 * motion.test.ts — Test cho spec motion (Phase 9 đợt 8, luồng S1).
 *
 * Phạm vi S1 (xem motion.ts và MOTION_SPEC_LIMITS.md cùng thư mục):
 *   - motion.ts export từ index.ts; VideoClip có field `motion?: ClipMotion`.
 *   - validateMotion() fail-fast (throw ở vi phạm đầu tiên): các case hợp
 *     lệ không throw, các case vi phạm đều throw.
 *   - resolveMotionBlur() resolve đúng mặc định (frames/weights).
 *   - Project cũ không có motion vẫn load bình thường + round-trip JSON
 *     không chèn field motion; project có motion round-trip nguyên vẹn.
 * KHÔNG thuộc phạm vi test này (không claim): wiring render.js (luồng S2,
 * server/render/src/motion.js chưa tồn tại), preview, panel UI S5, nhánh
 * ramp S3 (speedramp.js dùng shape tạm chờ khớp S2 — xem MOTION_SPEC_LIMITS.md).
 *
 * Chạy bằng (theo mẫu adjustment.test.ts):
 *   npx tsc packages/video-spec/src/index.ts \
 *     packages/video-spec/src/motion.test.ts \
 *     --outDir /tmp/motion-spec-test --module nodenext --target es2022 \
 *     --moduleResolution nodenext --skipLibCheck
 *   node --test /tmp/motion-spec-test/motion.test.js
 * (tsc biên dịch cả graph index.ts vì test import isVideoSpec runtime và
 * validateMotion qua index.js để chứng minh re-export; output nằm ở /tmp,
 * không ghi đè file .js trong repo.)
 *
 * Quy ước số: targetFps tính bằng frame/giây, cho phép thập phân
 * (vd 23.976); so sánh deepEqual dùng node:assert/strict.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MOTION_BLUR_DEFAULT_FRAMES,
  MOTION_BLUR_FRAMES_MAX,
  MOTION_BLUR_FRAMES_MIN,
  MOTION_TARGET_FPS_MAX,
  MOTION_TARGET_FPS_MIN,
  migrateMotion,
  resolveMotionBlur,
  validateMotion,
} from "./motion.js";
// Re-export qua index.js (chứng minh motion đã nối vào index):
import { validateMotion as validateMotionViaIndex } from "./index.js";
import { isVideoSpec, projectDuration, SPEC_VERSION } from "./index.js";
import type { ClipMotion, VideoClip, VideoSpec } from "./index.js";

// ---- fixture ----

function meta() {
  return { name: "spec", width: 1280, height: 720, fps: 30 };
}

function videoClip(id: string, start: number, duration: number): VideoClip {
  return {
    kind: "video",
    id,
    src: `${id}.mp4`,
    start,
    duration,
    in: 0,
    out: duration,
  };
}

function specOld(): VideoSpec {
  return {
    version: SPEC_VERSION,
    meta: meta(),
    tracks: [
      { id: "v1", kind: "video", clips: [videoClip("a", 0, 4)] },
    ],
  };
}

function specWithMotion(): VideoSpec {
  const clip = videoClip("a", 0, 4);
  clip.motion = {
    interpolation: "minterpolate",
    targetFps: 60,
    miMode: "blend",
    motionBlur: { frames: 4, weights: [1, 2, 3, 4] },
  };
  return {
    version: SPEC_VERSION,
    meta: meta(),
    tracks: [{ id: "v1", kind: "video", clips: [clip] }],
  };
}

// ---- A. case hợp lệ không throw ----

test("A1: motion vắng / rỗng / chỉ blur / chỉ none đều hợp lệ", () => {
  assert.doesNotThrow(() => validateMotion(undefined));
  assert.doesNotThrow(() => validateMotion({}));
  assert.doesNotThrow(() => validateMotion({ interpolation: "none" }));
  assert.doesNotThrow(() =>
    validateMotion({ motionBlur: { frames: 4 } })
  );
  assert.doesNotThrow(() =>
    validateMotion({ interpolation: "none", motionBlur: { frames: 2 } })
  );
});

test("A2: minterpolate đầy đủ + blur đủ dạng đều hợp lệ", () => {
  assert.doesNotThrow(() =>
    validateMotion({ interpolation: "minterpolate", targetFps: 60 })
  );
  assert.doesNotThrow(() =>
    validateMotion({ interpolation: "minterpolate", targetFps: 23.976, miMode: "blend" })
  );
  assert.doesNotThrow(() =>
    validateMotion({
      interpolation: "minterpolate",
      targetFps: 120,
      motionBlur: { weights: [1, 1, 1] },
    })
  );
  assert.doesNotThrow(() =>
    validateMotion({
      interpolation: "minterpolate",
      targetFps: 1,
      motionBlur: {},
    })
  );
});

test("A3: biên cho phép — targetFps 1 và 120, frames 2 và 8", () => {
  assert.doesNotThrow(() =>
    validateMotion({ interpolation: "minterpolate", targetFps: MOTION_TARGET_FPS_MIN })
  );
  assert.doesNotThrow(() =>
    validateMotion({ interpolation: "minterpolate", targetFps: MOTION_TARGET_FPS_MAX })
  );
  assert.doesNotThrow(() =>
    validateMotion({ motionBlur: { frames: MOTION_BLUR_FRAMES_MIN } })
  );
  assert.doesNotThrow(() =>
    validateMotion({ motionBlur: { frames: MOTION_BLUR_FRAMES_MAX } })
  );
});

test("A4: validateMotion re-export qua index.js dùng được", () => {
  assert.doesNotThrow(() =>
    validateMotionViaIndex({ interpolation: "minterpolate", targetFps: 30 })
  );
  assert.throws(() =>
    validateMotionViaIndex({ interpolation: "minterpolate" })
  );
});

// ---- B. fail-fast: mỗi case vi phạm đều throw ----

test("B1: motion không phải object → throw", () => {
  for (const bad of [null, "chuỗi", 42, [], true]) {
    assert.throws(() => validateMotion(bad), /motion phải là một object/);
  }
});

test("B2: key lạ trong motion / motionBlur → throw", () => {
  assert.throws(() => validateMotion({ dup: true }), /motion\.dup không được hỗ trợ/);
  assert.throws(
    () => validateMotion({ motionBlur: { frames: 3, strength: 0.5 } }),
    /motionBlur\.strength không được hỗ trợ/
  );
});

test("B3: interpolation lạ → throw", () => {
  assert.throws(() => validateMotion({ interpolation: "rife" }), /interpolation/);
  assert.throws(() => validateMotion({ interpolation: true }), /interpolation/);
});

test("B4: interpolation none (kể cả vắng) mà kèm targetFps/miMode → throw", () => {
  assert.throws(
    () => validateMotion({ interpolation: "none", targetFps: 30 }),
    /chỉ có nghĩa khi interpolation/
  );
  assert.throws(
    () => validateMotion({ interpolation: "none", miMode: "mci" }),
    /chỉ có nghĩa khi interpolation/
  );
  // Vắng interpolation cũng tính là "none" nên kèm targetFps là lỗi:
  assert.throws(() => validateMotion({ targetFps: 30 }), /chỉ có nghĩa khi interpolation/);
  assert.throws(() => validateMotion({ miMode: "blend" }), /chỉ có nghĩa khi interpolation/);
  // Nhưng none + blur vẫn hợp lệ (blur độc lập với nội suy):
  assert.doesNotThrow(() =>
    validateMotion({ interpolation: "none", motionBlur: { frames: 3 } })
  );
});

test("B5: minterpolate thiếu targetFps hoặc targetFps ngoài [1, 120] → throw", () => {
  assert.throws(
    () => validateMotion({ interpolation: "minterpolate" }),
    /targetFps là bắt buộc/
  );
  for (const bad of [0, 0.5, 121, 1000, NaN, Infinity, "60"]) {
    assert.throws(
      () => validateMotion({ interpolation: "minterpolate", targetFps: bad }),
      /targetFps phải là số trong/
    );
  }
});

test("B6: miMode lạ — kể cả dup (bị loại khỏi spec) → throw", () => {
  assert.throws(
    () =>
      validateMotion({ interpolation: "minterpolate", targetFps: 30, miMode: "dup" }),
    /miMode phải là "mci" hoặc "blend"/
  );
  assert.throws(
    () =>
      validateMotion({ interpolation: "minterpolate", targetFps: 30, miMode: "aobmc" }),
    /miMode/
  );
});

test("B7: motionBlur frames ngoài [2, 8] hoặc không nguyên → throw", () => {
  for (const bad of [1, 9, 16, 2.5, "4"]) {
    assert.throws(
      () => validateMotion({ motionBlur: { frames: bad } }),
      /frames phải là số nguyên/
    );
  }
});

test("B8: weights lệch frames / tổng <= 0 / phần tử không hữu hạn → throw", () => {
  assert.throws(
    () => validateMotion({ motionBlur: { frames: 4, weights: [1, 1, 1] } }),
    /cùng độ dài với frames/
  );
  assert.throws(
    () => validateMotion({ motionBlur: { frames: 3, weights: [0, 0, 0] } }),
    /tổng > 0/
  );
  assert.throws(
    () => validateMotion({ motionBlur: { frames: 3, weights: [1, -1, 0] } }),
    /tổng > 0/
  );
  assert.throws(
    () => validateMotion({ motionBlur: { weights: [1, NaN, 1] } }),
    /số hữu hạn/
  );
  assert.throws(
    () => validateMotion({ motionBlur: { weights: "123" } }),
    /phải là một mảng số/
  );
  // weights vắng frames: độ dài tự nó phải nằm trong 2..8:
  assert.throws(
    () => validateMotion({ motionBlur: { weights: [1] } }),
    /phải trong \[2, 8\]/
  );
  assert.throws(
    () => validateMotion({ motionBlur: { weights: [1, 1, 1, 1, 1, 1, 1, 1, 1] } }),
    /phải trong \[2, 8\]/
  );
});

test("B9: motion trên clip không phải video → throw (mọi kind khác)", () => {
  const m: ClipMotion = { interpolation: "minterpolate", targetFps: 60 };
  for (const kind of ["audio", "image", "text", "sticker"]) {
    assert.throws(() => validateMotion(m, kind), /chỉ dùng cho clip video/);
  }
  assert.doesNotThrow(() => validateMotion(m, "video"));
  // motionBlur riêng cũng không được gắn kind khác:
  assert.throws(
    () => validateMotion({ motionBlur: { frames: 3 } }, "image"),
    /chỉ dùng cho clip video/
  );
});

// ---- C. resolveMotionBlur ----

test("C1: resolveMotionBlur — vắng blur → undefined", () => {
  assert.equal(resolveMotionBlur(undefined), undefined);
  assert.equal(
    resolveMotionBlur({ interpolation: "minterpolate", targetFps: 60 }),
    undefined
  );
});

test("C2: resolveMotionBlur — mặc định frames 3 + weights đều", () => {
  const r = resolveMotionBlur({ motionBlur: {} });
  assert.ok(r);
  assert.equal(r.frames, MOTION_BLUR_DEFAULT_FRAMES);
  assert.deepEqual(r.weights, [1 / 3, 1 / 3, 1 / 3]);
});

test("C3: resolveMotionBlur — chỉ weights → frames = độ dài, chuẩn hoá tổng = 1", () => {
  const r = resolveMotionBlur({ motionBlur: { weights: [1, 2, 3] } });
  assert.ok(r);
  assert.equal(r.frames, 3);
  assert.ok(Math.abs(r.weights[0] - 1 / 6) < 1e-12);
  assert.ok(Math.abs(r.weights[1] - 2 / 6) < 1e-12);
  assert.ok(Math.abs(r.weights[2] - 3 / 6) < 1e-12);
});

test("C4: resolveMotionBlur — chỉ frames → weights đều", () => {
  const r = resolveMotionBlur({ motionBlur: { frames: 4 } });
  assert.ok(r);
  assert.equal(r.frames, 4);
  assert.deepEqual(r.weights, [0.25, 0.25, 0.25, 0.25]);
});

// ---- D. project cũ / round-trip ----

test("D1: project cũ không có motion vẫn hợp lệ, round-trip không chèn field", () => {
  const spec = specOld();
  assert.equal(isVideoSpec(spec), true);
  assert.equal((spec.tracks[0].clips[0] as VideoClip).motion, undefined);
  const parsed = JSON.parse(JSON.stringify(spec)) as VideoSpec;
  assert.equal(isVideoSpec(parsed), true);
  assert.equal("motion" in (parsed.tracks[0].clips[0] as unknown as Record<string, unknown>), false);
  assert.equal(projectDuration(parsed), 4);
});

test("D2: project có motion round-trip nguyên vẹn, validate lại vẫn pass", () => {
  const spec = specWithMotion();
  const parsed = JSON.parse(JSON.stringify(spec)) as VideoSpec;
  const clip = parsed.tracks[0].clips[0] as VideoClip;
  assert.deepEqual(clip.motion, {
    interpolation: "minterpolate",
    targetFps: 60,
    miMode: "blend",
    motionBlur: { frames: 4, weights: [1, 2, 3, 4] },
  });
  assert.doesNotThrow(() => validateMotion(clip.motion, clip.kind));
  assert.equal(projectDuration(parsed), 4);
});

// ---- E. đợt 11 P6: migrateMotion — cứu project cũ weights 0 / thiếu frames ----
// validateMotion KHÔNG đổi (B8 vẫn bắt weights toàn 0); migrate là bước
// riêng trước validate. Project mới hợp lệ phải giữ nguyên tham chiếu.

test("E1: project mới hợp lệ → giữ nguyên tham chiếu, migrated=false", () => {
  const fresh = { motionBlur: { frames: 3, weights: [1, 2, 3] } };
  const r = migrateMotion(fresh);
  assert.equal(r.migrated, false);
  assert.equal(r.motion, fresh);
  assert.deepEqual(r.notes, []);
  assert.equal(migrateMotion({ motionBlur: { frames: 4 } }).migrated, false);
  assert.equal(migrateMotion({}).migrated, false);
});

test("E2: weights toàn 0 → weights đều, input không mutate, kết quả validate pass", () => {
  const old = { motionBlur: { frames: 3, weights: [0, 0, 0] } };
  const r = migrateMotion(old);
  assert.equal(r.migrated, true);
  assert.deepEqual(r.motion, { motionBlur: { frames: 3, weights: [1, 1, 1] } });
  assert.deepEqual(old, { motionBlur: { frames: 3, weights: [0, 0, 0] } });
  assert.doesNotThrow(() => validateMotion(r.motion));
  assert.equal(r.notes.length, 1);
});

test("E3: chỉ có weights (thiếu frames) → frames = weights.length, validate pass", () => {
  const r = migrateMotion({ motionBlur: { weights: [1, 2, 3, 4] } });
  assert.equal(r.migrated, true);
  assert.deepEqual(r.motion, { motionBlur: { frames: 4, weights: [1, 2, 3, 4] } });
  assert.doesNotThrow(() => validateMotion(r.motion));
});

test("E4: motionBlur rỗng {} → frames = 3 mặc định, validate pass", () => {
  const r = migrateMotion({ motionBlur: {} });
  assert.equal(r.migrated, true);
  assert.deepEqual(r.motion, {
    motionBlur: { frames: MOTION_BLUR_DEFAULT_FRAMES, weights: undefined },
  });
  assert.doesNotThrow(() => validateMotion(r.motion));
});

test("E5: weights lẫn 0 / âm, frames lệch weights → đều + khớp frames", () => {
  const mixed = migrateMotion({ motionBlur: { frames: 3, weights: [1, 0, 1] } });
  assert.equal(mixed.migrated, true);
  assert.deepEqual(mixed.motion, { motionBlur: { frames: 3, weights: [1, 1, 1] } });
  assert.doesNotThrow(() => validateMotion(mixed.motion));
  const neg = migrateMotion({ motionBlur: { frames: 3, weights: [2, -1, 2] } });
  assert.equal(neg.migrated, true);
  assert.doesNotThrow(() => validateMotion(neg.motion));
  const skew = migrateMotion({ motionBlur: { frames: 4, weights: [1, 2, 3] } });
  assert.equal(skew.migrated, true);
  assert.deepEqual(skew.motion, { motionBlur: { frames: 3, weights: [1, 2, 3] } });
  assert.doesNotThrow(() => validateMotion(skew.motion));
});

test("E6: migrateMotion KHÔNG cứu lỗi không thuộc diện project cũ", () => {
  // frames ngoài [2, 8], weights không hữu hạn, key lạ, motion không object:
  // migrated=false và validate vẫn throw như cũ (không đoán mò).
  for (const bad of [
    { motionBlur: { frames: 9, weights: [1, 1, 1] } },
    { motionBlur: { frames: 3, weights: [1, NaN, 1] } },
    { motionBlur: { frames: 3, weights: [1] } },
    { motionBlur: { frames: 3, strength: 1 } },
  ]) {
    assert.equal(migrateMotion(bad).migrated, false);
    assert.throws(() => validateMotion(bad));
  }
  assert.equal(migrateMotion(undefined).migrated, false);
  assert.equal(migrateMotion(null).migrated, false);
  assert.equal(migrateMotion("chuỗi").migrated, false);
});

test("E7: project cũ gắn clip (weights 0) → migrate clip rồi validate pass", () => {
  const spec = specOld();
  const clip = spec.tracks[0].clips[0] as VideoClip;
  clip.motion = { motionBlur: { frames: 3, weights: [0, 0, 0] } };
  assert.throws(() => validateMotion(clip.motion, clip.kind));
  const r = migrateMotion(clip.motion);
  assert.equal(r.migrated, true);
  clip.motion = r.motion as ClipMotion;
  assert.doesNotThrow(() => validateMotion(clip.motion, clip.kind));
  assert.equal(isVideoSpec(spec), true);
});
