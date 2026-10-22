/**
 * Preview canvas: vẽ từng frame theo playhead bằng Canvas 2D,
 * đồng bộ phát lại video/audio thật, hỗ trợ kéo chữ trực tiếp.
 */
import { useEffect, useRef, useState } from "react";
import type { TextClip, VideoClip, VideoSpec } from "@repo-1/video-spec";
import { isSpeedable, sourceTimeAt, stickerUrl } from "@repo-1/video-spec";
import type { ImageClip, StickerClip } from "@repo-1/video-spec";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { MediaPool } from "./media";
import { clamp } from "./lib";
import { seekAll, Seeker, type SeekTarget } from "./lib/seek";
import { AudioEngine, computeClipGain, toPreviewFx } from "./lib/audioEngine";
import type { ActiveAudioSource } from "./lib/audioEngine";
import {
  applyChromaKey,
  imageClipFit,
  letterboxFit,
  stickerVisual,
  textClipVisual,
  videoClipVisual,
  videoElementPlacement,
  type ChromaParams,
} from "./lib/previewEngine";

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

/**
 * R1-060/061: helpers cho preview parity với render.js.
 * Thứ tự transform (video): speed → chroma → LUT → effects → opacity → keyframes.
 * Xem apps/web/src/lib/PREVIEW_LIMITS.md để biết những gì chỉ là xấp xỉ.
 */

/** ctx.filter có được trình duyệt hỗ trợ không (Safari cũ không có). */
const CTX_FILTER_OK: boolean = (() => {
  try {
    return (
      typeof CanvasRenderingContext2D !== "undefined" &&
      "filter" in CanvasRenderingContext2D.prototype
    );
  } catch {
    return false;
  }
})();

function setCtxFilter(ctx: CanvasRenderingContext2D, css: string): void {
  if (!CTX_FILTER_OK) return;
  try {
    ctx.filter = css || "none";
  } catch {
    /* bỏ qua */
  }
}

// ---- Chroma key: offscreen canvas + pixel shader (previewEngine.applyChromaKey) ----
const CHROMA_MAX_W = 640; // giới hạn để giữ 30fps (xem PREVIEW_LIMITS.md)
let chromaCanvas: HTMLCanvasElement | null = null;

function chromaKeyedSource(
  src: HTMLVideoElement | HTMLImageElement,
  vw: number,
  vh: number,
  chroma: ChromaParams,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!chromaCanvas) chromaCanvas = document.createElement("canvas");
  const s = Math.min(1, CHROMA_MAX_W / vw);
  const w = Math.max(2, Math.round(vw * s));
  const h = Math.max(2, Math.round(vh * s));
  if (chromaCanvas.width !== w || chromaCanvas.height !== h) {
    chromaCanvas.width = w;
    chromaCanvas.height = h;
  }
  const cctx = chromaCanvas.getContext("2d", { willReadFrequently: true });
  if (!cctx) return null;
  cctx.clearRect(0, 0, w, h);
  cctx.drawImage(src, 0, 0, w, h);
  const img = cctx.getImageData(0, 0, w, h);
  applyChromaKey(img, chroma);
  cctx.putImageData(img, 0, 0);
  return chromaCanvas;
}

// ---- Vignette: radial gradient xấp xỉ FFmpeg vignette ----
function drawVignette(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  intensity: number,
): void {
  const cx = dx + dw / 2;
  const cy = dy + dh / 2;
  const rMax = Math.hypot(dw, dh) / 2;
  const g = ctx.createRadialGradient(cx, cy, rMax * 0.45, cx, cy, rMax);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${(0.25 + 0.55 * intensity).toFixed(3)})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(dx, dy, dw, dh);
  ctx.restore();
}

// ---- Sticker: cache ảnh theo URL đã resolve ----
function resolveStickerUrl(src: string): string {
  if (/^(blob:|https?:|data:)/.test(src) || src.startsWith("/")) return src;
  return stickerUrl(src);
}

const stickerImgCache = new Map<string, HTMLImageElement>();

function stickerImageFor(src: string): HTMLImageElement | null {
  if (typeof document === "undefined") return null;
  const url = resolveStickerUrl(src);
  let img = stickerImgCache.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    stickerImgCache.set(url, img);
  }
  return img;
}

// Cảnh báo 1 lần cho effect preview không thể hiện (tránh spam console mỗi frame).
const warnedEffects = new Set<string>();

function warnSkippedEffects(skipped: string[]): void {
  for (const s of skipped) {
    if (!warnedEffects.has(s)) {
      warnedEffects.add(s);
      console.warn(
        `[preview] effect "${s}" không hiển thị trong preview (xem PREVIEW_LIMITS.md); bản render vẫn có.`,
      );
    }
  }
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

function drawTextClip(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  trackId: string,
  clip: TextClip,
  t: number,
  selected: boolean,
) {
  const s = clip.style;
  const { width: W, height: H } = spec.meta;
  const localT = t - clip.start;
  // Đo chữ để textClipVisual tính vị trí (mirror drawtext dùng text_w/text_h).
  ctx.font = textFont(clip);
  const textW = Math.max(1, ctx.measureText(clip.text || " ").width);
  const textH = clip.style.fontSize * 1.35;
  const vis = textClipVisual(clip, localT, W, H, { textW, textH });
  let text = clip.text;
  if (vis.revealChars != null) {
    text = [...text].slice(0, vis.revealChars).join("");
  }
  // Hộp nền + outline: box có padding như cũ, đặt tại tâm vis.
  const boxW = textW + 24;
  const boxH = textH + 16;

  ctx.save();
  ctx.globalAlpha = clamp(vis.alpha, 0, 1);
  if (s.backgroundColor) {
    ctx.fillStyle = s.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(vis.cx - boxW / 2, vis.cy - boxH / 2, boxW, boxH, 10);
    ctx.fill();
  }
  ctx.font = textFont(clip);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = s.color;
  ctx.fillText(text, vis.cx, vis.cy);
  ctx.restore();

  if (selected) {
    ctx.save();
    ctx.strokeStyle = "#8b7cf6";
    ctx.lineWidth = 2 / computeScaleHack(ctx);
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(vis.cx - boxW / 2, vis.cy - boxH / 2, boxW, boxH);
    ctx.restore();
  }
  void trackId;
}

/** Lấy scale hiện tại từ transform (dùng cho lineWidth khi vẽ outline). */
function computeScaleHack(ctx: CanvasRenderingContext2D): number {
  const m = ctx.getTransform();
  return Math.max(0.001, m.a);
}

/** Vẽ 1 video clip — mirror pipeline render.js (letterbox + transforms). */
function drawVideoClip(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  clip: VideoClip,
  t: number,
) {
  const { width: W, height: H } = spec.meta;
  const item = mediaByName.get(clip.src);
  const localT = t - clip.start;
  // Fade transition (preview chỉ mô phỏng fade; xfade loại khác xem PREVIEW_LIMITS.md).
  let alpha = clip.opacity ?? 1;
  if (clip.transitionIn?.type === "fade" && clip.transitionIn.duration > 0) {
    alpha *= clamp(localT / clip.transitionIn.duration, 0, 1);
  }
  if (clip.transitionOut?.type === "fade" && clip.transitionOut.duration > 0) {
    alpha *= clamp((clip.duration - localT) / clip.transitionOut.duration, 0, 1);
  }
  if (!item) {
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#8b94a7";
    ctx.font = "28px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Thiếu media: ${clip.src}`, W / 2, H / 2);
    return;
  }
  let srcEl: HTMLVideoElement | HTMLImageElement | null = null;
  let mw = 0;
  let mh = 0;
  if (item.kind === "image") {
    const img = pool.imageFor(item);
    if (img && img.complete && img.naturalWidth > 0) {
      srcEl = img;
      mw = img.naturalWidth;
      mh = img.naturalHeight;
    }
  } else if (item.kind === "video") {
    const v = pool.videoFor(item);
    if (v && v.readyState >= 2 && v.videoWidth > 0) {
      srcEl = v;
      mw = v.videoWidth;
      mh = v.videoHeight;
    }
  }
  if (!srcEl || mw <= 0 || mh <= 0) return;

  // R1-060: letterbox (giữ tỉ lệ + nền đen) — KHỚP render (scale=decrease + pad).
  // Trước đây preview dùng cover-fit (crop) → sai khác với bản render.
  const { dw, dh, dx, dy } = letterboxFit(mw, mh, W, H);
  // Render pad unit đúng WxH nên unitW=W, unitH=H.
  const vis = videoClipVisual(clip, localT, W, H, W, H);
  let drawSrc: CanvasImageSource = srcEl;
  if (vis.chroma) {
    const keyed = chromaKeyedSource(srcEl, mw, mh, vis.chroma);
    if (keyed) drawSrc = keyed;
  }
  ctx.save();
  ctx.globalAlpha = clamp(alpha * vis.opacity, 0, 1);
  setCtxFilter(ctx, vis.cssFilter);
  // Keyframes scale/rotation: mirror render (scale eval=frame + rotate quanh
  // tâm, overlay đặt hình bao theo x/y). Canvas: dịch tới tâm element →
  // xoay → scale → vẽ nội dung trong hệ toạ độ unit (gốc tại tâm unit).
  // Khi có scale/rotation, vùng letterbox trong render là TRONG SUỐT (unit
  // mang alpha) nên preview cũng chỉ vẽ đúng hình chữ nhật nội dung đã biến
  // đổi — phần ngoài cho thấy nội dung bên dưới, khớp render.
  if (clip.animations?.scale || clip.animations?.rotation) {
    const pl = videoElementPlacement(clip, localT, W, H, W, H);
    ctx.translate(pl.centerX, pl.centerY);
    if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
    if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
    ctx.drawImage(drawSrc, dx - W / 2, dy - H / 2, dw, dh);
    if (vis.vignette != null) {
      drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
    }
    ctx.restore();
    warnSkippedEffects(vis.skippedEffects);
    return;
  }
  ctx.drawImage(drawSrc, dx + vis.offsetX, dy + vis.offsetY, dw, dh);
  ctx.restore();
  if (vis.vignette != null) {
    drawVignette(ctx, dx + vis.offsetX, dy + vis.offsetY, dw, dh, vis.vignette);
  }
  warnSkippedEffects(vis.skippedEffects);
}

/** Vẽ 1 image clip — render KHÔNG áp LUT/effects/opacity cho ảnh → preview cũng không. */
function drawImageClip(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  clip: ImageClip,
) {
  const { width: W, height: H } = spec.meta;
  const item = mediaByName.get(clip.src);
  if (!item || item.kind !== "image") return;
  const img = pool.imageFor(item);
  if (!img || !img.complete || !img.naturalWidth) return;
  const { dw, dh, dx, dy } = imageClipFit(
    clip,
    img.naturalWidth,
    img.naturalHeight,
    W,
    H,
  );
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Vẽ 1 sticker — mirror buildStickerOverlay: tâm (W*x, H*y), rộng scale*W. */
function drawStickerClip(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  clip: StickerClip,
) {
  const { width: W, height: H } = spec.meta;
  const img = stickerImageFor(clip.src);
  if (!img || !img.complete || !img.naturalWidth) return;
  const sv = stickerVisual(clip, W, H);
  const hPx = (sv.wPx * img.naturalHeight) / img.naturalWidth;
  ctx.save();
  ctx.globalAlpha = clamp(sv.opacity, 0, 1);
  ctx.translate(sv.cx, sv.cy);
  if (sv.rotation) ctx.rotate((sv.rotation * Math.PI) / 180);
  ctx.drawImage(img, -sv.wPx / 2, -hPx / 2, sv.wPx, hPx);
  ctx.restore();
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

  // R1-060/061: thứ tự composite KHỚP render.js: video → image → sticker → text.
  // (Trước đây duyệt theo thứ tự track trong spec — sai khi text track nằm dưới video.)
  for (const track of spec.tracks) {
    if (track.hidden || track.kind !== "video") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "video") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    }
  }
  for (const track of spec.tracks) {
    if (track.hidden || track.kind !== "image") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "image") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      drawImageClip(ctx, spec, pool, mediaByName, clip);
    }
  }
  for (const track of spec.tracks) {
    if (track.hidden || track.kind !== "sticker") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "sticker") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      drawStickerClip(ctx, spec, clip);
    }
  }
  for (const track of spec.tracks) {
    if (track.hidden || track.kind !== "text") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "text") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      drawTextClip(ctx, spec, track.id, clip, t, selected?.clipId === clip.id);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Đồng bộ các phần tử video/audio với playhead (transport: seek/play/pause/
 * playbackRate) + đẩy gain mục tiêu vào AudioEngine (R1-063).
 *
 * Gain đi qua Web Audio GainNode nên volume/fadeIn/fadeOut/volumeKeyframes/mute
 * được áp chính xác như render worker. `forceSeek=true` (khi vừa bấm play)
 * buộc seek chính xác mọi source trong cùng 1 task — "start cùng lúc, offset chuẩn".
 */
interface ActiveMedia {
  el: HTMLVideoElement | HTMLAudioElement;
  target: number;
  speed: number;
  reverse: boolean;
}

/**
 * Thu thập các element media đang active tại t + audio sources cho engine.
 * Dùng chung cho cả syncMedia (khi phát) và Seeker (khi pause/seek, R1-062).
 */
function collectActives(
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  t: number,
): { actives: ActiveMedia[]; audioSources: ActiveAudioSource[] } {
  const actives: ActiveMedia[] = [];
  const audioSources: ActiveAudioSource[] = [];
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
      const elapsed = t - clip.start;
      if (track.kind === "video" && clip.kind === "video" && item.kind === "video") {
        const el = pool.videoFor(item);
        if (el) {
          actives.push({ el, target, speed, reverse });
          // R1-063: audio kế thừa qua engine. Render bỏ audio khi track muted
          // hoặc sourceAudioMode="mute" → preview gain 0 cho khớp.
          // R1-076: truyền audioEffects (bass/treble/compressor) cho preview.
          const vclip = clip as VideoClip;
          const gain = (track.muted || (vclip.sourceAudioMode ?? "inherit") === "mute") ? 0 : 1;
          audioSources.push({ el, gain, fx: toPreviewFx(vclip.audioEffects) });
        }
      } else if (track.kind === "audio" && clip.kind === "audio" && item.kind === "audio") {
        const el = pool.audioFor(item);
        if (el) {
          actives.push({ el, target, speed, reverse });
          // R1-063: gain = volume × fadeIn × fadeOut × volumeKeyframes × mute (khớp render).
          // R1-076: truyền audioEffects (bass/treble/compressor) cho preview.
          audioSources.push({
            el,
            gain: computeClipGain(clip, elapsed, !!track.muted),
            fx: toPreviewFx(clip.audioEffects),
          });
        }
      }
    }
  }
  return { actives, audioSources };
}

/**
 * Đồng bộ các phần tử video/audio với playhead (transport: seek/play/pause/
 * playbackRate) + đẩy gain mục tiêu vào AudioEngine (R1-063).
 *
 * Gain đi qua Web Audio GainNode nên volume/fadeIn/fadeOut/volumeKeyframes/mute
 * được áp chính xác như render worker. `forceSeek=true` (khi vừa bấm play)
 * buộc seek chính xác mọi source trong cùng 1 task — "start cùng lúc, offset chuẩn".
 *
 * R1-062: khi pause, hàm này KHÔNG set currentTime trực tiếp nữa — việc seek
 * chính xác do Seeker đảm nhiệm (pause all → seek → chờ `seeked` → vẽ frame),
 * tránh hiển thị frame cũ do seek bất đồng bộ.
 */
function syncMedia(
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  t: number,
  playing: boolean,
  engine: AudioEngine,
  forceSeek: boolean,
) {
  const { actives, audioSources } = collectActives(spec, pool, mediaByName, t);
  const seen = new Set<HTMLVideoElement | HTMLAudioElement>();
  for (const a of actives) {
    if (seen.has(a.el)) continue;
    seen.add(a.el);
    // R1-063: KHÔNG gán el.volume ở đây nữa — AudioEngine nắm toàn quyền gain
    // qua GainNode (tránh nhân đôi). Trường hợp fallback (không có Web Audio),
    // engine.update() tự gán el.volume.
    // R1-013: đồng bộ playbackRate với clip.speed (giữ cao độ như render dùng atempo)
    try {
      if (a.el.playbackRate !== a.speed) a.el.playbackRate = a.speed;
      // preservesPitch=true giữ cao độ khi đổi tốc độ (giống atempo của render)
      if ("preservesPitch" in a.el) (a.el as HTMLVideoElement).preservesPitch = true;
    } catch {
      /* bỏ qua nếu trình duyệt không hỗ trợ */
    }
    if (playing) {
      // R1-063: forceSeek khi vừa bấm play → seek chính xác mọi source rồi mới phát,
      // các source "start cùng lúc với offset chính xác". Khi đang phát bình thường
      // chỉ re-seek khi drift > 0.35s để tránh giật.
      if (forceSeek || Math.abs(a.el.currentTime - a.target) > 0.35) {
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
      // R1-062: chỉ pause ở đây. Seek chính xác do Seeker xử lý (lib/seek.ts):
      // pause all -> set currentTime đã snap -> chờ `seeked` -> vẽ frame.
      // Không gán currentTime trực tiếp nữa để tránh vẽ frame cũ khi seek
      // bất đồng bộ chưa xong.
      a.el.pause();
    }
  }
  // R1-063: đẩy gain vào Web Audio graph (mượt bằng setTargetAtTime) + VU meter.
  engine.update(audioSources);
  if (!playing) pool.pauseAll();
}

/**
 * K5: bật/tắt fullscreen cho khung preview. Khung preview có id cố định
 * để phím F (xử lý ở App) cũng gọi được mà không cần prop drilling.
 * Canvas tự co theo wrap mỗi frame nên fullscreen không cần resize tay.
 */
export function togglePreviewFullscreen(): void {
  const el = document.getElementById("vcut-preview-wrap");
  if (!el) return;
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void el.requestFullscreen?.();
  }
}

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // K5: trạng thái fullscreen (đổi icon nút) + số clip để hiện gợi ý khi trống.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const clipCount = useStore((s) =>
    s.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
  );
  const poolRef = useRef<MediaPool | null>(null);
  const dragRef = useRef<{ trackId: string; clipId: string; dx: number; dy: number } | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const vuBarRef = useRef<HTMLDivElement>(null);
  const prevPlayingRef = useRef(false);
  // R1-062: seek chính xác khi pause/scrub.
  const seekerRef = useRef<Seeker | null>(null);
  const lastDrawnTRef = useRef<number | null>(null);
  const lastRequestedTRef = useRef<number | null>(null);
  if (!seekerRef.current) seekerRef.current = new Seeker();
  if (!poolRef.current) poolRef.current = new MediaPool();
  if (!engineRef.current) {
    // R1-063: Web Audio graph cho preview audio. VU meter cập nhật trực tiếp
    // style (không qua React state) để tránh re-render 12 lần/giây.
    engineRef.current = new AudioEngine({
      onLevel: (rms) => {
        const bar = vuBarRef.current;
        if (bar) bar.style.transform = `scaleX(${clamp(rms * 1.6, 0, 1).toFixed(3)})`;
      },
    });
  }

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
      // R1-063: mở AudioContext khi phát (nút play = user gesture).
      const engine = engineRef.current!;
      if (playing) engine.ensure();
      // Phát hiện cạnh lên của playing → force seek chính xác mọi source.
      const forceSeek = playing && !prevPlayingRef.current;
      prevPlayingRef.current = playing;
      if (playing) {
        // Đang phát: hủy seek dở của Seeker, đồng bộ như cũ, vẽ mỗi frame.
        seekerRef.current!.cancel();
        syncMedia(spec, pool, mediaByName, t, true, engine, forceSeek);
        renderFrame(ctx, spec, pool, mediaByName, t, computeViewport(cw, ch, spec), useStore.getState().selection[0] ?? null);
        lastDrawnTRef.current = t;
        lastRequestedTRef.current = t;
      } else {
        // R1-062: pause/scrub — gain engine vẫn cập nhật theo playhead, nhưng
        // frame CHỈ vẽ sau khi seek mới nhất hoàn tất (chờ `seeked`):
        //  - debounce: kéo nhanh -> chỉ seek 1 lần khi thả tay,
        //  - latest-wins: seek cũ bị hủy, không vẽ frame sai,
        //  - trong lúc chờ, canvas giữ nguyên frame tĩnh (không nhấp nháy).
        syncMedia(spec, pool, mediaByName, t, false, engine, false);
        if (t !== lastDrawnTRef.current) {
          lastRequestedTRef.current = t;
          void seekerRef.current!.request(t, (tt) => {
            const { actives } = collectActives(spec, pool, mediaByName, tt);
            const targets: SeekTarget[] = actives.map((a) => ({
              el: a.el,
              target: a.target,
              label: a.el instanceof HTMLVideoElement ? "video" : "audio",
            }));
            // seekAll: pause TẤT CẢ trước, seek audio+video đồng thời.
            return seekAll(targets, { fps: spec.meta.fps });
          }).then((outcome) => {
            if (!outcome.cancelled && outcome.ok && lastRequestedTRef.current === t) {
              renderFrame(ctx, spec, pool, mediaByName, t, computeViewport(cw, ch, spec), useStore.getState().selection[0] ?? null);
              lastDrawnTRef.current = t;
            }
          });
        }
      }
    };
    raf = requestAnimationFrame(loop);
    // R1-063: dự phòng — nếu AudioContext vẫn suspended (trình duyệt chặn resume
    // ngoài gesture), gesture tiếp theo sẽ mở nó.
    const kickAudio = () => engineRef.current?.ensure();
    window.addEventListener("pointerdown", kickAudio);
    window.addEventListener("keydown", kickAudio);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", kickAudio);
      window.removeEventListener("keydown", kickAudio);
    };
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
    const { width: W, height: H } = st.spec.meta;
    // duyệt ngược để chữ trên cùng trúng trước
    for (let i = st.spec.tracks.length - 1; i >= 0; i--) {
      const track = st.spec.tracks[i];
      if (track.kind !== "text") continue;
      for (let j = track.clips.length - 1; j >= 0; j--) {
        const clip = track.clips[j];
        if (clip.kind !== "text") continue;
        if (t < clip.start || t >= clip.start + clip.duration) continue;
        // R1-061: hit-test tại đúng vị trí visual (kể cả khi animation đang chạy).
        ctx.font = textFont(clip);
        const textW = Math.max(1, ctx.measureText(clip.text || " ").width);
        const textH = clip.style.fontSize * 1.35;
        const vis = textClipVisual(clip, t - clip.start, W, H, { textW, textH });
        const w = textW + 24;
        const h = textH + 16;
        if (Math.abs(p.x - vis.cx) <= w / 2 && Math.abs(p.y - vis.cy) <= h / 2) {
          return { clip, trackId: track.id, x: vis.cx, y: vis.cy, w, h };
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

  // K5: theo dõi fullscreen để đổi tiêu đề nút (listener gắn 1 lần).
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  return (
    <div ref={wrapRef} className="preview-wrap" id="vcut-preview-wrap">
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      {/* R1-063: VU meter đơn giản — mức tín hiệu sau master gain */}
      <div className="vu-meter" title="Mức âm thanh preview">
        <div ref={vuBarRef} className="vu-meter-fill" />
      </div>
      {/* K5: nút fullscreen góc trên-phải (phím F cũng bật/tắt được). */}
      <button
        className="preview-fs-btn"
        title={isFullscreen ? "Thoát toàn màn hình (F)" : "Xem toàn màn hình (F)"}
        aria-label={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
        onClick={togglePreviewFullscreen}
      >
        <span aria-hidden="true">⛶</span>
      </button>
      {/* K5: gợi ý khi project chưa có clip nào — không chặn thao tác (pointer-events: none). */}
      {clipCount === 0 && (
        <div className="preview-empty-hint" aria-hidden="true">
          <div className="preview-empty-title">Chưa có clip nào</div>
          <div>Nhập file vào thư viện, rồi kéo thả vào timeline để bắt đầu.</div>
        </div>
      )}
    </div>
  );
}
