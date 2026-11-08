/**
 * binOrphan60Q7.test.ts — Phase 9 đợt 60, luồng Q7: dọn bytes IndexedDB
 * mồ côi khi xóa media khỏi bin + race debounce 5s khi replaceProject
 * (đóng nợ đợt 59 P1 §5.1 + §5.2).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping; có top-level await):
 *   node apps/web/src/lib/binOrphan60Q7.test.ts
 * (chạy từ gốc repo; mẫu binPersist59P1.test.ts. File nằm trong tsconfig
 * exclude như mọi file .test.ts dùng import `.ts`.)
 *
 * Ba tầng:
 *  (A) Quyết định thuần `planOrphanBytesDeletion` — không cần IDB/DOM.
 *  (B) Bytes thật: AssetStore thật + FakeIDB in-memory (copy mẫu
 *      assetStore.test.ts — chỉ implement đúng surface AssetStore dùng)
 *      + crypto.subtle thật; "reload" = instance AssetStore mới trên
 *      cùng factory (cùng DB nền) sau khi xóa.
 *  (C) Race debounce với timer thật (AUTOSAVE_DEBOUNCE_MS = 5000):
 *      C-R1 là test ĐỎ-TRƯỚC cho fix `autosaveNow` hủy timer chờ —
 *      chạy trên code cũ (chưa sửa projectRepo.ts) thì FAIL vì timer
 *      cũ ghi đè envelope mới; sau fix thì PASS. C-R2 khóa cửa sổ của
 *      pattern cũ (autosave không binMedia trước rehydrate): PASS cả
 *      trước và sau fix — nó ghi lại cửa sổ nguy hiểm để khỏi ai tái
 *      dùng pattern đó. C-R3 khóa dãy mới của openProjectFileFlow
 *      (autosaveNow + autosaveNow kèm binMedia): không timer chờ nào
 *      có thể ghi đè envelope đúng sau 5s.
 */
import {
  collectClipSrcs,
  deleteOrphanBinBytes,
  planOrphanBytesDeletion,
  type OrphanBytesAction,
} from "./binOrphan60Q7.ts";
import { AssetStore, type IDBFactoryLike } from "./assetStore.ts";
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_KEY,
  autosave,
  autosaveNow,
  clearAutosave,
  type BinMediaEntry,
} from "./projectRepo.ts";

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

function eqJson(a: unknown, b: unknown, msg: string): void {
  eq(JSON.stringify(a), JSON.stringify(b), msg);
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** localStorage giả tối thiểu (mẫu binPersist59P1.test.ts). */
function installMockStorage(): Map<string, string> {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  return store;
}

function readEnvelope(store: Map<string, string>): Record<string, unknown> {
  const raw = store.get(AUTOSAVE_KEY);
  assert(raw !== undefined, "autosave đã được ghi");
  return JSON.parse(raw) as Record<string, unknown>;
}

/** Spec đầy đủ tối thiểu để serializeProject/autosaveNow ghi được envelope. */
function sampleSpec(): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name: "du-an-mau", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [{ kind: "video", id: "c1", src: "mau-1.webm", start: 0, duration: 4, in: 0, out: 4 }],
      },
      {
        id: "t1",
        kind: "text",
        clips: [
          {
            kind: "text",
            id: "c-text",
            text: "Xin chào",
            start: 0.5,
            duration: 5,
            style: {
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 72,
              color: "#ffffff",
              bold: true,
              italic: false,
              x: 0.5,
              y: 0.32,
              animation: "fadeUp",
            },
          },
        ],
      },
    ],
  };
}

const BIN: BinMediaEntry[] = [
  { assetId: "a_1111111111111111", name: "mau-1.webm" },
  { assetId: "a_2222222222222222", name: "mau-2.webm" },
];

// ---------------------------------------------------------------------------
// Fake IndexedDB tối thiểu (copy mẫu assetStore.test.ts — chỉ surface
// mà AssetStore dùng: open/deleteDatabase, transaction/objectStore,
// put/get/getAll/delete/clear, index().get()).
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
// (A) Quyết định thuần planOrphanBytesDeletion
// ---------------------------------------------------------------------------

const EMPTY_SPEC = { tracks: [] };
const A1 = "a_1111111111111111";
const A2 = "a_2222222222222222";

function mediaOf(
  items: Array<{ id: string; name: string; assetId?: string }>,
): Array<{ id: string; name: string; assetId?: string }> {
  return items;
}

await test("plan: bin-only có assetId, không clip, không chia sẻ → delete-bytes", () => {
  const p: OrphanBytesAction = planOrphanBytesDeletion(
    EMPTY_SPEC,
    mediaOf([{ id: "m1", name: "a.webm", assetId: A1 }]),
    "m1",
  );
  eq(p.action, "delete-bytes", "verdict");
  if (p.action === "delete-bytes") eq(p.assetId, A1, "đúng assetId cần xóa");
});

await test("plan: item không có assetId → keep-bytes (no-asset-id)", () => {
  const p = planOrphanBytesDeletion(EMPTY_SPEC, mediaOf([{ id: "m1", name: "a.webm" }]), "m1");
  eq(p.action, "keep-bytes", "verdict");
  if (p.action === "keep-bytes") eq(p.reason, "no-asset-id", "lý do");
});

await test("plan: assetId rỗng → keep-bytes (no-asset-id)", () => {
  const p = planOrphanBytesDeletion(
    EMPTY_SPEC,
    mediaOf([{ id: "m1", name: "a.webm", assetId: "" }]),
    "m1",
  );
  eq(p.action, "keep-bytes", "verdict");
  if (p.action === "keep-bytes") eq(p.reason, "no-asset-id", "lý do");
});

await test("plan: clip dùng src asset: (cấp cao) → block-removal, đếm đúng clip", () => {
  const spec = {
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [{ kind: "video", id: "c1", src: `asset:${A1}`, start: 0, duration: 4 }],
      },
    ],
  };
  const p = planOrphanBytesDeletion(spec, mediaOf([{ id: "m1", name: "a.webm", assetId: A1 }]), "m1");
  eq(p.action, "block-removal", "verdict");
  if (p.action === "block-removal") {
    eq(p.reason, "clip-uses-asset-src", "lý do");
    eq(p.clipCount, 1, "1 clip dùng");
  }
});

await test("plan: clip dùng src asset: trong nested → block-removal, đếm đủ 2 clip", () => {
  const inner = {
    tracks: [
      {
        id: "iv1",
        kind: "video",
        clips: [
          { kind: "video", id: "c1", src: `asset:${A1}`, start: 0, duration: 2 },
          { kind: "video", id: "c2", src: `asset:${A1}`, start: 2, duration: 2 },
        ],
      },
    ],
  };
  const spec = {
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [{ kind: "nested", id: "n1", start: 0, duration: 4, subSpec: inner }],
      },
    ],
  };
  const p = planOrphanBytesDeletion(spec, mediaOf([{ id: "m1", name: "a.webm", assetId: A1 }]), "m1");
  eq(p.action, "block-removal", "verdict");
  if (p.action === "block-removal") eq(p.clipCount, 2, "đếm cả 2 clip trong nested");
});

await test("plan: clip dùng asset: khác → delete-bytes (không chặn nhầm)", () => {
  const spec = {
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [{ kind: "video", id: "c1", src: `asset:${A2}`, start: 0, duration: 4 }],
      },
    ],
  };
  const p = planOrphanBytesDeletion(spec, mediaOf([{ id: "m1", name: "a.webm", assetId: A1 }]), "m1");
  eq(p.action, "delete-bytes", "verdict");
});

await test("plan: hai item chung assetId (dedup) → keep-bytes shared", () => {
  const p = planOrphanBytesDeletion(
    EMPTY_SPEC,
    mediaOf([
      { id: "m1", name: "a.webm", assetId: A1 },
      { id: "m2", name: "a-copy.webm", assetId: A1 },
    ]),
    "m1",
  );
  eq(p.action, "keep-bytes", "verdict");
  if (p.action === "keep-bytes") eq(p.reason, "shared-with-other-bin-item", "lý do");
});

await test("plan: mediaId lạ → not-found", () => {
  const p = planOrphanBytesDeletion(
    EMPTY_SPEC,
    mediaOf([{ id: "m1", name: "a.webm", assetId: A1 }]),
    "m-la",
  );
  eq(p.action, "not-found", "verdict");
});

await test("plan: clip dùng tên thô (không phải asset:) không bị plan chặn — chặn theo tên nằm ở store", () => {
  const spec = {
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [{ kind: "video", id: "c1", src: "a.webm", start: 0, duration: 4 }],
      },
    ],
  };
  // Plan chỉ bổ sung chặn asset:/chia sẻ; chặn theo tên là việc của
  // removeMediaFromBin (findMissingAssets) và chạy trước khi gọi plan.
  const p = planOrphanBytesDeletion(spec, mediaOf([{ id: "m1", name: "a.webm", assetId: A1 }]), "m1");
  eq(p.action, "delete-bytes", "plan không chặn theo tên");
});

await test("plan: collectClipSrcs quét đủ src cấp cao + nested, khử trùng", () => {
  const inner = {
    tracks: [
      {
        id: "iv1",
        kind: "video",
        clips: [{ kind: "video", id: "c1", src: "trong.mp4", start: 0, duration: 2 }],
      },
    ],
  };
  const spec = {
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [
          { kind: "video", id: "c1", src: "ngoai.mp4", start: 0, duration: 2 },
          { kind: "video", id: "c2", src: "ngoai.mp4", start: 2, duration: 2 },
          { kind: "nested", id: "n1", start: 0, duration: 4, subSpec: inner },
          { kind: "text", id: "t1", text: "x", start: 0, duration: 1 },
        ],
      },
    ],
  };
  eqJson(collectClipSrcs(spec), ["ngoai.mp4", "trong.mp4"], "đủ src, khử trùng, bỏ text clip");
});

// ---------------------------------------------------------------------------
// (B) Bytes thật qua AssetStore + FakeIDB (+ "reload" = instance mới)
// ---------------------------------------------------------------------------

await test("bytes: ingest rồi xóa → getBlob/get/list/stats đều hết; instance mới (reload) vẫn hết", async () => {
  const fake = new FakeIDBFactory();
  const store = new AssetStore({ idb: fake });
  const m = await store.ingest(new Blob(["bytes-aaa-123"], { type: "video/webm" }), { name: "a.webm" });
  assert((await store.getBlob(m.assetId)) !== null, "trước xóa: blob còn");
  eq((await store.stats()).assets, 1, "trước xóa: 1 asset");
  eq(await deleteOrphanBinBytes(store, m.assetId), true, "remove trả true");
  eq(await store.getBlob(m.assetId), null, "sau xóa: getBlob null");
  eq(await store.get(m.assetId), null, "sau xóa: get null");
  eq((await store.list()).length, 0, "sau xóa: list rỗng");
  eqJson(await store.stats(), { assets: 0, bytes: 0 }, "sau xóa: stats 0");
  // "Reload": instance mới trên cùng factory (cùng DB nền) vẫn không thấy bytes.
  const reloaded = new AssetStore({ idb: fake });
  eq(await reloaded.getBlob(m.assetId), null, "reload: getBlob vẫn null");
  eq(await reloaded.get(m.assetId), null, "reload: get vẫn null");
});

await test("bytes: xóa 1 trong 2 asset → asset còn lại nguyên vẹn (blob + manifest + stats)", async () => {
  const fake = new FakeIDBFactory();
  const store = new AssetStore({ idb: fake });
  const m1 = await store.ingest(new Blob(["bytes-mot"], { type: "video/webm" }), { name: "mot.webm" });
  const m2 = await store.ingest(new Blob(["bytes-hai-khac"], { type: "video/webm" }), { name: "hai.webm" });
  eq(await deleteOrphanBinBytes(store, m1.assetId), true, "xóa m1 trả true");
  eq(await store.getBlob(m1.assetId), null, "m1 đã hết");
  const blob2 = await store.getBlob(m2.assetId);
  assert(blob2 !== null, "m2 còn blob");
  eq(blob2!.size, 14, "m2 đủ bytes (\"bytes-hai-khac\" = 14 byte)");
  eq((await store.get(m2.assetId))?.originalName, "hai.webm", "m2 còn manifest");
  eq((await store.stats()).assets, 1, "chỉ còn 1 asset");
});

await test("bytes: xóa asset không tồn tại → false, không throw", async () => {
  const fake = new FakeIDBFactory();
  const store = new AssetStore({ idb: fake });
  eq(await deleteOrphanBinBytes(store, "a_khongco00000000"), false, "remove trả false");
});

await test("bytes: store ném lỗi → false, không throw (best-effort)", async () => {
  const throwing = {
    remove: async (_id: string): Promise<boolean> => {
      throw new Error("IDB bị chặn");
    },
  };
  eq(await deleteOrphanBinBytes(throwing, "a_1111111111111111"), false, "nuốt lỗi, trả false");
});

// ---------------------------------------------------------------------------
// (C) Race debounce 5s — timer thật
// ---------------------------------------------------------------------------

await test("race C-R1: autosave() cũ + autosaveNow() mới → envelope mới thắng sau 5s (ĐỎ-TRƯỚC khi chưa sửa)", async () => {
  const storage = installMockStorage();
  clearAutosave();
  const spec = sampleSpec();
  // Lên lịch ghi hoãn với payload CŨ (không binMedia), rồi ghi ngay
  // với payload MỚI (có binMedia) — đúng thứ tự afterFix/load-O6 gặp
  // khi user sửa ngay sau một lần đổi spec. Timer cũ mà bắn sau sẽ
  // ghi đè envelope mới bằng payload cũ.
  autosave(spec as never, "Du an A");
  autosaveNow(spec as never, "Du an B", undefined, BIN);
  await sleep(AUTOSAVE_DEBOUNCE_MS + 600);
  const raw = readEnvelope(storage);
  eq(raw["name"], "Du an B", "envelope sau 5s vẫn là bản mới");
  eqJson(raw["binMedia"], BIN, "envelope sau 5s vẫn mang binMedia mới");
});

await test("race C-R2: pattern cũ (autosave không binMedia trước rehydrate) để lại cửa sổ thiếu binMedia ~5s", async () => {
  const storage = installMockStorage();
  clearAutosave();
  const spec = sampleSpec();
  // Mô phỏng đúng pattern cũ ở openProjectFileFlow: autosave() KHÔNG
  // kèm binMedia rồi rehydrate "chậm" hơn 5s mới xong.
  autosave(spec as never, "Du an mo-file");
  await sleep(AUTOSAVE_DEBOUNCE_MS + 600);
  const landed = readEnvelope(storage);
  assert(!("binMedia" in landed), "lần ghi hoãn cũ đã đáp xuống mà không có binMedia");
  // Rehydrate xong, effect ghi lại đúng — nhưng phải chờ thêm 1 chu kỳ
  // debounce nữa; 0,3s sau khi lên lịch, envelope vẫn thiếu binMedia.
  autosave(spec as never, "Du an mo-file", undefined, BIN);
  await sleep(300);
  const windowOpen = readEnvelope(storage);
  assert(!("binMedia" in windowOpen), "cửa sổ xấu còn mở: reload lúc này mất bin-only");
  clearAutosave(); // dọn timer corrective còn chờ để khỏi nhiễu test sau
});

await test("race C-R3: dãy mới (autosaveNow + autosaveNow kèm binMedia) — không timer chờ nào ghi đè sau 5s", async () => {
  const storage = installMockStorage();
  clearAutosave();
  const spec = sampleSpec();
  // Mô phỏng dãy mới ở openProjectFileFlow: ghi ngay sau khi mở, rồi
  // ghi ngay kèm binMedia sau khi rehydrate xong — không lên lịch
  // debounce nào, nên không có lần ghi cũ nào chờ bắn.
  autosaveNow(spec as never, "Du an mo-file");
  await sleep(100);
  autosaveNow(spec as never, "Du an mo-file", undefined, BIN);
  await sleep(AUTOSAVE_DEBOUNCE_MS + 600);
  const raw = readEnvelope(storage);
  eqJson(raw["binMedia"], BIN, "sau 5s envelope vẫn mang binMedia đúng");
});

console.log(
  `\nbinOrphan60Q7: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
);
process.exitCode = fail > 0 ? 1 : 0;
