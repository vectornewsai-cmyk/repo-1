// bridgeErrors62R5.test.ts — Phase 9 đợt 62, luồng R5: giao thức mã lỗi
// bridge→web (đóng nợ đợt 61 R6 §4.1 — bridge/server user-facing chưa nối).
// Đợt 63 R5 mở rộng lên 102 mã (91 đợt 62 + 11 TASK_*): fragment là
// HỢP của round62-r5 (hidden_files, 91 mã, ĐÃ gộp vào dict đợt 62) +
// round63-r5.json bridgeErrors.* (11 mã TASK_*, ĐÃ gộp — parent gộp đợt 63).
//
// Khóa 3 chiều: catalog server (server/bridge/src/errorCodes.js) ==
// tập mã web (./bridgeErrors) == key `bridgeErrors.*` trong fragment hợp.
//
// Cách chạy (mẫu R6, từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/bridgeErrors62R5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round62-r5/r5.test.cjs \
//     && node /tmp/round62-r5/r5.test.cjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  BRIDGE_ERROR_CODES,
  resolveBridgeApiError,
  type BridgeApiErrorBody,
} from "./bridgeErrors";
import { localizedErrorSummary } from "./errorDetailSummary";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`R5 bridge error protocol round 62+63: ${pass}/${queue.length} pass`);
}

type Dict = Record<string, unknown>;
function flatten(d: Dict, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === "string") out.set(prefix + k, v);
    else if (v && typeof v === "object") {
      for (const [kk, vv] of flatten(v as Dict, prefix + k + ".")) out.set(kk, vv);
    }
  }
  return out;
}
function placeholders(s: string): string[] {
  return [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
}

const FRAG_PATH =
  "../goals/capcut-clone-video-editor/hidden_files/round62-r5-fragment.json";
const frag62 = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as { vi: Dict; en: Dict };
// Đợt 63 R5: 11 mã TASK_* nằm trong fragment round63-r5 (đã gộp dict lúc parent gộp đợt 63).
const frag63 = JSON.parse(
  readFileSync("apps/web/src/i18n/fragments/round63-r5.json", "utf8"),
) as { vi: Dict; en: Dict };
const FRAG_VI = new Map<string, string>([
  ...flatten(frag62.vi),
  ...flatten(frag63.vi).entries(),
].filter(([k]) => k.startsWith("bridgeErrors.")));
const FRAG_EN = new Map<string, string>([
  ...flatten(frag62.en),
  ...flatten(frag63.en).entries(),
].filter(([k]) => k.startsWith("bridgeErrors.")));
/** 91 mã gốc đợt 62 (đã gộp dict) — để phân biệt với 11 mã R5 chưa gộp. */
const FRAG62_VI = flatten(frag62.vi);

/** t() giả lập đúng quy ước i18n/index.ts, đọc từ fragment (dict đã gộp). */
function fakeT(lang: "vi" | "en"): (key: string, vars?: Record<string, string>) => string {
  const dict = lang === "vi" ? FRAG_VI : FRAG_EN;
  return (key: string, vars?: Record<string, string>): string => {
    const raw = dict.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
/** t() giả lập khi fragment CHƯA gộp (dict thiếu key → trả về chính key). */
function missingKeyT(): (key: string, vars?: Record<string, string>) => string {
  return (key: string): string => key;
}

ok("fragment: 102 key bridgeErrors.* vi/en (91 đợt 62 + 11 TASK_* đợt 63), placeholder khớp, vi≠en, không rỗng", () => {
  assert.equal(FRAG_VI.size, 102, `fragment vi phải có 102 key, nhận ${FRAG_VI.size}`);
  assert.equal(FRAG_EN.size, 102, `fragment en phải có 102 key, nhận ${FRAG_EN.size}`);
  assert.equal(FRAG62_VI.size, 91, `phần đợt 62 phải có 91 key, nhận ${FRAG62_VI.size}`);
  for (const k of FRAG_VI.keys()) {
    assert.ok(k.startsWith("bridgeErrors."), `${k}: key phải có tiền tố bridgeErrors.`);
    assert.ok(FRAG_EN.has(k), `fragment en thiếu key ${k}`);
    const v = FRAG_VI.get(k)!;
    const e = FRAG_EN.get(k)!;
    assert.ok(v.length > 0, `${k}: vi rỗng`);
    assert.ok(e.length > 0, `${k}: en rỗng`);
    assert.notEqual(v, e, `${k}: vi phải khác en`);
    assert.deepEqual(placeholders(v), placeholders(e), `${k}: placeholder vi/en lệch`);
  }
  for (const k of FRAG_EN.keys()) assert.ok(FRAG_VI.has(k), `fragment vi thiếu key ${k}`);
});

ok("fragment: 102 key bridgeErrors.* ĐÃ có trong dict (post-merge đợt 63)", () => {
  const viDict = flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Dict);
  const enDict = flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Dict);
  for (const k of FRAG62_VI.keys()) {
    assert.ok(viDict.has(k), `${k}: thiếu trong vi.json (parent gộp đợt 62 phải đưa key này vào dict)`);
    assert.ok(enDict.has(k), `${k}: thiếu trong en.json`);
    assert.equal(viDict.get(k), FRAG_VI.get(k), `${k}: giá trị vi.json lệch fragment`);
    assert.equal(enDict.get(k), FRAG_EN.get(k), `${k}: giá trị en.json lệch fragment`);
  }
  // 11 mã TASK_* đợt 63 R5 đã gộp (parent gộp đợt 63): assert ĐÃ có
  // trong dict đúng từng chữ (mẫu R5 LIMITS §7).
  for (const k of FRAG_VI.keys()) {
    if (FRAG62_VI.has(k)) continue;
    assert.ok(viDict.has(k), `${k}: thiếu trong vi.json (parent gộp đợt 63 phải đưa key này vào dict)`);
    assert.ok(enDict.has(k), `${k}: thiếu trong en.json`);
    assert.equal(viDict.get(k), FRAG_VI.get(k), `${k}: giá trị vi.json lệch fragment`);
    assert.equal(enDict.get(k), FRAG_EN.get(k), `${k}: giá trị en.json lệch fragment`);
  }
  // Không trùng bất kỳ fragment nào khác trong hidden_files.
  const dir = "../goals/capcut-clone-video-editor/hidden_files";
  for (const f of readdirSync(dir)) {
    if (!/fragment.*\.json$/.test(f) || f === "round62-r5-fragment.json") continue;
    const other = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as { vi?: Dict };
    if (!other.vi) continue;
    for (const k of flatten(other.vi).keys()) {
      assert.ok(!FRAG_VI.has(k), `key ${k} trùng trong fragment ${f}`);
    }
  }
});

ok("3 chiều: catalog server == tập mã web == key fragment (102 mã)", () => {
  // Catalog server: parse khối BRIDGE_ERROR_CODES trong errorCodes.js
  // (tránh import cross-package trong tsc — xem LIMITS §2.4).
  const src = readFileSync("server/bridge/src/errorCodes.js", "utf8");
  const block = src.slice(src.indexOf("const BRIDGE_ERROR_CODES = {"), src.indexOf("};", src.indexOf("const BRIDGE_ERROR_CODES = {")));
  const catalog = new Set([...block.matchAll(/^\s{2}([A-Z][A-Z0-9_]*): \[/gm)].map((m) => m[1]));
  assert.equal(catalog.size, 102, `catalog server phải có 102 mã, nhận ${catalog.size}`);
  assert.equal(BRIDGE_ERROR_CODES.size, 102, `tập mã web phải có 102 mã, nhận ${BRIDGE_ERROR_CODES.size}`);
  for (const code of catalog) {
    assert.ok(BRIDGE_ERROR_CODES.has(code), `web thiếu mã ${code}`);
    assert.ok(FRAG_VI.has(`bridgeErrors.${code}`), `fragment thiếu mã ${code}`);
  }
  for (const code of BRIDGE_ERROR_CODES) {
    assert.ok(catalog.has(code), `catalog server thiếu mã ${code}`);
  }
  // Không trùng mã phân loại render của errorDetail.js.
  for (const renderCode of [
    "SPEED_CURVE_VIOLATION", "MISSING_ASSET", "SPEC_VALIDATION",
    "OUTPUT_QA", "WORKER_START", "WORKER_EXIT", "FFMPEG_ERROR", "UNKNOWN",
  ]) {
    assert.ok(!catalog.has(renderCode), `mã bridge trùng mã render ${renderCode}`);
    assert.ok(!BRIDGE_ERROR_CODES.has(renderCode), `web trùng mã render ${renderCode}`);
  }
});

ok("call site server: mọi mã lỗi đều trong catalog; mọi mã đều có call site", () => {
  const files = [
    "server/bridge/src/index.js",
    "server/bridge/src/rateLimit.js",
    "server/bridge/src/jobQueue.js",
    "server/bridge/src/caption.js",
    "server/bridge/src/reframe.js",
    "server/bridge/src/tts.js",
    "server/bridge/src/bgremove.js",
    "server/bridge/src/silence.js",
    "server/bridge/src/scene.js",
  ];
  // Mã nội bộ KHÔNG thuộc giao thức bridge→web (đúng thiết kế):
  //  - RENDER_CODES: mã phân loại render của errorDetail.js.
  //  - JOBQUEUE_CODES: mã throw nội bộ của jobQueue (bridge map sang mã
  //    catalog ở route — NOT_FOUND→JOB_NOT_FOUND, BAD_STATE→JOB_RETRY_*,
  //    GONE→JOB_GONE; BAD_ID/DUP_ID không tới được từ API).
  //  - MULTER_CODES: mã lỗi của multer (LIMIT_FILE_SIZE→UPLOAD_FILE_TOO_LARGE…).
  const RENDER_CODES = new Set([
    "SPEED_CURVE_VIOLATION", "MISSING_ASSET", "SPEC_VALIDATION",
    "OUTPUT_QA", "WORKER_START", "WORKER_EXIT", "FFMPEG_ERROR", "UNKNOWN",
  ]);
  const JOBQUEUE_CODES = new Set(["NOT_FOUND", "BAD_STATE", "GONE", "BAD_ID", "DUP_ID"]);
  const MULTER_CODES = new Set(["LIMIT_FILE_SIZE", "LIMIT_FILE_COUNT"]);
  const used = new Set<string>();
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    // Chỉ quét các vị trí mang mã lỗi (không quét chuỗi dữ liệu như "ID3"
    // trong bảng magic bytes): apiError(/codedError(/apiErrorFrom(/
    // errorCode:/err.code =/e.code ===.
    const codeAt = (re: RegExp): void => {
      for (const m of src.matchAll(re)) {
        const code = m[1];
        assert.ok(
          BRIDGE_ERROR_CODES.has(code) || RENDER_CODES.has(code) ||
          JOBQUEUE_CODES.has(code) || MULTER_CODES.has(code),
          `${f}: mã ${code} không thuộc họ mã nào đã biết`,
        );
        if (BRIDGE_ERROR_CODES.has(code)) used.add(code);
      }
    };
    codeAt(/(?:apiError|codedError)\(\s*"([A-Z][A-Z0-9_]*)"/g);
    codeAt(/apiErrorFrom\([^)]*"([A-Z][A-Z0-9_]*)"/g);
    codeAt(/errorCode: "([A-Z][A-Z0-9_]*)"/g);
    codeAt(/(?:err|e)\.code = "([A-Z][A-Z0-9_]*)"/g);
    codeAt(/(?:err|e)\.code === "([A-Z][A-Z0-9_]*)"/g);
  }
  // Mã chọn qua ternary/biến (vd JOB_RETRY_BAD_STATE/JOB_RETRY_CANCELLED
  // trong route retry) không nằm sát apiError( nên quét riêng: mỗi mã
  // catalog phải xuất hiện dạng "CODE" ở ít nhất một file triển khai.
  // Đợt 63 R5: 11 mã TASK_* được dùng qua taskErrorPayload(e, "...",
  // "TASK_*") trong index.js — cũng rơi vào nhánh quét riêng này.
  const allSrc = files.map((f) => readFileSync(f, "utf8")).join("\n");
  for (const code of BRIDGE_ERROR_CODES) {
    if (allSrc.includes(`"${code}"`)) used.add(code);
  }
  for (const code of BRIDGE_ERROR_CODES) {
    assert.ok(used.has(code), `mã ${code} trong catalog nhưng không có call site nào dùng`);
  }
  assert.equal(used.size, 102, `phải dùng đủ 102 mã, nhận ${used.size}`);
});

ok("resolver: mã quen thuộc dịch đúng vi/en, đủ tham số", () => {
  const tVi = fakeT("vi");
  const tEn = fakeT("en");
  const cases: Array<[BridgeApiErrorBody, string, string]> = [
    [{ error: "Job id không hợp lệ.", errorCode: "INVALID_JOB_ID" }, "Job id không hợp lệ.", "Invalid job id."],
    [{ error: "Không tìm thấy job.", errorCode: "JOB_NOT_FOUND" }, "Không tìm thấy job.", "Job not found."],
    [{ error: "old", errorCode: "RATE_LIMITED", errorParams: { retryAfter: "42" } }, "Quá nhiều request — thử lại sau 42s.", "Too many requests — try again in 42s."],
    [{ error: "old", errorCode: "UNSUPPORTED_LANG", errorParams: { lang: "xx", langs: "vi, en" } }, "Ngôn ngữ không hỗ trợ: \"xx\". Chọn một trong: vi, en.", "Unsupported language: \"xx\". Choose one of: vi, en."],
    [{ error: "old", errorCode: "MAGIC_MISMATCH", errorParams: { name: "a.mp4", ext: ".mp4" } }, "File \"a.mp4\" có đuôi .mp4 nhưng nội dung không khớp định dạng (có thể là file giả mạo).", "File \"a.mp4\" has a .mp4 extension but its content does not match the format (it may be a fake file)."],
    [{ error: "old", errorCode: "CAPTION_NOT_READY", errorParams: { reason: "Không tìm thấy caption.py (/x/caption.py)" } }, "Caption chưa sẵn sàng: Không tìm thấy caption.py (/x/caption.py)", "Caption is not ready: Không tìm thấy caption.py (/x/caption.py)"],
    [{ error: "old", errorCode: "JOB_RETRY_CANCELLED", errorParams: { status: "cancelled" } }, "Chỉ retry được job ở trạng thái \"error\" hoặc \"interrupted\" (hiện tại: \"cancelled\"). Job đã huỷ thì thư mục tạm đã bị xóa — hãy tạo job mới.", "Only jobs in \"error\" or \"interrupted\" state can be retried (current: \"cancelled\"). A cancelled job's temp folder has been deleted — please create a new job."],
  ];
  for (const [body, wantVi, wantEn] of cases) {
    assert.equal(resolveBridgeApiError(body, tVi, "FALLBACK"), wantVi, `${body.errorCode} vi`);
    assert.equal(resolveBridgeApiError(body, tEn, "FALLBACK"), wantEn, `${body.errorCode} en`);
  }
});

ok("resolver: mọi mã đều render được ở cả 2 locale (param giả từ template)", () => {
  for (const lang of ["vi", "en"] as const) {
    const t = fakeT(lang);
    for (const code of BRIDGE_ERROR_CODES) {
      const tpl = (lang === "vi" ? FRAG_VI : FRAG_EN).get(`bridgeErrors.${code}`)!;
      const params: Record<string, string> = {};
      for (const p of placeholders(tpl)) params[p] = "X";
      const out = resolveBridgeApiError({ error: "chuỗi cũ", errorCode: code, errorParams: params }, t, "FALLBACK");
      assert.ok(!out.includes("{"), `${code} ${lang}: còn sót placeholder trong "${out}"`);
      assert.ok(!out.includes(`bridgeErrors.${code}`), `${code} ${lang}: lộ key`);
      assert.notEqual(out, "FALLBACK", `${code} ${lang}: rớt về fallback`);
    }
  }
});

ok("resolver: tương thích ngược — payload cũ / mã lạ / key chưa gộp → chuỗi cũ", () => {
  const tVi = fakeT("vi");
  // Payload cũ (không có errorCode) → error nguyên vẹn.
  assert.equal(
    resolveBridgeApiError({ error: "Lỗi cũ từ bridge xưa." }, tVi, "FALLBACK"),
    "Lỗi cũ từ bridge xưa.",
  );
  // Mã lạ (bridge mới hơn web) → error nguyên vẹn.
  assert.equal(
    resolveBridgeApiError({ error: "Lỗi mới.", errorCode: "SOME_FUTURE_CODE" }, tVi, "FALLBACK"),
    "Lỗi mới.",
  );
  // Mã quen nhưng key chưa gộp vào dict (t trả về chính key) → error cũ.
  assert.equal(
    resolveBridgeApiError({ error: "Job id không hợp lệ.", errorCode: "INVALID_JOB_ID" }, missingKeyT(), "FALLBACK"),
    "Job id không hợp lệ.",
  );
  // Thiếu param → template còn {var} → error cũ.
  assert.equal(
    resolveBridgeApiError({ error: "Quá nhiều request — thử lại sau 42s.", errorCode: "RATE_LIMITED", errorParams: {} }, tVi, "FALLBACK"),
    "Quá nhiều request — thử lại sau 42s.",
  );
  // errorParams lẫn số → ép string, dịch bình thường.
  assert.equal(
    resolveBridgeApiError({ error: "old", errorCode: "RATE_LIMITED", errorParams: { retryAfter: 7 } }, tVi, "FALLBACK"),
    "Quá nhiều request — thử lại sau 7s.",
  );
  // Body null / error rỗng → fallback của caller.
  assert.equal(resolveBridgeApiError(null, tVi, "FALLBACK"), "FALLBACK");
  assert.equal(resolveBridgeApiError({}, tVi, "FALLBACK"), "FALLBACK");
  assert.equal(resolveBridgeApiError({ error: "   " }, tVi, "FALLBACK"), "FALLBACK");
});

ok("resolver: errorDetail.summary vẫn đi đường riêng; poll tắt được đường đó", () => {
  const tVi = fakeT("vi");
  const detail = {
    code: "WORKER_EXIT",
    summary: "Render worker thoát với mã 1.",
    summaryKey: "workerExitCode",
    summaryParams: { exitCode: "1" },
    details: [],
    detailsOmitted: 0,
    redactedTail: "",
  };
  // SSE/task error có errorDetail → dịch summary (mã render UNKNOWN
  // không nằm trong catalog nên không chặn đường summary).
  assert.equal(
    resolveBridgeApiError({ error: "Render worker thoát với mã 1.", errorCode: "UNKNOWN", errorDetail: detail }, tVi, "FALLBACK"),
    localizedErrorSummary(detail, tVi),
  );
  // Poll job: useErrorDetailSummary:false → giữ chuỗi error cũ (detail
  // panel đã hiển thị summary), nhưng mã bridgeErrors vẫn dịch.
  assert.equal(
    resolveBridgeApiError({ error: "Render worker thoát với mã 1.", errorCode: "UNKNOWN", errorDetail: detail }, tVi, "FALLBACK", { useErrorDetailSummary: false }),
    "Render worker thoát với mã 1.",
  );
  assert.equal(
    resolveBridgeApiError({ error: "Bị gián đoạn do bridge restart — dùng retry để render lại từ đầu.", errorCode: "JOB_INTERRUPTED_BY_RESTART" }, tVi, "FALLBACK", { useErrorDetailSummary: false }),
    "Bị gián đoạn do bridge restart — dùng retry để render lại từ đầu.",
  );
  // errorDetail không có summaryKey → localizedErrorSummary trả summary thô.
  const noKey = { ...detail, summaryKey: undefined };
  assert.equal(
    resolveBridgeApiError({ error: "x", errorDetail: noKey }, tVi, "FALLBACK"),
    "Render worker thoát với mã 1.",
  );
});

ok("fragment: param của mỗi mã khớp catalog server (tên tham số)", () => {
  // Parse catalog kèm danh sách param từ errorCodes.js.
  const src = readFileSync("server/bridge/src/errorCodes.js", "utf8");
  const block = src.slice(src.indexOf("const BRIDGE_ERROR_CODES = {"), src.indexOf("};", src.indexOf("const BRIDGE_ERROR_CODES = {")));
  for (const m of block.matchAll(/^\s{2}([A-Z][A-Z0-9_]*): \[([^\]]*)\]/gm)) {
    const code = m[1];
    const params = m[2].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean);
    const tpl = FRAG_VI.get(`bridgeErrors.${code}`)!;
    assert.deepEqual(placeholders(tpl), [...params].sort(), `${code}: param fragment lệch catalog`);
  }
});

runAll();
