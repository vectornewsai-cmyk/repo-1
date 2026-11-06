/**
 * relink39T5.test.ts — Test cho Phase 9 đợt 39 luồng T5: relink/alias bền
 * vững (đóng nợ §5 mục 6 của docs/PHASE9_ROUND38_LIMITS.md).
 *
 * Chạy trực tiếp, không cần trình duyệt:
 *   node apps/web/src/lib/relink39T5.test.ts
 * (chạy từ gốc repo; cần Node có type-stripping, như các test .test.ts
 * khác. File này nằm trong tsconfig exclude như mọi file .test.ts dùng
 * import `.ts`.)
 *
 * Phạm vi test:
 * - Băm tăng dần: Sha256Incremental == crypto.subtle.digest trên dữ
 *   liệu ngẫu nhiên nhiều độ dài (kể cả biên 55/56/64 byte của padding)
 *   và hashBlobIncremental báo tiến trình đơn điệu, chốt đúng tổng byte.
 * - ingestWithProgress: manifest đúng hash WebCrypto, sự kiện đi qua
 *   hashing → storing → done; dedup lần 2 trả cùng assetId.
 * - Race alias: 10 addAlias song song (gồm trùng lặp) trên cùng asset
 *   đều sống sót, không nhân đôi; hai addAliases song song cũng vậy;
 *   guard cũ (trùng tên thật asset khác / tên chính mình / rỗng) vẫn giữ.
 * - Cleanup: alias trùng tên thật xuất hiện SAU khi alias được ghi (kịch
 *   bản alias tạo trước guard) bị dọn, alias thật khác được giữ, báo cáo
 *   đếm đúng; cleanup lần 2 không còn gì để dọn.
 * - Legacy một lần: project cũ ingest trước đợt 38 (manifest không
 *   alias) → ingest lại cùng bytes dưới tên cũ + addAlias (đường
 *   relinkMedia đợt 39) → planRehydrate khớp tên cũ qua alias.
 * - ingestImportedItemWithProgress: dùng đường có tiến trình khi store
 *   có method, fallback đúng khi store không có method.
 */
import { AssetStore } from "./assetStore.ts";
import type { IDBFactoryLike } from "./assetStore.ts";
import { planRehydrate } from "./rehydrate36S5.ts";
import {
  hashBlobIncremental,
  ingestPercent,
  Sha256Incremental,
} from "./ingestProgress39T5.ts";
import type { IngestProgressEvent } from "./ingestProgress39T5.ts";
import {
  ingestImportedItemWithProgress,
} from "./importAsset37T3.ts";

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
// Fake IndexedDB gọn — chỉ surface AssetStore dùng (mẫu relinkDedup38U3)
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

function newStore(): AssetStore {
  return new AssetStore({ idb: new FakeIDBFactory() });
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
// 1. Băm tăng dần
// ---------------------------------------------------------------------------

await test("sha256 tăng dần == WebCrypto (nhiều độ dài, lát lẻ 7 byte)", async () => {
  const { webcrypto } = await import("node:crypto");
  const lengths = [0, 1, 3, 55, 56, 63, 64, 65, 119, 1000, 100000];
  for (const n of lengths) {
    const data = pseudoRandomBytes(n, 1234 + n);
    const want = Buffer.from(await webcrypto.subtle.digest("SHA-256", data)).toString("hex");
    const h = new Sha256Incremental();
    for (let i = 0; i < data.length; i += 7) {
      h.update(data.subarray(i, Math.min(data.length, i + 7)));
    }
    eq(h.digest(), want, `hash độ dài ${n}`);
  }
});

await test("hashBlobIncremental: tiến trình đơn điệu, chốt đúng tổng byte", async () => {
  const data = pseudoRandomBytes(5 * 1024 * 1024 + 123, 99);
  const blob = new Blob([data as unknown as BlobPart]);
  const events: IngestProgressEvent[] = [];
  const hex = await hashBlobIncremental(blob, (ev) => events.push(ev), 1024 * 1024);
  const { webcrypto } = await import("node:crypto");
  const want = Buffer.from(await webcrypto.subtle.digest("SHA-256", data)).toString("hex");
  eq(hex, want, "hash blob 5MB");
  ok(events.length === 6, `số sự kiện (5MB + 123B, lát 1MB) = ${events.length}, muốn 6`);
  for (let i = 1; i < events.length; i++) {
    ok(events[i].bytesDone > events[i - 1].bytesDone, "bytesDone tăng đơn điệu");
    eq(events[i].phase, "hashing", "pha hashing");
  }
  eq(events[events.length - 1].bytesDone, blob.size, "sự kiện cuối = tổng byte");
  eq(ingestPercent(events[events.length - 1]), 100, "percent cuối = 100");
});

// ---------------------------------------------------------------------------
// 2. ingestWithProgress
// ---------------------------------------------------------------------------

await test("ingestWithProgress hybrid: file nhỏ dùng WebCrypto, 1 sự kiện hashing chốt 100%", async () => {
  const store = newStore();
  const data = pseudoRandomBytes(1024 * 1024 + 5, 77);
  const blob = blobOf(data, "nho.mp4");
  const events: IngestProgressEvent[] = [];
  const m = await store.ingestWithProgress(blob, { name: "nho.mp4" }, (ev) => events.push(ev));
  const { webcrypto } = await import("node:crypto");
  const want = Buffer.from(await webcrypto.subtle.digest("SHA-256", data)).toString("hex");
  eq(m.sha256, want, "hash file nhỏ đúng");
  const hashing = events.filter((e) => e.phase === "hashing");
  eq(hashing.length, 1, "chỉ 1 sự kiện hashing (nhánh WebCrypto)");
  eq(hashing[0].bytesDone, blob.size, "hashing chốt đủ tổng byte");
  eq(events.map((e) => e.phase).join(","), "hashing,storing,done", "thứ tự pha");
});

await test("ingestWithProgress chunked: file > 64 MiB băm theo lát, nhiều sự kiện hashing", async () => {
  const store = newStore();
  const data = pseudoRandomBytes(65 * 1024 * 1024 + 11, 78);
  const blob = blobOf(data, "lon.mp4");
  const events: IngestProgressEvent[] = [];
  const m = await store.ingestWithProgress(blob, { name: "lon.mp4" }, (ev) => events.push(ev));
  const { webcrypto } = await import("node:crypto");
  const want = Buffer.from(await webcrypto.subtle.digest("SHA-256", data)).toString("hex");
  eq(m.sha256, want, "hash file lớn đúng");
  const hashing = events.filter((e) => e.phase === "hashing");
  eq(hashing.length, 9, `số lát băm (65 MiB / 8 MiB) = ${hashing.length}, muốn 9`);
  eq(hashing[hashing.length - 1].bytesDone, blob.size, "lát cuối đủ tổng byte");
});

await test("ingestWithProgress: hash đúng, pha hashing→storing→done, dedup (file 3 MB, nhánh WebCrypto)", async () => {
  const store = newStore();
  const data = pseudoRandomBytes(3 * 1024 * 1024 + 17, 7);
  const blob = blobOf(data, "clip-a.mp4");
  const events: IngestProgressEvent[] = [];
  const m1 = await store.ingestWithProgress(blob, { name: "clip-a.mp4" }, (ev) =>
    events.push(ev),
  );
  const { webcrypto } = await import("node:crypto");
  const want = Buffer.from(await webcrypto.subtle.digest("SHA-256", data)).toString("hex");
  eq(m1.sha256, want, "sha manifest");
  eq(m1.originalName, "clip-a.mp4", "originalName");
  const phases = events.map((e) => e.phase);
  ok(phases.includes("hashing") && phases.includes("storing"), `pha có hashing+storing: ${phases.join(",")}`);
  eq(phases[phases.length - 1], "done", "pha cuối là done");
  eq(events[events.length - 1].bytesDone, blob.size, "done đủ tổng byte");
  // Dedup: cùng bytes dưới tên khác → cùng assetId, không ghi blob mới.
  const m2 = await store.ingestWithProgress(blobOf(data, "clip-b.mp4"), { name: "clip-b.mp4" });
  eq(m2.assetId, m1.assetId, "dedup cùng assetId");
  eq((await store.list()).length, 1, "chỉ 1 manifest");
});

// ---------------------------------------------------------------------------
// 3. Race alias
// ---------------------------------------------------------------------------

await test("race: 10 addAlias song song cùng asset đều sống sót, không nhân đôi", async () => {
  const store = newStore();
  const data = pseudoRandomBytes(1000, 5);
  const m = await store.ingest(blobOf(data, "goc.mp4"), { name: "goc.mp4" });
  const names = ["a.mp4", "b.mp4", "c.mp4", "a.mp4", "d.mp4", "b.mp4", "e.mp4", "f.mp4", "g.mp4", "h.mp4"];
  // KHÔNG await từng cái — bắn song song như hai đường gọi đồng thời.
  const results = await Promise.all(names.map((n) => store.addAlias(m.assetId, n)));
  ok(results.every((r) => r === true), "mọi addAlias đều true");
  const after = await store.get(m.assetId);
  const aliases = [...(after?.aliases ?? [])].sort();
  eq(aliases.join(","), "a.mp4,b.mp4,c.mp4,d.mp4,e.mp4,f.mp4,g.mp4,h.mp4", "đủ 8 alias duy nhất");
});

await test("race: hai addAliases song song không mất alias của nhau", async () => {
  const store = newStore();
  const m = await store.ingest(blobOf(pseudoRandomBytes(500, 6), "goc2.mp4"), { name: "goc2.mp4" });
  // Hai batch song song: mỗi batch chụp snapshot `before` lúc bắt đầu nên
  // cùng đếm x2 là "mới" là đúng ngữ nghĩa theo-batch; bất biến quan
  // trọng là tập alias cuối đủ 5 và không trùng lặp.
  await Promise.all([
    store.addAliases(m.assetId, ["x1.mp4", "x2.mp4", "x3.mp4"]),
    store.addAliases(m.assetId, ["y1.mp4", "y2.mp4", "x2.mp4"]),
  ]);
  const after = await store.get(m.assetId);
  eq([...(after?.aliases ?? [])].sort().join(","), "x1.mp4,x2.mp4,x3.mp4,y1.mp4,y2.mp4", "đủ 5 alias");
  // Đếm theo-batch được kiểm tra ở chế độ tuần tự (không đua snapshot):
  const n3 = await store.addAliases(m.assetId, ["y2.mp4", "z1.mp4"]);
  eq(n3, 1, "batch tuần tự sau đó chỉ ghi mới z1");
});

await test("guard addAlias vẫn giữ sau khi tuần tự hoá", async () => {
  const store = newStore();
  const m1 = await store.ingest(blobOf(pseudoRandomBytes(100, 11), "that.mp4"), { name: "that.mp4" });
  const m2 = await store.ingest(blobOf(pseudoRandomBytes(100, 12), "khac.mp4"), { name: "khac.mp4" });
  eq(await store.addAlias(m2.assetId, "that.mp4"), false, "từ chối alias trùng tên thật asset khác");
  eq(await store.addAlias(m2.assetId, "khac.mp4"), false, "từ chối alias trùng tên chính mình");
  eq(await store.addAlias(m2.assetId, ""), false, "từ chối alias rỗng");
  eq(await store.addAlias("a_khongton", "z.mp4"), false, "từ chối asset không tồn tại");
  eq(await store.addAlias(m1.assetId, "that.mp4"), false, "từ chối alias = tên chính mình");
});

// ---------------------------------------------------------------------------
// 4. Cleanup alias thừa
// ---------------------------------------------------------------------------

await test("cleanup: alias trùng tên thật xuất hiện sau thì bị dọn, alias lành giữ lại", async () => {
  const store = newStore();
  const mA = await store.ingest(blobOf(pseudoRandomBytes(200, 21), "a.mp4"), { name: "a.mp4" });
  // Ghi alias "nick.mp4" khi chưa có asset nào tên đó (hợp lệ lúc ghi).
  eq(await store.addAlias(mA.assetId, "nick.mp4"), true, "ghi alias nick");
  eq(await store.addAlias(mA.assetId, "lanh.mp4"), true, "ghi alias lành");
  // Sau đó ingest bytes khác dưới đúng tên "nick.mp4" → alias cũ thành thừa.
  await store.ingest(blobOf(pseudoRandomBytes(200, 22), "nick.mp4"), { name: "nick.mp4" });
  const report = await store.cleanupStaleAliases();
  eq(report.scanned, 2, "quét 2 manifest");
  eq(report.cleaned, 1, "dọn 1 manifest");
  eq(report.removed.length, 1, "xoá 1 alias");
  eq(report.removed[0].alias, "nick.mp4", "alias bị xoá là nick.mp4");
  const afterA = await store.get(mA.assetId);
  eq((afterA?.aliases ?? []).join(","), "lanh.mp4", "chỉ còn alias lành");
  // Cleanup lần 2: không còn gì.
  const report2 = await store.cleanupStaleAliases();
  eq(report2.removed.length, 0, "lần 2 không xoá thêm");
  eq(report2.cleaned, 0, "lần 2 cleaned = 0");
});

// ---------------------------------------------------------------------------
// 5. Legacy một lần + helper ingest có tiến trình
// ---------------------------------------------------------------------------

await test("legacy một lần: project cũ (không alias) relink một lần rồi khớp qua alias", async () => {
  const store = newStore();
  // Mô phỏng ingest trước đợt 38: bytes đã bền dưới tên gốc, chưa alias.
  const data = pseudoRandomBytes(4096, 31);
  const m = await store.ingest(blobOf(data, "goc-cu.mp4"), { name: "goc-cu.mp4" });
  eq(((await store.get(m.assetId))?.aliases ?? []).join(","), "", "trước relink chưa có alias");
  // Project cũ có clip trỏ tên "ten-cu.mp4" (cùng bytes, khác tên) → trước
  // relink, plan không khớp tên đó.
  const planBefore = planRehydrate(["ten-cu.mp4"], await store.list());
  eq(planBefore.candidates.length, 0, "trước relink không khớp");
  eq(planBefore.skipped.length, 1, "trước relink bị skipped");
  // Đường relink một lần (như relinkMedia đợt 39): ingest lại cùng bytes
  // dưới tên cũ (dedup → manifest gốc) + ghi alias cho tên cũ.
  const relinked = await store.ingest(blobOf(data, "ten-cu.mp4"), { name: "ten-cu.mp4" });
  eq(relinked.assetId, m.assetId, "dedup về manifest gốc");
  eq(await store.addAlias(m.assetId, "ten-cu.mp4"), true, "ghi alias tên cũ");
  const planAfter = planRehydrate(["ten-cu.mp4"], await store.list());
  eq(planAfter.candidates.length, 1, "sau relink khớp 1 candidate");
  eq(planAfter.candidates[0].via, "alias", "khớp qua alias");
  eq(planAfter.candidates[0].assetId, m.assetId, "đúng asset gốc");
});

await test("ingestImportedItemWithProgress: có tiến trình khi store hỗ trợ, fallback khi không", async () => {
  const store = newStore();
  const item = {
    file: blobOf(pseudoRandomBytes(2 * 1024 * 1024 + 3, 41), "p.mp4"),
    name: "p.mp4",
  };
  const events: IngestProgressEvent[] = [];
  const res = await ingestImportedItemWithProgress(store, item, (ev) => events.push(ev));
  eq(res.progressUsed, true, "dùng đường có tiến trình");
  ok(res.manifest !== null, "có manifest");
  eq(res.nameMismatch, false, "không mismatch (tên đầu)");
  ok(events.some((e) => e.phase === "hashing"), "có sự kiện hashing");
  eq(events[events.length - 1].phase, "done", "sự kiện cuối done");
  // Store cũ không có ingestWithProgress → fallback, vẫn ra manifest.
  const legacyStore = {
    ingest: (blob: Blob, meta: { name?: string }) => store.ingest(blob, meta),
  };
  const res2 = await ingestImportedItemWithProgress(legacyStore, item, () => {});
  eq(res2.progressUsed, false, "fallback progressUsed = false");
  ok(res2.manifest !== null, "fallback vẫn có manifest");
  eq(res2.manifest?.assetId, res.manifest?.assetId, "fallback dedup cùng asset");
});

console.log(`\nrelink39T5: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join("; ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
