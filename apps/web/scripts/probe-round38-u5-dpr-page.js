// Probe U5 đợt 38 — smoke dpr > 1 cho footage B-frame (đường element)
// và đường WebCodecs (decode GOP + presentReverse) trên cùng fixture.
// CHỈ ĐO; KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG binary vào repo.
// Trang này import mp4Demux.js + reverseWebcodecs.js do pipe bundle từ
// nguồn repo ra scratch (mẫu T6 đợt 37). Pipe đặt deviceScaleFactor
// qua CDP rồi gọi window.__u5run() và đọc kết quả.
//
// Quy ước canvas (y hệt preview.tsx): dprCap = min(2, devicePixelRatio),
// backing = floor(css * dprCap). CSS cố định 427x240 để ở dpr=2 backing
// phải là 854x480 (= đúng kích thước gốc của fixture, vẽ 1:1), và ở
// dpr=3 backing vẫn phải là 854x480 (trần 2, không phải 3).
import { parseMp4VideoTrack } from "./mp4Demux.js";
import { ReverseFrameCache } from "./reverseWebcodecs.js";

const CSS_W = 427, CSS_H = 240;
const TARGET_SEC = 2.0;

function centerMean(canvas) {
  const ctx = canvas.getContext("2d");
  const x0 = Math.floor(canvas.width / 2) - 50, y0 = Math.floor(canvas.height / 2) - 50;
  const d = ctx.getImageData(x0, y0, 100, 100).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return +((r / n + g / n + b / n) / 3).toFixed(2);
}

function makeCanvas() {
  const dprCap = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement("canvas");
  c.style.width = CSS_W + "px";
  c.style.height = CSS_H + "px";
  c.width = Math.floor(CSS_W * dprCap);
  c.height = Math.floor(CSS_H * dprCap);
  return { canvas: c, dprCap, backingW: c.width, backingH: c.height };
}

function seekTo(video, t) {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("seek timeout")), 15000);
    const on = () => { clearTimeout(to); video.removeEventListener("seeked", on); resolve(); };
    video.addEventListener("seeked", on);
    video.currentTime = t;
  });
}

window.__u5run = async () => {
  const out = { devicePixelRatio: window.devicePixelRatio };
  const buf = new Uint8Array(await (await fetch("/fixture.mp4")).arrayBuffer());
  const track = parseMp4VideoTrack(buf.buffer);
  out.track = { width: track.width, height: track.height, codec: track.codec, samples: track.samples.length, timescale: track.timescale };
  const pts = track.samples.map((s) => s.presentationTimestamp);
  const dts = track.samples.map((s) => s.timestamp);
  let nonzero = 0, decreases = 0;
  for (let i = 0; i < pts.length; i++) if (pts[i] !== dts[i]) nonzero++;
  for (let i = 0; i + 1 < pts.length; i++) if (pts[i + 1] < pts[i]) decreases++;
  out.ctts = { nonzeroSamples: nonzero, presentDecreasesInDecodeOrder: decreases };
  const targetPts = TARGET_SEC * track.timescale;
  let targetIdx = 0, best = Infinity;
  for (let i = 0; i < pts.length; i++) { const d = Math.abs(pts[i] - targetPts); if (d < best) { best = d; targetIdx = i; } }
  let gopStart = 0;
  for (let i = 0; i <= targetIdx; i++) if (track.samples[i].isKey) gopStart = i;
  let gopEnd = track.samples.length - 1;
  for (let i = gopStart + 1; i < track.samples.length; i++) if (track.samples[i].isKey) { gopEnd = i - 1; break; }
  out.gop = { from: gopStart, to: gopEnd, targetDecodeIndex: targetIdx, targetPts, targetPtsSec: +(pts[targetIdx] / track.timescale).toFixed(4) };

  // Nhánh element: video element seek tới TARGET_SEC rồi vẽ lên canvas trần dpr.
  const { canvas: elCanvas, dprCap, backingW, backingH } = makeCanvas();
  document.body.appendChild(elCanvas);
  const video = document.createElement("video");
  video.muted = true;
  video.src = URL.createObjectURL(new Blob([buf], { type: "video/mp4" }));
  await new Promise((res, rej) => {
    video.addEventListener("loadedmetadata", res, { once: true });
    video.addEventListener("error", () => rej(new Error("video error")), { once: true });
  });
  await seekTo(video, TARGET_SEC);
  const elCtx = elCanvas.getContext("2d");
  elCtx.drawImage(video, 0, 0, backingW, backingH);
  out.element = {
    dpr: window.devicePixelRatio, dprCap, cssW: CSS_W, cssH: CSS_H,
    backingW, backingH, videoCurrentTime: video.currentTime,
    centerMean: centerMean(elCanvas),
  };
  video.pause();
  URL.revokeObjectURL(video.src);

  // Nhánh WebCodecs: decode GOP rồi presentReverse lên canvas trần dpr.
  const { canvas: wcCanvas, backingW: wcBW, backingH: wcBH } = makeCanvas();
  document.body.appendChild(wcCanvas);
  const wcCtx = wcCanvas.getContext("2d");
  const getData = (s) => buf.subarray(s.offset, s.offset + s.size);
  const cache = new ReverseFrameCache();
  const decoded = await cache.decodeGop(track, track.samples, gopStart, gopEnd, getData, false);
  const draws = [];
  const pres = cache.presentReverse(gopStart, gopEnd, (f, idx) => {
    wcCtx.drawImage(f, 0, 0, wcBW, wcBH);
    draws.push({ decodeIndex: idx, frameTimestampUs: f.timestamp });
  });
  // Nội dung frame mục tiêu (pts ~ TARGET_SEC) không đo riêng ở đây vì
  // presentReverse vẽ ngược: canvas cuối cùng giữ frame có pts nhỏ nhất
  // GOP (vẽ cuối). Nội dung đó được đối chiếu với ffmpeg ở cùng pts
  // (xem trường lastDrawnPtsSec); frame mục tiêu đã có ở nhánh element.
  const ts = draws.map((d) => d.frameTimestampUs);
  let strictlyDecreasing = true;
  for (let i = 0; i + 1 < ts.length; i++) if (!(ts[i + 1] < ts[i])) strictlyDecreasing = false;
  const scale = track.timescale > 0 ? 1000000 / track.timescale : 0;
  let tsMatch = 0, tsMismatch = 0;
  for (const d of draws) {
    const expected = Math.round(track.samples[d.decodeIndex].presentationTimestamp * scale);
    if (Math.abs(d.frameTimestampUs - expected) <= 2) tsMatch++; else tsMismatch++;
  }
  const naive = [];
  for (let i = gopEnd; i >= gopStart; i--) naive.push(i);
  const drawIdx = draws.map((d) => d.decodeIndex);
  let differsFromNaive = drawIdx.length !== naive.length;
  if (!differsFromNaive) for (let i = 0; i < drawIdx.length; i++) if (drawIdx[i] !== naive[i]) { differsFromNaive = true; break; }
  cache.closeAll();
  out.webcodecs = {
    dpr: window.devicePixelRatio, dprCap: Math.min(2, window.devicePixelRatio || 1),
    backingW: wcBW, backingH: wcBH, decoded, drawn: pres.drawn, missing: pres.missing,
    drawTimestampsStrictlyDecreasing: strictlyDecreasing,
    drawTimestampMatchesSamplePts: tsMatch, drawTimestampMismatches: tsMismatch,
    drawOrderDiffersFromNaiveIndexDesc: differsFromNaive,
    firstDrawnPtsSec: draws.length ? +(draws[0].frameTimestampUs / 1000000).toFixed(4) : null,
    lastDrawnPtsSec: draws.length ? +(draws[draws.length - 1].frameTimestampUs / 1000000).toFixed(4) : null,
    // Nội dung canvas sau presentReverse = frame có pts nhỏ nhất GOP (vẽ cuối).
    lastDrawnCenterMean: centerMean(wcCanvas),
    lastDrawnPtsSec: draws.length ? +(track.samples[drawIdx[drawIdx.length - 1]].presentationTimestamp / track.timescale).toFixed(4) : null,
  };
  return out;
};
window.__u5ready = true;
