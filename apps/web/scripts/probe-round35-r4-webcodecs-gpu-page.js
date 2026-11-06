// Probe R4 đợt 35 — đo quiet + GPU cho đường WebCodecs (CHỈ ĐO, KHÔNG sửa
// code sản phẩm, KHÔNG nối Q3 vào preview).
// Chạy trong trang (Chrome headed qua pipe CDP), import module thật đã biên
// dịch ESM (mp4Demux.js, reverseWebcodecs.js) từ code hiện tại của repo.
// CÁCH DÙNG: chạy probe-round35-r4-webcodecs-gpu-pipe.mjs — pipe tự biên
// dịch 2 module ra scratch, symlink fixture, serve thư mục scratch rồi lái
// trang này theo từng lệnh (handshake window.__r4Cmd / __r4Result) để pipe
// ghi nhãn tải (loadavg + tiến trình Chrome khác + tiến trình nặng khác)
// TRƯỚC mỗi lượt decode. Trang KHÔNG tự chạy chuỗi đo dài: mỗi lượt decode
// là 1 lệnh riêng, nên nhãn tải gắn đúng lượt đó.
// Các lệnh (op): support | supportCodec | load | unload | decode | done.
// - decode: decode đúng 1 GOP [from, to] bằng ReverseFrameCache thật rồi
//   closeAll ngay — đỉnh giữ tối đa 1 GOP (300 frame), không giữ 900 frame
//   như thang bộ nhớ Q3, để tránh OOM trên VM khi đo song song đợt 35.
// - preferHardware của lệnh decode map thẳng sang cấu hình VideoDecoder
//   (prefer-hardware / prefer-software) của decodeGop; đường preview đã nối
//   ở đợt 34 Q2 gọi decodeGop với preferHardware=false (xem
//   ReversePreviewController), nên prefer-software là đường đang nối thật,
//   prefer-hardware là đường tiềm năng nếu máy có GPU.
import { parseMp4VideoTrack } from "./mp4Demux.js";
import { ReverseFrameCache } from "./reverseWebcodecs.js";

const fixtures = {};
let lastSeq = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitCmd() {
  for (;;) {
    const c = window.__r4Cmd;
    if (c && typeof c.seq === "number" && c.seq > lastSeq) return c;
    await sleep(100);
  }
}

function webglRendererInfo() {
  const out = { renderer: null, vendor: null };
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) { out.renderer = "no-webgl-context"; return out; }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    out.renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    out.vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
  } catch (e) { out.renderer = "error:" + String(e.message); }
  return out;
}

async function supportForCodec(codec) {
  const out = {};
  if (typeof VideoDecoder === "undefined") { out.error = "no-VideoDecoder"; return out; }
  for (const [name, cfg] of [
    ["prefer-software", { codec, codedWidth: 1280, codedHeight: 720, hardwareAcceleration: "prefer-software" }],
    ["prefer-hardware", { codec, codedWidth: 1280, codedHeight: 720, hardwareAcceleration: "prefer-hardware" }],
    ["default", { codec, codedWidth: 1280, codedHeight: 720 }],
  ]) {
    try {
      const r = await VideoDecoder.isConfigSupported(cfg);
      out[name] = { supported: !!r.supported };
    } catch (e) { out[name] = { error: String(e.message) }; }
  }
  return out;
}

async function loadOp(name, url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`fetch ${url} -> ${resp.status}`);
  const buf = await resp.arrayBuffer();
  const track = parseMp4VideoTrack(buf);
  const bytes = new Uint8Array(buf);
  fixtures[name] = {
    track,
    bytes,
    getData: (s) => bytes.subarray(s.offset, s.offset + s.size),
  };
  return {
    fixture: name,
    bytes: buf.byteLength,
    sampleCount: track.samples.length,
    keyIndices: track.samples.filter((s) => s.isKey).map((s) => s.index),
    width: track.width,
    height: track.height,
    codec: track.codec,
  };
}

function unloadOp(name) {
  if (fixtures[name]) { fixtures[name].bytes = null; delete fixtures[name]; }
  return { unloaded: name };
}

async function decodeOp(name, from, to, preferHardware) {
  const f = fixtures[name];
  if (!f) throw new Error("fixture chưa load: " + name);
  const cache = new ReverseFrameCache();
  const t0 = performance.now();
  const decoded = await cache.decodeGop(f.track, f.track.samples, from, to, f.getData, preferHardware);
  const wallSec = (performance.now() - t0) / 1000;
  const out = {
    fixture: name,
    from,
    to,
    preferHardware: !!preferHardware,
    decoded,
    expected: to - from + 1,
    wallSec: +wallSec.toFixed(3),
    fps: wallSec > 0 ? +(decoded / wallSec).toFixed(1) : 0,
    cacheSize: cache.size,
  };
  cache.closeAll();
  return out;
}

async function execOp(cmd) {
  switch (cmd.op) {
    case "support":
      return {
        hasVideoDecoder: typeof VideoDecoder !== "undefined",
        hasVideoFrame: typeof VideoFrame !== "undefined",
        webgl: webglRendererInfo(),
        codecAvc1_64001F: await supportForCodec("avc1.64001F"),
      };
    case "supportCodec":
      return { codec: cmd.codec, configs: await supportForCodec(cmd.codec) };
    case "load":
      return await loadOp(cmd.fixture, cmd.url);
    case "unload":
      return unloadOp(cmd.fixture);
    case "decode":
      return await decodeOp(cmd.fixture, cmd.from, cmd.to, !!cmd.preferHardware);
    default:
      throw new Error("op lạ: " + cmd.op);
  }
}

(async () => {
  window.__r4Stage = "ready";
  window.__r4Ready = true;
  try {
    for (;;) {
      const cmd = await waitCmd();
      lastSeq = cmd.seq;
      window.__r4Stage = "running-" + cmd.op;
      let res;
      try { res = await execOp(cmd); } catch (e) { res = { error: String((e && e.stack) || e) }; }
      window.__r4Result = { seq: cmd.seq, op: cmd.op, ...res };
      window.__r4Stage = "result";
      if (cmd.op === "done") break;
    }
  } catch (e) {
    try { window.__r4Result = { seq: -1, op: "fatal", error: String((e && e.stack) || e) }; } catch {}
  }
  window.__r4Stage = "done";
})();
