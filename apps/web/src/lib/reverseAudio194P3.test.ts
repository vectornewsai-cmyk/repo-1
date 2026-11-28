// reverseAudio194P3.test.ts — Đợt 194 P3: audio đảo chạy xuyên hold.
// Quyết parent (a2)-193: playhead bị giữ chờ frame thì đoạn đảo KHÔNG
// bị dừng nữa (nghe liền mạch hơn), drift hình-tiếng tối đa 0,3 s rồi
// dừng (đợt 196 P3 siết từ 0,5 s về 0,3 s, quyết parent (a4)-195);
// hết giữ thì re-sync khi playhead bước tiếp.
//   node --experimental-strip-types apps/web/src/lib/reverseAudio194P3.test.ts
import assert from "node:assert/strict";
import {
  ReverseAudioPlayer,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import {
  REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC,
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

ok("hằng số hold-drift-max = 0,3 s (đợt 196 P3 siết từ 0,5 s, quyết parent (a4)-195)", () => {
  assert.equal(REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC, 0.3);
});

// --- fake ctx (giống reverseAudio193P3.test.ts) ---
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

await okAsync("wiring hold-through: playhead bị giữ thì đoạn KHÔNG bị dừng (a2)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1 bắt đầu, offset 0,5 s
  assert.equal(f.sources.length, 1);
  assert.equal(f.sources[0].stopWhens.length, 0);
  // 2 tick hold liên tiếp (playhead đứng yên ở 8,5): đoạn vẫn phát.
  f.setNow(0.1);
  w.tick(8.5, [entry(8.5, 3.5)]);
  f.setNow(0.2);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources[0].stopWhens.length, 0, "đoạn bị dừng giữa hold (hành vi cũ S7c)");
  assert.equal(f.sources.length, 1, "không phát đoạn mới trong lúc hold");
  assert.equal(w.isPlaying, true);
  const c = w.debugSnapshot().counters;
  assert.equal(c.holdStop, 2);
  assert.equal(c.holdKeep, 2);
  assert.equal(c.holdCapStop, 0);
});

await okAsync("wiring hold-loop C3 (quyết (a6)-201): giữ quá 0,3 s thì LẶP đoạn thay vì dừng — cap-stop cũ đã bỏ", async () => {
  // Hợp đồng cũ (a2)-193/(a4)-195 "giữ quá 0,3 s thì cap dừng" ĐÃ BỊ
  // THAY THẾ bởi quyết parent (a6)-201 (C3-loop): lặp đoạn không tăng
  // drift nên không còn cap-stop; giữ dài bao lâu cũng lặp tiếp,
  // không im lặng (im lặng dài 655–690 ms đợt 201 là do đoạn hết hạn
  // giữa hold mà nhánh hold không restart — H1).
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 1);
  // Hold từ ctx 0,1: giữ tới 0,3 (held ~0,2 s) vẫn keep, tới 0,5
  // (held ~0,4 s > trần cũ 0,3 s): đoạn 1 (bắt đầu ctx 0, dài 0,5 s)
  // vừa hết hạn đúng lúc này → LẶP lại cùng đoạn (offset 0,5 s),
  // KHÔNG cap-stop, vẫn phát.
  for (let i = 1; i <= 3; i++) {
    f.setNow(i * 0.1);
    w.tick(8.5, [entry(8.5, 3.5)]);
  }
  assert.equal(w.debugSnapshot().counters.holdKeep, 3);
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  assert.equal(w.isPlaying, true);
  f.setNow(0.5);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(f.sources.length, 2, "đoạn hết hạn giữa hold phải lặp lại ngay trong tick hold");
  assert.equal(f.sources[1].startOffsets[0], 0.5, "lặp CÙNG đoạn: offset phải bằng đoạn cũ (0,5 s)");
  // Đợt 203 P3 — ĐÍNH CHÍNH assertion cũ (đã SAI từ đợt 202, khi đó
  // test này chỉ đạt 6/7): crossfade của playSegment LUÔN gọi
  // prevSrc.stop(t0 + 0,08 s) khi đoạn mới bắt đầu chồng lên đoạn cũ —
  // đoạn cũ KHÔNG "hết hạn tự nhiên mà không bị stop". Dấu hiệu đúng
  // của "không phải cap-stop" là holdCapStop == 0 (đã assert dưới)
  // + đoạn cũ được mờ dần bằng crossfade (stop ở 0,58 = t0 + 0,08 s),
  // không phải bị cắt bởi cap-stop.
  assert.equal(f.sources[0].stopWhens.length, 1, "crossfade phải stop đoạn cũ");
  assert.ok(Math.abs(f.sources[0].stopWhens[0] - 0.58) < 1e-9,
    `đoạn cũ stop ở ${f.sources[0].stopWhens[0]}, kỳ vọng 0,58 (= t0 0,5 + crossfade 0,08)`);
  assert.equal(w.isPlaying, true);
  const c = w.debugSnapshot().counters;
  assert.equal(c.holdCapStop, 0, "C3-loop: không còn cap-stop");
  assert.equal(c.holdLoopRestart, 1);
  assert.equal(c.holdStop, 4);
  // Tick hold tiếp theo (đoạn lặp còn hạn tới ctx 1,0) chỉ keep, không lặp thêm.
  f.setNow(0.6);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(w.debugSnapshot().counters.holdLoopRestart, 1);
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  assert.equal(w.debugSnapshot().counters.holdStop, 5);
});

await okAsync("wiring resume sau hold ngắn: re-sync bằng restart (lệch = thời gian giữ)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: offset 500, ctx 0
  f.setNow(0.1);
  w.tick(8.5, [entry(8.5, 3.5)]); // hold 0,1 s
  f.setNow(0.2);
  w.tick(8.5, [entry(8.5, 3.5)]); // hold 0,2 s
  // Hết giữ, playhead bước tiếp từ 8,5 → 8,4 (source 3,5 → 3,4):
  // vị trí đoạn 500 + 0,3*1000 = 800, kỳ vọng (4−3,4)*1000 = 600,
  // lệch 0,2 s > dung sai 0,12 → restart re-sync về 600.
  f.setNow(0.3);
  w.tick(8.4, [entry(8.4, 3.4)]);
  assert.equal(f.sources.length, 2);
  assert.ok(Math.abs(f.sources[1].startOffsets[0] - 0.6) < 1e-9,
    `đoạn sau hold bắt ở ${f.sources[1].startOffsets[0]}, kỳ vọng 0,6`);
  assert.equal(w.debugSnapshot().counters.restart, 1);
});

await okAsync("wiring hold-through không phá restart-exact (giữ 0,1 s rồi nối tiếp đúng mẫu)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]); // đoạn 1: offset 500
  f.setNow(0.1);
  w.tick(8.5, [entry(8.5, 3.5)]); // hold ngắn giữa chừng
  // Tới ctx 0,45: playhead 8,05, source 3,05 → vị trí 950, kỳ vọng 950,
  // đoạn còn 0,05 s < overlap 0,1 → restart-exact về mẫu 1000.
  f.setNow(0.45);
  w.tick(8.05, [entry(8.05, 3.05)]);
  assert.equal(f.sources.length, 2);
  assert.equal(f.sources[1].startOffsets[0], 1);
  assert.equal(w.debugSnapshot().counters.restartExact, 1);
});

await okAsync("wiring hold khi chưa có đoạn active: không crash, không đếm keep/cap", async () => {
  const { w, f } = await loadedWiring();
  // Tick 2 cùng playhead 9 (chưa phát đoạn nào): hold nhưng không có
  // gì để giữ — chỉ đếm holdStop, isPlaying vẫn false.
  f.setNow(0);
  w.tick(9, [entry(9, 3.5)]);
  assert.equal(f.sources.length, 0);
  assert.equal(w.isPlaying, false);
  const c = w.debugSnapshot().counters;
  assert.equal(c.holdStop, 1);
  assert.equal(c.holdKeep, 0);
  assert.equal(c.holdCapStop, 0);
  // Tick di chuyển bình thường vẫn phát đoạn như cũ.
  f.setNow(0.1);
  w.tick(8.9, [entry(8.9, 3.5)]);
  assert.equal(f.sources.length, 1);
  assert.equal(w.isPlaying, true);
});

await okAsync("wiring stopAll reset hold: giữ sau stopAll tính lại từ đầu", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(8.5, [entry(8.5, 3.5)]);
  f.setNow(0.4);
  w.tick(8.5, [entry(8.5, 3.5)]); // hold 0,4 s
  w.stopAll();
  assert.equal(w.isPlaying, false);
  // Phát lại từ đầu, hold 0,4 s nữa phải vẫn keep (không cộng dồn
  // với lần giữ trước stopAll).
  w.tick(9, [entry(9, 3.5)]);
  await tick();
  await tick();
  f.setNow(1);
  w.tick(8.5, [entry(8.5, 3.5)]);
  // Đợt 203 P3 (F-201-P3-2): tick hold ở ctx 0,4 TRƯỚC stopAll đã lặp
  // SỚM (đoạn còn 0,1 s = overlap) nên tổng số source là 3 (1 đoạn đầu
  // + 1 lặp sớm + 1 đoạn sau stopAll), không phải 2 như hợp đồng cũ.
  assert.equal(f.sources.length, 3);
  f.setNow(1.4);
  w.tick(8.5, [entry(8.5, 3.5)]);
  assert.equal(w.debugSnapshot().counters.holdCapStop, 0);
  assert.equal(w.isPlaying, true);
});

console.log(`reverseAudio194P3.test: ${pass} passed`);
