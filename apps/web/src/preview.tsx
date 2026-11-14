/**
 * Preview canvas: vẽ từng frame theo playhead bằng Canvas 2D,
 * đồng bộ phát lại video/audio thật, hỗ trợ kéo chữ trực tiếp.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { TextClip, VideoClip, VideoSpec } from "@repo-1/video-spec";
import { isSpeedable, maskGeometryAtTrack, stickerUrl } from "@repo-1/video-spec";
import type { ImageClip, StickerClip } from "@repo-1/video-spec";
import { useStore } from "./store";
import type { MediaItem } from "./media";
import { MediaPool } from "./media";
import { clamp } from "./lib";
import { seekAll, SEEK_TIMEOUT_EXTENSIONS, Seeker, type SeekTarget } from "./lib/seek";
import { AudioEngine, computeClipGain, toPreviewFx } from "./lib/audioEngine";
import type { ActiveAudioSource } from "./lib/audioEngine";
import {
  MOTION_BLUR_PREVIEW_ENABLED,
  motionBlurBlendPlan,
  motionBlurPadGhostCount,
  applyChromaKey,
  applyMask,
  maskAlphaArray,
  maskAlphaCacheKey,
  frameSkippedEffectTypes,
  imageClipFit,
  interpolateTrackPoints,
  isParityTextAnimation,
  letterboxFit,
  motionBadgeText,
  normalizeMotion,
  rampSourceTimeAt,
  rampSpeedAt,
  rvfcFrameDecision,
  rvfcSupported,
  stickerVisual,
  textClipVisual,
  videoClipVisual,
  videoElementPlacement,
  videoFrameIndex,
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
// Đợt 86 N3 (W6): bỏ qua lần render của tick đang phát khi clip video
// xuôi đang seeking — vẽ lúc seeking chỉ làm seek chậm thêm mà frame
// vẽ ra vẫn là frame cũ (probe 86n3: WebKit GOP 30 skip 120 ms vs
// draw 902 ms; Chromium GOP 250 skip 285 ms vs draw 1025 ms).
// Xem seekSkipRender86N3.ts.
import { shouldSkipRenderWhileSeeking } from "./lib/seekSkipRender86N3";
// Đợt 103 E4 — bỏ qua lần vẽ ở tick xác nhận drift đầu tiên (nợ D3 §5 mục 1:
// đường tick vẽ 1 frame stale ở tick đầu sau nhảy vì seeking=false;
// xem driftConfirmSkip103E4.ts).
import {
  combineSkipRender,
  shouldSkipRenderWhileDriftConfirmPending,
  type SkipRenderDecision,
} from "./lib/driftConfirmSkip103E4";
// Đợt 102 D3 — vị ngữ cửa sổ timeline của pump rVFC (dùng chung cho check
// A6 trong rvfcCallback và kill đồng bộ khi playhead nhảy; xem
// rvfcClipWindow.ts).
import { isPlayheadOutsideClipWindow, shouldDeferRvfcPumpCreation } from "./lib/rvfcClipWindow";
// Đợt 90 R2 — đóng băng playhead trong lúc phát sau seek khi clip video
// xuôi đang seeking (nợ LIMITS gộp đợt 89 §4 mục 2; xem playheadHold90R2.ts).
// Đợt 91 S2 — giữ thêm khi seek xong nhưng element chưa resume decode
// (sawtooth dư R2 §5.1; xem shouldHoldForResumeStall).
import {
  PLAYHEAD_RESUME_STALL_MAX_MS,
  initialPlayheadHoldState,
  isResumeCrawlAdvance98Z3,
  liveResumeWatchElements,
  nextResumeFreezeRearm,
  nextResumeGraceTail97Y4,
  shouldHoldForResumeStall,
  shouldHoldPlayheadWhileSeeking,
  type PlayheadResumeWatch,
  type ResumeFreezeTrack,
  type ResumeGraceTail97Y4,
} from "./lib/playheadHold90R2";
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
// Đợt 80 H5: phục hồi element đã chạm `ended` trong lúc phát (nợ W3
// đợt 79 — WebKitGTK loop kẹt; đo bằng probe headed
// benchmarks/render/webkit_loop_probe_80h5.mjs, xem
// docs/PHASE9_ROUND80_H5_WEBKIT_LOOP_LIMITS.md). Seek thẳng tới target
// của timeline rồi để `play()` sẵn có resume — xem webkitLoopRestart80H5.ts.
import { restartEndedElement } from "./lib/webkitLoopRestart80H5";
import {
  RestartTrace,
  type RestartTraceEvent,
  type RestartTickSnapshot,
} from "./lib/webkitRestartTrace85M4";
// Đợt 85 M4 — dấu vết mức tick cho đường phục hồi ended (nợ W7 đợt 84 L10:
// +1 restart dư sau tương tác test, cơ chế tick chưa rõ — xem
// webkitRestartTrace85M4.ts). Chỉ ghi snapshot + sự kiện, không đổi logic.
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
  reverseTrialDecodeTimeoutNotes,
  reverseWebcodecsFrameFor,
  setReverseDecodeAheadWanted,
  subscribeTrialDecodeTimeoutNotes, // Đợt 67 U5: toast timeout hiện ngay khi note mới được set
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
import { clampPreviewDt, FORWARD_RESEEK_CONFIRM_TICKS, FORWARD_RESEEK_THRESHOLD_S, forwardCatchUpRate, forwardPlayhead, forwardStep, shouldIssueForwardReseek } from "./lib/playheadPacing";
import { ffmpegDissolveFrand } from "./lib/dissolveFrand";
import { applyWebglLut, getLutBadge } from "./lib/webglLut";
// Đợt 74 B9: logic từ karaoke đang sáng tách ra lib/captions.ts (test được).
import { karaokeActiveWordIndex } from "./lib/captions";
import { SafeAreaOverlay } from "./components/SafeAreaOverlay";
import { letterboxRect, safeAreaPlatformForPreset } from "./lib/safeArea";
import {
  getSelectedExportPreset,
  subscribeSelectedExportPreset,
} from "./lib/exportPresetSelection";
import {
  applyCanvasEffects,
  canvasEffectOps,
  yuvMatrixForSourceWidth,
  type CanvasEffectOp,
} from "./lib/effectCanvas";
// Đợt 60 Q1: enhance vào preview ở mức xấp xỉ (denoise → blur nhẹ,
// stabilize → zoom crop gợi ý; deinterlace: tap dọc +0.5px từ đợt 75 C8,
// chỉ khi vẽ gần full-res).
import {
  ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR,
  ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX,
  enhancePreviewDebug,
  enhancePreviewPlan,
  type EnhancePreviewDebug,
} from "./lib/enhancePreview";
// N5 (Phase 9): preview dùng spec đã làm phẳng nested + gộp adjustment
// (xem apps/web/src/lib/NESTED_PREVIEW_LIMITS.md). Chỉ luồng này sửa preview.tsx.
import {
  buildPreviewSpecFailsoft,
  skippedEffectReason,
  visibleSkippedReasons,
  type SkippedReasonAttribution,
} from "./lib/nestedPreview";
// Đợt 62 R6 — key instance cho clip + phục hồi decoder error (đóng nợ
// đợt 61 §5.1/§5.3/§5.5, xem previewClipKey62R6.ts /
// decoderErrorRecovery62R6.ts).
import { previewClipInstanceKey } from "./lib/previewClipKey62R6";
import { planDecoderErrorRecovery } from "./lib/decoderErrorRecovery62R6";
// Đợt 63 R6 — phục hồi lỗi decoder TRONG LÚC PHÁT (syncMedia) + key hold
// cache theo instance (đóng nợ đợt 62 §4 mục 6, xem
// playingDecoderRecovery63R6.ts / holdCacheKey63R6.ts).
import {
  playingDecoderErrorStatus,
  playingDecoderRetryDue,
  playingDecoderScrubbedBack,
} from "./lib/playingDecoderRecovery63R6";
import { heldFrameCacheKey63R6 } from "./lib/holdCacheKey63R6";
import { normalizeTextStyle } from "./lib/projectRepo";
import { dismissToast, pushToast, updateToast } from "./lib/toast";
// Đợt 71 Y5 — toast trạng thái khi trial keyframe chạy lâu (nợ đợt 70
// §4 mục 8): registry run đang chạy + ngưỡng hiện toast + tick elapsed.
import {
  activeTrialDecodeRuns,
  subscribeTrialDecodeRunning,
  TRIAL_DECODE_RUNNING_TOAST_DELAY_MS,
  TRIAL_DECODE_RUNNING_TOAST_TICK_MS,
  type TrialDecodeRun,
} from "./lib/trialDecodeRunning71Y5";
import { knownSizeBytesForPreview } from "./lib/proxy";
// Đợt 73 A7 — fallback roundRect cho Safari < 16 (xem lib/canvasRoundRect.ts):
// text clip có backgroundColor gọi thẳng ctx.roundRect sẽ ném TypeError
// trên Safari < 16; helper này rơi về ctx.rect (hộp vuông) khi thiếu API.
import { pathRoundRect } from "./lib/canvasRoundRect";
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
  matrix: "bt709" | "bt601" = "bt709",
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
  // Đợt 63 R8: downscale bằng bộ lọc chất lượng cao. Lưu ý đo thật:
  // draw ở đây thường là 1:1 (dw×dh = letterbox của media trong
  // project) nên quality KHÔNG đổi gì cho trường hợp đó — bước
  // downscale viewport thật sự nằm ở ctx chính trong renderFrame
  // (xem đó). Setting này chỉ có tác dụng khi media lớn hơn project
  // (vd 4K trong project 720p) thì draw này mới resample; giữ lại
  // cho trường hợp đó, không claim nó sửa parity sharpen.
  cctx.imageSmoothingEnabled = true;
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(src, 0, 0, cw, ch);
  const img = cctx.getImageData(0, 0, cw, ch);
  applyCanvasEffects(img, ops, matrix);
  cctx.putImageData(img, 0, 0);
  return effectCanvas;
}

// ---- Đợt 75 C1: intermediate letterbox cho đường plain (đóng rò plain B1 §6.3/§8.1) ----
// Rò plain: clip KHÔNG có canvas effect vẽ thẳng video element xuống
// viewport trong 1 bước (1920×1080 → 489×275), còn clip CÓ effect đi qua
// effect canvas 1920→1280 rồi mới xuống viewport (2 bước) — delta preview
// do đó chứa số hạng rò L = D2(D1(V)) − D_main(V), 0 với media = project
// size, lớn ở nội dung tần số cao (ocean w1440: Δkurt G 1,12, corr phần dư
// với −plainDiff 0,993). Sửa: cho đường plain đi qua cùng intermediate
// letterbox dw×dh như đường effects, để plain và noise chia sẻ đúng một
// chuỗi resample và số hạng rò triệt tiêu. Canvas tái dùng như
// effectCanvas; chỉ vẽ 1 drawImage (không getImageData) nên chi phí thêm
// là 1 lần downscale dw×dh/frame/clip — xem LIMITS đợt 75 C1 §5 (đo FPS).
// Chỉ áp khi media lớn hơn letterbox (mw > dw || mh > dh) — đúng trường
// hợp D1 là resample thật; media ≤ project giữ đường vẽ cũ (tránh đổi
// hành vi upscale). LUT/effects/enhance đã ra canvas dw×dh nên bỏ qua.
let letterboxCanvas: HTMLCanvasElement | null = null;

function letterboxIntermediateSource(
  src: CanvasImageSource,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!letterboxCanvas) letterboxCanvas = document.createElement("canvas");
  const cw = Math.max(2, Math.round(w));
  const ch = Math.max(2, Math.round(h));
  if (letterboxCanvas.width !== cw || letterboxCanvas.height !== ch) {
    letterboxCanvas.width = cw;
    letterboxCanvas.height = ch;
  }
  const cctx = letterboxCanvas.getContext("2d", { willReadFrequently: true });
  if (!cctx) return null;
  cctx.clearRect(0, 0, cw, ch);
  // Cùng setting với effectCanvasSource để bước resample đầu tiên của
  // đường plain giống hệt đường effects (cùng kernel Chrome).
  cctx.imageSmoothingEnabled = true;
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(src, 0, 0, cw, ch);
  return letterboxCanvas;
}

// ---- Đợt 85 M10: intermediate native cho đường plain UPSCALE (đóng nốt
// rò plain C1) ----
// C1 (đợt 75) chỉ chuẩn hoá khi media LỚN hơn letterbox (mw > dw ||
// mh > dh) và cố ý giữ đường vẽ cũ khi media ≤ project ("tránh đổi hành
// vi upscale"). Probe M10 (đợt 85) đo thật qua video thật chứng minh
// đường vẽ cũ SAI ở chính trường hợp đó: video element vẽ trực tiếp lên
// viewport dùng scaler TAM GIÁC (+ lệch pha ~−0,03), còn canvas→canvas
// dùng Mitchell (B=C=1/3, MAD 0,000–0,013 — tái lập đúng J2), và render
// dùng Mitchell ở upscale / trilinear ở downscale. Đường plain lệch
// render 5,60 (lineart 1px) / 4,26 (2px) ở s=1,264; qua intermediate
// native 1:1 rồi canvas→viewport còn 0,24 / 0,18 (mức nhiễu decode);
// s=2,0: 2,83→0,21; s=0,632: 7,60→0,29 (xem
// docs/PHASE9_ROUND85_M10_LINEART_VIDEO_SCALER_LIMITS.md).
// Sửa: khi drawSrc còn là element video thô (không LUT/effects/enhance/
// chroma — các đường đó đã ra canvas) và C1 không áp (media ≤ letterbox),
// đưa qua canvas native mw×mh 1:1 (KHÔNG resample ở chặng này — khác
// letterboxIntermediateSource vẽ về dw×dh) rồi các nhánh vẽ sau vẽ canvas
// này như thường. Chỉ thêm 1 drawImage 1:1/clip/frame; chi phí FPS chưa
// đo bằng harness G5 — xem LIMITS M10 §6. Thất bại (không có
// document/context) → giữ drawSrc cũ, frame đó giữ hành vi cũ, không crash.
// VideoFrame (WebCodecs, opt-in) và held-frame canvas giữ nguyên: canvas
// đã là Mitchell, VideoFrame chưa đo scaler nên không đổi.
let plainNativeCanvas: HTMLCanvasElement | null = null;

function plainNativeSource(
  src: CanvasImageSource,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!plainNativeCanvas) plainNativeCanvas = document.createElement("canvas");
  const cw = Math.max(2, Math.round(w));
  const ch = Math.max(2, Math.round(h));
  if (plainNativeCanvas.width !== cw || plainNativeCanvas.height !== ch) {
    plainNativeCanvas.width = cw;
    plainNativeCanvas.height = ch;
  }
  const cctx = plainNativeCanvas.getContext("2d", { willReadFrequently: true });
  if (!cctx) return null;
  cctx.clearRect(0, 0, cw, ch);
  // Cùng setting với effectCanvasSource/letterboxIntermediateSource để
  // chặng canvas→viewport sau này dùng cùng kernel Chrome.
  cctx.imageSmoothingEnabled = true;
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(src, 0, 0, cw, ch);
  return plainNativeCanvas;
}

// ---- Đợt 75 C8: tỉ lệ viewport preview thật (để cổng tap khử răng cưa) ----
// drawVideoClip nhận dw/dh theo TỌA ĐỘ PROJECT (letterboxFit trong khung
// W×H của project), còn răng cưa chỉ lộ theo TỈ LỆ VẼ THẬT lên canvas
// (= dh/mh × S, với S = min(Wc/W, Hc/H) của canvas preview). Đọc S từ
// canvas thật (cache element, kiểm tra isConnected để khỏi giữ element
// cũ sau remount); không có document/canvas → 0 (tap tắt — an toàn).
// KHÔNG đọc ctx.getTransform(): drawVideoClip còn được gọi qua offscreen
// octx (transition/dip, transform = 1) nên transform của ctx đang vẽ
// không phải tỉ lệ viewport.
let previewCanvasEl: HTMLCanvasElement | null | undefined = undefined;
function previewViewportScale(W: number, H: number): number {
  if (typeof document === "undefined" || W <= 0 || H <= 0) return 0;
  let el = previewCanvasEl;
  if (el === undefined || (el !== null && !el.isConnected)) {
    el = document.querySelector("#vcut-preview-wrap canvas.preview-canvas") as HTMLCanvasElement | null;
    previewCanvasEl = el;
  }
  if (!el || el.width <= 0 || el.height <= 0) return 0;
  return Math.min(el.width / W, el.height / H);
}

// ---- Enhance preview xấp xỉ (Phase 9 đợt 60 Q1; cơ chế blend đợt 62 R3) ----
// Render áp enhance thật (hqdn3d/yadif/vidstab); preview xấp xỉ bằng 1
// lần vẽ offscreen: denoise → BLEND với bản mờ (vẽ khung gốc rồi vẽ đè
// bản blur(3.0px) với globalAlpha = strength — composite
// (1-a)·gốc + a·blur, a = strength; đợt 62 R3 thay thang blur thuần đợt
// 61 vì blur Chromium bị lượng tử hóa — xem lib/enhancePreview.ts +
// docs/PHASE9_ROUND62_R3_BLUR_REWORK_LIMITS.md §2), stabilize → zoom
// crop gợi ý (vẽ phóng to rồi cắt viền). Deinterlace (đợt 75 C8): tap dọc
// +0.5px (ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX) trên lần vẽ gốc — bilinear
// trung bình 2 dòng kề, R combing 1.12 → 0.67 ở full-res (xem
// lib/enhancePreview.ts + docs/PHASE9_ROUND75_C8_ENHANCE_PREVIEW_LIMITS.md);
// tap KHÔNG thêm lần vẽ, chỉ đổi offset. Đợt 76 D4: tap ĐƠN LẺ (không
// denoise/stabilize) KHÔNG qua enhanceCanvas nữa mà qua intermediate
// thu hẹp dọc (deintIntermediateSource, xem dưới); tap đi kèm
// denoise/stabilize vẫn qua đường offscreen này (tap đã nằm trong lần
// vẽ gốc của enhanceCanvas). Bản inline-shift (cộng +0.5px vào lần vẽ
// cuối) đã thử và BỎ sau headed lần 1 — FPS 0.99× nhưng R không giảm
// ở upscale (xem LIMITS đợt 76 D4 §2.2).
// Canvas tái dùng như effectCanvas; kích thước = letterbox dw×dh (cùng khổ
// với effectCanvasSource) nên mọi đường vẽ sau (mask/SR/motion blur/vignette)
// dùng drawSrc đã enhance mà không đổi gì. blendAlpha <= 0, zoom == 1 và
// không tap → trả null, giữ drawSrc cũ.
// Xem lib/enhancePreview.ts (ánh xạ thuần) + LIMITS đợt 60 Q1.
let enhanceCanvas: HTMLCanvasElement | null = null;

function enhancePreviewSource(
  src: CanvasImageSource,
  w: number,
  h: number,
  blurPx: number,
  blendAlpha: number,
  zoom: number,
  deintTap = false,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (blendAlpha <= 0 && zoom === 1 && !deintTap) return null;
  if (!enhanceCanvas) enhanceCanvas = document.createElement("canvas");
  const cw = Math.max(2, Math.round(w));
  const ch = Math.max(2, Math.round(h));
  if (enhanceCanvas.width !== cw || enhanceCanvas.height !== ch) {
    enhanceCanvas.width = cw;
    enhanceCanvas.height = ch;
  }
  const cctx = enhanceCanvas.getContext("2d", { willReadFrequently: true });
  if (!cctx) return null;
  // Zoom crop quanh tâm: vẽ phóng to zoom lần rồi để canvas cắt viền.
  const zx = (cw * (zoom - 1)) / 2;
  const zy = (ch * (zoom - 1)) / 2;
  cctx.clearRect(0, 0, cw, ch);
  // 1. Khung gốc (có zoom crop). 2. Bản mờ pha theo alpha, CÙNG hình học
  // zoom — source-over với globalAlpha=a cho đúng (1-a)·gốc + a·blur:
  // vẽ đè bản blur với alpha a lên nền gốc (không cần canvas phụ).
  // a=1 → đúng bằng đường blur thuần cũ (khung toàn mờ); a=0 → chỉ
  // bước 1 chạy (blendAlpha<=0 đã return null khi zoom==1).
  // Đợt 75 C8: deintTap lệch dọc +0.5px (tap khử răng cưa — bilinear
  // trung bình 2 dòng kề); bản mờ (nếu có) lệch cùng để hình học khớp.
  const tapDy = deintTap ? ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX : 0;
  cctx.drawImage(src, -zx, -zy + tapDy, cw * zoom, ch * zoom);
  if (blendAlpha > 0 && blurPx > 0) {
    cctx.save();
    cctx.globalAlpha = Math.min(1, Math.max(0, blendAlpha));
    setCtxFilter(cctx, `blur(${blurPx.toFixed(2)}px)`);
    cctx.drawImage(src, -zx, -zy + tapDy, cw * zoom, ch * zoom);
    cctx.restore();
    setCtxFilter(cctx, "");
  }
  return enhanceCanvas;
}

// Đợt 76 D4 — HALF-RES INTERMEDIATE cho tap khử răng cưa đơn lẻ
// (thay cho inline-shift đã thử và BỎ: lệch +0.5px ở lần vẽ cuối cho
// FPS 0.99× nhưng R combing KHÔNG giảm ở tỉ lệ vẽ upscale — headed G2
// R 0.74 → 0.74; probe-b chứng minh shift chỉ có tác dụng ở s≈1.0).
// Đợt 77 E1 đã THỬ thu hẹp dọc 4× (dw×dh/4) rồi QUAY VỀ 2× (xem
// LIMITS E1 §3): probe E1 loại cả 3 đường khác (inline-shift R 0.85 →
// 0.88 ở s=1.13; tap2 R 0.67 ở 1:1 FAIL tiêu chí 0.55 + thông lượng
// 1.66–2.4×; blur(1px) thông lượng 2.3–61×, vgrad 20–41%), nhưng
// divisor 4 headed không chứng minh được nhanh hơn half-res (G5 0.83×
// rồi 0.64×, gộp 0.735 ≈ half-res 0.72–0.73) mà làm mềm hơn (vgrad
// 38% vs 59%) và FAIL G7b mask (MAD 0.6396 vs 0.0036 — intermediate
// dh/4 phải upscale 2× trong mask unit 640×360 trong khi dh/2 khớp
// đúng 1:1). Cơ chế (divisor hiện tại = 2, lấy từ
// ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR): vẽ drawSrc xuống canvas
// dw×(dh/2) (downscale dọc 2× — mỗi hàng đích lấy mẫu đúng giữa 2 hàng
// nguồn kề, một hàng mỗi field, tức khử xen kẽ, hạt nhân [1,1]/2 như
// tap C8), các nhánh vẽ sau vẽ canvas này lên khổ đích dw×dh như
// drawSrc thường (intrinsic size khác nhưng mọi drawImage đều chỉ rõ
// dw×dh nên hình học không đổi). Vẫn 2 lần vẽ nhưng lần 1 chỉ 1/4 pixel
// khổ đích và lần 2 lấy mẫu từ canvas (rẻ hơn lấy mẫu từ video):
// probe-c ở s=1.13 cho R 0.85 → 0.66 (clean đối chứng 0.63) với thông
// lượng 0.49× chi phí vẽ thường (xem docs/PHASE9_ROUND76_D4_DEINT_FPS_LIMITS.md
// §3). Đánh đổi: mềm dọc hơn tap C8 (vgrad clean giữ 73% ở s=1.13,
// 37% ở s=1.0). Divisor phải chẵn — xem lib/enhancePreview.ts. Chỉ
// dùng khi plan có tap mà KHÔNG cần offscreen (không denoise alpha,
// không stabilize zoom); tap đi kèm denoise/stabilize vẫn qua
// enhanceCanvas. Thất bại (không có document/context) → trả null, giữ
// drawSrc cũ (tap mất ở frame đó, không crash). Canvas tái dùng như
// enhanceCanvas/letterboxCanvas.
let deintIntermediateCanvas: HTMLCanvasElement | null = null;

function deintIntermediateSource(
  src: CanvasImageSource,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!deintIntermediateCanvas) deintIntermediateCanvas = document.createElement("canvas");
  const cw = Math.max(2, Math.round(w));
  const ch = Math.max(2, Math.round(h / ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR));
  if (deintIntermediateCanvas.width !== cw || deintIntermediateCanvas.height !== ch) {
    deintIntermediateCanvas.width = cw;
    deintIntermediateCanvas.height = ch;
  }
  const cctx = deintIntermediateCanvas.getContext("2d", { willReadFrequently: true });
  if (!cctx) return null;
  cctx.clearRect(0, 0, cw, ch);
  cctx.imageSmoothingEnabled = true;
  // Đợt 78 F1 — ĐÃ THỬ "medium" rồi HOÀN LẠI "high" (xem LIMITS F1 §4):
  // probe cho high/low/medium pixel Y HỆT nhau ở downscale dọc đúng 2×,
  // và headed G2 sau đổi vẫn R 0.74 → 0.51 / MAD 0.6087 y hệt trước đổi —
  // nhưng phép đo A/B headed không cho thấy lần vẽ trung gian rẻ hơn
  // (1280×360: median ~71ms/call ở "high" so với ~250ms/call ở "medium",
  // n nhỏ, nhiễu tải lớn; tỉ lệ gap 0.86 → 0.77, draw-fps 0.58 → 0.55).
  // Không có lợi ích đo được nên giữ "high" như các canvas trung gian
  // khác (effect/letterbox) cho nhất quán — đừng đổi lại khi chưa có số
  // mới tách được khỏi nhiễu.
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(src, 0, 0, cw, ch);
  return deintIntermediateCanvas;
}

// Trạng thái enhance của frame video vừa vẽ — phơi qua
// window.__vcutPreviewEnhance (cùng mẫu __vcutHoldStats): 1 object biến
// đổi, gán 1 lần khi module nạp (xem exposeEnhancePreviewDebug),
// drawVideoClip cập nhật field mỗi lần vẽ. Clip không có enhance vẫn ghi
// (hasEnhance false) để harness phân biệt "clip không enhance" với
// "chưa vẽ frame nào".
const enhancePreviewDebugState: EnhancePreviewDebug = {
  clipId: "",
  hasEnhance: false,
  enabled: true,
  denoiseBlurPx: 0,
  denoiseBlendAlpha: 0,
  stabilizeZoom: 1,
  deinterlaceTap: false,
  stabilizeBlockedBySpeedRamp: false,
  applied: [],
  notApproximated: [],
  offscreenApplied: false,
};
let enhancePreviewDebugExposed = false;
function exposeEnhancePreviewDebug(): void {
  if (enhancePreviewDebugExposed || typeof window === "undefined") return;
  enhancePreviewDebugExposed = true;
  (window as unknown as { __vcutPreviewEnhance?: EnhancePreviewDebug }).__vcutPreviewEnhance = enhancePreviewDebugState;
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
// Phase 9 đợt 90 R1 (hướng (iii) Q2 §7.1): canvas riêng cho unit THÔ
// (chưa mask) — đường mask+motion-blur blend các unit thô rồi mới áp
// mask 1 lần sau blend. PHẢI là canvas riêng, không dùng chung maskCanvas:
// maskedUnitSource(layer) ghi đè maskCanvas SAU khi blend, mà snapshot
// rawUnit được copy SAU bước mask đó — dùng chung canvas thì snapshot sẽ
// copy nhầm nội dung đã mask thay vì thô.
let rawUnitCanvas: HTMLCanvasElement | null = null;

/**
 * Unit THÔ (chưa mask) — đúng nửa đầu của maskedUnitSource: vẽ nội dung
 * đã letterbox (kèm cssFilter) vào offscreen W×H (giới hạn 640px như
 * maskedUnitSource để cùng chuỗi resample). Dùng cho đường mask +
 * motion blur: snapshot/blend các unit thô, mask áp 1 lần sau blend
 * (đúng thứ tự render tmix → mask). Trả về canvas dùng chung (caller
 * copy đồng bộ trong cùng tick như maskedUnitSource).
 */
function rawUnitSource(
  drawSrc: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  cssFilter: string,
  W: number,
  H: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!rawUnitCanvas) rawUnitCanvas = document.createElement("canvas");
  const s = Math.min(1, MASK_MAX_W / W);
  const w = Math.max(2, Math.round(W * s));
  const h = Math.max(2, Math.round(H * s));
  if (rawUnitCanvas.width !== w || rawUnitCanvas.height !== h) {
    rawUnitCanvas.width = w;
    rawUnitCanvas.height = h;
  }
  const rctx = rawUnitCanvas.getContext("2d", { willReadFrequently: true });
  if (!rctx) return null;
  rctx.clearRect(0, 0, w, h);
  setCtxFilter(rctx, cssFilter);
  rctx.drawImage(drawSrc, dx * s, dy * s, dw * s, dh * s);
  setCtxFilter(rctx, "");
  return rawUnitCanvas;
}

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
  // Phase 9 đợt 87 O4: quỹ đạo motion track của clip (nếu có) — mask bám
  // track (mirror render --mask-mode trackgeq của O3): tâm effMask :=
  // vị trí track tại localT. Đợt 88 closing: call site image nay cũng
  // truyền clip.track (như video) — render png/trackgeq làm mask ảnh bám
  // track từ đợt 87 O2, preview trước đây giữ mask tĩnh là lệch render.
  track?: NonNullable<VideoClip["track"]> | null,
  // Đợt 92 T2: nhận timings (tuỳ chọn) để đo tách 3 bước CPU
  // getImageData / applyMask / putImageData — không đổi hành vi.
  timings?: MaskTimings,
  /** Đợt 93 U1: memo theo (clip, frameIdx) — chỉ 2 call site video
   * truyền; đường ảnh không truyền (không có frameIdx). */
  memoKey?: { clipId: string; frameIdx: number },
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
  const maskT0 = performance.now();
  mctx.clearRect(0, 0, w, h);
  setCtxFilter(mctx, cssFilter);
  mctx.drawImage(drawSrc, dx * s, dy * s, dw * s, dh * s);
  setCtxFilter(mctx, "");
  // Phase 9 đợt 88 P6: dùng helper O1 maskGeometryAtTrack thay cho bản
  // inline của O4 (baseMask + interpolateTrackPoints ghi đè x/y) — cùng
  // quy tắc: track thắng x/y, keyframes thắng w/h, shape/feather/invert
  // giữ nguyên; KHÔNG đổi hành vi (parity đo ở test O4 + probe pixel).
  // Khác biệt duy nhất so với bản inline: keyframes bị bỏ khỏi kết quả
  // (applyMask/maskAlphaAt không đọc keyframes) và track rỗng fallback về
  // hình học tĩnh thay vì (0.5, 0.5) — khớp render (helper CJS của O1/O2).
  // effMask là tọa độ trong unit; unit KHÔNG dịch theo track nữa khi có
  // mask (xem chỗ null trackShift/trackCenter ở drawVideoClip, mirror
  // render.js:876 của O3) nên tâm cuối trên khung = vị trí track.
  const effMask = maskGeometryAtTrack(mask, track ?? null, localT);
  // Đợt 92 T2: đường canvas alpha cache — xem maskAlphaCanvasFor dưới.
  // Miss thì build canvas (chi phí ≈ 1 lần applyMask) rồi dùng ngay
  // trong tick này; hit thì chỉ còn 1 drawImage native. Hook test
  // window.__vcutMaskCanvasPath = false ép đường CPU cũ để đo parity
  // A/B (mirror hook __vcutDisableRvfc của đợt 91 S1).
  const useCanvasPath =
    typeof window === "undefined" ||
    (window as unknown as { __vcutMaskCanvasPath?: unknown }).__vcutMaskCanvasPath !== false;
  if (useCanvasPath) {
    // Đợt 93 U1: memo theo (clip, frameIdx) — xem maskFrameMemo trên.
    let alphaCanvas: HTMLCanvasElement | null = null;
    const memo = memoKey ? maskFrameMemo.get(memoKey.clipId) : undefined;
    if (
      memo &&
      memoKey &&
      memoKey.frameIdx >= 0 &&
      memo.frameIdx === memoKey.frameIdx &&
      maskFrameMemoClose(memo.effMask, effMask)
    ) {
      const stillThere = maskAlphaCache.get(memo.key);
      if (stillThere && stillThere.canvas === memo.canvas) alphaCanvas = memo.canvas;
    }
    if (!alphaCanvas) {
      alphaCanvas = maskAlphaCanvasFor(effMask, w, h);
      if (alphaCanvas && memoKey && memoKey.frameIdx >= 0) {
        if (maskFrameMemo.size >= MASK_FRAME_MEMO_MAX && !maskFrameMemo.has(memoKey.clipId)) {
          const oldest = maskFrameMemo.keys().next().value;
          if (oldest !== undefined) maskFrameMemo.delete(oldest);
        }
        maskFrameMemo.set(memoKey.clipId, {
          frameIdx: memoKey.frameIdx,
          key: maskAlphaCacheKey(effMask, w, h),
          canvas: alphaCanvas,
          effMask: {
            shape: effMask.shape ?? "",
            x: effMask.x ?? 0.5,
            y: effMask.y ?? 0.5,
            w: effMask.w ?? 0.5,
            h: effMask.h ?? 0.5,
            feather: effMask.feather ?? 0,
            invert: !!effMask.invert,
          },
        });
      }
    }
    if (alphaCanvas) {
      mctx.globalCompositeOperation = "destination-in";
      mctx.drawImage(alphaCanvas, 0, 0);
      mctx.globalCompositeOperation = "source-over";
      if (timings) {
        timings.get = 0;
        timings.apply = 0;
        timings.put = 0;
        timings.total = performance.now() - maskT0;
        timings.viaCanvas = true;
      }
      return maskCanvas;
    }
    // Build thất bại (không có document/context) → rơi xuống đường CPU cũ.
  }
  const getT0 = performance.now();
  const img = mctx.getImageData(0, 0, w, h);
  const getT1 = performance.now();
  applyMask(img, effMask);
  const applyT1 = performance.now();
  mctx.putImageData(img, 0, 0);
  const putT1 = performance.now();
  if (timings) {
    timings.get = getT1 - getT0;
    timings.apply = applyT1 - getT1;
    timings.put = putT1 - applyT1;
    timings.total = putT1 - maskT0;
    timings.viaCanvas = false;
  }
  return maskCanvas;
}

// ---- Đợt 92 T2: cache canvas alpha mask (nợ S1 đợt 91 §5.1) ----
// Baseline đo thật (spec B, VM này): applyMask chiếm ~13ms/tick lúc
// không contention (65% của tick ~20ms), 65–90ms lúc đói CPU — là
// blocker chính làm rVFC bị gộp (chỉ capture ~1/3 frame trình chiếu).
// maskAlphaAt là hàm thuần theo (hình học mask, W, H, px, py) nên với
// mask tĩnh, alpha từng pixel KHÔNG đổi theo thời gian: tính 1 lần
// (maskAlphaArray), cache thành canvas alpha (RGB trắng, alpha = mask),
// rồi mỗi tick chỉ composite bằng destination-in (native — dest alpha
// × source alpha, RGB giữ nguyên) thay vì getImageData + vòng lặp JS
// 230k pixel + putImageData. Lệch duy nhất so với applyMask là làm
// tròn của compositor (±1/255 ở alpha, RGB không đổi) — đo parity bằng
// probe A/B (xem LIMITS đợt 92 T2 §3).
// Miss (hình học mới): build canvas rồi dùng ngay trong tick đó — chi
// phí ≈ 1 lần applyMask + 1 vòng lặp RGB fill, tức không đắt hơn đường
// cũ ở tick đó; các tick sau cùng hình học thì rẻ. Mask động
// (keyframes/track đổi hình học mỗi tick) miss liên tục — đo thật spec C
// cho thấy build MỚI mỗi tick (canvas + ImageData mới ~2MB/tick) gây
// GC stall làm tick chậm HƠN đường cũ (total 95–197ms vs 33ms, ratio
// 0.10–0.17 vs 0.51–0.54) — vì vậy cache TÁI DÙNG canvas + ImageData
// của entry bị đuổi (không cấp phát mới sau warmup) và maskAlphaArray
// đã hoist hình học (8.6ms → ~4ms Node); miss nay rẻ hơn applyMask.
// Cache tối đa 8 hình học (FIFO) — 8 × 640×360×4B ≈ 7MB trần.
type MaskAlphaEntry = { canvas: HTMLCanvasElement; img: ImageData };
const maskAlphaCache = new Map<string, MaskAlphaEntry>();
const MASK_ALPHA_CACHE_MAX = 8;

function maskAlphaCanvasFor(
  effMask: NonNullable<VideoClip["mask"]>,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const key = maskAlphaCacheKey(effMask, w, h);
  const hit = maskAlphaCache.get(key);
  if (hit) return hit.canvas;
  const alpha = maskAlphaArray(effMask, w, h);
  // Tái dùng canvas + ImageData của entry cũ nhất bị đuổi (tránh cấp
  // phát ~2MB mỗi miss → GC stall trên VM ít RAM); chỉ tạo mới khi
  // cache chưa đầy. Sau warmup (8 hình học) không còn cấp phát nào.
  let canvas: HTMLCanvasElement;
  let img: ImageData | null = null;
  if (maskAlphaCache.size >= MASK_ALPHA_CACHE_MAX) {
    const oldest = maskAlphaCache.keys().next().value;
    const evicted = oldest !== undefined ? maskAlphaCache.get(oldest) : undefined;
    if (oldest !== undefined) maskAlphaCache.delete(oldest);
    if (evicted) {
      canvas = evicted.canvas;
      img = evicted.img;
    } else {
      canvas = document.createElement("canvas");
    }
  } else {
    canvas = document.createElement("canvas");
  }
  canvas.width = w;
  canvas.height = h;
  const cctx = canvas.getContext("2d");
  if (!cctx) return null;
  if (!img || img.width !== w || img.height !== h) img = cctx.createImageData(w, h);
  // RGB trắng (destination-in chỉ nhân alpha, RGB nguồn không dùng);
  // ghi alpha theo từng pixel bằng Uint32 1 lần/pixel (0xFF alpha<<24).
  const d = img.data;
  const u32 = new Uint32Array(d.buffer, d.byteOffset, alpha.length);
  for (let i = 0; i < alpha.length; i++) {
    u32[i] = 0x00ffffff | (alpha[i] << 24);
  }
  cctx.putImageData(img, 0, 0);
  maskAlphaCache.set(key, { canvas, img });
  return canvas;
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
// thường/SR, unit THÔ chưa mask cho đường mask từ đợt 90 R1 — xem dưới,
// unit đã mask cho đường mask trước R1), còn VỊ TRÍ vẽ lấy đúng
// transform của đường đó tại frame hiện tại — vì vậy ghost mask/SR bám
// đúng hình bao/transform hiện tại, nhưng nội dung bóng là frame cũ
// (không nội suy lại mask/SR theo thời gian của bóng đó — xem LIMITS).
// Image/text clip không có field motion trong spec nên không có ghost
// (chỉ video clip).
// Phase 9 đợt 90 R1 (hướng (iii) Q2 §7.1) — 2 thay đổi cùng lúc:
//   (1) Snapshot theo FRAME VIDEO, không theo tick: updateMotionBlurSnapshots
//       nhận thêm frameIndex (videoFrameIndex từ previewEngine) và BỎ QUA
//       tick nào có cùng frame với snapshot mới nhất — tick ~60fps mà
//       video 30fps nên trước đây 2 tick liên tiếp thường snapshot cùng 1
//       frame (blend mất blur nội dung) hoặc lệch 1–3 frame (mask ở 3 vị
//       trí track khác nhau blend thành vệt tới 12–16px, 145px dưới tải).
//       Nhảy LÙI > 1 frame (seek/loop) thì xoá ring (tránh bóng cũ trước
//       seek ô nhiễm cửa sổ mới); lùi đúng 1 frame (phát ngược từng bước)
//       vẫn nhận như snapshot mới (giữ hành vi cũ của đường reverse).
//   (2) Đường mask KHÔNG snapshot unit đã mask nữa: snapshot unit THÔ,
//       blend các unit thô, rồi áp mask MỘT lần lên lớp blend tại vị trí
//       mask HIỆN TẠI (đúng thứ tự render tmix → mask) — mép mask luôn
//       sắc, chỉ nội dung trong mask bị blur. Transform SR (nếu có) dời
//       ra khỏi painter của lớp blend, áp lúc vẽ lớp đã mask lên canvas
//       chính (mask áp trong không gian chưa transform, đúng render).
// Ring buffer: mỗi clip giữ tối đa frames-1 snapshot (tối đa 7, ứng
// frames tối đa 8); canvas cũ nhất được TÁI DÙNG khi đầy (tránh cấp phát
// mỗi frame). Đổi frames → mảng tự cắt ngắn ở lần cập nhật sau. Giới hạn
// 16 clip để không rò bộ nhớ (FIFO, xoá cũ nhất); trường hợp xấu nhất
// 16 clip × 7 snapshot × canvas khung hình — thực tế chỉ clip đang hiển
// thị mới tạo snapshot. Đổi đường vẽ (mask on/off) giữa chừng có thể
// trộn snapshot khác kích thước/loại trong 1-2 frame chuyển tiếp (vẽ
// co giãn theo đích, thoáng qua, rồi ring ổn định lại) — xem LIMITS.
// Đợt 91 S1: pump requestVideoFrameCallback (rvfcPumps, xem dưới) sở
// hữu snapshot khi clip phát xuôi + blur + drawSrc thô — snapshot đúng
// mỗi frame trình chiếu nên cửa sổ blend là các frame LIÊN TIẾP, không
// phụ thuộc khoảng cách tick rAF (nợ R1 §5.1); đường tick chỉ chạy khi
// pump không dùng được (fallback/watchdog).
// Lớp blend dùng chung 1 canvas W×H, tái dùng mỗi lần vẽ (vẽ đồng bộ,
// không await bên trong nên không tranh chấp giữa các clip); snapshot
// của frame hiện tại vẫn lưu NỘI DUNG GỐC chưa blend (drawSrc/unit thô),
// không lưu lớp blend — nếu không frame sau sẽ blend trên nền đã mờ
// sẵn (mờ kép, sai weights).
const MOTION_BLUR_MAX_CLIPS = 16;
const motionBlurSnapshots = new Map<string, HTMLCanvasElement[]>();
// Đợt 90 R1: chỉ số frame video của snapshot mới nhất từng clip (để gate
// theo frame, xem (1) trên) + thống kê gate phơi qua window cho harness
// đo (__vcutMotionBlurSnapshots: ring = số snapshot đang giữ,
// lastFrame = frame của snapshot mới nhất, skippedDuplicate = số tick bị
// bỏ qua vì trùng frame, ringClears = số lần xoá ring do nhảy lùi > 1
// frame — KHÔNG phải state React nên không gây re-render mỗi tick).
const motionBlurLastFrameIndex = new Map<string, number>();
interface MotionBlurDebugState {
  ring: number;
  lastFrame: number;
  skippedDuplicate: number;
  ringClears: number;
  // Đợt 91 S1: pump requestVideoFrameCallback (rVFC) — snapshot đúng mỗi
  // frame video trình chiếu, không phụ thuộc khoảng cách tick rAF.
  // rvfcActive: pump đã capture ít nhất 1 frame trong phiên phát này
  // (dính — KHÔNG xoá khi pump ngủ/stale sau pause, để harness đọc ở
  // cuối pass vẫn thấy; chỉ reset khi pump mới tạo hoặc fallback).
  // rvfcCaptures: số frame đã capture qua rVFC; rvfcSkippedDuplicate:
  // số lần callback bắn lại cùng frame (hiếm — trình chiếu lại frame cũ
  // sau pause/seek); rvfcFallback: lý do đã rơi về snapshot theo tick
  // ("" = chưa fallback; "no-callback" = callback không bắn dù video
  // đã chạy qua ≥ 3 frame trong 3 tick liên tiếp — watchdog ở
  // drawVideoClip; "error" = callback ném lỗi).
  rvfcActive: boolean;
  rvfcCaptures: number;
  rvfcSkippedDuplicate: number;
  rvfcFallback: string;
  // Đợt 92 T2: frame của snapshot KẾ TRƯỚC lastFrame trong ring (-1 =
  // không có — ring vừa xoá rồi capture lại 1 frame). Cùng lastFrame,
  // prevFrame xác định đầy đủ cửa sổ blend tmix-3 (2 ghost + hiện
  // tại); lastDrawn* là cửa sổ ĐÃ DÙNG để vẽ khung cuối cùng (ghi
  // tại drawVideoClip lúc blend thành công) — harness nhóm spread
  // theo cửa sổ đã vẽ thay vì theo (frameIdx,lastFrame) đọc sau đo
  // (nhãn đó lệch khi capture rơi vào giữa lúc đo pixel, xem LIMITS
  // đợt 92 T2 §4). -1 = chưa từng blend.
  prevFrame: number;
  lastDrawnFrameIdx: number;
  lastDrawnLastFrame: number;
  lastDrawnPrevFrame: number;
  // Đợt 96 X2: frame video ĐANG TRÌNH CHIẾU tại lần blend cuối (ước lượng
  // tốt nhất đồng bộ trong tick — xem presentedFrameIndex): khác
  // lastDrawnFrameIdx (lấy từ currentTime) khi trình chiếu đã lật sang
  // frame kế trước khi currentTime qua mốc — chính là lệch làm ra 2 mức
  // gStd 37,5/84,6 ở đợt 95 W4 (nhãn cũ không ghi frame trình chiếu nên
  // 2 cửa sổ blend khác nhau mang cùng 1 nhãn). -1 = chưa từng blend.
  // Harness nhóm spread theo cửa sổ THẬT bằng trường này (xem probe
  // probe91s1-motionblur-rvfc.cdp.mjs); giá trị là ước lượng từ lịch
  // trình chiếu rVFC (expectedDisplayTime), không phải đo trực tiếp
  // pixels — xem LIMITS đợt 96 X2 §1.3 về sai số biên.
  lastDrawnPresentedFrame: number;
  // Đợt 96 X2 (lượt 3): 2 trường hoàn thiện nhãn cửa sổ blend — ghi đúng
  // giá trị compositeMotionBlurLayer dùng ở lần blend cuối (qua stash
  // blendPresentedFrame): ringSize = số snapshot trong ring LÚC BLEND
  // (khác ring đọc sau lúc đo — capture có thể chen vào giữa), skippedLatest
  // = 1 khi snapshot mới nhất bị loại khỏi tập ghost (P == L), 0 khi giữ
  // hành vi cũ. Không có 2 trường này, harness không phân biệt được 2
  // mẫu cùng (frameIdx,prev,last,presented) nhưng blend khác nhau (vd
  // ring lúc blend chỉ có 2 snapshot vì vừa refill sau clear). -1 = chưa
  // từng blend.
  lastDrawnRingSize: number;
  lastDrawnSkippedLatest: number;
  // Đợt 101 C4 — PAD-OLDEST: số ghost clone (snapshot cũ nhất lặp lại) mà
  // compositeMotionBlurLayer đã thêm để lấp cửa sổ blend khi ring đói
  // (xem compositeMotionBlurLayer); 0 = không pad (ring đủ), -1 = chưa
  // từng blend. ringSize ghi vẫn là số snapshot THẬT trong ring.
  lastDrawnPaddedGhosts: number;
}
const motionBlurDebugState = new Map<string, MotionBlurDebugState>();
let motionBlurDebugExposed = false;
function exposeMotionBlurDebug(): void {
  if (motionBlurDebugExposed || typeof window === "undefined") return;
  motionBlurDebugExposed = true;
  (window as unknown as { __vcutMotionBlurSnapshots?: Map<string, MotionBlurDebugState> }).__vcutMotionBlurSnapshots = motionBlurDebugState;
}

// ---- Đợt 92 T2: chi phí tick main-thread của đường preview mask+blur ----
// Nợ S1 đợt 91 §5.1: rVFC chỉ capture ~1/3 frame trình chiếu vì main
// thread bận xử lý mask CPU mỗi tick. Để tìm blocker thật phải đo từng
// thành phần trong app thật (không đo bằng CDP mỗi khung — tự phép đo
// đã làm chậm tick). Ghi MỖI lần drawVideoClip vẽ clip video có
// mask+blur lúc đang phát (đường nóng nhất) + MỖI lần renderFrame +
// MỖI lần rVFC capture; phơi qua window cho harness CDP đọc cuối pass.
// Chỉ đo thời gian (performance.now), không đổi hành vi vẽ.
// Sample: total = toàn bộ drawVideoClip của clip này; raw = rawUnitSource
// (drawImage video → unit thô); blend = compositeMotionBlurLayer (2 ghost
// + frame hiện tại lên lớp); mask = maskedUnitSource (drawImage + CPU);
// maskGet/maskApply/maskPut = 3 bước trong mask; draw = vẽ lớp đã mask
// lên canvas chính (kèm SR); frameIdx = frame video ở tick này;
// viaRvfc 1 = snapshot qua rVFC; path = mask-blend (ring có bóng) /
// mask-direct (ring rỗng, vẽ trực tiếp) / plain-blend (không mask).
export interface TickCostSample {
  path: "mask-blend" | "mask-direct" | "plain-blend";
  total: number;
  raw: number;
  blend: number;
  mask: number;
  maskGet: number;
  maskApply: number;
  maskPut: number;
  draw: number;
  frameIdx: number;
  viaRvfc: number;
  /** 1 = mask áp bằng canvas alpha cache (đợt 92 T2), 0 = đường CPU cũ. */
  maskCanvas: number;
  wallMs: number;
}
const tickCostSamples: TickCostSample[] = [];
const TICK_COST_MAX_SAMPLES = 1500;
let tickCostExposed = false;
function recordTickCost(s: TickCostSample): void {
  tickCostSamples.push(s);
  if (tickCostSamples.length > TICK_COST_MAX_SAMPLES) {
    tickCostSamples.splice(0, tickCostSamples.length - TICK_COST_MAX_SAMPLES);
  }
  if (!tickCostExposed && typeof window !== "undefined") {
    tickCostExposed = true;
    (window as unknown as { __vcutTickCost?: TickCostSample[] }).__vcutTickCost = tickCostSamples;
  }
}
/** Chi phí 1 lần rVFC capture (drawImage video → snapshot, trong callback). */
export interface RvfcCaptureCostSample {
  ms: number;
  frameIdx: number;
  wallMs: number;
}
const rvfcCaptureCostSamples: RvfcCaptureCostSample[] = [];
const RVFC_COST_MAX_SAMPLES = 600;
let rvfcCostExposed = false;
function recordRvfcCaptureCost(s: RvfcCaptureCostSample): void {
  rvfcCaptureCostSamples.push(s);
  if (rvfcCaptureCostSamples.length > RVFC_COST_MAX_SAMPLES) {
    rvfcCaptureCostSamples.splice(0, rvfcCaptureCostSamples.length - RVFC_COST_MAX_SAMPLES);
  }
  if (!rvfcCostExposed && typeof window !== "undefined") {
    rvfcCostExposed = true;
    (window as unknown as { __vcutRvfcCost?: RvfcCaptureCostSample[] }).__vcutRvfcCost = rvfcCaptureCostSamples;
  }
}
/** Đợt 93 U1: 1 event MỖI lần callback rVFC bắn (kể cả duplicate/skip) —
 * phân rã scheduling vs capture: tInvoke = lúc callback bắt đầu chạy,
 * nowArg = tham số now của callback, presentedFrames/mediaTime/
 * expectedDisplayTime/captureTime = metadata trình duyệt đưa, frameIdx =
 * videoFrameIndex(mediaTime), decision = kết quả rvfcCaptureFrame,
 * capMs = thời gian drawImage capture, tCapEnd, tReregister = lúc đăng
 * ký lại callback kế tiếp (null khi không đăng ký lại). Chỉ đo thời
 * gian + metadata, không đổi hành vi pump. Harness đọc cuối pass để
 * tính: callback coverage (callbacks/presented), tỉ lệ duplicate,
 * presentedFrames nhảy mấy khung giữa 2 callback, lateMs (tInvoke -
 * expectedDisplayTime), và thời gian từ đăng ký lại tới lần bắn sau.
 * Cap 2000 event (1 pass ~2,2s chỉ ~70 callback nên đủ nhiều pass).
 */
export interface RvfcPumpSample {
  seq: number;
  tInvoke: number;
  nowArg: number;
  presentedFrames: number | null;
  mediaTime: number | null;
  expectedDisplayTime: number | null;
  captureTime: number | null;
  frameIdx: number;
  decision: string;
  capMs: number | null;
  tCapEnd: number | null;
  tReregister: number | null;
  /** Đợt 93 U1: chênh currentTime - mediaTime lúc callback chạy (ms) —
   * > 33,3ms @30fps nghĩa là element đã sang frame kế (snapshot sẽ
   * gán nhầm nhãn nếu capture). null khi callback dừng trước guard. */
  ctDeltaMs: number | null;
  /**
   * Đợt 97 Y2 — chẩn đoán cụm double-count 84 (nợ mở #2 đợt 96, xem
   * LIMITS đợt 96 X2 §3.5/§4.1): 7 trường ghi thêm vào MỖI pump event
   * để phân biệt capture gán nhầm nhãn (H1) với presented ước lượng
   * lệch (H2). Chỉ đo, không đổi quyết định capture/blend nào:
   * - ctAtInvoke: el.currentTime lúc callback bắt đầu chạy (đọc 1 lần
   *   ở đầu callback, TRƯỚC khi capture — khác ctDeltaMs ở chỗ giữ
   *   giá trị tuyệt đối để tính ctFrameIdx, không chỉ độ chênh).
   * - ctFrameIdx: videoFrameIndex(ctAtInvoke) — frame mà element đang
   *   ở theo đồng hồ media lúc callback chạy; khác frameIdx (nhãn từ
   *   metadata.mediaTime) nghĩa là currentTime và trình chiếu lệch
   *   nhau đúng lúc capture.
   * - lateMs: tInvoke − expectedDisplayTime (độ trễ callback so với
   *   lịch trình chiếu; null khi metadata thiếu expectedDisplayTime).
   *   lateMs > 1/fps mà decision vẫn "capture" là chữ ký mislabel:
   *   callback bắn sau khi frame đã hết cửa sổ trình chiếu, drawImage
   *   vẽ frame mới hơn nhưng guard freshness vẫn cho lọt (currentTime
   *   chạy sau trình chiếu nên ctDeltaMs không vượt ngưỡng).
   * - presentedAtInvoke: ước lượng presented frame NGAY TRƯỚC khi
   *   callback này cập nhật lastPresented (niềm tin của blend logic
   *   ngay trước callback — sau cập nhật nó thành frame của chính
   *   callback này nên không còn ý nghĩa chẩn đoán).
   * - ringSize/ringLast/ringPrev: số snapshot + nhãn 2 snapshot mới
   *   nhất trong ring LÚC GHI event (đọc live từ debug state — sau
   *   capture thì đã cập nhật, khi skip thì là ring hiện tại).
   */
  ctAtInvoke: number | null;
  ctFrameIdx: number | null;
  lateMs: number | null;
  presentedAtInvoke: number;
  ringSize: number;
  ringLast: number;
  ringPrev: number;
  /**
   * Đợt 98 Z2 — chẩn đoán residual ghost 13,8% (đợt 97 Y2 §3.10):
   * strip pixels THẬT của snapshot vừa capture (xem sampleStripeStrip —
   * 48 mẫu kênh G trên hàng giữa snapshot, base64), đọc NGAY SAU
   * drawImage trong rvfcCaptureFrame nên chính là pixels snapshot giữ.
   * Đối chiếu offline với frame nguồn tương ứng: pix khớp frame K thì
   * snapshot nhãn K đúng pixels; khớp K−1 thì race pixels lúc capture
   * được chứng minh. Chỉ ghi khi decision là capture/reset-capture
   * (không thì null — strip cũ của capture trước không được gán nhầm).
   * pixW/pixH = kích thước snapshot lúc capture (-1 khi không capture).
   */
  pix: string | null;
  pixW: number;
  pixH: number;
}
const rvfcPumpSamples: RvfcPumpSample[] = [];
// Đợt 97 Y2: 2000 → 4000 — 1 lượt probe 5 case × 5 pass ≈ 1750 event,
// sát cap cũ; trim giữa lượt sẽ làm mất mắt xích nối mẫu 84 với pump
// event (phân tích Y2 nối theo seq), nên nới cap thay vì để trim.
const RVFC_PUMP_MAX_SAMPLES = 4000;
let rvfcPumpExposed = false;
let rvfcPumpSeq = 0;
function recordRvfcPump(s: RvfcPumpSample): void {
  rvfcPumpSamples.push(s);
  if (rvfcPumpSamples.length > RVFC_PUMP_MAX_SAMPLES) {
    rvfcPumpSamples.splice(0, rvfcPumpSamples.length - RVFC_PUMP_MAX_SAMPLES);
  }
  if (!rvfcPumpExposed && typeof window !== "undefined") {
    rvfcPumpExposed = true;
    (window as unknown as { __vcutRvfcPump?: RvfcPumpSample[] }).__vcutRvfcPump = rvfcPumpSamples;
  }
}
/**
 * Đợt 97 Y2 — 1 entry cho MỖI tick blend thành công (ghi trong
 * recordDrawnBlendWindow, đúng lúc compositeMotionBlurLayer vừa quyết
 * định tập ghost): nối quyết định blend với callback trễ nhất đã nuôi
 * ring, để harness nối mẫu gStd 84 với nguyên nhân của nó.
 * - presented: frame trình chiếu mà compositeMotionBlurLayer vừa dùng
 *   (đọc từ stash blendPresentedFrame — đúng giá trị quyết định, không
 *   ước lượng lại sau blend).
 * - expected: frameIdx của tick (videoFrameIndex từ currentTime).
 * - currentTime: đồng hồ media lúc blend (null khi clip không phải
 *   video element — vd held canvas — thì không có đồng hồ media).
 * - skippedLatest/ringSize: quyết định skip + số snapshot trong ring
 *   LÚC BLEND (từ cùng stash).
 * - ringLast/ringPrev: nhãn 2 snapshot mới nhất lúc blend (ghost đã
 *   dùng là {ringPrev, ringLast} khi skipLatest=0, {…, ringPrev} khi
 *   skipLatest=1 — xem compositeMotionBlurLayer).
 * - viaRvfc: 1 = pump đang sống và sở hữu snapshot lúc blend.
 * - lastPumpSeq/lastPumpLateMs/lastPumpCtDeltaMs: pump event gần nhất
 *   của clip này lúc blend (seq + độ trễ callback + ctDelta của nó) —
 *   cầu nối sang __vcutRvfcPump để tra capture nào đã nuôi ring.
 * - curPix (Đợt 98 Z2): strip pixels THẬT của frame HIỆN TẠI mà blend
 *   vừa dùng (đường mask: rawUnit — frame hiện tại vẽ live từ element;
 *   đường thường: không có canvas riêng nên null). Cùng tọa độ với
 *   `pix` của pump event nên đối chiếu trực tiếp được: nếu ghost sạch
 *   mà curPix lệch nhãn thì residual đến từ frame hiện tại vẽ live lúc
 *   blend, không phải từ snapshot trong ring.
 * - ghostPix (Đợt 99 A2): strip pixels THẬT của ĐÚNG các ghost snapshot
 *   mà compositeMotionBlurLayer vừa blend (kèm nhãn frame + kích thước
 *   snapshot lúc capture) — expose ring snapshots: mỗi entry là 1
 *   snapshot trong ring, đối chiếu trực tiếp với frame nguồn tương ứng
 *   mà không cần đi qua pump log (pump log MẤT snapshot đường tick —
 *   xem LIMITS đợt 98 Z2 §4.2: 10/23 outlier ghost "không dữ liệu").
 *   null = composite không chạy ở tick này (không xảy ra khi tick được
 *   ghi — recordDrawnBlendWindow chỉ gọi sau blend thành công).
 * Cap 4000 (1 lượt probe ≈ 1650 tick, như pump log). Chỉ đo, không
 * đổi hành vi blend.
 */
export interface RvfcBlendTickSample {
  seq: number;
  tBlend: number;
  clipId: string;
  presented: number;
  expected: number;
  currentTime: number | null;
  skippedLatest: number;
  ringSize: number;
  ringLast: number;
  ringPrev: number;
  viaRvfc: number;
  lastPumpSeq: number;
  lastPumpLateMs: number | null;
  lastPumpCtDeltaMs: number | null;
  curPix: string | null;
  /**
   * Đợt 99 A2 — expose ring snapshots (xem MotionBlurSnapshotPix):
   * strip pixels của ĐÚNG các ghost snapshot đã blend ở tick này,
   * theo thứ tự blend (cũ → mới). Đối chiếu offline với frame nguồn:
   * entry.frame khớp pixels của nó thì snapshot trong ring chứa đúng
   * pixels nhãn của nó; lệch ±1 thật thì ring chứa pixels frame kề.
   */
  ghostPix: (MotionBlurSnapshotPix | null)[] | null;
  /**
   * Đợt 104 F3 (104f3): nguồn + tuổi anchor đã nuôi `presented` ở tick này
   * ("tap"|"pump" tươi ≤50ms, "frameIdx" = rơi về frameIdx).
   * (Đợt 105 G1: nấc "rawAnchor" đã bỏ. Đính chính đợt 106 H5: số "0/30
   *  clean" cũ là artifact dedup của analyzer distinct; đo đúng mọi
   *  occurrence: rawAnchor 70,4% ≈ frameIdx 70,0%, không lợi ích.)
   */
  anchorSrc?: string;
  anchorAgeMs?: number | null;
}
const rvfcBlendTickSamples: RvfcBlendTickSample[] = [];
const RVFC_BLEND_TICK_MAX_SAMPLES = 4000;
let rvfcBlendTickExposed = false;
let rvfcBlendTickSeq = 0;
function recordRvfcBlendTick(s: RvfcBlendTickSample): void {
  rvfcBlendTickSamples.push(s);
  if (rvfcBlendTickSamples.length > RVFC_BLEND_TICK_MAX_SAMPLES) {
    rvfcBlendTickSamples.splice(0, rvfcBlendTickSamples.length - RVFC_BLEND_TICK_MAX_SAMPLES);
  }
  if (!rvfcBlendTickExposed && typeof window !== "undefined") {
    rvfcBlendTickExposed = true;
    (window as unknown as { __vcutRvfcBlendTick?: RvfcBlendTickSample[] }).__vcutRvfcBlendTick = rvfcBlendTickSamples;
  }
}
// Đợt 98 Z2: strip pixels của frame HIỆN TẠI mà blend vừa dùng — draw
// path (đường mask: rawUnit) đặt trước khi gọi recordDrawnBlendWindow;
// recordDrawnBlendWindow đọc rồi xoá (1 tick dùng 1 lần). Đường thường
// (không mask) vẽ frame hiện tại trực tiếp từ drawSrc, không có canvas
// riêng nên không đặt → curPix null ở đường đó.
const blendCurrentPixStrip = new Map<string, string | null>();
// Đợt 100 B4: strip pixels frame hiện tại ở ĐƯỜNG THƯỜNG (plain-blend)
// — giả thuyết presented mislabel −1 (nợ LIMITS gộp đợt 99 §4 mục 5:
// ca wk r15 c1 fi=8: ghost thật 5, nhãn {6,8}, đo 0,304 — curPix null
// ở đường thường nên không đọc được content presented để chứng minh/bác).
// Vẽ drawSrc live vào scratch canvas tái dùng, cùng hình học snapshot
// (dw×dh) rồi đọc strip bằng sampleStripeStrip — cùng tọa độ với strip
// ghost/pump nên đối chiếu trực tiếp được với frame nguồn. Chỉ đo,
// không đổi logic blend (1 drawImage + 1 getImageData 48×1 mỗi tick
// blend đường thường; cùng bậc chi phí với strip snapshot đã có ở
// đường tick/rVFC). Đặt trước recordDrawnBlendWindow như đường mask.
let plainCurPixCanvas: HTMLCanvasElement | null = null;
function samplePlainCurrentPixStrip(
  drawSrc: CanvasImageSource,
  dw: number,
  dh: number,
): string | null {
  try {
    if (typeof document === "undefined") return null;
    if (!plainCurPixCanvas) plainCurPixCanvas = document.createElement("canvas");
    const w = Math.max(2, Math.round(dw));
    const h = Math.max(2, Math.round(dh));
    if (plainCurPixCanvas.width !== w || plainCurPixCanvas.height !== h) {
      plainCurPixCanvas.width = w;
      plainCurPixCanvas.height = h;
    }
    const sctx = plainCurPixCanvas.getContext("2d");
    if (!sctx) return null;
    sctx.clearRect(0, 0, w, h);
    sctx.drawImage(drawSrc, 0, 0, w, h);
    return sampleStripeStrip(plainCurPixCanvas, sctx);
  } catch {
    return null;
  }
}
/**
 * Đợt 99 A2 — expose ring snapshots: 1 entry cho MỖI snapshot trong
 * ring motionBlurSnapshots, gắn TRÊN canvas snapshot (WeakMap theo
 * canvas — canvas tái dùng thì entry bị ghi đè lúc vẽ lại, ring xoá
 * thì entry tự GC theo canvas, không cần đồng bộ mảng song song).
 * - frame: nhãn frame video của snapshot (frameIndex lúc capture; -1
 *   khi đường tick không biết frame).
 * - pix: strip pixels THẬT của snapshot (xem sampleStripeStrip — đọc
 *   ngay sau drawImage lúc capture, cùng tọa độ với `pix` pump event
 *   và `curPix` blend tick).
 * - w/h: kích thước snapshot lúc capture (để mô phỏng ground truth
 *   đúng hình học khi đối chiếu offline — đường rVFC unit 640×360,
 *   đường tick letterbox/rawUnit có thể khác).
 */
export interface MotionBlurSnapshotPix {
  frame: number;
  pix: string | null;
  w: number;
  h: number;
  /**
   * Đợt 100 B2 — đo thời gian trong-tick (chỉ đo, không đổi hành vi):
   * labelMs/labelCt = lúc drawVideoClip đọc currentTime để gán nhãn
   * frame (videoFrameIndex); rawMs/rawCt = lúc rawUnitSource vừa vẽ
   * xong từ video element (đường mask: pixels snapshot được lấy mẫu
   * thật ở đây, không phải lúc copy snapshot); snapMs/snapCt = lúc
   * updateMotionBlurSnapshots vẽ snapshot (drawImage); srcKind =
   * "video" khi drawSrc là video element sống (snapCt là currentTime
   * lúc lấy mẫu thật), "canvas" khi drawSrc là canvas đã vẽ trước đó
   * (snapMs chỉ là chặn trên của thời gian lấy mẫu). Đường rVFC không
   * qua drawVideoClip nên các trường này vắng — phân biệt 2 đường.
   */
  labelMs?: number;
  labelCt?: number | null;
  rawMs?: number | null;
  rawCt?: number | null;
  snapMs?: number;
  snapCt?: number | null;
  srcKind?: "video" | "canvas";
  /**
   * Đợt 104 F3 (104f3): nguồn nhãn snapshot ("tap"|"pump" = anchor tươi,
   * "frameIdx" = rơi về frameIdx, "off" = relabel tắt).
   * (Đợt 105 G1: "rawAnchor" đã bỏ. Đính chính đợt 106 H5: "0/30 clean" cũ
   *  là artifact dedup; đo đúng: rawAnchor 70,4% ≈ frameIdx 70,0%.)
   */
  labelSrc?: string;
}
const motionBlurSnapshotPix = new WeakMap<HTMLCanvasElement, MotionBlurSnapshotPix>();
/**
 * Đợt 100 B2: mốc nhãn/lấy mẫu trong-tick của drawVideoClip, theo clip —
 * đặt ở đầu tick (lúc đọc currentTime), bổ sung mốc rawUnit sau khi vẽ,
 * đọc ở updateMotionBlurSnapshots (lúc vẽ snapshot), 1 tick dùng 1 lần
 * rồi xoá (tránh rò sang tick sau; tick không snapshot thì tick sau ghi
 * đè). Chỉ đo, không đổi logic blend/render.
 */
export interface TickLabelCtx {
  labelMs: number;
  labelCt: number | null;
  labelFrame: number;
  rawMs: number | null;
  rawCt: number | null;
}
const tickLabelCtx = new Map<string, TickLabelCtx>();
function recordMotionBlurSnapshotPix(
  snap: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D | null,
  frame: number,
  preStrip?: string | null,
  // Đợt 100 B2: mốc thời gian trong-tick (chỉ đường tick truyền;
  // đường rVFC không truyền → các trường vắng).
  timing?: {
    labelMs: number;
    labelCt: number | null;
    rawMs: number | null;
    rawCt: number | null;
    snapMs: number;
    snapCt: number | null;
    srcKind: "video" | "canvas";
  },
  // Đợt 104 F3 (104f3): nguồn nhãn snapshot (tap/pump/frameIdx/off).
  labelSrc?: string,
): void {
  motionBlurSnapshotPix.set(snap, {
    frame,
    pix: preStrip !== undefined ? preStrip : sampleStripeStrip(snap, ctx),
    w: snap.width,
    h: snap.height,
    ...(timing ?? {}),
    ...(labelSrc !== undefined ? { labelSrc } : {}),
  });
}
// Đợt 99 A2: strip của ĐÚNG các ghost snapshot mà composite vừa blend
// (đặt trong compositeMotionBlurLayer; recordDrawnBlendWindow đọc rồi
// xoá — cùng mẫu stash 1-tick như blendCurrentPixStrip).
const blendGhostPixStrip = new Map<string, (MotionBlurSnapshotPix | null)[]>();
/** Thời gian renderFrame (toàn bộ clip trong tick), ms + wall clock. */export interface RenderFrameCostSample {
  ms: number;
  wallMs: number;
}
const renderFrameCostSamples: RenderFrameCostSample[] = [];
const RENDER_FRAME_COST_MAX_SAMPLES = 1500;
let renderFrameCostExposed = false;
function recordRenderFrameCost(s: RenderFrameCostSample): void {
  renderFrameCostSamples.push(s);
  if (renderFrameCostSamples.length > RENDER_FRAME_COST_MAX_SAMPLES) {
    renderFrameCostSamples.splice(0, renderFrameCostSamples.length - RENDER_FRAME_COST_MAX_SAMPLES);
  }
  if (!renderFrameCostExposed && typeof window !== "undefined") {
    renderFrameCostExposed = true;
    (window as unknown as { __vcutRenderFrameMs?: RenderFrameCostSample[] }).__vcutRenderFrameMs = renderFrameCostSamples;
  }
}
/** Thời gian tickInner trọn vẹn (syncMedia + renderFrame + store). */
export interface LoopCostSample {
  ms: number;
  wallMs: number;
}
const loopCostSamples: LoopCostSample[] = [];
const LOOP_COST_MAX_SAMPLES = 1500;
let loopCostExposed = false;
function recordLoopCost(s: LoopCostSample): void {
  loopCostSamples.push(s);
  if (loopCostSamples.length > LOOP_COST_MAX_SAMPLES) {
    loopCostSamples.splice(0, loopCostSamples.length - LOOP_COST_MAX_SAMPLES);
  }
  if (!loopCostExposed && typeof window !== "undefined") {
    loopCostExposed = true;
    (window as unknown as { __vcutLoopMs?: LoopCostSample[] }).__vcutLoopMs = loopCostSamples;
  }
}
/** Tách 3 bước CPU trong maskedUnitSource (đợt 92 T2). */
export interface MaskTimings {
  get: number;
  apply: number;
  put: number;
  total: number;
  /** true = đã dùng đường canvas alpha cache (không chạy vòng lặp pixel). */
  viaCanvas: boolean;
}

// ---- Đợt 93 U1: memo canvas alpha theo (clip, frameIdx) ----
// Đo thật spec C (mask bám track, LIMITS U1 §6): tick trùng frameIdx
// (dup 0,42–0,50) tốn mask 3,8–3,9ms (miss — hình học đổi theo localT)
// trong khi tick khác frame chỉ 0,6–0,8ms (hit, do playhead lượng tử
// hoá nên hình học chỉ đổi ~30Hz, lệch pha theo từng pass). Memo 1
// entry/clip: tick trùng frameIdx dùng lại canvas alpha của tick trước
// thay vì build lại — tiết kiệm ~3,3ms/tick trùng ở pha track chạy,
// ~0 ở mask tĩnh (đã hit sẵn) và ở pha track kẹp. Lệch hình học tối đa
// 1 tick track (~0,003 ≈ 2px @640, dưới dung sai 0,005) — không nhìn
// thấy; sửa mask bằng tay / track nhanh vượt dung sai → miss, build lại
// như cũ. An toàn canvas: geometry cache TÁI DÙNG canvas của entry bị
// đuổi nên memo phải kiểm tra identity (canvas còn trong cache dưới
// đúng khoá cũ) — không tin blind. Chỉ đường canvas alpha; đường CPU
// cũ không memo (fallback hiếm). Không dùng cho đường ảnh (không có
// frameIdx) — call site ảnh không truyền memoKey.
/** Hình học mask đã chuẩn hoá (để so dung sai khi memo hit). */
type MaskFrameMemoGeom = {
  shape: string;
  x: number;
  y: number;
  w: number;
  h: number;
  feather: number;
  invert: boolean;
};
type MaskFrameMemoEntry = {
  frameIdx: number;
  /** Khoá hình học của canvas đang giữ (để kiểm tra identity). */
  key: string;
  canvas: HTMLCanvasElement;
  effMask: MaskFrameMemoGeom;
};
const maskFrameMemo = new Map<string, MaskFrameMemoEntry>();
const MASK_FRAME_MEMO_MAX = 16;
/** Dung sai hình học cho memo (đơn vị chuẩn hoá): drift track trong 1 tick ~0,003. */
const MASK_FRAME_MEMO_TOL = 0.005;
function maskFrameMemoClose(
  a: MaskFrameMemoGeom,
  b: { shape?: unknown; x?: number; y?: number; w?: number; h?: number; feather?: number; invert?: unknown },
): boolean {
  return (
    a.shape === (b.shape ?? "") &&
    a.invert === !!b.invert &&
    Math.abs(a.x - (b.x ?? 0.5)) <= MASK_FRAME_MEMO_TOL &&
    Math.abs(a.y - (b.y ?? 0.5)) <= MASK_FRAME_MEMO_TOL &&
    Math.abs(a.w - (b.w ?? 0.5)) <= MASK_FRAME_MEMO_TOL &&
    Math.abs(a.h - (b.h ?? 0.5)) <= MASK_FRAME_MEMO_TOL &&
    Math.abs(a.feather - (b.feather ?? 0)) <= MASK_FRAME_MEMO_TOL
  );
}


function updateMotionBlurSnapshots(
  clipId: string,
  drawSrc: CanvasImageSource,
  dw: number,
  dh: number,
  maxGhosts: number,
  // Đợt 90 R1: chỉ số frame video đang hiển thị (videoFrameIndex) — -1 =
  // không biết (giữ hành vi cũ: snapshot mọi tick).
  frameIndex = -1,
): void {
  if (typeof document === "undefined" || maxGhosts <= 0) return;
  // Đợt 104 F3 (104f3): relabel snapshot bằng anchor tươi (F8; nấc rawAnchor
  // F8b đã bỏ ở đợt 105 G1 — 70,4% ≈ frameIdx 70,0%, không lợi ích; số
  // "0/30 clean" cũ là artifact dedup, đính chính đợt 106 H5) — nhãn ghi
  // vào ring là frame anchor, không phải frameIdx từ currentTime.
  // Khi tap tắt, f3RelabelFrameIndex = identity nên hành vi gốc giữ nguyên.
  const relabel104f3 = f3RelabelFrameIndex(clipId, frameIndex);
  frameIndex = relabel104f3.frame;
  const labelSrc104f3 = relabel104f3.labelSrc;
  // Đợt 92 T2: prevFrame = snapshot kế trước snapshot mới này (-1 khi
  // ring vừa bị xoá — reset-capture/seek). Ghi lại trước khi set
  // lastFrame mới để lastDrawnWindow xác định đúng cửa sổ blend.
  let prevFrameForDbg = -1;
  let resetForDbg = false;
  if (frameIndex >= 0) {
    const last = motionBlurLastFrameIndex.get(clipId);
    if (last !== undefined) {
      if (frameIndex === last) {
        const dbg = motionBlurDebugState.get(clipId);
        if (dbg) dbg.skippedDuplicate++;
        return; // Cùng 1 video frame với snapshot mới nhất — không thêm trùng.
      }
      if (frameIndex < last - 1) {
        // Nhảy lùi > 1 frame (seek/loop): bóng cũ trước điểm nhảy không
        // còn thuộc cửa sổ tmix mới — xoá ring để refill từ frame hiện tại.
        // (Đường chính là motionBlurResetOnSeek gọi TRƯỚC khi blend ở
        // drawVideoClip; đây chỉ là backstop khi frameIndex chỉ xuất hiện
        // ở bước snapshot.)
        const arr = motionBlurSnapshots.get(clipId);
        if (arr) arr.length = 0;
        const dbg = motionBlurDebugState.get(clipId);
        if (dbg) dbg.ringClears++;
        resetForDbg = true;
      } else {
        prevFrameForDbg = last;
      }
    }
    motionBlurLastFrameIndex.set(clipId, frameIndex);
  }
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
  // Đợt 100 B2: mốc lấy mẫu snapshot trong-tick (chỉ đo — đọc ctx nhãn
  // của tick này rồi xoá để không rò sang tick sau; drawSrc là video
  // element sống thì snapCt là currentTime lúc lấy mẫu thật, là canvas
  // thì pixels đã lấy mẫu trước đó ở rawUnitSource — xem rawMs/rawCt).
  const snapMsB2 = performance.now();
  const snapCtB2 =
    typeof HTMLVideoElement !== "undefined" && drawSrc instanceof HTMLVideoElement
      ? drawSrc.currentTime
      : null;
  const labelCtxB2 = tickLabelCtx.get(clipId);
  tickLabelCtx.delete(clipId);
  sctx.drawImage(drawSrc, 0, 0, snap.width, snap.height);
  // Đợt 99 A2: expose ring snapshot — strip pixels snapshot vừa vẽ
  // (đường tick; rVFC có điểm ghi riêng trong rvfcCaptureFrame).
  recordMotionBlurSnapshotPix(
    snap,
    sctx,
    frameIndex,
    undefined,
    labelCtxB2
      ? {
          labelMs: labelCtxB2.labelMs,
          labelCt: labelCtxB2.labelCt,
          rawMs: labelCtxB2.rawMs,
          rawCt: labelCtxB2.rawCt,
          snapMs: snapMsB2,
          snapCt: snapCtB2,
          srcKind: snapCtB2 !== null ? "video" : "canvas",
        }
      : undefined,
    labelSrc104f3,
  );
  arr.push(snap);
  // Đợt 90 R1: cập nhật thống kê gate cho harness đo (xem khai báo trên).
  exposeMotionBlurDebug();
  const dbg = motionBlurDebugState.get(clipId) ?? { ring: 0, lastFrame: -1, skippedDuplicate: 0, ringClears: 0, rvfcActive: false, rvfcCaptures: 0, rvfcSkippedDuplicate: 0, rvfcFallback: "", prevFrame: -1, lastDrawnFrameIdx: -1, lastDrawnLastFrame: -1, lastDrawnPrevFrame: -1, lastDrawnPresentedFrame: -1, lastDrawnRingSize: -1, lastDrawnSkippedLatest: -1, lastDrawnPaddedGhosts: -1 };
  dbg.ring = arr.length;
  dbg.lastFrame = frameIndex;
  // Đợt 92 T2: prevFrame chỉ có nghĩa khi snapshot này được gate theo
  // frame (frameIndex >= 0); không gate thì giữ -1 cùng lastFrame.
  dbg.prevFrame = frameIndex >= 0 && !resetForDbg ? prevFrameForDbg : -1;
  motionBlurDebugState.set(clipId, dbg);
}

let motionBlurLayer: HTMLCanvasElement | null = null;

/**
 * Đợt 90 R1: reset ring snapshot khi frame video nhảy LÙI > 1 frame
 * (seek/loop) — gọi ở drawVideoClip NGAY SAU khi tính frameIdx, TRƯỚC
 * mọi nhánh blend. Nếu chỉ xoá ở bước snapshot (sau khi vẽ) thì đúng
 * tick seek đó blend vẫn dùng ring cũ trước seek 1 khung (đo được ở
 * harness R1: khung đầu lượt phát 2 blend bóng cuối lượt 1 với frame 0,
 * gStd 37.7 trong khi ring rỗng phải cho 112.4). Nhảy lùi đúng 1 frame
 * (phát ngược từng bước) KHÔNG reset (giữ hành vi reverse cũ); nhảy
 * tiến (re-seek drift lúc phát xuôi) cũng không reset.
 */
function motionBlurResetOnSeek(clipId: string, frameIndex: number): void {
  if (frameIndex < 0) return;
  const last = motionBlurLastFrameIndex.get(clipId);
  if (last === undefined || frameIndex >= last - 1) return;
  const arr = motionBlurSnapshots.get(clipId);
  if (arr) arr.length = 0;
  const dbg = motionBlurDebugState.get(clipId);
  if (dbg) dbg.ringClears++;
}

// ---- Motion blur preview: pump requestVideoFrameCallback (đợt 91 S1) ----
// Vấn đề R1 §5.1: ring snapshot theo tick rAF giữ "2 snapshot PHÂN BIỆT
// gần nhất" nhưng KHÔNG đảm bảo LIÊN TIẾP — rAF chậm (harness đo làm
// rAF còn ~10–12fps) thì 2 snapshot cách nhau ~3 frame video → cửa sổ
// blend rộng hơn tmix-3 của render (gStd 37 thay vì ~84 ở vài pha) và
// khi khoảng cách trúng đúng chu kỳ sọc (4 frame = 48px) thì 3 frame
// cùng pha → gStd về baseline (112) ở khung lẻ. Không thể lấy lại frame
// đã trôi qua từ video element — hướng triệt để là snapshot ĐÚNG mỗi
// frame video trình chiếu bằng requestVideoFrameCallback (rVFC), độc lập
// với tốc độ tick rAF.
// Kiến trúc:
// - Pump sống theo clip (rvfcPumps, key = clip.id): drawVideoClip khẳng
//   định (ensure) mỗi tick khi clip đang phát xuôi + có blur + drawSrc
//   là video thô (không qua LUT WebGL/effects/enhance/chroma — xem
//   pipelineProcessedDrawSrc ở drawVideoClip: các xử lý đó nướng vào
//   snapshot của đường tick, snapshot thô của rVFC sẽ mất chúng nên
//   phải fallback về đường tick). Callback rVFC tự đăng ký lại sau mỗi
//   frame trình chiếu; pump chết (stale > 1.5s không được khẳng định /
//   lỗi / watchdog) thì dừng, không đăng ký lại.
// - Snapshot rVFC lưu vào CÙNG ring motionBlurSnapshots mà đường blend
//   đọc, cùng định dạng hình học với snapshot đường tick của chính
//   đường vẽ đó: mode "letterbox" (canvas dw×dh, frame thô letterbox —
//   đường thường/SR) hoặc mode "unit" (canvas W×H thu nhỏ theo
//   MASK_MAX_W, letterbox nằm trong — đường mask, giống rawUnitSource
//   nhưng CHƯA áp cssFilter; painter đường mask áp cssFilter lúc blend,
//   xem drawVideoClip). Pump mới tạo thì XOÁ ring (tránh trộn snapshot
//   tick cũ đã nướng cssFilter với snapshot thô mới — filter áp 2 lần
//   ở 1–2 frame chuyển tiếp).
// - Khi pump sống, drawVideoClip KHÔNG snapshot theo tick nữa (tránh
//   trộn 2 nguồn snapshot trong cùng ring). Khi pump chết/fallback,
//   đường tick tiếp quản lại ngay trong chính tick đó (watchdog).
// - An toàn: callback bọc try/catch — lỗi thì pump chết + ghi
//   rvfcFallback, không giết vòng lặp preview. Video chưa có dữ liệu
//   (readyState < 2) thì bỏ qua lần capture đó, không đẩy canvas trống.
// - Ràng buộc đã biết: element video của preview KHÔNG gắn DOM nhưng
//   rVFC vẫn bắn trên Chromium (xem presentedFps.ts); WebKitGTK KHÔNG
//   BAO GIỜ bắn callback dù supported=true (đo lại đợt 94 V4:
//   probe94v4-rvfc-webkit, 0/4 chuỗi, video phát sạch 74 frame trình
//   chiếu; Chromium cùng trang 281+139 callback) — fast-path "rVFC im
//   lặng" + memo engine (đợt 94 V4, xem rvfcWatchdogMiss/rvfcKillPump)
//   fallback về đường tick thay vì chờ watchdog đủ 3 miss.
//   Phát ngược/stepping (seek từng frame) KHÔNG dùng pump (rVFC lúc
//   seek-stepping chưa đo độ tin cậy) — giữ đường tick của R1.
//   Clip hold (decoder stall, srcEl là canvas giữ) cũng không khẳng
//   định pump — pump ngủ sau 1.5s rồi draw path khẳng định lại khi
//   hết hold (ring refill 2 frame).
interface RvfcPumpState {
  clipId: string;
  el: HTMLVideoElement;
  fps: number;
  maxGhosts: number;
  mode: "letterbox" | "unit";
  /** Kích thước project (px) — mode "unit" vẽ letterbox vào trong. */
  W: number;
  H: number;
  /** Hình chữ nhật letterbox trong hệ project (px). */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  /** Tỉ lệ thu nhỏ của unit (min(1, MASK_MAX_W / W)) — chỉ mode "unit". */
  s: number;
  /**
   * Đợt 99 A6 — cửa sổ timeline của clip (giây, cùng hệ với playhead):
   * check clip-active trong rvfcCallback chặn capture khi playhead đã
   * ra khỏi clip (kill draw-path bị trễ 1 tick). Đặt/cập nhật ở
   * ensureRvfcPump mỗi lần khẳng định (trim/edit lúc phát cũng đúng).
   * duration <= 0 = chưa ghi nhận → check không áp dụng (an toàn).
   */
  clipStart: number;
  clipDuration: number;
  /** performance.now() của lần khẳng định gần nhất từ draw path. */
  lastWantedMs: number;
  /** performance.now() lúc tạo pump (ân hạn watchdog 500ms). */
  createdMs: number;
  /**
   * Đợt 94 V4: performance.now() lúc callback rVFC gần nhất bắn (khởi
   * tạo = lúc tạo pump) — đo "rVFC im lặng" trực tiếp theo từng pump
   * (xem rvfcWatchdogMiss fast-path). Callback duplicate/skip cũng cập
   * nhật mốc này: chúng là bằng chứng engine còn bắn, chỉ không capture.
   */
  lastCallbackMs: number;
  /**
   * Đợt 96 X2: frame trình chiếu + thời điểm trình chiếu dự kiến của
   * callback rVFC gần nhất (metadata.mediaTime → frameIdx,
   * metadata.expectedDisplayTime) — nguồn để ước lượng frame ĐANG
   * trình chiếu tại thời điểm blend (xem presentedFrameIndex): frame
   * hiện tại lật sang K+1 trước khi currentTime qua mốc (đợt 95 W4),
   * nên chỉ currentTime thì không biết trình chiếu đang ở K hay K+1.
   * Cập nhật ở MỌI callback bắn (kể cả duplicate/skip/stale — frame
   * đó vẫn đã trình chiếu); -1/null = chưa có callback nào.
   * Reset khi pump tạo mới/khởi động lại (thông tin trình chiếu cũ
   * không còn đúng sau khi pump chết).
   */
  lastPresentedFrameIdx: number;
  lastExpectedDisplayTime: number | null;
  /**
   * Đợt 97 Y2: tóm tắt pump event GẦN NHẤT của clip (cập nhật trong
   * closure pumpEvent của rvfcCallback — cầu nối để blend-tick log
   * trong recordDrawnBlendWindow tra callback nào vừa nuôi ring, không
   * phải quét lại toàn bộ __vcutRvfcPump). -1/null = chưa có callback
   * nào kể từ khi pump tạo/khởi động lại.
   */
  lastPumpSeq: number;
  lastPumpLateMs: number | null;
  lastPumpCtDeltaMs: number | null;
  /**
   * Đợt 98 Z2: strip pixels + kích thước của snapshot vừa capture gần
   * nhất (xem sampleStripeStrip — đặt trong rvfcCaptureFrame ngay sau
   * drawImage; cầu nối để closure pumpEvent ghi `pix`/`pixW`/`pixH`).
   * null/-1 = chưa capture lần nào kể từ khi pump tạo/khởi động lại.
   */
  lastPixStrip: string | null;
  lastPixW: number;
  lastPixH: number;
  /** false = pump đã chết, callback không đăng ký lại nữa. */
  active: boolean;
  /** true = còn 1 callback rVFC đang chờ bắn. */
  pending: boolean;
  /** Handle rVFC gần nhất (để cancel khi đổi element). */
  handle: number;
}
const rvfcPumps = new Map<string, RvfcPumpState>();
/** Clip đã fallback rVFC → đường tick (dính trong phiên, không thử lại). */
const rvfcDeadClips = new Set<string>();
/**
 * Đợt 94 V4 — phát hiện runtime "rVFC im lặng" + memo engine.
 * Bối cảnh: requestVideoFrameCallback không bao giờ bắn trên WebKitGTK
 * (đo lại đợt 94 V4: 0 callback / 4 chuỗi, video phát sạch 74 frame trình
 * chiếu; Chromium cùng trang 281+139). Watchdog cũ (3 miss × 500ms) để
 * lại cửa sổ mù ~2–3s/clip đo thật — trong đó ring rỗng, motion blur tắt.
 * - rvfcCallbacksSeen: số callback rVFC đã bắn trong phiên (mọi quyết
 *   định, kể cả duplicate/skip) — bộ đếm toàn cục để memo không arm oan.
 * - rvfcSilentKills: số clip chết vì "no-callback" khi chưa thấy callback
 *   nào trong phiên; đủ 2 thì rvfcSilentEngine = true (không tạo pump nữa,
 *   đường tick nuôi snapshot từ tick đầu tiên).
 */
let rvfcCallbacksSeen = 0;
let rvfcSilentKills = 0;
let rvfcSilentEngine = false;
/** Fast-path: pump im lặng bao lâu (ms) thì kill ngay, không chờ 3 miss. */
const RVFC_SILENT_FAST_MS = 1000;
/** Số clip chết vì no-callback (0 callback cả phiên) thì memo engine. */
const RVFC_SILENT_KILLS_TO_MEMOIZE = 2;
/** Trạng thái watchdog theo clip (xem rvfcSnapshotOwner). */
interface RvfcWatchdogState {
  lastFrameIdx: number;
  lastCaptures: number;
  misses: number;
  sinceMs: number;
  /**
   * Đợt 92 T2: mốc performance.now() của lần capture gần nhất được quan
   * sát (hoặc lúc miss gần nhất được đếm) — dùng để đếm miss theo THỜI
   * GIAN thay vì theo tick (xem rvfcWatchdogMiss).
   */
  lastCaptureMs: number;
  /**
   * Đợt 97 Y5: currentTime (giây) của element ở tick watchdog gần nhất
   * + mốc performance.now() khi element bắt đầu đóng băng (frameIdx và
   * currentTime đều không tiến trong khi transport đang phát;
   * 0 = không đóng băng) — để kill theo thời gian cả khi frame không
   * tiến (nợ mở đợt 96 §4 mục 6: wk-blur-r5 c1 đóng băng ở ph=3,033
   * ~1,6 s chặn điều kiện frame-advance của fast-path nên pump không
   * chết, tick không tiếp quản; lastCurrentTime=-1 = chưa quan sát).
   */
  lastCurrentTime: number;
  frozenSinceMs: number;
}
const rvfcWatchdogState = new Map<string, RvfcWatchdogState>();

function rvfcDebugState(clipId: string): MotionBlurDebugState {
  exposeMotionBlurDebug();
  const dbg = motionBlurDebugState.get(clipId) ?? {
    ring: 0, lastFrame: -1, skippedDuplicate: 0, ringClears: 0,
    rvfcActive: false, rvfcCaptures: 0, rvfcSkippedDuplicate: 0, rvfcFallback: "",
    prevFrame: -1, lastDrawnFrameIdx: -1, lastDrawnLastFrame: -1, lastDrawnPrevFrame: -1,
    lastDrawnPresentedFrame: -1, lastDrawnRingSize: -1, lastDrawnSkippedLatest: -1, lastDrawnPaddedGhosts: -1,
  };
  motionBlurDebugState.set(clipId, dbg);
  return dbg;
}

function rvfcKillPump(clipId: string, reason: string): void {
  const pump = rvfcPumps.get(clipId);
  if (pump) {
    pump.active = false;
    if (pump.pending) {
      try {
        pump.el.cancelVideoFrameCallback?.(pump.handle);
      } catch { /* element đã chết — bỏ qua */ }
      pump.pending = false;
    }
  }
  rvfcDeadClips.add(clipId);
  // Đợt 94 V4 — memo engine im lặng: 1 lần kill "no-callback" khi cả phiên
  // chưa thấy callback rVFC nào là bằng chứng engine im lặng (WebKitGTK);
  // 2 clip khác nhau đều chết như vậy thì khóa pump cho cả phiên (đường
  // tick nuôi snapshot từ tick đầu). Ngưỡng 2 clip để 1 lần kill oan trên
  // Chromium dưới tải cực đoan (main thread kẹt >1s) không tắt rVFC cả phiên.
  // Đợt 97 Y5: kill "no-callback-frozen" (element đóng băng, xem
  // rvfcWatchdogMiss) đếm như "no-callback" — cùng bằng chứng 0 callback
  // trong khi transport đang phát, chỉ khác là frame không tiến.
  if ((reason === "no-callback" || reason === "no-callback-frozen") && rvfcCallbacksSeen === 0) {
    rvfcSilentKills++;
    if (rvfcSilentKills >= RVFC_SILENT_KILLS_TO_MEMOIZE) {
      rvfcSilentEngine = true;
      if (typeof window !== "undefined") {
        (window as unknown as { __vcutRvfcSilentEngine?: boolean }).__vcutRvfcSilentEngine = true;
      }
    }
  }
  const dbg = motionBlurDebugState.get(clipId);
  if (dbg) {
    dbg.rvfcActive = false;
    if (!dbg.rvfcFallback) dbg.rvfcFallback = reason;
  }
}

/**
 * Đợt 102 D3 — kill ĐỒNG BỘ pump rVFC khi playhead nhảy ra khỏi cửa sổ
 * clip (nợ C5 §5: khe early-return đã quan sát được qua seek-across).
 *
 * Vấn đề (C5 §1.2): cú seek nhảy playhead qua biên GIỮA hai tick — ngay
 * sau cú nhảy playhead đã ở ngoài cửa sổ clip cũ nhưng chưa tick nào chạy
 * syncMedia/draw nên owner-kill (rvfcNoteVideoElementOwner) chưa có cơ hội
 * chạy; callback rVFC của pump cũ bắn trong khoảng trống đó (đo được
 * 23–123 ms sau cú nhảy, 24/24 biên seek-across) và chỉ check A6 trong
 * rvfcCallback mới kill nó — tức khe vẫn mở cho tới callback đầu tiên.
 *
 * Fix: kill NGAY trong subscriber setPlayhead (xem useStore.subscribe ở
 * effect preview — Zustand subscriber chạy đồng bộ trong set(), trước khi
 * bất kỳ callback rVFC nào kịp bắn vì JS đơn luồng). Vị ngữ y hệt check
 * A6 (isPlayheadOutsideClipWindow) nên 2 đường không lệch nhau; thứ tự
 * kill y hệt đường A6 (rvfcKillPump + xoá khỏi map + hồi dead nếu chưa
 * chết vì lý do khác — seek về lại vẫn tạo pump mới được).
 * Tác dụng phụ: phát tick-by-tick cũng được hưởng — tick gọi setPlayhead
 * vượt biên rồi mới early-return trước draw thì pump cũng đã chết đồng
 * bộ (khe hẹp B5/C5 chưa quan sát được cũng đóng theo, cùng vị ngữ).
 * Không kill khi chồng lấn/PiP: pump sống iff playhead nằm trong cửa sổ
 * CỦA NÓ (mỗi pump xét cửa sổ riêng), giống hệt check A6.
 * Trả về số pump đã kill (0 khi không có pump nào ngoài cửa sổ — đường
 * nóng mỗi tick nên chỉ lặp map khi map không rỗng). Đếm dồn lên
 * window.__vcut102d3SeekKills để harness đọc nhanh (mirror
 * __vcutRvfcSilentEngine).
 */
function rvfcKillPumpsOutsidePlayhead(playhead: number): number {
  if (rvfcPumps.size === 0 || !Number.isFinite(playhead)) return 0;
  let killed = 0;
  // Đợt 103 E4 — clipId các pump vừa kill, để ghi timestamp kill trực tiếp
  // (xem khối ghi window bên dưới).
  const killedClipIds103E4: string[] = [];
  for (const [clipId, pump] of rvfcPumps) {
    if (!pump.active || pump.clipDuration <= 0) continue;
    if (!isPlayheadOutsideClipWindow(playhead, pump.clipStart, pump.clipDuration)) continue;
    const wasDead = rvfcDeadClips.has(clipId);
    rvfcKillPump(clipId, "seek-inactive");
    rvfcPumps.delete(clipId);
    if (!wasDead) rvfcDeadClips.delete(clipId);
    killed++;
    killedClipIds103E4.push(clipId);
  }
  if (killed > 0 && typeof window !== "undefined") {
    const w = window as unknown as { __vcut102d3SeekKills?: unknown };
    w.__vcut102d3SeekKills = (typeof w.__vcut102d3SeekKills === "number" ? w.__vcut102d3SeekKills : 0) + killed;
    // Đợt 103 E4 — ghi timestamp kill TRỰC TIẾP (nợ LIMITS gộp đợt 102 §4
    // mục 4: độ trễ owner-kill trước đây chỉ đo gián tiếp qua check A6,
    // 23–123 ms): performance.now() tại điểm kill đồng bộ trong subscriber
    // setPlayhead, cùng đồng hồ với timestamp seek của probe (ghi ngay
    // trước setPlayhead) nên killTs − seekTs là độ trễ kill trực tiếp.
    // Chỉ đo, không đổi hành vi: mảng vòng đệm 200 mục (1 mục / pump bị
    // kill, kèm playhead lúc kill để probe đối chiếu đúng biên seek).
    const w4 = window as unknown as { __vcut103e4SeekKills?: { t: number; clipId: string; ph: number }[] };
    const killLog103E4 = w4.__vcut103e4SeekKills ?? [];
    const killTs103E4 = performance.now();
    for (const clipId of killedClipIds103E4) {
      killLog103E4.push({ t: killTs103E4, clipId, ph: playhead });
    }
    while (killLog103E4.length > 200) killLog103E4.shift();
    w4.__vcut103e4SeekKills = killLog103E4;
  }
  return killed;
}

/**
 * Capture 1 frame trình chiếu vào ring (chạy trong callback rVFC).
 * mediaTime = metadata.mediaTime của frame vừa trình chiếu (fallback
 * el.currentTime khi metadata thiếu). Trả về quyết định: "capture" /
 * "reset-capture" khi đã capture, "duplicate" khi trùng frame trước,
 * "skip" khi chưa capture được (pump chết / chưa có dữ liệu / không có
 * context 2d). Đợt 93 U1: đổi từ boolean sang decision string để
 * harness phân rã callback (caller duy nhất là rvfcCallback).
 */
/**
 * Đợt 98 Z2 — chẩn đoán residual ghost 13,8% (đợt 97 Y2 §3.10/§5.1a):
 * đọc strip pixels thật của 1 canvas snapshot / frame hiện tại (48 mẫu
 * kênh G trên hàng giữa, từ x = 20% w — sọc cuộn ngang nên hàng ngang
 * mang pha sọc; kênh G là kênh __p3measure dùng tính gStd). Trả base64
 * của 48 byte G; null khi không đọc được. Tọa độ tương đối nên dùng
 * được cả 2 mode snapshot: "unit" (512×360, video letterbox y∈[36,324))
 * và "letterbox" (dw×dh). 1 getImageData 48×1 mỗi lần gọi (~chục µs),
 * chỉ đo, không đổi hành vi vẽ. Đối chiếu offline với frame nguồn giải
 * mã bằng ffmpeg: strip khớp frame nào thì nội dung pixels là frame đó.
 */
function sampleStripeStrip(cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null): string | null {
  try {
    if (!ctx || cv.width < 64 || cv.height < 4) return null;
    const y = Math.floor(cv.height / 2);
    const x0 = Math.floor(cv.width * 0.2);
    const n = 48;
    const d = ctx.getImageData(x0, y, n, 1).data;
    const chars = new Array<string>(n);
    for (let i = 0; i < n; i++) chars[i] = String.fromCharCode(d[i * 4 + 1]);
    return btoa(chars.join(""));
  } catch {
    return null;
  }
}

function rvfcCaptureFrame(pump: RvfcPumpState, mediaTime: number): string {
  if (!pump.active || typeof document === "undefined") return "skip";
  if (pump.el.readyState < 2) return "skip"; // chưa có dữ liệu — không đẩy canvas trống
  const frameIndex = videoFrameIndex(mediaTime, pump.fps);
  const last = motionBlurLastFrameIndex.get(pump.clipId);
  const decision = rvfcFrameDecision(last ?? -1, frameIndex);
  const dbg = rvfcDebugState(pump.clipId);
  if (decision === "duplicate") {
    dbg.rvfcSkippedDuplicate++;
    return "duplicate";
  }
  if (decision === "reset-capture") {
    const arr = motionBlurSnapshots.get(pump.clipId);
    if (arr) arr.length = 0;
    dbg.ringClears++;
  }
  // Đợt 104 F3 (104f3): relabel snapshot đường pump bằng anchor tươi (F8;
  // nấc rawAnchor F8b đã bỏ ở đợt 105 G1) — quyết định duplicate/reset ở
  // trên vẫn dùng frameIndex thật;
  // chỉ NHÃN ghi vào ring là frame relabel. Khi tap tắt, relabel = identity.
  const relabel104f3 = f3RelabelFrameIndex(pump.clipId, frameIndex);
  motionBlurLastFrameIndex.set(pump.clipId, relabel104f3.frame);
  let arr = motionBlurSnapshots.get(pump.clipId);
  if (!arr) {
    if (motionBlurSnapshots.size >= MOTION_BLUR_MAX_CLIPS) {
      const oldest = motionBlurSnapshots.keys().next().value;
      if (oldest !== undefined) motionBlurSnapshots.delete(oldest);
    }
    arr = [];
    motionBlurSnapshots.set(pump.clipId, arr);
  }
  while (arr.length > pump.maxGhosts) arr.shift();
  let snap: HTMLCanvasElement;
  if (arr.length >= pump.maxGhosts) {
    snap = arr.shift()!;
  } else {
    snap = document.createElement("canvas");
  }
  const w = pump.mode === "letterbox" ? Math.max(2, Math.round(pump.dw)) : Math.max(2, Math.round(pump.W * pump.s));
  const h = pump.mode === "letterbox" ? Math.max(2, Math.round(pump.dh)) : Math.max(2, Math.round(pump.H * pump.s));
  if (snap.width !== w || snap.height !== h) {
    snap.width = w;
    snap.height = h;
  }
  const sctx = snap.getContext("2d");
  if (!sctx) return "skip";
  // Đợt 92 T2: đo chi phí capture rVFC (drawImage video → snapshot) —
  // callback chạy trên main thread nên cũng chiếm tick; ghi vào
  // __vcutRvfcCost cho harness đối chiếu với tỉ lệ capture.
  const capT0 = performance.now();
  sctx.clearRect(0, 0, w, h);
  if (pump.mode === "letterbox") {
    sctx.drawImage(pump.el, 0, 0, w, h);
  } else {
    sctx.drawImage(pump.el, pump.dx * pump.s, pump.dy * pump.s, pump.dw * pump.s, pump.dh * pump.s);
  }
  recordRvfcCaptureCost({ ms: performance.now() - capT0, frameIdx: frameIndex, wallMs: performance.now() });
  // Đợt 98 Z2: đọc strip pixels của snapshot VỪA capture (ngay sau
  // drawImage, cùng tick — strip chính là pixels snapshot giữ).
  pump.lastPixStrip = sampleStripeStrip(snap, sctx);
  pump.lastPixW = snap.width;
  pump.lastPixH = snap.height;
  // Đợt 99 A2: expose ring snapshot — gắn strip vừa đọc lên canvas
  // snapshot (dùng lại strip đã đọc, không getImageData lần 2).
  recordMotionBlurSnapshotPix(snap, sctx, relabel104f3.frame, pump.lastPixStrip, undefined, relabel104f3.labelSrc);
  arr.push(snap);
  dbg.ring = arr.length;
  // Đợt 92 T2: prevFrame = snapshot kế trước snapshot mới này (-1 khi
  // reset-capture vừa xoá ring, hoặc snapshot đầu tiên).
  dbg.prevFrame = decision === "reset-capture" ? -1 : (last ?? -1);
  dbg.lastFrame = relabel104f3.frame;
  dbg.rvfcCaptures++;
  dbg.rvfcActive = true;
  return decision;
}

function rvfcCallback(pump: RvfcPumpState, _now: number, metadata: VideoFrameCallbackMetadata): void {
  pump.pending = false;
  // Đợt 94 V4: callback bắn (dù quyết định gì) là bằng chứng engine còn
  // sống — cập nhật mốc im lặng của pump + bộ đếm toàn cục cho memo.
  pump.lastCallbackMs = performance.now();
  rvfcCallbacksSeen++;
  // Đợt 93 U1: ghi 1 event pump cho MỖI lần callback bắn (kể cả
  // duplicate/skip/stale/error) để phân rã scheduling vs capture.
  const tInvoke = performance.now();
  const seq = rvfcPumpSeq++;
  const md = metadata as unknown as
    | { presentedFrames?: unknown; mediaTime?: unknown; expectedDisplayTime?: unknown; captureTime?: unknown }
    | null
    | undefined;
  const numOrNull = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const metaMediaTime = numOrNull(md?.mediaTime);
  const mediaTime = metaMediaTime ?? pump.el.currentTime;
  const frameIdx = videoFrameIndex(mediaTime, pump.fps);
  // Đợt 97 Y2: chẩn đoán cụm double-count 84 (nợ mở #2 đợt 96) — các
  // trường ghi thêm vào pump event, tính TRƯỚC khi cập nhật lastPresented
  // dưới đây (xem RvfcPumpSample): presentedAtInvoke là niềm tin của
  // blend logic NGAY TRƯỚC callback này; sau cập nhật nó thành frame
  // của chính callback này nên mất ý nghĩa chẩn đoán. ctAtInvoke đọc 1
  // lần ở đầu callback (guard freshness dưới đọc currentTime riêng sau
  // khi đăng ký lại — không dùng chung để khỏi đổi hành vi guard).
  const ctAtInvoke = pump.el.currentTime;
  const ctFrameIdx = videoFrameIndex(ctAtInvoke, pump.fps);
  const expectedDisplayTime = numOrNull(md?.expectedDisplayTime);
  const lateMs = expectedDisplayTime !== null ? tInvoke - expectedDisplayTime : null;
  const presentedAtInvoke = presentedFrameIndex(pump.clipId, frameIdx);
  // Đợt 96 X2: ghi frame trình chiếu + thời điểm trình chiếu dự kiến của
  // callback này — nguồn cho presentedFrameIndex ở bước blend (quyết
  // định ghost có trùng frame hiện tại không). Ghi ở MỌI callback bắn,
  // kể cả duplicate/skip/stale (frame đó vẫn đã trình chiếu); ghi TRƯỚC
  // các early-return dưới để callback stray cũng không làm mất mốc.
  pump.lastPresentedFrameIdx = frameIdx;
  pump.lastExpectedDisplayTime = expectedDisplayTime;
  // Đợt 93 U1: chênh currentTime - mediaTime lúc callback chạy (ms) —
  // đo độ trễ callback so với frame trình chiếu (xem guard dưới).
  let ctDeltaMs: number | null = null;
  const pumpEvent = (decision: string, capMs: number | null, tCapEnd: number | null, tReregister: number | null): void => {
    // Đợt 97 Y2: cập nhật tóm tắt pump event gần nhất của clip (cầu nối
    // cho blend-tick log) + ghi nhãn ring lúc ghi event (đọc live — sau
    // capture thì debug state đã cập nhật, khi skip thì là ring hiện tại).
    pump.lastPumpSeq = seq;
    pump.lastPumpLateMs = lateMs;
    pump.lastPumpCtDeltaMs = ctDeltaMs;
    const dbgRing = motionBlurDebugState.get(pump.clipId);
    recordRvfcPump({
      seq, tInvoke, nowArg: _now,
      presentedFrames: numOrNull(md?.presentedFrames),
      mediaTime: metaMediaTime, expectedDisplayTime,
      captureTime: numOrNull(md?.captureTime),
      frameIdx, decision, capMs, tCapEnd, tReregister, ctDeltaMs,
      ctAtInvoke, ctFrameIdx, lateMs, presentedAtInvoke,
      ringSize: dbgRing?.ring ?? -1,
      ringLast: dbgRing?.lastFrame ?? -1,
      ringPrev: dbgRing?.prevFrame ?? -1,
      // Đợt 98 Z2: strip pixels snapshot vừa capture — chỉ khi lần này
      // thật sự capture (không thì null; strip cũ không được gán nhầm).
      pix: decision === "capture" || decision === "reset-capture" ? pump.lastPixStrip : null,
      pixW: decision === "capture" || decision === "reset-capture" ? pump.lastPixW : -1,
      pixH: decision === "capture" || decision === "reset-capture" ? pump.lastPixH : -1,
    });
  };
  if (!pump.active) {
    pumpEvent("skip-inactive", null, null, null);
    return;
  }
  try {
    // Stale: draw path không khẳng định pump > 1.5s (clip dừng phát /
    // hết blur / hold dài) → dừng, không đăng ký lại. Draw path sẽ
    // khẳng định lại (tạo pump mới) khi clip phát lại với blur.
    if (performance.now() - pump.lastWantedMs > 1500) {
      pump.active = false;
      pumpEvent("skip-stale", null, null, null);
      return;
    }
    // Đợt 99 A6 — clip-active: playhead (store, giá trị tick gần nhất)
    // đã ra khỏi cửa sổ timeline của clip này → clip không còn active,
    // capture lúc này chỉ có thể là zombie/straggler sau biên (kill
    // draw-path bị trễ 1 tick: tick vượt biên nhưng syncMedia/draw
    // không chạy — early-return/idle — nên pump chưa bị kill). Kill
    // pump theo đúng mẫu zombie (rvfcKillPump + xoá khỏi map + hồi dead
    // nếu chưa chết vì lý do khác — xem rvfcKillZombiePumpsOnElement)
    // để phát lại/seek về vẫn tạo pump mới được; không đăng ký lại.
    // Vì sao check này KHÔNG chặn được straggler "khe giữa 2 tick"
    // (Z6 §4): callback đó bắn TRƯỚC tick vượt biên nên playhead
    // trong store vẫn nằm trong cửa sổ — nó là capture tiền-biên hợp
    // lệ (frame cuối clip cũ, chính chủ), state100 zombie Δ = 0 đã
    // chứng minh; check này chỉ chặn callback bắn SAU tick vượt biên
    // mà kill draw-path chưa kịp chạy. Hook test
    // window.__vcut99a6DisableClipActiveCheck = true tắt check để đo
    // đối chứng (mirror __vcutDisableRvfc).
    // Guard: duration <= 0 (chưa ghi nhận cửa sổ) hoặc playhead không
    // hữu hạn → bỏ qua, không kill oan. Cửa sổ nửa mở [start,
    // start+duration) khớp điều kiện draw của drawVideoClip: t đúng
    // bằng biên là clip đã hết active.
    const clipCheckOff99a6 =
      typeof window !== "undefined" &&
      (window as unknown as { __vcut99a6DisableClipActiveCheck?: unknown }).__vcut99a6DisableClipActiveCheck === true;
    if (!clipCheckOff99a6 && pump.clipDuration > 0) {
      const ph99a6 = useStore.getState().playhead;
      // Đợt 102 D3: vị ngữ dùng chung với kill đồng bộ khi playhead nhảy
      // (rvfcKillPumpsOutsidePlayhead) — 2 đường không lệch nhau.
      if (isPlayheadOutsideClipWindow(ph99a6, pump.clipStart, pump.clipDuration)) {
        const wasDead99a6 = rvfcDeadClips.has(pump.clipId);
        rvfcKillPump(pump.clipId, "clip-inactive");
        rvfcPumps.delete(pump.clipId);
        if (!wasDead99a6) rvfcDeadClips.delete(pump.clipId);
        pumpEvent("skip-clip-inactive", null, null, null);
        return;
      }
    }
    // Đợt 93 U1 — ĐĂNG KÝ LẠI TRƯỚC KHI CAPTURE (register-first):
    // bản cũ đăng ký lại SAU drawImage (~8–32ms, có lúc 60–90ms khi
    // main thread bị chiếm CPU): frame trình chiếu trong lúc capture
    // không có callback nào đăng ký nên mất hẳn (presentedFrames nhảy
    // 2–4, schedLatency med 52–87ms — xem LIMITS U1 §3). Đăng ký
    // trước thì frame kế vẫn có callback chờ sẵn; callback đó chạy
    // sau khi capture xong (cùng main thread, xếp hàng) và vẫn vẽ
    // đúng frame nếu element chưa chuyển frame — freshness guard dưới
    // chặn trường hợp đã chuyển (không đẩy snapshot gán sai nhãn).
    // Stale-check ở trên chạy TRƯỚC khi đăng ký lại để pump chết vẫn
    // dừng hẳn, không đăng ký ma.
    // Hook test window.__vcutRvfcRegisterFirst = false → về thứ tự cũ
    // (đăng ký sau capture) để đo A/B (mirror __vcutDisableRvfc).
    const registerFirst =
      typeof window === "undefined" ||
      (window as unknown as { __vcutRvfcRegisterFirst?: unknown }).__vcutRvfcRegisterFirst !== false;
    let tReregister: number | null = null;
    if (registerFirst && typeof pump.el.requestVideoFrameCallback === "function") {
      pump.handle = pump.el.requestVideoFrameCallback((n, m) => rvfcCallback(pump, n, m));
      pump.pending = true;
      tReregister = performance.now();
    }
    // Freshness guard: callback bắn trễ (main thread bận) thì element
    // có thể đã chuyển sang frame mới hơn metadata.mediaTime — vẽ lúc
    // này sẽ gán NHẦM nhãn frame cũ cho pixels frame mới. Bỏ qua lần
    // capture đó (ring giữ đúng, không snapshot sai) khi element đã
    // tiến hơn 1 frame so với metadata. Ngưỡng ĐÚNG là 1/fps: element
    // hiện frame K trong [K/fps, (K+1)/fps) nên currentTime-mediaTime
    // > 1/fps ⟺ element đã sang K+1 (xem LIMITS U1 §7: ngưỡng cũ
    // 1,5/fps cho callback trễ 33–50ms lọt qua → snapshot nhãn K chứa
    // pixels K+1 → cùng cửa sổ blend cho 2 mức gStd 37,5/84,6, spread
    // median 45,5 ở assert A–E). Cộng 0,5ms dung sai nhiễu float/µs;
    // skip nhầm chỉ tạo lỗ (ring thiếu 1 frame, nhãn vẫn đúng) còn
    // capture nhầm thì đầu độc snapshot — thà skip.
    let decision = "capture";
    let capMs: number | null = null;
    let tCapEnd: number | null = null;
    const fps = pump.fps > 0 ? pump.fps : 30;
    ctDeltaMs = (pump.el.currentTime - (metaMediaTime ?? pump.el.currentTime)) * 1000;
    // Đợt 102 D3 — chặn capture stale first-frame của pump MỚI sau seek
    // (nợ C5 §5 mục 1: 2 ca — pump mới trên pooled element capture 1 frame
    // cũ ct 2,43/2,97 trước khi seek về in-point đáp, tự sửa sau 105–369 ms
    // bằng reset-capture). Element đang seeking thì frame trình chiếu là
    // frame tiền-seek, không phải frame của clip này ở playhead hiện tại —
    // skip lần này (đã đăng ký lại ở trên nên callback kế sau khi seek đáp
    // sẽ capture đúng frame; không kill pump, không đụng ring).
    if (pump.el.seeking) {
      decision = "skip-seeking";
    } else if (metaMediaTime !== null && pump.el.currentTime - metaMediaTime > 1 / fps + 0.0005) {
      decision = "skip-stale-frame";
    } else {
      const capT0 = performance.now();
      decision = rvfcCaptureFrame(pump, mediaTime);
      if (decision === "capture" || decision === "reset-capture") {
        capMs = performance.now() - capT0;
        tCapEnd = performance.now();
      }
    }
    // Thứ tự cũ (hook __vcutRvfcRegisterFirst = false): đăng ký lại SAU
    // capture — chỉ dùng để đo A/B, mặc định là register-first ở trên.
    if (!registerFirst && pump.active && typeof pump.el.requestVideoFrameCallback === "function") {
      pump.handle = pump.el.requestVideoFrameCallback((n, m) => rvfcCallback(pump, n, m));
      pump.pending = true;
      tReregister = performance.now();
    }
    pumpEvent(decision, capMs, tCapEnd, tReregister);
  } catch (err) {
    console.error("[preview] rVFC motion blur error, falling back to tick snapshots:", err);
    rvfcKillPump(pump.clipId, "error");
    pumpEvent("error", null, null, null);
    return;
  }
}

/**
 * Đợt 97 Y7 — kill pump zombie khi element đổi chủ (nợ LIMITS gộp đợt 96
 * §4 mục 11 / X5 §6): MediaPool tái dùng cùng element cho clip kế; pump
 * clip cũ không biết clip đã đổi nên capture ~40 frame clip kế vào ring
 * clip cũ cho tới ngưỡng stale 1500ms (chỉ phồng thống kê theo clip —
 * dbgFinal caps/lastFrame — không ảnh hưởng pixel vì ring cũ không còn
 * được vẽ). Khi một clip khẳng định pump trên element E, mọi pump khác
 * đang bám E đều là zombie (một element chỉ phát 1 clip tại 1 thời
 * điểm) → kill ngay (huỷ callback đang chờ qua rvfcKillPump), xoá khỏi
 * map; xoá khỏi rvfcDeadClips để clip cũ nếu phát lại vẫn tạo pump mới
 * được (mirror đường element-change trong ensureRvfcPump) — trừ khi clip
 * đó đã chết vì lý do khác trước đó (wasDead: giữ nguyên dead để không
 * hồi sinh pump từng bị watchdog kill). Chỉ kill pump KHÁC clipId, và
 * bỏ qua pump đã chết sẵn (tránh ghi đè dead). Không chạy khi clip kế
 * không blur (không gọi ensureRvfcPump) — trường hợp đó pump cũ vẫn
 * zombie tới stale như cũ (nợ còn lại, xem LIMITS Y7 §5).
 */
function rvfcKillZombiePumpsOnElement(el: HTMLVideoElement, exceptClipId: string): void {
  for (const [clipId, other] of rvfcPumps) {
    if (clipId === exceptClipId || other.el !== el || !other.active) continue;
    const wasDead = rvfcDeadClips.has(clipId);
    rvfcKillPump(clipId, "clip-change");
    rvfcPumps.delete(clipId);
    if (!wasDead) rvfcDeadClips.delete(clipId);
  }
}

/**
 * Đợt 98 Z6 — chủ sở hữu hiện tại của element video (clip nào vẽ/sync
 * nó gần nhất) + cửa sổ thời gian của clip đó. MediaPool cấp 1 element
 * cho mỗi media item nên 2 clip timeline cùng file CHIA element: pump
 * key theo clip.id, element đổi chủ khi clip đổi. Ghi ở MỌI lần draw/
 * sync (không chỉ khi có blur) để hook kill ở drawVideoClip/syncMedia
 * biết clip cũ đã hết active hay chưa — tránh kill oan khi 2 clip cùng
 * item còn chồng lấn thời gian (PiP/overlap: cả hai đều active ở t).
 * WeakMap: element bị drop khỏi pool thì entry tự mất, không rò.
 */
const rvfcElementOwner = new WeakMap<
  HTMLVideoElement,
  { clipId: string; start: number; duration: number }
>();

/**
 * Đợt 98 Z6 — kill pump zombie khi element đổi chủ, KHÔNG chờ
 * ensureRvfcPump (nợ Y7 §5 mục 1: clip kế không blur không gọi
 * ensureRvfcPump nên pump cũ zombie tới stale 1500 ms). Gọi ở đầu
 * drawVideoClip (ngay sau pool.videoFor — trước cả quyết định
 * draw/hold/skip, nên kill bắn ngay tick đầu clip mới dù tick đó hold
 * vì element đang seek) và ở syncMedia (ngay sau collectActives — bắn
 * cả khi tick đó bỏ render vì clip đang seeking, 86N3).
 * Chỉ kill khi chủ cũ KHÁC clip này VÀ chủ cũ không còn active ở t
 * (t ngoài [start, start+duration)): chồng lấn/PiP thì cả hai clip
 * đều active nên không kill (pump của clip còn vẽ được giữ nguyên).
 * Kill dùng đúng helper Y7 (rvfcKillZombiePumpsOnElement — lý do
 * "clip-change", xoá khỏi map + hồi dead nếu chưa chết vì lý do khác).
 * Không kill khi chủ chưa đổi (cùng clip vẽ/sync lại) — chỉ ghi nhận.
 */
function rvfcNoteVideoElementOwner(
  el: HTMLVideoElement,
  clipId: string,
  t: number,
  clipStart: number,
  clipDuration: number,
): void {
  const prev = rvfcElementOwner.get(el);
  rvfcElementOwner.set(el, { clipId, start: clipStart, duration: clipDuration });
  if (!prev || prev.clipId === clipId) return;
  if (t >= prev.start && t < prev.start + prev.duration) return; // chủ cũ còn active (chồng lấn/PiP) — không kill
  // Đợt 99 A6 — hook test: window.__vcut99a6DisableOwnerKill = true thì
  // chỉ ghi nhận chủ, không kill (mô phỏng kill draw-path bị trễ/mất để
  // đo giá trị của check clip-active trong rvfcCallback). Mặc định tắt,
  // không ảnh hưởng production.
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __vcut99a6DisableOwnerKill?: unknown }).__vcut99a6DisableOwnerKill === true
  ) return;
  rvfcKillZombiePumpsOnElement(el, clipId);
  // Đợt 104 F3 (104f3): tap của clip cũ cũng bám element này thì kill cùng
  // (mirror pump — tap không tự biết element đã đổi chủ).
  f3KillTapsOnElement104f3(el, clipId);
}

/**
 * Khẳng định pump cho clip ở tick này (gọi từ drawVideoClip khi clip
 * đang phát xuôi + có blur + snapshot thô dùng được). Trả về true khi
 * pump sống sau lời gọi — draw path sẽ để pump sở hữu snapshot (bỏ qua
 * updateMotionBlurSnapshots ở tick đó). Trả về false khi không dùng
 * được rVFC (không hỗ trợ / clip đã fallback / element khác) — draw
 * path giữ đường tick như cũ.
 * Pump mới tạo thì xoá ring (tránh trộn snapshot tick cũ với snapshot
 * thô mới) và reset lastFrame để frame trình chiếu đầu tiên luôn được
 * capture.
 */
function ensureRvfcPump(opts: {
  clipId: string;
  el: HTMLVideoElement;
  fps: number;
  maxGhosts: number;
  mode: "letterbox" | "unit";
  W: number;
  H: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  s: number;
  /** Đợt 99 A6 — cửa sổ timeline của clip (giây), cho check clip-active trong rvfcCallback. */
  clipStart: number;
  clipDuration: number;
  /** Đợt 102 D3 (bổ sung) — thời gian media element PHẢI ở tại tick này
   * (rampSourceTimeAt(clip, t) ở call site), cho gate hoãn tạo pump khi
   * element chưa định vị (xem shouldDeferRvfcPumpCreation). */
  expectedMediaTime: number;
}): boolean {
  // Đợt 91 S1: hook test — window.__vcutDisableRvfc = true tắt pump để
  // harness đo baseline đường tick cũ (so sánh spread gStd rVFC vs
  // tick trên cùng build). Không ảnh hưởng production khi không đặt.
  if (typeof window !== "undefined" && (window as unknown as { __vcutDisableRvfc?: unknown }).__vcutDisableRvfc === true) return false;
  if (!rvfcSupported(opts.el) || rvfcDeadClips.has(opts.clipId)) return false;
  // Đợt 94 V4: engine đã chứng minh im lặng (2 clip chết vì no-callback,
  // cả phiên chưa thấy callback nào) — không tạo pump nữa, đường tick nuôi
  // snapshot từ tick đầu tiên (không còn cửa sổ mù).
  if (rvfcSilentEngine) return false;
  // Đợt 97 Y7: element vừa đổi chủ sang clip này — kill pump zombie của
  // clip cũ còn bám element (xem rvfcKillZombiePumpsOnElement).
  rvfcKillZombiePumpsOnElement(opts.el, opts.clipId);
  const now = performance.now();
  const existing = rvfcPumps.get(opts.clipId);
  if (existing && existing.el !== opts.el) {
    // Element đổi (MediaPool tái dùng element cho clip khác) — huỷ pump cũ.
    rvfcKillPump(opts.clipId, "");
    rvfcDeadClips.delete(opts.clipId);
    rvfcPumps.delete(opts.clipId);
  }
  let pump = rvfcPumps.get(opts.clipId);
  // Đợt 102 D3 (bổ sung sau đo d3x2) — hoãn tạo/khởi động lại pump khi
  // element chưa định vị: lệch target hơn ngưỡng re-seek (0,35 s) mà chưa
  // có seek nào bay (seek xuôi cần 2 tick xác nhận drift nên tick đầu
  // sau cú nhảy chưa phát seek — callback đầu của pump tạo ở tick đó sẽ
  // capture frame cũ trước khi seek kịp bay, guard `seeking` không chặn
  // được vì seeking=false; đo được 1 ca d3x2, tự sửa sau 305 ms bằng
  // reset-capture). Trả false để đường tick vẽ frame này như cũ; tick sau
  // seek đã bay (seeking=true) hoặc drift đã nhỏ thì tạo pump bình thường.
  // Chỉ áp khi pump chưa có hoặc đã chết (khởi động lại) — pump đang sống
  // không bị ảnh hưởng.
  if ((!pump || !pump.active) && shouldDeferRvfcPumpCreation(opts.el.currentTime, opts.expectedMediaTime, opts.el.seeking, FORWARD_RESEEK_THRESHOLD_S)) {
    return false;
  }
  if (!pump) {
    pump = {
      clipId: opts.clipId,
      el: opts.el,
      fps: opts.fps,
      maxGhosts: opts.maxGhosts,
      mode: opts.mode,
      W: opts.W,
      H: opts.H,
      dx: opts.dx,
      dy: opts.dy,
      dw: opts.dw,
      dh: opts.dh,
      s: opts.s,
      clipStart: opts.clipStart,
      clipDuration: opts.clipDuration,
      lastWantedMs: now,
      createdMs: now,
      lastCallbackMs: now,
      lastPresentedFrameIdx: -1,
      lastExpectedDisplayTime: null,
      // Đợt 97 Y2: chưa có pump event nào (xem RvfcPumpState).
      lastPumpSeq: -1,
      lastPumpLateMs: null,
      lastPumpCtDeltaMs: null,
      // Đợt 98 Z2: chưa capture snapshot nào (xem lastPixStrip).
      lastPixStrip: null,
      lastPixW: -1,
      lastPixH: -1,
      active: true,
      pending: false,
      handle: 0,
    };
    rvfcPumps.set(opts.clipId, pump);
    // Ring mới: xoá snapshot tick cũ (đã nướng cssFilter — trộn với
    // snapshot thô sẽ làm painter áp filter 2 lần ở 1–2 frame).
    const arr = motionBlurSnapshots.get(opts.clipId);
    if (arr) arr.length = 0;
    motionBlurLastFrameIndex.delete(opts.clipId);
    rvfcWatchdogState.delete(opts.clipId);
    const dbg = rvfcDebugState(opts.clipId);
    dbg.rvfcActive = false;
    dbg.rvfcFallback = "";
    pump.handle = opts.el.requestVideoFrameCallback((n, m) => rvfcCallback(pump!, n, m));
    pump.pending = true;
    return true;
  }
  // Cập nhật cấu hình (fps/hình học có thể đổi khi project đổi).
  pump.fps = opts.fps;
  pump.maxGhosts = opts.maxGhosts;
  pump.mode = opts.mode;
  pump.W = opts.W;
  pump.H = opts.H;
  pump.dx = opts.dx;
  pump.dy = opts.dy;
  pump.dw = opts.dw;
  pump.dh = opts.dh;
  pump.s = opts.s;
  pump.clipStart = opts.clipStart;
  pump.clipDuration = opts.clipDuration;
  pump.lastWantedMs = now;
  if (!pump.active) {
    // Pump đã chết (stale/error) nhưng chưa vào danh sách dead (stale)
    // — khởi động lại chuỗi callback.
    pump.active = true;
    pump.createdMs = now;
    pump.lastCallbackMs = now;
    // Đợt 96 X2: thông tin trình chiếu cũ không còn đúng sau khi pump
    // chết — reset để presentedFrameIndex rơi về frameIdx cho tới khi
    // callback mới bắn.
    pump.lastPresentedFrameIdx = -1;
    pump.lastExpectedDisplayTime = null;
    // Đợt 97 Y2: tóm tắt pump event cũ cũng không còn đúng sau khi pump
    // chết — reset để blend-tick log không nối nhầm sang event của pump cũ.
    pump.lastPumpSeq = -1;
    pump.lastPumpLateMs = null;
    pump.lastPumpCtDeltaMs = null;
    rvfcWatchdogState.delete(opts.clipId);
    const dbg = rvfcDebugState(opts.clipId);
    dbg.rvfcFallback = "";
  }
  if (!pump.pending && pump.active) {
    pump.handle = opts.el.requestVideoFrameCallback((n, m) => rvfcCallback(pump!, n, m));
    pump.pending = true;
  }
  return pump.active;
}

/**
 * Watchdog: rVFC được hỗ trợ nhưng callback không bắn (vd trình duyệt
 * không bắn cho element tách DOM) thì ring không bao giờ đầy mà đường
 * tick cũng bị bỏ qua → mất blur âm thầm. Phát hiện: video đã chạy qua
 * ≥ 1 frame mới kể từ tick trước mà số capture không tăng. Ân hạn
 * 500ms sau tạo pump; 3 miss liên tiếp → kill pump + fallback
 * về snapshot theo tick NGAY trong tick này (caller đặt
 * snapshotsViaRvfc = false). Trả về true khi vừa fallback.
 *
 * Đợt 92 T2 — SỬA CÁCH ĐẾM MISS (hồi quy do tick nhanh hơn): bản S1 đếm
 * 1 miss MỖI TICK mà video tiến nhưng chưa có capture. Khi tick còn
 * ~12fps (S1) thì giữa 2 tick thường đã có capture nên miss hiếm; khi
 * tick lên ~30fps (sau khi bỏ mask CPU) thì 2 tick liên tiếp chỉ cách
 * nhau ~33ms — callback rVFC (trung bình ~50ms/capture, gap tới 300ms
 * khi gộp) thường chưa kịp bắn → 3 tick liên tiếp đều miss → watchdog
 * GIẾT OAN pump đang sống (đo được ở assert A–E đợt 92 T2: case D
 * rvfcFallback="no-callback", captures đóng băng ở 349, case E kế thừa
 * trạng thái chết do rvfcDeadClips dính theo clip id). Nay đếm miss
 * theo THỜI GIAN: chỉ đếm tối đa 1 miss mỗi 500ms không-capture (mốc
 * lastCaptureMs), nên cần ≥1.5s hạn hán capture thật sự mới kill —
 * gấp 5× gap capture dài nhất đã quan sát (~300ms), vẫn đủ nhanh để
 * fallback khi pump chết thật (tick path tiếp quản ngay tick đó).
 */
function rvfcWatchdogMiss(clipId: string, frameIdx: number): boolean {
  const dbg = motionBlurDebugState.get(clipId);
  const captures = dbg?.rvfcCaptures ?? 0;
  const now = performance.now();
  const pump = rvfcPumps.get(clipId);
  let wd = rvfcWatchdogState.get(clipId);
  if (!wd) {
    wd = { lastFrameIdx: frameIdx, lastCaptures: captures, misses: 0, sinceMs: now, lastCaptureMs: now, lastCurrentTime: pump ? pump.el.currentTime : -1, frozenSinceMs: 0 };
    rvfcWatchdogState.set(clipId, wd);
    return false;
  }
  const advanced = frameIdx > wd.lastFrameIdx;
  const captured = captures > wd.lastCaptures;
  // Đợt 94 V4 — fast-path "rVFC im lặng": pump sống ≥1000ms mà chưa có
  // callback nào (lastCallbackMs vẫn là lúc tạo pump) trong khi video đã
  // chạy qua frame mới — engine không bắn callback (WebKitGTK), kill ngay
  // thay vì chờ đủ 3 miss × 500ms (đo pre-fix: cửa sổ mù ~2–3s/clip).
  // Điều kiện "frame đã chạy qua" chặn kill oan khi video pause/seek
  // (frameIdx không tiến) và khi decoder chưa có dữ liệu.
  if (pump && now - pump.lastCallbackMs >= RVFC_SILENT_FAST_MS && frameIdx > wd.lastFrameIdx) {
    rvfcKillPump(clipId, "no-callback");
    rvfcWatchdogState.delete(clipId);
    return true;
  }
  // Đợt 97 Y5 — fast-path "element đóng băng": pump im lặng ≥1000ms
  // trong khi frame KHÔNG tiến (nợ mở đợt 96 §4 mục 6: wk-blur-r5 c1
  // ph kẹt 3,033 ~1,6 s, element paused=true trong khi transport vẫn
  // phát — fast-path trên đòi frameIdx tiến nên không bao giờ kill, ring
  // rỗng suốt thời gian đóng băng). Đóng băng = frameIdx không tiến VÀ
  // currentTime không tiến quá nửa khung (500/fps ms) kể từ tick trước —
  // phân biệt với phát chậm (0,1× vẫn tiến ~20ms/tick > nửa khung nên
  // không tính là đóng băng); readyState<2 (chưa có dữ liệu, chưa bắt
  // đầu — không phải đóng băng) thì reset, không tích lũy; có capture
  // mới cũng reset (pump vừa giao frame tươi). KHÔNG guard bằng
  // el.seeking: đo Y5 r6/r7/r8 — seeking=true SUỐT stall đầu clip trên
  // WebKit (~0,6–1,4 s, seek tới đầu clip không hoàn tất trong lúc
  // decoder stall); guard seeking sẽ chặn freeze-kill đúng ca cần cứu
  // (ca r5 kiểu đó). Seek thường hoàn tất <1 s và reset đồng hồ khi ct
  // nhảy/frame tiến; seek stall >1 s với 0 callback CHÍNH LÀ element
  // đóng băng. KHÔNG guard bằng el.paused: element đóng băng CHÍNH LÀ
  // paused trong khi transport phát — guard đó chặn đúng ca cần cứu;
  // kill-while-paused của user không xảy ra vì ghostWeights rỗng lúc
  // pause nên watchdog không được gọi (đợt 62 R3). Snapshot tick của
  // frame đóng băng vẫn đúng pixels nên kill lúc này là an toàn (X5 §2.1).
  const ct = pump ? pump.el.currentTime : NaN;
  const halfFrameMs = 500 / (pump && pump.fps > 0 ? pump.fps : 30);
  const frameFrozen = frameIdx <= wd.lastFrameIdx;
  const ctFrozen =
    Number.isFinite(ct) && wd.lastCurrentTime >= 0 &&
    Math.abs(ct - wd.lastCurrentTime) * 1000 < halfFrameMs;
  if (pump && pump.el.readyState >= 2 && frameFrozen && ctFrozen) {
    if (wd.frozenSinceMs <= 0) wd.frozenSinceMs = now;
  } else {
    wd.frozenSinceMs = 0;
  }
  if (captured) wd.frozenSinceMs = 0;
  if (
    pump && wd.frozenSinceMs > 0 &&
    now - wd.frozenSinceMs >= RVFC_SILENT_FAST_MS &&
    now - pump.lastCallbackMs >= RVFC_SILENT_FAST_MS
  ) {
    rvfcKillPump(clipId, "no-callback-frozen");
    rvfcWatchdogState.delete(clipId);
    return true;
  }
  if (captured) {
    wd.misses = 0;
    wd.lastCaptureMs = now;
  } else if (advanced && now - wd.sinceMs > 500 && now - wd.lastCaptureMs >= 500) {
    // Video vẫn chạy nhưng không có capture nào trong ≥500ms — đếm 1
    // miss; đặt lại mốc để miss sau cách ≥500ms (không đếm theo tick).
    wd.misses++;
    wd.lastCaptureMs = now;
    if (wd.misses >= 3) {
      rvfcKillPump(clipId, "no-callback");
      rvfcWatchdogState.delete(clipId);
      return true;
    }
  }
  wd.lastFrameIdx = frameIdx;
  wd.lastCaptures = captures;
  if (Number.isFinite(ct)) wd.lastCurrentTime = ct; // Đợt 97 Y5
  return false;
}

/**
 * Đợt 96 X2: frame video ĐANG TRÌNH CHIẾU tại thời điểm blend — ước lượng
 * tốt nhất có được đồng bộ trong tick (xem LIMITS đợt 96 X2 §1.3).
 * frameIdx (từ currentTime) KHÔNG đủ: trình chiếu lật sang K+1 trước khi
 * currentTime qua mốc (đợt 95 W4: pha median 0,23–0,32 cho mức 84,6 và
 * 0,62–0,79 cho mức 37,5) nên frameIdx=K trong khi drawImage đã trình
 * chiếu K+1. Nguồn đúng là lịch trình chiếu rVFC: callback gần nhất cho
 * frame F với expectedDisplayTime E (thời điểm F bắt đầu trình chiếu);
 * frame F trình chiếu trong [E, E + 1/fps) nên tại thời điểm now, frame
 * trình chiếu = F + số khung đã trôi qua kể từ E. Công thức tự nhất
 * quán ở cả 2 thứ tự callback/tick trong cùng vsync (xem LIMITS §1.3).
 * Fallback frameIdx khi: không có pump (đường tick — không có metadata
 * trình chiếu), pump chưa có callback nào, hoặc metadata thiếu
 * expectedDisplayTime (WebKitGTK có thể không đưa trường này). playbackRate
 * được tính vào độ dài khung (phát nhanh/chậm); phát ngược/stepping không
 * dùng pump nên luôn rơi về fallback. Sai số: ước lượng lệch tối đa khi
 * now rơi đúng biên lật khung (±vài ms quanh E + k/fps) hoặc footage VFR
 * (độ dài khung ≠ 1/fps) — nhãn này là ước lượng có ghi rõ phương pháp,
 * không phải đo trực tiếp pixels.
 */
/**
 * Đợt 104 F3 — F8b: tap rVFC độc lập + relabel snapshot bằng anchor trình
 * chiếu (khôi phục thiết kế F7/D2 + F8/E3, thêm fallback frame anchor THÔ).
 * - Tap = 1 đăng ký rVFC RIÊNG trên cùng element video, callback CHỈ cập
 *   nhật anchor (lastFrameIdx + lastExpectedDisplayTime + lastCallbackMs),
 *   KHÔNG capture pixels, KHÔNG động ring, KHÔNG động pump. Sống cả khi
 *   pump tắt (__vcutDisableRvfc / rvfcDeadClips) — đúng lúc đường tick cần
 *   anchor; KHÔNG tạo khi rvfcSilentEngine (WebKit) — xem f3TapEnabled.
 * - Ngưỡng tươi 50ms (E3 §3.3: anchor tươi [0,50ms) chính xác 81–88%,
 *   anchor 50–500ms sai 70%+ theo D2 §4).
 * - F8b (ĐÃ BỎ ở đợt 105 G1): khi anchor cũ (>50ms), nhãn = frame callback
 *   gần nhất KHÔNG ngoại suy (rawAnchor) thay vì rơi về frameIdx. Đo 3 run
 *   (B/B2/C-hậu-flip): rawAnchor 70,4% clean (mọi occurrence) ≈ frameIdx
 *   70,0% — giả thuyết BỊ BÁC ở dạng "nâng tập fallback lên gần mức tap"
 *   (tap 97,9%), nhưng rawAnchor KHÔNG tệ hơn frameIdx, chỉ là cách rơi
 *   về khác không tốt hơn. (Đợt 106 H5 đính chính: số "0/30 clean" cũ là
 *   artifact dedup của analyzer distinct, xem LIMITS đợt 105 G1 §3.2;
 *   số E3 "frameIdx 25–27% clean" cũng chịu bias tương tự, không dùng
 *   làm baseline fallback nữa.)
 *   anchor cũ nay rơi về frameIdx như E3.
 * - Mọi code đợt này mang marker 104f3 để revert bằng grep nếu không land.
 */
interface PresentedTapState104f3 {
  clipId: string;
  el: HTMLVideoElement;
  fps: number;
  lastFrameIdx: number;
  lastExpectedDisplayTime: number | null;
  lastCallbackMs: number;
  lastWantedMs: number;
  active: boolean;
  pending: boolean;
  handle: number;
}
const presentedTaps104f3 = new Map<string, PresentedTapState104f3>();
/** Đợt 104 F3 (104f3): tuổi anchor tối đa còn tin để ngoại suy (ms). */
const F3_ANCHOR_FRESH_MS = 50;
/** Đợt 104 F3 (104f3): tap không được khẳng định quá lâu thì dừng đăng ký lại. */
const F3_TAP_STALE_MS = 1500;

function f3TapEnabled(): boolean {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __vcut104f3PresentedTap?: unknown }).__vcut104f3PresentedTap === false
  ) return false;
  if (rvfcSilentEngine) return false;
  return true;
}

function f3RelabelEnabled(): boolean {
  return !(
    typeof window !== "undefined" &&
    (window as unknown as { __vcut104f3Relabel?: unknown }).__vcut104f3Relabel === false
  );
}

function f3KillTap104f3(tap: PresentedTapState104f3): void {
  tap.active = false;
  if (tap.pending) {
    try {
      tap.el.cancelVideoFrameCallback?.(tap.handle);
    } catch { /* element đã chết — bỏ qua */ }
    tap.pending = false;
  }
  presentedTaps104f3.delete(tap.clipId);
}

function f3KillTapsOnElement104f3(el: HTMLVideoElement, exceptClipId: string): void {
  for (const [clipId, tap] of presentedTaps104f3) {
    if (clipId === exceptClipId || tap.el !== el || !tap.active) continue;
    f3KillTap104f3(tap);
  }
}

function presentedTapCallback104f3(
  tap: PresentedTapState104f3,
  _now: number,
  metadata: VideoFrameCallbackMetadata,
): void {
  tap.pending = false;
  const now = performance.now();
  tap.lastCallbackMs = now;
  const md = metadata as unknown as
    | { mediaTime?: unknown; expectedDisplayTime?: unknown }
    | null
    | undefined;
  const numOrNull = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const mediaTime = numOrNull(md?.mediaTime) ?? tap.el.currentTime;
  tap.lastFrameIdx = videoFrameIndex(mediaTime, tap.fps);
  tap.lastExpectedDisplayTime = numOrNull(md?.expectedDisplayTime);
  if (!tap.active) return;
  try {
    if (now - tap.lastWantedMs > F3_TAP_STALE_MS) {
      tap.active = false;
      return;
    }
    if (typeof tap.el.requestVideoFrameCallback === "function") {
      tap.handle = tap.el.requestVideoFrameCallback((n, m) => presentedTapCallback104f3(tap, n, m));
      tap.pending = true;
    }
  } catch {
    tap.active = false;
  }
}

function ensurePresentedTap104f3(clipId: string, el: HTMLVideoElement, fps: number): void {
  if (!f3TapEnabled()) return;
  if (typeof el.requestVideoFrameCallback !== "function") return;
  const now = performance.now();
  let tap = presentedTaps104f3.get(clipId);
  if (tap && tap.el !== el) {
    f3KillTap104f3(tap);
    tap = undefined;
  }
  if (!tap) {
    tap = {
      clipId,
      el,
      fps,
      lastFrameIdx: -1,
      lastExpectedDisplayTime: null,
      lastCallbackMs: now,
      lastWantedMs: now,
      active: true,
      pending: false,
      handle: 0,
    };
    presentedTaps104f3.set(clipId, tap);
    tap.handle = el.requestVideoFrameCallback((n, m) => presentedTapCallback104f3(tap!, n, m));
    tap.pending = true;
    return;
  }
  tap.fps = fps;
  tap.lastWantedMs = now;
  if (!tap.active) {
    tap.active = true;
    tap.lastCallbackMs = now;
    tap.lastFrameIdx = -1;
    tap.lastExpectedDisplayTime = null;
    tap.handle = el.requestVideoFrameCallback((n, m) => presentedTapCallback104f3(tap!, n, m));
    tap.pending = true;
  }
}

/** Đợt 104 F3 (104f3): nguồn anchor của 1 frame trình chiếu. */
export type F3AnchorSrc = "tap" | "pump" | "frameIdx"; // Đợt 105 G1: "rawAnchor" đã bỏ (70,4% ≈ frameIdx 70,0%, không lợi ích; đính chính đợt 106 H5).
export interface F3AnchorInfo {
  frame: number;
  src: F3AnchorSrc;
  ageMs: number | null;
}
export interface F3AnchorCandidate {
  src: "tap" | "pump";
  frame: number;
  expectedDisplayTime: number | null;
  callbackMs: number;
  fps: number;
  rate: number;
}
/**
 * Đợt 104 F3 (104f3): chọn anchor thuần (không DOM — unit test được):
 * - anchor tươi nhất (tuổi ≤50ms, có expectedDisplayTime) trong các ứng
 *   viên → ngoại suy F + số khung trôi qua kể từ E (công thức X2);
 * - không ứng viên nào tươi → frameIdx (nấc rawAnchor F8b đã bỏ ở đợt 105
 *   G1: 70,4% ≈ frameIdx 70,0% mọi occurrence, không lợi ích — đính chính
 *   đợt 106 H5; xem LIMITS đợt 105 G1 §3.2).
 */
export function f3PickAnchor104f3(
  cands: F3AnchorCandidate[],
  nowMs: number,
  frameIdx: number,
): F3AnchorInfo {
  let best: { frame: number; src: "tap" | "pump"; ageMs: number } | null = null;
  for (const c of cands) {
    if (c.frame < 0) continue;
    const age = nowMs - c.callbackMs;
    if (age <= F3_ANCHOR_FRESH_MS && c.expectedDisplayTime !== null && (!best || age < best.ageMs)) {
      const frameDurMs = 1000 / (c.fps > 0 ? c.fps : 30) / (c.rate > 0 ? c.rate : 1);
      const k =
        nowMs >= c.expectedDisplayTime
          ? Math.floor((nowMs - c.expectedDisplayTime) / frameDurMs)
          : 0;
      best = { frame: c.frame + k, src: c.src, ageMs: age };
    }
  }
  if (best) return best;
  return { frame: frameIdx, src: "frameIdx", ageMs: null };
}

function f3AnchorInfo(clipId: string, frameIdx: number): F3AnchorInfo {
  if (!f3TapEnabled()) return { frame: frameIdx, src: "frameIdx", ageMs: null };
  const now = performance.now();
  const cands: F3AnchorCandidate[] = [];
  const tap = presentedTaps104f3.get(clipId);
  if (tap && tap.active) {
    cands.push({
      src: "tap",
      frame: tap.lastFrameIdx,
      expectedDisplayTime: tap.lastExpectedDisplayTime,
      callbackMs: tap.lastCallbackMs,
      fps: tap.fps,
      rate: tap.el.playbackRate > 0 ? tap.el.playbackRate : 1,
    });
  }
  const pump = rvfcPumps.get(clipId);
  if (pump && pump.active && pump.lastPresentedFrameIdx >= 0) {
    cands.push({
      src: "pump",
      frame: pump.lastPresentedFrameIdx,
      expectedDisplayTime: pump.lastExpectedDisplayTime,
      callbackMs: pump.lastCallbackMs,
      fps: pump.fps,
      rate: pump.el.playbackRate > 0 ? pump.el.playbackRate : 1,
    });
  }
  return f3PickAnchor104f3(cands, now, frameIdx);
}

/**
 * Đợt 104 F3 (104f3): nhãn snapshot theo anchor tươi (F8) — tươi thì ngoại
 * suy (labelSrc tap/pump), cũ/không anchor thì frameIdx, relabel tắt thì
 * frameIdx (src "off"). (Nấc rawAnchor F8b đã bỏ ở đợt 105 G1.)
 */
function f3RelabelFrameIndex(clipId: string, frameIdx: number): { frame: number; labelSrc: string } {
  if (!f3RelabelEnabled() || !f3TapEnabled()) return { frame: frameIdx, labelSrc: "off" };
  const a = f3AnchorInfo(clipId, frameIdx);
  return { frame: a.frame, labelSrc: a.src };
}

function presentedFrameIndex(clipId: string, frameIdx: number): number {
  // Đợt 104 F3 (104f3): khi tap BẬT, presented = anchor tươi ngoại suy,
  // cũ thì frameIdx (nấc rawAnchor F8b đã bỏ ở đợt 105 G1) — cùng hệ tọa
  // độ với nhãn relabel. Khi tap TẮT, hành vi gốc verbatim (pump không
  // gate) để baseline là đối chứng thật.
  if (f3TapEnabled()) return f3AnchorInfo(clipId, frameIdx).frame;
  const pump = rvfcPumps.get(clipId);
  if (!pump || pump.lastPresentedFrameIdx < 0 || pump.lastExpectedDisplayTime === null) return frameIdx;
  const rate = pump.el.playbackRate > 0 ? pump.el.playbackRate : 1;
  const fps = pump.fps > 0 ? pump.fps : 30;
  const frameDurMs = 1000 / (fps * rate);
  const now = performance.now();
  const k = now >= pump.lastExpectedDisplayTime
    ? Math.floor((now - pump.lastExpectedDisplayTime) / frameDurMs)
    : 0;
  return pump.lastPresentedFrameIdx + k;
}

/**
 * Đợt 96 X2: quyết định blend mà compositeMotionBlurLayer vừa dùng ở lần
 * blend gần nhất của clip — recordDrawnBlendWindow đọc lại để ghi
 * lastDrawnPresentedFrame/lastDrawnRingSize/lastDrawnSkippedLatest ĐÚNG
 * bằng giá trị quyết định, thay vì ước lượng lại sau khi blend (lúc đó
 * trình chiếu có thể đã lật khung trong lúc blend chạy). Chỉ ghi khi
 * blend thành công (trả layer); caller bỏ layer (vd mask null) thì giá
 * trị tồn lại nhưng recordDrawnBlendWindow không được gọi nên nhãn cũ
 * giữ nguyên.
 */
const blendPresentedFrame = new Map<string, { presented: number; skippedLatest: number; ringSize: number; paddedGhosts: number; anchorSrc?: string; anchorAgeMs?: number | null }>();

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
 * drawSrc hay unit thô chưa mask). drawFrame tự lo transform/filter của
 * đường vẽ đó trên target (save/restore bên trong); helper save/restore
 * quanh mỗi frame để alpha/filter không rò sang frame khác.
 * Đợt 90 R1: tách thành compositeMotionBlurLayer (trả lớp blend, KHÔNG
 * vẽ lên ctx) + wrapper drawMotionBlurBlended (vẽ lớp lên ctx) — đường
 * mask cần giữ lớp lại để áp mask 1 lần sau blend rồi mới vẽ lên canvas
 * chính (xem drawVideoClip); các đường không mask dùng wrapper như cũ.
 * Trả về true khi đã vẽ blend xong (caller cập nhật snapshot + vignette
 * rồi return); false khi chưa có bóng dùng được (ring rỗng, weights < 2,
 * không có document/context) — khi đó caller vẽ trực tiếp frame hiện
 * tại như cũ, KHÔNG có ghost nào bị bỏ sót (false chỉ xảy ra khi không
 * có bóng để vẽ). Lớp blend được xoá trắng mỗi lần gọi; snapshot lưu
 * sau đó vẫn là nội dung gốc chưa blend (do caller cập nhật).
 */
function compositeMotionBlurLayer(
  clipId: string,
  weights: readonly number[],
  W: number,
  H: number,
  drawFrame: (target: CanvasRenderingContext2D, snap: HTMLCanvasElement | null) => void,
  // Đợt 96 X2: frameIdx của tick này (videoFrameIndex từ currentTime) —
  // để loại snapshot trùng frame hiện tại khỏi tập ghost (xem dưới).
  // -1 = không biết (giữ hành vi cũ — mọi caller trong drawVideoClip đều
  // truyền frameIdx thật, chỉ test/harness ngoài mới để mặc định).
  frameIdx = -1,
): HTMLCanvasElement | null {
  const arr = motionBlurSnapshots.get(clipId);
  if (!arr || arr.length === 0 || weights.length < 2 || typeof document === "undefined") return null;
  // Đợt 96 X2 — SỬA BLEND SAI TẬP GHOST (đợt 95 W4 §1.6/§6.1, nợ mở ưu
  // tiên): bản cũ lấy ghost = các snapshot MỚI NHẤT trong ring rồi vẽ
  // thêm frame hiện tại qua drawFrame(null) — khi snapshot mới nhất
  // CHÍNH LÀ frame hiện tại (pump đã capture frame đang trình chiếu)
  // thì frame hiện tại bị đếm 2 lần: cửa sổ {K-1,K,K} → gStd 84,6 thay
  // vì tmix đúng {K-2,K-1,K} → 37,5; preview mờ chỉ ~44% độ mờ đúng
  // (blur yếu hơn render ~2,25× độ tương phản còn lại) ở đa số tick.
  // Sửa: ghost chỉ lấy từ các snapshot CŨ HƠN frame đang trình chiếu P
  // (presentedFrameIndex — khác frameIdx khi trình chiếu đã lật sang
  // K+1 trước currentTime). Quy tắc theo P so với snapshot mới nhất L:
  // - P == L: bỏ snapshot L khỏi tập ghost, lấy các snapshot trước nó
  //   (ghost = {L-2,L-1,...}) → cửa sổ {L-2,L-1,P} = tmix(P) đúng.
  // - P == L+1: snapshot L là ghost hợp lệ (frame ngay trước P) → giữ
  //   hành vi cũ (ghost = {L-1,L}) → cửa sổ {L-1,L,P} = tmix(P) đúng.
  // - P > L+1 (pump capture thưa dưới tải) hoặc P < L: giữ hành vi cũ
  //   (ghost = snapshot mới nhất) — cửa sổ vốn đã không liên tiếp, ngoài
  //   phạm vi sửa này (xem LIMITS đợt 95 W4 §5.2).
  // Ring vẫn giữ snapshot L cho frame sau (chỉ đổi TẬP GHOST ở lần blend
  // này, không xoá snapshot). Khi ring chỉ còn đúng snapshot L (pool
  // rỗng) thì không còn ghost nào cũ hơn current → trả null để caller vẽ
  // trực tiếp (đúng: tmix của 1 khung không lịch sử chính là khung đó).
  // ĐIỀU KIỆN ĐI KÈM (đo được ở assert96 lần 1): ring PHẢI giữ
  // weights.length snapshot (= frames) — nếu chỉ giữ frames-1 thì khi
  // pump bắt kịp (L == P), pool chỉ còn frames-2 ghost và plan co lại
  // thành pair (gStd ~79 thay vì triple 37,5). Dung lượng frames được
  // đặt ở ensureRvfcPump (maxGhosts) + mọi điểm gọi
  // updateMotionBlurSnapshots (đường tick); xem LIMITS đợt 96 X2 §3.
  // Plan tính lại theo số ghost THỰC DÙNG (pool) nên weights chuẩn hoá
  // đúng cửa sổ mới, không giữ alpha của cửa sổ cũ.
  const lastCaptured = motionBlurLastFrameIndex.get(clipId);
  // Đợt 104 F3 (104f3): anchor đã nuôi presented ở tick này — ghi vào stash
  // để recordDrawnBlendWindow log anchorSrc/anchorAgeMs. Tính 1 lần ở đây
  // để stash khớp đúng quyết định blend (không ước lượng lại sau).
  const anchor104f3 = f3TapEnabled() ? f3AnchorInfo(clipId, frameIdx) : null;
  const presented = anchor104f3 ? anchor104f3.frame : presentedFrameIndex(clipId, frameIdx);
  const skipLatest = frameIdx >= 0 && lastCaptured !== undefined && lastCaptured === presented;
  const ghostPool = skipLatest ? arr.slice(0, arr.length - 1) : arr;
  // Đợt 101 C4 — PAD-OLDEST khi ring đói (LIMITS đợt 101 C4 §2): khi
  // ghostPool ngắn hơn weights.length-1, plan co lại thành pair và blend
  // 2 khung lệch gap≥2 cho gStd ~0,306 (dải D — đo được 13/876 = 1,5%
  // trên chr, 10/13 ringSize=1; pool=1 KHÔNG BAO GIỜ ra A: 0/44). Render
  // (tmix) KHÔNG co cửa sổ: ffmpeg clone frame đầu để lấp cửa sổ (đo
  // thật /tmp/tmix101c4: out[0]==F0, out[1]==(2·F0+F1)/3). Preview làm
  // theo: lặp snapshot CŨ NHẤT trong pool cho đủ frames-1 ghost, plan
  // giữ nguyên triple — cặp gap-2 {ghost,ghost,current} dự đoán
  // harmonic 0,449 (đúng dải A) thay vì pair 0,307 (dải D). Ring thật
  // KHÔNG đổi (ringSize ghi vẫn = arr.length); số ghost clone ghi vào
  // stash để harness phân biệt (lastDrawnPaddedGhosts). Pool rỗng giữ
  // hành vi cũ (trả null → vẽ trực tiếp).
  const paddedGhosts = motionBlurPadGhostCount(weights.length, ghostPool.length);
  const blendPool = paddedGhosts > 0 ? [...Array<HTMLCanvasElement>(paddedGhosts).fill(ghostPool[0]), ...ghostPool] : ghostPool;
  const plan = motionBlurBlendPlan(weights, blendPool.length);
  if (plan.length < 2) return null;
  blendPresentedFrame.set(clipId, { presented, skippedLatest: skipLatest ? 1 : 0, ringSize: arr.length, paddedGhosts, anchorSrc: anchor104f3?.src ?? "frameIdx", anchorAgeMs: anchor104f3?.ageMs ?? null });
  if (!motionBlurLayer) motionBlurLayer = document.createElement("canvas");
  if (motionBlurLayer.width !== W || motionBlurLayer.height !== H) {
    motionBlurLayer.width = Math.max(2, Math.round(W));
    motionBlurLayer.height = Math.max(2, Math.round(H));
  }
  const lctx = motionBlurLayer.getContext("2d");
  if (!lctx) return null;
  lctx.clearRect(0, 0, motionBlurLayer.width, motionBlurLayer.height);
  // Đợt 96 X2: ghost lấy từ ghostPool (đã loại snapshot trùng frame hiện
  // tại khi skipLatest), không phải từ ring thô — xem khối trên.
  // Đợt 101 C4: lấy từ blendPool (đã pad-oldest khi ring đói) — snaps có
  // thể chứa cùng 1 canvas 2 lần (ghost clone, như tmix clone frame đầu).
  const snaps = blendPool.slice(blendPool.length - (plan.length - 1));
  // Đợt 99 A2: expose ring snapshots — stash strip của ĐÚNG các ghost
  // snapshot sắp blend (kèm nhãn frame + kích thước lúc capture);
  // recordDrawnBlendWindow đọc rồi xoá trong cùng tick.
  blendGhostPixStrip.set(
    clipId,
    snaps.map((s) => motionBlurSnapshotPix.get(s) ?? null),
  );
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
  return motionBlurLayer;
}

function drawMotionBlurBlended(
  ctx: CanvasRenderingContext2D,
  clipId: string,
  weights: readonly number[],
  W: number,
  H: number,
  drawFrame: (target: CanvasRenderingContext2D, snap: HTMLCanvasElement | null) => void,
  // Đợt 96 X2: frameIdx của tick này — chuyển tiếp cho
  // compositeMotionBlurLayer để loại ghost trùng frame hiện tại.
  frameIdx = -1,
): boolean {
  const layer = compositeMotionBlurLayer(clipId, weights, W, H, drawFrame, frameIdx);
  if (!layer) return false;
  ctx.drawImage(layer, 0, 0, W, H);
  return true;
}

/**
 * Đợt 92 T2: ghi cửa sổ blend ĐÃ DÙNG để vẽ khung này vào debug state
 * (frameIdx hiện tại + lastFrame/prevFrame của ring lúc vẽ) — harness
 * nhóm spread theo cửa sổ đã vẽ, không theo nhãn (frameIdx,lastFrame)
 * đọc sau lúc đo pixel (capture có thể rơi vào giữa lúc đo, làm nhãn
 * lệch khỏi cửa sổ thật, xem LIMITS đợt 92 T2 §4). Chỉ gọi khi blend
 * thành công (ring có bóng); đường vẽ trực tiếp không ghi (giữ giá trị
 * của lần blend trước — harness loại mẫu ring=0 / nhãn không khớp).
 * Đợt 96 X2: ghi thêm lastDrawnPresentedFrame = frame trình chiếu mà
 * compositeMotionBlurLayer vừa dùng để quyết định tập ghost (đọc từ
 * blendPresentedFrame — đúng giá trị quyết định, không ước lượng lại);
 * khi không có stash (blend qua đường khác — hiện không có) thì rơi về
 * frameIdx. Lượt 3 ghi thêm lastDrawnRingSize + lastDrawnSkippedLatest
 * từ cùng stash (ring lúc blend + có loại snapshot mới nhất không) —
 * không có 2 trường này, 2 mẫu cùng nhãn (frameIdx,prev,last,presented)
 * nhưng khác ring lúc blend sẽ bị nhóm chung dù blend khác nhau.
 * Đợt 97 Y2: ghi thêm 1 entry vào pump event log mở rộng
 * (__vcutRvfcBlendTick) cho MỖI tick blend thành công — nối quyết định
 * blend (presented/expected/skippedLatest/ringSize) với pump event gần
 * nhất đã nuôi ring (lastPumpSeq/lateMs/ctDeltaMs), để chẩn đoán cụm
 * double-count 84 (xem RvfcBlendTickSample). currentTime = đồng hồ media
 * lúc blend, caller truyền vào (null khi clip không phải video element).
 */
function recordDrawnBlendWindow(clipId: string, frameIdx: number, currentTime: number | null = null): void {
  const dbg = motionBlurDebugState.get(clipId);
  if (!dbg) return;
  dbg.lastDrawnFrameIdx = frameIdx;
  dbg.lastDrawnLastFrame = dbg.lastFrame;
  dbg.lastDrawnPrevFrame = dbg.prevFrame;
  const stash = blendPresentedFrame.get(clipId);
  dbg.lastDrawnPresentedFrame = stash?.presented ?? frameIdx;
  dbg.lastDrawnRingSize = stash?.ringSize ?? -1;
  dbg.lastDrawnSkippedLatest = stash?.skippedLatest ?? -1;
  dbg.lastDrawnPaddedGhosts = stash?.paddedGhosts ?? -1;
  // Đợt 97 Y2: log tick blend (xem RvfcBlendTickSample) — chỉ đo, không
  // đổi hành vi blend. lastPump* đọc từ pump state của clip (null/-1
  // khi đường tick nuôi snapshot — không có pump event nào).
  const pump = rvfcPumps.get(clipId);
  // Đợt 98 Z2: strip pixels frame hiện tại (đường mask đặt trước khi gọi;
  // đường thường không có → null). Đọc rồi xoá để tick sau không dùng nhầm.
  const curPix = blendCurrentPixStrip.get(clipId) ?? null;
  blendCurrentPixStrip.delete(clipId);
  // Đợt 99 A2: strip của ĐÚNG các ghost snapshot vừa blend (đặt trong
  // compositeMotionBlurLayer cùng tick). Đọc rồi xoá như curPix.
  const ghostPix = blendGhostPixStrip.get(clipId) ?? null;
  blendGhostPixStrip.delete(clipId);
  recordRvfcBlendTick({
    seq: rvfcBlendTickSeq++,
    tBlend: performance.now(),
    clipId,
    presented: stash?.presented ?? frameIdx,
    expected: frameIdx,
    currentTime,
    skippedLatest: stash?.skippedLatest ?? -1,
    ringSize: stash?.ringSize ?? -1,
    ringLast: dbg.lastDrawnLastFrame,
    ringPrev: dbg.lastDrawnPrevFrame,
    viaRvfc: pump && pump.active ? 1 : 0,
    lastPumpSeq: pump?.lastPumpSeq ?? -1,
    lastPumpLateMs: pump?.lastPumpLateMs ?? null,
    lastPumpCtDeltaMs: pump?.lastPumpCtDeltaMs ?? null,
    curPix,
    ghostPix,
    // Đợt 104 F3 (104f3): nguồn + tuổi anchor đã nuôi presented ở tick này.
    anchorSrc: stash?.anchorSrc ?? "frameIdx",
    anchorAgeMs: stash?.anchorAgeMs ?? null,
  });
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
  // Đợt 74 B9: logic "từ nào đang sáng" tách ra lib/captions.ts
  // (karaokeActiveWordIndex) để test được; tô sáng tích lũy như cũ.
  const active = karaokeActiveWordIndex(words, localT);
  let x = cx - layout.totalW / 2;
  for (let i = 0; i < words.length; i++) {
    ctx.fillStyle = i <= active ? hi : s.color;
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
      // Đợt 73 A7: pathRoundRect fallback về rect trên Safari < 16.
      pathRoundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 10);
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
    // Đợt 73 A7: pathRoundRect fallback về rect trên Safari < 16.
    pathRoundRect(ctx, bx, by, boxW, boxH, 10);
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
// Đợt 60 Q6: id các video clip mà renderFrame tick vừa rồi KHÔNG vẽ
// được (điểm `!srcEl` trong drawVideoClip: decoder tụt → decision
// "skip", hoặc chưa có source element) — badge effect ở tick sau đọc
// tập này để KHÔNG liệt kê effect của clip đó (nguyên nhân là decoder,
// không phải type effect; đóng nợ đợt 59 P3 §5.4). Reset cùng
// tickHadHold ở đầu renderFrame; clip ở nhánh hold KHÔNG vào đây
// (frame giữ vẫn qua đúng pipeline nên effect vẫn bị skip thật).
// Trễ tối đa 1 tick như tickHadHold — chấp nhận được cho chỉ báo.
// Đợt 62 R6: tập này lưu key INSTANCE (`previewClipInstanceKey`), không
// phải leaf id trần — 2 instance nested cùng leaf id tách nhau (đóng nợ
// R8 §5.5); và nhánh `.then` seek-thất-bại của vòng lặp pause cũng ghi
// vào đây (đóng nợ R8 §5.1 — xem điểm nối trong `.then`): seek kẹt thì
// renderFrame không chạy nên chỉ có đường đó mới ghi được clip stall.
let tickSkippedClipIds = new Set<string>();
// Đợt 27 K4: ngữ cảnh transport của lần renderFrame hiện tại, để
// drawVideoClip biết clip nào đang seek-stepping mà không phải luồn thêm
// tham số qua toàn bộ wrapper transition/dip/mask (vùng của luồng khác).
// Vòng lặp đặt trước mỗi lần gọi renderFrame: nhánh phát đặt
// {playing: true, reversePlayback}, nhánh pause/seek đặt playing: false.
// stepping của 1 clip = playing && (reversePlayback toàn cục || clip.reverse).
let drawTransport = { playing: false, reversePlayback: false };
// ROUND63-R6 (3): key hold cache theo INSTANCE + ánh xạ nguồn (đóng nợ
// đợt 62 §4 mục 6 = LIMITS R6 §5.3) — xem holdCacheKey63R6.ts. Key cũ
// `clip.id::clip.src` dùng chung slot cho 2 instance nested cùng leaf id
// + cùng src nhưng khác `in` (instance B stall thì hold frame của A, sai
// vị trí nguồn), và cho cùng instance sau khi đổi `in`/`speed`/`reverse`.
// storeHeldFrame nhận clip (không còn (clipId, src) rời) để tính đúng
// key instance + ánh xạ; mọi điểm đọc cache (drawVideoClip bên dưới)
// dùng cùng 1 hàm nên không lệch key giữa ghi và đọc.
function storeHeldFrame(clip: VideoClip, v: HTMLVideoElement, mw: number, mh: number): void {
  if (typeof document === "undefined") return;
  try {
    const key = heldFrameCacheKey63R6(clip);
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
    // ROUND63-R6 (3): công bố danh sách key slot đang có cho harness đo
    // (harness H1 khẳng định 2 instance cùng leaf id + cùng src có 2 key
    // riêng, không dùng chung slot). Chỉ cập nhật khi store thành công;
    // copy mảng ≤ 16 key mỗi lần draw là rẻ so với drawImage.
    (window as unknown as { __vcutHeldFrameKeys?: string[] }).__vcutHeldFrameKeys = [
      ...heldFrameCache.keys(),
    ];
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
  // Đợt 92 T2: mốc đo chi phí tick cho clip này (xem TickCostSample).
  const clipT0 = performance.now();
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
    // Đợt 61 R8 (đóng nợ đợt 60 §5.8, đảo quyết định Q6 §5.2): clip
    // thiếu media cũng là "không vẽ được" — ghi id vào tickSkippedClipIds
    // để badge effect tick sau không liệt kê effect của nó (nguyên nhân
    // là media thiếu, không phải type effect). Placeholder text vẫn vẽ
    // như cũ bên dưới (chỉ thiếu nội dung), nhưng với badge thì clip này
    // tính là không vẽ được — cùng ngữ nghĩa với điểm `!srcEl`.
    // Đợt 62 R6: ghi key INSTANCE (lá nested đã đóng dấu khi flatten;
    // clip tầng ngoài thì key = đúng clip.id) để 2 instance cùng leaf
    // id không lẫn nhau (đóng nợ R8 §5.5).
    tickSkippedClipIds.add(previewClipInstanceKey(clip));
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#8b94a7";
    ctx.font = "28px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(i18nT("preview.missingMedia", { names: clip.src }), W / 2, H / 2);
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
        // Đợt 60 Q4 — i18nLookup: lý do fallback GOP đi qua key gop.*
        // trong dict thay vì kẹt VI (chỉ test/diagnostics đọc).
        { gopRangeEnabled: true, i18nLookup: i18nT },
      );
    }
    const v = pool.videoFor(item);
    // Đợt 98 Z6: element vừa đổi chủ sang clip này (clip kế có/không blur
    // đều qua đây) — kill pump zombie của clip cũ ngay tick đầu clip mới,
    // trước cả quyết định draw/hold/skip (xem rvfcNoteVideoElementOwner).
    if (v) rvfcNoteVideoElementOwner(v, clip.id, t, clip.start, clip.duration);
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
      const key = heldFrameCacheKey63R6(clip);
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
        storeHeldFrame(clip, v, mw, mh);
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
  // Đợt 60 Q6: clip không vẽ được ở tick này (decoder tụt → decision
  // "skip" không có frame giữ, hoặc chưa có source element) — ghi id
  // để badge effect tick sau không liệt kê effect của nó (nguyên nhân
  // là decoder, không phải type effect). Đợt 61 R8: clip thiếu media
  // (!item) cũng vào tập này (ghi ở nhánh placeholder trên) — đảo quyết
  // định Q6 §5.2 vì thiếu media cũng là "không vẽ được".
  // Đợt 62 R6: ghi key INSTANCE như nhánh !item trên (đóng nợ R8 §5.5).
  if (!srcEl || mw <= 0 || mh <= 0) {
    tickSkippedClipIds.add(previewClipInstanceKey(clip));
    return;
  }

  // Phase 9 đợt 90 R1: chỉ số frame video ĐANG HIỂN THỊ ở tick này — gate
  // snapshot motion blur theo frame video (không theo tick), xem
  // updateMotionBlurSnapshots. Nguồn thời gian = frame thật đang vẽ, không
  // phải playhead: element video cho currentTime (đúng cả khi speed ≠ 1 /
  // reverse — tmix render blend các frame NGUỒN liên tiếp); held canvas thì
  // nội dung đóng băng tại firstHeldT nên index đứng yên trong lúc hold
  // (không thêm snapshot trùng); VideoFrame/ảnh không có source time thì
  // dùng localT làm xấp xỉ (đường reverse/stepping vẫn nhận snapshot mới
  // theo từng bước như cũ). -1 = không gate (giữ hành vi cũ).
  const projFps = spec.meta.fps > 0 ? spec.meta.fps : 30;
  let frameIdx = -1;
  if (typeof HTMLVideoElement !== "undefined" && srcEl instanceof HTMLVideoElement) {
    frameIdx = videoFrameIndex(srcEl.currentTime, projFps);
  } else {
    const held = heldFrameCache.get(heldFrameCacheKey63R6(clip));
    const baseT = held && held.firstHeldT !== null ? held.firstHeldT : localT;
    frameIdx = videoFrameIndex(baseT, projFps);
  }
  // Đợt 100 B2: mốc nhãn trong-tick (chỉ đo — lúc đọc currentTime để
  // gán nhãn frameIdx; updateMotionBlurSnapshots đọc + xoá ở cuối tick,
  // xem TickLabelCtx). performance.now() đọc ngay sau currentTime nên
  // labelMs ≈ thời điểm gán nhãn.
  if (typeof performance !== "undefined") {
    tickLabelCtx.set(clip.id, {
      labelMs: performance.now(),
      labelCt:
        typeof HTMLVideoElement !== "undefined" && srcEl instanceof HTMLVideoElement
          ? srcEl.currentTime
          : null,
      labelFrame: frameIdx,
      rawMs: null,
      rawCt: null,
    });
  }
  // Đợt 90 R1: reset ring khi seek/loop nhảy lùi, TRƯỚC khi blend (xem
  // motionBlurResetOnSeek) — tránh blend 1 khung bóng cũ trước seek.
  motionBlurResetOnSeek(clip.id, frameIdx);

  // R1-060: letterbox (giữ tỉ lệ + nền đen) — KHỚP render (scale=decrease + pad).
  // Trước đây preview dùng cover-fit (crop) → sai khác với bản render.
  const { dw, dh, dx, dy } = letterboxFit(mw, mh, W, H);
  // Render pad unit đúng WxH nên unitW=W, unitH=H.
  const vis = videoClipVisual(clip, localT, W, H, W, H);
  // T1 (Phase 9 đợt 12): blend theo weights thật — lấy từ
  // vis.motion.blurGhost (rỗng = không blur hoặc preview tắt). Đường vẽ
  // không đọc ghostAlphas nữa (mô tả trail cũ, xem previewEngine.ts).
  // ĐỢT 62 R3: CHỈ blend khi đang phát (drawTransport.playing) — lúc
  // pause/scrub khung hình đứng yên nên tmix của 1 khung đứng yên CHÍNH
  // LÀ khung đó; blend với snapshot cũ lúc pause để lại vệt mờ 1.39–2.77
  // meanAbs không bao giờ rửa sạch (ring chỉ lấp đầy sau 1 lần vẽ lại
  // lúc pause — xem LIMITS đợt 61 R3 §3 + đợt 62 R3 §3). Gate này cũng
  // chặn cập nhật snapshot lúc pause (mọi đường updateMotionBlurSnapshots
  // đều đi sau ghostWeights.length > 0), nên resume phát thì ring vẫn
  // giữ các frame ngay trước điểm pause — đúng đầu vào tmix lúc resume.
  const ghostWeights: readonly number[] =
    MOTION_BLUR_PREVIEW_ENABLED && drawTransport.playing && vis.motion.motionBlur
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
  // Phase 9 đợt 87 O4: mask bám track (mirror render.js:876, mode trackgeq
  // của O3) — clip vừa có mask vừa có track thì track LÁI MASK (tâm
  // effMask = track, xem maskedUnitSource), video đứng yên: BỎ shift D3 ở
  // mọi nhánh vẽ dưới (mask SR / mask thường / vignette đều đọc trackShift
  // / trackCenter nên null ở đây là đủ). Giữ shift thì mask bị double-shift:
  // tâm cuối = track + (track - 0.5) = 2*track - 0.5 (O3 đã đo). Clip
  // không mask giữ nguyên hành vi D3. Lưu ý: preview không có cờ mask-mode
  // như render — với mask+track, preview nay luôn theo ngữ nghĩa trackgeq
  // (tâm effMask = track, video đứng yên). Câu cũ ở đây từng ghi "lệch với
  // render mặc định (png) vốn vẫn shift unit" — đã SAI từ đợt 87 O2: render
  // png mặc định cũng bỏ shift D3 cho clip track+mask (render.js:900),
  // và P3 đợt 88 đã đo preview KHỚP render png (|Δcx| ≤ 0.0005). Đợt 89 Q3
  // đo thêm: preview cũng KHỚP render trackgeq khi mask không có keyframes
  // w/h (cùng quy tắc tâm=track, w/h tĩnh); chỉ lệch ở case mask có
  // keyframes w/h (trackgeq đóng băng w/h tĩnh, Δw ≈ 0.0992 — giới hạn đã
  // biết của đường trackgeq, parent quyết giữ nguyên, xem LIMITS đợt 88
  // §3 mục 1). Vì app không có đường render trackgeq nào (bridge/desktop
  // luôn dùng png mặc định) nên KHÔNG thêm cờ mask-mode cho preview:
  // preview phải khớp đúng render mà user nhận được (png), không khớp
  // đường fallback thử nghiệm sau cờ CLI.
  if (clip.mask && clip.track) {
    trackShift = null;
    trackCenter = null;
  }
  let drawSrc: CanvasImageSource = srcEl;
  // Đợt 91 S1: drawSrc đã qua xử lý theo frame (chroma/LUT WebGL/
  // effects/enhance/deint) thì snapshot rVFC (video thô) KHÔNG tương
  // đương snapshot đường tick (đã xử lý) — clip đó không dùng pump
  // rVFC mà giữ đường tick của R1. Letterbox/plain-native chỉ là
  // resample thuần nên KHÔNG đặt cờ này.
  let pipelineProcessedDrawSrc = false;
  if (vis.chroma) {
    const keyed = chromaKeyedSource(srcEl, mw, mh, vis.chroma);
    if (keyed) {
      drawSrc = keyed;
      pipelineProcessedDrawSrc = true;
    }
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
  // Đợt 75 C1: drawSrc đã ở khổ letterbox dw×dh chưa — LUT/effects/
  // enhance ra canvas dw×dh, chroma/raw còn ở khổ native mw×mh.
  let srcAtLetterbox = false;
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
      srcAtLetterbox = true;
      pipelineProcessedDrawSrc = true;
    }
  }
  // V2 (Phase 9 đợt 10): canvas effects — 8 effect trước đây bị bỏ qua nay
  // vẽ thật bằng effectCanvas (sau chroma/LUT, trước mask/SR/opacity).
  // Thất bại (không có document/context) → giữ drawSrc cũ, effect bị bỏ
  // qua ở frame đó chứ không crash.
  const canvasOps = canvasEffectOps(clip.effects, localT);
  if (canvasOps.length > 0) {
    // Đợt 80 H3: noise dùng ma trận YUV theo chiều rộng NGUỒN decode
    // (mw — không phải dw letterbox: nguồn 1280 trong project 640 vẫn
    // decode bt709); xem yuvMatrixForSourceWidth.
    const effSrc = effectCanvasSource(drawSrc, dw, dh, canvasOps, yuvMatrixForSourceWidth(mw));
    if (effSrc) {
      drawSrc = effSrc;
      srcAtLetterbox = true;
      pipelineProcessedDrawSrc = true;
    }
  }
  // Q1 (Phase 9 đợt 60; blend đợt 62 R3; tap khử răng cưa đợt 75 C8):
  // enhance preview xấp xỉ — denoise → blend với bản mờ (alpha = strength,
  // blur 3.0px cố định), stabilize → zoom crop gợi ý (offscreen, sau effects
  // như hqdn3d ở render); deinterlace → tap dọc +0.5px, CHỈ khi tỉ lệ vẽ
  // thật (dh/mh × tỉ lệ viewport canvas) ≥ 0.9 — dưới ngưỡng downscale
  // đã giấu răng cưa, xem lib/enhancePreview.ts. Toggle UI mặc định bật
  // (store.enhancePreviewEnabled). Clip có speedKeyframes thì
  // stabilize bị chặn trong plan (zoom 1 — đồng bộ render chặn hẳn).
  // Hook đo ghi MỌI lần vẽ (kể cả clip không enhance / toggle tắt) để
  // harness phân biệt trạng thái.
  const drawScaleY = mh > 0 ? (dh / mh) * previewViewportScale(W, H) : 0;
  const enhPlan = enhancePreviewPlan(
    clip.enhance,
    useStore.getState().enhancePreviewEnabled,
    clip.speedKeyframes !== undefined,
    drawScaleY,
  );
  let enhOffscreen = false;
  if (enhPlan.needsOffscreen) {
    const enhSrc = enhancePreviewSource(drawSrc, dw, dh, enhPlan.denoiseBlurPx, enhPlan.denoiseBlendAlpha, enhPlan.stabilizeZoom, enhPlan.deinterlaceTap);
    if (enhSrc) {
      drawSrc = enhSrc;
      enhOffscreen = true;
      srcAtLetterbox = true;
      pipelineProcessedDrawSrc = true;
    }
  }
  // Đợt 76 D4 — TAP ĐƠN LẺ QUA INTERMEDIATE THU HẸP DỌC (đóng nợ G5
  // đợt 75 C8: FPS deint-only 0.65–0.71× vì tap đi qua enhanceCanvas
  // full-res): khi plan có tap mà KHÔNG cần offscreen (không denoise
  // alpha, không stabilize zoom) thì đưa drawSrc qua
  // deintIntermediateSource (dw×dh/2 — đợt 77 E1 đã thử dw×dh/4 rồi
  // quay về 2 vì không chứng minh được nhanh hơn mà còn FAIL G7b mask;
  // xem LIMITS E1 §3) thay vì enhanceCanvas — các nhánh vẽ sau vẽ
  // canvas này lên khổ đích dw×dh như thường, không đổi gì khác. Tap
  // đi kèm denoise/stabilize vẫn qua offscreen như cũ (đã nằm trong
  // lần vẽ gốc của enhanceCanvas). Hook debug: offscreenApplied=false
  // + tap=true là dấu hiệu phân biệt đường intermediate với đường
  // offscreen enhanceCanvas cũ (intermediate cũng là canvas trung gian
  // nhưng ở nửa chiều cao và KHÔNG qua enhanceCanvas — xem LIMITS §3).
  // Bản inline-shift (deintInlineDy, cộng +0.5px vào lần vẽ cuối) đã
  // BỎ sau headed lần 1: FPS 0.99× nhưng R không giảm ở upscale (xem
  // LIMITS §2.2 đợt 76 D4; probe E1 xác nhận lại: R 0.85 → 0.88).
  if (enhPlan.deinterlaceTap && !enhPlan.needsOffscreen) {
    // Đợt 79 G1 — HƯỚNG MỚI: intermediate đọc từ canvas held-frame thay
    // vì đọc lại video (giảm số lần đọc video mỗi tick deint-only từ 2
    // → 1). Cơ chế (F1): chi phí nằm ở phía nguồn video — drawImage từ
    // video đắt gấp nhiều lần từ canvas cùng khổ. storeHeldFrame đã vẽ
    // video → held canvas (mw×mh, cùng frame, cùng tick) ngay trước
    // pipeline này, nên vẽ intermediate từ canvas đó thay vì video là
    // cùng 1 frame, rẻ hơn mà pixel ~y hệt (probe tab trắng G1:
    // MAD B vs A = 0,0162 interlaced / 0,0133 clean, max 1/255,
    // R 0,43 = 0,43, vgrad giống tới 3 chữ số — xem
    // docs/PHASE9_ROUND79_G1_DEINT_FPS_LIMITS.md §3.1). CHỈ áp khi
    // drawSrc còn là element video thô (drawSrc === srcEl): đã qua
    // chroma/LUT/effects thì drawSrc là canvas đã xử lý, KHÔNG được
    // thay bằng held canvas (sẽ mất hiệu ứng); nhánh hold (srcEl đã
    // là canvas giữ) và VideoFrame/WebCodecs cũng giữ hành vi cũ.
    // Không có held canvas (store thất bại / frame đầu) → rơi về video
    // như cũ, không crash. Quyết giữ hay hoàn lại theo số headed G5.
    let interInput: CanvasImageSource = drawSrc;
    if (
      drawSrc === srcEl &&
      typeof HTMLVideoElement !== "undefined" &&
      srcEl instanceof HTMLVideoElement
    ) {
      const held = heldFrameCache.get(heldFrameCacheKey63R6(clip));
      if (held) interInput = held.canvas;
    }
    const interSrc = deintIntermediateSource(interInput, dw, dh);
    if (interSrc) {
      drawSrc = interSrc;
      srcAtLetterbox = true;
      pipelineProcessedDrawSrc = true;
    }
  }
  exposeEnhancePreviewDebug();
  Object.assign(enhancePreviewDebugState, enhancePreviewDebug(clip.id, enhPlan, enhOffscreen));
  // Đợt 75 C1: rò plain (B1 §6.3) — đường plain (không LUT/effects/
  // enhance) còn giữ drawSrc ở khổ native mw×mh sẽ vẽ 1 bước thẳng
  // xuống viewport, khác chuỗi 2 bước của đường effects. Chuẩn hoá về
  // intermediate letterbox dw×dh (cùng khổ, cùng setting resample với
  // effectCanvasSource) để mọi đường vẽ sau (thường/SR/mask/motion
  // blur) chia sẻ đúng một chuỗi resample. Chỉ khi media lớn hơn
  // letterbox — chroma cũng được chuẩn hoá (canvas chroma ở khổ native,
  // cùng họ rò, B1 §8.3). Thất bại (không có document/context) → giữ
  // drawSrc cũ, frame đó giữ hành vi cũ chứ không crash. Canvas tái
  // dùng an toàn: mọi consumer bên dưới đều đọc đồng bộ trong tick này
  // (snapshot motion blur copy qua drawImage, xem
  // updateMotionBlurSnapshots).
  if (!srcAtLetterbox && (mw > dw || mh > dh)) {
    const normSrc = letterboxIntermediateSource(drawSrc, dw, dh);
    if (normSrc) drawSrc = normSrc;
  }
  // Đợt 85 M10: nốt rò plain upscale (C1 chỉ vá media > letterbox) —
  // media ≤ letterbox mà drawSrc còn là video element thô thì qua
  // canvas native 1:1 (xem plainNativeSource trên). Chỉ áp cho
  // HTMLVideoElement (đường plain live); held-frame canvas / VideoFrame /
  // canvas đã xử lý giữ nguyên.
  if (
    !srcAtLetterbox &&
    !(mw > dw || mh > dh) &&
    typeof HTMLVideoElement !== "undefined" &&
    drawSrc instanceof HTMLVideoElement
  ) {
    const nativeSrc = plainNativeSource(drawSrc, mw, mh);
    if (nativeSrc) drawSrc = nativeSrc;
  }
  // Đợt 91 S1: pump requestVideoFrameCallback sở hữu snapshot khi clip
  // đang phát xuôi + có blur + srcEl là element video + drawSrc là
  // video thô (không qua xử lý theo frame — xem
  // pipelineProcessedDrawSrc). Khi pump sống, mọi
  // updateMotionBlurSnapshots ở dưới đều bỏ qua (ring chỉ nhận snapshot
  // rVFC — cửa sổ blend là các frame LIÊN TIẾP vừa trình chiếu, không
  // phụ thuộc khoảng cách tick rAF, xem R1 §5.1). Watchdog: pump sống
  // mà callback không bắn thì fallback về đường tick ngay trong tick
  // này. Phát ngược/stepping, hold (srcEl là canvas giữ), clip ảnh/
  // VideoFrame đều không dùng pump — giữ đường tick của R1.
  const steppingNow =
    drawTransport.playing && (drawTransport.reversePlayback || (clip.reverse ?? false));
  const videoElForRvfc =
    typeof HTMLVideoElement !== "undefined" && srcEl instanceof HTMLVideoElement ? srcEl : null;
  let snapshotsViaRvfc = false;
  if (
    ghostWeights.length > 0 &&
    videoElForRvfc &&
    !steppingNow &&
    !pipelineProcessedDrawSrc
  ) {
    snapshotsViaRvfc = ensureRvfcPump({
      clipId: clip.id,
      el: videoElForRvfc,
      fps: projFps,
      // Đợt 96 X2: ring giữ ghostWeights.length snapshot (= frames), KHÔNG
      // phải frames-1 như trước — vì tập ghost sau sửa loại snapshot
      // trùng frame hiện tại (xem compositeMotionBlurLayer): cần đủ
      // frames-1 snapshot CŨ HƠN current + snapshot current trong ring
      // thì mới blend được tmix đủ frames; giữ frames-1 thì trường hợp
      // pump bắt kịp chỉ còn 1 ghost → blend pair (gStd ~79 thay vì
      // 37,5 — đo được ở assert96 lần 1, xem LIMITS đợt 96 X2 §3).
      // Cùng quy tắc ở mọi điểm gọi updateMotionBlurSnapshots dưới
      // (đường tick). Bộ nhớ thêm: 1 snapshot canvas/clip, không đáng kể.
      maxGhosts: ghostWeights.length,
      mode: clip.mask ? "unit" : "letterbox",
      W,
      H,
      dx,
      dy,
      dw,
      dh,
      s: Math.min(1, MASK_MAX_W / W),
      // Đợt 99 A6 — cửa sổ timeline của clip cho check clip-active trong rvfcCallback.
      clipStart: clip.start,
      clipDuration: clip.duration,
      // Đợt 102 D3 (bổ sung) — thời gian media kỳ vọng tại t cho gate hoãn
      // tạo pump khi element chưa định vị (xem shouldDeferRvfcPumpCreation).
      expectedMediaTime: rampSourceTimeAt(clip, t),
    });
    if (snapshotsViaRvfc && rvfcWatchdogMiss(clip.id, frameIdx)) {
      // Callback không bắn dù video đã chạy — fallback về đường tick
      // ngay tick này (ring vẫn giữ snapshot cũ, blend không mất).
      snapshotsViaRvfc = false;
    }
  }
  // Đợt 104 F3 (104f3): tap rVFC độc lập nuôi anchor trình chiếu (F8/F8b) —
  // sống cả khi pump tắt (vd --disable-rvfc / drawSrc đã xử lý), vì relabel
  // đường tick cần anchor ngay lúc đó. Không phụ thuộc snapshotsViaRvfc.
  if (ghostWeights.length > 0 && videoElForRvfc && !steppingNow) {
    ensurePresentedTap104f3(clip.id, videoElForRvfc, projFps);
  }
  // Q1 (Phase 8): mask — unit offscreen đã nhân alpha mask, rồi composite
  // như đường vẽ thường (SR hay không đều qua unit, khớp render: mask
  // trước SR). Unit null (không có document/context) → rơi xuống đường
  // vẽ thường, mask bị bỏ qua ở frame đó. Đợt 90 R1: khi có motion blur
  // thì blend unit THÔ trước rồi mới áp mask 1 lần sau blend (xem đầu
  // nhánh dưới); đường trực tiếp (không blur / ring rỗng) vẫn qua unit
  // đã mask như cũ.
  if (clip.mask) {
    // Phase 9 đợt 90 R1 (hướng (iii) Q2 §7.1): khi có motion blur thì blend
    // các unit THÔ rồi áp mask MỘT lần lên lớp blend tại vị trí mask HIỆN
    // TẠI (đúng thứ tự render tmix → mask) — thay cho hành vi cũ snapshot
    // unit ĐÃ MASK theo tick (vệt mép mask khi tick lệch frame, mất blur
    // nội dung khi tick trùng frame). Transform SR (nếu có) KHÔNG nướng
    // vào lớp blend nữa — áp lúc vẽ lớp đã mask lên canvas chính (mask
    // trong không gian chưa transform, đúng render; rủi ro SR ở Q2 §7.2).
    // Blend thất bại (ring rỗng — vài tick đầu lúc phát — hoặc mask null)
    // thì rơi xuống đường trực tiếp bên dưới như cũ; snapshot ở đường
    // trực tiếp cũng lấy unit thô để ring đồng nhất (không trộn snapshot
    // đã mask với thô).
    const hasSR = !!(clip.animations?.scale || clip.animations?.rotation);
    // Đợt 92 T2: đo tách chi phí đường mask+blur (xem TickCostSample).
    const maskTimings: MaskTimings = { get: 0, apply: 0, put: 0, total: 0, viaCanvas: false };
    const rawT0 = performance.now();
    const rawUnit =
      ghostWeights.length > 0 ? rawUnitSource(drawSrc, dx, dy, dw, dh, cssFilter, W, H) : null;
    const rawMs = performance.now() - rawT0;
    // Đợt 100 B2: mốc lấy mẫu thật của snapshot đường mask — rawUnit vẽ
    // từ video element trong khoảng [rawT0, rawT0+rawMs] nên pixels
    // snapshot = frame trình chiếu trong khoảng đó; ghi currentTime ngay
    // sau khi vẽ xong (rawCt) để đối chiếu nhãn ↔ frame lấy mẫu thật.
    const labelCtxB2 = tickLabelCtx.get(clip.id);
    if (labelCtxB2) {
      labelCtxB2.rawMs = rawT0 + rawMs;
      labelCtxB2.rawCt =
        typeof HTMLVideoElement !== "undefined" && srcEl instanceof HTMLVideoElement
          ? srcEl.currentTime
          : null;
    }
    if (ghostWeights.length > 0 && rawUnit) {
      const uw = rawUnit.width;
      const uh = rawUnit.height;
      const blendT0 = performance.now();
      const layer = compositeMotionBlurLayer(clip.id, ghostWeights, uw, uh, (tctx, snap) => {
        // Đợt 91 S1: snapshot rVFC là unit THÔ chưa nướng cssFilter
        // (rawUnit đã nướng sẵn) — áp filter lúc blend cho bóng rVFC;
        // frame hiện tại (snap == null → rawUnit) giữ filter "" như cũ.
        // compositeMotionBlurLayer đã đặt filter "" trước khi gọi painter
        // và save/restore quanh mỗi frame nên không rò sang frame khác.
        if (snap && snapshotsViaRvfc) setCtxFilter(tctx, cssFilter);
        tctx.drawImage(snap ?? rawUnit, 0, 0, uw, uh);
      }, frameIdx); // Đợt 96 X2: frameIdx để loại ghost trùng frame hiện tại
      const blendMs = performance.now() - blendT0;
      if (layer) {
        // Mask áp 1 lần lên lớp blend (cssFilter "" — rawUnit đã mang filter).
        const masked = maskedUnitSource(layer, 0, 0, W, H, "", clip.mask, W, H, localT, clip.track, maskTimings, { clipId: clip.id, frameIdx });
        if (masked) {
          const drawT0 = performance.now();
          ctx.save();
          ctx.globalAlpha = clamp(alpha * vis.opacity, 0, 1);
          setCtxFilter(ctx, "");
          if (hasSR) {
            const pl = videoElementPlacement(clip, localT, W, H, W, H);
            ctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
            if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
            if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
            ctx.drawImage(masked, -W / 2, -H / 2, W, H);
            if (vis.vignette != null) {
              drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
            }
          } else {
            ctx.drawImage(masked, trackShift ? trackShift.x : 0, trackShift ? trackShift.y : 0, W, H);
          }
          ctx.restore();
          if (!hasSR && vis.vignette != null) {
            drawVignette(ctx, dx + (trackShift ? trackShift.x : vis.offsetX), dy + (trackShift ? trackShift.y : vis.offsetY), dw, dh, vis.vignette);
          }
          const drawMs = performance.now() - drawT0;
          // Snapshot đường mask = unit THÔ vừa blend (uw×uh, chưa mask).
          // Đợt 91 S1: bỏ qua khi pump rVFC sở hữu snapshot.
          if (!snapshotsViaRvfc) {
            updateMotionBlurSnapshots(clip.id, rawUnit, uw, uh, ghostWeights.length, frameIdx);
          }
          // Đợt 98 Z2: strip pixels frame hiện tại (rawUnit) cho blend-tick
          // log — rawUnit chính là canvas frame hiện tại mà blend vừa dùng.
          blendCurrentPixStrip.set(clip.id, sampleStripeStrip(rawUnit, rawUnit.getContext("2d")));
          // Đợt 97 Y2: currentTime lúc blend cho pump event log (video
          // element; held canvas thì không có đồng hồ media → null).
          recordDrawnBlendWindow(clip.id, frameIdx, srcEl instanceof HTMLVideoElement ? srcEl.currentTime : null);
          recordTickCost({
            path: "mask-blend", total: performance.now() - clipT0, raw: rawMs, blend: blendMs,
            mask: maskTimings.total, maskGet: maskTimings.get, maskApply: maskTimings.apply,
            maskPut: maskTimings.put, draw: drawMs, frameIdx,
            maskCanvas: maskTimings.viaCanvas ? 1 : 0,
            viaRvfc: snapshotsViaRvfc ? 1 : 0, wallMs: performance.now(),
          });
          warnSkippedEffects(vis.skippedEffects);
          return;
        }
      }
    }
    const unit = maskedUnitSource(drawSrc, dx, dy, dw, dh, cssFilter, clip.mask, W, H, localT, clip.track, maskTimings, { clipId: clip.id, frameIdx });
    if (unit) {
      // Snapshot cho đường trực tiếp: unit thô khi có (ring đồng nhất thô),
      // rơi về unit đã mask khi rawUnitSource thất bại (giữ hành vi cũ).
      const snapSrc = rawUnit ?? unit;
      const snapW = rawUnit ? rawUnit.width : W;
      const snapH = rawUnit ? rawUnit.height : H;
      const drawT0 = performance.now();
      ctx.save();
      ctx.globalAlpha = clamp(alpha * vis.opacity, 0, 1);
      if (clip.animations?.scale || clip.animations?.rotation) {
        const pl = videoElementPlacement(clip, localT, W, H, W, H);
        // Phase 9 D3: có track thì tâm hình bao bám điểm track thay vì tâm placement.
        // Đợt 90 R1: blend (nếu có) đã thử ở đầu nhánh mask (unit thô +
        // mask sau blend); tới đây chỉ còn đường vẽ trực tiếp.
        ctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
        if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
        if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
        ctx.drawImage(unit, -W / 2, -H / 2, W, H);
        if (vis.vignette != null) {
          drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
        }
        // Snapshot đường mask+SR = unit THÔ (snapSrc, chưa mask) khi có.
        // Đợt 91 S1: bỏ qua khi pump rVFC sở hữu snapshot.
        if (ghostWeights.length > 0 && !snapshotsViaRvfc) {
          updateMotionBlurSnapshots(clip.id, snapSrc, snapW, snapH, ghostWeights.length, frameIdx);
        }
        ctx.restore();
        recordTickCost({
          path: "mask-direct", total: performance.now() - clipT0, raw: rawMs, blend: 0,
          mask: maskTimings.total, maskGet: maskTimings.get, maskApply: maskTimings.apply,
          maskPut: maskTimings.put, draw: performance.now() - drawT0, frameIdx,
          maskCanvas: maskTimings.viaCanvas ? 1 : 0,
          viaRvfc: snapshotsViaRvfc ? 1 : 0, wallMs: performance.now(),
        });
        warnSkippedEffects(vis.skippedEffects);
        return;
      }
      // Phase 9 D3: unit đã mask dịch theo track (mask áp trước overlay ở
      // render). Đợt 87 O4: clip vừa có mask vừa có track thì trackShift =
      // null (track lái mask trong unit, unit đứng yên — mirror render.js
      // O2/O3, tránh double-shift); nhánh mask+track vẫn đúng vì lúc đó
      // trackShift đã null và mask áp theo track hiện tại sau blend.
      // Đợt 90 R1: blend (nếu có) đã thử ở đầu nhánh mask; tới đây chỉ
      // còn đường vẽ trực tiếp.
      ctx.drawImage(unit, trackShift ? trackShift.x : 0, trackShift ? trackShift.y : 0, W, H);
      // Snapshot đường mask = unit THÔ (snapSrc, chưa mask) khi có.
      // Đợt 91 S1: bỏ qua khi pump rVFC sở hữu snapshot.
      if (ghostWeights.length > 0 && !snapshotsViaRvfc) {
        updateMotionBlurSnapshots(clip.id, snapSrc, snapW, snapH, ghostWeights.length, frameIdx);
      }
      ctx.restore();
      if (vis.vignette != null) {
        drawVignette(ctx, dx + (trackShift ? trackShift.x : vis.offsetX), dy + (trackShift ? trackShift.y : vis.offsetY), dw, dh, vis.vignette);
      }
      recordTickCost({
        path: "mask-direct", total: performance.now() - clipT0, raw: rawMs, blend: 0,
        mask: maskTimings.total, maskGet: maskTimings.get, maskApply: maskTimings.apply,
        maskPut: maskTimings.put, draw: performance.now() - drawT0, frameIdx,
        maskCanvas: maskTimings.viaCanvas ? 1 : 0,
        viaRvfc: snapshotsViaRvfc ? 1 : 0, wallMs: performance.now(),
      });
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
      // Đợt 92 T2: đo riêng chi phí blend đường thường+SR (không mask)
      // để tách khỏi chi phí mask CPU ở nhánh mask.
      const blendT0 = performance.now();
      const blended = drawMotionBlurBlended(ctx, clip.id, ghostWeights, W, H, (tctx, snap) => {
        tctx.save();
        tctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
        if (pl.rotationDeg) tctx.rotate((pl.rotationDeg * Math.PI) / 180);
        if (pl.scale !== 1) tctx.scale(pl.scale, pl.scale);
        setCtxFilter(tctx, cssFilter);
        tctx.drawImage(snap ?? drawSrc, dx - W / 2, dy - H / 2, dw, dh);
        tctx.restore();
      }, frameIdx); // Đợt 96 X2: frameIdx để loại ghost trùng frame hiện tại
      const blendMs = performance.now() - blendT0;
      if (blended) {
        // Đợt 100 B4: curPix đường thường+SR — strip frame hiện tại vẽ
        // live từ drawSrc (chưa transform SR — so với frame nguồn thô).
        blendCurrentPixStrip.set(clip.id, samplePlainCurrentPixStrip(drawSrc, dw, dh));
        // Đợt 97 Y2: currentTime lúc blend cho pump event log.
        recordDrawnBlendWindow(clip.id, frameIdx, srcEl instanceof HTMLVideoElement ? srcEl.currentTime : null);
        recordTickCost({
          path: "plain-blend", total: performance.now() - clipT0, raw: 0, blend: blendMs,
          mask: 0, maskGet: 0, maskApply: 0, maskPut: 0, draw: 0, frameIdx,
          maskCanvas: 0,
          viaRvfc: snapshotsViaRvfc ? 1 : 0, wallMs: performance.now(),
        });
        if (vis.vignette != null) {
          ctx.save();
          ctx.translate(trackCenter ? trackCenter.x : pl.centerX, trackCenter ? trackCenter.y : pl.centerY);
          if (pl.rotationDeg) ctx.rotate((pl.rotationDeg * Math.PI) / 180);
          if (pl.scale !== 1) ctx.scale(pl.scale, pl.scale);
          drawVignette(ctx, dx - W / 2, dy - H / 2, dw, dh, vis.vignette);
          ctx.restore();
        }
        // Snapshot đường SR = drawSrc gốc chưa blend (letterbox dw×dh).
        // Đợt 90 R1: gate theo frame video (frameIdx) như đường mask.
        // Đợt 91 S1: bỏ qua khi pump rVFC sở hữu snapshot.
        if (!snapshotsViaRvfc) {
          updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length, frameIdx);
        }
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
    // Đợt 91 S1: bỏ qua khi pump rVFC sở hữu snapshot.
    if (ghostWeights.length > 0 && !snapshotsViaRvfc) {
      updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length, frameIdx);
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
    // Đợt 92 T2: đo riêng chi phí blend đường thường (không mask).
    const blendT0 = performance.now();
    const blended = drawMotionBlurBlended(ctx, clip.id, ghostWeights, W, H, (tctx, snap) => {
      setCtxFilter(tctx, cssFilter);
      if (trackShift) tctx.drawImage(snap ?? drawSrc, dx + trackShift.x, dy + trackShift.y, dw, dh);
      else tctx.drawImage(snap ?? drawSrc, dx + vis.offsetX, dy + vis.offsetY, dw, dh);
    }, frameIdx); // Đợt 96 X2: frameIdx để loại ghost trùng frame hiện tại
    const blendMs = performance.now() - blendT0;
    if (blended) {
      // Đợt 100 B4: curPix đường thường — strip frame hiện tại vẽ live
      // từ drawSrc (cùng hình học snapshot dw×dh).
      blendCurrentPixStrip.set(clip.id, samplePlainCurrentPixStrip(drawSrc, dw, dh));
      // Đợt 97 Y2: currentTime lúc blend cho pump event log.
      recordDrawnBlendWindow(clip.id, frameIdx, srcEl instanceof HTMLVideoElement ? srcEl.currentTime : null);
      recordTickCost({
        path: "plain-blend", total: performance.now() - clipT0, raw: 0, blend: blendMs,
        mask: 0, maskGet: 0, maskApply: 0, maskPut: 0, draw: 0, frameIdx,
        maskCanvas: 0,
        viaRvfc: snapshotsViaRvfc ? 1 : 0, wallMs: performance.now(),
      });
      // Snapshot = drawSrc gốc chưa blend (sau LUT/chroma).
      // Đợt 91 S1: bỏ qua khi pump rVFC sở hữu snapshot.
      if (!snapshotsViaRvfc) {
        updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length, frameIdx);
      }
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
  // cssFilter nên tông màu nhất quán. Đợt 90 R1: gate theo frame video.
  // Đợt 91 S1: bỏ qua khi pump rVFC sở hữu snapshot.
  if (ghostWeights.length > 0 && !snapshotsViaRvfc) {
    updateMotionBlurSnapshots(clip.id, drawSrc, dw, dh, ghostWeights.length, frameIdx);
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
  // Đợt 61 R8: image clip thiếu media (hoặc media sai kind) cũng là
  // "không vẽ được" — cùng quyết định với drawVideoClip (!item): ghi id
  // để badge effect tick sau không liệt kê effect lib của clip này.
  // Đợt 62 R6: ghi key INSTANCE như drawVideoClip (đóng nợ R8 §5.5).
  if (!item || item.kind !== "image") {
    tickSkippedClipIds.add(previewClipInstanceKey(clip));
    return;
  }
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
  // Đợt 88 closing: truyền clip.track để mask ảnh bám track như render
  // png/trackgeq (O2 §4); ảnh đứng yên, chỉ mask di chuyển.
  if (clip.mask) {
    const unit = maskedUnitSource(img, dx, dy, dw, dh, "", clip.mask, W, H, t - clip.start, clip.track);
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
  // Đợt 92 T2: đo tổng thời gian renderFrame mỗi tick (đối chiếu với
  // rAF gap — tick dài bao nhiêu thì rVFC bị gộp bấy nhiêu).
  const rfT0 = performance.now();
  const { width: W, height: H } = spec.meta;
  // K4 (đợt 27): tick mới thì reset cờ hold — drawVideoClip sẽ đặt lại
  // nếu tick này có clip rơi vào nhánh hold (badge đọc ở tick sau).
  // Đợt 60 Q6: reset cùng lúc tập clip không vẽ được (xem tickSkippedClipIds).
  tickHadHold = false;
  tickSkippedClipIds = new Set();
  // nền đen toàn canvas (tọa độ device px)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, vp.cw, vp.ch);
  // chuyển sang tọa độ project
  ctx.setTransform(vp.scale, 0, 0, vp.scale, vp.offX, vp.offY);
  // Đợt 63 R8: downscale project → viewport bằng bộ lọc chất lượng cao.
  // Mọi clip đều vẽ qua ctx này dưới transform vp.scale nên drawImage
  // cuối (unit → canvas chính) chính là bước downscale viewport — đợt
  // 62 R8 đo được sharpen preview lệch render ở downscale mạnh (delta
  // std gấp ~3.4× ở 2.6×) vì bộ lọc mặc định (low — gần point-sampling)
  // giữ lại hầu hết HF của delta sharpen, trong khi render downscale
  // bằng bilinear nên delta bị triệt tiêu. Probe Chrome 1254
  // (/tmp/r63-smoothing-probe.mjs, pattern HF 1280→489): quality
  // medium/high cho delta std [10.98, 5.49, 11.18] so với low
  // [19.48, 9.92, 20.33] (giảm ~44%; medium == high) và ảnh plain
  // khác low MAD 4.75 — tức "high" triệt HF đúng hướng cần. Đặt ở đây
  // (ctx chính, 1 lần/frame) thay vì effectCanvasSource — draw ở đó là
  // 1:1 (không resample) nên quality không có tác dụng (đợt 63 R8 đo
  // headed 1440 thấy số sharpen y hệt đợt 62 khi chỉ đặt ở effect
  // canvas). Ảnh hưởng mọi frame preview (không chỉ clip có effect) —
  // đo lại parity plain + sharpen ở nhiều mức downscale, xem LIMITS.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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
  recordRenderFrameCost({ ms: performance.now() - rfT0, wallMs: performance.now() });
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
  /**
   * Đợt 62 R6 — key INSTANCE của clip (`previewClipInstanceKey`: dấu
   * `__vcutInstanceKey` trên clip spec phẳng, hoặc đúng clip.id) — để
   * nhánh `.then` seek-thất-bại ghi đúng instance stall vào
   * `tickSkippedClipIds` (đóng nợ R8 §5.1) mà không lẫn instance khác
   * cùng leaf id (đóng nợ R8 §5.5).
   */
  clipKey: string;
  /**
   * Đợt 98 Z6 — id clip (key của pump rVFC) + cửa sổ timeline của clip
   * này, để hook kill-zombie ở syncMedia biết element đổi chủ sang clip
   * nào và chủ cũ còn active không (xem rvfcNoteVideoElementOwner).
   * clipId ≠ clipKey khi clip là lá nested (clipKey mang dấu instance).
   */
  clipId: string;
  start: number;
  duration: number;
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
          actives.push({ el, target, speed, reverse, clipKey: previewClipInstanceKey(clip), clipId: clip.id, start: clip.start, duration: clip.duration });
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
          actives.push({ el, target, speed, reverse, clipKey: previewClipInstanceKey(clip), clipId: clip.id, start: clip.start, duration: clip.duration });
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

// Đợt 101 C3 — target (giây, source time) của 1 element video xuôi tại
// playhead t, để bước đuôi ân hạn tính drift cho luật drift-gate (xem
// header C3 trong playheadHold90R2.ts). Đối chiếu ĐÚNG điều kiện chọn
// clip của collectActives (track video + clip video + t trong cửa sổ
// clip + item video + pool.videoFor(item) === el); không khớp thì trả
// null → caller bỏ qua gate (chạy như B3, tương thích ngược). Đợt 103
// E5 — caller truyền spec PHẲNG của tick trước (specForTail103E5, cùng
// spec mà collectActives dùng) thay vì spec gốc trong store: lá nested
// chỉ tồn tại ở spec phẳng nên helper mới tìm được clip (đóng fail-open
// nested của C3 — đo pre-fix: 7 lần đóng-drift-vượt / 8 lượt nested,
// 2 f4-like). Truyền spec gốc thô thì clip nested vẫn miss như trước
// (chỉ xảy ra ở tick đầu sau mount / sau khi user sửa project —
// identity lệch → fallback, đúng 1 tick). Chỉ chạy khi có đuôi đang mở
// (vòng đuôi gọi mỗi tick) nên không tốn gì lúc thường.
function driftTargetForTailElement101C3(
  spec: VideoSpec,
  pool: MediaPool,
  mediaByName: Map<string, MediaItem>,
  t: number,
  el: object,
): number | null {
  for (const track of spec.tracks) {
    if (track.kind !== "video") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "video") continue;
      if (t < clip.start || t >= clip.start + clip.duration) continue;
      const item = mediaByName.get(clip.src);
      if (!item || item.kind !== "video") continue;
      if (pool.videoFor(item) !== el) continue;
      // isSpeedable(clip) luôn true với clip video nên target luôn là
      // rampSourceTimeAt — đúng với mọi speed/reverse (như collectActives).
      return rampSourceTimeAt(clip, t);
    }
  }
  return null;
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
// Đợt 54 K9 — số tick liên tiếp drift vượt ngưỡng 0,35 s của nhánh
// forward (xem shouldIssueForwardReseek trong playheadPacing.ts): đếm
// chuỗi vượt ngưỡng không đứt đoạn cho từng element, để lọc jitter
// 1 tick. Chỉ nhánh forward dùng; nhánh reverse dùng shouldIssueStepSeek
// (ngưỡng nửa frame, không cần đếm xác nhận).
const forwardDriftOverCount = new WeakMap<object, number>();
// Đợt 53 J5 — bộ đếm số lần syncMedia phát seek lại khi đang phát
// (nhánh forceSeek hoặc drift > 0,35 s). Chỉ để harness đo: playhead
// chạy chậm hơn wall-clock (clamp dt 0,1 s khi FPS thấp) làm element
// audio/video phát đúng tốc độ thật rồi bị seek NGƯỢC về playhead liên
// tục — số này phơi qua window.__vcutSyncReseeks* để đo trước/sau fix.
// Tách video/audio: seek lại của AUDIO mới là tiếng bị giật nghe được;
// video có thể seek lại vì seek cũ chưa kịp về (lag decode) chứ không
// hẳn do playhead chậm — tách ra để khỏi quy sai nguyên nhân.
let syncReseekCount = 0;
let syncReseekVideoCount = 0;
let syncReseekAudioCount = 0;
// Đợt 84 L10 — bộ đếm RIÊNG cho đường phục hồi ended (restartEndedElement,
// đợt 80 H5): tách khỏi syncReseekVideoCount vì drift re-seek dùng chung
// counter đó nên không quy kết được restart đã bắn hay chưa (đợt 81 I7
// §2.3: counter tăng + hạ cánh đúng target là phù hợp nhưng không chắc
// chắn). Chỉ để harness đo, không phải tính năng người dùng; không đổi
// hành vi phát (nhánh restart vẫn đếm chung vào syncReseek* như trước).
let syncRestartEndedVideoCount = 0;
let syncRestartEndedAudioCount = 0;
// Đợt 85 M4 — dấu vết mức tick cho đường phục hồi ended (nợ W7 đợt 84 L10):
// ghi snapshot mỗi tick nhánh forward + sự kiện mỗi lần restart bắn, để
// phân biệt restart do `ended` thật (ct ≈ duration) vs do seek/reset
// (ended thoáng qua giữa clip). Vòng đệm có chặn (600 tick / 100 sự kiện),
// chỉ để harness đo qua window.__vcutRestartEndedTrace, không đổi hành vi.
const syncRestartTrace = new RestartTrace();
// ROUND63-R6 (1) — phục hồi lỗi decoder TRONG LÚC PHÁT: mốc drop gần nhất
// theo key instance clip (chặn tốc độ 1 drop / 1,5 s, xem
// playingDecoderRecovery63R6.ts) + TỔNG số element đã drop vì lỗi decoder
// dính trong lúc phát (đếm TÍCH LŨY từ lúc module nạp, cùng mẫu
// syncReseekCount; phơi qua PreviewIdleDebug.decoderErrorRecoveredPlaying
// để harness đo). Map key theo clipKey nên 2 instance cùng leaf id
// không chia chung ngân sách throttle.
const playingDecoderRecoveryLastDropMs = new Map<string, number>();
let decoderErrorRecoveredPlaying = 0;
// Đợt 86 N3 (W6): tổng số tick đang phát đã bỏ qua renderFrame vì có
// clip video xuôi đang seeking (đếm TÍCH LŨY từ lúc module nạp, cùng
// mẫu syncReseekCount; phơi qua window.__vcutSeekSkipRenderTicks86N3
// để harness đo). Không phải lỗi — tick bị bỏ qua vẫn chạy syncMedia
// + audio bình thường, chỉ canvas giữ nguyên frame trước seek.
let seekSkipRenderTicks86N3 = 0;
// Đợt 92 T3 — thống kê thời gian tick render (CHỈ ĐO, không đổi hành vi):
// mỗi tick phát ghi 1 mẫu: preMs = thời gian từ mốc rAF `now` tới lúc gọi
// renderFrame (flatten spec + badge + syncMedia + expose state), renderMs =
// thời gian renderFrame (toàn bộ drawImage/effects/mask), skipped = tick bỏ
// vẽ vì clip đang seeking (N3), held = tick có clip rơi nhánh hold (decoder
// tụt, vẽ frame giữ). Ring 600 mẫu, phơi qua
// window.__vcutRenderFrameTicks92T3 để probe tách thành phần lag canvas
// stale (rAF đói / tick nặng trước render / render nặng / hold-frame /
// drawImage trả frame cũ của decoder). Chi phí: 2 lần performance.now()
// + 1 push mỗi tick phát.
export interface RenderFrameTickStat92T3 {
  /** Mốc rAF của tick (ms, cùng đồng hồ performance.now). */
  t: number;
  /** ms từ mốc rAF tới lúc gọi renderFrame. */
  preMs: number;
  /** ms renderFrame (0 khi tick bỏ vẽ vì seeking). */
  renderMs: number;
  /** Tick bỏ vẽ vì clip video xuôi đang seeking (N3). */
  skipped: boolean;
  /** Tick có clip rơi nhánh hold (decoder tụt, vẽ frame giữ). */
  held: boolean;
}
const renderFrameTickStats92T3: RenderFrameTickStat92T3[] = [];
const RENDER_FRAME_TICK_STATS_92T3_MAX = 600;
function recordRenderFrameTick92T3(s: RenderFrameTickStat92T3): void {
  renderFrameTickStats92T3.push(s);
  if (renderFrameTickStats92T3.length > RENDER_FRAME_TICK_STATS_92T3_MAX) renderFrameTickStats92T3.shift();
}
// ROUND63-R6 (1b) — target nguồn ở tick lỗi trước, theo key instance
// clip: để nhận biết scrub-back 1 cú lớn (xem playingDecoderScrubbedBack)
// mà bỏ qua throttle khi user vừa nhảy playhead về vùng mới. Chỉ cập
// nhật trong nhánh lỗi (element đang lỗi) nên không tốn gì khi phát
// bình thường; dọn entry cũ nhất khi > 200 như map throttle.
const playingDecoderLastTargetByClipKey = new Map<string, number>();
// Đợt 39 T6: element vừa hoàn tất seek ở tick hiện tại — syncMedia ghi
// trước renderFrame, drawVideoClip đọc để bypass guard lag đúng tick đó
// (xem stepDrawAllowedWithCompletion). Set bị xóa đầu mỗi lần syncMedia
// chạy (1 lần/tick) nên không bao giờ rò sang tick sau; nhánh pause
// (playing=false) không set gì nên scrub/pause không bị ảnh hưởng.
// Đợt 86 N3 (W6): syncMedia trả về true khi tick phát này nên bỏ qua
// renderFrame (có clip video xuôi đang seeking — vẽ lúc này chỉ làm
// seek chậm thêm mà frame vẽ ra vẫn là frame cũ; xem
// seekSkipRender86N3.ts). Nhánh pause bỏ qua giá trị trả về (Seeker đã
// chờ seeked rồi mới vẽ).
const seekCompletedThisTick = new Set<object>();
// Đợt 91 S2 — như seekCompletedThisTick nhưng CHỈ nhánh forward (clip
// video xuôi): tick vừa hoàn tất seek xuôi. Tick sau dùng để arm theo
// dõi resume-stall (xem shouldHoldForResumeStall): nhánh reverse
// step-seek mỗi frame (currentTime lùi) nên KHÔNG được vào đây, nếu
// không tick sẽ giữ oan mỗi tick. Chỉ video (không audio — audio resume
// ngay, không gây lag canvas). Xóa đầu mỗi lần syncMedia như set trên.
const forwardSeekCompletedThisTick = new Set<object>();
// Đợt 103 E4 — element video xuôi đang lệch target mà tick này KHÔNG phát
// seek (drift vượt ngưỡng 0,35 s, chưa seeking): tick xác nhận drift đầu
// tiên (overCount 0→1) HOẶC tick bị ân hạn W5/X4/Y4 giữ overCount ở
// confirmTicks−1 — cả hai tick đều phải bỏ qua lần vẽ vì frame đã stale
// (xem shouldSkipRenderWhileDriftConfirmPending trong
// driftConfirmSkip103E4.ts). Set per-tick, xóa đầu mỗi lần syncMedia như
// 2 set trên; chỉ video xuôi (nhánh forward mới ghi — nhánh này là forward
// thuần, không reverse).
const forwardDriftConfirmPendingThisTick = new Set<object>();
// Đợt 103 E4 — tổng số tick phát đã bỏ qua renderFrame nhờ gate trên
// (đếm TÍCH LŨY từ lúc module nạp, cùng mẫu syncReseekCount; phơi qua
// window.__vcut103e4DriftConfirmSkips để harness đo). Không phải lỗi —
// tick bị bỏ qua vẫn chạy syncMedia + audio bình thường, chỉ canvas giữ
// nguyên frame trước nhảy (đúng nội dung frame giữ).
let driftConfirmSkipTicks103E4 = 0;
// Đợt 94 V2 — clip video xuôi đang active ở lần syncMedia gần nhất
// (xem nextResumeFreezeRearm): detector re-arm ở tick sau dùng tập này
// vì spec/pool/mediaByName chỉ được gán sau khối quyết định giữ trong
// tick — tín hiệu cũ 1 tick, cùng mẫu prevSkipRenderSeeking của giữ R2.
// Xóa đầu mỗi lần syncMedia như 2 set trên; chỉ video xuôi (không
// reverse — reverse step-seek mỗi frame nên không được theo dõi đóng băng).
const forwardVideoActives94V2 = new Set<object>();
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
  // Đợt 90 R2 — true = playhead đang bị đóng băng vì clip video xuôi
  // đang seeking (tick trước syncMedia báo skipRenderSeeking): nhánh
  // forward pause mọi active xuôi thay vì play() để audio không chạy
  // trước playhead đã đóng băng và video đã seek xong sớm không decode
  // thừa làm chậm seek còn lại. Hết giữ, nhánh forward resume bằng
  // play() như cũ.
  playheadHeld = false,
  // Đợt 91 S2 — true = playhead đang bị đóng băng vì resume-stall sau
  // seek (KHÔNG còn seeking, nhưng element video vừa seek xong chưa
  // tăng currentTime — xem shouldHoldForResumeStall): nhánh forward
  // KHÔNG pause VIDEO (pause thì currentTime không bao giờ tăng → giữ
  // mãi tới hết ân hạn) mà để video phát để decoder resume; chỉ pause
  // AUDIO để khỏi chạy trước playhead đã đóng băng.
  playheadHeldResume = false,
  // Đợt 95 W5 — tập element video xuôi vừa được detector re-arm Ở CÙNG
  // TICK (tickInner ghi trước khi gọi syncMedia): nhánh forward khoan
  // kích drift re-seek cho các element này 1 tick (xem graceTick của
  // shouldIssueForwardReseek). Không truyền ở đường pause (syncMedia
  // gọi với playing=false không đi nhánh forward phát) thì không ân hạn.
  resumeRearmedThisTick95W5?: ReadonlySet<object>,
  // Đợt 96 X4 — tập element video xuôi đang có watch resume-stall CÒN
  // SỐNG ở tick này (tickInner ghi sau khối dọn watch): nhánh forward
  // khoan kích drift re-seek cho các element này SUỐT thời gian watch
  // còn sống (mở rộng ân hạn 1 tick sau re-arm của W5 — xem graceTick
  // của shouldIssueForwardReseek + LIMITS đợt 96 X4 §2). Bao luôn tập
  // re-arm tick này. Không truyền ở đường pause thì không ân hạn.
  resumeWatchLive96X4?: ReadonlySet<object>,
  // Đợt 97 Y4 — tập element video xuôi đang trong ĐUÔI ÂN HẠN sau khi
  // watch resume-stall của nó hết VÌ element tăng >= 1 frame (tickInner
  // mở đuôi ở khối dọn watch, bước đuôi mỗi tick — xem
  // nextResumeGraceTail97Y4 + LIMITS đợt 97 Y4 §2): nhánh forward khoan
  // kích drift re-seek cho các element này cho tới khi watch mới arm
  // (tập X4 tiếp quản), decoder resume ổn định (tăng ở 2 tick riêng
  // biệt), hoặc quá trần 5000 ms. Vá lỗ hổng c1 đợt 96: stall mới sau
  // khi watch cũ hết vẫn đi đường drift re-seek cũ vì detector cần
  // 300 ms đóng băng mới arm lại trong khi seek chỉ cần 2 tick xác nhận.
  // Không truyền ở đường pause thì không ân hạn.
  resumeGraceTailLive97Y4?: ReadonlySet<object>,
): SkipRenderDecision {
  // Đợt 39 T6: mở đầu tick mới — cờ hoàn tất seek của tick trước hết hạn.
  seekCompletedThisTick.clear();
  forwardSeekCompletedThisTick.clear();
  forwardDriftConfirmPendingThisTick.clear();
  forwardVideoActives94V2.clear();
  const { actives, audioSources } = collectActives(spec, pool, mediaByName, t);
  const seen = new Set<HTMLVideoElement | HTMLAudioElement>();
  // ROUND63-R6 (1): element đã drop vì lỗi decoder dính trong tick này —
  // loại khỏi audioSources trước khi engine.update() (xem cuối hàm) để
  // engine khỏi tạo MediaElementSource mới cho element đã chết (rò node).
  const droppedPlayingEls = new Set<object>();
  for (const a of actives) {
    if (seen.has(a.el)) continue;
    seen.add(a.el);
    // Đợt 98 Z6: element video vừa đổi chủ sang clip này (kể cả clip kế
    // không blur) — kill pump zombie của clip cũ ngay tick sync này,
    // trước cả seek/draw (bắn cả khi tick bỏ render vì seeking, 86N3).
    // Chỉ video (audio không có pump); pump key theo clip.id nên dùng
    // a.clipId, không dùng clipKey/instance (xem rvfcNoteVideoElementOwner).
    if (a.el.tagName === "VIDEO") {
      rvfcNoteVideoElementOwner(a.el as HTMLVideoElement, a.clipId, t, a.start, a.duration);
    }
    // Đợt 94 V2 — ghi clip video xuôi đang active để detector re-arm ở
    // tick sau dùng (xem forwardVideoActives94V2).
    if (a.el.tagName === "VIDEO" && !a.reverse) forwardVideoActives94V2.add(a.el);
    // R1-063: KHÔNG gán el.volume ở đây nữa — AudioEngine nắm toàn quyền gain
    // qua GainNode (tránh nhân đôi). Trường hợp fallback (không có Web Audio),
    // engine.update() tự gán el.volume.
    // R1-013: đồng bộ playbackRate với clip.speed (giữ cao độ như render dùng atempo)
    // Đợt 55 L6: AUDIO phát xuôi KHÔNG gán ở đây — nhánh forward bên
    // dưới tự gán rate catch-up (forwardCatchUpRate); gán speed ở đây
    // rồi gán lại catch-up trong cùng tick sẽ làm playbackRate đảo
    // 2 lần/tick (ratechange liên tục). Các trường hợp còn lại
    // (video, reverse, pause) vẫn gán speed như cũ.
    const forwardAudioManaged =
      playing && !reversePlayback && !a.reverse && a.el.tagName === "AUDIO";
    try {
      if (!forwardAudioManaged && a.el.playbackRate !== a.speed) a.el.playbackRate = a.speed;
      // preservesPitch=true giữ cao độ khi đổi tốc độ (giống atempo của render)
      if ("preservesPitch" in a.el) (a.el as HTMLVideoElement).preservesPitch = true;
    } catch {
      /* bỏ qua nếu trình duyệt không hỗ trợ */
    }
    if (playing) {
      // ROUND63-R6 (1) — lỗi decoder TRONG LÚC PHÁT (đóng nợ đợt 62 §4
      // mục 6 = LIMITS R6 §5.1): element đã `error !== null` giữa chừng
      // đang phát thì play() trả rejected promise mỗi tick, seek kẹt
      // `seeking=true` mãi không xong (đo baseline headed: CT đóng băng
      // ở 3.1, draw đóng băng, hold tăng mãi, không hồi phục dù playhead
      // đã qua vùng hỏng). Chỉ đường playing mới tới đây — nhánh pause
      // bên dưới giữ nguyên đường R6 (drop sau seek thất bại đã chứng
      // minh), không drop ở đây để khỏi cắt seek của Seeker.
      //   - "fallback-loading" (đang tải resource mới, vd fallback proxy
      //     vừa đổi src): CHƯA kết luận — chờ load xong, không drop oan
      //     element đang fallback (đo headed X1: error reset về null
      //     trong ≤ 1 frame sau khi đổi src, không có mẫu nào error +
      //     networkState LOADING cùng lúc — guard này là phòng thủ).
      //   - "stuck": drop element (cùng mẫu R6: pool.dropElement +
      //     engine.releaseElement) nhưng CHẶN 1 lần / 1,5 s cho mỗi clip
      //     — trong vùng hỏng thì element mới cũng lỗi lại, không chặn
      //     sẽ tạo element mới mỗi tick. Ngoại lệ duy nhất: scrub-back
      //     1 cú lớn (target lùi > 1 s trong 1 tick — xem
      //     playingDecoderScrubbedBack) thì drop ngay, không chờ
      //     throttle: user vừa nhảy playhead về vùng mới, chờ đủ 1,5 s
      //     thì playhead đã chạy khỏi vùng tốt (đo headed P3). Không cap
      //     tổng: sau khi playhead qua vùng hỏng, lần drop kế tiếp
      //     (≤ 1,5 s sau) tạo element mới seek tới target vùng tốt và vẽ
      //     lại (xem LIMITS đợt này §1.1).
      // Dù drop hay chưa tới lượt thì tick này cũng bỏ qua active đó
      // (continue): play()/seek trên element lỗi chỉ thêm rejected
      // promise + seek kẹt. Trước khi bỏ qua, giữ tươi 2 map nhịp
      // (steppingPrevSeeking + forwardDriftOverCount) để lúc hồi phục
      // không đọc giá trị cũ từ trước lúc lỗi.
      const errStatus = playingDecoderErrorStatus(a.el);
      if (errStatus !== "healthy") {
        try {
          steppingPrevSeeking.set(a.el, a.el.seeking);
        } catch {
          /* map WeakMap lỗi thì bỏ qua, không phá tick */
        }
        forwardDriftOverCount.set(a.el, 0);
        // ROUND63-R6 (1b) — scrub-back: target lùi > 1 s trong 1 tick
        // nghĩa là user vừa nhảy playhead về vùng mới (không phải kẹt
        // cũ) — drop ngay, không chờ throttle. Phát ngược thì target
        // lùi ~1 frame/tick nên không chạm ngưỡng; phát xuôi thì target
        // tăng. Chỉ 1 lần drop tức thì cho mỗi cú scrub (sau drop,
        // prevTarget ≈ target hiện tại nên lần lỗi sau lại qua throttle).
        const prevTarget = playingDecoderLastTargetByClipKey.get(a.clipKey);
        playingDecoderLastTargetByClipKey.set(a.clipKey, a.target);
        if (playingDecoderLastTargetByClipKey.size > 200) {
          const oldest = playingDecoderLastTargetByClipKey.keys().next();
          if (!oldest.done) playingDecoderLastTargetByClipKey.delete(oldest.value);
        }
        const scrubbedBack = playingDecoderScrubbedBack(prevTarget, a.target);
        if (
          errStatus === "stuck" &&
          (scrubbedBack ||
            playingDecoderRetryDue(Date.now(), playingDecoderRecoveryLastDropMs.get(a.clipKey)))
        ) {
          try {
            if (pool.dropElement(a.el)) {
              // Chỉ ghi mốc khi drop thật (dropElement false = element lạ
              // không thuộc pool — không tính vào ngân sách throttle).
              playingDecoderRecoveryLastDropMs.set(a.clipKey, Date.now());
              // Dọn map throttle khi phình (clip đổi liên tục): giữ ≤ 200
              // entry, xóa cũ nhất (Map giữ thứ tự chèn).
              if (playingDecoderRecoveryLastDropMs.size > 200) {
                const oldest = playingDecoderRecoveryLastDropMs.keys().next();
                if (!oldest.done) playingDecoderRecoveryLastDropMs.delete(oldest.value);
              }
              decoderErrorRecoveredPlaying++;
              droppedPlayingEls.add(a.el);
              try {
                engine.releaseElement(a.el);
              } catch {
                /* engine chưa có graph cho element này thì thôi */
              }
            }
          } catch {
            /* drop thất bại thì giữ element cũ, tick sau thử lại */
          }
        }
        continue;
      }
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
        // Đợt 54 K9 — chặn nhịp nhánh forward (mirror nhánh reverse L2/T6,
        // xem shouldIssueForwardReseek trong playheadPacing.ts): KHÔNG
        // phát seek mới khi seek cũ còn bay (el.seeking) hoặc tick vừa
        // hoàn tất seek, và drift phải vượt ngưỡng 2 tick liên tiếp mới
        // seek (lọc jitter 1 tick). Đo thật trước sửa: audio re-seek
        // 11–12/lượt, element AUDIO seeking 30–40% số mẫu — seek chồng
        // tự restart decoder (xem LIMITS K9 §2). forceSeek giữ nguyên
        // (cạnh lên của nút Phát, seek ngay, không qua chặn nhịp).
        if (forceSeek) {
          // Đợt 53 J5 — đếm lần seek lại khi đang phát (xem syncReseekCount).
          syncReseekCount++;
          if (a.el.tagName === "VIDEO") syncReseekVideoCount++;
          else syncReseekAudioCount++;
          forwardDriftOverCount.set(a.el, 0);
          try {
            a.el.currentTime = a.target;
          } catch {
            /* seek chưa sẵn sàng */
          }
        } else {
          // ROUND63-R6 (1c) — element MỚI (chưa từng qua tick phát nào —
          // vd vừa tạo lại sau drop vì lỗi decoder, hoặc clip vừa active
          // giữa lúc phát): seek NGAY tới target nếu lệch > 0,35 s, không
          // chờ xác nhận 2 tick như element cũ. Nếu không, tick đầu tiên
          // element vẽ frame ở currentTime 0 (chưa seek) — frame sai vị
          // trí, lại ghi đè frame giữ tốt trong hold cache (đo headed P1
          // run5: draw tăng 1 ở ph 9,57 với CT 0,124 ngay sau drop).
          // steppingPrevSeeking chưa có entry ⟺ element chưa từng qua
          // tick phát (map được ghi ở mọi nhánh playing mỗi tick) — kiểm
          // tra TRƯỚC khi set ở dòng dưới. forceSeek ở nhánh trên đã lo
          // cạnh lên của nút Phát nên không đụng.
          const isFreshElement = !steppingPrevSeeking.has(a.el);
          const wasSeekingFwd = steppingPrevSeeking.get(a.el) ?? false;
          steppingPrevSeeking.set(a.el, a.el.seeking);
          const completedFwd = justCompletedSeek(wasSeekingFwd, a.el.seeking);
          // Đợt 91 S2 — ghi tick vừa hoàn tất seek xuôi của clip video
          // (chỉ nhánh forward, chỉ video): tick sau arm theo dõi
          // resume-stall. Nhánh reverse không ghi (xem khai báo set).
          if (completedFwd && a.el.tagName === "VIDEO") forwardSeekCompletedThisTick.add(a.el);
          const freshSeekDue =
            isFreshElement && !a.el.seeking && Math.abs(a.el.currentTime - a.target) > 0.35;
          // Đợt 95 W5 — ân hạn 1 tick sau re-arm (xem graceTick của
          // shouldIssueForwardReseek): element vừa được detector arm
          // watch mới ở cùng tick thì khoan kích drift re-seek để
          // playhead đã giữ kịp đuổi theo element. Chỉ đường drift
          // qua helper mới được ân hạn — freshSeekDue (element mới
          // chưa từng qua tick phát nào) không thể có re-arm cùng tick
          // (detector chưa có track cho nó) nên không cần ân hạn.
          // Đợt 96 X4 — ân hạn SUỐT thời gian watch còn sống (xem
          // resumeWatchLive96X4): watch vừa arm ở tick này đã nằm trong
          // tập live nên 2 điều kiện gộp làm một; ân hạn 1 tick của W5
          // chỉ là trường hợp riêng của tập này.
          // Đợt 97 Y4 — đuôi ân hạn sau khi watch hết vì element tăng
          // (xem resumeGraceTailLive97Y4): element vừa burst qua
          // completion rồi stall lại ở ct mới vẫn được ân hạn cho tới
          // khi watch mới arm — vá lỗ hổng c1 đợt 96.
          // Đợt 103 E4 — đếm drift TRƯỚC quyết định để truyền vào helper
          // (đọc 1 lần vào biến để quyết định và ghi pending dùng cùng giá
          // trị — hành vi không đổi so với đọc inline trước đây).
          const prevDriftOverCount103E4 = forwardDriftOverCount.get(a.el) ?? 0;
          // Đợt 103 E4 (mở rộng sau đo e4x2) — ân hạn drift re-seek có đang
          // giữ element này không (xem graceTick của shouldIssueForwardReseek).
          const graceActive103E4 =
            resumeRearmedThisTick95W5?.has(a.el) === true ||
            resumeWatchLive96X4?.has(a.el) === true ||
            resumeGraceTailLive97Y4?.has(a.el) === true;
          const decision = freshSeekDue
            ? { seek: true, overCount: 0 }
            : shouldIssueForwardReseek(
                a.el.seeking,
                completedFwd,
                Math.abs(a.el.currentTime - a.target),
                prevDriftOverCount103E4,
                FORWARD_RESEEK_THRESHOLD_S,
                FORWARD_RESEEK_CONFIRM_TICKS,
                graceActive103E4,
              );
          forwardDriftOverCount.set(a.el, decision.overCount);
          // Đợt 103 E4 — ghi element video xuôi đang lệch target mà tick này
          // KHÔNG phát seek (seek chưa phát, element chưa seeking): tick này
          // phải bỏ qua lần vẽ, nếu không đường tick vẽ frame cũ lên canvas.
          // Hai trường hợp (cùng vị ngữ overCount >= 1 — theo cấu trúc
          // shouldIssueForwardReseek thì overCount >= 1 ⟺ drift vượt ngưỡng
          // ở tick này mà seek không phát, không seeking, không vừa hoàn
          // tất seek):
          //  (a) tick xác nhận drift đầu tiên (chuyển 0→1, chờ tick 2 mới
          //      phát seek) — nợ D3 §5 mục 1, đo hồi cứu trên dữ liệu D3:
          //      tick-confirmed 10/60 biên seek-across, lượt dày d3x4 7/11.
          //  (b) tick bị ÂN HẠN giữ overCount ở confirmTicks−1 (grace W5/X4/
          //      Y4: seek bị hoãn NHIỀU tick liền trong khi element vẫn lệch
          //      target) — đo được ở e4x2 k=3/k=23 sau khi chỉ chặn (a):
          //      k=3 vẽ stale 4 tick (ct 2,72→2,99, +101..+409 ms sau nhảy)
          //      trước khi element chạm ended và restart H5 cứu; k=23 vẽ
          //      stale 3 tick (ct 2,88, +290..+494 ms). Gate chỉ chặn (a)
          //      để lọt (b) nên phải mở rộng ra cả (b).
          // Giới hạn: (b) có thể kéo dài tới trần grace (watch/tail 5000 ms)
          // trong trường hợp xấu — canvas đóng băng (giữ frame trước nhảy)
          // thay vì vẽ frame sai; đo thực tế ở đây ~300–500 ms. Chỉ video
          // (audio không vẽ gì). Nhánh này là forward thuần (không reverse).
          if (
            !decision.seek &&
            decision.overCount >= 1 &&
            a.el.tagName === "VIDEO"
          ) {
            forwardDriftConfirmPendingThisTick.add(a.el);
          }
          if (decision.seek) {
            // Đợt 53 J5 — đếm lần seek lại khi đang phát (xem syncReseekCount).
            syncReseekCount++;
            if (a.el.tagName === "VIDEO") syncReseekVideoCount++;
            else syncReseekAudioCount++;
            try {
              a.el.currentTime = a.target;
            } catch {
              /* seek chưa sẵn sàng */
            }
          }
          // Đợt 55 L6 — catch-up rate cho AUDIO (xem forwardCatchUpRate
          // trong playheadPacing.ts): drift gốc là đồng hồ audio chạy
          // chậm đều ~0,5× dưới tải CPU, nên bù bằng tốc độ thay vì
          // seek. Chỉ nhánh forward + AUDIO; video giữ rate = speed
          // (gán ở đầu vòng lặp). Không bù khi đang seeking / vừa
          // hoàn tất seek / drift ngoài (0,08, 0,35] — helper quyết.
          if (a.el.tagName === "AUDIO") {
            try {
              const rate = forwardCatchUpRate(
                a.speed,
                a.target - a.el.currentTime,
                a.el.seeking,
                completedFwd,
              );
              if (a.el.playbackRate !== rate) a.el.playbackRate = rate;
            } catch {
              /* bỏ qua nếu trình duyệt không hỗ trợ */
            }
          }
        }
        // Đợt 80 H5 — WebKitGTK loop kẹt (W3, xem
        // docs/PHASE9_ROUND80_H5_WEBKIT_LOOP_LIMITS.md): element có thể
        // chạm `ended` trong lúc clip còn active (vd element chạy tới
        // cuối nguồn trước khi playhead rời clip do làm tròn tốc độ /
        // speed ramp). `play()` sau `ended` tuy khởi động lại được trên
        // WebKitGTK (đo đợt này: clip A/B/C loop lại được) nhưng phát
        // lại TỪ 0 rồi mới re-seek theo drift — mất 2+ tick và nhảy về
        // frame đầu. Seek thẳng tới target trước rồi để `play()` bên
        // dưới resume: đúng vị trí timeline ngay trong cùng tick. Chỉ
        // kích hoạt khi element thật sự ended (hiếm: tick biên), không
        // chạm đường phát thường. Không dùng thuộc tính `loop` — chính
        // nó mới là thứ kẹt trên WebKitGTK, và preview vốn không dùng
        // nó (chạy bằng seek theo playhead). Nhánh reverse tự cứu bằng
        // step-seek (target lùi khỏi duration) nên không cần ở đây.
        // Đợt 85 M4 — ghi dấu vết tick TRƯỚC khi xét restart (nợ W7):
        // snapshot này là bằng chứng duy nhất về ended/seeking/ct/dur
        // đúng tick restart bắn; recordRestart dùng lại cùng snapshot
        // (không ghi tick mới) để prev/streak khớp đúng tick đó.
        const restartTick = syncRestartTrace.recordTick({
          wallMs: Date.now(),
          key: `${a.el.tagName}:${a.clipKey}`,
          ended: a.el.ended,
          seeking: a.el.seeking,
          ct: a.el.currentTime,
          dur: a.el.duration,
          paused: a.el.paused,
          readyState: a.el.readyState,
          target: a.target,
          playhead: t,
        });
        if (restartEndedElement(a.el, a.target)) {
          syncRestartTrace.recordRestart(restartTick.snap, restartTick);
          // Đếm như một lần re-seek lúc phát (cùng nghĩa với các đường
          // forceSeek/drift-seek phía trên).
          syncReseekCount++;
          if (a.el.tagName === "VIDEO") {
            syncReseekVideoCount++;
            syncRestartEndedVideoCount++; // Đợt 84 L10: đếm riêng đường restart
          } else {
            syncReseekAudioCount++;
            syncRestartEndedAudioCount++;
          }
        }
        if (playheadHeld) {
          if (playheadHeldResume && a.el.tagName === "VIDEO") {
            // Đợt 91 S2 — giữ vì resume-stall sau seek (không còn
            // seeking): video PHẢI tiếp tục phát để decoder resume —
            // pause thì currentTime không bao giờ tăng, watch không bao
            // giờ nhả trước ân hạn. Hết giữ, video đã phát sẵn nên
            // không cần resume lại.
            if (a.el.paused) {
              void a.el.play().catch(() => {
                /* trình duyệt chặn autoplay — người dùng bấm play là có gesture nên hiếm */
              });
            }
          } else {
            // Đợt 90 R2 — playhead đang đóng băng chờ seek: pause active này
            // (kể cả element đang seeking — pause KHÔNG hủy seek, cùng mẫu
            // pause-trước-seek của seek.ts; probe90r2 đo thật seek vẫn xong).
            // Audio không chạy trước playhead; video đã seek xong sớm không
            // decode thừa làm chậm seek còn lại. Hết giữ, nhánh này resume
            // bằng play() như cũ. (Đợt 91 S2: AUDIO cũng pause khi giữ vì
            // resume-stall — chỉ VIDEO được miễn để decoder resume.)
            try {
              a.el.pause();
            } catch {
              /* bỏ qua */
            }
          }
        } else if (a.el.paused) {
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
  // ROUND63-R6 (1): element đã drop vì lỗi decoder dính trong tick này
  // (droppedPlayingEls) không còn trong pool — loại khỏi audioSources
  // trước khi engine.update(): nếu không, update() gọi nodeFor() và tạo
  // MediaElementSourceNode MỚI cho element đã chết (releaseElement vừa
  // gỡ graph cũ) — rò 5 node / lần drop, nodes Map giữ element chết tới
  // dispose toàn cục. Nhánh pause không drop nên tập rỗng và giữ nguyên
  // tham chiếu audioSources (không copy mảng mới mỗi tick).
  const liveAudioSources =
    droppedPlayingEls.size === 0
      ? audioSources
      : audioSources.filter((s) => !droppedPlayingEls.has(s.el));
  const outSources = playing && reversePlayback
    ? liveAudioSources.map((s) => ({ ...s, gain: 0 }))
    : playing
    ? (() => {
        const revEls = new Set(
          actives.filter((a) => a.reverse).map((a) => a.el),
        );
        return liveAudioSources.map((s) =>
          revEls.has(s.el) ? { ...s, gain: 0 } : s,
        );
      })()
    : liveAudioSources;
  // R1-063: đẩy gain vào Web Audio graph (mượt bằng setTargetAtTime) + VU meter.
  engine.update(outSources);
  if (!playing) pool.pauseAll();
  // Đợt 86 N3 (W6): cờ bỏ qua render của tick này — chỉ có ý nghĩa khi
  // đang phát (nhánh pause bỏ qua giá trị trả về). Tính SAU mọi seek/
  // play của tick (seek vừa gán làm seeking=true ngay) để tick đang
  // seeking thì bỏ qua vẽ, tick seek vừa xong thì vẽ lại bình thường.
  // Đợt 103 E4: cộng thêm gate tick lệch target chưa phát seek — element
  // video xuôi chưa seeking mà frame đã stale (tick xác nhận drift đầu tiên
  // HOẶC tick bị ân hạn W5/X4/Y4 giữ overCount); bỏ qua lần vẽ này để khỏi
  // vẽ frame cũ lên canvas (canvas giữ frame trước nhảy, đúng nội dung
  // frame giữ). Đếm dồn lên window.__vcut103e4DriftConfirmSkips để harness đo.
  const skipRenderDriftConfirm103E4 = shouldSkipRenderWhileDriftConfirmPending(
    reversePlayback,
    actives.map((a) => ({
      tag: a.el.tagName,
      reverse: a.reverse,
      el: a.el,
    })),
    forwardDriftConfirmPendingThisTick,
  );
  if (skipRenderDriftConfirm103E4) {
    driftConfirmSkipTicks103E4++;
    if (typeof window !== "undefined") {
      (window as unknown as { __vcut103e4DriftConfirmSkips?: number }).__vcut103e4DriftConfirmSkips =
        driftConfirmSkipTicks103E4;
    }
  }
  // Đợt 110 L1 — TÁCH tín hiệu: gate E4 chỉ bỏ vẽ, KHÔNG được kích giữ R2
  // (xem combineSkipRender trong driftConfirmSkip103E4.ts — trước đây
  // boolean gộp N3||E4 làm prevSkipRenderSeeking, E4 kích giữ R2 -> pause
  // element -> detector re-arm mù -> CAP 5 s trong đuôi Y4; đo K1).
  // Nhánh pause bỏ qua giá trị trả về nên chỉ nhánh phát đọc 2 cờ này.
  return combineSkipRender(
    shouldSkipRenderWhileSeeking(
      reversePlayback,
      actives.map((a) => ({
        tag: a.el.tagName,
        seeking: a.el.seeking,
        reverse: a.reverse,
      })),
    ),
    skipRenderDriftConfirm103E4,
  );
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
  // Đợt 73 A9 (S4): overlay vùng an toàn trên preview — bật/tắt + nền tảng
  // chọn tay, nhớ qua localStorage (không thuộc spec project). presetId
  // đồng bộ từ ExportPanel qua exportPresetSelection (pub/sub module).
  const [safeAreaOn, setSafeAreaOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem("vcut.safeArea") === "1";
    } catch {
      return false;
    }
  });
  const [safeAreaChoice, setSafeAreaChoice] = useState<string>(() => {
    try {
      return localStorage.getItem("vcut.safeAreaPlatform") ?? "auto";
    } catch {
      return "auto";
    }
  });
  const [exportPresetId, setExportPresetId] = useState<string>(() =>
    getSelectedExportPreset(),
  );
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });
  const previewSpecMeta = useStore((s) => s.spec.meta);
  useEffect(
    () =>
      subscribeSelectedExportPreset(() =>
        setExportPresetId(getSelectedExportPreset()),
      ),
    [],
  );
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWrapSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Nền tảng hiệu lực: chọn tay > preset xuất đang chọn > đoán theo tỉ lệ.
  const safeAreaPlatformId =
    safeAreaChoice !== "auto"
      ? safeAreaChoice
      : (safeAreaPlatformForPreset(exportPresetId)?.id ?? "auto");
  const safeAreaVideoRect = letterboxRect(
    wrapSize.w,
    wrapSize.h,
    previewSpecMeta.width,
    previewSpecMeta.height,
  );
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
  // Đợt 103 E5 — spec phẳng + spec gốc nó được flatten từ, của tick
  // trước (xem bước đuôi ở tickInner): lá nested chỉ tồn tại ở spec
  // phẳng nên helper drift mới tìm được clip (đóng fail-open nested
  // của C3 — đo pre-fix: nested 7 lần đóng-drift-vượt / 8 lượt,
  // 2 f4-like, 1 kẹt seek ~2,5 s). Ghi cả spec gốc để kiểm identity
  // trước khi dùng (user sửa project → object mới → fallback spec thô).
  const lastFlatSpec103E5Ref = useRef<{ raw: VideoSpec; flat: VideoSpec } | null>(null);
  // Đợt 58 O3: khóa riêng cho tập skipped/skippedReasons của failsoft
  // (tách khỏi khóa curve để đổi tập nào thì chỉ toast lại tập đó;
  // badge thì gộp chung — xem khối failsoft dưới vòng lặp).
  const lastFailsoftSkippedKeyRef = useRef<string>("");
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
  // Đợt 65 S6 — key của tập ghi chú trial-decode timeout (fail-open):
  // toast 1 lần mỗi khi tập ghi chú đổi (mẫu lastDecodeAheadWarnKeyRef).
  const lastTrialDecodeTimeoutKeyRef = useRef<string>("");
  // Đợt 71 Y5 — trạng thái toast dính "đang kiểm tra keyframe" (trial
  // chạy lâu): id toast đang hiện (null = chưa hiện), hẹn giờ chờ qua
  // ngưỡng 5 s, và interval cập nhật số giây đã trôi qua mỗi 1 s.
  // Tất cả nằm trong ref để effect/subscription không re-render React.
  const trialRunningToastIdRef = useRef<number | null>(null);
  const trialRunningDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trialRunningTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trialRunningRunIdRef = useRef<number | null>(null);
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
  // (keyed). Đợt 80 H7 — chuỗi cổng (warnings) nay dịch qua key
  // reverseGate.* (warningKeys song song 1:1 với warnings, xem
  // reversePreviewGate.ts): locale en không còn thấy câu VI. Khi
  // decision cũ chưa có warningKeys thì rơi về nguyên văn chuỗi cổng
  // (hành vi T2 cũ). Mọi chuỗi mới (nhãn toggle/badge, lý do chặn,
  // toast chặn/tắt) đều qua i18n key decodeahead.* (vi/en).
  const refreshDecodeAheadUi = () => {
    const st = reverseDecodeAheadStatus();
    // Đợt 80 H7 — dòng cảnh báo đã dịch theo locale hiện tại (dùng key
    // khi có, fallback nguyên văn khi decision cũ chưa mang key).
    const warningLines =
      st.warningKeys.length > 0
        ? st.warningKeys.map((k) => i18nT(k))
        : st.warnings;
    const warningText = warningLines.join("\n");
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
        ? [warningText, blockedLines].filter(Boolean).join("\n")
        : st.wanted
          ? st.controllers.length > 1
            ? blockedLines || reasonLabels.join("; ")
            : reasonLabels.join("; ")
          : i18nT("decodeahead.toggleHint");
      if (btn.title !== title) btn.title = title;
    }
    // Toast cảnh báo cổng (giữ đúng hành vi T2).
    const warnKey = warningText;
    if (warnKey !== lastDecodeAheadWarnKeyRef.current) {
      lastDecodeAheadWarnKeyRef.current = warnKey;
      for (const w of warningLines) pushToast(w, "info");
    }
    // Đợt 65 S6 — toast trial-decode timeout (fail-open): keyframe đầu
    // chưa kịp kiểm chứng, file vẫn mở bình thường — báo user 1 lần mỗi
    // khi tập ghi chú đổi (keyed, mẫu warnKey ở trên; chuỗi T3 đã
    // localize, hiển thị nguyên văn).
    // Đợt 67 U5 — refresh này chạy ở 3 đường: tick rAF khi phát ngược,
    // ngay sau bấm toggle, VÀ ngay khi note mới được set (subscriber
    // đăng ký ở effect [previewLang]) — nên toast hiện cả khi vòng lặp
    // đang ngủ (clip ngắn / không phát ngược), không chờ lần refresh
    // tiếp theo như trước (nợ T6 §3). Đổi clip thì key đổi theo ghi chú mới.
    const trialNotes = reverseTrialDecodeTimeoutNotes();
    const trialNoteKey = trialNotes.join("\n");
    if (trialNoteKey !== lastTrialDecodeTimeoutKeyRef.current) {
      lastTrialDecodeTimeoutKeyRef.current = trialNoteKey;
      for (const n of trialNotes) pushToast(n, "info");
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
        title = [warningText, blockedLines]
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
  // Đợt 67 U5 — đăng ký nhận ghi chú trial-decode timeout mới (nợ T6
  // §3): khi trial timeout (fail-open) mà vòng lặp đang NGỦ (clip ngắn
  // hơn thời gian trial / không phát ngược), toast trước đây không hiện
  // cho tới lần refresh tiếp theo (bấm toggle / phát lại). Nay subscriber
  // gọi refreshDecodeAheadUi() NGAY lúc note được set → toast hiện trong
  // lúc import/mở, không phụ thuộc vòng lặp. Logic keyed trong
  // refreshDecodeAheadUi vẫn chống toast trùng. Đăng ký lại mỗi lần đổi
  // ngôn ngữ để closure luôn dùng i18nT mới nhất (cleanup hủy đăng ký cũ).
  useEffect(() => {
    refreshDecodeAheadUi();
    return subscribeTrialDecodeTimeoutNotes(() => refreshDecodeAheadUi());
  }, [previewLang]);

  // Đợt 71 Y5 — toast trạng thái khi trial keyframe chạy lâu (nợ đợt 70
  // §4 mục 8): 1 keyframe = 1 lần decode() duy nhất nên KHÔNG có % tiến
  // độ thật — toast này chỉ báo giai đoạn decode + số giây đã trôi qua.
  //   - Trial xong trước ngưỡng 5 s → không toast gì (trial thường chỉ
  //     ~10 ms–1 s, không làm phiền user).
  //   - Trial còn chạy sau 5 s → toast DÍNH "Đang kiểm tra keyframe đầu
  //     (… MiB)… N giây (chưa có % tiến độ)", cập nhật N mỗi 1 s tại
  //     chỗ (updateToast, không push toast mới, không nhấp nháy).
  //   - Trial xong/lỗi/timeout (run biến mất khỏi registry) → đóng
  //     toast ngay; user bấm × đóng tay thì không hiện lại cho run đó
  //     (tick thấy updateToast false thì dừng, tôn trọng ý user).
  //   - Nhiều run cùng lúc thì hiện run cũ nhất; đổi ngôn ngữ giữa
  //     chừng thì effect chạy lại: toast cũ đóng, hẹn giờ 5 s chạy lại
  //     từ đầu (xem LIMITS Y5).
  // Đợt 72 Z5 — 3 thay đổi (đóng nợ đợt 71 §5 mục 5):
  //   (a) Toast nay bao cả GIAI ĐOẠN FETCH remainder: "Đang tải
  //       keyframe đầu (x / 64,0 MiB)… N giây" với x là số MiB đã
  //       fetch THẬT theo chunk (không phải % giả); khi fetch xong
  //       thì cùng 1 toast đổi sang nội dung decode như Y5.
  //   (b) Đổi ngôn ngữ giữa trial: toast KHÔNG đóng nữa — effect
  //       chính chỉ chạy 1 lần lúc mount (dep []), effect riêng theo
  //       [previewLang] dịch lại nội dung tại chỗ (updateToast),
  //       giữ nguyên hẹn giờ 5 s + số giây đã trôi qua.
  //   (c) Nhiều run cùng lúc: toast vẫn báo run cũ nhất, nhưng thêm
  //       hậu tố "(+N file khác đang kiểm tra)" để user biết còn run
  //       khác đang chạy (trước đây im lặng về các run còn lại).
  // Hàm dựng nội dung toast (đặt ngoài effect để cả effect chính +
  // effect đổi ngôn ngữ dùng chung; i18nT đọc ngôn ngữ hiện tại động
  // nên không bị kẹt chuỗi cũ khi đổi lang).
  const trialRunningMessage = (run: TrialDecodeRun, totalRuns: number): string => {
    const elapsed = String(
      Math.max(0, Math.floor((Date.now() - run.phaseStartedAtMs) / 1000)),
    );
    const base =
      run.phase === "fetch"
        ? i18nT("gop.trial.fetching", {
            fetched: (run.fetchedBytes / 1048576).toFixed(1),
            size: (run.sampleBytes / 1048576).toFixed(1),
            elapsed,
          })
        : i18nT("gop.trial.running", {
            size: (run.sampleBytes / 1048576).toFixed(1),
            elapsed,
          });
    return totalRuns > 1
      ? `${base} ${i18nT("gop.trial.others", { count: String(totalRuns - 1) })}`
      : base;
  };
  useEffect(() => {
    const clearTrialRunningTimers = (): void => {
      if (trialRunningDelayRef.current !== null) {
        clearTimeout(trialRunningDelayRef.current);
        trialRunningDelayRef.current = null;
      }
      if (trialRunningTickRef.current !== null) {
        clearInterval(trialRunningTickRef.current);
        trialRunningTickRef.current = null;
      }
    };
    const dismissTrialRunningToast = (): void => {
      if (trialRunningToastIdRef.current !== null) {
        dismissToast(trialRunningToastIdRef.current);
        trialRunningToastIdRef.current = null;
      }
      trialRunningRunIdRef.current = null;
    };
    const syncTrialRunningToast = (): void => {
      const runs = activeTrialDecodeRuns();
      if (runs.length === 0) {
        clearTrialRunningTimers();
        dismissTrialRunningToast();
        return;
      }
      const run = runs[0]; // run cũ nhất
      if (trialRunningToastIdRef.current !== null) {
        // Đã hiện: cập nhật nội dung tại chỗ (đổi phase fetch →
        // decode, đổi run cũ nhất, đổi số file khác) — updateToast
        // không emit khi nội dung không đổi nên gọi mỗi lần notify
        // (mỗi chunk fetch) cũng không spam re-render.
        if (
          !updateToast(
            trialRunningToastIdRef.current,
            trialRunningMessage(run, runs.length),
          )
        ) {
          // Toast đã bị đóng tay (bấm ×): dừng tick, không push lại
          // cho run này (tôn trọng ý user — như tick ở dưới).
          clearTrialRunningTimers();
          trialRunningToastIdRef.current = null;
          trialRunningRunIdRef.current = null;
        } else {
          trialRunningRunIdRef.current = run.id;
        }
        return;
      }
      if (trialRunningDelayRef.current !== null) return; // đang chờ qua ngưỡng
      trialRunningDelayRef.current = setTimeout(() => {
        trialRunningDelayRef.current = null;
        const still = activeTrialDecodeRuns();
        if (still.length === 0) return;
        const cur = still[0];
        trialRunningRunIdRef.current = cur.id;
        trialRunningToastIdRef.current = pushToast(
          trialRunningMessage(cur, still.length),
          "info",
          { sticky: true },
        );
        trialRunningTickRef.current = setInterval(() => {
          const alive = activeTrialDecodeRuns();
          if (alive.length === 0 || trialRunningToastIdRef.current === null) {
            // Trial xong giữa 2 tick: dọn ngay, không chờ notify.
            clearTrialRunningTimers();
            dismissTrialRunningToast();
            return;
          }
          if (
            !updateToast(
              trialRunningToastIdRef.current,
              trialRunningMessage(alive[0], alive.length),
            )
          ) {
            // Toast đã bị đóng tay (bấm ×): dừng tick, không push lại.
            clearTrialRunningTimers();
            trialRunningToastIdRef.current = null;
            trialRunningRunIdRef.current = null;
          }
        }, TRIAL_DECODE_RUNNING_TOAST_TICK_MS);
      }, TRIAL_DECODE_RUNNING_TOAST_DELAY_MS);
    };
    syncTrialRunningToast();
    const unsub = subscribeTrialDecodeRunning(syncTrialRunningToast);
    return () => {
      unsub();
      clearTrialRunningTimers();
      dismissTrialRunningToast();
    };
    // Đợt 72 Z5 — effect chỉ chạy 1 lần lúc mount: đổi ngôn ngữ KHÔNG
    // chạy lại effect này nữa (trước đây [previewLang] làm toast đóng
    // + hẹn 5 s lại từ đầu). Dịch lại toast khi đổi lang do effect
    // riêng bên dưới đảm nhiệm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đợt 72 Z5 — đổi ngôn ngữ giữa trial đang chạy: dịch lại toast
  // trạng thái TẠI CHỖ (updateToast), không đóng toast, không hẹn lại
  // 5 s, không reset số giây đã trôi qua. Toast chưa hiện (đang chờ
  // qua ngưỡng) thì không làm gì — hẹn giờ vẫn chạy, nội dung lúc
  // hiện sẽ dùng ngôn ngữ mới nhờ i18nT động.
  useEffect(() => {
    if (trialRunningToastIdRef.current === null) return;
    const runs = activeTrialDecodeRuns();
    if (runs.length === 0) return;
    updateToast(
      trialRunningToastIdRef.current,
      trialRunningMessage(runs[0], runs.length),
    );
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
    // Đợt 90 R2 — trạng thái đóng băng playhead (xem playheadHold90R2.ts):
    // prevSkipRenderSeeking = cờ N3 của tick trước (có clip video xuôi
    // đang seeking không); playheadHoldState = mốc trần tường + latch
    // nhả khi chạm trần. Hai bộ đếm cuối chỉ phục vụ đo qua hook.
    let playheadHoldState = initialPlayheadHoldState();
    let prevSkipRenderSeeking = false;
    let playheadHoldTicks90R2 = 0;
    let playheadHoldEpisodes90R2 = 0;
    let prevPlayheadHeld = false;
    // Đợt 91 S2 — theo dõi resume-stall sau seek (xem
    // shouldHoldForResumeStall): mỗi watch = 1 element video xuôi vừa
    // hoàn tất seek + currentTime lúc đó + mốc rAF. Tick sau giữ playhead
    // cho tới khi element tăng >= 1 frame hoặc hết ân hạn. Chỉ sống
    // trong effect vòng lặp này; dọn ở khối quyết định giữ mỗi tick.
    let resumeWatches91S2: Array<{ el: object; watch: PlayheadResumeWatch }> = [];
    let resumeHoldTicks91S2 = 0;
    let resumeHoldEpisodes91S2 = 0;
    let prevResumeHold91S2 = false;
    // Đợt 94 V2 — số lần detector đã arm lại watch (chỉ đo, qua hook).
    let resumeRearmCount94V2 = 0;
    // Đợt 98 Z3 — số lần detector arm watch VÌ element bò (tăng >= 1
    // frame ở tốc độ < 0,1× realtime — xem isResumeCrawlAdvance98Z3)
    // + số tick element bò (chỉ đo, qua hook __vcutResumeFreezeCrawl98Z3).
    let resumeCrawlArms98Z3 = 0;
    let resumeCrawlTicks98Z3 = 0;
    // Đợt 100 B3 — số lần luật burst-rate của đuôi đã chặn 1 cú nhảy
    // của decoder (tăng quá nhanh trong 1 tick — xem
    // PLAYHEAD_TAIL_BURST_RATE_MAX trong playheadHold90R2.ts). Chỉ đo,
    // qua hook __vcutTailBurstBlocked100B3.
    let resumeTailBurstBlocked100B3 = 0;
    // Đợt 101 C3 — số lần luật drift-gate của đuôi đã chặn 1 lần tăng
    // đáp xa khỏi target (|drift| > PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S —
    // xem header C3 trong playheadHold90R2.ts). Chỉ đo, qua hook
    // __vcutTailDriftGateBlocked101C3.
    let resumeTailDriftGateBlocked101C3 = 0;
    // Đợt 95 W5 — element video xuôi vừa được detector re-arm Ở TICK NÀY
    // (ghi ở khối detector bên dưới, đọc ở syncMedia cùng tick để khoan
    // kích drift re-seek 1 tick — xem shouldIssueForwardReseek graceTick).
    // Tạo mới mỗi tick (xem khối detector) nên không bao giờ stale sang
    // tick sau; chỉ video xuôi (detector chỉ arm cho video xuôi).
    let resumeRearmedThisTick95W5 = new Set<object>();
    // Đợt 96 X4 — tập element video xuôi đang có watch resume-stall CÒN
    // SỐNG ở tick này (ghi sau khối dọn watch bên dưới, đọc ở syncMedia
    // cùng tick để khoan kích drift re-seek SUỐT thời gian watch còn
    // sống — mở rộng ân hạn 1 tick sau re-arm của W5; xem
    // liveResumeWatchElements + LIMITS đợt 96 X4 §2). Tạo mới mỗi tick
    // nên không bao giờ stale sang tick sau; chỉ video xuôi (watch chỉ
    // arm cho video xuôi). Bao luôn tập re-arm tick này (watch vừa arm
    // sống qua khối dọn — xem chú thích ở khối detector).
    let resumeWatchLive96X4 = new Set<object>();
    // Đợt 97 Y4 — đuôi ân hạn drift re-seek sau khi watch hết vì element
    // tăng >= 1 frame (xem nextResumeGraceTail97Y4 + LIMITS đợt 97 Y4
    // §2): 1 entry / element video xuôi vừa mất watch (endedAtMs +
    // advances + lastCt). Chỉ sống trong effect vòng lặp này; mở ở khối
    // dọn watch bên dưới, bước mỗi tick, dọn khi dừng phát (cùng chỗ
    // dọn resumeWatches91S2). Tập live từng tick (resumeGraceTailLive97Y4)
    // truyền vào syncMedia như tập watch sống của X4.
    let resumeGraceTail97Y4 = new Map<object, ResumeGraceTail97Y4>();
    let resumeGraceTailLive97Y4 = new Set<object>();
    // Đợt 94 V2 — theo dõi đóng băng để re-arm trần stall cho stall thứ
    // 2+ (nợ U3 §5): 1 entry / element video xuôi đang phát (lastCt +
    // mốc tăng cuối + cờ ceilingSpent — xem nextResumeFreezeRearm). Chỉ
    // sống trong effect vòng lặp này; detector cập nhật mỗi tick, dọn
    // khi dừng phát (cùng chỗ dọn resumeWatches91S2).
    let resumeFreezeTracks94V2 = new Map<object, ResumeFreezeTrack>();
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
    // ROUND62-R6 (b): TỔNG số element đã drop vì lỗi decoder sticky
    // (error !== null) sau các lần seek thất bại đã chứng minh, kể từ
    // khi effect vòng lặp mount — đếm TÍCH LŨY, không reset theo cap
    // (khác seekElementRecreated của Y2: đó là số ở lần cạn cap gần
    // nhất). Harness đọc delta qua 2 lần lấy mẫu để biết phục hồi đã
    // chạy chưa (xem điểm nối trong `.then` seek pause).
    let decoderErrorRecovered = 0;
    // ROUND42-X2: playhead mà chuỗi thất bại trên đang đếm cho. BẮT
    // BUỘC phải có: nhánh request-seek mới chạy cả cho lần retry cùng
    // t (sau khi nhánh else mở guard bằng lastRequested = null) lẫn
    // cho scrub sang t mới — chỉ target này mới phân biệt được hai
    // trường hợp: retry cùng t PHẢI giữ đếm (nếu reset thì cap không
    // bao giờ chạm), t mới thì reset. Reset cùng các chỗ reset cap.
    // T5: thế hệ seek — .then của request cũ (bị huỷ/thay thế) không được
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
      // ROUND62-R6 (b): tổng số element đã drop vì lỗi decoder sticky
      // (đếm tích lũy, xem closure var decoderErrorRecovered).
      decoderErrorRecovered: number;
      // ROUND63-R6 (1): tổng số element đã drop vì lỗi decoder dính
      // TRONG LÚC PHÁT (syncMedia, đếm tích lũy từ lúc module nạp —
      // khác decoderErrorRecovered của R6: đó là đường seek pause).
      // Harness đọc delta qua 2 lần lấy mẫu để biết phục hồi lúc phát
      // đã chạy chưa và có chặn tốc độ không.
      decoderErrorRecoveredPlaying: number;
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
      decoderErrorRecovered: 0,
      decoderErrorRecoveredPlaying: 0,
      tickErrors: 0,
      pauseRetryWallExhausted: false,
    };
    const winHook = window as unknown as {
      __vcutPreviewIdle?: PreviewIdleDebug;
      __vcutPreviewRaf?: ReturnType<typeof createPreviewRafHook>;
      __vcutReverseEngine?: string;
      // Đợt 53 J5 — hook đo cho harness: analyser của master bus (đo gain
      // thật qua tick preview) + bộ đếm seek lại khi đang phát (đo drift
      // playhead/audio) + trạng thái element media (đo vì sao audio
      // re-seek: currentTime/paused/seeking/readyState). Chỉ phục vụ đo,
      // không phải tính năng người dùng.
      __vcutAudioAnalyser?: AnalyserNode | null;
      __vcutSyncReseeks?: number;
      __vcutSyncReseeksVideo?: number;
      __vcutSyncReseeksAudio?: number;
      // Đợt 84 L10 — bộ đếm riêng đường phục hồi ended (xem
      // syncRestartEndedVideoCount): chỉ restartEndedElement tăng, drift
      // re-seek không tăng — để harness quy kết chắc chắn restart đã bắn.
      __vcutSyncRestartEndedVideo?: number;
      __vcutSyncRestartEndedAudio?: number;
      // Đợt 85 M4 — dấu vết mức tick đường phục hồi ended (nợ W7):
      // snapshot mỗi tick nhánh forward + sự kiện mỗi lần restart bắn
      // (xem webkitRestartTrace85M4.ts). Chỉ phục vụ đo.
      __vcutRestartEndedTrace?: {
        events: RestartTraceEvent[];
        ring: RestartTickSnapshot[];
      };
      // Đợt 86 N3 — bộ đếm tick đang phát đã bỏ qua renderFrame vì có
      // clip video xuôi đang seeking (W6). Chỉ phục vụ đo.
      __vcutSeekSkipRenderTicks86N3?: number;
      // Đợt 92 T3 — ring thống kê thời gian tick render (chỉ đo).
      __vcutRenderFrameTicks92T3?: RenderFrameTickStat92T3[];
      // Đợt 90 R2 — bộ đếm tick/lần playhead bị đóng băng vì clip video
      // xuôi đang seeking (nợ LIMITS gộp đợt 89 §4 mục 2). Chỉ phục vụ đo.
      __vcutPlayheadHold90R2?: { ticks: number; holds: number; resumeTicks?: number; resumeHolds?: number; resumeRearms94V2?: number };
      // Đợt 96 X4 — watch resume-stall đang sống (mốc hoàn tất + element)
      // để probe đo mốc trần 5000 ms thật của từng watch (xem LIMITS
      // đợt 96 X4 §4) và xác nhận grace suốt-watch. Chỉ phục vụ đo.
      __vcutResumeWatch96X4?: Array<{ el: object; ctAtCompletion: number; completedAtMs: number }>;
      // Đợt 97 Y4 — đuôi ân hạn sau khi watch hết vì element tăng (mốc
      // hết watch + số lần tăng) để probe đo trực tiếp đuôi có sống
      // qua đúng tick drift re-seek từng bắn ở c1 đợt 96 không (xem
      // LIMITS đợt 97 Y4 §2). Chỉ phục vụ đo.
      __vcutResumeGraceTail97Y4?: Array<{ el: object; endedAtMs: number; advances: number }>;
      // Đợt 98 Z3 — đếm bò của detector đóng băng theo tốc độ (số lần
      // arm vì bò + số tick bò) để probe đo trực tiếp fix có arm trong
      // lúc element bò không (xem LIMITS đợt 98 Z3 §2). Chỉ phục vụ đo.
      __vcutResumeFreezeCrawl98Z3?: { crawlArms: number; crawlTicks: number };
      // Đợt 100 B3 — số lần luật burst-rate của đuôi đã chặn 1 cú nhảy
      // của decoder (xem PLAYHEAD_TAIL_BURST_RATE_MAX). Chỉ phục vụ đo.
      __vcutTailBurstBlocked100B3?: number;
      // Đợt 101 C3 — số lần luật drift-gate của đuôi đã chặn 1 lần tăng
      // đáp xa khỏi target (xem PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S). Chỉ
      // phục vụ đo.
      __vcutTailDriftGateBlocked101C3?: number;
      __vcutMediaState?: Array<{
        tag: string;
        currentTime: number;
        paused: boolean;
        seeking: boolean;
        readyState: number;
        src: string;
        srcKey: string;
      }>;
      // Đợt 55 L6 — hook đo cho harness: tham chiếu element media thật
      // để sampler trong trang lấy mẫu currentTime/seeking ở 50 ms
      // (hook __vcutMediaState trên chỉ cập nhật mỗi tick rAF nên
      // không bắt được spike thoáng qua giữa các tick). Chỉ phục vụ đo.
      __vcutMediaEls?: Array<{
        tag: string;
        el: HTMLVideoElement | HTMLAudioElement;
      }>;
      // ROUND63-R6 (3) — hook đo cho harness: danh sách key slot hold
      // cache đang có (storeHeldFrame cập nhật mỗi lần draw thành công).
      // Chỉ phục vụ đo (H1: 2 instance cùng leaf id + cùng src phải có
      // 2 key riêng).
      __vcutHeldFrameKeys?: string[];
    };
    winHook.__vcutPreviewIdle = idleDebug;
    // Đợt 92 T3 — công bố ring thống kê thời gian tick render (chỉ đo).
    winHook.__vcutRenderFrameTicks92T3 = renderFrameTickStats92T3;
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
      // Đợt 53 J5 — dt KHÔNG còn clamp 0,1 s nữa: dùng clampPreviewDt
      // (trần 2 s, xem playheadPacing.ts). Clamp cũ làm playhead chỉ
      // tiến ~0,15× wall-clock khi FPS thấp (~1,5 fps) trong khi element
      // media phát đúng tốc độ thật → syncMedia seek ngược liên tục.
      // Gap phi lý (tab ẩn trong lúc phát) được đóng bằng reset `last`
      // trong onVisible bên dưới; trần 2 s chỉ là lưới an toàn cuối.
      const dt = clampPreviewDt((now - last) / 1000);
      last = now;
      // Đợt 90 R2 — đóng băng playhead khi tick TRƯỚC báo clip video xuôi
      // đang seeking (nợ LIMITS gộp đợt 89 §4 mục 2: playhead chạy trước
      // canvas tới nhiều giây lúc phát sau seek dưới tải). Quyết định
      // TRƯỚC khi tăng playhead vì syncMedia của tick này chạy SAU
      // (trễ 1 tick = tối đa 1 frame vượt). Khi giữ: KHÔNG tích lũy dt
      // (forwardAcc/reverseAcc = 0) để lúc nhả không nhảy bù nhiều frame.
      // Đợt 90 R2 (a2) — cạnh lên của nút Phát: tick này syncMedia sắp
      // forceSeek mọi source tới playhead nên giữ luôn (xem
      // playheadHold90R2.ts 1b). prevPlayingRef được cập nhật SAU khối
      // tăng playhead (ở dưới) nên ở đây nó vẫn là giá trị tick trước.
      const forceSeekEdge = st.playing && !prevPlayingRef.current;
      const holdDecision = shouldHoldPlayheadWhileSeeking({
        playing: st.playing,
        seekingPrevTick: prevSkipRenderSeeking,
        forceSeekEdge,
        nowMs: now,
        state: playheadHoldState,
      });
      playheadHoldState = holdDecision.state;
      // Đợt 91 S2 — giữ thêm vì resume-stall sau seek (sawtooth dư R2
      // §5.1: element video vừa seek xong nhưng currentTime đứng yên
      // ~0,8–1,7 s trong lúc phát, playhead chạy trước canvas tới
      // ~1 s). Dọn watch trước khi xét: quá trần cứng (đợt 92 T3:
      // 5000 ms, thay ân hạn 1500 ms — stall 2,0–2,8 s dưới tải là
      // thường gặp), đã tăng >= 1 frame, element seek mới (seeking-hold
      // lo, arm lại khi xong), hoặc không còn phát. Giữ khi CÒN watch
      // chưa tăng đủ — video vẫn phát (syncMedia không pause VIDEO khi
      // giữ kiểu này) để decoder resume; chỉ audio bị pause. Quyết định
      // TRƯỚC khi tăng playhead như giữ R2 (cùng trễ tối đa 1 tick).
      if (!st.playing) {
        resumeWatches91S2 = [];
        resumeFreezeTracks94V2.clear();
        // Đợt 97 Y4 — dừng phát thì đuôi ân hạn cũng dọn (cùng chỗ dọn watch).
        resumeGraceTail97Y4.clear();
      }
      const frameDur91S2 = 1 / (st.spec.meta.fps > 0 ? st.spec.meta.fps : 30);
      // Đợt 94 V2 — re-arm trần stall cho stall thứ 2+ (nợ U3 §5): trước
      // khi xét giữ, quét các clip video xuôi đang active ở tick TRƯỚC
      // (tập forwardVideoActives94V2 do syncMedia ghi — tín hiệu cũ
      // 1 tick như prevSkipRenderSeeking của giữ R2, vì spec/pool/
      // mediaByName chỉ được gán SAU khối quyết định giữ trong tick
      // này); element nào đóng băng >= 300 ms mà chưa có watch thì arm
      // watch mới (trần 5000 ms tính từ lúc đóng băng bắt đầu — xem
      // nextResumeFreezeRearm). Chạy TRƯỚC khối quyết định giữ trong
      // cùng tick để giữ kịp ngay tick phát hiện: trễ 1 tick sẽ để
      // playhead chạy thêm tới ~1 gap rAF, có thể tự vượt ngưỡng drift
      // 0,35 s trước khi giữ kịp. Chỉ phát xuôi (như đường arm sau
      // seek); tập active cũ 1 tick có thể giữ lại 1 element vừa hết
      // active thêm 1 tick — element đó paused thì guard paused chặn
      // arm, nên rủi ro chỉ còn 1 tick giữ oan trong trường hợp hiếm
      // (element vừa hết active, vẫn phát, lại đóng băng đúng lúc đó).
      // Đợt 95 W5 — tập re-arm tick này làm mới TRƯỚC khối detector (kể
      // cả tick không phát / phát ngược) để syncMedia cùng tick không
      // bao giờ đọc phải tập stale của tick trước.
      resumeRearmedThisTick95W5 = new Set<object>();
      if (st.playing && !st.reversePlayback) {
        for (const el of forwardVideoActives94V2) {
          const videoEl = el as HTMLVideoElement;
          const prevTrack = resumeFreezeTracks94V2.get(el) ?? null;
          // Đợt 98 Z3 — tick bò: element tăng >= 1 frame nhưng tốc độ
          // < 0,1× realtime (xem isResumeCrawlAdvance98Z3). Đếm trước
          // khi gọi detector vì helper không báo lại loại tăng.
          const crawlAdvance98Z3 =
            prevTrack !== null &&
            Math.abs(videoEl.currentTime - prevTrack.lastCt) >= frameDur91S2 - 1e-9 &&
            isResumeCrawlAdvance98Z3(videoEl.currentTime - prevTrack.lastCt, now - prevTrack.lastAdvanceMs);
          if (crawlAdvance98Z3) resumeCrawlTicks98Z3++;
          const rearmed = nextResumeFreezeRearm({
            playing: st.playing,
            nowMs: now,
            currentCt: videoEl.currentTime,
            frameDur: frameDur91S2,
            seeking: videoEl.seeking,
            paused: videoEl.paused,
            hasWatch: resumeWatches91S2.some((w) => w.el === el),
            track: prevTrack,
          });
          if (rearmed.track === null) resumeFreezeTracks94V2.delete(el);
          else resumeFreezeTracks94V2.set(el, rearmed.track);
          if (rearmed.arm !== null) {
            resumeRearmCount94V2++;
            // Đợt 98 Z3 — arm này là vì element bò (không phải vì đóng
            // băng hẳn): đếm riêng để probe đo trực tiếp.
            if (crawlAdvance98Z3) resumeCrawlArms98Z3++;
            // Đợt 95 W5 — ghi element vừa arm để syncMedia cùng tick
            // khoan kích drift re-seek cho nó 1 tick (xem graceTick).
            resumeRearmedThisTick95W5.add(el);
            resumeWatches91S2.push({ el, watch: rearmed.arm });
          }
        }
      }
      // Dọn watch (xem chú thích S2 ở trên): seeking / quá trần cứng /
      // đã tăng >= 1 frame thì bỏ; còn lại giữ để xét giữ.
      const keptWatches91S2: Array<{ el: object; watch: PlayheadResumeWatch }> = [];
      for (const w of resumeWatches91S2) {
        const el = w.el as HTMLVideoElement;
        if (el.seeking) continue;
        // Đợt 92 T3: dọn watch theo TRẦN CỨNG 5000 ms (cùng biên với
        // shouldHoldForResumeStall), không theo ân hạn 1500 ms nữa —
        // stall 2,0–2,8 s dưới tải phải giữ tiếp tới khi decoder resume.
        if (now - w.watch.completedAtMs > PLAYHEAD_RESUME_STALL_MAX_MS) {
          // Đợt 94 V2: watch chạm trần mà element vẫn đóng băng — đánh
          // dấu đợt đóng băng này đã cháy hết trần để detector không arm
          // lại ngay (nếu không trần cứng vô nghĩa); cờ chỉ reset khi
          // element tăng >= 1 frame (xem nextResumeFreezeRearm).
          const tr = resumeFreezeTracks94V2.get(el);
          if (tr !== undefined) tr.ceilingSpent = true;
          continue;
        }
        // Đợt 98 Z3 — watch chỉ hết khi element tăng >= 1 frame ở TỐC
        // ĐỘ lành (>= 0,1× realtime — xem isResumeCrawlAdvance98Z3):
        // tăng BÒ không kết thúc watch (nếu không watch arm rồi hết
        // ngay tick sau, playhead chạy tự do xen kẽ và drift re-seek
        // vẫn bắn — nợ LIMITS đợt 97 §4 mục 3, d3 đợt 97 kẹt seek 1,63 s).
        const watchAdvance98Z3 = Math.abs(el.currentTime - w.watch.ctAtCompletion);
        if (watchAdvance98Z3 >= frameDur91S2 - 1e-9 && !isResumeCrawlAdvance98Z3(el.currentTime - w.watch.ctAtCompletion, now - w.watch.completedAtMs)) {
          // Đợt 97 Y4 — watch hết VÌ element tăng >= 1 frame (decoder
          // nhúc nhích, không phải chạm trần hay seeking): mở đuôi ân
          // hạn cho element này — stall mới ngay sau đó vẫn được grace
          // cho tới khi watch mới arm (vá lỗ hổng c1 đợt 96; xem
          // nextResumeGraceTail97Y4). Đuôi mới ghi đè đuôi cũ cùng
          // element (mỗi element tối đa 1 watch nên tối đa 1 đuôi).
          resumeGraceTail97Y4.set(el, {
            endedAtMs: now,
            advances: 0,
            lastCt: el.currentTime,
          });
          continue;
        }
        keptWatches91S2.push(w);
      }
      resumeWatches91S2 = keptWatches91S2;
      // Đợt 96 X4 — tập element có watch còn sống cho syncMedia cùng tick
      // (ân hạn drift re-seek suốt-watch, xem liveResumeWatchElements)
      // + công bố watch để probe đo mốc trần 5000 ms thật (xem hook
      // __vcutResumeWatch96X4). Làm mới mỗi tick nên không stale.
      resumeWatchLive96X4 = liveResumeWatchElements(resumeWatches91S2);
      winHook.__vcutResumeWatch96X4 = resumeWatches91S2.map((w) => ({
        el: w.el,
        ctAtCompletion: w.watch.ctAtCompletion,
        completedAtMs: w.watch.completedAtMs,
      }));
      // Đợt 97 Y4 — bước đuôi ân hạn mỗi tick (đóng khi watch mới arm /
      // decoder resume ổn định / quá trần — xem nextResumeGraceTail97Y4)
      // + tập live + công bố đuôi để probe đo trực tiếp (xem hook
      // __vcutResumeGraceTail97Y4). Làm mới mỗi tick nên không stale.
      // Bước SAU khối dọn watch để hasWatch đọc đúng tập watch đã dọn.
      // Đợt 100 B3 — truyền playbackRate cho luật burst-rate của đuôi
      // (xem PLAYHEAD_TAIL_BURST_RATE_MAX) + đếm số lần burst bị chặn
      // (công bố qua hook __vcutTailBurstBlocked100B3 để probe đo).
      // Đợt 101 C3 — truyền drift (currentCt − target của clip, tính
      // bằng driftTargetForTailElement101C3 — đúng với mọi speed/
      // reverse) cho luật drift-gate của đuôi (xem header C3 trong
      // playheadHold90R2.ts) + đếm số lần gate chặn (hook
      // __vcutTailDriftGateBlocked101C3). Không tìm được clip (pool chưa
      // sẵn) thì drift = undefined → gate bỏ qua, chạy như B3. Đợt 103
      // E5: nested không còn miss nữa — helper nay nhận spec phẳng tick
      // trước (specForTail103E5) nên lá nested tìm được như clip phẳng.
      // Lưu ý: st.playhead ở đây là playhead ĐẦU tick (chưa tăng ở tick
      // này — khối tăng playhead chạy sau bước đuôi), còn syncMedia dùng
      // playhead SAU tăng — drift gate lệch tối đa ~1 frame so với drift
      // mà drift re-seek dùng; không đáng kể so với ngưỡng 0,35 s.
      // Đợt 103 E5 — dùng spec phẳng của tick trước (đã kiểm identity
      // với spec gốc hiện tại) thay vì st.spec thô: lá nested chỉ có ở
      // spec phẳng — chính là spec mà collectActives dùng — nên helper
      // mới tìm được clip và gate mới chặn được đáp xa trên nested.
      // Không có nested/adjustment thì buildPreviewSpec trả đúng object
      // cũ nên hành vi phẳng không đổi; spec gốc đổi object thì
      // identity lệch → fallback spec thô như cũ (fail-open 1 tick).
      const flat103E5 = lastFlatSpec103E5Ref.current;
      const specForTail103E5 =
        flat103E5 && flat103E5.raw === st.spec ? flat103E5.flat : st.spec;
      for (const [tailEl, tail] of resumeGraceTail97Y4) {
        const tailElVideo = tailEl as HTMLVideoElement;
        const tailTarget101C3 =
          poolRef.current && mediaByNameRef.current
            ? driftTargetForTailElement101C3(
                specForTail103E5,
                poolRef.current,
                mediaByNameRef.current.map,
                st.playhead,
                tailEl,
              )
            : null;
        const stepped = nextResumeGraceTail97Y4({
          playing: st.playing,
          nowMs: now,
          currentCt: tailElVideo.currentTime,
          frameDur: frameDur91S2,
          hasWatch: resumeWatches91S2.some((w) => w.el === tailEl),
          tail,
          playbackRate: tailElVideo.playbackRate,
          drift:
            tailTarget101C3 === null
              ? undefined
              : tailElVideo.currentTime - tailTarget101C3,
        });
        if (stepped.burstBlocked === true) resumeTailBurstBlocked100B3++;
        if (stepped.driftGateBlocked === true) resumeTailDriftGateBlocked101C3++;
        if (stepped.tail === null) resumeGraceTail97Y4.delete(tailEl);
        else resumeGraceTail97Y4.set(tailEl, stepped.tail);
      }
      resumeGraceTailLive97Y4 = new Set(resumeGraceTail97Y4.keys());
      winHook.__vcutResumeGraceTail97Y4 = [...resumeGraceTail97Y4.entries()].map(
        ([tailEl, tail]) => ({
          el: tailEl,
          endedAtMs: tail.endedAtMs,
          advances: tail.advances,
        }),
      );
      // Đợt 98 Z3 — công bố đếm bò để probe đo trực tiếp (xem hook
      // __vcutResumeFreezeCrawl98Z3): crawlArms = số lần detector arm
      // watch vì element bò; crawlTicks = số tick element bò.
      winHook.__vcutResumeFreezeCrawl98Z3 = {
        crawlArms: resumeCrawlArms98Z3,
        crawlTicks: resumeCrawlTicks98Z3,
      };
      // Đợt 100 B3 — công bố đếm burst-bị-chặn của đuôi để probe đo trực
      // tiếp luật burst-rate có chặn được cú nhảy của decoder không
      // (xem PLAYHEAD_TAIL_BURST_RATE_MAX).
      winHook.__vcutTailBurstBlocked100B3 = resumeTailBurstBlocked100B3;
      // Đợt 101 C3 — công bố đếm lần-tăng-đáp-xa-bị-chặn của đuôi để
      // probe đo trực tiếp luật drift-gate có chặn được burst dài-gap
      // (g2/g5) không (xem PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S).
      winHook.__vcutTailDriftGateBlocked101C3 = resumeTailDriftGateBlocked101C3;
      const resumeHold91S2 =
        resumeWatches91S2.length > 0 &&
        resumeWatches91S2.some((w) =>
          shouldHoldForResumeStall({
            playing: st.playing,
            nowMs: now,
            watch: w.watch,
            currentCt: (w.el as HTMLVideoElement).currentTime,
            frameDur: frameDur91S2,
          }),
        );
      // Giữ R2 (seeking) có ưu tiên cho hành vi pause: khi cả hai giữ
      // cùng lúc thì syncMedia pause mọi active như R2 (seek còn bay);
      // chỉ khi CHỈ giữ vì resume-stall mới để video phát.
      const playheadHeld = holdDecision.hold || resumeHold91S2;
      const playheadHeldResume = resumeHold91S2 && !holdDecision.hold;
      if (playheadHeld) {
        if (!prevPlayheadHeld) playheadHoldEpisodes90R2++;
        playheadHoldTicks90R2++;
        if (playheadHeldResume) {
          if (!prevResumeHold91S2) resumeHoldEpisodes91S2++;
          resumeHoldTicks91S2++;
        }
        winHook.__vcutPlayheadHold90R2 = { ticks: playheadHoldTicks90R2, holds: playheadHoldEpisodes90R2, resumeTicks: resumeHoldTicks91S2, resumeHolds: resumeHoldEpisodes91S2, resumeRearms94V2: resumeRearmCount94V2 };
      }
      prevPlayheadHeld = playheadHeld;
      prevResumeHold91S2 = playheadHeldResume;
      if (playheadHeld) {
        // Playhead đứng yên ở vị trí seek tới cho tới khi seek xong;
        // canvas vẫn giữ khung cũ (N3 bỏ vẽ khi seeking) nhưng playhead
        // không còn "nói dối" về frame đang hiện nữa.
        reverseAcc = 0;
        forwardAcc = 0;
      } else if (st.playing) {
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
        // Đợt 59 P3: kết quả failsoft hoist ra ngoài try để khối hợp nhất
        // sau try/catch dùng chung cho cả đường thành công lẫn đường
        // flatten ném lỗi (khi đó 2 tập rỗng, chỉ còn lý do frame).
        let failsoftSkipped: string[] = [];
        let failsoftSkippedReasons: string[] = [];
        // Đợt 61 R8: attribution theo clip của failsoftSkippedReasons
        // (xem SkippedReasonAttribution) — badge lọc theo clip đang ở
        // frame hiện tại / clip không vẽ được (dưới đây).
        let failsoftSkippedReasonsByClip: SkippedReasonAttribution[] = [];
        try {
          const failsoft = buildPreviewSpecFailsoft(rawSpec, i18nT);
          spec = failsoft.spec;
          failsoftSkipped = failsoft.skipped;
          failsoftSkippedReasons = failsoft.skippedReasons;
          failsoftSkippedReasonsByClip = failsoft.skippedReasonsByClip;
          if (failsoft.warnings.length > 0) {
            const dropped = failsoft.warnings.filter((w) => w.fallback === "dropped").length;
            warnText = dropped > 0
              ? i18nT("preview.curveWarnHidden", { n: String(failsoft.warnings.length), dropped: String(dropped) })
              : i18nT("preview.curveWarnFallback", { n: String(failsoft.warnings.length) });
            warnTitle = failsoft.warnings.map((w) =>
              `nested "${w.nestedId}": ${w.reason} → ${w.fallback === "linear-1x" ? i18nT("preview.curveFallbackLinear") : i18nT("preview.curveFallbackHidden")}`,
            ).join("\n");
            const key = failsoft.warnings.map((w) => `${w.nestedId}|${w.fallback}|${w.reason}`).join(";");
            if (key !== lastCurveWarnKeyRef.current) {
              lastCurveWarnKeyRef.current = key;
              for (const w of failsoft.warnings) {
                pushToast(
                  i18nT("preview.curveToast", {
                    id: w.nestedId,
                    reason: w.reason,
                    fallback: w.fallback === "linear-1x" ? i18nT("preview.curveFallbackLinearShort") : i18nT("preview.curveFallbackHidden"),
                  }),
                  "error",
                );
              }
            }
          } else if (lastCurveWarnKeyRef.current !== "") {
            lastCurveWarnKeyRef.current = "";
          }
          // Đợt 58 O3 — surface `flat.skipped` / `skippedReasons` (đóng
          // nợ đợt 57 §6.2): trước đây hai tập này chết trong object
          // trả về, user không thấy lá/effect nào bị bỏ khỏi preview.
          // Điểm hiển thị CHÍNH: badge cảnh báo thường trực dưới khung
          // preview (cùng badge curveWarnBadgeRef của J1) + 1 toast tóm
          // tắt mỗi khi tập đổi (lý do không chọn NestedClipPanel /
          // LoadReportPanel: xem LIMITS đợt 58 O3 §1). Đợt 59 P3: toast
          // + badge của 2 tập này chuyển xuống khối hợp nhất sau
          // try/catch (dưới đây) để gộp thêm lý do của frame hiện tại.
        } catch (e) {
          spec = rawSpec;
          const msg = e instanceof Error ? e.message : String(e);
          warnText = i18nT("preview.flattenWarn");
          warnTitle = i18nT("preview.flattenWarnDetail", { msg });
          const key = `err:${msg}`;
          if (key !== lastCurveWarnKeyRef.current) {
            lastCurveWarnKeyRef.current = key;
            pushToast(i18nT("preview.flattenToast", { msg }), "error");
          }
        }
        // Đợt 59 P3 — hợp nhất lý do effect-skip từ failsoft (flatten)
        // với lý do của FRAME HIỆN TẠI (`frameSkippedEffectTypes`: effect
        // mà đường vẽ từng frame bỏ qua — gồm cả spec phẳng không qua
        // flatten, nơi failsoft.skippedReasons luôn rỗng). Cùng 1 type
        // chỉ đếm 1 lần (so chuỗi lý do đã dịch — cả hai nguồn đều qua
        // `skippedEffectReason` với cùng lookup `i18nT` nên chuỗi trùng
        // nhau; classifier 16 type chuẩn của 2 nguồn cũng khớp nhau).
        // Tính từ spec cuối + playhead hiện tại nên tươi mỗi tick, kể cả
        // khi vòng lặp ngủ lúc pause (không dùng state theo frame như
        // tickHadHold — trừ tập `tickSkippedClipIds`: id clip tick trước
        // không vẽ được do decoder tụt, truyền tường minh vào helper,
        // trễ tối đa 1 tick như badge hold; đợt 60 Q6).
        // Toast gộp 1 cái mỗi loại khi tập hợp nhất đổi;
        // toast effect = "info" (bản render vẫn có hiệu ứng — khớp ngữ
        // nghĩa console.warn cũ của warnSkippedEffects, kênh debug giữ
        // nguyên song song với badge). Khi flatten ném lỗi thì chỉ còn
        // lý do frame (failsoftSkipped* rỗng) — badge vẫn hiện effect
        // kèm cảnh báo flatten.
        // Đợt 60 Q6: spec phẳng nay đã có skippedReasons tầng lib
        // (`flatSpecSkippedReasons`) nên failsoftSkippedReasons không còn
        // rỗng cho spec phẳng mang effect lạ — frameReasons chỉ còn bổ
        // sung phần mà lib chưa thấy (hiện tại là không còn phần nào:
        // 2 nguồn khớp nhau từng chuỗi nên dedupe gộp thành 1).
        // Đợt 61 R8 — BADGE chỉ hiện lý do của clip ĐANG Ở FRAME HIỆN
        // TẠI và đã vẽ được: `visibleSkippedReasons` lọc attribution
        // theo cửa sổ chứa playhead + loại clip trong
        // `tickSkippedClipIds` (tick trước không vẽ được: decoder tụt
        // hoặc thiếu media). Lý do của clip ngoài frame, hoặc của clip
        // không vẽ được, bị ẩn khỏi badge — nguyên nhân khi đó không
        // phải type effect (đóng nợ đợt 60 §5.8). Toast + skippedKey
        // vẫn dùng `effectReasons` spec-wide như cũ (đổi theo spec,
        // không đổi khi scrub) để không spam toast lúc di chuyển
        // playhead; badge hiển thị `badgeEffectReasons` (tập đã lọc).
        const frameReasons: string[] = [];
        for (const ft of frameSkippedEffectTypes(spec, useStore.getState().playhead, { notDrawnClipIds: tickSkippedClipIds })) {
          const r = skippedEffectReason(ft, i18nT);
          if (!failsoftSkippedReasons.includes(r) && !frameReasons.includes(r)) frameReasons.push(r);
        }
        const effectReasons = [...failsoftSkippedReasons, ...frameReasons];
        const badgeEffectReasons = [
          ...visibleSkippedReasons(failsoftSkippedReasonsByClip, useStore.getState().playhead, tickSkippedClipIds),
          ...frameReasons,
        ];
        const skippedKey = [...failsoftSkipped, "||", ...effectReasons].join("\n");
        if (skippedKey !== lastFailsoftSkippedKeyRef.current) {
          lastFailsoftSkippedKeyRef.current = skippedKey;
          if (failsoftSkipped.length > 0) {
            pushToast(
              i18nT("preview.nestedSkippedToast", {
                n: String(failsoftSkipped.length),
                first: failsoftSkipped[0],
              }),
              "error",
            );
          }
          if (effectReasons.length > 0) {
            pushToast(
              i18nT("preview.effectSkippedToast", {
                n: String(effectReasons.length),
                first: effectReasons[0],
              }),
              "info",
            );
          }
        }
        if (failsoftSkipped.length > 0) {
          const line = i18nT("preview.nestedSkippedBadge", { n: String(failsoftSkipped.length) });
          warnText = warnText ? `${warnText} · ${line}` : line;
          warnTitle = warnTitle
            ? `${warnTitle}\n${failsoftSkipped.join("\n")}`
            : failsoftSkipped.join("\n");
        }
        if (badgeEffectReasons.length > 0) {
          const line = i18nT("preview.effectSkippedBadge", { n: String(badgeEffectReasons.length) });
          warnText = warnText ? `${warnText} · ${line}` : line;
          warnTitle = warnTitle
            ? `${warnTitle}\n${badgeEffectReasons.join("\n")}`
            : badgeEffectReasons.join("\n");
        }
        const badge = curveWarnBadgeRef.current;
        if (badge) {
          if (badge.textContent !== warnText) badge.textContent = warnText;
          if (badge.title !== warnTitle) badge.title = warnTitle;
          badge.style.display = warnText ? "block" : "none";
        }
        // Đợt 103 E5 — nhớ spec phẳng của tick này (cùng spec gốc nó
        // được flatten từ) để bước đuôi ở tick SAU dùng (xem
        // specForTail103E5): flatten đã chạy sẵn cho render nên không
        // tốn thêm gì; tick đầu tiên sau khi mount thì ref còn null và
        // bước đuôi fallback spec thô như cũ.
        lastFlatSpec103E5Ref.current = { raw: rawSpec, flat: spec };
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
          ? (holdStats.stale ? i18nT("preview.holdStale") : i18nT("preview.hold"))
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
                    // Đợt 60 Q4 — i18nLookup: lý do fallback GOP đi qua
                    // key gop.* trong dict (chỉ test/diagnostics đọc).
                    { gopRangeEnabled: true, i18nLookup: i18nT },
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
            motionText = motionBadgeText(normalizeMotion(clip), i18nT);
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
      // Đợt 53 J5 — phơi analyser master bus + bộ đếm seek lại cho harness
      // đo (xem winHook): analyser chỉ non-null sau ensure() lần đầu.
      winHook.__vcutAudioAnalyser = engine.getAnalyser();
      winHook.__vcutSyncReseeks = syncReseekCount;
      winHook.__vcutSyncReseeksVideo = syncReseekVideoCount;
      winHook.__vcutSyncReseeksAudio = syncReseekAudioCount;
      winHook.__vcutSyncRestartEndedVideo = syncRestartEndedVideoCount;
      winHook.__vcutSyncRestartEndedAudio = syncRestartEndedAudioCount;
      // Đợt 85 M4 — phơi dấu vết tick đường restart (nợ W7) cho harness.
      winHook.__vcutRestartEndedTrace = syncRestartTrace.snapshotForHook();
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
        // Đang phát: huỷ seek dở của Seeker, đồng bộ như cũ, vẽ mỗi frame.
        seekerRef.current!.cancel();
        // K4 (đợt 27): đặt ngữ cảnh transport cho lần renderFrame này
        // (phát ngược toàn cục → mọi clip stepping; phát xuôi → chỉ clip
        // reverse stepping) rồi mới vẽ; nhánh pause bên dưới đặt lại
        // playing: false trước khi vẽ sau seek.
        const reversePlayback = useStore.getState().reversePlayback;
        drawTransport = { playing: true, reversePlayback };
        // Đợt 110 L1 — syncMedia nay trả 2 cờ tách riêng (xem
        // combineSkipRender): skipRender = bỏ vẽ tick này (N3 HOẶC E4),
        // skipRenderSeeking = chỉ N3 — tín hiệu giữ R2 cho tick sau.
        // E4 KHÔNG còn kích giữ R2 (cơ chế CAP đợt 109 K1).
        const skipRenderDecision = syncMedia(spec, pool, mediaByName, t, true, engine, forceSeek, reversePlayback, playheadHeld, playheadHeldResume, resumeRearmedThisTick95W5, resumeWatchLive96X4, resumeGraceTailLive97Y4);
        // Đợt 90 R2 — cờ N3 của tick này làm tín hiệu giữ cho tick sau
        // (playhead tăng ở đầu tick, trước syncMedia — xem quyết định giữ).
        prevSkipRenderSeeking = skipRenderDecision.skipRenderSeeking;
        // Đợt 91 S2 — arm theo dõi resume-stall: seek xuôi của clip video
        // vừa hoàn tất ở tick này (forwardSeekCompletedThisTick — CHỈ
        // nhánh forward, xem khai báo set) thì ghi element + currentTime
        // lúc hoàn tất + mốc rAF; tick sau giữ playhead cho tới khi
        // currentTime tăng >= 1 frame hoặc hết ân hạn. Không arm khi
        // phát ngược (reversePlayback): clip reverse step-seek mỗi frame,
        // và nhánh reverse không ghi vào set này nên vòng này vốn đã
        // rỗng — guard chỉ để rõ ý.
        if (!reversePlayback) {
          for (const el of forwardSeekCompletedThisTick) {
            // Seek nhanh có thể hoàn tất mà không bị bắt seeking=true ở
            // tick nào — watch cũ của cùng element (nếu còn) phải bỏ để
            // khỏi giữ theo mốc ct cũ; arm lại bằng ct mới.
            resumeWatches91S2 = resumeWatches91S2.filter((w) => w.el !== el);
            resumeWatches91S2.push({
              el,
              watch: { ctAtCompletion: (el as HTMLVideoElement).currentTime, completedAtMs: now },
            });
          }
        }
        // Đợt 53 J5 — phơi trạng thái element media sau sync cho harness
        // đo (xem winHook): currentTime/paused/seeking/readyState cho
        // biết element audio có thật sự phát hay kẹt (seek/paused).
        {
          const mediaStates: NonNullable<typeof winHook.__vcutMediaState> = [];
          const mediaEls: NonNullable<typeof winHook.__vcutMediaEls> = [];
          pool.eachMedia((el) => {
            mediaEls.push({ tag: el.tagName, el });
            mediaStates.push({
              tag: el.tagName,
              currentTime: +el.currentTime.toFixed(3),
              paused: el.paused,
              seeking: el.seeking,
              readyState: el.readyState,
              // Đợt 53 J5 (P8): src thật mà element đang dùng — phân biệt
              // proxy (http…/api/proxy/file/…) với blob gốc. srcKey là
              // dataset mà MediaPool.videoFor dùng để quyết định đổi src.
              src: (el.currentSrc || (el as HTMLVideoElement).src || "").slice(-110),
              srcKey: ((el as HTMLVideoElement).dataset?.srcKey || "").slice(-110),
            });
          });
          winHook.__vcutMediaState = mediaStates;
          // Đợt 55 L6 — công bố tham chiếu element cho sampler 50 ms
          // trong trang (xem __vcutMediaEls ở khai báo winHook).
          winHook.__vcutMediaEls = mediaEls;
        }
        // Đợt 86 N3 (W6): clip video xuôi đang seeking thì BỎ QUA cả lần
        // render của tick này thay vì vẽ drawImage element đang seek
        // (probe 86n3: vẽ lúc seeking làm seek chậm 3–11× trên WebKit,
        // ~5× trên Chromium GOP 250; canvas giữ nguyên frame trước seek
        // nên hiển thị vẫn là frame giữ, không đen). lastDrawn KHÔNG
        // gán khi bỏ qua để vòng lặp không ngủ với playhead chưa vẽ
        // (đang phát thì previewLoopShouldSleep luôn false nên tick sau
        // vẫn chạy; khi seek xong, tick đó vẽ lại và gán lastDrawn).
        // lastRequested vẫn gán = t như cũ (chỉ nhánh pause/sleep đọc).
        // syncMedia + audio + expose media state ở trên vẫn chạy đủ.
        if (skipRenderDecision.skipRender) {
          // Đợt 110 L1 — bộ đếm N3 chỉ đếm tick bỏ vẽ VÌ seeking (cờ
          // skipRenderSeeking); tick chỉ bỏ vẽ vì E4 đã có bộ đếm riêng
          // __vcut103e4DriftConfirmSkips, không gộp vào đây nữa (trước
          // đây bộ đếm này đếm gộp cả 2, xem LIMITS đợt 110 L1 §1.3).
          if (skipRenderDecision.skipRenderSeeking) {
            seekSkipRenderTicks86N3++;
            winHook.__vcutSeekSkipRenderTicks86N3 = seekSkipRenderTicks86N3;
          }
          // Đợt 92 T3 — ghi mẫu tick bỏ vẽ (preMs vẫn đo tới điểm này).
          recordRenderFrameTick92T3({ t: now, preMs: performance.now() - now, renderMs: 0, skipped: true, held: false });
        } else {
          // Đợt 92 T3 — đo thời gian tick trước render + thời gian renderFrame
          // (chỉ đo; held đọc SAU renderFrame vì tickHadHold reset ở đầu nó).
          const preMs92T3 = performance.now() - now;
          const renderStart92T3 = performance.now();
          renderFrame(ctx, spec, pool, mediaByName, t, computeViewport(cw, ch, spec), useStore.getState().selection[0] ?? null);
          recordRenderFrameTick92T3({ t: now, preMs: preMs92T3, renderMs: performance.now() - renderStart92T3, skipped: false, held: tickHadHold });
          lastDrawnTRef.current = t;
        }
        lastRequestedTRef.current = t;
      } else {
        // R1-062: pause/scrub — gain engine vẫn cập nhật theo playhead, nhưng
        // frame CHỈ vẽ sau khi seek mới nhất hoàn tất (chờ `seeked`):
        //  - debounce: kéo nhanh -> chỉ seek 1 lần khi thả tay,
        //  - latest-wins: seek cũ bị huỷ, không vẽ frame sai,
        //  - trong lúc chờ, canvas giữ nguyên frame tĩnh (không nhấp nháy).
        // Đợt 90 R2 — giữ cờ N3 của nhánh pause luôn (pause-seek đang bay
        // thì tick bấm play kế tiếp giữ playhead ngay từ tick đầu, không
        // chờ 1 tick vượt).
        // Đợt 110 L1 — nhánh pause chỉ lấy cờ seeking (N3) cho giữ R2;
        // đường pause vốn không ghi pending E4 nên cờ E4 luôn false ở đây.
        prevSkipRenderSeeking = syncMedia(spec, pool, mediaByName, t, false, engine, false).skipRenderSeeking;
        // Đợt 89 Q5 — phơi element media thật + snapshot state Ở NHÁNH
        // PAUSE (mirror khối playing ở trên, chỉ phục vụ đo — không đổi
        // hành vi): trước đây __vcutMediaEls/__vcutMediaState chỉ refresh
        // ở nhánh playing nên harness pause-seek (O8) không bao giờ đọc
        // được currentTime/seeking của element thật — VIDEOS_FN luôn trả
        // [] vì video preview không nằm trong DOM, và mọi phép đo chỉ
        // còn "canvas ổn định" nên khung stale cũng cho PASS rỗng (P5
        // đợt 88 §3.3, S7 lần 2). Công bố mỗi tick pause để harness xác
        // nhận seek hoàn tất bằng tín hiệu element (currentTime ≈ target
        // và seeking === false) độc lập với tín hiệu canvas. Mảng giữ
        // tham chiếu element sống nên đọc currentTime/seeking luôn là
        // giá trị hiện tại dù snapshot mảng cũ.
        {
          const mediaStates: NonNullable<typeof winHook.__vcutMediaState> = [];
          const mediaEls: NonNullable<typeof winHook.__vcutMediaEls> = [];
          pool.eachMedia((el) => {
            mediaEls.push({ tag: el.tagName, el });
            mediaStates.push({
              tag: el.tagName,
              currentTime: +el.currentTime.toFixed(3),
              paused: el.paused,
              seeking: el.seeking,
              readyState: el.readyState,
              src: (el.currentSrc || (el as HTMLVideoElement).src || "").slice(-110),
              srcKey: ((el as HTMLVideoElement).dataset?.srcKey || "").slice(-110),
            });
          });
          winHook.__vcutMediaState = mediaStates;
          winHook.__vcutMediaEls = mediaEls;
        }
        // R14 (Phase 9 đợt 14): chỉ request seek 1 lần cho mỗi playhead t
        // (guard bằng lastRequestedTRef). Trước đây request được gọi MỖI
        // frame rAF trong khi t !== lastDrawnT, mà Seeker debounce 80ms
        // nên timer bị reset liên tục và seek KHÔNG BAO GIỜ chạy khi rAF
        // ~16ms — đây chính là blocker seek pause của đợt 13 (chỉ "chạy"
        // khi rAF chậm hơn 80ms do CPU tải, nên thất thường 8s/42s/không
        // bao giờ). Guard này giữ đúng ngữ nghĩa debounce gốc: scrub
        // nhanh đổi t liên tục vẫn chỉ seek lần cuối, vì mỗi t mới đều
        // khác lastRequested nên request mới sẽ huỷ request cũ.
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
            // Đợt 89 Q5 — timeoutExtensions: gia hạn timeout khi element
            // vẫn đang seeking (seek xa keyframe dưới tải: WebKit 1,6–6,4s
            // không tải, còn chậm hơn dưới tải — đều vượt timeout 1200ms).
            return seekAll(targets, { fps: spec.meta.fps, timeoutExtensions: SEEK_TIMEOUT_EXTENSIONS });
          }).then((outcome) => {
            // T5: .then cũ (request đã bị thay thế/huỷ) bỏ qua hoàn toàn —
            // pendingSeek lúc này thuộc về request mới hơn, không được xóa.
            if (gen !== seekGen) return;
            // T5: seek đã kết thúc (thành công, bị huỷ hay lỗi) — vòng lặp
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
            // seeked, không gán lại để khỏi huỷ seek đang bay — xem
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
              // ROUND42-X2: seek bị huỷ/thất bại mà không có request
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
                // ROUND62-R6 (a) — đóng nợ đợt 61 §5.1 (pause-seek
                // stall: badge vẫn hiện lý do khi decoder stall ở chế
                // độ pause): seek thất bại đã chứng minh (timeout/
                // error) nghĩa là frame tại t KHÔNG được vẽ — nhưng
                // renderFrame không chạy nên `tickSkippedClipIds`
                // không bao giờ được ghi (đó chính là giới hạn R8
                // §3.3 C1-pause). Ghi ngay key instance của các active
                // tại t vào tập này: badge tick sau sẽ ẩn lý do effect
                // của clip stall (nguyên nhân là decoder, không phải
                // type effect). Tự sửa: khi seek sau thành công thì
                // renderFrame chạy lại và reset + ghi lại tập từ đầu
                // (clip vẽ được sẽ không còn trong tập, badge hiện lại
                // nếu effect của nó thật sự bị skip); còn nếu seek vẫn
                // thất bại thì ghi lại đúng key đó ở lần `.then` sau.
                // Ghi trên MỌI lần thất bại (không chờ cạn cap 10 lần)
                // để badge phản ứng sau ~1 lần timeout (~1,3 s) thay
                // vì ~13 s; ghi cả khi đã cạn cap (vòng lặp ngủ ngay
                // sau tick này nhưng badge đã kịp cập nhật ở tick đó).
                // collectActives bọc try/catch: nếu chính nó ném (đúng
                // trường hợp kind "error" do executor ném) thì bỏ qua
                // ghi chép, giữ hành vi cũ — không được để `.then`
                // ném thành unhandled rejection.
                try {
                  const { actives } = collectActives(spec, pool, mediaByName, t);
                  for (const a of actives) tickSkippedClipIds.add(a.clipKey);
                } catch {
                  /* ghi badge thất bại thì giữ badge cũ, không phá vòng lặp */
                }
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
                if (!adv.exhausted) {
                  // ROUND62-R6 (b) — đóng nợ đợt 61 §5.3 (lỗi decoder
                  // sticky): element đã `error !== null` thì seek lại
                  // không bao giờ xong kể cả khi playhead về vùng
                  // decode được — drop ngay sau thất bại đã chứng minh
                  // (không chờ cạn cap 10 lần như Y2) để lần retry sau
                  // tạo element mới và hồi phục. Chỉ drop element ĐÃ
                  // LỖI (planDecoderErrorRecovery): element chỉ-timeout
                  // (decode chậm) được giữ lại để retry hội tụ như cũ.
                  // Chưa cạn cap mới drop ở đây — đã cạn cap thì khối
                  // Y2 trên đã drop toàn bộ actives, không drop trùng
                  // để khỏi lệch số đếm `seekElementRecreated`. Cùng
                  // ngữ cảnh Y2 nên `releaseElement` an toàn: seek đã
                  // settle, không còn seek bay trên element này.
                  // collectActives bọc try/catch như khối (a) trên.
                  try {
                    const { actives } = collectActives(spec, pool, mediaByName, t);
                    const plan = planDecoderErrorRecovery(actives.map((a) => a.el));
                    for (const el of plan.elements) {
                      if (pool.dropElement(el)) {
                        decoderErrorRecovered++;
                        engine.releaseElement(el);
                      }
                    }
                  } catch {
                    /* phục hồi thất bại thì giữ element cũ, retry sau đếm tiếp */
                  }
                  lastRequestedTRef.current = null;
                }
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
      // ROUND62-R6 (b): phơi tổng số element đã drop vì decoder error.
      idleDebug.decoderErrorRecovered = decoderErrorRecovered;
      // ROUND63-R6 (1): phơi tổng số element đã drop vì decoder error
      // dính trong lúc phát (biến module decoderErrorRecoveredPlaying —
      // syncMedia ở ngoài effect này nên không đọc được closure var).
      idleDebug.decoderErrorRecoveredPlaying = decoderErrorRecoveredPlaying;
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
      // Đợt 92 T2: đo tổng thời gian tickInner (syncMedia + renderFrame
      // + cập nhật store) — đối chiếu với renderFrame (chỉ vẽ canvas)
      // để biết thời gian rAF gap đi đâu: nếu tickInner ≈ renderFrame
      // mà gap vẫn ~85ms thì main thread bận việc khác (React render
      // theo playhead, video callbacks, GC) hoặc browser không lập lịch.
      const loopT0 = performance.now();
      try {
        tickInner(now);
      } catch (err) {
        tickErrors++;
        idleDebug.tickErrors = tickErrors;
        console.error("[preview] tick lỗi, vòng lặp tiếp tục:", err);
      } finally {
        recordLoopCost({ ms: performance.now() - loopT0, wallMs: now });
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
      // Tránh dt đột biến ở tick đầu sau giấc ngủ dài (dù dt đã qua
      // clampPreviewDt, trần 2 s — xem playheadPacing.ts).
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    // T5: mọi đổi trạng thái đều đánh thức vòng lặp. So sánh identity
    // spec/media/selection để ép vẽ lại khi nội dung đổi ở cùng playhead;
    // playhead/playing đổi thì đường vẽ cũ đã xử lý (t !== lastDrawn,
    // nhánh playing), chỉ cần wake là đủ.
    const unsub = useStore.subscribe((s, prev) => {
      // Đợt 60 Q1: toggle "xem trước enhance" đổi cũng phải vẽ lại frame
      // đang pause (cờ này không nằm trong spec nên điều kiện cũ không bắt).
      if (s.spec !== prev.spec || s.media !== prev.media || s.selection !== prev.selection || s.enhancePreviewEnabled !== prev.enhancePreviewEnabled) {
        redrawFlag = true;
      }
      // Đợt 102 D3 — kill pump rVFC ĐỒNG BỘ khi playhead nhảy (xem
      // rvfcKillPumpsOutsidePlayhead): Zustand subscriber chạy đồng bộ
      // trong setPlayhead, trước khi callback rVFC nào kịp bắn — đóng khe
      // seek-across mà check A6 trong rvfcCallback chỉ bịt được sau
      // 23–123 ms (C5 §1.2). Chỉ chạy khi playhead đổi (đường nóng mỗi
      // tick: helper tự no-op khi map pump rỗng).
      if (s.playhead !== prev.playhead) {
        rvfcKillPumpsOutsidePlayhead(s.playhead);
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
    // huỷ trong lúc tab ẩn lâu/bị discard; nếu bitmap còn nguyên thì vẽ
    // lại cho cùng 1 frame (px hash không đổi, xem LIMITS đợt 22 C).
    // Khi đang phát thì sleeping = false nên handler này no-op (vòng đã
    // chạy, rAF bị kẹp lúc ẩn sẽ tự nổ lại khi hiện). pagehide không cần
    // xử lý gì thêm: rAF tự dừng, không có state nào phải dọn.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!sleeping) {
        // Đợt 53 J5 — tab hiện lại trong lúc ĐANG phát (vòng không ngủ):
        // rAF đã dừng suốt thời gian tab ẩn nên `last` cũ sẽ cho dt
        // khổng lồ ở tick đầu sau khi hiện lại. Reset `last` để tick đó
        // tính dt ~0 thay vì nhảy playhead (trần dt 2 s chỉ là lưới an
        // toàn cuối, không phải cơ chế chính cho trường hợp này).
        // Playhead coi như đứng yên trong lúc tab ẩn; audio re-seek 1
        // lần về playhead rồi đồng bộ lại (cùng hành vi pause trước đây).
        last = performance.now();
        return;
      }
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
      // Đợt 92 T3: dọn ring thống kê thời gian tick render.
      if (winHook.__vcutRenderFrameTicks92T3 === renderFrameTickStats92T3) delete winHook.__vcutRenderFrameTicks92T3;
      // Đợt 34 Q2: dọn hook rAF + đóng mọi VideoFrame cache còn giữ.
      if (winHook.__vcutPreviewRaf === rafDebug) delete winHook.__vcutPreviewRaf;
      if (winHook.__vcutReverseEngine !== undefined) delete winHook.__vcutReverseEngine;
      // Đợt 53 J5: dọn hook đo analyser + bộ đếm seek lại + trạng thái media.
      if (winHook.__vcutAudioAnalyser !== undefined) delete winHook.__vcutAudioAnalyser;
      if (winHook.__vcutSyncReseeks !== undefined) delete winHook.__vcutSyncReseeks;
      if (winHook.__vcutSyncReseeksVideo !== undefined) delete winHook.__vcutSyncReseeksVideo;
      if (winHook.__vcutSyncReseeksAudio !== undefined) delete winHook.__vcutSyncReseeksAudio;
      if (winHook.__vcutSyncRestartEndedVideo !== undefined) delete winHook.__vcutSyncRestartEndedVideo;
      if (winHook.__vcutSyncRestartEndedAudio !== undefined) delete winHook.__vcutSyncRestartEndedAudio;
      // Đợt 85 M4: dọn hook dấu vết tick đường restart.
      if (winHook.__vcutRestartEndedTrace !== undefined) delete winHook.__vcutRestartEndedTrace;
      // Đợt 86 N3: dọn hook đếm tick bỏ qua render vì seeking.
      if (winHook.__vcutSeekSkipRenderTicks86N3 !== undefined) delete winHook.__vcutSeekSkipRenderTicks86N3;
      // Đợt 90 R2: dọn hook đếm tick/lần giữ playhead.
      if (winHook.__vcutPlayheadHold90R2 !== undefined) delete winHook.__vcutPlayheadHold90R2;
      if (winHook.__vcutResumeWatch96X4 !== undefined) delete winHook.__vcutResumeWatch96X4;
      // Đợt 97 Y4: dọn hook đuôi ân hạn sau khi watch hết.
      if (winHook.__vcutResumeGraceTail97Y4 !== undefined) delete winHook.__vcutResumeGraceTail97Y4;
      // Đợt 98 Z3: dọn hook đếm bò của detector đóng băng theo tốc độ.
      if (winHook.__vcutResumeFreezeCrawl98Z3 !== undefined) delete winHook.__vcutResumeFreezeCrawl98Z3;
      // Đợt 100 B3: dọn hook đếm burst-bị-chặn của đuôi.
      if (winHook.__vcutTailBurstBlocked100B3 !== undefined) delete winHook.__vcutTailBurstBlocked100B3;
      if (winHook.__vcutMediaState !== undefined) delete winHook.__vcutMediaState;
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
      <div className="vu-meter" title={i18nT("preview.volumeTitle")}>
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
        title={i18nT("preview.proxyBadge")}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      {/* R5: badge chế độ LUT — góc trên-phải (tránh badge PROXY bên trái).
          "LUT WebGL" = đang áp LUT 3D thật; "LUT CSS ≈" = đang dùng CSS xấp xỉ
          (bridge chưa chạy / WebGL không khả dụng / load lỗi); "LUT…" = đang tải .cube. */}
      <div
        ref={lutBadgeRef}
        className="preview-lut-badge"
        title={i18nT("preview.lutBadge")}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      {/* S4: badge motion — giữa trên (tránh PROXY trái, LUT phải).
          "NỘI SUY" = render sẽ nội suy frame mới, preview giữ fps project
          nên export mượt hơn preview; "BLUR≈" = preview chỉ ghosting xấp xỉ,
          render dùng tmix thật. Xem MOTION_PREVIEW_LIMITS.md. */}
      <div
        ref={motionBadgeRef}
        className="preview-motion-badge"
        title={i18nT("preview.motionBadge")}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      {/* K4 (đợt 27): badge chế độ phát ngược — hiện suốt khi cờ
          reversePlayback bật (dù đang phát ngược hay tạm dừng ở chế độ
          ngược), báo rõ không có audio đồng bộ khi phát ngược. */}
      {isReversePlayback && (
        <div
          className="preview-reverse-badge"
          title={i18nT("preview.reverseBadge")}
        >
          {i18nT("preview.reverseLabel")}
        </div>
      )}
      {/* K4 (đợt 27): badge FRAME GIỮ — góc dưới-giữa, cập nhật qua ref
          trong vòng lặp (xem khối badge K4): chỉ hiện khi tick trước có
          clip rơi vào nhánh hold (decoder tụt, đang vẽ lại frame tốt cũ). */}
      <div
        ref={holdBadgeRef}
        className="preview-hold-badge"
        title={i18nT("preview.holdBadge")}
        style={{ display: "none" }}
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
        style={{ display: "none" }}
        aria-hidden="true"
      />
      {/* J1 (đợt 26): badge cảnh báo curve fail-soft — góc dưới-trái, chỉ
          hiện khi có nested lỗi (text + title cập nhật qua ref trong vòng
          lặp, kèm toast 1 lần). Hover để đọc tên nested + lý do đầy đủ.
          Đợt 58 O3: cùng badge này nay còn hiển thị skipped/skippedReasons
          của failsoft (mục lồng nhau / hiệu ứng bị bỏ qua khỏi preview). */}
      <div
        ref={curveWarnBadgeRef}
        className="preview-curve-warn-badge"
        title=""
        role="status"
        style={{ display: "none" }}
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
        style={{ display: "none" }}
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
      >
        {i18nT("decodeahead.toggleOff")}
      </button>
      {/* K5: nút fullscreen góc trên-phải (phím F cũng bật/tắt được). */}
      <button
        className="preview-fs-btn"
        title={isFullscreen ? i18nT("preview.fsExitTitle") : i18nT("preview.fsEnterTitle")}
        aria-label={isFullscreen ? i18nT("preview.fsExit") : i18nT("preview.fsEnter")}
        onClick={togglePreviewFullscreen}
      >
        <span aria-hidden="true">⛶</span>
      </button>
      {/* Đợt 73 A9 (S4): nút bật/tắt overlay vùng an toàn — đặt dưới nút
          fullscreen để không chồng nút decode-ahead (góc trên-phải).
          aria-pressed để harness/click-test đọc trạng thái. */}
      <button
        className="preview-safearea-toggle"
        type="button"
        title={i18nT("safeArea.toggleTitle")}
        aria-label={i18nT("safeArea.toggleAria")}
        aria-pressed={safeAreaOn}
        onClick={() => {
          const next = !safeAreaOn;
          setSafeAreaOn(next);
          try {
            localStorage.setItem("vcut.safeArea", next ? "1" : "0");
          } catch {
            /* bỏ qua khi storage không ghi được */
          }
        }}
      >
        {safeAreaOn ? i18nT("safeArea.toggleOn") : i18nT("safeArea.toggleOff")}
      </button>
      {/* Đợt 73 A9 (S4): lớp phủ vùng an toàn — chỉ vẽ lên đúng khung video
          đã letterbox (safeAreaVideoRect), không vẽ lên viền đen hai bên. */}
      <SafeAreaOverlay
        enabled={safeAreaOn}
        platformId={safeAreaPlatformId}
        videoRect={safeAreaVideoRect}
        videoW={previewSpecMeta.width}
        videoH={previewSpecMeta.height}
        onPlatformChange={(id) => {
          setSafeAreaChoice(id);
          try {
            localStorage.setItem("vcut.safeAreaPlatform", id);
          } catch {
            /* bỏ qua khi storage không ghi được */
          }
        }}
      />
      {/* K5: gợi ý khi project chưa có clip nào — không chặn thao tác (pointer-events: none). */}
      {clipCount === 0 && (
        <div className="preview-empty-hint" aria-hidden="true">
          <div className="preview-empty-title">{i18nT("preview.emptyTitle")}</div>
          <div>{i18nT("preview.emptyHint")}</div>
        </div>
      )}
    </div>
  );
}
