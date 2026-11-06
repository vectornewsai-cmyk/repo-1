// Probe P5 chạy trong trang: demux MP4 THẬT (module P5) + decode GOP qua
// ReverseFrameCache + present ngược từ cache + decode-ahead + thí nghiệm
// flush chunk đơn (nợ O5 §2.4). Không phải code sản phẩm preview.
// CÁCH DÙNG (bản này nằm trong repo chỉ để lưu trữ/tái chạy): copy file
// này về scratch (ví dụ ~/workspace/tmp-round32-p5/wc/page.js) cùng với
// mp4Demux.js + reverseWebcodecs.js đã biên dịch ESM từ
// apps/web/src/lib/ (tsc --module esnext, xem LIMITS P5), các fixture
// MP4 (sparse/dense-gop-flat.mp4, noise-10s.mp4 tùy chọn), rồi chạy
// probe-round32-p5-webcodecs-pipe.mjs với P5_SCRATCH trỏ tới scratch đó.
import { parseMp4VideoTrack, gopStartFor, reverseWindowFor } from "./mp4Demux.js";
import { ReverseFrameCache } from "./reverseWebcodecs.js";

const out = { errors: [], support: {}, fixtures: {}, singleFlush: null, decodeAhead: null };
const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const prog = (st) => { try { window.__p5Progress = st; } catch {} };

try {
  prog("start");
  out.hasVideoDecoder = typeof VideoDecoder !== "undefined";
  if (out.hasVideoDecoder) {
    for (const accel of ["prefer-hardware", "prefer-software"]) {
      try {
        const r = await VideoDecoder.isConfigSupported({ codec: "avc1.64001F", codedWidth: 1280, codedHeight: 720, hardwareAcceleration: accel });
        out.support[accel] = !!r.supported;
      } catch (e) { out.support[accel] = "error:" + String(e && e.message || e); }
    }
  }
  async function measureFixture(name, gopFrames) {
    prog(name + "-fetch");
    const tFetch0 = performance.now();
    const resp = await fetch("/" + name);
    const buf = await resp.arrayBuffer();
    const tFetch1 = performance.now();
    const tDemux0 = performance.now();
    const track = parseMp4VideoTrack(buf);
    const tDemux1 = performance.now();
    const bytes = new Uint8Array(buf);
    const getData = (s) => bytes.subarray(s.offset, s.offset + s.size);
    const canvas = document.createElement("canvas"); canvas.width = track.width; canvas.height = track.height;
    const ctx = canvas.getContext("2d");
    // 1 GOP đầu (keyframe 0..gopFrames-1) qua ReverseFrameCache thật.
    const cache = new ReverseFrameCache();
    const tDec0 = performance.now();
    const decoded = await cache.decodeGop(track, track.samples, 0, gopFrames - 1, getData, false);
    const tDec1 = performance.now();
    const decWall = (tDec1 - tDec0) / 1000;
    const tPres0 = performance.now();
    const pres = cache.presentReverse(0, gopFrames - 1, (f) => { ctx.drawImage(f, 0, 0); });
    const tPres1 = performance.now();
    const presWall = (tPres1 - tPres0) / 1000;
    // Decode-ahead: trong lúc present cửa sổ 2 (GOP tiếp theo theo chiều
    // ngược = GOP trước đó; ở đây mô phỏng bằng GOP 2 xuôi vì cửa sổ 1
    // đã ở đầu file), decode GOP 2 nền bằng cache thứ hai, đo xem decode
    // có xong trước khi present xong không.
    const cache2 = new ReverseFrameCache();
    const gop2Start = gopFrames;
    const gop2End = Math.min(track.samples.length - 1, gopFrames * 2 - 1);
    const tAh0 = performance.now();
    const decAheadPromise = cache2.decodeGop(track, track.samples, gop2Start, gop2End, getData, false);
    const pres2 = cache.presentReverse(0, gopFrames - 1, (f) => { ctx.drawImage(f, 0, 0); });
    const tPres2End = performance.now();
    const decodedAhead = await decAheadPromise;
    const tAh1 = performance.now();
    const res = {
      bytes: buf.byteLength, fetchMs: +(tFetch1 - tFetch0).toFixed(1),
      demuxMs: +(tDemux1 - tDemux0).toFixed(1),
      sampleCount: track.samples.length,
      keyCount: track.samples.filter((s) => s.isKey).length,
      gopFrames, decoded, cacheSize: cache.size,
      decodeWallSec: +decWall.toFixed(3), decodeFps: +(decoded / decWall).toFixed(1),
      present: pres, presentWallSec: +presWall.toFixed(3),
      presentReverseFps: +(pres.drawn / presWall).toFixed(1),
      decodeAhead: {
        gop2: [gop2Start, gop2End], decodedAhead, cache2Size: cache2.size,
        presentWallSec: +((tPres2End - tAh0) / 1000).toFixed(3),
        decodeWallSec: +((tAh1 - tAh0) / 1000).toFixed(3),
        decodeFinishedBeforePresentEnd: tAh1 <= tPres2End,
      },
    };
    cache.closeAll(); cache2.closeAll();
    prog(name + "-done");
    return res;
  }
  out.fixtures.sparse = await measureFixture("sparse-gop-flat.mp4", 300);
  out.fixtures.dense = await measureFixture("dense-gop-flat.mp4", 30);
  // Thí nghiệm chunk đơn flush-rồi-đếm (nợ O5 §2.4): queue 1 keyframe,
  // flush(), rồi mới đếm output — khác O5 chỉ đếm trước flush.
  {
    prog("single-start");
    const resp = await fetch("/sparse-gop-flat.mp4");
    const track = parseMp4VideoTrack(await resp.arrayBuffer());
    const bytes = new Uint8Array(await (await fetch("/sparse-gop-flat.mp4")).arrayBuffer());
    const s0 = track.samples[0];
    const data = bytes.subarray(s0.offset, s0.offset + s0.size);
    let outputs = 0; let err = null;
    const dec = new VideoDecoder({
      output: () => { outputs++; },
      error: (e) => { err = String(e && e.message || e); },
    });
    dec.configure({ codec: track.codec, codedWidth: track.width, codedHeight: track.height, description: track.description, hardwareAcceleration: "prefer-software" });
    const t0 = performance.now();
    const { sampleChunkInit } = await import("./mp4Demux.js");
    dec.decode(new EncodedVideoChunk(sampleChunkInit(track, s0, data)));
    const tQueued = performance.now();
    await dec.flush();
    const tFlushed = performance.now();
    await new Promise((r) => setTimeout(r, 200));
    const tAfter = performance.now();
    out.singleFlush = {
      outputsAfterFlush: outputs, queueToFlushMs: +(tFlushed - t0).toFixed(2),
      queuedMs: +(tQueued - t0).toFixed(2), flushExtraWaitMs: +(tAfter - tFlushed).toFixed(2), error: err,
    };
    try { dec.close(); } catch {}
    prog("single-done");
  }
  // Fixture nhiễu (nếu có trong scratch): decode 1 GOP đầu + present.
  try {
    const r = await fetch("/noise-10s.mp4", { method: "GET" });
    if (r.ok) {
      prog("noise-start");
      const buf = await r.arrayBuffer();
      const track = parseMp4VideoTrack(buf);
      const bytes = new Uint8Array(buf);
      const getData = (s) => bytes.subarray(s.offset, s.offset + s.size);
      const canvas = document.createElement("canvas"); canvas.width = track.width; canvas.height = track.height;
      const ctx = canvas.getContext("2d");
      const cache = new ReverseFrameCache();
      const t0 = performance.now();
      const decoded = await cache.decodeGop(track, track.samples, 0, 299, getData, false);
      const t1 = performance.now();
      const pres = cache.presentReverse(0, 299, (f) => { ctx.drawImage(f, 0, 0); });
      const t2 = performance.now();
      out.fixtures.noise = {
        bytes: buf.byteLength, sampleCount: track.samples.length,
        keyCount: track.samples.filter((s) => s.isKey).length,
        decoded, decodeWallSec: +((t1 - t0) / 1000).toFixed(3),
        decodeFps: +(decoded / ((t1 - t0) / 1000)).toFixed(1),
        present: pres, presentWallSec: +((t2 - t1) / 1000).toFixed(3),
        presentReverseFps: +(pres.drawn / ((t2 - t1) / 1000)).toFixed(1),
      };
      cache.closeAll();
      prog("noise-done");
    } else { out.fixtures.noise = "absent:" + r.status; }
  } catch (e) { out.fixtures.noise = "error:" + String(e && e.message || e); }
} catch (e) { out.errors.push(String(e && e.stack || e)); }
window.__p5Result = out;
prog("done");
