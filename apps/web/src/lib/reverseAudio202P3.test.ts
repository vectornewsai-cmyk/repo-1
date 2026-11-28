// reverseAudio202P3.test.ts — Đợt 202 P3: C3-LOOP sửa hold-mute.
// Quyết parent (a6)-201: đoạn đảo hết hạn GIỮA HOLD thì phát LẠI cùng
// đoạn 0,5 s ngay trong tick hold (thay vì im lặng tới tick không-hold
// đầu tiên — H1 đợt 201: im lặng dài 655–690 ms, gấp ~230× ngưỡng tai
// 3 ms; C1-cont chỉ rút 655 → 447 ms nên không chọn). Lặp không làm
// drift tăng nên BỎ cap-stop 0,3 s (hợp đồng cũ (a2)-193/(a4)-195 đã
// bị thay thế — xem test đã cập nhật ở 194/195/196).
//   node --experimental-strip-types apps/web/src/lib/reverseAudio202P3.test.ts
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
  setNow: (t: number) => void;
} {
  const sources: RecSrc[] = [];
  const gains: RecGain[] = [];
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
      return fakeBuffer(arrs, sr);
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
    setNow: (t: number) => {
      now = t;
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

// Clip 4 s, source time 3,5 → offset đảo (4−3,5)*1000 = 500 mẫu.
function entry(_t: number, s: number, gain = 1): ReverseAudioWiringEntry {
  return {
    clipKey: "clip1", url: "blob:audio1", sourceDurationSec: 4,
    sourceTimeSec: s, gain, speed: 1,
  };
}
async function loadedWiring(): Promise<{
  w: ReverseAudioWiring;
  f: ReturnType<typeof makeFakeCtx>;
}> {
  const decoded = fakeBuffer([new Float32Array(4000)]);
  const f = makeFakeCtx(decoded);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  w.tick(9, [entry(9, 3.5)]);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  return { w, f };
}
const counters = (w: ReverseAudioWiring) => w.debugSnapshot().counters;

await okAsync("C3-loop: đoạn hết hạn giữa hold thì lặp LẠI CÙNG đoạn ngay trong tick hold", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: offset 500, ctx 0–0,5
  assert.equal(f.sources.length, 1);
  assert.equal(f.sources[0].startOffsets[0], 0.5);
  // Hold tới ctx 0,3: đoạn còn hạn (cách hết > overlap 0,1 s) → chỉ
  // keep, không lặp.
  for (let i = 1; i <= 3; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  assert.equal(f.sources.length, 1);
  assert.equal(counters(w).holdLoopRestart, 0);
  assert.equal(counters(w).holdKeep, 3);
  // Đợt 203 P3 (quyết (a6)-202, F-201-P3-2): lặp SỚM ở ctx 0,4 (đoạn
  // còn 0,1 s = overlap) thay vì chờ hết hạn ở 0,5 — chờ hết hạn thì
  // gap nối đoạn = độ trễ tick sau khi đoạn hết (8–32 ms đo thật).
  f.setNow(0.4);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 2, "phải lặp SỚM khi đoạn sắp hết giữa hold");
  assert.equal(f.sources[1].startOffsets[0], 0.5, "lặp CÙNG đoạn: offset = 0,5 s như đoạn cũ");
  assert.equal(f.sources[1].startDurs[0], 0.5, "đoạn lặp dài đủ 0,5 s");
  assert.equal(counters(w).holdLoopRestart, 1);
  assert.equal(counters(w).holdCapStop, 0, "không còn cap-stop");
  assert.equal(w.isPlaying, true);
});

await okAsync("C3-loop: hold dài 1,6 s lặp 4 lần, không cap-stop, không im lặng", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: ctx 0–0,5
  // Hold bước 0,1 s tới ctx 1,6: lặp SỚM ở 0,4 / 0,8 / 1,2 / 1,6
  // (chu kỳ 0,4 s — đợt 203 P3, F-201-P3-2: lặp sớm trong overlap
  // 0,1 s thay vì chờ hết hạn; hợp đồng cũ lặp ở 0,5 / 1,0 / 1,5).
  for (let i = 1; i <= 16; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  assert.equal(f.sources.length, 5, `kỳ vọng 5 đoạn (1 + 4 lặp), có ${f.sources.length}`);
  for (let i = 0; i < 5; i++) {
    assert.equal(f.sources[i].startOffsets[0], 0.5, `đoạn ${i + 1} phải lặp cùng offset 0,5 s`);
  }
  const c = counters(w);
  assert.equal(c.holdLoopRestart, 4);
  assert.equal(c.holdCapStop, 0, "giữ 1,6 s (gấp 5× trần cũ) vẫn không cap-stop");
  assert.equal(c.playFalse, 0);
  assert.equal(w.isPlaying, true);
  assert.ok(Math.abs(c.holdMaxSec - 1.5) < 1e-9, `holdMaxSec=${c.holdMaxSec}, kỳ vọng 1,5`);
});

await okAsync("C3-loop: đoạn lặp dùng lại gain của đoạn cũ (không về gain 1)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5, 0.5)]); // gain 0,5
  assert.equal(f.gains[0].ramps[0].v, 0.5);
  f.setNow(0.5);
  w.tick(8.5, [entry(8.5, 3.5, 0.5)]); // hold, đoạn hết hạn → lặp
  assert.equal(f.sources.length, 2);
  assert.equal(f.gains[1].ramps[0].v, 0.5, `đoạn lặp ramp về ${f.gains[1].ramps[0].v}, kỳ vọng 0,5`);
});

await okAsync("C3-loop: hết giữ, playhead bước tiếp 0,1 s thì đoạn lặp vẫn đồng bộ (keep, không hở)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]);
  for (let i = 1; i <= 16; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  assert.equal(counters(w).holdLoopRestart, 4);
  // Đợt 203 P3 (F-201-P3-2): lặp SỚM nên lần lặp thứ 4 bắt đầu ctx 1,6
  // (không phải 1,5). Hết giữ ở ctx 1,7, playhead 8,5 → 8,4 (source
  // 3,4): đoạn lặp vị trí 500 + 0,1×1000 = 600, kỳ vọng 600, lệch 0
  // → keep (không hở, không restart) — đúng như hợp đồng cũ, chỉ khác
  // pha lặp (1,6 thay vì 1,5).
  f.setNow(1.7);
  w.tick(8.4, [entry(8.4, 3.4)]);
  assert.equal(f.sources.length, 5, "resume bước nhỏ không được tạo đoạn mới");
  assert.equal(counters(w).keep, 1);
  assert.equal(counters(w).playFalse, 0);
  assert.equal(w.isPlaying, true);
});

await okAsync("C3-loop: hết giữ mà playhead nhảy xa thì re-sync bằng restart (không kẹt ở đoạn lặp)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]);
  for (let i = 1; i <= 16; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  // Hết giữ ở ctx 1,7, playhead nhảy 8,5 → 8,0 (source 3,0): lần lặp
  // thứ 4 bắt đầu ctx 1,6 ở offset 500 → vị trí 600, kỳ vọng 1000,
  // lệch 0,4 s > dung sai → restart.
  f.setNow(1.7);
  w.tick(8.0, [entry(8.0, 3.0)]);
  assert.equal(f.sources.length, 6);
  assert.equal(f.sources[5].startOffsets[0], 1, "restart re-sync về offset kỳ vọng 1,0 s");
  assert.equal(counters(w).restart, 1);
  assert.equal(w.isPlaying, true);
});

await okAsync("C3-loop: hold khi chưa có đoạn active thì không lặp, không crash", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(9, [entry(9, 3.5)]); // chưa phát đoạn nào
  f.setNow(0.5);
  w.tick(9, [entry(9, 3.5)]); // hold 0,5 s, không có đoạn để lặp
  assert.equal(f.sources.length, 0);
  assert.equal(counters(w).holdLoopRestart, 0);
  assert.equal(counters(w).holdCapStop, 0);
  assert.equal(w.isPlaying, false);
  // Tick di chuyển bình thường vẫn phát đoạn như cũ.
  f.setNow(0.6);
  w.tick(8.9, [entry(8.9, 3.5)]);
  assert.equal(f.sources.length, 1);
  assert.equal(w.isPlaying, true);
});

await okAsync("C3-loop: player playSegment vẫn clamp đúng khi đoạn lặp chạm cuối buffer", async () => {
  // Clip 4 s, đoạn lặp bắt ở offset 3,8 s → chỉ còn 0,2 s tới cuối
  // buffer: lastSegmentLengthSamples phải là 200 mẫu (không phải 500).
  const decoded = fakeBuffer([new Float32Array(4000)], 1000);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8), 60), true);
  assert.equal(p.playSegment(3800, 0.5, 1, 1), true);
  assert.equal(p.lastSegmentLengthSamples, 200);
});

console.log(`reverseAudio202P3: ${pass} test PASS`);
