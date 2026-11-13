// playheadPacing.ts — Pacing phát XUÔI cho vòng lặp preview
// (Phase 9 đợt 29, luồng L2).
//
// BUG GỐC (phát hiện đợt 28 L2, xem
// docs/PHASE9_ROUND28_L2_REVERSE_LIMITS.md §2.3): vòng lặp phát xuôi
// cũ gọi `setPlayhead(playhead + dt)` mỗi tick rAF, mà setPlayhead
// snap bằng Math.round về frame gần nhất (timebase.ts). Ở 30 fps,
// 1 tick rAF ~16.7 ms = ĐÚNG nửa frame, nên tick nào dt >= nửa frame
// cũng bước NGUYÊN 1 frame (33.3 ms), tick nào dt nhỏ hơn thì bước 0.
// Đo được trên Chromium thật: playhead +7.167 s / 6.189 s wall =
// 1.158× wall, trong khi Σdt của vòng lặp ≈ wall (1.012×) — tức dt
// không sai, chỉ snap làm tròn gây bước thừa tích lũy. Độ lệch
// (playhead − currentTime element, element chạy đúng 1.00×) tích lũy
// ~0.25 s mỗi giây wall → chạm ngưỡng drift-seek 0.35 s của syncMedia
// sau mỗi ~1.2–1.4 s → drift-seek chu kỳ → trên GOP thưa mỗi seek làm
// decoder giải mã lại từ keyframe → cụm hold 3–29 tick → ~40–54 hold
// mỗi pass. Sửa đúng là ở vòng lặp phát xuôi, không phải ở decoder.
//
// SỬA (chỉ vòng lặp phát xuôi trong preview.tsx dùng 2 hàm này):
// tích lũy dt rồi chỉ bước NGUYÊN frame khi đủ — đúng nguyên tắc
// reverseStep đã dùng cho chiều ngược từ đợt 27 K4, chỉ đổi chiều.
// Hệ quả:
// - Tốc độ playhead trung bình = wall-clock đúng tới < 1 frame sai số
//   (sai số tích lũy bị chặn bởi 1 frame, không tăng theo thời gian),
//   thay vì thiên vị lên ở biên nửa frame như Math.round.
// - Tick chưa đủ 1 frame thì KHÔNG gọi setPlayhead: playhead đứng yên
//   trên lưới frame thay vì bị snap nhảy sớm 1 frame.
// - setPlayhead vẫn snap kết quả về lưới frame như cũ (scrub/trim vẫn
//   cần snap gần nhất — KHÔNG đổi ngữ nghĩa setPlayhead toàn cục).
//   Playhead khi bắt đầu phát thường đã nằm trên lưới (mọi setPlayhead
//   đều snap), nên bước nguyên frame giữ đúng lưới, snap là đồng nhất.
//   Trường hợp hiếm playhead lệch lưới lúc bắt đầu phát (vd duration
//   không chia hết cho frame): bước đầu có thể bị snap dịch tối đa
//   nửa frame MỘT LẦN, không tích lũy — sau đó khóa lưới như thường.
//
// KHÔNG đổi: setPlayhead trong store.ts, snapToFrame trong timebase.ts,
// vòng lặp phát ngược (reverseStep/reversePlayhead giữ nguyên).

/**
 * Đợt 53 J5 — trần dt cho vòng lặp preview (thay số 0,1 s hardcode cũ
 * trong preview.tsx: `Math.min(0.1, ...)`).
 *
 * Vì sao 0,1 s là bug khi FPS thấp (đo thật, xem LIMITS đợt 53 J5):
 * playhead chỉ được cộng tối đa 0,1 s mỗi tick; khi FPS ~1,5 (tick
 * cách nhau ~0,67 s wall) playhead chỉ tiến ~0,15× thời gian thật,
 * trong khi element audio/video phát đúng tốc độ thật — drift vượt
 * ngưỡng 0,35 s của syncMedia sau mỗi ~0,4 s nên element bị seek
 * NGƯỢC về playhead liên tục (đếm được qua __vcutSyncReseeks).
 *
 * Trần mới 2 s: bao được mọi gap scheduling quan sát được trên VM này
 * (I9: tick dài nhất 1096 ms wall) để playhead bám đúng wall-clock;
 * gap phi lý (ngủ máy / tab ẩn lâu) vẫn bị chặn ở 2 s thay vì nhảy tới
 * cuối timeline. Trường hợp tab ẩn trong lúc đang phát được đóng riêng
 * bằng cách reset `last` trong onVisible của preview.tsx (không còn dt
 * khổng lồ sau khi hiện tab lại). forwardStep/reverseStep không đổi —
 * dt lớn thì bước bù nhiều frame để bắt kịp wall, đúng ngữ nghĩa cũ
 * của chúng ("bước bù nhiều frame để bắt kịp wall" — xem chú thích
 * đầu file).
 */
export const PREVIEW_DT_CAP_S = 2;

/**
 * Kẹp dt (giây) của 1 tick preview về [0, PREVIEW_DT_CAP_S].
 * dt <= 0 (đồng hồ lùi / tick trùng) → 0 bước, giữ nguyên accumulated.
 */
export function clampPreviewDt(dt: number): number {
  if (!(dt > 0)) return 0;
  return Math.min(dt, PREVIEW_DT_CAP_S);
}

/**
 * Đợt 54 K9 — chặn nhịp + deadband cho nhánh FORWARD của syncMedia
 * (preview.tsx), mirror 2 luật pacing mà nhánh reverse đã có từ
 * đợt 28 L2 (`shouldIssueStepSeek` + `justCompletedSeek`).
 *
 * NGUYÊN NHÂN GỐC (đo thật, xem
 * docs/PHASE9_ROUND54_K9_AUDIO_RESEEK_LIMITS.md §2): nhánh forward cũ
 * phát seek lại ngay khi |currentTime − target| > 0,35 s mà KHÔNG kiểm
 * tra `el.seeking`. Dưới tải CPU, một seek audio mất nhiều tick mới
 * xong; trong lúc seek còn bay, `currentTime` đóng băng ở target cũ
 * (Chromium trả target của seek đang bay) trong khi playhead vẫn tiến
 * → drift lại vượt 0,35 s → phát seek MỚI chồng lên seek cũ → decoder
 * khởi động lại, seek cũ không bao giờ hoàn tất. Đo được: audio
 * re-seek 11–12/lượt (8 s), element AUDIO ở trạng thái seeking trong
 * 30–40% số mẫu, trong khi lag lấy mẫu không bao giờ vượt 0,35 s —
 * các lần seek kích hoạt bởi spike thoáng qua giữa các mẫu, không phải
 * drift tăng đều. Đúng mẫu bệnh L2 đã gặp ở nhánh reverse (410/426
 * seek bị thay thế trước khi hoàn tất).
 *
 * Luật mới (3 lớp, cùng 1 quyết định thuần để unit-test được):
 *  1) Đang seeking → KHÔNG phát seek mới (chờ seek cũ hoàn tất).
 *  2) Tick vừa hoàn tất seek → KHÔNG phát seek mới (để currentTime
 *     ổn định 1 tick; frame/tiếng vừa xong được dùng thay vì bị seek
 *     tiếp đè ngay — cùng lý do "cửa sổ vẽ ở tick hoàn tất" của L2).
 *  3) Drift phải vượt ngưỡng 2 tick LIÊN TIẾP mới seek (lọc jitter
 *     1 tick: currentTime lấy mẫu giữa chừng / đồng hồ media giật).
 *  Drift thật tăng đều vẫn seek, chỉ chậm tối đa 1 tick so với cũ.
 *  forceSeek (cạnh lên của nút Phát) đi đường riêng, không qua đây.
 *
 * Giới hạn trung thực: nếu seek chậm tới mức sau khi hoàn tất, element
 * đã tụt sau playhead hơn ngưỡng (seek mất > 0,35 s dưới tải nặng),
 * luật này vẫn seek lại — chỉ khác là mỗi seek đều HOÀN TẤT thay vì
 * bị restart. Số re-seek khi đó phản ánh đúng độ trễ seek, không còn
 * bị bơm phồng bởi seek chồng.
 */

/** Ngưỡng drift (giây) của nhánh forward — giữ đúng số 0,35 s cũ. */
export const FORWARD_RESEEK_THRESHOLD_S = 0.35;

/** Số tick liên tiếp drift vượt ngưỡng mới phát seek lại. */
export const FORWARD_RESEEK_CONFIRM_TICKS = 2;

export interface ForwardReseekDecision {
  /** true = phát seek lại tới target ở tick này. */
  seek: boolean;
  /**
   * Số tick liên tiếp drift vượt ngưỡng TÍNH TỚI tick này (caller lưu
   * lại vào WeakMap theo element, truyền lại ở tick sau). Reset về 0
   * khi seek, khi đang seeking, khi vừa hoàn tất seek, hoặc khi drift
   * đã về dưới ngưỡng — chỉ đếm chuỗi vượt ngưỡng không đứt đoạn.
   */
  overCount: number;
}

/**
 * Có nên phát seek lại ở nhánh forward không?
 * @param seeking `el.seeking` ở tick này (seek cũ còn đang bay).
 * @param justCompletedSeekTick tick này seek có vừa hoàn tất không
 *   (`wasSeeking && !seeking`, như nhánh reverse).
 * @param driftAbs |currentTime − target| (giây) ở tick này.
 * @param overCount số tick liên tiếp drift đã vượt ngưỡng trước tick
 *   này (0 = tick trước drift dưới ngưỡng / vừa seek xong).
 * @param threshold ngưỡng drift (mặc định 0,35 s).
 * @param confirmTicks số tick liên tiếp vượt ngưỡng mới seek
 *   (mặc định 2).
 * @param graceTick Đợt 95 W5 — true = detector re-arm vừa arm watch
 *   mới cho element này Ở CÙNG TICK (xem nextResumeFreezeRearm /
 *   preview.tsx): khoan kích seek lại 1 tick để playhead đã giữ kịp
 *   đuổi theo element. Khi drift đã đủ số tick xác nhận mà graceTick
 *   bật thì KHÔNG seek tick này mà trả overCount = confirmTicks − 1 —
 *   tick sau (không còn grace) drift vẫn vượt thì seek ngay, đúng
 *   trễ 1 tick; nếu element resume trong tick ân hạn và drift về dưới
 *   ngưỡng thì không seek nữa (overCount reset về 0 như thường).
 *   Chỉ có tác dụng đúng tick arm (caller chỉ set cho element vừa
 *   arm); mọi tick khác hành vi giữ nguyên như cũ.
 */
export function shouldIssueForwardReseek(
  seeking: boolean,
  justCompletedSeekTick: boolean,
  driftAbs: number,
  overCount: number,
  threshold: number = FORWARD_RESEEK_THRESHOLD_S,
  confirmTicks: number = FORWARD_RESEEK_CONFIRM_TICKS,
  graceTick = false,
): ForwardReseekDecision {
  if (seeking || justCompletedSeekTick) return { seek: false, overCount: 0 };
  if (!(driftAbs > threshold)) return { seek: false, overCount: 0 };
  const next = (Number.isFinite(overCount) && overCount > 0 ? Math.floor(overCount) : 0) + 1;
  if (next >= confirmTicks) {
    // Đợt 95 W5 — ân hạn 1 tick sau re-arm: hoãn seek, giữ đếm ở
    // confirmTicks − 1 để tick sau seek ngay nếu drift vẫn vượt.
    if (graceTick) return { seek: false, overCount: confirmTicks - 1 };
    return { seek: true, overCount: 0 };
  }
  return { seek: false, overCount: next };
}

/**
 * Đợt 55 L6 — catch-up bằng playbackRate cho nhánh FORWARD của syncMedia
 * (preview.tsx), chỉ element AUDIO.
 *
 * NGUYÊN NHÂN GỐC (đo thật, xem
 * docs/PHASE9_ROUND55_L6_AUDIO_DRIFT_ROOT_LIMITS.md §2): đồng hồ audio
 * của Chromium chạy CHẬM ĐỀU ~0,47–0,57× wall-clock dưới tải CPU trên
 * VM này (đo bằng sampler 50 ms: audio currentTime ngoài seek tiến
 * 0,47–0,57×, AudioContext thăm dò độc lập cũng 0,47–0,53× — cùng một
 * đồng hồ audio bị đói CPU, element chỉ bám theo nó, không phải lỗi
 * decoder). Playhead tiến ~1× wall (có nhảy bù sau gap rAF) nên lag
 * tăng đều ~0,44–0,47 s/s → chạm ngưỡng seek 0,35 s sau mỗi ~0,6–0,9 s
 * → audio re-seek 7–8/lượt. Đây là LỖI TỐC ĐỘ (rate error), không phải
 * spike thoáng qua như K9 suy ra — nên bù bằng TỐC ĐỘ (playbackRate)
 * mới đúng cơ chế, thay vì seek (seek chỉ nhảy cóc vị trí).
 *
 * Cơ chế: tốc độ tiến của media time = tốc độ render của audio thread
 * × playbackRate (mỗi mẫu output tương ứng playbackRate mẫu media).
 * Khi audio thread chỉ render được 0,5×, đặt rate 1,5× thì media time
 * tiến ~0,75× thay vì 0,5× → lag tăng chậm lại, seek thưa ra. Đặt
 * rate càng cao càng bù được nhiều, nhưng tempo càng lệch (dù
 * preservesPitch giữ cao độ, nhạc/lời 1,5× vẫn nghe rõ là nhanh hơn)
 * và WSOLA time-stretch tốn thêm CPU — đúng thứ đang thiếu. Vì vậy
 * rate chỉ bù TỈ LỆ với drift (drift càng lớn càng bù mạnh, tối đa
 * +50%) và chỉ trong vùng drift (0,08, 0,35] — dưới 0,08 s thì không
 * đáng bù, trên 0,35 s thì seek như cũ. Drift âm (audio chạy trước)
 * thì CHẬM lại tối đa −15% để playhead đuổi kịp.
 *
 * Đối chiếu §3.4 K9 (vì sao K9 chưa làm): (a) K9 cho rằng drift là
 * "đóng băng theo cơn" — đo 50 ms của L6 bác bỏ: drift tăng ĐỀU
 * 0,44–0,47 s/s, 90% bước tiến audio ở vùng chậm (rate 0,1–0,7), 0 cơn
 * đóng băng ≥ 150 ms; (b) "playbackRate bị gán lại mỗi tick" — luật
 * này được cài ĐÚNG chỗ gán đó (syncMedia, cùng 1 nơi duy nhất gán
 * playbackRate), không có vòng điều khiển thứ hai; (c) "chưa đo trên
 * máy thật" — vẫn đúng, drift này có thể chỉ tồn tại trên VM tải nặng
 * (xem LIMITS §5): rate bù chỉ có tác dụng khi đồng hồ audio chậm,
 * trên máy thật audio 1× thì drift < 0,08 s nên luật này là no-op.
 */

/** Drift (giây) bắt đầu bù rate — dưới mức này thì không đáng bù. */
export const FORWARD_CATCH_UP_START_S = 0.08;

/** Phần bù rate tối đa (tỉ lệ): rate tối đa = speed × (1 + 0,5). */
export const FORWARD_CATCH_UP_MAX_EXTRA = 0.5;

/** Phần chậm lại tối đa khi audio chạy trước playhead (tỉ lệ). */
export const FORWARD_CATCH_UP_MAX_SLOW = 0.15;

/**
 * playbackRate nên gán cho element AUDIO ở tick này (nhánh forward).
 * @param speed clip.speed (tốc độ hiệu ứng của clip, thường 1).
 * @param driftSigned target − currentTime (giây): dương = audio tụt sau.
 * @param seeking el.seeking ở tick này (seek cũ còn bay).
 * @param justCompletedSeekTick tick này seek có vừa hoàn tất không.
 * @param maxExtra phần bù tối đa (mặc định FORWARD_CATCH_UP_MAX_EXTRA).
 */
export function forwardCatchUpRate(
  speed: number,
  driftSigned: number,
  seeking: boolean,
  justCompletedSeekTick: boolean,
  maxExtra: number = FORWARD_CATCH_UP_MAX_EXTRA,
): number {
  if (!(speed > 0) || !Number.isFinite(speed)) return 1;
  if (seeking || justCompletedSeekTick) return speed;
  if (!Number.isFinite(driftSigned)) return speed;
  if (driftSigned > FORWARD_RESEEK_THRESHOLD_S || driftSigned < -FORWARD_RESEEK_THRESHOLD_S) return speed;
  if (Math.abs(driftSigned) <= FORWARD_CATCH_UP_START_S) return speed;
  if (driftSigned > 0) {
    // Bù tỉ lệ (gain 1,5/s): drift 0,1 → 1,15×; 0,2 → 1,3×;
    // ≥ 0,33 → trần 1 + maxExtra.
    const extra = Math.min(maxExtra > 0 ? maxExtra : 0, driftSigned * 1.5);
    return speed * (1 + extra);
  }
  const slow = Math.max(-FORWARD_CATCH_UP_MAX_SLOW, driftSigned);
  return speed * (1 + slow);
}

/** Kết quả một bước tích lũy thời gian cho phát xuôi. */
export interface ForwardStepResult {
  /** Số frame nguyên đã đủ để bước tới (0 = chưa đủ một frame). */
  steps: number;
  /** Phần dư (< 1 frame) giữ lại cho tick sau. */
  accumulated: number;
}

/**
 * Tích lũy dt (giây, đã clamp như vòng lặp preview) vào bộ đếm và trả về
 * số frame nguyên cần bước tới. Dùng floor nên KHÔNG BAO GIỜ bước thừa
 * vì làm tròn ở biên nửa frame: mỗi frame của timeline được hiện đúng
 * 1 lần theo nhịp wall-clock (trừ khi tab lag — khi đó bước bù nhiều
 * frame để bắt kịp wall, giống hành vi cũ nhưng có chặn trên bởi dt).
 * accumulated âm hoặc dt <= 0 → 0 bước, giữ nguyên accumulated (đã clamp).
 */
export function forwardStep(
  accumulated: number,
  dt: number,
  frameDur: number,
): ForwardStepResult {
  if (!(frameDur > 0) || !(dt > 0)) return { steps: 0, accumulated };
  const total = accumulated + dt;
  const steps = Math.floor(total / frameDur);
  return { steps, accumulated: total - steps * frameDur };
}

/** Kết quả bước tới playhead. */
export interface ForwardPlayheadResult {
  /** Playhead mới (<= duration khi chạm cuối). */
  t: number;
  /** true khi đã chạm cuối timeline (vòng lặp phải dừng phát). */
  reachedEnd: boolean;
}

/**
 * Tiến playhead đúng `steps` frame. Truyền đúng bội số frameDur nên khi
 * playhead đang trên lưới frame thì kết quả vẫn trên lưới và setPlayhead
 * snap thành đồng nhất (không lệch tích lũy). Chạm duration thì dừng
 * (không quấn về đầu — nhánh phát lại từ đầu thuộc về togglePlay).
 */
export function forwardPlayhead(
  playhead: number,
  steps: number,
  frameDur: number,
  duration: number,
): ForwardPlayheadResult {
  if (steps <= 0 || !(frameDur > 0)) return { t: playhead, reachedEnd: false };
  const t = playhead + steps * frameDur;
  if (Number.isFinite(duration) && t >= duration) {
    return { t: duration, reachedEnd: true };
  }
  return { t, reachedEnd: false };
}
