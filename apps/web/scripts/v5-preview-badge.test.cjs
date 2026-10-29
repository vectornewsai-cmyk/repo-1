// v5-preview-badge.test.cjs — V5 (đợt "preview khớp render"): kiểm chứng hàm
// map trạng thái preview trong components/transitions/previewStatus.ts.
//
// Test đọc TRỰC TIẾP các tập Set từ file .ts thật (không copy bảng sang test),
// rồi đối chiếu với catalog thật: TRANSITION_OPTIONS (TransitionPanel.tsx),
// EFFECT_TYPES (packages/video-spec/src/effects.ts) và i18n vi/en.json.
// Chạy: node apps/web/scripts/v5-preview-badge.test.cjs (từ repo root)
// Exit 0 = pass, 1 = có lỗi.
"use strict";

const assert = require("assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const WEB = path.join(ROOT, "apps", "web");

let pass = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  pass++;
}
function eq(a, b, msg) {
  assert.strictEqual(a, b, `${msg} (nhận ${a}, muốn ${b})`);
  pass++;
}

const statusSrc = fs.readFileSync(
  path.join(WEB, "src", "components", "transitions", "previewStatus.ts"),
  "utf8",
);

function parseSet(varName) {
  const m = statusSrc.match(
    new RegExp(`const ${varName} = new Set\\(\\[([\\s\\S]*?)\\]\\)`),
  );
  assert.ok(m, `không parse được ${varName} từ previewStatus.ts`);
  return new Set([...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
}
const TR_MATCHED = parseSet("TRANSITION_MATCHED");
const FX_MATCHED = parseSet("EFFECT_MATCHED");
const FX_APPROX = parseSet("EFFECT_APPROX");
// Đợt 10 (parent tích hợp): V2 thêm tập canvas — test phải parse cả tập này.
// Đợt 12 T3: 4 type canvas đã KHỚP theo số đo đợt 11 P2 tách sang tập riêng.
const FX_CANVAS_MATCHED = parseSet("EFFECT_CANVAS_MATCHED");
const FX_CANVAS_APPROX = parseSet("EFFECT_CANVAS_APPROX");

// Hàm map — tái hiện đúng thứ tự nhánh trong file .ts (đã kiểm tra chuỗi
// thân hàm bên dưới), dữ liệu lấy từ các Set đã parse ở trên.
function transitionPreviewStatus(type) {
  return TR_MATCHED.has(type) ? "matched" : "approx";
}
function effectPreviewStatus(type) {
  if (FX_MATCHED.has(type)) return "matched";
  if (FX_CANVAS_MATCHED.has(type)) return "matched";
  if (FX_APPROX.has(type)) return "approx";
  if (FX_CANVAS_APPROX.has(type)) return "approx";
  return "none";
}

// Thân hàm trong file .ts phải khớp thứ tự nhánh này (tránh test lệch code).
ok(
  /export function transitionPreviewStatus[\s\S]*?TRANSITION_MATCHED\.has\(type\)[\s\S]*?return "approx"/.test(
    statusSrc,
  ),
  "thân transitionPreviewStatus: matched → approx",
);
ok(
  /export function effectPreviewStatus[\s\S]*?EFFECT_MATCHED[\s\S]*?EFFECT_CANVAS_MATCHED[\s\S]*?EFFECT_APPROX[\s\S]*?EFFECT_CANVAS_APPROX[\s\S]*?return "none"/.test(
    statusSrc,
  ),
  "thân effectPreviewStatus: matched → canvas-matched → approx → canvas-approx → none",
);

// --- 1. Transition: fade → khớp, wipe → xấp xỉ (yêu cầu task) ---
eq(transitionPreviewStatus("fade"), "matched", "transition fade");
eq(transitionPreviewStatus("none"), "matched", "transition none (cắt cứng)");
// Đợt 14 R2: dissolve lên matched theo số đo MAD ≤ 0.0089 (xem
// docs/PHASE9_ROUND14_R2_DISSOLVE_LIMITS.md); circleopen/close đã
// matched từ đợt 13 C1.
eq(transitionPreviewStatus("dissolve"), "matched", "transition dissolve (đợt 14 R2)");
eq(transitionPreviewStatus("circleopen"), "matched", "transition circleopen (đợt 13 C1)");
eq(transitionPreviewStatus("circleclose"), "matched", "transition circleclose (đợt 13 C1)");
for (const w of ["wipeleft", "wiperight", "wipeup", "wipedown"]) {
  eq(transitionPreviewStatus(w), "approx", `transition ${w}`);
}
// Transition mới chưa biết (kiểu V3) mặc định xấp xỉ, trừ fade.
eq(transitionPreviewStatus("wipe-new-thing"), "approx", "transition mới → xấp xỉ");
eq(transitionPreviewStatus("fade-new-thing"), "approx", "type lạ không phải fade → xấp xỉ");

// Mọi type trong panel đều có trạng thái (không rơi về "none" vì panel luôn
// có minh họa CSS; chỉ timeline preview mới phân biệt khớp/xấp xỉ).
const panelSrc = fs.readFileSync(
  path.join(WEB, "src", "components", "transitions", "TransitionPanel.tsx"),
  "utf8",
);
const panelTypes = [...panelSrc.matchAll(/\{ type: "([^"]+)" \}/g)].map((m) => m[1]);
// Đợt 10 (parent tích hợp): V3 thêm 14 type → 81 catalog + "none" = 82.
// Đợt 12 T3 kiểm chứng lại sau đợt 11: panel vẫn đúng 82, không thêm/bớt.
eq(panelTypes.length, 82, "panel có 82 transition (81 + none)");
for (const t of panelTypes) {
  const s = transitionPreviewStatus(t);
  ok(s === "matched" || s === "approx", `panel type ${t} có trạng thái (${s})`);
}
ok(panelSrc.includes("tr-badge"), "TransitionPanel render span tr-badge");
ok(
  panelSrc.includes("transitionPreviewStatus(opt.type)"),
  "TransitionPanel dùng transitionPreviewStatus",
);

// --- 2. Effect: đã implement → không còn "chưa có preview" ---
const fxSrc = fs.readFileSync(
  path.join(ROOT, "packages", "video-spec", "src", "effects.ts"),
  "utf8",
);
// Lấy EFFECT_TYPES chính xác từ block khai báo.
const block = fxSrc.match(/export const EFFECT_TYPES = \[([\s\S]*?)\] as const/);
assert.ok(block, "không parse được EFFECT_TYPES");
const effectTypes = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
eq(effectTypes.length, 16, "EFFECT_TYPES có 16 effect");
const IMPLEMENTED = [
  "blur",
  "grayscale",
  "sepia",
  "vignette",
  "brightness",
  "old-film",
  "invert",
  "hue-rotate",
];
// Đợt 12 T3: 4 type canvas nay KHỚP theo số đo đợt 11 P2 (ngưỡng V6/V11:
// MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8): pixelate MAD 0.667, shake MAD 0.000,
// rgb-shift MAD 0.000, mirror MAD 0.000 — xem
// docs/PHASE9_ROUND11_P2_PIXELATE_LIMITS.md. Đợt 14 R6: sharpen nay KHỚP
// cùng ngưỡng sau đổi mô hình luma + Gaussian 5×5 (MAD 0.40–0.61,
// ≤8 = 99.5–100%, 16 điểm đo) — xem
// docs/PHASE9_ROUND14_R6_EFFECT_PARITY_LIMITS.md. 3 type còn lại giữ
// "approx": edgedetect MAD 3.86/8.53/1.33 (step/tự nhiên/pattern, vẫn
// dưới ngưỡng KHỚP trên step và tự nhiên), noise/glitch chỉ xấp xỉ
// thống kê/cấu trúc (seed xác định vs nhiễu thời gian). "none" chỉ còn
// cho type lạ.
const CANVAS_MATCHED = ["pixelate", "shake", "rgb-shift", "mirror", "sharpen"];
const CANVAS_APPROX = ["noise", "glitch", "edgedetect"];
eq(FX_CANVAS_MATCHED.size, 5, "EFFECT_CANVAS_MATCHED có 5 type");
eq(FX_CANVAS_APPROX.size, 3, "EFFECT_CANVAS_APPROX còn 3 type");
for (const t of IMPLEMENTED) {
  ok(effectPreviewStatus(t) !== "none", `effect đã implement ${t} không phải none`);
}
for (const t of CANVAS_MATCHED) {
  eq(effectPreviewStatus(t), "matched", `effect canvas ${t} → matched (số đo đợt 11 P2)`);
}
for (const t of CANVAS_APPROX) {
  eq(effectPreviewStatus(t), "approx", `effect canvas ${t} → approx`);
}
for (const t of effectTypes) {
  ok(
    IMPLEMENTED.includes(t) ||
      CANVAS_MATCHED.includes(t) ||
      CANVAS_APPROX.includes(t),
    `effect ${t} nằm trong 1 trong 3 nhóm đã phân loại`,
  );
}
eq(effectPreviewStatus("effect-la"), "none", "effect lạ → none");
const effectPanelSrc = fs.readFileSync(
  path.join(WEB, "src", "components", "effects", "EffectPanel.tsx"),
  "utf8",
);
ok(effectPanelSrc.includes("fx-badge"), "EffectPanel render span fx-badge");
ok(
  effectPanelSrc.includes("effectPreviewStatus(type)"),
  "EffectPanel dùng effectPreviewStatus",
);

// --- 3. i18n: key badge có ở cả vi và en, khác rỗng, phân biệt nhau ---
for (const lang of ["vi", "en"]) {
  const dict = JSON.parse(
    fs.readFileSync(path.join(WEB, "src", "i18n", `${lang}.json`), "utf8"),
  );
  const badge = dict.previewBadge;
  assert.ok(badge, `thiếu section previewBadge ở ${lang}`);
  for (const k of ["matched", "approx", "none"]) {
    ok(
      typeof badge[k] === "string" && badge[k].length > 0,
      `previewBadge.${k} có ở ${lang}`,
    );
  }
  ok(
    new Set(Object.values(badge)).size === 3,
    `3 nhãn badge phân biệt nhau ở ${lang}`,
  );
}

console.log(`v5-preview-badge: PASS ${pass} assertions`);
