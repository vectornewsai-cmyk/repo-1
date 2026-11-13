#!/usr/bin/env node
/**
 * test_r87_o6_mask_track_verify.js — KIỂM CHỨNG ĐỘC LẬP đợt 87: mask bám
 * motion track (luồng O6). Chạy: node server/render/test_r87_o6_mask_track_verify.js
 *
 * KHÔNG tin báo cáo luồng khác — tự chạy lại mọi thứ dưới đây:
 *   A. Unit: maskGeometryAtTrack (CJS mask.js + ESM video-spec mask.js,
 *      so khớp bit-for-bit), interpolateTrackPoints mirror, buildMaskTrackGeqExpr/Chain.
 *   B. Validator: validateSpec với combo mask+track (hợp lệ / sai / text / keyframes /
 *      transition) — ghi rõ error/warning thực tế.
 *   C. Render thật (tuần tự, 720p, clip ≤5s):
 *      C1 trackgeq, clip.start=0 — tâm mask đo được ở 3 thời điểm phải khớp
 *         quỹ đạo tuyến tính (±0.03); đồng thời video đứng yên (điểm đỏ/xanh
 *         đổi theo mask, không theo shift D3).
 *      C2 trackgeq, clip.start=1.0 — phân biệt T của geq là thời gian
 *         clip-local (kỳ vọng = C1) hay timeline (lệch +0.15/+0.15/+0.075).
 *      C3 mode png mặc định, cùng spec C1 — kỳ vọng TĨNH tại x=0.5 (O2 chưa
 *         lên đĩa: đường png chưa nối track; chỉ kiểm render thành công +
 *         không di chuyển ẩu, KHÔNG coi tĩnh là lỗi).
 *      C4 Hồi quy vs render TRƯỚC thay đổi của O7 (/tmp/vcut-r87-o7-wct3Fb,
 *         render lúc 05:47 UTC, trước khi O1/O3 sửa file 05:50): render lại
 *         đúng spec B1/B2/B3 của O7, so frame @2.5 bằng MAD (ngưỡng mean<1,
 *         pctGt8<2%). x264 có thể lệch rất nhỏ giữa 2 lần chạy nên ngưỡng
 *         không đặt = 0.
 *      C5 Hồi quy đường track cũ (D3): video có track không mask (default)
 *         vẫn shift theo quỹ đạo; sticker có track vẫn bám (đo tâm vệt đỏ).
 *   D. Chạy lại suite cũ: test_mask_p4.js, test_d4_mask_keyframes.js,
 *      self-test mask/tracking/sticker.
 *
 * Mã thoát: 0 = tính năng có mặt và mọi kiểm tra áp dụng được đều PASS;
 * 1 = có FAIL; 2 = tính năng chưa có trên đĩa (không có gì để kiểm — các
 * mục liên quan ghi SKIP, KHÔNG tuyên bố xanh).
 *
 * RAM: render tuần tự, 720p, mỗi lần ≤150 frame; geq 720p ~4-5 fps nên mỗi
 * render trackgeq ~30s. Tổng lượt chạy ~4-6 phút.
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../eperm-retry.cjs"); // Đợt 87 closing: nối nốt 2 dòng O10 để lại
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname);
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r87-o6-"));
const PY = path.join(ROOT, "test_r87_o6_measure.py");
const O7DIR = "/tmp/vcut-r87-o7-wct3Fb";
const O7MEDIA = path.join(O7DIR, "media", "clip720.mp4");

const RENDER_JS = path.join(ROOT, "src", "render.js");

let pass = 0, fail = 0, skip = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ""}`); }
  else { fail++; failures.push(name); console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`); }
}
function sk(name, reason) {
  skip++; console.log(`  ⏭️  SKIP ${name} — ${reason}`);
}
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function sh(cmd) {
  const r = run("bash", ["-c", cmd]);
  if (r.status !== 0) throw new Error(`lệnh fail: ${cmd}\n${r.stderr}`);
  return r.stdout;
}
/** Chạy measure.py, parse mọi token key=value (kể cả nhiều token 1 dòng,
 *  kể cả key chứa dấu chấm như px_0.2_0.5) thành object. */
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
function probeDuration(video) {
  const r = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]);
  return r.status === 0 ? Number(r.stdout.trim()) : NaN;
}
function render(specObj, outName, maskMode) {
  const specPath = path.join(WORK, `${outName}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(specObj), { label: "test-r87-o6-spec" });
  const out = path.join(WORK, `${outName}.mp4`);
  const t0 = Date.now();
  const r = run("node", [RENDER_JS, "--spec", specPath, "--out", out,
    "--media-dir", WORK, "-y", "--crf", "23", "--x264-preset", "veryfast",
    "--mask-mode", maskMode || "png"],
    { cwd: ROOT, timeout: 1800000 });
  const secs = (Date.now() - t0) / 1000;
  return { r, out, secs };
}
function isRed(px) { return px && px[0] > 180 && px[1] < 80 && px[2] < 80; }
function isBlue(px) { return px && px[2] > 180 && px[0] < 80 && px[1] < 80; }
function isBlack(px) { return px && px[0] < 40 && px[1] < 40 && px[2] < 40; }
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

const TRACK_LINEAR = { points: [{ t: 0, x: 0.2, y: 0.5 }, { t: 4, x: 0.8, y: 0.5 }] };
const MASK_ELLIPSE = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
const EXPECT_CENTER = { 0.5: 0.275, 2.0: 0.5, 3.5: 0.725 };

async function main() {
  console.log(`WORK=${WORK}`);
  const maskCjs = require("./src/mask");
  const { validateSpec } = require("./src/validate");

  // ---- Phát hiện tính năng: O1/O3 có trên đĩa không? ----
  const hasO1 = typeof maskCjs.maskGeometryAtTrack === "function";
  const hasO3 = typeof maskCjs.buildMaskTrackGeqChain === "function";
  console.log(`== Phát hiện: maskGeometryAtTrack (O1) = ${hasO1}, buildMaskTrackGeqChain (O3) = ${hasO3} ==`);
  if (!hasO1 && !hasO3) {
    console.log("Tính năng mask bám track CHƯA có trên đĩa — không có gì để kiểm ở mục A/C1/C2.");
  }

  // ================= A. Unit =================
  console.log("== A. Unit: hình học mask bám track ==");
  if (!hasO1) {
    sk("A1 maskGeometryAtTrack theo track", "O1 chưa lên đĩa");
    sk("A2 keyframes+track", "O1 chưa lên đĩa");
    sk("A3 cross-mirror CJS vs ESM", "O1 chưa lên đĩa");
  } else {
    const { maskGeometryAt, maskGeometryAtTrack, interpolateTrackPoints } = maskCjs;
    const base = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.4, feather: 0 };
    // A1a: không track → đúng maskGeometryAt
    for (const t of [-1, 0, 1.3, 5]) {
      ok(`A1a no-track t=${t} == maskGeometryAt`, JSON.stringify(maskGeometryAtTrack(base, undefined, t)) === JSON.stringify(maskGeometryAt(base, t)));
    }
    ok("A1a null-track == maskGeometryAt", JSON.stringify(maskGeometryAtTrack(base, null, 1)) === JSON.stringify(maskGeometryAt(base, 1)));
    ok("A1a empty-points == maskGeometryAt", JSON.stringify(maskGeometryAtTrack(base, { points: [] }, 1)) === JSON.stringify(maskGeometryAt(base, 1)));
    // A1b: track tuyến tính 0.2→0.8 trên 4s, clamp 2 đầu
    const cases = [[-1, 0.2], [0, 0.2], [1, 0.35], [2, 0.5], [3, 0.65], [4, 0.8], [5, 0.8], [10, 0.8]];
    for (const [t, ex] of cases) {
      const g = maskGeometryAtTrack(base, TRACK_LINEAR, t);
      ok(`A1b track t=${t} x=${ex}`, Math.abs(g.x - ex) < 1e-9 && Math.abs(g.y - 0.5) < 1e-9, `x=${g.x}`);
    }
    // A1c: 1 điểm → hằng số
    const one = { points: [{ t: 0, x: 0.3, y: 0.7 }] };
    ok("A1c 1 điểm hằng số", [0, 2, 9].every((t) => { const g = maskGeometryAtTrack(base, one, t); return g.x === 0.3 && g.y === 0.7; }));
    // A2: keyframes + track: w/h từ keyframes, x/y từ track, shape/feather/invert giữ
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
    // A3: cross-mirror CJS vs ESM (video-spec biên dịch)
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
  }

  if (!hasO3) {
    sk("A4 buildMaskTrackGeqExpr", "O3 chưa lên đĩa");
    sk("A5 buildMaskTrackGeqChain", "O3 chưa lên đĩa");
  } else {
    const { buildMaskTrackGeqExpr, buildMaskTrackGeqChain } = maskCjs;
    const e2 = buildMaskTrackGeqExpr(MASK_ELLIPSE, TRACK_LINEAR, 1280, 720);
    ok("A4a geq động chứa T + if(lt(T", e2.includes("T") && e2.includes("if(lt(T"));
    ok("A4b trục y hằng → cy là hằng số (720*0.5)", e2.includes("(720*(0.5))"), e2.slice(0, 120));
    ok("A4c ellipse chứa sqrt", e2.includes("sqrt("));
    const e1 = buildMaskTrackGeqExpr(MASK_ELLIPSE, { points: [{ t: 0, x: 0.3, y: 0.7 }] }, 640, 360);
    ok("A4d track 1 điểm → không có T", !e1.includes("T"), e1.slice(0, 100));
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
  }

  // ================= B. Validator =================
  console.log("== B. Validator: validateSpec combo mask+track ==");
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
    ok("B1 mask+track hợp lệ → ok, 0 error", v.ok && v.errors.length === 0, `errors=${JSON.stringify(v.errors)} warnings=${JSON.stringify(v.warnings)}`);
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
    ok("B5 mask+track+transition → ok (warning D3 ghi nhận riêng, xem LIMITS)", v.ok);
  }

  // ================= C. Render thật =================
  console.log("== C. Render thật (720p, tuần tự) — chuẩn bị media ==");
  sh(`ffmpeg -v error -y -f lavfi -i "color=c=0xFF0000:s=640x720:d=5:r=30" -f lavfi -i "color=c=0x0000FF:s=640x720:d=5:r=30" -filter_complex "[0:v][1:v]hstack" -c:v libx264 -pix_fmt yuv420p -an ${WORK}/split.mp4`);
  sh(`ffmpeg -v error -y -f lavfi -i "color=c=0x0000FF:s=1280x720:d=5:r=30" -c:v libx264 -pix_fmt yuv420p -an ${WORK}/blue.mp4`);
  sh(`ffmpeg -v error -y -f lavfi -i "color=c=0xFF0000:s=320x180" -frames:v 1 ${WORK}/red.png`);
  ok("media tạo xong", ["split.mp4", "blue.mp4", "red.png"].every((f) => fs.existsSync(path.join(WORK, f))));
  const o7mediaOk = fs.existsSync(O7MEDIA) && fs.existsSync(path.join(O7DIR, "b1-1-t2.5.png"));
  if (!o7mediaOk) sk("C4 hồi quy vs O7", "thiếu file tham chiếu O7 trong /tmp (đã bị dọn)");

  const trackedSpec = (start, extra = {}) => ({
    version: "0.2.0",
    meta: { name: "r87-o6", width: 1280, height: 720, fps: 30 },
    tracks: [{ kind: "video", id: "v1", clips: [{
      kind: "video", id: "c1", src: "split.mp4", start, duration: 4,
      in: 0, out: 4, sourceAudioMode: "mute",
      mask: MASK_ELLIPSE, track: TRACK_LINEAR, ...extra,
    }] }],
  });

  // C1: trackgeq, start=0
  console.log("== C1. trackgeq, clip.start=0 ==");
  {
    const { r, out, secs } = render(trackedSpec(0), "c1-trackgeq-s0", "trackgeq");
    ok("C1 render trackgeq thành công", r.status === 0, r.stderr.slice(-400));
    const dur = probeDuration(out);
    ok("C1 duration ≈ 4s", Math.abs(dur - 4) < 0.2, `dur=${dur}`);
    console.log(`  ℹ️  C1 wall ${secs.toFixed(1)}s = ${(120 / secs).toFixed(2)} fps (720p, geq động)`);
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

  // C2: trackgeq, start=1.0 — T local hay timeline?
  console.log("== C2. trackgeq, clip.start=1.0 (T local vs timeline) ==");
  {
    const spec = trackedSpec(1);
    spec.meta.name = "r87-o6-c2";
    const { r, out, secs } = render(spec, "c2-trackgeq-s1", "trackgeq");
    ok("C2 render trackgeq start=1 thành công", r.status === 0, r.stderr.slice(-400));
    const dur = probeDuration(out);
    ok("C2 duration ≈ 5s", Math.abs(dur - 5) < 0.2, `dur=${dur}`);
    console.log(`  ℹ️  C2 wall ${secs.toFixed(1)}s`);
    // timeline t = local + 1 → kỳ vọng local: 0.275/0.5/0.725 (nếu T timeline: 0.425/0.65/0.8)
    for (const [lt, ex] of Object.entries(EXPECT_CENTER)) {
      const tt = Number(lt) + 1;
      const sc = scanCenter(out, tt);
      ok(`C2 tâm mask timeline t=${tt} (local ${lt}) ≈ ${ex} — T là local`,
        sc !== null && Math.abs(sc.center - ex) <= 0.03,
        sc ? `đo center=${sc.center}` : "không tìm thấy vệt sáng");
    }
  }

  // C3: mode png mặc định — kỳ vọng TĨNH (O2 chưa lên đĩa)
  console.log("== C3. mode png mặc định, cùng spec C1 (kỳ vọng tĩnh — O2 chưa lên) ==");
  {
    const { r, out, secs } = render(trackedSpec(0), "c3-png-s0", "png");
    ok("C3 render png thành công", r.status === 0, r.stderr.slice(-400));
    console.log(`  ℹ️  C3 wall ${secs.toFixed(1)}s`);
    let allStatic = true;
    for (const t of [0.5, 2.0, 3.5]) {
      const sc = scanCenter(out, t);
      const isStatic = sc !== null && Math.abs(sc.center - 0.5) <= 0.03;
      if (!isStatic) allStatic = false;
      console.log(`  ℹ️  C3 t=${t}: đo center=${sc ? sc.center : "none"} (kỳ vọng tĩnh 0.5)`);
    }
    ok("C3 mask TĨNH ở 0.5 mọi thời điểm (track chưa nối ở mode png)", allStatic);
  }

  // C4: hồi quy vs O7 pre-change
  if (o7mediaOk) {
    console.log("== C4. Hồi quy vs render O7 trước thay đổi (05:47 UTC) ==");
    const o7spec = (maskExtra, name) => ({
      version: "0.2.0", meta: { name: "r87-o7", width: 1280, height: 720, fps: 30 },
      tracks: [{ id: "v0", kind: "video", clips: [{
        id: "c0", kind: "video", src: path.join(O7DIR, "media", "clip720.mp4"),
        start: 0, duration: 5, in: 0, out: 5, ...maskExtra,
      }] }],
    });
    // Render với --media-dir trỏ thẳng thư mục O7 để dùng đúng file media gốc.
    const renderO7 = (specObj, outName, maskMode) => {
      const specPath = path.join(WORK, `${outName}.json`);
      writeFileEpermRetry(specPath, JSON.stringify(specObj), { label: "test-r87-o6-spec" });
      const out = path.join(WORK, `${outName}.mp4`);
      const t0 = Date.now();
      const r = run("node", [RENDER_JS, "--spec", specPath, "--out", out,
        "--media-dir", path.join(O7DIR, "media"), "-y", "--crf", "23", "--x264-preset", "veryfast",
        "--mask-mode", maskMode], { cwd: ROOT, timeout: 1800000 });
      return { r, out, secs: (Date.now() - t0) / 1000 };
    };
    const MASK_STATIC = { shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 0.4, feather: 0.2 };
    const MASK_TRACKED_KF = {
      shape: "rect", x: 0.2, y: 0.5, w: 0.4, h: 0.4, feather: 0.2,
      keyframes: [
        { t: 0, x: 0.2, y: 0.5, w: 0.4, h: 0.4 },
        { t: 5, x: 0.8, y: 0.5, w: 0.4, h: 0.4 },
      ],
    };
    const cmp = (refPng, newMp4, label) => {
      const f = path.join(WORK, `${label}.png`);
      frameAt(newMp4, 2.5, f);
      const res = measure(["mad", refPng, f]);
      const mean = Number(res.mean), pct = Number(res.pctGt8);
      ok(`${label}: MAD vs O7 pre-change mean<1, pctGt8<2%`, mean < 1 && pct < 2, `mean=${mean} max=${res.max} pctGt8=${pct}%`);
    };
    {
      const { r, out, secs } = renderO7(o7spec({ mask: MASK_STATIC }), "c4-b1-png", "png");
      ok("C4a render lại B1 (png tĩnh) thành công", r.status === 0, r.stderr.slice(-300));
      console.log(`  ℹ️  C4a wall ${secs.toFixed(1)}s = ${(150 / secs).toFixed(2)} fps`);
      if (r.status === 0) cmp(path.join(O7DIR, "b1-1-t2.5.png"), out, "C4a B1-png");
    }
    {
      const { r, out, secs } = renderO7(o7spec({ mask: MASK_STATIC }), "c4-b2-geq", "geq");
      ok("C4b render lại B2 (geq tĩnh) thành công", r.status === 0, r.stderr.slice(-300));
      console.log(`  ℹ️  C4b wall ${secs.toFixed(1)}s = ${(150 / secs).toFixed(2)} fps`);
      if (r.status === 0) cmp(path.join(O7DIR, "b2-1-t2.5.png"), out, "C4b B2-geq");
    }
    {
      const { r, out, secs } = renderO7(o7spec({ mask: MASK_TRACKED_KF }), "c4-b3-kf", "png");
      ok("C4c render lại B3 (keyframes) thành công", r.status === 0, r.stderr.slice(-300));
      console.log(`  ℹ️  C4c wall ${secs.toFixed(1)}s = ${(150 / secs).toFixed(2)} fps`);
      if (r.status === 0) cmp(path.join(O7DIR, "b3-1-t2.5.png"), out, "C4c B3-keyframes");
    }
  }

  // C5: hồi quy đường track cũ (D3) — video track không mask + sticker track
  console.log("== C5. Hồi quy track D3 (video shift + sticker bám) ==");
  {
    const spec = {
      version: "0.2.0", meta: { name: "r87-o6-c5", width: 1280, height: 720, fps: 30 },
      tracks: [{ kind: "video", id: "v1", clips: [{
        kind: "video", id: "c1", src: "split.mp4", start: 0, duration: 4,
        in: 0, out: 4, sourceAudioMode: "mute", track: TRACK_LINEAR,
      }] }],
    };
    const { r, out } = render(spec, "c5-video-track", "png");
    ok("C5a video có track (không mask) render thành công", r.status === 0, r.stderr.slice(-400));
    if (r.status === 0) {
      const f05 = path.join(WORK, "c5a-t05.png"), f35 = path.join(WORK, "c5a-t35.png");
      frameAt(out, 0.5, f05); frameAt(out, 3.5, f35);
      const res = measure(["mad", f05, f35]);
      ok("C5a D3 shift còn hoạt động (frame@0.5 khác xa @3.5)", Number(res.mean) > 5, `mean=${res.mean}`);
    }
  }
  {
    const spec = {
      version: "0.2.0", meta: { name: "r87-o6-c5b", width: 1280, height: 720, fps: 30 },
      tracks: [
        { kind: "video", id: "v1", clips: [{ kind: "video", id: "c1", src: "blue.mp4", start: 0, duration: 4, in: 0, out: 4, sourceAudioMode: "mute" }] },
        { kind: "sticker", id: "s1", clips: [{ kind: "sticker", id: "st1", src: "red.png", start: 0, duration: 4, x: 0.5, y: 0.5, scale: 0.25, opacity: 1, rotation: 0, track: TRACK_LINEAR }] },
      ],
    };
    const { r, out } = render(spec, "c5-sticker-track", "png");
    ok("C5b sticker có track render thành công", r.status === 0, r.stderr.slice(-400));
    if (r.status === 0) {
      for (const [t, ex] of Object.entries(EXPECT_CENTER)) {
        const sc = scanCenter(out, Number(t), 0.5, "red");
        ok(`C5b tâm sticker t=${t} ≈ ${ex} (±0.04)`, sc !== null && Math.abs(sc.center - ex) <= 0.04,
          sc ? `đo center=${sc.center} width=${sc.width}` : "không tìm thấy vệt đỏ");
      }
    }
  }

  // ================= D. Suite cũ =================
  console.log("== D. Suite cũ ==");
  {
    const r = run("node", [path.join(ROOT, "test_mask_p4.js")], { cwd: ROOT, timeout: 600000 });
    const m = /(\d+) pass, (\d+) fail/.exec(r.stdout || "");
    ok("D1 test_mask_p4 33/33", !!m && m[1] === "33" && m[2] === "0", m ? `${m[1]} pass, ${m[2]} fail` : r.stdout.slice(-200) + r.stderr.slice(-200));
  }
  {
    const r = run("node", [path.join(ROOT, "test_d4_mask_keyframes.js")], { cwd: ROOT, timeout: 600000 });
    const m = /(\d+) pass, (\d+) fail/.exec(r.stdout || "");
    ok("D2 test_d4_mask_keyframes 13/13", !!m && m[1] === "13" && m[2] === "0", m ? `${m[1]} pass, ${m[2]} fail` : r.stdout.slice(-200) + r.stderr.slice(-200));
  }
  for (const f of ["src/mask.js", "src/tracking.js", "src/sticker.js"]) {
    const r = run("node", [path.join(ROOT, f), "--self-test"], { cwd: ROOT });
    ok(`D3 self-test ${f}`, r.status === 0, (r.stdout || "").trim().slice(-80));
  }

  console.log(`\n== KẾT QUẢ O6: ${pass} pass, ${fail} fail, ${skip} skip (WORK=${WORK}) ==`);
  if (fail > 0) console.log(`FAIL: ${failures.join(" | ")}`);
  process.exitCode = fail > 0 ? 1 : (!hasO1 && !hasO3 ? 2 : 0);
}

main().catch((e) => { console.error(`HARNESS LỖI: ${e.stack}`); process.exit(3); });
