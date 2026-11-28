// parityHarness203-headed.ts — Harness parity đợt 203 P4: mảng headed voice/seek.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: sectionHeadedVoice (N1/N2/N2c/N9b/N12 headed), sectionHeadedSeek.
import * as fs from "node:fs";
import * as path from "node:path";
import { voiceFilter } from "./parityHarness203-voice";
import {
  HIDDEN195,
  REPO,
  SEEK_MTIME_195,
  TMP,
  VOICE_MTIME_195,
  applyAudioFilter,
  decodeAudioToPcm,
  goertzelMag,
  record,
  type HeadedVoiceJson,
  writeSineWav,
} from "./parityHarness203-core";

// ---------------------------------------------------------------------------
// N1 + N2-headed — đọc JSON từ headed-voice-check195.mjs (Chrome thật,
// OfflineAudioContext qua createVoiceChain thật). Render đo trong section
// này bằng ffmpeg (cùng tín hiệu 5-tone) để so trực tiếp.
// ---------------------------------------------------------------------------
export function sectionHeadedVoice(outDir: string): void {
  console.log("== N1/N2-headed voice (P1) — JSON từ headed-voice-check195.mjs (Chrome OfflineAudioContext) ==");
  const file203 = path.join(outDir, "headed-voice203.json");
  const file195 = path.join(HIDDEN195, "headed-voice195.json");
  let j: HeadedVoiceJson | null = null;
  let voiceProv = "";
  const loadVoice = (f: string): HeadedVoiceJson | null => {
    try {
      const v = JSON.parse(fs.readFileSync(f, "utf8")) as HeadedVoiceJson;
      return v && !v.error && v.telephone && v.pitch ? v : null;
    } catch { return null; }
  };
  j = loadVoice(file203);
  if (j) voiceProv = "201";
  if (!j) {
    // Fallback hồi quy: chỉ dùng dữ liệu headed 195 khi code voice chưa
    // đổi (previewVoiceFx.ts mtime vẫn mốc 195). Code đã đổi mà chưa có
    // probe 196 → GHI NHẬN, KHÔNG verdict từ số cũ (PSOLA mới của P1-196/197
    // làm dữ liệu WSOLA cũ hết hiệu lực).
    let vfUnchanged = false;
    try { vfUnchanged = fs.statSync(path.join(REPO, "apps/web/src/lib/previewVoiceFx.ts")).mtimeMs <= VOICE_MTIME_195 + 1000; } catch { vfUnchanged = false; }
    if (vfUnchanged) { j = loadVoice(file195); if (j) voiceProv = "195-regression"; }
  }
  const voiceProvNote = voiceProv === "201"
    ? "Nguồn headed: probe P1-201 (mới)."
    : "Nguồn headed: dữ liệu 195 — HỒI QUY (code voice chưa đổi kể từ mốc P4-195, chờ probe P1-201).";
  if (!j) {
    for (const [id, name] of [
      ["N1-telephone-gain-headed", "telephone gain preview vs render (headed Chrome) — JSON headed-voice203.json"],
      ["N2-headed-pitch", "pitch artifact headed (Chrome OfflineAudioContext qua chain thật)"],
      ["N2c-pitch-220m12-headed", "pitch headed: triệt răng sine trầm — 220Hz -12/-7 + 880Hz ±12"],
      ["N9b-pitch-curve-headed", "pitch trade-off curve headed (Chrome) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm"],
    ] as const) {
      record({
        id, name, verdict: "GHI NHẬN", numbers: {},
        notes: `Chưa có headed-voice203.json và code voice ĐÃ ĐỔI so với mốc P4-195 (previewVoiceFx.ts mtime > 2026-11-25T20:56:13Z) — dữ liệu headed 195 là WSOLA cũ, không còn hiệu lực cho PSOLA mới. Chạy lại harness sau khi P1-203 publish probe headed-voice203.json. KHÔNG verdict từ số cũ.`,
      });
    }
    return;
  }
  const tel: NonNullable<HeadedVoiceJson["telephone"]> = j.telephone!;
  const pitchArr: NonNullable<HeadedVoiceJson["pitch"]> = j.pitch!;
  // Render telephone trên cùng tín hiệu 5-tone (100/440/1000/5000/8000).
  const freqs = tel.freqs;
  const multi = path.join(TMP, "n1-multi.wav");
  // Amp 0.2/tone như S4 (đợt 191 dùng 0.5/tone gây clip pcm_s16le).
  writeSineWav(multi, freqs, freqs.map(() => 0.2), 1.0);
  const f = voiceFilter(JSON.stringify({ telephone: true }));
  const out = path.join(TMP, "n1-tel.wav");
  applyAudioFilter(multi, f, out);
  const { samples: segR } = decodeAudioToPcm(out);
  const dryPcm = decodeAudioToPcm(multi).samples;
  const sr = 48000;
  const segRs = segR.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
  const segDry = dryPcm.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
  const renderDb = freqs.map((fr) => 20 * Math.log10(goertzelMag(segRs, sr, fr) / goertzelMag(segDry, sr, fr)));
  const deltas = freqs.map((_, i) => tel!.previewDb[i] - renderDb[i]);
  const maxAbs = Math.max(...deltas.map((d) => Math.abs(d)));
  record({
    id: "N1-telephone-gain-headed",
    name: "telephone gain preview (Chrome, chain thật) vs render (ffmpeg) theo tần số",
    verdict: maxAbs <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      max_abs_delta_dB: maxAbs,
      delta_100Hz_dB: deltas[0], delta_440Hz_dB: deltas[1], delta_1000Hz_dB: deltas[2],
      delta_5000Hz_dB: deltas[3], delta_8000Hz_dB: deltas[4],
      preview_440Hz_dB: tel.previewDb[1], render_440Hz_dB: renderDb[1],
      preview_5000Hz_dB: tel.previewDb[3], render_5000Hz_dB: renderDb[3],
      headed_source: voiceProv,
    },
    notes: `Đo headed: OfflineAudioContext 48kHz qua createVoiceChain thật (telephone-only, SAU bù g=0,76 của P1-193 — parent duyệt §14.2-192) vs render ffmpeg ${f}. Kỳ vọng từ P1-192 §2.3 (minimax g=0,76, sai tối đa 18,5% ≈ 1,47 dB trên đường cong 9 điểm): Δ 5 điểm = Δ cũ − 2,39 dB → 100Hz ≈ −1,80; 440Hz ≈ +0,21; 1000Hz ≈ −1,48; 5000Hz ≈ +0,05; 8000Hz ≈ −1,56 (Δ cũ đợt 192: +0,59/+2,60/+0,91/+2,44/+0,83). Max |Δ| kỳ vọng ≈ 1,8 dB @100Hz. Tiêu chí ĐẠT: max |Δ| ≤ 2 dB (bar VẪN ĐỨNG theo quyết (o)-192). ${voiceProvNote}`,
  });
  // Headed pitch: verdict riêng 440 Hz (bar chặt) và 220 Hz (bar không hồi quy).
  const pitch440 = pitchArr.filter((p) => p.f0 === 440);
  const pitch220 = pitchArr.find((p) => p.f0 === 220 && p.nSemi === 12);
  const m12_220 = pitchArr.find((p) => p.f0 === 220 && p.nSemi === -12);
  const m7_220 = pitchArr.find((p) => p.f0 === 220 && p.nSemi === -7);
  const p12_880 = pitchArr.find((p) => p.f0 === 880 && p.nSemi === 12);
  const m12_880 = pitchArr.find((p) => p.f0 === 880 && p.nSemi === -12);
  const worstErr440 = Math.max(...pitch440.map((p) => Math.abs(p.errSt)));
  const worstAm440 = Math.max(...pitch440.map((p) => p.amDepth));
  const worstSb440 = Math.max(...pitch440.map((p) => p.sidebandRatio));
  const p12 = pitchArr.find((p) => p.f0 === 440 && p.nSemi === 12);
  const m12 = pitchArr.find((p) => p.f0 === 440 && p.nSemi === -12);
  const ok220 = pitch220 !== undefined && Math.abs(pitch220.errSt) <= 1.0 && pitch220.amDepth <= 0.7;
  record({
    id: "N2-headed-pitch",
    name: "pitch artifact headed (Chrome OfflineAudioContext qua chain thật) — 440Hz +12/-12/+7/-7 + 220Hz +12",
    verdict: worstErr440 <= 0.5 && worstAm440 <= 0.35 && worstSb440 <= 0.25 && ok220 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      worst_err_440_st: worstErr440, worst_AM_440: worstAm440, worst_sideband_440: worstSb440,
      domFreq_p12_440: p12?.domFreq ?? -1, err_p12_st: p12?.errSt ?? -99,
      domFreq_m12_440: m12?.domFreq ?? -1, err_m12_st: m12?.errSt ?? -99,
      domFreq_p12_220: pitch220?.domFreq ?? -1, err_p12_220_st: pitch220?.errSt ?? -99,
      AM_p12_220: pitch220?.amDepth ?? -1, ok_220_no_regression: ok220 ? 1 : 0, headed_source: voiceProv,
    },
    notes: `Đo headed qua chain thật (không sim), phương pháp P1-193 §2.2: render 4 s, cửa sổ [1,0, 3,5)s, đỉnh phổ Goertzel 0,25 Hz + nội suy parabol log-mag (≈ FFT zero-pad 2^18 của P1), AM = RMS khối 5 ms trên cùng cửa sổ (F-193-P4-2: bản probe cũ dùng cửa sổ [0,2, 1,0)s + bước 1 Hz + fLfo cứng /0,04 nên đo sai sau khi W → 0,08). Baseline P1-193 (§2.2, W=0,08): 440 Hz tần trội y hệt W=0,04 (215/290,3/327,1/414,7/466,8/590,7/664,2/890) nhưng AM 0,10–0,30 → 0,37–0,72 (triệt răng xen kẽ — trade-off đã ghi của P1, bar AM ≤ 0,35 VẪN ĐỨNG nên AM vượt bar là CHƯA ĐẠT); 220 Hz +12: 420 → 445 Hz (−0,81 → +0,20 st), AM 0,30 → 0,17. Tiêu chí 440 Hz: |err| ≤ 0.5 st + AM ≤ 0.35 + sideband ≤ 0.25; 220 Hz +12: bar không hồi quy (|err| ≤ 1.0 st, AM ≤ 0.7). Đối chiếu N2-sim: sim phải khớp headed trong ~0.1 st ở 440 Hz (sim +12 889 vs Chrome 890; −12 215 vs 215). ${voiceProvNote}`,
  });
  // N2c — claim headline của P1-193: triệt răng ở sine trầm 220 Hz ĐÃ SỬA
  // (−12@220: 120 Hz/+1,51 st → 107,5 Hz/−0,40 st) + 880 Hz tốt lên.
  const okM12_220 = m12_220 !== undefined && Math.abs(m12_220.errSt) <= 0.5 && m12_220.amDepth <= 0.7;
  record({
    id: "N2c-pitch-220m12-headed",
    name: "pitch headed: triệt răng sine trầm — 220Hz -12/-7 + 880Hz ±12 (claim P1-193 §2.3)",
    verdict: okM12_220 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      domFreq_m12_220: m12_220?.domFreq ?? -1, err_m12_220_st: m12_220?.errSt ?? -99, AM_m12_220: m12_220?.amDepth ?? -1,
      domFreq_m7_220: m7_220?.domFreq ?? -1, err_m7_220_st: m7_220?.errSt ?? -99, AM_m7_220: m7_220?.amDepth ?? -1,
      domFreq_p12_880: p12_880?.domFreq ?? -1, err_p12_880_st: p12_880?.errSt ?? -99, AM_p12_880: p12_880?.amDepth ?? -1,
      domFreq_m12_880: m12_880?.domFreq ?? -1, err_m12_880_st: m12_880?.errSt ?? -99, AM_m12_880: m12_880?.amDepth ?? -1, headed_source: voiceProv,
    },
    notes: `Claim P1-193 (§2.3, phương pháp [1,0, 3,5)s): 220/−12 → 107,5 Hz (−0,40 st, răng lược gần mục tiêu nhất với W=0,08), AM 0,51 → 0,16; 220/−7 → 145,2 Hz (−0,20 st); 880/−12 → 442,5 Hz (+0,10 st), 880/+12 → 1755 Hz (−0,05 st). Tiêu chí verdict: 220/−12 |err| ≤ 0,5 st + AM ≤ 0,7 (bar không hồi quy như +12@220); các điểm còn lại chỉ đối chiếu số, không verdict riêng. ${voiceProvNote}`,
  });
  // N9b — ĐƯỜNG CONG trade-off pitch headed (P1-195 map f0 220–660 Hz):
  // 22 điểm headed từ probe-voice195.ts (9 điểm cũ + 220/+7 + 12 điểm mới
  // 330/550/660 × ±12/±7); 20 điểm thuộc đường cong (trừ 2 điểm 880 legacy).
  // AM theo từng f0 đối chiếu với map P1-195 + sim N9a (sim phải khớp
  // headed trong ~0,1 st như tiền lệ 194). AM@440 vượt bar 0,35 là
  // trade-off đã quyết — không lặp verdict AM ở đây (xem N2-headed).
  {
    const curve = pitchArr.filter((p) => [220, 330, 440, 550, 660].includes(p.f0));
    const want = 20;
    if (curve.length < want) {
      record({
        id: "N9b-pitch-curve-headed",
        name: "pitch trade-off curve headed (Chrome) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm",
        verdict: "CHƯA ĐẠT",
        numbers: { headed_points: curve.length, want_points: want },
        notes: `Thiếu ${want - curve.length} điểm headed trong headed-voice203.json (có ${curve.length}/${want}) — probe-voice200.ts phải đo đủ lưới 330/550/660 mới trước khi chạy harness. Chạy lại headed-voice-check200.mjs rồi chạy lại harness.`,
      });
    } else {
      const worstErr = Math.max(...curve.map((p) => Math.abs(p.errSt)));
      const worstAm = Math.max(...curve.map((p) => p.amDepth));
      const nums: Record<string, number | string> = { worst_err_st: worstErr, worst_AM_depth: worstAm, headed_points: curve.length, headed_source: voiceProv };
      for (const f0 of [220, 330, 440, 550, 660]) {
        const sub = curve.filter((p) => p.f0 === f0);
        nums[`worst_err_${f0}_st`] = Math.max(...sub.map((p) => Math.abs(p.errSt)));
        nums[`worst_AM_${f0}`] = Math.max(...sub.map((p) => p.amDepth));
        for (const p of sub) {
          const s = p.nSemi > 0 ? `p${p.nSemi}` : `m${-p.nSemi}`;
          nums[`err_${f0}_${s}_st`] = p.errSt;
          nums[`AM_${f0}_${s}`] = p.amDepth;
          nums[`domFreq_${f0}_${s}_Hz`] = p.domFreq;
        }
      }
      record({
        id: "N9b-pitch-curve-headed",
        name: "pitch trade-off curve headed (Chrome) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm",
        verdict: worstErr <= 0.5 ? "ĐẠT" : "CHƯA ĐẠT",
        numbers: nums,
        notes: `Headed qua chain thật (OfflineAudioContext 48kHz, phương pháp P1-193 §2.2: render 4 s, cửa sổ [1,0, 3,5)s, Goertzel 0,25 Hz + nội suy parabol). Tiêu chí: |err| ≤ 0,5 st ở cả 20 điểm (12 điểm mới 330/550/660 + 8 điểm cũ). AM theo từng f0 đối chiếu với map P1-195 + sim N9a — kỳ vọng sim khớp headed trong ~0,1 st (tiền lệ 194: sim +12@440 889 vs Chrome 890 Hz). AM@440 vượt bar 0,35 là trade-off đã quyết (xem N2-headed). ${voiceProvNote}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// S6b-headed — đọc JSON từ headed-seek-check195.mjs (Chrome thật, <video>
// seek tới target đã sửa của P3-192).
// ---------------------------------------------------------------------------
interface HeadedSeekJson {
  generatedAt?: string;
  fixture?: string;
  seekOffsetDesc?: string;
  rows?: Array<{ t: number; currentTime: number; kind?: string; k?: number; shownFrame: number; expectedRenderFrame: number; offset: number; madToNearest: number; secondMad: number }>;
  error?: string;
}
export function sectionHeadedSeek(outDir: string): void {
  console.log("== S6b-headed reverse video (P3) — JSON từ headed-seek-check195.mjs ==");
  const seekFile203 = path.join(outDir, "headed-seek203.json");
  const seekFile195 = path.join(HIDDEN195, "headed-seek195.json");
  let j: HeadedSeekJson | null = null;
  let seekProv = "";
  const loadSeek = (f: string): HeadedSeekJson | null => {
    try {
      const v = JSON.parse(fs.readFileSync(f, "utf8")) as HeadedSeekJson;
      return v && !v.error && v.rows && v.rows.length > 0 ? v : null;
    } catch { return null; }
  };
  j = loadSeek(seekFile203);
  if (j) seekProv = "201";
  if (!j) {
    let rpUnchanged = false;
    try { rpUnchanged = fs.statSync(path.join(REPO, "apps/web/src/lib/reversePlayback.ts")).mtimeMs <= SEEK_MTIME_195 + 1000; } catch { rpUnchanged = false; }
    if (rpUnchanged) { j = loadSeek(seekFile195); if (j) seekProv = "195-regression"; }
  }
  if (!j) {
    record({
      id: "S6b-headed-seek",
      name: "reverse video headed: seek tới target đã sửa của P3-192, frame hiện ra có khớp render không",
      verdict: "GHI NHẬN",
      numbers: {},
      notes: `Chưa có headed-seek203.json và reversePlayback.ts ĐÃ ĐỔI so với mốc P4-195 — dữ liệu seek 195 không còn hiệu lực. Chạy lại harness sau khi có probe seek 202. KHÔNG verdict từ số cũ.`,
    });
    return;
  }
  const seekProvNote = seekProv === "201"
    ? "Nguồn headed: probe seek 203 (mới)."
    : "Nguồn headed: dữ liệu 195 — HỒI QUY (reversePlayback.ts chưa đổi kể từ mốc P4-195).";
  // Hàng boundary-raw là đối chứng (seek KHÔNG trừ offset — tái hiện bug
  // 191, kỳ vọng offset +1) nên KHÔNG tính vào verdict; verdict chỉ theo
  // hàng boundary-fixed + midframe-control. Bản check đầu tính cả raw
  // nên không bao giờ ĐẠT được — xem F-192-P4-5.
  const fixedRows = j.rows!.filter((r) => r.kind !== "boundary-raw");
  const rawRows = j.rows!.filter((r) => r.kind === "boundary-raw");
  const worstOff = Math.max(...fixedRows.map((r) => Math.abs(r.offset)));
  const worstMad = Math.max(...fixedRows.map((r) => r.madToNearest));
  const rawOff = rawRows.map((r) => r.offset);
  record({
    id: "S6b-headed-seek",
    name: "reverse video headed (Chrome thật): seek tới target đã sửa của P3-192",
    verdict: worstOff === 0 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      worst_frame_offset: worstOff, worst_mad_to_nearest: worstMad, n_targets: fixedRows.length,
      raw_control_offsets: rawOff.join(","),
      seek_offset: j.seekOffsetDesc ?? "", headed_source: seekProv,
    },
    notes: `Fixture: ${j.fixture ?? ""}. Offset 0 ở mọi target (boundary-fixed + midframe-control) = frame hiện ra khớp frame render. Hàng boundary-raw (seek không trừ offset) kỳ vọng offset +1 — đối chứng tái hiện bug đợt 191, không tính vào verdict. Đối chiếu S6b analytic (sourceTimeAt + floor): nếu analytic vẫn +1 nhưng headed = 0 thì P3 đã sửa ở tầng seek (preview.tsx/rampSourceTimeAt), không phải sourceTimeAt. ${seekProvNote}`,
  });
}

