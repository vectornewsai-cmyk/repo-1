#!/usr/bin/env node
/**
 * Phase 9 đợt 42, luồng X5 — chạy chuỗi probe per-seek thật qua đủ 3 tầng
 * solo runner → Q6 gate → N2 harness, với N2_PERSEEK=1 (xem
 * docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md).
 *
 * Đây KHÔNG phải phiên solo A/B (không cổng yên, không xen kẽ retry/
 * single, không khóa ngưỡng/cổng nào): nó chỉ thực thi đúng đường code
 * mà phiên solo thật sẽ đi — buildProbeEnv + spawn Q6 + đọc
 * forward-hold.json qua extractPerSeekReport — trong MỘT lượt probe,
 * để ghi bằng chứng runtime perSeekProbe present/absent ở từng tầng.
 *
 * Cách dùng (từ gốc repo):
 *   N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10 node \
 *     apps/web/scripts/per-seek-probe-chain-run.mjs \
 *     --fixture <file.mp4> --scratch <dir> [--display :99] [--port 4199]
 *
 * Kết quả ghi vào <scratch>/probe-chain-evidence.json:
 *   layers.soloEnv   — env buildProbeEnv trả về: N2_PERSEEK giữ nguyên?
 *                      đủ 6 khóa Q6_*? (bằng chứng tầng solo, trước spawn)
 *   layers.q6        — exit Q6, q6-labeled.json có trường perSeek không?
 *                      (ROUND43-Y5: từ đợt 43, Q6 copy nguyên vẹn
 *                      perSeek sang labeled — xem LIMITS đợt 43 Y5 —
 *                      nên tầng này kỳ vọng "present" khi probe bật;
 *                      trước Y5 nó là "absent by design" theo LIMITS
 *                      V1 §4.3. Bằng chứng Q6 truyền cờ trước Y5 nằm ở
 *                      tầng dưới: N2 đọc được cờ.)
 *   layers.n2        — forward-hold.json: perSeekEnabled, perSeek.status
 *                      theo extractPerSeekReport, số entry, validate.
 *   layers.soloReport— kết quả extractPerSeekReport(raw) — chính là
 *                      trường perSeekProbe mà runOneVariant ghi vào
 *                      JSON lượt solo thật.
 * Exit 0 khi chuỗi chạy xong và evidence đã ghi, kể cả khi N2 verdict
 * PARTIAL (verdict là kết quả đo, không phải lỗi chuỗi). Exit 2 khi
 * thiếu forward-hold.json hoặc env solo làm mất cờ N2_PERSEEK.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildProbeEnv, extractPerSeekReport } from "./seek-ab-solo-run.mjs";
import { validatePerSeekEntry } from "./per-seek-probe.mjs";
// ROUND44-Z5: copy đóng băng chống race (nợ Y5 §4.2) — xem freeze-dist.mjs.
import { freezeDist } from "./freeze-dist.mjs";

const REPO = path.resolve(import.meta.dirname, "..", "..", ".."); // scripts -> web -> apps -> repo (lỗi 2 cấp từng làm đợt 38 NO_RESULT)
const Q6 = path.join(import.meta.dirname, "probe-round34-q6-measure-protocol.mjs");

function parseArgs(argv) {
  const o = { display: ":99", port: 4199 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--fixture") o.fixture = argv[++i];
    else if (argv[i] === "--scratch") o.scratch = argv[++i];
    else if (argv[i] === "--display") o.display = argv[++i];
    else if (argv[i] === "--port") o.port = Number(argv[++i]);
  }
  return o;
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.fixture || !opts.scratch) {
  console.error("Cách dùng: per-seek-probe-chain-run.mjs --fixture <mp4> --scratch <dir> [--display :99] [--port 4199]");
  process.exit(2);
}
if (!fs.existsSync(opts.fixture)) { console.error(`fixture thiếu: ${opts.fixture}`); process.exit(2); }

// Đóng băng dist vào scratch của luồng (như solo runner dùng frozen dist):
// Q6 kiểm tra manifest trước/sau trên bản sao này, nên luồng khác build
// lại apps/web/dist giữa lượt cũng không làm lệch lượt này.
const frozenDist = path.join(opts.scratch, "frozen-dist");
fs.rmSync(opts.scratch, { recursive: true, force: true });
fs.mkdirSync(opts.scratch, { recursive: true });
// ROUND44-Z5: copy qua thư mục tạm + rename (retry khi build khác
// đang viết lại dist) thay vì cpSync thẳng — sửa race ENOENT của Y5.
freezeDist(path.join(REPO, "apps/web/dist"), frozenDist);

// Tầng solo: đúng hàm solo runner dùng (V1). KHÔNG đặt cờ ở đây — cờ
// phải đến từ môi trường ngoài, như phiên solo thật.
const env = buildProbeEnv({ fixture: opts.fixture, scratch: opts.scratch, display: opts.display, port: opts.port, distDir: frozenDist });
const soloEnv = {
  n2PerseekKept: env.N2_PERSEEK ?? null,
  n2PerseekGopSecKept: env.N2_PERSEEK_GOP_SEC ?? null,
  q6KeysPresent: ["Q6_VIDEO", "Q6_SCRATCH", "Q6_DISPLAY", "Q6_PORT", "Q6_OUT", "Q6_DIST"].filter((k) => k in env),
  q6Display: env.Q6_DISPLAY, q6Port: env.Q6_PORT, q6Dist: env.Q6_DIST,
};
console.log(`[chain] solo env: N2_PERSEEK=${soloEnv.n2PerseekKept} GOP_SEC=${soloEnv.n2PerseekGopSecKept} Q6 keys=${soloEnv.q6KeysPresent.length}/6`);
if (process.env.N2_PERSEEK === "1" && env.N2_PERSEEK !== "1") {
  console.error("[chain] LỖI CHUỖI: buildProbeEnv làm mất N2_PERSEEK=1");
  process.exit(2);
}

// Tầng Q6 → N2: spawn thật, Q6 spawn N2 với ...process.env nên cờ chảy tiếp.
const q6 = spawnSync("node", [Q6, "run"], { env, encoding: "utf8" });
process.stdout.write(q6.stdout ?? "");
process.stderr.write(q6.stderr ?? "");
const forwardHoldPath = path.join(opts.scratch, "forward-hold.json");
const q6LabeledPath = path.join(opts.scratch, "q6-labeled.json");
const q6LogPath = path.join(opts.scratch, "q6-n2.log");
let q6Layer = { exit: q6.status, labeledExists: fs.existsSync(q6LabeledPath), perSeekFieldInLabeled: null, n2LogHasPerSeekLine: null };
if (fs.existsSync(q6LabeledPath)) {
  const labeled = JSON.parse(fs.readFileSync(q6LabeledPath, "utf8"));
  // ROUND43-Y5: phân biệt 3 trạng thái — present (object, probe bật),
  // present-null (khóa có, giá trị null = lượt này không ghi perSeek),
  // absent (file labeled cũ, trước Y5).
  q6Layer.perSeekFieldInLabeled = !("perSeek" in labeled) ? "absent" : (labeled.perSeek ? "present" : "present-null");
  q6Layer.perSeekEntryCountInLabeled = Array.isArray(labeled.perSeek?.entries) ? labeled.perSeek.entries.length : null;
  q6Layer.perSeekVersionInLabeled = labeled.perSeek?.version ?? null;
  q6Layer.n2Verdict = labeled.n2Verdict ?? null;
  q6Layer.loadLabel = labeled.loadLabel ?? null;
  q6Layer.frozenDistValidity = labeled.frozenDist?.validity ?? null;
}
if (fs.existsSync(q6LogPath)) {
  const log = fs.readFileSync(q6LogPath, "utf8");
  const m = log.match(/perSeek: .*$/m);
  q6Layer.n2LogHasPerSeekLine = m ? m[0].slice(0, 300) : null;
  const install = log.match(/probe per-seek: .*$/m);
  q6Layer.n2LogProbeInstallLine = install ? install[0] : null;
}
if (!fs.existsSync(forwardHoldPath)) {
  console.error(`[chain] NO_RESULT: thiếu ${forwardHoldPath} (Q6 exit ${q6.status})`);
  const evidence = { runAt: new Date().toISOString(), layers: { soloEnv, q6: q6Layer, n2: null, soloReport: null }, note: "Q6 không trả forward-hold.json — chuỗi dừng ở tầng N2, không claim perSeek." };
  fs.writeFileSync(path.join(opts.scratch, "probe-chain-evidence.json"), JSON.stringify(evidence, null, 2));
  process.exit(2);
}

// Tầng N2 + tầng solo-report: đọc forward-hold thật qua đúng seam solo dùng.
const raw = JSON.parse(fs.readFileSync(forwardHoldPath, "utf8"));
const soloReport = extractPerSeekReport(raw);
const n2Layer = {
  perSeekEnabledInForwardHold: raw.perSeekEnabled ?? null,
  perSeekObjectPresent: raw.perSeek !== null && raw.perSeek !== undefined,
  version: raw.perSeek?.version ?? null,
  gopSeconds: raw.perSeek?.gopSeconds ?? null,
  soloReportStatus: soloReport.status,
  entryCount: soloReport.entryCount ?? null,
  counts: raw.perSeek?.counts ?? null,
  droppedOverflow: raw.perSeek?.droppedOverflow ?? null,
  validateProblemsTotal: Array.isArray(raw.perSeek?.entries)
    ? raw.perSeek.entries.reduce((n, e) => n + validatePerSeekEntry(e).length, 0) : null,
  validateEntriesChecked: Array.isArray(raw.perSeek?.entries) ? raw.perSeek.entries.length : null,
  maxSeekingSamplesPerEntry: Array.isArray(raw.perSeek?.entries)
    ? Math.max(0, ...raw.perSeek.entries.map((e) => (e.decodedSamplesWhileSeeking || []).length)) : null,
  maxDroppedSeekingSamples: Array.isArray(raw.perSeek?.entries)
    ? Math.max(0, ...raw.perSeek.entries.map((e) => e.droppedSeekingSamples ?? 0)) : null,
  summaryReverseByMechanism: raw.perSeek?.summaryReverse?.byMechanism ?? null,
};
console.log(`[chain] N2: perSeekEnabled=${n2Layer.perSeekEnabledInForwardHold} soloReport=${soloReport.status} entries=${n2Layer.entryCount} validateProblems=${n2Layer.validateProblemsTotal}`);
console.log(`[chain] Q6 labeled perSeek field: ${q6Layer.perSeekFieldInLabeled} entries=${q6Layer.perSeekEntryCountInLabeled} (ROUND43-Y5: kỳ vọng present khi probe bật — Q6 nay mang perSeek, xem LIMITS đợt 43 Y5)`);

const evidence = {
  runAt: new Date().toISOString(),
  command: { fixture: opts.fixture, scratch: opts.scratch, display: opts.display, port: opts.port, n2PerseekEnv: process.env.N2_PERSEEK ?? null, n2PerseekGopSecEnv: process.env.N2_PERSEEK_GOP_SEC ?? null },
  // ROUND43-Y5: Q6 nay phải mang perSeek với cùng số entry như N2 khi
  // probe bật (kiểm tra khớp, không chỉ kiểm tra khóa tồn tại).
  q6PerSeekMatchesN2: q6Layer.perSeekFieldInLabeled === "present" && q6Layer.perSeekEntryCountInLabeled === n2Layer.entryCount,
  layers: { soloEnv, q6: q6Layer, n2: n2Layer, soloReport },
  chainVerdict: soloReport.status === "present" && n2Layer.perSeekEnabledInForwardHold === true
    ? "CHAIN-OK: cờ N2_PERSEEK=1 chảy solo → Q6 → N2 bằng runtime, soloReport present"
    : `CHAIN-NOT-PRESENT: soloReport=${soloReport.status}, n2Enabled=${n2Layer.perSeekEnabledInForwardHold} — xem layers để chẩn đoán, không claim present`,
  note: "Lượt probe, under-load (chạy cùng các luồng đợt 42 khác) — không phải baseline quiet, không kết luận cổng solo.",
};
fs.writeFileSync(path.join(opts.scratch, "probe-chain-evidence.json"), JSON.stringify(evidence, null, 2));
console.log(`[chain] evidence → ${path.join(opts.scratch, "probe-chain-evidence.json")}`);
console.log(`[chain] ${evidence.chainVerdict}`);
process.exit(0);
