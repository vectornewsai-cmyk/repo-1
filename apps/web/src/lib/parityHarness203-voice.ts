// parityHarness203-voice.ts — Harness parity đợt 203 P4: mảng voice/pitch.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: voiceFilter, sectionVoiceRender, sectionVoicePreview,
// pitchShifterSim, sectionPitchArtifactSim (N2a/N9a).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { PITCH_WINDOW_S, SAW_GAIN_COMP, TELEPHONE_WET_GAIN_COMP } from "./previewVoiceFx";
import {
  REPO,
  TMP,
  applyAudioFilter,
  decodeAudioToPcm,
  ff,
  goertzelMag,
  nodeRequireJs,
  record,
  rmsWindow,
  spectralPeak,
  writeSineWav,
} from "./parityHarness203-core";

// ---------------------------------------------------------------------------
// S4 — P1 voice RENDER (nền): filter voicefx.js thật qua FFmpeg + Goertzel
// ---------------------------------------------------------------------------
export function voiceFilter(voiceJson: string): string {
  const s = nodeRequireJs("server/render/src/voicefx.js", `m.buildVoiceFilters(${voiceJson})`);
  if (!s) throw new Error(`buildVoiceFilters(${voiceJson}) trả "" — không có effect nào bật?`);
  return s.replace(/^,/, "");
}
export function sectionVoiceRender(): void {
  console.log("== S4 voice render (P1 nền) — filter voicefx.js thật qua FFmpeg ==");
  // Pitch: sine 440Hz → đỉnh phổ đo được phải ≈ 440 * 2^(n/12).
  const sine = path.join(TMP, "sine440.wav");
  writeSineWav(sine, [440], [0.5], 1.0);
  for (const [n, expected] of [[12, 880], [-12, 220], [7, 440 * Math.pow(2, 7 / 12)]] as const) {
    const f = voiceFilter(JSON.stringify({ pitch: n }));
    const out = path.join(TMP, `pitch${n}.wav`);
    applyAudioFilter(sine, f, out);
    const { samples, sr } = decodeAudioToPcm(out);
    const seg = samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const peak = spectralPeak(seg, sr, Math.max(50, expected * 0.7), expected * 1.4, 2);
    const errPct = ((peak.freq - expected) / expected) * 100;
    record({
      id: `S4-voice-pitch${n > 0 ? "+" : ""}${n}`,
      name: `voice pitch ${n} — render ${f} → đỉnh phổ đo được`,
      verdict: Math.abs(errPct) <= 3 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { expected_Hz: expected, measured_Hz: peak.freq, err_pct: errPct, peak_mag: peak.mag },
      notes: `Tiêu chí: đỉnh phổ trong ±3% của 440×2^(n/12). Chuỗi filter lấy từ voicefx.js thật.`,
    });
  }
  // Robot: sine 440 qua vibrato f=25 d=0.6 → sideband 415/465 phải xuất hiện.
  {
    const f = voiceFilter(JSON.stringify({ robot: { rate: 25, depth: 0.6 } }));
    const out = path.join(TMP, "robot.wav");
    applyAudioFilter(sine, f, out);
    const { samples, sr } = decodeAudioToPcm(out);
    const seg = samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const carrier = goertzelMag(seg, sr, 440);
    const sb = (goertzelMag(seg, sr, 415) + goertzelMag(seg, sr, 465)) / 2;
    const ratio = carrier > 0 ? sb / carrier : 0;
    record({
      id: "S4-voice-robot",
      name: `voice robot — render ${f} → sideband 415/465Hz`,
      verdict: ratio >= 0.05 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { carrier_440: carrier, sideband_avg: sb, sideband_ratio: ratio },
      notes: `Tiêu chí: năng lượng sideband/carrier >= 0.05 (vibrato điều chế thật, không phải sine khô).`,
    });
  }
  // Telephone: đa âm 100/1000/5000/8000Hz → 100 & 5000/8000 bị chặn, 1000 giữ.
  // Tiêu chí theo đúng đáp tuyến filter render (highpass 300 + lowpass 3400,
  // mỗi cái 2 cực Butterworth): ở 100Hz ≈ -19dB đo được; ở 5000Hz (1.47×
  // cutoff) chỉ ≈ -7.8dB — KHÔNG đòi -15dB ở đó (ngưỡng cũ sai filter);
  // ở 8000Hz (2.35× cutoff) ≈ -15dB mới là điểm kiểm dốc lowpass.
  {
    const multi = path.join(TMP, "multi.wav");
    // Amp 0.2/tone (không phải 0.5 như đợt 191): 4 tone × 0.5 có đỉnh tới
    // 2.0 → clip khi ghi pcm_s16le, làm lệch Goertzel ở 100 Hz (đợt 191 đo
    // att100 -21.06 dB, trong khi P1-191/P1-192 đo đơn tone + lý thuyết
    // Butterworth đều cho -19.1 dB = tỉ lệ 0.110). 5 tone × 0.2 ≤ 1.0.
    writeSineWav(multi, [100, 1000, 5000, 8000], [0.2, 0.2, 0.2, 0.2], 1.0);
    const f = voiceFilter(JSON.stringify({ telephone: true }));
    const out = path.join(TMP, "tel.wav");
    applyAudioFilter(multi, f, out);
    const { samples, sr } = decodeAudioToPcm(out);
    const seg = samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const dry = decodeAudioToPcm(multi).samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const db = (a: number, b: number) => 20 * Math.log10(a / b);
    const att100 = db(goertzelMag(seg, sr, 100), goertzelMag(dry, sr, 100));
    const att1000 = db(goertzelMag(seg, sr, 1000), goertzelMag(dry, sr, 1000));
    const att5000 = db(goertzelMag(seg, sr, 5000), goertzelMag(dry, sr, 5000));
    const att8000 = db(goertzelMag(seg, sr, 8000), goertzelMag(dry, sr, 8000));
    record({
      id: "S4-voice-telephone",
      name: `voice telephone — render ${f} → suy hao theo tần số`,
      verdict: att100 <= -15 && att5000 <= -5 && att8000 <= -12 && Math.abs(att1000) <= 3 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { att_100Hz_dB: att100, att_1000Hz_dB: att1000, att_5000Hz_dB: att5000, att_8000Hz_dB: att8000 },
      notes: `Tiêu chí: 100Hz suy hao >=15dB, 5000Hz >=5dB, 8000Hz >=12dB, 1000Hz giữ trong ±3dB (highpass 300 + lowpass 3400, mỗi cái 2 cực).`,
    });
  }
  // Echo: burst 0.05s tại 0.1s → năng lượng lặp lại ở cửa sổ [0.3,0.4]s.
  {
    const burstRaw = path.join(TMP, "burst.raw");
    const sr = 48000;
    const n = sr;
    const buf = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const on = t >= 0.1 && t < 0.15 ? 0.5 * Math.sin((2 * Math.PI * 440 * i) / sr) : 0;
      buf.writeFloatLE(on, i * 4);
    }
    fs.writeFileSync(burstRaw, buf);
    const burst = path.join(TMP, "burst.wav");
    ff(["-v", "error", "-y", "-f", "f32le", "-ar", "48000", "-ac", "1", "-i", burstRaw, "-c:a", "pcm_s16le", burst], "write burst");
    const f = voiceFilter(JSON.stringify({ echo: { delayMs: 200, decay: 0.5 } }));
    const out = path.join(TMP, "echo.wav");
    applyAudioFilter(burst, f, out);
    const { samples } = decodeAudioToPcm(out);
    const dryRms = rmsWindow(samples, sr, 0.1, 0.15);
    const echoRms = rmsWindow(samples, sr, 0.3, 0.35);
    const ratio = dryRms > 0 ? echoRms / dryRms : 0;
    record({
      id: "S4-voice-echo",
      name: `voice echo — render ${f} → lặp lại sau 200ms`,
      verdict: ratio >= 0.3 && ratio <= 0.7 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { dry_rms: dryRms, echo_rms: echoRms, echo_ratio: ratio },
      notes: `Tiêu chí: RMS cửa sổ echo [0.3,0.35]s / RMS burst gốc ∈ [0.3,0.7] (aecho delay 200ms decay 0.5, in_gain 0.8/out_gain 0.9 → kỳ vọng ≈0.5).`,
    });
  }
  // Chuỗi filter: kiểm tra đúng chuỗi voicefx.js cho preset đầy đủ.
  {
    const s = nodeRequireJs(
      "server/render/src/voicefx.js",
      `m.buildVoiceFilters({pitch:12,robot:{rate:25,depth:0.6},telephone:true,echo:{delayMs:200,decay:0.5}})`,
    );
    const okChain =
      s.includes("rubberband=tempo=1:pitch=2") &&
      s.includes("vibrato=f=25:d=0.6") &&
      s.includes("highpass=f=300") &&
      s.includes("lowpass=f=3400") &&
      s.includes("aecho=") &&
      s.includes("delays=200") &&
      s.includes("decays=0.5");
    record({
      id: "S4-voice-chain",
      name: "voice chain đầy đủ — buildVoiceFilters render",
      verdict: okChain ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { chain_len: s.length },
      notes: `Chuỗi render: ${s}`,
    });
  }
}

// ---------------------------------------------------------------------------
// S5 — P1 voice PREVIEW: P1 đã nối voice vào preview chưa?
// ---------------------------------------------------------------------------
function discoverVoicePreviewModules(): string[] {
  const libDir = path.join(REPO, "apps/web/src/lib");
  const cands: string[] = [];
  for (const f of fs.readdirSync(libDir)) {
    if (!/\.ts$/.test(f) || /\.test\.ts$/.test(f)) continue;
    if (/voice/i.test(f) && !/^clonedVoices/.test(f) && !/^parityHarness/.test(f)) cands.push(path.join(libDir, f)); // dot 203: loai module harness tu tach
    if (/195/.test(f) && /voice/i.test(f)) cands.push(path.join(libDir, f));
  }
  return [...new Set(cands)];
}
/** Chạy thử code TS của 1 module voice ứng viên qua esbuild bundle + node:
 * dựng fake AudioContext ghi lại mọi AudioParam, gọi createVoiceChain +
 * setParams(preset đầy đủ / null / pitch -12), trả snapshot tham số node.
 * Đây là THỰC THI code P1 (không phải grep source). */
function probeVoiceModule(file: string): {
  exports: string[];
  full: Record<string, Record<string, number | string>>;
  nullParams: Record<string, Record<string, number | string>>;
  neg12: Record<string, Record<string, number | string>>;
  error?: string;
} {
  const probe = path.join(TMP, "probe-voice.ts");
  const modUrl = JSON.stringify(file);
  fs.writeFileSync(
    probe,
    `import * as m from ${modUrl};\n` +
      `function param() { const p: any = { value: 0, setTargetAtTime(v: number) { p.value = v; }, setValueAtTime(v: number) { p.value = v; }, linearRampToValueAtTime(v: number) { p.value = v; } }; return p; }\n` +
      `function base() { return { connect() {}, disconnect() {} }; }\n` +
      `function gain() { return { ...base(), gain: param() }; }\n` +
      `function delay() { return { ...base(), delayTime: param() }; }\n` +
      `function biquad() { return { ...base(), type: "", frequency: param(), Q: param(), gain: param() }; }\n` +
      `function osc() { return { ...base(), type: "sine", frequency: param(), setPeriodicWave() {}, start() {}, stop() {} }; }\n` +
      `const ctx: any = { currentTime: 0, createGain: gain, createDelay: delay, createBiquadFilter: biquad, createOscillator: osc, createPeriodicWave() { return {}; } };\n` +
      `const out: any = { exports: Object.keys(m) };\n` +
      `if (typeof (m as any).createVoiceChain !== "function") { out.error = "no createVoiceChain export"; console.log(JSON.stringify(out)); }\n` +
      `else {\n` +
      `  const chain: any = (m as any).createVoiceChain(ctx);\n` +
      `  const snap = () => { const o: any = {}; for (const [k, v] of Object.entries(chain.nodes)) { const n: any = v; o[k] = {}; for (const p of ["gain", "delayTime", "frequency", "Q"]) if (n[p]) o[k][p] = n[p].value; if (typeof n.type === "string") o[k].type = n.type; } return o; };\n` +
      `  chain.setParams({ pitch: 12, robot: { rate: 25, depth: 0.6 }, telephone: true, echo: { delayMs: 200, decay: 0.5 } }, 0);\n` +
      `  out.full = snap();\n` +
      `  chain.setParams(null, 0);\n` +
      `  out.nullParams = snap();\n` +
      `  chain.setParams({ pitch: -12 }, 0);\n` +
      `  out.neg12 = snap();\n` +
      `  console.log(JSON.stringify(out));\n` +
      `}\n`,
  );
  const bundled = path.join(TMP, "probe-voice.mjs");
  const b = spawnSync(path.join(REPO, "node_modules/.bin/esbuild"), [probe, "--bundle", "--format=esm", "--platform=node", `--outfile=${bundled}`, "--log-level=error"], { encoding: "utf8" });
  if (b.status !== 0) return { exports: [], full: {}, nullParams: {}, neg12: {}, error: `esbuild: ${(b.stderr || "").slice(0, 300)}` };
  const r = spawnSync("node", [bundled], { encoding: "utf8" });
  if (r.status !== 0) return { exports: [], full: {}, nullParams: {}, neg12: {}, error: `node probe: ${(r.stderr || "").slice(0, 300)}` };
  try {
    return JSON.parse(r.stdout) as {
      exports: string[];
      full: Record<string, Record<string, number | string>>;
      nullParams: Record<string, Record<string, number | string>>;
      neg12: Record<string, Record<string, number | string>>;
      error?: string;
    };
  } catch {
    return { exports: [], full: {}, nullParams: {}, neg12: {}, error: `parse probe output: ${r.stdout.slice(0, 200)}` };
  }
}
export function sectionVoicePreview(): void {
  console.log("== S5 voice preview (P1) — voice đã vào preview chain chưa? ==");
  const audioEngineSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/audioEngine.ts"), "utf8");
  const wired =
    audioEngineSrc.includes("createVoiceChain(this.ctx)") &&
    audioEngineSrc.includes("setParams(fx?.voice") &&
    audioEngineSrc.includes("comp.connect(voice.input)");
  const voiceMentions = (audioEngineSrc.match(/voice/gi) || []).length;
  const cands = discoverVoicePreviewModules();
  const detail: string[] = [];
  detail.push(`audioEngine.ts nhắc "voice" ${voiceMentions} lần; nối chain: ${wired ? "CÓ (createVoiceChain + setParams(fx?.voice) + comp→voice→gain)" : "CHƯA"}.`);
  detail.push(cands.length ? `module voice ứng viên: ${cands.map((c) => path.basename(c)).join(", ")}` : "không có module voice* mới nào trong apps/web/src/lib (ngoài clonedVoices).");
  // Kỳ vọng tham số preview (từ voicefx.js render) — SUY RA TỪ HẰNG CODE
  // THẬT (không hardcode W): pitch +12 → LFO |2-1|/W, sawGain ∓(W/2)×
  // SAW_GAIN_COMP; W = PITCH_WINDOW_S (đợt 193 P1: 0,04 → 0,08 — xem
  // F-193-P4-1: kỳ vọng cũ 25 Hz / ∓0,02× là giá trị W=0,04); telWet =
  // TELEPHONE_WET_GAIN_COMP = 0,76 (bù RBJ, parent duyệt §14.2-192 —
  // kỳ vọng cũ 1 là TRƯỚC bù); xfade 0.5/0.5, dry 0; robot 25Hz,
  // delay 0.6×0.0027 = 0.00162s; telephone HP 300/LP 3400 Q 1/√2;
  // echo delay 0.2s, dry 0.8×0.9 = 0.72, wet 0.9×0.5 = 0.45.
  const Q = 1 / Math.SQRT2;
  const checks: Array<{ name: string; got: unknown; want: number | string; tol: number }> = [];
  let probeInfo = "";
  let paramsOk = false;
  for (const c of cands) {
    const probe = probeVoiceModule(c);
    if (probe.error || !probe.full || Object.keys(probe.full).length === 0) {
      probeInfo += ` ${path.basename(c)}: LỖI ${probe.error ?? "không snapshot được"};`;
      continue;
    }
    const F = probe.full;
    const N = probe.nullParams;
    const G = probe.neg12;
    const num = (o: Record<string, Record<string, number | string>> | undefined, node: string, param: string): number =>
      Number(o?.[node]?.[param] ?? NaN);
    const lfo12 = Math.abs(2 - 1) / PITCH_WINDOW_S; // +12: |r-1|/W
    const lfoM12 = Math.abs(0.5 - 1) / PITCH_WINDOW_S; // -12: |r-1|/W
    const sawHalf = (PITCH_WINDOW_S / 2) * SAW_GAIN_COMP;
    checks.push(
      { name: "pitchOscA.freq", got: num(F, "pitchOscA", "frequency"), want: lfo12, tol: 1e-9 },
      { name: "pitchOscB.freq", got: num(F, "pitchOscB", "frequency"), want: lfo12, tol: 1e-9 },
      { name: "pitchOscCos.freq", got: num(F, "pitchOscCos", "frequency"), want: lfo12, tol: 1e-9 },
      { name: "pitchSawGainA", got: num(F, "pitchSawGainA", "gain"), want: -sawHalf, tol: 1e-9 },
      { name: "pitchSawGainB", got: num(F, "pitchSawGainB", "gain"), want: -sawHalf, tol: 1e-9 },
      { name: "pitchXfadeA", got: num(F, "pitchXfadeA", "gain"), want: 0.5, tol: 1e-9 },
      { name: "pitchXfadeB", got: num(F, "pitchXfadeB", "gain"), want: 0.5, tol: 1e-9 },
      { name: "pitchDry(full)", got: num(F, "pitchDry", "gain"), want: 0, tol: 1e-9 },
      { name: "pitchXfadeModA", got: num(F, "pitchXfadeModA", "gain"), want: -0.5, tol: 1e-9 },
      { name: "pitchXfadeModB", got: num(F, "pitchXfadeModB", "gain"), want: 0.5, tol: 1e-9 },
      { name: "robotOsc.freq", got: num(F, "robotOsc", "frequency"), want: 25, tol: 1e-9 },
      { name: "robotDelay.delayTime", got: num(F, "robotDelay", "delayTime"), want: 0.00162, tol: 1e-9 },
      { name: "robotLfoGain", got: num(F, "robotLfoGain", "gain"), want: 0.00162, tol: 1e-9 },
      { name: "robotDry(full)", got: num(F, "robotDry", "gain"), want: 0, tol: 1e-9 },
      { name: "robotWet", got: num(F, "robotWet", "gain"), want: 1, tol: 1e-9 },
      { name: "telHp.freq", got: num(F, "telHp", "frequency"), want: 300, tol: 1e-9 },
      { name: "telHp.Q", got: num(F, "telHp", "Q"), want: Q, tol: 1e-9 },
      { name: "telLp.freq", got: num(F, "telLp", "frequency"), want: 3400, tol: 1e-9 },
      { name: "telLp.Q", got: num(F, "telLp", "Q"), want: Q, tol: 1e-9 },
      { name: "telDry(full)", got: num(F, "telDry", "gain"), want: 0, tol: 1e-9 },
      { name: "telWet", got: num(F, "telWet", "gain"), want: TELEPHONE_WET_GAIN_COMP, tol: 1e-9 },
      { name: "echoDelay.delayTime", got: num(F, "echoDelay", "delayTime"), want: 0.2, tol: 1e-9 },
      { name: "echoDry(full)", got: num(F, "echoDry", "gain"), want: 0.72, tol: 1e-9 },
      { name: "echoWet", got: num(F, "echoWet", "gain"), want: 0.45, tol: 1e-9 },
      { name: "pitchDry(null)", got: num(N, "pitchDry", "gain"), want: 1, tol: 1e-9 },
      { name: "robotDry(null)", got: num(N, "robotDry", "gain"), want: 1, tol: 1e-9 },
      { name: "telDry(null)", got: num(N, "telDry", "gain"), want: 1, tol: 1e-9 },
      { name: "echoDry(null)", got: num(N, "echoDry", "gain"), want: 1, tol: 1e-9 },
      { name: "robotWet(null)", got: num(N, "robotWet", "gain"), want: 0, tol: 1e-9 },
      { name: "telWet(null)", got: num(N, "telWet", "gain"), want: 0, tol: 1e-9 },
      { name: "echoWet(null)", got: num(N, "echoWet", "gain"), want: 0, tol: 1e-9 },
      { name: "pitchOscA.freq(-12)", got: num(G, "pitchOscA", "frequency"), want: lfoM12, tol: 1e-9 },
      { name: "pitchSawGainA(-12)", got: num(G, "pitchSawGainA", "gain"), want: sawHalf, tol: 1e-9 },
    );
    const telHpType = F.telHp?.type;
    const telLpType = F.telLp?.type;
    checks.push(
      { name: "telHp.type", got: telHpType, want: "highpass", tol: 0 },
      { name: "telLp.type", got: telLpType, want: "lowpass", tol: 0 },
    );
    const failed = checks.filter(
      (ch) => typeof ch.got !== "number" || Number.isNaN(ch.got as number)
        ? ch.got !== ch.want
        : Math.abs((ch.got as number) - (ch.want as number)) > ch.tol,
    );
    paramsOk = failed.length === 0;
    probeInfo += ` ${path.basename(c)}: ${checks.length - failed.length}/${checks.length} tham số khớp render` +
      (failed.length ? ` — LỆCH: ${failed.map((f) => `${f.name}=${f.got} (muốn ${f.want})`).join("; ")}` : " — toàn bộ khớp.") +
      ` telHp.type=${telHpType} telLp.type=${telLpType}.`;
  }
  record({
    id: "S5-voice-preview",
    name: "voice → preview: chain preview áp đúng tham số như render + đã nối vào audioEngine",
    verdict: wired && cands.length > 0 && paramsOk ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      audioEngine_voice_mentions: voiceMentions, candidate_modules: cands.length,
      wired: wired ? 1 : 0, params_checked: checks.length,
      params_matched: checks.filter((ch) => typeof ch.got === "number" && !Number.isNaN(ch.got) ? Math.abs(ch.got - (ch.want as number)) <= ch.tol : ch.got === ch.want).length,
    },
    notes: detail.join(" ") + probeInfo +
      ` Tiêu chí ĐẠT: audioEngine nối chain (comp→voice→gain, setParams mỗi frame) + mọi tham số node khớp render (pitch 2^(n/12) qua LFO |r-1|/W, vibrato f/d, HP 300/LP 3400 Q=1/√2, aecho dry 0.72/wet 0.45). Không claim nghe bằng tai — pitch-shifter là xấp xỉ (không phải rubberband phase-vocoder), xem LIMITS §3.`,
  });
}

// ---------------------------------------------------------------------------
// S6 — P3 reverse VIDEO: sourceTimeAt (preview) vs filter reverse (render)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// N2-sim — P1 pitch artifact: mô phỏng 2-delay shifter bằng số học thuần
// (hằng số + cấu trúc đúng code previewVoiceFx.ts; đã kiểm chứng với số
// Chrome của P1-191 — xem notes case N2a).
// ---------------------------------------------------------------------------
export function pitchShifterSim(f0: number, nSemi: number): { domFreq: number; errSt: number; amDepth: number; sidebandRatio: number; fLfo: number } {
  const sr = 48000;
  const r = Math.pow(2, nSemi / 12);
  const fLfo = Math.abs(r - 1) / PITCH_WINDOW_S;
  const sawGain = (r > 1 ? -PITCH_WINDOW_S / 2 : PITCH_WINDOW_S / 2) * SAW_GAIN_COMP;
  // Saw đã chuẩn hoá theo Chrome: PeriodicWave chuẩn hoá → độ dốc saw hiệu
  // dụng 43/s thay vì 50/s lý tưởng (P1-191 LIMITS §4.2). Dùng saw lý tưởng
  // (không chuẩn hoá) cho domFreq +12@440 = 939 Hz (sai +1.1 st) — SAI.
  const SAW_NORM = 43 / 50;
  const sawA = (theta: number): number => {
    const t = (((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    return SAW_NORM * (t / Math.PI - 1);
  };
  const sawB = (theta: number): number => sawA(theta + Math.PI);
  const T0 = -0.1;
  const T1 = 0.6;
  const N = Math.floor((T1 - T0) * sr);
  const x = new Float64Array(N);
  for (let i = 0; i < N; i++) { const t = T0 + i / sr; x[i] = Math.sin(2 * Math.PI * f0 * t); }
  const y = new Float64Array(N);
  const at = (tt: number): number => {
    const pos = (tt - T0) * sr;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    if (i0 < 0) return 0;
    if (i0 + 1 >= N) return x[N - 1];
    return x[i0] * (1 - frac) + x[i0 + 1] * frac;
  };
  for (let i = 0; i < N; i++) {
    const t = T0 + i / sr;
    const th = 2 * Math.PI * fLfo * t;
    const dA = Math.max(0, Math.min(0.1, PITCH_WINDOW_S / 2 + sawGain * sawA(th)));
    const dB = Math.max(0, Math.min(0.1, PITCH_WINDOW_S / 2 + sawGain * sawB(th)));
    const xfA = 0.5 * (1 - Math.cos(th));
    const xfB = 0.5 * (1 + Math.cos(th));
    y[i] = xfA * at(t - dA) + xfB * at(t - dB);
  }
  const a = Math.floor((0.1 - T0) * sr);
  const seg = y.subarray(a, N);
  const target = f0 * r;
  const peak = spectralPeak(seg, sr, target * 0.7, target * 1.4, 1);
  const errSt = 12 * Math.log2(peak.freq / target);
  const win = Math.floor(0.005 * sr);
  let mn = Infinity;
  let mx = -Infinity;
  for (let s0 = a; s0 + win <= N; s0 += win) {
    let ss = 0;
    for (let i = s0; i < s0 + win; i++) ss += y[i] * y[i];
    const rms = Math.sqrt(ss / win);
    mn = Math.min(mn, rms);
    mx = Math.max(mx, rms);
  }
  const amDepth = (mx - mn) / (mx + mn);
  const sb = (goertzelMag(seg, sr, peak.freq - fLfo) + goertzelMag(seg, sr, peak.freq + fLfo)) / 2 / peak.mag;
  return { domFreq: peak.freq, errSt, amDepth, sidebandRatio: sb, fLfo };
}
export function sectionPitchArtifactSim(): void {
  console.log("== N2-sim pitch artifact (P1) — mô phỏng 2-delay shifter (hằng số từ code thật) ==");
  const cases: Array<{ f0: number; n: number }> = [
    { f0: 440, n: 12 },
    { f0: 440, n: -12 },
    { f0: 440, n: 7 },
    { f0: 440, n: -7 },
  ];
  const rows = cases.map((c) => ({ ...c, ...pitchShifterSim(c.f0, c.n) }));
  const worstErr = Math.max(...rows.map((r) => Math.abs(r.errSt)));
  const worstAm = Math.max(...rows.map((r) => r.amDepth));
  const worstSb = Math.max(...rows.map((r) => r.sidebandRatio));
  record({
    id: "N2a-pitch-artifact-440",
    name: "pitch artifact @440Hz (sim) — domFreq + AM depth + sideband, n=+12/-12/+7/-7",
    verdict: worstErr <= 0.5 && worstAm <= 0.35 && worstSb <= 0.25 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      worst_err_st: worstErr, worst_AM_depth: worstAm, worst_sideband_ratio: worstSb,
      domFreq_p12: rows[0].domFreq, err_p12_st: rows[0].errSt, AM_p12: rows[0].amDepth,
      domFreq_m12: rows[1].domFreq, err_m12_st: rows[1].errSt, AM_m12: rows[1].amDepth,
      domFreq_p7: rows[2].domFreq, err_p7_st: rows[2].errSt,
      domFreq_m7: rows[3].domFreq, err_m7_st: rows[3].errSt,
      PITCH_WINDOW_S, SAW_GAIN_COMP,
    },
    notes: `Sim đã kiểm chứng với số Chrome của P1-191/P1-192 (OfflineAudioContext): +12@440 sim 889 Hz (+0.18 st) vs Chrome 890.0–890.6 Hz (+0.20–0.21 st); -12@440 sim 215 Hz (-0.40 st) vs Chrome 213.9–215.0 Hz (-0.40–-0.49 st). Tiêu chí: |sai số| ≤ 0.5 st (mức của P1-191; P1-192 đo chính xác max 0.40 st) + AM depth ≤ 0.35 (P1-192 đo AM ở 440 Hz trong 0.10–0.30, cộng biên) + sideband ≤ 0.25. W=${PITCH_WINDOW_S}s, SAW_GAIN_COMP=${SAW_GAIN_COMP} đọc từ code thật. TỪ ĐỢT 196: 2-delay chỉ còn là FALLBACK khi PSOLA upgrade thất bại (previewVoiceFx upgradePitchToPsola); verdict đường chính ở N12/N12a/N2-headed.`,
  });
  // N2b — phụ thuộc tần số nền (caveat P1-191 §3.4, P1-192 §3.4): 220 Hz +12.
  const r220 = pitchShifterSim(220, 12);
  // Hàng phụ: -12@220 là case lệch tệ nhất của P1-192 (+1.51 st, 120 Hz) —
  // kiểm độc lập bằng sim (không đổi verdict, verdict chỉ theo +12).
  const r220m12 = pitchShifterSim(220, -12);
  record({
    id: "N2b-pitch-artifact-220",
    name: "pitch artifact @220Hz +12 (sim) — kiểm phụ thuộc tần số nền",
    verdict: Math.abs(r220.errSt) <= 1.0 && r220.amDepth <= 0.7 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { domFreq: r220.domFreq, target_Hz: 440, err_st: r220.errSt, AM_depth: r220.amDepth, sideband_ratio: r220.sidebandRatio, minus12_domFreq: r220m12.domFreq, minus12_target_Hz: 110, minus12_err_st: r220m12.errSt, minus12_AM_depth: r220m12.amDepth },
    notes: `Baseline P1-192 (§3.1/§3.4, đo Chrome chính xác): 220 Hz +12 → 420 Hz (-0.81 st); AM ở 220 Hz trong 0.51–0.67; -12 → 120 Hz (+1.51 st, triệt răng trung tâm). Tiêu chí ĐẠT là KHÔNG HỒI QUY so với baseline đó (|err| ≤ 1.0 st, AM ≤ 0.7) — không phải bar ±0.5 st như 440 Hz, vì đây là giới hạn nội tại của thiết kế 2-delay mà P1-192 đã chứng minh không sửa được bằng tham số (SAW_GAIN_COMP giữ 50/43). Sim baseline code 191: domFreq 419 Hz (-0.85 st), AM 0.311. Hàng phụ -12@220 (sim): kiểm độc lập claim +1.51 st của P1-192.`,
  });
  // N9a — ĐƯỜNG CONG trade-off pitch W=0,08 (P1-195 map f0 220–660 Hz):
  // sim 20 điểm f0 ∈ {220,330,440,550,660} × n ∈ {+12,−12,+7,−7} bằng
  // đúng pitchShifterSim (hằng số từ code thật). Lượng tử hoá răng lược:
  // răng cách nhau fLfo = |r−1|/W (vd +12: 12,5 Hz; +7: 6,24 Hz) nên
  // domFreq "dính" răng gần mục tiêu nhất — errSt chính là sai số lượng
  // tử hoá. Verdict theo bar sai số ≤ 0,5 st ở cả 20 điểm; AM ghi theo
  // từng f0 để đối chiếu với map headed của P1-195 (AM@440 vượt bar 0,35
  // là trade-off đã quyết — verdict AM vẫn nằm ở N2a/N2-headed, không
  // lặp lại ở đây để tránh đếm trùng một lỗi thành hai CHƯA ĐẠT).
  {
    const grid: Array<{ f0: number; n: number }> = [];
    for (const f0 of [220, 330, 440, 550, 660])
      for (const n of [12, -12, 7, -7]) grid.push({ f0, n });
    const rows = grid.map((c) => ({ ...c, ...pitchShifterSim(c.f0, c.n) }));
    const worstErr = Math.max(...rows.map((r) => Math.abs(r.errSt)));
    const worstAm = Math.max(...rows.map((r) => r.amDepth));
    const nums: Record<string, number> = { worst_err_st: worstErr, worst_AM_depth: worstAm };
    for (const f0 of [220, 330, 440, 550, 660]) {
      const sub = rows.filter((r) => r.f0 === f0);
      nums[`worst_err_${f0}_st`] = Math.max(...sub.map((r) => Math.abs(r.errSt)));
      nums[`worst_AM_${f0}`] = Math.max(...sub.map((r) => r.amDepth));
      for (const r of sub) {
        const s = r.n > 0 ? `p${r.n}` : `m${-r.n}`;
        nums[`err_${f0}_${s}_st`] = r.errSt;
        nums[`AM_${f0}_${s}`] = r.amDepth;
        nums[`domFreq_${f0}_${s}_Hz`] = r.domFreq;
      }
    }
    record({
      id: "N9a-pitch-curve-sim",
      name: "pitch trade-off curve W=0,08 (sim) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm",
      verdict: worstErr <= 0.5 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: nums,
      notes: `Sim 2-delay (hằng số từ code thật, W=${PITCH_WINDOW_S}s). Sai số lượng tử hoá = errSt: domFreq dính răng lược cách nhau fLfo = |r−1|/W (n=+12: 12,5 Hz; n=+7: 6,24 Hz; n=−12: 12,5 Hz; n=−7: 6,24 Hz). Tiêu chí: |err| ≤ 0,5 st ở cả 20 điểm. AM theo từng f0 chỉ đối chiếu với map headed P1-195 (không verdict AM ở đây — xem N2a/N2-headed). Kỳ vọng từ P1-194 §1: 440 Hz err ≤ 0,40 st; 220 Hz err ≤ 0,40 st (trừ −12: −0,40 st sau W=0,08); 880 Hz err ≤ 0,10 st — các f0 mới 330/550/660 chưa có baseline, sim này là baseline độc lập đầu tiên.`,
    });
  }
}

