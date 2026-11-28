// reverseAudio195P3.test.ts — Đợt 195 P3: chẩn đoán đo headed.
// (1) holdMaxSec — giữ playhead dài nhất từng thấy, để chứng minh trần
// drift 0,3 s khi hold > 0,3 s (đợt 196 P3 siết từ 0,5 s về 0,3 s,
// quyết parent (a4)-195; nợ §5.1 đợt 194: holdCapStop 0 trong
// pass headed 194 nên trần chưa được kiểm headed).
// (2) windowRebuilds + lastWindowDecodeMs + snapshot windows — thời
// gian decode cửa sổ + hành vi tại mép cửa sổ cho clip dài 300–600 s
// (nợ §5.2 đợt 194 / §5.4 đợt 193: decode toàn file tạm thời mỗi lần
// đổi cửa sổ, chưa đo).
//   node --experimental-strip-types apps/web/src/lib/reverseAudio195P3.test.ts
import assert from "node:assert/strict";
import {
  ReverseAudioPlayer,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import {
  ReverseAudioWiring,
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

// --- fake ctx (giống reverseAudio194P3.test.ts) ---
function fakeBuffer(channels: Float32Array[], sampleRate = 1000): ReversedAudioBufferLike {
  return {
    numberOfChannels: channels.length,
    length: channels[0]?.length ?? 0,
    sampleRate,
    duration: (channels[0]?.length ?? 0) / sampleRate,
    getChannelData: (ch: number) => channels[ch],
  };
}

interface RecSrc {
  stopWhens: number[];
  startOffsets: number[];
  startDurs: number[];
  rate: number;
}
interface RecGain {
  targets: Array<{ v: number; t: number; tc: number }>;
  ramps: Array<{ v: number; t: number }>;
}
function makeFakeCtx(decoded: ReversedAudioBufferLike): {
  ctx: ReversedAudioContextLike;
  sources: RecSrc[];
  gains: RecGain[];
  buffers: ReversedAudioBufferLike[];
  setNow: (t: number) => void;
} {
  const sources: RecSrc[] = [];
  const gains: RecGain[] = [];
  const buffers: ReversedAudioBufferLike[] = [];
  let now = 0;
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
      const b = fakeBuffer(arrs, sr);
      buffers.push(b);
      return b;
    },
    createBufferSource: () => {
      const rec: RecSrc = { stopWhens: [], startOffsets: [], startDurs: [], rate: 1 };
      sources.push(rec);
      const src = {
        buffer: null as ReversedAudioBufferLike | null,
        playbackRate: { value: 1 },
        connect: () => {},
        disconnect: () => {},
        start: (_w?: number, o?: number, d?: number) => {
          rec.startOffsets.push(o ?? 0);
          rec.startDurs.push(d ?? 0);
          rec.rate = src.playbackRate.value;
        },
        stop: (w?: number) => {
          rec.stopWhens.push(w ?? 0);
        },
      };
      return src;
    },
    createGain: () => {
      const rec: RecGain = { targets: [], ramps: [] };
      gains.push(rec);
      return {
        gain: {
          value: 1,
          setTargetAtTime: (v: number, t: number, tc: number) => {
            rec.targets.push({ v, t, tc });
          },
          linearRampToValueAtTime: (v: number, t: number) => {
            rec.ramps.push({ v, t });
          },
        },
        connect: () => {},
        disconnect: () => {},
      };
    },
    resume: async () => {},
  } as unknown as ReversedAudioContextLike;
  return {
    ctx,
    sources,
    gains,
    buffers,
    setNow: (t: number) => {
      now = t;
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

function entry(t: number, s: number, dur = 4): ReverseAudioWiringEntry {
  return {
    clipKey: "clip1", url: "blob:audio1", sourceDurationSec: dur,
    sourceTimeSec: s, gain: 1, speed: 1,
  };
}
async function loadedWiring(durSec = 4): Promise<{
  w: ReverseAudioWiring;
  f: ReturnType<typeof makeFakeCtx>;
}> {
  const decoded = fakeBuffer([new Float32Array(durSec * 1000)]);
  const f = makeFakeCtx(decoded);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  const s0 = durSec - 0.5;
  w.tick(durSec + 5, [entry(durSec + 5, s0, durSec)]);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  return { w, f };
}

await okAsync("holdMaxSec: ghi giữ dài nhất; giữ quá 0,3 s thì LẶP đoạn (C3, quyết (a6)-201) thay vì cap dừng", async () => {
  const { w, f } = await loadedWiring(4);
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1 bắt đầu, offset 0,5 s
  // Hold từ ctx 0,1 tới 0,3 (giữ lâu nhất ~0,2 s) vẫn keep.
  // (Đợt 195: trần 0,5 s — giữ tới 0,5 vẫn keep; đợt 196 siết 0,3 s.
  // Đợt 202: quyết (a6)-201 BỎ cap-stop, thay bằng C3-loop — đoạn hết
  // hạn giữa hold thì lặp lại cùng đoạn, holdCapStop luôn 0.)
  for (let i = 1; i <= 3; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  let c = w.debugSnapshot().counters;
  assert.equal(c.holdCapStop, 0);
  assert.ok(Math.abs(c.holdMaxSec - 0.2) < 1e-9, `holdMaxSec=${c.holdMaxSec}, kỳ vọng 0,2`);
  // Giữ tới ctx 0,5 (giữ ~0,4 s > trần cũ 0,3 s): đoạn 1 vừa hết hạn
  // (bắt đầu ctx 0, dài 0,5 s) → LẶP cùng đoạn, holdMaxSec ~0,4.
  f.setNow(0.5);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 2, "đoạn hết hạn giữa hold phải lặp lại ngay");
  assert.equal(f.sources[1].startOffsets[0], 0.5, "lặp CÙNG đoạn (offset 0,5 s)");
  c = w.debugSnapshot().counters;
  assert.equal(c.holdCapStop, 0, "C3-loop: không còn cap-stop");
  assert.equal(c.holdLoopRestart, 1);
  assert.ok(Math.abs(c.holdMaxSec - 0.4) < 1e-9, `holdMaxSec=${c.holdMaxSec}, kỳ vọng 0,4`);
  // Clip ngắn không có cửa sổ: snapshot windows rỗng.
  assert.deepEqual(w.debugSnapshot().windows, []);
});

await okAsync("windowed 70 s: cửa sổ đầu [39,5; 69,5] + lastDecodeMs là số", async () => {
  const { w } = await loadedWiring(70);
  const snap = w.debugSnapshot();
  assert.deepEqual(snap.longClips, ["clip1"]);
  assert.equal(snap.windows.length, 1);
  const win = snap.windows[0];
  assert.equal(win.clip, "clip1");
  assert.ok(Math.abs(win.windowStartSec - 39.5) < 1e-9, `windowStart=${win.windowStartSec}`);
  assert.ok(Math.abs(win.windowEndSec - 69.5) < 1e-9, `windowEnd=${win.windowEndSec}`);
  assert.equal(win.rebuilding, false);
  assert.equal(typeof win.lastDecodeMs, "number");
  assert.ok(win.lastDecodeMs >= 0);
  assert.equal(snap.counters.windowRebuilds, 0);
  assert.equal(snap.counters.lastWindowDecodeMs, win.lastDecodeMs);
});

await okAsync("rebuild tại mép: source 44 < 39,5+5 thì đổi cửa sổ về [14; 44]", async () => {
  const { w, f } = await loadedWiring(70);
  f.setNow(0);
  // Playhead 69,5 → 44 (source 44): tới gần mép dưới cửa sổ
  // (wStart 39,5 + preload 5 = 44,5) nên decode cửa sổ mới nền.
  w.tick(44, [entry(44, 44, 70)]);
  await tick();
  await tick();
  await tick();
  const snap = w.debugSnapshot();
  assert.equal(snap.counters.windowRebuilds, 1, "chưa đếm rebuild hoàn tất");
  assert.equal(snap.windows.length, 1);
  const win = snap.windows[0];
  assert.equal(win.rebuilding, false);
  assert.ok(Math.abs(win.windowStartSec - 14) < 1e-9, `windowStart=${win.windowStartSec}`);
  assert.ok(Math.abs(win.windowEndSec - 44) < 1e-9, `windowEnd=${win.windowEndSec}`);
  assert.equal(typeof win.lastDecodeMs, "number");
  assert.ok(win.lastDecodeMs >= 0);
  // Đoạn vẫn phát được từ cửa sổ mới (offset tuyệt đối 26000 → tương
  // đối 0 trong cửa sổ [14; 44]).
  assert.equal(w.isPlaying, true);
});

console.log(`reverseAudio195P3.test: ${pass} passed`);
