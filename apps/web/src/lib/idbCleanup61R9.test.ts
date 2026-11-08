/**
 * idbCleanup61R9.test.ts — Test thật cho UI dọn kho + refCount
 * (Phase 9 đợt 61, luồng R9 — đóng nợ đợt 60 §5.9 = LIMITS 60 Q7 §5.1 + §5.5).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/idbCleanup61R9.test.ts
 *
 * Dùng Web Crypto thật (SHA-256) và AssetStore thật; chỉ IndexedDB là
 * fake in-memory (FakeIDBFactory, copy gọn mẫu assetStore.test.ts).
 *
 * ĐỎ-TRƯỚC / XANH-SAU cho (b): trước khi sửa, `remove()` xóa bytes dù
 * clip còn tham chiếu (refCount luôn 0, không ai duy trì) — đã tái hiện
 * bằng script /tmp/red-before-61r9.mjs trên code cũ: remove() trả true,
 * getBlob null dù spec có clip src `asset:<id>`. Test D1 dưới đây là
 * xanh-sau của đúng kịch bản đó: sau sync, remove() trả false khi còn
 * clip, và chỉ trả true sau khi clip đã rời spec + sync lại.
 *
 * NỘI DUNG:
 *  A. computeRefCounts thuần: bin item, clip asset:, clip tên thô
 *     (originalName/alias), nested, trùng tên 2 manifest, rỗng.
 *  B. setRefCount: ghi đè, clamp âm về 0, asset lạ → null.
 *  C. syncAssetRefCounts: clip/bin tăng, rời spec/bin giảm, lũy tiến 0, idempotent.
 *  D. Cổng remove() qua refCount (đỏ-trước → xanh-sau) + releaseRef không âm.
 *  E. scanStorageForCleanup: hàng mồ côi, thứ tự, tổng dung lượng.
 *  F. deleteCleanupAsset(s): chặn khi còn dùng, xóa mồ côi thật, not-found, batch hỗn hợp.
 */
import {
  AssetStore,
  type IDBFactoryLike,
} from "./assetStore.ts";
import {
  computeRefCounts,
  syncAssetRefCounts,
  scanStorageForCleanup,
  deleteCleanupAsset,
  deleteCleanupAssets,
  type CleanupManifestLike,
} from "./idbCleanup61R9.ts";

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

// ---------------------------------------------------------------------------
// Fake IndexedDB tối thiểu (copy gọn mẫu assetStore.test.ts).
// ---------------------------------------------------------------------------

type Handler = ((ev: { target: FakeRequest }) => void) | null;

class FakeRequest {
  result: unknown = undefined;
  error: unknown = null;
  onsuccess: Handler = null;
  onerror: Handler = null;
  onupgradeneeded: Handler = null;
  _ok(value: unknown): void {
    this.result = value;
    queueMicrotask(() => {
      if (this.onsuccess) this.onsuccess({ target: this });
    });
  }
  _err(e: unknown): void {
    this.error = e;
    queueMicrotask(() => {
      if (this.onerror) this.onerror({ target: this });
    });
  }
}

class FakeStore {
  private records = new Map<unknown, unknown>();
  private indexes = new Map<string, { keyPath: string; unique: boolean; map: Map<unknown, unknown> }>();
  readonly name: string;
  private readonly keyPath: string | undefined;
  constructor(name: string, keyPath?: string) {
    this.name = name;
    this.keyPath = keyPath;
  }
  createIndex(name: string, keyPath: string, opts?: { unique?: boolean }): void {
    this.indexes.set(name, { keyPath, unique: !!opts?.unique, map: new Map() });
  }
  index(name: string): { get(key: unknown): FakeRequest } {
    const def = this.indexes.get(name);
    if (!def) throw new Error(`Không có index "${name}".`);
    const store = this;
    return {
      get(key: unknown): FakeRequest {
        const r = new FakeRequest();
        queueMicrotask(() => {
          const pk = def.map.get(key);
          r._ok(pk === undefined ? undefined : store._getByKey(pk));
        });
        return r;
      },
    };
  }
  _getByKey(key: unknown): unknown {
    return this.records.get(key);
  }
  put(value: unknown, key?: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      try {
        const primary = key !== undefined ? key : (value as Record<string, unknown>)[this.keyPath as string];
        for (const def of this.indexes.values()) {
          if (!def.unique) continue;
          const ik = (value as Record<string, unknown>)[def.keyPath];
          const owner = def.map.get(ik);
          if (owner !== undefined && owner !== primary) {
            const e = new Error(`Unique index vi phạm cho key "${String(ik)}".`);
            e.name = "ConstraintError";
            throw e;
          }
        }
        const old = this.records.get(primary);
        if (old !== undefined) {
          for (const def of this.indexes.values()) def.map.delete((old as Record<string, unknown>)[def.keyPath]);
        }
        this.records.set(primary, value);
        for (const def of this.indexes.values()) def.map.set((value as Record<string, unknown>)[def.keyPath], primary);
        r._ok(primary);
      } catch (e) {
        r._err(e);
      }
    });
    return r;
  }
  get(key: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => r._ok(this.records.get(key)));
    return r;
  }
  getAll(): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => r._ok([...this.records.values()]));
    return r;
  }
  delete(key: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      const old = this.records.get(key);
      if (old !== undefined) {
        for (const def of this.indexes.values()) def.map.delete((old as Record<string, unknown>)[def.keyPath]);
        this.records.delete(key);
      }
      r._ok(undefined);
    });
    return r;
  }
  clear(): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      this.records.clear();
      for (const def of this.indexes.values()) def.map.clear();
      r._ok(undefined);
    });
    return r;
  }
}

class FakeDOMStringList {
  private items: string[] = [];
  get length(): number {
    return this.items.length;
  }
  contains(s: string): boolean {
    return this.items.includes(s);
  }
  item(i: number): string | null {
    return this.items[i] ?? null;
  }
  _add(s: string): void {
    if (!this.items.includes(s)) this.items.push(s);
  }
}

class FakeDB {
  readonly stores = new Map<string, FakeStore>();
  readonly objectStoreNames = new FakeDOMStringList();
  createObjectStore(name: string, opts?: { keyPath?: string }): FakeStore {
    const s = new FakeStore(name, opts?.keyPath);
    this.stores.set(name, s);
    this.objectStoreNames._add(name);
    return s;
  }
  transaction(names: string | string[], _mode?: string): { objectStore(name: string): FakeStore } {
    const list = Array.isArray(names) ? names : [names];
    const db = this;
    return {
      objectStore(n: string): FakeStore {
        if (!list.includes(n)) throw new Error(`Store "${n}" không trong transaction.`);
        const s = db.stores.get(n);
        if (!s) throw new Error(`Không có store "${n}".`);
        return s;
      },
    };
  }
  close(): void {
    /* no-op */
  }
}

class FakeIDBFactory implements IDBFactoryLike {
  private dbs = new Map<string, { version: number; db: FakeDB }>();
  open(name: string, version?: number): IDBOpenDBRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      let rec = this.dbs.get(name);
      if (!rec) {
        rec = { version: 0, db: new FakeDB() };
        this.dbs.set(name, rec);
      }
      const want = version ?? 1;
      r.result = rec.db;
      if (want > rec.version) {
        if (r.onupgradeneeded) r.onupgradeneeded({ target: r });
        rec.version = want;
      }
      r._ok(rec.db);
    });
    return r as unknown as IDBOpenDBRequest;
  }
  deleteDatabase(name: string): IDBOpenDBRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      this.dbs.delete(name);
      r._ok(undefined);
    });
    return r as unknown as IDBOpenDBRequest;
  }
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function freshStore(): AssetStore {
  const fake = new FakeIDBFactory();
  return new AssetStore({ idb: fake });
}

function manifest(id: string, name: string, aliases?: string[]): CleanupManifestLike {
  return { assetId: id, originalName: name, aliases, size: 100, mimeType: "video/webm", kind: "video", refCount: 0 };
}

function specWithClips(srcs: string[]): Record<string, unknown> {
  return {
    version: 1,
    meta: { name: "Fixture cleanup", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: srcs.map((src, i) => ({ kind: "video", id: `c${i + 1}`, src, start: i * 4, duration: 4 })),
      },
    ],
  };
}

function textOnlySpec(): Record<string, unknown> {
  return {
    version: 1,
    meta: { name: "Fixture cleanup", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "t1",
        kind: "text",
        clips: [{ kind: "text", id: "x1", text: "Chào", start: 0, duration: 3 }],
      },
    ],
  };
}

async function main(): Promise<void> {
  console.log("== A. computeRefCounts thuần ==");
  await test("A1: bin item +1; 2 item chung assetId → 2", () => {
    const counts = computeRefCounts(textOnlySpec() as never, [
      { id: "m1", name: "a.webm", assetId: "a_111" },
      { id: "m2", name: "a-copy.webm", assetId: "a_111" },
    ], [manifest("a_111", "a.webm")]);
    eq(counts.get("a_111")?.total, 2, "tổng 2 (dedup chung assetId)");
    eq(counts.get("a_111")?.binItems, 2, "binItems 2");
    eq(counts.get("a_111")?.clips, 0, "clips 0");
  });
  await test("A2: clip asset: đếm theo clip (2 clip cùng asset → 2); nested cũng đếm", () => {
    const spec = specWithClips(["asset:a_222", "asset:a_222"]);
    (spec.tracks as Array<Record<string, unknown>>)[0].clips = [
      ...(spec.tracks as Array<Record<string, unknown>>)[0].clips as unknown[],
      {
        kind: "nested", id: "n1", start: 8, duration: 4,
        subSpec: { tracks: [{ id: "v9", kind: "video", clips: [{ kind: "video", id: "c9", src: "asset:a_222", start: 0, duration: 4 }] }] },
      },
    ];
    const counts = computeRefCounts(spec as never, [], [manifest("a_222", "b.webm")]);
    eq(counts.get("a_222")?.clips, 3, "3 clip (2 ngoài + 1 nested)");
  });
  await test("A3: clip tên thô khớp originalName/alias → +1; tên lạ → 0", () => {
    const counts = computeRefCounts(
      specWithClips(["c.webm", "c-alias.webm", "la.webm"]) as never,
      [],
      [manifest("a_333", "c.webm", ["c-alias.webm"])],
    );
    eq(counts.get("a_333")?.clips, 2, "2 clip khớp (tên thật + alias)");
  });
  await test("A4: một tên khớp 2 manifest → đếm cả hai (đếm thừa an toàn)", () => {
    const counts = computeRefCounts(
      specWithClips(["trung.webm"]) as never,
      [],
      [manifest("a_444", "trung.webm"), manifest("a_555", "trung.webm")],
    );
    eq(counts.get("a_444")?.clips, 1, "manifest 1 được đếm");
    eq(counts.get("a_555")?.clips, 1, "manifest 2 được đếm");
  });
  await test("A5: spec/bin rỗng → map rỗng", () => {
    const counts = computeRefCounts(textOnlySpec() as never, [], [manifest("a_666", "d.webm")]);
    eq(counts.size, 0, "không có tham chiếu nào");
  });

  console.log("== B. setRefCount ==");
  await test("B1: ghi đè + clamp âm về 0 + asset lạ → null", async () => {
    const store = freshStore();
    const m = await store.ingest(new Blob(["bytes-b1"], { type: "video/webm" }), { name: "b1.webm" });
    eq((await store.setRefCount(m.assetId, 3))?.refCount, 3, "ghi 3");
    eq((await store.get(m.assetId))?.refCount, 3, "đọc lại 3");
    eq((await store.setRefCount(m.assetId, -5))?.refCount, 0, "clamp -5 về 0");
    eq(await store.setRefCount("a_khongco", 2), null, "asset lạ → null");
  });

  console.log("== C. syncAssetRefCounts ==");
  await test("C1: clip (tên) + bin item đều tăng refCount", async () => {
    const store = freshStore();
    const a = await store.ingest(new Blob(["bytes-c1a"], { type: "video/webm" }), { name: "a.webm" });
    const b = await store.ingest(new Blob(["bytes-c1b"], { type: "video/webm" }), { name: "b.webm" });
    const rep = await syncAssetRefCounts(
      store,
      specWithClips(["a.webm"]) as never,
      [{ id: "m1", name: "b.webm", assetId: b.assetId }],
    );
    eq(rep.scanned, 2, "quét 2 manifest");
    eq(rep.updated, 2, "ghi 2 (0 → 1 cho cả hai)");
    eq(rep.errors, 0, "không lỗi");
    eq((await store.get(a.assetId))?.refCount, 1, "A = 1 (1 clip tên thô)");
    eq((await store.get(b.assetId))?.refCount, 1, "B = 1 (1 bin item)");
  });
  await test("C2: clip rời spec → refCount giảm về 0, bin còn thì giữ 1", async () => {
    const store = freshStore();
    const a = await store.ingest(new Blob(["bytes-c2a"], { type: "video/webm" }), { name: "a.webm" });
    const b = await store.ingest(new Blob(["bytes-c2b"], { type: "video/webm" }), { name: "b.webm" });
    await syncAssetRefCounts(store, specWithClips(["a.webm"]) as never, [{ id: "m1", name: "b.webm", assetId: b.assetId }]);
    const rep = await syncAssetRefCounts(store, textOnlySpec() as never, [{ id: "m1", name: "b.webm", assetId: b.assetId }]);
    eq(rep.updated, 1, "chỉ A đổi (1 → 0)");
    eq((await store.get(a.assetId))?.refCount, 0, "A về 0 sau khi clip rời spec");
    eq((await store.get(b.assetId))?.refCount, 1, "B vẫn 1 (còn trong bin)");
  });
  await test("C3: item rời bin → refCount về 0; sync lại không ghi thêm (idempotent)", async () => {
    const store = freshStore();
    const b = await store.ingest(new Blob(["bytes-c3b"], { type: "video/webm" }), { name: "b.webm" });
    await syncAssetRefCounts(store, textOnlySpec() as never, [{ id: "m1", name: "b.webm", assetId: b.assetId }]);
    eq((await store.get(b.assetId))?.refCount, 1, "trước: B = 1");
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    eq((await store.get(b.assetId))?.refCount, 0, "sau khi rời bin: B = 0");
    const rep = await syncAssetRefCounts(store, textOnlySpec() as never, []);
    eq(rep.updated, 0, "sync lại không ghi thêm");
  });

  console.log("== D. Cổng remove() qua refCount (đỏ-trước → xanh-sau) ==");
  await test("D1: clip dùng asset: → sync → remove() từ chối; clip rời → remove() xóa thật", async () => {
    const store = freshStore();
    const c = await store.ingest(new Blob(["bytes-clip-dang-dung"], { type: "video/webm" }), { name: "c.webm" });
    // Kịch bản đúng như đỏ-trước (/tmp/red-before-61r9.mjs): code cũ ở đây
    // trả true và xóa bytes. Nay sync trước rồi remove phải từ chối.
    await syncAssetRefCounts(store, specWithClips([`asset:${c.assetId}`]) as never, []);
    eq((await store.get(c.assetId))?.refCount, 1, "refCount = 1 sau sync (1 clip asset:)");
    eq(await store.remove(c.assetId), false, "remove() từ chối khi còn clip");
    assert((await store.getBlob(c.assetId)) !== null, "bytes còn nguyên sau lần từ chối");
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    eq((await store.get(c.assetId))?.refCount, 0, "refCount về 0 sau khi clip rời spec");
    eq(await store.remove(c.assetId), true, "remove() xóa được khi hết tham chiếu");
    eq(await store.getBlob(c.assetId), null, "bytes hết thật sau remove()");
    eq(await store.get(c.assetId), null, "manifest hết thật sau remove()");
  });
  await test("D2: releaseRef không âm (addRef ×2 rồi release ×5 → 0)", async () => {
    const store = freshStore();
    const m = await store.ingest(new Blob(["bytes-d2"], { type: "video/webm" }), { name: "d2.webm" });
    await store.addRef(m.assetId);
    await store.addRef(m.assetId);
    for (let i = 0; i < 5; i++) await store.releaseRef(m.assetId);
    eq((await store.get(m.assetId))?.refCount, 0, "không âm");
  });

  console.log("== E. scanStorageForCleanup ==");
  await test("E1: liệt kê đủ + mồ côi lên đầu + tổng dung lượng đúng", async () => {
    const store = freshStore();
    const a = await store.ingest(new Blob(["bytes-e1a-1234567890"], { type: "video/webm" }), { name: "a.webm" });
    const b = await store.ingest(new Blob(["bytes-e1b"], { type: "video/webm" }), { name: "b.webm" });
    const o = await store.ingest(new Blob(["bytes-e1o-orphan"], { type: "video/webm" }), { name: "orphan.webm" });
    const scan = await scanStorageForCleanup(
      store,
      specWithClips(["a.webm"]) as never,
      [{ id: "m1", name: "b.webm", assetId: b.assetId }],
    );
    eq(scan.totalAssets, 3, "3 asset");
    eq(scan.totalBytes, a.size + b.size + o.size, "tổng bytes đúng");
    eq(scan.orphanCount, 1, "1 mục mồ côi");
    eq(scan.orphanBytes, o.size, "bytes mồ côi = size của orphan");
    eq(scan.rows[0].assetId, o.assetId, "mồ côi lên đầu danh sách");
    eq(scan.rows[0].inUse, false, "orphan inUse=false");
    eq(scan.rows[0].refCount, 0, "orphan refCount=0");
    const rowA = scan.rows.find((r) => r.assetId === a.assetId);
    eq(rowA?.inUse, true, "A đang dùng");
    eq(rowA?.clips, 1, "A có 1 clip");
    const rowB = scan.rows.find((r) => r.assetId === b.assetId);
    eq(rowB?.inUse, true, "B đang dùng");
    eq(rowB?.binItems, 1, "B có 1 bin item");
  });

  console.log("== F. deleteCleanupAsset(s) ==");
  await test("F1: còn dùng → từ chối in-use, bytes còn nguyên", async () => {
    const store = freshStore();
    const a = await store.ingest(new Blob(["bytes-f1"], { type: "video/webm" }), { name: "a.webm" });
    await syncAssetRefCounts(store, specWithClips(["a.webm"]) as never, []);
    const r = await deleteCleanupAsset(store, a.assetId);
    eq(r.ok, false, "từ chối");
    if (!r.ok) eq(r.reason, "in-use", "lý do in-use");
    assert((await store.getBlob(a.assetId)) !== null, "bytes còn nguyên");
  });
  await test("F2: mồ côi → xóa thật, trả freedBytes đúng", async () => {
    const store = freshStore();
    const o = await store.ingest(new Blob(["bytes-f2-orphan"], { type: "video/webm" }), { name: "o.webm" });
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    const r = await deleteCleanupAsset(store, o.assetId);
    eq(r.ok, true, "xóa được");
    if (r.ok) eq(r.freedBytes, o.size, "freedBytes = size manifest");
    eq(await store.getBlob(o.assetId), null, "blob hết thật");
    eq(await store.get(o.assetId), null, "manifest hết thật");
  });
  await test("F3: asset lạ → not-found", async () => {
    const store = freshStore();
    const r = await deleteCleanupAsset(store, "a_khongco");
    eq(r.ok, false, "từ chối");
    if (!r.ok) eq(r.reason, "not-found", "lý do not-found");
  });
  await test("F4: batch hỗn hợp — xóa mồ côi, bỏ qua mục còn dùng + mục lạ", async () => {
    const store = freshStore();
    const a = await store.ingest(new Blob(["bytes-f4a"], { type: "video/webm" }), { name: "a.webm" });
    const o = await store.ingest(new Blob(["bytes-f4o"], { type: "video/webm" }), { name: "o.webm" });
    await syncAssetRefCounts(store, specWithClips(["a.webm"]) as never, []);
    const res = await deleteCleanupAssets(store, [a.assetId, o.assetId, "a_khongco"]);
    eq(res.deleted.length, 1, "chỉ xóa 1");
    eq(res.deleted[0], o.assetId, "xóa đúng mục mồ côi");
    eq(res.freedBytes, o.size, "freedBytes đúng");
    eq(res.skipped.length, 2, "bỏ qua 2");
    assert((await store.getBlob(a.assetId)) !== null, "asset còn dùng giữ nguyên bytes");
  });

  console.log(
    `\nidbCleanup61R9: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
