// measure-68v4-presented-launcher.mjs — Phase 9 đợt 68, luồng V4.
// Launcher chạy BẢN VARIANT của measure-65r8-presented-fps.mjs mà KHÔNG
// ghi file variant ra đĩa và KHÔNG sửa harness gốc.
// Lý do: ghi file từ tiến trình exec hay dính lỗi EPERM sau bind/spawn
// (xem docs/PHASE9_ROUND68_V4_PRESENTED_FPS_LIMITS.md §5); launcher đọc
// harness gốc, áp 15 thay thế chuỗi trong bộ nhớ, rồi import qua data: URL.
// LOGIC ĐO + GATE GIỮ NGUYÊN 100% (không hạ chuẩn): chỉ đổi phần chuẩn
// bị môi trường (cổng hardcode, config vite .cjs pre-create, pickDisplay
// không dùng execSync, mở log fd trước spawn, ghi cuối best-effort).
// Cách chạy (từ repo root):
//   R8_PRES_RES=1080 R8_PRES_REPEATS=3 \
//   R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round68-v4/presented-1080p-idle \
//   node apps/web/scripts/measure-68v4-presented-launcher.mjs
// Yêu cầu trước khi chạy:
//   - Config vite đã có sẵn tại /tmp/round68-v4/vite.v4-presented.config.cjs
//     (nội dung = template vite config của measure-65r8-presented-fps.mjs;
//     xem LIMITS V4 §5.2 để tạo lại bằng tay nếu thiếu). Launcher/variant
//     sẽ BỎ QUA ghi khi file đã có đúng nội dung; nếu file thiếu, variant
//     thử ghi 1 lần và có thể dính EPERM (môi trường).
//   - Cổng 5550 (vite) và 9650 (debug) trống (kiểm tra bằng `ss -ltn`).
//   - Đặt V4_DEV_PORT/V4_DEBUG_PORT nếu cần đổi cổng.
import fs from "node:fs";

const SRC = "/home/hatch/workspace/repo-1/apps/web/scripts/measure-65r8-presented-fps.mjs";

const HELPERS = [
  "// V4 (đợt 68): ghi file chịu lỗi EPERM môi trường — thử 1 lần, lỗi thì",
  "// cảnh báo qua log và tiếp tục (không ném). Dữ liệu đo vẫn có trong log console.",
  "function writeBestEffort(p, data) {",
  "  try { fs.writeFileSync(p, data); return true; }",
  "  catch (e) { log(`cảnh báo: không ghi được ${p} (${e.code || e.message}) — dữ liệu vẫn có trong log console`); return false; }",
  "}",
  "// V4: ghi config vite — KHÔNG ghi đè khi file đã có sẵn với đúng nội dung",
  "// cần (config được pre-create bằng file-tool trước khi chạy, vì ghi từ",
  "// tiến trình exec hay dính EPERM sau bind/spawn).",
  "function writeConfigBestEffort(p, content) {",
  "  try { if (fs.existsSync(p) && fs.readFileSync(p, \"utf8\") === content) { log(`config vite đã có sẵn đúng nội dung, bỏ qua ghi (${p})`); return true; } } catch {}",
  "  return writeBestEffort(p, content);",
  "}",
].join("\n");

const REPS = [
  // 1. Header: ghi rõ đây là variant V4, gate + logic đo giữ nguyên.
  [" * measure-65r8-presented-fps.mjs — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8):",
   " * measure-68v4-presented-fps.mjs — Phase 9 đợt 68, luồng V4: BẢN VARIANT của measure-65r8-presented-fps.mjs, logic đo + GATE GIỮ NGUYÊN 100% (không hạ chuẩn); chỉ đổi phần chuẩn bị môi trường để né lỗi EPERM hệ thống (xem LIMITS V4 §5): (1) hardcode cổng dev/debug 5550/9650 thay vì pickFreePort (bind localhost làm độc ghi file), (2) không ghi đè config vite khi đã pre-create, (3) pickDisplay không dùng execSync, (4) mở log fd trước mọi spawn, (5) ghi JSON/log cuối best-effort, (6) config vite dạng .cjs để vite dùng nhánh CJS (biên dịch trong bộ nhớ, không ghi temp file — nhánh ESM ghi .vite-temp và dính EPERM). Gốc (đợt 65 S8):"],
  // 2. Đổi thư mục config vite sang /tmp/round68-v4.
  ['const VITE_CFG_DIR = "/tmp/round65-r8";', 'const VITE_CFG_DIR = "/tmp/round68-v4";'],
  ['const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r8-presented.config.mjs");', 'const VITE_CFG = path.join(VITE_CFG_DIR, "vite.v4-presented.config.cjs"); // V4: .cjs để vite dùng nhánh CJS (biên dịch trong bộ nhớ, KHÔNG ghi temp file — nhánh ESM ghi .vite-temp và dính EPERM).'],
  ['const TMPDIR = "/tmp/round65-r8/tmp";', 'const TMPDIR = "/tmp/round68-v4/tmp";'],
  // 3. Hardcode cổng (đã kiểm tra trống bằng ss trước khi chạy), bỏ pickFreePort.
  ["const DEV_PORT = Number(process.env.R8_DEV_PORT || 0) || (await pickFreePort(5550, 5559));",
   "const DEV_PORT = Number(process.env.V4_DEV_PORT || 0) || 5550;"],
  ["const DEBUG_PORT = Number(process.env.R8_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));",
   "const DEBUG_PORT = Number(process.env.V4_DEBUG_PORT || 0) || 9650;"],
  // 4. Chèn helpers sau dòng const logLines.
  ["const logLines = [];", "const logLines = [];\n" + HELPERS],
  // 5. pickDisplay: bỏ execSync, kiểm tra liveness bằng connect socket Unix.
  ['      const { execSync } = await import("node:child_process");',
   "      // V4: bỏ execSync (spawn con làm độc ghi file) — kiểm tra liveness bằng connect socket Unix."],
  ['          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }',
   '          try { alive = await new Promise((res) => { const s = net.createConnection(sock); s.once("connect", () => { s.end(); res(true); }); s.once("error", () => res(false)); setTimeout(() => { try { s.destroy(); } catch {} res(false); }, 2000); }); } catch { alive = false; }'],
  // 6. Ghi config vite qua helper (bỏ qua khi đã có sẵn đúng nội dung).
  ["    fs.writeFileSync(VITE_CFG, ", "    writeConfigBestEffort(VITE_CFG, "],
  // 7. Mở chromeLogFd cùng lúc với viteLogFd (trước mọi spawn): trước hết
  //    thay dòng chromeLogFd gốc thành comment, rồi chèn dòng mở sau viteLogFd.
  ['    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-chrome.log"), "w");',
   "    // V4: chromeLogFd đã mở cùng viteLogFd ở trên (trước mọi spawn)."],
  ['    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-vite.log"), "w");',
   '    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-vite.log"), "w");\n    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-chrome.log"), "w");'],
  // 8. Ghi JSON/log cuối best-effort (không ném nếu EPERM — số đo vẫn có trong log console).
  ['    fs.writeFileSync(path.join(SCRATCH, "presented-fps.json"), JSON.stringify(report, null, 2));',
   '    writeBestEffort(path.join(SCRATCH, "presented-fps.json"), JSON.stringify(report, null, 2));'],
  ['    fs.writeFileSync(path.join(SCRATCH, "presented-fps.log"), logLines.join("\\n") + "\\n");',
   '    writeBestEffort(path.join(SCRATCH, "presented-fps.log"), logLines.join("\\n") + "\\n");'],
];

let src = fs.readFileSync(SRC, "utf8");
let n = 0;
for (const [search, replacement] of REPS) {
  if (!src.includes(search)) {
    console.error(`KHÔNG TÌM THẤY chuỗi cần thay (#${n + 1}): ${JSON.stringify(search.slice(0, 120))}`);
    process.exit(2);
  }
  src = src.replace(search, replacement);
  n++;
}
// V4 launcher: import.meta.url không dùng được qua data: URL → hardcode ROOT.
const ROOT_SEARCH = 'const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");';
if (!src.includes(ROOT_SEARCH)) { console.error("KHÔNG TÌM THẤY dòng ROOT"); process.exit(2); }
src = src.replace(ROOT_SEARCH, 'const ROOT = "/home/hatch/workspace/repo-1"; // V4 launcher: hardcode vì import qua data: URL.');
n++;
if (src.startsWith("#!")) src = src.slice(src.indexOf("\n") + 1); // bỏ shebang (data: URL)
console.log(`LAUNCHER: ${n} thay thế OK, import variant qua data: URL (${src.length} byte)`);
const b64 = Buffer.from(src).toString("base64");
await import(`data:text/javascript;base64,${b64}`);
