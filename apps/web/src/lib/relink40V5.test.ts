/**
 * relink40V5.test.ts — Test cho Phase 9 đợt 40, luồng V5: relink/alias
 * (đóng nợ §5 mục 5 của docs/PHASE9_ROUND39_LIMITS.md).
 *
 * Chạy trực tiếp, không cần trình duyệt:
 *   node apps/web/src/lib/relink40V5.test.ts
 * (chạy từ gốc repo; cần Node có type-stripping, như các test .test.ts
 * khác. File này nằm trong tsconfig exclude như mọi file .test.ts dùng
 * import `.ts`.)
 *
 * Phạm vi test:
 * - Đua alias LIÊN NGỮ CẢNH (mô phỏng 2 tab): hai AssetStore khác
 *   instance, chung một FakeIDBFactory (chung DB) + chung
 *   FakeLockManager (mô phỏng Web Locks theo origin) → 4 addAlias
 *   xen kẽ đều sống sót, tên lock đúng `vcut-alias:<assetId>`.
 * - Đối chứng KHÔNG lock: cùng kịch bản nhưng không có lock provider
 *   → ghi rõ kết quả quan sát được (xem LIMITS: fake IDB có tái hiện
 *   mất alias hay không, và vì sao bằng chứng này không thay được
 *   chứng minh đa tab trên Chromium thật).
 * - Lock throw → op vẫn chạy không khoá (fallback best-effort, không
 *   làm hỏng ghi alias); hàng đợi trong-tab vẫn giữ khi lock lỗi.
 * - Helper tiến trình mà importFiles đợt 40 dùng
 *   (`ingestImportedItemWithProgress`): gọi tuần tự 2 file (file 2
 *   cùng bytes, tên khác) → progressUsed true, sự kiện hashing →
 *   storing → done cho từng file, file 2 báo nameMismatch true
 *   (để importFiles ghi alias cho tên đó — đúng đường dedup đợt 38).
 * - Guard sau khi thêm lock: alias trùng tên thật asset khác vẫn bị
 *   từ chối ngay cả khi đi qua lock.
 *
 * KHÔNG test ở đây (cần trình duyệt thật, xem LIMITS đợt 40 V5):
 * click-test panel tiến trình import, đo ghi đĩa IDB Chromium thật,
 * đua alias giữa 2 tab Chromium thật.
 */
import { AssetStore } from "./assetStore.ts";
import type { IDBFactoryLike, LockManagerLike } from "./assetStore.ts";
import { ingestImportedItemWithProgress } from "./importAsset37T3.ts";
import type { IngestProgressEvent } from "./ingestProgress39T5.ts";

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
    console.log(`  ✗ ${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function eq(a: unknown, b: unknown, msg: string): void {
  if (a !== b) throw new Error(`${msg}: nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

function ok(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`sai: ${msg}`);
}

// ---------------------------------------------------------------------------
// Fake IndexedDB gọn — chỉ surface AssetStore dùng (mẫu relink39T5)
// ---------------------------------------------------------------------------

type Handler = ((ev: unknown) => void) | null;

class FakeRequest {
  result: unknown = undefined;
  error: unknown = null;
  onsuccess: Handler = null;
  onerror: Handler = null;
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

class FakeOpenRequest extends FakeRequest {
  onupgradeneeded: Handler = null;
  _upgrade(db: unknown): void {
    this.result = db;
    queueMicrotask(() => {
      if (this.onupgradeneeded) this.onupgradeneeded({ target: this });
      queueMicrotask(() => {
        if (this.onsuccess) this.onsuccess({ target: this });
      });
    });
  }
}

interface IndexDef {
  keyPath: string;
  unique: boolean;
}

class FakeStore {
  private records = new Map<unknown, unknown>();
  private indexes = new Map<string, IndexDef>();
  private readonly keyPath: string | undefined;
  constructor(keyPath?: string) {
    this.keyPath = keyPath;
  }
  createIndex(name: string, keyPath: string, opts?: { unique?: boolean }): void {
    this.indexes.set(name, { keyPath, unique: !!opts?.unique });
  }
  index(name: string): { get: (key: unknown) => FakeRequest } {
    const def = this.indexes.get(name);
    if (!def) throw new Error(`Không có index "${name}".`);
    const store = this;
    return {
      get(key: unknown): FakeRequest {
        const r = new FakeRequest();
        queueMicrotask(() => {
          for (const rec of store.records.values()) {
            const row = rec as Record<string, unknown>;
            if (row[def.keyPath] === key) {
              r._ok(rec);
              return;
            }
          }
          r._ok(undefined);
        });
        return r;
      },
    };
  }
  put(value: unknown, key?: unknown): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      try {
        const rec = value as Record<string, unknown>;
        const primary = key !== undefined ? key : this.keyPath ? rec[this.keyPath] : undefined;
        if (primary === undefined) throw new Error("put thiếu key.");
        for (const def of this.indexes.values()) {
          if (!def.unique) continue;
          for (const [k, other] of this.records) {
            const o = other as Record<string, unknown>;
            if (k !== primary && o[def.keyPath] === rec[def.keyPath]) {
              const e = new Error("Unique index vi phạm.");
              e.name = "ConstraintError";
              throw e;
            }
          }
        }
        this.records.set(primary, value);
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
      this.records.delete(key);
      r._ok(undefined);
    });
    return r;
  }
  clear(): FakeRequest {
    const r = new FakeRequest();
    queueMicrotask(() => {
      this.records.clear();
      r._ok(undefined);
    });
    return r;
  }
}

class FakeDB {
  private stores = new Map<string, FakeStore>();
  readonly objectStoreNames = {
    contains: (name: string): boolean => this.stores.has(name),
  };
  createObjectStore(name: string, opts?: { keyPath?: string }): FakeStore {
    const s = new FakeStore(opts?.keyPath);
    this.stores.set(name, s);
    return s;
  }
  transaction(_names: string[], _mode: string): { objectStore: (name: string) => FakeStore } {
    const db = this;
    return {
      objectStore(name: string): FakeStore {
        const s = db.stores.get(name);
        if (!s) throw new Error(`Không có store "${name}".`);
        return s;
      },
    };
  }
  close(): void {}
}

/**
 * Một factory = một "origin" chia sẻ: mọi AssetStore dùng CHUNG factory
 * này thấy cùng một FakeDB — mô phỏng 2 tab cùng origin mở chung IDB.
 */
class FakeIDBFactory implements IDBFactoryLike {
  private db: FakeDB | null = null;
  open(_name: string, _version?: number): IDBOpenDBRequest {
    const req = new FakeOpenRequest();
    queueMicrotask(() => {
      if (!this.db) {
        this.db = new FakeDB();
        req._upgrade(this.db);
      } else {
        req._ok(this.db);
      }
    });
    return req as unknown as IDBOpenDBRequest;
  }
  deleteDatabase(_name: string): IDBOpenDBRequest {
    const req = new FakeRequest();
    queueMicrotask(() => {
      this.db = null;
      req._ok(undefined);
    });
    return req as unknown as IDBOpenDBRequest;
  }
}

/**
 * Fake Web Locks theo origin: chuỗi promise theo tên lock, CHIA SẺ
 * giữa các instance (một đối tượng FakeLockManager = một origin).
 * Ghi lại tên lock đã xin để test assert đúng tên.
 */
class FakeLockManager implements LockManagerLike {
  private chains = new Map<string, Promise<void>>();
  readonly requestedNames: string[] = [];
  async request<T>(name: string, callback: () => Promise<T> | T): Promise<T> {
    this.requestedNames.push(name);
    const prev = this.chains.get(name) ?? Promise.resolve();
    const run = prev.then(callback);
    this.chains.set(
      name,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run;
  }
}

class ThrowingLockManager implements LockManagerLike {
  async request<T>(_name: string, _callback: () => Promise<T> | T): Promise<T> {
    throw new Error("lock bị abort (mô phỏng trình duyệt lạ)");
  }
}

function blobOf(bytes: Uint8Array, name: string): Blob {
  const b = new Blob([bytes as unknown as BlobPart], { type: "video/mp4" });
  Object.defineProperty(b, "name", { value: name });
  return b;
}

function pseudoRandomBytes(n: number, seed: number): Uint8Array {
  const out = new Uint8Array(n);
  let x = seed >>> 0;
  for (let i = 0; i < n; i++) {
    x = (x * 1664525 + 1013904223) >>> 0;
    out[i] = (x >>> 24) & 0xff;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. Đua alias liên ngữ cảnh với Web Locks
// ---------------------------------------------------------------------------

await test("liên ngữ cảnh + lock: 2 store chung DB, 4 addAlias xen kẽ đều sống sót", async () => {
  const factory = new FakeIDBFactory();
  const locks = new FakeLockManager();
  const tabA = new AssetStore({ idb: factory, locks });
  const tabB = new AssetStore({ idb: factory, locks });
  const m = await tabA.ingest(blobOf(pseudoRandomBytes(1000, 5), "goc.mp4"), { name: "goc.mp4" });
  // Hai "tab" thấy cùng manifest (tabB đọc được asset tabA ingest).
  eq((await tabB.get(m.assetId))?.originalName, "goc.mp4", "tabB thấy asset tabA");
  const results = await Promise.all([
    tabA.addAlias(m.assetId, "a.mp4"),
    tabB.addAlias(m.assetId, "b.mp4"),
    tabA.addAlias(m.assetId, "c.mp4"),
    tabB.addAlias(m.assetId, "d.mp4"),
  ]);
  ok(results.every((r) => r === true), "mọi addAlias đều true");
  const after = await tabA.get(m.assetId);
  eq([...(after?.aliases ?? [])].sort().join(","), "a.mp4,b.mp4,c.mp4,d.mp4", "đủ 4 alias");
  ok(
    locks.requestedNames.every((n) => n === `vcut-alias:${m.assetId}`),
    `tên lock đúng vcut-alias:<assetId>, nhận ${locks.requestedNames.join(",")}`,
  );
  eq(locks.requestedNames.length, 4, "mỗi addAlias xin lock 1 lần");
});

await test("liên ngữ cảnh + lock: cleanup tab này không xoá alias tab kia vừa ghi (đọc tươi trong lock)", async () => {
  const factory = new FakeIDBFactory();
  const locks = new FakeLockManager();
  const tabA = new AssetStore({ idb: factory, locks });
  const tabB = new AssetStore({ idb: factory, locks });
  const m = await tabA.ingest(blobOf(pseudoRandomBytes(200, 21), "a.mp4"), { name: "a.mp4" });
  await tabA.addAlias(m.assetId, "nick.mp4");
  // Tab B ingest bytes khác dưới tên "nick.mp4" → alias tab A thành thừa.
  await tabB.ingest(blobOf(pseudoRandomBytes(200, 22), "nick.mp4"), { name: "nick.mp4" });
  const report = await tabA.cleanupStaleAliases();
  eq(report.removed.length, 1, "dọn đúng 1 alias thừa");
  eq(report.removed[0].alias, "nick.mp4", "alias bị dọn là nick.mp4");
  eq(((await tabB.get(m.assetId))?.aliases ?? []).join(","), "", "tabB thấy manifest đã dọn");
});

await test("đối chứng không lock: 2 store chung DB, 4 addAlias xen kẽ (ghi rõ kết quả quan sát)", async () => {
  const factory = new FakeIDBFactory();
  // Cố tình KHÔNG truyền locks → mô phỏng trình duyệt không có Web Locks.
  const tabA = new AssetStore({ idb: factory });
  const tabB = new AssetStore({ idb: factory });
  const m = await tabA.ingest(blobOf(pseudoRandomBytes(1000, 6), "goc.mp4"), { name: "goc.mp4" });
  await Promise.all([
    tabA.addAlias(m.assetId, "a.mp4"),
    tabB.addAlias(m.assetId, "b.mp4"),
    tabA.addAlias(m.assetId, "c.mp4"),
    tabB.addAlias(m.assetId, "d.mp4"),
  ]);
  const after = await tabA.get(m.assetId);
  const aliases = [...(after?.aliases ?? [])].sort();
  // Kết quả này được IN ra để LIMITS ghi đúng số quan sát được, không
  // assert cứng số lượng: thứ tự microtask của fake IDB có thể khác
  // IDB thật, nhưng nếu mất alias thì đó là bằng chứng đua còn mở
  // khi không có lock; nếu đủ 4 thì chỉ chứng tỏ fake IDB đã tuần tự
  // hoá ngầm, không chứng minh được an toàn liên tab thật.
  console.log(`    (không lock, fake IDB: aliases cuối = [${aliases.join(",")}], ${aliases.length}/4)`);
  ok(aliases.length >= 1, "ít nhất 1 alias được ghi (test đối chứng không crash)");
});

await test("lock throw → op vẫn chạy không khoá, hàng đợi trong-tab vẫn giữ", async () => {
  const factory = new FakeIDBFactory();
  const store = new AssetStore({ idb: factory, locks: new ThrowingLockManager() });
  const m = await store.ingest(blobOf(pseudoRandomBytes(500, 7), "goc.mp4"), { name: "goc.mp4" });
  eq(await store.addAlias(m.assetId, "x.mp4"), true, "addAlias vẫn true dù lock throw");
  eq(await store.addAlias(m.assetId, "y.mp4"), true, "addAlias thứ hai vẫn true");
  eq(
    [...((await store.get(m.assetId))?.aliases ?? [])].sort().join(","),
    "x.mp4,y.mp4",
    "cả hai alias đều sống sót nhờ hàng đợi trong-tab",
  );
});

await test("guard vẫn giữ khi đi qua lock (alias trùng tên thật asset khác)", async () => {
  const factory = new FakeIDBFactory();
  const locks = new FakeLockManager();
  const store = new AssetStore({ idb: factory, locks });
  const m1 = await store.ingest(blobOf(pseudoRandomBytes(100, 11), "that.mp4"), { name: "that.mp4" });
  const m2 = await store.ingest(blobOf(pseudoRandomBytes(100, 12), "khac.mp4"), { name: "khac.mp4" });
  eq(await store.addAlias(m2.assetId, "that.mp4"), false, "từ chối alias trùng tên thật asset khác");
  eq(await store.addAlias(m2.assetId, ""), false, "từ chối alias rỗng");
  eq(((await store.get(m2.assetId))?.aliases ?? []).join(","), "", "không alias nào được ghi");
});

// ---------------------------------------------------------------------------
// 2. Helper tiến trình mà importFiles đợt 40 dùng, theo từng file
// ---------------------------------------------------------------------------

await test("importFiles helper: 2 file tuần tự, file 2 dedup báo nameMismatch + pha đủ", async () => {
  const factory = new FakeIDBFactory();
  const store = new AssetStore({ idb: factory });
  const data = pseudoRandomBytes(2 * 1024 * 1024 + 3, 41);
  const files = [
    { file: blobOf(data, "p.mp4"), name: "p.mp4" },
    { file: blobOf(data, "p-copy.mp4"), name: "p-copy.mp4" },
  ];
  for (let idx = 0; idx < files.length; idx++) {
    const events: IngestProgressEvent[] = [];
    const res = await ingestImportedItemWithProgress(store, files[idx], (ev) => events.push(ev));
    eq(res.progressUsed, true, `file ${idx}: dùng đường có tiến trình`);
    ok(res.manifest !== null, `file ${idx}: có manifest`);
    eq(events[events.length - 1].phase, "done", `file ${idx}: sự kiện cuối done`);
    ok(events.some((e) => e.phase === "hashing"), `file ${idx}: có hashing`);
    ok(events.some((e) => e.phase === "storing"), `file ${idx}: có storing`);
    if (idx === 0) eq(res.nameMismatch, false, "file 1 không mismatch");
    else eq(res.nameMismatch, true, "file 2 cùng bytes tên khác → mismatch (importFiles sẽ ghi alias)");
    eq(events[events.length - 1].bytesDone, files[idx].file.size, `file ${idx}: done đủ tổng byte`);
  }
  eq((await store.list()).length, 1, "dedup: chỉ 1 manifest cho 2 file cùng bytes");
});

console.log(`\nrelink40V5: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join("; ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
