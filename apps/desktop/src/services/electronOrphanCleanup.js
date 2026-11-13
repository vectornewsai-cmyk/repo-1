'use strict';
/**
 * electronOrphanCleanup.js — Pidfile Electron + dọn renderer/GPU con mồ côi
 * giữ socket CDP (đợt 52, I4 — đóng nợ đợt 51 §4.8 / H7 §5.3).
 *
 * BỐI CẢNH (đo thật 06–07/11/2026, xem docs/PHASE9_ROUND51_H7_*_LIMITS.md):
 * sau `kill -9` Electron, ngoài bridge mồ côi (đã dọn bởi bridgePidfile.js)
 * còn 1–2 pid khác giữ socket CDP (vd: lượt smoke H7 pids=[2482,2481,2469]
 * và [6196,5754]) — nhiều khả năng là con của Electron cũ kế thừa FD
 * listen của main. Kiểm chứng trực tiếp 07/11: socket CDP 9231 của một
 * AppImage đang chạy được giữ bởi 2 process — Electron main (fd 54) VÀ
 * bridge (fd 54, kế thừa lúc spawn). Renderer có `--remote-debugging-port`
 * trong cmdline nhưng KHÔNG giữ fd listen; zygote/GPU/utility fork từ
 * main sau khi socket đã mở nên cũng có thể kế thừa FD.
 *
 * CƠ CHẾ (lưới an toàn ở tầng khởi động — giống bridgePidfile, vì kill -9
 * thì không handler nào chạy được):
 *  1. Main process ghi pidfile `electron.pid.json` trong userData lúc khởi
 *     động (ghi nguyên tử tmp + rename): {appPid, pgid, execPath, appPath,
 *     userDataDir, cdpPort, startedAt}. Xoá khi thoát sạch (best-effort).
 *  2. Lần chạy sau (hoặc harness TRƯỚC khi spawn Electron) gọi
 *     cleanupStaleElectronChildren(): quét các process mồ côi là con của
 *     Electron VCut rồi kill từng pid (SIGTERM → chờ → SIGKILL), KHÔNG
 *     kill theo process group.
 *
 * NHẬN DIỆN "ĐÚNG CON MỒ CÔI CỦA VCUT" — fail-closed, phải đủ TẤT CẢ:
 *  - POSIX: đọc /proc/<pid>/cmdline. **LƯU Ý ĐỊNH DẠNG (bug đợt 52 I4,
 *    bắt được nhờ smoke thật):** con Chromium KHÔNG giữ argv tách bằng
 *    NUL — /proc/<pid>/cmdline của chúng là MỘT chuỗi duy nhất nối bằng
 *    khoảng trắng (đo thật: 963 byte, chỉ 1 NUL cuối). Parser
 *    (parseProcessCmdline) tách cả NUL lẫn space; code chỉ split('\0')
 *    sẽ làm cmdline[0] thành cả blob và matcher không bao giờ khớp.
 *    Process node/python giữ NUL nên không ảnh hưởng.
 *  - argv[0] basename là `vcut-studio` hoặc `electron` (binary Electron; launcher *.AppImage KHÔNG khớp —
 *    nó tự thoát khi process con chết nên không cần dọn; crashpad-handler
 *    cũng không khớp vì là binary riêng, tự thoát khi main chết).
 *  - Có arg `--type=<renderer|gpu-process|utility|zygote|...>` (tiến trình
 *    con Chromium). Main process KHÔNG có --type nên chỉ được kill khi pid
 *    của nó đúng bằng appPid ghi trong pidfile ĐÃ CHẾT (xem dưới).
 *  - Có marker VCut: arg `--user-data-dir=<userDataDir>` khớp ĐÚNG thư mục
 *    userData của lần chạy cũ (ghi trong pidfile) hoặc của lần chạy hiện
 *    tại. Playwright Chromium (`chrome --type=renderer ...`) KHÔNG có
 *    marker này nên không bao giờ bị kill nhầm — đã kiểm chứng bằng scan
 *    thật (pid 17499, chrome headless, bị loại đúng).
 *  - MỒ CÔI: ppid == 1, hoặc pid cha đã chết (đọc /proc/<pid>/stat).
 *    Con của app đang chạy có ppid trỏ vào cây sống nên không bao giờ đủ
 *    điều kiện này.
 *  - KHÔNG nằm trong cây tiến trình của process đang gọi (đi ngược chuỗi
 *    ppid tối đa 32 nấc, gặp process.pid thì bỏ qua) — chặn cả trường hợp
 *    ppid bookkeeping lạ.
 *  - KHÔNG phải bridge VCut (cmdline chứa server/bridge/src/index.js) —
 *    bridge thuộc về bridgePidfile.js; chạy cleanupStaleBridge TRƯỚC rồi
 *    mới chạy module này.
 *  - Nếu pidfile ghi appPid còn SỐNG và cha nó còn sống → KHÔNG đụng gì
 *    cả (một instance khác đang chạy) — action 'predecessor-alive'. App
 *    cũ còn sống NHƯNG mồ côi (cha đã chết) thì vẫn dọn: nó là leftover,
 *    và scan chỉ kill main khi pid đúng appPid trong pidfile. Trong app
 *    thật còn có single-instance lock chặn trước (main.ts gọi
 *    requestSingleInstanceLock() trước initServiceLifecycle).
 *
 * QUÉT THEO SOCKET CDP (bằng chứng trực tiếp, không chỉ suy đoán):
 * findSocketHolders(cdpPort) đọc /proc/net/tcp{,6} tìm inode của socket
 * LISTEN trên cổng CDP rồi quét /proc/<pid>/fd tìm process giữ fd đó.
 * Holder nào khớp các điều kiện trên thì kill; holder là bridge thì bỏ qua
 * (đã dọn ở bước bridge); holder là process lạ thì KHÔNG kill, chỉ ghi
 * vào kết quả.
 *
 * VÌ SAO QUÉT NHIỀU LƯỢT (tối đa 3): gpu/renderer fork từ zygote — lúc
 * quét lượt 1 chúng có ppid = zygote (còn sống) nên CHƯA mồ côi; sau khi
 * zygote bị kill, chúng được reparent về pid 1 và chỉ thành mồ côi ở
 * lượt quét sau. Mỗi lượt quét lại từ đầu cho tới khi không còn ứng viên.
 *
 * GIỚI HẠN (trung thực — xem docs/PHASE9_ROUND52_I4_*_LIMITS.md):
 *  - Electron bind CDP lúc khởi động, TRƯỚC khi main.ts chạy — nên dọn
 *    trong app (start()) thì cổng CDP chỉ trống cho LẦN CHẠY SAU; lần
 *    chạy dọn tự nó vẫn mất CDP. Muốn lần chạy đó có CDP thì phải dọn
 *    TRƯỚC khi spawn Electron (harness làm vậy; app thường không có
 *    bước pre-spawn vì AppImage chạy thẳng binary Electron).
 *  - Chỉ dọn được process nhận diện chắc chắn là con VCut (đủ marker +
 *    mồ côi). Process lạ giữ socket CDP (không khớp marker) thì KHÔNG kill
 *    — cổng vẫn bận, lần chạy sau vẫn mất CDP, và kết quả báo rõ.
 *  - KHÔNG kill theo process group: pgid của Electron main có thể là
 *    group của shell/launcher (khi chạy foreground, pgid == pid của
 *    launcher — kill cả group có thể giết nhầm shell cha). Pidfile chỉ
 *    ghi pgid để chẩn đoán, không dùng để kill.
 *  - Windows/macOS: module trả về không làm gì (fail-closed) — Phase 10
 *    chỉ hỗ trợ Linux; nhánh Windows chưa implement.
 *  - Pidfile là best-effort: ghi/xoá lỗi chỉ log, không chặn app.
 *
 * Module này KHÔNG import electron — chạy được bằng Node thuần để test
 * độc lập (xem electronOrphanCleanup.test.cjs). serviceManager.js require
 * module này; serviceLifecycle.ts expose lại cho main/scripts qua adapter.
 */

const fs = require('node:fs');
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port JS của
// apps/web/scripts/eperm-retry.mjs; xem services/epermRetry.js).
const { writeFileEpermRetry } = require('./epermRetry');
const path = require('node:path');

const ELECTRON_PIDFILE_NAME = 'electron.pid.json';
/** Basename của binary Electron (dev: electron, đóng gói: vcut-studio). */
const ELECTRON_BIN_NAMES = new Set(['vcut-studio', 'electron', 'electron.exe']);
const BRIDGE_ENTRY_SUFFIX = 'server/bridge/src/index.js';
const DEFAULT_CDP_PORT = 9222;
const KILL_GRACE_MS = 5000; // chờ SIGTERM trước khi SIGKILL (mỗi pid)
const KILL_WAIT_MS = 2000; // chờ sau SIGKILL
const PORT_FREE_WAIT_MS = 2000; // chờ cổng CDP được giải phóng sau khi kill
const PORT_FREE_POLL_MS = 100;
const MAX_CLEANUP_PASSES = 3; // quét lại vì con của zygote chỉ mồ côi sau khi zygote chết

function electronPidfilePath(userDataDir) {
  return path.join(userDataDir, ELECTRON_PIDFILE_NAME);
}

/**
 * Ghi pidfile Electron nguyên tử (tmp + rename trong cùng thư mục). Lỗi ghi
 * chỉ log qua callback — pidfile là lưới an toàn, không chặn app.
 * @param {string} userDataDir
 * @param {{ appPid: number, pgid?: number, execPath?: string, appPath?: string|null, userDataDir?: string, cdpPort?: number, startedAt?: string }} record
 * @param {(msg: string) => void} [log]
 * @returns {boolean} true nếu ghi được
 */
function writeElectronPidfile(userDataDir, record, log) {
  const file = electronPidfilePath(userDataDir);
  // pgid của main (chỉ để chẩn đoán, KHÔNG dùng để kill — xem ghi chú đầu
  // file). Tự đọc từ /proc/self/stat khi caller không truyền.
  let pgid = record.pgid ?? null;
  if (pgid === null && process.platform !== 'win32') {
    try {
      const stat = fs.readFileSync('/proc/self/stat', 'utf8');
      const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
      const g = Number(fields[2]);
      if (Number.isInteger(g)) pgid = g;
    } catch { /* bỏ qua — pgid chỉ để chẩn đoán */ }
  }
  const payload = {
    appPath: record.appPath ?? null,
    appPid: record.appPid,
    cdpPort: record.cdpPort ?? DEFAULT_CDP_PORT,
    execPath: record.execPath ?? process.execPath,
    pgid,
    startedAt: record.startedAt ?? new Date().toISOString(),
    userDataDir: record.userDataDir ?? userDataDir,
    version: 1,
  };
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    writeFileEpermRetry(tmp, `${JSON.stringify(payload, null, 2)}\n`, { label: 'desktop-electron-pidfile' });
    fs.renameSync(tmp, file);
    return true;
  } catch (e) {
    if (typeof log === 'function') log(`electron pidfile: không ghi được ${file}: ${e.message}`);
    return false;
  }
}

/**
 * Đọc pidfile Electron. Trả null khi không có file hoặc JSON hỏng.
 * @param {string} userDataDir
 * @returns {{ appPid: number, pgid?: number|null, execPath?: string, appPath?: string|null, userDataDir?: string, cdpPort?: number, startedAt?: string, version?: number } | null}
 */
function readElectronPidfile(userDataDir) {
  try {
    const raw = fs.readFileSync(electronPidfilePath(userDataDir), 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data.appPid !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Xoá pidfile Electron (best-effort). Trả true nếu file đã tồn tại và đã xoá.
 * @param {string} userDataDir
 * @returns {boolean}
 */
function removeElectronPidfile(userDataDir) {
  try {
    if (!fs.existsSync(electronPidfilePath(userDataDir))) return false;
    fs.unlinkSync(electronPidfilePath(userDataDir));
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
    const srv = require('node:net').createServer();
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
 * Đọc cmdline của một process (POSIX: /proc/<pid>/cmdline).
 * Trả null khi không đọc được (fail-closed).
 *
 * Đợt 52 I4 — ĐỊNH DẠNG CMDLINE CỦA CHROMIUM (bug bắt được nhờ smoke test
 * thật, unit test không bắt được vì mock là process node): con Chromium
 * (renderer/gpu/utility/zygote) KHÔNG giữ argv tách bằng NUL như process
 * thường — /proc/<pid>/cmdline của chúng là MỘT chuỗi duy nhất, các arg
 * nối bằng khoảng trắng, chỉ có 1 byte NUL ở cuối (đo thật trên gpu-process
 * của AppImage đang chạy: 963 byte, 1 NUL). Process node/python thì giữ
 * NUL. Vì vậy parser phải tách cả theo NUL lẫn theo khoảng trắng (xem
 * parseProcessCmdline); code cũ chỉ split('\0') nên cmdline[0] thành cả
 * chuỗi blob, basename() ra rác, matcher không bao giờ khớp con Chromium
 * thật — smoke lượt 1 fail đúng 1 check này (gpu/utility mồ côi không bị
 * kill). Giá trị flag chứa khoảng trắng sẽ bị cắt (fail-closed: không
 * khớp → không kill); userDataDir của VCut không chứa khoảng trắng.
 * @param {number} pid
 * @returns {string[] | null}
 */
function getProcessCmdline(pid) {
  if (process.platform === 'win32') return null; // chưa hỗ trợ Windows
  try {
    const raw = fs.readFileSync(`/proc/${pid}/cmdline`);
    return parseProcessCmdline(raw);
  } catch {
    return null;
  }
}

/**
 * Parse buffer /proc/<pid>/cmdline thành danh sách arg. Chịu cả hai định
 * dạng: NUL-separated (node/python/process thường) và space-joined một
 * chuỗi (con Chromium/Electron — xem ghi chú ở getProcessCmdline).
 * @param {Buffer} raw
 * @returns {string[]}
 */
function parseProcessCmdline(raw) {
  const parts = [];
  for (const part of String(raw).split('\0')) {
    if (!part) continue;
    // Chuỗi nối bằng space (có ' --' bên trong) → tách thêm theo khoảng
    // trắng để lấy lại từng token (--type=..., --user-data-dir=...).
    if (part.includes(' --')) parts.push(...part.split(/\s+/).filter(Boolean));
    else parts.push(part);
  }
  return parts;
}

/**
 * Đọc ppid của một process (Linux: /proc/<pid>/stat field 4 — ppid).
 * Trả null khi không đọc được.
 * @param {number} pid
 * @returns {number | null}
 */
function getParentPid(pid) {
  if (process.platform === 'win32') return null;
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const afterComm = stat.slice(stat.lastIndexOf(')') + 2);
    const fields = afterComm.split(' ');
    // fields[0]=state, [1]=ppid
    const ppid = Number(fields[1]);
    return Number.isInteger(ppid) ? ppid : null;
  } catch {
    return null;
  }
}

/**
 * Process này có mồ côi không: ppid == 1 (đã reparent về init) hoặc pid
 * cha đã chết. Process có cha còn sống thì KHÔNG mồ côi.
 * @param {number} pid
 * @returns {boolean}
 */
function isOrphanProcess(pid) {
  const ppid = getParentPid(pid);
  if (ppid === null) return false; // không đọc được — fail-closed: không mồ côi
  if (ppid === 1) return true;
  return !isPidAlive(ppid);
}

/**
 * Pid này có nằm trong cây tiến trình của process hiện tại không (đi ngược
 * chuỗi ppid tối đa 32 nấc, gặp process.pid thì true). Dùng để chặn kill
 * nhầm con của chính lần chạy này dù ppid bookkeeping có lạ.
 * @param {number} pid
 * @returns {boolean}
 */
function isInCurrentProcessTree(pid) {
  let cur = pid;
  for (let i = 0; i < 32; i += 1) {
    if (cur === process.pid) return true;
    if (cur <= 1) return false;
    const ppid = getParentPid(cur);
    if (ppid === null) return false;
    cur = ppid;
  }
  return false;
}

function cmdlineArg(cmdline, name) {
  const prefix = `${name}=`;
  for (const arg of cmdline) {
    if (arg === name) return '';
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return null;
}

/**
 * Process này có phải tiến trình Electron của VCut không? Chỉ tin cmdline
 * khớp đủ marker (xem ghi chú đầu file). Trả kèm loại ('child' | 'main')
 * và lý do để caller/log ghi rõ.
 *
 * @param {number} pid
 * @param {{ userDataDir: string, recordedAppPid?: number|null }} markers
 *   - userDataDir: thư mục userData của lần chạy cũ (pidfile) hoặc hiện tại
 *   - recordedAppPid: appPid ghi trong pidfile (nếu có) — chỉ pid này mới
 *     được coi là "main mồ côi" khi không có --type
 * @returns {{ match: boolean, type: 'child'|'main'|null, cmdline: string | null, reason: string }}
 */
function isVcutElectronChildProcess(pid, markers) {
  if (process.platform === 'win32') {
    return { cmdline: null, match: false, reason: 'chưa hỗ trợ Windows (fail-closed)', type: null };
  }
  const cmdline = getProcessCmdline(pid);
  if (!cmdline || cmdline.length === 0) {
    return { cmdline: null, match: false, reason: 'không đọc được cmdline (fail-closed: không kill)', type: null };
  }
  const joined = cmdline.join(' ');
  const binName = path.basename(cmdline[0] || '');
  if (!ELECTRON_BIN_NAMES.has(binName)) {
    return { cmdline: joined, match: false, reason: `argv[0] basename "${binName}" không phải binary Electron VCut`, type: null };
  }
  // Bridge VCut thuộc về bridgePidfile.js — không đụng vào đây.
  const normalized = joined.split(path.sep).join('/');
  if (normalized.includes(BRIDGE_ENTRY_SUFFIX)) {
    return { cmdline: joined, match: false, reason: 'đây là bridge VCut (thuộc bridgePidfile, không dọn ở đây)', type: null };
  }
  // Marker VCut: --user-data-dir phải khớp ĐÚNG thư mục userData.
  const userDataArg = cmdlineArg(cmdline, '--user-data-dir');
  if (userDataArg !== markers.userDataDir) {
    return {
      cmdline: joined,
      match: false,
      reason: `--user-data-dir "${userDataArg ?? '(không có)'}" không khớp userDataDir VCut`,
      type: null,
    };
  }
  const typeArg = cmdlineArg(cmdline, '--type');
  if (typeArg !== null) {
    return {
      cmdline: joined,
      match: true,
      reason: `con Electron VCut --type=${typeArg || '(trống)'} (user-data-dir khớp)`,
      type: 'child',
    };
  }
  // Không có --type → main process. Chỉ kill khi đúng pid ghi trong pidfile.
  if (markers.recordedAppPid && pid === markers.recordedAppPid) {
    return {
      cmdline: joined,
      match: true,
      reason: 'main process Electron cũ (đúng appPid trong pidfile, user-data-dir khớp)',
      type: 'main',
    };
  }
  return {
    cmdline: joined,
    match: false,
    reason: 'main process Electron nhưng pid không khớp appPid trong pidfile (fail-closed: không kill main lạ)',
    type: null,
  };
}

/**
 * Tìm các pid đang giữ socket LISTEN trên một cổng (đọc /proc/net/tcp{,6}
 * lấy inode rồi quét /proc/<pid>/fd). Trả [] khi không có ai giữ / không
 * đọc được (fail-closed: caller chỉ dùng danh sách này làm ứng viên, vẫn
 * phải qua isVcutElectronChildProcess + isOrphanProcess trước khi kill).
 * @param {number} port
 * @returns {Array<{ pid: number, fd: string, inode: string }>}
 */
function findSocketHolders(port) {
  if (process.platform === 'win32') return [];
  const hex = Number(port).toString(16).toUpperCase().padStart(4, '0');
  const inodes = new Set();
  for (const f of ['/proc/net/tcp', '/proc/net/tcp6']) {
    let raw;
    try { raw = fs.readFileSync(f, 'utf8'); } catch { continue; }
    for (const line of raw.split('\n').slice(1)) {
      const p = line.trim().split(/\s+/);
      if (p.length < 10) continue;
      const local = p[1] || '';
      // st 0A = LISTEN; inode ở cột 9 (sl local rem st tx:rx tr:tm retr uid timeout inode ...)
      if (local.endsWith(`:${hex}`) && p[3] === '0A' && p[9]) inodes.add(p[9]);
    }
  }
  if (inodes.size === 0) return [];
  const holders = [];
  let pids;
  try { pids = fs.readdirSync('/proc'); } catch { return []; }
  for (const d of pids) {
    if (!/^\d+$/.test(d)) continue;
    const pid = Number(d);
    let fds;
    try { fds = fs.readdirSync(`/proc/${d}/fd`); } catch { continue; }
    for (const fd of fds) {
      let link;
      try { link = fs.readlinkSync(`/proc/${d}/fd/${fd}`); } catch { continue; }
      const m = /^socket:\[(\d+)\]$/.exec(link);
      if (m && inodes.has(m[1])) holders.push({ fd, inode: m[1], pid });
    }
  }
  return holders;
}

/**
 * Kill một pid: SIGTERM → chờ → SIGKILL → chờ. Trả true nếu pid đã chết.
 * @param {number} pid
 * @returns {Promise<boolean>}
 */
async function killOneProcess(pid) {
  try { process.kill(pid, 'SIGTERM'); } catch { return !isPidAlive(pid); }
  if (await waitFor(() => !isPidAlive(pid), KILL_GRACE_MS)) return true;
  try { process.kill(pid, 'SIGKILL'); } catch { return !isPidAlive(pid); }
  return waitFor(() => !isPidAlive(pid), KILL_WAIT_MS);
}

/**
 * Quét một lượt: liệt kê mọi ứng viên mồ côi là con Electron VCut (cộng
 * thêm holder của socket CDP nếu có — holder cũng phải qua đủ điều kiện
 * nhận diện + mồ côi, không kill theo socket đơn thuần).
 * @param {{ userDataDir: string, recordedAppPid?: number|null, cdpPort?: number }} markers
 * @returns {Array<{ pid: number, type: 'child'|'main', reason: string, holdsCdpSocket: boolean }>}
 */
function scanOrphanElectronCandidates(markers) {
  const holders = markers.cdpPort ? findSocketHolders(markers.cdpPort) : [];
  const holderPids = new Set(holders.map((h) => h.pid));
  const candidates = new Map();
  const consider = (pid) => {
    if (candidates.has(pid)) return;
    if (pid === process.pid) return; // không bao giờ kill chính mình
    if (isInCurrentProcessTree(pid)) return; // con/cháu của lần chạy này
    if (!isOrphanProcess(pid)) return;
    const ident = isVcutElectronChildProcess(pid, markers);
    if (!ident.match) return;
    candidates.set(pid, {
      holdsCdpSocket: holderPids.has(pid),
      pid,
      reason: `${ident.reason}${holderPids.has(pid) ? ' + đang giữ socket CDP' : ''}`,
      type: ident.type,
    });
  };
  // Ứng viên giữ socket CDP trước (mục tiêu chính của đợt này).
  for (const h of holders) consider(h.pid);
  // Quét toàn bộ process table để bắt con mồ côi không giữ socket.
  let pids;
  try { pids = fs.readdirSync('/proc'); } catch { return [...candidates.values()]; }
  for (const d of pids) {
    if (!/^\d+$/.test(d)) continue;
    consider(Number(d));
  }
  return [...candidates.values()];
}

/**
 * Dọn renderer/GPU/utility/zygote (và main cũ nếu khớp pidfile) mồ côi của
 * VCut — xem ghi chú đầu file về quy tắc nhận diện + fail-closed.
 *
 * @param {string} userDataDir - thư mục chứa electron.pid.json
 * @param {{ cdpPort?: number, log?: (msg: string) => void }} [opts]
 *   - cdpPort: cổng CDP cần kiểm tra có được giải phóng không (mặc định
 *     9222; serviceLifecycle tự lấy từ argv --remote-debugging-port).
 * @returns {Promise<{ action: string, pid?: number, cdpPort?: number, reason: string, killedPids?: Array<{pid:number,type:string,reason:string}>, failedPids?: Array<{pid:number,type:string}>, unknownCdpHolders?: number[], cdpPortFreed?: boolean, scannedPasses?: number }>}
 */
async function cleanupStaleElectronChildren(userDataDir, opts = {}) {
  const log = typeof opts.log === 'function' ? opts.log : () => {};
  const cdpPort = opts.cdpPort ?? DEFAULT_CDP_PORT;
  if (process.platform === 'win32') {
    return { action: 'unsupported-platform', cdpPort, reason: 'chưa hỗ trợ Windows — không dọn gì cả' };
  }
  const record = readElectronPidfile(userDataDir);
  const recordedAppPid = record ? record.appPid : null;
  if (recordedAppPid && recordedAppPid !== process.pid && isPidAlive(recordedAppPid) && !isOrphanProcess(recordedAppPid)) {
    log(`electron pidfile: app cũ pid ${recordedAppPid} còn sống và có cha còn sống — KHÔNG dọn gì (có thể một instance khác đang chạy)`);
    return {
      action: 'predecessor-alive',
      cdpPort,
      pid: recordedAppPid,
      reason: `app cũ pid ${recordedAppPid} còn sống (cha còn sống) — không dọn (fail-closed)`,
    };
  }
  // Lưu ý: app cũ còn sống NHƯNG mồ côi (cha đã chết — vd: launcher bị
  // kill -9, main sống sót) thì KHÔNG chặn ở đây: nó chính là đối tượng
  // cần dọn, và scan dưới đây chỉ kill nó khi pid đúng appPid trong
  // pidfile + marker user-data-dir khớp. Trong app thật còn có lớp bảo vệ
  // ngoài: main.ts gọi app.requestSingleInstanceLock() TRƯỚC khi
  // initServiceLifecycle/start() nên instance sống (dù mồ côi) đã chặn
  // instance mới từ trước khi cleanup chạy; guard này chỉ là lưới phụ cho
  // đường harness gọi trực tiếp (harness chỉ dọn userData của chính nó).
  const markers = {
    cdpPort,
    recordedAppPid,
    userDataDir: (record && record.userDataDir) || userDataDir,
  };
  const killedPids = [];
  const failedPids = [];
  let passes = 0;
  for (let pass = 0; pass < MAX_CLEANUP_PASSES; pass += 1) {
    passes += 1;
    // eslint-disable-next-line no-await-in-loop
    const candidates = scanOrphanElectronCandidates(markers);
    if (candidates.length === 0) break;
    for (const c of candidates) {
      log(`electron pidfile: phát hiện con mồ côi ${c.type} pid ${c.pid} (${c.reason}) — đang kill`);
      // eslint-disable-next-line no-await-in-loop
      const dead = await killOneProcess(c.pid);
      if (dead) {
        killedPids.push({ pid: c.pid, reason: c.reason, type: c.type });
        log(`electron pidfile: đã kill con mồ côi ${c.type} pid ${c.pid}`);
      } else {
        failedPids.push({ pid: c.pid, type: c.type });
        log(`electron pidfile: KHÔNG kill được con mồ côi pid ${c.pid} — bỏ qua, không thử lại trong lượt này`);
      }
    }
  }
  // Holder lạ còn giữ socket CDP sau khi dọn (không khớp marker VCut nên
  // KHÔNG kill) — báo rõ để lần chạy sau biết vì sao CDP vẫn bận.
  const remainingHolders = findSocketHolders(cdpPort)
    .map((h) => h.pid)
    .filter((pid) => pid !== process.pid && !isInCurrentProcessTree(pid));
  const cdpPortFreed = await waitFor(() => isPortFree(cdpPort), PORT_FREE_WAIT_MS, PORT_FREE_POLL_MS);
  if (recordedAppPid && !isPidAlive(recordedAppPid)) {
    removeElectronPidfile(userDataDir);
  }
  if (killedPids.length === 0 && failedPids.length === 0) {
    return {
      action: recordedAppPid ? 'stale-pid-dead' : 'none',
      cdpPort,
      cdpPortFreed,
      pid: recordedAppPid ?? undefined,
      reason: recordedAppPid
        ? `app cũ pid ${recordedAppPid} đã chết, không còn con mồ côi VCut nào`
        : 'không có pidfile Electron và không thấy con mồ côi VCut nào',
      scannedPasses: passes,
      unknownCdpHolders: remainingHolders,
    };
  }
  if (failedPids.length > 0 && killedPids.length === 0) {
    return {
      action: 'kill-failed',
      cdpPort,
      cdpPortFreed,
      failedPids,
      killedPids,
      pid: recordedAppPid ?? undefined,
      reason: `kill ${failedPids.length} con mồ côi thất bại — giữ nguyên, lần sau thử lại`,
      scannedPasses: passes,
      unknownCdpHolders: remainingHolders,
    };
  }
  return {
    action: 'orphan-killed',
    cdpPort,
    cdpPortFreed,
    failedPids,
    killedPids,
    pid: recordedAppPid ?? undefined,
    reason: `đã kill ${killedPids.length} con mồ côi Electron VCut` +
      (failedPids.length > 0 ? ` (còn ${failedPids.length} kill thất bại)` : '') +
      ` — cổng CDP ${cdpPort} ${cdpPortFreed ? 'đã trống' : 'VẪN BẬN'}` +
      (remainingHolders.length > 0 ? ` (holder lạ còn lại: ${remainingHolders.join(',')})` : ''),
    scannedPasses: passes,
    unknownCdpHolders: remainingHolders,
  };
}

module.exports = {
  BRIDGE_ENTRY_SUFFIX,
  DEFAULT_CDP_PORT,
  ELECTRON_PIDFILE_NAME,
  cleanupStaleElectronChildren,
  electronPidfilePath,
  findSocketHolders,
  getParentPid,
  getProcessCmdline,
  isInCurrentProcessTree,
  isOrphanProcess,
  isPidAlive,
  isPortFree,
  isVcutElectronChildProcess,
  killOneProcess,
  parseProcessCmdline,
  readElectronPidfile,
  removeElectronPidfile,
  scanOrphanElectronCandidates,
  writeElectronPidfile,
};

/**
 * @typedef {Object} ElectronPidfileRecord
 * @property {number} appPid - pid của Electron main đã ghi pidfile
 * @property {number|null} [pgid] - process group của main (chỉ để chẩn đoán, KHÔNG dùng để kill)
 * @property {string} [execPath] - binary Electron (dev: .../electron, gói: .../vcut-studio)
 * @property {string|null} [appPath] - app.getAppPath() (dev: apps/desktop, gói: .../resources/app.asar)
 * @property {string} [userDataDir] - thư mục userData của lần chạy đó
 * @property {number} [cdpPort] - cổng CDP lần chạy đó dùng
 * @property {string} [startedAt] - ISO timestamp lúc ghi
 * @property {number} [version] - 1
 *
 * @typedef {Object} StaleElectronCleanupResult
 * @property {'none'|'stale-pid-dead'|'predecessor-alive'|'orphan-killed'|'kill-failed'|'unsupported-platform'} action
 * @property {number} [pid] - appPid ghi trong pidfile (nếu có)
 * @property {number} [cdpPort]
 * @property {string} reason
 * @property {Array<{pid:number,type:string,reason:string}>} [killedPids]
 * @property {Array<{pid:number,type:string}>} [failedPids]
 * @property {number[]} [unknownCdpHolders] - pid lạ còn giữ socket CDP (không kill)
 * @property {boolean} [cdpPortFreed]
 * @property {number} [scannedPasses]
 */
