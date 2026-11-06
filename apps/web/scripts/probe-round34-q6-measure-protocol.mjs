#!/usr/bin/env node
/**
 * Phase 9 đợt 34, luồng Q6 — Hiện thực hoá "quy tắc đo fps ngược" (Round 33
 * §3 mục 2, từ P5 §7.5) thành probe đo chuẩn có thể tái dùng.
 *
 * Quy tắc (cấm so sánh hồi quy giữa các phiên khác chế độ tải):
 *  Mỗi lần đo fps ngược PHẢI ghi kèm, trong cùng 1 file output:
 *   (a) tải máy: loadavg 1/5/15 phút trước + trong + sau lượt (đọc
 *       /proc/loadavg), top tiến trình theo %CPU, số tiến trình Chrome
 *       đang chạy TRƯỚC lượt (đối chứng "có luồng browser khác không");
 *   (b) tốc độ phát XUÔI cùng bundle (forward.interpRate của harness N2 —
 *       đối chứng rẻ: phát xuôi decode tuần tự, hold ~0, nên tốc độ xuôi
 *       lệch khỏi 1.00 phản ánh tải máy chứ không phản ánh seek);
 *   (c) gap rAF phase xuôi (gapP50 + số gap >100 ms trừ tick biên —
 *       đối chứng main thread có đói không);
 *   (d) nhãn chế độ tải loadLabel: "quiet" hoặc "under-load" (+ lý do),
 *       và câu comparability: chỉ so sánh hồi quy giữa các lượt CÙNG
 *       loadLabel (và cùng bundle, hoặc A/B cùng phiên). Số under-load
 *       KHÔNG được dùng làm baseline quiet.
 *
 * Phân loại QUIET (ngưỡng hiệu chuẩn từ dữ liệu đã đo, xem LIMITS Q6):
 *   load1 trước-xuôi, trước-ngược và cuối lượt đều < 2.0 (máy 4 vCPU →
 *   < 0,5/core; cụm quiet của P5 đợt 33: 0.81–1.68, cụm tải đợt 32:
 *   2.85–8.74 — ngưỡng 2.0 nằm giữa hai cụm);
 *   forward interpRate trong [0.98, 1.02] (cận "rAF khỏe" của P5: ≥ 0.98;
 *   cụm quiet đợt 33: 1.001–1.010, lượt đói rAF đợt 32: 0.648);
 *   gap rAF P50 phase xuôi ≤ 0.015 s (cụm quiet ~5–8 ms);
 *   predictedRate phase xuôi (trừ tick biên) ≥ 0.98 — tức tổng thời gian
 *   mất do các gap >100 ms (trừ tick biên) dưới 2% thời lượng phase;
 *   số tiến trình Chrome trước lượt = 0 (không có browser luồng khác).
 *   VI PHẠM BẤT KỲ ĐIỀU NÀO → under-load, kèm đủ lý do.
 *   Lưu ý có chủ ý: gap rAF phase NGƯỢC không dùng để phân loại — phase
 *   ngược đi qua seek/decode từng frame nên gap dài có thể là chi phí
 *   seek thật, không phải tải máy; phase xuôi mới là đối chứng sạch.
 *   Loadavg 1 phút là trung bình trượt (P5 §1.1: load 7.47 vẫn có rAF
 *   khỏe) nên KHÔNG BAO GIỜ phân loại chỉ bằng loadavg một mình.
 *   LỊCH SỬ HIỆU CHUẨN (ghi rõ, không sửa lén): bản v1 yêu cầu số gap
 *   >100 ms (trừ tick biên) = 0 tuyệt đối, nhưng kiểm tra lại cụm
 *   quiet đợt 33 của P5 cho thấy 2/6 lượt quiet có đúng 1 gap như vậy
 *   (lost 0.024–0.028 s, predictedRate trừ tick biên 0.993) — ngưỡng
 *   v1 quá chặt so với chính dữ liệu quiet đã công nhận. Bản v2 đổi
 *   sang tiêu chí lost-rate (predictedRate ≥ 0.98): cụm quiet đợt 33
 *   đạt 0.993–0.999, lượt đói đợt 34 đạt 0.624 — biên cách xa cả hai
 *   phía. Mọi lượt đợt 34 đều được phân loại lại bằng v2 ở cuối đợt;
 *   file labeled ghi protocol "v2".
 *
 * Cách dùng:
 *   Đo mới (bọc harness N2 nguyên vẹn, không sửa 1 dòng):
 *     Q6_VIDEO=<fixture.mp4> Q6_SCRATCH=<scratch lượt> Q6_DISPLAY=:91 \
 *     Q6_PORT=4191 Q6_OUT=<labeled.json> \
 *       node apps/web/scripts/probe-round34-q6-measure-protocol.mjs run
 *   Phân loại lại 1 forward-hold.json cũ (không chạy browser):
 *     node apps/web/scripts/probe-round34-q6-measure-protocol.mjs classify \
 *       <forward-hold.json> [pre-chrome-count]
 *     (lượt cũ thiếu snapshot tiến trình → output ghi rõ
 *     processSnapshot: "missing", nhãn vẫn tính từ load+fwd+rAF như
 *     cách P5 đã làm, kèm caveat đó.)
 * Thoát (mode run): 0 = đã gắn nhãn (kể cả under-load — gắn nhãn thành
 * công cũng là kết quả); 1 = harness PARTIAL nhưng vẫn gắn nhãn được
 * (fps vẫn dùng được, xem P5 về PARTIAL mẫu chuyển tiếp); 2 = blocker
 * (harness exit 2 hoặc thiếu forward-hold.json → NO_RESULT, không nhãn).
 * 3 = INVALID do dist đóng băng đổi giữa chừng (xem dưới) — file labeled
 * vẫn ghi đủ để làm bằng chứng loại lượt, nhưng fps của lượt đó KHÔNG
 * được dùng làm baseline.
 * KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG build lại
 * dist (harness N2 tự snapshot dist hiện tại; Q6 không build để khỏi đua
 * với luồng khác).
 *
 * Phase 9 đợt 35 R2 — DIST ĐÓNG BĂNG (hiện thực hoá Q6 §5.8, đợt 34):
 *   Q6_DIST=<đường dẫn tuyệt đối tới 1 bản sao dist đã đóng băng>
 * Khi đặt Q6_DIST, probe:
 *   (1) TỪ CHỐI chạy (exit 2) nếu Q6_DIST không tồn tại, thiếu
 *       index.html, hoặc thiếu bundle .js trong assets/;
 *   (2) tính manifest sha256 đệ quy (mọi file, sắp xếp theo đường dẫn
 *       tương đối) của Q6_DIST TRƯỚC lượt và SAU lượt;
 *   (3) truyền N2_DIST=Q6_DIST cho harness N2 để N2 snapshot đúng bản
 *       sao đóng băng thay vì apps/web/dist đang bị luồng khác build
 *       lại; sau lượt còn đối chiếu manifest của snapshot dist-snap
 *       của N2 với manifest đóng băng;
 *   (4) nếu manifest trước ≠ sau, hoặc bundle trong forward-hold.json
 *       ≠ bundle của dist đóng băng, hoặc snapshot ≠ đóng băng → ghi
 *       labeled với frozenDist.valid=false, validity="INVALID" và
 *       thoát 3. Lượt INVALID bị loại khỏi mọi baseline, kể cả khi
 *       loadLabel=quiet — quiet trên bundle trôi không phải baseline.
 * Khi KHÔNG đặt Q6_DIST, giữ đúng hành vi đợt 34 (snapshot dist trên
 * đĩa, frozenDist=null, không có bảo đảm đóng băng) để lượt cũ không
 * đổi ngữ nghĩa. Đặt Q6_DIST là cách duy nhất để claim "cùng bundle"
 * cho 1 batch baseline trong đợt có nhiều luồng build song song.
 *
 * ROUND43-Y5 — Q6 LABELED MANG perSeek (đóng nợ V1 §4.3 / đợt 42
 * §5.6): labeled nay copy nguyên vẹn đối tượng perSeek của
 * forward-hold.json (khi probe bật) sang trường top-level `perSeek`.
 * Lý do: labeled là file bằng chứng bền, mang đi được của lượt đo,
 * trong khi forward-hold chỉ nằm trong scratch của N2 (phù du, labeled
 * cũ chỉ trỏ tới n2Log); ai chỉ giữ labeled thì mất sạch bằng chứng cơ
 * chế, và hai góc nhìn bằng chứng mâu thuẫn nhau (solo present nhưng
 * Q6 absent). Copy là passthrough thuần, không đo thêm, không đổi logic
 * nhãn/fps, không đổi probe/N2/solo/cổng. Ngữ nghĩa trường:
 *   - `perSeek` là object đầy đủ (kể cả entries + mẫu seeking) khi probe
 *     bật — copy nguyên vẹn, không pick field, nên 17 trường spec của
 *     mỗi entry không thể rơi mất do pick sót;
 *   - `perSeek: null` khi probe tắt hoặc harness cũ không ghi perSeek
 *     (lượt mới của Q6 luôn có khóa, giá trị null = "lượt này không
 *     ghi perSeek");
 *   - khóa VẮNG MẶT chỉ gặp ở file labeled cũ (trước Y5) = "không rõ,
 *     không được đọc thành probe tắt hay probe bật".
 * Mọi khóa labeled cũ giữ nguyên tên/giá trị (chỉ thêm 1 khóa); file
 * labeled cũ vẫn đọc được (người đọc mới phải coi vắng khóa là unknown).
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const N2 = path.resolve(import.meta.dirname, "clicktest-round31-n2-reverse-fps-pipe.mjs");
const LOAD1_QUIET_MAX = 2.0;
const FWD_MIN = 0.98;
const FWD_MAX = 1.02;
const RAF_P50_MAX = 0.015;
const RAF_PRED_MIN = 0.98;

function loadavg() {
  try {
    const parts = fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/);
    return { load1: Number(parts[0]), load5: Number(parts[1]), load15: Number(parts[2]), raw: parts.slice(0, 3).join(" ") };
  } catch { return { load1: null, load5: null, load15: null, raw: "unknown" }; }
}
function topProcesses(limit = 8) {
  try {
    const out = spawnSync("ps", ["-eo", "pid,pcpu,comm,args", "--sort=-pcpu"], { encoding: "utf8" }).stdout || "";
    return out.split("\n").slice(1).filter(Boolean).slice(0, limit).map((line) => line.trim().replace(/\s+/g, " ").slice(0, 160));
  } catch { return ["ps unavailable"]; }
}
function chromeCount() {
  try {
    const out = spawnSync("pgrep", ["-f", "chrome-linux64/chrome|meta-chromium/chrome"], { encoding: "utf8" }).stdout || "";
    return out.split("\n").filter(Boolean).length;
  } catch { return 0; }
}
/** Manifest sha256 đệ quy của 1 thư mục dist: {files, manifestSha256}.
 *  files: [{rel, sha256}] sắp xếp theo rel; manifestSha256 = sha256 của
 *  các dòng "sha256  rel" nối bằng \n. Dùng để phát hiện MỌI thay đổi
 *  của dist đóng băng giữa chừng (kể cả file không phải bundle). */
export function distManifest(dir) {
  const files = [];
  const walk = (d, relBase) => {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)); }
    catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) walk(full, rel);
      else if (e.isFile()) {
        try { files.push({ rel, sha256: crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex") }); }
        catch { files.push({ rel, sha256: "unreadable" }); }
      }
    }
  };
  walk(dir, "");
  files.sort((a, b) => (a.rel < b.rel ? -1 : 1));
  const manifestSha256 = crypto.createHash("sha256").update(files.map((f) => `${f.sha256}  ${f.rel}`).join("\n")).digest("hex");
  return { dir, fileCount: files.length, manifestSha256, files };
}
function frozenBundleName(dir) {
  try {
    const assets = path.join(dir, "assets");
    return fs.readdirSync(assets).find((f) => f.endsWith(".js")) ?? null;
  } catch { return null; }
}

function load1Of(loadStr) {
  if (typeof loadStr !== "string") return null;
  const n = Number(loadStr.trim().split(/\s+/)[0]);
  return Number.isFinite(n) ? n : null;
}

/** Phân loại 1 lượt từ dữ liệu harness N2 + snapshot tiến trình. */
export function classifyRun(n2, proc) {
  const reasons = [];
  const loadBeforeFwd = load1Of(n2?.load?.beforeFwd);
  const loadBeforeRev = load1Of(n2?.load?.beforeRev);
  const loadAtEnd = load1Of(n2?.load?.atEnd);
  const fwd = n2?.forward?.interpRate ?? null;
  const rafFwd = n2?.raf?.forward ?? null;
  const rafP50 = rafFwd?.gapP50 ?? null;
  const over100excl = rafFwd?.exclFirst?.countOver100ms ?? null;
  const predExcl = rafFwd?.exclFirst?.predictedRate ?? null;
  if (loadBeforeFwd === null || loadBeforeRev === null || loadAtEnd === null) reasons.push("thiếu loadavg N2");
  else {
    if (loadBeforeFwd >= LOAD1_QUIET_MAX) reasons.push(`load1 trước-xuôi ${loadBeforeFwd} ≥ ${LOAD1_QUIET_MAX}`);
    if (loadBeforeRev >= LOAD1_QUIET_MAX) reasons.push(`load1 trước-ngược ${loadBeforeRev} ≥ ${LOAD1_QUIET_MAX}`);
    if (loadAtEnd >= LOAD1_QUIET_MAX) reasons.push(`load1 cuối lượt ${loadAtEnd} ≥ ${LOAD1_QUIET_MAX}`);
  }
  if (fwd === null) reasons.push("thiếu forward.interpRate");
  else if (fwd < FWD_MIN || fwd > FWD_MAX) reasons.push(`tốc độ xuôi ${fwd} ngoài [${FWD_MIN}, ${FWD_MAX}]`);
  if (rafP50 === null) reasons.push("thiếu gap rAF P50 phase xuôi");
  else if (rafP50 > RAF_P50_MAX) reasons.push(`gap rAF P50 xuôi ${rafP50}s > ${RAF_P50_MAX}s`);
  if (predExcl === null) reasons.push("thiếu predictedRate phase xuôi (trừ tick biên)");
  else if (predExcl < RAF_PRED_MIN) reasons.push(`predictedRate xuôi (trừ tick biên) ${predExcl} < ${RAF_PRED_MIN} (mất do gap >100ms, trừ tick biên: ${rafFwd?.exclFirst?.lostSec ?? "?"}s / ${over100excl ?? "?"} gap)`);
  if (proc && typeof proc.chromePre === "number" && proc.chromePre !== 0) reasons.push(`có ${proc.chromePre} tiến trình Chrome trước lượt (luồng browser khác)`);
  const label = reasons.length === 0 ? "quiet" : "under-load";
  return {
    loadLabel: label,
    labelReasons: reasons,
    signals: {
      load1: { beforeFwd: loadBeforeFwd, beforeRev: loadBeforeRev, atEnd: loadAtEnd },
      forwardInterpRate: fwd,
      rafForward: rafFwd ? { gapP50: rafFwd.gapP50, gapP95: rafFwd.gapP95, gapMax: rafFwd.gapMax, countOver100ms: rafFwd.countOver100ms, exclFirstOver100ms: over100excl, exclFirstLostSec: rafFwd.exclFirst?.lostSec ?? null, exclFirstPredictedRate: predExcl, predictedRate: rafFwd.predictedRate } : null,
      rafReverse: n2?.raf?.reverse ? { gapP50: n2.raf.reverse.gapP50, gapP95: n2.raf.reverse.gapP95, predictedRate: n2.raf.reverse.predictedRate } : null,
    },
  };
}

// ROUND43-Y5: export để test seam Q6 (không đổi ngữ nghĩa buildLabeled).
export function buildLabeled(n2, proc, extra = {}) {
  const cls = classifyRun(n2, proc);
  return {
    protocol: "q6-measure-protocol v2 (Round 33 §3.2 / P5 §7.5; v1→v2: gap-count tuyệt đối đổi thành lost-rate, xem header)",
    runAt: new Date().toISOString(),
    bundle: n2?.bundle ?? null,
    video: n2?.video ?? null,
    n2Verdict: n2?.verdict ?? null,
    load: n2?.load ?? null,
    machine: { nproc: os.cpus().length, processes: proc },
    forward: { interpRate: n2?.forward?.interpRate ?? null, playheadRate: n2?.forward?.playheadRate ?? null, drawDelta: n2?.forward?.drawDelta ?? null, holdDelta: n2?.forward?.holdDelta ?? null },
    reverse: { fps: n2?.reverse?.fps ?? null, drawDelta: n2?.reverse?.drawDelta ?? null, holdDelta: n2?.reverse?.holdDelta ?? null, wallSec: n2?.reverse?.wallSec ?? null, blackSamplesAfterWarmup: n2?.reverse?.blackSamplesAfterWarmup ?? null },
    checks: n2?.checks ?? null,
    // ROUND43-Y5: passthrough nguyên vẹn perSeek từ forward-hold (xem
    // header § đợt 43 Y5). Chỉ thêm khóa, không sửa khóa cũ nào; null
    // khi harness không ghi perSeek (probe tắt / harness cũ).
    perSeek: n2?.perSeek ?? null,
    ...cls,
    comparability: "CHỈ so sánh hồi quy với các lượt CÙNG loadLabel (và cùng bundle, hoặc A/B cùng phiên). Số under-load KHÔNG được dùng làm baseline quiet; số quiet chỉ có giá trị khi đủ 3 lượt/GOP trong cùng cửa sổ quiet.",
    ...extra,
  };
}

function modeRun() {
  const video = process.env.Q6_VIDEO;
  const scratch = process.env.Q6_SCRATCH;
  const out = process.env.Q6_OUT || (scratch ? path.join(scratch, "q6-labeled.json") : null);
  if (!video || !scratch || !out) {
    console.error("Thiếu env: cần Q6_VIDEO, Q6_SCRATCH, Q6_OUT (xem header).");
    process.exit(2);
  }
  if (!fs.existsSync(N2)) { console.error(`Không tìm thấy harness N2: ${N2}`); process.exit(2); }
  // R2: kiểm tra dist đóng băng TRƯỚC khi chạy — từ chối thay vì đo
  // trên dist hỏng/rỗng rồi mới phát hiện sau.
  let frozen = null;
  if (process.env.Q6_DIST) {
    const frozenDir = path.resolve(process.env.Q6_DIST);
    if (!fs.existsSync(path.join(frozenDir, "index.html"))) {
      console.error(`[Q6] TỪ CHỐI: Q6_DIST thiếu index.html: ${frozenDir}`);
      process.exit(2);
    }
    const fb = frozenBundleName(frozenDir);
    if (!fb) {
      console.error(`[Q6] TỪ CHỐI: Q6_DIST thiếu bundle .js trong assets/: ${frozenDir}`);
      process.exit(2);
    }
    frozen = { dir: frozenDir, bundle: fb, manifestBefore: distManifest(frozenDir) };
    console.log(`[Q6] dist đóng băng: ${frozenDir} bundle=${fb} files=${frozen.manifestBefore.fileCount} manifest=${frozen.manifestBefore.manifestSha256}`);
  }
  fs.mkdirSync(scratch, { recursive: true });
  const pre = { loadavg: loadavg(), top: topProcesses(), chromePre: chromeCount() };
  console.log(`[Q6] pre-run: load=${pre.loadavg.raw} chromePre=${pre.chromePre} video=${path.basename(video)}`);
  console.log(`[Q6] top processes pre: ${JSON.stringify(pre.top.slice(0, 4))}`);
  const env = {
    ...process.env,
    N2_SCRATCH: scratch,
    K4_VIDEO: video,
    // R2: N2_DIST đi qua env kế thừa của spawnSync — N2 (đợt 35) đọc
    // N2_DIST để snapshot đúng dist đóng băng thay vì apps/web/dist.
    ...(frozen ? { N2_DIST: frozen.dir } : {}),
    ...(process.env.Q6_DISPLAY ? { K4_DISPLAY: process.env.Q6_DISPLAY } : {}),
    ...(process.env.Q6_PORT ? { K4_PORT: process.env.Q6_PORT } : {}),
  };
  const logPath = path.join(scratch, "q6-n2.log");
  const logFd = fs.openSync(logPath, "w");
  const child = spawnSync("node", [N2], { env, stdio: ["ignore", logFd, logFd] });
  fs.closeSync(logFd);
  const post = { loadavg: loadavg(), top: topProcesses(), chromePost: chromeCount() };
  console.log(`[Q6] harness N2 exit=${child.status} post-run: load=${post.loadavg.raw} chromePost=${post.chromePost}`);
  const n2Path = path.join(scratch, "forward-hold.json");
  if (!fs.existsSync(n2Path)) {
    console.error(`[Q6] NO_RESULT: thiếu ${n2Path} (harness exit ${child.status})`);
    process.exit(2);
  }
  const n2 = JSON.parse(fs.readFileSync(n2Path, "utf8"));
  const labeled = buildLabeled(n2, { pre, post, chromePre: pre.chromePre, chromePost: post.chromePost });
  labeled.n2Log = logPath;
  labeled.n2Exit = child.status;
  // R2: kiểm tra đóng băng SAU lượt. 3 điều kiện, vi phạm 1 → INVALID:
  // (a) manifest Q6_DIST sau ≠ trước; (b) bundle N2 đo ≠ bundle đóng
  // băng; (c) snapshot dist-snap của N2 ≠ dist đóng băng (N2 phải copy
  // đúng bản sao; nếu N2 cũ không nhận N2_DIST thì snapshot sẽ là
  // dist trên đĩa và điều kiện này bắt được).
  let frozenValid = null;
  if (frozen) {
    const manifestAfter = distManifest(frozen.dir);
    const snapManifest = distManifest(path.join(scratch, "dist-snap"));
    const problems = [];
    if (manifestAfter.manifestSha256 !== frozen.manifestBefore.manifestSha256) problems.push(`dist đóng băng đổi giữa chừng: manifest trước ${frozen.manifestBefore.manifestSha256.slice(0, 12)} ≠ sau ${manifestAfter.manifestSha256.slice(0, 12)}`);
    if (n2.bundle !== frozen.bundle) problems.push(`bundle đo ${n2.bundle} ≠ bundle đóng băng ${frozen.bundle}`);
    if (snapManifest.manifestSha256 !== frozen.manifestBefore.manifestSha256) problems.push(`snapshot dist-snap của N2 ≠ dist đóng băng (snap ${snapManifest.manifestSha256.slice(0, 12)} ≠ frozen ${frozen.manifestBefore.manifestSha256.slice(0, 12)})`);
    frozenValid = {
      valid: problems.length === 0,
      validity: problems.length === 0 ? "VALID" : "INVALID",
      problems,
      dir: frozen.dir,
      bundle: frozen.bundle,
      manifestBefore: frozen.manifestBefore.manifestSha256,
      manifestAfter: manifestAfter.manifestSha256,
      snapManifest: snapManifest.manifestSha256,
      fileCount: frozen.manifestBefore.fileCount,
      // Chỉ ghi sha256 của bundle JS (file quyết định hành vi đo) vào
      // trường riêng để đối chiếu nhanh; toàn bộ manifest nằm ở file
      // manifest riêng của lượt (không nhét hàng trăm entry vào đây).
      bundleSha256: (frozen.manifestBefore.files.find((f) => f.rel === `assets/${frozen.bundle}`) ?? {}).sha256 ?? null,
    };
    labeled.frozenDist = frozenValid;
    if (!frozenValid.valid) {
      labeled.validity = "INVALID — dist đóng băng đổi giữa chừng hoặc snapshot lệch; fps của lượt này KHÔNG được dùng làm baseline, kể cả khi loadLabel=quiet.";
      labeled.usableAsBaseline = false;
    } else {
      labeled.validity = "VALID — dist đóng băng không đổi trước/sau, bundle và snapshot khớp; lượt này đủ điều kiện 'cùng bundle' cho baseline (còn cần đủ 3 lượt quiet/GOP).";
      labeled.usableAsBaseline = labeled.loadLabel === "quiet";
    }
    console.log(`[Q6] frozenDist validity=${frozenValid.validity} problems=${JSON.stringify(problems)}`);
  } else {
    labeled.frozenDist = null;
    labeled.validity = "UNVERIFIED — không đặt Q6_DIST, chạy trên dist trên đĩa như đợt 34; không claim 'cùng bundle' cho batch này.";
    labeled.usableAsBaseline = false;
  }
  fs.writeFileSync(out, JSON.stringify(labeled, null, 2));
  console.log(`[Q6] loadLabel=${labeled.loadLabel} fps ngược=${labeled.reverse.fps} (draw ${labeled.reverse.drawDelta}/${labeled.reverse.wallSec}s) xuôi=${labeled.forward.interpRate} lý do=${JSON.stringify(labeled.labelReasons)}`);
  console.log(`[Q6] labeled → ${out}`);
  if (frozenValid && !frozenValid.valid) process.exit(3);
  process.exit(child.status === 0 ? 0 : child.status === 1 ? 1 : 2);
}

function modeClassify() {
  const input = process.argv[3];
  if (!input || !fs.existsSync(input)) { console.error("classify cần 1 forward-hold.json tồn tại."); process.exit(2); }
  const n2 = JSON.parse(fs.readFileSync(input, "utf8"));
  const chromePreArg = process.argv[4] !== undefined ? Number(process.argv[4]) : null;
  const proc = chromePreArg === null || Number.isNaN(chromePreArg)
    ? { processSnapshot: "missing", note: "Lượt cũ (trước Q6) không có snapshot tiến trình: nhãn chỉ từ load+fwd+rAF, chưa loại trừ được browser luồng khác." }
    : { processSnapshot: "provided", chromePre: chromePreArg };
  const labeled = buildLabeled(n2, proc, { classifiedFrom: input });
  const out = input.replace(/\.json$/, "") + ".labeled.json";
  fs.writeFileSync(out, JSON.stringify(labeled, null, 2));
  console.log(`[Q6] ${input} → loadLabel=${labeled.loadLabel} fps=${labeled.reverse.fps} lý do=${JSON.stringify(labeled.labelReasons)}`);
  console.log(`[Q6] labeled → ${out}`);
}

const mode = process.argv[2] || "run";
if (mode === "run") modeRun();
else if (mode === "classify") modeClassify();
else { console.error(`mode không rõ: ${mode} (run | classify)`); process.exit(2); }
