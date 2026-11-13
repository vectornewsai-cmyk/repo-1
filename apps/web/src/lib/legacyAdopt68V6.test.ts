/**
 * legacyAdopt68V6.test.ts — Test thật cho đợt 68 luồng V6: STACK HOÀN
 * TÁC NHIỀU MỨC cho nhận legacy thủ công (đóng nợ đợt 67 U6 §5.2:
 * hoàn tác chỉ một mức, nhận lần 2 ghi đè bản ghi lần 1; nhận "tất
 * cả" cũng chỉ hoàn tác được lần nhận cuối trong loạt).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/legacyAdopt68V6.test.ts
 *
 * Chỉ dùng HistoryStore thật + MemoryBackend (không chạm IndexedDB /
 * localStorage thật — adoption test inject localStorage giả qua deps).
 *
 * NỘI DUNG:
 *  S. Stack thuần (LegacyAdoptUndoStack + makeManualAdoptRecord):
 *     LIFO, peek không pop, giới hạn 20 mức (bỏ mức cũ nhất, trả về
 *     bản ghi đã bỏ), clear, factory copy bảng id.
 *  T. Tích hợp adopt + undoLastManualAdopt (store thật): hoàn tác
 *     ngược thứ tự nhận qua 2–3 chuỗi; nhận sau khi hoàn tác một
 *     phần; chuỗi con trỏ nằm giữa stack; stack rỗng; envelope
 *     lệch (bản ghi được đẩy lại, không mất); version bị xóa sau
 *     khi nhận (mức đã dùng, không pop thêm); nhận lại cùng chuỗi
 *     sau hoàn tác (chỉ 1 mức sống); chuỗi rỗng là con trỏ.
 */
import type { VideoSpec } from "@repo-1/video-spec";
import {
  HistoryStore,
  LEGACY_ADOPT_UNDO_MAX_LEVELS,
  LegacyAdoptUndoStack,
  MemoryBackend,
  adoptLegacyFragmentManually,
  makeManualAdoptRecord,
  undoLastManualAdopt,
  type AdoptLegacyHistoryDeps,
  type ManualAdoptRecord,
  type ManualAdoptResult,
} from "./projectHistory.ts";
import { sanitizeLegacyFileName } from "./projectNameRegistry64R6.ts";

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
  const v = await tmp.saveVersion("tmp-probe-68v6", s);
  if (!v) throw new Error("không tính được hash spec");
  return v.hash;
}

/** Chuỗi legacy mơ hồ 1 version (spec 1 clip) — trả về id chuỗi + hash. */
async function seedFragment(store: HistoryStore, name: string, tag: string, nClips: number): Promise<{ frag: string; hash: string }> {
  const s = spec(name, Array.from({ length: nClips }, (_, i) => ({ id: `${tag}${i + 1}`, start: i * 2, duration: 2 })));
  const hash = await hashOfSpec(s);
  const frag = `file-${hash}-${sanitizeLegacyFileName(name)}`;
  const v = await store.saveVersion(frag, s);
  assert(v, "phải lưu được version cho chuỗi legacy");
  return { frag, hash };
}

function record(fragmentId: string, moved: number, n = 1): ManualAdoptRecord {
  return {
    envelopeId: UUID_A,
    fragmentId,
    moved,
    movedVersions: Array.from({ length: n }, (_, i) => ({ fromId: `${fragmentId}@${i}-a`, toId: `${UUID_A}@${i}-b` })),
    wasPointerChain: false,
    adoptedAt: 1000 + moved,
  };
}

async function main(): Promise<void> {
  console.log("legacyAdopt68V6:");

  // -- S. Stack thuần ------------------------------------------------------
  await test("S1: push/peek/pop LIFO — pop ngược thứ tự push, peek không pop, rỗng → undefined", () => {
    const st = new LegacyAdoptUndoStack();
    eq(st.size, 0);
    eq(st.peek(), undefined);
    eq(st.pop(), undefined);
    st.push(record("file-aaa", 1));
    st.push(record("file-bbb", 2));
    st.push(record("file-ccc", 3));
    eq(st.size, 3);
    eq(st.peek()?.fragmentId, "file-ccc", "peek thấy mức mới nhất");
    eq(st.size, 3, "peek không pop");
    eq(st.pop()?.fragmentId, "file-ccc");
    eq(st.pop()?.fragmentId, "file-bbb");
    eq(st.peek()?.fragmentId, "file-aaa");
    eq(st.pop()?.fragmentId, "file-aaa");
    eq(st.size, 0);
    eq(st.pop(), undefined, "pop stack rỗng → undefined, không throw");
  });

  await test("S2: giới hạn 20 mức — push mức 21 bỏ mức cũ nhất, trả về đúng bản ghi đã bỏ", () => {
    eq(LEGACY_ADOPT_UNDO_MAX_LEVELS, 20, "giới hạn stack là 20 mức");
    const st = new LegacyAdoptUndoStack();
    let dropped: ManualAdoptRecord | null = null;
    for (let i = 0; i < 20; i++) {
      eq(st.push(record(`file-${String(i).padStart(2, "0")}`, 1)).dropped, null, `push mức ${i + 1} chưa vượt giới hạn`);
    }
    eq(st.size, 20);
    const r21 = st.push(record("file-20", 1));
    dropped = r21.dropped;
    eq(st.size, 20, "vẫn 20 mức sau khi push mức 21");
    eq(dropped?.fragmentId, "file-00", "mức cũ nhất (đầu tiên push) bị bỏ");
    eq(st.list()[0].fragmentId, "file-01", "đáy stack nay là mức thứ 2");
    eq(st.peek()?.fragmentId, "file-20", "đỉnh stack là mức mới nhất");
    eq(st.list().map((r) => r.fragmentId).length, 20);
  });

  await test("S3: clear dọn sạch stack, push sau clear hoạt động bình thường", () => {
    const st = new LegacyAdoptUndoStack();
    st.push(record("file-aaa", 1));
    st.push(record("file-bbb", 1));
    st.clear();
    eq(st.size, 0);
    eq(st.peek(), undefined);
    eq(st.list(), []);
    st.push(record("file-ccc", 1));
    eq(st.size, 1);
    eq(st.peek()?.fragmentId, "file-ccc");
  });

  await test("S4: makeManualAdoptRecord dựng đúng field + copy bảng id (không giữ tham chiếu)", () => {
    const result: ManualAdoptResult = {
      moved: 2,
      reason: "manual-adopted",
      movedVersions: [
        { fromId: "file-x@1-a", toId: `${UUID_A}@1-b` },
        { fromId: "file-x@2-a", toId: `${UUID_A}@2-b` },
      ],
      wasPointerChain: true,
    };
    const r = makeManualAdoptRecord(UUID_A, "file-x", result, 4242);
    eq(r.envelopeId, UUID_A);
    eq(r.fragmentId, "file-x");
    eq(r.moved, 2);
    eq(r.movedVersions, result.movedVersions);
    eq(r.wasPointerChain, true);
    eq(r.adoptedAt, 4242);
    result.movedVersions[0].fromId = "đã-đổi";
    eq(r.movedVersions[0].fromId, "file-x@1-a", "factory copy từng cặp id — đổi kết quả gốc không đổi bản ghi");
  });

  // -- T. Tích hợp adopt + undoLastManualAdopt -----------------------------
  await test("T1: nhận 2 chuỗi rồi hoàn tác từng mức — mức sau về trước, envelope sạch sau mức cuối", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const a = await seedFragment(store, "Kiểm tra V6", "a", 1);
    const b = await seedFragment(store, "Kiểm tra V6", "b", 2);
    assert(a.frag !== b.frag, "2 chuỗi phải khác id");
    const f = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    const mA = await adoptLegacyFragmentManually(UUID_A, a.frag, f.deps);
    eq(mA.reason, "manual-adopted");
    st.push(makeManualAdoptRecord(UUID_A, a.frag, mA));
    const mB = await adoptLegacyFragmentManually(UUID_A, b.frag, f.deps);
    eq(mB.reason, "manual-adopted");
    st.push(makeManualAdoptRecord(UUID_A, b.frag, mB));
    eq(st.size, 2);
    eq((await store.listVersions(UUID_A)).length, 2, "envelope có 2 version (1 mỗi chuỗi)");
    // Hoàn tác mức 1: chuỗi B (nhận sau) về trước.
    const u1 = await undoLastManualAdopt(st, UUID_A, f.deps);
    assert(u1, "stack không rỗng thì phải pop được");
    eq(u1.record.fragmentId, b.frag, "pop mức nhận sau cùng trước (LIFO)");
    eq(u1.result.reason, "undone");
    eq(u1.result.movedBack, 1);
    eq((await store.listVersions(b.frag)).length, 1, "chuỗi B có lại 1 version");
    eq((await store.listVersions(a.frag)).length, 0, "chuỗi A vẫn trong envelope");
    eq((await store.listVersions(UUID_A)).length, 1, "envelope còn đúng version của A");
    eq(st.size, 1);
    // Hoàn tác mức 2: chuỗi A về, envelope sạch.
    const u2 = await undoLastManualAdopt(st, UUID_A, f.deps);
    assert(u2, "còn 1 mức thì phải pop được");
    eq(u2.record.fragmentId, a.frag);
    eq(u2.result.movedBack, 1);
    eq((await store.listVersions(a.frag)).length, 1, "chuỗi A có lại 1 version");
    eq((await store.listVersions(UUID_A)).length, 0, "envelope sạch sau khi hoàn tác hết");
    eq(st.size, 0);
  });

  await test("T2: nhận tất cả 3 chuỗi (kể cả chuỗi 2 version) rồi hoàn tác ngược — mỗi mức khôi phục đúng chuỗi", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const a = await seedFragment(store, "Kiểm tra V6", "a", 1);
    const b = await seedFragment(store, "Kiểm tra V6", "b", 2);
    // Chuỗi C: 2 version (spec 1 clip rồi 2 clip, cùng chuỗi).
    const specC1 = spec("Kiểm tra V6", [{ id: "c1", start: 0, duration: 2 }]);
    const hashC = await hashOfSpec(specC1);
    const fragC = `file-${hashC}-${sanitizeLegacyFileName("Kiểm tra V6")}`;
    await store.saveVersion(fragC, specC1);
    await store.saveVersion(fragC, spec("Kiểm tra V6", [{ id: "c1", start: 0, duration: 2 }, { id: "c2", start: 2, duration: 2 }]));
    const f = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    for (const frag of [a.frag, b.frag, fragC]) {
      const m = await adoptLegacyFragmentManually(UUID_A, frag, f.deps);
      eq(m.reason, "manual-adopted");
      st.push(makeManualAdoptRecord(UUID_A, frag, m));
    }
    eq(st.size, 3);
    eq((await store.listVersions(UUID_A)).length, 4, "envelope có 1+1+2 = 4 version");
    // Hoàn tác ngược: C (2 version) → B → A.
    const uC = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(uC?.record.fragmentId, fragC);
    eq(uC?.result.movedBack, 2, "mức C trả đúng 2 version");
    eq((await store.listVersions(fragC)).length, 2, "chuỗi C đủ 2 version sau hoàn tác");
    eq((await store.listVersions(UUID_A)).length, 2);
    const uB = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(uB?.record.fragmentId, b.frag);
    eq(uB?.result.movedBack, 1);
    eq((await store.listVersions(b.frag)).length, 1);
    const uA = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(uA?.record.fragmentId, a.frag);
    eq(uA?.result.movedBack, 1);
    eq((await store.listVersions(UUID_A)).length, 0, "envelope sạch sau 3 mức");
    eq(st.size, 0);
  });

  await test("T3: nhận sau khi hoàn tác một phần — mức mới chồng lên mức còn lại, pop đúng thứ tự", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const a = await seedFragment(store, "Kiểm tra V6", "a", 1);
    const b = await seedFragment(store, "Kiểm tra V6", "b", 1);
    const c = await seedFragment(store, "Kiểm tra V6", "c", 1);
    const f = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    st.push(makeManualAdoptRecord(UUID_A, a.frag, await adoptLegacyFragmentManually(UUID_A, a.frag, f.deps)));
    st.push(makeManualAdoptRecord(UUID_A, b.frag, await adoptLegacyFragmentManually(UUID_A, b.frag, f.deps)));
    // Hoàn tác B (mức trên cùng), rồi nhận C — stack nay là [A, C].
    const uB = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(uB?.record.fragmentId, b.frag);
    eq(st.size, 1);
    eq((await store.listVersions(b.frag)).length, 1, "B về lại chuỗi gốc");
    st.push(makeManualAdoptRecord(UUID_A, c.frag, await adoptLegacyFragmentManually(UUID_A, c.frag, f.deps)));
    eq(st.size, 2);
    eq(st.list().map((r) => r.fragmentId), [a.frag, c.frag], "stack còn [A, C] theo thứ tự nhận");
    // Pop: C trước rồi A (không phải B — B đã hoàn tác xong).
    eq((await undoLastManualAdopt(st, UUID_A, f.deps))?.record.fragmentId, c.frag);
    eq((await store.listVersions(c.frag)).length, 1);
    eq((await store.listVersions(a.frag)).length, 0, "A vẫn trong envelope");
    eq((await undoLastManualAdopt(st, UUID_A, f.deps))?.record.fragmentId, a.frag);
    eq((await store.listVersions(UUID_A)).length, 0);
    eq(st.size, 0);
  });

  await test("T4: chuỗi con trỏ nằm giữa stack — hoàn tác chuỗi thường không chạm khóa, hoàn tác con trỏ khôi phục khóa", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const p = await seedFragment(store, "Kiểm tra V6", "p", 1);
    const g = await seedFragment(store, "Kiểm tra V6", "g", 1);
    // Khóa legacy trỏ tới chuỗi P (con trỏ) — deps đọc đúng chuỗi đó.
    const fP = fakeDeps(store, p.frag);
    const fG = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    const mP = await adoptLegacyFragmentManually(UUID_A, p.frag, fP.deps);
    eq(mP.wasPointerChain, true, "P là chuỗi con trỏ");
    assert(fP.cleared(), "nhận chuỗi con trỏ thì dọn khóa");
    st.push(makeManualAdoptRecord(UUID_A, p.frag, mP));
    const mG = await adoptLegacyFragmentManually(UUID_A, g.frag, fG.deps);
    eq(mG.wasPointerChain, false);
    st.push(makeManualAdoptRecord(UUID_A, g.frag, mG));
    // Hoàn tác G trước: khóa không bị ghi lại (G không phải con trỏ).
    const uG = await undoLastManualAdopt(st, UUID_A, fG.deps);
    eq(uG?.record.fragmentId, g.frag);
    eq(uG?.result.pointerRestored, false);
    eq(fG.written(), null, "hoàn tác chuỗi thường không ghi khóa");
    eq((await store.listVersions(p.frag)).length, 0, "P vẫn trong envelope");
    // Hoàn tác P: khóa con trỏ được ghi lại về đúng P.
    const uP = await undoLastManualAdopt(st, UUID_A, fP.deps);
    eq(uP?.record.fragmentId, p.frag);
    eq(uP?.result.pointerRestored, true);
    eq(fP.written(), p.frag, "khóa con trỏ ghi lại đúng id chuỗi P");
    eq((await store.listVersions(p.frag)).length, 1);
    eq((await store.listVersions(UUID_A)).length, 0);
  });

  await test("T5: stack rỗng → undoLastManualAdopt trả null, không đụng kho", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion(UUID_A, spec("Kiểm tra V6", [{ id: "x1", start: 0, duration: 2 }]));
    const f = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    eq(await undoLastManualAdopt(st, UUID_A, f.deps), null);
    eq(st.size, 0);
    eq((await store.listVersions(UUID_A)).length, 1, "kho không đổi khi stack rỗng");
    assert(f.written() === null);
  });

  await test("T6: envelope lệch — bản ghi được đẩy TRỞ LẠI stack, không mất, kho không đổi", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const a = await seedFragment(store, "Kiểm tra V6", "a", 1);
    const f = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    st.push(makeManualAdoptRecord(UUID_A, a.frag, await adoptLegacyFragmentManually(UUID_A, a.frag, f.deps)));
    eq((await store.listVersions(UUID_A)).length, 1);
    // Undo với envelope KHÁC (project đã đổi): không pop thật.
    const r = await undoLastManualAdopt(st, UUID_Q, f.deps);
    assert(r, "phải trả về bản ghi + kết quả");
    eq(r.record.fragmentId, a.frag);
    eq(r.result.reason, "envelope-mismatch");
    eq(r.result.movedBack, 0);
    eq(st.size, 1, "bản ghi vẫn trong stack (đẩy lại)");
    eq(st.peek()?.fragmentId, a.frag);
    eq((await store.listVersions(UUID_A)).length, 1, "kho không đổi khi envelope lệch");
    eq((await store.listVersions(UUID_Q)).length, 0);
    // Undo lại với đúng envelope thì hoàn tác được bình thường.
    const r2 = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(r2?.result.reason, "undone");
    eq(st.size, 0);
  });

  await test("T7: version bị xóa sau khi nhận — undo trả movedBack 0 (nothing-to-undo), mức đã dùng không pop thêm", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const a = await seedFragment(store, "Kiểm tra V6", "a", 1);
    const b = await seedFragment(store, "Kiểm tra V6", "b", 1);
    const f = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    const mA = await adoptLegacyFragmentManually(UUID_A, a.frag, f.deps);
    st.push(makeManualAdoptRecord(UUID_A, a.frag, mA));
    const mB = await adoptLegacyFragmentManually(UUID_A, b.frag, f.deps);
    st.push(makeManualAdoptRecord(UUID_A, b.frag, mB));
    // Xóa version của B khỏi envelope (mô phỏng prune/xóa tay sau khi nhận).
    await store.deleteVersion(mB.movedVersions[0].toId);
    eq((await store.listVersions(UUID_A)).length, 1, "envelope chỉ còn version của A");
    const uB = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(uB?.record.fragmentId, b.frag);
    eq(uB?.result.reason, "nothing-to-undo");
    eq(uB?.result.movedBack, 0);
    eq(st.size, 1, "chỉ pop đúng 1 mức trong một lần bấm — mức A còn nguyên");
    // Mức A vẫn hoàn tác được bình thường sau đó.
    const uA = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(uA?.result.reason, "undone");
    eq((await store.listVersions(a.frag)).length, 1);
    eq(st.size, 0);
  });

  await test("T8: nhận lại cùng chuỗi sau hoàn tác — stack chỉ giữ 1 mức mới (bất biến một mức/chuỗi)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const a = await seedFragment(store, "Kiểm tra V6", "a", 1);
    const f = fakeDeps(store, null);
    const st = new LegacyAdoptUndoStack();
    st.push(makeManualAdoptRecord(UUID_A, a.frag, await adoptLegacyFragmentManually(UUID_A, a.frag, f.deps)));
    eq(st.size, 1);
    const u1 = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(u1?.result.reason, "undone");
    eq(st.size, 0);
    eq((await store.listVersions(a.frag)).length, 1, "chuỗi A về lại, nhận lại được");
    // Nhận lại A: stack chỉ có đúng 1 mức mới (không còn mức cũ).
    st.push(makeManualAdoptRecord(UUID_A, a.frag, await adoptLegacyFragmentManually(UUID_A, a.frag, f.deps)));
    eq(st.size, 1);
    eq(st.list().filter((r) => r.fragmentId === a.frag).length, 1, "chỉ 1 bản ghi cho chuỗi A trong stack");
    const u2 = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(u2?.result.reason, "undone");
    eq((await store.listVersions(a.frag)).length, 1);
    eq(st.size, 0);
  });

  await test("T9: nhận chuỗi rỗng là con trỏ — mức vẫn push được, undo chỉ khôi phục khóa (undone-empty)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const emptyPtr = "file-abcdef123456-Kiem_tra_V6_vcut_json";
    const f = fakeDeps(store, emptyPtr);
    const st = new LegacyAdoptUndoStack();
    const m = await adoptLegacyFragmentManually(UUID_A, emptyPtr, f.deps);
    eq(m.reason, "manual-adopted-empty");
    eq(m.moved, 0);
    eq(m.wasPointerChain, true);
    // Modal chỉ push khi moved > 0 hoặc là con trỏ — mô phỏng đúng điều kiện đó.
    if (m.moved > 0 || m.wasPointerChain) st.push(makeManualAdoptRecord(UUID_A, emptyPtr, m));
    eq(st.size, 1, "mức con trỏ rỗng vẫn được push (có khóa để khôi phục)");
    const u = await undoLastManualAdopt(st, UUID_A, f.deps);
    eq(u?.result.reason, "undone-empty");
    eq(u?.result.movedBack, 0);
    eq(u?.result.pointerRestored, true);
    eq(f.written(), emptyPtr, "khóa con trỏ ghi lại đúng chuỗi rỗng");
    eq(st.size, 0);
  });

  console.log(
    `\nlegacyAdopt68V6: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
