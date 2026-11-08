'use strict';
/**
 * electronOrphanCleanup.test.cjs — Test thật cho pidfile Electron + dọn
 * renderer/GPU con mồ côi (đợt 52, I4). Chạy bằng:
 *   node --test apps/desktop/src/services/electronOrphanCleanup.test.cjs
 *
 * Các test spawn process node THẬT làm "mock Electron": dùng spawn option
 * argv0 để cmdline[0] là `electron` (basename khớp matcher) và truyền
 * `--type=renderer|gpu-process` + `--user-data-dir=<tmp>` như con Chromium
 * thật. Mock thành mồ côi bằng double-fork: process trung gian spawn mock
 * detached rồi thoát ngay → mock được reparent về pid 1.
 *
 * AN TOÀN: mọi mock đều mang marker --user-data-dir=<thư mục tmp riêng của
 * test> nên cleanup chỉ có thể kill đúng mock của test đó; process lạ
 * (sleep, chrome giả) được assert CÒN SỐNG sau cleanup. t.after kill sạch
 * mọi mock còn sót (SIGKILL).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  cleanupStaleElectronChildren,
  electronPidfilePath,
  findSocketHolders,
  getParentPid,
  isOrphanProcess,
  isVcutElectronChildProcess,
  parseProcessCmdline,
  readElectronPidfile,
  removeElectronPidfile,
  writeElectronPidfile,
} = require('./electronOrphanCleanup');

const FAKE_ELECTRON_ARGV0 = '/tmp/vcut-i4-fake-bin/electron';
const HELPER_PATH = path.join(os.tmpdir(), `vcut-i4-orphan-helper-${process.pid}.cjs`);
fs.writeFileSync(HELPER_PATH, `'use strict';
// Spawn một mock process detached rồi thoát ngay (mock thành mồ côi).
// argv: JSON argv của mock (process.argv[2]); argv0: process.argv[3].
const { spawn } = require('node:child_process');
const argv = JSON.parse(process.argv[2]);
const argv0 = process.argv[3];
const child = spawn(process.execPath, argv, { argv0, detached: true, stdio: 'ignore' });
child.unref();
process.stdout.write(String(child.pid));
`);
// Mock sleep: file script (KHÔNG dùng -e, vì node vẫn parse arg sau -e
// bắt đầu bằng '-' thành option của node → "bad option" và chết ngay).
// Nhận --listen-port=N (tự listen để giả holder socket) rồi sleep 120s.
const MOCK_SLEEP_PATH = path.join(os.tmpdir(), `vcut-i4-mock-sleep-${process.pid}.cjs`);
fs.writeFileSync(MOCK_SLEEP_PATH, `'use strict';
const net = require('node:net');
const lp = process.argv.find((a) => a.startsWith('--listen-port='));
if (lp) {
  const port = Number(lp.split('=')[1]);
  net.createServer().listen(port, '127.0.0.1', () => {});
}
setTimeout(() => {}, 120000);
`);
// Mock zygote: spawn một renderer mock làm con ruột rồi sleep (để test
// multi-pass: renderer chỉ thành mồ côi sau khi zygote chết).
// argv: [--user-data-dir=<dir>, argv0, mockSleepPath, --type=zygote];
// in "RENDERER <pid>". (Electron thật: zygote có --type=zygote +
// --user-data-dir trong cmdline — mock phải có đủ marker mới khớp.)
const MOCK_ZYGOTE_PATH = path.join(os.tmpdir(), `vcut-i4-mock-zygote-${process.pid}.cjs`);
fs.writeFileSync(MOCK_ZYGOTE_PATH, `'use strict';
const { spawn } = require('node:child_process');
const dirArg = process.argv.find((a) => a.startsWith('--user-data-dir='));
const dir = dirArg ? dirArg.slice('--user-data-dir='.length) : process.argv[2];
const argv0 = process.argv[3];
const mockSleep = process.argv[4];
const c = spawn(process.execPath, [mockSleep, '--type=renderer', '--user-data-dir=' + dir], { argv0, detached: false, stdio: 'ignore' });
c.unref();
console.log('RENDERER ' + c.pid);
setTimeout(() => {}, 120000);
`);

function tmpUserData(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vcut-i4-test-'));
  t.after(() => {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  });
  return dir;
}

function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function waitFor(cond, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await cond()) return;
    if (Date.now() >= deadline) throw new Error(`timeout chờ: ${label}`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

/** Spawn mock process mồ côi thật (reparent về pid 1) qua helper double-fork. */
function spawnOrphanMock(t, argv, argv0) {
  return new Promise((resolve, reject) => {
    const helper = spawn(process.execPath, [HELPER_PATH, JSON.stringify(argv), argv0], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    helper.stdout.on('data', (d) => { out += d; });
    helper.on('error', reject);
    helper.on('close', async () => {
      const pid = Number(out.trim());
      if (!pid) return reject(new Error(`helper không trả pid (out=${JSON.stringify(out)})`));
      t.after(() => { try { process.kill(pid, 'SIGKILL'); } catch { /* đã chết */ } });
      try {
        await waitFor(() => getParentPid(pid) === 1, 10000, `mock pid ${pid} mồ côi (ppid về 1)`);
      } catch (e) { return reject(e); }
      resolve(pid);
    });
  });
}

/** Mock con Electron VCut: file script sleep với argv0 electron + marker VCut. */
function mockElectronChildArgs(userDataDir, type = 'renderer') {
  return [MOCK_SLEEP_PATH, `--type=${type}`, `--user-data-dir=${userDataDir}`];
}

test.after(() => {
  for (const f of [HELPER_PATH, MOCK_SLEEP_PATH, MOCK_ZYGOTE_PATH]) {
    try { fs.rmSync(f, { force: true }); } catch { /* bỏ qua */ }
  }
});

test('parseProcessCmdline: NUL-separated (node) + space-joined (Chromium thật)', () => {
  // Process thường: argv tách bằng NUL.
  assert.deepEqual(
    parseProcessCmdline(Buffer.from('/a/electron\0--type=renderer\0--user-data-dir=/tmp/x\0')),
    ['/a/electron', '--type=renderer', '--user-data-dir=/tmp/x'],
  );
  // Con Chromium thật: MỘT chuỗi nối bằng space, chỉ 1 NUL cuối (đo thật
  // trên gpu-process AppImage: 963 byte, 1 NUL). Parser phải tách lại
  // thành từng token, nếu không matcher không bao giờ khớp con Chromium.
  assert.deepEqual(
    parseProcessCmdline(Buffer.from('/a/vcut-studio --type=gpu-process --user-data-dir=/tmp/x --gpu-preferences=AAA\0')),
    ['/a/vcut-studio', '--type=gpu-process', '--user-data-dir=/tmp/x', '--gpu-preferences=AAA'],
  );
  // Trống / chỉ NUL → [].
  assert.deepEqual(parseProcessCmdline(Buffer.from('\0')), []);
  assert.deepEqual(parseProcessCmdline(Buffer.from('')), []);
  // Hỗn hợp: argv[0] riêng + phần còn lại nối bằng space.
  assert.deepEqual(
    parseProcessCmdline(Buffer.from('electron\0/path/mock.js\0--type=renderer --user-data-dir=/tmp/x\0')),
    ['electron', '/path/mock.js', '--type=renderer', '--user-data-dir=/tmp/x'],
  );
});

test('pidfile Electron ghi/đọc/xoá round-trip', (t) => {
  const dir = tmpUserData(t);
  assert.equal(readElectronPidfile(dir), null);
  const ok = writeElectronPidfile(dir, {
    appPath: '/tmp/fake/app.asar',
    appPid: 12345,
    cdpPort: 9224,
    execPath: '/tmp/fake/vcut-studio',
    pgid: 12340,
    userDataDir: dir,
  });
  assert.equal(ok, true);
  assert.equal(fs.existsSync(electronPidfilePath(dir)), true);
  const rec = readElectronPidfile(dir);
  assert.equal(rec.appPid, 12345);
  assert.equal(rec.cdpPort, 9224);
  assert.equal(rec.execPath, '/tmp/fake/vcut-studio');
  assert.equal(rec.userDataDir, dir);
  assert.equal(removeElectronPidfile(dir), true);
  assert.equal(readElectronPidfile(dir), null);
  assert.equal(removeElectronPidfile(dir), false);
});

test('không có pidfile, không có con mồ côi → action none, không kill gì', async (t) => {
  const dir = tmpUserData(t);
  const r = await cleanupStaleElectronChildren(dir, { cdpPort: 19224 });
  assert.equal(r.action, 'none');
  assert.equal(r.cdpPortFreed, true);
});

test('AN TOÀN: app cũ còn sống → predecessor-alive, không kill gì', async (t) => {
  const dir = tmpUserData(t);
  // Process lạ còn sống, ghi làm appPid trong pidfile.
  const stranger = spawn(process.execPath, [MOCK_SLEEP_PATH], { stdio: 'ignore' });
  t.after(() => { try { stranger.kill('SIGKILL'); } catch { /* bỏ qua */ } });
  writeElectronPidfile(dir, { appPid: stranger.pid, cdpPort: 19225, userDataDir: dir });
  const r = await cleanupStaleElectronChildren(dir, { cdpPort: 19225 });
  assert.equal(r.action, 'predecessor-alive');
  assert.equal(pidAlive(stranger.pid), true, 'process lạ phải còn sống');
});

test('matcher: con Electron VCut khớp; chrome/sleep/bridge không khớp', async (t) => {
  const dir = tmpUserData(t);
  // Mock con renderer VCut còn sống nhưng KHÔNG mồ côi (ppid = test runner)
  // → matcher vẫn nhận diện (nhận diện không phụ thuộc mồ côi; mồ côi do
  // caller kiểm tra riêng), nhưng cleanup không được kill nó.
  const live = spawn(process.execPath, mockElectronChildArgs(dir, 'renderer'), {
    argv0: FAKE_ELECTRON_ARGV0, stdio: 'ignore',
  });
  t.after(() => { try { live.kill('SIGKILL'); } catch { /* bỏ qua */ } });
  const ident = isVcutElectronChildProcess(live.pid, { recordedAppPid: null, userDataDir: dir });
  assert.equal(ident.match, true);
  assert.equal(ident.type, 'child');
  assert.match(ident.reason, /renderer/);

  // Binary lạ (node, không phải electron) → không khớp.
  const plain = spawn(process.execPath, [MOCK_SLEEP_PATH], { stdio: 'ignore' });
  t.after(() => { try { plain.kill('SIGKILL'); } catch { /* bỏ qua */ } });
  assert.equal(isVcutElectronChildProcess(plain.pid, { recordedAppPid: null, userDataDir: dir }).match, false);

  // Chrome giả kiểu Playwright: argv0 chrome + --type=renderer + user-data-dir khác → không khớp.
  const chromeLike = spawn(process.execPath, [MOCK_SLEEP_PATH, '--type=renderer', '--user-data-dir=/tmp/khac'], {
    argv0: '/tmp/fake/chrome', stdio: 'ignore',
  });
  t.after(() => { try { chromeLike.kill('SIGKILL'); } catch { /* bỏ qua */ } });
  assert.equal(isVcutElectronChildProcess(chromeLike.pid, { recordedAppPid: null, userDataDir: dir }).match, false);

  // Electron nhưng user-data-dir khác → không khớp.
  const otherDir = spawn(process.execPath, mockElectronChildArgs('/tmp/userdata-khac', 'gpu-process'), {
    argv0: FAKE_ELECTRON_ARGV0, stdio: 'ignore',
  });
  t.after(() => { try { otherDir.kill('SIGKILL'); } catch { /* bỏ qua */ } });
  assert.equal(isVcutElectronChildProcess(otherDir.pid, { recordedAppPid: null, userDataDir: dir }).match, false);

  // Bridge VCut (cmdline chứa bridge entry — đường dẫn giả, mock chỉ sleep)
  // → không khớp (thuộc bridgePidfile).
  const bridgeLike = spawn(process.execPath, [MOCK_SLEEP_PATH, '/fake/server/bridge/src/index.js'], {
    argv0: FAKE_ELECTRON_ARGV0, stdio: 'ignore',
  });
  t.after(() => { try { bridgeLike.kill('SIGKILL'); } catch { /* bỏ qua */ } });
  assert.equal(isVcutElectronChildProcess(bridgeLike.pid, { recordedAppPid: null, userDataDir: dir }).match, false);

  // Main Electron không có --type: pid khác appPid trong pidfile → không khớp.
  const mainLike = spawn(process.execPath, [MOCK_SLEEP_PATH, `--user-data-dir=${dir}`], {
    argv0: FAKE_ELECTRON_ARGV0, stdio: 'ignore',
  });
  t.after(() => { try { mainLike.kill('SIGKILL'); } catch { /* bỏ qua */ } });
  assert.equal(isVcutElectronChildProcess(mainLike.pid, { recordedAppPid: 999999, userDataDir: dir }).match, false);
  // ...nhưng đúng pid trong pidfile thì khớp dạng main.
  assert.equal(isVcutElectronChildProcess(mainLike.pid, { recordedAppPid: mainLike.pid, userDataDir: dir }).match, true);
  assert.equal(isVcutElectronChildProcess(mainLike.pid, { recordedAppPid: mainLike.pid, userDataDir: dir }).type, 'main');
});

test('findSocketHolders: tìm đúng pid giữ socket LISTEN', async (t) => {
  const net = require('node:net');
  const srv = net.createServer();
  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  t.after(() => srv.close());
  const holders = findSocketHolders(port);
  assert.ok(holders.some((h) => h.pid === process.pid), `holders: ${JSON.stringify(holders)}`);
  assert.equal(findSocketHolders(19999).length, 0, 'cổng không ai nghe → không holder');
});

test('con renderer mồ côi VCut bị kill; process lạ mồ côi còn sống', { timeout: 120000 }, async (t) => {
  const dir = tmpUserData(t);
  // Pidfile ghi appPid đã chết (không còn app cũ).
  writeElectronPidfile(dir, { appPid: 999998, cdpPort: 19226, userDataDir: dir });
  // 1. Mock renderer VCut mồ côi (sẽ bị kill).
  const orphanRenderer = await spawnOrphanMock(t, mockElectronChildArgs(dir, 'renderer'), FAKE_ELECTRON_ARGV0);
  assert.equal(isOrphanProcess(orphanRenderer), true, 'mock renderer phải mồ côi trước cleanup');
  // 2. Mock gpu-process VCut mồ côi (sẽ bị kill).
  const orphanGpu = await spawnOrphanMock(t, mockElectronChildArgs(dir, 'gpu-process'), FAKE_ELECTRON_ARGV0);
  // 3. Sleep mồ côi (process lạ, không marker) — phải CÒN SỐNG.
  const orphanSleep = await spawnOrphanMock(t, [MOCK_SLEEP_PATH], '/tmp/fake/sleep');
  // 4. Chrome giả mồ côi (Playwright-like) — phải CÒN SỐNG.
  const orphanChrome = await spawnOrphanMock(
    t,
    [MOCK_SLEEP_PATH, '--type=renderer', '--user-data-dir=/tmp/khac'],
    '/tmp/fake/chrome',
  );

  const r = await cleanupStaleElectronChildren(dir, { cdpPort: 19226 });
  assert.equal(r.action, 'orphan-killed', JSON.stringify(r));
  const killed = (r.killedPids || []).map((k) => k.pid);
  assert.ok(killed.includes(orphanRenderer), `renderer ${orphanRenderer} phải bị kill: ${JSON.stringify(killed)}`);
  assert.ok(killed.includes(orphanGpu), `gpu ${orphanGpu} phải bị kill: ${JSON.stringify(killed)}`);
  assert.equal(pidAlive(orphanRenderer), false, 'renderer mồ côi phải chết');
  assert.equal(pidAlive(orphanGpu), false, 'gpu mồ côi phải chết');
  assert.equal(pidAlive(orphanSleep), true, 'sleep lạ mồ côi KHÔNG được kill');
  assert.equal(pidAlive(orphanChrome), true, 'chrome giả mồ côi KHÔNG được kill');
  assert.equal(r.cdpPortFreed, true);
  // Pidfile của app đã chết được dọn.
  assert.equal(readElectronPidfile(dir), null);
});

test('multi-pass thật: con của zygote chỉ thành mồ côi sau khi zygote chết', { timeout: 120000 }, async (t) => {
  const dir = tmpUserData(t);
  writeElectronPidfile(dir, { appPid: 999996, cdpPort: 19228, userDataDir: dir });
  // Helper ngoài: spawn zygote mock detached (argv0 electron giả); zygote
  // mock spawn renderer làm con ruột rồi in "RENDERER <pid>" ra stdout.
  // Helper ngoài đọc renderer pid rồi in "zygotePid rendererPid" và thoát
  // ngay → zygote thành mồ côi (ppid về 1), renderer vẫn là con zygote.
  const helper3 = path.join(os.tmpdir(), `vcut-i4-threelevel-${process.pid}.cjs`);
  fs.writeFileSync(helper3, `'use strict';
const { spawn } = require('node:child_process');
const dir = process.argv[2];
const argv0 = process.argv[3];
const zygotePath = process.argv[4];
const mockSleep = process.argv[5];
const zygote = spawn(process.execPath, [zygotePath, '--user-data-dir=' + dir, argv0, mockSleep, '--type=zygote'], { argv0, detached: true, stdio: ['ignore', 'pipe', 'ignore'] });
zygote.unref();
let buf = '';
zygote.stdout.on('data', (d) => { buf += d; });
const t0 = Date.now();
const iv = setInterval(() => {
  const m = buf.match(/RENDERER (\\d+)/);
  if (m || Date.now() - t0 > 10000) { clearInterval(iv); process.stdout.write(zygote.pid + ' ' + (m ? m[1] : '0')); process.exit(0); }
}, 100);
`);
  t.after(() => { try { fs.rmSync(helper3, { force: true }); } catch { /* bỏ qua */ } });
  const out = await new Promise((resolve, reject) => {
    const h = spawn(process.execPath, [helper3, dir, FAKE_ELECTRON_ARGV0, MOCK_ZYGOTE_PATH, MOCK_SLEEP_PATH], { stdio: ['ignore', 'pipe', 'pipe'] });
    let o = '';
    h.stdout.on('data', (d) => { o += d; });
    h.on('error', reject);
    h.on('close', () => resolve(o.trim()));
  });
  const [zygotePid, rendererPid] = out.split(' ').map(Number);
  assert.ok(zygotePid > 0 && rendererPid > 0, `không lấy được pid (out=${JSON.stringify(out)})`);
  t.after(() => { for (const p of [zygotePid, rendererPid]) { try { process.kill(p, 'SIGKILL'); } catch { /* đã chết */ } } });
  await waitFor(() => getParentPid(zygotePid) === 1, 10000, 'zygote mồ côi');
  assert.equal(getParentPid(rendererPid), zygotePid, 'renderer ban đầu là con của zygote (chưa mồ côi)');
  assert.equal(isOrphanProcess(rendererPid), false, 'renderer chưa mồ côi khi zygote còn sống');
  const r = await cleanupStaleElectronChildren(dir, { cdpPort: 19228 });
  assert.equal(r.action, 'orphan-killed', JSON.stringify(r));
  const killed = (r.killedPids || []).map((k) => k.pid);
  assert.ok(killed.includes(zygotePid), 'zygote phải bị kill');
  assert.ok(killed.includes(rendererPid), 'renderer phải bị kill ở lượt quét sau (multi-pass)');
  assert.ok((r.scannedPasses || 0) >= 2, `phải quét ≥2 lượt, thực tế ${r.scannedPasses}`);
  assert.equal(pidAlive(zygotePid), false);
  assert.equal(pidAlive(rendererPid), false);
});

test('main cũ mồ côi đúng appPid trong pidfile bị kill; main lạ thì không', { timeout: 120000 }, async (t) => {
  const dir = tmpUserData(t);
  // Main cũ mồ côi: argv0 electron, --user-data-dir khớp, KHÔNG có --type.
  const oldMain = await spawnOrphanMock(t, [MOCK_SLEEP_PATH, `--user-data-dir=${dir}`], FAKE_ELECTRON_ARGV0);
  writeElectronPidfile(dir, { appPid: oldMain, cdpPort: 19229, userDataDir: dir });
  // Main lạ mồ côi khác (cùng userDataDir nhưng pid khác appPid) — KHÔNG kill.
  const strangeMain = await spawnOrphanMock(t, [MOCK_SLEEP_PATH, `--user-data-dir=${dir}`], FAKE_ELECTRON_ARGV0);
  const r = await cleanupStaleElectronChildren(dir, { cdpPort: 19229 });
  assert.equal(r.action, 'orphan-killed', JSON.stringify(r));
  assert.ok((r.killedPids || []).some((k) => k.pid === oldMain && k.type === 'main'), 'main cũ đúng appPid phải bị kill');
  assert.equal(pidAlive(oldMain), false, 'main cũ phải chết');
  assert.equal(pidAlive(strangeMain), true, 'main lạ (pid khác appPid) KHÔNG được kill');
});

test('cmdline kiểu Chromium (flag nối bằng space trong 1 argv) vẫn bị dọn', { timeout: 120000 }, async (t) => {
  // HỒI QUY bug smoke lượt 1 (đợt 52 I4): con Chromium thật có /proc cmdline
  // là một chuỗi nối bằng space, không phải NUL-separated. Mock này mô
  // phỏng đúng dạng đó: flag --type/--user-data-dir nằm chung trong MỘT
  // phần tử argv (node vẫn chạy được mock script vì argv[1] là file script).
  const dir = tmpUserData(t);
  writeElectronPidfile(dir, { appPid: 999994, cdpPort: 19231, userDataDir: dir });
  const orphan = await spawnOrphanMock(
    t,
    [MOCK_SLEEP_PATH, `--type=renderer --user-data-dir=${dir}`],
    FAKE_ELECTRON_ARGV0,
  );
  assert.equal(isOrphanProcess(orphan), true);
  const ident = isVcutElectronChildProcess(orphan, { recordedAppPid: null, userDataDir: dir });
  assert.equal(ident.match, true, ident.reason);
  assert.equal(ident.type, 'child');
  const r = await cleanupStaleElectronChildren(dir, { cdpPort: 19231 });
  assert.equal(r.action, 'orphan-killed', JSON.stringify(r));
  assert.equal(pidAlive(orphan), false, 'renderer cmdline kiểu Chromium phải bị kill');
});

test('holder socket CDP là con VCut mồ côi bị kill; cổng CDP được giải phóng', { timeout: 120000 }, async (t) => {
  const dir = tmpUserData(t);
  writeElectronPidfile(dir, { appPid: 999995, cdpPort: 19230, userDataDir: dir });
  // Mock renderer mồ côi GIỮ socket listen trên cổng CDP (mô phỏng con
  // Electron kế thừa fd listen của main): mock tự listen rồi mới sleep.
  const holderPid = await spawnOrphanMock(
    t,
    [MOCK_SLEEP_PATH, '--listen-port=19230', '--type=renderer', `--user-data-dir=${dir}`],
    FAKE_ELECTRON_ARGV0,
  );
  await waitFor(async () => findSocketHolders(19230).some((h) => h.pid === holderPid), 10000, 'mock giữ socket CDP');
  const before = findSocketHolders(19230).map((h) => h.pid);
  assert.ok(before.includes(holderPid), `trước cleanup holder phải gồm mock: ${before}`);
  const r = await cleanupStaleElectronChildren(dir, { cdpPort: 19230 });
  assert.equal(r.action, 'orphan-killed', JSON.stringify(r));
  assert.equal(pidAlive(holderPid), false, 'holder mồ côi phải chết');
  assert.equal(r.cdpPortFreed, true, 'cổng CDP phải trống sau khi dọn');
  assert.equal(findSocketHolders(19230).length, 0, 'không còn ai giữ socket CDP');
});
