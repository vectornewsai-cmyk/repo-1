// reverseRangeGate38U2.test.ts — Khóa cổng Range theo GOP + đường
// truyền size proxy của đợt 38 U2 (nợ §3.4 của LIMITS đợt 37: khi có
// proxyUrl, preview không truyền item.file.size nên cổng S4 không áp
// dụng; hợp đồng Range cho nguồn http/proxy chưa có).
//
// Chạy bằng esbuild bundle (như S4/T5 — test import module có đuôi
// .ts, Node strip-types không resolve được import không đuôi của các
// module khác trong cây, nên dùng chung runner này cho chắc):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseRangeGate38U2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r38u2.test.cjs \
//     && node /tmp/r38u2.test.cjs
// (chạy từ gốc repo). Test thuần, KHÔNG cấp phát file lớn, KHÔNG
// fetch thật: cổng ở ngưỡng production được chứng minh bằng số byte
// và header giả lập — phép đo header thật trên bridge thuộc LIMITS
// §3, không thuộc test này.
import assert from "node:assert/strict";
import {
  acceptsByteRanges,
  checkRangeProbeResponse,
  detectMoovPosition,
  parseContentRange,
  resolveRangeGopFetch,
} from "./reverseRangeGate38U2.ts";
import {
  knownSizeBytesForPreview,
  proxyKnownSizeBytes,
} from "./proxy.ts";
import type { MediaItem } from "../media.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`reverseRangeGate38U2: ${pass}/${queue.length} test pass`);
}

// ---- Box top-level dựng tay (ftyp/moov/mdat rỗng, chỉ cần header) ----
function box(type: string, payloadLen = 0): Uint8Array {
  const out = new Uint8Array(8 + payloadLen);
  new DataView(out.buffer).setUint32(0, 8 + payloadLen);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  return out;
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
const ftyp = box("ftyp", 8);
const moov = box("moov", 4);
const mdat = box("mdat", 0);

// ---- detectMoovPosition ----
ok("moov trước mdat -> faststart", () => {
  assert.equal(detectMoovPosition(concat(ftyp, moov, mdat)), "faststart");
});
ok("mdat trước moov -> trailing", () => {
  assert.equal(detectMoovPosition(concat(ftyp, mdat, moov)), "trailing");
});
ok("chỉ thấy mdat, moov ngoài tiền tố -> unknown (không đoán)", () => {
  assert.equal(detectMoovPosition(concat(ftyp, mdat)), "unknown");
});
ok("tiền tố rỗng / cắt dở giữa header box -> unknown", () => {
  assert.equal(detectMoovPosition(new Uint8Array(0)), "unknown");
  assert.equal(detectMoovPosition(concat(ftyp).slice(0, 12)), "unknown");
});
ok("chỉ moov, chưa thấy mdat -> faststart (moov đã trước mọi mdat)", () => {
  assert.equal(detectMoovPosition(concat(ftyp, moov)), "faststart");
});

// ---- resolveRangeGopFetch: ma trận cho phép / chặn / fallback ----
const eligible = {
  moovPosition: "faststart" as const,
  acceptRanges: "bytes",
  knownSizeBytes: 10230557,
};
ok("đủ 3 điều kiện -> được THỬ Range (attempt, chưa phải range thật)", () => {
  const d = resolveRangeGopFetch(eligible);
  assert.equal(d.eligible, true);
  assert.equal(d.mode, "range-gop-attempt");
});
ok("moov trailing -> fallback (dù server hỗ trợ Range + biết size)", () => {
  const d = resolveRangeGopFetch({ ...eligible, moovPosition: "trailing" });
  assert.equal(d.eligible, false);
  assert.equal(d.mode, "full-file");
});
ok("moov unknown -> fallback (không suy faststart từ quy trình tạo file)", () => {
  const d = resolveRangeGopFetch({ ...eligible, moovPosition: "unknown" });
  assert.equal(d.mode, "full-file");
});
ok("thiếu Accept-Ranges -> fallback (không giả định server hỗ trợ)", () => {
  const d = resolveRangeGopFetch({ ...eligible, acceptRanges: null });
  assert.equal(d.mode, "full-file");
  const d2 = resolveRangeGopFetch({ ...eligible, acceptRanges: undefined });
  assert.equal(d2.mode, "full-file");
});
ok("Accept-Ranges none -> fallback", () => {
  const d = resolveRangeGopFetch({ ...eligible, acceptRanges: "none" });
  assert.equal(d.mode, "full-file");
});
ok("Accept-Ranges Bytes (hoa/thường, khoảng trắng) -> vẫn được thử", () => {
  assert.equal(acceptsByteRanges("Bytes"), true);
  assert.equal(acceptsByteRanges("  bytes  "), true);
  assert.equal(acceptsByteRanges("none"), false);
  assert.equal(resolveRangeGopFetch({ ...eligible, acceptRanges: "Bytes" }).eligible, true);
});
ok("chưa biết size -> fallback (không tính được range đuôi)", () => {
  assert.equal(resolveRangeGopFetch({ ...eligible, knownSizeBytes: null }).mode, "full-file");
  assert.equal(resolveRangeGopFetch({ ...eligible, knownSizeBytes: 0 }).mode, "full-file");
  assert.equal(resolveRangeGopFetch({ ...eligible, knownSizeBytes: NaN }).mode, "full-file");
});

// ---- parseContentRange + checkRangeProbeResponse ----
ok("parse Content-Range đúng / sai dạng", () => {
  assert.deepEqual(parseContentRange("bytes 0-99/10230557"), {
    start: 0,
    end: 99,
    total: 10230557,
  });
  assert.equal(parseContentRange("bytes */10230557"), null);
  assert.equal(parseContentRange("bytes 100-99/10230557"), null);
  assert.equal(parseContentRange(null), null);
});
ok("206 khớp range + tổng -> range-ok", () => {
  const c = checkRangeProbeResponse(206, "bytes 0-99/10230557", { start: 0, end: 99 }, 10230557);
  assert.equal(c.outcome, "range-ok");
});
ok("200 (server phớt lờ Range) -> fallback", () => {
  const c = checkRangeProbeResponse(200, null, { start: 0, end: 99 }, 10230557);
  assert.equal(c.outcome, "fallback-full-file");
});
ok("206 lệch range hoặc lệch tổng -> fallback", () => {
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-199/10230557", { start: 0, end: 99 }, 10230557).outcome,
    "fallback-full-file",
  );
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-99/999", { start: 0, end: 99 }, 10230557).outcome,
    "fallback-full-file",
  );
  assert.equal(
    checkRangeProbeResponse(416, null, { start: 0, end: 99 }, 10230557).outcome,
    "fallback-full-file",
  );
});

// ---- Đường truyền size proxy (proxy.ts) ----
const item = (over: Partial<MediaItem>): MediaItem => ({
  id: "m1",
  name: "a.mp4",
  kind: "video",
  url: "blob:x",
  duration: 10,
  file: new File(["x"], "a.mp4", { type: "video/mp4" }),
  ...over,
});
ok("có proxy + proxySizeBytes -> truyền size proxy thật (không phải file.size)", () => {
  const it = item({ proxyUrl: "http://127.0.0.1:8787/api/proxy/file/p.mp4", proxySizeBytes: 10230557 });
  assert.equal(proxyKnownSizeBytes(it), 10230557);
  assert.equal(knownSizeBytesForPreview(it), 10230557);
});
ok("có proxy nhưng chưa biết proxySize -> undefined, KHÔNG rơi về file.size", () => {
  const it = item({ proxyUrl: "http://127.0.0.1:8787/api/proxy/file/p.mp4" });
  assert.equal(proxyKnownSizeBytes(it), undefined);
  assert.equal(knownSizeBytesForPreview(it), undefined);
});
ok("proxySizeBytes rác (0/âm/NaN) -> coi như chưa biết", () => {
  assert.equal(proxyKnownSizeBytes(item({ proxyUrl: "u", proxySizeBytes: 0 })), undefined);
  assert.equal(proxyKnownSizeBytes(item({ proxyUrl: "u", proxySizeBytes: -5 })), undefined);
  assert.equal(proxyKnownSizeBytes(item({ proxyUrl: "u", proxySizeBytes: NaN })), undefined);
});
ok("không proxy -> truyền file.size như cũ (đường S4 gốc không đổi)", () => {
  const it = item({});
  assert.equal(knownSizeBytesForPreview(it), 1);
});

void runAll();
