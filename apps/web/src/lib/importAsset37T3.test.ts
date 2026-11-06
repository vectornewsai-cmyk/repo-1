/**
 * importAsset37T3.test.ts — Test thật cho ingest import + rehydrate
 * đường mở file (Phase 9 đợt 37, luồng T3). Chạy trực tiếp, không cần
 * trình duyệt:
 *
 *   node apps/web/src/lib/importAsset37T3.test.ts
 *
 * (chạy từ gốc repo; cần Node có type-stripping, như các test .test.ts
 * khác của repo). Logic ingest dùng fake store; bước rehydrate dùng
 * module thật rehydrate36S5 với fake deps (IndexedDB thật đã có test
 * riêng assetStore.test.ts); đối chứng âm dùng findMissingAssets thật
 * (relink.ts chỉ import type nên Node import được). File này nằm trong
 * tsconfig exclude như mọi file .test.ts dùng import `.ts` (mẫu chung,
 * tránh TS5097).
 */
import { ingestImportedItem } from "./importAsset37T3.ts";
import type { ImportAssetStoreLike } from "./importAsset37T3.ts";
import {
  collectMediaSrcs,
  rehydrateMediaItems,
} from "./rehydrate36S5.ts";
import type { RehydrateDeps } from "./rehydrate36S5.ts";
import type { AssetManifest } from "./assetStore.ts";
import { findMissingAssets } from "./relink.ts";

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

function manifest(partial: Partial<AssetManifest> & { assetId: string; originalName: string }): AssetManifest {
  return {
    sha256: "00".repeat(32),
    size: 1234,
    mimeType: "image/png",
    kind: "image",
    ingestedAt: "2026-11-02T00:00:00.000Z",
    refCount: 0,
    ...partial,
  };
}

/** Fake store ghi lại lần ingest cuối; có thể ép throw / ép dedup. */
function fakeStore(opts: { throwOnIngest?: boolean; dedupManifest?: AssetManifest } = {}): ImportAssetStoreLike & {
  calls: { blob: Blob; meta: Record<string, unknown> }[];
} {
  const calls: { blob: Blob; meta: Record<string, unknown> }[] = [];
  return {
    calls,
    ingest: async (blob: Blob, meta: Record<string, unknown>) => {
      calls.push({ blob, meta });
      if (opts.throwOnIngest) throw new Error("IndexedDB bị chặn (giả lập)");
      if (opts.dedupManifest) return opts.dedupManifest;
      return manifest({
        assetId: "a_test1234567890ab",
        originalName: (meta.name as string) ?? "unnamed",
      });
    },
  };
}

const pngBlob = new Blob(["fake-png-bytes"], { type: "image/png" });

// ---------------------------------------------------------------------------
// 1. ingestImportedItem — logic ingest cho importFiles
// ---------------------------------------------------------------------------

await test("ingest: meta.name = tên ĐÃ chốt duy nhất + meta probe đi kèm", async () => {
  const store = fakeStore();
  const res = await ingestImportedItem(store, {
    file: pngBlob,
    name: "anh (1).png",
    width: 640,
    height: 360,
    duration: 0,
    thumbnail: "data:image/jpeg;base64,xxx",
  });
  assert(store.calls.length === 1, `mong 1 lần ingest, được ${store.calls.length}`);
  assert(store.calls[0].meta.name === "anh (1).png", `meta.name sai: ${store.calls[0].meta.name}`);
  assert(store.calls[0].meta.width === 640, "meta.width không đi kèm");
  assert(store.calls[0].meta.thumbnail === "data:image/jpeg;base64,xxx", "meta.thumbnail không đi kèm");
  assert(res.manifest !== null, "manifest null dù ingest thành công");
  assert(res.manifest.originalName === "anh (1).png", "originalName phải bằng tên đã chốt");
  assert(res.nameMismatch === false, "cùng tên thì không mismatch");
});

await test("ingest: item không có file → không gọi store, manifest null", async () => {
  const store = fakeStore();
  const res = await ingestImportedItem(store, { name: "anh.png" });
  assert(store.calls.length === 0, "không file thì không được gọi store");
  assert(res.manifest === null && res.nameMismatch === false, "kết quả phải rỗng");
});

await test("ingest: store throw (IDB chặn) → null, KHÔNG throw ra ngoài", async () => {
  const store = fakeStore({ throwOnIngest: true });
  const res = await ingestImportedItem(store, { file: pngBlob, name: "anh.png" });
  assert(res.manifest === null, "lỗi phải suy biến thành null");
  assert(res.nameMismatch === false, "lỗi thì không mismatch");
});

await test("ingest: dedup cùng bytes dưới tên khác → nameMismatch = true (giới hạn đã biết)", async () => {
  const old = manifest({ assetId: "a_oldmanifest0001", originalName: "anh.png" });
  const store = fakeStore({ dedupManifest: old });
  const res = await ingestImportedItem(store, { file: pngBlob, name: "anh (1).png" });
  assert(res.manifest === old, "dedup phải trả về manifest cũ");
  assert(res.nameMismatch === true, "originalName khác tên item thì phải báo mismatch");
});

// ---------------------------------------------------------------------------
// 2. Rehydrate cho đường MỞ FILE .vcut.json (cùng module với autosave)
// ---------------------------------------------------------------------------

await test("mở file: spec có src asset: + tên thô đã ingest đều nạp lại được", async () => {
  const manifests = [
    manifest({ assetId: "a_imported000001", originalName: "clip-user.mp4", kind: "video", mimeType: "video/mp4", duration: 5 }),
    manifest({ assetId: "a_imported000002", originalName: "anh.png", kind: "image", mimeType: "image/png" }),
  ];
  const blobs = new Map<string, Blob>([
    ["a_imported000001", new Blob(["video-bytes"], { type: "video/mp4" })],
    ["a_imported000002", new Blob(["png-bytes"], { type: "image/png" })],
  ]);
  const deps: RehydrateDeps = {
    listManifests: async () => manifests,
    loadBlob: async (id) => blobs.get(id) ?? null,
    makeObjectURL: () => "blob:fake-url",
  };
  // Spec như file .vcut.json vừa mở: 1 clip asset:, 1 clip tên thô.
  const spec = {
    tracks: [
      { clips: [{ kind: "video", src: "asset:a_imported000001" }] },
      { clips: [{ kind: "image", src: "anh.png" }] },
    ],
  };
  const res = await rehydrateMediaItems(deps, spec);
  assert(res.items.length === 2, `mong 2 item, được ${res.items.length}`);
  assert(res.items.every((it) => it.file !== undefined), "item nạp lại phải mang file thật");
  assert(res.failedSrcs.length === 0, `không được failed: ${res.failedSrcs.join(",")}`);
});

await test("mở file: src asset: trong nested cũng nạp lại được (collect quét nested)", async () => {
  const manifests = [
    manifest({ assetId: "a_nested00000001", originalName: "trong-nested.mp4", kind: "video", mimeType: "video/mp4" }),
  ];
  const deps: RehydrateDeps = {
    listManifests: async () => manifests,
    loadBlob: async () => new Blob(["v"], { type: "video/mp4" }),
    makeObjectURL: () => "blob:fake-url",
  };
  const spec = {
    tracks: [
      {
        clips: [
          {
            kind: "nested",
            subSpec: { tracks: [{ clips: [{ kind: "video", src: "asset:a_nested00000001" }] }] },
          },
        ],
      },
    ],
  };
  const srcs = collectMediaSrcs(spec);
  assert(srcs.includes("asset:a_nested00000001"), `collect bỏ sót src nested: ${srcs.join(",")}`);
  const res = await rehydrateMediaItems(deps, spec);
  assert(res.items.length === 1, `mong 1 item nested, được ${res.items.length}`);
});

// ---------------------------------------------------------------------------
// 3. Tương thích ngược + đối chứng âm
// ---------------------------------------------------------------------------

await test("tương thích ngược: project cũ chưa ingest vẫn mở được, src rơi vào skipped", async () => {
  const deps: RehydrateDeps = {
    listManifests: async () => [],
    loadBlob: async () => null,
    makeObjectURL: () => "blob:fake-url",
  };
  const spec = { tracks: [{ clips: [{ kind: "video", src: "clip-cu-chua-ingest.mp4" }] }] };
  const res = await rehydrateMediaItems(deps, spec);
  assert(res.items.length === 0, "chưa ingest thì không được bịa item");
  assert(res.skipped.length === 1, "src chưa ingest phải vào skipped, không crash");
});

await test("đối chứng âm: file thật sự mất vẫn hiện Relink (rehydrate không che)", async () => {
  // Bin rỗng + spec trỏ file không tồn tại → findMissingAssets phải liệt kê.
  const spec = {
    tracks: [{ clips: [{ kind: "video", src: "file-that-does-not-exist-xyz.mp4" }] }],
  };
  const missing = findMissingAssets(
    spec as unknown as Parameters<typeof findMissingAssets>[0],
    new Set<string>(),
  );
  assert(missing.length === 1, `mong 1 missing, được ${missing.length}`);
  assert(missing[0].src === "file-that-does-not-exist-xyz.mp4", `src missing sai: ${missing[0].src}`);
  // Và ngược lại: cùng src đó nhưng bin đã có (nhờ rehydrate) → không thiếu.
  const notMissing = findMissingAssets(
    spec as unknown as Parameters<typeof findMissingAssets>[0],
    new Set(["file-that-does-not-exist-xyz.mp4"]),
  );
  assert(notMissing.length === 0, "bin đã có tên thì không được báo thiếu");
});

console.log(`\nimportAsset37T3: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
