// reverseAudioWiring.ts — Đợt 192 P3: nối ReverseAudioPlayer vào preview
// (S7c, F-191-P4-3). Đợt 193 P3: (a) crossfade đoạn (khởi động lại sớm
// 0,1 s trước khi đoạn cũ hết + nối tiếp đúng mẫu — xem
// shouldRestartReverseSegment "restart-exact"); (b) clip dài > 60 s
// phát đảo theo cửa sổ 30 s (không còn mute — xem PlayerSlot.windowed).
// Đợt 194 P3 (quyết (a2)-193): audio đảo CHẠY XUYÊN HOLD — playhead bị
// giữ chờ frame thì đoạn đảo không bị dừng nữa, drift tối đa 0,3 s
// (REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC — đợt 196 P3 siết từ 0,5 s về
// 0,3 s theo quyết parent (a4)-195: trần 0,5 s chỉ chặn độ TĂNG drift
// trong hold nên drift tuyệt đối đỉnh 0,685 s đợt 195; cap 0,3 s thì
// tuyệt đối ≈ drift-lúc-giữ (~0,17 s) + 0,3 s ≈ 0,47 s < bar 0,5 s);
// counters thêm holdKeep /
// holdCapStop để probe headed đếm số tick giữ-phát vs giữ-dừng.
//
// Đợt 195 P3 — chẩn đoán đo headed: holdMaxSec (giữ playhead dài nhất
// từng thấy — chứng minh trần drift 0,3 s khi hold > 0,3 s),
// windowRebuilds + lastWindowDecodeMs (thời gian decode cửa sổ cho clip
// dài 300–600 s — decode toàn file tạm thời mỗi lần đổi cửa sổ) +
// snapshot windows (biên cửa sổ + rebuilding) để probe headed đọc.
//
// Bối cảnh: preview phát ngược tới nay MUTE toàn bộ audio (syncMedia
// gán gain 0 khi reversePlayback). Logic đảo đã xong đợt 191
// (reverseAudio.ts: decode + đảo kênh + player đoạn). Module này là
// điểm nối: mỗi tick phát ngược, với từng clip audio đang active, nó
// (a) fetch + decode + đảo 1 lần rồi giữ buffer (chỉ clip có source
// <= 60 s — ngưỡng của player; dài hơn thì giữ mute như cũ),
// (b) phát từng đoạn 0,5 s từ offset đảo ứng với source time hiện tại,
// (c) đợt 194 P3 (quyết (a2)-193): playhead bị giữ thì đoạn đảo CHẠY
// XUYÊN HOLD (không dừng như S7c cũ) — drift tối đa 0,3 s rồi dừng
// (đợt 196 P3 siết từ 0,5 s về 0,3 s, quyết parent (a4)-195);
// hết giữ thì re-sync khi playhead bước tiếp,
// (c2) đợt 202 P3 (quyết (a6)-201) — C3-LOOP thay cap-stop: đoạn hết
// hạn GIỮA HOLD thì phát LẠI cùng đoạn 0,5 s ngay trong tick hold
// (không chờ tick không-hold) nên không còn im lặng dài; lặp không
// làm drift tăng nên bỏ cap-stop 0,3 s (counter holdCapStop giữ lại,
// luôn 0 từ đợt này — probe đọc tương thích).
// (c3) đợt 203 P3 (quyết (a6)-202) — F-201-P3-2: sửa gap nối đoạn
// plain-restart 8–32 ms: (i) restart-exact nới lệch cho phép từ 0,05 s
// lên bằng dung sai drift 0,12 s (mọi tick trong cửa sổ overlap đều
// khởi đoạn mới ngay, không còn "keep tới hết rồi restart sau khi
// đoạn đã hết"); (ii) C3-loop trong hold cũng lặp SỚM (còn < overlap
// 0,1 s) thay vì chờ hết hạn — xem tickInner + shouldRestart... .
// (d) dọn player khi clip hết active / đổi URL /
// dừng phát / đổi hướng.
//
// Đồng bộ: buffer đảo phát XUÔI chính là audio phát NGƯỢC. Playhead
// lùi realtime (1×) thì offset đảo tăng cùng tốc độ với đoạn đang
// phát nên đoạn tự đồng bộ — chỉ cần kiểm tra lệch mỗi tick, không
// cần restart liên tục. Tốc độ clip != 1 thì player phát buffer ở
// đúng rate đó (playbackRate) nên vẫn đồng bộ; rate không đặt được
// (fake/context lạ) thì restart theo lệch bù lại.
//
// An toàn: mọi lỗi fetch/decode/phát đều nuốt thành "không phát" —
// preview giữ mute như cũ, không bao giờ throw ra vòng lặp. Không
// chạm AudioEngine (chỉ đọc ctx + master qua getter) và không sửa
// gain của element (element vẫn paused, không tự phát tiếng).
import {
  MAX_REVERSED_AUDIO_SECONDS,
  MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
  REVERSED_AUDIO_WINDOW_SEC,
  ReverseAudioPlayer,
  reversedSampleOffsetFromSourceTime,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import type { PartialDecodeDeps } from "./reverseAudioPartial.ts";

/** Độ dài 1 đoạn đảo phát mỗi lần (giây). */
export const REVERSED_AUDIO_SEGMENT_SEC = 0.5;

/** Lệch cho phép giữa vị trí đoạn đang phát và offset kỳ vọng (giây). */
export const REVERSED_AUDIO_DRIFT_TOLERANCE_SEC = 0.12;

/**
 * Đợt 193 P3 — khởi động lại đoạn SỚM trước khi đoạn cũ hết (giây):
 * đoạn mới bắt đầu khi đoạn cũ còn 0,1 s, chồng lên đoạn cũ trong lúc
 * crossfade 80 ms của player nên không còn khoảng lặng tại điểm nối
 * (đợt 192: đoạn mới chỉ bắt đầu ở tick SAU khi đoạn cũ hết + fade vào
 * từ 0 → 2/16 mẫu RMS=0). Chỉ kích khi lệch nhỏ (xem restart-exact).
 */
export const REVERSED_AUDIO_OVERLAP_SEC = 0.1;

/** Đợt 193 P3 — lệch tối đa để restart nối tiếp dùng đúng mẫu tiếp theo
 * (không re-sync theo playhead): lệch lớn hơn thì playhead đã nhảy, phải
 * re-sync bằng offset kỳ vọng thay vì nối tiếp.
 * Đợt 203 P3 (quyết (a6)-202) — F-201-P3-2: hằng này BẰNG dung sai drift
 * (0,12 s), không còn 0,05 s. Lý do: restart-exact chỉ kích khi lệch ≤
 * 0,05 s nên mọi tick trong cửa sổ overlap 0,1 s trước khi đoạn hết mà
 * lệch 0,05–0,12 s đều trả "keep" — đoạn hết rồi tick sau mới restart
 * (re-sync) → gap nối đoạn 8–32 ms (~1 lần/s, nghe được). Với 0,12 s,
 * mọi tick trong cửa sổ overlap đều khởi đoạn mới NGAY (restart-exact
 * nếu lệch trong dung sai, restart re-sync nếu lệch quá) — không còn
 * "keep tới hết rồi restart sau khi đoạn đã hết". Bất biến: hằng này
 * PHẢI bằng REVERSED_AUDIO_DRIFT_TOLERANCE_SEC (test 203 kiểm tra). */
export const REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC =
  REVERSED_AUDIO_DRIFT_TOLERANCE_SEC;

/** Đợt 193 P3 — đổi cửa sổ đảo khi playhead còn cách mép dưới cửa sổ
 * ngần này (giây): decode cửa sổ mới chạy nền trong lúc cửa sổ cũ vẫn
 * phát được; quá 5 s thì decode file ≤ 600 s vẫn kịp (xem LIMITS §2). */
export const REVERSED_AUDIO_WINDOW_PRELOAD_SEC = 5;

/** Đợt 194 P3 (quyết (a2)-193) — audio đảo chạy xuyên hold: playhead bị
 * giữ chờ frame thì đoạn đảo KHÔNG bị dừng nữa (nghe liền mạch hơn);
 * drift hình-tiếng tối đa = thời gian giữ, chặn ở 0,3 s thì dừng
 * (đợt 196 P3 siết từ 0,5 s về 0,3 s theo quyết parent (a4)-195 — trần
 * 0,5 s đợt 195 cho drift tuyệt đối đỉnh 0,685 s vì drift-lúc-giữ
 * ~0,17 s cộng thêm; cap 0,3 s thì tuyệt đối ≈ 0,47 s < bar 0,5 s).
 * Đoạn phát vẫn dài 0,5 s (REVERSED_AUDIO_SEGMENT_SEC không đổi) —
 * chỉ trần dừng-sớm khi giữ mới siết. Render KHÔNG đổi (mapping
 * chính xác giữ nguyên).
 * Đợt 202 P3 (quyết (a6)-201) — C3-LOOP THAY cap-stop (xem tickInner):
 * đoạn hết hạn giữa hold thì LẶP lại cùng đoạn thay vì dừng; lặp
 * không làm drift tăng nên trần 0,3 s không còn lý do tồn tại. Hằng
 * này giữ lại (legacy, = 0,3) để test/probe cũ còn đọc được; code
 * không dùng nữa. */
export const REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC = 0.3;

/** 1 clip audio đang active trong lúc phát ngược (từ syncMedia). */
export interface ReverseAudioWiringEntry {
  /** Key instance của clip (để giữ player theo clip, không theo element). */
  clipKey: string;
  /** URL fetch được audio (el.currentSrc || el.src). */
  url: string;
  /** Thời lượng file nguồn, giây (el.duration — cổng 60 s trước fetch). */
  sourceDurationSec: number;
  /** Source time tại playhead, giây (a.target — đã qua sourceTimeAt). */
  sourceTimeSec: number;
  /** Gain clip (volume × fades × keyframes × trackVolume; wiring clamp 0..1). */
  gain: number;
  /** Tốc độ clip tại tick này (a.speed — ramp/speed, mặc định 1). */
  speed: number;
}

/** Quyết định giữ hay phát lại đoạn đảo đang chạy. */
export type ReverseAudioSegmentDecision = "keep" | "restart" | "restart-exact";

/**
 * Đoạn đang phát còn đúng vị trí không?
 * - Chưa có đoạn / đoạn đã phát hết (vị trí vượt cuối đoạn) → restart
 *   (re-sync bằng offset kỳ vọng).
 * - Vị trí hiện tại lệch khỏi offset kỳ vọng quá ngưỡng → restart
 *   (playhead nhảy / hold rồi resume / tốc độ đổi mà rate không theo).
 * - Đoạn sắp hết (còn < overlapSec, mặc định 0,1 s) mà lệch trong dung
 *   sai drift (≤ exactToleranceSec — đợt 203 P3: BẰNG dung sai drift
 *   0,12 s, xem REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC) →
 *   "restart-exact": đoạn mới bắt đầu đúng mẫu tiếp theo (segStart +
 *   segLength) để nối tiếp không hở/không lặp, chồng crossfade lên
 *   đuôi đoạn cũ (đợt 193 P3 — xem REVERSED_AUDIO_OVERLAP_SEC).
 *   Đợt 203 P3 (F-201-P3-2): với exactTolerance = drift tolerance,
 *   mọi tick trong cửa sổ overlap đều khởi đoạn mới ngay — không còn
 *   trường hợp "keep rồi đoạn hết, tick sau mới restart" gây gap
 *   nối đoạn 8–32 ms (lệch 0,05–0,12 s là nguyên nhân — xem LIMITS
 *   đợt 203 §1). Lệch quá dung sai thì "restart" re-sync ngay tại
 *   tick đó (cũng không gap nếu đoạn cũ chưa hết).
 * - Còn lại → keep (đoạn tự đồng bộ khi playhead lùi đều).
 * Vị trí hiện tại = segStartSample + (nowCtxSec − segStartCtxSec) ×
 * sampleRate × rate (rate = tốc độ phát của đoạn đó).
 */
export function shouldRestartReverseSegment(args: {
  nowCtxSec: number;
  segStartCtxSec: number;
  segStartSample: number;
  segLengthSamples: number;
  sampleRate: number;
  rate: number;
  expectedOffset: number;
  toleranceSec?: number;
  overlapSec?: number;
  exactToleranceSec?: number;
}): ReverseAudioSegmentDecision {
  const {
    nowCtxSec,
    segStartCtxSec,
    segStartSample,
    segLengthSamples,
    sampleRate,
    rate,
    expectedOffset,
  } = args;
  const toleranceSec = args.toleranceSec ?? REVERSED_AUDIO_DRIFT_TOLERANCE_SEC;
  const overlapSec = args.overlapSec ?? REVERSED_AUDIO_OVERLAP_SEC;
  const exactToleranceSec =
    args.exactToleranceSec ?? REVERSED_AUDIO_EXACT_CONTINUATION_TOLERANCE_SEC;
  if (!(sampleRate > 0) || !(segLengthSamples > 0)) return "restart";
  const elapsed = Math.max(0, nowCtxSec - segStartCtxSec);
  const r = Number.isFinite(rate) && rate > 0 ? rate : 1;
  const pos = segStartSample + elapsed * sampleRate * r;
  if (pos >= segStartSample + segLengthSamples) return "restart";
  if (Math.abs(pos - expectedOffset) > toleranceSec * sampleRate) return "restart";
  // Đợt 193 P3 — sắp hết đoạn + lệch nhỏ → nối tiếp đúng mẫu.
  if (
    overlapSec > 0 &&
    pos >= segStartSample + segLengthSamples - overlapSec * sampleRate * r &&
    Math.abs(pos - expectedOffset) <= exactToleranceSec * sampleRate
  ) {
    return "restart-exact";
  }
  return "keep";
}

interface PlayerSlot {
  player: ReverseAudioPlayer;
  url: string;
  loading: boolean;
  /** Đợt 195 P3 — thời gian decode cửa sổ gần nhất của slot này (ms). */
  lastDecodeMs: number;
  /** Đợt 193 P3 — clip dài (> 60 s): player giữ cửa sổ đảo 30 s thay
   * vì toàn bộ file; compressed = bytes nén gốc để decode lại khi đổi
   * cửa sổ; rebuilding = đang decode cửa sổ mới nền (cửa sổ cũ vẫn
   * phát được); rebuildCooldownUntilCtxSec chặn thử lại dồn dập khi
   * decode cửa sổ hỏng. */
  windowed: boolean;
  compressed: ArrayBuffer | null;
  rebuilding: boolean;
  rebuildCooldownUntilCtxSec: number;
  /** Đợt 198 P3 — fix F-197-P3-1: ctx.currentTime lúc cửa sổ mới đổi
   * xong (null = không có đổi cửa sổ gần đây); tick đầu sau đó được
   * clamp offset về mép cửa sổ mới (trong 1 s) thay vì playFalse. */
  windowJustRebuiltAtCtxSec: number | null;
  segActive: boolean;
  segStartCtxSec: number;
  segStartSample: number;
  segLengthSamples: number;
  segRate: number;
  /** Đợt 202 P3 (C3-loop) — gain lần phát đoạn gần nhất: tick hold
   * lặp đoạn dùng lại gain này (nhánh hold không có entry/gain mới). */
  lastGain: number;
}

/** Fetch mặc định: GET rồi đọc body (lỗi HTTP → throw, wiring nuốt). */
async function defaultFetchAudio(url: string): Promise<ArrayBuffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`fetch audio ${resp.status}`);
  return resp.arrayBuffer();
}

/**
 * Manager nối audio đảo vào preview. 1 instance / 1 preview (module-
 * level ở preview.tsx). Không tự chạy vòng lặp — preview gọi tick()
 * mỗi tick phát ngược và stopAll() khi pause/đổi hướng.
 */
export class ReverseAudioWiring {
  private readonly ctx: ReversedAudioContextLike;
  private readonly destination: unknown;
  private readonly fetchImpl: (url: string) => Promise<ArrayBuffer>;
  private readonly partialDeps?: PartialDecodeDeps;
  private readonly players = new Map<string, PlayerSlot>();
  private lastPlayheadSec: number | null = null;
  /** Đợt 199 P3 — lý do partial fail gần nhất (từ player, xem
   * countWindowDecode): probe headed đọc qua debugSnapshot. */
  private lastPartialFailReasonValue: string | null = null;
  /**
   * Đợt 194 P3 (a2) — ctx.currentTime lúc playhead BẮT ĐẦU bị giữ (null =
   * không giữ): drift hình-tiếng khi chạy xuyên hold = currentTime −
   * holdStartCtxSec, chặn ở REVERSED_AUDIO_HOLD_DRIFT_MAX_SEC.
   */
  private holdStartCtxSec: number | null = null;
  /**
   * Đợt 193 P3 — bộ đếm chẩn đoán (không đổi hành vi): đếm từng đường
   * khiến segActive tắt/mở để probe headed xác định vì sao badge
   * "không audio" nhấp nháy giữa pass dù tiếng vẫn liền (xem LIMITS
   * §2). Đọc qua window.__vcutReverseAudio.counters.
   */
  private readonly counters = {
    tick: 0,
    holdStop: 0,
    /** Đợt 194 P3 (a2): tick hold mà đoạn đảo được giữ phát xuyên hold. */
    holdKeep: 0,
    /** Đợt 194 P3 (a2): tick hold mà drift chạm trần 0,3 s nên phải dừng đoạn
     * (đợt 196 P3 siết từ 0,5 s về 0,3 s, quyết parent (a4)-195).
     * Đợt 202 P3 (quyết (a6)-201): C3-LOOP THAY cap-stop — lặp đoạn
     * không tăng drift nên không còn cap-stop; counter giữ lại để
     * probe đọc tương thích, luôn 0 từ đợt này. */
    holdCapStop: 0,
    /** Đợt 202 P3 (quyết (a6)-201) — C3-LOOP: số lần đoạn hết hạn
     * GIỮA HOLD được phát LẠI cùng đoạn ngay trong tick hold (thay
     * cho im lặng tới tick không-hold đầu tiên). */
    holdLoopRestart: 0,
    /** Đợt 195 P3: thời gian giữ playhead dài nhất từng thấy (giây) —
     * chứng minh headed trần drift khi hold > 0,3 s (nợ §5.1 đợt 194;
     * đợt 196 P3 siết trần từ 0,5 s về 0,3 s, quyết parent (a4)-195). */
    holdMaxSec: 0,
    /** Đợt 195 P3: số lần đổi cửa sổ đảo hoàn tất (clip dài > 60 s). */
    windowRebuilds: 0,
    /** Đợt 195 P3: thời gian decode cửa sổ gần nhất (ms) — đợt 197 P3:
     * lần đầu decode toàn file, các lần sau lấy từ cache decode-once
     * (xem reverseAudio.ts) nên chỉ còn trích + đảo cửa sổ. */
    lastWindowDecodeMs: 0,
    /** Đợt 197 P3: số lần đổi/cửa sổ đầu lấy từ cache decode-once
     * (không decode lại) vs phải decode toàn file. */
    windowDecodeCached: 0,
    windowDecodeFull: 0,
    /** Đợt 198 P3: số lần đổi/cửa sổ đầu decode TỪNG PHẦN (WebCodecs
     * AudioDecoder, chỉ các frame AAC phủ cửa sổ) — không decode toàn
     * file, không giữ cache decode toàn file. */
    windowDecodePartial: 0,
    /** Đợt 199 P3: số lần load cửa sổ rơi về decode toàn file VÌ partial
     * hỏng (decode fail / slice null — xem partialFailReason); khác
     * windowDecodeFull ở chỗ lần nào cũng có lý do ghi lại. */
    partialFail: 0,
    /** Đợt 198 P3 — fix F-197-P3-1: số tick playSegment được cứu bằng
     * clamp offset về mép cửa sổ mới (thay vì đếm playFalse). */
    playClamped: 0,
    gainStop: 0,
    negExpected: 0,
    playFalse: 0,
    playOk: 0,
    keep: 0,
    restart: 0,
    restartExact: 0,
    stopAll: 0,
  };

  constructor(
    ctx: ReversedAudioContextLike,
    destination: unknown,
    fetchImpl: (url: string) => Promise<ArrayBuffer> = defaultFetchAudio,
    // Đợt 199 P3 — deps cho decode từng phần (chỉ test dùng fake
    // AudioDecoder; app để undefined → dùng AudioDecoder thật của
    // trình duyệt). Truyền xuống loadReversedWindow ở loadSlot + rebuild.
    partialDeps?: PartialDecodeDeps,
  ) {
    this.ctx = ctx;
    this.destination = destination;
    this.fetchImpl = fetchImpl;
    this.partialDeps = partialDeps;
  }

  /** Đợt 197 P3 (mở rộng 198 P3) — đếm 1 lần load cửa sổ theo đường
   * đã dùng: partial (decode từng phần) / cache / decode toàn file. */
  private countWindowDecode(slot: PlayerSlot): void {
    if (slot.player.lastWindowDecodePartial) this.counters.windowDecodePartial++;
    else if (slot.player.lastWindowDecodeCached) this.counters.windowDecodeCached++;
    else {
      this.counters.windowDecodeFull++;
      // Đợt 199 P3 — lần load này rơi về full decode VÌ partial hỏng:
      // đếm riêng + giữ lại lý do để probe headed đọc.
      if (slot.player.lastPartialFailReason) {
        this.counters.partialFail++;
        this.lastPartialFailReasonValue = slot.player.lastPartialFailReason;
      }
    }
  }

  /** Số clip đã load xong buffer đảo (để badge/debug đọc). */
  get loadedCount(): number {
    let n = 0;
    for (const s of this.players.values()) if (!s.loading && s.player.loaded) n++;
    return n;
  }

  /** Có đoạn đảo nào đang phát không (để badge "audio đảo" đọc). */
  get isPlaying(): boolean {
    for (const s of this.players.values()) if (s.segActive) return true;
    return false;
  }

  /** Clip key của các player đang giữ (để debug hook đọc). */
  get clipKeys(): string[] {
    return [...this.players.keys()];
  }

  /** Snapshot nhỏ cho window.__vcutReverseAudio (harness đo S7c). */
  debugSnapshot(): {
    loaded: number;
    playing: boolean;
    clips: string[];
    /** Đợt 193 P3 — clip đang phát đảo theo cửa sổ (clip dài > 60 s). */
    longClips: string[];
    lastPlayheadSec: number | null;
    /** Đợt 195 P3 — biên cửa sổ đảo từng clip dài (để probe headed đo
     * hành vi tại mép cửa sổ: đổi cửa sổ nền có kịp không). */
    windows: Array<{
      clip: string;
      windowStartSec: number;
      windowEndSec: number;
      rebuilding: boolean;
      lastDecodeMs: number;
    }>;
    /** Đợt 193 P3 — bộ đếm chẩn đoán (xem counters). */
    counters: { [k: string]: number };
    /** Đợt 199 P3 — lý do partial fail gần nhất (null = chưa từng fail
     * partial ở lần load nào, hoặc lần load gần nhất partial thành
     * công / lấy từ cache). */
    partialFailReason: string | null;
  } {
    const longClips: string[] = [];
    const windows: Array<{
      clip: string;
      windowStartSec: number;
      windowEndSec: number;
      rebuilding: boolean;
      lastDecodeMs: number;
    }> = [];
    for (const [key, s] of this.players) {
      if (s.windowed && !s.loading && s.player.loaded) longClips.push(key);
      if (s.windowed) {
        windows.push({
          clip: key,
          windowStartSec: s.player.windowStartSec,
          windowEndSec: s.player.windowEndSec,
          rebuilding: s.rebuilding,
          lastDecodeMs: s.lastDecodeMs,
        });
      }
    }
    return {
      loaded: this.loadedCount,
      playing: this.isPlaying,
      clips: this.clipKeys,
      longClips,
      windows,
      lastPlayheadSec: this.lastPlayheadSec,
      counters: { ...this.counters },
      partialFailReason: this.lastPartialFailReasonValue,
    };
  }

  /**
   * Gọi mỗi tick khi đang phát ngược (chỉ khi playing && có clip
   * reverse — global hoặc clip.reverse). entries = clip audio active
   * (kèm gain gốc TRƯỚC khi syncMedia gán gain 0 cho reverse).
   * Không throw — mọi lỗi đường này chỉ làm clip đó im lặng.
   */
  tick(playheadSec: number, entries: ReverseAudioWiringEntry[]): void {
    try {
      this.tickInner(playheadSec, entries);
    } catch {
      /* wiring không được phá vòng lặp preview */
    }
  }

  private tickInner(playheadSec: number, entries: ReverseAudioWiringEntry[]): void {
    this.counters.tick++;
    // Playhead đứng yên (đang giữ chờ frame ngược) — đợt 194 P3 (a2):
    // KHÔNG dừng đoạn đang phát nữa (quyết parent (a2)-193: audio đảo
    // chạy xuyên hold). Đợt 202 P3 (quyết (a6)-201) — C3-LOOP: đoạn
    // 0,5 s hết hạn GIỮA HOLD thì LẶP lại cùng đoạn ngay trong tick
    // hold (xem dưới) thay vì chờ tick không-hold (gây im lặng dài
    // 655–690 ms đợt 201 — H1) hay cap-stop ở 0,3 s (hành vi cũ đã
    // bỏ). Hết giữ thì playhead bước tiếp, tickEntry re-sync bằng
    // restart (lệch = thời gian giữ > dung sai 0,12 s) hoặc
    // restart-exact.
    if (this.lastPlayheadSec !== null && playheadSec === this.lastPlayheadSec) {
      this.counters.holdStop++;
      if (this.holdStartCtxSec === null) {
        this.holdStartCtxSec = this.ctx.currentTime;
      }
      const heldSec = this.ctx.currentTime - this.holdStartCtxSec;
      // Đợt 195 P3 — giữ dài nhất từng thấy (kể cả lúc chưa có đoạn
      // active: hold là của playhead, không phải của audio).
      if (heldSec > this.counters.holdMaxSec) {
        this.counters.holdMaxSec = heldSec;
      }
      // Đợt 202 P3 (quyết (a6)-201) — C3-LOOP: đoạn hết hạn GIỮA HOLD
      // thì phát LẠI cùng đoạn ngay trong tick hold (không chờ tick
      // không-hold) — đây chính là cơ chế gây im lặng dài 655–690 ms
      // đợt 201 (H1: đoạn hết giữa hold + nhánh hold return sớm, không
      // restart). Lặp cùng đoạn (segStartSample giữ nguyên): tiếng
      // lặp 0,5 s trong hold dài (nghe như vấp/lặp — liên tục, không
      // đứt quãng), drift không tăng nên BỎ cap-stop 0,3 s (xem dưới).
      // Đợt 203 P3 (quyết (a6)-202) — F-201-P3-2: lặp SỚM khi đoạn sắp
      // hết (còn < overlap 0,1 s) thay vì chờ hết hạn rồi mới lặp ở
      // tick sau — chờ hết hạn thì gap nối đoạn = độ trễ tick sau khi
      // đoạn hết (8–32 ms đo thật, nghe được). Bắt đầu sớm như
      // restart-exact: đoạn lặp chồng crossfade lên đuôi đoạn cũ nên
      // không còn khoảng lặng tại điểm nối; lặp cùng đoạn nên drift
      // không tăng, chu kỳ lặp ngắn lại tối đa 0,1 s (0,4–0,5 s thay
      // vì đúng 0,5 s — chỉ là nhịp lặp, playhead đang giữ nên không
      // lệch đồng bộ; hết giữ thì re-sync như cũ).
      for (const slot of this.players.values()) {
        if (!slot.segActive) continue;
        const sr = slot.player.bufferSampleRate || this.ctx.sampleRate;
        if (!(sr > 0) || !(slot.segLengthSamples > 0)) continue;
        const segEnd =
          slot.segStartCtxSec +
          slot.segLengthSamples / (sr * (slot.segRate || 1));
        if (this.ctx.currentTime < segEnd - REVERSED_AUDIO_OVERLAP_SEC) continue;
        const ok = slot.player.playSegment(
          slot.segStartSample,
          REVERSED_AUDIO_SEGMENT_SEC,
          slot.lastGain,
          slot.segRate,
        );
        if (ok) {
          this.counters.playOk++;
          this.counters.holdLoopRestart++;
          slot.segActive = true;
          slot.segStartCtxSec = this.ctx.currentTime;
          // segStartSample GIỮ NGUYÊN (lặp cùng đoạn) — chỉ cập nhật
          // độ dài đoạn thực phát (đã clamp ở cuối buffer/cửa sổ).
          const scheduled = slot.player.lastSegmentLengthSamples;
          slot.segLengthSamples =
            scheduled > 0
              ? scheduled
              : Math.min(
                  Math.floor(REVERSED_AUDIO_SEGMENT_SEC * sr),
                  Math.max(
                    0,
                    Math.floor(slot.player.durationSec * sr) - slot.segStartSample,
                  ),
                );
        } else {
          this.counters.playFalse++;
          slot.segActive = false;
        }
      }
      let anyActive = false;
      for (const slot of this.players.values()) {
        if (slot.segActive) {
          anyActive = true;
          break;
        }
      }
      if (anyActive) {
        // C3-LOOP (quyết (a6)-201): KHÔNG cap-stop nữa — đoạn lặp
        // không làm drift tăng nên trần 0,3 s không còn lý do tồn tại
        // (counter holdCapStop giữ lại, luôn 0 từ đợt này). Giữ dài
        // bao lâu cũng lặp tiếp, không im lặng.
        this.counters.holdKeep++;
        return;
      }
      return;
    }
    this.holdStartCtxSec = null;
    this.lastPlayheadSec = playheadSec;
    // Dọn player của clip không còn active.
    const live = new Set(entries.map((e) => e.clipKey));
    for (const [key, slot] of [...this.players]) {
      if (!live.has(key)) {
        slot.player.dispose();
        this.players.delete(key);
      }
    }
    for (const entry of entries) {
      this.tickEntry(entry);
    }
  }

  private tickEntry(entry: ReverseAudioWiringEntry): void {
    // Clip bị mute (track muted / sourceAudioMode mute / gain 0) →
    // không phát, dừng đoạn cũ nếu có (không xóa buffer đã load).
    if (!(entry.gain > 0)) {
      const slot = this.players.get(entry.clipKey);
      if (slot && slot.segActive) {
        this.counters.gainStop++;
        slot.player.stop();
        slot.segActive = false;
      }
      return;
    }
    let slot = this.players.get(entry.clipKey);
    if (!slot) {
      // Cổng TRƯỚC fetch (đợt 192: ≤ 60 s load toàn bộ; đợt 193: dài
      // hơn thì phát theo cửa sổ tới 600 s, quá thì vẫn mute — tránh
      // decode file rất dài). Duration chưa biết (NaN/Infinity) thì bỏ
      // qua lượt này, tick sau thử lại (element đang phát thì metadata
      // đã có nên trường hợp này hiếm).
      if (
        !Number.isFinite(entry.sourceDurationSec) ||
        !(entry.sourceDurationSec > 0) ||
        entry.sourceDurationSec > MAX_REVERSED_AUDIO_WINDOWED_SECONDS
      ) {
        return;
      }
      if (!entry.url) return;
      const windowed = entry.sourceDurationSec > MAX_REVERSED_AUDIO_SECONDS;
      slot = {
        player: new ReverseAudioPlayer(this.ctx, this.destination),
        url: entry.url,
        loading: true,
        windowed,
        compressed: null,
        rebuilding: false,
        rebuildCooldownUntilCtxSec: 0,
        windowJustRebuiltAtCtxSec: null,
        lastDecodeMs: 0,
        segActive: false,
        segStartCtxSec: 0,
        segStartSample: 0,
        segLengthSamples: 0,
        segRate: 1,
        lastGain: 1,
      };
      this.players.set(entry.clipKey, slot);
      // Clip dài: cửa sổ đầu kết thúc ở source time hiện tại (phủ 30 s
      // ngược sắp phát); clip ngắn: load toàn bộ như cũ.
      void this.loadSlot(
        entry.clipKey,
        slot,
        entry.url,
        windowed ? entry.sourceTimeSec - REVERSED_AUDIO_WINDOW_SEC : null,
      );
      return;
    }
    // URL đổi (user đổi media của clip) → bỏ player cũ, load lại lượt sau.
    if (slot.url !== entry.url) {
      slot.player.dispose();
      this.players.delete(entry.clipKey);
      return;
    }
    if (slot.loading || !slot.player.loaded) return;
    // Đợt 199 P3 — offset mẫu PHẢI tính theo rate của BUFFER đảo đang
    // giữ (player.bufferSampleRate), KHÔNG phải rate của AudioContext:
    // đường partial decode ở rate gốc của file (48.000 Hz) trong khi
    // ctx headless là 44.100 Hz — dùng rate ctx thì offset lệch hệ số
    // 48000/44100 và drift vọt lên median 1,285 s (đo thật pass A-199).
    // Đường full decode resample về rate ctx nên hai rate trùng nhau,
    // không đổi hành vi cũ.
    const sampleRate = slot.player.bufferSampleRate || this.ctx.sampleRate;
    if (!(sampleRate > 0)) return;
    // Đợt 193 P3 — clip dài: playhead (source time giảm dần khi phát
    // ngược) tới gần mép dưới cửa sổ thì decode cửa sổ mới NỀN — cửa
    // sổ cũ vẫn phát được trong lúc decode, đổi xong thì playSegment
    // sau dùng cửa sổ mới (offset tuyệt đối không đổi nên đoạn đang
    // phát không bị lệch). Decode hỏng thì giữ cửa sổ cũ, thử lại sau
    // 2 s (cooldown) thay vì thử mỗi tick.
    if (slot.windowed && !slot.rebuilding && slot.compressed) {
      const wStart = slot.player.windowStartSec;
      if (
        Number.isFinite(wStart) &&
        entry.sourceTimeSec < wStart + REVERSED_AUDIO_WINDOW_PRELOAD_SEC &&
        this.ctx.currentTime >= slot.rebuildCooldownUntilCtxSec
      ) {
        slot.rebuilding = true;
        slot.rebuildCooldownUntilCtxSec = this.ctx.currentTime + 2;
        const buf = slot.compressed;
        const w0 = entry.sourceTimeSec - REVERSED_AUDIO_WINDOW_SEC;
        // Đợt 195 P3 — đo thời gian decode cửa sổ (decode toàn file tạm
        // thời): ghi lastDecodeMs của slot + counters để probe đọc.
        const rebuildT0 = Date.now();
        void slot.player
          .loadReversedWindow(
            buf,
            w0,
            REVERSED_AUDIO_WINDOW_SEC,
            MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
            this.partialDeps,
          )
          .then((okRebuild) => {
            slot.rebuilding = false;
            const ms = Date.now() - rebuildT0;
            slot.lastDecodeMs = ms;
            this.counters.lastWindowDecodeMs = ms;
            // Đợt 197 P3 — đếm cache-hit (trích + đảo) vs decode toàn file.
            // Đợt 198 P3 — thêm đường partial (decode từng phần).
            this.countWindowDecode(slot);
            if (okRebuild) {
              this.counters.windowRebuilds++;
              // Đợt 198 P3 — fix F-197-P3-1: đánh dấu cửa sổ vừa đổi để
              // tick sau clamp offset về mép (xem tickEntry).
              slot.windowJustRebuiltAtCtxSec = this.ctx.currentTime;
            }
          })
          .catch(() => {
            slot.rebuilding = false;
            const ms = Date.now() - rebuildT0;
            slot.lastDecodeMs = ms;
            this.counters.lastWindowDecodeMs = ms;
            this.counters.windowDecodeFull++;
          });
      }
    }
    const expected = reversedSampleOffsetFromSourceTime({
      sourceTimeSec: entry.sourceTimeSec,
      sourceDurationSec: slot.player.durationSec,
      sampleRate,
    });
    // Playhead ngoài phạm vi audio của clip → dừng đoạn (không phát
    // tiếng của đoạn khác).
    if (expected < 0) {
      if (slot.segActive) {
        this.counters.negExpected++;
        slot.player.stop();
        slot.segActive = false;
      }
      return;
    }
    const rate = Number.isFinite(entry.speed) && entry.speed > 0 ? entry.speed : 1;
    // Đợt 193 P3 — restart-exact: đoạn sắp hết + lệch nhỏ → bắt đầu
    // đúng mẫu tiếp theo (nối tiếp, không re-sync), chồng crossfade
    // lên đuôi đoạn cũ; restart thường → re-sync bằng offset kỳ vọng.
    let startSample = expected;
    if (slot.segActive) {
      const decision = shouldRestartReverseSegment({
        nowCtxSec: this.ctx.currentTime,
        segStartCtxSec: slot.segStartCtxSec,
        segStartSample: slot.segStartSample,
        segLengthSamples: slot.segLengthSamples,
        sampleRate,
        rate: slot.segRate,
        expectedOffset: expected,
      });
      if (decision === "keep") {
        this.counters.keep++;
        return;
      }
      if (decision === "restart-exact") {
        this.counters.restartExact++;
        startSample = slot.segStartSample + slot.segLengthSamples;
      } else {
        this.counters.restart++;
      }
    }
    const gain = Math.min(1, Math.max(0, entry.gain));
    // Đợt 198 P3 — fix F-197-P3-1: tick đầu sau khi cửa sổ đổi (trong
    // 1 s), source time ramp chạy trước display ~0,1–0,3 s nên offset
    // kỳ vọng (hoặc điểm nối tiếp restart-exact) có thể vừa vượt mép
    // cửa sổ mới → clamp về mép thay vì playSegment trả false (đếm
    // playFalse). Hết 1 s thì cờ tự hết hiệu lực (playhead nhảy thật
    // sẽ re-sync bằng restart thường ở tick sau).
    if (slot.windowJustRebuiltAtCtxSec !== null) {
      const fresh =
        this.ctx.currentTime - slot.windowJustRebuiltAtCtxSec <= 3;
      let clampedNeeded = false;
      if (fresh) {
        const clamped = slot.player.clampSampleOffsetToWindow(startSample);
        if (clamped !== startSample) {
          // Đợt 199 P3 — chỉ clamp khi offset ngoài cửa sổ ≤ 1 s (gần
          // mép): xa hơn là playhead nhảy/seek thật → để false, chờ
          // rebuild, không phát nhầm tiếng cửa sổ cũ. Tươi 3 s (was
          // 1 s): sau load cửa sổ đầu playhead thường bị GIỮ chờ frame
          // 1–2,4 s (holdMaxSec) nên tick đầu sau giữ đã quá 1 s và cờ
          // hết tươi trước khi kịp clamp (đo thật pass A-199: 9
          // playFalse, playClamped 0 dù cờ đã set ở load).
          const lo = slot.player.windowBaseSampleAbs;
          const hi = lo + slot.player.windowLengthSamples - 1;
          const outsideBy =
            startSample < lo ? lo - startSample : startSample - hi;
          if (outsideBy <= sampleRate) {
            this.counters.playClamped++;
            startSample = clamped;
            clampedNeeded = true;
          }
        }
      }
      // Đợt 199 P3 — cờ KHÔNG xóa khi vừa phải clamp: playhead còn nằm
      // ngoài cửa sổ thật (vd 300,6→300,16 s sau load cửa sổ đầu) thì
      // tick sau vẫn cần clamp tiếp; xóa cờ chỉ khi tick này KHÔNG cần
      // clamp nữa (playhead đã vào cửa sổ) hoặc khi cờ hết tươi.
      // Code cũ xóa cờ ngay tick đầu nên 9 tick sau vẫn playFalse
      // (đo thật pass A-199).
      if (!clampedNeeded) slot.windowJustRebuiltAtCtxSec = null;
    }
    const ok = slot.player.playSegment(
      startSample,
      REVERSED_AUDIO_SEGMENT_SEC,
      gain,
      rate,
    );
    if (ok) {
      this.counters.playOk++;
      slot.segActive = true;
      // Đợt 202 P3 (C3-loop) — ghi gain lần phát này để tick hold lặp
      // đoạn dùng lại khi đoạn hết hạn giữa hold.
      slot.lastGain = gain;
      slot.segStartCtxSec = this.ctx.currentTime;
      slot.segStartSample = startSample;
      // Độ dài đoạn thực phát: lấy số player đã lên lịch (đã clamp ở
      // cuối buffer/cửa sổ) để shouldRestart biết đoạn hết lúc nào —
      // tính tay bằng duration toàn file sẽ sai khi đoạn chạm mép cửa sổ.
      const scheduled = slot.player.lastSegmentLengthSamples;
      slot.segLengthSamples =
        scheduled > 0
          ? scheduled
          : Math.min(
              Math.floor(REVERSED_AUDIO_SEGMENT_SEC * sampleRate),
              Math.max(0, Math.floor(slot.player.durationSec * sampleRate) - startSample),
            );
      slot.segRate = rate;
    } else {
      this.counters.playFalse++;
      slot.segActive = false;
    }
  }

  /** Dừng mọi đoạn đang phát, GIỮ buffer (playhead hold). */
  stopSegments(): void {
    for (const slot of this.players.values()) {
      if (!slot.segActive) continue;
      try {
        slot.player.stop();
      } catch {
        /* bỏ qua */
      }
      slot.segActive = false;
    }
  }

  /** Dừng + nhả toàn bộ (pause / đổi hướng / unmount). */
  stopAll(): void {
    this.counters.stopAll++;
    this.holdStartCtxSec = null;
    for (const slot of this.players.values()) {
      try {
        slot.player.dispose();
      } catch {
        /* bỏ qua */
      }
    }
    this.players.clear();
    this.lastPlayheadSec = null;
  }

  private async loadSlot(
    key: string,
    slot: PlayerSlot,
    url: string,
    windowStartSec: number | null = null,
  ): Promise<void> {
    let ok = false;
    try {
      const buf = await this.fetchImpl(url);
      // Slot đã bị prune/đổi URL trong lúc fetch bay → bỏ buffer.
      if (this.players.get(key) !== slot) {
        slot.player.dispose();
        return;
      }
      if (windowStartSec !== null) {
        // Clip dài: giữ bytes nén gốc để decode lại khi đổi cửa sổ;
        // player slice trước khi decode nên buf còn nguyên.
        slot.compressed = buf;
        // Đợt 195 P3 — đo thời gian decode cửa sổ đầu (decode toàn file
        // tạm thời): ghi lastDecodeMs để probe headed đọc.
        const windowT0 = Date.now();
        ok = await slot.player.loadReversedWindow(
          buf,
          windowStartSec,
          REVERSED_AUDIO_WINDOW_SEC,
          MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
          this.partialDeps,
        );
        const windowMs = Date.now() - windowT0;
        slot.lastDecodeMs = windowMs;
        this.counters.lastWindowDecodeMs = windowMs;
        // Đợt 197 P3 — cửa sổ đầu: đếm cache-hit vs decode toàn file.
        // Đợt 198 P3 — thêm đường partial (decode từng phần).
        this.countWindowDecode(slot);
        // Đợt 199 P3 — cửa sổ ĐẦU cũng là một lần "đổi cửa sổ" đối với
        // clamp F-197-P3-1: playhead lúc bấm ngược (300,6 s) nằm NGOÀI
        // cửa sổ thật ([270.6, 300.16] — audio thật hết ở 300,16 s,
        // stts khai 300,64 s) nên tick đầu sau load mà không clamp sẽ
        // playSegment false ~12 lần cho tới khi playhead vào cửa sổ
        // (đo thật pass A-199). Đánh dấu để tick sau clamp offset về
        // mép cửa sổ như sau rebuild.
        if (ok) slot.windowJustRebuiltAtCtxSec = this.ctx.currentTime;
      } else {
        ok = await slot.player.loadReversed(buf);
      }
    } catch {
      ok = false;
    }
    // Load hỏng (decode lỗi / quá giới hạn / fetch hỏng) → xóa slot
    // để tick sau thử lại từ đầu (không giữ player chết).
    if (this.players.get(key) !== slot) return;
    slot.loading = false;
    if (!ok) {
      try {
        slot.player.dispose();
      } catch {
        /* bỏ qua */
      }
      this.players.delete(key);
    }
  }
}
