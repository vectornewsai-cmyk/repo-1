#!/usr/bin/env node
/**
 * test_round77_e3_aifree_smoke.js — Phase 9 đợt 77, luồng E3.
 *
 * Kiểm chứng nhanh (không stress): harness hunt biên dịch được preload,
 * chuỗi filter SPLIT/COPY/NOCOPY chạy được trên ffmpeg thật, SPLIT và
 * COPY cho đúng sha ground truth d960996868d3… (pixel không đổi), và
 * helper Wilson trong file hunt tính đúng khoảng tin cậy.
 *
 * Cách chạy: node server/render/src/test_round77_e3_aifree_smoke.js
 * (~1,5 phút: 3 lần ffmpeg 1080p 5s + biên dịch preload).
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const {
  vfNocopy, vfCopy, vfSplit, wilson, GROUND_TRUTH_SHA_PREFIX,
} = require("./test_round77_e3_vidstab_aifree");

const HOME = process.env.HOME;
const WORK = path.join(HOME, "workspace", ".scratch-r77e3", "smoke");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const PRELOAD_C = path.join(__dirname, "segv_backtrace_preload.c");
const PRELOAD_SO = path.join(WORK, "segv_backtrace_preload.so");

let pass = 0;
function check(name, fn) {
  fn();
  pass++;
  console.log(`   ✅ ${name}`);
}

function runFfmpeg(tag, vf) {
  const out = path.join(WORK, `${tag}.framemd5`);
  const r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vf, "-an", "-f", "framemd5", "-y", out],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 300000,
      env: { ...process.env, LD_PRELOAD: PRELOAD_SO } });
  assert.strictEqual(r.signal, null, `${tag}: ffmpeg chết signal ${r.signal}: ${(r.stderr || "").toString().slice(-300)}`);
  assert.strictEqual(r.status, 0, `${tag}: ffmpeg exit ${r.status}: ${(r.stderr || "").toString().slice(-300)}`);
  assert.ok(fs.existsSync(out) && fs.statSync(out).size > 0, `${tag}: không có output framemd5`);
  return crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex").slice(0, 12);
}

function main() {
  console.log("== Đợt 77 E3 — smoke test (SPLIT/COPY/NOCOPY + preload + Wilson) ==");
  for (const p of [SRC1080, TRF1080, PRELOAD_C]) assert.ok(fs.existsSync(p), `thiếu file đầu vào: ${p}`);

  check("chuỗi filter SPLIT chứa split[a][b] + vidstabtransform + nullsink", () => {
    const vf = vfSplit(TRF1080);
    assert.ok(vf.includes("split[a][b]"), vf);
    assert.ok(vf.includes("[a]vidstabtransform="), vf);
    assert.ok(vf.includes("[b]nullsink"), vf);
    assert.ok(vf.includes("smoothing=10:optalgo=gauss"), vf);
  });
  check("chuỗi filter COPY giữ ',copy,vidstabtransform=' (production không đổi)", () => {
    assert.ok(vfCopy(TRF1080).includes(",copy,vidstabtransform="), vfCopy(TRF1080));
  });
  check("chuỗi filter NOCOPY không chứa copy/split", () => {
    assert.ok(!vfNocopy(TRF1080).includes("copy"), vfNocopy(TRF1080));
    assert.ok(!vfNocopy(TRF1080).includes("split"), vfNocopy(TRF1080));
  });
  check("Wilson: 0/15 → [0, ~0.20]; 7/16 → chứa 0.438", () => {
    const [lo0, hi0] = wilson(0, 15);
    assert.strictEqual(lo0, 0);
    assert.ok(hi0 > 0.15 && hi0 < 0.25, `wilson(0,15)=[${lo0},${hi0}]`);
    const [lo7, hi7] = wilson(7, 16);
    assert.ok(lo7 > 0.2 && lo7 < 0.3 && hi7 > 0.6 && hi7 < 0.7, `wilson(7,16)=[${lo7},${hi7}]`);
    const [lo4, hi4] = wilson(4, 105);
    assert.ok(Math.abs(lo4 - 0.015) < 0.003 && Math.abs(hi4 - 0.094) < 0.003,
      `wilson(4,105)=[${lo4},${hi4}] phải ≈ [0.015, 0.094] như B7`);
  });
  check("biên dịch preload segv_backtrace (gcc -Wall -Wextra, không warning)", () => {
    const cc = spawnSync("gcc", ["-shared", "-fPIC", "-O2", "-Wall", "-Wextra",
      "-o", PRELOAD_SO, PRELOAD_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
    assert.strictEqual(cc.status, 0, (cc.stderr || "").toString());
    assert.strictEqual((cc.stderr || "").toString().trim(), "", `gcc warning: ${(cc.stderr || "").toString()}`);
    assert.ok(fs.statSync(PRELOAD_SO).size > 0);
  });
  check("SPLIT ×1 dưới preload: sha khớp ground truth d960996868d3…", () => {
    const sha = runFfmpeg("split", vfSplit(TRF1080));
    assert.ok(sha.startsWith(GROUND_TRUTH_SHA_PREFIX), `SPLIT sha=${sha}`);
  });
  check("COPY ×1 dưới preload: sha khớp ground truth d960996868d3…", () => {
    const sha = runFfmpeg("copy", vfCopy(TRF1080));
    assert.ok(sha.startsWith(GROUND_TRUTH_SHA_PREFIX), `COPY sha=${sha}`);
  });
  check("NOCOPY ×1 dưới preload: chạy xong, không crash (không claim sha)", () => {
    runFfmpeg("nocopy", vfNocopy(TRF1080));
  });

  console.log(`✅ test_round77_e3_aifree_smoke: ${pass}/8 PASS`);
}

main();
