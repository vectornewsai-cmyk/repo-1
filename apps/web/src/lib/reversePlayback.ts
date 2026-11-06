// reversePlayback.ts — Logic thuần cho phát ngược ở preview
// (Phase 9 đợt 27, luồng K4).
//
// Hai dạng "phát ngược" trong VCut:
//  (a) Phát ngược TOÀN CỤC: playhead chạy lùi theo từng frame của project
//      (fps trong spec.meta). HTMLVideoElement không phát ngược được nên
//      mọi element đều giữ paused và được seek tới target từng frame
//      (như clip reverse đã làm từ Phase 7 P1, nhưng áp cho TẤT CẢ clip).
//      Audio khi phát ngược bị mute hoàn toàn: Web Audio không phát
//      ngược đồng bộ được, và giả vờ phát xuôi lệch hình còn tệ hơn im.
//  (b) Clip reverse (clip.reverse): playhead vẫn tiến, nhưng source của
//      clip chạy ngược — syncMedia đã seek-stepping từ Phase 7, chỉ có
//      điều drawVideoClip trước đợt này vẫn skip vì element paused
//      (xem holdFrame.ts: cờ stepping sửa đúng chỗ đó).
//
// File này chỉ chứa hàm thuần (không DOM, không React) để unit-test
// được bằng Node type-stripping; phần nối vào vòng lặp preview, syncMedia
// và drawVideoClip nằm trong preview.tsx, phần trạng thái nằm trong
// store.ts (reversePlayback + toggleReversePlayback).

/** Số frame tối đa lệch cho phép khi coi element đã seek đúng target. */
export const REVERSE_SEEK_TOLERANCE_FRAMES = 0.5;

/**
 * Số giây timeline tối đa một frame giữ được coi là "tươi". Vượt quá thì
 * frame vẫn được GIỮ (quay lại đen còn tệ hơn), nhưng được đánh dấu stale
 * để thống kê/badge báo rõ — xem holdStale + PHASE9_ROUND27_K4_LIMITS.md.
 */
export const MAX_HOLD_AGE_SEC = 3;

/** Kết quả một bước tích lũy thời gian cho phát ngược. */
export interface ReverseStepResult {
  /** Số frame nguyên đã đủ để bước lùi (0 = chưa đủ một frame). */
  steps: number;
  /** Phần dư (< 1 frame) giữ lại cho tick sau. */
  accumulated: number;
}

/**
 * Tích lũy dt (giây, đã clamp như vòng lặp preview) vào bộ đếm và trả về
 * số frame nguyên cần bước lùi. Dùng floor nên KHÔNG BAO GIỜ skip frame
 * hay lặp frame vì làm tròn: mỗi frame của timeline được hiện đúng 1 lần
 * (trừ khi seek chưa kịp — khi đó tầng vẽ hold frame cũ, xem LIMITS).
 * accumulated âm hoặc dt <= 0 → 0 bước, giữ nguyên accumulated (đã clamp).
 */
export function reverseStep(
  accumulated: number,
  dt: number,
  frameDur: number,
): ReverseStepResult {
  if (!(frameDur > 0) || !(dt > 0)) return { steps: 0, accumulated };
  const total = accumulated + dt;
  const steps = Math.floor(total / frameDur);
  return { steps, accumulated: total - steps * frameDur };
}

/** Kết quả bước lùi playhead. */
export interface ReversePlayheadResult {
  /** Playhead mới (>= 0). */
  t: number;
  /** true khi đã chạm đầu timeline (vòng lặp phải dừng phát). */
  reachedStart: boolean;
}

/**
 * Lùi playhead đúng `steps` frame. setPlayhead của store sẽ snap lại về
 * lưới frame nên truyền đúng bội số frameDur là đủ để snap thành đồng
 * nhất (không lệch tích lũy). Chạm 0 thì dừng (không quấn về cuối).
 */
export function reversePlayhead(
  playhead: number,
  steps: number,
  frameDur: number,
): ReversePlayheadResult {
  if (steps <= 0 || !(frameDur > 0)) return { t: playhead, reachedStart: false };
  const t = playhead - steps * frameDur;
  if (t <= 0) return { t: 0, reachedStart: true };
  return { t, reachedStart: false };
}

/**
 * Frame giữ đã cũ chưa? firstHeldT = playhead lúc bắt đầu giữ (null =
 * chưa từng giữ trong đợt này). Tuổi đo bằng KHOẢNG CÁCH playhead đã
 * đi khỏi điểm bắt đầu giữ (|t - firstHeldT|) nên đúng cả phát xuôi
 * (t tăng) lẫn phát ngược (t giảm). Trả về false khi chưa giữ hoặc
 * tuổi chưa vượt ngưỡng — tầng gọi vẫn giữ hình, chỉ báo stale khi true.
 */
export function holdStale(
  firstHeldT: number | null,
  t: number,
  maxAgeSec: number = MAX_HOLD_AGE_SEC,
): boolean {
  if (firstHeldT === null) return false;
  return Math.abs(t - firstHeldT) > maxAgeSec;
}

/**
 * Đợt 28 L2: có nên phát seek stepping mới không?
 *
 * Bối cảnh đo được (syncDbg đợt 28 L2, GOP thưa, phát ngược): 410/426
 * seek được phát TRONG LÚC seek trước còn đang bay (seeking = true),
 * mỗi lần với target mới (playhead bước 1 frame mỗi 2 tick, seek cũ
 * chưa kịp hoàn tất đã bị thay thế) → decoder khởi động lại từ keyframe
 * liên tục, không seek nào hoàn tất → hình kẹt 8.5 s, chỉ ~1.3 fps
 * hiển thị. Luật pacing: khi element đang seeking thì KHÔNG phát seek
 * mới — chờ seek cũ hoàn tất rồi mới seek tới target hiện tại (các frame
 * trung gian bị bỏ qua cho hiển thị, nhưng mỗi frame hiển thị đều gần
 * playhead hiện tại thay vì kẹt vô hạn). Khi không seeking thì giữ đúng
 * điều kiện cũ (|currentTime - target| > eps mới seek).
 */
export function shouldIssueStepSeek(
  seeking: boolean,
  currentTime: number,
  target: number,
  eps: number,
): boolean {
  if (seeking) return false;
  return Math.abs(currentTime - target) > eps;
}

/**
 * Đợt 28 L2: độ lệch tối đa (giây timeline) mà một frame đã seek xong
 * vẫn được vẽ trong chế độ stepping dù chưa khớp playhead trong nửa
 * frame. Lý do đo được: trên GOP thưa, một seek hoàn tất sau ~0.5–1 s
 * (giải mã từ keyframe), trong lúc đó playhead đã lùi xa > 0.5 frame
 * nên guard nửa frame cũ (K4) chặn MỌI draw → hình kẹt 8.5 s dù seek
 * vẫn hoàn tất đều. Vẽ frame đã seek xong (lag ≤ 2 s, luôn mới hơn
 * frame giữ cũ vì target stepping đơn điệu) tốt hơn giữ hình cũ nhiều
 * giây. Vượt 2 s thì vẫn hold — không mạo nhận frame quá cũ là frame
 * tại t. Đây là đánh đổi sản phẩm có chủ ý, không phải hằng số vật lý.
 */
export const MAX_STEP_DRAW_LAG_SEC = 2;

/**
 * Stepping có được vẽ element trực tiếp không?
 * - Khớp nửa frame (guard K4 cũ) → vẽ.
 * - Seek đã xong (!seeking) + frame đã giải mã (tầng gọi đã kiểm tra
 *   readyState >= 2 qua decideVideoFrame) + lệch ≤ MAX_STEP_DRAW_LAG_SEC
 *   → vẽ (frame mới nhất đã có, lag có giới hạn, có ghi rõ trong LIMITS).
 * - Đang seeking mà lệch > nửa frame → không vẽ (frame trên element vẫn
 *   là frame trước seek, mạo nhận là sai vị trí).
 * - Lệch > 2 s (vd lúc mới bật ngược, element còn ở frame cũ cách xa
 *   target) → không vẽ, hold như cũ.
 */
export function stepDrawAllowed(
  seeking: boolean,
  currentTime: number,
  target: number,
  fps: number,
): boolean {
  if (seekOnTarget(currentTime, target, fps)) return true;
  if (seeking) return false;
  return Math.abs(currentTime - target) <= MAX_STEP_DRAW_LAG_SEC;
}

/**
 * Đợt 39 T6: vẽ ở tick vừa hoàn tất seek — bypass có giới hạn cho
 * stepDrawAllowed, chỉ áp đúng tick seek vừa xong (justCompleted).
 *
 * Lý do đo được (file GOP thưa 420 MB, baseline đợt 39): mỗi seek bay
 * 1,2–6,8 s trong khi playhead vẫn lùi ~0,87× realtime, nên lag lúc
 * seek xong thường là 2,2–4,9 s — vượt guard 2 s → 4 lần seek xong
 * liên tiếp đều bị chặn, frame đầu tới sau 17,8 s, cả 20 s chỉ 2 draw.
 * Frame trên element ở tick này CHÍNH LÀ frame của seek vừa xong
 * (target lúc phát seek, đơn điệu theo chiều ngược), không phải frame
 * cũ mạo nhận: lag chỉ đo playhead đã chạy trong lúc seek bay, không
 * đo độ sai vị trí của frame. Vẽ nó thì chuỗi ngược hiện đúng thứ tự,
 * chỉ chậm hơn realtime theo tốc độ seek; chặn nó thì kẹt nền.
 * Guard 2 s vẫn nguyên cho mọi tick khác (đang seeking, frame stale
 * không do seek vừa xong). justCompleted && seeking là trạng thái
 * không thể (justCompleted đã hàm ý !seeking) — rơi về stepDrawAllowed
 * như cũ để khỏi vẽ frame đang bay.
 */
export function stepDrawAllowedWithCompletion(
  seeking: boolean,
  currentTime: number,
  target: number,
  fps: number,
  justCompleted: boolean,
): boolean {
  if (justCompleted && !seeking) return true;
  return stepDrawAllowed(seeking, currentTime, target, fps);
}

/**
 * Đợt 28 L2: seek có vừa hoàn tất ở tick này không?
 * Dùng cho "cửa sổ vẽ ở tick hoàn tất" (xem preview.tsx): vòng lặp gọi
 * syncMedia TRƯỚC renderFrame mỗi tick, nên tick mà seek vừa xong cũng
 * là tick syncMedia phát seek tiếp theo — frame vừa xong không bao giờ
 * được vẽ nếu seek tiếp phát ngay (đo được: 103 lần hoàn tất, 0 lần vẽ
 * tương ứng trên GOP thưa). Luật: tick vừa hoàn tất thì KHÔNG phát seek
 * mới, để renderFrame tick đó vẽ frame vừa xong (lag ≤ 2 s theo guard
 * nới lỏng); tick sau mới seek tiếp. wasSeeking = seeking ở tick trước
 * (do preview.tsx ghi lại qua WeakMap).
 */
export function justCompletedSeek(wasSeeking: boolean, seeking: boolean): boolean {
  return wasSeeking && !seeking;
}

/**
 * Element đã seek đúng target chưa (dùng cho tầng vẽ khi stepping)?
 * Ngưỡng nửa frame: seek vừa xong thì currentTime nằm trong ±0.5 frame
 * của target (seek đã snap về lưới frame); lệch hơn nghĩa là seek còn
 * đang bay hoặc decoder chưa tới — tầng vẽ phải hold/skip, không được
 * vẽ frame stale rồi mạo nhận là frame tại t.
 */
export function seekOnTarget(
  currentTime: number,
  target: number,
  fps: number,
): boolean {
  const f = fps > 0 ? fps : 30;
  return Math.abs(currentTime - target) <= REVERSE_SEEK_TOLERANCE_FRAMES / f;
}

/**
 * Đợt 34 Q2: cờ opt-in cho đường phát ngược bằng WebCodecs
 * (ReverseFrameCache + ReversePreviewController).
 *
 * Đợt 47 C5 — MẶC ĐỊNH BẬT (đổi từ mặc định TẮT của Q2): đường
 * WebCodecs ngược — trong đó có đường GOP Range cho file lớn
 * (32, 128] MiB — nay là mặc định của app, tắt được bằng nút toggle
 * ở TopBar ("Phát ngược WebCodecs (GOP)"). Lý do đổi mặc định, theo
 * thứ tự:
 *   1. Đường WebCodecs đã qua đủ vòng kiểm chứng (Q2 → V2 → Z4 →
 *      A4 → B4: headed qua vite :5173 → bridge :8787 thật, decode
 *      thật bằng VideoDecoder, fallback an toàn về element khi
 *      decode hỏng / file lớn / thiếu API) — không còn là "thử
 *      nghiệm chưa chứng minh" như lúc Q2 đặt cờ console-only.
 *   2. Mọi fallback vẫn nguyên vẹn: tắt cờ (toggle hoặc
 *      localStorage "0") → preview dùng nguyên đường element-seek
 *      cũ; thiếu API → resolveReverseEngineDetailed báo đúng
 *      "element (thiếu ...)"; controller failed → badge
 *      element-failed. Không có đường nào bị xóa.
 *   3. GOP chỉ sống trong đường WebCodecs: giữ mặc định TẮT cho
 *      engine thì "mặc định bật GOP" là câu rỗng — GOP không bao
 *      giờ chạy. Muốn GOP mặc định bật thì phải bật engine mặc định.
 * - Thứ tự đọc cờ (mới, C5): (a) `window.__vcutReverseWebcodecs`
 *   boolean tường minh (console/harness) thắng — giữ tương thích
 *   với mọi harness cũ đã set cờ này; (b) localStorage
 *   `vcut-reverse-webcodecs` ("0" = tắt, "1" hoặc vắng = bật);
 *   (c) không có window (Node/test) → TẮT, để test Node cũ không
 *   đổi hành vi; localStorage lỗi (private mode) → BẬT (mặc định).
 * - Đường WebCodecs chỉ được chọn khi cờ bật VÀ browser có
 *   VideoDecoder; thiếu 1 trong 2 thì rơi về "element" — không bao
 *   giờ crash preview vì đường mới.
 * - Hàm thuần theo tham số để unit-test được; preview gọi không tham
 *   số (đọc cờ thật + khả năng thật của browser).
 */
export type ReverseEngine = "element" | "webcodecs";

/** Key localStorage cho toggle WebCodecs ngược ở TopBar (đợt 47 C5). */
export const REVERSE_WEBCODECS_STORAGE_KEY = "vcut-reverse-webcodecs";

/**
 * Đợt 47 C5 — đọc cờ opt-in WebCodecs ngược theo thứ tự: cờ console
 * tường minh > localStorage > mặc định BẬT (browser) / TẮT (Node).
 * TopBar dùng chung hàm này làm giá trị khởi tạo cho toggle để nút
 * hiển thị đúng trạng thái thật ngay lần render đầu.
 */
export function readReverseWebcodecsOptIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const flag = (window as unknown as Record<string, unknown>)
      .__vcutReverseWebcodecs;
    if (typeof flag === "boolean") return flag;
  } catch {
    /* bỏ qua, đọc tiếp localStorage */
  }
  try {
    const v = localStorage.getItem(REVERSE_WEBCODECS_STORAGE_KEY);
    return v === null ? true : v !== "0";
  } catch {
    return true;
  }
}

/**
 * Đợt 47 C5 — ghi cờ opt-in: localStorage (bền qua lần mở sau) +
 * cờ window (để preview đọc ngay ở tick kế tiếp, không cần reload).
 * Không throw khi localStorage/window không dùng được.
 */
export function setReverseWebcodecsOptIn(on: boolean): void {
  try {
    localStorage.setItem(REVERSE_WEBCODECS_STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* private mode: giữ trong phiên qua cờ window bên dưới */
  }
  try {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__vcutReverseWebcodecs = on;
    }
  } catch {
    /* bỏ qua */
  }
}

export function isReverseWebcodecsOptedIn(): boolean {
  return readReverseWebcodecsOptIn();
}

export function resolveReverseEngine(
  optIn: boolean = isReverseWebcodecsOptedIn(),
  webcodecsSupported: boolean = typeof VideoDecoder !== "undefined",
): ReverseEngine {
  return optIn && webcodecsSupported ? "webcodecs" : "element";
}

// ROUND43-Y6 — Kiểm tra khả năng WebCodecs ĐẦY ĐỦ, không chỉ VideoDecoder.
// Bối cảnh audit Y6: resolveReverseEngine cũ chỉ hỏi VideoDecoder nên
// một bản WebCodecs từng phần (có VideoDecoder nhưng thiếu
// EncodedVideoChunk/VideoFrame — kiểu triển khai dở dang trên một số
// trình duyệt) vẫn được chọn là "webcodecs", rồi controller mới thất
// bại âm thầm ở decodeGop và rơi về element sau một lần decode hỏng.
// Hàm chi tiết này KHÔNG thay resolveReverseEngine (test Q2 + hành vi
// happy-path giữ nguyên): nó phục vụ badge/status báo đúng đường đang
// dùng, và controller dùng cùng thứ tự kiểm tra ở decodeGop.
export interface WebcodecsCapability {
  videoDecoder: boolean;
  encodedVideoChunk: boolean;
  videoFrame: boolean;
}

export function readWebcodecsCapability(): WebcodecsCapability {
  try {
    return {
      videoDecoder: typeof VideoDecoder !== "undefined",
      encodedVideoChunk: typeof EncodedVideoChunk !== "undefined",
      videoFrame: typeof VideoFrame !== "undefined",
    };
  } catch {
    return {
      videoDecoder: false,
      encodedVideoChunk: false,
      videoFrame: false,
    };
  }
}

export type ReverseEngineReason =
  | "opt-in-off"
  | "webcodecs-ok"
  | "missing-video-decoder"
  | "missing-encoded-video-chunk"
  | "missing-video-frame";

export interface ReverseEngineDetail {
  engine: ReverseEngine;
  reason: ReverseEngineReason;
}

export function resolveReverseEngineDetailed(
  optIn: boolean = isReverseWebcodecsOptedIn(),
  caps: WebcodecsCapability = readWebcodecsCapability(),
): ReverseEngineDetail {
  if (!optIn) return { engine: "element", reason: "opt-in-off" };
  if (!caps.videoDecoder) {
    return { engine: "element", reason: "missing-video-decoder" };
  }
  if (!caps.encodedVideoChunk) {
    return { engine: "element", reason: "missing-encoded-video-chunk" };
  }
  if (!caps.videoFrame) {
    return { engine: "element", reason: "missing-video-frame" };
  }
  return { engine: "webcodecs", reason: "webcodecs-ok" };
}

// ROUND44-Z6 — Badge đường phát ngược = ĐƯỜNG ĐÃ CHỌN, không phải
// đường vẽ của từng frame. Hàm thuần này CHỈ nhận (a) đường đã chọn
// (ReverseEngineDetail từ resolveReverseEngineDetailed) và (b) cờ
// stepping — cố tình KHÔNG có tham số nào về frame vừa vẽ (wcFrame
// null hay controller failed, drawVideoClip rơi về element...). Nhờ
// vậy badge không thể lệch theo frame: khi đường đã chọn là webcodecs
// nhưng frame hiện tại vẽ bằng fallback element (chưa decode kịp /
// decode hỏng), badge vẫn báo WEBCODECS — đúng ngữ nghĩa "đường đã
// chọn". Muốn báo đúng từng frame là tính năng khác (cần đọc trạng
// thái failed của controller), không phải sửa ở đây. Trả null khi
// không stepping hoặc opt-in tắt (badge ẩn, như preview.tsx cũ).
// Text/title do caller lấy qua i18n key reverseEngine.* (không còn
// hardcode ở preview.tsx); hàm này chỉ trả kind + tên API thiếu.
export type ReverseEngineBadgeKind = "webcodecs" | "element-missing";

export interface ReverseEngineBadge {
  kind: ReverseEngineBadgeKind;
  /** Tên API thiếu khi kind = "element-missing", null khi webcodecs. */
  missingApi: string | null;
}

export function reverseEngineMissingApi(
  reason: ReverseEngineReason,
): string | null {
  if (reason === "missing-video-decoder") return "VideoDecoder";
  if (reason === "missing-encoded-video-chunk") return "EncodedVideoChunk";
  if (reason === "missing-video-frame") return "VideoFrame";
  return null;
}

export function resolveReverseEngineBadge(
  detailed: ReverseEngineDetail,
  stepping: boolean,
): ReverseEngineBadge | null {
  if (!stepping) return null;
  if (detailed.reason === "opt-in-off") return null;
  if (detailed.engine === "webcodecs") {
    return { kind: "webcodecs", missingApi: null };
  }
  return {
    kind: "element-missing",
    missingApi: reverseEngineMissingApi(detailed.reason),
  };
}
