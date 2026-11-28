// reverseAudio193P3.test.ts — Đợt 193 P3 khoản 2: audio đảo.
// (a) Crossfade 80 ms giữa các đoạn 0,5 s (không còn khoảng lặng tại
//     điểm nối như đợt 192); (b) clip dài > 60 s phát đảo theo cửa sổ
//     30 s (tới 600 s) thay vì mute; (c) restart-exact nối tiếp đúng mẫu.
//   node --experimental-strip-types apps/web/src/lib/reverseAudio193P3.test.ts
import assert from "node:assert/strict";
import {
  REVERSED_AUDIO_CROSSFADE_SEC,
  REVERSED_AUDIO_WINDOW_SEC,
  ReverseAudioPlayer,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import {
  REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC,
  REVERSED_AUDIO_OVERLAP_SEC,
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

ok("hằng số crossfade/overlap đúng thiết kế", () => {
  assert.equal(REVERSED_AUDIO_CROSSFADE_SEC, 0.08);
  assert.equal(REVERSED_AUDIO_OVERLAP_SEC, 0.1);
  // Đợt 203 P3 (quyết (a6)-202, F-201-P3-2): exact-tol 0,05 → 0,12
  // (= dung sai drift) — xem reverseAudioWiring.ts.
  assert.equal(REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC, 0.12);
  assert.equal(REVERSED_AUDIO_WINDOW_SEC, 30);
});

// --- shouldRestartReverseSegment: restart-exact ---
ok("restart-exact: sắp hết đoạn + lệch nhỏ → nối tiếp đúng mẫu", () => {
  // Đoạn mẫu 500..1000, now +0,45 s → vị trí 950 (còn 50 mẫu = 0,05 s
  // < overlap 0,1 s), kỳ vọng 950 (lệch 0 ≤ 0,05 s) → restart-exact.
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.45, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 950,
    }),
    "restart-exact",
  );
});
ok("restart-exact: sắp hết + lệch vừa (0,06 s) → nối tiếp NGAY, không keep tới hết (hợp đồng 203)", () => {
  // Đợt 203 P3 (quyết (a6)-202, F-201-P3-2): hợp đồng cũ (0,06 s →
  // keep tới hết rồi restart) CHÍNH LÀ nguyên nhân gap nối đoạn 8–32 ms
  // — đoạn hết rồi tick sau mới restart (re-sync) nên hở một khoảng
  // trễ tick. Nay exact-tol = dung sai drift 0,12 s nên lệch 0,06 s
  // trong cửa sổ overlap → restart-exact ngay (khởi đoạn mới chồng
  // crossfade lên đuôi đoạn cũ, không hở).
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.45, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 1010,
    }),
    "restart-exact",
  );
  // Lệch 0,13 s (> dung sai drift 0,12 s) trong cửa sổ overlap →
  // restart re-sync ngay tại tick đó (cũng không hở vì đoạn cũ chưa hết).
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.45, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 1080,
    }),
    "restart",
  );
  // Hết đoạn rồi mới tới tick → restart như cũ (chỉ xảy ra khi tick đói,
  // không có tick nào trong cửa sổ overlap 0,1 s).
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.5, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 1010,
    }),
    "restart",
  );
});
ok("restart-exact: còn xa cuối đoạn thì keep dù lệch nhỏ", () => {
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.25, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 750,
    }),
    "keep",
  );
});
ok("restart-exact: overlapSec=0 tường minh → không có restart-exact", () => {
  assert.equal(
    shouldRestartReverseSegment({
      nowCtxSec: 10.45, segStartCtxSec: 10, segStartSample: 500,
      segLengthSamples: 500, sampleRate: 1000, rate: 1, expectedOffset: 950,
      overlapSec: 0,
    }),
    "keep",
  );
});

// --- fake ctx ghi chi tiết: mỗi gain node + source riêng ---
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
  decodeCalls: () => number;
  setNow: (t: number) => void;
} {
  const sources: RecSrc[] = [];
  const gains: RecGain[] = [];
  const buffers: ReversedAudioBufferLike[] = [];
  let decodeCalls = 0;
  let now = 0;
  const ctx = {
    sampleRate: 1000,
    get currentTime() {
      return now;
    },
    state: "running",
    destination: {},
    decodeAudioData: async () => {
      decodeCalls++;
      return decoded;
    },
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
    decodeCalls: () => decodeCalls,
    setNow: (t: number) => {
      now = t;
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

await okAsync("player crossfade: đoạn mới chồng lên đoạn cũ (cũ mờ 80 ms, không cắt ở +20 ms)", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), true);
  // Đoạn 1: bắt đầu ở now=0, fade vào 10 ms (không có đoạn cũ).
  f.setNow(0);
  assert.equal(p.playSegment(0, 0.5, 1, 1), true);
  assert.equal(f.sources.length, 1);
  assert.equal(f.gains[0].ramps[0].t, 0.01);
  // Đoạn 2 ở now=0,45 (đoạn 1 còn 0,05 s): đoạn cũ PHẢI mờ dần tới
  // t0+0,08 (không stop ở +0,02 kiểu cũ), đoạn mới mờ vào tới t0+0,08.
  f.setNow(0.45);
  assert.equal(p.playSegment(500, 0.5, 1, 1), true);
  assert.equal(f.sources.length, 2);
  const oldSrc = f.sources[0];
  assert.equal(oldSrc.stopWhens.length, 1);
  assert.ok(Math.abs(oldSrc.stopWhens[0] - 0.53) < 1e-9, `đoạn cũ stop ở ${oldSrc.stopWhens[0]}, kỳ vọng 0,53`);
  const oldGain = f.gains[0];
  assert.equal(oldGain.targets.length, 2); // setTargetAtTime(0, 0, 0,001) lúc bắt + fade ra 0
  assert.equal(oldGain.targets[1].v, 0);
  assert.ok(Math.abs(oldGain.targets[1].t - 0.45) < 1e-9);
  const newGain = f.gains[1];
  assert.equal(newGain.ramps[0].v, 1);
  assert.ok(Math.abs(newGain.ramps[0].t - 0.53) < 1e-9, `đoạn mới mờ vào tới ${newGain.ramps[0].t}, kỳ vọng 0,53`);
  // Đoạn 2 bắt đúng offset 0,5 s.
  assert.equal(f.sources[1].startOffsets[0], 0.5);
});

await okAsync("player crossfade: stop() tắt cả đoạn đang mờ dần", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), true);
  f.setNow(0);
  p.playSegment(0, 0.5, 1, 1);
  f.setNow(0.45);
  p.playSegment(500, 0.5, 1, 1);
  // Cả 2 source đều đã stop 1 lần (cũ: stop t0+0,08; mới: chưa stop).
  // stop() phải tắt nốt đoạn mới (stop lần 1 của nó) + đoạn cũ đang mờ
  // (stop lần 2 của nó).
  f.setNow(0.5);
  p.stop();
  assert.equal(f.sources[0].stopWhens.length, 2);
  assert.equal(f.sources[1].stopWhens.length, 1);
});

await okAsync("player crossfade: crossfadeSec=0 tường minh → cắt kiểu cũ (không chồng)", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), true);
  f.setNow(0);
  p.playSegment(0, 0.5, 1, 1);
  f.setNow(0.45);
  assert.equal(p.playSegment(500, 0.5, 1, 1, 0), true);
  // Đoạn cũ bị cắt kiểu cũ: stop ở t0 + 0,02.
  assert.ok(Math.abs(f.sources[0].stopWhens[0] - 0.47) < 1e-9);
  // Đoạn mới fade vào 10 ms như cũ (không crossfade).
  assert.ok(Math.abs(f.gains[1].ramps[0].t - 0.46) < 1e-9);
});

// --- cửa sổ clip dài ---
function indexedBuffer(seconds: number, sampleRate = 1000): ReversedAudioBufferLike {
  // 1 kênh, mẫu i mang giá trị i (đọc lại được vị trí tuyệt đối).
  const ch = new Float32Array(seconds * sampleRate);
  for (let i = 0; i < ch.length; i++) ch[i] = i;
  return fakeBuffer([ch], sampleRate);
}

await okAsync("player window: loadReversedWindow trích đúng cửa sổ đảo + duration đầy đủ", async () => {
  const decoded = indexedBuffer(100); // 100 s @1000 Hz, mẫu i = i
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversedWindow(new ArrayBuffer(8), 60, 30), true);
  assert.equal(p.durationSec, 100); // wiring tính offset từ duration đầy đủ
  assert.equal(p.windowStartSec, 60);
  assert.equal(p.windowEndSec, 90);
  assert.equal(p.loaded, true);
  // Buffer cửa sổ: window[i] = forward[endIdx−1−i] = 89999−i.
  const win = f.buffers[0];
  assert.equal(win.length, 30000);
  const data = win.getChannelData(0);
  assert.equal(data[0], 89999);
  assert.equal(data[1], 89998);
  assert.equal(data[29999], 60000);
});

await okAsync("player window: playSegment nhận offset tuyệt đối, ngoài cửa sổ → false, clamp ở mép", async () => {
  const decoded = indexedBuffer(100);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversedWindow(new ArrayBuffer(8), 60, 30), true);
  // Source 85 s → offset đảo tuyệt đối (100−85)*1000 = 15000; cửa sổ
  // bắt đầu ở offset tuyệt đối 10000 → tương đối 5000 = 5,0 s.
  f.setNow(0);
  assert.equal(p.playSegment(15000, 0.5, 1, 1), true);
  assert.equal(f.sources[0].startOffsets[0], 5);
  assert.equal(f.sources[0].startDurs[0], 0.5);
  assert.equal(p.lastSegmentLengthSamples, 500);
  // Source 50 s → offset 50000, ngoài cửa sổ [10000, 40000) → false.
  assert.equal(p.playSegment(50000, 0.5, 1, 1), false);
  // Đoạn chạm mép cửa sổ: offset 39500, còn 500 mẫu → clamp dur 0,5 s
  // (vừa đủ, không vượt); offset 39900 còn 100 mẫu → dur 0,1 s.
  assert.equal(p.playSegment(39500, 0.5, 1, 1), true);
  assert.equal(p.lastSegmentLengthSamples, 500);
  assert.equal(p.playSegment(39900, 0.5, 1, 1), true);
  assert.equal(p.lastSegmentLengthSamples, 100);
  // (lần 50000 hỏng không tạo source nên đây là sources[2], không phải [3])
  assert.equal(f.sources[2].startDurs[0], 0.1);
});

await okAsync("player window: clip quá 600 s → false; cửa sổ clamp về đầu file", async () => {
  const decoded = indexedBuffer(700);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversedWindow(new ArrayBuffer(8), 0, 30), false);
  assert.equal(p.loaded, false);
  // Cửa sổ bắt đầu trước 0 (source 10 s − 30 s): clamp về [0, 10] —
  // cửa sổ kết thúc đúng ở source time hiện tại (10 s), không kéo dài
  // tới 30 s.
  const decoded100 = indexedBuffer(100);
  const f2 = makeFakeCtx(decoded100);
  const p2 = new ReverseAudioPlayer(f2.ctx, {});
  assert.equal(await p2.loadReversedWindow(new ArrayBuffer(8), -20, 30), true);
  assert.equal(p2.windowStartSec, 0);
  assert.equal(p2.windowEndSec, 10);
});

await okAsync("player window: loadReversed toàn bộ vẫn như cũ (duration + offset tuyệt đối)", async () => {
  const decoded = indexedBuffer(4);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8)), true);
  assert.equal(p.durationSec, 4);
  assert.equal(p.windowStartSec, 0);
  assert.equal(p.windowEndSec, 4);
  f.setNow(0);
  assert.equal(p.playSegment(1000, 0.5, 1, 1), true);
  assert.equal(f.sources[0].startOffsets[0], 1);
});

// --- wiring: clip dài ---
function entryLong(over: Partial<ReverseAudioWiringEntry> = {}): ReverseAudioWiringEntry {
  return {
    clipKey: "long1",
    url: "blob:long-audio",
    sourceDurationSec: 90,
    sourceTimeSec: 85,
    gain: 1,
    speed: 1,
    ...over,
  };
}

await okAsync("wiring long: clip 90 s load theo cửa sổ + phát đúng offset + snapshot longClips", async () => {
  const decoded = indexedBuffer(90);
  const f = makeFakeCtx(decoded);
  let fetches = 0;
  const w = new ReverseAudioWiring(f.ctx, {}, async () => {
    fetches++;
    return new ArrayBuffer(8);
  });
  w.tick(100, [entryLong()]);
  assert.equal(fetches, 1);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  assert.deepEqual(w.debugSnapshot().longClips, ["long1"]);
  // Tick 2: source 85 s → offset đảo (90−85)*1000 = 5000; cửa sổ đầu
  // [55, 85] → tương đối 5000 − 5000 = 0 → start offset 0 s.
  f.setNow(0.25);
  w.tick(99.75, [entryLong({ sourceTimeSec: 84.75 })]);
  assert.equal(f.sources.length, 1);
  assert.equal(f.sources[0].startOffsets[0], 0.25);
  assert.equal(f.sources[0].startDurs[0], 0.5);
  assert.equal(w.isPlaying, true);
});

await okAsync("wiring long: tới gần mép cửa sổ thì decode cửa sổ mới nền, đoạn cũ không đứt", async () => {
  const decoded = indexedBuffer(90);
  const f = makeFakeCtx(decoded);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  w.tick(100, [entryLong()]);
  await tick();
  await tick();
  f.setNow(0);
  w.tick(99.75, [entryLong({ sourceTimeSec: 84.75 })]);
  assert.equal(f.sources.length, 1);
  assert.equal(f.decodeCalls(), 1);
  // Playhead lùi tới 59 s: còn cách mép dưới cửa sổ [55, 85] là 4 s
  // (< preload 5 s) → kích decode cửa sổ mới [29, 59] nền.
  f.setNow(26);
  w.tick(74, [entryLong({ sourceTimeSec: 59 })]);
  await tick();
  await tick();
  assert.equal(f.decodeCalls(), 2);
  assert.equal(f.sources.length, 2); // đoạn 2 bắt ở tick 59 (offset 26,0 s)
  // Cửa sổ mới đã đổi: đoạn sau phát từ cửa sổ mới (source 58,5 →
  // offset (90−58,5)*1000 = 31500; cửa sổ mới bắt đầu offset tuyệt đối
  // 31000 → tương đối 500 mẫu = 0,5 s; đoạn cũ đã hết nên restart).
  f.setNow(26.5);
  w.tick(73.5, [entryLong({ sourceTimeSec: 58.5 })]);
  assert.equal(f.sources.length, 3);
  assert.ok(Math.abs(f.sources[2].startOffsets[0] - 0.5) < 1e-9, `offset đoạn sau cửa sổ mới: ${f.sources[2].startOffsets[0]}`);
});

await okAsync("wiring long: clip 601 s vẫn mute (quá trần cửa sổ)", async () => {
  const decoded = indexedBuffer(100);
  const f = makeFakeCtx(decoded);
  let fetches = 0;
  const w = new ReverseAudioWiring(f.ctx, {}, async () => {
    fetches++;
    return new ArrayBuffer(8);
  });
  w.tick(100, [entryLong({ sourceDurationSec: 601 })]);
  assert.equal(fetches, 0);
  assert.equal(w.loadedCount, 0);
});

await okAsync("wiring: restart-exact nối tiếp đúng mẫu (không re-sync lệch)", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  const entry = (t: number, s: number): ReverseAudioWiringEntry => ({
    clipKey: "clip1", url: "blob:audio1", sourceDurationSec: 4,
    sourceTimeSec: s, gain: 1, speed: 1,
  });
  w.tick(9, [entry(9, 3.5)]);
  await tick();
  await tick();
  // Đoạn 1 bắt đầu ở ctx 0, offset 500 (source 3,5). Tới ctx 0,45:
  // vị trí 950, kỳ vọng (4−3,05)*1000 = 950 → restart-exact, đoạn 2
  // bắt đúng mẫu 1000 (không phải 950).
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 1);
  assert.equal(f.sources[0].startOffsets[0], 0.5);
  f.setNow(0.45);
  w.tick(8.05, [entry(8.05, 3.05)]);
  assert.equal(f.sources.length, 2);
  assert.equal(f.sources[1].startOffsets[0], 1);
  assert.equal(f.sources[1].startDurs[0], 0.5);
});

console.log(`reverseAudio193P3.test: ${pass} passed`);
