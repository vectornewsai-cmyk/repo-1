// aspectFit76D9.test.ts — Phase 9 đợt 76, luồng D9: cảnh báo letterbox +
// lựa chọn crop/reframe khi xuất preset lệch tỉ lệ nguồn (đóng nợ đợt 75
// C7 §6: preset 4:5 từ nguồn 16:9 letterbox mà panel không cảnh báo).
//
// Tầng lib (hàm thuần + kho inject được, test ở đây):
//   - aspectRatioLabel: rút gọn bằng gcd (1280×720 → "16:9").
//   - aspectMismatch: 16:9→4:5 = letterbox, 9:16→16:9 = pillarbox,
//     khớp tỉ lệ (kể cả trong dung sai 1%) = null, số sai → null.
//   - normalizeAspectFit/isAspectFit: chỉ "fit"|"crop", lạ → "fit".
//   - load/saveAspectFit: persist localStorage, mặc định "fit",
//     thiếu key / giá trị lạ / kho lỗi → "fit".
// Tầng nối UI + render + bridge (kiểm chứng tĩnh):
//   - ExportPanel có khối cảnh báo (data-testid aspect-fit-warning),
//     select #export-aspect-fit, đọc/ghi localStorage, gửi `aspectFit`
//     trong preset JSON của POST /api/render.
//   - bridge parsePreset whitelist aspectFit + spawnJob chỉ push
//     `--aspect-fit crop` khi crop (không thêm mã lỗi — catalog 102 giữ).
//   - render.js có cờ --aspect-fit + dùng buildFitChain (nhánh thường),
//     speedramp.js dùng buildFitChain (nhánh ramp).
// Tầng render thật (test_export_aspect_fit_76d9.js): MP4 1080×1350 đo
// pixel YAVG — fit giữ viền đen, crop lấp đầy, nguồn 4:5 không viền.
// Tầng headed (preset45-letterbox-76d9.cdp.mjs): chọn ig-portrait với
// nguồn 16:9 → thấy cảnh báo → chọn crop → MP4 không viền đen.
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/aspectFit76D9.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round76-d9/d9.test.cjs \
//     && node /tmp/round76-d9/d9.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ASPECT_FIT_DEFAULT,
  ASPECT_FIT_KEY,
  ASPECT_FITS,
  aspectMismatch,
  aspectRatioLabel,
  isAspectFit,
  loadAspectFit,
  normalizeAspectFit,
  saveAspectFit,
  type AspectFitStore,
} from "./aspectFit76D9";

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
  console.log(`aspectFit round 76 D9: ${pass}/${queue.length} pass`);
}

const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

/** Kho giả trong bộ nhớ (mẫu stabSingleThread68V2). */
function fakeStore(initial: Record<string, string> = {}): AspectFitStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; },
    removeItem: (k: string) => { delete data[k]; },
  };
}

console.log("== [1] aspectRatioLabel ==");
ok("1280×720 → 16:9", () => assert.equal(aspectRatioLabel(1280, 720), "16:9"));
ok("1080×1350 → 4:5", () => assert.equal(aspectRatioLabel(1080, 1350), "4:5"));
ok("1920×1080 → 16:9", () => assert.equal(aspectRatioLabel(1920, 1080), "16:9"));
ok("1080×1080 → 1:1", () => assert.equal(aspectRatioLabel(1080, 1080), "1:1"));
ok("720×1280 → 9:16", () => assert.equal(aspectRatioLabel(720, 1280), "9:16"));
ok("số không hợp lệ → ?", () => {
  assert.equal(aspectRatioLabel(0, 720), "?");
  assert.equal(aspectRatioLabel(1280, 0), "?");
  assert.equal(aspectRatioLabel(-1280, 720), "?");
  assert.equal(aspectRatioLabel(NaN, 720), "?");
});

console.log("== [2] aspectMismatch ==");
ok("16:9 → 4:5 = letterbox (viền đen trên/dưới)", () => {
  assert.equal(aspectMismatch(1280, 720, 1080, 1350), "letterbox");
  assert.equal(aspectMismatch(640, 360, 1080, 1350), "letterbox");
});
ok("9:16 → 16:9 = pillarbox (viền đen hai bên)", () => {
  assert.equal(aspectMismatch(720, 1280, 1920, 1080), "pillarbox");
});
ok("khớp tỉ lệ = null (không cảnh báo thừa)", () => {
  assert.equal(aspectMismatch(1280, 720, 1920, 1080), null);
  assert.equal(aspectMismatch(1080, 1350, 1080, 1350), null);
  assert.equal(aspectMismatch(540, 675, 1080, 1350), null);
  assert.equal(aspectMismatch(1080, 1080, 1080, 1080), null);
});
ok("lệch trong dung sai 1% = null", () => {
  // 1280×720 (1.7778) vs 1280×719 (1.7805): lệch 0,15% → coi như khớp.
  assert.equal(aspectMismatch(1280, 720, 1280, 719), null);
});
ok("lệch ngoài dung sai 1% vẫn báo", () => {
  // 720×480 (3:2 = 1.5) vs 720×486 (1.4815): lệch 1,25% → letterbox.
  assert.equal(aspectMismatch(720, 480, 720, 486), "letterbox");
});
ok("số không hợp lệ → null (không cảnh báo rác)", () => {
  assert.equal(aspectMismatch(0, 720, 1080, 1350), null);
  assert.equal(aspectMismatch(1280, 0, 1080, 1350), null);
  assert.equal(aspectMismatch(1280, 720, 0, 1350), null);
});

console.log("== [3] normalize/isAspectFit ==");
ok("chỉ fit|crop hợp lệ, lạ → fit", () => {
  assert.equal(normalizeAspectFit("fit"), "fit");
  assert.equal(normalizeAspectFit("crop"), "crop");
  assert.equal(normalizeAspectFit("cover"), "fit");
  assert.equal(normalizeAspectFit("contain"), "fit");
  assert.equal(normalizeAspectFit(undefined), "fit");
  assert.equal(normalizeAspectFit(null), "fit");
  assert.equal(normalizeAspectFit(42), "fit");
  assert.ok(isAspectFit("fit") && isAspectFit("crop"));
  assert.ok(!isAspectFit("cover") && !isAspectFit(undefined));
});
ok("hằng số: mặc định fit, đúng 2 chế độ", () => {
  assert.equal(ASPECT_FIT_DEFAULT, "fit");
  assert.deepEqual([...ASPECT_FITS], ["fit", "crop"]);
  assert.equal(ASPECT_FIT_KEY, "vcut-export-aspect-fit");
});

console.log("== [4] load/saveAspectFit (kho inject) ==");
ok("thiếu key → fit (mặc định, giữ hành vi cũ)", () => {
  assert.equal(loadAspectFit(fakeStore()), "fit");
});
ok("save crop → load crop; save fit → load fit", () => {
  const s = fakeStore();
  saveAspectFit("crop", s);
  assert.equal(s.data[ASPECT_FIT_KEY], "crop");
  assert.equal(loadAspectFit(s), "crop");
  saveAspectFit("fit", s);
  assert.equal(loadAspectFit(s), "fit");
});
ok("giá trị lạ trong kho → fit", () => {
  assert.equal(loadAspectFit(fakeStore({ [ASPECT_FIT_KEY]: "cover" })), "fit");
  assert.equal(loadAspectFit(fakeStore({ [ASPECT_FIT_KEY]: "" })), "fit");
});
ok("không có kho (null) → fit, save không throw", () => {
  assert.equal(loadAspectFit(null), "fit");
  saveAspectFit("crop", null);
});
ok("kho throw → load fit, save không throw", () => {
  const throwing: AspectFitStore = {
    getItem: () => { throw new Error("kho lỗi"); },
    setItem: () => { throw new Error("kho lỗi"); },
    removeItem: () => { throw new Error("kho lỗi"); },
  };
  assert.equal(loadAspectFit(throwing), "fit");
  saveAspectFit("crop", throwing);
});

console.log("== [5] i18n: 6 key mới đủ vi+en, placeholder khớp, vi khác en ==");
ok("6 key aspectFit* có mặt cả hai bên, không rỗng", () => {
  const vi = JSON.parse(read("apps/web/src/i18n/vi.json")) as { exportPanel: Record<string, string> };
  const en = JSON.parse(read("apps/web/src/i18n/en.json")) as { exportPanel: Record<string, string> };
  const keys = [
    "aspectFitWarnLetterbox",
    "aspectFitWarnPillarbox",
    "aspectFitLabel",
    "aspectFitFit",
    "aspectFitCrop",
    "aspectFitCropHint",
  ];
  for (const k of keys) {
    assert.equal(typeof vi.exportPanel[k], "string", `vi thiếu ${k}`);
    assert.equal(typeof en.exportPanel[k], "string", `en thiếu ${k}`);
    assert.ok(vi.exportPanel[k].length > 0, `vi ${k} rỗng`);
    assert.ok(en.exportPanel[k].length > 0, `en ${k} rỗng`);
    assert.notEqual(vi.exportPanel[k], en.exportPanel[k], `${k} vi phải khác en`);
  }
  // Placeholder {src}/{dst} khớp hai bên ở 2 key cảnh báo.
  for (const k of ["aspectFitWarnLetterbox", "aspectFitWarnPillarbox"]) {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    assert.equal(ph(vi.exportPanel[k]), ph(en.exportPanel[k]), `placeholder ${k} lệch`);
    assert.equal(ph(vi.exportPanel[k]), "dst,src", `${k} phải có {src} và {dst}`);
  }
});

console.log("== [6] nối tĩnh: ExportPanel + bridge + render ==");
ok("ExportPanel có khối cảnh báo + select + gửi aspectFit", () => {
  const src = read("apps/web/src/ExportPanel.tsx");
  assert.ok(src.includes('data-testid="aspect-fit-warning"'), "thiếu khối cảnh báo aspect-fit-warning");
  assert.ok(src.includes('id="export-aspect-fit"'), "thiếu select #export-aspect-fit");
  assert.ok(src.includes("aspectMismatch"), "thiếu gọi aspectMismatch");
  assert.ok(src.includes("aspectRatioLabel"), "thiếu gọi aspectRatioLabel");
  assert.ok(src.includes("loadAspectFit"), "thiếu đọc lựa chọn lúc mount");
  assert.ok(src.includes("saveAspectFit"), "thiếu ghi lựa chọn khi đổi");
  assert.ok(src.includes("aspectFitWarnLetterbox"), "thiếu key cảnh báo letterbox");
  assert.ok(src.includes("aspectFitWarnPillarbox"), "thiếu key cảnh báo pillarbox");
  // Gửi trong preset JSON của POST /api/render (cùng block với crf...).
  const presetBlock = src.slice(src.indexOf('form.append("preset"'));
  assert.ok(presetBlock.includes("aspectFit"), "preset JSON chưa gửi aspectFit");
});
ok("bridge whitelist aspectFit + chỉ push --aspect-fit khi crop", () => {
  const src = read("server/bridge/src/index.js");
  assert.ok(src.includes('p.aspectFit === "fit" || p.aspectFit === "crop"'), "parsePreset chưa whitelist aspectFit");
  assert.ok(src.includes('if (preset.aspectFit === "crop") args.push("--aspect-fit", "crop")'), "spawnJob chưa push --aspect-fit crop");
  assert.ok(!src.includes("PRESET_ASPECTFIT"), "không được thêm mã lỗi mới (catalog 102 giữ)");
});
ok("render.js + speedramp.js dùng buildFitChain theo aspectFit", () => {
  const render = read("server/render/src/render.js");
  assert.ok(render.includes('--aspect-fit'), "render.js thiếu cờ --aspect-fit");
  assert.ok(render.includes("buildFitChain(W, H, padColor, aspectFit)"), "nhánh thường chưa dùng buildFitChain");
  assert.ok(render.includes("aspectFit: args.aspectFit"), "ctx chưa mang aspectFit");
  const ramp = read("server/render/src/speedramp.js");
  assert.ok(ramp.includes("buildFitChain(opts.W, opts.H, opts.padColor, opts.aspectFit)"), "nhánh ramp chưa dùng buildFitChain");
});

runAll();
