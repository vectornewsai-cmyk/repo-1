/**
 * Timeline đa track: ruler + playhead kéo được, clip kéo-thả di chuyển,
 * trim 2 mép, snap, zoom, thêm/xoá track, kéo-thả media từ thư viện.
 */
import { useEffect, useRef, useState } from "react";
import type { Clip, Track, TrackKind } from "@repo-1/video-spec";
import { stickerUrl } from "@repo-1/video-spec";
import { useStore } from "./store";
import { clamp, fmtTime, tickStep } from "./lib";
import { getVideoThumbnail } from "./lib/thumbnails";
import { ClipWaveform } from "./components/waveform";

const LANE_H: Record<TrackKind, number> = { video: 58, audio: 46, text: 46, sticker: 46, image: 58 };

type DragState =
  | { mode: "scrub" }
  | { mode: "move"; trackId: string; clipId: string; startClientX: number; origStart: number }
  | { mode: "trim"; trackId: string; clipId: string; edge: "left" | "right"; startClientX: number };

/** Snap điểm bắt đầu/kết thúc clip tới playhead, mép clip khác, hoặc 0. */
function snapTime(
  proposed: number,
  dur: number,
  track: Track,
  ignoreId: string,
  playhead: number,
  pxPerSec: number,
): number {
  const th = 10 / pxPerSec;
  const candidates: number[] = [0, playhead];
  for (const c of track.clips) {
    if (c.id === ignoreId) continue;
    candidates.push(c.start, c.start + c.duration);
  }
  let best = proposed;
  let bestD = th;
  for (const c of candidates) {
    const dStart = Math.abs(proposed - c);
    if (dStart < bestD) {
      bestD = dStart;
      best = c;
    }
    const dEnd = Math.abs(proposed + dur - c);
    if (dEnd < bestD) {
      bestD = dEnd;
      best = c - dur;
    }
  }
  return Math.max(0, best);
}

function clipLabel(clip: Clip): string {
  if (clip.kind === "text") return clip.text || "(trống)";
  return clip.src;
}

/** src sticker có thể là tên file thư viện ("star.png") hoặc blob/URL upload. */
function stickerThumbSrc(src: string): string {
  if (/^(blob:|https?:|data:)/.test(src) || src.startsWith("/")) return src;
  return stickerUrl(src);
}

/**
 * Thumbnail cho clip trên timeline (R1-035).
 * - video/image: dùng `thumbnail` có sẵn của media (sync); nếu chưa có thì
 *   lazy-capture frame giữa clip qua IntersectionObserver.
 * - sticker: PNG gốc, hiển thị đơn (không lặp).
 * - Lỗi → null → fallback block màu như cũ.
 */
function ClipThumb({ clip }: { clip: Clip }) {
  const visual = clip.kind === "video" || clip.kind === "image" || clip.kind === "sticker";
  const src = clip.kind === "sticker" ? clip.src
    : clip.kind === "video" || clip.kind === "image" ? clip.src : "";
  const clipIn = clip.kind === "video" ? clip.in : 0;
  const [thumb, setThumb] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visual || !src) return;
    let cancelled = false;

    // 1. Đường nhanh (sync, miễn phí): media đã có thumbnail lúc import.
    if (clip.kind === "sticker") {
      setThumb(stickerThumbSrc(src));
      return;
    }
    const item = useStore.getState().media.find((m) => m.name === src);
    if (item?.thumbnail) {
      setThumb(item.thumbnail);
      return;
    }
    // 2. Lazy capture cho video chưa có thumbnail (chỉ khi lọt vào vùng nhìn).
    if (clip.kind !== "video") return;
    const doCapture = () => {
      const it = useStore.getState().media.find((m) => m.name === src);
      if (!it) return; // media đã bị xoá → fallback block màu
      const at = clipIn + clip.duration / 2;
      getVideoThumbnail(it.url, at).then((url) => {
        if (!cancelled && url) setThumb(url);
      });
    };
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      doCapture();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          doCapture();
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [visual, src, clip.kind, clipIn, clip.duration, clip.id]);

  if (!visual) return null;
  const sticker = clip.kind === "sticker";
  return (
    <div
      ref={boxRef}
      className={`clip-thumb${sticker ? " clip-thumb-sticker" : ""}`}
      aria-hidden="true"
      style={thumb ? { backgroundImage: `url("${thumb}")` } : undefined}
    />
  );
}

function Ruler({ width, pxPerSec }: { width: number; pxPerSec: number }) {
  const playhead = useStore((s) => s.playhead);
  const setPlayhead = useStore((s) => s.setPlayhead);
  const step = tickStep(pxPerSec);
  const ticks: number[] = [];
  for (let t = 0; t * pxPerSec <= width; t += step) ticks.push(t);

  const scrubTo = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setPlayhead((clientX - rect.left) / pxPerSec);
  };

  return (
    <div
      className="tl-ruler"
      style={{ width }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        scrubTo(e.clientX, e.currentTarget);
        const move = (ev: PointerEvent) => scrubTo(ev.clientX, e.currentTarget);
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    >
      {ticks.map((t) => (
        <div key={t} className="tl-tick" style={{ left: t * pxPerSec }}>
          <span>{fmtTime(t)}</span>
        </div>
      ))}
      <div className="tl-playhead-handle" style={{ left: playhead * pxPerSec }} />
    </div>
  );
}

function ClipView({
  clip,
  pxPerSec,
  selected,
  onPointerDownBody,
  onPointerDownEdge,
}: {
  clip: Clip;
  pxPerSec: number;
  selected: boolean;
  onPointerDownBody: (e: React.PointerEvent, clip: Clip) => void;
  onPointerDownEdge: (e: React.PointerEvent, clip: Clip, edge: "left" | "right") => void;
}) {
  const kindClass =
    clip.kind === "video" ? "clip-video" : clip.kind === "audio" ? "clip-audio" : "clip-text";
  return (
    <div
      className={`tl-clip ${kindClass}${selected ? " selected" : ""}`}
      style={{ left: clip.start * pxPerSec, width: Math.max(8, clip.duration * pxPerSec) }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDownBody(e, clip);
      }}
      title={clipLabel(clip)}
    >
      <div
        className="clip-handle left"
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDownEdge(e, clip, "left");
        }}
      />
      <ClipThumb clip={clip} />
      <div className="clip-label">{clipLabel(clip)}</div>
      {clip.kind === "audio" && (
        <ClipWaveform clip={clip} pxPerSec={pxPerSec} />
      )}
      {clip.kind !== "text" && (
        <div className="clip-sub">
          {fmtTime(clip.start)} → {fmtTime(clip.start + clip.duration)}
        </div>
      )}
      <div
        className="clip-handle right"
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDownEdge(e, clip, "right");
        }}
      />
    </div>
  );
}

const TRACK_ICON: Record<TrackKind, string> = { video: "🎬", audio: "🎵", text: "🔤", sticker: "🌟", image: "🖼️" };

export function Timeline() {
  const spec = useStore((s) => s.spec);
  const pxPerSec = useStore((s) => s.pxPerSec);
  const playhead = useStore((s) => s.playhead);
  const selection = useStore((s) => s.selection);
  const dragRef = useRef<DragState | null>(null);

  const duration = useStore.getState().duration();
  const width = Math.max(duration * pxPerSec, 600) + 240;

  // window-level move/up cho kéo clip & trim (dùng ref để không re-bind)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.mode === "scrub") return;
      const st = useStore.getState();
      const pps = st.pxPerSec;
      const dxSec = (e.clientX - drag.startClientX) / pps;
      if (drag.mode === "move") {
        const track = st.spec.tracks.find((t) => t.id === drag.trackId);
        const clip = track?.clips.find((c) => c.id === drag.clipId);
        if (!track || !clip) return;
        const snapped = snapTime(drag.origStart + dxSec, clip.duration, track, clip.id, st.playhead, pps);
        st.moveClip(drag.trackId, drag.clipId, snapped);
      } else {
        st.trimClip(drag.trackId, drag.clipId, drag.edge, dxSec);
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const beginBodyDrag = (e: React.PointerEvent, track: Track, clip: Clip) => {
    useStore.getState().select({ trackId: track.id, clipId: clip.id });
    dragRef.current = {
      mode: "move",
      trackId: track.id,
      clipId: clip.id,
      startClientX: e.clientX,
      origStart: clip.start,
    };
  };

  const beginEdgeDrag = (
    e: React.PointerEvent,
    track: Track,
    clip: Clip,
    edge: "left" | "right",
  ) => {
    useStore.getState().select({ trackId: track.id, clipId: clip.id });
    dragRef.current = { mode: "trim", trackId: track.id, clipId: clip.id, edge, startClientX: e.clientX };
  };

  const st = useStore.getState();

  return (
    <section className="timeline">
      <div className="tl-toolbar">
        <div className="tl-add-track">
          <span className="tl-toolbar-label">Track:</span>
          <button onClick={() => st.addTrack("video")} title="Thêm track video">＋ 🎬</button>
          <button onClick={() => st.addTrack("audio")} title="Thêm track âm thanh">＋ 🎵</button>
          <button onClick={() => st.addTrack("text")} title="Thêm track chữ">＋ 🔤</button>
        </div>
        <div className="tl-zoom">
          <button onClick={() => st.setZoom(pxPerSec / 1.4)} title="Thu nhỏ">−</button>
          <input
            type="range"
            min={8}
            max={240}
            value={pxPerSec}
            onChange={(e) => st.setZoom(Number(e.target.value))}
            title="Zoom timeline"
          />
          <button onClick={() => st.setZoom(pxPerSec * 1.4)} title="Phóng to">＋</button>
        </div>
        <div className="tl-hint">Kéo mép clip để trim • S = tách • Del = xoá</div>
      </div>

      <div className="tl-body">
        <div className="tl-gutter">
          <div className="tl-gutter-head">Track</div>
          {spec.tracks.map((t) => (
            <div key={t.id} className="tl-track-head" style={{ height: LANE_H[t.kind] }}>
              <span className="tl-track-icon">{TRACK_ICON[t.kind]}</span>
              <span className="tl-track-label">{t.label ?? t.kind}</span>
              <button
                className="tl-track-del"
                title="Xoá track"
                onClick={() => st.removeTrack(t.id)}
              >
                ×
              </button>
            </div>
          ))}
          {spec.tracks.length === 0 && (
            <div className="tl-empty-gutter">Chưa có track nào</div>
          )}
        </div>

        <div className="tl-scroll">
          <Ruler width={width} pxPerSec={pxPerSec} />
          <div
            className="tl-lanes"
            style={{ width }}
            onPointerDown={() => useStore.getState().select(null)}
          >
            {spec.tracks.map((track) => (
              <div
                key={track.id}
                className={`tl-lane lane-${track.kind}`}
                style={{ height: LANE_H[track.kind] }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const mediaId = e.dataTransfer.getData("text/media-id");
                  if (!mediaId) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const at = clamp((e.clientX - rect.left) / pxPerSec, 0, 3600);
                  useStore.getState().addMediaToTrack(mediaId, track.id, at);
                }}
              >
                {track.clips.map((clip) => (
                  <ClipView
                    key={clip.id}
                    clip={clip}
                    pxPerSec={pxPerSec}
                    selected={selection?.clipId === clip.id}
                    onPointerDownBody={(e) => beginBodyDrag(e, track, clip)}
                    onPointerDownEdge={(e, c, edge) => beginEdgeDrag(e, track, c, edge)}
                  />
                ))}
                {track.clips.length === 0 && (
                  <div className="tl-lane-empty">Kéo thả media vào đây</div>
                )}
              </div>
            ))}
            {spec.tracks.length === 0 && (
              <div className="tl-no-tracks">
                Bấm <b>＋ 🎬</b> ở trên để tạo track đầu tiên, rồi thêm media từ thư viện.
              </div>
            )}
            <div className="tl-playhead-line" style={{ left: playhead * pxPerSec }} />
          </div>
        </div>
      </div>
    </section>
  );
}
