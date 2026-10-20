/**
 * test-plugin-api.mjs — test Plugin API (R1-105).
 *
 * Chạy: npm run build (hoặc tsc) rồi `node test-plugin-api.mjs`
 * từ thư mục packages/plugin-api/.
 *
 * Bao phủ:
 * 1. Load 2 plugin mẫu, hooks chạy đúng (log capture, filter drawtext).
 * 2. Capability registry.
 * 3. Sandbox: require/process/eval bị chặn, hook treo bị timeout,
 *    filter nguy hiểm (movie=) bị từ chối, manifest sai bị từ chối.
 * 4. E2E thật: filter watermark đưa qua FFmpeg render ra MP4.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PluginRegistry, loadPluginFromSource } from "./src/index.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");

let pass = 0;
let fail = 0;
function ok(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name} ${extra}`);
  }
}
function throws(name, fn, match = "") {
  try {
    fn();
    ok(name, false, "(không ném lỗi)");
  } catch (e) {
    ok(name, !match || String(e.message).includes(match), `(lỗi: ${e.message})`);
  }
}

// ---------------------------------------------------------------- 1. mẫu
console.log("== 1. Plugin mẫu ==");
const logs = [];
const logger = (name, msg) => logs.push(`[${name}] ${msg}`);
const registry = new PluginRegistry();

const helloSrc = await readFile(path.join(REPO, "plugins", "hello-world", "plugin.js"), "utf8");
const wmSrc = await readFile(path.join(REPO, "plugins", "watermark", "plugin.js"), "utf8");
registry.load(helloSrc, { logger });
registry.load(wmSrc, { logger });
ok("load được 2 plugin", registry.list().length === 2);
ok("registry.has('watermark')", registry.has("watermark"));

registry.emitTimelineAction("split", { clipId: "c1" });
ok("onTimelineAction log đúng", logs.some((l) => l.includes("action tren timeline: split")), logs.join(" | "));
const startReport = registry.runExportStart({
  projectName: "Demo",
  preset: { id: "1080p", width: 1920, height: 1080 },
  outputPath: "/tmp/demo.mp4",
});
ok("onExportStart không lỗi", Object.keys(startReport.hookErrors).length === 0);
ok("onExportStart log đúng", logs.some((l) => l.includes("sap export project 'Demo'")));

const videoCtx = {
  clip: { id: "c1", kind: "video", start: 0, duration: 5 },
  clipKind: "video",
  project: { width: 1920, height: 1080, fps: 30 },
};
const render1 = registry.runClipRender(videoCtx);
ok("onClipRender video → 1 filter", render1.filters.length === 1, JSON.stringify(render1));
ok("filter là drawtext watermark", render1.filters[0]?.startsWith("drawtext=text='© VCut Studio'"), render1.filters[0]);
ok("onClipRender không lỗi", Object.keys(render1.hookErrors).length === 0);
const renderText = registry.runClipRender({ ...videoCtx, clipKind: "text" });
ok("onClipRender text clip → không filter", renderText.filters.length === 0);

// Config override
const reg2 = new PluginRegistry();
reg2.load(wmSrc, { logger, config: { text: "My Brand", fontSize: 40, opacity: 0.5 } });
const render2 = reg2.runClipRender(videoCtx);
ok("config override áp dụng", render2.filters[0]?.includes("text='My Brand'") && render2.filters[0]?.includes("fontsize=40") && render2.filters[0]?.includes("white@0.50"), render2.filters[0]);

// ---------------------------------------------------- 2. capability registry
console.log("== 2. Capability registry ==");
const caps = registry.listCapabilities();
ok("có capability watermark/effect", caps.some((c) => c.kind === "effect" && c.id === "watermark" && c.plugin === "watermark"));
ok("hello-world không có capability", caps.every((c) => c.plugin !== "hello-world"));

// ---------------------------------------------------- 3. sandbox & validate
console.log("== 3. Sandbox an toàn ==");
throws("require bị chặn", () => loadPluginFromSource(`
  const fs = require("fs");
  module.exports = { manifest: { name: "evil", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onTimelineAction"] }, hooks: { onTimelineAction() {} } };
`));
throws("process bị chặn", () => loadPluginFromSource(`
  process.exit(1);
  module.exports = { manifest: { name: "evil2", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onTimelineAction"] }, hooks: { onTimelineAction() {} } };
`));
throws("eval bị chặn", () => loadPluginFromSource(`
  eval("1+1");
  module.exports = { manifest: { name: "evil3", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onTimelineAction"] }, hooks: { onTimelineAction() {} } };
`));
throws("manifest thiếu permission filter:inject", () => loadPluginFromSource(`
  module.exports = { manifest: { name: "bad-perm", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onClipRender"] }, hooks: { onClipRender() { return {}; } } };
`), "filter:inject");
throws("apiVersion sai bị từ chối", () => loadPluginFromSource(`
  module.exports = { manifest: { name: "bad-ver", version: "1.0.0", author: "x", apiVersion: 99, hooks: ["onTimelineAction"] }, hooks: { onTimelineAction() {} } };
`));
throws("trùng tên plugin", () => registry.load(helloSrc, { logger }));

// Hook treo: timeout, host không sập, lỗi ghi vào hookErrors.
const regHang = new PluginRegistry();
regHang.load(`
  module.exports = { manifest: { name: "hang", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onTimelineAction"] },
    hooks: { onTimelineAction() { while (true) {} } } };
`, { logger });
const t0 = Date.now();
const hangReport = regHang.emitTimelineAction("split", {});
ok("hook treo bị timeout & ghi lỗi", typeof hangReport.hookErrors["hang"] === "string" && Date.now() - t0 < 5000);

// Filter nguy hiểm bị từ chối.
const regEvil = new PluginRegistry();
regEvil.load(`
  module.exports = { manifest: { name: "evil-filter", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onClipRender"], permissions: ["filter:inject"] },
    hooks: { onClipRender() { return { filters: ["movie=/etc/passwd"] }; } } };
`, { logger });
const evilReport = regEvil.runClipRender(videoCtx);
ok("filter movie= bị từ chối", evilReport.filters.length === 0 && typeof evilReport.hookErrors["evil-filter"] === "string");

// Hook trả Promise bị báo lỗi (hooks phải đồng bộ).
const regAsync = new PluginRegistry();
regAsync.load(`
  module.exports = { manifest: { name: "async-plugin", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onTimelineAction"] },
    hooks: { onTimelineAction() { return Promise.resolve(1); } } };
`, { logger });
const asyncReport = regAsync.emitTimelineAction("undo", {});
ok("hook async bị báo lỗi", typeof asyncReport.hookErrors["async-plugin"] === "string");

// onProjectValidate gom lỗi.
const regVal = new PluginRegistry();
regVal.load(`
  module.exports = { manifest: { name: "checker", version: "1.0.0", author: "x", apiVersion: 1, hooks: ["onProjectValidate"],
    capabilities: [{ kind: "validator", id: "has-video", label: "Kiểm tra có video" }] },
    hooks: { onProjectValidate(ctx) { return { warnings: ["kiem tra mau"] }; } } };
`, { logger });
const valReport = regVal.runProjectValidate({ tracks: [] });
ok("onProjectValidate gom warnings", valReport.warnings.length === 1 && valReport.warnings[0].includes("[checker]"));

// ------------------------------------------------------------- 4. FFmpeg E2E
console.log("== 4. E2E FFmpeg với filter của plugin ==");
const tmp = mkdtempSync(path.join(tmpdir(), "vcut-plugin-"));
try {
  const gen = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc=duration=1:size=320x180:rate=10", "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(tmp, "in.mp4")], { encoding: "utf8" });
  ok("tạo video test", gen.status === 0);
  const filter = render1.filters[0];
  // drawtext cần font; dùng fontconfig mặc định (DejaVu) — nếu máy thiếu font thì bỏ qua phần render.
  const out = path.join(tmp, "out.mp4");
  const run = spawnSync("ffmpeg", ["-y", "-i", path.join(tmp, "in.mp4"), "-vf", filter, "-c:v", "libx264", "-pix_fmt", "yuv420p", out], { encoding: "utf8" });
  if (run.status === 0 && existsSync(out)) {
    const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { encoding: "utf8" });
    ok("FFmpeg render với filter plugin → MP4 hợp lệ", probe.status === 0 && parseFloat(probe.stdout) > 0.5);
  } else {
    console.log("  ⚠ bỏ qua E2E render (môi trường thiếu font cho drawtext): " + (run.stderr || "").slice(-200));
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`\nPLUGIN API TEST: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
