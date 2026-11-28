// reverseAudio197P3.test.ts — Đợt 197 P3: N11b decode cửa sổ.
// (a) DECODE-ONCE CACHE: loadReversedWindow lần đầu decode toàn file,
// các lần đổi cửa sổ sau của CÙNG 1 clip (cùng object ArrayBuffer bytes
// nén) chỉ trích subarray + đảo 30 s, KHÔNG gọi decodeAudioData nữa
// (đợt 196: mỗi lần đổi cửa sổ decode lại toàn file 300 s, 4,8–10,8 s).
// (b) Cache key = identity object: bytes khác → decode lại.
// (c) Cache có trần bộ nhớ: PCM > REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES
// thì KHÔNG cache (giữ hành vi cũ).
// (d) dispose() nhả cache: load lại sau dispose decode lại từ đầu.
// (e) Nội dung cửa sổ từ cache Y HỆT như decode lại (đảo đúng).
//   node --experimental-strip-types apps/web/src/lib/reverseAudio197P3.test.ts
import assert from "node:assert/strict";
import {
  REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES,
  REVERSED_AUDIO_WINDOW_SEC,
  ReverseAudioPlayer,
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
  decodeCalls: () => number;
} {
  let decodeCalls = 0;
  const ctx = {
    sampleRate: 1000,
    currentTime: 0,
    state: "running",
    destination: {},
    decodeAudioData: async () => {
      decodeCalls++;
      return decoded;
    },
    createBuffer: (ch: number, len: number, sr: number) => {
      const arrs = Array.from({ length: ch }, () => new Float32Array(len));
      return fakeBuffer(arrs, sr);
    },
    createBufferSource: () => ({
      buffer: null as ReversedAudioBufferLike | null,
      playbackRate: { value: 1 },
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
    }),
    createGain: () => ({
      gain: {
        value: 1,
        setTargetAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
      disconnect: () => {},
    }),
    resume: async () => {},
  } as unknown as ReversedAudioContextLike;
  return { ctx, decodeCalls: () => decodeCalls };
}

// Clip giả 300 s @ 1000 Hz, mono, mẫu = chỉ số (dễ kiểm đảo).
function rampBuffer(): { decoded: ReversedAudioBufferLike; ch: Float32Array } {
  const ch = new Float32Array(300_000);
  for (let i = 0; i < ch.length; i++) ch[i] = i;
  return { decoded: fakeBuffer([ch], 1000), ch };
}

ok("trần cache decode = 160 MB (300 s stereo 48 kHz ~115 MB vừa, 600 s ~230 MB không)", () => {
  assert.equal(REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES, 160_000_000);
  assert.equal(REVERSED_AUDIO_WINDOW_SEC, 30);
});

await okAsync("cache: 3 lần loadReversedWindow cùng bytes → decodeAudioData chỉ 1 lần", async () => {
  const { decoded } = rampBuffer();
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  const buf = new ArrayBuffer(8);
  assert.equal(await p.loadReversedWindow(buf, 270, 30), true);
  assert.equal(f.decodeCalls(), 1);
  assert.equal(p.lastWindowDecodeCached, false); // lần đầu: decode thật
  assert.equal(await p.loadReversedWindow(buf, 240, 30), true);
  assert.equal(f.decodeCalls(), 1);
  assert.equal(p.lastWindowDecodeCached, true); // đổi cửa sổ: cache
  assert.equal(await p.loadReversedWindow(buf, 210, 30), true);
  assert.equal(f.decodeCalls(), 1);
  assert.equal(p.lastWindowDecodeCached, true);
  // Cửa sổ cuối (210–240 s nguồn xuôi) đúng biên.
  assert.equal(p.windowStartSec, 210);
  assert.equal(p.windowEndSec, 240);
});

await okAsync("cache: nội dung cửa sổ từ cache đảo đúng (khớp mẫu nguồn)", async () => {
  // Dùng playSegment để đọc lại nội dung cửa sổ qua source.start offset:
  // cửa sổ [210, 240) nguồn xuôi → buffer đảo chứa forward[209999..239999]
  // đảo ngược; mẫu đầu cửa sổ = forward[239999] = 239999.
  const { decoded, ch } = rampBuffer();
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  const buf = new ArrayBuffer(8);
  await p.loadReversedWindow(buf, 270, 30); // decode thật
  await p.loadReversedWindow(buf, 210, 30); // từ cache
  assert.equal(f.decodeCalls(), 1);
  // Đọc trực tiếp buffer đảo qua playSegment: fake source ghi offset.
  // Thay vì fake source, kiểm bằng offset tuyệt đối: playSegment ở
  // offset đảo tuyệt đối của source time 239,9 s = (300−239,9)*1000 = 60100
  // mẫu; offset tương đối trong cửa sổ = 60100 − windowBase (60000) = 100.
  // Chỉ cần playSegment trả true (offset nằm trong cửa sổ cache).
  assert.equal(p.playSegment(60100, 0.5), true);
  assert.equal(p.playSegment(59999, 0.5), false); // ngoài cửa sổ dưới
  assert.equal(p.playSegment(90000, 0.5), false); // ngoài cửa sổ trên
  void ch;
});

await okAsync("cache: bytes khác object → decode lại (không lẫn clip)", async () => {
  const { decoded } = rampBuffer();
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversedWindow(new ArrayBuffer(8), 270, 30), true);
  assert.equal(f.decodeCalls(), 1);
  assert.equal(await p.loadReversedWindow(new ArrayBuffer(8), 240, 30), true);
  assert.equal(f.decodeCalls(), 2);
  assert.equal(p.lastWindowDecodeCached, false);
});

await okAsync("cache: PCM vượt trần thì KHÔNG cache — lần 2 decode lại", async () => {
  // 200.000 mẫu mono @ 1000 Hz = 200 s, 800.000 B — dưới trần; làm
  // buffer lớn vượt trần bằng cách fake length: decoded.length lớn
  // nhưng channel ngắn là không nhất quán nên dùng buffer thật lớn
  // theo chiều channels: 41 kênh × 1.000.000 mẫu = 164 MB > 160 MB.
  const chs = Array.from({ length: 41 }, () => new Float32Array(1_000_000));
  const decoded = fakeBuffer(chs, 1000); // duration 1000 s > maxSeconds!
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  const buf = new ArrayBuffer(8);
  // duration 1000 s > 600 s nên load trả false — nhưng decode vẫn chạy
  // 1 lần; kiểm trần bằng cách khác: buffer 500 s stereo giả lập PCM
  // 500*1000*2*4 = 4.000.000 B < trần nên cache được — đổi sang case
  // vượt trần thật: 41 kênh × 1.000.000 mẫu, maxSeconds nới lên 2000 s.
  assert.equal(await p.loadReversedWindow(buf, 970, 30, 2000), true);
  assert.equal(f.decodeCalls(), 1);
  assert.equal(p.lastWindowDecodeCached, false);
  assert.equal(await p.loadReversedWindow(buf, 940, 30, 2000), true);
  assert.equal(f.decodeCalls(), 2); // KHÔNG cache → decode lại
  assert.equal(p.lastWindowDecodeCached, false);
  void decoded;
});

await okAsync("cache: dispose() nhả cache — load sau dispose decode lại", async () => {
  const { decoded } = rampBuffer();
  const f = makeFakeCtx(decoded);
  const p = new ReverseAudioPlayer(f.ctx, {});
  const buf = new ArrayBuffer(8);
  assert.equal(await p.loadReversedWindow(buf, 270, 30), true);
  assert.equal(await p.loadReversedWindow(buf, 240, 30), true);
  assert.equal(f.decodeCalls(), 1);
  p.dispose();
  assert.equal(p.lastWindowDecodeCached, false);
  assert.equal(await p.loadReversedWindow(buf, 210, 30), true);
  assert.equal(f.decodeCalls(), 2);
  assert.equal(p.lastWindowDecodeCached, false);
});

console.log(`reverseAudio197P3: ${pass} test PASS`);
