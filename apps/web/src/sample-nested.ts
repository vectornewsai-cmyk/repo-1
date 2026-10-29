/**
 * sample-nested.ts — Project mẫu chứng minh nested sequence (compound clip)
 * + adjustment layer ở tầng spec, dùng cho luồng N6 (Phase 9, đợt lớn),
 * VIẾT LẠI ở đợt 6 (R6, cron 20:03 25/10).
 *
 * THAY ĐỔI Ở ĐỢT 6 — ĐỌC KỸ TRƯỚC KHI DÙNG:
 * - ĐÃ XÓA `flattenNestedDemo` và `FlatSegment` (bản flatten tối thiểu do
 *   N6 tự viết ở đợt 5). Flatten có thẩm quyền duy nhất bây giờ là
 *   `flattenSpecForRender` trong `server/render/src/nested.js` (luồng N2),
 *   và được kiểm chứng bằng test đầu-cuối
 *   `server/render/src/test_nested_e2e.js` (đợt 6, dùng flatten thật +
 *   render thật qua `render.js`, không tự dựng lệnh FFmpeg nữa).
 * - File này chỉ còn giữ: (a) spec mẫu dạng compound/leaf để minh họa
 *   cấu trúc lồng nhau + adjustment, (b) `validateNestedDemo` /
 *   `adjustmentAppliesAt` / `compoundDuration` (logic thuần của riêng
 *   model demo, không phải flatten), và (c) `nestedDemoAsNestedSpec()` —
 *   hàm CHUYỂN ĐỔI DỮ LIỆU THUẦN (không tính flatten) từ spec mẫu sang
 *   đúng shape mà `nested.js` hiểu (track + clip kind "nested" +
 *   subSpec + trim), để test web kiểm tra shape đầu vào của flatten thật.
 *   Việc flatten vẫn do `nested.js` làm, ở phía server test.
 * - Adjustment layer trong demo mẫu (adj-1, 2→5s, hue=s=0) vẫn CHƯA nối
 *   vào render.js: render.js không đọc field adjustment, và N3 chỉ có
 *   hàm riêng + điểm nối ghi trong header `adjustment.js`. Đợt 6 KHÔNG
 *   claim render adjustment qua render.js — xem
 *   `docs/NESTED_ROUND6_LIMITS.md`. Bảng phẳng 4 đoạn có cắt tại biên
 *   adjustment của đợt 5 vì vậy KHÔNG còn xuất hiện trong test đợt 6:
 *   flatten thật của nested.js cho ra 3 clip (leaf-a 1→3, leaf-b1 3→4,
 *   leaf-b2 4→5), không cắt tại biên adjustment.
 * - Render.js tính tổng thời lượng bằng clip kết thúc muộn nhất
 *   (projectDuration), KHÔNG pad theo `duration` của spec mẫu. Vì vậy
 *   MP4 render từ demo này dài 5s (nested clip kết thúc ở 5s), không
 *   phải 6s như bản demo tay đợt 5 (bản đó tự dựng `-t 6` để có đuôi đen
 *   5→6s). Đừng claim 6s cho đường render qua render.js.
 *
 * Cấu trúc demo (thời gian tính bằng giây):
 *
 *   timeline 0 ─────── 1 ─────── 2 ─────── 3 ─────── 4 ─────── 5
 *   compound-outer:    [============= 4s =============]
 *     leaf-a:          [-- 2s --]
 *     compound-inner:              [----- 2s -----]
 *       leaf-b1:                   [- 1s -]
 *       leaf-b2:                            [- 1s -]
 *   adjustment adj-1 (chỉ minh họa, chưa nối render): [== 3s (2→5) ==]
 *
 * Nguồn media trong spec N2 (file thật do test E2E tự sinh bằng lavfi):
 *   "a.mp4" → testsrc2, "b.mp4" → màu xanh dương đặc,
 *   "c.mp4" → màu đỏ đặc. Spec mẫu dạng compound/leaf vẫn giữ mô tả
 *   lavfi cũ (`lavfi:testsrc2`...) chỉ để minh họa; hàm chuyển đổi map
 *   chúng sang tên file trên.
 */

export interface NestedLeafClip {
  kind: "leaf";
  id: string;
  /** Mô tả nguồn lavfi (minh họa), không phải đường dẫn file. */
  src: string;
  /** Vị trí bắt đầu trong sequence cha (giây). */
  start: number;
  /** Độ dài hiển thị (giây). */
  duration: number;
}

export interface NestedCompoundClip {
  kind: "compound";
  id: string;
  /** Vị trí bắt đầu trên timeline cha (giây). */
  start: number;
  /** Độ dài hiển thị (giây). */
  duration: number;
  children: NestedClip[];
}

export type NestedClip = NestedLeafClip | NestedCompoundClip;

export interface NestedAdjustmentLayer {
  id: string;
  /** Vị trí bắt đầu trên timeline chính (giây). */
  start: number;
  /** Độ dài áp dụng (giây). */
  duration: number;
  /**
   * Filter FFmpeg minh họa cho layer. Đợt 6: chỉ là mô tả, chưa nối
   * vào render.js (xem ghi chú đầu file).
   */
  filter: "hue=s=0";
}

export interface NestedDemoSpec {
  name: string;
  width: number;
  height: number;
  fps: number;
  /** Tổng thời lượng minh họa của timeline (gồm đuôi đen đợt 5, xem ghi chú). */
  duration: number;
  clips: NestedClip[];
  adjustments: NestedAdjustmentLayer[];
}

/** Project mẫu: 1 compound 2 cấp + 1 adjustment layer (minh họa). */
export const NESTED_DEMO_SPEC: NestedDemoSpec = {
  name: "nested-adjustment-demo",
  width: 640,
  height: 360,
  fps: 30,
  duration: 6,
  clips: [
    {
      kind: "compound",
      id: "compound-outer",
      start: 1,
      duration: 4,
      children: [
        { kind: "leaf", id: "leaf-a", src: "lavfi:testsrc2", start: 0, duration: 2 },
        {
          kind: "compound",
          id: "compound-inner",
          start: 2,
          duration: 2,
          children: [
            { kind: "leaf", id: "leaf-b1", src: "lavfi:color-blue", start: 0, duration: 1 },
            { kind: "leaf", id: "leaf-b2", src: "lavfi:color-red", start: 1, duration: 1 },
          ],
        },
      ],
    },
  ],
  adjustments: [{ id: "adj-1", start: 2, duration: 3, filter: "hue=s=0" }],
};

/** Kiểm tra cấu trúc spec: con không tràn khỏi cha, anh em không chồng nhau. */
export function validateNestedDemo(spec: NestedDemoSpec): string[] {
  const errors: string[] = [];
  if (!(spec.duration > 0)) errors.push("duration phải > 0");
  if (!(spec.width > 0 && spec.height > 0 && spec.fps > 0)) {
    errors.push("width/height/fps phải > 0");
  }
  const check = (clips: NestedClip[], parentEnd: number, where: string): void => {
    let prevEnd = 0;
    for (const clip of clips) {
      if (clip.start < 0) errors.push(`${where}/${clip.id}: start < 0`);
      if (!(clip.duration > 0)) errors.push(`${where}/${clip.id}: duration phải > 0`);
      if (clip.start < prevEnd) {
        errors.push(`${where}/${clip.id}: chồng lên clip anh em trước đó`);
      }
      if (clip.start + clip.duration > parentEnd + 1e-9) {
        errors.push(`${where}/${clip.id}: tràn khỏi sequence cha`);
      }
      prevEnd = clip.start + clip.duration;
      if (clip.kind === "compound") {
        check(clip.children, clip.duration, `${where}/${clip.id}`);
      }
    }
  };
  check(spec.clips, spec.duration, "timeline");
  for (const adj of spec.adjustments) {
    if (!(adj.duration > 0)) errors.push(`adjustment ${adj.id}: duration phải > 0`);
    if (adj.start + adj.duration > spec.duration + 1e-9) {
      errors.push(`adjustment ${adj.id}: tràn khỏi timeline`);
    }
  }
  return errors;
}

/** true khi thời điểm t nằm trong ít nhất một adjustment layer (minh họa). */
export function adjustmentAppliesAt(spec: NestedDemoSpec, t: number): boolean {
  return spec.adjustments.some((a) => t >= a.start && t < a.start + a.duration);
}

/** Độ dài khai báo của một compound (không tính con). */
export function compoundDuration(clip: NestedCompoundClip): number {
  return clip.duration;
}

// ---------------------------------------------------------------------------
// Chuyển đổi sang shape mà server/render/src/nested.js hiểu (đợt 6).
// Đây là chuyển đổi dữ liệu thuần, KHÔNG phải flatten: nó chỉ viết lại
// compound/leaf thành track + clip kind "nested" + subSpec + trim.
// Flatten thật do nested.js làm (kiểm chứng ở test_nested_e2e.js).
// ---------------------------------------------------------------------------

/** Clip ở dạng N2: đủ field để nested.js nhận dạng (kind, id, start, ...). */
export interface NestedSpecClip {
  kind: string;
  id: string;
  src?: string;
  start: number;
  duration: number;
  in?: number;
  out?: number;
  trim?: { in: number; out: number };
  subSpec?: NestedSpec;
}

export interface NestedSpecTrack {
  id: string;
  kind: string;
  clips: NestedSpecClip[];
}

export interface NestedSpec {
  version: string;
  meta: { name: string; width: number; height: number; fps: number };
  tracks: NestedSpecTrack[];
}

/** Map mô tả lavfi của spec mẫu sang file nguồn mà test E2E tự sinh. */
const DEMO_SRC_TO_FILE: Record<string, string> = {
  "lavfi:testsrc2": "a.mp4",
  "lavfi:color-blue": "b.mp4",
  "lavfi:color-red": "c.mp4",
};

/**
 * Chuyển NESTED_DEMO_SPEC sang spec dạng N2 (track + nested clip).
 * Kết quả kỳ vọng (test web kiểm tra từng field):
 * - track ngoài "v-out": 1 nested clip "compound-outer", start 1,
 *   duration 4, trim { in: 0, out: 4 }.
 * - subSpec track "sub-v": leaf-a (video, a.mp4, 0→2, in 0, out 2) và
 *   nested clip "compound-inner" (start 2, duration 2, trim 0→2).
 * - subSpec của compound-inner, track "inner-v": leaf-b1 (b.mp4, 0→1)
 *   và leaf-b2 (c.mp4, 1→2).
 * Adjustment adj-1 KHÔNG có trong spec N2 này vì render.js/nested.js
 * không đọc adjustment — việc này được ghi rõ, không giấu trong shape.
 */
export function nestedDemoAsNestedSpec(): NestedSpec {
  const meta = {
    name: "nested-adjustment-demo",
    width: 640,
    height: 360,
    fps: 30,
  };
  const leaf = (c: NestedLeafClip): NestedSpecClip => ({
    kind: "video",
    id: c.id,
    src: DEMO_SRC_TO_FILE[c.src] ?? c.src,
    start: c.start,
    duration: c.duration,
    in: 0,
    out: c.duration,
  });
  const inner: NestedSpec = {
    version: "0.2.0",
    meta,
    tracks: [
      {
        id: "inner-v",
        kind: "video",
        clips: [
          leaf({ kind: "leaf", id: "leaf-b1", src: "lavfi:color-blue", start: 0, duration: 1 }),
          leaf({ kind: "leaf", id: "leaf-b2", src: "lavfi:color-red", start: 1, duration: 1 }),
        ],
      },
    ],
  };
  const sub: NestedSpec = {
    version: "0.2.0",
    meta,
    tracks: [
      {
        id: "sub-v",
        kind: "video",
        clips: [
          leaf({ kind: "leaf", id: "leaf-a", src: "lavfi:testsrc2", start: 0, duration: 2 }),
          {
            kind: "nested",
            id: "compound-inner",
            start: 2,
            duration: 2,
            trim: { in: 0, out: 2 },
            subSpec: inner,
          },
        ],
      },
    ],
  };
  return {
    version: "0.2.0",
    meta,
    tracks: [
      {
        id: "v-out",
        kind: "video",
        clips: [
          {
            kind: "nested",
            id: "compound-outer",
            start: 1,
            duration: 4,
            trim: { in: 0, out: 4 },
            subSpec: sub,
          },
        ],
      },
    ],
  };
}
