// gopRangeFetch72Z5.test.ts — Phase 9 đợt 72, luồng Z5: T3 đăng ký run
// trial TỪ LÚC fetch remainder (đóng nợ đợt 71 §5 mục 5 — toast chỉ bao
// decode, không bao fetch remainder ~48 s).
//
// Chạy bằng esbuild bundle (mẫu T3/Y5, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopRangeFetch72Z5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r72z5.test.cjs \
//     && node /tmp/r72z5.test.cjs
// (fixture bigkey 64 MiB tái dùng từ ~/scratch-round68-v5/ — KHÔNG đưa
// vào repo, chỉ đọc.)
//
// Phạm vi test (tích hợp thật: fixture MP4 thật + server HTTP Range
// thật, probe inject):
// - Unit fetchSampleRemainderChunked + onProgress: callback nhận đúng
//   các mốc tăng dần theo chunk (prefix + 512 KiB mỗi chunk), kết thúc
//   đúng sampleSize; callback lỗi không làm hỏng fetch.
// - Stream-mode + sample 0 = 64 MiB + server chậm 25 ms/chunk: run HIỆN
//   với phase "fetch" và fetchedBytes TĂNG DẦN theo chunk trong lúc
//   fetch, chuyển sang phase "decode" (fetchedBytes = đủ sample) khi
//   fetch xong, rồi BIẾN MẤT sau khi T3 trả về gop-range.
// - Stream-mode + fetch remainder lỗi giữa chừng (chunk 2 trả 416):
//   trial fail-open, KHÔNG còn run nào sau khi T3 xong (không kẹt toast).
// Không test phía preview.tsx (cần React/DOM): ngưỡng 5 s + toast dính
// khóa bằng tsc + vite build + click-test headed (xem LIMITS Z5).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  fetchSampleRemainderChunked,
  fetchVideoTrackByGopRange,
  MAX_FIRST_SAMPLE_PROBE_BYTES,
  TRIAL_DECODE_SAMPLE_CHUNK_BYTES,
} from "./gopRangeFetch39T3.ts";
import type { GopRangeFetchFn, GopRangeRequestLog } from "./gopRangeFetch39T3.ts";
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
  console.log(`gopRangeFetch72Z5: ${pass}/${queue.length} test pass`);
}

// ---- Mock fetch cho unit onProgress (mẫu N10) ----
function mockRangeFetch(
  source: Uint8Array,
): { fetchImpl: GopRangeFetchFn; calls: () => Array<[number, number]> } {
  const calls: Array<[number, number]> = [];
  const fetchImpl: GopRangeFetchFn = async (_url, init) => {
    const range = init?.headers?.Range ?? "";
    const m = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!m) throw new Error(`mockRangeFetch: không parse được Range ${range}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    calls.push([start, end]);
    const slice = source.slice(start, end + 1);
    return {
      status: 206,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-range"
            ? `bytes ${start}-${end}/${source.length}`
            : null,
      },
      arrayBuffer: async () =>
        slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer,
      body: null,
    };
  };
  return { fetchImpl, calls: () => calls };
}

function positionalBuffer(size: number): Uint8Array {
  const out = new Uint8Array(size);
  for (let i = 0; i < size; i++) out[i] = (i * 7 + 11) & 0xff;
  return out;
}

ok("(unit-progress) sample 3 MiB: onProgress nhận đúng mốc tăng dần theo chunk", async () => {
  const sampleSize = 3_000_000;
  const prefixLen = MAX_FIRST_SAMPLE_PROBE_BYTES; // 262144
  const source = positionalBuffer(sampleSize);
  const prefix = source.slice(0, prefixLen);
  const { fetchImpl } = mockRangeFetch(source);
  const seen: number[] = [];
  const full = await fetchSampleRemainderChunked(
    fetchImpl, "http://x/f.mp4", 0, sampleSize, prefix, sampleSize, [],
    undefined,
    (fetched) => seen.push(fetched),
  );
  assert.deepEqual(full, source);
  // 6 chunk: mốc sau mỗi chunk = prefix + k*512 KiB (chunk cuối ngắn hơn).
  assert.deepEqual(seen, [
    262144 + 524288, 262144 + 2 * 524288, 262144 + 3 * 524288,
    262144 + 4 * 524288, 262144 + 5 * 524288, 3000000,
  ]);
  assert.ok(seen.every((v, i) => i === 0 || v > seen[i - 1]), "các mốc phải tăng đơn điệu");
  console.log(`    đo: 6 mốc tiến độ, cuối = ${seen[seen.length - 1]} = sampleSize`);
});

ok("(unit-progress) onProgress ném lỗi không làm hỏng fetch", async () => {
  const sampleSize = 1_500_000;
  const source = positionalBuffer(sampleSize);
  const prefix = source.slice(0, MAX_FIRST_SAMPLE_PROBE_BYTES);
  const { fetchImpl } = mockRangeFetch(source);
  const full = await fetchSampleRemainderChunked(
    fetchImpl, "http://x/f.mp4", 0, sampleSize, prefix, sampleSize, [],
    undefined,
    () => {
      throw new Error("callback tiến độ hỏng giả lập");
    },
  );
  assert.deepEqual(full, source);
});

// ---- Fixture bigkey thật (64 MiB sample 0) + server Range chậm ----
const BIGKEY = join(homedir(), "scratch-round68-v5", "bigkey-64mib-70s.mp4");
const BIGKEY_ALT = join(homedir(), "scratch-round71-y5", "bigkey-64mib-70s.mp4");
const bigkeyPath = existsSync(BIGKEY) ? BIGKEY : BIGKEY_ALT;
if (!existsSync(bigkeyPath)) {
  throw new Error(`không có fixture bigkey: ${BIGKEY} (cần file này để test fetch remainder thật)`);
}
const bigkeyBuf = readFileSync(bigkeyPath);
console.log(`  fixture bigkey: ${bigkeyBuf.length} byte (${bigkeyPath})`);

const CHUNK_DELAY_MS = 25;
async function serve(buf: Buffer): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const range = req.headers.range ?? null;
    res.setHeader("Accept-Ranges", "bytes");
    const respond = (): void => {
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
    };
    // Chậm nhân tạo MỖI response để fetch remainder 128 chunk kéo dài
    // đủ lâu cho vòng poll quan sát tiến độ (mô phỏng tải nặng W2).
    setTimeout(respond, CHUNK_DELAY_MS);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
  return {
    url: `http://127.0.0.1:${addr.port}/file.mp4`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

interface RunSnapshot {
  phase: string;
  fetchedBytes: number;
  sampleBytes: number;
}

ok("stream + sample 64 MiB + server chậm: run fetch (tiến độ tăng) → decode → biến mất", async () => {
  assert.equal(activeTrialDecodeRuns().length, 0);
  const srv = await serve(bigkeyBuf);
  try {
    const snapshots: RunSnapshot[] = [];
    let done = false;
    const pending = fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      trialDecodeProbe: async () => {
        await sleep(300); // giữ phase decode đủ lâu để poll thấy
        return true;
      },
    }).then((out) => {
      done = true;
      return out;
    });
    // Poll registry mỗi 10 ms trong lúc T3 chạy.
    const pollEnd = Date.now() + 60000;
    while (!done && Date.now() < pollEnd) {
      const runs = activeTrialDecodeRuns();
      if (runs.length > 0) {
        snapshots.push({
          phase: runs[0].phase,
          fetchedBytes: runs[0].fetchedBytes,
          sampleBytes: runs[0].sampleBytes,
        });
      }
      await sleep(10);
    }
    const out = await pending;
    assert.equal(out.mode, "gop-range");
    assert.equal(activeTrialDecodeRuns().length, 0);
    assert.ok(snapshots.length > 0, "phải quan sát được ít nhất 1 snapshot run");
    const fetchSnaps = snapshots.filter((s) => s.phase === "fetch");
    const decodeSnaps = snapshots.filter((s) => s.phase === "decode");
    assert.ok(fetchSnaps.length >= 3, `phải thấy ≥3 snapshot phase fetch, nhận ${fetchSnaps.length}`);
    assert.ok(decodeSnaps.length >= 1, `phải thấy ≥1 snapshot phase decode, nhận ${decodeSnaps.length}`);
    // Tiến độ fetch tăng đơn điệu, bắt đầu từ tiền tố 256 KiB, không vượt sample.
    const fetchedSeq = fetchSnaps.map((s) => s.fetchedBytes);
    assert.ok(fetchedSeq.every((v, i) => i === 0 || v >= fetchedSeq[i - 1]), "fetchedBytes phải không giảm");
    const distinct = [...new Set(fetchedSeq)];
    assert.ok(distinct.length >= 3, `phải có ≥3 mốc fetchedBytes khác nhau, nhận ${distinct.length}: [${distinct.slice(0, 5).join(", ")}…]`);
    const sampleBytes = fetchSnaps[0].sampleBytes;
    assert.ok(sampleBytes > 32 * 1024 * 1024, `sample 0 phải > 32 MiB, nhận ${sampleBytes}`);
    assert.ok(
      (sampleBytes / 1048576).toFixed(1) === "64.0",
      `sample 0 phải ≈ 64,0 MiB (như click-test Y5), nhận ${(sampleBytes / 1048576).toFixed(1)} MiB`,
    );
    assert.ok(distinct[0] >= MAX_FIRST_SAMPLE_PROBE_BYTES, "mốc đầu phải ≥ tiền tố 256 KiB");
    assert.ok(distinct[distinct.length - 1] < sampleBytes, "mốc cuối phase fetch phải < đủ sample");
    assert.ok(
      distinct.every((v) => v % TRIAL_DECODE_SAMPLE_CHUNK_BYTES === MAX_FIRST_SAMPLE_PROBE_BYTES % TRIAL_DECODE_SAMPLE_CHUNK_BYTES),
      "mỗi mốc phải = tiền tố + k*512 KiB",
    );
    // Phase decode: fetchedBytes = đủ sample.
    assert.ok(decodeSnaps.every((s) => s.fetchedBytes === sampleBytes), "phase decode phải có fetchedBytes = đủ sample");
    console.log(
      `    đo: ${snapshots.length} snapshot (${fetchSnaps.length} fetch / ${decodeSnaps.length} decode), ` +
      `${distinct.length} mốc tiến độ từ ${(distinct[0] / 1048576).toFixed(1)} MiB tới ${(distinct[distinct.length - 1] / 1048576).toFixed(1)} MiB`,
    );
  } finally {
    await srv.close();
  }
});

ok("stream + chunk remainder lỗi 416: trial fail-open, không còn run nào", async () => {
  assert.equal(activeTrialDecodeRuns().length, 0);
  // Server: trả 416 CHỈ cho các chunk remainder (request Range bắt đầu
  // sau [s0.offset, s0.offset+256 KiB) của probe AVCC) — fetch remainder
  // lỗi → T3 bỏ qua trial (fail-open), run phải được dọn. Học s0.offset
  // từ request Range đầu tiên có độ dài đúng 256 KiB (chính là probe
  // AVCC; tiền tố dài 512 KiB, probe-range dài 1 KiB nên không nhầm).
  let sample0Offset: number | null = null;
  const server: Server = createServer((req, res) => {
    const range = req.headers.range ?? null;
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", bigkeyBuf.length);
      res.writeHead(200);
      res.end();
      return;
    }
    if (range === null) {
      res.setHeader("Content-Length", bigkeyBuf.length);
      res.writeHead(200);
      res.end(bigkeyBuf);
      return;
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m) {
      res.writeHead(400);
      res.end();
      return;
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? bigkeyBuf.length - 1 : Math.min(Number(m[2]), bigkeyBuf.length - 1);
    if (sample0Offset === null && end - start + 1 === MAX_FIRST_SAMPLE_PROBE_BYTES) {
      sample0Offset = start; // probe AVCC: [s0.offset, s0.offset+256 KiB)
    }
    if (
      sample0Offset !== null &&
      start > sample0Offset + MAX_FIRST_SAMPLE_PROBE_BYTES - 1
    ) {
      // Trì hoãn 416 một nhịp (CHUNK_DELAY_MS) để run fetch kịp hiện
      // trước khi fetch lỗi: test poll 10 ms, không delay thì fetch xong
      // trong ~1-2 ms (server local trả ngay) nên run không kịp quan sát
      // — race ở test, không phải bug sản phẩm; test sibling dùng cùng
      // CHUNK_DELAY_MS cho cùng lý do.
      setTimeout(() => {
        res.setHeader("Content-Range", `bytes */${bigkeyBuf.length}`);
        res.writeHead(416);
        res.end();
      }, CHUNK_DELAY_MS);
      return;
    }
    res.setHeader("Content-Range", `bytes ${start}-${end}/${bigkeyBuf.length}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206);
    res.end(bigkeyBuf.subarray(start, end + 1));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
  const url = `http://127.0.0.1:${addr.port}/file.mp4`;
  try {
    let sawFetchRun = false;
    const pending = fetchVideoTrackByGopRange(url, {
      streamGops: true,
      trialDecodeProbe: async () => true,
    });
    // Poll nhanh: run fetch phải xuất hiện rồi biến mất khi fetch lỗi.
    const pollEnd = Date.now() + 30000;
    while (Date.now() < pollEnd) {
      if (activeTrialDecodeRuns().length > 0) sawFetchRun = true;
      const settled = await Promise.race([
        pending.then(() => true),
        sleep(10).then(() => false),
      ]);
      if (settled) break;
    }
    const out = await pending;
    assert.equal(out.mode, "gop-range", "fetch remainder lỗi → fail-open, vẫn gop-range");
    assert.equal(activeTrialDecodeRuns().length, 0, "không còn run nào sau khi T3 xong");
    assert.ok(sawFetchRun, "run fetch phải từng xuất hiện trước khi fetch lỗi");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

void runAll();
