// reverseFileCancel37T5.test.ts — Hủy fetch đang bay khi size tới muộn
// (đợt 37 T5, đóng nợ §5.1 của docs/PHASE9_ROUND36_S4_FILE_HEAP_LIMITS.md:
// đợt 36 S4 chỉ chặn được khi size có TRƯỚC lần fetch đầu; size tới
// muộn trong lúc fetch đang bay thì body vẫn chạy tới hết).
//
// Cơ chế mới trong reverseWebcodecs.ts: load() chạy dưới 1
// AbortController riêng; applyKnownFileSize vượt ngưỡng hủy lần tải
// đó trước khi khóa fallback. Test này chứng minh bằng fake fetch
// có kiểm soát (không dùng file lớn thật — ngưỡng test 1024 byte,
// size "lớn" chỉ là con số 5000, giống cách S4 chứng minh cổng
// production 128 MiB bằng số byte mà không cần file thật).
//
// Chạy bằng esbuild bundle (cùng lý do R3/S4: reverseWebcodecs.ts
// import "./mp4Demux" không đuôi nên Node strip-types không resolve):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseFileCancel37T5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r37t5.test.cjs \
//     && node /tmp/r37t5.test.cjs
// (chạy từ gốc repo). Fake VideoDecoder + fixture MP4 sao chép công
// thức R3/S4 (12 sample, keyframe 0 và 6, mỗi sample 10 byte).
import assert from "node:assert/strict";
import {
  ReversePreviewController,
  getReversePreviewController,
} from "./reverseWebcodecs.ts";

// Harness chạy TUẦN TỰ như R3/S4 (global fetch/VideoDecoder dùng chung).
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
  console.log(`reverseFileCancel37T5: ${pass}/${queue.length} test pass`);
}

// ---- Fake VideoDecoder / EncodedVideoChunk (như R3/S4) ----
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

// ---- Fixture MP4 dựng tay (sao chép công thức R3/S4) ----
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

// ---- Hỗ trợ fake fetch có kiểm soát ----
type FetchInit = { method?: string; signal?: AbortSignal };
type Deferred<T> = {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
};
function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
function abortError(): Error {
  const e = new Error("aborted");
  e.name = "AbortError";
  return e;
}
/** Promise reject ngay khi signal abort (fetch chuẩn tôn trọng signal). */
function abortable<T>(signal: AbortSignal | undefined, inner: Promise<T>): Promise<T> {
  if (!signal) return inner;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    inner.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      },
    );
  });
}
function headResp(length: string | null): unknown {
  return {
    ok: true,
    headers: {
      get: (k: string): string | null =>
        k === "content-length" ? length : null,
    },
  };
}
async function waitUntil(
  cond: () => boolean,
  label: string,
  timeoutMs = 2000,
): Promise<void> {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout chờ ${label}`);
    await new Promise((r) => setTimeout(r, 5));
  }
}
function fixtureResp(calls: { arrayBuffer: number; cancelled: number }): unknown {
  return {
    ok: true,
    headers: { get: (): string | null => null },
    body: {
      cancel: async (): Promise<void> => {
        calls.cancelled++;
      },
    },
    arrayBuffer: async (): Promise<ArrayBuffer> => {
      calls.arrayBuffer++;
      const body = fixtureBytes();
      return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    },
  };
}

// ---- Test 1: size lớn tới muộn trong lúc HEAD bay -> hủy, GET = 0 ----
ok("size lớn tới muộn lúc HEAD bay: hủy HEAD, GET = 0, arrayBuffer = 0, không tải lại", async () => {
  const calls = { head: 0, get: 0, arrayBuffer: 0, cancelled: 0 };
  const headGate = deferred<unknown>();
  g.fetch = async (_url: string, init?: FetchInit): Promise<unknown> => {
    if (init && init.method === "HEAD") {
      calls.head++;
      return abortable(init.signal, headGate.promise);
    }
    calls.get++;
    return fixtureResp(calls);
  };
  const c = new ReversePreviewController("fake://t5-head.mp4", 2, {
    largeFileBytes: 1024,
  });
  const p = c.ensureWindowForTime(0.1);
  await waitUntil(() => calls.head === 1, "HEAD bắt đầu");
  // Size tới muộn, vượt ngưỡng -> khóa + hủy HEAD đang bay.
  assert.equal(c.applyKnownFileSize(5000), true);
  assert.equal(c.failed, true);
  assert.equal(c.largeFileFallback, true);
  assert.equal(c.knownFileSizeBytes, 5000);
  assert.equal(await p, false);
  assert.equal(c.frameAt(0.1), null);
  assert.equal(calls.get, 0);
  assert.equal(calls.arrayBuffer, 0);
  // Gọi lại cũng không tải lại (unsupported khóa).
  assert.equal(await c.ensureWindowForTime(0.1), false);
  assert.equal(calls.get, 0);
});

// ---- Test 2: size lớn tới muộn lúc GET bay -> hủy trước arrayBuffer ----
ok("size lớn tới muộn lúc GET bay: arrayBuffer bị reject, không decode, không tải lại", async () => {
  const calls = { head: 0, get: 0, arrayBuffer: 0, cancelled: 0 };
  let arrayBufferRejected = false;
  g.fetch = async (_url: string, init?: FetchInit): Promise<unknown> => {
    if (init && init.method === "HEAD") {
      calls.head++;
      return headResp(null);
    }
    calls.get++;
    return {
      ok: true,
      headers: { get: (): string | null => null },
      body: {
        cancel: async (): Promise<void> => {
          calls.cancelled++;
        },
      },
      arrayBuffer: async (): Promise<ArrayBuffer> => {
        calls.arrayBuffer++;
        // Body chưa resolve: chỉ resolve/reject theo signal — mô
        // phỏng body đang tải dở mà fetch chuẩn hủy được.
        try {
          await abortable(init?.signal, new Promise(() => {}));
        } catch {
          arrayBufferRejected = true;
          throw abortError();
        }
        throw new Error("không tới được đây");
      },
    };
  };
  const c = new ReversePreviewController("fake://t5-get.mp4", 2, {
    largeFileBytes: 1024,
  });
  const p = c.ensureWindowForTime(0.1);
  await waitUntil(() => calls.arrayBuffer === 1, "arrayBuffer bắt đầu chờ body");
  assert.equal(c.applyKnownFileSize(5000), true);
  assert.equal(await p, false);
  assert.equal(arrayBufferRejected, true);
  assert.equal(c.failed, true);
  assert.equal(c.largeFileFallback, true);
  assert.equal(c.cacheSize, 0);
  assert.equal(c.retainedFileBytes, 0);
  assert.equal(await c.ensureWindowForTime(0.1), false);
  assert.equal(calls.get, 1);
});

// ---- Test 3: size trong ngưỡng tới muộn thì KHÔNG hủy ----
ok("size trong ngưỡng tới muộn lúc HEAD bay: không hủy, tải + decode bình thường", async () => {
  const calls = { head: 0, get: 0, arrayBuffer: 0, cancelled: 0 };
  const headGate = deferred<unknown>();
  g.fetch = async (_url: string, init?: FetchInit): Promise<unknown> => {
    if (init && init.method === "HEAD") {
      calls.head++;
      return abortable(init.signal, headGate.promise);
    }
    calls.get++;
    return fixtureResp(calls);
  };
  const c = new ReversePreviewController("fake://t5-small-late.mp4", 2, {
    largeFileBytes: 1024,
  });
  const p = c.ensureWindowForTime(0.1);
  await waitUntil(() => calls.head === 1, "HEAD bắt đầu");
  // Size trong ngưỡng tới muộn: ghi nhận, không khóa, không hủy.
  assert.equal(c.applyKnownFileSize(100), false);
  assert.equal(c.failed, false);
  headGate.resolve(headResp(null));
  assert.equal(await p, true);
  assert.equal(c.cacheSize, 2);
  assert.equal(c.retainedFileBytes, 0);
  assert.equal(calls.get, 1);
});

// ---- Test 4: tầng fetch phớt lờ signal -> vẫn chặn parse/decode ----
ok("fetch phớt lờ signal: buffer resolve sau khi khóa vẫn không decode (cache = 0)", async () => {
  const calls = { head: 0, get: 0, arrayBuffer: 0, cancelled: 0 };
  const bodyGate = deferred<ArrayBuffer>();
  g.fetch = async (_url: string, init?: FetchInit): Promise<unknown> => {
    if (init && init.method === "HEAD") {
      calls.head++;
      return headResp(null);
    }
    calls.get++;
    return {
      ok: true,
      headers: { get: (): string | null => null },
      body: {
        cancel: async (): Promise<void> => {
          calls.cancelled++;
        },
      },
      // CỐ TÌNH phớt lờ init.signal: mô phỏng tầng fetch không tôn
      // trọng AbortController — buffer vẫn resolve đủ sau khi khóa.
      arrayBuffer: async (): Promise<ArrayBuffer> => {
        calls.arrayBuffer++;
        return bodyGate.promise;
      },
    };
  };
  const c = new ReversePreviewController("fake://t5-nosignal.mp4", 2, {
    largeFileBytes: 1024,
  });
  const p = c.ensureWindowForTime(0.1);
  await waitUntil(() => calls.arrayBuffer === 1, "arrayBuffer bắt đầu");
  assert.equal(c.applyKnownFileSize(5000), true);
  // Buffer fixture hợp lệ (đủ decode nếu không bị chặn) resolve sau.
  const body = fixtureBytes();
  bodyGate.resolve(
    body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  );
  assert.equal(await p, false);
  assert.equal(c.failed, true);
  assert.equal(c.cacheSize, 0);
  assert.equal(c.ready, false);
  assert.equal(c.retainedFileBytes, 0);
});

// ---- Test 5: registry — size lớn tới muộn hủy tải của controller có sẵn ----
ok("registry: size lớn tới muộn hủy tải đang bay của controller đã tạo trước", async () => {
  const calls = { head: 0, get: 0, arrayBuffer: 0, cancelled: 0 };
  const headGate = deferred<unknown>();
  g.fetch = async (_url: string, init?: FetchInit): Promise<unknown> => {
    if (init && init.method === "HEAD") {
      calls.head++;
      return abortable(init.signal, headGate.promise);
    }
    calls.get++;
    return fixtureResp(calls);
  };
  const url = "fake://t5-registry-late.mp4";
  const c = getReversePreviewController(url);
  const p = c.ensureWindowForTime(0.1);
  await waitUntil(() => calls.head === 1, "HEAD bắt đầu");
  // Registry nhận size lớn muộn -> applyKnownFileSize -> hủy + khóa.
  const c2 = getReversePreviewController(url, 300 * 1024 * 1024);
  assert.equal(c2, c);
  assert.equal(c.failed, true);
  assert.equal(c.largeFileFallback, true);
  assert.equal(await p, false);
  assert.equal(calls.get, 0);
});

// ---- Test 6: dispose hủy fetch đang bay ----
ok("dispose lúc HEAD bay: hủy tải, ensure = false, GET = 0", async () => {
  const calls = { head: 0, get: 0, arrayBuffer: 0, cancelled: 0 };
  const headGate = deferred<unknown>();
  g.fetch = async (_url: string, init?: FetchInit): Promise<unknown> => {
    if (init && init.method === "HEAD") {
      calls.head++;
      return abortable(init.signal, headGate.promise);
    }
    calls.get++;
    return fixtureResp(calls);
  };
  const c = new ReversePreviewController("fake://t5-dispose.mp4", 2, {
    largeFileBytes: 1024,
  });
  const p = c.ensureWindowForTime(0.1);
  await waitUntil(() => calls.head === 1, "HEAD bắt đầu");
  c.dispose();
  assert.equal(await p, false);
  assert.equal(c.frameAt(0.1), null);
  assert.equal(calls.get, 0);
});

void runAll();
