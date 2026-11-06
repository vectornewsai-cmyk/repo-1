/**
 * Phase 9 đợt 32, luồng P5 — Demux MP4 tối thiểu nhưng thật, chạy trong
 * browser (không phụ thuộc DOM, không phụ thuộc ffmpeg).
 *
 * Phạm vi cố tình hẹp, ghi rõ để không claim quá:
 * - Chỉ đọc 1 track video đầu tiên có codec avc1 (H.264) + box avcC.
 * - Chỉ hỗ trợ file "faststart" lẫn moov-cuối đều được (parse theo box,
 *   không giả định vị trí moov/mdat), chunk offset 32-bit (stco) và
 *   64-bit (co64); sample table: stts, stss (vắng = mọi sample đều là
 *   key theo spec), stsz (cỡ cố định lẫn bảng riêng), stsc, stco/co64.
 * - Đợt 34 Q2: ĐÃ hỗ trợ ctts + elst cho footage thật (xem dưới):
 *   ctts v0 (offset không dấu) và v1 (offset có dấu) -> mỗi sample có
 *   presentationTimestamp = decode timestamp + composition offset;
 *   sampleChunkInit dùng presentation timestamp (WebCodecs yêu cầu
 *   chunk theo thứ tự decode nhưng mang presentation timestamp để
 *   decoder tự reorder B-frame; file không có ctts thì presentation =
 *   decode nên số cũ không đổi). elst (edts/trak) được parse: edit rỗng
 *   (media_time = -1) và edit media đầu tiên cho ra editShiftUnits;
 *   displayTimestampUnits = presentation - shift (âm = sample nằm trước
 *   điểm bắt đầu edit, caller tự bỏ qua, không tự drop ở demux).
 * - VẪN KHÔNG hỗ trợ: nhiều track, avc3, HEVC, fragmented MP4
 *   (moof/mvex). File có presentation timestamp trùng nhau giữa các
 *   sample (không hợp lệ theo spec) sẽ làm ReverseFrameCache map
 *   nhầm — demux không tự sửa file lỗi.
 * - Dữ liệu sample MP4 đã là AVCC length-prefixed nên chunk data dùng
 *   trực tiếp, KHÔNG cần chuyển Annex B (khác spike O5 dùng .h264).
 *
 * Module này chỉ dùng cú pháp TypeScript erasable (type/interface) để
 * vừa chạy qua tsc vừa chạy qua Node type-stripping, phục vụ test.
 */

export interface Mp4Sample {
  index: number;
  /** Byte offset tuyệt đối của sample trong file (đầu mdat chunk). */
  offset: number;
  size: number;
  /** Decode timestamp, đơn vị timescale của track. */
  timestamp: number;
  duration: number;
  isKey: boolean;
  /**
   * Presentation timestamp, đơn vị timescale của track = decode
   * timestamp + composition offset từ ctts (không có ctts thì bằng
   * decode timestamp). Thứ tự present đúng của footage có B-frame là
   * thứ tự tăng dần của trường này, KHÔNG phải thứ tự index.
   */
  presentationTimestamp: number;
}

/** Một entry edit list (elst): segment_duration theo movie timescale. */
export interface Mp4Edit {
  /** Thời lượng đoạn theo movie timescale (chưa đổi sang media timescale). */
  segmentDuration: number;
  /** Thời điểm bắt đầu trong media timescale; -1 = edit rỗng (dwell). */
  mediaTime: number;
}

export interface Mp4VideoTrack {
  codec: string; // ví dụ "avc1.64001F"
  /** Nội dung box avcC (không gồm header box), dùng làm description. */
  description: Uint8Array;
  timescale: number;
  width: number;
  height: number;
  samples: Mp4Sample[];
  /** Tổng thời lượng theo stts, đơn vị timescale. */
  durationUnits: number;
  durationSec: number;
  /** Edit list từ edts/elst (rỗng = không có elst). */
  editList: Mp4Edit[];
  /** Timescale phim từ mvhd (null khi không parse được mvhd). */
  movieTimescale: number | null;
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

function readBoxes(
  view: DataView,
  start: number,
  end: number,
): Box[] {
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

/** Đọc avcC -> codec string "avc1.XXYYZZ" (hex hoa, theo byte SPS). */
export function avcCodecString(avcC: Uint8Array): string {
  if (avcC.length < 4) throw new Error("avcC quá ngắn");
  const hex = (n: number): string => n.toString(16).toUpperCase().padStart(2, "0");
  return `avc1.${hex(avcC[1])}${hex(avcC[2])}${hex(avcC[3])}`;
}

/**
 * Parse 1 file MP4 (ArrayBuffer hoàn chỉnh) -> track video H.264 đầu tiên.
 * Ném Error có message rõ ràng khi thiếu box bắt buộc — không trả track rỗng.
 */
export function parseMp4VideoTrack(buf: ArrayBuffer): Mp4VideoTrack {
  const view = new DataView(buf);
  const top = readBoxes(view, 0, buf.byteLength);
  const moov = findBox(top, "moov");
  if (!moov) throw new Error("không tìm thấy moov");
  const moovChildren = childBoxes(view, moov);
  // mvhd -> movie timescale (phục vụ elst: segment_duration theo đơn
  // vị này). Layout giống mdhd: v0 timescale ở +12, v1 ở +20.
  let movieTimescale: number | null = null;
  {
    const mvhd = findBox(moovChildren, "mvhd");
    if (mvhd && mvhd.dataSize >= 16) {
      const v = view.getUint8(mvhd.dataStart);
      movieTimescale = view.getUint32(mvhd.dataStart + (v === 1 ? 20 : 12));
    }
  }
  let chosen: Mp4VideoTrack | null = null;
  for (const trak of moovChildren.filter((b) => b.type === "trak")) {
    // edts/elst của trak này (nếu có). Parse trước khi chọn track để
    // track được chọn mang theo edit list của chính nó.
    const editList: Mp4Edit[] = [];
    {
      const trakChildren = childBoxes(view, trak);
      const edts = findBox(trakChildren, "edts");
      const elst = edts ? findBox(childBoxes(view, edts), "elst") : null;
      if (elst && elst.dataSize >= 8) {
        const version = view.getUint8(elst.dataStart);
        const count = view.getUint32(elst.dataStart + 4);
        for (let i = 0; i < count; i++) {
          if (version === 1) {
            const base = elst.dataStart + 8 + i * 20;
            if (base + 20 > elst.dataStart + elst.dataSize) break;
            editList.push({
              segmentDuration: Number(view.getBigUint64(base)),
              mediaTime: Number(view.getBigInt64(base + 8)),
            });
          } else {
            const base = elst.dataStart + 8 + i * 12;
            if (base + 12 > elst.dataStart + elst.dataSize) break;
            editList.push({
              segmentDuration: view.getUint32(base),
              mediaTime: view.getInt32(base + 4),
            });
          }
        }
      }
    }
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
    // stsd: entry đầu tiên phải là avc1.
    const entries = view.getUint32(stsd.dataStart + 4);
    if (entries < 1) continue;
    const entryStart = stsd.dataStart + 8;
    const entryType = String.fromCharCode(
      view.getUint8(entryStart + 4),
      view.getUint8(entryStart + 5),
      view.getUint8(entryStart + 6),
      view.getUint8(entryStart + 7),
    );
    if (entryType !== "avc1") continue;
    const width = view.getUint16(entryStart + 32);
    const height = view.getUint16(entryStart + 34);
    // VisualSampleEntry: 8 (size+type) + 6 reserved + 2 data_ref + 2
    // pre_defined + 2 reserved + 12 pre_defined + 2 width + 2 height +
    // 4 horizres + 4 vertres + 4 reserved + 2 frame_count +
    // 32 compressorname + 2 depth + 2 pre_defined = 86 byte rồi mới
    // tới các box con (avcC, ...).
    const entryBoxes = readBoxes(
      view,
      entryStart + 86,
      entryStart + view.getUint32(entryStart),
    );
    const avcC = findBox(entryBoxes, "avcC");
    if (!avcC) continue;
    const description = new Uint8Array(
      buf,
      avcC.dataStart,
      avcC.dataSize,
    );
    const codec = avcCodecString(description);

    // stts -> timestamp + duration từng sample.
    const sttsCount = view.getUint32(stts.dataStart + 4);
    const timestamps: number[] = [];
    const durations: number[] = [];
    let t = 0;
    for (let i = 0; i < sttsCount; i++) {
      const count = view.getUint32(stts.dataStart + 8 + i * 8);
      const delta = view.getUint32(stts.dataStart + 12 + i * 8);
      for (let k = 0; k < count; k++) {
        timestamps.push(t);
        durations.push(delta);
        t += delta;
      }
    }
    // stsz -> kích thước từng sample.
    const sampleSizeFixed = view.getUint32(stsz.dataStart + 4);
    const sampleCount = view.getUint32(stsz.dataStart + 8);
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
        `sample table lệch: stts=${timestamps.length} stsz=${sampleCount}`,
      );
    }
    // stss -> tập keyframe (vắng = tất cả là key).
    const stss = findBox(st, "stss");
    const keySet = new Set<number>();
    if (stss) {
      const n = view.getUint32(stss.dataStart + 4);
      for (let i = 0; i < n; i++) {
        keySet.add(view.getUint32(stss.dataStart + 8 + i * 4) - 1);
      }
    }
    // ctts -> composition offset từng sample (vắng = toàn 0). v0: offset
    // không dấu; v1: offset có dấu (B-frame thường âm ở sample sau).
    // Bảng thiếu/thừa so với sampleCount thì pad 0 / cắt bớt và ghi rõ
    // trong comment — file hợp lệ luôn khớp đúng.
    const cttsOffsets: number[] = [];
    {
      const ctts = findBox(st, "ctts");
      if (ctts && ctts.dataSize >= 8) {
        const version = view.getUint8(ctts.dataStart);
        const entryCount = view.getUint32(ctts.dataStart + 4);
        for (let i = 0; i < entryCount; i++) {
          const base = ctts.dataStart + 8 + i * 8;
          if (base + 8 > ctts.dataStart + ctts.dataSize) break;
          const count = view.getUint32(base);
          const offset =
            version === 1 ? view.getInt32(base + 4) : view.getUint32(base + 4);
          for (let k = 0; k < count; k++) cttsOffsets.push(offset);
        }
      }
      while (cttsOffsets.length < sampleCount) cttsOffsets.push(0);
      if (cttsOffsets.length > sampleCount) cttsOffsets.length = sampleCount;
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
    if (!chunkBox) continue; // đã chặn ở trên (!stco && !co64); giữ cho tsc
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
    const samples: Mp4Sample[] = [];
    let sampleIdx = 0;
    for (let ci = 0; ci < chunkCount; ci++) {
      const chunkNo = ci + 1;
      let perChunk = scEntries[0].samplesPerChunk;
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
          isKey: stss ? keySet.has(sampleIdx) : true,
          presentationTimestamp:
            timestamps[sampleIdx] + cttsOffsets[sampleIdx],
        });
        off += sizes[sampleIdx];
        sampleIdx++;
      }
    }
    if (samples.length !== sampleCount) {
      throw new Error(
        `dựng sample lệch: chunk cho ${samples.length}/${sampleCount}`,
      );
    }
    chosen = {
      codec,
      description,
      timescale,
      width,
      height,
      samples,
      durationUnits: t,
      durationSec: timescale > 0 ? t / timescale : 0,
      editList,
      movieTimescale,
    };
    break;
  }
  if (!chosen) throw new Error("không tìm thấy track video avc1 hợp lệ");
  return chosen;
}

/**
 * Khởi tạo chunk cho EncodedVideoChunk: timestamp/duration theo µs.
 * Timestamp là PRESENTATION timestamp (decode + ctts), không phải
 * decode timestamp: WebCodecs nhận chunk theo thứ tự decode nhưng
 * dùng timestamp này để reorder B-frame và output đúng thứ tự
 * present; decoder output mang timestamp này nên ReverseFrameCache
 * map output -> sample đúng cả khi có B-frame. File không ctts thì
 * presentation = decode nên hành vi cũ giữ nguyên.
 */
export function sampleChunkInit(
  track: Mp4VideoTrack,
  sample: Mp4Sample,
  data: Uint8Array,
): { type: "key" | "delta"; timestamp: number; duration: number; data: Uint8Array } {
  const toUs = (units: number): number =>
    track.timescale > 0 ? Math.round((units * 1_000_000) / track.timescale) : 0;
  return {
    type: sample.isKey ? "key" : "delta",
    timestamp: toUs(sample.presentationTimestamp),
    duration: toUs(sample.duration),
    data,
  };
}

/**
 * Shift media timescale do edit list: media_time của entry đầu tiên
 * không rỗng (media_time != -1). null = không có elst hoặc toàn edit
 * rỗng -> không shift. Segment_duration KHÔNG dùng ở đây (nó thuộc
 * movie timescale, chỉ có nghĩa khi map sang timeline phim).
 */
export function editShiftUnits(track: Mp4VideoTrack): number | null {
  for (const e of track.editList) {
    if (e.mediaTime !== -1) return e.mediaTime;
  }
  return null;
}

/** Display timestamp (media timescale) sau khi áp edit list. */
export function displayTimestampUnits(
  track: Mp4VideoTrack,
  sample: Mp4Sample,
): number {
  const shift = editShiftUnits(track);
  return sample.presentationTimestamp - (shift ?? 0);
}

/** true khi sample nằm trước điểm bắt đầu edit (display < 0). */
export function isBeforeEditStart(
  track: Mp4VideoTrack,
  sample: Mp4Sample,
): boolean {
  return displayTimestampUnits(track, sample) < 0;
}

/**
 * Thứ tự present: danh sách decode-index sắp theo presentation
 * timestamp tăng dần (hòa -> index tăng dần cho xác định). Phát ngược
 * duyệt danh sách này từ cuối về đầu.
 */
export function presentOrderFor(samples: Mp4Sample[]): number[] {
  return samples
    .map((s) => s.index)
    .sort((a, b) => {
      const pa = samples[a].presentationTimestamp;
      const pb = samples[b].presentationTimestamp;
      if (pa !== pb) return pa - pb;
      return a - b;
    });
}

/**
 * Decode-index của sample có presentation time lớn nhất mà vẫn <=
 * timeSec (theo display time sau elst). timeSec trước sample present
 * đầu tiên -> sample present đầu tiên; vượt cuối -> sample present
 * cuối cùng. Dùng cho controller nối preview: cùng một mốc thời gian
 * mà đường element-seek dùng thì cache tra ra cùng một frame.
 */
export function sampleIndexForPresentationTime(
  track: Mp4VideoTrack,
  timeSec: number,
): number {
  const order = presentOrderFor(track.samples);
  if (order.length === 0) return -1;
  const toSec = (units: number): number =>
    track.timescale > 0 ? units / track.timescale : 0;
  let best = order[0];
  for (const idx of order) {
    const d = toSec(displayTimestampUnits(track, track.samples[idx]));
    if (d <= timeSec) best = idx;
    else break;
  }
  return best;
}

/** Keyframe <= index (dùng cho GOP-align khi decode-ahead). */
export function gopStartFor(samples: Mp4Sample[], index: number): number {
  let start = 0;
  for (let i = Math.min(index, samples.length - 1); i >= 0; i--) {
    if (samples[i].isKey) {
      start = i;
      break;
    }
  }
  return start;
}

/**
 * Cửa sổ decode cho phát ngược: đang ở frame `playheadIndex`, muốn giữ
 * `windowSize` frame trong cache (kể cả frame hiện tại). Trả về đoạn
 * decode đã align về đầu GOP (decodeFrom) và đoạn present (presentFrom..
 * presentTo, presentTo = playheadIndex). Decode đoạn [decodeFrom,
 * presentTo] rồi present ngược từ presentTo về presentFrom.
 */
export function reverseWindowFor(
  samples: Mp4Sample[],
  playheadIndex: number,
  windowSize: number,
): { decodeFrom: number; presentFrom: number; presentTo: number } {
  const presentTo = Math.max(
    0,
    Math.min(playheadIndex, samples.length - 1),
  );
  const presentFrom = Math.max(0, presentTo - windowSize + 1);
  return {
    decodeFrom: gopStartFor(samples, presentFrom),
    presentFrom,
    presentTo,
  };
}

/** Byte lý thuyết của 1 frame NV12 (dùng ước bộ nhớ cache, không phải đo). */
export function nv12BytesPerFrame(width: number, height: number): number {
  return Math.floor((width * height * 3) / 2);
}
