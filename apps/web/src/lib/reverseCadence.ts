// reverseCadence.ts — Đợt 191 P3: đo cadence frame hiển thị khi phát ngược.
//
// Bối cảnh đo được (baseline headed đợt 191, fixture sparse-gop-ramp191:
// 300 frame, 1 keyframe, 720p + nhiễu, load máy ~2-7): phát ngược 12,8 s
// chỉ vẽ MỚI 1 frame (0,08 fps), hold 163 tick, tuổi giữ tối đa 7,13 s —
// playhead chạy realtime 9,6 → 0 trong khi hình đóng băng rồi nhảy.
// Module này chỉ GHI SỐ (không đổi hành vi vẽ): preview ghi mỗi frame
// MỚI được vẽ khi stepping, harness đọc snapshot() để tính khoảng cách
// giữa các frame hiển thị (median/p90/max, số lần stall) trước/sau sửa.
//
// Thuần (không DOM/React): chạy được bằng Node type-stripping.

/** Thống kê khoảng cách giữa các frame MỚI liên tiếp được hiển thị. */
export interface ReverseCadenceStats {
  /** Số lần ghi frame mới (đã khử trùng: vẽ lại cùng frame không đếm). */
  presentedFrames: number;
  /** Số frame khác nhau đã hiện (bằng presentedFrames khi không lặp). */
  distinctFrames: number;
  /** ms từ lúc start() tới frame mới đầu tiên (null khi chưa start). */
  firstFrameLatencyMs: number | null;
  /** ms từ frame đầu tới frame cuối (0 khi < 2 frame). */
  wallSec: number;
  /** Frame khác nhau / giây wall (0 khi wall = 0). */
  presentedFps: number;
  /** Khoảng giữa 2 frame mới liên tiếp: median / p90 / max (ms). */
  intervalMedianMs: number | null;
  intervalP90Ms: number | null;
  intervalMaxMs: number | null;
  /** Số khoảng > 100 ms (giật thấy rõ) và > 250 ms (đóng băng). */
  stallsOver100Ms: number;
  stallsOver250Ms: number;
}

/** Tóm tắt 1 mảng khoảng (ms): median/p90/max/mean. Rỗng → toàn null. */
export function summarizeIntervals(values: readonly number[]): {
  median: number | null;
  p90: number | null;
  max: number | null;
  mean: number | null;
} {
  if (values.length === 0) {
    return { median: null, p90: null, max: null, mean: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p: number): number =>
    sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  return {
    median: at(0.5),
    p90: at(0.9),
    max: sorted[sorted.length - 1],
    mean: values.reduce((s, v) => s + v, 0) / values.length,
  };
}

/**
 * Ghi frame hiển thị khi phát ngược. Chỉ frame MỚI (index khác frame
 * ghi gần nhất) mới tạo event — vẽ lại cùng frame (hold/draw trùng)
 * không làm méo cadence. start() reset để mỗi lượt phát ngược đo riêng;
 * nếu không start() thì event đầu tự làm mốc (firstFrameLatency null).
 */
export class ReverseCadenceTracker {
  private events: Array<{ frame: number; tMs: number }> = [];
  private lastFrame: number | null = null;
  private startedMs: number | null = null;

  /** Bắt đầu lượt đo mới (harness gọi ngay trước khi bấm phát ngược). */
  start(nowMs: number): void {
    this.events = [];
    this.lastFrame = null;
    this.startedMs = nowMs;
  }

  reset(): void {
    this.events = [];
    this.lastFrame = null;
    this.startedMs = null;
  }

  /**
   * Ghi 1 frame vừa vẽ. Trả true khi đây là frame MỚI (đếm vào
   * cadence), false khi trùng frame trước (vẽ lại — không đếm).
   */
  recordPresented(frameIndex: number, nowMs: number): boolean {
    if (!Number.isFinite(frameIndex) || frameIndex < 0) return false;
    if (frameIndex === this.lastFrame) return false;
    this.lastFrame = frameIndex;
    this.events.push({ frame: frameIndex, tMs: nowMs });
    return true;
  }

  /** Số event đã ghi (để harness kiểm tra tracker có sống không). */
  get eventCount(): number {
    return this.events.length;
  }

  snapshot(): ReverseCadenceStats | null {
    if (this.events.length === 0) return null;
    const intervals: number[] = [];
    for (let i = 1; i < this.events.length; i++) {
      intervals.push(this.events[i].tMs - this.events[i - 1].tMs);
    }
    const sum = summarizeIntervals(intervals);
    const wallMs =
      this.events.length >= 2
        ? this.events[this.events.length - 1].tMs - this.events[0].tMs
        : 0;
    const wallSec = wallMs / 1000;
    const distinct = new Set(this.events.map((e) => e.frame)).size;
    return {
      presentedFrames: this.events.length,
      distinctFrames: distinct,
      firstFrameLatencyMs:
        this.startedMs !== null
          ? Math.max(0, this.events[0].tMs - this.startedMs)
          : null,
      wallSec: +wallSec.toFixed(3),
      presentedFps:
        wallSec > 0 ? +(distinct / wallSec).toFixed(2) : 0,
      intervalMedianMs:
        sum.median !== null ? +sum.median.toFixed(1) : null,
      intervalP90Ms: sum.p90 !== null ? +sum.p90.toFixed(1) : null,
      intervalMaxMs: sum.max !== null ? +sum.max.toFixed(1) : null,
      stallsOver100Ms: intervals.filter((v) => v > 100).length,
      stallsOver250Ms: intervals.filter((v) => v > 250).length,
    };
  }
}
