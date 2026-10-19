/**
 * assetStore.test.ts — Test thật cho AssetStore (R1-032, Batch C).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/assetStore.test.ts
 * Hoặc qua script (typecheck strict + chạy):
 *   bash apps/web/scripts/test-asset-store.sh
 *
 * Dùng Web Crypto thật (SHA-256) và module assetStore thật; chỉ IndexedDB
 * là fake in-memory (FakeIDBFactory) vì Node không có IndexedDB. Fake chỉ
 * implement đúng surface mà AssetStore dùng: open/deleteDatabase,
 * transaction/objectStore, put/get/getAll/delete/clear, index().get().
 */
import {
  AssetStore,
  sha256Hex,
  assetSrcFor,
  isAssetSrc,
  assetIdFromSrc,
  ASSET_SRC_PREFIX,
} from "./assetStore.ts";
import type { IDBFactoryLike } from "./assetStore.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

// ---------------------------------------------------------------------------
// Harness test tối giản (không cần node:test để tsc của app không đòi @types/node)
// ---------------------------------------------------------------------------

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
// Fake IndexedDB tối thiểu (đúng semantics async qua microtask)
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

interface IndexDef {
  keyPath: string;
  unique: boolean;
  map: Map<unknown, unknown>; // indexKey -> primaryKey
}

class FakeStore {
  private records = new Map<unknown, unknown>();
  private indexes = new Map<string, IndexDef>();
  readonly name: string;
  private readonly keyPath: string | undefined;
  constructor(name: string, keyPath?: string) {
    this.name = name;
    this.keyPath = keyPath;
  }

  private pk(value: unknown, key?: unknown): unknown {
    if (key !== undefined) return key;
    if (this.keyPath) return (value as Record<string, unknown>)[this.keyPath];
    throw new Error("put thiếu key (store không có keyPath).");
  }

  _getByKey(key: unknown): unknown {
    return this.records.get(key);
  }

  createIndex(name: string, keyPath: string, opts?: { unique?: boolean }): void {
    this.indexes.set(name, { keyPath, unique: !!opts?.unique, map: new Map() });
  }

  index(name: string): FakeIndex {
    const def = this.indexes.get(name);
    if (!def) throw new Error(`Không có index "${name}".`);
    return new FakeIndex(this, def);
  }

  put(value: unknown, key?: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      try {
        const primary = this.pk(value, key);
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
          for (const def of this.indexes.values()) {
            def.map.delete((old as Record<string, unknown>)[def.keyPath]);
          }
        }
        this.records.set(primary, value);
        for (const def of this.indexes.values()) {
          def.map.set((value as Record<string, unknown>)[def.keyPath], primary);
        }
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
        for (const def of this.indexes.values()) {
          def.map.delete((old as Record<string, unknown>)[def.keyPath]);
        }
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

class FakeIndex {
  private readonly store: FakeStore;
  private readonly def: IndexDef;
  constructor(store: FakeStore, def: IndexDef) {
    this.store = store;
    this.def = def;
  }
  get(key: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      const primary = this.def.map.get(key);
      r._ok(primary === undefined ? undefined : this.store._getByKey(primary));
    });
    return r;
  }
}

class FakeTx {
  private readonly db: FakeDB;
  private readonly names: string[];
  constructor(db: FakeDB, names: string[]) {
    this.db = db;
    this.names = names;
  }
  objectStore(name: string): FakeStore {
    if (!this.names.includes(name)) throw new Error(`Store "${name}" không trong transaction.`);
    const s = this.db.stores.get(name);
    if (!s) throw new Error(`Không có store "${name}".`);
    return s;
  }
}

class FakeDB {
  readonly stores = new Map<string, FakeStore>();
  readonly objectStoreNames = new FakeDOMStringList();
  createObjectStore(name: string, opts?: { keyPath?: string }): FakeStore {
    if (this.stores.has(name)) throw new Error(`Store "${name}" đã tồn tại.`);
    const s = new FakeStore(name, opts?.keyPath);
    this.stores.set(name, s);
    this.objectStoreNames._add(name);
    return s;
  }
  transaction(names: string | string[], _mode?: string): FakeTx {
    return new FakeTx(
      this,
      Array.isArray(names) ? names : [names],
    );
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
// Tests
// ---------------------------------------------------------------------------

function makeStore(tag: string, shared?: FakeIDBFactory): { store: AssetStore; factory: FakeIDBFactory } {
  const factory = shared ?? new FakeIDBFactory();
  return { store: new AssetStore({ idb: factory, dbName: `test-${tag}` }), factory };
}

function textFile(content: string, name: string, type = "text/plain"): File {
  return new File([content], name, { type });
}

async function main(): Promise<void> {
  console.log("== sha256Hex (Web Crypto thật) ==");
  await test("vector SHA-256 của 'hello' đúng", async () => {
    const h = await sha256Hex(new TextEncoder().encode("hello").buffer as ArrayBuffer);
    eq(h, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", "sha256('hello')");
  });
  await test("hash Blob khớp hash ArrayBuffer", async () => {
    const b = textFile("nội dung kiểm tra", "a.txt");
    const h1 = await sha256Hex(b);
    const h2 = await sha256Hex(await b.arrayBuffer());
    eq(h1, h2, "blob vs buffer");
    eq(h1.length, 64, "độ dài hex");
  });

  console.log("== ingest ==");
  await test("ingest trả manifest đầy đủ field", async () => {
    const { store } = makeStore("ingest1");
    const m = await store.ingest(textFile("xin chào", "chao.txt"));
    assert(m.assetId.startsWith("a_"), "assetId prefix");
    eq(m.assetId.length, 18, "assetId dài 18");
    eq(m.originalName, "chao.txt", "originalName");
    eq(m.size, new Blob(["xin chào"]).size, "size");
    eq(m.mimeType, "text/plain", "mimeType");
    eq(m.kind, "other", "kind");
    eq(m.refCount, 0, "refCount ban đầu");
    assert(!Number.isNaN(Date.parse(m.ingestedAt)), "ingestedAt ISO");
    const expectHash = await sha256Hex(textFile("xin chào", "x"));
    eq(m.sha256, expectHash, "sha256");
    eq(m.assetId, `a_${expectHash.slice(0, 16)}`, "assetId từ hash");
    await store.close();
  });
  await test("ingest nhận metadata passthrough", async () => {
    const { store } = makeStore("ingest2");
    const m = await store.ingest(textFile("x", "v.mp4", "video/mp4"), {
      width: 1280,
      height: 720,
      duration: 5.5,
      thumbnail: "data:image/png;base64,AAA",
    });
    eq(m.kind, "video", "kind video");
    eq(m.width, 1280, "width");
    eq(m.duration, 5.5, "duration");
    eq(m.thumbnail, "data:image/png;base64,AAA", "thumbnail");
    await store.close();
  });
  await test("ingest từ chối input không phải Blob", async () => {
    const { store } = makeStore("ingest3");
    let threw = false;
    try {
      await store.ingest("không phải blob" as unknown as Blob);
    } catch {
      threw = true;
    }
    assert(threw, "phải throw");
    await store.close();
  });

  console.log("== dedup ==");
  await test("cùng bytes + tên khác → cùng assetId, chỉ 1 manifest", async () => {
    const { store } = makeStore("dedup1");
    const a = await store.ingest(textFile("trùng lặp", "mot.txt"));
    const b = await store.ingest(textFile("trùng lặp", "hai.txt"), { width: 99 });
    eq(a.assetId, b.assetId, "assetId");
    eq((await store.list()).length, 1, "số manifest");
    await store.close();
  });
  await test("bytes khác → assetId khác", async () => {
    const { store } = makeStore("dedup2");
    const a = await store.ingest(textFile("một", "a.txt"));
    const b = await store.ingest(textFile("hai", "b.txt"));
    assert(a.assetId !== b.assetId, "assetId phải khác");
    eq((await store.list()).length, 2, "số manifest");
    await store.close();
  });
  await test("ingest song song cùng nội dung → 1 manifest (ConstraintError retry)", async () => {
    const { store } = makeStore("dedup3");
    const [a, b] = await Promise.all([
      store.ingest(textFile("đua nhau", "r1.txt")),
      store.ingest(textFile("đua nhau", "r2.txt")),
    ]);
    eq(a.assetId, b.assetId, "assetId");
    eq((await store.list()).length, 1, "số manifest");
    await store.close();
  });

  console.log("== get / getBlob / objectURL ==");
  await test("getBlob trả đúng bytes gốc", async () => {
    const { store } = makeStore("blob1");
    const content = "dữ liệu gốc 123";
    const m = await store.ingest(textFile(content, "goc.txt"));
    const blob = await store.getBlob(m.assetId);
    assert(blob !== null, "blob tồn tại");
    eq(await blob!.text(), content, "nội dung blob");
    await store.close();
  });
  await test("get asset không tồn tại → null", async () => {
    const { store } = makeStore("blob2");
    eq(await store.get("a_khongtontai"), null, "get");
    eq(await store.getBlob("a_khongtontai"), null, "getBlob");
    await store.close();
  });
  await test("objectURL trả blob: URL", async () => {
    const { store } = makeStore("url1");
    const m = await store.ingest(textFile("preview", "p.txt"));
    const url = await store.objectURL(m.assetId);
    assert(typeof url === "string" && url.startsWith("blob:"), `URL hợp lệ (nhận ${url})`);
    store.revokeObjectURLs(m.assetId);
    await store.close();
  });
  await test("objectURL asset không tồn tại → null", async () => {
    const { store } = makeStore("url2");
    eq(await store.objectURL("a_khongtontai"), null, "objectURL");
    await store.close();
  });

  console.log("== refCount ==");
  await test("addRef/releaseRef tăng giảm, không âm", async () => {
    const { store } = makeStore("ref1");
    const m = await store.ingest(textFile("ref", "r.txt"));
    await store.addRef(m.assetId);
    await store.addRef(m.assetId);
    eq((await store.get(m.assetId))!.refCount, 2, "sau 2 addRef");
    await store.releaseRef(m.assetId);
    eq((await store.get(m.assetId))!.refCount, 1, "sau releaseRef");
    await store.releaseRef(m.assetId);
    await store.releaseRef(m.assetId);
    eq((await store.get(m.assetId))!.refCount, 0, "không âm");
    await store.close();
  });
  await test("addRef asset không tồn tại → null", async () => {
    const { store } = makeStore("ref2");
    eq(await store.addRef("a_khongtontai"), null, "addRef");
    await store.close();
  });

  console.log("== remove ==");
  await test("remove từ chối khi refCount > 0", async () => {
    const { store } = makeStore("rm1");
    const m = await store.ingest(textFile("giữ", "k.txt"));
    await store.addRef(m.assetId);
    eq(await store.remove(m.assetId), false, "remove phải false");
    assert((await store.get(m.assetId)) !== null, "asset vẫn còn");
    await store.close();
  });
  await test("remove force xoá được khi đang ref", async () => {
    const { store } = makeStore("rm2");
    const m = await store.ingest(textFile("ép", "f.txt"));
    await store.addRef(m.assetId);
    eq(await store.remove(m.assetId, { force: true }), true, "force remove");
    eq(await store.get(m.assetId), null, "manifest mất");
    eq(await store.getBlob(m.assetId), null, "blob mất");
    await store.close();
  });
  await test("remove bình thường sau releaseRef", async () => {
    const { store } = makeStore("rm3");
    const m = await store.ingest(textFile("xoá", "d.txt"));
    await store.addRef(m.assetId);
    await store.releaseRef(m.assetId);
    eq(await store.remove(m.assetId), true, "remove");
    eq((await store.list()).length, 0, "list rỗng");
    await store.close();
  });
  await test("remove asset không tồn tại → false", async () => {
    const { store } = makeStore("rm4");
    eq(await store.remove("a_khongtontai"), false, "remove");
    await store.close();
  });

  console.log("== list / stats / clear ==");
  await test("stats đếm đúng assets và bytes", async () => {
    const { store } = makeStore("st1");
    const m1 = await store.ingest(textFile("12345", "a.txt"));
    const m2 = await store.ingest(textFile("1234567890", "b.txt"));
    const s = await store.stats();
    eq(s.assets, 2, "assets");
    eq(s.bytes, m1.size + m2.size, "bytes");
    await store.close();
  });
  await test("clear xoá hết", async () => {
    const { store } = makeStore("cl1");
    await store.ingest(textFile("a", "a.txt"));
    await store.clear();
    eq((await store.list()).length, 0, "list");
    eq((await store.stats()).assets, 0, "stats");
    await store.close();
  });

  console.log("== persistence qua instance (đi qua lớp IDB) ==");
  await test("instance thứ hai cùng factory thấy dữ liệu", async () => {
    const factory = new FakeIDBFactory();
    const s1 = new AssetStore({ idb: factory, dbName: "shared-db" });
    const m = await s1.ingest(textFile("bền", "p.txt"));
    await s1.close();
    const s2 = new AssetStore({ idb: factory, dbName: "shared-db" });
    const back = await s2.get(m.assetId);
    assert(back !== null && back.sha256 === m.sha256, "manifest đọc lại được");
    eq(await (await s2.getBlob(m.assetId))!.text(), "bền", "blob đọc lại được");
    await s2.destroy();
  });

  console.log("== asset src helpers ==");
  await test("assetSrcFor/isAssetSrc/assetIdFromSrc", async () => {
    const src = assetSrcFor("a_abc123");
    eq(src, `${ASSET_SRC_PREFIX}a_abc123`, "assetSrcFor");
    assert(isAssetSrc(src), "isAssetSrc true");
    assert(!isAssetSrc("clip.mp4"), "isAssetSrc false cho tên file");
    assert(!isAssetSrc("blob:http://x"), "isAssetSrc false cho blob URL");
    eq(assetIdFromSrc(src), "a_abc123", "assetIdFromSrc");
    eq(assetIdFromSrc("clip.mp4"), null, "không phải asset src");
    eq(assetIdFromSrc(ASSET_SRC_PREFIX), null, "prefix trơ trọi");
  });

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  if (fail > 0) {
    console.error("Failed:", failedNames.join(", "));
    process.exitCode = 1;
  }
}

void main();
