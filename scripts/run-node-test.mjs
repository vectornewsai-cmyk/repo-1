#!/usr/bin/env node
/**
 * run-node-test.mjs — Runner chuẩn cho test Node của VCut (đợt 62 R9).
 *
 * Vấn đề: repo không có test framework (không vitest/jest); mỗi file
 * *.test.ts tự chạy bằng `node` hoặc esbuild bundle + `node`, nhưng
 * KHÔNG PHẢI file nào cũng chạy được bằng cùng một cách — chọn sai là
 * crash dù code sản phẩm đúng (xem docs/PHASE9_ROUND62_R9_TEST_RUNNER_LIMITS.md):
 *
 *   - File dùng `import.meta.url` (vd createRequire, fileURLToPath):
 *     bundle `--format=cjs` gãy vì esbuild để trống import.meta
 *     (cảnh báo empty-import-meta) → `import.meta.url` là undefined.
 *     Chạy trực tiếp bằng node (type-stripping, Node ≥ 22.18).
 *   - Riêng `import.meta.env` (duy nhất bridgeUrl.ts:17 đọc
 *     VITE_BRIDGE_URL): bundle cjs KHÔNG còn cảnh báo empty-import-meta
 *     từ đợt 63 R9 — runner truyền `--define:import.meta.env={}` để cho
 *     nó giá trị thật {} thay vì để trống (ngữ nghĩa giữ nguyên:
 *     .env undefined hay {} thì BRIDGE_URL đều mặc định 8787 — đã đo).
 *     `import.meta.url` vẫn gãy ở cjs như trên (define chỉ phủ .env).
 *   - File có top-level await: bundle cjs gãy lúc build; bundle
 *     `--format=esm` mới chạy được (hoặc node trực tiếp).
 *   - Mặc định: bundle `--format=cjs` — bắt buộc với file import
 *     validate.js (dynamic require("child_process") gãy ở bundle ESM),
 *     file dùng react-dom/server, và file import không đuôi mở rộng
 *     (Node type-stripping không resolve được, esbuild thì được).
 *
 * Runner tự chọn mode theo file (in lý do ra stdout để sai thì thấy ngay):
 *   1. Marker tường minh trong header file: `@runner direct|cjs|esm`
 *      (vd: `* @runner cjs`) — ưu tiên cao nhất.
 *   2. Nội dung file (đã bỏ comment): có `import.meta.url` → direct;
 *      có top-level await (await ở cột 0) → esm.
 *   3. Mặc định → cjs.
 *
 * Cách dùng (chạy từ bất cứ đâu trong repo; runner tự về gốc repo):
 *   node scripts/run-node-test.mjs apps/web/src/lib/webglLut.test.ts
 *   node scripts/run-node-test.mjs apps/web/src/components/speed/speedcurveTrim.test.ts \
 *     apps/web/src/components/speed/splitPatch.store.test.ts
 *   node scripts/run-node-test.mjs <file> --repeat 3   # chạy lặp (kiểm crash lúc thoát)
 *   node scripts/run-node-test.mjs <file> --mode cjs   # ép mode cho mọi file
 *   node scripts/run-node-test.mjs <file> --keep       # giữ lại bundle ở /tmp
 *
 * Bundle tạm nằm ở /tmp/vcut-run-test-XXXXXX/ và bị xóa sau mỗi lượt
 * (trừ --keep); KHÔNG tạo file trong cây repo. Exit code: 0 khi mọi file
 * mọi lượt đều pass, 1 khi có file fail hoặc esbuild/node crash.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ESBUILD = path.join(REPO_ROOT, "node_modules", ".bin", "esbuild");

const MODES = ["direct", "cjs", "esm"];

/** Bỏ comment // và block comment để soi code thật (chỉ phục vụ detect). */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

/** Top-level await: `await ...` hoặc `const x = await ...` ở cột 0. */
const TLA_RE = /^(?:await\s|(?:const|let|var)\b[^\n;]*=\s*await\s)/m;

function detectMode(file, src) {
  const head = src.split("\n").slice(0, 50).join("\n");
  const marker = head.match(/@runner\s+(direct|cjs|esm)\b/);
  if (marker) return { mode: marker[1], reason: "marker @runner trong header" };
  const code = stripComments(src);
  if (code.includes("import.meta.url")) {
    return {
      mode: "direct",
      reason: "dùng import.meta.url (bundle cjs để trống import.meta)",
    };
  }
  if (TLA_RE.test(code)) {
    return { mode: "esm", reason: "có top-level await (bundle cjs không build được)" };
  }
  return { mode: "cjs", reason: "mặc định (validate.js / react-dom/server / import không đuôi)" };
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: REPO_ROOT, ...opts });
  if (r.error) {
    console.error(`không chạy được ${cmd}: ${r.error.message}`);
    return 127;
  }
  return r.status ?? 1;
}

function resolveTestArg(file) {
  // Đường dẫn tương đối ưu tiên cwd của lần gọi (vd chạy từ apps/web với
  // src/lib/x.test.ts), rồi mới tới gốc repo — runner dùng được từ bất
  // cứ đâu trong repo, còn bundle/test luôn chạy với cwd = gốc repo.
  const fromCwd = path.resolve(process.cwd(), file);
  if (existsSync(fromCwd)) return fromCwd;
  return path.resolve(REPO_ROOT, file);
}

function runOne(file, mode, keep) {
  const abs = resolveTestArg(file);
  if (!existsSync(abs)) {
    console.error(`FAIL ${file}: không tìm thấy file`);
    return 1;
  }
  if (mode === "direct") {
    console.log(`-- ${file} [direct: node ${path.relative(REPO_ROOT, abs)}]`);
    return run(process.execPath, [abs]);
  }
  const ext = mode === "cjs" ? ".cjs" : ".mjs";
  const dir = mkdtempSync(path.join(tmpdir(), "vcut-run-test-"));
  const out = path.join(dir, `${path.basename(abs, ".ts")}${ext}`);
  const buildArgs = [
    abs,
    "--bundle",
    "--platform=node",
    `--format=${mode}`,
    `--outfile=${out}`,
    "--log-level=warning",
  ];
  // Đợt 63 R9: bundle cjs + `--define:import.meta.env={}` để TRIỆT
  // warning empty-import-meta từ bridgeUrl.ts:17 (import.meta.env)
  // bằng cách cho import.meta.env một GIÁ TRỊ thật thay vì để esbuild
  // bỏ trống — KHÔNG phải giấu log (--log-level vẫn warning).
  // Ngữ nghĩa giữ nguyên: trước đây import.meta -> {} nên .env là
  // undefined -> BRIDGE_URL mặc định 127.0.0.1:8787; nay define {} thì
  // .env cũng là {} -> cùng mặc định (đã đo bằng probe: cả 2 cách đều
  // ra 127.0.0.1:8787; define có giá trị còn inject được VITE_BRIDGE_URL).
  // Chỉ áp cho cjs — bundle esm giữ import.meta thật, không define.
  if (mode === "cjs") buildArgs.push("--define:import.meta.env={}");
  const build = run(ESBUILD, buildArgs);
  if (build !== 0) {
    console.error(`FAIL ${file}: esbuild --format=${mode} lỗi (exit ${build})`);
    if (!keep) rmSync(dir, { recursive: true, force: true });
    return 1;
  }
  console.log(`-- ${file} [bundle --format=${mode} -> node]`);
  const code = run(process.execPath, [out]);
  if (!keep) rmSync(dir, { recursive: true, force: true });
  else console.log(`   (giữ bundle: ${out})`);
  return code;
}

function main() {
  const argv = process.argv.slice(2);
  const files = [];
  let repeat = 1;
  let keep = false;
  let forcedMode = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repeat") repeat = Math.max(1, Number(argv[++i]) || 1);
    else if (a === "--keep") keep = true;
    else if (a === "--mode") {
      forcedMode = argv[++i];
      if (!MODES.includes(forcedMode)) {
        console.error(`--mode phải là một trong: ${MODES.join(", ")}`);
        return 1;
      }
    } else if (a.startsWith("--")) {
      console.error(`flag không biết: ${a}`);
      return 1;
    } else files.push(a);
  }
  if (files.length === 0) {
    console.error(
      "Cách dùng: node scripts/run-node-test.mjs <test-file...> [--repeat N] [--keep] [--mode direct|cjs|esm]",
    );
    return 1;
  }
  if (!existsSync(ESBUILD)) {
    console.error(`không tìm thấy esbuild ở ${ESBUILD} (chạy npm install ở gốc repo)`);
    return 1;
  }
  console.log(`run-node-test: node ${process.version}, gốc repo ${REPO_ROOT}`);
  let failed = 0;
  for (const file of files) {
    const abs = resolveTestArg(file);
    if (!existsSync(abs)) {
      console.error(`FAIL ${file}: không tìm thấy file`);
      failed++;
      continue;
    }
    const src = readFileSync(abs, "utf8");
    const picked = forcedMode
      ? { mode: forcedMode, reason: "ép bằng --mode" }
      : detectMode(file, src);
    console.log(`== ${file} → mode=${picked.mode} (${picked.reason})`);
    for (let n = 1; n <= repeat; n++) {
      if (repeat > 1) console.log(`   lượt ${n}/${repeat}`);
      const code = runOne(file, picked.mode, keep);
      if (code === 0) console.log(`   PASS ${file} (exit 0)`);
      else {
        console.error(`   FAIL ${file} (exit ${code})`);
        failed++;
      }
    }
  }
  if (failed > 0) {
    console.error(`\n== KẾT QUẢ: ${failed} lượt fail ==`);
    return 1;
  }
  console.log(`\n== KẾT QUẢ: tất cả xanh ==`);
  return 0;
}

process.exitCode = main();
