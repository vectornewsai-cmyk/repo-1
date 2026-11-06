/**
 * curveFix.ts — Sửa curve tốc độ vi phạm theo lệnh user (Phase 9 đợt 27,
 * luồng K2; nợ #2 của đợt 26).
 *
 * Bối cảnh (đã kiểm chứng thật, xem
 * docs/PHASE9_ROUND27_K2_CURVE_EXPORT_LIMITS.md §1):
 * - Đợt 26 J5 chỉ cảnh báo lúc load (warnings có cấu trúc trong
 *   projectRepo.ts) và J1 chỉ cứu preview (fail-soft). Project vi phạm
 *   vẫn mở được, nhưng export thì render worker fail-fast: validateSpec
 *   (server/render/src/validate.js) in lỗi cụ thể ra stderr rồi exit 1,
 *   bridge (server/bridge/src/jobQueue.js `_onError`) cắt phần
 *   " Chi tiết:" khỏi `job.error` nên API/user chỉ thấy
 *   "Render worker thoát với mã 1." — mù, không biết curve nào vi phạm.
 * - File này KHÔNG đổi ngữ nghĩa render: nó chỉ (a) chặn export sớm ở
 *   web với thông báo nêu rõ clip/curve vi phạm, và (b) cung cấp hành
 *   động sửa do user chủ động bấm (không tự sửa lén).
 *
 * Luật sanitize — mirror luật kiểm tra của J5 (checkSpeedKeyframes),
 * chỉ áp cho speedKeyframes, không đụng curve khác (volumeKeyframes,
 * animations, motion):
 * - v hữu hạn ngoài [0.25, 4] → clamp về biên gần nhất.
 * - t vượt duration (khi duration biết) → clamp về duration.
 * - t không đơn điệu tăng theo thứ tự viết → GIỮ THỨ TỰ, loại
 *   keyframe sau có t không lớn hơn t của keyframe giữ lại gần nhất
 *   (khác normalize của engine vốn sort + dedupe — sanitize là hành
 *   động user chọn, xem LIMITS §3).
 * - easing không thuộc { linear, ease-in, ease-out, bezier } → linear.
 * - easing bezier mà bezier malformed (thiếu mảng, không đủ 4 số hữu
 *   hạn, x1/x2 ngoài [0, 1]) → linear, bỏ field bezier.
 * - keyframe không phải object, t không hữu hạn / t < 0, v không hữu
 *   hạn → LOẠI keyframe đó (không bịa số thay thế).
 * - quá 128 keyframe sau các bước trên → giữ 128 keyframe đầu.
 * - KHÔNG cứu được (curve không phải object, keyframes không phải
 *   mảng, mảng rỗng, hoặc mọi keyframe đều bị loại) → để nguyên clip,
 *   báo unsalvageable để user sửa tay. KHÔNG tự bỏ cả curve (bỏ curve
 *   = đổi tốc độ clip về 1/speed hằng, là thay đổi ngữ nghĩa lén).
 * - Curve hợp lệ → trả về ĐÚNG tham chiếu cũ (không đổi gì).
 * - Track bị khóa (`locked: true`) → bỏ qua, báo skippedLocked (tôn
 *   trọng khóa track như patchClip trong store.ts).
 *
 * Phân biệt "vi phạm J5" với "render chặn được" (exportCurveBlockers):
 * render validator KHÔNG kiểm tra t đơn điệu (nó sort + dedupe qua
 * normalizeSpeedKeyframes) nên curve chỉ vi phạm đơn điệu vẫn export
 * được — ExportPanel chỉ chặn export khi có vi phạm render-fatal
 * (shape / số lượng / t ngoài [0, duration] / v / easing / bezier).
 * Nút "Sửa curve vi phạm" thì sửa TẤT CẢ warnings J5, kể cả đơn điệu.
 */

import type { VideoSpec } from "@repo-1/video-spec";

/**
 * Cảnh báo curve có cấu trúc — CÙNG SHAPE với SpeedCurveWarning của
 * đợt 26 J5 (projectRepo.ts), nhưng định nghĩa tại đây để file này
 * không import projectRepo: projectRepo dùng import extensionless
 * (chuẩn vite/tsc của repo) còn test Node type-stripping thì cần đuôi
 * `.ts` — import chéo sẽ kẹt một trong hai. Tương thích cấu trúc nên
 * ExportPanel truyền thẳng warnings J5 vào các hàm dưới mà không cần
 * cast. Nếu J5 đổi shape, tsc ở ExportPanel sẽ báo ngay.
 */
export interface SpeedCurveWarning {
  path: string;
  clipId: string;
  keyframeIndex: number | null;
  field: string;
  value: unknown;
  message: string;
}

/** Dạng chuỗi của một SpeedCurveWarning — cùng format với
 *  formatSpeedCurveWarning của J5 (`path (clip "id"): message`). */
export function formatSpeedCurveWarning(w: SpeedCurveWarning): string {
  return `${w.path} (clip "${w.clipId}"): ${w.message}`;
}

export const SPEED_V_MIN = 0.25;
export const SPEED_V_MAX = 4;
export const SPEED_KEYFRAMES_MAX = 128;

const SPEED_EASINGS: readonly string[] = ["linear", "ease-in", "ease-out", "bezier"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isValidBezier(b: unknown): b is [number, number, number, number] {
  return (
    Array.isArray(b) &&
    b.length === 4 &&
    b.every((x) => typeof x === "number" && Number.isFinite(x)) &&
    (b[0] as number) >= 0 &&
    (b[0] as number) <= 1 &&
    (b[2] as number) >= 0 &&
    (b[2] as number) <= 1
  );
}

/**
 * Phase 9 đợt 29 L4 — một thay đổi sanitize ở dạng có cấu trúc để UI
 * dịch được theo locale hiện tại. `text` KHÔNG đổi: `changes` tiếng
 * Việt cũ giữ nguyên từng chữ (test cũ khóa chuỗi đó); `changeItems`
 * chỉ là bản song song có key i18n `curveFix.change*` + vars, UI dùng
 * nó khi độ dài khớp `changes`, ngược lại fallback về `changes`.
 */
export interface SanitizeChangeItem {
  key: string;
  vars?: Record<string, string>;
}

/** Kết quả sanitize MỘT curve. `curve` null = không cứu được. */
export interface SanitizeCurveResult {
  /** Curve đã sửa (tham chiếu cũ nếu không đổi gì), hoặc null. */
  curve: Record<string, unknown> | null;
  /** true nếu curve khác với đầu vào. */
  changed: boolean;
  /** Mô tả từng thay đổi, dạng tiếng Việt, để UI xin xác nhận. */
  changes: string[];
  /** Bản song song có cấu trúc của `changes` (cùng thứ tự, cùng độ dài). */
  changeItems: SanitizeChangeItem[];
  /** Lý do không cứu được (chỉ khi curve === null). */
  unsalvageableReason?: string;
  /** Key i18n `curveFix.reason*` của lý do không cứu được (nếu có). */
  unsalvageableReasonKey?: string;
}

export function sanitizeSpeedKeyframes(
  curve: unknown,
  duration: number | undefined,
): SanitizeCurveResult {
  if (!isRecord(curve) || !Array.isArray(curve["keyframes"])) {
    return {
      curve: null,
      changed: false,
      changes: [],
      changeItems: [],
      unsalvageableReason: "speedKeyframes phải là object { keyframes: [...] } — không sửa tự động được, sửa tay trong Speed panel.",
      unsalvageableReasonKey: "curveFix.reasonShape",
    };
  }
  const arr = curve["keyframes"] as unknown[];
  if (arr.length === 0) {
    return {
      curve: null,
      changed: false,
      changes: [],
      changeItems: [],
      unsalvageableReason: "speedKeyframes.keyframes đang rỗng — cần ít nhất 1 keyframe, thêm tay trong Speed panel.",
      unsalvageableReasonKey: "curveFix.reasonEmpty",
    };
  }
  const changes: string[] = [];
  // Đợt 29 L4: bản song song có cấu trúc của changes (xem SanitizeChangeItem).
  const items: SanitizeChangeItem[] = [];
  const valStr = (v: unknown): string => JSON.stringify(v) ?? String(v);
  const push = (text: string, item: SanitizeChangeItem): void => {
    changes.push(text);
    items.push(item);
  };
  // Bước 1: sửa từng keyframe (giữ thứ tự viết, giữ field lạ qua spread).
  const fixed: Record<string, unknown>[] = [];
  for (let i = 0; i < arr.length; i++) {
    const kf = arr[i];
    if (!isRecord(kf)) {
      push(`keyframes[${i}]: không phải object — đã loại.`, {
        key: "curveFix.changeDropNonObject",
        vars: { index: String(i) },
      });
      continue;
    }
    const t = kf["t"];
    const v = kf["v"];
    if (!isFiniteNum(t) || (t as number) < 0) {
      push(`keyframes[${i}]: t=${JSON.stringify(t)} không hợp lệ — đã loại keyframe.`, {
        key: "curveFix.changeDropBadT",
        vars: { index: String(i), value: valStr(t) },
      });
      continue;
    }
    if (!isFiniteNum(v)) {
      push(`keyframes[${i}]: v=${JSON.stringify(v)} không phải số — đã loại keyframe.`, {
        key: "curveFix.changeDropBadV",
        vars: { index: String(i), value: valStr(v) },
      });
      continue;
    }
    const next: Record<string, unknown> = { ...kf };
    let tt = t as number;
    if (duration !== undefined && tt > duration) {
      push(`keyframes[${i}]: t=${tt} vượt duration=${duration} — đã clamp về ${duration}.`, {
        key: "curveFix.changeClampT",
        vars: { index: String(i), t: String(tt), duration: String(duration) },
      });
      tt = duration;
    }
    next["t"] = tt;
    let vv = v as number;
    if (vv < SPEED_V_MIN) {
      push(`keyframes[${i}]: v=${vv} dưới ${SPEED_V_MIN} — đã clamp về ${SPEED_V_MIN}.`, {
        key: "curveFix.changeClampVLow",
        vars: { index: String(i), v: String(vv), min: String(SPEED_V_MIN) },
      });
      vv = SPEED_V_MIN;
    } else if (vv > SPEED_V_MAX) {
      push(`keyframes[${i}]: v=${vv} trên ${SPEED_V_MAX} — đã clamp về ${SPEED_V_MAX}.`, {
        key: "curveFix.changeClampVHigh",
        vars: { index: String(i), v: String(vv), max: String(SPEED_V_MAX) },
      });
      vv = SPEED_V_MAX;
    }
    next["v"] = vv;
    const easing = kf["easing"];
    if (typeof easing !== "string" || !SPEED_EASINGS.includes(easing)) {
      push(`keyframes[${i}]: easing=${JSON.stringify(easing)} không hỗ trợ — đã về linear.`, {
        key: "curveFix.changeEasing",
        vars: { index: String(i), easing: valStr(easing) },
      });
      next["easing"] = "linear";
      delete next["bezier"];
    } else if (easing === "bezier" && !isValidBezier(kf["bezier"])) {
      push(`keyframes[${i}]: bezier=${JSON.stringify(kf["bezier"])} sai chuẩn (cần [x1, y1, x2, y2], x1, x2 trong [0, 1]) — đã về linear.`, {
        key: "curveFix.changeBezier",
        vars: { index: String(i), bezier: valStr(kf["bezier"]) },
      });
      next["easing"] = "linear";
      delete next["bezier"];
    }
    fixed.push(next);
  }
  // Bước 2: đơn điệu tăng ngặt theo thứ tự viết — loại keyframe sau
  // có t không lớn hơn t của keyframe giữ lại gần nhất.
  const monotone: Record<string, unknown>[] = [];
  let prevT: number | null = null;
  for (let i = 0; i < fixed.length; i++) {
    const tt = fixed[i]["t"] as number;
    if (prevT !== null && tt <= prevT) {
      push(`keyframes[${i}]: t=${tt} không lớn hơn t giữ lại trước đó (${prevT}) — đã loại (giữ thứ tự viết).`, {
        key: "curveFix.changeMonotone",
        vars: { index: String(i), t: String(tt), prev: String(prevT) },
      });
      continue;
    }
    monotone.push(fixed[i]);
    prevT = tt;
  }
  // Bước 3: tối đa 128 keyframe.
  let out = monotone;
  if (out.length > SPEED_KEYFRAMES_MAX) {
    push(`quá ${SPEED_KEYFRAMES_MAX} keyframe (có ${out.length}) — đã giữ ${SPEED_KEYFRAMES_MAX} keyframe đầu.`, {
      key: "curveFix.changeTooMany",
      vars: { max: String(SPEED_KEYFRAMES_MAX), count: String(out.length) },
    });
    out = out.slice(0, SPEED_KEYFRAMES_MAX);
  }
  if (out.length === 0) {
    return {
      curve: null,
      changed: false,
      changes,
      changeItems: items,
      unsalvageableReason: "mọi keyframe đều bị loại khi sửa — không còn keyframe nào, thêm tay trong Speed panel.",
      unsalvageableReasonKey: "curveFix.reasonAllDropped",
    };
  }
  if (changes.length === 0) return { curve, changed: false, changes: [], changeItems: [] };
  return { curve: { ...curve, keyframes: out }, changed: true, changes, changeItems: items };
}

/** Một clip được sửa / bỏ qua / không cứu được khi sanitize cả spec. */
export interface CurveFixEntry {
  path: string;
  clipId: string;
  changes: string[];
  /** Bản song song có cấu trúc của `changes` (đợt 29 L4, xem SanitizeChangeItem). */
  changeItems?: SanitizeChangeItem[];
}

/** Kết quả sanitize cả spec (không mutate input; clip/track không đổi
 *  giữ nguyên tham chiếu — structural sharing như commands.ts). */
export interface SanitizeSpecResult {
  spec: VideoSpec;
  changed: boolean;
  /** Clip đã sửa xong (kèm mô tả thay đổi từng clip). */
  fixed: CurveFixEntry[];
  /** Clip vi phạm nhưng không cứu được (để nguyên, cần sửa tay). */
  unsalvageable: (CurveFixEntry & { reason: string; reasonKey?: string })[];
  /** Clip vi phạm nhưng nằm trên track khóa (để nguyên). */
  skippedLocked: CurveFixEntry[];
}

export function sanitizeSpecSpeedCurves(spec: VideoSpec): SanitizeSpecResult {
  const fixed: CurveFixEntry[] = [];
  const unsalvageable: (CurveFixEntry & { reason: string; reasonKey?: string })[] = [];
  const skippedLocked: CurveFixEntry[] = [];

  const walkSpec = (s: unknown, prefix: string, seen: Set<object>, lockedAbove: boolean): unknown => {
    if (!isRecord(s) || seen.has(s as object)) return s;
    const chain = new Set(seen);
    chain.add(s as object);
    const tracks = s["tracks"];
    if (!Array.isArray(tracks)) return s;
    const newTracks = tracks.map((t, ti) => {
      if (!isRecord(t) || !Array.isArray(t["clips"])) return t;
      const trackLocked = lockedAbove || t["locked"] === true;
      let trackChanged = false;
      const newClips = (t["clips"] as unknown[]).map((c, ci) => {
        if (!isRecord(c)) return c;
        const clipPath = `${prefix}tracks[${ti}].clips[${ci}]`;
        const kind = c["kind"] as string;
        let next: Record<string, unknown> = c;
        if ((kind === "video" || kind === "audio" || kind === "nested") && c["speedKeyframes"] !== undefined) {
          if (trackLocked) {
            skippedLocked.push({ path: clipPath, clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?", changes: [] });
          } else {
            const r = sanitizeSpeedKeyframes(
              c["speedKeyframes"],
              isFiniteNum(c["duration"]) ? (c["duration"] as number) : undefined,
            );
            if (r.changed && r.curve !== null) {
              next = { ...c, speedKeyframes: r.curve };
              fixed.push({ path: clipPath, clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?", changes: r.changes, changeItems: r.changeItems });
              trackChanged = true;
            } else if (r.curve === null) {
              unsalvageable.push({
                path: clipPath,
                clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?",
                changes: r.changes,
                changeItems: r.changeItems,
                reason: r.unsalvageableReason ?? "không sửa được.",
                reasonKey: r.unsalvageableReasonKey,
              });
            }
          }
        }
        if (kind === "nested" && isRecord(c["subSpec"])) {
          const newSub = walkSpec(c["subSpec"], `${clipPath}.subSpec.`, chain, trackLocked);
          if (newSub !== c["subSpec"]) {
            next = { ...next, subSpec: newSub };
            trackChanged = true;
          }
        }
        return next;
      });
      if (trackChanged) {
        return { ...t, clips: newClips };
      }
      return t;
    });
    const anyTrackChanged = newTracks.some((nt, i) => nt !== tracks[i]);
    if (!anyTrackChanged) return s;
    return { ...s, tracks: newTracks };
  };

  const out = walkSpec(spec, "", new Set(), false);
  return {
    spec: out as VideoSpec,
    changed: out !== spec,
    fixed,
    unsalvageable,
    skippedLocked,
  };
}

/**
 * Phase 9 đợt 29 L4 — sanitize CHỈ curve của đúng một clip (điểm nối
 * cho nút "Sửa dòng này" của LoadReportPanel). `targetPath` là path
 * J5 của clip mang curve (vd `tracks[0].clips[1]` hoặc
 * `tracks[0].clips[2].subSpec.tracks[0].clips[0]` khi vi phạm nằm
 * trong nested). Chỉ clip đó được sanitize theo đúng luật của
 * sanitizeSpeedKeyframes; mọi clip/track khác giữ nguyên tham chiếu
 * (structural sharing) nên spec trả về khác input chỉ khi clip đích
 * thật sự đổi. Track khóa ở bất kỳ tầng nào trên đường đi → clip đích
 * vào skippedLocked (không đổi gì, như bản toàn spec). Path không
 * parse được, không tìm thấy clip, clip không mang speedKeyframes,
 * hoặc curve của clip đã hợp lệ → changed=false, các danh sách rỗng.
 * Không mutate input.
 */
export function sanitizeOneSpeedCurve(spec: VideoSpec, targetPath: string): SanitizeSpecResult {
  const fixed: CurveFixEntry[] = [];
  const unsalvageable: (CurveFixEntry & { reason: string; reasonKey?: string })[] = [];
  const skippedLocked: CurveFixEntry[] = [];

  const SEG_RE = /^tracks\[(\d+)\]\.clips\[(\d+)\]$/;
  const segments = targetPath.split(".subSpec.").map((seg) => {
    const m = SEG_RE.exec(seg);
    return m ? { trackIndex: Number(m[1]), clipIndex: Number(m[2]) } : null;
  });
  if (segments.some((s) => s === null)) {
    return { spec, changed: false, fixed, unsalvageable, skippedLocked };
  }
  const segs = segments as { trackIndex: number; clipIndex: number }[];

  const walk = (s: unknown, depth: number, lockedAbove: boolean): unknown => {
    if (!isRecord(s) || !Array.isArray(s["tracks"])) return s;
    const seg = segs[depth];
    const tracks = s["tracks"] as unknown[];
    const newTracks = tracks.map((t, ti) => {
      if (!isRecord(t) || !Array.isArray(t["clips"]) || ti !== seg.trackIndex) return t;
      const trackLocked = lockedAbove || t["locked"] === true;
      let trackChanged = false;
      const newClips = (t["clips"] as unknown[]).map((c, ci) => {
        if (!isRecord(c) || ci !== seg.clipIndex) return c;
        const clipPath = segs
          .slice(0, depth + 1)
          .map((g) => `tracks[${g.trackIndex}].clips[${g.clipIndex}]`)
          .join(".subSpec.");
        if (depth === segs.length - 1) {
          // Clip đích: chỉ sanitize khi nó mang speedKeyframes như luật toàn spec.
          const kind = c["kind"] as string;
          if ((kind === "video" || kind === "audio" || kind === "nested") && c["speedKeyframes"] !== undefined) {
            if (trackLocked) {
              skippedLocked.push({ path: clipPath, clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?", changes: [] });
            } else {
              const r = sanitizeSpeedKeyframes(
                c["speedKeyframes"],
                isFiniteNum(c["duration"]) ? (c["duration"] as number) : undefined,
              );
              if (r.changed && r.curve !== null) {
                fixed.push({ path: clipPath, clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?", changes: r.changes, changeItems: r.changeItems });
                trackChanged = true;
                return { ...c, speedKeyframes: r.curve };
              }
              if (r.curve === null) {
                unsalvageable.push({
                  path: clipPath,
                  clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?",
                  changes: r.changes,
                  changeItems: r.changeItems,
                  reason: r.unsalvageableReason ?? "không sửa được.",
                  reasonKey: r.unsalvageableReasonKey,
                });
              }
            }
          }
          return c;
        }
        // Tầng trung gian: chỉ đi tiếp qua subSpec của nested clip đích.
        if (c["kind"] === "nested" && isRecord(c["subSpec"])) {
          const newSub = walk(c["subSpec"], depth + 1, trackLocked);
          if (newSub !== c["subSpec"]) {
            trackChanged = true;
            return { ...c, subSpec: newSub };
          }
        }
        return c;
      });
      if (trackChanged) {
        return { ...t, clips: newClips };
      }
      return t;
    });
    const anyTrackChanged = newTracks.some((nt, i) => nt !== tracks[i]);
    if (!anyTrackChanged) return s;
    return { ...s, tracks: newTracks };
  };

  const out = walk(spec, 0, false);
  return {
    spec: out as VideoSpec,
    changed: out !== spec,
    fixed,
    unsalvageable,
    skippedLocked,
  };
}

/**
 * Phase 9 đợt 30 M4 — sanitize CHỈ MỘT keyframe của một curve, theo
 * đúng luật của sanitizeSpeedKeyframes nhưng giới hạn ở keyframe có
 * chỉ số `keyframeIndex`. Chỉ keyframe đó đổi (sửa giá trị / bị loại);
 * các keyframe khác giữ nguyên CẢ GIÁ TRỊ LẪN THAM CHIẾU (mảng mới
 * chỉ thay hoặc bỏ đúng một phần tử). Trả về dạng SanitizeCurveResult
 * để tái dùng changeItems / reasonKey của đợt 29 L4.
 *
 * Quy tắc cho keyframe đích (theo thứ tự này, khớp sanitize toàn curve):
 * - nằm ngoài 128 keyframe đầu khi curve dài hơn 128 → loại
 *   (changeDropBeyondCap — phần tử này vốn bị bước cắt 128 loại bỏ).
 * - không phải object, t không hữu hạn / t < 0, v không hữu hạn → loại.
 * - t vượt duration → clamp về duration; v ngoài [0.25, 4] → clamp
 *   về biên; easing không hỗ trợ / bezier sai chuẩn → linear.
 * - sau các bước trên, nếu t (đã clamp) không lớn hơn t của keyframe
 *   hữu hạn gần nhất TRƯỚC nó (quét ngược, bỏ qua keyframe có t
 *   không hữu hạn, dừng ở keyframe không phải object — đúng cách J5
 *   tính prevT) → loại keyframe đích (changeMonotone). Đây là trường
 *   hợp "t đơn điệu" ở mức keyframe: chỉ keyframe sau bị loại, không
 *   đụng keyframe trước. Clamp t về duration mà chạm t trước cũng rơi
 *   vào nhánh này (khớp kết quả toàn curve: clamp rồi loại ở bước 2).
 * - khi bị loại, chỉ báo đúng một thay đổi là "loại" (hiệu ứng ròng);
 *   các bước clamp/easing trước đó trở nên vô nghĩa vì keyframe đã
 *   biến mất, nên không liệt kê chúng (tránh confirm nói sửa một
 *   keyframe vốn đã bị xóa).
 * - keyframe đã hợp lệ theo mọi luật cục bộ → changed=false, trả
 *   đúng tham chiếu curve cũ.
 * - KHÔNG xử lý được ở mức keyframe (curve sai shape, rỗng, hoặc
 *   keyframe đích là keyframe duy nhất mà lại phải bị loại — loại nó
 *   sẽ để lại curve rỗng) → curve null + reasonKey như toàn curve,
 *   không đổi gì. Warning quá 128 keyframe của J5 có keyframeIndex
 *   null nên không đi qua đường này (nó thuộc về sửa mức clip).
 * - index ngoài mảng → changed=false (không phải lỗi, chỉ là không
 *   có gì để sửa).
 * Giới hạn trung thực: quyết định đơn điệu dùng t THÔ của keyframe
 * trước (hàng xóm chưa sửa). Nếu hàng xóm sau đó cũng được sửa, quét
 * lại có thể cho kết quả khác — sửa mức keyframe là một bước tiến
 * tới curve sạch, không phải bảo đảm sạch toàn curve trong một lần.
 */
export function sanitizeOneKeyframeCurve(
  curve: unknown,
  duration: number | undefined,
  keyframeIndex: number,
): SanitizeCurveResult {
  if (!isRecord(curve) || !Array.isArray(curve["keyframes"])) {
    return {
      curve: null,
      changed: false,
      changes: [],
      changeItems: [],
      unsalvageableReason: "speedKeyframes phải là object { keyframes: [...] } — không sửa tự động được, sửa tay trong Speed panel.",
      unsalvageableReasonKey: "curveFix.reasonShape",
    };
  }
  const arr = curve["keyframes"] as unknown[];
  if (arr.length === 0) {
    return {
      curve: null,
      changed: false,
      changes: [],
      changeItems: [],
      unsalvageableReason: "speedKeyframes.keyframes đang rỗng — cần ít nhất 1 keyframe, thêm tay trong Speed panel.",
      unsalvageableReasonKey: "curveFix.reasonEmpty",
    };
  }
  if (!Number.isInteger(keyframeIndex) || keyframeIndex < 0 || keyframeIndex >= arr.length) {
    return { curve: curve as Record<string, unknown>, changed: false, changes: [], changeItems: [] };
  }
  const valStr = (v: unknown): string => JSON.stringify(v) ?? String(v);
  const drop = (item: SanitizeChangeItem, text: string): SanitizeCurveResult => {
    if (arr.length === 1) {
      // Loại keyframe duy nhất → curve rỗng: toàn curve cũng từ chối
      // (unsalvageable), nên mức keyframe cũng không được loại lén.
      return {
        curve: null,
        changed: false,
        changes: [text],
        changeItems: [item],
        unsalvageableReason: "mọi keyframe đều bị loại khi sửa — không còn keyframe nào, thêm tay trong Speed panel.",
        unsalvageableReasonKey: "curveFix.reasonAllDropped",
      };
    }
    const out = arr.filter((_, i) => i !== keyframeIndex);
    return { curve: { ...(curve as Record<string, unknown>), keyframes: out }, changed: true, changes: [text], changeItems: [item] };
  };
  // Vượt 128: phần tử ngoài 128 đầu vốn bị loại ở bước cắt toàn curve.
  if (arr.length > SPEED_KEYFRAMES_MAX && keyframeIndex >= SPEED_KEYFRAMES_MAX) {
    return drop(
      { key: "curveFix.changeDropBeyondCap", vars: { index: String(keyframeIndex), max: String(SPEED_KEYFRAMES_MAX), count: String(arr.length) } },
      `keyframes[${keyframeIndex}]: nằm ngoài ${SPEED_KEYFRAMES_MAX} keyframe đầu (tổng ${arr.length}) — đã loại.`,
    );
  }
  const kf = arr[keyframeIndex];
  if (!isRecord(kf)) {
    return drop(
      { key: "curveFix.changeDropNonObject", vars: { index: String(keyframeIndex) } },
      `keyframes[${keyframeIndex}]: không phải object — đã loại.`,
    );
  }
  const t = kf["t"];
  const v = kf["v"];
  if (!isFiniteNum(t) || (t as number) < 0) {
    return drop(
      { key: "curveFix.changeDropBadT", vars: { index: String(keyframeIndex), value: valStr(t) } },
      `keyframes[${keyframeIndex}]: t=${JSON.stringify(t)} không hợp lệ — đã loại keyframe.`,
    );
  }
  if (!isFiniteNum(v)) {
    return drop(
      { key: "curveFix.changeDropBadV", vars: { index: String(keyframeIndex), value: valStr(v) } },
      `keyframes[${keyframeIndex}]: v=${JSON.stringify(v)} không phải số — đã loại keyframe.`,
    );
  }
  const changes: string[] = [];
  const items: SanitizeChangeItem[] = [];
  const push = (text: string, item: SanitizeChangeItem): void => {
    changes.push(text);
    items.push(item);
  };
  const next: Record<string, unknown> = { ...kf };
  let tt = t as number;
  if (duration !== undefined && tt > duration) {
    push(`keyframes[${keyframeIndex}]: t=${tt} vượt duration=${duration} — đã clamp về ${duration}.`, {
      key: "curveFix.changeClampT",
      vars: { index: String(keyframeIndex), t: String(tt), duration: String(duration) },
    });
    tt = duration;
  }
  next["t"] = tt;
  let vv = v as number;
  if (vv < SPEED_V_MIN) {
    push(`keyframes[${keyframeIndex}]: v=${vv} dưới ${SPEED_V_MIN} — đã clamp về ${SPEED_V_MIN}.`, {
      key: "curveFix.changeClampVLow",
      vars: { index: String(keyframeIndex), v: String(vv), min: String(SPEED_V_MIN) },
    });
    vv = SPEED_V_MIN;
  } else if (vv > SPEED_V_MAX) {
    push(`keyframes[${keyframeIndex}]: v=${vv} trên ${SPEED_V_MAX} — đã clamp về ${SPEED_V_MAX}.`, {
      key: "curveFix.changeClampVHigh",
      vars: { index: String(keyframeIndex), v: String(vv), max: String(SPEED_V_MAX) },
    });
    vv = SPEED_V_MAX;
  }
  next["v"] = vv;
  const easing = kf["easing"];
  if (typeof easing !== "string" || !SPEED_EASINGS.includes(easing)) {
    push(`keyframes[${keyframeIndex}]: easing=${JSON.stringify(easing)} không hỗ trợ — đã về linear.`, {
      key: "curveFix.changeEasing",
      vars: { index: String(keyframeIndex), easing: valStr(easing) },
    });
    next["easing"] = "linear";
    delete next["bezier"];
  } else if (easing === "bezier" && !isValidBezier(kf["bezier"])) {
    push(`keyframes[${keyframeIndex}]: bezier=${JSON.stringify(kf["bezier"])} sai chuẩn (cần [x1, y1, x2, y2], x1, x2 trong [0, 1]) — đã về linear.`, {
      key: "curveFix.changeBezier",
      vars: { index: String(keyframeIndex), bezier: valStr(kf["bezier"]) },
    });
    next["easing"] = "linear";
    delete next["bezier"];
  }
  // Đơn điệu: t đã clamp phải lớn hơn t hữu hạn gần nhất trước nó
  // (quét ngược theo cách J5 tính prevT — xem docstring).
  let prevT: number | null = null;
  for (let i = keyframeIndex - 1; i >= 0; i--) {
    const prev = arr[i];
    if (!isRecord(prev)) break;
    const pt = prev["t"];
    if (isFiniteNum(pt)) {
      prevT = pt as number;
      break;
    }
  }
  if (prevT !== null && tt <= prevT) {
    return drop(
      { key: "curveFix.changeMonotone", vars: { index: String(keyframeIndex), t: String(tt), prev: String(prevT) } },
      `keyframes[${keyframeIndex}]: t=${tt} không lớn hơn t giữ lại trước đó (${prevT}) — đã loại (giữ thứ tự viết).`,
    );
  }
  if (changes.length === 0) {
    return { curve: curve as Record<string, unknown>, changed: false, changes: [], changeItems: [] };
  }
  const out = arr.map((el, i) => (i === keyframeIndex ? next : el));
  return { curve: { ...(curve as Record<string, unknown>), keyframes: out }, changed: true, changes, changeItems: items };
}

/**
 * Phase 9 đợt 30 M4 — sanitize CHỈ keyframe `keyframeIndex` của đúng
 * một clip (path J5, cùng cú pháp với sanitizeOneSpeedCurve). Mọi
 * clip/track khác giữ nguyên tham chiếu; keyframe khác trong cùng
 * curve giữ nguyên tham chiếu (xem sanitizeOneKeyframeCurve). Track
 * khóa ở bất kỳ tầng nào trên đường đi → skippedLocked. Path không
 * parse được / không tìm thấy clip / clip không mang speedKeyframes /
 * keyframe đã hợp lệ / index ngoài mảng → changed=false. Curve của
 * clip đích không cứu được ở mức keyframe → unsalvageable (giữ
 * nguyên clip, user sửa tay hoặc dùng nút mức clip).
 */
export function sanitizeOneKeyframe(
  spec: VideoSpec,
  targetPath: string,
  keyframeIndex: number,
): SanitizeSpecResult {
  const fixed: CurveFixEntry[] = [];
  const unsalvageable: (CurveFixEntry & { reason: string; reasonKey?: string })[] = [];
  const skippedLocked: CurveFixEntry[] = [];

  const SEG_RE = /^tracks\[(\d+)\]\.clips\[(\d+)\]$/;
  const segments = targetPath.split(".subSpec.").map((seg) => {
    const m = SEG_RE.exec(seg);
    return m ? { trackIndex: Number(m[1]), clipIndex: Number(m[2]) } : null;
  });
  if (segments.some((s) => s === null)) {
    return { spec, changed: false, fixed, unsalvageable, skippedLocked };
  }
  const segs = segments as { trackIndex: number; clipIndex: number }[];

  const walk = (s: unknown, depth: number, lockedAbove: boolean): unknown => {
    if (!isRecord(s) || !Array.isArray(s["tracks"])) return s;
    const seg = segs[depth];
    const tracks = s["tracks"] as unknown[];
    const newTracks = tracks.map((t, ti) => {
      if (!isRecord(t) || !Array.isArray(t["clips"]) || ti !== seg.trackIndex) return t;
      const trackLocked = lockedAbove || t["locked"] === true;
      let trackChanged = false;
      const newClips = (t["clips"] as unknown[]).map((c, ci) => {
        if (!isRecord(c) || ci !== seg.clipIndex) return c;
        const clipPath = segs
          .slice(0, depth + 1)
          .map((g) => `tracks[${g.trackIndex}].clips[${g.clipIndex}]`)
          .join(".subSpec.");
        if (depth === segs.length - 1) {
          const kind = c["kind"] as string;
          if ((kind === "video" || kind === "audio" || kind === "nested") && c["speedKeyframes"] !== undefined) {
            if (trackLocked) {
              skippedLocked.push({ path: clipPath, clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?", changes: [] });
            } else {
              const r = sanitizeOneKeyframeCurve(
                c["speedKeyframes"],
                isFiniteNum(c["duration"]) ? (c["duration"] as number) : undefined,
                keyframeIndex,
              );
              if (r.changed && r.curve !== null) {
                fixed.push({ path: clipPath, clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?", changes: r.changes, changeItems: r.changeItems });
                trackChanged = true;
                return { ...c, speedKeyframes: r.curve };
              }
              if (r.curve === null) {
                unsalvageable.push({
                  path: clipPath,
                  clipId: typeof c["id"] === "string" ? (c["id"] as string) : "?",
                  changes: r.changes,
                  changeItems: r.changeItems,
                  reason: r.unsalvageableReason ?? "không sửa được.",
                  reasonKey: r.unsalvageableReasonKey,
                });
              }
            }
          }
          return c;
        }
        if (c["kind"] === "nested" && isRecord(c["subSpec"])) {
          const newSub = walk(c["subSpec"], depth + 1, trackLocked);
          if (newSub !== c["subSpec"]) {
            trackChanged = true;
            return { ...c, subSpec: newSub };
          }
        }
        return c;
      });
      if (trackChanged) {
        return { ...t, clips: newClips };
      }
      return t;
    });
    const anyTrackChanged = newTracks.some((nt, i) => nt !== tracks[i]);
    if (!anyTrackChanged) return s;
    return { ...s, tracks: newTracks };
  };

  const out = walk(spec, 0, false);
  return {
    spec: out as VideoSpec,
    changed: out !== spec,
    fixed,
    unsalvageable,
    skippedLocked,
  };
}

/**
 * Phase 9 đợt 29 L4 — tóm tắt kết quả sanitize theo locale hiện tại.
 * `lookup` là hàm dịch của UI (App truyền `(k, v) => t(k, v)`); hàm này
 * cố tình KHÔNG import i18n (cùng lý do như loadReport: test Node
 * type-stripping không resolve JSON import như vite/tsc). Key thiếu
 * (lookup trả về đúng key) → fallback về mảnh tiếng Việt của
 * formatSanitizeSummary, nên output vi KHỚP TỪNG CHỮ với hàm cũ (test
 * khóa điều này); output en dùng template en.
 */
export function formatSanitizeSummaryLocalized(
  res: SanitizeSpecResult,
  lookup: (key: string, vars?: Record<string, string>) => string,
): string {
  const tr = (key: string, vars: Record<string, string>, fallback: string): string => {
    const out = lookup(key, vars);
    return out === key ? fallback : out;
  };
  const parts: string[] = [];
  if (res.fixed.length > 0) {
    const clips = res.fixed.map((f) => `"${f.clipId}" (${f.path})`).join(", ");
    parts.push(
      tr("curveFix.summaryFixed", { count: String(res.fixed.length), clips },
        `Đã sửa ${res.fixed.length} curve: ${clips}.`),
    );
  }
  if (res.unsalvageable.length > 0) {
    const items = res.unsalvageable.map((u) => {
      const reason = u.reasonKey
        ? tr(u.reasonKey, {}, u.reason)
        : u.reason;
      return `"${u.clipId}" — ${reason}`;
    }).join("; ");
    parts.push(
      tr("curveFix.summaryUnsalvageable", { count: String(res.unsalvageable.length), items },
        `Chưa sửa được ${res.unsalvageable.length} curve (cần sửa tay): ${items}.`),
    );
  }
  if (res.skippedLocked.length > 0) {
    const clips = res.skippedLocked.map((s) => `"${s.clipId}"`).join(", ");
    parts.push(
      tr("curveFix.summaryLocked", { count: String(res.skippedLocked.length), clips },
        `Bỏ qua ${res.skippedLocked.length} curve trên track khóa: ${clips} (mở khóa track rồi sửa lại).`),
    );
  }
  if (parts.length === 0) {
    return tr("curveFix.summaryNone", {}, "Không còn curve vi phạm nào để sửa.");
  }
  return parts.join(" ");
}

/**
 * Mirror luật validator render cho speedKeyframes
 * (server/render/src/validate.js validateSpeedKeyframes +
 * server/render/src/nested.js validateNestedRamp): shape, số lượng,
 * t trong [0, duration], v trong [0.25, 4], easing, bezier — KHÔNG
 * kiểm tra t đơn điệu (render sort + dedupe nên curve chỉ lệch đơn
 * điệu vẫn export được, xem speedcurve.ts normalizeSpeedKeyframes).
 * Trả về warnings dạng J5 để tái dùng formatSpeedCurveWarning.
 */
export function checkSpeedKeyframesRenderFatal(
  curve: unknown,
  path: string,
  clipId: string,
  duration: number | undefined,
): SpeedCurveWarning[] {
  const warn = (
    keyframeIndex: number | null,
    field: string,
    value: unknown,
    message: string,
  ): SpeedCurveWarning => ({ path, clipId, keyframeIndex, field, value, message });
  if (!isRecord(curve) || !Array.isArray(curve["keyframes"])) {
    return [warn(null, "keyframes", curve, "speedKeyframes phải là object { keyframes: [...] }.")];
  }
  const arr = curve["keyframes"] as unknown[];
  if (arr.length === 0) {
    return [warn(null, "keyframes", arr, "speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe.")];
  }
  const out: SpeedCurveWarning[] = [];
  if (arr.length > SPEED_KEYFRAMES_MAX) {
    out.push(warn(null, "keyframes", arr.length, `speedKeyframes.keyframes: quá ${SPEED_KEYFRAMES_MAX} keyframe (có ${arr.length}).`));
  }
  for (let i = 0; i < arr.length; i++) {
    const kf = arr[i];
    const w = `${path}.speedKeyframes.keyframes[${i}]`;
    if (!isRecord(kf)) {
      out.push(warn(i, "keyframes", kf, `${w} phải là object { t, v, easing }.`));
      continue;
    }
    const t = kf["t"];
    const v = kf["v"];
    const easing = kf["easing"];
    if (!isFiniteNum(t) || (t as number) < 0 || (duration !== undefined && (t as number) > duration + 1e-6)) {
      out.push(warn(i, "t", t, `${w}.t phải trong [0, ${duration}] (nhận được: ${JSON.stringify(t)}).`));
    }
    if (!isFiniteNum(v) || (v as number) < SPEED_V_MIN || (v as number) > SPEED_V_MAX) {
      out.push(warn(i, "v", v, `${w}.v phải trong [${SPEED_V_MIN}, ${SPEED_V_MAX}] (nhận được: ${JSON.stringify(v)}).`));
    }
    if (typeof easing !== "string" || !SPEED_EASINGS.includes(easing)) {
      out.push(warn(i, "easing", easing, `${w}.easing phải là linear | ease-in | ease-out | bezier (nhận được: ${JSON.stringify(easing)}).`));
    } else if (easing === "bezier" && !isValidBezier(kf["bezier"])) {
      out.push(warn(i, "bezier", kf["bezier"], `${w}.bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do.`));
    }
  }
  return out;
}

/** Quét mọi speedKeyframes trong spec, chỉ giữ vi phạm render chặn
 *  được (để ExportPanel chặn export sớm với thông báo cụ thể). Quét
 *  đệ quy qua subSpec như collectSpeedCurveWarnings. */
export function collectRenderFatalSpeedWarnings(spec: unknown): SpeedCurveWarning[] {
  const out: SpeedCurveWarning[] = [];
  const walk = (s: unknown, prefix: string, seen: Set<object>): void => {
    if (!isRecord(s) || seen.has(s as object)) return;
    const chain = new Set(seen);
    chain.add(s as object);
    const tracks = (s as Record<string, unknown>)["tracks"];
    if (!Array.isArray(tracks)) return;
    tracks.forEach((t, ti) => {
      if (!isRecord(t) || !Array.isArray(t["clips"])) return;
      (t["clips"] as unknown[]).forEach((c, ci) => {
        if (!isRecord(c)) return;
        const clipPath = `${prefix}tracks[${ti}].clips[${ci}]`;
        const kind = c["kind"] as string;
        if ((kind === "video" || kind === "audio" || kind === "nested") && c["speedKeyframes"] !== undefined) {
          out.push(
            ...checkSpeedKeyframesRenderFatal(
              c["speedKeyframes"],
              clipPath,
              typeof c["id"] === "string" ? (c["id"] as string) : "?",
              isFiniteNum(c["duration"]) ? (c["duration"] as number) : undefined,
            ),
          );
        }
        if (kind === "nested" && isRecord(c["subSpec"])) {
          walk(c["subSpec"], `${clipPath}.subSpec.`, chain);
        }
      });
    });
  };
  walk(spec, "", new Set());
  return out;
}

/**
 * Thông báo lỗi export do curve vi phạm (dùng khi ExportPanel chặn
 * export sớm, và làm nội dung test cho "thông báo lỗi export").
 * Trả về null nếu không có vi phạm render-fatal. Liệt kê tối đa 5
 * warning đầu + câu tổng kết; cuối câu nhắc nút sửa (không tự sửa).
 */
export function exportCurveBlockers(spec: unknown): string | null {
  const fatal = collectRenderFatalSpeedWarnings(spec);
  if (fatal.length === 0) return null;
  return formatExportCurveError(fatal);
}

/** Định dạng thông báo chặn export từ danh sách warnings có cấu trúc. */
export function formatExportCurveError(warnings: SpeedCurveWarning[], limit = 5): string {
  const shown = warnings.slice(0, limit);
  const lines = shown.map((w) => `• ${formatSpeedCurveWarning(w)}`);
  const rest = warnings.length > shown.length ? `\n• … và ${warnings.length - shown.length} vi phạm khác.` : "";
  return (
    `Không xuất được: curve tốc độ vi phạm, render sẽ từ chối project này:\n${lines.join("\n")}${rest}\n` +
    `Bấm “Sửa curve vi phạm” để tự động sửa (có xác nhận trước, hoàn tác được), hoặc sửa tay trong Speed panel rồi xuất lại.`
  );
}

/** Tóm tắt kết quả sanitize để UI hiện sau khi user xác nhận sửa. */
export function formatSanitizeSummary(res: SanitizeSpecResult): string {
  const parts: string[] = [];
  if (res.fixed.length > 0) {
    parts.push(`Đã sửa ${res.fixed.length} curve: ${res.fixed.map((f) => `"${f.clipId}" (${f.path})`).join(", ")}.`);
  }
  if (res.unsalvageable.length > 0) {
    parts.push(
      `Chưa sửa được ${res.unsalvageable.length} curve (cần sửa tay): ${res.unsalvageable.map((u) => `"${u.clipId}" — ${u.reason}`).join("; ")}.`,
    );
  }
  if (res.skippedLocked.length > 0) {
    parts.push(
      `Bỏ qua ${res.skippedLocked.length} curve trên track khóa: ${res.skippedLocked.map((s) => `"${s.clipId}"`).join(", ")} (mở khóa track rồi sửa lại).`,
    );
  }
  if (parts.length === 0) return "Không còn curve vi phạm nào để sửa.";
  return parts.join(" ");
}


