/**
 * Seek chính xác cho preview (R1-062, Batch F).
 *
 * Vấn đề: khi kéo playhead, `HTMLVideoElement.currentTime = t` là bất đồng bộ —
 * trình duyệt cần thời gian giải mã frame mới. Canvas vẽ ngay lập tức sẽ hiển
 * thị frame CŨ (stale frame), và audio có thể lệch khỏi hình.
 *
 * Giải pháp:
 *  1. Pause TẤT CẢ media trước khi seek (audio + video dừng cùng lúc).
 *  2. Set `currentTime` đã snap về frame gần nhất (timebase R1-055).
 *  3. Chờ sự kiện `seeked` của từng element (có timeout dự phòng cho trường
 *     hợp metadata chưa tải xong và `seeked` không bao giờ bắn).
 *  4. Chỉ vẽ frame khi lần seek MỚI NHẤT đã xong — `Seeker` debounce khi scrub
 *     nhanh (chỉ seek khi thả tay) và hủy seek cũ (latest-wins), nên trong lúc
 *     kéo canvas giữ nguyên frame tĩnh thay vì nhấp nháy frame sai.
 *
 * Module này không phụ thuộc DOM thật: `Seekable` là interface tối thiểu nên
 * test được bằng mock trong Node.
 */
import { snapToFrame } from "@repo-1/video-spec";

/** Interface tối thiểu của HTMLMediaElement mà seek cần. */
export interface Seekable {
  pause(): void;
  currentTime: number;
  addEventListener(
    type: "seeked",
    listener: () => void,
    options?: { once?: boolean },
  ): void;
}

export interface SeekTarget {
  el: Seekable;
  /** Thời gian nguồn (giây) — sẽ được snap về frame trước khi seek. */
  target: number;
  /** Nhãn debug, ví dụ "video:clip-3". */
  label: string;
}

export interface SeekOpts {
  /** fps của project — dùng để snap + tính ngưỡng. Mặc định 30. */
  fps?: number;
  /** Timeout chờ `seeked` cho mỗi element. Mặc định 1200ms. */
  timeoutMs?: number;
  /** Debounce của Seeker khi scrub. Mặc định 80ms. */
  debounceMs?: number;
}

export const DEFAULT_SEEK_TIMEOUT_MS = 1200;
export const DEFAULT_SEEK_DEBOUNCE_MS = 80;

/** Ngưỡng coi như "đã đúng vị trí": 1 frame. */
export function seekEpsilonFor(fps: number): number {
  const f = Math.floor(fps);
  return 1 / (f > 0 ? f : 30);
}

/** Element đã ở đúng vị trí chưa (trong ±1 frame)? */
export function needsSeek(
  el: Pick<Seekable, "currentTime">,
  target: number,
  fps = 30,
): boolean {
  return Math.abs(el.currentTime - target) > seekEpsilonFor(fps);
}

export interface SeekResult {
  seeked: boolean;
  timedOut: boolean;
}

/**
 * Seek 1 element: pause → set currentTime (đã snap về frame) → chờ `seeked`.
 * Không bao giờ throw; resolve `{ seeked: false }` khi không seek được.
 */
export function seekElement(
  el: Seekable,
  target: number,
  opts: SeekOpts = {},
): Promise<SeekResult> {
  const fps = opts.fps ?? 30;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_SEEK_TIMEOUT_MS;
  const snapped = snapToFrame(target, fps);
  return new Promise((resolve) => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (seeked: boolean, timedOut: boolean) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      resolve({ seeked, timedOut });
    };
    try {
      el.pause();
    } catch {
      /* bỏ qua */
    }
    // Đã đúng vị trí (±1 frame) -> không cần seek, tránh nhấp nháy.
    if (!needsSeek(el, snapped, fps)) {
      finish(true, false);
      return;
    }
    timer = setTimeout(() => finish(false, true), timeoutMs);
    const onSeeked = () => finish(true, false);
    try {
      el.addEventListener("seeked", onSeeked, { once: true });
    } catch {
      finish(false, false);
      return;
    }
    try {
      el.currentTime = snapped;
    } catch {
      // Metadata chưa có hoặc src lỗi -> gán currentTime ném lỗi.
      finish(false, false);
      return;
    }
    // Trường hợp metadata chưa tải: `seeked` có thể không bao giờ bắn ->
    // timer dự phòng sẽ resolve.
  });
}

export interface SeekAllResult {
  done: number;
  timedOut: number;
  failed: number;
}

/**
 * Seek ĐỒNG THỜI tất cả target: pause TẤT CẢ element trước (audio + video
 * dừng cùng lúc, không lệch), rồi seek song song bằng Promise.all.
 * Không bao giờ throw.
 */
export async function seekAll(
  targets: SeekTarget[],
  opts: SeekOpts = {},
): Promise<SeekAllResult> {
  for (const tg of targets) {
    try {
      tg.el.pause();
    } catch {
      /* bỏ qua */
    }
  }
  const results = await Promise.all(
    targets.map((tg) =>
      seekElement(tg.el, tg.target, opts).catch(
        (): SeekResult => ({ seeked: false, timedOut: false }),
      ),
    ),
  );
  let done = 0;
  let timedOut = 0;
  let failed = 0;
  for (const r of results) {
    if (r.seeked) done += 1;
    else if (r.timedOut) timedOut += 1;
    else failed += 1;
  }
  return { done, timedOut, failed };
}

export interface SeekOutcome extends SeekAllResult {
  ok: boolean;
  cancelled: boolean;
}

/**
 * Seeker: debounce + latest-wins cho scrub timeline.
 *
 * - `request(t)` mới sẽ hủy request cũ: promise cũ resolve `{ cancelled: true }`,
 *   executor chỉ chạy cho request mới nhất sau `debounceMs`.
 * - Trong lúc kéo nhanh, mỗi pointermove gọi `request` lại -> debounce reset liên
 *   tục -> chỉ seek 1 lần khi thả tay (hoặc dừng kéo > debounceMs).
 * - `cancel()` dùng khi bấm play: bỏ mọi seek đang chờ.
 */
export class Seeker {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private pending: { gen: number; resolve: (o: SeekOutcome) => void }[] = [];

  constructor(private debounceMs: number = DEFAULT_SEEK_DEBOUNCE_MS) {}

  private static cancelledOutcome(): SeekOutcome {
    return { ok: false, cancelled: true, done: 0, timedOut: 0, failed: 0 };
  }

  /** Resolve cancelled cho mọi request đang chờ (khi bị thay thế hoặc cancel()). */
  private flushPending(): void {
    const ps = this.pending;
    this.pending = [];
    for (const p of ps) p.resolve(Seeker.cancelledOutcome());
  }

  request(
    t: number,
    run: (t: number) => Promise<SeekAllResult>,
  ): Promise<SeekOutcome> {
    // Request mới hủy mọi request cũ đang chờ -> promise cũ resolve cancelled,
    // không bao giờ treo.
    this.flushPending();
    this.generation += 1;
    const gen = this.generation;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return new Promise((resolve) => {
      this.pending.push({ gen, resolve });
      this.timer = setTimeout(() => {
        this.timer = null;
        const idx = this.pending.findIndex((p) => p.gen === gen);
        const entry = idx >= 0 ? this.pending.splice(idx, 1)[0] : null;
        if (!entry || gen !== this.generation) {
          entry?.resolve(Seeker.cancelledOutcome());
          return;
        }
        void run(t).then(
          (r) =>
            entry.resolve(
              gen === this.generation
                ? { ok: true, cancelled: false, ...r }
                : Seeker.cancelledOutcome(),
            ),
          () =>
            entry.resolve({
              ...Seeker.cancelledOutcome(),
              cancelled: gen !== this.generation,
            }),
        );
      }, this.debounceMs);
    });
  }

  cancel(): void {
    this.generation += 1;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.flushPending();
  }
}
