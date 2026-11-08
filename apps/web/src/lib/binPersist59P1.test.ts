/**
 * binPersist59P1.test.ts — Phase 9 đợt 59, luồng P1: bin media bền qua
 * reload + toast "đã điền style" lặp lại.
 *
 * Đóng nợ đợt 58 §6.1 (O2):
 * (a) Thiết kế bin theo spec: media import rồi xóa hết clip khỏi
 *     timeline biến mất khỏi bin sau reload (rehydrate chỉ nạp media mà
 *     spec còn tham chiếu). Đổi thiết kế: autosave mang manifest bin
 *     (`binMedia` trong envelope) và rehydrate nạp đủ manifest, kèm UI
 *     xóa media khỏi bin một cách chủ đích (chỉ khi user xóa).
 * (b) Toast "đã điền style mặc định cho 1 text clip…" lặp lại mỗi lần
 *     reload — điều tra nguyên nhân gốc.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping; có top-level await):
 *   node apps/web/src/lib/binPersist59P1.test.ts
 * (chạy từ gốc repo; mẫu rehydrate36S5.test.ts. File nằm trong tsconfig
 * exclude như mọi file .test.ts dùng import `.ts`.)
 *
 * Chỉ test logic thuần (rehydrate + envelope autosave + normalize style);
 * store/UI (removeMediaFromBin, nút xóa ở MediaBin) được kiểm chứng bằng
 * tsc + vite build + harness headed clicktest-59p1 (xem LIMITS).
 */
import {
  rehydrateMediaItems,
  type RehydrateDeps,
} from "./rehydrate36S5.ts";
import {
  AUTOSAVE_KEY,
  autosaveNow,
  binMediaFromMedia,
  loadAutosave,
  normalizeTextStyle,
  parseBinMedia,
  parseProjectText,
  serializeProject,
  stableStringify,
  type BinMediaEntry,
} from "./projectRepo.ts";
import type { AssetManifest } from "./assetStore.ts";

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
  eq(stableStringify(a), stableStringify(b), msg);
}

/** localStorage giả tối thiểu (Node không có localStorage thật; mẫu textStyle32O6D7). */
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

const MANIFESTS: AssetManifest[] = [
  manifest({ assetId: "a_1111111111111111", originalName: "mau-1.webm", duration: 4, width: 640, height: 360 }),
  manifest({ assetId: "a_2222222222222222", originalName: "mau-2.webm", duration: 4, width: 640, height: 360 }),
];

const BIN: BinMediaEntry[] = [
  { assetId: "a_1111111111111111", name: "mau-1.webm" },
  { assetId: "a_2222222222222222", name: "mau-2.webm" },
];

function deps(manifests: AssetManifest[] = MANIFESTS): RehydrateDeps {
  return {
    listManifests: async () => manifests,
    loadBlob: async (id) => new Blob([`bytes-${id}`], { type: "video/webm" }),
    makeObjectURL: (blob) => `blob:test-${blob.size}`,
  };
}

/** Spec chỉ còn 1 text clip — đúng trạng thái sau khi user xóa hết clip video (cơ chế §7 N9). */
const TEXT_ONLY_SPEC = {
  tracks: [
    {
      id: "t1",
      kind: "text",
      clips: [{ kind: "text", id: "c-text", text: "Xin chào", start: 0.5, duration: 5 }],
    },
  ],
};

/** Spec còn 1 clip video trỏ mau-1.webm (dạng tên thô). */
const ONE_VIDEO_SPEC = {
  tracks: [
    {
      id: "v1",
      kind: "video",
      clips: [{ kind: "video", id: "c1", src: "mau-1.webm", start: 0, duration: 4 }],
    },
    {
      id: "t1",
      kind: "text",
      clips: [{ kind: "text", id: "c-text", text: "Xin chào", start: 0.5, duration: 5 }],
    },
  ],
};

// ---------------------------------------------------------------------------
// (a) rehydrate + binMedia
// ---------------------------------------------------------------------------

await test("bin: media chỉ có trong binMedia (không clip nào tham chiếu) vẫn khôi phục", async () => {
  const r = await rehydrateMediaItems(deps(), TEXT_ONLY_SPEC as never, BIN);
  eq(r.items.length, 2, "khôi phục đủ 2 item");
  eq(r.items.map((i) => i.name).sort().join(","), "mau-1.webm,mau-2.webm", "đúng tên");
  eq(r.restoredFromBin.length, 2, "ghi nhận 2 item từ bin");
  assert(r.items.every((i) => i.file instanceof File), "item có file thật");
  assert(r.items.every((i) => typeof i.assetId === "string" && i.assetId.startsWith("a_")), "item có assetId");
});

await test("bin: entry trùng spec không nhân đôi item", async () => {
  const r = await rehydrateMediaItems(deps(), ONE_VIDEO_SPEC as never, BIN);
  eq(r.items.length, 2, "chỉ 2 item duy nhất");
  eq(new Set(r.items.map((i) => i.name)).size, 2, "không trùng tên");
  eq(r.restoredFromBin.length, 1, "chỉ mau-2 tính là từ bin");
});

await test("bin: entry trùng assetId của clip asset: không nhân đôi", async () => {
  const spec = {
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [{ kind: "video", id: "c1", src: "asset:a_1111111111111111", start: 0, duration: 4 }],
      },
    ],
  };
  const r = await rehydrateMediaItems(deps(), spec as never, BIN);
  eq(r.items.length, 2, "mau-1 (qua asset:) + mau-2 (qua bin)");
  eq(r.items.filter((i) => i.assetId === "a_1111111111111111").length, 1, "mau-1 chỉ 1 item");
});

await test("bin: assetId không còn trong IndexedDB → skippedBin, không crash", async () => {
  const bin: BinMediaEntry[] = [
    ...BIN,
    { assetId: "a_deadbeefdeadbeef", name: "da-xoa.mp4" },
  ];
  const r = await rehydrateMediaItems(deps(), TEXT_ONLY_SPEC as never, bin);
  eq(r.items.length, 2, "2 item còn bytes vẫn khôi phục");
  eq(r.skippedBin.length, 1, "1 entry bị bỏ qua có ghi nhận");
  eq(r.skippedBin[0].assetId, "a_deadbeefdeadbeef", "đúng entry đã xóa bytes");
});

await test("bin: khớp theo tên khi assetId lạ (manifest cùng tên, bytes khác)", async () => {
  // User xóa bytes cũ rồi import lại file cùng tên (assetId mới vì bytes
  // khác): bin entry cũ trỏ assetId cũ, nhưng tên vẫn khớp manifest mới.
  const renamed = manifest({ assetId: "a_9999999999999999", originalName: "mau-1.webm", duration: 5 });
  const r = await rehydrateMediaItems(deps([renamed, MANIFESTS[1]]), TEXT_ONLY_SPEC as never, BIN);
  eq(r.items.length, 2, "khôi phục đủ 2");
  const m1 = r.items.find((i) => i.name === "mau-1.webm");
  assert(m1 !== undefined, "có mau-1");
  eq(m1!.assetId, "a_9999999999999999", "dùng manifest mới cùng tên");
  eq(m1!.duration, 5, "metadata của manifest mới");
});

await test("bin: không truyền binMedia → hành vi cũ (chỉ spec)", async () => {
  const r = await rehydrateMediaItems(deps(), TEXT_ONLY_SPEC as never);
  eq(r.items.length, 0, "spec chỉ có text clip thì bin trống như cũ");
  const r2 = await rehydrateMediaItems(deps(), ONE_VIDEO_SPEC as never);
  eq(r2.items.length, 1, "spec còn clip thì vẫn khôi phục như cũ");
});

await test("bin: tên entry khác originalName (đổi tên do trùng) → giữ tên bin", async () => {
  const bin: BinMediaEntry[] = [{ assetId: "a_1111111111111111", name: "mau-1 (1).webm" }];
  const r = await rehydrateMediaItems(deps(), TEXT_ONLY_SPEC as never, bin);
  eq(r.items.length, 1, "khôi phục 1");
  eq(r.items[0].name, "mau-1 (1).webm", "tên bin được giữ");
  eq(r.items[0].file?.name, "mau-1 (1).webm", "file.name == item.name (bất biến alias)");
});

// ---------------------------------------------------------------------------
// (a) envelope autosave: parse / ghi / đọc / tương thích cũ
// ---------------------------------------------------------------------------

await test("envelope: parseBinMedia — mảng hợp lệ giữ nguyên, thiếu field → null", () => {
  eqJson(parseBinMedia({ binMedia: BIN }), BIN, "đọc đủ");
  eq(parseBinMedia({}), null, "không có field → null (legacy)");
  eq(parseBinMedia({ binMedia: null }), null, "null → null");
  eq(parseBinMedia({ binMedia: "x" }), null, "không phải mảng → null");
  eqJson(parseBinMedia({ binMedia: [] }), [], "mảng rỗng → [] (bin trống có chủ đích)");
});

await test("envelope: parseBinMedia — loại entry xấu, dedupe theo assetId, trần 500", () => {
  const raw = {
    binMedia: [
      { assetId: "a_1111111111111111", name: "mau-1.webm" },
      { assetId: "a_1111111111111111", name: "mau-1-trung.webm" },
      { assetId: "", name: "rong.webm" },
      { assetId: "a_2222222222222222", name: "" },
      { assetId: 42, name: "so.webm" },
      { name: "thieu-id.webm" },
      { assetId: "a_2222222222222222", name: "mau-2.webm" },
      ...Array.from({ length: 600 }, (_, i) => ({ assetId: `a_${String(i).padStart(16, "0")}`, name: `f${i}.mp4` })),
    ],
  };
  const out = parseBinMedia(raw);
  assert(out !== null, "parse được");
  eq(out.length, 500, "trần 500 entry");
  eq(out[0].name, "mau-1.webm", "entry đầu giữ lại, bản trùng bị loại");
  eq(out[1].name, "mau-2.webm", "entry hợp lệ thứ hai giữ lại");
});

await test("envelope: binMediaFromMedia — chỉ lấy item có assetId", () => {
  const items = [
    { assetId: "a_1111111111111111", name: "mau-1.webm" },
    { name: "chua-ingest.mp4" },
    { assetId: "", name: "rong.mp4" },
    { assetId: "a_2222222222222222", name: "mau-2.webm" },
  ];
  eqJson(binMediaFromMedia(items), BIN, "chỉ 2 item có assetId");
  eqJson(binMediaFromMedia([]), [], "bin rỗng → []");
});

function staleSampleAutosave(): string {
  // Seed y hệt project mẫu lúc mới tạo: text clip thiếu `italic`
  // (sample.ts: style không có italic) + 2 clip video mẫu.
  return JSON.stringify({
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion: "0.2.0",
    savedAt: "2026-11-07T00:00:00.000Z",
    name: "du-an-mau",
    spec: {
      version: "0.2.0",
      meta: { name: "du-an-mau", width: 1080, height: 1920, fps: 30 },
      tracks: [
        {
          id: "v1",
          kind: "video",
          label: "Video 1",
          clips: [
            { kind: "video", id: "c1", src: "mau-1.webm", start: 0, duration: 4, in: 0, out: 4 },
            { kind: "video", id: "c2", src: "mau-2.webm", start: 4, duration: 4, in: 0, out: 4 },
          ],
        },
        {
          id: "t1",
          kind: "text",
          label: "Chữ 1",
          clips: [
            {
              kind: "text",
              id: "c-text",
              text: "Xin chào! Đây là VCut Studio",
              start: 0.5,
              duration: 5,
              style: {
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 72,
                color: "#ffffff",
                bold: true,
                x: 0.5,
                y: 0.32,
                animation: "fadeUp",
              },
            },
          ],
        },
      ],
    },
  });
}

await test("envelope: autosaveNow ghi binMedia vào envelope; loadAutosave đọc lại", () => {
  const store = installMockStorage();
  const { spec } = JSON.parse(staleSampleAutosave()) as { spec: unknown };
  autosaveNow(spec as never, "du-an-mau", undefined, BIN);
  const raw = JSON.parse(store.get(AUTOSAVE_KEY)!) as Record<string, unknown>;
  eqJson(raw["binMedia"], BIN, "envelope mang binMedia");
  const auto = loadAutosave();
  assert(auto !== null, "đọc được autosave");
  eqJson(auto.binMedia, BIN, "loadAutosave trả binMedia");
});

await test("envelope: loadAutosave legacy (không binMedia) → binMedia null", () => {
  const store = installMockStorage();
  store.set(AUTOSAVE_KEY, staleSampleAutosave());
  const auto = loadAutosave();
  assert(auto !== null, "đọc được autosave cũ");
  eq(auto.binMedia, null, "null = fallback hành vi cũ (chỉ spec)");
});

await test("envelope: serializeProject không binMedia → không ghi field (.vcut sạch)", () => {
  const { spec } = JSON.parse(staleSampleAutosave()) as { spec: unknown };
  const { envelope } = serializeProject(spec as never, "du-an-mau");
  assert(!("binMedia" in envelope), "file .vcut không mang binMedia (chỉ autosave mới có)");
});

await test("envelope: ghi lại O6 khi sửa style PHẢI giữ binMedia (không ghi đè mất)", () => {
  const store = installMockStorage();
  const seed = JSON.parse(staleSampleAutosave()) as Record<string, unknown>;
  seed["binMedia"] = BIN;
  store.set(AUTOSAVE_KEY, JSON.stringify(seed));
  const auto = loadAutosave();
  assert(auto !== null, "đọc được autosave");
  assert((auto.warnings.join(" ").includes("Đã điền style")), "lần 1 có cảnh báo sửa style");
  const raw = JSON.parse(store.get(AUTOSAVE_KEY)!) as Record<string, unknown>;
  eqJson(raw["binMedia"], BIN, "ghi lại sau sửa style vẫn giữ binMedia");
  eqJson(auto.binMedia, BIN, "loadAutosave trả binMedia sau ghi lại");
});

// ---------------------------------------------------------------------------
// (b) toast "đã điền style" — điều tra: có lặp lại trên cùng một autosave?
// ---------------------------------------------------------------------------

await test("toast: loadAutosave lần 1 sửa style + ghi lại; lần 2 KHÔNG còn fix", () => {
  const store = installMockStorage();
  store.set(AUTOSAVE_KEY, staleSampleAutosave());
  const first = loadAutosave();
  assert(first !== null, "đọc được lần 1");
  assert(first.warnings.some((w) => w.includes("Đã điền style")), "lần 1 có cảnh báo sửa style");
  // Seed đã ghi lại phải mang style đủ (italic:false) — kiểm chứng trực tiếp.
  const rewritten = JSON.parse(store.get(AUTOSAVE_KEY)!) as Record<string, any>;
  const textClip = rewritten.spec.tracks[1].clips[0] as Record<string, any>;
  eq(textClip.style.italic, false, "style đã ghi lại có italic:false");
  const second = loadAutosave();
  assert(second !== null, "đọc được lần 2");
  assert(
    !second.warnings.some((w) => w.includes("Đã điền style")),
    `lần 2 không còn cảnh báo sửa style (nhận: ${JSON.stringify(second.warnings)})`,
  );
});

await test("toast: style thiếu italic là KHÔNG ổn định qua normalize (nguồn sinh toast)", () => {
  // Style y hệt sample.ts / store.addTextClip đang sinh ra (không italic):
  // normalize điền thêm italic:false nên stableStringify đổi → cổng load
  // báo fix + toast. Style đủ field thì normalize giữ nguyên → không toast.
  const staleStyle = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 72,
    color: "#ffffff",
    bold: true,
    x: 0.5,
    y: 0.32,
    animation: "fadeUp",
  };
  const fixed = normalizeTextStyle(staleStyle);
  assert(
    stableStringify(staleStyle) !== stableStringify(fixed),
    "style thiếu italic bị normalize đổi → cổng load báo fix",
  );
  eq(fixed.italic, false, "normalize điền italic:false");
  const stable = normalizeTextStyle(fixed);
  eq(stableStringify(fixed), stableStringify(stable), "style đủ field thì normalize idempotent");
});

await test("toast: parseProjectText trực tiếp — style đủ italic thì 0 fix", () => {
  const seed = JSON.parse(staleSampleAutosave()) as Record<string, any>;
  seed.spec.tracks[1].clips[0].style.italic = false;
  const res = parseProjectText(JSON.stringify(seed));
  assert(res.ok, "parse ok");
  eq(res.textStyleFixes?.length ?? -1, 0, "không còn clip cần sửa");
});

console.log(`\nbinPersist59P1: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
if (fail > 0) process.exitCode = 1;
