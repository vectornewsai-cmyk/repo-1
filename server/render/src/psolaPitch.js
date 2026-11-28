/**
 * psolaPitch.js — Pitch-shift TD-PSOLA cho render worker (đợt 197 P1, Node, zero-deps).
 *
 * Thống nhất render sang PSOLA (quyết (a2)-196): thay filter FFmpeg
 * `rubberband` (phase vocoder) bằng CÙNG code PSOLA với preview —
 * `psola.ts` (apps/web/src/lib/psola.ts) được require TRỰC TIẾP qua
 * type-stripping của Node 24 (không copy thuật toán — 1 nguồn thật duy nhất;
 * đã kiểm chứng `require()` chạy được). Core mặc định two-stage ở n = −12.
 *
 * Cách nối vào render (xem render.js): TRƯỚC khi dựng filter_complex,
 * với mỗi cặp (file nguồn, pitch) có clip dùng, decode audio bằng ffmpeg
 * → shift từng kênh bằng psolaPitchShift → ghi wav tạm → đăng ký làm input
 * riêng; chain audio của clip dùng `[psolaIdx:a]` thay cho `[idx:a]`, và
 * buildVoiceFilters bỏ rubberband (pitchDone). Robot/telephone/echo vẫn ở
 * trong filter chain FFmpeg như cũ.
 *
 * Thay đổi thứ tự effect so với rubberband (ghi nhận trung thực): pitch
 * tiền xử lý chạy TRƯỚC bass/treble/reverb trong chain (rubberband cũ chạy
 * sau reverb, trước volume). Với fixture chỉ có pitch thì thứ tự không ảnh
 * hưởng số đo parity (pitch độc lập với EQ tuyến tính trên fixture đơn âm);
 * với spec có cả EQ + pitch thì cao độ cuối vẫn là cao độ đã dịch (pitch
 * không phụ thuộc EQ), chỉ khác màu tiếng vi mô do reverb/EQ tác động lên
 * tín hiệu đã dịch thay vì chưa dịch — chấp nhận được cho đợt này, ghi rõ
 * để P1 sau đánh giá nếu cần giữ đúng thứ tự cũ (đòi hỏi tách audio chain).
 * Fail-soft: KHÔNG có — decode/shift thất bại thì render dừng với lỗi rõ
 * (pitch là effect user khai rõ; lặng lẽ rơi về rubberband sẽ phá thống nhất).
 */
"use strict";

const { spawnSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const { psolaPitchShift, semitoneRatio } = require("../../../apps/web/src/lib/psola.ts");

const SR = 48000;
const CHANNELS = 2;

/** Khóa (file nguồn, pitch) — dùng chung với render.js. */
function psolaPitchKey(srcAbs, pitch) {
  return `${srcAbs}::${Number(pitch)}`;
}

/** Đọc WAV PCM16 (mono/stereo, mọi sample rate) → { pcm: Int16Array (interleaved), channels, sampleRate }. */
function readWavPcm16(buf) {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("không phải file WAV RIFF");
  }
  let fmt = null;
  let dataOff = -1;
  let dataLen = 0;
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") {
      fmt = {
        audioFormat: buf.readUInt16LE(off + 8),
        channels: buf.readUInt16LE(off + 10),
        sampleRate: buf.readUInt32LE(off + 12),
        bitsPerSample: buf.readUInt16LE(off + 22),
      };
    } else if (id === "data") {
      dataOff = off + 8;
      dataLen = size;
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (!fmt || dataOff < 0) throw new Error("WAV thiếu chunk fmt/data");
  if (fmt.audioFormat !== 1 || fmt.bitsPerSample !== 16) {
    throw new Error(`WAV không phải PCM16 (format=${fmt.audioFormat}, bits=${fmt.bitsPerSample})`);
  }
  const n = Math.floor(dataLen / 2);
  const pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) pcm[i] = buf.readInt16LE(dataOff + i * 2);
  return { pcm, channels: fmt.channels, sampleRate: fmt.sampleRate };
}

/** Ghi WAV PCM16 (44-byte header chuẩn). */
function writeWavPcm16(pcm, channels, sampleRate, outPath) {
  const dataLen = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * channels * 2, 28); // byte rate
  buf.writeUInt16LE(channels * 2, 32); // block align
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataLen, 40);
  for (let i = 0; i < pcm.length; i++) buf.writeInt16LE(pcm[i], 44 + i * 2);
  writeFileEpermRetry(outPath, buf, { label: "psola-pitch-wav" });
  return outPath;
}

/** Shift 1 kênh mono (Float32) bằng core PSOLA, trả Int16Array đã kẹp. */
function shiftChannelMono(samplesF32, sr, pitchSemitones) {
  const y = psolaPitchShift(samplesF32, sr, semitoneRatio(pitchSemitones));
  const out = new Int16Array(y.length);
  for (let i = 0; i < y.length; i++) {
    const v = Math.max(-1, Math.min(1, y[i]));
    out[i] = v < 0 ? Math.round(v * 32768) : Math.round(v * 32767);
  }
  return out;
}

/** Shift PCM interleaved (Int16Array) theo từng kênh. Trả Int16Array cùng độ dài. */
function applyPsolaPitchToPcm(pcm, channels, sr, pitchSemitones) {
  if (!Number.isFinite(pitchSemitones) || Math.abs(pitchSemitones) < 1e-9) {
    return Int16Array.from(pcm);
  }
  const frames = Math.floor(pcm.length / channels);
  const out = new Int16Array(frames * channels);
  for (let c = 0; c < channels; c++) {
    const mono = new Float32Array(frames);
    for (let f = 0; f < frames; f++) mono[f] = pcm[f * channels + c] / 32768;
    const shifted = shiftChannelMono(mono, sr, pitchSemitones);
    for (let f = 0; f < frames; f++) out[f * channels + c] = shifted[f];
  }
  return out;
}

/**
 * Tiền xử lý 1 file nguồn ở 1 cao độ: ffmpeg decode → PSOLA → wav tạm.
 * Trả đường dẫn wav tạm (stereo 48k PCM16). Cache trong tiến trình theo
 * (srcAbs, pitch) — cùng file + cùng pitch chỉ decode/shift 1 lần.
 */
const _cache = new Map();
function preprocessPitchFile({ srcAbs, pitchSemitones, tmpDir, ffmpegBin = "ffmpeg" }) {
  const key = psolaPitchKey(srcAbs, pitchSemitones);
  if (_cache.has(key)) return _cache.get(key);
  const tag = `repo1-psola-pitch-${process.pid}-${crypto.createHash("sha1").update(key).digest("hex").slice(0, 12)}`;
  const decPath = path.join(tmpDir, `${tag}-dec.wav`);
  const outPath = path.join(tmpDir, `${tag}.wav`);
  const dec = spawnSync(
    ffmpegBin,
    ["-hide_banner", "-loglevel", "error", "-y", "-i", srcAbs, "-vn", "-ac", String(CHANNELS), "-ar", String(SR), "-f", "wav", decPath],
    { encoding: "utf8", timeout: 600000 },
  );
  if (dec.error || dec.status !== 0) {
    throw new Error(
      `psola-pitch: ffmpeg decode thất bại cho "${srcAbs}" (pitch ${pitchSemitones}): ` +
        `${(dec.stderr || dec.error?.message || "").toString().slice(0, 500)}`,
    );
  }
  const { pcm, channels, sampleRate } = readWavPcm16(fs.readFileSync(decPath));
  const shifted = applyPsolaPitchToPcm(pcm, channels, sampleRate, pitchSemitones);
  writeWavPcm16(shifted, channels, sampleRate, outPath);
  try {
    fs.unlinkSync(decPath);
  } catch {
    /* file decode tạm — bỏ qua nếu không xóa được */
  }
  _cache.set(key, outPath);
  return outPath;
}

/** true nếu file có audio stream (mirror hasAudioStream trong render.js). */
function hasAudioStream(abs, mediaProbes) {
  if (!mediaProbes) return true;
  const probe = mediaProbes.get(abs);
  if (!probe || !probe.streams) return false;
  return probe.streams.some((s) => s.codec_type === "audio");
}

/**
 * Quét spec, tiền xử lý pitch cho mọi clip sẽ qua chain audio.
 * Trả { byKey: Map<key, wavPath>, wavPaths: string[] }.
 * Chỉ quét đúng các clip mà buildFilterGraph sẽ dựng chain cho (audio track
 * không muted + video inherit không muted, có audio stream, mode ≠ detach).
 * Không có clip pitch nào → trả map rỗng (render chạy như cũ, 0 chi phí).
 * Decode/shift thất bại → throw (render dừng với lỗi rõ — xem đầu file).
 */
function collectPitchPreprocess(spec, { absOf, mediaProbes, tmpDir, ffmpegBin = "ffmpeg" }) {
  const byKey = new Map();
  const wavPaths = [];
  const want = new Map(); // key -> { srcAbs, pitch }
  const consider = (clip, abs) => {
    if (!clip || !clip.src) return;
    const pitch = clip.audioEffects?.voice?.pitch;
    if (typeof pitch !== "number" || !Number.isFinite(pitch) || Math.abs(pitch) < 1e-9) return;
    const key = psolaPitchKey(abs, pitch);
    if (!want.has(key)) want.set(key, { srcAbs: abs, pitch });
  };
  for (const track of (spec.tracks || []).filter((t) => t.kind === "audio" && !t.muted)) {
    for (const clip of track.clips || []) consider(clip, absOf(clip.src));
  }
  for (const track of (spec.tracks || []).filter((t) => t.kind === "video" && !t.muted)) {
    for (const clip of track.clips || []) {
      const mode = clip.sourceAudioMode ?? "inherit";
      if (mode !== "inherit") continue;
      const abs = absOf(clip.src);
      if (!hasAudioStream(abs, mediaProbes)) continue;
      consider(clip, abs);
    }
  }
  for (const [key, { srcAbs, pitch }] of want) {
    const wavPath = preprocessPitchFile({ srcAbs, pitchSemitones: pitch, tmpDir, ffmpegBin });
    byKey.set(key, wavPath);
    wavPaths.push(wavPath);
  }
  return { byKey, wavPaths };
}

module.exports = {
  psolaPitchKey,
  readWavPcm16,
  writeWavPcm16,
  applyPsolaPitchToPcm,
  preprocessPitchFile,
  collectPitchPreprocess,
};

// ---------------------------------------------------------------------------
// Self-test: node src/psolaPitch.js --self-test
// ---------------------------------------------------------------------------
if (require.main === module && process.argv.includes("--self-test")) {
  const assert = require("node:assert");
  const doGoertzel = (x, freq, sr) => {
    const n = x.length;
    const k = Math.round((freq * n) / sr);
    const w = (2 * Math.PI * k) / n;
    const coeff = 2 * Math.cos(w);
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < n; i++) {
      const s0 = x[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2)) / (n / 2);
  };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "psola-pitch-test-"));
  // Fixture: sine 440 Hz 2 s (ffmpeg) → shift −12 → đỉnh phải ở 220 Hz.
  const fixWav = path.join(tmp, "fix440.wav");
  const gen = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-ac", "1", "-ar", "48000", fixWav], { encoding: "utf8" });
  assert.equal(gen.status, 0, `ffmpeg tạo fixture thất bại: ${gen.stderr}`);
  const outWav = preprocessPitchFile({ srcAbs: fixWav, pitchSemitones: -12, tmpDir: tmp });
  assert.ok(fs.existsSync(outWav), "wav đầu ra phải tồn tại");
  const { pcm, channels, sampleRate } = readWavPcm16(fs.readFileSync(outWav));
  assert.equal(channels, 2, "decode ra stereo 48k");
  assert.equal(sampleRate, 48000);
  const mono = new Float32Array(Math.floor(pcm.length / 2));
  for (let f = 0; f < mono.length; f++) mono[f] = pcm[f * 2] / 32768;
  const seg = mono.subarray(SR, Math.floor(1.8 * SR));
  const m220 = doGoertzel(seg, 220, SR);
  const m440 = doGoertzel(seg, 440, SR);
  assert.ok(m220 > 3 * m440, `sine 440/-12 render: mag 220 Hz (${m220.toFixed(3)}) phải > 3× mag 440 Hz (${m440.toFixed(3)})`);
  // Đợt 203 P1 — hồi quy notch H3 ở render-server: psolaPitch.js require TRỰC
  // TIẾP psola.ts (1 nguồn duy nhất) nên notch core (h3Notch mặc định true,
  // đợt 202) phải có hiệu lực ở đường render — đo thật thay vì tin đọc code.
  // Fixture harmonic 330 Hz (8 hài 1/k) → applyPsolaPitchToPcm stereo ở −12:
  // H3−H1 ra phải về gần mức vào (|dH3| ≤ 2 dB) và giảm > 5 dB so với đối
  // chứng không notch (psolaPitchShift h3Notch:false — chữ ký H3 của two-stage).
  const harm330 = new Float32Array(SR * 4);
  for (let i = 0; i < harm330.length; i++) {
    const t = i / SR;
    const ph = 2 * Math.PI * 330 * t;
    let s = 0;
    for (let k = 1; k <= 8; k++) s += Math.sin(k * ph) / k;
    const env = Math.min(1, t / 0.05, (4 - t) / 0.05);
    harm330[i] = 0.3 * s * env;
  }
  const harmPcm = new Int16Array(harm330.length * 2);
  for (let f = 0; f < harm330.length; f++) {
    const v = Math.max(-1, Math.min(1, harm330[f]));
    const q = v < 0 ? Math.round(v * 32768) : Math.round(v * 32767);
    harmPcm[f * 2] = q;
    harmPcm[f * 2 + 1] = q;
  }
  const harmShifted = applyPsolaPitchToPcm(harmPcm, 2, SR, -12);
  const harmOut = new Float32Array(harm330.length);
  for (let f = 0; f < harm330.length; f++) harmOut[f] = harmShifted[f * 2] / 32768;
  const goertzelAt = (x, start, freq) => {
    const n = Math.floor(0.1 * SR);
    const w = (2 * Math.PI * freq) / SR;
    const cw = Math.cos(w);
    const coeff = 2 * cw;
    let s1 = 0;
    let s2 = 0;
    for (let i = start; i < start + n; i++) {
      const s = x[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s;
    }
    const re = s1 - s2 * cw;
    const im = s2 * Math.sin(w);
    return (2 * Math.sqrt(re * re + im * im)) / n;
  };
  const h3mH1Med = (x, f0out) => {
    const vals = [];
    for (let t = 1.0; t <= 3.0; t += 0.25) {
      const s = Math.floor(t * SR);
      vals.push(20 * Math.log10((goertzelAt(x, s, 3 * f0out) + 1e-9) / (goertzelAt(x, s, f0out) + 1e-9)));
    }
    vals.sort((a, b) => a - b);
    return vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
  };
  const dIn = h3mH1Med(harm330, 330);
  const dSrv = h3mH1Med(harmOut, 165);
  const yNoNotch = psolaPitchShift(harm330, SR, semitoneRatio(-12), { h3Notch: false });
  const dOff = h3mH1Med(yNoNotch, 165);
  assert.ok(
    dSrv < dOff - 5,
    `render-server notch không triệt H3 (không notch ${dOff.toFixed(1)} → render ${dSrv.toFixed(1)} dB, cần giảm > 5 dB)`,
  );
  assert.ok(
    Math.abs(dSrv - dIn) <= 2,
    `render-server notch không đưa H3−H1 về mức vào (vào ${dIn.toFixed(1)} → ra ${dSrv.toFixed(1)} dB, bar ±2)`,
  );
  console.log(`psolaPitch.js — render-server notch OK (H3−H1 vào ${dIn.toFixed(1)} → không notch ${dOff.toFixed(1)} → render ${dSrv.toFixed(1)} dB)`);
  const rt = path.join(tmp, "rt.wav");
  writeWavPcm16(pcm, channels, sampleRate, rt);
  const back = readWavPcm16(fs.readFileSync(rt));
  assert.deepEqual(Array.from(back.pcm), Array.from(pcm));
  // Cache: gọi lại cùng (src, pitch) trả cùng đường dẫn, không decode lại.
  assert.equal(preprocessPitchFile({ srcAbs: fixWav, pitchSemitones: -12, tmpDir: tmp }), outWav);
  assert.equal(psolaPitchKey("/a/b.wav", -12), "/a/b.wav::-12");
  console.log("psolaPitch.js — self-test pass");
}
