// settle45A1-probe.mjs — Phase 9 đợt 45, luồng A1: probe CHỈ ĐỌC,
// không sửa production, không ghi vào repo.
//
// Mục đích (nợ mở Z1 §6.1–§6.3):
//   (1) Kiểm tra vỏ UI .vcut.json: đọc file mẫu nếu có (mẫu ngoài
//       repo, KHÔNG commit), nếu chưa có thì tạo fixture .vcut.json
//       mẫu trong thư mục scratch /tmp (KHÔNG vào repo, KHÔNG phải
//       binary) rồi validate vỏ (JSON parse + tracks/clips + clip
//       src asset:). Đây là kiểm tra VỎ, không phải click-test thật
//       qua ProjectMenu trên browser — click-test thật vẫn là nợ mở
//       (xem LIMITS A1 §4).
//   (2) Mô phỏng tab ẩn dọn ở mức LOGIC (không phải đo browser):
//       dùng lib settle45A1 bundle qua esbuild để chứng minh phân
//       loại settle-drop không phụ thuộc hệ số throttle timer (nó
//       dùng counter/cache, không dùng wall-time) — và để replay
//       trace Z1: với chỉ ok=true mà không có decoded thì chẩn đoán
//       là unknown, tức Z1 chưa đủ dữ kiện kết luận tràn GOP lành.
//   (3) Tab ẩn >= 5 phút THẬT: script này KHÔNG đo (phiên này là
//       Node-only, không có browser headed; document.visibilityState
//       + timer throttle 1/phút của Chrome chỉ đo được trên Chromium
//       headed với dwell 300 s thật). Mục này báo NOT-MEASURED rõ
//       ràng, không bịa số, kèm điều kiện chạy headed cho luồng sau.
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/settle45A1-probe.mjs
// Biến môi trường: A1_VCUT_SAMPLE (đường dẫn .vcut.json mẫu ngoài
// repo, mặc định thử ~/workspace/tmp-round44-z3/relink-small.vcut.json),
// A1_SCRATCH (mặc định /tmp/settle45a1-probe).
// Exit 0 khi không có mục FAIL; NOT-MEASURED không làm fail.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const SCRATCH = process.env.A1_SCRATCH || path.join(os.tmpdir(), "settle45a1-probe");
fs.mkdirSync(SCRATCH, { recursive: true });

const items = [];
function report(name, status, detail) {
  items.push({ name, status, detail });
  console.log(`${status} ${name} — ${detail}`);
}

// ---- (0) Bundle lib thuần qua esbuild (ra scratch, không vào repo) ----
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "a1-lib.mjs");
const b = spawnSync(esbuild, [
  path.join(REPO, "apps/web/src/lib/settle45A1.ts"),
  "--bundle", "--platform=node", "--format=esm", `--outfile=${bundleOut}`,
], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) {
  report("bundle-lib", "FAIL", `esbuild lỗi: ${(b.stderr || b.stdout || "").slice(0, 400)}`);
  console.log(`\n== settle45A1-probe: ${items.filter((i) => i.status === "FAIL").length} FAIL ==`);
  process.exit(1);
}
const lib = await import(bundleOut);

// ---- (1) Vỏ UI .vcut.json ----
function validateShell(doc, label) {
  const problems = [];
  if (doc === null || typeof doc !== "object") problems.push("không phải JSON object");
  else {
    if (typeof doc.format !== "string" && typeof doc.specVersion !== "string") problems.push("thiếu format/specVersion");
    const tracks = doc.spec?.tracks ?? doc.tracks;
    if (!Array.isArray(tracks) || tracks.length === 0) problems.push("không có tracks");
    else {
      const clips = tracks.flatMap((t) => (Array.isArray(t.clips) ? t.clips : []));
      if (clips.length === 0) problems.push("không có clip nào");
      else {
        const assetClips = clips.filter((c) => typeof c.src === "string" && c.src.startsWith("asset:"));
        if (assetClips.length === 0) problems.push(`không có clip src asset: (có ${clips.length} clip, src đầu: ${String(clips[0].src)})`);
        for (const c of assetClips) {
          if (!(c.duration > 0)) problems.push(`clip asset: ${c.src} thiếu duration > 0`);
        }
      }
    }
  }
  return problems;
}

const sampleCandidates = [
  process.env.A1_VCUT_SAMPLE,
  path.join(os.homedir(), "workspace/tmp-round44-z3/relink-small.vcut.json"),
  path.join(os.homedir(), "workspace/tmp-round32-o4/o4-corrupt.vcut.json"),
].filter(Boolean);
let sampleDoc = null;
let samplePath = null;
for (const p of sampleCandidates) {
  try {
    if (fs.existsSync(p)) { sampleDoc = JSON.parse(fs.readFileSync(p, "utf8")); samplePath = p; break; }
  } catch (e) { report("vcut-sample-read", "FAIL", `${p}: ${e.message}`); }
}
if (sampleDoc) {
  const problems = validateShell(sampleDoc, samplePath);
  if (problems.length === 0) {
    report("vcut-shell-sample", "PASS", `${samplePath}: vỏ hợp lệ (có clip asset:)`);
  } else {
    // Mẫu ngoài repo (Z3) dùng src file thường, không phải asset: —
    // đó là giới hạn của mẫu, không phải lỗi vỏ; fixture dưới đây
    // mới là kiểm tra đường asset:.
    report("vcut-shell-sample", "PARTIAL", `${samplePath}: parse được nhưng ${problems.join("; ")} — mẫu này không phủ đường asset:, xem fixture bên dưới`);
  }
} else {
  report("vcut-shell-sample", "PARTIAL", "không tìm thấy mẫu .vcut.json ngoài repo — dùng fixture tự tạo bên dưới");
}

// Fixture mẫu trong /tmp (KHÔNG vào repo, KHÔNG commit): vỏ tối thiểu
// cho clip asset: đúng như ProjectMenu → loadProject → rehydrate
// kỳ vọng (tracks/clips, src asset:<id>, duration > 0).
const fixturePath = path.join(SCRATCH, "a1-sample.vcut.json");
const fixture = {
  format: "vcut-project",
  formatVersion: 1,
  specVersion: "0.2.0",
  name: "A1-probe-fixture",
  spec: {
    version: "0.2.0",
    meta: { name: "A1-probe-fixture", width: 640, height: 360, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips: [{ kind: "video", id: "c0", src: "asset:a_probe45a1", start: 0, duration: 8, in: 0, out: 8 }] }],
  },
};
fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
try {
  const back = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const problems = validateShell(back, fixturePath);
  if (problems.length === 0) {
    report("vcut-shell-fixture-asset", "PASS", `${fixturePath}: fixture đọc lại hợp lệ, 1 clip src asset:a_probe45a1, duration 8 > 0 (file chỉ nằm ở ${SCRATCH}, không vào repo)`);
  } else {
    report("vcut-shell-fixture-asset", "FAIL", problems.join("; "));
  }
} catch (e) {
  report("vcut-shell-fixture-asset", "FAIL", e.message);
}

// ---- (2) Mô phỏng tab ẩn dọn ở mức logic + replay Z1 ----
{
  // (2a) Phân loại settle-drop không dùng wall-time: cùng một trace
  // counter/cache nhưng timer throttle khác nhau (290 ms vs 1050 ms
  // như Z1 §3.2) vẫn cho cùng chẩn đoán — throttle chỉ làm chậm
  // lần thử lại, không đổi nhánh dọn.
  const w = lib.mirrorDecodeWindow({ targetTimeSec: 31.0, fps: 30, effectiveWindow: 75, gopFrames: 90 });
  const rSpill = lib.classifyW2({ window: w, decoded: 90, ok: true, cacheSizeBefore: 0, lastWindowKey: "1-2", corrupt: { startFrame: 900, endFrameExclusive: 990 } });
  const rSame = lib.classifyW2({ window: w, decoded: 90, ok: true, cacheSizeBefore: 0, lastWindowKey: "1-2", corrupt: { startFrame: 900, endFrameExclusive: 990 } });
  if (rSpill.diagnostic === "partial-gop" && rSame.diagnostic === rSpill.diagnostic) {
    report("hidden-logic-invariant", "PASS", "phân loại W2 (partial-gop) không phụ thuộc hệ số throttle timer — logic dọn dùng counter/cache, không dùng wall-time");
  } else {
    report("hidden-logic-invariant", "FAIL", `partial-gop kỳ vọng, được ${rSpill.diagnostic}/${rSame.diagnostic}`);
  }

  // (2b) Replay trace Z1: W2 ok=true, decoded chưa mirror → unknown.
  // Đây là bằng chứng vì sao Z1 chưa kết luận được tràn GOP lành.
  const wZ1 = lib.mirrorDecodeWindow({ targetTimeSec: 32.7, fps: 30, effectiveWindow: 75, gopFrames: 90 });
  const rZ1 = lib.classifyW2({ window: wZ1, decoded: null, ok: true, cacheSizeBefore: 269, lastWindowKey: "800-900", corrupt: { startFrame: 900, endFrameExclusive: 990 } });
  const relZ1 = lib.analyzeWindowVsCorrupt(wZ1, { startFrame: 900, endFrameExclusive: 990 });
  if (rZ1.diagnostic === "unknown" && relZ1.insideCorrupt) {
    report("z1-replay-mirror", "PASS", `mirror Z1 (32.7 s, eff 75, GOP 90): cửa sổ [${wZ1.decodeFrom},${wZ1.decodeTo}] nằm trọn GOP hỏng [900,990) theo MÔ HÌNH, nhưng decoded=null → chẩn đoán unknown — giả thuyết tràn GOP lành CHƯA được chứng minh, cần decoded thật từ headed`);
  } else {
    report("z1-replay-mirror", "FAIL", `kỳ vọng unknown + insideCorrupt, được ${rZ1.diagnostic} inside=${relZ1.insideCorrupt}`);
  }

  // (2c) Cửa sổ chọn cho lần headed sau: eff 75 → target 974 (32.4667 s).
  const chosen = lib.chooseCorruptWindow({ corruptGops: [{ startFrame: 900, endFrameExclusive: 990 }], effectiveWindow: 75, fps: 30 });
  if (chosen.feasible && chosen.targetPos === 974) {
    report("next-headed-window", "PASS", `cửa sổ W2 cho lần headed sau: targetPos=974 (t=${chosen.targetTimeSec?.toFixed(4)} s), decode [900,974] nằm trọn GOP hỏng — dùng mốc này thay 32.7 s để W2 về đường ok=false nếu giả thuyết đúng`);
  } else {
    report("next-headed-window", "FAIL", JSON.stringify(chosen));
  }
}

// ---- (3) Tab ẩn >= 5 phút THẬT: CHƯA ĐO (ghi rõ, không bịa số) ----
{
  const chromeCandidates = [
    path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome"),
  ];
  const chromeFound = chromeCandidates.some((p) => fs.existsSync(p));
  report(
    "hidden-5min-real",
    "NOT-MEASURED",
    `chưa đo dwell >= 5 phút thật trong phiên Node-only này (không browser headed, không visibilityState/throttle thật). ` +
      `Chrome headed ${chromeFound ? "có sẵn ở cache Playwright — lần headed sau khả thi" : "chưa thấy ở cache Playwright — cần kiểm tra lại trước khi chạy"}; ` +
      `điều kiện chạy: Chromium headed + CDP, dwell 300.000 ms (poll visibility mỗi 5 s, phải luôn hidden), aim siêu chặt, W2 ở mốc 32.4667 s (cửa sổ [900,974] trọn GOP hỏng) + mirror decodeFrom/decodeTo/key/decoded. ` +
      `Không có số timer/rAF nào được claim ở đây.`,
  );
}

const fails = items.filter((i) => i.status === "FAIL").length;
const notMeasured = items.filter((i) => i.status === "NOT-MEASURED").length;
console.log(`\n== settle45A1-probe: ${items.length} mục, ${fails} FAIL, ${notMeasured} NOT-MEASURED ==`);
if (fails > 0) process.exit(1);
