// mp4Demux34Q2.test.ts — Khóa hỗ trợ ctts/elst của đợt 34 Q2.
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/mp4Demux34Q2.test.ts
// (chạy từ gốc repo). Fixture MP4 được DỰNG BẰNG TAY trong test này
// (không phải file thật): đủ box để parseMp4VideoTrack đi qua đúng
// nhánh ctts v0/v1 + elst v0/v1. Decode thật bằng VideoDecoder (B-frame
// thật) thuộc về probe browser, không mock ở đây.
import assert from "node:assert/strict";
import {
  displayTimestampUnits,
  editShiftUnits,
  isBeforeEditStart,
  parseMp4VideoTrack,
  presentOrderFor,
  sampleChunkInit,
  sampleIndexForPresentationTime,
} from "./mp4Demux.ts";

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

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}
function i32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setInt32(0, n);
  return b;
}
function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n);
  return b;
}
function u64(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n);
  return b;
}
function i64(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigInt64(0, n);
  return b;
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
function box(type: string, ...children: Uint8Array[]): Uint8Array {
  const body = concat(...children);
  const head = new Uint8Array(8);
  new DataView(head.buffer).setUint32(0, 8 + body.length);
  for (let i = 0; i < 4; i++) head[4 + i] = type.charCodeAt(i);
  return concat(head, body);
}
function fullBox(
  type: string,
  version: number,
  ...children: Uint8Array[]
): Uint8Array {
  const vf = new Uint8Array(4);
  vf[0] = version;
  return box(type, vf, ...children);
}

interface FixtureOpts {
  cttsVersion: 0 | 1 | null;
  /** [count, offset] từng entry ctts. */
  cttsEntries: Array<[number, number]>;
  elstVersion: 0 | 1 | null;
  /** [segmentDuration, mediaTime] từng entry elst. */
  elstEntries: Array<[number, number]>;
}

function buildFile(o: FixtureOpts, stcoValue: number): Uint8Array {
  const avcC = box(
    "avcC",
    new Uint8Array([1, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0, 0]),
  );
  const avc1Fields = concat(
    new Uint8Array(6),
    u16(1),
    u16(0),
    new Uint8Array(2),
    new Uint8Array(12),
    u16(64),
    u16(64),
    u32(0x00480000),
    u32(0x00480000),
    u32(0),
    u16(1),
    new Uint8Array(32),
    u16(0x0018),
    u16(0xffff),
  );
  const avc1 = box("avc1", avc1Fields, avcC);
  const stsd = fullBox("stsd", 0, u32(1), avc1);
  const stts = fullBox("stts", 0, u32(1), u32(4), u32(100));
  let ctts: Uint8Array | null = null;
  if (o.cttsVersion !== null) {
    const entries = o.cttsEntries.map(([count, off]) =>
      o.cttsVersion === 1
        ? concat(u32(count), i32(off))
        : concat(u32(count), u32(off)),
    );
    ctts = fullBox("ctts", o.cttsVersion, u32(entries.length), ...entries);
  }
  const stss = fullBox("stss", 0, u32(1), u32(1));
  const stsz = fullBox(
    "stsz",
    0,
    u32(0),
    u32(4),
    u32(10),
    u32(10),
    u32(10),
    u32(10),
  );
  const stsc = fullBox("stsc", 0, u32(1), u32(1), u32(4), u32(1));
  const stco = fullBox("stco", 0, u32(1), u32(stcoValue));
  const stblChildren = [stsd, stts, stss, stsz, stsc, stco];
  if (ctts) stblChildren.splice(2, 0, ctts);
  const stbl = box("stbl", ...stblChildren);
  const mdhd = fullBox(
    "mdhd",
    0,
    u32(0),
    u32(0),
    u32(1000),
    u32(400),
    u16(0x55c4),
    u16(0),
  );
  const minf = box("minf", stbl);
  const mdia = box("mdia", mdhd, minf);
  const trakChildren = [mdia];
  if (o.elstVersion !== null) {
    const entries = o.elstEntries.map(([dur, mt]) =>
      o.elstVersion === 1
        ? concat(u64(BigInt(dur)), i64(BigInt(mt)), u16(1), u16(0))
        : concat(u32(dur), i32(mt), u16(1), u16(0)),
    );
    const elst = fullBox(
      "elst",
      o.elstVersion,
      u32(entries.length),
      ...entries,
    );
    trakChildren.unshift(box("edts", elst));
  }
  const trak = box("trak", ...trakChildren);
  const mvhd = fullBox(
    "mvhd",
    0,
    u32(0),
    u32(0),
    u32(1000),
    u32(400),
    u32(0x00010000),
  );
  const moov = box("moov", mvhd, trak);
  const ftyp = box(
    "ftyp",
    new Uint8Array([0x69, 0x73, 0x6f, 0x6d]),
    u32(0),
    new Uint8Array([0x69, 0x73, 0x6f, 0x6d]),
  );
  const mdat = box("mdat", new Uint8Array(40));
  return concat(ftyp, moov, mdat);
}

function build(o: FixtureOpts): ReturnType<typeof parseMp4VideoTrack> {
  // Hai lượt: lượt 1 đo độ dài để tính stco đúng, lượt 2 dùng stco đó
  // (độ dài box không đổi theo giá trị stco vì luôn 4 byte).
  const probe = buildFile(o, 0);
  const ftypLen = 8 + 4 + 4 + 4;
  const moovLen = probe.length - ftypLen - (8 + 40);
  const stcoValue = ftypLen + moovLen + 8;
  const bytes = buildFile(o, stcoValue);
  return parseMp4VideoTrack(
    bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ),
  );
}

const BFRAME: FixtureOpts = {
  cttsVersion: 1,
  cttsEntries: [
    [1, 0],
    [1, 200],
    [1, -100],
    [1, -100],
  ],
  elstVersion: 0,
  elstEntries: [
    [100, -1],
    [400, 100],
  ],
};

ok("ctts v1: presentation = decode + offset (có offset âm)", () => {
  const track = build(BFRAME);
  assert.deepEqual(
    track.samples.map((s) => s.presentationTimestamp),
    [0, 300, 100, 200],
  );
  assert.deepEqual(
    track.samples.map((s) => s.timestamp),
    [0, 100, 200, 300],
  );
});

ok("thứ tự present đúng: decode [0,1,2,3] -> present [0,2,3,1]", () => {
  const track = build(BFRAME);
  assert.deepEqual(presentOrderFor(track.samples), [0, 2, 3, 1]);
});

ok("sampleChunkInit dùng presentation timestamp (B-frame)", () => {
  const track = build(BFRAME);
  // timescale 1000: 300 units = 300000 µs; sample 1 là delta (không key).
  const init = sampleChunkInit(track, track.samples[1], new Uint8Array(10));
  assert.equal(init.timestamp, 300000);
  assert.equal(init.type, "delta");
  assert.equal(init.duration, 100000);
});

ok("elst v0: parse đủ entry rỗng + media, shift = media_time đầu", () => {
  const track = build(BFRAME);
  assert.equal(track.movieTimescale, 1000);
  assert.deepEqual(track.editList, [
    { segmentDuration: 100, mediaTime: -1 },
    { segmentDuration: 400, mediaTime: 100 },
  ]);
  assert.equal(editShiftUnits(track), 100);
});

ok("display time sau elst + sample trước edit bị đánh dấu", () => {
  const track = build(BFRAME);
  // presentation [0,300,100,200] - shift 100 = [-100,200,0,100].
  assert.deepEqual(
    track.samples.map((s) => displayTimestampUnits(track, s)),
    [-100, 200, 0, 100],
  );
  assert.equal(isBeforeEditStart(track, track.samples[0]), true);
  assert.equal(isBeforeEditStart(track, track.samples[2]), false);
});

ok("tra sample theo presentation/display time (dùng cho controller)", () => {
  const track = build(BFRAME);
  // display (giây): s0 -0.1, s2 0.0, s3 0.1, s1 0.2.
  assert.equal(sampleIndexForPresentationTime(track, 0.05), 2);
  assert.equal(sampleIndexForPresentationTime(track, 0.25), 1);
  assert.equal(sampleIndexForPresentationTime(track, -0.5), 0);
  assert.equal(sampleIndexForPresentationTime(track, 10), 1);
});

ok("không ctts/elst: presentation = decode, edit rỗng, shift null", () => {
  const track = build({
    cttsVersion: null,
    cttsEntries: [],
    elstVersion: null,
    elstEntries: [],
  });
  assert.deepEqual(
    track.samples.map((s) => s.presentationTimestamp),
    [0, 100, 200, 300],
  );
  assert.deepEqual(presentOrderFor(track.samples), [0, 1, 2, 3]);
  assert.deepEqual(track.editList, []);
  assert.equal(editShiftUnits(track), null);
  assert.equal(
    displayTimestampUnits(track, track.samples[1]),
    100,
  );
});

ok("ctts v0 (offset không dấu) + elst v1 đều parse được", () => {
  const track = build({
    cttsVersion: 0,
    cttsEntries: [
      [2, 50],
      [2, 0],
    ],
    elstVersion: 1,
    elstEntries: [[400, 100]],
  });
  assert.deepEqual(
    track.samples.map((s) => s.presentationTimestamp),
    [50, 150, 200, 300],
  );
  assert.deepEqual(presentOrderFor(track.samples), [0, 1, 2, 3]);
  assert.equal(editShiftUnits(track), 100);
  assert.equal(track.movieTimescale, 1000);
});

console.log(`mp4Demux34Q2: ${pass} test pass`);
