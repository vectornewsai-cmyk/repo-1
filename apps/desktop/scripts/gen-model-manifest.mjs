#!/usr/bin/env node
/**
 * gen-model-manifest.mjs — Sinh apps/desktop/src/services/model-manifest.json
 * từ các model AI đã có trên máy này (thư mục server/<svc>/models).
 *
 * Vì sao cần manifest có SHA256: downloader lần đầu (modelDownloader.js) tải
 * model từ nguồn gốc công khai về userData/models và PHẢI verify checksum sau
 * tải. SHA256 ở đây được tính từ đúng file mà tts.py / caption.py đã tải bằng
 * snapshot_download / faster-whisper trước đây — tức file thật, không phải số
 * bịa. Chạy lại script này mỗi khi model gốc đổi phiên bản.
 *
 * Nguồn + license (đã verify 06–07/11/2026 qua HF API, xem LIMITS I5):
 * - Systran/faster-whisper-small: MIT
 *   (cardData.license "mit", https://huggingface.co/Systran/faster-whisper-small)
 * - pnnbao-ump/VieNeu-TTS-v3-Turbo: Apache-2.0
 *   (PyPI vieneu + HF cardData, đã verify trong server/bridge/src/tts.js)
 * - OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX: Apache-2.0
 *   (cardData.license "apache-2.0")
 * - BiRefNet (rembg release): MIT — URL GỐC là
 *   `BiRefNet-general-epoch_244.onnx` (972.666.916 byte), rembg tải về rồi
 *   lưu lại thành `birefnet-general.onnx` trong ~/.u2net (xem
 *   rembg/sessions/birefnet_general.py — download_models, md5
 *   7a35a0141cbbc80de11d9c9a28f52697). URL cũ `.../birefnet-general.onnx`
 *   TRẢ 404 (kiểm chứng 07/11/2026) nên manifest I5 không bao giờ tải được.
 *   Entry này hash từ file ~/.u2net/birefnet-general.onnx khi đã có trên
 *   máy (ROUND53-J8), chưa có thì giữ placeholder chưa verify.
 *
 * Cách dùng:
 *   node apps/desktop/scripts/gen-model-manifest.mjs [--check]
 * --check: chỉ đối chiếu manifest hiện tại với file trên đĩa, không ghi.
 */
import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
// Đợt 85 M5: ghi manifest qua helper retry EPERM + verify đủ byte
// (apps/web/scripts/eperm-retry.mjs).
import { writeFileEpermRetry } from '../../web/scripts/eperm-retry.mjs';

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = resolve(desktopDir, '..', '..');
const outPath = join(desktopDir, 'src', 'services', 'model-manifest.json');

/**
 * Đặc tả từng model. `files: 'all'` = mọi file đệ quy dưới localDir (trừ
 * exclude); `files: [...]` = danh sách file tương đối cố định.
 */
const MODELS = [
  {
    id: 'caption-small',
    service: 'caption',
    label: 'Whisper small — auto-caption (faster-whisper)',
    repo: 'Systran/faster-whisper-small',
    license: 'MIT',
    licenseUrl: 'https://huggingface.co/Systran/faster-whisper-small',
    baseUrl: 'https://huggingface.co/Systran/faster-whisper-small/resolve/main',
    localDir: join(repoRoot, 'server', 'caption', 'models', 'fw-small'),
    repoDir: join('server', 'caption', 'models'),
    subdir: 'fw-small',
    // Chỉ 4 file repo thật ở gốc; blobs/ + models--Systran--*/ là HF cache
    // nội bộ của faster-whisper (download_root), KHÔNG phải file repo.
    files: ['config.json', 'model.bin', 'tokenizer.json', 'vocabulary.txt'],
    completeMarker: null, // caption.py kiểm tra trực tiếp model.bin
    required: ['model.bin'],
    sizeLabel: '~486 MB',
  },
  {
    id: 'tts-turbo',
    service: 'tts',
    label: 'VieNeu-TTS v3 Turbo 0.5B (giọng Việt)',
    repo: 'pnnbao-ump/VieNeu-TTS-v3-Turbo',
    license: 'Apache-2.0',
    licenseUrl: 'https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo',
    baseUrl: 'https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo/resolve/main',
    localDir: join(repoRoot, 'server', 'tts', 'models', 'VieNeu-TTS-v3-Turbo'),
    repoDir: join('server', 'tts', 'models'),
    subdir: 'VieNeu-TTS-v3-Turbo',
    files: 'all',
    // .cache/ là HF cache nội bộ snapshot_download để lại; *.lock/*.metadata/
    // *.incomplete là file tạm của huggingface_hub — không phải file repo.
    exclude: (rel) =>
      rel.startsWith('.cache' + sep) ||
      rel.endsWith('.lock') ||
      rel.endsWith('.metadata') ||
      rel.endsWith('.incomplete') ||
      rel === '.vcut-complete' ||
      rel === 'CACHEDIR.TAG',
    completeMarker: '.vcut-complete', // tts.py kiểm tra marker này trước khi tải
    required: ['onnx_update/vieneu_acoustic_cached.onnx', 'denoiser.onnx', 'speaker_encoder.onnx'],
    sizeLabel: '~2,2 GB',
  },
  {
    id: 'tts-codec',
    service: 'tts',
    label: 'MOSS Audio Tokenizer Nano (codec cho VieNeu-TTS)',
    repo: 'OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX',
    license: 'Apache-2.0',
    licenseUrl: 'https://huggingface.co/OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX',
    baseUrl: 'https://huggingface.co/OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX/resolve/main',
    localDir: join(repoRoot, 'server', 'tts', 'models', 'MOSS-Audio-Tokenizer-Nano-ONNX'),
    repoDir: join('server', 'tts', 'models'),
    subdir: 'MOSS-Audio-Tokenizer-Nano-ONNX',
    files: 'all',
    exclude: (rel) =>
      rel.startsWith('.cache' + sep) ||
      rel.endsWith('.lock') ||
      rel.endsWith('.metadata') ||
      rel.endsWith('.incomplete') ||
      rel === '.vcut-complete' ||
      rel === 'CACHEDIR.TAG',
    completeMarker: '.vcut-complete',
    required: ['moss_audio_tokenizer_encode.onnx'],
    sizeLabel: '~87 MB',
  },
  {
    id: 'bgremove-birefnet',
    service: 'bgremove',
    label: 'BiRefNet general — xoá nền (rembg)',
    repo: 'danielgatis/rembg (release v0.0.0)',
    license: 'MIT',
    licenseUrl: 'https://github.com/danielgatis/rembg/releases',
    // URL gốc (GitHub release) KHÁC tên file đích: rembg tải
    // BiRefNet-general-epoch_244.onnx rồi lưu thành birefnet-general.onnx
    // trong ~/.u2net (xem rembg 2.0.60 sessions/birefnet_general.py).
    // fileUrl ánh xạ tên file đích → URL tải thật (J8: URL cũ
    // .../birefnet-general.onnx trả 404, xem LIMITS J8).
    baseUrl: 'https://github.com/danielgatis/rembg/releases/download/v0.0.0',
    localDir: join(homedir(), '.u2net'),
    localOptional: true, // chưa có file trên máy → giữ entry chưa verify
    repoDir: null,
    devDir: '~/.u2net', // dev: rembg mặc định dùng U2NET_HOME (~/.u2net)
    subdir: 'bgremove',
    files: ['birefnet-general.onnx'],
    fileUrl: {
      'birefnet-general.onnx':
        'https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx',
    },
    // Entry giữ lại khi chưa có file local (downloader từ chối tải).
    placeholderFiles: [
      {
        path: 'birefnet-general.onnx',
        url: 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx',
        sha256: null,
        size: null,
      },
    ],
    completeMarker: null,
    required: ['birefnet-general.onnx'],
    sizeLabelVerified: '~973 MB',
    sizeLabelUnverified: '~973 MB (chưa xác minh)',
    note: 'Chưa tải về máy này nên chưa có SHA256 — cần tải 1 lần rồi chạy lại gen-model-manifest để khóa checksum trước khi cho phép tải qua app.',
    noteVerified:
      'SHA256 khóa từ file ~/.u2net/birefnet-general.onnx đã tải thật (ROUND53-J8); ' +
      'URL gốc là BiRefNet-general-epoch_244.onnx, md5 theo rembg 2.0.60 là ' +
      '7a35a0141cbbc80de11d9c9a28f52697.',
  },
];

function listFilesRecursive(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) listFilesRecursive(p, base, out);
    else if (entry.isFile()) out.push(relative(base, p));
  }
  return out;
}

function sha256File(file) {
  const h = createHash('sha256');
  // Đọc theo chunk để không giữ 500MB trong RAM (model.bin ~484MB).
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.allocUnsafe(4 * 1024 * 1024);
    let n;
    while ((n = readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n));
  } finally {
    closeSync(fd);
  }
  return h.digest('hex');
}

function buildManifest() {
  const models = [];
  for (const m of MODELS) {
    const files = [];
    let verified = m.verified !== false;
    if (m.localDir) {
      const rels = m.files === 'all'
        ? listFilesRecursive(m.localDir).filter((r) => !(m.exclude && m.exclude(r)))
        : [...m.files];
      rels.sort();
      const missing =
        !existsSync(m.localDir) ||
        rels.some((rel) => !existsSync(join(m.localDir, rel)));
      if (missing && m.localOptional) {
        // ROUND53-J8: chưa có file local → giữ entry chưa verify
        // (downloader từ chối tải), không ném lỗi để script vẫn chạy
        // được trên máy chưa tải model.
        for (const f of m.placeholderFiles || []) files.push({ ...f });
        verified = false;
      } else {
        if (!existsSync(m.localDir)) {
          throw new Error(`[gen-model-manifest] thiếu thư mục model nguồn: ${m.localDir}`);
        }
        for (const rel of rels) {
          const abs = join(m.localDir, rel);
          if (!existsSync(abs)) throw new Error(`[gen-model-manifest] thiếu file: ${abs}`);
          const size = statSync(abs).size;
          files.push({
            path: rel.split(sep).join('/'),
            // fileUrl: URL tải thật khi khác tên file đích (bgremove:
            // BiRefNet-general-epoch_244.onnx → birefnet-general.onnx).
            url: (m.fileUrl && m.fileUrl[rel]) || `${m.baseUrl}/${rel.split(sep).join('/')}`,
            sha256: sha256File(abs),
            size,
          });
        }
        verified = true;
      }
    } else {
      for (const f of m.files) files.push(f);
    }
    models.push({
      id: m.id,
      service: m.service,
      label: m.label,
      repo: m.repo,
      license: m.license,
      licenseUrl: m.licenseUrl,
      repoDir: m.repoDir,
      ...(m.devDir ? { devDir: m.devDir } : {}),
      subdir: m.subdir,
      completeMarker: m.completeMarker,
      required: m.required,
      sizeLabel: verified
        ? (m.sizeLabelVerified || m.sizeLabel)
        : (m.sizeLabelUnverified || m.sizeLabel),
      verified,
      ...(verified
        ? (m.noteVerified ? { note: m.noteVerified } : {})
        : (m.note ? { note: m.note } : {})),
      totalBytes: files.reduce((s, f) => s + (f.size || 0), 0),
      files,
    });
  }
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: 'apps/desktop/scripts/gen-model-manifest.mjs (hash từ file local thật)',
    note: 'SHA256 tính từ model đã tải trước đây bằng snapshot_download/faster-whisper. File có sha256=null là chưa xác minh — downloader từ chối tải.',
    models,
  };
}

const checkOnly = process.argv.includes('--check');
const manifest = buildManifest();
if (checkOnly) {
  const cur = JSON.parse(readFileSync(outPath, 'utf8'));
  const a = JSON.stringify(cur.models);
  const b = JSON.stringify(manifest.models);
  if (a === b) {
    console.log('[gen-model-manifest] CHECK OK: manifest khớp file trên đĩa.');
  } else {
    console.error('[gen-model-manifest] CHECK FAIL: manifest lệch với file trên đĩa — chạy lại không có --check để tái sinh.');
    process.exit(1);
  }
} else {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileEpermRetry(outPath, JSON.stringify(manifest, null, 2) + '\n', { label: 'gen-model-manifest' });
  for (const m of manifest.models) {
    const done = m.files.filter((f) => f.sha256).length;
    console.log(
      `[gen-model-manifest] ${m.id}: ${done}/${m.files.length} file có SHA256, ` +
      `${(m.totalBytes / 1048576).toFixed(1)} MiB, verified=${m.verified}`,
    );
  }
  console.log(`[gen-model-manifest] OK → ${outPath}`);
}
