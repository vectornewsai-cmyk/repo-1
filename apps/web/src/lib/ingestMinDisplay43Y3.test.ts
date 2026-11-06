/**
 * ingestMinDisplay43Y3.test.ts — Test cho đợt 43 luồng Y3 (ROUND43-Y3).
 *
 * 1. Min-display banner 500 ms (đợt 42 X3 §6): ingestWithProgress file nhỏ
 *    (nhánh one-shot) phải giữ pha hashing ≥ 500 ms trước khi sang storing,
 *    để banner không còn flash ~1–25 ms.
 * 2. Đường thất bại không bị pad: ingest lỗi trong lúc băm phải reject mà
 *    không chờ hết 500 ms (pad chỉ nằm sau khi băm thành công).
 * 3. Không callback thì không pad (đường ingest không UI không chậm thêm).
 * 4. Cổng S4/GOP không đổi: file > 128 MiB vẫn bị khóa khỏi đường GOP
 *    (resolveGopRangeWiring trả useGop=false) — import vẫn chạy, chỉ
 *    preview ngược không dùng GOP cho file này.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/ingestMinDisplay43Y3.test.ts
 *
 * Fake IndexedDB tối thiểu: chỉ implement đúng surface mà đường
 * putManifest của ingestWithProgress dùng (open/onupgradeneeded,
 * transaction, objectStore put/get, index().get). Không mạo nhận là
 * IndexedDB đầy đủ; đo IDB thật nằm ở click-test headed (xem LIMITS).
 */
import { AssetStore } from "./assetStore.ts";
import type { IDBFactoryLike } from "./assetStore.ts";
import {
  IMPORT_BANNER_MIN_DISPLAY_MS,
  type IngestProgressEvent,
} from "./ingestProgress39T5.ts";
import { resolveGopRangeWiring } from "./gopCache40V2.ts";

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
// Fake IndexedDB tối thiểu (đường putManifest)
// ---------------------------------------------------------------------------

type ReqHandler = ((ev: { target: FakeRequest }) => void) | null;

class FakeRequest {
  result: unknown = undefined;
  error: unknown = undefined;
  onsuccess: ReqHandler = null;
  onerror: ReqHandler = null;
  _fireOk(value: unknown): void {
    this.result = value;
    queueMicrotask(() => this.onsuccess?.({ target: this }));
  }
  _fireErr(err: unknown): void {
    this.error = err;
    queueMicrotask(() => this.onerror?.({ target: this }));
  }
}

class FakeIndex {
  private readonly store: FakeStore;
  private readonly keyPath: string;
  constructor(store: FakeStore, keyPath: string) {
    this.store = store;
    this.keyPath = keyPath;
  }
  get(key: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      for (const v of this.store._values()) {
        if ((v as Record<string, unknown>)[this.keyPath] === key) {
          r._fireOk(v);
          return;
        }
      }
      r._fireOk(undefined);
    });
    return r;
  }
}

class FakeStore {
  private records = new Map<unknown, unknown>();
  private indexes = new Map<string, { keyPath: string }>();
  readonly name: string;
  private readonly keyPath: string | undefined;
  constructor(name: string, keyPath?: string) {
    this.name = name;
    this.keyPath = keyPath;
  }
  _values(): unknown[] {
    return [...this.records.values()];
  }
  createIndex(name: string, keyPath: string): void {
    this.indexes.set(name, { keyPath });
  }
  index(name: string): FakeIndex {
    const def = this.indexes.get(name);
    if (!def) throw new Error(`Không có index "${name}".`);
    return new FakeIndex(this, def.keyPath);
  }
  put(value: unknown, key?: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      const pk =
        key !== undefined
          ? key
          : this.keyPath
            ? (value as Record<string, unknown>)[this.keyPath]
            : undefined;
      if (pk === undefined) {
        r._fireErr(new Error("put thiếu key."));
        return;
      }
      this.records.set(pk, value);
      r._fireOk(undefined);
    });
    return r;
  }
  get(key: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => r._fireOk(this.records.get(key)));
    return r;
  }
}

class FakeTx {
  private readonly stores: Map<string, FakeStore>;
  constructor(stores: Map<string, FakeStore>) {
    this.stores = stores;
  }
  objectStore(name: string): FakeStore {
    const s = this.stores.get(name);
    if (!s) throw new Error(`Không có store "${name}".`);
    return s;
  }
}

class FakeDb {
  readonly objectStoreNames = {
    _set: new Set<string>(),
    contains(name: string): boolean {
      return this._set.has(name);
    },
  };
  private stores = new Map<string, FakeStore>();
  createObjectStore(name: string, opts?: { keyPath?: string }): FakeStore {
    const s = new FakeStore(name, opts?.keyPath);
    this.stores.set(name, s);
    this.objectStoreNames._set.add(name);
    return s;
  }
  transaction(names: string | string[], _mode: string): FakeTx {
    void _mode;
    const picked = new Map<string, FakeStore>();
    // IDB thật chấp nhận cả chuỗi đơn lẫn mảng; AssetStore dùng cả hai
    // (getBlob truyền chuỗi, putManifest truyền mảng).
    for (const n of Array.isArray(names) ? names : [names]) {
      const s = this.stores.get(n);
      if (!s) throw new Error(`Không có store "${n}".`);
      picked.set(n, s);
    }
    return new FakeTx(picked);
  }
}

class FakeFactory implements IDBFactoryLike {
  private dbs = new Map<string, FakeDb>();
  deleteDatabase(_name: string): IDBOpenDBRequest {
    // Đường test này không xóa DB; stub chỉ để đủ mặt IDBFactoryLike.
    void _name;
    const r = new FakeRequest();
    queueMicrotask(() => r._fireOk(undefined));
    return r as unknown as IDBOpenDBRequest;
  }
  open(name: string, version: number): IDBOpenDBRequest {
    const req = new FakeRequest() as unknown as {
      onsuccess: ReqHandler;
      onerror: ReqHandler;
      onupgradeneeded: ReqHandler;
      result: unknown;
    };
    queueMicrotask(() => {
      let db = this.dbs.get(name);
      const fresh = !db;
      if (!db) {
        db = new FakeDb();
        this.dbs.set(name, db);
      }
      void version;
      // request.result phải có TRƯỚC onupgradeneeded: AssetStore đọc
      // request.result trong handler đó (đúng như IDB thật).
      req.result = db;
      if (fresh) {
        // onupgradeneeded chạy trước onsuccess, đúng thứ tự IDB thật.
        req.onupgradeneeded?.({ target: { result: db } } as never);
      }
      req.onsuccess?.({ target: req } as never);
    });
    return req as unknown as IDBOpenDBRequest;
  }
}

function makeStore(tag: string): AssetStore {
  // AssetStore.openDb gán request.result trong onsuccess rồi resolve bằng
  // request.result — FakeRequest ở đây expose result qua onsuccess target.
  return new AssetStore({ idb: new FakeFactory(), dbName: `test-y3-${tag}` });
}

function textFile(content: string, name: string, type = "text/plain"): File {
  return new File([content], name, { type });
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

await test("hằng min-display = 500 ms", () => {
  eq(IMPORT_BANNER_MIN_DISPLAY_MS, 500, "IMPORT_BANNER_MIN_DISPLAY_MS");
});

await test("one-shot: hashing giữ ≥ 500 ms trước storing, manifest + blob đúng", async () => {
  const store = makeStore("min-display");
  const events: { ev: IngestProgressEvent; at: number }[] = [];
  const t0 = Date.now();
  const manifest = await store.ingestWithProgress(textFile("hello-y3", "hello.txt"), {}, (ev) => {
    events.push({ ev, at: Date.now() });
  });
  const total = Date.now() - t0;
  eq(manifest.size, 8, "manifest.size");
  const phases = events.map((e) => e.ev.phase);
  assert(phases.includes("hashing"), `thiếu phase hashing (có: ${phases.join(",")})`);
  assert(phases.includes("storing"), `thiếu phase storing (có: ${phases.join(",")})`);
  assert(phases.includes("done"), `thiếu phase done (có: ${phases.join(",")})`);
  const firstHash = events.find((e) => e.ev.phase === "hashing")!;
  const storing = events.find((e) => e.ev.phase === "storing")!;
  const held = storing.at - firstHash.at;
  console.log(`    (giữ hashing ${held} ms, tổng ingest ${total} ms)`);
  assert(held >= 450, `banner hashing chỉ giữ ${held} ms, muốn ≥ 450 (danh nghĩa 500)`);
  assert(total < 10000, `ingest quá chậm: ${total} ms`);
  const blob = await store.getBlob(manifest.assetId);
  assert(blob !== null, "getBlob trả null sau ingest");
  eq(blob!.size, 8, "blob.size sau ingest");
});

await test("không callback: ingest nhanh, không bị pad 500 ms", async () => {
  const store = makeStore("no-callback");
  const t0 = Date.now();
  const manifest = await store.ingestWithProgress(textFile("nocb", "nocb.txt"), {});
  const total = Date.now() - t0;
  console.log(`    (ingest không callback ${total} ms)`);
  eq(manifest.size, 4, "manifest.size");
  assert(total < 5000, `ingest không callback quá chậm: ${total} ms`);
});

await test("băm lỗi: reject nhanh, không chờ pad 500 ms", async () => {
  const store = makeStore("fail-fast");
  const bad = {
    size: 10,
    type: "text/plain",
    arrayBuffer: async (): Promise<ArrayBuffer> => {
      throw new Error("đọc blob lỗi (giả lập)");
    },
  } as unknown as Blob;
  const t0 = Date.now();
  let threw = false;
  try {
    await store.ingestWithProgress(bad, {}, () => {});
  } catch (e) {
    threw = true;
    assert(String((e as Error).message).includes("đọc blob lỗi"), `lỗi lạ: ${(e as Error).message}`);
  }
  const total = Date.now() - t0;
  console.log(`    (ingest lỗi reject sau ${total} ms)`);
  assert(threw, "ingest blob lỗi phải reject");
  assert(total < 5000, `đường lỗi quá chậm: ${total} ms`);
});

await test("GOP/S4: file 140 MiB vẫn bị khóa khỏi đường GOP (import không bị khóa)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: 140 * 1024 * 1024,
  });
  eq(d.useGop, false, "file > 128 MiB phải useGop=false");
  assert(d.reason.includes("gop-large-file-locked"), `reason lạ: ${d.reason}`);
  const ok = resolveGopRangeWiring({ enabled: true, knownSizeBytes: 100 * 1024 * 1024 });
  eq(ok.useGop, true, "file 100 MiB vẫn dùng được GOP (đối chứng, cổng không bị nới)");
});

console.log(`\ningestMinDisplay43Y3: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
