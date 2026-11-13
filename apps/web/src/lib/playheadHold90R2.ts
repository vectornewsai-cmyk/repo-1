// playheadHold90R2.ts — Phase 9 đợt 90, luồng R2: ĐÓNG BĂNG playhead trong
// lúc phát sau seek, khi clip video xuôi đang seeking.
//
// NỢ GỐC (LIMITS gộp đợt 89 §4 mục 2 / Q5 §6 mục 1): store playhead tăng
// theo wall-clock trong khi element đang seek và canvas chưa vẽ khung mới
// — lệch tới nhiều giây trên WebKit dưới tải (Q5 S5(a2): playhead 3,7
// trong khi blob vẫn ở vị trí t=5). Nguyên nhân: vòng lặp phát trong
// preview.tsx tăng playhead bằng dt wall-clock ở ĐẦU mỗi tick, TRƯỚC khi
// syncMedia seek element; còn renderFrame thì bị N3 (đợt 86) bỏ qua khi
// đang seeking nên canvas giữ khung cũ. Playhead "nói dối" về frame đang
// hiện, và audio/video sau khi seek xong phải đuổi theo playhead đã chạy
// xa (drift re-seek).
//
// SỬA (preview.tsx dùng 2 điểm nối, hàm này chỉ quyết định THUẦN để
// unit-test được):
//  1. Ở đầu tick phát: nếu tick TRƯỚC syncMedia báo có clip video xuôi
//     đang seeking (cờ skipRenderSeeking của N3 — đúng tập actives tại
//     playhead hiện tại, không phải mọi element trong pool), thì KHÔNG
//     tăng playhead tick này và KHÔNG tích lũy dt (forwardAcc/reverseAcc
//     reset về 0) — playhead đứng yên ở vị trí seek tới cho tới khi seek
//     xong, rồi mới chạy tiếp 1× wall. Chỉ chậm tối đa 1 tick sau khi
//     seek xong (tick mà cờ lật false mới tăng lại — không đáng kể).
//  1b. Cạnh lên của nút Phát (forceSeekEdge): tick bấm play cũng GIỮ
//     (dù cờ N3 tick trước còn false — seek của tick này chưa chạy).
//     Nếu không, tick đó tăng playhead bằng TRỌN dt của nó TRƯỚC khi
//     syncMedia kịp forceSeek — dưới tải, rAF callback đầu sau wake()
//     có thể tới muộn ~170ms (đo webkit-load R2: playhead nhảy 0,5 →
//     0,667 = 5 frame trong đúng 1 tick) rồi mới đóng băng, tức vượt
//     vẫn 5 frame. Giữ ở cạnh lên thì forceSeek nhắm đúng playhead hiện
//     tại (0,5), không vượt frame nào; nếu forceSeek là no-op (element
//     đã đúng vị trí) thì tick sau cờ false → nhả ngay, chỉ mất 1 tick.
//  2. Trong syncMedia lúc đang giữ (playheadHeld): pause mọi active xuôi
//     (cả video lẫn audio) để audio không chạy trước playhead đã đóng băng
//     và video đã seek xong sớm không decode thừa làm chậm seek còn lại;
//     khi hết giữ, nhánh forward resume bằng play() như cũ. Pause element
//     đang seeking KHÔNG hủy seek (seek độc lập với paused — cùng mẫu
//     pause-trước-seek của seek.ts); probe90r2 đo thật việc này.
//  3. Trần tường: giữ liên tục quá PLAYHEAD_HOLD_MAX_MS thì NHẢ (playhead
//     chạy tiếp như cũ) và KHÔNG giữ lại cho tới khi seeking về false một
//     lần (seek mới) — seek kẹt vĩnh viễn không được đóng băng timeline
//     mãi. Ngưỡng 15s: trên mọi seek đo được (WebKit dưới tải tElement
//     max 9,7s, Q5), còn dưới ngưỡng này thì giữ đủ lâu để seek xong.
//
// KHÔNG đổi: scrub lúc pause (Seeker — giữ chỉ kích khi đang phát),
// phát ngược (shouldSkipRenderWhileSeeking đã false cho reverse nên giữ
// không bao giờ kích ở chiều ngược), ngưỡng drift re-seek 0,35s, timeout
// Seeker 7,2s/attempt của Q5. Trạng thái giữ chỉ sống trong closure vòng
// lặp preview; hàm này không chạm DOM/store.

/**
 * Trần tường cho một lần giữ liên tục (ms). Trên mọi seek đo được ở Q5
 * (WebKit dưới tải tElement max 9,7s); seek kẹt thật vượt trần thì nhả để
 * timeline không đóng băng vĩnh viễn (xem header). Đổi số này phải cập
 * nhật cả test pin bên dưới.
 */
export const PLAYHEAD_HOLD_MAX_MS = 15000;

/** Trạng thái giữ do caller (closure vòng lặp preview) lưu giữa các tick. */
export interface PlayheadHoldState {
  /** Timestamp rAF (ms) lúc lần giữ hiện tại bắt đầu; null = chưa giữ. */
  holdingSinceMs: number | null;
  /** true = lần giữ vừa rồi đã chạm trần và bị nhả; chỉ reset khi seeking về false. */
  capReleased: boolean;
}

/** Trạng thái giữ ban đầu (chưa giữ lần nào). */
export function initialPlayheadHoldState(): PlayheadHoldState {
  return { holdingSinceMs: null, capReleased: false };
}

export interface PlayheadHoldInput {
  /** Vòng lặp có đang phát không (giữ chỉ có ý nghĩa khi playing). */
  playing: boolean;
  /**
   * Tick TRƯỚC syncMedia có báo clip video xuôi đang seeking không
   * (cờ skipRenderSeeking của N3 trả về ở tick trước). Dùng tín hiệu
   * tick trước vì playhead tăng ở ĐẦU tick, trước khi syncMedia của
   * tick này chạy — trễ 1 tick là tối đa 1 frame vượt (xem header).
   */
  seekingPrevTick: boolean;
  /** Timestamp rAF của tick hiện tại (ms, cùng đồng hồ performance.now). */
  nowMs: number;
  /**
   * Tick này có phải cạnh lên của nút Phát không (playing vừa chuyển
   * false → true — syncMedia sắp forceSeek mọi source tới playhead):
   * giữ luôn tick này (xem header 1b) thay vì chờ cờ N3 tick sau.
   */
  forceSeekEdge?: boolean;
  /** Trạng thái giữ từ tick trước (caller lưu lại). */
  state: PlayheadHoldState;
}

export interface PlayheadHoldDecision {
  /** true = tick này KHÔNG tăng playhead (đóng băng) và reset phần dư dt. */
  hold: boolean;
  /** Trạng thái mới để caller lưu cho tick sau. */
  state: PlayheadHoldState;
}

// ---- Đợt 91 S2: giữ playhead vì element vừa seek xong nhưng chưa resume
// decode (sawtooth dư của R2 §5.1) ----
//
// NGUYÊN NHÂN ĐÃ ĐO (probe91s2, WebKit, clip bóng GOP 250, 720p — xem
// docs/PHASE9_ROUND91_S2_PLAYHEAD_SAWTOOTH_LIMITS.md §1): sau khi seek
// hoàn tất, R2 nhả giữ ngay (seeking=false) và syncMedia play() element
// trở lại, nhưng currentTime của element WebKit ĐỨNG YÊN ~0,8–1,0 s
// (lượt yên) / ~0,7–1,7 s (lượt tải) trong lúc paused=false,
// seeking=false — decoder cần thời gian decode xuôi từ keyframe thưa
// (GOP 250) tới điểm seek. Trong lúc đó playhead chạy tiếp ~1× wall
// → lag playhead–canvas tăng tới 0,75–1,0 s, drift vượt 0,35 s →
// drift re-seek → giữ R2 → snap về ~0 → chu kỳ lặp lại (4 re-seek / 3 s
// phát ở lượt yên; đỉnh lag 0,748 / 0,758 / 1,002 s).
//
// SỬA: sau khi seek xuôi của clip video hoàn tất, THEO DÕI element đó:
// tick sau giữ playhead cho tới khi currentTime của nó tăng >= 1 frame
// so với lúc hoàn tất (decoder đã resume, media clock chạy lại) hoặc
// hết ân hạn 1500 ms (decoder kẹt thật thì trả về hành vi cũ: drift
// re-seek lo). Trong lúc giữ kiểu này, syncMedia KHÔNG pause VIDEO
// (pause thì currentTime không bao giờ tăng → giữ mãi tới hết ân hạn)
// mà chỉ pause AUDIO để khỏi chạy trước playhead; video đã phát sẵn
// nên hết giữ không cần resume lại. Giữ này KHÁC giữ R2 (seeking):
// seeking-hold pause mọi active vì seek còn bay; resume-hold chỉ
// đóng băng playhead, element video vẫn phát.
// Chỉ arm cho seek XUÔI của clip video (forwardSeekCompletedThisTick
// trong preview.tsx) — clip reverse step-seek mỗi frame (currentTime
// lùi) nên không được arm, nếu không sẽ giữ oan mỗi tick.

/**
 * Ân hạn giữ playhead sau khi seek hoàn tất (ms). Trên mọi stall đo
 * được ở lượt yên (815/1025/920 ms — đoạn element đứng yên thật, không
 * tính thời gian giữ R2 che phủ); lượt tải có đoạn tới ~1,7 s nhưng
 * phần chạy tự do sau khi nhả giữ chỉ ~0,7 s. Vượt ân hạn thì nhả để
 * drift re-seek cũ lo (không đóng băng mãi khi decoder kẹt thật).
 * Đổi số này phải cập nhật cả test pin bên dưới.
 */
export const PLAYHEAD_RESUME_STALL_GRACE_MS = 1500;

// ---- Đợt 92 T3: trần cứng giữ-while-frozen (nợ LIMITS gộp đợt 91 §4 mục 3) ----
//
// ĐO THẬT (probe92t3, WebKit + tải, lượt 03:35 12/11): stall sau seekDone
// VƯỢT 1500 ms là chuyện thường, không phải ngoại lệ — GOP 250: 2109 ms
// và 2790 ms; GOP 30: 2829 / 1991 / 2197 ms (3/3 stall > 1500 ms, dù
// keyframe mau 1 s — stall do CPU đói, KHÔNG phải do GOP thưa; xem
// docs/PHASE9_ROUND92_T3_CANVAS_STALE_LIMITS.md §2). Ân hạn 1500 ms hết
// giữa stall → playhead nhả → chạy trước media clock → drift vượt 0,35 s
// → drift re-seek → N3 bỏ vẽ cả chu kỳ re-seek (~1,5–2 s) → lag đỉnh
// 1,2–1,9 s. Cả 2 lượt GOP 250/30 đều có 2 re-seek sau seekDone; GOP 60
// (stall dài nhất 1024 ms, trong ân hạn) có 0 re-seek.
//
// SỬA: giữ playhead MIỄN LÀ currentTime còn đóng băng (|Δ| < 1 frame),
// tới trần cứng PLAYHEAD_RESUME_STALL_MAX_MS = 5000 ms (trên mọi stall
// đo được 2,0–2,8 s, còn biên ~2,2 s; dưới trần R2 15 s cho seeking-hold).
// Nhả ngay khi currentTime tăng >= 1 frame (decoder đã resume — như cũ),
// lùi >= 1 frame (seek mới — như cũ), hoặc quá trần cứng (decoder kẹt
// thật thì trả về hành vi cũ: drift re-seek lo, rồi chu kỳ R2 lại giữ
// trong lúc re-seek; timeline không đóng băng vĩnh viễn vì mỗi chu kỳ
// playhead vẫn tiến thêm ≥ 0,35 s trước khi re-seek). Ân hạn 1500 ms
// giữ nguyên giá trị (pin test S2-R11) nhưng nay chỉ còn là "cửa sổ stall
// kỳ vọng" trong tài liệu — quyết định giữ/nhả dùng trần cứng, vì điều
// kiện "còn đóng băng" đã phân biệt được stall đang tiếp diễn với
// decoder đã resume; không còn lý do nhả giữa stall chỉ vì hết 1500 ms.
// Caller (preview.tsx) dọn watch theo cùng trần cứng này.
/**
 * Trần cứng giữ playhead vì resume-stall (ms). Giữ tối đa từng này kể
 * từ lúc seek hoàn tất, MIỄN LÀ currentTime còn đóng băng (< 1 frame).
 * Trên mọi stall đo được ở đợt 92 T3 (tối đa 2829 ms); đổi số phải cập
 * nhật cả test pin bên dưới.
 */
export const PLAYHEAD_RESUME_STALL_MAX_MS = 5000;

/** Một lần theo dõi resume-stall: element video vừa seek xong. */
export interface PlayheadResumeWatch {
  /** currentTime của element lúc seek vừa hoàn tất (giây). */
  ctAtCompletion: number;
  /** Timestamp rAF (ms, cùng đồng hồ performance.now) lúc seek hoàn tất. */
  completedAtMs: number;
}

export interface PlayheadResumeStallInput {
  /** Vòng lặp có đang phát không (giữ chỉ có ý nghĩa khi playing). */
  playing: boolean;
  /** Timestamp rAF của tick hiện tại (ms). */
  nowMs: number;
  /** Lần theo dõi đang mở (null = không có seek vừa hoàn tất). */
  watch: PlayheadResumeWatch | null;
  /** currentTime hiện tại của element đang theo dõi (giây). */
  currentCt: number;
  /** Độ dài 1 frame (giây) — 1/fps của project. */
  frameDur: number;
}

/**
 * Có nên giữ playhead vì element vừa seek xong nhưng chưa resume decode?
 * Thuần, không chạm DOM — caller (preview.tsx) đọc currentTime thật và
 * truyền vào; caller cũng chịu trách nhiệm dọn watch khi hết hạn / đã
 * tăng đủ / element seek mới (xem header).
 *
 * - Không phát hoặc không có watch → không giữ.
 * - currentTime đã tăng >= 1 frame kể từ lúc hoàn tất → decoder đã
 *   resume → không giữ. currentTime LÙI >= 1 frame (seek mới đã đáp ở
 *   target khác) cũng nhả — watch này hết hạn, tick sau arm lại.
 * - Còn lại (|Δ currentTime| < 1 frame — kể cả đứng yên hẳn) → giữ
 *   MIỄN LÀ chưa quá trần cứng PLAYHEAD_RESUME_STALL_MAX_MS (5000 ms)
 *   kể từ lúc seek hoàn tất. Đợt 92 T3: stall 2,0–2,8 s dưới tải là
 *   thường gặp (vượt ân hạn 1500 ms cũ) — nhả giữa stall chỉ tạo chu kỳ
 *   drift re-seek + N3 bỏ vẽ, nên giữ tiếp tới khi decoder resume thật
 *   hoặc chạm trần cứng. Quá trần thì nhả (decoder kẹt thật → drift
 *   re-seek cũ lo; xem header T3).
 * - Trừ 1e-9 s để biên đúng-1-frame không bị sai số float
 *   (double: (1,267 + 1/60) − 1,267 nhỏ hơn 1/60 thật một epsilon)
 *   giữ oan thêm 1 tick.
 */
export function shouldHoldForResumeStall(
  input: PlayheadResumeStallInput,
): boolean {
  const { playing, nowMs, watch, currentCt, frameDur } = input;
  if (!playing || watch === null) return false;
  if (nowMs - watch.completedAtMs > PLAYHEAD_RESUME_STALL_MAX_MS) return false;
  // |Δ| < 1 frame: currentTime đứng yên (stall) hoặc jitter < 1 frame.
  // Tăng xuôi >= 1 frame (decoder đã resume) HOẶC lùi >= 1 frame (seek
  // mới đã đáp ở target khác — watch này hết hạn, tick sau arm lại)
  // đều nhả. Trừ 1e-9 s để biên đúng-1-frame không bị sai số float
  // (double: (1,267 + 1/60) − 1,267 nhỏ hơn 1/60 thật một epsilon)
  // giữ oan thêm 1 tick.
  // Đợt 98 Z3 — tăng BÒ (>= 1 frame nhưng tốc độ < 0,1× realtime, xem
  // isResumeCrawlAdvance98Z3) KHÔNG nhả: element bò vẫn là đóng băng
  // về mặt drift (d3 đợt 97), giữ tiếp tới khi decoder burst trở lại
  // ở tốc độ lành hoặc chạm trần 5000 ms.
  const advance98Z3 = Math.abs(currentCt - watch.ctAtCompletion);
  if (advance98Z3 < frameDur - 1e-9) return true;
  return isResumeCrawlAdvance98Z3(currentCt - watch.ctAtCompletion, nowMs - watch.completedAtMs);
}

// ---- Đợt 94 V2: re-arm trần stall cho stall THỨ 2+ (nợ U3 §5) ----
//
// NỢ GỐC (docs/PHASE9_ROUND93_U3_CANVAS_STALL_EVIDENCE_LIMITS.md §5):
// trần 5000 ms của T3 chỉ bảo vệ stall ĐẦU TIÊN sau mỗi lần seek hoàn
// tất. Filter dọn watch trong preview.tsx xóa watch ngay khi element
// tăng >= 1 frame (decoder resume lần đầu); watch chỉ arm lại khi có
// seek xuôi hoàn tất mới. Stall xảy ra sau đó (không có seek mới) thì
// KHÔNG được giữ — đo thật GOP 250 r1 đợt 94 V2: stall 2 dài 603 ms,
// playhead +0,367 s (vượt ngưỡng drift 0,35 s), resumeTicks đóng băng
// ở 5 trong suốt stall 2, rồi drift re-seek.
//
// SỬA: theo dõi currentTime của từng clip video xuôi đang phát (freeze
// detector thuần, không chạm DOM — caller đọc currentTime thật và truyền
// vào). Element đóng băng (không tăng >= 1 frame) liên tục từ
// PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS = 300 ms mà chưa có watch mở
// thì ARM WATCH MỚI với ctAtCompletion = currentTime hiện tại và
// completedAtMs = mốc element tăng lần cuối (tức lúc stall BẮT ĐẦU, không
// phải lúc phát hiện) — trần cứng 5000 ms của shouldHoldForResumeStall
// tính từ đầu stall, không đổi trần, không đổi hàm giữ. Watch arm lại
// này được giữ/nhả đúng như watch sau seek (nhả ngay khi tăng >= 1
// frame, lùi >= 1 frame, hoặc quá trần).
//
// Ngưỡng 300 ms = định nghĩa stall của probe92t3/93u3 (>= 300 ms mới
// tính là stall) và dưới ngưỡng drift 0,35 s: playhead chạy tự do tối
// đa ~0,3 s trong lúc chờ phát hiện, chưa đủ tự kích drift re-seek.
// Dưới tải, rAF gap 200–500 ms nên phát hiện thực tế xảy ra ở tick đầu
// tiên sau khi stall bắt đầu; lúc phát bình thường (gap ~16 ms) thì
// currentTime tăng >= 1 frame mỗi ~2 tick nên không bao giờ đủ 300 ms
// đóng băng để arm oan — xem test V2-R3/R9.
//
// Chống lách trần: watch chạm trần 5000 ms mà element vẫn đóng băng thì
// caller đánh dấu track.ceilingSpent = true (xem preview.tsx); detector
// KHÔNG arm lại cho cùng đợt đóng băng đó — nếu không trần cứng sẽ bị
// arm-liên-tục vô hiệu hóa. Cờ chỉ reset khi element tăng >= 1 frame
// (decoder resume thật), hoặc khi element seek/pause (caller dừng theo
// dõi). Quá trần thì trả về hành vi cũ như T3 (drift re-seek lo, rồi
// chu kỳ R2 lại giữ trong lúc re-seek; re-seek đó arm watch mới).
/**
 * Ngưỡng đóng băng để arm lại watch resume-stall (ms). Bằng định nghĩa
 * stall của probe (>= 300 ms) và dưới ngưỡng drift 0,35 s. Đổi số phải
 * cập nhật cả test pin bên dưới.
 */
export const PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS = 300;

// ---- Đợt 98 Z3: định nghĩa đóng băng theo TỐC ĐỘ (nợ LIMITS đợt 97
// §4 mục 3 — detector mù với stall "bò") ----
//
// PHÁT HIỆN (đo thật, d3 đợt 97, xem docs/PHASE9_ROUND97_Y4_REARM_LIMITS.md
// §3.3): element tăng đúng ~1 frame mỗi tick dài (~0,033/608 ms =
// 0,055× realtime) thì mỗi lần tăng đều reset đồng hồ đóng băng 300 ms
// của nextResumeFreezeRearm → không watch nào arm, đuôi Y4 không mở,
// drift re-seek bắn, kẹt seek 1,63 s. Tăng 1 frame KHÔNG PHẢI lúc nào
// cũng là "decoder resume" — chỉ là resume khi nó tới ở tốc độ ~realtime.
//
// SỬA: tăng >= 1 frame chỉ được tính là tăng THẬT (reset đồng hồ
// detector / kết thúc watch / nhả giữ) khi tốc độ tăng trung bình kể từ
// lần tăng thật cuối >= PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX. Tăng chậm
// hơn ngưỡng là tăng BÒ: đồng hồ đóng băng vẫn chạy (detector arm sau
// 300 ms bò), watch vẫn sống (giữ playhead), giữ vẫn bật — element bò
// được đối xử đúng như element đóng băng, vì về mặt drift nó cũng gây
// ra đúng hậu quả đó (playhead chạy trước ~1 gap rAF mỗi tick trong khi
// element chỉ nhích 1 frame).
//
// NGƯỠNG 0,1× realtime: nằm giữa tốc độ bò đã đo (0,055×, d3 đợt 97)
// và tốc độ tích lũy chậm nhất còn lành trong test pin (0,167× — V2-R9:
// nửa frame mỗi tick 100 ms) với biên ~1,7–1,8× cả hai phía; dưới mọi
// slow-mo thực tế (0,25× là chậm nhất thường dùng). Decoder nào duy trì
// < 0,1× liên tục >= 300 ms thì theo định nghĩa stall của probe
// (>= 300 ms) cũng đã là đóng băng — giữ playhead là phản ứng đúng, và
// watch nhả ngay khi decoder burst trở lại ở tốc độ lành (tốc độ trung
// bình tích lũy vượt ngưỡng sau tối đa ~1 tick burst).
/**
 * Tốc độ tăng tối đa còn tính là tăng BÒ (lần tốc độ realtime). Tăng
 * >= 1 frame mà tốc độ trung bình kể từ lần tăng thật cuối DƯỚI ngưỡng
 * này thì KHÔNG reset đồng hồ đóng băng / KHÔNG kết thúc watch /
 * KHÔNG nhả giữ. Đổi số phải cập nhật cả test pin bên dưới.
 */
export const PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX = 0.1;

/**
 * Tăng này có phải tăng BÒ không? Thuần, không chạm DOM.
 * @param advanceS độ tăng currentTime (giây, lấy dấu tuyệt đối).
 * @param elapsedMs thời gian đã trôi kể từ lần tăng thật cuối (ms).
 * Chưa trôi thời gian thì không đo được tốc độ — coi là tăng thật
 * (không bao giờ chặn nhả oan ở tick arm, khi dt > 0 luôn đúng).
 */
export function isResumeCrawlAdvance98Z3(advanceS: number, elapsedMs: number): boolean {
  const dtS = elapsedMs / 1000;
  if (!(dtS > 0)) return false;
  return Math.abs(advanceS) / dtS < PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX;
}

/** Trạng thái theo dõi đóng băng của 1 element video (caller lưu theo element). */
export interface ResumeFreezeTrack {
  /** currentTime lúc element tăng >= 1 frame lần cuối (giây). */
  lastCt: number;
  /** Timestamp rAF (ms) lúc element tăng >= 1 frame lần cuối. */
  lastAdvanceMs: number;
  /**
   * true = đợt đóng băng hiện tại đã chạm trần 5000 ms và bị nhả — không
   * arm lại cho tới khi element tăng >= 1 frame (xem header V2).
   */
  ceilingSpent: boolean;
}

export interface ResumeRearmInput {
  /** Vòng lặp có đang phát không (chỉ theo dõi khi playing). */
  playing: boolean;
  /** Timestamp rAF của tick hiện tại (ms). */
  nowMs: number;
  /** currentTime hiện tại của element đang theo dõi (giây). */
  currentCt: number;
  /** Độ dài 1 frame (giây) — 1/fps của project. */
  frameDur: number;
  /** Element có đang seeking không (seeking thì dừng theo dõi — seek lo). */
  seeking: boolean;
  /** Element có đang paused không (paused thì dừng theo dõi). */
  paused: boolean;
  /** Element đã có watch resume-stall đang mở chưa. */
  hasWatch: boolean;
  /** Trạng thái theo dõi từ tick trước của element này (null = chưa theo dõi). */
  track: ResumeFreezeTrack | null;
}

export interface ResumeRearmResult {
  /** Trạng thái theo dõi mới để caller lưu cho tick sau (null = dừng theo dõi). */
  track: ResumeFreezeTrack | null;
  /** Watch mới cần arm (null = không arm tick này). */
  arm: PlayheadResumeWatch | null;
}

/**
 * Một bước theo dõi đóng băng cho 1 element video xuôi đang phát.
 * Thuần, không chạm DOM.
 *
 * - Không phát / đang seeking / đang paused → dừng theo dõi (track null,
 *   không arm). Seek hoàn tất sẽ arm watch qua đường seek như cũ; pause
 *   thì playhead vốn đã đứng yên nên không cần giữ.
 * - Chưa theo dõi → bắt đầu theo dõi từ currentTime/mốc hiện tại, chưa arm.
 * - Tăng >= 1 frame kể từ lần tăng cuối → element đang decode (kể cả
 *   chậm: tăng tích lũy tới >= 1 frame mới tính) → cập nhật mốc, xóa
 *   ceilingSpent, không arm. Đợt 98 Z3: NGOẠI LỆ tăng BÒ — tăng >= 1
 *   frame mà tốc độ trung bình < 0,1× realtime (xem
 *   isResumeCrawlAdvance98Z3) thì KHÔNG cập nhật mốc, rơi xuống kiểm
 *   tra arm như đóng băng hẳn.
 * - Còn lại (đóng băng < 1 frame): nếu đã chạm trần đợt này hoặc đã có
 *   watch → không arm; nếu đóng băng liên tục >=
 *   PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS thì arm watch mới với mốc
 *   hoàn tất = lần tăng cuối (đầu stall), để trần 5000 ms tính từ đó.
 * - Trừ 1e-9 s để biên đúng-1-frame không bị sai số float (như
 *   shouldHoldForResumeStall).
 */
export function nextResumeFreezeRearm(
  input: ResumeRearmInput,
): ResumeRearmResult {
  const { playing, nowMs, currentCt, frameDur, seeking, paused, hasWatch, track } = input;
  if (!playing || seeking || paused) return { track: null, arm: null };
  if (track === null) {
    return {
      track: { lastCt: currentCt, lastAdvanceMs: nowMs, ceilingSpent: false },
      arm: null,
    };
  }
  if (Math.abs(currentCt - track.lastCt) >= frameDur - 1e-9) {
    // Đợt 98 Z3 — tăng BÒ (tốc độ < 0,1× realtime, xem
    // isResumeCrawlAdvance98Z3) KHÔNG reset đồng hồ: rơi xuống kiểm tra
    // arm bên dưới — bò đủ 300 ms thì arm như đóng băng hẳn (nợ LIMITS
    // đợt 97 §4 mục 3). Chỉ tăng ở tốc độ lành mới là decoder resume.
    if (!isResumeCrawlAdvance98Z3(currentCt - track.lastCt, nowMs - track.lastAdvanceMs)) {
      return {
        track: { lastCt: currentCt, lastAdvanceMs: nowMs, ceilingSpent: false },
        arm: null,
      };
    }
  }
  if (track.ceilingSpent || hasWatch) return { track, arm: null };
  if (nowMs - track.lastAdvanceMs >= PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS) {
    return {
      track,
      arm: { ctAtCompletion: currentCt, completedAtMs: track.lastAdvanceMs },
    };
  }
  return { track, arm: null };
}

/**
 * Đợt 96 X4 — tập element video xuôi đang có watch resume-stall CÒN SỐNG
 * (sau khi caller đã dọn watch hết hạn / đã tăng >= 1 frame / đang seeking
 * — xem preview.tsx). syncMedia dùng tập này làm grace cho drift re-seek:
 * mở rộng ân hạn 1 tick sau re-arm của W5 (Đợt 95) ra TOÀN BỘ thời gian
 * watch còn sống.
 *
 * VÌ SAO (đo thật, xem docs/PHASE9_ROUND96_X4_REARM_CEILING_LIMITS.md §2):
 * ân hạn 1 tick của W5 chưa bao giờ hủy được re-seek nào ngoài đời
 * (3/3 lần grace kích hoạt có drift đủ xác nhận đều DELAYED — seek bắn
 * ngay tick sau arm, vì element chưa resume kịp trong đúng 1 tick đó;
 * p3b đợt 95, b1/b2 đợt 96). Trong khi đó watch S2 vẫn còn sống và
 * playhead vẫn đang giữ ở tick seek bắn — drift đã vượt ngưỡng TỪ TRƯỚC
 * khi giữ vào (cửa sổ phát hiện đóng băng ~300 ms + 1 tick), và
 * overCount hoàn tất NGAY TRONG LÚC GIỮ. Quyết định drift re-seek không
 * hề kiểm tra watch có đang sống không — nên seek bắn vào decoder đang
 * đóng băng (seek kẹt 5–9 s trên WebKit), đúng thứ mà giữ playhead được
 * tạo ra để tránh. Ân hạn suốt-watch: seek chỉ bắn sau khi watch hết
 * (element resume → drift về dưới ngưỡng → overCount reset, không seek;
 * hoặc trần 5000 ms → watch hết → seek ngay tick sau, đường phục hồi
 * cũ được giữ nguyên). Chỉ video xuôi, chỉ đường drift qua helper
 * (freshSeekDue/restartEnded/pause không đổi, như W5).
 */
export function liveResumeWatchElements(
  watches: Array<{ el: object; watch: PlayheadResumeWatch }>,
): Set<object> {
  return new Set(watches.map((w) => w.el));
}

// ---- Đợt 97 Y4: đuôi ân hạn drift re-seek sau khi watch hết vì element
// tăng >= 1 frame (nợ LIMITS đợt 96 X4 §5 mục 3 — lỗ hổng c1) ----
//
// LỖ HỔNG (đo thật, c1 đợt 96, xem docs/PHASE9_ROUND96_X4_REARM_CEILING_LIMITS.md
// §3.1): watch cũ hết (element burst qua ctAtCompletion) rồi element
// stall LẠI ở ct mới; ân hạn suốt-watch của X4 không bao phủ khoảng
// trống giữa 2 watch, vì detector re-arm cần đóng băng liên tục
// >= 300 ms (PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS) mới arm watch mới,
// trong khi drift re-seek chỉ cần 2 tick liên tiếp vượt ngưỡng
// (FORWARD_RESEEK_CONFIRM_TICKS) — dưới tải (gap rAF ~200 ms) seek
// bắn ở tick thứ 2 (~400 ms sau burst), TRƯỚC khi detector kịp arm
// (~300 ms + lệch tick). c1: drift 0,68 ở t=3770, seek bắn ~t=3970,
// watch mới chỉ arm ở t≈4170 — thua đúng 1 tick.
//
// SỬA: khi khối dọn watch trong preview.tsx bỏ 1 watch VÌ element đã
// tăng >= 1 frame (decoder đã nhúc nhích — không phải vì chạm trần,
// không phải vì seeking), mở 1 "đuôi ân hạn" cho element đó: syncMedia
// coi element đang trong đuôi như đang có watch sống (grace cho drift
// re-seek — cùng tham số graceTick của shouldIssueForwardReseek).
// Đuôi ĐÓNG khi một trong ba điều xảy ra: (a) watch mới arm cho
// element đó (tập live của X4 tiếp quản — đuôi chỉ là cầu nối);
// (b) element tăng >= 1 frame ở 2 tick RIÊNG BIỆT sau khi đuôi mở
// (decoder resume ỔN ĐỊNH thật — burst 1 tick rồi đóng băng lại thì
// chỉ đếm 1, đuôi vẫn mở; phát thường thì 2 lần tăng tới sau ~2 tick
// nên đuôi là no-op, drift lúc đó vốn đã dưới ngưỡng); (c) quá trần
// cứng PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS = 5000 ms (cùng trần
// với watch — van an toàn, đuôi không bao giờ chặn seek mãi).
// Đuôi KHÔNG mở khi watch hết vì chạm trần (đường phục hồi sau trần
// PHẢI được seek ngay — xem header V2 ceilingSpent) hay vì seeking
// (seek đang bay lo). Chỉ video xuôi (watch chỉ arm cho video xuôi).
/**
 * Trần cứng đuôi ân hạn sau khi watch hết (ms). Cùng trần 5000 ms với
 * watch (PLAYHEAD_RESUME_STALL_MAX_MS) — đuôi chỉ là cầu nối tới watch
 * mới (detector arm sau <= ~300 ms + 1 gap rAF) nên 5000 ms là biên an
 * toàn rộng, không phải ngưỡng tinh chỉnh. Đổi số phải cập nhật test pin.
 */
export const PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS = 5000;

// ---- Đợt 100 B3: burst KHÔNG được tính là advance của đuôi (nợ LIMITS
// gộp đợt 99 §4 mục 4 — ca f4 tail-expiry, xem
// docs/PHASE9_ROUND100_B3_TAIL_EXPIRY_LIMITS.md §1) ----
//
// LỖ HỔNG (đo thật, f4 đợt 99, clip bóng 720p GOP 30, load4): đuôi mở
// ở ct 4,2667; element burst +1,16 s trong 1 tick (ct 4,2667 → 5,4242,
// drift +2,49 so với playhead) — luật Y4 cũ đếm burst này là advance
// #1 (chỉ cần >= 1 frame, bất kể độ lớn); tick sau element nhích thêm
// >= 1 frame → advance #2 → đuôi đóng → grace tắt → drift re-seek bắn
// ngay (resyncsV 1 → 2, ct 5,4242 → 3,5333) vào decoder còn chưa ổn
// định → seek kẹt 5,5 s+ (seeking=true, playhead đóng băng 3,5333).
// "2 advance = resume ổn" đo CHUYỂN ĐỘNG, không đo SỰ ỔN ĐỊNH: một cú
// nhảy của decoder (seek/keyframe snap) không phải decode ổn định.
//
// SỬA: một lần tăng chỉ được đếm khi tốc độ tăng của CHÍNH TICK ĐÓ nằm
// trong biên lành: rate = |Δct| / (gap tick × playbackRate) <=
// PLAYHEAD_TAIL_BURST_RATE_MAX. Decode lành tăng đúng playbackRate ×
// wall-clock (tốc độ 1× ở clip thường, 2× ở clip speed 2× — chia cho
// playbackRate nên đúng với mọi speed); burst f4 có rate 1,9–5,8×
// (gap rAF 200–600 ms dưới tải). Ngưỡng 1,5× nằm giữa tốc độ lành tối
// đa (~1,2× kể cả jitter lấy mẫu media-clock) và burst f4 thấp nhất
// (~1,9×), biên ~1,3–1,6× cả hai phía. Burst KHÔNG đếm mà còn RESET
// advances về 0 + rebase lastCt (sau cú nhảy, độ ổn định chưa biết —
// phải có 2 lần tăng lành MỚI mới được đóng đuôi); gap tick đo bằng
// lastTickMs (cập nhật MỖI lần gọi, kể cả tick đóng băng — nên mẫu số
// là đúng 1 gap rAF, không bị thời gian đóng băng trước đó làm loãng
// như khi đo từ lần tăng cuối).
//
// PHƯƠNG ÁN ĐÃ CÂN NHẮC MÀ KHÔNG CHỌN — drift-gate (chỉ đóng đuôi khi
// |drift| <= 0,35 ở tick đóng): sửa đúng ca f4 một cách xác định, nhưng
// cần target của từng element (rampSourceTimeAt theo speed — drift phải
// đo với target, không phải playhead thô) mà chỗ bước đuôi không có
// sẵn; luồn target vào đây xâm lấn hơn nhiều và dễ đụng B2/B5. Luật
// burst-rate không cần target, đúng với mọi speed qua playbackRate.
// Giới hạn thật của luật burst-rate (ghi trong LIMITS §6): burst trải
// trên 1 gap rAF dài (> ~770 ms cho +1,16 s) có rate < 1,5× nên lọt;
// và đuôi vẫn đóng sau 2 lần tăng lành dù drift còn lớn (lúc đó seek
// bắn là đúng — decoder đã ổn định, chỉ sai vị trí).
/**
 * Tốc độ tăng tối đa trong 1 tick còn tính là tăng LÀNH của đuôi
 * (lần playbackRate). Tăng nhanh hơn là burst của decoder (seek/
 * keyframe snap), không phải decode ổn định — không đếm, reset bộ đếm
 * (xem header B3). Đổi số phải cập nhật cả test pin bên dưới.
 */
export const PLAYHEAD_TAIL_BURST_RATE_MAX = 1.5;

// ---- Đợt 101 C3: drift-gate — lần tăng chỉ đếm khi element ĐÁP trong
// ngưỡng drift (nợ LIMITS gộp đợt 100 §4 mục 5 — cửa sổ f4 còn mở cho
// burst dài-gap; xem docs/PHASE9_ROUND101_C3_REARM_LIMITS.md §1) ----
//
// ĐIỂM MÙ CỦA LUẬT BURST-RATE B3 (đo thật, 11 lượt g1–g6 + f1–f5):
// burst trải trên 1 gap rAF dài có rate <= 1,5× nên vẫn đếm — g2
// (+0,97 s / 684 ms = 1,41×) và g5 (+0,90 s / 788 ms = 1,14×) đều lọt.
// Rate KHÔNG phân biệt được g5 với decode lành: lành tối đa ~1,2×
// (B3 header) còn g5 chỉ 1,14× — mọi ngưỡng rate chặn được g5 đều chặn
// oan decode lành. Thứ phân biệt được là ĐIỂM ĐÁP: sau lần tăng #1,
// drift của g2 là +1,07…+1,60 (biên do tick app ẩn giữa 2 mẫu probe)
// và g5 là +0,93…+1,40 — đều vượt xa ngưỡng drift re-seek 0,35 s —
// trong khi decode lành đáp với drift ~0. Trên 11 lượt, 7 lần đóng đuôi
// kiểu ADV2 (đủ 2 advance) thì 6 lần xảy ra khi drift trước-đóng
// > 0,35 (4 đo trực tiếp; 2 ca f4/f5-5110 drift về 0 chỉ vì resync đã
// bắn trước mẫu probe — drift trước-đóng +2,49 / +0,67); chỉ 1/7 đóng
// sạch (f2 +0,233). Nói cách khác luật Y4+B3 thường xuyên đóng đuôi
// trong lúc element còn lệch khỏi target quá ngưỡng seek — rồi drift
// re-seek bắn ngay sau đó (f4 kẹt seek 5,5 s+; f5-5110 seek 0,6 s).
//
// SỬA (luật thứ hai, độc lập với luật burst-rate): một lần tăng chỉ
// được đếm khi element ĐÁP trong ngưỡng drift — |drift| <=
// PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S ở chính tick tăng đó (drift =
// currentCt − target, do caller tính bằng rampSourceTimeAt — đúng với
// mọi speed/reverse, không phải playhead thô). Đáp xa hơn thì KHÔNG
// đếm mà reset advances về 0 + rebase lastCt, y hệt burst B3 (sau cú
// nhảy, độ ổn định chưa biết — phải có 2 lần tăng lành MỚI đáp đúng
// vị trí mới được đóng đuôi). Ngưỡng 0,35 s = đúng ngưỡng drift re-seek
// FORWARD_RESEEK_THRESHOLD_S: đuôi tồn tại để ân hạn seek khi drift
// vượt ngưỡng — đóng đuôi trong lúc drift còn vượt ngưỡng là tự phá
// mục đích của nó. Caller không truyền drift (không tìm được clip /
// caller cũ) thì gate bỏ qua — tương thích ngược như playbackRate.
//
// ĐÁNH ĐỔI (ghi rõ, không giấu): element ỔN ĐỊNH nhưng SAI vị trí
// (decode lành 1×, drift hằng 0,35–1,0) sẽ không đóng đuôi cho tới khi
// drift tự về dưới ngưỡng (element đóng băng để playhead đuổi kịp —
// như g2/g5 ngoài đời) hoặc chạm trần cứng 5000 ms — seek sửa drift
// bị hoãn tối đa tới trần. Trần cứng chặn mọi hoãn vô hạn. Ca f5-5110
// ngoài đời cho thấy phía lợi: drift tự về qua đóng băng nên gate sẽ
// TRÁNH được cả lần resync đó (không seek nào cần bắn), không chỉ hoãn
// nó. Đuôi đóng vì hasWatch (watch mới arm) hoặc quá trần thì gate
// không can thiệp — chỉ nhánh đếm advance mới bị gate.
/**
 * Drift tối đa (giây, giá trị tuyệt đối) mà một lần tăng của đuôi còn
 * được đếm là tăng lành — bằng đúng ngưỡng drift re-seek
 * FORWARD_RESEEK_THRESHOLD_S (playheadPacing.ts): đáp xa hơn ngưỡng
 * seek là chưa ổn định — không đếm, reset bộ đếm (xem header C3).
 * Đổi số phải cập nhật cả test pin bên dưới (test khóa bằng với
 * FORWARD_RESEEK_THRESHOLD_S).
 */
export const PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S = 0.35;

/** Đuôi ân hạn drift re-seek cho 1 element video sau khi watch của nó hết. */
export interface ResumeGraceTail97Y4 {
  /** Timestamp rAF (ms) lúc watch hết (khối dọn watch bỏ watch vì element tăng). */
  endedAtMs: number;
  /** Số tick RIÊNG BIỆT element đã tăng >= 1 frame kể từ khi đuôi mở. */
  advances: number;
  /** currentTime lúc element tăng >= 1 frame lần cuối (giây). */
  lastCt: number;
  /**
   * Đợt 100 B3 — timestamp rAF (ms) của lần bước đuôi TRƯỚC (để tính
   * gap tick cho luật burst-rate; cập nhật mỗi lần gọi, kể cả tick
   * đóng băng). Tùy chọn để đuôi cũ (không có trường này) vẫn chạy:
   * thiếu thì dùng endedAtMs làm mốc (xem nextResumeGraceTail97Y4).
   */
  lastTickMs?: number;
}

export interface ResumeGraceTailInput {
  /** Vòng lặp có đang phát không (chỉ theo dõi khi playing). */
  playing: boolean;
  /** Timestamp rAF của tick hiện tại (ms). */
  nowMs: number;
  /** currentTime hiện tại của element đang theo dõi (giây). */
  currentCt: number;
  /** Độ dài 1 frame (giây) — 1/fps của project. */
  frameDur: number;
  /** Element đã có watch resume-stall đang mở chưa (đuôi đóng khi có watch mới). */
  hasWatch: boolean;
  /** Đuôi đang mở của element này. */
  tail: ResumeGraceTail97Y4;
  /**
   * Đợt 100 B3 — playbackRate của element (mặc định 1). Luật
   * burst-rate chia tốc độ tăng cho playbackRate nên đúng với mọi
   * speed của clip (xem header B3).
   */
  playbackRate?: number;
  /**
   * Đợt 101 C3 — drift hiện tại của element (giây) = currentCt −
   * target (target = rampSourceTimeAt của clip, do caller tính — đúng
   * với mọi speed/reverse). Luật drift-gate chỉ đếm lần tăng đáp trong
   * ngưỡng (xem header C3). Không truyền (undefined) = không biết
   * drift → bỏ qua gate, chạy như B3 (tương thích ngược).
   */
  drift?: number;
}

export interface ResumeGraceTailResult {
  /** Đuôi mới để caller lưu cho tick sau (null = đuôi đã đóng). */
  tail: ResumeGraceTail97Y4 | null;
  /**
   * Đợt 100 B3 — true = tick này vừa chặn 1 burst (tăng quá nhanh,
   * không đếm, reset advances — xem header B3). Caller đếm để probe
   * đo trực tiếp; false/undefined = tick bình thường.
   */
  burstBlocked?: boolean;
  /**
   * Đợt 101 C3 — true = tick này vừa chặn 1 lần tăng đáp xa (tăng
   * lành về tốc độ nhưng |drift| > PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S
   * — xem header C3). Không đếm, reset advances (như burstBlocked).
   * Caller đếm để probe đo trực tiếp.
   */
  driftGateBlocked?: boolean;
}

/**
 * Một bước theo dõi đuôi ân hạn cho 1 element video xuôi (Đợt 97 Y4).
 * Thuần, không chạm DOM — caller (preview.tsx) đọc currentTime thật và
 * truyền vào; caller mở đuôi khi dọn watch vì element tăng, dọn đuôi
 * khi dừng phát (cùng chỗ dọn resumeWatches91S2).
 *
 * - Không phát hoặc đã có watch mới → đóng đuôi (watch sống tiếp quản).
 * - Quá trần cứng 5000 ms kể từ lúc watch hết → đóng (van an toàn).
 * - Tăng >= 1 frame kể từ lần tăng cuối → đếm 1 lần tăng; đủ 2 lần
 *   tăng ở 2 tick riêng biệt → decoder resume ổn định → đóng đuôi.
 *   Đợt 100 B3 — NGOẠI LỆ burst: tăng quá nhanh trong CHÍNH tick này
 *   (rate = |Δct| / (gap tick × playbackRate) > PLAYHEAD_TAIL_BURST_RATE_MAX)
 *   thì KHÔNG đếm mà reset advances về 0 + rebase lastCt (cú nhảy của
 *   decoder không chứng minh decode ổn định — ca f4 đợt 99: burst
 *   +1,16 s bị đếm là advance #1 rồi đuôi đóng ngay tick sau, drift
 *   re-seek bắn vào decoder chưa ổn định, seek kẹt 5,5 s+).
 *   Đợt 101 C3 — NGOẠI LỆ đáp xa: tăng lành về tốc độ nhưng đáp với
 *   |drift| > PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S (caller truyền drift)
 *   thì cũng KHÔNG đếm mà reset advances về 0 + rebase lastCt (xem
 *   header C3 — burst dài-gap g2/g5 lọt luật rate vì rate chỉ 1,14–
 *   1,41×, nhưng đáp với drift +0,93…+1,60 nên gate này chặn được).
 * - Còn lại (đóng băng < 1 frame) → giữ đuôi mở.
 * - Trừ 1e-9 s để biên đúng-1-frame không bị sai số float (như
 *   shouldHoldForResumeStall / nextResumeFreezeRearm).
 * - lastTickMs cập nhật MỖI lần gọi (kể cả tick đóng băng / burst /
 *   đóng đuôi — đuôi đóng thì không còn ai đọc nữa) để gap tick luôn
 *   là đúng 1 gap rAF, không bị thời gian đóng băng làm loãng.
 */
export function nextResumeGraceTail97Y4(
  input: ResumeGraceTailInput,
): ResumeGraceTailResult {
  const { playing, nowMs, currentCt, frameDur, hasWatch, tail } = input;
  // Đợt 100 B3 — playbackRate để chuẩn hóa tốc độ tăng (clip speed 2×
  // tăng lành 2× wall-clock; thiếu thì mặc định 1 như trước).
  const playbackRate = input.playbackRate !== undefined && input.playbackRate > 0 ? input.playbackRate : 1;
  // Đợt 100 B3 — mốc tick trước để tính gap tick; đuôi cũ không có
  // lastTickMs thì dùng endedAtMs (lần bước đầu sau khi đuôi mở, gap
  // ≈ 1 tick sau khi watch hết).
  const prevTickMs = tail.lastTickMs ?? tail.endedAtMs;
  if (!playing || hasWatch) return { tail: null };
  if (nowMs - tail.endedAtMs > PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS) return { tail: null };
  if (Math.abs(currentCt - tail.lastCt) >= frameDur - 1e-9) {
    // Đợt 100 B3 — luật burst-rate: tăng quá nhanh trong chính tick này
    // thì không phải decode ổn định (xem header B3). Gap <= 0 (cùng
    // timestamp — không đo được tốc độ) thì đếm như cũ, không chặn oan.
    const gapS = (nowMs - prevTickMs) / 1000;
    if (gapS > 0) {
      const rate = Math.abs(currentCt - tail.lastCt) / (gapS * playbackRate);
      if (rate > PLAYHEAD_TAIL_BURST_RATE_MAX) {
        return {
          tail: { ...tail, advances: 0, lastCt: currentCt, lastTickMs: nowMs },
          burstBlocked: true,
        };
      }
    }
    // Đợt 101 C3 — luật drift-gate: tăng lành về tốc độ nhưng đáp xa
    // khỏi target (|drift| > ngưỡng drift re-seek) thì chưa ổn định —
    // không đếm, reset advances + rebase lastCt như burst (xem header
    // C3). Drift không truyền (undefined) thì bỏ qua gate (tương thích
    // ngược). Kiểm SAU luật rate: burst vừa nhanh vừa đáp xa báo
    // burstBlocked (luật cũ giữ nguyên), chỉ lần tăng lành-về-tốc-độ
    // mà đáp xa mới báo driftGateBlocked.
    if (
      input.drift !== undefined &&
      Math.abs(input.drift) > PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S
    ) {
      return {
        tail: { ...tail, advances: 0, lastCt: currentCt, lastTickMs: nowMs },
        driftGateBlocked: true,
      };
    }
    const advances = tail.advances + 1;
    if (advances >= 2) return { tail: null };
    return { tail: { ...tail, advances, lastCt: currentCt, lastTickMs: nowMs } };
  }
  return { tail: { ...tail, lastTickMs: nowMs } };
}

/**
 * Có nên đóng băng playhead ở tick này không? Thuần, không chạm DOM.
 *
 * - Không phát hoặc không còn seeking → không giữ; reset trạng thái để
 *   lần seek sau giữ lại được từ đầu (kể cả khi lần trước đã chạm trần).
 * - Đang seeking mà lần giữ trước đã chạm trần (capReleased) → KHÔNG giữ
 *   nữa cho tới khi seeking về false (tránh giữ-nhả-giữ liên tục làm
 *   trần vô nghĩa — xem header).
 * - Lần giữ mới bắt đầu khi holdingSinceMs === null (ghi mốc nowMs).
 * - Giữ liên tục vượt PLAYHEAD_HOLD_MAX_MS → nhả + latch capReleased.
 */
export function shouldHoldPlayheadWhileSeeking(
  input: PlayheadHoldInput,
): PlayheadHoldDecision {
  const { playing, seekingPrevTick, nowMs, state } = input;
  // Đợt 90 R2 (a2) — cạnh lên nút Phát giữ như đang seeking: tick này
  // syncMedia sắp forceSeek nên playhead không được tăng trước (xem
  // header 1b). Không cần phân biệt nguồn giữ ở các nhánh dưới.
  const seeking = seekingPrevTick || input.forceSeekEdge === true;
  if (!playing || !seeking) {
    return { hold: false, state: { holdingSinceMs: null, capReleased: false } };
  }
  if (state.capReleased) {
    return { hold: false, state };
  }
  if (state.holdingSinceMs === null) {
    return { hold: true, state: { holdingSinceMs: nowMs, capReleased: false } };
  }
  if (nowMs - state.holdingSinceMs > PLAYHEAD_HOLD_MAX_MS) {
    return {
      hold: false,
      state: { holdingSinceMs: state.holdingSinceMs, capReleased: true },
    };
  }
  return { hold: true, state };
}
