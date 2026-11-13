/**
 * legacyAdopt66T7.test.ts — Test thật cho UI nhận mảnh legacy mơ hồ
 * THỦ CÔNG (Phase 9 đợt 66, luồng T7 — đóng nợ đợt 65 S9 §5.1 + §8
 * mục 6: mảnh legacy mơ hồ chưa có UI nhận thủ công; autosave-restore /
 * nhập archive chưa nhận chuỗi legacy).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/legacyAdopt66T7.test.ts
 *
 * Chỉ dùng HistoryStore thật + MemoryBackend (không chạm IndexedDB /
 * localStorage thật — adoption test inject localStorage giả qua deps;
 * kho "đã bỏ qua" inject qua setLegacyAdoptDismissedStore).
 *
 * NỘI DUNG:
 *  K. Bộ hiển thị thuần: legacyChainDisplay + isAmbiguousAdoptionReason.
 *  L. adoptLegacyHistoryChain nay trả pointerAmbiguous + openedSpecHash
 *     + fragmentsAmbiguous kèm bằng chứng hiển thị (tên/hash/số
 *     version/mốc đầu-cuối); chuỗi mơ hồ còn nguyên, khóa giữ nguyên.
 *  M. adoptLegacyFragmentManually: nhận mảnh mơ hồ theo quyết định của
 *     user (không kiểm lại hash), dọn khóa con trỏ khi nhận chuỗi con
 *     trỏ; từ chối id không hợp lệ; lỗi kho → reason error, không throw.
 *  N. Hàng đợi UI (legacyAdoptUi): collect gộp con trỏ + mảnh (khử
 *     trùng); queue lọc mục đã bỏ qua; dismiss ghi nhớ qua storage giả
 *     + gỡ khỏi hàng đợi; remove sau khi nhận thành công.
 */
import type { VideoSpec } from "@repo-1/video-spec";
import {
  HistoryStore,
  MemoryBackend,
  adoptLegacyFragmentManually,
  adoptLegacyHistoryChain,
  type AdoptLegacyHistoryDeps,
  type ProjectVersion,
} from "./projectHistory.ts";
import {
  isAmbiguousAdoptionReason,
  legacyChainDisplay,
  sanitizeLegacyFileName,
} from "./projectNameRegistry64R6.ts";
import {
  clearDismissedLegacyIds,
  clearLegacyAdoptQueue,
  collectAmbiguousLegacyItems,
  dismissAllLegacyItems,
  dismissLegacyItem,
  getDismissedLegacyIds,
  getLegacyAdoptQueue,
  queueAmbiguousFromAdoptResult,
  queueAmbiguousLegacyItems,
  removeLegacyItem,
  setLegacyAdoptDismissedStore,
  type AmbiguousLegacyItem,
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

function fakeDeps(store: HistoryStore, legacyId: string | null): { deps: AdoptLegacyHistoryDeps; cleared: () => boolean } {
  let cleared = false;
  return {
    deps: {
      store,
      readLegacyId: () => legacyId,
      clearLegacyId: () => { cleared = true; },
    },
    cleared: () => cleared,
  };
}

/** Hash thật của một spec: lưu tạm rồi đọc field hash của version. */
async function hashOfSpec(s: VideoSpec): Promise<string> {
  const tmp = new HistoryStore(new MemoryBackend());
  const v = await tmp.saveVersion("tmp-probe-66t7", s);
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

function item(from: string, reason = "ambiguous-name-only-hash-mismatch"): AmbiguousLegacyItem {
  return {
    from,
    reason,
    namePart: "P_vcut_json",
    embeddedHash: "abcdef12",
    versionCount: 2,
    firstCreatedAt: 1000,
    lastCreatedAt: 2000,
    isPointerChain: false,
    openedSpecHash: "12345678",
  };
}

async function main(): Promise<void> {
  console.log("legacyAdopt66T7:");

  // -- K. Bộ hiển thị thuần ---------------------------------------------
  await test("K1: legacyChainDisplay — tách tên/hash từ id file-, đếm version, mốc đầu/cuối", () => {
    const d = legacyChainDisplay("file-abcdef12-P_vcut_json", [
      { createdAt: 3000 },
      { createdAt: 1000 },
      { createdAt: 2000 },
    ]);
    eq(d, { namePart: "P_vcut_json", embeddedHash: "abcdef12", versionCount: 3, firstCreatedAt: 1000, lastCreatedAt: 3000 });
  });

  await test("K2: legacyChainDisplay — chuỗi proj- không có tên/hash; chuỗi rỗng mốc null", () => {
    eq(legacyChainDisplay("proj-m123456-abcdef", [{ createdAt: 5000 }]), {
      namePart: "", embeddedHash: null, versionCount: 1, firstCreatedAt: 5000, lastCreatedAt: 5000,
    });
    eq(legacyChainDisplay("file-abcdef12-P_vcut_json", []), {
      namePart: "P_vcut_json", embeddedHash: "abcdef12", versionCount: 0, firstCreatedAt: null, lastCreatedAt: null,
    });
    eq(legacyChainDisplay("khong-phai-legacy", []), {
      namePart: "", embeddedHash: null, versionCount: 0, firstCreatedAt: null, lastCreatedAt: null,
    });
  });

  await test("K3: isAmbiguousAdoptionReason — chỉ nhận tiền tố ambiguous-", () => {
    assert(isAmbiguousAdoptionReason("ambiguous-name-only-hash-mismatch"));
    assert(isAmbiguousAdoptionReason("ambiguous-no-content-evidence"));
    assert(isAmbiguousAdoptionReason("ambiguous-trivial-spec"));
    assert(!isAmbiguousAdoptionReason("name-mismatch"));
    assert(!isAmbiguousAdoptionReason("not-file-chain"));
    assert(!isAmbiguousAdoptionReason("content-hash-match"));
    assert(!isAmbiguousAdoptionReason("scan-error"));
    assert(!isAmbiguousAdoptionReason(""));
  });

  // -- L. adopt trả bằng chứng mơ hồ ------------------------------------
  await test("L1: chuỗi con trỏ mơ hồ (tên khớp, hash lệch) → pointerAmbiguous kèm đủ bằng chứng, chuỗi + khóa còn nguyên", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specA = spec("Dự án", [{ id: "cA", start: 0, duration: 5 }]);
    const specB = spec("Dự án", [{ id: "cB", start: 0, duration: 9 }]);
    const hashA = await hashOfSpec(specA);
    const hashB = await hashOfSpec(specB);
    const legacyB = `file-${hashB}-${sanitizeLegacyFileName("Dự án.vcut.json")}`;
    await store.saveVersion(legacyB, specB);
    await store.saveVersion(legacyB, spec("Dự án", [{ id: "cB", start: 0, duration: 9 }, { id: "cB2", start: 9, duration: 1 }]));
    const f = fakeDeps(store, legacyB);
    const r = await adoptLegacyHistoryChain(UUID_A, "Dự án.vcut.json", f.deps, { spec: specA });
    eq(r.adopted, false);
    eq(r.reason, "ambiguous-name-only-hash-mismatch");
    assert(!f.cleared(), "từ chối thì giữ khóa");
    eq(r.openedSpecHash, hashA, "hash spec đang mở để UI so sánh");
    assert(r.pointerAmbiguous, "phải có pointerAmbiguous cho UI");
    eq(r.pointerAmbiguous?.from, legacyB);
    eq(r.pointerAmbiguous?.reason, "ambiguous-name-only-hash-mismatch");
    eq(r.pointerAmbiguous?.namePart, sanitizeLegacyFileName("Dự án.vcut.json"));
    eq(r.pointerAmbiguous?.embeddedHash, hashB);
    eq(r.pointerAmbiguous?.versionCount, 2, "chuỗi B có 2 version");
    assert(typeof r.pointerAmbiguous?.firstCreatedAt === "number", "mốc đầu phải có");
    assert(typeof r.pointerAmbiguous?.lastCreatedAt === "number", "mốc cuối phải có");
    assert((r.pointerAmbiguous?.firstCreatedAt ?? 0) <= (r.pointerAmbiguous?.lastCreatedAt ?? 0));
    eq((await store.listVersions(legacyB)).length, 2, "chuỗi mơ hồ còn nguyên");
    eq((await store.listVersions(UUID_A)).length, 0, "envelope không nhiễm");
  });

  await test("L2: chuỗi con trỏ từ chối hẳn (tên lệch VÀ hash lệch) → pointerAmbiguous null, không phải mơ hồ", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specA = spec("P", [{ id: "cA", start: 0, duration: 5 }]);
    const specB = spec("P", [{ id: "cB", start: 0, duration: 9 }]);
    const hashB = await hashOfSpec(specB);
    const legacyB = `file-${hashB}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(legacyB, specB);
    const f = fakeDeps(store, legacyB);
    // Mở spec KHÁC (hash lệch) với tên file KHÁC → từ chối hẳn
    // (name-mismatch), không phải mơ hồ. Lưu ý: chỉ lệch tên mà hash
    // khớp thì vẫn nhận (luật S9 F4 — tên chỉ là nhãn).
    const r = await adoptLegacyHistoryChain(UUID_A, "Tên khác.vcut.json", f.deps, { spec: specA });
    eq(r.adopted, false);
    eq(r.reason, "name-mismatch");
    eq(r.pointerAmbiguous, null);
  });

  await test("L3: mảnh mơ hồ nay kèm bằng chứng hiển thị (tên/hash/số version/mốc)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specY = spec("G", [{ id: "cy", start: 0, duration: 4 }]);
    const specX = spec("G", [{ id: "cx", start: 0, duration: 7 }]);
    const hashY = await hashOfSpec(specY);
    const hashX = await hashOfSpec(specX);
    const pointer = `file-${hashY}-${sanitizeLegacyFileName("G.vcut.json")}`;
    const fragOld = `file-${hashX}-${sanitizeLegacyFileName("G.vcut.json")}`;
    await store.saveVersion(pointer, specY);
    await store.saveVersion(fragOld, specX);
    const f = fakeDeps(store, pointer);
    const r = await adoptLegacyHistoryChain(UUID_A, "G.vcut.json", f.deps, { spec: specY });
    eq(r.adopted, true, "chuỗi con trỏ vẫn nhận");
    eq(r.fragmentsAmbiguous?.length, 1);
    const amb = r.fragmentsAmbiguous?.[0];
    eq(amb?.from, fragOld);
    eq(amb?.reason, "ambiguous-name-only-hash-mismatch");
    eq(amb?.namePart, sanitizeLegacyFileName("G.vcut.json"));
    eq(amb?.embeddedHash, hashX);
    eq(amb?.versionCount, 1);
    assert(typeof amb?.firstCreatedAt === "number" && typeof amb?.lastCreatedAt === "number");
    eq(amb?.firstCreatedAt, amb?.lastCreatedAt, "1 version thì mốc đầu = mốc cuối");
    eq(r.openedSpecHash, hashY);
    eq(r.pointerAmbiguous, null, "con trỏ đã nhận thì không có mục mơ hồ");
  });

  await test("L4: không đưa spec → openedSpecHash null, pointerAmbiguous vẫn có (thiếu bằng chứng)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-P_vcut_json";
    await store.saveVersion(legacy, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps);
    eq(r.adopted, false);
    eq(r.reason, "ambiguous-no-content-evidence");
    eq(r.openedSpecHash, null);
    eq(r.pointerAmbiguous?.reason, "ambiguous-no-content-evidence");
    eq(r.pointerAmbiguous?.versionCount, 1);
    eq(r.fragmentsSkipped, "no-spec");
  });

  // -- M. Nhận thủ công ---------------------------------------------------
  await test("M1: nhận thủ công mảnh mơ hồ — user quyết thay luật hash: version chuyển về envelope, mảnh rỗng", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specY = spec("G", [{ id: "cy", start: 0, duration: 4 }]);
    const specX = spec("G", [{ id: "cx", start: 0, duration: 7 }]);
    const hashY = await hashOfSpec(specY);
    const hashX = await hashOfSpec(specX);
    const pointer = `file-${hashY}-${sanitizeLegacyFileName("G.vcut.json")}`;
    const fragOld = `file-${hashX}-${sanitizeLegacyFileName("G.vcut.json")}`;
    await store.saveVersion(pointer, specY);
    await store.saveVersion(fragOld, specX);
    const f = fakeDeps(store, pointer);
    const r = await adoptLegacyHistoryChain(UUID_A, "G.vcut.json", f.deps, { spec: specY });
    eq(r.fragmentsAmbiguous?.length, 1, "mảnh mơ hồ chờ quyết định");
    // adopt ở trên đã nhận chuỗi con trỏ và dọn khóa (f.cleared() đã
    // true) — dùng deps mới để kiểm chứng riêng: nhận MẢNH không dọn
    // khóa con trỏ (khóa vẫn trỏ chuỗi con trỏ, không phải mảnh này).
    const f2 = fakeDeps(store, pointer);
    const m = await adoptLegacyFragmentManually(UUID_A, fragOld, f2.deps);
    eq(m.reason, "manual-adopted");
    eq(m.moved, 1);
    eq((await store.listVersions(fragOld)).length, 0, "mảnh đã chuyển đi");
    const env = await store.listVersions(UUID_A);
    eq(env.length, 2, "envelope: 1 version con trỏ + 1 version mảnh nhận tay");
    assert(env.some((v) => v.hash === hashX), "envelope giữ đúng nội dung mảnh");
    assert(!f2.cleared(), "nhận mảnh (không phải con trỏ) thì khóa con trỏ không bị dọn");
  });

  await test("M2: nhận thủ công chuỗi con trỏ mơ hồ → dọn khóa legacy", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specA = spec("P", [{ id: "cA", start: 0, duration: 5 }]);
    const specB = spec("P", [{ id: "cB", start: 0, duration: 9 }]);
    const hashB = await hashOfSpec(specB);
    const legacyB = `file-${hashB}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(legacyB, specB);
    const f = fakeDeps(store, legacyB);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps, { spec: specA });
    eq(r.reason, "ambiguous-name-only-hash-mismatch");
    const m = await adoptLegacyFragmentManually(UUID_A, legacyB, f.deps);
    eq(m.reason, "manual-adopted");
    eq(m.moved, 1);
    assert(f.cleared(), "nhận tay chuỗi con trỏ thì dọn khóa để lần sau khỏi hỏi lại");
    eq((await store.listVersions(legacyB)).length, 0);
  });

  await test("M3: nhận thủ công chuỗi rỗng → moved 0, reason manual-adopted-empty, vẫn dọn khóa con trỏ", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-P_vcut_json";
    const f = fakeDeps(store, legacy);
    const m = await adoptLegacyFragmentManually(UUID_A, legacy, f.deps);
    // Đợt 67 U6 — kết quả nay kèm movedVersions (rỗng) + wasPointerChain
    // (chuỗi này là con trỏ nên khóa bị dọn) để hoàn tác được.
    eq(m, { moved: 0, reason: "manual-adopted-empty", movedVersions: [], wasPointerChain: true });
    assert(f.cleared());
  });

  await test("M4: nhận thủ công từ chối id không hợp lệ — không throw, không đụng kho", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion(UUID_A, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    const f = fakeDeps(store, null);
    eq((await adoptLegacyFragmentManually(UUID_A, "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", f.deps)).reason, "not-legacy");
    eq((await adoptLegacyFragmentManually(UUID_A, UUID_A, f.deps)).reason, "same-as-envelope");
    eq((await adoptLegacyFragmentManually("file-xyz", "file-abcdef12-P_vcut_json", f.deps)).reason, "invalid-envelope-id");
    eq((await store.listVersions(UUID_A)).length, 1, "kho không đổi");
    assert(!f.cleared());
  });

  await test("M5: kho lỗi giữa chừng → reason error kèm message, không throw", async () => {
    const broken = {
      put: async (_v: ProjectVersion) => undefined,
      get: async (_id: string) => null,
      list: async (_pid: string): Promise<ProjectVersion[]> => { throw new Error("IDB hỏng"); },
      delete: async (_id: string) => undefined,
    };
    const brokenStore = new HistoryStore(broken);
    const f = fakeDeps(brokenStore, "file-abcdef123456-P_vcut_json");
    const m = await adoptLegacyFragmentManually(UUID_A, "file-abcdef123456-P_vcut_json", f.deps);
    eq(m.reason, "error");
    eq(m.moved, 0);
    assert(typeof m.error === "string" && m.error.length > 0);
    assert(!f.cleared(), "lỗi thì giữ khóa để thử lại");
  });

  // -- N. Hàng đợi UI ------------------------------------------------------
  await test("N1: collectAmbiguousLegacyItems — gộp con trỏ + mảnh, khử trùng theo from", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specA = spec("P", [{ id: "cA", start: 0, duration: 5 }]);
    const specB = spec("P", [{ id: "cB", start: 0, duration: 9 }]);
    const specC = spec("P", [{ id: "cC", start: 0, duration: 3 }]);
    const hashA = await hashOfSpec(specA);
    const hashB = await hashOfSpec(specB);
    const hashC = await hashOfSpec(specC);
    const pointer = `file-${hashB}-${sanitizeLegacyFileName("P.vcut.json")}`;
    const fragC = `file-${hashC}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(pointer, specB);
    await store.saveVersion(fragC, specC);
    const f = fakeDeps(store, pointer);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps, { spec: specA });
    eq(r.pointerAmbiguous?.from, pointer, "con trỏ mơ hồ");
    eq(r.fragmentsAmbiguous?.length, 1, "mảnh mơ hồ");
    const items = collectAmbiguousLegacyItems(r);
    eq(items.length, 2, "gộp con trỏ + mảnh");
    eq(items[0].from, pointer);
    eq(items[0].isPointerChain, true);
    eq(items[1].from, fragC);
    eq(items[1].isPointerChain, false);
    eq(items[1].openedSpecHash, hashA);
    // Khử trùng: cùng from xuất hiện cả hai chỗ thì chỉ lấy một.
    const dup = collectAmbiguousLegacyItems({
      ...r,
      fragmentsAmbiguous: [r.pointerAmbiguous!],
    });
    eq(dup.length, 1, "trùng from thì chỉ giữ một mục (con trỏ trước)");
    eq(dup[0].isPointerChain, true);
  });

  await test("N2: queue lọc mục đã bỏ qua + khử trùng; dismiss ghi nhớ và gỡ khỏi hàng đợi", () => {
    const fake = fakeDismissedStore();
    setLegacyAdoptDismissedStore(fake.store);
    try {
      clearLegacyAdoptQueue();
      clearDismissedLegacyIds();
      const a = item("file-aaaa1111-P_vcut_json");
      const b = item("file-bbbb2222-P_vcut_json");
      eq(queueAmbiguousLegacyItems([a, b]), 2);
      eq(getLegacyAdoptQueue().length, 2);
      eq(queueAmbiguousLegacyItems([a]), 0, "đưa lại mục đã có → không thêm");
      dismissLegacyItem(a.from);
      eq(getLegacyAdoptQueue().length, 1, "dismiss gỡ khỏi hàng đợi");
      eq(getLegacyAdoptQueue()[0].from, b.from);
      eq(getDismissedLegacyIds(), [a.from], "dismiss ghi nhớ id");
      eq(queueAmbiguousLegacyItems([a]), 0, "mục đã bỏ qua không được đưa lại");
      eq(queueAmbiguousFromAdoptResult({
        moved: 0, from: null, adopted: false, reason: "ambiguous-name-only-hash-mismatch",
        fragmentsAdopted: [], fragmentsAmbiguous: [],
        pointerAmbiguous: {
          from: a.from, reason: "ambiguous-name-only-hash-mismatch",
          namePart: "P_vcut_json", embeddedHash: "aaaa1111", versionCount: 1,
          firstCreatedAt: 1000, lastCreatedAt: 1000,
        },
        openedSpecHash: "12345678",
      }), 0, "kết quả adopt chứa mục đã bỏ qua → queue 0 mục mới");
    } finally {
      clearLegacyAdoptQueue();
      clearDismissedLegacyIds();
      setLegacyAdoptDismissedStore(null);
    }
  });

  await test("N3: dismissAll ghi nhớ tất cả; removeLegacyItem gỡ sau khi nhận (không ghi bỏ qua)", () => {
    const fake = fakeDismissedStore();
    setLegacyAdoptDismissedStore(fake.store);
    try {
      clearLegacyAdoptQueue();
      clearDismissedLegacyIds();
      const a = item("file-aaaa1111-P_vcut_json");
      const b = item("file-bbbb2222-P_vcut_json");
      queueAmbiguousLegacyItems([a, b]);
      removeLegacyItem(a.from);
      eq(getLegacyAdoptQueue().length, 1, "nhận xong gỡ khỏi hàng đợi");
      eq(getDismissedLegacyIds(), [], "nhận thành công KHÔNG ghi vào danh sách bỏ qua");
      dismissAllLegacyItems();
      eq(getLegacyAdoptQueue().length, 0);
      eq(getDismissedLegacyIds(), [b.from], "dismissAll ghi nhớ mục còn lại");
    } finally {
      clearLegacyAdoptQueue();
      clearDismissedLegacyIds();
      setLegacyAdoptDismissedStore(null);
    }
  });

  await test("N4: kho đã bỏ qua hỏng (JSON lỗi) → queue vẫn chạy, coi như chưa bỏ qua mục nào", () => {
    const fake = fakeDismissedStore();
    fake.map.set("vcut:legacy-adopt-dismissed-v1", "{json-hong");
    setLegacyAdoptDismissedStore(fake.store);
    try {
      clearLegacyAdoptQueue();
      eq(getDismissedLegacyIds(), []);
      eq(queueAmbiguousLegacyItems([item("file-aaaa1111-P_vcut_json")]), 1);
    } finally {
      clearLegacyAdoptQueue();
      clearDismissedLegacyIds();
      setLegacyAdoptDismissedStore(null);
    }
  });

  console.log(
    `\nlegacyAdopt66T7: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
