/**
 * relinkDedup38U3.test.ts — Test cho đợt 38 luồng U3: relink tay ingest +
 * dedup cùng bytes khác tên qua alias (không đổi src clip sang `asset:`).
 *
 * Chạy trực tiếp, không cần trình duyệt:
 *   node apps/web/src/lib/relinkDedup38U3.test.ts
 * (chạy từ gốc repo; cần Node có type-stripping, như các test .test.ts
 * khác. File này nằm trong tsconfig exclude như mọi file .test.ts dùng
 * import `.ts`.)
 *
 * Phạm vi test:
 * - planRehydrate (rehydrate36S5): src bí danh khớp qua `aliases`
 *   (via "alias"); tên thật luôn thắng alias trùng tên; tên lạ vẫn skipped.
 * - rehydrateMediaItems: item khôi phục qua alias mang file thật với
 *   file.name == src clip (bất biến để export/render map theo tên).
 * - AssetStore thật + fake IndexedDB gọn (chỉ surface AssetStore dùng):
 *   ingest cùng bytes dưới tên khác trả manifest cũ (dedup), addAlias
 *   ghi tên bí danh, addAlias từ chối alias trùng originalName của asset
 *   khác / asset không tồn tại, addAlias lặp không nhân đôi, và plan
 *   dùng đúng manifest list() trả về.
 */
import { AssetStore, sha256Hex } from "./assetStore.ts";
import type { AssetManifest, IDBFactoryLike } from "./assetStore.ts";
import { planRehydrate, rehydrateMediaItems } from "./rehydrate36S5.ts";
import type { RehydrateDeps } from "./rehydrate36S5.ts";

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

// ---------------------------------------------------------------------------
// Fake IndexedDB gọn — chỉ surface AssetStore dùng (mẫu assetStore.test.ts)
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
  private records = new Map<unknown, Record<string, unknown>>();
  private indexes = new Map<string, IndexDef>();
  private readonly keyPath: string | undefined;
  constructor(keyPath?: string) {
    this.keyPath = keyPath;
  }
  createIndex(name: string, keyPath: string, opts?: { unique?: boolean }): void {
    this.indexes.set(name, { keyPath, unique: !!opts?.unique });
  }
  index(name: string): {
    get: (key: unknown) => FakeRequest;
  } {
    const def = this.indexes.get(name);
    if (!def) throw new Error(`Không có index "${name}".`);
    const store = this;
    return {
      get(key: unknown): FakeRequest {
        const r = new FakeRequest();
        queueMicrotask(() => {
          for (const rec of store.records.values()) {
            if (rec[def.keyPath] === key) {
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
            if (k !== primary && other[def.keyPath] === rec[def.keyPath]) {
              const e = new Error("Unique index vi phạm.");
              e.name = "ConstraintError";
              throw e;
            }
          }
        }
        this.records.set(primary, rec);
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
  transaction(names: string[], _mode: string): {
    objectStore: (name: string) => FakeStore;
  } {
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

function manifest(over: Partial<AssetManifest> & { assetId: string }): AssetManifest {
  return {
    originalName: "anh.png",
    sha256: "00".repeat(32),
    size: 10,
    mimeType: "image/png",
    kind: "image",
    ingestedAt: "2026-11-02T00:00:00.000Z",
    refCount: 0,
    ...over,
  };
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

// ---------------------------------------------------------------------------
// planRehydrate qua alias
// ---------------------------------------------------------------------------

await test("plan: src bí danh khớp qua aliases (via alias)", () => {
  const m = manifest({ assetId: "a_abc", aliases: ["anh (1).png"] });
  const plan = planRehydrate(["anh (1).png"], [m]);
  eq(plan.candidates.length, 1, "số candidate");
  eq(plan.candidates[0].via, "alias", "via");
  eq(plan.candidates[0].assetId, "a_abc", "assetId");
  eq(plan.skipped.length, 0, "skipped");
});

await test("plan: tên thật thắng alias trùng tên (không che asset khác)", () => {
  const real = manifest({ assetId: "a_real", originalName: "b.png", sha256: "11".repeat(32) });
  const other = manifest({
    assetId: "a_other",
    originalName: "a.png",
    sha256: "22".repeat(32),
    aliases: ["b.png"],
  });
  const plan = planRehydrate(["b.png"], [real, other]);
  eq(plan.candidates.length, 1, "số candidate");
  eq(plan.candidates[0].via, "bare-name", "via phải là tên thật");
  eq(plan.candidates[0].assetId, "a_real", "assetId phải là asset tên thật");
});

await test("plan: tên lạ không alias vẫn skipped (không che media thiếu thật)", () => {
  const m = manifest({ assetId: "a_abc", aliases: ["anh (1).png"] });
  const plan = planRehydrate(["khong-ton-tai.png"], [m]);
  eq(plan.candidates.length, 0, "số candidate");
  eq(plan.skipped.length, 1, "skipped");
});

await test("plan: asset: và bare-name không đổi khi có alias", () => {
  const m = manifest({ assetId: "a_abc", aliases: ["anh (1).png"] });
  const plan = planRehydrate(["asset:a_abc", "anh.png"], [m]);
  eq(plan.candidates.length, 2, "số candidate");
  eq(plan.candidates[0].via, "asset", "via asset:");
  eq(plan.candidates[1].via, "bare-name", "via bare-name");
});

// ---------------------------------------------------------------------------
// rehydrate qua alias: item mang file thật, file.name == src
// ---------------------------------------------------------------------------

await test("rehydrate alias: item.name == src, file.name == src, bytes đúng", async () => {
  const m = manifest({ assetId: "a_abc", aliases: ["anh (1).png"] });
  const blob = new Blob([PNG_BYTES], { type: "image/png" });
  const deps: RehydrateDeps = {
    listManifests: async () => [m],
    loadBlob: async (id) => (id === "a_abc" ? blob : null),
    makeObjectURL: () => "blob:test-alias",
  };
  const spec = {
    tracks: [{ clips: [{ kind: "image", src: "anh (1).png" }] }],
  };
  const res = await rehydrateMediaItems(deps, spec);
  eq(res.items.length, 1, "số item");
  eq(res.items[0].name, "anh (1).png", "item.name");
  eq(res.items[0].file?.name, "anh (1).png", "file.name phải bằng src (bất biến export)");
  eq(res.items[0].file?.size, PNG_BYTES.length, "file.size");
  eq(res.failedSrcs.length, 0, "failedSrcs");
});

// ---------------------------------------------------------------------------
// AssetStore thật + fake IDB: dedup ingest → addAlias → plan khớp
// ---------------------------------------------------------------------------

await test("AssetStore: dedup cùng bytes + addAlias bền qua list()", async () => {
  const store = new AssetStore({ idb: new FakeIDBFactory(), dbName: "u3-test" });
  const blob1 = new Blob([PNG_BYTES], { type: "image/png" });
  const blob2 = new Blob([PNG_BYTES], { type: "image/png" });
  const first = await store.ingest(blob1, { name: "anh.png" });
  const second = await store.ingest(blob2, { name: "anh (1).png" });
  eq(second.assetId, first.assetId, "dedup phải trả cùng assetId");
  eq(second.originalName, "anh.png", "dedup trả manifest cũ (tên đầu)");
  eq(await store.addAlias(first.assetId, "anh (1).png"), true, "addAlias");
  eq(await store.addAlias(first.assetId, "anh (1).png"), true, "addAlias lặp vẫn true");
  const listed = await store.list();
  eq(listed.length, 1, "chỉ 1 manifest sau dedup");
  eq((listed[0].aliases ?? []).includes("anh (1).png"), true, "aliases chứa tên bí danh");
  eq((listed[0].aliases ?? []).length, 1, "không nhân đôi alias");
  const plan = planRehydrate(["anh (1).png"], listed);
  eq(plan.candidates.length, 1, "plan khớp qua alias từ list()");
  eq(plan.candidates[0].via, "alias", "via alias");
  // sha256 thật của bytes test phải khớp manifest (không bịa hash)
  eq(first.sha256, await sha256Hex(blob1), "sha256 manifest == hash thật");
});

await test("AssetStore: addAlias từ chối tên thật của asset khác + asset lạ", async () => {
  const store = new AssetStore({ idb: new FakeIDBFactory(), dbName: "u3-test2" });
  const a = await store.ingest(new Blob([PNG_BYTES], { type: "image/png" }), { name: "a.png" });
  const otherBytes = new Uint8Array([9, 8, 7, 6]);
  const b = await store.ingest(new Blob([otherBytes], { type: "image/png" }), { name: "b.png" });
  eq(await store.addAlias(a.assetId, "b.png"), false, "alias trùng tên thật asset khác");
  eq(await store.addAlias("a_khongton", "x.png"), false, "asset không tồn tại");
  eq(await store.addAlias(a.assetId, "a.png"), false, "alias trùng tên chính mình");
  eq(await store.addAlias(b.assetId, ""), false, "alias rỗng");
  const listed = await store.list();
  eq((listed.find((m) => m.assetId === a.assetId)?.aliases ?? []).length, 0, "không ghi alias bị từ chối");
});

// ---------------------------------------------------------------------------

console.log(`\nrelinkDedup38U3: ${pass} pass, ${fail} fail`);
if (failedNames.length > 0) console.log(`FAILED: ${failedNames.join(", ")}`);
process.exitCode = fail > 0 ? 1 : 0;
