/**
 * AudioFxPanel — Panel HIỆU ỨNG ÂM THANH cho clip audio/video đang chọn (R1-076).
 *
 * Tự đọc selection từ store nên tích hợp chỉ cần 1 dòng, ví dụ trong Inspector:
 *   {(clip.kind === "audio" || clip.kind === "video") && <AudioFxPanel />}
 *
 * Hiệu ứng (khớp ngữ nghĩa packages/video-spec/src/audio.ts):
 * - Bass/Treble: boost/cut ±12 dB — render: filter `bass`/`treble`
 * - Giảm nhiễu: 0..100% — render: `afftdn`
 * - Compressor: toggle + ngưỡng/tỉ lệ — render: `acompressor`
 * - Reverb: 0..100% — render: `aecho` 2 taps
 *
 * Render worker áp dụng đầy đủ. Preview (Web Audio) áp dụng bass/treble/
 * compressor; reverb + giảm nhiễu là render-only — xem AUDIOFX_LIMITS.md.
 */
import { useState } from "react";
import { useStore } from "../../store";
import "./audiofx.css";
import {
  validateAudioEffects,
  type AudioEffects,
} from "../../../../../packages/video-spec/src/audio";

type FxClip = { audioEffects?: AudioEffects };

function FxSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="fx-field">
      <span>
        {label}: {value > 0 ? "+" : ""}
        {value}
        {unit}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function AudioFxPanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [warn, setWarn] = useState<string | null>(null);

  const primary = selection[0] ?? null;
  if (!primary) return null;
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip || (clip.kind !== "audio" && clip.kind !== "video")) return null;

  const st = useStore.getState();
  const fx: AudioEffects = (clip as FxClip).audioEffects ?? {};

  const applyFx = (next: AudioEffects | undefined) => {
    const errs = validateAudioEffects(next);
    if (errs.length > 0) {
      setWarn(errs[0]);
      return;
    }
    setWarn(null);
    st.patchClip(track.id, clip.id, { audioEffects: next } as Partial<typeof clip>);
  };

  const set = (patch: Partial<AudioEffects>) => {
    const next = { ...fx, ...patch };
    // Dọn field về undefined khi về giá trị "tắt" để spec gọn.
    if (next.bass === 0) delete next.bass;
    if (next.treble === 0) delete next.treble;
    if (next.noiseReduction === 0) delete next.noiseReduction;
    if (next.reverb === 0) delete next.reverb;
    applyFx(Object.keys(next).length > 0 ? next : undefined);
  };

  const setComp = (patch: Partial<NonNullable<AudioEffects["compressor"]>>) => {
    const cur = fx.compressor ?? {};
    set({ compressor: { ...cur, ...patch } });
  };

  const toggleComp = () => {
    if (fx.compressor) {
      const next = { ...fx };
      delete next.compressor;
      applyFx(Object.keys(next).length > 0 ? next : undefined);
    } else {
      set({ compressor: {} });
    }
  };

  const comp = fx.compressor;

  // Phase 8 Q5: voice effects (render: rubberband/vibrato/bandpass/aecho).
  // Robot ở đây là vibrato xấp xỉ, KHÔNG phải vocoder thật — xem Q5_LIMITS.md.
  const voice = fx.voice ?? {};
  const setVoice = (patch: Partial<NonNullable<AudioEffects["voice"]>>) => {
    const next = { ...voice, ...patch };
    if (next.pitch === 0) delete next.pitch;
    set({ voice: next });
  };
  const toggleVoiceFlag = (key: "robot" | "telephone" | "echo") => {
    if (voice[key]) {
      const next = { ...voice };
      delete next[key];
      set({ voice: next });
    } else if (key === "robot") {
      setVoice({ robot: { rate: 25, depth: 0.6 } });
    } else if (key === "echo") {
      setVoice({ echo: { delayMs: 200, decay: 0.5 } });
    } else {
      setVoice({ telephone: true });
    }
  };

  return (
    <div className="fx-panel">
      <FxSlider
        label="🔉 Bass"
        value={fx.bass ?? 0}
        min={-12}
        max={12}
        step={0.5}
        unit=" dB"
        onChange={(v) => set({ bass: v })}
      />
      <FxSlider
        label="🔊 Treble"
        value={fx.treble ?? 0}
        min={-12}
        max={12}
        step={0.5}
        unit=" dB"
        onChange={(v) => set({ treble: v })}
      />
      <FxSlider
        label="🔇 Giảm nhiễu"
        value={Math.round((fx.noiseReduction ?? 0) * 100)}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => set({ noiseReduction: v / 100 })}
      />
      <FxSlider
        label="🏰 Reverb"
        value={Math.round((fx.reverb ?? 0) * 100)}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => set({ reverb: v / 100 })}
      />
      <label className="fx-check">
        <input type="checkbox" checked={!!comp} onChange={toggleComp} />
        <span>🗜️ Compressor {comp ? "(đang bật)" : ""}</span>
      </label>
      {comp && (
        <div className="fx-sub">
          <FxSlider
            label="Ngưỡng"
            value={comp.thresholdDb ?? -20}
            min={-60}
            max={0}
            step={1}
            unit=" dB"
            onChange={(v) => setComp({ thresholdDb: v })}
          />
          <FxSlider
            label="Tỉ lệ nén"
            value={comp.ratio ?? 4}
            min={1}
            max={20}
            step={0.5}
            unit=":1"
            onChange={(v) => setComp({ ratio: v })}
          />
        </div>
      )}
      {/* Phase 8 Q5: voice effects */}
      <div className="panel-head" style={{ marginTop: 12 }}>🎭 Đổi giọng</div>
      <FxSlider
        label="🎹 Cao độ"
        value={voice.pitch ?? 0}
        min={-12}
        max={12}
        step={1}
        unit=" semitone"
        onChange={(v) => setVoice({ pitch: v })}
      />
      <label className="fx-check">
        <input type="checkbox" checked={!!voice.robot} onChange={() => toggleVoiceFlag("robot")} />
        <span>🤖 Robot (vibrato xấp xỉ, không phải vocoder thật)</span>
      </label>
      {voice.robot && typeof voice.robot === "object" && (
        <div className="fx-sub">
          <FxSlider
            label="Tốc độ rung"
            value={voice.robot.rate ?? 25}
            min={5}
            max={60}
            step={1}
            unit=" Hz"
            onChange={(v) => setVoice({ robot: { rate: v, depth: (typeof voice.robot === "object" ? voice.robot.depth : undefined) ?? 0.6 } })}
          />
          <FxSlider
            label="Độ sâu rung"
            value={Math.round(((typeof voice.robot === "object" ? voice.robot.depth : undefined) ?? 0.6) * 100)}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => setVoice({ robot: { rate: (typeof voice.robot === "object" ? voice.robot.rate : undefined) ?? 25, depth: v / 100 } })}
          />
        </div>
      )}
      <label className="fx-check">
        <input type="checkbox" checked={!!voice.telephone} onChange={() => toggleVoiceFlag("telephone")} />
        <span>📞 Điện thoại (băng tần 300–3400 Hz)</span>
      </label>
      <label className="fx-check">
        <input type="checkbox" checked={!!voice.echo} onChange={() => toggleVoiceFlag("echo")} />
        <span>🔁 Vang (echo)</span>
      </label>
      {voice.echo && typeof voice.echo === "object" && (
        <div className="fx-sub">
          <FxSlider
            label="Độ trễ vang"
            value={voice.echo.delayMs ?? 200}
            min={50}
            max={1000}
            step={10}
            unit=" ms"
            onChange={(v) => setVoice({ echo: { delayMs: v, decay: (typeof voice.echo === "object" ? voice.echo.decay : undefined) ?? 0.5 } })}
          />
          <FxSlider
            label="Độ suy giảm vang"
            value={Math.round(((typeof voice.echo === "object" ? voice.echo.decay : undefined) ?? 0.5) * 100)}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => setVoice({ echo: { delayMs: (typeof voice.echo === "object" ? voice.echo.delayMs : undefined) ?? 200, decay: v / 100 } })}
          />
        </div>
      )}
      {warn && <div className="fx-warn">{warn}</div>}
      {(fx.bass !== undefined ||
        fx.treble !== undefined ||
        fx.noiseReduction !== undefined ||
        fx.reverb !== undefined ||
        comp) && (
        <button className="fx-reset" onClick={() => applyFx(undefined)}>
          ↩ Đặt lại hiệu ứng
        </button>
      )}
    </div>
  );
}
