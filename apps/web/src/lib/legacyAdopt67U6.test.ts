/**
 * legacyAdopt67U6.test.ts — Test thật cho đợt 67 luồng U6: UI mở lại
 * mảnh legacy đã "Bỏ qua" + xác nhận nhận tay lần 2 + hoàn tác +
 * nhập archive nhận chuỗi mới từ archive (đóng nợ đợt 66 T7 §5.4/§5.5/§5.6).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/legacyAdopt67U6.test.ts
 *
 * Chỉ dùng HistoryStore thật + MemoryBackend (không chạm IndexedDB /
 * localStorage thật — adoption test inject localStorage giả qua deps;
 * kho "đã bỏ qua" inject qua setLegacyAdoptDismissedStore).
 *
 * NỘI DUNG:
 *  O. Hoàn tác nhận thủ công (undoManualAdopt + rekeyVersions): trả
 *     đúng version về đúng id gốc, khôi phục khóa con trỏ, từ chối id
 *     không hợp lệ, lỗi kho → reason error, không throw.
 *  P. Nhập lịch sử có đếm chi tiết (importHistoryDetailed) + nhập
 *     lịch sử kèm archive (importArchiveHistory): nhập mới / bỏ qua
 *     trùng / xung đột giữ bản local; lệch projectId / quá 500 version
 *     / version lẻ lệch projectId → bỏ qua có lý do (không throw);
 *     importHistory cũ vẫn trả đúng số lượng (hồi quy).
 *  Q. Hàng đợi UI mở lại (legacyAdoptUi): undismiss + snapshot theo
 *     dõi, loadDismissedLegacyItems (còn dữ liệu / đã mất / đọc lỗi),
 *     cờ yêu cầu mở modal.
 *  R. rekeyVersions chọn lọc: chỉ chuyển đúng id trong bảng, remap
 *     parentId trong tập chuyển, id đích sai → throw.
 */
import type { VideoSpec } from "@repo-1/video-spec";
import {
  ARCHIVE_HISTORY_MAX_VERSIONS,
  HistoryStore,
  MemoryBackend,
  adoptLegacyFragmentManually,
  getHistoryChangedSeq,
  notifyHistoryChanged,
  subscribeHistoryChanged,
  undoManualAdopt,
  type AdoptLegacyHistoryDeps,
  type HistoryExport,
  type ProjectVersion,
} from "./projectHistory.ts";
import { sanitizeLegacyFileName } from "./projectNameRegistry64R6.ts";
import {
  clearDismissedLegacyIds,
  clearLegacyAdoptModalRequest,
  clearLegacyAdoptQueue,
  dismissLegacyId,
  getDismissedLegacyIds,
  getDismissedLegacyIdsSnapshot,
  getLegacyAdoptModalRequested,
  getLegacyAdoptQueue,
  loadDismissedLegacyItems,
  queueAmbiguousLegacyItems,
  requestLegacyAdoptModal,
  setLegacyAdoptDismissedStore,
  subscribeDismissedLegacyIds,
  subscribeLegacyAdoptModalRequest,
  undismissLegacyId,
  type DismissedLegacyStore,
} from "./legacyAdoptUi.ts";

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

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function assert(cond: unknown, what = ""): void {
  if (!cond) throw new Error(what || "assert thất bại");
}

function spec(name: string, clips: Array<{ id: string; start: number; duration: number }>): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: clips.map((c) => ({
        id: c.id, kind: "video", src: "a.mp4", start: c.start,
        duration: c.duration, in: 0, out: c.duration,
      })),
    }],
  } as unknown as VideoSpec;
}

const UUID_A = "11111111-2222-3333-4444-555555555555";
const UUID_Q = "99999999-8888-7777-6666-555555555555";

function fakeDeps(store: HistoryStore, legacyId: string | null): {
  deps: AdoptLegacyHistoryDeps;
  cleared: () => boolean;
  written: () => string | null;
} {
  let cleared = false;
  let written: string | null = null;
  return {
    deps: {
      store,
      readLegacyId: () => legacyId,
      clearLegacyId: () => { cleared = true; },
      writeLegacyId: (id: string) => { written = id; },
    },
    cleared: () => cleared,
    written: () => written,
  };
}

/** Hash thật của một spec: lưu tạm rồi đọc field hash của version. */
async function hashOfSpec(s: VideoSpec): Promise<string> {
  const tmp = new HistoryStore(new MemoryBackend());
  const v = await tmp.saveVersion("tmp-probe-67u6", s);
  if (!v) throw new Error("không tính được hash spec");
  return v.hash;
}

/** Kho "đã bỏ qua" giả (Map) cho legacyAdoptUi. */
function fakeDismissedStore(): { store: DismissedLegacyStore; map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    store: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v); },
      removeItem: (k: string) => { map.delete(k); },
    },
    map,
  };
}

async function main(): Promise<void> {
  console.log("legacyAdopt67U6:");

  // -- O. Hoàn tác nhận thủ công -----------------------------------------
  await test("O1: nhận tay rồi hoàn tác — version về chuỗi gốc đúng id gốc, envelope sạch", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specX = spec("G", [{ id: "cx", start: 0, duration: 7 }]);
    const specX2 = spec("G", [{ id: "cx", start: 0, duration: 7 }, { id: "cx2", start: 7, duration: 1 }]);
    const hashX = await hashOfSpec(specX);
    const frag = `file-${hashX}-${sanitizeLegacyFileName("G.vcut.json")}`;
    const v1 = await store.saveVersion(frag, specX);
    const v2 = await store.saveVersion(frag, specX2);
    assert(v1 && v2, "phải lưu được 2 version");
    const f = fakeDeps(store, null);
    const m = await adoptLegacyFragmentManually(UUID_A, frag, f.deps);
    eq(m.reason, "manual-adopted");
    eq(m.moved, 2);
    eq(m.movedVersions.length, 2, "phải ghi lại 2 cặp id gốc → id migrate");
    eq(m.wasPointerChain, false, "mảnh quét (không phải con trỏ)");
    eq((await store.listVersions(frag)).length, 0);
    const envBefore = await store.listVersions(UUID_A);
    eq(envBefore.length, 2);
    // Hoàn tác: trả đúng 2 version về đúng id gốc.
    const u = await undoManualAdopt(UUID_A, frag, m.movedVersions, { restorePointer: m.wasPointerChain }, f.deps);
    eq(u.reason, "undone");
    eq(u.movedBack, 2);
    eq(u.pointerRestored, false, "không phải con trỏ thì không khôi phục khóa");
    const back = await store.listVersions(frag);
    eq(back.length, 2, "chuỗi gốc đủ 2 version");
    eq(back.map((v) => v.id).sort(), [v1.id, v2.id].sort(), "id gốc được giữ nguyên (không phải id migrate)");
    eq(back.find((v) => v.id === v2.id)?.parentId, v1.id, "parentId trong tập chuyển được remap về id gốc");
    eq((await store.listVersions(UUID_A)).length, 0, "envelope sạch sau hoàn tác");
    assert(f.written() === null, "không ghi khóa khi không phải con trỏ");
  });

  await test("O2: hoàn tác chuỗi con trỏ — khôi phục khóa legacy về đúng chuỗi đó", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specB = spec("P", [{ id: "cB", start: 0, duration: 9 }]);
    const hashB = await hashOfSpec(specB);
    const legacyB = `file-${hashB}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(legacyB, specB);
    const f = fakeDeps(store, legacyB);
    const m = await adoptLegacyFragmentManually(UUID_A, legacyB, f.deps);
    eq(m.reason, "manual-adopted");
    eq(m.wasPointerChain, true, "chuỗi này là con trỏ");
    assert(f.cleared(), "nhận tay chuỗi con trỏ thì dọn khóa");
    const u = await undoManualAdopt(UUID_A, legacyB, m.movedVersions, { restorePointer: m.wasPointerChain }, f.deps);
    eq(u.reason, "undone");
    eq(u.movedBack, 1);
    eq(u.pointerRestored, true, "khóa con trỏ được ghi lại");
    eq(f.written(), legacyB, "ghi lại đúng id chuỗi con trỏ");
    eq((await store.listVersions(legacyB)).length, 1, "chuỗi con trỏ có lại 1 version");
  });

  await test("O3: hoàn tác khi không có gì để trả (chuỗi rỗng + không phải con trỏ) → nothing-to-undo", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const f = fakeDeps(store, null);
    const u = await undoManualAdopt(UUID_A, "file-abcdef123456-P_vcut_json", [], { restorePointer: false }, f.deps);
    eq(u, { movedBack: 0, reason: "nothing-to-undo", pointerRestored: false });
  });

  await test("O4: hoàn tác chuỗi rỗng nhưng là con trỏ → undone-empty, chỉ khôi phục khóa", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-P_vcut_json";
    const f = fakeDeps(store, legacy);
    const m = await adoptLegacyFragmentManually(UUID_A, legacy, f.deps);
    eq(m.reason, "manual-adopted-empty");
    eq(m.movedVersions, []);
    const u = await undoManualAdopt(UUID_A, legacy, m.movedVersions, { restorePointer: m.wasPointerChain }, f.deps);
    eq(u.reason, "undone-empty");
    eq(u.movedBack, 0);
    eq(u.pointerRestored, true);
    eq(f.written(), legacy);
  });

  await test("O5: hoàn tác từ chối id không hợp lệ — không throw, không đụng kho", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion(UUID_A, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    const f = fakeDeps(store, null);
    eq((await undoManualAdopt(UUID_A, "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", [], { restorePointer: true }, f.deps)).reason, "not-legacy");
    eq((await undoManualAdopt(UUID_A, UUID_A, [], { restorePointer: true }, f.deps)).reason, "same-as-envelope");
    eq((await undoManualAdopt("file-xyz", "file-abcdef12-P_vcut_json", [], { restorePointer: true }, f.deps)).reason, "invalid-envelope-id");
    eq((await store.listVersions(UUID_A)).length, 1, "kho không đổi");
    assert(f.written() === null);
  });

  await test("O6: hoàn tác sau khi envelope đã lưu thêm version mới — chỉ trả đúng version đã nhận, version mới ở nguyên", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specX = spec("G", [{ id: "cx", start: 0, duration: 7 }]);
    const hashX = await hashOfSpec(specX);
    const frag = `file-${hashX}-${sanitizeLegacyFileName("G.vcut.json")}`;
    await store.saveVersion(frag, specX);
    const f = fakeDeps(store, null);
    const m = await adoptLegacyFragmentManually(UUID_A, frag, f.deps);
    eq(m.moved, 1);
    // Lưu thêm 1 version mới vào envelope (cha của nó là version vừa nhận).
    const specNew = spec("G", [{ id: "cx", start: 0, duration: 7 }, { id: "cx2", start: 7, duration: 3 }]);
    const vNew = await store.saveVersion(UUID_A, specNew);
    assert(vNew, "phải lưu được version mới vào envelope");
    const u = await undoManualAdopt(UUID_A, frag, m.movedVersions, { restorePointer: false }, f.deps);
    eq(u.reason, "undone");
    eq(u.movedBack, 1);
    eq((await store.listVersions(frag)).length, 1, "chuỗi gốc có lại version đã nhận");
    const env = await store.listVersions(UUID_A);
    eq(env.length, 1, "envelope chỉ còn version lưu mới");
    eq(env[0].id, vNew.id, "version mới không bị đụng");
  });

  await test("O7: kho lỗi giữa chừng khi hoàn tác → reason error, không throw", async () => {
    const broken = {
      put: async (_v: ProjectVersion) => undefined,
      get: async (_id: string) => null,
      list: async (_pid: string): Promise<ProjectVersion[]> => { throw new Error("IDB hỏng"); },
      delete: async (_id: string) => undefined,
    };
    const brokenStore = new HistoryStore(broken);
    const f = fakeDeps(brokenStore, null);
    const u = await undoManualAdopt(
      UUID_A,
      "file-abcdef123456-P_vcut_json",
      [{ fromId: "file-abcdef123456-P_vcut_json@1-a", toId: `${UUID_A}@1-abcdef12` }],
      { restorePointer: false },
      f.deps,
    );
    eq(u.reason, "error");
    eq(u.movedBack, 0);
    assert(typeof u.error === "string" && u.error.length > 0);
  });

  // -- P. Nhập lịch sử có đếm chi tiết + lịch sử kèm archive ------------
  await test("P1: importHistoryDetailed — nhập mới / bỏ qua trùng, đếm đủ", async () => {
    const a = new HistoryStore(new MemoryBackend());
    await a.saveVersion(UUID_Q, spec("Q", [{ id: "q1", start: 0, duration: 2 }]));
    await a.saveVersion(UUID_Q, spec("Q", [{ id: "q1", start: 0, duration: 2 }, { id: "q2", start: 2, duration: 2 }]));
    const exp = a.exportHistory(UUID_Q, await a.listVersions(UUID_Q));
    const b = new HistoryStore(new MemoryBackend());
    eq(await b.importHistoryDetailed(exp), { imported: 2, skipped: 0, conflicts: 0, total: 2 });
    eq(await b.importHistoryDetailed(exp), { imported: 0, skipped: 2, conflicts: 0, total: 2 });
    eq((await b.listVersions(UUID_Q)).length, 2, "nhập lại không nhân đôi");
  });

  await test("P2: importHistoryDetailed — cùng id khác nội dung → xung đột, giữ bản local", async () => {
    const a = new HistoryStore(new MemoryBackend());
    await a.saveVersion(UUID_Q, spec("Q", [{ id: "q1", start: 0, duration: 2 }]));
    const exp = a.exportHistory(UUID_Q, await a.listVersions(UUID_Q));
    const b = new HistoryStore(new MemoryBackend());
    await b.importHistoryDetailed(exp);
    const localBefore = await b.listVersions(UUID_Q);
    eq(localBefore.length, 1);
    // Chế version cùng id nhưng spec khác (hash khớp spec mới của nó).
    const specOther = spec("Q", [{ id: "q1", start: 0, duration: 9 }]);
    const hashOther = await hashOfSpec(specOther);
    const tampered: HistoryExport = JSON.parse(JSON.stringify(exp)) as HistoryExport;
    tampered.versions[0] = { ...tampered.versions[0], spec: specOther, hash: hashOther };
    eq(await b.importHistoryDetailed(tampered), { imported: 0, skipped: 0, conflicts: 1, total: 1 });
    const localAfter = await b.listVersions(UUID_Q);
    eq(localAfter.length, 1, "không ghi đè, không thêm");
    eq(localAfter[0].spec, localBefore[0].spec, "bản local giữ nguyên nội dung");
    eq(localAfter[0].hash, localBefore[0].hash, "bản local giữ nguyên hash");
  });

  await test("P3: importHistory cũ vẫn trả đúng số lượng (hồi quy)", async () => {
    const a = new HistoryStore(new MemoryBackend());
    await a.saveVersion(UUID_Q, spec("Q", [{ id: "q1", start: 0, duration: 2 }]));
    await a.saveVersion(UUID_Q, spec("Q", [{ id: "q1", start: 0, duration: 2 }, { id: "q2", start: 2, duration: 2 }]));
    const exp = a.exportHistory(UUID_Q, await a.listVersions(UUID_Q));
    const b = new HistoryStore(new MemoryBackend());
    eq(await b.importHistory(exp), 2);
    eq(await b.importHistory(exp), 0, "nhập lại không trùng");
  });

  await test("P4: importArchiveHistory — đúng project thì nhập; lệch projectId / version lẻ lệch / quá 500 → bỏ qua có lý do, không throw", async () => {
    const a = new HistoryStore(new MemoryBackend());
    await a.saveVersion(UUID_Q, spec("Q", [{ id: "q1", start: 0, duration: 2 }]));
    const exp = a.exportHistory(UUID_Q, await a.listVersions(UUID_Q));
    const b = new HistoryStore(new MemoryBackend());
    eq(await b.importArchiveHistory(exp, UUID_Q), { imported: 1, skipped: 0, conflicts: 0, total: 1, skippedReason: null, skippedDetail: "" });
    // Lệch projectId của cả file → bỏ qua, kho không đổi.
    eq(await b.importArchiveHistory(exp, UUID_A), { imported: 0, skipped: 0, conflicts: 0, total: 1, skippedReason: "project-mismatch", skippedDetail: UUID_Q });
    eq((await b.listVersions(UUID_Q)).length, 1, "bỏ qua thì không nhập thêm");
    // Một version lẻ lệch projectId.
    const badVersion = JSON.parse(JSON.stringify(exp)) as HistoryExport;
    badVersion.versions[0] = { ...badVersion.versions[0], projectId: UUID_A };
    eq(await b.importArchiveHistory(badVersion, UUID_Q), { imported: 0, skipped: 0, conflicts: 0, total: 1, skippedReason: "version-project-mismatch", skippedDetail: UUID_A });
    // Quá 500 version.
    const one = spec("Q", [{ id: "q1", start: 0, duration: 2 }]);
    const h = await hashOfSpec(one);
    const many: HistoryExport = {
      format: "vcut-history",
      formatVersion: 1,
      projectId: UUID_Q,
      exportedAt: new Date().toISOString(),
      versions: Array.from({ length: ARCHIVE_HISTORY_MAX_VERSIONS + 1 }, (_, i) => ({
        id: `${UUID_Q}@${1000 + i}-${h}`,
        projectId: UUID_Q,
        createdAt: 1000 + i,
        createdAtIso: new Date(1000 + i).toISOString(),
        label: "",
        hash: h,
        parentId: "",
        summary: [],
        spec: one,
      })),
    };
    eq(await b.importArchiveHistory(many, UUID_Q), { imported: 0, skipped: 0, conflicts: 0, total: ARCHIVE_HISTORY_MAX_VERSIONS + 1, skippedReason: "too-many", skippedDetail: String(ARCHIVE_HISTORY_MAX_VERSIONS + 1) });
    eq((await b.listVersions(UUID_Q)).length, 1, "bỏ qua thì kho không đổi");
  });

  await test("P5: importArchiveHistory — file sai định dạng → throw (validateImport)", async () => {
    const b = new HistoryStore(new MemoryBackend());
    let threw = 0;
    try { await b.importArchiveHistory({ format: "khác", formatVersion: 1, projectId: UUID_Q, versions: [] }, UUID_Q); } catch { threw++; }
    eq(threw, 1);
  });

  // -- Q. Hàng đợi UI mở lại ----------------------------------------------
  await test("Q1: undismissLegacyId — gỡ khỏi danh sách đã bỏ qua, queue nhận lại được", () => {
    const fake = fakeDismissedStore();
    setLegacyAdoptDismissedStore(fake.store);
    try {
      clearLegacyAdoptQueue();
      clearDismissedLegacyIds();
      const item = {
        from: "file-aaaa1111-P_vcut_json", reason: "ambiguous-name-only-hash-mismatch",
        namePart: "P_vcut_json", embeddedHash: "aaaa1111", versionCount: 1,
        firstCreatedAt: 1000, lastCreatedAt: 1000, isPointerChain: false, openedSpecHash: "12345678",
      };
      dismissLegacyId(item.from);
      eq(getDismissedLegacyIds(), [item.from]);
      eq(queueAmbiguousLegacyItems([item]), 0, "đã bỏ qua thì queue không nhận");
      undismissLegacyId(item.from);
      eq(getDismissedLegacyIds(), [], "mở lại thì gỡ khỏi danh sách đã bỏ qua");
      eq(queueAmbiguousLegacyItems([item]), 1, "mở lại xong queue nhận lại được");
      eq(getLegacyAdoptQueue().length, 1);
    } finally {
      clearLegacyAdoptQueue();
      clearDismissedLegacyIds();
      setLegacyAdoptDismissedStore(null);
    }
  });

  await test("Q2: loadDismissedLegacyItems — còn dữ liệu / đã mất / đọc lỗi", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specX = spec("G", [{ id: "cx", start: 0, duration: 7 }]);
    const hashX = await hashOfSpec(specX);
    const frag = `file-${hashX}-${sanitizeLegacyFileName("G.vcut.json")}`;
    await store.saveVersion(frag, specX);
    await store.saveVersion(frag, spec("G", [{ id: "cx", start: 0, duration: 7 }, { id: "cx2", start: 7, duration: 1 }]));
    const fake = fakeDismissedStore();
    setLegacyAdoptDismissedStore(fake.store);
    try {
      clearDismissedLegacyIds();
      dismissLegacyId(frag);
      dismissLegacyId("file-deadbeef00-P_vcut_json");
      dismissLegacyId("file-badread00-P_vcut_json");
      const throwingLister = {
        listVersions: async (id: string): Promise<ProjectVersion[]> => {
          if (id === "file-badread00-P_vcut_json") throw new Error("IDB hỏng");
          return store.listVersions(id);
        },
      };
      const chains = await loadDismissedLegacyItems(throwingLister, "12345678", null);
      eq(chains.length, 3, "liệt kê đủ 3 chuỗi đã bỏ qua");
      const live = chains.find((c) => c.from === frag)!;
      eq(live.exists, true);
      eq(live.versionCount, 2);
      eq(live.namePart, sanitizeLegacyFileName("G.vcut.json"));
      eq(live.embeddedHash, hashX);
      eq(live.reason, "dismissed");
      eq(live.openedSpecHash, "12345678");
      assert(typeof live.firstCreatedAt === "number" && typeof live.lastCreatedAt === "number");
      const gone = chains.find((c) => c.from === "file-deadbeef00-P_vcut_json")!;
      eq(gone.exists, false, "chuỗi không còn version thì exists=false");
      eq(gone.versionCount, 0);
      eq(gone.firstCreatedAt, null);
      const bad = chains.find((c) => c.from === "file-badread00-P_vcut_json")!;
      eq(bad.exists, false, "đọc kho lỗi thì exists=false, không throw");
      eq(bad.versionCount, 0);
    } finally {
      clearDismissedLegacyIds();
      setLegacyAdoptDismissedStore(null);
    }
  });

  await test("Q3: cờ yêu cầu mở modal — request/clear/subscribe", () => {
    clearLegacyAdoptModalRequest();
    eq(getLegacyAdoptModalRequested(), false);
    let calls = 0;
    const unsub = subscribeLegacyAdoptModalRequest(() => { calls++; });
    try {
      requestLegacyAdoptModal();
      eq(getLegacyAdoptModalRequested(), true);
      eq(calls, 1, "request emit 1 lần");
      requestLegacyAdoptModal();
      eq(calls, 1, "request lại khi đã mở thì không emit nữa");
      clearLegacyAdoptModalRequest();
      eq(getLegacyAdoptModalRequested(), false);
      eq(calls, 2, "clear emit 1 lần");
      clearLegacyAdoptModalRequest();
      eq(calls, 2, "clear lại khi đã tắt thì không emit nữa");
    } finally {
      unsub();
      clearLegacyAdoptModalRequest();
    }
  });

  await test("Q4: snapshot danh sách đã bỏ qua — subscribe nhận thay đổi", () => {
    const fake = fakeDismissedStore();
    setLegacyAdoptDismissedStore(fake.store);
    try {
      clearDismissedLegacyIds();
      eq(getDismissedLegacyIdsSnapshot(), []);
      let calls = 0;
      const unsub = subscribeDismissedLegacyIds(() => { calls++; });
      try {
        dismissLegacyId("file-aaaa1111-P_vcut_json");
        eq(calls, 1, "dismiss emit 1 lần");
        eq(getDismissedLegacyIdsSnapshot(), ["file-aaaa1111-P_vcut_json"]);
        undismissLegacyId("file-aaaa1111-P_vcut_json");
        eq(calls, 2, "undismiss emit 1 lần");
        eq(getDismissedLegacyIdsSnapshot(), []);
      } finally {
        unsub();
      }
    } finally {
      clearDismissedLegacyIds();
      setLegacyAdoptDismissedStore(null);
    }
  });

  await test("Q5: tín hiệu lịch sử đã đổi — subscribe nhận notify, số thứ tự tăng", () => {
    const before = getHistoryChangedSeq();
    let calls = 0;
    const unsub = subscribeHistoryChanged(() => { calls++; });
    try {
      notifyHistoryChanged();
      eq(calls, 1, "notify emit 1 lần");
      eq(getHistoryChangedSeq(), before + 1, "số thứ tự tăng 1");
      notifyHistoryChanged();
      eq(calls, 2);
      eq(getHistoryChangedSeq(), before + 2);
    } finally {
      unsub();
    }
    notifyHistoryChanged();
    eq(calls, 2, "hủy đăng ký rồi thì không nhận nữa");
  });

  // -- R. rekeyVersions chọn lọc -------------------------------------------
  await test("R1: rekeyVersions — chỉ chuyển đúng id trong bảng, còn lại ở nguyên", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const chainA = "file-aaaaaaaaaaaa-P_vcut_json";
    const v1 = await store.saveVersion(chainA, spec("G", [{ id: "c1", start: 0, duration: 1 }]));
    const v2 = await store.saveVersion(chainA, spec("G", [{ id: "c1", start: 0, duration: 1 }, { id: "c2", start: 1, duration: 1 }]));
    const v3 = await store.saveVersion(chainA, spec("G", [{ id: "c1", start: 0, duration: 1 }, { id: "c2", start: 1, duration: 1 }, { id: "c3", start: 2, duration: 1 }]));
    assert(v1 && v2 && v3);
    const idMap = new Map([
      [v1.id, `${UUID_A}@${v1.createdAt}-${v1.hash}`],
      [v2.id, `${UUID_A}@${v2.createdAt}-${v2.hash}`],
    ]);
    const r = await store.rekeyVersions(chainA, UUID_A, idMap);
    eq(r.moved, 2);
    eq((await store.listVersions(chainA)).map((v) => v.id), [v3.id], "chuỗi nguồn chỉ còn version không chuyển");
    const env = await store.listVersions(UUID_A);
    eq(env.length, 2);
    eq(env.map((v) => v.id).sort(), [idMap.get(v1.id), idMap.get(v2.id)].sort());
  });

  await test("R2: rekeyVersions — parentId trong tập chuyển được remap, ngoài tập giữ nguyên", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const chainA = "file-aaaaaaaaaaaa-P_vcut_json";
    const v1 = await store.saveVersion(chainA, spec("G", [{ id: "c1", start: 0, duration: 1 }]));
    const v2 = await store.saveVersion(chainA, spec("G", [{ id: "c1", start: 0, duration: 1 }, { id: "c2", start: 1, duration: 1 }]));
    const v3 = await store.saveVersion(chainA, spec("G", [{ id: "c1", start: 0, duration: 1 }, { id: "c2", start: 1, duration: 1 }, { id: "c3", start: 2, duration: 1 }]));
    assert(v1 && v2 && v3);
    eq(v2.parentId, v1.id, "v2 trỏ cha v1");
    eq(v3.parentId, v2.id, "v3 trỏ cha v2");
    const newV1 = `${UUID_A}@${v1.createdAt}-${v1.hash}`;
    const newV2 = `${UUID_A}@${v2.createdAt}-${v2.hash}`;
    await store.rekeyVersions(chainA, UUID_A, new Map([[v1.id, newV1], [v2.id, newV2]]));
    const env = await store.listVersions(UUID_A);
    eq(env.find((v) => v.id === newV2)?.parentId, newV1, "cha trong tập chuyển được remap");
    const rest = await store.listVersions(chainA);
    eq(rest.length, 1);
    eq(rest[0].parentId, v2.id, "version ở lại giữ nguyên parentId gốc (dangling như prune)");
  });

  await test("R3: rekeyVersions — id đích sai → throw; bảng rỗng → moved 0", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const chainA = "file-aaaaaaaaaaaa-P_vcut_json";
    const v1 = await store.saveVersion(chainA, spec("G", [{ id: "c1", start: 0, duration: 1 }]));
    assert(v1);
    let threw = 0;
    try { await store.rekeyVersions(chainA, "khong-phai-id", new Map([[v1.id, "x"]])); } catch { threw++; }
    eq(threw, 1, "id đích không phải envelope cũng không phải legacy thì throw");
    eq(await store.rekeyVersions(chainA, UUID_A, new Map()), { moved: 0 });
    eq((await store.listVersions(chainA)).length, 1, "bảng rỗng thì kho không đổi");
  });

  console.log(
    `\nlegacyAdopt67U6: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
