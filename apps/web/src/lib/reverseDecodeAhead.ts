/**
 * Phase 9 đợt 34, luồng Q3 — Cửa sổ decode-ahead cho phát ngược
 * trên footage nhiễu (follow-up nợ §3.4 của đợt 33 / §6.4 của P5 đợt 32).
 *
 * Bối cảnh đo được (không đoán):
 * - P5 đợt 32: decode phần mềm footage nhiễu thật (testsrc2 + noise,
 *   1280×720, GOP 300) chỉ 31,9 fps — biên ~6% so với 30 fps phát ngược.
 *   // ROUND44-Z5: "GOP 300" ở đây = cửa sổ decode 300 frame từ
 *   // keyframe 0 của clip nhiễu P5 (đặt -g 300), không phải GOP hiệu
 *   // dụng đều 300 — clip đó có 5 keyframe do scenecut (P5 §2.3 tự
 *   // ghi); số 31,9 fps vẫn đứng, chỉ diễn giải GOP cần đọc kèm đây.
 * - Decode 1 GOP là decode XUÔI rồi present NGƯỢC: frame cần đầu tiên
 *   của cửa sổ kế (frame cuối GOP) lại là frame decode CUỐI cùng.
 *   Vì vậy cửa sổ kế chỉ present được khi (gần như) toàn bộ GOP của
 *   nó đã decode xong — decode-ahead phải HOÀN THÀNH trước biên cửa
 *   sổ, không phải "chạy kịp dần dần" như phát xuôi.
 *
 * Hệ quả (đây là lý do module này tồn tại):
 * - Điều kiện ổn định KHÔNG phụ thuộc kích thước cửa sổ:
 *   decodeFps >= playbackFps (31,9 >= 30, biên 6,3%). Cửa sổ to hơn
 *   không cứu được decode chậm hơn tốc độ phát về lâu dài.
 * - Cái cửa sổ to / prefetch sâu MUA được là slack tuyệt đối (giây)
 *   chống jitter: slack = thời gian từ lúc bắt đầu decode cửa sổ
 *   kế tới lúc playhead chạm biên của nó, trừ đi thời gian decode
 *   cửa sổ đó. Slack này tỉ lệ với kích thước cửa sổ và độ sâu
 *   prefetch, và bị chặn trên bởi bộ nhớ VideoFrame thật.
 * - Vì vậy module này KHÔNG tự chọn "cửa sổ càng to càng tốt": nó
 *   tính cửa sổ lớn nhất vừa ngân sách bộ nhớ (đo thật, không dùng
 *   số NV12 lý thuyết làm quyết định cuối), rồi báo cáo slack còn
 *   lại một cách trung thực — kể cả khi slack < ngưỡng.
 *
 * Phạm vi: module này CHỈ sở hữu logic cửa sổ / prefetch / evict
 * (thuần, test được bằng Node, không cần browser). Nó import TYPE
 * ReverseFrameCache từ reverseWebcodecs.ts và KHÔNG sửa file đó.
 * Nó không nối vào preview.tsx, không đụng seek.ts /
 * previewRafHook.ts / reversePlayback.ts / i18n / bridge.
 * Việc nối vào preview vẫn cần ctts/elst + đo GPU (nợ P5 §6).
 */
import type { ReverseFrameCache } from "./reverseWebcodecs";

/** Cấu hình chọn cửa sổ. frameBytes PHẢI là số đo thật (xem LIMITS Q3). */
export type DecodeAheadConfig = {
  /** Tốc độ phát ngược, frame/s (thường 30). */
  playbackFps: number;
  /** Tốc độ decode đo được trên đúng loại footage, frame/s. */
  decodeFps: number;
  /** Byte thật / 1 VideoFrame đã decode (đo bằng RSS cây process). */
  frameBytes: number;
  /** Ngân sách bộ nhớ tối đa cho toàn bộ cache cửa sổ, byte. */
  memoryBudgetBytes: number;
  /** Số frame / GOP của footage (cửa sổ luôn snap theo bội số GOP). */
  gopFrames: number;
  /** Cửa sổ tối thiểu, frame (mặc định 90 — đề xuất O5). */
  minWindowFrames?: number;
  /** Cửa sổ tối đa, frame (mặc định 900 = 30 s @30fps). */
  maxWindowFrames?: number;
  /** Số cửa sổ decode trước playhead (mặc định 2 — "prefetch 2 GOP"). */
  aheadWindows?: number;
  /** Slack tối thiểu mong muốn, giây (mặc định 1,0). */
  minSlackSeconds?: number;
  /** Chi phí cố định / lần decode cửa sổ, giây (tạo decoder...). */
  decodeStartupSeconds?: number;
};

export type ChosenWindow = {
  /** Số frame / cửa sổ (đã snap theo bội số GOP). */
  windowFrames: number;
  /** Độ sâu prefetch thực dùng (có thể thấp hơn yêu cầu nếu thiếu bộ nhớ). */
  aheadWindows: number;
  /** Số cửa sổ giữ đồng thời tối đa = 1 (đang phát) + aheadWindows. */
  heldWindows: number;
  /** Số frame giữ đồng thời tối đa. */
  heldFrames: number;
  /** Bộ nhớ tương ứng, byte. */
  memoryBytes: number;
  /** Thời lượng 1 cửa sổ ở tốc độ phát, giây. */
  windowSeconds: number;
  /** Thời gian decode 1 cửa sổ (startup + frames/decodeFps), giây. */
  decodeSeconds: number;
  /**
   * Slack của cửa sổ XA NHẤT trong prefetch: thời gian từ lúc bắt
   * đầu decode nó tới lúc playhead cần nó, trừ decodeSeconds.
   * Đây là đệm jitter thực sự của thiết kế (không phải biên %).
   */
  slackSeconds: number;
  /** Biên ổn định: decodeFps/playbackFps - 1 (âm = không giữ nổi). */
  steadyMargin: number;
  /** Yếu tố nào chặn cửa sổ lại: 'memory' | 'max' | 'min' | 'none'. */
  cappedBy: "memory" | "max" | "min" | "none";
  /** true khi slack >= minSlackSeconds và steadyMargin >= 0. */
  meetsTarget: boolean;
};

function clampInt(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, Math.floor(v)));
}

/**
 * Chọn cửa sổ decode-ahead. Quy tắc, theo thứ tự:
 * 1. Cửa sổ snap theo bội số GOP (decode luôn bắt đầu từ keyframe).
 * 2. Lớn nhất có thể trong ngân sách: heldFrames = (1 + ahead) * window
 *    <= floor(budget / frameBytes) — vì slack tỉ lệ với window.
 * 3. Không vượt maxWindowFrames, không dưới minWindowFrames; nếu ngay
 *    cả 1 GOP cũng không vừa ngân sách thì trả về 1 GOP kèm
 *    cappedBy='memory' và meetsTarget=false (không giấu bằng cách
 *    thu nhỏ cửa sổ xuống dưới 1 GOP — decode dưới GOP là vô nghĩa).
 */
export function chooseDecodeAheadWindow(cfg: DecodeAheadConfig): ChosenWindow {
  const minW = cfg.minWindowFrames ?? 90;
  const maxW = cfg.maxWindowFrames ?? 900;
  const desiredAhead = Math.max(0, Math.floor(cfg.aheadWindows ?? 2));
  const minSlack = cfg.minSlackSeconds ?? 1.0;
  const startup = cfg.decodeStartupSeconds ?? 0;
  const gop = Math.max(1, Math.floor(cfg.gopFrames));
  const maxByMemory =
    cfg.frameBytes > 0
      ? Math.floor(cfg.memoryBudgetBytes / cfg.frameBytes)
      : 0;
  const snapMax = Math.floor(maxW / gop) * gop;
  // Ưu tiên giữ độ sâu prefetch: thử ahead từ cao xuống thấp, lấy
  // cấu hình đầu tiên mà 1 GOP vừa ngân sách. Chỉ khi ngay cả
  // ahead=0 với 1 GOP cũng vượt ngân sách mới trả về cấu hình vượt
  // ngân sách kèm cappedBy='memory' + meetsTarget=false (không giấu).
  let window = 0;
  let ahead = desiredAhead;
  let cappedBy: ChosenWindow["cappedBy"] = "none";
  for (let a = desiredAhead; a >= 0; a--) {
    const heldBudget = Math.floor(maxByMemory / (1 + a));
    const w = Math.floor(Math.min(heldBudget, maxW) / gop) * gop;
    if (w >= gop) {
      window = w;
      ahead = a;
      cappedBy =
        w >= snapMax && snapMax > 0
          ? "max"
          : heldBudget < maxW
            ? "memory"
            : "none";
      break;
    }
  }
  if (window === 0) {
    window = gop;
    ahead = 0;
    cappedBy = "memory";
  } else if (window < minW && cappedBy !== "memory") {
    cappedBy = "min";
  }
  const heldFrames = (1 + ahead) * window;
  const windowSeconds = window / cfg.playbackFps;
  const decodeSeconds = startup + window / cfg.decodeFps;
  // Cửa sổ xa nhất cần sau ahead cửa sổ nữa; decode của nó bắt đầu
  // cùng lúc với cửa sổ hiện tại (decode tuần tự các cửa sổ kế):
  // thời gian tới lúc cần nó = ahead * windowSeconds, nhưng decode
  // tuần tự ahead cửa sổ tốn ahead * decodeSeconds — slack thật cho
  // chuỗi tuần tự là ahead*(windowSeconds - decodeSeconds).
  // (Decode song song nhiều decoder không được giả định ở đây.)
  const slackSeconds = ahead * (windowSeconds - decodeSeconds);
  const steadyMargin =
    cfg.playbackFps > 0 ? cfg.decodeFps / cfg.playbackFps - 1 : -1;
  return {
    windowFrames: window,
    aheadWindows: ahead,
    heldWindows: 1 + ahead,
    heldFrames,
    memoryBytes: heldFrames * cfg.frameBytes,
    windowSeconds,
    decodeSeconds,
    slackSeconds,
    steadyMargin,
    cappedBy,
    meetsTarget:
      slackSeconds >= minSlack &&
      steadyMargin >= 0 &&
      heldFrames * cfg.frameBytes <= cfg.memoryBudgetBytes,
  };
}

/** GOP start <= index trong danh sách keyframe đã sort tăng dần. */
export function gopStartFromKeys(keyIndices: number[], index: number): number {
  let start = 0;
  for (const k of keyIndices) {
    if (k <= index) start = k;
    else break;
  }
  return start;
}

export type ReverseWindowPlan = {
  /** Đoạn present ngược: presentFrom..presentTo (presentTo = playhead). */
  presentFrom: number;
  presentTo: number;
  /** Đoạn cần decode để có đủ đoạn present (align đầu GOP). */
  decodeFrom: number;
  decodeTo: number;
  /** Cửa sổ kế theo chiều ngược (playhead sẽ đi vào sau cửa sổ này). */
  nextPresentFrom: number;
  nextPresentTo: number;
  nextDecodeFrom: number;
  nextDecodeTo: number;
};

/**
 * Lập kế hoạch cửa sổ ngược tại playheadIndex. Cửa sổ hiện tại chứa
 * playhead ở đầu trên; cửa sổ kế nằm ngay dưới nó. Cả hai decode
 * từ keyframe (đầu GOP) chứa frame đầu của chúng.
 */
export function planReverseWindow(
  totalFrames: number,
  keyIndices: number[],
  playheadIndex: number,
  windowFrames: number,
): ReverseWindowPlan {
  const presentTo = clampInt(playheadIndex, 0, totalFrames - 1);
  const presentFrom = Math.max(0, presentTo - windowFrames + 1);
  const nextPresentTo = presentFrom - 1;
  const nextPresentFrom = Math.max(0, nextPresentTo - windowFrames + 1);
  return {
    presentFrom,
    presentTo,
    decodeFrom: gopStartFromKeys(keyIndices, presentFrom),
    decodeTo: presentTo,
    nextPresentFrom,
    nextPresentTo,
    nextDecodeFrom:
      nextPresentTo >= 0 ? gopStartFromKeys(keyIndices, nextPresentFrom) : -1,
    nextDecodeTo: nextPresentTo,
  };
}

/**
 * Thứ tự evict khi cache vượt ngân sách, chiều phát NGƯỢC:
 * 1. Frame đã phát xong (index > playhead + holdFrames), xa nhất trước
 *    (index lớn nhất trước) — chúng không bao giờ cần lại trừ khi
 *    user đổi chiều.
 * 2. Frame prefetch quá xa (index < biên dưới của tập keep), thấp
 *    nhất trước — chúng xa playhead nhất về phía chưa phát.
 * 3. KHÔNG BAO GIỜ evict frame trong tập keep, kể cả khi vẫn vượt
 *    ngân sách (trả về phần còn thừa để caller báo cáo, không tự
 *    phá cửa sổ đang phát).
 */
export function selectEvictions(
  heldIndices: number[],
  keep: Set<number>,
  playheadIndex: number,
  holdFrames = 2,
): { evict: number[]; keptOutsideBudget: number[] } {
  const above: number[] = [];
  const below: number[] = [];
  const keptOutside: number[] = [];
  let minKeep = Infinity;
  for (const k of keep) if (k < minKeep) minKeep = k;
  for (const idx of heldIndices) {
    if (keep.has(idx)) continue;
    if (idx > playheadIndex + holdFrames) above.push(idx);
    else if (idx < minKeep) below.push(idx);
    else keptOutside.push(idx);
  }
  above.sort((a, b) => b - a);
  below.sort((a, b) => a - b);
  return { evict: [...above, ...below], keptOutsideBudget: keptOutside };
}

/** Số frame cần evict để vừa ngân sách, dựa trên số đo thật. */
export function evictCountForBudget(
  heldFrames: number,
  frameBytes: number,
  memoryBudgetBytes: number,
): number {
  if (frameBytes <= 0) return 0;
  const maxFrames = Math.floor(memoryBudgetBytes / frameBytes);
  return Math.max(0, heldFrames - maxFrames);
}

/**
 * Controller mỏng trên ReverseFrameCache: caller điều phối (không tự
 * chạy vòng present — giống triết lý của reverseWebcodecs.ts).
 * prefetchWindow có guard chống decode trùng cửa sổ đang bay; evict
 * dùng đúng chính sách selectEvictions rồi delegate cho cache.
 */
export class ReverseDecodeAhead {
  private inFlight = new Set<string>();
  private readonly cache: ReverseFrameCache;

  constructor(cache: ReverseFrameCache) {
    this.cache = cache;
  }

  get heldCount(): number {
    return this.cache.size;
  }

  /**
   * Đợt 39 T4 — số cửa sổ prefetch đang bay (để status phơi cho
   * harness: tắt toggle mà con số này > 0 nghĩa là vẫn còn prefetch
   * dở, sẽ bị dọn khi settle theo luật shouldDropSettledPrefetch).
   */
  get inFlightCount(): number {
    return this.inFlight.size;
  }

  /** Decode cửa sổ [from, to] nếu chưa đủ frame; trả về số decode được. */
  async decodeWindow(
    track: Parameters<ReverseFrameCache["decodeGop"]>[0],
    samples: Parameters<ReverseFrameCache["decodeGop"]>[1],
    from: number,
    to: number,
    getData: Parameters<ReverseFrameCache["decodeGop"]>[4],
    preferHardware = false,
  ): Promise<number> {
    return this.cache.decodeGop(track, samples, from, to, getData, preferHardware);
  }

  /** Prefetch cửa sổ kế: bỏ qua nếu cùng cửa sổ đang bay (không race). */
  prefetchWindow(
    track: Parameters<ReverseFrameCache["decodeGop"]>[0],
    samples: Parameters<ReverseFrameCache["decodeGop"]>[1],
    from: number,
    to: number,
    getData: Parameters<ReverseFrameCache["decodeGop"]>[4],
    preferHardware = false,
  ): Promise<number> | null {
    const key = `${from}:${to}`;
    if (this.inFlight.has(key)) return null;
    this.inFlight.add(key);
    return this.cache
      .decodeGop(track, samples, from, to, getData, preferHardware)
      .finally(() => {
        this.inFlight.delete(key);
      });
  }

  /** Evict theo chính sách ngược; trả về số frame đã đóng. */
  evictForReverse(
    heldIndices: number[],
    keep: Set<number>,
    playheadIndex: number,
    holdFrames = 2,
  ): number {
    const { evict } = selectEvictions(heldIndices, keep, playheadIndex, holdFrames);
    if (evict.length === 0) return 0;
    return this.cache.evictExcept(
      new Set(heldIndices.filter((i) => !evict.includes(i))),
    );
  }
}
