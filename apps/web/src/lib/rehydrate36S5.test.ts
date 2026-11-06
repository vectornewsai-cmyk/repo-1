/**
 * rehydrate36S5.test.ts — Test thật cho rehydrate sau reload
 * (Phase 9 đợt 36, luồng S5). Chạy trực tiếp, không cần trình duyệt:
 *
 *   node apps/web/src/lib/rehydrate36S5.test.ts
 *
 * (chạy từ gốc repo; cần Node có type-stripping, như các test .test.ts
 * khác của repo). Logic plan/collect thuần; bước async dùng fake deps
 * (không IndexedDB thật) — AssetStore thật đã có test riêng
 * (assetStore.test.ts). File này nằm trong tsconfig exclude như mọi
 * file .test.ts dùng import `.ts` (mẫu chung, tránh TS5097).
 */
import {
  collectMediaSrcs,
  planRehydrate,
  rehydrateMediaItems,
  MAX_REHYDRATE_DEPTH,
} from "./rehydrate36S5.ts";
// parseSessionPlayhead sống trong projectRepo.ts (xem chú thích cuối
// rehydrate36S5.ts); test nó từ đó như projectRepo.test.ts vẫn làm.
import { parseSessionPlayhead, persistSessionPlayhead, AUTOSAVE_KEY } from "./projectRepo.ts";
import type { AssetManifest } from "./assetStore.ts";
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
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg} — nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

function manifest(
  partial: Partial<AssetManifest> & { assetId: string; originalName: string },
): AssetManifest {
  return {
    sha256: "0".repeat(64),
    size: 100,
    mimeType: "video/webm",
    kind: "video",
    ingestedAt: "2026-11-02T00:00:00.000Z",
    refCount: 0,
    ...partial,
  };
}

const SAMPLE_MANIFESTS: AssetManifest[] = [
  manifest({ assetId: "a_1111111111111111", originalName: "mau-1.webm", duration: 4, width: 640, height: 360, thumbnail: "data:image/jpeg;base64,AAA" }),
  manifest({ assetId: "a_2222222222222222", originalName: "mau-2.webm", duration: 4, width: 640, height: 360 }),
];

const spec = {
  tracks: [
    {
      id: "v1",
      kind: "video",
      clips: [
        { kind: "video", id: "c1", src: "mau-1.webm" },
        { kind: "video", id: "c2", src: "asset:a_2222222222222222" },
        { kind: "text", id: "c3", text: "hello" },
      ],
    },
    {
      id: "n1",
      kind: "video",
      clips: [
        {
          kind: "nested",
          id: "nclip",
          subSpec: {
            tracks: [
              { id: "vn", kind: "video", clips: [{ kind: "video", id: "cn", src: "mau-2.webm" }] },
            ],
          },
        },
      ],
    },
  ],
};

await test("plan: bare-name khớp originalName (via bare-name)", () => {
  const p = planRehydrate(["mau-1.webm"], SAMPLE_MANIFESTS);
  eq(p.candidates.length, 1, "candidates");
  eq(p.candidates[0].via, "bare-name", "via");
  eq(p.candidates[0].assetId, "a_1111111111111111", "assetId");
  eq(p.skipped.length, 0, "skipped");
});

await test("plan: asset: khớp theo assetId (via asset)", () => {
  const p = planRehydrate(["asset:a_2222222222222222"], SAMPLE_MANIFESTS);
  eq(p.candidates.length, 1, "candidates");
  eq(p.candidates[0].via, "asset", "via");
  eq(p.candidates[0].src, "asset:a_2222222222222222", "src giữ nguyên");
});

await test("plan: asset: không có manifest → skipped", () => {
  const p = planRehydrate(["asset:a_deadbeefdeadbeef"], SAMPLE_MANIFESTS);
  eq(p.candidates.length, 0, "candidates");
  eq(p.skipped.length, 1, "skipped");
});

await test("plan: bare-name không có manifest → skipped", () => {
  const p = planRehydrate(["khong-co.mp4"], SAMPLE_MANIFESTS);
  eq(p.candidates.length, 0, "candidates");
  eq(p.skipped[0].src, "khong-co.mp4", "src");
});

await test("plan: nhiều manifest cùng tên → bản mới nhất theo ingestedAt thắng", () => {
  const ms = [
    manifest({ assetId: "a_oldoldoldoldold", originalName: "mau-1.webm", ingestedAt: "2026-11-01T00:00:00.000Z" }),
    manifest({ assetId: "a_newnewnewnewnew", originalName: "mau-1.webm", ingestedAt: "2026-11-02T00:00:00.000Z" }),
  ];
  const p = planRehydrate(["mau-1.webm"], ms);
  eq(p.candidates[0].assetId, "a_newnewnewnewnew", "assetId mới nhất");
});

await test("plan: blob: / http / data → skipped (không tạo candidate)", () => {
  const p = planRehydrate(
    ["blob:http://x/abc", "https://cdn.example.com/v.mp4", "data:video/webm;base64,AAA"],
    SAMPLE_MANIFESTS,
  );
  eq(p.candidates.length, 0, "candidates");
  eq(p.skipped.length, 3, "skipped");
});

await test("plan: src trùng nhau → 1 candidate", () => {
  const p = planRehydrate(["mau-1.webm", "mau-1.webm"], SAMPLE_MANIFESTS);
  eq(p.candidates.length, 1, "candidates");
});

await test("collect: lấy src video, bỏ text, lấy cả lá trong nested", () => {
  const srcs = collectMediaSrcs(spec);
  assert(srcs.includes("mau-1.webm"), "mau-1");
  assert(srcs.includes("asset:a_2222222222222222"), "asset src");
  assert(srcs.includes("mau-2.webm"), "lá nested mau-2 (trùng tên với asset clip nhưng là src riêng)");
  eq(srcs.length, 3, "tổng src distinct");
});

await test("collect: clip nested dạng legacy (tracks trực tiếp) vẫn quét được", () => {
  const legacy = {
    tracks: [
      {
        clips: [
          {
            kind: "nested",
            id: "nl",
            tracks: [{ clips: [{ kind: "image", src: "anh.png" }] }],
          },
        ],
      },
    ],
  };
  const srcs = collectMediaSrcs(legacy);
  assert(srcs.includes("anh.png"), "anh.png");
});

await test("collect: subSpec vòng lặp theo nhánh thì dừng, không treo", () => {
  const inner: Record<string, unknown> = { tracks: [] };
  const outer: Record<string, unknown> = {
    tracks: [{ clips: [{ kind: "nested", id: "o", subSpec: inner }] }],
  };
  // inner trỏ lại outer → vòng lặp nhánh
  inner["tracks"] = [{ clips: [{ kind: "nested", id: "i", subSpec: outer }] }];
  const srcs = collectMediaSrcs(outer as never);
  eq(srcs.length, 0, "không src, không treo");
  assert(MAX_REHYDRATE_DEPTH === 64, "giới hạn sâu 64");
});

function fakeDeps(blobs: Record<string, Blob | null>): RehydrateDeps {
  return {
    listManifests: async () => SAMPLE_MANIFESTS,
    loadBlob: async (id) => blobs[id] ?? null,
    makeObjectURL: (b) => `blob:fake/${b.size}`,
  };
}

await test("rehydrate: dựng MediaItem đủ field, file mang tên gốc", async () => {
  const blob = new Blob(["x".repeat(10)], { type: "video/webm" });
  const deps = fakeDeps({ a_1111111111111111: blob, a_2222222222222222: blob });
  const r = await rehydrateMediaItems(deps, spec);
  // 3 src distinct: mau-1 (bare) + asset:a_222… + mau-2 (bare trong nested,
  // cùng assetId với clip asset: nhưng là 2 MediaItem khác tên).
  eq(r.items.length, 3, "items");
  assert(r.items.some((i) => i.name === "mau-2.webm"), "item mau-2 nested");
  assert(r.items.some((i) => i.name === "asset:a_2222222222222222"), "item asset");
  const mau1 = r.items.find((i) => i.name === "mau-1.webm");
  assert(mau1 !== undefined, "item mau-1");
  eq(mau1!.kind, "video", "kind");
  eq(mau1!.duration, 4, "duration từ manifest");
  eq(mau1!.width, 640, "width");
  eq(mau1!.thumbnail, "data:image/jpeg;base64,AAA", "thumbnail");
  eq(mau1!.file?.name, "mau-1.webm", "file.name = originalName");
  assert(mau1!.url.startsWith("blob:fake/"), "url từ makeObjectURL");
  assert(r.restoredSrcs.includes("mau-1.webm"), "restoredSrcs");
  eq(r.failedSrcs.length, 0, "failed");
});

await test("rehydrate: blob thiếu → failedSrcs, item còn lại vẫn về", async () => {
  const blob = new Blob(["x"], { type: "video/webm" });
  const deps = fakeDeps({ a_1111111111111111: blob, a_2222222222222222: null });
  const r = await rehydrateMediaItems(deps, spec);
  // Chỉ mau-1 về: clip asset: VÀ lá nested mau-2 cùng trỏ assetId a_222…
  // nên cùng thiếu blob → cả hai src đều failed (hành vi đúng, không
  // phải chỉ 1 src failed).
  eq(r.items.length, 1, "chỉ mau-1 về");
  assert(r.failedSrcs.includes("asset:a_2222222222222222"), "failed chứa asset thiếu blob");
  assert(r.failedSrcs.includes("mau-2.webm"), "failed chứa mau-2 cùng assetId");
});

await test("rehydrate: manifest kind other → failed, không dựng item sai kind", async () => {
  const other = manifest({ assetId: "a_otherotherother", originalName: "doc.bin", kind: "other", mimeType: "application/octet-stream" });
  const deps: RehydrateDeps = {
    listManifests: async () => [other],
    loadBlob: async () => new Blob(["x"]),
    makeObjectURL: () => "blob:fake/1",
  };
  const r = await rehydrateMediaItems(deps, { tracks: [{ clips: [{ kind: "video", src: "doc.bin" }] }] });
  eq(r.items.length, 0, "items");
  assert(r.failedSrcs.includes("doc.bin"), "failed");
});

await test("session: envelope cũ (không session) → null", () => {
  eq(parseSessionPlayhead({ format: "vcut-project", name: "x" }), null, "null");
});

await test("session: playhead hợp lệ → giữ nguyên giá trị", () => {
  eq(parseSessionPlayhead({ session: { playhead: 3.5 } }), 3.5, "3.5");
  eq(parseSessionPlayhead({ session: { playhead: 0 } }), 0, "0 hợp lệ");
});

await test("session: giá trị xấu → null, không throw", () => {
  eq(parseSessionPlayhead({ session: { playhead: -1 } }), null, "âm");
  eq(parseSessionPlayhead({ session: { playhead: "3" } }), null, "chuỗi");
  eq(parseSessionPlayhead({ session: { playhead: Number.NaN } }), null, "NaN");
  eq(parseSessionPlayhead({ session: "x" }), null, "session không phải object");
  eq(parseSessionPlayhead(null), null, "null input");
  eq(parseSessionPlayhead("chuỗi"), null, "chuỗi input");
});

// --- persistSessionPlayhead (mock localStorage, mẫu textStyle32O6D7) ---
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

await test("session-flush: chỉ đổi session, spec/name/savedAt giữ nguyên", () => {
  const store = installMockStorage();
  const before = {
    format: "vcut-project",
    name: "X",
    savedAt: "2026-01-01T00:00:00.000Z",
    spec: { marker: "spec-goc" },
    session: { playhead: 1 },
  };
  store.set(AUTOSAVE_KEY, JSON.stringify(before));
  persistSessionPlayhead(4.5);
  const after = JSON.parse(store.get(AUTOSAVE_KEY)!) as Record<string, unknown>;
  eq((after["session"] as { playhead: number }).playhead, 4.5, "playhead mới");
  eq(JSON.stringify(after["spec"]), JSON.stringify(before.spec), "spec không đổi");
  eq(after["name"], "X", "name không đổi");
  eq(after["savedAt"], "2026-01-01T00:00:00.000Z", "savedAt không đổi");
});

await test("session-flush: chưa có autosave → không tạo envelope", () => {
  const store = installMockStorage();
  persistSessionPlayhead(2);
  assert(!store.has(AUTOSAVE_KEY), "không được tạo key");
});

await test("session-flush: JSON hỏng / playhead xấu → không throw, không ghi", () => {
  const store = installMockStorage();
  store.set(AUTOSAVE_KEY, "{khong-phai-json");
  persistSessionPlayhead(2);
  eq(store.get(AUTOSAVE_KEY), "{khong-phai-json", "giữ nguyên chuỗi hỏng");
  persistSessionPlayhead(-1);
  persistSessionPlayhead(Number.NaN);
  eq(store.get(AUTOSAVE_KEY), "{khong-phai-json", "vẫn giữ nguyên");
});

console.log(`\nrehydrate36S5: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
if (fail > 0) process.exitCode = 1;
