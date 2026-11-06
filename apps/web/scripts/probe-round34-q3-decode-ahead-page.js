// Probe Q3 đợt 34 — đo bộ nhớ VideoFrame thật + nhịp ngược có decode-ahead.
// Chạy trong trang (Chrome headed qua pipe CDP), import module thật đã
// biên dịch ESM (mp4Demux.js, reverseWebcodecs.js, reverseDecodeAhead.js).
// CÁCH DÙNG: copy file này về scratch cùng 3 module ESM + noise-30s.mp4,
// rồi chạy probe-round34-q3-decode-ahead-pipe.mjs với Q3_SCRATCH trỏ
// tới scratch đó. Fixture + module biên dịch CHỈ nằm ở scratch, không
// vào repo. Pipe script bắt tay qua window.__q3Stage / __q3Ack để
// snapshot RSS cây process Chrome đúng lúc cache đang giữ frame.
// KHÔNG nối vào preview, KHÔNG sửa code sản phẩm.
import { parseMp4VideoTrack } from "./mp4Demux.js";
import { ReverseFrameCache } from "./reverseWebcodecs.js";
import { ReverseDecodeAhead } from "./reverseDecodeAhead.js";

const out = { errors: [], support: {}, stages: {} };
const setStage = (s) => { try { window.__q3Stage = s; } catch {} };
const waitAck = (stage, timeoutMs = 90000) => new Promise((resolve) => {
  const t0 = performance.now();
  const tick = () => {
    try { if (window.__q3Ack === stage) return resolve(true); } catch {}
    if (performance.now() - t0 > timeoutMs) return resolve(false);
    setTimeout(tick, 200);
  };
  tick();
});
async function jsHeap() {
  try {
    const m = performance.memory;
    return m ? { usedJSHeapSize: m.usedJSHeapSize, totalJSHeapSize: m.totalJSHeapSize } : null;
  } catch { return null; }
}
async function userMemory() {
  try {
    if (typeof performance.measureMemory !== "function") return "no-measureMemory";
    const r = await performance.measureMemory();
    return { bytes: r.bytes, breakdown: (r.breakdown || []).map((b) => ({ bytes: b.bytes, types: b.types })) };
  } catch (e) { return "error:" + String((e && e.message) || e); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  setStage("start");
  out.hasVideoDecoder = typeof VideoDecoder !== "undefined";
  if (out.hasVideoDecoder) {
    try {
      const r = await VideoDecoder.isConfigSupported({ codec: "avc1.64001F", codedWidth: 1280, codedHeight: 720, hardwareAcceleration: "prefer-software" });
      out.support["prefer-software"] = !!r.supported;
    } catch (e) { out.support["prefer-software"] = "error:" + String(e.message); }
  }
  const resp = await fetch("/noise-30s.mp4");
  const buf = await resp.arrayBuffer();
  const track = parseMp4VideoTrack(buf);
  const bytes = new Uint8Array(buf);
  const getData = (s) => bytes.subarray(s.offset, s.offset + s.size);
  const keys = track.samples.filter((s) => s.isKey).map((s) => s.index);
  out.fixture = { bytes: buf.byteLength, sampleCount: track.samples.length, keyIndices: keys, width: track.width, height: track.height };
  out.baseline = { jsHeap: await jsHeap(), measureMemory: await userMemory() };
  const canvas = document.createElement("canvas");
  canvas.width = track.width; canvas.height = track.height;
  const ctx = canvas.getContext("2d");
  const draw = (f) => { ctx.drawImage(f, 0, 0); };

  // --- Thang bộ nhớ: decode từng GOP, giữ toàn bộ, bắt tay pipe mỗi bậc.
  const cacheM = new ReverseFrameCache();
  out.memoryLadder = [];
  for (const [from, to, label] of [[600, 899, "held-300"], [300, 599, "held-600"], [0, 299, "held-900"]]) {
    const t0 = performance.now();
    const decoded = await cacheM.decodeGop(track, track.samples, from, to, getData, false);
    const wall = (performance.now() - t0) / 1000;
    out.memoryLadder.push({ label, from, to, decoded, cacheSize: cacheM.size, wallSec: +wall.toFixed(3), fps: +(decoded / wall).toFixed(1) });
    setStage(label);
    const acked = await waitAck(label);
    out.memoryLadder[out.memoryLadder.length - 1].rssAcked = acked;
  }
  cacheM.closeAll();
  out.afterRelease = { jsHeap: await jsHeap(), measureMemory: await userMemory() };
  setStage("released");
  out.releasedAcked = await waitAck("released");

  // --- Present ngược có pacing 30fps: frame tới giờ mà chưa có trong
  // cache = late (không chờ decode — đúng nghĩa starvation).
  // ReverseFrameCache không expose frame lẻ, nên mỗi frame tới giờ
  // được vẽ bằng presentReverse trên đoạn 1 frame. Vẫn là drawImage
  // thật và vẫn đếm late đúng (has() trước khi vẽ).
  async function pacedReverseReal(cache, indicesDesc) {
    let drawn = 0, late = 0, firstLate = -1;
    const t0 = performance.now();
    for (let k = 0; k < indicesDesc.length; k++) {
      const idx = indicesDesc[k];
      const scheduled = t0 + (k * 1000) / 30;
      const wait = scheduled - performance.now();
      if (wait > 0) await sleep(wait);
      if (cache.has(idx)) {
        cache.presentReverse(idx, idx, (f) => draw(f));
        drawn++;
      } else {
        late++;
        if (firstLate < 0) firstLate = idx;
      }
    }
    const wall = (performance.now() - t0) / 1000;
    return { drawn, late, firstLate, wallSec: +wall.toFixed(3) };
  }
  const desc = (a, b) => { const r = []; for (let i = a; i >= b; i--) r.push(i); return r; };

  // Run A: cửa sổ 90 (đề xuất O5) — decode GOP kế 300 frame trong lúc
  // present 90 frame (3s) rồi đi tiếp 90 frame vào cửa sổ kế.
  {
    const cacheA = new ReverseFrameCache();
    await cacheA.decodeGop(track, track.samples, 600, 899, getData, false);
    const cacheA2 = new ReverseFrameCache();
    const ctlA = new ReverseDecodeAhead(cacheA2);
    const t0 = performance.now();
    const preA = ctlA.prefetchWindow(track, track.samples, 300, 599, getData, false);
    const runA1 = await pacedReverseReal(cacheA, desc(899, 810));
    const runA2 = await pacedReverseReal(cacheA2, desc(599, 510));
    // SỬA SAU LƯỢT CHẠY 01/11: wall decode phải đo SAU await prefetch
    // (decode chạy nền từ t0) — bản chạy đầu đo trước await nên
    // prefetchWallSec khi đó chỉ là thời lượng paced, KHÔNG dùng.
    // Ghi cả 2 mốc: pacedEndSec (hết present) và decodeDoneSec (xong
    // decode) — wall decode thật = decodeDoneSec; nếu decode xong
    // trước khi hết paced thì decodeDoneSec ≈ pacedEndSec (cận trên).
    const pacedEndA = (performance.now() - t0) / 1000;
    const preDecoded = preA ? await preA : -1;
    const preWall = (performance.now() - t0) / 1000;
    out.runA_window90 = {
      present90: runA1, next90: runA2,
      pacedEndSec: +pacedEndA.toFixed(3),
      prefetchWallSec: +preWall.toFixed(3), prefetchDecoded: preDecoded,
      prefetchCacheSizeAtEnd: cacheA2.size,
    };
    cacheA.closeAll(); cacheA2.closeAll();
  }
  // Run B: cửa sổ 300, prefetch sâu 1 — present 300 frame (10s) trong
  // lúc decode GOP kế, rồi đi tiếp 30 frame qua biên cửa sổ.
  {
    const cacheB = new ReverseFrameCache();
    await cacheB.decodeGop(track, track.samples, 600, 899, getData, false);
    const cacheB2 = new ReverseFrameCache();
    const ctlB = new ReverseDecodeAhead(cacheB2);
    const t0 = performance.now();
    const preB = ctlB.prefetchWindow(track, track.samples, 300, 599, getData, false);
    const runB1 = await pacedReverseReal(cacheB, desc(899, 600));
    const runB2 = await pacedReverseReal(cacheB2, desc(599, 570));
    // Như runA: wall decode đo SAU await (xem ghi chú runA).
    const pacedEndB = (performance.now() - t0) / 1000;
    const preDecoded = preB ? await preB : -1;
    const preWall = (performance.now() - t0) / 1000;
    out.runB_window300_depth1 = {
      present300: runB1, next30: runB2,
      pacedEndSec: +pacedEndB.toFixed(3),
      prefetchWallSec: +preWall.toFixed(3), prefetchDecoded: preDecoded,
      // Slack chỉ có nghĩa khi decodeDoneSec là wall thật (bản sửa
      // này); ở bản chạy đầu slackVsBoundary là số sai, KHÔNG dùng.
      slackVsBoundarySec: +(10 - preWall).toFixed(3),
    };
    cacheB.closeAll(); cacheB2.closeAll();
  }
  // Run C: cửa sổ 300, prefetch sâu 2 — chuỗi decode 2 GOP chạy NỀN
  // (tuần tự trong 1 promise) từ t=0 trong lúc present 2 cửa sổ
  // (20s) rồi đi tiếp 30 frame qua biên thứ hai. Slack chuỗi =
  // 20s - wall decode cả 2 GOP.
  {
    const cacheC = new ReverseFrameCache();
    await cacheC.decodeGop(track, track.samples, 600, 899, getData, false);
    const cacheC2 = new ReverseFrameCache();
    const t0 = performance.now();
    const marks = {};
    const chain = (async () => {
      const d1 = await cacheC2.decodeGop(track, track.samples, 300, 599, getData, false);
      marks.wallGop2Sec = (performance.now() - t0) / 1000;
      const d2 = await cacheC2.decodeGop(track, track.samples, 0, 299, getData, false);
      marks.wallBothSec = (performance.now() - t0) / 1000;
      return { d1, d2 };
    })();
    const runC1 = await pacedReverseReal(cacheC, desc(899, 600));
    const runC2 = await pacedReverseReal(cacheC2, desc(599, 300));
    const runC3 = await pacedReverseReal(cacheC2, desc(299, 270));
    const { d1, d2 } = await chain;
    out.runC_window300_depth2 = {
      decodeWallGop2Sec: +marks.wallGop2Sec.toFixed(3), decodedGop2: d1,
      decodeWallBothSec: +marks.wallBothSec.toFixed(3), decodedGop3: d2,
      present300a: runC1, present300b: runC2, next30: runC3,
      peakHeld: cacheC.size + cacheC2.size,
      slackChainSec: +(20 - marks.wallBothSec).toFixed(3),
    };
    cacheC.closeAll(); cacheC2.closeAll();
  }
  out.final = { jsHeap: await jsHeap(), measureMemory: await userMemory() };
  window.__q3Result = out;
  setStage("done");
} catch (e) {
  out.errors.push(String((e && e.stack) || e));
  try { window.__q3Result = out; window.__q3Stage = "error"; } catch {}
}
