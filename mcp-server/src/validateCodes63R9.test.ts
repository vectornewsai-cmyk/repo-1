#!/usr/bin/env node
/**
 * validateCodes63R9.test.ts — Phase 9 đợt 63, luồng R9: mã lỗi ổn định
 * cho MCP/CLI (nối validate.ts + lỗi CLI vào hệ mã lỗi chung, mirror
 * giao thức bridge→web đợt 62 R5).
 *
 * Khóa 3 điều (đợt 63 R9):
 *  1. Message tiếng Việt BYTE-IDENTICAL với trước đợt 63 — 46 case
 *     dưới đây chụp message gốc trước khi sửa (msg-baseline, SPEC
 *     0.2.0); đổi một chữ là test đỏ.
 *  2. Mọi ValidationError đều có `code` trong catalog VALIDATION_CODES
 *     + `params` JSON-safe, có `field` (máy khớp lỗi bằng mã, không
 *     parse câu tiếng Việt).
 *  3. Quét tĩnh: không điểm `new ValidationError(` / `fail(msg, code)`
 *     nào trong mcp-server/src dùng mã ngoài catalog hay thiếu mã.
 *
 * Chạy (từ thư mục mcp-server, sau `npx tsc -p tsconfig.json`):
 *   node dist/mcp-server/src/validateCodes63R9.test.js
 * Exit 0 khi tất cả pass.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VALIDATION_CODES,
  ValidationError,
  validateAddClipInput,
  validateAddTextInput,
  validateApplyTransitionInput,
  validateClipForTrack,
  validateCreateProjectInput,
  validateProjectId,
  validateRenderVideoInput,
  validateVideoSpec,
  type ValidationCode,
} from "./validate.js";

let passed = 0;
let failed = 0;
function ok(name: string): void {
  passed++;
  console.log(`  \u2705 ${name}`);
}
function bad(name: string, detail: string): void {
  failed++;
  console.log(`  \u274c ${name}: ${detail}`);
}

/* badSpec dùng `any` có chủ ý: các case cố tình gán sai kiểu (meta = "x",
 * tracks = {}) để validate bắt lỗi — ép kiểu chặt sẽ không viết được case. */
const badSpec = (mut: (s: any) => void): unknown => {
  const s: any = {
    version: "0.2.0",
    meta: { name: "x", width: 1280, height: 720, fps: 30 },
    tracks: [],
  };
  mut(s);
  return s;
};

// 46 case: [tên, hàm gây lỗi, mã kỳ vọng, message gốc byte-identical]
const CASES: Array<[string, () => unknown, ValidationCode, string]> = [
  ["spec-not-object", () => validateVideoSpec("nope"), "NOT_AN_OBJECT", "spec phải là object JSON"],
  ["spec-version", () => validateVideoSpec(badSpec(s => s.version = "9.9.9")), "VERSION_MISMATCH", "spec.version phải là \"0.2.0\" (nhận được: \"9.9.9\")"],
  ["meta-not-object", () => validateVideoSpec(badSpec(s => s.meta = "x")), "NOT_AN_OBJECT", "meta phải là object {name, width, height, fps}"],
  ["meta-name-empty", () => validateVideoSpec(badSpec(s => s.meta.name = "")), "STRING_REQUIRED", "meta.name phải là chuỗi khác rỗng (nhận được: \"\")"],
  ["meta-name-long", () => validateVideoSpec(badSpec(s => s.meta.name = "x".repeat(201))), "STRING_TOO_LONG", "meta.name quá dài (tối đa 200 ký tự)"],
  ["meta-width-zero", () => validateVideoSpec(badSpec(s => s.meta.width = 0)), "NUMBER_NOT_POSITIVE", "meta.width phải > 0 (nhận được: 0)"],
  ["meta-width-nonint", () => validateVideoSpec(badSpec(s => s.meta.width = 1.5)), "INTEGER_OUT_OF_RANGE", "meta.width phải là số nguyên 1..7680 (nhận được: 1.5)"],
  ["meta-width-huge", () => validateVideoSpec(badSpec(s => s.meta.width = 99999)), "INTEGER_OUT_OF_RANGE", "meta.width phải là số nguyên 1..7680 (nhận được: 99999)"],
  ["meta-fps-121", () => validateVideoSpec(badSpec(s => s.meta.fps = 121)), "FPS_TOO_HIGH", "meta.fps tối đa 120 (nhận được: 121)"],
  ["tracks-not-array", () => validateVideoSpec(badSpec(s => s.tracks = {})), "NOT_AN_ARRAY", "spec.tracks phải là mảng"],
  ["track-not-object", () => validateVideoSpec(badSpec(s => s.tracks = ["x"])), "NOT_AN_OBJECT", "track phải là object"],
  ["track-id-bad", () => validateVideoSpec(badSpec(s => s.tracks = [{ id: "a b", kind: "video", clips: [] }])), "ID_INVALID", "track.id chỉ gồm chữ/số/gạch ngang/gạch dưới, tối đa 64 ký tự (nhận được: \"a b\")"],
  ["track-dup-id", () => validateVideoSpec(badSpec(s => s.tracks = [{ id: "t1", kind: "video", clips: [] }, { id: "t1", kind: "audio", clips: [] }])), "DUPLICATE_ID", "trùng track.id: \"t1\""],
  ["track-kind-missing", () => validateVideoSpec(badSpec(s => s.tracks = [{ id: "t1", clips: [] }])), "ENUM_REQUIRED", "track.kind bắt buộc: \"video\" | \"audio\" | \"text\" | \"sticker\" | \"image\""],
  ["track-kind-bad", () => validateVideoSpec(badSpec(s => s.tracks = [{ id: "t1", kind: "3d", clips: [] }])), "ENUM_INVALID", "track.kind phải là một trong [video, audio, text, sticker, image] (nhận được: \"3d\")"],
  ["track-clips-not-array", () => validateVideoSpec(badSpec(s => s.tracks = [{ id: "t1", kind: "video", clips: {} }])), "NOT_AN_ARRAY", "track.clips phải là mảng"],
  ["clip-kind-mismatch", () => validateClipForTrack({ kind: "audio", id: "c1", src: "a.mp3", start: 0, duration: 1, in: 0, out: 1 }, "video"), "KIND_MISMATCH", "clip.kind (\"audio\") không khớp track kind (\"video\")"],
  ["clip-not-object", () => validateClipForTrack("x", "video"), "NOT_AN_OBJECT", "clip phải là object"],
  ["clip-out-le-in", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 2, out: 1 }, "video"), "OUT_NOT_AFTER_IN", "clip.out (1) phải > clip.in (2)"],
  ["clip-src-absolute", () => validateClipForTrack({ kind: "video", id: "c1", src: "/etc/passwd", start: 0, duration: 1, in: 0, out: 1 }, "video"), "UNSAFE_PATH", "clip.src phải là đường dẫn tương đối an toàn trong thư mục media (không \"..\", không đường dẫn tuyệt đối). Nhận được: \"/etc/passwd\""],
  ["clip-src-traversal", () => validateClipForTrack({ kind: "video", id: "c1", src: "../x.mp4", start: 0, duration: 1, in: 0, out: 1 }, "video"), "UNSAFE_PATH", "clip.src phải là đường dẫn tương đối an toàn trong thư mục media (không \"..\", không đường dẫn tuyệt đối). Nhận được: \"../x.mp4\""],
  ["clip-opacity-range", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, opacity: 2 }, "video"), "NUMBER_OUT_OF_RANGE", "clip.opacity phải trong 0..1 (nhận được: 2)"],
  ["clip-speed-range", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, speed: 9 }, "video"), "NUMBER_OUT_OF_RANGE", "clip.speed phải trong khoảng 0.25–4 (nhận được: 9)"],
  ["clip-reverse-type", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, reverse: "yes" }, "video"), "NOT_A_BOOLEAN", "clip.reverse phải là boolean (nhận được: \"yes\")"],
  ["clip-hex-bad", () => validateClipForTrack({ kind: "text", id: "c1", text: "hi", start: 0, duration: 1, style: { fontFamily: "Noto", fontSize: 48, color: "red" } }, "text"), "INVALID_HEX_COLOR", "clip.style.color phải dạng hex \"#rgb\" hoặc \"#rrggbb\" (nhận được: \"red\")"],
  ["clip-fontsize-huge", () => validateClipForTrack({ kind: "text", id: "c1", text: "hi", start: 0, duration: 1, style: { fontFamily: "Noto", fontSize: 999, color: "#fff" } }, "text"), "NUMBER_OUT_OF_RANGE", "clip.style.fontSize quá lớn (tối đa 500)"],
  ["clip-text-empty", () => validateClipForTrack({ kind: "text", id: "c1", text: "", start: 0, duration: 1, style: { fontFamily: "Noto", fontSize: 48, color: "#fff" } }, "text"), "STRING_REQUIRED", "clip.text phải là chuỗi khác rỗng (nhận được: \"\")"],
  ["clip-anim-unknown-prop", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, animations: { skew: { keyframes: [{ t: 0, v: 0, easing: "linear" }] } } }, "video"), "UNSUPPORTED_PROPERTY", "clip.animations.skew: thuộc tính không hỗ trợ (chỉ: x, y, opacity, scale, rotation)"],
  ["clip-anim-empty-kf", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, animations: { x: { keyframes: [] } } }, "video"), "EMPTY_ARRAY", "clip.animations.x.keyframes: mảng rỗng — cần ít nhất 1 keyframe"],
  ["clip-anim-no-easing", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, animations: { x: { keyframes: [{ t: 0, v: 0 }] } } }, "video"), "ENUM_REQUIRED", "clip.animations.x.keyframes[0].easing bắt buộc: linear | ease-in | ease-out"],
  ["clip-anim-t-range", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, animations: { x: { keyframes: [{ t: 9, v: 0, easing: "linear" }] } } }, "video"), "NUMBER_OUT_OF_RANGE", "clip.animations.x.keyframes[0].t phải trong [0, 1] (nhận được: 9)"],
  ["clip-fx-dup", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, effects: [{ type: "blur" }, { type: "blur" }] }, "video"), "DUPLICATE_EFFECT", "clip.effects[1]: trùng effect \"blur\" — mỗi loại chỉ dùng 1 lần"],
  ["clip-fx-type-missing", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, effects: [{}] }, "video"), "ENUM_REQUIRED", "clip.effects[0].type bắt buộc: blur, sharpen, grayscale, sepia, vignette, noise, brightness, glitch, rgb-shift, shake, pixelate, mirror, old-film, invert, edgedetect, hue-rotate"],
  ["clip-chroma-bad", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, chromaKey: { color: "#FFF" } }, "video"), "INVALID_HEX_COLOR", "clip.chromaKey.color phải là hex #rrggbb (vd \"#00FF00\"), nhận được: \"#FFF\""],
  ["clip-color-unknown-key", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, filter: { color: { hue: 5 } } }, "video"), "UNSUPPORTED_PROPERTY", "clip.filter.color.hue không được hỗ trợ"],
  ["clip-color-range", () => validateClipForTrack({ kind: "video", id: "c1", src: "a.mp4", start: 0, duration: 1, in: 0, out: 1, filter: { color: { brightness: 500 } } }, "video"), "NUMBER_OUT_OF_RANGE", "clip.filter.color.brightness phải trong -100..100 (nhận được: 500)"],
  ["clip-track-flag-type", () => validateVideoSpec(badSpec(s => s.tracks = [{ id: "t1", kind: "video", clips: [], muted: "yes" }])), "NOT_A_BOOLEAN", "track.muted phải là boolean"],
  ["create-fps-121", () => validateCreateProjectInput({ name: "x", width: 1280, height: 720, fps: 121 }), "FPS_TOO_HIGH", "fps tối đa 120"],
  ["create-not-object", () => validateCreateProjectInput(42), "NOT_AN_OBJECT", "input phải là object"],
  ["addclip-kind-missing", () => validateAddClipInput({ project_id: "p1", clip: {} }), "ENUM_REQUIRED", "track_kind bắt buộc: \"video\" | \"audio\" | \"text\" | \"sticker\" | \"image\""],
  ["addtext-not-object", () => validateAddTextInput("x"), "NOT_AN_OBJECT", "input phải là object"],
  ["transition-duration-zero", () => validateApplyTransitionInput({ project_id: "p1", clip_id: "c1", direction: "in", type: "fade", duration: 0 }), "TRANSITION_DURATION_ZERO", "duration phải > 0 khi type=\"fade\""],
  ["transition-direction-missing", () => validateApplyTransitionInput({ project_id: "p1", clip_id: "c1", type: "fade", duration: 1 }), "ENUM_REQUIRED", "direction bắt buộc: \"in\" | \"out\""],
  ["render-outpath-absolute", () => validateRenderVideoInput({ project_id: "p1", out_path: "/tmp/x.mp4" }), "INVALID_OUTPUT_PATH", "out_path phải là đường dẫn tương đối an toàn trong thư mục renders/, kết thúc bằng \".mp4\" (không \"..\", không tuyệt đối). Nhận được: \"/tmp/x.mp4\""],
  ["render-outpath-no-mp4", () => validateRenderVideoInput({ project_id: "p1", out_path: "x.mov" }), "INVALID_OUTPUT_PATH", "out_path phải là đường dẫn tương đối an toàn trong thư mục renders/, kết thúc bằng \".mp4\" (không \"..\", không tuyệt đối). Nhận được: \"x.mov\""],
  ["project-id-bad", () => validateProjectId("a b"), "ID_INVALID", "project_id chỉ gồm chữ/số/gạch ngang/gạch dưới, tối đa 64 ký tự (nhận được: \"a b\")"],
];

for (const [name, fn, code, message] of CASES) {
  try {
    fn();
    bad(name, "đáng lẽ phải throw ValidationError");
  } catch (e) {
    if (!(e instanceof ValidationError)) {
      bad(name, `throw sai loại: ${e instanceof Error ? e.constructor.name : typeof e}`);
      continue;
    }
    if (e.code !== code) {
      bad(name, `code phải là ${code}, nhận ${e.code}`);
      continue;
    }
    if (e.message !== message) {
      bad(name, `message đổi: ${JSON.stringify(e.message)}`);
      continue;
    }
    let paramsOk = true;
    try {
      const round = JSON.parse(JSON.stringify(e.params)) as Record<string, unknown>;
      for (const [k, v] of Object.entries(round)) {
        if (typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean") {
          paramsOk = false;
        }
      }
      if (typeof e.params.field !== "string" || e.params.field.length === 0) paramsOk = false;
    } catch {
      paramsOk = false;
    }
    if (!paramsOk) {
      bad(name, `params không JSON-safe hoặc thiếu field: ${JSON.stringify(e.params)}`);
      continue;
    }
    ok(`${name} -> [${code}]`);
  }
}

// --- Catalog: duy nhất, SCREAMING_SNAKE, đã sắp xếp ---
{
  const codes = [...VALIDATION_CODES];
  const uniq = new Set(codes);
  if (uniq.size !== codes.length) bad("catalog duy nhất", `${codes.length} mã, ${uniq.size} duy nhất`);
  else ok("catalog không trùng mã");
  const badFormat = codes.filter((c) => !/^[A-Z][A-Z0-9_]*$/.test(c));
  if (badFormat.length > 0) bad("catalog SCREAMING_SNAKE", badFormat.join(", "));
  else ok("catalog toàn SCREAMING_SNAKE");
  const sorted = [...codes].sort();
  if (JSON.stringify(sorted) !== JSON.stringify(codes)) bad("catalog đã sắp xếp", "chưa xếp a-z");
  else ok(`catalog đã sắp xếp (${codes.length} mã)`);
}

// --- Quét tĩnh mcp-server/src: mọi điểm throw/fail đều có mã trong catalog ---
{
  const HERE = path.dirname(fileURLToPath(import.meta.url));
  // dist/mcp-server/src -> gốc repo (4 cấp lên).
  const ROOT = path.resolve(HERE, "..", "..", "..", "..");
  const SRC = path.join(ROOT, "mcp-server", "src");
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".ts") && !ent.name.endsWith(".test.ts")) files.push(p);
    }
  };
  walk(SRC);
  if (!existsSync(path.join(SRC, "validate.ts"))) {
    bad("quét tĩnh: tìm thấy mcp-server/src", `không thấy validate.ts ở ${SRC}`);
  } else {
    ok(`quét tĩnh: ${files.length} file .ts (không test)`);
    const catalog = new Set<string>(VALIDATION_CODES);
    let throwSites = 0;
    let failSites = 0;
    const problems: string[] = [];
    for (const f of files) {
      const txt = readFileSync(f, "utf8");
      const rel = path.relative(ROOT, f);
      for (const m of txt.matchAll(/new ValidationError\(\s*"([A-Z_]+)",/g)) {
        throwSites++;
        if (!catalog.has(m[1])) problems.push(`${rel}: mã lạ ${m[1]}`);
      }
      for (const m of txt.matchAll(/throw new ValidationError\(/g)) {
        // Chỉ tính `throw ...` thật — header comment của validate.ts
        // cũng nhắc `new ValidationError(...)` bằng chữ, không phải code.
        const rest = txt.slice(m.index + m[0].length, m.index + m[0].length + 30);
        if (!/^"[A-Z_]+",/.test(rest)) problems.push(`${rel}: throw thiếu mã ở offset ${m.index}`);
      }
      for (const m of txt.matchAll(/return fail\(\s*([\s\S]{0,400}?)\);/g)) {
        // fail() ở tool handler phải có mã; fail() trong handleError
        // (index.ts / tools/common.ts) được miễn — nó chuyển e.code.
        // Nhóm bắt tới trước `);` nên kết bằng `, "MÃ"` (không có `)`).
        if (rel === "mcp-server/src/index.ts" || rel === "mcp-server/src/tools/common.ts") continue;
        failSites++;
        if (!/,\s*"[A-Z_]+"$/.test(m[1].trim())) {
          problems.push(`${rel}: fail() thiếu mã: ${m[1].slice(0, 80)}`);
        } else {
          const code = m[1].match(/,\s*"([A-Z_]+)"$/)![1];
          if (!catalog.has(code)) problems.push(`${rel}: fail() mã lạ ${code}`);
        }
      }
    }
    if (throwSites < 130) problems.push(`chỉ đếm được ${throwSites} điểm ValidationError (kỳ vọng >= 130)`);
    if (failSites < 24) problems.push(`chỉ đếm được ${failSites} điểm fail() có mã (kỳ vọng >= 24)`);
    if (problems.length > 0) {
      for (const p of problems.slice(0, 10)) bad("quét tĩnh", p);
      if (problems.length > 10) bad("quét tĩnh", `... và ${problems.length - 10} lỗi nữa`);
    } else {
      ok(`quét tĩnh: ${throwSites} throw + ${failSites} fail() đều có mã trong catalog`);
    }
    // handleError 2 nơi phải chuyển e.code sang fail()
    for (const rel of ["mcp-server/src/index.ts", "mcp-server/src/tools/common.ts"]) {
      const txt = readFileSync(path.join(ROOT, rel), "utf8");
      if (txt.includes("fail(e.message, e.code)")) ok(`handleError ${rel} chuyển e.code`);
      else bad(`handleError ${rel} chuyển e.code`, "không thấy fail(e.message, e.code)");
    }
  }
}

console.log(`\n==========================================`);
if (failed === 0) console.log(`validateCodes63R9: ${passed} pass, 0 fail`);
else console.log(`validateCodes63R9: ${passed} pass, ${failed} FAIL`);
process.exitCode = failed === 0 ? 0 : 1;
