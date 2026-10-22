/**
 * clipboard.ts — Copy/paste/duplicate clip (K2, Phase 6).
 *
 * Logic thuần cho clipboard nội bộ của editor, tách riêng khỏi store.ts
 * để test được bằng Node (không cần browser/DOM).
 * Mọi hàm đều pure: không mutate input, trả về spec mới.
 *
 * Thiết kế:
 * - Clipboard là in-memory (module-level trong store.ts), KHÔNG dùng
 *   system clipboard: clip là object spec phức tạp (hiệu ứng, keyframe,
 *   transition...) không biểu diễn được bằng text/plain, và paste cần giữ
 *   nguyên tham chiếu trackId + offset tương đối.
 * - Copy không phá gì nên làm được từ cả track khóa/ẩn; paste/duplicate
 *   BỎ QUA clip có track đích bị khóa hoặc ẩn (không tạo clip mà user
 *   không thấy/không sửa được), và bỏ qua track đã bị xóa.
 * - Paste giữ nguyên offset tương đối giữa các clip (neo ở clip bắt đầu
 *   sớm nhất), đặt khối tại playhead, rồi dịch toàn bộ khối sang phải
 *   cho tới khi không còn chồng lấn clip nào trên track đích.
 * - Duplicate nhân bản TỪNG clip ngay sau clip gốc trên cùng track, đẩy
 *   các clip sau sang phải đúng bằng độ dài bản sao (không phải nhân bản
 *   cả khối selection thành một đoạn liền — xem CLIPBOARD_LIMITS.md).
 * - Transition thuộc về ĐIỂM NỐI giữa 2 clip, không thuộc về bản thân clip
 *   (giống CapCut): clip dán/nhân bản chỉ GIỮ transition khi điểm nối đó
 *   cũng được dán/nhân bản cùng lúc và vẫn kề nhau sau khi đặt; mọi
 *   transition ở biên khối đều bị strip. Nếu không, validator render sẽ
 *   báo lỗi cứng (transitionOut không có clip kề ngay sau).
 */
import type { Clip, Track, VideoSpec } from "@repo-1/video-spec";
import type { Selection } from "./multiselect";

/**
 * Lưu ý kỹ thuật: file này CHỈ dùng `import type` (bị xóa hoàn toàn lúc
 * chạy) để test chạy được bằng Node type-stripping — Node không resolve
 * import không có đuôi `.ts`, còn tsc lại cấm đuôi `.ts` (TS5097). Vì vậy
 * 2 helper nhỏ dưới đây được viết lại tại chỗ thay vì import từ
 * trackFlags/multiselect (logic y hệt bản gốc, chỉ đọc flag/loại trùng).
 */
function getFlag(track: Track | undefined | null, flag: "locked" | "hidden"): boolean {
  return !!track?.[flag];
}

function dedupeSels(sels: Selection[]): Selection[] {
  const seen = new Set<string>();
  const out: Selection[] = [];
  for (const s of sels) {
    const k = `${s.trackId}:${s.clipId}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}

/** Một clip đã copy, kèm mốc gốc để tính offset khi paste. */
export interface CopiedClip {
  trackId: string;
  /** Bản sao sâu của clip gốc (chưa strip transition — strip lúc paste/dup). */
  clip: Clip;
  /** start của clip lúc copy (mốc tính offset tương đối). */
  sourceStart: number;
}

/** Nội dung clipboard: các clip + mốc neo (start nhỏ nhất). */
export interface ClipboardContent {
  clips: CopiedClip[];
  /** start nhỏ nhất trong các clip đã copy. */
  anchorStart: number;
}

function deepCloneClip(c: Clip): Clip {
  return JSON.parse(JSON.stringify(c)) as Clip;
}

function sortClipsOf(track: Track): Track {
  return { ...track, clips: [...track.clips].sort((a, b) => a.start - b.start) };
}

/** Track có nhận clip mới không: tồn tại, không khóa, không ẩn. */
function isPasteTarget(track: Track | undefined): track is Track {
  if (!track) return false;
  if (getFlag(track, "locked")) return false;
  if (getFlag(track, "hidden")) return false;
  return true;
}

/**
 * Copy các clip trong selection vào clipboard.
 * Trả về null khi selection rỗng hoặc không tìm thấy clip nào.
 * Copy được từ cả track khóa/ẩn (chỉ đọc, không sửa gì).
 */
export function copyClips(spec: VideoSpec, sels: Selection[]): ClipboardContent | null {
  const unique = dedupeSels(sels);
  const clips: CopiedClip[] = [];
  for (const s of unique) {
    const track = spec.tracks.find((t) => t.id === s.trackId);
    const clip = track?.clips.find((c) => c.id === s.clipId);
    if (!clip) continue;
    clips.push({ trackId: s.trackId, clip: deepCloneClip(clip), sourceStart: clip.start });
  }
  if (clips.length === 0) return null;
  // Thứ tự ổn định: theo thứ tự track trong spec, rồi theo start.
  const trackOrder = new Map(spec.tracks.map((t, i) => [t.id, i]));
  clips.sort((a, b) => (trackOrder.get(a.trackId) ?? 0) - (trackOrder.get(b.trackId) ?? 0)
    || a.sourceStart - b.sourceStart);
  return { clips, anchorStart: Math.min(...clips.map((c) => c.sourceStart)) };
}

export interface PasteResult {
  spec: VideoSpec;
  /** Selection của các clip vừa dán (id mới). */
  pasted: Selection[];
}

/**
 * Dán clipboard tại `atTime` (thời điểm neo: clip bắt đầu sớm nhất sẽ đặt ở đây).
 * Giữ nguyên offset tương đối giữa các clip; dịch toàn bộ khối sang phải
 * cho tới khi không còn chồng lấn clip nào trên track đích.
 * Clip dán được cấp id mới, giữ nguyên mọi thuộc tính trừ transition ở biên
 * (xem ghi chú đầu file). Trả về null khi không dán được clip nào.
 */
export function pasteClips(
  spec: VideoSpec,
  clipboard: ClipboardContent,
  atTime: number,
  idGen: () => string,
): PasteResult | null {
  const anchor = Math.max(0, atTime);
  // Chỉ giữ clip có track đích hợp lệ.
  const placeable = clipboard.clips.filter((c) =>
    isPasteTarget(spec.tracks.find((t) => t.id === c.trackId)));
  if (placeable.length === 0) return null;

  // Dịch khối sang phải cho tới khi hết chồng lấn (chỉ tăng, không giảm,
  // nên luôn hội tụ trong tối đa số clip hiện có + 1 vòng).
  let shift = anchor - clipboard.anchorStart;
  const existing = new Map<string, Track>();
  for (const t of spec.tracks) existing.set(t.id, t);
  for (let round = 0; round <= spec.tracks.reduce((n, t) => n + t.clips.length, 0) + 1; round++) {
    let needed = 0;
    for (const c of placeable) {
      const track = existing.get(c.trackId);
      if (!track) continue;
      const start = c.sourceStart + shift;
      for (const o of track.clips) {
        if (start < o.start + o.duration && start + c.clip.duration > o.start) {
          needed = Math.max(needed, o.start + o.duration - start);
        }
      }
    }
    if (needed <= 0) break;
    shift += needed;
  }

  // Transition nội bộ khối: chỉ giữ khi 2 clip dán vẫn kề nhau sau khi đặt.
  // Vì offset tương đối được giữ nguyên, "kề nhau sau khi đặt" <=> "kề nhau lúc copy".
  const pastedByTrack = new Map<string, CopiedClip[]>();
  for (const c of placeable) {
    const arr = pastedByTrack.get(c.trackId) ?? [];
    arr.push(c);
    pastedByTrack.set(c.trackId, arr);
  }
  const hasSuccessor = (c: CopiedClip): boolean =>
    (pastedByTrack.get(c.trackId) ?? []).some(
      (o) => o !== c && Math.abs(o.sourceStart - (c.sourceStart + c.clip.duration)) < 1e-9);
  const hasPredecessor = (c: CopiedClip): boolean =>
    (pastedByTrack.get(c.trackId) ?? []).some(
      (o) => o !== c && Math.abs(o.sourceStart + o.clip.duration - c.sourceStart) < 1e-9);

  const pasted: Selection[] = [];
  const newClipsByTrack = new Map<string, Clip[]>();
  for (const c of placeable) {
    const clip = deepCloneClip(c.clip);
    clip.id = idGen();
    clip.start = c.sourceStart + shift;
    if (!hasSuccessor(c)) delete (clip as { transitionOut?: unknown }).transitionOut;
    if (!hasPredecessor(c)) delete (clip as { transitionIn?: unknown }).transitionIn;
    const arr = newClipsByTrack.get(c.trackId) ?? [];
    arr.push(clip);
    newClipsByTrack.set(c.trackId, arr);
    pasted.push({ trackId: c.trackId, clipId: clip.id });
  }

  const tracks = spec.tracks.map((t) => {
    const added = newClipsByTrack.get(t.id);
    if (!added || added.length === 0) return t;
    return sortClipsOf({ ...t, clips: [...t.clips, ...added] });
  });
  return { spec: { ...spec, tracks }, pasted };
}

export interface DuplicateResult {
  spec: VideoSpec;
  /** Selection của các bản sao vừa tạo (id mới). */
  duplicated: Selection[];
}

/**
 * Nhân bản từng clip trong selection ngay sau clip gốc trên cùng track.
 * Các clip sau (kể cả clip được chọn chưa nhân bản) bị đẩy sang phải đúng
 * bằng độ dài bản sao. Bản sao giữ nguyên mọi thuộc tính trừ transition
 * (transition thuộc về điểm nối, không thuộc về clip — xem ghi chú đầu file).
 * Trả về null khi không nhân bản được clip nào (selection rỗng, track khóa/ẩn).
 */
export function duplicateClips(
  spec: VideoSpec,
  sels: Selection[],
  idGen: () => string,
): DuplicateResult | null {
  const unique = dedupeSels(sels);
  // Gom theo track, chỉ giữ track đích hợp lệ.
  const byTrack = new Map<string, string[]>();
  for (const s of unique) {
    const track = spec.tracks.find((t) => t.id === s.trackId);
    if (!isPasteTarget(track)) continue;
    const arr = byTrack.get(s.trackId) ?? [];
    arr.push(s.clipId);
    byTrack.set(s.trackId, arr);
  }
  if (byTrack.size === 0) return null;

  const duplicated: Selection[] = [];
  const tracks = spec.tracks.map((t) => {
    const ids = byTrack.get(t.id);
    if (!ids || ids.length === 0) return t;
    // Làm việc trên bản sao đã sắp xếp; xử lý clip theo start tăng dần.
    let clips = [...t.clips].sort((a, b) => a.start - b.start);
    const wanted = clips.filter((c) => ids.includes(c.id));
    const copyIds = new Set<string>();
    for (const orig of wanted) {
      // Tìm lại vị trí hiện tại (đã bị đẩy bởi các lần nhân bản trước).
      const cur = clips.find((c) => c.id === orig.id);
      if (!cur) continue;
      const insertAt = cur.start + cur.duration;
      // Đẩy các clip bắt đầu từ điểm chèn trở đi sang phải (trừ bản sao đã tạo).
      clips = clips.map((c) =>
        !copyIds.has(c.id) && c.start >= insertAt
          ? ({ ...c, start: c.start + cur.duration } as Clip)
          : c);
      const copy = deepCloneClip(cur);
      copy.id = idGen();
      copy.start = insertAt;
      delete (copy as { transitionIn?: unknown }).transitionIn;
      delete (copy as { transitionOut?: unknown }).transitionOut;
      copyIds.add(copy.id);
      clips = [...clips, copy].sort((a, b) => a.start - b.start);
      duplicated.push({ trackId: t.id, clipId: copy.id });
    }
    return { ...t, clips };
  });
  if (duplicated.length === 0) return null;
  return { spec: { ...spec, tracks }, duplicated };
}
