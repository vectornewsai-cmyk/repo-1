/**
 * projectHistory.test.ts — Test thật cho lịch sử phiên bản (Phase 8 Q7).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/projectHistory.test.ts
 *
 * Chỉ test logic thuần + MemoryBackend (IndexedDB thật chỉ chạy trên trình
 * duyệt — xem Q7_LIMITS.md).
 */
import {
  HistoryStore,
  MemoryBackend,
  summarizeDiff,
} from "./projectHistory.ts";
import type { VideoSpec } from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void | Promise<void>): void {
  Promise.resolve()
    .then(fn)
    .then(() => { pass++; console.log(`  ✓ ${name}`); })
    .catch((e) => { fail++; failedNames.push(name); console.error(`  ✗ ${name}: ${(e as Error).message}`); })
    .finally(checkDone);
}

let pending = 0;
function checkDone(): void {
  pending--;
  if (pending === 0) finish();
}

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function spec(name: string, clips: Array<{ id: string; start: number; duration: number; src?: string }>): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: clips.map((c) => ({
        id: c.id, kind: "video", src: c.src ?? "a.mp4", start: c.start,
        duration: c.duration, in: 0, out: c.duration,
      })),
    }],
  } as unknown as VideoSpec;
}

const tests: Array<[string, () => void | Promise<void>]> = [
  ["summarizeDiff: version đầu tiên", () => {
    eq(summarizeDiff(null, spec("P", [])), ["Phiên bản đầu tiên của project."]);
  }],
  ["summarizeDiff: thêm/xoá/di chuyển/cắt clip + đổi tên", () => {
    const old = spec("Cũ", [
      { id: "c1", start: 0, duration: 5 },
      { id: "c2", start: 5, duration: 5 },
      { id: "c3", start: 10, duration: 5 },
    ]);
    const next = spec("Mới", [
      { id: "c1", start: 2, duration: 4 }, // vừa move vừa trim
      { id: "c2", start: 5, duration: 5 },
      { id: "c4", start: 6, duration: 3 }, // thêm
    ]);
    const s = summarizeDiff(old, next);
    for (const want of ["Đổi tên", "Thêm 1 clip", "Xoá 1 clip", "Di chuyển 1 clip", "Cắt/xén 1 clip"]) {
      if (!s.some((line) => line.includes(want))) throw new Error(`thiếu dòng "${want}" trong ${JSON.stringify(s)}`);
    }
  }],
  ["summarizeDiff: không đổi → 1 dòng", () => {
    const s = summarizeDiff(spec("P", [{ id: "c1", start: 0, duration: 5 }]), spec("P", [{ id: "c1", start: 0, duration: 5 }]));
    eq(s.length, 1);
  }],
  ["saveVersion: bỏ qua snapshot trùng hash", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const v1 = await store.saveVersion("p", spec("P", [{ id: "c1", start: 0, duration: 5 }]));
    const v2 = await store.saveVersion("p", spec("P", [{ id: "c1", start: 0, duration: 5 }]));
    if (!v1 || v2 !== null) throw new Error("phải lưu v1 và bỏ qua v2 trùng");
    eq((await store.listVersions("p")).length, 1);
  }],
  ["saveVersion: parentId + summary nối chuỗi", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const v1 = await store.saveVersion("p", spec("P", []));
    const v2 = await store.saveVersion("p", spec("P", [{ id: "c1", start: 0, duration: 5 }]), "thêm intro");
    if (!v1 || !v2) throw new Error("thiếu version");
    eq(v2.parentId, v1.id);
    eq(v2.label, "thêm intro");
    if (!v2.summary.some((l) => l.includes("Thêm 1 clip"))) throw new Error("summary sai: " + v2.summary.join(";"));
  }],
  ["restoreVersion: trả đúng spec, không trả tham chiếu sống", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const v = await store.saveVersion("p", spec("P", [{ id: "c1", start: 0, duration: 5 }]));
    const back = await store.restoreVersion(v!.id);
    eq((back as unknown as { meta: { name: string } }).meta.name, "P");
    eq(await store.restoreVersion("không-tồn-tại"), null);
  }],
  ["prune: giữ đúng N version mới nhất", async () => {
    const store = new HistoryStore(new MemoryBackend());
    for (let i = 0; i < 5; i++) {
      await store.saveVersion("p", spec("P", [{ id: "c1", start: 0, duration: 5 + i }]));
    }
    eq(await store.prune("p", 2), 3);
    eq((await store.listVersions("p")).length, 2);
  }],
  ["export/import: round-trip + không ghi đè version đã có", async () => {
    const a = new HistoryStore(new MemoryBackend());
    await a.saveVersion("p", spec("P", []));
    await a.saveVersion("p", spec("P", [{ id: "c1", start: 0, duration: 5 }]));
    const exp = a.exportHistory("p", await a.listVersions("p"));
    eq(exp.format, "vcut-history");
    const b = new HistoryStore(new MemoryBackend());
    eq(await b.importHistory(exp), 2);
    eq(await b.importHistory(exp), 0); // nhập lại không trùng
    eq((await b.listVersions("p")).length, 2);
  }],
  ["validateImport: từ chối file sai format và version sai hash", async () => {
    const store = new HistoryStore(new MemoryBackend());
    let threw = 0;
    try { await store.importHistory({ format: "khác", formatVersion: 1, projectId: "p", versions: [] }); } catch { threw++; }
    const bad = {
      format: "vcut-history", formatVersion: 1, projectId: "p", exportedAt: "",
      versions: [{ id: "x", projectId: "p", createdAt: 0, createdAtIso: "", label: "", hash: "00000000", parentId: "", summary: [], spec: spec("P", []) }],
    };
    try { await store.importHistory(bad); } catch { threw++; }
    eq(threw, 2);
    eq((await store.listVersions("p")).length, 0); // không ghi gì khi lỗi
  }],
  ["listVersions: tách riêng theo projectId, sắp xếp theo thời gian", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion("pb", spec("B", []));
    await store.saveVersion("pa", spec("A", []));
    await store.saveVersion("pa", spec("A", [{ id: "c1", start: 0, duration: 2 }]));
    const list = await store.listVersions("pa");
    eq(list.length, 2);
    if (list[0].createdAt > list[1].createdAt) throw new Error("chưa sắp xếp tăng dần");
  }],
];

pending = tests.length;
for (const [name, fn] of tests) test(name, fn);

function finish(): void {
  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  if (fail > 0) {
    console.error(`Thua ở: ${failedNames.join(", ")}`);
    process.exitCode = 1;
  }
}
