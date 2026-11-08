/**
 * projectNameRegistry64R6.test.ts — Test thật cho registry project theo
 * projectId + hiển thị phân biệt tên trùng nhau (Phase 9 đợt 64, luồng
 * R6 — đóng nợ đợt 63 R7 §5: R7 đã khóa sổ theo id:<uuid> nhưng chuỗi
 * lịch sử vẫn khóa theo tên file, panel Dọn kho vẫn liệt kê trùng tên
 * không phân biệt được).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/projectNameRegistry64R6.test.ts
 *
 * Chỉ dùng HistoryStore thật + MemoryBackend (không chạm IndexedDB /
 * localStorage thật — adoption test inject localStorage giả qua deps).
 *
 * NỘI DUNG:
 *  A. Nhãn hiển thị phân biệt tên trùng (registryDisplayLabels):
 *     tên duy nhất giữ trần; trùng tên kèm id rút gọn / ngày ghi.
 *  B. Nhận diện chuỗi legacy file: sanitize + hậu tố tên + quyết định nhận.
 *  C. migrateVersions: đổi khóa chuỗi, remap parentId, id xác định
 *     (2 lượt chồng nhau không nhân đôi), gộp vào chuỗi đích có sẵn.
 *  D. Đổi tên không đứt chuỗi + hai project trùng tên tách chuỗi
 *     (lỗi gốc của luồng này: rename/new-chain theo tên).
 *  E. adoptLegacyHistoryChain: chỉ nhận chuỗi file- khớp tên, xóa khóa
 *     legacy sau khi nhận, lỗi thì giữ khóa để thử lại.
 *  F. Đợt 65 S9 — sửa lỗi nhận nhầm 2 file cùng tên: chỉ nhận khi có
 *     bằng chứng nội dung (hash spec khớp); spec rỗng / thiếu spec →
 *     từ chối, giữ khóa. File đổi tên trên đĩa vẫn nhận nhờ hash.
 *  G. Đợt 65 S9 — tự nhận chuỗi legacy phân mảnh: mảnh proj- và mảnh
 *     file- đổi tên có hash trùng thì nhận; mảnh cùng tên khác nội
 *     dung thì báo mơ hồ, không đụng; chuỗi project khác không đụng.
 *  H. Đợt 65 S9 — bộ phân loại thuần: parse id legacy, bảng luật
 *     decideLegacyAdoption (chuỗi con trỏ) + classifyLegacyFragment.
 */
import type { VideoSpec } from "@repo-1/video-spec";
import {
  HistoryStore,
  MemoryBackend,
  adoptLegacyHistoryChain,
  isValidEnvelopeProjectId,
  migratedVersionId,
  type AdoptLegacyHistoryDeps,
  type ProjectVersion,
  type VersionBackend,
} from "./projectHistory.ts";
import {
  classifyLegacyFragment,
  decideLegacyAdoption,
  isLegacyFileHistoryId,
  legacyFileChainMatchesName,
  legacyFileEmbeddedHash,
  parseLegacyFileId,
  projectIdFromRegistryKey,
  registryDisplayLabels,
  registryQualifier,
  sanitizeLegacyFileName,
  shortProjectId,
  shouldAdoptLegacyChain,
} from "./projectNameRegistry64R6.ts";

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
const UUID_B = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const UUID_E = "123e4567-e89b-12d3-a456-426614174000";

async function main(): Promise<void> {
  console.log("projectNameRegistry64R6:");

  // -- A. Nhãn hiển thị -------------------------------------------------
  await test("A1: tên duy nhất → nhãn trần, không qualifier", () => {
    const labels = registryDisplayLabels([
      { projectKey: `id:${UUID_A}`, projectName: "Dự án A", projectId: UUID_A, updatedAt: "2026-11-08T05:00:00.000Z" },
      { projectKey: `id:${UUID_B}`, projectName: "Dự án B", projectId: UUID_B, updatedAt: "2026-11-08T05:00:00.000Z" },
    ]);
    eq(labels.get(`id:${UUID_A}`), "Dự án A");
    eq(labels.get(`id:${UUID_B}`), "Dự án B");
  });

  await test("A2: hai bản ghi khóa id trùng tên → nhãn khác nhau, kèm 8 ký tự đầu id", () => {
    const labels = registryDisplayLabels([
      { projectKey: `id:${UUID_A}`, projectName: "Trùng tên", projectId: UUID_A, updatedAt: "2026-11-08T05:00:00.000Z" },
      { projectKey: `id:${UUID_B}`, projectName: "Trùng tên", projectId: UUID_B, updatedAt: "2026-11-08T06:00:00.000Z" },
    ]);
    const la = labels.get(`id:${UUID_A}`);
    const lb = labels.get(`id:${UUID_B}`);
    eq(la, "Trùng tên · 11111111");
    eq(lb, "Trùng tên · aaaaaaaa");
    assert(la !== lb, "hai nhãn phải khác nhau");
  });

  await test("A3: bản ghi id + bản ghi legacy cùng tên → nhãn khác nhau, legacy mang ngày ghi", () => {
    const labels = registryDisplayLabels([
      { projectKey: `id:${UUID_A}`, projectName: "Trùng tên", projectId: UUID_A, updatedAt: "2026-11-08T05:00:00.000Z" },
      { projectKey: "name:Trùng tên", projectName: "Trùng tên", updatedAt: "2026-11-07T09:12:00.000Z" },
    ]);
    eq(labels.get(`id:${UUID_A}`), "Trùng tên · 11111111");
    eq(labels.get("name:Trùng tên"), "Trùng tên · 2026-11-07 09:12");
  });

  await test("A4: ba bản ghi trùng tên (2 id + 1 legacy) → 3 nhãn phân biệt", () => {
    const labels = registryDisplayLabels([
      { projectKey: `id:${UUID_A}`, projectName: "X", projectId: UUID_A, updatedAt: "2026-11-08T05:00:00.000Z" },
      { projectKey: `id:${UUID_B}`, projectName: "X", projectId: UUID_B, updatedAt: "2026-11-08T06:00:00.000Z" },
      { projectKey: "name:X", projectName: "X", updatedAt: "2026-11-07T09:12:00.000Z" },
    ]);
    const vals = [...labels.values()];
    eq(new Set(vals).size, 3, "3 nhãn phải khác nhau từng đôi một");
  });

  await test("A5: bản ghi legacy không updatedAt → qualifier 'legacy'", () => {
    const labels = registryDisplayLabels([
      { projectKey: `id:${UUID_A}`, projectName: "X", projectId: UUID_A },
      { projectKey: "name:X", projectName: "X" },
    ]);
    eq(labels.get("name:X"), "X · legacy");
  });

  await test("A6: danh sách rỗng → Map rỗng; trùng khóa → cùng nhãn", () => {
    eq(registryDisplayLabels([]).size, 0);
    const labels = registryDisplayLabels([
      { projectKey: `id:${UUID_A}`, projectName: "X", projectId: UUID_A },
      { projectKey: `id:${UUID_A}`, projectName: "X", projectId: UUID_A },
    ]);
    eq(labels.size, 1);
  });

  await test("A7: shortProjectId / projectIdFromRegistryKey / registryQualifier", () => {
    eq(shortProjectId(UUID_A), "11111111");
    eq(projectIdFromRegistryKey(`id:${UUID_A}`), UUID_A);
    eq(projectIdFromRegistryKey("name:X"), null);
    eq(projectIdFromRegistryKey("id:"), null);
    // qualifier lấy id từ khóa khi field projectId vắng
    eq(registryQualifier({ projectKey: `id:${UUID_B}`, projectName: "X" }), "aaaaaaaa");
  });

  // -- B. Nhận diện chuỗi legacy file ------------------------------------
  await test("B1: sanitizeLegacyFileName y hệt setProjectIdForFile", () => {
    eq(sanitizeLegacyFileName("Dự án của tôi.vcut.json"), "D_n_c_a_t_i_vcut_json");
    eq(sanitizeLegacyFileName("a".repeat(50)), "a".repeat(40), "cắt 40 ký tự");
    eq(sanitizeLegacyFileName(""), "");
  });

  await test("B2: legacyFileChainMatchesName — khớp tên, hash đổi vẫn khớp", () => {
    const id1 = "file-abcdef123456-D_n_c_a_t_i_vcut_json";
    const id2 = "file-999999999999-D_n_c_a_t_i_vcut_json"; // hash khác = nội dung đã sửa
    assert(legacyFileChainMatchesName(id1, "Dự án của tôi.vcut.json"), "khớp tên");
    assert(legacyFileChainMatchesName(id2, "Dự án của tôi.vcut.json"), "hash đổi vẫn khớp (chỉ so hậu tố tên)");
    assert(!legacyFileChainMatchesName(id1, "Tên khác.vcut.json"), "khác tên → không khớp");
    assert(!legacyFileChainMatchesName("proj-abc-def", "Dự án của tôi.vcut.json"), "id proj- không phải chuỗi file");
    assert(!legacyFileChainMatchesName(id1, ""), "tên rỗng → không khớp");
    assert(!legacyFileChainMatchesName("file-abcdef123456-", "!!!"), "tên sanitize rỗng → không khớp");
  });

  await test("B3: shouldAdoptLegacyChain — chỉ nhận file- khớp tên", () => {
    const fileId = "file-abcdef123456-D_n_c_a_t_i_vcut_json";
    eq(shouldAdoptLegacyChain(fileId, "Dự án của tôi.vcut.json").adopt, true);
    eq(shouldAdoptLegacyChain(fileId, "Tên khác.vcut.json").adopt, false);
    eq(shouldAdoptLegacyChain(fileId).adopt, false, "không có tên file → không nhận");
    eq(shouldAdoptLegacyChain("proj-abc-def", "Dự án của tôi.vcut.json").adopt, false, "chuỗi proj- không tự nhận");
    eq(shouldAdoptLegacyChain(UUID_E, "x.vcut.json").adopt, false, "UUID không phải chuỗi legacy");
    eq(shouldAdoptLegacyChain(null, "x.vcut.json").adopt, false);
    eq(shouldAdoptLegacyChain("", "x.vcut.json").adopt, false);
    assert(isLegacyFileHistoryId(fileId));
    assert(!isLegacyFileHistoryId("proj-abc-def"));
  });

  // -- C. migrateVersions --------------------------------------------------
  await test("C1: migrateVersions chuyển đủ version, remap parentId, hàng cũ biến mất", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-D_n_c_a_t_i_vcut_json";
    await store.saveVersion(legacy, spec("P", []));
    await store.saveVersion(legacy, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    const before = await store.listVersions(legacy);
    eq(before.length, 2);
    const r = await store.migrateVersions(legacy, UUID_E);
    eq(r.moved, 2);
    eq((await store.listVersions(legacy)).length, 0, "chuỗi nguồn rỗng sau migration");
    const after = await store.listVersions(UUID_E);
    eq(after.length, 2);
    assert(after.every((v) => v.projectId === UUID_E), "mọi version mang id đích");
    const vEmpty = after.find((v) => (v.spec.tracks[0].clips as unknown[]).length === 0);
    const vOne = after.find((v) => (v.spec.tracks[0].clips as unknown[]).length === 1);
    assert(vEmpty && vOne, "đủ 2 version theo nội dung spec");
    eq(vOne.parentId, vEmpty.id, "parentId remap về id mới của version cha");
    eq(vEmpty.parentId, "", "version đầu parentId rỗng");
    eq(vOne.id, migratedVersionId(UUID_E, vOne), "id migration xác định theo công thức");
  });

  await test("C2: from === to → moved 0, không đổi gì", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion(UUID_E, spec("P", []));
    eq((await store.migrateVersions(UUID_E, UUID_E)).moved, 0);
    eq((await store.listVersions(UUID_E)).length, 1);
  });

  await test("C3: projectId đích không hợp lệ → throw", async () => {
    const store = new HistoryStore(new MemoryBackend());
    let threw = false;
    try { await store.migrateVersions("file-abc-x", "file-xyz"); } catch { threw = true; }
    assert(threw, "id đích dạng file- phải throw");
  });

  await test("C4: chuỗi nguồn rỗng → moved 0", async () => {
    const store = new HistoryStore(new MemoryBackend());
    eq((await store.migrateVersions("file-khong-co-gi", UUID_E)).moved, 0);
  });

  await test("C5: hai lượt migration chồng nhau → không nhân đôi version đích", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-D_n_c_a_t_i_vcut_json";
    await store.saveVersion(legacy, spec("P", []));
    await store.saveVersion(legacy, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    const [r1, r2] = await Promise.all([
      store.migrateVersions(legacy, UUID_E),
      store.migrateVersions(legacy, UUID_E),
    ]);
    // Mỗi lượt đều có thể thấy đủ 2 version (cùng list trước khi xóa)
    // nên moved từng lượt không khóa được — chỉ khóa trạng thái cuối:
    // đích đúng 2 version, nguồn rỗng, không nhân đôi.
    assert(r1.moved >= 0 && r2.moved >= 0, "mỗi lượt trả moved hợp lệ");
    eq((await store.listVersions(UUID_E)).length, 2, "đích không nhân đôi");
    eq((await store.listVersions(legacy)).length, 0);
    // chạy lại lần nữa vẫn ổn định (idempotent)
    eq((await store.migrateVersions(legacy, UUID_E)).moved, 0);
    eq((await store.listVersions(UUID_E)).length, 2);
  });

  await test("C6: gộp vào chuỗi đích đã có version → xen kẽ, đủ số lượng", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-D_n_c_a_t_i_vcut_json";
    await store.saveVersion(UUID_E, spec("P", [{ id: "c9", start: 0, duration: 9 }]));
    await store.saveVersion(legacy, spec("P", []));
    await store.saveVersion(legacy, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    eq((await store.migrateVersions(legacy, UUID_E)).moved, 2);
    eq((await store.listVersions(UUID_E)).length, 3);
  });

  await test("C7: isValidEnvelopeProjectId — UUID/proj- hợp lệ, file- rỗng không hợp lệ", () => {
    assert(isValidEnvelopeProjectId(UUID_E));
    assert(isValidEnvelopeProjectId("proj-abc123-def456"));
    assert(!isValidEnvelopeProjectId("file-abcdef123456-x"));
    assert(!isValidEnvelopeProjectId(""));
    assert(!isValidEnvelopeProjectId(123));
  });

  // -- D. Đổi tên không đứt chuỗi + trùng tên tách chuỗi ------------------
  await test("D1: đổi tên project không đứt chuỗi lịch sử (lỗi gốc của luồng)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion(UUID_E, spec("Tên cũ", []));
    await store.saveVersion(UUID_E, spec("Tên mới", [{ id: "c1", start: 0, duration: 2 }]));
    const list = await store.listVersions(UUID_E);
    eq(list.length, 2, "cùng một chuỗi sau khi đổi tên");
    assert(list[1].summary.some((s) => s.includes("Tên cũ") && s.includes("Tên mới")), "summary ghi dòng đổi tên");
  });

  await test("D2: hai project trùng tên khác id → hai chuỗi riêng, không lẫn", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion(UUID_A, spec("Trùng tên", []));
    await store.saveVersion(UUID_B, spec("Trùng tên", [{ id: "c1", start: 0, duration: 3 }]));
    await store.saveVersion(UUID_A, spec("Trùng tên", [{ id: "c2", start: 0, duration: 4 }]));
    eq((await store.listVersions(UUID_A)).length, 2);
    eq((await store.listVersions(UUID_B)).length, 1);
    const bOnly = (await store.listVersions(UUID_B))[0];
    eq((bOnly.spec.tracks[0].clips as unknown[]).length, 1, "chuỗi B chỉ có version của B");
    assert(((bOnly.spec.tracks[0].clips as Array<{ id: string }>)[0]).id === "c1", "clip của B không lẫn clip A");
  });

  await test("D3: restoreVersion sau đổi tên trả đúng spec tên mới", async () => {
    const store = new HistoryStore(new MemoryBackend());
    await store.saveVersion(UUID_E, spec("Tên cũ", []));
    const v = await store.saveVersion(UUID_E, spec("Tên mới", [{ id: "c1", start: 0, duration: 2 }]));
    assert(v, "phải tạo được version thứ hai");
    const restored = await store.restoreVersion(v.id);
    eq(restored?.meta.name, "Tên mới");
  });

  // -- E. adoptLegacyHistoryChain ------------------------------------------
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

  await test("E1: adopt chuỗi file- khớp tên → chuyển version + xóa khóa legacy", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-D_n_c_a_t_i_vcut_json";
    await store.saveVersion(legacy, spec("P", []));
    await store.saveVersion(legacy, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    const f = fakeDeps(store, legacy);
    // Đợt 65 S9 — E1 nay đưa spec đang mở làm bằng chứng nội dung: hash
    // của spec khớp hash version mới nhất trong chuỗi → nhận chắc chắn.
    const r = await adoptLegacyHistoryChain(UUID_E, "Dự án của tôi.vcut.json", f.deps, {
      spec: spec("P", [{ id: "c1", start: 0, duration: 2 }]),
    });
    eq(r.adopted, true);
    eq(r.moved, 2);
    eq(r.from, legacy);
    assert(f.cleared(), "khóa legacy phải bị xóa sau khi nhận");
    eq((await store.listVersions(UUID_E)).length, 2);
    eq((await store.listVersions(legacy)).length, 0);
  });

  await test("E2: tên file khác → không nhận, chuỗi + khóa còn nguyên", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-D_n_c_a_t_i_vcut_json";
    await store.saveVersion(legacy, spec("P", []));
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_E, "Tên khác.vcut.json", f.deps);
    eq(r.adopted, false);
    eq(r.reason, "name-mismatch");
    eq(r.moved, 0);
    assert(!f.cleared(), "không nhận thì không xóa khóa");
    eq((await store.listVersions(legacy)).length, 1, "chuỗi nguồn còn nguyên");
  });

  await test("E3: chuỗi proj- → không tự nhận (không có tín hiệu tên file)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "proj-m123456-abcdef";
    await store.saveVersion(legacy, spec("P", []));
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_E, "P.vcut.json", f.deps);
    eq(r.adopted, false);
    eq(r.reason, "not-file-chain");
    assert(!f.cleared(), "không nhận thì không xóa khóa");
    eq((await store.listVersions(legacy)).length, 1);
  });

  await test("E4: không có khóa legacy → không nhận, reason no-legacy-id", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const f = fakeDeps(store, null);
    const r = await adoptLegacyHistoryChain(UUID_E, "P.vcut.json", f.deps);
    eq(r.adopted, false);
    eq(r.reason, "no-legacy-id");
    assert(!f.cleared());
  });

  await test("E5: legacyId === envelopeId → không nhận", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const f = fakeDeps(store, UUID_E);
    const r = await adoptLegacyHistoryChain(UUID_E, "P.vcut.json", f.deps);
    eq(r.adopted, false);
    eq(r.reason, "already-envelope-id");
    assert(!f.cleared());
  });

  await test("E6: envelopeId không hợp lệ → không nhận, không throw", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const f = fakeDeps(store, "file-abcdef123456-P_vcut_json");
    const r = await adoptLegacyHistoryChain("file-xyz", "P.vcut.json", f.deps);
    eq(r.adopted, false);
    eq(r.reason, "invalid-envelope-id");
    assert(!f.cleared());
  });

  await test("E7: chuỗi nguồn rỗng nhưng quyết định nhận → adopted, khóa vẫn bị xóa", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-P_vcut_json";
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_E, "P.vcut.json", f.deps);
    eq(r.adopted, true);
    eq(r.moved, 0);
    assert(f.cleared(), "con trỏ chết được dọn để lần sau khỏi thử lại");
  });

  await test("E8: store lỗi giữa chừng → adopted false, reason error, khóa KHÔNG bị xóa", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-P_vcut_json";
    await store.saveVersion(legacy, spec("P", []));
    // backend hỏng: list ném lỗi → migrateVersions throw → adopt bắt lỗi
    const broken = {
      put: async (_v: ProjectVersion) => undefined,
      get: async (_id: string) => null,
      list: async (_pid: string): Promise<ProjectVersion[]> => { throw new Error("IDB hỏng"); },
      delete: async (_id: string) => undefined,
    };
    const brokenStore = new HistoryStore(broken);
    const f = fakeDeps(brokenStore, legacy);
    const r = await adoptLegacyHistoryChain(UUID_E, "P.vcut.json", f.deps);
    eq(r.adopted, false);
    eq(r.reason, "error");
    assert(typeof r.error === "string" && r.error.length > 0, "phải kèm thông báo lỗi");
    assert(!f.cleared(), "lỗi thì giữ khóa để lần mở sau thử lại");
  });

  // -- F. Đợt 65 S9 — lỗi nhận nhầm 2 file cùng tên (nợ #9) ---------------
  // Hash thật của một spec: lưu tạm rồi đọc field hash của version
  // (hash = specHash của spec đó, không cần export hàm hash nội bộ).
  async function hashOfSpec(s: VideoSpec): Promise<string> {
    const tmp = new HistoryStore(new MemoryBackend());
    const v = await tmp.saveVersion("tmp-probe-65s9", s);
    if (!v) throw new Error("không tính được hash spec");
    return v.hash;
  }

  await test("F1 [REPRO nợ #9]: hai file khác nhau cùng tên — mở file A KHÔNG được nhận chuỗi của file B", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specA = spec("Dự án", [{ id: "cA", start: 0, duration: 5 }]);
    const specB = spec("Dự án", [{ id: "cB", start: 0, duration: 9 }]);
    const hashB = await hashOfSpec(specB);
    const legacyB = `file-${hashB}-${sanitizeLegacyFileName("Dự án.vcut.json")}`;
    await store.saveVersion(legacyB, specB);
    await store.saveVersion(legacyB, spec("Dự án", [{ id: "cB", start: 0, duration: 9 }, { id: "cB2", start: 9, duration: 1 }]));
    const f = fakeDeps(store, legacyB);
    const r = await adoptLegacyHistoryChain(UUID_A, "Dự án.vcut.json", f.deps, { spec: specA });
    eq(r.adopted, false, "mở file A phải từ chối chuỗi của file B");
    eq(r.reason, "ambiguous-name-only-hash-mismatch");
    eq(r.moved, 0);
    assert(!f.cleared(), "từ chối thì KHÔNG xóa khóa — để lần mở đúng file B còn nhận được");
    eq((await store.listVersions(legacyB)).length, 2, "chuỗi B còn nguyên");
    eq((await store.listVersions(UUID_A)).length, 0, "chuỗi A không bị nhiễm version của B");
  });

  await test("F2: mở đúng file (hash khớp) → nhận chuỗi, xóa khóa", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specB = spec("Dự án", [{ id: "cB", start: 0, duration: 9 }]);
    const hashB = await hashOfSpec(specB);
    const legacyB = `file-${hashB}-${sanitizeLegacyFileName("Dự án.vcut.json")}`;
    await store.saveVersion(legacyB, specB);
    await store.saveVersion(legacyB, spec("Dự án", [{ id: "cB", start: 0, duration: 9 }, { id: "cB2", start: 9, duration: 1 }]));
    const f = fakeDeps(store, legacyB);
    const r = await adoptLegacyHistoryChain(UUID_A, "Dự án.vcut.json", f.deps, { spec: specB });
    eq(r.adopted, true);
    eq(r.reason, "content-hash-match");
    eq(r.moved, 2);
    assert(f.cleared(), "nhận xong mới xóa khóa");
    eq((await store.listVersions(UUID_A)).length, 2);
    eq((await store.listVersions(legacyB)).length, 0);
  });

  await test("F3: hash nhúng đã cũ nhưng hash version trong chuỗi khớp → vẫn nhận (file về trạng thái cũ)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specV1 = spec("P", [{ id: "c1", start: 0, duration: 2 }]);
    const specV2 = spec("P", [{ id: "c1", start: 0, duration: 2 }, { id: "c2", start: 2, duration: 3 }]);
    const hashV2 = await hashOfSpec(specV2);
    const legacy = `file-${hashV2}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(legacy, specV1);
    await store.saveVersion(legacy, specV2);
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps, { spec: specV1 });
    eq(r.adopted, true, "spec đang mở khớp version cũ trong chuỗi");
    eq(r.reason, "content-hash-match");
    eq(r.moved, 2);
  });

  await test("F4: file đổi tên trên đĩa (tên khác, hash khớp) → vẫn nhận", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specB = spec("H", [{ id: "cb", start: 0, duration: 3 }]);
    const hashB = await hashOfSpec(specB);
    const legacy = `file-${hashB}-${sanitizeLegacyFileName("Ten cu.vcut.json")}`;
    await store.saveVersion(legacy, specB);
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_A, "Ten moi.vcut.json", f.deps, { spec: specB });
    eq(r.adopted, true, "hash nội dung khớp thì tên file chỉ là nhãn");
    eq(r.reason, "content-hash-match");
    eq(r.moved, 1);
    assert(f.cleared());
  });

  await test("F5: spec rỗng (0 clip) dù hash khớp vẫn từ chối — hai project mới tinh có spec giống hệt nhau", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const empty = spec("P", []);
    const hashEmpty = await hashOfSpec(empty);
    const legacy = `file-${hashEmpty}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(legacy, empty);
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps, { spec: empty });
    eq(r.adopted, false);
    eq(r.reason, "ambiguous-trivial-spec");
    assert(!f.cleared(), "từ chối thì giữ khóa");
    eq((await store.listVersions(legacy)).length, 1, "chuỗi còn nguyên");
  });

  await test("F6: không đưa spec (không có bằng chứng nội dung) → từ chối, giữ khóa", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const legacy = "file-abcdef123456-P_vcut_json";
    await store.saveVersion(legacy, spec("P", [{ id: "c1", start: 0, duration: 2 }]));
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps);
    eq(r.adopted, false, "chỉ khớp tên thì không đủ để nhận nữa");
    eq(r.reason, "ambiguous-no-content-evidence");
    eq(r.moved, 0);
    assert(!f.cleared());
    eq((await store.listVersions(legacy)).length, 1);
  });

  // -- G. Đợt 65 S9 — tự nhận chuỗi legacy phân mảnh ----------------------
  await test("G1: mảnh proj- (project chưa từng lưu file) có hash trùng spec đang mở → tự nhận cùng chuỗi con trỏ", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specV2 = spec("F", [{ id: "c1", start: 0, duration: 2 }, { id: "c2", start: 2, duration: 3 }]);
    const hashV2 = await hashOfSpec(specV2);
    const legacyFile = `file-${hashV2}-${sanitizeLegacyFileName("F.vcut.json")}`;
    await store.saveVersion(legacyFile, specV2);
    const legacyProj = "proj-m123456-abcdef";
    await store.saveVersion(legacyProj, specV2);
    const f = fakeDeps(store, legacyFile);
    const r = await adoptLegacyHistoryChain(UUID_A, "F.vcut.json", f.deps, { spec: specV2 });
    eq(r.adopted, true, "chuỗi con trỏ nhận");
    eq(r.moved, 1);
    eq(r.fragmentsAdopted?.length, 1, "mảnh proj- cũng được nhận");
    eq(r.fragmentsAdopted?.[0].from, legacyProj);
    eq(r.fragmentsAdopted?.[0].moved, 1);
    eq((await store.listVersions(legacyProj)).length, 0, "mảnh proj- đã chuyển đi");
    eq((await store.listVersions(legacyFile)).length, 0);
    const env = await store.listVersions(UUID_A);
    assert(env.length >= 1, "envelope có version sau gộp");
    assert(env.every((v) => v.projectId === UUID_A), "mọi version gộp đều mang id envelope");
    assert(env.some((v) => v.hash === hashV2), "envelope giữ đúng nội dung spec đã mở");
  });

  await test("G2: mảnh file- cũ cùng tên nhưng khác nội dung → mơ hồ, KHÔNG nhận, còn nguyên", async () => {
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
    eq(r.fragmentsAdopted?.length, 0);
    eq(r.fragmentsAmbiguous?.length, 1, "mảnh cũ được báo mơ hồ thay vì lặng lẽ bỏ");
    eq(r.fragmentsAmbiguous?.[0].from, fragOld);
    eq(r.fragmentsAmbiguous?.[0].reason, "ambiguous-name-only-hash-mismatch");
    eq((await store.listVersions(fragOld)).length, 1, "mảnh mơ hồ còn nguyên");
    eq((await store.listVersions(UUID_A)).length, 1, "envelope không nhiễm version mảnh cũ");
  });

  await test("G3: mảnh file- đổi tên (hash khớp, tên khác) → tự nhận", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specB = spec("H", [{ id: "cb", start: 0, duration: 3 }]);
    const hashB = await hashOfSpec(specB);
    const pointer = `file-${hashB}-${sanitizeLegacyFileName("H.vcut.json")}`;
    await store.saveVersion(pointer, specB);
    const fragRenamed = `file-${hashB}-${sanitizeLegacyFileName("Ten cu.vcut.json")}`;
    await store.saveVersion(fragRenamed, specB);
    const f = fakeDeps(store, pointer);
    const r = await adoptLegacyHistoryChain(UUID_A, "H.vcut.json", f.deps, { spec: specB });
    eq(r.adopted, true);
    eq(r.fragmentsAdopted?.length, 1);
    eq(r.fragmentsAdopted?.[0].from, fragRenamed);
    eq(r.fragmentsAdopted?.[0].moved, 1);
    eq((await store.listVersions(fragRenamed)).length, 0);
  });

  await test("G4: chuỗi legacy của project khác (khác tên, khác nội dung) → không đụng, không liệt kê", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specY = spec("G", [{ id: "cy", start: 0, duration: 4 }]);
    const specZ = spec("Z", [{ id: "cz", start: 0, duration: 6 }]);
    const hashY = await hashOfSpec(specY);
    const hashZ = await hashOfSpec(specZ);
    const pointer = `file-${hashY}-${sanitizeLegacyFileName("G.vcut.json")}`;
    const other = `file-${hashZ}-${sanitizeLegacyFileName("Khac.vcut.json")}`;
    await store.saveVersion(pointer, specY);
    await store.saveVersion(other, specZ);
    const f = fakeDeps(store, pointer);
    const r = await adoptLegacyHistoryChain(UUID_A, "G.vcut.json", f.deps, { spec: specY });
    eq(r.adopted, true);
    eq(r.fragmentsAdopted?.length, 0);
    eq(r.fragmentsAmbiguous?.length, 0);
    eq((await store.listVersions(other)).length, 1, "chuỗi project khác còn nguyên");
    eq((await store.listVersions(UUID_A)).length, 1);
  });

  await test("G5: backend không liệt kê được projectId → quét mảnh bỏ qua, chuỗi con trỏ vẫn nhận", async () => {
    const map = new Map<string, ProjectVersion>();
    const noEnumBackend: VersionBackend = {
      put: async (v: ProjectVersion) => { map.set(v.id, v); },
      get: async (id: string) => map.get(id) ?? null,
      list: async (pid: string) =>
        [...map.values()].filter((v) => v.projectId === pid).sort((a, b) => a.createdAt - b.createdAt),
      delete: async (id: string) => { map.delete(id); },
    };
    const store = new HistoryStore(noEnumBackend);
    const specB = spec("P", [{ id: "c1", start: 0, duration: 2 }]);
    const hashB = await hashOfSpec(specB);
    const legacy = `file-${hashB}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(legacy, specB);
    await store.saveVersion("proj-m123456-abcdef", specB);
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps, { spec: specB });
    eq(r.adopted, true, "chuỗi con trỏ vẫn nhận bình thường");
    eq(r.moved, 1);
    eq(r.fragmentsSkipped, "store-cannot-enumerate");
    eq((await store.listVersions("proj-m123456-abcdef")).length, 1, "mảnh proj- chưa quét nên còn nguyên");
  });

  await test("G6: không đưa spec → quét mảnh bỏ qua (không có bằng chứng nội dung)", async () => {
    const store = new HistoryStore(new MemoryBackend());
    const specB = spec("P", [{ id: "c1", start: 0, duration: 2 }]);
    const hashB = await hashOfSpec(specB);
    const legacy = `file-${hashB}-${sanitizeLegacyFileName("P.vcut.json")}`;
    await store.saveVersion(legacy, specB);
    await store.saveVersion("proj-m123456-abcdef", specB);
    const f = fakeDeps(store, legacy);
    const r = await adoptLegacyHistoryChain(UUID_A, "P.vcut.json", f.deps);
    eq(r.fragmentsSkipped, "no-spec");
    eq((await store.listVersions("proj-m123456-abcdef")).length, 1, "mảnh proj- còn nguyên");
  });

  // -- H. Đợt 65 S9 — bộ phân loại thuần (decide/classify) ---------------
  await test("H1: parseLegacyFileId / legacyFileEmbeddedHash", () => {
    eq(parseLegacyFileId("file-abcdef12-D_n_c_a_t_i_vcut_json"), { hash: "abcdef12", namePart: "D_n_c_a_t_i_vcut_json" });
    eq(legacyFileEmbeddedHash("file-abcdef12-D_n_c_a_t_i_vcut_json"), "abcdef12");
    eq(parseLegacyFileId("proj-abc-def"), null);
    eq(parseLegacyFileId("file-xyz"), null);
    eq(parseLegacyFileId(""), null);
    eq(legacyFileEmbeddedHash("file-abcdef12-"), null);
  });

  await test("H2: decideLegacyAdoption — bảng luật chuỗi con trỏ", () => {
    const name = "P.vcut.json";
    const ev = (o: Record<string, unknown>) => o as unknown as Parameters<typeof decideLegacyAdoption>[2];
    // hash nhúng khớp → nhận (dù tên khác — file đổi tên)
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", "Ten moi.vcut.json", ev({ openedSpecHash: "aaaa1111", chainVersionHashes: ["bbbb2222"], specNonTrivial: true })).adopt, true);
    // hash version trong chuỗi khớp (hash nhúng đã cũ) → nhận
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", name, ev({ openedSpecHash: "bbbb2222", chainVersionHashes: ["bbbb2222"], specNonTrivial: true })).adopt, true);
    // chuỗi rỗng + tên khớp → nhận để dọn con trỏ chết (kể cả không có spec)
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", name, ev({ openedSpecHash: null, chainVersionHashes: [], specNonTrivial: false })), { adopt: true, reason: "adopted-empty-chain" });
    // chuỗi rỗng nhưng tên lệch → không dọn (không phải con trỏ của file này)
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", "Khac.vcut.json", ev({ openedSpecHash: null, chainVersionHashes: [], specNonTrivial: false })).adopt, false);
    // tên khớp, không có spec → mơ hồ
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", name, ev({ openedSpecHash: null, chainVersionHashes: ["cccc3333"], specNonTrivial: false })).reason, "ambiguous-no-content-evidence");
    // tên khớp, hash lệch, spec rỗng → mơ hồ (spec tầm thường)
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", name, ev({ openedSpecHash: "dddd4444", chainVersionHashes: ["cccc3333"], specNonTrivial: false })).reason, "ambiguous-trivial-spec");
    // tên khớp, hash lệch, spec thật → mơ hồ (đúng lỗi nợ #9)
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", name, ev({ openedSpecHash: "dddd4444", chainVersionHashes: ["cccc3333"], specNonTrivial: true })).reason, "ambiguous-name-only-hash-mismatch");
    // proj- / thiếu tên / tên lệch + hash lệch → từ chối hẳn
    eq(decideLegacyAdoption("proj-abc-def", name, ev({ openedSpecHash: "aaaa1111", chainVersionHashes: [], specNonTrivial: true })).reason, "not-file-chain");
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", undefined, ev({ openedSpecHash: "aaaa1111", chainVersionHashes: [], specNonTrivial: true })).reason, "no-file-name");
    eq(decideLegacyAdoption("file-aaaa1111-P_vcut_json", "Khac.vcut.json", ev({ openedSpecHash: "dddd4444", chainVersionHashes: ["cccc3333"], specNonTrivial: true })).reason, "name-mismatch");
    eq(decideLegacyAdoption(null, name, ev({})).reason, "no-legacy-id");
  });

  await test("H3: classifyLegacyFragment — bảng luật mảnh phân mảnh", () => {
    const ev = (o: Record<string, unknown>) => o as unknown as Parameters<typeof classifyLegacyFragment>[2];
    const full = ev({ openedSpecHash: "aaaa1111", chainVersionHashes: ["bbbb2222"], specNonTrivial: true });
    // mảnh file- hash khớp + tên khớp → chắc chắn
    eq(classifyLegacyFragment("file-aaaa1111-P_vcut_json", "P.vcut.json", full), { verdict: "certain", reason: "content-hash-match" });
    // mảnh file- hash khớp + tên khác → chắc chắn (đổi tên)
    eq(classifyLegacyFragment("file-aaaa1111-Ten_cu_vcut_json", "P.vcut.json", full), { verdict: "certain", reason: "content-hash-match-renamed" });
    // mảnh file- hash version khớp → chắc chắn
    eq(classifyLegacyFragment("file-eeee5555-P_vcut_json", "P.vcut.json", ev({ openedSpecHash: "bbbb2222", chainVersionHashes: ["bbbb2222"], specNonTrivial: true })), { verdict: "certain", reason: "content-hash-match" });
    // mảnh proj- hash trùng → chắc chắn (không có tín hiệu tên; bằng
    // chứng duy nhất là hash spec đang mở nằm trong các version chuỗi)
    eq(classifyLegacyFragment("proj-m123456-abcdef", "P.vcut.json", ev({ openedSpecHash: "aaaa1111", chainVersionHashes: ["aaaa1111"], specNonTrivial: true })), { verdict: "certain", reason: "content-hash-match-proj" });
    // mảnh file- cùng tên, hash lệch → mơ hồ
    eq(classifyLegacyFragment("file-eeee5555-P_vcut_json", "P.vcut.json", ev({ openedSpecHash: "dddd4444", chainVersionHashes: ["cccc3333"], specNonTrivial: true })), { verdict: "ambiguous", reason: "ambiguous-name-only-hash-mismatch" });
    // mảnh file- cùng tên, không có spec → mơ hồ
    eq(classifyLegacyFragment("file-eeee5555-P_vcut_json", "P.vcut.json", ev({ openedSpecHash: null, chainVersionHashes: ["cccc3333"], specNonTrivial: false })), { verdict: "ambiguous", reason: "ambiguous-no-content-evidence" });
    // mảnh proj- không có hash trùng → không có tín hiệu, bỏ qua lặng lẽ
    eq(classifyLegacyFragment("proj-m123456-abcdef", "P.vcut.json", ev({ openedSpecHash: "dddd4444", chainVersionHashes: ["cccc3333"], specNonTrivial: true })), { verdict: "unrelated", reason: "no-signal" });
    // chuỗi file- khác tên + khác hash → không liên quan
    eq(classifyLegacyFragment("file-eeee5555-Khac_vcut_json", "P.vcut.json", full), { verdict: "unrelated", reason: "no-signal" });
    // UUID envelope của project khác → không phải legacy
    eq(classifyLegacyFragment(UUID_E, "P.vcut.json", full), { verdict: "unrelated", reason: "not-legacy" });
  });

  console.log(
    `\nprojectNameRegistry64R6: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
