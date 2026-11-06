// gopMoovLarge43Y4.test.ts — Moov lớn thật + moov cuối file cho đường GOP
// (Phase 9 đợt 43, luồng Y4; đóng nợ đợt 42 §5.5 "moov 16 MiB thật").
//
// Chạy bằng esbuild bundle (như T3/V2/W4/X4):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopMoovLarge43Y4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r43y4-moov.test.cjs \
//     && node /tmp/r43y4-moov.test.cjs
// (chạy từ gốc repo).
//
// PHÁT HIỆN TRUNG TÂM (đọc kỹ trước khi trích dẫn): với tiền tố mặc định
// 512 KiB, mọi moov > 512 KiB đều bị cổng gate chặn ở bước quét tiền tố
// (detectMoovPosition trả "unknown" vì box moov cắt dở ở cuối tiền tố),
// TRƯỚC KHI T3 kịp tới nhánh fetch moov riêng hay trần 16 MiB. Nghĩa là
// nhánh fetch moov riêng của T3 (bước 5, khi moov tràn tiền tố) và trần
// maxMoovBytes 16 MiB KHÔNG BAO GIỜ chạm tới được với prefix mặc định:
// scanTopBoxes cũng dừng ở box cắt dở nên moovBox luôn nằm gọn trong
// tiền tố khi tìm thấy. Đây là giới hạn kiến trúc, KHÔNG phải bug crash:
// file moov lớn vẫn fallback an toàn về full-file, không sai dữ liệu,
// không fetch thừa. Muốn GOP chạy được trên moov > 512 KiB phải đổi
// thiết kế (đọc header moov rồi fetch range moov trước khi gate, hoặc
// tăng tiền tố) — việc của đợt sau, file này chỉ KHÓA hành vi hiện tại
// bằng test để đợt sau khỏi tưởng trần 16 MiB đang có tác dụng.
//
// Test dùng buffer tổng hợp + fake fetch (không cần fixture 16 MiB thật
// trong repo — cấm binary): tiền tố của file moov 16 MiB thật và tiền tố
// tổng hợp là byte-identical ở 512 KiB đầu (ftyp + header moov khai
// 16 MiB + phần đầu moov), nên gate/scan cho cùng kết quả; file moov
// 16 MiB thật (tạo bằng script make-moov-large-fixture-43y4.py) được đo
// riêng bằng harness Node/headed trong LIMITS Y4, không nằm trong test này.
import assert from "node:assert/strict";
import {
  detectMoovPosition,
  resolveRangeGopFetch,
} from "./reverseRangeGate38U2.ts";
import {
  fetchVideoTrackByGopRange,
  scanTopBoxes,
} from "./gopRangeFetch39T3.ts";
import type { GopRangeFetchFn, GopRangeResponse } from "./gopRangeFetch39T3.ts";
import { resolveGopRangeWiring } from "./gopCache40V2.ts";

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
  console.log(`gopMoovLarge43Y4: ${pass}/${queue.length} test pass`);
}

const PREFIX = 512 * 1024;
const MOOV_16MIB = 16 * 1024 * 1024;

function boxHeader(size: number, type: string): Buffer {
  const b = Buffer.alloc(8);
  b.writeUInt32BE(size, 0);
  b.write(type, 4, "latin1");
  return b;
}

/** Tiền tố của file faststart có moov khai `moovSize` byte (box cắt dở
 *  ở cuối tiền tố khi moovSize > tiền tố — đúng như file thật). */
function largeMoovPrefix(moovSize: number, prefixLen = PREFIX): Buffer {
  const buf = Buffer.alloc(prefixLen, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  buf.write("isom", 8, "latin1");
  boxHeader(moovSize, "moov").copy(buf, 24);
  return buf;
}

/** Fake fetch phục vụ từ buffer tiền tố + tổng file khai báo; ghi lại
 *  mọi range đã xin để assert "không fetch vượt tiền tố". */
function fakeFetchFor(prefix: Buffer, total: number): {
  fetchImpl: GopRangeFetchFn;
  maxEndSeen: () => number;
  rangesSeen: string[];
} {
  const rangesSeen: string[] = [];
  let maxEnd = -1;
  const headers = (extra: Record<string, string>) => ({
    get: (name: string) => extra[name.toLowerCase()] ?? null,
  });
  const fetchImpl: GopRangeFetchFn = async (url, init) => {
    void url;
    if (init?.method === "HEAD") {
      return {
        status: 200,
        headers: headers({ "accept-ranges": "bytes", "content-length": String(total) }),
        arrayBuffer: async () => new ArrayBuffer(0),
        body: { cancel: async () => {} },
      } as unknown as GopRangeResponse;
    }
    const range = init?.headers?.Range ?? "";
    rangesSeen.push(range);
    const m = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!m) throw new Error(`fake fetch nhận range lạ: ${range}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    maxEnd = Math.max(maxEnd, end);
    if (end >= prefix.length) {
      // File thật còn tiếp sau tiền tố, nhưng T3 đúng ra không bao giờ
      // xin vượt tiền tố ở đường fallback này — trả 416 để lộ bug nếu có.
      return {
        status: 416,
        headers: headers({ "content-range": `bytes */${total}` }),
        arrayBuffer: async () => new ArrayBuffer(0),
        body: { cancel: async () => {} },
      } as unknown as GopRangeResponse;
    }
    const slice = prefix.subarray(start, end + 1);
    return {
      status: 206,
      headers: headers({
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${total}`,
      }),
      arrayBuffer: async () =>
        slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength),
      body: { cancel: async () => {} },
    } as unknown as GopRangeResponse;
  };
  return { fetchImpl, maxEndSeen: () => maxEnd, rangesSeen };
}

// ---- Gate/scan trên tiền tố moov lớn ----
ok("gate: moov khai 16 MiB cắt dở ở cuối tiền tố 512 KiB → unknown (không đoán faststart)", () => {
  assert.equal(detectMoovPosition(new Uint8Array(largeMoovPrefix(MOOV_16MIB))), "unknown");
  const d = resolveRangeGopFetch({
    moovPosition: "unknown",
    acceptRanges: "bytes",
    knownSizeBytes: 50_000_000,
  });
  assert.equal(d.mode, "full-file");
  assert.ok(d.reasons.join(" ").includes("moov-unknown"));
});

ok("gate: biên chính xác — moov 512 KiB + 1 byte (vừa tràn tiền tố) cũng unknown", () => {
  assert.equal(detectMoovPosition(new Uint8Array(largeMoovPrefix(PREFIX + 1))), "unknown");
});

ok("scan: tiền tố moov 16 MiB chỉ thấy ftyp, không thấy moov (box cắt dở thì dừng)", () => {
  const boxes = scanTopBoxes(new Uint8Array(largeMoovPrefix(MOOV_16MIB)));
  assert.deepEqual(boxes.map((b) => b.type), ["ftyp"]);
  assert.ok(!boxes.some((b) => b.type === "moov"));
});

// ---- T3 trên file moov lớn (fake fetch) ----
// ROUND44-Z4 — hai test dưới đây là hành vi CŨ mà đợt 44 thiết kế
// lại có chủ ý (xem gopMoovHeader44Z4.test.ts): T3 nay phân giải
// header moov cắt dở và FETCH RANGE MOOV trước khi kết luận, nên
// file moov lớn không còn fallback ở gate `moov-unknown` nữa. Fake
// ở đây chỉ phục vụ tiền tố (range vượt tiền tố → 416) nên kết quả
// vẫn là full-file, nhưng qua nhánh fetch moov (moov-status-416),
// không phải qua gate — đó chính là bằng chứng đường mới đã chạy.
// Các test gate/scan/wiring trong file này GIỮ NGUYÊN (gate tầng
// tiền tố vẫn trả unknown như cũ).
ok("T3: file moov 16 MiB → full-file qua nhánh fetch moov (không còn gate moov-unknown), 0 GOP", async () => {
  const prefix = largeMoovPrefix(MOOV_16MIB);
  const total = 51_000_000;
  const fake = fakeFetchFor(prefix, total);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: total,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.ok(out.reason.includes("moov-status-416"), `lý do thật: ${out.reason}`);
  assert.ok(!out.reason.includes("moov-unknown"), `không còn fallback ở gate: ${out.reason}`);
  assert.deepEqual(
    out.requests.map((r) => r.kind),
    ["head", "probe", "prefix", "moov"],
  );
  assert.ok(!out.requests.some((r) => r.kind === "gop"));
});

ok("T3: file moov 600 KiB (trên tiền tố nhưng dưới trần 16 MiB) nay thử fetch moov — trần 16 MiB đã chạm tới được", async () => {
  const prefix = largeMoovPrefix(600 * 1024);
  const total = 40_000_000;
  const fake = fakeFetchFor(prefix, total);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: total,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.ok(out.reason.includes("moov-status-416"), `lý do thật: ${out.reason}`);
  assert.ok(!out.reason.includes("moov-unknown"), `không còn fallback ở gate: ${out.reason}`);
  assert.ok(out.requests.some((r) => r.kind === "moov"));
  assert.ok(!out.requests.some((r) => r.kind === "gop"));
});

// ---- Moov cuối file ----
ok("gate: mdat nhỏ nằm gọn trong tiền tố rồi tới moov → trailing", () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(100, "mdat").copy(buf, 24);
  boxHeader(200, "moov").copy(buf, 124);
  assert.equal(detectMoovPosition(new Uint8Array(buf)), "trailing");
  const d = resolveRangeGopFetch({
    moovPosition: "trailing",
    acceptRanges: "bytes",
    knownSizeBytes: 40_000_000,
  });
  assert.equal(d.mode, "full-file");
  assert.ok(d.reasons.join(" ").includes("moov-trailing"));
});

ok("gate: file không faststart thật (mdat khổng lồ cắt dở tiền tố) → unknown, vẫn fallback an toàn", () => {
  const buf = Buffer.alloc(PREFIX, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(30_000_000, "mdat").copy(buf, 24);
  assert.equal(detectMoovPosition(new Uint8Array(buf)), "unknown");
});

ok("T3: file moov cuối (mdat nhỏ + moov sau, đủ trong tiền tố) → full-file, lý do moov-trailing, không GOP", async () => {
  const buf = Buffer.alloc(4096, 0);
  boxHeader(24, "ftyp").copy(buf, 0);
  boxHeader(100, "mdat").copy(buf, 24);
  boxHeader(200, "moov").copy(buf, 124);
  const total = 40_000_000;
  const fake = fakeFetchFor(buf, total);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: total,
    prefixBytes: 4096,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.ok(out.reason.includes("moov-trailing"), `lý do thật: ${out.reason}`);
  assert.ok(!out.requests.some((r) => r.kind === "gop"));
});

// ---- Khóa trần 128 MiB cho quyết định heap (bối cảnh Y4 §1) ----
ok("wiring: file 140 MiB, GOP bật, trần mặc định → khóa large-file (không thử GOP)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: 140 * 1024 * 1024,
  });
  assert.equal(d.useGop, false);
  assert.ok(d.reason.includes("gop-large-file-locked"));
});

ok("wiring: file 51 MiB (moov lớn + mdat) nằm trong (32, 128] MiB → đủ điều kiện wiring (gate mới là rào cản)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: 51 * 1024 * 1024,
  });
  assert.equal(d.useGop, true);
});

runAll();
