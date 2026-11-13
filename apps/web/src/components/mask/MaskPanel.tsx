/**
 * MaskPanel — panel mask cho clip video/image (Phase 7 P4).
 *
 * Mask che phần clip nằm NGOÀI hình (rect/ellipse + feather làm mờ viền).
 * Tọa độ tương đối theo KHUNG HÌNH OUTPUT (x/y = tâm, w/h = kích thước,
 * 0..1 → hiển thị 0..100%), giống ngữ nghĩa trong mask.ts.
 *
 * Lưu ý trung thực: preview canvas CHƯA hiển thị mask (xem MASK_LIMITS.md).
 * Ô minh hoạ bên dưới chỉ là sơ đồ vị trí/hình dạng, không phải preview
 * thật — mask chỉ có tác dụng khi render FFmpeg.
 */
import { useStore } from "../../store";
import { clamp } from "../../lib";
import {
  MASK_DEFAULTS,
  interpolateMaskAt,
  type ClipMask,
  type MaskKeyframe,
  type MaskShape,
} from "@repo-1/video-spec";
import "./mask.css";
import { t as i18nT, useLang } from "../../i18n";

function PctField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}: {Math.round(value * 100)}%
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </label>
  );
}

/**
 * Phase 9 đợt 87 O5 — trạng thái mask bám track (pure, test được không cần
 * store; render SSR của zustand luôn thấy state khởi tạo nên nhánh phụ thuộc
 * selection/spec chỉ đo được bằng probe này — mẫu L1 đợt 55):
 *  - "follow": clip video có mask + track, không transition → mask bám track.
 *  - "attach": clip video có mask, chưa track → lối vào gắn track.
 *  - "transition": clip video có mask + track + transition → track bị bỏ qua
 *    ở unit đã merge (validator cảnh báo, xem D3_LIMITS.md).
 *  - "none": còn lại (clip ảnh không gắn được track; chưa có mask thì không
 *    có khối track).
 */
export type MaskTrackUiState = "follow" | "attach" | "transition" | "none";
export function maskTrackUiState(clip: {
  kind: string;
  mask?: unknown;
  track?: unknown;
  transitionIn?: unknown;
  transitionOut?: unknown;
}): MaskTrackUiState {
  if (clip.kind !== "video" || clip.mask === undefined) return "none";
  if (clip.track === undefined) return "attach";
  if (clip.transitionIn !== undefined || clip.transitionOut !== undefined) return "transition";
  return "follow";
}

export function MaskPanel() {
  useLang();
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const playhead = useStore((s) => s.playhead);
  const st = useStore.getState();

  const primary = selection[0] ?? null;
  if (!primary) {
    return (
      <div className="mask-panel">
        <p className="tips">{i18nT("mask.tipSelect")}</p>
      </div>
    );
  }
  const track = spec.tracks.find((t) => t.id === primary.trackId);
  const clip = track?.clips.find((c) => c.id === primary.clipId);
  if (!track || !clip) {
    return (
      <div className="mask-panel">
        <p className="tips">{i18nT("mask.tipGone")}</p>
      </div>
    );
  }
  if (clip.kind !== "video" && clip.kind !== "image") {
    return (
      <div className="mask-panel">
        <p className="tips">
          {i18nT("mask.tipUnsupported", { kind: clip.kind === "text" ? i18nT("mask.kindText") : clip.kind === "audio" ? i18nT("mask.kindAudio") : i18nT("mask.kindSticker") })}
        </p>
      </div>
    );
  }

  const mask = (clip as { mask?: ClipMask }).mask;
  const patchMask = (next: ClipMask | undefined) => {
    st.patchClip(track.id, clip.id, { mask: next } as Partial<typeof clip>);
  };
  const update = (patch: Partial<ClipMask>) => {
    if (!mask) return;
    patchMask({ ...mask, ...patch });
  };

  // Phase 9 đợt 87 O5: mask bám motion track — tâm mask bám quỹ đạo
  // clip.track (thiết kế đợt 87). Trạng thái tính bằng maskTrackUiState
  // (pure, có test probe riêng): chỉ clip video mới gắn được track
  // (TrackPanel chỉ render cho video/text/sticker; validator bỏ qua track
  // trên clip ảnh) nên khối này chỉ hiện cho video.
  const trackUi = maskTrackUiState(clip as { kind: string; mask?: unknown; track?: unknown; transitionIn?: unknown; transitionOut?: unknown });
  const detachTrack = () => {
    // "Tắt" mask bám track = gỡ quỹ đạo khỏi clip (cùng cơ chế với nút
    // "Gỡ quỹ đạo" của TrackPanel) — không có toggle riêng cho mask vì
    // track gắn ở clip, không gắn ở mask (thiết kế đợt 87).
    st.patchClip(track.id, clip.id, { track: undefined } as Partial<typeof clip>);
  };
  const scrollToTrackPanel = () => {
    // TrackPanel đã render sẵn trong Inspector (bên dưới panel mask cho
    // clip video) — chỉ cuộn tới đó, không viết lại flow gắn track.
    document.querySelector(".track-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  if (!mask) {
    return (
      <div className="mask-panel">
        <p className="tips">
          {i18nT("mask.intro")}
        </p>
        <div className="btn-row">
          <button
            className="primary"
            onClick={() =>
              patchMask({
                shape: MASK_DEFAULTS.shape as MaskShape,
                x: MASK_DEFAULTS.x,
                y: MASK_DEFAULTS.y,
                w: MASK_DEFAULTS.w,
                h: MASK_DEFAULTS.h,
                feather: MASK_DEFAULTS.feather,
              })
            }
          >
            {i18nT("mask.enable")}
          </button>
        </div>
      </div>
    );
  }

  // Minh hoạ sơ đồ: khung 16:9, hình mask đặt theo x/y/w/h (tâm → góc).
  const left = (mask.x - mask.w / 2) * 100;
  const top = (mask.y - mask.h / 2) * 100;
  const blur = mask.feather * 8;

  return (
    <div className="mask-panel">
      {/* Phase 9 đợt 87 O5: trạng thái mask bám track (maskTrackUiState).
          Clip video có transition thì track bị bỏ qua ở unit đã merge
          (validator cảnh báo, xem D3_LIMITS.md) nhưng MASK VẪN bám theo
          track (closing đợt 87: O6 C6 + parent verify png+transition) nên
          hiện ghi chú đúng thay vì "mask không bám". */}
      {trackUi !== "none" && (
        <>
          {trackUi === "transition" ? (
            <p className="tips">
              {i18nT("motionTrack.transitionIgnored")} {i18nT("motionTrack.maskStillFollows")}
            </p>
          ) : trackUi === "follow" ? (
            <>
              <p className="tips">{i18nT("mask.trackFollow")}</p>
              <div className="btn-row">
                <button onClick={detachTrack}>{i18nT("mask.trackDetach")}</button>
              </div>
            </>
          ) : (
            <>
              <p className="tips">{i18nT("mask.trackAttachHint")}</p>
              <div className="btn-row">
                <button onClick={scrollToTrackPanel}>{i18nT("mask.trackAttachBtn")}</button>
              </div>
            </>
          )}
        </>
      )}
      <label className="field">
        <span>{i18nT("mask.shape")}</span>
        <select
          value={mask.shape}
          onChange={(e) => update({ shape: e.target.value as MaskShape })}
        >
          <option value="rect">{i18nT("mask.shapeRect")}</option>
          <option value="ellipse">{i18nT("mask.shapeEllipse")}</option>
        </select>
      </label>
      <div className="field-row">
        <PctField label={i18nT("mask.cx")} value={mask.x} onChange={(v) => update({ x: clamp(v, -0.5, 1.5) })} />
        <PctField label={i18nT("mask.cy")} value={mask.y} onChange={(v) => update({ y: clamp(v, -0.5, 1.5) })} />
      </div>
      <div className="field-row">
        <PctField label={i18nT("mask.w")} value={mask.w} onChange={(v) => update({ w: clamp(v, 0.05, 2) })} />
        <PctField label={i18nT("mask.h")} value={mask.h} onChange={(v) => update({ h: clamp(v, 0.05, 2) })} />
      </div>
      <PctField label={i18nT("mask.feather")} value={mask.feather} onChange={(v) => update({ feather: clamp(v, 0, 1) })} />
      <label className="field mask-check">
        <input
          type="checkbox"
          checked={!!mask.invert}
          onChange={(e) => update({ invert: e.target.checked })}
        />
        <span>{i18nT("mask.invert")}</span>
      </label>

      <div className="mask-preview" title={i18nT("mask.previewTitle")}>
        <div
          className="mask-preview-shape"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${mask.w * 100}%`,
            height: `${mask.h * 100}%`,
            borderRadius: mask.shape === "ellipse" ? "50%" : "0",
            filter: blur > 0 ? `blur(${blur.toFixed(1)}px)` : undefined,
            opacity: mask.invert ? 0.25 : 1,
          }}
        />
        <span className="mask-preview-note">{i18nT("mask.previewNote")}</span>
      </div>

      {/* Phase 9 D4: keyframes hình học — x/y/w/h theo thời gian, nội suy
          tuyến tính; feather/invert giữ tĩnh. Thời gian t tương đối từ lúc
          clip bắt đầu (giây), khớp render + preview. */}
      <div className="field">
        <span>{i18nT("mask.kfTitle")}</span>
        {(() => {
          const kfs = mask.keyframes ?? [];
          const setKfs = (next: MaskKeyframe[]) => {
            const sorted = [...next].sort((a, b) => a.t - b.t);
            if (sorted.length === 0) {
              const { keyframes: _dropped, ...rest } = mask;
              patchMask(rest);
            } else {
              patchMask({ ...mask, keyframes: sorted });
            }
          };
          const addKf = () => {
            const tR = Math.round(clamp(playhead - clip.start, 0, clip.duration) * 100) / 100;
            const g = interpolateMaskAt(mask, tR);
            setKfs([...kfs.filter((k) => k.t !== tR), { t: tR, ...g }]);
          };
          const num = (v: number, min: number, max: number) => clamp(Math.round(v), min, max) / 100;
          return (
            <>
              {kfs.length === 0 && <p className="tips">{i18nT("mask.kfEmpty")}</p>}
              {kfs.map((kf, i) => (
                <div className="field-row" key={i}>
                  <label className="field">
                    <span>{i18nT("mask.kfTime")}</span>
                    <input
                      type="number" min={0} step={0.1} style={{ width: 64 }}
                      value={kf.t}
                      onChange={(e) => {
                        const t = Math.max(0, Number(e.target.value) || 0);
                        const next = kfs.map((k, j) => (j === i ? { ...k, t } : k));
                        // Trùng t thì giữ lại bản mới sửa (normalize dedupe sau thắng).
                        setKfs(next.filter((k, j) => k.t !== t || j === i));
                      }}
                    />
                  </label>
                  {([
                    ["x", -50, 150],
                    ["y", -50, 150],
                    ["w", 5, 200],
                    ["h", 5, 200],
                  ] as const).map(([key, min, max]) => (
                    <label className="field" key={key}>
                      <span>{key} %</span>
                      <input
                        type="number" min={min} max={max} step={1} style={{ width: 56 }}
                        value={Math.round(kf[key] * 100)}
                        onChange={(e) => {
                          const v = num(Number(e.target.value) || 0, min, max);
                          setKfs(kfs.map((k, j) => (j === i ? { ...k, [key]: v } : k)));
                        }}
                      />
                    </label>
                  ))}
                  <button onClick={() => setKfs(kfs.filter((_, j) => j !== i))}>
                    {i18nT("mask.kfDel")}
                  </button>
                </div>
              ))}
              <div className="btn-row">
                <button className="primary" onClick={addKf}>
                  {i18nT("mask.kfAdd")}
                </button>
                {kfs.length > 0 && (
                  <button onClick={() => setKfs([])}>{i18nT("mask.kfClear")}</button>
                )}
              </div>
            </>
          );
        })()}
      </div>

      <div className="btn-row">
        <button onClick={() => patchMask(undefined)}>{i18nT("mask.disable")}</button>
      </div>
    </div>
  );
}
