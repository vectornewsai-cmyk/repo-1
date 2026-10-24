/**
 * syncProtocol.test.ts — Test thật cho SHA-256 + sync manifest (Phase 8 Q7).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/syncProtocol.test.ts
 */
import { buildManifest, decideSync, sha256Hex, verifyManifest } from "./syncProtocol.ts";

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

test("SHA-256 vector rỗng", () => {
  eq(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("SHA-256 vector 'abc'", () => {
  eq(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("SHA-256 chuỗi dài 1MB 'a' (nhiều block)", () => {
  // Giá trị chuẩn của SHA-256("a" × 1_000_000).
  eq(sha256Hex("a".repeat(1_000_000)), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
});

test("SHA-256 chuỗi UTF-8 có dấu", () => {
  // Giá trị chuẩn tính bằng Python hashlib (không dùng code đang test).
  eq(sha256Hex("Xin chào VCut — tiếng Việt"), "236b3924dd74a0cb37ea327a3e2098189cd5afba8b2d8f9c4270b3dd96c9d169");
});

test("buildManifest + verifyManifest: bundle nguyên vẹn", () => {
  const m = buildManifest({
    projectId: "p1", baseVersionId: "", versionId: "v1", specHash: "deadbeef",
    files: [{ path: "spec.json", content: '{"a":1}' }, { path: "media/a.mp4", content: "FAKE" }],
  });
  eq(m.files.map((f) => f.path), ["media/a.mp4", "spec.json"]); // sắp xếp theo path
  eq(verifyManifest(m, [
    { path: "spec.json", content: '{"a":1}' },
    { path: "media/a.mp4", content: "FAKE" },
  ]), []);
});

test("verifyManifest phát hiện nội dung bị sửa", () => {
  const m = buildManifest({
    projectId: "p1", baseVersionId: "", versionId: "v1", specHash: "x",
    files: [{ path: "spec.json", content: '{"a":1}' }],
  });
  const errs = verifyManifest(m, [{ path: "spec.json", content: '{"a":2}' }]);
  if (!errs.some((e) => e.includes("checksum"))) throw new Error("không phát hiện sai checksum: " + errs.join(";"));
});

test("verifyManifest phát hiện thiếu file và file thừa", () => {
  const m = buildManifest({
    projectId: "p1", baseVersionId: "", versionId: "v1", specHash: "x",
    files: [{ path: "spec.json", content: "{}" }, { path: "media/a.mp4", content: "F" }],
  });
  const errs = verifyManifest(m, [{ path: "spec.json", content: "{}" }, { path: "media/b.mp4", content: "F" }]);
  if (!errs.some((e) => e.includes("Thiếu file"))) throw new Error("không phát hiện thiếu file");
  if (!errs.some((e) => e.includes("thừa"))) throw new Error("không phát hiện file thừa");
});

test("buildManifest từ chối path traversal và trùng path", () => {
  let threw = 0;
  try { buildManifest({ projectId: "p", baseVersionId: "", versionId: "v", specHash: "x", files: [{ path: "../etc/passwd", content: "" }] }); } catch { threw++; }
  try { buildManifest({ projectId: "p", baseVersionId: "", versionId: "v", specHash: "x", files: [{ path: "a", content: "1" }, { path: "a", content: "2" }] }); } catch { threw++; }
  eq(threw, 2);
});

test("decideSync: trùng base thì nhận, khác base thì conflict", () => {
  eq(decideSync("v3", "v3"), "accept");
  eq(decideSync("v2", "v3"), "conflict");
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) {
  console.error(`Thua ở: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
