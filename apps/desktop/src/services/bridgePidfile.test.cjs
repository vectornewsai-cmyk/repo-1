'use strict';
/**
 * bridgePidfile.test.cjs — Test cho pidfile + dọn bridge mồ côi (đợt 51, H7).
 * Chạy bằng: node --test apps/desktop/src/services/bridgePidfile.test.cjs
 *
 * Quy ước: KHÔNG mock bằng stub — mock process là tiến trình node THẬT
 * (node -e sleep) mà argv chứa đúng đường dẫn bridge entry, để cmdline
 * trong /proc khớp như bridge thật nhưng không chạy bridge thật. Process
 * "lạ" là node -e sleep KHÔNG có bridge entry trong argv — cleanup BẮT
 * BUỘC không được kill nó (fail-closed), test assert process vẫn sống.
 *
 * Phần tích hợp spawn bridge THẬT qua ServiceManager (server/bridge thật)
 * để kiểm chứng: start() ghi pidfile, stop() xoá pidfile, start() dọn
 * pidfile stale + kill bridge mồ côi mock trước khi spawn bridge mới.
 *
 * LƯU Ý môi trường: test dùng userData tmp riêng + cổng pidfile 8899/8898
 * (không đụng 8787 của luồng khác); manager tự dò cổng trống nên chạy được
 * cả khi 8787 đang bị luồng khác giữ.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  cleanupStaleBridge,
  isVcutBridgeProcess,
  pidfilePath,
  readBridgePidfile,
  removeBridgePidfile,
  writeBridgePidfile,
} = require('./bridgePidfile');
const { createServiceManager } = require('./serviceManager');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const BRIDGE_ENTRY = path.join(REPO_ROOT, 'server/bridge/src/index.js');
const MOCK_PIDFILE_PORT = 8899;
const CDP_TEST_PORT = 18922; // cổng CDP giả cho unit test — KHÔNG dùng 9222 thật

function tmpUserData(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vcut-h7-test-'));
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

/**
 * Mock "bridge VCut": node thật, argv chứa đúng bridge entry nên
 * /proc/<pid>/cmdline khớp như bridge thật, nhưng chỉ sleep (không listen,
 * không chạy bridge). detached=true → process group leader như bridge do
 * manager spawn.
 */
function spawnMockBridge(t, { detached = true } = {}) {
  const child = spawn(
    process.execPath,
    ['-e', 'setTimeout(()=>{},60000);', BRIDGE_ENTRY],
    { detached, stdio: 'ignore' },
  );
  t.after(() => {
    try { if (pidAlive(child.pid)) process.kill(child.pid, 'SIGKILL'); } catch { /* bỏ qua */ }
  });
  return child;
}

/** Process lạ: node thật, KHÔNG có bridge entry trong argv. */
function spawnForeign(t) {
  const child = spawn(process.execPath, ['-e', 'setTimeout(()=>{},60000);'], { detached: true, stdio: 'ignore' });
  t.after(() => {
    try { if (pidAlive(child.pid)) process.kill(child.pid, 'SIGKILL'); } catch { /* bỏ qua */ }
  });
  return child;
}

test('pidfile: ghi/đọc/xoá round-trip', { timeout: 15000 }, async (t) => {
  const dir = tmpUserData(t);
  assert.equal(readBridgePidfile(dir), null);
  assert.equal(removeBridgePidfile(dir), false);
  assert.equal(writeBridgePidfile(dir, { pid: 12345, port: 8787 }), true);
  const rec = readBridgePidfile(dir);
  assert.equal(rec.pid, 12345);
  assert.equal(rec.port, 8787);
  assert.equal(rec.version, 1);
  assert.equal(fs.existsSync(pidfilePath(dir)), true);
  assert.equal(removeBridgePidfile(dir), true);
  assert.equal(removeBridgePidfile(dir), false);
  assert.equal(readBridgePidfile(dir), null);
});

test('pidfile: không có pidfile → cleanup action none, không làm gì', { timeout: 15000 }, async (t) => {
  const dir = tmpUserData(t);
  const res = await cleanupStaleBridge(dir, { cdpPort: CDP_TEST_PORT });
  assert.equal(res.action, 'none');
  assert.equal(fs.existsSync(pidfilePath(dir)), false);
});

test('pidfile hỏng → cleanup xoá file, không kill gì', { timeout: 15000 }, async (t) => {
  const dir = tmpUserData(t);
  fs.writeFileSync(pidfilePath(dir), 'không phải json {{{', 'utf8');
  const res = await cleanupStaleBridge(dir, { cdpPort: CDP_TEST_PORT });
  assert.equal(res.action, 'invalid-removed');
  assert.equal(fs.existsSync(pidfilePath(dir)), false);
});

test('pid đã chết → stale-pid-dead, xoá pidfile', { timeout: 15000 }, async (t) => {
  const dir = tmpUserData(t);
  const victim = spawnForeign(t);
  const deadPid = victim.pid;
  process.kill(deadPid, 'SIGKILL');
  await waitFor(() => !pidAlive(deadPid), 5000, 'process chết');
  writeBridgePidfile(dir, { pid: deadPid, port: MOCK_PIDFILE_PORT });
  const res = await cleanupStaleBridge(dir, { cdpPort: CDP_TEST_PORT });
  assert.equal(res.action, 'stale-pid-dead');
  assert.equal(res.pid, deadPid);
  assert.equal(fs.existsSync(pidfilePath(dir)), false);
});

test('isVcutBridgeProcess: mock bridge khớp, process lạ không khớp', { timeout: 15000 }, async (t) => {
  const mock = spawnMockBridge(t);
  const foreign = spawnForeign(t);
  await new Promise((r) => setTimeout(r, 300)); // chờ /proc có cmdline
  const a = isVcutBridgeProcess(mock.pid, BRIDGE_ENTRY);
  assert.equal(a.match, true, a.reason);
  assert.match(a.cmdline, /server\/bridge\/src\/index\.js/);
  const b = isVcutBridgeProcess(foreign.pid, BRIDGE_ENTRY);
  assert.equal(b.match, false, b.reason);
  const dead = isVcutBridgeProcess(999999);
  assert.equal(dead.match, false);
  assert.equal(dead.cmdline, null);
});

test('AN TOÀN: pid sống nhưng không phải bridge VCut → KHÔNG kill, chỉ xoá pidfile', { timeout: 15000 }, async (t) => {
  const dir = tmpUserData(t);
  const foreign = spawnForeign(t);
  assert.ok(pidAlive(foreign.pid));
  writeBridgePidfile(dir, { pid: foreign.pid, port: MOCK_PIDFILE_PORT });
  const res = await cleanupStaleBridge(dir, { cdpPort: CDP_TEST_PORT });
  assert.equal(res.action, 'alive-not-vcut');
  assert.equal(res.killed, false);
  assert.ok(pidAlive(foreign.pid), 'process lạ BỊ GIẾT — fail-closed đã vỡ!');
  assert.equal(fs.existsSync(pidfilePath(dir)), false, 'pidfile sai phải được xoá');
});

test('mock bridge detached (group leader) → orphan-killed, pid chết, pidfile xoá', { timeout: 30000 }, async (t) => {
  const dir = tmpUserData(t);
  const mock = spawnMockBridge(t, { detached: true });
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(pidAlive(mock.pid));
  writeBridgePidfile(dir, { pid: mock.pid, port: MOCK_PIDFILE_PORT });
  const res = await cleanupStaleBridge(dir, { cdpPort: CDP_TEST_PORT });
  assert.equal(res.action, 'orphan-killed');
  assert.equal(res.killed, true);
  assert.equal(res.pid, mock.pid);
  assert.equal(pidAlive(mock.pid), false, 'mock bridge vẫn sống sau cleanup');
  assert.equal(fs.existsSync(pidfilePath(dir)), false);
  assert.equal(res.cdpPortFreed, true);
});

test('mock bridge non-leader (chung group với cha) → chỉ kill đúng pid', { timeout: 30000 }, async (t) => {
  const dir = tmpUserData(t);
  // detached:false → mock chung process group với tiến trình test; kill cả
  // group sẽ giết luôn test runner nên cleanup BẮT BUỘC chỉ kill đúng pid.
  const mock = spawnMockBridge(t, { detached: false });
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(pidAlive(mock.pid));
  writeBridgePidfile(dir, { pid: mock.pid, port: MOCK_PIDFILE_PORT });
  const res = await cleanupStaleBridge(dir, { cdpPort: CDP_TEST_PORT });
  assert.equal(res.action, 'orphan-killed');
  assert.equal(res.killed, true);
  assert.equal(pidAlive(mock.pid), false, 'mock bridge vẫn sống sau cleanup');
  assert.ok(pidAlive(process.pid), 'test runner bị giết cùng group — guard pgrp đã vỡ!');
  assert.equal(fs.existsSync(pidfilePath(dir)), false);
});

test('manager: start ghi pidfile đúng pid/cổng, stop xoá pidfile', { timeout: 90000 }, async (t) => {
  const dir = tmpUserData(t);
  const manager = createServiceManager({ appRoot: REPO_ROOT, userDataDir: dir });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  assert.equal(snap.bridge.state, 'running');
  const rec = readBridgePidfile(dir);
  assert.ok(rec, 'start() phải ghi pidfile');
  assert.equal(rec.pid, snap.bridge.pid);
  assert.equal(rec.port, snap.bridge.port);
  assert.ok(pidAlive(snap.bridge.pid));
  await manager.stop();
  assert.equal(fs.existsSync(pidfilePath(dir)), false, 'stop() phải xoá pidfile');
  assert.equal(pidAlive(snap.bridge.pid), false, 'bridge vẫn sống sau stop()');
});

test('manager: start dọn pidfile stale (pid chết) rồi chạy bridge mới', { timeout: 90000 }, async (t) => {
  const dir = tmpUserData(t);
  const victim = spawnForeign(t);
  const deadPid = victim.pid;
  process.kill(deadPid, 'SIGKILL');
  await waitFor(() => !pidAlive(deadPid), 5000, 'process chết');
  writeBridgePidfile(dir, { pid: deadPid, port: MOCK_PIDFILE_PORT });
  const manager = createServiceManager({ appRoot: REPO_ROOT, userDataDir: dir });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  assert.equal(snap.bridge.state, 'running');
  const rec = readBridgePidfile(dir);
  assert.ok(rec, 'pidfile mới phải được ghi sau start()');
  assert.notEqual(rec.pid, deadPid);
  assert.equal(rec.pid, snap.bridge.pid);
});

test('manager: start kill bridge mồ côi mock rồi spawn bridge mới', { timeout: 90000 }, async (t) => {
  const dir = tmpUserData(t);
  const mock = spawnMockBridge(t, { detached: true });
  await new Promise((r) => setTimeout(r, 300));
  writeBridgePidfile(dir, { pid: mock.pid, port: MOCK_PIDFILE_PORT });
  const manager = createServiceManager({ appRoot: REPO_ROOT, userDataDir: dir });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  assert.equal(snap.bridge.state, 'running');
  assert.equal(pidAlive(mock.pid), false, 'bridge mồ côi mock vẫn sống sau start()');
  const rec = readBridgePidfile(dir);
  assert.ok(rec);
  assert.equal(rec.pid, snap.bridge.pid);
  assert.notEqual(rec.pid, mock.pid);
});

test('manager: start KHÔNG kill process lạ trong pidfile', { timeout: 90000 }, async (t) => {
  const dir = tmpUserData(t);
  const foreign = spawnForeign(t);
  writeBridgePidfile(dir, { pid: foreign.pid, port: MOCK_PIDFILE_PORT });
  const manager = createServiceManager({ appRoot: REPO_ROOT, userDataDir: dir });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  assert.equal(snap.bridge.state, 'running');
  assert.ok(pidAlive(foreign.pid), 'process lạ BỊ GIẾT bởi start() — fail-closed đã vỡ!');
  // Pidfile sai đã xoá, pidfile mới trỏ đúng bridge của manager.
  const rec = readBridgePidfile(dir);
  assert.ok(rec);
  assert.equal(rec.pid, snap.bridge.pid);
});

/**
 * Fake appRoot: bridge giả chỉ trả /api/health (không chạy bridge thật).
 * 'slow'  → health trả sau 600ms (chậm hơn tick 250ms của vòng poll cũ).
 * 'never' → health luôn 404 (không bao giờ healthy).
 */
function makeFakeBridgeAppRoot(t, mode) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vcut-h7-fakeapp-'));
  t.after(() => {
    try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  });
  const dir = path.join(root, 'server', 'bridge', 'src');
  fs.mkdirSync(dir, { recursive: true });
  const script = mode === 'slow'
    ? `const http=require('node:http');const port=Number(process.env.BRIDGE_PORT||8787);` +
      `http.createServer((req,res)=>{if(req.url==='/api/health'){` +
      `setTimeout(()=>{res.writeHead(200,{'Content-Type':'application/json'});` +
      `res.end(JSON.stringify({ok:true,version:'fake-slow'}));},600);}` +
      `else{res.writeHead(404);res.end();}}).listen(port,'127.0.0.1',()=>console.log('fake-slow bridge on '+port));`
    : `const http=require('node:http');const port=Number(process.env.BRIDGE_PORT||8787);` +
      `http.createServer((req,res)=>{res.writeHead(404);res.end();})` +
      `.listen(port,'127.0.0.1',()=>console.log('fake-never bridge on '+port));`;
  fs.writeFileSync(path.join(dir, 'index.js'), script, 'utf8');
  return root;
}

test('manager: bridge trả health chậm 600ms vẫn start được (sửa race poll 250ms)', { timeout: 90000 }, async (t) => {
  // Hồi quy cho bug gặp thật trong smoke H7: vòng poll cũ race healthCheck
  // với tick 250ms nên response chậm hơn 250ms bị vứt — manager chờ đủ 30s
  // rồi báo "không healthy" dù bridge đang chạy tốt (health thật đo được
  // 168–300ms/lần dưới tải). Fake bridge này delay đúng 600ms: code cũ
  // fail sau 30s, code mới phải pass trong vài giây.
  const dir = tmpUserData(t);
  const fakeRoot = makeFakeBridgeAppRoot(t, 'slow');
  const manager = createServiceManager({ appRoot: fakeRoot, userDataDir: dir });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  assert.equal(snap.bridge.state, 'running');
  assert.ok(snap.bridge.pid > 0);
  const rec = readBridgePidfile(dir);
  assert.ok(rec);
  assert.equal(rec.pid, snap.bridge.pid);
  await manager.stop();
  assert.equal(fs.existsSync(pidfilePath(dir)), false);
});

test('manager: pidfile được ghi NGAY khi spawn, trước khi bridge healthy', { timeout: 90000 }, async (t) => {
  // Hồi quy cho bug gặp thật trong smoke H7: pidfile cũ chỉ ghi sau khi
  // healthy nên app bị kill -9 giữa lúc chờ health để lại bridge mồ côi
  // "vô hình" (không pidfile → lần chạy sau không dọn được). Fake bridge
  // này không bao giờ healthy: pidfile vẫn phải xuất hiện trong lúc chờ.
  const dir = tmpUserData(t);
  const fakeRoot = makeFakeBridgeAppRoot(t, 'never');
  const manager = createServiceManager({ appRoot: fakeRoot, userDataDir: dir });
  t.after(() => manager.stop().catch(() => {}));
  const startP = manager.start();
  startP.catch(() => {}); // tránh unhandled rejection trước khi assert
  await new Promise((r) => setTimeout(r, 3000));
  const rec = readBridgePidfile(dir);
  assert.ok(rec, 'pidfile phải có NGAY khi spawn, trước khi bridge healthy');
  assert.ok(pidAlive(rec.pid), 'fake bridge phải sống trong lúc chờ health');
  // Dọn: kill fake bridge → start() phải reject "thoát sớm" ngay (không
  // chờ đủ 30s), và catch của start() phải xoá pidfile.
  process.kill(rec.pid, 'SIGKILL');
  await assert.rejects(startP, /thoát sớm/);
  assert.equal(fs.existsSync(pidfilePath(dir)), false, 'catch của start() phải xoá pidfile');
});
