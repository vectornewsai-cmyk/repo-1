// mp4AudioDemux.ts — Đợt 198 P3: demux MP4 tối thiểu cho TRACK AUDIO
// (mp4a/AAC), chạy trong browser + Node (không phụ thuộc DOM, không
// phụ thuộc ffmpeg). Dùng cho decode TỪNG PHẦN cửa sổ đảo (N11b):
// chỉ cần bảng sample của track audio để lấy đúng các frame AAC của
// 30 s cần phát, thay vì decodeAudioData toàn file 300 s.
//
// Phạm vi cố tình hẹp, ghi rõ để không claim quá:
// - Chỉ đọc track audio ĐẦU TIÊN có codec mp4a + box esds (AAC).
// - Chỉ hỗ trợ file không phân mảnh (moov đầy đủ, không moof/mvex);
//   chunk offset 32-bit (stco) và 64-bit (co64); sample table: stts,
//   stsz, stsc, stco/co64. Không dùng ctts (audio không có B-frame:
//   presentation = decode). Không parse elst (encoder delay/priming
//   của AAC được đo + xử lý ở tầng decode, xem reverseAudioPartial).
// - esds: chỉ lấy AudioSpecificConfig (DecoderSpecificInfo, tag 0x05)
//   + objectTypeIndication để dựng codec string "mp4a.40.2".
// - File lạ (không có moov / không có track mp4a / bảng lệch) thì NÉM
//   Error rõ ràng — caller (reverseAudioPartial) bắt và rơi về đường
//   decode toàn file cũ, không bao giờ làm hỏng preview.
// - Trần MAX_MP4_AUDIO_SAMPLES (dùng chung hằng từ mp4Demux) chặn moov chế
//   tác khai khống stts/stsz như video demux (đợt 52 I6).
//
// Module thuần, cú pháp TypeScript erasable (type/interface) để vừa
// chạy qua tsc vừa chạy qua Node type-stripping, phục vụ test.

/**
 * Trần số sample một track audio được parse — cùng giá trị + lý do với
 * MAX_MP4_AUDIO_SAMPLES trong mp4Demux.ts (đợt 52 I6: 1.000.000 ≈ 9,3 giờ ở
 * 30 fps / 4,6 giờ ở 60 fps — vượt xa mọi footage thật; chặn moov chế
 * tác khai khống stts/stsz gây OOM). Định nghĩa RIÊNG ở đây thay vì
 * import từ mp4Demux.ts: file đó chứa parameter property trong
 * constructor (SpsBitReader) mà Node type-stripping (v24.22.1) không
 * chạy được — import nó sẽ làm test module này không chạy được bằng
 * `node --experimental-strip-types` (kiểm chứng: mp4Demux34Q2.test.ts
 * hiện cũng lỗi ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX trên Node này).
 */
export const MAX_MP4_AUDIO_SAMPLES = 1_000_000;

export interface Mp4AudioSample {
  index: number;
  /** Byte offset tuyệt đối của sample trong file (đầu mdat chunk). */
  offset: number;
  size: number;
  /** Decode timestamp (= presentation, audio không có B-frame), đơn vị timescale của track. */
  timestamp: number;
  duration: number;
}

export interface Mp4AudioTrack {
  /** Codec string cho WebCodecs, vd "mp4a.40.2" (AAC LC). */
  codec: string;
  /** AudioSpecificConfig (nội dung DecoderSpecificInfo trong esds),
   *  dùng làm `description` cho AudioDecoder. */
  description: Uint8Array;
  timescale: number;
  sampleRate: number;
  channels: number;
  samples: Mp4AudioSample[];
  /** Tổng thời lượng theo stts, đơn vị timescale. */
  durationUnits: number;
  durationSec: number;
}

interface Box {
  type: string;
  /** Offset của phần data (sau header) trong buffer. */
  dataStart: number;
  /** Kích thước phần data. */
  dataSize: number;
  /** Offset bắt đầu box (gồm header). */
  start: number;
  /** Kích thước toàn box. */
  size: number;
}

function readBoxes(view: DataView, start: number, end: number): Box[] {
  const boxes: Box[] = [];
  let off = start;
  while (off + 8 <= end) {
    let size = view.getUint32(off);
    const type = String.fromCharCode(
      view.getUint8(off + 4),
      view.getUint8(off + 5),
      view.getUint8(off + 6),
      view.getUint8(off + 7),
    );
    let header = 8;
    if (size === 1) {
      if (off + 16 > end) break;
      size = Number(view.getBigUint64(off + 8));
      header = 16;
    } else if (size === 0) {
      size = end - off;
    }
    if (size < header || off + size > end) break;
    boxes.push({
      type,
      dataStart: off + header,
      dataSize: size - header,
      start: off,
      size,
    });
    off += size;
  }
  return boxes;
}

function findBox(boxes: Box[], type: string): Box | null {
  for (const b of boxes) if (b.type === type) return b;
  return null;
}

function childBoxes(view: DataView, box: Box): Box[] {
  return readBoxes(view, box.dataStart, box.dataStart + box.dataSize);
}

/**
 * Đọc độ dài descriptor kiểu MP4 (7 bit/byte, bit cao = còn tiếp):
 * trả [giá trị, số byte đã đọc]. Hết dữ liệu thì null.
 */
function readDescriptorLength(
  bytes: Uint8Array,
  off: number,
): [number, number] | null {
  let len = 0;
  let n = 0;
  while (off + n < bytes.length && n < 4) {
    const b = bytes[off + n];
    n++;
    len = (len << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) return [len, n];
  }
  return null;
}

/**
 * Parse box esds -> { audioSpecificConfig, objectTypeIndication }.
 * Layout: version/flags (4) rồi ES_Descriptor (tag 0x03): ES_ID (2) +
 * flags (1) rồi DecoderConfigDescriptor (tag 0x04): objectType (1) +
 * streamType (1) + bufferSizeDB (3) + maxBitrate (4) + avgBitrate (4)
 * rồi DecoderSpecificInfo (tag 0x05): ASC bytes.
 * Ném khi cấu trúc không đọc được (caller fallback).
 */
export function parseEsds(
  esds: Uint8Array,
): { audioSpecificConfig: Uint8Array; objectTypeIndication: number } {
  if (esds.length < 4) throw new Error("esds quá ngắn");
  let off = 4; // bỏ version/flags
  // ES_Descriptor tag 0x03 (có thể có tag khác chen trước — quét tới 0x03).
  while (off < esds.length && esds[off] !== 0x03) off++;
  if (off >= esds.length) throw new Error("esds: không có ES_Descriptor");
  off++;
  const esLen = readDescriptorLength(esds, off);
  if (!esLen) throw new Error("esds: độ dài ES_Descriptor hỏng");
  off += esLen[1]; // chỉ bỏ qua byte độ dài, KHÔNG bỏ qua nội dung
  if (off + 3 > esds.length) throw new Error("esds: ES_Descriptor ngắn");
  off += 3; // ES_ID (2) + flags (1)
  if (off >= esds.length || esds[off] !== 0x04) {
    throw new Error("esds: không có DecoderConfigDescriptor");
  }
  off++;
  const dcLen = readDescriptorLength(esds, off);
  if (!dcLen) throw new Error("esds: độ dài DecoderConfigDescriptor hỏng");
  const dcStart = off + dcLen[1]; // đầu nội dung DecoderConfig (sau byte độ dài)
  if (dcStart + 13 > esds.length) {
    throw new Error("esds: DecoderConfigDescriptor ngắn");
  }
  const objectTypeIndication = esds[dcStart];
  // Sau 13 byte cố định (1+1+3+4+4) là DecoderSpecificInfo (tag 0x05).
  let p = dcStart + 13;
  while (p < esds.length && esds[p] !== 0x05) p++;
  if (p >= esds.length) throw new Error("esds: không có DecoderSpecificInfo");
  p++;
  const dsiLen = readDescriptorLength(esds, p);
  if (!dsiLen) throw new Error("esds: độ dài DecoderSpecificInfo hỏng");
  // dsiLen = [giá trị độ dài (= độ dài ASC), số byte đã đọc]: bỏ qua
  // byte độ dài (dsiLen[1]), ASC dài dsiLen[0] byte (không nhầm 2 số
  // này — file thật dùng varint 4 byte nên giá trị ≠ số byte đọc).
  p += dsiLen[1];
  if (p + dsiLen[0] > esds.length || dsiLen[0] <= 0) {
    throw new Error("esds: AudioSpecificConfig ngắn");
  }
  return {
    audioSpecificConfig: esds.subarray(p, p + dsiLen[0]),
    objectTypeIndication,
  };
}

/** audioObjectType = 5 bit đầu của ASC (2 = AAC LC). */
export function aacAudioObjectType(asc: Uint8Array): number {
  if (asc.length < 1) throw new Error("ASC rỗng");
  return asc[0] >> 3;
}

/**
 * Parse 1 file MP4 (ArrayBuffer hoàn chỉnh) -> track audio mp4a đầu tiên.
 * Ném Error có message rõ ràng khi thiếu box bắt buộc — không trả track rỗng.
 */
export function parseMp4AudioTrack(buf: ArrayBuffer): Mp4AudioTrack {
  const view = new DataView(buf);
  const top = readBoxes(view, 0, buf.byteLength);
  const moov = findBox(top, "moov");
  if (!moov) throw new Error("không tìm thấy moov");
  const moovChildren = childBoxes(view, moov);
  for (const trak of moovChildren.filter((b) => b.type === "trak")) {
    const mdia = findBox(childBoxes(view, trak), "mdia");
    if (!mdia) continue;
    const mdiaChildren = childBoxes(view, mdia);
    const mdhd = findBox(mdiaChildren, "mdhd");
    const minf = findBox(mdiaChildren, "minf");
    if (!mdhd || !minf) continue;
    const version = view.getUint8(mdhd.dataStart);
    const timescale = view.getUint32(
      mdhd.dataStart + (version === 1 ? 20 : 12),
    );
    if (!(timescale > 0)) continue;
    const stbl = findBox(childBoxes(view, minf), "stbl");
    if (!stbl) continue;
    const st = childBoxes(view, stbl);
    const stsd = findBox(st, "stsd");
    const stts = findBox(st, "stts");
    const stsz = findBox(st, "stsz");
    const stsc = findBox(st, "stsc");
    const stco = findBox(st, "stco");
    const co64 = findBox(st, "co64");
    if (!stsd || !stts || !stsz || !stsc || (!stco && !co64)) continue;
    // stsd: entry đầu tiên phải là mp4a.
    const entries = view.getUint32(stsd.dataStart + 4);
    if (entries < 1) continue;
    const entryStart = stsd.dataStart + 8;
    const entryType = String.fromCharCode(
      view.getUint8(entryStart + 4),
      view.getUint8(entryStart + 5),
      view.getUint8(entryStart + 6),
      view.getUint8(entryStart + 7),
    );
    if (entryType !== "mp4a") continue;
    // AudioSampleEntry: 8 (size+type) + 6 reserved + 2 data_ref +
    // 8 reserved (version/revision/vendor) + 2 channels + 2 sampleSize
    // + 2 pre_defined + 2 reserved + 4 sampleRate (16.16 fixed).
    const channels = view.getUint16(entryStart + 24);
    // SampleRate là fixed 16.16: dùng >>> (không dấu) — >> (có dấu)
    // biến 48000<<16 thành số âm (48000×65536 > 2^31).
    const sampleRate = view.getUint32(entryStart + 32) >>> 16;
    if (!(channels > 0) || !(sampleRate > 0)) continue;
    const entryBoxes = readBoxes(
      view,
      entryStart + 36,
      entryStart + view.getUint32(entryStart),
    );
    const esds = findBox(entryBoxes, "esds");
    if (!esds) continue;
    const esdsBytes = new Uint8Array(
      buf,
      esds.dataStart,
      esds.dataSize,
    );
    let asc: Uint8Array;
    let objectType: number;
    try {
      const parsed = parseEsds(esdsBytes);
      asc = parsed.audioSpecificConfig;
      objectType = parsed.objectTypeIndication;
    } catch {
      continue;
    }
    const codec = `mp4a.${objectType.toString(16)}.${aacAudioObjectType(asc)}`;
    // stts -> timestamp + duration từng sample (chặn bom như video demux).
    const sttsCount = view.getUint32(stts.dataStart + 4);
    const timestamps: number[] = [];
    const durations: number[] = [];
    let t = 0;
    let sttsTotal = 0;
    for (let i = 0; i < sttsCount; i++) {
      const count = view.getUint32(stts.dataStart + 8 + i * 8);
      const delta = view.getUint32(stts.dataStart + 12 + i * 8);
      sttsTotal += count;
      if (sttsTotal > MAX_MP4_AUDIO_SAMPLES) {
        throw new Error(
          `stts audio: tổng số sample ${sttsTotal} vượt giới hạn ${MAX_MP4_AUDIO_SAMPLES} (moov chế tác?)`,
        );
      }
      for (let k = 0; k < count; k++) {
        timestamps.push(t);
        durations.push(delta);
        t += delta;
      }
    }
    // stsz -> kích thước từng sample.
    const sampleSizeFixed = view.getUint32(stsz.dataStart + 4);
    const sampleCount = view.getUint32(stsz.dataStart + 8);
    if (sampleCount > MAX_MP4_AUDIO_SAMPLES) {
      throw new Error(
        `stsz audio: số sample ${sampleCount} vượt giới hạn ${MAX_MP4_AUDIO_SAMPLES} (moov chế tác?)`,
      );
    }
    const sizes: number[] = [];
    if (sampleSizeFixed !== 0) {
      for (let i = 0; i < sampleCount; i++) sizes.push(sampleSizeFixed);
    } else {
      for (let i = 0; i < sampleCount; i++) {
        sizes.push(view.getUint32(stsz.dataStart + 12 + i * 4));
      }
    }
    if (timestamps.length !== sampleCount || sizes.length !== sampleCount) {
      throw new Error(
        `sample table audio lệch: stts=${timestamps.length} stsz=${sampleCount}`,
      );
    }
    // stsc + stco/co64 -> offset từng sample.
    const stscCount = view.getUint32(stsc.dataStart + 4);
    const scEntries: { firstChunk: number; samplesPerChunk: number }[] = [];
    for (let i = 0; i < stscCount; i++) {
      scEntries.push({
        firstChunk: view.getUint32(stsc.dataStart + 8 + i * 12),
        samplesPerChunk: view.getUint32(stsc.dataStart + 12 + i * 12),
      });
    }
    const chunkBox = co64 ?? stco;
    if (!chunkBox) continue;
    const is64 = chunkBox === co64;
    const chunkCount = view.getUint32(chunkBox.dataStart + 4);
    const chunkOffsets: number[] = [];
    for (let i = 0; i < chunkCount; i++) {
      chunkOffsets.push(
        is64
          ? Number(view.getBigUint64(chunkBox.dataStart + 8 + i * 8))
          : view.getUint32(chunkBox.dataStart + 8 + i * 4),
      );
    }
    const samples: Mp4AudioSample[] = [];
    let sampleIdx = 0;
    for (let ci = 0; ci < chunkCount; ci++) {
      const chunkNo = ci + 1;
      let perChunk = scEntries[0]?.samplesPerChunk ?? 0;
      for (const e of scEntries) {
        if (e.firstChunk <= chunkNo) perChunk = e.samplesPerChunk;
        else break;
      }
      let off = chunkOffsets[ci];
      for (let k = 0; k < perChunk && sampleIdx < sampleCount; k++) {
        samples.push({
          index: sampleIdx,
          offset: off,
          size: sizes[sampleIdx],
          timestamp: timestamps[sampleIdx],
          duration: durations[sampleIdx],
        });
        off += sizes[sampleIdx];
        sampleIdx++;
      }
    }
    if (samples.length !== sampleCount) {
      throw new Error(
        `dựng sample audio lệch: chunk cho ${samples.length}/${sampleCount}`,
      );
    }
    return {
      codec,
      description: asc,
      timescale,
      sampleRate,
      channels,
      samples,
      durationUnits: t,
      durationSec: timescale > 0 ? t / timescale : 0,
    };
  }
  throw new Error("không tìm thấy track audio mp4a hợp lệ");
}

/**
 * Các sample audio phủ cửa sổ [windowStartSec, windowStartSec +
 * windowSec] (theo thời gian nguồn): sample được chọn khi khoảng
 * [timestamp, timestamp+duration) của nó giao với cửa sổ. Trả về
 * đoạn sample liên tục [firstIndex, lastIndex] + mốc thời gian thật
 * mà PCM decode được phủ (làm tròn theo biên frame AAC 1024 mẫu —
 * xem reverseAudioPartial: player cắt lại đúng biên cửa sổ).
 * null khi cửa sổ ngoài file / windowSec <= 0.
 */
export function audioSamplesForWindow(
  track: Mp4AudioTrack,
  windowStartSec: number,
  windowSec: number,
): {
  firstIndex: number;
  lastIndex: number;
  /** Thời gian bắt đầu của sample đầu (giây) — có thể < windowStartSec do làm tròn frame. */
  coverStartSec: number;
  /** Thời gian kết thúc của sample cuối (giây) — có thể > windowEndSec do làm tròn frame. */
  coverEndSec: number;
} | null {
  if (!(windowSec > 0) || !(track.timescale > 0)) return null;
  const wStartU = Math.floor(windowStartSec * track.timescale);
  const wEndU = Math.ceil((windowStartSec + windowSec) * track.timescale);
  let first = -1;
  let last = -1;
  for (const s of track.samples) {
    if (s.timestamp + s.duration > wStartU && s.timestamp < wEndU) {
      if (first < 0) first = s.index;
      last = s.index;
    } else if (first >= 0 && s.timestamp >= wEndU) {
      break;
    }
  }
  if (first < 0) return null;
  return {
    firstIndex: first,
    lastIndex: last,
    coverStartSec: track.samples[first].timestamp / track.timescale,
    coverEndSec:
      (track.samples[last].timestamp + track.samples[last].duration) /
      track.timescale,
  };
}

/** Khởi tạo chunk cho EncodedAudioChunk: timestamp/duration theo µs. */
export function audioChunkInit(
  track: Mp4AudioTrack,
  sample: Mp4AudioSample,
  data: Uint8Array,
): { type: "key"; timestamp: number; duration: number; data: Uint8Array } {
  const toUs = (units: number): number =>
    track.timescale > 0 ? Math.round((units * 1_000_000) / track.timescale) : 0;
  return {
    type: "key",
    timestamp: toUs(sample.timestamp),
    duration: toUs(sample.duration),
    data,
  };
}
