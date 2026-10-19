/**
 * migrations.test.ts — Test cho schema migration (R1-019).
 *
 * Chạy bằng: npx tsc && node --test dist/migrations.test.js
 * (hoặc: npx tsx src/migrations.test.ts nếu có tsx)
 *
 * Test cases:
 * 1. migrate() với spec 0.1.0 hợp lệ → trả về 0.2.0, không mất data
 * 2. migrate() với spec 0.2.0 → giữ nguyên (không transform)
 * 3. migrate() từ chối version không hỗ trợ (quá cũ)
 * 4. migrate() từ chối version mới hơn app
 * 5. migrate() từ chối file không có version
 * 6. migrate() từ chối file 0.1.0 bị hỏng
 * 7. migrate010To020() không mutate input
 * 8. compareVersions() đúng
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  migrate,
  migrate010To020,
  compareVersions,
  readSchemaVersion,
  isSupportedVersion,
  MigrationError,
  SUPPORTED_VERSIONS,
  CURRENT_SCHEMA_VERSION,
} from "./migrations.js";

/** Tạo một spec 0.1.0 hợp lệ tối thiểu. */
function make010Spec() {
  return {
    version: "0.1.0",
    meta: { name: "Test 0.1.0", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "t1",
        kind: "video",
        clips: [
          {
            kind: "video",
            id: "c1",
            src: "clip1.mp4",
            start: 0,
            duration: 5,
            in: 0,
            out: 5,
            speed: 1,
          },
        ],
      },
      {
        id: "t2",
        kind: "text",
        clips: [
          {
            kind: "text",
            id: "c2",
            text: "Hello",
            start: 1,
            duration: 3,
            style: { fontFamily: "Arial", fontSize: 48, color: "#ffffff" },
          },
        ],
      },
    ],
  };
}

/** Tạo một spec 0.2.0 hợp lệ (có sticker, filter, effects). */
function make020Spec() {
  return {
    version: "0.2.0",
    meta: { name: "Test 0.2.0", width: 1920, height: 1080, fps: 30 },
    tracks: [
      {
        id: "t1",
        kind: "video",
        clips: [
          {
            kind: "video",
            id: "c1",
            src: "clip1.mp4",
            start: 0,
            duration: 5,
            in: 0,
            out: 5,
            filter: { lut: "cartcut-mono-neutral" },
            effects: [{ type: "vignette", intensity: 0.6 }],
          },
        ],
      },
      {
        id: "t3",
        kind: "sticker",
        clips: [
          {
            kind: "sticker",
            id: "s1",
            src: "star.png",
            start: 1,
            duration: 2,
            x: 0.5,
            y: 0.5,
            scale: 0.3,
          },
        ],
      },
    ],
  };
}

test("CURRENT_SCHEMA_VERSION là 0.2.0", () => {
  assert.equal(CURRENT_SCHEMA_VERSION, "0.2.0");
  assert.ok((SUPPORTED_VERSIONS as readonly string[]).includes("0.1.0"));
  assert.ok((SUPPORTED_VERSIONS as readonly string[]).includes("0.2.0"));
});

test("migrate() với spec 0.1.0 hợp lệ → 0.2.0, không mất data", () => {
  const old = make010Spec();
  const oldJson = JSON.stringify(old);

  const migrated = migrate(old);

  // Version đã bump
  assert.equal(migrated.version, "0.2.0");

  // Data không mất
  assert.equal(migrated.meta.name, "Test 0.1.0");
  assert.equal(migrated.meta.width, 1280);
  assert.equal(migrated.tracks.length, 2);
  assert.equal(migrated.tracks[0].clips[0].id, "c1");
  assert.equal((migrated.tracks[0].clips[0] as { src: string }).src, "clip1.mp4");
  assert.equal(migrated.tracks[1].clips[0].id, "c2");

  // Input không bị mutate (so sánh JSON)
  assert.equal(JSON.stringify(old), oldJson);
});

test("migrate() với spec 0.2.0 → giữ nguyên", () => {
  const spec = make020Spec();
  const result = migrate(spec);
  assert.equal(result.version, "0.2.0");
  // Sticker và filter/effects được giữ nguyên
  assert.equal(result.tracks[1].kind, "sticker");
  const videoClip = result.tracks[0].clips[0] as {
    filter?: { lut: string };
    effects?: Array<{ type: string }>;
  };
  assert.equal(videoClip.filter?.lut, "cartcut-mono-neutral");
  assert.equal(videoClip.effects?.[0].type, "vignette");
});

test("migrate() từ chối version quá cũ (0.0.5)", () => {
  const old = { ...make010Spec(), version: "0.0.5" };
  assert.throws(() => migrate(old), (e: unknown) => {
    const err = e as MigrationError;
    assert.ok(err instanceof MigrationError);
    assert.ok(err.message.includes("quá cũ"));
    assert.equal(err.fromVersion, "0.0.5");
    return true;
  });
});

test("migrate() từ chối version mới hơn app (9.9.9)", () => {
  const future = { ...make020Spec(), version: "9.9.9" };
  assert.throws(() => migrate(future), (e: unknown) => {
    const err = e as MigrationError;
    assert.ok(err instanceof MigrationError);
    assert.ok(err.message.includes("mới hơn app"));
    assert.equal(err.fromVersion, "9.9.9");
    return true;
  });
});

test("migrate() từ chối file không có version", () => {
  const noVersion = { meta: {}, tracks: [] };
  assert.throws(() => migrate(noVersion), (e: unknown) => {
    const err = e as MigrationError;
    assert.ok(err instanceof MigrationError);
    assert.ok(err.message.includes('không có trường "version"'));
    assert.equal(err.fromVersion, null);
    return true;
  });
});

test("migrate() từ chối file 0.1.0 bị hỏng (thiếu tracks)", () => {
  const broken = { version: "0.1.0", meta: { name: "x" } };
  assert.throws(() => migrate(broken), MigrationError);
});

test("migrate() từ chối file 0.2.0 bị hỏng (thiếu meta)", () => {
  const broken = { version: "0.2.0", tracks: [] };
  assert.throws(() => migrate(broken), MigrationError);
});

test("migrate010To020() không mutate input", () => {
  const old = make010Spec();
  const before = JSON.stringify(old);
  const migrated = migrate010To020(old as unknown as Record<string, unknown>);
  assert.equal(JSON.stringify(old), before);
  assert.equal(migrated.version, "0.2.0");
  assert.notEqual(migrated, old); // khác object
});

test("readSchemaVersion()", () => {
  assert.equal(readSchemaVersion({ version: "0.1.0" }), "0.1.0");
  assert.equal(readSchemaVersion({ version: "0.2.0" }), "0.2.0");
  assert.equal(readSchemaVersion({}), null);
  assert.equal(readSchemaVersion(null), null);
  assert.equal(readSchemaVersion("string"), null);
  assert.equal(readSchemaVersion({ version: 123 }), null);
});

test("isSupportedVersion()", () => {
  assert.ok(isSupportedVersion("0.1.0"));
  assert.ok(isSupportedVersion("0.2.0"));
  assert.ok(!isSupportedVersion("0.0.5"));
  assert.ok(!isSupportedVersion("9.9.9"));
  assert.ok(!isSupportedVersion(""));
});

test("compareVersions()", () => {
  assert.equal(compareVersions("0.1.0", "0.2.0"), -1);
  assert.equal(compareVersions("0.2.0", "0.1.0"), 1);
  assert.equal(compareVersions("0.2.0", "0.2.0"), 0);
  assert.equal(compareVersions("0.10.0", "0.9.0"), 1); // numeric, không phải string
  assert.equal(compareVersions("1.0.0", "0.99.99"), 1);
});

test("MigrationError có fromVersion và toVersion", () => {
  const err = new MigrationError("test", "0.1.0");
  assert.equal(err.name, "MigrationError");
  assert.equal(err.fromVersion, "0.1.0");
  assert.equal(err.toVersion, "0.2.0");
});
