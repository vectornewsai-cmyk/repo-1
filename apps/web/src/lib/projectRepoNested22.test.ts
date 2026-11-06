/**
 * projectRepoNested22.test.ts — Test parent ở bước gộp Phase 9 đợt 22:
 * vá validateSpecDeep chấp nhận kind "nested" (phát hiện luồng F).
 *
 * Trước vá: project chứa nested clip bị validateSpecDeep từ chối
 * ("kind không hỗ trợ: nested") nên cổng load parseProjectText rơi về
 * project mẫu — autosave/file có nested không mở lại được.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, mẫu projectRepo.test.ts):
 *   node apps/web/src/lib/projectRepoNested22.test.ts
 */
import { parseProjectText, validateSpecDeep } from "./projectRepo.ts";

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

function videoClip(id: string, start = 0, duration = 2): Record<string, unknown> {
  return { kind: "video", id, src: "a.mp4", start, duration, in: 0, out: 2 };
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

test("nested hợp lệ → validateSpecDeep rỗng", () => {
  const inner = specWith([videoClip("leaf-a")]);
  const outer = specWith([nestedClip("n1", inner)]);
  assert(validateSpecDeep(outer).length === 0, `lỗi: ${JSON.stringify(validateSpecDeep(outer))}`);
});

test("nested 2 tầng → validateSpecDeep rỗng", () => {
  const inner2 = specWith([videoClip("leaf-b")]);
  const inner1 = specWith([nestedClip("n-inner", inner2)]);
  const outer = specWith([nestedClip("n-outer", inner1)]);
  assert(validateSpecDeep(outer).length === 0, `lỗi: ${JSON.stringify(validateSpecDeep(outer))}`);
});

test("nested thiếu subSpec → báo thiếu subSpec", () => {
  const bad = specWith([{ kind: "nested", id: "n1", start: 0, duration: 2 }]);
  const errs = validateSpecDeep(bad);
  assert(errs.some((e) => e.includes("thiếu subSpec")), `lỗi: ${JSON.stringify(errs)}`);
});

test("clip lá trong subSpec hỏng → lỗi ghi rõ qua subSpec", () => {
  const inner = specWith([{ kind: "video", id: "bad", start: 0, duration: 2, in: 0, out: 2 }]);
  const outer = specWith([nestedClip("n1", inner)]);
  const errs = validateSpecDeep(outer);
  assert(errs.some((e) => e.includes("subSpec") && e.includes("thiếu src")), `lỗi: ${JSON.stringify(errs)}`);
});

test("nested speed ngoài [0.25, 4] → báo lỗi", () => {
  const inner = specWith([videoClip("leaf-a")]);
  const outer = specWith([nestedClip("n1", inner, { speed: 9 })]);
  const errs = validateSpecDeep(outer);
  assert(errs.some((e) => e.includes("speed")), `lỗi: ${JSON.stringify(errs)}`);
});

test("subSpec tạo vòng lặp → báo vòng lặp, không treo", () => {
  const outer = specWith([]) as Record<string, unknown>;
  const inner = specWith([nestedClip("n-cycle", outer)]);
  (outer["tracks"] as Record<string, unknown>[])[0]["clips"] = [nestedClip("n1", inner)];
  const errs = validateSpecDeep(outer);
  assert(errs.some((e) => e.includes("vòng lặp")), `lỗi: ${JSON.stringify(errs)}`);
});

test("parseProjectText chấp nhận project có nested (cổng load thật)", () => {
  const inner = specWith([videoClip("leaf-a")]);
  const outer = specWith([nestedClip("n1", inner)]);
  const res = parseProjectText(JSON.stringify(outer));
  assert(res.ok === true, `load thất bại: ${JSON.stringify(res.errors)}`);
  assert(res.spec !== null, "spec null sau load");
});

console.log(`\nprojectRepoNested22: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
