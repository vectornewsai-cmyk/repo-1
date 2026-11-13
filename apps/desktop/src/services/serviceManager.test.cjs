'use strict';
/**
 * serviceManager.test.cjs — Test thật cho ServiceManager (không mock service).
 * Chạy bằng: node --test apps/desktop/src/services/serviceManager.test.cjs
 * (nên chạy dưới xvfb-run để khớp điều kiện test desktop; module không cần
 * màn hình nhưng Electron app thì cần.)
 *
 * Các test spawn bridge THẬT (server/bridge/src/index.js) và kiểm tra:
 *  - cổng bận → tự đổi cổng, health trả lời
 *  - snapshot AI phản ánh đúng thực tế máy này (venv có/thiếu)
 *  - crash (SIGKILL) → restart có giới hạn, chạy lại được
 *  - stop() sạch: không còn tiến trình bridge (pgrep) và group đã chết
 *  - killProcessGroup dọn cả cháu trong group
 *  - node binary sai → lỗi rõ ràng, không treo
 *
 * LƯU Ý môi trường: các assert về AI (caption/tts có, bgremove thiếu) đúng
 * trên VM này (xem docs/PHASE10_G2_SERVICES_LIMITS.md). Trên máy khác có đủ
 * venv/model thì kết quả probe khác — test assert theo trạng thái probe trả
 * về (available + reason) chứ không hardcode hết mọi service.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const { createServiceManager, killProcessGroup, startTimeoutForLoad, findFreePort } = require('./serviceManager');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

// Đợt 52 I4 — timeout khởi động thích ứng theo tải (thay 30s cứng):
// máy yên → 30s như cũ; tải cao → nới tới trần 120s.
test('startTimeoutForLoad: máy yên 30s, tải cao nới tới trần 120s', () => {
  assert.equal(startTimeoutForLoad(0, 4), 30000);
  assert.equal(startTimeoutForLoad(1, 4), 30000, 'load 1/4 CPU → vẫn 30s');
  assert.equal(startTimeoutForLoad(4, 4), 30000, 'load = CPU → vẫn 30s');
  assert.equal(startTimeoutForLoad(8, 4), 60000, 'load gấp đôi CPU → 60s');
  assert.equal(startTimeoutForLoad(12, 4), 90000, 'load gấp 3 CPU → 90s');
  assert.equal(startTimeoutForLoad(16, 4), 120000, 'load gấp 4 CPU → trần 120s');
  assert.equal(startTimeoutForLoad(40, 2), 120000, 'load gấp 20 CPU → vẫn trần 120s');
  assert.equal(startTimeoutForLoad(1, 0), 30000, 'cpuCount 0 → coi như 1 CPU');
  assert.equal(startTimeoutForLoad(NaN, 4), 30000, 'load NaN → 30s');
});

function tmpUserData(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vcut-g2-test-'));
  t.after(() => {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  });
  return dir;
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function waitFor(cond, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await cond()) return;
    if (Date.now() >= deadline) throw new Error(`timeout chờ: ${label}`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

// LƯU Ý: KHÔNG dùng pgrep -f để kiểm tra mồ côi — VM này chạy nhiều luồng
// Phase 10 song song, luồng khác có thể đang chạy bridge riêng, và pgrep -f
// còn tự khớp cả shell chứa chuỗi lệnh. Kiểm tra chính xác bằng pid + pgid
// của chính bridge mà manager đã spawn (detached → pgid == pid).
function groupAlive(pid) {
  if (process.platform === 'win32') return pidAlive(pid);
  try { process.kill(-pid, 0); return true; } catch { return false; }
}

test('bridge khởi động được, health ok, log ghi file', { timeout: 180000 }, async (t) => {
  const manager = createServiceManager({
    appRoot: REPO_ROOT,
    userDataDir: tmpUserData(t),
  });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  assert.equal(snap.bridge.state, 'running');
  assert.ok(snap.bridge.port >= 8787 && snap.bridge.port < 8797, `port ${snap.bridge.port}`);
  assert.ok(snap.bridge.pid > 0);
  assert.equal(snap.ffmpeg.available, true);
  assert.equal(snap.render.mode, 'on-demand');
  assert.equal(snap.render.available, true);

  const health = await getJson(`${snap.bridge.url}/api/health`);
  assert.equal(health.ok, true);
  assert.equal(health.ffmpeg, true);

  const logs = fs.readdirSync(path.join(manager.userDataDir, 'logs'));
  assert.ok(logs.some((f) => f.startsWith('bridge-') && f.endsWith('.log')));
  const bridgeLog = fs.readFileSync(
    path.join(manager.userDataDir, 'logs', logs.find((f) => f.startsWith('bridge-'))),
    'utf8',
  );
  assert.ok(bridgeLog.includes('VCut bridge server'), 'log bridge có dòng khởi động');
  assert.ok(fs.existsSync(path.join(manager.userDataDir, 'bridge-jobs')), 'work dir bridge-jobs được tạo');
});

test('cổng ưu tiên bận → tự dùng cổng trống và báo đúng URL thật', { timeout: 180000 }, async (t) => {
  // Đợt 52 I4 — KHÔNG hardcode 8787 nữa: cổng 8787 hay bị bridge của luồng
  // khác giữ lúc chạy song song (flake H7 chạy 3: blocker không bind được
  // 8787 ngay lúc setup, EADDRINUSE trước khi chạy code manager). Dùng
  // cổng trống ở dải cao làm cổng ưu tiên của test này.
  const preferred = await findFreePort(18870);
  const blocker = net.createServer();
  // Đợt 52 I4 — fail nhanh nếu không bind được cổng ưu tiên (vd: bridge
  // của lượt chạy trước còn giữ): không có handler thì promise này treo
  // tới hết timeout test mà không báo gì.
  await new Promise((resolve, reject) => {
    blocker.once('error', reject);
    blocker.listen(preferred, '127.0.0.1', resolve);
  });
  t.after(() => blocker.close());

  const manager = createServiceManager({
    appRoot: REPO_ROOT,
    userDataDir: tmpUserData(t),
    preferredPort: preferred,
  });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  assert.equal(snap.bridge.state, 'running');
  assert.notEqual(snap.bridge.port, preferred);
  assert.equal(snap.bridge.url, `http://127.0.0.1:${snap.bridge.port}`);
  const health = await getJson(`${snap.bridge.url}/api/health`);
  assert.equal(health.ok, true);
});

test('probe AI phản ánh đúng thực tế máy này', { timeout: 180000 }, async (t) => {
  const manager = createServiceManager({
    appRoot: REPO_ROOT,
    userDataDir: tmpUserData(t),
  });
  t.after(() => manager.stop().catch(() => {}));
  const snap = await manager.start();
  const ai = snap.ai;
  for (const id of ['caption', 'translate', 'tts', 'bgremove', 'reframe', 'silence', 'scene', 'beats']) {
    assert.ok(ai[id], `thiếu service ${id} trong snapshot`);
    assert.equal(typeof ai[id].available, 'boolean', id);
    assert.equal(typeof ai[id].python, 'string', id);
    assert.equal(typeof ai[id].script, 'string', id);
  }
  // Máy này: venv caption (.venv, faster_whisper) và tts (.venv2, onnxruntime) có sẵn.
  assert.equal(ai.caption.available, true, ai.caption.reason || '');
  assert.equal(ai.caption.pythonSource, 'venv');
  assert.equal(ai.tts.available, true, ai.tts.reason || '');
  assert.equal(ai.tts.pythonSource, 'venv');
  // ROUND83-K7 — bgremove: khóa theo THỰC TẾ máy này, không hardcode
  // "thiếu". Từ đợt 53 J8, server/bgremove/.venv đã có rembg import
  // được (đo tay 11/11: `import rembg` OK) + model BiRefNet có trong
  // ~/.u2net, và fix probe 15s → 120s của J8 đợt 82 làm import sâu hoàn
  // thành thay vì timeout → available:true là ĐÚNG. Trước fix J8, test
  // pass nhờ timeout 15s báo sai (false-negative). Venv có thì true,
  // không thì false + lý do rembg/BiRefNet như cũ.
  const bgVenvPy = path.join(REPO_ROOT, 'server', 'bgremove', '.venv', 'bin', 'python');
  if (fs.existsSync(bgVenvPy)) {
    assert.equal(ai.bgremove.available, true, ai.bgremove.reason || '');
    assert.equal(ai.bgremove.pythonSource, 'venv');
  } else {
    assert.equal(ai.bgremove.available, false);
    // Đợt 52 I4 — lý do có thể là "thiếu rembg" HOẶC "thiếu model BiRefNet"
    // (luồng I5 đợt 52 thêm kiểm tra model trước khi kiểm tra module — xem
    // MODEL_CHECKS trong pythonServices.js): cả hai đều nghĩa là bgremove
    // chưa chạy được trên máy này. Chỉ khóa "chưa chạy được", không khóa
    // đúng một chuỗi lý do (chuỗi đó là chi tiết implement của probe).
    assert.match(ai.bgremove.reason || '', /rembg|BiRefNet/);
  }
  // reframe: bridge tự ưu tiên .venv có cv2.
  assert.equal(ai.reframe.available, true, ai.reframe.reason || '');
  // beats: numpy có trong system python3.
  assert.equal(ai.beats.available, true, ai.beats.reason || '');
});

test('bridge bị SIGKILL → restart có giới hạn và chạy lại được', { timeout: 180000 }, async (t) => {
  const manager = createServiceManager({
    appRoot: REPO_ROOT,
    userDataDir: tmpUserData(t),
    maxRestarts: 3,
  });
  t.after(() => manager.stop().catch(() => {}));
  const snap1 = await manager.start();
  const pid1 = snap1.bridge.pid;
  assert.ok(pid1 > 0);
  process.kill(pid1, 'SIGKILL');
  await waitFor(() => {
    const s = manager.getStatus();
    return s.bridge.state === 'running' && s.bridge.pid !== pid1;
  }, 60000, 'bridge restart sau SIGKILL');
  const snap2 = manager.getStatus();
  assert.ok(snap2.bridge.restarts >= 1, `restarts=${snap2.bridge.restarts}`);
  assert.ok(snap2.bridge.pid > 0 && snap2.bridge.pid !== pid1);
  const health = await getJson(`${snap2.bridge.url}/api/health`);
  assert.equal(health.ok, true);
});

test('stop() tắt sạch: pid và cả process group đều chết, không mồ côi', { timeout: 180000 }, async (t) => {
  const manager = createServiceManager({
    appRoot: REPO_ROOT,
    userDataDir: tmpUserData(t),
  });
  const snap = await manager.start();
  const pid = snap.bridge.pid;
  assert.ok(pidAlive(pid));
  assert.ok(groupAlive(pid), 'process group của bridge phải sống khi đang chạy');
  const stopped = await manager.stop();
  assert.equal(stopped.bridge.state, 'stopped');
  assert.equal(stopped.bridge.pid, null);
  assert.equal(pidAlive(pid), false, 'pid bridge vẫn sống sau stop()');
  await waitFor(() => !groupAlive(pid), 10000, 'process group chết sau stop()');
  assert.equal(groupAlive(pid), false, 'process group vẫn sống sau stop()');
});

test('killProcessGroup dọn cả tiến trình cháu trong group', { timeout: 30000 }, async (t) => {
  // Spawn group leader (detached) mà nó tự spawn thêm 1 cháu; leader in pid cháu ra stdout.
  const leader = spawn(
    process.execPath,
    ['-e', 'const {spawn}=require("child_process"); const c=spawn(process.execPath,["-e","setTimeout(()=>{},60000)"]); console.log("CHILD "+c.pid); setTimeout(()=>{},60000);'],
    { detached: true, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  t.after(() => { try { killProcessGroup(leader.pid, 'SIGKILL'); } catch { /* bỏ qua */ } });
  const childPid = await new Promise((resolve, reject) => {
    let buf = '';
    leader.stdout.on('data', (d) => {
      buf += d;
      const m = buf.match(/CHILD (\d+)/);
      if (m) resolve(Number(m[1]));
    });
    setTimeout(() => reject(new Error('không đọc được pid cháu')), 5000);
  });
  assert.ok(pidAlive(leader.pid));
  assert.ok(pidAlive(childPid));
  killProcessGroup(leader.pid, 'SIGTERM');
  await waitFor(() => !pidAlive(leader.pid) && !pidAlive(childPid), 10000, 'cả group chết sau SIGTERM');
  assert.equal(pidAlive(leader.pid), false);
  assert.equal(pidAlive(childPid), false);
});

test('node binary sai → start() reject với lỗi rõ ràng, không treo', { timeout: 30000 }, async (t) => {
  const manager = createServiceManager({
    appRoot: REPO_ROOT,
    userDataDir: tmpUserData(t),
    nodeBin: '/nonexistent/node-binary-xyz',
  });
  t.after(() => manager.stop().catch(() => {}));
  await assert.rejects(() => manager.start(), /node/i);
  assert.equal(manager.getStatus().bridge.state, 'failed');
});

test('trạng thái đẩy qua event, không cần poll', { timeout: 180000 }, async (t) => {
  const seen = [];
  const manager = createServiceManager({
    appRoot: REPO_ROOT,
    userDataDir: tmpUserData(t),
    onStatus: (snap) => seen.push(snap.bridge.state),
  });
  t.after(() => manager.stop().catch(() => {}));
  await manager.start();
  assert.ok(seen.includes('starting'), `events: ${seen.join(',')}`);
  assert.ok(seen.includes('running'), `events: ${seen.join(',')}`);
  await manager.stop();
  assert.ok(seen.includes('stopped'), `events: ${seen.join(',')}`);
});


test('stop() trong lúc start() đang chạy dở thì huỷ start, không để bridge mồ côi', { timeout: 90000 }, async (t) => {
  // Đợt 52 I4 — hồi quy race stop-trong-start (lần chạy cuối đợt 52: runner
  // treo >6 phút, bridge mồ côi 39059 còn sống trên cổng 18870 sau khi test
  // timeout trong lúc start() đang bay). Hai cửa sổ đều phải huỷ sạch:
  // (A) stop() gọi ngay sau start(), lúc start() còn đang dọn stale / dò
  // cổng (chưa spawn); (B) stop() gọi lúc start() đang chờ healthy.
  // --- Pha A: stop() ngay sau start() (cửa sổ pre-spawn) ---
  const dirA = tmpUserData(t);
  const portA = await findFreePort(18900);
  const managerA = createServiceManager({
    appRoot: REPO_ROOT, userDataDir: dirA, preferredPort: portA,
  });
  const startA = managerA.start();
  startA.catch(() => {}); // tránh unhandled rejection trước khi assert
  await managerA.stop(); // gọi ngay khi start() còn đang dọn stale
  await assert.rejects(startA, /huỷ/);
  assert.equal(managerA.getStatus().bridge.state, 'stopped');
  await assert.rejects(getJson(`http://127.0.0.1:${portA}/api/health`));

  // --- Pha B: stop() lúc đang chờ healthy (cửa sổ health-wait) ---
  // Wrapper chỉ ngủ khi chạy bridge thật (không ngủ với --version để
  // _checkNodeBin không timeout 5s): start() kẹt ở vòng chờ healthy.
  const dirB = tmpUserData(t);
  const portB = await findFreePort(18920);
  const wrapper = path.join(dirB, 'slow-node.sh');
  fs.writeFileSync(wrapper, '#!/bin/sh\ncase "$1" in *server/bridge/src/index.js*) sleep 5;; esac\nexec node "$@"\n');
  fs.chmodSync(wrapper, 0o755);
  const managerB = createServiceManager({
    appRoot: REPO_ROOT, userDataDir: dirB, preferredPort: portB, nodeBin: wrapper,
  });
  t.after(() => managerB.stop().catch(() => {}));
  const startB = managerB.start();
  startB.catch(() => {});
  // Chờ tới khi bridge đã spawn (log ghi 'spawn bridge') — lúc đó start()
  // chắc chắn đang ở vòng chờ healthy, chưa healthy (wrapper còn đang ngủ).
  const logB = path.join(dirB, 'logs', 'service-manager.log');
  await waitFor(() => {
    try { return fs.readFileSync(logB, 'utf8').includes('spawn bridge'); } catch { return false; }
  }, 20000, 'log ghi spawn bridge');
  await managerB.stop();
  await assert.rejects(startB, /huỷ/);
  assert.equal(managerB.getStatus().bridge.state, 'stopped');
  await assert.rejects(getJson(`http://127.0.0.1:${portB}/api/health`));
  // start() lại sau stop() vẫn chạy được (cờ _stopping đã reset).
  const snap2 = await managerB.start();
  assert.equal(snap2.bridge.state, 'running');
});
