/**
 * loadProject54K1.test.ts — Test thật cho fix bug loadProject đợt 53 J3 §4.2
 * (Phase 9 đợt 54, luồng K1).
 *
 * Bug: file `.vcut` bare-spec (video-spec trần, chỉ có `meta.name`, không có
 * envelope `name`) load xong nhưng tên project kẹt ở "Dự án không tên" vì
 * `parseProjectText` chỉ đọc `data.name` ở nhánh envelope. Fixture H9
 * (make-fixture.mjs: `meta.name = "H9 Doubleclick"`) là ví dụ thật — M7/D2b
 * đợt 53 fail đúng chữ ký này (currentPath đúng, tên sai).
 *
 * Fix: nhánh bare-spec trong `parseProjectText` (projectRepo.ts) nay đọc
 * `spec.meta.name` khi là chuỗi khác rỗng; thiếu/rỗng thì giữ fallback cũ.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/loadProject54K1.test.ts
 *
 * Chỉ test logic thuần trong projectRepo.ts (không DOM/store).
 * Theo mẫu harness của projectRepo.test.ts.
 */
import { loadProject, parseProjectText } from "./projectRepo.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
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

/** Spec trần tối thiểu hợp lệ, cùng cấu trúc fixture H9 (version 0.2.0). */
function bareSpec(name: string): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1", kind: "video", label: "Video 1",
        clips: [
          { kind: "video", id: "c-h9-1", src: "mau-1.webm", start: 0, duration: 4, in: 0, out: 4 },
          { kind: "video", id: "c-h9-2", src: "mau-2.webm", start: 4, duration: 4, in: 0, out: 4 },
        ],
      },
      {
        id: "t1", kind: "text", label: "Chữ 1",
        clips: [
          {
            kind: "text", id: "c-h9-3", text: "Xin chào! Đây là VCut Studio", start: 0.5, duration: 5,
            style: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 72, color: "#ffffff", bold: true, x: 0.5, y: 0.32, animation: "fadeUp" },
          },
        ],
      },
    ],
  };
}

function envelopeJson(spec: Record<string, unknown>, name?: string): string {
  const env: Record<string, unknown> = {
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion: "0.2.0",
    savedAt: "2026-11-07T00:00:00.000Z",
    spec,
  };
  if (name !== undefined) env.name = name;
  return JSON.stringify(env);
}

async function main(): Promise<void> {
  await test("bare-spec có meta.name 'H9 Doubleclick' → tên đúng (bug đợt 53 J3)", () => {
    const res = parseProjectText(JSON.stringify(bareSpec("H9 Doubleclick")));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eq(res.name, "H9 Doubleclick", "tên project");
    eq(res.spec?.meta.name, "H9 Doubleclick", "spec.meta.name giữ nguyên");
    assert(res.warnings.some((w) => w.includes("không có envelope")), "phải có warning legacyEnvelope");
  });

  await test("loadProject(File bare-spec) → tên đúng (đúng hàm desktop/web dùng)", async () => {
    const file = new File(
      [JSON.stringify(bareSpec("H9 Second"))],
      "H9-SecondInstance.vcut",
      { type: "application/json" },
    );
    const res = await loadProject(file);
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eq(res.name, "H9 Second", "tên project qua loadProject");
  });

  await test("bare-spec meta.name rỗng → load fail ở validate, không trả tên rác", () => {
    const res = parseProjectText(JSON.stringify(bareSpec("   ")));
    assert(!res.ok, "spec meta.name rỗng phải fail validate");
    eq(res.name, "", "fail result không mang tên mặc định");
    assert(res.errors.some((e) => e.includes("meta.name")), "lỗi phải nêu meta.name");
  });

  await test("bare-spec thiếu meta.name → load fail ở validate", () => {
    const spec = bareSpec("x");
    delete (spec.meta as Record<string, unknown>).name;
    const res = parseProjectText(JSON.stringify(spec));
    assert(!res.ok, "spec thiếu meta.name phải fail validate");
  });

  await test("envelope không có name → fallback cũ 'Dự án không tên' (không đổi)", () => {
    const res = parseProjectText(envelopeJson(bareSpec("Tên trong spec")));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eq(res.name, "Dự án không tên", "envelope thiếu name giữ fallback cũ");
  });

  await test("envelope có name → envelope name thắng meta.name (project chuẩn không đổi)", () => {
    const res = parseProjectText(envelopeJson(bareSpec("Tên trong spec"), "Đã đổi tên"));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eq(res.name, "Đã đổi tên", "envelope name được ưu tiên");
  });

  await test("bare-spec version 0.1.0 → migrate xong vẫn giữ meta.name", () => {
    const spec = bareSpec("Project cũ 0.1.0");
    spec.version = "0.1.0";
    const res = parseProjectText(JSON.stringify(spec));
    assert(res.ok, `load phải ok, lỗi: ${res.errors.join("; ")}`);
    eq(res.name, "Project cũ 0.1.0", "tên giữ sau migrate 0.1.0 → 0.2.0");
    eq(res.spec?.version, "0.2.0", "version đã migrate");
  });

  console.log(`\nloadProject54K1: ${pass} pass, ${fail} fail`);
  if (fail > 0) {
    console.error(`FAIL: ${failedNames.join(", ")}`);
    process.exitCode = 1;
  }
}

void main();
