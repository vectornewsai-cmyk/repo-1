#!/usr/bin/env node
/**
 * test_karaoke_alpha74b9.js — Phase 9 đợt 74, luồng B9 (gap A1):
 * hex 8 ký tự #rrggbbaa cho template karaoke "Nền mờ" (#00000080).
 *
 * Bao phủ (không cần ffmpeg):
 *  (a) validateSpec THẬT: text clip karaoke với backgroundColor #00000080
 *      + highlightColor #00e5ff → KHÔNG lỗi màu; #0000008 (7 ký tự) và
 *      #gggggggg → lỗi (validator chỉ chấp nhận #rgb/#rrggbb/#rrggbbaa).
 *  (b) render_text_png.py THẬT: --bg #00000080 → pixel nền alpha đúng 128
 *      (trước đợt này code ép (255,) nên nền mờ vẽ thành đục); --bg
 *      #000000 (6 ký tự) → alpha 255 như cũ (không đổi hành vi cũ).
 *
 * Cách chạy: node server/render/src/test_karaoke_alpha74b9.js
 * (cần python3 + Pillow cho (b); thiếu Pillow thì (b) báo SKIP, không fail).
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { validateSpec } = require("./validate");

let pass = 0;
let fail = 0;
function ok(cond, label, extra) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(
      `  ✗ FAIL: ${label}${extra !== undefined ? ` (nhận: ${JSON.stringify(extra)})` : ""}`,
    );
  }
}

const base = () => ({
  version: "0.2.0",
  meta: { name: "t", width: 640, height: 360, fps: 30 },
  tracks: [],
});

function karaokeClip(bg, hi) {
  return {
    id: "c1",
    kind: "text",
    start: 0,
    duration: 2,
    text: "Xin chào",
    style: {
      fontFamily: "Inter",
      fontSize: 56,
      color: "#ffffff",
      backgroundColor: bg,
      highlightColor: hi,
      bold: true,
      italic: false,
      x: 0.5,
      y: 0.85,
      animation: "none",
    },
    karaoke: [
      { word: "Xin", start: 0, end: 0.4 },
      { word: "chào", start: 0.5, end: 0.9 },
    ],
  };
}

function specWithClip(clip) {
  const s = base();
  s.tracks = [{ id: "t", kind: "text", clips: [clip] }];
  return s;
}

// ---------------------------------------------------------------- (a) validator
console.log("== [a] validateSpec: hex 8 ký tự cho nền karaoke ==");
{
  const v = validateSpec(specWithClip(karaokeClip("#00000080", "#00e5ff")));
  const colorErrs = v.errors.filter((e) => /backgroundColor|highlightColor|color/i.test(e));
  ok(colorErrs.length === 0, "bg #00000080 + highlight #00e5ff: không lỗi màu", v.errors);
  ok(v.errors.length === 0, "spec karaoke nền mờ: 0 lỗi", v.errors);
}
{
  const v = validateSpec(specWithClip(karaokeClip("#0000008", "#00e5ff")));
  ok(
    v.errors.some((e) => e.includes("backgroundColor")),
    "bg #0000008 (7 ký tự): bị lỗi backgroundColor",
    v.errors,
  );
}
{
  const v = validateSpec(specWithClip(karaokeClip("#gggggggg", "#00e5ff")));
  ok(
    v.errors.some((e) => e.includes("backgroundColor")),
    "bg #gggggggg: bị lỗi backgroundColor",
    v.errors,
  );
}
{
  const v = validateSpec(specWithClip(karaokeClip("#000000", "#00e5ff")));
  ok(v.errors.length === 0, "bg #000000 (6 ký tự): vẫn 0 lỗi như cũ", v.errors);
}

// ---------------------------------------------------------------- (b) PNG text + alpha
console.log("== [b] render_text_png.py: --bg giữ alpha thật ==");
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "karaoke-alpha74b9-"));
  const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
  const readAlpha = (png) => {
    const r = spawnSync(
      "python3",
      ["-c", "import sys; from PIL import Image; im = Image.open(sys.argv[1]); print(im.getpixel((0, 0))[3])", png],
      { encoding: "utf8" },
    );
    if (r.status !== 0) return null;
    return Number((r.stdout || "").trim());
  };
  if (!fs.existsSync(font)) {
    console.log("  (bỏ qua: không có font DejaVuSans.ttf trên máy này)");
  } else {
    const cases = [
      { bg: "#00000080", expect: 128, label: "bg #00000080 → alpha 128" },
      { bg: "#000000", expect: 255, label: "bg #000000 → alpha 255 (hành vi cũ)" },
      { bg: "#ff000040", expect: 64, label: "bg #ff000040 → alpha 64" },
    ];
    for (const c of cases) {
      const out = path.join(tmp, `t-${c.expect}.png`);
      const r = spawnSync(
        "python3",
        [
          path.join(__dirname, "render_text_png.py"),
          "--font", font,
          "--size", "32",
          "--color", "#ffffff",
          "--text", "Hi",
          "--bg", c.bg,
          "--pad", "8",
          "--out", out,
        ],
        { encoding: "utf8" },
      );
      if (r.status !== 0) {
        ok(false, `${c.label} (render_text_png.py lỗi)`, (r.stderr || "").slice(-300));
        continue;
      }
      const a = readAlpha(out);
      ok(a === c.expect, c.label, a);
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

console.log(`\nkaraoke alpha 74 B9: ${pass} pass, ${fail} fail`);
process.exitCode = fail > 0 ? 1 : 0;
