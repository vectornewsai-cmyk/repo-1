/**
 * Store Zustand — source of truth của editor.
 *
 * `spec` là project model, KHỚP 100% với @repo-1/video-spec (v0.1.0).
 * Mọi mutation đều giữ spec hợp lệ: thời gian >= 0, in/out nhất quán,
 * không clip chồng lấn nhau trên cùng track.
 */
import { create } from "zustand";
import type {
  AudioClip,
  Clip,
  TextClip,
  TextStyle,
  Track,
  TrackKind,
  VideoClip,
  VideoSpec,
} from "@repo-1/video-spec";
import { projectDuration, SPEC_VERSION } from "@repo-1/video-spec";
import type { Marker } from "@repo-1/video-spec";
import {
  addMarkerToList,
  removeMarkerFromList,
  updateMarkerInList,
} from "@repo-1/video-spec";
import {
  snapToFrame,
  snapToFrameFloor,
} from "@repo-1/video-spec";
import {
  CAPTION_DEFAULT_STYLE,
  CAPTION_TRACK_LABEL,
  segmentsToTextClips,
  type CaptionSegment,
  wordsForSegments,
} from "./lib/captions";
import {
  clampKaraoke,
  isLinkedCaption,
  isSourceClip,
  linkSegmentsToClips,
  refollowCaptionsInSpec,
  shiftCaptionsForMovedClips,
  shiftKaraoke,
  splitLinkedCaptionsInSpec,
  unlinkCaptionInSpec,
} from "./lib/captionFollow";
import {
  isSpeedable,
  maxTrimLeft,
  maxTrimRightDuration,
  splitSourceAt,
  trimLeftTo,
  trimRightTo,
} from "@repo-1/video-spec/speed";
import {
  outputDurationForSource,
  rampTrimLeftIn,
  rampTrimRightOut,
  sourcePosAt,
  speedAt,
  sliceSpeedKeyframes,
  splitSpeedKeyframes,
  trimSpeedKeyframes,
  type SpeedCurve,
  type TrimmedSpeedKeyframes,
} from "@repo-1/video-spec";
import { pushToast } from "./lib/toast";
import { t as i18nT } from "./i18n";
import {
  nestedSpeedRejectionFields,
  nestedSpeedRejectionMessage,
} from "./components/nested/nestedRejection";
import type { MediaItem, MediaKind } from "./media";
import { fileToMediaItem } from "./media";
import { buildSampleProject } from "./sample";
import { clamp, uid } from "./lib";
import { findMissingAssets, relinkAsset, type MissingAsset } from "./lib/relink";
import { CommandStack, type SpecCommand } from "./lib/commands";
import {
  isTrackLocked,
  toggleTrackFlag as flipTrackFlag,
  type TrackFlag,
} from "./lib/trackFlags";
import { rippleDelete, rippleTrimRight } from "./lib/ripple";
import { clampSplitOuterTransitions } from "./lib/splitTransitions";
import {
  removeSilenceFromClip,
  type LocalSilence,
} from "./lib/silence";
import {
  dedupeSelections,
  deleteClips,
  moveClipsBy,
  primarySelection,
  toggleSelection,
  type MoveItem,
  type Selection,
} from "./lib/multiselect";
import {
  copyClips,
  duplicateClips,
  pasteClips,
  type ClipboardContent,
} from "./lib/clipboard";
import {
  addAdjustmentLayer as addAdjustmentLayerPure,
  addSpecAdjustmentLayer as addSpecAdjustmentLayerPure,
  applyNestedCurveFixedTrim as applyNestedCurveFixedTrimPure,
  applyNestedSpeedDuration as applyNestedSpeedDurationPure,
  asNestedClip as asNestedClipPure,
  checkTwoLevelOuterCurve as checkTwoLevelOuterCurvePure,
  nestedCurveExpectedOut as nestedCurveExpectedOutPure,
  convertLegacyLayerToSpec as convertLegacyLayerToSpecPure,
  deleteAdjustmentLayer as deleteAdjustmentLayerPure,
  deleteSpecAdjustmentLayer as deleteSpecAdjustmentLayerPure,
  listNestedClips as listNestedClipsPure,
  moveAdjustmentLayer as moveAdjustmentLayerPure,
  nestClips as nestClipsPure,
  setNestedClipBoundary as setNestedClipBoundaryPure,
  splitNestedClip as splitNestedClipPure,
  splitNestedDeepInnerClip as splitNestedDeepInnerClipPure,
  trimAdjustmentLayer as trimAdjustmentLayerPure,
  trimNestedClip as trimNestedClipPure,
  unnestClip as unnestClipPure,
  updateAdjustmentLayer as updateAdjustmentLayerPure,
  updateNestedDeepInnerClip as updateNestedDeepInnerClipPure,
  updateNestedInnerClip as updateNestedInnerClipPure,
  updateSpecAdjustmentLayer as updateSpecAdjustmentLayerPure,
  type NestedBoundaryPatch,
  type NestedDeepPatch,
  type NestedInnerPatch,
  type SpecAdjustmentPatch,
  type SpecAdjustmentScope,
} from "./components/nested/nestUtils";

export type { MoveItem, Selection } from "./lib/multiselect";

const IMAGE_CLIP_DEFAULT = 3; // ảnh thêm vào timeline dài mặc định 3s

let trackSeq = 0;
let sampleLoading = false;

/**
 * Command stack cho undo/redo (R1-050, R1-051). Module-level (không nằm trong
 * React state) vì chỉ depth/label cần reactive — xem syncHistory().
 */
const history = new CommandStack();
/**
 * K2 (Phase 6): clipboard nội bộ của editor (module-level, như history —
 * không nằm trong React state vì nội dung clip không cần reactive; chỉ
 * `clipboardSize` được đồng bộ vào state để bật/tắt nút Dán).
 */
let clipboard: ClipboardContent | null = null;
function nextTrackId(kind: TrackKind): string {
  trackSeq += 1;
  return `${kind[0]}${trackSeq}_${uid("t").slice(-4)}`;
}

/** Sắp xếp clip theo start để preview/draw nhất quán. */
function sortClips(track: Track): Track {
  return { ...track, clips: [...track.clips].sort((a, b) => a.start - b.start) };
}

/**
 * Gộp patch vào clip. Ép kiểu có kiểm soát: mọi caller trong file này chỉ
 * patch field hợp lệ với kind của clip (không patch `text` vào VideoClip...),
 * nên kết quả luôn là Clip hợp lệ đúng schema video-spec.
 */
function patchOne(c: Clip, patch: Partial<Clip>): Clip {
  return { ...c, ...patch } as Clip;
}

/** Nhãn tiếng Việt cho field clip thường chỉnh trong Inspector (dùng cho undo label). */
function patchLabel(key: keyof Clip): string {
  const map: Record<string, string> = {
    opacity: "độ trong suốt",
    text: "nội dung chữ",
    volume: "âm lượng",
    speed: "tốc độ",
    start: "vị trí",
    duration: "độ dài",
    src: "nguồn media",
  };
  return map[key as string] ?? "thuộc tính";
}

function withTrack(spec: VideoSpec, trackId: string, fn: (t: Track) => Track): VideoSpec {
  return {
    ...spec,
    tracks: spec.tracks.map((t) => (t.id === trackId ? sortClips(fn(t)) : t)),
  };
}

function findClip(spec: VideoSpec, trackId: string, clipId: string): { track: Track; clip: Clip } | null {
  const track = spec.tracks.find((t) => t.id === trackId);
  if (!track) return null;
  const clip = track.clips.find((c) => c.id === clipId);
  if (!clip) return null;
  return { track, clip };
}

/**
 * Phase 9 đợt 19 G3 — Toast đúng thời điểm tách/trim nested bị từ chối.
 *
 * KHÔNG ĐỔI LOGIC TÁCH/TRIM: các hàm dưới chỉ là side-effect thông báo,
 * đặt tại điểm mà hàm thuần đã trả null / action đã trả false/0. Mọi
 * quyết định tách/trim, undo, validate vẫn y nguyên như trước.
 *
 * CHỐNG BÁO GIẢ (bài học đợt 16 + yêu cầu đợt 19):
 * - Chỉ báo khi detector chung (nestedRejection.ts, cùng điều kiện
 *   splitNestedClip/trimNestedClip) thấy field vi phạm trên clip nested.
 * - Thêm cổng pre-field: mirror đúng các check của hàm thuần TRƯỚC khi
 *   nó chạm tới check field (speed hữu hạn > 0, trim hữu hạn out > in,
 *   trim vắng mặt = phát toàn bộ subSpec). Nếu các check này đã fail
 *   thì hàm thuần trả null TRƯỚC check field — field không phải nguyên
 *   nhân đã chứng minh được nên im lặng, không đổ oan cho field.
 * - Chỉ báo tại điểm thất bại đã xác định (pair null sau khi target đã
 *   qua cổng khóa/margin, trimmed null sau khi đích trim đã đổi thật),
 *   nên trim no-op (delta 0), track khóa, playhead sát mép, clip
 *   thường mang curve đều KHÔNG báo.
 * - Chống spam khi kéo trim: Timeline gọi trimClip liên tục theo
 *   pointermove; cùng một (op, track, clip, tổ hợp field) chỉ báo lại
 *   sau 5s (toast tự đóng sau 4.5s nên cửa sổ này vừa đủ che 1 lần kéo).
 */
function nestedSplitTrimGatePasses(clip: Clip): boolean {
  const rec = clip as unknown as Record<string, unknown>;
  const speed = (rec["speed"] ?? 1) as number;
  if (!Number.isFinite(speed) || speed <= 0) return false;
  const sub = rec["subSpec"] as
    | { tracks?: { clips?: { start: number; duration: number }[] }[] }
    | undefined;
  let sourceDuration = 0;
  if (sub && Array.isArray(sub.tracks)) {
    for (const tr of sub.tracks) {
      if (!tr || !Array.isArray(tr.clips)) continue;
      for (const c of tr.clips) {
        if (Number.isFinite(c.start) && Number.isFinite(c.duration)) {
          sourceDuration = Math.max(sourceDuration, c.start + c.duration);
        }
      }
    }
  }
  const trim = rec["trim"] as { in?: unknown; out?: unknown } | undefined;
  const trimIn = trim === undefined ? 0 : (trim["in"] as number);
  const trimOut = trim === undefined ? sourceDuration : (trim["out"] as number);
  return (
    Number.isFinite(trimIn) && Number.isFinite(trimOut) && trimOut > trimIn
  );
}

let lastNestedRejectionToastKey = "";
let lastNestedRejectionToastAt = 0;

function notifyNestedSplitTrimRejection(
  clip: Clip,
  op: "split" | "trim",
  trackId: string,
  clipId: string,
): void {
  const fields = nestedSpeedRejectionFields(clip);
  if (fields.length === 0) return;
  if (!nestedSplitTrimGatePasses(clip)) return;
  const key = `${op}:${trackId}:${clipId}:${fields.join("+")}`;
  const now = Date.now();
  if (key === lastNestedRejectionToastKey && now - lastNestedRejectionToastAt < 5000) {
    return;
  }
  lastNestedRejectionToastKey = key;
  lastNestedRejectionToastAt = now;
  const rec = clip as unknown as Record<string, unknown>;
  const name = typeof rec["name"] === "string" ? (rec["name"] as string) : clipId;
  pushToast(nestedSpeedRejectionMessage(i18nT, name, fields), "error");
}

/**
 * Tách 1 clip thành 2 tại thời điểm t (timeline, giây).
 * Logic tách y hệt splitAtPlayhead (R1-014: video/audio dùng splitSourceAt
 * nên đúng với mọi speed/reverse).
 * Trả về null nếu t không nằm hẳn trong clip (cách mép < 0.05s) hoặc
 * kind không hỗ trợ.
 */
function splitClipAt(clip: Clip, t: number): [Clip, Clip] | null {
  if (t <= clip.start + 0.05 || t >= clip.start + clip.duration - 0.05) {
    return null;
  }
  const leftDur = t - clip.start;
  const rightDur = clip.start + clip.duration - t;
  // Phase 9 đợt 16 H2: tách nested clip ngoài cùng — trước đợt này nhánh
  // này rơi xuống cuối hàm và trả null (không tách được), vì splitClipAt
  // không có nhánh "nested". Tách chỉ chia cửa sổ trim ngoài tại điểm cắt
  // (cutSub = trim.in + leftDur × speed); clip lá bên trong giữ nguyên,
  // cửa sổ lá sâu sau tách được suy ra bằng composeNestedLeafWindow
  // (xem nestUtils + test nestedStore). Hai nửa giữ nguyên subSpec và
  // name; biên trong không có transition (NestedClip của spec không có
  // field transition) nên không cần kẹp transition như clip video.
  if (clip.kind === "nested") {
    const nested = asNestedClipPure(clip);
    if (!nested) return null;
    const pair = splitNestedClipPure(nested, t, () => uid("c"));
    if (!pair) return null;
    return pair as unknown as [Clip, Clip];
  }
  if (clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image") {
    const left: Clip = { ...clip, duration: leftDur };
    const right: Clip = { ...clip, id: uid("c"), start: t, duration: rightDur };
    return [left, right];
  }
  if (clip.kind === "video") {
    // Phase 9 đợt 14 R5: clip có speed curve thì split theo ramp, không
    // theo tốc độ hằng. Điểm cắt nguồn = in + ∫speed trên nửa trái
    // (đúng với mọi curve, kể cả khi speed hằng vắng mặt); 2 nửa giữ
    // duration output cũ (leftDur/rightDur) và curve đã chia bởi
    // splitSpeedKeyframes (mọi keyframe nằm trong khoảng của nửa mình,
    // đánh giá đúng hệt như curve gốc — linear/ease-in/ease-out nhờ
    // bezier nâng bậc từ đợt 16 H3, bezier nhờ de Casteljau trừ đoạn
    // con suy biến fallback về bezier gốc, xem speedcurve.ts).
    // reverse + curve đã bị validator cấm nên giữ đường tốc độ hằng cũ.
    const curve = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
    if (curve && curve.keyframes.length > 0 && !clip.reverse) {
      const cutSrc = clip.in + sourcePosAt(curve, leftDur);
      const sp = splitSpeedKeyframes(curve.keyframes, leftDur, clip.duration);
      const left: Clip = {
        ...clip,
        duration: leftDur,
        in: clip.in,
        out: cutSrc,
        speedKeyframes: { keyframes: sp.left },
        transitionOut: { type: "none", duration: 0 },
      };
      const right: Clip = {
        ...clip,
        id: uid("c"),
        start: t,
        duration: rightDur,
        in: cutSrc,
        out: clip.out,
        speedKeyframes: { keyframes: sp.right },
        transitionIn: { type: "none", duration: 0 },
      };
      return [left, right];
    }
    const cut = splitSourceAt(clip, t);
    const lDur = (cut.leftOut - cut.leftIn) / (clip.speed ?? 1);
    const rDur = (cut.rightOut - cut.rightIn) / (clip.speed ?? 1);
    const left: Clip = {
      ...clip,
      duration: lDur,
      in: cut.leftIn,
      out: cut.leftOut,
      transitionOut: { type: "none", duration: 0 },
    };
    const right: Clip = {
      ...clip,
      id: uid("c"),
      start: t,
      duration: rDur,
      in: cut.rightIn,
      out: cut.rightOut,
      transitionIn: { type: "none", duration: 0 },
    };
    return [left, right];
  }
  if (clip.kind === "audio") {
    // Phase 9 đợt 14 R5: như nhánh video (không có transition).
    const curve = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
    if (curve && curve.keyframes.length > 0 && !clip.reverse) {
      const cutSrc = clip.in + sourcePosAt(curve, leftDur);
      const sp = splitSpeedKeyframes(curve.keyframes, leftDur, clip.duration);
      const left: Clip = {
        ...clip,
        duration: leftDur,
        in: clip.in,
        out: cutSrc,
        speedKeyframes: { keyframes: sp.left },
      };
      const right: Clip = {
        ...clip,
        id: uid("c"),
        start: t,
        duration: rightDur,
        in: cutSrc,
        out: clip.out,
        speedKeyframes: { keyframes: sp.right },
      };
      return [left, right];
    }
    const cut = splitSourceAt(clip, t);
    const lDur = (cut.leftOut - cut.leftIn) / (clip.speed ?? 1);
    const rDur = (cut.rightOut - cut.rightIn) / (clip.speed ?? 1);
    const left: Clip = { ...clip, duration: lDur, in: cut.leftIn, out: cut.leftOut };
    const right: Clip = {
      ...clip,
      id: uid("c"),
      start: t,
      duration: rDur,
      in: cut.rightIn,
      out: cut.rightOut,
    };
    return [left, right];
  }
  return null;
}

/** Kiểm tra đoạn [start, start+dur) có chồng clip khác trên track không. */
function overlaps(track: Track, ignoreId: string, start: number, dur: number): boolean {
  return track.clips.some(
    (c) => c.id !== ignoreId && start < c.start + c.duration && start + dur > c.start,
  );
}

function mediaKindForTrack(trackKind: TrackKind): MediaKind[] {
  if (trackKind === "video") return ["video", "image"];
  if (trackKind === "audio") return ["audio"];
  if (trackKind === "image") return ["image"];
  return [];
}

interface EditorState {
  spec: VideoSpec;
  media: MediaItem[];
  playhead: number;
  playing: boolean;
  pxPerSec: number;
  selection: Selection[];
  ready: boolean;

  setPlayhead: (t: number) => void;
  togglePlay: () => void;
  stopPlayback: () => void;
  setZoom: (px: number) => void;
  /** Chọn 1 clip (thay thế selection hiện tại). Giữ chữ ký cũ để không vỡ caller. */
  select: (sel: Selection | null) => void;
  /** Thay thế toàn bộ selection bằng danh sách (loại trùng). */
  selectMany: (sels: Selection[]) => void;
  /** Thêm vào selection nếu chưa có (Shift+click). */
  addToSelection: (sel: Selection) => void;
  /** Bật/tắt một mục (Ctrl/Cmd+click). */
  toggleSelect: (sel: Selection) => void;
  /** Xoá toàn bộ selection. */
  clearSelection: () => void;
  setProjectName: (name: string) => void;

  importFiles: (files: File[]) => Promise<void>;
  addTrack: (kind: TrackKind) => string;
  removeTrack: (trackId: string) => void;
  /** Bật/tắt mute/lock/hide trên track (R1-054). */
  toggleTrackFlag: (trackId: string, flag: TrackFlag) => void;
  /** Phase 7 P3: sửa thuộc tính track (volume...) — 1 bước undo, tôn trọng track khóa. */
  patchTrack: (trackId: string, patch: Partial<Track>) => void;
  addMediaToTrack: (mediaId: string, trackId: string, at: number) => void;
  addMediaAtPlayhead: (mediaId: string) => void;
  /** Q8: gắn proxy cho 1 media (chỉ ảnh hưởng preview, không đổi spec/export). */
  setMediaProxy: (mediaId: string, proxyUrl: string, proxyHeight: number) => void;
  addTextClip: (trackId?: string) => void;
  /**
   * Chèn track "Phụ đề" mới từ segments auto-caption (R1-072).
   * Mỗi segment → 1 text clip; toàn bộ là 1 bước undo duy nhất.
   * Trả về id của track vừa tạo.
   */
  addCaptionTrack: (
    segments: CaptionSegment[],
    opts?: {
      label?: string;
      historyLabel?: string;
      /** Phase 7 P6: clip nguồn để phụ đề bám theo (trim/move/split). */
      source?: { trackId: string; clipId: string };
      /**
       * Phase 9 R4: word timestamps từ cùng lần caption (thời gian media).
       * Khi có, clip phụ đề được gắn karaoke (cả track thường lẫn track
       * linked). Track dịch không có words → không karaoke.
       */
      words?: { start: number; end: number; word: string }[];
      /** Phase 9 R4: ghi đè style caption (vd: màu highlight karaoke). */
      style?: Partial<TextStyle>;
    },
  ) => string;

  /**
   * Cắt các khoảng lặng khỏi 1 clip video/audio (R1-084).
   * `silences`: khoảng lặng theo THỜI GIAN LOCAL của clip (offset từ clip.start).
   * Toàn bộ (split + xóa + dồn) là 1 bước undo duy nhất.
   * Trả về {cutCount, removedTotal} hoặc null nếu không cắt được.
   */
  removeSilence: (
    trackId: string,
    clipId: string,
    silences: LocalSilence[]
  ) => { cutCount: number; removedTotal: number } | null;

  moveClip: (trackId: string, clipId: string, newStart: number) => void;
  /**
   * Di chuyển nhiều clip cùng một delta (giữ offset tương đối).
   * `items` mang origStart lúc bắt đầu kéo — tránh trôi số khi kéo liên tục.
   */
  moveSelectionBy: (items: MoveItem[], dxSec: number) => void;
  /** deltaSec: dịch chuyển mép (dương = kéo sang phải). */
  trimClip: (trackId: string, clipId: string, edge: "left" | "right", deltaSec: number) => void;
  patchClip: (trackId: string, clipId: string, patch: Partial<Clip>) => number;
  patchTextStyle: (trackId: string, clipId: string, style: Partial<TextStyle>) => void;
  splitAtPlayhead: () => boolean;
  /**
   * Phase 9: marker trên timeline (dữ liệu thuần, lưu trong spec.markers —
   * tự động survive save/load project JSON). Mỗi thao tác là 1 bước undo.
   * addMarkerAtPlayhead trả về marker vừa tạo, hoặc null nếu time không hợp lệ.
   */
  addMarkerAtPlayhead: (label?: string) => Marker | null;
  updateMarker: (id: string, patch: { label?: string; color?: string }) => void;
  deleteMarker: (id: string) => void;
  /** R1-085: tách 1 clip tại nhiều thời điểm trong 1 bước undo. */
  splitClipAtTimes: (trackId: string, clipId: string, times: number[]) => number;
  /** K2 (Phase 6): số clip trong clipboard nội bộ (reactive — dùng cho disabled nút Dán). */
  clipboardSize: number;
  /** K2: copy selection vào clipboard nội bộ. Trả về số clip đã copy. */
  copySelection: () => number;
  /** K2: dán clipboard tại playhead (1 bước undo). Không có gì để dán thì không làm gì. */
  pasteClipboard: () => void;
  /** K2: nhân bản từng clip đang chọn ngay sau clip gốc (1 bước undo). */
  duplicateSelection: () => void;
  /**
   * Phase 9 N4 (UI only): gộp selection thành 1 nested clip (compound clip).
   * Trả về false nếu không gộp được (xem nestUtils). 1 bước undo.
   */
  nestSelection: (name?: string) => boolean;
  /** Phase 9 N4: rã 1 nested clip về các clip gốc. 1 bước undo. */
  unnestClip: (trackId: string, clipId: string) => boolean;
  /**
   * Phase 9 N4: thêm adjustment layer (filter EFFECT_TYPES áp cho clip bên
   * dưới trong khoảng). Trả về false nếu không thêm được. 1 bước undo.
   */
  addAdjustmentLayer: (filterType: string, intensity: number, start: number, duration: number) => boolean;
  /** Phase 9 N4: xoá 1 adjustment layer (không ripple). 1 bước undo. */
  deleteAdjustmentLayer: (trackId: string, clipId: string) => void;
  /**
   * R5: dời / trim adjustment layer trên hàng FX (đích tuyệt đối, xem
   * nestUtils). Trả về false nếu không hợp lệ (đè layer khác, track khóa).
   * Dùng action riêng thay vì moveSelectionBy/trimClip vì layer được phép
   * đè clip thường. 1 bước undo (kéo gộp bằng mergeKey + history group).
   */
  moveAdjustmentLayer: (trackId: string, clipId: string, newStart: number) => boolean;
  trimAdjustmentLayer: (trackId: string, clipId: string, edge: "left" | "right", target: number) => boolean;
  /** R5: đặt lại start + duration của layer (panel sửa layer). 1 bước undo. */
  updateAdjustmentLayer: (trackId: string, clipId: string, start: number, duration: number) => boolean;
  /** R5: sửa 1 clip con trong compound clip (không cần rã). 1 bước undo.
   * Đợt 15 T6: trả về cả curveDropped (số keyframe tốc độ bị cắt
   * khỏi curve khi patch trim/split clip con) để panel hiển thị
   * cảnh báo cho user — trước đó hàm pure đã trả số này nhưng
   * store nuốt mất (chỉ trả boolean), panel không thấy được. */
  updateNestedInnerClip: (hostTrackId: string, nestedId: string, innerTrackId: string, innerClipId: string, patch: NestedInnerPatch) => { ok: boolean; curveDropped: number };
  /** Đợt 17 N3: sửa 1 clip lá ở cấp sâu (chainIds từ con trực tiếp của
   * top xuống nested chứa trực tiếp lá; chain rỗng = lá trực tiếp
   * trong top). 1 bước undo. Trả curveDropped như updateNestedInnerClip. */
  updateNestedDeepInnerClip: (hostTrackId: string, topId: string, chainIds: string[], innerTrackId: string, innerClipId: string, patch: NestedDeepPatch) => { ok: boolean; curveDropped: number };
  /** Đợt 17 N3: tách 1 clip lá ở cấp sâu tại splitTime (khung thời gian
   * của tầng cha trực tiếp, margin 0.05s). 1 bước undo. */
  splitNestedDeepInnerClip: (hostTrackId: string, topId: string, chainIds: string[], innerTrackId: string, innerClipId: string, splitTime: number) => boolean;
  /** Đợt 19 G2: đặt speed curve lên nested clip theo chế độ
   * trim-cố-định (spec đợt 18 §2): giữ trim, tính lại duration bằng
   * đảo tích phân. 1 bước undo. Trả ok:false + reason khi: không phải
   * nested, track khóa, cây con đã có lá mang curve (fail-fast hợp
   * hai tầng), hoặc curve/trim không tính được duration. Chế độ mặc
   * định của patchClip vẫn là duration-cố-định (giữ duration, tính
   * lại trim.out); action này là đường vào tường minh cho chế độ còn
   * lại, panel chưa có nút gọi nó (xem LIMITS G2). Đợt 21 T3: khi từ
   * chối còn trả reasonKey (key i18n) kèm reason đã dịch theo locale
   * hiện tại, thay cho chuỗi tiếng Việt hardcode trước đây. */
  patchNestedCurveFixedTrim: (trackId: string, clipId: string, curve: SpeedCurve) => { ok: boolean; duration?: number; reason?: string; reasonKey?: string };
  /**
   * R7: thêm adjustment layer CHUẨN vào spec.adjustmentLayers (không tạo
   * clip kind:"adjustment" mới). Scope một track hiện bị chặn ở tầng pure
   * vì spec chưa có field scope (xem nestUtils). 1 bước undo.
   */
  addSpecAdjustmentLayer: (filterType: string, intensity: number, start: number, duration: number, scope: SpecAdjustmentScope) => boolean;
  /** R7: sửa layer chuẩn (thời gian + filter đơn; layer phức tạp chỉ sửa thời gian). 1 bước undo. */
  updateSpecAdjustmentLayer: (layerId: string, patch: SpecAdjustmentPatch) => boolean;
  /** R7: xoá layer chuẩn (không ripple). 1 bước undo. */
  deleteSpecAdjustmentLayer: (layerId: string) => void;
  /** R7: chuyển 1 layer legacy (kind:"adjustment" trong track) sang chuẩn spec. 1 bước undo. */
  convertLegacyLayerToSpec: (trackId: string, clipId: string) => boolean;
  /** R7: đặt/xoá opacity + transition (chỉ fade) qua biên trên nested clip. 1 bước undo. */
  setNestedClipBoundary: (hostTrackId: string, nestedId: string, patch: NestedBoundaryPatch) => boolean;
  /** K2: xoá clipboard (gọi khi đổi project — tránh dán clip của project cũ). */
  clearClipboard: () => void;
  deleteSelection: () => void;
  /** Ripple delete 1 clip cụ thể (không phụ thuộc selection). Trả về false nếu không tìm thấy. */
  deleteClipRipple: (trackId: string, clipId: string) => boolean;

  /** Ripple mode (R1-054): bật = delete/trim mép phải tự dồn gap. */
  rippleMode: boolean;
  toggleRipple: () => void;

  loadSample: () => Promise<void>;
  /** Tạo project trống (xoá media phiên hiện tại — blob URL không bền vững). */
  newProject: () => void;
  /** Thay toàn bộ spec (mở file / khôi phục autosave). Media bị xoá vì blob URL cũ đã chết. */
  replaceProject: (spec: VideoSpec) => void;
  duration: () => number;

  // ---- Relink (R1-033): media thiếu sau khi mở project ----
  /** null = chưa kiểm tra hoặc đã đóng panel; mảng rỗng = không thiếu gì. */
  missingAssets: MissingAsset[] | null;
  /** Quét spec hiện tại, mở panel nếu có asset thiếu. */
  checkMissingMedia: () => void;
  /**
   * Relink 1 asset: import file user chọn, verify đọc được, cập nhật clip.
   * Trả về {ok, message} để panel hiển thị lỗi nếu file không đọc được.
   */
  relinkMedia: (oldSrc: string, file: File) => Promise<{ ok: boolean; message: string }>;
  /** Đóng panel relink (bỏ qua các asset còn thiếu). */
  dismissRelink: () => void;

  // ---- Undo/redo (R1-050, R1-051): command pattern ----
  /** Số bước có thể hoàn tác / làm lại (reactive — dùng cho disabled nút). */
  undoDepth: number;
  redoDepth: number;
  /** Nhãn thao tác gần nhất (hiển thị trong tooltip). */
  undoLabel: string | null;
  redoLabel: string | null;
  /** Hoàn tác / làm lại 1 bước (khôi phục cả selection). */
  undo: () => void;
  redo: () => void;
  /**
   * Bắt đầu gộp các mutation tiếp theo thành 1 entry duy nhất.
   * Dùng khi kéo-thả trên timeline (chỉ push khi thả chuột).
   */
  beginHistoryGroup: (label: string) => void;
  /** Kết thúc gộp. Không push nếu không có thay đổi thực sự. */
  endHistoryGroup: () => void;
}

const emptySpec = (): VideoSpec => ({
  version: SPEC_VERSION,
  meta: { name: "Dự án mới", width: 1280, height: 720, fps: 30 },
  tracks: [],
});

export const useStore = create<EditorState>()((set, get) => {
  /** Đồng bộ depth/label của history vào React state (để nút undo/redo reactive). */
  const syncHistory = () => ({
    undoDepth: history.undoDepth,
    redoDepth: history.redoDepth,
    undoLabel: history.undoLabel,
    redoLabel: history.redoLabel,
  });

  /**
   * Thực thi 1 command lên spec hiện tại (R1-050).
   * nextSelection: undefined = giữ nguyên selection.
   */
  const execCommand = (cmd: SpecCommand, nextSelection?: Selection[]): void => {
    const st = get();
    const after = history.execute(cmd, st.spec, st.selection, nextSelection ?? st.selection);
    if (after === null) return; // apply() không thay đổi gì
    set({
      spec: after,
      ...(nextSelection !== undefined ? { selection: nextSelection } : {}),
      ...syncHistory(),
    });
  };

  /** Xoá history khi đổi project (không undo xuyên qua project khác). */
  const clearHistory = (): void => {
    history.clear();
    set(syncHistory());
  };

  return {
  spec: emptySpec(),
  media: [],
  playhead: 0,
  playing: false,
  pxPerSec: 60,
  selection: [],
  clipboardSize: 0,
  ready: false,
  missingAssets: null,
  rippleMode: false,
  undoDepth: 0,
  redoDepth: 0,
  undoLabel: null,
  redoLabel: null,

  toggleRipple: () => set((s) => ({ rippleMode: !s.rippleMode })),

  setPlayhead: (t) => {
    const d = get().duration();
    const fps = get().spec.meta.fps;
    // R1-055: playhead luôn snap về frame gần nhất
    set({ playhead: snapToFrame(clamp(t, 0, Math.max(d, 0.001)), fps) });
  },

  togglePlay: () => {
    const { playing, playhead, duration } = get();
    if (!playing && playhead >= duration() - 0.001) {
      set({ playhead: 0, playing: true }); // hết video -> phát lại từ đầu
    } else {
      set({ playing: !playing });
    }
  },

  stopPlayback: () => set({ playing: false, playhead: 0 }),

  setZoom: (px) => set({ pxPerSec: clamp(px, 8, 240) }),

  select: (sel) => set({ selection: sel ? [sel] : [] }),

  selectMany: (sels) => set({ selection: dedupeSelections(sels) }),

  addToSelection: (sel) =>
    set((s) => ({ selection: dedupeSelections([...s.selection, sel]) })),

  toggleSelect: (sel) =>
    set((s) => ({ selection: toggleSelection(s.selection, sel) })),

  clearSelection: () => set({ selection: [] }),

  setProjectName: (name) =>
    set((s) => ({ spec: { ...s.spec, meta: { ...s.spec.meta, name } } })),

  setMediaProxy: (mediaId, proxyUrl, proxyHeight) =>
    set((s) => ({
      media: s.media.map((m) =>
        m.id === mediaId ? { ...m, proxyUrl, proxyHeight } : m,
      ),
    })),

  importFiles: async (files) => {
    const items: MediaItem[] = [];
    for (const f of files) {
      try {
        const item = await fileToMediaItem(f);
        items.push(item);
      } catch {
        // file không hỗ trợ -> bỏ qua lặng lẽ (đã lọc ở accept của input)
      }
    }
    if (items.length === 0) return;
    set((s) => {
      // đảm bảo tên duy nhất để `src` trong spec luôn trỏ đúng media
      const names = new Set(s.media.map((m) => m.name));
      for (const it of items) {
        let n = it.name;
        let i = 1;
        while (names.has(n)) {
          const dot = it.name.lastIndexOf(".");
          n = dot > 0 ? `${it.name.slice(0, dot)} (${i})${it.name.slice(dot)}` : `${it.name} (${i})`;
          i += 1;
        }
        it.name = n;
        names.add(n);
      }
      return { media: [...s.media, ...items] };
    });
  },

  addTrack: (kind) => {
    const id = nextTrackId(kind);
    const labels: Record<TrackKind, string> = { video: "Video", audio: "Âm thanh", text: "Chữ", sticker: "Sticker", image: "Ảnh" };
    const count = get().spec.tracks.filter((t) => t.kind === kind).length + 1;
    const track: Track = { id, kind, label: `${labels[kind]} ${count}`, clips: [] };
    execCommand({
      label: `Thêm track ${labels[kind]}`,
      apply: (spec) => ({ ...spec, tracks: [...spec.tracks, track] }),
    });
    return id;
  },

  removeTrack: (trackId) => {
    const st = get();
    const track = st.spec.tracks.find((t) => t.id === trackId);
    if (!track) return;
    execCommand(
      {
        label: `Xoá track ${track.label ?? track.kind}`,
        apply: (spec) => ({ ...spec, tracks: spec.tracks.filter((t) => t.id !== trackId) }),
      },
      st.selection.filter((x) => x.trackId !== trackId),
    );
  },

  toggleTrackFlag: (trackId, flag) => {
    const track = get().spec.tracks.find((t) => t.id === trackId);
    if (!track) return;
    execCommand({
      label: "Đổi trạng thái track",
      apply: (spec) => ({
        ...spec,
        tracks: spec.tracks.map((t) => (t.id === trackId ? flipTrackFlag(t, flag) : t)),
      }),
    });
  },

  // Phase 7 P3: patchTrack — sửa thuộc tính track (hiện dùng cho volume).
  patchTrack: (trackId, patch) => {
    const st = get();
    const track = st.spec.tracks.find((t) => t.id === trackId);
    if (!track) return;
    if (isTrackLocked(track)) return; // track khóa → không sửa (giống patchClip)
    const rec = track as unknown as Record<string, unknown>;
    const prec = patch as unknown as Record<string, unknown>;
    const keys = Object.keys(patch);
    if (!keys.some((k) => rec[k] !== prec[k])) return; // không đổi → bỏ qua
    execCommand({
      label: keys.length === 1 && keys[0] === "volume" ? "Chỉnh âm lượng track" : "Chỉnh thuộc tính track",
      mergeKey: `patchTrack:${trackId}`,
      apply: (spec) => withTrack(spec, trackId, (t) => ({ ...t, ...patch })),
    });
  },

  addMediaToTrack: (mediaId, trackId, at) => {
    const { spec, media } = get();
    const item = media.find((m) => m.id === mediaId);
    const track = spec.tracks.find((t) => t.id === trackId);
    if (!item || !track) return;
    if (isTrackLocked(track)) return; // R1-054: track khóa không nhận thêm clip
    if (!mediaKindForTrack(track.kind).includes(item.kind)) return;

    const dur =
      item.kind === "image" ? IMAGE_CLIP_DEFAULT : Math.max(0.5, item.duration || 5);
    // R1-055: vị trí thả clip snap về frame
    const start = snapToFrame(Math.max(0, at), get().spec.meta.fps);
    if (overlaps(track, "", start, dur)) return; // không cho chồng clip

    let clip: Clip;
    if (track.kind === "audio") {
      const ac: AudioClip = {
        kind: "audio", id: uid("c"), src: item.name,
        start, duration: dur, in: 0, out: dur, volume: 1,
      };
      clip = ac;
    } else {
      const vc: VideoClip = {
        kind: "video", id: uid("c"), src: item.name,
        start, duration: dur, in: 0, out: dur, opacity: 1,
      };
      clip = vc;
    }
    execCommand(
      {
        label: `Thêm ${item.kind === "audio" ? "âm thanh" : "clip"} "${item.name}"`,
        apply: (s) => withTrack(s, trackId, (t) => ({ ...t, clips: [...t.clips, clip] })),
      },
      [{ trackId, clipId: clip.id }],
    );
  },

  addMediaAtPlayhead: (mediaId) => {
    const { spec, playhead } = get();
    const item = get().media.find((m) => m.id === mediaId);
    if (!item) return;
    const wantKind: TrackKind = item.kind === "audio" ? "audio" : "video";
    const dur = item.kind === "image" ? IMAGE_CLIP_DEFAULT : Math.max(0.5, item.duration || 5);
    const track = spec.tracks.find(
      (t) => t.kind === wantKind && !overlaps(t, "", playhead, dur),
    );
    // Gộp tạo track (nếu cần) + thêm clip thành 1 bước undo duy nhất.
    get().beginHistoryGroup("Thêm media vào timeline");
    try {
      let trackId = track?.id;
      if (!trackId) trackId = get().addTrack(wantKind);
      get().addMediaToTrack(mediaId, trackId, playhead);
    } finally {
      get().endHistoryGroup();
    }
  },

  addTextClip: (trackId) => {
    // Gộp tạo track (nếu cần) + thêm chữ thành 1 bước undo duy nhất.
    get().beginHistoryGroup("Thêm chữ");
    try {
      let tid = trackId;
      if (!tid) {
        const existing = get().spec.tracks.find((t) => t.kind === "text");
        tid = existing ? existing.id : get().addTrack("text");
      }
      // R1-054: không thêm chữ vào track khóa.
      if (isTrackLocked(get().spec.tracks.find((t) => t.id === tid))) return;
      const clip: TextClip = {
        kind: "text",
        id: uid("c"),
        text: "Nhập chữ…",
        start: get().playhead,
        duration: 3,
        style: {
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 64,
          color: "#ffffff",
          bold: true,
          x: 0.5,
          y: 0.5,
          animation: "fadeUp",
        },
      };
      execCommand(
        {
          label: "Thêm chữ",
          apply: (s) => withTrack(s, tid as string, (t) => ({ ...t, clips: [...t.clips, clip] })),
        },
        [{ trackId: tid as string, clipId: clip.id }],
      );
    } finally {
      get().endHistoryGroup();
    }
  },

  addCaptionTrack: (segments, opts) => {
    // Phase 7 P6: nếu caller cho biết clip nguồn, sinh câu phụ đề CÓ LINK
    // (captionOf) để trim/move/split clip nguồn tự kéo phụ đề theo.
    // Không có source (vd: import SRT tay) thì giữ hành vi cũ: chữ tự do.
    const style = { ...CAPTION_DEFAULT_STYLE, ...opts?.style };
    let clips: TextClip[] = segmentsToTextClips(segments, style, opts?.words);
    if (opts?.source) {
      const srcFound = findClip(get().spec, opts.source.trackId, opts.source.clipId);
      if (srcFound && isSourceClip(srcFound.clip)) {
        const wordsBySeg = opts?.words
          ? wordsForSegments(segments, opts.words)
          : undefined;
        const linked = linkSegmentsToClips(
          segments,
          srcFound.clip,
          style,
          wordsBySeg
        );
        // Nếu mọi câu đều nằm ngoài clip nguồn (vd: caption file khác) thì
        // giữ hành vi cũ thay vì tạo track rỗng.
        if (linked.length > 0) clips = linked;
      }
    }
    const id = nextTrackId("text");
    const count = get().spec.tracks.filter((t) => t.kind === "text").length + 1;
    // R1-080: track dịch có label riêng (vd: "Phụ đề (EN)"); tránh trùng label.
    let label = opts?.label ?? `${CAPTION_TRACK_LABEL} ${count}`;
    const taken = new Set(get().spec.tracks.map((t) => t.label));
    if (taken.has(label)) label = `${label} ${count}`;
    const track: Track = {
      id,
      kind: "text",
      label,
      clips,
    };
    const historyLabel = opts?.historyLabel ?? "Tạo phụ đề tự động";
    // Gộp tạo track + chèn toàn bộ câu thành 1 bước undo duy nhất.
    get().beginHistoryGroup(historyLabel);
    try {
      execCommand({
        label: historyLabel,
        apply: (s) => ({ ...s, tracks: [...s.tracks, track] }),
      });
    } finally {
      get().endHistoryGroup();
    }
    return id;
  },

  removeSilence: (trackId, clipId, silences) => {
    const oldSpec = get().spec;
    const res = removeSilenceFromClip(oldSpec, trackId, clipId, silences, (p) =>
      uid(p)
    );
    if (!res) return null;
    // Phase 8 Q3: caption bám theo sau khi cắt khoảng lặng (trước đây câu
    // link tới clip bị cắt bị bỏ rơi ở vị trí cũ).
    // - Câu link tới clip gốc được CHIA theo các đoạn giữ: đoạn giữ = clip
    //   trên track đích có id KHÔNG nằm trong track cũ (removeSilence cấp
    //   id mới cho mọi đoạn giữ); câu nằm gọn trong khoảng lặng bị cắt
    //   thì RỚT (không caption ma), câu cắt ngang khoảng lặng bị chẻ theo
    //   đoạn giữ (xem splitLinkedCaptionsMulti).
    // - Clip sau trên cùng track bị ripple trái → caption của chúng dịch
    //   theo qua shiftCaptionsForMovedClips (đoạn giữ là id mới nên bị
    //   bước shift bỏ qua đúng như ý; clip gốc đã biến mất cũng bị bỏ qua).
    const oldTrack = oldSpec.tracks.find((t) => t.id === trackId);
    const oldIds = new Set(oldTrack?.clips.map((c) => c.id) ?? []);
    const newTrack = res.spec.tracks.find((t) => t.id === trackId);
    // Đoạn giữ là clip nguồn (video/audio) nên lọc qua isSourceClip để
    // đúng kiểu SourceClip mà splitLinkedCaptionsInSpec yêu cầu.
    const pieces = (newTrack?.clips ?? [])
      .filter((c) => !oldIds.has(c.id))
      .filter(isSourceClip);
    let next = splitLinkedCaptionsInSpec(res.spec, clipId, pieces);
    next = shiftCaptionsForMovedClips(oldSpec, next);
    // 1 bước undo duy nhất cho toàn bộ thao tác cắt.
    get().beginHistoryGroup("Cắt khoảng lặng");
    try {
      execCommand({
        label: "Cắt khoảng lặng",
        apply: () => next,
      });
    } finally {
      get().endHistoryGroup();
    }
    return { cutCount: res.cutCount, removedTotal: res.removedTotal };
  },

  moveClip: (trackId, clipId, newStart) => {
    const found = findClip(get().spec, trackId, clipId);
    if (!found) return;
    if (isTrackLocked(found.track)) return; // R1-054
    // R1-055: vị trí di chuyển snap về frame gần nhất
    const start = snapToFrame(Math.max(0, newStart), get().spec.meta.fps);
    if (start === found.clip.start) return;
    if (overlaps(found.track, clipId, start, found.clip.duration)) return;
    execCommand({
      label: "Di chuyển clip",
      // Gộp theo thời gian để phòng khi caller quên begin/endHistoryGroup.
      mergeKey: `move:${trackId}:${clipId}`,
      apply: (spec) => {
        const moved = withTrack(spec, trackId, (t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? { ...c, start } : c)),
        }));
        const movedClip = findClip(moved, trackId, clipId)?.clip;
        if (!movedClip) return moved;
        // Phase 7 P6 (caption follow): user tự kéo chính câu phụ đề → hủy
        // link, câu thành chữ tự do; kéo clip nguồn → phụ đề bám theo.
        if (isLinkedCaption(movedClip)) return unlinkCaptionInSpec(moved, clipId);
        if (isSourceClip(movedClip)) return refollowCaptionsInSpec(moved, movedClip);
        return moved;
      },
    });
  },

  moveSelectionBy: (items, dxSec) => {
    if (items.length === 0 || dxSec === 0) return;
    const { spec } = get();
    const fps = spec.meta.fps;
    // R1-055: không di chuyển clip trên track khóa; R1-056: snap về frame
    const allowed = items.filter(
      (m) => !isTrackLocked(spec.tracks.find((t) => t.id === m.trackId)),
    );
    if (allowed.length === 0) return;
    execCommand({
      label: allowed.length > 1 ? `Di chuyển ${allowed.length} clip` : "Di chuyển clip",
      mergeKey: `movesel:${allowed.map((m) => m.clipId).sort().join(",")}`,
      apply: (s) => {
        let out = moveClipsBy(s, allowed, dxSec, (t) => snapToFrame(t, fps));
        // Phase 7 P6 (caption follow): clip được kéo trực tiếp mà là câu
        // phụ đề → hủy link trước; sau đó câu bám theo các clip nguồn vừa
        // kéo mới được tính lại (thứ tự này tránh kéo lại câu vừa hủy link).
        for (const m of allowed) {
          const c = findClip(out, m.trackId, m.clipId)?.clip;
          if (c && isLinkedCaption(c)) out = unlinkCaptionInSpec(out, m.clipId);
        }
        for (const m of allowed) {
          const c = findClip(out, m.trackId, m.clipId)?.clip;
          if (c && isSourceClip(c)) out = refollowCaptionsInSpec(out, c);
        }
        return out;
      },
    });
  },

  trimClip: (trackId, clipId, edge, deltaSec) => {
    const { spec, media } = get();
    const found = findClip(spec, trackId, clipId);
    if (!found) return;
    if (isTrackLocked(found.track)) return; // R1-054
    const { track, clip } = found;

    // Phase 9 đợt 16 H2: trim nested clip ngoài cùng — CHẶN RIÊNG trước
    // đường generic, vì đường generic không hiểu trim/speed của nested:
    // mép trái generic chỉ đổi {start, duration} mà không dời trim.in,
    // mép phải generic chỉ đổi duration mà không dời trim.out — cả hai
    // đều phá bất biến duration = (trim.out − trim.in) / speed. Nhánh
    // này tính đích theo đúng quy ước generic (snap frame, chặn nguồn,
    // chặn đè clip khác khi không ripple, ripple dồn clip sau) rồi gọi
    // trimNestedClipPure để dời trim; clip lá bên trong không đụng tới.
    // Trim trái không kiểm tra đè clip trước (giống đường generic).
    // Caption/karaoke: nested clip không phải source/linked caption nên
    // không có bước follow nào ở đây. Curve: nested CÓ thể mang
    // speedKeyframes (từ đợt 18) nên đích trim cho nested có curve
    // KHÔNG tính theo speed hằng mà theo ánh xạ τ của curve (đợt 21
    // T2, đóng nợ R2 đợt 20 §3) — xem hai nhánh dưới.
    const nestedForTrim = asNestedClipPure(clip);
    if (nestedForTrim) {
      if (edge === "left") {
        const trimIn = nestedForTrim.trim?.in ?? 0;
        // Đợt 21 T2 — đích τ cho nested có curve: mở rộng sang trái
        // (shift < 0) được hàm thuần R2 thực hiện bằng đoạn hằng v0 =
        // speedAt(curve, 0) (newIn = in + v0·shift), nên giới hạn mở
        // rộng là trimIn / v0 — KHÔNG phải trimIn / speed hằng (speed
        // hằng bị render bỏ qua khi có curve, spec §1.5). Cắt đầu
        // (shift > 0) thì newIn theo ∫ nên không cần cap riêng ngoài
        // floor duration của hàm thuần. Curve không tính được thì rơi
        // về đường speed hằng cũ và hàm thuần sẽ trả null → toast từ
        // chối như trước (không im lặng).
        const nestedCurveLeft = (nestedForTrim as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
        let v0Left: number | null = null;
        if (nestedCurveLeft && Array.isArray(nestedCurveLeft.keyframes) && nestedCurveLeft.keyframes.length > 0) {
          try {
            const v = speedAt(nestedCurveLeft, 0);
            if (Number.isFinite(v) && v > 0) v0Left = v;
          } catch {
            v0Left = null;
          }
        }
        if (v0Left !== null) {
          const maxShift = Math.min(clip.start, trimIn / v0Left);
          const minStart = clip.start - maxShift;
          const maxStart = clip.start + clip.duration - 0.2;
          const newStart = snapToFrame(clamp(clip.start + deltaSec, minStart, maxStart), spec.meta.fps);
          if (newStart === clip.start) return;
          const trimmed = trimNestedClipPure(nestedForTrim, "left", newStart);
          if (!trimmed) {
            notifyNestedSplitTrimRejection(clip, "trim", trackId, clipId);
            return;
          }
          execCommand({
            label: "Cắt clip",
            mergeKey: `trim:${trackId}:${clipId}`,
            apply: (s) => withTrack(s, trackId, (t) => ({
              ...t, clips: t.clips.map((c) => (c.id === clipId ? (trimmed as unknown as Clip) : c)),
            })),
          });
          return;
        }
        const speed = nestedForTrim.speed ?? 1;
        if (!Number.isFinite(speed) || speed <= 0) return;
        const maxShift = Math.min(clip.start, trimIn / speed);
        const minStart = clip.start - maxShift;
        const maxStart = clip.start + clip.duration - 0.2;
        const newStart = snapToFrame(clamp(clip.start + deltaSec, minStart, maxStart), spec.meta.fps);
        if (newStart === clip.start) return;
        const trimmed = trimNestedClipPure(nestedForTrim, "left", newStart);
        if (!trimmed) {
          // Đợt 19 G3: đích đã đổi thật mà hàm thuần vẫn null → báo đúng
          // thời điểm trim (notify tự cổng field + pre-field, no-op và
          // track khóa đã return trước đó nên không báo giả).
          notifyNestedSplitTrimRejection(clip, "trim", trackId, clipId);
          return;
        }
        execCommand({
          label: "Cắt clip",
          mergeKey: `trim:${trackId}:${clipId}`,
          apply: (s) => withTrack(s, trackId, (t) => ({
            ...t, clips: t.clips.map((c) => (c.id === clipId ? (trimmed as unknown as Clip) : c)),
          })),
        });
        return;
      }
      // edge === "right"
      const trimInR = nestedForTrim.trim?.in ?? 0;
      const sourceDuration = nestedForTrim.subSpec.tracks.reduce(
        (m, tr) => Math.max(m, ...tr.clips.map((c) => c.start + c.duration)),
        0,
      );
      // Đợt 21 T2 — cap τ cho nested có curve: duration tối đa là thời
      // gian output cần để tiêu thụ hết nguồn còn lại
      // (sourceDuration − trimIn) qua curve, tức đảo tích phân
      // outputDurationForSource — KHÔNG phải (sourceDuration − trimIn)
      // / speed hằng (đường cũ chặn/kẹp sai khi curve ≠ speed hằng, nợ
      // R2 đợt 20 §3). Hàm thuần R2 mở rộng mép phải bằng đoạn hằng
      // vLast = speedAt(curve, D) nên cap τ này khớp đúng hàm thuần:
      // speedAt kẹp ngoài keyframe cuối về vLast nên đảo tích phân trên
      // curve gốc cho đúng duration mở rộng đó. Curve không tính được
      // thì rơi về cap speed hằng cũ (hàm thuần sẽ trả null → toast).
      const nestedCurveRight = (nestedForTrim as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
      let tauCapRight: number | null = null;
      if (nestedCurveRight && Array.isArray(nestedCurveRight.keyframes) && nestedCurveRight.keyframes.length > 0) {
        try {
          const cap = outputDurationForSource(nestedCurveRight, sourceDuration - trimInR);
          if (Number.isFinite(cap) && cap > 0) tauCapRight = cap;
        } catch {
          tauCapRight = null;
        }
      }
      let newDur = Math.max(0.2, clip.duration + deltaSec);
      if (tauCapRight !== null) {
        newDur = Math.min(newDur, tauCapRight);
      } else {
        const speedR = nestedForTrim.speed ?? 1;
        if (!Number.isFinite(speedR) || speedR <= 0) return;
        newDur = Math.min(newDur, (sourceDuration - trimInR) / speedR);
      }
      newDur = Math.max(0.2, snapToFrameFloor(newDur, spec.meta.fps));
      if (newDur === clip.duration) return;
      const trimmedR = trimNestedClipPure(nestedForTrim, "right", newDur);
      if (!trimmedR) {
        // Đợt 19 G3: như nhánh trái — báo đúng thời điểm trim phải.
        notifyNestedSplitTrimRejection(clip, "trim", trackId, clipId);
        return;
      }
      const patchedR = trimmedR as unknown as Clip;
      const ripple = get().rippleMode;
      if (!ripple) {
        const end = clip.start + newDur;
        const blocked = track.clips.some(
          (c) => c.id !== clipId && c.start >= clip.start && c.start < end,
        );
        if (blocked) return;
        execCommand({
          label: "Cắt clip",
          mergeKey: `trim:${trackId}:${clipId}`,
          apply: (s) => withTrack(s, trackId, (t) => ({
            ...t, clips: t.clips.map((c) => (c.id === clipId ? patchedR : c)),
          })),
        });
        return;
      }
      execCommand({
        label: "Cắt clip (ripple)",
        mergeKey: `trim:${trackId}:${clipId}`,
        apply: (s) => {
          const foundNow = findClip(s, trackId, clipId);
          if (!foundNow) return s;
          const r = rippleTrimRight(s, trackId, clipId, patchedR);
          if (!r) return s;
          return r.spec;
        },
      });
      return;
    }

    // Phase 9 đợt 13 C5: speedKeyframes đi theo trim (keyframe t là thời
    // gian OUTPUT tính từ đầu clip). curveAdjFor tính trước từ clip hiện
    // tại (mỗi lần trimClip gọi lại đều đọc spec mới nhất nên kéo trim
    // liên tục vẫn đúng từng bước); applyTrimmedCurve áp vào spec trong
    // apply (apply phải pure — commands.ts khôi phục bằng snapshot nên
    // undo/redo không chạy lại apply, nhưng kéo trim gọi apply liên tục);
    // notifyTrimmedCurve báo cho user khi có điểm bị cắt (không lặng lẽ
    // mất). Toast đặt SAU execCommand, không trong apply, để mỗi lần gọi
    // trimClip làm rớt điểm chỉ báo đúng một lần.
    const curveAdjFor = (shift: number, newDuration: number): TrimmedSpeedKeyframes | null => {
      const curve = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
      if (!isSpeedable(clip) || !curve || curve.keyframes.length === 0) return null;
      return trimSpeedKeyframes(curve.keyframes, shift, newDuration);
    };
    const applyTrimmedCurve = (s: VideoSpec, adj: TrimmedSpeedKeyframes | null): VideoSpec => {
      if (!adj || !adj.changed) return s;
      return withTrack(s, trackId, (t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId
            ? {
                ...c,
                speedKeyframes:
                  adj.keyframes.length > 0 ? { keyframes: adj.keyframes } : undefined,
              }
            : c,
        ),
      }));
    };
    const notifyTrimmedCurve = (adj: TrimmedSpeedKeyframes | null): void => {
      if (adj && adj.dropped > 0) {
        pushToast(i18nT("speed.trimCurveDropped", { n: String(adj.dropped) }), "info");
      }
    };

    if (edge === "left") {
      const noIn = clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image";
      // Phase 9 đợt 14 R5: curve của clip đang trim (dùng cho cả giới
      // hạn mở rộng lẫn in theo ramp bên dưới; reverse + curve đã bị
      // validator cấm nên giữ đường tốc độ hằng cũ cho reverse).
      const trimCurve = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
      const hasRamp =
        !!trimCurve && trimCurve.keyframes.length > 0 && isSpeedable(clip) &&
        !(clip as { reverse?: boolean }).reverse;
      // R1-014: giới hạn theo speed (và reverse) — dùng maxTrimLeft thay vì so đơn vị lẫn lộn
      let maxShift = clip.start; // mặc định cho text/sticker/image
      if (!noIn && isSpeedable(clip)) {
        const item = media.find((m) => m.name === (clip as { src: string }).src);
        const mediaDur = item && item.kind !== "image" ? item.duration : Infinity;
        maxShift = Math.min(clip.start, maxTrimLeft(clip, mediaDur));
      }
      // Phase 9 đợt 14 R5: clip có curve mà mở rộng sang trái thì đoạn
      // mở thêm tiêu thụ nguồn với tốc độ keyframe đầu (clamp, giống
      // speedAt ngoài khoảng) nên giới hạn mở rộng = in / speedAt(0),
      // thay cho in / speed hằng của maxTrimLeft.
      if (hasRamp && !noIn) {
        const v0 = speedAt(trimCurve, 0);
        if (v0 > 0) {
          maxShift = Math.min(clip.start, (clip as { in: number }).in / v0);
        }
      }
      const minStart = clip.start - maxShift;
      const maxStart = clip.start + clip.duration - 0.2;
      // R1-055: mép trim snap về frame gần nhất
      const newStart = snapToFrame(clamp(clip.start + deltaSec, minStart, maxStart), spec.meta.fps);
      const shift = newStart - clip.start;
      if (shift === 0) return;
      // R1-013: dùng trimLeftTo — đúng với mọi speed/reverse
      let patch: Partial<Clip> =
        noIn || !isSpeedable(clip)
          ? { start: newStart, duration: clip.duration - shift }
          : trimLeftTo(clip, newStart);
      // Phase 9 đợt 14 R5: in sau trim trái của clip có curve phải theo
      // tích phân ramp (rampTrimLeftIn), không phải tốc độ hằng của
      // trimLeftTo — nếu không in lệch khỏi nguồn thực tế mà curve tiêu thụ.
      if (hasRamp && !noIn) {
        patch = { ...patch, in: rampTrimLeftIn((clip as { in: number }).in, trimCurve as SpeedCurve, shift) };
      }
      // Phase 9 đợt 13 C5: trim trái dịch gốc output → dịch keyframe t.
      const curveAdjLeft = curveAdjFor(shift, clip.duration - shift);
      execCommand({
        label: "Cắt clip",
        mergeKey: `trim:${trackId}:${clipId}`,
        apply: (spec) => {
          const trimmed = withTrack(spec, trackId, (t) => ({
            ...t, clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
          }));
          const tc = findClip(trimmed, trackId, clipId)?.clip;
          if (!tc) return trimmed;
          // Phase 9 R4: trim mép trái clip chữ có karaoke → dịch từ theo
          // shift (từ rớt khỏi đầu thì bỏ). Áp trước các bước P6 bên dưới
          // (unlink vẫn giữ karaoke đã dịch qua spread).
          let out = applyTrimmedCurve(trimmed, curveAdjLeft);
          if (tc.kind === "text" && tc.karaoke) {
            const adj = shiftKaraoke(tc.karaoke, shift);
            out = withTrack(out, trackId, (t) => ({
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId ? { ...c, karaoke: adj } : c
              ),
            }));
          }
          // Phase 7 P6 (caption follow): trim trực tiếp câu phụ đề → hủy
          // link; trim clip nguồn → phụ đề bám theo hình học mới.
          if (isLinkedCaption(tc)) return unlinkCaptionInSpec(out, clipId);
          if (isSourceClip(tc)) return refollowCaptionsInSpec(out, tc);
          return out;
        },
      });
      notifyTrimmedCurve(curveAdjLeft);
    } else {
      // Phase 9 đợt 14 R5: curve của clip đang trim (reverse + curve đã
      // bị validator cấm nên giữ đường tốc độ hằng cũ cho reverse).
      const trimCurveR = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
      const hasRampR =
        !!trimCurveR && trimCurveR.keyframes.length > 0 && isSpeedable(clip) &&
        !(clip as { reverse?: boolean }).reverse;
      let newDur = Math.max(0.2, clip.duration + deltaSec);
      if ((clip.kind === "video" || clip.kind === "audio") && isSpeedable(clip)) {
        const item = media.find((m) => m.name === clip.src);
        const mediaDur = item && item.kind !== "image" ? item.duration : Infinity;
        // R1-014: giới hạn duration theo speed/reverse — (mediaDur - in)/speed, không phải mediaDur - in
        newDur = Math.min(newDur, maxTrimRightDuration(clip, mediaDur));
        // Phase 9 đợt 14 R5: clip có curve thì chặn thêm bằng tích phân
        // ramp — duration output dài nhất mà in + ∫speed không vượt cuối
        // file nguồn (tốc độ hằng có thể ước lượng sai cả hai chiều).
        if (hasRampR && Number.isFinite(mediaDur) && mediaDur > (clip as { in: number }).in) {
          newDur = Math.min(
            newDur,
            outputDurationForSource(trimCurveR as SpeedCurve, mediaDur - (clip as { in: number }).in),
          );
        }
      }
      // R1-055: floor-snap để không bao giờ vượt giới hạn độ dài file nguồn
      newDur = Math.max(0.2, snapToFrameFloor(newDur, spec.meta.fps));
      const ripple = get().rippleMode;
      if (!ripple) {
        // không cho dài ra đè clip khác (ripple mode: clip sau tự dồn/đẩy nên không cần chặn)
        const end = clip.start + newDur;
        const blocked = track.clips.some(
          (c) => c.id !== clipId && c.start >= clip.start && c.start < end,
        );
        if (blocked) return;
      }
      // R1-013: dùng trimRightTo — đúng với mọi speed/reverse
      let patch: Partial<Clip> =
        clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image" || !isSpeedable(clip)
          ? { duration: newDur }
          : trimRightTo(clip, newDur);
      // Phase 9 đợt 14 R5: out sau trim phải của clip có curve theo tích
      // phân ramp (rampTrimRightOut), không phải tốc độ hằng của
      // trimRightTo. Áp cho cả nhánh ripple lẫn không ripple vì patch
      // được tính chung trước khi rẽ nhánh.
      if (hasRampR && isSpeedable(clip)) {
        patch = { ...patch, out: rampTrimRightOut((clip as { in: number }).in, trimCurveR as SpeedCurve, newDur) };
      }
      // Phase 9 đợt 13 C5: trim phải giữ gốc output → chỉ cắt keyframe
      // có t vượt duration mới (không dịch điểm còn lại).
      const curveAdjRight = curveAdjFor(0, newDur);
      if (ripple) {
        // R1-054: ripple trim — áp patch rồi dồn/đẩy các clip sau theo delta duration
        execCommand({
          label: "Cắt clip (ripple)",
          mergeKey: `trim:${trackId}:${clipId}`,
          apply: (spec) => {
            const foundNow = findClip(spec, trackId, clipId);
            if (!foundNow) return spec;
            const r = rippleTrimRight(spec, trackId, clipId, patchOne(foundNow.clip, patch));
            if (!r) return spec;
            // Phase 7 P6: câu của clip bị trim tính lại theo hình học mới;
            // câu của các clip bị dồn/đẩy chỉ dịch theo delta start.
            let out = r.spec;
            const tc = findClip(out, trackId, clipId)?.clip;
            out = applyTrimmedCurve(out, curveAdjRight);
            // Phase 9 R4: ripple trim mép phải clip chữ có karaoke → cắt từ
            // vượt duration mới (như nhánh không ripple).
            if (tc && tc.kind === "text" && tc.karaoke) {
              const adj = clampKaraoke(tc.karaoke, tc.duration);
              out = withTrack(out, trackId, (t) => ({
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId ? { ...c, karaoke: adj } : c
                ),
              }));
            }
            if (tc && isSourceClip(tc)) out = refollowCaptionsInSpec(out, tc);
            else if (tc && isLinkedCaption(tc)) out = unlinkCaptionInSpec(out, clipId);
            return shiftCaptionsForMovedClips(spec, out, new Set([clipId]));
          },
        });
        notifyTrimmedCurve(curveAdjRight);
      } else {
        execCommand({
          label: "Cắt clip",
          mergeKey: `trim:${trackId}:${clipId}`,
          apply: (spec) => {
            const trimmed = withTrack(spec, trackId, (t) => ({
              ...t, clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
            }));
            const tc = findClip(trimmed, trackId, clipId)?.clip;
            if (!tc) return trimmed;
            // Phase 9 R4: trim mép phải clip chữ có karaoke → cắt từ vượt
            // duration mới (từ rớt hẳn thì bỏ field).
            let out = applyTrimmedCurve(trimmed, curveAdjRight);
            if (tc.kind === "text" && tc.karaoke) {
              const adj = clampKaraoke(tc.karaoke, newDur);
              out = withTrack(out, trackId, (t) => ({
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId ? { ...c, karaoke: adj } : c
                ),
              }));
            }
            // Phase 7 P6 (caption follow) — như mép trái.
            if (isLinkedCaption(tc)) return unlinkCaptionInSpec(out, clipId);
            if (isSourceClip(tc)) return refollowCaptionsInSpec(out, tc);
            return out;
          },
        });
        notifyTrimmedCurve(curveAdjRight);
      }
    }
  },

  patchClip: (trackId, clipId, patch) => {
    // R1-054: track khóa không cho sửa thuộc tính clip (kể cả Inspector).
    const st = get();
    const track = st.spec.tracks.find((t) => t.id === trackId);
    if (isTrackLocked(track)) return 0;
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return 0;
    // Bỏ qua nếu không có field nào thực sự đổi (tránh entry rác khi slider đứng yên).
    const keys = Object.keys(patch) as (keyof Clip)[];
    const rec = clip as unknown as Record<string, unknown>;
    const prec = patch as unknown as Record<string, unknown>;
    if (!keys.some((k) => rec[k] !== prec[k])) return 0;
    const label =
      keys.length === 1 ? `Chỉnh ${patchLabel(keys[0])}` : "Chỉnh thuộc tính clip";
    // Phase 9 đợt 16 H3: lát cắt curve tính TRƯỚC exec (theo mẫu trimClip
    // đợt 13 C5: apply dùng đúng lát cắt này, không tính lại trong
    // apply) để patchClip báo được số keyframe bị cắt — toast + giá trị
    // trả về — theo mẫu NestedClipPanel đợt 15 T6: user thấy ngay là
    // đổi duration đã cắt keyframe khỏi curve và dùng Undo để khôi phục.
    // null = patch này không cắt curve (điều kiện T4 bên dưới).
    const patchCurveSlice = (() => {
      const patchRec = patch as unknown as Record<string, unknown>;
      const oldCurve = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
      const newDur = patchRec["duration"];
      if (
        !("speedKeyframes" in patch) &&
        oldCurve &&
        oldCurve.keyframes.length > 0 &&
        !(clip as { reverse?: boolean }).reverse &&
        patchRec["reverse"] !== true &&
        typeof newDur === "number" &&
        Number.isFinite(newDur) &&
        newDur > 0 &&
        newDur < clip.duration - 1e-9
      ) {
        return sliceSpeedKeyframes(oldCurve.keyframes, 0, newDur);
      }
      return null;
    })();
    // Phase 9 đợt 19 G2 — nested curve (spec đợt 18 §1.3/§2/§5), tính
    // TRIỂN VỌNG trước exec (mẫu H3: toast chỉ bắn sau exec, một lần,
    // không bắn lại khi undo/redo):
    //  - Xung đột hai tầng (ĐỢT 21 T2 ĐÃ NỚI theo luật render R1 đợt 20):
    //    patch đặt curve lên nested mà cây con đã có lá mang curve
    //    nay CHỈ bị từ chối khi cặp đó vi phạm R1 (curve không hợp lệ,
    //    reverse, attachment thời gian, lá phi-media, tốc độ hợp vượt
    //    [0.25, 4]) — kiểm tra bằng checkTwoLevelOuterCurvePure; cặp
    //    hợp lệ được cho qua vì render đã hợp thật. Lệnh bị từ chối vẫn
    //    return 0 trước exec, không đổi spec, không entry undo, toast
    //    nói rõ lý do cụ thể (key nested.curveTwoLevelInvalid).
    //  - Patch tự đặt trim tường minh cùng curve: so trim.out với
    //    in + ∫curve; lệch > 1e-4s thì render sẽ fail nên toast error
    //    sau exec (store KHÔNG tự sửa trim do user đặt tường minh).
    //  - Không đặt trim tường minh: apply sẽ tính lại trim.out theo
    //    tích phân (chế độ duration-cố-định); cờ overSource để toast
    //    khi out mới vượt độ dài nguồn con (đuôi có thể không có hình).
    // Đợt 20 R4: 3 câu toast G2 nay qua i18n (key nested.curve*,
    // đủ vi/en, theo mẫu nested.speedRejected của G3) — không còn
    // hardcode tiếng Việt ở đường patchClip này (reason chi tiết của
    // check hai tầng vẫn là chuỗi tiếng Việt, cùng tiền lệ reason của
    // action trim-cố-định vốn chỉ có tiếng Việt).
    type NestedG2Info =
      | { conflict: true; reason: string }
      | { mismatch: true; expectedOut: number; actualOut: number }
      | { overSource: true; expectedOut: number; sourceDuration: number }
      | null;
    const nestedG2: NestedG2Info = (() => {
      const patchRec2 = patch as unknown as Record<string, unknown>;
      const nestedOld = asNestedClipPure(clip);
      if (!nestedOld) return null;
      // Chỉ xét khi patch chạm curve/duration/trim: đổi start/text
      // không làm lệch tích phân nên không được toast thừa về trạng
      // thái vượt nguồn vốn đã có từ trước.
      if (!("speedKeyframes" in patch) && !("duration" in patch) && !("trim" in patch)) {
        return null;
      }
      const hasCurvePatch = "speedKeyframes" in patch;
      const patchCurve = patchRec2["speedKeyframes"] as SpeedCurve | undefined;
      if (hasCurvePatch && patchCurve && Array.isArray(patchCurve.keyframes) && patchCurve.keyframes.length > 0) {
        const check = checkTwoLevelOuterCurvePure(nestedOld, patchCurve);
        if (!check.ok) {
          return { conflict: true, reason: check.reason } as const;
        }
      }
      const oldCurve = (clip as { speedKeyframes?: SpeedCurve }).speedKeyframes;
      const finalCurve = hasCurvePatch
        ? patchCurve
        : patchCurveSlice
          ? { keyframes: patchCurveSlice.keyframes }
          : oldCurve;
      if (!finalCurve || !Array.isArray(finalCurve.keyframes) || finalCurve.keyframes.length === 0) {
        return null;
      }
      const finalDur =
        typeof patchRec2["duration"] === "number" && Number.isFinite(patchRec2["duration"])
          ? (patchRec2["duration"] as number)
          : clip.duration;
      const patchTrim = patchRec2["trim"] as { in?: number; out?: number } | undefined;
      const finalTrimIn =
        patchTrim && typeof patchTrim.in === "number" ? patchTrim.in : (nestedOld.trim?.in ?? 0);
      let expectedOut: number | null = null;
      try {
        const consumed = sourcePosAt(finalCurve, finalDur);
        if (Number.isFinite(consumed)) expectedOut = finalTrimIn + consumed;
      } catch {
        expectedOut = null;
      }
      if (expectedOut === null) return null;
      if (patchTrim && typeof patchTrim.out === "number") {
        const actualOut: number = patchTrim.out;
        return Math.abs(actualOut - expectedOut) > 1e-4
          ? { mismatch: true, expectedOut, actualOut } as const
          : null;
      }
      const sourceDuration = nestedOld.subSpec.tracks.reduce(
        (m, t) => Math.max(m, ...t.clips.map((c) => c.start + c.duration)),
        0,
      );
      return expectedOut > sourceDuration + 1e-9
        ? { overSource: true, expectedOut, sourceDuration } as const
        : null;
    })();
    if (nestedG2 && "conflict" in nestedG2) {
      const nestedName =
        (clip as unknown as { name?: string }).name ?? clip.id;
      pushToast(
        i18nT("nested.curveTwoLevelInvalid", { name: nestedName, reason: nestedG2.reason }),
        "error",
      );
      return 0;
    }
    execCommand({
      label,
      // Gộp các lần kéo slider liên tiếp thành 1 entry.
      mergeKey: `patch:${trackId}:${clipId}`,
      apply: (spec) => {
        const patched = withTrack(spec, trackId, (t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
        }));
        let pc = findClip(patched, trackId, clipId)?.clip;
        if (!pc) return patched;
        let out = patched;
        // Phase 9 đợt 15 T4 (đóng nợ đợt 13 C5 / đợt 14 R5): đổi duration
        // trực tiếp qua patchClip (không qua trimClip) thì curve phải đi
        // theo duration mới, thay vì giữ nguyên gây lệch như trước.
        // Ngữ nghĩa (curve theo thời gian OUTPUT của clip, không theo start):
        //  - Thu ngắn (newDur < oldDur): cắt curve về [0, newDur) bằng
        //    sliceSpeedKeyframes — chèn đúng điểm biên v = speedAt(newDur)
        //    nên nửa còn lại đánh giá đúng như curve gốc (không dùng
        //    trimSpeedKeyframes ở đây vì nó chỉ rớt điểm vượt biên mà không
        //    chèn điểm biên, làm sai nội suy trên đoạn cuối).
        //  - Kéo dài (newDur > oldDur): giữ nguyên curve — ngoài keyframe
        //    cuối tốc độ clamp về giá trị biên nên đánh giá vẫn đúng, và
        //    mọi keyframe cũ đều nằm trong [0, newDur] nên validator pass.
        //  - Patch tự đặt speedKeyframes: dùng curve của patch nguyên vẹn,
        //    không cắt thêm (người gọi đang thay curve, không phải trim).
        //  - Clip không có curve: không làm gì (tương thích ngược project
        //    cũ); clip reverse + curve: giữ đường cũ (validator cấm kết
        //    hợp này nên không nhận thêm hành vi mới ở đây).
        //  - Chỉ đổi start mà không đổi duration: curve không đổi (curve
        //    gắn với thời gian output, không gắn vị trí timeline).
        //  Lát cắt đã tính sẵn trước exec (patchCurveSlice, đợt 16 H3) —
        //  apply chỉ áp nó, không tính lại, để toast + giá trị trả về
        //  khớp đúng với curve đã ghi (mẫu trimClip đợt 13 C5).
        const patchRec = patch as unknown as Record<string, unknown>;
        if (patchCurveSlice) {
          out = withTrack(out, trackId, (t) => ({
            ...t,
            clips: t.clips.map((c) =>
              c.id === clipId
                ? { ...c, speedKeyframes: { keyframes: patchCurveSlice.keyframes } }
                : c,
            ),
          }));
          pc = findClip(out, trackId, clipId)?.clip ?? pc;
        }
        // Phase 9 đợt 16 H2: đổi duration trực tiếp của nested clip qua
        // patchClip (không qua trimClip) thì trim.out phải đi theo, nếu
        // không duration mới phá bất biến (trim.out − trim.in) / speed
        // đúng như lỗi trimClip cũ đã sửa ở trên. Chỉ áp khi patch đổi
        // duration mà KHÔNG tự đặt trim (patch tự đặt trim thì trim của
        // patch thắng); đổi speed không kèm duration được nhánh N3 ngay
        // dưới đây tính lại (đóng nợ LIMITS H2).
        const nestedForPatch = asNestedClipPure(pc);
        const patchDur = patchRec["duration"];
        // Đợt 19 G2: nhánh này (trim.out theo speed hằng) KHÔNG áp cho
        // nested đã mang curve — với curve thì render bỏ qua speed
        // hằng (spec §1.5) nên trim.out phải đi theo tích phân curve,
        // xem nhánh G2 ngay dưới (duration-cố-định).
        if (
          nestedForPatch &&
          !("trim" in patch) &&
          (pc as unknown as Record<string, unknown>)["speedKeyframes"] === undefined &&
          typeof patchDur === "number" &&
          Number.isFinite(patchDur) &&
          patchDur > 0 &&
          patchDur !== clip.duration
        ) {
          const pSpeed = nestedForPatch.speed ?? 1;
          const pTrimIn = (pc as unknown as { trim?: { in: number; out: number } }).trim?.in ?? 0;
          if (Number.isFinite(pSpeed) && pSpeed > 0) {
            out = withTrack(out, trackId, (t) => ({
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? { ...c, trim: { in: pTrimIn, out: pTrimIn + patchDur * pSpeed } }
                  : c,
              ),
            }));
            pc = findClip(out, trackId, clipId)?.clip ?? pc;
          }
        }
        // Phase 9 đợt 17 N3 (đóng nợ đợt 16 H2): patch đổi speed của
        // nested clip mà KHÔNG kèm duration thì duration phải tính lại
        // theo speed mới: duration = (trim.out − trim.in) / speed (trim
        // đã là giá trị mới sau patchOne — patch tự đặt trim thì trim
        // mới thắng, giống nhánh duration ở trên). Patch kèm duration
        // thì nhánh H2 ở trên đã xử lý (trim.out đi theo duration) nên
        // nhánh này bỏ qua. Speed ngoài [0.25, 4] hoặc nested đang mang
        // speedKeyframes thì giữ nguyên duration cũ, không tự kẹp/không
        // đoán — với curve thì render dùng curve và bỏ qua speed hằng
        // (spec đợt 18 §1.5; comment cũ ghi "render cấm" nay đã lỗi
        // thời, xem nestUtils header N3/G2).
        // Phase 9 đợt 19 G2 — nested có curve, chế độ duration-cố-định
        // (spec đợt 18 §2): giữ duration, tính lại trim.out := in +
        // ∫curve trên duration cuối (curve cuối = curve của patch, hoặc
        // lát cắt khi thu ngắn, hoặc curve cũ). Không áp khi patch tự
        // đặt trim (trim tường minh thắng — lệch tích phân khi đó được
        // báo bằng toast mismatch đã tính triển vọng trước exec, không
        // tự sửa). Nhánh này chạy sau H2/N3 nên trim speed-hằng (nếu có)
        // bị ghi đè đúng bằng trim tích phân; tính lũy thừa (idempotent)
        // nên undo/redo không làm lệch thêm.
        const nestedForSpeed = asNestedClipPure(pc);
        const patchSpeed = patchRec["speed"];
        if (
          nestedForSpeed &&
          !("duration" in patch) &&
          typeof patchSpeed === "number" &&
          Number.isFinite(patchSpeed) &&
          (pc as unknown as Record<string, unknown>)["speedKeyframes"] === undefined
        ) {
          const recomputed = applyNestedSpeedDurationPure(nestedForSpeed);
          if (recomputed) {
            out = withTrack(out, trackId, (t) => ({
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId ? (recomputed as unknown as Clip) : c,
              ),
            }));
            pc = findClip(out, trackId, clipId)?.clip ?? pc;
          }
        }
        // Đợt 19 G2 (tiếp): áp trim.out theo tích phân cho nested có curve.
        const nestedCurveForPatch = asNestedClipPure(pc);
        const finalCurveForPatch = (pc as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
        if (
          nestedCurveForPatch &&
          !("trim" in patch) &&
          finalCurveForPatch &&
          Array.isArray(finalCurveForPatch.keyframes) &&
          finalCurveForPatch.keyframes.length > 0
        ) {
          const expectedOut = nestedCurveExpectedOutPure(nestedCurveForPatch);
          if (expectedOut !== null) {
            const trimInForPatch = (
              pc as unknown as { trim?: { in: number; out: number } }
            ).trim?.in ?? 0;
            out = withTrack(out, trackId, (t) => ({
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? { ...c, trim: { in: trimInForPatch, out: expectedOut } }
                  : c,
              ),
            }));
            pc = findClip(out, trackId, clipId)?.clip ?? pc;
          }
        }
        // Phase 7 P6 (caption follow): đổi speed/reverse của clip nguồn →
        // phụ đề co/giãn/đảo theo; sửa start/duration của chính câu phụ đề
        // qua Inspector → hủy link (user tự định vị câu).
        if (isSourceClip(pc) && ("speed" in patch || "reverse" in patch)) {
          return refollowCaptionsInSpec(out, pc);
        }
        if (
          isLinkedCaption(pc) &&
          ("start" in patch || "duration" in patch)
        ) {
          return unlinkCaptionInSpec(out, clipId);
        }
        return out;
      },
    });
    // Phase 9 đợt 16 H3: báo rơi keyframe bằng toast SAU exec (như
    // trimClip: mỗi lần patch chỉ báo một lần, không báo lại khi undo/
    // redo vì apply không chạy lại) và trả về số lượng cho caller.
    if (patchCurveSlice && patchCurveSlice.dropped > 0) {
      pushToast(i18nT("speed.patchCurveDropped", { n: String(patchCurveSlice.dropped) }), "info");
    }
    // Đợt 19 G2: báo lệch tích phân / vượt nguồn SAU exec (đã tính triển
    // vọng ở nestedG2 — không báo lại khi undo/redo vì apply không toast).
    // Lệch trim tường minh = render sẽ fail nên là error; vượt nguồn chỉ
    // là cảnh báo đuôi (render vẫn qua §1.3) nên là info. Cả hai đều tới
    // được UI qua toast, không nuốt như curveDropped trước đợt 16.
    if (nestedG2 && "mismatch" in nestedG2) {
      const nestedName = (clip as unknown as { name?: string }).name ?? clip.id;
      const fmt = (x: number) => String(Math.round(x * 1000) / 1000);
      pushToast(
        i18nT("nested.curveIntegralMismatch", {
          name: nestedName,
          actualOut: fmt(nestedG2.actualOut),
          expectedOut: fmt(nestedG2.expectedOut),
        }),
        "error",
      );
    } else if (nestedG2 && "overSource" in nestedG2) {
      const nestedName = (clip as unknown as { name?: string }).name ?? clip.id;
      const fmt = (x: number) => String(Math.round(x * 1000) / 1000);
      pushToast(
        i18nT("nested.curveOverSource", {
          name: nestedName,
          expectedOut: fmt(nestedG2.expectedOut),
          sourceDuration: fmt(nestedG2.sourceDuration),
        }),
        "info",
      );
    }
    return patchCurveSlice?.dropped ?? 0;
  },

  patchTextStyle: (trackId, clipId, style) => {
    // R1-054: track khóa không cho kéo chữ trực tiếp trên preview.
    const st = get();
    const track = st.spec.tracks.find((t) => t.id === trackId);
    if (isTrackLocked(track)) return;
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip || clip.kind !== "text") return;
    const keys = Object.keys(style) as (keyof TextStyle)[];
    const rec = clip.style as unknown as Record<string, unknown>;
    const srec = style as unknown as Record<string, unknown>;
    if (!keys.some((k) => rec[k] !== srec[k])) return;
    execCommand({
      label: "Chỉnh chữ",
      mergeKey: `textstyle:${trackId}:${clipId}`,
      apply: (spec) => withTrack(spec, trackId, (t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId && c.kind === "text" ? { ...c, style: { ...c.style, ...style } } : c,
        ),
      })),
    });
  },

  splitAtPlayhead: () => {
    const { spec, playhead, selection } = get();
    // ưu tiên clip đang chọn (mục đầu tiên khi multi-select), nếu không thì clip trên cùng chứa playhead
    let target: { track: Track; clip: Clip } | null = null;
    const primary = primarySelection(selection);
    if (primary) {
      const f = findClip(spec, primary.trackId, primary.clipId);
      if (f && playhead > f.clip.start + 0.05 && playhead < f.clip.start + f.clip.duration - 0.05) {
        target = f;
      }
    }
    if (!target) {
      for (let i = spec.tracks.length - 1; i >= 0; i--) {
        const tr = spec.tracks[i];
        const c = tr.clips.find(
          (cl) => playhead > cl.start + 0.05 && playhead < cl.start + cl.duration - 0.05,
        );
        if (c) {
          target = { track: tr, clip: c };
          break;
        }
      }
    }
    if (!target) return false;
    if (isTrackLocked(target.track)) return false; // R1-054: không tách clip trên track khóa
    const { track, clip } = target;
    const pair = splitClipAt(clip, playhead);
    if (!pair) {
      // Đợt 19 G3: target đã qua cổng khóa + margin (xem phía trên) nên
      // pair null ở đây là thất bại tách thật — báo đúng thời điểm tách.
      // TopBar/App/Scene/Beat đều đi qua action này nên chỉ cần báo ở đây.
      notifyNestedSplitTrimRejection(clip, "split", track.id, clip.id);
      return false;
    }
    const [left, right] = pair;
    execCommand(
      {
        label: "Tách clip",
        apply: (spec) => {
          const split = withTrack(spec, track.id, (tr) => ({
            ...tr,
            clips: [...tr.clips.filter((c) => c.id !== clip.id), left, right],
          }));
          // Phase 9 đợt 15 T4: nửa mới ngắn hơn transition ngoài của nó thì
          // kẹp cả hai đầu của cặp (clip tách + clip kề) về duration của
          // nửa mới — nếu không cả cổng per-clip lẫn cổng ghép cặp của
          // validator đều bắt lỗi (xem lib/splitTransitions.ts). Biên trong
          // vốn đã là "none" nên không đụng tới. [left, right] truyền xuống
          // caption follow vẫn là bản trước kẹp vì kẹp không đổi id/start/
          // duration — chỉ đổi duration của field transition.
          const clamped = withTrack(split, track.id, (tr) => ({
            ...tr,
            clips: clampSplitOuterTransitions(tr.clips, left.id, right.id),
          }));
          // Phase 7 P6 (caption follow): tách clip nguồn → câu vắt qua
          // điểm cắt tách thành 2 theo từng nửa; tách trực tiếp câu phụ đề
          // → 2 nửa đều hủy link (user tự chia câu).
          if (isSourceClip(left) && isSourceClip(right)) {
            return splitLinkedCaptionsInSpec(clamped, clip.id, [left, right]);
          }
          if (isLinkedCaption(clip)) {
            return unlinkCaptionInSpec(
              unlinkCaptionInSpec(clamped, left.id),
              right.id,
            );
          }
          return clamped;
        },
      },
      [{ trackId: track.id, clipId: right.id }],
    );
    return true;
  },

  // Phase 9: marker trên timeline — lưu trong spec.markers (JSON thuần,
  // save/load giữ nguyên). Mỗi thao tác là 1 bước undo qua execCommand.
  addMarkerAtPlayhead: (label) => {
    const st = get();
    const time = st.playhead;
    if (!Number.isFinite(time) || time < 0) return null;
    const marker: Marker = {
      id: uid("m"),
      time,
      label: label ?? `Marker ${(st.spec.markers ?? []).length + 1}`,
    };
    const res = addMarkerToList(st.spec.markers ?? [], marker);
    if ("error" in res) return null;
    execCommand({
      label: "Thêm marker",
      apply: (spec) => ({ ...spec, markers: res.markers }),
    });
    return res.marker;
  },

  updateMarker: (id, patch) => {
    const st = get();
    const next = updateMarkerInList(st.spec.markers ?? [], id, patch);
    if (next === st.spec.markers) return;
    execCommand({
      label: "Sửa marker",
      apply: (spec) => ({ ...spec, markers: next }),
    });
  },

  deleteMarker: (id) => {
    const st = get();
    const next = removeMarkerFromList(st.spec.markers ?? [], id);
    if (next === st.spec.markers) return;
    execCommand({
      label: "Xoá marker",
      apply: (spec) => ({ ...spec, markers: next }),
    });
  },

  /**
   * R1-085: tách 1 clip tại NHIỀU thời điểm (timeline, giây) trong 1 bước undo.
   * Dùng cho scene detection: mỗi cảnh thành 1 clip riêng.
   * Trả về số điểm tách đã áp dụng (0 nếu không tách được điểm nào).
   */
  splitClipAtTimes: (trackId: string, clipId: string, times: number[]): number => {
    const st = get();
    const found = findClip(st.spec, trackId, clipId);
    if (!found) return 0;
    if (isTrackLocked(found.track)) return 0; // R1-054
    const sorted = [...times].sort((a, b) => a - b);
    let applied = 0;
    execCommand({
      label: `Tách cảnh (${sorted.length} điểm)`,
      apply: (spec) => {
        const orig = findClip(spec, trackId, clipId)?.clip;
        if (!orig) return spec;
        let pieces: Clip[] = [orig];
        for (const t of sorted) {
          let done = false;
          const next: Clip[] = [];
          for (const p of pieces) {
            if (!done) {
              const pair = splitClipAt(p, t);
              if (pair) {
                next.push(pair[0], pair[1]);
                applied++;
                done = true;
                continue;
              }
            }
            next.push(p);
          }
          pieces = next;
        }
        if (applied === 0) return spec;
        const replaced = withTrack(spec, trackId, (tr) => ({
          ...tr,
          clips: [...tr.clips.filter((c) => c.id !== clipId), ...pieces],
        }));
        // Phase 9 đợt 15 T4: như splitAtPlayhead — kẹp transition ngoài của
        // mảnh đầu/mảnh cuối (mảnh giữa vốn không mang transition ngoài).
        const clamped = withTrack(replaced, trackId, (tr) => ({
          ...tr,
          clips: clampSplitOuterTransitions(
            tr.clips,
            pieces[0].id,
            pieces[pieces.length - 1].id,
          ),
        }));
        // Phase 7 P6 (caption follow): tách clip nguồn tại nhiều điểm →
        // câu vắt qua nhiều mảnh tách theo từng mảnh; tách câu phụ đề →
        // mọi mảnh hủy link.
        if (pieces.every((p) => isSourceClip(p))) {
          return splitLinkedCaptionsInSpec(
            clamped,
            clipId,
            pieces as (VideoClip | AudioClip)[],
          );
        }
        if (isLinkedCaption(orig)) {
          let out = clamped;
          for (const p of pieces) out = unlinkCaptionInSpec(out, p.id);
          return out;
        }
        return clamped;
      },
    });
    if (applied === 0) {
      // Đợt 19 G3: tách nhiều điểm (Scene/Beat modal) — chỉ báo khi có
      // ít nhất 1 điểm nằm hẳn trong clip (qua margin của splitClipAt),
      // tức điểm đó đã được thử tách thật mà thất bại; điểm ngoài clip
      // vốn không tách được nên không báo giả. Notify tự cổng field.
      const attempted = sorted.some(
        (t) =>
          t > found.clip.start + 0.05 &&
          t < found.clip.start + found.clip.duration - 0.05,
      );
      if (attempted) {
        notifyNestedSplitTrimRejection(found.clip, "split", trackId, clipId);
      }
    }
    return applied;
  },

  // ---- Clipboard: copy/paste/duplicate (K2, Phase 6) ----
  copySelection: () => {
    const { spec, selection } = get();
    clipboard = copyClips(spec, selection);
    const n = clipboard ? clipboard.clips.length : 0;
    set({ clipboardSize: n });
    return n;
  },

  pasteClipboard: () => {
    if (!clipboard) return;
    const st = get();
    // Playhead đã snap về frame (R1-055); neo khối paste ở playhead.
    const at = snapToFrame(Math.max(0, st.playhead), st.spec.meta.fps);
    const result = pasteClips(st.spec, clipboard, at, () => uid("c"));
    if (!result) return;
    const n = result.pasted.length;
    execCommand(
      {
        label: n > 1 ? `Dán ${n} clip` : "Dán clip",
        apply: () => result.spec,
      },
      result.pasted,
    );
  },

  duplicateSelection: () => {
    const st = get();
    const result = duplicateClips(st.spec, st.selection, () => uid("c"));
    if (!result) return;
    const n = result.duplicated.length;
    execCommand(
      {
        label: n > 1 ? `Nhân bản ${n} clip` : "Nhân bản clip",
        apply: () => result.spec,
      },
      result.duplicated,
    );
  },

  // ---- Nested clip + adjustment layer (Phase 9 N4, UI only) ----
  nestSelection: (name) => {
    const st = get();
    const displayName =
      name?.trim() || `Compound clip ${listNestedClipsPure(st.spec).length + 1}`;
    const res = nestClipsPure(st.spec, st.selection, () => uid("c"), displayName);
    if ("error" in res) return false;
    execCommand(
      {
        label: `Gộp thành ${res.nested.name ?? "compound clip"}`,
        apply: () => res.spec,
      },
      [{ trackId: res.nestedTrackId, clipId: res.nested.id }],
    );
    return true;
  },

  unnestClip: (trackId, clipId) => {
    const res = unnestClipPure(get().spec, trackId, clipId, () => uid("c"));
    if ("error" in res) return false;
    execCommand(
      {
        label: "Rã compound clip",
        apply: () => res.spec,
      },
      [],
    );
    return true;
  },

  addAdjustmentLayer: (filterType, intensity, start, duration) => {
    const res = addAdjustmentLayerPure(get().spec, filterType, intensity, start, duration, () => uid("c"));
    if ("error" in res) return false;
    execCommand(
      {
        label: `Thêm adjustment layer (${filterType})`,
        apply: () => res.spec,
      },
      [{ trackId: res.hostTrackId, clipId: res.layer.id }],
    );
    return true;
  },

  deleteAdjustmentLayer: (trackId, clipId) => {
    const next = deleteAdjustmentLayerPure(get().spec, trackId, clipId);
    if (!next) return;
    const st = get();
    execCommand(
      {
        label: "Xoá adjustment layer",
        apply: () => next,
      },
      st.selection.filter((x) => x.clipId !== clipId),
    );
  },

  // ---- R5: tương tác hàng FX + sửa clip con (qua nestUtils, xem header R5) ----
  moveAdjustmentLayer: (trackId, clipId, newStart) => {
    const res = moveAdjustmentLayerPure(get().spec, trackId, clipId, newStart);
    if ("error" in res) return false;
    execCommand(
      {
        label: "Di chuyển adjustment layer",
        mergeKey: `fxmove:${trackId}:${clipId}`,
        apply: () => res.spec,
      },
      get().selection,
    );
    return true;
  },

  trimAdjustmentLayer: (trackId, clipId, edge, target) => {
    const res = trimAdjustmentLayerPure(get().spec, trackId, clipId, edge, target);
    if ("error" in res) return false;
    execCommand(
      {
        label: "Cắt adjustment layer",
        mergeKey: `fxtrim:${trackId}:${clipId}`,
        apply: () => res.spec,
      },
      get().selection,
    );
    return true;
  },

  updateAdjustmentLayer: (trackId, clipId, start, duration) => {
    const res = updateAdjustmentLayerPure(get().spec, trackId, clipId, start, duration);
    if ("error" in res) return false;
    execCommand(
      {
        label: "Sửa adjustment layer",
        apply: () => res.spec,
      },
      get().selection,
    );
    return true;
  },

  // ---- R7: layer chuẩn spec + boundary nested (qua nestUtils, xem header R7) ----
  addSpecAdjustmentLayer: (filterType, intensity, start, duration, scope) => {
    const res = addSpecAdjustmentLayerPure(
      get().spec,
      { filterType, intensity, start, duration, scope },
      () => uid("c"),
    );
    if ("error" in res) return false;
    execCommand(
      {
        label: `Thêm adjustment layer chuẩn (${filterType})`,
        apply: () => res.spec,
      },
      get().selection,
    );
    return true;
  },

  updateSpecAdjustmentLayer: (layerId, patch) => {
    const res = updateSpecAdjustmentLayerPure(get().spec, layerId, patch);
    if ("error" in res) return false;
    execCommand(
      {
        label: "Sửa adjustment layer chuẩn",
        apply: () => res.spec,
      },
      get().selection,
    );
    return true;
  },

  deleteSpecAdjustmentLayer: (layerId) => {
    const next = deleteSpecAdjustmentLayerPure(get().spec, layerId);
    if (!next) return;
    execCommand(
      {
        label: "Xoá adjustment layer chuẩn",
        apply: () => next,
      },
      get().selection,
    );
  },

  convertLegacyLayerToSpec: (trackId, clipId) => {
    // Giữ ngữ nghĩa legacy (chỉ áp track host): convert sang spec phải mang
    // scope = chỉ số track host, không phải "all" (parent tích hợp đợt 7).
    const hostIdx = get().spec.tracks.findIndex((t) => t.id === trackId);
    const scope = hostIdx >= 0 ? { trackIndices: [hostIdx] } : ("all" as const);
    const res = convertLegacyLayerToSpecPure(get().spec, trackId, clipId, scope, () => uid("c"));
    if ("error" in res) return false;
    execCommand(
      {
        label: "Chuyển adjustment layer sang chuẩn spec",
        apply: () => res.spec,
      },
      get().selection.filter((x) => x.clipId !== clipId),
    );
    return true;
  },

  setNestedClipBoundary: (hostTrackId, nestedId, patch) => {
    const res = setNestedClipBoundaryPure(get().spec, hostTrackId, nestedId, patch);
    if ("error" in res) return false;
    execCommand(
      {
        label: "Đặt transition/opacity cho nested clip",
        apply: () => res.spec,
      },
      get().selection,
    );
    return true;
  },

  updateNestedInnerClip: (hostTrackId, nestedId, innerTrackId, innerClipId, patch) => {
    // Phase 9 đợt 18 — guard nguồn của cha cho tầng 1 (R5), áp đúng ngữ
    // nghĩa guard của hàm deep đợt 17 N3 (updateNestedDeepInnerClip):
    // sửa clip con không được phá bất biến duration của cha. Cha là
    // nested clip ngoài cùng này (không phải tầng cha sâu hơn — R5 chỉ
    // sửa clip con trực tiếp). Độ dài nguồn = clip kết thúc muộn nhất
    // trên mọi track của subSpec cha (định nghĩa nestedSourceDuration
    // của spec, tính lại tại đây để không đụng nestUtils.ts):
    // - Cha ghi trim tường minh: chỉ cấm nguồn mới co dưới trim.out
    //   (nguồn dài thêm thì trim vẫn nằm trong nguồn, cha vẫn hợp lệ).
    // - Cha không ghi trim (= "phát toàn bộ", duration cha bằng đúng
    //   độ dài nguồn / speed): nguồn đổi theo hướng nào cũng lệch
    //   duration cha nên đều bị từ chối.
    // Guard tính TRIỂN VỌNG từ patch (chưa qua làm tròn 2 chữ số của
    // hàm thuần R5) rồi mới gọi hàm thuần: patch chỉ đổi text thì
    // newEnd bằng end cũ nên luôn qua; lookup thất bại thì bỏ qua
    // guard và để hàm thuần trả error như cũ. Bị chặn → trả ok:false
    // TRƯỚC execCommand nên spec không đổi và không sinh entry undo.
    const guardParent = (() => {
      const hostTrack = get().spec.tracks.find((t) => t.id === hostTrackId);
      const hostClip = hostTrack?.clips.find((c) => c.id === nestedId);
      return hostClip ? asNestedClipPure(hostClip) : null;
    })();
    if (guardParent) {
      const guardTrack = guardParent.subSpec.tracks.find((t) => t.id === innerTrackId);
      const guardInner = guardTrack?.clips.find((c) => c.id === innerClipId);
      if (guardTrack && guardInner) {
        const guardEps = 1e-9;
        const guardNewEnd =
          (patch.start ?? guardInner.start) + (patch.duration ?? guardInner.duration);
        let guardOldSource = 0;
        let guardNewSource = 0;
        for (const t of guardParent.subSpec.tracks) {
          for (const c of t.clips) {
            guardOldSource = Math.max(guardOldSource, c.start + c.duration);
            guardNewSource = Math.max(
              guardNewSource,
              t.id === innerTrackId && c.id === innerClipId ? guardNewEnd : c.start + c.duration,
            );
          }
        }
        if (guardParent.trim !== undefined) {
          if (guardParent.trim.out > guardNewSource + guardEps) {
            return { ok: false, curveDropped: 0 };
          }
        } else if (Math.abs(guardNewSource - guardOldSource) > guardEps) {
          return { ok: false, curveDropped: 0 };
        }
      }
    }
    const res = updateNestedInnerClipPure(get().spec, hostTrackId, nestedId, innerTrackId, innerClipId, patch);
    if ("error" in res) return { ok: false, curveDropped: 0 };
    execCommand(
      {
        label: "Sửa clip con trong compound clip",
        apply: () => res.spec,
      },
      get().selection,
    );
    return { ok: true, curveDropped: res.curveDropped ?? 0 };
  },

  updateNestedDeepInnerClip: (hostTrackId, topId, chainIds, innerTrackId, innerClipId, patch) => {
    const res = updateNestedDeepInnerClipPure(get().spec, hostTrackId, topId, chainIds, innerTrackId, innerClipId, patch);
    if ("error" in res) return { ok: false, curveDropped: 0 };
    execCommand(
      {
        label: "Sửa clip con sâu trong compound clip",
        apply: () => res.spec,
      },
      get().selection,
    );
    return { ok: true, curveDropped: res.curveDropped ?? 0 };
  },

  // Đợt 19 G2: chế độ trim-cố-định cho curve của nested clip (xem
  // interface). Fail-fast trước exec nên lệnh bị từ chối không đổi
  // spec và không sinh entry undo (mẫu guard đợt 18). reason trả về
  // để caller (panel tương lai) hiển thị được, không nuốt như
  // curveDropped trước đợt 16.
  // Đợt 21 T3: reason KHÔNG còn hardcode tiếng Việt — mỗi lần từ chối
  // trả kèm reasonKey (key i18n nested.fixedTrim*, đủ vi/en) và reason
  // là chuỗi đã dịch theo ngôn ngữ hiện tại (i18nT tại thời điểm gọi,
  // giống toast store). Caller cũ chỉ đọc reason (string) vẫn chạy y
  // nguyên; caller mới muốn tự dịch lại thì dùng reasonKey. Câu tiếng
  // Việt giữ đúng từng ký tự bản hardcode cũ (test khóa).
  patchNestedCurveFixedTrim: (trackId, clipId, curve) => {
    const track = get().spec.tracks.find((t) => t.id === trackId);
    if (isTrackLocked(track)) {
      return { ok: false, reason: i18nT("nested.fixedTrimLocked"), reasonKey: "nested.fixedTrimLocked" };
    }
    const clip = track?.clips.find((c) => c.id === clipId);
    const nested = clip ? asNestedClipPure(clip) : null;
    if (!nested) {
      return { ok: false, reason: i18nT("nested.fixedTrimNotNested"), reasonKey: "nested.fixedTrimNotNested" };
    }
    // Đợt 21 T2: nới như patchClip — chỉ từ chối khi cặp hai tầng vi
    // phạm luật render R1 (checkTwoLevelOuterCurvePure); cặp hợp lệ
    // được cho qua vì render đã hợp thật. reasonKey giữ nguyên key
    // của T3 (caller cũ vẫn nhận diện được loại từ chối), reason gắn
    // thêm lý do cụ thể của check để không nuốt thông tin.
    const twoLevelCheck = checkTwoLevelOuterCurvePure(nested, curve);
    if (!twoLevelCheck.ok) {
      return {
        ok: false,
        reason: `${i18nT("nested.fixedTrimTwoLevel")} ${twoLevelCheck.reason}`,
        reasonKey: "nested.fixedTrimTwoLevel",
      };
    }
    const next = applyNestedCurveFixedTrimPure(nested, curve);
    if (!next) {
      return {
        ok: false,
        reason: i18nT("nested.fixedTrimUncomputable"),
        reasonKey: "nested.fixedTrimUncomputable",
      };
    }
    execCommand(
      {
        label: "Đặt speed curve cho nested clip (giữ trim)",
        apply: (spec) =>
          withTrack(spec, trackId, (t) => ({
            ...t,
            clips: t.clips.map((c) => (c.id === clipId ? (next as unknown as Clip) : c)),
          })),
      },
      get().selection,
    );
    return { ok: true, duration: next.duration };
  },

  splitNestedDeepInnerClip: (hostTrackId, topId, chainIds, innerTrackId, innerClipId, splitTime) => {
    const res = splitNestedDeepInnerClipPure(get().spec, hostTrackId, topId, chainIds, innerTrackId, innerClipId, splitTime, () => uid("c"));
    if ("error" in res) return false;
    execCommand(
      {
        label: "Tách clip con sâu trong compound clip",
        apply: () => res.spec,
      },
      get().selection,
    );
    return true;
  },

  clearClipboard: () => {
    clipboard = null;
    set({ clipboardSize: 0 });
  },

  deleteSelection: () => {
    const { selection, rippleMode, spec } = get();
    if (selection.length === 0) return;
    // R1-055 (track controls): không xóa clip trên track khóa.
    const unlocked = selection.filter(
      (s) => !isTrackLocked(spec.tracks.find((t) => t.id === s.trackId)),
    );
    if (unlocked.length === 0) return;
    if (rippleMode) {
      // R1-054: ripple delete từng clip — dồn các clip sau lên trước, không để lại gap.
      execCommand({
        label: unlocked.length > 1 ? `Xoá ${unlocked.length} clip (ripple)` : "Xoá clip (ripple)",
        apply: (s) => {
          let cur = s;
          for (const x of unlocked) {
            const r = rippleDelete(cur, x.trackId, x.clipId);
            if (r) cur = r.spec;
          }
          // Phase 7 P6: câu bám theo các clip bị dồn dịch theo delta start;
          // câu của clip vừa bị xoá thành mồ côi (đứng yên, không bị xoá).
          return shiftCaptionsForMovedClips(s, cur);
        },
      }, []);
      return;
    }
    execCommand(
      {
        label: unlocked.length > 1 ? `Xoá ${unlocked.length} clip` : "Xoá clip",
        apply: (s) => deleteClips(s, unlocked).spec,
      },
      [],
    );
  },

  deleteClipRipple: (trackId, clipId) => {
    // R1-054 (track controls): không xóa clip trên track khóa.
    if (isTrackLocked(get().spec.tracks.find((t) => t.id === trackId))) return false;
    const found = findClip(get().spec, trackId, clipId);
    if (!found) return false;
    const st = get();
    execCommand(
      {
        label: "Xoá clip (ripple)",
        apply: (s) => {
          const r = rippleDelete(s, trackId, clipId);
          // Phase 7 P6: như deleteSelection ripple — dịch câu theo clip bị dồn.
          return r ? shiftCaptionsForMovedClips(s, r.spec) : s;
        },
      },
      st.selection.filter((x) => x.clipId !== clipId),
    );
    return true;
  },

  loadSample: async () => {
    if (sampleLoading) return;
    sampleLoading = true;
    const { spec, media } = await buildSampleProject();
    trackSeq = 10; // tránh trùng id track mẫu (v1, t1)
    clipboard = null; // K2: đổi project -> clipboard cũ không còn ý nghĩa
    set({
      spec,
      media,
      playhead: 0,
      playing: false,
      selection: [],
      ready: true,
      clipboardSize: 0,
    });
    clearHistory(); // đổi project -> không undo xuyên project
  },

  newProject: () => {
    trackSeq = 0;
    clipboard = null; // K2: đổi project -> clipboard cũ không còn ý nghĩa
    set({
      spec: emptySpec(),
      media: [],
      playhead: 0,
      playing: false,
      selection: [],
      ready: true,
      clipboardSize: 0,
    });
    clearHistory();
  },

  replaceProject: (spec) => {
    trackSeq = 100; // tránh trùng id khi thêm track mới sau khi mở file
    clipboard = null; // K2: đổi project -> clipboard cũ không còn ý nghĩa
    set({
      spec,
      media: [],
      playhead: 0,
      playing: false,
      selection: [],
      ready: true,
      missingAssets: null, // reset; caller gọi checkMissingMedia() sau
      clipboardSize: 0,
    });
    clearHistory();
  },

  duration: () => projectDuration(get().spec),

  // ---- Relink (R1-033) ----
  checkMissingMedia: () => {
    const { spec, media } = get();
    const names = new Set(media.map((m) => m.name));
    const missing = findMissingAssets(spec, names);
    set({ missingAssets: missing.length > 0 ? missing : null });
  },

  relinkMedia: async (oldSrc, file) => {
    // 1. Đọc + probe file user chọn (verify thật, không chỉ tin extension).
    let item: MediaItem;
    try {
      item = await fileToMediaItem(file);
    } catch {
      return { ok: false, message: `Không đọc được file "${file.name}" — định dạng không hỗ trợ.` };
    }
    // 2. Verify: video/audio phải có duration, ảnh phải có kích thước.
    const looksBroken =
      (item.kind === "video" && !(item.duration > 0)) ||
      (item.kind === "audio" && !(item.duration > 0)) ||
      (item.kind === "image" && !(item.width && item.height));
    if (looksBroken) {
      return {
        ok: false,
        message: `File "${file.name}" đọc được nhưng metadata rỗng (có thể file hỏng).`,
      };
    }
    // 3. Thêm vào media (tên duy nhất như importFiles) + cập nhật clip src.
    const { spec, media, missingAssets } = get();
    const names = new Set(media.map((m) => m.name));
    let n = item.name;
    let i = 1;
    const dot = item.name.lastIndexOf(".");
    while (names.has(n)) {
      n = dot > 0 ? `${item.name.slice(0, dot)} (${i})${item.name.slice(dot)}` : `${item.name} (${i})`;
      i += 1;
    }
    item.name = n;
    const { spec: next, updatedCount } = relinkAsset(spec, oldSrc, n);
    if (updatedCount === 0) {
      return { ok: false, message: `Không còn clip nào dùng "${oldSrc}".` };
    }
    const rest = (missingAssets ?? []).filter((m) => m.src !== oldSrc);
    // Ghi nhận đổi src clip vào history (undo được).
    execCommand({ label: "Relink media", apply: () => next });
    set({
      media: [...media, item],
      missingAssets: rest.length > 0 ? rest : null, // hết thiếu → tự đóng panel
    });
    return { ok: true, message: `Đã relink ${updatedCount} clip → "${n}".` };
  },

  dismissRelink: () => set({ missingAssets: null }),

  // ---- Undo/redo (R1-050, R1-051) ----
  undo: () => {
    const entry = history.undo();
    if (!entry) return;
    set({ spec: entry.before, selection: entry.selBefore, ...syncHistory() });
  },

  redo: () => {
    const entry = history.redo();
    if (!entry) return;
    set({ spec: entry.after, selection: entry.selAfter, ...syncHistory() });
  },

  beginHistoryGroup: (label) => {
    const st = get();
    history.beginGroup(label, st.spec, st.selection);
  },

  endHistoryGroup: () => {
    const st = get();
    const entry = history.endGroup(st.spec, st.selection);
    if (entry) set(syncHistory());
  },
  };
});
