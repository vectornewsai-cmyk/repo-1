/**
 * nestedDemo.test.ts — Test thật cho project mẫu nested + adjustment (N6),
 * VIẾT LẠI ở đợt 6 (R6, cron 20:03 25/10).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/nestedDemo.test.ts
 *
 * Thay đổi ở đợt 6: test này KHÔNG còn test flatten tự viết nữa —
 * `flattenNestedDemo` đã bị xóa khỏi `../sample-nested.ts`. Flatten có
 * thẩm quyền duy nhất là `flattenSpecForRender` trong
 * `server/render/src/nested.js`, kiểm chứng ở test đầu-cuối
 * `server/render/src/test_nested_e2e.js` (flatten thật + render thật qua
 * render.js). Test web này chỉ kiểm tra: spec mẫu hợp lệ, và hàm chuyển
 * đổi `nestedDemoAsNestedSpec()` cho ra đúng shape đầu vào của flatten
 * thật (track + nested clip + subSpec + trim). Đây là test shape, không
 * phải test flatten — đừng đọc kết quả của nó thành "flatten đã đúng".
 * Theo mẫu harness của captionFollow.test.ts.
 */
import {
  NESTED_DEMO_SPEC,
  adjustmentAppliesAt,
  compoundDuration,
  nestedDemoAsNestedSpec,
  validateNestedDemo,
} from "../sample-nested.ts";
import type { NestedCompoundClip, NestedSpecClip } from "../sample-nested.ts";

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

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function findCompound(id: string): NestedCompoundClip {
  const walk = (clips: readonly unknown[]): NestedCompoundClip | undefined => {
    for (const c of clips) {
      const clip = c as { kind: string; id: string; children?: unknown[] };
      if (clip.kind === "compound" && clip.id === id) {
        return c as NestedCompoundClip;
      }
      if (clip.kind === "compound" && clip.children) {
        const found = walk(clip.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  const found = walk(NESTED_DEMO_SPEC.clips);
  if (!found) throw new Error(`không tìm thấy compound ${id}`);
  return found;
}

function nestedClipOf(spec: ReturnType<typeof nestedDemoAsNestedSpec>): NestedSpecClip {
  const c = spec.tracks[0]?.clips[0];
  if (!c) throw new Error("spec chuyển đổi không có clip ngoài");
  return c;
}

test("spec mẫu load được: tên, kích thước, fps, tổng thời lượng minh họa", () => {
  eq(NESTED_DEMO_SPEC.name, "nested-adjustment-demo");
  eq(NESTED_DEMO_SPEC.width, 640);
  eq(NESTED_DEMO_SPEC.height, 360);
  eq(NESTED_DEMO_SPEC.fps, 30);
  eq(NESTED_DEMO_SPEC.duration, 6);
});

test("spec mẫu hợp lệ: không lỗi validate (con không tràn, không chồng)", () => {
  eq(validateNestedDemo(NESTED_DEMO_SPEC), []);
});

test("nested duration tính đúng: outer 4s, inner 2s", () => {
  eq(compoundDuration(findCompound("compound-outer")), 4);
  eq(compoundDuration(findCompound("compound-inner")), 2);
});

test("adjustmentAppliesAt: trong 2→5 là true, ngoài khoảng là false", () => {
  eq(adjustmentAppliesAt(NESTED_DEMO_SPEC, 1.5), false);
  eq(adjustmentAppliesAt(NESTED_DEMO_SPEC, 2), true);
  eq(adjustmentAppliesAt(NESTED_DEMO_SPEC, 4.9), true);
  eq(adjustmentAppliesAt(NESTED_DEMO_SPEC, 5), false);
  eq(adjustmentAppliesAt(NESTED_DEMO_SPEC, 5.5), false);
});

test("chuyển đổi sang shape N2: clip ngoài kind nested, start 1, dur 4, trim 0→4", () => {
  const spec = nestedDemoAsNestedSpec();
  const outer = nestedClipOf(spec);
  eq(outer.kind, "nested");
  eq(outer.id, "compound-outer");
  eq(outer.start, 1);
  eq(outer.duration, 4);
  eq(outer.trim, { in: 0, out: 4 });
  if (!outer.subSpec) throw new Error("clip ngoài thiếu subSpec");
});

test("chuyển đổi sang shape N2: sub track có leaf-a (a.mp4, 0→2, in/out 0→2)", () => {
  const spec = nestedDemoAsNestedSpec();
  const sub = nestedClipOf(spec).subSpec;
  if (!sub) throw new Error("thiếu subSpec");
  eq(sub.tracks[0]?.id, "sub-v");
  const leafA = sub.tracks[0]?.clips[0];
  eq(leafA?.kind, "video");
  eq(leafA?.id, "leaf-a");
  eq(leafA?.src, "a.mp4");
  eq(leafA?.start, 0);
  eq(leafA?.duration, 2);
  eq(leafA?.in, 0);
  eq(leafA?.out, 2);
});

test("chuyển đổi sang shape N2: compound-inner (start 2, dur 2, trim 0→2) + 2 lá trong", () => {
  const spec = nestedDemoAsNestedSpec();
  const sub = nestedClipOf(spec).subSpec;
  if (!sub) throw new Error("thiếu subSpec");
  const inner = sub.tracks[0]?.clips[1];
  eq(inner?.kind, "nested");
  eq(inner?.id, "compound-inner");
  eq(inner?.start, 2);
  eq(inner?.duration, 2);
  eq(inner?.trim, { in: 0, out: 2 });
  const innerTracks = inner?.subSpec?.tracks[0]?.clips ?? [];
  eq(innerTracks.map((c) => c.id), ["leaf-b1", "leaf-b2"]);
  eq(innerTracks.map((c) => c.src), ["b.mp4", "c.mp4"]);
  eq(innerTracks.map((c) => c.start), [0, 1]);
  eq(innerTracks.map((c) => c.duration), [1, 1]);
});

test("chuyển đổi sang shape N2: cửa sổ ngoài kết thúc ở 5s (start 1 + dur 4)", () => {
  const spec = nestedDemoAsNestedSpec();
  const outer = nestedClipOf(spec);
  eq(outer.start + outer.duration, 5);
  // Render.js tính D bằng clip kết thúc muộn nhất nên MP4 E2E dài 5s,
  // không phải 6s minh họa của spec mẫu — test này khóa đúng con số đó.
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) {
  console.error(`Thua ở: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
