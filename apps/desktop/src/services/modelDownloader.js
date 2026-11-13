'use strict';
/**
 * modelDownloader.js — Tải model AI lần đầu cho app đóng gói (ROUND52-I5).
 *
 * Vấn đề (kế hoạch H8 §5B): model AI quá lớn để bundle vào AppImage
 * (TTS 2,2G + caption 486M + codec 91M ≈ 2,8G; kèm venv ~1,6G thì gói lên
 * ~5G). Thay vào đó app lần đầu chạy AI sẽ tải model từ nguồn gốc công khai
 * về thư mục user data (app.getPath('userData')/models), verify SHA256 rồi
 * mới dùng. Model KHÔNG BAO GIỜ tải lén: chỉ chạy khi user bấm tải (hoặc
 * job AI đầu tiên hỏi), có progress + huỷ, và Python AI chỉ bật khi model
 * đã có (xem probe trong pythonServices.js).
 *
 * Nguồn + license (manifest model-manifest.json — SHA256 hash từ file local
 * thật, sinh bằng scripts/gen-model-manifest.mjs):
 * - Systran/faster-whisper-small: MIT
 * - pnnbao-ump/VieNeu-TTS-v3-Turbo: Apache-2.0
 * - OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX: Apache-2.0
 * - BiRefNet (rembg release): MIT — CHƯA có SHA256 nên entry verified=false
 *   và downloader TỪ CHỐI tải (không tải file không verify được).
 *
 * Hành vi tải (mọi khẳng định đều có test trong modelDownloader.test.cjs):
 * - Từng file tải qua HTTPS (theo redirect tối đa 5), ghi vào `<file>.part`,
 *   resume bằng header Range khi .part còn dở, xong thì verify SHA256 rồi
 *   mới đổi tên atomically thành file đích.
 * - File đích đã có đủ size + SHA256 khớp → BỎ QUA, không tải lại.
 * - File đích có nhưng SHA256 lệch → tải lại từ đầu (file cũ bị thay).
 * - Huỷ qua AbortSignal: request bị huỷ, .part giữ lại để lần sau resume.
 * - Sau khi đủ file + verify: ghi marker `.vcut-complete` (nếu manifest
 *   khai completeMarker) — cùng quy ước tts.py dùng để khỏi tự tải lại
 *   bằng snapshot_download.
 * - ROUND53-J8: kiểm tra dung lượng trống TRƯỚC khi tải (ensureFreeDiskSpace)
 *   — fail rõ ràng (cần bao nhiêu / còn bao nhiêu) thay vì chết giữa chừng
 *   vì ENOSPC. Ước tính theo size (không hash) nên file đủ size nhưng sai
 *   nội dung vẫn có thể khiến ước tính thấp hơn thực tế — xem LIMITS J8.
 * - Chỉ dùng Node builtin (http/https/crypto/fs) — không thêm dependency.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port JS của
// apps/web/scripts/eperm-retry.mjs; xem services/epermRetry.js).
const { writeFileEpermRetry } = require('./epermRetry');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');

const MANIFEST_NAME = 'model-manifest.json';
/** Tên biến env trỏ thư mục model thống nhất (xem pythonServices.js + tts.py). */
const MODELS_DIR_ENV = 'VCUT_MODELS_DIR';
const MAX_REDIRECTS = 5;
const PROGRESS_THROTTLE_MS = 200;

let manifestCache = null;

/** Đọc manifest (tìm ở dist/services/ trước, rồi src/services/). */
function loadManifest() {
  if (manifestCache) return manifestCache;
  const candidates = [
    path.join(__dirname, MANIFEST_NAME),
    path.join(__dirname, '..', 'src', 'services', MANIFEST_NAME),
  ];
  for (const p of candidates) {
    try {
      manifestCache = JSON.parse(fs.readFileSync(p, 'utf8'));
      return manifestCache;
    } catch { /* thử đường tiếp theo */ }
  }
  throw new Error(
    `Không tìm thấy ${MANIFEST_NAME} (đã thử ${candidates.join(', ')}) — ` +
    'chạy `node scripts/gen-model-manifest.mjs` để sinh manifest.',
  );
}

/** Thư mục model thống nhất trong user data của app đóng gói. */
function getModelsDir(userDataDir) {
  return path.join(userDataDir, 'models');
}

/**
 * Model có sẵn trong repo (dev) không? Kiểm tra marker/file bắt buộc của
 * TTS + caption ngay dưới appRoot — dùng để quyết định layout (xem
 * resolveModelsRoot). Packaged app (appRoot = resources/vcut-server) KHÔNG
 * có models/ nên luôn rơi về layout 'unified'.
 */
function repoHasModels(appRoot) {
  const probes = [
    path.join(appRoot, 'server', 'tts', 'models', 'VieNeu-TTS-v3-Turbo', '.vcut-complete'),
    path.join(appRoot, 'server', 'caption', 'models', 'fw-small', 'model.bin'),
  ];
  return probes.some((p) => fs.existsSync(p));
}

/**
 * Quyết định thư mục model mà app dùng:
 * - env VCUT_MODELS_DIR (user chỉ định rõ) → 'unified', root đó.
 * - Repo đã có model (dev, appRoot = repo root) → 'repo': mỗi model tải về
 *   đúng thư mục mặc định của nó (server/tts/models, server/caption/models)
 *   — khớp hành vi fetch_model.py / tts.py hiện tại.
 * - Còn lại (app đóng gói) → 'unified', root = userData/models.
 * @returns {{ root: string, layout: 'unified' | 'repo' }}
 */
function resolveModelsRoot({ appRoot, userDataDir, env = process.env }) {
  if (env[MODELS_DIR_ENV]) {
    return { root: path.resolve(env[MODELS_DIR_ENV]), layout: 'unified' };
  }
  if (appRoot && repoHasModels(appRoot)) {
    return { root: path.resolve(appRoot), layout: 'repo' };
  }
  return { root: getModelsDir(userDataDir), layout: 'unified' };
}

/** Thư mục đích của một model theo layout đã resolve. */
function modelTargetDir(model, rootInfo) {
  if (rootInfo.layout === 'repo') {
    // Model không có thư mục trong repo (vd: bgremove dùng ~/.u2net ở dev)
    // thì dùng thư mục mặc định của nó.
    if (!model.repoDir) {
      if (model.devDir) {
        const expanded = model.devDir.startsWith('~/')
          ? path.join(os.homedir(), model.devDir.slice(2))
          : model.devDir;
        return expanded;
      }
      throw new Error(`Model ${model.id} chưa có repoDir — không tải được ở layout repo.`);
    }
    return path.join(rootInfo.root, model.repoDir, model.subdir);
  }
  return path.join(rootInfo.root, model.subdir);
}

/** Lấy model theo id (string) hoặc dùng trực tiếp object đã có. */
function resolveModel(modelOrId) {
  if (typeof modelOrId === 'object' && modelOrId !== null) return modelOrId;
  const manifest = loadManifest();
  const found = manifest.models.find((m) => m.id === modelOrId);
  if (!found) throw new Error(`Không có model "${modelOrId}" trong manifest.`);
  return found;
}

/** SHA256 của một file (đọc theo chunk, không giữ cả file trong RAM). */
function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    const stream = fs.createReadStream(file);
    stream.on('data', (d) => h.update(d));
    stream.on('error', reject);
    stream.on('end', () => resolve(h.digest('hex')));
  });
}

/**
 * Kiểm tra nhanh 1 file: tồn tại + đúng size. verify=true thì hash SHA256
 * (đắt với file GB — chỉ dùng trong đường tải, không dùng để poll trạng thái).
 */
async function checkModelFile(fileEntry, dir, { verify = false } = {}) {
  const abs = path.join(dir, fileEntry.path);
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return { path: fileEntry.path, state: 'missing', size: 0, expectedSize: fileEntry.size };
  }
  if (fileEntry.size != null && stat.size !== fileEntry.size) {
    return { path: fileEntry.path, state: 'size-mismatch', size: stat.size, expectedSize: fileEntry.size };
  }
  if (verify && fileEntry.sha256) {
    const actual = await sha256File(abs);
    if (actual !== fileEntry.sha256) {
      return { path: fileEntry.path, state: 'checksum-mismatch', size: stat.size, expectedSize: fileEntry.size };
    }
  }
  return { path: fileEntry.path, state: 'ok', size: stat.size, expectedSize: fileEntry.size };
}

/**
 * Trạng thái 1 model (kiểm tra nhanh: tồn tại + size, KHÔNG hash — để UI
 * poll được mà không hash 2,2G mỗi lần).
 * @returns {{ id, label, status: 'ready'|'partial'|'missing', targetDir, totalBytes, presentBytes, files }}
 */
async function checkModel(rootInfo, modelOrId, opts = {}) {
  const model = resolveModel(modelOrId);
  const targetDir = modelTargetDir(model, rootInfo);
  const files = [];
  for (const f of model.files) {
    // Entry chưa verify (sha256 null) thì không khẳng định được gì.
    if (!f.sha256 || f.size == null) {
      files.push({ path: f.path, state: 'unverified', size: 0, expectedSize: f.size });
    } else {
      files.push(await checkModelFile(f, targetDir, opts));
    }
  }
  const presentBytes = files.reduce((s, f) => s + (f.state === 'ok' ? f.size : 0), 0);
  const totalBytes = model.totalBytes || 0;
  let status = 'ready';
  if (files.some((f) => f.state === 'unverified')) status = 'unverified';
  else if (files.every((f) => f.state === 'missing')) status = 'missing';
  else if (files.some((f) => f.state !== 'ok')) status = 'partial';
  return {
    id: model.id,
    label: model.label,
    service: model.service,
    license: model.license,
    sizeLabel: model.sizeLabel,
    verified: model.verified !== false,
    status,
    targetDir,
    totalBytes,
    presentBytes,
    files,
  };
}

/** Trạng thái tất cả model trong manifest. */
async function checkAllModels(rootInfo, opts = {}) {
  const manifest = loadManifest();
  const out = {};
  for (const m of manifest.models) out[m.id] = await checkModel(rootInfo, m, opts);
  return out;
}

/**
 * Dung lượng trống (byte) của filesystem chứa dir — dùng fs.statfsSync
 * (Node ≥19, Electron 30+). Nếu dir chưa tồn tại (vd: thư mục đích chưa
 * mkdir) thì leo lên thư mục cha gần nhất còn tồn tại để đo — filesystem
 * là như nhau. Trả null khi không đo được (filesystem lạ / lỗi) —
 * caller fail-open có cảnh báo, không chặn tải mù.
 */
function freeDiskBytes(dir) {
  let cur = dir;
  for (let i = 0; i < 32; i += 1) {
    try {
      const st = fs.statfsSync(cur);
      return st.bavail * st.bsize;
    } catch (e) {
      if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') {
        console.warn(`[modelDownloader] không đo được dung lượng trống tại ${dir}: ${e.message}`);
        return null;
      }
      const parent = path.dirname(cur);
      if (parent === cur) return null;
      cur = parent;
    }
  }
  return null;
}

/** Định dạng byte cho thông báo lỗi (MB/GB, 1–2 chữ số thập phân). */
function formatBytes(n) {
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GB`;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} byte`;
}

/**
 * Số byte còn phải tải cho 1 model: đã trừ file đủ size + phần `.part`
 * đã có (resume). Dùng check size-only (không hash) để rẻ — file đủ size
 * nhưng sai nội dung sẽ bị downloadFile tải lại sau khi verify fail, nên
 * con số này là cận dưới trong trường hợp đó (xem LIMITS J8).
 */
async function estimateRemainingBytes(model, targetDir) {
  let needed = 0;
  for (const f of model.files) {
    if (f.size == null) continue; // chưa verify → downloadModel từ chối trước
    const st = await checkModelFile(f, targetDir);
    if (st.state === 'ok') continue;
    let partSize = 0;
    try {
      partSize = fs.statSync(path.join(targetDir, `${f.path}.part`)).size;
    } catch { /* không có .part */ }
    needed += Math.max(0, f.size - partSize);
  }
  return needed;
}

/**
 * Kiểm tra dung lượng trống TRƯỚC khi tải (ROUND53-J8).
 * Ném lỗi nêu rõ cần bao nhiêu / còn bao nhiêu / tại đâu khi thiếu đĩa;
 * không tạo file nào khi ném (fail trước khi tải). Khi không đo được
 * dung lượng trống (freeDiskBytes → null) thì cho qua có cảnh báo.
 * @returns {{ neededBytes: number, freeBytes: number | null }}
 */
async function ensureFreeDiskSpace(model, targetDir) {
  const needed = await estimateRemainingBytes(model, targetDir);
  const free = freeDiskBytes(targetDir);
  if (needed > 0 && free != null && free < needed) {
    throw new Error(
      `Không đủ dung lượng trống để tải model "${model.id}": cần thêm ` +
      `${formatBytes(needed)} (còn trống ${formatBytes(free)} tại ${targetDir}). ` +
      'Giải phóng dung lượng rồi thử lại — file .part dở vẫn giữ để resume sau.',
    );
  }
  return { neededBytes: needed, freeBytes: free };
}

/**
 * Tải 1 file: resume qua .part + Range, verify SHA256, rename atomically.
 * @param {{ path, url, sha256, size }} fileEntry
 * @param {string} dir - thư mục đích
 * @param {{ onProgress?: (p: {downloaded:number,total:number}) => void, signal?: AbortSignal }} opts
 * @returns {{ skipped: boolean, bytes: number }}
 */
async function downloadFile(fileEntry, dir, opts = {}) {
  if (!fileEntry.sha256 || fileEntry.size == null) {
    throw new Error(
      `Không tải "${fileEntry.path}": chưa có SHA256/size để verify ` +
      '(model chưa xác minh — xem manifest).',
    );
  }
  const dest = path.join(dir, fileEntry.path);
  const part = `${dest}.part`;
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  // Đã có đủ + checksum khớp → bỏ qua, không tải lại.
  const existing = await checkModelFile(fileEntry, dir, { verify: true });
  if (existing.state === 'ok') return { skipped: true, bytes: 0 };
  if (existing.state === 'checksum-mismatch' || existing.state === 'size-mismatch') {
    try { fs.unlinkSync(dest); } catch { /* đã mất rồi */ }
  }

  let downloaded = 0;
  try {
    downloaded = fs.statSync(part).size;
  } catch { downloaded = 0; }
  if (downloaded >= fileEntry.size) {
    // .part đủ size nhưng chưa verify (lần trước chết đúng lúc verify) —
    // verify rồi rename, khỏi tải lại.
    const actual = await sha256File(part);
    if (actual !== fileEntry.sha256) {
      try { fs.unlinkSync(part); } catch { /* bỏ qua */ }
      downloaded = 0;
    } else {
      fs.renameSync(part, dest);
      return { skipped: false, bytes: 0 };
    }
  }

  const total = fileEntry.size;
  let lastEmit = 0;
  // base + written = số byte đã có của file này. Nếu server không hỗ trợ
  // Range (trả 200 thay vì 206), downloadToFile gọi onRestarted để reset.
  let base = downloaded;
  let written = 0;
  let restarted = false;
  const emit = (done) => {
    const now = Date.now();
    if (opts.onProgress && (done || now - lastEmit >= PROGRESS_THROTTLE_MS)) {
      lastEmit = now;
      opts.onProgress({ downloaded: base + written, total });
    }
  };

  await downloadToFile(fileEntry.url, part, downloaded, {
    signal: opts.signal,
    onChunk: (n) => { written += n; emit(false); },
    onRestarted: () => { base = 0; written = 0; restarted = true; },
  });
  emit(true);
  const actual = await sha256File(part);
  if (actual !== fileEntry.sha256) {
    try { fs.unlinkSync(part); } catch { /* bỏ qua */ }
    throw new Error(
      `Checksum lệch cho "${fileEntry.path}": tải được file không khớp SHA256 ` +
      `trong manifest (có thể model gốc đã đổi hoặc mạng làm hỏng dữ liệu). ` +
      'File dở đã xóa — chạy lại để tải lại từ đầu.',
    );
  }
  fs.renameSync(part, dest);
  // Byte thực sự tải trong lần chạy này (trừ phần resume đã có).
  return { skipped: false, bytes: total - (restarted ? 0 : downloaded) };
}

/**
 * GET 1 URL về file (append vào file đã có khi resume). Theo redirect tối
 * đa MAX_REDIRECTS. signal huỷ → lỗi có code 'ABORTED', giữ .part để resume.
 */
function downloadToFile(url, dest, startByte, { signal, onChunk, onRestarted }) {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (err) => {
      if (done) return;
      done = true;
      if (err) reject(err);
      else resolve();
    };
    const get = (currentUrl, redirectsLeft, resumeFrom) => {
      if (signal && signal.aborted) {
        const e = new Error('Đã huỷ tải model.');
        e.code = 'ABORTED';
        finish(e);
        return;
      }
      const lib = currentUrl.startsWith('https:') ? https : http;
      const headers = {};
      if (resumeFrom > 0) headers.Range = `bytes=${resumeFrom}-`;
      let req;
      try {
        req = lib.get(currentUrl, { headers }, (res) => {
          // Redirect: theo Location (giữ nguyên resume offset — HF resolve
          // redirect sang CDN vẫn hỗ trợ Range).
          if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            if (redirectsLeft <= 0) {
              finish(new Error(`Quá nhiều redirect khi tải ${currentUrl}`));
              res.resume();
              return;
            }
            res.resume();
            get(new URL(res.headers.location, currentUrl).toString(), redirectsLeft - 1, resumeFrom);
            return;
          }
          if (resumeFrom > 0 && res.statusCode !== 206) {
            // Server không hỗ trợ resume → tải lại từ đầu.
            resumeFrom = 0;
            if (onRestarted) onRestarted();
            try { fs.truncateSync(dest, 0); } catch { /* file chưa có */ }
          }
          if (res.statusCode !== 200 && res.statusCode !== 206) {
            finish(new Error(`Tải ${currentUrl} thất bại: HTTP ${res.statusCode}`));
            res.resume();
            return;
          }
          const out = fs.createWriteStream(dest, { flags: resumeFrom > 0 ? 'a' : 'w' });
          res.on('data', (chunk) => { if (onChunk) onChunk(chunk.length); });
          res.on('error', (e) => finish(e));
          out.on('error', (e) => finish(e));
          out.on('finish', () => finish(null));
          res.pipe(out);
        });
      } catch (e) {
        finish(e);
        return;
      }
      req.on('error', (e) => finish(e));
      if (signal) {
        const onAbort = () => {
          try { req.destroy(); } catch { /* bỏ qua */ }
          const e = new Error('Đã huỷ tải model.');
          e.code = 'ABORTED';
          finish(e);
        };
        if (signal.aborted) onAbort();
        else signal.addEventListener('abort', onAbort, { once: true });
      }
      req.setTimeout(60000, () => {
        req.destroy(new Error('Timeout 60s khi tải model (không có dữ liệu).'));
      });
    };
    get(url, MAX_REDIRECTS, startByte);
  });
}

/**
 * Tải 1 model: từng file theo manifest, verify từng file, ghi marker khi xong.
 * @param {{ root: string, layout: 'unified'|'repo' }} rootInfo
 * @param {string|object} modelOrId
 * @param {{ onProgress?: (p: ModelDownloadProgress) => void, signal?: AbortSignal }} opts
 * @returns {{ id, downloadedBytes, skippedBytes, files: number }}
 */
async function downloadModel(rootInfo, modelOrId, opts = {}) {
  const model = resolveModel(modelOrId);
  if (model.verified === false) {
    throw new Error(
      `Model "${model.id}" chưa xác minh (thiếu SHA256 trong manifest) — ` +
      'không tải qua app. Cần tải 1 lần bằng tay rồi chạy gen-model-manifest.mjs để khóa checksum.',
    );
  }
  const targetDir = modelTargetDir(model, rootInfo);
  fs.mkdirSync(targetDir, { recursive: true });
  // ROUND53-J8: fail rõ ràng khi thiếu đĩa, TRƯỚC khi tải byte nào.
  await ensureFreeDiskSpace(model, targetDir);
  let downloadedBytes = 0;
  let skippedBytes = 0;
  let filesDone = 0;
  const totalBytes = model.totalBytes || 0;
  for (const file of model.files) {
    if (opts.signal && opts.signal.aborted) {
      const e = new Error('Đã huỷ tải model.');
      e.code = 'ABORTED';
      throw e;
    }
    const r = await downloadFile(file, targetDir, {
      signal: opts.signal,
      onProgress: ({ downloaded, total }) => {
        if (opts.onProgress) {
          opts.onProgress({
            modelId: model.id,
            file: file.path,
            fileDownloaded: downloaded,
            fileTotal: total,
            totalDownloaded: downloadedBytes + downloaded,
            totalBytes,
          });
        }
      },
    });
    if (r.skipped) skippedBytes += file.size || 0;
    else downloadedBytes += r.bytes;
    filesDone += 1;
  }
  // Ghi marker để tts.py khỏi tự tải lại bằng snapshot_download.
  if (model.completeMarker) {
    try { writeFileEpermRetry(path.join(targetDir, model.completeMarker), 'ok\n', { label: 'desktop-model-complete-marker' }); } catch { /* không chặn */ }
  }
  return { id: model.id, downloadedBytes, skippedBytes, files: filesDone };
}

module.exports = {
  MODELS_DIR_ENV,
  loadManifest,
  getModelsDir,
  repoHasModels,
  resolveModelsRoot,
  modelTargetDir,
  resolveModel,
  sha256File,
  checkModelFile,
  checkModel,
  checkAllModels,
  freeDiskBytes,
  formatBytes,
  estimateRemainingBytes,
  ensureFreeDiskSpace,
  downloadFile,
  downloadModel,
};
