// parityHarness203-reverse.ts — Harness parity đợt 203 P4: mảng phát ngược.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: sectionReverseVideo, sectionReverseAudio, sectionScrubReverse,
// sectionReverseSmooth (+ helper indexedFixtureVideo/extractFrames).
import * as fs from "node:fs";
import * as path from "node:path";
import { sourceTimeAt } from "../../../../packages/video-spec/src/speed";
import {
  resolveDecodeAheadGate,
  resolveProxyMainDirection,
} from "./reversePreviewGate";
import { reversePlayhead, reverseScrubSeekTarget, reverseStep } from "./reversePlayback";
import {
  MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
  REVERSED_AUDIO_CROSSFADE_SEC,
  REVERSED_AUDIO_WINDOW_SEC,
  ReverseAudioPlayer,
  reversedSampleOffset,
  reversedSegmentWindow,
  reverseFloat32Channel,
} from "./reverseAudio";
import { ReverseCadenceTracker, summarizeIntervals } from "./reverseCadence";
import {
  REPO,
  TMP,
  applyAudioFilter,
  compareFrames,
  decodeAudioToPcm,
  ff,
  frameAt,
  record,
  round,
  tierOf,
} from "./parityHarness203-core";

// ---------------------------------------------------------------------------
// S6 — P3 reverse VIDEO: sourceTimeAt (preview) vs filter reverse (render)
// ---------------------------------------------------------------------------
function indexedFixtureVideo(): { file: string; w: number; h: number; fps: number; frames: number } {
  const w = 160;
  const h = 90;
  const fps = 30;
  const frames = 60;
  const raw = path.join(TMP, "rev-src.raw");
  const chunks: Buffer[] = [];
  for (let k = 0; k < frames; k++) {
    const buf = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3;
        buf[i] = (k * 37 + x * 2) % 256; // mã hoá số frame vào R
        buf[i + 1] = (255 - k * 4 + y) % 256; // ... và G
        buf[i + 2] = (x + y + k * 11) % 256;
      }
    chunks.push(buf);
  }
  fs.writeFileSync(raw, Buffer.concat(chunks));
  const file = path.join(TMP, "rev-src.mkv");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", String(fps),
    "-i", raw, "-c:v", "libx264rgb", "-crf", "0", "-pix_fmt", "rgb24", file], "encode fixture");
  return { file, w, h, fps, frames };
}
function extractFrames(file: string, vf: string): Buffer {
  const out = path.join(TMP, "rev-out.raw");
  const args = ["-v", "error", "-y", "-i", file];
  if (vf) args.push("-vf", vf);
  args.push("-f", "rawvideo", "-pix_fmt", "rgb24", out);
  ff(args, `extract ${vf || "copy"}`);
  return fs.readFileSync(out);
}
export function sectionReverseVideo(): void {
  console.log("== S6 reverse video (P3) — sourceTimeAt preview vs filter reverse render ==");
  const { file, w, h, fps, frames } = indexedFixtureVideo();
  const orig = extractFrames(file, "");
  const rev = extractFrames(file, "reverse");
  const clip = { start: 0, in: 0, out: 2, speed: 1, reverse: true } as never;
  // Đối chứng xuôi: mapping không đảo phải cho MAD 0 (khóa harness).
  const fwdClip = { start: 0, in: 0, out: 2, speed: 1, reverse: false } as never;
  {
    let worst = 0;
    for (const t of [0, 0.5, 1.0, 1.5]) {
      const s = sourceTimeAt(fwdClip, t);
      const idx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
      const m = compareFrames(frameAt(orig, w, h, idx), frameAt(orig, w, h, Math.floor(t * fps)), w, h);
      worst = Math.max(worst, m.mad);
    }
    record({
      id: "S6-control-forward",
      name: "đối chứng xuôi: sourceTimeAt (không reverse) khớp frame gốc",
      verdict: worst === 0 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { worst_MAD: worst },
      notes: `Harness tự kiểm: mapping xuôi phải cho MAD đúng 0 trên fixture lossless (libx264rgb crf 0).`,
    });
  }
  // Ngược, lấy mẫu GIỮA frame (S6a — phép so đúng): frame render k phủ
  // output [k/30,(k+1)/30); lấy mẫu tại t=(k+0.5)/30 thì sourceTimeAt cho
  // đúng frame N-1-k. Lấy mẫu đúng biên k/30 (S6b) là quy ước khác — xem dưới.
  let worstMad = 0;
  const perT: string[] = [];
  for (const k of [0, 1, 15, 30, 45, 59]) {
    const t = (k + 0.5) / fps;
    const s = sourceTimeAt(clip, t);
    const srcIdx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
    const expectedIdx = frames - 1 - k; // filter reverse: frame k = nguồn N-1-k
    const m = compareFrames(frameAt(rev, w, h, k), frameAt(orig, w, h, srcIdx), w, h);
    worstMad = Math.max(worstMad, m.mad);
    perT.push(`k=${k} t=${round(t)} srcIdx=${srcIdx} expect=${expectedIdx} MAD=${round(m.mad)}`);
  }
  record({
    id: "S6a-reverse-video-midframe",
    name: "reverse video (giữa frame): frame preview (sourceTimeAt) vs frame render (filter reverse)",
    verdict: worstMad <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
    tier: worstMad <= 2 ? "KHỚP" : tierOf({ mad: worstMad, mse: 0, psnr: 0, le8: 0, le32: 0 }),
    numbers: { worst_MAD: worstMad, n_timestamps: 6 },
    notes: perT.join(" | ") + ` Tiêu chí: MAD<=2 ở mọi mốc (lấy mẫu giữa frame).`,
  });
  // Ngược, lấy mẫu ĐÚNG BIÊN k/30 (S6b — đường seek-stepping thật của
  // preview): preview seek element tới đúng sourceTimeAt(t) = out-k/30,
  // trình duyệt hiện frame floor(s*30) = N-k, trong khi render frame k là
  // nguồn N-1-k. Lệch hệ thống +1 frame ở MỌI biên — đúng đường phát ngược
  // từng bước của preview.tsx (a.el.currentTime = a.target, target từ
  // sourceTimeAt; reversePlayback bước đúng bội số frameDur). Phát xuôi
  // không lệch ở biên vì frame k bắt đầu đúng tại k/30.
  {
    let worstMadB = 0;
    let worstOffB = 0;
    const perTB: string[] = [];
    for (const k of [0, 1, 15, 30, 45, 59]) {
      const t = k / fps;
      const s = sourceTimeAt(clip, t);
      const srcIdx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
      const expectedIdx = frames - 1 - k;
      const off = srcIdx - expectedIdx;
      const m = compareFrames(frameAt(rev, w, h, k), frameAt(orig, w, h, srcIdx), w, h);
      worstMadB = Math.max(worstMadB, m.mad);
      worstOffB = Math.max(worstOffB, off);
      perTB.push(`k=${k} srcIdx=${srcIdx} expect=${expectedIdx} off=${off} MAD=${round(m.mad)}`);
    }
    record({
      id: "S6b-reverse-video-boundary",
      name: "reverse video (đúng biên lưới frame): frame preview vs render — đường seek-stepping",
      verdict: "GHI NHẬN",
      numbers: { worst_MAD: worstMadB, worst_frame_offset: worstOffB, n_timestamps: 6 },
      notes: perTB.join(" | ") + ` GHI NHẬN (KHÔNG VERDICT — theo P4-192 §4.2): check này đo mapping GỐC sourceTimeAt + floor, P3 sửa Ở TẦNG SEEK (reverseSeekTarget: target - 1ms) chứ không sửa sourceTimeAt nên analytic vẫn +1 BY DESIGN; không tính vào tổng. Check quyết định là S6b-headed (seek thật trên Chrome).`,
    });
  }
  // Ngược + speed 2: timeline 1s, t=0.25 → nguồn out - 0.5 = 1.5.
  {
    const clip2 = { start: 0, in: 0, out: 2, speed: 2, reverse: true } as never;
    const s = sourceTimeAt(clip2, 0.25);
    const srcIdx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
    const expectedIdx = 45; // nguồn 1.5s → frame 45
    const outIdx = Math.min(frames - 1, Math.floor(0.25 * fps)); // output frame 7 trong clip 1s
    // Render tương đương: reverse rồi setpts=PTS/2 → frame output 7 = nguồn frame 45.
    const rev2 = extractFrames(file, "reverse,setpts=PTS/2,fps=30");
    const m = compareFrames(frameAt(rev2, w, h, outIdx), frameAt(orig, w, h, srcIdx), w, h);
    record({
      id: "S6-reverse-speed2",
      name: "reverse + speed 2: sourceTimeAt vs render reverse+setpts",
      verdict: Math.abs(srcIdx - expectedIdx) <= 1 && m.mad <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { sourceTime_s: s, srcIdx, expectedIdx, MAD: m.mad },
      notes: `t=0.25s → nguồn ${round(s)}s (frame ${srcIdx}); render frame ${outIdx} sau reverse+setpts=PTS/2.`,
    });
  }
}

// ---------------------------------------------------------------------------
// S7 — P3 reverse AUDIO: areverse render (exact) + preview có đảo audio không
// ---------------------------------------------------------------------------
export async function sectionReverseAudio(): Promise<void> {
  console.log("== S7 reverse audio (P3) — areverse render + preview wiring ==");
  const sr = 48000;
  const n = sr; // 1s
  const raw = path.join(TMP, "aramp.raw");
  const buf = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = t; // ramp 0→1: bất đối xứng nên đảo là phát hiện được
    buf.writeFloatLE(0.5 * env * Math.sin((2 * Math.PI * 440 * i) / sr), i * 4);
  }
  fs.writeFileSync(raw, buf);
  const inWav = path.join(TMP, "aramp.wav");
  ff(["-v", "error", "-y", "-f", "f32le", "-ar", "48000", "-ac", "1", "-i", raw, "-c:a", "pcm_s16le", inWav], "write aramp");
  const outWav = path.join(TMP, "aramp-rev.wav");
  applyAudioFilter(inWav, "areverse", outWav);
  const { samples: orig } = decodeAudioToPcm(inWav);
  const { samples: rev } = decodeAudioToPcm(outWav);
  let maxAbs = 0;
  let sumAbs = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(rev[i] - orig[n - 1 - i]);
    maxAbs = Math.max(maxAbs, d);
    sumAbs += d;
  }
  const mad = sumAbs / n;
  record({
    id: "S7-areverse-render",
    name: "areverse render: mẫu đảo phải trùng mẫu gốc đảo thời gian",
    verdict: maxAbs <= 0.002 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { max_abs_diff: maxAbs, mean_abs_diff: mad },
    notes: `Render areverse là đảo mẫu chính xác (ngưỡng 0.002 ≈ 1 LSB 16-bit + làm tròn float).`,
  });
  // S7b — logic đảo audio của P3 (reverseAudio.ts): chạy thật các hàm thuần
  // + player với fake AudioContext (ghi lại lệnh start).
  {
    const ch = new Float32Array([1, 2, 3, 4]);
    const rev = reverseFloat32Channel(ch);
    const inputUnchanged = ch[0] === 1 && ch[3] === 4;
    const revOk = rev[0] === 4 && rev[1] === 3 && rev[2] === 2 && rev[3] === 1;
    const off = reversedSampleOffset({ playheadSec: 0.25, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000 });
    const offOutside = reversedSampleOffset({ playheadSec: 1.5, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000 });
    const offStart = reversedSampleOffset({ playheadSec: 0, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000 });
    const win = reversedSegmentWindow({ playheadSec: 0.25, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000, windowSec: 0.1 });
    const winNull = reversedSegmentWindow({ playheadSec: 0.25, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000, windowSec: 0 });
    // Player với fake ctx.
    const makeFakeCtx = (durSec: number) => {
      const calls: { startArgs: unknown[] } = { startArgs: [] };
      const buf = {
        numberOfChannels: 1, length: Math.floor(durSec * 48000), sampleRate: 48000, duration: durSec,
        getChannelData: () => {
          const a = new Float32Array(Math.floor(durSec * 48000));
          for (let i = 0; i < a.length; i++) a[i] = i / 48000;
          return a;
        },
      };
      const ctx = {
        sampleRate: 48000, currentTime: 0, state: "running", destination: {},
        decodeAudioData: async () => buf,
        createBuffer: (channels: number, length: number, sampleRate: number) => {
          const chs = Array.from({ length: channels }, () => new Float32Array(length));
          return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (c: number) => chs[c] };
        },
        createBufferSource: () => ({
          buffer: null as unknown, connect() {}, disconnect() {},
          start: (...a: unknown[]) => { calls.startArgs = a; }, stop() {},
        }),
        createGain: () => ({
          gain: { value: 0, setTargetAtTime() {}, linearRampToValueAtTime() {} },
          connect() {}, disconnect() {},
        }),
        resume: async () => {},
      };
      return { ctx: ctx as never, calls };
    };
    const { ctx, calls } = makeFakeCtx(1);
    const player = new ReverseAudioPlayer(ctx);
    const loaded = await player.loadReversed(new ArrayBuffer(8));
    const playOk = loaded && player.playSegment(36000, 0.1);
    const startOffset = calls.startArgs.length >= 2 ? Number(calls.startArgs[1]) : NaN;
    // Đợt 193 P3 — cổng clip dài ĐỔI: loadReversed (không cửa sổ) vẫn
    // từ chối > 60 s, nhưng wiring nay đưa clip 61–600 s sang
    // loadReversedWindow (cửa sổ 30 s) thay vì mute; chỉ > 600 s mới
    // mute. S7b cũ assert "61 s bị từ chối" nay SAI về hành vi người
    // dùng — cập nhật theo thiết kế mới (P3-193 §2.2c, test 192 đã sửa
    // tương tự 61 s → 601 s).
    const { ctx: ctxLong } = makeFakeCtx(61);
    const playerLong = new ReverseAudioPlayer(ctxLong);
    const loadedLongPlain = await playerLong.loadReversed(new ArrayBuffer(8));
    const loadedLongWindowed = await playerLong.loadReversedWindow(new ArrayBuffer(8), 31, REVERSED_AUDIO_WINDOW_SEC);
    const win61Start = playerLong.windowStartSec;
    const win61End = playerLong.windowEndSec;
    const dur61 = playerLong.durationSec;
    const { ctx: ctxTooLong } = makeFakeCtx(601);
    const playerTooLong = new ReverseAudioPlayer(ctxTooLong);
    const loadedTooLongWindowed = await playerTooLong.loadReversedWindow(new ArrayBuffer(8), 571, REVERSED_AUDIO_WINDOW_SEC);
    const logicOk =
      revOk && inputUnchanged && off === 36000 && offOutside === -1 && offStart === 48000 &&
      win !== null && win.startSample === 36000 && win.lengthSamples === 4800 && winNull === null &&
      loaded === true && player.loaded && player.durationSec === 1 && playOk === true &&
      Math.abs(startOffset - 0.75) < 1e-9 &&
      loadedLongPlain === false && loadedLongWindowed === true &&
      Math.abs(win61Start - 31) < 1e-9 && Math.abs(win61End - 61) < 1e-9 && Math.abs(dur61 - 61) < 1e-9 &&
      loadedTooLongWindowed === false;
    record({
      id: "S7b-reverse-audio-logic",
      name: "reverse audio logic (P3): đảo mẫu + offset + player phát đoạn đảo",
      verdict: logicOk ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        reverse_exact: revOk && inputUnchanged ? 1 : 0,
        offset_at_0_25s: off, offset_outside: offOutside, offset_at_0s: offStart,
        window_start: win?.startSample ?? -1, window_len: win?.lengthSamples ?? -1,
        load_1s: loaded ? 1 : 0, play_segment: playOk ? 1 : 0, start_offset_s: startOffset,
        load_61s_plain_rejected: loadedLongPlain ? 0 : 1,
        load_61s_windowed: loadedLongWindowed ? 1 : 0,
        window_61s_start_s: win61Start, window_61s_end_s: win61End, duration_61s_s: dur61,
        load_601s_windowed_rejected: loadedTooLongWindowed ? 0 : 1,
        max_windowed_s: MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
      },
      notes: `Hàm thuần + ReverseAudioPlayer chạy thật với fake ctx (decode 1s ramp → đảo → start offset 0.75s). Đợt 193: clip 61 s KHÔNG còn bị từ chối — load theo cửa sổ 30 s [31,61], durationSec vẫn 61; chỉ clip > ${MAX_REVERSED_AUDIO_WINDOWED_SECONDS} s mới mute. loadReversed (không cửa sổ) vẫn giữ cổng 60 s. Logic ĐẠT ≠ đã nối vào preview (xem S7c) và ≠ crossfade đã kích hoạt headed (xem N7).`,
    });
  }
  // S7c — wiring: ReverseAudioPlayer đã nối vào preview chưa?
  // Đợt 192 P3 nối qua module trung gian reverseAudioWiring.ts (không
  // nhắc trực tiếp ReverseAudioPlayer trong preview.tsx): preview.tsx
  // import + tạo lười ReverseAudioWiring rồi gọi wiring.tick(t, entries)
  // mỗi tick phát ngược; wiring gọi loadReversed + playSegment trên
  // player. Mute element (gain 0 khi phát ngược) CÒN NGUYÊN theo thiết
  // kế — element vẫn paused, tiếng ngược đi qua player với gain GỐC
  // (preview.tsx ~5900-5907) — nên số nhánh mute không còn là tín hiệu
  // lỗi; badge "audio đảo" hiển thị theo wiring.isPlaying (~6575/7732).
  {
    const previewSrc = fs.readFileSync(path.join(REPO, "apps/web/src/preview.tsx"), "utf8");
    const engineSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/audioEngine.ts"), "utf8");
    const wiringSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/reverseAudioWiring.ts"), "utf8");
    const wiringInPreview = (previewSrc.match(/ReverseAudioWiring/g) || []).length;
    const tickCalls = (previewSrc.match(/wiring\.tick\(/g) || []).length;
    const wiringFactoryCalls = (previewSrc.match(/getReverseAudioWiring\(/g) || []).length;
    const playerInWiring = (wiringSrc.match(/ReverseAudioPlayer/g) || []).length;
    const loadCalls = (wiringSrc.match(/loadReversed/g) || []).length;
    const playCalls = (wiringSrc.match(/playSegment/g) || []).length;
    const playerInEngine = (engineSrc.match(/ReverseAudioPlayer/g) || []).length;
    const offsetUses = ((previewSrc.match(/reversedSampleOffset/g) || []).length) + ((wiringSrc.match(/reversedSampleOffset/g) || []).length);
    // Nhánh mute phát-ngược (preview.tsx ~5887): playing && reversePlayback
    // → mọi audioSource gain 0 — CÒN theo thiết kế (element paused).
    const muteBranches = (previewSrc.match(/playing && reversePlayback/g) || []).length;
    const wired = wiringInPreview > 0 && tickCalls > 0 && playerInWiring > 0 && (loadCalls > 0 || playCalls > 0);
    record({
      id: "S7c-reverse-audio-wiring",
      name: "reverse audio preview: ReverseAudioWiring nối vào preview (tick + load/play + mute)",
      verdict: wired ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        wiring_mentions_preview: wiringInPreview, wiring_tick_calls: tickCalls,
        wiring_factory_calls: wiringFactoryCalls, player_mentions_wiring: playerInWiring,
        loadReversed_calls: loadCalls, playSegment_calls: playCalls,
        player_mentions_engine: playerInEngine,
        reversedSampleOffset_uses: offsetUses, mute_branches: muteBranches,
      },
      notes: `Tiêu chí ĐẠT: preview.tsx nhắc ReverseAudioWiring + gọi wiring.tick VÀ reverseAudioWiring.ts nhắc ReverseAudioPlayer + gọi loadReversed/playSegment. Mute element "playing && reversePlayback" còn ${muteBranches} chỗ — BY DESIGN (element paused, tiếng ngược qua player với gain gốc, preview.tsx ~5900-5907); badge "audio đảo" theo wiring.isPlaying. S7b (logic) ĐẠT nhưng người dùng chỉ nghe được tiếng ngược khi wiring này ĐẠT.`,
    });
  }
  // S7d — mapping thời gian audio reverse (sourceTimeAt dùng chung cho audio clip).
  const audioClip = { start: 0, in: 0, out: 1, speed: 1, reverse: true } as never;
  const sMid = sourceTimeAt(audioClip, 0.25); // kỳ vọng 0.75
  record({
    id: "S7d-reverse-audio-mapping",
    name: "reverse audio mapping: sourceTimeAt cho audio clip reverse",
    verdict: Math.abs(sMid - 0.75) < 1e-9 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { sourceTime_at_0_25s: sMid },
    notes: `Chỉ kiểm mapping thời gian (đã ĐẠT). Nghe được tiếng ngược hay không là S7b/S7c: logic có, wiring xem S7c (đợt 192 nối qua ReverseAudioWiring).`,
  });
  // N7 — audio đảo clip dài + crossfade (P3-193 §2.2): cửa sổ 30 s tới
  // 600 s, offset tuyệt đối, crossfade 80 ms. Kiểm bằng fake ctx (ghi
  // lại lệnh start/stop) + đếm wiring. KHÔNG claim crossfade đã kích
  // hoạt headed — P3-193 F-193-P3-1: restart=0 headed dưới tải nên
  // crossfade chỉ chứng minh ở unit; P4 đo headed lại clip 70 s ở
  // N7-headed (xem LIMITS §2.7).
  {
    const sr = 48000;
    const sources: { startArgs: unknown[]; stopArgs: unknown[] }[] = [];
    const mkCtx = (durSec: number) => {
      const buf = {
        numberOfChannels: 1, length: Math.floor(durSec * sr), sampleRate: sr, duration: durSec,
        getChannelData: () => {
          const a = new Float32Array(Math.floor(durSec * sr));
          for (let i = 0; i < a.length; i++) a[i] = i / sr; // giá trị = chỉ số mẫu / sr (mã hoá vị trí)
          return a;
        },
      };
      const ctx = {
        sampleRate: sr, currentTime: 0, state: "running", destination: {},
        decodeAudioData: async () => buf,
        createBuffer: (channels: number, length: number, sampleRate: number) => {
          const chs = Array.from({ length: channels }, () => new Float32Array(length));
          return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (c: number) => chs[c] };
        },
        createBufferSource: () => {
          const s = { buffer: null as unknown, connect() {}, disconnect() {}, start: (...a: unknown[]) => { (s as { startArgs: unknown[] }).startArgs = a; }, stop: (...a: unknown[]) => { (s as { stopArgs: unknown[] }).stopArgs = a; }, startArgs: [] as unknown[], stopArgs: [] as unknown[] };
          sources.push(s);
          return s;
        },
        createGain: () => ({
          gain: { value: 0, setTargetAtTime() {}, linearRampToValueAtTime() {} },
          connect() {}, disconnect() {},
        }),
        resume: async () => {},
      };
      return ctx as never;
    };
    const ctx100 = mkCtx(100);
    const p100 = new ReverseAudioPlayer(ctx100);
    const loaded100 = await p100.loadReversedWindow(new ArrayBuffer(8), 60, REVERSED_AUDIO_WINDOW_SEC);
    const wStart = p100.windowStartSec;
    const wEnd = p100.windowEndSec;
    const dur100 = p100.durationSec;
    // Nội dung cửa sổ: mẫu đầu = forward[endIdx−1] ≈ 90 s, mẫu cuối = forward[startIdx] = 60 s.
    const winData = (p100 as unknown as { reversed: { getChannelData: (c: number) => Float32Array } | null }).reversed;
    const firstVal = winData ? winData.getChannelData(0)[0] : NaN;
    const lastVal = winData ? winData.getChannelData(0)[winData.getChannelData(0).length - 1] : NaN;
    // playSegment nhận offset TUYỆT ĐỐI: forward 75 s → abs = total − 75·sr
    // = 1.200.000 mẫu; tương đối trong cửa sổ [60,90] = 720.000 mẫu = 15 s.
    const total = 100 * sr;
    const abs75 = total - 75 * sr;
    const ok75 = p100.playSegment(abs75, 0.5);
    const startArgs75 = sources.length > 0 ? (sources[sources.length - 1].startArgs as unknown[]) : [];
    const startOff75 = startArgs75.length >= 2 ? Number(startArgs75[1]) : NaN;
    // Ngoài cửa sổ: forward 95 s → abs = 240.000 < windowBase 480.000 → false.
    const ok95 = p100.playSegment(total - 95 * sr, 0.5);
    // Crossfade: phát đoạn thứ hai (cùng cửa sổ) → đoạn cũ phải stop ở
    // t0 + 0,08 s (không cắt ngay), đoạn mới bắt đầu ngay.
    const ok2nd = p100.playSegment(abs75 + 24000, 0.5);
    const prevStop = sources.length >= 2 ? (sources[0].stopArgs as unknown[]) : [];
    const prevStopSec = prevStop.length >= 1 ? Number(prevStop[0]) : NaN;
    // Wiring: clip dài đi qua loadReversedWindow + longClips + counters +
    // restart-exact (không đếm verdict theo số lần nhắc tuyệt đối, chỉ
    // cần > 0 cho mỗi cơ chế).
    const wiringSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/reverseAudioWiring.ts"), "utf8");
    const loadWindowedCalls = (wiringSrc.match(/loadReversedWindow/g) || []).length;
    const longClipsMentions = (wiringSrc.match(/longClips/g) || []).length;
    const countersMentions = (wiringSrc.match(/counters/g) || []).length;
    const restartExactMentions = (wiringSrc.match(/restart-exact/g) || []).length;
    const gate600 = (wiringSrc.match(/MAX_REVERSED_AUDIO_WINDOWED_SECONDS/g) || []).length;
    const n7Ok =
      loaded100 === true && Math.abs(wStart - 60) < 1e-9 && Math.abs(wEnd - 90) < 1e-9 && Math.abs(dur100 - 100) < 1e-9 &&
      Math.abs(firstVal - 90) < 1e-3 && Math.abs(lastVal - 60) < 1e-9 &&
      ok75 === true && Math.abs(startOff75 - 15) < 1e-9 && ok95 === false &&
      ok2nd === true && Math.abs(prevStopSec - REVERSED_AUDIO_CROSSFADE_SEC) < 1e-9 &&
      loadWindowedCalls > 0 && longClipsMentions > 0 && countersMentions > 0 && restartExactMentions > 0 && gate600 > 0;
    record({
      id: "N7-reverse-audio-longclip",
      name: "audio đảo clip dài (P3-193): cửa sổ 30 s + offset tuyệt đối + crossfade 80 ms",
      verdict: n7Ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        window_100s_loaded: loaded100 ? 1 : 0, window_start_s: wStart, window_end_s: wEnd, duration_100s_s: dur100,
        window_data_first_s: firstVal, window_data_last_s: lastVal,
        play_abs75_ok: ok75 ? 1 : 0, play_abs75_start_offset_s: startOff75,
        play_outside_window_rejected: ok95 ? 0 : 1,
        crossfade_prev_stop_s: prevStopSec, crossfade_sec: REVERSED_AUDIO_CROSSFADE_SEC,
        wiring_loadWindowed_calls: loadWindowedCalls, wiring_longClips_mentions: longClipsMentions,
        wiring_counters_mentions: countersMentions, wiring_restart_exact_mentions: restartExactMentions,
        wiring_gate600_mentions: gate600,
      },
      notes: `Player chạy thật với fake ctx (100 s ramp): cửa sổ [60,90] đúng, durationSec vẫn 100, offset tuyệt đối đổi đúng về tương đối (75 s → start 15 s), ngoài cửa sổ từ chối, đoạn cũ stop ở t0+0,08 s (crossfade). Wiring có đủ 5 cơ chế (loadReversedWindow/longClips/counters/restart-exact/cổng 600 s). GIỚI HẠN: crossfade + restart-exact chỉ chứng minh ở mức unit/fake-ctx — headed dưới tải P3 đo restart=0 (F-193-P3-1), cần cửa sổ rảnh đo lại; clip 70 s phát thật headed xem N7-headed (LIMITS §2.7).`,
    });
  }
}

// ---------------------------------------------------------------------------
// N6 — P3 scrub NGƯỢC tại biên (nợ S6b đợt 192): đường pause/seek
// (Seeker trong seek.ts) trước đây seek tới đúng target nên scrub tại
// biên ngược hiện N−k thay vì N−1−k (P3-193 đo headed: 0/4 biên đúng).
// Đợt 193 P3 tách backoff riêng cho scrub: reverseScrubSeekTarget +
// cờ per-target reverseScrub (seekElement không snapToFrame — round
// sẽ nuốt mất 1 ms — và so frame bằng floor). Check này gồm 3 lớp:
// (a) hàm thuần reverseScrubSeekTarget đúng ở mọi biên; (b) mapping
// scrub (sourceTimeAt → reverseScrubSeekTarget → floor) cho đúng
// frame render; (c) wiring: executor scrub ở preview.tsx áp backoff
// cho video ngược + seek.ts tôn trọng cờ. Hành vi element với target
// đã lùi 1 ms đã chứng minh headed ở S6b-headed (9/9 offset 0) —
// N6 không lái UI app thật (ghi rõ giới hạn), mà kiểm target mà
// đường scrub tính + wiring đưa target đó tới element.
// ---------------------------------------------------------------------------
export function sectionScrubReverse(): void {
  console.log("== N6 scrub ngược tại biên (P3) — reverseScrubSeekTarget + wiring ==");
  // (a) Hàm thuần: biên k/30 → k/30 − 1ms khi reverse; xuôi giữ nguyên; 0 → 0.
  const fps = 30;
  const frames = 60;
  const clip = { start: 0, in: 0, out: 2, speed: 1, reverse: true } as never;
  const pureRows: string[] = [];
  let pureOk = true;
  for (const k of [0, 1, 15, 30, 45, 59]) {
    const t = k / fps;
    const s = sourceTimeAt(clip, t);
    const scrub = reverseScrubSeekTarget(s, true);
    const fwd = reverseScrubSeekTarget(s, false);
    const want = s - 0.001; // k=0: t=0 ngược → s=out=2,0 (không phải 0); clamp 0 chỉ khi s≈0, kiểm riêng dưới
    const ok = Math.abs(scrub - want) < 1e-9 && Math.abs(fwd - s) < 1e-9;
    pureOk = pureOk && ok;
    pureRows.push(`k=${k} s=${s.toFixed(4)} scrub=${scrub.toFixed(4)} want=${want.toFixed(4)} fwd=${fwd.toFixed(4)} ${ok ? "ok" : "SAI"}`);
  }
  const zeroOk = reverseScrubSeekTarget(0, true) === 0 && reverseScrubSeekTarget(-1, true) === 0;
  pureOk = pureOk && zeroOk;
  // (b) Mapping scrub: floor(scrubTarget × fps) phải = frame render N−1−k.
  let worstOff = 0;
  const mapRows: string[] = [];
  for (const k of [0, 1, 15, 30, 45, 59]) {
    const t = k / fps;
    const s = sourceTimeAt(clip, t);
    const scrub = reverseScrubSeekTarget(s, true);
    const shown = Math.min(frames - 1, Math.max(0, Math.floor(scrub * fps)));
    const expectedIdx = frames - 1 - k;
    const off = shown - expectedIdx;
    worstOff = Math.max(worstOff, Math.abs(off));
    mapRows.push(`k=${k} scrub=${scrub.toFixed(4)} shown=${shown} expect=${expectedIdx} off=${off}`);
  }
  // (c) Wiring: executor scrub preview.tsx + seek.ts tôn trọng cờ.
  const previewSrc = fs.readFileSync(path.join(REPO, "apps/web/src/preview.tsx"), "utf8");
  const seekSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/seek.ts"), "utf8");
  const execUses = (previewSrc.match(/reverseScrubSeekTarget\(/g) || []).length;
  const flagSets = (previewSrc.match(/reverseScrub: true/g) || []).length;
  const flagInSeekTarget = seekSrc.includes("reverseScrub?: boolean");
  const noSnap = seekSrc.includes("reverseScrub ? target : snapToFrame");
  const floorCmp = seekSrc.includes("reverseScrub ? frameIndexFloor : frameIndexOf");
  const wired = execUses > 0 && flagSets > 0 && flagInSeekTarget && noSnap && floorCmp;
  record({
    id: "N6-scrub-reverse-boundary",
    name: "scrub ngược tại biên: reverseScrubSeekTarget + mapping + wiring (Seeker không snap 1ms)",
    verdict: pureOk && worstOff === 0 && wired ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      pure_fn_ok: pureOk ? 1 : 0, worst_frame_offset: worstOff, n_boundaries: 6,
      executor_uses: execUses, flag_sets: flagSets,
      seek_flag: flagInSeekTarget ? 1 : 0, no_snap_when_flag: noSnap ? 1 : 0, floor_compare: floorCmp ? 1 : 0,
      wired: wired ? 1 : 0,
    },
    notes: `Hàm thuần: ${pureRows.join(" | ")} (clamp 0/âm → 0: ${zeroOk ? "ok" : "SAI"}). Mapping scrub: ${mapRows.join(" | ")}. Wiring: preview.tsx dùng reverseScrubSeekTarget ${execUses} lần + đặt cờ reverseScrub ${flagSets} lần (chỉ video ngược; audio/xuôi giữ target gốc); seek.ts có cờ per-target + không snap khi cờ bật + so frame bằng floor. Giới hạn: N6 kiểm target + wiring + hành vi element đã chứng minh ở S6b-headed (seek tới biên−1ms hiện đúng frame, 9/9) — KHÔNG lái UI scrub thật trong app (P3-193 đo headed đường scrub: xem LIMITS P3 §1).`,
  });
}

// ---------------------------------------------------------------------------
// S8 — P3 reverse MƯỢT: bước lùi đều + cổng decode-ahead + proxy
// ---------------------------------------------------------------------------
export function sectionReverseSmooth(): void {
  console.log("== S8 reverse mượt (P3) — bước lùi đều + cổng gate ==");
  // Mô phỏng 60 bước lùi 1/30s từ t=2.0: mỗi bước đúng 1 frame, chạm 0 đúng bước 60.
  const frameDur = 1 / 30;
  let t = 2.0;
  let acc = 0;
  let maxStepErr = 0;
  let reachedAt: number | null = null;
  for (let step = 1; step <= 60; step++) {
    const r = reverseStep(acc, frameDur, frameDur);
    maxStepErr = Math.max(maxStepErr, Math.abs(r.steps - 1));
    acc = r.accumulated;
    const p = reversePlayhead(t, r.steps, frameDur);
    t = p.t;
    if (p.reachedStart && reachedAt === null) reachedAt = step;
  }
  record({
    id: "S8-reverse-steps",
    name: "reverse mượt: 60 bước lùi 1/30s đều, chạm 0 đúng bước 60",
    verdict: maxStepErr === 0 && reachedAt === 60 && Math.abs(t) < 1e-9 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { max_step_err_frames: maxStepErr, reached_start_at_step: reachedAt ?? -1, final_t: t },
    notes: `reverseStep/reversePlayhead thật (không tích lũy lệch). Mượt ở đây = bước đều 1 frame, không nhảy/bỏ frame do làm tròn.`,
  });
  // Cổng decode-ahead: mặc định chặn khi opt-in tắt; cho phép thử nghiệm
  // chỉ khi opt-in + footage dễ decode (hoặc HW đã chứng minh).
  const blocked = resolveDecodeAheadGate({ optIn: false, hardwareProof: null, softwareMeasurement: null });
  const blockedNoProof = resolveDecodeAheadGate({
    optIn: true,
    hardwareProof: null,
    softwareMeasurement: { decodeFps: 30, loadLabel: "quiet", resolution: "1280x720" },
  });
  const allowed = resolveDecodeAheadGate({
    optIn: true,
    hardwareProof: null,
    softwareMeasurement: { decodeFps: 60, loadLabel: "quiet", resolution: "1280x720" },
  });
  const gateOk =
    blocked.verdict === "blocked" && blockedNoProof.verdict === "blocked" && allowed.verdict === "allowed-experiment";
  record({
    id: "S8-decode-ahead-gate",
    name: "cổng decode-ahead (đợt 36 S3): chặn mặc định, chỉ mở khi đủ bằng chứng",
    verdict: gateOk ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { optin_off: blocked.verdict === "blocked" ? 1 : 0, optin_no_proof: blockedNoProof.verdict === "blocked" ? 1 : 0, optin_easy: allowed.verdict === "allowed-experiment" ? 1 : 0 },
    notes: `opt-in tắt → ${blocked.verdict}; opt-in + decode 30fps (dưới ngưỡng dễ 2×) → ${blockedNoProof.verdict}; opt-in + decode 60fps → ${allowed.verdict}.`,
  });
  // Cadence tracker (đợt 191 P3): hàm thuần + đã nối vào preview.tsx
  // (window.__vcutReverseCadence). Chỉ kiểm tra DỤNG CỤ ĐO — fps ngược
  // thật khi phát (P3 baseline headed: 0,08 fps) KHÔNG đo lại được headless.
  {
    const sum = summarizeIntervals([10, 20, 30, 40]);
    const tracker = new ReverseCadenceTracker();
    tracker.start(0);
    const r1 = tracker.recordPresented(10, 0);
    const rDup = tracker.recordPresented(10, 33);
    const r2 = tracker.recordPresented(9, 33);
    const r3 = tracker.recordPresented(8, 66);
    const snap = tracker.snapshot();
    const previewSrc = fs.readFileSync(path.join(REPO, "apps/web/src/preview.tsx"), "utf8");
    const wiredCadence =
      previewSrc.includes("ReverseCadenceTracker") && previewSrc.includes("__vcutReverseCadence");
    const ok =
      sum.median === 30 && sum.p90 === 40 && sum.max === 40 && sum.mean === 25 &&
      r1 === true && rDup === false && r2 === true && r3 === true &&
      snap !== null && snap.presentedFrames === 3 && snap.distinctFrames === 3 &&
      snap.intervalMedianMs === 33 && snap.stallsOver100Ms === 0 &&
      Math.abs(snap.presentedFps - 45.45) < 0.01 && wiredCadence;
    record({
      id: "S8-cadence-tracker",
      name: "cadence ngược: tracker đo đúng + đã nối vào preview (dụng cụ đo)",
      verdict: ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        median_ms: sum.median ?? -1, p90_ms: sum.p90 ?? -1, max_ms: sum.max ?? -1, mean_ms: sum.mean ?? -1,
        presented_frames: snap?.presentedFrames ?? -1, distinct_frames: snap?.distinctFrames ?? -1,
        interval_median_ms: snap?.intervalMedianMs ?? -1, presented_fps: snap?.presentedFps ?? -1,
        wired_preview: wiredCadence ? 1 : 0,
      },
      notes: `summarizeIntervals([10,20,30,40]) → median 30/p90 40/max 40/mean 25; tracker khử trùng vẽ lại (dup → false), 3 frame mới trong 66ms → 45.45 fps. Đây là kiểm tra dụng cụ đo, KHÔNG phải verdict "phát ngược đã mượt" — fps ngược thật cần đo headed (P3 baseline: 0,08 fps trên fixture 300 frame/1 GOP; xem LIMITS §4).`,
    });
  }
  // Proxy làm hướng chính cho chiều ngược: cần đủ 3 điều kiện đo thật.
  const proxyYes = resolveProxyMainDirection({
    proxyDisplayedFps: 30, originalDisplayedFps: 28, proxyDecodeFps: 60,
  });
  const proxyNo = resolveProxyMainDirection({
    proxyDisplayedFps: 24, originalDisplayedFps: 30, proxyDecodeFps: 60,
  });
  record({
    id: "S8-proxy-direction",
    name: "proxy hướng chính chiều ngược: chỉ yes khi đủ điều kiện đo",
    verdict: proxyYes.verdict === "yes" && proxyNo.verdict === "no" ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { proxy_ok_yes: proxyYes.verdict === "yes" ? 1 : 0, proxy_slow_no: proxyNo.verdict === "no" ? 1 : 0 },
    notes: `proxy 30fps >= gốc 28fps + decode 60fps → ${proxyYes.verdict}; proxy 24fps < 30fps phát → ${proxyNo.verdict}.`,
  });
}

// ---------------------------------------------------------------------------
// N4 — P2 sharpen trên nội dung NHIỄU: applySharpen vs unsharp render
// ---------------------------------------------------------------------------
