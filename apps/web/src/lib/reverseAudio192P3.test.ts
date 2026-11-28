// reverseAudio192P3.test.ts — Khóa S7c đợt 192 P3: nối audio đảo vào preview.
//   node --experimental-strip-types apps/web/src/lib/reverseAudio192P3.test.ts
import assert from "node:assert/strict";
import {
  ReverseAudioPlayer,
  reversedSampleOffsetFromSourceTime,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import {
  REVERSED_AUDIO_DRIFT_TOLERANCE_SEC,
  REVERSED_AUDIO_SEGMENT_SEC,
  ReverseAudioWiring,
  shouldRestartReverseSegment,
  type ReverseAudioWiringEntry,
} from "./reverseAudioWiring.ts";

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

// --- offset theo source time ---
ok("reversedSampleOffsetFromSourceTime: đầu/cuối file", () => {
  // File 4 s @1000 Hz: source 0 -> mẫu 4000 (cuối buffer đảo),
  // source 4 -> mẫu 0, source 2 -> mẫu 2000.
  assert.equal(
    reversedSampleOffsetFromSourceTime({ sourceTimeSec: 0, sourceDurationSec: 4, sampleRate: 1000 }),
    4000,
  );
  assert.equal(
    reversedSampleOffsetFromSourceTime({ sourceTimeSec: 4, sourceDurationSec: 4, sampleRate: 1000 }),
    0,
  );
  assert.equal(
    reversedSampleOffsetFromSourceTime({ sourceTimeSec: 2, sourceDurationSec: 4, sampleRate: 1000 }),
    2000,
  );
});
ok("reversedSampleOffsetFromSourceTime: ngoài file -> -1", () => {
  const base = { sourceDurationSec: 4, sampleRate: 1000 };
  assert.equal(reversedSampleOffsetFromSourceTime({ ...base, sourceTimeSec: -0.1 }), -1);
  assert.equal(reversedSampleOffsetFromSourceTime({ ...base, sourceTimeSec: 4.001 }), -1);
  assert.equal(
    reversedSampleOffsetFromSourceTime({ sourceTimeSec: 1, sourceDurationSec: 0, sampleRate: 1000 }),
    -1,
  );
  assert.equal(
    reversedSampleOffsetFromSourceTime({ sourceTimeSec: 1, sourceDurationSec: 4, sampleRate: 0 }),
    -1,
  );
});

// --- quyết định giữ/phát lại đoạn ---
ok("shouldRestartReverseSegment: đồng bộ thì keep", () => {
  // Đoạn bắt đầu mẫu 500, dài 500 mẫu, rate 1, now +0,25 s -> vị trí 750.
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.25, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 750,
    }),
    "keep",
  );
});
ok("shouldRestartReverseSegment: lệch quá ngưỡng thì restart", () => {
  // Kỳ vọng 900 nhưng đoạn mới tới 750 (lệch 150 mẫu > 120 mẫu ngưỡng).
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.25, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 900,
    }),
    "restart",
  );
});
ok("shouldRestartReverseSegment: đoạn đã phát hết thì restart", () => {
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.6, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 1100,
    }),
    "restart",
  );
});
ok("shouldRestartReverseSegment: rate 2 thì vị trí tăng gấp đôi", () => {
  // Đoạn rate 2, now +0,25 s -> vị trí 500 + 500 = 1000.
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.25, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 1000, sampleRate: 1000, rate: 2, expectedOffset: 1000,
    }),
    "keep",
  );
  assert.equal(REVERSED_AUDIO_SEGMENT_SEC, 0.5);
  assert.equal(REVERSED_AUDIO_DRIFT_TOLERANCE_SEC, 0.12);
});

// --- fake ctx có currentTime đổi được + ghi ramp/rate ---
function fakeBuffer(channels: Float32Array[], sampleRate = 1000): ReversedAudioBufferLike {
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
  started: Array<{ offset: number; dur: number; rate: number }>;
  ramps: Array<{ v: number; t: number }>;
  stopped: () => number;
  setNow: (t: number) => void;
} {
  const started: Array<{ offset: number; dur: number; rate: number }> = [];
  const ramps: Array<{ v: number; t: number }> = [];
  let stopped = 0;
  let now = 0;
  const gain = {
    value: 1,
    setTargetAtTime: () => {},
    linearRampToValueAtTime: (v: number, t: number) => {
      ramps.push({ v, t });
    },
  };
  const ctx = {
    sampleRate: 1000,
    get currentTime() {
      return now;
    },
    state: "running",
    destination: {},
    decodeAudioData: async () => decoded,
    createBuffer: (ch: number, len: number, sr: number) => {
      const arrs = Array.from({ length: ch }, () => new Float32Array(len));
      return fakeBuffer(arrs, sr);
    },
    createBufferSource: () => {
      const src = {
        buffer: null as ReversedAudioBufferLike | null,
        playbackRate: { value: 1 },
        connect: () => {},
        disconnect: () => {},
        start: (_w?: number, o?: number, d?: number) => {
          started.push({ offset: o ?? 0, dur: d ?? 0, rate: src.playbackRate.value });
        },
        stop: () => {
          stopped++;
        },
      };
      return src;
    },
    createGain: () => ({
      gain,
      connect: () => {},
      disconnect: () => {},
    }),
    resume: async () => {},
  } as unknown as ReversedAudioContextLike;
  return {
    ctx,
    started,
    ramps,
    stopped: () => stopped,
    setNow: (t: number) => {
      now = t;
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
function entry(over: Partial<ReverseAudioWiringEntry> = {}): ReverseAudioWiringEntry {
  return {
    clipKey: "clip1",
    url: "blob:audio1",
    sourceDurationSec: 4,
    sourceTimeSec: 3.5,
    gain: 1,
    speed: 1,
    ...over,
  };
}

await okAsync("player: playSegment gain + rate đi đúng node", async () => {
  const decoded = fakeBuffer([new Float32Array([1, 2, 3, 4])]);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), true);
  assert.equal(p.playSegment(1, 0.002, 0.5, 2), true);
  assert.equal(f.started.length, 1);
  assert.equal(f.started[0].rate, 2);
  // Fade vào ramp tới đúng gain 0.5 (không phải 1).
  assert.equal(f.ramps.length, 1);
  assert.equal(f.ramps[0].v, 0.5);
});

await okAsync("wiring: load 1 lần, phát đoạn từ offset đảo đúng", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  let fetches = 0;
  const w = new ReverseAudioWiring(f.ctx, {}, async () => {
    fetches++;
    return new ArrayBuffer(8);
  });
  // Tick 1: chưa load -> kích load, chưa phát.
  w.tick(9, [entry()]);
  assert.equal(fetches, 1);
  assert.equal(f.started.length, 0);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  // Tick 2 (playhead bước 9 -> 8.75, source 3.5 -> 3.75): offset kỳ vọng
  // (4 - 3.75) * 1000 = 250.
  f.setNow(0.25);
  w.tick(8.75, [entry({ sourceTimeSec: 3.75 })]);
  assert.equal(f.started.length, 1);
  assert.equal(f.started[0].offset, 0.25);
  assert.equal(f.started[0].dur, 0.5);
  assert.equal(w.isPlaying, true);
});

await okAsync("wiring: playhead đứng yên thì đoạn CHẠY XUYÊN HOLD, giữ buffer (a2-194)", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  w.tick(9, [entry()]);
  await tick();
  await tick();
  f.setNow(0);
  w.tick(8.75, [entry({ sourceTimeSec: 3.75 })]);
  assert.equal(f.started.length, 1);
  assert.equal(w.isPlaying, true);
  // Cùng playhead 8.75 tick lại (hold 0,1 s) -> đoạn KHÔNG bị dừng
  // nữa (quyết (a2)-193, implement đợt 194): vẫn phát, buffer vẫn load.
  f.setNow(0.1);
  w.tick(8.75, [entry({ sourceTimeSec: 3.75 })]);
  assert.equal(w.isPlaying, true);
  assert.equal(w.loadedCount, 1);
  assert.equal(f.stopped(), 0);
  assert.equal(f.started.length, 1);
  // Playhead bước tiếp (8,5, source 3,5): lệch 0,05 s trong dung sai
  // 0,12 s -> keep, không phát đoạn mới.
  f.setNow(0.2);
  w.tick(8.5, [entry({ sourceTimeSec: 3.5 })]);
  assert.equal(f.started.length, 1);
  assert.equal(w.isPlaying, true);
});

await okAsync("wiring: đoạn tự đồng bộ thì không phát lại; nhảy thì phát lại", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  w.tick(9, [entry()]);
  await tick();
  await tick();
  f.setNow(0);
  w.tick(8.75, [entry({ sourceTimeSec: 3.75 })]);
  assert.equal(f.started.length, 1);
  // +0,25 s ctx, playhead lùi 0,25 (source 3.75 -> 3.5): vị trí đoạn
  // 250 + 250 = 500 = kỳ vọng -> keep, không start mới.
  f.setNow(0.25);
  w.tick(8.5, [entry({ sourceTimeSec: 3.5 })]);
  assert.equal(f.started.length, 1);
  // Nhảy playhead xa (source 3.5 -> 2.0, kỳ vọng 2000): lệch > ngưỡng.
  f.setNow(0.3);
  w.tick(7, [entry({ sourceTimeSec: 2 })]);
  assert.equal(f.started.length, 2);
  assert.equal(f.started[1].offset, 2);
});

await okAsync("wiring: gain 0 / clip dài >60s / hết active -> không phát/dọn", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  let fetches = 0;
  const w = new ReverseAudioWiring(f.ctx, {}, async () => {
    fetches++;
    return new ArrayBuffer(8);
  });
  // Gain 0: không fetch, không phát.
  w.tick(9, [entry({ gain: 0 })]);
  assert.equal(fetches, 0);
  assert.equal(w.loadedCount, 0);
  // Clip dài 601 s (quá trần cửa sổ 600 s đợt 193): không fetch.
  // (61 s nay load theo cửa sổ — xem test đợt 193; cổng 60 s cũ đã bỏ.)
  w.tick(8.9, [entry({ sourceDurationSec: 601 })]);
  assert.equal(fetches, 0);
  // Load xong rồi clip hết active -> dispose + dọn.
  w.tick(8.8, [entry()]);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  w.tick(8.7, []);
  assert.equal(w.loadedCount, 0);
  assert.equal(w.clipKeys.length, 0);
  // stopAll dọn hết.
  w.tick(8.6, [entry()]);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  w.stopAll();
  assert.equal(w.loadedCount, 0);
  assert.equal(w.isPlaying, false);
});

await okAsync("wiring: URL đổi thì bỏ player cũ, load lại", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  let fetches = 0;
  const w = new ReverseAudioWiring(f.ctx, {}, async () => {
    fetches++;
    return new ArrayBuffer(8);
  });
  w.tick(9, [entry()]);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  assert.equal(fetches, 1);
  w.tick(8.75, [entry({ url: "blob:audio2", sourceTimeSec: 3.75 })]);
  assert.equal(w.loadedCount, 0);
  w.tick(8.5, [entry({ url: "blob:audio2", sourceTimeSec: 3.5 })]);
  assert.equal(fetches, 2);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
});

console.log(`reverseAudio192P3.test.ts: ${pass} test PASS`);
