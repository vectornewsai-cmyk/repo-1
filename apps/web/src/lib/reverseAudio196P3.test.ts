// reverseAudio196P3.test.ts — Đợt 196 P3: siết cap drift hold về 0,3 s.
// Quyết parent (a4)-195: trần drift SIẾT cap về ~0,3 s (KHÔNG chấp
// nhận trần hiệu dụng ~0,7 s). Đợt 195 đo headed: cap 0,5 s chặn đúng
// 0,5 s độ TĂNG drift trong hold nhưng drift tuyệt đối đỉnh 0,685 s
// vì drift lúc bắt đầu giữ đã ~0,17 s. Cap 0,3 s → tuyệt đối ≈
// 0,17 + 0,3 ≈ 0,47 s < bar 0,5 s (dựa trên drift-lúc-giữ quan sát
// ≤ 0,2 s đợt 195 — xem test "trần tuyệt đối" dưới).
//   node --experimental-strip-types apps/web/src/lib/reverseAudio196P3.test.ts
import assert from "node:assert/strict";
import {
  ReverseAudioPlayer,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import {
  REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC,
  REVERSED_AUDIO_SEGMENT_SEC,
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

ok("hằng số hold-drift-max = 0,3 s (siết từ 0,5 s, quyết parent (a4)-195)", () => {
  assert.equal(REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC, 0.3);
});

ok("độ dài đoạn phát KHÔNG đổi = 0,5 s (chỉ siết trần dừng-sớm khi giữ)", () => {
  assert.equal(REVERSED_AUDIO_SEGMENT_SEC, 0.5);
});

ok("trần drift trong hold: C3-loop chặn bằng lặp đoạn, KHÔNG tăng theo thời gian giữ (quyết (a6)-201)", () => {
  // Hợp đồng cũ (a4)-195 "cap 0,3 s + drift-lúc-giữ ≤ 0,2 s ≤ bar
  // 0,5 s" ĐÃ BỊ THAY THẾ bởi quyết parent (a6)-201 (C3-loop): đoạn
  // lặp lại cùng 0,5 s nên vị trí audio trong hold không bao giờ vượt
  // quá segStart + 0,5 s — drift trong hold bị chặn bởi ĐỘ DÀI ĐOẠN
  // (0,5 s) chứ không tăng theo thời gian giữ. Hằng cap cũ giữ lại
  // (legacy, = 0,3) để test/probe cũ còn đọc được; code không dùng nữa.
  assert.equal(REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC, 0.3);
  assert.ok(
    REVERSED_AUDIO_SEGMENT_SEC <= 0.5,
    `đoạn lặp ${REVERSED_AUDIO_SEGMENT_SEC} s vượt bar drift 0,5 s`,
  );
});

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

// Clip 4 s, source time 3,5 → offset đảo (4−3,5)*1000 = 500 mẫu.
function entry(t: number, s: number): ReverseAudioWiringEntry {
  return {
    clipKey: "clip1", url: "blob:audio1", sourceDurationSec: 4,
    sourceTimeSec: s, gain: 1, speed: 1,
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

await okAsync("loop C3: giữ 0,35 s vẫn phát (không cap-stop); đoạn hết hạn giữa hold thì lặp cùng đoạn", async () => {
  // Hợp đồng cũ "giữ 0,35 s thì cap dừng" ĐÃ BỊ THAY THẾ bởi quyết
  // parent (a6)-201 (C3-loop): không còn cap-stop; giữ dài bao lâu
  // cũng phát (lặp khi đoạn hết hạn).
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1 bắt đầu, offset 0,5 s
  // Hold từ ctx 0,1, bước 0,05 s: held 0 → 0,25 s vẫn keep (6 tick).
  for (let i = 0; i <= 5; i++) {
    f.setNow(0.1 + i * 0.05);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  assert.equal(w.debugSnapshot().counters.holdKeep, 6);
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  assert.equal(w.isPlaying, true);
  // Sau 6 tick hold tới ctx 0,35: đoạn 1 còn hạn tới ctx 0,5 (cách hết
  // 0,15 s > overlap 0,1 s) nên KHÔNG lặp, KHÔNG dừng — vẫn phát.
  assert.equal(f.sources.length, 1, "đoạn còn hạn (cách hết > overlap) thì không lặp, không dừng");
  assert.equal(f.sources[0].stopWhens.length, 0);
  assert.equal(w.isPlaying, true);
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  // Đợt 203 P3 (F-201-P3-2): tới ctx 0,45 đoạn 1 còn 0,05 s (< overlap
  // 0,1 s) → lặp SỚM ngay tick này (hợp đồng cũ: chờ tới ctx 0,5 đoạn
  // hết hạn mới lặp — chờ hết hạn thì gap nối đoạn = độ trễ tick).
  f.setNow(0.45);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 2, "đoạn sắp hết giữa hold phải lặp SỚM ngay");
  assert.equal(f.sources[1].startOffsets[0], 0.5, "lặp CÙNG đoạn (offset 0,5 s)");
  assert.equal(w.debugSnapshot().counters.holdLoopRestart, 1);
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  assert.equal(w.isPlaying, true);
  // Tới ctx 0,5: đoạn lặp (bắt đầu 0,45, hết hạn 0,95) còn hạn nên
  // không lặp thêm.
  f.setNow(0.5);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 2, "đoạn lặp còn hạn thì không lặp thêm");
  assert.equal(w.debugSnapshot().counters.holdLoopRestart, 1);
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  assert.equal(w.isPlaying, true);
});

await okAsync("không hồi quy: giữ 0,25 s rồi nối tiếp restart-exact đúng mẫu", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: offset 500
  f.setNow(0.1);
  w.tick(8.5, [entry(8.5, 3.5)]); // hold 0 s (bắt đầu giữ)
  f.setNow(0.25);
  w.tick(8.5, [entry(8.5, 3.5)]); // hold 0,15 s (< cap 0,3 s) vẫn keep
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  // Tới ctx 0,45: playhead 8,05, source 3,05 → vị trí 950, kỳ vọng 950,
  // đoạn còn 0,05 s < overlap 0,1 → restart-exact về mẫu 1000.
  f.setNow(0.45);
  w.tick(8.05, [entry(8.05, 3.05)]);
  assert.equal(f.sources.length, 2);
  assert.equal(f.sources[1].startOffsets[0], 1);
  assert.equal(w.debugSnapshot().counters.restartExact, 1);
});

console.log(`reverseAudio196P3.test: ${pass} passed`);
