// gopTrialDecode57N6.test.ts — Phase 9 đợt 57, luồng N6: đóng nợ
// LIMITS M10 §4 / §1.5: 2 trường hợp moov-giả tinh vi vẫn lọt qua guard
// `validateSampleTimestamps`:
//   (1) đổi tỉ lệ đều toàn bộ stts delta + sửa khớp mdhd/mvhd;
//   (2) hoán đổi delta giữa các sample giữ nguyên tổng thời lượng.
// Hướng giải: parse SPS VUI timing (num_units_in_tick / time_scale)
// từ avcC trong moov → nguồn thời gian độc lập thứ ba đối chiếu với
// stts. Guard mới `parseSpsVuiTiming` + kiểm (d) trong
// `validateSampleTimestamps` (mp4Demux.ts):
//   - (1) ĐÃ BẮT ĐƯỢC khi SPS có VUI timing (test dưới đây);
//     vẫn lọt khi SPS không có VUI timing (fail-open, ghi rõ).
//   - (2) VẪN LỌT (VUI chỉ cho fps trung bình; tổng/median/mode/avg
//     đều không đổi khi hoán đổi) — test khóa hành vi hiện tại + ghi
//     rõ vì sao kiểm hình dạng delta không bắt được an toàn (xem
//     LIMITS N6 §3; mẫu pulldown hợp lệ cũng xen kẽ delta).
//
// Chạy bằng esbuild bundle (mẫu M10, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode57N6.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/n6.test.cjs \
//     && node <scratch>/n6.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { fetchVideoTrackByGopRange } from "./gopRangeFetch39T3.ts";
import type { GopTrialDecodeProbe } from "./gopTrialDecode55L8.ts";
import {
  parseMp4VideoTrack,
  parseSpsVuiTiming,
  SPS_VUI_FPS_TOLERANCE,
  validateSampleTimestamps,
} from "./mp4Demux.ts";
import type { Mp4VideoTrack } from "./mp4Demux.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => Promise<void> | void }> = [];
function ok(name: string, fn: () => Promise<void> | void): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`gopTrialDecode57N6: ${pass}/${queue.length} test pass`);
}

// ---------------------------------------------------------------------------
// Ghi bit + dựng SPS tổng hợp (baseline profile 66) với VUI timing tùy
// chọn — kiểm chứng parser `parseSpsVuiTiming` trên giá trị đã biết
// trước, không phụ thuộc file thật.
// ---------------------------------------------------------------------------
class BitWriter {
  bits: number[] = [];
  u(n: number, value: number): void {
    for (let i = n - 1; i >= 0; i--) this.bits.push(Math.floor(value / 2 ** i) % 2);
  }
  bit(b: number): void {
    this.bits.push(b & 1);
  }
  ue(v: number): void {
    const codeNum = v + 1;
    const len = Math.floor(Math.log2(codeNum));
    for (let i = 0; i < len; i++) this.bits.push(0);
    this.u(len + 1, codeNum);
  }
  bytes(): Uint8Array {
    this.bits.push(1); // rbsp_stop_one_bit
    while (this.bits.length % 8 !== 0) this.bits.push(0);
    const out = new Uint8Array(this.bits.length / 8);
    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i]) out[i >> 3] |= 1 << (7 - (i & 7));
    }
    return out;
  }
}
function buildSyntheticSps(opts: {
  numUnitsInTick?: number;
  timeScale?: number;
  fixed?: boolean;
  vuiPresent?: boolean;
  timingPresent?: boolean;
} = {}): Uint8Array {
  const w = new BitWriter();
  w.u(8, 66); // profile_idc baseline
  w.u(8, 0); // constraint flags
  w.u(8, 30); // level_idc
  w.ue(0); // seq_parameter_set_id
  w.ue(0); // log2_max_frame_num_minus4
  w.ue(0); // pic_order_cnt_type 0
  w.ue(0); // log2_max_pic_order_cnt_lsb_minus4
  w.ue(1); // max_num_ref_frames
  w.bit(0); // gaps_in_frame_num_value_allowed_flag
  w.ue(79); // pic_width_in_mbs_minus1 (1280)
  w.ue(44); // pic_height_in_map_units_minus1 (720)
  w.bit(1); // frame_mbs_only_flag
  w.bit(1); // direct_8x8_inference_flag
  w.bit(0); // frame_cropping_flag
  w.bit(opts.vuiPresent === false ? 0 : 1); // vui_parameters_present_flag
  if (opts.vuiPresent !== false) {
    w.bit(0); // aspect_ratio_info_present_flag
    w.bit(0); // overscan_info_present_flag
    w.bit(0); // video_signal_type_present_flag
    w.bit(0); // chroma_loc_info_present_flag
    w.bit(opts.timingPresent === false ? 0 : 1); // timing_info_present_flag
    if (opts.timingPresent !== false) {
      w.u(32, opts.numUnitsInTick ?? 1);
      w.u(32, opts.timeScale ?? 2);
      w.bit(opts.fixed === false ? 0 : 1); // fixed_frame_rate_flag
    }
  }
  const rbsp = w.bytes();
  const sps = new Uint8Array(1 + rbsp.length);
  sps[0] = 0x67; // NAL header: forbidden 0, ref 3, type 7 (SPS)
  sps.set(rbsp, 1);
  return sps;
}
/** Gói SPS thành avcC đầy đủ (SPS + 1 PPS giả 5 byte, parser chỉ đọc SPS). */
function avcCFromSps(sps: Uint8Array): Buffer {
  const pps = Buffer.from([0x68, 0xeb, 0xe3, 0xcb, 0x22]);
  const out = Buffer.alloc(8 + sps.length + 1 + 2 + pps.length);
  out[0] = 0x01;
  out[1] = sps[1];
  out[2] = sps[2];
  out[3] = sps[3];
  out[4] = 0xff;
  out[5] = 0xe1; // 1 SPS
  out.writeUInt16BE(sps.length, 6);
  Buffer.from(sps).copy(out, 8);
  let o = 8 + sps.length;
  out[o++] = 0x01; // 1 PPS
  out.writeUInt16BE(pps.length, o);
  o += 2;
  pps.copy(out, o);
  return out;
}

// SPS thật trích từ footage trong repo (đo ở LIMITS N6 §2 — script
// measureVui57N6.ts, `spsHex=`): dùng làm fixture parser cho SPS do
// encoder thật ghi (High profile + scaling list, High 4:4:4 + chroma 3,
// High 10), cả ba đều cho fps VUI = 30.0000.
const REAL_SPS_HIGH = Buffer.from(
  "6764001facd9405005bb0110000003001000000303c0f183196001000568ef823cb0fdf8f800",
  "hex",
); // trailing-real37.mp4, High (100), 38 byte
const REAL_SPS_444 = Buffer.from(
  "67f40028919b280a00b76022000003000200000300781e30632c01000668ebe3c44844fff8f800",
  "hex",
); // high444p.mp4, High 4:4:4 Predictive (244), có emulation-prevention 000003
const REAL_SPS_HIGH10 = Buffer.from(
  "676e0028a6cd9405005bb0110000030001000003003c0f18319601000668ebe3cb22c0fdfafa00",
  "hex",
); // high10.mp4, High 10 (110)
// SPS kiểu M10 (fixture cũ, KHÔNG có VUI timing): 67 64 00 1f ac d9 40 78.
const M10_SPS_NO_VUI = new Uint8Array([0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9, 0x40, 0x78]);

// ---------------------------------------------------------------------------
// Unit: parseSpsVuiTiming.
// ---------------------------------------------------------------------------
ok("(vui-parse) SPS thật High (trailing-real37) → fps 30.0, fixed=false, units=1, scale=60", () => {
  const r = parseSpsVuiTiming(avcCFromSps(REAL_SPS_HIGH));
  assert.notEqual(r, null);
  assert.ok(Math.abs((r?.fps ?? -1) - 30) < 0.0001, `fps phải 30, nhận ${r?.fps}`);
  assert.equal(r?.fixedFrameRate, false);
  assert.equal(r?.numUnitsInTick, 1);
  assert.equal(r?.timeScale, 60);
});
ok("(vui-parse) SPS thật High 4:4:4 (chroma 3 + scaling list + 000003) → fps 30.0", () => {
  const r = parseSpsVuiTiming(avcCFromSps(REAL_SPS_444));
  assert.notEqual(r, null);
  assert.ok(Math.abs((r?.fps ?? -1) - 30) < 0.0001, `fps phải 30, nhận ${r?.fps}`);
});
ok("(vui-parse) SPS thật High 10 (profile 110) → fps 30.0", () => {
  const r = parseSpsVuiTiming(avcCFromSps(REAL_SPS_HIGH10));
  assert.notEqual(r, null);
  assert.ok(Math.abs((r?.fps ?? -1) - 30) < 0.0001, `fps phải 30, nhận ${r?.fps}`);
});
ok("(vui-parse) SPS tổng hợp 29.97fps (60000/1001) → fps ≈ 29.97", () => {
  const r = parseSpsVuiTiming(avcCFromSps(buildSyntheticSps({ numUnitsInTick: 1001, timeScale: 60000 })));
  assert.notEqual(r, null);
  assert.ok(Math.abs((r?.fps ?? -1) - 29.97) < 0.001, `fps phải ≈29.97, nhận ${r?.fps}`);
});
ok("(vui-parse) SPS tổng hợp fps 1.0 (2/1), fixed=true → fps 1.0", () => {
  const r = parseSpsVuiTiming(avcCFromSps(buildSyntheticSps({ numUnitsInTick: 1, timeScale: 2, fixed: true })));
  assert.notEqual(r, null);
  assert.equal(r?.fps, 1);
  assert.equal(r?.fixedFrameRate, true);
});
ok("(vui-parse) SPS tổng hợp không có VUI → null (fail-open)", () => {
  assert.equal(parseSpsVuiTiming(avcCFromSps(buildSyntheticSps({ vuiPresent: false }))), null);
});
ok("(vui-parse) SPS tổng hợp có VUI nhưng không có timing → null", () => {
  assert.equal(parseSpsVuiTiming(avcCFromSps(buildSyntheticSps({ timingPresent: false }))), null);
});
ok("(vui-parse) SPS tổng hợp bị cắt mất 3 byte cuối (hết bit giữa VUI) → null", () => {
  const sps = buildSyntheticSps({});
  assert.equal(parseSpsVuiTiming(avcCFromSps(sps.subarray(0, sps.length - 3))), null);
});
ok("(vui-parse) SPS kiểu M10 (không VUI timing) → null", () => {
  assert.equal(parseSpsVuiTiming(avcCFromSps(M10_SPS_NO_VUI)), null);
});
ok("(vui-parse) fps vô lý (time_scale=2^32-1, units=1 → ~2,1 tỉ fps) → null (fail-open, không chặn oan)", () => {
  assert.equal(parseSpsVuiTiming(avcCFromSps(buildSyntheticSps({ numUnitsInTick: 1, timeScale: 0xffffffff }))), null);
});
ok("(vui-parse) time_scale=0 → null", () => {
  assert.equal(parseSpsVuiTiming(avcCFromSps(buildSyntheticSps({ numUnitsInTick: 1, timeScale: 0 }))), null);
});
ok("(vui-parse) avcC rỗng / numSPS=0 → null (không ném)", () => {
  assert.equal(parseSpsVuiTiming(new Uint8Array([])), null);
  assert.equal(parseSpsVuiTiming(new Uint8Array([0x01, 0x64, 0x00, 0x1f, 0xff, 0xe0])), null);
});
ok("SPS_VUI_FPS_TOLERANCE = 0.02 (2%, hiệu chuẩn LIMITS N6 §2)", () => {
  assert.equal(SPS_VUI_FPS_TOLERANCE, 0.02);
});

// ---------------------------------------------------------------------------
// Unit: validateSampleTimestamps + kiểm (d) VUI.
// ---------------------------------------------------------------------------
function fakeTrack(opts: {
  durations: number[];
  timescale?: number;
  mdhdDuration?: number | null;
  mvhdDuration?: number | null;
  movieTimescale?: number | null;
  spsVuiFps?: number | null;
}): Mp4VideoTrack {
  const timescale = opts.timescale ?? 1000;
  const durations = opts.durations;
  const durationUnits = durations.reduce((a, b) => a + b, 0);
  let t = 0;
  const samples = durations.map((d, i) => {
    const s = {
      index: i,
      offset: i * 1000,
      size: 1000,
      timestamp: t,
      duration: d,
      isKey: i % 30 === 0,
      presentationTimestamp: t,
    };
    t += d;
    return s;
  });
  return {
    codec: "avc1.64001F",
    description: new Uint8Array([0x01, 0x64, 0x00, 0x1f]),
    timescale,
    width: 1280,
    height: 720,
    samples,
    durationUnits,
    durationSec: timescale > 0 ? durationUnits / timescale : 0,
    editList: [],
    movieTimescale: opts.movieTimescale ?? 1000,
    cttsTotal: null,
    stssOutOfRange: 0,
    mdhdDuration: opts.mdhdDuration ?? durationUnits,
    mvhdDuration: opts.mvhdDuration ?? durationUnits,
    spsVuiFps: opts.spsVuiFps ?? null,
    spsVuiFixedFrameRate: false,
  };
}
const UNIFORM_60 = Array.from({ length: 60 }, () => 1000);

ok("(vui-unit) CFR nhất quán + VUI 1.0 khớp stts → ok", () => {
  assert.equal(validateSampleTimestamps(fakeTrack({ durations: UNIFORM_60, spsVuiFps: 1.0 })).ok, true);
});
ok("(vui-unit) NỢ (1) ĐÃ ĐÓNG: đổi tỉ lệ đều 2× (60×500) + mdhd/mvhd sửa khớp + VUI 1.0 → FAIL /VUI/", () => {
  const durations = Array.from({ length: 60 }, () => 500);
  const total = 60 * 500;
  const r = validateSampleTimestamps(fakeTrack({ durations, mdhdDuration: total, mvhdDuration: total, spsVuiFps: 1.0 }));
  assert.equal(r.ok, false, "đổi tỉ lệ đều 2× phải bị chặn khi có VUI");
  assert.match(r.reason ?? "", /VUI/);
  console.log(`    đo: lý do=${r.reason}`);
});
ok("(vui-unit) đổi tỉ lệ 1.05× (5% > dung sai 2%) + VUI 1.0 → FAIL /VUI/", () => {
  const durations = Array.from({ length: 60 }, () => 952);
  const total = 60 * 952;
  const r = validateSampleTimestamps(fakeTrack({ durations, mdhdDuration: total, mvhdDuration: total, spsVuiFps: 1.0 }));
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /VUI/);
});
ok("(vui-unit) đổi tỉ lệ 1.01× (1% < dung sai 2%) + VUI 1.0 → ok (trong dung sai, lệch 1% không đổi hành vi)", () => {
  const durations = Array.from({ length: 60 }, () => 990);
  const total = 60 * 990;
  const r = validateSampleTimestamps(fakeTrack({ durations, mdhdDuration: total, mvhdDuration: total, spsVuiFps: 1.0 }));
  assert.equal(r.ok, true, `phải qua: ${r.reason ?? ""}`);
});
ok("(vui-unit) VUI vắng (null) + đổi tỉ lệ đều 2× + mdhd/mvhd sửa khớp → ok = VẪN LỌT (fail-open, ghi rõ trong LIMITS)", () => {
  const durations = Array.from({ length: 60 }, () => 500);
  const total = 60 * 500;
  const r = validateSampleTimestamps(fakeTrack({ durations, mdhdDuration: total, mvhdDuration: total, spsVuiFps: null }));
  assert.equal(r.ok, true, "không có VUI thì không có nguồn độc lập để bắt — fail-open, không mạo nhận");
});
ok("(vui-unit) VFR lưỡng phân [30×500, 30×1500], VUI=1.0 (fps trung bình) → ok nhờ ước lượng trung bình", () => {
  const durations = [...Array.from({ length: 30 }, () => 500), ...Array.from({ length: 30 }, () => 1500)];
  const r = validateSampleTimestamps(fakeTrack({ durations, spsVuiFps: 1.0 }));
  assert.equal(r.ok, true, `phải qua nhờ avg: ${r.reason ?? ""}`);
});
ok("(vui-unit) VFR lưỡng phân [30×500, 30×1500], VUI=2.0 (nhịp nhanh nhất) → ok nhờ ước lượng mode", () => {
  const durations = [...Array.from({ length: 30 }, () => 500), ...Array.from({ length: 30 }, () => 1500)];
  const r = validateSampleTimestamps(fakeTrack({ durations, spsVuiFps: 2.0 }));
  assert.equal(r.ok, true, `phải qua nhờ mode: ${r.reason ?? ""}`);
});
ok("(vui-unit) VFR lệch median nhưng mode khớp VUI [25×500, 20×1000, 15×2000], VUI=2.0 → ok", () => {
  const durations = [...Array.from({ length: 25 }, () => 500), ...Array.from({ length: 20 }, () => 1000), ...Array.from({ length: 15 }, () => 2000)];
  const r = validateSampleTimestamps(fakeTrack({ durations, spsVuiFps: 2.0 }));
  assert.equal(r.ok, true, `phải qua nhờ mode: ${r.reason ?? ""}`);
});
ok("(vui-unit) VFR cực đoan [40×2000, 20×1000], VUI=1.0 (cả median/mode/trung bình đều lệch) → FAIL /VUI/ (ranh giới đã biết: fallback full-file, vẫn phát được)", () => {
  const durations = [...Array.from({ length: 40 }, () => 2000), ...Array.from({ length: 20 }, () => 1000)];
  const total = 40 * 2000 + 20 * 1000;
  const r = validateSampleTimestamps(fakeTrack({ durations, mdhdDuration: total, mvhdDuration: total, spsVuiFps: 1.0 }));
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /VUI/);
  console.log(`    đo: lý do=${r.reason}`);
});
ok("(vui-unit) NỢ (2) CÒN LẠI: hoán đổi khối delta [30×1500, 30×500], VUI=1.0 → vẫn ok (VUI chỉ cho fps trung bình)", () => {
  const durations = [...Array.from({ length: 30 }, () => 1500), ...Array.from({ length: 30 }, () => 500)];
  const r = validateSampleTimestamps(fakeTrack({ durations, spsVuiFps: 1.0 }));
  assert.equal(r.ok, true, "hoán đổi delta giữ nguyên tổng/median/mode/avg nên VUI cũng mù — ghi rõ trong LIMITS, không mạo nhận");
});
ok("(vui-unit) NỢ (2) CÒN LẠI: hoán đổi xen kẽ [1500,500]×30, VUI=1.0 → vẫn ok", () => {
  const durations = Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? 1500 : 500));
  const r = validateSampleTimestamps(fakeTrack({ durations, spsVuiFps: 1.0 }));
  assert.equal(r.ok, true, "hoán đổi xen kẽ cũng giữ nguyên mọi thống kê tổng hợp — vẫn lọt");
});
ok("(vui-unit) mẫu pulldown hợp lệ [500,750]×30, VUI=2.0 → ok (vì sao KHÔNG thêm kiểm hình dạng delta: mẫu xen kẽ hợp lệ cũng có tỉ lệ 1.5× xen kẽ 100%)", () => {
  const durations = Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? 500 : 750));
  const r = validateSampleTimestamps(fakeTrack({ durations, spsVuiFps: 2.0 }));
  assert.equal(r.ok, true, `pulldown hợp lệ phải qua: ${r.reason ?? ""}`);
});

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu (sao từ M10, thêm tham số avcC để dựng moov có
// SPS VUI timing hoặc không). Moov hợp lệ tối thiểu cho demux + tail-scan.
// ---------------------------------------------------------------------------
function box(type: string, ...payloads: Array<Buffer | Uint8Array>): Buffer {
  const body = Buffer.concat(payloads.map((p) => Buffer.from(p)));
  const out = Buffer.alloc(8 + body.length);
  out.writeUInt32BE(8 + body.length, 0);
  out.write(type, 4, 4, "ascii");
  body.copy(out, 8);
  return out;
}
const u32 = (n: number): Buffer => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
};
const u16 = (n: number): Buffer => {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(n & 0xffff, 0);
  return b;
};
const zeros = (n: number): Buffer => Buffer.alloc(n, 0);
const UNITY_MATRIX = Buffer.concat([
  u32(0x00010000), u32(0), u32(0), u32(0), u32(0x00010000), u32(0),
  u32(0), u32(0), u32(0x40000000),
]);

function mvhdBox(timescale = 1000, duration = 10000): Buffer {
  return box("mvhd",
    u32(0), u32(0), u32(0), u32(timescale), u32(duration),
    u32(0x00010000), u16(0x0100), u16(0), zeros(8), UNITY_MATRIX, zeros(24), u32(2));
}
function tkhdBox(duration = 10000, width = 1280, height = 720): Buffer {
  return box("tkhd",
    u32(0x00000007), u32(0), u32(0), u32(1), u32(0), u32(duration),
    zeros(8), u16(0), u16(0), u16(0), u16(0), UNITY_MATRIX,
    u32(width << 16), u32(height << 16));
}
function mdhdBox(timescale = 1000, duration = 10000): Buffer {
  return box("mdhd", u32(0), u32(0), u32(0), u32(timescale), u32(duration), u16(0x55c4), u16(0));
}
/** avcC với SPS tổng hợp có VUI timing fps 1.0 (mặc định cho builder). */
function avcCBoxVui(): Buffer {
  return box("avcC", avcCFromSps(buildSyntheticSps({ numUnitsInTick: 1, timeScale: 2, fixed: true })));
}
/** avcC với SPS kiểu M10, KHÔNG có VUI timing (để khóa trường hợp VUI vắng). */
function avcCBoxNoVui(): Buffer {
  return box("avcC", avcCFromSps(M10_SPS_NO_VUI));
}
function avc1Entry(avcC: Buffer, width = 1280, height = 720): Buffer {
  const fixed = Buffer.concat([
    zeros(6), u16(1), u16(0), u16(0), zeros(12),
    u16(width), u16(height), u32(0x00480000), u32(0x00480000), u32(0),
    u16(1), zeros(32), u16(0x0018), u16(0xffff),
  ]);
  const body = Buffer.concat([fixed, avcC]);
  const out = Buffer.alloc(8 + body.length);
  out.writeUInt32BE(8 + body.length, 0);
  out.write("avc1", 4, 4, "ascii");
  body.copy(out, 8);
  return out;
}
function stsdBox(avcC: Buffer): Buffer {
  return box("stsd", u32(0), u32(1), avc1Entry(avcC));
}
function sttsBox(entries: Array<[number, number]>): Buffer {
  const parts: Buffer[] = [u32(0), u32(entries.length)];
  for (const [c, d] of entries) parts.push(u32(c), u32(d));
  return box("stts", ...parts);
}
function stssBox(keys: number[]): Buffer {
  const parts: Buffer[] = [u32(0), u32(keys.length)];
  for (const k of keys) parts.push(u32(k));
  return box("stss", ...parts);
}
function stscBox(entries: Array<[number, number, number]>): Buffer {
  const parts: Buffer[] = [u32(0), u32(entries.length)];
  for (const [fc, spc, sdi] of entries) parts.push(u32(fc), u32(spc), u32(sdi));
  return box("stsc", ...parts);
}
function stszBox(sampleSize: number, sampleCount: number, sizes: number[]): Buffer {
  const parts: Buffer[] = [u32(0), u32(sampleSize), u32(sampleCount)];
  if (sampleSize === 0) for (const s of sizes) parts.push(u32(s));
  return box("stsz", ...parts);
}
function stcoBox(offsets: number[]): Buffer {
  const parts: Buffer[] = [u32(0), u32(offsets.length)];
  for (const o of offsets) parts.push(u32(o));
  return box("stco", ...parts);
}

interface MoovOpts {
  sampleCount?: number;
  sampleSize?: number;
  timescale?: number;
  chunkSamples?: number;
  chunkOffsets?: number[];
  stssKeys?: number[];
  sttsEntries?: Array<[number, number]>;
  mdhdDuration?: number;
  mvhdDuration?: number;
  /** Mặc định avcC có VUI fps 1.0; truyền avcCBoxNoVui() để dựng moov không VUI. */
  avcC?: Buffer;
}
/** Dựng moov hợp lệ tối thiểu (avc1, N sample) cho demux. */
function buildMoov(opts: MoovOpts = {}): { moov: Buffer; sampleCount: number } {
  const N = opts.sampleCount ?? 60;
  const sampleSize = opts.sampleSize ?? 1000;
  const timescale = opts.timescale ?? 1000;
  const chunkSamples = opts.chunkSamples ?? 30;
  const chunks = Math.max(1, Math.ceil(N / chunkSamples));
  const chunkOffsets = opts.chunkOffsets ??
    Array.from({ length: chunks }, (_, i) => 32 + i * chunkSamples * sampleSize);
  const keys = opts.stssKeys ??
    Array.from({ length: Math.ceil(N / 30) }, (_, i) => i * 30 + 1);
  const sttsEntries = opts.sttsEntries ?? [[N, 1000] as [number, number]];
  const sttsTotal = sttsEntries.reduce((a, [c, d]) => a + c * d, 0);
  const mdhdDuration = opts.mdhdDuration ?? sttsTotal;
  const mvhdDuration = opts.mvhdDuration ?? sttsTotal;
  const avcC = opts.avcC ?? avcCBoxVui();
  const stbl = box("stbl",
    stsdBox(avcC),
    sttsBox(sttsEntries),
    stssBox(keys),
    stscBox([[1, chunkSamples, 1]]),
    stszBox(sampleSize, N, Array.from({ length: N }, () => sampleSize)),
    stcoBox(chunkOffsets));
  const minf = box("minf",
    box("vmhd", u32(1), zeros(6)),
    box("dinf", box("dref", u32(0), u32(1), box("url ", u32(1)))),
    stbl);
  const mdia = box("mdia", mdhdBox(timescale, mdhdDuration),
    box("hdlr", u32(0), u32(0), Buffer.from("vide", "ascii"), zeros(12), Buffer.from("VideoHandler\0", "ascii")),
    minf);
  const trak = box("trak", tkhdBox(sttsTotal), mdia);
  const moov = box("moov", mvhdBox(timescale, mvhdDuration), trak);
  return { moov, sampleCount: N };
}

function ftypBox(): Buffer {
  return box("ftyp", Buffer.from("isom", "ascii"), u32(0x200), Buffer.from("isom", "ascii"), Buffer.from("iso2", "ascii"));
}

const AVCC_NAL = Buffer.from([0x00, 0x00, 0x00, 0x06, 0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9]);
function avccSampleBytes(sampleSize: number): Buffer {
  if (sampleSize % AVCC_NAL.length !== 0) throw new Error(`avccSampleBytes: sampleSize ${sampleSize} không chia hết cho ${AVCC_NAL.length}`);
  const out = Buffer.alloc(sampleSize);
  for (let off = 0; off < sampleSize; off += AVCC_NAL.length) AVCC_NAL.copy(out, off);
  return out;
}
function fillAvccSamples(payload: Buffer, mdatPayloadStart: number, offsets: number[], sampleSize: number): void {
  const one = avccSampleBytes(sampleSize);
  for (const off of offsets) {
    const rel = off - mdatPayloadStart;
    if (rel < 0 || rel + sampleSize > payload.length) throw new Error(`fillAvccSamples: offset ${off} ngoài payload mdat`);
    one.copy(payload, rel);
  }
}
function defaultSampleOffsets(): number[] {
  const out: number[] = [];
  for (let i = 0; i < 30; i++) out.push(32 + i * 1000);
  for (let i = 0; i < 30; i++) out.push(30032 + i * 1000);
  return out;
}

// ---------------------------------------------------------------------------
// Server HTTP Range thật (công thức H4/I6/K8/L8/M10, rút gọn).
// ---------------------------------------------------------------------------
async function serve(buf: Buffer): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end();
      return;
    }
    const range = req.headers.range ?? null;
    if (range === null) {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end(buf);
      return;
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m) {
      res.writeHead(400);
      res.end();
      return;
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? buf.length - 1 : Math.min(Number(m[2]), buf.length - 1);
    if (start >= buf.length || start > end) {
      res.setHeader("Content-Range", `bytes */${buf.length}`);
      res.writeHead(416);
      res.end();
      return;
    }
    res.setHeader("Content-Range", `bytes ${start}-${end}/${buf.length}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206);
    res.end(buf.subarray(start, end + 1));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
  return {
    url: `http://127.0.0.1:${addr.port}/file.mp4`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function buildControlFile(): Buffer {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  return Buffer.concat([ftypBox(), box("mdat", payload), moov]);
}

// ---------------------------------------------------------------------------
// Wiring: parseMp4VideoTrack gắn spsVuiFps từ avcC.
// ---------------------------------------------------------------------------
ok("(vui-wire) parse moov có avcC VUI fps 1.0 → track.spsVuiFps === 1", () => {
  const { moov } = buildMoov({ sampleCount: 60 });
  const track = parseMp4VideoTrack(
    moov.buffer.slice(moov.byteOffset, moov.byteOffset + moov.byteLength) as ArrayBuffer,
  );
  assert.equal(track.spsVuiFps, 1);
  assert.equal(track.spsVuiFixedFrameRate, true);
});
ok("(vui-wire) parse moov có avcC không VUI → track.spsVuiFps === null (fail-open)", () => {
  const { moov } = buildMoov({ sampleCount: 60, avcC: avcCBoxNoVui() });
  const track = parseMp4VideoTrack(
    moov.buffer.slice(moov.byteOffset, moov.byteOffset + moov.byteLength) as ArrayBuffer,
  );
  assert.equal(track.spsVuiFps, null);
  assert.equal(track.spsVuiFixedFrameRate, null);
});

// ---------------------------------------------------------------------------
// T3 thật qua server Range: guard VUI chặn moov-giả đổi tỉ lệ đều.
// ---------------------------------------------------------------------------
ok("(vui-t3) control có VUI (stts==mdhd==mvhd==VUI 1.0) + probe-true → gop-range cả 2 mode", async () => {
  const file = buildControlFile();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "gop-range", `stream: file thật có VUI phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => true });
    assert.equal(all.mode, "gop-range", `all: file thật có VUI phải qua, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
  } finally {
    await srv.close();
  }
});

ok("(vui-t3) NỢ (1) ĐÃ ĐÓNG: đổi tỉ lệ đều toàn bộ stts + sửa khớp mdhd/mvhd, SPS có VUI 1.0 → full-file /VUI/ cả 2 mode", async () => {
  // stts [[60,500]] (fps 2.0) + mdhd/mvhd 30000: lớp (a)–(c) đều mù,
  // chỉ kiểm (d) VUI 1.0 bắt được. Đây là test khóa nợ M10 §4 — ở M10
  // cùng file này vẫn gop-range (lọt).
  const { moov } = buildMoov({ sampleCount: 60, sttsEntries: [[60, 500]], mdhdDuration: 30000, mvhdDuration: 30000 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "full-file", `stream: đổi tỉ lệ đều + VUI phải bị chặn, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /VUI/);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => true });
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /VUI/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("(vui-t3) đổi tỉ lệ đều + sửa khớp mdhd/mvhd nhưng SPS KHÔNG có VUI → vẫn gop-range (lọt, fail-open — ghi rõ trong LIMITS)", async () => {
  const { moov } = buildMoov({ sampleCount: 60, sttsEntries: [[60, 500]], mdhdDuration: 30000, mvhdDuration: 30000, avcC: avcCBoxNoVui() });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "gop-range", "không có VUI thì không còn nguồn độc lập — lọt là hành vi đã biết, fail-open");
  } finally {
    await srv.close();
  }
});

ok("(vui-t3) NỢ (2) CÒN LẠI: hoán đổi khối delta VFR [[50,1000],[10,2000]] → [[10,2000],[50,1000]], VUI 1.0 → vẫn gop-range (cả bản gốc lẫn bản hoán đổi đều qua)", async () => {
  const mkFile = (sttsEntries: Array<[number, number]>): Buffer => {
    const { moov } = buildMoov({ sampleCount: 60, sttsEntries, mdhdDuration: 70000, mvhdDuration: 70000 });
    const payload = zeros(600_000);
    fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
    return Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  };
  const probe: GopTrialDecodeProbe = async () => true;
  const orig = await serve(mkFile([[50, 1000], [10, 2000]]));
  try {
    const r = await fetchVideoTrackByGopRange(orig.url, { streamGops: true, trialDecodeProbe: probe });
    assert.equal(r.mode, "gop-range", `bản gốc VFR phải qua, nhận ${r.mode === "full-file" ? r.reason : r.mode}`);
  } finally {
    await orig.close();
  }
  const swapped = await serve(mkFile([[10, 2000], [50, 1000]]));
  try {
    const r = await fetchVideoTrackByGopRange(swapped.url, { streamGops: true, trialDecodeProbe: probe });
    assert.equal(r.mode, "gop-range", "hoán đổi delta giữ nguyên mọi thống kê tổng hợp nên vẫn lọt — ghi rõ trong LIMITS");
  } finally {
    await swapped.close();
  }
});

ok("(vui-t3) file thật keyframe-video.mp4 (VUI 30fps, stts 30fps) → gop-range cả 2 mode (không chặn oan file thật)", async () => {
  const rel = "server/render/demos/keyframe-video.mp4";
  const abs = "/home/hatch/workspace/repo-1/server/render/demos/keyframe-video.mp4";
  const path = existsSync(rel) ? rel : abs;
  assert.ok(existsSync(path), `không tìm thấy file thật ${rel} (chạy từ gốc repo)`);
  const file = readFileSync(path);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "gop-range", `stream: file thật phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => true });
    assert.equal(all.mode, "gop-range", `all: file thật phải qua, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
    console.log(`    đo: file=${file.length} byte, 180 sample, VUI 30fps`);
  } finally {
    await srv.close();
  }
});

void runAll();
