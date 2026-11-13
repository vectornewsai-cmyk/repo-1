#!/usr/bin/env node
/**
 * make-preview-fps-seeds.mjs — Sinh 2 project mẫu vừa/nặng cho bench FPS
 * (Phase 9 đợt 52 I9, nợ P3 gap analysis §2.4).
 *
 * Vào: autosave JSON của project mẫu nhẹ đã dump bằng
 *   bench-preview-fps.mjs --dump-autosave (đường loadSample thật, media
 *   mau-1/mau-2.webm đã có trong IndexedDB của profile bench).
 * Ra: 2 file autosave seed (cùng envelope serializeProject, chỉ đổi spec):
 *   - medium: LUT + effect trên cả 2 clip video, transition dissolve,
 *     thêm 1 clip chữ (tổng 4 clip, 2 track).
 *   - heavy: medium + track video thứ 2 chồng lên (PIP, opacity 0.7,
 *     LUT + effect riêng — decode + drawImage gấp đôi) + 1 adjustment
 *     layer toàn project (LUT + vignette) + thêm 1 clip chữ nữa
 *     (tổng 7 clip, 3 track + 1 adjustment layer).
 *
 * Không gen media mới: tái dùng đúng 2 file mau-*.webm của project mẫu
 * (rehydrate theo tên lúc bench seed + reload). Seed chỉ hợp lệ khi
 * parseProjectText pass — bench tự kiểm tra bằng tên project sau reload
 * (seedLoaded) và dừng nếu tên sai, nên seed hỏng không đo nhầm được.
 *
 * Dùng: node apps/web/scripts/make-preview-fps-seeds.mjs \
 *        --in /tmp/vcut-fps-r52-autosave-light.json \
 *        --out-dir /tmp/vcut-fps-r52-seeds
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import path from "node:path";

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const IN = arg("--in", "");
const OUT_DIR = arg("--out-dir", "");
if (!IN || !OUT_DIR) {
  console.error("Dùng: node make-preview-fps-seeds.mjs --in <autosave-light.json> --out-dir <dir>");
  process.exit(2);
}

const base = JSON.parse(fs.readFileSync(path.resolve(IN), "utf8"));
if (!base?.spec?.tracks) {
  console.error("File vào không phải autosave hợp lệ (thiếu spec.tracks).");
  process.exit(2);
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const textStyle = (y, fontSize) => ({
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize,
  color: "#ffffff",
  bold: true,
  x: 0.5,
  y,
  animation: "fadeUp",
});

function buildMedium() {
  const env = clone(base);
  const spec = env.spec;
  spec.meta.name = "FPS-vừa";
  const v1 = spec.tracks.find((t) => t.id === "v1");
  const t1 = spec.tracks.find((t) => t.id === "t1");
  // Clip 1: LUT cyberpunk + blur (ctx.filter) + chuyển cảnh dissolve.
  v1.clips[0].filter = { lut: "vcut-cyberpunk" };
  v1.clips[0].effects = [{ type: "blur", intensity: 0.6 }];
  v1.clips[0].transitionOut = { type: "dissolve", duration: 0.6 };
  // Clip 2: LUT cinematic + sharpen.
  v1.clips[1].filter = { lut: "vcut-cinematic" };
  v1.clips[1].effects = [{ type: "sharpen", intensity: 0.5 }];
  // Thêm 1 clip chữ chồng lên nửa sau project.
  t1.clips.push({
    kind: "text",
    id: "c-medium-text2",
    text: "FPS vừa — LUT + effect + dissolve",
    start: 2,
    duration: 5,
    style: textStyle(0.68, 44),
  });
  env.name = "FPS-vừa";
  env.savedAt = new Date().toISOString();
  env.session = { playhead: 0 };
  return env;
}

function buildHeavy() {
  const env = buildMedium();
  const spec = env.spec;
  spec.meta.name = "FPS-nặng";
  // Track video thứ 2 chồng lên toàn project (decode + vẽ gấp đôi).
  const v1 = spec.tracks.find((t) => t.id === "v1");
  const pipClips = v1.clips.map((c, i) => ({
    kind: "video",
    id: `c-heavy-pip-${i + 1}`,
    src: c.src,
    start: c.start,
    duration: c.duration,
    in: c.in,
    out: c.out,
    opacity: 0.7,
    filter: { lut: "vcut-cyberpunk" },
    effects: [{ type: "sepia", intensity: 0.5 }],
  }));
  spec.tracks.push({ id: "v2", kind: "video", label: "Video 2 (PIP)", clips: pipClips });
  // Adjustment layer toàn project: LUT + vignette (gộp vào mọi clip).
  spec.adjustmentLayers = [
    {
      id: "adj-heavy-1",
      start: 0,
      duration: 8,
      filters: [{ lut: "vcut-cyberpunk", effects: [{ type: "vignette", intensity: 0.6 }] }],
      source: "panel",
    },
  ];
  // Thêm 1 clip chữ nữa (tổng 3 clip chữ).
  const t1 = spec.tracks.find((t) => t.id === "t1");
  t1.clips.push({
    kind: "text",
    id: "c-heavy-text3",
    text: "FPS nặng — 2 track video + adjustment",
    start: 4.5,
    duration: 3,
    style: textStyle(0.15, 40),
  });
  env.name = "FPS-nặng";
  env.savedAt = new Date().toISOString();
  env.session = { playhead: 0 };
  return env;
}

fs.mkdirSync(path.resolve(OUT_DIR), { recursive: true });
const medium = buildMedium();
const heavy = buildHeavy();
const mediumPath = path.join(path.resolve(OUT_DIR), "autosave-fps-medium.json");
const heavyPath = path.join(path.resolve(OUT_DIR), "autosave-fps-heavy.json");
writeFileEpermRetry(mediumPath, JSON.stringify(medium, null, 2) + "\n");
writeFileEpermRetry(heavyPath, JSON.stringify(heavy, null, 2) + "\n");
const countClips = (env) => env.spec.tracks.reduce((a, t) => a + t.clips.length, 0);
console.log(`medium: ${mediumPath} (tracks=${medium.spec.tracks.length}, clips=${countClips(medium)}, adjustmentLayers=0)`);
console.log(`heavy: ${heavyPath} (tracks=${heavy.spec.tracks.length}, clips=${countClips(heavy)}, adjustmentLayers=${(heavy.spec.adjustmentLayers ?? []).length})`);
