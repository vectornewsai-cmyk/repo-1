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
import { t as i18nT, useLang } from "../../i18n";
import {
  validateAudioEffects,
  validateDuckingSettings,
  DEFAULT_DUCKING_SETTINGS,
  type AudioEffects,
  type DuckingSettings,
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

/**
 * DuckingSection — điều khiển audio ducking CẤP PROJECT (không phải cấp clip).
 * Nằm trong AudioFxPanel để khỏi sửa Inspector (ngoài phạm vi batch này).
 * Đổi qua useStore.setState trực tiếp nên chưa đi qua history undo của store
 * (store.ts ngoài phạm vi) — xem server/render/src/DUCKING_LIMITS.md.
 * Render-only: preview (Web Audio) chưa áp dụng ducking.
 */
function DuckingSection() {
  const spec = useStore((s) => s.spec);
  const [warn, setWarn] = useState<string | null>(null);
  const duck: DuckingSettings = spec.ducking ?? {};
  const audioTracks = spec.tracks.filter((t) => t.kind === "audio" && !t.muted);

  const applyDuck = (next: DuckingSettings | undefined) => {
    const errs = validateDuckingSettings(next);
    if (errs.length > 0) {
      setWarn(errs[0]);
      return;
    }
    setWarn(null);
    useStore.setState((s) => ({ spec: { ...s.spec, ducking: next } }));
  };

  const setDuck = (patch: Partial<DuckingSettings>) => {
    applyDuck({ ...duck, ...patch });
  };

  const toggle = () => {
    if (duck.enabled) {
      // Tắt → gỡ luôn field cho spec gọn (mở lại thì lấy mặc định).
      applyDuck(undefined);
    } else {
      const first = audioTracks[0];
      applyDuck({
        enabled: true,
        voiceTrackId: first?.id,
        thresholdDb: DEFAULT_DUCKING_SETTINGS.thresholdDb,
        ratio: DEFAULT_DUCKING_SETTINGS.ratio,
        attackMs: DEFAULT_DUCKING_SETTINGS.attackMs,
        releaseMs: DEFAULT_DUCKING_SETTINGS.releaseMs,
        duckAmountDb: DEFAULT_DUCKING_SETTINGS.duckAmountDb,
      });
    }
  };

  return (
    <>
      <div className="panel-head">{i18nT("audiofx.duckingHead")}</div>
      <label className="fx-check">
        <input type="checkbox" checked={!!duck.enabled} onChange={toggle} />
        <span>{i18nT("audiofx.duckingEnable")} {duck.enabled ? i18nT("audiofx.duckingOn") : ""}</span>
      </label>
      {duck.enabled && (
        <div className="fx-sub">
          {audioTracks.length === 0 ? (
            <div className="fx-warn">{i18nT("audiofx.duckingNoTrack")}</div>
          ) : (
            <label className="fx-field">
              <span>{i18nT("audiofx.duckingVoiceTrack")}</span>
              <select
                value={duck.voiceTrackId ?? ""}
                onChange={(e) => setDuck({ voiceTrackId: e.target.value })}
              >
                {audioTracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.label ?? t.id}</option>
                ))}
              </select>
            </label>
          )}
          <FxSlider
            label={i18nT("audiofx.threshold")}
            value={duck.thresholdDb ?? -20}
            min={-60}
            max={0}
            step={1}
            unit=" dB"
            onChange={(v) => setDuck({ thresholdDb: v })}
          />
          <FxSlider
            label={i18nT("audiofx.ratio")}
            value={duck.ratio ?? 4}
            min={1}
            max={20}
            step={0.5}
            unit=":1"
            onChange={(v) => setDuck({ ratio: v })}
          />
          <FxSlider
            label={i18nT("audiofx.duckingAttack")}
            value={duck.attackMs ?? 20}
            min={1}
            max={2000}
            step={5}
            unit=" ms"
            onChange={(v) => setDuck({ attackMs: v })}
          />
          <FxSlider
            label={i18nT("audiofx.duckingRelease")}
            value={duck.releaseMs ?? 250}
            min={10}
            max={9000}
            step={50}
            unit=" ms"
            onChange={(v) => setDuck({ releaseMs: v })}
          />
          <FxSlider
            label={i18nT("audiofx.duckingAmount")}
            value={duck.duckAmountDb ?? 12}
            min={0}
            max={24}
            step={0.5}
            unit=" dB"
            onChange={(v) => setDuck({ duckAmountDb: v })}
          />
          <div style={{ fontSize: 12, opacity: 0.8 }}>{i18nT("audiofx.duckingNote")}</div>
        </div>
      )}
      {warn && <div className="fx-warn">{warn}</div>}
    </>
  );
}

export function AudioFxPanel() {
  useLang();
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
      <DuckingSection />
      <div className="panel-head" style={{ marginTop: 12 }}>{i18nT("audiofx.duckingClipHead")}</div>
      <FxSlider
        label={i18nT("audiofx.bass")}
        value={fx.bass ?? 0}
        min={-12}
        max={12}
        step={0.5}
        unit=" dB"
        onChange={(v) => set({ bass: v })}
      />
      <FxSlider
        label={i18nT("audiofx.treble")}
        value={fx.treble ?? 0}
        min={-12}
        max={12}
        step={0.5}
        unit=" dB"
        onChange={(v) => set({ treble: v })}
      />
      <FxSlider
        label={i18nT("audiofx.denoise")}
        value={Math.round((fx.noiseReduction ?? 0) * 100)}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => set({ noiseReduction: v / 100 })}
      />
      <FxSlider
        label={i18nT("audiofx.reverb")}
        value={Math.round((fx.reverb ?? 0) * 100)}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => set({ reverb: v / 100 })}
      />
      <label className="fx-check">
        <input type="checkbox" checked={!!comp} onChange={toggleComp} />
        <span>{i18nT("audiofx.compLabel")} {comp ? i18nT("audiofx.compOn") : ""}</span>
      </label>
      {comp && (
        <div className="fx-sub">
          <FxSlider
            label={i18nT("audiofx.threshold")}
            value={comp.thresholdDb ?? -20}
            min={-60}
            max={0}
            step={1}
            unit=" dB"
            onChange={(v) => setComp({ thresholdDb: v })}
          />
          <FxSlider
            label={i18nT("audiofx.ratio")}
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
      <div className="panel-head" style={{ marginTop: 12 }}>{i18nT("audiofx.voiceHead")}</div>
      <FxSlider
        label={i18nT("audiofx.pitch")}
        value={voice.pitch ?? 0}
        min={-12}
        max={12}
        step={1}
        unit=" semitone"
        onChange={(v) => setVoice({ pitch: v })}
      />
      <label className="fx-check">
        <input type="checkbox" checked={!!voice.robot} onChange={() => toggleVoiceFlag("robot")} />
        <span>{i18nT("audiofx.robot")}</span>
      </label>
      {voice.robot && typeof voice.robot === "object" && (
        <div className="fx-sub">
          <FxSlider
            label={i18nT("audiofx.robotRate")}
            value={voice.robot.rate ?? 25}
            min={5}
            max={60}
            step={1}
            unit=" Hz"
            onChange={(v) => setVoice({ robot: { rate: v, depth: (typeof voice.robot === "object" ? voice.robot.depth : undefined) ?? 0.6 } })}
          />
          <FxSlider
            label={i18nT("audiofx.robotDepth")}
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
        <span>{i18nT("audiofx.telephone")}</span>
      </label>
      <label className="fx-check">
        <input type="checkbox" checked={!!voice.echo} onChange={() => toggleVoiceFlag("echo")} />
        <span>{i18nT("audiofx.echo")}</span>
      </label>
      {voice.echo && typeof voice.echo === "object" && (
        <div className="fx-sub">
          <FxSlider
            label={i18nT("audiofx.echoDelay")}
            value={voice.echo.delayMs ?? 200}
            min={50}
            max={1000}
            step={10}
            unit=" ms"
            onChange={(v) => setVoice({ echo: { delayMs: v, decay: (typeof voice.echo === "object" ? voice.echo.decay : undefined) ?? 0.5 } })}
          />
          <FxSlider
            label={i18nT("audiofx.echoDecay")}
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
          {i18nT("audiofx.reset")}
        </button>
      )}
    </div>
  );
}
