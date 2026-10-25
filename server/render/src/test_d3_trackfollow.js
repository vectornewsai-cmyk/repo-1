/**
 * test_d3_trackfollow.js — Test Phase 9 D3: clip TEXT và VIDEO bám quỹ đạo.
 * Chạy: node src/test_d3_trackfollow.js (từ server/render).
 *
 * Kiểm chứng (không mock):
 * 1. Render thật spec có text clip + video clip cùng bám một quỹ đạo
 *    tuyến tính (0.25 → 0.75 theo x, y = 0.5), trích frame ở t = 1.0 và 3.0,
 *    đo tâm thực tế bằng bbox pixel sáng, so với tâm kỳ vọng từ nội suy.
 *    - Text: bbox pixel trắng của dòng chữ (không box nền).
 *    - Video: vạch trắng dọc giữa khung nguồn; khi unit dịch theo track,
 *      tâm vạch phải dịch đúng bằng (W*frac - W/2).
 * 2. Biểu thức buildAxisExpr đánh giá đúng nội suy tuyến tính + kẹp ngoài
 *    khoảng (mini evaluator cho if/lt/gt, so với nội suy JS).
 * 3. Validator: track hợp lệ pass; track rỗng lỗi; text typewriter + track
 *    và video dính transition + track chỉ cảnh báo (vẫn render, track bị
 *    bỏ qua ở nhánh đó).
 * 4. Dry-run: nhánh PNG SR của text có track cũng dùng biểu thức track
 *    (overlay chứa if(lt( và main_w).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { buildAxisExpr, buildTrackOverlayExprs } = require("./tracking");
const { validateSpec } = require("./validate");

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };

// --- Mini evaluator cho biểu thức FFmpeg dạng if(lt(a,b),x,y) / if(gt(...)) ---
function tokenize(s) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === " " || ch === "\t") { i++; continue; }
    if ("(),+-*/".includes(ch)) { toks.push(ch); i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      toks.push(parseFloat(s.slice(i, j))); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++;
      toks.push(s.slice(i, j)); i = j; continue;
    }
    throw new Error(`ký tự lạ: ${ch}`);
  }
  return toks;
}
function evalFfExpr(s, vars) {
  const toks = tokenize(s);
  let p = 0;
  function parseExpr() {
    let v = parseTerm();
    while (toks[p] === "+" || toks[p] === "-") {
      const op = toks[p++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    while (toks[p] === "*" || toks[p] === "/") {
      const op = toks[p++];
      const r = parseFactor();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function parseFactor() {
    const tk = toks[p++];
    if (typeof tk === "number") return tk;
    if (tk === "(") { const v = parseExpr(); if (toks[p++] !== ")") throw new Error("thiếu )"); return v; }
    if (tk === "-") return -parseFactor();
    if (typeof tk === "string" && (tk === "if" || tk === "lt" || tk === "gt")) {
      if (toks[p++] !== "(") throw new Error("thiếu ( sau hàm");
      const args = [];
      if (toks[p] !== ")") {
        for (;;) { args.push(parseExpr()); if (toks[p] === ",") { p++; continue; } break; }
      }
      if (toks[p++] !== ")") throw new Error("thiếu ) sau hàm");
      if (tk === "if") return args[0] ? args[1] : args[2];
      if (tk === "lt") return args[0] < args[1] ? 1 : 0;
      return args[0] > args[1] ? 1 : 0;
    }
    if (typeof tk === "string" && tk in vars) return vars[tk];
    throw new Error(`token không hiểu: ${tk}`);
  }
  const v = parseExpr();
  if (p !== toks.length) throw new Error(`thừa token: ${toks.slice(p).join(" ")}`);
  return v;
}
function lerp(points, t) {
  const pts = [...points].sort((a, b) => a.t - b.t);
  if (t <= pts[0].t) return pts[0];
  const last = pts[pts.length - 1];
  if (t >= last.t) return last;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (t >= a.t && t <= b.t) {
      const p = (t - a.t) / (b.t - a.t);
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
    }
  }
  return last;
}

async function main() {
  // --- 2. Biểu thức nội suy khớp nội suy JS ---
  const pts = [
    { t: 0, x: 0.25, y: 0.5 },
    { t: 1.5, x: 0.4, y: 0.3 },
    { t: 4, x: 0.75, y: 0.5 },
  ];
  for (const lt of [-1, 0, 0.75, 1.5, 2.75, 4, 5]) {
    const ex = buildAxisExpr(pts, "x", `(t-1)`);
    const ey = buildAxisExpr(pts, "y", `(t-1)`);
    const want = lerp(pts, lt);
    const gx = evalFfExpr(ex, { t: lt + 1 });
    const gy = evalFfExpr(ey, { t: lt + 1 });
    ok(Math.abs(gx - want.x) < 1e-6 && Math.abs(gy - want.y) < 1e-6,
      `buildAxisExpr tại lt=${lt}: (${gx.toFixed(4)}, ${gy.toFixed(4)}) ≈ (${want.x}, ${want.y})`);
  }
  const te = buildTrackOverlayExprs({ points: pts }, 1);
  ok(te.x.includes("main_w") && te.x.includes("overlay_w/2"), "track overlay x có dạng main_w*frac - overlay_w/2");

  // --- 3. Validator ---
  const baseSpec = (tracks) => ({
    version: "0.2.0",
    meta: { name: "d3", width: 640, height: 360, fps: 30, duration: 4 },
    tracks,
  });
  const track2 = { points: [{ t: 0, x: 0.25, y: 0.5 }, { t: 4, x: 0.75, y: 0.5 }] };
  const textClip = (extra) => ({
    kind: "text", id: "tx", text: "TRACK", start: 0, duration: 4,
    style: { fontFamily: "DejaVu Sans", fontSize: 48, color: "#ffffff", bold: true, x: 0.5, y: 0.5, animation: "none" },
    ...extra,
  });
  const vClip = (extra) => ({
    kind: "video", id: "v", src: "bg.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1, ...extra,
  });
  let r = validateSpec(baseSpec([
    { id: "t1", kind: "text", clips: [textClip({ track: track2 })] },
  ]));
  ok(r.ok, `text + track hợp lệ pass (errors: ${r.errors.join("; ")})`);
  r = validateSpec(baseSpec([
    { id: "t1", kind: "text", clips: [textClip({ track: { points: [] } })] },
  ]));
  ok(!r.ok, "text + track rỗng → lỗi validate");
  r = validateSpec(baseSpec([
    { id: "t1", kind: "text", clips: [textClip({ track: track2, style: { fontFamily: "DejaVu Sans", fontSize: 48, color: "#ffffff", bold: true, x: 0.5, y: 0.5, animation: "typewriter" } })] },
  ]));
  ok(r.ok && r.warnings.some((w) => /ASS/.test(w)), "text typewriter + track → chỉ cảnh báo ASS, vẫn ok");
  r = validateSpec(baseSpec([
    { id: "v1", kind: "video", clips: [
      vClip({ track: track2, transitionOut: { type: "fade", duration: 0.5 } }),
      vClip({ id: "v2", start: 4, duration: 1 }),
    ] },
  ]));
  ok(r.ok && r.warnings.some((w) => /merge/.test(w)), "video dính transition + track → chỉ cảnh báo merge, vẫn ok");

  // --- 1. Render thật + đo vị trí ---
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-d3-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  const bg = path.join(mediaDir, "bg.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x000000:s=640x360:d=4:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", bg]);
  // Video nguồn: vạch trắng dọc đúng giữa khung (tâm 320) trên nền đen.
  const marker = path.join(mediaDir, "marker.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x000000:s=640x360:d=4:r=30",
    "-vf", "drawbox=x=310:y=0:w=20:h=360:color=white:t=fill",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", marker]);

  const spec = baseSpec([
    { id: "v1", kind: "video", clips: [vClip({ id: "bg1", src: "bg.mp4" })] },
    { id: "v2", kind: "video", clips: [vClip({ id: "mk1", src: "marker.mp4", track: track2 })] },
    { id: "t1", kind: "text", clips: [textClip({ track: track2 })] },
  ]);
  const specPath = path.join(dir, "spec.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const out = path.join(dir, "out.mp4");
  const rr = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir],
    { cwd: path.join(__dirname, ".."), encoding: "utf8" });
  if (rr.status !== 0) {
    console.error(rr.stdout?.slice(-2000));
    console.error(rr.stderr?.slice(-2000));
  }
  ok(rr.status === 0 && fs.existsSync(out), "render text+video bám track ra MP4");

  // Đo bbox pixel sáng ở 2 thời điểm; kỳ vọng tâm x = 240 (t=1) và 400 (t=3).
  const py = `
import sys, subprocess
from PIL import Image
W, H = 640, 360
for t in [1.0, 3.0]:
    png = sys.argv[1] + f"/f{t}.png"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", sys.argv[2],
                    "-frames:v", "1", png], check=True)
    im = Image.open(png).convert("L")
    px = im.load()
    # Vạch video: quét hàng y=30 (trên vùng chữ, tránh chữ) lấy bbox trắng.
    xs = [x for x in range(W) if px[x, 30] > 180]
    stripe = (min(xs) + max(xs)) / 2 if xs else -1
    # Chữ: bbox trắng toàn khung, trừ dải vạch dọc (x quanh stripe) để khỏi lẫn.
    txs, tys = [], []
    for y in range(H):
        for x in range(W):
            if px[x, y] > 180 and abs(x - stripe) > 15:
                txs.append(x); tys.append(y)
    tcx = (min(txs) + max(txs)) / 2 if txs else -1
    tcy = (min(tys) + max(tys)) / 2 if tys else -1
    print(f"{t} stripe={stripe:.1f} text=({tcx:.1f},{tcy:.1f})")
`;
  const pyOut = run("python3", ["-c", py, dir, out]);
  console.log(pyOut.trim());
  const rows = {};
  for (const line of pyOut.trim().split("\n")) {
    const m = /^(\S+) stripe=(\S+) text=\((\S+),(\S+)\)/.exec(line);
    if (m) rows[m[1]] = { stripe: parseFloat(m[2]), tx: parseFloat(m[3]), ty: parseFloat(m[4]) };
  }
  for (const [t, want] of [["1.0", 240], ["3.0", 400]]) {
    const row = rows[t];
    ok(!!row, `đo được frame t=${t}`);
    if (!row) continue;
    ok(Math.abs(row.stripe - want) <= 6, `vạch video t=${t}: tâm ${row.stripe} ≈ ${want} (±6px)`);
    ok(Math.abs(row.tx - want) <= 8, `tâm chữ x t=${t}: ${row.tx} ≈ ${want} (±8px)`);
    ok(Math.abs(row.ty - 180) <= 8, `tâm chữ y t=${t}: ${row.ty} ≈ 180 (±8px)`);
  }

  // --- 4. Dry-run nhánh PNG SR: text có scale keyframes + track ---
  const srSpec = baseSpec([
    { id: "v1", kind: "video", clips: [vClip({ id: "bg1", src: "bg.mp4" })] },
    { id: "t1", kind: "text", clips: [textClip({
      track: track2,
      animations: { scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] } },
    })] },
  ]);
  const srPath = path.join(dir, "spec-sr.json");
  fs.writeFileSync(srPath, JSON.stringify(srSpec));
  const dr = spawnSync("node", ["src/render.js", "--spec", srPath, "--out", path.join(dir, "sr.mp4"),
    "--media-dir", mediaDir, "--dry-run"],
    { cwd: path.join(__dirname, ".."), encoding: "utf8" });
  const dry = (dr.stdout || "") + (dr.stderr || "");
  ok(dr.status === 0 && dry.includes("if(lt(") && dry.includes("main_w"),
    "dry-run text SR + track: overlay chứa biểu thức track (if(lt( + main_w)");

  console.log(`\ntest_d3_trackfollow: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
