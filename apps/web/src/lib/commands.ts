/**
 * commands.ts — Command pattern + undo/redo cho editor (R1-050, R1-051).
 *
 * Mỗi thao tác trên timeline (thêm/di chuyển/cắt/xoá/tách clip, thêm/xoá
 * track, chỉnh thuộc tính...) là một `SpecCommand`:
 *   - `do()`  = `apply(before)` → trả về spec mới (pure, không mutate input).
 *   - `undo()` = khôi phục snapshot `before` đã lưu trong HistoryEntry.
 *
 * Vì mọi mutation trong store đều tạo object mới qua spread (không mutate
 * spec cũ), snapshot chỉ là tham chiếu — O(1), không deep clone, các cây
 * con không đổi được chia sẻ (structural sharing). Đổi lại, ĐÂY LÀ BẤT BIẾN
 * BẮT BUỘC: không code nào được mutate spec/clip/track tại chỗ, nếu không
 * history sẽ hỏng lặng lẽ.
 *
 * Hai cơ chế gộp:
 *  1. Group tường minh (beginGroup/endGroup): kéo-thả trên timeline gọi move/trim
 *     hàng chục lần — chỉ push 1 entry khi thả chuột.
 *  2. Gộp theo thời gian (mergeKey): slider trong Inspector bắn onChange
 *     liên tục — các execute cùng mergeKey trong MERGE_WINDOW_MS gộp lại.
 */
import type { VideoSpec } from "@repo-1/video-spec";

/** Snapshot selection — cấu trúc khớp Selection[] trong store.ts (tránh import vòng). */
export interface HistorySelection {
  trackId: string;
  clipId: string;
}
/** Selection là mảng (multi-select, R1-052). */
export type Sel = HistorySelection[];

/** Một thao tác trên spec. */
export interface SpecCommand {
  /** Nhãn hiển thị trên nút/tooltip hoàn tác, VD "Di chuyển clip". */
  label: string;
  /**
   * Key gộp theo thời gian. Các execute liên tiếp cùng mergeKey trong
   * MERGE_WINDOW_MS sẽ gộp thành 1 entry (dùng cho slider/spinner).
   * Không dùng khi đã có group tường minh.
   */
  mergeKey?: string;
  /** do(): biến đổi spec cũ thành spec mới. PURE — không mutate input. */
  apply: (spec: VideoSpec) => VideoSpec;
}

export interface HistoryEntry {
  label: string;
  mergeKey?: string;
  before: VideoSpec;
  after: VideoSpec;
  selBefore: Sel;
  selAfter: Sel;
  /** Thời điểm push (ms) — dùng cho gộp theo thời gian. */
  at: number;
}

/** Giới hạn độ sâu undo — tránh nuốt RAM với project lớn. */
export const MAX_HISTORY = 100;
/** Cửa sổ gộp các execute cùng mergeKey (ms). */
export const MERGE_WINDOW_MS = 800;

export class CommandStack {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private group: {
    label: string;
    before: VideoSpec;
    selBefore: Sel;
  } | null = null;
  private readonly mergeWindowMs: number;

  constructor(mergeWindowMs: number = MERGE_WINDOW_MS) {
    this.mergeWindowMs = mergeWindowMs;
  }

  get undoDepth(): number {
    return this.undoStack.length;
  }
  get redoDepth(): number {
    return this.redoStack.length;
  }
  get undoLabel(): string | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].label : null;
  }
  get redoLabel(): string | null {
    return this.redoStack.length > 0 ? this.redoStack[this.redoStack.length - 1].label : null;
  }
  get inGroup(): boolean {
    return this.group !== null;
  }

  /**
   * Bắt đầu gộp: mọi execute tiếp theo chỉ đổi spec, không push entry.
   * Group lồng nhau: giữ group ngoài cùng, bỏ qua begin thừa.
   */
  beginGroup(label: string, spec: VideoSpec, sel: Sel): void {
    if (this.group) return;
    this.group = { label, before: spec, selBefore: sel };
  }

  /**
   * Kết thúc gộp: push đúng 1 entry bao toàn bộ thay đổi trong group.
   * Trả về null nếu không có group hoặc không có thay đổi thực sự.
   */
  endGroup(spec: VideoSpec, sel: Sel): HistoryEntry | null {
    const g = this.group;
    this.group = null;
    if (!g) return null;
    if (g.before === spec) return null;
    return this.push({
      label: g.label,
      before: g.before,
      after: spec,
      selBefore: g.selBefore,
      selAfter: sel,
      at: Date.now(),
    });
  }

  /**
   * Thực thi command: after = cmd.apply(before).
   * Trả về spec mới, hoặc null nếu apply không thay đổi gì (trả về đúng ref cũ).
   * Trong group: chỉ trả về spec mới, việc push do endGroup lo.
   */
  execute(
    cmd: SpecCommand,
    before: VideoSpec,
    selBefore: Sel,
    selAfter: Sel,
  ): VideoSpec | null {
    const after = cmd.apply(before);
    if (after === before) return null;
    if (this.group) return after;
    const now = Date.now();
    const top = this.undoStack[this.undoStack.length - 1];
    if (
      cmd.mergeKey &&
      top &&
      top.mergeKey === cmd.mergeKey &&
      now - top.at < this.mergeWindowMs
    ) {
      // Gộp: giữ nguyên `before` gốc, cập nhật `after` mới nhất.
      top.after = after;
      top.selAfter = selAfter;
      top.at = now;
      return after;
    }
    this.push({
      label: cmd.label,
      mergeKey: cmd.mergeKey,
      before,
      after,
      selBefore,
      selAfter,
      at: now,
    });
    return after;
  }

  /** Hoàn tác 1 bước. Trả về entry để caller khôi phục spec/selection. */
  undo(): HistoryEntry | null {
    if (this.group) return null; // không undo giữa chừng khi đang kéo
    const e = this.undoStack.pop();
    if (!e) return null;
    this.redoStack.push(e);
    return e;
  }

  /** Làm lại 1 bước. */
  redo(): HistoryEntry | null {
    if (this.group) return null;
    const e = this.redoStack.pop();
    if (!e) return null;
    this.undoStack.push(e);
    return e;
  }

  /** Xoá toàn bộ history (đổi project / mở file mới). */
  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.group = null;
  }

  private push(e: HistoryEntry): HistoryEntry {
    this.undoStack.push(e);
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
    this.redoStack.length = 0;
    return e;
  }
}
