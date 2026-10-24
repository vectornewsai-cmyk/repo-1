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
import {
  snapToFrame,
  snapToFrameFloor,
} from "@repo-1/video-spec";
import {
  CAPTION_DEFAULT_STYLE,
  CAPTION_TRACK_LABEL,
  segmentsToTextClips,
  type CaptionSegment,
} from "./lib/captions";
import {
  isLinkedCaption,
  isSourceClip,
  linkSegmentsToClips,
  refollowCaptionsInSpec,
  shiftCaptionsForMovedClips,
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
  if (clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image") {
    const left: Clip = { ...clip, duration: leftDur };
    const right: Clip = { ...clip, id: uid("c"), start: t, duration: rightDur };
    return [left, right];
  }
  if (clip.kind === "video") {
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
  patchClip: (trackId: string, clipId: string, patch: Partial<Clip>) => void;
  patchTextStyle: (trackId: string, clipId: string, style: Partial<TextStyle>) => void;
  splitAtPlayhead: () => boolean;
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
    let clips: TextClip[] = segmentsToTextClips(segments);
    if (opts?.source) {
      const srcFound = findClip(get().spec, opts.source.trackId, opts.source.clipId);
      if (srcFound && isSourceClip(srcFound.clip)) {
        const linked = linkSegmentsToClips(segments, srcFound.clip, CAPTION_DEFAULT_STYLE);
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
    const res = removeSilenceFromClip(get().spec, trackId, clipId, silences, (p) =>
      uid(p)
    );
    if (!res) return null;
    // 1 bước undo duy nhất cho toàn bộ thao tác cắt.
    get().beginHistoryGroup("Cắt khoảng lặng");
    try {
      execCommand({
        label: "Cắt khoảng lặng",
        apply: () => res.spec,
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

    if (edge === "left") {
      const noIn = clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image";
      // R1-014: giới hạn theo speed (và reverse) — dùng maxTrimLeft thay vì so đơn vị lẫn lộn
      let maxShift = clip.start; // mặc định cho text/sticker/image
      if (!noIn && isSpeedable(clip)) {
        const item = media.find((m) => m.name === (clip as { src: string }).src);
        const mediaDur = item && item.kind !== "image" ? item.duration : Infinity;
        maxShift = Math.min(clip.start, maxTrimLeft(clip, mediaDur));
      }
      const minStart = clip.start - maxShift;
      const maxStart = clip.start + clip.duration - 0.2;
      // R1-055: mép trim snap về frame gần nhất
      const newStart = snapToFrame(clamp(clip.start + deltaSec, minStart, maxStart), spec.meta.fps);
      const shift = newStart - clip.start;
      if (shift === 0) return;
      // R1-013: dùng trimLeftTo — đúng với mọi speed/reverse
      const patch: Partial<Clip> =
        noIn || !isSpeedable(clip)
          ? { start: newStart, duration: clip.duration - shift }
          : trimLeftTo(clip, newStart);
      execCommand({
        label: "Cắt clip",
        mergeKey: `trim:${trackId}:${clipId}`,
        apply: (spec) => {
          const trimmed = withTrack(spec, trackId, (t) => ({
            ...t, clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
          }));
          const tc = findClip(trimmed, trackId, clipId)?.clip;
          if (!tc) return trimmed;
          // Phase 7 P6 (caption follow): trim trực tiếp câu phụ đề → hủy
          // link; trim clip nguồn → phụ đề bám theo hình học mới.
          if (isLinkedCaption(tc)) return unlinkCaptionInSpec(trimmed, clipId);
          if (isSourceClip(tc)) return refollowCaptionsInSpec(trimmed, tc);
          return trimmed;
        },
      });
    } else {
      let newDur = Math.max(0.2, clip.duration + deltaSec);
      if ((clip.kind === "video" || clip.kind === "audio") && isSpeedable(clip)) {
        const item = media.find((m) => m.name === clip.src);
        const mediaDur = item && item.kind !== "image" ? item.duration : Infinity;
        // R1-014: giới hạn duration theo speed/reverse — (mediaDur - in)/speed, không phải mediaDur - in
        newDur = Math.min(newDur, maxTrimRightDuration(clip, mediaDur));
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
      const patch: Partial<Clip> =
        clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image" || !isSpeedable(clip)
          ? { duration: newDur }
          : trimRightTo(clip, newDur);
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
            if (tc && isSourceClip(tc)) out = refollowCaptionsInSpec(out, tc);
            else if (tc && isLinkedCaption(tc)) out = unlinkCaptionInSpec(out, clipId);
            return shiftCaptionsForMovedClips(spec, out, new Set([clipId]));
          },
        });
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
            // Phase 7 P6 (caption follow) — như mép trái.
            if (isLinkedCaption(tc)) return unlinkCaptionInSpec(trimmed, clipId);
            if (isSourceClip(tc)) return refollowCaptionsInSpec(trimmed, tc);
            return trimmed;
          },
        });
      }
    }
  },

  patchClip: (trackId, clipId, patch) => {
    // R1-054: track khóa không cho sửa thuộc tính clip (kể cả Inspector).
    const st = get();
    const track = st.spec.tracks.find((t) => t.id === trackId);
    if (isTrackLocked(track)) return;
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return;
    // Bỏ qua nếu không có field nào thực sự đổi (tránh entry rác khi slider đứng yên).
    const keys = Object.keys(patch) as (keyof Clip)[];
    const rec = clip as unknown as Record<string, unknown>;
    const prec = patch as unknown as Record<string, unknown>;
    if (!keys.some((k) => rec[k] !== prec[k])) return;
    const label =
      keys.length === 1 ? `Chỉnh ${patchLabel(keys[0])}` : "Chỉnh thuộc tính clip";
    execCommand({
      label,
      // Gộp các lần kéo slider liên tiếp thành 1 entry.
      mergeKey: `patch:${trackId}:${clipId}`,
      apply: (spec) => {
        const patched = withTrack(spec, trackId, (t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
        }));
        const pc = findClip(patched, trackId, clipId)?.clip;
        if (!pc) return patched;
        // Phase 7 P6 (caption follow): đổi speed/reverse của clip nguồn →
        // phụ đề co/giãn/đảo theo; sửa start/duration của chính câu phụ đề
        // qua Inspector → hủy link (user tự định vị câu).
        if (isSourceClip(pc) && ("speed" in patch || "reverse" in patch)) {
          return refollowCaptionsInSpec(patched, pc);
        }
        if (
          isLinkedCaption(pc) &&
          ("start" in patch || "duration" in patch)
        ) {
          return unlinkCaptionInSpec(patched, clipId);
        }
        return patched;
      },
    });
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
    if (!pair) return false;
    const [left, right] = pair;
    execCommand(
      {
        label: "Tách clip",
        apply: (spec) => {
          const split = withTrack(spec, track.id, (tr) => ({
            ...tr,
            clips: [...tr.clips.filter((c) => c.id !== clip.id), left, right],
          }));
          // Phase 7 P6 (caption follow): tách clip nguồn → câu vắt qua
          // điểm cắt tách thành 2 theo từng nửa; tách trực tiếp câu phụ đề
          // → 2 nửa đều hủy link (user tự chia câu).
          if (isSourceClip(left) && isSourceClip(right)) {
            return splitLinkedCaptionsInSpec(split, clip.id, [left, right]);
          }
          if (isLinkedCaption(clip)) {
            return unlinkCaptionInSpec(
              unlinkCaptionInSpec(split, left.id),
              right.id,
            );
          }
          return split;
        },
      },
      [{ trackId: track.id, clipId: right.id }],
    );
    return true;
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
        // Phase 7 P6 (caption follow): tách clip nguồn tại nhiều điểm →
        // câu vắt qua nhiều mảnh tách theo từng mảnh; tách câu phụ đề →
        // mọi mảnh hủy link.
        if (pieces.every((p) => isSourceClip(p))) {
          return splitLinkedCaptionsInSpec(
            replaced,
            clipId,
            pieces as (VideoClip | AudioClip)[],
          );
        }
        if (isLinkedCaption(orig)) {
          let out = replaced;
          for (const p of pieces) out = unlinkCaptionInSpec(out, p.id);
          return out;
        }
        return replaced;
      },
    });
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
