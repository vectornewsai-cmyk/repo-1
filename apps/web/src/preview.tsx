/**
 * Preview canvas: vẽ từng frame theo playhead bằng Canvas 2D,
 * đồng bộ phát lại video/audio thật, hỗ trợ kéo chữ trực tiếp.
 */
import { useEffect, useRef } from "react";
import type { TextClip, VideoSpec } from "@repo-1/video-spec";
import { isSpeedable, sourceTimeAt } from "@repo-1/video-spec/speed";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { MediaPool } from "./media";
import { clamp } from "./lib";

interface Viewport {
  cw: number;
  ch: number;
  scale: number;
  offX: number;
  offY: number;
}

function computeViewport(cw: number, ch: number, spec: VideoSpec): Viewport {
  const scale = Math.min(cw / spec.meta.width, ch / spec.meta.height);
  return {
    cw, ch, scale,
    offX: (cw - spec.meta.width * scale) / 2,
    offY: (ch - spec.meta.height * scale) / 2,
  };
}

/** Vẽ media phủ kín khung hình (cover-fit) trong tọa độ project. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  mw: number,
  mh: number,
  W: number,
  H: number,
  alpha: number,
) {
  const s = Math.max(W / mw, H / mh);
  const dw = mw * s;
  const dh = mh * s;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}

function textFont(c: TextClip): string {
  const s = c.style;
  return `${s.italic ? "italic " : ""}${s.bold ? "700 " : "400 "}${s.fontSize}px ${s.fontFamily}`;
}

interface TextBox {
  clip: TextClip;
  trackId: string;
  x: number; // px trong tọa độ project (tâm)
  y: number;
  w: number;
  h: number;
}

function measureTextBox(ctx: CanvasRenderingContext2D, spec: VideoSpec, trackId: string, clip: TextClip): TextBox {
  ctx.font = textFont(clip);
  const w = Math.max(10, ctx.measureText(clip.text || " ").width + 24);
  const h = clip.style.fontSize * 1.35 + 16;
  return {
    clip, trackId,
    x: (clip.style.x ?? 0.5) * spec.meta.width,
    y: (clip.style.y ?? 0.5) * spec.meta.height,
    w, h,
  };
}

function drawTextClip(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  trackId: string,
  clip: TextClip,
  t: number,
  selected: boolean,
) {
  const s = clip.style;
  const box = measureTextBox(ctx, spec, trackId, clip);
  let alpha = 1;
  let yOff = 0;
  let text = clip.text;
  const elapsed = t - clip.start;
  if (s.animation === "fadeUp") {
    const p = clamp(elapsed / 0.5, 0, 1);
    alpha = p;
    yOff = (1 - p) * 24;
  } else if (s.animation === "typewriter") {
    const revealDur = Math.min(1.5, clip.duration);
    const n = Math.floor(clamp(elapsed / revealDur, 0, 1) * text.length);
    text = text.slice(0, n);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  if (s.backgroundColor) {
    ctx.fillStyle = s.backgroundColor;
    const r = 10;
    const x0 = box.x - box.w / 2;
    const y0 = box.y - box.h / 2 + yOff;
    ctx.beginPath();
    ctx.roundRect(x0, y0, box.w, box.h, r);
    ctx.fill();
  }
  ctx.font = textFont(clip);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = s.color;
  ctx.fillText(text, box.x, box.y + yOff);
  ctx.restore();

  if (selected) {
    ctx.save();
    ctx.strokeStyle = "#8b7cf6";
    ctx.lineWidth = 2 / computeScaleHack(ctx);
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(box.x - box.w / 2, box.y - box.h / 2 + yOff, box.w, box.h);
    ctx.restore();
  }
}

/** Lấy scale hiện tại từ transform (dùng cho lineWidth khi vẽ outline). */
function computeScaleHack(ctx: CanvasRenderingContext2D): number {
  const m = ctx.getTransform();
  return Math.max(0.001, m.a);
}

/** Vẽ 1 frame hoàn chỉnh. */
function renderFrame(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  t: number,
  vp: Viewport,
  selected: { trackId: string; clipId: string } | null,
) {
  const { width: W, height: H } = spec.meta;
  // nền đen toàn canvas (tọa độ device px)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, vp.cw, vp.ch);
  // chuyển sang tọa độ project
  ctx.setTransform(vp.scale, 0, 0, vp.scale, vp.offX, vp.offY);
  // viền khung hình
  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(0, 0, W, H);

  // track[0] = lớp dưới cùng, track sau đè lên
  for (const track of spec.tracks) {
    if (track.hidden) continue; // R1-054: track ẩn không vẽ trong preview
    for (const clip of track.clips) {
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      if (track.kind === "video" && clip.kind === "video") {
        const item = mediaByName.get(clip.src);
        // alpha từ opacity + transition fade
        let alpha = clip.opacity ?? 1;
        const el = t - clip.start;
        if (clip.transitionIn?.type === "fade" && clip.transitionIn.duration > 0) {
          alpha *= clamp(el / clip.transitionIn.duration, 0, 1);
        }
        if (clip.transitionOut?.type === "fade" && clip.transitionOut.duration > 0) {
          const remain = clip.duration - el;
          alpha *= clamp(remain / clip.transitionOut.duration, 0, 1);
        }
        if (!item) {
          ctx.fillStyle = "#1a2030";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#8b94a7";
          ctx.font = "28px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`Thiếu media: ${clip.src}`, W / 2, H / 2);
          continue;
        }
        if (item.kind === "image") {
          const img = pool.imageFor(item);
          if (img && img.complete && img.naturalWidth > 0) {
            drawCover(ctx, img, img.naturalWidth, img.naturalHeight, W, H, alpha);
          }
        } else {
          const v = pool.videoFor(item);
          if (v && v.readyState >= 2 && v.videoWidth > 0) {
            drawCover(ctx, v, v.videoWidth, v.videoHeight, W, H, alpha);
          }
        }
      } else if (track.kind === "text" && clip.kind === "text") {
        drawTextClip(ctx, spec, track.id, clip, t, selected?.clipId === clip.id);
      }
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Đồng bộ các phần tử video/audio với playhead. */
function syncMedia(
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  t: number,
  playing: boolean,
) {
  const actives: { el: HTMLVideoElement | HTMLAudioElement; target: number; volume: number; speed: number; reverse: boolean }[] = [];
  for (const track of spec.tracks) {
    // R1-054: track audio bị mute → bỏ qua hoàn toàn (không phát tiếng).
    if (track.kind === "audio" && track.muted) continue;
    for (const clip of track.clips) {
      if (clip.kind === "text" || clip.kind === "sticker") continue; // text/sticker không có media để đồng bộ
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      const item = mediaByName.get(clip.src);
      if (!item) continue;
      // R1-013: dùng sourceTimeAt — đúng với mọi speed/reverse.
      // LƯU Ý: HTMLVideoElement không phát ngược được. Khi clip.reverse=true và
      // đang phát (playing), preview chỉ seek đúng khi pause/scrub; lúc phát
      // sẽ chạy xuôi (giới hạn đã ghi trong SPEED_INVARIANT.md).
      const speedable = isSpeedable(clip);
      const speed = speedable ? (clip.speed ?? 1) : 1;
      const reverse = speedable ? (clip.reverse ?? false) : false;
      const target =
        clip.kind === "image" ? 0 : speedable ? sourceTimeAt(clip, t) : 0;
      if (track.kind === "video" && clip.kind === "video" && item.kind === "video") {
        const el = pool.videoFor(item);
        // R1-054: video track bị mute → giữ phát hình nhưng tắt tiếng (volume 0).
        if (el) actives.push({ el, target, volume: track.muted ? 0 : 1, speed, reverse });
      } else if (track.kind === "audio" && clip.kind === "audio" && item.kind === "audio") {
        const el = pool.audioFor(item);
        if (el) {
          const audioClip = clip as import("@repo-1/video-spec").AudioClip;
          let v = audioClip.volume ?? 1;
          const el2 = t - audioClip.start;
          if (audioClip.fadeIn && audioClip.fadeIn > 0) v *= clamp(el2 / audioClip.fadeIn, 0, 1);
          if (audioClip.fadeOut && audioClip.fadeOut > 0) v *= clamp((audioClip.duration - el2) / audioClip.fadeOut, 0, 1);
          actives.push({ el, target, volume: v, speed, reverse });
        }
      }
    }
  }
  const seen = new Set<HTMLVideoElement | HTMLAudioElement>();
  for (const a of actives) {
    if (seen.has(a.el)) continue;
    seen.add(a.el);
    a.el.volume = clamp(a.volume, 0, 1);
    // R1-013: đồng bộ playbackRate với clip.speed (giữ cao độ như render dùng atempo)
    try {
      if (a.el.playbackRate !== a.speed) a.el.playbackRate = a.speed;
      // preservesPitch=true giữ cao độ khi đổi tốc độ (giống atempo của render)
      if ("preservesPitch" in a.el) (a.el as HTMLVideoElement).preservesPitch = true;
    } catch {
      /* bỏ qua nếu trình duyệt không hỗ trợ */
    }
    if (playing) {
      if (Math.abs(a.el.currentTime - a.target) > 0.35) {
        try {
          a.el.currentTime = a.target;
        } catch {
          /* seek chưa sẵn sàng */
        }
      }
      if (a.el.paused) {
        void a.el.play().catch(() => {
          /* trình duyệt chặn autoplay — người dùng bấm play là có gesture nên hiếm */
        });
      }
    } else {
      a.el.pause();
      if (Math.abs(a.el.currentTime - a.target) > 1 / 30) {
        try {
          a.el.currentTime = a.target;
        } catch {
          /* bỏ qua */
        }
      }
    }
  }
  if (!playing) pool.pauseAll();
}

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<MediaPool | null>(null);
  const dragRef = useRef<{ trackId: string; clipId: string; dx: number; dy: number } | null>(null);
  if (!poolRef.current) poolRef.current = new MediaPool();

  // vòng lặp phát lại + vẽ
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const st = useStore.getState();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (st.playing) {
        const d = st.duration();
        const nt = st.playhead + dt;
        if (nt >= d) {
          st.setPlayhead(d);
          useStore.setState({ playing: false });
        } else {
          st.setPlayhead(nt);
        }
      }
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = Math.max(1, Math.floor(wrap.clientWidth * dpr));
      const ch = Math.max(1, Math.floor(wrap.clientHeight * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const spec = useStore.getState().spec;
      const media = useStore.getState().media;
      const mediaByName = new Map(media.map((m) => [m.name, m]));
      const pool = poolRef.current!;
      const t = useStore.getState().playhead;
      const playing = useStore.getState().playing;
      syncMedia(spec, pool, mediaByName, t, playing);
      renderFrame(ctx, spec, pool, mediaByName, t, computeViewport(cw, ch, spec), useStore.getState().selection[0] ?? null);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Đổi client px -> tọa độ project. */
  const toProject = (e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return null;
    const st = useStore.getState();
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const vp = computeViewport(rect.width * dpr, rect.height * dpr, st.spec);
    return {
      x: (e.clientX - rect.left) * dpr / vp.scale - vp.offX / vp.scale,
      y: (e.clientY - rect.top) * dpr / vp.scale - vp.offY / vp.scale,
    };
  };

  const hitText = (p: { x: number; y: number }): TextBox | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const st = useStore.getState();
    const t = st.playhead;
    // duyệt ngược để chữ trên cùng trúng trước
    for (let i = st.spec.tracks.length - 1; i >= 0; i--) {
      const track = st.spec.tracks[i];
      if (track.kind !== "text") continue;
      for (let j = track.clips.length - 1; j >= 0; j--) {
        const clip = track.clips[j];
        if (clip.kind !== "text") continue;
        if (t < clip.start || t >= clip.start + clip.duration) continue;
        const box = measureTextBox(ctx, st.spec, track.id, clip);
        if (Math.abs(p.x - box.x) <= box.w / 2 && Math.abs(p.y - box.y) <= box.h / 2) {
          return box;
        }
      }
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const p = toProject(e);
    if (!p) return;
    const hit = hitText(p);
    if (hit) {
      dragRef.current = {
        trackId: hit.trackId,
        clipId: hit.clip.id,
        dx: p.x - hit.x,
        dy: p.y - hit.y,
      };
      useStore.getState().select({ trackId: hit.trackId, clipId: hit.clip.id });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const st = useStore.getState();
    if (drag) {
      const p = toProject(e);
      if (!p) return;
      st.patchTextStyle(drag.trackId, drag.clipId, {
        x: clamp((p.x - drag.dx) / st.spec.meta.width, 0, 1),
        y: clamp((p.y - drag.dy) / st.spec.meta.height, 0, 1),
      });
    } else {
      const p = toProject(e);
      const canvas = canvasRef.current;
      if (p && canvas) canvas.style.cursor = hitText(p) ? "move" : "default";
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div ref={wrapRef} className="preview-wrap">
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
