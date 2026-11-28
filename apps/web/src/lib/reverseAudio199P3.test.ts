// reverseAudio199P3.test.ts — Đợt 199 P3: sửa N11b cửa sổ cuối + log lý do partial fail.
// (a) REPRO BUG ĐỢT 198: cửa sổ cuối longA [270.154, 300.154] decode ok
//     nhưng slice null vì code cũ CẮT 769 mẫu "priming lẻ" theo timestamp
//     (frame tiền lệ duration stts 1793 làm output đầu giữ lại sớm hơn
//     mốc stts 769 mẫu — nhưng decoder trả đúng spf mẫu/frame theo lưới
//     PCM nên 769 mẫu đó là mẫu THẬT, không phải priming). Fake decoder
//     kiểu Chromium (timestamp cộng dồn theo mẫu decode, mỗi chunk đúng
//     spf mẫu bất kể duration stts) + fixture tổng hợp có frame tiền lệ
//     duration dài → code mới KHÔNG cắt, slice đúng biên.
// (b) Frame cuối file ngắn (stts 768) vẫn ok — check lưới khoan dung.
// (c) slicePartialPcmFailureReason mô tả đúng ca slice null.
// (d) Player: cửa sổ cuối dùng partial + lastPartialFailReason null;
//     partial hỏng (không phải MP4) ghi rõ lý do + fallback full decode.
// (e) Wiring: partialFail đếm + snapshot có partialFailReason.
//   node --experimental-strip-types apps/web/src/lib/reverseAudio199P3.test.ts
import assert from "node:assert/strict";
import {
  parseMp4AudioTrack,
} from "./mp4AudioDemux.ts";
import {
  decodeAudioWindowPartial,
  slicePartialPcmForWindow,
  slicePartialPcmFailureReason,
} from "./reverseAudioPartial.ts";
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

// ---------- MP4 tổng hợp: 1 track mp4a, timescale 1000, 10 sample ----------
// durations: stts từng sample (đơn vị timescale). spf = durations[0]
// × 48 (48 kHz / 1000). ASC AAC LC stereo 48 kHz: 0x11 0x10.
function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n);
  return b;
}
function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n);
  return b;
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let w = 0;
  for (const a of arrs) {
    out.set(a, w);
    w += a.length;
  }
  return out;
}
function box(type: string, ...payloads: Uint8Array[]): Uint8Array {
  const payload = concat(...payloads);
  const head = new Uint8Array(8);
  new DataView(head.buffer).setUint32(0, 8 + payload.length);
  head.set(new TextEncoder().encode(type), 4);
  return concat(head, payload);
}
function ascii(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function buildSyntheticMp4(durations: number[]): ArrayBuffer {
  const asc = new Uint8Array([0x11, 0x10]);
  const totalDur = durations.reduce((a, b) => a + b, 0);
  const esdsPayload = concat(
    u32(0),
    new Uint8Array([0x03, 22]),
    u16(1),
    new Uint8Array([0x00]),
    new Uint8Array([0x04, 17]),
    new Uint8Array([0x40, 0x15]),
    new Uint8Array([0x00, 0x00, 0x00]),
    u32(128000),
    u32(128000),
    new Uint8Array([0x05, 2]),
    asc,
  );
  const esds = box("esds", esdsPayload);
  const mp4aEntry = concat(
    u32(36 + esds.length),
    ascii("mp4a"),
    new Uint8Array(6),
    u16(1),
    new Uint8Array(8),
    u16(2),
    u16(16),
    u16(0),
    u16(0),
    u32(48000 << 16),
    esds,
  );
  const stsd = box("stsd", u32(0), u32(1), mp4aEntry);
  // stts: run-length encode durations.
  const runs: Array<[number, number]> = [];
  for (const d of durations) {
    const last = runs[runs.length - 1];
    if (last && last[1] === d) last[0]++;
    else runs.push([1, d]);
  }
  const sttsEntries = [u32(0), u32(runs.length)];
  for (const [count, delta] of runs) sttsEntries.push(u32(count), u32(delta));
  const stts = box("stts", ...sttsEntries);
  const stszPayload = [u32(0), u32(0), u32(durations.length)];
  for (let i = 0; i < durations.length; i++) stszPayload.push(u32(10));
  const stsz = box("stsz", ...stszPayload);
  const stsc = box("stsc", u32(0), u32(1), u32(1), u32(durations.length), u32(1));
  const stcoPlaceholder = box("stco", u32(0), u32(1), u32(0));
  const stbl = box("stbl", stsd, stts, stsz, stsc, stcoPlaceholder);
  const minf = box("minf", stbl);
  const mdhd = box(
    "mdhd",
    u32(0),
    u32(0),
    u32(0),
    u32(1000),
    u32(totalDur),
    u16(0x55c4),
    u16(0),
  );
  const mdia = box("mdia", mdhd, minf);
  const mvhd = box(
    "mvhd",
    u32(0),
    u32(0),
    u32(0),
    u32(1000),
    u32(totalDur),
    u32(0x00010000),
    u16(0x0100),
    new Uint8Array(10),
    new Uint8Array(36),
    new Uint8Array(24),
    u32(2),
  );
  const moovZero = box("moov", mvhd, box("trak", mdia));
  const ftyp = box("ftyp", ascii("isom"), u32(512), ascii("isomiso2"));
  const mdatDataOff = ftyp.length + moovZero.length + 8;
  const stcoFieldOff = moovZero.length - 4;
  new DataView(moovZero.buffer).setUint32(stcoFieldOff, mdatDataOff);
  const mdatPayload = new Uint8Array(durations.length * 10);
  for (let i = 0; i < mdatPayload.length; i++) mdatPayload[i] = i & 0xff;
  const mdat = box("mdat", mdatPayload);
  const file = concat(ftyp, moovZero, mdat);
  return file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  ) as ArrayBuffer;
}

// Fixture A — repro longA: sample 5 (frame tiền lệ của cửa sổ [0.5,0.8])
// duration 150 (như frame 1793 của file thật), còn lại 100.
const SYNTH_LONG_PRIME = buildSyntheticMp4(
  [100, 100, 100, 100, 100, 150, 100, 100, 100, 100],
);
// Fixture B — frame cuối ngắn: sample cuối duration 50 (như frame 768).
const SYNTH_SHORT_LAST = buildSyntheticMp4(
  [100, 100, 100, 100, 100, 100, 100, 100, 100, 50],
);

ok("demux 199: fixture long-prime + short-last parse đúng", () => {
  const a = parseMp4AudioTrack(SYNTH_LONG_PRIME);
  assert.equal(a.samples.length, 10);
  assert.equal(a.samples[5].duration, 150);
  assert.equal(a.samples[6].timestamp, 650);
  assert.equal(a.durationSec, 1.05);
  const b = parseMp4AudioTrack(SYNTH_SHORT_LAST);
  assert.equal(b.samples[9].duration, 50);
  assert.equal(b.durationSec, 0.95);
});

// ---------- Fake AudioDecoder kiểu Chromium ----------
// - Mỗi chunk decode đúng spf mẫu (spf đo từ chunk đầu: duration µs →
//   mẫu @48 kHz), BẤT KỂ duration stts (frame 150 vẫn ra 4800 mẫu —
//   đúng hành vi đo thật trên longA: mọi cửa sổ đều trả kept×1024).
// - Chunk cuối ngắn (duration < spf) thì trả ít mẫu hơn (frame cuối
//   file stts 768 → decoder khác có thể trả 768 thay vì 1024).
// - Timestamp output CỘNG DỒN theo mẫu decode (chunk sau = chunk trước
//   + duration output), KHÔNG theo timestamp stts từng chunk — đúng
//   hành vi đo thật (frame tiền lệ 1793 làm output sau sớm hơn mốc
//   stts 769 mẫu). Giá trị mẫu = chỉ số mẫu toàn cục từ đầu lần decode.
class FakeAudioChunk199 {
  type: string;
  timestamp: number;
  duration: number;
  data: Uint8Array;
  constructor(init: { type: string; timestamp: number; duration: number; data: Uint8Array }) {
    this.type = init.type;
    this.timestamp = init.timestamp;
    this.duration = init.duration;
    this.data = init.data;
  }
}
class FakeAudioDecoder199 {
  static async isConfigSupported(): Promise<{ supported: boolean }> {
    return { supported: true };
  }
  /** spf của codec trong fixture tổng hợp (100 ms @48 kHz = 4800 mẫu)
   * — decoder thật biết spf từ codec, không suy từ duration stts của
   * chunk đầu (chunk đầu có thể là frame dài 150 như fixture A). */
  static spfOverride = 4800;
  private readonly init: {
    output: (d: unknown) => void;
    error: (e: Error) => void;
  };
  private baseSample = 0;
  private nextTsUs: number | null = null;
  private spf: number | null = null;
  constructor(init: { output: (d: unknown) => void; error: (e: Error) => void }) {
    this.init = init;
  }
  configure(): void {}
  decode(chunk: FakeAudioChunk199): void {
    if (this.spf === null) {
      this.spf = FakeAudioDecoder199.spfOverride;
    }
    const spf = this.spf;
    // Frame decode = min(spf, duration stts → mẫu): frame dài (150)
    // vẫn đúng spf; frame cuối ngắn (50) thì trả ít hơn.
    const frames = Math.min(spf, Math.round((chunk.duration / 1_000_000) * 48000));
    if (this.nextTsUs === null) this.nextTsUs = chunk.timestamp;
    const tsUs = this.nextTsUs;
    this.nextTsUs += Math.round((frames / 48000) * 1_000_000);
    const base = this.baseSample;
    this.baseSample += frames;
    const out = {
      numberOfChannels: 2,
      numberOfFrames: frames,
      sampleRate: 48000,
      timestamp: tsUs,
      duration: Math.round((frames / 48000) * 1_000_000),
      copyTo: (dest: Float32Array, opts: { planeIndex: number }): void => {
        void opts;
        for (let i = 0; i < frames; i++) dest[i] = base + i;
      },
      close: (): void => {},
    };
    this.init.output(out);
  }
  async flush(): Promise<void> {}
  close(): void {}
}
const FAKE_DEPS_199 = {
  AudioDecoder: FakeAudioDecoder199,
  EncodedAudioChunk: FakeAudioChunk199,
} as unknown as Parameters<typeof decodeAudioWindowPartial>[3];

await okAsync("partial 199 (repro bug 198): frame tiền lệ duration dài không làm slice null", async () => {
  const r = await decodeAudioWindowPartial(SYNTH_LONG_PRIME, 0.5, 0.3, FAKE_DEPS_199);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  // Code cũ: output đầu giữ lại sớm hơn mốc stts (0,65−0,60) s = 2400
  // mẫu → extraTrim 2400 → sampleCount 12000 → slice null (bug 198).
  // Code mới: không cắt theo timestamp, sampleCount đủ 14400.
  assert.equal(r.timestampDriftSamples, 2400);
  assert.equal(r.firstSampleIndex, 6);
  assert.equal(r.samplesPerFrame, 4800);
  assert.equal(r.sampleCount, 14400); // 3 frame × 4800 (code cũ: 12000)
  assert.equal(r.primingTrimmedSamples, 4800); // chỉ output tiền lệ
  const slice = slicePartialPcmForWindow(r, 0.5, 0.3);
  assert.ok(slice, "slice phải non-null sau fix 199 (đợt 198: null)");
  assert.equal(slice.startIdx, 24000);
  assert.equal(slice.endIdx, 38400);
  assert.equal(slice.channels[0].length, 14400);
  assert.equal(slice.channels[0][0], 4800); // PCM[0] = đầu frame 6
  assert.equal(slice.channels[0][14399], 19199);
  assert.equal(slicePartialPcmFailureReason(r, 0.5, 0.3), null);
});

await okAsync("partial 199: frame cuối ngắn vẫn ok (check lưới khoan dung)", async () => {
  const r = await decodeAudioWindowPartial(SYNTH_SHORT_LAST, 0.55, 0.3, FAKE_DEPS_199);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.firstSampleIndex, 6);
  // 3 frame đủ 4800 + frame cuối 2400 = 16800 (check tuyệt đối cũ sẽ
  // đòi 4×4800 = 19200 → fail oan).
  assert.equal(r.sampleCount, 16800);
  assert.equal(r.totalPcmSamples, 40800); // 6×4800 + 16800 − 4800
  const slice = slicePartialPcmForWindow(r, 0.55, 0.3);
  assert.ok(slice);
  assert.equal(slice.startIdx, 26400);
  assert.equal(slice.endIdx, 40800);
  assert.equal(slice.channels[0].length, 14400);
  assert.equal(slice.channels[0][0], 7200); // PCM[2400] (off=2400)
  assert.equal(slice.channels[0][14399], 21599); // mẫu cuối frame 9
});

await okAsync("partial 199: slicePartialPcmFailureReason mô tả đúng ca thiếu mẫu", async () => {
  // Partial object tự dựng: PCM từng phần chỉ có 1000 mẫu trong khi
  // cửa sổ [0.5, 0.8] cần 14400 → slice null, lý do ghi đủ số.
  const fake = {
    ok: true as const,
    channels: [new Float32Array(1000), new Float32Array(1000)],
    sampleRate: 48000,
    numberOfChannels: 2,
    coverStartSec: 0.5,
    coverEndSec: 0.8,
    durationSec: 1,
    samplesDecoded: 3,
    sampleCount: 1000,
    decodeMs: 1,
    primingTrimmedSamples: 4800,
    firstSampleIndex: 6,
    samplesPerFrame: 4800,
    timestampDriftSamples: 0,
    totalPcmSamples: null,
  };
  assert.equal(slicePartialPcmForWindow(fake, 0.5, 0.3), null);
  const reason = slicePartialPcmFailureReason(fake, 0.5, 0.3);
  assert.ok(reason);
  assert.ok(reason.includes("cần off+len=14400"), `reason: ${reason}`);
  assert.ok(reason.includes("thiếu 13400"), `reason: ${reason}`);
});

await okAsync("partial 199: cửa sổ vượt cuối file thật thì ngắn lại, không trượt (fix pass A)", async () => {
  const r = await decodeAudioWindowPartial(SYNTH_SHORT_LAST, 0.7, 0.3, FAKE_DEPS_199);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  // Cửa sổ xin [0.7, 1.0] vượt quá PCM thật (0,85 s): code cũ trượt
  // startIdx về 0,55 (endIdx − windowSec) mà PCM từng phần không phủ
  // → slice null (đúng ca longA pass A: off −20736). Code mới giữ
  // startIdx = đầu cửa sổ được xin → lát ngắn [0.7, 0.85], đủ mẫu.
  const slice = slicePartialPcmForWindow(r, 0.7, 0.3);
  assert.ok(slice, "slice phải non-null: cửa sổ ngắn lại thay vì trượt");
  assert.equal(slice.startIdx, 33600);
  assert.equal(slice.endIdx, 40800);
  assert.equal(slice.channels[0].length, 7200); // 0,15 s, không phải 0,3 s
  assert.equal(slice.channels[0][0], 4800); // PCM[0] = đầu frame 8
  assert.equal(slice.channels[0][7199], 11999); // mẫu cuối frame 9
  assert.equal(slicePartialPcmFailureReason(r, 0.7, 0.3), null);
});

// ---------- Fake ctx (mẫu 198) ----------
function fakeBuffer(channels: Float32Array[], sampleRate = 1000): ReversedAudioBufferLike {
  return {
    numberOfChannels: channels.length,
    length: channels[0]?.length ?? 0,
    sampleRate,
    duration: (channels[0]?.length ?? 0) / sampleRate,
    getChannelData: (ch: number) => channels[ch],
  };
}
function makeFakeCtx(decoded: ReversedAudioBufferLike, sampleRate = 1000): {
  ctx: ReversedAudioContextLike;
  started: Array<{ offset: number; dur: number }>;
  setNow: (t: number) => void;
  decodeCalls: () => number;
} {
  const started: Array<{ offset: number; dur: number }> = [];
  let decodeCalls = 0;
  let now = 0;
  const ctx = {
    sampleRate,
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
      return fakeBuffer(arrs, sr);
    },
    createBufferSource: () => ({
      buffer: null as ReversedAudioBufferLike | null,
      playbackRate: { value: 1 },
      connect: () => {},
      disconnect: () => {},
      start: (_w?: number, o?: number, d?: number) => {
        started.push({ offset: o ?? 0, dur: d ?? 0 });
      },
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
  return { ctx, started, setNow: (t: number) => { now = t; }, decodeCalls: () => decodeCalls };
}

await okAsync("player 199: cửa sổ có frame tiền lệ dài dùng partial, lý do fail null", async () => {
  const f = makeFakeCtx(fakeBuffer([new Float32Array(48000)], 48000), 48000);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversedWindow(SYNTH_LONG_PRIME, 0.5, 0.3, 600, FAKE_DEPS_199), true);
  assert.equal(p.lastWindowDecodePartial, true);
  assert.equal(p.lastPartialFailReason, null);
  assert.equal(f.decodeCalls(), 0); // KHÔNG decode toàn file
  assert.equal(p.windowStartSec, 0.5);
  assert.equal(p.windowEndSec, 0.8);
});

await okAsync("player 199: bufferSampleRate = rate file (48000), offset tính theo rate buffer", async () => {
  // Fake ctx 44100 Hz (như headless Chrome) nhưng partial decode ở
  // 48000 Hz: offset mẫu PHẢI tính theo 48000, nếu tính theo 44100 thì
  // lệch hệ số 48000/44100 và drift vọt ~1,3 s (pass A-199).
  const f = makeFakeCtx(fakeBuffer([new Float32Array(48000)], 48000), 44100);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversedWindow(SYNTH_LONG_PRIME, 0.5, 0.3, 600, FAKE_DEPS_199), true);
  assert.equal(p.bufferSampleRate, 48000);
  // Cửa sổ [0.5, 0.8], base = 50400 − 38400 = 12000 (mẫu @48000).
  // Source 0,79 s → offset đúng (48000) = 12480, relStart 480 → phát được.
  assert.equal(p.playSegment(12480, 0.5), true);
  // Offset tính theo rate ctx (44100) = 11466 < base 12000 → ngoài cửa
  // sổ → false (đây là lỗi pass A gặp khi wiring dùng rate ctx).
  assert.equal(p.playSegment(11466, 0.5), false);
});

await okAsync("player 199: partial hỏng ghi rõ lý do + fallback full decode", async () => {
  const ch = new Float32Array(300_000);
  const decoded = fakeBuffer([ch], 1000);
  const f = makeFakeCtx(decoded, 1000);
  const p = new ReverseAudioPlayer(f.ctx, {});
  const buf = new ArrayBuffer(8); // không phải MP4 → partial hỏng ở demux
  assert.equal(await p.loadReversedWindow(buf, 270, 30), true);
  assert.equal(p.lastWindowDecodePartial, false);
  assert.ok(p.lastPartialFailReason);
  assert.ok(p.lastPartialFailReason.includes("demux"), `reason: ${p.lastPartialFailReason}`);
  assert.equal(f.decodeCalls(), 1);
  // Load sau lấy từ cache → lý do về null (lần này không thử partial).
  assert.equal(await p.loadReversedWindow(buf, 240, 30), true);
  assert.equal(p.lastWindowDecodeCached, true);
  assert.equal(p.lastPartialFailReason, null);
});

// ---------- Wiring: partialFail ----------
const tick = () => new Promise((r) => setTimeout(r, 0));
function entry300(over: Partial<ReverseAudioWiringEntry> = {}): ReverseAudioWiringEntry {
  return {
    clipKey: "clip1",
    url: "blob:audio1",
    sourceDurationSec: 300,
    sourceTimeSec: 299,
    gain: 1,
    speed: 1,
    ...over,
  };
}

await okAsync("wiring 199: tick tính offset theo rate buffer, không theo rate ctx", async () => {
  // Wiring với fake ctx 44100 + fake partial 48000: tick ở source 0,85 s
  // phải phát ở offset giây 2400/48000 = 0,05 (rate buffer), không phải
  // 1620/48000 = 0,03375 (rate ctx).
  const decoded = fakeBuffer([new Float32Array(300_000)], 1000);
  const f = makeFakeCtx(decoded, 44100);
  const synthBytes = SYNTH_LONG_PRIME.slice(0);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => synthBytes, FAKE_DEPS_199);
  const entryPrime = (over: Partial<ReverseAudioWiringEntry> = {}): ReverseAudioWiringEntry => ({
    clipKey: "clip1",
    url: "blob:audio1",
    sourceDurationSec: 300, // > 60 s → windowed (duration thật của fixture 1,05 s)
    sourceTimeSec: 0.9,
    gain: 1,
    speed: 1,
    ...over,
  });
  w.tick(0.9, [entryPrime({ sourceTimeSec: 0.9 })]);
  await tick();
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  const snap0 = w.debugSnapshot();
  assert.equal(snap0.counters.windowDecodePartial, 1);
  assert.equal(snap0.windows[0].windowStartSec, 0);
  // endIdx = floor((−29,1+30)×48000) = 43199 do float (w0+wSec =
  // 0,8999… thay vì 0,9) → windowEndSec ≈ 0,9 trong 2 mẫu.
  assert.ok(Math.abs(snap0.windows[0].windowEndSec - 0.9) <= 2 / 48000);
  f.setNow(0);
  w.tick(0.85, [entryPrime({ sourceTimeSec: 0.85 })]);
  assert.equal(f.started.length, 1);
  // offset giây = relStart / 48000 ≈ 2400/48000 = 0,05 (rate buffer);
  // lệch ≤ 1 mẫu do float (1,05−0,85 = 0,1999…).
  assert.ok(Math.abs(f.started[0].offset - 0.05) <= 2 / 48000, `offset=${f.started[0].offset}`);
});

await okAsync("wiring 199: tick đầu sau load cửa sổ đầu được clamp cứu (playFalse=0)", async () => {
  // Nối tiếp test rate: cửa sổ đầu [0, 0,9] (audio thật hết ở 0,9 s
  // nhưng durationSec stts 1,05 s) — tick đầu ở source 0,95 s nằm
  // NGOÀI cửa sổ (offset 4800 < base 7200): không clamp thì
  // playSegment false (12 lần như pass A-199); có clamp (cờ đặt ở
  // load cửa sổ đầu) thì về mép 7200 và phát được.
  const decoded = fakeBuffer([new Float32Array(300_000)], 1000);
  const f = makeFakeCtx(decoded, 44100);
  const synthBytes = SYNTH_LONG_PRIME.slice(0);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => synthBytes, FAKE_DEPS_199);
  const entryPrime = (over: Partial<ReverseAudioWiringEntry> = {}): ReverseAudioWiringEntry => ({
    clipKey: "clip1",
    url: "blob:audio1",
    sourceDurationSec: 300,
    sourceTimeSec: 0.9,
    gain: 1,
    speed: 1,
    ...over,
  });
  w.tick(0.9, [entryPrime({ sourceTimeSec: 0.9 })]);
  await tick();
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  f.setNow(0);
  w.tick(0.95, [entryPrime({ sourceTimeSec: 0.95 })]);
  assert.equal(f.started.length, 1);
  assert.equal(f.started[0].offset, 0); // relStart = 7200 − 7200
  // Tick 2: đoạn 0,5 s đã hết (now 0,6), playhead vẫn ngoài cửa sổ
  // (0,94 > 0,9) → cờ clamp PHẢI CÒN (không bị xóa ở tick 1) để cứu
  // tiếp; code cũ xóa cờ ở tick 1 nên tick này playFalse.
  f.setNow(0.6);
  w.tick(0.94, [entryPrime({ sourceTimeSec: 0.94 })]);
  assert.equal(f.started.length, 2);
  assert.equal(f.started[1].offset, 0);
  const c = w.debugSnapshot().counters;
  assert.equal(c.playClamped, 2);
  assert.equal(c.playFalse, 0);
  assert.equal(c.playOk, 2);
});

await okAsync("wiring 199: partial fail đếm riêng + snapshot có lý do", async () => {
  const ch = new Float32Array(300_000);
  for (let i = 0; i < ch.length; i++) ch[i] = i;
  const decoded = fakeBuffer([ch], 1000);
  const f = makeFakeCtx(decoded, 1000);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  w.tick(300, [entry300({ sourceTimeSec: 300 })]);
  await tick();
  await tick();
  await tick();
  const snap = w.debugSnapshot();
  assert.equal(snap.counters.windowDecodeFull, 1);
  assert.equal(snap.counters.partialFail, 1);
  assert.equal(snap.counters.windowDecodePartial, 0);
  assert.ok(snap.partialFailReason);
  assert.ok(snap.partialFailReason.includes("demux"), `reason: ${snap.partialFailReason}`);
});

console.log(`reverseAudio199P3: ${pass} test PASS`);
