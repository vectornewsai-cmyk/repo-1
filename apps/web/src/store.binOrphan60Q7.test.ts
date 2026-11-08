/**
 * store.binOrphan60Q7.test.ts — Test qua store thật, Phase 9 đợt 60
 * (luồng Q7 — đóng nợ đợt 59 P1 §5.2: bytes IndexedDB mồ côi khi xóa
 * media khỏi bin).
 *
 * VÌ SAO FILE NÀY KHÔNG CHẠY BẰNG `node` TRỰC TIẾP: như
 * store.loadSampleDirty54K2.test.ts — store.ts dùng import không đuôi
 * mở rộng mà chỉ Vite/esbuild mới phân giải. Chạy bằng esbuild bundle
 * trước rồi chạy (mẫu 54K2):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.binOrphan60Q7.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.binOrphan60Q7.test.cjs --log-level=warning
 *   node /tmp/store.binOrphan60Q7.test.cjs
 *
 * IndexedDB là fake in-memory (copy mẫu assetStore.test.ts) cài lên
 * globalThis TRƯỚC khi test chạy — `removeMediaFromBin` tự `new
 * AssetStore()` nên nó dùng đúng fake này; "reload" = instance
 * AssetStore mới trên cùng factory (cùng DB nền).
 *
 * NỘI DUNG:
 *  S1. Xóa bin-only có assetId → ok:true, item khỏi bin, bytes thật sự
 *      biến mất khỏi IDB (getBlob/get/list/stats) cả với instance mới.
 *  S2. Còn clip dùng theo TÊN → chặn (ok:false), item + bytes còn nguyên.
 *  S3. Còn clip dùng qua src `asset:` → chặn (ok:false), item + bytes còn nguyên.
 *  S4. Hai item chung assetId (dedup) → xóa 1 item được, bytes GIỮ cho item kia.
 *  S5. Item không có assetId → xóa được, không crash, IDB không đổi.
 *  S6. Sau khi xóa (S1), manifest binMediaFromMedia không còn entry đó.
 */

import { useStore } from "./store";
import { AssetStore, type IDBFactoryLike } from "./lib/assetStore";
import { binMediaFromMedia } from "./lib/projectRepo";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

/* --- Shim DOM tối thiểu cho store.ts trong Node (mẫu 54K2) --- */
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const ctxStub = new Proxy(
  {},
  {
    get: (_t, p) => {
      if (p === "createLinearGradient") return () => ({ addColorStop() {} });
      return () => {};
    },
  },
);
const canvasStub = {
  width: 0,
  height: 0,
  getContext: () => ctxStub,
  toDataURL: () => PNG_1X1,
};
(globalThis as Record<string, unknown>).document = {
  createElement: () => canvasStub,
};

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
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

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

async function waitFor(fn: () => Promise<boolean>, timeoutMs = 3000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return await fn();
}

// ---------------------------------------------------------------------------
// Fake IndexedDB tối thiểu (copy mẫu assetStore.test.ts).
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
  map: Map<unknown, unknown>;
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
    return new FakeTx(this, Array.isArray(names) ? names : [names]);
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

/** Cài factory IDB mới tinh cho mỗi test; trả về probe AssetStore trên factory đó. */
function freshIDB(): { fake: FakeIDBFactory; probe: AssetStore } {
  const fake = new FakeIDBFactory();
  (globalThis as Record<string, unknown>).indexedDB = fake;
  return { fake, probe: new AssetStore({ idb: fake }) };
}

function textOnlySpec(): Record<string, unknown> {
  const version = useStore.getState().spec.version;
  return {
    version,
    meta: { name: "Fixture bin-orphan", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "t1",
        kind: "text",
        clips: [{ kind: "text", id: "x1", text: "Chào", start: 0, duration: 3 }],
      },
    ],
  };
}

function specWithClip(src: string): Record<string, unknown> {
  const version = useStore.getState().spec.version;
  return {
    version,
    meta: { name: "Fixture bin-orphan", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [{ kind: "video", id: "c1", src, start: 0, duration: 4 }],
      },
    ],
  };
}

function mediaItem(id: string, name: string, assetId?: string): Record<string, unknown> {
  return { id, name, kind: "video", url: `blob:fake-${id}`, duration: 4, ...(assetId ? { assetId } : {}) };
}

async function main(): Promise<void> {
  console.log("== S1. Xóa bin-only có assetId → bytes biến mất thật khỏi IDB ==");
  await test("S1: removeMediaFromBin xóa bytes khỏi IDB (cả instance mới = reload)", async () => {
    const { probe } = freshIDB();
    const m = await probe.ingest(new Blob(["bytes-s1-abcdef"], { type: "video/webm" }), { name: "s1.webm" });
    useStore.setState({
      spec: textOnlySpec() as never,
      media: [mediaItem("m1", "s1.webm", m.assetId) as never],
    });
    const r = useStore.getState().removeMediaFromBin("m1");
    eq(r.ok, true, "xóa được");
    eq(useStore.getState().media.length, 0, "bin đã hết item");
    // Xóa bytes là fire-and-forget (async) nên poll tới khi IDB thật sự hết.
    const gone = await waitFor(async () => (await new AssetStore().getBlob(m.assetId)) === null);
    assert(gone, "bytes biến mất khỏi IDB trong 3s");
    eq(await new AssetStore().get(m.assetId), null, "manifest cũng hết (instance mới)");
    eq((await new AssetStore().list()).length, 0, "list rỗng (instance mới)");
  });

  console.log("== S2. Còn clip dùng theo tên → chặn, bytes còn ==");
  await test("S2: clip dùng tên thì chặn xóa, bytes còn nguyên", async () => {
    const { probe } = freshIDB();
    const m = await probe.ingest(new Blob(["bytes-s2"], { type: "video/webm" }), { name: "s2.webm" });
    useStore.setState({
      spec: specWithClip("s2.webm") as never,
      media: [mediaItem("m1", "s2.webm", m.assetId) as never],
    });
    const r = useStore.getState().removeMediaFromBin("m1");
    eq(r.ok, false, "bị chặn");
    assert(typeof r.message === "string" && r.message.length > 0, "có message cho UI");
    eq(useStore.getState().media.length, 1, "item còn trong bin");
    assert((await new AssetStore().getBlob(m.assetId)) !== null, "bytes còn nguyên");
  });

  console.log("== S3. Còn clip dùng qua src asset: → chặn, bytes còn ==");
  await test("S3: clip dùng src asset: thì chặn xóa, bytes còn nguyên", async () => {
    const { probe } = freshIDB();
    const m = await probe.ingest(new Blob(["bytes-s3"], { type: "video/webm" }), { name: "s3.webm" });
    useStore.setState({
      spec: specWithClip(`asset:${m.assetId}`) as never,
      media: [mediaItem("m1", "s3.webm", m.assetId) as never],
    });
    const r = useStore.getState().removeMediaFromBin("m1");
    eq(r.ok, false, "bị chặn (chặn mới của Q7 — chặn theo tên không thấy src asset:)");
    eq(useStore.getState().media.length, 1, "item còn trong bin");
    assert((await new AssetStore().getBlob(m.assetId)) !== null, "bytes còn nguyên");
  });

  console.log("== S4. Hai item chung assetId → xóa 1, bytes giữ cho item kia ==");
  await test("S4: dedup chung assetId — xóa 1 item, bytes còn cho item kia", async () => {
    const { probe } = freshIDB();
    const m = await probe.ingest(new Blob(["bytes-s4"], { type: "video/webm" }), { name: "s4.webm" });
    useStore.setState({
      spec: textOnlySpec() as never,
      media: [
        mediaItem("m1", "s4.webm", m.assetId) as never,
        mediaItem("m2", "s4-copy.webm", m.assetId) as never,
      ],
    });
    const r = useStore.getState().removeMediaFromBin("m1");
    eq(r.ok, true, "xóa được item m1");
    eq(useStore.getState().media.map((x) => x.id), ["m2"], "chỉ còn m2 trong bin");
    await sleep(300);
    assert((await new AssetStore().getBlob(m.assetId)) !== null, "bytes còn vì m2 vẫn dùng");
    assert((await new AssetStore().get(m.assetId)) !== null, "manifest còn vì m2 vẫn dùng");
  });

  console.log("== S5. Item không có assetId → xóa được, IDB không đổi ==");
  await test("S5: item chưa ingest — xóa được, không crash, IDB không đổi", async () => {
    const { probe } = freshIDB();
    useStore.setState({
      spec: textOnlySpec() as never,
      media: [mediaItem("m1", "chua-ingest.mp4") as never],
    });
    const r = useStore.getState().removeMediaFromBin("m1");
    eq(r.ok, true, "xóa được");
    eq(useStore.getState().media.length, 0, "bin hết item");
    eq((await probe.stats()).assets, 0, "IDB vẫn 0 asset (không xóa nhầm gì)");
  });

  console.log("== S6. Manifest binMedia sau xóa không còn entry ==");
  await test("S6: binMediaFromMedia sau xóa không còn entry của item đã xóa", async () => {
    const { probe } = freshIDB();
    const m1 = await probe.ingest(new Blob(["bytes-s6a"], { type: "video/webm" }), { name: "s6a.webm" });
    const m2 = await probe.ingest(new Blob(["bytes-s6b"], { type: "video/webm" }), { name: "s6b.webm" });
    useStore.setState({
      spec: textOnlySpec() as never,
      media: [
        mediaItem("m1", "s6a.webm", m1.assetId) as never,
        mediaItem("m2", "s6b.webm", m2.assetId) as never,
      ],
    });
    eq(binMediaFromMedia(useStore.getState().media).length, 2, "trước xóa: 2 entry");
    const r = useStore.getState().removeMediaFromBin("m1");
    eq(r.ok, true, "xóa được");
    const after = binMediaFromMedia(useStore.getState().media);
    eq(after.length, 1, "sau xóa: 1 entry");
    eq(after[0].assetId, m2.assetId, "chỉ còn entry của m2");
  });

  console.log(
    `\nstore.binOrphan60Q7: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

void main();
