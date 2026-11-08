// reverseFileBuffer35R3.test.ts — Khóa sửa buffer file của đợt 35 R3
// (nợ đợt 34 Q2 §5.1: controller giữ nguyên ArrayBuffer file, file
// 420MB -> JS heap 401MB; ngân sách 192MiB chỉ tính frame).
//
// Chạy bằng esbuild bundle (KHÔNG chạy trực tiếp bằng Node
// strip-types: reverseWebcodecs.ts import "./mp4Demux" không đuôi theo
// chuẩn bundler của repo nên strip-types không resolve được — cùng lý
// do Q2 đã ghi ở reversePlayback34Q2.test.ts):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseFileBuffer35R3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r35r3.test.cjs \
//     && node /tmp/r35r3.test.cjs
// (chạy từ gốc repo). Decode thật bằng VideoDecoder được FAKE ở đây
// (không có browser): fake chỉ trả frame mang đúng timestamp của chunk
// để kiểm chứng luồng controller (fetch -> demux -> decode -> nhả);
// decode thật trên footage vẫn thuộc probe browser, không mock ở đó.
// KHÔNG dùng file lớn thật: cổng file lớn được chứng minh bằng ngưỡng
// nhỏ truyền qua options của controller + header fake.
import assert from "node:assert/strict";
import {
  REVERSE_CACHE_MEMORY_BUDGET_BYTES,
  REVERSE_LARGE_FILE_FALLBACK_BYTES,
  REVERSE_MEASURED_BYTES_PER_FRAME_720P,
  REVERSE_TOTAL_MEMORY_BUDGET_BYTES,
  ReversePreviewController,
  estimatedBytesPerFrame,
  reverseMemoryUsageBytes,
  windowFramesForTotalBudget,
} from "./reverseWebcodecs.ts";

// Harness chạy TUẦN TỰ (không chạy đồng thời): các test async dùng
// chung global fetch/VideoDecoder nên chạy song song sẽ đè stub lẫn
// nhau và cho kết quả sai — đó là lỗi harness, không phải lỗi code.
let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
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
  console.log(`reverseFileBuffer35R3: ${pass}/${queue.length} test pass`);
}

// ---- Fake VideoDecoder / EncodedVideoChunk (chỉ cho test Node) ----
type FakeFrame = { timestamp: number; close: () => void };
class FakeEncodedVideoChunk {
  timestamp: number;
  duration: number;
  type: string;
  data: Uint8Array;
  constructor(init: {
    timestamp: number;
    duration: number;
    type: string;
    data: Uint8Array;
  }) {
    this.timestamp = init.timestamp;
    this.duration = init.duration;
    this.type = init.type;
    this.data = init.data;
  }
}
let decoderShouldThrow = false;
class FakeVideoDecoder {
  private out: (f: FakeFrame) => void;
  private onErr: (e: Error) => void;
  constructor(init: {
    output: (f: FakeFrame) => void;
    error: (e: Error) => void;
  }) {
    this.out = init.output;
    this.onErr = init.error;
  }
  configure(): void {}
  decode(chunk: FakeEncodedVideoChunk): void {
    if (decoderShouldThrow) throw new Error("fake decode thất bại");
    this.out({ timestamp: chunk.timestamp, close: () => {} });
  }
  async flush(): Promise<void> {}
  close(): void {}
}
const g = globalThis as unknown as Record<string, unknown>;
g.VideoDecoder = FakeVideoDecoder;
g.EncodedVideoChunk = FakeEncodedVideoChunk;

// ---- Fixture MP4 dựng tay: 12 sample, keyframe ở 0 và 6, size 10 ----
function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}
function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n);
  return b;
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
function box(type: string, ...children: Uint8Array[]): Uint8Array {
  const body = concat(...children);
  const head = new Uint8Array(8);
  new DataView(head.buffer).setUint32(0, 8 + body.length);
  for (let i = 0; i < 4; i++) head[4 + i] = type.charCodeAt(i);
  return concat(head, body);
}
function fullBox(
  type: string,
  version: number,
  ...children: Uint8Array[]
): Uint8Array {
  const vf = new Uint8Array(4);
  vf[0] = version;
  return box(type, vf, ...children);
}
function buildFixture(stcoValue: number): Uint8Array {
  const avcC = box(
    "avcC",
    new Uint8Array([1, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0, 0]),
  );
  const avc1Fields = concat(
    new Uint8Array(6),
    u16(1),
    u16(0),
    new Uint8Array(2),
    new Uint8Array(12),
    u16(64),
    u16(64),
    u32(0x00480000),
    u32(0x00480000),
    u32(0),
    u16(1),
    new Uint8Array(32),
    u16(0x0018),
    u16(0xffff),
  );
  const avc1 = box("avc1", avc1Fields, avcC);
  const stsd = fullBox("stsd", 0, u32(1), avc1);
  const stts = fullBox("stts", 0, u32(1), u32(12), u32(100));
  const stss = fullBox("stss", 0, u32(2), u32(1), u32(7));
  const sizes = Array.from({ length: 12 }, () => u32(10));
  const stsz = fullBox("stsz", 0, u32(0), u32(12), ...sizes);
  const stsc = fullBox("stsc", 0, u32(1), u32(1), u32(12), u32(1));
  const stco = fullBox("stco", 0, u32(1), u32(stcoValue));
  const stbl = box("stbl", stsd, stts, stss, stsz, stsc, stco);
  const mdhd = fullBox(
    "mdhd",
    0,
    u32(0),
    u32(0),
    u32(1000),
    u32(1200),
    u16(0x55c4),
    u16(0),
  );
  const minf = box("minf", stbl);
  const mdia = box("mdia", mdhd, minf);
  const trak = box("trak", mdia);
  const mvhd = fullBox(
    "mvhd",
    0,
    u32(0),
    u32(0),
    u32(1000),
    u32(1200),
    u32(0x00010000),
  );
  const moov = box("moov", mvhd, trak);
  const ftyp = box(
    "ftyp",
    new Uint8Array([0x69, 0x73, 0x6f, 0x6d]),
    u32(0),
    new Uint8Array([0x69, 0x73, 0x6f, 0x6d]),
  );
  const mdat = box("mdat", new Uint8Array(120));
  return concat(ftyp, moov, mdat);
}
function fixtureBytes(): Uint8Array {
  const probe = buildFixture(0);
  const ftypLen = 8 + 4 + 4 + 4;
  const moovLen = probe.length - ftypLen - (8 + 120);
  return buildFixture(ftypLen + moovLen + 8);
}

// ---- Fake fetch: đếm GET/HEAD, điều khiển header theo kịch bản ----
type FetchScript = {
  headLength: string | null;
  headOk: boolean;
  getLength: string | null;
  getBody: Uint8Array | null;
  getOk?: boolean;
};
function installFetch(script: FetchScript): {
  calls: { head: number; get: number; arrayBuffer: number; cancelled: number };
} {
  const calls = { head: 0, get: 0, arrayBuffer: 0, cancelled: 0 };
  const stub = async (
    _url: string,
    init?: { method?: string },
  ): Promise<unknown> => {
    if (init && init.method === "HEAD") {
      calls.head++;
      return {
        ok: script.headOk,
        headers: {
          get: (k: string): string | null =>
            k === "content-length" ? script.headLength : null,
        },
      };
    }
    calls.get++;
    return {
      ok: script.getOk ?? true,
      headers: {
        get: (k: string): string | null =>
          k === "content-length" ? script.getLength : null,
      },
      body: {
        cancel: async (): Promise<void> => {
          calls.cancelled++;
        },
      },
      arrayBuffer: async (): Promise<ArrayBuffer> => {
        calls.arrayBuffer++;
        const body = script.getBody as Uint8Array;
        return body.buffer.slice(
          body.byteOffset,
          body.byteOffset + body.byteLength,
        );
      },
    };
  };
  g.fetch = stub;
  return calls;
}

// ---- Test: hằng ngân sách (chống đổi cảm tính) ----
ok("hằng ngân sách: frame 192MiB, file lớn 128MiB, tổng 320MiB", () => {
  assert.equal(REVERSE_CACHE_MEMORY_BUDGET_BYTES, 192 * 1024 * 1024);
  assert.equal(REVERSE_LARGE_FILE_FALLBACK_BYTES, 128 * 1024 * 1024);
  assert.equal(REVERSE_TOTAL_MEMORY_BUDGET_BYTES, 320 * 1024 * 1024);
});

ok("ngân sách tổng trừ buffer file trước khi chia frame", () => {
  const bpf = REVERSE_MEASURED_BYTES_PER_FRAME_720P;
  assert.equal(
    windowFramesForTotalBudget(bpf, 0, 320 * 1024 * 1024),
    133,
  );
  assert.equal(
    windowFramesForTotalBudget(bpf, 128 * 1024 * 1024, 320 * 1024 * 1024),
    80,
  );
  assert.equal(windowFramesForTotalBudget(0, 0), 1);
  assert.equal(windowFramesForTotalBudget(bpf, 999 * 1024 * 1024), 1);
});

ok("reverseMemoryUsageBytes tách frame + buffer file + tổng", () => {
  const u = reverseMemoryUsageBytes(
    75,
    REVERSE_MEASURED_BYTES_PER_FRAME_720P,
    100 * 1024 * 1024,
  );
  assert.equal(u.frameBytes, 75 * REVERSE_MEASURED_BYTES_PER_FRAME_720P);
  assert.equal(u.retainedFileBytes, 100 * 1024 * 1024);
  assert.equal(u.totalBytes, u.frameBytes + u.retainedFileBytes);
});

ok("estimatedBytesPerFrame scale theo pixel, fallback 720p", () => {
  assert.equal(
    estimatedBytesPerFrame(1280, 720),
    Math.floor(2.4 * 1024 * 1024),
  );
  assert.ok(estimatedBytesPerFrame(64, 64) > 0);
  assert.ok(estimatedBytesPerFrame(1920, 1080) > estimatedBytesPerFrame(1280, 720));
  assert.equal(estimatedBytesPerFrame(0, 0), Math.floor(2.4 * 1024 * 1024));
});

// ---- Test: decode xong nhả buffer, đổi cửa sổ fetch lại ----
ok("decode xong: retainedFileBytes = 0, frame vẫn trong cache", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: String(fixtureBytes().length),
    getBody: fixtureBytes(),
  });
  const c = new ReversePreviewController("fake://small.mp4", 2);
  // Mốc 0.1s = sample 1: cửa sổ ngược [0,1] đủ 2 frame (mốc 0.0 chỉ có
  // 1 sample phía trước nên cửa sổ chỉ 1 frame — đúng ngữ nghĩa cửa
  // sổ nhìn ngược, không phải lỗi).
  assert.equal(await c.ensureWindowForTime(0.1), true);
  assert.equal(c.cacheSize, 2);
  assert.equal(c.retainedFileBytes, 0);
  assert.equal(c.memoryUsage().retainedFileBytes, 0);
  assert.equal(c.memoryUsage().totalBytes, c.memoryUsage().frameBytes);
  // Frame đích vẫn đọc được từ cache mà không cần fetch lại.
  assert.notEqual(c.frameAt(0.1), null);
  assert.equal(calls.get, 1);
  const drawn: number[] = [];
  const r = c.presentCachedReverse((_f, idx) => {
    drawn.push(idx);
  });
  assert.equal(r.drawn, 2);
  assert.equal(r.missing, 0);
  assert.deepEqual(drawn, [1, 0]); // present giảm dần (hồi quy đường cũ)
  c.dispose();
  assert.equal(c.retainedFileBytes, 0);
});

ok("đổi cửa sổ: fetch lại toàn file rồi nhả tiếp (không giữ buffer cũ)", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: String(fixtureBytes().length),
    getBody: fixtureBytes(),
  });
  const c = new ReversePreviewController("fake://small.mp4", 2);
  assert.equal(await c.ensureWindowForTime(0.1), true);
  assert.equal(calls.get, 1);
  assert.equal(c.retainedFileBytes, 0);
  // Mốc 1.0s = sample 10, cửa sổ khác hẳn (GOP 6..10) -> phải fetch lại.
  assert.equal(await c.ensureWindowForTime(1.0), true);
  assert.equal(calls.get, 2);
  assert.equal(c.retainedFileBytes, 0);
  assert.notEqual(c.frameAt(1.0), null);
  c.dispose();
});

// ---- Test: cổng file lớn (ngưỡng nhỏ, không cần file lớn thật) ----
ok("cổng HEAD: file lớn bị chặn trước khi tải body, fallback element", async () => {
  const calls = installFetch({
    headLength: String(200 * 1024),
    headOk: true,
    getLength: null,
    getBody: fixtureBytes(),
  });
  const c = new ReversePreviewController("fake://big.mp4", 75, {
    largeFileBytes: 1024,
  });
  assert.equal(await c.ensureWindowForTime(0.0), false);
  assert.equal(c.failed, true);
  assert.equal(c.largeFileFallback, true);
  assert.equal(c.retainedFileBytes, 0);
  assert.equal(calls.get, 0); // chưa từng tải body
  assert.equal(c.frameAt(0.0), null);
  c.dispose();
});

ok("cổng header GET: chặn trước arrayBuffer, có huỷ body", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: String(5000),
    getBody: fixtureBytes(),
  });
  const c = new ReversePreviewController("fake://big.mp4", 75, {
    largeFileBytes: 1024,
  });
  assert.equal(await c.ensureWindowForTime(0.0), false);
  assert.equal(c.largeFileFallback, true);
  assert.equal(calls.arrayBuffer, 0);
  assert.equal(calls.cancelled, 1);
  assert.equal(c.retainedFileBytes, 0);
  c.dispose();
});

ok("cổng sau tải (không header): vứt buffer, khóa unsupported, không tải lại", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: null,
    getBody: new Uint8Array(2048),
  });
  const c = new ReversePreviewController("fake://big.mp4", 75, {
    largeFileBytes: 1024,
  });
  assert.equal(await c.ensureWindowForTime(0.0), false);
  assert.equal(c.largeFileFallback, true);
  assert.equal(c.retainedFileBytes, 0);
  assert.equal(calls.get, 1);
  assert.equal(await c.ensureWindowForTime(0.0), false);
  assert.equal(calls.get, 1); // đã khóa, không tải lại lần 2
  c.dispose();
});

ok("lỗi decode: fail-soft về false + nhả buffer, không ném ra caller", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: String(fixtureBytes().length),
    getBody: fixtureBytes(),
  });
  decoderShouldThrow = true;
  try {
    const c = new ReversePreviewController("fake://small.mp4", 2);
    assert.equal(await c.ensureWindowForTime(0.0), false);
    assert.equal(c.failed, true);
    assert.equal(c.retainedFileBytes, 0);
    assert.equal(c.frameAt(0.0), null);
    assert.equal(calls.get, 1);
    c.dispose();
  } finally {
    decoderShouldThrow = false;
  }
});

void runAll();
