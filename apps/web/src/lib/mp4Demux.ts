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

/**
 * Đợt 52 I6 — trần số sample một track video được parse (1.000.000 ≈
 * 9,3 giờ ở 30 fps / 4,6 giờ ở 60 fps — vượt xa mọi footage thật mà
 * editor này xử lý; fixture encode thật lớn nhất hiện tại chỉ 2.160
 * sample). Moov chế tác khai stts/stsz/ctts count = 0xFFFFFFFF sẽ ép
 * demux push hàng tỉ số vào mảng trước khi kiểm tra khớp bảng (đo
 * thật: OOM ở heap 256 MiB trong ~10 s, xem
 * docs/PHASE9_ROUND52_I6_GOP_LONG_SESSION_LIMITS.md §2). Trần này
 * chặn bom đó ngay trước vòng push; file thật không đổi hành vi.
 */
export const MAX_MP4_SAMPLES = 1_000_000;

/**
 * Đợt 61 R6 — lookup i18n tùy chọn (mẫu Q4: file này được test bằng Node
 * nên KHÔNG import `../i18n` trực tiếp). Khi `lookup` vắng → fallback
 * đúng từng chữ chuỗi VI cũ nên test cũ + hành vi mặc định không đổi.
 * Key trong fragment R6 (`gop.demux.parser*`, `gop.demux.avcc*`,
 * `gop.demux.layout*`, `gop.demux.stts*`, `gop.demux.duration*`,
 * `gop.demux.fpsVuiMismatch`).
 */
export type I18nLookup = (key: string, vars?: Record<string, string>) => string;
function trKey(
  lookup: I18nLookup | undefined,
  key: string,
  vars: Record<string, string>,
  fallback: string,
): string {
  if (!lookup) return fallback;
  const out = lookup(key, vars);
  return out === key ? fallback : out;
}

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
  /**
   * Đợt 54 K8 — nhất quán bảng sample, phục vụ lớp chặn moov giả ở T3
   * (không ném ở demux — T3 quyết định fallback full-file, file lạ
   * vẫn phát được, chỉ chậm hơn):
   * - `cttsTotal`: tổng số sample mà các entry ctts khai (null khi
   *   không có box ctts). File hợp lệ luôn bằng đúng sampleCount.
   * - `stssOutOfRange`: số entry stss nằm ngoài [1, sampleCount].
   *   File hợp lệ luôn bằng 0.
   * Đợt 56 M10 — thời lượng khai trong mdhd/mvhd, phục vụ lớp kiểm
   * timestamp stts ở T3 (`validateSampleTimestamps`): file hợp lệ luôn
   * có mdhd duration == tổng stts, mvhd duration ≈ thời lượng video.
   * null = không đọc được (box vắng/quá ngắn) → lớp kiểm bỏ qua phần
   * đó (fail-open), không chặn oan.
   */
  cttsTotal?: number | null;
  stssOutOfRange?: number;
  /** Thời lượng track theo mdhd (đơn vị timescale của track). */
  mdhdDuration?: number | null;
  /** Thời lượng phim theo mvhd (đơn vị movieTimescale). */
  mvhdDuration?: number | null;
  /**
   * Đợt 57 N6 — fps suy từ VUI timing trong SPS (avcC): time_scale /
   * (2 × num_units_in_tick). Nguồn thời gian độc lập thứ ba để đối
   * chiếu với stts trong `validateSampleTimestamps` (bắt moov giả đổi
   * tỉ lệ đều toàn bộ stts + sửa khớp cả mdhd lẫn mvhd — nợ M10 §4).
   * null = SPS không có VUI timing (vui_parameters_present_flag = 0,
   * timing_info_present_flag = 0, SPS parse lỗi, hoặc fps ngoài miền
   * hợp lý) → lớp kiểm bỏ qua phần này (fail-open), không chặn oan.
   */
  spsVuiFps?: number | null;
  /** fixed_frame_rate_flag trong VUI timing (null khi không có VUI). */
  spsVuiFixedFrameRate?: boolean | null;
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
export function avcCodecString(avcC: Uint8Array, lookup?: I18nLookup): string {
  if (avcC.length < 4) {
    throw new Error(trKey(lookup, "gop.demux.parserAvccTooShort", {}, "avcC quá ngắn"));
  }
  const hex = (n: number): string => n.toString(16).toUpperCase().padStart(2, "0");
  return `avc1.${hex(avcC[1])}${hex(avcC[2])}${hex(avcC[3])}`;
}

/**
 * Đợt 57 N6 — timing VUI trong SPS (H.264, ISO/IEC 14496-10 §7.3.2.1
 * + Annex E). Nguồn thời gian độc lập thứ ba để đối chiếu với stts:
 * encoder ghi fps danh định vào SPS khi encode, kẻ giả chỉ sửa số
 * stts/mdhd/mvhd trong moov sẽ không khớp với số này (trừ khi hắn
 * viết lại cả SPS — xem LIMITS N6 §5 về giới hạn đó).
 *
 * fps = time_scale / (2 × num_units_in_tick): một frame = 2 clock
 * tick (2 field), bất kể progressive hay interlaced. Vd encoder
 * 30 fps thường ghi time_scale=60, num_units_in_tick=1 → 30;
 * 29,97 fps ghi 60000/1001 → 29,97.
 *
 * Hàm thuần, chạy được ở Node, KHÔNG ném lỗi: mọi trường hợp không
 * đọc được (avcC ngắn, SPS vắng, VUI vắng, timing vắng, hết bit giữa
 * chừng, giá trị vô lý) đều trả null → caller fail-open.
 */
export interface SpsVuiTiming {
  /** fps danh định từ VUI: time_scale / (2 × num_units_in_tick). */
  fps: number;
  fixedFrameRate: boolean;
  numUnitsInTick: number;
  timeScale: number;
}

/** Dung sai so sánh fps-stts với fps-VUI (hiệu chuẩn ở LIMITS N6 §2). */
export const SPS_VUI_FPS_TOLERANCE = 0.02;

/** Đọc bit MSB-first trên RBSP (đã gỡ emulation-prevention). */
class SpsBitReader {
  private pos = 0;
  constructor(private readonly bytes: Uint8Array) {}
  /** Đọc 1 bit; hết dữ liệu thì trả null (không ném). */
  bit(): number | null {
    const bytePos = this.pos >> 3;
    if (bytePos >= this.bytes.length) return null;
    const b = (this.bytes[bytePos] >> (7 - (this.pos & 7))) & 1;
    this.pos++;
    return b;
  }
  /** Đọc n bit không dấu (n ≤ 32); hết dữ liệu thì null. */
  bits(n: number): number | null {
    let v = 0;
    for (let i = 0; i < n; i++) {
      const b = this.bit();
      if (b === null) return null;
      v = (v << 1) | b;
    }
    return v >>> 0;
  }
  /** Unsigned Exp-Golomb ue(v); hết dữ liệu / quá dài thì null. */
  ue(): number | null {
    let zeros = 0;
    for (;;) {
      const b = this.bit();
      if (b === null) return null;
      if (b === 1) break;
      zeros++;
      if (zeros > 31) return null;
    }
    if (zeros === 0) return 0;
    const rest = this.bits(zeros);
    if (rest === null) return null;
    return (1 << zeros) - 1 + rest;
  }
  /** Signed Exp-Golomb se(v): 1→0, 2→1, 3→-1, 4→2, 5→-2, … */
  se(): number | null {
    const codeNum = this.ue();
    if (codeNum === null) return null;
    return codeNum % 2 === 0 ? -(codeNum / 2) : (codeNum + 1) / 2;
  }
}

/** Lấy SPS đầu tiên trong avcC (bỏ byte NAL header 0x67). null khi thiếu. */
function extractFirstSpsRbsp(avcC: Uint8Array): Uint8Array | null {
  // avcC: [0]=version [1]=profile [2]=compat [3]=level
  // [4]=lengthSizeMinusOne [5]=0xE0|numSPS [6..7]=độ dài SPS [8..]=SPS.
  if (avcC.length < 8) return null;
  if ((avcC[5] & 0x1f) < 1) return null;
  const len = (avcC[6] << 8) | avcC[7];
  if (len < 2 || 8 + len > avcC.length) return null;
  const nal = avcC.subarray(8, 8 + len);
  if ((nal[0] & 0x1f) !== 7) return null; // nal_unit_type 7 = SPS
  // Gỡ emulation-prevention byte (0x000003 → 0x0000) sau NAL header.
  const rbsp = new Uint8Array(len - 1);
  let w = 0;
  let zeros = 0;
  for (let i = 1; i < nal.length; i++) {
    const b = nal[i];
    if (zeros >= 2 && b === 0x03) {
      // Byte 0x03 chèn sau 0x0000: bỏ qua, reset đếm số 0.
      zeros = 0;
      continue;
    }
    rbsp[w++] = b;
    zeros = b === 0 ? zeros + 1 : 0;
  }
  return rbsp.subarray(0, w);
}

export function parseSpsVuiTiming(avcC: Uint8Array): SpsVuiTiming | null {
  const rbsp = extractFirstSpsRbsp(avcC);
  if (rbsp === null) return null;
  const r = new SpsBitReader(rbsp);
  const need = (v: number | null): v is number => v !== null;
  const profileIdc = r.bits(8);
  if (!need(profileIdc)) return null;
  if (r.bits(8) === null) return null; // constraint flags + reserved
  if (r.bits(8) === null) return null; // level_idc
  if (r.ue() === null) return null; // seq_parameter_set_id
  // Profile "cao" có thêm chroma_format / bit-depth / scaling matrix
  // (ISO 14496-10 §7.3.2.1.1): phải bỏ qua đúng số bit mới tới được VUI.
  if (
    profileIdc === 100 || profileIdc === 110 || profileIdc === 122 ||
    profileIdc === 244 || profileIdc === 44 || profileIdc === 83 ||
    profileIdc === 86 || profileIdc === 118 || profileIdc === 128 ||
    profileIdc === 138 || profileIdc === 139 || profileIdc === 134 ||
    profileIdc === 135
  ) {
    const chromaFormatIdc = r.ue();
    if (!need(chromaFormatIdc)) return null;
    if (chromaFormatIdc === 3) {
      if (r.bit() === null) return null; // separate_colour_plane_flag
    }
    if (r.ue() === null) return null; // bit_depth_luma_minus8
    if (r.ue() === null) return null; // bit_depth_chroma_minus8
    if (r.bit() === null) return null; // qpprime_y_zero_transform_bypass_flag
    const scalingMatrixPresent = r.bit();
    if (scalingMatrixPresent === null) return null;
    if (scalingMatrixPresent === 1) {
      const count = chromaFormatIdc !== 3 ? 8 : 12;
      for (let i = 0; i < count; i++) {
        const present = r.bit();
        if (present === null) return null;
        if (present === 1) {
          // Bỏ qua scaling list: size 16 (i<6) hoặc 64; nextScale bắt
          // đầu 8, mỗi phần tử delta_scale se(v) (xem §7.3.2.1.1).
          const size = i < 6 ? 16 : 64;
          let lastScale = 8;
          let nextScale = 8;
          for (let j = 0; j < size; j++) {
            if (nextScale !== 0) {
              const delta = r.se();
              if (!need(delta)) return null;
              nextScale = (lastScale + delta + 256) % 256;
            }
            lastScale = nextScale === 0 ? lastScale : nextScale;
          }
        }
      }
    }
  }
  if (r.ue() === null) return null; // log2_max_frame_num_minus4
  const pocType = r.ue();
  if (!need(pocType)) return null; // pic_order_cnt_type
  if (pocType === 0) {
    if (r.ue() === null) return null; // log2_max_pic_order_cnt_lsb_minus4
  } else if (pocType === 1) {
    if (r.bit() === null) return null; // delta_pic_order_always_zero_flag
    if (r.se() === null) return null; // offset_for_non_ref_pic
    if (r.se() === null) return null; // offset_for_top_to_bottom_field
    const cycles = r.ue();
    if (!need(cycles)) return null; // num_ref_frames_in_pic_order_cnt_cycle
    for (let i = 0; i < cycles; i++) {
      if (r.se() === null) return null; // offset_for_ref_frame[i]
    }
  } else if (pocType !== 2) {
    return null; // pic_order_cnt_type lạ — không đoán tiếp
  }
  if (r.ue() === null) return null; // max_num_ref_frames
  if (r.bit() === null) return null; // gaps_in_frame_num_value_allowed_flag
  if (r.ue() === null) return null; // pic_width_in_mbs_minus1
  if (r.ue() === null) return null; // pic_height_in_map_units_minus1
  const frameMbsOnly = r.bit();
  if (frameMbsOnly === null) return null; // frame_mbs_only_flag
  if (frameMbsOnly === 0) {
    if (r.bit() === null) return null; // mb_adaptive_frame_field_flag
  }
  if (r.bit() === null) return null; // direct_8x8_inference_flag
  const cropping = r.bit();
  if (cropping === null) return null; // frame_cropping_flag
  if (cropping === 1) {
    for (let i = 0; i < 4; i++) if (r.ue() === null) return null;
  }
  const vuiPresent = r.bit();
  if (vuiPresent === null || vuiPresent === 0) return null;
  // VUI (Annex E): bỏ qua tới timing_info_present_flag.
  const aspectPresent = r.bit();
  if (aspectPresent === null) return null;
  if (aspectPresent === 1) {
    const aspectIdc = r.bits(8);
    if (!need(aspectIdc)) return null;
    if (aspectIdc === 255) {
      if (r.bits(16) === null) return null; // sar_width
      if (r.bits(16) === null) return null; // sar_height
    }
  }
  const overscanPresent = r.bit();
  if (overscanPresent === null) return null;
  if (overscanPresent === 1) {
    if (r.bit() === null) return null; // overscan_appropriate_flag
  }
  const videoSignalPresent = r.bit();
  if (videoSignalPresent === null) return null;
  if (videoSignalPresent === 1) {
    if (r.bits(3) === null) return null; // video_format
    if (r.bit() === null) return null; // video_full_range_flag
    const colourDescPresent = r.bit();
    if (colourDescPresent === null) return null;
    if (colourDescPresent === 1) {
      if (r.bits(8) === null) return null; // colour_primaries
      if (r.bits(8) === null) return null; // transfer_characteristics
      if (r.bits(8) === null) return null; // matrix_coefficients
    }
  }
  const chromaLocPresent = r.bit();
  if (chromaLocPresent === null) return null;
  if (chromaLocPresent === 1) {
    if (r.ue() === null) return null; // chroma_sample_loc_type_top_field
    if (r.ue() === null) return null; // chroma_sample_loc_type_bottom_field
  }
  const timingPresent = r.bit();
  if (timingPresent === null || timingPresent === 0) return null;
  const numUnitsInTick = r.bits(32);
  const timeScale = r.bits(32);
  const fixedFrameRate = r.bit();
  if (!need(numUnitsInTick) || !need(timeScale) || fixedFrameRate === null) {
    return null;
  }
  if (!(numUnitsInTick > 0) || !(timeScale > 0)) return null;
  const fps = timeScale / (2 * numUnitsInTick);
  // Miền hợp lý cho footage thật (fail-open): dưới 0,05 fps hay trên
  // 1000 fps thì coi như SPS hỏng/giả mạo kỳ quặc, trả null thay vì
  // chặn oan file thật bằng số VUI vô lý.
  if (!(fps >= 0.05 && fps <= 1000)) return null;
  return { fps, fixedFrameRate: fixedFrameRate === 1, numUnitsInTick, timeScale };
}

/**
 * Parse 1 file MP4 (ArrayBuffer hoàn chỉnh) -> track video H.264 đầu tiên.
 * Ném Error có message rõ ràng khi thiếu box bắt buộc — không trả track rỗng.
 */
export function parseMp4VideoTrack(buf: ArrayBuffer, lookup?: I18nLookup): Mp4VideoTrack {
  const view = new DataView(buf);
  const top = readBoxes(view, 0, buf.byteLength);
  const moov = findBox(top, "moov");
  if (!moov) {
    throw new Error(trKey(lookup, "gop.demux.parserMoovMissing", {}, "không tìm thấy moov"));
  }
  const moovChildren = childBoxes(view, moov);
  // mvhd -> movie timescale (phục vụ elst: segment_duration theo đơn
  // vị này). Layout giống mdhd: v0 timescale ở +12, v1 ở +20.
  // Đợt 56 M10 — đọc thêm mvhd duration (v0 +16 u32, v1 +24 u64) để
  // đối chiếu với thời lượng video ở `validateSampleTimestamps`.
  let movieTimescale: number | null = null;
  let mvhdDuration: number | null = null;
  {
    const mvhd = findBox(moovChildren, "mvhd");
    if (mvhd && mvhd.dataSize >= 16) {
      const v = view.getUint8(mvhd.dataStart);
      movieTimescale = view.getUint32(mvhd.dataStart + (v === 1 ? 20 : 12));
      if (v === 1) {
        if (mvhd.dataSize >= 32) mvhdDuration = Number(view.getBigUint64(mvhd.dataStart + 24));
      } else if (mvhd.dataSize >= 20) {
        mvhdDuration = view.getUint32(mvhd.dataStart + 16);
      }
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
    // Đợt 56 M10 — mdhd duration (v0 +16 u32, v1 +24 u64): file hợp lệ
    // có giá trị này == tổng stts; đọc kèm để `validateSampleTimestamps`
    // đối chiếu (không đủ byte thì null → lớp kiểm bỏ qua, fail-open).
    let mdhdDuration: number | null = null;
    if (version === 1) {
      if (mdhd.dataSize >= 32) mdhdDuration = Number(view.getBigUint64(mdhd.dataStart + 24));
    } else if (mdhd.dataSize >= 20) {
      mdhdDuration = view.getUint32(mdhd.dataStart + 16);
    }
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
    const codec = avcCodecString(description, lookup);
    // Đợt 57 N6 — timing VUI trong SPS (avcC): nguồn fps độc lập để
    // `validateSampleTimestamps` đối chiếu với stts. null khi SPS
    // không có VUI timing → lớp kiểm bỏ qua phần đó (fail-open).
    const spsVui = parseSpsVuiTiming(description);

    // stts -> timestamp + duration từng sample.
    // Đợt 52 I6 — chặn bom allocation: một entry stts khai count =
    // 0xFFFFFFFF sẽ push 4 tỉ số vào timestamps/durations trước khi
    // kiểm tra khớp sampleCount ở dưới (đo thật: OOM ở heap 256 MiB).
    // Tổng tích lũy vượt MAX_MP4_SAMPLES thì ném ngay, trước vòng
    // push trong — không chờ vòng lặp chạy.
    const sttsCount = view.getUint32(stts.dataStart + 4);
    const timestamps: number[] = [];
    const durations: number[] = [];
    let t = 0;
    let sttsTotal = 0;
    for (let i = 0; i < sttsCount; i++) {
      const count = view.getUint32(stts.dataStart + 8 + i * 8);
      const delta = view.getUint32(stts.dataStart + 12 + i * 8);
      sttsTotal += count;
      if (sttsTotal > MAX_MP4_SAMPLES) {
        throw new Error(
        trKey(
          lookup,
          "gop.demux.parserSttsOverLimit",
          { total: String(sttsTotal), max: String(MAX_MP4_SAMPLES) },
          `stts: tổng số sample ${sttsTotal} vượt giới hạn ${MAX_MP4_SAMPLES} (moov chế tác?)`,
        ),
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
    // Đợt 52 I6 — chặn bom allocation (như stts): sampleCount =
    // 0xFFFFFFFF với sampleSize cố định sẽ push 4 tỉ số vào sizes
    // trước mọi kiểm tra (đo thật: OOM ở heap 256 MiB). Kiểm tra
    // ngay sau khi đọc sampleCount, trước cả hai nhánh push.
    if (sampleCount > MAX_MP4_SAMPLES) {
      throw new Error(
        trKey(
          lookup,
          "gop.demux.parserStszOverLimit",
          { count: String(sampleCount), max: String(MAX_MP4_SAMPLES) },
          `stsz: số sample ${sampleCount} vượt giới hạn ${MAX_MP4_SAMPLES} (moov chế tác?)`,
        ),
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
        trKey(
          lookup,
          "gop.demux.parserSampleTableMismatch",
          { stts: String(timestamps.length), stsz: String(sampleCount) },
          `sample table lệch: stts=${timestamps.length} stsz=${sampleCount}`,
        ),
      );
    }
    // stss -> tập keyframe (vắng = tất cả là key).
    const stss = findBox(st, "stss");
    const keySet = new Set<number>();
    // Đợt 54 K8 — đếm entry stss ngoài [1, sampleCount]: file hợp lệ
    // không bao giờ có (keyframe phải là sample có thật); moov chế
    // tác khai khống stss sẽ lộ ở đây. Chỉ đếm, không ném — T3 quyết
    // định fallback (xem field `stssOutOfRange` trên Mp4VideoTrack).
    let stssOutOfRange = 0;
    if (stss) {
      const n = view.getUint32(stss.dataStart + 4);
      for (let i = 0; i < n; i++) {
        const v = view.getUint32(stss.dataStart + 8 + i * 4);
        if (v < 1 || v > sampleCount) stssOutOfRange++;
        keySet.add(v - 1);
      }
    }
    // ctts -> composition offset từng sample (vắng = toàn 0). v0: offset
    // không dấu; v1: offset có dấu (B-frame thường âm ở sample sau).
    // Bảng thiếu/thừa so với sampleCount thì pad 0 / cắt bớt và ghi rõ
    // trong comment — file hợp lệ luôn khớp đúng.
    const cttsOffsets: number[] = [];
    // Đợt 54 K8 — tổng số sample mà ctts khai (không cắt ở sampleCount):
    // file hợp lệ luôn bằng đúng sampleCount; lệch là dấu moov chế tác.
    // Chỉ ghi lại, không ném — T3 quyết định fallback (xem field
    // `cttsTotal` trên Mp4VideoTrack).
    let cttsTotal: number | null = null;
    {
      const ctts = findBox(st, "ctts");
      if (ctts && ctts.dataSize >= 8) {
        cttsTotal = 0;
        const version = view.getUint8(ctts.dataStart);
        const entryCount = view.getUint32(ctts.dataStart + 4);
        for (let i = 0; i < entryCount; i++) {
          const base = ctts.dataStart + 8 + i * 8;
          if (base + 8 > ctts.dataStart + ctts.dataSize) break;
          const count = view.getUint32(base);
          cttsTotal += count;
          const offset =
            version === 1 ? view.getInt32(base + 4) : view.getUint32(base + 4);
          // Đợt 52 I6 — chặn bom allocation (như stts/stsz): một entry
          // ctts khai count = 0xFFFFFFFF sẽ push 4 tỉ offset trước
          // khi cắt bớt về sampleCount ở dưới (đo thật: OOM ở heap
          // 256 MiB). sampleCount đã bị chặn ≤ MAX_MP4_SAMPLES ở trên
          // nên dừng push ngay khi đủ sampleCount là đủ kín.
          for (let k = 0; k < count && cttsOffsets.length < sampleCount; k++) cttsOffsets.push(offset);
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
        trKey(
          lookup,
          "gop.demux.parserSampleBuildMismatch",
          { got: String(samples.length), want: String(sampleCount) },
          `dựng sample lệch: chunk cho ${samples.length}/${sampleCount}`,
        ),
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
      cttsTotal,
      stssOutOfRange,
      mdhdDuration,
      mvhdDuration,
      spsVuiFps: spsVui?.fps ?? null,
      spsVuiFixedFrameRate: spsVui?.fixedFrameRate ?? null,
    };
    break;
  }
  if (!chosen) {
    throw new Error(
      trKey(lookup, "gop.demux.parserNoAvc1Track", {}, "không tìm thấy track video avc1 hợp lệ"),
    );
  }
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

/**
 * Đợt 53 J6 — kiểm tra cấu trúc AVCC (length-prefixed NAL) của 1 sample.
 *
 * BỐI CẢNH (nợ I6 §2.4 / ROUND52 §4.5): moov giả trỏ VÀO TRONG file
 * (offset nằm trong mdat) qua được tầng T3 vì không một kiểm tra nào ở
 * tầng byte phân biệt được nó với moov thật. Kiểm tra này là lớp chặn
 * rẻ tiền thay cho "decode thử frame đầu": sample H.264 thật ở dạng
 * AVCC là dãy NAL [uint32-be length][NAL bytes] tiêu thụ khít sample;
 * moov giả trỏ lệch vào giữa dữ liệu sẽ đọc length rác (0, hoặc vượt
 * sample) nên bị chặn. Đây KHÔNG phải decode thật: moov giả trỏ đúng
 * vào byte H.264 thật (vd trỏ vào đầu sample thật nhưng sai timestamp)
 * vẫn qua được — decoder + controller fallback vẫn là cửa cuối.
 *
 * `data` là byte sample đã fetch (hoặc tiền tố của sample khi sample
 * lớn hơn cap fetch); `totalSize` là kích thước đầy đủ của sample
 * (vắng = data.length — tức data là toàn bộ sample, khi đó các NAL
 * phải tiêu thụ đúng hết data). NAL bị cắt bởi cap fetch (khai dài hơn
 * phần đã fetch nhưng vẫn trong tổng sample) thì DỪNG và chấp nhận các
 * NAL đã đọc — không kết luận sai từ thiếu dữ liệu; chỉ NAL khai dài
 * hơn CẢ sample, length 0, forbidden bit, type 0, hay byte thừa ở
 * sample đầy đủ mới là sai. Giả định AVCC 4-byte length — cùng giả
 * định với toàn bộ đường demux/decode hiện có (không phải giả định mới).
 */
export function validateAvccSample(
  data: Uint8Array,
  totalSize?: number,
  lookup?: I18nLookup,
): { ok: boolean; reason?: string } {
  const total = totalSize ?? data.length;
  if (!(total > 0)) {
    return { ok: false, reason: trKey(lookup, "gop.demux.avccEmpty", {}, "sample rỗng") };
  }
  if (data.length < 5) {
    return {
      ok: false,
      reason: trKey(
        lookup,
        "gop.demux.avccShortRead",
        { got: String(data.length), total: String(total) },
        `chỉ đọc được ${data.length} byte của sample ${total} byte (cần ≥ 5 để có 1 NAL)`,
      ),
    };
  }
  const truncated = data.length < total;
  let off = 0;
  let nals = 0;
  let straddled = false;
  while (off + 4 <= data.length) {
    const len =
      data[off] * 0x1000000 +
      data[off + 1] * 0x10000 +
      data[off + 2] * 0x100 +
      data[off + 3];
    const remainingInSample = total - off - 4;
    if (!(len > 0)) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.avccNalTooLong",
          { nal: String(nals), len: String(len), off: String(off) },
          `NAL ${nals} dài ${len} (không hợp lệ) ở offset ${off}`,
        ),
      };
    }
    if (len > remainingInSample) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.avccNalOverrun",
          { nal: String(nals), len: String(len), remaining: String(remainingInSample), off: String(off) },
          `NAL ${nals} dài ${len} vượt sample còn lại ${remainingInSample} ở offset ${off}`,
        ),
      };
    }
    const remainingInFetched = data.length - off - 4;
    if (len > remainingInFetched) {
      // NAL bị cắt bởi cap fetch, không phải lỗi file: dừng và chấp
      // nhận các NAL đã đọc được (xem ghi chú đầu hàm).
      straddled = true;
      break;
    }
    const hdr = data[off + 4];
    if ((hdr & 0x80) !== 0) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.avccNalForbiddenBit",
          { nal: String(nals), off: String(off) },
          `NAL ${nals} có forbidden_zero_bit ở offset ${off}`,
        ),
      };
    }
    if ((hdr & 0x1f) === 0) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.avccNalTypeZero",
          { nal: String(nals), off: String(off) },
          `NAL ${nals} có type 0 ở offset ${off}`,
        ),
      };
    }
    off += 4 + len;
    nals++;
  }
  if (nals === 0 && !straddled) {
    return { ok: false, reason: trKey(lookup, "gop.demux.avccNoNal", {}, "không đọc được NAL nào") };
  }
  if (nals === 0 && straddled) {
    // NAL đầu tiên đã dài hơn cửa sổ fetch: 0 NAL trọn vẹn nhưng cũng
    // không có bằng chứng sai — fail-open (lớp chặn, không phải chứng minh).
    return { ok: true };
  }
  if (off < data.length && !truncated) {
    return {
      ok: false,
      reason: trKey(
        lookup,
        "gop.demux.avccTrailingBytes",
        { count: String(data.length - off) },
        `thừa ${data.length - off} byte cuối không đủ 1 NAL`,
      ),
    };
  }
  return { ok: true };
}

/**
 * Đợt 54 K8 — kiểm tra bố cục sample table (hàm thuần, chạy được ở Node).
 *
 * Bất biến của file MP4 hợp lệ (ISO 14496-12): các sample của một track
 * nằm theo thứ tự decode, offset tăng dần theo chunk (stco liệt kê chunk
 * theo thứ tự trong file, sample trong chunk nằm liên tiếp nhau), và hai
 * sample khác nhau không bao giờ chia sẻ cùng byte — khoảng
 * [offset, offset+size) của chúng không chồng lấn. Khoảng TRỐNG giữa
 * các sample vẫn hợp lệ (track khác — vd audio — xen kẽ trong cùng
 * mdat), và sample size 0 cũng hợp lệ (offset của nó bằng đúng cuối
 * sample trước thì không tính là chồng lấn).
 *
 * Moov giả lười chế tác thường vi phạm bất biến này: trỏ mọi sample về
 * cùng một offset (sample thật đầu tiên), đảo thứ tự chunk, hoặc khai
 * offset ngẫu nhiên — đều bị bắt tại đây. Moov giả sao chép y nguyên
 * bảng sample thật nhưng sửa timestamp (stts) thì VẪN QUA được lớp này
 * (bố cục đúng) — cửa cuối là decoder + controller fallback, ghi rõ
 * trong LIMITS đợt này.
 *
 * Chỉ kiểm tra bố cục, không kiểm tra byte dữ liệu — không cần fetch
 * thêm, không cần VideoDecoder, nên chạy được cả trong test Node.
 */
export function validateSampleLayout(
  samples: Mp4Sample[],
  lookup?: I18nLookup,
): { ok: boolean; reason?: string } {
  let prevEnd = -1;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (!(s.offset >= 0) || !(s.size >= 0)) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.layoutNegativeOffset",
          { sample: String(i), offset: String(s.offset), size: String(s.size) },
          `sample ${i} có offset/size âm (${s.offset}/${s.size})`,
        ),
      };
    }
    if (i > 0 && s.offset < samples[i - 1].offset) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.layoutOffsetRewind",
          { sample: String(i), offset: String(s.offset), prev: String(i - 1), prevOffset: String(samples[i - 1].offset) },
          `sample ${i} offset ${s.offset} lùi sau sample ${i - 1} offset ${samples[i - 1].offset} (stco không tăng dần)`,
        ),
      };
    }
    if (s.offset < prevEnd) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.layoutOverlap",
          { sample: String(i), start: String(s.offset), end: String(s.offset + s.size), prevEnd: String(prevEnd) },
          `sample ${i} [${s.offset}, ${s.offset + s.size}) chồng lấn sample trước (kết thúc ${prevEnd})`,
        ),
      };
    }
    prevEnd = Math.max(prevEnd, s.offset + s.size);
  }
  return { ok: true };
}

/**
 * Đợt 56 M10 — kiểm tra nhất quán timestamp stts (hàm thuần, chạy
 * được ở Node). Đóng nợ L8 §6.2 / K8 §3.3: moov giả sao chép y nguyên
 * bảng sample thật nhưng sửa timestamp (stts) qua được mọi lớp T3
 * trước đó (bounds I6, mdat J6, AVCC J6, bố cục K8 — bố cục đúng vì
 * bảng sample là bảng thật; trial-decode sample 0 cũng qua vì byte
 * sample là byte thật).
 *
 * Ba đối chiếu rẻ tiền, không cần fetch thêm byte nào, không cần
 * VideoDecoder (dựa trên bất biến của file MP4 hợp lệ, ISO 14496-12):
 *   (a) mdhd duration == tổng stts (cùng media timescale). Kẻ giả sửa
 *       stts mà không sửa mdhd sẽ lộ ngay. Dung sai = max(2 frame,
 *       1% tổng): đo thật trên 13 file (xem LIMITS M10 §2.1) lệch tối
 *       đa 1 frame (file keyframe-video: mdhd dài hơn stts đúng 512
 *       unit = 1 frame), còn lại lệch 0.
 *   (b) mvhd duration ≈ thời lượng video (đổi sang giây). Dung sai
 *       rộng = max(0,5s, 5%): audio có thể dài hơn video chút — đo
 *       thật trên file có audio lệch tối đa 0,012s. Lớp này chỉ bắt
 *       lệch thô (vd stts bị nhân đôi mà mdhd cũng bị sửa theo).
 *   (c) Hình dạng delta: mọi delta phải > 0; delta lớn nhất không
 *       được vừa > 50× delta giữa (median, bền với 1 outlier — mean
 *       sẽ bị chính outlier kéo lên) vừa > 2s. Bắt kẻ giả sửa 1 delta
 *       rồi sửa khớp cả mdhd lẫn mvhd. Ngưỡng rộng để không chặn oan
 *       footage VFR thật (đo thật: max/median = 1,00 trên mọi file).
 *   (d) Đợt 57 N6 — fps theo stts so với fps VUI trong SPS
 *       (`track.spsVuiFps`, parse ở `parseSpsVuiTiming`), lấy min
 *       lệch của 3 ước lượng: timescale/median-delta,
 *       timescale/mode-delta và fps trung bình (số sample / tổng thời
 *       lượng). Bắt moov giả đổi tỉ lệ đều toàn bộ stts + sửa khớp cả
 *       mdhd lẫn mvhd — lớp (a)–(c) đều mù trước lớp này. VUI vắng
 *       thì bỏ qua (fail-open). Dung sai SPS_VUI_FPS_TOLERANCE hiệu
 *       chuẩn từ file footage thật (xem LIMITS N6 §2).
 *
 * CHỈ fallback (T3 quyết định), không ném lỗi — file lạ vẫn phát được
 * bằng đường full-file. Thiếu mdhd/mvhd (null/undefined) thì bỏ qua
 * đúng phần đó (fail-open). Track rỗng → ok (T3 tự xử lý rỗng).
 *
 * GIỚI HẠN (ghi rõ, không mạo nhận đã chặn triệt để):
 * - Đổi tỉ lệ đều TOÀN BỘ stts rồi sửa khớp cả mdhd lẫn mvhd: ĐÃ BẮT
 *   ĐƯỢC khi SPS có VUI timing (kiểm (d) — việc của đợt 57 N6 này);
 *   vẫn lọt khi SPS không có VUI timing (số file thật có/không có VUI
 *   đo ở LIMITS N6 §2), hoặc khi kẻ giả viết lại cả SPS VUI cho khớp
 *   stts giả.
 * - Hoán đổi delta giữa các sample mà giữ nguyên tổng cũng lọt (tổng,
 *   max, median đều không đổi — và VUI chỉ cho fps trung bình nên
 *   cũng mù trước lớp này; xem LIMITS N6 §3 về vì sao kiểm hình dạng
 *   delta không bắt được an toàn).
 * - Trial-decode thêm sample giữa/cuối KHÔNG bắt được lớp này: byte
 *   sample là byte thật nên decode vẫn OK (có test chứng minh trong
 *   gopTrialDecode56M10.test.ts) — vì vậy KHÔNG nối thêm trial-decode
 *   cho (a); lớp đối chiếu này mới là cách bắt đúng.
 */
export function validateSampleTimestamps(
  track: Mp4VideoTrack,
  lookup?: I18nLookup,
): { ok: boolean; reason?: string } {
  const n = track.samples.length;
  if (n === 0) return { ok: true };
  const deltas = track.samples.map((s) => s.duration).sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)];
  const max = deltas[deltas.length - 1];
  const min = deltas[0];
  if (!(min > 0)) {
    return {
      ok: false,
      reason: trKey(
        lookup,
        "gop.demux.sttsNonPositiveDelta",
        { min: String(min) },
        `stts có delta ≤ 0 (nhỏ nhất ${min})`,
      ),
    };
  }
  const timescale = track.timescale;
  if (
    median > 0 &&
    max > 50 * median &&
    (timescale <= 0 || max > 2 * timescale)
  ) {
    return {
      ok: false,
      reason: trKey(
        lookup,
        "gop.demux.sttsDeltaOutlier",
        { max: String(max), ratio: (max / median).toFixed(0), median: String(median) },
        `stts có delta lớn nhất ${max} gấp ${(max / median).toFixed(0)}× delta giữa ${median} (và > 2s)`,
      ),
    };
  }
  const mdhd = track.mdhdDuration;
  if (typeof mdhd === "number") {
    const tol = Math.max(2 * median, 0.01 * track.durationUnits);
    if (Math.abs(track.durationUnits - mdhd) > tol) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.sttsMdhdMismatch",
          { total: String(track.durationUnits), mdhd: String(mdhd), tol: String(Math.round(tol)) },
          `stts tổng ${track.durationUnits} lệch mdhd ${mdhd} quá dung sai ${Math.round(tol)}`,
        ),
      };
    }
  }
  const mvhd = track.mvhdDuration;
  const movieTs = track.movieTimescale;
  if (
    typeof mvhd === "number" &&
    movieTs !== null &&
    movieTs !== undefined &&
    movieTs > 0 &&
    timescale > 0
  ) {
    const mvhdSec = mvhd / movieTs;
    const tolSec = Math.max(0.5, 0.05 * track.durationSec);
    if (Math.abs(track.durationSec - mvhdSec) > tolSec) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.durationMvhdMismatch",
          { video: track.durationSec.toFixed(3), mvhd: mvhdSec.toFixed(3), tol: tolSec.toFixed(3) },
          `thời lượng video ${track.durationSec.toFixed(3)}s lệch mvhd ${mvhdSec.toFixed(3)}s quá dung sai ${tolSec.toFixed(3)}s`,
        ),
      };
    }
  }
  // Đợt 57 N6 — (d) fps theo stts so với fps VUI trong SPS. Đổi tỉ lệ
  // đều toàn bộ stts + sửa khớp mdhd/mvhd vẫn qua (a)–(c) (tổng, max,
  // median đều khớp sau khi sửa) nhưng fps-stts lệch khỏi fps-VUI —
  // VUI do encoder ghi lúc encode, kẻ giả chỉ sửa số trong moov không
  // khớp được số này. VUI vắng (null) → bỏ qua (fail-open): encoder
  // không ghi VUI timing là chuyện thường.
  //   Ước lượng fps-stts bằng cả ba cách — median delta, mode delta
  //   (delta xuất hiện nhiều nhất), và trung bình (số sample / tổng
  //   thời lượng): file VFR thật có median lệch khỏi fps danh định
  //   (vd đoạn dài quay chậm) nhưng mode/trung bình thường vẫn khớp;
  //   chỉ chặn khi CẢ BA đều lệch quá dung sai. Kẻ giả đổi tỉ lệ đều
  //   thì cả ba cùng bị nhân tỉ lệ nên vẫn bị bắt — thêm ước lượng
  //   không cứu được file giả (xem LIMITS N6 §2).
  // Dung sai SPS_VUI_FPS_TOLERANCE hiệu chuẩn từ file thật (LIMITS
  // N6 §2): lệch đo được lớn nhất trên footage thật (xem bảng).
  const vuiFps = track.spsVuiFps;
  if (
    typeof vuiFps === "number" &&
    vuiFps > 0 &&
    timescale > 0 &&
    median > 0
  ) {
    // Mode delta: deltas đã sắp xếp tăng dần nên đếm run dài nhất.
    let mode = deltas[0];
    let bestRun = 0;
    let run = 0;
    let prev = -1;
    for (const d of deltas) {
      if (d === prev) {
        run++;
      } else {
        run = 1;
        prev = d;
      }
      if (run > bestRun) {
        bestRun = run;
        mode = d;
      }
    }
    const avgFps =
      track.durationUnits > 0
        ? (timescale * track.samples.length) / track.durationUnits
        : 0;
    const relOf = (fps: number): number => Math.abs(fps - vuiFps) / vuiFps;
    const rel = Math.min(
      relOf(timescale / median),
      relOf(timescale / mode),
      avgFps > 0 ? relOf(avgFps) : Infinity,
    );
    if (rel > SPS_VUI_FPS_TOLERANCE) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.demux.fpsVuiMismatch",
          {
            medianFps: (timescale / median).toFixed(3),
            modeFps: (timescale / mode).toFixed(3),
            avgFps: avgFps > 0 ? avgFps.toFixed(3) : "?",
            vuiFps: vuiFps.toFixed(3),
            pct: (rel * 100).toFixed(1),
            tolPct: (SPS_VUI_FPS_TOLERANCE * 100).toFixed(1),
          },
          `fps theo stts ${(timescale / median).toFixed(3)} (median) / ${(timescale / mode).toFixed(3)} (mode) / ${avgFps > 0 ? avgFps.toFixed(3) : "?"} (trung bình) lệch VUI SPS ${vuiFps.toFixed(3)} (${(rel * 100).toFixed(1)}% > dung sai ${(SPS_VUI_FPS_TOLERANCE * 100).toFixed(1)}%)`,
        ),
      };
    }
  }
  return { ok: true };
}

/** Byte lý thuyết của 1 frame NV12 (dùng ước bộ nhớ cache, không phải đo). */
export function nv12BytesPerFrame(width: number, height: number): number {
  return Math.floor((width * height * 3) / 2);
}
