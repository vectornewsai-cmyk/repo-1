/**
 * archiveNested32P4.test.ts — Test khóa đợt 32 luồng P4: collectMediaSrcs
 * đệ quy vào nested (đóng nợ §3.2 của LIMITS đợt 32 O4) + export/import
 * archive thật với media trong nested.
 *
 * CHẠY BẰNG esbuild bundle (không chạy trực tiếp bằng Node): archive.ts
 * import "./projectRepo" không đuôi nên Node type-stripping không resolve
 * được (đã chứng minh: "Cannot find module '.../lib/projectRepo'"), lỗi
 * có từ trước, không phải của đợt này. Bundle bằng code thật, không mock:
 *   cd ~/workspace/repo-1 && ./node_modules/.bin/esbuild \
 *     apps/web/src/lib/archiveNested32P4.test.ts --bundle --platform=node \
 *     --format=esm --outfile=/tmp/vcut-p4-archive-test.mjs && node /tmp/vcut-p4-archive-test.mjs
 * (outfile ở /tmp, ngoài repo, không stage.)
 *
 * Phạm vi test (toàn bộ qua code sản phẩm thật, JSZip thật):
 * - collectMediaSrcs: cấp cao + nested 1 cấp + 2 cấp; trùng tên chỉ tính
 *   1 lần (kể cả subSpec dùng chung ở 2 clip anh em); blob: bị loại;
 *   subSpec tự trỏ lại không treo; spec không có nested giữ nguyên hành vi cũ.
 * - exportArchive: nested thiếu file gốc → warnings chứa chuỗi thiếu media
 *   + structuredNotes có code archiveMissingExport (dịch được qua key O4,
 *   không thêm key mới); stats chỉ tính media có file gốc.
 * - exportArchive + importArchive vòng tròn: đủ file gốc cho cả nested →
 *   zip chứa media nested, import trả đủ mediaFiles (tên nested có mặt),
 *   không còn note thiếu media; export thiếu nested rồi import lại →
 *   import cảnh báo archiveMissingImport cho đúng tên nested.
 *
 * Không thêm key i18n mới: note thiếu media dùng lại 2 key archiveMissing*
 * của O4 (vi = en = 918, khóa bằng test parity ở structuredNotes32).
 * Không test render React / ProjectMenu (như mọi đợt trước).
 */
import { collectMediaSrcs, exportArchive, importArchive } from "./archive.ts";

declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      pass++;
      console.log(`  ✓ ${name}`);
    })
    .catch((e: unknown) => {
      fail++;
      failedNames.push(name);
      console.error(`  ✗ ${name}: ${(e as Error).message}`);
    });
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq(a: unknown, b: unknown, msg: string): void {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg} — nhận: ${JSON.stringify(a)}, muốn: ${JSON.stringify(b)}`);
  }
}

type AnyRec = Record<string, unknown>;

function videoClip(id: string, src: string): AnyRec {
  return { kind: "video", id, src, start: 0, duration: 10, in: 0, out: 10 };
}

function specOf(tracks: AnyRec[]): AnyRec {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}

function track(id: string, clips: AnyRec[]): AnyRec {
  return { id, kind: "video", clips };
}

function nested(id: string, subSpec: AnyRec): AnyRec {
  return { kind: "nested", id, start: 0, duration: 10, subSpec };
}

function blobData(text: string): Blob {
  return new Blob([text], { type: "video/mp4" });
}

const tests: [string, () => void | Promise<void>][] = [
  ["collect: cấp cao + nested 1 cấp + 2 cấp, đúng thứ tự pre-order", () => {
    const inner = specOf([track("deep", [videoClip("d1", "deep.mp4")])]);
    const spec = specOf([
      track("v0", [
        videoClip("top", "top.mp4"),
        nested("n1", specOf([track("mid", [
          nested("n2", inner),
          videoClip("mid1", "mid.mp4"),
        ])])),
      ]),
    ]);
    eq(collectMediaSrcs(spec as never), ["top.mp4", "deep.mp4", "mid.mp4"], "thứ tự pre-order sai");
  }],

  ["collect: trùng tên chỉ tính 1 lần, kể cả subSpec dùng chung 2 clip anh em", () => {
    const shared = specOf([track("in", [videoClip("s", "shared.mp4")])]);
    const spec = specOf([
      track("v0", [
        videoClip("top", "shared.mp4"),
        nested("nA", shared),
        nested("nB", shared),
      ]),
    ]);
    eq(collectMediaSrcs(spec as never), ["shared.mp4"], "trùng tên phải dedupe");
  }],

  ["collect: blob: trong nested vẫn loại, subSpec vòng lặp không treo", () => {
    const cyclic = specOf([track("v0", [])]) as AnyRec;
    const loopClip = nested("loop", cyclic);
    (cyclic["tracks"] as AnyRec[])[0]["clips"] = [
      videoClip("b", "blob:abc"),
      videoClip("ok", "ok.mp4"),
      loopClip,
    ];
    eq(collectMediaSrcs(cyclic as never), ["ok.mp4"], "phải loại blob: và không treo với cycle");
  }],

  ["collect: spec chỉ cấp cao giữ nguyên hành vi cũ", () => {
    const spec = specOf([track("v0", [videoClip("a", "a.mp4"), videoClip("b", "b.mp4")])]);
    eq(collectMediaSrcs(spec as never), ["a.mp4", "b.mp4"], "hành vi cấp cao không được đổi");
  }],

  ["export: nested thiếu file gốc → note archiveMissingExport + stats chỉ tính media có gốc", async () => {
    const spec = specOf([
      track("v0", [
        videoClip("top", "top.mp4"),
        nested("n1", specOf([track("in", [videoClip("inner", "inner.mp4")])])),
      ]),
    ]);
    const res = await exportArchive(spec as never, "Test", [
      { name: "top.mp4", data: blobData("TOP") },
    ]);
    assert(res.ok, `export phải ok: ${res.errors.join("; ")}`);
    eq(res.stats.mediaFiles, 1, "stats chỉ tính media có file gốc");
    const note = (res.structuredNotes ?? []).find((n) => n.code === "archiveMissingExport");
    assert(note, `thiếu note archiveMissingExport: ${JSON.stringify(res.structuredNotes)}`);
    eq(note.params.count, "1", "count note sai");
    assert(note.params.shown.includes("inner.mp4"), `shown phải chứa inner.mp4: ${note.params.shown}`);
    assert(res.warnings.includes(note.fallback), "fallback note phải có trong warnings chuỗi");
    assert(res.blob !== undefined, "export ok phải có blob zip");
  }],

  ["vòng tròn export→import: đủ gốc cả nested → import đủ media, không note thiếu", async () => {
    const spec = specOf([
      track("v0", [
        videoClip("top", "top.mp4"),
        nested("n1", specOf([track("in", [videoClip("inner", "inner.mp4")])])),
      ]),
    ]);
    const exp = await exportArchive(spec as never, "Test", [
      { name: "top.mp4", data: blobData("TOP") },
      { name: "inner.mp4", data: blobData("INNER") },
    ]);
    assert(exp.ok && exp.blob, `export phải ok: ${exp.errors.join("; ")}`);
    eq(exp.stats.mediaFiles, 2, "stats phải tính cả media nested khi đủ gốc");
    const imp = await importArchive(exp.blob);
    assert(imp.ok, `import phải ok: ${imp.errors.join("; ")}`);
    eq(imp.mediaFiles.map((f) => f.name).sort(), ["inner.mp4", "top.mp4"], "import phải trả đủ media nested");
    assert(!(imp.structuredNotes ?? []).some((n) => n.code === "archiveMissingImport"), "đủ media thì không được có note thiếu");
  }],

  ["vòng tròn export thiếu nested → import cảnh báo archiveMissingImport đúng tên nested", async () => {
    const spec = specOf([
      track("v0", [
        videoClip("top", "top.mp4"),
        nested("n1", specOf([track("in", [videoClip("inner", "inner.mp4")])])),
      ]),
    ]);
    const exp = await exportArchive(spec as never, "Test", [
      { name: "top.mp4", data: blobData("TOP") },
    ]);
    assert(exp.ok && exp.blob, `export phải ok: ${exp.errors.join("; ")}`);
    const imp = await importArchive(exp.blob);
    assert(imp.ok, `import phải ok dù thiếu media: ${imp.errors.join("; ")}`);
    const note = (imp.structuredNotes ?? []).find((n) => n.code === "archiveMissingImport");
    assert(note, `thiếu note archiveMissingImport: ${JSON.stringify(imp.structuredNotes)}`);
    assert(note.params.shown.includes("inner.mp4"), `shown phải chứa inner.mp4: ${note.params.shown}`);
    eq(imp.mediaFiles.map((f) => f.name), ["top.mp4"], "import chỉ trả media có trong zip");
  }],
];

for (const [name, fn] of tests) {
  await test(name, fn);
}

console.log(`\narchiveNested32P4: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
