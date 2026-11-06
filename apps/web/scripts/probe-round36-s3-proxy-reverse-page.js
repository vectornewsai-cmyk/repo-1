// Probe S3 đợt 36 — đo fps chiều ngược của proxy Q8 so với đường element
// cũ và đường WebCodecs opt-in (CHỈ ĐO + cổng, KHÔNG nối Q3 vào preview,
// KHÔNG push, KHÔNG binary vào repo).
//
// Chạy: node apps/web/scripts/probe-round36-s3-proxy-reverse-pipe.mjs
// Pipe tự biên dịch mp4Demux.ts + reverseWebcodecs.ts hiện tại của repo
// ra scratch, serve scratch + symlink fixture gốc, lái trang này theo
// từng lệnh (handshake window.__s3Cmd / __s3Result) để pipe ghi nhãn tải
// TRƯỚC mỗi lượt đo. Trang KHÔNG tự chạy chuỗi đo dài.
//
// Các lệnh (op): supportCodec | load | wcdecode | elementReverse | done.
// - load: fetch + parseMp4VideoTrack, giữ track + bytes trong trang.
// - wcdecode: decode đúng 1 GOP bằng ReverseFrameCache thật (prefer-software,
//   đúng đường preview đã nối ở Q2), rồi presentReverse unpaced (drawImage)
//   từ cache, rồi closeAll ngay — đỉnh giữ tối đa 1 GOP.
// - elementReverse: mô phỏng sát luật stepping của preview (đợt 27 K4 +
//   đợt 28 L2): playhead lùi 1 frame / 1 frameDur wall; CHỈ phát seek mới
//   khi element không seeking; tick nào không có frame mới thì đếm hold
//   (giữ hình cũ, đúng hành vi preview); draw chỉ đếm khi currentTime
//   đổi sang frame khác (frame trình bày mới). Kết thúc khi playhead qua
//   endFrame hoặc hết capMs — hết cap là kết quả (đo được tới đâu báo tới
//   đó), không phải lỗi harness. Server của pipe PHẢI hỗ trợ Range để
//   <video> seek được (xem pipe).
// - Mọi fps ở đây đều là fps ĐO ĐƯỢC trong phiên này, gắn nhãn tải của
//   lượt đó (quiet chỉ khi load1 < 2,0 VÀ 0 Chrome ngoài cây probe VÀ
//   0 tiến trình nặng khác — cùng ngưỡng R4 đợt 35). KHÔNG claim 30 fps
//   ngược nếu số đo không đạt.
import { parseMp4VideoTrack } from "./mp4Demux.js";
import { ReverseFrameCache } from "./reverseWebcodecs.js";

const tracks = {};
let lastSeq = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitCmd() {
  for (;;) {
    const c = window.__s3Cmd;
    if (c && typeof c.seq === "number" && c.seq > lastSeq) return c;
    await sleep(100);
  }
}

async function waitForEvent(el, name, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { cleanup(); reject(new Error(`timeout ${name} ${timeoutMs}ms`)); }, timeoutMs);
    const ok = () => { cleanup(); resolve(); };
    const err = () => { cleanup(); reject(new Error(`error event ${name}`)); };
    const cleanup = () => { clearTimeout(t); el.removeEventListener(name, ok); el.removeEventListener("error", err); };
    el.addEventListener(name, ok, { once: true });
    el.addEventListener("error", err, { once: true });
  });
}

async function seekTo(video, t, timeoutMs) {
  if (Math.abs(video.currentTime - t) < 0.0005) return;
  const p = waitForEvent(video, "seeked", timeoutMs);
  video.currentTime = t;
  await p;
}

async function main() {
  window.__s3Ready = true;
  window.__s3Result = null;
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
        // LƯU Ý SỬA SAU PHIÊN ĐO (đợt 36 S3): bản probe chạy 3 phiên đã
        // báo cáo `cttsDetected: !!track.cttsDetected`, nhưng field này
        // KHÔNG TỒN TẠI trong Mp4VideoTrack nên luôn ra false — đó là
        // số giả, đã bỏ khỏi output. Hiện diện ctts KHÔNG được probe này
        // xác minh (xem LIMITS §7.5); B-frame của proxy xác nhận bằng
        // ffprobe (has_b_frames=2), không bằng field này.
        res = { ...res, bytes: buf.byteLength, width: track.width, height: track.height, codec: track.codec, sampleCount: track.samples.length, keyIndices: keys };
      } else if (cmd.op === "wcdecode") {
        const t = tracks[cmd.key];
        if (!t) throw new Error(`chưa load ${cmd.key}`);
        const getData = (s) => t.bytes.subarray(s.offset, s.offset + s.size);
        const cache = new ReverseFrameCache();
        const t0 = performance.now();
        const decoded = await cache.decodeGop(t.track, t.track.samples, cmd.from, cmd.to, getData, false);
        const t1 = performance.now();
        const canvas = document.createElement("canvas");
        canvas.width = t.track.width; canvas.height = t.track.height;
        const ctx = canvas.getContext("2d");
        const t2 = performance.now();
        const pres = cache.presentReverse(cmd.from, cmd.to, (f) => { ctx.drawImage(f, 0, 0); });
        const t3 = performance.now();
        cache.closeAll();
        const decWall = (t1 - t0) / 1000, presWall = (t3 - t2) / 1000;
        res = { ...res, decoded, requested: cmd.to - cmd.from + 1, cacheSize: pres.drawn + pres.missing, decodeWallSec: +decWall.toFixed(3), decodeFps: +(decoded / decWall).toFixed(1), presentDrawn: pres.drawn, presentMissing: pres.missing, presentWallSec: +presWall.toFixed(3), presentFps: presWall > 0 ? +(pres.drawn / presWall).toFixed(1) : null };
      } else if (cmd.op === "elementReverse") {
        const video = document.createElement("video");
        video.muted = true; video.playsInline = true; video.preload = "auto";
        document.body.appendChild(video);
        let seekedEvents = 0;
        video.addEventListener("seeked", () => { seekedEvents += 1; });
        video.src = cmd.url;
        await waitForEvent(video, "loadedmetadata", 120000);
        const fps = cmd.fps || 30, frameDur = 1 / fps;
        const startFrame = cmd.startFrame, endFrame = cmd.endFrame;
        await seekTo(video, startFrame * frameDur, 120000);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        const draws = [];
        let lastDrawnFrame = null;
        const drawNow = (playheadFrame, wallSec) => {
          const f = Math.round(video.currentTime * fps);
          if (f === lastDrawnFrame) return false;
          ctx.drawImage(video, 0, 0);
          draws.push({ frame: f, playheadFrame: +playheadFrame.toFixed(2), lagFrames: +(f - playheadFrame).toFixed(2), wallSec: +wallSec.toFixed(3) });
          lastDrawnFrame = f;
          return true;
        };
        const tStart = performance.now();
        drawNow(startFrame, 0);
        let playheadFrame = startFrame, accumulated = 0, lastTick = performance.now();
        let holds = 0, seeksIssued = 0, rafTicks = 0;
        let done = false;
        await new Promise((resolve) => {
          const step = () => {
            rafTicks += 1;
            const now = performance.now();
            const wallSec = (now - tStart) / 1000;
            if (wallSec * 1000 >= cmd.capMs || playheadFrame <= endFrame) { done = true; resolve(); return; }
            accumulated += (now - lastTick) / 1000;
            lastTick = now;
            while (accumulated >= frameDur && playheadFrame > endFrame) {
              playheadFrame -= 1;
              accumulated -= frameDur;
            }
            if (video.seeking) {
              holds += 1;
            } else {
              const drew = drawNow(playheadFrame, wallSec);
              if (!drew) holds += 1;
              const target = playheadFrame * frameDur;
              if (playheadFrame > endFrame && Math.abs(video.currentTime - target) > 0.5 * frameDur) {
                video.currentTime = target;
                seeksIssued += 1;
              }
            }
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        const wallSec = (performance.now() - tStart) / 1000;
        const lags = draws.map((d) => d.lagFrames).sort((a, b) => a - b);
        const medianLag = lags.length ? lags[Math.floor(lags.length / 2)] : null;
        res = { ...res, videoWidth: video.videoWidth, videoHeight: video.videoHeight, duration: video.duration, startFrame, endFrame, windowFrames: startFrame - endFrame, drawn: draws.length, seeksIssued, seekedEvents, holds, rafTicks, wallSec: +wallSec.toFixed(3), displayedFps: wallSec > 0 ? +(draws.length / wallSec).toFixed(2) : null, hitCap: wallSec * 1000 >= cmd.capMs && playheadFrame > endFrame, playheadEndFrame: +playheadFrame.toFixed(2), firstDrawnFrame: draws.length ? draws[0].frame : null, lastDrawnFrame: draws.length ? draws[draws.length - 1].frame : null, medianLagFrames: medianLag, maxLagFrames: lags.length ? lags[lags.length - 1] : null, draws };
        video.remove();
      } else if (cmd.op === "done") {
        res = { ...res, ok: true };
      } else {
        res = { ...res, error: `op không biết: ${cmd.op}` };
      }
    } catch (e) {
      res = { ...res, error: String(e && e.stack || e) };
    }
    window.__s3Result = res;
  }
}

main().catch((e) => { window.__s3Result = { seq: -1, error: String(e && e.stack || e) }; });
