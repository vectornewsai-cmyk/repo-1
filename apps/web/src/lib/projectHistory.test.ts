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
  migrateHistorySpec,
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

function spec(name: string, clips: Array<{ id: string; start: number; duration: number; src?: string; motion?: unknown }>): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: clips.map((c) => ({
        id: c.id, kind: "video", src: c.src ?? "a.mp4", start: c.start,
        duration: c.duration, in: 0, out: c.duration,
        ...(c.motion !== undefined ? { motion: c.motion } : {}),
      })),
    }],
  } as unknown as VideoSpec;
}

function blurOf(s: VideoSpec, clipId: string): unknown {
  for (const t of s.tracks) {
    for (const c of t.clips as Array<Record<string, unknown>>) {
      if (c.id === clipId) return (c.motion as Record<string, unknown> | undefined)?.motionBlur;
    }
  }
  throw new Error(`không thấy clip ${clipId}`);
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
  // Phase 9 đợt 13 C4: restoreVersion phải migrate snapshot cũ (đợt 12 T4 chỉ
  // nối cổng mở file/autosave, snapshot IndexedDB vẫn bypass).
  ["restoreVersion: migrate weights 0 → weights đều, frames khớp", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const old = spec("P", [{ id: "c1", start: 0, duration: 5,
      motion: { motionBlur: { weights: [0, 0, 0] } } }]);
    const v = await store.saveVersion("p", old);
    const back = await store.restoreVersion(v!.id);
    const blur = blurOf(back!, "c1") as Record<string, unknown>;
    eq(blur.frames, 3);
    eq(blur.weights, [1, 1, 1]);
  }],
  ["restoreVersion: migrate blur {} và frames thiếu trong cùng snapshot", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const old = spec("P", [
      { id: "c1", start: 0, duration: 5, motion: { motionBlur: {} } },
      { id: "c2", start: 5, duration: 5, motion: { motionBlur: { weights: [1, 2] } } },
    ]);
    const v = await store.saveVersion("p", old);
    const back = await store.restoreVersion(v!.id);
    eq((blurOf(back!, "c1") as Record<string, unknown>).frames, 3);
    const blur2 = blurOf(back!, "c2") as Record<string, unknown>;
    eq(blur2.frames, 2);
    eq(blur2.weights, [1, 2]);
  }],
  ["restoreVersion: KHÔNG ghi đè snapshot gốc, khôi phục lại vẫn migrate từ gốc", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const old = spec("P", [{ id: "c1", start: 0, duration: 5,
      motion: { motionBlur: { weights: [0, 0, 0] } } }]);
    const v = await store.saveVersion("p", old);
    const back1 = await store.restoreVersion(v!.id);
    // Sửa spec trả về cũng không được chạm tới snapshot đã lưu.
    (back1!.tracks[0].clips[0] as unknown as Record<string, unknown>).motion = { motionBlur: { frames: 8, weights: [1, 1, 1, 1, 1, 1, 1, 1] } };
    const stored = await store.listVersions("p");
    eq(stored.length, 1);
    eq(blurOf(stored[0].spec, "c1"), { weights: [0, 0, 0] });
    eq(stored[0].hash, v!.hash);
    const back2 = await store.restoreVersion(v!.id);
    const blurBack2 = blurOf(back2!, "c1") as Record<string, unknown>;
    eq(blurBack2.frames, 3);
    eq(blurBack2.weights, [1, 1, 1]);
  }],
  ["restoreVersion: motion mới hợp lệ không đổi", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const s = spec("P", [{ id: "c1", start: 0, duration: 5,
      motion: { motionBlur: { frames: 3, weights: [1, 2, 1] } } }]);
    const v = await store.saveVersion("p", s);
    const blur = blurOf((await store.restoreVersion(v!.id))!, "c1") as Record<string, unknown>;
    eq(blur.frames, 3);
    eq(blur.weights, [1, 2, 1]);
  }],
  ["migrateHistorySpec: không cần migrate → trả đúng tham chiếu gốc", () => {
    const s = spec("P", [{ id: "c1", start: 0, duration: 5 }]);
    const out = migrateHistorySpec(s);
    if (out.spec !== s || out.migrated !== false) throw new Error("spec không motion phải giữ nguyên tham chiếu");
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
