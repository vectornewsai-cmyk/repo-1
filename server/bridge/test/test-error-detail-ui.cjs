/**
 * Test cho Phase 9 đợt 29 luồng L3: web hiện errorDetail + bridge hết mù nốt.
 * Chạy bằng: node server/bridge/test/test-error-detail-ui.cjs
 * (không cần ffmpeg, không cần server thật, không cần network)
 *
 * Bao phủ:
 *  (a) buildTaskError: message chứa tail stderr thô (đường dẫn tuyệt đối,
 *      home dir, token, stack trace) → error + errorDetail đều sạch,
 *      mã phân loại đúng, exit code tách từ message;
 *  (b) buildTaskError với stderr riêng (kiểu bgremove err.stderrTail):
 *      redactedTail từ stderr, summary phân loại từ stderr;
 *  (c) worker module đã redact tail ở nguồn: kiểm tra tĩnh rằng các file
 *      caption/reframe/silence/beats/tts/bgremove/scene không còn mẫu
 *      `slice(-300)`/`slice(-500)` trên stderr CHƯA redact (mẫu còn lại
 *      phải đi qua redactStderr);
 *  (d) index.js: mọi route tác vụ (caption, translate, silence, reframe,
 *      beats, scene, bgremove, tts) đều dùng taskErrorPayload, không còn
 *      `e.message ||` thô ở các catch tác vụ (đợt 30 M3: /api/proxy cũng
 *      đã bọc taskErrorPayload, không còn ngoại lệ nào);
 *  (e) openapi.yaml: có schema ErrorCode/ErrorDetail, RenderJob có
 *      errorCode/errorDetail, GET /api/render/{id} có query `detail`;
 *  (f) ExportPanel.tsx: poll kèm ?detail=1, hiển thị errorDetail (code +
 *      summary + details) mà vẫn giữ error cũ làm mặc định.
 *
 * Test chỉ in nhãn pass/fail, KHÔNG in lại giá trị secret mẫu.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const { buildTaskError } = require("../src/errorDetail.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
const root = path.join(__dirname, "..", "..", "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
/** Chuỗi "độc" không được phép xuất hiện trong bất kỳ payload nào. */
function hasLeak(text) {
  const t = String(text || "");
  return (
    t.includes("/home/tranhai") ||
    t.includes("tranhai/projects") ||
    t.includes("sk-abcdefghij") ||
    t.includes("ghp_abcdef") ||
    t.includes("eyJhbGciOi") ||
    t.includes("    at validateSpec") ||
    t.includes("/tmp/vcut-out")
  );
}
function payloadText(p) {
  return JSON.stringify(p);
}

function main() {
  console.log("== [a] buildTaskError: tail thô độc hại → payload sạch + mã đúng ==");
  {
    const raw =
      "caption.py thoát mã 1: " +
      "ffmpeg đọc /home/tranhai/projects/secret/clip.mp4 thất bại\n" +
      "api_key=sk-abcdefghijklmnop1234567890\n" +
      "    at validateSpec (/home/tranhai/workspace/validate.js:1:2)\n" +
      "Error opening output file /tmp/vcut-out/final.mp4.";
    const p = buildTaskError({ message: raw });
    ok(!hasLeak(payloadText(p)), "không leak home/token/stack/tmp path trong error+detail");
    ok(p.errorCode === "FFMPEG_ERROR", `mã FFMPEG_ERROR (nhận: ${p.errorCode})`);
    ok(p.error.startsWith("caption.py thoát mã 1"), "error giữ tiền tố tên script + exit code");
    ok(p.error.length <= 520, "error ngắn (<= ~500 ký tự + dấu lược)");
    ok(p.errorDetail.details.length >= 1, "detail có dòng lỗi");
    ok(p.errorDetail.summary.includes("final.mp4"), "summary giữ basename output để nhận ra file");
  }
  {
    const p = buildTaskError({ message: "silence.py thoát mã 1: No such file or directory" });
    ok(p.errorCode === "MISSING_ASSET", `No such file → MISSING_ASSET (nhận: ${p.errorCode})`);
  }
  {
    const p = buildTaskError({
      message: "beat.py thất bại (exit 2): Invalid argument",
    });
    ok(p.errorCode === "FFMPEG_ERROR", `(exit 2) → FFMPEG_ERROR (nhận: ${p.errorCode})`);
  }
  {
    // Message không có exit code, không khớp pattern → UNKNOWN, không bịa mã.
    const p = buildTaskError({ message: "Tác vụ lạ không rõ nguyên nhân" });
    ok(p.errorCode === "UNKNOWN", `message lạ → UNKNOWN (nhận: ${p.errorCode})`);
    ok(p.error === "Tác vụ lạ không rõ nguyên nhân", "error giữ nguyên message lành");
  }

  console.log("== [b] buildTaskError với stderr riêng (kiểu bgremove) ==");
  {
    const p = buildTaskError({
      message: "Xóa nền thất bại (exit 1).",
      stderr:
        "FileNotFoundError: /home/tranhai/projects/secret/nguoi.mp4\n" +
        "No such file or directory: /tmp/vcut-out/nguoi.mp4",
      exitCode: 1,
    });
    ok(p.errorCode === "MISSING_ASSET", `stderr No such file → MISSING_ASSET (nhận: ${p.errorCode})`);
    ok(!hasLeak(payloadText(p)), "stderr riêng đã redact trong detail");
    ok(p.errorDetail.redactedTail.includes("nguoi.mp4"), "redactedTail giữ basename");
    ok(!p.errorDetail.redactedTail.includes("/home/"), "redactedTail không còn đường dẫn tuyệt đối");
  }

  console.log("== [c] worker module redact tail ở nguồn (kiểm tra tĩnh) ==");
  {
    const files = ["caption", "reframe", "silence", "beats", "tts", "bgremove", "scene"];
    for (const f of files) {
      const src = read(`server/bridge/src/${f}.js`);
      ok(src.includes('require("./errorDetail")'), `${f}.js require errorDetail`);
    }
    // Không còn mẫu slice thô trên stderr chưa redact: mọi slice(-300)/slice(-500)
    // còn lại trong các file này phải nằm cùng dòng với redactStderr.
    for (const f of ["caption", "reframe", "silence", "beats"]) {
      const lines = read(`server/bridge/src/${f}.js`).split("\n");
      const rawSlices = lines.filter(
        (l) => /slice\(-(300|500)\)/.test(l) && !l.includes("redactStderr")
      );
      ok(rawSlices.length === 0, `${f}.js không còn slice tail thô (còn ${rawSlices.length})`);
    }
    const scene = read("server/bridge/src/scene.js");
    ok(scene.includes("redactStderr(msg)"), "scene.js redact dòng [scene] LỖI");
    const bg = read("server/bridge/src/bgremove.js");
    ok(bg.includes("redactStderr(stderrAll)"), "bgremove.js redact stderrAll + stderrTail");
  }

  console.log("== [d] index.js: route tác vụ dùng taskErrorPayload ==");
  {
    const idx = read("server/bridge/src/index.js");
    const routes = [
      ["caption stream", "Caption thất bại."],
      ["reframe", "Reframe thất bại."],
      ["reframe/analyze", "Phân tích reframe thất bại."],
      ["beats", "Phân tích beat thất bại."],
      ["bgremove", "Xóa nền thất bại."],
      ["silence", "Phân tích khoảng lặng thất bại."],
      ["scene stream", "Tách cảnh thất bại."],
      ["translate stream", "Dịch phụ đề thất bại."],
      ["tts", "TTS thất bại."],
      ["tts/clone", "TTS clone thất bại."],
    ];
    for (const [name, fallback] of routes) {
      ok(idx.includes(`taskErrorPayload(e, "${fallback}")`), `${name} dùng taskErrorPayload`);
    }
    // Đợt 30 M3: /api/proxy đã bọc taskErrorPayload — không còn catch
    // 500 nào trả e.message thô (trước đây proxy là ngoại lệ duy nhất).
    const rawTaskErrors = (idx.match(/res\.status\(500\)\.json\(\{ error: e\.message/g) || []).length;
    ok(rawTaskErrors === 0, `không còn catch 500 e.message thô, đếm được ${rawTaskErrors}`);
    ok(idx.includes('taskErrorPayload(e, "Tạo proxy thất bại.")'), "/api/proxy dùng taskErrorPayload");
    ok(idx.includes('req.query.detail === "1"') && idx.includes("/api/proxy"),
      "/api/proxy chỉ kèm errorDetail khi ?detail=1");
  }

  console.log("== [e] openapi.yaml: schema lỗi có cấu trúc ==");
  {
    const yaml = read("server/bridge/openapi.yaml");
    ok(yaml.includes("ErrorCode:"), "có schema ErrorCode");
    ok(yaml.includes("ErrorDetail:"), "có schema ErrorDetail");
    ok(yaml.includes("SPEED_CURVE_VIOLATION, MISSING_ASSET"), "ErrorCode liệt kê đủ enum");
    ok(yaml.includes("name: detail"), "GET /api/render/{id} có query detail");
    ok(yaml.includes("errorDetail:"), "RenderJob/Error có field errorDetail");
  }

  console.log("== [f] ExportPanel.tsx: poll ?detail=1 + hiển thị detail ==");
  {
    const panel = read("apps/web/src/ExportPanel.tsx");
    ok(panel.includes("/api/render/${id}?detail=1"), "poll kèm ?detail=1");
    ok(panel.includes("renderErrorDetail"), "có state renderErrorDetail");
    ok(panel.includes("data.errorDetail"), "đọc errorDetail từ payload poll");
    // Đợt 30 M4 đã dịch chuỗi này qua i18n (thay chuỗi cứng tạm của L3):
    // tiêu đề dùng key exportPanel.errorDetailTitle + code, summary vẫn render.
    // Đợt 34 Q4: summary render qua localizedErrorSummary (dịch khung theo
    // summaryKey, fallback về summary thô khi payload cũ/thiếu param).
    ok(panel.includes('t("exportPanel.errorDetailTitle"') && panel.includes("renderErrorDetail.code") && panel.includes("localizedErrorSummary(renderErrorDetail"),
      "UI hiển thị mã + summary detail (qua localizedErrorSummary)");
    ok(panel.includes("detailsOmitted"), "UI hiển thị số dòng đã lược");
    // error cũ vẫn là mặc định: setRenderError vẫn lấy data.error trước.
    ok(panel.includes('setRenderError(data.error || "Render thất bại (không rõ lý do).")'),
      "error cũ vẫn làm mặc định");
    ok(/from "\.\/.*i18n/.test(panel) || panel.includes("exportPanel.errorDetailTitle"),
      "chuỗi errorDetail đã qua i18n (đợt 30 M4, thay chuỗi cứng tạm của L3)");
  }

  console.log(`\n${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}

main();
