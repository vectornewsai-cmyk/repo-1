// gpuProbe65S4.test.ts — Phase 9 đợt 65, luồng S4: cache GPU probe —
// fallback libx264 khi encoder GPU đã cache lỗi + nút "Probe lại GPU".
//
// Khóa 3 chiều: key `export.gpuProbe.*` trong fragment round65-s4
// (vi + en, chuỗi không rỗng, vi khác en, placeholder khớp)
// == GPU_PROBE_KEYS trong lib/gpuProbe65S4.ts
// == endpoint bridge GET /api/gpu-probe + POST /api/gpu-probe/reprobe
// (server/bridge/src/gpuProbe.js, nối trong index.js).
// Khóa nối UI (tĩnh): ExportPanel import gpuProbe65S4, fetch 2 endpoint,
// render khối `.gpu-probe` (nút bấm + dòng trạng thái + ghi chú fallback);
// styles.css định nghĩa .gpu-probe. Khóa nối render: render.js bước 7
// thử lại 1 lần bằng libx264 khi encoder GPU fail lúc encode + xoá cache
// probe lỗi (kiểm chứng hành vi thật trong
// server/render/src/test_round65_s4_gpu_fallback.js, không ở file này).
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gpuProbe65S4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round65-s4/s4.test.cjs \
//     && node /tmp/round65-s4/s4.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GPU_PROBE_KEYS,
  GPU_PROBE_LEAF_KEYS,
  gpuProbeDoneText,
  gpuProbeErrorText,
  gpuProbeStatusText,
  gpuProbeString,
  gpuProbeStrings,
  gpuProbeTable,
  type GpuProbeStatus,
  type GpuProbeTable,
} from "./gpuProbe65S4";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
declare const process: { cwd: () => string; exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`S4 GPU probe UI round 65: ${pass}/${queue.length} pass`);
}

/** Tìm file từ cwd (gốc repo hoặc apps/web), mẫu modalSheet63R1. */
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    resolve(process.cwd(), ...parts),
    resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return candidates[0];
}

function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

const FRAG_PATH = resolveFromCwd(
  "apps", "web", "src", "i18n", "fragments", "round65-s4.json",
);
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { export: { gpuProbe: Record<string, string> } };
  en: { export: { gpuProbe: Record<string, string> } };
};
const FRAG_VI = frag.vi.export.gpuProbe;
const FRAG_EN = frag.en.export.gpuProbe;

ok("fragment: 10 key vi+en, không rỗng, vi khác en, placeholder khớp", () => {
  assert.equal(Object.keys(FRAG_VI).length, 10, "vi phải có 10 key");
  assert.equal(Object.keys(FRAG_EN).length, 10, "en phải có 10 key");
  for (const k of GPU_PROBE_LEAF_KEYS) {
    assert.ok(typeof FRAG_VI[k] === "string" && FRAG_VI[k].length > 0, `vi thiếu/rỗng ${k}`);
    assert.ok(typeof FRAG_EN[k] === "string" && FRAG_EN[k].length > 0, `en thiếu/rỗng ${k}`);
    assert.notEqual(FRAG_VI[k], FRAG_EN[k], `${k}: vi phải khác en`);
    assert.deepEqual(placeholders(FRAG_VI[k]), placeholders(FRAG_EN[k]), `${k}: placeholder lệch`);
  }
  assert.deepEqual(Object.keys(FRAG_VI).sort(), [...GPU_PROBE_LEAF_KEYS].sort());
  assert.deepEqual(Object.keys(FRAG_EN).sort(), [...GPU_PROBE_LEAF_KEYS].sort());
});

ok("GPU_PROBE_KEYS: đủ 10 key đầy đủ, khớp 1:1 fragment", () => {
  assert.equal(GPU_PROBE_KEYS.length, 10);
  const want = GPU_PROBE_LEAF_KEYS.map((k) => `export.gpuProbe.${k}`).sort();
  assert.deepEqual([...GPU_PROBE_KEYS].sort(), want);
  for (const k of GPU_PROBE_KEYS) {
    // Mỗi key đầy đủ phải xuất hiện nguyên văn trong file lib (scan tĩnh thấy).
    const libSrc = readFileSync(
      resolveFromCwd("apps", "web", "src", "lib", "gpuProbe65S4.ts"), "utf8");
    assert.ok(libSrc.includes(`"${k}"`), `lib phải chứa literal "${k}"`);
  }
});

ok("gpuProbeTable: đọc đúng bảng fragment (vi+en)", () => {
  const t = gpuProbeTable();
  assert.equal(t.vi.reprobe, "Probe lại GPU");
  assert.equal(t.en.reprobe, "Re-probe GPU");
  assert.equal(t.vi.title, "Encoder GPU");
  assert.equal(t.en.title, "GPU encoder");
});

ok("gpuProbeString: đúng locale, thay {var}, fallback vi, thiếu key → undefined", () => {
  assert.equal(gpuProbeString("reprobe", "vi"), "Probe lại GPU");
  assert.equal(gpuProbeString("reprobe", "en"), "Re-probe GPU");
  assert.equal(
    gpuProbeString("statusGpu", "vi", { encoder: "h264_nvenc", date: "08/11/2026" }),
    "GPU: h264_nvenc — đã probe 08/11/2026",
  );
  assert.equal(
    gpuProbeString("statusGpu", "en", { encoder: "h264_nvenc", date: "08/11/2026" }),
    "GPU: h264_nvenc — probed 08/11/2026",
  );
  const noEn: GpuProbeTable = { vi: { reprobe: "Probe lại GPU" }, en: {} };
  assert.equal(gpuProbeString("reprobe", "en", undefined, noEn), "Probe lại GPU");
  assert.equal(gpuProbeString("khongCo", "vi"), undefined);
  assert.equal(gpuProbeString("khongCo", "en"), undefined);
});

ok("gpuProbeStrings: đủ 10 chuỗi, không key thô", () => {
  const vi = gpuProbeStrings("vi");
  const en = gpuProbeStrings("en");
  assert.equal(Object.keys(vi).length, 10);
  assert.equal(Object.keys(en).length, 10);
  for (const k of GPU_PROBE_LEAF_KEYS) {
    assert.ok(vi[k].length > 0 && !vi[k].includes("export.gpuProbe"), `vi.${k}`);
    assert.ok(en[k].length > 0 && !en[k].includes("export.gpuProbe"), `en.${k}`);
  }
  assert.equal(vi.reprobe, "Probe lại GPU");
  assert.equal(en.fallbackNote.startsWith("If the GPU encoder fails"), true);
});

function status(over: Partial<GpuProbeStatus>): GpuProbeStatus {
  return {
    probed: false, encoder: null, detail: "", cached: false,
    source: null, probedAtMs: null, cacheEnabled: true, ...over,
  };
}

ok("gpuProbeStatusText: 4 trạng thái (chưa probe / cache tắt / có GPU / CPU)", () => {
  assert.equal(gpuProbeStatusText(null, "vi"), "Chưa probe GPU trên máy này");
  assert.equal(gpuProbeStatusText(undefined, "en"), "GPU has not been probed on this machine");
  assert.equal(gpuProbeStatusText(status({}), "vi"), "Chưa probe GPU trên máy này");
  assert.equal(
    gpuProbeStatusText(status({ cacheEnabled: false }), "vi"),
    "Cache probe GPU đang tắt — mỗi lần render đều probe lại",
  );
  assert.equal(
    gpuProbeStatusText(status({ cacheEnabled: false }), "en"),
    "GPU probe cache is off — every render re-probes",
  );
  const gpu = gpuProbeStatusText(
    status({ probed: true, encoder: "h264_nvenc", cached: true, source: "disk", probedAtMs: 1793123456789 }),
    "vi",
  );
  assert.ok(gpu.startsWith("GPU: h264_nvenc — đã probe "), `dòng GPU vi: ${gpu}`);
  const gpuEn = gpuProbeStatusText(
    status({ probed: true, encoder: "h264_qsv", cached: true, source: "disk", probedAtMs: 1793123456789 }),
    "en",
  );
  assert.ok(gpuEn.startsWith("GPU: h264_qsv — probed "), `dòng GPU en: ${gpuEn}`);
  assert.equal(
    gpuProbeStatusText(status({ probed: true, encoder: null, cached: true, source: "disk" }), "vi"),
    "Không phát hiện GPU — đang dùng CPU (libx264)",
  );
  assert.equal(
    gpuProbeStatusText(status({ probed: true, encoder: null }), "en"),
    "No GPU detected — using CPU (libx264)",
  );
});

ok("gpuProbeDoneText / gpuProbeErrorText: thay {result} / {error}", () => {
  assert.equal(gpuProbeDoneText("h264_nvenc", "vi"), "Probe xong: h264_nvenc");
  assert.equal(gpuProbeDoneText(null, "vi"), "Probe xong: libx264 (CPU)");
  assert.equal(gpuProbeDoneText(null, "en"), "Probe finished: libx264 (CPU)");
  assert.equal(
    gpuProbeErrorText("bridge không trả lời", "vi"),
    "Không probe được GPU (bridge không trả lời)",
  );
});

ok("nối UI tĩnh: ExportPanel dùng lib + 2 endpoint + khối .gpu-probe", () => {
  const panel = readFileSync(
    resolveFromCwd("apps", "web", "src", "ExportPanel.tsx"), "utf8");
  assert.ok(panel.includes("./lib/gpuProbe65S4"), "ExportPanel phải import gpuProbe65S4");
  assert.ok(panel.includes("/api/gpu-probe/reprobe"), "ExportPanel phải gọi POST /api/gpu-probe/reprobe");
  assert.ok(panel.includes("/api/gpu-probe"), "ExportPanel phải gọi GET /api/gpu-probe");
  assert.ok(panel.includes("gpu-probe"), "ExportPanel phải render khối .gpu-probe");
  assert.ok(panel.includes("gpuProbeStatusText"), "ExportPanel phải dùng gpuProbeStatusText");
  const css = readFileSync(
    resolveFromCwd("apps", "web", "src", "styles.css"), "utf8");
  assert.ok(css.includes(".gpu-probe"), "styles.css phải định nghĩa .gpu-probe");
});

ok("nối bridge tĩnh: 2 route + module gpuProbe + fallback render", () => {
  const idx = readFileSync(
    resolveFromCwd("server", "bridge", "src", "index.js"), "utf8");
  assert.ok(idx.includes('require("./gpuProbe")'), "bridge index.js phải require ./gpuProbe");
  assert.ok(idx.includes('app.get("/api/gpu-probe"'), "bridge phải có GET /api/gpu-probe");
  assert.ok(idx.includes('app.post("/api/gpu-probe/reprobe"'), "bridge phải có POST /api/gpu-probe/reprobe");
  const gp = readFileSync(
    resolveFromCwd("server", "bridge", "src", "gpuProbe.js"), "utf8");
  assert.ok(gp.includes("getGpuProbeStatus"), "gpuProbe.js phải export getGpuProbeStatus");
  assert.ok(gp.includes("reprobeGpu"), "gpuProbe.js phải export reprobeGpu");
  assert.ok(gp.includes("clearGpuProbeCache"), "reprobe phải xoá cache cũ trước khi probe lại");
  const render = readFileSync(
    resolveFromCwd("server", "render", "src", "render.js"), "utf8");
  assert.ok(render.includes("thử lại bằng libx264"), "render.js phải có nhánh fallback libx264");
  assert.ok(render.includes("clearGpuProbeCache()"), "render.js phải xoá cache probe lỗi khi fallback");
  assert.ok(render.includes('"--encoder", "libx264"'), "render.js retry phải ép --encoder libx264");
  const yaml = readFileSync(
    resolveFromCwd("server", "bridge", "openapi.yaml"), "utf8");
  assert.ok(yaml.includes("/api/gpu-probe:"), "openapi.yaml phải có /api/gpu-probe");
  assert.ok(yaml.includes("GpuProbeStatus"), "openapi.yaml phải có schema GpuProbeStatus");
  assert.ok(yaml.includes("GpuProbeResult"), "openapi.yaml phải có schema GpuProbeResult");
});

runAll();
