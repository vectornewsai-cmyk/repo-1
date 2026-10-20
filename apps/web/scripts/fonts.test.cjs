// fonts.test.cjs — test apps/web/src/lib/fonts.ts (FontHarvest) bằng Node.
// Biên dịch module thật sang CommonJS trong /tmp rồi chạy assertions.
"use strict";

const assert = require("node:assert/strict");
const {
  VCUT_FONTS,
  FONT_CATEGORIES,
  fontsByCategory,
  fontStack,
} = require("./out/apps/web/src/lib/fonts.js");

let pass = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

ok("43 fonts trong catalog", () => {
  assert.equal(VCUT_FONTS.length, 43);
});

ok("đủ 5 categories", () => {
  assert.deepEqual([...FONT_CATEGORIES], ["Sans Serif", "Serif", "Display", "Handwriting", "Monospace"]);
});

ok("phân bố: 14 sans / 8 serif / 10 display / 6 handwriting / 5 mono", () => {
  const g = fontsByCategory();
  assert.equal(g["Sans Serif"].length, 14);
  assert.equal(g["Serif"].length, 8);
  assert.equal(g["Display"].length, 10);
  assert.equal(g["Handwriting"].length, 6);
  assert.equal(g["Monospace"].length, 5);
});

ok("Be Vietnam Pro đầu danh sách sans (thiết kế cho tiếng Việt)", () => {
  const g = fontsByCategory();
  assert.equal(g["Sans Serif"][0].family, "Be Vietnam Pro");
});

ok("mọi font đều có family + category hợp lệ", () => {
  for (const f of VCUT_FONTS) {
    assert.ok(f.family.length > 0, "family trống");
    assert.ok(FONT_CATEGORIES.includes(f.category), `category lạ: ${f.category}`);
    assert.equal(typeof f.variable, "boolean");
  }
});

ok("không trùng tên font", () => {
  const names = VCUT_FONTS.map((f) => f.family);
  assert.equal(new Set(names).size, names.length);
});

ok("fontStack trả về CSS hợp lệ", () => {
  const s = fontStack("Be Vietnam Pro");
  assert.ok(s.includes('"Be Vietnam Pro"'));
  assert.ok(s.includes("system-ui"));
});

console.log(`\n==========================================`);
console.log(`🎉 FONTS TEST PASS: ${pass} assertions`);
console.log(`==========================================`);
