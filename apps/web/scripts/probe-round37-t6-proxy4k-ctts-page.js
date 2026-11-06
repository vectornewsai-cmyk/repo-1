// Probe T6 đợt 37 — 4K nguồn → proxy 720p + xác minh ctts/present-order
// cho proxy có B-frame + đường blob: (mô phỏng item asset: sau rehydrate).
// CHỈ ĐO, KHÔNG nối Q3 vào preview, KHÔNG push, KHÔNG binary vào repo.
//
// Chạy: node apps/web/scripts/probe-round37-t6-proxy4k-ctts-pipe.mjs
// Pipe biên dịch mp4Demux.ts + reverseWebcodecs.ts hiện tại của repo ra
// scratch, serve scratch, lái trang này theo từng lệnh
// (handshake window.__t6Cmd / __t6Result).
//
// Các lệnh (op): supportCodec | load | wcdecodeOrder | blobReverse | done.
// - load: fetch + parseMp4VideoTrack, giữ track + bytes. Trả bằng chứng
//   ctts TÍNH TỪ SAMPLE ĐÃ PARSE (không dùng field không tồn tại — bài
//   học đính chính đợt 36 S3 §5): số sample có presentationTimestamp
//   khác decode timestamp, số lần presentation giảm trong thứ tự decode
//   (B-frame reorder), presentOrderFor toàn file + kiểm tra hoán vị /
//   đơn điệu. Mọi con số đều từ demux thật, không suy từ ffprobe.
// - wcdecodeOrder: decode đúng 1 GOP bằng ReverseFrameCache thật
//   (prefer-software, đúng đường Q2), rồi presentReverse và GHI LẠI thứ
//   tự draw thật: [{decodeIndex, frameTimestampUs}]. Kiểm tra: timestamp
//   draw giảm đơn điệu chặt (present ngược đúng), timestamp draw khớp
//   presentationTimestamp của sample (đổi sang µs theo timescale), và
//   thứ tự draw KHÁC thứ tự index giảm dần mù (chứng minh reorder đã
//   xảy ra, không phải fallback index). Rồi closeAll ngay.
// - blobReverse: fetch proxy thành Blob → objectURL blob: → fetch lại
//   blob: URL (đúng đường controller dùng cho item asset: sau rehydrate
//   S5: item.url là blob:) → parse + decode cùng GOP + presentReverse
//   ghi thứ tự draw. Chứng minh đường blob: đi được qua demux/decode/
//   present, không chỉ đoán từ code.
// - Mọi fps gắn nhãn tải của lượt đó (quiet chỉ khi load1 < 2,0 VÀ
//   0 Chrome ngoài cây probe VÀ 0 tiến trình nặng khác — cùng ngưỡng
//   R4/S3). Đo dưới tải song song đợt 37 nên KHÔNG dùng làm baseline.
import { parseMp4VideoTrack, presentOrderFor, displayTimestampUnits } from "./mp4Demux.js";
import { ReverseFrameCache, ReversePreviewController } from "./reverseWebcodecs.js";

const tracks = {};
let lastSeq = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitCmd() {
  for (;;) {
    const c = window.__t6Cmd;
    if (c && typeof c.seq === "number" && c.seq > lastSeq) return c;
    await sleep(100);
  }
}

function cttsEvidence(track) {
  const s = track.samples;
  const pts = s.map((x) => x.presentationTimestamp);
  const dts = s.map((x) => x.timestamp);
  let nonzero = 0;
  for (let i = 0; i < s.length; i++) if (pts[i] !== dts[i]) nonzero++;
  let decreases = 0;
  for (let i = 0; i + 1 < s.length; i++) if (pts[i + 1] < pts[i]) decreases++;
  const order = presentOrderFor(s);
  const sortedPts = order.map((i) => pts[i]);
  let monotonic = true;
  for (let i = 0; i + 1 < sortedPts.length; i++) if (sortedPts[i + 1] < sortedPts[i]) monotonic = false;
  const seen = new Set(order);
  const permutation = seen.size === s.length && order.every((i) => i >= 0 && i < s.length);
  const naiveDesc = [];
  for (let i = s.length - 1; i >= 0; i--) naiveDesc.push(i);
  let orderDiffersFromNaiveDesc = false;
  for (let i = 0; i < order.length; i++) if (order[i] !== naiveDesc[i]) { orderDiffersFromNaiveDesc = true; break; }
  return {
    timescale: track.timescale,
    sampleCount: s.length,
    cttsNonzeroSamples: nonzero,
    presentDecreasesInDecodeOrder: decreases,
    presentOrderMonotonicNonDecreasing: monotonic,
    presentOrderIsPermutation: permutation,
    presentOrderDiffersFromNaiveIndexDesc: orderDiffersFromNaiveDesc,
    presentOrder: order,
    ptsDecodeOrder: pts,
    dtsDecodeOrder: dts,
  };
}

async function decodeAndPresentOrder(t, from, to) {
  const getData = (s) => t.bytes.subarray(s.offset, s.offset + s.size);
  const cache = new ReverseFrameCache();
  const t0 = performance.now();
  const decoded = await cache.decodeGop(t.track, t.track.samples, from, to, getData, false);
  const t1 = performance.now();
  const canvas = document.createElement("canvas");
  canvas.width = t.track.width; canvas.height = t.track.height;
  const ctx = canvas.getContext("2d");
  const draws = [];
  const t2 = performance.now();
  const pres = cache.presentReverse(from, to, (f, idx) => {
    ctx.drawImage(f, 0, 0);
    draws.push({ decodeIndex: idx, frameTimestampUs: f.timestamp });
  });
  const t3 = performance.now();
  cache.closeAll();
  const decWall = (t1 - t0) / 1000, presWall = (t3 - t2) / 1000;
  const ts = draws.map((d) => d.frameTimestampUs);
  let strictlyDecreasing = true;
  for (let i = 0; i + 1 < ts.length; i++) if (!(ts[i + 1] < ts[i])) strictlyDecreasing = false;
  const scale = t.track.timescale > 0 ? 1000000 / t.track.timescale : 0;
  let tsMatch = 0, tsMismatch = 0;
  const mismatches = [];
  for (const d of draws) {
    const expected = Math.round(t.track.samples[d.decodeIndex].presentationTimestamp * scale);
    if (Math.abs(d.frameTimestampUs - expected) <= 2) tsMatch++;
    else { tsMismatch++; if (mismatches.length < 5) mismatches.push({ decodeIndex: d.decodeIndex, frameTimestampUs: d.frameTimestampUs, expectedUs: expected }); }
  }
  const naiveDesc = [];
  for (let i = to; i >= from; i--) naiveDesc.push(i);
  const drawIdx = draws.map((d) => d.decodeIndex);
  let drawDiffersFromNaiveDesc = false;
  if (drawIdx.length !== naiveDesc.length) drawDiffersFromNaiveDesc = true;
  else for (let i = 0; i < drawIdx.length; i++) if (drawIdx[i] !== naiveDesc[i]) { drawDiffersFromNaiveDesc = true; break; }
  return {
    decoded, requested: to - from + 1,
    decodeWallSec: +decWall.toFixed(3), decodeFps: decWall > 0 ? +(decoded / decWall).toFixed(1) : null,
    presentDrawn: pres.drawn, presentMissing: pres.missing,
    presentWallSec: +presWall.toFixed(3), presentFps: presWall > 0 ? +(pres.drawn / presWall).toFixed(1) : null,
    drawOrder: draws,
    drawTimestampsStrictlyDecreasing: strictlyDecreasing,
    drawTimestampMatchesSamplePts: tsMatch, drawTimestampMismatches: tsMismatch, mismatchSamples: mismatches,
    drawOrderDiffersFromNaiveIndexDesc: drawDiffersFromNaiveDesc,
  };
}

async function main() {
  window.__t6Ready = true;
  window.__t6Result = null;
  for (;;) {
    const cmd = await waitCmd();
    lastSeq = cmd.seq;
    let res = { seq: cmd.seq, op: cmd.op };
    try {
      if (cmd.op === "supportCodec") {
        const out = {};
        if (typeof VideoDecoder === "undefined") out.error = "no-VideoDecoder";
        else {
          for (const [name, accel] of [["prefer-software", "prefer-software"], ["prefer-hardware", "prefer-hardware"], ["default", undefined]]) {
            try {
              const cfg = { codec: cmd.codec, codedWidth: cmd.width, codedHeight: cmd.height };
              if (accel) cfg.hardwareAcceleration = accel;
              const r = await VideoDecoder.isConfigSupported(cfg);
              out[name] = { supported: !!r.supported };
            } catch (e) { out[name] = { error: String(e.message) }; }
          }
        }
        res = { ...res, ...out };
      } else if (cmd.op === "load") {
        const resp = await fetch(cmd.url);
        if (!resp.ok) throw new Error(`fetch ${cmd.url} -> ${resp.status}`);
        const buf = await resp.arrayBuffer();
        const track = parseMp4VideoTrack(buf);
        tracks[cmd.key] = { track, bytes: new Uint8Array(buf) };
        const keys = track.samples.map((s, i) => (s.isKey ? i : -1)).filter((i) => i >= 0);
        res = { ...res, bytes: buf.byteLength, width: track.width, height: track.height, codec: track.codec, sampleCount: track.samples.length, keyIndices: keys, ctts: cttsEvidence(track) };
      } else if (cmd.op === "wcdecodeOrder") {
        const t = tracks[cmd.key];
        if (!t) throw new Error(`chưa load ${cmd.key}`);
        res = { ...res, ...(await decodeAndPresentOrder(t, cmd.from, cmd.to)) };
      } else if (cmd.op === "blobReverse") {
        const resp = await fetch(cmd.url);
        if (!resp.ok) throw new Error(`fetch ${cmd.url} -> ${resp.status}`);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const scheme = blobUrl.split(":")[0];
        const resp2 = await fetch(blobUrl);
        if (!resp2.ok) throw new Error(`fetch blob: -> ${resp2.status}`);
        const buf = await resp2.arrayBuffer();
        const track = parseMp4VideoTrack(buf);
        const holder = { track, bytes: new Uint8Array(buf) };
        const order = await decodeAndPresentOrder(holder, cmd.from, cmd.to);
        URL.revokeObjectURL(blobUrl);
        res = { ...res, blobUrlScheme: scheme, blobBytes: blob.size, bytes: buf.byteLength, ...order };
      } else if (cmd.op === "controllerBlob") {
        // Mức controller thật (không chỉ demux/decode trần): tạo blob:
        // từ proxy (đúng dạng item.url của item asset: sau rehydrate
        // S5), dựng ReversePreviewController với knownFileSizeBytes =
        // blob.size (đúng cách preview truyền item.file.size khi không
        // có proxyUrl), rồi poll frameAt đồng bộ tại các mốc present
        // trong GOP cho tới khi trúng frame hoặc hết 30 s. Ghi rõ
        // frame.timestamp có khớp presentationTimestamp của sample đó
        // không — đây mới là chứng cứ controller chạy được qua blob:.
        // HEAD fail-soft của controller (lỗi HEAD -> vẫn GET) chỉ là
        // đọc code; op này đo hành vi đầu-cuối thật, không đoán HEAD.
        const resp = await fetch(cmd.url);
        if (!resp.ok) throw new Error(`fetch ${cmd.url} -> ${resp.status}`);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const buf = await blob.arrayBuffer();
        const track = parseMp4VideoTrack(buf);
        const order = presentOrderFor(track.samples);
        const inGop = order.filter((i) => i >= cmd.from && i <= cmd.to);
        const picks = [];
        for (let k = 0; k < 8 && inGop.length; k++) {
          const idx = inGop[Math.floor((k * inGop.length) / 8)];
          const sec = track.timescale > 0 ? displayTimestampUnits(track, track.samples[idx]) / track.timescale : 0;
          picks.push({ decodeIndex: idx, timeSec: sec, expectedPtsUs: Math.round(track.samples[idx].presentationTimestamp * 1000000 / track.timescale) });
        }
        const controller = new ReversePreviewController(blobUrl, 90, { knownFileSizeBytes: blob.size });
        const t0 = performance.now();
        let hit = null, polls = 0;
        while (performance.now() - t0 < 30000 && !hit) {
          polls++;
          for (const p of picks) {
            const f = controller.frameAt(p.timeSec);
            if (f) { hit = { ...p, frameTimestampUs: f.frame.timestamp, width: f.width, height: f.height, frameTimestampMatchesPts: Math.abs(f.frame.timestamp - p.expectedPtsUs) <= 2 }; f.frame.close(); break; }
          }
          if (!hit) await sleep(200);
        }
        const wallSec = (performance.now() - t0) / 1000;
        controller.dispose();
        URL.revokeObjectURL(blobUrl);
        res = { ...res, blobUrlScheme: blobUrl.split(":")[0], blobBytes: blob.size, probeTimes: picks, polls, wallSecToFirstHit: hit ? +wallSec.toFixed(3) : null, hit, controllerReturnedFrame: !!hit };
      } else if (cmd.op === "done") {
        res = { ...res, ok: true };
      } else {
        res = { ...res, error: `op không biết: ${cmd.op}` };
      }
    } catch (e) {
      res = { ...res, error: String(e && e.stack || e) };
    }
    window.__t6Result = res;
  }
}

main().catch((e) => { window.__t6Result = { seq: -1, error: String(e && e.stack || e) }; });
