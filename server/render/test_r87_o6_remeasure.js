#!/usr/bin/env node
/**
 * test_r87_o6_remeasure.js — Đo lại sau khi sửa lỗi parser của measure.py
 * (harness chính đã render xong nhưng parser cũ nuốt kết quả đo).
 *
 * - Chạy lại toàn bộ A (unit) + B (validator) — nhanh, không render.
 * - Đo lại C1/C2/C3/C4/C5 từ các file mp4 đã render trong WORK cũ
 *   (/tmp/vcut-r87-o6-s6TUQA) — đo là xác định (ffmpeg + PIL), render
 *   không đổi nên không cần render lại.
 * - C6 MỚI: mask+track+transitionOut (fade) ở mode trackgeq — kiểm tra
 *   claim "track bị bỏ qua khi dính transition" (validator warning + UI
 *   O5 state "transition"): nếu tâm mask vẫn bám track qua transition thì
 *   claim đó SAI với mask (mask áp ở unit stage, trước xfade).
 *
 * Dùng: node server/render/test_r87_o6_remeasure.js [WORK_DIR]
 * Mặc định WORK_DIR=/tmp/vcut-r87-o6-s6TUQA.
 * Mã thoát: 0 = mọi kiểm tra PASS; 1 = có FAIL.
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../eperm-retry.cjs"); // Đợt 87 closing: nối cùng mẫu O10
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname);
const WORK = process.argv[2] || "/tmp/vcut-r87-o6-s6TUQA";
const PY = path.join(ROOT, "test_r87_o6_measure.py");
const O7DIR = "/tmp/vcut-r87-o7-wct3Fb";
const RENDER_JS = path.join(ROOT, "src", "render.js");

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ""}`); }
  else { fail++; failures.push(name); console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`); }
}
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function measure(args) {
  const r = run("python3", [PY, ...args]);
  if (r.status !== 0) throw new Error(`measure fail (${args.join(" ")}): ${r.stderr}`);
  const out = {};
  for (const line of r.stdout.trim().split("\n")) {
    for (const tok of line.trim().split(/\s+/)) {
      const m = /^([a-zA-Z0-9_.]+)=(\S+)$/.exec(tok);
      if (m) out[m[1]] = m[2];
    }
  }
  return out;
}
function frameAt(video, t, out) {
  const r = run("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", video, "-frames:v", "1", out]);
  if (r.status !== 0) throw new Error(`frameAt fail: ${r.stderr}`);
}
function sample(video, t, points) {
  const res = measure(["px", video, String(t), ...points]);
  const out = {};
  for (const [k, v] of Object.entries(res)) {
    const m = /^px_([\d.]+)_([\d.]+)$/.exec(k);
    if (m) out[`${m[1]},${m[2]}`] = v.split(",").map(Number);
  }
  return out;
}
function scanCenter(video, t, y = 0.5, mode = "vis") {
  const res = measure(["scan", video, String(t), String(y), mode]);
  if (res.center === "none" || res.center === undefined) return null;
  return { x0: Number(res.run_x0), x1: Number(res.run_x1), center: Number(res.center), width: Number(res.width) };
}
function isRed(px) { return px && px[0] > 180 && px[1] < 80 && px[2] < 80; }
function isBlue(px) { return px && px[2] > 180 && px[0] < 80 && px[1] < 80; }
function isBlack(px) { return px && px[0] < 40 && px[1] < 40 && px[2] < 40; }
function probeDuration(video) {
  const r = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]);
  return r.status === 0 ? Number(r.stdout.trim()) : NaN;
}

const TRACK_LINEAR = { points: [{ t: 0, x: 0.2, y: 0.5 }, { t: 4, x: 0.8, y: 0.5 }] };
const MASK_ELLIPSE = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
const EXPECT_CENTER = { 0.5: 0.275, 2.0: 0.5, 3.5: 0.725 };

async function main() {
  console.log(`WORK=${WORK}`);
  for (const f of ["c1-trackgeq-s0.mp4", "c2-trackgeq-s1.mp4", "c3-png-s0.mp4", "c4-b1-png.mp4", "c4-b2-geq.mp4", "c4-b3-kf.mp4", "c5-video-track.mp4", "c5-sticker-track.mp4"]) {
    if (!fs.existsSync(path.join(WORK, f))) throw new Error(`thiếu render cũ: ${f}`);
  }
  const maskCjs = require("./src/mask");
  const { validateSpec } = require("./src/validate");

  // ================= A. Unit (chạy lại) =================
  console.log("== A. Unit: hình học mask bám track (chạy lại) ==");
  const { maskGeometryAt, maskGeometryAtTrack, interpolateTrackPoints, buildMaskTrackGeqExpr, buildMaskTrackGeqChain } = maskCjs;
  const base = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
  for (const t of [-1, 0, 1.3, 5]) {
    ok(`A1a no-track t=${t} == maskGeometryAt`, JSON.stringify(maskGeometryAtTrack(base, undefined, t)) === JSON.stringify(maskGeometryAt(base, t)));
  }
  ok("A1a null-track == maskGeometryAt", JSON.stringify(maskGeometryAtTrack(base, null, 1)) === JSON.stringify(maskGeometryAt(base, 1)));
  ok("A1a empty-points == maskGeometryAt", JSON.stringify(maskGeometryAtTrack(base, { points: [] }, 1)) === JSON.stringify(maskGeometryAt(base, 1)));
  for (const [t, ex] of [[-1, 0.2], [0, 0.2], [1, 0.35], [2, 0.5], [3, 0.65], [4, 0.8], [5, 0.8], [10, 0.8]]) {
    const g = maskGeometryAtTrack(base, TRACK_LINEAR, t);
    ok(`A1b track t=${t} x=${ex}`, Math.abs(g.x - ex) < 1e-9 && Math.abs(g.y - 0.5) < 1e-9, `x=${g.x}`);
  }
  const one = { points: [{ t: 0, x: 0.3, y: 0.7 }] };
  ok("A1c 1 điểm hằng số", [0, 2, 9].every((t) => { const g = maskGeometryAtTrack(base, one, t); return g.x === 0.3 && g.y === 0.7; }));
  const kf = {
    shape: "rect", x: 0.1, y: 0.5, w: 0.3, h: 0.5, feather: 0.2, invert: true,
    keyframes: [
      { t: 0, x: 0.1, y: 0.5, w: 0.3, h: 0.5 },
      { t: 4, x: 0.9, y: 0.5, w: 0.5, h: 0.5 },
    ],
  };
  const g2 = maskGeometryAtTrack(kf, TRACK_LINEAR, 2);
  ok("A2 keyframes+track: x từ track (0.5), w từ keyframes (0.4)",
    Math.abs(g2.x - 0.5) < 1e-9 && Math.abs(g2.w - 0.4) < 1e-9, `x=${g2.x} w=${g2.w}`);
  ok("A2 keyframes+track: shape/feather/invert giữ, keyframes bị bỏ",
    g2.shape === "rect" && g2.feather === 0.2 && g2.invert === true && !("keyframes" in g2));
  try {
    const esm = await import(pathToFileURL(path.join(__dirname, "..", "..", "packages", "video-spec", "src", "mask.js")).href);
    const esmTrack = await import(pathToFileURL(path.join(__dirname, "..", "..", "packages", "video-spec", "src", "tracking.js")).href);
    let mirrorOk = typeof esm.maskGeometryAtTrack === "function" && typeof esmTrack.interpolateTrack === "function";
    if (mirrorOk) {
      for (const m of [base, kf]) {
        for (const t of [-1, 0, 0.5, 1, 2, 3.5, 4, 5, 10]) {
          const a = JSON.stringify(maskGeometryAtTrack(m, TRACK_LINEAR, t));
          const b = JSON.stringify(esm.maskGeometryAtTrack(m, TRACK_LINEAR, t));
          if (a !== b) { mirrorOk = false; console.log(`    lệch mirror t=${t}: CJS=${a} ESM=${b}`); }
        }
      }
      for (const t of [-1, 0, 0.5, 1, 2, 3.5, 4, 5]) {
        const a = JSON.stringify(interpolateTrackPoints(TRACK_LINEAR.points, t));
        const b = JSON.stringify(esmTrack.interpolateTrack(TRACK_LINEAR.points, t));
        if (a !== b) { mirrorOk = false; console.log(`    lệch interpolateTrack t=${t}: CJS=${a} ESM=${b}`); }
      }
    }
    ok("A3 cross-mirror CJS == ESM (maskGeometryAtTrack + interpolateTrack)", mirrorOk);
  } catch (e) {
    ok("A3 cross-mirror CJS == ESM", false, `import ESM fail: ${e.message}`);
  }
  const e2 = buildMaskTrackGeqExpr(MASK_ELLIPSE, TRACK_LINEAR, 1280, 720);
  ok("A4a geq động chứa T + if(lt(T", e2.includes("T") && e2.includes("if(lt(T"));
  ok("A4b trục y hằng → cy là hằng số (720*0.5)", e2.includes("(720*(0.5))"));
  ok("A4c ellipse chứa sqrt", e2.includes("sqrt("));
  const e1 = buildMaskTrackGeqExpr(MASK_ELLIPSE, { points: [{ t: 0, x: 0.3, y: 0.7 }] }, 640, 360);
  ok("A4d track 1 điểm → không có T", !e1.includes("T"));
  ok("A4e rect nửa rộng 192px trên 1280", (() => {
    const er = buildMaskTrackGeqExpr({ shape: "rect", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 }, TRACK_LINEAR, 1280, 720);
    return er.includes("-192)") && er.includes("+192)");
  })());
  assert.throws(() => buildMaskTrackGeqExpr(MASK_ELLIPSE, { points: [] }, 1280, 720), /track không hợp lệ/);
  ok("A4f track rỗng → throw", true);
  assert.throws(() => buildMaskTrackGeqExpr({ ...MASK_ELLIPSE, w: 0 }, TRACK_LINEAR, 1280, 720), /số > 0/);
  ok("A4g mask sai (w=0) → throw", true);
  let n = 0; const lbl = (p) => `${p}${n++}`;
  const ch = buildMaskTrackGeqChain("[cv0]", MASK_ELLIPSE, TRACK_LINEAR, 1280, 720, lbl);
  ok("A5 chain 3 entry + geq + alphamerge", ch.entries.length === 3 && ch.entries[1].includes("geq=lum=") && ch.entries[2].includes("alphamerge"));

  // ================= B. Validator (chạy lại) =================
  console.log("== B. Validator: validateSpec combo mask+track (chạy lại) ==");
  const vidSpec = (clipExtra, kind = "video") => ({
    version: "0.2.0",
    meta: { name: "t", width: 1280, height: 720, fps: 30 },
    tracks: [{ kind, id: "v1", clips: [{
      kind, id: "c1", src: "SRC", start: 0, duration: 4, in: 0, out: 4,
      sourceAudioMode: "mute", ...clipExtra,
    }] }],
  });
  {
    const v = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: TRACK_LINEAR }));
    ok("B1 mask+track hợp lệ → ok, 0 error", v.ok && v.errors.length === 0, `warnings=${JSON.stringify(v.warnings)}`);
  }
  {
    const v = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: { points: [] } }));
    ok("B2a track rỗng → lỗi, nhắc track", !v.ok && v.errors.some((e) => e.includes("track")), JSON.stringify(v.errors));
  }
  {
    const v = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: { points: [{ t: 2, x: 0.2, y: 0.5 }, { t: 1, x: 0.8, y: 0.5 }] } }));
    ok("B2b t không tăng → lỗi", !v.ok, JSON.stringify(v.errors));
  }
  {
    const v = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: { points: [{ t: 0, x: 1.5, y: 0.5 }] } }));
    ok("B2c x>1 → lỗi", !v.ok, JSON.stringify(v.errors));
  }
  {
    const many = Array.from({ length: 241 }, (_, i) => ({ t: i * 0.01, x: 0.5, y: 0.5 }));
    const v = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: { points: many } }));
    ok("B2d 241 điểm → lỗi (>240)", !v.ok, JSON.stringify(v.errors));
  }
  {
    const s = {
      version: "0.2.0", meta: { name: "t", width: 1280, height: 720, fps: 30 },
      tracks: [{ kind: "text", id: "t1", clips: [{
        kind: "text", id: "tx", text: "hi", start: 0, duration: 4,
        style: { fontSize: 24, fontFamily: "Arial", color: "#FFFFFF", animation: "none" },
        mask: MASK_ELLIPSE, track: TRACK_LINEAR,
      }] }],
    };
    const v = validateSpec(s);
    ok("B3 text+mask+track → ok (không error), có warning mask",
      v.ok && v.warnings.some((w) => w.includes("mask")), `warnings=${JSON.stringify(v.warnings)}`);
  }
  {
    const kfMask = { ...MASK_ELLIPSE, keyframes: [{ t: 0, x: 0.2, y: 0.5, w: 0.3, h: 0.4 }, { t: 4, x: 0.8, y: 0.5, w: 0.3, h: 0.4 }] };
    const v = validateSpec(vidSpec({ mask: kfMask, track: TRACK_LINEAR }));
    ok("B4 mask+keyframes+track → ok (validate cho phép combo)", v.ok, JSON.stringify(v.errors));
  }
  {
    const v = validateSpec(vidSpec({ mask: MASK_ELLIPSE, track: TRACK_LINEAR, transitionIn: { type: "fade", duration: 0.5 } }));
    console.log(`  ℹ️  B5 mask+track+transition: ok=${v.ok} warnings=${JSON.stringify(v.warnings)}`);
    ok("B5 mask+track+transition → ok (warning D3 ghi nhận riêng, xem C6)", v.ok);
  }

  // ================= C. Đo lại từ render đã có =================
  console.log("== C1. Đo lại trackgeq start=0 (render 05:56) ==");
  {
    const out = path.join(WORK, "c1-trackgeq-s0.mp4");
    for (const [t, ex] of Object.entries(EXPECT_CENTER)) {
      const sc = scanCenter(out, Number(t));
      ok(`C1 tâm mask t=${t} ≈ ${ex} (±0.03)`, sc !== null && Math.abs(sc.center - ex) <= 0.03,
        sc ? `đo center=${sc.center} run=[${sc.x0},${sc.x1}] width=${sc.width}` : "không tìm thấy vệt sáng");
    }
    const p05 = sample(out, 0.5, ["0.2,0.5", "0.8,0.5"]);
    const p35 = sample(out, 3.5, ["0.2,0.5", "0.8,0.5"]);
    ok("C1 video đứng yên: (0.2,0.5) đỏ@0.5 → đen@3.5", isRed(p05["0.2,0.5"]) && isBlack(p35["0.2,0.5"]),
      `${JSON.stringify(p05["0.2,0.5"])} / ${JSON.stringify(p35["0.2,0.5"])}`);
    ok("C1 video đứng yên: (0.8,0.5) đen@0.5 → xanh@3.5", isBlack(p05["0.8,0.5"]) && isBlue(p35["0.8,0.5"]),
      `${JSON.stringify(p05["0.8,0.5"])} / ${JSON.stringify(p35["0.8,0.5"])}`);
  }
  console.log("== C2. Đo lại trackgeq start=1.0 ==");
  {
    const out = path.join(WORK, "c2-trackgeq-s1.mp4");
    for (const [lt, ex] of Object.entries(EXPECT_CENTER)) {
      const tt = Number(lt) + 1;
      const sc = scanCenter(out, tt);
      ok(`C2 tâm mask timeline t=${tt} (local ${lt}) ≈ ${ex} — T là local`,
        sc !== null && Math.abs(sc.center - ex) <= 0.03,
        sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
    }
  }
  console.log("== C3. Đo lại png mặc định (kỳ vọng tĩnh) ==");
  {
    const out = path.join(WORK, "c3-png-s0.mp4");
    let allStatic = true;
    for (const t of [0.5, 2.0, 3.5]) {
      const sc = scanCenter(out, t);
      const isStatic = sc !== null && Math.abs(sc.center - 0.5) <= 0.03;
      if (!isStatic) allStatic = false;
      console.log(`  ℹ️  C3 t=${t}: đo center=${sc ? sc.center : "none"} (kỳ vọng tĩnh 0.5)`);
    }
    ok("C3 mask TĨNH ở 0.5 mọi thời điểm (track chưa nối ở mode png)", allStatic);
  }
  console.log("== C4. Đo lại hồi quy vs O7 pre-change ==");
  {
    const cmp = (refPng, newMp4, label) => {
      const f = path.join(WORK, `${label}-remeasure.png`);
      frameAt(newMp4, 2.5, f);
      const res = measure(["mad", refPng, f]);
      const mean = Number(res.mean), pct = Number(res.pctGt8);
      ok(`${label}: MAD vs O7 pre-change mean<1, pctGt8<2%`, mean < 1 && pct < 2, `mean=${mean} max=${res.max} pctGt8=${pct}%`);
    };
    cmp(path.join(O7DIR, "b1-1-t2.5.png"), path.join(WORK, "c4-b1-png.mp4"), "C4a B1-png");
    cmp(path.join(O7DIR, "b2-1-t2.5.png"), path.join(WORK, "c4-b2-geq.mp4"), "C4b B2-geq");
    cmp(path.join(O7DIR, "b3-1-t2.5.png"), path.join(WORK, "c4-b3-kf.mp4"), "C4c B3-keyframes");
  }
  console.log("== C5. Đo lại hồi quy track D3 ==");
  {
    const f05 = path.join(WORK, "c5a-t05.png"), f35 = path.join(WORK, "c5a-t35.png");
    const res = measure(["mad", f05, f35]);
    ok("C5a D3 shift còn hoạt động (frame@0.5 khác xa @3.5)", Number(res.mean) > 5, `mean=${res.mean} max=${res.max} pctGt8=${res.pctGt8}%`);
    const out = path.join(WORK, "c5-sticker-track.mp4");
    for (const [t, ex] of Object.entries(EXPECT_CENTER)) {
      const sc = scanCenter(out, Number(t), 0.5, "red");
      ok(`C5b tâm sticker t=${t} ≈ ${ex} (±0.04)`, sc !== null && Math.abs(sc.center - ex) <= 0.04,
        sc ? `đo center=${sc.center} width=${sc.width}` : "không tìm thấy vệt đỏ");
    }
  }

  // ================= C6. MỚI: mask+track+transition, trackgeq =================
  console.log("== C6. MỚI: mask+track+transitionOut fade, trackgeq ==");
  {
    const spec = {
      version: "0.2.0", meta: { name: "r87-o6-c6", width: 1280, height: 720, fps: 30 },
      tracks: [{ kind: "video", id: "v1", clips: [
        {
          kind: "video", id: "c1", src: "split.mp4", start: 0, duration: 4,
          in: 0, out: 4, sourceAudioMode: "mute",
          mask: MASK_ELLIPSE, track: TRACK_LINEAR,
          transitionOut: { type: "fade", duration: 0.5 },
        },
        {
          kind: "video", id: "c2", src: "blue.mp4", start: 4, duration: 4,
          in: 0, out: 4, sourceAudioMode: "mute",
        },
      ] }],
    };
    const specPath = path.join(WORK, "c6-trackgeq-trans.json");
    writeFileEpermRetry(specPath, JSON.stringify(spec), { label: "test-r87-o6-remeasure-spec" });
    const out = path.join(WORK, "c6-trackgeq-trans.mp4");
    const t0 = Date.now();
    const r = run("node", [RENDER_JS, "--spec", specPath, "--out", out,
      "--media-dir", WORK, "-y", "--crf", "23", "--x264-preset", "veryfast",
      "--mask-mode", "trackgeq"], { cwd: ROOT, timeout: 1800000 });
    const secs = (Date.now() - t0) / 1000;
    ok("C6 render trackgeq + transition thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  C6 wall ${secs.toFixed(1)}s, duration=${probeDuration(out)}`);
    if (r.status === 0) {
      // Đo trước vùng fade (3.5–4.0): kỳ vọng local 0.275 / 0.5 / 0.65
      for (const [t, ex] of [[0.5, 0.275], [2.0, 0.5], [3.0, 0.65]]) {
        const sc = scanCenter(out, t);
        ok(`C6 tâm mask t=${t} ≈ ${ex} (±0.03) — mask vẫn bám track qua transition`,
          sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
      }
    }
  }

  console.log(`\n== KẾT QUẢ O6 (đo lại + C6): ${pass} pass, ${fail} fail (WORK=${WORK}) ==`);
  if (fail > 0) console.log(`FAIL: ${failures.join(" | ")}`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((e) => { console.error(`REMEASURE LỖI: ${e.stack}`); process.exit(3); });
