'use strict';
/**
 * serviceManager.js — Quản lý vòng đời các service local trong Electron.
 *
 * SỰ THẬT KIẾN TRÚC (đọc từ scripts/start.sh, INSTALL.md, server/bridge):
 * - Service dài hạn DUY NHẤT là bridge: `node server/bridge/src/index.js`,
 *   cổng lấy từ env BRIDGE_PORT (mặc định 8787) — lưu ý bridge BỎ QUA argv
 *   --port, nên manager truyền cổng qua env. Health: GET /api/health.
 * - Render worker (server/render/src/render.js) và các script Python AI là
 *   CLI chạy THEO JOB, do bridge spawn (jobQueue.js / caption.js / tts.js /
 *   bgremove.js / reframe.js / silence.js / scene.js / beats.js). Chúng
 *   KHÔNG có tiến trình nền để quản lý — manager báo trạng thái của chúng qua
 *   probe file+module (pythonServices.js) và flag /api/health của bridge.
 * - Bridge tự kill cây tiến trình job khi shutdown (jobQueue.killProcessTree);
 *   manager kill theo process group để dọn cả job đang chạy dở khi app quit.
 *
 * CÁCH DÙNG (từ Electron main process — xem ghi chú cuối file):
 *   const { createServiceManager } = require('./serviceManager');
 *   const manager = createServiceManager({
 *     appRoot: <thư mục repo / resources chứa server/>,
 *     userDataDir: app.getPath('userData'),
 *     onStatus: (snap) => win.webContents.send('vcut:services-status', snap),
 *   });
 *   await manager.start();
 *   // ... khi app quit:
 *   await manager.stop();
 *
 * Module này KHÔNG import electron — chạy được bằng Node thuần để test độc lập
 * (xem serviceManager.test.cjs). Main process chỉ cần truyền appRoot/userData
 * và forward event 'status' sang renderer qua preload.
 *
 * HOÀN TOÀN OFFLINE: chỉ gọi HTTP loopback tới bridge; không telemetry, không
 * gọi ra ngoài. Log ghi file local trong userData/logs.
 */

const { execFile, spawn, spawnSync } = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const {
  PYTHON_SERVICES,
  probeAllPythonServices,
  buildBridgeEnv,
} = require('./pythonServices');

// ROUND52-I5 — thư mục model thống nhất cho app đóng gói
// (userData/models). Dev (repo đã có model) thì KHÔNG set — script Python
// dùng thư mục mặc định trong repo (xem resolveModelsRoot).
const { resolveModelsRoot } = require('./modelDownloader');

const {
  DEFAULT_CDP_PORT,
  cleanupStaleBridge: cleanupStaleBridgeFile,
  readBridgePidfile,
  removeBridgePidfile,
  writeBridgePidfile,
} = require('./bridgePidfile');

const {
  cleanupStaleElectronChildren: cleanupStaleElectronChildrenFile,
  readElectronPidfile,
  removeElectronPidfile,
  writeElectronPidfile,
} = require('./electronOrphanCleanup');

const DEFAULT_BRIDGE_PORT = 8787;
const PORT_SCAN_COUNT = 10; // thử 8787..8796
const HEALTH_TIMEOUT_MS = 2000;
const HEALTH_POLL_MS = 250;
const START_TIMEOUT_BASE_MS = 30000; // chờ bridge healthy sau mỗi lần spawn, lúc máy yên
const START_TIMEOUT_MAX_MS = 120000; // trần khi tải cao (không chờ vô hạn)
const START_PROGRESS_EXTENSION_MS = 30000; // gia hạn 1 lần khi bridge đã trả lời HTTP nhưng chưa ok
const MAX_RESTARTS = 3; // số lần restart tối đa sau crash (không tính lần chạy đầu)
const RESTART_BACKOFF_MS = [1000, 2000, 4000];
const STOP_GRACE_MS = 5000; // chờ SIGTERM trước khi SIGKILL
const STOP_KILL_WAIT_MS = 2000;
const LOG_MAX_BYTES = 10 * 1024 * 1024; // 10 MB — xoay file khi vượt

/** Lỗi cổng bận — khác với lỗi khởi động khác để manager thử cổng khác. */
class PortBusyError extends Error {
  constructor(port) {
    super(`Cổng ${port} đã bị chiếm`);
    this.name = 'PortBusyError';
    this.port = port;
  }
}

/**
 * Kiểm tra cổng có trống không bằng cách thử listen trên 127.0.0.1.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

/**
 * Tìm cổng trống đầu tiên từ preferred trở đi.
 * @param {number} preferred
 * @param {number} [count=PORT_SCAN_COUNT]
 * @returns {Promise<number>}
 */
async function findFreePort(preferred, count = PORT_SCAN_COUNT) {
  for (let p = preferred; p < preferred + count; p += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(p)) return p;
  }
  throw new Error(`Không còn cổng trống trong khoảng ${preferred}..${preferred + count - 1}`);
}

/**
 * Đợt 52 I4 — timeout khởi động thích ứng theo tải (thay 30s cứng).
 *
 * Nợ đợt 51 §4.8 / H8 §6.5: START_TIMEOUT_MS 30s quá chặt khi tải cao —
 * serviceManager.test.cjs flake "bridge không healthy sau 30s" (H7 chạy 2,
 * H8 §3.5) trong khi chạy riêng thì pass 7–14s. Nguyên nhân: VM 2–4 vCPU
 * chạy nhiều build/Electron song song thì node boot + lần probe ffmpeg đầu
 * của bridge bị đói CPU, bridge khỏe nhưng manager hết giờ trước.
 *
 * Quy tắc: timeout = 30s × min(load1/cpu, 4), trần 120s. load1/cpu ≤ 1
 * (máy yên) thì đúng 30s như cũ — không nới vô cớ. Hàm thuần để test
 * được mà không cần stub os.loadavg.
 * @param {number} load1 - loadavg 1 phút
 * @param {number} cpuCount - số CPU logic
 * @returns {number} timeout ms (30000..120000)
 */
function startTimeoutForLoad(load1, cpuCount) {
  const cpus = Number.isFinite(cpuCount) && cpuCount > 0 ? cpuCount : 1;
  const load = Number.isFinite(load1) && load1 > 0 ? load1 : 0;
  const factor = Math.max(1, load / cpus);
  return Math.min(START_TIMEOUT_MAX_MS, Math.round(START_TIMEOUT_BASE_MS * Math.min(factor, 4)));
}

/** Hệ số tải hiện tại (load1/cpu), dùng để nới cả timeout từng health check. */
function currentLoadFactor() {
  const cpus = os.cpus().length || 1;
  return Math.max(1, os.loadavg()[0] / cpus);
}

/**
 * GET /api/health của bridge.
 * @param {number} port
 * @param {number} [timeoutMs=HEALTH_TIMEOUT_MS] - timeout từng request
 *   (đợt 52 I4: nới theo tải, vì event loop bridge cũng đói CPU khi tải cao)
 * @returns {Promise<{ ok: boolean, connected: boolean, data?: any, error?: string }>}
 *   connected=true nghĩa là bridge đã trả về HTTP response (đang sống, chỉ
 *   chậm) — khác với connection refused/timeout chưa chạm được bridge.
 */
function healthCheck(port, timeoutMs = HEALTH_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port, path: '/api/health', timeout: timeoutMs },
      (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ connected: true, ok: res.statusCode === 200 && data && data.ok === true, data });
          } catch {
            resolve({ connected: true, ok: false, error: `health trả về không phải JSON (HTTP ${res.statusCode})` });
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('health timeout')));
    req.on('error', (e) => resolve({ connected: false, ok: false, error: e.message }));
  });
}

/**
 * Kill cả cây tiến trình (process group trên POSIX, /T trên Windows).
 * Trả về true nếu đã gửi tín hiệu (không đảm bảo tiến trình chết ngay).
 * @param {number} pid - pid của tiến trình gốc (leader của group khi detached)
 * @param {NodeJS.Signals} [signal='SIGTERM']
 * @returns {boolean}
 */
function killProcessGroup(pid, signal = 'SIGTERM') {
  if (!pid || pid <= 0) return false;
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('taskkill', ['/PID', String(pid), '/T', signal === 'SIGKILL' ? '/F' : '/F'], {
        stdio: 'ignore',
      });
      return r.status === 0;
    }
    try {
      process.kill(-pid, signal); // cả group (child được spawn detached)
      return true;
    } catch {
      process.kill(pid, signal); // fallback: chỉ tiến trình gốc
      return true;
    }
  } catch {
    return false;
  }
}

/**
 * Kiểm tra một pid còn sống không.
 * @param {number} pid
 * @returns {boolean}
 */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Chờ một điều kiện đúng, poll mỗi intervalMs, tối đa timeoutMs.
 * @param {() => boolean | Promise<boolean>} cond
 * @param {number} timeoutMs
 * @param {number} [intervalMs=100]
 * @returns {Promise<boolean>}
 */
async function waitFor(cond, timeoutMs, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    if (await cond()) return true;
    if (Date.now() >= deadline) return false;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

class ServiceManager extends EventEmitter {
  /**
   * @param {ServiceManagerOptions} opts
   */
  constructor(opts) {
    super();
    if (!opts || !opts.appRoot || !opts.userDataDir) {
      throw new Error('createServiceManager cần { appRoot, userDataDir }');
    }
    this.appRoot = path.resolve(opts.appRoot);
    this.userDataDir = path.resolve(opts.userDataDir);
    this.nodeBin = opts.nodeBin || process.env.VCUT_NODE || 'node';
    this.bridgeEntry = path.resolve(this.appRoot, 'server/bridge/src/index.js');
    this.renderEntry = path.resolve(this.appRoot, 'server/render/src/render.js');
    this.maxRestarts = Number.isInteger(opts.maxRestarts) ? opts.maxRestarts : MAX_RESTARTS;
    this.preferredPort = opts.preferredPort || DEFAULT_BRIDGE_PORT;
    // Cổng CDP của Electron (để cleanupStaleBridge kiểm tra socket CDP có
    // được giải phóng sau khi kill bridge mồ côi không; serviceLifecycle tự
    // lấy từ argv --remote-debugging-port, mặc định 9222).
    this.cdpPort = Number.isInteger(opts.cdpPort) ? opts.cdpPort : DEFAULT_CDP_PORT;
    if (typeof opts.onStatus === 'function') this.on('status', opts.onStatus);

    this.bridgeState = 'stopped'; // stopped|starting|running|restarting|failed
    this.bridgePort = null;
    this.bridgePid = null;
    this.bridgeChild = null;
    this.bridgeStartedAt = null;
    this.restarts = 0;
    this.lastError = null;
    this.health = null; // body /api/health gần nhất
    this.aiServices = {};
    this.ffmpeg = { available: false, version: null };
    this._stopping = false;
    this._startPromise = null;
    this._restartTimer = null;
    this._stderrTail = [];
    this._logDir = path.join(this.userDataDir, 'logs');
    this._bridgeLogStream = null;
    this._managerLogStream = null;
  }

  // -- logging ---------------------------------------------------------------

  /**
   * Đợt 52 I4 — chặn start() khi stop() đã được gọi (kể cả lúc start đang
   * chạy dở: dọn stale / dò cổng / chờ healthy). Không có kiểm tra này thì
   * stop() chạy trong lúc start() chưa spawn (bridgeChild còn null) sẽ
   * return ngay, rồi start() tiếp tục spawn bridge — bridge mồ côi, test
   * runner treo (gặp thật ở lần chạy cuối đợt 52: runner treo >6 phút,
   * bridge 39059 còn sống trên cổng 18870 sau khi test đã timeout).
   */
  _assertNotStopping() {
    if (this._stopping) {
      throw new Error('start() đã bị stop() huỷ trước khi bridge chạy được');
    }
  }

  _openLogStreams() {
    fs.mkdirSync(this._logDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const bridgeLog = path.join(this._logDir, `bridge-${today}.log`);
    const managerLog = path.join(this._logDir, 'service-manager.log');
    for (const f of [bridgeLog, managerLog]) {
      try {
        if (fs.existsSync(f) && fs.statSync(f).size > LOG_MAX_BYTES) {
          fs.renameSync(f, `${f}.1`);
        }
      } catch { /* không xoay được thì ghi tiếp file cũ */ }
    }
    this._bridgeLogStream = fs.createWriteStream(bridgeLog, { flags: 'a' });
    this._managerLogStream = fs.createWriteStream(managerLog, { flags: 'a' });
  }

  _closeLogStreams() {
    for (const s of [this._bridgeLogStream, this._managerLogStream]) {
      try { s && s.end(); } catch { /* bỏ qua */ }
    }
    this._bridgeLogStream = null;
    this._managerLogStream = null;
  }

  _logManager(line) {
    const text = `[${new Date().toISOString()}] ${line}\n`;
    try { this._managerLogStream && this._managerLogStream.write(text); } catch { /* bỏ qua */ }
  }

  _logBridge(chunk) {
    try { this._bridgeLogStream && this._bridgeLogStream.write(chunk); } catch { /* bỏ qua */ }
  }

  // -- trạng thái ------------------------------------------------------------

  /** @returns {ServiceStatusSnapshot} */
  getStatus() {
    return {
      bridge: {
        state: this.bridgeState,
        port: this.bridgePort,
        url: this.bridgePort ? `http://127.0.0.1:${this.bridgePort}` : null,
        pid: this.bridgePid,
        restarts: this.restarts,
        uptimeSec: this.bridgeStartedAt
          ? Math.max(0, Math.round((Date.now() - this.bridgeStartedAt) / 1000))
          : 0,
        lastError: this.lastError,
      },
      render: {
        mode: 'on-demand', // CLI theo job, do bridge spawn — không có daemon
        available: fs.existsSync(this.renderEntry) && this.ffmpeg.available,
        script: this.renderEntry,
        reason: !fs.existsSync(this.renderEntry)
          ? `Không tìm thấy render.js (${this.renderEntry})`
          : (!this.ffmpeg.available ? 'Không tìm thấy ffmpeg trong PATH' : undefined),
      },
      ai: this.aiServices,
      ffmpeg: this.ffmpeg,
      updatedAt: new Date().toISOString(),
    };
  }

  getBridgeUrl() {
    return this.bridgePort ? `http://127.0.0.1:${this.bridgePort}` : null;
  }

  getBridgePort() {
    return this.bridgePort;
  }

  isRunning() {
    return this.bridgeState === 'running';
  }

  _emitStatus() {
    this.emit('status', this.getStatus());
  }

  _setBridgeState(state, error) {
    this.bridgeState = state;
    if (error !== undefined) this.lastError = error;
    this._logManager(`bridge state -> ${state}${error ? `: ${error}` : ''}`);
    this._emitStatus();
  }

  // -- kiểm tra môi trường ----------------------------------------------------

  _checkNodeBin() {
    return new Promise((resolve) => {
      execFile(this.nodeBin, ['--version'], { timeout: 5000 }, (err, stdout) => {
        if (err) {
          resolve({
            ok: false,
            error: `Không chạy được node "${this.nodeBin}": ${(err.message || 'lỗi không rõ').split('\n')[0]}. ` +
              'Desktop app cần Node.js (cài hệ thống hoặc bundle cùng app).',
          });
        } else {
          resolve({ ok: true, version: String(stdout || '').trim() });
        }
      });
    });
  }

  _checkFfmpeg() {
    return new Promise((resolve) => {
      execFile('ffmpeg', ['-version'], { timeout: 5000 }, (err, stdout) => {
        if (err) {
          resolve({ available: false, version: null });
        } else {
          const m = String(stdout || '').match(/ffmpeg version (\S+)/);
          resolve({ available: true, version: m ? m[1] : null });
        }
      });
    });
  }

  // -- spawn bridge ----------------------------------------------------------

  /**
   * Spawn bridge trên một cổng, chờ healthy. Ném PortBusyError nếu cổng bị
   * chiếm giữa chừng (EADDRINUSE trong stderr hoặc exit sớm vì listen lỗi).
   * @param {number} port
   * @returns {Promise<void>}
   */
  /**
   * ROUND52-I5 — env cho bridge + probe Python AI.
   * App đóng gói (repo không có model): VCUT_MODELS_DIR=userData/models để
   * bridge → tts.py/caption.py/bgremove.py đọc model đã tải về (thay vì
   * thư mục resources chỉ-đọc). Dev (repo đã có model): KHÔNG set — script
   * dùng thư mục mặc định trong repo. User set sẵn thì tôn trọng (resolve
   * trong resolveModelsRoot).
   * @returns {Record<string, string>} env bổ sung (rỗng khi không cần)
   */
  _modelsEnv() {
    const root = resolveModelsRoot({
      appRoot: this.appRoot,
      userDataDir: this.userDataDir,
      env: process.env,
    });
    return root.layout === 'unified' ? { VCUT_MODELS_DIR: root.root } : {};
  }

  async _spawnBridgeOnPort(port) {
    const { env: venvEnv, wired } = buildBridgeEnv(this.appRoot);
    const modelsEnv = this._modelsEnv();
    const bridgeEnv = {
      ...process.env,
      ...venvEnv,
      ...modelsEnv,
      BRIDGE_PORT: String(port),
      BRIDGE_WORK_DIR: path.join(this.userDataDir, 'bridge-jobs'),
      // Đợt 66 T9 — persist riêng theo userDataDir: mỗi app/test dùng file rate-limit riêng
      // (mặc định ~/.cache/vcut/rate-limit.json sẽ rò mốc giữa app desktop, bridge dev và test
      // — bài học đợt 65 §3b). Cùng userDataDir = cùng file nên restart app vẫn giữ trạng thái
      // limiter (tính năng S5); test dùng userDataDir là mkdtemp nên tự động cách ly.
      BRIDGE_RATE_PERSIST_PATH: path.join(this.userDataDir, 'rate-limit.json'),
    };
    if (wired.length > 0) {
      this._logManager(`nối venv Python cho bridge: ${wired.map((w) => `${w.variable}=${w.value}`).join(', ')}`);
    }
    if (modelsEnv.VCUT_MODELS_DIR) {
      this._logManager(`thư mục model AI: VCUT_MODELS_DIR=${modelsEnv.VCUT_MODELS_DIR}`);
    }
    this._logManager(`spawn bridge: ${this.nodeBin} ${this.bridgeEntry} (BRIDGE_PORT=${port})`);
    this._bridgeLogStream && this._bridgeLogStream.write(
      `\n===== bridge spawn ${new Date().toISOString()} port=${port} =====\n`,
    );

    const child = spawn(this.nodeBin, [this.bridgeEntry], {
      cwd: this.appRoot,
      env: bridgeEnv,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.bridgeChild = child;
    this.bridgePid = child.pid || null;
    this.bridgePort = port;
    this._stderrTail = [];
    // Đợt 51 H7: ghi pidfile NGAY khi spawn (trước khi chờ healthy) — nếu
    // app bị kill -9/crash giữa lúc chờ health thì bridge vẫn có pidfile để
    // lần chạy sau dọn; chờ healthy mới ghi thì bridge mồ côi sẽ "vô hình".
    // Spawn thử lỗi cổng (PortBusyError) thì lần thử sau ghi đè pidfile,
    // start() thất bại hẳn thì catch xoá pidfile — không để pidfile sai.
    this._writeBridgePidfile();

    child.stdout.on('data', (d) => this._logBridge(d));
    child.stderr.on('data', (d) => {
      this._logBridge(d);
      const lines = String(d).split('\n').filter(Boolean);
      this._stderrTail.push(...lines);
      if (this._stderrTail.length > 20) this._stderrTail.splice(0, this._stderrTail.length - 20);
    });

    // Chờ healthy hoặc thoát sớm. Poll TUẦN TỰ: await từng healthCheck rồi
    // mới ngủ 250ms (đợt 51 H7 sửa race của G2: trước đây mỗi healthCheck bị
    // race với tick 250ms — /api/health spawn `ffmpeg -version` nên dưới tải
    // nặng thường trả sau >250ms, response khỏe bị vứt, manager chờ đủ 30s
    // rồi báo "không healthy" dù bridge đang chạy tốt (gặp thật 2 lần trong
    // smoke test H7, health đo được 168–300ms/lần, ffmpeg spawn 604–1895ms).
    //
    // Đợt 52 I4 — timeout thích ứng theo tải (thay 30s cứng): lúc máy yên
    // vẫn 30s; tải cao thì nới tới 120s theo loadavg/cpu (xem
    // startTimeoutForLoad). Timeout từng health check cũng nới theo tải
    // (tối đa 8s) vì event loop bridge đói CPU. Nếu hết giờ mà health check
    // gần nhất ĐÃ chạm được bridge (bridge đang sống, chỉ chậm) thì gia hạn
    // thêm 30s MỘT lần duy nhất — tránh fail cứng oan trong khi bridge sắp
    // healthy; nếu chưa chạm được lần nào thì fail luôn, không gia hạn.
    const loadFactor = currentLoadFactor();
    const startTimeoutMs = startTimeoutForLoad(os.loadavg()[0], os.cpus().length || 1);
    const perHealthTimeoutMs = Math.min(8000, Math.round(HEALTH_TIMEOUT_MS * loadFactor));
    this._logManager(
      `chờ bridge healthy tối đa ${startTimeoutMs / 1000}s trên cổng ${port} ` +
      `(loadavg ${os.loadavg()[0].toFixed(2)} / ${os.cpus().length || 1} CPU, ` +
      `mỗi health check tối đa ${perHealthTimeoutMs}ms)`,
    );
    let deadline = Date.now() + startTimeoutMs;
    const spawnStartedAt = Date.now();
    let extended = false;
    let lastConnected = false;
    let exitedInfo = null;
    const onExit = (code, signal) => { exitedInfo = { code, signal }; };
    child.once('exit', onExit);
    try {
      for (;;) {
        // Đợt 52 I4 — stop() trong lúc chờ healthy: huỷ vòng chờ ngay, để
        // catch của start() kill bridge + xoá pidfile (không để bridge
        // mồ côi giữ runner sống sau khi test/app đã dừng).
        this._assertNotStopping();
        if (exitedInfo) {
          const tail = this._stderrTail.join(' | ');
          if (/EADDRINUSE/.test(tail)) throw new PortBusyError(port);
          throw new Error(
            `bridge thoát sớm (code ${exitedInfo.code}, signal ${exitedInfo.signal || 'không có'})` +
            (tail ? `: ${tail.slice(-500)}` : ''),
          );
        }
        // eslint-disable-next-line no-await-in-loop
        const h = await healthCheck(port, perHealthTimeoutMs);
        lastConnected = h.connected;
        if (h.ok) {
          this.health = h.data;
          this.bridgeStartedAt = Date.now();
          return;
        }
        if (Date.now() >= deadline) {
          if (!extended && lastConnected) {
            extended = true;
            deadline = Date.now() + START_PROGRESS_EXTENSION_MS;
            this._logManager(
              `bridge đã trả lời health nhưng chưa ok — gia hạn thêm ` +
              `${START_PROGRESS_EXTENSION_MS / 1000}s (1 lần duy nhất)`,
            );
            continue;
          }
          throw new Error(`bridge không healthy sau ${Math.round((Date.now() - spawnStartedAt) / 1000)}s trên cổng ${port} (timeout thích ứng ${startTimeoutMs / 1000}s${extended ? ' + gia hạn 30s' : ''})`);
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, HEALTH_POLL_MS));
      }
    } finally {
      child.removeListener('exit', onExit);
    }
  }

  _onBridgeExit(code, signal) {
    const wasChild = this.bridgeChild;
    this.bridgeChild = null;
    this.bridgePid = null;
    if (this._stopping) return; // stop() chủ động — không restart
    if (!wasChild) return;
    this._logManager(`bridge thoát ngoài ý muốn (code ${code}, signal ${signal || 'không có'})`);
    if (this.restarts < this.maxRestarts) {
      this.restarts += 1;
      this._setBridgeState('restarting', `bridge thoát (code ${code}), đang restart lần ${this.restarts}/${this.maxRestarts}`);
      const backoff = RESTART_BACKOFF_MS[Math.min(this.restarts - 1, RESTART_BACKOFF_MS.length - 1)];
      this._restartTimer = setTimeout(() => {
        this._restartTimer = null;
        this._restartBridge().catch((e) => {
          this._setBridgeState('failed', e.message);
        });
      }, backoff);
      if (this._restartTimer.unref) this._restartTimer.unref();
    } else {
      this._setBridgeState(
        'failed',
        `bridge chết sau ${this.maxRestarts} lần restart (code ${code}). ` +
        `Xem log tại ${path.join(this._logDir, 'bridge-*.log')} — thử mở lại app.`,
      );
      // Bridge chết hẳn, không restart nữa — pidfile trỏ vào pid đã chết,
      // xoá luôn để lần start sau không phải xử lý stale (vẫn an toàn nếu
      // còn sót: cleanupStaleBridge cũng xử lý trường hợp này).
      try { removeBridgePidfile(this.userDataDir); } catch { /* bỏ qua */ }
    }
  }

  async _restartBridge() {
    const port = this.bridgePort;
    try {
      if (port && !(await isPortFree(port))) {
        const next = await findFreePort(this.preferredPort);
        this.bridgePort = next;
      }
      await this._spawnBridgeOnPort(this.bridgePort);
      this._writeBridgePidfile();
      this._wireExitHandler();
      this._setBridgeState('running');
      this._logManager(`bridge restart thành công trên cổng ${this.bridgePort}`);
    } catch (e) {
      if (e instanceof PortBusyError) {
        this.bridgePort = await findFreePort(this.preferredPort);
        await this._spawnBridgeOnPort(this.bridgePort);
        this._writeBridgePidfile();
        this._wireExitHandler();
        this._setBridgeState('running');
        return;
      }
      // Dọn bridge con spawn dở (nếu còn) để không thành mồ côi.
      if (this.bridgeChild) {
        try { killProcessGroup(this.bridgeChild.pid, 'SIGKILL'); } catch { /* bỏ qua */ }
        this.bridgeChild = null;
        this.bridgePid = null;
        this.bridgePort = null;
      }
      throw e;
    }
  }

  _wireExitHandler() {
    if (!this.bridgeChild) return;
    this.bridgeChild.once('exit', (code, signal) => this._onBridgeExit(code, signal));
  }

  // -- pidfile (đợt 51 H7) ----------------------------------------------------
  // Ghi pidfile mỗi lần bridge chạy thành công (spawn đầu + restart), để lần
  // chạy app sau (sau kill -9/crash) nhận ra + dọn bridge mồ côi. Ghi lỗi thì
  // chỉ log — pidfile là lưới an toàn, không chặn app.
  _writeBridgePidfile() {
    if (!this.bridgePid || !this.bridgePort) return;
    const ok = writeBridgePidfile(this.userDataDir, {
      appPid: process.pid,
      bridgeEntry: this.bridgeEntry,
      pid: this.bridgePid,
      port: this.bridgePort,
      startedAt: this.bridgeStartedAt ? new Date(this.bridgeStartedAt).toISOString() : new Date().toISOString(),
    }, (msg) => this._logManager(msg));
    if (ok) this._logManager(`pidfile: bridge pid ${this.bridgePid} cổng ${this.bridgePort}`);
  }

  /**
   * Dọn bridge mồ côi từ lần chạy trước (nếu có) theo pidfile trong
   * userData. Gọi tự động ở đầu start(); cũng expose public để
   * serviceLifecycle/scripts gọi trước khi spawn Electron (vì Electron bind
   * CDP trước khi main.ts chạy — dọn trong app thì cổng CDP chỉ trống cho
   * LẦN CHẠY SAU). Xem bridgePidfile.js về quy tắc fail-closed.
   * @returns {Promise<import('./bridgePidfile').StaleBridgeCleanupResult>}
   */
  async cleanupStaleBridge() {
    const result = await cleanupStaleBridgeFile(this.userDataDir, {
      cdpPort: this.cdpPort,
      log: (msg) => this._logManager(msg),
    });
    if (result.action !== 'none') {
      this._logManager(`pidfile cleanup: ${result.action} — ${result.reason}`);
    }
    return result;
  }

  /**
   * Dọn renderer/GPU/utility/zygote con mồ côi của Electron VCut (đợt 52
   * I4) — con của lần chạy trước (kill -9/crash) kế thừa socket CDP nên
   * lần chạy sau fail bind. Gọi tự động ở đầu start(), sau
   * cleanupStaleBridge. GIỚI HẠN: Electron bind CDP lúc khởi động, TRƯỚC
   * khi main.ts chạy — nên lần chạy này vẫn mất CDP, cổng chỉ trống cho
   * LẦN CHẠY SAU; harness dọn TRƯỚC khi spawn thì lần chạy đó có CDP.
   * Fail-closed: process lạ không bao giờ bị kill (xem
   * electronOrphanCleanup.js).
   * @returns {Promise<import('./electronOrphanCleanup').StaleElectronCleanupResult>}
   */
  async cleanupStaleElectronChildren() {
    const result = await cleanupStaleElectronChildrenFile(this.userDataDir, {
      cdpPort: this.cdpPort,
      log: (msg) => this._logManager(msg),
    });
    if (result.action !== 'none') {
      this._logManager(`electron pidfile cleanup: ${result.action} — ${result.reason}`);
    }
    return result;
  }

  // -- API chính ---------------------------------------------------------------

  /**
   * Khởi động toàn bộ service local: kiểm tra node/ffmpeg, probe AI,
   * spawn bridge (tự đổi cổng nếu 8787 bận), chờ healthy.
   * @returns {Promise<ServiceStatusSnapshot>}
   */
  async start() {
    if (this._startPromise) return this._startPromise;
    if (this.bridgeState === 'running') return this.getStatus();
    // Đợt 52 I4 — reset cờ dừng NGAY tại đây (đồng bộ), không để trong
    // executor: nếu stop() gọi ngay sau start() (trước khi executor chạy)
    // thì cờ _stopping=true của stop() sẽ không bị executor ghi đè lại
    // thành false — start() sau đó phải huỷ, không được spawn bridge.
    this._stopping = false;
    this._startPromise = (async () => {
      this._openLogStreams();
      this._setBridgeState('starting');
      try {
        // Đợt 51 H7: dọn bridge mồ côi từ lần chạy trước (kill -9/crash) TRƯỚC
        // khi spawn bridge mới — nếu không, cổng cũ vẫn bận + socket CDP
        // 9222 vẫn bị mồ côi giữ. Fail-closed: process lạ không bao giờ bị kill.
        await this.cleanupStaleBridge();
        this._assertNotStopping();
        // Đợt 52 I4: dọn renderer/GPU con mồ côi của Electron cũ (kế thừa
        // socket CDP) — bridge đã dọn ở trên, con Electron dọn ở đây; cả
        // hai đều fail-closed. Lần chạy này vẫn mất CDP (bind trước khi
        // dọn), cổng trống cho LẦN CHẠY SAU.
        await this.cleanupStaleElectronChildren();
        this._assertNotStopping();
        if (!fs.existsSync(this.bridgeEntry)) {
          throw new Error(`Không tìm thấy bridge (${this.bridgeEntry}) — appRoot sai?`);
        }
        const node = await this._checkNodeBin();
        if (!node.ok) throw new Error(node.error);
        this._logManager(`node: ${this.nodeBin} ${node.version || ''}`);
        this.ffmpeg = await this._checkFfmpeg();
        this._logManager(`ffmpeg: ${this.ffmpeg.available ? this.ffmpeg.version || 'có' : 'KHÔNG tìm thấy trong PATH'}`);
        // Probe AI song song với việc tìm cổng — không chặn nhau.
        // ROUND52-I5: probe dùng cùng env VCUT_MODELS_DIR như bridge để
        // kiểm tra model đúng thư mục app đóng gói sẽ dùng.
        const probeEnv = { ...process.env, ...this._modelsEnv() };
        const probePromise = probeAllPythonServices(this.appRoot, probeEnv, { deep: true });
        let port = await findFreePort(this.preferredPort);
        this._assertNotStopping();
        let lastErr = null;
        for (let attempt = 0; attempt < PORT_SCAN_COUNT; attempt += 1) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await this._spawnBridgeOnPort(port);
            lastErr = null;
            break;
          } catch (e) {
            if (e instanceof PortBusyError) {
              this._logManager(`cổng ${port} bận — thử cổng tiếp theo`);
              lastErr = e;
              port += 1;
              continue;
            }
            throw e;
          }
        }
        if (lastErr) throw lastErr;
        this.bridgePort = port;
        this._writeBridgePidfile();
        this._wireExitHandler();
        this.aiServices = await probePromise;
        // Ghi đè flag nông của bridge bằng kết quả probe sâu (trung thực hơn).
        if (this.health) {
          for (const svc of PYTHON_SERVICES) {
            const mine = this.aiServices[svc.id];
            if (mine) mine.bridgeReports = this.health[svc.id];
          }
        }
        this._setBridgeState('running');
        this._logManager(`bridge chạy tại http://127.0.0.1:${port}`);
        return this.getStatus();
      } catch (e) {
        const msg = (e && e.message) || String(e);
        if (this.bridgeChild) {
          try { killProcessGroup(this.bridgeChild.pid, 'SIGKILL'); } catch { /* bỏ qua */ }
          this.bridgeChild = null;
          this.bridgePid = null;
        }
        // Spawn thất bại thì không để pidfile trỏ vào bridge đã chết.
        try { removeBridgePidfile(this.userDataDir); } catch { /* bỏ qua */ }
        this.bridgePort = null; // _spawnBridgeOnPort đã set cổng lúc spawn
        this._setBridgeState('failed', msg);
        this._closeLogStreams();
        throw new Error(msg);
      } finally {
        this._startPromise = null;
      }
    })();
    return this._startPromise;
  }

  /**
   * ROUND52-I5 — Probe lại AI (vd: sau khi user tải xong model trong app)
   * mà không restart bridge. Cập nhật this.aiServices + emit status để UI
   * thấy service vừa bật. Bridge không cần restart vì script Python đọc
   * model theo job (mỗi job spawn mới, đọc VCUT_MODELS_DIR lúc đó).
   * @returns {Promise<ServiceStatusSnapshot>}
   */
  async reprobeAi() {
    const probeEnv = { ...process.env, ...this._modelsEnv() };
    this.aiServices = await probeAllPythonServices(this.appRoot, probeEnv, { deep: true });
    if (this.health) {
      for (const svc of PYTHON_SERVICES) {
        const mine = this.aiServices[svc.id];
        if (mine) mine.bridgeReports = this.health[svc.id];
      }
    }
    this._emitStatus();
    return this.getStatus();
  }

  /**
   * Tắt sạch: ngừng restart, SIGTERM cả process group của bridge (kéo theo
   * render worker / python job đang chạy), chờ rồi SIGKILL nếu còn sống,
   * đóng log. Đảm bảo không để tiến trình mồ côi.
   * @returns {Promise<ServiceStatusSnapshot>}
   */
  async stop() {
    this._stopping = true;
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }
    // Đợt 52 I4 — start() đang bay dở (dọn stale / dò cổng / chờ healthy):
    // chờ nó huỷ xong rồi mới kill. Không chờ thì stop() thấy bridgeChild
    // còn null sẽ return ngay, rồi start() tiếp tục spawn bridge mồ côi
    // (gặp thật ở lần chạy cuối đợt 52). Chờ tối đa 30s — vòng chờ healthy
    // kiểm tra _stopping mỗi vòng (tối đa 1 health check ~8s), còn dọn stale
    // thì không kiểm tra cờ nên có thể chậm hơn; hết 30s thì cứ kill những
    // gì đã spawn được (start() huỷ muộn vẫn tự kill bridge trong catch).
    if (this._startPromise) {
      try {
        await Promise.race([
          this._startPromise,
          new Promise((r) => setTimeout(r, 30000)),
        ]);
      } catch { /* start() huỷ là đúng — tiếp tục tắt */ }
    }
    const child = this.bridgeChild;
    if (!child || !child.pid) {
      this.bridgeChild = null;
      this.bridgePid = null;
      try { removeBridgePidfile(this.userDataDir); } catch { /* bỏ qua */ }
      this._setBridgeState('stopped');
      this._closeLogStreams();
      return this.getStatus();
    }
    const pid = child.pid;
    this._logManager(`dừng bridge (pid ${pid}, SIGTERM cả process group)`);
    killProcessGroup(pid, 'SIGTERM');
    const exited = await waitFor(() => !isPidAlive(pid), STOP_GRACE_MS);
    if (!exited) {
      this._logManager(`bridge pid ${pid} chưa chết sau ${STOP_GRACE_MS}ms — SIGKILL`);
      killProcessGroup(pid, 'SIGKILL');
      await waitFor(() => !isPidAlive(pid), STOP_KILL_WAIT_MS);
    }
    // Xác minh lần cuối: group còn ai không (kill -0 vào group leader âm).
    let groupAlive = false;
    try {
      if (process.platform !== 'win32') process.kill(-pid, 0);
      groupAlive = true;
    } catch { groupAlive = false; }
    if (groupAlive) {
      this._logManager(`CẢNH BÁO: process group ${pid} vẫn còn sau SIGKILL`);
    }
    this.bridgeChild = null;
    this.bridgePid = null;
    // Thoát sạch: bridge đã chết nên pidfile không còn ý nghĩa — xoá để lần
    // chạy sau không phải xử lý stale.
    try { removeBridgePidfile(this.userDataDir); } catch { /* bỏ qua */ }
    this._setBridgeState('stopped');
    this._closeLogStreams();
    return this.getStatus();
  }
}

/**
 * @param {ServiceManagerOptions} opts
 * @returns {ServiceManager}
 */
function createServiceManager(opts) {
  return new ServiceManager(opts);
}

module.exports = {
  createServiceManager,
  ServiceManager,
  killProcessGroup,
  isPidAlive,
  isPortFree,
  findFreePort,
  healthCheck,
  PortBusyError,
  // Đợt 52 I4 — timeout khởi động thích ứng theo tải (hàm thuần, test được).
  startTimeoutForLoad,
  START_TIMEOUT_BASE_MS,
  START_TIMEOUT_MAX_MS,
  START_PROGRESS_EXTENSION_MS,
  // Đợt 52 I4 — pidfile Electron + dọn renderer/GPU con mồ côi giữ socket
  // CDP (re-export để scripts/harness dùng trực tiếp).
  cleanupStaleElectronChildren: cleanupStaleElectronChildrenFile,
  writeElectronPidfile,
  readElectronPidfile,
  removeElectronPidfile,
  // Đợt 51 H7 — pidfile + dọn bridge mồ côi (re-export để scripts/harness
  // dùng trực tiếp mà không cần require thêm module).
  cleanupStaleBridge: cleanupStaleBridgeFile,
  writeBridgePidfile,
  readBridgePidfile,
  removeBridgePidfile,
};

/**
 * @typedef {Object} ServiceManagerOptions
 * @property {string} appRoot - thư mục gốc repo (chứa server/bridge, server/render, ...)
 * @property {string} userDataDir - app.getPath('userData') của Electron (log + bridge-jobs nằm đây)
 * @property {string} [nodeBin] - binary node để spawn bridge (mặc định env VCUT_NODE hoặc "node" trong PATH).
 *   LƯU Ý: KHÔNG dùng process.execPath của Electron — đó là binary Electron, không phải node.
 * @property {number} [preferredPort=8787] - cổng bridge ưu tiên; bận thì tự dò cổng trống
 * @property {number} [maxRestarts=3] - số lần restart tối đa sau crash
 * @property {number} [cdpPort=9222] - cổng CDP của Electron (đợt 51 H7) để
 *   cleanupStaleBridge kiểm tra socket CDP có được giải phóng sau khi kill
 *   bridge mồ côi không; serviceLifecycle tự lấy từ argv
 *   --remote-debugging-port.
 * @property {(snap: ServiceStatusSnapshot) => void} [onStatus] - callback mỗi khi trạng thái đổi
 *   (main process forward sang renderer: win.webContents.send('vcut:services-status', snap))
 *
 * @typedef {Object} ServiceStatusSnapshot
 * @property {{ state: string, port: number|null, url: string|null, pid: number|null, restarts: number, uptimeSec: number, lastError: string|null }} bridge
 * @property {{ mode: 'on-demand', available: boolean, script: string, reason?: string }} render
 * @property {Record<string, import('./pythonServices').PythonServiceStatus>} ai
 * @property {{ available: boolean, version: string|null }} ffmpeg
 * @property {string} updatedAt
 */

// -- Ghi chú nối vào Electron main (G1) ---------------------------------------
// Trong main process (CommonJS):
//   const { createServiceManager } = require('./src/services/serviceManager');
//   const manager = createServiceManager({
//     appRoot: path.join(__dirname, '..', '..', '..'), // dev: repo root; packaged: resources/app
//     userDataDir: app.getPath('userData'),
//     onStatus: (snap) => { for (const w of BrowserWindow.getAllWindows()) w.webContents.send('vcut:services-status', snap); },
//   });
//   app.whenReady().then(async () => {
//     try { await manager.start(); }
//     catch (e) { /* hiện dialog lỗi rõ ràng, vẫn mở window để user thấy */ }
//     createWindow();
//   });
//   app.on('before-quit', async (e) => { e.preventDefault(); await manager.stop(); app.quit(); });
//   app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
// Trong preload (contextIsolation, G1/G3):
//   contextBridge.exposeInMainWorld('vcut', {
//     services: {
//       getStatus: () => ipcRenderer.invoke('vcut:services-get-status'),
//       onStatus: (cb) => { const h = (_e, snap) => cb(snap); ipcRenderer.on('vcut:services-status', h); return () => ipcRenderer.removeListener('vcut:services-status', h); },
//     },
//   });
// Renderer KHÔNG poll — chỉ nhận event 'vcut:services-status' khi trạng thái đổi.
// Bridge URL thật (khi 8787 bận và đổi cổng) lấy từ snapshot.bridge.url —
// web UI phải dùng URL này thay vì hardcode 8787 (xem LIMITS, mục "nợ mở").
