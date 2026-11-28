// reverseAudio203P3.test.ts — Đợt 203 P3: sửa gap nối đoạn plain-restart
// (F-201-P3-2, quyết parent (a6)-202).
// Nguyên nhân (xem LIMITS đợt 203 §1): restart-exact chỉ kích khi lệch
// ≤ 0,05 s nên mọi tick trong cửa sổ overlap 0,1 s trước khi đoạn hết
// mà lệch 0,05–0,12 s đều trả "keep" — đoạn hết rồi tick sau mới
// restart (re-sync) → gap nối đoạn 8–32 ms (~1 lần/s, nghe được, vượt
// ngưỡng tai 3 ms). Sửa: (i) exact-tol = dung sai drift 0,12 s — mọi
// tick trong cửa sổ overlap đều khởi đoạn mới ngay (restart-exact nếu
// lệch trong dung sai, restart re-sync nếu lệch quá); (ii) C3-loop
// trong hold lặp SỚM (còn < overlap 0,1 s) thay vì chờ hết hạn.
//   node --experimental-strip-types apps/web/src/lib/reverseAudio203P3.test.ts
import assert from "node:assert/strict";
import {
  ReverseAudioPlayer,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import {
  REVERSED_AUDIO_DRIFT_TOLERANCE_SEC,
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

// --- Bất biến 203: exact-tol PHẢI bằng dung sai drift ---
ok("bất biến 203: exact-tol = dung sai drift = 0,12 s (overlap 0,1 s)", () => {
  assert.equal(REVERSED_AUDIO_DRIFT_TOLERANCE_SEC, 0.12);
  assert.equal(REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC, 0.12);
  assert.equal(
    REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC,
    REVERSED_AUDIO_DRIFT_TOLERANCE_SEC,
    "exact-tol lệch khỏi drift-tol thì cửa sổ overlap lại có tick keep → gap nối đoạn quay lại",
  );
  assert.equal(REVERSED_AUDIO_OVERLAP_SEC, 0.1);
});

// --- Ma trận quyết định: lệch trong cửa sổ overlap ---
// Đoạn mẫu 500..1000 (sr 1000, dài 0,5 s), now +0,45 s → vị trí 950.
const seg = (nowCtxSec: number, expectedOffset: number, extra: object = {}) => ({
  nowCtxSec, segStartCtxSec: 10, segStartSample: 500,
  segLengthSamples: 500, sampleRate: 1000, rate: 1,
  expectedOffset, ...extra,
});
ok("F-201-P3-2: lệch 0,06 s trong cửa sổ overlap → restart-exact (không keep)", () => {
  assert.equal(shouldRestartReverseSegment(seg(10.45, 1010)), "restart-exact");
  // Đối chiếu: exact-tol cũ 0,05 s cho trường hợp này "keep" — chính
  // là hành vi gây gap (đoạn hết rồi tick sau mới restart).
  assert.equal(
    shouldRestartReverseSegment(seg(10.45, 1010, { exactToleranceSec: 0.05 })),
    "keep",
  );
});
ok("F-201-P3-2: lệch 0,11 s trong cửa sổ overlap → restart-exact", () => {
  assert.equal(shouldRestartReverseSegment(seg(10.45, 1060)), "restart-exact");
});
ok("F-201-P3-2: lệch 0,115 s (sát biên dung sai) trong cửa sổ overlap → restart-exact", () => {
  // Không test đúng biên 0,120 s: 0,12 × 1000 = 119,999… (floating
  // point) nên 120 > ngưỡng — biên chính xác là artifact số học, không
  // phải hợp đồng; 0,115 s đủ sát biên để kiểm chứng.
  assert.equal(shouldRestartReverseSegment(seg(10.45, 1065)), "restart-exact");
});
ok("F-201-P3-2: lệch 0,13 s (> dung sai) trong cửa sổ overlap → restart re-sync ngay", () => {
  assert.equal(shouldRestartReverseSegment(seg(10.45, 1080)), "restart");
});
ok("F-201-P3-2: lệch −0,08 s (đoạn chạy TRƯỚC kỳ vọng) trong cửa sổ overlap → restart-exact", () => {
  assert.equal(shouldRestartReverseSegment(seg(10.45, 870)), "restart-exact");
});
ok("không đổi: lệch 0,06 s nhưng còn xa cuối đoạn → keep", () => {
  // Vị trí 750, còn 250 mẫu = 0,25 s mới hết → chưa tới cửa sổ overlap.
  assert.equal(shouldRestartReverseSegment(seg(10.25, 810)), "keep");
});
ok("không đổi: đoạn đã hết (tick đói, không tick nào trong cửa sổ overlap) → restart", () => {
  assert.equal(shouldRestartReverseSegment(seg(10.6, 1010)), "restart");
});

// --- Fake ctx + wiring (tái dùng mẫu test 202) ---
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

await okAsync("F-201-P3-2 (wiring): nối đoạn lệch 0,08 s → restart-exact TRƯỚC khi đoạn hết, không restart sau hết", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: offset 500, ctx 0–0,5
  assert.equal(f.sources.length, 1);
  // Tick bước 0,02 s, playhead lùi đều 1×; sourceTime dịch để lệch
  // pos − expected = −0,08 s KHÔNG ĐỔI (đoạn chạy sau kỳ vọng 80 ms —
  // đúng tầm lệch thật đo được ở pass headed 201: median 0,048 s).
  // k=1: ctx 0,02, expected 600, pos 520.
  for (let k = 1; k <= 19; k++) {
    f.setNow(k * 0.02);
    w.tick(8.5 - k * 0.02, [entry(8.5 - k * 0.02, 3.42 - k * 0.02)]);
  }
  assert.equal(f.sources.length, 1, "chưa tới cửa sổ overlap thì chưa nối đoạn");
  assert.equal(counters(w).keep, 19);
  // k=20: ctx 0,40, pos 900 (còn 0,10 s = overlap), expected 980,
  // lệch −0,08 s → restart-exact NGAY (hợp đồng cũ: keep → tới ctx
  // 0,50 đoạn hết rồi mới restart, hở ~1 khoảng tick).
  f.setNow(0.4);
  w.tick(8.5 - 0.4, [entry(8.5 - 0.4, 3.42 - 0.4)]);
  assert.equal(f.sources.length, 2, "phải nối đoạn NGAY trong cửa sổ overlap");
  assert.equal(f.sources[1].startOffsets[0], 1, "restart-exact nối đúng mẫu tiếp theo (offset 1,0 s)");
  assert.equal(counters(w).restartExact, 1);
  assert.equal(counters(w).restart, 0, "không được có restart sau khi đoạn hết");
  // Tới ctx 0,50 (đoạn cũ đã hết hạn nếu không nối sớm): đoạn 2 vẫn
  // đang phát, không tạo đoạn mới, không restart.
  for (let k = 21; k <= 25; k++) {
    f.setNow(k * 0.02);
    w.tick(8.5 - k * 0.02, [entry(8.5 - k * 0.02, 3.42 - k * 0.02)]);
  }
  assert.equal(f.sources.length, 2);
  assert.equal(counters(w).restart, 0);
  assert.equal(counters(w).playFalse, 0);
  assert.equal(w.isPlaying, true);
});

await okAsync("F-201-P3-2 (hold): lặp SỚM ở 0,4 s rồi 0,8 s — chu kỳ lặp 0,4 s, không chờ hết hạn", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: ctx 0–0,5
  for (let i = 1; i <= 3; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  assert.equal(f.sources.length, 1, "cách hết > overlap 0,1 s thì chưa lặp");
  assert.equal(counters(w).holdLoopRestart, 0);
  f.setNow(0.4);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 2, "lặp SỚM ở ctx 0,4 (còn 0,1 s)");
  assert.equal(f.sources[1].startOffsets[0], 0.5, "lặp cùng đoạn");
  assert.equal(counters(w).holdLoopRestart, 1);
  for (let i = 5; i <= 7; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  assert.equal(f.sources.length, 2, "tới ctx 0,7 vẫn chưa lặp lần 2");
  f.setNow(0.8);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 3, "lặp lần 2 ở ctx 0,8 (chu kỳ 0,4 s)");
  assert.equal(counters(w).holdLoopRestart, 2);
  assert.equal(counters(w).holdCapStop, 0);
  assert.equal(w.isPlaying, true);
});

await okAsync("F-201-P3-2 (hold): tick đói nhảy qua điểm hết đoạn → vẫn lặp (dư = khoảng tick đói, không im lặng dài)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: ctx 0–0,5
  // Tick đói: nhảy thẳng ctx 0,3 → 0,6 (không tick nào trong cửa sổ
  // overlap 0,4–0,5) — đoạn đã hết 0,1 s, lặp ngay tick này (không
  // còn cách nào khác nếu không lên lịch trước — xem LIMITS §1).
  f.setNow(0.3);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 1);
  f.setNow(0.6);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 2, "tick đói vẫn lặp ngay khi tới");
  assert.equal(counters(w).holdLoopRestart, 1);
  assert.equal(counters(w).holdCapStop, 0);
  assert.equal(w.isPlaying, true);
});

await okAsync("không hồi quy: player playSegment clamp cuối buffer không đổi", async () => {
  const decoded = fakeBuffer([new Float32Array(4000)], 1000);
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8), 60), true);
  assert.equal(p.playSegment(3800, 0.5, 1, 1), true);
  assert.equal(p.lastSegmentLengthSamples, 200);
});

console.log(`reverseAudio203P3: ${pass} test PASS`);
