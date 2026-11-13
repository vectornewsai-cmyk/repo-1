#!/usr/bin/env node
/**
 * test_r87_o6_final.js — Vòng kiểm chứng cuối đợt 87 O6 (sau khi O2 lên đĩa
 * 06:05 UTC, render.js đổi sau các render C1–C5).
 *
 * - C7: png mặc định + track + mask, render LẠI bằng code hiện tại:
 *   tâm mask phải bám track (0.275/0.5/0.725) VÀ video đứng yên — phân
 *   biệt với hành vi pre-O2 (mask cưỡi shift D3: ranh đỏ/xanh dịch theo).
 *   Điểm phân biệt: px (0.4,0.5)@0.5 phải ĐỎ (pre-O2: xanh), px
 *   (0.6,0.5)@3.5 phải XANH (pre-O2: đỏ).
 * - C7b: trackgeq render LẠI bằng code hiện tại (O2 không được làm hỏng
 *   đường trackgeq): tâm + video đứng yên như C1.
 * - C8: mode geq thường + mask x=0.3 (≠0.5) + track: theo chú thích O2,
 *   mask tĩnh cưỡi shift D3 nên tâm cuối = 0.3±0.225 (0.075/0.525) — lệch
 *   khỏi quỹ đạo (0.275/0.725). Đo để ghi rõ giới hạn mode geq.
 * - D2: chạy lại test_round87_o2_mask_track.js (test của O2) + suite cũ
 *   (mask_p4, d4, self-test) trên code hiện tại.
 *
 * Dùng: node server/render/test_r87_o6_final.js
 * Mã thoát: 0 = mọi kiểm tra PASS (trừ C8 — C8 là đo giới hạn, PASS khi đo
 * đúng dự đoán lệch); 1 = có FAIL.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../eperm-retry.cjs"); // Đợt 87 closing: nối cùng mẫu O10

const ROOT = path.join(__dirname);
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r87-o6f-"));
const PY = path.join(ROOT, "test_r87_o6_measure.py");
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
function sh(cmd) {
  const r = run("bash", ["-c", cmd]);
  if (r.status !== 0) throw new Error(`lệnh fail: ${cmd}\n${r.stderr}`);
  return r.stdout;
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
function render(specObj, outName, maskMode) {
  const specPath = path.join(WORK, `${outName}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(specObj), { label: "test-r87-o6-final-spec" });
  const out = path.join(WORK, `${outName}.mp4`);
  const t0 = Date.now();
  const r = run("node", [RENDER_JS, "--spec", specPath, "--out", out,
    "--media-dir", WORK, "-y", "--crf", "23", "--x264-preset", "veryfast",
    "--mask-mode", maskMode || "png"], { cwd: ROOT, timeout: 1800000 });
  return { r, out, secs: (Date.now() - t0) / 1000 };
}

const TRACK_LINEAR = { points: [{ t: 0, x: 0.2, y: 0.5 }, { t: 4, x: 0.8, y: 0.5 }] };
const MASK_ELLIPSE = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
const EXPECT_CENTER = { 0.5: 0.275, 2.0: 0.5, 3.5: 0.725 };

function main() {
  console.log(`WORK=${WORK}`);
  sh(`ffmpeg -v error -y -f lavfi -i "color=c=0xFF0000:s=640x720:d=5:r=30" -f lavfi -i "color=c=0x0000FF:s=640x720:d=5:r=30" -filter_complex "[0:v][1:v]hstack" -c:v libx264 -pix_fmt yuv420p -an ${WORK}/split.mp4`);
  const spec = (mask, mode) => ({
    version: "0.2.0", meta: { name: "r87-o6-final", width: 1280, height: 720, fps: 30 },
    tracks: [{ kind: "video", id: "v1", clips: [{
      kind: "video", id: "c1", src: "split.mp4", start: 0, duration: 4,
      in: 0, out: 4, sourceAudioMode: "mute", mask, track: TRACK_LINEAR,
    }] }],
  });

  // C7: png hiện tại (sau O2)
  console.log("== C7. png mặc định + track + mask (code hiện tại, sau O2) ==");
  {
    const { r, out, secs } = render(spec(MASK_ELLIPSE), "c7-png-tracked", "png");
    ok("C7 render png thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  C7 wall ${secs.toFixed(1)}s = ${(120 / secs).toFixed(2)} fps`);
    if (r.status === 0) {
      for (const [t, ex] of Object.entries(EXPECT_CENTER)) {
        const sc = scanCenter(out, Number(t));
        ok(`C7 tâm mask t=${t} ≈ ${ex} (±0.03)`, sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
      }
      const p05 = sample(out, 0.5, ["0.4,0.5", "0.2,0.5"]);
      const p35 = sample(out, 3.5, ["0.6,0.5", "0.8,0.5"]);
      ok("C7 video đứng yên: (0.4,0.5)@0.5 ĐỎ (pre-O2 cưỡi shift: xanh)", isRed(p05["0.4,0.5"]), JSON.stringify(p05["0.4,0.5"]));
      ok("C7 video đứng yên: (0.6,0.5)@3.5 XANH (pre-O2 cưỡi shift: đỏ)", isBlue(p35["0.6,0.5"]), JSON.stringify(p35["0.6,0.5"]));
      ok("C7 (0.2,0.5)@0.5 đỏ, (0.8,0.5)@3.5 xanh", isRed(p05["0.2,0.5"]) && isBlue(p35["0.8,0.5"]),
        `${JSON.stringify(p05["0.2,0.5"])} / ${JSON.stringify(p35["0.8,0.5"])}`);
    }
  }

  // C7b: trackgeq render lại bằng code hiện tại
  console.log("== C7b. trackgeq render lại (code hiện tại) ==");
  {
    const { r, out, secs } = render(spec(MASK_ELLIPSE), "c7b-trackgeq", "trackgeq");
    ok("C7b render trackgeq thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  C7b wall ${secs.toFixed(1)}s = ${(120 / secs).toFixed(2)} fps`);
    if (r.status === 0) {
      for (const [t, ex] of Object.entries(EXPECT_CENTER)) {
        const sc = scanCenter(out, Number(t));
        ok(`C7b tâm mask t=${t} ≈ ${ex} (±0.03)`, sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
      }
      const p05 = sample(out, 0.5, ["0.4,0.5"]);
      const p35 = sample(out, 3.5, ["0.6,0.5"]);
      ok("C7b video đứng yên (0.4,0.5)@0.5 đỏ, (0.6,0.5)@3.5 xanh",
        isRed(p05["0.4,0.5"]) && isBlue(p35["0.6,0.5"]),
        `${JSON.stringify(p05["0.4,0.5"])} / ${JSON.stringify(p35["0.6,0.5"])}`);
    }
  }

  // C8: geq thường + mask x=0.3 + track → đo giới hạn
  console.log("== C8. mode geq thường + mask x=0.3 + track (đo giới hạn) ==");
  {
    const maskOff = { shape: "ellipse", x: 0.3, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
    const { r, out, secs } = render(spec(maskOff), "c8-geq-offcenter", "geq");
    ok("C8 render geq thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  C8 wall ${secs.toFixed(1)}s = ${(120 / secs).toFixed(2)} fps`);
    if (r.status === 0) {
      // Dự đoán theo chú thích O2 (mask tĩnh cưỡi shift D3): tâm = 0.3 + (track-0.5)
      for (const [t, ex] of [[0.5, 0.075], [2.0, 0.3], [3.5, 0.525]]) {
        const sc = scanCenter(out, t);
        ok(`C8 tâm mask t=${t} ≈ ${ex} (±0.03) — lệch khỏi quỹ đạo như O2 đã ghi`,
          sc !== null && Math.abs(sc.center - ex) <= 0.03,
          sc ? `đo center=${sc.center} (quỹ đạo tại t=${t} là ${EXPECT_CENTER[String(t)] ?? "?"})` : "không tìm thấy vệt sáng");
      }
    }
  }

  // D2: test của O2 + suite cũ trên code hiện tại
  console.log("== D2. Test của O2 + suite cũ (code hiện tại) ==");
  {
    const r = run("node", [path.join(ROOT, "test_round87_o2_mask_track.js")], { cwd: ROOT, timeout: 900000 });
    const m = /(\d+) pass, (\d+) fail/.exec(r.stdout || "");
    console.log(`  ℹ️  O2 test stdout cuối: ${(r.stdout || "").trim().split("\n").slice(-3).join(" | ")}`);
    ok("D2a test_round87_o2_mask_track.js 0 fail", !!m && m[2] === "0", m ? `${m[1]} pass, ${m[2]} fail` : (r.stdout.slice(-300) + r.stderr.slice(-300)));
  }
  {
    const r = run("node", [path.join(ROOT, "test_mask_p4.js")], { cwd: ROOT, timeout: 600000 });
    const m = /(\d+) pass, (\d+) fail/.exec(r.stdout || "");
    ok("D2b test_mask_p4 33/33", !!m && m[1] === "33" && m[2] === "0", m ? `${m[1]} pass, ${m[2]} fail` : r.stdout.slice(-200) + r.stderr.slice(-200));
  }
  {
    const r = run("node", [path.join(ROOT, "test_d4_mask_keyframes.js")], { cwd: ROOT, timeout: 600000 });
    const m = /(\d+) pass, (\d+) fail/.exec(r.stdout || "");
    ok("D2c test_d4_mask_keyframes 13/13", !!m && m[1] === "13" && m[2] === "0", m ? `${m[1]} pass, ${m[2]} fail` : r.stdout.slice(-200) + r.stderr.slice(-200));
  }
  for (const f of ["src/mask.js", "src/tracking.js", "src/sticker.js"]) {
    const r = run("node", [path.join(ROOT, f), "--self-test"], { cwd: ROOT });
    ok(`D2d self-test ${f}`, r.status === 0, (r.stdout || "").trim().slice(-80));
  }

  console.log(`\n== KẾT QUẢ O6 (vòng cuối): ${pass} pass, ${fail} fail (WORK=${WORK}) ==`);
  if (fail > 0) console.log(`FAIL: ${failures.join(" | ")}`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main();
