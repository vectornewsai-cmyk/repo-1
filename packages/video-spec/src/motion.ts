/**
 * motion.ts — Slow-mo mượt / nội suy frame / motion blur cho video-spec
 * (Phase 9 đợt 8, luồng S1 — SPEC THUẦN, chốt shape cuối cùng).
 *
 * Chỉ dùng filter FFmpeg có sẵn (minterpolate, tmix) — KHÔNG model đóng,
 * KHÔNG RIFE, KHÔNG cloud. Render thật do luồng S2 (server/render/src/
 * motion.js, chưa tồn tại tại thời điểm S1 viết file này) + nhánh ramp
 * của S3 (server/render/src/speedramp.js) đảm nhiệm; preview do luồng UI
 * đảm nhiệm. File này CHỈ định nghĩa shape + validate fail-fast + resolve
 * mặc định, không dựng chuỗi filter FFmpeg (đúng ranh giới spec thuần /
 * render worker như adjustment.ts).
 *
 * ## Shape chốt (field cuối cùng — các luồng render/UI dùng đúng tên này)
 *
 *   VideoClip.motion?: ClipMotion
 *   ClipMotion = {
 *     interpolation?: "none" | "minterpolate";  // vắng = "none"
 *     targetFps?: number;                       // 1..120, BẮT BUỘC khi
 *                                              // interpolation = "minterpolate"
 *     miMode?: "mci" | "blend";                // vắng = "mci"
 *     motionBlur?: MotionBlurParams;            // độc lập với interpolation
 *   }
 *   MotionBlurParams = {
 *     frames?: number;                          // nguyên 2..8, vắng = xem dưới
 *     weights?: number[];                       // vắng = chia đều
 *   }
 *
 * ## Ngữ nghĩa chốt
 * - `interpolation: "minterpolate"` = nội suy frame bằng FFmpeg
 *   minterpolate, xuất ra đúng `targetFps` frame/giây. `targetFps` là fps
 *   OUTPUT của clip sau nội suy (không phải fps nguồn, không phải fps
 *   project — render tự lo resample về fps project nếu khác).
 * - `miMode` = mi_mode của minterpolate: "mci" (motion compensated, đắt
 *   nhất nhưng mượt nhất, mặc định) hoặc "blend" (trộn mờ, rẻ hơn).
 *   "dup" (chỉ lặp frame, không nội suy gì) BỊ LOẠI KHỎI SPEC: nó không
 *   làm mượt thêm frame nào nên không thuộc tính năng này.
 * - `motionBlur` = mờ chuyển động theo thời gian bằng FFmpeg tmix: gộp
 *   `frames` frame liên tiếp với trọng số `weights`. Độc lập với
 *   interpolation: blur chạy được ngay cả khi interpolation = "none"
 *   (motion chỉ có blur, không nội suy, là hợp lệ).
 * - Mọi field đều optional; `motion` vắng mặt hoặc `{}` = không làm gì,
 *   hành vi cũ 100% (project cũ load bình thường, xem motion.test.ts).
 *
 * ## Mặc định khi render (resolveMotionBlur — luồng render dùng hàm này
 * ## hoặc mirror đúng quy tắc này, không tự chế mặc định khác)
 * - motionBlur vắng cả frames lẫn weights → frames = 3, weights đều.
 * - chỉ có weights → frames = weights.length (phải nằm trong 2..8).
 * - chỉ có frames → weights đều 1/frames mỗi frame.
 * - weights có sẵn → render CHUẨN HOÁ bằng cách chia cho tổng (tổng > 0
 *   là đủ; không bắt tổng = 1 ở tầng spec vì tmix tự hiểu trọng số
 *   tương đối — UI S5 chia đều tổng = 1 nên vẫn tương thích).
 *
 * ## Validate fail-fast (validateMotion THROW lỗi đầu tiên, không gom lỗi)
 * - motion không phải object → throw; key lạ → throw.
 * - interpolation chỉ "none" | "minterpolate" (vắng = "none").
 * - interpolation = "none" (kể cả vắng) thì KHÔNG được kèm targetFps hay
 *   miMode — field không có tác dụng mà vẫn nằm trong spec là lỗi, không
 *   lặng lẽ bỏ qua. (Xem §"Lệch shape cũ" — UI S5 hiện đang ghi kèm.)
 * - interpolation = "minterpolate" thì targetFps BẮT BUỘC, số hữu hạn
 *   trong [1, 120]. Không suy diễn targetFps từ fps project ở tầng spec
 *   (spec không biết fps project) — render tự quyết khi cần.
 * - targetFps cho phép số thập phân (vd 23.976), không bắt nguyên.
 * - motionBlur: frames nguyên 2..8; weights (nếu có) là mảng số hữu hạn,
 *   độ dài phải bằng frames (khi frames có mặt) hoặc tự nó phải nằm trong
 *   2..8 (khi frames vắng, weights.length thành frames), và tổng > 0.
 * - motion CHỈ áp clip video: validateMotion(motion, clipKind) throw khi
 *   clipKind khác "video" mà motion có mặt (audio/image/text/sticker đều
 *   throw — khác mask: mask còn cảnh báo-bỏ-qua cho image, motion thì
 *   không có trường hợp image hợp lệ nào nên lỗi luôn).
 *
 * ## Spec validate cần thiết cho S2 (validate.js — S1 KHÔNG sửa file đó)
 * S2 mirror đúng các quy tắc trên vào validate.js (kiểu lỗi-gom như
 * validateEnhance/validateMask: mỗi vi phạm thành 1 lỗi, không throw):
 *   1. Trong validateClip, nhánh track.kind === "video": nếu
 *      clip.motion !== undefined thì gọi validateMotion tương đương và
 *      đẩy từng lỗi thành err(where, ...).
 *   2. track.kind !== "video" mà clip.motion !== undefined → err
 *      "motion chỉ dùng cho clip video" (lỗi, không phải cảnh báo — xem
 *      trên; khác mask vì không có kind nào ngoài video dùng được).
 *   3. KHÔNG thêm rule nào khác ở tầng validate: ràng buộc riêng của
 *      nhánh ramp (targetFps phải bằng fps project hoặc bỏ trống, xem
 *      speedramp.js header S3) là rule của render branch, KHÔNG phải
 *      rule spec — S2 giữ nó trong nhánh ramp, không đưa vào validate
 *      chung (clip thường targetFps khác fps project là hợp lệ, render
 *      resample sau nội suy).
 *
 * ## Lệch shape cũ — BẮT BUỘC đối chiếu trước khi render/UI dùng shape này
 * Shape này KHÁC 2 shape tạm đã tồn tại trong repo; không được để 2 shape
 * cùng tồn tại lặng lẽ (S3 đã cảnh báo điều này trong speedramp.js):
 *   a. UI S5 (apps/web/src/components/motion/motion.ts, shape TẠM chờ S1):
 *      - S5 ghi đủ 3 field bắt buộc kể cả khi interpolation = "none"
 *        (vd withMotionBlur tạo { interpolation: "none", targetFps: 30,
 *        miMode: "mci", motionBlur }) — object đó FAIL validateMotion
 *        của S1. S5 phải sửa: khi lưu, nếu interpolation = "none" thì
 *        STRIP targetFps và miMode (chỉ giữ motionBlur nếu có; nếu không
 *        còn gì thì gỡ cả motion). S5 không được tự "sửa" spec cho khớp
 *        UI cũ.
 *      - S5 cho miMode "dup": project đã lưu "dup" phải map sang "mci"
 *        (hoặc "blend") khi S5 chuyển sang shape S1 — "dup" FAIL spec.
 *      - S5 targetFps chỉ 24|30|60: đều nằm trong 1..120 nên đọc được
 *        nguyên vẹn; S5 weights luôn chia đều tổng = 1 nên đọc được.
 *      - S5 MotionBlur bắt buộc frames + weights: đọc được nguyên vẹn
 *        theo quy tắc resolve (S1 cho phép vắng nhưng không bắt vắng).
 *   b. Nhánh ramp S3 (server/render/src/speedramp.js buildMotionPostChain,
 *      shape TẠM chờ S2): interpolation boolean, motionBlur boolean|number,
 *      frames tới 16, miMode gồm "dup". Khi S2 lên, S3 phải sửa
 *      buildMotionPostChain sang shape S1: interpolation "minterpolate"
 *      thay true, motionBlur object thay boolean|number, frames tối đa 8
 *      (project ramp cũ có frames 9..16 sẽ FAIL validate — S2/S3 phải
 *      quyết định migrate/clamp, S1 không tự nới spec lên 16).
 *   c. Chưa có luồng nào khác sở hữu shape motion: server/render/src/
 *      motion.js của S2 chưa tồn tại; validate.js và render.js hiện
 *      không đọc clip.motion (grep xác nhận) — nên shape S1 này là shape
 *      duy nhất từ thời điểm này, các shape tạm trên là nợ migrate.
 *
 * ## Giới hạn (chi tiết + số đo test trong MOTION_SPEC_LIMITS.md cùng thư mục)
 * - interpolation CHỈ có tác dụng khi render; không áp cho audio/image/
 *   text clip (validate throw, xem trên). Preview chưa nối (luồng UI).
 * - Nội suy là xấp xỉ FFmpeg (minterpolate), không phải optical-flow
 *   model học sâu: vật chuyển động nhanh/phức tạp vẫn có thể bóng ma.
 * - Chưa đo fps/tốc độ render của minterpolate/tmix ở đợt S1 (chỉ spec).
 * - Không tăng fps project ở nhánh ramp: xem rule nhánh ramp của S3.
 *
 * Zero-dependency (không import module nào khác — tránh vòng import với
 * index.ts như các module filter khác).
 */

/** Kiểu nội suy frame của clip. "none" = giữ fps gốc, không nội suy. */
export type MotionInterpolation = "none" | "minterpolate";

/** mi_mode của FFmpeg minterpolate mà spec chấp nhận ("dup" bị loại). */
export type MotionMiMode = "mci" | "blend";

/** Các giá trị interpolation hợp lệ (dùng cho validate + UI). */
export const MOTION_INTERPOLATIONS: readonly MotionInterpolation[] = [
  "none",
  "minterpolate",
] as const;

/** Các giá trị miMode hợp lệ (dùng cho validate + UI). */
export const MOTION_MI_MODES: readonly MotionMiMode[] = ["mci", "blend"] as const;

/** targetFps tối thiểu / tối đa cho phép (fps output sau nội suy). */
export const MOTION_TARGET_FPS_MIN = 1;
export const MOTION_TARGET_FPS_MAX = 120;

/** Số frame gộp tối thiểu / tối đa của motion blur (tmix frames). */
export const MOTION_BLUR_FRAMES_MIN = 2;
export const MOTION_BLUR_FRAMES_MAX = 8;

/** miMode mặc định khi interpolation = "minterpolate" mà miMode vắng. */
export const MOTION_DEFAULT_MI_MODE: MotionMiMode = "mci";

/** Số frame blur mặc định khi motionBlur có mặt mà vắng cả frames lẫn weights. */
export const MOTION_BLUR_DEFAULT_FRAMES = 3;

/** Metadata hiển thị cho UI (tiếng Việt). */
export const MOTION_META = {
  interpolation: {
    label: "Nội suy frame",
    description:
      "minterpolate — slow-mo mượt: ước lượng chuyển động để sinh frame giữa, thay vì lặp frame cũ",
  },
  targetFps: {
    label: "FPS đích",
    description: "Số frame/giây của clip sau nội suy (1–120, bắt buộc khi bật nội suy)",
  },
  miMode: {
    label: "Chế độ nội suy",
    description: "mci = bù chuyển động (mượt nhất, đắt nhất); blend = trộn mờ (rẻ hơn)",
  },
  motionBlur: {
    label: "Mờ chuyển động",
    description: "tmix — gộp nhiều frame liên tiếp, làm mờ vật chuyển động nhanh",
  },
} as const;

/**
 * Tham số mờ chuyển động (tmix). Mọi field optional; xem header về cách
 * resolve mặc định (frames vắng → weights.length hoặc 3; weights vắng →
 * chia đều).
 */
export interface MotionBlurParams {
  /** Số frame gộp, nguyên 2..8. */
  frames?: number;
  /** Trọng số mỗi frame, độ dài phải bằng frames (nếu frames có mặt). */
  weights?: number[];
}

/**
 * Cấu hình slow-mo mượt / nội suy frame / motion blur của MỘT clip video.
 * Gắn vào VideoClip qua field `motion` (xem index.ts). Mọi field optional;
 * object rỗng `{}` = không làm gì (tương đương motion vắng mặt).
 */
export interface ClipMotion {
  /**
   * Kiểu nội suy frame. Vắng = "none" (không nội suy, giữ fps gốc).
   * "minterpolate" bắt buộc kèm targetFps (xem validateMotion).
   */
  interpolation?: MotionInterpolation;
  /**
   * FPS output sau nội suy, số hữu hạn trong [1, 120].
   * CHỈ có nghĩa khi interpolation = "minterpolate"; kèm theo
   * interpolation = "none" (hoặc vắng) là lỗi validate.
   */
  targetFps?: number;
  /**
   * mi_mode của minterpolate. Vắng = "mci".
   * CHỈ có nghĩa khi interpolation = "minterpolate" (như targetFps).
   */
  miMode?: MotionMiMode;
  /**
   * Mờ chuyển động (tmix), độc lập với interpolation: có blur mà không
   * nội suy vẫn hợp lệ.
   */
  motionBlur?: MotionBlurParams;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Validate một ClipMotion, FAIL-FAST: throw Error ở vi phạm ĐẦU TIÊN
 * (không gom lỗi — khác validateAdjustmentLayer kiểu trả mảng, vì S1
 * chốt fail-fast theo yêu cầu đợt; S2 mirror sang kiểu gom lỗi khi đưa
 * vào validate.js, xem header §"Spec validate cần thiết cho S2").
 *
 * @param motion giá trị của VideoClip.motion (undefined = vắng, hợp lệ).
 * @param clipKind kind của clip chứa motion ("video" mặc định — field
 *   này chỉ tồn tại trên VideoClip; kind khác mà motion có mặt → throw).
 * @throws Error mô tả đúng 1 vi phạm đầu tiên (tiếng Việt, kèm giá trị
 *   nhận được để debug).
 */
export function validateMotion(motion: unknown, clipKind = "video"): void {
  if (motion === undefined) return;
  if (clipKind !== "video") {
    throw new Error(
      `motion chỉ dùng cho clip video (không áp cho clip ${clipKind})`
    );
  }
  if (!isRecord(motion)) {
    throw new Error(
      `motion phải là một object { interpolation?, targetFps?, miMode?, motionBlur? }, ` +
        `nhận được: ${JSON.stringify(motion)}`
    );
  }
  const known = new Set(["interpolation", "targetFps", "miMode", "motionBlur"]);
  for (const k of Object.keys(motion)) {
    if (!known.has(k)) {
      throw new Error(`motion.${k} không được hỗ trợ (chỉ có interpolation/targetFps/miMode/motionBlur)`);
    }
  }
  const interpolation = motion["interpolation"];
  if (
    interpolation !== undefined &&
    interpolation !== "none" &&
    interpolation !== "minterpolate"
  ) {
    throw new Error(
      `motion.interpolation phải là "none" hoặc "minterpolate", nhận được: ${JSON.stringify(interpolation)}`
    );
  }
  const effective: MotionInterpolation =
    interpolation === "minterpolate" ? "minterpolate" : "none";
  if (effective === "none") {
    if (motion["targetFps"] !== undefined) {
      throw new Error(
        `motion.targetFps chỉ có nghĩa khi interpolation = "minterpolate" ` +
          `(interpolation hiện là "none" mà vẫn kèm targetFps = ${JSON.stringify(motion["targetFps"])})`
      );
    }
    if (motion["miMode"] !== undefined) {
      throw new Error(
        `motion.miMode chỉ có nghĩa khi interpolation = "minterpolate" ` +
          `(interpolation hiện là "none" mà vẫn kèm miMode = ${JSON.stringify(motion["miMode"])})`
      );
    }
  } else {
    const targetFps = motion["targetFps"];
    if (targetFps === undefined) {
      throw new Error(
        `motion.targetFps là bắt buộc khi interpolation = "minterpolate" (không suy diễn từ fps project ở tầng spec)`
      );
    }
    if (
      !isFiniteNumber(targetFps) ||
      targetFps < MOTION_TARGET_FPS_MIN ||
      targetFps > MOTION_TARGET_FPS_MAX
    ) {
      throw new Error(
        `motion.targetFps phải là số trong [${MOTION_TARGET_FPS_MIN}, ${MOTION_TARGET_FPS_MAX}], ` +
          `nhận được: ${JSON.stringify(targetFps)}`
      );
    }
    const miMode = motion["miMode"];
    if (
      miMode !== undefined &&
      miMode !== "mci" &&
      miMode !== "blend"
    ) {
      throw new Error(
        `motion.miMode phải là "mci" hoặc "blend" ("dup" bị loại khỏi spec), ` +
          `nhận được: ${JSON.stringify(miMode)}`
      );
    }
  }
  const blur = motion["motionBlur"];
  if (blur !== undefined) {
    if (!isRecord(blur)) {
      throw new Error(
        `motion.motionBlur phải là một object { frames?, weights? }, nhận được: ${JSON.stringify(blur)}`
      );
    }
    const blurKnown = new Set(["frames", "weights"]);
    for (const k of Object.keys(blur)) {
      if (!blurKnown.has(k)) {
        throw new Error(`motion.motionBlur.${k} không được hỗ trợ (chỉ có frames/weights)`);
      }
    }
    const frames = blur["frames"];
    // Cast một lần dùng chung cho cả 2 block dưới: Record index access
    // trả unknown nên Number.isInteger không narrow được cho TypeScript.
    const framesNum = frames as number | undefined;
    if (
      framesNum !== undefined &&
      (!Number.isInteger(framesNum) ||
        framesNum < MOTION_BLUR_FRAMES_MIN ||
        framesNum > MOTION_BLUR_FRAMES_MAX)
    ) {
      throw new Error(
        `motion.motionBlur.frames phải là số nguyên trong [${MOTION_BLUR_FRAMES_MIN}, ${MOTION_BLUR_FRAMES_MAX}], ` +
          `nhận được: ${JSON.stringify(frames)}`
      );
    }
    const weights = blur["weights"];
    if (weights !== undefined) {
      if (!Array.isArray(weights)) {
        throw new Error(
          `motion.motionBlur.weights phải là một mảng số, nhận được: ${JSON.stringify(weights)}`
        );
      }
      for (let i = 0; i < weights.length; i++) {
        if (!isFiniteNumber(weights[i])) {
          throw new Error(
            `motion.motionBlur.weights[${i}] phải là số hữu hạn, nhận được: ${JSON.stringify(weights[i])}`
          );
        }
      }
      // frames đã qua validate ở trên nên ở đây chỉ còn undefined hoặc
      // số nguyên trong [2, 8].
      const effectiveFrames =
        framesNum !== undefined ? framesNum : weights.length;
      if (
        effectiveFrames < MOTION_BLUR_FRAMES_MIN ||
        effectiveFrames > MOTION_BLUR_FRAMES_MAX
      ) {
        throw new Error(
          `motion.motionBlur: số frame gộp phải trong [${MOTION_BLUR_FRAMES_MIN}, ${MOTION_BLUR_FRAMES_MAX}] ` +
            `(frames = ${JSON.stringify(frames)}, weights.length = ${weights.length})`
        );
      }
      if (framesNum !== undefined && weights.length !== framesNum) {
        throw new Error(
          `motion.motionBlur.weights phải cùng độ dài với frames ` +
            `(frames = ${frames}, weights.length = ${weights.length})`
        );
      }
      const sum = (weights as number[]).reduce((a, b) => a + b, 0);
      if (!(sum > 0)) {
        throw new Error(
          `motion.motionBlur.weights phải có tổng > 0, nhận được tổng = ${sum}`
        );
      }
    }
  }
}

/**
 * Kết quả resolve motion blur về dạng đầy đủ cho render (tmix):
 * { frames, weights } với weights đã chia cho tổng (tổng = 1).
 * Trả về undefined khi motion không có motionBlur.
 * Yêu cầu caller đã validateMotion trước (hàm này không throw cho input
 * đã validate; input chưa validate cho ra kết quả không xác định).
 */
export function resolveMotionBlur(
  motion: ClipMotion | undefined
): { frames: number; weights: number[] } | undefined {
  const blur = motion?.motionBlur;
  if (blur === undefined) return undefined;
  const frames =
    blur.frames !== undefined
      ? blur.frames
      : blur.weights !== undefined
        ? blur.weights.length
        : MOTION_BLUR_DEFAULT_FRAMES;
  const raw =
    blur.weights !== undefined
      ? [...blur.weights]
      : Array.from({ length: frames }, () => 1 / frames);
  const sum = raw.reduce((a, b) => a + b, 0);
  const weights = sum > 0 ? raw.map((w) => w / sum) : raw;
  return { frames, weights };
}

/**
 * migrateMotion — Phase 9 đợt 11 P6: cứu project cũ mang motionBlur
 * weights 0 / thiếu frames mà hiện FAIL validate render (nợ đợt 9:
 * "Weights = 0 trong project cũ vẫn fail validate render S2").
 *
 * NGUYÊN TẮC (đọc kỹ trước khi sửa — đây là fallback load, KHÔNG phải
 * nới validate):
 * - validateMotion KHÔNG ĐỔI: nó vẫn throw với weights toàn 0, vẫn throw
 *   với frames thiếu ở tầng render. migrateMotion là bước RIÊNG chạy ở
 *   tầng load (render gate validate.js + caller spec nào cần mở project
 *   cũ), TRƯỚC khi validate — project cũ qua migrate rồi validate thì
 *   pass, project mới không cần migrate thì đi thẳng validate như cũ.
 * - CHỈ biến đổi input mà hiện FAIL ít nhất một tầng (spec hoặc render):
 *   project mới hợp lệ (weights toàn > 0, frames khớp weights, blur có
 *   đủ frames) được trả về NGUYÊN VẸN (cùng tham chiếu, migrated=false)
 *   — hành vi project mới không đổi một bit nào.
 * - CHỈ cứu 4 trường hợp weights/frames sau (ngoài ra giữ nguyên để
 *   validate vẫn bắt: frames ngoài [2, 8], weights không hữu hạn,
 *   weights dài ngoài [2, 8], key lạ, interpolation/miMode sai, kind
 *   khác video — những lỗi đó KHÔNG phải "project cũ", không đoán mò):
 *   1. weights chứa số <= 0 (toàn 0, lẫn 0, hoặc âm) → thay toàn bộ
 *      bằng weights đều (1 mỗi frame). Lý do: tổng <= 0 thì tmix vô
 *      nghĩa; lẫn 0/âm thì spec có thể pass nhưng render S2 bắt số
 *      dương nên vẫn fail — thay vì render vỡ, fallback về blur đều
 *      (đúng ngữ nghĩa "mờ chuyển động" chung nhất, không bịa trọng số
 *      riêng cho frame nào). UI từ đợt 9 đã chặn weights < 1% nên dữ
 *      liệu mới không bao giờ rơi vào trường hợp này.
 *   2. frames vắng mà weights có mặt (dài 2..8) → frames = weights.length.
 *      Spec vốn đã cho phép dạng này nhưng render S2 bắt frames nguyên
 *      nên project cũ dạng này fail render — migrate chỉ điền field
 *      mà resolveMotionBlur vốn đã suy ra, không đổi ngữ nghĩa.
 *   3. frames có mặt nhưng lệch weights.length (weights dài 2..8) →
 *      frames = weights.length. Giữ nguyên weights (ý đồ người dùng)
 *      thay vì cắt/xén weights cho khớp frames.
 *   4. motionBlur rỗng {} (vắng cả frames lẫn weights) → frames = 3
 *      (MOTION_BLUR_DEFAULT_FRAMES). Spec cho phép nhưng render S2 bắt
 *      frames nên fail — điền đúng mặc định mà resolveMotionBlur dùng.
 * - KHÔNG mutate input: luôn trả object mới khi migrated=true (deep copy
 *   nông đủ 2 tầng motion/motionBlur; các field khác giữ tham chiếu).
 * - motion không phải object (null, chuỗi, mảng...) → trả nguyên, không
 *   đoán: validate vẫn throw như cũ. motion vắng (undefined) → trả
 *   nguyên, migrated=false.
 *
 * Mirror JS: server/render/src/motion.js normalizeLegacyMotion — hai hàm
 * phải giữ cùng rule set; sửa một bên thì sửa cả hai + test cả hai.
 */
export function migrateMotion(motion: unknown): {
  motion: unknown;
  migrated: boolean;
  notes: string[];
} {
  const noChange = { motion, migrated: false, notes: [] as string[] };
  if (motion === undefined) return noChange;
  if (!isRecord(motion)) return noChange;
  const blur = motion["motionBlur"];
  if (blur === undefined) return noChange;
  if (!isRecord(blur)) return noChange;
  // Key lạ trong blur → không cứu, để validate bắt.
  for (const k of Object.keys(blur)) {
    if (k !== "frames" && k !== "weights") return noChange;
  }
  const frames = blur["frames"] as number | undefined;
  const weights = blur["weights"] as number[] | undefined;
  const notes: string[] = [];
  let newFrames = frames;
  let newWeights = weights;

  if (weights === undefined) {
    // Trường hợp 4: blur rỗng → điền frames mặc định. frames hợp lệ
    // sẵn thì không chạm (resolve đã cho weights đều).
    if (frames === undefined) {
      newFrames = MOTION_BLUR_DEFAULT_FRAMES;
      notes.push(
        `motion.motionBlur rỗng (thiếu cả frames lẫn weights) → frames = ${MOTION_BLUR_DEFAULT_FRAMES} (mặc định resolveMotionBlur)`
      );
    } else {
      return noChange;
    }
  } else {
    if (!Array.isArray(weights)) return noChange;
    // Phần tử không hữu hạn, hoặc dài ngoài [2, 8] → không cứu.
    if (
      weights.length < MOTION_BLUR_FRAMES_MIN ||
      weights.length > MOTION_BLUR_FRAMES_MAX ||
      !weights.every((w) => isFiniteNumber(w))
    ) {
      return noChange;
    }
    // frames ngoài [2, 8] (kể cả không nguyên) → không cứu: không biết
    // nên clamp về đâu mà không bịa ngữ nghĩa.
    if (
      frames !== undefined &&
      (!Number.isInteger(frames) ||
        frames < MOTION_BLUR_FRAMES_MIN ||
        frames > MOTION_BLUR_FRAMES_MAX)
    ) {
      return noChange;
    }
    // Trường hợp 2 + 3: điền/khớp frames theo weights.length.
    if (frames === undefined || frames !== weights.length) {
      notes.push(
        `motion.motionBlur.frames (${JSON.stringify(frames)}) lệch/thiếu so với weights.length (${weights.length}) → frames = ${weights.length} (giữ nguyên weights)`
      );
      newFrames = weights.length;
    }
    // Trường hợp 1: bất kỳ weight <= 0 nào → weights đều toàn bộ.
    if (weights.some((w) => w <= 0)) {
      notes.push(
        `motion.motionBlur.weights chứa số <= 0 (${JSON.stringify(weights)}) → weights đều (${newFrames} frame, render S2 yêu cầu số dương)`
      );
      newWeights = Array.from({ length: newFrames as number }, () => 1);
    }
  }
  if (notes.length === 0) return noChange;
  const out: Record<string, unknown> = { ...motion };
  out["motionBlur"] = { ...blur, frames: newFrames, weights: newWeights };
  return { motion: out, migrated: true, notes };
}
