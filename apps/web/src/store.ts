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

export interface Selection {
  trackId: string;
  clipId: string;
}

const IMAGE_CLIP_DEFAULT = 3; // ảnh thêm vào timeline dài mặc định 3s

let trackSeq = 0;
let sampleLoading = false;
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
  selection: Selection | null;
  ready: boolean;

  setPlayhead: (t: number) => void;
  togglePlay: () => void;
  stopPlayback: () => void;
  setZoom: (px: number) => void;
  select: (sel: Selection | null) => void;
  setProjectName: (name: string) => void;

  importFiles: (files: File[]) => Promise<void>;
  addTrack: (kind: TrackKind) => string;
  removeTrack: (trackId: string) => void;
  addMediaToTrack: (mediaId: string, trackId: string, at: number) => void;
  addMediaAtPlayhead: (mediaId: string) => void;
  addTextClip: (trackId?: string) => void;

  moveClip: (trackId: string, clipId: string, newStart: number) => void;
  /** deltaSec: dịch chuyển mép (dương = kéo sang phải). */
  trimClip: (trackId: string, clipId: string, edge: "left" | "right", deltaSec: number) => void;
  patchClip: (trackId: string, clipId: string, patch: Partial<Clip>) => void;
  patchTextStyle: (trackId: string, clipId: string, style: Partial<TextStyle>) => void;
  splitAtPlayhead: () => boolean;
  deleteSelection: () => void;

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
}

const emptySpec = (): VideoSpec => ({
  version: SPEC_VERSION,
  meta: { name: "Dự án mới", width: 1280, height: 720, fps: 30 },
  tracks: [],
});

export const useStore = create<EditorState>()((set, get) => ({
  spec: emptySpec(),
  media: [],
  playhead: 0,
  playing: false,
  pxPerSec: 60,
  selection: null,
  ready: false,
  missingAssets: null,

  setPlayhead: (t) => {
    const d = get().duration();
    set({ playhead: clamp(t, 0, Math.max(d, 0.001)) });
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

  select: (sel) => set({ selection: sel }),

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
    set((s) => ({ spec: { ...s.spec, tracks: [...s.spec.tracks, track] } }));
    return id;
  },

  removeTrack: (trackId) =>
    set((s) => {
      const spec = { ...s.spec, tracks: s.spec.tracks.filter((t) => t.id !== trackId) };
      const selection =
        s.selection?.trackId === trackId ? null : s.selection;
      return { spec, selection };
    }),

  addMediaToTrack: (mediaId, trackId, at) => {
    const { spec, media } = get();
    const item = media.find((m) => m.id === mediaId);
    const track = spec.tracks.find((t) => t.id === trackId);
    if (!item || !track) return;
    if (!mediaKindForTrack(track.kind).includes(item.kind)) return;

    const dur =
      item.kind === "image" ? IMAGE_CLIP_DEFAULT : Math.max(0.5, item.duration || 5);
    const start = Math.max(0, at);
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
    set((s) => ({
      spec: withTrack(s.spec, trackId, (t) => ({ ...t, clips: [...t.clips, clip] })),
      selection: { trackId, clipId: clip.id },
    }));
  },

  addMediaAtPlayhead: (mediaId) => {
    const { spec, playhead } = get();
    const item = get().media.find((m) => m.id === mediaId);
    if (!item) return;
    const wantKind: TrackKind = item.kind === "audio" ? "audio" : "video";
    let track = spec.tracks.find(
      (t) => t.kind === wantKind && !overlaps(t, "", playhead, item.kind === "image" ? IMAGE_CLIP_DEFAULT : Math.max(0.5, item.duration || 5)),
    );
    let trackId = track?.id;
    if (!trackId) trackId = get().addTrack(wantKind);
    get().addMediaToTrack(mediaId, trackId, playhead);
  },

  addTextClip: (trackId) => {
    let tid = trackId;
    if (!tid) {
      const existing = get().spec.tracks.find((t) => t.kind === "text");
      tid = existing ? existing.id : get().addTrack("text");
    }
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
    set((s) => ({
      spec: withTrack(s.spec, tid as string, (t) => ({ ...t, clips: [...t.clips, clip] })),
      selection: { trackId: tid as string, clipId: clip.id },
    }));
  },

  moveClip: (trackId, clipId, newStart) => {
    const found = findClip(get().spec, trackId, clipId);
    if (!found) return;
    const start = Math.max(0, newStart);
    if (overlaps(found.track, clipId, start, found.clip.duration)) return;
    set((s) => ({
      spec: withTrack(s.spec, trackId, (t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, start } : c)),
      })),
    }));
  },

  trimClip: (trackId, clipId, edge, deltaSec) => {
    const { spec, media } = get();
    const found = findClip(spec, trackId, clipId);
    if (!found) return;
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
      const newStart = clamp(clip.start + deltaSec, minStart, maxStart);
      const shift = newStart - clip.start;
      if (shift === 0) return;
      // R1-013: dùng trimLeftTo — đúng với mọi speed/reverse
      const patch: Partial<Clip> =
        noIn || !isSpeedable(clip)
          ? { start: newStart, duration: clip.duration - shift }
          : trimLeftTo(clip, newStart);
      set((s) => ({
        spec: withTrack(s.spec, trackId, (t) => ({
          ...t, clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
        })),
      }));
    } else {
      let newDur = Math.max(0.2, clip.duration + deltaSec);
      if ((clip.kind === "video" || clip.kind === "audio") && isSpeedable(clip)) {
        const item = media.find((m) => m.name === clip.src);
        const mediaDur = item && item.kind !== "image" ? item.duration : Infinity;
        // R1-014: giới hạn duration theo speed/reverse — (mediaDur - in)/speed, không phải mediaDur - in
        newDur = Math.min(newDur, maxTrimRightDuration(clip, mediaDur));
      }
      // không cho dài ra đè clip khác
      const end = clip.start + newDur;
      const blocked = track.clips.some(
        (c) => c.id !== clipId && c.start >= clip.start && c.start < end,
      );
      if (blocked) return;
      // R1-013: dùng trimRightTo — đúng với mọi speed/reverse
      const patch: Partial<Clip> =
        clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image" || !isSpeedable(clip)
          ? { duration: newDur }
          : trimRightTo(clip, newDur);
      set((s) => ({
        spec: withTrack(s.spec, trackId, (t) => ({
          ...t, clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
        })),
      }));
    }
  },

  patchClip: (trackId, clipId, patch) =>
    set((s) => ({
      spec: withTrack(s.spec, trackId, (t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? patchOne(c, patch) : c)),
      })),
    })),

  patchTextStyle: (trackId, clipId, style) =>
    set((s) => ({
      spec: withTrack(s.spec, trackId, (t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId && c.kind === "text" ? { ...c, style: { ...c.style, ...style } } : c,
        ),
      })),
    })),

  splitAtPlayhead: () => {
    const { spec, playhead, selection } = get();
    // ưu tiên clip đang chọn, nếu không thì clip trên cùng chứa playhead
    let target: { track: Track; clip: Clip } | null = null;
    if (selection) {
      const f = findClip(spec, selection.trackId, selection.clipId);
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
    const { track, clip } = target;
    const t = playhead;
    const leftDur = t - clip.start;
    const rightDur = clip.start + clip.duration - t;

    let left: Clip;
    let right: Clip;
    if (clip.kind === "text" || clip.kind === "sticker" || clip.kind === "image") {
      left = { ...clip, duration: leftDur };
      right = { ...clip, id: uid("c"), start: t, duration: rightDur };
    } else if (clip.kind === "video") {
      // R1-014: dùng splitSourceAt — điểm cắt nguồn đúng với mọi speed/reverse
      const cut = splitSourceAt(clip, t);
      const leftDuration = (cut.leftOut - cut.leftIn) / (clip.speed ?? 1);
      const rightDuration = (cut.rightOut - cut.rightIn) / (clip.speed ?? 1);
      left = {
        ...clip,
        duration: leftDuration,
        in: cut.leftIn,
        out: cut.leftOut,
        transitionOut: { type: "none", duration: 0 },
      };
      right = {
        ...clip,
        id: uid("c"),
        start: t,
        duration: rightDuration,
        in: cut.rightIn,
        out: cut.rightOut,
        transitionIn: { type: "none", duration: 0 },
      };
    } else if (clip.kind === "audio") {
      // audio: không có transition — R1-014: dùng splitSourceAt
      const cut = splitSourceAt(clip, t);
      const leftDuration = (cut.leftOut - cut.leftIn) / (clip.speed ?? 1);
      const rightDuration = (cut.rightOut - cut.rightIn) / (clip.speed ?? 1);
      left = { ...clip, duration: leftDuration, in: cut.leftIn, out: cut.leftOut };
      right = {
        ...clip,
        id: uid("c"),
        start: t,
        duration: rightDuration,
        in: cut.rightIn,
        out: cut.rightOut,
      };
    } else {
      // Không tới đây: text/sticker/image đã xử lý ở nhánh đầu,
      // video/audio đã xử lý ở hai nhánh trên.
      throw new Error(`splitClip: kind không hỗ trợ: ${(clip as Clip).kind}`);
    }
    set((s) => ({
      spec: withTrack(s.spec, track.id, (tr) => ({
        ...tr,
        clips: [...tr.clips.filter((c) => c.id !== clip.id), left, right],
      })),
      selection: { trackId: track.id, clipId: right.id },
    }));
    return true;
  },

  deleteSelection: () => {
    const { selection } = get();
    if (!selection) return;
    set((s) => ({
      spec: withTrack(s.spec, selection.trackId, (t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== selection.clipId),
      })),
      selection: null,
    }));
  },

  loadSample: async () => {
    if (sampleLoading) return;
    sampleLoading = true;
    const { spec, media } = await buildSampleProject();
    trackSeq = 10; // tránh trùng id track mẫu (v1, t1)
    set({
      spec,
      media,
      playhead: 0,
      playing: false,
      selection: null,
      ready: true,
    });
  },

  newProject: () =>
    set(() => {
      trackSeq = 0;
      return {
        spec: emptySpec(),
        media: [],
        playhead: 0,
        playing: false,
        selection: null,
        ready: true,
      };
    }),

  replaceProject: (spec) =>
    set(() => {
      trackSeq = 100; // tránh trùng id khi thêm track mới sau khi mở file
      return {
        spec,
        media: [],
        playhead: 0,
        playing: false,
        selection: null,
        ready: true,
        missingAssets: null, // reset; caller gọi checkMissingMedia() sau
      };
    }),

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
    set({
      media: [...media, item],
      spec: next,
      missingAssets: rest.length > 0 ? rest : null, // hết thiếu → tự đóng panel
    });
    return { ok: true, message: `Đã relink ${updatedCount} clip → "${n}".` };
  },

  dismissRelink: () => set({ missingAssets: null }),
}));
