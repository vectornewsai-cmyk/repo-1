// settle49E3.test.ts — Phase 9 đợt 49, luồng E3: khóa hành vi resolve
// sớm của decodeGop khi đủ frame MỚI (hướng (b) thắng đuôi flush).
//
// Nợ mở D2: prefetch 412 [12150,12285] (136 chunk) chồng cửa sổ 412
// 46 frame đã có trong cache → decoded tối đa 90 < range.length 136
// nên điều kiện resolve sớm cũ trong output callback (`decoded >=
// range.length`) KHÔNG BAO GIỜ chạm → `done` chỉ resolve sau
// `await decoder.flush()` (đuôi flush 71–281 ms sau cuối W2, D2 §3).
// Hướng (b): resolve khi decoded >= số frame MỚI (chưa có trong cache
// lúc bắt đầu) thay vì >= range.length. Fallback IIFE (feed hết +
// flush + resolve) giữ nguyên cho trường hợp frame hỏng / decode dở.
//
// Test thuần, import ReverseFrameCache từ production (mẫu Y6: fake
// VideoDecoder/EncodedVideoChunk qua globalThis), chạy bằng esbuild
// bundle --format=esm (mẫu A1/B1/C2/D2):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settle49E3.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/e3.test.mjs \
//     && node <scratch>/e3.test.mjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
// Test này KHÔNG phải bằng chứng headed: số headed thật nằm ở
// docs/PHASE9_ROUND49_E3_SETTLE_LIMITS.md.
import assert from "node:assert/strict";
import {
  ReverseFrameCache,
  ReversePreviewController,
  disposeReverseWebcodecsControllers,
} from "./reverseWebcodecs";
import { ReverseDecodeAhead } from "./reverseDecodeAhead";

const g = globalThis as unknown as Record<string, unknown>;

let pass = 0;
const queue: Array<{ name: string; fn: () => Promise<void> | void }> = [];
function ok(name: string, fn: () => Promise<void> | void): void {
  queue.push({ name, fn });
}

type FakeFrame = { timestamp: number; close: () => void };
type FakeDecoderInit = {
  output: (frame: FakeFrame) => void;
  error: (e: unknown) => void;
};

/** Decoder giả ghi lại mọi lần gọi; output bắn đồng bộ trong decode(). */
class FakeDecoder {
  static created: FakeDecoder[] = [];
  init: FakeDecoderInit;
  decodeCalls: number[] = [];
  flushCalled = false;
  flushResolved = false;
  closed = false;
  /** false = decoder này không output frame nào (mô hình GOP hỏng). */
  outputsEnabled = true;
  constructor(init: FakeDecoderInit) {
    this.init = init;
    FakeDecoder.created.push(this);
  }
  configure(): void {}
  decode(chunk: { timestamp: number }): void {
    this.decodeCalls.push(chunk.timestamp);
    if (this.outputsEnabled) {
      this.init.output({
        timestamp: chunk.timestamp,
        close: () => {},
      });
    }
  }
  flush(): Promise<void> {
    this.flushCalled = true;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.flushResolved = true;
        resolve();
      }, 60);
    });
  }
  close(): void {
    this.closed = true;
  }
}

class FakeChunk {
  type: string;
  timestamp: number;
  duration: number;
  data: Uint8Array;
  constructor(init: {
    type: string;
    timestamp: number;
    duration: number;
    data: Uint8Array;
  }) {
    this.type = init.type;
    this.timestamp = init.timestamp;
    this.duration = init.duration;
    this.data = init.data;
  }
}

function installFakes(): void {
  FakeDecoder.created = [];
  g["VideoDecoder"] = FakeDecoder;
  g["EncodedVideoChunk"] = FakeChunk;
}

function restoreFakes(saved: Record<string, unknown>): void {
  for (const k of ["VideoDecoder", "EncodedVideoChunk"]) {
    if (saved[k] === undefined) delete g[k];
    else g[k] = saved[k];
  }
}

const savedGlobals: Record<string, unknown> = {
  VideoDecoder: g["VideoDecoder"],
  EncodedVideoChunk: g["EncodedVideoChunk"],
};

function fakeTrack(): unknown {
  return {
    codec: "avc1.64001F",
    width: 64,
    height: 64,
    description: undefined,
    timescale: 1000,
  };
}

/** 10 sample liên tiếp, sample đầu là key, timestamp duy nhất. */
function fakeSamples(from: number, count: number): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < count; i++) {
    const idx = from + i;
    out.push({
      index: idx,
      isKey: i === 0,
      timestamp: idx * 33,
      presentationTimestamp: idx * 33,
      duration: 33,
      offset: idx * 4,
      size: 4,
    });
  }
  return out;
}

type DecodeGopFn = (
  t: unknown,
  s: unknown[],
  from: number,
  to: number,
  get: (s: unknown) => Promise<Uint8Array>,
) => Promise<number>;

async function runDecodeGop(
  cache: ReverseFrameCache,
  track: unknown,
  samples: unknown[],
  from: number,
  to: number,
): Promise<number> {
  const getData = async (): Promise<Uint8Array> => new Uint8Array([0, 0, 0, 1]);
  return (cache as unknown as { decodeGop: DecodeGopFn }).decodeGop(
    track,
    samples,
    from,
    to,
    getData,
  );
}

// --- (1) HƯỚNG (b), test ĐỎ-TRƯỚC: chồng cache thì resolve trước flush ---
// Prefetch 412 thu nhỏ: range 100..109 (10 chunk), 5 frame cuối
// (105..109) đã có trong cache từ lần decode trước → frame mới = 5.
// Code cũ: decoded tối đa 5 < range.length 10 → `done` chỉ resolve
// sau flush (60 ms) → lúc decodeGop trả về, flushResolved = true.
// Code mới (b): resolve khi decoded >= 5 → trả về TRƯỚC khi flush
// resolve (flushResolved = false), decoder vẫn close sau đó.
ok("E3(b)-red: range chồng cache 5/10 frame mới → decodeGop trả về TRƯỚC khi flush resolve", async () => {
  installFakes();
  try {
    const cache = new ReverseFrameCache();
    const track = fakeTrack();
    const samples = fakeSamples(100, 10);
    // Lần 1: decode 105..109 vào cache (mô hình cửa sổ 412 đã decode).
    const n1 = await runDecodeGop(cache, track, samples, 5, 9);
    assert.equal(n1, 5);
    assert.equal(cache.size, 5);
    // Lần 2: decode toàn range 100..109 (mô hình prefetch chồng 5 frame).
    const before = FakeDecoder.created.length;
    const n2 = await runDecodeGop(cache, track, samples, 0, 9);
    const dec2 = FakeDecoder.created[before];
    assert.equal(n2, 5, "chỉ đếm 5 frame mới");
    assert.equal(cache.size, 10, "đủ 10 frame trong cache sau lần 2");
    assert.equal(
      dec2.flushResolved,
      false,
      "decodeGop ĐÃ trả về trước khi flush resolve (resolve sớm khi đủ frame mới) — " +
        "code cũ trả về sau flush nên flushResolved=true, test này ĐỎ trước khi sửa",
    );
    assert.equal(dec2.flushCalled, false, "lúc trả về sớm, feed loop chưa tới flush (flush chạy nền sau đó)");
    // Dọn nền vẫn chạy tới cùng sau khi trả về sớm: feed hết, flush resolve + close.
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(dec2.flushCalled, true, "flush vẫn được gọi (dọn decoder nền)");
    assert.equal(dec2.flushResolved, true);
    assert.equal(dec2.closed, true);
  } finally {
    restoreFakes(savedGlobals);
  }
});

// --- (5) HƯỚNG (b), test ĐỎ-TRƯỚC: tắt decode-ahead dọn prefetch đã settle ---
// Với (b), prefetch có thể settle TRƯỚC khi toggle (resolve sớm ở
// output thứ 90): lúc đó .then(drop) đã chạy khi còn bật nên no-op,
// frame prefetch nằm lại cache sau khi tắt (badge prefetch 0 nhưng
// cache vẫn giữ 90 frame). disableDecodeAhead() phải dọn đoạn đó
// khi không còn prefetch nào bay.
// Mô hình: cửa sổ 412 [12240,12360] (121 frame) + prefetch 412
// [12150,12285] (136 chunk, 90 frame mới) — cache 211 sau 2 lần
// decodeGop bằng decoder giả; lastDecodeRange + decodeAhead +
// aheadRange đặt bằng bracket access (private, esbuild không
// type-check — theo mẫu harness Y.*).
ok("E3(b)-drop-red: prefetch đã settle trước toggle → disableDecodeAhead dọn 90 frame, cache 211→121", async () => {
  installFakes();
  try {
    const ctrl = new ReversePreviewController("blob:e3-drop-test", 15, {});
    try {
      const rec = ctrl as unknown as Record<string, unknown>;
      const cache = rec["cache"] as ReverseFrameCache;
      const track = fakeTrack();
      // Cửa sổ 412 trước (121 frame), rồi prefetch 412 (thêm 90 mới).
      const winSamples = fakeSamples(12240, 121);
      const n1 = await runDecodeGop(cache, track, winSamples, 0, 120);
      assert.equal(n1, 121);
      const pfSamples = fakeSamples(12150, 136);
      const n2 = await runDecodeGop(cache, track, pfSamples, 0, 135);
      assert.equal(n2, 90, "prefetch chỉ thêm 90 frame mới (46 trùng đã có)");
      assert.equal(cache.size, 211);
      rec["lastDecodeRange"] = { from: 12240, to: 12360 };
      rec["decodeAhead"] = new ReverseDecodeAhead(cache);
      rec["aheadRange"] = { from: 12150, to: 12285 };
      rec["decodeAheadEnabled"] = true;
      // Prefetch ĐÃ settle: inFlight rỗng (khóa đã xóa ở .finally).
      assert.equal(ctrl.inFlightPrefetchCount, 0);
      ctrl.disableDecodeAhead();
      assert.equal(ctrl.decodeAheadActive, false);
      assert.equal(
        ctrl.cacheFrameCount,
        121,
        "disableDecodeAhead ĐÃ dọn 90 frame prefetch đã settle — code chưa sửa thì cache vẫn 211, test này ĐỎ trước khi sửa",
      );
      assert.equal(ctrl.settledPrefetchDroppedCount, 90);
    } finally {
      ctrl.dispose();
    }
  } finally {
    restoreFakes(savedGlobals);
    disposeReverseWebcodecsControllers();
  }
});

// --- (6) Khóa guard: prefetch ĐANG BAY thì disableDecodeAhead KHÔNG dọn ---
// Frame của decoder đang output dở không được evict ở lúc tắt —
// .then(drop) sau khi prefetch settle vẫn dọn như cũ.
ok("E3(b)-drop-lock: prefetch đang bay → disableDecodeAhead KHÔNG dọn, cache giữ 211", async () => {
  installFakes();
  try {
    const ctrl = new ReversePreviewController("blob:e3-drop-test-guard", 15, {});
    try {
      const rec = ctrl as unknown as Record<string, unknown>;
      const cache = rec["cache"] as ReverseFrameCache;
      const track = fakeTrack();
      const winSamples = fakeSamples(12240, 121);
      await runDecodeGop(cache, track, winSamples, 0, 120);
      const pfSamples = fakeSamples(12150, 136);
      await runDecodeGop(cache, track, pfSamples, 0, 135);
      assert.equal(cache.size, 211);
      rec["lastDecodeRange"] = { from: 12240, to: 12360 };
      rec["decodeAhead"] = new ReverseDecodeAhead(cache);
      rec["aheadRange"] = { from: 12150, to: 12285 };
      rec["decodeAheadEnabled"] = true;
      // Giả lập prefetch đang bay: khóa còn trong Set inFlight.
      const da = rec["decodeAhead"] as unknown as Record<string, unknown>;
      (da["inFlight"] as Set<string>).add("12150:12285");
      assert.equal(ctrl.inFlightPrefetchCount, 1);
      ctrl.disableDecodeAhead();
      assert.equal(
        ctrl.cacheFrameCount,
        211,
        "prefetch đang bay thì KHÔNG dọn ở lúc tắt (đợi .then(drop) sau settle)",
      );
      assert.equal(ctrl.settledPrefetchDroppedCount, 0);
    } finally {
      ctrl.dispose();
    }
  } finally {
    restoreFakes(savedGlobals);
    disposeReverseWebcodecsControllers();
  }
});
// Range 5 chunk, không frame nào trong cache: decoded chạm 5 =
// range.length ngay ở output cuối trong vòng feed → trả về trước
// flush resolve cả ở code cũ lẫn mới (điều kiện cũ đã làm vậy).
ok("E3(b)-lock: không chồng cache → decodeGop trả về trước flush resolve như cũ, đủ 5 frame", async () => {
  installFakes();
  try {
    const cache = new ReverseFrameCache();
    const track = fakeTrack();
    const samples = fakeSamples(200, 5);
    const before = FakeDecoder.created.length;
    const n = await runDecodeGop(cache, track, samples, 0, 4);
    const dec = FakeDecoder.created[before];
    assert.equal(n, 5);
    assert.equal(cache.size, 5);
    assert.equal(dec.flushResolved, false, "trả về trước flush resolve (hành vi cũ đã vậy)");
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(dec.flushResolved, true);
    assert.equal(dec.closed, true);
  } finally {
    restoreFakes(savedGlobals);
  }
});

// --- (3) Khóa fallback: decoder không output frame nào → chờ flush ---
// Mô hình GOP hỏng: không output nào → decoded không chạm ngưỡng →
/// `done` chỉ resolve ở cuối IIFE sau flush. Cả code cũ lẫn mới đều vậy.
ok("E3(b)-lock: decoder không output frame nào → decodeGop trả 0 SAU khi flush resolve", async () => {
  installFakes();
  try {
    const cache = new ReverseFrameCache();
    const track = fakeTrack();
    const samples = fakeSamples(300, 5);
    // Tắt output của decoder lần này (mô hình GOP hỏng).
    const before = FakeDecoder.created.length;
    const p = runDecodeGop(cache, track, samples, 0, 4);
    // Decoder được tạo đồng bộ trong decodeGop (trước await đầu tiên
    // sau probe — probe không có vì fake không định nghĩa
    // isConfigSupported): tắt output ngay khi nó xuất hiện.
    const dec = FakeDecoder.created[before];
    dec.outputsEnabled = false;
    const n = await p;
    assert.equal(n, 0);
    assert.equal(cache.size, 0);
    assert.equal(dec.flushResolved, true, "fallback IIFE: trả về sau flush");
    assert.equal(dec.closed, true);
  } finally {
    restoreFakes(savedGlobals);
  }
});

// --- (4) Khóa guard: toàn bộ range đã có trong cache → giữ hành vi cũ ---
// expectedNew = 0: KHÔNG resolve sớm trên output đầu (output nào cũng
// là trùng, decoded giữ 0) — `done` vẫn resolve ở cuối IIFE sau flush.
ok("E3(b)-lock: toàn bộ range đã cache (expectedNew=0) → decodeGop trả 0 SAU khi flush resolve", async () => {
  installFakes();
  try {
    const cache = new ReverseFrameCache();
    const track = fakeTrack();
    const samples = fakeSamples(400, 5);
    const n1 = await runDecodeGop(cache, track, samples, 0, 4);
    assert.equal(n1, 5);
    const before = FakeDecoder.created.length;
    const n2 = await runDecodeGop(cache, track, samples, 0, 4);
    const dec2 = FakeDecoder.created[before];
    assert.equal(n2, 0, "không frame mới nào");
    assert.equal(cache.size, 5);
    assert.equal(
      dec2.flushResolved,
      true,
      "expectedNew=0 thì KHÔNG resolve sớm — trả về sau flush như cũ",
    );
    assert.equal(dec2.closed, true);
  } finally {
    restoreFakes(savedGlobals);
  }
});

for (const t of queue) {
  try {
    await t.fn();
    pass++;
    console.log(`PASS ${t.name}`);
  } catch (e) {
    console.log(`FAIL ${t.name} — ${e instanceof Error ? e.message : String(e)}`);
  }
}
console.log(`\n== settle49E3.test: ${pass}/${queue.length} pass ==`);
if (pass !== queue.length) process.exit(1);
