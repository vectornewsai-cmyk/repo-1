/**
 * projectId63R7.test.ts — Test thật cho projectId ổn định + khóa sổ theo
 * id + lock chặn stale giữa các lượt sync (Phase 9 đợt 63, luồng R7 —
 * đóng nợ đợt 62 R7 §6.2/§6.3/§6.4).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/projectId63R7.test.ts
 *
 * Dùng AssetStore thật; chỉ IndexedDB là fake in-memory (FakeIDBFactory
 * + FakeLocks, copy verbatim mẫu projectAssetRefs62R7.test.ts — cùng
 * một fake, không sửa ngữ nghĩa) và localStorage là fake cho cổng
 * autosave.
 *
 * NỘI DUNG:
 *  A. projectId thuần: sinh/kiểm tra/khóa sổ/migration.
 *  B. Envelope .vcut qua projectRepo thật: serialize/parse giữ id,
 *     file cũ thiếu id → migration sinh mới + warning, autosave giữ id.
 *  C. Sổ tham chiếu khóa theo id: hai file TRÙNG TÊN khác id không còn
 *     ghi đè lẫn nhau (lỗi đợt 62 R7 §6.2 — ghi sau thắng theo tên).
 *  D. Generation / optimistic concurrency ở recordProjectRefs: lượt
 *     sync đọc generation cũ → bị từ chối stale, bản ghi giữ nguyên.
 *  E. Hai lượt sync CHỒNG NHAU qua recordCurrentProjectRefs (chung
 *     store + chung fake locks): đúng một lượt thắng, lượt thua stale,
 *     generation chỉ tăng 1.
 *  F. Scan/delete có sổ khóa theo id + bản ghi legacy khóa theo tên
 *     vẫn chặn như trước (tương thích ngược).
 */
import { SPEC_VERSION } from "@repo-1/video-spec";
import {
  AssetStore,
  type IDBFactoryLike,
} from "./assetStore.ts";
import {
  autosaveNow,
  loadAutosave,
  parseProjectText,
  serializeProject,
} from "./projectRepo.ts";
import {
  generateProjectId,
  isValidProjectId,
  projectIdFromKey,
  projectKeyForId,
  resolveEnvelopeProjectId,
} from "./projectId63R7.ts";
import { projectKeyForName } from "./projectAssetRefs62R7.ts";
import {
  deleteCleanupAsset,
  recordCurrentProjectRefs,
  scanStorageForCleanup,
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

/** Spec hợp lệ tối thiểu cho projectRepo (không track nào). */
function validSpec(name: string): Record<string, unknown> {
  return {
    version: SPEC_VERSION,
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [],
  };
}

function specWithClips(srcs: string[]): Record<string, unknown> {
  return {
    version: SPEC_VERSION,
    meta: { name: "Fixture project-id", width: 1280, height: 720, fps: 30 },
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
    version: SPEC_VERSION,
    meta: { name: "Fixture project-id", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "t1",
        kind: "text",
        clips: [{ kind: "text", id: "x1", text: "Chào", start: 0, duration: 3 }],
      },
    ],
  };
}

/** localStorage fake tối thiểu cho cổng autosave của projectRepo. */
class FakeLocalStorage {
  private readonly m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v);
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
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

function freshStore(shared?: FakeIDBFactory): { store: AssetStore; factory: FakeIDBFactory } {
  const factory = shared ?? new FakeIDBFactory();
  return { store: new AssetStore({ idb: factory }), factory };
}

async function main(): Promise<void> {
  // Cài localStorage fake TRƯỚC mọi gọi autosave/loadAutosave (projectRepo
  // chạm bare `localStorage` trong try/catch nên không cài vẫn không crash,
  // nhưng không cài thì cổng autosave không ghi/đọc được gì để đo).
  (globalThis as unknown as { localStorage?: unknown }).localStorage = new FakeLocalStorage();

  console.log("== A. projectId thuần ==");
  await test("A1: generateProjectId → UUID hợp lệ, 100 id phân biệt", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generateProjectId();
      assert(isValidProjectId(id), `id sinh ra phải hợp lệ: ${id}`);
      ids.add(id);
    }
    eq(ids.size, 100, "100 id sinh ra phải phân biệt");
  });
  await test("A2: isValidProjectId — UUID/fallback ok; file-/rỗng/số thì không", () => {
    assert(isValidProjectId("123e4567-e89b-42d3-a456-426614174000"), "UUID v4 hợp lệ");
    assert(isValidProjectId("proj-mkq1a2b3-c4d5e6"), "fallback proj- hợp lệ");
    assert(!isValidProjectId(""), "rỗng không hợp lệ");
    assert(!isValidProjectId("file-abcdef123456-Du_an"), "id lịch sử file-... KHÔNG hợp lệ (đổi theo hash spec)");
    assert(!isValidProjectId("Dự án mới"), "tên project không phải id");
    assert(!isValidProjectId(null), "null không hợp lệ");
    assert(!isValidProjectId(42), "số không hợp lệ");
    assert(!isValidProjectId("123e4567-e89b-42d3-a456"), "UUID thiếu đoạn không hợp lệ");
  });
  await test("A3: projectKeyForId → id:<uuid>; id lạ → throw", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    eq(projectKeyForId(id), `id:${id}`, "khóa theo id");
    let threw = false;
    try {
      projectKeyForId("file-abc");
    } catch {
      threw = true;
    }
    assert(threw, "id không hợp lệ phải throw thay vì ghi khóa rác");
  });
  await test("A4: projectIdFromKey — khóa id → id; khóa name/lạ → null", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    eq(projectIdFromKey(`id:${id}`), id, "khóa id phân giải được");
    eq(projectIdFromKey("name:Dự án B"), null, "khóa legacy name: → null");
    eq(projectIdFromKey("khac:xyz"), null, "khóa lạ → null");
    eq(projectIdFromKey("id:khong-phai-uuid"), null, "id: + chuỗi lạ → null");
  });
  await test("A5: resolveEnvelopeProjectId — có id thì giữ; thiếu/lạ thì sinh mới + migrated", () => {
    const id = generateProjectId();
    const keep = resolveEnvelopeProjectId(id);
    eq(keep.projectId, id, "id hợp lệ được giữ nguyên");
    eq(keep.migrated, false, "không migration");
    const m1 = resolveEnvelopeProjectId(undefined);
    assert(m1.migrated, "thiếu id → migrated");
    assert(isValidProjectId(m1.projectId), "id mới sinh phải hợp lệ");
    const m2 = resolveEnvelopeProjectId("file-abc-123");
    assert(m2.migrated, "id lạ (file-...) → migrated");
    assert(m2.projectId !== "file-abc-123", "id lạ bị thay bằng id mới");
    const m3 = resolveEnvelopeProjectId(undefined);
    assert(m3.projectId !== m1.projectId, "hai lần migration sinh hai id khác nhau");
  });

  console.log("== B. Envelope .vcut (projectRepo thật) ==");
  await test("B1: serialize có projectId → parse giữ nguyên id, migrated=false, 0 warning migration", () => {
    const id = generateProjectId();
    const { json } = serializeProject(validSpec("Dự án A") as never, "Dự án A", undefined, undefined, id);
    const raw = JSON.parse(json) as Record<string, unknown>;
    eq(raw["projectId"], id, "envelope mang projectId");
    const res = parseProjectText(json);
    assert(res.ok && res.spec, "parse ok");
    eq(res.projectId, id, "parse giữ nguyên id");
    eq(res.projectIdMigrated, false, "không migration");
    assert(!res.warnings.some((w) => w.includes("mã project")), "không có warning migration");
  });
  await test("B2: serialize không truyền id → envelope thiếu field; parse → migrated + warning", () => {
    const { json } = serializeProject(validSpec("Dự án A") as never, "Dự án A");
    const raw = JSON.parse(json) as Record<string, unknown>;
    eq(raw["projectId"], undefined, "không truyền id thì envelope không mang field (hành vi cũ)");
    const res = parseProjectText(json);
    assert(res.ok, "parse ok");
    eq(res.projectIdMigrated, true, "file thiếu id → migrated");
    assert(isValidProjectId(res.projectId), "id migration sinh ra phải hợp lệ");
    assert(res.warnings.some((w) => w.includes("mã project")), "có warning báo migration");
    // Quy ước đợt 31 N4: warning nào cũng có dạng cấu trúc để
    // buildLoadReport trừ fallback khỏi otherWarnings.
    const note = res.structuredNotes.find((n) => n.code === "projectIdMigrated");
    assert(note, "có structured note projectIdMigrated");
    assert(res.warnings.includes(note?.fallback ?? ""), "fallback của note phải trùng warning chuỗi");
  });
  await test("B3: envelope cũ viết tay (không có projectId) → migrated + id mới hợp lệ", () => {
    const old = JSON.stringify({
      format: "vcut-project",
      formatVersion: 1,
      appVersion: "0.1.0",
      specVersion: SPEC_VERSION,
      savedAt: new Date().toISOString(),
      name: "Dự án cũ",
      spec: validSpec("Dự án cũ"),
    });
    const res = parseProjectText(old);
    assert(res.ok, "file cũ vẫn mở được");
    eq(res.projectIdMigrated, true, "file cũ → migrated");
    assert(isValidProjectId(res.projectId), "id mới hợp lệ");
  });
  await test("B4: envelope mang projectId lạ (file-...) → migrated, id lạ bị thay", () => {
    const { json } = serializeProject(validSpec("Dự án A") as never, "Dự án A", undefined, undefined, "file-abcdef123456-Du_an");
    const raw = JSON.parse(json) as Record<string, unknown>;
    eq(raw["projectId"], undefined, "serialize không ghi id lạ vào envelope");
    const tampered = JSON.stringify({ ...JSON.parse(json), projectId: "file-abcdef123456-Du_an" });
    const res = parseProjectText(tampered);
    assert(res.ok, "parse ok");
    eq(res.projectIdMigrated, true, "id lạ → migrated");
    assert(res.projectId !== "file-abcdef123456-Du_an", "id lạ bị thay");
    assert(isValidProjectId(res.projectId), "id mới hợp lệ");
  });
  await test("B5: spec trần (không envelope) → migrated + id mới hợp lệ", () => {
    const res = parseProjectText(JSON.stringify(validSpec("Dự án trần")));
    assert(res.ok, "spec trần vẫn mở được");
    eq(res.projectIdMigrated, true, "spec trần → migrated");
    assert(isValidProjectId(res.projectId), "id mới hợp lệ");
  });
  await test("B6: ổn định qua 2 vòng serialize/parse — id không đổi, lần 2 không migration", () => {
    const id = generateProjectId();
    const first = serializeProject(validSpec("Dự án A") as never, "Dự án A", undefined, undefined, id);
    const r1 = parseProjectText(first.json);
    const second = serializeProject(r1.spec as never, r1.name, undefined, undefined, r1.projectId);
    const r2 = parseProjectText(second.json);
    eq(r2.projectId, id, "id bền vững qua 2 vòng lưu/mở");
    eq(r2.projectIdMigrated, false, "lần 2 không migration nữa");
  });
  await test("B7: file hỏng (JSON sai) → ok=false, projectId rỗng", () => {
    const res = parseProjectText("{không phải json");
    eq(res.ok, false, "file hỏng → ok=false");
    eq(res.projectId, "", "cổng fail không đặt id");
    eq(res.projectIdMigrated, false, "cổng fail không migration");
  });
  await test("B8: autosave giữ id — ghi có id thì load lại đúng id; ghi thiếu id thì migration", () => {
    const id = generateProjectId();
    autosaveNow(validSpec("Dự án A") as never, "Dự án A", undefined, undefined, id);
    const loaded = loadAutosave();
    assert(loaded !== null, "autosave đọc được");
    eq(loaded.projectId, id, "autosave giữ nguyên id");
    eq(loaded.projectIdMigrated, false, "autosave có id → không migration");
    autosaveNow(validSpec("Dự án A") as never, "Dự án A");
    const loaded2 = loadAutosave();
    assert(loaded2 !== null, "autosave thiếu id vẫn đọc được");
    eq(loaded2.projectIdMigrated, true, "autosave thiếu id → migration");
    assert(isValidProjectId(loaded2.projectId), "id migration hợp lệ");
  });

  console.log("== C. Sổ tham chiếu khóa theo id (trùng tên không còn ghi đè) ==");
  await test("C1: hai file TRÙNG TÊN khác id → hai bản ghi riêng; ghi B không đè tập của A", async () => {
    const { store } = freshStore();
    const idA = generateProjectId();
    const idB = generateProjectId();
    assert(idA !== idB, "hai id sinh ra khác nhau");
    await store.recordProjectRefs(projectKeyForId(idA), "Dự án mới", ["a_x", "a_y"], { projectId: idA });
    await store.recordProjectRefs(projectKeyForId(idB), "Dự án mới", ["a_z"], { projectId: idB });
    const recs = await store.listProjectRefs();
    eq(recs.length, 2, "sổ có 2 bản ghi (trước đợt 63 chỉ có 1 vì chung khóa name:)");
    const recA = recs.find((r) => r.projectKey === projectKeyForId(idA));
    const recB = recs.find((r) => r.projectKey === projectKeyForId(idB));
    assert(recA && recB, "đủ cả hai bản ghi");
    eq(recA.assetIds.join(","), "a_x,a_y", "tập của A còn nguyên sau khi B ghi (lỗi cũ: B ghi đè thành [a_z])");
    eq(recB.assetIds.join(","), "a_z", "tập của B đúng");
    eq(recA.projectId, idA, "bản ghi A persist id A");
    eq(recB.projectId, idB, "bản ghi B persist id B");
    const users = await store.getProjectsUsingAsset("a_x");
    eq(users.length, 1, "chỉ A dùng a_x");
    eq(users[0].projectKey, projectKeyForId(idA), "đúng bản ghi A");
  });
  await test("C2: lần ghi đầu → generation=1; ghi lại đúng tập → changed=false, generation không tăng", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    const r1 = await store.recordProjectRefs(projectKeyForId(id), "Dự án A", ["a_1"], { projectId: id });
    eq(r1.record.generation, 1, "lần ghi đầu generation=1");
    eq(r1.changed, true, "lần đầu changed=true");
    eq(r1.stale, false, "không stale");
    const r2 = await store.recordProjectRefs(projectKeyForId(id), "Dự án A", ["a_1"], { projectId: id });
    eq(r2.changed, false, "ghi lại đúng tập → changed=false");
    eq(r2.record.generation, 1, "không ghi lại nên generation không tăng");
  });
  await test("C3: ghi đổi tập → generation tăng 1 mỗi lần (1→2→3)", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    const key = projectKeyForId(id);
    await store.recordProjectRefs(key, "Dự án A", ["a_1"], { projectId: id });
    const r2 = await store.recordProjectRefs(key, "Dự án A", ["a_1", "a_2"], { projectId: id });
    eq(r2.record.generation, 2, "đổi tập lần 1 → gen 2");
    const r3 = await store.recordProjectRefs(key, "Dự án A", ["a_2"], { projectId: id });
    eq(r3.record.generation, 3, "đổi tập lần 2 → gen 3");
  });
  await test("C4: bản ghi legacy khóa theo tên vẫn tồn tại song song với bản ghi id cùng tên", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    await store.recordProjectRefs(projectKeyForName("Dự án mới"), "Dự án mới", ["a_old"]);
    await store.recordProjectRefs(projectKeyForId(id), "Dự án mới", ["a_new"], { projectId: id });
    const recs = await store.listProjectRefs();
    eq(recs.length, 2, "legacy + mới cùng tồn tại (không migration xóa bản ghi cũ)");
    const legacy = recs.find((r) => r.projectKey === projectKeyForName("Dự án mới"));
    assert(legacy, "bản ghi legacy còn đó");
    eq(legacy.projectId, undefined, "bản ghi legacy không có projectId");
    eq(legacy.generation, 1, "bản ghi legacy ghi bằng code mới vẫn có generation=1");
  });

  console.log("== D. Generation / optimistic concurrency (recordProjectRefs) ==");
  await test("D1: expectedGeneration đúng → ghi được, stale=false, gen+1", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    const key = projectKeyForId(id);
    const r1 = await store.recordProjectRefs(key, "Dự án A", ["a_1"], { projectId: id });
    const r2 = await store.recordProjectRefs(key, "Dự án A", ["a_1", "a_2"], { projectId: id, expectedGeneration: r1.record.generation });
    eq(r2.stale, false, "gen khớp → không stale");
    eq(r2.changed, true, "ghi đổi tập");
    eq(r2.record.generation, 2, "gen 1→2");
  });
  await test("D2: expectedGeneration cũ → stale=true, bản ghi giữ nguyên (tập + gen không đổi)", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    const key = projectKeyForId(id);
    await store.recordProjectRefs(key, "Dự án A", ["a_1"], { projectId: id });
    const winner = await store.recordProjectRefs(key, "Dự án A", ["a_1", "a_2"], { projectId: id, expectedGeneration: 1 });
    eq(winner.record.generation, 2, "lượt thắng lên gen 2");
    const stale = await store.recordProjectRefs(key, "Dự án A", ["a_9"], { projectId: id, expectedGeneration: 1 });
    eq(stale.stale, true, "đọc gen 1 trong khi bản ghi đã gen 2 → stale");
    eq(stale.changed, false, "stale thì không tính là changed");
    eq(stale.record.assetIds.join(","), "a_1,a_2", "bản ghi giữ tập của lượt thắng (không bị a_9 ghi đè)");
    eq(stale.record.generation, 2, "generation không tăng khi từ chối stale");
    const after = await store.listProjectRefs();
    eq(after[0].assetIds.join(","), "a_1,a_2", "đọc lại: tập lượt thắng còn nguyên");
  });
  await test("D3: stale vẫn thắng cả khi tập trùng nhau (kiểm tra stale trước shortcut)", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    const key = projectKeyForId(id);
    await store.recordProjectRefs(key, "Dự án A", ["a_1"], { projectId: id });
    await store.recordProjectRefs(key, "Dự án A", ["a_1", "a_2"], { projectId: id, expectedGeneration: 1 });
    const stale = await store.recordProjectRefs(key, "Dự án A", ["a_1", "a_2"], { projectId: id, expectedGeneration: 1 });
    eq(stale.stale, true, "tập trùng nhưng gen cũ → vẫn stale (kết luận 'không đổi' đã lỗi thời)");
    eq(stale.record.generation, 2, "generation không tăng");
  });
  await test("D4: không truyền expectedGeneration → ghi luôn như trước (tương thích caller cũ)", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    const key = projectKeyForId(id);
    await store.recordProjectRefs(key, "Dự án A", ["a_1"], { projectId: id });
    await store.recordProjectRefs(key, "Dự án A", ["a_1", "a_2"], { projectId: id });
    const r3 = await store.recordProjectRefs(key, "Dự án A", ["a_9"], { projectId: id });
    eq(r3.stale, false, "không truyền expected → không kiểm tra stale");
    eq(r3.record.generation, 3, "ghi luôn, gen tăng");
    eq(r3.record.assetIds.join(","), "a_9", "tập mới thắng");
  });
  await test("D5: expectedGeneration khi chưa có bản ghi → ghi được, gen=1", async () => {
    const { store } = freshStore();
    const id = generateProjectId();
    const r = await store.recordProjectRefs(projectKeyForId(id), "Dự án A", ["a_1"], { projectId: id, expectedGeneration: 0 });
    eq(r.stale, false, "chưa có bản ghi thì không có gì để stale");
    eq(r.record.generation, 1, "gen đầu = 1");
  });

  console.log("== E. Hai lượt sync chồng nhau (recordCurrentProjectRefs) ==");
  await test("E1: 2 sync song song khác tập → đúng 1 thắng, 1 stale; gen chỉ tăng 1; tập cuối = của lượt thắng", async () => {
    const factory = new FakeIDBFactory();
    const locks = new FakeLocks();
    const s = new AssetStore({ idb: factory, locks });
    const a = await s.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    const b = await s.ingest(new Blob(["bytes-b"], { type: "video/webm" }), { name: "b.webm" });
    const c = await s.ingest(new Blob(["bytes-c"], { type: "video/webm" }), { name: "c.webm" });
    const id = generateProjectId();
    const key = projectKeyForId(id);
    // Ghi nền gen=1 với tập THỨ BA [c] để cả hai lượt chồng nhau đều
    // thực sự muốn đổi bản ghi (lượt nào tính tập [a]/[b] cũng là
    // change, không có lượt nào no-op sẵn).
    await recordCurrentProjectRefs(s, specWithClips(["c.webm"]) as never, [], key, "Dự án A", id);
    const before = (await s.listProjectRefs()).find((r) => r.projectKey === key);
    eq(before?.generation, 1, "bản ghi nền gen=1");
    eq(before?.assetIds.join(","), c.assetId, "bản ghi nền tập [c]");
    // Hai lượt chồng nhau: lượt 1 tính từ spec [a.webm], lượt 2 tính
    // từ spec [b.webm] — cả hai cùng đọc gen 1.
    const [rep1, rep2] = await Promise.all([
      recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], key, "Dự án A", id),
      recordCurrentProjectRefs(s, specWithClips(["b.webm"]) as never, [], key, "Dự án A", id),
    ]);
    const winners = [rep1, rep2].filter((r) => !r.stale);
    const losers = [rep1, rep2].filter((r) => r.stale);
    eq(winners.length, 1, "đúng 1 lượt thắng");
    eq(losers.length, 1, "đúng 1 lượt stale");
    eq(losers[0].changed, false, "lượt thua không đổi gì");
    const after = (await s.listProjectRefs()).find((r) => r.projectKey === key);
    eq(after?.generation, 2, "generation chỉ tăng 1 (1→2), không tăng 2 lần");
    eq(after?.assetIds.join(","), [winners[0] === rep1 ? a.assetId : b.assetId].join(","), "tập cuối = tập của lượt thắng, không phải hợp của hai lượt");
  });
  await test("E2: sau khi thua stale, lượt sync sau đọc gen tươi → ghi được", async () => {
    const factory = new FakeIDBFactory();
    const locks = new FakeLocks();
    const s = new AssetStore({ idb: factory, locks });
    const a = await s.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    const b = await s.ingest(new Blob(["bytes-b"], { type: "video/webm" }), { name: "b.webm" });
    const id = generateProjectId();
    const key = projectKeyForId(id);
    await recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], key, "Dự án A", id);
    // Ép stale bằng cách ghi trực tiếp với gen cũ (mô phỏng lượt chồng nhau đã thắng trước).
    await s.recordProjectRefs(key, "Dự án A", [b.assetId], { projectId: id, expectedGeneration: 1 });
    // Lượt sync sau: đọc lại gen tươi (2) rồi ghi tập [a] → phải thắng.
    const rep = await recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], key, "Dự án A", id);
    eq(rep.stale, false, "đọc gen tươi thì không stale");
    eq(rep.changed, true, "tập đổi [b]→[a] nên changed");
    const after = (await s.listProjectRefs()).find((r) => r.projectKey === key);
    eq(after?.generation, 3, "gen 2→3");
    eq(after?.assetIds.join(","), a.assetId, "tập cuối = [a]");
  });
  await test("E3: 2 sync chồng nhau CÙNG tập mới → 1 thắng, 1 stale; 2 sync cùng tập cũ → cả hai no-op, không stale", async () => {
    const factory = new FakeIDBFactory();
    const locks = new FakeLocks();
    const s = new AssetStore({ idb: factory, locks });
    await s.ingest(new Blob(["bytes-a"], { type: "video/webm" }), { name: "a.webm" });
    const c = await s.ingest(new Blob(["bytes-c"], { type: "video/webm" }), { name: "c.webm" });
    const id = generateProjectId();
    const key = projectKeyForId(id);
    // Nền [c]; hai lượt cùng tính tập mới [a] → lượt vào lock sau stale.
    await recordCurrentProjectRefs(s, specWithClips(["c.webm"]) as never, [], key, "Dự án A", id);
    const [rep1, rep2] = await Promise.all([
      recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], key, "Dự án A", id),
      recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], key, "Dự án A", id),
    ]);
    const stales = [rep1, rep2].filter((r) => r.stale);
    eq(stales.length, 1, "đúng 1 lượt stale dù tập giống nhau");
    const after = (await s.listProjectRefs()).find((r) => r.projectKey === key);
    eq(after?.generation, 2, "gen 1→2 (một lần ghi thật)");
    eq(after?.assetIds.join(","), (await s.list()).find((m) => m.originalName === "a.webm")?.assetId ?? "", "tập cuối = [a]");
    void c;
    // Hai lượt cùng tính tập ĐANG CÓ [a] → cả hai no-op, không ai stale
    // (không có gì để ghi nên không có xung đột để chặn).
    const [rep3, rep4] = await Promise.all([
      recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], key, "Dự án A", id),
      recordCurrentProjectRefs(s, specWithClips(["a.webm"]) as never, [], key, "Dự án A", id),
    ]);
    eq([rep3, rep4].filter((r) => r.stale).length, 0, "cùng tập cũ → không lượt nào stale");
    eq([rep3, rep4].filter((r) => r.changed).length, 0, "cùng tập cũ → không lượt nào changed");
    const after2 = (await s.listProjectRefs()).find((r) => r.projectKey === key);
    eq(after2?.generation, 2, "no-op không tăng generation");
  });

  console.log("== F. Scan/delete có sổ khóa theo id + legacy ==");
  await test("F1: asset chỉ project khác (khóa id) dùng → scan khóa, delete từ chối cross-project", async () => {
    const { store } = freshStore();
    const orphan = await store.ingest(new Blob(["orphan-bytes"], { type: "video/webm" }), { name: "cu-xoa.webm" });
    const idB = generateProjectId();
    await store.recordProjectRefs(projectKeyForId(idB), "Dự án B", [orphan.assetId], { projectId: idB });
    const idA = generateProjectId();
    const scan = await scanStorageForCleanup(
      store,
      textOnlySpec() as never,
      [],
      { registry: store, currentProjectKey: projectKeyForId(idA) },
    );
    const row = scan.rows.find((r) => r.assetId === orphan.assetId);
    assert(row, "hàng mồ côi phải có trong scan");
    eq(row.inUse, true, "project B dùng → inUse=true, UI khóa");
    eq(row.usedByOther.join(","), "Dự án B", "usedByOther ghi tên B");
    const del = await deleteCleanupAsset(store, orphan.assetId, { registry: store, currentProjectKey: projectKeyForId(idA) });
    eq(del.ok, false, "delete bị từ chối");
    if (!del.ok) eq(del.reason, "cross-project", "lý do cross-project");
    assert((await store.get(orphan.assetId)) !== null, "bytes còn nguyên sau khi từ chối");
  });
  await test("F2: bản ghi legacy khóa theo tên vẫn chặn xóa như trước (tương thích ngược)", async () => {
    const { store } = freshStore();
    const orphan = await store.ingest(new Blob(["orphan-bytes"], { type: "video/webm" }), { name: "cu-xoa-2.webm" });
    await store.recordProjectRefs(projectKeyForName("Dự án B"), "Dự án B", [orphan.assetId]);
    const idA = generateProjectId();
    const scan = await scanStorageForCleanup(
      store,
      textOnlySpec() as never,
      [],
      { registry: store, currentProjectKey: projectKeyForId(idA) },
    );
    const row = scan.rows.find((r) => r.assetId === orphan.assetId);
    assert(row, "hàng mồ côi phải có trong scan");
    eq(row.inUse, true, "bản ghi legacy vẫn khóa mục");
    eq(row.usedByOther.join(","), "Dự án B", "usedByOther ghi tên B từ bản ghi legacy");
    const del = await deleteCleanupAsset(store, orphan.assetId, { registry: store, currentProjectKey: projectKeyForId(idA) });
    eq(del.ok, false, "delete bị từ chối");
    if (!del.ok) eq(del.reason, "cross-project", "lý do cross-project");
  });

  console.log(
    `\nprojectId63R7: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
