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
  singleClipDipPixel,
  transitionClipVisual,
  type TransitionLayerSpec,
} from "./lib/transitionPreview";
import { decideVideoFrame } from "./lib/holdFrame";
// ROUND40-V3-T0: sửa lỗi frame pause t=0 không vẽ (nợ đợt 39 §5.3) —
// chỉ gán lastDrawn khi render không skip clip video nào + tick vẽ lại
// khi seek đã xong mà frame chưa vẽ (xem pauseDraw40V3.ts).
import {
  pauseDrawComplete,
  pauseTickNeedsRetry,
} from "./lib/pauseDraw40V3";
// ROUND41-W2: cap cho vòng lặp vẽ lại pause của V3 (nợ đợt 40 §5.7) —
// media hỏng vĩnh viễn thì sau 600 lần render pause bị skip liên tiếp
// vòng lặp được ngủ thay vì tick rAF mãi (xem pauseDraw41W2.ts).
// ROUND50-F2 (§7.7): thêm trần tường 10 s cho cùng chuỗi skip — cap
// tick không chặn được thời gian quay dưới tải (baseline 6,1 tick/s →
// 103,6 s mới ngủ); xem pauseRetryWallExhausted.
import {
  pauseRetryAdvance,
  pauseRetryWallExhausted,
} from "./lib/pauseDraw41W2";
// ROUND50-F2 (§7.6): quyết định ngủ/tick của scheduleNext tách thành
// hàm thuần (khóa ngữ nghĩa ngủ khi thiếu surface) — xem
// previewLoop50F2.ts.
import { previewLoopShouldSleep } from "./lib/previewLoop50F2";
// ROUND42-X2: cap cho đường seek-timeout / seek-error của vòng lặp
// pause (nợ đợt 41 §5.3) — timeout/error liên tiếp cho cùng playhead
// thì sau cap vòng lặp ngủ ở trạng thái lỗi rõ ràng thay vì request
// seek mới mãi (xem pauseSeekCap42X2.ts).
import {
  classifySeekOutcome,
  seekFailureAdvance,
} from "./lib/pauseSeekCap42X2";
// ROUND43-Y2: phục hồi sau khi cạn cap seek (nợ đợt 42 §5.3) — đúng lúc
// cạn cap thì drop actives khỏi pool để lần seek sau tạo element mới
// (xem pauseSeekRecovery43Y2.ts).
import { planSeekRecovery } from "./lib/pauseSeekRecovery43Y2";
// ROUND44-Z2: guard khôi phục khi scrub về đúng t đã vẽ sau khi cạn cap
// (nợ đợt 43 Y2 §5.2 — playhead === lastDrawn nhưng lastRequested vẫn
// là t đã cạn thì cả 3 đường seek/vẽ/ngủ đều đóng, vòng lặp tick mãi).
import { planDrawnPlayheadRecovery } from "./lib/pauseLoopGuard44Z2";
// Đợt 27 K4: phát ngược toàn cục + stepping cho clip reverse (xem
// reversePlayback.ts). Chỉ luồng này sửa các vùng phát ngược/hold.
import {
  MAX_HOLD_AGE_SEC,
  holdStale,
  justCompletedSeek,
  resolveReverseEngine,
  resolveReverseEngineDetailed,
  reversePlayhead,
  reverseStep,
  shouldIssueStepSeek,
  stepDrawAllowedWithCompletion,
} from "./lib/reversePlayback";
// Đợt 34 Q2: hook đo gap rAF riêng vòng preview (P5 đợt 32, nay mới
// nối — xem previewRafHook.ts) + đường phát ngược WebCodecs opt-in
// (mặc định TẮT, xem reverseWebcodecs.ts). Cả hai đều không đổi hành
// vi vẽ khi cờ tắt: hook chỉ ghi mẫu đo, đường cache chỉ chạy khi
// resolveReverseEngine() = "webcodecs".
import { createPreviewRafHook } from "./lib/previewRafHook";
import {
  disposeReverseWebcodecsControllers,
  getReverseDecodeAheadWanted,
  getReversePreviewController, // ROUND45-A6: đọc controller.failed cho badge từng frame
  reverseDecodeAheadStatus,
  reverseWebcodecsFrameFor,
  setReverseDecodeAheadWanted,
} from "./lib/reverseWebcodecs";
// ROUND45-A6: badge từng frame theo controller.failed + hiển thị đổi
// lang không chờ tick (xem reverseBadge45A6.ts; bọc hàm Z6, không sửa
// reversePlayback.ts).
import {
  resolveReverseEngineBadge45A6,
  reverseEngineBadgeDisplay45A6,
  type ReverseEngineBadge45A6,
} from "./lib/reverseBadge45A6";
// Đợt 38 U1: toggle decode-ahead Q3 — chuỗi mới qua i18n, key lý do cổng
// qua module thuần (không hardcode tiếng Việt trong preview).
import { t as i18nT, useLang } from "./i18n";
import {
  blockedReasonsDiffer,
  decodeAheadReasonI18nKey,
} from "./lib/reverseDecodeAheadToggle";
// Đợt 29 L2: pacing phát xuôi — sửa bug snap nửa frame làm playhead
// chạy nhanh 1.158× (xem playheadPacing.ts). Chỉ nhánh phát xuôi dùng.
import { forwardPlayhead, forwardStep } from "./lib/playheadPacing";
import { ffmpegDissolveFrand } from "./lib/dissolveFrand";
import { applyWebglLut, getLutBadge } from "./lib/webglLut";
import {
  applyCanvasEffects,
  canvasEffectOps,
  type CanvasEffectOp,
} from "./lib/effectCanvas";
// N5 (Phase 9): preview dùng spec đã làm phẳng nested + gộp adjustment
// (xem apps/web/src/lib/NESTED_PREVIEW_LIMITS.md). Chỉ luồng này sửa preview.tsx.
import { buildPreviewSpecFailsoft } from "./lib/nestedPreview";
import { normalizeTextStyle } from "./lib/projectRepo";
import { pushToast } from "./lib/toast";
import { knownSizeBytesForPreview } from "./lib/proxy";
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
  // Đợt 34 Q2: nới sang CanvasImageSource để nhận cả VideoFrame từ
  // đường WebCodecs (hàm chỉ dùng drawImage nên không đổi hành vi
  // với các nguồn cũ).
  src: CanvasImageSource,
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
  // Phase 9 đợt 27 K1 — guard bug đợt 26 J6 §6: text clip thiếu style
  // (lọt qua cổng load cũ) từng ném TypeError ngay tại đây. Chuẩn hóa
  // qua cùng hàm cổng load dùng, nên mọi caller của textFont đều an toàn
  // kể cả clip tạo trong phiên không qua parseProjectText.
  const s = normalizeTextStyle(c.style);
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
  // Phase 9 đợt 27 K1 — guard bug đợt 26 J6 §6: chuẩn hóa style TRƯỚC
  // mọi lần đọc (kể cả textClipVisual trong previewEngine cũng đọc
  // clip.style trực tiếp). Bản sao nông: không mutate clip trong store,
  // mọi đường vẽ sau đó (karaoke, SR, parity) đều dùng bản đã chuẩn hóa.
  // Clip đã có style đầy đủ → normalize trả về giá trị tương đương,
  // hành vi render không đổi.
  clip = { ...clip, style: normalizeTextStyle(clip.style) };
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
  // Phase 9 đợt 26 (J3): clip đơn trong cửa sổ fadewhite/fadegrays —
  // composite dip (trắng / xám theo pixel) ĐẰNG SAU clip qua offscreen
  // (drawVideoClipWithDip), thay vì vẽ trên nền đen như trước (sai
  // hướng dip). Chỉ mở nhánh này khi không có hình học (họ fade là
  // geometric=false); fadeblack giữ đường alpha cũ vì dip đen ≡ nền
  // đen. Nhánh này KHÔNG đụng drawVideoClip: nó chỉ gọi drawVideoClip
  // với bản sao clip đã strip transition để lấy pixel ở alpha đầy đủ,
  // rồi tự composite theo tv.alpha.
  if (!tv.geometric && (tv.dipMode === "white" || tv.dipMode === "gray")) {
    drawVideoClipWithDip(ctx, spec, pool, mediaByName, clip, t, tv, W, H);
    return;
  }
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
 * Vẽ 1 clip đơn trong cửa sổ fadewhite/fadegrays kèm dip ĐẰNG SAU clip
 * (đợt 26 J3 — đóng nợ follow-up đợt 25 I4 §7).
 *
 * Vấn đề I4 để lại: fill nền trắng/xám toàn khung trước khi vẽ clip sẽ
 * xóa clip track khác đã vẽ trước trong cùng frame (mọi clip video
 * chiếm toàn khung). Cách này tránh điều đó bằng phạm vi pixel:
 *   1. Vẽ clip lên canvas offscreen với bản sao đã strip transition
 *      (transitionIn/Out = undefined) để drawVideoClip vẽ ở alpha đầy
 *      đủ (không nhân tv.alpha) — mọi hiệu ứng/mask/SR/track của clip
 *      vẫn giữ nguyên vì bản sao chỉ khác 2 trường transition.
 *   2. Composite từng pixel bằng singleClipDipPixel (chính hàm thuần
 *      của transitionPreview.ts, có unit test): pixel nào offscreen
 *      có alpha = 0 (clip không vẽ tới: viền letterbox, góc xoay SR,
 *      vùng mask/chroma trong suốt) thì BỎ QUA — dip không bao giờ vẽ
 *      ra ngoài vùng clip đã chiếm, nên track dưới và nền đen khung
 *      vẫn hiện ở đó. Pixel đã vẽ giữ nguyên alpha (coverage từ
 *      opacity/mask), chỉ đổi màu thẳng thành
 *      alpha·clip + (1−alpha)·dip; khi đưa offscreen lên ctx chính
 *      bằng source-over, phần (1−coverage) vẫn cho thấy nội dung bên
 *      dưới — đúng ngữ nghĩa opacity/mask cũ, chỉ thêm dip.
 *   3. alpha = tv.alpha (lớp A khi ra, lớp B khi vào). Cả 2 cửa sổ
 *      cùng active (clip ngắn hơn tổng duration): alpha là tích 2
 *      lớp, dip lấy theo cửa sổ vào — xấp xỉ đã ghi, không phải
 *      composite cặp đầy đủ (thiếu clip còn lại của cặp, xem LIMITS).
 * Fallback về đường vẽ thường khi: thiếu media (tránh nhuộm màu
 * placeholder "Thiếu media"), alpha >= 1 (trọng số dip = 0), hoặc
 * không lấy được offscreen context. Chi phí: 1 vòng ImageData toàn
 * khung mỗi frame trong cửa sổ dip (cùng họ chi phí với mask dissolve
 * — đo Node ở LIMITS; chỉ trong frame transition, thường ≤ 1s).
 */
function drawVideoClipWithDip(
  ctx: CanvasRenderingContext2D,
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  clip: VideoClip,
  t: number,
  tv: ReturnType<typeof transitionClipVisual>,
  W: number,
  H: number,
): void {
  const item = mediaByName.get(clip.src);
  if (!item) {
    drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    return;
  }
  const alpha = clamp(tv.alpha, 0, 1);
  if (alpha >= 1 || (tv.dipMode !== "white" && tv.dipMode !== "gray")) {
    drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    return;
  }
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(W));
  off.height = Math.max(1, Math.round(H));
  const octx = off.getContext("2d");
  if (!octx) {
    drawVideoClip(ctx, spec, pool, mediaByName, clip, t);
    return;
  }
  const stripped: VideoClip = {
    ...clip,
    transitionIn: undefined,
    transitionOut: undefined,
  };
  drawVideoClip(octx, spec, pool, mediaByName, stripped, t);
  const img = octx.getImageData(0, 0, off.width, off.height);
  const data = img.data;
  const mode = tv.dipMode;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [r, g, b] = singleClipDipPixel(
      [data[i], data[i + 1], data[i + 2]],
      alpha,
      mode,
    );
    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
    // data[i + 3] giữ nguyên: coverage (opacity/mask) không đổi.
  }
  octx.putImageData(img, 0, 0);
  ctx.drawImage(off, 0, 0);
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

// ---- J4 (Phase 9 đợt 26): giữ frame tốt cuối cùng khi đang phát mà
// decoder tụt (nợ I6 §5h đợt 25) ----
// Cache nguồn frame tốt cuối cùng theo clip (khóa gồm clip.id + clip.src
// để relink/đổi src không vẽ nhầm frame của src cũ). Chỉ lưu khi quyết
// định là "draw" (frame hiện tại dùng được); nhánh "hold" vẽ lại canvas
// này qua đúng pipeline thường (letterbox/LUT/chroma/mask/SR/opacity tại
// t hiện tại) nên geometry/effect vẫn theo t, chỉ nội dung frame là cũ.
// Chi phí: 1 drawImage thêm mỗi tick vẽ thành công cho mỗi clip video
// (bản sao kích thước gốc, không qua filter) — rẻ hơn nhiều so với vẽ
// lại toàn bộ pipeline, và là giá bắt buộc vì element video không giữ
// được "frame cũ" để vẽ lại sau khi decoder tụt (frame hiện tại của nó
// đã thay đổi/trống). Giới hạn 16 clip (evict cũ nhất) để không giữ
// canvas vô hạn khi project đổi clip liên tục. Không có document (SSR)
// thì không cache, hành vi rơi về guard cũ. Xem holdFrame.ts (quyết
// định thuần, có unit test) và PHASE9_ROUND26_J4_HOLD_FRAME_LIMITS.md.
const HELD_FRAME_MAX_CLIPS = 16;
// Đợt 27 K4: cache frame giữ ghi thêm firstHeldT (playhead lúc bắt đầu
// giữ — để đo tuổi frame giữ) và holdTicks. firstHeldT = null nghĩa là
// frame trong cache là frame vừa draw xong, chưa từng bị giữ.
// Thống kê draw/hold/skip + tuổi giữ lớn nhất được phơi qua
// window.__vcutHoldStats cho harness đo (kiểu hook đo __vcutPreviewIdle
// đã có sẵn trong file này) — KHÔNG phải state React nên không gây
// re-render mỗi tick. tickHadHold: tick renderFrame vừa rồi có clip nào
// rơi vào nhánh hold không (badge "FRAME GIỮ" đọc ở tick sau).
interface HeldFrameEntry {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  firstHeldT: number | null;
  holdTicks: number;
}
const heldFrameCache = new Map<string, HeldFrameEntry>();
export interface HoldStats {
  draw: number;
  hold: number;
  skip: number;
  /** Tuổi giữ lớn nhất từng đo được (giây timeline), 0 = chưa từng giữ. */
  maxHoldAgeSec: number;
  /** true khi có clip đang giữ quá MAX_HOLD_AGE_SEC (vẫn giữ hình, chỉ báo). */
  stale: boolean;
}
const holdStats: HoldStats = { draw: 0, hold: 0, skip: 0, maxHoldAgeSec: 0, stale: false };
let holdStatsExposed = false;
function exposeHoldStats(): void {
  if (holdStatsExposed || typeof window === "undefined") return;
  holdStatsExposed = true;
  (window as unknown as { __vcutHoldStats?: HoldStats }).__vcutHoldStats = holdStats;
}
let tickHadHold = false;
// Đợt 27 K4: ngữ cảnh transport của lần renderFrame hiện tại, để
// drawVideoClip biết clip nào đang seek-stepping mà không phải luồn thêm
// tham số qua toàn bộ wrapper transition/dip/mask (vùng của luồng khác).
// Vòng lặp đặt trước mỗi lần gọi renderFrame: nhánh phát đặt
// {playing: true, reversePlayback}, nhánh pause/seek đặt playing: false.
// stepping của 1 clip = playing && (reversePlayback toàn cục || clip.reverse).
let drawTransport = { playing: false, reversePlayback: false };
function heldFrameKey(clipId: string, src: string): string {
  return `${clipId}::${src}`;
}
function storeHeldFrame(clipId: string, src: string, v: HTMLVideoElement, mw: number, mh: number): void {
  if (typeof document === "undefined") return;
  try {
    const key = heldFrameKey(clipId, src);
    let slot = heldFrameCache.get(key);
    if (!slot) {
      if (heldFrameCache.size >= HELD_FRAME_MAX_CLIPS) {
        const oldest = heldFrameCache.keys().next();
        if (!oldest.done) heldFrameCache.delete(oldest.value);
      }
      const canvas = document.createElement("canvas");
      canvas.width = mw;
      canvas.height = mh;
      slot = { canvas, w: mw, h: mh, firstHeldT: null, holdTicks: 0 };
      heldFrameCache.set(key, slot);
    } else if (slot.canvas.width !== mw || slot.canvas.height !== mh) {
      slot.canvas.width = mw;
      slot.canvas.height = mh;
      slot.w = mw;
      slot.h = mh;
    }
    // Đợt 27 K4: frame vừa draw xong là frame tươi — reset tuổi giữ để
    // lần hold sau (nếu có) đo lại từ đầu, không cộng dồn qua lần draw.
    slot.firstHeldT = null;
    slot.holdTicks = 0;
    const cctx = slot.canvas.getContext("2d");
    if (!cctx) return;
    cctx.drawImage(v, 0, 0, mw, mh);
  } catch {
    /* canvas lỗi → bỏ qua, frame đó không được giữ (rơi về skip như cũ) */
  }
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
  let srcEl:
    | HTMLVideoElement
    | HTMLImageElement
    | HTMLCanvasElement
    | VideoFrame
    | null = null;
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
    // J4 (đợt 26, nợ I6 §5h): quyết định draw/hold/skip qua helper thuần
    // (xem holdFrame.ts). "Đang phát" suy ra từ !v.paused — không luồn
    // trạng thái playing của store qua đây để khỏi đụng vùng transition/
    // dip. K4 (đợt 27) sửa hệ quả cũ "phát ngược vẫn skip": ngữ cảnh
    // drawTransport (vòng lặp đặt trước renderFrame) cho biết tick này
    // có đang stepping không — phát ngược toàn cục hoặc clip.reverse —
    // và cờ stepping đó được truyền vào decideVideoFrame, nên element
    // paused nhưng đang seek từng frame vẫn hold thay vì skip. Nới
    // guard thành videoWidth > 0 vẫn KHÔNG được chọn: harness Chromium
    // (xem LIMITS §2 đợt 26) đo được ở
    // readyState 1 hai hành vi — trước frame đầu drawImage là no-op
    // (sau khi renderFrame xóa nền vẫn đen), sau khi đã có frame thì
    // Chromium vẽ frame cũ cuối (không đen nhưng phụ thuộc trình
    // duyệt, không khóa được bằng unit test). Chỉ nhánh hold (vẽ lại
    // frame tốt do chính mình cache) mới giữ hình một cách xác định.
    // Nhánh hold đi tiếp qua đúng pipeline bên dưới nên
    // mask/SR/LUT/chroma/effects/opacity vẫn tính tại t hiện tại.
    // K4 (đợt 27): stepping = tick này playhead đang chạy từng frame
    // nhưng element vẫn paused vì seek-stepping — phát ngược toàn cục
    // (drawTransport.reversePlayback) hoặc clip.reverse.
    const stepping =
      drawTransport.playing &&
      (drawTransport.reversePlayback || (clip.reverse ?? false));
    // Đợt 34 Q2: đường WebCodecs opt-in (mặc định TẮT). Chỉ khi stepping
    // + cờ bật + có VideoDecoder mới hỏi cache: có frame đúng mốc
    // source time (cùng mốc mà đường element seek tới) thì vẽ frame
    // cache, đi tiếp đúng pipeline bên dưới (mask/SR/LUT/chroma/
    // effects/opacity — VideoFrame là CanvasImageSource hợp lệ); chưa
    // có frame (đang decode / source không demux được) thì rơi về
    // nhánh element cũ nguyên vẹn bên dưới, không skip, không đen.
    // Nguồn cache lấy đúng source element đang dùng (proxy nếu có).
    let wcFrame: {
      frame: VideoFrame;
      width: number;
      height: number;
    } | null = null;
    if (stepping && resolveReverseEngine() === "webcodecs") {
      // Đợt 36 S4 + đợt 38 U2: chặn đỉnh heap file lớn bằng size truyền
      // trước qua cổng S4. knownSizeBytesForPreview chọn đúng size của
      // chính URL đang fetch: bản gốc -> item.file.size; proxy ->
      // proxySizeBytes khi bridge đã trả (metadata proxy), chưa biết
      // thì undefined — KHÔNG truyền item.file.size cho proxy (size gốc
      // không phải size proxy, truyền sai sẽ chặn nhầm proxy nhỏ).
      // Khi proxy chưa biết size, cổng S4 không áp dụng và các cổng
      // HEAD/GET của đợt 35 R3 + late-abort của đợt 37 T5 vẫn làm việc.
      // ROUND40-V2-GOP: bật đường GOP Range cho controller này (ngưỡng
      // 32 MiB < size <= 128 MiB, cache GOP 32 MiB; lỗi GOP rơi về
      // full-file, file > 128 MiB vẫn khóa S4 như cũ — xem LIMITS V2).
      wcFrame = reverseWebcodecsFrameFor(
        item.proxyUrl ?? item.url,
        rampSourceTimeAt(clip, t),
        knownSizeBytesForPreview(item),
        { gopRangeEnabled: true },
      );
    }
    const v = pool.videoFor(item);
    if (wcFrame) {
      srcEl = wcFrame.frame;
      mw = wcFrame.width;
      mh = wcFrame.height;
    } else if (v) {
      // Khi stepping, element chỉ được draw khi đã seek đúng target
      // (±0.5 frame, xem seekOnTarget): seek còn bay mà vẽ thì frame
      // trên element vẫn là frame cũ nhưng sẽ bị mạo nhận là frame tại
      // t — thay vào đó hold frame tốt cũ (nội dung đúng frame trước
      // đó, không đen). Nhánh pause thật (không stepping) không qua
      // guard này vì Seeker đã chờ seeked rồi mới vẽ. Thống kê
      // draw/hold/skip phơi qua window.__vcutHoldStats cho harness đo
      // (xem đầu file).
      const key = heldFrameKey(clip.id, clip.src);
      let decision = decideVideoFrame({
        readyState: v.readyState,
        videoWidth: v.videoWidth,
        paused: v.paused,
        hasHeldFrame: heldFrameCache.has(key),
        stepping,
      });
      if (decision === "draw" && stepping) {
        const fps = spec.meta.fps > 0 ? spec.meta.fps : 30;
        // Đợt 28 L2: guard K4 (chỉ vẽ khi khớp nửa frame) giữ nguyên cho
        // trường hợp khớp; nới thêm cho seek ĐÃ XONG nhưng lag ≤ 2 s
        // (stepDrawAllowed): trên GOP thưa seek hoàn tất sau ~0.5–1 s,
        // playhead đã lùi xa nên guard cũ chặn mọi draw → kẹt 8.5 s dù
        // seek vẫn hoàn tất đều. Frame vẽ ra luôn mới hơn frame giữ cũ
        // (target stepping đơn điệu) và lag có giới hạn 2 s — đánh đổi
        // này ghi rõ trong PHASE9_ROUND28_L2_REVERSE_LIMITS.md. Đang
        // seeking mà lệch thì vẫn hold (frame cũ chưa phải frame mới).
        // Đợt 39 T6: bypass thêm cho tick vừa hoàn tất seek — seek bay
        // 1,2–6,8 s trên file GOP thưa 420 MB nên lag lúc xong thường
        // 2,2–4,9 s, vượt guard 2 s → 4 lần xong liên tiếp đều bị chặn,
        // frame đầu tới sau 17,8 s (baseline đợt 39). Frame ở tick này
        // là frame của seek vừa xong (không phải frame cũ mạo nhận) nên
        // vẽ nó: chuỗi ngược hiện đúng thứ tự, chỉ chậm theo tốc độ
        // seek. Guard 2 s vẫn áp cho mọi tick khác.
        if (!stepDrawAllowedWithCompletion(v.seeking, v.currentTime, rampSourceTimeAt(clip, t), fps, seekCompletedThisTick.has(v))) {
          decision = heldFrameCache.has(key) ? "hold" : "skip";
        }
      }
      exposeHoldStats();
      if (decision === "draw") {
        holdStats.draw++;
        srcEl = v;
        mw = v.videoWidth;
        mh = v.videoHeight;
        storeHeldFrame(clip.id, clip.src, v, mw, mh);
      } else if (decision === "hold") {
        const held = heldFrameCache.get(key);
        if (held) {
          holdStats.hold++;
          tickHadHold = true;
          if (held.firstHeldT === null) held.firstHeldT = t;
          held.holdTicks++;
          const age = Math.abs(t - held.firstHeldT);
          if (age > holdStats.maxHoldAgeSec) holdStats.maxHoldAgeSec = age;
          // Vượt ngưỡng tuổi: VẪN GIỮ (quay lại đen còn tệ hơn) — chỉ
          // đánh dấu stale để badge/thống kê báo rõ, xem LIMITS K4 §4.
          if (holdStale(held.firstHeldT, t, MAX_HOLD_AGE_SEC)) holdStats.stale = true;
          srcEl = held.canvas;
          mw = held.w;
          mh = held.h;
        }
      } else {
        holdStats.skip++;
      }
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
  // K4 (đợt 27): tick mới thì reset cờ hold — drawVideoClip sẽ đặt lại
  // nếu tick này có clip rơi vào nhánh hold (badge đọc ở tick sau).
  tickHadHold = false;
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
 *
 * Đợt 28 L2: steppingPrevSeeking ghi seeking ở tick trước cho mỗi element
 * (chỉ dùng trong 2 nhánh stepping) để nhận biết "tick vừa hoàn tất seek"
 * — xem justCompletedSeek trong reversePlayback.ts.
 */
const steppingPrevSeeking = new WeakMap<object, boolean>();
// Đợt 39 T6: element vừa hoàn tất seek ở tick hiện tại — syncMedia ghi
// trước renderFrame, drawVideoClip đọc để bypass guard lag đúng tick đó
// (xem stepDrawAllowedWithCompletion). Set bị xóa đầu mỗi lần syncMedia
// chạy (1 lần/tick) nên không bao giờ rò sang tick sau; nhánh pause
// (playing=false) không set gì nên scrub/pause không bị ảnh hưởng.
const seekCompletedThisTick = new Set<object>();
function syncMedia(
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  t: number,
  playing: boolean,
  engine: AudioEngine,
  forceSeek: boolean,
  // K4 (đợt 27): true = phát ngược toàn cục — playhead lùi từng frame,
  // MỌI element đều paused + seek-stepping như clip reverse (không
  // element nào được play() xuôi), audio mute toàn bộ (xem dưới).
  reversePlayback = false,
) {
  // Đợt 39 T6: mở đầu tick mới — cờ hoàn tất seek của tick trước hết hạn.
  seekCompletedThisTick.clear();
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
      // K4 (đợt 27): ngưỡng seek cho stepping là nửa frame (0.5/fps) thay
      // vì 0.03 cố định — phải khớp với guard stepDrawAllowed trong
      // drawVideoClip, nếu không sẽ có vùng drift (0.5/fps, 0.03] mà
      // syncMedia không seek nhưng tầng vẽ lại coi là stale và hold mãi.
      const stepEps = 0.5 / (spec.meta.fps > 0 ? spec.meta.fps : 30);
      if (reversePlayback) {
        // Phát ngược toàn cục: TẤT CẢ clip đều seek-stepping như clip
        // reverse (target của mỗi clip đã tính đúng chiều qua
        // collectActives: clip xuôi thì target lùi, clip reverse thì
        // target tiến khi playhead lùi). Không play() element nào.
        // Đợt 28 L2 (pacing): không phát seek mới khi seek cũ còn bay
        // (el.seeking) — phát chồng làm decoder khởi động lại từ keyframe
        // liên tục, đo được 410/426 seek bị thay thế trước khi hoàn tất
        // trên GOP thưa → kẹt 8.5 s. Chờ seek cũ xong rồi seek tới target
        // hiện tại (bỏ qua frame trung gian cho hiển thị).
        // Đợt 28 L2 (cửa sổ vẽ ở tick hoàn tất): vòng lặp gọi syncMedia
        // TRƯỚC renderFrame, nên tick seek vừa xong cũng là tick phát
        // seek tiếp — frame vừa xong không bao giờ được vẽ (đo được 103
        // lần hoàn tất, 0 lần vẽ tương ứng). Tick vừa hoàn tất thì
        // KHÔNG phát seek mới, để renderFrame tick đó vẽ frame vừa xong
        // (lag ≤ 2 s theo guard nới lỏng); tick sau mới seek tiếp.
        a.el.pause();
        const wasSeekingGlobal = steppingPrevSeeking.get(a.el) ?? false;
        steppingPrevSeeking.set(a.el, a.el.seeking);
        // Đợt 39 T6: ghi tick vừa hoàn tất để drawVideoClip bypass guard
        // lag đúng tick này (frame vừa seek xong, xem reversePlayback.ts).
        if (justCompletedSeek(wasSeekingGlobal, a.el.seeking)) seekCompletedThisTick.add(a.el);
        if (!justCompletedSeek(wasSeekingGlobal, a.el.seeking) && shouldIssueStepSeek(a.el.seeking, a.el.currentTime, a.target, stepEps)) {
          try {
            a.el.currentTime = a.target;
          } catch {
            /* seek chưa sẵn sàng */
          }
        }
      } else if (a.reverse) {
        // P1 (Phase 7): phát ngược từng frame — giữ element ở trạng thái
        // pause và seek tới target mỗi frame (target giảm dần theo
        // sourceTimeAt). Không mượt như phát xuôi (seek từng frame, phụ thuộc
        // mật độ keyframe), nhưng đúng chiều và đúng vị trí — trước đây clip
        // reverse phát XUÔI (sai hoàn toàn).
        // Đợt 28 L2: cùng pacing + cửa sổ vẽ ở tick hoàn tất như nhánh
        // ngược toàn cục (xem trên).
        a.el.pause();
        const wasSeekingClip = steppingPrevSeeking.get(a.el) ?? false;
        steppingPrevSeeking.set(a.el, a.el.seeking);
        // Đợt 39 T6: như nhánh ngược toàn cục (ghi tick vừa hoàn tất).
        if (justCompletedSeek(wasSeekingClip, a.el.seeking)) seekCompletedThisTick.add(a.el);
        if (!justCompletedSeek(wasSeekingClip, a.el.seeking) && shouldIssueStepSeek(a.el.seeking, a.el.currentTime, a.target, stepEps)) {
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
  // K4 (đợt 27): phát ngược TOÀN CỤC thì mute TOÀN BỘ audio (không chỉ
  // clip reverse) — playhead lùi nên không có luồng audio xuôi nào đồng
  // bộ được với hình; im lặng trung thực hơn tiếng xuôi lệch hình. Trạng
  // thái này được báo rõ bằng badge "PHÁT NGƯỢC — không audio" ở preview
  // và trong LIMITS (không giả vờ audio chạy ngược đồng bộ).
  const outSources = playing && reversePlayback
    ? audioSources.map((s) => ({ ...s, gain: 0 }))
    : playing
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
  // Đợt 38 U1: re-render khi đổi ngôn ngữ để chuỗi toggle/badge decode-ahead
  // (cập nhật qua DOM) dùng đúng locale hiện tại ở lần refresh tiếp theo.
  const previewLang = useLang();
  // K5: trạng thái fullscreen (đổi icon nút) + số clip để hiện gợi ý khi trống.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const clipCount = useStore((s) =>
    s.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
  );
  // T5 (Phase 9 đợt 21): MixerMeter chỉ chạy rAF khi đang phát — cần trạng
  // thái playing qua selector (re-render nhẹ khi toggle play, không chạm
  // vào vòng lặp preview vì effect của nó có deps []).
  const isPlaying = useStore((s) => s.playing);
  // K4 (đợt 27): cờ phát ngược toàn cục — badge PHÁT NGƯỢC render theo
  // React (chỉ đổi khi bật/tắt chế độ, không phải mỗi frame).
  const isReversePlayback = useStore((s) => s.reversePlayback);
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
  // J1 (Phase 9 đợt 26): badge cảnh báo curve fail-soft — cập nhật qua DOM
  // trực tiếp như các badge trên (không re-render mỗi frame). Toast chỉ
  // bắn 1 lần mỗi khi tập warning đổi (keyed bởi lastCurveWarnKeyRef).
  const curveWarnBadgeRef = useRef<HTMLDivElement | null>(null);
  const lastCurveWarnKeyRef = useRef<string>("");
  // Đợt 37 T2: badge cảnh báo decode-ahead Q3 — cập nhật qua DOM trực
  // tiếp như badge curve (không re-render mỗi frame). Chỉ hiện khi có
  // controller đang bật decode-ahead qua cổng S3; text/title là đúng
  // chuỗi trong module cổng (không tự bịa chuỗi mới). Toast 1 lần mỗi
  // khi tập warning đổi (keyed bởi lastDecodeAheadWarnKeyRef).
  // Đợt 38 U1: thêm nút toggle + trạng thái gộp (tắt / bị chặn + lý do /
  // đang chạy + số frame prefetch) — cùng cập nhật trong
  // refreshDecodeAheadUi (gọi từ vòng lặp mỗi tick và ngay sau click,
  // vì vòng lặp có thể đang ngủ khi pause). Badge chỉ hiện khi user đã
  // chạm toggle hoặc đang có cảnh báo/đang chạy — chưa chạm thì ẩn để
  // khỏi làm phiền user chưa quan tâm tới tính năng thử nghiệm này.
  const decodeAheadWarnBadgeRef = useRef<HTMLDivElement | null>(null);
  const lastDecodeAheadWarnKeyRef = useRef<string>("");
  const decodeAheadToggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const decodeAheadTouchedRef = useRef(false);
  const lastDecodeAheadBlockedKeyRef = useRef<string>("");
  // K4 (đợt 27): badge FRAME GIỮ — cập nhật qua DOM trực tiếp như các
  // badge trên (không re-render React mỗi frame).
  const holdBadgeRef = useRef<HTMLDivElement | null>(null);
  const lastHoldBadgeRef = useRef<string>("");
  // ROUND43-Y6: badge đường phát ngược (WebCodecs/element) — cập nhật
  // qua DOM trực tiếp như các badge trên (không re-render React mỗi
  // frame). Chỉ hiện khi user đã bật thử nghiệm WebCodecs (cờ opt-in):
  // khi đó badge phải báo ĐÚNG đường đang chạy, kể cả khi trình duyệt
  // thiếu API khiến đường chọn rơi về element. Khi cờ tắt, đường
  // element là mặc định theo thiết kế nên không hiện badge (tránh ồn).
  const reverseEngineBadgeRef = useRef<HTMLDivElement | null>(null);
  const lastReverseEngineBadgeRef = useRef<string>("");
  // ROUND45-A6: badge cuối cùng tick đã tính (để effect [previewLang]
  // tính lại text/title ngay khi đổi lang, kể cả khi vòng lặp đang ngủ
  // lúc pause — nợ Z6 §6.3). Null = badge đang ẩn, effect không làm gì.
  const lastReverseEngineBadge45A6Ref = useRef<ReverseEngineBadge45A6 | null>(null);
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

  // Đợt 38 U1: đồng bộ nút toggle + badge decode-ahead từ trạng thái
  // registry (reverseDecodeAheadStatus). Gọi từ vòng lặp mỗi tick VÀ
  // ngay sau khi user bấm toggle — vòng lặp có thể đang ngủ khi pause
  // nên không được chờ tick. Chỉ ghi DOM khi giá trị đổi (mẫu các badge
  // khác); toast chỉ bắn 1 lần mỗi khi tập cảnh báo / decision chặn đổi
  // (keyed). Chuỗi cổng (warnings) hiển thị nguyên văn theo luật T2;
  // mọi chuỗi mới (nhãn toggle/badge, lý do chặn, toast chặn/tắt) đều
  // qua i18n key decodeahead.* (vi/en).
  const refreshDecodeAheadUi = () => {
    const st = reverseDecodeAheadStatus();
    // Đợt 39 T4: dòng lý do từng controller (để badge/title nhiều clip
    // không hiện 1 lý do gộp đại diện gây hiểu nhầm — nợ U1 §5.4).
    // Controller chưa thử cổng có reasons rỗng → hiện câu unknown, không
    // bịa lý do. Trường hợp 0–1 controller giữ nguyên hành vi U1 cũ.
    const blockedEntries = st.controllers.filter((e) => !e.active);
    const blockedLine = (e: {
      label: string;
      reasons: string[];
    }): string => {
      const labels = e.reasons.map((r) =>
        i18nT(decodeAheadReasonI18nKey(r)),
      );
      return `${e.label}: ${labels.join("; ") || i18nT("decodeahead.reason.unknown")}`;
    };
    const blockedLines = blockedEntries.map(blockedLine).join("\n");
    const btn = decodeAheadToggleBtnRef.current;
    if (btn) {
      const label = st.active
        ? i18nT("decodeahead.toggleOn")
        : st.wanted
          ? i18nT("decodeahead.toggleBlocked")
          : i18nT("decodeahead.toggleOff");
      if (btn.textContent !== label) btn.textContent = label;
      btn.setAttribute("aria-pressed", st.active ? "true" : "false");
      btn.dataset.status = st.uiStatus;
      const reasonLabels = st.reasons.map((r) =>
        i18nT(decodeAheadReasonI18nKey(r)),
      );
      // Đang chạy mà có clip khác bị chặn (trạng thái hỗn hợp) thì
      // title kèm thêm dòng từng clip bị chặn sau warnings; bị chặn mà
      // nhiều controller thì title là dòng từng clip thay cho hợp chung.
      const title = st.active
        ? [st.warnings.join("\n"), blockedLines].filter(Boolean).join("\n")
        : st.wanted
          ? st.controllers.length > 1
            ? blockedLines || reasonLabels.join("; ")
            : reasonLabels.join("; ")
          : i18nT("decodeahead.toggleHint");
      if (btn.title !== title) btn.title = title;
    }
    // Toast cảnh báo cổng (giữ đúng hành vi T2).
    const warnKey = st.warnings.join("\n");
    if (warnKey !== lastDecodeAheadWarnKeyRef.current) {
      lastDecodeAheadWarnKeyRef.current = warnKey;
      for (const w of st.warnings) pushToast(w, "info");
    }
    // Toast chặn: chỉ khi user đã bật toggle mà cổng chặn; tắt toggle
    // thì reset key để lần bật sau lại báo (không spam mỗi tick).
    if (st.wanted && !st.active && st.decision) {
      const blockedKey = `blocked:${st.reasons.join(",")}`;
      if (blockedKey !== lastDecodeAheadBlockedKeyRef.current) {
        lastDecodeAheadBlockedKeyRef.current = blockedKey;
        const reasonLabels = st.reasons.map((r) =>
          i18nT(decodeAheadReasonI18nKey(r)),
        );
        pushToast(
          i18nT("decodeahead.toastBlocked", {
            reasons:
              reasonLabels.join("; ") || i18nT("decodeahead.reason.unknown"),
          }),
          "info",
        );
      }
    } else if (!st.wanted) {
      lastDecodeAheadBlockedKeyRef.current = "";
    }
    const badge = decodeAheadWarnBadgeRef.current;
    if (badge) {
      let text = "";
      let title = "";
      if (st.active) {
        text = i18nT("decodeahead.badgeRunning", {
          n: String(st.prefetchFrames),
        });
        // Trạng thái hỗn hợp: đang chạy + clip khác bị chặn → title
        // kèm dòng từng clip bị chặn (không giấu clip bị chặn sau
        // badge "đang chạy" chung).
        title = [st.warnings.join("\n"), blockedLines]
          .filter(Boolean)
          .join("\n");
      } else if (st.wanted) {
        const reasonLabels = st.reasons.map((r) =>
          i18nT(decodeAheadReasonI18nKey(r)),
        );
        // Đợt 39 T4: nhiều clip bị chặn với lý do KHÁC nhau thì không
        // hiện 1 lý do đại diện (gây hiểu nhầm — nợ U1 §5.4): badge
        // hiện số clip + title liệt kê từng clip. 1 clip, hoặc nhiều
        // clip cùng lý do, giữ nguyên text U1 cũ.
        if (
          st.controllers.length > 1 &&
          blockedReasonsDiffer(st.controllers)
        ) {
          text = i18nT("decodeahead.badgeBlockedMulti", {
            n: String(blockedEntries.length),
          });
        } else {
          text =
            reasonLabels.length > 0
              ? `${i18nT("decodeahead.badgeBlocked")} — ${reasonLabels[0]}`
              : i18nT("decodeahead.badgeBlocked");
        }
        title =
          st.controllers.length > 1
            ? blockedLines || reasonLabels.join("\n")
            : reasonLabels.join("\n");
      } else if (decodeAheadTouchedRef.current) {
        text = i18nT("decodeahead.badgeOff");
        title = i18nT("decodeahead.toggleHint");
      }
      if (badge.textContent !== text) badge.textContent = text;
      if (badge.title !== title) badge.title = title;
      badge.style.display = text ? "block" : "none";
    }
  };

  // Đợt 38 U1: click toggle = đảo cờ wanted qua cổng (không bypass):
  // bật → thử cổng ngay trên các controller đã có (chưa có số đo thì
  // hiện "bị chặn" + lý do, và cửa sổ decode mới sẽ tự thử lại);
  // tắt → dừng prefetch mới ngay + toast xác nhận. Refresh ngay sau
  // click để phản hồi không phụ thuộc vòng lặp (có thể đang ngủ).
  // Đợt 39 T4: tắt giữa chừng nay còn dọn prefetch đang bay khi nó
  // settle (dropSettledPrefetchIfOff) — badge "prefetch 0" khớp cache;
  // cổng KHÔNG re-gate khi đang chạy (giữ luật T2, xem quyết định
  // re-gate trong reverseDecodeAheadToggle.ts).
  const onDecodeAheadToggleClick = () => {
    decodeAheadTouchedRef.current = true;
    const next = !getReverseDecodeAheadWanted();
    setReverseDecodeAheadWanted(next);
    if (!next) pushToast(i18nT("decodeahead.toastOffNote"), "info");
    refreshDecodeAheadUi();
  };

  // Đợt 38 U1: đổi ngôn ngữ re-render JSX về nhãn mặc định (toggleOff)
  // nên phải refresh lại ngay — vòng lặp có thể đang ngủ khi pause nên
  // không được chờ tick tiếp theo (nếu không nhãn sẽ kẹt sai trạng thái
  // cho tới khi phát lại).
  useEffect(() => {
    refreshDecodeAheadUi();
  }, [previewLang]);

  // ROUND45-A6: đổi ngôn ngữ cũng refresh badge đường phát ngược ngay
  // (nợ Z6 §6.3) — badge này cập nhật qua DOM trong tick vòng lặp,
  // mà vòng lặp NGỦ khi pause nên đổi lang lúc pause sẽ kẹt chuỗi cũ
  // cho tới khi vòng lặp tỉnh lại nếu chỉ trông chờ tick. Effect này
  // tính lại text/title từ badge cuối cùng đã lưu (không cần spec hay
  // tick mới); badge đang ẩn (null) thì không làm gì. Chạy cả ở lần
  // mount đầu nhưng khi đó badge chưa có nên là no-op.
  useEffect(() => {
    const badge = lastReverseEngineBadge45A6Ref.current;
    const el = reverseEngineBadgeRef.current;
    if (!badge || !el) return;
    try {
      const display = reverseEngineBadgeDisplay45A6(badge, i18nT);
      const key = `${display.text}\n${display.title}`;
      if (lastReverseEngineBadgeRef.current !== key) {
        lastReverseEngineBadgeRef.current = key;
      }
      el.textContent = display.text;
      el.title = display.title;
      if (display.bg) el.style.background = display.bg;
      el.style.display = display.text ? "block" : "none";
    } catch {
      // Badge không được làm hỏng render khi đổi lang.
    }
  }, [previewLang]);

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
    // K4 (đợt 27): phần dư thời gian (< 1 frame) cho phát ngược — xem
    // reverseStep. Reset khi không phát ngược để không bước bù 1 frame
    // cũ khi bật lại chế độ ngược sau thời gian dài tạm dừng.
    let reverseAcc = 0;
    // Đợt 29 L2: phần dư thời gian (< 1 frame) cho phát XUÔI — đối xứng
    // reverseAcc. Reset khi không phát xuôi để không bước bù 1 frame cũ
    // khi phát lại sau thời gian dài tạm dừng.
    let forwardAcc = 0;
    let sleeping = false;
    // Đợt 34 Q2: tick đầu sau wake() — hook rAF loại mẫu này khỏi phân
    // tích sustained (xem previewRafHook.ts §điểm chèn).
    let justWoke = false;
    // Đợt 34 Q2: engine phát ngược đã công bố lần cuối (để chỉ ghi
    // window.__vcutReverseEngine khi đổi, không ghi mỗi tick).
    let lastEngine: string | null = null;
    let pendingSeek = false;
    let redrawFlag = false;
    // ROUND41-W2: bộ đếm cap vòng lặp vẽ lại pause (xem pauseDraw41W2.ts).
    // Chỉ sống trong effect vòng lặp này; reset ở nhánh request-seek
    // mới, justPaused và redrawFlag (cùng chỗ reset lastDrawn/
    // lastRequested), và về 0 ngay khi một lần render vẽ được.
    let pauseRetrySkipped = 0;
    let pauseRetryExhausted = false;
    // ROUND50-F2 (§7.6): tick gần nhất có lấy được ctx 2d không.
    // getContext("2d") trả null thì tickInner chỉ return — cờ này để
    // scheduleNext biết mà KHÔNG cho ngủ (xem previewLoopShouldSleep):
    // ngủ khi thiếu ctx tuy vẫn tỉnh được qua store change, nhưng lần
    // mount lại của canvas không chạm store nên vòng lặp có thể ngủ
    // quên; tick tiếp là lựa chọn an toàn (lần tick sau có ctx sẽ vẽ
    // bình thường, còn ctx hỏng vĩnh viễn thì thực tế không xảy ra —
    // getContext("2d") trên canvas thật không trả null). Cờ chỉ được
    // ghi ở đúng chỗ lấy ctx trong tickInner (false ngay khi lấy được),
    // nên giá trị cũ (stale) chỉ xảy ra khi tick ném trước khi tới chỗ
    // lấy ctx — lúc đó ép tick tiếp cũng là lựa chọn an toàn (vòng lặp
    // đang lỗi, không được ngủ).
    let ctxMissing = false;
    // ROUND50-F2 (§7.7): thời điểm (cùng đồng hồ performance.now() với
    // timestamp rAF `now`) của lần skip ĐẦU TIÊN trong chuỗi skip hiện
    // tại — mốc tính trần tường 10 s. Chỉ ghi khi chuỗi vừa bắt đầu
    // (pauseRetrySkipped === 0 trước lần advance), và KHÔNG cần xóa ở
    // các chỗ reset đếm: khi đếm về 0 thì trần tường không chạm (cần
    // ≥ PAUSE_RETRY_WALL_MIN_SKIPS skip), còn chuỗi mới sẽ ghi đè mốc
    // ngay lần skip đầu của nó.
    let pauseRetryStreakSince: number | null = null;
    // ROUND42-X2: bộ đếm cap seek-timeout / seek-error (xem
    // pauseSeekCap42X2.ts). Chỉ sống trong effect vòng lặp này;
    // reset ở nhánh request-seek mới, justPaused và redrawFlag
    // (cùng chỗ reset lastDrawn/lastRequested của W2), và ngay khi
    // một lần seek thành công vào nhánh vẽ.
    let seekFailureCount = 0;
    let seekFailureExhausted = false;
    let seekFailureKind: "timeout" | "error" | null = null;
    let seekFailureTarget: number | null = null;
    // ROUND43-Y2: số element đã drop khỏi pool ở lần cạn cap gần nhất +
    // trong đó bao nhiêu cái đang seeking (phơi qua idleDebug để harness
    // chẩn đoán; reset cùng mọi chỗ reset cap X2).
    let seekElementRecreated = 0;
    let seekRecreatedSeeking = 0;
    // ROUND42-X2: playhead mà chuỗi thất bại trên đang đếm cho. BẮT
    // BUỘC phải có: nhánh request-seek mới chạy cả cho lần retry cùng
    // t (sau khi nhánh else mở guard bằng lastRequested = null) lẫn
    // cho scrub sang t mới — chỉ target này mới phân biệt được hai
    // trường hợp: retry cùng t PHẢI giữ đếm (nếu reset thì cap không
    // bao giờ chạm), t mới thì reset. Reset cùng các chỗ reset cap.
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
      // ROUND41-W2: phơi bộ đếm cap để harness đo được "vì sao ngủ"
      // (ngủ thường vs ngủ vì cạn cap) mà không cần đoán từ ticks.
      pauseRetrySkipped: number;
      pauseRetryExhausted: boolean;
      // ROUND42-X2: phơi bộ đếm cap seek để harness đo được "vì sao
      // ngủ" ở đường seek (ngủ vì seek đã bỏ cuộc, kind nào) — cùng
      // mẫu với cap W2, không phải trạng thái UI riêng.
      seekFailureCount: number;
      seekFailureExhausted: boolean;
      seekFailureKind: "timeout" | "error" | null;
      seekFailureTarget: number | null;
      // ROUND43-Y2: phơi số element đã drop ở lần cạn cap gần nhất +
      // số trong đó đang seeking (harness đọc để biết phục hồi đã chạy
      // chưa và trường hợp nào thực sự xảy ra).
      seekElementRecreated: number;
      seekRecreatedSeeking: number;
      // ROUND49-E4: số tick đã ném lỗi nhưng được bọc try/catch cứu
      // (vòng lặp tiếp tục thay vì chết cứng — xem loop bên dưới).
      tickErrors: number;
      // ROUND50-F2 (§7.7): chuỗi skip hiện tại đã cạn trần tường 10 s
      // chưa (pauseRetryWallExhausted) — phơi để harness phân biệt ngủ
      // vì trần tường với ngủ vì cạn cap tick 600 (pauseRetryExhausted).
      pauseRetryWallExhausted: boolean;
    };
    const idleDebug: PreviewIdleDebug = {
      ticks: 0,
      sleeping: false,
      lastDrawn: null,
      lastRequested: null,
      pendingSeek: false,
      redrawFlag: false,
      pauseRetrySkipped: 0,
      pauseRetryExhausted: false,
      seekFailureCount: 0,
      seekFailureExhausted: false,
      seekFailureKind: null,
      seekFailureTarget: null,
      seekElementRecreated: 0,
      seekRecreatedSeeking: 0,
      tickErrors: 0,
      pauseRetryWallExhausted: false,
    };
    const winHook = window as unknown as {
      __vcutPreviewIdle?: PreviewIdleDebug;
      __vcutPreviewRaf?: ReturnType<typeof createPreviewRafHook>;
      __vcutReverseEngine?: string;
    };
    winHook.__vcutPreviewIdle = idleDebug;
    // Đợt 34 Q2: hook rAF riêng vòng preview (đo gap/lost thật của
    // vòng này, thay probe toàn cục N2). Ghi mẫu TRƯỚC khi last bị ghi
    // đè ở dòng dt bên dưới, và trước nhánh early-return chưa có
    // canvas/wrap để cả tick chưa vẽ cũng được đếm.
    const rafDebug = createPreviewRafHook();
    winHook.__vcutPreviewRaf = rafDebug;
    const tickInner = (now: number) => {
      idleDebug.ticks++;
      const st = useStore.getState();
      rafDebug.record(
        now,
        last,
        st.playing,
        st.reversePlayback,
        justWoke,
        st.playhead,
      );
      justWoke = false;
      // Đợt 34 Q2: công bố engine phát ngược đang chọn (mặc định
      // "element"; "webcodecs" chỉ khi cờ opt-in bật + có VideoDecoder).
      // Tên revEngine để khỏi đụng biến `engine` (AudioEngine) ở cuối
      // vòng lặp này.
      const revEngine = resolveReverseEngine();
      if (revEngine !== lastEngine) {
        lastEngine = revEngine;
        winHook.__vcutReverseEngine = revEngine;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (st.playing) {
        if (st.reversePlayback) {
          forwardAcc = 0;
          // K4 (đợt 27): phát ngược toàn cục — playhead LÙI đúng từng
          // frame (không dùng dt trực tiếp như phát xuôi vì setPlayhead
          // snap về lưới frame sẽ làm tròn gây lặp/skip frame khi dt ~
          // 16ms < 1 frame 33ms). Tích lũy dt rồi bước nguyên frame khi
          // đủ; chạm 0 thì dừng (không quấn về cuối). Element được
          // seek-stepping ở syncMedia bên dưới, audio mute toàn bộ.
          const fps = st.spec.meta.fps > 0 ? st.spec.meta.fps : 30;
          const frameDur = 1 / fps;
          const step = reverseStep(reverseAcc, dt, frameDur);
          reverseAcc = step.accumulated;
          if (step.steps > 0) {
            const r = reversePlayhead(st.playhead, step.steps, frameDur);
            if (r.reachedStart) reverseAcc = 0;
            st.setPlayhead(r.t);
            if (r.reachedStart) useStore.setState({ playing: false });
          }
        } else {
          reverseAcc = 0;
          const d = st.duration();
          if (!(d > 0)) {
            // Giữ hành vi cũ khi timeline rỗng: dừng ngay, không chờ
            // đủ 1 frame mới dừng (forwardStep với steps = 0 sẽ không
            // bao giờ chạm nhánh dừng).
            forwardAcc = 0;
            st.setPlayhead(d);
            useStore.setState({ playing: false });
          } else {
            // Đợt 29 L2: KHÔNG gọi setPlayhead(playhead + dt) trực tiếp
            // nữa — snap Math.round trong setPlayhead làm tròn nửa frame
            // lên, khiến playhead chạy nhanh 1.158× wall ở 30 fps và gây
            // chu kỳ drift-seek của syncMedia (đợt 28 L2 §2.3). Tích lũy
            // dt rồi chỉ bước nguyên frame khi đủ, như reverseStep ở
            // chiều ngược; tick chưa đủ frame thì playhead đứng yên
            // trên lưới frame (không gọi setPlayhead, không snap thừa).
            const fps = st.spec.meta.fps > 0 ? st.spec.meta.fps : 30;
            const frameDur = 1 / fps;
            const step = forwardStep(forwardAcc, dt, frameDur);
            forwardAcc = step.accumulated;
            if (step.steps > 0) {
              const r = forwardPlayhead(st.playhead, step.steps, frameDur, d);
              if (r.reachedEnd) forwardAcc = 0;
              st.setPlayhead(r.t);
              if (r.reachedEnd) useStore.setState({ playing: false });
            }
          }
        }
      } else {
        reverseAcc = 0;
        forwardAcc = 0;
      }
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      // T5: chưa có canvas/wrap thì KHÔNG được ngủ (frame chưa từng vẽ) —
      // giữ hành vi cũ là tick tiếp để chờ mount.
      // ROUND50-F2 (§7.6): chỉ return — KHÔNG đặt rAF trực tiếp ở đây
      // nữa; quyền đặt lịch thuộc về wrapper `loop` (finally →
      // scheduleNext), và scheduleNext KHÔNG cho ngủ khi thiếu surface
      // (xem previewLoopShouldSleep) nên ngữ nghĩa "tick tiếp chờ
      // mount" được giữ nguyên ở điểm đặt lịch duy nhất.
      if (!canvas || !wrap) return;
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
      // ROUND50-F2 (§7.6): ctx null cũng chỉ return — wrapper `loop`
      // sẽ đặt lịch lại (tick tiếp, không ngủ) qua cờ ctxMissing; trước
      // đây return này không đặt lịch nên vòng lặp chết hẳn (sleeping
      // vẫn false, wake() no-op — đo headed baseline: ticks đóng băng
      // ở 1). Cờ được ghi false ngay khi lấy được ctx, true khi null.
      ctxMissing = !ctx;
      if (!ctx) return;
      // N5: spec cho preview — nested đã phẳng, adjustment đã gộp vào clip
      // qua cắt đoạn. Spec gốc trong store không đổi; không có nested/
      // adjustment thì buildPreviewSpec trả đúng object cũ (không copy).
      // J1 (đợt 26): hot path dùng bản fail-soft — nested curve vi phạm
      // không còn ném uncaught làm chết frame (đợt 25 I6 §5a): nested lỗi
      // về 1× (hoặc bị bỏ), nested lành giữ ramp, warning hiện bằng
      // badge thường trực dưới đây + toast 1 lần mỗi khi tập warning đổi.
      // Guard cuối: lỗi ngoài phạm vi nested-curve (failsoft ném lại lỗi
      // gốc) thì hiện spec gốc + toast, vòng lặp vẫn sống.
      let spec: VideoSpec;
      {
        const rawSpec = useStore.getState().spec;
        let warnText = "";
        let warnTitle = "";
        try {
          const failsoft = buildPreviewSpecFailsoft(rawSpec);
          spec = failsoft.spec;
          if (failsoft.warnings.length > 0) {
            const dropped = failsoft.warnings.filter((w) => w.fallback === "dropped").length;
            warnText = dropped > 0
              ? `⚠ Curve: ${failsoft.warnings.length} nested lỗi (${dropped} bị ẩn)`
              : `⚠ Curve: ${failsoft.warnings.length} nested về 1×`;
            warnTitle = failsoft.warnings.map((w) =>
              `nested "${w.nestedId}": ${w.reason} → ${w.fallback === "linear-1x" ? "preview tạm về 1× (export vẫn fail-fast, cần sửa curve thật)" : "tạm ẩn khỏi preview"}`,
            ).join("\n");
            const key = failsoft.warnings.map((w) => `${w.nestedId}|${w.fallback}|${w.reason}`).join(";");
            if (key !== lastCurveWarnKeyRef.current) {
              lastCurveWarnKeyRef.current = key;
              for (const w of failsoft.warnings) {
                pushToast(
                  `Preview: nested "${w.nestedId}" có speed curve không hợp lệ (${w.reason}) — đã ${w.fallback === "linear-1x" ? "tạm về 1×" : "tạm ẩn khỏi preview"} để preview không dừng. Export vẫn fail-fast theo luật render, cần sửa curve thật.`,
                  "error",
                );
              }
            }
          } else if (lastCurveWarnKeyRef.current !== "") {
            lastCurveWarnKeyRef.current = "";
          }
        } catch (e) {
          spec = rawSpec;
          const msg = e instanceof Error ? e.message : String(e);
          warnText = "⚠ Preview lỗi làm phẳng";
          warnTitle = `${msg} — đang hiện spec gốc, nested có thể không hiển thị.`;
          const key = `err:${msg}`;
          if (key !== lastCurveWarnKeyRef.current) {
            lastCurveWarnKeyRef.current = key;
            pushToast(`Preview không làm phẳng được project (${msg}) — đang hiện spec gốc, nested có thể không hiển thị.`, "error");
          }
        }
        const badge = curveWarnBadgeRef.current;
        if (badge) {
          if (badge.textContent !== warnText) badge.textContent = warnText;
          if (badge.title !== warnTitle) badge.title = warnTitle;
          badge.style.display = warnText ? "block" : "none";
        }
      }
      // Đợt 38 U1: toggle + badge decode-ahead Q3 — trạng thái gộp
      // (tắt / bị chặn + lý do / đang chạy + số frame prefetch) trong
      // refreshDecodeAheadUi; toast cảnh báo cổng + toast chặn đều keyed
      // trong đó (không còn khối badge riêng của T2 nữa).
      refreshDecodeAheadUi();
      // K4 (đợt 27): badge FRAME GIỮ — hiện khi tick renderFrame trước
      // đó có clip rơi vào nhánh hold (decoder tụt, đang vẽ lại frame
      // tốt cũ thay vì đen). "(cũ)" = frame giữ đã quá MAX_HOLD_AGE_SEC
      // (3 s timeline): hình vẫn giữ, không quay lại đen, nhưng người
      // dùng cần biết hình đang đứng yên trong khi tiếng (nếu có) chạy.
      // Badge đọc tickHadHold của tick trước (khối badge chạy trước
      // renderFrame trong cùng tick) nên trễ tối đa 1 tick — chấp nhận
      // được cho chỉ báo, không ảnh hưởng nội dung frame.
      {
        const holdText = tickHadHold
          ? (holdStats.stale ? "⏸ FRAME GIỮ (cũ)" : "⏸ FRAME GIỮ")
          : "";
        const holdBadge = holdBadgeRef.current;
        if (holdBadge && lastHoldBadgeRef.current !== holdText) {
          lastHoldBadgeRef.current = holdText;
          holdBadge.textContent = holdText;
          holdBadge.style.display = holdText ? "block" : "none";
        }
      }
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
      // ROUND43-Y6: badge đường phát ngược — chỉ khi đang stepping
      // (phát ngược toàn cục hoặc clip.reverse đang xem) VÀ cờ opt-in
      // WebCodecs đang bật. Text/title lấy từ resolveReverseEngineDetailed
      // (kiểm tra đủ 3 API, không chỉ VideoDecoder như hàm cũ), nên
      // trình duyệt thiếu API sẽ hiện đúng "ELEMENT (thiếu ...)" thay
      // vì im lặng vẽ element trong khi user tưởng đang chạy WebCodecs.
      // ROUND44-Z6: badge = ĐƯỜNG ĐÃ CHỌN qua resolveReverseEngineBadge
      // (hàm thuần, chỉ nhận đường đã chọn + stepping, KHÔNG nhận
      // frame vừa vẽ) + chuỗi qua i18n key reverseEngine.* — hết
      // hardcode tiếng Việt ở badge này. Frame chưa decode kịp vẫn vẽ
      // bằng element qua nhánh fallback của drawVideoClip, nhưng badge
      // vẫn báo đúng đường đã chọn (xem test lệch Z6).
      // ROUND45-A6: badge TỪNG FRAME — khi đường đã chọn là webcodecs
      // nhưng controller của clip đang xem đã failed (getter `failed`
      // = cờ `unsupported`, dính sau load/decode hỏng hoặc khóa file
      // lớn) thì badge đổi sang element-failed thay vì giữ WEBCODECS:
      // frame thực tế đang vẽ bằng element, không phải WebCodecs.
      // Controller lấy đúng bằng getReversePreviewController với cùng
      // tham số đường vẽ dùng (proxyUrl ?? url, knownSize, GOP bật)
      // nên lần tạo controller (nếu chưa có) không khác gì đường vẽ
      // tạo sau đó trong cùng tick — không khóa nhầm GOP, không fetch
      // thêm (fetch chỉ bắt đầu ở frameAt trong drawVideoClip). Chỉ
      // hỏi controller khi đường đã chọn là webcodecs + đang stepping.
      {
        let engineText = "";
        let engineTitle = "";
        let engineBg = "";
        try {
          const detailed = resolveReverseEngineDetailed();
          const reverseGlobal = useStore.getState().reversePlayback;
          let stepping = reverseGlobal;
          if (!stepping) {
            for (const track of spec.tracks) {
              if (track.hidden || track.kind !== "video") continue;
              for (const clip of track.clips) {
                if (clip.kind !== "video") continue;
                if (t < clip.start || t >= clip.start + clip.duration) continue;
                if (clip.reverse) { stepping = true; break; }
              }
              if (stepping) break;
            }
          }
          let controllerFailed = false;
          if (detailed.engine === "webcodecs" && stepping) {
            for (const track of spec.tracks) {
              if (track.hidden || track.kind !== "video") continue;
              for (const clip of track.clips) {
                if (clip.kind !== "video") continue;
                if (t < clip.start || t >= clip.start + clip.duration) continue;
                // Chỉ clip đang stepping mới có controller phát ngược:
                // phát ngược toàn cục -> mọi clip; ngược lại chỉ clip
                // có reverse=true. Clip phát xuôi dùng chung URL nhưng
                // controller failed cũ không được làm lệch badge.
                if (!reverseGlobal && !clip.reverse) continue;
                const it = mediaByName.get(clip.src);
                if (!it) continue;
                try {
                  const c = getReversePreviewController(
                    it.proxyUrl ?? it.url,
                    knownSizeBytesForPreview(it),
                    { gopRangeEnabled: true },
                  );
                  if (c.failed) { controllerFailed = true; break; }
                } catch {
                  // Không đọc được controller thì giữ badge đường đã chọn.
                }
              }
              if (controllerFailed) break;
            }
          }
          const badge = resolveReverseEngineBadge45A6(
            detailed,
            stepping,
            controllerFailed,
          );
          lastReverseEngineBadge45A6Ref.current = badge;
          const display = reverseEngineBadgeDisplay45A6(badge, i18nT);
          engineText = display.text;
          engineTitle = display.title;
          engineBg = display.bg;
        } catch {
          // Badge không được làm hỏng vòng lặp preview.
        }
        const engineBadge = reverseEngineBadgeRef.current;
        const engineKey = `${engineText}\n${engineTitle}`;
        if (engineBadge && lastReverseEngineBadgeRef.current !== engineKey) {
          lastReverseEngineBadgeRef.current = engineKey;
          engineBadge.textContent = engineText;
          engineBadge.title = engineTitle;
          if (engineBg) engineBadge.style.background = engineBg;
          engineBadge.style.display = engineText ? "block" : "none";
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
      // I6 (Phase 9 đợt 25): cạnh XUỐNG playing→paused — frame cuối lúc
      // phát có thể không phải frame tại t (guard readyState>=2 trong
      // drawVideoClip bỏ qua frame khi decoder tụt, nhưng nhánh playing
      // vẫn gán lastDrawn = t mỗi tick). Nếu không ép vẽ lại, nhánh
      // pause thấy t === lastDrawn nên không seek/vẽ gì và canvas kẹt ở
      // frame đó cho tới lần scrub sau. justPaused được xử lý trong
      // nhánh pause bên dưới (cancel + reset lastDrawn/lastRequested
      // để seek+vẽ đúng frame tại t; khi frame cuối đã đúng thì seek
      // gần như no-op ngay lập tức).
      const justPaused = prevPlayingRef.current && !playing;
      prevPlayingRef.current = playing;
      if (playing) {
        // Đang phát: hủy seek dở của Seeker, đồng bộ như cũ, vẽ mỗi frame.
        seekerRef.current!.cancel();
        // K4 (đợt 27): đặt ngữ cảnh transport cho lần renderFrame này
        // (phát ngược toàn cục → mọi clip stepping; phát xuôi → chỉ clip
        // reverse stepping) rồi mới vẽ; nhánh pause bên dưới đặt lại
        // playing: false trước khi vẽ sau seek.
        const reversePlayback = useStore.getState().reversePlayback;
        drawTransport = { playing: true, reversePlayback };
        syncMedia(spec, pool, mediaByName, t, true, engine, forceSeek, reversePlayback);
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
        // I6 (đợt 25): cạnh xuống playing→paused ép vẽ lại frame tại t
        // (xem justPaused ở trên) — cùng 3 thao tác như redrawFlag.
        if (justPaused) {
          seekerRef.current!.cancel();
          lastDrawnTRef.current = null;
          lastRequestedTRef.current = null;
          // ROUND41-W2: reset cap cùng lastDrawn/lastRequested.
          pauseRetrySkipped = 0;
          pauseRetryExhausted = false;
          // ROUND42-X2: reset cap seek cùng chỗ.
          seekFailureCount = 0;
          seekFailureExhausted = false;
          seekFailureKind = null;
          seekFailureTarget = null;
          // ROUND43-Y2: reset số đếm phục hồi cùng cap.
          seekElementRecreated = 0;
          seekRecreatedSeeking = 0;
        }
        if (redrawFlag) {
          seekerRef.current!.cancel();
          lastDrawnTRef.current = null;
          lastRequestedTRef.current = null;
          redrawFlag = false;
          // ROUND41-W2: reset cap cùng lastDrawn/lastRequested.
          pauseRetrySkipped = 0;
          pauseRetryExhausted = false;
          // ROUND42-X2: reset cap seek cùng chỗ.
          seekFailureCount = 0;
          seekFailureExhausted = false;
          seekFailureKind = null;
          seekFailureTarget = null;
          // ROUND43-Y2: reset số đếm phục hồi cùng cap.
          seekElementRecreated = 0;
          seekRecreatedSeeking = 0;
        }
        // ROUND44-Z2: scrub về đúng t đã vẽ sau khi cạn cap ở t khác
        // (nợ Y2 §5.2): canvas đã hiện đúng frame tại t này nên cap cạn
        // ở t khác hết hiệu lực — reset cap đó + căn lastRequested về t
        // để đường ngủ thường xét đúng, thay vì tick mãi vì cả 3 đường
        // seek/vẽ/ngủ đều đóng (t === lastDrawn chặn nhánh seek, t !==
        // lastRequested chặn nhánh vẽ lại, lastRequested !== playhead
        // chặn mọi đường ngủ). Chỉ kích khi KHÔNG có seek bay và t đúng
        // bằng lastDrawn; đang ở chính t đã cạn thì giữ nguyên trạng
        // thái bỏ cuộc của X2/W2. Đặt TRƯỚC nhánh request-seek để lần
        // scrub tiếp theo (kể cả về lại t đã cạn) đi nhánh seek mới
        // trên element mà Y2 đã drop/tạo lại.
        {
          const recovery = planDrawnPlayheadRecovery(
            {
              lastDrawn: lastDrawnTRef.current,
              lastRequested: lastRequestedTRef.current,
              pendingSeek,
              pauseRetryExhausted,
              seekFailureExhausted,
              seekFailureTarget,
            },
            t,
          );
          if (recovery !== null) {
            if (recovery.resetPauseRetry) {
              pauseRetrySkipped = 0;
              pauseRetryExhausted = false;
            }
            if (recovery.resetSeekFailure) {
              seekFailureCount = 0;
              seekFailureExhausted = false;
              seekFailureKind = null;
              seekFailureTarget = null;
              // ROUND43-Y2: reset số đếm phục hồi cùng cap.
              seekElementRecreated = 0;
              seekRecreatedSeeking = 0;
            }
            lastRequestedTRef.current = recovery.lastRequested;
          }
        }
        if (t !== lastDrawnTRef.current && t !== lastRequestedTRef.current) {
          // ROUND41-W2: seek mới cho t mới → cap cũ hết hiệu lực.
          pauseRetrySkipped = 0;
          pauseRetryExhausted = false;
          // ROUND42-X2: CHỈ reset cap seek khi t khác target đang đếm.
          // Nhánh này chạy cả cho lần retry cùng t (nhánh else đã mở
          // guard) — retry cùng t phải GIỮ đếm, nếu reset vô điều kiện
          // như cap W2 thì cap seek không bao giờ chạm. Scrub sang t
          // mới thì target khác t nên reset như thường.
          if (seekFailureTarget !== null && seekFailureTarget !== t) {
            seekFailureCount = 0;
            seekFailureExhausted = false;
            seekFailureKind = null;
            seekFailureTarget = null;
            // ROUND43-Y2: reset số đếm phục hồi cùng cap.
            seekElementRecreated = 0;
            seekRecreatedSeeking = 0;
          }
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
            // Đợt 31 N1 — SỬA BUG B (đợt 30 M1 §5): trước đây seek timeout
            // (> 1200ms) vẫn đi vào nhánh vẽ vì Seeker resolve ok: true
            // ngay cả khi timedOut — tick vẽ đó chạy lúc element chưa
            // seek xong nên decideVideoFrame skip, nhưng renderFrame đã
            // xóa nền trước → canvas đen, rồi lastDrawn = t khiến vòng
            // lặp NGỦ với nền đen vĩnh viễn tới lần scrub tiếp theo.
            // Nay timeout KHÔNG được vẽ, KHÔNG được đánh dấu đã vẽ: rơi
            // xuống nhánh dưới reset lastRequested → tick sau retry
            // (seekElement mới thấy element đang seeking thì chỉ chờ
            // seeked, không gán lại để khỏi hủy seek đang bay — xem
            // seek.ts). Vòng lặp không ngủ vì lastDrawn ≠ playhead nên
            // vẫn tick để retry; khi seeked muộn tới thì vẽ đúng frame.
            // failed (không timeout, vd metadata lỗi) giữ hành vi cũ.
            if (!outcome.cancelled && outcome.ok && outcome.timedOut === 0 && lastRequestedTRef.current === t) {
              // ROUND42-X2: seek đã thành công vào nhánh vẽ → chuỗi
              // thất bại seek đứt ngay tại đây (dù lần vẽ này có bị
              // skip thì skip đó thuộc cap W2, không thuộc cap seek).
              seekFailureCount = 0;
              seekFailureExhausted = false;
              seekFailureKind = null;
              seekFailureTarget = null;
              // ROUND43-Y2: reset số đếm phục hồi cùng cap.
              seekElementRecreated = 0;
              seekRecreatedSeeking = 0;
              // K4 (đợt 27): nhánh pause/seek — không stepping (seek đã
              // chờ seeked), nên drawVideoClip giữ hành vi pause cũ.
              drawTransport = { playing: false, reversePlayback: false };
              // ROUND40-V3-T0: chỉ đánh dấu đã vẽ khi render này thực sự
              // không skip clip video nào. Element có thể seeked xong
              // nhưng chưa có frame (readyState < 2) → decideVideoFrame
              // skip, renderFrame chỉ xóa nền đen; gán lastDrawn = t
              // lúc đó sẽ ngủ vĩnh viễn với nền đen (nợ đợt 39 §5.3).
              // Không vẽ được thì giữ nguyên lastDrawn + lastRequested
              // = t để tick sau vẽ lại (không seek mới) thay vì ngủ.
              const skipBefore = holdStats.skip;
              renderFrame(ctx, spec, pool, mediaByName, t, computeViewport(cw, ch, spec), useStore.getState().selection[0] ?? null);
              // ROUND41-W2: lần render trong .then cũng tính vào cap
              // (lần skip đầu tiên của chuỗi); vẽ được thì đếm về 0.
              if (pauseDrawComplete(skipBefore, holdStats.skip)) {
                lastDrawnTRef.current = t;
                pauseRetrySkipped = 0;
                pauseRetryExhausted = false;
              } else {
                // ROUND50-F2 (§7.7): ghi mốc bắt đầu chuỗi skip (chỉ
                // khi chuỗi vừa bắt đầu) để trần tường 10 s tính từ
                // đây. .then không có timestamp rAF `now` nên dùng
                // performance.now() (cùng đồng hồ).
                if (pauseRetrySkipped === 0) pauseRetryStreakSince = performance.now();
                const adv = pauseRetryAdvance(true, pauseRetrySkipped);
                pauseRetrySkipped = adv.consecutiveSkipped;
                pauseRetryExhausted = adv.exhausted;
              }
            } else if (lastRequestedTRef.current === t) {
              // ROUND42-X2: seek bị hủy/thất bại mà không có request
              // mới hơn. Cancelled giữ hành vi cũ (mở guard để frame
              // sau thử lại, không đếm — bị thay thế / cancel khi phát
              // không phải lỗi). Timeout/error thì đếm vào cap seek:
              // chưa cạn → mở guard để tick sau retry như cũ; ĐÃ CẠN
              // → GIỮ lastRequested = t (guard t !== lastRequested
              // chặn request mới) và scheduleNext cho ngủ ở trạng thái
              // lỗi rõ ràng (seekFailureExhausted/kind phơi qua
              // idleDebug), thay vì request seek mới mãi. Lưu ý:
              // failed-only (ok && timedOut === 0) không tới nhánh
              // này mà đi nhánh vẽ — skip của nó thuộc cap W2.
              const seekKind = classifySeekOutcome(outcome);
              if (seekKind === null) {
                lastRequestedTRef.current = null;
              } else {
                // ROUND43-Y2: đúng thời điểm chuyển sang cạn cap (false
                // → true, chỉ một lần cho mỗi lần cạn) thì drop actives
                // khỏi pool để lần seek sau tạo element mới — element
                // cũ kẹt seeking / demuxer hỏng thì seek mới không bao
                // giờ xong (nợ đợt 42 §5.3, xem
                // pauseSeekRecovery43Y2.ts). Vòng lặp lúc này đã ngủ
                // (pendingSeek = false, lastRequested giữ t) nên không
                // cắt ngang seek đang bay; lần seek sau (scrub t mới,
                // phát, redraw) tự tạo element mới qua videoFor.
                const wasExhausted = seekFailureExhausted;
                const adv = seekFailureAdvance(seekKind, seekFailureCount);
                seekFailureCount = adv.consecutiveFailures;
                seekFailureExhausted = adv.exhausted;
                seekFailureKind = adv.kind;
                seekFailureTarget = t;
                if (adv.exhausted && !wasExhausted) {
                  const { actives } = collectActives(spec, pool, mediaByName, t);
                  const plan = planSeekRecovery(actives.map((a) => a.el));
                  let recreated = 0;
                  for (const el of plan.elements) {
                    if (pool.dropElement(el)) {
                      recreated++;
                      // ROUND44-Z2: gỡ luôn graph AudioEngine của element
                      // cũ (nợ Y2 §5.4) — nếu không, nodes Map giữ element
                      // + chuỗi source→gain cho tới dispose toàn cục, mỗi
                      // lần cạn cap rò 5 node/clip. Element lạ không có
                      // node thì releaseElement trả false, không ném.
                      // `engine` là AudioEngine của tick này (cùng
                      // instance engineRef suốt phiên), gọi ở đây là an
                      // toàn vì vòng lặp đã ngủ vì cạn cap, không còn
                      // seek bay; element mới do pool tạo lại sẽ được
                      // update() tạo source mới ở tick sau.
                      engine.releaseElement(el);
                    }
                  }
                  seekElementRecreated = recreated;
                  seekRecreatedSeeking = plan.seekingCount;
                }
                if (!adv.exhausted) lastRequestedTRef.current = null;
              }
            }
          });
        } else if (
          // ROUND40-V3-T0: seek đã xong cho t nhưng frame chưa vẽ được
          // (lần render trong .then bị skip vì element chưa có frame) —
          // vẽ lại ở tick này mà KHÔNG seek mới (xem pauseDraw40V3.ts:
          // chỉ giữ lastDrawn thôi thì vòng lặp quay mãi không vẽ, vì
          // nhánh pause chỉ vẽ trong .then của seek). Guard !pendingSeek
          // trong helper: seek đang bay thì chờ .then của nó, khỏi vẽ
          // frame sai vị trí. Khi vẽ được thì lastDrawn = t và vòng lặp
          // ngủ lại bình thường; khi vẫn skip thì tick tiếp.
          pauseTickNeedsRetry(t, lastDrawnTRef.current, lastRequestedTRef.current, pendingSeek)
        ) {
          // ROUND41-W2: đã cạn cap thì tick này KHÔNG render nữa —
          // scheduleNext bên dưới sẽ cho vòng lặp ngủ (điều kiện ngủ
          // kiểu bỏ cuộc), thay vì tick rAF mãi với nền đen.
          // ROUND42-X2: đã cạn cap seek thì tick này cũng KHÔNG render
          // nữa — scheduleNext cho ngủ kiểu seek-bỏ-cuộc (điều kiện
          // ngủ mới), thay vì vẽ lại frame ở vị trí seek chưa xong.
          if (!pauseRetryExhausted && !seekFailureExhausted) {
            drawTransport = { playing: false, reversePlayback: false };
            const skipBefore = holdStats.skip;
            renderFrame(ctx, spec, pool, mediaByName, t, computeViewport(cw, ch, spec), useStore.getState().selection[0] ?? null);
            if (pauseDrawComplete(skipBefore, holdStats.skip)) {
              lastDrawnTRef.current = t;
              pauseRetrySkipped = 0;
              pauseRetryExhausted = false;
            } else {
              // ROUND50-F2 (§7.7): ghi mốc bắt đầu chuỗi skip (chỉ khi
              // chuỗi vừa bắt đầu) để trần tường 10 s tính từ đây.
              if (pauseRetrySkipped === 0) pauseRetryStreakSince = now;
              const adv = pauseRetryAdvance(true, pauseRetrySkipped);
              pauseRetrySkipped = adv.consecutiveSkipped;
              pauseRetryExhausted = adv.exhausted;
            }
          }
        }
      }
      // T5: chụp trạng thái điều kiện ngủ cho hook đo trước khi đặt lịch.
      idleDebug.lastDrawn = lastDrawnTRef.current;
      idleDebug.lastRequested = lastRequestedTRef.current;
      idleDebug.pendingSeek = pendingSeek;
      idleDebug.redrawFlag = redrawFlag;
      // ROUND41-W2: phơi bộ đếm cap cho harness đo.
      idleDebug.pauseRetrySkipped = pauseRetrySkipped;
      idleDebug.pauseRetryExhausted = pauseRetryExhausted;
      // ROUND50-F2 (§7.7): phơi cờ trần tường cho harness đo (tính từ
      // cùng mốc streak như scheduleNext, bằng timestamp rAF `now`).
      idleDebug.pauseRetryWallExhausted = pauseRetryWallExhausted(
        pauseRetrySkipped,
        pauseRetryStreakSince,
        now,
      );
      // ROUND42-X2: phơi bộ đếm cap seek cho harness đo.
      idleDebug.seekFailureCount = seekFailureCount;
      idleDebug.seekFailureExhausted = seekFailureExhausted;
      idleDebug.seekFailureKind = seekFailureKind;
      idleDebug.seekFailureTarget = seekFailureTarget;
      // ROUND43-Y2: phơi số đếm phục hồi cho harness đo.
      idleDebug.seekElementRecreated = seekElementRecreated;
      idleDebug.seekRecreatedSeeking = seekRecreatedSeeking;
      // ROUND50-F2 (§7.6): KHÔNG đặt lịch ở cuối tickInner nữa — quyền
      // đặt lịch thuộc về wrapper `loop` (finally → scheduleNext), để
      // mọi đường return trong tick (kể cả early-return chưa có canvas
      // / ctx null) đều đi qua cùng một điểm đặt lịch. T5: đặt lịch tick
      // tiếp — hoặc NGỦ nếu không còn việc (xem đầu effect) — nay do
      // scheduleNext trong finally của `loop` quyết định.
    };
    // ROUND49-E4: bọc tick bằng try/catch — phòng thủ chiều sâu cho vòng
    // lặp preview (nợ D3 §8.4: volumeKeyframes [null] từng giết tick ở
    // syncMedia vì scheduleNext() ở cuối tick không chạy; sleeping vẫn
    // false nên wake() no-op và vòng lặp chết cứng tới khi reload).
    // Fix gốc rễ là sanitize ở cổng load (projectRepo.ts), nhưng đường
    // in-memory (sửa tay qua MCP/devtools, undo, clip tạo trong phiên)
    // không qua cổng load vẫn có thể đưa dữ liệu xấu vào tick — bọc này
    // đảm bảo MỌI lỗi tick đều không giết được vòng lặp. KHÔNG nuốt lỗi
    // âm thầm: mỗi lần ném đều console.error + đếm vào
    // idleDebug.tickErrors để harness đo được; lỗi dai dẳng sẽ thấy rõ
    // qua tickErrors tăng mỗi tick thay vì vòng lặp chết im.
    // ROUND50-F2 (§7.6): wrapper `loop` giờ là NƠI DUY NHẤT đặt lịch —
    // finally gọi scheduleNext() sau MỌI lần tickInner trả về (kể cả
    // early-return chưa có canvas / ctx null) hoặc ném. Nhờ vậy không
    // còn đường nào trong tick trả về mà không đặt lịch hoặc ngủ: lỗ
    // `if (!ctx) return;` của E4 §7.6 đã kín (đo headed baseline: ticks
    // đóng băng ở 1; sau sửa: ticks tăng, xem LIMITS đợt 50 F2).
    // Chỉ có một đường scheduleNext duy nhất mỗi lần loop chạy nên
    // không double-rAF, trừ khi chính scheduleNext ném (gần như không
    // thể — chỉ đọc state + requestAnimationFrame; ghi nhận ở LIMITS
    // đợt 49 E4 §3.3).
    let tickErrors = 0;
    const loop = (now: number) => {
      try {
        tickInner(now);
      } catch (err) {
        tickErrors++;
        idleDebug.tickErrors = tickErrors;
        console.error("[preview] tick lỗi, vòng lặp tiếp tục:", err);
      } finally {
        scheduleNext();
      }
    };
    const scheduleNext = () => {
      const s = useStore.getState();
      // ROUND50-F2 (§7.7): cạn trần tường 10 s thì coi như cạn cap vẽ
      // lại — gộp vào pauseRetryExhausted để mọi logic hạ nguồn (nhánh
      // vẽ lại, guard Z2, điều kiện ngủ) đối xử y hệt cạn cap tick 600.
      // Chỉ set khi vừa chuyển sang cạn (không ghi đè cờ đã cạn sẵn);
      // các chỗ reset pauseRetryExhausted (seek mới / justPaused /
      // redrawFlag / vẽ được) vẫn reset như cũ, không cần chỗ reset
      // riêng cho trần tường. Cờ wall riêng phơi qua idleDebug để
      // harness phân biệt nguyên nhân ngủ.
      // LƯU Ý: phải publish cả hai cờ ra idleDebug NGAY TẠI ĐÂY (nơi
      // quyết định ngủ), không chỉ trông chờ snapshot trong thân tick:
      // snapshot chạy TRƯỚC scheduleNext trong cùng tick, nên tick mà
      // trần tường vừa chạm ngưỡng (snapshot tính chưa đủ 10 s, còn
      // scheduleNext tính đã đủ) sẽ ngủ mà idleDebug vẫn ghi cả hai cờ
      // false — harness đo sau ngủ sẽ không thấy nguyên nhân. Đo
      // headed lần đầu sau sửa bắt đúng trường hợp này (ngủ 11,5 s,
      // skip 86, cả hai cờ false).
      const wallExhaustedNow = pauseRetryWallExhausted(
        pauseRetrySkipped,
        pauseRetryStreakSince,
        performance.now(),
      );
      if (!pauseRetryExhausted && wallExhaustedNow) {
        pauseRetryExhausted = true;
      }
      idleDebug.pauseRetryWallExhausted = wallExhaustedNow;
      idleDebug.pauseRetryExhausted = pauseRetryExhausted;
      // ROUND50-F2 (§7.6): thiếu surface thì KHÔNG được ngủ — kiểm tra
      // refs trực tiếp ở đây (luôn tươi, không qua cờ) để không bao giờ
      // ngủ với surface đã biến mất; ctxMissing là cờ tickInner ghi ở
      // chỗ lấy ctx (xem trên). Công thức ngủ còn lại giữ nguyên, nay
      // nằm trong previewLoopShouldSleep để test khóa được.
      const surfaceMissing =
        !canvasRef.current || !wrapRef.current || ctxMissing;
      if (
        previewLoopShouldSleep({
          playing: s.playing,
          pendingSeek,
          redrawFlag,
          playhead: s.playhead,
          lastDrawn: lastDrawnTRef.current,
          lastRequested: lastRequestedTRef.current,
          pauseRetryExhausted,
          seekFailureExhausted,
          surfaceMissing,
        })
      ) {
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
      // Đợt 34 Q2: đánh dấu tick đầu sau giấc ngủ để hook rAF loại nó
      // khỏi phân tích sustained (wake() reset last nên gap tick đó
      // nhỏ theo cấu tạo, không phải gap thật).
      justWoke = true;
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
    // C (Phase 9 đợt 22): tab ẩn rồi hiện lại trong lúc NGỦ. rAF của tab
    // ẩn vốn đã dừng, và khi hiện lại không có store change nào nên vòng
    // ngủ không có lý do gì để tỉnh — baseline đo được nó vẫn tỉnh (ticks
    // +9, draws +1, px không đổi) nhờ một trigger ngoài chưa xác định
    // (nghi resize/focus lúc restore tab), tức hành vi đúng nhưng do may
    // mắn, không được dựa vào. Khi tab hiện lại (visibilitychange ->
    // visible, hoặc pageshow sau bfcache restore), ép vẽ lại ĐÚNG frame
    // cũ rồi ngủ lại: redrawFlag buộc đường seek+vẽ ở cùng playhead,
    // wake() đặt lại rAF. Vẽ lại là cần thiết vì bitmap canvas có thể bị
    // hủy trong lúc tab ẩn lâu/bị discard; nếu bitmap còn nguyên thì vẽ
    // lại cho cùng 1 frame (px hash không đổi, xem LIMITS đợt 22 C).
    // Khi đang phát thì sleeping = false nên handler này no-op (vòng đã
    // chạy, rAF bị kẹp lúc ẩn sẽ tự nổ lại khi hiện). pagehide không cần
    // xử lý gì thêm: rAF tự dừng, không có state nào phải dọn.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!sleeping) return;
      redrawFlag = true;
      wake();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
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
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("pointerdown", kickAudio);
      window.removeEventListener("keydown", kickAudio);
      if (winHook.__vcutPreviewIdle === idleDebug) delete winHook.__vcutPreviewIdle;
      // Đợt 34 Q2: dọn hook rAF + đóng mọi VideoFrame cache còn giữ.
      if (winHook.__vcutPreviewRaf === rafDebug) delete winHook.__vcutPreviewRaf;
      if (winHook.__vcutReverseEngine !== undefined) delete winHook.__vcutReverseEngine;
      disposeReverseWebcodecsControllers();
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
        // Phase 9 đợt 27 K1 — cùng guard như drawTextClip: hit-test đọc
        // clip.style.fontSize + textClipVisual đọc clip.style trực tiếp,
        // nên dùng bản sao đã chuẩn hóa để đo; clip gốc vẫn trả về để
        // select/drag giữ đúng identity trong store.
        const styledClip = { ...clip, style: normalizeTextStyle(clip.style) };
        ctx.font = textFont(styledClip);
        const textW = Math.max(1, ctx.measureText(clip.text || " ").width);
        const textH = styledClip.style.fontSize * 1.35;
        const vis = textClipVisual(styledClip, t - clip.start, W, H, { textW, textH });
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
      {/* K4 (đợt 27): badge chế độ phát ngược — hiện suốt khi cờ
          reversePlayback bật (dù đang phát ngược hay tạm dừng ở chế độ
          ngược), báo rõ không có audio đồng bộ khi phát ngược. */}
      {isReversePlayback && (
        <div
          className="preview-reverse-badge"
          title="Đang ở chế độ phát ngược: playhead chạy lùi theo từng frame, mọi video seek từng frame, audio bị tắt vì không phát ngược đồng bộ được. Bấm nút ◀ hoặc phím J để dừng, nút ▶ để về phát xuôi."
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            padding: "2px 8px",
            borderRadius: 4,
            background: "rgba(120,40,160,0.92)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            zIndex: 5,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          ◀ PHÁT NGƯỢC — không audio
        </div>
      )}
      {/* K4 (đợt 27): badge FRAME GIỮ — góc dưới-giữa, cập nhật qua ref
          trong vòng lặp (xem khối badge K4): chỉ hiện khi tick trước có
          clip rơi vào nhánh hold (decoder tụt, đang vẽ lại frame tốt cũ). */}
      <div
        ref={holdBadgeRef}
        className="preview-hold-badge"
        title="Decoder chưa kịp giao frame mới nên preview đang vẽ lại frame tốt cuối cùng thay vì để đen. Nếu hiện (cũ) nghĩa là frame đã giữ quá 3 giây timeline — hình đứng yên trong khi playhead vẫn chạy."
        style={{
          display: "none",
          position: "absolute",
          left: "50%",
          bottom: 8,
          transform: "translateX(-50%)",
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(180,120,0,0.92)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
        aria-hidden="true"
      />
      {/* ROUND43-Y6: badge đường phát ngược — góc dưới-trái, chồng lên
          trên badge curve (bottom 32). Chỉ hiện khi đang stepping và cờ
          opt-in WebCodecs bật; text + title cập nhật qua ref trong vòng
          lặp, báo đúng WEBCODECS hay ELEMENT (thiếu API nào).
          ROUND44-Z6: chuỗi qua i18n key reverseEngine.* (vi/en); badge
          báo đường ĐÃ CHỌN, không phải đường vẽ từng frame.
          ROUND45-A6: ngoại lệ từng frame — controller đã failed thì
          badge đổi sang element-failed; đổi lang lúc pause refresh
          ngay qua effect [previewLang], không chờ tick. */}
      <div
        ref={reverseEngineBadgeRef}
        className="preview-reverse-engine-badge"
        title=""
        style={{
          display: "none",
          position: "absolute",
          left: 8,
          bottom: 32,
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(40,120,180,0.92)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
        aria-hidden="true"
      />
      {/* J1 (đợt 26): badge cảnh báo curve fail-soft — góc dưới-trái, chỉ
          hiện khi có nested lỗi (text + title cập nhật qua ref trong vòng
          lặp, kèm toast 1 lần). Hover để đọc tên nested + lý do đầy đủ. */}
      <div
        ref={curveWarnBadgeRef}
        className="preview-curve-warn-badge"
        title=""
        role="status"
        style={{
          display: "none",
          position: "absolute",
          left: 8,
          bottom: 8,
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(180,40,40,0.92)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      />
      {/* Đợt 37 T2 + đợt 38 U1: badge trạng thái decode-ahead Q3 — xếp
          trên badge curve; text/title cập nhật trong
          refreshDecodeAheadUi: đang chạy (+ số frame prefetch), bị chặn
          (+ lý do đầu tiên, đủ lý do ở title), tắt (sau khi user đã
          chạm toggle). Cảnh báo cổng đầy đủ (đúng chuỗi module cổng)
          nằm ở title + toast khi đang chạy. */}
      <div
        ref={decodeAheadWarnBadgeRef}
        className="preview-decodeahead-warn-badge"
        title=""
        role="status"
        style={{
          display: "none",
          position: "absolute",
          left: 8,
          bottom: 32,
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(150,90,0,0.92)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      />
      {/* Đợt 38 U1: toggle decode-ahead Q3 — góc trên-phải, ngay trái nút
          fullscreen. Nút thật: bấm đảo cờ wanted qua cổng S3 (không
          bypass); nhãn/trạng thái/title cập nhật qua ref trong
          refreshDecodeAheadUi (không re-render mỗi frame). data-status
          = off | blocked | running để harness/click-test đọc. */}
      <button
        ref={decodeAheadToggleBtnRef}
        className="preview-decodeahead-toggle"
        type="button"
        title={i18nT("decodeahead.toggleHint")}
        aria-label={i18nT("decodeahead.toggleAria")}
        aria-pressed={false}
        data-status="off"
        onClick={onDecodeAheadToggleClick}
        style={{
          position: "absolute",
          top: 10,
          right: 50,
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid rgba(255, 255, 255, 0.25)",
          background: "rgba(0, 0, 0, 0.55)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          zIndex: 5,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {i18nT("decodeahead.toggleOff")}
      </button>
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
