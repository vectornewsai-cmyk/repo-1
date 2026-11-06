// discardRestore35R6.ts — Phân loại khôi phục project sau reload trang
// (Phase 9 đợt 35, luồng R6). KHÔNG sửa code sản phẩm: module thuần mới,
// chỉ dùng để phân tích + test, chưa nối vào App/store/preview.
//
// Bối cảnh đo được (đọc code, không suy đoán):
// - Autosave của VCut nằm ở localStorage, key `vcut-studio:autosave:v1`
//   (projectRepo.ts: AUTOSAVE_KEY, debounce 5 s, autosaveNow ghi ngay).
//   App.tsx lúc khởi động ưu tiên loadAutosave(), chỉ tải project mẫu
//   khi chưa có autosave — nên spec trong autosave SỐNG QUA reload.
// - Media bin (store.media) KHÔNG nằm trong autosave: replaceProject()
//   đặt `media: []`, rồi App gọi checkMissingMedia() → clip nào có src
//   không nằm trong media bin sẽ hiện panel Relink. Blob URL của media
//   mẫu / media import chỉ sống trong phiên (URL.createObjectURL).
// - AssetStore (IndexedDB `vcut-studio-assets`) giữ ĐƯỢC bytes blob qua
//   reload, NHƯNG không có code khởi động nào nạp lại media bin từ
//   IndexedDB (không có lời gọi AssetStore nào trong App.tsx / store.ts
//   / media.ts) — nên clip `asset:` vẫn bị coi là thiếu sau reload cho
//   tới khi có bước rehydrate (đây là nợ, xem LIMITS đợt này).
// - Trạng thái phiên KHÔNG nằm trong autosave: playhead, playing,
//   reversePlayback (store.ts khởi tạo playhead 0, playing false,
//   reversePlayback false), cache frame ngược / hold-frame / trạng thái
//   decode (biến module-level trong preview.tsx, reverseWebcodecs.ts).
//   Reload = mất toàn bộ nhóm này, dù project vẫn nguyên.
//
// Module này phân loại đúng 2 câu hỏi riêng biệt (đừng gộp):
//   (a) bytes của media có sống qua reload không?
//   (b) preview hiện tại có vẽ lại được clip đó ngay sau reload không?
// Với kiến trúc hiện tại, (b) = false cho mọi clip media-backed, kể cả
// khi (a) = true (trường hợp `asset:`), vì media bin rỗng sau reload.

/** Hình dạng của `src` của một clip media. */
export type ClipSrcKind =
  | "asset" // `asset:<id>` — blob trong IndexedDB (assetStore.ts)
  | "blob" // `blob:<origin>/...` — URL phiên, chết khi reload
  | "bare-name" // tên file thô, vd `mau-1.webm` — chỉ trỏ vào media bin
  | "http" // http(s)://... — sống nếu server còn phục vụ
  | "data" // data:... — nhúng trong spec, sống cùng spec
  | "other"; // dạng khác (đường dẫn tương đối lạ, chuỗi rỗng...)

/** Kết quả phân loại một `src`. */
export interface ClipSrcVerdict {
  kind: ClipSrcKind;
  /** Bytes của media có còn sau reload không (không tính media bin)? */
  bytesSurviveReload: boolean;
  /**
   * Preview hiện tại có vẽ lại được clip ngay sau reload không?
   * Với kiến trúc hiện tại: chỉ true khi src tự đủ (http còn phục vụ /
   * data nhúng). Mọi src cần media bin đều false vì media bin rỗng.
   */
  previewResolvesAfterReload: boolean;
  reason: string;
}

/**
 * Phân loại một `src`. Hàm thuần, không DOM, không đọc store — để
 * unit-test được và để probe trình duyệt đối chiếu với hành vi thật.
 */
export function classifyClipSrc(src: string): ClipSrcVerdict {
  const s = (src ?? "").trim();
  if (s.startsWith("asset:")) {
    return {
      kind: "asset",
      bytesSurviveReload: true,
      previewResolvesAfterReload: false,
      reason:
        "blob nằm trong IndexedDB nên sống qua reload, nhưng không có " +
        "code khởi động nào nạp lại media bin từ IndexedDB nên preview " +
        "vẫn coi clip là thiếu (cần rehydrate — nợ đợt này).",
    };
  }
  if (s.startsWith("blob:")) {
    return {
      kind: "blob",
      bytesSurviveReload: false,
      previewResolvesAfterReload: false,
      reason:
        "blob: URL chỉ có hiệu lực trong document đã tạo nó; reload tạo " +
        "document mới nên URL cũ chết, media phải import/regenerate lại.",
    };
  }
  if (/^https?:\/\//i.test(s)) {
    return {
      kind: "http",
      bytesSurviveReload: true,
      previewResolvesAfterReload: true,
      reason:
        "src trỏ ra server: sống qua reload miễn là server còn phục vụ URL đó.",
    };
  }
  if (s.startsWith("data:")) {
    return {
      kind: "data",
      bytesSurviveReload: true,
      previewResolvesAfterReload: true,
      reason:
        "dữ liệu nhúng trong spec nên sống cùng autosave (nhưng autosave " +
        "localStorage có trần ~5 MB — clip data: lớn có thể làm autosave lỗi).",
    };
  }
  if (s !== "" && !s.includes("://") && !s.startsWith("/")) {
    return {
      kind: "bare-name",
      bytesSurviveReload: false,
      previewResolvesAfterReload: false,
      reason:
        "tên file thô chỉ có nghĩa khi media bin của phiên hiện tại chứa " +
        "item cùng tên; media bin rỗng sau reload nên clip thành thiếu " +
        "(panel Relink) dù spec còn nguyên.",
    };
  }
  return {
    kind: "other",
    bytesSurviveReload: false,
    previewResolvesAfterReload: false,
    reason:
      "dạng src không nhận diện được: không tự đủ, cần media bin nên " +
      "không vẽ lại được ngay sau reload.",
  };
}

/** Hình dạng tối thiểu của spec mà module này cần (tương thích cấu trúc). */
export interface RestoreSpecLike {
  tracks?: Array<{
    clips?: Array<{ kind?: string; src?: string; text?: string }>;
  }>;
}

/** Trạng thái phiên mất sau reload — đối chiếu store.ts + preview.tsx. */
export const SESSION_STATE_LOST_AFTER_RELOAD: Array<{
  key: string;
  why: string;
}> = [
  {
    key: "playhead",
    why: "store khởi tạo playhead = 0; autosave chỉ lưu spec, không lưu playhead.",
  },
  {
    key: "playing",
    why: "store khởi tạo playing = false; reload luôn dừng ở trạng thái pause.",
  },
  {
    key: "reversePlayback",
    why: "store khởi tạo reversePlayback = false; chế độ phát ngược không bền qua reload.",
  },
  {
    key: "mediaBin",
    why: "replaceProject() đặt media = []; blob URL phiên cũ chết theo document cũ.",
  },
  {
    key: "reverseFrameCache",
    why: "cache frame ngược là biến module-level trong tiến trình trang cũ.",
  },
  {
    key: "holdFrame",
    why: "frame giữ là bitmap trong bộ nhớ tiến trình trang cũ.",
  },
  {
    key: "decodeState",
    why: "trạng thái decoder/seek của video element không sống qua document mới.",
  },
];

/** Tóm tắt khôi phục của một spec sau reload (mô phỏng bằng phân loại). */
export interface RestoreSummary {
  /** Tổng clip media (video/audio/image/sticker có src). */
  mediaClips: number;
  /** Số src distinct mà preview KHÔNG vẽ lại được ngay sau reload. */
  unresolvableAfterReload: number;
  /** Clip text (không cần media) — luôn sống cùng spec. */
  textClips: number;
  /** Số src theo từng kind. */
  byKind: Partial<Record<ClipSrcKind, number>>;
  /** src của các clip không vẽ lại được (để đối chiếu panel Relink). */
  unresolvableSrcs: string[];
  /** true khi toàn bộ clip media đều không vẽ lại được (media bin rỗng). */
  allMediaLost: boolean;
}

/**
 * Tóm tắt một spec: đếm clip theo kind và đối chiếu với media bin rỗng
 * sau reload (mediaNames = [] là trường hợp reload thật; truyền tên media
 * hiện có để mô phỏng trường hợp media đã được relink/import lại).
 */
export function summarizeRestore(
  spec: RestoreSpecLike,
  mediaNames: ReadonlySet<string> = new Set(),
): RestoreSummary {
  const byKind: Partial<Record<ClipSrcKind, number>> = {};
  const unresolvableSrcs: string[] = [];
  let mediaClips = 0;
  let unresolvableClipCount = 0;
  let textClips = 0;
  for (const track of spec.tracks ?? []) {
    for (const clip of track.clips ?? []) {
      if (clip.kind === "text") {
        textClips++;
        continue;
      }
      if (typeof clip.src !== "string") continue;
      mediaClips++;
      const v = classifyClipSrc(clip.src);
      byKind[v.kind] = (byKind[v.kind] ?? 0) + 1;
      // Sau reload, media bin rỗng trừ khi caller truyền tên media đã có.
      const resolves =
        v.previewResolvesAfterReload || mediaNames.has(clip.src);
      if (!resolves) {
        unresolvableClipCount++;
        if (!unresolvableSrcs.includes(clip.src)) {
          unresolvableSrcs.push(clip.src);
        }
      }
    }
  }
  unresolvableSrcs.sort();
  return {
    mediaClips,
    unresolvableAfterReload: unresolvableSrcs.length,
    textClips,
    byKind,
    unresolvableSrcs,
    allMediaLost: mediaClips > 0 &&
      unresolvableClipCount === mediaClips,
  };
}
