#!/usr/bin/env node
/**
 * build-slim-venv.mjs — Tạo venv Python thu gọn cho app đóng gói (ROUND52-I5).
 *
 * Vấn đề (kế hoạch H8 §5A): venv AI hiện tại ~1,6G (caption 505M + tts 898M
 * + reframe 236M) vì chứa pip/setuptools, __pycache__, và nhiều package
 * không dùng tới lúc chạy (vd: venv TTS chứa cả gradio 82M + pandas 71M +
 * scipy 109M + llvmlite 173M — xem LIMITS I5 §2 về bằng chứng từng package).
 * Script này tạo bản thu gọn để đóng gói (opt-in, xem prepackage.mjs):
 *
 *   node scripts/build-slim-venv.mjs --service tts [--from DIR] [--fresh]
 *       [--out DIR] [--drop pkg,...] [--no-drop]
 *
 * - --from DIR: copy venv có sẵn rồi slim (mặc định: venv của service đó
 *   trong repo — server/caption/.venv, server/tts/.venv2, ...).
 * - --fresh: tạo venv mới từ requirements.txt đã pin (K4) rồi slim.
 *   Cần mạng (PyPI). Dùng khi venv nguồn chưa có (vd: bgremove).
 *   Mặc định dùng `python3` hệ thống; --python BIN để chỉ python khác
 *   (ROUND53-J8: bgremove cần Python <3.13 cho rembg 2.0.60 — trên VM này
 *   dùng Python 3.10 của uv; `python3` hệ thống là 3.12 vẫn chạy được
 *   rembg 2.0.60 nhưng --fresh cũ từng fail với rembg 2.0.38 <3.11).
 * - --out DIR: đích (mặc định apps/desktop/build/slim-venv/<service>).
 * - --drop: thêm package vào danh sách loại (mặc định đã có danh sách
 *   theo service — xem DROP dưới; --no-drop chỉ strip rác chung).
 *
 * Bước slim (luôn làm):
 *  1. Xoá __pycache__ / *.pyc / *.pyo, thư mục tests/test trong site-packages.
 *  2. Xoá pip/setuptools/wheel/ensurepip (+ bin/pip*, bin/wheel): venv chạy
 *     job không cần pip lúc chạy; xóa xong vẫn chạy được python.
 *  3. Loại package trong DROP (chỉ package đã chứng minh không được import
 *     trong đường chạy thật của service — xem LIMITS I5 §2; mỗi package có
 *     ghi lý do trong DROP).
 *  4. Viết lại shebang trong bin/* + VIRTUAL_ENV trong bin/activate* sang
 *     đường dẫn đích (venv chứa đường dẫn tuyệt đối lúc tạo — H8 §5A).
 *  5. Đo byte trước/sau thật (đếm file, không ước tính), ghi SLIM_VENV.json.
 *  6. Verify: <out>/bin/python -c "import <deep module>" + sys.prefix
 *     phải trỏ đúng <out> (chứng minh venv dời chỗ vẫn chạy).
 *
 * KHÔNG đưa venv vào repo hay batch push — chỉ stage ở build/ (gitignored)
 * để copy-bundled-server.mjs nhặt lúc đóng gói khi opt-in.
 */
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = resolve(desktopDir, '..', '..');

const SERVICES = {
  caption: {
    sourceVenv: join(repoRoot, 'server', 'caption', '.venv'),
    requirements: join(repoRoot, 'server', 'caption', 'requirements.txt'),
    deepModule: 'faster_whisper',
    verifyImports: ['faster_whisper', 'ctranslate2', 'onnxruntime', 'tokenizers', 'numpy'],
  },
  tts: {
    sourceVenv: join(repoRoot, 'server', 'tts', '.venv2'),
    sourceVenvFallback: join(repoRoot, 'server', 'tts', '.venv'),
    requirements: join(repoRoot, 'server', 'tts', 'requirements.txt'),
    deepModule: 'onnxruntime',
    verifyImports: ['onnxruntime', 'vieneu', 'numpy', 'soundfile', 'soxr', 'huggingface_hub'],
  },
  reframe: {
    sourceVenv: join(repoRoot, 'server', 'reframe', '.venv'),
    requirements: join(repoRoot, 'server', 'reframe', 'requirements.txt'),
    deepModule: 'cv2',
    verifyImports: ['cv2', 'numpy'],
  },
  bgremove: {
    sourceVenv: join(repoRoot, 'server', 'bgremove', '.venv'),
    requirements: join(repoRoot, 'server', 'bgremove', 'requirements.txt'),
    deepModule: 'rembg',
    verifyImports: ['rembg', 'cv2', 'numpy', 'PIL'],
  },
};

/**
 * Package loại theo service — CHỈ những package đã chứng minh không được
 * import trong đường chạy thật (grep toàn bộ vieneu/vieneu_utils/neucodec/
 * sea_g2p/soundfile/soxr + chạy synth/caption thật trên venv đã slim, xem
 * LIMITS I5 §2). KHÔNG loại package chỉ vì "có vẻ không dùng".
 */
const DROP = {
  // gradio/fastapi/starlette/uvicorn: chỉ phục vụ vieneu.serve (demo web),
  // tts.py không gọi. pandas/sklearn/scipy/numba/llvmlite/librosa/joblib/
  // pooch: cây librosa (optional trong vieneu.base._load_ref_mono — có
  // fallback soundfile+soxr, đã chứng minh bằng synth clone thật).
  // pygments: highlight của gradio. narwhals KHÔNG loại (chưa chứng minh).
  tts: [
    'gradio', 'gradio_client', 'hf_gradio', 'fastapi', 'starlette', 'uvicorn',
    'pandas', 'sklearn', 'scipy', 'numba', 'llvmlite', 'pygments',
    'librosa', 'joblib', 'pooch',
  ],
  // piper: chỉ dùng để test tạo giọng mẫu, caption.py/faster_whisper không
  // import (requirements.txt đã ghi chú). Giữ hf_xet (huggingface_hub dùng
  // để tải model) và av (faster_whisper decode audio).
  caption: ['piper'],
  reframe: [],
  bgremove: [],
};

// Rác chung luôn xoá (mọi service).
const JUNK_TOP = new Set([
  'pip', 'setuptools', 'wheel', 'ensurepip', '_distutils_hack', 'pkg_resources',
]);

function parseArgs(argv) {
  const o = { service: null, from: null, fresh: false, out: null, drop: [], noDrop: false, python: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--service') o.service = argv[++i];
    else if (a === '--from') o.from = argv[++i];
    else if (a === '--fresh') o.fresh = true;
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--python') o.python = argv[++i];
    else if (a === '--drop') o.drop = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--no-drop') o.noDrop = true;
    else if (a === '--help' || a === '-h') {
      console.log('Dùng: node scripts/build-slim-venv.mjs --service <caption|tts|reframe|bgremove> [--from DIR] [--fresh] [--python BIN] [--out DIR] [--drop pkg,...] [--no-drop]');
      process.exit(0);
    } else throw new Error(`Tham số lạ: ${a}`);
  }
  if (!o.service || !SERVICES[o.service]) {
    throw new Error('--service phải là một trong: caption, tts, reframe, bgremove');
  }
  return o;
}

/** Tổng byte "apparent size" của cây (lstat — symlink tính bằng link, khớp du -sb). */
function treeBytes(dir) {
  let total = 0;
  let files = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      const st = lstatSync(p);
      if (st.isDirectory()) walk(p);
      else {
        total += st.size;
        files += 1;
      }
    }
  };
  walk(dir);
  return { bytes: total, files };
}

function sitePackagesDir(venvDir) {
  const lib = join(venvDir, 'lib');
  for (const py of readdirSync(lib)) {
    const sp = join(lib, py, 'site-packages');
    if (existsSync(sp)) return sp;
  }
  throw new Error(`Không tìm thấy site-packages trong ${venvDir}`);
}

/** Copy cây giữ symlink (fs.cpSync mặc định dereference:false). */
function copyTree(src, dst) {
  mkdirSync(dirname(dst), { recursive: true });
  const cp = (s, d) => {
    const st = lstatSync(s);
    if (st.isSymbolicLink()) {
      mkdirSync(dirname(d), { recursive: true });
      symlinkSync(readlinkSync(s), d);
    } else if (st.isDirectory()) {
      mkdirSync(d, { recursive: true });
      for (const e of readdirSync(s)) cp(join(s, e), join(d, e));
    } else {
      mkdirSync(dirname(d), { recursive: true });
      copyFileSync(s, d);
      try { chmodSync(d, st.mode); } catch { /* bỏ qua */ }
    }
  };
  cp(src, dst);
}

/** Xoá rác chung trong site-packages; trả về byte đã xoá. */
function stripJunk(sp, removed) {
  let freed = 0;
  const rmBytes = (p) => {
    if (!existsSync(p)) return;
    const { bytes } = treeBytes(p);
    rmSync(p, { recursive: true, force: true });
    freed += bytes;
    removed.push({ what: p.split(sep).pop(), bytes });
  };
  for (const name of readdirSync(sp)) {
    const p = join(sp, name);
    const st = lstatSync(p);
    if (name === '__pycache__' || name.endsWith('.dist-info') && JUNK_TOP.has(name.split('-')[0])) {
      rmBytes(p);
      continue;
    }
    if (st.isDirectory()) {
      if (JUNK_TOP.has(name) || name === 'tests' || name === 'test') {
        rmBytes(p);
        continue;
      }
      // Đệ quy: __pycache__ / *.pyc / thư mục tests bên trong package.
      for (const sub of readdirSync(p)) {
        const q = join(p, sub);
        const s2 = lstatSync(q);
        if (sub === '__pycache__' || sub === 'tests' || sub === 'test') {
          rmBytes(q);
        } else if (s2.isFile() && (sub.endsWith('.pyc') || sub.endsWith('.pyo'))) {
          freed += s2.size;
          removed.push({ what: `${name}/${sub}`, bytes: s2.size });
          rmSync(q, { force: true });
        }
      }
    } else if (name.endsWith('.pyc') || name.endsWith('.pyo')) {
      freed += st.size;
      removed.push({ what: name, bytes: st.size });
      rmSync(p, { force: true });
    }
  }
  // bin/pip*, bin/wheel, bin/easy_install* (venv chạy job không cần).
  const bin = join(dirname(sp), '..', '..', 'bin');
  if (existsSync(bin)) {
    for (const name of readdirSync(bin)) {
      if (/^(pip|wheel|easy_install)/.test(name)) {
        const p = join(bin, name);
        const st = lstatSync(p);
        freed += st.size;
        removed.push({ what: `bin/${name}`, bytes: st.size });
        rmSync(p, { force: true });
      }
    }
  }
  return freed;
}

/** Loại package theo DROP; trả về byte đã xoá. */
function dropPackages(sp, names, removed) {
  let freed = 0;
  for (const pkg of names) {
    for (const name of [...readdirSync(sp)]) {
      const match =
        name === pkg ||
        name === `${pkg}.libs` ||
        (name.startsWith(`${pkg}-`) && name.endsWith('.dist-info'));
      if (!match) continue;
      const p = join(sp, name);
      const { bytes } = treeBytes(p);
      rmSync(p, { recursive: true, force: true });
      freed += bytes;
      removed.push({ what: name, bytes });
    }
  }
  return freed;
}

/** Viết lại shebang/VIRTUAL_ENV từ đường cũ sang đường mới trong bin/. */
function rewritePaths(venvDir, oldVenv) {
  const bin = join(venvDir, 'bin');
  if (!existsSync(bin)) return 0;
  let fixed = 0;
  for (const name of readdirSync(bin)) {
    const p = join(bin, name);
    const st = lstatSync(p);
    if (!st.isFile()) continue;
    let text;
    try {
      text = readFileSync(p, 'utf8');
    } catch {
      continue;
    }
    let next = text;
    if (next.startsWith(`#!${oldVenv}/bin/python`)) {
      next = next.replace(`#!${oldVenv}/bin/python`, `#!${venvDir}/bin/python`);
    }
    if (name.startsWith('activate')) {
      next = next.split(oldVenv).join(venvDir);
    }
    if (next !== text) {
      writeFileSync(p, next);
      fixed += 1;
    }
  }
  // pyvenv.cfg: 'home' trỏ python hệ thống — giữ nguyên (đúng).
  return fixed;
}

function runVerify(pythonBin, imports, venvDir) {
  const code = [
    'import sys',
    `assert sys.prefix == ${JSON.stringify(venvDir)}, f"sys.prefix={sys.prefix} != {venvDir}"`,
    ...imports.map((m) => `import ${m}`),
    'print("VERIFY OK:", sys.prefix)',
  ].join('; ');
  const r = spawnSync(pythonBin, ['-c', code], { encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0) {
    throw new Error(
      `Verify thất bại với ${pythonBin} (import ${imports.join(', ')}):\n${r.stdout || ''}${r.stderr || ''}`,
    );
  }
  return (r.stdout || '').trim();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const svc = SERVICES[args.service];
  const out = resolve(args.out || join(desktopDir, 'build', 'slim-venv', args.service));
  const pythonBin = join(out, 'bin', 'python');

  if (existsSync(out)) {
    console.log(`[build-slim-venv] dọn ${out} cũ...`);
    rmSync(out, { recursive: true, force: true });
  }

  let sourceDesc;
  let srcUsed = out; // venv nguồn thực tế (để viết lại shebang)
  if (args.fresh) {
    if (!existsSync(svc.requirements)) throw new Error(`Thiếu ${svc.requirements}`);
    const basePython = args.python || 'python3';
    console.log(`[build-slim-venv] tạo venv mới từ ${svc.requirements} (python: ${basePython}) ...`);
    let r = spawnSync(basePython, ['-m', 'venv', out], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('python3 -m venv thất bại');
    r = spawnSync(pythonBin, ['-m', 'pip', 'install', '--no-cache-dir', '-r', svc.requirements], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('pip install requirements thất bại');
    sourceDesc = `fresh từ ${svc.requirements}`;
  } else {
    const src = args.from
      ? resolve(args.from)
      : existsSync(svc.sourceVenv)
        ? svc.sourceVenv
        : svc.sourceVenvFallback && existsSync(svc.sourceVenvFallback)
          ? svc.sourceVenvFallback
          : null;
    if (!src) {
      throw new Error(
        `Không có venv nguồn cho ${args.service} (tìm ở ${svc.sourceVenv}` +
        `${svc.sourceVenvFallback ? ` hoặc ${svc.sourceVenvFallback}` : ''}). ` +
        `Tạo mới bằng: node scripts/build-slim-venv.mjs --service ${args.service} --fresh`,
      );
    }
    console.log(`[build-slim-venv] copy ${src} → ${out} ...`);
    copyTree(src, out);
    srcUsed = src;
    sourceDesc = `copy từ ${src}`;
  }

  const before = treeBytes(out);
  console.log(`[build-slim-venv] trước slim: ${before.bytes} byte (${before.files} file)`);

  const removed = [];
  const sp = sitePackagesDir(out);
  const junkFreed = stripJunk(sp, removed);
  const dropList = args.noDrop ? [] : [...(DROP[args.service] || []), ...args.drop];
  const dropFreed = dropList.length ? dropPackages(sp, dropList, removed) : 0;
  const fixed = rewritePaths(out, srcUsed);

  const after = treeBytes(out);
  console.log(`[build-slim-venv] sau slim: ${after.bytes} byte (${after.files} file)`);
  console.log(
    `[build-slim-venv] đã xoá: rác chung ${junkFreed} byte + DROP ${dropFreed} byte ` +
    `= ${before.bytes - after.bytes} byte (${(((before.bytes - after.bytes) / before.bytes) * 100).toFixed(1)}%)`,
  );
  console.log(`[build-slim-venv] shebang/activate viết lại: ${fixed} file`);

  // Verify: venv dời chỗ vẫn import được module nặng + sys.prefix đúng.
  const verifyOut = runVerify(pythonBin, svc.verifyImports, out);
  console.log(`[build-slim-venv] ${verifyOut}`);

  const report = {
    service: args.service,
    source: sourceDesc,
    out,
    generatedAt: new Date().toISOString(),
    beforeBytes: before.bytes,
    beforeFiles: before.files,
    afterBytes: after.bytes,
    afterFiles: after.files,
    savedBytes: before.bytes - after.bytes,
    savedPercent: Number((((before.bytes - after.bytes) / before.bytes) * 100).toFixed(1)),
    dropped: dropList,
    removedTop: removed
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 25),
    verify: { imports: svc.verifyImports, output: verifyOut },
  };
  writeFileSync(join(out, 'SLIM_VENV.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`[build-slim-venv] OK: ${out} — ${after.bytes} byte (giảm ${report.savedPercent}%), report: SLIM_VENV.json`);
  return report;
}

try {
  main();
} catch (e) {
  console.error(`[build-slim-venv] FAIL: ${e.message}`);
  process.exit(1);
}
