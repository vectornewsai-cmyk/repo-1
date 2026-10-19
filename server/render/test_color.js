#!/usr/bin/env node
/**
 * test_color.js — Kiểm chứng R1-074/R1-075 (color grading) bằng render THẬT.
 *
 * Case:
 *  A. Unit: validateColorAdjust/buildColorAdjustFilter (JS mirror) — đúng spec
 *  B. Parity: JS mirror vs TS (color.ts compile) — output filter string GIỐNG HỆT
 *  C. Render thật: mỗi param (brightness/contrast/saturation/temperature/tint/
 *     highlights/shadows) → pixel THAY ĐỔI so với baseline
 *  D. Render thật: color + LUT cùng lúc (không crash, pixel khác cả hai)
 *  E. validate.js: từ chối color sai (ngoài -100..100, sai kiểu, key lạ)
 *
 * Chạy: node test_color.js
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-color-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function ff(args, opts = {}) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], opts);
}

// ---- A. Unit JS mirror ----
console.log("== A. Unit validateColorAdjust / buildColorAdjustFilter ==");
const lut = require("./src/lut");
{
  const eq = (a, b, m) => ok(m, a === b, `nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
  eq(lut.validateColorAdjust(undefined).length, 0, "undefined → []");
  eq(lut.validateColorAdjust({}).length, 0, "{} → []");
  eq(lut.validateColorAdjust({ brightness: -100, shadows: 100 }).length, 0, "biên -100/100 ok");
  ok("brightness=101 → lỗi", lut.validateColorAdjust({ brightness: 101 }).length > 0);
  ok("brightness=-101 → lỗi", lut.validateColorAdjust({ brightness: -101 }).length > 0);
  ok("contrast='cao' → lỗi", lut.validateColorAdjust({ contrast: "cao" }).length > 0);
  ok("key lạ → lỗi", lut.validateColorAdjust({ xyz: 1 }).length > 0);
  ok("'chuoi' → lỗi", lut.validateColorAdjust("chuoi").length > 0);
  eq(lut.buildColorAdjustFilter(undefined), "", "undefined → ''");
  eq(lut.buildColorAdjustFilter({}), "", "{} → ''");
  eq(lut.buildColorAdjustFilter({ brightness: 0, contrast: 0 }), "", "toàn 0 → ''");
  eq(lut.buildColorAdjustFilter({ brightness: 20 }), "eq=brightness=0.2", "brightness=20");
  eq(lut.buildColorAdjustFilter({ brightness: -100 }), "eq=brightness=-1", "brightness=-100");
  eq(lut.buildColorAdjustFilter({ contrast: 100 }), "eq=contrast=2", "contrast=100");
  eq(lut.buildColorAdjustFilter({ saturation: -100 }), "eq=saturation=0", "saturation=-100");
  eq(
    lut.buildColorAdjustFilter({ contrast: -50, saturation: 30 }),
    "eq=contrast=0.5:saturation=1.3",
    "contrast+saturation"
  );
  eq(
    lut.buildColorAdjustFilter({ temperature: 100 }),
    "colorbalance=rm=0.4:bm=-0.4",
    "temperature=100"
  );
  eq(lut.buildColorAdjustFilter({ tint: -100 }), "colorbalance=gm=0.4", "tint=-100 (green)");
  eq(lut.buildColorAdjustFilter({ tint: 100 }), "colorbalance=gm=-0.4", "tint=100 (magenta)");
  eq(
    lut.buildColorAdjustFilter({ highlights: 100, shadows: -100 }),
    "colorbalance=rh=0.3:bh=-0.3:rs=-0.3:bs=0.3",
    "highlights+shadows"
  );
  eq(
    lut.buildColorAdjustFilter({ brightness: 10, temperature: -50 }),
    "eq=brightness=0.1,colorbalance=rm=-0.2:bm=0.2",
    "eq + colorbalance"
  );
  // validateVideoFilter tích hợp color
  eq(lut.validateVideoFilter({ color: { brightness: 20 } }).length, 0, "filter.color hợp lệ");
  ok("filter.color sai → lỗi", lut.validateVideoFilter({ color: { brightness: 999 } }).length > 0);
  ok("isColorNoop", lut.isColorNoop({}) && lut.isColorNoop(undefined) && !lut.isColorNoop({ brightness: 1 }));
  eq(lut.LUT_IDS.length, 20, "catalog 20 LUT");
}

// ---- B. Parity JS vs TS ----
console.log("== B. Parity JS mirror vs TS color.ts ==");
{
  const r = spawnSync("npx", ["tsc",
    path.join(HERE, "..", "..", "packages", "video-spec", "src", "color.ts"),
    "--outDir", path.join(WORK, "tsout"),
    "--module", "commonjs", "--target", "es2022", "--skipLibCheck",
  ], { encoding: "utf8" });
  if (r.status !== 0) {
    ok("compile color.ts", false, (r.stderr || "").slice(0, 300));
  } else {
    const ts = require(path.join(WORK, "tsout", "color.js"));
    const cases = [
      undefined, {}, { brightness: 20 }, { brightness: -100, contrast: 50 },
      { saturation: -30, temperature: 75 }, { tint: -100 }, { tint: 100 },
      { highlights: 100, shadows: -100 },
      { brightness: 10, contrast: -20, saturation: 30, temperature: -50, tint: 25, highlights: 60, shadows: -40 },
    ];
    let allSame = true;
    for (const c of cases) {
      const jsOut = lut.buildColorAdjustFilter(c);
      const tsOut = ts.buildColorAdjustFilter(c);
      if (jsOut !== tsOut) {
        allSame = false;
        console.log(`    lệch: input=${JSON.stringify(c)} js=${jsOut} ts=${tsOut}`);
      }
      const jsV = JSON.stringify(lut.validateColorAdjust(c));
      const tsV = JSON.stringify(ts.validateColorAdjust(c));
      if (jsV !== tsV) {
        allSame = false;
        console.log(`    validate lệch: input=${JSON.stringify(c)}`);
      }
    }
    ok("JS mirror == TS (9 case build + validate)", allSame);
  }
}

// ---- C. Render thật từng param ----
console.log("== C. Render thật: mỗi param đổi pixel ==");
ff(["-y", "-f", "lavfi", "-i", "testsrc2=s=320x240:d=2:r=30", "-pix_fmt", "yuv420p", path.join(MEDIA, "src.mp4")]);

function specWith(filter) {
  return {
    version: "0.2.0",
    meta: { name: "color-test", width: 320, height: 240, fps: 30, duration: 2 },
    tracks: [{
      kind: "video", id: "t1",
      clips: [{ kind: "video", id: "c1", src: "src.mp4", start: 0, duration: 2, in: 0, out: 2, filter }],
    }],
  };
}
function render(spec, outName) {
  const specPath = path.join(WORK, outName + ".json");
  const outPath = path.join(WORK, outName + ".mp4");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const r = spawnSync("node", [path.join(HERE, "src", "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA, "-y", "-q"],
    { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`render ${outName} fail: ${(r.stderr || "").slice(-500)}`);
  return outPath;
}
function frameSum(mp4) {
  const raw = execFileSync("ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-ss", "1", "-i", mp4,
     "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 64 * 1024 * 1024 });
  let s = 0;
  for (let i = 0; i < raw.length; i++) s += raw[i];
  return s;
}

const base = render(specWith(undefined), "base");
const baseSum = frameSum(base);
ok("baseline render OK", baseSum > 0, `sum=${baseSum}`);

const PARAM_CASES = [
  ["brightness", { brightness: 60 }],
  ["contrast", { contrast: 60 }],
  ["saturation", { saturation: -80 }],
  ["temperature", { temperature: 80 }],
  ["tint", { tint: 80 }],
  ["highlights", { highlights: 80 }],
  ["shadows", { shadows: 80 }],
];
for (const [name, color] of PARAM_CASES) {
  const out = render(specWith({ color }), `color_${name}`);
  const s = frameSum(out);
  const diff = Math.abs(s - baseSum);
  ok(`${name}: pixel đổi (diff=${diff})`, diff > 1000, `sum=${s} vs base=${baseSum}`);
}

// ---- D. color + LUT cùng lúc ----
console.log("== D. Render thật: color + LUT ==");
{
  const out = render(specWith({ color: { brightness: 30, temperature: 50 }, lut: "vcut-cyberpunk" }), "color_lut");
  const s = frameSum(out);
  const lutOnly = render(specWith({ lut: "vcut-cyberpunk" }), "lut_only");
  const sLut = frameSum(lutOnly);
  ok("color+LUT render OK, khác LUT-only", Math.abs(s - sLut) > 1000, `sum=${s} vs lut=${sLut}`);
  ok("color+LUT khác baseline", Math.abs(s - baseSum) > 1000);
}

// ---- E. validate.js từ chối color sai ----
console.log("== E. validate.js từ chối color sai ==");
{
  const validate = require("./src/validate");
  const bad1 = specWith({ color: { brightness: 101 } });
  const bad2 = specWith({ color: { contrast: "cao" } });
  const bad3 = specWith({ color: { xyz: 1 } });
  const good = specWith({ color: { brightness: 50, tint: -20 } });
  const r1 = validate.validateSpec(bad1);
  const r2 = validate.validateSpec(bad2);
  const r3 = validate.validateSpec(bad3);
  const rGood = validate.validateSpec(good);
  const e1 = r1.errors.join(" | "), e2 = r2.errors.join(" | "), e3 = r3.errors.join(" | ");
  ok("brightness=101 → từ chối", !r1.ok && /-100\.\.100/.test(e1), e1.slice(0, 100));
  ok("contrast='cao' → từ chối", !r2.ok && /phải là số/.test(e2), e2.slice(0, 100));
  ok("key lạ → từ chối", !r3.ok && /không được hỗ trợ/.test(e3), e3.slice(0, 100));
  ok("color hợp lệ → pass", rGood.ok, rGood.errors.join(" | ").slice(0, 100));
}

console.log(`\n==========================================\n🎉 COLOR TEST: ${pass} pass, ${fail} fail\n==========================================`);
process.exit(fail > 0 ? 1 : 0);
