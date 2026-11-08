/**
 * TrackPanel — Gắn quỹ đạo motion tracking vào clip đang chọn
 * (Phase 8 Q5: sticker; Phase 9 D3 mở rộng sang text và video).
 *
 * Luồng: chạy `server/tracking/track.py` ngoài editor (xem Q5_LIMITS.md) để
 * tạo trajectory JSON, rồi nạp file JSON đó vào đây. Panel validate bằng
 * validateTrackAttachment của video-spec rồi gắn vào clip.track qua
 * store.patchClip (1 bước undo). Preview + render dùng cùng quỹ đạo:
 * preview nội suy tại thời gian playhead, render build biểu thức overlay.
 * Ngữ nghĩa bám: TÂM clip (sticker/text) hoặc TÂM khung hình (video)
 * bám điểm quỹ đạo theo thời gian cục bộ t - start.
 *
 * Giới hạn thật (không giấu): quỹ đạo chỉ bám vật thể có vân/khác biệt rõ;
 * vật phẳng/không vân, bị che khuất sẽ mất track — xem Q5_LIMITS.md.
 * Text typewriter/karaoke và video dính transition không bám được ở render
 * (xem D3_LIMITS.md); mask bám track vẫn chưa làm (việc của agent khác).
 */
import { useRef, useState } from "react";
import { useStore } from "../../store";
import { t, useLang } from "../../i18n";
// Phase 9 đợt 60 Q2: TrackPanel dùng rule .track-panel / .track-panel .error
// trong sticker.css (chung thư mục sticker).
import "./sticker.css";
import {
  validateTrackAttachment,
  type TrackAttachment,
} from "../../../../../packages/video-spec/src/tracking";

export function TrackPanel() {
  useLang(); // re-render khi đổi ngôn ngữ
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const primary = selection[0] ?? null;
  const track = primary
    ? spec.tracks.find((t) => t.id === primary.trackId)
    : undefined;
  const rawClip = track?.clips.find((c) => c.id === primary?.clipId);
  // Phase 9 D3: text và video cũng gắn được quỹ đạo (cùng field clip.track).
  const stickerClip =
    rawClip && (rawClip.kind === "sticker" || rawClip.kind === "text" || rawClip.kind === "video")
      ? (rawClip as { track?: TrackAttachment })
      : null;
  if (!primary || !track || !stickerClip) return null;

  const attached = stickerClip.track ?? null;

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    try {
      const json = JSON.parse(await f.text());
      // track.py xuất { points, raw_points, lost, ... } — chỉ lấy phần
      // khớp TrackAttachment, phần còn lại (video/fps) chỉ để tham khảo.
      const candidate: TrackAttachment = {
        points: json.points,
        lost: json.lost,
        source: json.source ?? "track.py",
      };
      const errs = validateTrackAttachment(candidate);
      if (errs.length > 0) {
        setErr(t("motionTrack.invalid", { error: errs[0] }));
        return;
      }
      useStore.getState().patchClip(track.id, primary.clipId, {
        track: candidate,
      } as never);
    } catch (e) {
      setErr(t("motionTrack.readFailed", { error: (e as Error).message }));
    }
  };

  const clear = () => {
    setErr(null);
    useStore.getState().patchClip(track.id, primary.clipId, {
      track: undefined,
    } as never);
  };

  return (
    <div className="track-panel">
      <div className="panel-head" style={{ marginTop: 12 }}>🎯 Motion tracking</div>
      {attached ? (
        <>
          <p className="tips">
            {t("motionTrack.attached", { n: String(attached.points.length) })}
            {attached.lost ? t("motionTrack.lost") : "."}{" "}
            {t("motionTrack.followNote")}
          </p>
          <div className="field-row">
            <button onClick={() => fileRef.current?.click()}>{t("motionTrack.loadOther")}</button>
            <button onClick={clear}>{t("motionTrack.detach")}</button>
          </div>
        </>
      ) : (
        <>
          <p className="tips">
            {(() => {
              // Giữ <code> cho đường dẫn script khi dịch: tách chuỗi đã
              // dịch theo đúng literal path (bất biến giữa 2 ngôn ngữ).
              const intro = t("motionTrack.intro", { script: "server/tracking/track.py" });
              const parts = intro.split("server/tracking/track.py");
              return parts.length === 2 ? (
                <>
                  {parts[0]}
                  <code>server/tracking/track.py</code>
                  {parts[1]}
                </>
              ) : (
                intro
              );
            })()}
          </p>
          <button onClick={() => fileRef.current?.click()}>{t("motionTrack.loadJson")}</button>
        </>
      )}
      {err && <p className="error">{err}</p>}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
