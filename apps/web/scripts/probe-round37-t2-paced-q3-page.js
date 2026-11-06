// Probe T2 đợt 37 — Paced reverse liên tục nhiều GOP bằng proxy + cửa sổ Q3.
// CHỈ ĐO; không sửa code sản phẩm. Trang này được pipe T2 nạp qua module
// script; pipe gọi window.__t2Run() và đọc window.__t2Result.
//
// Phương pháp (khớp luật preview + thiết kế Q3):
// - Fixture: proxy 480p của nhiễu 720p (tạo bằng generateProxy Q8 đợt 36,
//   đã nằm ở scratch S3 — KHÔNG binary mới vào repo).
// - Present NGƯỢC theo presentation order giảm dần (đúng thứ tự xem của
//   footage có B-frame, như presentCachedReverse của Q2), KHÔNG đi theo
//   decode-index giảm dần mù.
// - 3 GOP liên tiếp (lấy động từ keyframe demux thật, không hard-code
//   GOP 300): decode GOP đầu (theo chiều ngược = GOP có index cao nhất)
//   trước, rồi present paced 30 fps trong lúc prefetch GOP kế bằng
//   ReverseDecodeAhead.prefetchWindow; tới biên GOP thì evict GOP đã
//   phát xong bằng chính sách selectEvictions của Q3.
// - Metric: drawn / missed (frame chưa decode kịp lúc tới hạn → bỏ qua,
//   không vẽ muộn mạo nhận) / late>20ms (frame có trong cache nhưng vẽ
//   trễ hơn lịch > 20 ms) / maxDelayMs / wall / presentedFps = drawn/wall.
//   Playhead vẫn bước đều 1 frame / 1/30 s dù frame thiếu — giống luật
//   stepping của preview (frame thiếu thì hold, không dừng playhead).
import { parseMp4VideoTrack, presentOrderFor, displayTimestampUnits } from "./mp4Demux.js";
import { ReverseFrameCache, ReversePreviewController } from "./reverseWebcodecs.js";
import {
  ReverseDecodeAhead,
  chooseDecodeAheadWindow,
} from "./reverseDecodeAhead.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runOneRep(bytes, track, canvas, ctx, rep) {
  const samples = track.samples;
  const keys = samples.filter((s) => s.isKey).map((s) => s.index);
  const n = keys.length;
  if (n < 4) throw new Error(`quá ít keyframe: ${keys}`);
  // 3 GOP liên tiếp cuối trừ GOP cuối file (có thể cụt): starts =
  // keys[n-4..n-2], present từ keys[n-1]-1 xuống keys[n-4].
  const gopStarts = [keys[n - 4], keys[n - 3], keys[n - 2]];
  const presentFrom = keys[n - 4];
  const presentTo = keys[n - 1] - 1;
  const order = presentOrderFor(samples);
  const posOf = new Map();
  order.forEach((idx, p) => posOf.set(idx, p));
  const pFrom = posOf.get(presentFrom);
  const pTo = posOf.get(presentTo);
  // Dãy present ngược: vị trí presentation giảm dần từ pTo về pFrom.
  // (Với B-frame, thứ tự này khác decode-index giảm dần.)
  const presentSeq = [];
  for (let p = pTo; p >= pFrom; p--) presentSeq.push(order[p]);

  const cache = new ReverseFrameCache();
  const ahead = new ReverseDecodeAhead(cache);
  const getData = (s) => bytes.subarray(s.offset, s.offset + s.size);
  const gopRanges = [
    { from: gopStarts[0], to: gopStarts[1] - 1 },
    { from: gopStarts[1], to: gopStarts[2] - 1 },
    { from: gopStarts[2], to: presentTo },
  ];
  const decodeTimes = [];
  const prefetchDone = {};
  // Decode GOP đầu (index cao nhất) trước khi present.
  let t = performance.now();
  const d0 = await cache.decodeGop(track, samples, gopRanges[2].from, gopRanges[2].to, getData, false);
  decodeTimes.push({ gop: 2, from: gopRanges[2].from, to: gopRanges[2].to, decoded: d0, seconds: (performance.now() - t) / 1000 });
  // Prefetch GOP kế ngay (không await) — cửa sổ Q3.
  const prefetchStart = { 1: performance.now() };
  const pre1 = ahead.prefetchWindow(track, samples, gopRanges[1].from, gopRanges[1].to, getData, false);
  if (pre1) {
    pre1.then((c) => { prefetchDone[1] = { decoded: c, seconds: (performance.now() - prefetchStart[1]) / 1000 }; }).catch(() => { prefetchDone[1] = { error: true }; });
  }
  let pre0 = null;
  let pre0StartedAt = 0;
  let boundaryReady = null;
  // BUGFIX (đợt 37 T2, sau lượt 1): evictForReverse gọi cache.evictExcept
  // với tập = heldIndices trừ evict — nên heldIndices PHẢI liệt kê MỌI
  // frame đang giữ, kể cả GOP prefetch. Lượt 1 chỉ truyền GOP đầu nên
  // evictExcept(∅) đã xóa cả GOP kế vừa prefetch xong → đúng 49 frame
  // missed ở cả 2 lượt (49 = đúng cỡ GOP kế). Lượt này truyền đủ held.
  const missedIndices = [];
  const lateIndices = [];

  const total = presentSeq.length;
  let drawn = 0, missed = 0, late = 0, maxDelayMs = 0;
  let firstDelayMs = null;
  const tStart = performance.now();
  let enteredGop1 = false;
  for (let k = 0; k < total; k++) {
    const idx = presentSeq[k];
    const sched = tStart + (k * 1000) / 30;
    const now = performance.now();
    if (now < sched) await sleep(sched - now);
    const due = performance.now();
    // Biên GOP: vừa bước vào GOP kế (decode-index < start GOP đang phát).
    if (!enteredGop1 && idx < gopStarts[2] && idx >= gopStarts[1]) {
      enteredGop1 = true;
      const allReady = gopRanges[1].from <= idx && [...Array(gopRanges[1].to - gopRanges[1].from + 1)].every((_, j) => cache.has(gopRanges[1].from + j));
      // Evict GOP đã phát xong theo chính sách Q3. held = MỌI frame đã
      // decode (GOP đang phát + GOP kế đã prefetch); keep = frame chưa
      // present + GOP xa (prefetch tiếp). Không liệt kê đủ held thì
      // evictExcept sẽ xóa cả frame prefetch (bug lượt 1).
      const keep = new Set();
      for (let j = k + 1; j < total; j++) keep.add(presentSeq[j]);
      for (let i = gopRanges[0].from; i <= gopRanges[0].to; i++) keep.add(i);
      const held = [];
      for (let i = gopRanges[1].from; i <= gopRanges[2].to; i++) held.push(i);
      const evictedAtBoundary = ahead.evictForReverse(held, keep, idx);
      boundaryReady = { atPresentIndex: idx, gop1FullyDecoded: allReady, prefetchDoneAtBoundary: !!prefetchDone[1], boundarySlackMs: prefetchDone[1] ? (due - (prefetchStart[1] + prefetchDone[1].seconds * 1000)) : null, evictedAtBoundary };
      // Prefetch GOP xa nhất.
      pre0StartedAt = performance.now();
      pre0 = ahead.prefetchWindow(track, samples, gopRanges[0].from, gopRanges[0].to, getData, false);
      if (pre0) pre0.then((c) => { prefetchDone[0] = { decoded: c, seconds: (performance.now() - pre0StartedAt) / 1000 }; }).catch(() => { prefetchDone[0] = { error: true }; });
    }
    if (cache.has(idx)) {
      const frame = cache.get(idx);
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      drawn++;
      const delayMs = due - sched;
      if (firstDelayMs === null) firstDelayMs = delayMs;
      if (delayMs > maxDelayMs) maxDelayMs = delayMs;
      if (delayMs > 20) { late++; lateIndices.push(idx); }
    } else {
      missed++;
      missedIndices.push(idx);
    }
  }
  const wallSeconds = (performance.now() - tStart) / 1000;
  // Đợi prefetch còn bay tối đa 2 s để ghi số decode GOP xa (không tính vào wall).
  const waitUntil = performance.now() + 2000;
  while (performance.now() < waitUntil && !prefetchDone[1]) await sleep(50);
  while (performance.now() < waitUntil && pre0 && !prefetchDone[0]) await sleep(50);
  // Decode fps từng GOP: GOP đầu đo trực tiếp; GOP prefetch đo qua wall prefetch.
  const gopFps = decodeTimes.map((d) => ({ ...d, fps: d.decoded / d.seconds }));
  if (prefetchDone[1] && !prefetchDone[1].error) {
    const g = gopRanges[1];
    gopFps.push({ gop: 1, from: g.from, to: g.to, decoded: prefetchDone[1].decoded, seconds: prefetchDone[1].seconds, fps: prefetchDone[1].decoded / prefetchDone[1].seconds });
  }
  if (prefetchDone[0] && !prefetchDone[0].error) {
    const g = gopRanges[0];
    gopFps.push({ gop: 0, from: g.from, to: g.to, decoded: prefetchDone[0].decoded, seconds: prefetchDone[0].seconds, fps: prefetchDone[0].decoded / prefetchDone[0].seconds });
  }
  const totalDecoded = gopFps.reduce((a, g) => a + g.decoded, 0);
  const totalDecodeSeconds = gopFps.reduce((a, g) => a + g.seconds, 0);
  cache.closeAll();
  return {
    rep, keys, gopStarts, presentFrom, presentTo, presentFrames: total,
    drawn, missed, missedIndices, lateIndices,
    lateOver20ms: late, maxDelayMs: Math.round(maxDelayMs * 100) / 100,
    wallSeconds: Math.round(wallSeconds * 1000) / 1000,
    presentedFps: Math.round((drawn / wallSeconds) * 100) / 100,
    gopFps, meanDecodeFps: Math.round((totalDecoded / totalDecodeSeconds) * 100) / 100,
    minGopDecodeFps: Math.round(Math.min(...gopFps.map((g) => g.fps)) * 100) / 100,
    boundaryReady, cacheSizeAtEnd: cache.size,
  };
}

async function main() {
  window.__t2Ready = true;
  window.__t2Result = null;
  window.__t2Run = async (fileUrl) => {
    try {
      const resp = await fetch(fileUrl);
      if (!resp.ok) throw new Error(`fetch ${resp.status}`);
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const track = parseMp4VideoTrack(buf);
      const canvas = document.createElement("canvas");
      canvas.width = track.width; canvas.height = track.height;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      // Cửa sổ Q3 tính bằng chính module (thông tin, không dùng để lái probe:
      // probe lái bằng keyframe thật vì GOP proxy không đều).
      const frameBytesEst = Math.floor(1.5 * 1024 * 1024 * (track.width * track.height) / (1280 * 720));
      const chosen = chooseDecodeAheadWindow({
        playbackFps: 30, decodeFps: 65, frameBytes: frameBytesEst,
        memoryBudgetBytes: 2 * 1024 * 1024 * 1024, gopFrames: 61,
      });
      const reps = [];
      for (let r = 0; r < 2; r++) reps.push(await runOneRep(bytes, track, canvas, ctx, r + 1));
      // Bằng chứng hardware: chỉ thử decode khi supported (cổng yêu cầu cả hai).
      let hw = { preferHardwareSupported: false, hardwareAttemptedFrames: 0, hardwareDecodedFrames: 0, hardwareDecodeFps: null };
      try {
        const sup = await VideoDecoder.isConfigSupported({
          codec: track.codec, codedWidth: track.width, codedHeight: track.height,
          description: track.description, hardwareAcceleration: "prefer-hardware",
        });
        hw.preferHardwareSupported = !!sup.supported;
      } catch { hw.preferHardwareSupported = false; }
      if (hw.preferHardwareSupported) {
        try {
          const keys = track.samples.filter((s) => s.isKey).map((s) => s.index);
          const from = keys[keys.length - 2], to = Math.min(from + 59, track.samples.length - 1);
          const c2 = new ReverseFrameCache();
          const t = performance.now();
          const dc = await c2.decodeGop(track, track.samples, from, to, (s) => bytes.subarray(s.offset, s.offset + s.size), true);
          hw.hardwareAttemptedFrames = to - from + 1;
          hw.hardwareDecodedFrames = dc;
          hw.hardwareDecodeFps = dc > 0 ? Math.round((dc / ((performance.now() - t) / 1000)) * 100) / 100 : null;
          c2.closeAll();
        } catch { hw.hardwareAttemptedFrames = 0; hw.hardwareDecodedFrames = 0; }
      }
      const res = {
        track: { width: track.width, height: track.height, codec: track.codec, samples: track.samples.length },
        fileBytes: bytes.length, chosenWindowInfo: chosen, frameBytesEstimate: frameBytesEst, reps, hw,
      };
      window.__t2Result = res;
      return res;
    } catch (e) {
      const err = { error: String(e && e.stack || e) };
      window.__t2Result = err;
      return err;
    }
  };
  // Kiểm chứng đường prefetch của CHÍNH controller (không chỉ module Q3
  // rời): bật decode-ahead qua cổng bằng số đo thật phiên B (SW 124,27
  // fps, cùng fixture) rồi xem frame ở cửa sổ trước có hit cache đồng
  // bộ ngay lần frameAt đầu tiên không (hit đồng bộ = đã prefetch, vì
  // frameAt khi thiếu chỉ kích decode nền và vẫn trả null). Đối chứng
  // âm: controller bị cổng chặn (SW 48,01 fps, phiên A) thì không có
  // aheadRange, không tăng cache sau cửa sổ.
  window.__t2RunController = async (fileUrl) => {
    try {
      const resp = await fetch(fileUrl);
      if (!resp.ok) throw new Error(`fetch ${resp.status}`);
      const buf = await resp.arrayBuffer();
      const track = parseMp4VideoTrack(buf);
      const ptSec = (idx) => displayTimestampUnits(track, track.samples[idx]) / track.timescale;
      const hwAbsent = { preferHardwareSupported: false, hardwareAttemptedFrames: 0, hardwareDecodedFrames: 0, hardwareDecodeFps: null };
      const enabled = new ReversePreviewController(fileUrl + "#t2-enabled");
      const gateOk = enabled.enableDecodeAheadFromGate({
        optIn: true, hardwareProof: hwAbsent,
        softwareMeasurement: { decodeFps: 124.27, loadLabel: "under-load", resolution: "854x480" },
      });
      // t1 trong GOP [621,681]: sample decode-index 650.
      const t1 = ptSec(650) + 0.001;
      const winOk = await enabled.ensureWindowForTime(t1);
      const sizeAfterWindow = enabled.cacheSize;
      const mirrorAfterEnable = window.__vcutReverseDecodeAheadWarnings;
      // BUGFIX check (sau lượt chạy trước): active/warnings phải đọc
      // TRƯỚC dispose (dispose reset về false/rỗng theo thiết kế); và
      // phải đợi prefetch HOÀN TẤT (mọi index trong aheadRange đều có
      // trong cache) chứ không thoát ngay khi cache vừa tăng vài frame.
      const activeBeforeDispose = enabled.decodeAheadActive;
      const warningsBeforeDispose = enabled.decodeAheadWarningList;
      let ahead = enabled.aheadDecodeRange;
      for (let i = 0; i < 100 && !ahead; i++) { await sleep(100); ahead = enabled.aheadDecodeRange; }
      // Đợi prefetch xong theo nghĩa thực dụng: cacheSize ngừng tăng
      // 3 poll liên tiếp (prefetch decode 83 frame thường < 2 s).
      // Không dùng frameAt để thăm dò giữa chừng (nó kích decode nền
      // khi thiếu và làm nhiễu phép đo); frameAt chỉ gọi 1 lần ở cuối.
      let prefetchComplete = false;
      let sizeAfterPrefetch = enabled.cacheSize;
      if (ahead) {
        let stable = 0;
        let last = enabled.cacheSize;
        for (let s = 0; s < 150; s++) {
          await sleep(100);
          const cur = enabled.cacheSize;
          if (cur === last) { stable++; if (stable >= 3) break; }
          else { stable = 0; last = cur; }
        }
        sizeAfterPrefetch = enabled.cacheSize;
        prefetchComplete = sizeAfterPrefetch > sizeAfterWindow;
      }
      let prefetchHit = null;
      if (ahead) {
        // Frame ở giữa đoạn ahead: frameAt đồng bộ lần đầu phải hit
        // (hit đồng bộ = đã prefetch, vì thiếu thì frameAt trả null).
        const mid = Math.floor((ahead.from + ahead.to) / 2);
        const hit = enabled.frameAt(ptSec(mid) + 0.001);
        prefetchHit = { midIndex: mid, hit: !!hit, cacheSizeAtHit: enabled.cacheSize, prefetchComplete };
      }
      const blocked = new ReversePreviewController(fileUrl + "#t2-blocked");
      const gateNo = blocked.enableDecodeAheadFromGate({
        optIn: true, hardwareProof: hwAbsent,
        softwareMeasurement: { decodeFps: 48.01, loadLabel: "under-load", resolution: "854x480" },
      });
      const winOk2 = await blocked.ensureWindowForTime(t1);
      await sleep(3000);
      const control = {
        gateVerdict: gateNo.verdict, active: blocked.decodeAheadActive,
        warnings: blocked.decodeAheadWarningList, windowOk: winOk2,
        cacheSize: blocked.cacheSize, aheadRange: blocked.aheadDecodeRange,
      };
      enabled.dispose();
      blocked.dispose();
      const res = {
        gateOk: { verdict: gateOk.verdict, reasons: gateOk.reasons, warnings: gateOk.warnings },
        active: activeBeforeDispose, warnings: warningsBeforeDispose,
        windowOk: winOk, sizeAfterWindow,
        aheadRange: ahead, sizeAfterPrefetch, prefetchHit,
        mirrorAfterEnable, control,
      };
      window.__t2Result = res;
      return res;
    } catch (e) {
      const err = { error: String(e && e.stack || e) };
      window.__t2Result = err;
      return err;
    }
  };
}
main().catch((e) => { window.__t2Result = { error: String(e && e.stack || e) }; });
