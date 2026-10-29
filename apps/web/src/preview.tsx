/**
 * Preview canvas: vẽ từng frame theo playhead bằng Canvas 2D,
 * đồng bộ phát lại video/audio thật, hỗ trợ kéo chữ trực tiếp.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { TextClip, VideoClip, VideoSpec } from "@repo-1/video-spec";
import { interpolateMaskAt, isSpeedable, stickerUrl } from "@repo-1/video-spec";
import type { ImageClip, StickerClip } from "@repo-1/video-spec";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { MediaPool } from "./media";
import { clamp } from "./lib";
import { seekAll, Seeker, type SeekTarget } from "./lib/seek";
import { AudioEngine, computeClipGain, toPreviewFx } from "./lib/audioEngine";
import type { ActiveAudioSource } from "./lib/audioEngine";
import {
  MOTION_BLUR_PREVIEW_ENABLED,
  motionBlurBlendPlan,
  applyChromaKey,
  applyMask,
  imageClipFit,
  interpolateTrackPoints,
  isParityTextAnimation,
  letterboxFit,
  motionBadgeText,
  normalizeMotion,
  rampSourceTimeAt,
  rampSpeedAt,
  stickerVisual,
  textClipVisual,
  videoClipVisual,
  videoElementPlacement,
  type ChromaParams,
} from "./lib/previewEngine";
import {
  radialGradientWeight,
  radialSoftWeight,
  transitionClipVisual,
  type TransitionLayerSpec,
} from "./lib/transitionPreview";
import { ffmpegDissolveFrand } from "./lib/dissolveFrand";
import { applyWebglLut, getLutBadge } from "./lib/webglLut";
import {
  applyCanvasEffects,
  canvasEffectOps,
  type CanvasEffectOp,
} from "./lib/effectCanvas";
// N5 (Phase 9): preview dùng spec đã làm phẳng nested + gộp adjustment
// (xem apps/web/src/lib/NESTED_PREVIEW_LIMITS.md). Chỉ luồng này sửa preview.tsx.
import { buildPreviewSpec } from "./lib/nestedPreview";
import { MixerMeter } from "./components/MixerMeter";

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

// ---- Canvas effects: 8 effect vẽ thật bằng pixel shader (V2, Phase 9 đợt 10) ----
// Render áp effects trong filter chain; preview trước đây bỏ qua 8 type này
// vì không có CSS tương đương. Nay vẽ thật lên offscreen canvas ở kích
// thước letterbox dw×dh, sau chroma/LUT và trước mask/SR/opacity (thứ tự
// transform giữ nguyên). CSS filter vẫn giữ nguyên cho các effect đã có.
// LƯU Ý: canvas effects luôn chạy TRƯỚC CSS filter bất kể thứ tự trong
// clip.effects (xem EFFECT_CANVAS_LIMITS.md §3); không có document thì
// trả null và frame đó giữ đường vẽ cũ (effect bị bỏ qua ở frame đó).
let effectCanvas: HTMLCanvasElement | null = null;

function effectCanvasSource(
  src: CanvasImageSource,
  w: number,
  h: number,
  ops: readonly CanvasEffectOp[],
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (ops.length === 0) return null;
  if (!effectCanvas) effectCanvas = document.createElement("canvas");
  const cw = Math.max(2, Math.round(w));
  const ch = Math.max(2, Math.round(h));
  if (effectCanvas.width !== cw || effectCanvas.height !== ch) {
    effectCanvas.width = cw;
    effectCanvas.height = ch;
  }
  const cctx = effectCanvas.getContext("2d", { willReadFrequently: true });
  if (!cctx) return null;
  cctx.clearRect(0, 0, cw, ch);
  cctx.drawImage(src, 0, 0, cw, ch);
  const img = cctx.getImageData(0, 0, cw, ch);
  applyCanvasEffects(img, ops);
  cctx.putImageData(img, 0, 0);
  return effectCanvas;
}

// ---- Mask: unit offscreen + pixel shader (Q1 Phase 8) ----
// Render áp mask lên unit đã letterbox về W×H, trước SR/overlay (mask.js).
// Preview mirror đúng thứ tự đó: vẽ nội dung đã letterbox vào offscreen
// unit (đã gồm cssFilter LUT/effects + chroma), nhân alpha bằng
// applyMask (cùng công thức geq), rồi composite unit lên canvas chính
// (có hoặc không có transform SR). Unit giới hạn 640px chiều rộng như
// chroma (giữ 30fps): feather co giãn theo tỉ lệ nên độ mềm tương đối
// giữ nguyên; viền cứng bị mềm ~hệ số phóng đại khi upscale (xem LIMITS).
const MASK_MAX_W = 640;
let maskCanvas: HTMLCanvasElement | null = null;

function maskedUnitSource(
  drawSrc: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  cssFilter: string,
  mask: NonNullable<VideoClip["mask"]>,
  W: number,
  H: number,
  // Phase 9 D4: thời gian cục bộ của clip (giây, 0 = clip.start) — mask có
  // keyframes thì nội suy hình học tại localT, khớp thời gian của video
  // mask animation trong render (unit bắt đầu PTS 0). Không keyframe thì
  // interpolateMaskAt trả đúng giá trị tĩnh, không đổi hành vi cũ.
  localT: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!maskCanvas) maskCanvas = document.createElement("canvas");
  const s = Math.min(1, MASK_MAX_W / W);
  const w = Math.max(2, Math.round(W * s));
  const h = Math.max(2, Math.round(H * s));
  if (maskCanvas.width !== w || maskCanvas.height !== h) {
    maskCanvas.width = w;
    maskCanvas.height = h;
  }
  const mctx = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!mctx) return null;
  mctx.clearRect(0, 0, w, h);
  setCtxFilter(mctx, cssFilter);
  mctx.drawImage(drawSrc, dx * s, dy * s, dw * s, dh * s);
  setCtxFilter(mctx, "");
  const img = mctx.getImageData(0, 0, w, h);
  // Phase 9 D4: nội suy mask theo thời gian (mask tĩnh → giữ nguyên).
  const effMask = mask.keyframes?.length
    ? { ...mask, ...interpolateMaskAt(mask, localT) }
    : mask;
  applyMask(img, effMask);
  mctx.putImageData(img, 0, 0);
  return maskCanvas;
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

// ---- Motion blur preview: blend tmix xấp xỉ (S4 đợt 8; M2 đợt 9; T1 đợt 12) ----
// Render áp motion blur thật bằng tmix (trung bình có trọng số các frame
// nguồn). Đợt 8–9 preview xấp xỉ bằng trail ghost vẽ DƯỚI frame hiện
// tại — và đợt 11 (luồng P5) phát hiện trail đó là BUG SẢN PHẨM: frame
// video đục vẽ đè lên trên nên ghost bị che kín hoàn toàn, hệ số ghost
// thực tế = 0 ở mọi pixel frame hiện tại phủ (xem GHOSTBLEND_T1_LIMITS.md
// §1, probe đo pixel trước/sau). Đợt 12 sửa ngữ nghĩa: KHÔNG vẽ ghost
// dưới frame đục nữa; composite TẤT CẢ frame (ghost + hiện tại) vào 1
// lớp offscreen bằng kế hoạch motionBlurBlendPlan (alpha chạy cho đúng
// trung bình có trọng số Σ wᵢ·Fᵢ), rồi vẽ lớp đó 1 lần lên canvas chính
// với opacity của clip. Như vậy ghost LỘ RA đúng tỉ lệ weights, và frame
// không có ghost vẫn vẽ trực tiếp như cũ (không qua lớp, không đổi).
// Snapshot lưu NỘI DUNG đã vẽ của đường đó (drawSrc letterbox cho đường
// thường/SR, unit đã mask cho đường mask), còn VỊ TRÍ vẽ lấy đúng
// transform của đường đó tại frame hiện tại — vì vậy ghost mask/SR bám
// đúng hình bao/transform hiện tại, nhưng nội dung bóng là frame cũ
// (không nội suy lại mask/SR theo thời gian của bóng đó — xem LIMITS).
// Image/text clip không có field motion trong spec nên không có ghost
// (chỉ video clip).
// Ring buffer: mỗi clip giữ tối đa frames-1 snapshot (tối đa 7, ứng
// frames tối đa 8); canvas cũ nhất được TÁI DÙNG khi đầy (tránh cấp phát
// mỗi frame). Đổi frames → mảng tự cắt ngắn ở lần cập nhật sau. Giới hạn
// 16 clip để không rò bộ nhớ (FIFO, xoá cũ nhất); trường hợp xấu nhất
// 16 clip × 7 snapshot × canvas khung hình — thực tế chỉ clip đang hiển
// thị mới tạo snapshot. Đổi đường vẽ (mask on/off) giữa chừng có thể
// trộn snapshot khác kích thước/loại trong 1-2 frame chuyển tiếp (vẽ
// co giãn theo đích, thoáng qua, rồi ring ổn định lại) — xem LIMITS.
// Lớp blend dùng chung 1 canvas W×H, tái dùng mỗi lần vẽ (vẽ đồng bộ,
// không await bên trong nên không tranh chấp giữa các clip); snapshot
// của frame hiện tại vẫn lưu NỘI DUNG GỐC chưa blend (drawSrc/unit),
// không lưu lớp blend — nếu không frame sau sẽ blend trên nền đã mờ
// sẵn (mờ kép, sai weights).
const MOTION_BLUR_MAX_CLIPS = 16;
const motionBlurSnapshots = new Map<string, HTMLCanvasElement[]>();

function updateMotionBlurSnapshots(
  clipId: string,
  drawSrc: CanvasImageSource,
  dw: number,
  dh: number,
  maxGhosts: number,
): void {
  if (typeof document === "undefined" || maxGhosts <= 0) return;
  let arr = motionBlurSnapshots.get(clipId);
  if (!arr) {
    if (motionBlurSnapshots.size >= MOTION_BLUR_MAX_CLIPS) {
      const oldest = motionBlurSnapshots.keys().next().value;
      if (oldest !== undefined) motionBlurSnapshots.delete(oldest);
    }
    arr = [];
    motionBlurSnapshots.set(clipId, arr);
  }
  while (arr.length > maxGhosts) arr.shift();
  // Đầy ring → tái dùng canvas cũ nhất (tránh cấp phát mỗi frame).
  let snap: HTMLCanvasElement;
  if (arr.length >= maxGhosts) {
    snap = arr.shift()!;
  } else {
    snap = document.createElement("canvas");
  }
  if (snap.width !== Math.round(dw) || snap.height !== Math.round(dh)) {
    snap.width = Math.max(2, Math.round(dw));
    snap.height = Math.max(2, Math.round(dh));
  }
  const sctx = snap.getContext("2d");
  if (!sctx) return;
  sctx.clearRect(0, 0, snap.width, snap.height);
  sctx.drawImage(drawSrc, 0, 0, snap.width, snap.height);
  arr.push(snap);
}

let motionBlurLayer: HTMLCanvasElement | null = null;

/**
 * Composite blend tmix cho 1 đường vẽ video (đợt 12, thay drawMotionBlurGhosts
 * cũ đã bị xoá — vẽ ghost dưới frame đục thì ghost = 0, xem header trên).
 * Vẽ các bóng ghost (snapshot mới nhất, cũ nhất → mới nhất) + frame hiện
 * tại lên lớp offscreen W×H theo kế hoạch motionBlurBlendPlan, rồi vẽ lớp
 * đó 1 lần lên ctx chính — caller đã đặt globalAlpha (= opacity clip) và
 * filter = "" trên ctx trước khi gọi (lớp đã mang filter từng frame, vẽ
 * lớp mà còn filter thì filter bị áp 2 lần).
 * drawFrame(target, snap): vẽ 1 frame lên target; snap != null = bóng
 * ghost, snap == null = frame hiện tại (caller tự chọn nguồn hiện tại:
 * drawSrc hay unit đã mask). drawFrame tự lo transform/filter của đường
 * vẽ đó trên target (save/restore bên trong); helper save/restore quanh
 * mỗi frame để alpha/filter không rò sang frame khác.
 * Trả về true khi đã vẽ blend xong (caller cập nhật snapshot + vignette
 * rồi return); false khi chưa có bóng dùng được (ring rỗng, weights < 2,
 * không có document/context) — khi đó caller vẽ trực tiếp frame hiện
 * tại như cũ, KHÔNG có ghost nào bị bỏ sót (false chỉ xảy ra khi không
 * có bóng để vẽ). Lớp blend được xoá trắng mỗi lần gọi; snapshot lưu
 * sau đó vẫn là nội dung gốc chưa blend (do caller cập nhật).
 */
function drawMotionBlurBlended(
  ctx: CanvasRenderingContext2D,
  clipId: string,
  weights: readonly number[],
  W: number,
  H: number,
  drawFrame: (target: CanvasRenderingContext2D, snap: HTMLCanvasElement | null) => void,
): boolean {
  const arr = motionBlurSnapshots.get(clipId);
  if (!arr || arr.length === 0 || weights.length < 2 || typeof document === "undefined") return false;
  const plan = motionBlurBlendPlan(weights, arr.length);
  if (plan.length < 2) return false;
  if (!motionBlurLayer) motionBlurLayer = document.createElement("canvas");
  if (motionBlurLayer.width !== W || motionBlurLayer.height !== H) {
    motionBlurLayer.width = Math.max(2, Math.round(W));
    motionBlurLayer.height = Math.max(2, Math.round(H));
  }
  const lctx = motionBlurLayer.getContext("2d");
  if (!lctx) return false;
  lctx.clearRect(0, 0, motionBlurLayer.width, motionBlurLayer.height);
  const snaps = arr.slice(arr.length - (plan.length - 1));
  for (let i = 0; i < snaps.length; i++) {
    lctx.save();
    lctx.globalAlpha = plan[i].blendAlpha;
    setCtxFilter(lctx, "");
    drawFrame(lctx, snaps[i]);
    lctx.restore();
  }
  lctx.save();
  lctx.globalAlpha = plan[plan.length - 1].blendAlpha;
  setCtxFilter(lctx, "");
  drawFrame(lctx, null);
  lctx.restore();
  ctx.drawImage(motionBlurLayer, 0, 0, W, H);
  return true;
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

/**
 * Đo layout dòng karaoke: từng từ + khoảng trắng sau (trừ từ cuối).
 * Phase 9 R4 — preview xấp xỉ ở mức từ (từ đổi màu nguyên từ khi tới lượt),
 * trong khi render ASS \k quét màu mịn hơn; vị trí từ và màu từ nào đã qua
 * thì khớp.
 */
function karaokeLayout(
  ctx: CanvasRenderingContext2D,
  clip: TextClip,
): { widths: number[]; totalW: number } {
  const words = clip.karaoke!;
  ctx.font = textFont(clip);
  const widths = words.map((w, i) =>
    ctx.measureText(w.word + (i < words.length - 1 ? " " : "")).width
  );
  return { widths, totalW: widths.reduce((a, b) => a + b, 0) };
}

/** Vẽ 1 dòng karaoke đã đo layout: từng từ đổi sang màu highlight khi tới lượt. */
function drawKaraokeWords(
  ctx: CanvasRenderingContext2D,
  clip: TextClip,
  localT: number,
  cx: number,
  cy: number,
  layout: { widths: number[]; totalW: number },
): void {
  const s = clip.style;
  const hi = s.highlightColor ?? "#ffff00";
  const words = clip.karaoke!;
  ctx.font = textFont(clip);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let x = cx - layout.totalW / 2;
  for (let i = 0; i < words.length; i++) {
    ctx.fillStyle = localT >= words[i].start ? hi : s.color;
    ctx.fillText(words[i].word, x, cy);
    x += layout.widths[i];
  }
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
  // Khớp render: typewriter thắng karaoke (clip vừa có karaoke vừa bật
  // typewriter thì render vẽ typewriter, preview cũng vậy).
  const hasKaraoke =
    clip.style.animation !== "typewriter" &&
    Array.isArray(clip.karaoke) &&
    clip.karaoke.length > 0;
  // Đo chữ để textClipVisual tính vị trí (mirror drawtext dùng text_w/text_h).
  ctx.font = textFont(clip);
  const textW = Math.max(1, ctx.measureText(clip.text || " ").width);
  const textH = clip.style.fontSize * 1.35;
  const vis = textClipVisual(clip, localT, W, H, { textW, textH });
  // Phase 9 D3: text có track → tâm dòng chữ bám quỹ đạo (cùng nội suy
  // sticker). Typewriter/karaoke vẽ bằng ASS ở render nên preview cũng giữ
  // vị trí tĩnh cho khớp (validator cảnh báo track bị bỏ qua ở render).
  if (clip.track && clip.style.animation !== "typewriter" && !hasKaraoke &&
      !isParityTextAnimation(clip.style.animation)) {
    const pos = interpolateTrackPoints(clip.track.points, localT);
    vis.cx = pos.x * W;
    vis.cy = pos.y * H;
  }
  let text = clip.text;
  if (vis.revealChars != null) {
    text = [...text].slice(0, vis.revealChars).join("");
  }
  // Hộp nền + outline: box có padding như cũ, đặt tại tâm vis.
  // Karaoke: box ôm theo chiều rộng dòng từ (thay vì clip.text — hai chuỗi
  // này thường giống nhau nhưng đo từ karaoke mới khớp vị trí vẽ từng từ).
  const kaLayout = hasKaraoke ? karaokeLayout(ctx, clip) : null;
  const boxW = (kaLayout ? kaLayout.totalW : textW) + 24;
  const boxH = textH + 16;

  // P1 (Phase 7): clip SR — vẽ qua transform translate→rotate→scale quanh
  // tâm hình bao (mirror nhánh PNG SR của render: PNG đã xoay quanh tâm,
  // overlay đặt hình bao). Box + chữ vẽ tại gốc sau transform.
  if (vis.sr) {
    ctx.save();
    ctx.globalAlpha = clamp(vis.alpha, 0, 1);
    ctx.translate(vis.cx, vis.cy);
    if (vis.rotationDeg) ctx.rotate((vis.rotationDeg * Math.PI) / 180);
    if (vis.scale !== 1) ctx.scale(vis.scale, vis.scale);
    if (s.backgroundColor) {
      ctx.fillStyle = s.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
      ctx.fill();
    }
    if (kaLayout) {
      drawKaraokeWords(ctx, clip, localT, 0, 0, kaLayout);
    } else {
      ctx.font = textFont(clip);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = s.color;
      ctx.fillText(text, 0, 0);
    }
    ctx.restore();
    if (selected) {
      ctx.save();
      ctx.strokeStyle = "#8b7cf6";
      ctx.lineWidth = 2 / computeScaleHack(ctx);
      ctx.setLineDash([8, 6]);
      // Outline theo hình bao đã xoay (xấp xỉ trục song song, xem LIMITS).
      const ow = vis.bboxW ?? boxW;
      const oh = vis.bboxH ?? boxH;
      ctx.strokeRect(vis.cx - ow / 2, vis.cy - oh / 2, ow, oh);
      ctx.restore();
    }
    return;
  }

  ctx.save();
  ctx.globalAlpha = clamp(vis.alpha, 0, 1);
  // V4 (Phase 9 đợt 10): parity transform — mirror ASS \fr/\fax/\clip:
  // cắt theo clipRect (tọa độ khung) rồi xoay/nghiêng quanh TÂM chữ
  // (Alignment 5 của ASS, \pos = tâm). Không có transform thì vẽ như cũ.
  if (vis.clipRect) {
    ctx.beginPath();
    ctx.rect(vis.clipRect.x, vis.clipRect.y, vis.clipRect.w, vis.clipRect.h);
    ctx.clip();
  }
  const parityTransform =
    (vis.rotationDeg ?? 0) !== 0 || (vis.skewXDeg ?? 0) !== 0;
  if (parityTransform) {
    ctx.translate(vis.cx, vis.cy);
    if (vis.rotationDeg) ctx.rotate((vis.rotationDeg * Math.PI) / 180);
    if (vis.skewXDeg) {
      ctx.transform(1, 0, Math.tan((vis.skewXDeg * Math.PI) / 180), 1, 0, 0);
    }
  }
  const bx = parityTransform ? -boxW / 2 : vis.cx - boxW / 2;
  const by = parityTransform ? -boxH / 2 : vis.cy - boxH / 2;
  const tx = parityTransform ? 0 : vis.cx;
  const ty = parityTransform ? 0 : vis.cy;
  if (s.backgroundColor) {
    ctx.fillStyle = s.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 10);
    ctx.fill();
  }
  if (kaLayout) {
    drawKaraokeWords(ctx, clip, localT, tx, ty, kaLayout);
  } else {
    ctx.font = textFont(clip);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = s.color;
    ctx.fillText(text, tx, ty);
  }
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

/**
 * V1 (Phase 9 đợt 10): vẽ 1 video clip kèm hình học transition
 * (wipe/slide/circle/…). Bọc drawVideoClip: khi clip đang trong cửa sổ
 * transition có hình học thì save → clip theo vùng + trượt/scale → vẽ →
 * restore. Type fade / type lạ / ngoài cửa sổ → vẽ thường (alpha đã xử
 * lý trong drawVideoClip qua transitionClipVisual).
 */
function drawVideoClipWithTransition(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  clip: VideoClip,
  t: number,
) {
  const { width: W, height: H } = spec.meta;
  const tv = transitionClipVisual(clip, t - clip.start, W, H);
  if (!tv.geometric || !tv.layer) {
    drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    return;
  }
  // Phase 9 đợt 13 (C1): lớp radial-gradient (circleopen/circleclose)
  // không biểu diễn được bằng clip path — vẽ clip lên canvas offscreen
  // rồi áp mask alpha xuyên tâm (destination-in) trước khi đưa lên ctx
  // chính. Trượt/scale của lớp áp lên offscreen trước khi mask, vì mask
  // nằm trong không gian khung hình. Đợt 15 T6: radial-soft
  // (circle-soft) dùng chung đường mask này, chỉ khác hàm trọng số
  // (tuyến tính thay vì smoothstep — xem drawVideoClipWithRadialMask).
  if (tv.layer.region?.kind === "radial-gradient" || tv.layer.region?.kind === "radial-soft") {
    drawVideoClipWithRadialMask(ctx, spec, pool, mediaByName, clip, t, tv.layer, W, H);
    return;
  }
  // Phase 9 đợt 14 (R2): lớp dissolve-noise (không phải path) — vẽ
  // clip lên offscreen rồi áp mask alpha từng pixel theo
  // ffmpegDissolveFrand (khớp vf_xfade.c). Lớp mang sẵn cờ invert
  // (A: giữ frand >= p, B: giữ frand < p) nên mask không cần biết
  // window vào/ra — transitionClipVisual đã chọn đúng lớp.
  if (tv.layer.region?.kind === "dissolve-noise") {
    drawVideoClipWithDissolveMask(ctx, spec, pool, mediaByName, clip, t, tv.layer, W, H);
    return;
  }
  // Phase 9 đợt 15 (T2): lớp bars-fade không phải path — kind mang
  // p + bandW cho rasterizer composite (dải → B, nền → crossfade).
  // Canvas đơn clip chỉ có 1 clip nên không vẽ được crossfade:
  // vẽ dải cho clip vào (lớp B) / nền cho clip ra (lớp A) bằng
  // rects, đúng hành vi cũ trước khi đổi kind (không có nhánh này,
  // applyTransitionLayer sẽ clip theo path rỗng và clip biến mất).
  if (tv.layer.region?.kind === "bars-fade") {
    const { p, bandW } = tv.layer.region;
    const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (let k = 0; k * bandW < W; k++) {
      const x0 = k * bandW;
      const x1 = Math.min(W, x0 + p * bandW);
      const x2 = Math.min(W, (k + 1) * bandW);
      if (tv.window === "in") {
        if (x1 > x0) rects.push({ x: x0, y: 0, w: x1 - x0, h: H });
      } else if (x2 > x1) {
        rects.push({ x: x1, y: 0, w: x2 - x1, h: H });
      }
    }
    ctx.save();
    applyTransitionLayer(ctx, { ...tv.layer, region: { kind: "rects", rects } }, W, H);
    drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    ctx.restore();
    return;
  }
  ctx.save();
  applyTransitionLayer(ctx, tv.layer, W, H);
  drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
  ctx.restore();
}

/**
 * Vẽ 1 clip kèm mask alpha xuyên tâm (circleopen/circleclose, đợt 13 +
 * hiệu chuẩn đợt 14 R4; circle-soft từ đợt 15 T6). Alpha tại bán kính
 * chuẩn hoá rho tuân theo đường smoothstep của radialGradientWeight
 * (import từ transitionPreview): lớp B của open / lớp A của close
 * dùng w(rho), lớp còn lại dùng 1-w(rho) (inverted). Với radial-soft
 * (circle-soft), w là đường tuyến tính của radialSoftWeight
 * (center/width của vùng) thay vì smoothstep. Tâm/rMax của mask lấy
 * từ vùng (tâm cắt nguyên của FFmpeg cho radial-gradient, tâm W/2
 * cho radial-soft — xem transitionPreview). Mask lấy mẫu 64 điểm
 * dừng — sai số nội suy < 0.001 trọng số (gradient mượt) và ≤
 * 0.15/64 ≈ 0.0024 cho viền mềm tuyến tính, không đáng kể so với
 * lượng tử hoá 8-bit.
 */
function drawVideoClipWithRadialMask(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  clip: VideoClip,
  t: number,
  layer: TransitionLayerSpec,
  W: number,
  H: number,
): void {
  const region = layer.region;
  if (!region || (region.kind !== "radial-gradient" && region.kind !== "radial-soft")) return;
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(W));
  off.height = Math.max(1, Math.round(H));
  const octx = off.getContext("2d");
  if (!octx) {
    drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    return;
  }
  octx.save();
  if (layer.dx !== 0 || layer.dy !== 0) octx.translate(layer.dx, layer.dy);
  if (layer.scaleX !== 1 || layer.scaleY !== 1) {
    octx.translate(W / 2, H / 2);
    octx.scale(layer.scaleX, layer.scaleY);
    octx.translate(-W / 2, -H / 2);
  }
  drawVideoClip(octx, spec, pool, mediaByName, clip, t);
  octx.restore();
  // Mask alpha xuyên tâm (không gian khung hình, sau transform nội dung).
  const STOPS = 64;
  const grad = octx.createRadialGradient(
    region.cx, region.cy, 0,
    region.cx, region.cy, Math.max(1, region.rMax),
  );
  for (let i = 0; i <= STOPS; i++) {
    const rho = i / STOPS;
    const w =
      region.kind === "radial-soft"
        ? radialSoftWeight(region.center, region.width, rho)
        : radialGradientWeight(region.mid, rho);
    const a = (region.inverted ? 1 - w : w) * layer.alpha;
    grad.addColorStop(rho, `rgba(0,0,0,${a.toFixed(4)})`);
  }
  octx.save();
  octx.globalCompositeOperation = "destination-in";
  octx.fillStyle = grad;
  octx.fillRect(0, 0, off.width, off.height);
  octx.restore();
  ctx.drawImage(off, 0, 0);
}

/**
 * Cache mask dissolve phía B (1 frame gần nhất): 2 clip của cùng 1
 * cặp transition dùng chung trường frand, chỉ đảo ngược test giữ /
 * bỏ — tính frand 1 lần cho cả 2 clip thay vì 2 lần. Key gồm kích
 * thước khung + p + alpha lớp; p khác (duration vào/ra khác nhau)
 * thì tính lại, không dùng cache sai.
 */
let dissolveMaskCache: {
  key: string;
  totalAlpha: number;
  alphaB: Uint8ClampedArray;
} | null = null;

/**
 * Vẽ 1 clip kèm mask dissolve từng pixel (đợt 14 R2, theo
 * ffmpegDissolveFrand — khớp vf_xfade.c, không phải lưới ô như trước).
 * Lớp B (invert=false) giữ pixel frand < p; lớp A (invert=true)
 * giữ pixel frand >= p. Mask tính ở độ phân giải khung hình đầy
 * đủ nên chi phí ~1 lần duyệt pixel có sin/frame (đo Node: ~158ms
 * tại 1920×1080 — chỉ trong các frame dissolve, thường ≤ 1s; xem
 * LIMITS đợt 14 R2 §6, nợ tối ưu cache/worker).
 */
function drawVideoClipWithDissolveMask(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  clip: VideoClip,
  t: number,
  layer: TransitionLayerSpec,
  W: number,
  H: number,
): void {
  const region = layer.region;
  if (!region || region.kind !== "dissolve-noise") return;
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(W));
  off.height = Math.max(1, Math.round(H));
  const octx = off.getContext("2d");
  if (!octx) {
    drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    return;
  }
  octx.save();
  if (layer.dx !== 0 || layer.dy !== 0) octx.translate(layer.dx, layer.dy);
  if (layer.scaleX !== 1 || layer.scaleY !== 1) {
    octx.translate(W / 2, H / 2);
    octx.scale(layer.scaleX, layer.scaleY);
    octx.translate(-W / 2, -H / 2);
  }
  drawVideoClip(octx, spec, pool, mediaByName, clip, t);
  octx.restore();
  const p = region.p;
  const totalAlpha = Math.max(0, Math.min(255, Math.round(255 * layer.alpha)));
  const key = `${off.width}x${off.height}:p=${p}:a=${totalAlpha}`;
  let alphaB = dissolveMaskCache?.key === key ? dissolveMaskCache.alphaB : null;
  if (!alphaB) {
    alphaB = new Uint8ClampedArray(off.width * off.height);
    for (let y = 0; y < off.height; y++) {
      for (let x = 0; x < off.width; x++) {
        alphaB[y * off.width + x] = ffmpegDissolveFrand(x, y) < p ? totalAlpha : 0;
      }
    }
    dissolveMaskCache = { key, totalAlpha, alphaB };
  }
  const img = octx.getImageData(0, 0, off.width, off.height);
  const data = img.data;
  const invert = region.invert;
  // Nhân (không thay) alpha sẵn có của clip — tương đương
  // destination-in của mask radial: clip có opacity/keyframe alpha
  // thấp vẫn giữ đúng tỉ lệ, pixel bị mask chỉ về 0.
  for (let i = 0, px = 0; i < data.length; i += 4, px++) {
    const mask = invert ? totalAlpha - alphaB[px] : alphaB[px];
    data[i + 3] =
      totalAlpha > 0 ? Math.round((data[i + 3] * mask) / totalAlpha) : 0;
  }
  octx.putImageData(img, 0, 0);
  ctx.drawImage(off, 0, 0);
}

/**
 * Áp 1 TransitionLayerSpec lên ctx: clip vùng trước, rồi trượt/scale.
 * Clip path luôn giao với khung hình trước để nội dung trượt không tràn
 * ra ngoài khung (preview canvas vẽ cả phần ngoài khung nếu không clip).
 * Vùng đảo (circle-inverted / polygon-inverted) dùng evenodd: rect khung
 * trừ hình — phần còn lại của khung vẫn vẽ được.
 */
function applyTransitionLayer(
  ctx: CanvasRenderingContext2D,
  layer: TransitionLayerSpec,
  W: number,
  H: number,
): void {
  const r = layer.region;
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  if (r) {
    ctx.beginPath();
    switch (r.kind) {
      case "rect":
        ctx.rect(r.x, r.y, r.w, r.h);
        break;
      case "rects":
        for (const q of r.rects) ctx.rect(q.x, q.y, q.w, q.h);
        break;
      case "circle":
        ctx.arc(r.cx, r.cy, Math.max(0, r.r), 0, Math.PI * 2);
        break;
      case "circle-inverted":
        ctx.rect(0, 0, W, H);
        ctx.arc(r.cx, r.cy, Math.max(0, r.r), 0, Math.PI * 2);
        ctx.clip("evenodd");
        break;
      case "polygon":
        tracePolygon(ctx, r.points);
        break;
      case "polygon-inverted":
        ctx.rect(0, 0, W, H);
        tracePolygon(ctx, r.points);
        ctx.clip("evenodd");
        break;
    }
    if (r.kind !== "circle-inverted" && r.kind !== "polygon-inverted") {
      ctx.clip();
    }
  }
  if (layer.dx !== 0 || layer.dy !== 0) ctx.translate(layer.dx, layer.dy);
  if (layer.scaleX !== 1 || layer.scaleY !== 1) {
    ctx.translate(W / 2, H / 2);
    ctx.scale(layer.scaleX, layer.scaleY);
    ctx.translate(-W / 2, -H / 2);
  }
}

function tracePolygon(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<readonly [number, number]>,
): void {
  if (points.length === 0) return;
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
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
  // Phase 9 đợt 10 (V1): transition visual — alpha lấy từ
  // transitionClipVisual, giữ nguyên hành vi fade cũ (fade vào =
  // localT/duration, fade ra = (duration-localT)/duration; type lạ
  // fallback fade). P1 (Phase 7): opacity hiệu dụng lấy từ vis.opacity
  // (đã gồm keyframes thắng tĩnh); ở đây chỉ nhân thêm hệ số alpha —
  // trước đây nhân cả clip.opacity rồi lại nhân vis.opacity nên opacity
  // tĩnh bị bình phương. Hình học transition (wipe/slide/circle/…) áp ở
  // wrapper drawVideoClipWithTransition (call site), không áp ở đây để
  // khỏi phải restore ở từng nhánh return của hàm này.
  const transVisual = transitionClipVisual(clip, localT, W, H);
  const alpha = transVisual.alpha;
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
  // T1 (Phase 9 đợt 12): blend theo weights thật — lấy từ
  // vis.motion.blurGhost (rỗng = không blur hoặc preview tắt). Đường vẽ
  // không đọc ghostAlphas nữa (mô tả trail cũ, xem previewEngine.ts).
  const ghostWeights: readonly number[] =
    MOTION_BLUR_PREVIEW_ENABLED && vis.motion.motionBlur
      ? (vis.motion.blurGhost?.weights ?? [])
      : [];
  // Phase 9 D3: video có track → tâm unit bám quỹ đạo (mirror render.js:
  // overlay x = main_w*frac - overlay_w/2; unit full-frame nên shift =
  // tâm track trừ tâm khung). Track thắng offset keyframes x/y;
  // scale/rotation/opacity vẫn giữ. Unit đã merge transition thì render
  // bỏ qua track, preview không biết trạng thái merge nên vẫn hiện bám
  // track ở đoạn chuyển cảnh (lệch đã ghi trong D3_LIMITS.md).
  let trackShift: { x: number; y: number } | null = null;
  let trackCenter: { x: number; y: number } | null = null;
  if (clip.track) {
    const pos = interpolateTrackPoints(clip.track.points, localT);
    trackCenter = { x: pos.x * W, y: pos.y * H };
    trackShift = { x: trackCenter.x - W / 2, y: trackCenter.y - H / 2 };
  }
  let drawSrc: CanvasImageSource = srcEl;
  if (vis.chroma) {
    const keyed = chromaKeyedSource(srcEl, mw, mh, vis.chroma);
    if (keyed) drawSrc = keyed;
  }
  // R5 (Phase 9): LUT WebGL thật — áp LUT lên frame nguồn (kích thước
  // letterbox dw×dh, không vượt quá độ phân giải project) TRƯỚC mask/SR/
  // opacity, đúng thứ tự render. Thành công thì drawSrc đổi sang canvas
  // WebGL và cssFilter bỏ phần LUT (tránh áp 2 lần); thất bại/chưa load
  // xong thì giữ đường CSS approx cũ, badge sẽ báo rõ chế độ.
  // R4 (Phase 9): chuỗi LUT từ nested/adjustment — áp LẦN LƯỢT từng LUT
  // (canvas ra của LUT trước làm nguồn cho LUT sau). Chỉ khi TẤT CẢ mắt
  // xích WebGL thành công mới dùng đường WebGL; 1 mắt xích thất bại
  // (chưa load xong / không khả dụng) thì giữ nguyên frame gốc + CSS
  // đã nối cả chuỗi (xấp xỉ, nhưng đủ mắt xích và đúng thứ tự) thay vì
  // hiện chuỗi dở dang WebGL-nửa-CSS-nửa.
  let cssFilter = vis.cssFilter;
  const lutChain = vis.lutChain ?? (vis.lut ? [vis.lut] : []);
  if (lutChain.length > 0) {
    let chained: CanvasImageSource = drawSrc;
    let allOk = true;
    for (const lutId of lutChain) {
      const wl = applyWebglLut(chained, lutId, dw, dh);
      if (!wl) {
        allOk = false;
        break;
      }
      chained = wl;
    }
    if (allOk) {
      drawSrc = chained;
      cssFilter = vis.cssFilterNoLut;
    }
  }
  // V2 (Phase 9 đợt 10): canvas effects — 8 effect trước đây bị bỏ qua nay
  // vẽ thật bằng effectCanvas (sau chroma/LUT, trước mask/SR/opacity).
  // Thất bại (không có document/context) → giữ drawSrc cũ, effect bị bỏ
  // qua ở frame đó chứ không crash.
  const canvasOps = canvasEffectOps(clip.effects, localT);
  if (canvasOps.length > 0) {
    const effSrc = effectCanvasSource(drawSrc, dw, dh, canvasOps);
    if (effSrc) drawSrc = effSrc;
  }
  // Q1 (Phase 8): mask — unit offscreen đã nhân alpha mask, rồi composite
  // như đường vẽ thường (SR hay không đều qua unit, khớp render: mask
  // trước SR). Unit null (không có document/context) → rơi xuống đường
  // vẽ thường, mask bị bỏ qua ở frame đó.
  if (clip.mask) {
    const unit = maskedUnitSource(drawSrc, dx, dy, dw, dh, cssFilter, clip.mask, W, H, localT);
    if (unit) {
      ctx.save();
      ctx.globalAlpha = clamp(alpha * vis.opacity, 0, 1);
      if (clip.animations?.scale || clip.animations?.rotation) {
        const pl = videoElementPlacement(clip, localT, W, H, W, H);
        // Phase 9 D3: có track thì tâm hình bao bám điểm track thay vì tâm placement.
        // T1: thử blend trước — drawFrame tự đặt transform SR trên lớp
        // blend (lớp vẽ lên canvas chính không mang transform).
        if (ghostWeights.length > 0) {
          setCtxFilter(ctx, "");
          const blended = drawMotionBlurBlended(ctx, clip.id, ghostWeights, W, H, (tctx, snap) => {
            tctx.save();
            tctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
            if (pl.rotationDeg) tctx.rotate((pl.rotationDeg * Math.PI) / 180);
            if (pl.scale !== 1) tctx.scale(pl.scale, pl.scale);
            tctx.drawImage(snap ?? unit, -W / 2, -H / 2, W, H);
            tctx.restore();
          });
          if (blended) {
            if (vis.vignette != null) {
              ctx.save();
              ctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
              if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
              if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
              drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
              ctx.restore();
            }
            // Snapshot đường mask+SR = unit gốc chưa blend (W×H, đã mask).
            updateMotionBlurSnapshots(clip.id, unit, W, H, ghostWeights.length - 1);
            ctx.restore();
            warnSkippedEffects(vis.skippedEffects);
            return;
          }
        }
        ctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
        if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
        if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
        ctx.drawImage(unit, -W / 2, -H / 2, W, H);
        if (vis.vignette != null) {
          drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
        }
        // Snapshot đường mask+SR = unit vừa vẽ (W×H, đã mask).
        if (ghostWeights.length > 0) {
          updateMotionBlurSnapshots(clip.id, unit, W, H, ghostWeights.length - 1);
        }
        ctx.restore();
        warnSkippedEffects(vis.skippedEffects);
        return;
      }
      // Phase 9 D3: mask unit cũng dịch theo track (mask áp trước overlay ở render).
      // T1: thử blend trước — bóng là unit đã mask, dịch cùng trackShift.
      if (ghostWeights.length > 0) {
        setCtxFilter(ctx, "");
        const blended = drawMotionBlurBlended(ctx, clip.id, ghostWeights, W, H, (tctx, snap) => {
          tctx.drawImage(snap ?? unit, trackShift ? trackShift.x : 0, trackShift ? trackShift.y : 0, W, H);
        });
        if (blended) {
          updateMotionBlurSnapshots(clip.id, unit, W, H, ghostWeights.length - 1);
          ctx.restore();
          if (vis.vignette != null) {
            drawVignette(ctx, dx + (trackShift ? trackShift.x : vis.offsetX), dy + (trackShift ? trackShift.y : vis.offsetY), dw, dh, vis.vignette);
          }
          warnSkippedEffects(vis.skippedEffects);
          return;
        }
      }
      ctx.drawImage(unit, trackShift ? trackShift.x : 0, trackShift ? trackShift.y : 0, W, H);
      // Snapshot đường mask = unit vừa vẽ (W×H, đã mask).
      if (ghostWeights.length > 0) {
        updateMotionBlurSnapshots(clip.id, unit, W, H, ghostWeights.length - 1);
      }
      ctx.restore();
      if (vis.vignette != null) {
        drawVignette(ctx, dx + (trackShift ? trackShift.x : vis.offsetX), dy + (trackShift ? trackShift.y : vis.offsetY), dw, dh, vis.vignette);
      }
      warnSkippedEffects(vis.skippedEffects);
      return;
    }
  }
  ctx.save();
  ctx.globalAlpha = clamp(alpha * vis.opacity, 0, 1);
  setCtxFilter(ctx, cssFilter);
  // Keyframes scale/rotation: mirror render (scale eval=frame + rotate quanh
  // tâm, overlay đặt hình bao theo x/y). Canvas: dịch tới tâm element →
  // xoay → scale → vẽ nội dung trong hệ toạ độ unit (gốc tại tâm unit).
  // Khi có scale/rotation, vùng letterbox trong render là TRONG SUỐT (unit
  // mang alpha) nên preview cũng chỉ vẽ đúng hình chữ nhật nội dung đã biến
  // đổi — phần ngoài cho thấy nội dung bên dưới, khớp render.
  if (clip.animations?.scale || clip.animations?.rotation) {
    const pl = videoElementPlacement(clip, localT, W, H, W, H);
    // Phase 9 D3: có track thì tâm hình bao bám điểm track thay vì tâm placement.
    // T1: thử blend trước — drawFrame tự đặt transform SR trên lớp blend
    // và áp cssFilter từng frame (snapshot lưu drawSrc chưa filter).
    if (ghostWeights.length > 0) {
      setCtxFilter(ctx, "");
      const blended = drawMotionBlurBlended(ctx, clip.id, ghostWeights, W, H, (tctx, snap) => {
        tctx.save();
        tctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
        if (pl.rotationDeg) tctx.rotate((pl.rotationDeg * Math.PI) / 180);
        if (pl.scale !== 1) tctx.scale(pl.scale, pl.scale);
        setCtxFilter(tctx, cssFilter);
        tctx.drawImage(snap ?? drawSrc, dx - W / 2, dy - H / 2, dw, dh);
        tctx.restore();
      });
      if (blended) {
        if (vis.vignette != null) {
          ctx.save();
          ctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
          if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
          if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
          drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
          ctx.restore();
        }
        // Snapshot đường SR = drawSrc gốc chưa blend (letterbox dw×dh).
        updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length - 1);
        ctx.restore();
        warnSkippedEffects(vis.skippedEffects);
        return;
      }
      // Blend thất bại (chưa có bóng) → trả filter về cho đường vẽ trực tiếp.
      setCtxFilter(ctx, cssFilter);
    }
    ctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
    if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
    if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
    ctx.drawImage(drawSrc, dx - W / 2, dy - H / 2, dw, dh);
    if (vis.vignette != null) {
      drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
    }
    // Snapshot đường SR = drawSrc vừa vẽ (letterbox dw×dh).
    if (ghostWeights.length > 0) {
      updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length - 1);
    }
    ctx.restore();
    warnSkippedEffects(vis.skippedEffects);
    return;
  }
  // T1: thử blend trước cho đường thường (cả track lẫn không track).
  // Lớp nền đen của track vẫn tô TRƯỚC lớp blend như cũ (lớp blend vẽ
  // lên trên nền đen, không bị nền đen che như trail cũ).
  if (ghostWeights.length > 0) {
    if (trackShift) {
      ctx.save();
      setCtxFilter(ctx, "");
      ctx.fillStyle = "#000";
      ctx.fillRect(trackShift.x, trackShift.y, W, H);
      ctx.restore();
    }
    setCtxFilter(ctx, "");
    const blended = drawMotionBlurBlended(ctx, clip.id, ghostWeights, W, H, (tctx, snap) => {
      setCtxFilter(tctx, cssFilter);
      if (trackShift) tctx.drawImage(snap ?? drawSrc, dx + trackShift.x, dy + trackShift.y, dw, dh);
      else tctx.drawImage(snap ?? drawSrc, dx + vis.offsetX, dy + vis.offsetY, dw, dh);
    });
    if (blended) {
      // Snapshot = drawSrc gốc chưa blend (sau LUT/chroma).
      updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length - 1);
      ctx.restore();
      if (vis.vignette != null) {
        drawVignette(ctx, dx + (trackShift ? trackShift.x : vis.offsetX), dy + (trackShift ? trackShift.y : vis.offsetY), dw, dh, vis.vignette);
      }
      warnSkippedEffects(vis.skippedEffects);
      return;
    }
    // Blend thất bại (chưa có bóng) → trả filter về cho đường vẽ trực tiếp.
    setCtxFilter(ctx, cssFilter);
  }
  // Phase 9 D3: có track thì toàn bộ unit dịch theo shift; nền đen của unit
  // (render pad unit đục) phải che nội dung bên dưới nên tô đen trước rồi
  // mới vẽ nội dung letterbox đã dịch.
  if (trackShift) {
    ctx.save();
    setCtxFilter(ctx, "");
    ctx.fillStyle = "#000";
    ctx.fillRect(trackShift.x, trackShift.y, W, H);
    ctx.restore();
    ctx.drawImage(drawSrc, dx + trackShift.x, dy + trackShift.y, dw, dh);
  } else {
    ctx.drawImage(drawSrc, dx + vis.offsetX, dy + vis.offsetY, dw, dh);
  }
  // Cập nhật ring snapshot = frame vừa vẽ (cho các frame sau dùng).
  // Snapshot lưu drawSrc (sau LUT/chroma), blend từng frame áp cùng
  // cssFilter nên tông màu nhất quán.
  if (ghostWeights.length > 0) {
    updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length - 1);
  }
  ctx.restore();
  if (vis.vignette != null) {
    drawVignette(ctx, dx + (trackShift ? trackShift.x : vis.offsetX), dy + (trackShift ? trackShift.y : vis.offsetY), dw, dh, vis.vignette);
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
  // Phase 9 D4: thời gian timeline (để tính localT cho mask keyframes).
  t: number,
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
  // Q1 (Phase 8): mask cho image clip — render CÓ áp mask cho ảnh (P4) nên
  // preview cũng áp (không kèm LUT/effects/opacity như video, khớp render).
  // Phase 9 D4: mask keyframes nội suy theo localT = t - clip.start.
  if (clip.mask) {
    const unit = maskedUnitSource(img, dx, dy, dw, dh, "", clip.mask, W, H, t - clip.start);
    if (unit) {
      ctx.drawImage(unit, 0, 0, W, H);
      return;
    }
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Vẽ 1 sticker — mirror buildStickerOverlay: tâm (W*x, H*y), rộng scale*W. */
function drawStickerClip(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  clip: StickerClip,
  /** Thời gian timeline hiện tại — để sticker bám quỹ đạo track (Q5). */
  t?: number,
) {
  const { width: W, height: H } = spec.meta;
  const img = stickerImageFor(clip.src);
  if (!img || !img.complete || !img.naturalWidth) return;
  const sv = stickerVisual(clip, W, H, t);
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
      drawVideoClipWithTransition(ctx, spec, pool, mediaByName, clip, t);
    }
  }
  for (const track of spec.tracks) {
    if (track.hidden || track.kind !== "image") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "image") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      drawImageClip(ctx, spec, pool, mediaByName, clip, t);
    }
  }
  for (const track of spec.tracks) {
    if (track.hidden || track.kind !== "sticker") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "sticker") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      drawStickerClip(ctx, spec, clip, t);
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
      // N5: nested clip đã được buildPreviewSpec() làm phẳng trước khi tới đây;
      // guard này chỉ để TS narrowing + phòng đường gọi với spec chưa phẳng.
      if (clip.kind === "nested") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      const item = mediaByName.get(clip.src);
      if (!item) continue;
      // R1-013: dùng sourceTimeAt — đúng với mọi speed/reverse.
      // Q1 (Phase 8): speed ramp — target theo ∫speed (rampSourceTimeAt)
      // và playbackRate theo speedAt tại thời điểm output; không dùng
      // sourcePosAt của video-spec (bug đoạn con, xem previewEngine).
      // P1 (Phase 7): HTMLVideoElement không phát ngược được. Khi phát,
      // syncMedia giữ element reverse ở trạng thái pause và seek từng frame
      // tới target (đúng chiều, không mượt); khi pause/scrub, seek đã đúng
      // từ trước qua sourceTimeAt.
      const speedable = isSpeedable(clip);
      const speed = speedable ? rampSpeedAt(clip, t - clip.start) : 1;
      const reverse = speedable ? (clip.reverse ?? false) : false;
      const target =
        clip.kind === "image" ? 0 : speedable ? rampSourceTimeAt(clip, t) : 0;
      const elapsed = t - clip.start;
      if (track.kind === "video" && clip.kind === "video" && item.kind === "video") {
        const el = pool.videoFor(item);
        if (el) {
          actives.push({ el, target, speed, reverse });
          // R1-063: audio kế thừa qua engine. Render bỏ audio khi track muted
          // hoặc sourceAudioMode="mute" → preview gain 0 cho khớp.
          // R1-076: truyền audioEffects (bass/treble/compressor) cho preview.
          // Phase 7 P3: nhân track.volume (render cũng nhân vào audio kế thừa).
          const vclip = clip as VideoClip;
          const gain = (track.muted || (vclip.sourceAudioMode ?? "inherit") === "mute") ? 0 : (track.volume ?? 1);
          audioSources.push({ el, gain, fx: toPreviewFx(vclip.audioEffects) });
        }
      } else if (track.kind === "audio" && clip.kind === "audio" && item.kind === "audio") {
        const el = pool.audioFor(item);
        if (el) {
          actives.push({ el, target, speed, reverse });
          // R1-063: gain = volume × fadeIn × fadeOut × volumeKeyframes × mute (khớp render).
          // R1-076: truyền audioEffects (bass/treble/compressor) cho preview.
          // Phase 7 P3: thêm fade curves + track.volume (computeClipGain đã nhận).
          audioSources.push({
            el,
            gain: computeClipGain(clip, elapsed, !!track.muted, track.volume ?? 1),
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
      if (a.reverse) {
        // P1 (Phase 7): phát ngược từng frame — giữ element ở trạng thái
        // pause và seek tới target mỗi frame (target giảm dần theo
        // sourceTimeAt). Không mượt như phát xuôi (seek từng frame, phụ thuộc
        // mật độ keyframe), nhưng đúng chiều và đúng vị trí — trước đây clip
        // reverse phát XUÔI (sai hoàn toàn).
        a.el.pause();
        if (Math.abs(a.el.currentTime - a.target) > 0.03) {
          try {
            a.el.currentTime = a.target;
          } catch {
            /* seek chưa sẵn sàng */
          }
        }
      } else {
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
      }
    } else {
      // R1-062: chỉ pause ở đây. Seek chính xác do Seeker xử lý (lib/seek.ts):
      // pause all -> set currentTime đã snap -> chờ `seeked` -> vẽ frame.
      // Không gán currentTime trực tiếp nữa để tránh vẽ frame cũ khi seek
      // bất đồng bộ chưa xong.
      a.el.pause();
    }
  }
  // P1 (Phase 7): audio của clip reverse không thể phát ngược qua Web Audio
  // (render dùng areverse) — khi đang phát thì mute để khỏi phát xuôi lệch
  // với hình bước ngược; khi pause thì element vốn đã dừng nên gain không
  // ảnh hưởng gì.
  const outSources = playing
    ? (() => {
        const revEls = new Set(
          actives.filter((a) => a.reverse).map((a) => a.el),
        );
        return audioSources.map((s) =>
          revEls.has(s.el) ? { ...s, gain: 0 } : s,
        );
      })()
    : audioSources;
  // R1-063: đẩy gain vào Web Audio graph (mượt bằng setTargetAtTime) + VU meter.
  engine.update(outSources);
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
  // T5 (Phase 9 đợt 21): MixerMeter chỉ chạy rAF khi đang phát — cần trạng
  // thái playing qua selector (re-render nhẹ khi toggle play, không chạm
  // vào vòng lặp preview vì effect của nó có deps []).
  const isPlaying = useStore((s) => s.playing);
  const poolRef = useRef<MediaPool | null>(null);
  // Q8: cache mediaByName theo identity mảng media (tránh build Map mới mỗi
  // frame rAF khi project có nhiều media) + badge PROXY cập nhật qua DOM
  // trực tiếp (không qua React state để tránh re-render mỗi frame).
  const mediaByNameRef = useRef<{ arr: MediaItem[]; map: Map<string, MediaItem> } | null>(null);
  const proxyBadgeRef = useRef<HTMLDivElement | null>(null);
  const lastBadgeRef = useRef<string>("");
  // R5 (Phase 9): badge chế độ LUT — cập nhật qua DOM trực tiếp như badge
  // PROXY (không re-render React mỗi frame).
  const lutBadgeRef = useRef<HTMLDivElement | null>(null);
  const lastLutBadgeRef = useRef<string>("");
  // S4 (Phase 9 đợt 8): badge motion — cập nhật qua DOM trực tiếp như badge
  // PROXY/LUT (không re-render React mỗi frame). "NỘI SUY" = clip đang xem
  // có motion.interpolation = "minterpolate" (shape S1): render sẽ nội suy
  // frame mới, preview thì KHÔNG (giữ fps project) nên bản export sẽ mượt
  // hơn preview thấy. "BLUR≈" = motion blur chỉ là ghosting xấp xỉ ở
  // preview, render dùng tmix thật.
  const motionBadgeRef = useRef<HTMLDivElement | null>(null);
  const lastMotionBadgeRef = useRef<string>("");
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
  // Phase 9: callback ổn định cho MixerMeter (đọc analyser của master bus).
  const getMixerAnalyser = useCallback(
    () => engineRef.current?.getAnalyser() ?? null,
    [],
  );
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
  // T5 (Phase 9 đợt 21): vòng lặp NGỦ khi đứng yên — nợ đợt 20 R5 §7.
  // Trước đây loop đặt rAF tiếp theo ngay đầu mỗi tick nên chạy liên tục
  // cả khi pause (đo R5: idle vẫn tick, giữ compositor sản xuất frame
  // không ngừng trên VM Xvfb). Nay loop chỉ đặt rAF tiếp khi còn việc:
  // đang phát, hoặc frame chưa vẽ xong (seek đang bay / playhead đổi /
  // spec-media-selection đổi). Khi không còn việc, loop dừng đặt rAF và
  // chỉ tỉnh lại nhờ: subscribe store (mọi đổi trạng thái), ResizeObserver
  // trên wrap (đổi kích thước canvas), hoặc sự kiện resize cửa sổ.
  // Điều kiện ngủ yêu cầu đủ cả: không phát + không có seek đang bay +
  // playhead đã vẽ xong (lastDrawn === playhead) + seek cho playhead đó
  // đã hoàn tất (lastRequested === playhead, tức không kẹt ở nhánh seek
  // lỗi — khi seek lỗi, lastRequested bị reset null nên loop KHÔNG ngủ
  // mà tick tiếp để thử lại) + không có cờ vẽ lại do spec đổi.
  // Hook đo `window.__vcutPreviewIdle` ({ticks, sleeping}) chỉ phục vụ
  // script đo v21, không phải tính năng người dùng (xem LIMITS T5).
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let sleeping = false;
    let pendingSeek = false;
    let redrawFlag = false;
    // T5: thế hệ seek — .then của request cũ (bị hủy/thay thế) không được
    // chạm vào pendingSeek của request mới hơn khi cùng playhead (so sánh
    // bằng giá trị t không phân biệt được request cũ/mới ở cùng t).
    let seekGen = 0;
    // T5: hook đo mở rộng thêm đúng các thành phần của điều kiện ngủ để
    // script đo chẩn đoán được "vì sao chưa ngủ" thay vì đoán (xem LIMITS).
    type PreviewIdleDebug = {
      ticks: number;
      sleeping: boolean;
      lastDrawn: number | null;
      lastRequested: number | null;
      pendingSeek: boolean;
      redrawFlag: boolean;
    };
    const idleDebug: PreviewIdleDebug = {
      ticks: 0,
      sleeping: false,
      lastDrawn: null,
      lastRequested: null,
      pendingSeek: false,
      redrawFlag: false,
    };
    const winHook = window as unknown as { __vcutPreviewIdle?: PreviewIdleDebug };
    winHook.__vcutPreviewIdle = idleDebug;
    const loop = (now: number) => {
      idleDebug.ticks++;
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
      // T5: chưa có canvas/wrap thì KHÔNG được ngủ (frame chưa từng vẽ) —
      // giữ hành vi cũ là tick tiếp để chờ mount.
      if (!canvas || !wrap) { raf = requestAnimationFrame(loop); return; }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = Math.max(1, Math.floor(wrap.clientWidth * dpr));
      const ch = Math.max(1, Math.floor(wrap.clientHeight * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        // T5: gán lại width/height XÓA bitmap canvas — ở nhánh pause, frame
        // chỉ vẽ lại khi playhead đổi nên phải ép vẽ lại ở đây, nếu không
        // canvas sẽ trắng sau resize trong lúc ngủ (wake lên cũng không vẽ).
        // Nhánh playing vẽ mỗi frame nên 2 lần gán null này vô hại ở đó.
        lastDrawnTRef.current = null;
        lastRequestedTRef.current = null;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // N5: spec cho preview — nested đã phẳng, adjustment đã gộp vào clip
      // qua cắt đoạn. Spec gốc trong store không đổi; không có nested/
      // adjustment thì buildPreviewSpec trả đúng object cũ (không copy).
      const spec = buildPreviewSpec(useStore.getState().spec);
      const media = useStore.getState().media;
      // Q8: chỉ build lại Map khi mảng media đổi identity (import/xoá/gắn proxy).
      let mediaByName: Map<string, MediaItem>;
      if (mediaByNameRef.current && mediaByNameRef.current.arr === media) {
        mediaByName = mediaByNameRef.current.map;
      } else {
        mediaByName = new Map(media.map((m) => [m.name, m]));
        mediaByNameRef.current = { arr: media, map: mediaByName };
      }
      const pool = poolRef.current!;
      const t = useStore.getState().playhead;
      const playing = useStore.getState().playing;
      // Q8: badge PROXY — chỉ ghi DOM khi text đổi (không re-render React).
      {
        let badgeText = "";
        for (const track of spec.tracks) {
          if (track.hidden || track.kind !== "video") continue;
          for (const clip of track.clips) {
            if (clip.kind !== "video") continue;
            if (t < clip.start || t >= clip.start + clip.duration) continue;
            const it = mediaByName.get(clip.src);
            if (it?.proxyUrl) { badgeText = `PROXY ${it.proxyHeight ?? 720}p`; break; }
          }
          if (badgeText) break;
        }
        const badge = proxyBadgeRef.current;
        if (badge && lastBadgeRef.current !== badgeText) {
          lastBadgeRef.current = badgeText;
          badge.textContent = badgeText;
          badge.style.display = badgeText ? "block" : "none";
        }
      }
      // R5: badge LUT — chỉ hiện khi clip đang xem có filter.lut. Chế độ
      // lấy từ lần áp WebGL gần nhất (webgl = LUT thật; loading = đang tải
      // .cube, tạm dùng CSS; css/unavailable = đang dùng CSS approx).
      {
        let hasLut = false;
        for (const track of spec.tracks) {
          if (track.hidden || track.kind !== "video") continue;
          for (const clip of track.clips) {
            if (clip.kind !== "video") continue;
            if (t < clip.start || t >= clip.start + clip.duration) continue;
            if (clip.filter?.lut) { hasLut = true; break; }
          }
          if (hasLut) break;
        }
        const lutBadge = lutBadgeRef.current;
        let lutText = "";
        let lutBg = "";
        if (hasLut) {
          const { mode } = getLutBadge();
          if (mode === "webgl") { lutText = "LUT WebGL"; lutBg = "rgba(16,120,60,0.85)"; }
          else if (mode === "loading") { lutText = "LUT…"; lutBg = "rgba(120,90,0,0.85)"; }
          else { lutText = "LUT CSS ≈"; lutBg = "rgba(140,90,0,0.85)"; }
        }
        if (lutBadge && lastLutBadgeRef.current !== lutText) {
          lastLutBadgeRef.current = lutText;
          lutBadge.textContent = lutText;
          lutBadge.style.display = lutText ? "block" : "none";
          if (lutBg) lutBadge.style.background = lutBg;
        }
      }
      // S4: badge motion — chỉ hiện khi clip đang xem có motion (nội suy
      // và/hoặc motion blur). Đọc motion qua normalizeMotion (shape S1,
      // duck-typed) nên clip không có motion thì badge ẩn, không crash.
      {
        let motionText = "";
        for (const track of spec.tracks) {
          if (track.hidden || track.kind !== "video") continue;
          for (const clip of track.clips) {
            if (clip.kind !== "video") continue;
            if (t < clip.start || t >= clip.start + clip.duration) continue;
            motionText = motionBadgeText(normalizeMotion(clip));
            if (motionText) break;
          }
          if (motionText) break;
        }
        const motionBadge = motionBadgeRef.current;
        if (motionBadge && lastMotionBadgeRef.current !== motionText) {
          lastMotionBadgeRef.current = motionText;
          motionBadge.textContent = motionText;
          motionBadge.style.display = motionText ? "block" : "none";
        }
      }
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
        // R14 (Phase 9 đợt 14): chỉ request seek 1 lần cho mỗi playhead t
        // (guard bằng lastRequestedTRef). Trước đây request được gọi MỖI
        // frame rAF trong khi t !== lastDrawnT, mà Seeker debounce 80ms
        // nên timer bị reset liên tục và seek KHÔNG BAO GIỜ chạy khi rAF
        // ~16ms — đây chính là blocker seek pause của đợt 13 (chỉ "chạy"
        // khi rAF chậm hơn 80ms do CPU tải, nên thất thường 8s/42s/không
        // bao giờ). Guard này giữ đúng ngữ nghĩa debounce gốc: scrub
        // nhanh đổi t liên tục vẫn chỉ seek lần cuối, vì mỗi t mới đều
        // khác lastRequested nên request mới sẽ hủy request cũ.
        // T5: spec/media/selection đổi ở cùng playhead (đánh thức bằng
        // subscribe bên dưới) cũng phải vẽ lại — ép lastDrawn về null để
        // đi qua đúng đường seek+vẽ này thay vì ngủ với frame cũ.
        // PHẢI reset cả lastRequested: guard R14 chặn request mới khi
        // t === lastRequested, nên chỉ reset lastDrawn sẽ kẹt vĩnh viễn ở
        // cân bằng {lastDrawn: null, lastRequested: t} — đúng trạng thái
        // đo được ở idle ban đầu (xem LIMITS T5 §3). cancel() trước để
        // request cũ (nếu đang bay) settle dạng cancelled, không vẽ
        // frame cũ đè lên sau (generation guard ở .then chặn nốt).
        if (redrawFlag) {
          seekerRef.current!.cancel();
          lastDrawnTRef.current = null;
          lastRequestedTRef.current = null;
          redrawFlag = false;
        }
        if (t !== lastDrawnTRef.current && t !== lastRequestedTRef.current) {
          lastRequestedTRef.current = t;
          pendingSeek = true;
          const gen = ++seekGen;
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
            // T5: .then cũ (request đã bị thay thế/hủy) bỏ qua hoàn toàn —
            // pendingSeek lúc này thuộc về request mới hơn, không được xóa.
            if (gen !== seekGen) return;
            // T5: seek đã kết thúc (thành công, bị hủy hay lỗi) — vòng lặp
            // được phép xét ngủ lại ở tick tới; nếu seek lỗi thì nhánh
            // dưới reset lastRequested nên điều kiện ngủ vẫn sai và loop
            // tick tiếp để thử lại (không kẹt ngủ với frame sai).
            pendingSeek = false;
            if (!outcome.cancelled && outcome.ok && lastRequestedTRef.current === t) {
              renderFrame(ctx, spec, pool, mediaByName, t, computeViewport(cw, ch, spec), useStore.getState().selection[0] ?? null);
              lastDrawnTRef.current = t;
            } else if (lastRequestedTRef.current === t) {
              // Seek bị hủy/thất bại mà không có request mới hơn: mở
              // guard để frame sau thử lại, tránh kẹt vĩnh viễn ở trạng
              // thái "đã request nhưng chưa vẽ". (Khi đã có request mới
              // hơn thì lastRequested đã là t mới, nhánh này không chạy
              // và outcome cũ bị bỏ qua đúng như latest-wins.)
              lastRequestedTRef.current = null;
            }
          });
        }
      }
      // T5: chụp trạng thái điều kiện ngủ cho hook đo trước khi đặt lịch.
      idleDebug.lastDrawn = lastDrawnTRef.current;
      idleDebug.lastRequested = lastRequestedTRef.current;
      idleDebug.pendingSeek = pendingSeek;
      idleDebug.redrawFlag = redrawFlag;
      // T5: đặt lịch tick tiếp — hoặc NGỦ nếu không còn việc (xem đầu effect).
      scheduleNext();
    };
    const scheduleNext = () => {
      const s = useStore.getState();
      const canSleep =
        !s.playing &&
        !pendingSeek &&
        s.playhead === lastDrawnTRef.current &&
        lastRequestedTRef.current === s.playhead &&
        !redrawFlag;
      if (canSleep) {
        sleeping = true;
        idleDebug.sleeping = true;
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    const wake = () => {
      if (!sleeping) return;
      sleeping = false;
      idleDebug.sleeping = false;
      // Tránh dt đột biến ở tick đầu sau giấc ngủ dài (dù dt đã clamp 0.1).
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    // T5: mọi đổi trạng thái đều đánh thức vòng lặp. So sánh identity
    // spec/media/selection để ép vẽ lại khi nội dung đổi ở cùng playhead;
    // playhead/playing đổi thì đường vẽ cũ đã xử lý (t !== lastDrawn,
    // nhánh playing), chỉ cần wake là đủ.
    const unsub = useStore.subscribe((s, prev) => {
      if (s.spec !== prev.spec || s.media !== prev.media || s.selection !== prev.selection) {
        redrawFlag = true;
      }
      wake();
    });
    // T5: đổi kích thước wrap (kéo panel, đổi layout, zoom đổi dpr qua
    // sự kiện resize) cũng phải tỉnh để canvas resize lại đúng cỡ.
    let ro: ResizeObserver | null = null;
    const wrapEl = wrapRef.current;
    if (wrapEl && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => wake());
      ro.observe(wrapEl);
    }
    const onResize = () => wake();
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(loop);
    // R1-063: dự phòng — nếu AudioContext vẫn suspended (trình duyệt chặn resume
    // ngoài gesture), gesture tiếp theo sẽ mở nó.
    const kickAudio = () => engineRef.current?.ensure();
    window.addEventListener("pointerdown", kickAudio);
    window.addEventListener("keydown", kickAudio);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", kickAudio);
      window.removeEventListener("keydown", kickAudio);
      if (winHook.__vcutPreviewIdle === idleDebug) delete winHook.__vcutPreviewIdle;
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
        // P1 (Phase 7): clip SR hit-test theo hình bao đã xoay (xấp xỉ trục
        // song song — chữ xoay xiên vẫn trúng trong hình bao, hơi rộng tay).
        const w = vis.sr && vis.bboxW != null ? vis.bboxW : textW + 24;
        const h = vis.sr && vis.bboxH != null ? vis.bboxH : textH + 16;
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
      {/* Phase 9: MixerMeter — đo từ cùng master analyser (mix tổng preview),
          thêm peak-hold + dBFS. Xem MARKERS_LIMITS.md (mono, không tách L/R). */}
      <MixerMeter getAnalyser={getMixerAnalyser} isPlaying={isPlaying} />
      {/* Q8: badge PROXY — báo rõ khi clip đang xem dùng bản proxy nhẹ.
          Export cuối vẫn dùng file gốc. Cập nhật qua ref trong vòng lặp. */}
      <div
        ref={proxyBadgeRef}
        className="preview-proxy-badge"
        title="Đang preview bằng bản proxy nhẹ — export cuối vẫn dùng file gốc đủ phân giải"
        style={{
          display: "none",
          position: "absolute",
          left: 8,
          top: 8,
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(255,170,0,0.9)",
          color: "#111",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      {/* R5: badge chế độ LUT — góc trên-phải (tránh badge PROXY bên trái).
          "LUT WebGL" = đang áp LUT 3D thật; "LUT CSS ≈" = đang dùng CSS xấp xỉ
          (bridge chưa chạy / WebGL không khả dụng / load lỗi); "LUT…" = đang tải .cube. */}
      <div
        ref={lutBadgeRef}
        className="preview-lut-badge"
        title="Chế độ LUT của preview: WebGL = LUT 3D thật (khớp render); CSS ≈ = xấp xỉ bằng CSS filter"
        style={{
          display: "none",
          position: "absolute",
          right: 8,
          top: 8,
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(140,90,0,0.85)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      {/* S4: badge motion — giữa trên (tránh PROXY trái, LUT phải).
          "NỘI SUY" = render sẽ nội suy frame mới, preview giữ fps project
          nên export mượt hơn preview; "BLUR≈" = preview chỉ ghosting xấp xỉ,
          render dùng tmix thật. Xem MOTION_PREVIEW_LIMITS.md. */}
      <div
        ref={motionBadgeRef}
        className="preview-motion-badge"
        title="Motion của clip đang xem: NỘI SUY = bản render sẽ nội suy frame mới (preview giữ fps project, không nội suy); BLUR≈ = preview chỉ vẽ vệt mờ xấp xỉ, render dùng motion blur thật"
        style={{
          display: "none",
          position: "absolute",
          left: "50%",
          top: 8,
          transform: "translateX(-50%)",
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(90,60,160,0.9)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
        aria-hidden="true"
      />
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
