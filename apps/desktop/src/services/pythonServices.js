'use strict';
/**
 * pythonServices.js — Định nghĩa + kiểm tra các service AI Python của VCut.
 *
 * SỰ THẬT KIẾN TRÚC (đọc từ server/bridge + INSTALL.md, không suy đoán):
 * - Các script Python KHÔNG phải daemon chạy nền. Chúng là CLI chạy theo job,
 *   do bridge spawn bằng child_process.spawn với argv cố định mỗi khi có
 *   request (caption / tts / bgremove / reframe / silence / scene / beats).
 *   Vì vậy module này KHÔNG spawn tiến trình Python dài hạn — nó chỉ:
 *     (a) xác định đúng python binary cho từng service (theo đúng logic của
 *         bridge: env override → venv của module → "python3"), và
 *     (b) kiểm tra khả năng chạy thật của từng service (script tồn tại,
 *         python chạy được, module nặng import được) để báo trạng thái thật
 *         cho renderer — thay vì tin flag "available" nông của bridge
 *         (bridge chỉ kiểm tra file script tồn tại).
 * - Bridge tự ưu tiên venv chỉ cho reframe (server/reframe/.venv). Các service
 *   khác dùng env <TÊN>_PYTHON hoặc "python3" mặc định. Trên máy chưa cài
 *   venv, caption/tts/bgremove sẽ FAIL lúc chạy job dù /api/health báo
 *   available:true — vì vậy serviceManager truyền env đã nối venv vào bridge
 *   khi spawn (xem buildBridgeEnv).
 * - TTS dùng venv server/tts/.venv2 (không phải .venv — xem test-tts.sh và
 *   các LIMITS đợt 43/46). Nếu .venv2 mất thì thử .venv.
 *
 * Không telemetry, không gọi mạng — mọi kiểm tra đều local.
 */

const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { MODELS_DIR_ENV } = require('./modelDownloader');

/**
 * ROUND52-I5 — Model AI mà mỗi service cần (mirror manifest
 * model-manifest.json; chỉ kiểm tra file bắt buộc, không hash — hash 2,2G
 * mỗi lần probe là không chấp nhận được; checksum đầy đủ do downloader lo
 * lúc tải, xem modelDownloader.js).
 * - subdir: thư mục model dưới models root thống nhất (VCUT_MODELS_DIR).
 * - repoDir: thư mục model mặc định trong repo (dev) — tương đối từ appRoot.
 * - devDir: thư mục mặc định khi model không nằm trong repo (bgremove:
 *   rembg dùng ~/.u2net).
 * - required: file bắt buộc phải có dưới thư mục model (marker .vcut-complete
 *   mà tts.py ghi sau khi tải, hoặc model.bin mà caption.py kiểm tra).
 */
const MODEL_CHECKS = {
  caption: [
    {
      modelId: 'caption-small', subdir: 'fw-small', repoDir: 'server/caption/models',
      required: ['model.bin'], label: 'Whisper small', sizeLabel: '~486 MB',
    },
  ],
  translate: [
    {
      modelId: 'caption-small', subdir: 'fw-small', repoDir: 'server/caption/models',
      required: ['model.bin'], label: 'Whisper small', sizeLabel: '~486 MB',
    },
  ],
  tts: [
    {
      modelId: 'tts-turbo', subdir: 'VieNeu-TTS-v3-Turbo', repoDir: 'server/tts/models',
      required: ['.vcut-complete'], label: 'VieNeu-TTS v3 Turbo', sizeLabel: '~2,2 GB',
    },
    {
      modelId: 'tts-codec', subdir: 'MOSS-Audio-Tokenizer-Nano-ONNX', repoDir: 'server/tts/models',
      required: ['.vcut-complete'], label: 'MOSS codec', sizeLabel: '~87 MB',
    },
  ],
  bgremove: [
    {
      modelId: 'bgremove-birefnet', subdir: 'bgremove', repoDir: null,
      devDir: '.u2net', required: ['birefnet-general.onnx'],
      label: 'BiRefNet general', sizeLabel: '~880 MB (chưa xác minh checksum)',
    },
  ],
};

/**
 * Thư mục chứa model của một service.
 * - VCUT_MODELS_DIR được set (app đóng gói) → <đó>/<subdir> (thống nhất).
 * - Không set → thư mục mặc định trong repo (dev) hoặc devDir (~/.u2net).
 * @param {{ modelId: string, subdir: string, repoDir: string|null, devDir?: string }} check
 */
function resolveModelDir(check, appRoot, env = process.env) {
  if (env[MODELS_DIR_ENV]) return path.join(env[MODELS_DIR_ENV], check.subdir);
  if (check.repoDir) return path.join(appRoot, check.repoDir, check.subdir);
  if (check.devDir) return path.join(os.homedir(), check.devDir);
  return null;
}

/**
 * Kiểm tra model của một service: đủ file bắt buộc không.
 * @returns {{ ok: boolean, missing: Array<{ modelId: string, label: string, sizeLabel: string, dir: string, files: string[] }> }}
 */
function checkServiceModels(def, appRoot, env = process.env) {
  const checks = MODEL_CHECKS[def.id] || [];
  const missing = [];
  for (const check of checks) {
    const dir = resolveModelDir(check, appRoot, env);
    if (!dir) continue;
    const absent = check.required.filter((f) => !fs.existsSync(path.join(dir, f)));
    if (absent.length > 0) {
      missing.push({ modelId: check.modelId, label: check.label, sizeLabel: check.sizeLabel, dir, files: absent });
    }
  }
  return { ok: missing.length === 0, missing };
}

/** @type {Array<PythonServiceDef>} */
const PYTHON_SERVICES = [
  {
    id: 'caption',
    label: 'Auto-caption (faster-whisper)',
    scriptRel: 'server/caption/caption.py',
    pythonEnv: 'CAPTION_PYTHON',
    venvRel: ['server/caption/.venv/bin/python'],
    deepModule: 'faster_whisper',
  },
  {
    id: 'translate',
    label: 'Dịch phụ đề (faster-whisper)',
    scriptRel: 'server/caption/translate.py',
    pythonEnv: 'CAPTION_PYTHON',
    venvRel: ['server/caption/.venv/bin/python'],
    deepModule: 'faster_whisper',
  },
  {
    id: 'tts',
    label: 'Text-to-speech (VieNeu-TTS)',
    scriptRel: 'server/tts/tts.py',
    pythonEnv: 'TTS_PYTHON',
    venvRel: ['server/tts/.venv2/bin/python', 'server/tts/.venv/bin/python'],
    deepModule: 'onnxruntime',
  },
  {
    id: 'bgremove',
    label: 'Xoá nền (rembg)',
    scriptRel: 'server/bgremove/bgremove.py',
    pythonEnv: 'BGREMOVE_PYTHON',
    venvRel: ['server/bgremove/.venv/bin/python'],
    deepModule: 'rembg',
  },
  {
    id: 'reframe',
    label: 'Auto-reframe (OpenCV)',
    scriptRel: 'server/reframe/reframe.py',
    pythonEnv: 'REFRAME_PYTHON',
    venvRel: ['server/reframe/.venv/bin/python'],
    deepModule: 'cv2',
  },
  {
    id: 'silence',
    label: 'Xoá khoảng lặng (FFmpeg)',
    scriptRel: 'server/silence/silence.py',
    pythonEnv: 'SILENCE_PYTHON',
    venvRel: [],
    deepModule: null, // chỉ dùng stdlib + ffmpeg (subprocess), không module nặng
  },
  {
    id: 'scene',
    label: 'Scene detection (FFmpeg)',
    scriptRel: 'server/scene/scene.py',
    pythonEnv: 'SCENE_PYTHON',
    venvRel: [],
    deepModule: null, // chỉ dùng stdlib + ffmpeg (subprocess), không module nặng
  },
  {
    id: 'beats',
    label: 'Beat sync (numpy)',
    scriptRel: 'server/beats/beat.py',
    pythonEnv: 'BEATS_PYTHON',
    venvRel: [],
    deepModule: 'numpy',
  },
];

/**
 * Chọn python binary cho một service — mirror đúng thứ tự của bridge:
 * env override → venv của module (nếu tồn tại) → "python3".
 * Ngoại lệ theo bridge: silence fallback sang CAPTION_PYTHON trước "python3".
 * @param {PythonServiceDef} def
 * @param {string} appRoot - thư mục gốc repo (chứa server/)
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{ python: string, source: 'env' | 'venv' | 'system' }}
 */
function resolvePythonBin(def, appRoot, env = process.env) {
  const fromEnv = env[def.pythonEnv];
  if (fromEnv) return { python: fromEnv, source: 'env' };
  if (def.id === 'silence' && env.CAPTION_PYTHON) {
    return { python: env.CAPTION_PYTHON, source: 'env' };
  }
  for (const rel of def.venvRel || []) {
    const abs = path.resolve(appRoot, rel);
    if (fs.existsSync(abs)) return { python: abs, source: 'venv' };
  }
  return { python: 'python3', source: 'system' };
}

/**
 * Chạy một lệnh ngắn, trả về stdout (dùng cho --version / import probe).
 * @param {string} bin
 * @param {string[]} args
 * @param {number} timeoutMs
 * @returns {Promise<{ ok: boolean, ms: number, error?: string }>}
 */
function runShort(bin, args, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve) => {
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      resolve({ ...result, ms: Date.now() - started });
    };
    let child;
    try {
      child = execFile(bin, args, { timeout: timeoutMs }, (err) => {
        if (err) {
          const msg = (err.killed && err.signal === 'SIGTERM')
            ? `timeout sau ${timeoutMs}ms`
            : (err.message || String(err));
          finish({ ok: false, error: msg.split('\n')[0] });
        } else {
          finish({ ok: true });
        }
      });
    } catch (e) {
      finish({ ok: false, error: String((e && e.message) || e) });
    }
    // execFile với timeout tự kill; không cần thêm timer.
    void child;
  });
}

/**
 * Kiểm tra một service Python.
 * - Nông: script tồn tại + python --version chạy được.
 * - Sâu (deep=true): import thử module nặng mà service cần lúc chạy job.
 *   Nếu module thiếu thì available=false kèm lý do rõ ràng (service sẽ fail
 *   khi chạy job thật, dù bridge báo available:true).
 * @param {PythonServiceDef} def
 * @param {string} appRoot
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @param {{ deep?: boolean }} [opts]
 * @returns {Promise<PythonServiceStatus>}
 */
async function probePythonService(def, appRoot, env = process.env, opts = {}) {
  const script = path.resolve(appRoot, def.scriptRel);
  const { python, source } = resolvePythonBin(def, appRoot, env);
  /** @type {PythonServiceStatus} */
  const status = {
    id: def.id,
    label: def.label,
    available: false,
    python,
    pythonSource: source,
    script,
  };
  if (!fs.existsSync(script)) {
    status.reason = `Không tìm thấy script ${def.scriptRel}`;
    return status;
  }
  const ver = await runShort(python, ['--version'], 5000);
  if (!ver.ok) {
    status.reason = `Không chạy được python "${python}": ${ver.error || 'lỗi không rõ'}`;
    return status;
  }
  status.available = true;
  if (opts.deep && def.deepModule) {
    const imp = await runShort(python, ['-c', `import ${def.deepModule}`], 15000);
    status.deps = { module: def.deepModule, ok: imp.ok, ms: imp.ms };
    if (!imp.ok) {
      status.available = false;
      status.reason =
        `Thiếu module "${def.deepModule}" trong python "${python}" ` +
        `(cần cho ${def.label}). Lỗi: ${imp.error || 'import thất bại'}`;
    }
  } else if (def.deepModule) {
    status.deps = { module: def.deepModule, ok: null, ms: 0 }; // chưa kiểm tra sâu
  }
  // ROUND52-I5 — Python AI chỉ bật khi model đã có: venv/import đủ mà model
  // chưa tải thì job sẽ fail lúc chạy thật (tts.py tự tải 2,2G vào thư mục
  // resources chỉ-đọc của AppImage rồi lỗi). Báo thiếu model rõ ràng để UI
  // hướng user tải model thay vì báo service "khả dụng" giả.
  const modelCheck = checkServiceModels(def, appRoot, env);
  status.model = {
    ok: modelCheck.ok,
    missing: modelCheck.missing.map((m) => ({
      modelId: m.modelId,
      label: m.label,
      sizeLabel: m.sizeLabel,
      dir: m.dir,
    })),
  };
  if (!modelCheck.ok) {
    status.available = false;
    status.reason =
      `Chưa có model ${modelCheck.missing.map((m) => `${m.label} (${m.sizeLabel})`).join(', ')} ` +
      `— tải trong app (mục Model AI) rồi chạy lại. Thư mục model: ${modelCheck.missing[0].dir}`;
  }
  return status;
}

/**
 * Kiểm tra tất cả service Python song song.
 * @param {string} appRoot
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @param {{ deep?: boolean }} [opts]
 * @returns {Promise<Record<string, PythonServiceStatus>>}
 */
async function probeAllPythonServices(appRoot, env = process.env, opts = {}) {
  const results = await Promise.all(
    PYTHON_SERVICES.map((def) => probePythonService(def, appRoot, env, opts)),
  );
  const out = {};
  for (const r of results) out[r.id] = r;
  return out;
}

/**
 * Dựng env override để truyền cho bridge khi spawn: nối venv đã có trên đĩa
 * vào các biến <TÊN>_PYTHON mà bridge đọc. Chỉ set khi user chưa set env đó
 * (env user thắng). Reframe không cần set — bridge tự ưu tiên .venv.
 * @param {string} appRoot
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{ env: Record<string, string>, wired: Array<{ service: string, variable: string, value: string }> }}
 */
function buildBridgeEnv(appRoot, env = process.env) {
  const overrides = {};
  const wired = [];
  for (const def of PYTHON_SERVICES) {
    if (env[def.pythonEnv]) continue; // user đã set — không đè
    if (def.id === 'reframe') continue; // bridge tự ưu tiên .venv
    for (const rel of def.venvRel || []) {
      const abs = path.resolve(appRoot, rel);
      if (fs.existsSync(abs)) {
        overrides[def.pythonEnv] = abs;
        wired.push({ service: def.id, variable: def.pythonEnv, value: abs });
        break;
      }
    }
  }
  return { env: overrides, wired };
}

module.exports = {
  PYTHON_SERVICES,
  MODELS_DIR_ENV,
  MODEL_CHECKS,
  resolveModelDir,
  checkServiceModels,
  resolvePythonBin,
  probePythonService,
  probeAllPythonServices,
  buildBridgeEnv,
};

/**
 * @typedef {Object} PythonServiceDef
 * @property {string} id
 * @property {string} label
 * @property {string} scriptRel - đường dẫn script tương đối từ repo root
 * @property {string} pythonEnv - tên biến env bridge đọc để chọn python
 * @property {string[]} venvRel - venv ưu tiên (tương đối từ repo root)
 * @property {string|null} deepModule - module nặng cần import thử (null = chỉ stdlib/ffmpeg)
 *
 * @typedef {Object} PythonServiceStatus
 * @property {string} id
 * @property {string} label
 * @property {boolean} available
 * @property {string} python
 * @property {'env'|'venv'|'system'} pythonSource
 * @property {string} script
 * @property {string} [reason]
 * @property {{ module: string, ok: boolean|null, ms: number }} [deps]
 */
