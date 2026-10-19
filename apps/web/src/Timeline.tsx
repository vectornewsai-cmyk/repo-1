/**
 * Timeline đa track: ruler + playhead kéo được, clip kéo-thả di chuyển,
 * trim 2 mép, snap, zoom, thêm/xoá track, kéo-thả media từ thư viện.
 */
import { useEffect, useRef, useState } from "react";
import type { Clip, Track, TrackKind } from "@repo-1/video-spec";
import { formatTimecode, snapToFrame, stickerUrl } from "@repo-1/video-spec";
import { useStore } from "./store";
import type { MoveItem, Selection } from "./store";
import { clamp, fmtTime, tickStep } from "./lib";
import { getVideoThumbnail, getFilmstrip, filmstripCount } from "./lib/thumbnails";
import { visibleFlagsFor, type TrackFlag } from "./lib/trackFlags";
import { ClipWaveform } from "./components/waveform";

const LANE_H: Record<TrackKind, number> = { video: 58, audio: 46, text: 46, sticker: 46, image: 58 };

type DragState =
  | { mode: "scrub" }
  | { mode: "move"; items: MoveItem[]; startClientX: number }
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
 * Thumbnail cho clip trên timeline (R1-035) + filmstrip nhiều frame (R1-066).
 * - video: dải filmstrip N frame cách đều theo thời lượng (1 mỗi ~2s, tối đa 10);
 *   clip ngắn (<=2s) giữ 1 frame như cũ. Lazy-capture qua IntersectionObserver,
 *   mỗi frame qua cache LRU/dedupe của thumbnails.ts.
 * - image: thumbnail có sẵn của media (sync), ảnh đơn.
 * - sticker: PNG gốc, hiển thị đơn (không lặp).
 * - Lỗi → null → fallback block màu như cũ.
 */
function ClipThumb({ clip }: { clip: Clip }) {
  const visual = clip.kind === "video" || clip.kind === "image" || clip.kind === "sticker";
  const src = clip.kind === "sticker" ? clip.src
    : clip.kind === "video" || clip.kind === "image" ? clip.src : "";
  const clipIn = clip.kind === "video" ? clip.in : 0;
  // R1-066: chỉ video mới có filmstrip; count<=1 → hành vi đơn như cũ.
  const stripCount = clip.kind === "video" ? filmstripCount(clip.duration) : 0;
  const [thumb, setThumb] = useState<string | null>(null);
  const [strip, setStrip] = useState<Array<string | null> | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visual || !src) return;
    let cancelled = false;

    // 1. Sticker: PNG gốc (sync, miễn phí).
    if (clip.kind === "sticker") {
      setThumb(stickerThumbSrc(src));
      return;
    }
    const item = useStore.getState().media.find((m) => m.name === src);

    // 2. R1-066: filmstrip cho video clip dài — thumbnail import (nếu có) chỉ là
    // 1 frame nên không đủ dựng dải; capture các frame qua cache.
    if (stripCount > 1) {
      setStrip(new Array<string | null>(stripCount).fill(null));
      const doCapture = () => {
        const it = useStore.getState().media.find((m) => m.name === src);
        if (!it) return; // media đã bị xoá → fallback block màu
        getFilmstrip(it.url, clipIn, clip.duration)
          .then((frames) => {
            if (!cancelled) setStrip(frames);
          })
          .catch(() => {
            /* giữ placeholder */
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
    }

    // 3. Đường nhanh (sync, miễn phí): media đã có thumbnail lúc import.
    if (item?.thumbnail) {
      setThumb(item.thumbnail);
      return;
    }
    // 4. Lazy capture cho video chưa có thumbnail (chỉ khi lọt vào vùng nhìn).
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
  }, [visual, src, clip.kind, clipIn, clip.duration, clip.id, stripCount]);

  if (!visual) return null;
  const sticker = clip.kind === "sticker";
  // R1-066: render dải filmstrip.
  if (stripCount > 1 && strip) {
    return (
      <div ref={boxRef} className="clip-filmstrip" aria-hidden="true">
        {strip.map((frame, i) => (
          <div
            key={i}
            className="clip-filmstrip-cell"
            style={frame ? { backgroundImage: `url("${frame}")` } : undefined}
          />
        ))}
      </div>
    );
  }
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
  const fps = useStore((s) => s.spec.meta.fps);
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
          {/* R1-055: tick hiển thị timecode HH:MM:SS:FF (snap về frame) */}
          <span>{formatTimecode(snapToFrame(t, fps), fps)}</span>
        </div>
      ))}
      <div className="tl-playhead-handle" style={{ left: playhead * pxPerSec }} />
    </div>
  );
}

function ClipView({
  clip,
  trackId,
  pxPerSec,
  selected,
  onPointerDownBody,
  onPointerDownEdge,
}: {
  clip: Clip;
  trackId: string;
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
      data-track-id={trackId}
      data-clip-id={clip.id}
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

/** Nút mute/lock/hide trên header của track (R1-054). */
function TrackFlags({ track }: { track: Track }) {
  const toggleTrackFlag = useStore((s) => s.toggleTrackFlag);
  const flags = visibleFlagsFor(track.kind);
  const meta: Record<TrackFlag, { on: string; off: string; titleOn: string; titleOff: string }> = {
    muted: { on: "🔇", off: "🔈", titleOn: "Bật tiếng track", titleOff: "Tắt tiếng track" },
    locked: { on: "🔒", off: "🔓", titleOn: "Mở khóa track", titleOff: "Khóa track (không cho sửa clip)" },
    hidden: { on: "🙈", off: "👁", titleOn: "Hiện track", titleOff: "Ẩn track khỏi preview/render" },
  };
  return (
    <>
      {flags.map((flag) => {
        const active = !!track[flag];
        const m = meta[flag];
        return (
          <button
            key={flag}
            className={`tl-track-flag${active ? " on" : ""}`}
            title={active ? m.titleOn : m.titleOff}
            onClick={(e) => {
              e.stopPropagation();
              toggleTrackFlag(track.id, flag);
            }}
          >
            {active ? m.on : m.off}
          </button>
        );
      })}
    </>
  );
}

export function Timeline() {
  const spec = useStore((s) => s.spec);
  const pxPerSec = useStore((s) => s.pxPerSec);
  const playhead = useStore((s) => s.playhead);
  const selection = useStore((s) => s.selection);
  const rippleMode = useStore((s) => s.rippleMode);
  const dragRef = useRef<DragState | null>(null);
  const lanesRef = useRef<HTMLDivElement | null>(null);
  const boxStartRef = useRef<{ x0: number; y0: number; active: boolean } | null>(null);
  /** Hộp chọn vùng (box select) đang vẽ — null khi không kéo vùng. */
  const [box, setBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const duration = useStore.getState().duration();
  const width = Math.max(duration * pxPerSec, 600) + 240;

  // window-level move/up cho kéo clip & trim (dùng ref để không re-bind)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.mode === "scrub") return;
      const pps = st.pxPerSec;
      const dxSec = (e.clientX - drag.startClientX) / pps;
      if (drag.mode === "move") {
        // R1-052: di chuyển cả nhóm — clip được kéo giữ snap mép, cả nhóm dịch cùng delta
        const primary = drag.items[0];
        if (!primary) return;
        const track = st.spec.tracks.find((t) => t.id === primary.trackId);
        const clip = track?.clips.find((c) => c.id === primary.clipId);
        if (!track || !clip) return;
        const snapped = snapTime(primary.origStart + dxSec, clip.duration, track, clip.id, st.playhead, pps);
        st.moveSelectionBy(drag.items, snapped - primary.origStart);
      } else {
        st.trimClip(drag.trackId, drag.clipId, drag.edge, dxSec);
      }
    };
    const onUp = () => {
      // R1-051: kết thúc gộp history — cả lần kéo thành 1 bước undo duy nhất
      useStore.getState().endHistoryGroup();
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
    if (track.locked) return; // R1-054: track khóa không kéo được (store cũng chặn)
    const st = useStore.getState();
    const sel = { trackId: track.id, clipId: clip.id };
    if (e.shiftKey) {
      st.addToSelection(sel); // R1-052: Shift+click thêm vào vùng chọn
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      st.toggleSelect(sel); // R1-052: Ctrl/Cmd+click bật/tắt từng clip
      return;
    }
    // Click thường: nếu clip chưa trong vùng chọn thì chọn riêng nó;
    // nếu đã trong vùng chọn nhiều thì giữ nguyên nhóm để kéo cả nhóm.
    if (!st.selection.some((s) => s.trackId === track.id && s.clipId === clip.id)) {
      st.select(sel);
    }
    const items: MoveItem[] = useStore.getState().selection.map((s) => {
      const t = useStore.getState().spec.tracks.find((tr) => tr.id === s.trackId);
      const c = t?.clips.find((cl) => cl.id === s.clipId);
      return { trackId: s.trackId, clipId: s.clipId, origStart: c ? c.start : 0 };
    });
    dragRef.current = {
      mode: "move",
      items,
      startClientX: e.clientX,
    };
    // R1-051: gộp mọi bước di chuyển trong lần kéo thành 1 entry
    useStore.getState().beginHistoryGroup(
      items.length > 1 ? `Di chuyển ${items.length} clip` : "Di chuyển clip",
    );
  };

  const beginEdgeDrag = (
    e: React.PointerEvent,
    track: Track,
    clip: Clip,
    edge: "left" | "right",
  ) => {
    if (track.locked) return; // R1-054: track khóa không trim được (store cũng chặn)
    useStore.getState().select({ trackId: track.id, clipId: clip.id });
    dragRef.current = { mode: "trim", trackId: track.id, clipId: clip.id, edge, startClientX: e.clientX };
    // R1-051: gộp mọi bước trim trong lần kéo thành 1 entry
    useStore.getState().beginHistoryGroup("Cắt clip");
  };

  /**
   * Box select (R1-052): kéo trên vùng trống của timeline để chọn nhiều clip.
   * Click thường (không kéo) vẫn bỏ chọn như cũ.
   */
  const beginBoxSelect = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".tl-clip")) return; // clip tự xử lý
    const el = lanesRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    boxStartRef.current = {
      x0: e.clientX - rect.left,
      y0: e.clientY - rect.top,
      active: false,
    };
    const move = (ev: PointerEvent) => {
      const b = boxStartRef.current;
      if (!b) return;
      const r = el.getBoundingClientRect();
      const x1 = ev.clientX - r.left;
      const y1 = ev.clientY - r.top;
      if (!b.active && Math.hypot(x1 - b.x0, y1 - b.y0) > 5) b.active = true;
      if (b.active) setBox({ x0: b.x0, y0: b.y0, x1, y1 });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const b = boxStartRef.current;
      boxStartRef.current = null;
      setBox(null);
      if (!b) return;
      if (b.active) {
        const r = el.getBoundingClientRect();
        const x1 = ev.clientX - r.left;
        const y1 = ev.clientY - r.top;
        const bx0 = Math.min(b.x0, x1);
        const bx1 = Math.max(b.x0, x1);
        const by0 = Math.min(b.y0, y1);
        const by1 = Math.max(b.y0, y1);
        const items: Selection[] = [];
        el.querySelectorAll(".tl-clip").forEach((n) => {
          const cr = (n as HTMLElement).getBoundingClientRect();
          const nx0 = cr.left - r.left;
          const nx1 = cr.right - r.left;
          const ny0 = cr.top - r.top;
          const ny1 = cr.bottom - r.top;
          if (nx0 < bx1 && nx1 > bx0 && ny0 < by1 && ny1 > by0) {
            const he = n as HTMLElement;
            const trackId = he.dataset.trackId;
            const clipId = he.dataset.clipId;
            if (trackId && clipId) items.push({ trackId, clipId });
          }
        });
        useStore.getState().selectMany(items);
      } else {
        useStore.getState().select(null); // click thường trên vùng trống -> bỏ chọn
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
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
        <div className="tl-ripple">
          <button
            className={rippleMode ? "active" : ""}
            onClick={() => st.toggleRipple()}
            title={rippleMode ? "Tắt ripple: xóa/trim để lại khoảng trống" : "Bật ripple: xóa/trim tự dồn khoảng trống"}
          >
            🧲 Ripple
          </button>
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
        {/* R1-055: readout timecode của playhead */}
        <div className="tl-timecode" title="Timecode playhead (HH:MM:SS:FF)">
          {formatTimecode(playhead, spec.meta.fps)}
        </div>
        <div className="tl-hint">Kéo mép clip để trim • S = tách • Del = xoá • Shift+click chọn thêm • Kéo vùng trống chọn nhiều</div>
      </div>

      <div className="tl-body">
        <div className="tl-gutter">
          <div className="tl-gutter-head">Track</div>
          {spec.tracks.map((t) => (
            <div key={t.id} className={`tl-track-head${t.locked ? " is-locked" : ""}${t.hidden ? " is-hidden" : ""}`} style={{ height: LANE_H[t.kind] }}>
              <span className="tl-track-icon">{TRACK_ICON[t.kind]}</span>
              <span className="tl-track-label">{t.label ?? t.kind}</span>
              <TrackFlags track={t} />
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
            ref={lanesRef}
            className="tl-lanes"
            style={{ width }}
            onPointerDown={beginBoxSelect}
          >
            {box && (
              <div
                className="tl-boxselect"
                style={{
                  left: Math.min(box.x0, box.x1),
                  top: Math.min(box.y0, box.y1),
                  width: Math.abs(box.x1 - box.x0),
                  height: Math.abs(box.y1 - box.y0),
                }}
              />
            )}
            {spec.tracks.map((track) => (
              <div
                key={track.id}
                className={`tl-lane lane-${track.kind}${track.locked ? " is-locked" : ""}`}
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
                    trackId={track.id}
                    pxPerSec={pxPerSec}
                    selected={selection.some((s) => s.trackId === track.id && s.clipId === clip.id)}
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
