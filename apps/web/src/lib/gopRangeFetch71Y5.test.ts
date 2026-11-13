// gopRangeFetch71Y5.test.ts — Phase 9 đợt 71, luồng Y5: T3 đăng ký run
// trial-decode đang chạy (cho toast trạng thái khi trial lâu).
//
// Chạy bằng esbuild bundle (mẫu T3, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopRangeFetch71Y5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r71y5.test.cjs \
//     && node /tmp/r71y5.test.cjs
// (chạy từ gốc repo; fixture chỉ nằm trong os.tmpdir(), KHÔNG đưa vào repo.)
//
// Phạm vi test (tích hợp thật: fixture MP4 tạo bằng ffmpeg + server HTTP
// Range thật, probe inject chậm):
// - Stream-mode + probe chậm 150 ms: run trial HIỆN trong lúc T3 đang
//   chờ probe (sampleBytes = đúng sample 0, viaWorker=false, timeout
//   200 ms) và BIẾN MẤT sau khi T3 trả về gop-range.
// - Probe nhanh (trả ngay): sau khi T3 xong không còn run nào (end
//   được gọi cả khi trial ngắn — không kẹt lại).
// - Probe ném lỗi sau 100 ms: run hiện trong lúc chờ, biến mất sau khi
//   T3 fail-open xong (finally dọn dù probe throw).
// Không test phía preview.tsx (cần React/DOM): ngưỡng 5 s + toast dính
// khóa bằng tsc + vite build + click-test headed (xem LIMITS Y5).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchVideoTrackByGopRange } from "./gopRangeFetch39T3.ts";
import { activeTrialDecodeRuns } from "./trialDecodeRunning71Y5.ts";

declare const process: { exitCode: number | undefined };

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

let pass = 0;
const queue: Array<{ name: string; fn: () => Promise<void> | void }> = [];
function ok(name: string, fn: () => Promise<void> | void): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`gopRangeFetch71Y5: ${pass}/${queue.length} test pass`);
}

// ---- Fixture: ffmpeg thật (mẫu T3) ----
const dir = mkdtempSync(join(tmpdir(), "vcut-t71y5-"));
function makeFixture(name: string): string {
  const out = join(dir, name);
  execFileSync("ffmpeg", [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10",
    "-movflags", "+faststart",
    out,
  ], { stdio: "pipe" });
  return out;
}
const fastPath = makeFixture("faststart.mp4");
const fastBuf = readFileSync(fastPath);
console.log(`  fixture faststart: ${fastBuf.length} byte (ffmpeg testsrc2 320x240 30fps 2s, -g 10)`);

// ---- Server HTTP Range thật (tối giản từ T3 test) ----
async function serve(buf: Buffer): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const range = req.headers.range ?? null;
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end();
      return;
    }
    if (range === null) {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end(buf);
      return;
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m) {
      res.writeHead(400);
      res.end();
      return;
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? buf.length - 1 : Math.min(Number(m[2]), buf.length - 1);
    if (start >= buf.length || start > end) {
      res.setHeader("Content-Range", `bytes */${buf.length}`);
      res.writeHead(416);
      res.end();
      return;
    }
    res.setHeader("Content-Range", `bytes ${start}-${end}/${buf.length}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206);
    res.end(buf.subarray(start, end + 1));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
  return {
    url: `http://127.0.0.1:${addr.port}/file.mp4`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

// Chờ tới khi có run trial đang chạy (tối đa 10 s), trả về run đầu tiên.
async function waitForRun(): Promise<{ sampleBytes: number; timeoutMs: number; viaWorker: boolean }> {
  const end = Date.now() + 10000;
  while (Date.now() < end) {
    const runs = activeTrialDecodeRuns();
    if (runs.length > 0) return runs[0];
    await sleep(10);
  }
  throw new Error("không thấy run trial nào trong 10 s");
}

ok("stream + probe chậm 150 ms: run HIỆN trong lúc chờ, BIẾN MẤT sau khi xong", async () => {
  assert.equal(activeTrialDecodeRuns().length, 0);
  const srv = await serve(fastBuf);
  try {
    const pending = fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      trialDecodeProbe: async () => {
        await sleep(150);
        return true;
      },
    });
    const run = await waitForRun();
    assert.ok(run.sampleBytes > 0, "sampleBytes phải > 0");
    assert.equal(run.viaWorker, false); // sample nhỏ → đường main-thread
    assert.equal(run.timeoutMs, 200); // sample ≤ 256 KiB → timeout gốc
    const out = await pending;
    assert.equal(out.mode, "gop-range");
    assert.equal(activeTrialDecodeRuns().length, 0);
  } finally {
    await srv.close();
  }
});

ok("stream + probe trả ngay: sau khi xong không còn run nào", async () => {
  assert.equal(activeTrialDecodeRuns().length, 0);
  const srv = await serve(fastBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      trialDecodeProbe: async () => true,
    });
    assert.equal(out.mode, "gop-range");
    assert.equal(activeTrialDecodeRuns().length, 0);
  } finally {
    await srv.close();
  }
});

ok("stream + probe ném lỗi sau 100 ms: run hiện trong lúc chờ, dọn sau fail-open", async () => {
  assert.equal(activeTrialDecodeRuns().length, 0);
  const srv = await serve(fastBuf);
  try {
    const pending = fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      trialDecodeProbe: async () => {
        await sleep(100);
        throw new Error("probe hỏng giả lập");
      },
    });
    const run = await waitForRun();
    assert.ok(run.sampleBytes > 0);
    const out = await pending;
    assert.equal(out.mode, "gop-range"); // probe lỗi → fail-open
    assert.equal(activeTrialDecodeRuns().length, 0);
  } finally {
    await srv.close();
  }
});

void runAll();
