'use strict';
/**
 * bridgePidfile.js — Pidfile + dọn bridge mồ côi lúc app khởi động (đợt 51, H7).
 *
 * BỐI CẢNH (nợ mở Phase 10, docs/PHASE10_LIMITS.md §5.2 — gặp thật lúc gộp):
 * bridge spawn `detached` (process group riêng) nên `kill -9` / crash
 * Electron KHÔNG giết được bridge. Bridge mồ côi còn giữ cổng (8787...) và
 * KẾ THỪA socket CDP 9222 của Electron, làm lần chạy sau fail
 * "bind() failed: Address already in use". Thoát bình thường thì sạch
 * (before-quit → stopLocalServices kill cả group); SIGTERM không làm
 * Electron thoát nên harness phải đóng cửa sổ qua CDP.
 *
 * CƠ CHẾ (lưới an toàn ở tầng khởi động — kill -9 thì không handler nào
 * chạy được, nên dọn dẹp PHẢI xảy ra ở lần chạy sau, không phải lúc chết):
 *  1. Manager ghi pidfile `bridge.pid.json` trong userData mỗi lần spawn
 *     bridge thành công (pid + cổng + appPid + bridgeEntry + thời gian),
 *     ghi nguyên tử (tmp + rename); xoá pidfile khi stop() sạch.
 *  2. Mỗi lần start(), manager gọi cleanupStaleBridge() TRƯỚC khi spawn:
 *     - Không có pidfile → không làm gì.
 *     - Pidfile hỏng / pid không còn sống → xoá pidfile, spawn bình thường.
 *     - Pid còn sống NHƯNG cmdline KHÔNG phải bridge VCut → KHÔNG kill
 *       (fail-closed: có thể là process lạ / pid tái chế), chỉ xoá pidfile
 *       sai + ghi log cảnh báo; manager sẽ tự dò cổng trống khác.
 *     - Pid còn sống VÀ cmdline đúng là bridge VCut → kill cả cây
 *       (SIGTERM → chờ → SIGKILL), chờ cổng bridge + cổng CDP được giải
 *       phóng, xoá pidfile, rồi spawn bridge mới.
 *
 * NHẬN DIỆN "ĐÚNG BRIDGE VCUT" (không kill bừa):
 *  - POSIX: đọc /proc/<pid>/cmdline — phải chứa `server/bridge/src/index.js`.
 *    Một process lạ không thể vô tình có chuỗi này trong argv.
 *  - Health check GET /api/health trên cổng ghi trong pidfile chỉ là bằng
 *    chứng phụ (ghi vào kết quả): cmdline khớp thì kill kể cả khi health
 *    fail (bridge có thể đang kẹt/khởi động dở); cmdline KHÔNG khớp thì
 *    KHÔNG kill kể cả khi health trả ok (có thể là server khác).
 *  - Kill theo group CHỈ khi pid là group leader (pgrp == pid, đọc từ
 *    /proc/<pid>/stat): bridge do manager spawn luôn detached nên pgrp
 *    == pid. Nếu pgrp != pid (bridge do tay/harness spawn, chung group
 *    với process cha) thì chỉ kill đúng pid đó — kill cả group có thể
 *    giết nhầm process cha (vd: harness đang chạy test).
 *  - Windows: đọc cmdline qua PowerShell Get-CimInstance; không đọc được
 *    cmdline thì KHÔNG kill (fail-closed). Phase 10 chỉ hỗ trợ Linux nên
 *    nhánh Windows là best-effort, chưa test trên máy Windows thật.
 *
 * GIỚI HẠN (trung thực):
 *  - Kill -9 / crash: handler lúc chết không chạy được — pidfile lúc khởi
 *    động mới là lưới an toàn. Bridge mồ côi vẫn tồn tại cho tới lần chạy
 *    app sau (và chỉ được dọn khi lần chạy sau đó start() services).
 *  - Cổng CDP (mặc định 9222, hoặc --remote-debugging-port=... trong argv
 *    của Electron): socket chỉ được giải phóng khi process NÀO ĐÓ đang giữ
 *    FD đó chết. Sau khi kill bridge mồ côi, module chờ tối đa ~2s để cổng
 *    CDP trống và báo `cdpPortFreed`; nếu vẫn bận (process khác — không
 *    phải bridge VCut — cũng kế thừa FD) thì báo rõ, không cố kill thêm.
 *    Lưu ý: lần chạy Electron HIỆN TẠI bind CDP lúc khởi động, TRƯỚC khi
 *    main.ts chạy — nên nếu 9222 đang bị mồ côi giữ, lần chạy này vẫn fail
 *    bind CDP (app vẫn mở bình thường, chỉ mất CDP); dọn pidfile giải
 *    phóng cổng cho LẦN CHẠY SAU. Harness (verify-desktop.mjs) gọi
 *    cleanupStaleBridge TRƯỚC khi spawn Electron nên không gặp vấn đề này.
 *  - Pidfile là best-effort: ghi/xoá lỗi thì chỉ log cảnh báo, không chặn
 *    app khởi động hay tắt.
 *  - Hai app VCut chạy song song cùng userDataDir không được hỗ trợ
 *    (single-instance lock đã chặn ở tầng Electron; test dùng userData
 *    riêng thì không xung đột).
 *
 * Module này KHÔNG import electron — chạy được bằng Node thuần để test
 * độc lập (xem bridgePidfile.test.cjs). serviceManager.js require module
 * này; serviceLifecycle.ts expose lại cho main/scripts qua adapter.
 */

const { execFile, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const BRIDGE_PIDFILE_NAME = 'bridge.pid.json';
/** Đoạn đường dẫn phân biệt bridge VCut với mọi process node khác. */
const BRIDGE_ENTRY_SUFFIX = 'server/bridge/src/index.js';
const DEFAULT_CDP_PORT = 9222;
const HEALTH_TIMEOUT_MS = 2000;
const KILL_GRACE_MS = 5000; // chờ SIGTERM trước khi SIGKILL
const KILL_WAIT_MS = 2000; // chờ sau SIGKILL
const PORT_FREE_WAIT_MS = 2000; // chờ cổng được giải phóng sau khi kill
const PORT_FREE_POLL_MS = 100;

function pidfilePath(userDataDir) {
  return path.join(userDataDir, BRIDGE_PIDFILE_NAME);
}

/**
 * Ghi pidfile nguyên tử (tmp + rename trong cùng thư mục). Lỗi ghi chỉ log
 * qua callback (mặc định bỏ qua) — pidfile là lưới an toàn, không chặn app.
 * @param {string} userDataDir
 * @param {{ pid: number, port: number, appPid?: number, bridgeEntry?: string, startedAt?: string }} record
 * @param {(msg: string) => void} [log]
 * @returns {boolean} true nếu ghi được
 */
function writeBridgePidfile(userDataDir, record, log) {
  const file = pidfilePath(userDataDir);
  const payload = {
    appPid: record.appPid ?? process.pid,
    bridgeEntry: record.bridgeEntry ?? null,
    pid: record.pid,
    port: record.port,
    startedAt: record.startedAt ?? new Date().toISOString(),
    version: 1,
  };
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    fs.renameSync(tmp, file);
    return true;
  } catch (e) {
    if (typeof log === 'function') log(`pidfile: không ghi được ${file}: ${e.message}`);
    return false;
  }
}

/**
 * Đọc pidfile. Trả null khi không có file hoặc JSON hỏng (caller phân biệt
 * bằng fs.existsSync nếu cần — cleanup coi file hỏng là `invalid-removed`).
 * @param {string} userDataDir
 * @returns {{ appPid?: number, bridgeEntry?: string|null, pid: number, port: number, startedAt?: string, version?: number } | null}
 */
function readBridgePidfile(userDataDir) {
  try {
    const raw = fs.readFileSync(pidfilePath(userDataDir), 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data.pid !== 'number' || typeof data.port !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Xoá pidfile (best-effort). Trả true nếu file đã tồn tại và đã xoá.
 * @param {string} userDataDir
 * @returns {boolean}
 */
function removeBridgePidfile(userDataDir) {
  try {
    if (!fs.existsSync(pidfilePath(userDataDir))) return false;
    fs.unlinkSync(pidfilePath(userDataDir));
    return true;
  } catch {
    return false;
  }
}

/** Kiểm tra một pid còn sống không (kill 0). */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Kiểm tra cổng có trống không (thử listen trên 127.0.0.1). */
function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

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

/**
 * Đọc cmdline của một process.
 * POSIX: /proc/<pid>/cmdline (NUL-separated). Windows: PowerShell
 * Get-CimInstance Win32_Process. Trả null khi không đọc được (fail-closed:
 * caller KHÔNG được kill process không xác minh được).
 * @param {number} pid
 * @returns {string[] | null}
 */
function getProcessCmdline(pid) {
  if (process.platform !== 'win32') {
    try {
      const raw = fs.readFileSync(`/proc/${pid}/cmdline`);
      return raw.toString('utf8').split('\0').filter(Boolean);
    } catch {
      return null;
    }
  }
  try {
    const r = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" | Select-Object -ExpandProperty CommandLine`],
      { encoding: 'utf8', timeout: 10000 },
    );
    const line = String(r.stdout || '').trim();
    return line ? [line] : null;
  } catch {
    return null;
  }
}

/**
 * Process này có phải bridge VCut không? Chỉ tin cmdline chứa đường dẫn
 * entry của bridge — health check KHÔNG đủ để kết luận (server lạ cũng có
 * thể trả JSON giống vậy), và pid tái chế cũng không thể vô tình khớp.
 * @param {number} pid
 * @param {string} [bridgeEntry] - đường dẫn tuyệt đối kỳ vọng (chỉ để log rõ hơn)
 * @returns {{ match: boolean, cmdline: string | null, reason: string }}
 */
function isVcutBridgeProcess(pid, bridgeEntry) {
  const cmdline = getProcessCmdline(pid);
  if (!cmdline) {
    return { cmdline: null, match: false, reason: 'không đọc được cmdline (fail-closed: không kill)' };
  }
  const joined = cmdline.join(' ');
  const normalized = joined.split(path.sep).join('/');
  if (normalized.includes(BRIDGE_ENTRY_SUFFIX)) {
    return {
      cmdline: joined,
      match: true,
      reason: bridgeEntry && normalized.includes(bridgeEntry.split(path.sep).join('/'))
        ? `cmdline khớp bridgeEntry ${bridgeEntry}`
        : `cmdline chứa ${BRIDGE_ENTRY_SUFFIX}`,
    };
  }
  return { cmdline: joined, match: false, reason: `cmdline không chứa ${BRIDGE_ENTRY_SUFFIX}` };
}

/**
 * Pid này có phải process group leader không (pgrp == pid)?
 * Chỉ leader mới được kill cả group (-pid); non-leader mà kill -pid sẽ giết
 * nhầm cả group của process cha. Linux: /proc/<pid>/stat field 5 (pgrp).
 * Fallback `ps -o pgid=`; Windows: không có khái niệm này → true (taskkill
 * /T đã chỉ giết cây của pid đó, giống serviceManager.killProcessGroup).
 * Không xác định được → false (fail-closed: chỉ kill đúng pid).
 * @param {number} pid
 * @returns {boolean}
 */
function isProcessGroupLeader(pid) {
  if (process.platform === 'win32') return true;
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    // stat: pid (comm) state ppid pgrp ... — comm có thể chứa khoảng trắng/
    // ngoặc nên cắt từ dấu ')' cuối cùng.
    const afterComm = stat.slice(stat.lastIndexOf(')') + 2);
    const fields = afterComm.split(' ');
    // fields[0]=state, [1]=ppid, [2]=pgrp
    const pgrp = Number(fields[2]);
    if (Number.isInteger(pgrp)) return pgrp === pid;
  } catch { /* rơi xuống ps */ }
  try {
    const r = spawnSync('ps', ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8', timeout: 5000 });
    const pgrp = Number(String(r.stdout || '').trim());
    if (Number.isInteger(pgrp)) return pgrp === pid;
  } catch { /* bỏ qua */ }
  return false;
}

/**
 * Kill bridge theo đúng mức an toàn: leader → cả group; non-leader → chỉ
 * đúng pid. SIGTERM → chờ → SIGKILL. Trả true nếu pid đã chết sau đó.
 * @param {number} pid
 * @returns {Promise<boolean>}
 */
async function killBridgeTree(pid) {
  const leader = isProcessGroupLeader(pid);
  const send = (signal) => {
    try {
      if (process.platform === 'win32') {
        const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
        return r.status === 0;
      }
      if (leader) process.kill(-pid, signal);
      else process.kill(pid, signal);
      return true;
    } catch {
      return false;
    }
  };
  send('SIGTERM');
  if (await waitFor(() => !isPidAlive(pid), KILL_GRACE_MS)) return true;
  send('SIGKILL');
  return waitFor(() => !isPidAlive(pid), KILL_WAIT_MS);
}

/** GET /api/health của bridge (bằng chứng phụ, timeout 2s). */
function healthCheck(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port, path: '/api/health', timeout: HEALTH_TIMEOUT_MS },
      (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ ok: res.statusCode === 200 && data && data.ok === true, data });
          } catch {
            resolve({ ok: false, error: `health không phải JSON (HTTP ${res.statusCode})` });
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('health timeout')));
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
  });
}

/**
 * Dọn bridge mồ côi ghi trong pidfile (nếu có). Xem ghi chú đầu file về
 * quy tắc nhận diện + fail-closed. KHÔNG BAO GIỜ kill process lạ.
 *
 * @param {string} userDataDir - thư mục chứa bridge.pid.json (app.getPath('userData'))
 * @param {{ cdpPort?: number, log?: (msg: string) => void }} [opts]
 *   - cdpPort: cổng CDP cần kiểm tra có được giải phóng không (mặc định
 *     9222; serviceLifecycle tự lấy từ argv --remote-debugging-port).
 * @returns {Promise<{ action: string, pid?: number, port?: number, reason: string, cmdline?: string|null, healthOk?: boolean, killed?: boolean, bridgePortFreed?: boolean, cdpPortFreed?: boolean, cdpPort?: number }>}
 */
async function cleanupStaleBridge(userDataDir, opts = {}) {
  const log = typeof opts.log === 'function' ? opts.log : () => {};
  const cdpPort = opts.cdpPort ?? DEFAULT_CDP_PORT;
  const file = pidfilePath(userDataDir);
  if (!fs.existsSync(file)) {
    return { action: 'none', cdpPort, reason: 'không có pidfile' };
  }
  const record = readBridgePidfile(userDataDir);
  if (!record) {
    removeBridgePidfile(userDataDir);
    log('pidfile: file hỏng/không đọc được — đã xoá, không kill gì cả');
    return { action: 'invalid-removed', cdpPort, reason: 'pidfile hỏng (JSON sai hoặc thiếu pid/port) — đã xoá' };
  }
  const { pid, port } = record;
  if (!isPidAlive(pid)) {
    removeBridgePidfile(userDataDir);
    log(`pidfile: bridge cũ pid ${pid} đã chết — đã xoá pidfile`);
    return { action: 'stale-pid-dead', cdpPort, pid, port, reason: `pid ${pid} không còn sống — đã xoá pidfile` };
  }
  // Pid còn sống — BẮT BUỘC xác minh cmdline trước khi kill.
  const ident = isVcutBridgeProcess(pid, record.bridgeEntry);
  if (!ident.match) {
    removeBridgePidfile(userDataDir);
    log(
      `pidfile: CẢNH BÁO pid ${pid} còn sống nhưng KHÔNG phải bridge VCut (${ident.reason}) — KHÔNG kill, chỉ xoá pidfile sai`,
    );
    return {
      action: 'alive-not-vcut',
      cdpPort,
      cmdline: ident.cmdline,
      killed: false,
      pid,
      port,
      reason: `pid ${pid} còn sống nhưng không phải bridge VCut (${ident.reason}) — KHÔNG kill, đã xoá pidfile sai`,
    };
  }
  // Đúng bridge VCut → mồ côi (app trước đã chết mà bridge còn sống).
  const health = await healthCheck(port).catch(() => ({ ok: false, error: 'health check lỗi' }));
  log(`pidfile: phát hiện bridge mồ côi pid ${pid} cổng ${port} (${ident.reason}; health ok=${health.ok}) — đang kill`);
  const dead = await killBridgeTree(pid);
  if (!dead) {
    log(`pidfile: KHÔNG kill được bridge mồ côi pid ${pid} — giữ pidfile để lần sau thử lại`);
    return {
      action: 'kill-failed',
      cdpPort,
      cmdline: ident.cmdline,
      healthOk: health.ok,
      killed: false,
      pid,
      port,
      reason: `kill bridge mồ côi pid ${pid} thất bại (SIGTERM+SIGKILL không ăn) — giữ pidfile`,
    };
  }
  removeBridgePidfile(userDataDir);
  const bridgePortFreed = await waitFor(() => isPortFree(port), PORT_FREE_WAIT_MS, PORT_FREE_POLL_MS);
  const cdpPortFreed = await waitFor(() => isPortFree(cdpPort), PORT_FREE_WAIT_MS, PORT_FREE_POLL_MS);
  log(
    `pidfile: đã dọn bridge mồ côi pid ${pid} (cổng bridge ${port} ${bridgePortFreed ? 'đã trống' : 'VẪN BẬN'}, CDP ${cdpPort} ${cdpPortFreed ? 'đã trống' : 'VẪN BẬN'})`,
  );
  return {
    action: 'orphan-killed',
    bridgePortFreed,
    cdpPort,
    cdpPortFreed,
    cmdline: ident.cmdline,
    healthOk: health.ok,
    killed: true,
    pid,
    port,
    reason: `đã kill bridge mồ côi pid ${pid} (cmdline VCut, health ok=${health.ok})`,
  };
}

module.exports = {
  BRIDGE_ENTRY_SUFFIX,
  BRIDGE_PIDFILE_NAME,
  DEFAULT_CDP_PORT,
  cleanupStaleBridge,
  getProcessCmdline,
  healthCheck,
  isPidAlive,
  isPortFree,
  isProcessGroupLeader,
  isVcutBridgeProcess,
  killBridgeTree,
  pidfilePath,
  readBridgePidfile,
  removeBridgePidfile,
  writeBridgePidfile,
};

/**
 * @typedef {Object} BridgePidfileRecord
 * @property {number} pid - pid của bridge
 * @property {number} port - cổng bridge đang nghe
 * @property {number} [appPid] - pid của Electron main đã spawn bridge
 * @property {string|null} [bridgeEntry] - đường dẫn tuyệt đối server/bridge/src/index.js
 * @property {string} [startedAt] - ISO timestamp lúc spawn
 * @property {number} [version] - 1
 *
 * @typedef {Object} StaleBridgeCleanupResult
 * @property {'none'|'invalid-removed'|'stale-pid-dead'|'alive-not-vcut'|'orphan-killed'|'kill-failed'} action
 * @property {number} [pid]
 * @property {number} [port]
 * @property {string} reason
 * @property {string|null} [cmdline]
 * @property {boolean} [healthOk]
 * @property {boolean} [killed]
 * @property {boolean} [bridgePortFreed]
 * @property {boolean} [cdpPortFreed]
 * @property {number} [cdpPort]
 */
