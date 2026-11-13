/**
 * codecProbe74B3.test.ts — Phase 9 đợt 74, luồng B3: codec-probe lúc
 * import (đóng nợ đợt 73 §4 mục 7, A7 §4.3 S5 — xem
 * apps/web/src/lib/codecProbe.ts).
 *
 * Khóa bằng hàm thuần (không cần DOM/trình duyệt):
 *  - Sniff MP4: stsd avc1/av01/hvc1 → đúng tag; header cắt / rác /
 *    format lạ → null.
 *  - Sniff WebM: phần tử EBML CodecID 0x86 → đúng tag; chuỗi "V_VP9"
 *    thô KHÔNG có 0x86 → null (parse cấu trúc, không quét chuỗi).
 *  - Verdict: codec đã sniff quyết định (HEVC "" → unsupported dù
 *    H.264 probably); không sniff được thì lấy tốt nhất, chỉ
 *    unsupported khi mọi ứng viên đều ""; MSE chỉ ghi nhận.
 *  - Tên file mẫu theo container (sampleMime.ts): mp4 → .mp4, webm → .webm.
 *
 * Chạy (từ gốc repo — KHÔNG chạy trực tiếp bằng node strip-types vì
 * sampleMedia.ts import "./sampleMime" không đuôi .ts, Node ESM từ chối):
 *   node scripts/run-node-test.mjs apps/web/src/lib/codecProbe74B3.test.ts
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import {
  candidateMimesFor,
  extensionOfFileName,
  probeCodecSupport,
  sniffMp4Codec,
  sniffWebmCodec,
  type CodecProbeEnv,
} from "./codecProbe.ts";
import { extensionForContainer } from "./sampleMime.ts";
import { recordPackMedia } from "./sampleMedia.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function test(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}

// --- Builder MP4/WebM tổng hợp (đủ cấu trúc thật để parser chạy) ---------
function u32(n: number): number[] {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}
function ascii(s: string): number[] {
  return [...s].map((c) => c.charCodeAt(0));
}
function box(type: string, payload: number[]): number[] {
  return [...u32(8 + payload.length), ...ascii(type), ...payload];
}
/** MP4 tối thiểu: ftyp + moov/trak/mdia/minf/stbl/stsd(entry format cho trước). */
function mp4With(format: string): Uint8Array {
  const entry = box(format, [0, 0, 0, 0, 0, 0, 0, 0]);
  const stsd = box("stsd", [0, 0, 0, 0, 0, 0, 0, 1, ...entry]);
  const stbl = box("stbl", stsd);
  const minf = box("minf", stbl);
  const mdia = box("mdia", minf);
  const trak = box("trak", mdia);
  const moov = box("moov", trak);
  const ftyp = box("ftyp", [...ascii("isom"), 0, 0, 0, 0]);
  return new Uint8Array([...ftyp, ...moov]);
}
/** WebM tối thiểu: phần tử CodecID 0x86 + vint size + chuỗi codec. */
function webmWith(codecId: string): Uint8Array {
  const id = ascii(codecId);
  return new Uint8Array([0x86, 0x80 | id.length, ...id]);
}

// --- Env giả: bảng canPlayType theo đúng chuỗi mime của module -----------
function fakeEnv(
  table: Record<string, string>,
  mse?: Record<string, boolean>,
): CodecProbeEnv {
  const env: CodecProbeEnv = { canPlayType: (m: string) => table[m] ?? "" };
  if (mse) env.isTypeSupported = (m: string) => mse[m] ?? false;
  return env;
}
/** Env kiểu Chromium 1254 trên VM này (đo thật bằng headless shell). */
const CHROMIUM_1254: Record<string, string> = {
  'video/webm;codecs="vp9"': "probably",
  'video/webm;codecs="vp8"': "probably",
  "video/webm": "maybe",
  'video/mp4;codecs="avc1.42E01E"': "probably",
  'video/mp4;codecs="hev1.1.6.L93.B0"': "",
  'video/mp4;codecs="av01.0.05M.08"': "probably",
  "video/mp4": "maybe",
  "audio/mpeg": "probably",
};
const CHROMIUM_1254_MSE: Record<string, boolean> = {
  'video/mp4;codecs="av01.0.05M.08"': true,
  'video/mp4;codecs="hev1.1.6.L93.B0"': false,
};

// --- 1. extensionOfFileName ----------------------------------------------
test("extensionOfFileName: thường hoá đuôi, không đuôi → rỗng", () => {
  assert.equal(extensionOfFileName("Clip.MP4"), "mp4");
  assert.equal(extensionOfFileName("a.b.c.webm"), "webm");
  assert.equal(extensionOfFileName("noext"), "");
  assert.equal(extensionOfFileName(".hidden"), "");
  assert.equal(extensionOfFileName("trailing."), "");
});

// --- 2. sniffMp4Codec -----------------------------------------------------
test("sniffMp4Codec: stsd avc1/av01/hvc1 → đúng tag", () => {
  assert.equal(sniffMp4Codec(mp4With("avc1")), "avc1");
  assert.equal(sniffMp4Codec(mp4With("avc3")), "avc1");
  assert.equal(sniffMp4Codec(mp4With("av01")), "av1");
  assert.equal(sniffMp4Codec(mp4With("hvc1")), "hevc");
  assert.equal(sniffMp4Codec(mp4With("hev1")), "hevc");
  assert.equal(sniffMp4Codec(mp4With("mp4v")), "mp4v");
});

test("sniffMp4Codec: header cắt / rác / format lạ → null", () => {
  assert.equal(sniffMp4Codec(mp4With("avc1").slice(0, 20)), null);
  assert.equal(sniffMp4Codec(new Uint8Array([1, 2, 3, 4, 5])), null);
  assert.equal(sniffMp4Codec(new Uint8Array(0)), null);
  assert.equal(sniffMp4Codec(mp4With("xxxx")), null);
});

// --- 3. sniffWebmCodec ----------------------------------------------------
test("sniffWebmCodec: CodecID 0x86 → đúng tag", () => {
  assert.equal(sniffWebmCodec(webmWith("V_VP9")), "vp9");
  assert.equal(sniffWebmCodec(webmWith("V_VP8")), "vp8");
  assert.equal(sniffWebmCodec(webmWith("V_AV1")), "av1");
  assert.equal(sniffWebmCodec(webmWith("A_OPUS")), "opus");
  assert.equal(sniffWebmCodec(webmWith("A_VORBIS")), "vorbis");
});

test("sniffWebmCodec: chuỗi thô không 0x86 / rác → null (không quét chuỗi)", () => {
  assert.equal(sniffWebmCodec(new Uint8Array([...ascii("xxV_VP9yy")])), null);
  assert.equal(sniffWebmCodec(new Uint8Array([1, 2, 3])), null);
  assert.equal(sniffWebmCodec(new Uint8Array(0)), null);
  // 0x86 nhưng size sai (khai 3 byte, chuỗi không khớp) → null.
  assert.equal(sniffWebmCodec(new Uint8Array([0x86, 0x83, ...ascii("V_V")])), null);
});

// --- 4. probeCodecSupport — codec decisive -------------------------------
test("probe: webm VP9 đã sniff, Chromium → supported, probed đúng mime", () => {
  const r = probeCodecSupport(
    { name: "a.webm", type: "video/webm" },
    "vp9",
    fakeEnv(CHROMIUM_1254, CHROMIUM_1254_MSE),
  );
  assert.ok(r);
  assert.equal(r.verdict, "supported");
  assert.equal(r.codec, "VP9");
  assert.equal(r.codecLabel, "VP9 / WEBM");
  assert.equal(r.probedMime, 'video/webm;codecs="vp9"');
  assert.equal(r.canPlayType, "probably");
});

test("probe: MP4 HEVC đã sniff, Chromium (HEVC '') → unsupported dù H.264 probably", () => {
  const r = probeCodecSupport(
    { name: "clip.mp4", type: "video/mp4" },
    "hevc",
    fakeEnv(CHROMIUM_1254, CHROMIUM_1254_MSE),
  );
  assert.ok(r);
  assert.equal(r.verdict, "unsupported");
  assert.equal(r.codec, "HEVC");
  assert.equal(r.codecLabel, "HEVC / MP4");
  assert.equal(r.probedMime, 'video/mp4;codecs="hev1.1.6.L93.B0"');
  assert.equal(r.mseSupported, false);
  assert.equal(r.tried.length, 1);
});

test("probe: MP4 AV1 đã sniff, Safari cũ (AV1 '') → unsupported", () => {
  const r = probeCodecSupport(
    { name: "clip.mp4", type: "video/mp4" },
    "av1",
    fakeEnv({
      'video/mp4;codecs="avc1.42E01E"': "probably",
      'video/mp4;codecs="av01.0.05M.08"': "",
      "video/mp4": "maybe",
    }),
  );
  assert.ok(r);
  assert.equal(r.verdict, "unsupported");
  assert.equal(r.codec, "AV1");
});

test("probe: MP4 AV1 đã sniff, Chromium (AV1 probably) → supported", () => {
  const r = probeCodecSupport(
    { name: "clip.mp4", type: "video/mp4" },
    "av1",
    fakeEnv(CHROMIUM_1254),
  );
  assert.ok(r);
  assert.equal(r.verdict, "supported");
  assert.equal(r.probedMime, 'video/mp4;codecs="av01.0.05M.08"');
});

// --- 5. probeCodecSupport — không sniff được (fallback tốt nhất) ---------
test("probe: MP4 không sniff, mọi ứng viên '' → unsupported", () => {
  const r = probeCodecSupport({ name: "x.mp4", type: "video/mp4" }, null, fakeEnv({}));
  assert.ok(r);
  assert.equal(r.verdict, "unsupported");
  assert.equal(r.codecLabel, "H.264 / MP4"); // ứng viên đầu tiên khi hòa 0
  assert.equal(r.tried.length, 4);
});

test("probe: MP4 không sniff, H.264 probably → supported (không báo oan)", () => {
  const r = probeCodecSupport(
    { name: "x.mp4", type: "video/mp4" },
    null,
    fakeEnv(CHROMIUM_1254),
  );
  assert.ok(r);
  assert.equal(r.verdict, "supported");
  assert.equal(r.codec, "H.264");
});

test("probe: MP4 không sniff, chỉ generic maybe → maybe (không toast)", () => {
  const r = probeCodecSupport(
    { name: "x.mp4", type: "video/mp4" },
    null,
    fakeEnv({ "video/mp4": "maybe" }),
  );
  assert.ok(r);
  assert.equal(r.verdict, "maybe");
});

test("probe: WebM không sniff, mọi ứng viên '' → unsupported", () => {
  const r = probeCodecSupport({ name: "x.webm", type: "video/webm" }, null, fakeEnv({}));
  assert.ok(r);
  assert.equal(r.verdict, "unsupported");
});

// --- 6. Audio + kind lạ ---------------------------------------------------
test("probe: MP3 probably → supported; MSE ghi nhận, vắng MSE → null", () => {
  const r = probeCodecSupport(
    { name: "a.mp3", type: "audio/mpeg" },
    null,
    fakeEnv(CHROMIUM_1254, { "audio/mpeg": true }),
  );
  assert.ok(r);
  assert.equal(r.verdict, "supported");
  assert.equal(r.codec, "MP3");
  assert.equal(r.mseSupported, true);
  const r2 = probeCodecSupport({ name: "a.mp3", type: "audio/mpeg" }, null, fakeEnv(CHROMIUM_1254));
  assert.ok(r2);
  assert.equal(r2.mseSupported, null);
});

test("probe: file không rõ kind (txt) → null (bỏ qua lặng lẽ)", () => {
  assert.equal(probeCodecSupport({ name: "a.txt", type: "" }, null, fakeEnv({})), null);
  assert.equal(probeCodecSupport({ name: "a.txt", type: "text/plain" }, null, fakeEnv({})), null);
});

test("candidateMimesFor: mp4 sniff av1 chỉ có 1 ứng viên decisive", () => {
  const p = candidateMimesFor({ name: "x.mp4", type: "video/mp4" }, "av1");
  assert.ok(p);
  assert.equal(p.container, "mp4");
  assert.equal(p.candidates.length, 1);
  assert.equal(p.candidates[0]?.decisive, true);
});

// --- 7. Tên file mẫu theo container ---------------------------------------
test("extensionForContainer: mp4 → mp4, webm → webm, lạ → webm", () => {
  assert.equal(extensionForContainer("video/mp4"), "mp4");
  assert.equal(extensionForContainer("video/mp4;codecs=avc1.42E01E"), "mp4");
  assert.equal(extensionForContainer("video/webm"), "webm");
  assert.equal(extensionForContainer("video/webm;codecs=vp9"), "webm");
  assert.equal(extensionForContainer(undefined), "webm");
  assert.equal(extensionForContainer("text/plain"), "webm");
});

// --- 8. recordPackMedia: tên file theo container thật (mock recorder) ----
// Mô phỏng Safari: isTypeSupported(webm...) = false → MediaRecorder dùng
// mime mặc định video/mp4; Chromium: webm được hỗ trợ → ghi webm.
let mockSafari = false;
class FakePackRecorder {
  static isTypeSupported(_m: string) {
    return !mockSafari;
  }
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  constructor(_stream: unknown, opts?: { mimeType?: string }) {
    // Giống API thật: không truyền mimeType → recorder dùng mặc định của
    // trình duyệt (Safari: video/mp4; Chromium: mime đã chọn ở trên).
    this.mimeType = opts?.mimeType ?? (mockSafari ? "video/mp4" : "video/webm");
  }
  start() {
    this.state = "recording";
  }
  stop() {
    if (this.state !== "recording") {
      throw new DOMException("MediaRecorder stop khi inactive", "InvalidStateError");
    }
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["fake-frame-bytes"], { type: "video/webm" }) });
    this.onstop?.();
  }
}
function installPackMocks(safari: boolean): void {
  mockSafari = safari;
  const grad = { addColorStop() {} };
  const fakeCtx = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "createLinearGradient") return () => grad;
        return () => {};
      },
      set() {
        return true;
      },
    },
  );
  (globalThis as Record<string, unknown>).document = {
    createElement: (tag: string) => {
      if (tag !== "canvas") return {};
      return {
        width: 0,
        height: 0,
        getContext: () => fakeCtx,
        toDataURL: () => "data:image/jpeg;base64,AAAA",
        captureStream: () => ({ id: "fake-stream" }),
      };
    },
  };
  (globalThis as Record<string, unknown>).MediaRecorder =
    FakePackRecorder as unknown as typeof MediaRecorder;
  (globalThis as Record<string, unknown>).requestAnimationFrame = (
    cb: (t: number) => void,
  ) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
}

test("recordPackMedia: recorder mp4 (Safari) → tên .mp4, type video/mp4", async () => {
  installPackMocks(true);
  const v = await recordPackMedia("pack-x.webm", "16:9", 0.2, 0, "L", { timeoutMs: 10000 });
  assert.ok(v);
  assert.equal(v.file.name, "pack-x.mp4");
  assert.equal(v.file.type, "video/mp4");
});

test("recordPackMedia: recorder webm (Chromium) → tên .webm không đổi", async () => {
  installPackMocks(false);
  const v = await recordPackMedia("pack-x.webm", "16:9", 0.2, 0, "L", { timeoutMs: 10000 });
  assert.ok(v);
  assert.equal(v.file.name, "pack-x.webm");
  assert.equal(v.file.type, "video/webm");
});

void (async () => {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      fail++;
      failedNames.push(t.name);
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
    }
  }

  console.log(`\ncodecProbe74B3: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
  if (fail > 0) process.exitCode = 1;
})();
