// reverseAudio.test.ts — Khóa đảo mẫu audio + player đoạn đảo (đợt 191 P3).
// Chạy bằng Node type-stripping:
//   node --experimental-strip-types apps/web/src/lib/reverseAudio.test.ts
import assert from "node:assert/strict";
import {
  MAX_REVERSED_AUDIO_SECONDS,
  ReverseAudioPlayer,
  reverseFloat32Channel,
  reversedSampleOffset,
  reversedSegmentWindow,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
async function okAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

ok("reverseFloat32Channel: đảo đúng, không sửa input", () => {
  const src = new Float32Array([1, 2, 3, 4]);
  const out = reverseFloat32Channel(src);
  assert.deepEqual([...out], [4, 3, 2, 1]);
  assert.deepEqual([...src], [1, 2, 3, 4]);
  assert.deepEqual([...reverseFloat32Channel(new Float32Array(0))], []);
});

ok("reversedSampleOffset: đầu clip → cuối buffer đảo, cuối clip → đầu", () => {
  const args = {
    clipStartSec: 10,
    clipDurationSec: 4,
    sampleRate: 1000,
  };
  // playhead 10 (đầu clip) → source xuôi 0 → buffer đảo ở mẫu 4000.
  assert.equal(reversedSampleOffset({ ...args, playheadSec: 10 }), 4000);
  // playhead 12 (giữa) → mẫu 2000.
  assert.equal(reversedSampleOffset({ ...args, playheadSec: 12 }), 2000);
  // playhead 13.999 (cuối clip) → mẫu ~1.
  assert.equal(reversedSampleOffset({ ...args, playheadSec: 13.999 }), 1);
});

ok("reversedSampleOffset: ngoài clip → -1, tham số sai → -1", () => {
  const args = {
    clipStartSec: 10,
    clipDurationSec: 4,
    sampleRate: 1000,
  };
  assert.equal(reversedSampleOffset({ ...args, playheadSec: 9.9 }), -1);
  assert.equal(reversedSampleOffset({ ...args, playheadSec: 14 }), -1);
  assert.equal(
    reversedSampleOffset({ ...args, clipDurationSec: 0, playheadSec: 10 }),
    -1,
  );
});

ok("reversedSegmentWindow: cửa sổ từ offset đi tới, chặn ở cuối buffer", () => {
  const w = reversedSegmentWindow({
    playheadSec: 12,
    clipStartSec: 10,
    clipDurationSec: 4,
    sampleRate: 1000,
    windowSec: 1,
  });
  assert.deepEqual(w, { startSample: 2000, lengthSamples: 1000 });
  // playhead 13.5 → offset 500, còn 3500 mẫu nhưng window 1s = 1000.
  const w2 = reversedSegmentWindow({
    playheadSec: 13.5,
    clipStartSec: 10,
    clipDurationSec: 4,
    sampleRate: 1000,
    windowSec: 1,
  });
  assert.deepEqual(w2, { startSample: 500, lengthSamples: 1000 });
  // playhead ngoài clip → null; window <= 0 → null.
  assert.equal(
    reversedSegmentWindow({
      playheadSec: 20,
      clipStartSec: 10,
      clipDurationSec: 4,
      sampleRate: 1000,
      windowSec: 1,
    }),
    null,
  );
  assert.equal(
    reversedSegmentWindow({
      playheadSec: 12,
      clipStartSec: 10,
      clipDurationSec: 4,
      sampleRate: 1000,
      windowSec: 0,
    }),
    null,
  );
});

// --- Fake AudioContext tối thiểu cho player ---
function fakeBuffer(
  channels: Float32Array[],
  sampleRate = 1000,
): ReversedAudioBufferLike {
  return {
    numberOfChannels: channels.length,
    length: channels[0]?.length ?? 0,
    sampleRate,
    duration: (channels[0]?.length ?? 0) / sampleRate,
    getChannelData: (ch: number) => channels[ch],
  };
}

function makeFakeCtx(decoded: ReversedAudioBufferLike): {
  ctx: ReversedAudioContextLike;
  started: Array<{ offset: number; dur: number }>;
  stopped: number;
} {
  const started: Array<{ offset: number; dur: number }> = [];
  let stopped = 0;
  const gain = {
    value: 1,
    setTargetAtTime: () => {},
    linearRampToValueAtTime: () => {},
  };
  const ctx = {
    sampleRate: 1000,
    currentTime: 5,
    state: "running",
    destination: {},
    decodeAudioData: async () => decoded,
    createBuffer: (ch: number, len: number, sr: number) => {
      const arrs = Array.from({ length: ch }, () => new Float32Array(len));
      return fakeBuffer(arrs, sr);
    },
    createBufferSource: () => ({
      buffer: null as ReversedAudioBufferLike | null,
      connect: () => {},
      disconnect: () => {},
      start: (_w?: number, o?: number, d?: number) => {
        started.push({ offset: o ?? 0, dur: d ?? 0 });
      },
      stop: () => {
        stopped++;
      },
    }),
    createGain: () => ({
      gain,
      connect: () => {},
      disconnect: () => {},
    }),
    resume: async () => {},
  } as unknown as ReversedAudioContextLike;
  return { ctx, started, get stopped() { return stopped; } };
}

await okAsync("player: load đảo đúng kênh + phát đoạn từ offset", async () => {
  const decoded = fakeBuffer([
    new Float32Array([1, 2, 3, 4]),
    new Float32Array([10, 20, 30, 40]),
  ]);
  const { ctx, started } = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(ctx);
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), true);
  assert.equal(p.loaded, true);
  assert.equal(p.durationSec, 0.004);
  assert.equal(p.playSegment(1, 0.002), true);
  assert.equal(started.length, 1);
  assert.equal(started[0].offset, 0.001);
});

await okAsync("player: clip quá dài (>60s) → không load, giữ mute", async () => {
  const long = fakeBuffer([new Float32Array(61_000)], 1000);
  const { ctx } = makeFakeCtx(long);
  const p = new ReverseAudioPlayer(ctx);
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), false);
  assert.equal(p.loaded, false);
  assert.equal(p.playSegment(0, 1), false);
  assert.equal(MAX_REVERSED_AUDIO_SECONDS, 60);
});

await okAsync("player: decode lỗi → load false, không throw", async () => {
  const bad = {
    sampleRate: 1000,
    currentTime: 0,
    state: "running",
    destination: {},
    decodeAudioData: async () => {
      throw new Error("bad file");
    },
    createBuffer: () => {
      throw new Error("no");
    },
    createBufferSource: () => {
      throw new Error("no");
    },
    createGain: () => {
      throw new Error("no");
    },
    resume: async () => {},
  } as unknown as ReversedAudioContextLike;
  const p = new ReverseAudioPlayer(bad);
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), false);
});

await okAsync("player: stop() fade ra + dọn source; phát lại không chồng", async () => {
  const decoded = fakeBuffer([new Float32Array([1, 2, 3, 4])]);
  const { ctx, started } = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(ctx);
  await p.loadReversed(new ArrayBuffer(8));
  assert.equal(p.playSegment(0, 0.004), true);
  assert.equal(p.playSegment(2, 0.002), true);
  assert.equal(started.length, 2);
  p.stop();
  p.dispose();
  assert.equal(p.loaded, false);
});

console.log(`reverseAudio.test.ts: ${pass} test PASS`);
