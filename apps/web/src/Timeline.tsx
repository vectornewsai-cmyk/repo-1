/**
 * Timeline đa track: ruler + playhead kéo được, clip kéo-thả di chuyển,
 * trim 2 mép, snap, zoom, thêm/xoá track, kéo-thả media từ thư viện.
 */
import { useEffect, useRef, useState } from "react";
import type { Clip, Track, TrackKind } from "@repo-1/video-spec";
import { formatTimecode, snapToFrame, stickerUrl } from "@repo-1/video-spec";
import { useStore } from "./store";
import { t as i18nT, useLang } from "./i18n";
import type { MoveItem, Selection } from "./store";
import { clamp, fmtTime, tickStep } from "./lib";
import { getVideoThumbnail, getFilmstrip, filmstripCount } from "./lib/thumbnails";
import { visibleFlagsFor, type TrackFlag } from "./lib/trackFlags";
import { ClipWaveform } from "./components/waveform";
import { validateDrop } from "./lib/drop";
import { pushToast } from "./lib/toast";
import { pinchDistance, pinchZoom } from "./lib/pinch";

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
  if (clip.kind === "text") return clip.text || i18nT("timeline.emptyLabel");
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
  const fps = useStore((s) => s.spec.meta.fps);
  const step = tickStep(pxPerSec);
  const ticks: number[] = [];
  for (let t = 0; t * pxPerSec <= width; t += step) ticks.push(t);
  // Q6 (Phase 8): 1 ngón scrub, 2 ngón pinch-zoom. Ruler có touch-action:none
  // nên trình duyệt không giành gesture; handler window-level để ngón tay trượt
  // ra ngoài ruler vẫn tiếp tục gesture.
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { mode: "scrub" }
    | { mode: "pinch"; startDist: number; startZoom: number }
    | null
  >(null);

  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      const p = pointers.current.get(ev.pointerId);
      if (p) {
        p.x = ev.clientX;
        p.y = ev.clientY;
      }
      const st = useStore.getState();
      if (g.mode === "scrub") {
        const el = rulerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        st.setPlayhead((ev.clientX - rect.left) / st.pxPerSec);
      } else if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        st.setZoom(pinchZoom(g.startDist, pinchDistance(a.x, a.y, b.x, b.y), g.startZoom));
      }
    };
    const onUp = (ev: PointerEvent) => {
      pointers.current.delete(ev.pointerId);
      if (pointers.current.size < 2) gesture.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const scrubTo = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    useStore.getState().setPlayhead((clientX - rect.left) / useStore.getState().pxPerSec);
  };

  return (
    <div
      ref={rulerRef}
      className="tl-ruler"
      style={{ width }}
      onPointerDown={(e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2) {
          const [a, b] = [...pointers.current.values()];
          gesture.current = {
            mode: "pinch",
            startDist: pinchDistance(a.x, a.y, b.x, b.y),
            startZoom: useStore.getState().pxPerSec,
          };
          return;
        }
        if (pointers.current.size > 2) return;
        gesture.current = { mode: "scrub" };
        scrubTo(e.clientX, e.currentTarget);
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
  useLang();
  const toggleTrackFlag = useStore((s) => s.toggleTrackFlag);
  const flags = visibleFlagsFor(track.kind);
  const meta: Record<TrackFlag, { on: string; off: string; titleOn: string; titleOff: string }> = {
    muted: { on: "🔇", off: "🔈", titleOn: i18nT("timeline.flagMuteOn"), titleOff: i18nT("timeline.flagMuteOff") },
    locked: { on: "🔒", off: "🔓", titleOn: i18nT("timeline.flagLockOn"), titleOff: i18nT("timeline.flagLockOff") },
    hidden: { on: "🙈", off: "👁", titleOn: i18nT("timeline.flagHideOn"), titleOff: i18nT("timeline.flagHideOff") },
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
  useLang();
  const spec = useStore((s) => s.spec);
  const pxPerSec = useStore((s) => s.pxPerSec);
  const playhead = useStore((s) => s.playhead);
  const selection = useStore((s) => s.selection);
  const rippleMode = useStore((s) => s.rippleMode);
  const dragRef = useRef<DragState | null>(null);
  const lanesRef = useRef<HTMLDivElement | null>(null);
  // Q6 (Phase 8): pinch-zoom trên vùng trống của lanes. Clip đã stopPropagation
  // ở onPointerDown nên lanes chỉ nhận pointer từ vùng trống; pinch chỉ bắt
  // đầu khi không có clip drag nào đang chạy (tránh 2 gesture giành nhau).
  const lanePointers = useRef(new Map<number, { x: number; y: number }>());
  const lanePinch = useRef<{ startDist: number; startZoom: number } | null>(null);
  const boxStartRef = useRef<{ x0: number; y0: number; active: boolean } | null>(null);
  /** Hộp chọn vùng (box select) đang vẽ — null khi không kéo vùng. */
  const [box, setBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  /** K5: vị trí thả media đang rê trên lane (vạch chỉ) — null khi không rê. */
  const [dropAt, setDropAt] = useState<{ trackId: string; at: number } | null>(null);

  const duration = useStore.getState().duration();
  const width = Math.max(duration * pxPerSec, 600) + 240;

  // window-level move/up cho kéo clip & trim (dùng ref để không re-bind)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Q6: pinch-zoom lanes chạy trước, độc lập với kéo clip.
      if (lanePinch.current) {
        const p = lanePointers.current.get(e.pointerId);
        if (p) {
          p.x = e.clientX;
          p.y = e.clientY;
        }
        if (lanePointers.current.size >= 2) {
          const [a, b] = [...lanePointers.current.values()];
          const st = useStore.getState();
          st.setZoom(
            pinchZoom(lanePinch.current.startDist, pinchDistance(a.x, a.y, b.x, b.y), lanePinch.current.startZoom),
          );
        }
        return;
      }
      const drag = dragRef.current;
      if (!drag || drag.mode === "scrub") return;
      // Q2 Phase 8: đọc state TƯƠI — `st` ở cuối component là snapshot lúc
      // render đầu (spec rỗng, project mẫu load async sau), nên lookup
      // track/clip trong onMove cũ luôn fail và mọi lần kéo clip đều bị
      // drop lặng lẽ. Các handler window-level khác đã dùng getState().
      const st = useStore.getState();
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
    const onUp = (e: PointerEvent) => {
      lanePointers.current.delete(e.pointerId);
      if (lanePointers.current.size < 2) lanePinch.current = null;
      // R1-051: kết thúc gộp history — cả lần kéo thành 1 bước undo duy nhất
      // (gọi thừa khi không có group cũng an toàn: không push nếu không đổi).
      useStore.getState().endHistoryGroup();
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
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
      items.length > 1 ? i18nT("timeline.histMoveN", { n: String(items.length) }) : i18nT("timeline.histMove"),
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
    useStore.getState().beginHistoryGroup(i18nT("timeline.histTrim"));
  };

  /**
   * Box select (R1-052): kéo trên vùng trống của timeline để chọn nhiều clip.
   * Click thường (không kéo) vẫn bỏ chọn như cũ.
   */
  const beginBoxSelect = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".tl-clip")) return; // clip tự xử lý
    const el = lanesRef.current;
    if (!el) return;
    // Q6: ngón thứ 2 trên vùng trống → hủy box select, chuyển sang pinch-zoom.
    lanePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (lanePointers.current.size === 2 && !dragRef.current) {
      boxStartRef.current = null;
      setBox(null);
      const [a, b] = [...lanePointers.current.values()];
      lanePinch.current = {
        startDist: pinchDistance(a.x, a.y, b.x, b.y),
        startZoom: useStore.getState().pxPerSec,
      };
      return;
    }
    if (lanePointers.current.size > 2) return;
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
      lanePointers.current.delete(ev.pointerId);
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
          <span className="tl-toolbar-label">{i18nT("timeline.toolbarTrack")}</span>
          <button onClick={() => st.addTrack("video")} title={i18nT("timeline.addVideo")}>＋ 🎬</button>
          <button onClick={() => st.addTrack("audio")} title={i18nT("timeline.addAudio")}>＋ 🎵</button>
          <button onClick={() => st.addTrack("text")} title={i18nT("timeline.addText")}>＋ 🔤</button>
        </div>
        <div className="tl-ripple">
          <button
            className={rippleMode ? "active" : ""}
            onClick={() => st.toggleRipple()}
            title={rippleMode ? i18nT("timeline.rippleOn") : i18nT("timeline.rippleOff")}
          >
            {i18nT("timeline.ripple")}
          </button>
        </div>
        <div className="tl-zoom">
          <button onClick={() => st.setZoom(pxPerSec / 1.4)} title={i18nT("timeline.zoomOut")}>−</button>
          <input
            type="range"
            min={8}
            max={240}
            value={pxPerSec}
            onChange={(e) => st.setZoom(Number(e.target.value))}
            title={i18nT("timeline.zoomTitle")}
          />
          <button onClick={() => st.setZoom(pxPerSec * 1.4)} title={i18nT("timeline.zoomIn")}>＋</button>
        </div>
        {/* R1-055: readout timecode của playhead */}
        <div className="tl-timecode" title={i18nT("timeline.timecodeTitle")}>
          {formatTimecode(playhead, spec.meta.fps)}
        </div>
        <div className="tl-hint">{i18nT("timeline.hint")}</div>
      </div>

      <div className="tl-body">
        <div className="tl-gutter">
          <div className="tl-gutter-head">{i18nT("timeline.gutterTrack")}</div>
          {spec.tracks.map((t) => (
            <div key={t.id} className={`tl-track-head${t.locked ? " is-locked" : ""}${t.hidden ? " is-hidden" : ""}`} style={{ height: LANE_H[t.kind] }}>
              <span className="tl-track-icon">{TRACK_ICON[t.kind]}</span>
              <span className="tl-track-label">{t.label ?? t.kind}</span>
              <TrackFlags track={t} />
              <button
                className="tl-track-del"
                title={i18nT("timeline.deleteTrack")}
                onClick={() => st.removeTrack(t.id)}
              >
                ×
              </button>
            </div>
          ))}
          {spec.tracks.length === 0 && (
            <div className="tl-empty-gutter">{i18nT("timeline.noTracks")}</div>
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
                onDragOver={(e) => {
                  // K5: vạch chỉ vị trí clip sẽ rơi xuống khi thả.
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const at = clamp((e.clientX - rect.left) / pxPerSec, 0, 3600);
                  setDropAt({ trackId: track.id, at });
                }}
                onDragLeave={() => setDropAt(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropAt(null);
                  const mediaId = e.dataTransfer.getData("text/media-id");
                  if (!mediaId) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const at = clamp((e.clientX - rect.left) / pxPerSec, 0, 3600);
                  // K5: báo lý do thay vì im lặng bỏ qua (luật mirror store).
                  const item = useStore.getState().media.find((m) => m.id === mediaId);
                  if (item) {
                    const check = validateDrop(track, item, at, spec.meta.fps);
                    if (!check.ok) {
                      pushToast(check.reason, "error");
                      return;
                    }
                  }
                  useStore.getState().addMediaToTrack(mediaId, track.id, at);
                }}
              >
                {dropAt && dropAt.trackId === track.id && (
                  <div
                    className="tl-drop-line"
                    style={{ left: dropAt.at * pxPerSec }}
                    aria-hidden="true"
                  />
                )}
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
                  <div className="tl-lane-empty">{i18nT("timeline.laneEmpty")}</div>
                )}
              </div>
            ))}
            {spec.tracks.length === 0 && (
              <div className="tl-no-tracks">
                {i18nT("timeline.noTracksHint1")} <b>＋ 🎬</b> {i18nT("timeline.noTracksHint2")}
              </div>
            )}
            <div className="tl-playhead-line" style={{ left: playhead * pxPerSec }} />
          </div>
        </div>
      </div>
    </section>
  );
}
