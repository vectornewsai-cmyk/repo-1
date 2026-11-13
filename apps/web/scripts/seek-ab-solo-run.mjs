#!/usr/bin/env node
/**
 * Phase 9 đợt 38, luồng U6 — Runner PHIÊN ĐO RIÊNG (solo session) cho
 * cổng đo v3, thực thi đúng protocol chốt trước ở
 * docs/PHASE9_ROUND37_T1_GATE_V3_LIMITS.md §4.
 *
 * CHỈ CHUẨN BỊ, CHƯA CHẠY ĐO THẬT trong đợt 38: luồng U6 KHÔNG chạy
 * browser headed (tránh nhiễm các luồng khác đang chạy song song).
 * Chế độ `run` trong file này là code cho phiên solo tương lai, chạy
 * từ main chat / phiên có quyền dừng các luồng browser khác — nó
 * chưa từng được thực thi trong đợt này. Hai chế độ đã chạy thật ở
 * đợt 38 là `--dry-run` và `--self-test` (không browser, xem LIMITS).
 *
 * Protocol chốt trước (T1 §4 — cấm đổi giữa phiên):
 *  - Bundle đóng băng R1: retry index-BqxQgBuf.js, single
 *    index-xfaJXEFE.js (212 module, sha như S1 §1); fixture
 *    sparse-gop-flat.mp4 (GOP 300, 720p, 30 s); harness N2 y nguyên
 *    qua probe Q6 (không sửa probe, không sửa harness, không build
 *    lại dist trong phiên).
 *  - Ngưỡng v3 đóng băng đúng module seek-ab-gate-v3.mjs: load1/
 *    load5/load15 < 2,0 ở beforeFwd/beforeRev/atEnd; xuôi [0,98,
 *    1,02]; rAF P50 ≤ 0,015 s; predictedRate ≥ 0,98; chromePre = 0;
 *    decode v2 (stall ≤ 1, chuỗi ≤ 1, tick ≥ 80/s, tailMean < 1,5
 *    nghiêm ngặt, tailMax ≤ 2); biên GOP 20 s. Acceptance: loadLabelV3
 *    = quiet VÀ decode = HEALTHY. Tỉ số GOP chỉ ghi kèm, không dùng
 *    để nhận/loại.
 *  - Thứ tự xen kẽ, bắt đầu bằng retry, theo khối 8 lượt (4/phía);
 *    dừng sớm khi đủ 8 accepted/phía VÀ kiểm tra trôi đạt; trần
 *    48 lượt (24/phía). Quá trần mà chưa đủ hoặc CI vẫn vượt ±10%
 *    → kết luận "không khóa được trên VM này", không chạy tiếp,
 *    không nới ngưỡng.
 *  - Điều kiện solo mỗi lượt: pgrep Chrome = 0 trước lượt (cổng
 *    tiền kiểm chờ tối đa 10 phút tới khi load1/load5/load15 pre-run
 *    < 2,0 VÀ chromePre = 0; hết 10 phút → gate-timeout, KHÔNG tính
 *    là lượt đo, thử lại tối đa 2 lần rồi dừng phiên), chromePost = 0
 *    sau lượt, manifest sha trước = sau, bundle sha trước = sau
 *    (vi phạm → INVALID, lượt bị loại, dừng phiên để xem lại máy
 *    nếu dist đổi — dist đóng băng đổi là lỗi phiên, không phải
 *    lượt đo bình thường).
 *  - Kiểm tra khóa: CI Welch 95% cho chênh lệch trung bình
 *    (single − retry) nằm gọn trong ±10% của trung bình retry VÀ
 *    đủ 8 accepted/phía VÀ kiểm tra trôi (trung vị nửa đầu / nửa sau
 *    mỗi phía lệch ≤ 10%) đạt. Thiếu một trong ba → chưa khóa.
 *    CẤM gộp số phiên solo với số R1/b36 trong quyết định khóa;
 *    lượt bị loại (STARVED/STEADY_SLOW/under-load) không tính vào
 *    thống kê A/B.
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/seek-ab-solo-run.mjs --dry-run [--retry-dist DIR] [--single-dist DIR] [--fixture FILE]
 *   node apps/web/scripts/seek-ab-solo-run.mjs --self-test [--old-runs DIR] [--old-runs-b36 DIR]
 *   node apps/web/scripts/seek-ab-solo-run.mjs run --out-dir DIR --scratch-base DIR [--display :91] [--port 4191] [--max-runs 48] [--target-per-side 8] [--resume]
 * Thoát: 0 = xong / đủ điều kiện (dry-run) / self-test xanh;
 * 2 = thiếu tiền điều kiện (dry-run) hoặc self-test fail;
 * 3 = dist đóng băng đổi giữa phiên (run) — dừng phiên.
 *
 * LƯU Ý về probe per-seek (đợt 39 T2 đã cài vào harness N2, đợt 40 V1
 * nối vào runner này): khi phiên solo chạy với N2_PERSEEK=1, cờ chảy
 * qua solo → Q6 → N2 chỉ bằng kế thừa process.env (solo và Q6 đều
 * spread process.env khi spawn, không ghi đè N2_PERSEEK — xem
 * buildProbeEnv + probe Q6); harness N2 ghi perSeekEnabled/perSeek
 * vào forward-hold.json và runOneVariant copy thật qua
 * extractPerSeekReport vào JSON lượt (trường perSeekProbe). Khi cờ
 * tắt hoặc harness cũ, perSeekProbe mang status "absent" và lượt đó
 * không claim cơ chế sụp đoạn — không bịa entry nào.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { classifyRunV3, verifySolo, GATE_V3 } from "./seek-ab-gate-v3.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Đợt 39 T1 SỬA: HERE = apps/web/scripts nên cần 3 lần ".." mới tới
// gốc repo. Bản đợt 38 chỉ có 2 lần ("..", "..") → REPO = apps/ và
// đường dẫn probe thành apps/apps/web/scripts/... (không tồn tại),
// khiến mọi lượt run đều NO_RESULT với q6Exit=1 (xem LIMITS đợt 39 T1).
const REPO = path.resolve(HERE, "..", "..", "..");

/** Đường dẫn tuyệt đối tới probe Q6 mà chế độ run spawn (export để
 *  test hồi quy kiểm tra file tồn tại — tránh tái diễn lỗi NO_RESULT). */
export const PROBE_Q6 = path.join(REPO, "apps/web/scripts/probe-round34-q6-measure-protocol.mjs");

// --- Hằng số chốt trước (T1 §4 + S1 §1; đổi bất kỳ giá trị nào cũng
// phải ghi vào LIMITS phiên solo và chỉ được đổi TRƯỚC lượt đầu). ---
export const SOLO = {
  protocol: "T1-§4-solo-v3-pre-registered",
  gateVersion: GATE_V3.version,
  targetPerSide: 8,
  blockSize: 8,
  maxRuns: 48,
  gateWaitSec: 600,
  gatePollSec: 30,
  gateRetries: 2,
  gopBoundarySec: 20,
  lockBandPct: 10,
  driftBandPct: 10,
  expectedBundle: {
    retry: {
      file: "index-BqxQgBuf.js",
      sha256: "f2fb01664045fcac30275d0d2459e38188f28b4413988d33063331d503b4f65d",
    },
    single: {
      file: "index-xfaJXEFE.js",
      sha256: "fffcd2c019461441b16860879841b0c019ef6fb2085815eb1fa3764b1cf8136a",
    },
  },
  expectedFixtureSha256:
    "a4ea20eb67bb6b214eb38c8aee8f2a30f28d698d714265ab8049716e820bd00e",
  chromePattern: "chrome-linux64/chrome|meta-chromium/chrome",
  defaultRetryDist: path.join(
    process.env.HOME || "~",
    "workspace/tmp-round35-r1/dist-retry",
  ),
  defaultSingleDist: path.join(
    process.env.HOME || "~",
    "workspace/tmp-round35-r1/dist-single",
  ),
  defaultFixture: path.join(
    process.env.HOME || "~",
    "workspace/tmp-round27-k4/sparse-gop-flat.mp4",
  ),
  defaultOldR1: path.join(
    process.env.HOME || "~",
    "workspace/tmp-round35-r1/runs",
  ),
  defaultOldB36: path.join(
    process.env.HOME || "~",
    "workspace/tmp-round36-s1/runs",
  ),
};

// --- Tiện ích thuần (có test) ----------------------------------------

export function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** Manifest sha256 đệ quy, ĐÚNG thuật toán probe Q6 (sắp xếp theo rel,
 *  dòng "sha256  rel" nối bằng \n). Dùng để đối chiếu dist đóng băng
 *  trước/sau mỗi lượt mà không phụ thuộc vào probe Q6. */
export function distManifest(dir) {
  const files = [];
  const walk = (d, relBase) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(d, e.name);
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) walk(full, rel);
      else if (e.isFile()) {
        let sha;
        try { sha = sha256File(full); } catch { sha = "unreadable"; }
        files.push({ rel, sha256: sha });
      }
    }
  };
  walk(dir, "");
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  const manifestSha256 = crypto
    .createHash("sha256")
    .update(files.map((f) => `${f.sha256}  ${f.rel}`).join("\n"))
    .digest("hex");
  return { dir, fileCount: files.length, manifestSha256, files };
}

export function chromeCount() {
  const out = spawnSync("pgrep", ["-f", SOLO.chromePattern], { encoding: "utf8" });
  if (!out.stdout) return 0;
  return out.stdout.trim().split("\n").filter(Boolean).length;
}

export function readLoadavg() {
  const parts = fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/);
  return { raw: parts.slice(0, 3).join(" "), load1: Number(parts[0]), load5: Number(parts[1]), load15: Number(parts[2]) };
}

export function loadMaxima(loadObj) {
  const maxOf = (key) => {
    const vs = GATE_V3.load.checkpoints
      .map((cp) => loadObj?.[cp])
      .filter((s) => typeof s === "string")
      .map((s) => Number(s.trim().split(/\s+/)[{ load1: 0, load5: 1, load15: 2 }[key]]))
      .filter(Number.isFinite);
    return vs.length ? Math.max(...vs) : null;
  };
  return { load1Max: maxOf("load1"), load5Max: maxOf("load5"), load15Max: maxOf("load15") };
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const sd = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1));
};

/** Thống kê một phía (chỉ tính trên lượt accepted). */
export function summarizeSide(runs) {
  const fps = runs.map((r) => r.fps);
  return { n: runs.length, runs: runs.map((r) => r.run), fps, mean: +mean(fps).toFixed(3), median: +median(fps).toFixed(3), sd: +sd(fps).toFixed(3) };
}

/** Tỉ số từng cặp theo thứ tự nhận (pair i = accepted thứ i mỗi phía). */
export function pairwiseRatios(retryAcc, singleAcc) {
  const n = Math.min(retryAcc.length, singleAcc.length);
  const pairs = [];
  for (let i = 0; i < n; i++) {
    pairs.push({
      pair: i + 1,
      retry: `${retryAcc[i].run} ${retryAcc[i].fps}`,
      single: `${singleAcc[i].run} ${singleAcc[i].fps}`,
      ratio: +(singleAcc[i].fps / retryAcc[i].fps).toFixed(4),
    });
  }
  return pairs;
}

/** Khoảng tin cậy Welch 95% cho chênh lệch trung bình (single − retry).
 *  Bậc tự do Welch–Satterthwaite; t tới hạn tra bảng rút gọn (df ≥ 1);
 *  với n = 8/phía và sd kiểu R1, nửa khoảng ≈ 0,61 fps ≈ 6,7% — vừa
 *  trong ±10% nếu điểm ước lượng gần 0 (T1 §4.2). */
export function welchCI(retryFps, singleFps) {
  const nr = retryFps.length;
  const ns = singleFps.length;
  const mr = mean(retryFps);
  const ms = mean(singleFps);
  const vr = sd(retryFps) ** 2;
  const vs = sd(singleFps) ** 2;
  const se = Math.sqrt(vr / nr + vs / ns);
  const dfNum = (vr / nr + vs / ns) ** 2;
  const dfDen = (vr / nr) ** 2 / (nr - 1) + (vs / ns) ** 2 / (ns - 1);
  const df = dfDen > 0 ? dfNum / dfDen : 1;
  // t 97,5% rút gọn theo df (đủ chính xác cho quyết định khóa ±10%).
  const tTable = [[1, 12.706], [2, 4.303], [3, 3.182], [4, 2.776], [5, 2.571], [6, 2.447], [7, 2.365], [8, 2.306], [9, 2.262], [10, 2.228], [12, 2.179], [14, 2.145], [16, 2.12], [20, 2.086], [30, 2.042], [60, 2.0], [1e9, 1.96]];
  let t = 1.96;
  for (const [d, v] of tTable) { if (df <= d) { t = v; break; } }
  const diff = ms - mr;
  const half = t * se;
  return { diff: +diff.toFixed(3), se: +se.toFixed(3), df: +df.toFixed(1), tCrit: t, lo: +(diff - half).toFixed(3), hi: +(diff + half).toFixed(3), half: +half.toFixed(3), bandPctOfRetryMean: +((half / Math.abs(mr)) * 100).toFixed(2) };
}

/** Kiểm tra trôi trong phiên: nửa đầu / nửa sau theo thứ tự nhận. */
export function driftCheck(acceptedOrdered) {
  const perSide = {};
  for (const side of ["retry", "single"]) {
    const runs = acceptedOrdered.filter((r) => r.variant === side);
    const half = Math.floor(runs.length / 2);
    if (runs.length < 4 || half === 0) {
      perSide[side] = { n: runs.length, status: "insufficient", note: "cần ≥ 4 accepted/phía mới kiểm tra trôi có ý nghĩa" };
      continue;
    }
    const first = median(runs.slice(0, half).map((r) => r.fps));
    const second = median(runs.slice(half).map((r) => r.fps));
    const pct = ((second - first) / first) * 100;
    perSide[side] = {
      n: runs.length, firstHalfMedian: +first.toFixed(3), secondHalfMedian: +second.toFixed(3),
      driftPct: +pct.toFixed(2), pass: Math.abs(pct) <= SOLO.driftBandPct,
    };
  }
  const pass = Object.values(perSide).every((p) => p.status === "insufficient" || p.pass);
  return { perSide, pass, note: "drift > 10% một phía → phiên gắn cờ trôi, không tuyên bố khóa từ số gộp (T1 §4.4)" };
}

/** Thứ tự chạy: xen kẽ, bắt đầu retry, theo khối blockSize. */
export function planOrder(targetPerSide, blockSize = SOLO.blockSize) {
  const order = [];
  let r = 0;
  let s = 0;
  while (r < targetPerSide || s < targetPerSide) {
    for (let i = 0; i < blockSize / 2 && (r < targetPerSide || s < targetPerSide); i++) {
      if (r < targetPerSide) { order.push("retry"); r++; }
      if (s < targetPerSide) { order.push("single"); s++; }
    }
  }
  return order;
}

export function buildSummary(acceptedOrdered, excluded, meta = {}) {
  const retryAcc = acceptedOrdered.filter((r) => r.variant === "retry");
  const singleAcc = acceptedOrdered.filter((r) => r.variant === "single");
  const retry = summarizeSide(retryAcc);
  const single = summarizeSide(singleAcc);
  const ci = retry.n >= 2 && single.n >= 2
    ? welchCI(retry.fps, single.fps)
    : { note: "cần ≥ 2 accepted/phía mới tính CI" };
  const drift = driftCheck(acceptedOrdered);
  const enough = retry.n >= SOLO.targetPerSide && single.n >= SOLO.targetPerSide;
  const ciWithin = ci.lo !== undefined && ci.hi !== undefined
    && ci.lo >= -0.1 * retry.mean && ci.hi <= 0.1 * retry.mean;
  const locked = enough && drift.pass && ciWithin;
  return {
    protocol: SOLO.protocol, gate: SOLO.gateVersion, ...meta,
    counts: { retryAccepted: retry.n, singleAccepted: single.n, excluded: excluded.length, targetPerSide: SOLO.targetPerSide },
    retry, single, pairsByAcceptanceOrder: pairwiseRatios(retryAcc, singleAcc),
    welchCI95SingleMinusRetry: ci, drift,
    lock: {
      locked, conditions: { enoughAccepted: enough, driftPass: drift.pass, ciWithinPlusMinus10PctOfRetryMean: ciWithin },
      verdict: locked
        ? "KHÓA ĐƯỢC hiệu ứng <10% (đủ 8/phía, trôi đạt, CI Welch 95% trong ±10% trung bình retry)"
        : "CHƯA KHÓA — thiếu ít nhất một điều kiện (xem conditions)",
    },
    excluded: excluded.map((e) => ({ run: e.run, variant: e.variant, reason: e.reason })),
  };
}

// --- Dry-run (không browser) ------------------------------------------

export function checkFrozenDist(variant, dir) {
  const problems = [];
  const exp = SOLO.expectedBundle[variant];
  if (!fs.existsSync(dir)) return { variant, dir, ok: false, problems: [`thư mục đóng băng không tồn tại: ${dir}`] };
  if (!fs.existsSync(path.join(dir, "index.html"))) problems.push("thiếu index.html");
  const bundlePath = path.join(dir, "assets", exp.file);
  let bundleSha = null;
  let manifest = null;
  if (!fs.existsSync(bundlePath)) problems.push(`thiếu bundle ${exp.file}`);
  else {
    bundleSha = sha256File(bundlePath);
    if (bundleSha !== exp.sha256) problems.push(`bundle sha lệch: ${bundleSha} ≠ kỳ vọng S1 §1 ${exp.sha256}`);
  }
  try { manifest = distManifest(dir); } catch (e) { problems.push(`không tính được manifest: ${e.message}`); }
  return { variant, dir, ok: problems.length === 0, problems, bundle: exp.file, bundleSha256: bundleSha, manifestSha256: manifest?.manifestSha256 ?? null, fileCount: manifest?.fileCount ?? null };
}

export function dryRun(opts = {}) {
  const retryDist = opts.retryDist || SOLO.defaultRetryDist;
  const singleDist = opts.singleDist || SOLO.defaultSingleDist;
  const fixture = opts.fixture || SOLO.defaultFixture;
  const report = { mode: "dry-run", protocol: SOLO.protocol, gate: SOLO.gateVersion, checks: {}, ok: false };
  const problems = [];
  // 1. Không có Chrome nào khác (điều kiện solo tiên quyết).
  const chrome = chromeCount();
  report.checks.chromePre = chrome;
  if (chrome !== 0) problems.push(`pgrep Chrome = ${chrome} ≠ 0 — phiên solo CHƯA ĐỦ ĐIỀU KIỆN (phải dừng mọi luồng browser khác trước)`);
  // 2. Load pre-run.
  let pre = null;
  try {
    pre = readLoadavg();
    report.checks.preLoadavg = pre;
    if (!(pre.load1 < 2.0 && pre.load5 < 2.0 && pre.load15 < 2.0)) {
      problems.push(`load pre-run ${pre.raw} vượt 2,0 ở ít nhất một cửa sổ — chờ cửa sổ yên tĩnh rồi dry-run lại (không phải lỗi runner)`);
    }
  } catch (e) { problems.push(`không đọc được /proc/loadavg: ${e.message}`); }
  // 3. Cặp bundle đóng băng + manifest.
  report.checks.frozenDist = {
    retry: checkFrozenDist("retry", retryDist),
    single: checkFrozenDist("single", singleDist),
  };
  for (const v of ["retry", "single"]) {
    if (!report.checks.frozenDist[v].ok) problems.push(...report.checks.frozenDist[v].problems.map((p) => `[${v}] ${p}`));
  }
  // 4. Fixture.
  if (!fs.existsSync(fixture)) problems.push(`fixture không tồn tại: ${fixture} — phiên solo CHƯA ĐỦ ĐIỀU KIỆN, cần tái tạo fixture sparse-gop-flat (GOP 300, 720p, 30 s) đúng spec đợt 27 K4, không dùng file khác thay thế mà không ghi lại sha`);
  else {
    const sha = sha256File(fixture);
    const size = fs.statSync(fixture).size;
    report.checks.fixture = { path: fixture, bytes: size, sha256: sha, matchesPublished: sha === SOLO.expectedFixtureSha256 };
    if (sha !== SOLO.expectedFixtureSha256) problems.push(`fixture sha lệch: ${sha} ≠ công bố ${SOLO.expectedFixtureSha256} — phiên solo CHƯA ĐỦ ĐIỀU KIỆN, cần tái tạo/đối chiếu fixture`);
  }
  // 5. Phân loại file mẫu (không browser): các lượt đã biết.
  report.checks.sampleClassification = classifySamples(opts.oldR1 || SOLO.defaultOldR1, opts.oldB36 || SOLO.defaultOldB36);
  report.problems = problems;
  report.ok = problems.length === 0;
  report.soloReady = report.ok;
  return report;
}

/** Phân loại lại các lượt cũ đã biết bằng cổng v3 (không relabel file
 *  gốc — chỉ đọc và báo). Trả về pass/fail từng ca kỳ vọng. */
export function classifySamples(oldR1, oldB36) {
  const cases = [
    { dir: oldR1, run: "retry-a5", expect: { acceptedV3: true, decodeLabel: "HEALTHY", loadLabelV3: "quiet" } },
    { dir: oldR1, run: "single-a4", expect: { acceptedV3: false, decodeLabel: "STEADY_SLOW", gopSubtype: "SEGMENT_COLLAPSE", gopRatio: 0.214 } },
    { dir: oldB36, run: "retry-b6", expect: { acceptedV3: false, loadLabelV3: "under-load", decodeLabel: "HEALTHY" } },
    { dir: oldB36, run: "retry-b7", expect: { acceptedV3: false, loadLabelV3: "under-load" } },
    { dir: oldB36, run: "single-b7", expect: { acceptedV3: false, loadLabelV3: "under-load" } },
    { dir: oldB36, run: "retry-b8", expect: { acceptedV3: false, gopSubtype: "INDETERMINATE_MIXED", gopRatio: 0.343 } },
  ];
  const results = [];
  for (const c of cases) {
    const file = path.join(c.dir, c.run, "forward-hold.json");
    if (!fs.existsSync(file)) { results.push({ ...c, status: "missing", note: "file mẫu không còn trên đĩa — bỏ qua ca này, không bịa kết quả" }); continue; }
    const run = JSON.parse(fs.readFileSync(file, "utf8"));
    const v = classifyRunV3(run);
    const mismatches = [];
    for (const [k, want] of Object.entries(c.expect)) {
      const got = k === "gopRatio" ? v.gop?.ratio : v[k];
      if (got !== want) mismatches.push(`${k}: got ${got}, want ${want}`);
    }
    results.push({ run: c.run, status: mismatches.length ? "FAIL" : "PASS", mismatches, got: { acceptedV3: v.acceptedV3, loadLabelV3: v.loadLabelV3, decodeLabel: v.decodeLabel, gopSubtype: v.gopSubtype, gopRatio: v.gop?.ratio ?? null, fps: v.fps } });
  }
  return results;
}

export function selfTest(opts = {}) {
  const failures = [];
  // (a) Phân loại lại đúng các lượt đã biết.
  const samples = classifySamples(opts.oldR1 || SOLO.defaultOldR1, opts.oldB36 || SOLO.defaultOldB36);
  const present = samples.filter((s) => s.status !== "missing");
  const failed = present.filter((s) => s.status === "FAIL");
  if (present.length === 0) failures.push("không còn file mẫu cũ nào trên đĩa — self-test không có gì để đối chiếu");
  if (failed.length) failures.push(...failed.map((f) => `phân loại mẫu ${f.run} lệch: ${f.mismatches.join("; ")}`));
  // (b) Thống kê trên tập accepted v3 R1 đã biết (fps từ forward-hold).
  const r1 = opts.oldR1 || SOLO.defaultOldR1;
  const knownAccepted = { retry: ["retry-a4", "retry-a5", "retry-a6"], single: ["single-a1", "single-a2"] };
  const ordered = [];
  for (const side of ["retry", "single"]) {
    for (const run of knownAccepted[side]) {
      const file = path.join(r1, run, "forward-hold.json");
      if (!fs.existsSync(file)) { failures.push(`thiếu file mẫu ${run} cho thống kê self-test`); continue; }
      const j = JSON.parse(fs.readFileSync(file, "utf8"));
      const v = classifyRunV3(j);
      if (!v.acceptedV3) failures.push(`lượt ${run} kỳ vọng acceptedV3 nhưng cổng v3 trả ${v.loadLabelV3}/${v.decodeLabel}`);
      ordered.push({ run, variant: side, fps: j.reverse.fps });
    }
  }
  // Thứ tự nhận xen kẽ R1: a4→a1, a5→a2 (a6 chưa có cặp single) — kiểm
  // tra pairwise + Welch trên tập 3 vs 2 (chỉ kiểm tính chất, không
  // claim khóa: n < 8 nên lock phải = false).
  const summary = buildSummary(ordered, [], { note: "self-test trên tập R1-v3 đã biết (3 retry + 2 single) — chỉ kiểm tra hàm thống kê" });
  if (summary.lock.locked) failures.push("lỗi logic khóa: tập n < 8 không được locked");
  if (summary.pairsByAcceptanceOrder.length !== 2) failures.push(`pairwise kỳ vọng 2 cặp, got ${summary.pairsByAcceptanceOrder.length}`);
  // (c) Thứ tự khối: 8 đầu phải là retry,single × 4, bắt đầu retry.
  const order = planOrder(8);
  const first8 = order.slice(0, 8).join(",");
  if (first8 !== "retry,single,retry,single,retry,single,retry,single") failures.push(`thứ tự khối đầu lệch: ${first8}`);
  if (order.length !== 16) failures.push(`planOrder(8) kỳ vọng 16 lượt, got ${order.length}`);
  // (d) Drift: tập giả lệch > 10% phải bị gắn cờ.
  const drifted = driftCheck([
    { run: "r1", variant: "retry", fps: 9 }, { run: "r2", variant: "retry", fps: 9 },
    { run: "r3", variant: "retry", fps: 9 }, { run: "r4", variant: "retry", fps: 9 },
    { run: "r5", variant: "retry", fps: 7 }, { run: "r6", variant: "retry", fps: 7 },
    { run: "r7", variant: "retry", fps: 7 }, { run: "r8", variant: "retry", fps: 7 },
  ]);
  if (drifted.pass) failures.push("lỗi driftCheck: tập lệch 22% phải fail nhưng lại pass");
  return { mode: "self-test", ok: failures.length === 0, failures, sampleClassification: samples, summaryCheck: { pairs: summary.pairsByAcceptanceOrder, welch: summary.welchCI95SingleMinusRetry, lockLocked: summary.lock.locked, planFirst8: first8, driftFlagged: !drifted.pass } };
}

// --- Per-seek wiring (đợt 40 V1 — nối probe T2 vào JSON lượt solo) ---

/** Trích báo cáo per-seek thật từ một forward-hold.json đã đọc.
 *  Hàm thuần, có test — đây là seam mà runOneVariant dùng, để việc
 *  đọc/báo cáo perSeek được kiểm chứng mà không cần chạy browser.
 *  Không validate sâu, không suy diễn cơ chế: chỉ copy đúng những gì
 *  harness N2 đã ghi (entries thô + summary do N2 tính), và phân
 *  biệt rõ 3 trạng thái để không bao giờ đọc "absent" thành "có":
 *   - "present": perSeekEnabled=true và có entries (kể cả 0 entry —
 *     0 entry trên đường WebCodecs là đúng, xem LIMITS T2 §1).
 *   - "absent": cờ tắt hoặc forward-hold cũ không có trường này.
 *   - "enabled-but-missing": cờ bật nhưng không có perSeek.entries —
 *     probe bật mà không trả dữ liệu, phải kiểm tra log N2 trước khi
 *     đọc bất kỳ kết luận cơ chế nào (không im lặng coi như absent).
 *  LƯU Ý: entries được copy nguyên vẹn vào JSON lượt solo (không tóm
 *  tắt, không bịa thêm) để phiên solo sau này đọc được mechanism từ
 *  summaryReverse mà N2 đã tính; nhãn cơ chế vẫn là heuristic mô tả
 *  của T2, không phải cổng nhận/loại. */
export function extractPerSeekReport(raw) {
  const enabled = raw?.perSeekEnabled === true;
  if (!enabled) {
    return {
      status: "absent",
      perSeekEnabled: raw?.perSeekEnabled ?? false,
      note: "harness N2 không ghi perSeek (N2_PERSEEK chưa bật hoặc forward-hold cũ); lượt này không claim cơ chế sụp đoạn",
    };
  }
  const ps = raw?.perSeek;
  if (!ps || !Array.isArray(ps.entries)) {
    return {
      status: "enabled-but-missing",
      perSeekEnabled: true,
      note: "N2_PERSEEK=1 nhưng forward-hold.json không có perSeek.entries — probe bật mà không trả dữ liệu, kiểm tra log N2 trước khi đọc cơ chế",
    };
  }
  return {
    status: "present",
    perSeekEnabled: true,
    version: ps.version ?? null,
    gopSeconds: ps.gopSeconds ?? null,
    entryCount: ps.entries.length,
    counts: ps.counts ?? null,
    marks: ps.marks ?? [],
    summaryAll: ps.summaryAll ?? null,
    summaryReverse: ps.summaryReverse ?? null,
    entries: ps.entries,
  };
}

/** Env mà chế độ run spawn probe Q6. Tách thành hàm thuần để test được
 *  luồng cờ N2_PERSEEK: hàm chỉ spread process.env rồi ghi đè đúng 6
 *  khóa Q6_* — KHÔNG đặt, KHÔNG xóa, KHÔNG ghi đè N2_PERSEEK hay
 *  N2_PERSEEK_GOP_SEC, nên cờ đặt ở môi trường ngoài solo sẽ tới Q6
 *  nguyên vẹn; Q6 cũng spread process.env khi spawn N2 và không ghi
 *  đè N2_PERSEEK (xem probe Q6, env spawn), N2 đọc
 *  process.env.N2_PERSEEK === "1" để bật probe. Ngược lại, khi cờ
 *  không đặt ở ngoài, hàm này không tự sinh cờ — đường đo mặc định
 *  vẫn TẮT như thiết kế T2. */
export function buildProbeEnv({ fixture, scratch, display, port, distDir }) {
  return {
    ...process.env,
    Q6_VIDEO: fixture,
    Q6_SCRATCH: scratch,
    Q6_DISPLAY: display,
    Q6_PORT: String(port),
    Q6_OUT: path.join(scratch, "q6-labeled.json"),
    Q6_DIST: distDir,
  };
}

// --- Chế độ run (CHƯA chạy ở đợt 38 — code cho phiên solo tương lai) --

function sleepSync(ms) {
  spawnSync("sleep", [String(Math.max(0, ms / 1000))]);
}

function waitForQuietGate() {
  let attempts = 0;
  while (true) {
    const deadline = Date.now() + SOLO.gateWaitSec * 1000;
    while (Date.now() < deadline) {
      const load = readLoadavg();
      const chrome = chromeCount();
      if (load.load1 < 2.0 && load.load5 < 2.0 && load.load15 < 2.0 && chrome === 0) {
        return { ok: true, preLoadavg: load, preChrome: chrome };
      }
      sleepSync(SOLO.gatePollSec * 1000);
    }
    attempts++;
    if (attempts > SOLO.gateRetries) return { ok: false, reason: `gate-timeout sau ${SOLO.gateRetries + 1} lần chờ 10 phút` };
  }
}

function runOneVariant({ variant, attemptNo, cfg, state }) {
  const distDir = variant === "retry" ? cfg.retryDist : cfg.singleDist;
  const runId = `solo-${variant}-s${attemptNo}`;
  const scratch = path.join(cfg.scratchBase, runId);
  fs.mkdirSync(scratch, { recursive: true });
  const outPath = path.join(cfg.outDir, `v38-solo-seek-ab-${runId}.json`);
  // Cổng tiền kiểm solo (T1 §4.3).
  const gate = waitForQuietGate();
  if (!gate.ok) {
    const rec = { run: runId, variant, attempt: attemptNo, counted: false, status: "gate-timeout", reason: gate.reason };
    writeFileEpermRetry(outPath, JSON.stringify(rec, null, 2));
    return rec;
  }
  const frozenBefore = distManifest(distDir);
  const bundlePath = path.join(distDir, "assets", SOLO.expectedBundle[variant].file);
  const bundleBefore = fs.existsSync(bundlePath) ? sha256File(bundlePath) : null;
  if (bundleBefore !== SOLO.expectedBundle[variant].sha256 || frozenBefore.manifestSha256 !== state.manifestSha256[variant]) {
    console.error(`[${runId}] INVALID: dist đóng băng đổi trước lượt — dừng phiên (exit 3).`);
    process.exit(3);
  }
  // Đợt 40 V1: env qua buildProbeEnv để N2_PERSEEK (nếu đặt ngoài solo)
  // chảy nguyên vẹn solo → Q6 → N2; không đặt cờ ở đây (xem buildProbeEnv).
  const env = buildProbeEnv({ fixture: cfg.fixture, scratch, display: cfg.display, port: cfg.port, distDir });
  const q6 = spawnSync("node", [PROBE_Q6, "run"], { env, encoding: "utf8" });
  const postLoad = readLoadavg();
  const postChrome = chromeCount();
  const frozenAfter = distManifest(distDir);
  const bundleAfter = fs.existsSync(bundlePath) ? sha256File(bundlePath) : null;
  const forwardHoldPath = path.join(scratch, "forward-hold.json");
  if (q6.status !== 0 || !fs.existsSync(forwardHoldPath)) {
    const rec = { run: runId, variant, attempt: attemptNo, counted: true, status: "NO_RESULT", q6Exit: q6.status, q6Log: q6.stdout?.slice(-500) ?? "", reason: "probe Q6 không trả forward-hold.json" };
    writeFileEpermRetry(outPath, JSON.stringify(rec, null, 2));
    return rec;
  }
  if (frozenAfter.manifestSha256 !== frozenBefore.manifestSha256 || bundleAfter !== bundleBefore) {
    console.error(`[${runId}] INVALID: dist đóng băng đổi giữa lượt — lượt bị loại, dừng phiên (exit 3).`);
    const rec = { run: runId, variant, attempt: attemptNo, counted: true, status: "INVALID", reason: "manifest/bundle đóng băng đổi giữa lượt" };
    writeFileEpermRetry(outPath, JSON.stringify(rec, null, 2));
    process.exit(3);
  }
  const labeled = JSON.parse(fs.readFileSync(path.join(scratch, "q6-labeled.json"), "utf8"));
  const raw = JSON.parse(fs.readFileSync(forwardHoldPath, "utf8"));
  const merged = {
    run: runId, variant, attempt: attemptNo, bundle: labeled.bundle,
    bundleSha256: bundleBefore, frozenDist: distDir,
    frozenShaBefore: frozenBefore.manifestSha256, frozenShaAfter: frozenAfter.manifestSha256,
    pre: { loadavg: gate.preLoadavg.raw, chromePre: gate.preChrome, top: labeled.machine?.processes?.pre?.top ?? null },
    post: { loadavg: postLoad.raw, chromePost: postChrome },
    q6Exit: q6.status, n2Verdict: labeled.n2Verdict,
    loadLabel: labeled.loadLabel, load: labeled.load, machine: labeled.machine,
    reverseFps: labeled.reverse?.fps ?? raw.reverse?.fps ?? null,
    forwardInterpRate: labeled.forward?.interpRate ?? null,
    q6LabeledPath: path.join(scratch, "q6-labeled.json"),
    frozenDistValidity: labeled.frozenDist ?? null,
  };
  const solo = verifySolo(raw, merged);
  const accepted = solo.soloEligible && solo.acceptedV3;
  const rec = {
    ...merged, verifySolo: solo, acceptedV3: solo.acceptedV3, soloEligible: solo.soloEligible,
    accepted: accepted, fps: solo.fps,
    exclusionReasons: accepted ? [] : [...(solo.soloProblems || []), ...(solo.acceptedV3 ? [] : [`không acceptedV3 (load ${solo.loadLabelV3}, decode ${solo.decodeLabel})`])],
    // Đợt 40 V1: đọc perSeek thật từ forward-hold.json của lượt (khi
    // có) thay cho chuỗi "absent" hardcode cũ; khi cờ tắt vẫn báo
    // absent rõ ràng, không bịa entry (xem extractPerSeekReport).
    perSeekProbe: extractPerSeekReport(raw),
  };
  writeFileEpermRetry(outPath, JSON.stringify(rec, null, 2));
  return rec;
}

function runSession(cfg) {
  fs.mkdirSync(cfg.outDir, { recursive: true });
  fs.mkdirSync(cfg.scratchBase, { recursive: true });
  // Đóng băng manifest ngay đầu phiên; mọi lượt đối chiếu với giá trị này.
  const manifestSha256 = {};
  for (const v of ["retry", "single"]) {
    const dir = v === "retry" ? cfg.retryDist : cfg.singleDist;
    const chk = checkFrozenDist(v, dir);
    if (!chk.ok) { console.error(`Phiên solo CHƯA ĐỦ ĐIỀU KIỆN [${v}]: ${chk.problems.join("; ")}`); process.exit(2); }
    manifestSha256[v] = chk.manifestSha256;
  }
  if (!fs.existsSync(cfg.fixture) || sha256File(cfg.fixture) !== SOLO.expectedFixtureSha256) {
    console.error("Phiên solo CHƯA ĐỦ ĐIỀU KIỆN: fixture thiếu hoặc sha lệch."); process.exit(2);
  }
  if (chromeCount() !== 0) { console.error("Phiên solo CHƯA ĐỦ ĐIỀU KIỆN: còn Chrome khác đang chạy."); process.exit(2); }
  const state = { manifestSha256 };
  // --resume: đọc lại các lượt đã ghi để không chạy trùng.
  const acceptedOrdered = [];
  const excluded = [];
  let runsDone = 0;
  if (cfg.resume) {
    for (const f of fs.readdirSync(cfg.outDir).filter((x) => x.startsWith("v38-solo-seek-ab-") && x.endsWith(".json")).sort()) {
      const rec = JSON.parse(fs.readFileSync(path.join(cfg.outDir, f), "utf8"));
      if (rec.counted === false) continue;
      runsDone++;
      if (rec.accepted) acceptedOrdered.push({ run: rec.run, variant: rec.variant, fps: rec.fps });
      else excluded.push({ run: rec.run, variant: rec.variant, reason: (rec.exclusionReasons || [rec.status]).join("; ") });
    }
    console.log(`[solo] --resume: đã có ${runsDone} lượt, accepted retry=${acceptedOrdered.filter((r) => r.variant === "retry").length} single=${acceptedOrdered.filter((r) => r.variant === "single").length}`);
  }
  const attemptNo = { retry: 0, single: 0 };
  // Đếm attempt đã dùng khi resume (để runId không trùng).
  if (cfg.resume) {
    for (const r of [...acceptedOrdered, ...excluded]) {
      const m = r.run.match(/-s(\d+)$/);
      if (m) attemptNo[r.variant] = Math.max(attemptNo[r.variant], Number(m[1]));
    }
  }
  let gateTimeoutStreak = 0;
  while (runsDone < SOLO.maxRuns) {
    const accR = acceptedOrdered.filter((r) => r.variant === "retry").length;
    const accS = acceptedOrdered.filter((r) => r.variant === "single").length;
    if (accR >= SOLO.targetPerSide && accS >= SOLO.targetPerSide) {
      const summary = buildSummary(acceptedOrdered, excluded, { session: "solo", completedAt: new Date().toISOString() });
      writeFileEpermRetry(path.join(cfg.outDir, "v38-solo-seek-ab-summary.json"), JSON.stringify(summary, null, 2));
      console.log(`[solo] đủ 8/phía. locked=${summary.lock.locked} — ${summary.lock.verdict}`);
      process.exit(0);
    }
    // Xen kẽ nghiêm ngặt theo số lượt đã tính (không theo số accepted):
    // lượt chẵn → retry, lượt lẻ → single, nên lượt bị loại không làm
    // lệch nhịp xen kẽ và khối 8 luôn là 4 retry + 4 single.
    const totalSoFar = acceptedOrdered.length + excluded.length;
    const nextVariant = totalSoFar % 2 === 0 ? "retry" : "single";
    attemptNo[nextVariant]++;
    const rec = runOneVariant({ variant: nextVariant, attemptNo: attemptNo[nextVariant], cfg, state });
    if (rec.counted === false) {
      gateTimeoutStreak++;
      if (gateTimeoutStreak > SOLO.gateRetries) { console.log("[solo] dừng phiên: gate-timeout lặp lại — xem lại máy, không cố chạy trong tải cao."); break; }
      continue;
    }
    gateTimeoutStreak = 0;
    runsDone++;
    if (rec.accepted) acceptedOrdered.push({ run: rec.run, variant: rec.variant, fps: rec.fps });
    else excluded.push({ run: rec.run, variant: rec.variant, reason: (rec.exclusionReasons || [rec.status]).join("; ") });
    const summary = buildSummary(acceptedOrdered, excluded, { session: "solo", runsDone, updatedAt: new Date().toISOString() });
    writeFileEpermRetry(path.join(cfg.outDir, "v38-solo-seek-ab-summary.json"), JSON.stringify(summary, null, 2));
    console.log(`[solo] ${rec.run} accepted=${rec.accepted} fps=${rec.fps} (accepted retry=${summary.counts.retryAccepted} single=${summary.counts.singleAccepted}, runsDone=${runsDone})`);
  }
  const summary = buildSummary(acceptedOrdered, excluded, { session: "solo", runsDone, completedAt: new Date().toISOString(), note: "hết trần 48 lượt hoặc dừng sớm — xem lock.conditions" });
  writeFileEpermRetry(path.join(cfg.outDir, "v38-solo-seek-ab-summary.json"), JSON.stringify(summary, null, 2));
  console.log(`[solo] kết thúc: runsDone=${runsDone} locked=${summary.lock.locked} — ${summary.lock.verdict}`);
}

// --- CLI ---------------------------------------------------------------
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.mode = "dry-run";
    else if (a === "--self-test") opts.mode = "self-test";
    else if (a === "run") opts.mode = "run";
    else if (a === "--resume") opts.resume = true;
    else if (a.startsWith("--")) opts[a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[++i];
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.mode === "dry-run") {
    const report = dryRun({ retryDist: opts.retryDist, singleDist: opts.singleDist, fixture: opts.fixture, oldR1: opts.oldR1, oldB36: opts.oldB36 });
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 2);
  }
  if (opts.mode === "self-test") {
    const report = selfTest({ oldR1: opts.oldR1, oldB36: opts.oldB36 });
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 2);
  }
  if (opts.mode === "run") {
    if (!opts.outDir || !opts.scratchBase) {
      console.error("run cần --out-dir và --scratch-base"); process.exit(2);
    }
    runSession({
      outDir: opts.outDir, scratchBase: opts.scratchBase,
      retryDist: opts.retryDist || SOLO.defaultRetryDist,
      singleDist: opts.singleDist || SOLO.defaultSingleDist,
      fixture: opts.fixture || SOLO.defaultFixture,
      display: opts.display || ":91", port: Number(opts.port || 4191),
      resume: !!opts.resume,
    });
    return;
  }
  console.error("Cách dùng: seek-ab-solo-run.mjs --dry-run | --self-test | run --out-dir DIR --scratch-base DIR [--display :91] [--port 4191] [--resume]");
  process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
