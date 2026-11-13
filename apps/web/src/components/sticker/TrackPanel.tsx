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
 * (xem D3_LIMITS.md); mask bám track là việc đợt 87 (gợi ý ở MaskPanel).
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

// Phase 9 đợt 87 O5: animation ASS-parity — KHỚP
// server/render/src/textAnimParity.js (PARITY_ANIMATIONS). Text vẽ bằng ASS
// thì track bị bỏ qua (validator cảnh báo, xem D3_LIMITS.md).
const PARITY_ANIMATIONS = ["tiltIn", "skewIn", "slideReveal", "curtainIn"];

/**
 * Phase 9 đợt 87 O5 — track có bị render bỏ qua không (pure, test được
 * không cần store; render SSR của zustand luôn thấy state khởi tạo nên
 * nhánh phụ thuộc selection/spec chỉ đo được bằng probe này — mẫu L1 đợt 55).
 * Khớp validator (server/render/src/validate.js): text vẽ bằng ASS
 * (typewriter / karaoke / animation parity) thì track bị bỏ qua; video dính
 * transition thì track bị bỏ qua ở unit đã merge. Trả về null = track có
 * tác dụng. Lưu ý: helper chỉ trả lời "track CÓ bị bỏ qua không", component
 * mới quyết định có hiện cảnh báo (chỉ khi track ĐÃ gắn).
 * Karaoke thắng typewriter/parity (cùng thứ tự thắng như render — karaoke
 * đi nhánh ASS riêng, tránh vẽ 1 clip bằng 2 lớp ASS chồng nhau).
 */
export type TrackIgnoredReason =
  | { kind: "ass"; reason: string }
  | { kind: "transition" };
export function trackIgnoredReason(clip: {
  kind: string;
  style?: { animation?: string };
  karaoke?: unknown[];
  transitionIn?: unknown;
  transitionOut?: unknown;
}): TrackIgnoredReason | null {
  if (clip.kind === "text") {
    if (Array.isArray(clip.karaoke) && clip.karaoke.length > 0)
      return { kind: "ass", reason: "karaoke" };
    const anim = clip.style?.animation;
    if (anim === "typewriter") return { kind: "ass", reason: "typewriter" };
    if (anim !== undefined && PARITY_ANIMATIONS.includes(anim))
      return { kind: "ass", reason: anim };
    return null;
  }
  if (
    clip.kind === "video" &&
    (clip.transitionIn !== undefined || clip.transitionOut !== undefined)
  ) {
    return { kind: "transition" };
  }
  return null;
}

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
  if (!primary || !track || !rawClip) return null;
  // Phase 9 D3: text và video cũng gắn được quỹ đạo (cùng field clip.track).
  const stickerClip =
    rawClip.kind === "sticker" || rawClip.kind === "text" || rawClip.kind === "video"
      ? (rawClip as { track?: TrackAttachment })
      : null;
  if (!stickerClip) return null;

  const attached = stickerClip.track ?? null;

  // Phase 9 đợt 87 O5: cảnh báo đúng như validator (trackIgnoredReason,
  // pure, có test probe riêng): text vẽ bằng ASS thì track bị bỏ qua ở
  // render; video dính transition thì track bị bỏ qua ở unit đã merge.
  // Khi đó KHÔNG hiện gợi ý "clip bám theo vật thể" sai. Chỉ cảnh báo khi
  // track ĐÃ gắn (chưa gắn thì không có gì bị bỏ qua).
  const ignored = attached !== null ? trackIgnoredReason(rawClip) : null;
  const trackIgnored = ignored !== null;
  const assReason = ignored !== null && ignored.kind === "ass" ? ignored.reason : null;
  const hasMask = (rawClip as { mask?: unknown }).mask !== undefined;

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
      <div className="panel-head" style={{ marginTop: 12 }}>{t("motionTrack.title")}</div>
      {attached ? (
        <>
          <p className="tips">
            {t("motionTrack.attached", { n: String(attached.points.length) })}
            {attached.lost ? t("motionTrack.lost") : "."}
            {!trackIgnored && (
              <>
                {" "}
                {t("motionTrack.followNote")}
              </>
            )}
          </p>
          {trackIgnored && (
            <p className="error">
              {assReason !== null
                ? t("motionTrack.assIgnored", { reason: assReason })
                : t("motionTrack.transitionIgnored")}
              {/* Đợt 87 closing (O6 C6 + parent verify png+transition): ở nhánh
                  transition, mask VẪN bám track (mask chain áp theo unit,
                  trước xfade) — chỉ phần dịch chuyển của unit bị bỏ qua.
                  Chỉ nhánh ASS (text) thì mask thật sự không bám (text không
                  hỗ trợ mask), mới hiện maskNotFollowing. */}
              {hasMask
                ? ` ${assReason !== null ? t("motionTrack.maskNotFollowing") : t("motionTrack.maskStillFollows")}`
                : ""}
            </p>
          )}
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
