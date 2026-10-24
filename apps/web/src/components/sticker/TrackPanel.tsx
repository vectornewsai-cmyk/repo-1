/**
 * TrackPanel — Gắn quỹ đạo motion tracking vào sticker đang chọn (Phase 8 Q5).
 *
 * Luồng: chạy `server/tracking/track.py` ngoài editor (xem Q5_LIMITS.md) để
 * tạo trajectory JSON, rồi nạp file JSON đó vào đây. Panel validate bằng
 * validateTrackAttachment của video-spec rồi gắn vào clip.track qua
 * store.patchClip (1 bước undo). Preview + render dùng cùng quỹ đạo:
 * preview nội suy tại thời gian playhead, render build biểu thức overlay.
 *
 * Giới hạn thật (không giấu): quỹ đạo chỉ bám vật thể có vân/khác biệt rõ;
 * vật phẳng/không vân, bị che khuất sẽ mất track — xem Q5_LIMITS.md.
 */
import { useRef, useState } from "react";
import { useStore } from "../../store";
import {
  validateTrackAttachment,
  type TrackAttachment,
} from "../../../../../packages/video-spec/src/tracking";

export function TrackPanel() {
  const selection = useStore((s) => s.selection);
  const spec = useStore((s) => s.spec);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const primary = selection[0] ?? null;
  const track = primary
    ? spec.tracks.find((t) => t.id === primary.trackId)
    : undefined;
  const rawClip = track?.clips.find((c) => c.id === primary?.clipId);
  const stickerClip =
    rawClip && rawClip.kind === "sticker"
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
        setErr(`Quỹ đạo không hợp lệ: ${errs[0]}`);
        return;
      }
      useStore.getState().patchClip(track.id, primary.clipId, {
        track: candidate,
      } as never);
    } catch (e) {
      setErr(`Không đọc được file quỹ đạo: ${(e as Error).message}`);
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
            Đã gắn quỹ đạo: {attached.points.length} điểm
            {attached.lost
              ? " — ⚠️ track bị mất giữa chừng, sticker đứng yên từ điểm cuối."
              : "."}{" "}
            Sticker sẽ bám theo vật thể trong preview và render thật.
          </p>
          <div className="field-row">
            <button onClick={() => fileRef.current?.click()}>Nạp quỹ đạo khác</button>
            <button onClick={clear}>Gỡ quỹ đạo</button>
          </div>
        </>
      ) : (
        <>
          <p className="tips">
            Chạy <code>server/tracking/track.py</code> trên video gốc để tạo
            trajectory JSON, rồi nạp file đó vào đây để sticker bám theo vật thể.
          </p>
          <button onClick={() => fileRef.current?.click()}>Nạp trajectory JSON…</button>
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
