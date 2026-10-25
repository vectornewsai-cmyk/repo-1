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
 * Đoạn media thấy được của clip nguồn: [in, out] với tốc độ hằng,
 * [in, in + sourcePosAt(curve, duration)] với speedKeyframes (render dùng
 * in + ∫speed nên `out` không còn là biên — xem ghi chú đầu file).
 */
function visibleMediaRange(source: SourceClip): [number, number] {
  if (hasUsableSpeedCurve(source)) {
    return [
      source.in,
      source.in + sourcePosAt(source.speedKeyframes, source.duration),
    ];
  }
  return [source.in, source.out];
}

/**
 * Ánh xạ 1 mốc thời gian media sang offset output (tính từ source.start) —
 * Phase 9 D6. Dùng CHUNG cho caption và karaoke nên 2 thứ không lệch nhau:
 * - SpeedKeyframes (không reverse): đảo tích phân (outputOffsetForMedia).
 * - Speed hằng xuôi: (media - in) / speed.
 * - Speed hằng ngược: (out - media) / speed.
 * Mốc ngoài đoạn nguồn thấy được → null (caller kẹp/bỏ).
 */
export function mapMediaTimeToOutputOffset(
  source: SourceClip,
  mediaTime: number
): number | null {
  const [lo, hi] = visibleMediaRange(source);
  if (mediaTime < lo || mediaTime > hi) return null;
  if (hasUsableSpeedCurve(source)) {
    return outputOffsetForMedia(
      source.speedKeyframes,
      mediaTime - source.in,
      source.duration
    );
  }
  const speed = source.speed ?? 1;
  if (!(speed > 0)) return null;
  return source.reverse ?? false
    ? (source.out - mediaTime) / speed
    : (mediaTime - source.in) / speed;
}

/**
 * Map words (thời gian media, gốc file) thành karaoke clip-local cho 1 câu
 * linked — Phase 9 D6: CHÍNH XÁC dưới mọi tốc độ, thay cho tỉ lệ tuyến tính
 * cũ của R4 (chỉ đúng khi tốc độ hằng trên câu). Mỗi biên từ đi qua đúng
 * ánh xạ media → timeline của caption (mapMediaTimeToOutputOffset), rồi
 * trừ offset bắt đầu của câu để ra clip-local. Biên từ ngoài câu bị kẹp
 * vào [0, duration] (từ cắt dở vẫn giữ phần thấy được).
 */
export function karaokeForLinkedSegment(
  source: SourceClip,
  captionStart: number,
  captionDuration: number,
  words: { start: number; end: number; word: string }[]
): { word: string; start: number; end: number }[] {
  const base = captionStart - source.start;
  const [lo, hi] = visibleMediaRange(source);
  const out: { word: string; start: number; end: number }[] = [];
  for (const w of words) {
    // Kẹp biên từ vào đoạn nguồn thấy được trước khi map (từ cắt dở ở biên
    // câu vẫn giữ phần thấy được, thay vì rớt cả từ như khi map null).
    const s = Math.max(lo, Math.min(hi, w.start));
    const e = Math.max(lo, Math.min(hi, w.end));
    if (e <= s) continue;
    const o1 = mapMediaTimeToOutputOffset(source, s);
    const o2 = mapMediaTimeToOutputOffset(source, e);
    if (o1 === null || o2 === null) continue;
    // Clip ngược: media tăng nhưng output giảm nên o1 > o2 — lấy min/max
    // để khoảng clip-local luôn xuôi theo thời gian phát.
    const lo2 = Math.min(o1, o2);
    const hi2 = Math.max(o1, o2);
    const start = Math.max(0, Math.round((lo2 - base) * 100) / 100);
    const end = Math.min(
      captionDuration,
      Math.round((hi2 - base) * 100) / 100
    );
    if (end > start && start < captionDuration) {
      out.push({ word: w.word, start, end });
    }
  }
  // Sắp theo thời gian phát (clip ngược: thứ tự từ đảo so với media).
  // Preview và ASS \k đều đọc words theo thứ tự mảng nên phải xuôi.
  out.sort((a, b) => a.start - b.start);
  return out;
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
/**
 * Tính lại karaoke clip-local khi caption bám theo clip nguồn đổi hình học —
 * Phase 9 D6. Tốc độ hằng (không curve): KHÔI PHỤC thời gian media của từng
 * biên từ rồi map lại qua hình học mới — chính xác cả khi trim cắt đầu câu
 * (rescale tuyến tính cũ sai trường hợp này: câu media [0,10] trim trái
 * còn [2,10] thì từ media 5 phải về clip-local 3, rescale cho 4). Trim/move
 * không đổi speed nên tốc độ cũ = tốc độ mới; nếu duration cũ không khớp
 * (me-ms)/speed (tốc độ đã đổi, hoặc duration bị kẹp min 0.2) thì rơi về
 * rescale tuyến tính cũ. Có speed curve: giữ rescale tuyến tính (hình học
 * cũ của curve không còn trong refollow nên không khôi phục chính xác
 * được — giới hạn này ghi trong D6_LIMITS.md; lúc TẠO câu thì karaoke đã
 * chính xác qua karaokeForLinkedSegment).
 */
function remapKaraokeForRefollow(
  karaoke: { word: string; start: number; end: number }[],
  oldDuration: number,
  oldLink: { mediaStart: number; mediaEnd: number },
  newLink: { mediaStart: number; mediaEnd: number },
  source: SourceClip,
  newDuration: number
): { word: string; start: number; end: number }[] | undefined {
  if (!hasUsableSpeedCurve(source)) {
    const speed = source.speed ?? 1;
    const reverse = source.reverse ?? false;
    // Kiểm tra tốc độ không đổi: duration cũ phải khớp (me-ms)/speed.
    // Dung sai 0.05s cho làm tròn r2; lệch hơn → tốc độ đã đổi, fallback.
    if (
      speed > 0 &&
      Math.abs(oldDuration - (oldLink.mediaEnd - oldLink.mediaStart) / speed) <= 0.05
    ) {
      const shift = reverse
        ? (newLink.mediaEnd - oldLink.mediaEnd) / speed
        : (oldLink.mediaStart - newLink.mediaStart) / speed;
      const out = karaoke
        .map((w) => ({
          word: w.word,
          start: Math.max(0, Math.round((w.start + shift) * 100) / 100),
          end: Math.min(
            newDuration,
            Math.round((w.end + shift) * 100) / 100
          ),
        }))
        .filter((w) => w.end > w.start && w.start < newDuration);
      return out.length > 0 ? out : undefined;
    }
  }
  return rescaleKaraoke(karaoke, oldDuration, newDuration);
}

/**
 * Scale + clamp karaoke clip-local theo duration mới — Phase 9 R4.
 * Chính xác khi tốc độ hằng số trên câu (tỉ lệ timeline/media đều nhau);
 * xấp xỉ khi câu nằm trên đoạn speed curve (từ không scale tuyến tính theo
 * tích phân tốc độ). Không bao giờ để từ vượt duration mới.
 * Phase 9 D6: chỉ còn là fallback cho refollow có speed curve (xem
 * remapKaraokeForRefollow); lúc tạo câu đã dùng mapping tích phân chính xác.
 */
export function rescaleKaraoke(
  karaoke: { word: string; start: number; end: number }[] | undefined,
  oldDuration: number,
  newDuration: number
): { word: string; start: number; end: number }[] | undefined {
  if (!karaoke || karaoke.length === 0 || oldDuration <= 0) return karaoke;
  const ratio = newDuration / oldDuration;
  const out = karaoke
    .map((w) => ({
      word: w.word,
      start: Math.round(w.start * ratio * 100) / 100,
      end: Math.min(
        newDuration,
        Math.round(w.end * ratio * 100) / 100
      ),
    }))
    .filter((w) => w.end > w.start && w.start < newDuration);
  return out.length > 0 ? out : undefined;
}

/**
 * Dịch karaoke khi trim mép TRÁI clip chữ trực tiếp — Phase 9 R4.
 * shift > 0 = cắt bớt đầu clip (start dời phải): từ dịch trái theo shift,
 * từ nào kết thúc <= 0 thì rớt. shift < 0 = kéo dài clip về trái: từ dịch
 * phải tương ứng. Dùng chung cho cả caption link (sau unlink) lẫn chữ
 * thường có karaoke.
 */
export function shiftKaraoke(
  karaoke: { word: string; start: number; end: number }[] | undefined,
  shift: number
): { word: string; start: number; end: number }[] | undefined {
  if (!karaoke || karaoke.length === 0 || shift === 0) return karaoke;
  const out = karaoke
    .map((w) => ({
      word: w.word,
      start: Math.round((w.start - shift) * 100) / 100,
      end: Math.round((w.end - shift) * 100) / 100,
    }))
    .filter((w) => w.end > 0)
    .map((w) => ({ ...w, start: Math.max(0, w.start) }));
  return out.length > 0 ? out : undefined;
}

/** Cắt karaoke theo duration mới khi trim mép PHẢI clip chữ trực tiếp. */
export function clampKaraoke(
  karaoke: { word: string; start: number; end: number }[] | undefined,
  newDuration: number
): { word: string; start: number; end: number }[] | undefined {
  if (!karaoke || karaoke.length === 0) return karaoke;
  const out = karaoke
    .map((w) => ({ ...w, end: Math.min(w.end, newDuration) }))
    .filter((w) => w.end > w.start && w.start < newDuration);
  return out.length > 0 ? out : undefined;
}

export function linkSegmentsToClips(
  segments: { start: number; end: number; text: string }[],
  source: SourceClip,
  style: TextClip["style"],
  /**
   * Phase 9 R4: words theo từng segment (mảng song song với segments, thời
   * gian media). Khi có, mỗi clip linked được gắn karaoke clip-local qua
   * karaokeForLinkedSegment — map từng biên từ qua tích phân speed curve
   * (D6), chính xác cả dưới speed ramp, không còn tỉ lệ tuyến tính cũ.
   */
  wordsBySegment?: { start: number; end: number; word: string }[][]
): TextClip[] {
  const out: TextClip[] = [];
  for (let si = 0; si < segments.length; si++) {
    const s = segments[si];
    const m = mapMediaRangeToTimeline(source, s.start, s.end);
    if (!m) continue;
    const clip: TextClip = {
      kind: "text",
      id: nextCapId(),
      text: s.text,
      start: m.start,
      duration: Math.max(0.2, m.duration),
      style,
      captionOf: { clipId: source.id, mediaStart: m.visStart, mediaEnd: m.visEnd },
    };
    const segWords = wordsBySegment?.[si];
    if (segWords && segWords.length > 0) {
      const karaoke = karaokeForLinkedSegment(
        source,
        m.start,
        m.duration,
        segWords
      );
      if (karaoke.length > 0) clip.karaoke = karaoke;
    }
    out.push(clip);
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
    const textClip = c as TextClip;
    out.push({
      ...c,
      start: m.start,
      duration: Math.max(0.2, m.duration),
      captionOf: { clipId: source.id, mediaStart: m.visStart, mediaEnd: m.visEnd },
      // D6: karaoke remap qua media (chính xác khi tốc độ hằng, fallback
      // rescale tuyến tính khi có curve — xem remapKaraokeForRefollow).
      // Nếu remap xong rỗng thì bỏ field (chữ thường) thay vì giữ
      // highlight sai thời gian.
      ...(textClip.karaoke
        ? {
            karaoke: remapKaraokeForRefollow(
              textClip.karaoke,
              c.duration,
              c.captionOf,
              { mediaStart: m.visStart, mediaEnd: m.visEnd },
              source,
              Math.max(0.2, m.duration)
            ),
          }
        : {}),
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
      const textClip = c as TextClip;
      // R4: karaoke chỉ giữ nguyên khi mảnh giữ gần như đủ duration gốc (câu
      // không bị cắt dở bởi điểm split). Mảnh bị cắt dở thì bỏ karaoke (giữ
      // chữ thường) — không đoán thời gian từ cho đoạn bị cắt, tránh
      // highlight sai. Dung sai 0.05s cho làm tròn.
      const keepKaraoke =
        textClip.karaoke &&
        Math.abs(m.duration - c.duration) <= 0.05
          ? textClip.karaoke
          : undefined;
      out.push({
        ...c,
        id: first ? c.id : nextCapId(),
        start: m.start,
        duration: Math.max(0.2, m.duration),
        captionOf: { clipId: p.id, mediaStart: m.visStart, mediaEnd: m.visEnd },
        ...(keepKaraoke ? { karaoke: keepKaraoke } : { karaoke: undefined }),
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
