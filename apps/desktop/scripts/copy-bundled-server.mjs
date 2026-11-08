#!/usr/bin/env node
/**
 * copy-bundled-server.mjs — Stage cây server (bridge + render + script
 * Python + node_modules thu gọn + LUT) để electron-builder bundle vào app
 * đóng gói (ROUND51-H8).
 *
 * Chạy tự động từ scripts/prepackage.mjs (trước electron-builder). Có thể
 * chạy tay để kiểm tra:
 *   node scripts/copy-bundled-server.mjs
 *   ls apps/desktop/build/bundled-server/server/bridge/src/index.js
 *
 * Đầu ra: apps/desktop/build/bundled-server/ (gitignored — KHÔNG commit,
 * chỉ sinh lúc đóng gói):
 *   bin/vcut-node                     launcher "node" của app đóng gói
 *                                     (chạy binary Electron dạng Node, giới
 *                                     hạn ELECTRON_RUN_AS_NODE=1 trong cây
 *                                     bridge — xem scripts/vcut-node)
 *   server/bridge/src/*.js            bridge (chỉ .js, không *.md)
 *   server/bridge/openapi.yaml        spec OpenAPI bridge đọc lúc chạy
 *   server/render/src/*.js            render worker (trừ file test_, measure_, demo_)
 *   server/render/src/*.py            helper Python của render (trừ file test_)
 *   server/caption/*.py, server/tts/tts.py, server/bgremove/bgremove.py,
 *   server/reframe/reframe.py, server/silence/*.py, server/scene/*.py,
 *   server/beats/*.py                 script AI (text only — KHÔNG venv,
 *                                      KHÔNG models, xem LIMITS H8 § venv)
 *   packages/video-spec/src/*.js      render require() theo đường tương đối
 *   packages/plugin-api/src/*.js      render require() qua REPO_ROOT
 *   assets/filters/*.cube             LUT cho render + GET /api/luts/:id
 *   node_modules/<closure>            CHỈ closure của bridge, ĐẶT DƯỚI
 *                                     server/node_modules (xem ghi chú
 *                                     QUAN TRỌNG dưới về extraResources)
 *   server/<svc>/.venv                Venv Python thu gọn (ROUND52-I5,
 *                                     opt-in: chỉ khi build/slim-venv/<svc>
 *                                     có SLIM_VENV.json — xem §8)
 *   MANIFEST.json                     danh sách package + tổng byte/file
 *
 * QUAN TRỌNG — vì sao closure KHÔNG nằm ở <out>/node_modules:
 * electron-builder loại bỏ thư mục `node_modules` ở GỐC của extraResources
 * (app-builder-lib/out/util/filter.js, createFilter: `relative ===
 * "node_modules"` → return false, cả thư mục bị prune). Kiểm chứng thật
 * 06/11: build đầu tiên ra gói thiếu toàn bộ node_modules (259 file thay
 * vì 1025) dù cây stage đủ. Đặt closure ở server/node_modules thì được
 * copy (chỉ prune đúng gốc) và Node vẫn resolve được: bridge ở
 * server/bridge/src require('express') đi lên gặp server/node_modules.
 * Render (server/render/src) cũng đi lên gặp cùng thư mục đó.
 *
 * Vì sao giữ đúng layout tương đối: bridge/render resolve mọi thứ theo
 * __dirname (vd: bridge → ../../render/src/render.js,
 * ../../caption/caption.py, ../../../assets/filters; render →
 * ../../../../packages/video-spec/src/index.js, ../../../assets).
 * AppRoot của cây bundle là build/bundled-server (tức resources/vcut-server
 * sau khi đóng gói) nên mọi đường tương đối đó giữ nguyên giá trị.
 *
 * KHÔNG copy: .venv/, models/ (GB), test/harness, *.md, __pycache__,
 * assets ngoài filters/ (audio/sounds/stickers/fonts/templates đã nằm
 * trong dist-web hoặc không dùng lúc render), node_modules ngoài closure
 * (root node_modules 456MB — chỉ lấy ~vài MB cần thiết, xem MANIFEST).
 */
import {
  accessSync,
  chmodSync,
  constants as fsConstants,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = resolve(desktopDir, '..', '..');
const outDir = join(desktopDir, 'build', 'bundled-server');
const rootNodeModules = join(repoRoot, 'node_modules');

let filesCopied = 0;
let bytesCopied = 0;

// Dọn cây stage cũ (đổi layout mà không dọn sẽ sót thư mục cũ — vd:
// node_modules/ ở gốc từ lần stage trước khi chuyển sang server/).
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

function copyFile(src, dst) {
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  filesCopied += 1;
  bytesCopied += statSync(src).size;
}

function copyDirFiltered(srcDir, dstDir, accept) {
  if (!existsSync(srcDir)) throw new Error(`[copy-bundled-server] thiếu thư mục nguồn: ${srcDir}`);
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__pycache__' || entry.name === '.venv' || entry.name === 'models') continue;
      copyDirFiltered(src, dst, accept);
    } else if (entry.isFile() && accept(entry.name, src)) {
      copyFile(src, dst);
    }
  }
}

const isJs = (name) => name.endsWith('.js');
const isPy = (name) => name.endsWith('.py');
const notTestJs = (name) =>
  isJs(name) && !name.startsWith('test_') && !name.startsWith('measure_') && !name.startsWith('demo_');
const notTestPy = (name) => isPy(name) && !name.startsWith('test_');

// --- 0. Launcher bin/vcut-node ("node" của app đóng gói) ----------------------
// Script sh chạy binary Electron ở chế độ Node, giới hạn
// ELECTRON_RUN_AS_NODE=1 CHỈ trong cây bridge (xem scripts/vcut-node —
// đặt biến này vào env main process sẽ làm nhiễm tiến trình con Chromium).
// Copy + chmod 0755 tường minh (copyFileSync không giữ mode nguồn).
copyFile(
  join(desktopDir, 'scripts', 'vcut-node'),
  join(outDir, 'bin', 'vcut-node'),
);
chmodSync(join(outDir, 'bin', 'vcut-node'), 0o755);

// --- 1. Bridge + render (JS) -------------------------------------------------
copyDirFiltered(join(repoRoot, 'server', 'bridge', 'src'), join(outDir, 'server', 'bridge', 'src'), isJs);
copyFile(
  join(repoRoot, 'server', 'bridge', 'openapi.yaml'),
  join(outDir, 'server', 'bridge', 'openapi.yaml'),
);
copyDirFiltered(join(repoRoot, 'server', 'render', 'src'), join(outDir, 'server', 'render', 'src'), (name) =>
  notTestJs(name) || notTestPy(name),
);

// --- 2. Script Python AI (text only — venv/models để đợt sau) -----------------
for (const [mod, accept] of [
  ['caption', isPy],
  ['tts', (n) => n === 'tts.py'],
  ['bgremove', (n) => n === 'bgremove.py'],
  ['reframe', (n) => n === 'reframe.py'],
  ['silence', notTestPy],
  ['scene', notTestPy],
  ['beats', notTestPy],
]) {
  copyDirFiltered(join(repoRoot, 'server', mod), join(outDir, 'server', mod), accept);
}

// --- 3. packages mà render require() theo đường tương đối ----------------------
copyDirFiltered(
  join(repoRoot, 'packages', 'video-spec', 'src'),
  join(outDir, 'packages', 'video-spec', 'src'),
  isJs,
);
copyDirFiltered(
  join(repoRoot, 'packages', 'plugin-api', 'src'),
  join(outDir, 'packages', 'plugin-api', 'src'),
  isJs,
);

// --- 4. LUT .cube (text) cho render + GET /api/luts/:id ------------------------
copyDirFiltered(
  join(repoRoot, 'assets', 'filters'),
  join(outDir, 'assets', 'filters'),
  (name) => name.endsWith('.cube'),
);

// --- 5. node_modules closure của bridge ---------------------------------------
// Seed: những gì server/bridge/src/*.js require() ngoài node builtin.
const SEED_DEPS = ['express', 'cors', 'js-yaml', 'multer'];
const BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'crypto', 'events', 'fs', 'http', 'https',
  'net', 'os', 'path', 'perf_hooks', 'stream', 'url', 'util', 'zlib',
]);

/** Đọc dependencies (runtime) của một package. */
function readDeps(pkgDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
    return { ...pkg.dependencies };
  } catch {
    return {};
  }
}

function pkgVersion(pkgDir) {
  try {
    return JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version ?? null;
  } catch {
    return null;
  }
}

/**
 * Copy một package + closure của nó. depSrc nằm lồng trong srcDir
 * (srcDir/node_modules/<dep>) thì giữ vị trí lồng tương ứng trong dstDir,
 * còn không thì hoist lên outDir/node_modules/<dep> (khớp npm workspaces).
 */
const copiedPkgs = new Map(); // key `${dstDir}` → { name, version, bytes, files }
function copyPackage(srcDir, dstDir) {
  if (copiedPkgs.has(dstDir)) return;
  const before = { files: filesCopied, bytes: bytesCopied };
  copiedPkgs.set(dstDir, { name: null, version: null, files: 0, bytes: 0 });
  const pkgJson = join(srcDir, 'package.json');
  let name = dstDir.split(sep).pop();
  try {
    const pkg = JSON.parse(readFileSync(pkgJson, 'utf8'));
    name = pkg.name ?? name;
  } catch { /* package không có package.json vẫn copy file */ }
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) copyDirFiltered(src, dst, () => true);
    else if (entry.isFile()) copyFile(src, dst);
  }
  const rec = copiedPkgs.get(dstDir);
  rec.name = name;
  rec.version = pkgVersion(srcDir);
  rec.files = filesCopied - before.files;
  rec.bytes = bytesCopied - before.bytes;
  for (const [dep, _range] of Object.entries(readDeps(srcDir))) {
    if (BUILTINS.has(dep)) continue;
    const nested = join(srcDir, 'node_modules', dep);
    const depSrc = existsSync(nested) ? nested : join(rootNodeModules, dep);
    if (!existsSync(depSrc)) {
      throw new Error(`[copy-bundled-server] không resolve được dep "${dep}" của ${name} (tìm ở ${depSrc})`);
    }
    const depDst = existsSync(nested)
      ? join(dstDir, 'node_modules', dep)
      // Hoist lên server/node_modules (KHÔNG phải <out>/node_modules —
      // electron-builder prune node_modules ở gốc extraResources, xem
      // ghi chú đầu file). Node resolve từ server/bridge/src đi lên
      // gặp server/node_modules.
      : join(outDir, 'server', 'node_modules', ...dep.split('/'));
    copyPackage(depSrc, depDst);
  }
}

for (const seed of SEED_DEPS) {
  const src = join(rootNodeModules, seed);
  if (!existsSync(src)) throw new Error(`[copy-bundled-server] thiếu seed dep: ${src}`);
  copyPackage(src, join(outDir, 'server', 'node_modules', seed));
}

// --- 6. Verify: entry tồn tại + require.resolve được deps từ bridge -----------
const bridgeEntry = join(outDir, 'server', 'bridge', 'src', 'index.js');
const renderEntry = join(outDir, 'server', 'render', 'src', 'render.js');
for (const [label, p] of [
  ['bridge entry', bridgeEntry],
  ['render entry', renderEntry],
  ['launcher vcut-node', join(outDir, 'bin', 'vcut-node')],
  ['video-spec', join(outDir, 'packages', 'video-spec', 'src', 'index.js')],
  ['plugin-api', join(outDir, 'packages', 'plugin-api', 'src', 'index.js')],
]) {
  if (!existsSync(p)) throw new Error(`[copy-bundled-server] VERIFY FAIL: thiếu ${label}: ${p}`);
}
try {
  accessSync(join(outDir, 'bin', 'vcut-node'), fsConstants.X_OK);
} catch {
  throw new Error('[copy-bundled-server] VERIFY FAIL: bin/vcut-node không có quyền thực thi');
}

// --- 7. Venv Python thu gọn (ROUND52-I5, opt-in) -----------------------------
// prepackage.mjs chạy build-slim-venv.mjs trước (khi VCUT_BUNDLE_SLIM_VENV
// được set) rồi copy script này nhặt build/slim-venv/<svc> vào cây bundle
// tại server/<svc>/.venv — đúng đường mà pythonServices.js/buildBridgeEnv
// đã tìm (caption .venv, tts .venv2 rồi .venv, reframe .venv). KHÔNG bundle
// model (2,8G) — model tải riêng lần đầu về userData/models.
// Copy bằng cpSync dereference:false để GIỮ symlink (bin/python là symlink
// tới python hệ thống; copyFileSync sẽ copy cả binary đích ~6MB và làm sai
// sys.prefix). Chỉ stage venv có SLIM_VENV.json (đã slim + verify xong).
const slimVenvs = [];
// Copy cây GIỮ NGUYÊN đích symlink (verbatim) — KHÔNG dùng fs.cpSync:
// cpSync chuẩn hoá symlink tương đối thành đường tuyệt đối của máy build
// (vd: lib64 -> /home/hatch/.../build/slim-venv/tts/lib), dở dang trên máy
// user vì thư mục build không tồn tại. Copy verbatim giữ lib64 -> lib và
// bin/python -> python3 (tương đối, dời chỗ vẫn đúng).
function copyTreeVerbatim(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dst, entry.name);
    const st = lstatSync(s);
    if (st.isSymbolicLink()) {
      symlinkSync(readlinkSync(s), d);
    } else if (st.isDirectory()) {
      copyTreeVerbatim(s, d);
    } else {
      copyFileSync(s, d);
      try { chmodSync(d, st.mode); } catch { /* bỏ qua */ }
    }
  }
}
for (const svc of ['caption', 'tts', 'reframe', 'bgremove']) {
  const src = join(desktopDir, 'build', 'slim-venv', svc);
  const marker = join(src, 'SLIM_VENV.json');
  if (!existsSync(marker)) continue;
  const dst = join(outDir, 'server', svc, '.venv');
  rmSync(dst, { recursive: true, force: true });
  copyTreeVerbatim(src, dst);
  // cpSync không đi qua copyFile() nên cộng tay vào totals của manifest.
  // Dùng lstat (không theo symlink) để không tính nhầm đích của symlink
  // (vd: bin/python -> /usr/bin/python3.12 không phải 6MB trong gói).
  const walkCount = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walkCount(p);
      else {
        filesCopied += 1;
        try { bytesCopied += lstatSync(p).size; } catch { /* symlink gãy — bỏ qua */ }
      }
    }
  };
  walkCount(dst);
  const slimBytes = JSON.parse(readFileSync(marker, 'utf8')).afterBytes;
  slimVenvs.push({ service: svc, bytes: slimBytes });
  console.log(`[copy-bundled-server] venv thu gọn ${svc}: ${(slimBytes / 1048576).toFixed(0)} MiB → server/${svc}/.venv`);
}

// --- 8. Manifest ----------------------------------------------------------------
const manifest = {
  generatedAt: new Date().toISOString(),
  note: 'Cây server bundle cho app đóng gói (ROUND51-H8). Sinh lúc đóng gói, KHÔNG commit.',
  packages: [...copiedPkgs.values()]
    .filter((p) => p.name)
    .sort((a, b) => a.name.localeCompare(b.name)),
  // ROUND52-I5: venv Python thu gọn đã stage (opt-in qua VCUT_BUNDLE_SLIM_VENV).
  slimVenvs,
  totals: { files: filesCopied, bytes: bytesCopied },
};
writeFileSync(join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(
  `[copy-bundled-server] OK: ${filesCopied} file, ${(bytesCopied / 1024 / 1024).toFixed(1)} MiB ` +
    `→ ${outDir} (${manifest.packages.length} npm package trong closure)`,
);
