/**
 * splitTransitions.ts — Kẹp transition ngoài sau khi tách clip (Phase 9 đợt 15, luồng T4).
 *
 * BỐI CẢNH (nợ đợt 14 R5/§3: "split curve + transition chưa có test riêng"):
 * `splitClipAt` trong store.ts vốn đã giữ đúng VỊ TRÍ transition: nửa trái giữ
 * transitionIn cũ, nửa phải giữ transitionOut cũ, biên trong (left.transitionOut,
 * right.transitionIn) về "none". Nhưng nó không xử lý trường hợp nửa mới NGẮN
 * HƠN transition ngoài của nó — ví dụ clip 4s có transitionIn 0.5s, tách ở 0.3s
 * từ đầu → nửa trái chỉ 0.3s mà vẫn mang transitionIn 0.5s. Khi đó cả hai cổng
 * validator đều bắt lỗi và project coi như vỡ:
 *   - validateClip (server/render/src/validate.js): transitionIn/Out duration
 *     không được vượt duration của chính clip đó;
 *   - vòng ghép cặp transition phẳng: nếu cả hai đầu cùng khai thì duration
 *     phải bằng nhau, và T = max(outT, inT) không được vượt duration của đầu nào.
 * Chỉ kẹp phía clip tách thì chưa đủ (cặp vẫn lệch nhau); chỉ kẹp phía clip kề
 * thì clip tách vẫn vi phạm cổng per-clip. Vì vậy helper này kẹp CẢ HAI đầu
 * của cặp về cùng một giới hạn = duration của nửa mới, và chỉ kẹp xuống
 * (không bao giờ tăng duration, không sửa type, không chạm biên trong).
 *
 * Hàm thuần, không import runtime (chỉ type cấu trúc cục bộ) nên test chạy
 * trực tiếp dưới Node type-stripping mà không cần Vite/esbuild; store.ts dùng
 * đúng hàm này (không bản mirror) cho cả splitAtPlayhead và splitClipAtTimes.
 *
 * QUY ƯỚC:
 * - Kề nhau nghĩa là khớp thời gian trong EPS = 1e-6 (cùng EPS validator dùng
 *   cho kiểm tra kề nhau), không yêu cầu khớp tuyệt đối để chịu sai số float.
 * - Cặp một phía (chỉ một đầu khai transition): vẫn kẹp phía đã khai — cổng
 *   per-clip bắt phía đó dù phía kia không khai.
 * - Clip tách là clip đầu track (không có clip kề trước) hoặc clip cuối track:
 *   vẫn kẹp transition ngoài của chính nó; validator chỉ warn trường hợp
 *   transitionIn ở clip đầu track nhưng cổng per-clip vẫn bắt duration vượt.
 * - Không đụng tới clip nào ngoài 2 cặp ngoài của cặp tách (prev→left,
 *   right→next); project vốn đã sai ở cặp khác thì giữ nguyên sai đó, không
 *   "sửa hộ" ngoài phạm vi tách.
 * - Trả về mảng mới; clip không đổi giữ nguyên tham chiếu (store dùng spread
 *   nên history snapshot vẫn an toàn).
 */

/** Transition tối thiểu cần cho helper (khớp Transition của video-spec). */
export interface SplitTransitionLike {
  type: string;
  duration: number;
}

/** Clip tối thiểu cần cho helper (khớp phần transition/start/duration của Clip). */
export interface SplitClipLike {
  id: string;
  start: number;
  duration: number;
  transitionIn?: SplitTransitionLike;
  transitionOut?: SplitTransitionLike;
}

const EPS = 1e-6;

/**
 * Kẹp transition ngoài của cặp tách (left, right) về duration của từng nửa.
 * @param clips  toàn bộ clip trên track (thứ tự nào cũng được, không mutate).
 * @param leftId  id nửa trái vừa tách; rightId id nửa phải vừa tách.
 * @returns mảng clip mới (chỉ clone những clip bị kẹp).
 */
export function clampSplitOuterTransitions<T extends SplitClipLike>(
  clips: readonly T[],
  leftId: string,
  rightId: string,
): T[] {
  const left = clips.find((c) => c.id === leftId);
  const right = clips.find((c) => c.id === rightId);
  if (!left || !right || leftId === rightId) return [...clips];
  if (!(left.duration > 0) || !(right.duration > 0)) return [...clips];

  // Clip kề trước nửa trái: kết thúc đúng lúc nửa trái bắt đầu.
  const prev = clips.find(
    (c) => c.id !== left.id && Math.abs(c.start + c.duration - left.start) <= EPS,
  );
  // Clip kề sau nửa phải: bắt đầu đúng lúc nửa phải kết thúc.
  const next = clips.find(
    (c) =>
      c.id !== right.id &&
      Math.abs(c.start - (right.start + right.duration)) <= EPS,
  );

  // id -> clip đã kẹp (chỉ những clip thực sự đổi mới có mặt ở đây).
  const changed = new Map<string, T>();

  /**
   * Kẹp một cặp (first → second) về `limit`: mỗi phía đã khai transition
   * (type khác "none") mà duration vượt limit thì hạ xuống đúng limit.
   * Hai phía kẹp độc lập theo duration của chính nó nên cặp vốn bằng nhau
   * thì sau kẹp vẫn bằng nhau; cặp vốn đã lệch thì giữ nguyên độ lệch
   * (lỗi có sẵn trước khi tách, không phải việc của lần tách này).
   */
  const clampPair = (
    first: T | undefined,
    firstKey: "transitionOut",
    second: T | undefined,
    secondKey: "transitionIn",
    limit: number,
  ): void => {
    const sides: Array<[T, "transitionIn" | "transitionOut"]> = [];
    if (first) sides.push([first, firstKey]);
    if (second) sides.push([second, secondKey]);
    for (const [clip, key] of sides) {
      const tr = clip[key];
      if (!tr || tr.type === "none") continue;
      if (typeof tr.duration !== "number" || !(tr.duration > limit + 1e-9)) continue;
      const base = changed.get(clip.id) ?? clip;
      changed.set(clip.id, {
        ...base,
        [key]: { ...tr, duration: limit },
      } as T);
    }
  };

  // Cặp ngoài trái: prev.transitionOut → left.transitionIn, giới hạn = left.duration.
  clampPair(prev, "transitionOut", left, "transitionIn", left.duration);
  // Cặp ngoài phải: right.transitionOut → next.transitionIn, giới hạn = right.duration.
  clampPair(right, "transitionOut", next, "transitionIn", right.duration);

  if (changed.size === 0) return [...clips];
  return clips.map((c) => changed.get(c.id) ?? c);
}
