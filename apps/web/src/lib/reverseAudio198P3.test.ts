// reverseAudio198P3.test.ts — Đợt 198 P3: N11b decode từng phần + fix F-197-P3-1.
// (a) mp4AudioDemux: parse track mp4a/AAC (esds, stts/stsz/stsc/stco)
//     từ MP4 tổng hợp + fixture thật longA/longB/chirp.
// (b) decodeAudioWindowPartial với fake AudioDecoder: chỉ decode các
//     frame AAC phủ cửa sổ, PCM khớp mốc coverStartSec, cắt đúng biên.
// (c) ReverseAudioPlayer.loadReversedWindow dùng partial trước: cửa sổ
//     dựng đúng, decodeAudioData KHÔNG được gọi, lần đổi cửa sổ sau
//     cũng partial; partial hỏng (buffer không phải MP4) thì rơi về
//     decode toàn file cũ.
// (d) clampSampleOffsetToWindow: kẹp offset về mép cửa sổ.
// (e) Wiring fix F-197-P3-1: tick đầu sau khi cửa sổ đổi, source time
//     vượt mép cửa sổ mới 0,2 s → clamp cứu playSegment (playClamped=1,
//     playFalse=0) thay vì playFalse như đợt 197.
//   node --experimental-strip-types apps/web/src/lib/reverseAudio198P3.test.ts
import assert from "node:assert/strict";
import * as fs from "node:fs";
import {
  aacAudioObjectType,
  audioSamplesForWindow,
  parseMp4AudioTrack,
} from "./mp4AudioDemux.ts";
import {
  decodeAudioWindowPartial,
  slicePartialPcmForWindow,
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
// Mỗi sample 0,1 s (100 unit), 10 byte, 1 chunk; 2 kênh, 48 kHz, AAC LC.
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
function buildSyntheticMp4(): ArrayBuffer {
  // ASC AAC LC stereo 48 kHz: audioObjectType 2, freqIndex 3 (48 kHz),
  // channels 2 → 0x11 0x10.
  const asc = new Uint8Array([0x11, 0x10]);
  assert.equal(aacAudioObjectType(asc), 2);
  const esdsPayload = concat(
    u32(0), // version/flags
    new Uint8Array([0x03, 22]), // ES_Descriptor, len 22
    u16(1), // ES_ID
    new Uint8Array([0x00]), // flags
    new Uint8Array([0x04, 17]), // DecoderConfigDescriptor, len 17
    new Uint8Array([0x40, 0x15]), // objectType AAC, streamType audio
    new Uint8Array([0x00, 0x00, 0x00]), // bufferSizeDB
    u32(128000), // maxBitrate
    u32(128000), // avgBitrate
    new Uint8Array([0x05, 2]), // DecoderSpecificInfo, len 2
    asc,
  );
  const esds = box("esds", esdsPayload);
  const mp4aEntry = concat(
    u32(36 + esds.length),
    ascii("mp4a"),
    new Uint8Array(6),
    u16(1), // data_reference_index
    new Uint8Array(8), // reserved version/revision/vendor
    u16(2), // channels
    u16(16), // sampleSize
    u16(0), // pre_defined
    u16(0), // reserved
    u32(48000 << 16), // sampleRate 16.16 fixed
    esds,
  );
  const stsd = box(
    "stsd",
    u32(0),
    u32(1),
    mp4aEntry,
  );
  const stts = box("stts", u32(0), u32(1), u32(10), u32(100));
  const stszPayload = [u32(0), u32(0), u32(10)];
  for (let i = 0; i < 10; i++) stszPayload.push(u32(10));
  const stsz = box("stsz", ...stszPayload);
  const stsc = box(
    "stsc",
    u32(0),
    u32(1),
    u32(1),
    u32(10),
    u32(1),
  );
  // stco: patch offset sau khi biết độ dài ftyp+moov (xem dưới).
  const stcoPlaceholder = box("stco", u32(0), u32(1), u32(0));
  const stbl = box("stbl", stsd, stts, stsz, stsc, stcoPlaceholder);
  const minf = box("minf", stbl);
  const mdhd = box(
    "mdhd",
    u32(0),
    u32(0),
    u32(0),
    u32(1000), // timescale
    u32(1000), // duration
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
    u32(1000),
    u32(0x00010000),
    u16(0x0100),
    new Uint8Array(10),
    new Uint8Array(36),
    new Uint8Array(24),
    u32(2),
  );
  const moovZero = box("moov", mvhd, box("trak", mdia));
  const ftyp = box(
    "ftyp",
    ascii("isom"),
    u32(512),
    ascii("isomiso2"),
  );
  // mdat data bắt đầu sau ftyp + moov + header mdat (8 byte).
  const mdatDataOff = ftyp.length + moovZero.length + 8;
  // Patch stco: field offset = vị trí u32 chunk offset trong moovZero.
  // Tìm bằng cách parse lại: stco nằm cuối stbl; tính tay: moovZero chứa
  // đúng 1 box stco, field là 4 byte cuối của box stco (sau count).
  const stcoFieldOff = moovZero.length - 4;
  new DataView(moovZero.buffer).setUint32(stcoFieldOff, mdatDataOff);
  const mdatPayload = new Uint8Array(100); // 10 sample × 10 byte dummy
  for (let i = 0; i < 100; i++) mdatPayload[i] = i & 0xff;
  const mdat = box("mdat", mdatPayload);
  const file = concat(ftyp, moovZero, mdat);
  return file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  ) as ArrayBuffer;
}

const SYNTH = buildSyntheticMp4();

ok("demux: parseEsds lấy đúng ASC + objectType", () => {
  const track = parseMp4AudioTrack(SYNTH);
  assert.equal(track.codec, "mp4a.40.2");
  assert.deepEqual([...track.description], [0x11, 0x10]);
});

ok("demux: track tổng hợp — timescale/sample/channels/duration", () => {
  const track = parseMp4AudioTrack(SYNTH);
  assert.equal(track.timescale, 1000);
  assert.equal(track.sampleRate, 48000);
  assert.equal(track.channels, 2);
  assert.equal(track.samples.length, 10);
  assert.equal(track.durationSec, 1);
  assert.equal(track.samples[0].timestamp, 0);
  assert.equal(track.samples[0].duration, 100);
  assert.equal(track.samples[9].timestamp, 900);
  assert.equal(track.samples[9].size, 10);
  // Offset tăng liên tiếp theo size (1 chunk, 10 sample × 10 byte).
  for (let i = 1; i < 10; i++) {
    assert.equal(
      track.samples[i].offset,
      track.samples[i - 1].offset + 10,
    );
  }
});

ok("demux: audioSamplesForWindow chọn đúng sample phủ cửa sổ", () => {
  const track = parseMp4AudioTrack(SYNTH);
  const sel = audioSamplesForWindow(track, 0.5, 0.3);
  assert.ok(sel);
  assert.equal(sel.firstIndex, 5);
  assert.equal(sel.lastIndex, 7);
  assert.equal(sel.coverStartSec, 0.5);
  assert.equal(sel.coverEndSec, 0.8);
  assert.equal(audioSamplesForWindow(track, 2, 0.3), null); // ngoài file
  assert.equal(audioSamplesForWindow(track, 0, 0), null);
});

ok("demux: buffer không phải MP4 thì ném (caller fallback)", () => {
  assert.throws(() => parseMp4AudioTrack(new ArrayBuffer(8)));
  assert.throws(() => parseMp4AudioTrack(new ArrayBuffer(0)));
});

// ---------- Fixture thật (nếu có trên VM) ----------
const FIX195 = "/home/hatch/workspace/tmp-round195-p3";
const FIX193 = "/home/hatch/workspace/tmp-round193-p3";
function fixtureDemux(name: string, file: string, channels: number, dur: number): void {
  if (!fs.existsSync(file)) {
    console.log(`  (skip) fixture thật ${name} vắng trên đĩa`);
    return;
  }
  const buf = fs.readFileSync(file);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const track = parseMp4AudioTrack(ab);
  assert.equal(track.codec, "mp4a.40.2", name);
  assert.equal(track.sampleRate, 48000, name);
  assert.equal(track.channels, channels, name);
  assert.ok(Math.abs(track.durationSec - dur) < 0.5, `${name} duration ${track.durationSec}`);
  assert.ok(track.samples.length > 100, `${name} samples ${track.samples.length}`);
  console.log(`  ✓ fixture thật ${name}: ${track.samples.length} sample AAC, ${track.durationSec.toFixed(2)} s`);
  pass++;
}
fixtureDemux("longA", `${FIX195}/longA-300s-gop300-720p.mp4`, 2, 300.62);
fixtureDemux("longB", `${FIX195}/longB-300s-gop15-360p.mp4`, 2, 300.62);
fixtureDemux("chirp-70s", `${FIX193}/chirp-70s.mp4`, 1, 70);

// ---------- Fake AudioDecoder: PCM = chỉ số mẫu toàn cục ----------
// Mỗi chunk AAC → numberOfFrames = duration µs → mẫu @48 kHz; giá trị
// mẫu = chỉ số mẫu toàn cục (đếm từ đầu lần decode này) — đủ để kiểm
// căn chỉnh PCM với coverStartSec mà không cần AAC thật.
class FakeAudioChunk {
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
class FakeAudioDecoder {
  static async isConfigSupported(): Promise<{ supported: boolean }> {
    return { supported: true };
  }
  private readonly init: {
    output: (d: unknown) => void;
    error: (e: Error) => void;
  };
  private baseSample = 0;
  constructor(init: { output: (d: unknown) => void; error: (e: Error) => void }) {
    this.init = init;
  }
  configure(): void {}
  decode(chunk: FakeAudioChunk): void {
    const frames = Math.round((chunk.duration / 1_000_000) * 48000);
    const base = this.baseSample;
    this.baseSample += frames;
    const out = {
      numberOfChannels: 2,
      numberOfFrames: frames,
      sampleRate: 48000,
      timestamp: chunk.timestamp,
      duration: chunk.duration,
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
const FAKE_DEPS = {
  AudioDecoder: FakeAudioDecoder,
  EncodedAudioChunk: FakeAudioChunk,
} as unknown as Parameters<typeof decodeAudioWindowPartial>[3];

await okAsync("partial (fake decoder): PCM khớp mốc coverStartSec", async () => {
  const r = await decodeAudioWindowPartial(SYNTH, 0.5, 0.3, FAKE_DEPS);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.sampleRate, 48000);
  assert.equal(r.numberOfChannels, 2);
  // Chọn theo lưới PCM + 1 frame priming: cửa sổ [0,5, 0,8] bắt đầu
  // ở frame 6 (frame 5 là tiền lệ cho overlap-add, frame 6 là frame
  // đầu có mẫu thuộc cửa sổ trong hệ lưới PCM).
  assert.equal(r.coverStartSec, 0.6);
  assert.equal(r.coverEndSec, 0.9);
  assert.equal(r.samplesDecoded, 3);
  assert.equal(r.sampleCount, 14400); // 3 frame × 4800 mẫu
  // Nạp thêm 1 frame tiền lệ (sample 5) rồi bỏ output của nó theo
  // timestamp: primingTrimmedSamples = 4800 (1 frame fake), PCM[0]
  // = mẫu đầu của frame đầu cửa sổ trong hệ đếm của fake (4800).
  assert.equal(r.primingTrimmedSamples, 4800);
  assert.equal(r.firstSampleIndex, 6);
  // Fake decoder đếm mẫu từ đầu lần decode này (không biết mốc tuyệt
  // đối): PCM[0] = mẫu đầu của frame đầu cửa sổ, PCM tăng liên tục
  // 14400 mẫu — căn chỉnh tuyệt đối với decode toàn file được kiểm
  // bằng probe headed 198 (so với ffmpeg L), không phải ở đây.
  assert.equal(r.channels[0][0], 4800);
  assert.equal(r.channels[0][14399], 19199);
  assert.equal(r.channels[1][0], 4800);
});

await okAsync("partial: slice đúng biên cửa sổ (chưa đảo)", async () => {
  const r = await decodeAudioWindowPartial(SYNTH, 0.5, 0.3, FAKE_DEPS);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const slice = slicePartialPcmForWindow(r, 0.5, 0.3);
  assert.ok(slice);
  assert.equal(slice.startIdx, 24000);
  assert.equal(slice.endIdx, 38400);
  assert.equal(slice.channels[0].length, 14400);
  assert.equal(slice.channels[0][0], 4800); // đầu lát = đầu PCM từng phần (sau khi bỏ tiền lệ)
});

await okAsync("partial: cửa sổ đầu file (frame 0 là priming, frame 1 là frame đầu)", async () => {
  const r = await decodeAudioWindowPartial(SYNTH, 0, 0.3, FAKE_DEPS);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  // Lưới PCM + 1 frame priming: cửa sổ [0, 0,3] bắt đầu ở frame 1
  // (frame 0 là priming, được nạp làm tiền lệ rồi bỏ).
  assert.equal(r.firstSampleIndex, 1);
  assert.equal(r.primingTrimmedSamples, 4800);
  assert.equal(r.sampleCount, 14400);
  assert.equal(r.channels[0][0], 4800);
});

// ---------- Fake ctx (mẫu 192/197) ----------
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

await okAsync("player: loadReversedWindow dùng partial, không gọi decodeAudioData", async () => {
  const f = makeFakeCtx(fakeBuffer([new Float32Array(48000)], 48000), 48000);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversedWindow(SYNTH, 0, 0.3, 600, FAKE_DEPS), true);
  assert.equal(p.lastWindowDecodePartial, true);
  assert.equal(p.lastWindowDecodeCached, false);
  assert.equal(f.decodeCalls(), 0); // KHÔNG decode toàn file
  assert.equal(p.windowStartSec, 0);
  assert.equal(p.windowEndSec, 0.3);
  assert.equal(p.durationSec, 1);
  // Đổi cửa sổ sau cũng partial (không cache decode toàn file).
  assert.equal(await p.loadReversedWindow(SYNTH, 0.5, 0.3, 600, FAKE_DEPS), true);
  assert.equal(p.lastWindowDecodePartial, true);
  assert.equal(f.decodeCalls(), 0);
  assert.equal(p.windowStartSec, 0.5);
  assert.equal(p.windowEndSec, 0.8);
  // Offset đảo tuyệt đối của source 0,79 s = (1−0,79)×48000 = 10080,
  // nằm trong cửa sổ [9600, 24000) → phát được.
  assert.equal(p.playSegment(10080, 0.5), true);
  assert.equal(p.playSegment(9599, 0.5), false);
  assert.equal(p.playSegment(24000, 0.5), false);
});

await okAsync("player: partial hỏng thì rơi về decode toàn file cũ", async () => {
  const ch = new Float32Array(300_000);
  for (let i = 0; i < ch.length; i++) ch[i] = i;
  const decoded = fakeBuffer([ch], 1000);
  const f = makeFakeCtx(decoded, 1000);
  const p = new ReverseAudioPlayer(f.ctx, {});
  const buf = new ArrayBuffer(8); // không phải MP4 → partial hỏng
  assert.equal(await p.loadReversedWindow(buf, 270, 30), true);
  assert.equal(p.lastWindowDecodePartial, false);
  assert.equal(f.decodeCalls(), 1); // decode toàn file 1 lần
  assert.equal(p.windowStartSec, 270);
  assert.equal(p.windowEndSec, 300);
  // Lần 2 cùng bytes → cache (không decode lại, không thử partial lại).
  assert.equal(await p.loadReversedWindow(buf, 240, 30), true);
  assert.equal(f.decodeCalls(), 1);
  assert.equal(p.lastWindowDecodeCached, true);
});

await okAsync("player: clampSampleOffsetToWindow kẹp về mép cửa sổ", async () => {
  // Dùng đường fallback (fake ctx 1000 Hz) để có cửa sổ [270,300]:
  // windowBase = 300000 − 300000 = 0, len 30000 — đổi sang cửa sổ
  // [240,270]: base = 300000 − 270000 = 30000, len 30000.
  const ch = new Float32Array(300_000);
  const decoded = fakeBuffer([ch], 1000);
  const f = makeFakeCtx(decoded, 1000);
  const p = new ReverseAudioPlayer(f.ctx, {});
  const buf = new ArrayBuffer(8);
  await p.loadReversedWindow(buf, 270, 30);
  await p.loadReversedWindow(buf, 240, 30);
  assert.equal(p.windowBaseSampleAbs, 30000);
  assert.equal(p.windowLengthSamples, 30000);
  assert.equal(p.clampSampleOffsetToWindow(29999), 30000); // dưới mép → mép dưới
  assert.equal(p.clampSampleOffsetToWindow(60000), 59999); // trên mép → mép trên
  assert.equal(p.clampSampleOffsetToWindow(45000), 45000); // trong cửa sổ → giữ nguyên
});

// ---------- Wiring: fix F-197-P3-1 ----------
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

await okAsync("wiring F-197-P3-1: tick đầu sau đổi cửa sổ được clamp cứu (playFalse=0)", async () => {
  const ch = new Float32Array(300_000);
  for (let i = 0; i < ch.length; i++) ch[i] = i;
  const decoded = fakeBuffer([ch], 1000);
  const f = makeFakeCtx(decoded, 1000);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  // Tick 1: kích load cửa sổ đầu [270,300].
  w.tick(300, [entry300({ sourceTimeSec: 300 })]);
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1);
  // Tick 2: phát đoạn đầu (source 299 → offset 1000).
  f.setNow(0);
  w.tick(299, [entry300({ sourceTimeSec: 299 })]);
  assert.equal(f.started.length, 1);
  // Tick 3: source 274 < 270+5 → kích rebuild nền; đoạn cũ vẫn phát
  // được trong cửa sổ cũ (offset 26000, rel 26000 < 30000).
  f.setNow(0.6);
  w.tick(274.5, [entry300({ sourceTimeSec: 274 })]);
  assert.equal(f.started.length, 2);
  await tick();
  await tick();
  const snap3 = w.debugSnapshot();
  assert.equal(snap3.counters.windowRebuilds, 1);
  assert.equal(snap3.windows[0].windowStartSec, 244);
  assert.equal(snap3.windows[0].windowEndSec, 274);
  // Tick 4: source time ramp chạy trước 0,2 s so với mép cửa sổ mới
  // (274,2 > 274) → offset kỳ vọng 25800 vừa nằm NGOÀI cửa sổ mới
  // (base 26000). Không có clamp thì playSegment trả false (F-197-P3-1);
  // có clamp thì về mép 26000 và phát được.
  f.setNow(0.7);
  w.tick(273.8, [entry300({ sourceTimeSec: 274.2 })]);
  assert.equal(f.started.length, 3);
  assert.equal(f.started[2].offset, 0); // relStart = 26000 − 26000
  const c = w.debugSnapshot().counters;
  assert.equal(c.playClamped, 1);
  assert.equal(c.playFalse, 0);
  assert.equal(c.playOk, 3);
});

console.log(`reverseAudio198P3: ${pass} test PASS`);
