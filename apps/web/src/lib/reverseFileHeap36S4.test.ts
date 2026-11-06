// reverseFileHeap36S4.test.ts — Khóa cổng File.size truyền trước của
// đợt 36 S4 (nợ §3.4 của docs/PHASE9_ROUND35_LIMITS.md: đỉnh heap
// thoáng qua khi tải file lớn không header qua ReversePreviewController).
//
// Chạy bằng esbuild bundle (cùng lý do R3: reverseWebcodecs.ts import
// "./mp4Demux" không đuôi nên Node strip-types không resolve được):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseFileHeap36S4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r36s4.test.cjs \
//     && node /tmp/r36s4.test.cjs
// (chạy từ gốc repo). Fake VideoDecoder + fake fetch như R3; KHÔNG
// dùng file lớn thật ở đây — cổng ở ngưỡng production (128 MiB) được
// chứng minh bằng số byte thật 134.217.729 (> 128 MiB) mà không cần
// cấp phát file đó, vì cổng chặn TRƯỚC khi fetch. Đo heap trên file
// lớn thật thuộc probe browser (xem LIMITS S4), không thuộc test này.
import assert from "node:assert/strict";
import {
  REVERSE_LARGE_FILE_FALLBACK_BYTES,
  ReversePreviewController,
  getReversePreviewController,
  reverseWebcodecsFrameFor,
} from "./reverseWebcodecs.ts";

// Harness chạy TUẦN TỰ như R3 (global fetch/VideoDecoder dùng chung).
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
  console.log(`reverseFileHeap36S4: ${pass}/${queue.length} test pass`);
}

// ---- Fake VideoDecoder / EncodedVideoChunk (như R3) ----
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
class FakeVideoDecoder {
  private out: (f: FakeFrame) => void;
  constructor(init: {
    output: (f: FakeFrame) => void;
    error: (e: Error) => void;
  }) {
    this.out = init.output;
  }
  configure(): void {}
  decode(chunk: FakeEncodedVideoChunk): void {
    this.out({ timestamp: chunk.timestamp, close: () => {} });
  }
  async flush(): Promise<void> {}
  close(): void {}
}
const g = globalThis as unknown as Record<string, unknown>;
g.VideoDecoder = FakeVideoDecoder;
g.EncodedVideoChunk = FakeEncodedVideoChunk;

// ---- Fixture MP4 dựng tay (sao chép công thức R3: 12 sample,
// keyframe ở 0 và 6, mỗi sample 10 byte) ----
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
  const stbl = box("stbl", stsd, stts, stsz, stsc, stco);
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

// ---- Fake fetch: đếm HEAD/GET, điều khiển header theo kịch bản ----
type FetchScript = {
  headLength: string | null;
  headOk: boolean;
  getLength: string | null;
  getBody: Uint8Array | null;
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
      ok: true,
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

// ---- Test: cổng File.size chặn trước mọi fetch ----
ok("File.size vượt ngưỡng nhỏ: 0 fetch (HEAD = 0, GET = 0), khóa fallback", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: null,
    getBody: null,
  });
  const c = new ReversePreviewController("fake://s4-gate.mp4", 2, {
    largeFileBytes: 1024,
    knownFileSizeBytes: 5000,
  });
  // Khóa ngay từ constructor, chưa cần gọi ensure.
  assert.equal(c.failed, true);
  assert.equal(c.largeFileFallback, true);
  assert.equal(c.knownFileSizeBytes, 5000);
  assert.equal(c.retainedFileBytes, 0);
  assert.equal(await c.ensureWindowForTime(0.1), false);
  assert.equal(c.frameAt(0.1), null);
  assert.equal(calls.head, 0);
  assert.equal(calls.get, 0);
  assert.equal(calls.arrayBuffer, 0);
});

ok("File.size ở ngưỡng production: 128 MiB + 1 byte chặn không fetch, đúng 128 MiB không chặn", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: null,
    getBody: null,
  });
  const over = new ReversePreviewController("fake://s4-prod-over.mp4", 2, {
    knownFileSizeBytes: REVERSE_LARGE_FILE_FALLBACK_BYTES + 1,
  });
  assert.equal(over.failed, true);
  assert.equal(over.largeFileFallback, true);
  assert.equal(await over.ensureWindowForTime(0.1), false);
  const exact = new ReversePreviewController("fake://s4-prod-exact.mp4", 2, {
    knownFileSizeBytes: REVERSE_LARGE_FILE_FALLBACK_BYTES,
  });
  // Đúng ngưỡng thì KHÔNG khóa ở constructor (chỉ > ngưỡng mới chặn);
  // ensure sẽ fetch (fake trả body null -> catch -> false) nhưng đã
  // chứng minh cổng không chặn nhầm tại biên. Fetch phải xảy ra.
  assert.equal(exact.failed, false);
  assert.equal(exact.largeFileFallback, false);
  await exact.ensureWindowForTime(0.1);
  assert.ok(calls.get >= 1);
});

ok("File.size trong ngưỡng: tải + decode bình thường, nhả buffer", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: String(fixtureBytes().length),
    getBody: fixtureBytes(),
  });
  const c = new ReversePreviewController("fake://s4-small.mp4", 2, {
    largeFileBytes: 1024,
    knownFileSizeBytes: 100,
  });
  assert.equal(c.failed, false);
  assert.equal(await c.ensureWindowForTime(0.1), true);
  assert.equal(c.cacheSize, 2);
  assert.equal(c.retainedFileBytes, 0);
  assert.equal(calls.get, 1);
});

ok("File.size không hợp lệ (0 / âm / NaN) được coi như chưa biết", async () => {
  for (const bad of [0, -5, NaN]) {
    const calls = installFetch({
      headLength: null,
      headOk: false,
      getLength: String(fixtureBytes().length),
      getBody: fixtureBytes(),
    });
    const c = new ReversePreviewController(`fake://s4-bad-${String(bad)}.mp4`, 2, {
      largeFileBytes: 1024,
      knownFileSizeBytes: bad,
    });
    assert.equal(c.failed, false);
    assert.equal(await c.ensureWindowForTime(0.1), true);
    assert.equal(calls.get, 1);
  }
});

ok("registry: size lớn ở lần tạo đầu khóa ngay, lần sau không gỡ khóa; frameFor không fetch", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: null,
    getBody: null,
  });
  // Registry dùng ngưỡng production mặc định (128 MiB) nên size phải
  // vượt ngưỡng thật mới khóa — dùng 200 MiB, không cần file thật vì
  // cổng chặn trước fetch.
  const c = getReversePreviewController(
    "fake://s4-registry.mp4",
    200 * 1024 * 1024,
  );
  assert.equal(c.failed, true);
  assert.equal(c.largeFileFallback, true);
  // Cùng URL, lần sau truyền size nhỏ cũng không gỡ khóa (first-wins).
  const c2 = getReversePreviewController("fake://s4-registry.mp4", 10);
  assert.equal(c2, c);
  assert.equal(c2.failed, true);
  assert.equal(
    reverseWebcodecsFrameFor("fake://s4-registry2.mp4", 0.1, 300 * 1024 * 1024),
    null,
  );
  assert.equal(calls.head, 0);
  assert.equal(calls.get, 0);
});

ok("registry: controller đã tải xong thì size tới muộn không ghi đè", async () => {
  const calls = installFetch({
    headLength: null,
    headOk: false,
    getLength: String(fixtureBytes().length),
    getBody: fixtureBytes(),
  });
  const c = new ReversePreviewController("fake://s4-late.mp4", 2, {
    largeFileBytes: 1024,
  });
  assert.equal(await c.ensureWindowForTime(0.1), true);
  const knownAfterLoad = c.knownFileSizeBytes;
  assert.equal(knownAfterLoad, fixtureBytes().length);
  // Size tới muộn (kể cả lớn) bị bỏ qua vì đã biết size từ header.
  assert.equal(c.applyKnownFileSize(99999), false);
  assert.equal(c.failed, false);
  assert.equal(c.knownFileSizeBytes, knownAfterLoad);
  assert.equal(calls.get, 1);
});

void runAll();
