// reverseCompat43Y6.test.ts — Phase 9 đợt 43, luồng Y6: tương thích
// trình duyệt + fallback cho đường phát ngược (nợ chéo đợt 42 §5.3/§5.4/
// §5.5 "Safari/máy thật chưa đo").
//
// Chạy bằng esbuild bundle (cùng lý do U1/T4: reverseWebcodecs.ts import
// "./mp4Demux" không đuôi nên Node strip-types không resolve được):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseCompat43Y6.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/y6.test.cjs \
//     && node <scratch>/y6.test.cjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra /tmp, KHÔNG
// ra dist.)
//
// Phạm vi: CHỈ khóa logic fallback khi API vắng mặt, bằng cách xóa/ghi
// đè global trong Node — KHÔNG mạo nhận đây là Safari/Firefox/máy thật.
// Test headed Chromium (script pipe riêng, xem LIMITS Y6) mới là bằng
// chứng trên browser thật, và cũng chỉ là Chromium giả lập vắng API
// (xóa global qua CDP / truyền caps thiếu), không phải Safari thật.
//
// Các test "hồi quy" dưới đây được viết TRƯỚC khi sửa code và đã chạy
// FAIL trên code đợt 42 (xem LIMITS Y6 §2): decodeGop ném thay vì trả
// 0 khi VideoDecoder dựng thất bại, và ensureWindowForTime reject thay
// vì trả false khi AbortController vắng mặt. Sau sửa Y6, tất cả pass.
import assert from "node:assert/strict";
import {
  resolveReverseEngine,
  resolveReverseEngineDetailed,
} from "./reversePlayback.ts";
import {
  ReverseFrameCache,
  ReversePreviewController,
} from "./reverseWebcodecs.ts";
import { fetchVideoTrackByGopRange } from "./gopRangeFetch39T3.ts";

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
  console.log(`Y6 compat: ${pass}/${queue.length} pass`);
}

const g = globalThis as unknown as Record<string, unknown>;

// --- 1. Ma trận resolveReverseEngineDetailed (hàm thuần, caps truyền rõ) ---
ok("detailed: đủ caps + opt-in -> webcodecs", () => {
  const r = resolveReverseEngineDetailed(true, {
    videoDecoder: true,
    encodedVideoChunk: true,
    videoFrame: true,
  });
  assert.equal(r.engine, "webcodecs");
  assert.equal(r.reason, "webcodecs-ok");
});

ok("detailed: thiếu VideoDecoder -> element + lý do đúng", () => {
  const r = resolveReverseEngineDetailed(true, {
    videoDecoder: false,
    encodedVideoChunk: true,
    videoFrame: true,
  });
  assert.equal(r.engine, "element");
  assert.equal(r.reason, "missing-video-decoder");
});

ok("detailed: thiếu EncodedVideoChunk -> element (partial WebCodecs)", () => {
  const r = resolveReverseEngineDetailed(true, {
    videoDecoder: true,
    encodedVideoChunk: false,
    videoFrame: true,
  });
  assert.equal(r.engine, "element");
  assert.equal(r.reason, "missing-encoded-video-chunk");
});

ok("detailed: thiếu VideoFrame -> element", () => {
  const r = resolveReverseEngineDetailed(true, {
    videoDecoder: true,
    encodedVideoChunk: true,
    videoFrame: false,
  });
  assert.equal(r.engine, "element");
  assert.equal(r.reason, "missing-video-frame");
});

ok("detailed: opt-in tắt -> element + opt-in-off (bất kể caps)", () => {
  const r = resolveReverseEngineDetailed(false, {
    videoDecoder: true,
    encodedVideoChunk: true,
    videoFrame: true,
  });
  assert.equal(r.engine, "element");
  assert.equal(r.reason, "opt-in-off");
});

// --- 2. resolveReverseEngine cũ KHÔNG đổi hành vi (happy path + test Q2) ---
ok("legacy resolveReverseEngine giữ nguyên", () => {
  assert.equal(resolveReverseEngine(true, true), "webcodecs");
  assert.equal(resolveReverseEngine(true, false), "element");
  assert.equal(resolveReverseEngine(false, true), "element");
  assert.equal(resolveReverseEngine(false, false), "element");
});

// --- 3. decodeGop: VideoDecoder dựng thất bại -> trả 0, KHÔNG ném ---
// (Trước Y6: constructor throw làm promise `done` reject, caller
// ensureWindow bắt được nhưng decodeGop tự nó ném — đường gọi trực
// tiếp / harness không có try sẽ thành unhandled rejection.)
function fakeTrackAndSamples(): {
  track: unknown;
  samples: unknown[];
  getData: (s: unknown) => Promise<Uint8Array>;
} {
  const track = {
    codec: "avc1.64001F",
    width: 64,
    height: 64,
    description: undefined,
    timescale: 1000,
  };
  const samples = [
    {
      index: 0,
      isKey: true,
      timestamp: 0,
      presentationTimestamp: 0,
      duration: 1000,
      offset: 0,
      size: 4,
    },
  ];
  return {
    track,
    samples,
    getData: async () => new Uint8Array([0, 0, 0, 1]),
  };
}

ok("decodeGop: VideoDecoder constructor throw -> resolve 0, không reject", async () => {
  const saved = g["VideoDecoder"];
  const savedChunk = g["EncodedVideoChunk"];
  try {
    g["VideoDecoder"] = class {
      constructor() {
        throw new Error("decoder không dựng được (codec/config lạ)");
      }
    };
    g["EncodedVideoChunk"] = class {
      constructor(init: unknown) {
        void init;
      }
    };
    const cache = new ReverseFrameCache();
    const { track, samples, getData } = fakeTrackAndSamples();
    const n = await (cache as unknown as {
      decodeGop: (
        t: unknown,
        s: unknown[],
        from: number,
        to: number,
        get: (s: unknown) => Promise<Uint8Array>,
      ) => Promise<number>;
    }).decodeGop(track, samples, 0, 0, getData);
    assert.equal(n, 0);
    assert.equal(cache.size, 0);
  } finally {
    if (saved === undefined) delete g["VideoDecoder"];
    else g["VideoDecoder"] = saved;
    if (savedChunk === undefined) delete g["EncodedVideoChunk"];
    else g["EncodedVideoChunk"] = savedChunk;
  }
});

ok("decodeGop: thiếu EncodedVideoChunk -> trả 0 mà KHÔNG dựng decoder", async () => {
  const saved = g["VideoDecoder"];
  const savedChunk = g["EncodedVideoChunk"];
  let constructed = 0;
  try {
    g["VideoDecoder"] = class {
      constructor() {
        constructed++;
      }
      configure(): void {}
      decode(): void {}
      async flush(): Promise<void> {}
      close(): void {}
    };
    delete g["EncodedVideoChunk"];
    const cache = new ReverseFrameCache();
    const { track, samples, getData } = fakeTrackAndSamples();
    const n = await (cache as unknown as {
      decodeGop: (
        t: unknown,
        s: unknown[],
        from: number,
        to: number,
        get: (s: unknown) => Promise<Uint8Array>,
      ) => Promise<number>;
    }).decodeGop(track, samples, 0, 0, getData);
    assert.equal(n, 0);
    assert.equal(constructed, 0);
  } finally {
    if (saved === undefined) delete g["VideoDecoder"];
    else g["VideoDecoder"] = saved;
    if (savedChunk === undefined) delete g["EncodedVideoChunk"];
    else g["EncodedVideoChunk"] = savedChunk;
  }
});

// --- 4. Controller load: AbortController vắng mặt -> false + failed, KHÔNG reject ---
ok("ensureWindow: thiếu AbortController -> false + failed, không reject", async () => {
  const saved = g["AbortController"];
  try {
    g["AbortController"] = undefined;
    const c = new ReversePreviewController("https://example.invalid/y6-no-abort.mp4");
    const result = await c.ensureWindowForTime(0);
    assert.equal(result, false);
    assert.equal(c.failed, true);
    c.dispose();
  } finally {
    if (saved === undefined) delete g["AbortController"];
    else g["AbortController"] = saved;
  }
});

// --- 5. GOP: fetch vắng mặt -> fallback full-file, KHÔNG throw ---
ok("GOP: fetch vắng mặt -> mode full-file, không throw", async () => {
  const saved = g["fetch"];
  try {
    g["fetch"] = undefined;
    const outcome = await fetchVideoTrackByGopRange(
      "https://example.invalid/y6-no-fetch.mp4",
    );
    assert.equal(outcome.mode, "full-file");
    assert.ok(outcome.reason.length > 0);
  } finally {
    if (saved === undefined) delete g["fetch"];
    else g["fetch"] = saved;
  }
});

// --- 6. Audit: AssetStore constructor ném khi IndexedDB vắng (lý do guard importFiles) ---
ok("audit: new AssetStore() ném khi indexedDB vắng (Node)", async () => {
  const { AssetStore } = await import("./assetStore.ts");
  assert.equal(typeof g["indexedDB"], "undefined");
  assert.throws(() => new AssetStore(), /IndexedDB/);
});

void runAll();
