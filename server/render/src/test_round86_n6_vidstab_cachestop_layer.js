/* Đợt 86 N6 — vidstab: đóng cơ chế lõi cache_stop.
 *
 * Probe phân biệt cuối cùng (2 tầng, cùng 1 lượt chạy, clip shaky720 +
 * trf thật — endpoint có power nhất, baseline K10 D720NC ~58%):
 *
 *  (N6-B) DUAL-TAP — tách tầng: decode -> split -> [tapA: framemd5 trực
 *    tiếp] + [transform -> tapB: framemd5]. tapA và tapB chia sẻ ĐÚNG
 *    MỘT buffer decode (split clone). Nếu tapA lệch so với GT decode
 *    (arm DEC) tại đúng frame tapB lệch -> lỗi đã có ở đầu ra decoder
 *    (thượng nguồn: decoder/scheduler/pool) — transform chỉ là nạn nhân.
 *    Nếu tapA sạch tuyệt đối mà tapB lệch -> lỗi sinh TRONG lần gọi
 *    transform (mâu thuẫn với chứng minh source — phải kiểm lại .so).
 *    Lưu ý: split clone làm input của transform KHÔNG bao giờ writable
 *    -> DUAL chạy toàn bộ ở nhánh NON-COPY (đọc trực tiếp buffer decoder).
 *
 *  (N6-A) NC-SHIM — đo nhánh rẽ từng frame: LD_PRELOAD branch_shim.so
 *    interpose av_frame_is_writable(), log (seq, writable?, caller) cho
 *    chuỗi NOCOPY thuần (như K10 D720NC). Tương quan nhánh rẽ với frame
 *    lệch: nhánh non-copy chỉ tồn tại ở tiền tố trước frame writable đầu
 *    tiên (do td->srcMalloced sticky trong libvidstab) — nếu frame lệch
 *    nằm SAU frame writable đầu tiên thì lý thuyết "đọc con trỏ trần"
 *    KHÔNG giải thích được chúng.
 *
 * Arms (720p, n=10): DUAL, CP (GT cho tapB), DEC (GT cho tapA), NC-SHIM.
 * Kế thừa K10: taskset pin cores 0-1, 2 hog, LD_PRELOAD free_track_v2e +
 * segv_backtrace, -threads 1, resume từ results.jsonl, retry I/O.
 */
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, spawn, execSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.N6_WORK || path.join(HOME, "workspace", ".scratch-r86n6", "runs");
fs.mkdirSync(WORK, { recursive: true });

const SRC720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.mp4";
const TRF720 = "/home/hatch/workspace/.scratch-r74b7/runs/shaky720.trf";
const FREE_SO = "/home/hatch/workspace/.scratch-r81i1/free_track_v2e_preload.so";
const SEGV_SO = "/home/hatch/workspace/.scratch-r76d3/runs-v2b/segv_backtrace_preload.so";
const SHIM_SO = "/home/hatch/workspace/.scratch-r86n6/branch_shim.so";
const BOTH = `${FREE_SO}:${SEGV_SO}`;
const FFMPEG_STOCK = "ffmpeg";
const CORES = process.env.N6_CORES || "0-1";
const N = parseInt(process.env.N6_N || "10", 10);
const N_HOG = parseInt(process.env.N6_HOG || "2", 10);
const LOGF = path.join(WORK, "results.jsonl");
const SUMMARYF = path.join(WORK, "summary.json");
const ANALYSISF = path.join(WORK, "analysis-perframe.json");
const HOGSNAPF = path.join(WORK, "hog-cpu-snapshots.txt");

const VF_BASE = "trim=start=0:end=5,setpts=PTS-STARTPTS";
// N6_CROP=black: vidstabtransform crop=black (def=đen thay vì *dest =
// output frame trước) — loại bỏ kênh truyền chéo frame duy nhất trong
// libvidstab để kiểm chứng giả thuyết propagation qua destbuf.
const CROP_OPT = process.env.N6_CROP === "black" ? ":crop=black" : "";
const VF_TRF = `vidstabtransform=input='${TRF720}':smoothing=10:optalgo=gauss${CROP_OPT},showinfo`;
const VF_NC = `${VF_BASE},${VF_TRF}`;
const VF_CP = `${VF_BASE},copy,${VF_TRF}`;
const FC_DUAL = `[0:v]${VF_BASE},split=2[pre][tot];[tot]${VF_TRF}[stab]`;

const ALL_ARMS = [
  { key: "DUAL", label: "dual-tap split->tapA + transform->tapB", src: SRC720, kind: "dual", realFrames: 150 },
  { key: "CP", label: "COPY GT cho tapB", src: SRC720, vf: VF_CP, kind: "single", realFrames: 150 },
  { key: "DEC", label: "decode GT cho tapA", src: SRC720, vf: VF_BASE, kind: "single", realFrames: 150 },
  { key: "NC-SHIM", label: "NOCOPY + branch shim", src: SRC720, vf: VF_NC, kind: "single", realFrames: 150, shim: true },
];
const WANT = (process.env.N6_ARMS || "").split(",").map((s) => s.trim()).filter(Boolean);
const ARMS = WANT.length ? ALL_ARMS.filter((a) => WANT.includes(a.key)) : ALL_ARMS;

// ---------------- tiện ích (kế thừa K10) ----------------
function writeRetry(fn, what, maxAttempts) {
  maxAttempts = maxAttempts || 30;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { fn(); return; }
    catch (e) {
      lastErr = e;
      if (attempt < maxAttempts) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    }
  }
  throw new Error(`ghi ${what} thất bại sau ${maxAttempts} lần retry: ${lastErr && lastErr.message}`);
}
function appendFileRetry(p, data, maxAttempts) { writeRetry(() => fs.appendFileSync(p, data), p, maxAttempts); }
function writeFileRetry(p, data, maxAttempts) { writeRetry(() => writeFileEpermRetry(p, data), p, maxAttempts); }
function log(...a) { console.log(...a); }
function loadAvgStr() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function record(rec) { appendFileRetry(LOGF, JSON.stringify(rec) + "\n", 150); }
function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : +((s[m - 1] + s[m]) / 2).toFixed(2);
}
function wilson(k, n) {
  if (n === 0) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [+Math.max(0, (c - m) / d).toFixed(4), +Math.min(1, (c + m) / d).toFixed(4)];
}
function logComb(n, k) {
  if (k < 0 || k > n) return -Infinity;
  k = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}
function fisher2(a, b, c, d) {
  const n = a + b + c + d;
  const logP0 = logComb(a + b, a) + logComb(c + d, c) - logComb(n, a + c);
  let p = 0;
  const lo = Math.max(0, (a + c) - (c + d)), hi = Math.min(a + b, a + c);
  for (let x = lo; x <= hi; x++) {
    const lp = logComb(a + b, x) + logComb(c + d, a + c - x) - logComb(n, a + c);
    if (lp <= logP0 + 1e-12) p += Math.exp(lp);
  }
  return Math.min(1, p);
}
function permTestExact(a, b) {
  const all = [...a, ...b];
  const n1 = a.length;
  const total = all.reduce((s, v) => s + v, 0);
  const obs = Math.abs(a.reduce((s, v) => s + v, 0) / n1 - b.reduce((s, v) => s + v, 0) / b.length);
  let extreme = 0, count = 0;
  const idx = Array.from({ length: n1 }, (_, i) => i);
  for (;;) {
    let s = 0;
    for (const i of idx) s += all[i];
    if (Math.abs(s / n1 - (total - s) / (all.length - n1)) >= obs - 1e-12) extreme++;
    count++;
    let i = n1 - 1;
    while (i >= 0 && idx[i] === all.length - n1 + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < n1; j++) idx[j] = idx[j - 1] + 1;
  }
  return { p: extreme / count, combos: count };
}
function parseFramemd5(p) {
  const md5s = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\d+,\s*\d+,\s*\d+,\s*\d+,\s*\d+,\s*([0-9a-f]{32})\s*$/);
    if (m) md5s.push(m[1]);
  }
  return md5s;
}
// Branch log shim: "# ..." header + "seq writable retaddr". Trả về mảng
// writable[0..149] (1/0) theo thứ tự gọi == thứ tự frame.
function parseBranchLog(p) {
  const w = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^(\d+) ([01]) 0x[0-9a-f]+$/);
    if (m) w.push(parseInt(m[2], 10));
  }
  return w;
}
function lastMatch(re, s) {
  let m = null, cur;
  re.lastIndex = 0;
  while ((cur = re.exec(s)) !== null) m = cur;
  return m ? parseInt(m[1], 10) : null;
}

// ---------------- chạy ----------------
let hogs = [];
function startHogs() {
  for (let i = 0; i < N_HOG; i++) {
    const h = spawn("taskset", ["-c", CORES, "yes"], { stdio: "ignore", detached: true });
    h.unref();
    hogs.push(h);
  }
  log(`   🔥 ${N_HOG} hog CPU đã chạy, pin cores=${CORES} (pid ${hogs.map((h) => h.pid).join(",")})`);
}
function stopHogs() {
  for (const h of hogs) { try { process.kill(-h.pid, "SIGKILL"); } catch { try { h.kill("SIGKILL"); } catch { /* đã chết */ } } }
  hogs = [];
}
process.on("exit", stopHogs);
process.on("SIGINT", () => { stopHogs(); process.exit(130); });
process.on("SIGTERM", () => { stopHogs(); process.exit(143); });
function hogCpuSnapshot(tag) {
  const pids = hogs.map((h) => h.pid).join(",");
  let out = "(không đọc được ps)";
  try {
    out = execSync(`ps -o pid=,pcpu=,psr=,comm= -p ${pids}`, { encoding: "utf8", timeout: 10000 }).trim();
  } catch (e) { out = `(ps lỗi: ${e.message})`; }
  const line = `[${new Date().toISOString()}] ${tag} loadavg=${loadAvgStr()}\n${out}\n`;
  try { fs.appendFileSync(HOGSNAPF, line); }
  catch (e) { log(`   ⚠️  hog snapshot (${tag}) không ghi được (${e.code || e.message}) — bỏ qua`); }
  log(`   📈 hog snapshot (${tag}):\n${out.split("\n").map((l) => "        " + l).join("\n")}`);
}

function runOnce(arm, idx) {
  const outDir = path.join(WORK, arm.key);
  fs.mkdirSync(outDir, { recursive: true });
  const errFile = path.join(outDir, `r${idx}.stderr`);
  const freeLog = path.join(WORK, `free-track-v2e-${arm.key}-r${idx}.log`);
  try { fs.unlinkSync(freeLog); } catch { /* chưa có */ }
  let args, outs;
  if (arm.kind === "dual") {
    const outA = path.join(outDir, `r${idx}.tapA.framemd5`);
    const outB = path.join(outDir, `r${idx}.tapB.framemd5`);
    outs = [outA, outB];
    args = ["-threads", "1", "-v", "info", "-i", arm.src,
      "-filter_complex", FC_DUAL,
      "-map", "[pre]", "-an", "-f", "framemd5", "-y", outA,
      "-map", "[stab]", "-an", "-f", "framemd5", "-y", outB];
  } else {
    const out = path.join(outDir, `r${idx}.framemd5`);
    outs = [out];
    args = ["-threads", "1", "-v", "info", "-i", arm.src, "-vf", arm.vf, "-an", "-f", "framemd5", "-y", out];
  }
  const branchLog = arm.shim ? path.join(outDir, `r${idx}.branch.log`) : null;
  if (branchLog) try { fs.unlinkSync(branchLog); } catch { /* chưa có */ }
  let r, stderr, secs, attempts = 0;
  for (;;) {
    attempts++;
    const t0 = Date.now();
    const env = { ...process.env, LD_PRELOAD: arm.shim ? `${BOTH}:${SHIM_SO}` : BOTH, FREE_TRACK_LOG: freeLog };
    if (branchLog) env.N6_BRANCH_LOG = branchLog;
    r = spawnSync("taskset", ["-c", CORES, FFMPEG_STOCK, ...args], {
      stdio: ["ignore", "pipe", "pipe"], timeout: 600000, env,
    });
    secs = (Date.now() - t0) / 1000;
    stderr = (r.stderr || "").toString();
    const sizes = outs.map((o) => (fs.existsSync(o) ? fs.statSync(o).size : 0));
    const ioFail = (r.status !== 0 || r.signal !== null || sizes.some((s) => s === 0)) &&
      (/Permission denied/i.test(stderr) || /I\/O error/i.test(stderr) || sizes.some((s) => s === 0));
    if (!ioFail || attempts >= 3) {
      if (ioFail) log(`   ⚠️  ${arm.key}-r${idx}: lỗi I/O sau ${attempts} lần thử — ghi nhận kết quả cuối (không retry nữa)`);
      break;
    }
    log(`   ⚠️  ${arm.key}-r${idx}: ffmpeg chết vì lỗi I/O (lần ${attempts}, ${secs.toFixed(1)}s) — chờ 30 s rồi chạy lại`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000);
  }
  writeFileRetry(errFile, stderr, 150);
  const rec = { arm: arm.key, i: idx, ffmpeg: FFMPEG_STOCK, status: r.status, signal: r.signal || null,
    error: r.error ? String(r.error) : null, secs: +secs.toFixed(1), loadavg: loadAvgStr(), cores: CORES,
    lastFrame: lastMatch(/\[Parsed_showinfo[^\]]*\] n:\s*(\d+)/g, stderr) };
  for (let k = 0; k < outs.length; k++) {
    const o = outs[k];
    const exists = fs.existsSync(o);
    const size = exists ? fs.statSync(o).size : 0;
    rec[`sha${k}`] = exists && size > 0 ? sha256(o).slice(0, 12) : null;
    rec[`size${k}`] = size;
  }
  rec.crash = r.status !== 0 || r.signal !== null || outs.some((o) => !fs.existsSync(o) || fs.statSync(o).size === 0);
  if (branchLog) {
    const w = fs.existsSync(branchLog) ? parseBranchLog(branchLog) : [];
    rec.branchCalls = w.length;
    rec.branchWritable = w.filter((v) => v === 1).length;
    rec.branchFirstWritable = w.findIndex((v) => v === 1); // -1 nếu không có frame nào writable
    rec.branchAddrs = [...new Set(fs.existsSync(branchLog) ? fs.readFileSync(branchLog, "utf8").split("\n").map((l) => (l.match(/0x[0-9a-f]+$/) || [])[0]).filter(Boolean) : [])];
  }
  if (rec.crash) log(`   💥 ${arm.key}-r${idx}: CRASH signal=${r.signal} lastFrame=${rec.lastFrame}`);
  else log(`   📊 ${arm.key}-r${idx} (${secs.toFixed(1)}s): ok sha=${rec.sha0}…${rec.sha1 ? ` / ${rec.sha1}…` : ""} lastFrame=${rec.lastFrame} load=${loadAvgStr()}${branchLog ? ` branch=${rec.branchWritable}/${rec.branchCalls} firstWritable=${rec.branchFirstWritable}` : ""}`);
  record(rec);
  return rec;
}

function runAll() {
  log(`== Đợt 86 N6 — vidstab cache_stop: dual-tap + branch shim (cores=${CORES}), ${ARMS.length} arm × n=${N} ==`);
  log(`   WORK=${WORK} (arms=${ARMS.map((a) => a.key).join(",")})`);
  for (const p of [SRC720, TRF720, FREE_SO, SEGV_SO, SHIM_SO]) {
    if (!fs.existsSync(p)) { log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  const chk = spawnSync("taskset", ["-c", CORES, "true"], { stdio: "ignore" });
  if (chk.status !== 0) { log(`   ❌ taskset -c ${CORES} không chạy được (status=${chk.status})`); process.exit(2); }
  const done = new Set();
  const all = [];
  try {
    for (const line of fs.readFileSync(LOGF, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      done.add(`${rec.arm}:${rec.i}`);
      all.push(rec);
    }
  } catch { /* chưa có log */ }
  if (done.size > 0) log(`   📊 khôi phục: ${done.size} lần chạy đã có — bỏ qua, không chạy lại`);
  startHogs();
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000);
  hogCpuSnapshot("sau-khoi-dong-hog");
  for (let i = 1; i <= N; i++) {
    for (const arm of ARMS) {
      if (done.has(`${arm.key}:${i}`)) continue;
      all.push(runOnce(arm, i));
    }
    log(`   --- vòng ${i}/${N} xong, load=${loadAvgStr()} ---`);
  }
  hogCpuSnapshot("cuoi-chay");
  stopHogs();
  const byArm = {};
  for (const a of ARMS) {
    const rs = all.filter((r) => r.arm === a.key);
    byArm[a.key] = { n: rs.length, crashes: rs.filter((r) => r.crash).length,
      wilson95: wilson(rs.filter((r) => r.crash).length, rs.length),
      medianSecs: median(rs.map((r) => r.secs)) };
  }
  writeFileRetry(SUMMARYF, JSON.stringify({ byArm, at: new Date().toISOString() }, null, 2), 150);
  log(JSON.stringify(byArm, null, 2));
}

// ---------------- phân tích ----------------
function analyze() {
  const out = { at: new Date().toISOString(), arms: {} };
  const load = (armKey, idx, suffix) => {
    const p = path.join(WORK, armKey, `r${idx}${suffix}`);
    if (!fs.existsSync(p)) return null;
    return parseFramemd5(p);
  };
  // GT: CP r1 (cho tapB) và DEC r1 (cho tapA). Kiểm tra ổn định GT trước.
  const cpRuns = [], decRuns = [];
  for (let i = 1; i <= N; i++) {
    const c = load("CP", i, ".framemd5"); if (c) cpRuns.push(c);
    const d = load("DEC", i, ".framemd5"); if (d) decRuns.push(d);
  }
  const cpGT = cpRuns[0] || null;
  const decGT = decRuns[0] || null;
  const cpStable = cpRuns.every((r) => JSON.stringify(r) === JSON.stringify(cpGT));
  const decStable = decRuns.every((r) => JSON.stringify(r) === JSON.stringify(decGT));
  out.gt = { cpFrames: cpGT ? cpGT.length : 0, cpStable, cpRuns: cpRuns.length,
    decFrames: decGT ? decGT.length : 0, decStable, decRuns: decRuns.length,
    cpWholeSha12: cpGT ? crypto.createHash("sha256").update(cpRuns[0].join("\n")).digest("hex").slice(0, 12) : null };
  log(`GT: CP ${cpRuns.length} run, ${cpGT ? cpGT.length : 0} frame, ổn định tuyệt đối: ${cpStable}; DEC ${decRuns.length} run, ${decGT ? decGT.length : 0} frame, ổn định tuyệt đối: ${decStable}`);
  // DUAL: divA = tapA vs GTdec (lỗi thượng nguồn), divB = tapB vs GTcp.
  const dualA = [], dualB = [], dualPerRun = [];
  for (let i = 1; i <= N; i++) {
    const a = load("DUAL", i, ".tapA.framemd5");
    const b = load("DUAL", i, ".tapB.framemd5");
    if (!a || !b) continue;
    const divA = [], divB = [];
    for (let n = 0; n < 150; n++) {
      if (decGT && a[n] !== decGT[n]) divA.push(n);
      if (cpGT && b[n] !== cpGT[n]) divB.push(n);
    }
    dualA.push(divA.length); dualB.push(divB.length);
    dualPerRun.push({ i, divA, divB, divAOnly: divA.filter((n) => !divB.includes(n)), divBOnly: divB.filter((n) => !divA.includes(n)), divBoth: divA.filter((n) => divB.includes(n)) });
  }
  const totDivA = dualA.reduce((s, v) => s + v, 0);
  const totDivB = dualB.reduce((s, v) => s + v, 0);
  const totBoth = dualPerRun.reduce((s, r) => s + r.divBoth.length, 0);
  const totBOnly = dualPerRun.reduce((s, r) => s + r.divBOnly.length, 0);
  const totAOnly = dualPerRun.reduce((s, r) => s + r.divAOnly.length, 0);
  out.dual = { runs: dualPerRun.length, perRunDivA: dualA, perRunDivB: dualB,
    totalDivA: totDivA, totalDivB: totDivB, divBoth: totBoth, divBOnly: totBOnly, divAOnly: totAOnly,
    fisherDivBvsCP: cpGT ? fisher2(totDivB, dualPerRun.length * 150 - totDivB, 0, dualPerRun.length * 150) : null,
    permDivBvsCP: cpGT ? permTestExact(dualB, Array(dualPerRun.length).fill(0)) : null,
    perRun: dualPerRun };
  log(`DUAL: tapA lệch ${totDivA}/${dualPerRun.length * 150} (thượng nguồn), tapB lệch ${totDivB}/${dualPerRun.length * 150}; cả hai cùng lệch ${totBoth}, chỉ tapB ${totBOnly}, chỉ tapA ${totAOnly}`);
  log(`DUAL per-run divA: [${dualA.join(", ")}]; divB: [${dualB.join(", ")}]`);
  // NC-SHIM: div vs GTcp + tương quan nhánh rẽ.
  const shimPerRun = [];
  for (let i = 1; i <= N; i++) {
    const f = load("NC-SHIM", i, ".framemd5");
    const blog = path.join(WORK, "NC-SHIM", `r${i}.branch.log`);
    const w = fs.existsSync(blog) ? parseBranchLog(blog) : [];
    if (!f) continue;
    const div = [];
    for (let n = 0; n < 150; n++) if (cpGT && f[n] !== cpGT[n]) div.push(n);
    const firstW = w.findIndex((v) => v === 1);
    shimPerRun.push({ i, div, divCount: div.length, branchCalls: w.length,
      writableCount: w.filter((v) => v === 1).length, firstWritable: firstW,
      divBeforeFirstWritable: firstW >= 0 ? div.filter((n) => n < firstW) : div,
      divAtOrAfterFirstWritable: firstW >= 0 ? div.filter((n) => n >= firstW) : [],
      divWritableBranch: div.filter((n) => w[n] === 1).length,
      divNonWritableBranch: div.filter((n) => w[n] === 0).length });
  }
  const totShimDiv = shimPerRun.reduce((s, r) => s + r.divCount, 0);
  const shimAfterFirstW = shimPerRun.reduce((s, r) => s + r.divAtOrAfterFirstWritable.length, 0);
  const shimBeforeFirstW = shimPerRun.reduce((s, r) => s + r.divBeforeFirstWritable.length, 0);
  const firstWs = shimPerRun.map((r) => r.firstWritable);
  out.ncshim = { runs: shimPerRun.length, perRunDiv: shimPerRun.map((r) => r.divCount), totalDiv: totShimDiv,
    firstWritablePerRun: firstWs,
    divBeforeFirstWritable: shimBeforeFirstW, divAtOrAfterFirstWritable: shimAfterFirstW,
    fisherDivVsCP: cpGT ? fisher2(totShimDiv, shimPerRun.length * 150 - totShimDiv, 0, shimPerRun.length * 150) : null,
    permDivVsCP: cpGT ? permTestExact(shimPerRun.map((r) => r.divCount), Array(shimPerRun.length).fill(0)) : null,
    perRun: shimPerRun };
  log(`NC-SHIM: lệch ${totShimDiv}/${shimPerRun.length * 150}; firstWritable mỗi run: [${firstWs.join(", ")}]`);
  log(`NC-SHIM: frame lệch TRƯỚC frame writable đầu tiên: ${shimBeforeFirstW}; TẠI/SAU frame writable đầu tiên: ${shimAfterFirstW} (những frame này ở nhánh COPY của libvidstab — con trỏ trần không còn được đọc)`);
  log(`NC-SHIM per-run div: [${shimPerRun.map((r) => r.divCount).join(", ")}]`);
  writeFileRetry(ANALYSISF, JSON.stringify(out, null, 2), 150);
  log(`Đã ghi ${ANALYSISF}`);
}

const mode = process.argv[2] || "run";
if (mode === "analyze") analyze();
else runAll();
