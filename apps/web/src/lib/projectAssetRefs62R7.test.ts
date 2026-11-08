/**
 * projectAssetRefs62R7.test.ts — Test thật cho sổ tham chiếu liên project
 * + chặn xóa liên project + lock liên tab (Phase 9 đợt 62, luồng R7 —
 * đóng nợ đợt 61 R9 §5.1/§5.2/§5.8).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/projectAssetRefs62R7.test.ts
 *
 * Dùng AssetStore thật; chỉ IndexedDB là fake in-memory (FakeIDBFactory,
 * copy verbatim mẫu idbCleanup61R9.test.ts — cùng một fake, không sửa
 * ngữ nghĩa) và Web Locks / BroadcastChannel là fake.
 *
 * NỘI DUNG:
 *  A. projectKeyForName / projectDisplayName thuần.
 *  B. Registry CRUD qua AssetStore thật: 2 project dùng chung bytes,
 *     ghi đè tập, quên project, dedupe, 2 "tab" (2 instance chung
 *     factory) thấy cùng sổ.
 *  C. Nâng cấp DB v1 → v2: DB v1 cũ (manifests + blobs) mở bằng
 *     AssetStore v2 → store projectRefs xuất hiện, manifest cũ còn
 *     nguyên, ghi sổ được.
 *  D. Lock liên tab cho sync refCount: 2 sync song song, fake locks
 *     chung → pha ghi không xen kẽ (max concurrent = 1); không locks
 *     → xen kẽ (max concurrent = 2). Đo bằng store bọc delay.
 *  E. BroadcastChannel: notify/subscribe qua fake channel toàn cục.
 *  F. Scan/delete có registry: chặn cross-project, loại bản ghi của
 *     chính project hiện tại, đọc sổ lỗi thì xóa chặn (fail-closed),
 *     tên thô trùng nhau vẫn đếm thừa (hồi quy R9 — không "sửa").
 *  G. recordCurrentProjectRefs: ghi tập đúng, changed, idempotent.
 */
import {
  AssetStore,
  type IDBFactoryLike,
} from "./assetStore.ts";
import {
  PROJECT_REFS_CHANNEL,
  notifyProjectRefsChanged,
  notifyStorageChanged,
  projectDisplayName,
  projectKeyForName,
  subscribeProjectRefsChanged,
} from "./projectAssetRefs62R7.ts";
import {
  collectProjectAssetIds,
  deleteCleanupAsset,
  deleteCleanupAssets,
  recordCurrentProjectRefs,
  scanStorageForCleanup,
  syncAssetRefCounts,
  type CleanupManifestLike,
  type CleanupStoreLike,
  type ProjectRefsReaderLike,
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
// Fake IndexedDB tối thiểu (copy verbatim mẫu idbCleanup61R9.test.ts).
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

function freshStore(shared?: FakeIDBFactory): { store: AssetStore; factory: FakeIDBFactory } {
  const factory = shared ?? new FakeIDBFactory();
  return { store: new AssetStore({ idb: factory }), factory };
}

function manifest(id: string, name: string, aliases?: string[]): CleanupManifestLike {
  return { assetId: id, originalName: name, aliases, size: 100, mimeType: "video/webm", kind: "video", refCount: 0 };
}

function specWithClips(srcs: string[]): Record<string, unknown> {
  return {
    version: 1,
    meta: { name: "Fixture xproject", width: 1280, height: 720, fps: 30 },
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
    meta: { name: "Fixture xproject", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "t1",
        kind: "text",
        clips: [{ kind: "text", id: "x1", text: "Chào", start: 0, duration: 3 }],
      },
    ],
  };
}

/** Fake Web Locks: hàng đợi theo tên, đếm số callback đang chạy đồng thời (để đo serialize). */
class FakeLocks {
  private queues = new Map<string, Promise<void>>();
  active = 0;
  maxActive = 0;
  async request<T>(name: string, cb: () => Promise<T> | T): Promise<T> {
    const prev = this.queues.get(name) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    this.queues.set(name, prev.then(() => gate));
    await prev;
    this.active += 1;
    if (this.active > this.maxActive) this.maxActive = this.active;
    try {
      return await cb();
    } finally {
      this.active -= 1;
      release();
    }
  }
}

/** Bọc store để đo xen kẽ pha ghi: setRefCount delay 5ms + đếm concurrent. */
class DelayedStore implements CleanupStoreLike {
  active = 0;
  maxActive = 0;
  private readonly inner: CleanupStoreLike;
  constructor(inner: CleanupStoreLike) {
    this.inner = inner;
  }
  list(): Promise<CleanupManifestLike[]> {
    return this.inner.list();
  }
  get(assetId: string): Promise<CleanupManifestLike | null> {
    return this.inner.get(assetId);
  }
  async setRefCount(assetId: string, n: number): Promise<CleanupManifestLike | null> {
    this.active += 1;
    if (this.active > this.maxActive) this.maxActive = this.active;
    try {
      await new Promise((r) => setTimeout(r, 5));
      return await this.inner.setRefCount(assetId, n);
    } finally {
      this.active -= 1;
    }
  }
  remove(assetId: string, opts?: { force?: boolean }): Promise<boolean> {
    return this.inner.remove(assetId, opts);
  }
}

/** Registry stub cho scan/delete (đọc từ mảng cho trước; có thể ném lỗi). */
class StubRegistry implements ProjectRefsReaderLike {
  private readonly records: Array<{ projectKey: string; projectName: string; assetIds: string[]; updatedAt: string }>;
  private readonly shouldThrow: boolean;
  constructor(
    records: Array<{ projectKey: string; projectName: string; assetIds: string[]; updatedAt: string }>,
    shouldThrow = false,
  ) {
    this.records = records;
    this.shouldThrow = shouldThrow;
  }
  async listProjectRefs(): Promise<Array<{ projectKey: string; projectName: string; assetIds: string[]; updatedAt: string }>> {
    if (this.shouldThrow) throw new Error("IDB registry lỗi (stub)");
    return this.records;
  }
}

/** Fake BroadcastChannel tối thiểu (đăng ký theo tên kênh, phát cho mọi instance cùng tên). */
class FakeBroadcastChannel {
  static readonly instances = new Set<FakeBroadcastChannel>();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  readonly name: string;
  closed = false;
  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.instances.add(this);
  }
  postMessage(data: unknown): void {
    for (const inst of FakeBroadcastChannel.instances) {
      if (inst === this || inst.name !== this.name || inst.closed) continue;
      queueMicrotask(() => {
        if (inst.onmessage) inst.onmessage({ data });
      });
    }
  }
  close(): void {
    this.closed = true;
    FakeBroadcastChannel.instances.delete(this);
  }
}

async function main(): Promise<void> {
  console.log("== A. projectKeyForName / projectDisplayName ==");
  await test("A1: tên thường → name:<tên>", () => {
    eq(projectKeyForName("Dự án B"), "name:Dự án B", "khóa theo tên");
  });
  await test("A2: tên có khoảng trắng đầu/cuối → trim", () => {
    eq(projectKeyForName("  Dự án B  "), "name:Dự án B", "trim tên");
  });
  await test("A3: tên rỗng → fallback Dự án không tên", () => {
    eq(projectKeyForName("   "), "name:Dự án không tên", "fallback khi rỗng");
    eq(projectKeyForName(""), "name:Dự án không tên", "fallback khi rỗng hẳn");
  });
  await test("A4: displayName bỏ tiền tố; khóa lạ trả nguyên", () => {
    eq(projectDisplayName("name:Dự án B"), "Dự án B", "bỏ tiền tố name:");
    eq(projectDisplayName("khac:xyz"), "khac:xyz", "khóa lạ giữ nguyên");
  });

  console.log("== B. Registry CRUD qua AssetStore thật ==");
  await test("B1: 2 project dùng chung bytes — getProjectsUsingAsset trả cả hai", async () => {
    const { store } = freshStore();
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    const y = await store.ingest(new Blob(["bytes-y"], { type: "video/webm" }), { name: "y.webm" });
    const z = await store.ingest(new Blob(["bytes-z"], { type: "video/webm" }), { name: "z.webm" });
    await store.recordProjectRefs("name:Dự án A", "Dự án A", [x.assetId, y.assetId]);
    await store.recordProjectRefs("name:Dự án B", "Dự án B", [x.assetId, z.assetId]);
    const users = await store.getProjectsUsingAsset(x.assetId);
    eq(users.length, 2, "x có 2 project dùng chung");
    assert(users.some((r) => r.projectKey === "name:Dự án A"), "có A");
    assert(users.some((r) => r.projectKey === "name:Dự án B"), "có B");
    const usersY = await store.getProjectsUsingAsset(y.assetId);
    eq(usersY.length, 1, "y chỉ A dùng");
    eq((await store.listProjectRefs()).length, 2, "sổ có 2 bản ghi");
  });
  await test("B2: ghi đè tập (replace) — A ghi lại không còn x thì x chỉ còn B", async () => {
    const { store } = freshStore();
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    const y = await store.ingest(new Blob(["bytes-y"], { type: "video/webm" }), { name: "y.webm" });
    await store.recordProjectRefs("name:Dự án A", "Dự án A", [x.assetId, y.assetId]);
    await store.recordProjectRefs("name:Dự án B", "Dự án B", [x.assetId]);
    const r2 = await store.recordProjectRefs("name:Dự án A", "Dự án A", [y.assetId]);
    eq(r2.changed, true, "tập đổi → changed=true");
    eq((await store.getProjectsUsingAsset(x.assetId)).length, 1, "x chỉ còn B");
    eq((await store.getProjectsUsingAsset(x.assetId))[0].projectKey, "name:Dự án B", "x còn B");
  });
  await test("B3: ghi lại đúng tập cũ → changed=false, updatedAt không đổi", async () => {
    const { store } = freshStore();
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    const r1 = await store.recordProjectRefs("name:Dự án A", "Dự án A", [x.assetId]);
    const r2 = await store.recordProjectRefs("name:Dự án A", "Dự án A", [x.assetId]);
    eq(r2.changed, false, "không đổi → changed=false");
    eq(r2.record.updatedAt, r1.record.updatedAt, "không ghi lại nên updatedAt giữ nguyên");
  });
  await test("B4: quên project — chỉ xóa bản ghi, bytes còn nguyên", async () => {
    const { store } = freshStore();
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    await store.recordProjectRefs("name:Dự án A", "Dự án A", [x.assetId]);
    await store.recordProjectRefs("name:Dự án B", "Dự án B", [x.assetId]);
    eq(await store.forgetProjectRefs("name:Dự án A"), true, "quên A trả true");
    eq(await store.forgetProjectRefs("name:Dự án A"), false, "quên lại trả false");
    eq((await store.listProjectRefs()).length, 1, "sổ còn 1 bản ghi (B)");
    eq((await store.getProjectsUsingAsset(x.assetId)).length, 1, "x còn B dùng");
    assert((await store.getBlob(x.assetId)) !== null, "quên chỉ xóa bản ghi, bytes còn");
  });
  await test("B5: record dedupe + loại chuỗi rỗng", async () => {
    const { store } = freshStore();
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    const r = await store.recordProjectRefs("name:Dự án A", "Dự án A", [x.assetId, x.assetId, "", x.assetId]);
    eq(r.record.assetIds.length, 1, "dedupe về 1");
    eq(r.record.assetIds[0], x.assetId, "giữ đúng assetId");
  });
  await test("B6: 2 instance chung factory (2 tab) thấy cùng sổ", async () => {
    const factory = new FakeIDBFactory();
    const s1 = new AssetStore({ idb: factory });
    const s2 = new AssetStore({ idb: factory });
    const x = await s1.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    await s1.recordProjectRefs("name:Dự án A", "Dự án A", [x.assetId]);
    const seen = await s2.getProjectsUsingAsset(x.assetId);
    eq(seen.length, 1, "tab 2 thấy bản ghi tab 1 đã ghi");
    eq(seen[0].projectKey, "name:Dự án A", "đúng khóa");
  });
  await test("B7: recordProjectRefs khóa rỗng → throw", async () => {
    const { store } = freshStore();
    let threw = false;
    try {
      await store.recordProjectRefs("", "Dự án A", []);
    } catch {
      threw = true;
    }
    assert(threw, "phải throw khi khóa rỗng");
  });

  console.log("== C. Nâng cấp DB v1 → v2 ==");
  await test("C1: DB v1 cũ (manifests+blobs) mở bằng AssetStore v2 → projectRefs xuất hiện, manifest cũ còn nguyên", async () => {
    // Dựng DB v1 bằng factory thô: chỉ tạo manifests + blobs (y hệt v1).
    const factory = new FakeIDBFactory();
    const v1db = await new Promise<unknown>((resolve, reject) => {
      const req = factory.open("vcut-studio-assets", 1) as unknown as {
        result: { createObjectStore: (n: string, o?: unknown) => unknown };
        onupgradeneeded: ((ev: unknown) => void) | null;
        onsuccess: ((ev: unknown) => void) | null;
        onerror: ((ev: unknown) => void) | null;
      };
      req.onupgradeneeded = () => {
        const db = req.result as unknown as {
          createObjectStore: (n: string, o?: { keyPath?: string }) => { createIndex: (n: string, k: string, o?: unknown) => void };
        };
        const s = db.createObjectStore("manifests", { keyPath: "assetId" });
        s.createIndex("bySha256", "sha256", { unique: true });
        db.createObjectStore("blobs");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error("mở DB v1 thất bại"));
    });
    // Ghi 1 manifest vào DB v1 bằng transaction thô.
    const v1 = v1db as {
      transaction: (n: string | string[], m?: string) => { objectStore: (n: string) => { put: (v: unknown) => { onsuccess: ((ev: unknown) => void) | null } } };
    };
    await new Promise<void>((resolve) => {
      const r = v1.transaction(["manifests"], "readwrite").objectStore("manifests").put({
        assetId: "a_v1old00000001",
        originalName: "cu-v1.webm",
        sha256: "11".repeat(32),
        size: 777,
        mimeType: "video/webm",
        kind: "video",
        ingestedAt: new Date().toISOString(),
        refCount: 0,
      });
      r.onsuccess = () => resolve();
    });
    // Mở bằng AssetStore v2 (ASSET_DB_VERSION = 2): upgrade phải tạo projectRefs.
    const store = new AssetStore({ idb: factory });
    const old = await store.get("a_v1old00000001");
    assert(old !== null && old.size === 777, "manifest v1 còn nguyên sau nâng cấp");
    const refs = await store.listProjectRefs();
    eq(refs.length, 0, "projectRefs mới tạo, đang rỗng");
    const rec = await store.recordProjectRefs("name:Dự án A", "Dự án A", ["a_v1old00000001"]);
    eq(rec.record.assetIds.length, 1, "ghi sổ được trên DB đã nâng cấp");
    eq((await store.list()).length, 1, "manifests vẫn 1 mục");
  });

  console.log("== D. Lock liên tab cho sync refCount ==");
  await test("D1: 2 sync song song, fake locks chung → pha ghi không xen kẽ (max concurrent = 1)", async () => {
    const { store } = freshStore();
    const a = await store.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    const b = await store.ingest(new Blob(["bytes-b"], { type: "video/webm" }), { name: "b.webm" });
    const locks = new FakeLocks();
    const delayed = new DelayedStore(store);
    const specA = specWithClips(["a.webm"]) as never;
    const specB = specWithClips(["b.webm"]) as never;
    await Promise.all([
      syncAssetRefCounts(delayed, specA, [], { locks }),
      syncAssetRefCounts(delayed, specB, [], { locks }),
    ]);
    eq(delayed.maxActive, 1, "pha ghi tuần tự hoá (max concurrent 1)");
    // Sau 2 sync, refCount là của lượt sync thắng sau (last-writer-wins theo lượt).
    const ma = await store.get(a.assetId);
    const mb = await store.get(b.assetId);
    assert(
      (ma?.refCount === 1 && mb?.refCount === 0) || (ma?.refCount === 0 && mb?.refCount === 1),
      `một trong hai = 1, còn lại = 0 (nhận a=${ma?.refCount}, b=${mb?.refCount})`,
    );
  });
  await test("D2: đối chứng không locks → 2 sync song song xen kẽ pha ghi (max concurrent = 2)", async () => {
    const { store } = freshStore();
    await store.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    await store.ingest(new Blob(["bytes-b"], { type: "video/webm" }), { name: "b.webm" });
    const delayed = new DelayedStore(store);
    const specA = specWithClips(["a.webm"]) as never;
    const specB = specWithClips(["b.webm"]) as never;
    await Promise.all([
      syncAssetRefCounts(delayed, specA, []),
      syncAssetRefCounts(delayed, specB, []),
    ]);
    eq(delayed.maxActive, 2, "không locks thì pha ghi xen kẽ (max concurrent 2)");
  });
  await test("D3: locks.request throw → sync vẫn chạy không khóa (fallback)", async () => {
    const { store } = freshStore();
    const a = await store.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    const badLocks = {
      request<T>(): Promise<T> {
        return Promise.reject(new Error("locks hỏng (stub)"));
      },
    };
    const rep = await syncAssetRefCounts(store, specWithClips(["a.webm"]) as never, [], { locks: badLocks });
    eq(rep.updated, 1, "sync vẫn cập nhật dù lock hỏng");
    eq((await store.get(a.assetId))?.refCount, 1, "refCount = 1");
  });

  console.log("== E. BroadcastChannel ==");
  await test("E1: notify → subscriber ở channel khác nhận đúng loại tin", async () => {
    const g = globalThis as unknown as { BroadcastChannel?: typeof FakeBroadcastChannel };
    const prev = g.BroadcastChannel;
    g.BroadcastChannel = FakeBroadcastChannel as unknown as typeof FakeBroadcastChannel;
    try {
      const seen: string[] = [];
      const unsub = subscribeProjectRefsChanged((type) => {
        seen.push(type);
      });
      notifyProjectRefsChanged();
      notifyStorageChanged();
      await new Promise((r) => setTimeout(r, 50));
      eq(seen.length, 2, "nhận 2 tin");
      eq(seen[0], "refs-changed", "tin 1 là refs-changed");
      eq(seen[1], "storage-changed", "tin 2 là storage-changed");
      unsub();
      notifyProjectRefsChanged();
      await new Promise((r) => setTimeout(r, 50));
      eq(seen.length, 2, "hủy đăng ký rồi thì không nhận thêm");
    } finally {
      g.BroadcastChannel = prev;
      FakeBroadcastChannel.instances.clear();
    }
  });
  await test("E2: không có BroadcastChannel → notify/subscribe là no-op, không throw", async () => {
    const g = globalThis as unknown as { BroadcastChannel?: unknown };
    const prev = g.BroadcastChannel;
    delete g.BroadcastChannel;
    try {
      notifyProjectRefsChanged();
      notifyStorageChanged();
      const unsub = subscribeProjectRefsChanged(() => {
        throw new Error("không được gọi");
      });
      unsub();
    } finally {
      g.BroadcastChannel = prev;
    }
  });
  await test("E3: tên kênh là vcut-projrefs", () => {
    eq(PROJECT_REFS_CHANNEL, "vcut-projrefs", "kênh đúng tên");
  });

  console.log("== F. Scan/delete có registry (2 project dùng chung bytes) ==");
  await test("F1: asset chỉ project B dùng → scan khóa (usedByOther=[B]), delete từ chối cross-project", async () => {
    const store = freshStore().store;
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    const o = await store.ingest(new Blob(["bytes-o"], { type: "video/webm" }), { name: "o.webm" });
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    const registry = new StubRegistry([
      { projectKey: "name:Dự án B", projectName: "Dự án B", assetIds: [x.assetId], updatedAt: new Date().toISOString() },
    ]);
    const scan = await scanStorageForCleanup(store, textOnlySpec() as never, [], {
      registry,
      currentProjectKey: "name:Dự án A",
    });
    const rowX = scan.rows.find((r) => r.assetId === x.assetId);
    eq(rowX?.inUse, true, "x bị khóa vì B dùng");
    eq(rowX?.usedByOther.join(","), "Dự án B", "usedByOther = Dự án B");
    const rowO = scan.rows.find((r) => r.assetId === o.assetId);
    eq(rowO?.inUse, false, "o vẫn mồ côi");
    eq(scan.orphanCount, 1, "chỉ 1 mồ côi");
    const del = await deleteCleanupAsset(store, x.assetId, { registry, currentProjectKey: "name:Dự án A" });
    eq(del.ok, false, "từ chối xóa x");
    if (!del.ok) {
      eq(del.reason, "cross-project", "lý do cross-project");
      eq(del.usedBy?.join(","), "Dự án B", "kèm tên project B");
    }
    assert((await store.getBlob(x.assetId)) !== null, "bytes của x còn nguyên");
  });
  await test("F2: quên B rồi xóa → được (batch: cross-project bị skip, mồ côi xóa thật)", async () => {
    const store = freshStore().store;
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    const o = await store.ingest(new Blob(["bytes-o"], { type: "video/webm" }), { name: "o.webm" });
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    await store.recordProjectRefs("name:Dự án B", "Dự án B", [x.assetId]);
    const opts = { registry: store as unknown as ProjectRefsReaderLike, currentProjectKey: "name:Dự án A" };
    const before = await deleteCleanupAssets(store, [x.assetId, o.assetId], opts);
    eq(before.deleted.length, 1, "chỉ xóa o");
    eq(before.deleted[0], o.assetId, "xóa đúng o");
    eq(before.skipped.length, 1, "skip 1 (x)");
    eq(before.skipped[0].reason, "cross-project", "skip vì cross-project");
    await store.forgetProjectRefs("name:Dự án B");
    const after = await deleteCleanupAssets(store, [x.assetId], opts);
    eq(after.deleted.length, 1, "sau khi quên B thì xóa được x");
    eq(await store.getBlob(x.assetId), null, "bytes x hết thật");
  });
  await test("F3: bản ghi của CHÍNH project hiện tại không chặn xóa (loại khỏi usedByOther)", async () => {
    const store = freshStore().store;
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    const registry = new StubRegistry([
      { projectKey: "name:Dự án A", projectName: "Dự án A", assetIds: [x.assetId], updatedAt: new Date().toISOString() },
    ]);
    const scan = await scanStorageForCleanup(store, textOnlySpec() as never, [], {
      registry,
      currentProjectKey: "name:Dự án A",
    });
    const rowX = scan.rows.find((r) => r.assetId === x.assetId);
    eq(rowX?.inUse, false, "bản ghi của chính mình không khóa (refCount tươi mới là nguồn thật)");
    eq(rowX?.usedByOther.length, 0, "usedByOther rỗng");
    const del = await deleteCleanupAsset(store, x.assetId, { registry, currentProjectKey: "name:Dự án A" });
    eq(del.ok, true, "xóa được (bản ghi cũ của chính mình không chặn)");
  });
  await test("F4: đọc sổ lỗi → scan vẫn trả hàng (registryError=true), delete chặn registry-unavailable", async () => {
    const store = freshStore().store;
    const x = await store.ingest(new Blob(["bytes-x"], { type: "video/webm" }), { name: "x.webm" });
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    const registry = new StubRegistry([], true);
    const scan = await scanStorageForCleanup(store, textOnlySpec() as never, [], {
      registry,
      currentProjectKey: "name:Dự án A",
    });
    eq(scan.registryError, true, "scan báo registryError");
    eq(scan.rows.find((r) => r.assetId === x.assetId)?.inUse, false, "hiển thị fail-open (chỉ theo project hiện tại)");
    const del = await deleteCleanupAsset(store, x.assetId, { registry, currentProjectKey: "name:Dự án A" });
    eq(del.ok, false, "xóa bị chặn");
    if (!del.ok) eq(del.reason, "registry-unavailable", "lý do registry-unavailable (fail-closed)");
    assert((await store.getBlob(x.assetId)) !== null, "bytes còn nguyên");
  });
  await test("F5: không truyền registry → hành vi cũ (không usedByOther, xóa mồ côi được)", async () => {
    const store = freshStore().store;
    const o = await store.ingest(new Blob(["bytes-o"], { type: "video/webm" }), { name: "o.webm" });
    await syncAssetRefCounts(store, textOnlySpec() as never, []);
    const scan = await scanStorageForCleanup(store, textOnlySpec() as never, []);
    eq(scan.registryProjects.length, 0, "không registry → không có project");
    eq(scan.registryError, false, "không lỗi");
    eq(scan.rows[0].usedByOther.length, 0, "usedByOther rỗng");
    const del = await deleteCleanupAsset(store, o.assetId);
    eq(del.ok, true, "xóa mồ côi được như cũ");
  });
  await test("F6 (hồi quy R9): tên thô trùng nhau vẫn đếm thừa — clip dùng tên trùng 2 manifest thì cả hai đều inUse", async () => {
    const store = freshStore().store;
    const a = await store.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "trung.webm" });
    const b = await store.ingest(new Blob(["bytes-b-khac"], { type: "video/webm" }), { name: "trung.webm" });
    // Hai manifest khác nội dung, trùng originalName (dedup theo hash nên 2 assetId khác nhau).
    assert(a.assetId !== b.assetId, "2 assetId khác nhau dù trùng tên");
    const scan = await scanStorageForCleanup(store, specWithClips(["trung.webm"]) as never, []);
    eq(scan.rows.find((r) => r.assetId === a.assetId)?.inUse, true, "manifest 1 bị khóa (đếm thừa an toàn)");
    eq(scan.rows.find((r) => r.assetId === b.assetId)?.inUse, true, "manifest 2 bị khóa (đếm thừa an toàn)");
  });

  console.log("== G. recordCurrentProjectRefs ==");
  await test("G1: ghi tập asset của project hiện tại (clip + bin), changed=true lần đầu", async () => {
    const store = freshStore().store;
    const a = await store.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    const b = await store.ingest(new Blob(["bytes-b"], { type: "video/webm" }), { name: "b.webm" });
    const rep = await recordCurrentProjectRefs(
      store,
      specWithClips(["a.webm"]) as never,
      [{ id: "m1", name: "b.webm", assetId: b.assetId }],
      "name:Dự án A",
      "Dự án A",
    );
    eq(rep.recorded, true, "ghi được");
    eq(rep.changed, true, "lần đầu → changed=true");
    eq(rep.assetCount, 2, "ghi 2 asset (1 clip + 1 bin)");
    const recs = await store.listProjectRefs();
    eq(recs.length, 1, "sổ có 1 bản ghi");
    eq(recs[0].assetIds.join(","), [a.assetId, b.assetId].sort().join(","), "tập đúng");
  });
  await test("G2: ghi lại đúng tập → changed=false; bớt clip → changed=true, tập thu lại", async () => {
    const store = freshStore().store;
    const a = await store.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    const b = await store.ingest(new Blob(["bytes-b"], { type: "video/webm" }), { name: "b.webm" });
    const s = store;
    await recordCurrentProjectRefs(s, specWithClips(["a.webm", "b.webm"]) as never, [], "name:Dự án A", "Dự án A");
    const rep2 = await recordCurrentProjectRefs(s, specWithClips(["a.webm", "b.webm"]) as never, [], "name:Dự án A", "Dự án A");
    eq(rep2.changed, false, "ghi lại đúng tập → changed=false");
    const rep3 = await recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], "name:Dự án A", "Dự án A");
    eq(rep3.changed, true, "bớt clip → changed=true");
    eq(rep3.assetCount, 1, "tập còn 1");
    eq((await store.getProjectsUsingAsset(b.assetId)).length, 0, "b không còn project nào ghi nhận");
  });
  await test("G3: collectProjectAssetIds — 2 project dùng chung bytes, tập giao nhau đúng", () => {
    const manifests = [manifest("a_111", "x.webm"), manifest("a_222", "y.webm"), manifest("a_333", "z.webm")];
    const idsA = collectProjectAssetIds(specWithClips(["x.webm"]) as never, [{ id: "m1", name: "y.webm", assetId: "a_222" }], manifests);
    eq(idsA.join(","), "a_111,a_222", "project A dùng x (clip) + y (bin)");
    const idsB = collectProjectAssetIds(specWithClips(["x.webm"]) as never, [], manifests);
    eq(idsB.join(","), "a_111", "project B chỉ dùng x — giao nhau ở x");
    const idsEmpty = collectProjectAssetIds(textOnlySpec() as never, [], manifests);
    eq(idsEmpty.length, 0, "project rỗng → tập rỗng");
  });
  await test("G4: project chưa dùng asset nào + chưa có bản ghi → KHÔNG tạo bản ghi rỗng; đã có bản ghi thì ghi tập rỗng để gỡ bảo vệ", async () => {
    const store = freshStore().store;
    const a = await store.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    // Project rỗng, chưa có bản ghi → không ghi (tránh nhiễu lúc App mount với spec mặc định).
    const repEmpty = await recordCurrentProjectRefs(store, textOnlySpec() as never, [], "name:Dự án mới", "Dự án mới");
    eq(repEmpty.recorded, true, "bỏ qua nhưng vẫn báo recorded (sổ đã phản ánh đúng: không dùng gì)");
    eq(repEmpty.changed, false, "không đổi");
    eq((await store.listProjectRefs()).length, 0, "không tạo bản ghi rỗng");
    // Project có asset rồi bỏ hết → ghi tập rỗng (replace) để gỡ bảo vệ cũ.
    await recordCurrentProjectRefs(store, specWithClips(["a.webm"]) as never, [], "name:Dự án A", "Dự án A");
    eq((await store.getProjectsUsingAsset(a.assetId)).length, 1, "A đang ghi nhận dùng a");
    const repDrop = await recordCurrentProjectRefs(store, textOnlySpec() as never, [], "name:Dự án A", "Dự án A");
    eq(repDrop.changed, true, "bỏ hết asset → changed=true");
    eq(repDrop.assetCount, 0, "tập còn 0");
    eq((await store.getProjectsUsingAsset(a.assetId)).length, 0, "a không còn project nào ghi nhận");
    eq((await store.listProjectRefs()).length, 1, "bản ghi A còn đó (tập rỗng), không bị xóa hẳn");
  });

  console.log(
    `\nprojectAssetRefs62R7: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
