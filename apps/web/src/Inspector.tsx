/**
 * Panel thuộc tính bên phải:
 * - chọn clip chữ -> sửa nội dung, cỡ, màu, vị trí, hiệu ứng
 * - chọn clip video/audio -> opacity/volume/fade/transition, thời gian
 * - không chọn gì -> thông tin dự án + phím tắt
 */
import { useState, type ReactNode } from "react";
import { useStore } from "./store";
import { t, useLang } from "./i18n";
import { fmtTime } from "./lib";
import { TransitionPanel } from "./components/transitions";
import { SpeedPanel } from "./components/speed";
import { KeyframePanel } from "./components/keyframes";
import { ChromaPanel } from "./components/chroma";
import { BgRemovePanel } from "./components/BgRemovePanel";
import { TextAnimPicker } from "./components/textfx";
import { TtsButton } from "./components/TtsButton";
import { LutPicker, ColorAdjustPanel } from "./components/lut";
import { EffectPanel } from "./components/effects";
import { StickerPanel } from "./components/sticker";
import { AudioFxPanel } from "./components/audiofx";
import { SceneModal } from "./components/SceneModal";
import { BeatSyncModal } from "./components/BeatSyncModal";
import { TrackPanel } from "./components/sticker/TrackPanel";
import { MaskPanel } from "./components/mask";
import { EnhancePanel } from "./components/enhance";
import { MotionPanel } from "./components/motion";
import { FontPicker } from "./components/FontPicker";

function NumField({
  label,
  value,
  step = 0.1,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        value={Number(value.toFixed(2))}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
}

/**
 * K5: nhóm điều khiển thành section gập/mở được — panel clip video trước
 * đây là một cuộn dài 10+ nhóm khó quét mắt. Mặc định mở hết (không giấu
 * tính năng), user gập nhóm ít dùng để tập trung.
 */
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ins-section">
      <button
        type="button"
        className="section-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">{open ? "▾" : "▸"}</span> {title}
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

function ProjectInfo() {
  useLang();
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();
  const clips = spec.tracks.reduce((n, t) => n + t.clips.length, 0);
  return (
    <div className="inspector" data-tour="inspector">
      <div className="panel-head">{t("inspector.projectTitle")}</div>
      <div className="info-rows">
        <div><span>{t("inspector.size")}</span><b>{spec.meta.width} × {spec.meta.height}</b></div>
        <div><span>FPS</span><b>{spec.meta.fps}</b></div>
        <div><span>{t("inspector.duration")}</span><b>{fmtTime(st.duration())}</b></div>
        <div><span>{t("inspector.track")}</span><b>{spec.tracks.length}</b></div>
        <div><span>{t("inspector.clip")}</span><b>{clips}</b></div>
      </div>
      <div className="panel-head" style={{ marginTop: 16 }}>{t("inspector.shortcutsTitle")}</div>
      <ul className="shortcuts">
        <li><kbd>Space</kbd> / <kbd>K</kbd> {t("inspector.scPlayPause")}</li>
        <li><kbd>S</kbd> {t("inspector.scSplit")}</li>
        <li><kbd>Delete</kbd> {t("inspector.scDelete")}</li>
        <li><kbd>J</kbd> / <kbd>L</kbd> {t("inspector.scShuttle")}</li>
        <li><kbd>←</kbd> / <kbd>→</kbd> {t("inspector.scFrame")}</li>
        <li><kbd>Home</kbd> / <kbd>End</kbd> {t("inspector.scHomeEnd")}</li>
        <li><kbd>F</kbd> {t("inspector.scFullscreen")}</li>
        <li><kbd>Shift</kbd>+click {t("inspector.scShiftClick")}</li>
        <li><kbd>Ctrl</kbd>+click {t("inspector.scCtrlClick")}</li>
        <li>{t("inspector.scBoxSelect")}</li>
        <li><kbd>Ctrl</kbd>+<kbd>A</kbd> {t("inspector.scSelectAll")}</li>
        <li>{t("inspector.scTrim")}</li>
        <li>{t("inspector.scDragText")}</li>
      </ul>
      <div className="panel-head" style={{ marginTop: 16 }}>{t("inspector.stickerHead")}</div>
      <StickerPanel />
      <p className="tips">
        {t("inspector.selectTip")}
      </p>
    </div>
  );
}

/** Panel khi chọn nhiều clip (R1-052): đếm theo loại + thao tác hàng loạt. */
function MultiSelectInfo() {
  useLang();
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const undoDepth = useStore((s) => s.undoDepth);
  const undoLabel = useStore((s) => s.undoLabel);
  const st = useStore.getState();

  const kindCount = new Map<string, number>();
  for (const s of selection) {
    const track = spec.tracks.find((t) => t.id === s.trackId);
    const clip = track?.clips.find((c) => c.id === s.clipId);
    if (clip) kindCount.set(clip.kind, (kindCount.get(clip.kind) ?? 0) + 1);
  }
  const kindLabel: Record<string, string> = {
    video: t("inspector.kindVideo"), audio: t("inspector.kindAudio"), text: t("inspector.kindText"),
    sticker: t("inspector.kindSticker"), image: t("inspector.kindImage"),
  };

  return (
    <div className="inspector" data-tour="inspector">
      <div className="panel-head">{t("inspector.selectedHead", { n: String(selection.length) })}</div>
      <div className="info-rows">
        {[...kindCount.entries()].map(([k, n]) => (
          <div key={k}><span>{kindLabel[k] ?? k}</span><b>{n}</b></div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <button onClick={() => st.deleteSelection()} title={t("inspector.deleteAllTitle")}>
          {t("inspector.deleteN", { n: String(selection.length) })}
        </button>
        {undoDepth > 0 && (
          <button
            onClick={() => st.undo()}
            title={undoLabel ? t("inspector.undoTitleWith", { label: undoLabel }) : t("inspector.undoTitle")}
          >
            {undoLabel ? t("inspector.undoBtnWith", { label: undoLabel }) : t("inspector.undoBtn")}
          </button>
        )}
        <button onClick={() => st.clearSelection()}>
          {t("inspector.deselect")}
        </button>
      </div>
      <p className="tips">
        {t("inspector.multiTip1")}
        {t("inspector.multiTip2")}
      </p>
    </div>
  );
}

export function Inspector() {
  useLang();
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const st = useStore.getState();
  const [sceneOpen, setSceneOpen] = useState(false);
  const [beatOpen, setBeatOpen] = useState(false);

  if (selection.length === 0) return <ProjectInfo />;
  if (selection.length > 1) return <MultiSelectInfo />;

  const primary = selection[0];
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip) return <ProjectInfo />;

  const patch = (p: Parameters<typeof st.patchClip>[2]) =>
    st.patchClip(track.id, clip.id, p);

  return (
    <div className="inspector" data-tour="inspector">
      <div className="panel-head">
{clip.kind === "text" ? t("inspector.kindText") : clip.kind === "video" ? t("inspector.kindVideo") : clip.kind === "sticker" ? t("inspector.kindSticker") : clip.kind === "image" ? t("inspector.kindImage") : t("inspector.kindAudio")}
      </div>

      {clip.kind === "text" && (
        <>
          <label className="field">
            <span>{t("inspector.content")}</span>
            <textarea
              rows={2}
              value={clip.text}
              onChange={(e) => patch({ text: e.target.value })}
            />
          </label>
          <FontPicker
            value={clip.style.fontFamily}
            onChange={(family) => st.patchTextStyle(track.id, clip.id, { fontFamily: family })}
          />
          <label className="field">
            <span>{t("inspector.fontSize", { n: String(clip.style.fontSize) })}</span>
            <input
              type="range" min={16} max={160}
              value={clip.style.fontSize}
              onChange={(e) => st.patchTextStyle(track.id, clip.id, { fontSize: Number(e.target.value) })}
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>{t("inspector.textColor")}</span>
              <input
                type="color"
                value={clip.style.color}
                onChange={(e) => st.patchTextStyle(track.id, clip.id, { color: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{t("inspector.bgColor")}</span>
              <input
                type="color"
                value={clip.style.backgroundColor ?? "#000000"}
                onChange={(e) => st.patchTextStyle(track.id, clip.id, { backgroundColor: e.target.value })}
              />
            </label>
          </div>
          <div className="btn-row">
            <button
              className={clip.style.bold ? "toggle on" : "toggle"}
              onClick={() => st.patchTextStyle(track.id, clip.id, { bold: !clip.style.bold })}
              title={t("inspector.bold")}
            ><b>B</b></button>
            <button
              className={clip.style.italic ? "toggle on" : "toggle"}
              onClick={() => st.patchTextStyle(track.id, clip.id, { italic: !clip.style.italic })}
              title={t("inspector.italic")}
            ><i>I</i></button>
            <button
              className="toggle"
              title={clip.style.backgroundColor ? t("inspector.bgOn") : t("inspector.bgOff")}
              onClick={() =>
                st.patchTextStyle(track.id, clip.id, {
                  backgroundColor: clip.style.backgroundColor ? undefined : "#000000aa",
                })
              }
            >
              {clip.style.backgroundColor ? t("inspector.bgHas") : t("inspector.bgNone")}
            </button>
          </div>
          <label className="field">
            <span>{t("inspector.anim")}</span>
            <TextAnimPicker
              value={clip.style.animation ?? "none"}
              onChange={(anim) => st.patchTextStyle(track.id, clip.id, { animation: anim as never })}
            />
          </label>
          <label className="field">
            <span>{t("inspector.posX", { n: String(Math.round((clip.style.x ?? 0.5) * 100)) })}</span>
            <input
              type="range" min={0} max={100}
              value={Math.round((clip.style.x ?? 0.5) * 100)}
              onChange={(e) => st.patchTextStyle(track.id, clip.id, { x: Number(e.target.value) / 100 })}
            />
          </label>
          <label className="field">
            <span>{t("inspector.posY", { n: String(Math.round((clip.style.y ?? 0.5) * 100)) })}</span>
            <input
              type="range" min={0} max={100}
              value={Math.round((clip.style.y ?? 0.5) * 100)}
              onChange={(e) => st.patchTextStyle(track.id, clip.id, { y: Number(e.target.value) / 100 })}
            />
          </label>
          <p className="tips">{t("inspector.textTip")}</p>
          <TtsButton text={clip.text} />
          <Section title={t("inspector.secKeyframe")}>
            <KeyframePanel />
          </Section>
        </>
      )}

      {clip.kind === "video" && (
        <>
          <label className="field">
            <span>{t("inspector.opacity", { n: String(Math.round((clip.opacity ?? 1) * 100)) })}</span>
            <input
              type="range" min={5} max={100}
              value={Math.round((clip.opacity ?? 1) * 100)}
              onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
            />
          </label>
          <label className="field">
            <span>{t("inspector.sourceAudio")}</span>
            <select
              value={clip.sourceAudioMode ?? "inherit"}
              onChange={(e) => patch({ sourceAudioMode: e.target.value as "inherit" | "mute" })}
            >
              <option value="inherit">{t("inspector.keepAudio")}</option>
              <option value="mute">{t("inspector.muteAudio")}</option>
            </select>
          </label>
          <Section title={t("inspector.secTransition")}>
            <TransitionPanel
              value={clip.transitionOut?.type ?? "none"}
              duration={clip.transitionOut?.duration ?? 0.5}
              onChange={(type, duration) =>
                patch({ transitionOut: { type: type as never, duration } })
              }
            />
          </Section>
          <Section title={t("inspector.secSpeed")}>
            <SpeedPanel />
          </Section>
          <Section title={t("inspector.secAudioFxOrig")}>
            <AudioFxPanel />
          </Section>
          <Section title={t("inspector.secChroma")}>
            <ChromaPanel />
          </Section>
          <Section title={t("inspector.secBgRemove")}>
            <BgRemovePanel
              mediaItem={st.media.find((m) => m.name === clip.src)}
            />
          </Section>
          <Section title={t("inspector.secLut")}>
            <LutPicker
              value={clip.filter?.lut}
              onChange={(lut) => {
                const next = { ...(clip.filter ?? {}) };
                if (lut) next.lut = lut;
                else delete next.lut;
                patch({ filter: Object.keys(next).length > 0 ? next : undefined });
              }}
            />
          </Section>
          <Section title={t("inspector.secColor")}>
            <ColorAdjustPanel
              value={clip.filter?.color}
              onChange={(color) => {
                const next = { ...(clip.filter ?? {}) };
                if (color) next.color = color;
                else delete next.color;
                patch({ filter: Object.keys(next).length > 0 ? next : undefined });
              }}
            />
          </Section>
          <Section title={t("inspector.secEffect")}>
            <EffectPanel />
          </Section>
          <Section title={t("inspector.secKeyframe")}>
            <KeyframePanel />
          </Section>
          {/* Phase 7 P4: mask cho clip video */}
          <Section title={t("inspector.secMask")}>
            <MaskPanel />
          </Section>
          {/* Phase 9 R2: enhance cho clip video */}
          <Section title={t("inspector.secEnhance")}>
            <EnhancePanel />
          </Section>
          {/* Phase 9 đợt 8 S5: slow-mo / nội suy frame / motion blur cho clip video */}
          <Section title={t("inspector.secMotion")}>
            <MotionPanel />
          </Section>
          <Section title={t("inspector.secScene")}>
            <button onClick={() => setSceneOpen(true)}>
              {t("inspector.sceneBtn")}
            </button>
            {sceneOpen && (
              <SceneModal
                trackId={track.id}
                clipId={clip.id}
                onClose={() => setSceneOpen(false)}
              />
            )}
          </Section>
        </>
      )}

      {clip.kind === "audio" && (
        <>
          <label className="field">
            <span>{t("inspector.volume", { n: String(Math.round((clip.volume ?? 1) * 100)) })}</span>
            <input
              type="range" min={0} max={100}
              value={Math.round((clip.volume ?? 1) * 100)}
              onChange={(e) => patch({ volume: Number(e.target.value) / 100 })}
            />
          </label>
          <div className="field-row">
            <NumField label={t("inspector.fadeIn")} value={clip.fadeIn ?? 0} onChange={(v) => patch({ fadeIn: Math.max(0, v) })} />
            <NumField label={t("inspector.fadeOut")} value={clip.fadeOut ?? 0} onChange={(v) => patch({ fadeOut: Math.max(0, v) })} />
          </div>
          {/* Phase 7 P3: đường cong fade (mặc định linear = afade cũ). */}
          <div className="field-row">
            <label className="field">
              <span>{t("inspector.fadeInCurve")}</span>
              <select
                value={clip.fadeInCurve ?? "linear"}
                onChange={(e) => patch({ fadeInCurve: e.target.value as "linear" | "ease-in" | "ease-out" | "sine" })}
              >
                <option value="linear">{t("inspector.curveLinear")}</option>
                <option value="ease-in">{t("inspector.curveEaseIn")}</option>
                <option value="ease-out">{t("inspector.curveEaseOut")}</option>
                <option value="sine">{t("inspector.curveSine")}</option>
              </select>
            </label>
            <label className="field">
              <span>{t("inspector.fadeOutCurve")}</span>
              <select
                value={clip.fadeOutCurve ?? "linear"}
                onChange={(e) => patch({ fadeOutCurve: e.target.value as "linear" | "ease-in" | "ease-out" | "sine" })}
              >
                <option value="linear">{t("inspector.curveLinear")}</option>
                <option value="ease-in">{t("inspector.curveEaseIn")}</option>
                <option value="ease-out">{t("inspector.curveEaseOut")}</option>
                <option value="sine">{t("inspector.curveSine")}</option>
              </select>
            </label>
          </div>
          <Section title={t("inspector.secAudioFx")}>
            <AudioFxPanel />
          </Section>
          {/* Phase 8 Q5: cắt clip nhạc theo beat */}
          <Section title="🎵 Cắt theo beat">
            <button onClick={() => setBeatOpen(true)}>
              Phân tích beat &amp; cắt clip
            </button>
            {beatOpen && (
              <BeatSyncModal
                trackId={track.id}
                clipId={clip.id}
                onClose={() => setBeatOpen(false)}
              />
            )}
          </Section>
          <Section title={t("inspector.secSpeed")}>
            <SpeedPanel />
          </Section>
        </>
      )}

      {clip.kind === "sticker" && (
        <>
          <div className="panel-head" style={{ marginTop: 12 }}>{t("inspector.stickerHead")}</div>
          <StickerPanel />
          {/* Phase 8 Q5: gắn quỹ đạo motion tracking */}
          <TrackPanel />
        </>
      )}

      {/* Phase 9 D3: gắn quỹ đạo motion tracking cho clip text/video
          (cùng TrackPanel; panel tự có tiêu đề riêng nên không cần key i18n mới). */}
      {(clip.kind === "text" || clip.kind === "video") && (
        <TrackPanel />
      )}

      {/* Phase 7 P4: mask cho clip ảnh */}
      {clip.kind === "image" && (
        <Section title={t("inspector.secMask")}>
          <MaskPanel />
        </Section>
      )}

      {/* Phase 7 P3: âm lượng track — nhân vào mọi clip audio trên track
          (và tiếng kế thừa của clip video). 0 = câm track, tối đa 200%. */}
      {(clip.kind === "audio" || clip.kind === "video") && (
        <Section title={t("inspector.secTrackVolume")}>
          <label className="field">
            <span>{t("inspector.trackVolume", { label: track.label ?? track.kind, n: String(Math.round((track.volume ?? 1) * 100)) })}</span>
            <input
              type="range" min={0} max={200}
              value={Math.round((track.volume ?? 1) * 100)}
              onChange={(e) => st.patchTrack(track.id, { volume: Number(e.target.value) / 100 })}
            />
          </label>
          <p className="tips">{t("inspector.trackVolumeTip")}</p>
        </Section>
      )}

      <Section title={t("inspector.secTime")}>
        <div className="field-row">
          <NumField label={t("inspector.start")} value={clip.start} onChange={(v) => patch({ start: Math.max(0, v) })} />
          <NumField label={t("inspector.length")} value={clip.duration} onChange={(v) => patch({ duration: Math.max(0.2, v) })} />
        </div>
        {clip.kind !== "text" && clip.kind !== "sticker" && clip.kind !== "image" && clip.kind !== "nested" && (
          <div className="field-row">
            <NumField label={t("inspector.inPoint")} value={(clip as { in: number }).in} onChange={(v) => patch({ in: Math.max(0, v), out: Math.max(0, v) + clip.duration } as Partial<typeof clip>)} />
            <NumField label={t("inspector.outPoint")} value={(clip as { out: number }).out} onChange={(v) => { const cin = (clip as { in: number }).in; patch({ out: Math.max(cin + 0.2, v), duration: Math.max(0.2, v - cin) } as Partial<typeof clip>); }} />
          </div>
        )}
      </Section>
      <button className="danger-btn" onClick={() => st.deleteSelection()}>
        {t("inspector.deleteClip")}
      </button>
    </div>
  );
}
