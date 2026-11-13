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
 *     nhanh (chỉ seek khi thả tay) và huỷ seek cũ (latest-wins), nên trong lúc
 *     kéo canvas giữ nguyên frame tĩnh thay vì nhấp nháy frame sai.
 *
 * Đợt 53 J6 — guard `seekable` pre-seek (nợ I8, xem LIMITS đợt 52 I8 §3):
 * trước khi gán `currentTime`, kiểm tra `el.seekable`: nếu mọi range đều
 * kết thúc ở 0 (mẫu `[[0,0]]`) mà target > 0 thì KHÔNG gán, trả về
 * `{ seeked: false, seekableBlocked: true }` ngay. Bằng chứng I8: phân
 * tách hoàn hảo 56/56 — seek khi seekable `[[0,0]]` thì đáp 0, khi đã
 * `[[0,3]]` thì đáp đúng; trạng thái `[[0,0]]` DÍNH suốt vòng đời tab
 * (đợi 12 s không cứu được 6/10) nên "đợi thêm" không phải chiến lược
 * khắc phục. Guard chỉ chặn đúng mẫu đã đo (`max end <= 0`, target > 0);
 * seekable vắng (mock / trình duyệt cũ), rỗng (chưa có metadata), hay
 * đã xác định (`end > 0`) thì đi đường cũ — fail-open, không đổi hành vi
 * file thật. Element bị chặn vẫn được tính vào `failed` của seekAll
 * (không seek được) và đếm riêng ở `seekableBlocked` để UI/harness đọc
 * được lý do; đường failed-only cũ (nhánh vẽ + cap W2) xử lý tiếp như
 * mọi lần seek hỏng khác — không thêm cap hay nhánh mới ở đây.
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

/** TimeRanges tối thiểu mà guard seekable cần (khớp HTMLMediaElement.seekable). */
export interface SeekableRanges {
  readonly length: number;
  start(index: number): number;
  end(index: number): number;
}

/** Interface tối thiểu của HTMLMediaElement mà seek cần. */
export interface Seekable {
  pause(): void;
  currentTime: number;
  /** Cờ seeking của element thật (HTMLMediaElement.seeking). Mock có thể bỏ qua. */
  seeking?: boolean;
  /**
   * Đợt 53 J6 — các range seekable của element thật
   * (HTMLMediaElement.seekable). Vắng ở mock / trình duyệt cũ → guard
   * pre-seek bỏ qua (fail-open, xem `seekableBlocksSeek`).
   */
  seekable?: SeekableRanges;
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
  /**
   * Đợt 89 Q5 — số lần GIA HẠN timeout khi element vẫn đang `seeking`.
   * Mặc định 0 = hành vi cũ (timeout đúng hẹn, mọi test cũ không đổi).
   * Mỗi lần gia hạn chờ thêm một `timeoutMs` nữa trước khi kết luận
   * timedOut — chỉ gia hạn khi `el.seeking === true` (trình duyệt đang
   * tích cực giải mã), còn seeking false / metadata lỗi thì timeout như
   * cũ. Căn cứ đo Q5 (probe89q5-seek-latency, clip GOP 250, seek xa
   * keyframe): Chromium 0,7–2,4s, WebKit 1,6–6,4s — đều vượt timeout
   * 1200ms nên mỗi seek tốn 2–6 attempt timeout + retry, đốt cap
   * PAUSE_SEEK_FAILURE_CAP (10) và có thể kẹt khung stale như P5 đợt 88.
   * Gia hạn làm seek chậm xong trong ĐÚNG 1 attempt thay vì timeout rồi
   * retry; giới hạn trên = (extensions + 1) × timeoutMs cho mỗi attempt.
   */
  timeoutExtensions?: number;
}

export const DEFAULT_SEEK_TIMEOUT_MS = 1200;
export const DEFAULT_SEEK_DEBOUNCE_MS = 80;
/** Đợt 89 Q5 — số lần gia hạn timeout mặc định cho preview (xem SeekOpts):
 * 5 lần × 1200ms = ngân sách 7,2s/attempt. Căn cứ đo Q5 (clip GOP 250):
 * Chromium không tải max 2,4s; WebKit không tải max 6,4s → phủ hết trong
 * ĐÚNG 1 attempt (0 lần timeout, không đốt cap); WebKit DƯỚI TẢI (3x yes,
 * loadavg 16, RAM khả dụng 745MB) tElement max 9,7s → tối đa 2 attempt
 * (1 timeout) mỗi seek, còn xa cap 10 (cap chỉ reset khi seek thành công
 * nên seek chậm vẫn không bao giờ chạm cap). Seek kẹt thật (seeked không
 * tới) vẫn timeout sau tối đa 7,2s/attempt — chậm hơn 1,2s cũ nhưng là
 * trường hợp hiếm (file hỏng/metadata lỗi), đánh đổi chấp nhận được.
 * Chỉ preview truyền giá trị này; seekElement mặc định giữ 0 (test cũ). */
export const SEEK_TIMEOUT_EXTENSIONS = 5;
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
  /**
   * Đợt 53 J6 — true khi seek bị guard `seekable` pre-seek chặn (xem
   * `seekableBlocksSeek`): seekable `[[0,0]]` mà target > 0 nên không
   * gán `currentTime` lần nào. Chỉ có khi bị chặn; vắng = đường cũ.
   */
  seekableBlocked?: boolean;
}

/**
 * Đợt 53 J6 — lý do chặn seek khi `seekable` chưa xác định (mẫu
 * `[[0,0]]` của I8). Giá trị này chỉ dùng trong code/test, không hiển
 * thị trực tiếp cho user.
 */
export const SEEK_BLOCKED_SEEKABLE_UNDETERMINED = "seekable-chua-xac-dinh";

/**
 * Đợt 53 J6 — có nên chặn seek này vì `seekable` chưa xác định không?
 * Trả về lý do chặn, hoặc null (= cứ seek như cũ).
 *
 * Luật chặn — đúng biên bằng chứng I8 (56/56, xem LIMITS đợt 52 I8 §3):
 * seek khi seekable là `[[0,0]]` thì đáp 0; seek khi đã `[[0,3]]` thì
 * đáp đúng. Vì vậy chỉ chặn khi TẤT CẢ range đều kết thúc ở ≤ 0 (end
 * lớn nhất ≤ 0) VÀ target > 0 (seek về 0 thì `[[0,0]]` vẫn đúng, không
 * chặn). Mọi trường hợp khác đều fail-open (trả null): seekable vắng
 * (mock / trình duyệt không hỗ trợ), rỗng (length 0 — chưa có metadata;
 * đường timeout hiện có xử lý), đã xác định (end > 0 — seek vượt cuối
 * range là hợp lệ, trình duyệt tự fetch), hoặc đọc range ném lỗi.
 * Không bao giờ throw.
 */
export function seekableBlocksSeek(
  el: Pick<Seekable, "seekable">,
  target: number,
): string | null {
  if (!(target > 0)) return null;
  const ranges = el.seekable;
  if (!ranges || typeof ranges.length !== "number" || ranges.length === 0) {
    return null;
  }
  try {
    let maxEnd = -Infinity;
    for (let i = 0; i < ranges.length; i++) {
      const e = ranges.end(i);
      if (typeof e === "number" && Number.isFinite(e)) {
        maxEnd = Math.max(maxEnd, e);
      }
    }
    if (maxEnd === -Infinity) return null; // không đọc được end nào → fail-open
    if (maxEnd <= 0) return SEEK_BLOCKED_SEEKABLE_UNDETERMINED;
  } catch {
    return null;
  }
  return null;
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
    const finish = (seeked: boolean, timedOut: boolean, blocked = false) => {
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
      resolve(
        blocked
          ? { seeked, timedOut, seekableBlocked: true }
          : { seeked, timedOut },
      );
    };
    try {
      el.pause();
    } catch {
      /* bỏ qua */
    }
    // Đợt 53 J6 — guard `seekable` pre-seek (xem header module): seek
    // khi seekable `[[0,0]]` mà target > 0 thì đáp 0 (I8 56/56) nên
    // KHÔNG gán `currentTime` lần nào; trả về ngay với cờ
    // `seekableBlocked` để caller biết rõ lý do thay vì đáp 0 lặng.
    // Kiểm tra 1 lần ở đầu (trạng thái `[[0,0]]` dính suốt vòng đời tab
    // nên không cần kiểm lại ở mỗi attempt; retry ở tầng preview — nếu
    // seekable đã xác định — sẽ qua guard ở lần gọi sau).
    if (seekableBlocksSeek(el, snapped) !== null) {
      finish(false, false, true);
      return;
    }
    // Đợt 31 N1: kiểm tra + chờ theo vòng attempt thay vì một lần set
    // rồi chờ mù. Lý do: (a) seeked có thể thuộc về seek CŨ đang bay
    // (element đã seeking khi vào — xảy ra ở lần retry sau timeout của
    // preview) — khi đó phải kiểm tra lại rồi mới phát seek của mình,
    // không được kết luận "xong" khi element vẫn ở frame cũ; (b) gán
    // lại currentTime trong lúc element đang seeking sẽ huỷ seek đang
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
      // Đợt 89 Q5 — gia hạn timeout khi element vẫn đang seeking (xem
      // SeekOpts.timeoutExtensions): timer cháy mà seek vẫn đang bay thì
      // chờ thêm một timeoutMs nữa thay vì kết luận timedOut ngay. Listener
      // `seeked` giữ nguyên qua các lần gia hạn (không gỡ/gắn lại); chỉ
      // khi hết lượt gia hạn hoặc element không còn seeking mới finish
      // timedOut. Mặc định extensions = 0 nên hành vi cũ giữ nguyên.
      let extensionsLeft = opts.timeoutExtensions ?? 0;
      const armTimer = () => {
        timer = setTimeout(() => {
          let stillSeeking = false;
          try {
            stillSeeking = el.seeking === true;
          } catch {
            stillSeeking = false;
          }
          if (extensionsLeft > 0 && stillSeeking) {
            extensionsLeft -= 1;
            armTimer();
            return;
          }
          finish(false, true);
        }, timeoutMs);
      };
      armTimer();
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
  /**
   * Đợt 53 J6 — số target bị guard `seekable` pre-seek chặn (đã tính
   * trong `failed`; đếm riêng để caller đọc được lý do). Vắng = 0.
   */
  seekableBlocked?: number;
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
  let seekableBlocked = 0;
  for (const r of results) {
    if (r.seeked) done += 1;
    else if (r.timedOut) timedOut += 1;
    else failed += 1;
    if (r.seekableBlocked) seekableBlocked += 1;
  }
  return {
    done,
    timedOut,
    failed,
    ...(seekableBlocked > 0 ? { seekableBlocked } : {}),
  };
}

export interface SeekOutcome extends SeekAllResult {
  ok: boolean;
  cancelled: boolean;
}

/**
 * Seeker: debounce + latest-wins cho scrub timeline.
 *
 * - `request(t)` mới sẽ huỷ request cũ: promise cũ resolve `{ cancelled: true }`,
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
    // Request mới huỷ mọi request cũ đang chờ -> promise cũ resolve cancelled,
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
