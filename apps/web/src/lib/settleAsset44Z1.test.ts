// settleAsset44Z1.test.ts — Phase 9 đợt 44, luồng Z1: khóa ý tưởng mới
// cho nhánh thử lại riêng trên đường asset: (nợ mở Y1 §5.2).
//
// Test thuần này KHÔNG mạo nhận bằng chứng browser — bằng chứng
// headed nằm ở scripts/settle-headed-44z1.mjs + LIMITS Z1. Nó chỉ
// khóa ở tầng thuần: (1) phân loại nhánh dọn + diagnostic
// asset-not-ready, (2) toán aim siêu chặt, (3) probe asset: trước
// race, (4) tiêu chí phân loại trace (SUCCESS / PARTIAL / INVALID
// y hệt driver Y1, không nới lỏng), (5) vỏ UI .vcut.json ở mức
// logic tương đương: planRehydrate thật + previewUrlFor /
// knownSizeBytesForPreview thật cho item đã rehydrate (blob: URL +
// file.size = size manifest) — KHÔNG phải click-test browser thật
// (xem LIMITS Z1 §4: vỏ UI chưa click-test thật).
//
// Chạy bằng esbuild bundle --format=esm (file import dùng parameter
// properties qua chuỗi import của proxy/media nên không chạy
// node --test trực tiếp):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settleAsset44Z1.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/z1.test.mjs \
//     && node <scratch>/z1.test.mjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
import assert from "node:assert/strict";
import {
  classifySettleDrop,
  classifyTraceAttempt,
  probeAssetReadiness,
  ultraTightAimTarget,
  y1AimRemainingFrames,
} from "./settleAsset44Z1.ts";
import { planRehydrate } from "./rehydrate36S5.ts";
import type { AssetManifest } from "./assetStore.ts";
import { resolveGopRangeWiring } from "./gopCache40V2.ts";
import {
  knownSizeBytesForPreview,
  previewUrlFor,
} from "./proxy.ts";
import type { MediaItem } from "../media.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

const MiB = 1024 * 1024;

// --- (1) Phân loại nhánh dọn ---
ok("classify: settle lúc decode bay → retry-decode-flight, hợp lệ kết luận", () => {
  const r = classifySettleDrop({ enabled: false, disposed: false, decodeInFlight: true, scheme: "blob", assetReady: true });
  assert.equal(r.branch, "retry-decode-flight");
  assert.equal(r.validForRetryConclusion, true);
});

ok("classify: settle lúc không decode bay, asset sẵn → immediate, hợp lệ", () => {
  const r = classifySettleDrop({ enabled: false, disposed: false, decodeInFlight: false, scheme: "blob", assetReady: true });
  assert.equal(r.branch, "immediate");
  assert.equal(r.validForRetryConclusion, true);
});

ok("classify: asset chưa sẵn (probe fail) → immediate nhưng KHÔNG hợp lệ kết luận, lý do ghi asset-not-ready", () => {
  const r = classifySettleDrop({ enabled: false, disposed: false, decodeInFlight: false, scheme: "blob", assetReady: false });
  assert.equal(r.branch, "immediate");
  assert.equal(r.validForRetryConclusion, false);
  assert.match(r.reason, /asset-not-ready/);
});

ok("classify: asset chưa sẵn nhưng decode đang bay → vẫn là retry-decode-flight (decode bay trội hơn probe)", () => {
  const r = classifySettleDrop({ enabled: false, disposed: false, decodeInFlight: true, scheme: "asset", assetReady: false });
  assert.equal(r.branch, "retry-decode-flight");
  assert.equal(r.validForRetryConclusion, true);
});

ok("classify: bật lại hoặc dispose → no-drop, không hợp lệ kết luận", () => {
  assert.equal(classifySettleDrop({ enabled: true, disposed: false, decodeInFlight: true, scheme: "blob", assetReady: true }).branch, "no-drop");
  assert.equal(classifySettleDrop({ enabled: false, disposed: true, decodeInFlight: false, scheme: "blob", assetReady: true }).branch, "no-drop");
});

ok("classify: đường http không bị gắn diagnostic asset-not-ready khi probe fail (probe chỉ cho asset/blob)", () => {
  const r = classifySettleDrop({ enabled: false, disposed: false, decodeInFlight: false, scheme: "http", assetReady: false });
  assert.equal(r.branch, "immediate");
  assert.equal(r.validForRetryConclusion, true);
});

// --- (2) Toán aim siêu chặt ---
ok("aim siêu chặt: setup 121 + prefetch 136 − 3 = 254 (Y1 chặt chỉ tới 237)", () => {
  assert.equal(ultraTightAimTarget(121, 136, 3), 254);
  assert.equal(ultraTightAimTarget(121, 136, 20), 237);
});

ok("aim: prefetchFrames <= 0 thì target = setupCache, không aim mù", () => {
  assert.equal(ultraTightAimTarget(121, 0), 121);
  assert.equal(ultraTightAimTarget(121, -5), 121);
});

ok("aim: số frame còn lại — Y1 chặt 20, lỏng ~50%, Z1 siêu chặt 3", () => {
  assert.equal(y1AimRemainingFrames("tight", 136), 20);
  assert.equal(y1AimRemainingFrames("loose-half", 136), 68);
  assert.equal(y1AimRemainingFrames("ultra", 136), 3);
});

// --- (3) Probe asset: trước race ---
function goodProbe() {
  return { manifestSize: 69861131, blobSize: 69861131, restoredCount: 1, failedCount: 0, setupOk: true, gopMode: "full-file-fallback", fallbackReason: "gate: accept-ranges-unknown" };
}

ok("probe: khớp size + restored 1 + failed 0 + setup ok → ready (kể cả fallback GOP)", () => {
  const r = probeAssetReadiness(goodProbe());
  assert.equal(r.ready, true);
  assert.equal(r.reasons.length, 0);
});

ok("probe: size lệch → not ready, lý do ghi size-mismatch", () => {
  const r = probeAssetReadiness({ ...goodProbe(), blobSize: 69861130 });
  assert.equal(r.ready, false);
  assert.match(r.reasons.join(";"), /size-mismatch/);
});

ok("probe: restored 0 hoặc failed > 0 hoặc setup fail → not ready", () => {
  assert.equal(probeAssetReadiness({ ...goodProbe(), restoredCount: 0 }).ready, false);
  assert.equal(probeAssetReadiness({ ...goodProbe(), failedCount: 1 }).ready, false);
  assert.equal(probeAssetReadiness({ ...goodProbe(), setupOk: false }).ready, false);
});

ok("probe: size null → not ready, lý do ghi size-unknown", () => {
  const r = probeAssetReadiness({ ...goodProbe(), manifestSize: null });
  assert.equal(r.ready, false);
  assert.match(r.reasons.join(";"), /size-unknown/);
});

// --- (4) Phân loại trace (tiêu chí SUCCESS không nới) ---
function traceSuccess() {
  return [
    { t: 0, inFlight: 1, settled: 0, winInFlight: false, cache: 211, prefetch: 136, ui: "on" },
    { t: 82, inFlight: 0, settled: 0, winInFlight: true, cache: 211, prefetch: 136, ui: "off" },
    { t: 810, inFlight: 0, settled: 90, winInFlight: false, cache: 121, prefetch: 0, ui: "off" },
  ];
}

ok("trace: mẫu settle winInFlight=true + cuối delta 90 == cache sụt 90 → SUCCESS", () => {
  const r = classifyTraceAttempt(traceSuccess());
  assert.equal(r.cls, "SUCCESS");
});

ok("trace: settle sau W2 (winInFlight=false) nhưng counter tăng khớp cache sụt → PARTIAL-immediate-drop, không phải SUCCESS", () => {
  const tr = [
    { t: 0, inFlight: 1, settled: 0, winInFlight: false, cache: 211, prefetch: 136, ui: "on" },
    { t: 300, inFlight: 1, settled: 0, winInFlight: false, cache: 211, prefetch: 136, ui: "off" },
    { t: 343, inFlight: 0, settled: 90, winInFlight: false, cache: 121, prefetch: 0, ui: "off" },
  ];
  assert.equal(classifyTraceAttempt(tr).cls, "PARTIAL-immediate-drop");
});

ok("trace: counter tăng không khớp cache sụt → INVALID, không được tính PARTIAL", () => {
  const tr = [
    { t: 0, inFlight: 1, settled: 0, winInFlight: false, cache: 211, prefetch: 136, ui: "on" },
    { t: 300, inFlight: 0, settled: 50, winInFlight: false, cache: 211, prefetch: 0, ui: "off" },
  ];
  assert.match(classifyTraceAttempt(tr).cls, /^INVALID/);
});

ok("trace: không có chuyển inFlight 1→0 → INVALID-no-settle", () => {
  const tr = [
    { t: 0, inFlight: 1, settled: 0, winInFlight: false, cache: 211, prefetch: 136, ui: "on" },
    { t: 300, inFlight: 1, settled: 0, winInFlight: true, cache: 211, prefetch: 136, ui: "off" },
  ];
  assert.equal(classifyTraceAttempt(tr).cls, "INVALID-no-settle");
});

ok("trace: settle winInFlight=true nhưng cuối ui vẫn on → INVALID-final-mismatch (không nới)", () => {
  const tr = traceSuccess();
  tr[2] = { ...tr[2], ui: "on" };
  assert.match(classifyTraceAttempt(tr).cls, /^INVALID/);
});

// --- (5) Vỏ UI .vcut.json ở mức logic tương đương (KHÔNG phải click-test) ---
function fakeManifest(assetId: string): AssetManifest {
  return {
    assetId,
    originalName: "z1-corrupt-gop30-360p-gop90-420s.mp4",
    mimeType: "video/mp4",
    sha256: `sha-${assetId}`,
    size: 69861131,
    kind: "video",
    ingestedAt: "2026-11-04T00:00:00.000Z",
    aliases: [],
  } as unknown as AssetManifest;
}

ok("vỏ UI (logic): planRehydrate asset:<id> khớp manifest + wiring scheme-blind + previewUrl/size cho item rehydrate", () => {
  const m = fakeManifest("z1-asset-1");
  const plan = planRehydrate(["asset:z1-asset-1"], [m]);
  assert.equal(plan.candidates.length, 1);
  assert.equal(plan.candidates[0].via, "asset");
  // Wiring GOP chỉ nhìn size (scheme-blind, tiền đề Y1): 66,62 MiB
  // nằm trong (32, 128] MiB nên wiring BẬT — gate blob: ở tầng
  // fetch (Accept-Ranges) mới loại về full-file-fallback, không
  // phải tầng wiring này.
  const w = resolveGopRangeWiring({ enabled: true, knownSizeBytes: 69861131, largeFileBytes: 128 * MiB });
  assert.equal(w.useGop, true);
  // Item sau rehydrate: url = blob: URL, không proxy, file.size =
  // size manifest → đúng 3 tham số preview.tsx truyền cho
  // controller (proxyUrl ?? url, knownSizeBytes, gopRangeEnabled).
  const item = {
    url: "blob:http://127.0.0.1:8924/z1-fake-blob",
    proxyUrl: undefined,
    file: { size: 69861131 },
  } as unknown as MediaItem;
  assert.equal(previewUrlFor(item), "blob:http://127.0.0.1:8924/z1-fake-blob");
  assert.equal(knownSizeBytesForPreview(item), 69861131);
});

for (const t of queue) {
  try {
    t.fn();
    pass++;
    console.log(`PASS ${t.name}`);
  } catch (e) {
    console.log(`FAIL ${t.name} — ${(e as Error).message}`);
  }
}
console.log(`\n== settleAsset44Z1: ${pass}/${queue.length} pass ==`);
if (pass !== queue.length) process.exit(1);
