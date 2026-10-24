/**
 * captionFollow.ts — phụ đề bám theo clip nguồn (Phase 7 P6).
 *
 * Vấn đề cũ: auto-caption sinh TextClip từ segments theo THỜI GIAN MEDIA
 * rồi thả thẳng lên timeline, không link gì tới clip nguồn. User trim/move/
 * split clip nguồn xong là phụ đề lệch khỏi tiếng nói.
 *
 * Cách sửa: mỗi câu phụ đề mang `captionOf: {clipId, mediaStart, mediaEnd}`
 * (thời gian trong FILE NGUỒN, không đổi khi edit). Mỗi khi clip nguồn đổi
 * hình học (start/in/out/speed/reverse), editor tính lại vị trí timeline
 * của câu từ captionOf + hình học mới. Toàn bộ hàm ở đây là thuần
 * (không DOM/store) — test được bằng Node, theo mẫu clipboard.ts.
 *
 * Ngữ nghĩa thời gian (khớp speed.ts và speedcurve.ts):
 *   forward, speed hằng: timeline offset = (media - in) / speed
 *   reverse, speed hằng: timeline offset = (out - media) / speed
 *   speedKeyframes (không reverse): media m ↔ offset output o sao cho
 *     sourcePosAt(curve, o) = m - in  (đảo bằng tìm kiếm nhị phân, vì
 *     sourcePosAt đơn điệu tăng theo o khi speed ≥ 0.25 > 0).
 * Đoạn media của clip luôn là [in, out] bất kể chiều phát — TRỪ khi có
 * speedKeyframes: lúc đó render dùng in + ∫speed nên đoạn nguồn thấy được
 * là [in, in + sourcePosAt(curve, duration)] và `out` không còn là biên.
 * GIỚI HẠN: reverse + speedKeyframes bị validator render cấm nên mapping
 * rơi về speed hằng số (giữ hành vi cũ, không đoán ngữ nghĩa cấm).
 *
 * Quy tắc khi edit clip nguồn:
 * - Move: captionOf giữ nguyên, timeline dịch theo delta start.
 * - Trim: câu nằm ngoài [in, out] mới bị cắt/xoá; câu cắt dở thì THU HẸP
 *   cả captionOf lẫn timeline về phần còn thấy (trim phá huỷ phần đã cắt,
 *   giống như video — kéo dài lại không khôi phục câu đã mất).
 * - Split: câu nằm hẳn 1 phía thì đổi link sang clip nửa đó; câu vắt qua
 *   điểm cắt thì TÁCH thành 2 clip (mỗi phía 1 clip, captionOf thu hẹp).
 * - Xoá clip nguồn: câu thành "mồ côi" — đứng yên vị trí cuối, KHÔNG bị
 *   xoá theo (tránh mất dữ liệu lặng lẽ); lần edit sau không bám nữa.
 * - User tự kéo/thả hoặc sửa start/duration của chính câu phụ đề → HỦY
 *   link (captionOf bị xoá) — câu thành chữ tự do, lần edit sau không
 *   kéo nó về nữa. Đây là hành vi có chủ ý, ghi trong CAPTIONFOLLOW_LIMITS.
 */
import type {
  AudioClip,
  CaptionLink,
  Clip,
  TextClip,
  VideoClip,
  VideoSpec,
} from "@repo-1/video-spec";
import type { SpeedCurve } from "@repo-1/video-spec/speedcurve";
import { sourcePosAt } from "@repo-1/video-spec/speedcurve";

// Sinh id nội bộ thay vì import uid từ ../lib: module này phải chạy được
// bằng Node thuần (type-stripping) cho test, mà "../lib" là directory
// import (src/lib/ vừa là thư mục vừa có lib.ts) nên Node ESM từ chối.
// Định dạng giữ tiền tố "cap-" giống nextCapId() của captions.ts.
let capSeq = 0;
function nextCapId(): string {
  capSeq += 1;
  return `cap-${Date.now().toString(36)}-${capSeq.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export type SourceClip = VideoClip | AudioClip;

/** true nếu clip là video/audio (có in/out/speed/reverse). */
export function isSourceClip(clip: Clip): clip is SourceClip {
  return clip.kind === "video" || clip.kind === "audio";
}

/** true nếu clip chữ có link phụ đề hợp lệ. */
export function isLinkedCaption(clip: Clip): clip is TextClip & {
  captionOf: CaptionLink;
} {
  if (clip.kind !== "text") return false;
  const link = (clip as TextClip).captionOf;
  return (
    !!link &&
    typeof link.clipId === "string" &&
    link.clipId.length > 0 &&
    Number.isFinite(link.mediaStart) &&
    Number.isFinite(link.mediaEnd) &&
    link.mediaEnd > link.mediaStart
  );
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** true nếu clip có đường cong tốc độ dùng được (không reverse — cấm). */
function hasUsableSpeedCurve(source: SourceClip): source is SourceClip & {
  speedKeyframes: SpeedCurve;
} {
  const curve = (source as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  return (
    !!curve &&
    Array.isArray(curve.keyframes) &&
    curve.keyframes.length > 0 &&
    !(source.reverse ?? false)
  );
}

/**
 * Đảo sourcePosAt: tìm offset output o ∈ [0, duration] sao cho
 * sourcePosAt(curve, o) = target (target = độ dài nguồn tính từ clip.in).
 * sourcePosAt đơn điệu tăng (speed ≥ 0.25) nên tìm kiếm nhị phân hội tụ.
 * Trả về duration nếu target vượt tổng tiêu thụ (đã kẹp trước khi gọi).
 */
export function outputOffsetForMedia(
  curve: SpeedCurve,
  target: number,
  duration: number
): number {
  if (target <= 0) return 0;
  if (duration <= 0) return 0;
  let lo = 0;
  let hi = duration;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    if (sourcePosAt(curve, mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Ánh xạ đoạn media [a, b) của clip nguồn sang vị trí timeline.
 * Trả về null nếu đoạn nằm ngoài đoạn nguồn thấy được (câu đã bị cắt hết).
 * Kết quả đã kẹp vào đoạn nguồn của clip; phần ngoài bị bỏ.
 * - Speed hằng: công thức speed.ts (xuôi/ngược).
 * - SpeedKeyframes (không reverse): đảo tích phân theo speedcurve.ts;
 *   đoạn nguồn thấy được là [in, in + sourcePosAt(curve, duration)].
 */
export function mapMediaRangeToTimeline(
  source: SourceClip,
  mediaStart: number,
  mediaEnd: number
): { start: number; duration: number; visStart: number; visEnd: number } | null {
  if (hasUsableSpeedCurve(source)) {
    const curve = source.speedKeyframes;
    const consumed = sourcePosAt(curve, source.duration);
    const s = Math.max(mediaStart, source.in);
    const e = Math.min(mediaEnd, source.in + consumed);
    if (e - s < 0.01) return null; // ngoài hẳn hoặc quá ngắn để hiển thị
    const o1 = outputOffsetForMedia(curve, s - source.in, source.duration);
    const o2 = outputOffsetForMedia(curve, e - source.in, source.duration);
    return {
      start: r2(source.start + o1),
      duration: r2(o2 - o1),
      visStart: s,
      visEnd: e,
    };
  }
  const speed = source.speed ?? 1;
  if (!(speed > 0)) return null;
  const s = Math.max(mediaStart, source.in);
  const e = Math.min(mediaEnd, source.out);
  if (e - s < 0.01) return null; // ngoài hẳn hoặc quá ngắn để hiển thị
  const reverse = source.reverse ?? false;
  const start = reverse
    ? source.start + (source.out - e) / speed
    : source.start + (s - source.in) / speed;
  return { start: r2(start), duration: r2((e - s) / speed), visStart: s, visEnd: e };
}

/**
 * Tạo TextClip phụ đề từ segments (thời gian media) bám theo clip nguồn.
 * Câu ngoài hẳn đoạn [in, out] của clip bị bỏ; câu cắt dở bị thu hẹp.
 * Style dùng CAPTION_DEFAULT_STYLE của captions.ts (caller truyền vào để
 * tránh import vòng — captions.ts không import module này).
 */
export function linkSegmentsToClips(
  segments: { start: number; end: number; text: string }[],
  source: SourceClip,
  style: TextClip["style"]
): TextClip[] {
  const out: TextClip[] = [];
  for (const s of segments) {
    const m = mapMediaRangeToTimeline(source, s.start, s.end);
    if (!m) continue;
    out.push({
      kind: "text",
      id: nextCapId(),
      text: s.text,
      start: m.start,
      duration: Math.max(0.2, m.duration),
      style,
      captionOf: { clipId: source.id, mediaStart: m.visStart, mediaEnd: m.visEnd },
    });
  }
  return out;
}

/**
 * Tính lại toàn bộ câu phụ đề bám theo clip nguồn SAU KHI clip đổi hình học
 * (move/trim/speed-change). Câu ngoài hẳn [in, out] mới bị xoá; câu cắt dở
 * bị thu hẹp cả captionOf lẫn timeline. Câu link tới clip khác giữ nguyên.
 */
export function refollowCaptions(
  clips: Clip[],
  source: SourceClip
): Clip[] {
  const out: Clip[] = [];
  for (const c of clips) {
    if (!isLinkedCaption(c) || c.captionOf.clipId !== source.id) {
      out.push(c);
      continue;
    }
    const m = mapMediaRangeToTimeline(source, c.captionOf.mediaStart, c.captionOf.mediaEnd);
    if (!m) continue; // bị cắt hết → xoá câu
    out.push({
      ...c,
      start: m.start,
      duration: Math.max(0.2, m.duration),
      captionOf: { clipId: source.id, mediaStart: m.visStart, mediaEnd: m.visEnd },
    });
  }
  return out;
}

/**
 * Dịch các câu bám theo clip nguồn theo delta start (dùng cho ripple:
 * các clip bị dồn/đẩy chỉ đổi start, không đổi in/out/speed).
 */
export function shiftLinkedCaptions(
  clips: Clip[],
  sourceId: string,
  dxSec: number
): Clip[] {
  if (dxSec === 0) return clips;
  return clips.map((c) =>
    isLinkedCaption(c) && c.captionOf.clipId === sourceId
      ? { ...c, start: r2(Math.max(0, c.start + dxSec)) }
      : c
  );
}

/**
 * Tách câu phụ đề khi clip nguồn bị split thành N mảnh (pieces theo thứ tự
 * timeline — mỗi mảnh đã có in/out/start/duration đúng, giữ speed/reverse
 * gốc, xem splitSourceAt trong speed.ts).
 * - Câu nằm hẳn 1 mảnh → đổi link sang mảnh đó, timeline tính lại.
 * - Câu vắt qua nhiều mảnh → tách thành nhiều clip (mảnh đầu giữ id gốc,
 *   các mảnh sau sinh id mới; captionOf mỗi mảnh thu hẹp về phần giao).
 * - Câu không link tới clip gốc → giữ nguyên.
 * - Câu không giao mảnh nào → bỏ (không để caption ma).
 */
export function splitLinkedCaptionsMulti(
  clips: Clip[],
  origId: string,
  pieces: SourceClip[]
): Clip[] {
  const out: Clip[] = [];
  for (const c of clips) {
    if (!isLinkedCaption(c) || c.captionOf.clipId !== origId) {
      out.push(c);
      continue;
    }
    let first = true;
    for (const p of pieces) {
      const m = mapMediaRangeToTimeline(p, c.captionOf.mediaStart, c.captionOf.mediaEnd);
      if (!m) continue;
      out.push({
        ...c,
        id: first ? c.id : nextCapId(),
        start: m.start,
        duration: Math.max(0.2, m.duration),
        captionOf: { clipId: p.id, mediaStart: m.visStart, mediaEnd: m.visEnd },
      });
      first = false;
    }
  }
  return out;
}

/**
 * Tách câu phụ đề khi clip nguồn bị split thành [left, right].
 * Wrapper 2 mảnh của splitLinkedCaptionsMulti (giữ để test cũ vẫn dùng).
 */
export function splitLinkedCaptions(
  clips: Clip[],
  origId: string,
  left: SourceClip,
  right: SourceClip
): Clip[] {
  return splitLinkedCaptionsMulti(clips, origId, [left, right]);
}

/**
 * So sánh spec cũ/mới, dịch các câu bám theo những clip CHỈ ĐỔI START
 * (ripple delete/trim dồn clip sau). Clip bị trim trực tiếp phải dùng
 * refollowCaptions riêng (vì in/out đổi), nên caller truyền excludeIds.
 */
export function shiftCaptionsForMovedClips(
  oldSpec: VideoSpec,
  newSpec: VideoSpec,
  excludeIds: Set<string> = new Set()
): VideoSpec {
  const oldStarts = new Map<string, number>();
  for (const t of oldSpec.tracks)
    for (const c of t.clips) oldStarts.set(c.id, c.start);
  const deltas = new Map<string, number>();
  for (const t of newSpec.tracks) {
    for (const c of t.clips) {
      const old = oldStarts.get(c.id);
      if (old !== undefined && !excludeIds.has(c.id) && c.start !== old) {
        deltas.set(c.id, c.start - old);
      }
    }
  }
  if (deltas.size === 0) return newSpec;
  const tracks = newSpec.tracks.map((t) => {
    let clips = t.clips;
    for (const [id, dx] of deltas) clips = shiftLinkedCaptions(clips, id, dx);
    return clips === t.clips ? t : { ...t, clips };
  });
  return { ...newSpec, tracks };
}

/** Hủy link của 1 câu phụ đề (user tự sửa vị trí/thời lượng của câu). */
export function unlinkCaption(clip: TextClip): TextClip {
  if (!clip.captionOf) return clip;
  const { captionOf: _dropped, ...rest } = clip;
  return rest as TextClip;
}

// --- Wrapper mức VideoSpec (dùng trong store) --------------------------------

/**
 * Áp fn lên mọi clip của mọi track, giữ nguyên track không đổi.
 * Clip sau transform được sắp lại theo start (giống sortClips của store) vì
 * refollow/split có thể đổi thứ tự timeline của các câu.
 */
function mapSpecClips(spec: VideoSpec, fn: (clips: Clip[]) => Clip[]): VideoSpec {
  let changed = false;
  const tracks = spec.tracks.map((t) => {
    const clips = fn(t.clips);
    const sorted = [...clips].sort((a, b) => a.start - b.start);
    if (sorted.length !== t.clips.length || sorted.some((c, i) => c !== t.clips[i]))
      changed = true;
    return changed ? { ...t, clips: sorted } : t;
  });
  return changed ? { ...spec, tracks } : spec;
}

/** Tính lại câu bám theo clip nguồn trên TOÀN BỘ spec (mọi track chữ). */
export function refollowCaptionsInSpec(spec: VideoSpec, source: SourceClip): VideoSpec {
  return mapSpecClips(spec, (clips) => refollowCaptions(clips, source));
}

/** Tách câu bám theo clip gốc thành N mảnh trên TOÀN BỘ spec. */
export function splitLinkedCaptionsInSpec(
  spec: VideoSpec,
  origId: string,
  pieces: SourceClip[]
): VideoSpec {
  return mapSpecClips(spec, (clips) => splitLinkedCaptionsMulti(clips, origId, pieces));
}

/** Hủy link của 1 clip chữ cụ thể (user tự edit chính câu đó). */
export function unlinkCaptionInSpec(spec: VideoSpec, clipId: string): VideoSpec {
  return mapSpecClips(spec, (clips) =>
    clips.map((c) =>
      c.id === clipId && c.kind === "text" ? unlinkCaption(c as TextClip) : c
    )
  );
}
