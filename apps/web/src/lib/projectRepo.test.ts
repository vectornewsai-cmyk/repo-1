/**
 * projectRepo.test.ts — Test thật cho migrate motion ở cổng load project web
 * (Phase 9 đợt 12 T4).
 *
 * Nợ đợt 11 P6: migrateMotion đã có nhưng chỉ nối vào cổng load của render
 * (server/render/src/validate.js); đường load project trên web (projectRepo.ts)
 * chưa gọi migrate nên project cũ mở trên web vẫn mang motion lỗi thời.
 * Đợt này nối migrateProjectMotion vào parseProjectText — cổng chung của
 * loadProject (mở file) và loadAutosave (khôi phục autosave).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/projectRepo.test.ts
 *
 * Chỉ test logic thuần trong projectRepo.ts (không DOM/store).
 * Theo mẫu harness của clipboard.test.ts.
 */
import { migrateProjectMotion, parseProjectText, stableStringify } from "./projectRepo.ts";
import type { VideoSpec } from "@repo-1/video-spec";

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

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg} — nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

function eqJson(a: unknown, b: unknown, msg: string): void {
  eq(stableStringify(a), stableStringify(b), msg);
}

type Blur = { frames?: number; weights?: number[] };
type MotionLike = { motionBlur?: Blur };

/** Clip video mang motion cho trước (motion truyền thô, không qua type Clip). */
function videoClipWithMotion(id: string, motion: MotionLike): Record<string, unknown> {
  return {
    kind: "video", id, src: "a.mp4", start: 0, duration: 2, in: 0, out: 2,
    motion,
  };
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

/** Lấy motion của clip đầu tiên trong spec đã load. */
function firstMotion(res: { spec: VideoSpec | null }): MotionLike | undefined {
  const clip = res.spec?.tracks[0]?.clips[0] as { motion?: MotionLike } | undefined;
  return clip?.motion;
}

function hasMotionWarning(res: { warnings: string[] }): boolean {
  return res.warnings.some((w) => w.includes("motion"));
}

function main(): void {
  test("project cũ weights toàn 0 → weights đều [1,1,1], frames 3, có warning", () => {
    const res = parseProjectText(envelopeJson(specWithClips([
      videoClipWithMotion("c0", { motionBlur: { frames: 3, weights: [0, 0, 0] } }),
    ])));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eqJson(firstMotion(res)?.motionBlur, { frames: 3, weights: [1, 1, 1] }, "blur sau migrate");
    assert(hasMotionWarning(res), "phải có warning motion");
  });

  test("project cũ chỉ có weights [1,2,1] (thiếu frames) → frames 3, giữ weights", () => {
    const res = parseProjectText(envelopeJson(specWithClips([
      videoClipWithMotion("c0", { motionBlur: { weights: [1, 2, 1] } }),
    ])));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eqJson(firstMotion(res)?.motionBlur, { frames: 3, weights: [1, 2, 1] }, "blur sau migrate");
  });

  test("project cũ motionBlur rỗng {} → frames 3", () => {
    const res = parseProjectText(envelopeJson(specWithClips([
      videoClipWithMotion("c0", { motionBlur: {} }),
    ])));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eq(firstMotion(res)?.motionBlur?.frames, 3, "frames sau migrate");
    assert(hasMotionWarning(res), "phải có warning motion");
  });

  test("project cũ frames 2 lệch weights dài 3 → frames 3, giữ nguyên weights", () => {
    const res = parseProjectText(envelopeJson(specWithClips([
      videoClipWithMotion("c0", { motionBlur: { frames: 2, weights: [1, 2, 1] } }),
    ])));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eqJson(firstMotion(res)?.motionBlur, { frames: 3, weights: [1, 2, 1] }, "blur sau migrate");
  });

  test("project mới hợp lệ → spec không đổi một field nào, không warning motion", () => {
    const spec = specWithClips([
      videoClipWithMotion("c0", { motionBlur: { frames: 3, weights: [1, 2, 1] } }),
    ]);
    const res = parseProjectText(envelopeJson(spec));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eqJson(res.spec, spec, "spec trả về phải giống hệt spec đầu vào");
    assert(!hasMotionWarning(res), "không được có warning motion");
  });

  test("clip không có motion → không đổi, không warning motion", () => {
    const spec = specWithClips([
      { kind: "video", id: "c0", src: "a.mp4", start: 0, duration: 2, in: 0, out: 2 },
    ]);
    const res = parseProjectText(envelopeJson(spec));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eqJson(res.spec, spec, "spec trả về phải giống hệt spec đầu vào");
    assert(!hasMotionWarning(res), "không được có warning motion");
  });

  test("nhiều clip: chỉ clip cũ đổi, clip mới giữ nguyên", () => {
    const oldClip = videoClipWithMotion("c0", { motionBlur: { frames: 3, weights: [0, 0, 0] } });
    const newClip = videoClipWithMotion("c1", { motionBlur: { frames: 3, weights: [1, 2, 1] } });
    const res = parseProjectText(envelopeJson(specWithClips([oldClip, newClip])));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    const clips = res.spec?.tracks[0]?.clips as { motion?: MotionLike }[];
    eqJson(clips[0]?.motion?.motionBlur, { frames: 3, weights: [1, 1, 1] }, "clip cũ đã migrate");
    eqJson(clips[1]?.motion?.motionBlur, { frames: 3, weights: [1, 2, 1] }, "clip mới không đổi");
  });

  test("frames 9 (không cứu được) → web vẫn load, motion giữ nguyên (render sẽ bắt khi export)", () => {
    const res = parseProjectText(envelopeJson(specWithClips([
      videoClipWithMotion("c0", { motionBlur: { frames: 9, weights: [1, 1, 1] } }),
    ])));
    assert(res.ok, "web load không chặn motion ngoài [2, 8] (validate web không kiểm tra motion)");
    eqJson(firstMotion(res)?.motionBlur, { frames: 9, weights: [1, 1, 1] }, "motion không đổi");
    assert(!hasMotionWarning(res), "không được có warning migrate cho trường hợp không cứu");
  });

  test("spec trần (không envelope) mang motion cũ → vẫn migrate", () => {
    const res = parseProjectText(JSON.stringify(specWithClips([
      videoClipWithMotion("c0", { motionBlur: { frames: 3, weights: [0, 0, 0] } }),
    ])));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eqJson(firstMotion(res)?.motionBlur, { frames: 3, weights: [1, 1, 1] }, "blur sau migrate");
  });

  test("migrateProjectMotion trực tiếp: spec mới → đúng tham chiếu, spec cũ → không mutate đầu vào", () => {
    const fresh = specWithClips([
      videoClipWithMotion("c0", { motionBlur: { frames: 3, weights: [1, 2, 1] } }),
    ]) as unknown as VideoSpec;
    const rFresh = migrateProjectMotion(fresh);
    assert(rFresh.spec === fresh, "spec mới phải trả đúng tham chiếu gốc");
    eq(rFresh.warnings.length, 0, "spec mới không có warning");

    const legacy = specWithClips([
      videoClipWithMotion("c0", { motionBlur: { frames: 3, weights: [0, 0, 0] } }),
    ]) as unknown as VideoSpec;
    const before = JSON.stringify(legacy);
    const rLegacy = migrateProjectMotion(legacy);
    assert(rLegacy.spec !== legacy, "spec cũ phải trả object mới");
    eq(JSON.stringify(legacy), before, "spec đầu vào không được mutate");
    const clip = rLegacy.spec.tracks[0]?.clips[0] as { motion?: MotionLike };
    eqJson(clip?.motion?.motionBlur, { frames: 3, weights: [1, 1, 1] }, "blur sau migrate");
  });

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  if (fail > 0) {
    console.error("Failed:", failedNames.join(", "));
    process.exitCode = 1;
  }
}

main();
