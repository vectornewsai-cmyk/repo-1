// gopMoovHeader44Z4.test.ts — Thiết kế lại fetch moov riêng cho moov
// tràn tiền tố (Phase 9 đợt 44, luồng Z4; đóng nợ Y4 §6.2 "nhánh fetch
// moov riêng + trần 16 MiB là code chết với tiền tố mặc định").
//
// Chạy bằng esbuild bundle (như T3/Y4):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopMoovHeader44Z4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r44z4.test.cjs \
//     && node /tmp/r44z4.test.cjs
// (chạy từ gốc repo).
//
// THIẾT KẾ MỚI (đọc kỹ trước khi trích dẫn): gate
// `detectMoovPosition`/`resolveRangeGopFetch` GIỮ NGUYÊN (chỉ nhìn
// tiền tố) — file moov lớn vẫn cho gate `unknown` ở tầng prefix.
// Cái mới nằm ở T3, sau gate: `findTruncatedMoovHeader` phân biệt
// "moov không thấy" với "header moov đã thấy, chỉ thiếu thân box".
// Nếu header moov nằm gọn trong tiền tố, không có box mdat nào đứng
// trước nó (tức moov là box media đầu tiên → faststart đã chứng
// minh được từ thứ tự box, vì mọi box trước header moov đều nằm gọn
// trong tiền tố), T3 kiểm tra lại gate với `faststart` rồi fetch
// đúng range moov (kẹp bởi trần 16 MiB và tổng file) và demux từ
// buffer moov đó. Thứ tự kiểm tra giữ nguyên như đường cũ: gate
// trước (Accept-Ranges, size), rồi trần moov, rồi nhất quán với tổng
// file, rồi mới fetch — không fetch moov khi gate khác đã chặn.
// Moov cuối file thật (mdat khổng lồ trước moov, header moov không
// nằm trong tiền tố) vẫn fallback như cũ: không đoán moov ở đuôi.
//
// KHÔNG ĐỔI: tiền tố mặc định 512 KiB, trần moov 16 MiB, ngưỡng
// wiring (32, 128] MiB, mặc định GOP TẮT. Hai assertion T3 trong file
// Y4 (moov 16 MiB / 600 KiB → `moov-unknown`) là hành vi CŨ mà đợt
// này thiết kế lại có chủ ý: chúng được cập nhật kèm chú thích
// ROUND44-Z4 trong chính file Y4 (gate/scan/wiring của Y4 giữ nguyên).
//
// Test dùng fixture ffmpeg thật + moov phình bằng code trong test
// (nối box `free` vào cuối moov, dịch mọi entry stco/co64 đúng bằng
// delta — cùng kỹ thuật với script Python của Y4, nhưng chạy trong
// test để không cần binary ngoài repo): moov phình là moov THẬT mà
// parser đọc được, sample table dịch đúng, chunk GOP byte-khớp file
// gốc. Không dùng moov giả toàn số 0 cho đường gop-range.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchVideoTrackByGopRange,
  findTruncatedMoovHeader,
  scanTopBoxes,
} from "./gopRangeFetch39T3.ts";
import type { GopRangeFetchFn, GopRangeResponse } from "./gopRangeFetch39T3.ts";
import { detectMoovPosition } from "./reverseRangeGate38U2.ts";
import { parseMp4VideoTrack } from "./mp4Demux.ts";

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
  console.log(`gopMoovHeader44Z4: ${pass}/${queue.length} test pass`);
}

function boxHeader(size: number, type: string): Buffer {
  const b = Buffer.alloc(8);
  b.writeUInt32BE(size, 0);
  b.write(type, 4, "latin1");
  return b;
}

// ---- Helper: tiền tố tổng hợp ----
function synthPrefix(moovSize: number, prefixLen = 512 * 1024): Buffer {
  const buf = Buffer.alloc(prefixLen, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  buf.write("isom", 8, "latin1");
  boxHeader(moovSize, "moov").copy(buf, 24);
  return buf;
}

ok("helper: ftyp + header moov 16 MiB cắt dở → tìm đúng start/size, không mdat trước", () => {
  const h = findTruncatedMoovHeader(new Uint8Array(synthPrefix(16 * 1024 * 1024)));
  assert.ok(h !== null);
  assert.equal(h.start, 24);
  assert.equal(h.size, 16 * 1024 * 1024);
  assert.equal(h.header, 8);
  assert.equal(h.precededByMdat, false);
  // Gate tầng prefix vẫn unknown (gate không đổi) — T3 mới là tầng phân giải.
  assert.equal(detectMoovPosition(new Uint8Array(synthPrefix(16 * 1024 * 1024))), "unknown");
});

ok("helper: moov sau box free (không nằm ở đầu file) vẫn tìm đúng start", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(100, "free").copy(buf, 24);
  boxHeader(9000, "moov").copy(buf, 124);
  const h = findTruncatedMoovHeader(new Uint8Array(buf));
  assert.ok(h !== null);
  assert.equal(h.start, 124);
  assert.equal(h.size, 9000);
  assert.equal(h.precededByMdat, false);
});

ok("helper: moov nằm gọn trong tiền tố → null (đường cũ xử lý, không cần fetch riêng)", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(200, "moov").copy(buf, 24);
  boxHeader(300, "mdat").copy(buf, 224);
  assert.equal(findTruncatedMoovHeader(new Uint8Array(buf)), null);
});

ok("helper: header moov tự nó bị cắt ở cuối tiền tố (còn < 8 byte) → null, không đọc size dở", () => {
  const buf = Buffer.alloc(30, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  buf[24] = 0; buf[25] = 0; buf[26] = 0x10; buf[27] = 0x00; // size 4096, thiếu type
  assert.equal(findTruncatedMoovHeader(new Uint8Array(buf)), null);
});

ok("helper: moov largesize (size==1 + 64-bit) cắt dở → size/header 16 đúng", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  buf.writeUInt32BE(1, 24);
  buf.write("moov", 28, "latin1");
  buf.writeBigUInt64BE(BigInt(5 * 1024 * 1024), 32);
  const h = findTruncatedMoovHeader(new Uint8Array(buf));
  assert.ok(h !== null);
  assert.equal(h.start, 24);
  assert.equal(h.size, 5 * 1024 * 1024);
  assert.equal(h.header, 16);
  assert.equal(h.precededByMdat, false);
});

ok("helper: mdat nằm gọn đứng trước moov → precededByMdat true (caller phải từ chối đường mới)", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(100, "mdat").copy(buf, 24);
  boxHeader(9000, "moov").copy(buf, 124);
  const h = findTruncatedMoovHeader(new Uint8Array(buf));
  assert.ok(h !== null);
  assert.equal(h.precededByMdat, true);
});

ok("helper: mdat khổng lồ cắt dở, không thấy header moov → null (moov cuối file thật)", () => {
  const buf = Buffer.alloc(512 * 1024, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(30_000_000, "mdat").copy(buf, 24);
  assert.equal(findTruncatedMoovHeader(new Uint8Array(buf)), null);
});

ok("helper: box free cắt dở đứng trước moov → null (không với tới header moov)", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(9000, "free").copy(buf, 24);
  assert.equal(findTruncatedMoovHeader(new Uint8Array(buf)), null);
});

ok("helper: moov size==0 (kéo tới hết file) → null, không fetch range vô hạn", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(0, "moov").copy(buf, 24);
  assert.equal(findTruncatedMoovHeader(new Uint8Array(buf)), null);
});

ok("helper: tiền tố không có moov → null", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  assert.equal(findTruncatedMoovHeader(new Uint8Array(buf)), null);
});

// ---- Fixture ffmpeg thật + moov phình (kỹ thuật Y4, viết lại bằng JS) ----
const dir = mkdtempSync(join(tmpdir(), "vcut-z4-"));
function makeFixture(name: string, faststart: boolean): Buffer {
  const out = join(dir, name);
  const args = [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10",
  ];
  if (faststart) args.push("-movflags", "+faststart");
  args.push(out);
  execFileSync("ffmpeg", args, { stdio: "pipe" });
  return readFileSync(out);
}
const fastBuf = makeFixture("faststart.mp4", true);
const trailBuf = makeFixture("trailing.mp4", false);
console.log(`  fixture faststart: ${fastBuf.length} byte, trailing: ${trailBuf.length} byte (ffmpeg testsrc2 320x240 30fps 2s, -g 10)`);

interface TopBoxInfo { type: string; start: number; size: number; header: number; }
function topBoxes(buf: Buffer): TopBoxInfo[] {
  const boxes = scanTopBoxes(new Uint8Array(buf));
  return boxes.map((b) => ({ type: b.type, start: b.start, size: b.size, header: b.header }));
}

/** Dịch mọi entry stco (32-bit) / co64 (64-bit) trong moov thêm delta.
 *  Chỉ đi sâu qua container trak/mdia/minf/stbl (nơi stco/co64 sống),
 *  không quét mù vào stsd hay box lá khác. `headerLen` là độ dài
 *  header ngoài cùng của moov (8, hoặc 16 khi largesize) — walk phải
 *  bắt đầu sau header đó, không phải luôn ở offset 8. */
function shiftChunkOffsets(moov: Buffer, delta: number, headerLen = 8): number {
  let count = 0;
  const view = new DataView(moov.buffer, moov.byteOffset, moov.byteLength);
  function walk(start: number, end: number): void {
    let off = start;
    while (off + 8 <= end) {
      let size = view.getUint32(off);
      const type = String.fromCharCode(view.getUint8(off + 4), view.getUint8(off + 5), view.getUint8(off + 6), view.getUint8(off + 7));
      let header = 8;
      if (size === 1) {
        if (off + 16 > end) return;
        const big = view.getBigUint64(off + 8);
        if (big > BigInt(Number.MAX_SAFE_INTEGER)) return;
        size = Number(big);
        header = 16;
      } else if (size === 0) {
        size = end - off;
      }
      if (size < header || off + size > end) return;
      if (type === "stco") {
        const n = view.getUint32(off + header + 4);
        for (let i = 0; i < n; i++) {
          const p = off + header + 8 + i * 4;
          view.setUint32(p, view.getUint32(p) + delta);
          count++;
        }
      } else if (type === "co64") {
        const n = view.getUint32(off + header + 4);
        for (let i = 0; i < n; i++) {
          const p = off + header + 8 + i * 8;
          view.setBigUint64(p, view.getBigUint64(p) + BigInt(delta));
          count++;
        }
      } else if (type === "trak" || type === "mdia" || type === "minf" || type === "stbl") {
        walk(off + header, off + size);
      }
      off += size;
    }
  }
  walk(headerLen, moov.length); // moov payload (bỏ header ngoài cùng)
  return count;
}

/** Phình moov của file faststart tới `targetMoovSize` bằng box `free`
 *  nối cuối moov; chèn thêm box free `freeBefore` trước moov nếu cần
 *  (để moov không nằm ở đầu file). Trả về file mới + delta stco. */
function inflateMoov(orig: Buffer, targetMoovSize: number, opts: { largesize?: boolean; freeBefore?: number } = {}): { buf: Buffer; delta: number; moovStart: number; moovSize: number; shifted: number } {
  const boxes = topBoxes(orig);
  const ftyp = boxes.find((b) => b.type === "ftyp")!;
  const moov = boxes.find((b) => b.type === "moov")!;
  const mdat = boxes.find((b) => b.type === "mdat")!;
  const middle = boxes.filter((b) => b.start > moov.start && b.start < mdat.start);
  const oldMoov = Buffer.from(orig.subarray(moov.start, moov.start + moov.size));
  const oldPayload = Buffer.from(oldMoov.subarray(moov.header));
  const headerLen = opts.largesize ? 16 : 8;
  const freeSize = targetMoovSize - headerLen - oldPayload.length;
  assert.ok(freeSize >= 8, `target ${targetMoovSize} quá nhỏ cho moov gốc ${moov.size}`);
  const freeBox = Buffer.concat([boxHeader(freeSize, "free"), Buffer.alloc(freeSize - 8, 0)]);
  const newMoovHeader = Buffer.alloc(headerLen);
  if (opts.largesize) {
    newMoovHeader.writeUInt32BE(1, 0);
    newMoovHeader.write("moov", 4, "latin1");
    newMoovHeader.writeBigUInt64BE(BigInt(targetMoovSize), 8);
  } else {
    newMoovHeader.writeUInt32BE(targetMoovSize, 0);
    newMoovHeader.write("moov", 4, "latin1");
  }
  const newMoov = Buffer.concat([newMoovHeader, oldPayload, freeBox]);
  assert.equal(newMoov.length, targetMoovSize);
  const freeBefore = opts.freeBefore ?? 0;
  const freeBeforeBox = freeBefore > 0
    ? Buffer.concat([boxHeader(freeBefore, "free"), Buffer.alloc(freeBefore - 8, 0)])
    : Buffer.alloc(0);
  const moovStart = ftyp.start + ftyp.size + freeBefore;
  const delta = freeBefore + targetMoovSize - moov.size;
  const shifted = shiftChunkOffsets(newMoov, delta, headerLen);
  assert.ok(shifted > 0, "không dịch được entry stco/co64 nào — fixture không hợp lệ cho test này");
  const parts: Buffer[] = [
    Buffer.from(orig.subarray(ftyp.start, ftyp.start + ftyp.size)),
    freeBeforeBox,
    newMoov,
  ];
  for (const m of middle) parts.push(Buffer.from(orig.subarray(m.start, m.start + m.size)));
  parts.push(Buffer.from(orig.subarray(mdat.start)));
  return { buf: Buffer.concat(parts), delta, moovStart, moovSize: targetMoovSize, shifted };
}

/** Fake fetch phục vụ range từ buffer (ghi lại range đã xin). `total`
 *  cho phép khai tổng file lớn hơn buffer tiền tố (test tổng hợp chỉ
 *  có tiền tố, như file Y4) mà vẫn qua được bước kiểm Content-Range
 *  của T3 — nếu không, T3 fail ở prefix total-mismatch trước khi tới
 *  logic moov cần test. */
function fakeServe(buf: Buffer, opts: { acceptRanges?: string; total?: number } = {}): { fetchImpl: GopRangeFetchFn; ranges: string[] } {
  const ranges: string[] = [];
  const acceptRanges = opts.acceptRanges ?? "bytes";
  const total = opts.total ?? buf.length;
  const headers = (extra: Record<string, string>) => ({
    get: (name: string) => extra[name.toLowerCase()] ?? null,
  });
  const fetchImpl: GopRangeFetchFn = async (url, init) => {
    void url;
    if (init?.method === "HEAD") {
      return {
        status: 200,
        headers: headers({ "accept-ranges": acceptRanges, "content-length": String(total) }),
        arrayBuffer: async () => new ArrayBuffer(0),
        body: { cancel: async () => {} },
      } as unknown as GopRangeResponse;
    }
    const range = init?.headers?.Range ?? "";
    ranges.push(range);
    const m = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!m) throw new Error(`fake fetch nhận range lạ: ${range}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    if (start >= buf.length || end >= buf.length) {
      return {
        status: 416,
        headers: headers({ "content-range": `bytes */${total}` }),
        arrayBuffer: async () => new ArrayBuffer(0),
        body: { cancel: async () => {} },
      } as unknown as GopRangeResponse;
    }
    const slice = buf.subarray(start, end + 1);
    return {
      status: 206,
      headers: headers({
        "accept-ranges": acceptRanges,
        "content-range": `bytes ${start}-${end}/${total}`,
      }),
      arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength),
      body: { cancel: async () => {} },
    } as unknown as GopRangeResponse;
  };
  return { fetchImpl, ranges };
}

ok("unit: moov phình + stco dịch cho cùng sample table (offset = gốc + delta)", () => {
  const orig = parseMp4VideoTrack(fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer);
  const inf = inflateMoov(fastBuf, 8192);
  const inflated = parseMp4VideoTrack(inf.buf.buffer.slice(inf.buf.byteOffset, inf.buf.byteOffset + inf.buf.byteLength) as ArrayBuffer);
  assert.equal(inflated.samples.length, orig.samples.length);
  for (let i = 0; i < orig.samples.length; i++) {
    assert.equal(inflated.samples[i].offset, orig.samples[i].offset + inf.delta);
    assert.equal(inflated.samples[i].size, orig.samples[i].size);
    assert.equal(inflated.samples[i].isKey, orig.samples[i].isKey);
  }
  console.log(`    đo: moov gốc ${topBoxes(fastBuf).find((b) => b.type === "moov")!.size} → 8192, delta=${inf.delta}, stco đã dịch=${inf.shifted}`);
});

ok("tích hợp: moov phình 8192 > tiền tố 4096 → gop-range, 6 GOP, chunk byte-khớp gốc, đúng 1 request moov", async () => {
  const inf = inflateMoov(fastBuf, 8192);
  const fake = fakeServe(inf.buf);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: inf.buf.length,
    prefixBytes: 4096,
  });
  assert.equal(out.mode, "gop-range");
  if (out.mode !== "gop-range") return;
  assert.equal(out.gops.length, 6);
  assert.equal(out.sampleCount, 60);
  const orig = parseMp4VideoTrack(fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer);
  let checked = 0;
  for (const gop of out.gops) {
    for (let k = 0; k < gop.chunks.length; k++) {
      const si = gop.firstSampleIndex + k;
      const s = orig.samples[si];
      const expect = new Uint8Array(fastBuf.subarray(s.offset, s.offset + s.size));
      const got = gop.chunks[k].data;
      assert.equal(got.length, expect.length, `sample ${si} dài khác`);
      assert.ok(got.every((v, i) => v === expect[i]), `sample ${si} byte khác`);
      checked++;
    }
  }
  assert.equal(checked, 60);
  const moovReqs = out.requests.filter((r) => r.kind === "moov");
  assert.equal(moovReqs.length, 1, `request moov: ${JSON.stringify(out.requests.map((r) => r.kind))}`);
  assert.equal(moovReqs[0].start, inf.moovStart);
  assert.equal(moovReqs[0].end, inf.moovStart + inf.moovSize - 1);
  assert.equal(moovReqs[0].bytes, inf.moovSize);
  assert.ok(!out.requests.some((r) => r.status !== 200 && r.status !== 206));
  console.log(`    đo: requests=${out.requests.map((r) => `${r.kind}:${r.start}-${r.end}`).join(",")}`);
});

ok("tích hợp: moov phình largesize 8200 > tiền tố 4096 → gop-range (parser đã hỗ trợ largesize)", async () => {
  const inf = inflateMoov(fastBuf, 8200, { largesize: true });
  const fake = fakeServe(inf.buf);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: inf.buf.length,
    prefixBytes: 4096,
  });
  assert.equal(out.mode, "gop-range");
  if (out.mode !== "gop-range") return;
  assert.equal(out.gops.length, 6);
  assert.equal(out.sampleCount, 60);
  const moovReqs = out.requests.filter((r) => r.kind === "moov");
  assert.equal(moovReqs.length, 1);
  assert.equal(moovReqs[0].bytes, 8200);
});

ok("tích hợp: moov sau box free 100 byte (không nằm ở đầu file) + phình → gop-range, moov start = 132", async () => {
  const inf = inflateMoov(fastBuf, 8192, { freeBefore: 100 });
  assert.equal(inf.moovStart, 132);
  const fake = fakeServe(inf.buf);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: inf.buf.length,
    prefixBytes: 4096,
  });
  assert.equal(out.mode, "gop-range");
  if (out.mode !== "gop-range") return;
  assert.equal(out.sampleCount, 60);
  const moovReqs = out.requests.filter((r) => r.kind === "moov");
  assert.equal(moovReqs.length, 1);
  assert.equal(moovReqs[0].start, 132);
});

ok("guard: moov phình nhưng trần override 4096 → full-file moov-too-large, 0 request moov (trần nay chạm tới được)", async () => {
  const inf = inflateMoov(fastBuf, 8192);
  const fake = fakeServe(inf.buf);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: inf.buf.length,
    prefixBytes: 4096,
    maxMoovBytes: 4096,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.match(out.reason, /moov-too-large/);
  assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
  assert.deepEqual(out.requests.map((r) => r.kind), ["head", "probe", "prefix"]);
});

ok("guard: moov khai vượt tổng file → full-file moov-out-of-file, 0 request moov", async () => {
  const prefix = synthPrefix(100_000, 4096);
  const total = 50_000;
  const fake = fakeServe(prefix, { total });
  // Fake trên chỉ phục vụ 4096 byte tiền tố nhưng khai tổng đúng
  // 50.000; T3 phải từ chối trước khi xin range moov (vì start+size
  // > tổng), nên không bao giờ chạm 416.
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: total,
    prefixBytes: 4096,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.match(out.reason, /moov-out-of-file/);
  assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
});

ok("guard: Accept-Ranges none + moov phình → gate chặn trước, 0 request moov", async () => {
  const inf = inflateMoov(fastBuf, 8192);
  const fake = fakeServe(inf.buf, { acceptRanges: "none" });
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: inf.buf.length,
    prefixBytes: 4096,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.match(out.reason, /accept-ranges-unsupported/);
  assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
});

ok("guard: moov cuối file (trailing, tiền tố mặc định) vẫn full-file moov-trailing, 0 GOP/moov", async () => {
  const srv = await (async () => {
    // Server HTTP Range thật tối giản (như test T3) cho file trailing.
    const log: string[] = [];
    const server: Server = createServer((req, res) => {
      const range = req.headers.range ?? null;
      res.setHeader("Accept-Ranges", "bytes");
      if (req.method === "HEAD") {
        res.setHeader("Content-Length", trailBuf.length);
        res.writeHead(200); res.end(); return;
      }
      if (range === null) {
        res.setHeader("Content-Length", trailBuf.length);
        res.writeHead(200); res.end(trailBuf); return;
      }
      const m = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!m) { res.writeHead(400); res.end(); return; }
      const start = Number(m[1]);
      const end = m[2] === "" ? trailBuf.length - 1 : Math.min(Number(m[2]), trailBuf.length - 1);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${trailBuf.length}`);
      res.setHeader("Content-Length", end - start + 1);
      res.writeHead(206); res.end(trailBuf.subarray(start, end + 1));
      log.push(`${start}-${end}`);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
    return { url: `http://127.0.0.1:${addr.port}/file.mp4`, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
  })();
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /moov-trailing/);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
  } finally {
    await srv.close();
  }
});

ok("guard: mdat khổng lồ cắt dở, không thấy moov → vẫn full-file moov-unknown, 0 moov", async () => {
  const prefix = Buffer.alloc(512 * 1024, 0);
  boxHeader(24, "ftyp").copy(prefix, 0);
  boxHeader(30_000_000, "mdat").copy(prefix, 24);
  const fake = fakeServe(prefix, { total: 40_000_000 });
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: 40_000_000,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.match(out.reason, /moov-unknown/);
  assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
