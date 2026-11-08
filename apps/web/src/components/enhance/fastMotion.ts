/**
 * fastMotion.ts — Detector chuyển động nhanh + cảnh báo denoise ≥0,7
 * (Phase 9 đợt 64, luồng R2 — đóng nợ đợt 63 R2 §8 mục 2).
 *
 * Chia 2 tầng:
 *  1. Logic THUẦN (test được bằng esbuild+node, không cần DOM):
 *     framePairDiff / boxBlur3 / classifyMotion /
 *     shouldWarnDenoiseGhosting — CÙNG định nghĩa metric và CÙNG ngưỡng
 *     với server/render/src/fastMotion.js (nguồn hiệu chuẩn: clip 720p
 *     5s, xem LIMITS đợt 64 R2 §2). Harness server assert 2 file đồng
 *     bộ ngưỡng — đổi số ở 1 bên mà không đổi bên kia là FAIL.
 *  2. Sampler trình duyệt (measureClipMotion): seek từng cặp frame kề
 *     (Δt = 1/30s) trên <video> offscreen, vẽ xuống canvas 160×90,
 *     diff bằng logic thuần. Dùng proxyUrl khi có (nhẹ hơn file gốc,
 *     cùng fps/duration nên score không đổi), fallback về url gốc khi
 *     proxy lỗi. Kết quả cache theo clip+trim trong phiên.
 *
 * Quy tắc cảnh báo (UI EnhancePanel) — ĐỔI Ở ĐỢT 65 S2 (xem
 * docs/PHASE9_ROUND65_S2_LIMITS.md; đồng bộ server/render/src/fastMotion.js):
 *  - denoise ≥0,7 + đo được "fast" → cảnh báo CỤ THỂ (kèm score đo được).
 *  - denoise ≥0,7 + "slow"/"medium" → CẢNH BÁO (câu riêng, kèm score +
 *    level — KHÔNG gọi clip là "chuyển động nhanh"). R4 + đợt 65 S2 đo
 *    trên footage thật: bước nhảy ghost 0,5→0,7 gần như không đổi theo
 *    tốc độ (+0,057–0,083 ở 0,6–13,6 px/f), cổng cũ chỉ-fast bỏ sót 4/6
 *    clip thật ghost-positive nên không giữ cổng theo tốc độ nữa.
 *  - denoise ≥0,7 + không đo được (thiếu media / decode lỗi) → cảnh báo
 *    CHUNG (không biết chuyển động, khuyên render thử).
 *  - denoise <0,7 hoặc tắt → không đo, không cảnh báo.
 *
 * Chuỗi hiển thị đọc từ fragment round64-r2.json + round65-s2.json (import
 * trực tiếp, mẫu captionPhase63R1.ts) — hiện ngay cả trước khi parent gộp
 * dict vào vi.json/en.json; fallback vi rồi tới chuỗi cứng trong file.
 */
import fragment from "../../i18n/fragments/round64-r2.json";
import fragment65s2 from "../../i18n/fragments/round65-s2.json";
import type { Lang } from "../../i18n";

/** Khổ đo — phải khớp server/render/src/fastMotion.js. */
export const FAST_MOTION_WIDTH = 160;
export const FAST_MOTION_HEIGHT = 90;
/** Ngưỡng phân loại — phải khớp server (harness assert đồng bộ). */
export const FAST_MOTION_MEDIUM_THRESHOLD = 4.0;
export const FAST_MOTION_FAST_THRESHOLD = 6.0;
/** Ngưỡng cảnh báo denoise (đợt 63 R2 §3.2). */
export const DENOISE_WARN_STRENGTH = 0.7;
/** Số cặp frame lấy mẫu trên 1 clip (trình duyệt). */
export const FAST_MOTION_SAMPLE_PAIRS = 10;
/** Khoảng cách 2 frame trong 1 cặp (giây) — cặp frame kề ở 30fps. */
export const FAST_MOTION_PAIR_DT = 1 / 30;
/** Timeout mỗi lần seek (ms) — quá thì bỏ cặp đó, không bịa số 0. */
export const FAST_MOTION_SEEK_TIMEOUT_MS = 1500;
/** Cần ít nhất bấy nhiêu cặp hợp lệ mới kết luận (ít hơn → unknown). */
export const FAST_MOTION_MIN_VALID_PAIRS = 3;

export type MotionLevel = "slow" | "medium" | "fast" | "unknown";

export interface MotionResult {
  score: number;
  level: Exclude<MotionLevel, "unknown">;
  nPairs: number;
  costMs: number;
}

/**
 * Box blur 3×3 trên ảnh gray (Uint8Array, w×h), viền giữ nguyên.
 * Bản sao của server/render/src/fastMotion.js — giữ đồng bộ.
 */
export function boxBlur3(gray: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(gray.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += gray[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = Math.round(sum / n);
    }
  }
  return out;
}

/**
 * Điểm chênh lệch giữa 2 frame gray cùng kích thước: mean |Δ| + tỉ lệ
 * pixel rơi vào dải small (2<|Δ|≤8) — dải nhạy ghost nhất (đợt 63 R2 §3.2).
 * Bản sao của server/render/src/fastMotion.js — giữ đồng bộ.
 */
export function framePairDiff(
  a: Uint8Array,
  b: Uint8Array,
): { meanAbsDiff: number; smallBandShare: number } {
  if (a.length !== b.length) throw new Error("framePairDiff: 2 frame khác kích thước");
  let sum = 0;
  let small = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    sum += d;
    if (d > 2 && d <= 8) small++;
  }
  return { meanAbsDiff: sum / a.length, smallBandShare: small / a.length };
}

/** Trích kênh xám (Rec.601) từ ImageData RGBA. */
export function grayFromImageData(data: Uint8ClampedArray): Uint8Array {
  const n = data.length / 4;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    out[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return out;
}

/**
 * Phân loại mức chuyển động từ score (mean |Δ| mỗi cặp frame kề 30fps).
 * "medium" là vùng xám giữa slow và fast. Level chỉ là thông tin hiển
 * thị trong câu cảnh báo — từ đợt 65 S2, level không còn quyết định có
 * cảnh báo hay không (cảnh báo ở ≥0,7 với mọi mức đo được).
 */
export function classifyMotion(score: number): Exclude<MotionLevel, "unknown"> {
  if (!Number.isFinite(score) || score < 0) throw new Error(`classifyMotion: score không hợp lệ ${score}`);
  if (score >= FAST_MOTION_FAST_THRESHOLD) return "fast";
  if (score >= FAST_MOTION_MEDIUM_THRESHOLD) return "medium";
  return "slow";
}

/**
 * Có nên cảnh báo ghosting denoise không: strength ≥0,7 VÀ đã đo được
 * chuyển động (slow/medium/fast đều cảnh báo — R4 + đợt 65 S2 chứng minh
 * clip chậm/vừa vẫn ghost như clip nhanh trên footage thật; xem đầu file).
 * Chưa đo được (unknown) → KHÔNG cảnh báo cụ thể (caller tự quyết
 * fallback chung).
 */
export function shouldWarnDenoiseGhosting(strength: number, motionLevel: MotionLevel): boolean {
  if (typeof strength !== "number" || !Number.isFinite(strength)) return false;
  return (
    strength >= DENOISE_WARN_STRENGTH &&
    (motionLevel === "slow" || motionLevel === "medium" || motionLevel === "fast")
  );
}

/** Khóa cache: clip + trim nguồn + url (đổi trim hoặc file → đo lại). */
export function fastMotionCacheKey(clipId: string, src: string, inSec: number, outSec: number): string {
  return `${clipId}|${src}|${inSec}|${outSec}`;
}

const cache = new Map<string, Promise<MotionResult>>();

export function clearFastMotionCache(): void {
  cache.clear();
}

function seekTo(v: HTMLVideoElement, t: number): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      v.onseeked = null;
      v.onerror = null;
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), FAST_MOTION_SEEK_TIMEOUT_MS);
    v.onseeked = () => {
      // Chỉ tính là seek thành công khi currentTime đã tới gần đích
      // (tránh tính frame cũ khi seek bị kẹt rồi timeout).
      finish(Math.abs(v.currentTime - t) < 0.05);
    };
    v.onerror = () => finish(false);
    try {
      v.currentTime = t;
    } catch {
      finish(false);
    }
  });
}

function loadVideo(v: HTMLVideoElement, url: string): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      v.onloadeddata = null;
      v.onerror = null;
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), 8000);
    v.onloadeddata = () => finish(true);
    v.onerror = () => finish(false);
    v.src = url;
  });
}

/**
 * Đo chuyển động của 1 clip video trong trình duyệt: lấy N cặp frame kề
 * (Δt = 1/30s) rải đều trên đoạn nguồn [inSec, outSec], vẽ xuống canvas
 * 160×90, mờ nhẹ rồi diff. Cặp nào seek lỗi/timeout thì BỎ (không tính
 * diff 0 giả); ít hơn FAST_MOTION_MIN_VALID_PAIRS cặp hợp lệ thì throw.
 * Dùng proxyUrl trước (nếu có), lỗi thì thử url gốc 1 lần.
 */
export async function measureClipMotion(
  videoUrl: string,
  opts: { inSec: number; outSec: number; proxyUrl?: string; pairs?: number },
): Promise<MotionResult> {
  const t0 = performance.now();
  const inSec = Math.max(0, opts.inSec);
  const outSec = Math.max(inSec + 0.1, opts.outSec);
  const pairs = opts.pairs ?? FAST_MOTION_SAMPLE_PAIRS;
  const v = document.createElement("video");
  v.muted = true;
  v.preload = "auto";
  v.playsInline = true;
  const loaded = await loadVideo(v, opts.proxyUrl ?? videoUrl);
  if (!loaded && opts.proxyUrl) {
    // Proxy lỗi (vd file proxy đã mất) → thử file gốc 1 lần.
    if (!(await loadVideo(v, videoUrl))) {
      v.src = "";
      throw new Error("measureClipMotion: không nạp được video (cả proxy lẫn file gốc)");
    }
  } else if (!loaded) {
    v.src = "";
    throw new Error("measureClipMotion: không nạp được video");
  }
  const duration = v.duration || outSec;
  const end = Math.min(outSec, duration - 0.05);
  const start = Math.min(inSec, Math.max(0, end - 0.1));
  if (end - start < 0.05) {
    v.src = "";
    throw new Error("measureClipMotion: đoạn clip quá ngắn để đo");
  }
  const canvas = document.createElement("canvas");
  canvas.width = FAST_MOTION_WIDTH;
  canvas.height = FAST_MOTION_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    v.src = "";
    throw new Error("measureClipMotion: không tạo được canvas 2d");
  }
  const grab = async (t: number): Promise<Uint8Array | null> => {
    const ok = await seekTo(v, t);
    if (!ok) return null;
    try {
      ctx.drawImage(v, 0, 0, FAST_MOTION_WIDTH, FAST_MOTION_HEIGHT);
      const img = ctx.getImageData(0, 0, FAST_MOTION_WIDTH, FAST_MOTION_HEIGHT);
      return boxBlur3(grayFromImageData(img.data), FAST_MOTION_WIDTH, FAST_MOTION_HEIGHT);
    } catch {
      return null;
    }
  };
  const diffs: number[] = [];
  for (let i = 0; i < pairs; i++) {
    const t = start + ((end - start - FAST_MOTION_PAIR_DT) * (i + 0.5)) / pairs;
    const a = await grab(t);
    if (!a) continue;
    const b = await grab(Math.min(t + FAST_MOTION_PAIR_DT, duration - 0.02));
    if (!b) continue;
    diffs.push(framePairDiff(a, b).meanAbsDiff);
  }
  v.src = "";
  if (diffs.length < FAST_MOTION_MIN_VALID_PAIRS) {
    throw new Error(
      `measureClipMotion: chỉ đo được ${diffs.length}/${pairs} cặp frame hợp lệ (cần ≥${FAST_MOTION_MIN_VALID_PAIRS})`,
    );
  }
  const score = diffs.reduce((x, y) => x + y, 0) / diffs.length;
  return {
    score: +score.toFixed(3),
    level: classifyMotion(score),
    nPairs: diffs.length,
    costMs: Math.round(performance.now() - t0),
  };
}

/**
 * Đo có cache trong phiên (cùng clip+trim → trả promise cũ, không đo lại).
 * Lỗi đo KHÔNG cache (lần sau đo lại được).
 */
export function measureClipMotionCached(
  key: string,
  videoUrl: string,
  opts: { inSec: number; outSec: number; proxyUrl?: string; pairs?: number },
): Promise<MotionResult> {
  const hit = cache.get(key);
  if (hit) return hit;
  const p = measureClipMotion(videoUrl, opts);
  cache.set(key, p);
  p.catch(() => {
    if (cache.get(key) === p) cache.delete(key);
  });
  return p;
}

/** Bảng chuỗi từ fragment round64-r2 + round65-s2 (mẫu captionPhase63R1.ts). */
export interface FastMotionStrings {
  warning: string;
  warningSlow: string;
  unknown: string;
  measuring: string;
  levelFast: string;
  levelMedium: string;
  levelSlow: string;
}

export function fastMotionStrings(lang: Lang): FastMotionStrings {
  type Table = { vi?: { enhance?: Record<string, string> }; en?: { enhance?: Record<string, string> } };
  const f = fragment as unknown as Table;
  const f65 = fragment65s2 as unknown as Table;
  // Gộp 2 fragment (round65-s2 đè round64-r2 nếu trùng key — hiện không trùng).
  const table = { ...((f[lang] && f[lang].enhance) || {}), ...((f65[lang] && f65[lang].enhance) || {}) };
  const vi = { ...((f.vi && f.vi.enhance) || {}), ...((f65.vi && f65.vi.enhance) || {}) };
  const pick = (key: string, fallback: string): string => {
    const hit = table[key];
    if (typeof hit === "string" && hit.length > 0) return hit;
    const v = vi[key];
    if (typeof v === "string" && v.length > 0) return v;
    return fallback;
  };
  return {
    warning: pick(
      "fastMotionWarning",
      "⚠️ Clip chuyển động nhanh (độ chuyển động {score}) — khử nhiễu {pct}% có thể để lại vệt mờ (ghosting) trên vùng chuyển động. Giảm xuống dưới 70% nếu thấy vệt mờ theo vật thể.",
    ),
    warningSlow: pick(
      "fastMotionWarningSlow",
      "⚠️ Khử nhiễu {pct}% có thể để lại vệt mờ (ghosting) — đo trên footage thật cho thấy vệt mờ tăng rõ từ 50% lên 70% ngay cả trên clip chuyển động {level} (độ chuyển động {score}). Giảm xuống dưới 70% nếu thấy vệt mờ theo vật thể.",
    ),
    unknown: pick(
      "fastMotionUnknown",
      "⚠️ Không đo được chuyển động của clip này — khử nhiễu {pct}% có thể để lại vệt mờ trên clip chuyển động nhanh. Render thử đoạn ngắn để kiểm tra trước khi xuất.",
    ),
    measuring: pick("fastMotionMeasuring", "Đang đo chuyển động của clip…"),
    levelFast: pick("fastMotionLevelFast", "nhanh"),
    levelMedium: pick("fastMotionLevelMedium", "vừa"),
    levelSlow: pick("fastMotionLevelSlow", "chậm"),
  };
}

/** Điền {score}/{pct}/{level} vào chuỗi cảnh báo (định dạng số 1 chữ số thập phân). */
export function formatFastMotionWarning(
  template: string,
  vars: { score: number; pct: number; level?: string },
): string {
  return template
    .replace("{score}", vars.score.toFixed(1))
    .replace("{pct}", String(Math.round(vars.pct)))
    .replace("{level}", vars.level ?? "");
}
