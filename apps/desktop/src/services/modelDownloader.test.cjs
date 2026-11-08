'use strict';
/**
 * modelDownloader.test.cjs — Unit test cho modelDownloader.js (ROUND52-I5).
 *
 * Chạy:  cd apps/desktop && node --test src/services/modelDownloader.test.cjs
 *
 * NGUYÊN TẮC KIỂM CHỨNG (theo luật cứng của dự án): KHÔNG mock kết quả tải
 * thật. Các test 1–6 dùng HTTP server local thật (node:http, có hỗ trợ Range
 * như HF CDN) để chứng minh đường tải + resume + verify; test 7 tải 1 file
 * THẬT từ Hugging Face (config.json của faster-whisper-small, 2.370 byte)
 * và verify SHA256 với manifest. Test 7 cần mạng — fail thì báo rõ là lỗi
 * mạng, không phải lỗi downloader (xem LIMITS I5).
 *
 * ROUND53-J8: bgremove-birefnet nay đã verify (SHA256 khóa từ file thật
 * ~/.u2net/birefnet-general.onnx) nên test 1 kỳ vọng 4/4 model verified;
 * test "model chưa verify → từ chối" dùng model giả tổng hợp thay vì
 * bgremove thật. Thêm test 8–10 cho kiểm tra dung lượng trống trước khi
 * tải (ensureFreeDiskSpace / estimateRemainingBytes).
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  checkAllModels,
  checkModel,
  downloadFile,
  downloadModel,
  ensureFreeDiskSpace,
  estimateRemainingBytes,
  loadManifest,
  resolveModelsRoot,
} = require('./modelDownloader');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function tmpDir(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'vcut-modeldl-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

/** Server local thật: phục vụ file từ bộ nhớ, hỗ trợ Range + đếm request. */
function startFixtureServer(t, files) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ url: req.url, range: req.headers.range || null });
    const buf = files[req.url];
    if (!buf) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    // Chế độ drip: /slow trả từng chunk 64KB mỗi 50ms (để test hủy giữa chừng).
    if (req.url === '/slow') {
      res.writeHead(200, {
        'Content-Length': buf.length,
        'Accept-Ranges': 'bytes',
      });
      let off = 0;
      const timer = setInterval(() => {
        if (off >= buf.length) {
          clearInterval(timer);
          res.end();
          return;
        }
        const end = Math.min(off + 65536, buf.length);
        res.write(buf.subarray(off, end));
        off = end;
      }, 50);
      req.on('close', () => clearInterval(timer));
      return;
    }
    const m = /^bytes=(\d+)-$/.exec(req.headers.range || '');
    if (m) {
      const start = Number(m[1]);
      if (start >= buf.length) {
        res.writeHead(416, { 'Content-Range': `bytes */${buf.length}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${buf.length - 1}/${buf.length}`,
        'Content-Length': buf.length - start,
        'Accept-Ranges': 'bytes',
      });
      res.end(buf.subarray(start));
      return;
    }
    res.writeHead(200, { 'Content-Length': buf.length, 'Accept-Ranges': 'bytes' });
    res.end(buf);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      t.after(() => server.close());
      resolve({ server, port: server.address().port, seen });
    });
  });
}

function fixtureModel(port, files) {
  return {
    id: 'test-small',
    service: 'caption',
    label: 'Model test (fixture local)',
    repo: 'test/fixture',
    license: 'MIT',
    licenseUrl: 'https://example.invalid/',
    repoDir: 'server/test/models',
    subdir: 'test-small',
    completeMarker: '.vcut-complete',
    required: ['a.txt'],
    sizeLabel: 'test',
    verified: true,
    totalBytes: files.reduce((s, f) => s + f.buf.length, 0),
    files: files.map((f) => ({
      path: f.path,
      url: `http://127.0.0.1:${port}${f.url}`,
      sha256: sha256(f.buf),
      size: f.buf.length,
    })),
  };
}

const rootUnified = (dir) => ({ root: dir, layout: 'unified' });

test('manifest thật load được + đủ 4 model đã verify (J8: bgremove đã khóa SHA256)', () => {
  const m = loadManifest();
  assert.equal(m.version, 1);
  const ids = m.models.map((x) => x.id).sort();
  assert.deepEqual(ids, ['bgremove-birefnet', 'caption-small', 'tts-codec', 'tts-turbo']);
  const verified = m.models.filter((x) => x.verified);
  assert.equal(verified.length, 4);
  const bg = m.models.find((x) => x.id === 'bgremove-birefnet');
  assert.equal(bg.verified, true);
  // J8: URL gốc là BiRefNet-general-epoch_244.onnx (URL cũ .../birefnet-general.onnx
  // trả 404); file đích vẫn là birefnet-general.onnx (rembg đặt tên lại khi tải).
  assert.equal(
    bg.files[0].url,
    'https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx',
  );
  assert.equal(bg.files[0].path, 'birefnet-general.onnx');
  assert.equal(bg.files[0].size, 972666916);
  assert.match(bg.files[0].sha256, /^[0-9a-f]{64}$/);
  // Mọi file đã verify đều có sha256 64 ký tự hex + size > 0.
  for (const mod of verified) {
    assert.ok(mod.totalBytes > 0, mod.id);
    for (const f of mod.files) {
      assert.match(f.sha256, /^[0-9a-f]{64}$/, `${mod.id}/${f.path}`);
      assert.ok(f.size > 0, `${mod.id}/${f.path}`);
    }
  }
});

test('resolveModelsRoot: repo có model → layout repo; không có → unified userData', (t) => {
  const d = tmpDir(t);
  const repo = path.join(d, 'repo');
  const userData = path.join(d, 'userData');
  // Repo rỗng → unified.
  let r = resolveModelsRoot({ appRoot: repo, userDataDir: userData, env: {} });
  assert.equal(r.layout, 'unified');
  assert.equal(r.root, path.join(userData, 'models'));
  // Repo có model caption → repo.
  fs.mkdirSync(path.join(repo, 'server', 'caption', 'models', 'fw-small'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'server', 'caption', 'models', 'fw-small', 'model.bin'), 'x');
  r = resolveModelsRoot({ appRoot: repo, userDataDir: userData, env: {} });
  assert.equal(r.layout, 'repo');
  assert.equal(r.root, repo);
  // Env VCUT_MODELS_DIR thắng mọi layout.
  r = resolveModelsRoot({ appRoot: repo, userDataDir: userData, env: { VCUT_MODELS_DIR: '/tmp/vcut-models-x' } });
  assert.equal(r.layout, 'unified');
  assert.equal(r.root, '/tmp/vcut-models-x');
});

test('checkModel: missing → partial → ready (size-only, không hash)', async (t) => {
  const { port } = await startFixtureServer(t, {});
  const d = tmpDir(t);
  const model = fixtureModel(port, [
    { path: 'a.txt', url: '/a', buf: Buffer.from('hello model') },
    { path: 'sub/b.bin', url: '/b', buf: Buffer.from('second file') },
  ]);
  const root = rootUnified(d);
  let st = await checkModel(root, model);
  assert.equal(st.status, 'missing');
  assert.equal(st.presentBytes, 0);
  assert.equal(st.totalBytes, 22);
  fs.mkdirSync(path.join(d, 'test-small', 'sub'), { recursive: true });
  fs.writeFileSync(path.join(d, 'test-small', 'a.txt'), 'hello model');
  st = await checkModel(root, model);
  assert.equal(st.status, 'partial');
  assert.equal(st.presentBytes, 11);
  fs.writeFileSync(path.join(d, 'test-small', 'sub', 'b.bin'), 'second file');
  st = await checkModel(root, model);
  assert.equal(st.status, 'ready');
  assert.equal(st.presentBytes, 22);
});

test('downloadModel qua HTTP local: tải đủ file + verify + marker, tải lại thì skip', async (t) => {
  const { port, seen } = await startFixtureServer(t, {
    '/a': Buffer.from('hello model'),
    '/b': Buffer.from('second file'),
  });
  const d = tmpDir(t);
  const model = fixtureModel(port, [
    { path: 'a.txt', url: '/a', buf: Buffer.from('hello model') },
    { path: 'sub/b.bin', url: '/b', buf: Buffer.from('second file') },
  ]);
  const root = rootUnified(d);
  const progress = [];
  const r = await downloadModel(root, model, {
    onProgress: (p) => progress.push(p),
  });
  assert.equal(r.files, 2);
  assert.equal(r.downloadedBytes, 22);
  assert.equal(r.skippedBytes, 0);
  assert.equal(fs.readFileSync(path.join(d, 'test-small', 'a.txt'), 'utf8'), 'hello model');
  assert.equal(fs.readFileSync(path.join(d, 'test-small', 'sub', 'b.bin'), 'utf8'), 'second file');
  assert.equal(fs.existsSync(path.join(d, 'test-small', '.vcut-complete')), true);
  assert.ok(progress.length > 0);
  assert.equal(progress[progress.length - 1].totalDownloaded, 22);
  // Tải lại: không request HTTP nào mới (skip nhờ SHA256 khớp).
  const before = seen.length;
  const r2 = await downloadModel(root, model);
  assert.equal(r2.downloadedBytes, 0);
  assert.equal(r2.skippedBytes, 22);
  assert.equal(seen.length, before, 'tải lại phải skip, không gọi HTTP');
  const st = await checkModel(root, model);
  assert.equal(st.status, 'ready');
});

test('resume: .part dở được tải tiếp bằng Range, không tải lại từ đầu', async (t) => {
  const big = Buffer.alloc(200000, 'x');
  const { port, seen } = await startFixtureServer(t, { '/big': big });
  const d = tmpDir(t);
  const model = fixtureModel(port, [{ path: 'big.bin', url: '/big', buf: big }]);
  const root = rootUnified(d);
  const dir = path.join(d, 'test-small');
  fs.mkdirSync(dir, { recursive: true });
  // Giả lập lần tải trước chết giữa chừng: .part chứa đúng 120.000 byte đầu.
  fs.writeFileSync(path.join(dir, 'big.bin.part'), big.subarray(0, 120000));
  const r = await downloadModel(root, model);
  assert.equal(r.downloadedBytes, 80000, 'chỉ tính 80.000 byte tải thêm, 120.000 byte resume không tính lại');
  assert.equal(fs.readFileSync(path.join(dir, 'big.bin')).length, 200000);
  assert.equal(sha256(fs.readFileSync(path.join(dir, 'big.bin'))), sha256(big));
  const ranged = seen.filter((s) => s.range === 'bytes=120000-');
  assert.equal(ranged.length, 1, 'phải resume bằng Range từ byte 120000');
});

test('file đích bị hỏng (checksum lệch) → tải lại từ đầu', async (t) => {
  const { port, seen } = await startFixtureServer(t, { '/a': Buffer.from('hello model') });
  const d = tmpDir(t);
  const model = fixtureModel(port, [{ path: 'a.txt', url: '/a', buf: Buffer.from('hello model') }]);
  const root = rootUnified(d);
  const dir = path.join(d, 'test-small');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.txt'), 'hello modeL'); // cùng size, khác 1 byte
  const r = await downloadModel(root, model);
  assert.equal(r.downloadedBytes, 11);
  assert.equal(fs.readFileSync(path.join(dir, 'a.txt'), 'utf8'), 'hello model');
  assert.equal(seen.length, 1);
});

test('server trả sai nội dung → checksum lệch, ném lỗi, không ghi file đích', async (t) => {
  const { port } = await startFixtureServer(t, { '/a': Buffer.from('WRONG CONTENT!') });
  const d = tmpDir(t);
  // Manifest đòi nội dung khác với server trả.
  const model = fixtureModel(port, [{ path: 'a.txt', url: '/a', buf: Buffer.from('hello model') }]);
  const root = rootUnified(d);
  await assert.rejects(() => downloadModel(root, model), /Checksum lệch/);
  assert.equal(fs.existsSync(path.join(d, 'test-small', 'a.txt')), false);
  assert.equal(fs.existsSync(path.join(d, 'test-small', 'a.txt.part')), false);
});

test('hủy giữa chừng (AbortSignal) → lỗi ABORTED, .part giữ lại để resume', async (t) => {
  const big = Buffer.alloc(5 * 1024 * 1024, 'y');
  const { port } = await startFixtureServer(t, { '/slow': big });
  const d = tmpDir(t);
  const model = fixtureModel(port, [{ path: 'slow.bin', url: '/slow', buf: big }]);
  const root = rootUnified(d);
  const ctrl = new AbortController();
  const p = downloadModel(root, model, { signal: ctrl.signal });
  // Hủy sau ~300ms (server drip 64KB/50ms → mới tải được ~384KB).
  setTimeout(() => ctrl.abort(), 300);
  await assert.rejects(p, (e) => e.code === 'ABORTED');
  const part = path.join(d, 'test-small', 'slow.bin.part');
  assert.ok(fs.existsSync(part), '.part phải còn để resume');
  const partSize = fs.statSync(part).size;
  assert.ok(partSize > 0 && partSize < big.length, `.part dở ${partSize} byte`);
  assert.equal(fs.existsSync(path.join(d, 'test-small', 'slow.bin')), false);
});

test('model chưa verify → từ chối tải, không gọi mạng (J8: dùng model giả tổng hợp)', async (t) => {
  // bgremove thật nay đã verify nên không dùng nó cho case này nữa;
  // model giả chưa có SHA256/size vẫn phải bị từ chối như cũ.
  const unverified = {
    id: 'test-unverified',
    service: 'caption',
    label: 'Model test chưa verify',
    repo: 'test/fixture',
    license: 'MIT',
    licenseUrl: 'https://example.invalid/',
    repoDir: 'server/test/models',
    subdir: 'test-unverified',
    completeMarker: null,
    required: ['x.bin'],
    sizeLabel: 'test',
    verified: false,
    totalBytes: 0,
    files: [{ path: 'x.bin', url: 'http://127.0.0.1:1/x', sha256: null, size: null }],
  };
  const d = tmpDir(t);
  await assert.rejects(
    () => downloadModel(rootUnified(d), unverified),
    /chưa xác minh/,
  );
  // Không tạo thư mục đích (từ chối trước khi tải).
  assert.equal(fs.existsSync(path.join(d, 'test-unverified')), false);
});

test('checkAllModels trên manifest thật: caption/tts ready trên máy này (dev, layout repo)', async (t) => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const root = resolveModelsRoot({
    appRoot: repoRoot,
    userDataDir: path.join(os.tmpdir(), 'vcut-nope'),
    env: {},
  });
  assert.equal(root.layout, 'repo');
  const all = await checkAllModels(root);
  assert.equal(all['caption-small'].status, 'ready');
  assert.equal(all['tts-turbo'].status, 'ready');
  assert.equal(all['tts-codec'].status, 'ready');
  // J8: bgremove nay đã verify (SHA256 trong manifest) — không còn
  // 'unverified'. Trạng thái phụ thuộc máy chạy test (có model trong
  // ~/.u2net thì 'ready', chưa có thì 'missing'), nên chỉ khẳng định
  // không còn 'unverified' + entry verified.
  assert.equal(all['bgremove-birefnet'].verified, true);
  assert.notEqual(all['bgremove-birefnet'].status, 'unverified');
});

test('ensureFreeDiskSpace: đủ đĩa → pass; thiếu đĩa → ném lỗi nêu rõ cần/còn (J8)', async (t) => {
  const d = tmpDir(t);
  const model = {
    id: 'test-disk',
    service: 'caption',
    label: 'Model test disk',
    repo: 'test/fixture',
    license: 'MIT',
    licenseUrl: 'https://example.invalid/',
    repoDir: 'server/test/models',
    subdir: 'test-disk',
    completeMarker: null,
    required: ['a.txt'],
    sizeLabel: 'test',
    verified: true,
    totalBytes: 11,
    files: [{ path: 'a.txt', url: 'http://127.0.0.1:1/a', sha256: '0'.repeat(64), size: 11 }],
  };
  // Đủ đĩa (cần 11 byte): pass, trả về số cần + số trống đo được.
  const ok = await ensureFreeDiskSpace(model, path.join(d, 'test-disk'));
  assert.equal(ok.neededBytes, 11);
  assert.ok(ok.freeBytes == null || ok.freeBytes > 11, 'phải đo được dung lượng trống > 11 byte');
  // Thiếu đĩa: khai size khổng lồ → ném lỗi nêu rõ cần bao nhiêu / còn bao nhiêu.
  const huge = { ...model, files: [{ ...model.files[0], size: 10 ** 15 }] };
  await assert.rejects(
    () => ensureFreeDiskSpace(huge, path.join(d, 'test-disk')),
    (e) => /Không đủ dung lượng trống/.test(e.message)
      && /cần thêm/.test(e.message)
      && /còn trống/.test(e.message),
  );
});

test('estimateRemainingBytes: trừ file đủ + phần .part đã có (J8)', async (t) => {
  const d = tmpDir(t);
  const dir = path.join(d, 'test-disk');
  fs.mkdirSync(dir, { recursive: true });
  const mk = (size) => ({
    id: 'test-disk', service: 'caption', label: 'x', repo: 't', license: 'MIT',
    licenseUrl: 'https://example.invalid/', repoDir: null, subdir: 'test-disk',
    completeMarker: null, required: [], sizeLabel: 'test', verified: true,
    totalBytes: size,
    files: [{ path: 'big.bin', url: 'http://127.0.0.1:1/big', sha256: '0'.repeat(64), size }],
  });
  // Chưa có gì → cần đủ 200.000 byte.
  assert.equal(await estimateRemainingBytes(mk(200000), dir), 200000);
  // .part có đúng 120.000 byte đầu → chỉ cần 80.000 byte nữa.
  fs.writeFileSync(path.join(dir, 'big.bin.part'), Buffer.alloc(120000, 'x'));
  assert.equal(await estimateRemainingBytes(mk(200000), dir), 80000);
  // File đích đủ size → cần 0 byte (check size-only, không hash).
  fs.writeFileSync(path.join(dir, 'big.bin'), Buffer.alloc(200000, 'x'));
  assert.equal(await estimateRemainingBytes(mk(200000), dir), 0);
});

test('downloadModel từ chối TRƯỚC khi tải khi thiếu đĩa, không gọi HTTP nào (J8)', async (t) => {
  const { port, seen } = await startFixtureServer(t, { '/a': Buffer.from('hello model') });
  const d = tmpDir(t);
  const model = fixtureModel(port, [
    { path: 'a.txt', url: '/a', buf: Buffer.from('hello model') },
  ]);
  // Khai size khổng lồ cho file (server vẫn chỉ phục vụ 11 byte) → disk
  // check phải chặn trước khi request đầu tiên.
  model.files[0].size = 10 ** 15;
  model.totalBytes = 10 ** 15;
  await assert.rejects(
    () => downloadModel(rootUnified(d), model),
    /Không đủ dung lượng trống/,
  );
  assert.equal(seen.length, 0, 'thiếu đĩa phải chặn trước khi gọi HTTP');
  assert.equal(fs.existsSync(path.join(d, 'test-small', 'a.txt')), false);
});

test('TẢI THẬT từ Hugging Face: config.json của faster-whisper-small, verify SHA256 với manifest', async (t) => {
  // File nhỏ nhất trong manifest (2.370 byte) — chứng minh đường tải +
  // verify thật mà không tải 486MB model.bin trên VM này.
  const manifest = loadManifest();
  const caption = manifest.models.find((m) => m.id === 'caption-small');
  const entry = caption.files.find((f) => f.path === 'config.json');
  assert.ok(entry.sha256);
  const d = tmpDir(t);
  const r = await downloadFile(entry, d, {});
  assert.equal(r.skipped, false);
  assert.equal(r.bytes, entry.size);
  const got = fs.readFileSync(path.join(d, 'config.json'));
  assert.equal(sha256(got), entry.sha256);
  // Nội dung thật của faster-whisper config: alignment_heads + lang_ids.
  assert.match(got.toString('utf8'), /"lang_ids"/);
  // Tải lại lần nữa → skip (không gọi mạng).
  const r2 = await downloadFile(entry, d, {});
  assert.equal(r2.skipped, true);
});
