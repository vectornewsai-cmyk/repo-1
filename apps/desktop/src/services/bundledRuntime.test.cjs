'use strict';
/**
 * bundledRuntime.test.cjs — Unit test cho loader bundledRuntime (ROUND51-H8).
 *
 * Chạy sau `npm run build` (cần dist/services/bundledRuntime.js đã biên dịch):
 *   cd apps/desktop && npm run build && node --test src/services/bundledRuntime.test.cjs
 *
 * Test hàm thuần resolveBundledRuntime/applyBundledRuntimeEnv bằng fixture
 * thư mục tạm — không cần Electron, không spawn tiến trình thật.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveBundledRuntime, ensureBundledRuntimeExecutable } = require(
  '../../dist/services/bundledRuntime.js',
);

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..'); // src/services → repo root

function makeFixture({ withBridge = true, withBundledNode = false } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vcut-h8-rt-'));
  const bundled = path.join(tmp, 'resources', 'vcut-server');
  if (withBridge) {
    for (const rel of ['server/bridge/src/index.js', 'server/render/src/render.js']) {
      const p = path.join(bundled, rel);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, '// fixture\n');
    }
    // Launcher bin/vcut-node (như cây stage thật).
    const launcher = path.join(bundled, 'bin', 'vcut-node');
    fs.mkdirSync(path.dirname(launcher), { recursive: true });
    fs.writeFileSync(launcher, '#!/bin/sh\nexec env ELECTRON_RUN_AS_NODE=1 "$0" "$@"\n');
    fs.chmodSync(launcher, 0o755);
  }
  if (withBundledNode) {
    const bin = path.join(bundled, 'bin', 'node');
    fs.mkdirSync(path.dirname(bin), { recursive: true });
    fs.writeFileSync(bin, '#!/bin/sh\necho fixture-node\n');
    fs.chmodSync(bin, 0o755);
  }
  return { tmp, bundled };
}

test('dev: appRoot là repo root, bridge thật tồn tại, mode system-node', () => {
  const rt = resolveBundledRuntime({
    isPackaged: false,
    resourcesPath: '/khong-co/resources',
    repoRoot: REPO_ROOT,
    execPath: '/khong-co/electron',
    env: {},
  });
  assert.equal(rt.appRoot, REPO_ROOT);
  assert.equal(rt.mode, 'system-node');
  assert.equal(rt.nodeBin, 'node');
  assert.equal(rt.ok, true);
  assert.ok(fs.existsSync(rt.bridgeEntry), 'bridge entry dev phải tồn tại');
  assert.ok(fs.existsSync(rt.renderEntry), 'render entry dev phải tồn tại');
  assert.deepEqual(rt.nodeEnv, {});
});

test('packaged + có bundle: electron-as-node qua launcher bin/vcut-node', () => {
  const { tmp, bundled } = makeFixture();
  const rt = resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: path.join(tmp, 'resources'),
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: {},
  });
  assert.equal(rt.appRoot, bundled);
  assert.equal(rt.mode, 'electron-as-node');
  assert.equal(rt.nodeBin, path.join(bundled, 'bin', 'vcut-node'));
  // QUAN TRỌNG: KHÔNG đặt ELECTRON_RUN_AS_NODE vào env main process
  // (làm nhiễm tiến trình con Chromium) — launcher tự đặt trong cây bridge.
  assert.deepEqual(rt.nodeEnv, {});
  assert.equal(rt.ok, true);
  assert.equal(rt.bridgeEntry, path.join(bundled, 'server', 'bridge', 'src', 'index.js'));
});

test('packaged + có bundle nhưng THIẾU launcher: fallback node hệ thống', () => {
  const { tmp, bundled } = makeFixture();
  fs.rmSync(path.join(bundled, 'bin', 'vcut-node'));
  const rt = resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: path.join(tmp, 'resources'),
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: {},
  });
  assert.equal(rt.mode, 'system-node');
  assert.equal(rt.nodeBin, 'node');
  assert.equal(rt.ok, true); // bridge vẫn có, chỉ node đổi sang hệ thống
});

test('resolve KHÔNG chạm vào process.env (không làm nhiễm Chromium)', () => {
  const { bundled } = makeFixture();
  const env = {};
  resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: path.dirname(bundled),
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env,
  });
  assert.equal(env.ELECTRON_RUN_AS_NODE, undefined);
  assert.equal(process.env.ELECTRON_RUN_AS_NODE, undefined);
});

test('ensureBundledRuntimeExecutable: chmod lại launcher mất bit +x', () => {
  const { bundled } = makeFixture();
  const launcher = path.join(bundled, 'bin', 'vcut-node');
  fs.chmodSync(launcher, 0o644);
  const rt = resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: path.dirname(bundled),
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: {},
  });
  assert.equal(ensureBundledRuntimeExecutable(rt), true);
  assert.ok((fs.statSync(launcher).mode & 0o111) !== 0, 'launcher phải có bit +x sau ensure');
});

test('packaged + KHÔNG có bundle: fallback appRoot resources/app, ok=false', () => {
  const { tmp } = makeFixture({ withBridge: false });
  const rt = resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: path.join(tmp, 'resources'),
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: {},
  });
  assert.equal(rt.appRoot, path.join(tmp, 'resources', 'app'));
  assert.equal(rt.mode, 'system-node');
  assert.equal(rt.nodeBin, 'node');
  assert.equal(rt.ok, false);
  assert.match(rt.detail, /KHÔNG có bridge trong gói/);
});

test('packaged + có bin/node: bundled-node thắng electron-as-node', () => {
  const { bundled } = makeFixture({ withBundledNode: true });
  const rt = resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: path.dirname(bundled),
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: {},
  });
  assert.equal(rt.mode, 'bundled-node');
  assert.equal(rt.nodeBin, path.join(bundled, 'bin', 'node'));
  assert.deepEqual(rt.nodeEnv, {});
  assert.equal(rt.ok, true);
});

test('VCUT_NODE thắng mọi chế độ (kể cả packaged + bundle)', () => {
  const { bundled } = makeFixture();
  const rt = resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: path.dirname(bundled),
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: { VCUT_NODE: '/usr/local/bin/node20' },
  });
  assert.equal(rt.mode, 'system-node');
  assert.equal(rt.nodeBin, '/usr/local/bin/node20');
  assert.deepEqual(rt.nodeEnv, {});
  assert.equal(rt.ok, true);
});

test('ensureBundledRuntimeExecutable: no-op ở chế độ system-node', () => {
  const rtSystem = resolveBundledRuntime({
    isPackaged: false,
    resourcesPath: '/khong-co/resources',
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: {},
  });
  assert.equal(ensureBundledRuntimeExecutable(rtSystem), true);
});

test('cây bundle đã stage thật (nếu có): resolve qua override ra ok=true', (t) => {
  const staged = path.join(REPO_ROOT, 'apps', 'desktop', 'build', 'bundled-server');
  if (!fs.existsSync(path.join(staged, 'server', 'bridge', 'src', 'index.js'))) {
    t.skip('chưa chạy copy-bundled-server.mjs — bỏ qua kiểm tra cây thật');
    return;
  }
  const rt = resolveBundledRuntime({
    isPackaged: true,
    resourcesPath: '/khong-co/resources',
    repoRoot: REPO_ROOT,
    execPath: '/opt/vcut/vcut-studio',
    env: {},
    bundledServerDirOverride: staged,
  });
  assert.equal(rt.mode, 'electron-as-node');
  assert.equal(rt.ok, true);
  assert.ok(fs.existsSync(rt.bridgeEntry));
  assert.ok(fs.existsSync(rt.renderEntry));
  assert.ok(fs.existsSync(path.join(staged, 'bin', 'vcut-node')));
  assert.ok(fs.existsSync(path.join(staged, 'server', 'node_modules', 'express', 'package.json')));
  assert.ok(fs.existsSync(path.join(staged, 'assets', 'filters')));
});
