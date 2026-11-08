/**
 * native-files.test.ts — Phase 10 G4: unit test cho native-files.ts
 * (bản sau đối chiếu G5: chỉ helper thuần + LastDirStore + saveExportFile).
 *
 * Chạy (không cần Electron — handler nhận fs thật + fake electron):
 *   node_modules/.bin/esbuild --bundle --platform=node --format=esm \
 *     --outfile=/tmp/native-files.test.mjs src/native-files.test.ts \
 *     && node --test /tmp/native-files.test.mjs
 * (chạy từ apps/desktop; esbuild có sẵn ở repo root node_modules/.bin)
 *
 * Không test ở đây (ghi rõ trong LIMITS): dialog thật của Electron
 * (showOpenDialog/showSaveDialog), launch app dưới Xvfb — chờ electron
 * được install (G1) + smoke test. Đọc/ghi project + recent nay thuộc
 * file-io.ts / settings.ts của G5 (có test riêng của G5 nếu có).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as http from "node:http";
import {
  EXPORT_CHANNEL,
  LastDirStore,
  defaultExportFileName,
  defaultProjectFileName,
  findProjectPathInArgv,
  isArchiveFilePath,
  isMediaFilePath,
  isProjectFilePath,
  mimeForMediaPath,
  projectKindForPath,
  registerExportFileIpc,
  saveExportFile,
} from "./native-files";

function tmpDir(t: { after: (fn: () => void) => void }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-g4-test-"));
  t.after(() => fs.rmSync(dir, { force: true, recursive: true }));
  return dir;
}

test("projectKindForPath: .vcut/.vcut.json/.json là json, .vcut.zip/.zip là zip", () => {
  assert.equal(projectKindForPath("/a/b.vcut"), "json");
  assert.equal(projectKindForPath("/a/b.vcut.json"), "json");
  assert.equal(projectKindForPath("/a/b.json"), "json");
  assert.equal(projectKindForPath("/a/b.VCUT"), "json");
  assert.equal(projectKindForPath("/a/b.vcut.zip"), "zip");
  assert.equal(projectKindForPath("/a/b.zip"), "zip");
  assert.equal(projectKindForPath("/a/b.mp4"), null);
  assert.equal(projectKindForPath("/a/b.vcut.mp4"), null);
  assert.equal(isProjectFilePath("/a/b.vcut"), true);
  assert.equal(isArchiveFilePath("/a/b.vcut.zip"), true);
  assert.equal(isArchiveFilePath("/a/b.vcut"), false);
});

test("isMediaFilePath + mimeForMediaPath", () => {
  assert.equal(isMediaFilePath("/a/clip.mp4"), true);
  assert.equal(isMediaFilePath("/a/song.MP3"), true);
  assert.equal(isMediaFilePath("/a/pic.webp"), true);
  assert.equal(isMediaFilePath("/a/doc.pdf"), false);
  assert.equal(isMediaFilePath("/a/b.vcut"), false);
  assert.equal(mimeForMediaPath("/a/clip.mp4"), "video/mp4");
  assert.equal(mimeForMediaPath("/a/song.mp3"), "audio/mpeg");
  assert.equal(mimeForMediaPath("/a/pic.png"), "image/png");
  assert.equal(mimeForMediaPath("/a/x.unknown"), "application/octet-stream");
});

test("findProjectPathInArgv quét toàn bộ argv, lấy file đầu tiên", () => {
  assert.equal(findProjectPathInArgv(["electron", "app", "/a/b.vcut"]), "/a/b.vcut");
  assert.equal(findProjectPathInArgv(["electron", "/a/b.vcut.zip", "app"]), "/a/b.vcut.zip");
  assert.equal(findProjectPathInArgv(["electron", "--dev", "/a/b.mp4"]), null);
  assert.equal(findProjectPathInArgv([]), null);
});

test("defaultProjectFileName / defaultExportFileName bỏ dấu, giữ chữ", () => {
  assert.equal(defaultProjectFileName("Đám cưới: Lan & Hùng!"), "Dam cuoi Lan  Hung.vcut");
  assert.equal(defaultProjectFileName(""), "du-an-chua-dat-ten.vcut");
  assert.equal(defaultExportFileName("My Project 2026"), "My Project 2026.mp4");
  assert.equal(defaultExportFileName(""), "project.mp4");
});

test("LastDirStore: nhớ thư mục, persist qua khởi động lại, file hỏng không crash", (t) => {
  const dir = tmpDir(t);
  const store = new LastDirStore(dir);
  assert.equal(store.getLastDir(), undefined);
  store.noteFileSelection("/home/user/Videos/du-an.vcut");
  assert.equal(store.getLastDir(), "/home/user/Videos");
  assert.equal(fs.existsSync(path.join(dir, "vcut-last-dirs.json")), true);
  // Mở lại store mới từ cùng thư mục → nhớ thư mục cũ.
  const store2 = new LastDirStore(dir);
  assert.equal(store2.getLastDir(), "/home/user/Videos");
  // Ghi đè file hỏng → load về null, không ném.
  fs.writeFileSync(path.join(dir, "vcut-last-dirs.json"), "{ hỏng", "utf-8");
  const store3 = new LastDirStore(dir);
  assert.equal(store3.getLastDir(), undefined);
});

test("saveExportFile: stream từ bridge fake → file .mp4 byte-identical", async (t) => {
  const dir = tmpDir(t);
  const payload = Buffer.from("fake-mp4-bytes-".repeat(1000), "utf-8");
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "video/mp4" });
    res.end(payload);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const port = (server.address() as { port: number }).port;
  const dest = path.join(dir, "xuat", "video.mp4");
  const result = await saveExportFile("job-1", dest, `http://127.0.0.1:${port}`);
  assert.equal(result.ok, true);
  assert.equal(result.path, dest);
  assert.equal(result.bytes, payload.length);
  assert.deepEqual(fs.readFileSync(dest), payload);
  // Không còn file tạm sót lại.
  assert.equal(fs.readdirSync(path.join(dir, "xuat")).length, 1);
});

test("saveExportFile: từ chối đích không phải .mp4 + bridge 404", async (t) => {
  const dir = tmpDir(t);
  await assert.rejects(
    saveExportFile("job-1", path.join(dir, "video.mov"), "http://127.0.0.1:9"),
    /phải là file \.mp4/,
  );
  const server = http.createServer((_req, res) => {
    res.writeHead(404);
    res.end("not found");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const port = (server.address() as { port: number }).port;
  await assert.rejects(
    saveExportFile("no-such-job", path.join(dir, "v.mp4"), `http://127.0.0.1:${port}`),
    /bridge trả 404/,
  );
  assert.equal(fs.existsSync(path.join(dir, "v.mp4")), false);
});

test("registerExportFileIpc: handler ghi file + nhớ thư mục", async (t) => {
  const dir = tmpDir(t);
  const payload = Buffer.from("mp4", "utf-8");
  const server = http.createServer((_req, res) => {
    res.writeHead(200);
    res.end(payload);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const port = (server.address() as { port: number }).port;
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const fakeIpc = {
    handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers.set(channel, fn);
    },
  } as unknown as Parameters<typeof registerExportFileIpc>[0];
  const lastDirs = new LastDirStore(dir);
  // Module mới: đăng ký lần 2 phải là no-op (guard trùng như file-io G5).
  registerExportFileIpc(fakeIpc, `http://127.0.0.1:${port}`, lastDirs);
  registerExportFileIpc(fakeIpc, `http://127.0.0.1:${port}`, lastDirs);
  assert.equal(handlers.has(EXPORT_CHANNEL), true);
  const fn = handlers.get(EXPORT_CHANNEL) as (
    _e: unknown,
    jobId: unknown,
    destPath: unknown,
  ) => Promise<{ bytes: number; ok: true; path: string }>;
  const dest = path.join(dir, "sub", "out.mp4");
  const result = await fn(null, "job-9", dest);
  assert.equal(result.ok, true);
  assert.equal(result.bytes, 3);
  assert.deepEqual(fs.readFileSync(dest), payload);
  assert.equal(lastDirs.getLastDir(), path.join(dir, "sub"));
  await assert.rejects(fn(null, 123, dest), /tham số không hợp lệ/);
});
