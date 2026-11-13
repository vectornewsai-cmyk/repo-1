// codecProbeUi75C6.test.ts — Phase 9 đợt 75, luồng C6 (đóng nợ đợt 74
// §4: nối codecProbe vào UI — badge + modal + gộp toast + probe lại
// lúc rehydrate).
//
// Chạy từ gốc repo (mẫu i18nOrphans60Q4): `node scripts/run-node-test.mjs
// apps/web/src/lib/codecProbeUi75C6.test.ts` (bundle cjs qua esbuild).
// Không cần trình duyệt: phần động dùng fake deps (rehydrate) + hàm
// thuần (formatUnsupportedNameList); phần UI kiểm chứng bằng kiểm tra
// tĩnh trên source (mẫu modalClasses59P4 — repo không có jsdom) + headed
// Chromium thật (xem docs/PHASE9_ROUND75_C6_CODEC_PROBE_UI_LIMITS.md).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatUnsupportedNameList } from "./codecProbe";
import { rehydrateMediaItems, type RehydrateDeps } from "./rehydrate36S5";
import type { AssetManifest } from "./assetStore";

declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`C6 codec-probe UI round 75: ${pass}/${queue.length} pass`);
}

// --- Dict thật ----------------------------------------------------------
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
function flatten(d: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Dict, q, out);
    else out.set(q, v as string);
  }
  return out;
}
const VI = flatten(readJson("apps/web/src/i18n/vi.json"));
const EN = flatten(readJson("apps/web/src/i18n/en.json"));
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

/** 8 key mới của đợt này (2405 → 2413). */
const NEW_KEYS = [
  "mediabin.codecBadge",
  "mediabin.codecBadgeTitle",
  "mediabin.codecDetailTitle",
  "mediabin.codecDetailBody",
  "mediabin.codecDetailConvert",
  "mediabin.codecDetailProxy",
  "mediabin.codecDetailExportNote",
  "mediabin.codecUnsupportedMany",
];

ok("dict: vi==en==2767 key lá, 8 key mới đủ cả hai bên, placeholder khớp, vi khác en", () => {
  assert.equal(VI.size, 2767, `vi.json phải có 2767 key lá, nhận ${VI.size}`);
  assert.equal(EN.size, 2767, `en.json phải có 2767 key lá, nhận ${EN.size}`);
  for (const k of NEW_KEYS) {
    assert.ok(VI.has(k), `vi.json thiếu key mới ${k}`);
    assert.ok(EN.has(k), `en.json thiếu key mới ${k}`);
    assert.ok((VI.get(k) as string).length > 0, `${k}: vi rỗng`);
    assert.ok((EN.get(k) as string).length > 0, `${k}: en rỗng`);
    assert.deepEqual(placeholders(VI.get(k) as string), placeholders(EN.get(k) as string), `${k}: placeholder vi/en lệch`);
    assert.notEqual(VI.get(k), EN.get(k), `${k}: vi phải khác en (không tính vào 72 key vi==en)`);
  }
  // Đợt 80 H10: +6 key vi==en (exportPreset.tiktokLabel/reelsLabel/shortsLabel/sizeSummaryMax
  // + safeArea.platformReels/platformShorts) → 54 thành 60 (xem i18nOrphans60Q4 §dict).
  // +1 key đợt 92 T5: sticker.title ("🌟 Sticker" giống hệt 2 bên — loanword Sticker đã dùng khắp panel sticker) → 60 thành 61; +11 key đợt 93 U5 (sticker.cat.emoji + 10 sticker.item.* loanword) → 61 thành 72.
  const same = [...VI.keys()].filter((k) => VI.get(k) === EN.get(k));
  assert.equal(same.length, 72, `số key vi==en phải giữ 72, nhận ${same.length}`);
});

ok("dict: codecUnsupportedMany có {count} {names}; codecDetailBody có {name} {codec}; codecBadgeTitle có {codec}", () => {
  assert.deepEqual(placeholders(VI.get("mediabin.codecUnsupportedMany") as string), ["count", "names"]);
  assert.deepEqual(placeholders(VI.get("mediabin.codecDetailBody") as string), ["codec", "name"]);
  assert.deepEqual(placeholders(VI.get("mediabin.codecBadgeTitle") as string), ["codec"]);
});

// --- formatUnsupportedNameList (thuần) ----------------------------------
ok("formatUnsupportedNameList: 0 tên → rỗng", () => {
  assert.equal(formatUnsupportedNameList([]), "");
});
ok("formatUnsupportedNameList: 1–3 tên nối bằng dấu phẩy, không hậu tố", () => {
  assert.equal(formatUnsupportedNameList(["a.mp4"]), "a.mp4");
  assert.equal(formatUnsupportedNameList(["a.mp4", "b.mp4"]), "a.mp4, b.mp4");
  assert.equal(formatUnsupportedNameList(["a.mp4", "b.mp4", "c.mp4"]), "a.mp4, b.mp4, c.mp4");
});
ok("formatUnsupportedNameList: 4 tên → 3 tên đầu + '+1'; 5 tên → '+2'", () => {
  assert.equal(
    formatUnsupportedNameList(["a.mp4", "b.mp4", "c.mp4", "d.mp4"]),
    "a.mp4, b.mp4, c.mp4 +1",
  );
  assert.equal(
    formatUnsupportedNameList(["a.mp4", "b.mp4", "c.mp4", "d.mp4", "e.mp4"]),
    "a.mp4, b.mp4, c.mp4 +2",
  );
});
ok("formatUnsupportedNameList: maxShown tùy chỉnh (2 → 2 tên + số còn lại)", () => {
  assert.equal(
    formatUnsupportedNameList(["a.mp4", "b.mp4", "c.mp4"], 2),
    "a.mp4, b.mp4 +1",
  );
  assert.equal(formatUnsupportedNameList(["a.mp4", "b.mp4"], 5), "a.mp4, b.mp4");
});

// --- Nối tĩnh: modal / badge / toast gộp / rehydrate --------------------
const MODAL = readFileSync("apps/web/src/components/CodecUnsupportedModal.tsx", "utf8");
const MEDIABIN = readFileSync("apps/web/src/MediaBin.tsx", "utf8");
const STORE = readFileSync("apps/web/src/store.ts", "utf8");
const REHYDRATE = readFileSync("apps/web/src/lib/rehydrate36S5.ts", "utf8");
const APP = readFileSync("apps/web/src/App.tsx", "utf8");
const OPENFLOW = readFileSync("apps/web/src/lib/openProjectFlow.ts", "utf8");
const CSS = readFileSync("apps/web/src/styles.css", "utf8");

ok("modal: dùng đủ 7 key chi tiết + common.close, có testid + role=dialog", () => {
  for (const k of [
    "mediabin.codecDetailTitle",
    "mediabin.codecDetailBody",
    "mediabin.codecDetailConvert",
    "mediabin.codecDetailProxy",
    "mediabin.codecDetailExportNote",
    "common.close",
  ]) {
    assert.ok(MODAL.includes(`"${k}"`), `modal thiếu key ${k}`);
  }
  assert.ok(MODAL.includes('data-testid="codec-unsupported-modal"'), "modal thiếu testid");
  assert.ok(MODAL.includes('data-testid="codec-unsupported-close"'), "modal thiếu nút đóng testid");
  assert.ok(MODAL.includes('role="dialog"'), "modal thiếu role=dialog");
  assert.ok(MODAL.includes('className="modal-backdrop"'), "modal thiếu backdrop");
});

ok("modal: mọi class dùng đều đã định nghĩa trong styles.css (không thêm CSS)", () => {
  const used = new Set<string>();
  for (const m of MODAL.matchAll(/className="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) used.add(c);
  }
  assert.ok(used.size > 0, "không trích được class nào từ modal");
  for (const c of used) {
    assert.ok(CSS.includes(`.${c}`), `class .${c} trong modal chưa định nghĩa ở styles.css`);
  }
  // footer .modal-actions phải là con trực tiếp của .modal (quy ước P4).
  assert.ok(MODAL.includes('<div className="modal-actions">'), "modal thiếu footer .modal-actions");
});

ok("MediaBin: badge khi item.unsupportedCodec, mở modal, đủ key + testid", () => {
  assert.ok(MEDIABIN.includes("item.unsupportedCodec"), "MediaBin không đọc cờ unsupportedCodec");
  assert.ok(MEDIABIN.includes('data-testid="codec-unsupported-badge"'), "MediaBin thiếu badge testid");
  assert.ok(MEDIABIN.includes("CodecUnsupportedModal"), "MediaBin không render modal chi tiết");
  assert.ok(MEDIABIN.includes('"mediabin.codecBadge"'), "MediaBin thiếu key codecBadge");
  assert.ok(MEDIABIN.includes('"mediabin.codecBadgeTitle"'), "MediaBin thiếu key codecBadgeTitle");
});

ok("store: toast gộp khi >1 file, giữ toast đơn khi 1 file", () => {
  assert.ok(STORE.includes('"mediabin.codecUnsupportedMany"'), "store thiếu key toast gộp");
  assert.ok(STORE.includes("formatUnsupportedNameList"), "store không dùng helper rút gọn tên");
  assert.ok(STORE.includes("unsupported.length === 1"), "store mất nhánh toast đơn");
  assert.ok(STORE.includes("unsupported.length > 1"), "store mất nhánh toast gộp");
  assert.ok(STORE.includes('"mediabin.codecUnsupported"'), "store mất key toast đơn cũ");
});

ok("rehydrate: có dep probeUnsupportedCodec tùy chọn + gắn cờ lên item", () => {
  assert.ok(REHYDRATE.includes("probeUnsupportedCodec?:"), "rehydrate thiếu dep tùy chọn");
  assert.ok(REHYDRATE.includes("await deps.probeUnsupportedCodec(file)"), "rehydrate không gọi dep");
  assert.ok(REHYDRATE.includes("...(unsupportedCodec ? { unsupportedCodec } : {})"), "rehydrate không gắn cờ lên item");
});

ok("App + openProjectFlow: cả hai call site đều nối dep probe lại codec", () => {
  for (const [src, name] of [
    [APP, "App.tsx"],
    [OPENFLOW, "openProjectFlow.ts"],
  ] as const) {
    assert.ok(src.includes("probeUnsupportedCodec:"), `${name} chưa nối dep probeUnsupportedCodec`);
    assert.ok(src.includes("probeImportedFileCodec"), `${name} chưa import probeImportedFileCodec`);
    assert.ok(src.includes('probe.verdict === "unsupported"'), `${name} không lọc verdict unsupported`);
  }
});

// --- Rehydrate động với fake deps ---------------------------------------
function manifest(partial: Partial<AssetManifest> & { assetId: string; originalName: string }): AssetManifest {
  return {
    sha256: "0".repeat(64),
    size: 100,
    mimeType: "video/mp4",
    kind: "video",
    ingestedAt: "2026-11-02T00:00:00.000Z",
    refCount: 0,
    ...partial,
  };
}
function fakeDeps(probe?: RehydrateDeps["probeUnsupportedCodec"]): RehydrateDeps {
  const manifests = [manifest({ assetId: "a_hevc000000000001", originalName: "hevc.mp4", duration: 2 })];
  return {
    listManifests: async () => manifests,
    loadBlob: async () => new Blob([new Uint8Array([0, 0, 0, 24])], { type: "video/mp4" }),
    makeObjectURL: () => "blob:fake",
    ...(probe ? { probeUnsupportedCodec: probe } : {}),
  };
}
const SPEC = {
  tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "c1", src: "hevc.mp4" }] }],
};

ok("rehydrate: dep báo unsupported → item mang cờ HEVC / MP4", async () => {
  const res = await rehydrateMediaItems(
    fakeDeps(async (f) => (f.name === "hevc.mp4" ? "HEVC / MP4" : undefined)),
    SPEC,
  );
  assert.equal(res.items.length, 1, "phải khôi phục 1 item");
  assert.equal(res.items[0].unsupportedCodec, "HEVC / MP4");
  assert.equal(res.items[0].name, "hevc.mp4");
});

ok("rehydrate: dep báo chơi được → item không có cờ", async () => {
  const res = await rehydrateMediaItems(fakeDeps(async () => undefined), SPEC);
  assert.equal(res.items.length, 1, "phải khôi phục 1 item");
  assert.equal(res.items[0].unsupportedCodec, undefined);
});

ok("rehydrate: không truyền dep → hành vi cũ, item không có cờ", async () => {
  const res = await rehydrateMediaItems(fakeDeps(), SPEC);
  assert.equal(res.items.length, 1, "phải khôi phục 1 item");
  assert.equal(res.items[0].unsupportedCodec, undefined);
});

ok("rehydrate: dep throw → fail-open, item vẫn khôi phục, không cờ", async () => {
  const res = await rehydrateMediaItems(
    fakeDeps(async () => {
      throw new Error("probe hỏng");
    }),
    SPEC,
  );
  assert.equal(res.items.length, 1, "phải khôi phục 1 item dù dep throw");
  assert.equal(res.items[0].unsupportedCodec, undefined);
});

void runAll();
