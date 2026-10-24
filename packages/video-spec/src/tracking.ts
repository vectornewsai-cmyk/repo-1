/**
 * tracking.ts — Motion tracking cho video-spec (Phase 8 Q5).
 *
 * Một quỹ đạo tracking là danh sách điểm mẫu theo thời gian CỤC BỘ của clip
 * overlay (0 = lúc clip bắt đầu hiện, không phải timeline). Mỗi điểm là tâm
 * của vật thể được track, theo tọa độ tương đối 0..1 của khung hình output
 * (0.5, 0.5 = giữa khung). Render nội suy tuyến tính giữa các điểm và kẹp
 * (clamp) ngoài khoảng [điểm đầu, điểm cuối].
 *
 * Quỹ đạo do `server/tracking/track.py` sinh ra (OpenCV, license Apache-2.0),
 * hoặc do user tự tạo / import từ file JSON cùng định dạng. Render worker
 * KHÔNG chạy tracker lúc render — nó chỉ đọc quỹ đạo đã có sẵn. Muốn track
 * vật mới thì chạy track.py trước rồi gắn quỹ đạo vào clip.
 */

/** Một điểm mẫu trên quỹ đạo (thời gian cục bộ, giây; tọa độ tương đối). */
export interface TrackPoint {
  /** Thời gian cục bộ từ đầu clip overlay (giây, >= 0). */
  t: number;
  /** Tâm vật theo chiều ngang, 0..1. */
  x: number;
  /** Tâm vật theo chiều dọc, 0..1. */
  y: number;
  /**
   * Độ tin cậy của tracker tại điểm này (0..1, optional). Điểm có score thấp
   * (< 0.3) vẫn được nội suy nhưng UI nên cảnh báo; điểm lost (xem TrackAttachment)
   * thì render giữ vị trí điểm tốt gần nhất trước đó.
   */
  score?: number;
}

/** Quỹ đạo gắn vào một clip overlay (hiện chỉ sticker). */
export interface TrackAttachment {
  /** Các điểm mẫu, phải sắp xếp theo t tăng dần (validate sẽ kiểm tra). */
  points: TrackPoint[];
  /**
   * true = quỹ đạo này đã bị mất dấu ở cuối (tracker lost) — chỉ để hiển thị,
   * render vẫn kẹp về điểm cuối cùng có score tốt.
   */
  lost?: boolean;
  /** Nguồn quỹ đạo, ví dụ "opencv-csrt" (chỉ để ghi chú, render không dùng). */
  source?: string;
}

/** Số điểm tối đa cho một quỹ đạo (giới hạn độ dài biểu thức overlay FFmpeg). */
export const TRACK_MAX_POINTS = 240;

/** Ngưỡng score coi là "mất dấu" (chỉ để UI cảnh báo, render không bỏ điểm). */
export const TRACK_LOST_SCORE = 0.3;

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Validate một TrackPoint. Trả về danh sách lỗi (rỗng = hợp lệ).
 * `label` dùng làm tiền tố thông báo (ví dụ "track.points[3]").
 */
export function validateTrackPoint(p: unknown, label: string): string[] {
  const errs: string[] = [];
  if (!p || typeof p !== "object") return [`${label} phải là object`];
  const o = p as Record<string, unknown>;
  if (!isFiniteNum(o.t) || (o.t as number) < 0)
    errs.push(`${label}.t phải là số >= 0`);
  if (!isFiniteNum(o.x) || (o.x as number) < 0 || (o.x as number) > 1)
    errs.push(`${label}.x phải là số 0..1`);
  if (!isFiniteNum(o.y) || (o.y as number) < 0 || (o.y as number) > 1)
    errs.push(`${label}.y phải là số 0..1`);
  if (o.score !== undefined && (!isFiniteNum(o.score) || (o.score as number) < 0 || (o.score as number) > 1))
    errs.push(`${label}.score phải là số 0..1`);
  return errs;
}

/**
 * Validate một TrackAttachment. Trả về danh sách lỗi (rỗng = hợp lệ).
 * Lỗi (không phải cảnh báo): rỗng, quá dài, điểm sai, t không tăng dần.
 */
export function validateTrackAttachment(v: unknown): string[] {
  const errs: string[] = [];
  if (v === undefined) return errs;
  if (!v || typeof v !== "object" || Array.isArray(v))
    return [`track phải là object { points: [...] }`];
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.points) || o.points.length === 0)
    return [`track.points phải là mảng không rỗng`];
  if (o.points.length > TRACK_MAX_POINTS)
    errs.push(`track.points tối đa ${TRACK_MAX_POINTS} điểm, nhận được ${o.points.length}`);
  let prevT = -Infinity;
  o.points.forEach((p, i) => {
    errs.push(...validateTrackPoint(p, `track.points[${i}]`));
    const t = (p as Record<string, unknown>)?.t;
    if (isFiniteNum(t)) {
      if (t <= prevT && i > 0) errs.push(`track.points[${i}].t phải tăng dần (điểm trước ${prevT})`);
      prevT = t;
    }
  });
  return errs;
}

/**
 * Nội suy vị trí tại thời gian cục bộ `t` (giây). Ngoài khoảng thì kẹp về
 * điểm đầu/cuối — khớp đúng ngữ nghĩa biểu thức overlay của render worker.
 * Trả về { x, y } theo tọa độ tương đối 0..1.
 */
export function interpolateTrack(points: TrackPoint[], t: number): { x: number; y: number } {
  const pts = [...points].sort((a, b) => a.t - b.t);
  if (pts.length === 0) return { x: 0.5, y: 0.5 };
  if (t <= pts[0].t) return { x: pts[0].x, y: pts[0].y };
  const last = pts[pts.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y };
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 0 : (t - a.t) / span;
      return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
    }
  }
  return { x: last.x, y: last.y };
}
