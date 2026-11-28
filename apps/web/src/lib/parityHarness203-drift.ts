// parityHarness203-drift.ts — Harness parity đợt 203 P4: trần drift N11a/N11b.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: sectionDriftCeiling203 (N11a/N11b trên JSON waveform thô của P3).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
  reversedSegmentWindow,
} from "./reverseAudio";
import {
  REPO,
  isLaggingPeak,
  isStalePeak,
  linearFit,
  n11aVerdict203,
  record,
  wrapDrift,
} from "./parityHarness203-core";

// ---------------------------------------------------------------------------
// N11 — Trần drift 0,5 s headed + decode cửa sổ 300–600 s (P3-196, cap 0,3 s theo quyết (a4)-195).
// P4 TÍNH LẠI ĐỘC LẬP từ JSON waveform thô của P3 (không copy số P3):
// một record N11a-<tag> + một record N11b-<tag> cho mỗi fixture P3 đã
// publish — đợt 203 tìm dữ liệu P3-203 TRƯỚC, rồi P3-202 (nhiệm vụ đợt
// này, quyết (r)-202), rồi 201, rồi 200, rồi 199 (benchmarks/reverse203/ +
// ~/workspace/tmp-round203-p3/ + hidden_files/round203-p3/ và các thư mục
// đuôi -202/-201/-200/-199); dữ liệu 202 là dữ liệu NHIỆM VỤ, không phải
// fallback tạm (quyết (r)-202).
// (F-199-P4-2: P3-199 ghi ra thư mục thứ ba)
// — P3 ghi dữ liệu headed ra tmp, không stage). In-pass theo định nghĩa
// P3: afterStart = mẫu đầu tiên có RMS>0, chỉ tính mẫu RMS>0 (định nghĩa
// "chuỗi playhead giảm dài nhất" của harness cũ BỊ BÁC — nó lẫn mẫu
// khởi động RMS=0/peakHz cũ, thổi drift max lên 1,311 s sai).
// Chirp: LẤY TỪ CHUỖI THIẾT KẾ trong JSON (f(t)=a+b*(t mod T) hoặc
// f(t)=a+b*t), kiểm chứng bằng trung vị |drift| ≤ 0,3 s; fallback hồi
// quy tuyến tính khi chuỗi sai (clip 70 s đợt 193). KHÔNG hồi quy chirp
// tuần hoàn từ dữ liệu (wrap + cụm hold phá OLS — slope 219 thay vì
// 270, R² 0,65; F-195-P4-5). Drift = t_audio − playhead, wrap về
// [−T/2,+T/2] khi tuần hoàn. Lọc mẫu stale-peak theo quy tắc P3 §1.4
// (peakHz giống hệt mẫu trước trong khi playhead chạy ≥0,2 s); báo cả
// drift max THÔ và ĐÃ LỌC để thấy hiệu chỉnh. Counters: giá trị countersEnd của probe (khớp số P3 in) + delta
// in-pass (cuối−đầu); holdMaxSec lấy MAX (running max, không phải
// delta); khi countersEnd null (longB — trang mất trạng thái) thì lấy
// counters ở mẫu in-pass cuối cùng còn đọc được. N11a verdict theo
// drift max (đã lọc) ≤ 0,5 s; ghi rõ cap có chạm (holdCapStop) hay
// không. N11b: decode âm thanh-only bằng ffmpeg trên cùng fixture
// (proxy cho decodeAudioData của trình duyệt — decode toàn file video
// KHÔNG phải proxy đúng) + đối chiếu lastWindowDecodeMs/loadMs của P3;
// bar 5 s là bar THAM CHIẾU từ nợ P3-194 §5.2, chưa do parent đặt.
// ---------------------------------------------------------------------------
interface WaveformJson203 {
  video?: string;
  bundle?: string[];
  chirp?: string;
  samples?: Array<{
    t?: number; timeText?: string; rms?: number; peakHz?: number;
    waveMin?: number; waveMax?: number; wave?: number[];
    counters?: Record<string, number>; load1?: string;
    windows?: Array<{ windowStartSec?: number; windowEndSec?: number; rebuilding?: boolean; lastDecodeMs?: number }>;
  }>;
}
interface ProbeJson203 {
  revClickT?: number;
  revSamples?: Array<{ t?: number; revAudio?: { loaded?: number; counters?: Record<string, number> } }>;
  fwdSamples?: Array<{ audio?: { rms?: number } }>;
  countersEnd?: Record<string, number> | null;
}
export function sectionDriftCeiling203(): void {
  console.log("== N11 trần drift 0,5s headed + decode cửa sổ 300–600s (P3-195) — tính lại từ JSON waveform thô của P3 ==");
  const benchDir = path.join(REPO, "benchmarks/reverse203");
  const tmpDir = path.join(REPO, "..", "tmp-round203-p3");
  // F-199-P4-2: P3-199 ghi dữ liệu headed ra hidden_files/round199-p3/
  // (không phải tmp-round199-p3/ như đợt 198) — tìm cả ba thư mục.
  const p3Dir = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round203-p3");
  // Dữ liệu NHIỆM VỤ đợt này là P3-203 (quyết (r)-202): tìm 203 TRƯỚC,
  // rồi 202, rồi 201, rồi 200, rồi 199.
  const benchDir202 = path.join(REPO, "benchmarks/reverse202");
  const tmpDir202 = path.join(REPO, "..", "tmp-round202-p3");
  const p3Dir202 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round202-p3");
  const benchDir201 = path.join(REPO, "benchmarks/reverse201");
  const tmpDir201 = path.join(REPO, "..", "tmp-round201-p3");
  const p3Dir201 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round201-p3");
  const benchDir200 = path.join(REPO, "benchmarks/reverse200");
  const tmpDir200 = path.join(REPO, "..", "tmp-round200-p3");
  const p3Dir200 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round200-p3");
  const benchDir199 = path.join(REPO, "benchmarks/reverse199");
  const tmpDir199 = path.join(REPO, "..", "tmp-round199-p3");
  const p3Dir199 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round199-p3");
  const searchDirs = [benchDir, tmpDir, p3Dir, benchDir202, tmpDir202, p3Dir202, benchDir201, tmpDir201, p3Dir201, benchDir200, tmpDir200, p3Dir200, benchDir199, tmpDir199, p3Dir199];
  // Thu thập waveform JSON của P3 (203 trước, rồi 202, rồi 201, rồi 200, rồi 199; trùng tag
  // chỉ lấy bản đầu — tức bản mới nhất thắng).
  const found: Array<{ tag: string; wavePath: string; probePath: string | null; dataRound: number }> = [];
  const seenTags = new Set<string>();
  for (const dir of searchDirs) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir).filter((f) => /^audio-waveform-(203|202|201|200|199)-(.+)\.json$/.test(f)).sort();
    } catch {
      files = [];
    }
    for (const f of files) {
      const m = /^audio-waveform-(203|202|201|200|199)-(.+)\.json$/.exec(f);
      const tag = m?.[2] ?? f;
      const round = Number(m?.[1] ?? 203);
      if (seenTags.has(tag)) continue;
      seenTags.add(tag);
      // Probe JSON có thể ở thư mục KHÁC với waveform — thử mọi thư mục.
      // Đợt 202 (F-202-P4-2): ƯU TIÊN probe CÙNG ĐỢT với waveform (counters
      // cuối/loadMs/fwdRms phải cùng pass với mẫu waveform); chỉ fallback
      // sang đợt khác khi không có probe cùng đợt. Trước đây tìm đợt mới
      // nhất trước nên record waveform-200 bị gắn countersEnd của probe-201
      // (đợt 201) rồi probe-202 (đợt 202: tick/holdCapStop của C3-loop) —
      // số endC sai pass (longA-200: holdCapStop_end in 0 thay vì 7).
      const probeRounds = [round, 203, 202, 201, 200, 199].filter((v, i, a) => a.indexOf(v) === i);
      let probe = "";
      for (const rr of probeRounds) {
        for (const d of searchDirs) {
          const cand = path.join(d, `audio-probe-${rr}-${tag}.json`);
          if (fs.existsSync(cand)) { probe = cand; break; }
        }
        if (probe !== "") break;
      }
      found.push({ tag, wavePath: path.join(dir, f), probePath: probe !== "" ? probe : null, dataRound: round });
    }
  }
  // Đọc decode-probe: thử 203 rồi 202 rồi 201 rồi 200 rồi 199, tmp → p3Dir → benchmarks.
  const readDecodeProbe = (): { files?: Array<{ base?: string; decodes?: number[]; fetchMs?: number }> } | null => {
    for (const rr of [203, 202, 201, 200, 199]) {
      for (const d of [tmpDir, p3Dir, benchDir, tmpDir202, p3Dir202, benchDir202, tmpDir201, p3Dir201, benchDir201, tmpDir200, p3Dir200, benchDir200, tmpDir199, p3Dir199, benchDir199]) {
        try { return JSON.parse(fs.readFileSync(path.join(d, `decode-probe-${rr}.json`), "utf8")); } catch { /* thử thư mục sau */ }
      }
    }
    return null;
  };
  // N11b luôn chạy phần logic cửa sổ 300 s ở mức hàm thuần (không cần
  // dữ liệu P3); N11a cần JSON waveform của P3.
  {
    const win300 = reversedSegmentWindow({ playheadSec: 285, clipStartSec: 0, clipDurationSec: 300, sampleRate: 48000, windowSec: 30 });
    const win300Ok = win300 !== null && win300.startSample === 720000 && win300.lengthSamples === 1440000;
    const win600 = reversedSegmentWindow({ playheadSec: 585, clipStartSec: 0, clipDurationSec: 600, sampleRate: 48000, windowSec: 30 });
    const win600Ok = win600 !== null && win600.startSample === 720000 && win600.lengthSamples === 1440000;
    record({
      id: "N11b-window-logic-300-600s",
      name: "decode cửa sổ: logic cửa sổ 30 s ở clip 300 s / 600 s (hàm thuần reversedSegmentWindow)",
      verdict: win300Ok && win600Ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        window_300s_start_sample: win300?.startSample ?? -1, window_300s_len_samples: win300?.lengthSamples ?? -1,
        window_600s_start_sample: win600?.startSample ?? -1, window_600s_len_samples: win600?.lengthSamples ?? -1,
        max_windowed_s: MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
      },
      notes: `Clip 300 s @playhead 285 s → cửa sổ đảo bắt đầu ở nguồn 15 s (startSample 720000 = 15×48000), dài 30 s (1440000 mẫu); clip 600 s @585 s tương tự. Đây là kiểm logic cửa sổ — thời gian decode thật đo ở N11b-decode-time (cần fixture P3-195).`,
    });
  }
  if (found.length === 0) {
    record({
      id: "N11a-drift-ceiling-headed",
      name: "trần drift 0,5 s headed — tính lại từ JSON waveform thô của P3-203 (fallback 202/201/200/199)",
      verdict: "GHI NHẬN",
      numbers: {},
      notes: `Chưa có file audio-waveform-203-*.json (cũng không có bản 199) trong benchmarks/reverse203/ hay tmp-round203-p3/ hay hidden_files/round203-p3/ lúc harness chạy — P3-203 chưa publish dữ liệu headed (hoặc probe chưa chạy). KHÔNG verdict (tiền lệ N8-194: ghi nhận từ dữ liệu P3, không tự suy ra). Chạy lại harness sau khi P3-203 đóng cờ.`,
    });
    record({
      id: "N11b-decode-time-300-600s",
      name: "decode cửa sổ clip 300–600 s — đo lại thời gian decode trên fixture P3-203 (fallback 202/201/200/199)",
      verdict: "GHI NHẬN",
      numbers: {},
      notes: `Chưa có fixture mp4 dài (≥200 s) để đo decode. Logic cửa sổ đã kiểm ở N11b-window-logic-300-600s. Chạy lại harness sau khi P3-203 publish fixture + timing decode.`,
    });
    // Probe decode riêng P3-203 có thể đã chạy trước khi có waveform headed —
    // ghi số decodeAudioData toàn file (đối chiếu chéo; verdict vẫn chờ
    // timing headed lastWindowDecodeMs).
    try {
      const dp = readDecodeProbe() as { files?: Array<{ base?: string; decodes?: number[]; fetchMs?: number }> };
      if (!dp) throw new Error("no decode-probe");
      for (const f of dp.files ?? []) {
        const ds = f.decodes ?? [];
        record({
          id: `N11b-decode-probe-203-${(f.base ?? "file").replace(/\.mp4$/, "")}`,
          name: `decode riêng P3-203 — ${f.base ?? "?"} (decodeAudioData toàn file, AudioContext rảnh)`,
          verdict: "GHI NHẬN",
          numbers: {
            probe_decode_1st_ms: ds.length > 0 ? ds[0] : -1,
            probe_decode_2nd_ms: ds.length > 1 ? ds[1] : -1,
            probe_decode_3rd_ms: ds.length > 2 ? ds[2] : -1,
            fetch_ms: f.fetchMs ?? -1,
          },
          notes: `Số decode riêng của P3 (decode-probe, thử 200 rồi 199): ${ds.map((v) => `${v.toFixed(0)} ms`).join(" / ") || "không có"}. Đây là decode TOÀN FILE trong AudioContext rảnh — KHÔNG phải timing cửa sổ headed (lastWindowDecodeMs); chỉ đối chiếu chéo, chưa verdict N11b. Bar tham chiếu 5.000 ms (nợ P3-194 §5.2).`,
        });
      }
    } catch { /* chưa có decode-probe-203.json */ }
    return;
  }
  const parseT = (s: string): number => {
    const mm = /^(\d+):(\d+(?:\.\d+)?)/.exec(s.trim());
    return mm ? Number(mm[1]) * 60 + Number(mm[2]) : NaN;
  };
  const medianOf = (xs: number[]): number => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length === 0 ? NaN : s[Math.floor(s.length / 2)];
  };
  // --- N11a: một record cho mỗi fixture P3 đã publish ---
  for (const item of found) {
    let wj: WaveformJson203 | null = null;
    try {
      wj = JSON.parse(fs.readFileSync(item.wavePath, "utf8")) as WaveformJson203;
    } catch {
      wj = null;
    }
    if (!wj || !wj.samples || wj.samples.length === 0) {
      record({
        id: `N11a-drift-ceiling-headed-${item.tag}`,
        name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-203, fallback 202/201/200/199)`,
        verdict: "CHƯA ĐẠT",
        numbers: {},
        notes: `File ${path.basename(item.wavePath)} không parse được hoặc không có samples — không tính lại được drift. Xem lại file P3-195.`,
      });
      continue;
    }
    type Row203 = NonNullable<WaveformJson203["samples"]>[number] & { ph: number };
    const rows: Row203[] = (wj.samples ?? []).map((s) => ({ ...s, ph: parseT((s.timeText ?? "").split("/")[0]) }));
    // In-pass theo P3: afterStart = mẫu đầu tiên có RMS>0; chỉ mẫu RMS>0.
    // (Định nghĩa cũ "chuỗi playhead giảm dài nhất" BỊ BÁC: nó lẫn mẫu
    // khởi động RMS=0/peakHz cũ, thổi drift max lên 1,311 s sai.)
    const startIdx = rows.findIndex((r) => (r.rms ?? 0) > 0);
    const inPass = (startIdx < 0 ? [] : rows.slice(startIdx)).filter(
      (r) => (r.rms ?? 0) > 0 && !Number.isNaN(r.ph) && (r.peakHz ?? 0) > 0,
    );
    if (inPass.length < 10) {
      record({
        id: `N11a-drift-ceiling-headed-${item.tag}`,
        name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-203, fallback 202/201/200/199)`,
        verdict: "GHI NHẬN",
        numbers: { total_samples: rows.length, inpass_samples: inPass.length },
        notes: `Không đủ mẫu in-pass trong ${path.basename(item.wavePath)} (${inPass.length} mẫu / tổng ${rows.length}) — có thể pass không chạy hoặc format đổi. KHÔNG verdict; xem lại file P3-195.`,
      });
      continue;
    }
    // Lọc mẫu stale-peak TRƯỚC (quy tắc S1 của P3 §1.4): peakHz giống hệt mẫu
    // in-pass trước trong khi playhead chạy ≥0,2 s. Báo cả max THÔ (chưa
    // lọc) để thấy hiệu chỉnh (longB 196: 0,993 thô → 0,537 S1 → 0,481 S2).
    const kept: Row203[] = [];
    let nStale = 0;
    for (let i = 0; i < inPass.length; i++) {
      if (i > 0 && isStalePeak(inPass[i - 1].peakHz ?? 0, inPass[i].peakHz ?? 0, inPass[i - 1].ph, inPass[i].ph)) { nStale++; continue; }
      kept.push(inPass[i]);
    }
    const keptNonEmpty = kept.length > 0 ? kept : inPass;
    // Lọc S2 (P3-196 §1.4; P4-197 kiểm chứng độc lập từ JSON thô 196 — xem
    // LIMITS P4-197 §2.4): |ΔpeakHz| ≤ 24 Hz trong khi playhead chạy ≥ 0,15 s
    // → analyser lag. Verdict N11a đợt 199 theo max S2; max S1 + max thô
    // in kèm làm đối chiếu (S1 đã sửa float; S1-chưa-sửa 0,737 longB là số
    // lỗi, không dùng).
    const keptS2: Row203[] = [];
    const keptS2Idx: number[] = [];
    let nLag = 0;
    for (let i = 0; i < inPass.length; i++) {
      if (i > 0 && isLaggingPeak(inPass[i - 1].peakHz ?? 0, inPass[i].peakHz ?? 0, inPass[i - 1].ph, inPass[i].ph)) { nLag++; continue; }
      keptS2.push(inPass[i]);
      keptS2Idx.push(i);
    }
    const keptS2NonEmpty = keptS2.length > 0 ? keptS2 : inPass;
    const keptS2IdxNonEmpty = keptS2.length > 0 ? keptS2Idx : inPass.map((_, i) => i);
    // Chirp: LẤY TỪ CHUỖI THIẾT KẾ trong JSON (f(t)=a+b*(t mod T) hoặc
    // f(t)=a+b*t), rồi KIỂM CHỨNG bằng dữ liệu (trung vị |drift| ≤ 0,3 s).
    // KHÔNG hồi quy chirp tuần hoàn từ dữ liệu: wrap quanh biên chu kỳ +
    // cụm hold (playhead đứng yên, peakHz vẫn chạy) phá OLS — thử nghiệm
    // đợt này cho slope 219 thay vì 270 thật, R² 0,65 (F-195-P4-5).
    // Clip 70 s của đợt 193 có chirp tuyến tính thật (f≈302,5+38,26t) dù
    // JSON ghi "TUAN HOAN" — kiểm chứng trung vị sẽ bắt sai và rơi về
    // hồi quy tuyến tính (R²=0,997).
    const chirpM = /f\(t\)\s*=\s*([\d.]+)\s*\+\s*([\d.]+)\s*(?:\*?\s*\(t\s*mod\s*([\d.]+)\))?/.exec(wj.chirp ?? "");
    const parsed = chirpM ? { f0: Number(chirpM[1]), slope: Number(chirpM[2]), period: chirpM[3] ? Number(chirpM[3]) : 0 } : null;
    const fitLin = linearFit(inPass.map((r) => r.ph), inPass.map((r) => r.peakHz ?? 0));
    const driftWith = (f0v: number, slopev: number, periodv: number): number[] => {
      return keptNonEmpty.map((r) => {
        const tAudio = ((r.peakHz ?? 0) - f0v) / slopev;
        return periodv > 0 ? wrapDrift(tAudio - (r.ph % periodv), periodv) : tAudio - r.ph;
      });
    };
    let periodic = false;
    let f0 = fitLin.a;
    let slope = fitLin.b;
    let chirpParsed = 0;
    let chirpFitR2 = fitLin.r2;
    if (parsed && parsed.period > 0 && Math.abs(parsed.slope) > 1e-9) {
      const dParsed = driftWith(parsed.f0, parsed.slope, parsed.period);
      const medParsed = medianOf(dParsed.map((d) => Math.abs(d)));
      if (medParsed <= 0.3) {
        periodic = true; f0 = parsed.f0; slope = parsed.slope; chirpParsed = 1;
        // Độ khớp của mô hình đã parse: tỉ lệ mẫu có |drift| ≤ 0,5 s.
        chirpFitR2 = dParsed.filter((d) => Math.abs(d) <= 0.5).length / Math.max(dParsed.length, 1);
      }
    }
    if (Math.abs(slope) < 1e-9) {
      record({
        id: `N11a-drift-ceiling-headed-${item.tag}`,
        name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-203, fallback 202/201/200/199)`,
        verdict: "GHI NHẬN",
        numbers: { inpass_samples: inPass.length, fit_linear_r2: fitLin.r2, chirp_parsed: chirpParsed },
        notes: `Không xác định được công thức chirp (chuỗi JSON: ${wj.chirp ?? "?"}, hồi quy tuyến tính R²=${fitLin.r2.toFixed(3)}, slope≈0) — KHÔNG verdict; xem lại file P3-195.`,
      });
      continue;
    }
    const period = periodic && parsed ? parsed.period : 0;
    const driftOf = (r: Row203): number => {
      const tAudio = ((r.peakHz ?? 0) - f0) / slope;
      return period > 0 ? wrapDrift(tAudio - (r.ph % period), period) : tAudio - r.ph;
    };
    const rawAbs = inPass.map((r) => Math.abs(driftOf(r)));
    const absDrifts = keptNonEmpty.map((r) => Math.abs(driftOf(r))).sort((a, b) => a - b);
    const drifts = keptNonEmpty.map(driftOf);
    const median = medianOf(absDrifts);
    const p90 = absDrifts[Math.floor(absDrifts.length * 0.9)] ?? NaN;
    const maxDrift = absDrifts.length > 0 ? absDrifts[absDrifts.length - 1] : NaN;
    const rawMax = rawAbs.length > 0 ? Math.max(...rawAbs) : NaN;
    // Thống kê S2 (thước CHÍNH đợt 199): tính trên tập đã loại lag.
    const absDriftsS2 = keptS2NonEmpty.map((r) => Math.abs(driftOf(r))).sort((a, b) => a - b);
    const medianS2 = medianOf(absDriftsS2);
    const p90S2 = absDriftsS2[Math.floor(absDriftsS2.length * 0.9)] ?? NaN;
    const maxDriftS2 = absDriftsS2.length > 0 ? absDriftsS2[absDriftsS2.length - 1] : NaN;
    // Vị trí các mẫu vượt bar S2 (để P3-203 xác định transient — quyết
    // (a5)-202): chỉ tính trên tập S2; firstOnlyOverBar = đúng 1 mẫu vượt
    // và là mẫu sounding đầu tiên của pass (idx in-pass 0); đợt 203 gom
    // thêm thành cụm theo idxInPass liên tiếp (xem dưới).
    const overBarS2 = keptS2NonEmpty.map((r, k) => ({ r, idxInPass: keptS2IdxNonEmpty[k] ?? -1, d: driftOf(r) })).filter((o) => Math.abs(o.d) > 0.5);
    const firstOnlyOverBar = overBarS2.length === 1 && overBarS2[0].idxInPass === 0;
    // Đợt 203 (quyết (a5)-202): gom các mẫu vượt bar S2 thành cụm theo
    // idxInPass liên tiếp (không có mẫu trong bar xen giữa). Ghi cả
    // playhead của cụm đầu để kiểm "cùng playhead" — verdict chỉ cần
    // 1 cụm + cùng playhead, KHÔNG cần cụm ở đầu pass nữa.
    const overBarClusters: Array<{ startIdx: number; count: number; playheads: number[] }> = [];
    for (const o of overBarS2) {
      const last = overBarClusters[overBarClusters.length - 1];
      if (last && o.idxInPass === last.startIdx + last.count) { last.count++; last.playheads.push(o.r.ph); }
      else overBarClusters.push({ startIdx: o.idxInPass, count: 1, playheads: [o.r.ph] });
    }
    const firstClusterAtStart = overBarClusters.length > 0 && overBarClusters[0].startIdx === 0;
    const firstClusterSamePlayhead = overBarClusters.length > 0 && new Set(overBarClusters[0].playheads.map((p) => p.toFixed(1))).size === 1;
    const rmsVals = inPass.map((s) => s.rms ?? 0);
    const meanRms = rmsVals.reduce((a, b) => a + b, 0) / rmsVals.length;
    const flat = inPass.filter((s) => (s.waveMax ?? 0) - (s.waveMin ?? 0) < 4).length;
    // Counters: giá trị cuối in-pass (khớp countersEnd của probe khi có);
    // holdMaxSec lấy MAX (running max). Probe JSON (nếu có) cho loadMs,
    // RMS forward (median các mẫu RMS>0 — bền với transient 0,11/0,40)
    // và countersEnd tuyệt đối để đối chiếu số P3 in.
    const firstC = inPass[0].counters ?? {};
    const lastC = inPass[inPass.length - 1].counters ?? {};
    const delta = (k: string): number => (lastC[k] ?? 0) - (firstC[k] ?? 0);
    let holdMaxSec = 0;
    const decodeMsSet = new Set<number>();
    for (const r of inPass) {
      holdMaxSec = Math.max(holdMaxSec, r.counters?.holdMaxSec ?? 0);
      if (typeof r.counters?.lastWindowDecodeMs === "number" && (r.counters?.lastWindowDecodeMs ?? 0) > 0) decodeMsSet.add(r.counters.lastWindowDecodeMs);
    }
    let probe: ProbeJson203 | null = null;
    if (item.probePath) {
      try { probe = JSON.parse(fs.readFileSync(item.probePath, "utf8")) as ProbeJson203; } catch { probe = null; }
    }
    let loadMs: number | null = null;
    let fwdRmsMedian: number | null = null;
    let probeEnd: Record<string, number> | null = null;
    if (probe) {
      if (typeof probe.revClickT === "number" && probe.revSamples) {
        for (const s of probe.revSamples) {
          if ((s.revAudio?.loaded ?? 0) >= 1 && typeof s.t === "number") { loadMs = s.t - probe.revClickT; break; }
        }
      }
      if (probe.fwdSamples) {
        const fwd = probe.fwdSamples.map((s) => s.audio?.rms ?? 0).filter((v) => v > 0);
        if (fwd.length > 0) fwdRmsMedian = medianOf(fwd);
      }
      if (probe.countersEnd) probeEnd = probe.countersEnd;
    }
    const endC = probeEnd ?? lastC;
    // Chirp-70s KHÔNG còn là fixture bar N11a (quyết (a4)-196: bin 0,611 s >
    // bar 0,5 s — giới hạn đo, không chứng minh drift thật vượt bar) →
    // GHI NHẬN, không verdict. Fixture khác verdict theo max S2 (thước chính
    // đợt 197, đã kiểm chứng độc lập — LIMITS P4-197 §2.4).
    const isChirpFixture = /chirp/i.test(item.tag);
    const ruleVerdict = isChirpFixture ? "GHI NHẬN" : n11aVerdict203(maxDriftS2, overBarS2.length, firstOnlyOverBar, overBarClusters.length, firstClusterAtStart, firstClusterSamePlayhead);
    // F-201-P4-1 — GỠ CỜ parent_hold_199_longB theo quyết (a5)-200 (parent,
    // aggregate 200 §14.2): longB ĐẢO QUYẾT thành ĐẠT. Cơ sở (F-200-P4-1):
    // đếm "7 mẫu vượt" của P4-199 là đếm trên tập THÔ chưa lọc; trên thước
    // verdict S2 chỉ còn 1 mẫu vượt (mẫu đầu 2,756 s, leftover phát xuôi —
    // loại được, cùng lớp với 1 transient của longA theo tiền lệ (a5)-198);
    // 6 mẫu giữa pass (ph 198,8–237,1, drift 0,53–0,70 s) đều có peakHz
    // ĐÓNG BĂNG y hệt mẫu trước (Δpeak = 0 Hz) trong khi playhead chạy
    // 0,2–0,3 s — đúng định nghĩa stale-peak S1 (P3 §1.4), đã bị S1 loại.
    // Verdict nay = ruleVerdict thuần (n11aVerdict203), KHÔNG còn hold nào.
    const verdict = ruleVerdict;
    const binResSec = 23.4375 / Math.abs(slope); // analyser fftSize 2048 @48k → bin 23,44 Hz
    record({
      id: `N11a-drift-ceiling-headed-${item.tag}`,
      name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-203, fallback 202/201/200/199)`,
      verdict,
      numbers: {
        n_inpass_samples: inPass.length, n_stale_excluded: nStale, n_lag_excluded_s2: nLag, n_total_samples: rows.length,
        rms_mean: meanRms, rms_min: Math.min(...rmsVals), rms_max: Math.max(...rmsVals),
        rms_forward_median: fwdRmsMedian ?? -1,
        flat_waveform_inpass: flat,
        drift_median_s: median, drift_p90_s: p90, drift_max_s: maxDrift, drift_max_raw_s: rawMax,
        drift_median_s2_s: medianS2, drift_p90_s2_s: p90S2, drift_max_s2_s: maxDriftS2,
        n_over_bar_s2: overBarS2.length, over_bar_first_only: firstOnlyOverBar ? 1 : 0, n_over_bar_clusters: overBarClusters.length, first_cluster_at_start: firstClusterAtStart ? 1 : 0, first_cluster_same_playhead: firstClusterSamePlayhead ? 1 : 0, first_cluster_count: overBarClusters.length > 0 ? overBarClusters[0].count : 0, data_round: item.dataRound, parent_hold_199_longB: 0, // cờ ĐÃ GỠ (a5)-200 — giữ khóa = 0 để lineage report so được giữa các đợt
        over_bar_playheads_s: overBarS2.map((o) => o.r.ph.toFixed(1)).join(",") || "—",
        over_bar_drifts_s: overBarS2.map((o) => o.d.toFixed(3)).join(",") || "—",
        drift_min_signed_s: Math.min(...drifts), drift_max_signed_s: Math.max(...drifts),
        chirp_periodic: periodic ? 1 : 0, chirp_f0_hz: f0, chirp_slope_hz_per_s: slope,
        chirp_fit_r2: chirpFitR2, chirp_parsed: chirpParsed, chirp_bin_resolution_s: binResSec,
        holdCapStop_end: endC.holdCapStop ?? 0, holdCapStop_delta_inpass: delta("holdCapStop"),
        holdMaxSec_max: holdMaxSec, holdKeep_end: endC.holdKeep ?? 0, holdStop_end: endC.holdStop ?? 0,
        restart_end: endC.restart ?? 0, restartExact_end: endC.restartExact ?? 0,
        tick_end: endC.tick ?? 0, playOk_end: endC.playOk ?? 0, playFalse_end: endC.playFalse ?? 0,
        windowRebuilds_end: endC.windowRebuilds ?? 0,
        first_window_decode_ms: firstC.lastWindowDecodeMs ?? 0,
        last_window_decode_ms: lastC.lastWindowDecodeMs ?? 0,
        load_ms: loadMs ?? -1,
      },
      notes: `File: ${path.basename(item.wavePath)} (chirp ${periodic ? "tuần hoàn 10 s (lấy từ chuỗi thiết kế JSON, đã kiểm chứng trung vị |drift| ≤ 0,3 s)" : "tuyến tính (hồi quy)"} f0=${f0.toFixed(1)} Hz, slope=${slope.toFixed(2)} Hz/s, ${periodic ? `khớp ${(chirpFitR2 * 100).toFixed(1)}% mẫu |drift|≤0,5 s` : `R²=${chirpFitR2.toFixed(4)}`}; bin ${binResSec.toFixed(3)} s). In-pass ${inPass.length}/${rows.length} mẫu (playhead ${(inPass[0]?.ph ?? NaN).toFixed(1)}→${(inPass[inPass.length - 1]?.ph ?? NaN).toFixed(1)} s). Drift = t_audio − playhead${periodic ? `, wrap về [−${period / 2},${period / 2}]` : ""}; đã loại ${nStale} mẫu stale-peak S1 + ${nLag} mẫu lag S2 (|Δpeak|≤24 Hz, playhead ≥0,15 s) — max thô ${rawMax.toFixed(3)} s → S1 ${maxDrift.toFixed(3)} s → S2 ${maxDriftS2.toFixed(3)} s (thước verdict, quyết (a5)-202). Counters cuối: tick ${endC.tick ?? 0}, holdStop ${endC.holdStop ?? 0}, holdKeep ${endC.holdKeep ?? 0}, holdCapStop ${endC.holdCapStop ?? 0}, holdMaxSec ${holdMaxSec.toFixed(3)} s, restart ${endC.restart ?? 0}, restartExact ${endC.restartExact ?? 0}, playOk ${endC.playOk ?? 0}, playFalse ${endC.playFalse ?? 0}, windowRebuilds ${endC.windowRebuilds ?? 0} (countersEnd của probe${probeEnd ? "" : " — KHÔNG có, dùng mẫu in-pass cuối"}). Decode cửa sổ (lastWindowDecodeMs): ${[...decodeMsSet].sort((a, b) => a - b).join("/")} ms; load tới loaded=1: ${loadMs === null ? "?" : `${loadMs} ms`}. ${isChirpFixture ? "Chirp-70s KHÔNG phải fixture bar N11a từ đợt 197 (giữ nguyên đợt 199) (quyết (a4)-196: bin 0,611 s > bar 0,5 s — số chỉ tham khảo, KHÔNG verdict). " : ""}${!isChirpFixture ? `Vượt bar S2: ${overBarS2.length} mẫu (playhead ${overBarS2.map((o) => o.r.ph.toFixed(1)).join(", ") || "—"} s; drift ${overBarS2.map((o) => o.d.toFixed(3)).join(", ") || "—"} s). ` : ""}${!isChirpFixture && maxDriftS2 > 0.5 ? ((endC.holdCapStop ?? 0) > 0 ? "Vượt bar tuyệt đối 0,5 s theo thước S2 — cap 0,3 s (quyết (a4)-195) đã kích hoạt (holdCapStop > 0) nhưng drift tuyệt đối vẫn vượt: drift = drift-lúc-giữ + 0,3 s, nghĩa là drift-lúc-giữ > ~0,2 s hoặc cap chưa đủ siết với hold này. " : `Vượt bar tuyệt đối 0,5 s theo thước S2 — cap CHƯA kích hoạt ở pass này (holdCapStop = 0, holdMaxSec ${holdMaxSec.toFixed(3)} s). `) : ""}Cụm vượt bar S2: ${overBarClusters.length} cụm; cụm đầu ${overBarClusters.length > 0 ? overBarClusters[0].count : 0} mẫu từ idxInPass ${overBarClusters.length > 0 ? overBarClusters[0].startIdx : -1}, cùng playhead ${firstClusterSamePlayhead ? "CÓ" : "KHÔNG"} (quyết (a5)-202: 1 cụm cùng playhead = 1 sự kiện). Dữ liệu: ${item.dataRound === 203 ? "P3-203 (mới)" : item.dataRound === 202 ? "P3-202 — DỮ LIỆU NHIỆM VỤ đợt 203 (quyết (r)-202)" : item.dataRound === 201 ? "P3-201 — tái tính để đối chiếu" : item.dataRound === 200 ? "P3-200 — tái tính để đối chiếu" : "thô 199 — tái tính để đối chiếu, không phải verdict pass mới"}. Cờ parent_hold_199_longB ĐÃ GỠ theo quyết (a5)-200 (F-201-P4-1). Đối chiếu số P3 ở LIMITS P4-203.`,
    });
  }
  // --- N11b: decode âm thanh-only (ffmpeg) + đối chiếu timing P3 ---
  for (const item of found) {
    let wj2: WaveformJson203 | null = null;
    try {
      wj2 = JSON.parse(fs.readFileSync(item.wavePath, "utf8")) as WaveformJson203;
    } catch {
      wj2 = null;
    }
    const mp4Candidates = [
      wj2?.video ?? "",
      path.join(tmpDir, `${item.tag}.mp4`),
      path.join(benchDir, `${item.tag}.mp4`),
      path.join(p3Dir, `${item.tag}.mp4`),
      path.join(tmpDir201, `${item.tag}.mp4`),
      path.join(benchDir201, `${item.tag}.mp4`),
      path.join(p3Dir201, `${item.tag}.mp4`),
      path.join(tmpDir199, `${item.tag}.mp4`),
      path.join(benchDir199, `${item.tag}.mp4`),
      path.join(p3Dir199, `${item.tag}.mp4`),
    ].filter((p) => p !== "" && fs.existsSync(p));
    if (mp4Candidates.length === 0) {
      record({
        id: `N11b-decode-time-300-600s-${item.tag}`,
        name: `decode cửa sổ clip 300–600 s — ${item.tag} (đo lại thời gian decode trên fixture P3-203, fallback 202/201/200/199)`,
        verdict: "GHI NHẬN",
        numbers: {},
        notes: `Không tìm được fixture mp4 cho ${item.tag} (waveform.video + tmp-round203-p3 + benchmarks/reverse203 + hidden_files/round203-p3 đều không có) — chưa đo decode. Logic cửa sổ đã kiểm ở N11b-window-logic-300-600s.`,
      });
      continue;
    }
    const fixPath = mp4Candidates[0];
    const probeDur = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fixPath], { encoding: "utf8" });
    const dur = Number.parseFloat((probeDur.stdout || "").trim());
    // Decode CHỈ ÂM THANH (−vn): proxy đúng cho decodeAudioData của trình
    // duyệt khi load cửa sổ (wiring decode TOÀN FILE tạm thời mỗi lần đổi
    // cửa sổ). Decode cả video KHÔNG phải proxy đúng (nặng gấp ~10×).
    const t0 = Date.now();
    const dec = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", fixPath, "-vn", "-f", "null", "-"], { encoding: "utf8" });
    const audioSec = (Date.now() - t0) / 1000;
    const okDec = dec.status === 0;
    // Timing P3 (đọc lại từ JSON waveform: lastWindowDecodeMs ở mẫu
    // in-pass đầu/cuối — khớp số P3 in ở LIMITS §2.1/§3).
    let firstDecodeMs = -1;
    let lastDecodeMs = -1;
    if (wj2?.samples) {
      const withC = wj2.samples.filter((s) => typeof s.counters?.lastWindowDecodeMs === "number" && (s.counters?.lastWindowDecodeMs ?? 0) > 0);
      if (withC.length > 0) {
        firstDecodeMs = withC[0].counters?.lastWindowDecodeMs ?? -1;
        lastDecodeMs = withC[withC.length - 1].counters?.lastWindowDecodeMs ?? -1;
      }
    }
    const verdict = !okDec ? "GHI NHẬN" : firstDecodeMs > 0 && firstDecodeMs <= 5000 ? "ĐẠT" : "CHƯA ĐẠT";
    // Probe decode riêng của P3 (decode-probe, thử 200 rồi 199 — thử tmp,
    // hidden_files/round203-p3, benchmarks): decode toàn file bằng
    // decodeAudioData thật trong AudioContext rảnh (không phải headed pass)
    // — đối chiếu chéo, KHÔNG thay thước verdict (verdict vẫn theo timing
    // P3 headed lastWindowDecodeMs khi có).
    let probeDecodeMs: number[] = [];
    try {
      const dp = readDecodeProbe() as { files?: Array<{ base?: string; decodes?: number[] }> };
      const hit = (dp?.files ?? []).find((f) => (f.base ?? "") === `${item.tag}.mp4`);
      if (hit?.decodes) probeDecodeMs = hit.decodes;
    } catch { probeDecodeMs = []; }
    record({
      id: `N11b-decode-time-300-600s-${item.tag}`,
      name: `decode cửa sổ clip 300–600 s — ${item.tag} (đo lại thời gian decode trên fixture P3-203, fallback 202/201/200/199)`,
      verdict,
      numbers: {
        fixture_duration_s: Number.isNaN(dur) ? -1 : dur,
        ffmpeg_audio_only_decode_s: audioSec,
        p3_first_window_decode_ms: firstDecodeMs,
        p3_last_window_decode_ms: lastDecodeMs,
        probe_decode_first_ms: probeDecodeMs.length > 0 ? probeDecodeMs[0] : -1,
        probe_decode_2nd_ms: probeDecodeMs.length > 1 ? probeDecodeMs[1] : -1,
        probe_decode_3rd_ms: probeDecodeMs.length > 2 ? probeDecodeMs[2] : -1,
        ffmpeg_ok: okDec ? 1 : 0,
      },
      notes: `Fixture: ${path.basename(fixPath)} (${Number.isNaN(dur) ? "?" : dur.toFixed(1)} s). Decode âm thanh-only bằng ffmpeg: ${audioSec.toFixed(2)} s (proxy cho decodeAudioData — wiring decode TOÀN FILE tạm thời mỗi lần đổi cửa sổ). Timing P3 headed (lastWindowDecodeMs): cửa sổ đầu ${firstDecodeMs} ms, gần nhất ${lastDecodeMs} ms. Probe decode riêng P3 (decodeAudioData toàn file, AudioContext rảnh): ${probeDecodeMs.length > 0 ? probeDecodeMs.map((v) => `${v.toFixed(0)} ms`).join(" / ") : "chưa có"}. Bar tham chiếu: decode cửa sổ đầu ≤ 5 s (nợ P3-194 §5.2 — CHƯA do parent đặt, chỉ tham chiếu; verdict theo timing P3 headed, ffmpeg + probe riêng chỉ đối chiếu chéo). Đối chiếu timing decode của P3 ở LIMITS P4-200.`,
    });
  }
}

// ---------------------------------------------------------------------------
// N12a — PSOLA sim ĐỘC LẬP: gọi đúng lõi psolaPitchShift thật (psola.ts,
// thuần TS — cùng hàm worklet mirror) trên sine tổng hợp, đo bằng đúng
// thước đo của harness (spectralPeak + AM khối RMS 5 ms, như
// pitchShifterSim). Không dùng số sim của P1 — chỉ đối chiếu sau ở LIMITS.
// Sine 0,7 s (T0=−0,1, T1=0,6), phân tích đoạn [0,1, 0,6) như N2a.
// ---------------------------------------------------------------------------
