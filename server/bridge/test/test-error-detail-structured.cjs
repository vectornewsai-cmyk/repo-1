/**
 * Test cho Phase 9 đợt 34 luồng Q4: errorDetail sang có cấu trúc.
 * Chạy bằng: node server/bridge/test/test-error-detail-structured.cjs
 * (bridge thật qua HTTP ở [e] + CLI thật ở [f] cần ffmpeg/curl và
 * CLI/MCP đã build ở cli/dist, mcp-server/dist; các phần còn lại
 * không cần ffmpeg/server/network)
 *
 * Contract mới (ADDITIVE — không vỡ consumer cũ):
 *  - Mọi kết quả buildErrorDetail/buildTaskError đều kèm `summaryKey`
 *    + `summaryParams` (toàn string, đã redact) bên cạnh các field cũ
 *    không đổi (code/summary/details/detailsOmitted/redactedTail).
 *  - [a] Ma trận fixture phủ ĐỦ 13 summaryKey, đúng code + params.
 *  - [b] i18n: mọi key phát ra đều có template ở CẢ vi lẫn en, và mọi
 *    template errorDetail.summary đều được phát ra (0 key mồ côi hai
 *    chiều); placeholder của template ⊆ params của fixture (thay xong
 *    không còn "{" sót, trừ trường hợp detail rỗng mà web đã fallback).
 *  - [c] publicJob opt-in lộ nguyên 2 field mới; consumer cũ chỉ đọc
 *    field cũ vẫn chạy (formatErrorDetail không đổi, không nhắc key).
 *  - [d] Payload cũ (không có summaryKey) vẫn hợp lệ: consumer mới
 *    phải fallback về summary thô — khóa bằng logic tương đương hàm
 *    web localizedErrorSummary (không import được tsx nên mô phỏng
 *    đúng quy ước t(): key vắng → trả key, var thiếu → giữ {var}).
 *  - [e] Bridge thật qua HTTP: POST /api/proxy hỏng ?detail=1 trả
 *    errorDetail có summaryKey hợp lệ, không rò đường dẫn tuyệt đối.
 *  - [f] CLI thật (dist đã build): buildRenderErrorDetail qua dist
 *    trả summaryKey/params; render clip corrupt thật → exit != 0,
 *    stderr vẫn [FFMPEG_ERROR] như cũ, không nhắc summaryKey.
 *  - [g] MCP thật (dist đã build): buildRenderErrorDetail qua dist
 *    trả summaryKey/params như CLI.
 *  - [h] Đợt 63 R5: dòng VCUT_VALIDATION_JSON cuối stderr → tách ra
 *    thành validationDetails + validationDetailsOmitted (đã redact),
 *    không làm lệch phân loại cũ, không lọt JSON vào details/tail.
 *
 * Test chỉ in nhãn pass/fail, KHÔNG in lại giá trị secret mẫu hay
 * đường dẫn tuyệt đối của máy test.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const {
  buildErrorDetail,
  buildTaskError,
  formatErrorDetail,
  ERROR_SUMMARY_KEYS,
} = require("../src/errorDetail.js");
const { publicJob } = require("../src/publicJob.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
function eq(a, b, label) {
  ok(JSON.stringify(a) === JSON.stringify(b),
    `${label} (nhận: ${JSON.stringify(a)})`);
}
const root = path.join(__dirname, "..", "..", "..");
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: "utf8", timeout: 180000, ...opts });

function flatten(dict, prefix = "") {
  const out = new Map();
  for (const [k, v] of Object.entries(dict)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") {
      for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
    } else out.set(key, v);
  }
  return out;
}
/** Mô phỏng đúng quy ước t() của apps/web/src/i18n/index.ts. */
function makeT(dict) {
  const lookup = (d, key) => {
    let cur = d;
    for (const part of key.split(".")) {
      if (typeof cur !== "object" || cur === null) return undefined;
      cur = cur[part];
    }
    return typeof cur === "string" ? cur : undefined;
  };
  return (key, vars) => {
    const raw = lookup(dict, key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
  };
}
/** Logic tương đương apps/web/src/lib/errorDetailSummary.ts. */
function localizedSummary(detail, t) {
  if (!detail.summaryKey) return detail.summary;
  const key = `errorDetail.summary.${detail.summaryKey}`;
  const translated = t(key, detail.summaryParams ?? {});
  if (
    translated === key ||
    translated.includes("{") ||
    translated.trim() === "" ||
    /:\s*$/.test(translated)
  ) {
    return detail.summary;
  }
  return translated;
}

/** [a] Ma trận fixture: mỗi mục phải phát đúng 1 summaryKey. */
const FIXTURES = [
  {
    label: "curve parse được",
    input: {
      stderr: "❌ Spec không hợp lệ (1 lỗi):\n  1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)\n",
      exitCode: 1,
    },
    code: "SPEED_CURVE_VIOLATION",
    key: "speedCurveViolation",
    params: { clip: "tracks[0].clips[0]", field: "speedKeyframes.keyframes[0].v", range: "0.25..4", value: "5" },
  },
  {
    label: "curve không khớp mẫu parse",
    input: { stderr: "speedKeyframes bị gì đó không khớp mẫu\n", exitCode: 1 },
    code: "SPEED_CURVE_VIOLATION",
    key: "speedCurveViolationRaw",
    params: { detail: "speedKeyframes bị gì đó không khớp mẫu" },
  },
  {
    label: "asset có tên trong ngoặc kép",
    input: {
      stderr: "[tracks[1].clips[0]] không tìm thấy asset \"intro.mp4\": file không tồn tại\n",
      exitCode: 1,
    },
    code: "MISSING_ASSET",
    key: "missingAsset",
    params: { asset: "intro.mp4" },
  },
  {
    label: "asset không tên (ffmpeg No such file)",
    input: { stderr: "No such file or directory\n", exitCode: 1 },
    code: "MISSING_ASSET",
    key: "missingAssetRaw",
    params: { detail: "No such file or directory" },
  },
  {
    label: "spec chung",
    input: {
      stderr: "❌ Spec không hợp lệ (2 lỗi):\n  1. [tracks[0]] meta.fps phải > 0 (nhận được: 0)\n",
      exitCode: 1,
    },
    code: "SPEC_VALIDATION",
    key: "specValidation",
    params: { detail: "1. [tracks[0]] meta.fps phải > 0 (nhận được: 0)" },
  },
  {
    label: "QA fail",
    input: {
      message: "Kiểm tra chất lượng output thất bại: duration lệch (file lỗi đã bị giữ lại, không trả cho người dùng)",
    },
    code: "OUTPUT_QA",
    key: "outputQa",
    params: { detail: "duration lệch" },
  },
  {
    label: "spawn lỗi",
    input: { message: "Lỗi spawn render worker: ffmpeg crash giả lập" },
    code: "WORKER_START",
    key: "workerStart",
    params: { detail: "Lỗi spawn render worker: ffmpeg crash giả lập" },
  },
  {
    label: "thoát mã 0 không output",
    input: { message: "Render worker thoát mã 0 nhưng không tạo được file output." },
    code: "WORKER_EXIT",
    key: "workerExitNoOutput",
    params: {},
  },
  {
    label: "bị kill bởi signal",
    input: { stderr: "", signal: "SIGKILL" },
    code: "WORKER_EXIT",
    key: "workerExitSignal",
    params: { signal: "SIGKILL" },
  },
  {
    label: "thoát mã lạ",
    input: { stderr: "", exitCode: 3 },
    code: "WORKER_EXIT",
    key: "workerExitCode",
    params: { exitCode: "3" },
  },
  {
    label: "ffmpeg thường",
    input: {
      stderr: "ffmpeg version 6.0\n[libx264 @ 0x55a1] Invalid argument\n",
      exitCode: 1,
    },
    code: "FFMPEG_ERROR",
    key: "ffmpegError",
    params: { detail: "[libx264 @ 0x55a1] Invalid argument" },
  },
  {
    label: "unknown có dòng lỗi",
    input: { stderr: "lỗi lạ không phân loại được\n" },
    code: "UNKNOWN",
    key: "unknownDetail",
    params: { detail: "lỗi lạ không phân loại được" },
  },
  {
    label: "unknown rỗng",
    input: { stderr: "" },
    code: "UNKNOWN",
    key: "unknown",
    params: {},
  },
];

function main() {
  console.log("== [a] Ma trận 13 summaryKey ==");
  {
    eq(ERROR_SUMMARY_KEYS.length, 13, "ERROR_SUMMARY_KEYS có 13 key");
    const emitted = new Set();
    for (const f of FIXTURES) {
      const d = buildErrorDetail(f.input);
      emitted.add(d.summaryKey);
      eq(d.code, f.code, `${f.label}: code`);
      eq(d.summaryKey, f.key, `${f.label}: summaryKey`);
      eq(d.summaryParams, f.params, `${f.label}: summaryParams`);
      ok(Object.values(d.summaryParams).every((v) => typeof v === "string"),
        `${f.label}: mọi param đều là string`);
      // buildTaskError (route đồng bộ) lộ cùng contract.
      const t = buildTaskError({ message: f.input.message || "", stderr: f.input.stderr || "",
        exitCode: f.input.exitCode, signal: f.input.signal || null });
      if (f.input.message || f.input.stderr) {
        ok(t.errorDetail && t.errorDetail.summaryKey === f.key,
          `${f.label}: buildTaskError lộ cùng summaryKey`);
      }
    }
    eq([...emitted].sort(), [...ERROR_SUMMARY_KEYS].sort(),
      "fixture phủ đúng 13 key, không key lạ");
  }

  console.log("== [b] i18n: key phát ra ↔ template vi/en, 0 mồ côi ==");
  {
    const vi = JSON.parse(fs.readFileSync(path.join(root, "apps/web/src/i18n/vi.json"), "utf8"));
    const en = JSON.parse(fs.readFileSync(path.join(root, "apps/web/src/i18n/en.json"), "utf8"));
    const viMap = flatten(vi);
    const enMap = flatten(en);
    // Đợt 63 R5: dict đã lên 2283 key lá (2146 + 131 key fragment đợt 63 − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI + 7 key fragment đợt 64 + 1 key parent; 2044 + 91 mã bridge đợt 62 R5
    // + 11 key khác do các luồng đợt 63 gộp trước). Khóa P7 ở
    // i18nAudit59P7 mới là khóa chính; số này có thể dịch nếu luồng
    // khác gộp key vào dict trong lúc test chạy — cập nhật theo số
    // thực tế lúc chạy, không sửa khóa P7.
    eq(viMap.size, 2326, "vi có 2326 key lá (khóa P7 + 102 mã bridge)");
    eq(enMap.size, 2326, "en có 2326 key lá (khóa P7 + 102 mã bridge)");
    const onlyVi = [...viMap.keys()].filter((k) => !enMap.has(k));
    const onlyEn = [...enMap.keys()].filter((k) => !viMap.has(k));
    eq(onlyVi, [], "0 key chỉ có ở vi");
    eq(onlyEn, [], "0 key chỉ có ở en");
    const tplKeys = [...viMap.keys()]
      .filter((k) => k.startsWith("errorDetail.summary."))
      .map((k) => k.slice("errorDetail.summary.".length));
    eq(tplKeys.sort(), [...ERROR_SUMMARY_KEYS].sort(),
      "template errorDetail.summary đúng 13 key, khớp ERROR_SUMMARY_KEYS");
    // Placeholder của template ⊆ params fixture; thay xong không còn "{".
    const paramsByKey = new Map();
    for (const f of FIXTURES) {
      const cur = paramsByKey.get(f.key) || {};
      Object.assign(cur, f.params);
      paramsByKey.set(f.key, cur);
    }
    for (const key of ERROR_SUMMARY_KEYS) {
      for (const [lang, map] of [["vi", viMap], ["en", enMap]]) {
        const tpl = map.get(`errorDetail.summary.${key}`);
        const placeholders = [...tpl.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
        const params = paramsByKey.get(key) || {};
        ok(placeholders.every((p) => p in params),
          `template ${lang}.${key}: placeholder ⊆ params fixture`);
        const rendered = tpl.replace(/\{(\w+)\}/g, (_, n) => params[n] ?? `{${n}}`);
        ok(!rendered.includes("{") && rendered.length > 0,
          `template ${lang}.${key}: thay đủ param, không sót "{"`);
      }
    }
    // Dịch khung thật: curve + exit code ở cả 2 ngôn ngữ.
    const curve = buildErrorDetail({ stderr: FIXTURES[0].input.stderr, exitCode: 1 });
    eq(localizedSummary(curve, makeT(vi)),
      "Vi phạm speed-curve: tracks[0].clips[0] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)",
      "web vi: curve dịch khung, giữ tham số");
    eq(localizedSummary(curve, makeT(en)),
      "Speed-curve violation: tracks[0].clips[0] speedKeyframes.keyframes[0].v must be in 0.25..4 (got: 5)",
      "web en: curve dịch khung, giữ tham số");
    const exit = buildErrorDetail({ stderr: "", exitCode: 3 });
    eq(localizedSummary(exit, makeT(en)), "Render worker exited with code 3.",
      "web en: exit code dịch trọn vẹn");
  }

  console.log("== [c] publicJob opt-in + consumer cũ không vỡ ==");
  {
    const detail = buildErrorDetail({ stderr: FIXTURES[0].input.stderr, exitCode: 1 });
    const job = {
      id: "abcdef1234567890", status: "error", progress: 0, etaSeconds: null,
      queuePosition: null, attempts: 1, error: "Render worker thoát với mã 1.",
      errorCode: detail.code, errorDetail: detail, outputName: null, outputSize: null,
      createdAt: 1, startedAt: 1, finishedAt: 2, recovered: false, note: null, qaReport: null,
    };
    ok(!("errorDetail" in publicJob(job)), "publicJob mặc định vẫn không có errorDetail");
    const det = publicJob(job, true);
    eq(det.errorDetail.summaryKey, "speedCurveViolation", "publicJob(true) lộ summaryKey");
    eq(det.errorDetail.summaryParams, FIXTURES[0].params, "publicJob(true) lộ summaryParams");
    // Consumer cũ: chỉ đọc field cũ.
    const legacy = `[${det.errorDetail.code}] ${det.errorDetail.summary}`;
    ok(legacy.includes("tracks[0].clips[0]") && legacy.includes("keyframes[0]"),
      "consumer cũ chỉ dùng code/summary vẫn đủ thông tin");
    const formatted = formatErrorDetail(detail);
    ok(formatted.includes("[SPEED_CURVE_VIOLATION]") && formatted.includes("keyframes[0]"),
      "formatErrorDetail cũ không đổi output");
    ok(!formatted.includes("summaryKey") && !formatted.includes("speedCurveViolation"),
      "formatErrorDetail cũ bỏ qua field mới (không nhắc key)");
  }

  console.log("== [d] Payload cũ (không summaryKey) → fallback summary thô ==");
  {
    const oldDetail = {
      code: "SPEED_CURVE_VIOLATION",
      summary: "Vi phạm speed-curve: 1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)",
      details: [], detailsOmitted: 0, redactedTail: "",
    };
    const vi = JSON.parse(fs.readFileSync(path.join(root, "apps/web/src/i18n/vi.json"), "utf8"));
    eq(localizedSummary(oldDetail, makeT(vi)), oldDetail.summary,
      "payload cũ không summaryKey → summary thô");
    const unknownKey = { ...oldDetail, summaryKey: "khongCoKeyNay", summaryParams: {} };
    eq(localizedSummary(unknownKey, makeT(vi)), oldDetail.summary,
      "summaryKey lạ → summary thô, không hiện key");
    const missingParam = { ...oldDetail, summaryKey: "speedCurveViolation",
      summaryParams: { clip: "tracks[0].clips[0]" } };
    eq(localizedSummary(missingParam, makeT(vi)), oldDetail.summary,
      "thiếu param (còn {var}) → summary thô");
    const emptyDetail = { ...oldDetail, summaryKey: "outputQa", summaryParams: { detail: "" } };
    eq(localizedSummary(emptyDetail, makeT(vi)), oldDetail.summary,
      "detail rỗng (câu dở dang) → summary thô");
  }

  console.log("== [e] Bridge thật qua HTTP: /api/proxy ?detail=1 ==");
  {
    const bwork = fs.mkdtempSync(path.join(os.tmpdir(), "q4-bridge-"));
    const port = 8934;
    // Đợt 66 T9 — persist riêng (bwork): không dùng file mặc định ~/.cache/vcut/rate-limit.json,
    // tránh rò mốc limiter sang test khác (bài học đợt 65 §3b).
    const server = spawn("node", [path.join(root, "server/bridge/src/index.js")], {
      env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR: bwork, BRIDGE_RATE_PERSIST_PATH: path.join(bwork, "rate-limit.json") },
      stdio: "ignore",
    });
    try {
      let ready = false;
      for (let i = 0; i < 50 && !ready; i++) {
        const r = run("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}",
          `http://127.0.0.1:${port}/api/health`]);
        if (r.stdout.trim() === "200") ready = true;
        else Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
      }
      ok(ready, "bridge server thật khởi động được (health 200)");
      if (ready) {
        const badFile = path.join(bwork, "upload-bad.mp4");
        writeFileEpermRetry(badFile, "not a video");
        const res = run("curl", ["-s", "-F", `file=@${badFile}`,
          `http://127.0.0.1:${port}/api/proxy?detail=1`]);
        let body = null;
        try { body = JSON.parse(res.stdout || "{}"); } catch { /* fail ở dưới */ }
        ok(body && body.errorDetail && ERROR_SUMMARY_KEYS.includes(body.errorDetail.summaryKey),
          `proxy lỗi (?detail=1) có summaryKey hợp lệ (nhận: ${body && body.errorDetail && body.errorDetail.summaryKey})`);
        ok(body && body.errorDetail &&
          Object.values(body.errorDetail.summaryParams || {}).every((v) => typeof v === "string"),
          "proxy lỗi: mọi summaryParam đều là string");
        ok(body && !JSON.stringify(body).includes(bwork),
          "proxy lỗi (?detail=1): payload không rò đường dẫn tuyệt đối");
      }
    } finally {
      server.kill("SIGKILL");
      fs.rmSync(bwork, { recursive: true, force: true });
    }
  }

  console.log("== [f] CLI thật: dist buildRenderErrorDetail + render corrupt ==");
  {
    const cliDist = path.join(root, "cli", "dist", "cli", "src", "renderErrors.js");
    ok(fs.existsSync(cliDist), "cli/dist renderErrors.js tồn tại (CLI đã build)");
    if (fs.existsSync(cliDist)) {
      const snippet = [
        `import { buildRenderErrorDetail, formatRenderFailure } from ${JSON.stringify(cliDist)};`,
        `const d = buildRenderErrorDetail(${JSON.stringify(FIXTURES[0].input.stderr)}, 1);`,
        "console.log(JSON.stringify({ key: d.summaryKey, params: d.summaryParams, out: formatRenderFailure(" +
          JSON.stringify(FIXTURES[0].input.stderr) + ", 1) }));",
      ].join("\n");
      const r = run("node", ["--input-type=module", "-e", snippet]);
      let out = null;
      try { out = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { /* fail ở dưới */ }
      eq(out && out.key, "speedCurveViolation", "CLI dist: buildRenderErrorDetail trả summaryKey");
      eq(out && out.params, FIXTURES[0].params, "CLI dist: buildRenderErrorDetail trả summaryParams");
      ok(out && out.out.includes("[SPEED_CURVE_VIOLATION]") && !out.out.includes("summaryKey"),
        "CLI dist: formatRenderFailure vẫn in thô như cũ");
    }
    const work = fs.mkdtempSync(path.join(os.tmpdir(), "q4-cli-"));
    const cliJs = path.join(root, "cli", "dist", "cli", "src", "index.js");
    const vcut = (args, opts = {}) => run("node", [cliJs, ...args], { cwd: work, ...opts });
    try {
      vcut(["create", "--name", "Q4", "--width", "1280", "--height", "720",
        "--out", path.join(work, "proj.json")]);
      writeFileEpermRetry(path.join(work, "corrupt.mp4"), "not a video");
      vcut(["add-clip", "--project", path.join(work, "proj.json"),
        "--src", "corrupt.mp4", "--start", "0", "--duration", "2"]);
      const bad = vcut(["render", "--project", path.join(work, "proj.json"),
        "--preset", "720p", "--output", path.join(work, "bad.mp4"),
        "--media-dir", work, "-y"]);
      ok(bad.status !== 0, `CLI thật render corrupt → exit != 0 (nhận ${bad.status})`);
      ok(String(bad.stderr).includes("[FFMPEG_ERROR]"),
        "CLI thật render corrupt → stderr vẫn [FFMPEG_ERROR] như cũ");
      // Chỉ khối lỗi mới phải sạch: dòng đầu "[vcut] render … → <output>"
      // là echo của chính đường dẫn output do user truyền, không phải
      // leak từ stderr worker (đường dẫn đó user đã biết và tự chọn).
      const errBlock = String(bad.stderr).slice(
        String(bad.stderr).indexOf("Lỗi: Render thất bại"));
      ok(errBlock && !errBlock.includes(work),
        "CLI thật render corrupt → khối lỗi không rò đường dẫn tuyệt đối work dir");
      ok(!String(bad.stderr).includes(os.homedir()),
        "CLI thật render corrupt → stderr không rò home dir");
      ok(!String(bad.stderr).includes("summaryKey"),
        "CLI thật render corrupt → output không nhắc summaryKey (không đổi)");
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }

  console.log("== [g] MCP thật: dist buildRenderErrorDetail ==");
  {
    const mcpDist = path.join(root, "mcp-server", "dist", "mcp-server", "src", "tools", "renderErrors.js");
    ok(fs.existsSync(mcpDist), "mcp dist renderErrors.js tồn tại (MCP đã build)");
    if (fs.existsSync(mcpDist)) {
      const snippet = [
        `import { buildRenderErrorDetail } from ${JSON.stringify(mcpDist)};`,
        `const d = buildRenderErrorDetail(${JSON.stringify(FIXTURES[0].input.stderr)}, 1);`,
        "console.log(JSON.stringify({ key: d.summaryKey, params: d.summaryParams }));",
      ].join("\n");
      const r = run("node", ["--input-type=module", "-e", snippet]);
      let out = null;
      try { out = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { /* fail ở dưới */ }
      eq(out && out.key, "speedCurveViolation", "MCP dist: buildRenderErrorDetail trả summaryKey");
      eq(out && out.params, FIXTURES[0].params, "MCP dist: buildRenderErrorDetail trả summaryParams");
    }
  }

  console.log("== [h] Đợt 63 R5: validationDetails qua buildErrorDetail ==");
  {
    // Dòng JSON validation do render.js in cuối stderr khi spec/media
    // fail — buildErrorDetail phải tách ra, parse, redact, đếm omitted,
    // và KHÔNG để JSON lọt vào details/redactedTail hay làm lệch
    // phân loại cũ.
    // Định dạng human lines THẬT của render.js khi spec fail (khóa ở
    // fixture "spec chung" mục [a]): "❌ Spec không hợp lệ (N lỗi):"
    // + "  1. [where] detail" — không có tiền tố [FFMPEG_ERROR].
    const mkStderr = (entries, omitted = 0, extra = "") => {
      const human = [
        "❌ Spec không hợp lệ (2 lỗi):",
        '  1. [tracks[0].clips[0]] "start" phải là số >= 0, nhận được: -1',
      ].join("\n");
      const payload = JSON.stringify({ errors: entries, warnings: [], omitted });
      return `${extra ? extra + "\n" : ""}${human}\nVCUT_VALIDATION_JSON ${payload}`;
    };
    const entries = [
      { where: "tracks[0].clips[0]", code: "NUMBER_MIN_0", params: { detail: '"start" phải là số >= 0, nhận được: -1', field: "start", got: "-1" } },
      { where: "tracks[0].clips[0]", code: "VALIDATION_DETAIL", params: { detail: 'mask "m" không hợp lệ' } },
    ];
    const d = buildErrorDetail({ stderr: mkStderr(entries), exitCode: 1 });
    eq(d.summaryKey, "specValidation", "[h] JSON validation không làm lệch phân loại SPEC_VALIDATION");
    eq(d.validationDetails.length, 2, "[h] validationDetails đủ 2 entries");
    eq(d.validationDetails[0].code, "NUMBER_MIN_0", "[h] entry 0 giữ code");
    eq(d.validationDetails[0].params.field, "start", "[h] entry 0 giữ param rời");
    eq(d.validationDetailsOmitted, 0, "[h] omitted 0 khi đủ entries");
    ok(!d.details.join(" ").includes("VCUT_VALIDATION_JSON"), "[h] details không lọt JSON");
    ok(!d.redactedTail.includes("VCUT_VALIDATION_JSON"), "[h] redactedTail không lọt JSON");
    // omitted: payload báo 3 lược nhưng chỉ gửi 2 entries.
    const d2 = buildErrorDetail({ stderr: mkStderr(entries, 3), exitCode: 1 });
    eq(d2.validationDetailsOmitted, 3, "[h] omitted đếm đúng số lược");
    // Redact: đường dẫn tuyệt đối trong params → basename.
    const d3 = buildErrorDetail({ stderr: mkStderr([
      { where: "clip \"c1\" (src: /home/u/x/clip.mp4)", code: "MEDIA_FILE_NOT_FOUND", params: { detail: 'không tìm thấy file "/home/u/x/clip.mp4"', file: "/home/u/x/clip.mp4" } },
    ]), exitCode: 1 });
    eq(d3.validationDetails[0].params.file, "<path>/clip.mp4", "[h] param file redact thành basename");
    ok(JSON.stringify(d3).indexOf("/home/u") === -1, "[h] không lọt home dir vào validationDetails");
    // Entry hỏng hình dạng → bỏ, không vỡ phân loại.
    const d4 = buildErrorDetail({ stderr: mkStderr([
      { where: "tracks[0]", code: "bad-code!", params: { detail: "x" } },
      { where: "tracks[0]", code: "NUMBER_MIN_0", params: { detail: "y", field: "start" } },
      "không phải object",
    ]), exitCode: 1 });
    eq(d4.validationDetails.length, 1, "[h] entry hỏng hình dạng bị bỏ, entry tốt còn lại");
    eq(d4.validationDetails[0].code, "NUMBER_MIN_0", "[h] entry tốt còn nguyên code");
    // JSON hỏng: phân loại cũ vẫn chạy, validationDetails rỗng.
    const d5 = buildErrorDetail({ stderr: "[FFMPEG_ERROR] không tìm thấy file\nVCUT_VALIDATION_JSON {không phải json", exitCode: 1 });
    // "không tìm thấy file" không kèm tên asset → missingAssetRaw
    // (missingAsset chỉ khi có tên asset — xem fixture mục [a]).
    eq(d5.summaryKey, "missingAssetRaw", "[h] JSON hỏng: phân loại cũ vẫn chạy");
    eq(d5.validationDetails, [], "[h] JSON hỏng: validationDetails rỗng");
    eq(d5.validationDetailsOmitted, 0, "[h] JSON hỏng: omitted 0");
    ok(!d5.redactedTail.includes("VCUT_VALIDATION_JSON"), "[h] JSON hỏng: tail không lọt JSON");
    // Không có JSON: field mới luôn có mặt, rỗng.
    const d6 = buildErrorDetail({ stderr: "lỗi thường, không có JSON", exitCode: 1 });
    eq(d6.validationDetails, [], "[h] không JSON → validationDetails []");
    eq(d6.validationDetailsOmitted, 0, "[h] không JSON → omitted 0");
    // JSON-only (không có dòng human): không bị phân loại sai thành
    // MISSING_ASSET vì chuỗi JSON chứa "không tìm thấy file".
    const d7 = buildErrorDetail({ stderr: "VCUT_VALIDATION_JSON " + JSON.stringify({ errors: entries, warnings: [], omitted: 0 }), exitCode: 1 });
    ok(d7.summaryKey !== "missingAsset", "[h] JSON-only không phân loại sai missingAsset");
    eq(d7.validationDetails.length, 2, "[h] JSON-only vẫn parse đủ entries");
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
