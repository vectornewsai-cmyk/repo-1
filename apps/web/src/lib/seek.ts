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
// ROUND46-B2: nối lib phân loại quirk của đợt 45 A2 vào seek thật
// (nợ A2 §5.3 — trước đây pause45A2.ts chỉ được test/harness dùng,
// seek.ts vẫn đếm riêng chỉ đáp 0). WrongLandingTracker thuần, không
// kéo DOM, nên import an toàn cho cả Node lẫn browser bundle.
// ROUND46-B2: import kèm đuôi .ts theo quy ước strip-types của repo
// (tiền lệ assetStore.ts / nestedPreview.ts): tsc với moduleResolution
// bundler mà không bật allowImportingTsExtensions sẽ báo TS5097 cho
// đường dẫn đuôi .ts nên dòng import này mang @ts-ignore có chủ đích
// — vite và node strip-types đều resolve được đuôi .ts.
// @ts-ignore: xem ghi chú trên (TS5097, đuôi .ts cho strip-types)
import { WrongLandingTracker } from "./pause45A2.ts";

/** Interface tối thiểu của HTMLMediaElement mà seek cần. */
export interface Seekable {
  pause(): void;
  currentTime: number;
  /** Cờ seeking của element thật (HTMLMediaElement.seeking). Mock có thể bỏ qua. */
  seeking?: boolean;
  addEventListener(
    type: "seeked",
    listener: () => void,
    options?: { once?: boolean },
  ): void;
  /** Gỡ listener `seeked` (HTMLMediaElement có sẵn; mock có thể bỏ qua). */
  removeEventListener?(type: "seeked", listener: () => void): void;
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
// ROUND44-Z2: số lần gán lại tối đa sau khi `seeked` đáp xuống 0 trong khi
// target > 0 (quirk Chrome seek-landing-0, xem seekElement bên dưới).
// Lần đáp 0 thứ 3 (vượt 2 lần thử lại) thì bỏ cuộc thay vì gán mãi.
export const SEEK_ZERO_LANDING_MAX_RETRIES = 2;

/** Ngưỡng coi như "đã đúng vị trí": 1 frame. Giữ lại để tương thích;
 * needsSeek từ đợt 31 N1 không dùng nó nữa (xem frameIndexOf). */
export function seekEpsilonFor(fps: number): number {
  const f = Math.floor(fps);
  return 1 / (f > 0 ? f : 30);
}

/**
 * Chỉ số frame của một thời điểm (làm tròn tới frame gần nhất, cùng quy
 * ước với snapToFrame: Math.round(t * fps)). Dùng để so vị trí thay vì
 * epsilon giây — xem needsSeek.
 */
export function frameIndexOf(t: number, fps = 30): number {
  const f =
    typeof fps === "number" && Number.isFinite(fps) && fps > 0 ? fps : 30;
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.round(t * f);
}

/**
 * Element đã ở đúng vị trí chưa?
 *
 * Đợt 31 N1 — SỬA BUG A (đợt 30 M1 §4): trước đây so giây với epsilon
 * đúng 1 frame (`|currentTime − target| > 1/fps`). Chrome báo
 * `currentTime` đã lượng tử hóa xuống micro giây (luôn ≤ giá trị đã
 * set), nên bước lùi đúng 1 frame cho khoảng cách báo cáo = 1 frame
 * − δ < epsilon → seek bị bỏ, preview hiển thị frame cũ; bước tiến
 * 1 frame từ vị trí giây nguyên (không mất gì khi lượng tử hóa) cũng
 * bị bỏ vì sai số float (diff − epsilon = −1,18e−16). So chỉ số frame
 * thì lượng tử hóa ≤ ~1,4µs không bao giờ đổi frame (nửa frame ở
 * 30fps là ~16ms), nên: khác frame → seek, cùng frame → thôi. Giữ
 * nguyên ngữ nghĩa "tránh nhấp nháy khi đã đúng frame", chỉ đổi cách
 * so để không bỏ seek bước 1 frame.
 */
export function needsSeek(
  el: Pick<Seekable, "currentTime">,
  target: number,
  fps = 30,
): boolean {
  return frameIndexOf(el.currentTime, fps) !== frameIndexOf(target, fps);
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
    // Đợt 32 O3: listener của attempt này (để gỡ khi finish — xem dưới).
    let onSeeked: (() => void) | null = null;
    // ROUND44-Z2: đếm số lần `seeked` đáp xuống 0 liên tiếp cho target > 0
    // + cờ "lần seek này đã tự gán currentTime" (để seeked của seek CŨ
    // đang bay khi vào — chưa gán gì — không bị tính oan là đáp 0).
    // ROUND46-B2: thay bộ đếm chỉ-đáp-0 của Z2 bằng WrongLandingTracker
    // của A2 (ngưỡng truyền đúng SEEK_ZERO_LANDING_MAX_RETRIES = 2 nên
    // hành vi đáp 0 giữ nguyên từng lần gán; khác biệt duy nhất là đáp
    // sai frame KHÁC 0 nay cũng đếm liên tiếp và fail ở lần thứ 3 thay
    // vì bị reset như trước — xem listener bên dưới). Marker Z2 giữ
    // nguyên vẹn; hunk B2 chỉ thay cơ chế đếm, không đổi ngưỡng/timing.
    const wrongLanding = new WrongLandingTracker(
      SEEK_ZERO_LANDING_MAX_RETRIES,
    );
    let assigned = false;
    const finish = (seeked: boolean, timedOut: boolean) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      // Đợt 32 O3 — gỡ listener mồ côi sau timeout: attempt timeout
      // resolve nhưng listener `once` chưa bắn vẫn còn gắn trên element
      // thật (trình duyệt chỉ gỡ listener `once` khi nó đã bắn). Vòng
      // retry của preview tạo 1 attempt mới mỗi ~1,29s nên listener
      // tồn đọng tăng không giới hạn theo thời gian (đo Node 120s:
      // 93 attempt → 93 listener, xem LIMITS O3 §3). Gỡ ở đây là an
      // toàn: attempt này đã settle, seeked muộn (nếu có) thuộc về
      // attempt retry mới với listener riêng của nó; còn khi finish
      // được gọi từ chính handler seeked thì listener `once` đã tự gỡ
      // nên gọi gỡ lại chỉ là no-op. Không đặt giới hạn/backoff cho
      // retry: retry rẻ (CPU ~51ms/120s đo Node) và giới hạn sẽ phá
      // hội tụ dưới tải mà N1 vừa sửa.
      if (onSeeked) {
        try {
          el.removeEventListener?.("seeked", onSeeked);
        } catch {
          /* bỏ qua */
        }
        onSeeked = null;
      }
      resolve({ seeked, timedOut });
    };
    try {
      el.pause();
    } catch {
      /* bỏ qua */
    }
    // Đợt 31 N1: kiểm tra + chờ theo vòng attempt thay vì một lần set
    // rồi chờ mù. Lý do: (a) seeked có thể thuộc về seek CŨ đang bay
    // (element đã seeking khi vào — xảy ra ở lần retry sau timeout của
    // preview) — khi đó phải kiểm tra lại rồi mới phát seek của mình,
    // không được kết luận "xong" khi element vẫn ở frame cũ; (b) gán
    // lại currentTime trong lúc element đang seeking sẽ hủy seek đang
    // bay và giải mã lại từ đầu, khiến seek chậm (> timeout) không bao
    // giờ kịp hoàn tất qua các lần retry — nên khi seeking thì CHỈ
    // chờ seeked, không gán. Listener luôn gắn TRƯỚC khi gán để không
    // lỡ seeked. Hết timeout thì resolve timedOut (preview sẽ retry —
    // xem preview.tsx nhánh timeout), listener cũ còn sót được chặn
    // bởi cờ done.
    const attempt = () => {
      if (done) return;
      // Đợt 31 N1 (sửa sau probe tải nặng): ĐÃ ĐÚNG FRAME CHƯA ĐỦ ĐỂ
      // KẾT LUẬN XONG khi element đang seeking — Chrome báo currentTime
      // = target NGAY KHI seek bắt đầu trong khi vẫn đang giải mã
      // (poll probe tải nặng: seeking = true, ct = target, rs = 1).
      // Nếu kết luận xong lúc đó, preview vẽ ngay → decideVideoFrame
      // skip (rs < 2) → canvas đen + lastDrawn = t → ngủ vĩnh viễn với
      // nền đen (đúng dấu vết DARK-FIRST đo được dưới tải). Nên: đang
      // seeking thì LUÔN chờ seeked rồi mới kiểm tra lại, dù currentTime
      // đã báo đúng target; chỉ khi không seeking mới được kết luận
      // "đã đúng frame, không cần seek" (tránh nhấp nháy).
      if (!el.seeking && !needsSeek(el, snapped, fps)) {
        finish(true, false);
        return;
      }
      timer = setTimeout(() => finish(false, true), timeoutMs);
      const listener = () => {
        if (done) return;
        if (timer) clearTimeout(timer);
        // ROUND44-Z2: quirk Chrome seek-landing-0 trên file hỏng (đợt 43
        // Y2 §3.4: seek tới 2,5 trên broken-gap thì `seeked` bắn ở
        // currentTime 0, gán lại 2,5 lại `seeked` ở 0, lặp mãi không
        // resolve — timer không bao giờ cháy vì seeked cứ tới, nên
        // seekAll treo, pendingSeek kẹt true, vòng lặp không ngủ).
        // Nhận diện: lần seek NÀY đã gán (assigned), element không còn
        // seeking, frame đáp = 0 trong khi frame target > 0. Đáp 0 một
        // hai lần có thể chỉ là thoáng qua nên cho thử lại; đáp 0 liên
        // tiếp vượt ngưỡng thì kết luận failed (seeked:false,
        // timedOut:false) để preview đi nhánh vẽ → cap W2 đếm skip →
        // ngủ có kiểm soát, thay vì treo. Phân biệt với seek về 0 có
        // chủ ý: target frame = 0 thì nhánh này không kích (targetFrame
        // > 0 mới tính), và seek tới 0 khi element đã ở 0 còn finish
        // sớm ở đầu attempt() trước khi tới đây.
        if (assigned && !el.seeking) {
          const landedFrame = frameIndexOf(el.currentTime, fps);
          const targetFrame = frameIndexOf(snapped, fps);
          // ROUND46-B2: phân loại mọi lần đáp qua tracker A2 thay vì
          // chỉ đếm đáp 0 (Z2). correct / intentional-zero (target 0)
          // reset streak; zero-landing VÀ wrong-landing đều đếm liên
          // tiếp, fail ở lần sai thứ 3 — đúng ngưỡng Z2, chỉ mở rộng
          // miền đáp sai. Guard assigned/!seeking của Z2 giữ nguyên
          // nên seeked của seek cũ đang bay vẫn không bị tính oan.
          const obs = wrongLanding.observe(landedFrame, targetFrame);
          if (obs.shouldFail) {
            finish(false, false);
            return;
          }
        }
        // seeked vừa bắn có thể là của seek cũ đang bay: kiểm tra
        // lại, chưa đúng frame thì phát seek của mình ngay.
        attempt();
      };
      try {
        el.addEventListener("seeked", listener, { once: true });
        onSeeked = listener;
      } catch {
        finish(false, false);
        return;
      }
      if (!el.seeking) {
        try {
          el.currentTime = snapped;
          // ROUND44-Z2: đánh dấu đã gán để listener phân biệt seeked
          // của seek này với seeked của seek cũ đang bay khi vào.
          assigned = true;
        } catch {
          // Metadata chưa có hoặc src lỗi -> gán currentTime ném lỗi.
          finish(false, false);
          return;
        }
      }
      // Trường hợp metadata chưa tải: `seeked` có thể không bao giờ bắn
      // -> timer dự phòng sẽ resolve (timedOut).
    };
    attempt();
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

  private debounceMs: number;

  // Đợt 31 N1: khai tường minh thay vì parameter property để file chạy
  // được bằng node --experimental-strip-types như các test lib khác.
  constructor(debounceMs: number = DEFAULT_SEEK_DEBOUNCE_MS) {
    this.debounceMs = debounceMs;
  }

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
        // ROUND46-B2: bọc executor thành reject (quyết định cho hazard
        // sync-throw của Y2 §5.1 / A2 §3 — xem LIMITS đợt 46 B2 §5).
        // Trước đây `run(t)` ném đồng bộ thì lỗi thoát khỏi callback
        // setTimeout thành uncaught, entry không bao giờ settle (treo),
        // và nhánh kind "error" của X2 không bao giờ tới được qua
        // đường này. Nay ném đồng bộ được xử lý ĐÚNG NHƯ rejected
        // promise (handler bên dưới): outcome ok:false, cancelled =
        // (gen !== generation) — với gen hiện tại thì cancelled:false
        // → classifySeekOutcome = "error" → cap X2 đếm → cạn cap thì
        // phục hồi Y2 chạy, thay vì treo vĩnh viễn. Chỉ đường ném mới
        // đổi: mọi seek thành công / reject bất đồng bộ / cancel giữ
        // nguyên; và chỉ production caller là executor preview.tsx
        // (collectActives ném → trước đây treo, nay thành error có
        // thể đếm/cạn/phục hồi). Không dùng Promise.resolve().then
        // để bọc vì sẽ đổi thứ tự microtask của seek thường.
        let runResult: Promise<SeekAllResult>;
        try {
          runResult = run(t);
        } catch {
          entry.resolve({
            ...Seeker.cancelledOutcome(),
            cancelled: gen !== this.generation,
          });
          return;
        }
        void runResult.then(
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
