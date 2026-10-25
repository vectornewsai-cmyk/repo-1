// r6-i18n-check.cjs — R6 Phase 9: kiểm chứng độ phủ key i18n.
//
// 1. vi.json và en.json phải có cùng tập key (flatten).
// 2. Mọi key literal i18nT("...") trong src/ phải tồn tại trong cả 2 dict.
// 3. Mọi key MỚI của R6 (các section liệt kê dưới) phải được code dùng tới
//    (literal, hoặc qua prefix động transition.opt./textanim.opt.).
// 4. Catalog transition (68 type) và textanim (18 anim) phải đủ label+desc.
//
// Chạy: node apps/web/scripts/r6-i18n-check.cjs
// Exit 0 = pass, 1 = có lỗi (in chi tiết).
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const R6_SECTIONS = [
  "transition", "speed", "keyframe", "keyframegraph", "chroma", "bgremove",
  "textanim", "color", "lut", "effect", "sticker", "audiofx", "mask",
  "font", "scene", "tts", "drop",
];
const R6_COMMON_KEYS = ["common.bridgeConn"];

function flat(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") flat(v, `${prefix}${k}.`, out);
    else out[`${prefix}${k}`] = v;
  }
  return out;
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      walk(p, acc);
    } else if (/\.(tsx?|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

let fail = 0;
const failMsg = (m) => { fail++; console.error(`  ✗ ${m}`); };

const vi = JSON.parse(fs.readFileSync(path.join(SRC, "i18n", "vi.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(SRC, "i18n", "en.json"), "utf8"));
const fv = flat(vi, "", {});
const fe = flat(en, "", {});
console.log(`== key sets: vi=${Object.keys(fv).length} en=${Object.keys(fe).length} ==`);
for (const k of Object.keys(fv)) if (!(k in fe)) failMsg(`thiếu ở en: ${k}`);
for (const k of Object.keys(fe)) if (!(k in fv)) failMsg(`thiếu ở vi: ${k}`);

// Quét code.
const files = walk(SRC, []);
let code = "";
for (const f of files) code += `\n${fs.readFileSync(f, "utf8")}`;
const literalKeys = new Set();
for (const m of code.matchAll(/i18nT\(\s*["'`]([^"'`$]+)["'`]/g)) literalKeys.add(m[1]);
// Key qua map trung gian (vd CAT_LABEL_KEY trong FontPicker): key xuất hiện
// dạng string literal trong code nhưng không nằm trực tiếp trong i18nT(...).
const stringLiterals = new Set();
for (const m of code.matchAll(/["'`]([a-z]+\.[a-zA-Z0-9_.]+)["'`]/g)) stringLiterals.add(m[1]);
console.log(`== literal i18nT keys trong code: ${literalKeys.size} ==`);
for (const k of literalKeys) {
  if (!(k in fv)) failMsg(`key dùng trong code nhưng thiếu ở vi: ${k}`);
  if (!(k in fe)) failMsg(`key dùng trong code nhưng thiếu ở en: ${k}`);
}

// Key mới R6 phải được dùng.
const used = new Set([...literalKeys, ...stringLiterals]);
const dynamicPrefixes = ["transition.opt.", "textanim.opt."];
const r6Keys = Object.keys(fv).filter(
  (k) => R6_SECTIONS.includes(k.split(".")[0]) || R6_COMMON_KEYS.includes(k),
);
console.log(`== key mới R6: ${r6Keys.length} ==`);
for (const k of r6Keys) {
  if (used.has(k)) continue;
  if (dynamicPrefixes.some((p) => k.startsWith(p))) continue;
  // font.cat* qua map CAT_LABEL_KEY (literal trong code) -> đã nằm trong used.
  failMsg(`key R6 thừa (không dùng trong code): ${k}`);
}

// Catalog completeness: mọi type/anim phải có label + desc.
const transPanel = fs.readFileSync(
  path.join(SRC, "components", "transitions", "TransitionPanel.tsx"), "utf8");
const types = [...transPanel.matchAll(/\{ type: "([^"]+)" \}/g)].map((m) => m[1]);
console.log(`== transition types trong panel: ${types.length} ==`);
for (const t of types) {
  for (const part of ["label", "desc"]) {
    if (!(`transition.opt.${t}.${part}` in fv)) failMsg(`thiếu transition.opt.${t}.${part}`);
  }
}
const textAnim = fs.readFileSync(
  path.join(SRC, "components", "textfx", "TextAnimPicker.tsx"), "utf8");
const anims = [...textAnim.matchAll(/"([a-zA-Z]+)",\s*$/gm)].map((m) => m[1]);
const animList = [...new Set(
  (textAnim.match(/const TEXT_ANIMATIONS[^;]*;/s) || [""])[0].matchAll(/"([a-zA-Z]+)"/g),
)].map((m) => m[1]);
console.log(`== text anims trong picker: ${animList.length} ==`);
for (const a of animList) {
  for (const part of ["label", "desc"]) {
    if (!(`textanim.opt.${a}.${part}` in fv)) failMsg(`thiếu textanim.opt.${a}.${part}`);
  }
}
void anims;

if (fail === 0) console.log("✅ R6 i18n check: PASS");
else console.log(`❌ R6 i18n check: ${fail} lỗi`);
process.exit(fail === 0 ? 0 : 1);
